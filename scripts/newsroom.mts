// RockLeak newsroom desk tool. The scheduled Claude Code runs (newsroom/PLAYBOOK.md) use it to
// gather the day's news, validate drafts, and publish/unpublish. Runs on plain Node (24+):
//
//   node scripts/newsroom.mts brief <morning|evening|night>   news brief -> stdout + desk file
//   node scripts/newsroom.mts agreement <debate.json> <factCount>
//   node scripts/newsroom.mts check <draft.json>              schema + newsroom rules
//   node scripts/newsroom.mts publish <draft.json>            check, require Plumb's approval, add to content/stories.json
//   node scripts/newsroom.mts unpublish <slug> "<reason>"     take a story down (kept in the desk)
//   node scripts/newsroom.mts list                            published stories
//   node scripts/newsroom.mts fec <path> [key=value ...]      OpenFEC via the site's key, e.g.
//        fec schedules/schedule_e/ committee_id=C00901223 sort=-expenditure_date per_page=20

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StorySchema } from "../src/lib/story-schema.ts";
import type { Story, WireCluster } from "../src/lib/types.ts";

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
interface Market {
  platform: string;
  question: string;
  outcome: string;
  probability: number;
  url: string;
}

async function brief(edition: string) {
  if (!["morning", "evening", "night"].includes(edition)) fail("edition must be morning, evening or night");
  const [wire, dig, odds] = await Promise.all([
    getJson<WireCluster[]>("/api/wire"),
    getJson<{ leads: Lead[] }>("/api/dig"),
    getJson<Market[]>("/api/odds"),
  ]);
  const now = new Date();
  const out: string[] = [
    `# RockLeak ${edition} brief: ${now.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" })} ET`,
    "",
  ];

  out.push("## Already published (don't repeat; a follow-up needs a genuinely new fact)");
  for (const s of readStories().slice(0, 12)) out.push(`- ${s.publishedAt.slice(0, 10)} · ${s.headline} (/story/${s.slug})`);

  out.push("", "## The Wire: biggest stories across 21 outlets, last 48h");
  if (!wire) out.push("(wire unavailable)");
  for (const c of (wire ?? []).filter((c) => c.items.length >= 2).slice(0, 18)) {
    const leans = [...new Set(c.leans)].join(", ");
    out.push(`- **${c.label}** — ${c.items.length} outlets (${leans}); balance ${c.balance.toFixed(2)}`);
    for (const i of c.items.slice(0, 4)) out.push(`  - ${i.outlet}: ${i.title} <${i.url}>`);
  }

  out.push("", "## The Dig: official records (novelty 1 = no outlet has covered it)");
  if (!dig) out.push("(dig unavailable)");
  for (const l of (dig?.leads ?? []).slice(0, 15)) {
    const covered = l.coveredBy.length ? `covered by ${l.coveredBy.map((c) => c.outlet).join(", ")}` : "UNREPORTED";
    out.push(`- [${l.source} · ${l.kind} · ${l.date ?? "undated"}] **${l.title}** (${covered}; novelty ${l.novelty})`);
    out.push(`  ${l.detail} <${l.url}>`);
  }

  out.push("", "## Markets (expectations, not facts)");
  if (!odds) out.push("(markets unavailable)");
  for (const m of (odds ?? []).slice(0, 24)) out.push(`- ${m.platform} · ${m.question} · ${m.outcome}: ${Math.round(m.probability * 100)}% <${m.url}>`);

  const text = out.join("\n") + "\n";
  const dir = join(DESK, today());
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `brief-${edition}.md`), text);
  console.log(text);
  console.log(`(saved to ${join(dir, `brief-${edition}.md`)})`);
}

/** Same formula as the API pipeline: share of facts each analyst accepts, minus 3 per challenge. */
function agreement(file: string, factCount: string) {
  const turns: { acceptsFacts: number[]; challenges: unknown[] }[] = JSON.parse(readFileSync(file, "utf8"));
  const n = Number(factCount) || 1;
  const accepted = turns.reduce((sum, t) => sum + new Set(t.acceptsFacts.filter((i) => i >= 0 && i < n)).size, 0);
  const challenges = turns.reduce((sum, t) => sum + t.challenges.length, 0);
  console.log(Math.max(0, Math.min(100, Math.round((accepted / (n * turns.length)) * 100 - challenges * 3))));
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
  const story = check(file, { forPublish: true });
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
  console.error(`HTTP ${r.status} · FEC calls left this hour: ${r.headers.get("x-ratelimit-remaining") || "?"}/${r.headers.get("x-ratelimit-limit") || "?"}`);
  console.log(await r.text());
  if (!r.ok) process.exit(1);
}

const [cmd, a, b, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "brief":
    await brief(a);
    break;
  case "agreement":
    agreement(a, b);
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
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(0, 10).join("\n"));
}
