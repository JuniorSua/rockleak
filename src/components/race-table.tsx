import { getMidtermMarkets } from "@/lib/markets";
import { pct } from "@/lib/format";
import { closeCall, outcomeName, party, raceRows } from "@/lib/races";
import type { LiveMarket } from "@/lib/types";

// One row per race, Kalshi and Polymarket side by side, showing each platform's favorite.
// Close calls (60-40 or tighter, or the two platforms disagreeing) are flagged and listed first.

function Cell({ m }: { m?: LiveMarket }) {
  if (!m) return <td className="py-3 pr-3 text-sm text-muted">—</td>;
  const p = party(m.outcome);
  const isParty = /party$/i.test(m.outcome.trim());
  return (
    <td className="py-3 pr-3 align-top">
      <span className="headline block text-xl tabular-nums">{pct(m.probability)}%</span>
      <span className="text-[0.8rem] leading-tight">
        {outcomeName(m.outcome)}
        {p && !isParty && <span className={`ml-1 text-[0.7rem] font-semibold ${p === "D" ? "text-lean-left" : "text-lean-right"}`}>{p}</span>}
      </span>
    </td>
  );
}

export async function RaceTable({ limit }: { limit?: number }) {
  const rows = raceRows(await getMidtermMarkets());
  if (!rows.length) return <p className="text-sm text-muted">Markets are unreachable right now.</p>;
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-ink text-xs text-muted">
          <th className="py-2 pr-3 font-semibold">Race</th>
          <th className="w-[32%] py-2 pr-3 font-semibold">Kalshi favorite</th>
          <th className="w-[32%] py-2 pr-3 font-semibold">Polymarket favorite</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule">
        {rows.slice(0, limit ?? rows.length).map((r) => {
          const close = closeCall(r);
          return (
            <tr key={r.race}>
              <td className="py-3 pr-3 align-top">
                <span className="font-semibold">{r.race}</span>
                {close && (
                  <span className="mt-1 block text-[0.7rem] font-semibold leading-snug text-amber" title={close}>
                    ◆ Close call
                    <span className="block font-normal text-muted">{close}</span>
                  </span>
                )}
              </td>
              <Cell m={r.kalshi} />
              <Cell m={r.poly} />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
