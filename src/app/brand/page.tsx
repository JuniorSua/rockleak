/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { CONCEPTS, ROUND2 } from "@/lib/brand";

export const metadata: Metadata = { title: "Brand lab", robots: { index: false } };

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="kicker text-accent">Brand lab · Round 2</p>
      <h1 className="headline mt-3 text-[2.6rem] md:text-[3.2rem]">The leak is oil, not blood.</h1>
      <p className="dek mt-4 max-w-3xl text-xl">
        Three refinements of the Capitol direction. Information leaks out as glossy oil with a quiet oil-slick sheen, the
        brand&apos;s only accent. All three share a new architectural wordmark: the A is a roofline with an oil drop where
        the crossbar would be.
      </p>

      <div className="mt-12 space-y-10">
        {ROUND2.map((c) => (
          <section key={c.slug} className="overflow-hidden rounded-2xl border border-rule">
            <div className="grid lg:grid-cols-[1fr_1.4fr]">
              <div className="p-7">
                <div className="flex items-center gap-3">
                  <h2 className="headline text-3xl">{c.name}</h2>
                  {c.recommended && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Recommended · on the site now</span>}
                </div>
                <p className="mt-3 leading-relaxed text-ink/80">{c.idea}</p>
                <p className="mt-3 text-sm text-muted">{c.signals}</p>
                <div className="mt-6 flex items-end gap-5">
                  <img src={`/brand/logos/${c.file}-mark.svg`} alt="" className="h-36 w-36 rounded-xl border border-rule" />
                  <img src={`/brand/logos/${c.file}-favicon.svg`} alt="" className="h-12 w-12" />
                  <img src={`/brand/logos/${c.file}-favicon.svg`} alt="" className="h-8 w-8" />
                  <img src={`/brand/logos/${c.file}-favicon.svg`} alt="" className="h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-rows-2 border-t border-rule lg:border-l lg:border-t-0">
                <div className="flex items-center justify-center p-8">
                  <img src={`/brand/logos/${c.file}-lockup.svg`} alt={`${c.name} lockup`} className="max-h-28 w-full max-w-xl object-contain" />
                </div>
                <div className="flex items-center justify-center bg-ink">
                  <img src={`/brand/logos/${c.file}-lockup-dark.svg`} alt={`${c.name} lockup on dark`} className="max-h-40 w-full object-contain" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <details className="mt-14 rounded-2xl border border-rule">
        <summary className="p-5 font-semibold">Round 1 concepts (for reference)</summary>
        <div className="grid gap-6 border-t border-rule p-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPTS.map((c) => (
            <div key={c.slug}>
              <img src={`/brand/logos/${c.file}-lockup.svg`} alt={c.name} className="w-full" />
              <p className="mt-2 text-sm font-semibold">
                {c.n}. {c.name}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
