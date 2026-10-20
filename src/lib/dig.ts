import { XMLParser } from "fast-xml-parser";
import { cacheLife } from "next/cache";
import { getWire } from "@/lib/feeds";
import type { WireItem } from "@/lib/types";

// The Dig: scan primary sources for fresh records, then check whether any outlet in
// The Wire has covered them. Anything uncovered is a lead for the newsroom.
//
// Sources, verified live 2026-10-20:
// - OpenFEC (api.open.fec.gov/v1). Needs an api.data.gov key; DEMO_KEY allows only
//   ~40 calls/hour (shared per IP), so we make 2 calls per refresh and cache for hours.
//   Schedule E can only be sorted by expenditure_date, and filers sometimes typo the
//   year (2027-07-07), so we bound it with max_date=today and dedupe amendments.
// - Federal Register (federalregister.gov/api/v1). No key.
// - Congress: api.congress.gov /v3/bill (same api.data.gov key, 1 call per refresh)
//   and the Senate roll-call XML menu at senate.gov (no key). The congress.gov
//   /house-vote list isn't sortable by date, so House votes are skipped.
// - CourtListener v4 search (no key). Anonymous search is slow (12-20s), so it
//   gets a longer timeout than the other sources.
//
// Every source returns [] on failure, and failures are cached briefly so a rate
// limit or outage is retried in 15 minutes instead of hours.

export interface Lead {
  id: string;
  source: "FEC" | "Federal Register" | "Congress" | "Courts";
  kind: string; // e.g. "Independent expenditure", "Executive order"
  title: string; // plain-English, specific, includes the number/name
  detail: string; // 1-2 sentences of what the record shows (only what the record says)
  url: string; // link to the primary record
  date: string | null; // ISO
  amount?: number; // dollars when relevant
  entities: string[]; // names/places to match against coverage
  coveredBy: { outlet: string; title: string; url: string }[]; // wire items that appear to cover it
  novelty: number; // 0-1, 1 = no outlet in our wire mentions these entities together
  score: number; // newsworthiness, see scoreLead()
}

/**
 * A lead before the coverage check. Two matching modes:
 * - "entity" (FEC, courts): `keys` are names (a wire item must mention one),
 *   `specifics` pin the story down (key + specific = clearly covered), `topics` are
 *   looser words (key + topic = probably covered).
 * - "words" (rules, bills, votes, whose only handle is their title): `keys` are the
 *   title's distinctive words; a wire item must share 2+ of them (a kind word like
 *   "executive order" in `topics` can stand in for one).
 */
interface Draft extends Omit<Lead, "coveredBy" | "novelty" | "score"> {
  match: "entity" | "words";
  keys: string[];
  specifics: string[];
  topics: string[];
  size: number; // 0-1, how big the record is on its own terms
  relevance: number; // 0-1, how much it bears on the midterms
}

const DAY = 86_400_000;
const TIMEOUT = 10_000;
const API_KEY = () => process.env.DATA_GOV_API_KEY?.trim() || "DEMO_KEY";
const UA = "Mozilla/5.0 (compatible; RockLeakDig/0.1; +https://github.com/JuniorSua/rockleak)";

type Json = Record<string, unknown>;

/** Short retry window for a failed source so we don't cache an outage for an hour. */
function cacheFailure() {
  cacheLife({ stale: 60, revalidate: 900, expire: 3600 });
}

async function getJson(url: string, timeout = TIMEOUT): Promise<Json | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(timeout) });
    // A mistyped DATA_GOV_API_KEY shouldn't blank the FEC and Congress leads: retry once on the shared demo key.
    if (res.status === 403 && url.includes("api_key=") && !url.includes("api_key=DEMO_KEY")) {
      const demo = url.replace(/api_key=[^&]*/, "api_key=DEMO_KEY");
      if ((await res.text()).includes("API_KEY_INVALID")) return getJson(demo, timeout);
    }
    return res.ok ? ((await res.json()) as Json) : null;
  } catch {
    return null;
  }
}

async function getText(url: string, timeout = TIMEOUT): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(timeout) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

