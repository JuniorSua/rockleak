import { claudeConfigured, research, structured } from "@/lib/agents/claude";
import { DEBATERS, persona } from "@/lib/agents/personas";
import { pulseConfigured, xPulse } from "@/lib/agents/pulse";
import { viralDesk } from "@/lib/agents/viral";
import { ArticleSchema, DebateTurnSchema, LedgerSchema, RedTeamSchema, type Ledger } from "@/lib/agents/schemas";
import { getWireClusters } from "@/lib/feeds";
import { getMidtermMarkets } from "@/lib/markets";
import type { DebateTurn, Story, WireCluster } from "@/lib/types";

// The RockLeak newsroom, end to end:
//   Wire -> Pulse -> Odds -> Record (ledger) -> Panel -> Quill -> Red Team -> Viral Desk -> human review
// Each stage is a plain async function so it can later move to a queue/workflow runner.

export interface PipelineResult {
  cluster: WireCluster;
  story: Story;
  redTeam: { pass: boolean; notes: string; unsupported: { sentence: string; problem: string }[] };
  stages: { stage: string; ms: number }[];
}

export function pipelineStatus() {
  return {
    claude: claudeConfigured(),
    grok: pulseConfigured(),
    ready: claudeConfigured(),
  };
}

/** Score clusters: many outlets + coverage from both sides = most newsworthy. */
export function pickTopCluster(clusters: WireCluster[]): WireCluster | undefined {
  return clusters.toSorted((a, b) => b.items.length * (0.5 + b.balance) - a.items.length * (0.5 + a.balance))[0];
}

async function timed<T>(stages: PipelineResult["stages"], stage: string, fn: () => Promise<T>): Promise<T> {
  const t = performance.now();
  try {
    return await fn();
  } finally {
    stages.push({ stage, ms: Math.round(performance.now() - t) });
  }
}

const RECORD_SYSTEM = `You are "The Record", RockLeak's research desk. You verify political news against primary sources:
congress.gov votes and bill text, FEC filings, court dockets, the Federal Register, official statements and transcripts,
BLS/CBO/Census data, and straight wire reporting (AP, Reuters). Treat partisan outlets and social posts as leads to check,
not as proof. For every fact you report, include the exact URL you read it from. Say plainly when something can't be confirmed.`;

