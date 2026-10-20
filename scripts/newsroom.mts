// RockLeak newsroom desk tool. The scheduled Claude Code runs (newsroom/PLAYBOOK.md) use it to
// gather the day's news, validate drafts, and publish/unpublish. Runs on plain Node (24+):
//
//   node scripts/newsroom.mts brief <morning|evening|night|practice>  news brief -> stdout + desk file
//   node scripts/newsroom.mts prompt <Grant|Rosa|Mercer|Vex> <ledger.json>  full debater prompt, facts numbered
//   node scripts/newsroom.mts agreement <debate.json> <ledger.json>
//   node scripts/newsroom.mts assemble <story dir>            ledger.json + debate.json + article.json -> draft.json
//   node scripts/newsroom.mts check <draft.json>              schema + newsroom rules
//   node scripts/newsroom.mts review <draft.json> <review.json> <edition>  attach Plumb's approval
//   node scripts/newsroom.mts publish <draft.json>            check, require Plumb's approval, stamp time, add to content/stories.json
//   node scripts/newsroom.mts unpublish <slug> "<reason>"     take a story down (kept in the desk)
//   node scripts/newsroom.mts list                            published stories
//   node scripts/newsroom.mts fec <path> [key=value ...]      OpenFEC via the site's key, e.g.
//        fec schedules/schedule_e/ committee_id=C00901223 sort=-expenditure_date per_page=20
//   node scripts/newsroom.mts image <story dir | slug> "<File:Name.jpg>" "<alt text>"
//        attach a free-license Wikimedia Commons photo, with its credit (a slug edits a published story)

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEBATERS } from "../src/lib/agents/personas.ts";
import { closeCall, outcomeName, raceRows } from "../src/lib/races.ts";
import { StorySchema } from "../src/lib/story-schema.ts";
import type { CoreFact, LiveMarket, Story, StoryImage, WireCluster } from "../src/lib/types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORIES = join(ROOT, "content/stories.json");
const DESK = join(ROOT, "newsroom/desk");
const SITE = process.env.SITE_URL ?? "https://rockleak-roan.vercel.app";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const readStories = (): Story[] => JSON.parse(readFileSync(STORIES, "utf8"));
const writeStories = (s: Story[]) =>
  writeFileSync(STORIES, JSON.stringify(s.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)), null, 2) + "\n");