// --- Formatting ----------------------------------------------------------------

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number.parseFloat(str(v)) || 0);
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const article = (noun: string) => `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
/** Names ending in "Inc." shouldn't leave "Inc.." at the end of a sentence. */
const tidy = (s: string) => s.replace(/([^.])\.\.(?!\.)/g, "$1.").replace(/\s+/g, " ").trim();

function money(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

function shortDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const UPPER = new Set("PAC PACS LLC LP LLP USA US U.S. II III IV NC DC AFL-CIO CIO SEIU NRA NRSC NRCC DSCC DCCC RNC DNC GOP SMP CLF HMP AIPAC UDP SLF MAGA A16Z ACLU NAACP FBI DOJ ICE".split(" "));
const LOWER = new Set("of for the and a an to in on at by with or".split(" "));

/** "LONE STAR LIBERTY PAC" -> "Lone Star Liberty PAC". Leaves mixed-case text alone. */
function titleCase(s: string) {
  const letters = s.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (letters.length && upper / letters.length < 0.7) return s.replace(/\s+/g, " ").trim();
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w, i) => {
      if (UPPER.has(w.toUpperCase())) return w.toUpperCase();
      if (i > 0 && LOWER.has(w)) return w;
      return w.replace(/(^|[-'(/.])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
    })
    .join(" ")
    .replace(/'S\b/g, "'s")
    .replace(/\bV\. /g, "v. ")
    .replace(/\bSuperpac\b/g, "SuperPAC")
    .replace(/\bInc\.?$/, "Inc.")
    .replace(/\bMc([a-z])/g, (_, c: string) => `Mc${c.toUpperCase()}`);
}

/** "TALARICO, JAMES" -> { full: "James Talarico", last: "Talarico" } */
function personName(raw: string) {
  const [last, first = ""] = raw.split(",").map((p) => titleCase(p.trim()));
  const firstClean = first.replace(/\b(Mr|Mrs|Ms|Dr|Hon)\.?\s*/g, "").trim();
  return { full: [firstClean, last].filter(Boolean).join(" "), last };
}

const STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

// 2026 Senate battlegrounds (mirrors the races tracked in markets.ts, plus OH/MN/NE).
const BATTLEGROUND = new Set(["ME", "NC", "MI", "TX", "GA", "IA", "AK", "NH", "OH", "MN", "NE"]);

// Candidates and members whose names in a court docket would be news. Full names only:
// surnames alone ("Brown", "Collins") match thousands of unrelated dockets.
const WATCHLIST = [
  "Ken Paxton", "James Talarico", "John Cornyn", "Susan Collins", "Janet Mills", "Graham Platner",
  "Abdul El-Sayed", "Haley Stevens", "Mallory McMorrow", "Roy Cooper", "Michael Whatley", "Jon Husted",
  "Sherrod Brown", "Jon Ossoff", "Ilhan Omar", "Mary Peltola", "Angie Craig", "Peggy Flanagan",
  "Ashley Hinson", "Chris Pappas", "Dan Osborn", "Cory Mills", "LaMonica McIver", "Henry Cuellar",
];

// Words that make a story politically hot right now (used for bills, rules, and EOs).
const HOT = /\b(elections?|voter|voting|ballots?|census|redistrict\w*|epstein|pardons?|impeach\w*|tariffs?|insider|stock trading|deport\w*|immigra\w*|ice|shutdown|war powers|venezuela|iran|israel|ukraine|russia|china|federal reserve|medicaid|medicare|abortion|firearms?|guns?|national guard|insurrection|filibuster|supreme court)\b/i;

// --- Coverage matching -----------------------------------------------------------

const STOP = new Set(
  "a an the and or but of to in on for with at by from as is are was were be been it its this that these those not no new over into about than more most what who will would could can may under upon via per certain related other each all any such including respect".split(" "),
);

// Government boilerplate that says nothing about which story a record is.
const GENERIC = new Set(
  "act acts bill bills amend amendment amendments rule rules final proposed interim regulation regulations regulatory requirement requirements program programs provide providing establish establishment establishing continuation national emergency emergencies federal united states state states government department office agency administration management standards standard procedures procedure policy policies use reduce support improve protect protection protecting secure securing security relating matters matter purposes purpose order orders executive presidential proclamation memorandum notice day week month year 2025 2026 2027 delay effective date dates certain significant section public law laws congress house senate committee subcommittee investigate investigation allegations general people american americans america".split(
    " ",
  ),
);

function norm(s: string) {
  return ` ${s.toLowerCase().replace(/[’']s\b/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function has(text: string, term: string) {
  const t = norm(term).trim();
  return t.length > 1 && text.includes(` ${t} `);
}

/** Distinctive words from a title: no stop words, no government boilerplate. */
function distinctWords(title: string) {
  const words = norm(title).trim().split(" ");
  return [...new Set(words.filter((w) => w.length > 2 && !STOP.has(w) && !GENERIC.has(w) && !/^\d+$/.test(w)))];
}

interface WireIndex {
  docs: { item: WireItem; text: string }[];
  /** True for single words in more than 8% of wire items ("red", "trump", "senate"): too common to tie a story to a record. */
  common: (term: string) => boolean;
  /** Stricter cut (3%) for words that are meant to pin a story down ("washington" isn't). */
  vague: (term: string) => boolean;
}

function indexWire(items: WireItem[]): WireIndex {
  const docs = items.map((item) => ({ item, text: norm(`${item.title} ${item.summary}`) }));
  const df = new Map<string, number>();
  for (const { text } of docs) for (const w of new Set(text.trim().split(" "))) df.set(w, (df.get(w) ?? 0) + 1);
  const over = (share: number) => (term: string) => {
    const t = norm(term).trim();
    return !t.includes(" ") && (df.get(t) ?? 0) > Math.max(2, docs.length * share);
  };
  return { docs, common: over(0.08), vague: over(0.03) };
}

function checkCoverage(d: Draft, wire: WireIndex) {
  const strong = new Set<string>();
  const weak = new Set<string>();
  const coveredBy: Lead["coveredBy"] = [];
  const keyWords = new Set(d.keys.flatMap((k) => norm(k).trim().split(" ")));
  const words = d.match === "words" ? d.keys.filter((k) => !wire.common(k)) : [];
  const specifics = d.specifics.filter((t) => !wire.vague(t) && !norm(t).trim().split(" ").every((w) => keyWords.has(w)));
  const topics = d.topics.filter((t) => !norm(t).trim().split(" ").every((w) => keyWords.has(w)));
  for (const { item, text } of wire.docs) {
    let isStrong: boolean;
    if (d.match === "words") {
      const hits = words.filter((w) => has(text, w)).length;
      const topic = topics.some((t) => has(text, t));
      if (hits === 0 || hits + (topic ? 1 : 0) < 2) continue;
      isStrong = hits >= 3 || (hits >= 2 && topic);
    } else {
      if (!d.keys.some((k) => has(text, k))) continue;
      isStrong = specifics.some((t) => has(text, t));
      if (!isStrong && !topics.some((t) => has(text, t))) continue;
    }
    (isStrong ? strong : weak).add(item.outletId);
    if (coveredBy.length < 6 && !coveredBy.some((c) => c.url === item.url)) {
      coveredBy.push({ outlet: item.outlet, title: item.title, url: item.url });
    }
  }
  // 1 = nobody has it. Loose matches (key + topic word) leave some doubt; a match on
  // two specific names means it's been reported. More outlets, less novel.
  const novelty =
    strong.size > 0 ? Math.max(0.05, 0.25 - 0.05 * (strong.size - 1)) : weak.size > 0 ? Math.max(0.3, 0.6 - 0.1 * (weak.size - 1)) : 1;
  return { coveredBy, novelty };
}

/**
 * score = novelty x size x recency x relevance, each 0-1:
 * - novelty: 1 if no wire item mentions the lead's entities together (see checkCoverage)
 * - size: the record on its own terms (dollar amount on a log scale, EO vs. ceremonial
 *   proclamation, bill signed vs. referred, docket naming a candidate vs. a party)
 * - recency: halves every 4 days since the record was filed/published (undated = 0.5)
 * - relevance: bearing on the midterms (battleground Senate race = 1, routine rule ~0.5)
 */
function scoreLead(d: Draft, novelty: number, now: number) {
  const ageDays = d.date ? Math.max(0, (now - Date.parse(d.date)) / DAY) : NaN;
  const recency = Number.isNaN(ageDays) ? 0.5 : 0.5 ** (ageDays / 4);
  return Math.round(novelty * clamp(d.size) * recency * clamp(d.relevance) * 1000) / 1000;
}

const MONEY_TOPICS = ["super pac", "pac", "ad", "ads", "spend", "spending", "spent", "spends", "million", "outside", "attack", "airwaves", "money", "buy", "donor", "donors", "megadonor", "funding", "funded", "cash"];

// --- FEC -------------------------------------------------------------------------

const FEC = "https://api.open.fec.gov/v1";

/** Big independent expenditures in 2026 House/Senate races in the last two weeks. */
async function fecIndependentExpenditures(): Promise<Draft[]> {
  "use cache";
  const now = Date.now();
  const q = new URLSearchParams({
    api_key: API_KEY(),
    cycle: "2026",
    min_amount: "100000",
    min_date: isoDay(now - 14 * DAY),
    max_date: isoDay(now),
    sort: "-expenditure_date",
    per_page: "100",
  });
  const data = await getJson(`${FEC}/schedules/schedule_e/?${q}`);
  const rows = (data?.results ?? null) as Json[] | null;
  if (!rows) {
    cacheFailure();
    return [];
  }
  cacheLife("hours");

  // Amended filings repeat the same transaction; keep the latest filing of each.
  const byTxn = new Map<string, Json>();
  for (const r of rows) {
    if (!["S", "H"].includes(str(r.candidate_office)) || !r.candidate_name || str(r.memo_code) === "X") continue;
    if (str(r.expenditure_date) > isoDay(now)) continue; // typo'd future dates
    const k = `${str(r.committee_id)}|${str(r.transaction_id) || str(r.sub_id)}`;
    const prev = byTxn.get(k);
    if (!prev || str(r.filing_date) > str(prev.filing_date)) byTxn.set(k, r);
  }

  // One lead per committee x candidate x support/oppose.
  const groups = new Map<string, Json[]>();
  for (const r of byTxn.values()) {
    const k = `${str(r.committee_id)}|${str(r.candidate_id)}|${str(r.support_oppose_indicator)}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  return [...groups.entries()].map(([k, rs]): Draft => {
    const top = rs.toSorted((a, b) => num(b.expenditure_amount) - num(a.expenditure_amount))[0];
    const total = rs.reduce((s, r) => s + num(r.expenditure_amount), 0);
    const committee = titleCase(str((top.committee as Json | undefined)?.name) || str(top.committee_name) || "An outside group");
    const cand = personName(str(top.candidate_name));
    const party = str(top.candidate_party).charAt(0);
    const st = str(top.candidate_office_state);
    const stateName = STATES[st] ?? st;
    const senate = str(top.candidate_office) === "S";
    const race = senate ? `${stateName} Senate` : `${st}-${str(top.candidate_office_district).replace(/^0/, "")} House`;
    const verb = str(top.support_oppose_indicator) === "O" ? "opposing" : "supporting";
    const dates = rs.map((r) => str(r.expenditure_date)).filter(Boolean).toSorted();
    const filed = rs.map((r) => str(r.filing_date)).filter(Boolean).toSorted().at(-1) ?? dates.at(-1) ?? null;
    const span = dates.length > 1 && dates[0] !== dates.at(-1) ? `${shortDate(dates[0])}-${shortDate(dates.at(-1) ?? null)}` : shortDate(dates[0] ?? null);
    const purpose = str(top.expenditure_description).toLowerCase();
    const payee = titleCase(str(top.payee_name));
    const ytd = num(top.office_total_ytd);
    const committeeCore = committee.replace(/\b(PAC|Super PAC|Inc\.?|LLC|Action|Fund|Committee|Political)\b/g, "").replace(/\s+/g, " ").trim();
    const watch = WATCHLIST.some((w) => w.toLowerCase().endsWith(cand.last.toLowerCase()));
    return {
      id: `fec-ie-${k.replace(/\|/g, "-")}`,
      source: "FEC",
      kind: "Independent expenditure",
      title: `${committee} spent ${money(total)} ${verb} ${cand.full}${party ? ` (${party})` : ""} in the ${race} race`,
      detail:
        `${rs.length === 1 ? "One independent expenditure" : `${rs.length} independent expenditures`} dated ${span}${filed ? `, filed with the FEC ${shortDate(filed)}` : " reported to the FEC"}${rs.length === 1 ? ":" : "; the largest is"} ${money(num(top.expenditure_amount))}` +
        `${purpose ? ` for "${purpose}"` : ""}${payee ? ` paid to ${payee}` : ""}.` +
        (ytd > total ? ` The committee reports ${money(ytd)} spent on this race so far this year.` : ""),
      url: str(top.pdf_url) || `https://www.fec.gov/data/independent-expenditures/?committee_id=${str(top.committee_id)}&cycle=2026`,
      date: filed,
      amount: Math.round(total),
      entities: [cand.full, committee, stateName],
      match: "entity",
      keys: [cand.last, cand.full],
      specifics: [committee, ...(committeeCore.split(" ").length >= 2 ? [committeeCore] : [])],
      topics: MONEY_TOPICS,
      // $25K -> 0, $250K -> 0.38, $1M -> 0.62, $10M -> 1
      size: clamp(Math.log10(total / 25_000) / Math.log10(400), 0.15),
      relevance: senate ? (BATTLEGROUND.has(st) || watch ? 1 : 0.85) : 0.75,
    };
  });
}

