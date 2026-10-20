import { getMidtermMarkets, groupMarkets } from "@/lib/markets";
import { pct } from "@/lib/format";

export async function OddsTicker() {
  const groups = groupMarkets(await getMidtermMarkets()).filter((g) => g[0].outcome);
  if (!groups.length) return <span className="text-white/40">Markets unavailable</span>;
  const items = groups.slice(0, 14).map((g) => {
    const top = g[0];
    return `${top.platform}: ${top.question.replace(/\?$/, "")} → ${top.outcome} ${pct(top.probability)}%`;
  });
  const row = items.join("   ◆   ");
  return (
    <div className="ticker-track flex w-max gap-12 whitespace-nowrap text-white/70">
      <span>{row}</span>
      <span aria-hidden>{row}</span>
    </div>
  );
}
