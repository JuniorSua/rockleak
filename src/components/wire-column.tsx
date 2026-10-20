import { clusterWire, getWire } from "@/lib/feeds";
import { LEAN_COLOR, LEAN_LABEL, LEAN_ORDER } from "@/lib/format";
import type { WireCluster } from "@/lib/types";

export function LeanDots({ cluster }: { cluster: WireCluster }) {
  return (
    <span className="flex gap-1" aria-label="Coverage by lean">
      {LEAN_ORDER.map((l) => {
        const n = cluster.items.filter((i) => i.lean === l).length;
        return <span key={l} title={`${LEAN_LABEL[l]}: ${n}`} className="h-1.5 w-4 rounded-full" style={{ background: n ? LEAN_COLOR[l] : "#e6e6e3" }} />;
      })}
    </span>
  );
}

export function blindspot(c: WireCluster): string | null {
  const left = c.items.filter((i) => i.lean === "left" || i.lean === "lean-left").length;
  const right = c.items.filter((i) => i.lean === "right" || i.lean === "lean-right").length;
  if (c.items.length >= 3 && right === 0) return "Only left & center outlets so far";
  if (c.items.length >= 3 && left === 0) return "Only right & center outlets so far";
  return null;
}

/** Compact list of what every outlet is covering right now. */
export async function WireColumn({ limit = 6 }: { limit?: number }) {
  const { items } = await getWire();
  const clusters = clusterWire(items).slice(0, limit);
  if (!clusters.length) return <p className="text-sm text-muted">Feeds are unreachable right now.</p>;
  return (
    <ol className="divide-y divide-rule">
      {clusters.map((c) => {
        const bs = blindspot(c);
        return (
          <li key={c.id} className="flex items-start justify-between gap-6 py-4">
            <div className="min-w-0">
              <a href={c.items[0].url} target="_blank" rel="noreferrer" className="font-semibold leading-snug hover:underline">
                {c.label}
              </a>
              <p className="mt-1 text-xs text-muted">
                {c.items.length} outlets{bs ? ` · ${bs}` : ""}
              </p>
            </div>
            <LeanDots cluster={c} />
          </li>
        );
      })}
    </ol>
  );
}
