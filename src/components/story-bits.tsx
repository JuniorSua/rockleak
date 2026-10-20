import Link from "next/link";
import { LEAN_COLOR, LEAN_LABEL, LEAN_ORDER, VERDICT_META, hostOf, pct, unquote } from "@/lib/format";
import { persona } from "@/lib/agents/personas";
import type { Coverage, DebateTurn, MarketRef, SourceRef, Story, Verdict } from "@/lib/types";

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 kicker text-[0.62rem]! text-white"
      style={{ background: m.color }}
    >
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}

export function AgreementMeter({ score, compact = false }: { score: number; compact?: boolean }) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const label = s >= 80 ? "Panel agrees" : s >= 55 ? "Mostly agrees" : s >= 35 ? "Split" : "Deeply split";
  return (
    <div className={compact ? "w-28" : "w-full"}>
      <div className="flex items-baseline justify-between kicker text-[0.6rem]! text-muted">
        <span>Agreement</span>
        <span className="text-ink">{s}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-linear-to-r from-signal via-amber to-emerald-600" style={{ width: `${s}%` }} />
      </div>
      {!compact && <p className="mt-1 text-xs font-semibold text-muted">{label}</p>}
    </div>
  );
}

/** The "spin spectrum": who covered this story, placed from left to right. */
export function SpinSpectrum({ coverage, compact = false }: { coverage: Coverage[]; compact?: boolean }) {
  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-linear-to-r from-lean-left via-lean-center to-lean-right opacity-30" />
        {LEAN_ORDER.map((lean, i) => {
          const n = coverage.filter((c) => c.lean === lean).length;
          if (!n) return null;
          return (
            <span
              key={lean}
              title={`${LEAN_LABEL[lean]}: ${n}`}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-paper text-[0.6rem] font-bold text-white"
              style={{ left: `${8 + i * 21}%`, background: LEAN_COLOR[lean], width: 14 + n * 4, height: 14 + n * 4 }}
            >
              {n > 1 ? n : ""}
            </span>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-1 flex justify-between kicker text-[0.55rem]! text-muted">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>
      )}
    </div>
  );
}

export function MarketChip({ m }: { m: MarketRef }) {
  return (
    <a
      href={m.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-md border border-rule bg-white px-3 py-2 hover:border-ink"
    >
      <span className="headline text-2xl tabular-nums">{pct(m.probability)}%</span>
      <span className="min-w-0 text-xs leading-snug">
        <span className="kicker text-[0.58rem]! text-muted">{m.platform}</span>
        <span className="block font-semibold">{m.question}</span>
      </span>
    </a>
  );
}

export function SourceLinks({ sources }: { sources: SourceRef[] }) {
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-1">
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[0.68rem] text-muted underline decoration-rule underline-offset-2 hover:text-leak"
          title={s.url}
        >
          [{s.tier === "primary" ? "PRIMARY · " : ""}
          {s.label || hostOf(s.url)}]
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
    <div className="flex flex-col rounded-lg border border-rule bg-white p-5" style={{ borderTop: `4px solid ${p.color}` }}>
      <div className="flex items-center gap-3">
        <PersonaBadge id={p.id} />
        <div>
          <p className="font-bold">{p.name}</p>
          <p className="kicker text-[0.58rem]! text-muted">
            {p.title} · {p.lean}
          </p>
        </div>
      </div>
      <p className="headline mt-4 text-lg leading-snug">“{unquote(turn.position)}”</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{turn.argument}</p>
      <div className="mt-auto pt-4">
        <p className="rounded bg-paper p-3 text-xs leading-relaxed">
          <span className="kicker text-[0.58rem]! text-emerald-700">Concedes · </span>
          {turn.concedes}
        </p>
      </div>
    </div>
  );
}

export function StatusTag({ status }: { status: Story["status"] }) {
  const map = {
    developing: { t: "Developing", c: "bg-amber text-ink" },
    verified: { t: "Verified", c: "bg-emerald-600 text-white" },
    contested: { t: "Contested", c: "bg-signal text-white" },
  } as const;
  const m = map[status];
  return <span className={`rounded-sm px-1.5 py-0.5 kicker text-[0.58rem]! ${m.c}`}>{m.t}</span>;
}

export function StoryCard({ story, size = "md" }: { story: Story; size?: "lg" | "md" | "sm" }) {
  const facts = story.coreFacts.filter((f) => f.verdict === "confirmed").length;
  const lead = story.markets[0];
  return (
    <Link href={`/story/${story.slug}`} className="group block">
      <div className="flex items-center gap-2">
        <span className="kicker text-signal">{story.kicker}</span>
        <StatusTag status={story.status} />
      </div>
      <h3
        className={`headline mt-2 group-hover:text-signal ${
          size === "lg" ? "text-[2.6rem] md:text-[3.6rem]" : size === "md" ? "text-[1.6rem]" : "text-[1.25rem]"
        }`}
      >
        {story.headline}
      </h3>
      {size !== "sm" && <p className={`dek mt-3 ${size === "lg" ? "text-xl" : "text-base"}`}>{story.dek}</p>}
      <p className="byline mt-3">
        By <span className="text-ink">The Panel</span> · edited by <span className="text-ink">Quill</span>
      </p>
      {size !== "sm" && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-rule pt-3">
          <AgreementMeter score={story.agreementScore} compact />
          <div className="w-32">
            <SpinSpectrum coverage={story.coverage} compact />
          </div>
          <span className="kicker text-[0.6rem]! text-muted">
            {facts}/{story.coreFacts.length} facts confirmed
          </span>
          {lead && (
            <span className="kicker text-[0.6rem]! text-muted">
              {lead.platform} <span className="text-ink">{pct(lead.probability)}%</span>
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