const REPORT_TYPES: Record<string, string> = {
  M10: "October monthly", M9: "September monthly", Q3: "October quarterly", "12G": "pre-general", "30G": "post-general",
  "24": "24-hour", "48": "48-hour", "12P": "pre-primary", M11: "November monthly",
};

/** Seven-figure itemized receipts (mostly super PAC and party money) in the last 45 days. */
async function fecBigMoney(): Promise<Draft[]> {
  "use cache";
  const now = Date.now();
  const q = new URLSearchParams({
    api_key: API_KEY(),
    two_year_transaction_period: "2026",
    min_amount: "500000",
    min_date: isoDay(now - 45 * DAY),
    sort: "-contribution_receipt_date",
    per_page: "100",
  });
  const data = await getJson(`${FEC}/schedules/schedule_a/?${q}`);
  const rows = (data?.results ?? null) as Json[] | null;
  if (!rows) {
    cacheFailure();
    return [];
  }
  cacheLife("hours");

  const seen = new Set<string>();
  const out: Draft[] = [];
  for (const r of rows) {
    const committee = (r.committee ?? {}) as Json;
    const recipientRaw = str(committee.name) || str(r.committee_name);
    // Memo entries (X) restate conduit money already counted elsewhere (e.g. ActBlue).
    if (str(r.memo_code) === "X" || !recipientRaw || str(r.filing_form) === "F3P") continue;
    if (/^(actblue|winred)\b/i.test(str(r.contributor_name))) continue;
    const amount = num(r.contribution_receipt_amount);
    const k = `${str(r.contributor_name)}|${str(r.committee_id)}|${amount}|${str(r.contribution_receipt_date)}`;
    if (seen.has(k)) continue;
    seen.add(k);

    const individual = str(r.entity_type) === "IND";
    const donor = individual ? personName(str(r.contributor_name)) : { full: titleCase(str(r.contributor_name)), last: "" };
    const recipient = titleCase(recipientRaw);
    const ctype = str(committee.committee_type_full);
    const recipientDesc = /super pac/i.test(ctype) && !/super ?pac/i.test(recipient) ? `${recipient} (super PAC)` : recipient;
    const where = [titleCase(str(r.contributor_city)), str(r.contributor_state)].filter(Boolean).join(", ");
    const job = individual ? [titleCase(str(r.contributor_occupation)), titleCase(str(r.contributor_employer))].filter(Boolean).join(" at ") : "";
    const report = REPORT_TYPES[str(r.report_type)] ?? str(r.report_type);
    const ytd = num(r.contributor_aggregate_ytd);
    const loaded = str(r.load_date) || null;
    out.push({
      id: `fec-a-${str(r.sub_id) || k}`,
      source: "FEC",
      kind: "Large contribution",
      title: `${donor.full} gave ${money(amount)} to ${recipientDesc}`,
      detail:
        `Itemized receipt dated ${shortDate(str(r.contribution_receipt_date))} on ${recipient}'s ${report ? `${report} ` : ""}report, made public ${shortDate(loaded)}. ` +
        `Donor listed as ${individual ? "an individual" : article(str(r.entity_type_desc).toLowerCase() || "organization")}${where ? ` in ${where}` : ""}${job ? ` (${job})` : ""}` +
        `${ytd > amount ? `, ${money(ytd)} given to this committee so far this cycle` : ""}.`,
      url: str(r.pdf_url) || `https://www.fec.gov/data/receipts/?committee_id=${str(r.committee_id)}&two_year_transaction_period=2026`,
      date: loaded ?? (str(r.contribution_receipt_date) || null),
      amount: Math.round(amount),
      entities: [donor.full, recipient],
      match: "entity",
      keys: individual ? [donor.last, donor.full] : [donor.full],
      specifics: [recipient],
      topics: [...MONEY_TOPICS, "gave", "give", "gives", "donation", "donated", "contribution", "check", "bankroll", "bankrolled", "bankrolling"],
      // $100K -> 0, $1M -> 0.37, $10M -> 0.74, $50M -> 1
      size: clamp(Math.log10(amount / 100_000) / Math.log10(500), 0.15),
      relevance: 0.8,
    });
  }
  return out;
}