const fail = (msg: string): never => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(60_000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

interface Lead {
  source: string;
  kind: string;
  title: string;
  detail: string;
  url: string;
  date: string | null;
  coveredBy: { outlet: string; url: string }[];
  novelty: number;
  score: number;
}

async function brief(edition: string) {
  if (!["morning", "evening", "night", "practice"].includes(edition)) fail("edition must be morning, evening, night or practice");
  const [wire, dig, odds] = await Promise.all([
    getJson<WireCluster[]>("/api/wire"),
    getJson<{ leads: Lead[] }>("/api/dig"),
    getJson<LiveMarket[]>("/api/odds"),
  ]);
  const now = new Date();
  const out: string[] = [
    `# RockLeak ${edition} brief: ${now.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" })} ET`,
    "",
  ];

  out.push("## Already published (don't repeat; a follow-up needs a genuinely new fact)");
  for (const s of readStories().slice(0, 12)) out.push(`- ${s.publishedAt.slice(0, 10)} · ${s.headline} (/story/${s.slug})`);

  out.push("", "## The Wire: what every side is covering, last 48h (more outlets + both sides = bigger story)");
  if (!wire) out.push("(wire unavailable)");
  for (const c of (wire ?? []).filter((c) => c.items.length >= 2).slice(0, 18)) {
    const leans = [...new Set(c.leans)].join(", ");
    out.push(`- **${c.label}** — ${c.items.length} outlets (${leans}); balance ${c.balance.toFixed(2)}`);
    for (const i of c.items.slice(0, 4)) out.push(`  - ${i.outlet}: ${i.title} <${i.url}>`);
  }

  const rows = raceRows(odds ?? []);
  const fmt = (m?: LiveMarket) => (m ? `${outcomeName(m.outcome)} ${Math.round(m.probability * 100)}% <${m.url}>` : "—");
  out.push("", "## Close calls in the markets (favorite at 60% or less, or Kalshi and Polymarket disagree)");
  out.push("If one is listed and no drop covered it in the last 3 days, one of today's drops should explain it. See PLAYBOOK 1.");
  if (!odds) out.push("(markets unavailable)");
  const close = rows.filter((r) => closeCall(r));
  if (odds && !close.length) out.push("(none right now)");
  for (const r of close) out.push(`- **${r.race}**: ${closeCall(r)}. Kalshi: ${fmt(r.kalshi)} · Polymarket: ${fmt(r.poly)}`);

  out.push("", "## All race favorites (expectations, not facts)");
  for (const r of rows.filter((r) => !closeCall(r))) out.push(`- ${r.race}: Kalshi ${fmt(r.kalshi)} · Polymarket ${fmt(r.poly)}`);

  out.push("", "## The Dig: official records (novelty 1 = no outlet has covered it). A source of facts and fresh angles, not the main pick.");
  if (!dig) out.push("(dig unavailable)");
  for (const l of (dig?.leads ?? []).slice(0, 12)) {
    const covered = l.coveredBy.length ? `covered by ${l.coveredBy.map((c) => c.outlet).join(", ")}` : "UNREPORTED";
    out.push(`- [${l.source} · ${l.kind} · ${l.date ?? "undated"}] **${l.title}** (${covered}; novelty ${l.novelty})`);
    out.push(`  ${l.detail} <${l.url}>`);
  }

  const text = out.join("\n") + "\n";
  // Practice runs keep their brief inside their own folder so real runs never mistake it for theirs.
  const file = edition === "practice" ? join(DESK, today(), "practice", "brief.md") : join(DESK, today(), `brief-${edition}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  console.log(text);
  console.log(`(saved to ${file})`);
}

type Ledger = Pick<Story, "coreFacts" | "claims" | "coverage" | "xPulse" | "markets" | "stillUnknown">;
type Turn = { position: string; argument: string; concedes: string; acceptsFacts: number[]; challenges: { factIndex: number; reason: string }[] };
const readJson = <T,>(file: string): T => {
  if (!existsSync(file)) fail(`no such file: ${file}`);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (e) {
    return fail(`${basename(file)} is not valid JSON: ${(e as Error).message}`);
  }
};

/** The exact prompt for one debater sub-agent: persona + numbered ledger + reply format. */
function prompt(name: string, ledgerFile: string) {
  const p = DEBATERS.find((d) => d.id.toLowerCase() === (name ?? "").toLowerCase()) ?? fail(`debater must be one of ${DEBATERS.map((d) => d.id).join(", ")}`);
  const l = readJson<Ledger>(ledgerFile);
  const facts = l.coreFacts.map((f: CoreFact, i) => `[${i}] (${f.verdict}) ${f.text}`).join("\n");
  const claims = l.claims.map((c) => `- "${c.claim}" (${c.claimant}): rated ${c.verdict}. ${c.explanation}`).join("\n");
  const coverage = l.coverage.map((c) => `- ${c.outlet} (${c.lean}): ${c.headline}. ${c.framing}`).join("\n");
  console.log(`${p.system}

THE FACT LEDGER (numbered; argue only from these):
${facts}

CLAIMS GOING AROUND:
${claims || "(none)"}

HOW OUTLETS FRAMED IT:
${coverage}

STILL UNKNOWN:
${l.stillUnknown.map((u) => `- ${u}`).join("\n") || "(none)"}

Reply with ONLY this JSON, no prose around it:
{"position": "your one-sentence take, in your voice",
 "argument": "3-5 sentences making your case from the ledger",
 "concedes": "the strongest point for the other side, stated fairly",
 "acceptsFacts": [indexes of ledger facts you accept as true],
 "challenges": [{"factIndex": n, "reason": "why this fact is overstated or wrong"}]}
Write position/argument/concedes as plain prose for readers: never write "fact 3" or "[3]". Only challenge a fact if you think its verdict is wrong, not to repeat a caveat already in it.`);
}

/** Share of facts each analyst accepts, minus 3 per challenge to a fact rated "confirmed".
 *  Challenges to facts already rated likely/unverified repeat a known caveat and don't count. */
function agreement(debateFile: string, ledgerFile: string) {
  console.log(agreementScore(readJson<Turn[]>(debateFile), readJson<Ledger>(ledgerFile)));
}
function agreementScore(turns: Turn[], ledger: Ledger) {
  const n = ledger.coreFacts.length || 1;
  const accepted = turns.reduce((sum, t) => sum + new Set(t.acceptsFacts.filter((i) => i >= 0 && i < n)).size, 0);
  const challenges = turns.reduce((sum, t) => sum + t.challenges.filter((c) => ledger.coreFacts[c.factIndex]?.verdict === "confirmed").length, 0);
  return Math.max(0, Math.min(100, Math.round((accepted / (n * turns.length)) * 100 - challenges * 3)));
}

/** draft.json = the ledger + Quill's article + the debate, with the agreement score computed. */
function assemble(dir: string) {
  const ledger = readJson<Ledger>(join(dir, "ledger.json"));
  const turns = readJson<Turn[]>(join(dir, "debate.json"));
  const article = readJson<Partial<Story>>(join(dir, "article.json"));
  if (turns.length !== 4) fail("debate.json must hold 4 turns in order: Grant, Rosa, Mercer, Vex");
  const order = ["Grant", "Rosa", "Mercer", "Vex"] as const;
  const debate =
    article.debate ?? turns.map((t, i) => ({ persona: order[i], position: t.position, argument: t.argument, concedes: t.concedes }));
  const draft = {
    ...article,
    publishedAt: article.publishedAt ?? new Date().toISOString(), // replaced with the real time by publish
    agreementScore: agreementScore(turns, ledger),
    coreFacts: ledger.coreFacts,
    claims: ledger.claims,
    coverage: ledger.coverage,
    xPulse: ledger.xPulse,
    markets: ledger.markets,
    stillUnknown: ledger.stillUnknown,
    debate,
  };
  writeFileSync(join(dir, "draft.json"), JSON.stringify(draft, null, 2) + "\n");
  console.log(`✓ wrote ${join(dir, "draft.json")} (agreement ${draft.agreementScore})`);
  check(join(dir, "draft.json"));
}

/** Attach Plumb's sign-off. Only an APPROVE or APPROVE_WITH_EDITS verdict can be attached. */
function review(draftFile: string, reviewFile: string, edition: string) {
  if (!["morning", "evening", "night", "manual"].includes(edition)) fail("edition must be evening, night or manual");
  const r = readJson<{ decision: string; summary: string }>(reviewFile);
  if (!["APPROVE", "APPROVE_WITH_EDITS"].includes(r.decision)) fail(`Plumb's decision is ${r.decision}; only APPROVE or APPROVE_WITH_EDITS can be attached`);
  const draft = readJson<Story>(draftFile);
  draft.review = { approvedBy: "Plumb", approvedAt: new Date().toISOString(), notes: r.summary, edition: edition as NonNullable<Story["review"]>["edition"] };
  writeFileSync(draftFile, JSON.stringify(draft, null, 2) + "\n");
  console.log(`✓ Plumb's approval attached to ${basename(draftFile)}`);
  check(draftFile);
}

function check(file: string, { forPublish = false } = {}): Story {
  if (!existsSync(file)) fail(`no such file: ${file}`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(`not valid JSON: ${(e as Error).message}`);
  }
  const parsed = StorySchema.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) console.error(`  - ${i.path.join(".") || "(root)"}: ${i.message}`);
    fail("story does not match the schema");
  }
  const story = parsed.data as Story;
  const errors: string[] = [];
  const warnings: string[] = [];
  const published = readStories();

  if (published.some((s) => s.slug === story.slug)) errors.push(`slug "${story.slug}" is already published`);
  if (published.some((s) => s.headline.toLowerCase() === story.headline.toLowerCase())) errors.push("headline already used");
  if (Date.parse(story.publishedAt) > Date.now() + 60 * 60_000) errors.push("publishedAt is in the future");

  const allSources = [...story.coreFacts, ...story.claims].flatMap((f) => f.sources);
  if (!allSources.some((s) => s.tier === "primary")) warnings.push("no official (primary) source anywhere; Plumb should be sure that's acceptable");
  const notConfirmedLead = story.coreFacts[0] && !["confirmed", "likely"].includes(story.coreFacts[0].verdict);
  if (notConfirmedLead) warnings.push("the first core fact isn't confirmed or likely");
  const sides = new Set(story.coverage.map((c) => (c.lean.includes("left") ? "L" : c.lean.includes("right") ? "R" : "C")));
  if (sides.size < 2) warnings.push(`coverage only from one side (${[...sides].join("")})`);
  for (const s of allSources) if (s.tier === "social" && s.url.includes("news.google.com")) warnings.push(`Google News redirect used as a source: ${s.url}`);
  if (story.coverage.some((c) => c.url.includes("news.google.com")))
    warnings.push("a coverage link is a Google News redirect; prefer the outlet's own URL");
  if (story.stat && !story.coreFacts.some((f) => f.verdict === "confirmed")) errors.push("stat card needs a confirmed fact behind it");
  if (forPublish && !story.review) errors.push("missing review: Plumb has not approved this story");

  for (const w of warnings) console.log(`  ! ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`  - ${e}`);
    fail(`${errors.length} problem(s) in ${basename(file)}`);
  }
  console.log(`✓ ${basename(file)} passes (${story.coreFacts.length} facts, ${story.claims.length} claims, ${story.coverage.length} outlets, ${allSources.length} sources)`);
  return story;
}

function publish(file: string) {
  const story = { ...check(file, { forPublish: true }), publishedAt: new Date().toISOString() };
  writeStories([story, ...readStories()]);
  const dir = join(DESK, today(), "published");
  mkdirSync(dir, { recursive: true });
  renameSync(file, join(dir, basename(file)));
  console.log(`✓ published ${story.slug}\n  ${SITE}/story/${story.slug} (live after deploy)`);
}

function unpublish(slug: string, reason: string) {
  if (!reason) fail('give a reason: unpublish <slug> "<reason>"');
  const stories = readStories();
  const story = stories.find((s) => s.slug === slug) ?? fail(`not published: ${slug}`);
  const dir = join(DESK, "unpublished");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${slug}.json`), JSON.stringify({ unpublishedAt: new Date().toISOString(), reason, story }, null, 2));
  writeStories(stories.filter((s) => s.slug !== slug));
  console.log(`✓ unpublished ${slug} (copy kept in ${join(dir, `${slug}.json`)})`);
}