export async function runPipeline(opts: { clusterId?: string } = {}): Promise<PipelineResult> {
  if (!claudeConfigured()) throw new Error("ANTHROPIC_API_KEY is not set");
  const stages: PipelineResult["stages"] = [];

  // 1. Wire: what is everyone covering?
  const clusters = await timed(stages, "wire", () => getWireClusters());
  const cluster = (opts.clusterId && clusters.find((c) => c.id === opts.clusterId)) || pickTopCluster(clusters);
  if (!cluster) throw new Error("No story clusters found in the feeds");
  const coverageText = cluster.items
    .map((i) => `- [${i.lean}] ${i.outlet}: "${i.title}" (${i.url})${i.summary ? ` — ${i.summary}` : ""}`)
    .join("\n");

  // 2 + 3. Pulse (X via Grok) and Odds (Kalshi/Polymarket), in parallel.
  const [pulse, markets] = await Promise.all([
    timed(stages, "pulse", () => xPulse(cluster.label, coverageText)),
    timed(stages, "odds", () => getMidtermMarkets()),
  ]);

  // 4. Record: research notes with web search, then a structured fact ledger.
  const notes = await timed(stages, "record:research", () =>
    research({
      system: RECORD_SYSTEM,
      prompt: `Story: ${cluster.label}

How outlets across the spectrum are covering it:
${coverageText}

What people on X are saying (leads only, unverified):
${pulse.summary}
Claims circulating: ${pulse.claims.join(" | ") || "none captured"}

Research this story. Establish the core facts with primary sources where possible, check each circulating claim,
and list what remains unknown. Cite a URL for everything.`,
    }),
  );
  const ledger = await timed(stages, "record:ledger", () =>
    structured({
      system: RECORD_SYSTEM,
      schema: LedgerSchema,
      effort: "medium",
      prompt: `Turn these research notes into RockLeak's fact ledger: 4-7 core facts and 2-4 checked claims, each with
verdict and source URLs that appear in the notes (never invent a URL), plus 2-4 open questions.

${notes}`,
    }),
  );

  // 5. Panel: four debaters argue from the same ledger, in parallel.
  const ledgerText = formatLedger(ledger);
  const turns = await timed(stages, "panel", () =>
    Promise.all(
      DEBATERS.map(async (p) => {
        const out = await structured({
          system: p.system,
          schema: DebateTurnSchema,
          effort: "medium",
          prompt: `FACT LEDGER\n${ledgerText}\n\nCOVERAGE\n${coverageText}\n\nGive your position (1 sentence), your argument
(2-3 sentences, ledger facts only), what you concede to the other side (1 sentence), which ledger facts you accept
(by index), and any you think are overstated.`,
        });
        return { persona: p.id, ...out };
      }),
    ),
  );
  const agreementScore = scoreAgreement(ledger, turns);

  // 6. Quill writes the article.
  const quill = persona("Quill")!;
  const debateText = turns
    .map((t) => `${t.persona}: ${t.position} ${t.argument} (Concedes: ${t.concedes})`)
    .join("\n");
  const article = await timed(stages, "quill", () =>
    structured({
      system: quill.system,
      schema: ArticleSchema,
      effort: "high",
      prompt: `FACT LEDGER\n${ledgerText}\n\nPANEL DEBATE\n${debateText}\n\nAgreement score: ${agreementScore}/100.
Write the RockLeak story: a kebab-case slug, category, 1-3 word kicker, a catchy but literally accurate headline,
a one-sentence dek, status (contested if agreement < 50), a 2-3 sentence bottom line, the consensus all four panelists
share, and 4-7 short, punchy, neutral paragraphs.`,
    }),
  );

  // 7. Red Team: separate pass that hunts for unsupported sentences and oversold headlines.
  const redTeam = await timed(stages, "red-team", () =>
    structured({
      system:
        "You are RockLeak's Red Team. Your only job is to find statements in a draft that the fact ledger does not support, and headlines that oversell. Be strict.",
      schema: RedTeamSchema,
      effort: "high",
      prompt: `FACT LEDGER\n${ledgerText}\n\nDRAFT\nHeadline: ${article.headline}\nDek: ${article.dek}\nBottom line: ${article.bottomLine}\n\n${article.body.join("\n\n")}`,
    }),
  );

  const draft: Story = {
    ...article,
    publishedAt: new Date().toISOString(),
    agreementScore,
    coreFacts: ledger.coreFacts,
    claims: ledger.claims,
    stillUnknown: ledger.stillUnknown,
    coverage: cluster.items.map((i) => ({ outlet: i.outlet, lean: i.lean, headline: i.title, url: i.url, framing: "" })),
    xPulse: { summary: pulse.summary, trending: pulse.trending, communityNote: pulse.communityNote },
    markets: markets.slice(0, 3).map((m) => ({
      platform: m.platform,
      question: `${m.question} — ${m.outcome}`,
      probability: m.probability,
      url: m.url,
      asOf: new Date().toISOString(),
    })),
    debate: turns.map(({ persona, position, argument, concedes }): DebateTurn => ({ persona, position, argument, concedes })),
  };

  // 8. Viral Desk: plain-English summary, shareable stat, SEO and social copy, with its own accuracy check.
  const story = await timed(stages, "viral-desk", () => viralDesk(draft));

  return { cluster, story, redTeam, stages };
}

function formatLedger(l: Ledger) {
  const facts = l.coreFacts.map((f, i) => `[${i}] (${f.verdict}) ${f.text} — ${f.sources.map((s) => s.url).join(", ")}`);
  const claims = l.claims.map((c) => `CLAIM by ${c.claimant}: "${c.claim}" => ${c.verdict}. ${c.explanation}`);
  return [...facts, ...claims, ...l.stillUnknown.map((u) => `UNKNOWN: ${u}`)].join("\n");
}

/** Share of (persona x fact) pairs accepted, minus a penalty for each challenge. */
function scoreAgreement(ledger: Ledger, turns: { acceptsFacts: number[]; challenges: unknown[] }[]) {
  const n = ledger.coreFacts.length || 1;
  const accepted = turns.reduce((sum, t) => sum + new Set(t.acceptsFacts.filter((i) => i >= 0 && i < n)).size, 0);
  const challenges = turns.reduce((sum, t) => sum + t.challenges.length, 0);
  return Math.max(0, Math.min(100, Math.round((accepted / (n * turns.length)) * 100 - challenges * 3)));
}
