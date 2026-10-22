import type { Metadata } from "next";
import { Suspense } from "react";
import { Countdown } from "@/components/countdown";
import { RaceTable } from "@/components/race-table";

export const metadata: Metadata = {
  title: "Midterms 2026 Odds: Who Will Win the House and Senate?",
  description:
    "Live 2026 midterm election odds from Kalshi and Polymarket: House and Senate control plus key Senate races, with the close calls flagged.",
  alternates: { canonical: "/midterms" },
};

export default function MidtermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="mono text-[0.7rem] uppercase tracking-wider text-muted">
        Midterms 2026 · <Countdown />
      </p>
      <h1 className="headline mt-3 text-[2.4rem] md:text-[3.2rem]">Who&apos;s going to win?</h1>
      <p className="mt-3 text-lg leading-relaxed text-ink/75">
        What people betting real money on Kalshi and Polymarket expect, live. 62% means traders think there&apos;s about a
        62% chance.
      </p>
      <p className="mt-4 border-l-4 border-amber pl-3 text-sm leading-relaxed">
        <span className="font-semibold text-amber">◆ Close call</span> means the favorite is at 60% or less, or Kalshi and
        Polymarket disagree. Those are the races to watch, and they get a drop.
      </p>

      <section className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted">Loading the markets…</p>}>
          <RaceTable />
        </Suspense>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Markets show expectations, not facts, and they can be wrong. Not betting advice. Polymarket&apos;s international
          exchange isn&apos;t available to U.S. users.
        </p>
      </section>
    </div>
  );
}
