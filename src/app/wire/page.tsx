import type { Metadata } from "next";
import { Suspense } from "react";
import { blindspot } from "@/components/wire-column";
import { clusterWire, getWire } from "@/lib/feeds";
import { LEAN_COLOR, LEAN_LABEL, LEAN_ORDER } from "@/lib/format";
import { OUTLETS } from "@/lib/sources";

export const metadata: Metadata = { title: "The Wire" };

export default function WirePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="kicker text-signal">The Wire · live</p>
      <h1 className="headline mt-3 text-5xl">What every side is covering right now</h1>
      <p className="mt-4 max-w-3xl text-lg text-ink/75">
        Our Wire agent reads the political feeds of {OUTLETS.length} outlets from left to right and groups headlines about
        the same event. Coverage from both sides is a signal a story matters. One-sided coverage gets flagged as a{" "}
        <b>blindspot</b>. These are raw headlines, <i>before</i> any fact-checking.
      </p>
      <div className="mt-5 flex flex-wrap gap-4 text-xs">
        {LEAN_ORDER.map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEAN_COLOR[l] }} />
            {LEAN_LABEL[l]}
          </span>
        ))}
      </div>
      <Suspense fallback={<p className="mt-10 kicker text-muted">Reading {OUTLETS.length} feeds…</p>}>
        <WireBoard />
      </Suspense>
    </div>
  );
}

async function WireBoard() {
  const { items, fetchedAt, outletsUp } = await getWire();
  const clusters = clusterWire(items).slice(0, 24);
  const up = new Set(items.map((i) => i.outletId));
  return (
    <>
      <p className="mt-6 font-mono text-xs text-muted">
        {items.length} headlines from {outletsUp}/{OUTLETS.length} outlets · fetched{" "}
        {new Date(fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {clusters.map((c) => {
          const bs = blindspot(c);
          const sorted = LEAN_ORDER.flatMap((l) => c.items.filter((i) => i.lean === l));
          return (
            <section key={c.id} className="rounded-xl border border-rule bg-white p-5">
              <div className="flex items-center justify-between kicker text-[0.6rem]! text-muted">
                <span>{c.items.length} outlets</span>
                {bs && <span className="text-amber">⚠ {bs}</span>}
              </div>
              <h2 className="headline mt-2 text-xl leading-snug">{c.label}</h2>
              <ul className="mt-4 space-y-2">
                {sorted.map((i) => (
                  <li key={i.outletId + i.url} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: LEAN_COLOR[i.lean] }} />
                    <a href={i.url} target="_blank" rel="noreferrer" className="hover:underline">
                      <b>{i.outlet}:</b> {i.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section className="mt-14">
        <h2 className="headline text-2xl">Source status</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {OUTLETS.map((o) => (
            <span key={o.id} className={`rounded-full border px-3 py-1 text-xs ${up.has(o.id) ? "border-rule bg-white" : "border-dashed border-signal/40 text-muted"}`}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: LEAN_COLOR[o.lean] }} />
              {o.name}
              {o.google && <span className="ml-1 text-muted">(via Google News)</span>}
              {!up.has(o.id) && " · offline"}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
