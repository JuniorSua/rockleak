import type { Metadata } from "next";
import { PersonaBadge } from "@/components/story-bits";
import { PERSONAS } from "@/lib/agents/personas";

export const metadata: Metadata = { title: "The Panel" };

export default function PanelPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <p className="kicker text-signal">Meet the Panel</p>
      <h1 className="headline mt-3 max-w-4xl text-5xl md:text-6xl">Four lenses. One set of facts. Nobody gets to make things up.</h1>
      <p className="mt-5 max-w-3xl text-lg text-ink/75">
        Every RockLeak story is argued by four AI analysts with openly declared perspectives. They all read the same fact
        ledger. They can disagree about what matters and what it means, but each one has to concede what the other side
        gets right. Then Quill, our editor, publishes only what survives.
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {PERSONAS.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col rounded-xl p-6 ${p.id === "Quill" ? "bg-ink text-white lg:col-span-1" : "border border-rule bg-white"}`}
            style={p.id === "Quill" ? undefined : { borderTop: `6px solid ${p.color}` }}
          >
            <PersonaBadge id={p.id} size={56} />
            <p className="headline mt-4 text-3xl">{p.name}</p>
            <p className="kicker mt-1" style={{ color: p.id === "Quill" ? "#f5a524" : p.color }}>
              {p.title} · {p.lean}
            </p>
            <p className={`mt-4 text-sm leading-relaxed ${p.id === "Quill" ? "text-white/80" : "text-ink/80"}`}>{p.bio}</p>
            <p className="headline mt-4 text-lg leading-snug">“{p.motto}”</p>
            <div className="mt-auto pt-5">
              <p className={`kicker text-[0.58rem]! ${p.id === "Quill" ? "text-white/50" : "text-muted"}`}>Reads</p>
              <p className="mt-1 text-xs">{p.reads.join(" · ")}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-6 rounded-xl border-2 border-ink bg-white p-8 md:grid-cols-3">
        {[
          ["Same ledger", "Every panelist argues from the identical, sourced fact ledger. No private facts, no invented quotes."],
          ["Forced concessions", "Each panelist must name what the other side gets right. That's what keeps the debate honest."],
          ["Agreement score", "We measure how much of the ledger every panelist accepts. Low agreement is labeled Contested, not hidden."],
        ].map(([t, d]) => (
          <div key={t}>
            <p className="headline text-xl">{t}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
