import { getMidtermMarkets } from "@/lib/markets";
import { pct } from "@/lib/format";
import type { LiveMarket } from "@/lib/types";

// Politico-poll-style box: chamber control from both platforms, side by side.
function find(ms: LiveMarket[], platform: LiveMarket["platform"], q: RegExp, outcome: RegExp) {
  return ms.find((m) => m.platform === platform && q.test(m.question) && outcome.test(m.outcome));
}

export async function OddsCompact() {
  const ms = await getMidtermMarkets();
  const rows = [
    { label: "House", q: /house/i },
    { label: "Senate", q: /senate\?|senate in 2026/i },
  ].map((r) => ({
    label: r.label,
    k: find(ms, "Kalshi", r.q, /democrat/i),
    p: find(ms, "Polymarket", r.q, /democrat/i),
  }));
  return (
    <div className="rounded-lg border border-rule bg-[#f6f6f3] p-5">
      <p className="headline text-[1.45rem] leading-tight">What the money says about Nov. 3</p>
      <p className="mt-2 text-sm text-ink/75">Chance Democrats win control, according to live prediction-market prices.</p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-2 font-semibold" />
            <th className="pb-2 font-semibold">Kalshi</th>
            <th className="pb-2 font-semibold">Polymarket</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-rule">
              <td className="py-2 font-semibold">{r.label}</td>
              {[r.k, r.p].map((m, i) => (
                <td key={i} className="py-2 pr-2">
                  {m ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 flex-1 bg-rule">
                        <div className="flex h-full items-center bg-lean-left px-1.5 text-[0.7rem] font-bold text-white" style={{ width: `${pct(m.probability)}%` }}>
                          {pct(m.probability)}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted">n/a</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[0.7rem] text-muted">Markets show what traders expect, not what is true. Updated every minute.</p>
    </div>
  );
}
