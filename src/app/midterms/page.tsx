import type { Metadata } from "next";
import { Suspense } from "react";
import { OddsBoard } from "@/components/odds-board";
import { RaceTable } from "@/components/race-table";

export const metadata: Metadata = {
  title: "Midterms 2026 Odds: Who Will Win the House and Senate?",
  description:
    "Live 2026 midterm election odds from Kalshi and Polymarket: House and Senate control plus key Senate races in Texas, Maine, Michigan, North Carolina, Georgia, Iowa, Alaska and Ohio.",
  alternates: { canonical: "/midterms" },
};

export default function MidtermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="kicker text-accent">Midterms 2026 · Live</p>
      <h1 className="headline mt-3 max-w-3xl text-[2.6rem] md:text-[3.4rem]">Who&apos;s going to win the House and Senate?</h1>
      <p className="dek mt-4 max-w-3xl text-xl">
        Election Day is Nov. 3. Here&apos;s what people betting real money on Kalshi and Polymarket expect, updated every
        minute. A price of 62¢ means traders think there&apos;s about a 62% chance.
      </p>

      <section className="mt-10">
        <Suspense fallback={<p className="text-sm text-muted">Loading the markets…</p>}>
          <RaceTable />
        </Suspense>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          When the two platforms disagree, that&apos;s a sign the race is genuinely uncertain. Markets show expectations, not
          facts, and they can be wrong. Not betting advice. Polymarket&apos;s international exchange isn&apos;t available to U.S. users.
        </p>
      </section>

      <section className="mt-14 border-t border-ink pt-5">
        <h2 className="headline text-[1.9rem]">Every market we track</h2>
        <Suspense fallback={<p className="mt-4 text-sm text-muted">Loading…</p>}>
          <OddsBoard />
        </Suspense>
      </section>
    </div>
  );
}
