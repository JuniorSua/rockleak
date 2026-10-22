import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShareBar } from "@/components/share-bar";
import {
  AgreementMeter,
  DebateCard,
  MarketChip,
  ShortVersion,
  SourceLinks,
  SpinSpectrum,
  StatCard,
  StatusTag,
  StoryPhoto,
  TheQuestion,
  VerdictChip,
} from "@/components/story-bits";
import { LEAN_COLOR, dayHeading, dropLabel, etTime, shortDate, unquote } from "@/lib/format";
import { readMinutes, storyJsonLd, storyUrl } from "@/lib/seo";
import { jsonLd } from "@/lib/site";
import { allStories, dropNumber, getStory } from "@/lib/stories";
import type { CoreFact, Coverage, Story } from "@/lib/types";

export function generateStaticParams() {
  return allStories().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/story/[slug]">): Promise<Metadata> {
  const s = getStory((await params).slug);
  if (!s) return {};
  const title = s.seo?.title ?? s.headline;
  const description = s.seo?.description ?? s.dek;
  return {
    title: { absolute: `${title} | RockLeak` },
    description,
    keywords: s.seo?.keywords,
    alternates: { canonical: `/story/${s.slug}` },
    openGraph: { type: "article", title: s.headline, description, url: `/story/${s.slug}`, publishedTime: s.publishedAt, section: s.category },
    twitter: { card: "summary_large_image", title: s.headline, description },
  };
}

export default function StoryPage(props: PageProps<"/story/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-20 text-sm text-muted">Loading…</div>}>
      <StoryView params={props.params} />
    </Suspense>
  );
}

async function StoryView({ params }: Pick<PageProps<"/story/[slug]">, "params">) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  return <StoryLayout story={story} />;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="headline text-[1.6rem]">{children}</h2>;
}

