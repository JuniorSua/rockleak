import Link from "next/link";
import { Suspense } from "react";
import { RaceTable } from "@/components/race-table";
import { StatCard, StoryCard } from "@/components/story-bits";
import { WireColumn } from "@/components/wire-column";
import { allStories } from "@/lib/stories";

function Section({ title, sub, href, children }: { title: string; sub?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink pt-5">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="headline text-[1.9rem]">{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-accent hover:underline">
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const [lead, ...rest] = allStories();
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-5 py-10">
      {/* Lead */}
      {lead && (
        <section className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <StoryCard story={lead} size="lg" />
            {lead.tldr && (
              <p className="mt-6 border-l-4 border-accent pl-4 leading-relaxed text-ink/80">
                <span className="font-semibold text-ink">Why it matters: </span>
                {lead.tldr.why}
              </p>
            )}
          </div>
          <Link href={`/story/${lead.slug}`} className="block transition hover:opacity-95">
            <StatCard story={lead} size="lg" />
          </Link>
        </section>
      )}

      {/* More Files */}
      {rest.length > 0 && (
        <Section title="Fact-checked this week" sub="Every claim checked against the official record. Every side's coverage compared.">
          <div className="grid gap-10 md:grid-cols-2">
            {rest.map((s) => (
              <div key={s.slug} className="space-y-5">
                <Link href={`/story/${s.slug}`} className="block">
                  <StatCard story={s} />
                </Link>
                <StoryCard story={s} />
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-16 lg:grid-cols-2">
        <Section title="Midterms: what the money says" sub="Live Kalshi and Polymarket odds. Odds aren't facts, but they move fast." href="/midterms">
          <Suspense fallback={<p className="text-sm text-muted">Loading the markets…</p>}>
            <RaceTable limit={7} />
          </Suspense>
        </Section>

        <Section title="What everyone's covering" sub="Headlines from 21 outlets, left to right, grouped by story." href="/wire">
          <Suspense fallback={<p className="text-sm text-muted">Reading the feeds…</p>}>
            <WireColumn limit={6} />
          </Suspense>
        </Section>
      </div>

      <section className="rounded-2xl bg-paper p-8 md:p-10">
        <h2 className="headline text-3xl">How RockLeak works, in one line</h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink/80">
          We read what every side is saying, check it against the official record, and tell you plainly what&apos;s true,
          what&apos;s spin, and what nobody has reported yet.
        </p>
        <Link href="/about" className="mt-5 inline-block text-sm font-semibold text-accent hover:underline">
          See how a story is made →
        </Link>
      </section>
    </div>
  );
}