// --- Federal Register ------------------------------------------------------------

const FR = "https://www.federalregister.gov/api/v1/documents.json";
const FR_FIELDS = ["title", "type", "subtype", "abstract", "action", "agencies", "document_number", "executive_order_number", "proclamation_number", "html_url", "publication_date", "signing_date", "effective_on"];

function frQuery(type: string, since: string, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({ per_page: "100", order: "newest", "conditions[type][]": type, "conditions[publication_date][gte]": since, ...extra });
  for (const f of FR_FIELDS) q.append("fields[]", f);
  return `${FR}?${q}`;
}

function firstSentences(s: string, max = 240) {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > 80 ? cut.slice(0, end + 1) : `${cut.replace(/\s+\S*$/, "")}...`;
}

function frDraft(r: Json): Draft | null {
  const title = str(r.title);
  if (!title) return null;
  const presidential = str(r.type) === "Presidential Document";
  const subtype = str(r.subtype);
  const agencies = ((r.agencies ?? []) as Json[]).map((a) => str(a.name)).filter(Boolean);
  const abstract = str(r.abstract);
  const hot = HOT.test(`${title} ${abstract}`);
  const words = distinctWords(title);
  let kind: string;
  let label: string;
  let size: number;
  if (presidential) {
    const eo = str(r.executive_order_number);
    const proc = str(r.proclamation_number);
    const ceremonial = /\b(day|week|month)\b,?\s*\d{4}$/i.test(title) || /^national .* (day|week|month)/i.test(title);
    if (subtype === "Executive Order") [kind, label, size] = ["Executive order", `Executive Order ${eo}`.trim(), 0.9];
    else if (subtype === "Proclamation") [kind, label, size] = ["Proclamation", `Proclamation ${proc}`.trim(), ceremonial ? 0.1 : 0.45];
    else if (subtype === "Memorandum") [kind, label, size] = ["Presidential memorandum", "Presidential memorandum", 0.75];
    else if (/^continuation of/i.test(title)) [kind, label, size] = ["Presidential notice", "Presidential notice", 0.15];
    else [kind, label, size] = [subtype || "Presidential document", `Presidential ${(subtype || "document").toLowerCase()}`, 0.55];
  } else {
    const proposed = str(r.type) === "Proposed Rule";
    const agency = agencies[0] ?? "Federal";
    kind = proposed ? "Significant proposed rule" : "Significant rule";
    label = `${agency} ${proposed ? "proposed rule" : /delay/i.test(str(r.action)) ? "rule delay" : "final rule"}`;
    size = proposed ? 0.3 : 0.4;
  }
  const signed = str(r.signing_date);
  const published = str(r.publication_date) || null;
  const effective = str(r.effective_on);
  const when = [signed && `Signed ${shortDate(signed)}`, published && `published ${shortDate(published)}`, effective && `effective ${shortDate(effective)}`]
    .filter(Boolean)
    .join(", ");
  const detail = `${abstract ? `${firstSentences(abstract)} ` : ""}${when.charAt(0).toUpperCase()}${when.slice(1)}.`;
  const kindTopics = presidential ? ["executive order", "proclamation", "memo", "memorandum"] : ["rule", "regulation", "regulations"];
  return {
    id: `fr-${str(r.document_number)}`,
    source: "Federal Register",
    kind,
    title: `${label}: ${title}`,
    detail,
    url: str(r.html_url),
    date: published,
    entities: [...words.slice(0, 6), ...agencies.slice(0, 2)],
    match: "words",
    keys: words,
    specifics: [],
    topics: kindTopics,
    size: hot ? Math.min(1, size + 0.15) : size,
    relevance: /\b(election|voter|voting|ballot|census|redistrict)/i.test(`${title} ${abstract}`) ? 1 : hot ? 0.8 : presidential ? 0.6 : 0.45,
  };
}

