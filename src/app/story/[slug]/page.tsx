import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShareBar } from "@/components/share-bar";
import {
  AgreementMeter,
  DebateCard,
  MarketChip,
  SourceLinks,
  SpinSpectrum,
  StatCard,
  StatusTag,
  TldrBox,
  VerdictChip,
} from "@/components/story-bits";
import { LEAN_COLOR, shortDate, unquote } from "@/lib/format";
import { readMinutes, storyJsonLd, storyUrl } from "@/lib/seo";
import { jsonLd } from "@/lib/site";
import { allStories, getStory } from "@/lib/stories";
import type { Coverage, Story } from "@/lib/types";

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
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-20 text-sm text-muted">Loading…</div>}>
      <StoryView params={props.params} />
    </Suspense>
  );
}

async function StoryView({ params }: Pick<PageProps<"/story/[slug]">, "params">) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  return <StoryLayout story={story} />;
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="headline mb-5 border-b border-rule pb-3 text-[1.7rem]">
      {children}
    </h2>
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
    <article className="mx-auto max-w-6xl px-5 pb-10 pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(storyJsonLd(story))} />

      <header className="max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="kicker text-accent">{story.kicker}</span>
          <StatusTag status={story.status} />
        </div>
        <h1 className="headline mt-3 text-[2.4rem] md:text-[3.6rem]">{story.headline}</h1>
        <p className="dek mt-4 text-xl">{story.dek}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-rule py-3">
          <p className="byline">
            {shortDate(story.publishedAt)} · {readMinutes(story)} min read · RockLeak Newsroom ·{" "}
            <Link href="/about" className="underline underline-offset-2 hover:text-ink">
              {story.review ? `AI-reported · Approved by ${story.review.approvedBy}, standards editor` : "AI-assisted, source-checked"}
            </Link>
          </p>
          <ShareBar url={url} text={story.social?.xPost ?? story.headline} />
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 max-w-3xl space-y-12">
          <div className="space-y-5">
            <StatCard story={story} size="lg" />
            <TldrBox story={story} />
            {story.newAngle && (
              <div className="border-l-4 border-accent pl-5">
                <p className="kicker text-accent">What others missed</p>
                <p className="mt-1.5 text-[1.05rem] leading-relaxed">{story.newAngle}</p>
              </div>
            )}
          </div>

          <section>
            <H2>The story</H2>
            <div className="prose-rl font-serif text-[1.15rem] leading-[1.75] text-ink/90">
              {story.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section>
            <H2 id="facts">The facts, checked</H2>
            <ol className="space-y-5">
              {story.coreFacts.map((f, i) => (
                <li key={i}>
                  <VerdictChip verdict={f.verdict} />
                  <p className="mt-1 leading-relaxed">{f.text}</p>
                  <div className="mt-1.5">
                    <SourceLinks sources={f.sources} />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <H2>Claims going around</H2>
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
          </section>

          <section>
            <H2>How each side covered it</H2>
            <div className="grid gap-6 md:grid-cols-3">
              {SIDES.map((side) => {
                const items = story.coverage.filter((c) => side.leans.includes(c.lean));
                return (
                  <div key={side.title}>
                    <p className="kicker text-muted">{side.title}</p>
                    <div className="mt-3 space-y-4">
                      {items.length === 0 && <p className="text-sm text-muted">No coverage found.</p>}
                      {items.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" rel="noreferrer" className="block border-l-2 pl-3 hover:opacity-80" style={{ borderColor: LEAN_COLOR[c.lean] }}>
                          <p className="text-xs font-semibold text-muted">{c.outlet}</p>
                          <p className="mt-0.5 text-[0.95rem] font-semibold leading-snug">{c.headline}</p>
                          {c.framing && <p className="mt-1 text-xs leading-relaxed text-muted">{c.framing}</p>}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <H2>Still unknown</H2>
            <ul className="space-y-3">
              {story.stillUnknown.map((u, i) => (
                <li key={i} className="flex gap-3 leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  {u}
                </li>
              ))}
            </ul>
          </section>

          {story.seo?.faq?.length ? (
            <section>
              <H2>Questions people are asking</H2>
              <div className="divide-y divide-rule border-y border-rule">
                {story.seo.faq.map((f, i) => (
                  <details key={i} className="group py-4">
                    <summary className="flex items-center justify-between gap-4 font-semibold">
                      {f.q}
                      <span className="chev text-muted transition">›</span>
                    </summary>
                    <p className="mt-2 leading-relaxed text-ink/80">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {/* The machinery stays available, but out of the way */}
          <details className="rounded-2xl border border-rule">
            <summary className="flex items-center justify-between gap-4 p-5">
              <span>
                <span className="font-semibold">Behind this story</span>
                <span className="block text-sm text-muted">The analyst debate, agreement score, betting odds and X reaction</span>
              </span>
              <span className="chev text-xl text-muted transition">›</span>
            </summary>
            <div className="space-y-8 border-t border-rule p-5">
              <AgreementMeter score={story.agreementScore} />
              <div>
                <p className="mb-3 text-sm font-semibold">Four AI analysts, same facts, different lenses</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {story.debate.map((t) => (
                    <DebateCard key={t.persona} turn={t} />
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-paper p-4 text-sm leading-relaxed">
                  <span className="font-semibold">Where all four agree:</span> {story.consensus}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">On X</p>
                <p className="text-sm leading-relaxed text-ink/80">{story.xPulse.summary}</p>
                {story.xPulse.communityNote && <p className="mt-2 text-sm text-muted">Community Note: {story.xPulse.communityNote}</p>}
              </div>
              <Link href="/about" className="inline-block text-sm font-semibold text-accent hover:underline">
                How a RockLeak story is made →
              </Link>
            </div>
          </details>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
          <div>
            <p className="kicker text-muted">At a glance</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(["confirmed", "misleading", "false"] as const).map((v) => {
                const n = [...story.coreFacts, ...story.claims].filter((x) => x.verdict === v).length;
                return (
                  <div key={v} className="rounded-lg bg-paper py-3">
                    <p className="headline text-2xl">{n}</p>
                    <p className="text-[0.68rem] capitalize text-muted">{v}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="kicker mb-3 text-muted">Who covered it</p>
            <SpinSpectrum coverage={story.coverage} />
          </div>
          {story.markets.length > 0 && (
            <div>
              <p className="kicker mb-3 text-muted">What bettors expect</p>
              <div className="space-y-2">
                {story.markets.map((m, i) => (
                  <MarketChip key={i} m={m} />
                ))}
              </div>
              <p className="mt-2 text-[0.7rem] leading-snug text-muted">Prediction-market prices as of {shortDate(story.markets[0].asOf)}. Odds aren&apos;t facts.</p>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
