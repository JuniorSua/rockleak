import { cacheLife } from "next/cache";
import type { LiveMarket } from "@/lib/types";

// Public, no-auth market data. Verified 2026-10-20:
// - Kalshi prices are dollar strings ("0.62" = 62%); use the bid/ask midpoint because
//   last_price goes stale on thin markets.
// - Polymarket outcomes/outcomePrices are JSON-encoded string arrays.

const KALSHI = "https://external-api.kalshi.com/trade-api/v2";
const GAMMA = "https://gamma-api.polymarket.com";

const KALSHI_EVENTS = [
  { ticker: "CONTROLH-2026", question: "Which party wins the House?" },
  { ticker: "CONTROLS-2026", question: "Which party wins the Senate?" },
];
const KALSHI_RACES: Record<string, string> = {
  ME: "Maine", NC: "North Carolina", MI: "Michigan", TX: "Texas", GA: "Georgia", IA: "Iowa", AK: "Alaska", NH: "New Hampshire",
};

const POLY_SLUGS = [
  "which-party-will-win-the-house-in-2026",
  "which-party-will-win-the-senate-in-2026",
  "balance-of-power-2026-midterms",
  "texas-senate-election-winner",
  "maine-senate-election-winner",
  "ohio-senate-election-winner",
  "michigan-senate-election-winner",
  "alaska-senate-election-winner",
];

type Json = Record<string, unknown>;

async function getJson(url: string): Promise<Json | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as Json) : null;
  } catch {
    return null;
  }
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number.parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function kalshiProb(m: Json): number | null {
  const bid = num(m.yes_bid_dollars);
  const ask = num(m.yes_ask_dollars);
  if (bid != null && ask != null && ask > 0) return (bid + ask) / 2;
  return num(m.last_price_dollars);
}

function kalshiOutcome(m: Json) {
  const t = String(m.ticker ?? "");
  const sub = String(m.yes_sub_title ?? m.subtitle ?? "");
  const party = t.endsWith("-D") ? "D" : t.endsWith("-R") ? "R" : "";
  if (sub && party && !/party/i.test(sub)) return `${sub} (${party})`;
  return sub || t;
}

async function kalshiEvent(ticker: string, question: string): Promise<LiveMarket[]> {
  const data = await getJson(`${KALSHI}/events/${ticker}?with_nested_markets=true`);
  const event = (data?.event ?? {}) as Json;
  const markets = ((event.markets ?? data?.markets ?? []) as Json[]).filter((m) => m.status !== "settled");
  return markets
    .map((m): LiveMarket | null => {
      const p = kalshiProb(m);
      if (p == null) return null;
      return {
        platform: "Kalshi",
        question: question || String(event.title ?? ticker),
        outcome: kalshiOutcome(m),
        probability: p,
        volume: num(m.volume_fp),
        url: `https://kalshi.com/markets/${String(event.series_ticker ?? ticker.split("-")[0]).toLowerCase()}`,
      };
    })
    .filter((m): m is LiveMarket => m !== null);
}

async function polyEvent(slug: string): Promise<LiveMarket[]> {
  const data = await getJson(`${GAMMA}/events/slug/${slug}`);
  if (!data) return [];
  const title = String(data.title ?? slug);
  const markets = (data.markets ?? []) as Json[];
  return markets
    .filter((m) => !m.closed && m.outcomePrices)
    .map((m): LiveMarket | null => {
      let prices: string[];
      let outcomes: string[];
      try {
        prices = JSON.parse(String(m.outcomePrices));
        outcomes = JSON.parse(String(m.outcomes));
      } catch {
        return null;
      }
      const p = num(prices[0]);
      if (p == null) return null;
      const outcome = String(m.groupItemTitle || outcomes[0] || m.question);
      if (/^(Party|Person) [A-Z]$/.test(outcome)) return null; // unlisted placeholders
      return { platform: "Polymarket", question: title, outcome, probability: p, volume: num(m.volumeNum ?? m.volume), url: `https://polymarket.com/event/${slug}` };
    })
    .filter((m): m is LiveMarket => m !== null && m.probability > 0.005);
}

/** Midterm markets from both platforms. Cached for a minute. */
export async function getMidtermMarkets(): Promise<LiveMarket[]> {
  "use cache";
  cacheLife("minutes");
  const lists = await Promise.all([
    ...KALSHI_EVENTS.map((e) => kalshiEvent(e.ticker, e.question)),
    ...Object.entries(KALSHI_RACES).map(([st, name]) => kalshiEvent(`SENATE${st}-26`, `${name} Senate race`)),
    ...POLY_SLUGS.map(polyEvent),
  ]);
  return lists.flat();
}

/** Group markets into "questions" with outcomes sorted by probability. */
export function groupMarkets(markets: LiveMarket[]) {
  const map = new Map<string, LiveMarket[]>();
  for (const m of markets) {
    const key = `${m.platform}::${m.question}`;
    map.set(key, [...(map.get(key) ?? []), m]);
  }
  return [...map.values()].map((ms) => ms.toSorted((a, b) => b.probability - a.probability));
}
