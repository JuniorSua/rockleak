import type { LiveMarket } from "./types";

// One row per race with each platform's favorite, plus the "close call" rule the site and the
// newsroom brief share. Pure functions with relative imports only: Node runs scripts/newsroom.mts directly.

export interface RaceRow {
  race: string;
  kalshi?: LiveMarket;
  poly?: LiveMarket;
}

/** A favorite at or under this is a real contest (60-40 or closer). */
export const CLOSE_FAVORITE = 0.6;
/** Kalshi and Polymarket this far apart on the same favorite means traders disagree. */
export const CLOSE_GAP = 0.1;

function raceKey(m: LiveMarket): string | null {
  const q = m.question;
  if (/balance of power/i.test(q)) return null;
  if (/house/i.test(q)) return "House control";
  if (/which party.*senate/i.test(q)) return "Senate control";
  const st = q.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)?) Senate/);
  return st ? `${st[1]} Senate` : null;
}

export function party(outcome: string): "D" | "R" | "" {
  if (/\(D\)|democrat|peltola/i.test(outcome)) return "D";
  if (/\(R\)|republican|sullivan/i.test(outcome)) return "R";
  return "";
}

/** "Sen. Susan Collins (R)" -> "Susan Collins"; "Democratic party" -> "Democrats". */
export function outcomeName(outcome: string) {
  if (/party$/i.test(outcome.trim())) {
    const p = party(outcome);
    return p === "D" ? "Democrats" : p === "R" ? "Republicans" : outcome;
  }
  return outcome.replace(/\s*\((D|R)\)/, "").replace(/^Sen\. /, "");
}

export function raceRows(markets: LiveMarket[]): RaceRow[] {
  const rows = new Map<string, RaceRow>();
  for (const m of markets) {
    const key = raceKey(m);
    if (!key) continue;
    const row = rows.get(key) ?? { race: key };
    const slot = m.platform === "Kalshi" ? "kalshi" : "poly";
    if (!row[slot] || m.probability > row[slot]!.probability) row[slot] = m;
    rows.set(key, row);
  }
  const order = (r: RaceRow) => (r.race.endsWith("control") ? 0 : closeCall(r) ? 1 : 2);
  return [...rows.values()].toSorted((a, b) => order(a) - order(b) || a.race.localeCompare(b.race));
}

const same = (a: LiveMarket, b: LiveMarket) => {
  const pa = party(a.outcome);
  const pb = party(b.outcome);
  if (pa && pb) return pa === pb;
  return outcomeName(a.outcome).toLowerCase() === outcomeName(b.outcome).toLowerCase();
};

/** Why bettors see this race as a real contest, in plain words, or null if they don't. */
export function closeCall({ kalshi: k, poly: p }: RaceRow): string | null {
  if (k && p && !same(k, p)) return "Kalshi and Polymarket pick different winners";
  if (k && p && Math.abs(k.probability - p.probability) >= CLOSE_GAP)
    return `Kalshi and Polymarket are ${Math.round(Math.abs(k.probability - p.probability) * 100)} points apart`;
  const favorites = [k, p].filter((m): m is LiveMarket => !!m);
  if (favorites.length && Math.min(...favorites.map((m) => m.probability)) <= CLOSE_FAVORITE) return "The favorite is at 60% or less";
  return null;
}
