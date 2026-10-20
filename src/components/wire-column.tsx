import { getWire, clusterWire } from "@/lib/feeds";
import { LEAN_COLOR, LEAN_LABEL, LEAN_ORDER } from "@/lib/format";
import type { WireCluster } from "@/lib/types";

function LeanDots({ cluster }: { cluster: WireCluster }) {
  return (
    <span className="flex gap-1">
      {LEAN_ORDER.map((l) => {
        const n = cluster.items.filter((i) => i.lean === l).length;
        return (
          <span
            key={l}
            title={`${LEAN_LABEL[l]}: ${n}`}
            className="h-2 w-5 rounded-full"
            style={{ background: n ? LEAN_COLOR[l] : "#e4e4df", opacity: n ? 1 : 0.6 }}
          />
        );
      })}
    </span>
  );
}

export function blindspot(c: WireCluster): string | null {
  const left = c.items.filter((i) => i.lean === "left" || i.lean === "lean-left").length;
  const right = c.items.filter((i) => i.lean === "right" || i.lean === "lean-right").length;
  if (c.items.length >= 3 && right === 0) return "Only left & center outlets in our feeds so far";
  if (c.items.length >= 3 && left === 0) return "Only right & center outlets in our feeds so far";
  return null;
}

export async function WireColumn({ limit = 6 }: { limit?: number }) {
  const { items } = await getWire();
  const clusters = clusterWire(items).slice(0, limit);
  if (!clusters.length) return <p className="mt-6 text-sm text-muted">Feeds are unreachable right now.</p>;
  return (
    <ol className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
      {clusters.map((c, i) => {
        const bs = blindspot(c);
        return (
          <li key={c.id} className="border-b border-rule pb-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-signal">{String(i + 1).padStart(2, "0")}</span>
              <LeanDots cluster={c} />
            </div>
            <a href={c.items[0].url} target="_blank" rel="noreferrer" className="headline mt-1.5 block text-lg leading-snug hover:underline">
              {c.label}
            </a>
            <p className="mt-1.5 text-xs text-muted">
              {c.items.length} outlets: {c.items.map((x) => x.outlet).join(", ")}
            </p>
            {bs && <p className="mt-1 kicker text-[0.58rem]! text-amber">⚠ Blindspot · {bs}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Stories covered heavily by one side and ignored by the other. */
export async function BlindspotList({ limit = 3 }: { limit?: number }) {
  const { items } = await getWire();
  const spots = clusterWire(items)
    .map((c) => ({ c, bs: blindspot(c) }))
    .filter((x) => x.bs)
    .slice(0, limit);
  if (!spots.length) return <p className="mt-3 text-sm text-muted">No blindspots right now: both sides are covering the big stories.</p>;
  return (
    <ul className="mt-3 space-y-4">
      {spots.map(({ c, bs }) => (
        <li key={c.id}>
          <p className="kicker text-[0.58rem]! text-amber">⚠ {bs}</p>
          <a href={c.items[0].url} target="_blank" rel="noreferrer" className="headline mt-1 block text-[1.05rem] leading-snug hover:text-signal">
            {c.label}
          </a>
          <p className="mt-0.5 text-xs text-muted">{c.items.map((x) => x.outlet).join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}