/** Presidential documents and significant rules from the last 7 days. */
async function federalRegister(): Promise<Draft[]> {
  "use cache";
  const now = Date.now();
  const since = isoDay(now - 7 * DAY);
  const [pres, rules, proposed] = await Promise.all([
    getJson(frQuery("PRESDOCU", since)),
    getJson(frQuery("RULE", since, { "conditions[significant]": "1" })),
    getJson(frQuery("PRORULE", since, { "conditions[significant]": "1" })),
  ]);
  if (!pres && !rules && !proposed) {
    cacheFailure();
    return [];
  }
  cacheLife("hours");
  const docs = [pres, rules, proposed].flatMap((d) => (d?.results ?? []) as Json[]);
  return docs.map(frDraft).filter((d): d is Draft => d !== null);
}

// --- Congress --------------------------------------------------------------------

const BILL_PATH: Record<string, [string, string]> = {
  HR: ["house-bill", "H.R."], S: ["senate-bill", "S."], HJRES: ["house-joint-resolution", "H.J.Res."], SJRES: ["senate-joint-resolution", "S.J.Res."],
  HRES: ["house-resolution", "H.Res."], SRES: ["senate-resolution", "S.Res."], HCONRES: ["house-concurrent-resolution", "H.Con.Res."], SCONRES: ["senate-concurrent-resolution", "S.Con.Res."],
};

