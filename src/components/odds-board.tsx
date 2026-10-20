import { getMidtermMarkets, groupMarkets } from "@/lib/markets";
import { pct } from "@/lib/format";
import type { LiveMarket } from "@/lib/types";

function partyColor(outcome: string) {
  if (/\(D\)|democrat|peltola/i.test(outcome)) return "#2563eb";
  if (/\(R\)|republican|sullivan/i.test(outcome)) return "#dc2626";
  return "#8b5cf6";
}

// Polymarket reports volume in USD; Kalshi reports it in contracts traded.
function vol(v: number, platform: LiveMarket["platform"]) {
  if (!v) return "";
  const n = v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`;
  return platform === "Polymarket" ? `$${n} vol` : `${n} contracts`;
}

function MarketCard({ group }: { group: LiveMarket[] }) {
  const top = group[0];
  const total = group.reduce((s, m) => s + (m.volume ?? 0), 0);
  return (
    <a href={top.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-rule bg-white p-5 hover:border-ink">
      <div className="flex items-center justify-between kicker text-[0.58rem]! text-muted">
        <span>{top.platform}</span>
        <span>{vol(total, top.platform)}</span>
      </div>
      <p className="mt-2 font-bold leading-snug">{top.question}</p>
      <div className="mt-4 space-y-2.5">
        {group.slice(0, 3).map((m) => (
          <div key={m.outcome}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="truncate pr-2">{m.outcome}</span>
              <span className="headline text-xl tabular-nums">{pct(m.probability)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-rule">
              <div className="h-full rounded-full" style={{ width: `${pct(m.probability)}%`, background: partyColor(m.outcome) }} />
            </div>
          </div>
        ))}
      </div>
    </a>
  );
}

export async function OddsBoard({ limit }: { limit?: number }) {
  const groups = groupMarkets(await getMidtermMarkets());
  if (!groups.length) return <p className="mt-6 text-sm text-muted">Markets are unreachable right now.</p>;
  // Lead with chamber control from both platforms, then the races.
  const isControl = (g: LiveMarket[]) => /house|senate\?|balance/i.test(g[0].question) && !/race|winner/i.test(g[0].question);
  const sorted = [...groups.filter(isControl), ...groups.filter((g) => !isControl(g))];
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {sorted.slice(0, limit ?? sorted.length).map((g) => (
        <MarketCard key={`${g[0].platform}${g[0].question}`} group={g} />
      ))}
    </div>
  );
}
