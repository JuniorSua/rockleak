import Link from "next/link";
import { getMidtermMarkets } from "@/lib/markets";
import { pct } from "@/lib/format";

/** "House: Dem 90% · Senate: Dem 63%" from Kalshi, for the header status line. */
export async function MarketsLine() {
  const ms = await getMidtermMarkets();
  const dem = (q: RegExp) => ms.find((m) => m.platform === "Kalshi" && q.test(m.question) && /democrat/i.test(m.outcome));
  const house = dem(/house/i);
  const senate = dem(/senate\?/i);
  if (!house && !senate) return null;
  return (
    <Link href="/midterms" className="hover:text-ink">
      Betting markets give Democrats{" "}
      {house && (
        <>
          <b className="text-ink">{pct(house.probability)}%</b> for the House
        </>
      )}
      {house && senate && " and "}
      {senate && (
        <>
          <b className="text-ink">{pct(senate.probability)}%</b> for the Senate
        </>
      )}
    </Link>
  );
}