function list() {
  for (const s of readStories())
    console.log(`${s.publishedAt.slice(0, 16)}  ${s.slug}\n    ${s.headline}${s.review ? `  [approved by ${s.review.approvedBy}]` : ""}  ${host(SITE)}/story/${s.slug}`);
}

/** OpenFEC through /api/fec, which holds the real data.gov key (Vercel won't release it to this PC). */
async function fec(path: string, pairs: string[]) {
  if (!path) fail("usage: fec <path> [key=value ...]");
  const env = existsSync(join(ROOT, ".env.local")) ? readFileSync(join(ROOT, ".env.local"), "utf8") : "";
  const secret = process.env.CRON_SECRET ?? env.match(/^CRON_SECRET=(.+)$/m)?.[1]?.trim();
  if (!secret) fail("CRON_SECRET missing from .env.local");
  const url = new URL(`${SITE}/api/fec`);
  url.searchParams.set("path", path);
  for (const p of pairs) {
    const i = p.indexOf("=");
    if (i > 0) url.searchParams.append(p.slice(0, i), p.slice(i + 1));
  }
  const r = await fetch(url, { headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(60_000) });
  console.error(`HTTP ${r.status} · FEC rate limit remaining: ${r.headers.get("x-ratelimit-remaining") || "?"}/${r.headers.get("x-ratelimit-limit") || "?"}`);
  console.log(await r.text());
  if (!r.ok) process.exit(1);
}

