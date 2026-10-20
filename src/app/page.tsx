import Link from "next/link";
import { Suspense } from "react";
import { Countdown } from "@/components/countdown";
import { DropItem } from "@/components/drop-item";
import { NextDrop } from "@/components/next-drop";
import { RaceTable } from "@/components/race-table";
import { dayHeading, etDay } from "@/lib/format";
import { allStories } from "@/lib/stories";
import type { Story } from "@/lib/types";

// The front page is one calm, stacked feed: newest drop first, grouped by day. No hero, no grid.

function byDay(stories: Story[]) {
  const days = new Map<string, Story[]>();
  for (const s of stories) days.set(etDay(s.publishedAt), [...(days.get(etDay(s.publishedAt)) ?? []), s]);
  return [...days.values()];
}

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5">
      <section className="border-b border-ink py-9 sm:py-12">
        <h1 className="headline text-[2.2rem] sm:text-[3rem]">Politics, minus the noise.</h1>
        <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-ink/70">
          Only the political news that matters today, checked against the record. Every drop answers three questions:
          what happened, why it matters to you, and what&apos;s actually true.
        </p>
        <p className="mono mt-5 text-[0.7rem] uppercase tracking-wider text-muted">
          <NextDrop />
        </p>
      </section>

      {byDay(allStories()).map((day) => (
        <section key={day[0].slug}>
          <h2 className="mono border-b border-rule pb-2 pt-9 text-[0.7rem] font-bold uppercase tracking-widest text-muted">
            {dayHeading(day[0].publishedAt)}
          </h2>
          <div className="divide-y divide-rule">
            {day.map((s) => (
              <DropItem key={s.slug} story={s} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-14 border-t border-ink pt-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="headline text-[1.9rem]">What the bettors think</h2>
          <Link href="/midterms" className="shrink-0 pb-1 text-sm font-semibold text-accent hover:underline">
            All odds →
          </Link>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Live favorites on Kalshi and Polymarket. <span className="font-semibold text-amber">◆ Close call</span> means 60-40 or
          tighter, or the two disagree. Those races get a drop. <Countdown />.
        </p>
        <div className="mt-4">
          <Suspense fallback={<p className="text-sm text-muted">Loading the markets…</p>}>
            <RaceTable limit={8} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