/** One closed row under "Go deeper". */
function Deeper({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between gap-4 py-4">
        <span>
          <span className="font-semibold">{title}</span>
          {sub && <span className="block text-sm text-muted">{sub}</span>}
        </span>
        <span className="chev text-xl text-muted transition">›</span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

/** How many facts show before "Show more". The rest are one tap away. */
const KEY_FACTS = 4;

function FactList({ facts }: { facts: CoreFact[] }) {
  return (
    <ul className="space-y-5">
      {facts.map((f, i) => (
        <li key={i}>
          <VerdictChip verdict={f.verdict} />
          <p className="mt-1 leading-relaxed">{f.text}</p>
          <div className="mt-1">
            <SourceLinks sources={f.sources} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const SIDES: { title: string; leans: Coverage["lean"][] }[] = [
  { title: "Left", leans: ["left", "lean-left"] },
  { title: "Center", leans: ["center"] },
  { title: "Right", leans: ["lean-right", "right"] },
];

function StoryLayout({ story }: { story: Story }) {
  const url = storyUrl(story);
  return (
    <article className="mx-auto max-w-2xl px-5 pb-10 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(storyJsonLd(story))} />
      <Link href="/" className="mono text-[0.7rem] uppercase tracking-wider text-muted hover:text-ink">
        ← All drops
      </Link>

      <header className="mt-6">
        <p className="mono text-[0.68rem] uppercase tracking-wider text-muted">
          <span className="font-bold text-ink">{dropLabel(dropNumber(story))}</span> · {dayHeading(story.publishedAt)} ·{" "}
          {etTime(story.publishedAt)}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="kicker text-accent">{story.kicker}</span>
          <StatusTag status={story.status} />
        </div>
        <h1 className="headline mt-2 text-[2.2rem] md:text-[3rem]">{story.headline}</h1>
        <p className="dek mt-3 text-lg">{story.dek}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-rule py-3">
          <p className="byline">
            {readMinutes(story)} min read ·{" "}
            <Link href="/about" className="underline underline-offset-2 hover:text-ink">
              {story.review ? `AI-reported · Approved by ${story.review.approvedBy}, standards editor` : "AI-reported, source-checked"}
            </Link>
          </p>
          <ShareBar url={url} text={story.social?.xPost ?? story.headline} />
        </div>
      </header>

      {story.question && (
        <div className="mt-7">
          <TheQuestion story={story} url={url} />
        </div>
      )}

      <div className="mt-7">
        {story.image ? <StoryPhoto story={story} /> : <StatCard story={story} />}
        {story.image && story.stat && (
          <p className="mt-5 flex items-baseline gap-3 border-l-4 border-ink pl-3">
            <span className="headline shrink-0 text-[2rem]">{story.stat.value}</span>
            <span className="text-sm leading-snug text-muted">{story.stat.label}</span>
          </p>
        )}
      </div>

      <div className="mt-8">
        <ShortVersion story={story} />
      </div>

      <section className="mt-10">
        <H2>Key facts</H2>
        <p className="mt-1 mb-5 text-sm text-muted">Each one checked against its source. Tap a source to see it yourself.</p>
        <FactList facts={story.coreFacts.slice(0, KEY_FACTS)} />
        {story.coreFacts.length > KEY_FACTS && (
          <details className="group mt-5">
            <summary className="text-sm font-semibold text-accent">
              <span className="group-open:hidden">Show {story.coreFacts.length - KEY_FACTS} more checked facts ›</span>
              <span className="hidden group-open:inline">Show fewer</span>
            </summary>
            <div className="mt-5">
              <FactList facts={story.coreFacts.slice(KEY_FACTS)} />
            </div>
          </details>
        )}
      </section>

      {story.markets.length > 0 && (
        <section className="mt-10">
          <H2>What the bettors think</H2>
          <p className="mt-1 text-sm text-muted">
            Kalshi and Polymarket prices as of {shortDate(story.markets[0].asOf)}. Odds show expectations, not facts.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {story.markets.map((m, i) => (
              <MarketChip key={i} m={m} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <H2>Go deeper</H2>
        <p className="mt-1 text-sm text-muted">Everything behind the short version, for when you want the details.</p>
        <div className="mt-4 divide-y divide-rule border-y border-rule">
          <Deeper title="The full story" sub={`${readMinutes(story)} min read`}>
            {story.newAngle && (
              <div className="mb-5 border-l-4 border-accent pl-4">
                <p className="kicker text-accent">What others missed</p>
                <p className="mt-1 leading-relaxed">{story.newAngle}</p>
              </div>
            )}
            <div className="prose-rl font-serif text-[1.1rem] leading-[1.75] text-ink/90">
              {story.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-paper p-4 leading-relaxed">
              <span className="font-semibold">Bottom line: </span>
              {story.bottomLine}
            </p>
          </Deeper>

          <Deeper title="Claims going around" sub={`${story.claims.length} rated true, false or in between`}>
            <div className="space-y-6">
              {story.claims.map((c, i) => (
                <div key={i}>
                  <VerdictChip verdict={c.verdict} />
                  <p className="mt-1 text-lg font-semibold leading-snug">“{unquote(c.claim)}”</p>
                  <p className="text-sm text-muted">{c.claimant}</p>
                  <p className="mt-2 leading-relaxed text-ink/80">{c.explanation}</p>
                  <div className="mt-1.5">
                    <SourceLinks sources={c.sources} />
                  </div>
                </div>
              ))}
            </div>
          </Deeper>

          <Deeper title="How each side covered it" sub={`${story.coverage.length} outlets, left to right`}>
            <SpinSpectrum coverage={story.coverage} />
            <div className="mt-6 space-y-6">
              {SIDES.map((side) => {
                const items = story.coverage.filter((c) => side.leans.includes(c.lean));
                return (
                  <div key={side.title}>
                    <p className="kicker text-muted">{side.title}</p>
                    <div className="mt-2 space-y-3">
                      {items.length === 0 && <p className="text-sm text-muted">No coverage found.</p>}
                      {items.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" rel="noreferrer" className="block border-l-2 pl-3 hover:opacity-80" style={{ borderColor: LEAN_COLOR[c.lean] }}>
                          <p className="text-xs font-semibold text-muted">{c.outlet}</p>
                          <p className="mt-0.5 font-semibold leading-snug">{c.headline}</p>
                          {c.framing && <p className="mt-1 text-xs leading-relaxed text-muted">{c.framing}</p>}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Deeper>

          {story.stillUnknown.length > 0 && (
            <Deeper title="Still unknown" sub="What nobody can prove yet">
              <ul className="space-y-3">
                {story.stillUnknown.map((u, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                    {u}
                  </li>
                ))}
              </ul>
            </Deeper>
          )}

          {story.seo?.faq?.length ? (
            <Deeper title="Questions people are asking" sub={`${story.seo.faq.length} answered`}>
              <div className="space-y-5">
                {story.seo.faq.map((f, i) => (
                  <div key={i}>
                    <p className="font-semibold">{f.q}</p>
                    <p className="mt-1 leading-relaxed text-ink/80">{f.a}</p>
                  </div>
                ))}
              </div>
            </Deeper>
          ) : null}

          <Deeper title="Behind this story" sub="Four AI analysts argue it out, plus the reaction on X">
            <div className="space-y-7">
              <AgreementMeter score={story.agreementScore} />
              <div className="grid gap-3">
                {story.debate.map((t) => (
                  <DebateCard key={t.persona} turn={t} />
                ))}
              </div>
              <p className="rounded-xl bg-paper p-4 text-sm leading-relaxed">
                <span className="font-semibold">Where all four agree:</span> {story.consensus}
              </p>
              <div>
                <p className="mb-1 text-sm font-semibold">On X</p>
                <p className="text-sm leading-relaxed text-ink/80">{story.xPulse.summary}</p>
                {story.xPulse.communityNote && <p className="mt-2 text-sm text-muted">Community Note: {story.xPulse.communityNote}</p>}
              </div>
            </div>
          </Deeper>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Spot something wrong?{" "}
        <Link href="/about#corrections" className="font-semibold text-accent hover:underline">
          We fix it in public.
        </Link>
      </p>
    </article>
  );
}