/** Free licenses only: CC0, public domain, CC BY, CC BY-SA. Never NC/ND, fair use or "all rights reserved". */
const FREE = /^(cc0|public domain|pd\b|pd-|cc by(-sa)? \d|cc-by(-sa)?-\d|attribution)/i;
const stripHtml = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Look up a Commons file's license and author, then attach it to a draft or (owner request) a published story. */
async function image(target: string, file: string, alt: string) {
  if (!target || !file || !alt) fail('usage: image <story dir | slug> "<File:Name.jpg>" "<alt text>"');
  const title = decodeURIComponent(file.replace(/^.*\/wiki\//, "")).replace(/^(File:)?/, "File:").replace(/_/g, " ");
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1600", titles: title }))
    api.searchParams.set(k, v);
  const r = await fetch(api, { headers: { "user-agent": `RockLeak newsroom (${SITE})` }, signal: AbortSignal.timeout(30_000) });
  const page = Object.values(((await r.json()) as { query?: { pages?: Record<string, { missing?: string; imageinfo?: Record<string, unknown>[] }> } }).query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) fail(`not found on Commons: ${title}`);
  const meta = info!.extmetadata as Record<string, { value: string }>;
  const license = stripHtml(meta.LicenseShortName?.value ?? "");
  if (!FREE.test(license) || /\b(nc|nd)\b/i.test(license)) fail(`license "${license}" isn't free enough; pick a CC0, public-domain, CC BY or CC BY-SA photo`);
  const artist = stripHtml(meta.Artist?.value ?? "") || "Unknown author";
  const img: StoryImage = {
    src: String(info!.thumburl ?? info!.url).split("?")[0],
    alt,
    credit: `${artist.length > 80 ? `${artist.slice(0, 77)}…` : artist} / Wikimedia Commons`,
    license,
    ...(meta.LicenseUrl?.value ? { licenseUrl: meta.LicenseUrl.value } : {}),
    sourceUrl: String(info!.descriptionurl),
  };
  if (existsSync(join(target, "article.json"))) {
    const article = readJson<Partial<Story>>(join(target, "article.json"));
    writeFileSync(join(target, "article.json"), JSON.stringify({ ...article, image: img }, null, 2) + "\n");
    console.log(`✓ photo added to ${join(target, "article.json")}; run assemble again`);
  } else {
    const stories = readStories();
    const story = stories.find((s) => s.slug === target) ?? fail(`${target} is neither a story folder nor a published slug`);
    const parsed = StorySchema.shape.image.safeParse(img);
    if (!parsed.success) fail(parsed.error.issues.map((i) => `image.${i.path.join(".")}: ${i.message}`).join("; "));
    story.image = img;
    writeStories(stories);
    console.log(`✓ photo added to published story ${target}`);
  }
  console.log(JSON.stringify(img, null, 2));
}

const [cmd, a, b, ...rest] = process.argv.slice(2);
const [c] = rest;
switch (cmd) {
  case "brief":
    await brief(a);
    break;
  case "prompt":
    prompt(a, b);
    break;
  case "agreement":
    agreement(a, b);
    break;
  case "assemble":
    assemble(a);
    break;
  case "review":
    review(a, b, c);
    break;
  case "check":
    check(a);
    break;
  case "publish":
    publish(a);
    break;
  case "unpublish":
    unpublish(a, b);
    break;
  case "list":
    list();
    break;
  case "fec":
    await fec(a, [b, ...rest].filter(Boolean));
    break;
  case "image":
    await image(a, b, c);
    break;
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(0, 16).join("\n"));
}
