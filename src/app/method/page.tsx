import type { Metadata } from "next";
import { VerdictChip } from "@/components/story-bits";
import type { Verdict } from "@/lib/types";

export const metadata: Metadata = { title: "Method & standards" };

const STAGES = [
  { n: "01", agent: "The Wire", what: "Reads the political feeds of 20+ outlets across the spectrum (Fox, CNN, Politico, AP, NYT, Newsmax, The Hill…) every few minutes and clusters headlines about the same event.", out: "Story clusters + who is (and isn't) covering them" },
  { n: "02", agent: "The Pulse", what: "Grok searches X for what's trending, what people are claiming, and which Community Notes are attached. Social posts are treated as leads, never as proof.", out: "Trending claims to check" },
  { n: "03", agent: "The Odds", what: "Pulls live Kalshi and Polymarket prices for the races and events in play.", out: "What bettors expect, with volume" },
  { n: "04", agent: "The Record", what: "Goes to primary sources: Congress.gov votes, FEC filings, court dockets, the Federal Register, BLS/CBO data, official statements.", out: "The fact ledger, each fact with a receipt and a verdict" },
  { n: "05", agent: "The Panel", what: "Grant (right), Rosa (left), Mercer (center) and Vex (outsider) debate using only the ledger. Each must concede a point.", out: "Positions, concessions, agreement score" },
  { n: "06", agent: "Quill", what: "Writes the article: verified facts first, every perspective in its strongest form, punchy but literally accurate headline.", out: "Draft story" },
  { n: "07", agent: "The Red Team", what: "A separate check that hunts for any sentence the ledger doesn't support and any headline that oversells. Fails go back to Quill.", out: "Pass/fail + flagged sentences" },
  { n: "08", agent: "Human editor", what: "A person approves before anything is published. Corrections are logged publicly.", out: "Published story" },
];

const VERDICTS: [Verdict, string][] = [
  ["confirmed", "Backed by a primary source or multiple independent outlets across the spectrum."],
  ["likely", "Strong evidence, but not yet backed by a primary record."],
  ["unverified", "Reported or claimed, but we can't confirm it yet."],
  ["misleading", "Technically contains truth but leaves out context that changes the meaning."],
  ["false", "Contradicted by primary sources or verified evidence."],
];

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <p className="kicker text-signal">Method &amp; Standards</p>
      <h1 className="headline mt-3 max-w-4xl text-5xl md:text-6xl">How a RockLeak story gets made</h1>
      <p className="mt-5 max-w-3xl text-lg text-ink/75">
        Most outlets pick a side and then gather facts. We collect every side&apos;s coverage, strip it down to what can be
        proven, then let opposing analysts fight over what it means. Eight stages, every one visible to you.
      </p>

      <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink bg-ink md:grid-cols-2">
        {STAGES.map((s) => (
          <li key={s.n} className="bg-paper p-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-bold text-signal">{s.n}</span>
              <span className="headline text-2xl">{s.agent}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{s.what}</p>
            <p className="mt-3 font-mono text-[0.7rem] text-muted">→ {s.out}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="headline text-3xl">The verdict scale</h2>
          <ul className="mt-5 space-y-4">
            {VERDICTS.map(([v, d]) => (
              <li key={v} className="flex items-start gap-3">
                <span className="w-28 shrink-0">
                  <VerdictChip verdict={v} />
                </span>
                <span className="text-sm leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="headline text-3xl">Source tiers</h2>
          <ol className="mt-5 space-y-3 text-sm leading-relaxed">
            <li><b>1 · Primary:</b> votes, filings, court records, official data, video of the event itself.</li>
            <li><b>2 · Wire:</b> AP, Reuters and other straight-news wire reporting.</li>
            <li><b>3 · Outlets:</b> named reporting from outlets across the spectrum. Agreement across the left and the right counts for more than volume from one side.</li>
            <li><b>4 · Social:</b> X posts and Community Notes. Great for leads and finding what people believe; never enough on their own.</li>
            <li><b>5 · Markets:</b> Kalshi and Polymarket odds. They tell you what people expect, not what is true.</li>
          </ol>
        </section>
      </div>

      <section className="mt-14 rounded-xl bg-ink p-8 text-white">
        <h2 className="headline text-3xl">Our rules</h2>
        <ul className="mt-5 grid gap-4 text-sm leading-relaxed text-white/85 md:grid-cols-2">
          <li>■ No invented quotes, numbers or events. If the ledger doesn&apos;t have it, we don&apos;t say it.</li>
          <li>■ Headlines must be catchy <i>and</i> literally true. The Red Team fails any headline that oversells.</li>
          <li>■ We link to the outlets we summarize and quote only a little. Read them in full at the source.</li>
          <li>■ Every perspective is presented in its strongest form. Low agreement is labeled, not hidden.</li>
          <li>■ A human approves every story. Corrections are dated and logged on the story.</li>
          <li>■ The AI personas are openly AI. They are not real people and never pretend to be.</li>
        </ul>
      </section>
    </div>
  );
}