function currentCongress(year: number) {
  return { congress: Math.floor((year - 1789) / 2) + 1, session: year % 2 === 1 ? 1 : 2 };
}

/** Bills with a latest action in the last 7 days (Congress is in recess until after Nov 3). */
async function congressBills(): Promise<Draft[]> {
  "use cache";
  const now = Date.now();
  const { congress } = currentCongress(new Date(now).getUTCFullYear());
  const since = isoDay(now - 7 * DAY);
  const q = new URLSearchParams({ api_key: API_KEY(), format: "json", limit: "250", sort: "updateDate desc", fromDateTime: `${since}T00:00:00Z` });
  const data = await getJson(`https://api.congress.gov/v3/bill?${q}`);
  const bills = (data?.bills ?? null) as Json[] | null;
  if (!bills) {
    cacheFailure();
    return [];
  }
  cacheLife("hours");

  return bills
    .map((b): Draft | null => {
      const action = (b.latestAction ?? {}) as Json;
      const actionDate = str(action.actionDate);
      const text = str(action.text);
      const type = str(b.type).toUpperCase();
      const path = BILL_PATH[type];
      if (num(b.congress) !== congress || actionDate < since || !path) return null;
      const title = str(b.title);
      let [kind, phrase, size] = ["Bill introduced", "was introduced", 0.2];
      // Signing a noncontroversial bill isn't news on its own; HOT titles add 0.3 below.
      if (/vetoed/i.test(text)) [kind, phrase, size] = ["Bill vetoed", "was vetoed", 0.9];
      else if (/became public law|signed by president/i.test(text)) [kind, phrase, size] = ["Bill signed into law", "was signed into law", 0.5];
      else if (/presented to president/i.test(text)) [kind, phrase, size] = ["Bill sent to the president", "was sent to the president", 0.5];
      else if (/passed|agreed to/i.test(text)) [kind, phrase, size] = ["Bill passed", "passed a chamber", 0.45];
      else if (/reported|ordered to be reported/i.test(text)) [kind, phrase, size] = ["Bill advanced", "advanced out of committee", 0.4];
      else if (/calendar/i.test(text)) [kind, phrase, size] = ["Bill placed on calendar", "was placed on the calendar", 0.3];
      const hot = HOT.test(title);
      if (hot) size = Math.min(1, size + 0.3);
      if (size < 0.3) return null; // plain referrals of non-hot bills are noise
      const label = `${path[1]} ${str(b.number)}`;
      const words = distinctWords(title);
      return {
        id: `bill-${congress}-${type}${str(b.number)}`,
        source: "Congress",
        kind,
        title: `${label}, the ${title.replace(/\.$/, "")}, ${phrase}`,
        detail: `Latest action (${shortDate(actionDate)}): ${firstSentences(text, 200)}`,
        url: `https://www.congress.gov/bill/${congress}th-congress/${path[0]}/${str(b.number)}`,
        date: actionDate || null,
        entities: [label, ...words.slice(0, 5)],
        match: "words",
        keys: [...words, label],
        specifics: [],
        topics: ["bill", "legislation", "introduce", "introduced", "introduces"],
        size,
        relevance: hot ? 0.75 : 0.5,
      };
    })
    .filter((d): d is Draft => d !== null);
}

const xml = new XMLParser({ ignoreAttributes: true, parseTagValue: false });
const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

