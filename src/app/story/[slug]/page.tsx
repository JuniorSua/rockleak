import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  AgreementMeter,
  DebateCard,
  MarketChip,
  PersonaBadge,
  SourceLinks,
  SpinSpectrum,
  StatusTag,
  VerdictChip,
} from "@/components/story-bits";
import { LEAN_COLOR, LEAN_LABEL, LEAN_ORDER, shortDate, unquote } from "@/lib/format";
import { allStories, getStory } from "@/lib/stories";
import type { Story } from "@/lib/types";

export function generateStaticParams() {
  return allStories().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/story/[slug]">): Promise<Metadata> {
  const story = getStory((await params).slug);
  return story ? { title: story.headline, description: story.dek } : {};
}

export default function StoryPage(props: PageProps<"/story/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-20 kicker text-muted">Opening the file…</div>}>
      <StoryView params={props.params} />
    </Suspense>
  );
}

async function StoryView({ params }: Pick<PageProps<"/story/[slug]">, "params">) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  return <StoryLayout story={story} />;
}

function SectionHead({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="mb-5 flex items-end gap-3 border-b-2 border-ink pb-2">
      <span className="font-mono text-xs font-bold text-signal">{n}</span>
      <h2 className="headline text-2xl md:text-3xl">{title}</h2>
      {sub && <span className="ml-auto hidden pb-1 text-xs text-muted sm:block">{sub}</span>}
    </div>
  );
}

