import type { Metadata } from "next";
import { PersonaBadge, VerdictChip } from "@/components/story-bits";
import { PERSONAS } from "@/lib/agents/personas";
import type { Verdict } from "@/lib/types";

export const metadata: Metadata = {
  title: "How RockLeak Works: AI-Assisted, Source-Checked Political News",
  description:
    "How RockLeak reports: we read every side, check claims against official records, compare coverage, dig up unreported records, and run every story past an independent standards check.",
  alternates: { canonical: "/about" },
};

const STEPS = [
  ["Read every side", "Our Wire reads 21 outlets from left to right, from Fox and Newsmax to CNN and The Guardian, and groups headlines about the same event."],
  ["Dig for what's missing", "We scan official records (campaign-finance filings, executive orders, court dockets, votes) and flag the ones no outlet has covered yet."],
  ["Listen to X", "Grok scans X for what's trending, what people claim and which Community Notes appear. Posts are leads, never proof."],
  ["Check the record", "Every fact needs a source, ideally an official one. Each gets a verdict, from Confirmed to False."],
  ["Argue it out", "Four AI analysts with openly different views debate the same facts, and each must concede a point. Disagreement is labeled, not hidden."],
  ["Write it plainly", "An AI editor writes the story for someone who doesn't follow politics: what happened, why it matters, what's true."],
  ["Red-team it", "A separate check hunts for any sentence the sources don't support and any headline that oversells."],
  ["A neutral editor signs off", "Plumb, our standards editor, didn't write the story and has no side. Plumb opens the sources, swaps the parties to test for double standards, and approves, sends back or kills every story."],
];

const VERDICTS: [Verdict, string][] = [
  ["confirmed", "Backed by an official record or by independent outlets on both sides."],
  ["likely", "Strong evidence, but no official record yet."],
  ["unverified", "Claimed or reported, but we can't confirm it."],
  ["misleading", "Contains some truth but leaves out context that changes the meaning."],
  ["false", "Contradicted by official records or verified evidence."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="kicker text-accent">How it works</p>
      <h1 className="headline mt-3 text-[2.6rem] md:text-[3.4rem]">News you can check yourself.</h1>
      <p className="dek mt-5 text-xl">
        Most outlets pick a side, then gather facts. RockLeak starts with the official record, compares how every side
        covered it, and tells you plainly what&apos;s true, what&apos;s spin, and what nobody has reported yet. Every
        fact links to its source so you never have to take our word for it.
      </p>

      <section className="mt-14">
        <h2 className="headline border-b border-ink pb-3 text-[1.9rem]">How a story gets made</h2>
        <ol className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="headline w-7 shrink-0 text-2xl text-muted">{i + 1}</span>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-ink/75">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="headline border-b border-ink pb-3 text-[1.9rem]">The newsroom</h2>
        <p className="mt-4 leading-relaxed text-ink/75">
          Behind every story, four AI analysts with openly declared points of view argue from the same set of facts.
          Quill writes up what survives the debate, and Plumb decides whether it runs. They&apos;re all AI and never
          pretend to be people. You can read the debate under &ldquo;Behind this story&rdquo; on any article.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <div key={p.id} className="flex gap-4 rounded-xl border border-rule p-5">
              <PersonaBadge id={p.id} size={40} />
              <div>
                <p className="font-semibold">
                  {p.name} <span className="font-normal text-muted">· {p.title}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{p.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="headline border-b border-ink pb-3 text-[1.9rem]">What our verdicts mean</h2>
        <ul className="mt-6 space-y-4">
          {VERDICTS.map(([v, d]) => (
            <li key={v} className="grid gap-1 sm:grid-cols-[130px_1fr]">
              <VerdictChip verdict={v} />
              <span className="leading-relaxed text-ink/80">{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="standards" className="mt-14 scroll-mt-6">
        <h2 className="headline border-b border-ink pb-3 text-[1.9rem]">Our standards</h2>
        <ul className="mt-6 space-y-3 leading-relaxed text-ink/80">
          <li>No invented quotes, numbers or events. If we can&apos;t source it, we don&apos;t say it.</li>
          <li>Headlines must be catchy and literally true.</li>
          <li>Official records beat reporting; reporting from both sides beats reporting from one; social posts are leads, not proof.</li>
          <li>We link to the outlets we compare and quote only briefly. Read them in full at the source.</li>
          <li>Prediction-market odds show expectations, not facts.</li>
          <li>Stories are reported and written by AI and approved by an independent AI standards editor. Our editors can pull any story at any time.</li>
          <li>The newsroom checks in three times a day (9 a.m., 5 p.m. and 10 p.m. Eastern) and publishes only when a story clears the bar.</li>
        </ul>
      </section>

      <section id="corrections" className="mt-14 scroll-mt-6">
        <h2 className="headline border-b border-ink pb-3 text-[1.9rem]">Corrections</h2>
        <p className="mt-4 leading-relaxed text-ink/80">
          When we get something wrong, we fix it on the story with a dated note explaining what changed. No corrections
          have been issued yet. Spot something wrong? Tell us and we&apos;ll check it against the record.
        </p>
      </section>
    </div>
  );
}
