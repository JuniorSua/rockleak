import type { Metadata } from "next";
import Link from "next/link";
import { VerdictChip } from "@/components/story-bits";
import type { Verdict } from "@/lib/types";

export const metadata: Metadata = {
  title: "About RockLeak: Politics, Minus the Noise",
  description:
    "RockLeak drops only the political news that matters today: what happened, why it matters to you, and what's true. Checked against the record, signed off by a neutral editor.",
  alternates: { canonical: "/about" },
};

const STEPS = [
  ["We pick what matters.", "Three times a day, at 9 AM, 5 PM and 10 PM ET, we look at what every side is talking about and pick the one story you actually need. Some days that's nothing, so we post nothing."],
  ["We check it.", "Every fact goes back to its source: court filings, campaign-finance records, votes, official statements. If we can't source it, we don't say it."],
  ["Someone neutral signs off.", "Plumb, our standards editor, didn't write the story and has no side. Plumb swaps the parties to test for double standards, then approves the story, sends it back, or kills it."],
];

const VERDICTS: [Verdict, string][] = [
  ["confirmed", "On the record, or reported by outlets on both sides."],
  ["likely", "Strong evidence, no official record yet."],
  ["unverified", "Someone said it. Nobody's proven it."],
  ["misleading", "Part true, missing context that changes it."],
  ["false", "The record says otherwise."],
];

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="headline scroll-mt-6 border-b border-ink pb-2 text-[1.6rem]">
      {children}
    </h2>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="headline text-[2.4rem] md:text-[3.2rem]">Politics, minus the noise.</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/80">
        You don&apos;t have time to follow politics all day. We do it for you. Check in once and you&apos;re set: what
        happened, why it matters to you, and what&apos;s actually true.
      </p>

      <section className="mt-12">
        <H2>How it works</H2>
        <ol className="mt-5 space-y-6">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[2rem_1fr] gap-x-2">
              <span className="mono pt-0.5 text-xs font-bold text-muted">0{i + 1}</span>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="mt-1 leading-relaxed text-ink/75">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <H2>The odds</H2>
        <p className="mt-4 leading-relaxed text-ink/80">
          We show who people betting real money on Kalshi and Polymarket expect to win. When a race is close, or the two
          platforms disagree, we write a drop about why. Odds aren&apos;t facts, and they&apos;re not betting advice.
        </p>
      </section>

      <section className="mt-12">
        <H2 id="truth">What our labels mean</H2>
        <ul className="mt-5 space-y-3">
          {VERDICTS.map(([v, d]) => (
            <li key={v} className="grid grid-cols-[110px_1fr] gap-2">
              <VerdictChip verdict={v} />
              <span className="leading-relaxed text-ink/80">{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <H2 id="standards">Real talk</H2>
        <ul className="mt-5 space-y-2 leading-relaxed text-ink/80">
          <li>Our stories are researched and written by AI. We never pretend otherwise.</li>
          <li>No side. Same rules for every party.</li>
          <li>Every fact links to its source, so you don&apos;t have to trust us.</li>
          <li>Photos come from Wikimedia Commons, under free licenses, with credit.</li>
        </ul>
      </section>

      <section className="mt-12">
        <H2 id="corrections">Corrections</H2>
        <p className="mt-4 leading-relaxed text-ink/80">
          If we get something wrong, we fix it on the story with a dated note saying what changed. No corrections yet.
        </p>
      </section>

      <Link href="/" className="mt-12 inline-block font-semibold text-accent hover:underline">
        Read the latest drop →
      </Link>
    </div>
  );
}