function StoryLayout({ story }: { story: Story }) {
  const byLean = LEAN_ORDER.flatMap((l) => story.coverage.filter((c) => c.lean === l));
  return (
    <article className="mx-auto max-w-7xl px-5 pb-10 pt-10">
      {/* Masthead */}
      <header className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="kicker text-signal">{story.kicker}</span>
          <StatusTag status={story.status} />
          <span className="kicker text-muted">· {shortDate(story.publishedAt)}</span>
        </div>
        <h1 className="headline mt-4 text-4xl md:text-6xl">{story.headline}</h1>
        <p className="mt-5 text-xl leading-relaxed text-ink/75">{story.dek}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted">
          <span className="flex -space-x-2">
            {["Grant", "Rosa", "Mercer", "Vex", "Quill"].map((id) => (
              <PersonaBadge key={id} id={id} size={26} />
            ))}
          </span>
          <span>
            Debated by The Panel · written by Quill ·{" "}
            <span className="font-semibold text-amber">prototype: pending human review</span>
          </span>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* Bottom line */}
          <section className="relative overflow-hidden rounded-lg bg-ink p-6 text-white md:p-8">
            <p className="kicker text-amber">The Bottom Line</p>
            <p className="mt-3 font-serif text-xl leading-relaxed md:text-[1.4rem]">{story.bottomLine}</p>
            <div className="pointer-events-none absolute -right-6 -top-6 font-mono text-[7rem] font-black leading-none text-white/5">
              FACT
            </div>
          </section>

          {/* Ledger */}
          <section className="mt-12">
            <SectionHead n="01" title="The Ledger" sub="One set of facts. Every claim has a receipt." />
            <ol className="divide-y divide-rule">
              {story.coreFacts.map((f, i) => (
                <li key={i} className="grid grid-cols-[2rem_1fr] gap-3 py-4">
                  <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="flex flex-wrap items-start gap-3">
                      <VerdictChip verdict={f.verdict} />
                      <p className="min-w-0 flex-1 font-medium leading-snug">{f.text}</p>
                    </div>
                    <div className="mt-2">
                      <SourceLinks sources={f.sources} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Story */}
          <section className="mt-12">
            <SectionHead n="02" title="The Story" />
            <div className="prose-rl max-w-3xl font-serif text-[1.15rem] leading-[1.75]">
              {story.body.map((p, i) => (
                <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.85]" : ""}>
                  {p}
                </p>
              ))}
            </div>
          </section>

          {/* Claims */}
          <section className="mt-12">
            <SectionHead n="03" title="Claims, Checked" sub="What's being said, and whether it holds up." />
            <div className="grid gap-4 md:grid-cols-2">
              {story.claims.map((c, i) => (
                <div key={i} className="rounded-lg border border-rule bg-white p-5">
                  <VerdictChip verdict={c.verdict} />
                  <p className="headline mt-3 text-lg leading-snug">“{unquote(c.claim)}”</p>
                  <p className="mt-1 text-xs font-semibold text-muted">— {c.claimant}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/80">{c.explanation}</p>
                  <div className="mt-3">
                    <SourceLinks sources={c.sources} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Coverage */}
          <section className="mt-12">
            <SectionHead n="04" title="How They Spun It" sub="Same event, different headlines." />
            <div className="mb-5 max-w-md">
              <SpinSpectrum coverage={story.coverage} />
            </div>
            <div className="space-y-3">
              {byLean.map((c, i) => (
                <a
                  key={i}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-1 rounded-lg border border-rule bg-white p-4 hover:border-ink sm:grid-cols-[150px_1fr]"
                  style={{ borderLeft: `5px solid ${LEAN_COLOR[c.lean]}` }}
                >
                  <div>
                    <p className="font-bold">{c.outlet}</p>
                    <p className="kicker text-[0.58rem]!" style={{ color: LEAN_COLOR[c.lean] }}>
                      {LEAN_LABEL[c.lean]}
                    </p>
                  </div>
                  <div>
                    <p className="font-serif text-lg font-bold leading-snug">{c.headline}</p>
                    <p className="mt-1 text-sm text-muted">
                      <span className="font-semibold text-ink">The frame:</span> {c.framing}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Panel */}
          <section className="mt-12">
            <SectionHead n="05" title="The Panel Debates" sub="Same facts. Four lenses. Each must concede something." />
            <div className="grid gap-4 md:grid-cols-2">
              {story.debate.map((t) => (
                <DebateCard key={t.persona} turn={t} />
              ))}
            </div>
            <div className="mt-5 rounded-lg border-2 border-ink bg-white p-6">
              <p className="kicker text-emerald-700">Where all four agree</p>
              <p className="mt-2 font-serif text-lg leading-relaxed">{story.consensus}</p>
            </div>
          </section>

          {/* Unknown */}
          <section className="mt-12">
            <SectionHead n="06" title="Still Unknown" sub="What nobody can prove yet. We'll update when they can." />
            <ul className="space-y-3">
              {story.stillUnknown.map((u, i) => (
                <li key={i} className="flex gap-3">
                  <span className="redact mt-0.5 h-5 shrink-0 rounded-sm text-xs font-mono">CLASSIFIED</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-rule bg-white p-5">
            <AgreementMeter score={story.agreementScore} />
            <div className="mt-5">
              <p className="kicker mb-2 text-[0.6rem]! text-muted">Coverage spectrum</p>
              <SpinSpectrum coverage={story.coverage} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {(["confirmed", "misleading", "false"] as const).map((v) => {
                const n = [...story.coreFacts, ...story.claims].filter((x) => x.verdict === v).length;
                return (
                  <div key={v} className="rounded bg-paper py-2">
                    <p className="headline text-2xl">{n}</p>
                    <p className="kicker text-[0.55rem]! text-muted">{v}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {story.markets.length > 0 && (
            <div>
              <p className="kicker mb-2 text-muted">The Odds</p>
              <div className="space-y-2">
                {story.markets.map((m, i) => (
                  <MarketChip key={i} m={m} />
                ))}
              </div>
              <p className="mt-2 text-[0.7rem] leading-snug text-muted">
                Prediction-market prices as of {shortDate(story.markets[0].asOf)}. Markets measure what bettors expect, not what is true.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-ink p-5 text-white">
            <p className="kicker text-leak">The Pulse on X</p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{story.xPulse.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {story.xPulse.trending.map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.68rem]">
                  {t}
                </span>
              ))}
            </div>
            {story.xPulse.communityNote && (
              <div className="mt-4 rounded border border-amber/40 bg-amber/10 p-3 text-xs leading-relaxed">
                <p className="kicker mb-1 text-[0.55rem]! text-amber">Community Note</p>
                {story.xPulse.communityNote}
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