/** Senate roll-call votes from the last 7 days, one per measure. */
async function senateVotes(): Promise<Draft[]> {
  "use cache";
  const now = Date.now();
  const year = new Date(now).getUTCFullYear();
  const { congress, session } = currentCongress(year);
  const body = await getText(`https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${congress}_${session}.xml`);
  let votes: Json[] = [];
  try {
    const doc = body ? (xml.parse(body) as Json) : null;
    const raw = ((doc?.vote_summary as Json | undefined)?.votes as Json | undefined)?.vote;
    votes = Array.isArray(raw) ? (raw as Json[]) : raw ? [raw as Json] : [];
  } catch {
    votes = [];
  }
  if (!body) {
    cacheFailure();
    return [];
  }
  cacheLife("hours");

  const since = isoDay(now - 7 * DAY);
  const byIssue = new Map<string, Json & { date: string }>();
  for (const v of votes) {
    const [d, m] = str(v.vote_date).split("-");
    const date = MONTHS[m] && d ? `${year}-${MONTHS[m]}-${d.padStart(2, "0")}` : "";
    if (!date || date < since) continue;
    const issue = str(v.issue) || str(v.vote_number);
    const prev = byIssue.get(issue);
    if (!prev || str(v.vote_number) > str(prev.vote_number)) byIssue.set(issue, { ...v, date });
  }
  return [...byIssue.values()].map((v): Draft => {
    const n = str(v.vote_number);
    const tally = (v.vote_tally ?? {}) as Json;
    const yeas = num(tally.yeas);
    const nays = num(tally.nays);
    const question = str(v.question);
    const title = str(v.title);
    const final = /nomination|passage|joint resolution|resolution|veto/i.test(question);
    const close = Math.abs(yeas - nays) <= 4;
    const words = distinctWords(title);
    return {
      id: `senate-vote-${congress}-${session}-${n}`,
      source: "Congress",
      kind: "Senate roll call",
      title: `Senate vote ${Number(n)}: ${title} (${str(v.result).toLowerCase()} ${yeas}-${nays})`,
      detail: `${question} on ${str(v.issue)}, ${shortDate(v.date)}: ${str(v.result)}, ${yeas} yeas to ${nays} nays.`,
      url: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${n.padStart(5, "0")}.htm`,
      date: v.date,
      entities: [str(v.issue), ...words.slice(0, 5)],
      match: "words",
      keys: [...words, str(v.issue)],
      specifics: [],
      topics: ["vote", "votes", "voted", "confirm", "confirmed", "confirms", "confirmation", "cloture"],
      size: (final ? 0.65 : 0.4) + (close ? 0.2 : 0),
      relevance: HOT.test(title) ? 0.8 : 0.6,
    };
  });
}

// --- Courts (CourtListener) ------------------------------------------------------

const CL = "https://www.courtlistener.com";
const CL_TIMEOUT = 25_000; // anonymous search measured at 12-20s
const ALARM = /\b(search warrant|indict\w*|grand jury|subpoena\w*|criminal|investigation|contempt|sanctions?)\b/i;

async function clSearch(q: string, since: string) {
  const params = new URLSearchParams({ q, type: "r", order_by: "dateFiled desc", filed_after: since });
  const data = await getJson(`${CL}/api/rest/v4/search/?${params}`, CL_TIMEOUT);
  return (data?.results ?? null) as Json[] | null;
}

/** "PAXTON, KEN" and "Ken Paxton, in his official capacity" both count as Ken Paxton. */
function watchHit(text: string) {
  const t = norm(text);
  return WATCHLIST.find((name) => {
    const parts = norm(name).trim().split(" ");
    return parts.every((p) => t.includes(` ${p} `));
  });
}

// Place names say where a case is, not which story it is.
const PLACE_WORDS = new Set([...Object.values(STATES).flatMap((n) => n.toLowerCase().split(" ")), "york", "city", "county"]);

// Parties that identify nothing on their own.
const GENERIC_PARTY = /^(united states( of america)?|usa|state of |.*\b(a minor|deceased|does? \d|et al)\b|unknown|john doe)/i;
const LEGAL_TOPICS = ["court", "lawsuit", "lawsuits", "sue", "sues", "sued", "suing", "judge", "warrant", "search", "searched", "raid", "filing", "complaint", "case", "fbi", "investigation", "investigators", "probe", "subpoena", "indicted", "indictment", "charged", "doj", "justice department"];

/** "Ken Paxton, in his official capacity as Attorney General" -> "Ken Paxton" */
function cleanParty(p: string) {
  return titleCase(p.replace(/,?\s+(in (his|her|their|the|its) (official|individual) capacit(y|ies)|as |individually).*$/i, "").trim());
}

function courtDraft(r: Json, watch: string | undefined): Draft {
  const parties = [...new Set(((r.party ?? []) as unknown[]).map((p) => cleanParty(str(p))).filter(Boolean))];
  const caseName = titleCase(str(r.caseName) || str(r.case_name_full) || "Untitled case");
  const cite = str(r.court_citation_string) || str(r.court_id);
  const court = str(r.court);
  const filed = str(r.dateFiled) || null;
  const nature = (str(r.suitNature) || str(r.cause)).replace(/^\d+\s*/, "");
  const docs = (r.recap_documents ?? []) as Json[];
  // Prefer the charging/opening document: its description names who is being sued.
  const doc = docs.find((d) => /complaint|petition|indictment|application|motion/i.test(str(d.short_description))) ?? docs[0];
  const docLabel = doc ? firstSentences(str(doc.description) || str(doc.short_description), 220) : "";
  const alarm = ALARM.test(`${caseName} ${nature} ${docLabel} ${str(doc?.description)}`);
  const routine = /habeas|prisoner|social security|foreclosure|bankruptcy|malpractice/i.test(nature);
  const surname = watch?.split(" ").at(-1) ?? "";
  // "X v. Paxton": a sitting official sued in office is routine; "United States v. X",
  // "In re ... X", or X as plaintiff are more likely news.
  const [left, right = ""] = caseName.split(/\s+v\.?\s+/i);
  const asDefendant = watch ? has(norm(right), surname) && !has(norm(left), surname) : false;
  const prosecuted = watch ? /^(united states|usa)\b/i.test(left) && has(norm(right), surname) : false;
  const others = parties.filter((p) => !GENERIC_PARTY.test(p) && (!watch || !has(norm(p), surname)));
  const caseWords = distinctWords(caseName).filter((w) => !["matter", "application", "residence", "company", "inc", "llc"].includes(w) && !PLACE_WORDS.has(w));
  const size = prosecuted || alarm ? 1 : routine ? 0.25 : asDefendant ? 0.45 : watch ? 0.75 : 0.6;
  return {
    id: `court-${str(r.docket_id)}`,
    source: "Courts",
    kind: watch ? "Federal case naming a candidate" : "Federal voting case",
    title: `${watch ? `${watch} in new ${cite} case` : `New ${cite} voting case`}: ${caseName}`,
    detail:
      `Filed ${shortDate(filed)} in the ${court}${nature ? ` (${nature})` : ""}.` +
      `${parties.length ? ` Parties include ${parties.slice(0, 4).join("; ")}.` : ""}` +
      `${docLabel ? ` Filings include "${docLabel}".` : ""}`,
    url: `${CL}${str(r.docket_absolute_url)}`,
    date: filed,
    entities: [...(watch ? [watch] : []), ...parties.slice(0, 4)],
    match: "entity",
    keys: watch ? [surname, watch] : others.slice(0, 4),
    specifics: [...others.slice(0, 4), ...caseWords.slice(0, 5)],
    topics: watch ? LEGAL_TOPICS : [...LEGAL_TOPICS, "voting", "voter", "voters", "ballot", "ballots", "election"],
    size,
    relevance: watch ? 1 : 0.9,
  };
}

/** New federal dockets naming watchlist candidates, plus new voting-rights suits, last 14 days. */
async function courts(): Promise<Draft[]> {
  "use cache";
  const now = Date.now();
  const since = isoDay(now - 14 * DAY);
  const names = WATCHLIST.map((n) => `"${n}"`).join(" OR ");
  const [named, voting] = await Promise.all([
    clSearch(`party:(${names}) OR caseName:(${names})`, since),
    clSearch(`suitNature:Voting OR cause:"Voting Rights"`, since),
  ]);
  if (!named && !voting) {
    cacheFailure();
    return [];
  }
  cacheLife("hours");

  const seen = new Set<string>();
  const out: Draft[] = [];
  for (const [rows, isWatch] of [[named ?? [], true], [voting ?? [], false]] as const) {
    for (const r of rows) {
      const id = str(r.docket_id);
      // Bankruptcy courts (ids ending in "b") are almost always private individuals.
      if (!id || seen.has(id) || /b$/.test(str(r.court_id))) continue;
      const watch = watchHit(`${str(r.caseName)} | ${((r.party ?? []) as unknown[]).map(str).join(" | ")}`);
      if (isWatch && !watch) continue;
      seen.add(id);
      out.push(courtDraft(r, watch));
    }
  }
  return out;
}

// --- Assembly --------------------------------------------------------------------

const PER_SOURCE_CAP: Record<Lead["source"], number> = { FEC: 18, "Federal Register": 10, Congress: 8, Courts: 10 };

/** Leads plus when they were computed. Re-checks coverage against the Wire every minute. */
export async function getDig(): Promise<{ generatedAt: string; leads: Lead[] }> {
  "use cache";
  cacheLife("minutes");
  const now = Date.now();
  const [wire, ...sources] = await Promise.all([
    getWire().catch(() => ({ items: [] as WireItem[] })),
    fecIndependentExpenditures().catch(() => []),
    fecBigMoney().catch(() => []),
    federalRegister().catch(() => []),
    congressBills().catch(() => []),
    senateVotes().catch(() => []),
    courts().catch(() => []),
  ]);
  const wireIndex = indexWire(wire.items);

  const leads = sources
    .flat()
    .map((d): Lead => {
      const { coveredBy, novelty } = checkCoverage(d, wireIndex);
      return {
        id: d.id,
        source: d.source,
        kind: d.kind,
        title: d.title,
        detail: tidy(d.detail),
        url: d.url,
        date: d.date,
        ...(d.amount != null ? { amount: d.amount } : {}),
        entities: [...new Set(d.entities.filter(Boolean))],
        coveredBy,
        novelty,
        score: scoreLead(d, novelty, now),
      };
    })
    .toSorted((a, b) => b.score - a.score);

  const taken: Record<string, number> = {};
  const capped = leads.filter((l) => (taken[l.source] = (taken[l.source] ?? 0) + 1) <= PER_SOURCE_CAP[l.source]);
  return { generatedAt: new Date(now).toISOString(), leads: capped.slice(0, 40) };
}

/** Newsworthy primary-source records, sorted by score (highest first), max 40. */
export async function getLeads(): Promise<Lead[]> {
  return (await getDig()).leads;
}
