/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { CONCEPTS } from "@/lib/brand";

export const metadata: Metadata = { title: "Brand lab" };

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="kicker text-accent">Brand lab</p>
      <h1 className="headline mt-3 text-5xl">Five ways to be RockLeak</h1>
      <p className="mt-4 max-w-3xl text-lg text-ink/75">
        Each concept blends bedrock (hard facts), the leak (truth breaking through), politics and world news. Each one is
        shown as a 512px mark, at favicon size, and as a full lockup on light and dark backgrounds. Pick one, or mix and
        match.
      </p>
      <div className="mt-12 space-y-10">
        {CONCEPTS.map((c) => (
          <section key={c.slug} className="overflow-hidden rounded-2xl border border-rule bg-white">
            <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
              <div className="p-7">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-signal">{String(c.n).padStart(2, "0")}</span>
                  <h2 className="headline text-3xl">{c.name}</h2>
                  {c.recommended && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 kicker text-[0.58rem]! text-white">Recommended</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">{c.idea}</p>
                <p className="mt-3 text-sm">
                  <b>Signals:</b> {c.signals}
                </p>
                <div className="mt-6 flex items-end gap-5">
                  <img src={`/brand/logos/${c.file}-mark.svg`} alt="" className="h-36 w-36 rounded-xl border border-rule" />
                  <img src={`/brand/logos/${c.file}-mark.svg`} alt="" className="h-16 w-16" />
                  <img src={`/brand/logos/${c.file}-mark.svg`} alt="" className="h-8 w-8" />
                  <img src={`/brand/logos/${c.file}-mark.svg`} alt="" className="h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-rows-2 border-t border-rule lg:border-l lg:border-t-0">
                <div className="flex items-center justify-center bg-paper p-8">
                  <img src={`/brand/logos/${c.file}-lockup.svg`} alt={`${c.name} lockup`} className="max-h-28 w-full max-w-xl object-contain" />
                </div>
                <div className="flex items-center justify-center bg-ink p-0">
                  <img src={`/brand/logos/${c.file}-lockup-dark.svg`} alt={`${c.name} lockup on dark`} className="max-h-40 w-full object-contain" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
