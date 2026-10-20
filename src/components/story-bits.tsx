import Image from "next/image";
import { LEAN_COLOR, LEAN_LABEL, LEAN_ORDER, VERDICT_META, hostOf, pct, unquote } from "@/lib/format";
import { persona } from "@/lib/agents/personas";
import type { Coverage, DebateTurn, MarketRef, QuestionAnswer, SourceRef, Story, Verdict } from "@/lib/types";

/** Quiet verdict label: colored dot + word. */
export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold" style={{ color: m.color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: m.color }} aria-hidden />
      {m.label}
    </span>
  );
}

/** The big shareable number. Doubles as the story's "image". */
export function StatCard({ story, size = "md" }: { story: Story; size?: "lg" | "md" }) {
  if (!story.stat) return null;
  const big = size === "lg";
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-ink text-white ${big ? "p-8 md:p-10" : "p-6"}`}>
      <div className="sheen absolute inset-x-0 top-0 h-1" />
      <p className="kicker text-white/50">{story.kicker}</p>
      <p className={`headline mt-3 ${big ? "text-7xl md:text-8xl" : "text-5xl"}`}>{story.stat.value}</p>
      <p className={`mt-3 text-white/75 ${big ? "text-lg" : "text-sm"}`}>{story.stat.label}</p>
    </div>
  );
}

/** The three questions every drop answers, up front. */
export function ShortVersion({ story }: { story: Story }) {
  if (!story.tldr) return null;
  const rows = [
    ["What happened?", story.tldr.what],
    ["Why does it matter to me?", story.tldr.why],
    ["What's true?", story.tldr.truth],
  ];
  return (
    <section aria-label="The short version" className="divide-y divide-rule border-y border-ink">
      {rows.map(([q, a], i) => (
        <div key={q} className="grid grid-cols-[2rem_1fr] gap-x-2 py-5">
          <span className="mono pt-1 text-xs font-bold text-muted">0{i + 1}</span>
          <div>
            <h2 className="headline text-[1.35rem]">{q}</h2>
            <p className="mt-1.5 text-[1.05rem] leading-relaxed text-ink/85">{a}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export const ANSWER_LABEL: Record<QuestionAnswer, string> = {
  yes: "Yes",
  no: "No",
  partly: "Partly",
  unknown: "Nobody knows yet",
};

/** The hard question, answered from the record right under it, plus an invitation to ask it out loud. */
export function TheQuestion({ story, url }: { story: Story; url: string }) {
  const q = story.question;
  if (!q) return null;
  const isHeadline = q.text === story.headline;
  const ask = `https://x.com/intent/post?text=${encodeURIComponent(`${q.text} Here's what the record says:`)}&url=${encodeURIComponent(url)}`;
  return (
    <section aria-label="The question" className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white">
      <div className="sheen absolute inset-x-0 top-0 h-1" />
      <p className="kicker text-white/50">The question</p>
      {!isHeadline && <p className="headline mt-2 text-[1.6rem]">{q.text}</p>}
      <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm text-white/60">What the record says:</span>
        <span className="headline rounded-md bg-white px-2.5 py-0.5 text-[1.4rem] text-ink">{ANSWER_LABEL[q.answer]}</span>
      </p>
      <p className="mt-3 text-[1.05rem] leading-relaxed text-white/85">{q.short}</p>
      <p className="mt-4 text-xs leading-relaxed text-white/50">Who&apos;s asking: {q.askedBy}</p>
      <a href={ask} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full border border-white/30 px-3.5 py-1.5 text-xs font-semibold hover:border-white">
        Ask it on X →
      </a>
    </section>
  );
}

/** A Commons photo with the credit its license requires. */
export function StoryPhoto({ story }: { story: Story }) {
  const img = story.image;
  if (!img) return null;
  return (
    <figure>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-paper">
        <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 768px) 672px, 100vw" className="object-cover object-[50%_30%]" />
      </div>
      <figcaption className="mt-1.5 text-[0.7rem] text-muted">
        Photo: {img.credit} ·{" "}
        <a href={img.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
          {img.license}
        </a>
      </figcaption>
    </figure>
  );
}

export function AgreementMeter({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const label = s >= 80 ? "Strong agreement" : s >= 55 ? "Mostly agree" : s >= 35 ? "Split" : "Deeply split";
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-muted">
        <span>Panel agreement</span>
        <span className="font-semibold text-ink">
          {s}/100 · {label}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rule">
        <div className="sheen h-full rounded-full" style={{ width: `${s}%` }} />
      </div>
    </div>
  );
}

/** Who covered this story, placed from left to right. */
export function SpinSpectrum({ coverage }: { coverage: Coverage[] }) {
  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
        {LEAN_ORDER.map((lean, i) => {
          const n = coverage.filter((c) => c.lean === lean).length;
          if (!n) return null;
          return (
            <span
              key={lean}
              title={`${LEAN_LABEL[lean]}: ${n}`}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[0.6rem] font-bold text-white"
              style={{ left: `${8 + i * 21}%`, background: LEAN_COLOR[lean], width: 14 + n * 4, height: 14 + n * 4 }}
            >
              {n > 1 ? n : ""}
            </span>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[0.68rem] text-muted">
        <span>Left</span>
        <span>Center</span>
        <span>Right</span>
      </div>
    </div>
  );
}

export function MarketChip({ m }: { m: MarketRef }) {
  return (
    <a href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-rule px-3 py-2 hover:border-ink">
      <span className="headline text-2xl tabular-nums">{pct(m.probability)}%</span>
      <span className="min-w-0 text-xs leading-snug">
        <span className="text-muted">{m.platform}</span>
        <span className="block font-medium">{m.question}</span>
      </span>
    </a>
  );
}

export function SourceLinks({ sources }: { sources: SourceRef[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted underline decoration-rule underline-offset-2 hover:text-accent"
          title={s.url}
        >
          {s.tier === "primary" && <span className="mr-1 font-semibold text-ink">Official record ·</span>}
          {s.label || hostOf(s.url)}
        </a>
      ))}
    </span>
  );
}

export function PersonaBadge({ id, size = 40 }: { id: string; size?: number }) {
  const p = persona(id);
  if (!p) return null;
  return (
    <span
      className="headline inline-flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ background: p.color, width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden
    >
      {p.name[0]}
    </span>
  );
}

export function DebateCard({ turn }: { turn: DebateTurn }) {
  const p = persona(turn.persona);
  if (!p) return null;
  return (
    <div className="flex flex-col rounded-xl border border-rule bg-white p-5">
      <div className="flex items-center gap-3">
        <PersonaBadge id={p.id} size={32} />
        <div>
          <p className="text-sm font-semibold">{p.name}</p>
          <p className="text-xs text-muted">
            {p.title} · {p.lean}
          </p>
        </div>
      </div>
      <p className="mt-3 font-semibold leading-snug">“{unquote(turn.position)}”</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">{turn.argument}</p>
      <p className="mt-auto pt-3 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-ink">Concedes:</span> {turn.concedes}
      </p>
    </div>
  );
}

export function StatusTag({ status }: { status: Story["status"] }) {
  const map = {
    developing: { t: "Developing", c: "text-amber" },
    verified: { t: "Verified", c: "text-emerald-700" },
    contested: { t: "Contested", c: "text-signal" },
  } as const;
  const m = map[status];
  return <span className={`kicker ${m.c}`}>{m.t}</span>;
}
