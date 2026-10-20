import Link from "next/link";
import { Suspense } from "react";
import { PersonaBadge, StoryCard, VerdictChip } from "@/components/story-bits";
import { BlindspotList, WireColumn } from "@/components/wire-column";
import { OddsBoard } from "@/components/odds-board";
import { OddsCompact } from "@/components/odds-compact";
import { ColumnHead } from "@/components/column-head";
import { DEBATERS } from "@/lib/agents/personas";
import { allStories } from "@/lib/stories";

const BEATS = [
  { t: "Midterms 2026", d: "House, Senate & governor races, polls vs. markets" },
  { t: "Congress", d: "Votes, bills, shutdown fights, who said what on the floor" },
  { t: "White House", d: "Executive orders, statements, and what they actually do" },
  { t: "Courts", d: "Supreme Court & major federal rulings, from the docket" },
  { t: "Money", d: "FEC filings, super PACs, who's funding whom" },
  { t: "Viral claims", d: "What's blowing up on X, checked within hours" },
];

export default function Home() {
  const [lead, ...rest] = allStories();
  return (
    <div className="mx-auto max-w-7xl px-5">
      {/* Front page: Politico-style three columns */}
      <section className="grid gap-8 border-b border-rule py-8 lg:grid-cols-[290px_1fr_320px] lg:gap-0">
        <div className="lg:border-r lg:border-rule lg:pr-7">
          <ColumnHead title="The Odds" href="/odds" live />
          <div className="mt-5">
            <Suspense fallback={<p className="kicker text-muted">Pulling the markets…</p>}>
              <OddsCompact />
            </Suspense>
          </div>
          <div className="mt-8">
            <ColumnHead title="Blindspots" href="/wire" />
            <p className="mt-3 text-xs text-muted">So far, only one side of the media is covering these.</p>
            <Suspense fallback={<p className="mt-3 kicker text-muted">Scanning…</p>}>
              <BlindspotList limit={3} />
            </Suspense>
          </div>
        </div>

        <div className="order-first lg:order-none lg:border-r lg:border-rule lg:px-8">
          <ColumnHead title="Top File" />
          <div className="mt-6">{lead && <StoryCard story={lead} size="lg" />}</div>
          {lead && (
            <div className="mt-6 rounded-lg bg-ink p-5 text-white">
              <p className="kicker text-amber">The Bottom Line</p>
              <p className="mt-2 font-serif text-[1.05rem] leading-relaxed">{lead.bottomLine}</p>
              <ol className="mt-4 space-y-2 border-t border-white/15 pt-4">
                {lead.coreFacts.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/85">
                    <VerdictChip verdict={f.verdict} />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ol>
              <Link href={`/story/${lead.slug}`} className="mt-4 inline-block kicker text-leak hover:text-white">
                Open the full File: ledger, spin & debate →
              </Link>
            </div>
          )}
        </div>

        <div className="lg:pl-7">
          <ColumnHead title="More Files" />
          <div className="mt-5 divide-y divide-rule">
            {rest.map((s) => (
              <div key={s.slug} className="py-5 first:pt-0">
                <StoryCard story={s} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wire */}
      <section className="border-b border-rule py-8">
        <ColumnHead title="The Wire · what every side is covering right now" href="/wire" live />
        <Suspense fallback={<p className="mt-6 kicker text-muted">Reading the feeds…</p>}>
          <WireColumn limit={6} />
        </Suspense>
      </section>

      {/* Odds board */}
      <section className="border-b border-rule py-8">
        <ColumnHead title="Race Board · Kalshi vs. Polymarket" href="/odds" />
        <Suspense fallback={<p className="mt-6 kicker text-muted">Pulling the markets…</p>}>
          <OddsBoard limit={8} />
        </Suspense>
      </section>

      {/* Panel */}
      <section className="my-10 overflow-hidden rounded-2xl bg-ink p-8 text-white md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="kicker text-amber">The Panel</p>
            <h2 className="headline mt-3 text-4xl md:text-5xl">Four analysts. One set of facts. Nobody gets the last word.</h2>
            <p className="mt-4 text-white/75">
              A conservative, a progressive, a centrist and an outsider argue every story, all from the same sourced
              ledger. Each one has to concede something. Only what survives gets published.
            </p>
            <Link href="/panel" className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-amber">
              Meet the Panel
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DEBATERS.map((p) => (
              <div key={p.id} className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <PersonaBadge id={p.id} size={44} />
                <p className="headline mt-3 text-2xl">{p.name}</p>
                <p className="kicker text-[0.58rem]!" style={{ color: p.color }}>
                  {p.title}
                </p>
                <p className="mt-2 text-sm text-white/70">“{p.motto}”</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beats */}
      <section className="py-6">
        <ColumnHead title="What we watch, around the clock" />
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {BEATS.map((b) => (
            <div key={b.t} className="bg-white p-5">
              <p className="headline text-xl">{b.t}</p>
              <p className="mt-1 text-sm text-muted">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
