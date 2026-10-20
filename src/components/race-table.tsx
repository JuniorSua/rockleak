import { getMidtermMarkets } from "@/lib/markets";
import { pct } from "@/lib/format";
import type { LiveMarket } from "@/lib/types";

// One row per race, Kalshi and Polymarket side by side, showing each platform's favorite.

interface Row {
  race: string;
  kalshi?: LiveMarket;
  poly?: LiveMarket;
}

function raceKey(m: LiveMarket): string | null {
  const q = m.question;
  if (/balance of power/i.test(q)) return null;
  if (/house/i.test(q)) return "House control";
  if (/which party.*senate/i.test(q)) return "Senate control";
  const st = q.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)?) Senate/);
  return st ? `${st[1]} Senate` : null;
}

function party(outcome: string) {
  if (/\(D\)|democrat|peltola/i.test(outcome)) return "D";
  if (/\(R\)|republican|sullivan/i.test(outcome)) return "R";
  return "";
}

function Cell({ m }: { m?: LiveMarket }) {
  if (!m) return <td className="py-3 pr-4 text-sm text-muted">—</td>;
  const p = party(m.outcome);
  const isParty = /party$/i.test(m.outcome.trim());
  const name = isParty
    ? p === "D" ? "Democrats" : p === "R" ? "Republicans" : m.outcome
    : m.outcome.replace(/\s*\((D|R)\)/, "").replace(/^Sen\. /, "");
  return (
    <td className="py-3 pr-4">
      <div className="flex items-center gap-2">
        <span className="headline w-11 text-xl tabular-nums">{pct(m.probability)}%</span>
        <span className="text-sm">
          {name}
          {p && !isParty && <span className={`ml-1 text-xs font-semibold ${p === "D" ? "text-lean-left" : "text-lean-right"}`}>{p}</span>}
        </span>
      </div>
    </td>
  );
}

export async function RaceTable({ limit }: { limit?: number }) {
  const ms = await getMidtermMarkets();
  const rows = new Map<string, Row>();
  for (const m of ms) {
    const key = raceKey(m);
    if (!key) continue;
    const row = rows.get(key) ?? { race: key };
    const slot = m.platform === "Kalshi" ? "kalshi" : "poly";
    if (!row[slot] || m.probability > row[slot]!.probability) row[slot] = m;
    rows.set(key, row);
  }
  const order = (r: Row) => (r.race.endsWith("control") ? 0 : 1);
  const sorted = [...rows.values()].toSorted((a, b) => order(a) - order(b) || a.race.localeCompare(b.race));
  if (!sorted.length) return <p className="text-sm text-muted">Markets are unreachable right now.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-ink text-xs text-muted">
            <th className="py-2 pr-4 font-semibold">Race</th>
            <th className="py-2 pr-4 font-semibold">Kalshi favorite</th>
            <th className="py-2 pr-4 font-semibold">Polymarket favorite</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {sorted.slice(0, limit ?? sorted.length).map((r) => (
            <tr key={r.race}>
              <td className="py-3 pr-4 font-semibold">{r.race}</td>
              <Cell m={r.kalshi} />
              <Cell m={r.poly} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
