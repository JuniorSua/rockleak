// Core RockLeak domain model. Every published story follows this shape, whether it
// was produced by the agent pipeline or seeded by hand.

export type Lean = "left" | "lean-left" | "center" | "lean-right" | "right";

export type Verdict = "confirmed" | "likely" | "unverified" | "misleading" | "false";

export type SourceTier = "primary" | "wire" | "outlet" | "social" | "market";

export interface SourceRef {
  label: string;
  url: string;
  tier: SourceTier;
}

export type Category =
  | "midterms"
  | "congress"
  | "white-house"
  | "courts"
  | "economy"
  | "campaigns"
  | "foreign-policy";

export type PersonaId = "Grant" | "Rosa" | "Mercer" | "Vex";

export interface CoreFact {
  text: string;
  verdict: Verdict;
  sources: SourceRef[];
}

export interface CheckedClaim {
  claim: string;
  claimant: string;
  verdict: Verdict;
  explanation: string;
  sources: SourceRef[];
}

export interface Coverage {
  outlet: string;
  lean: Lean;
  headline: string;
  url: string;
  framing: string;
}

export interface MarketRef {
  platform: "Kalshi" | "Polymarket";
  question: string;
  probability: number; // 0-1 or 0-100; normalized by pct()
  url: string;
  asOf: string;
}

export interface DebateTurn {
  persona: PersonaId;
  position: string;
  argument: string;
  concedes: string;
}

export interface Story {
  slug: string;
  category: Category;
  kicker: string;
  headline: string;
  dek: string;
  publishedAt: string;
  status: "developing" | "verified" | "contested";
  agreementScore: number;
  bottomLine: string;
  coreFacts: CoreFact[];
  claims: CheckedClaim[];
  coverage: Coverage[];
  xPulse: { summary: string; trending: string[]; communityNote?: string };
  markets: MarketRef[];
  debate: DebateTurn[];
  consensus: string;
  stillUnknown: string[];
  body: string[];

  // Reader-first + distribution layer (written by the Viral Desk, checked by the Red Team)
  /** One big shareable number, backed by a confirmed fact. */
  stat?: { value: string; label: string };
  /** Plain-English summary for readers who don't follow politics. */
  tldr?: { what: string; why: string; truth: string };
  /** What this File shows that most coverage missed. */
  newAngle?: string;
  seo?: { title: string; description: string; keywords: string[]; faq: { q: string; a: string }[] };
  social?: {
    headlineVariants: { text: string; score: number; rationale: string }[];
    xPost: string;
    thread: string[];
    shortVideoHook: string;
    shareCardText: string;
  };
  /** Sign-off from Plumb, the neutral standards editor. Nothing publishes without it. */
  review?: { approvedBy: string; approvedAt: string; notes: string; edition: "morning" | "evening" | "night" | "manual" };
}

/** A headline pulled from an outlet's feed by the Wire agent. */
export interface WireItem {
  outletId: string;
  outlet: string;
  lean: Lean;
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string;
}

/** A group of wire items from different outlets that appear to cover the same event. */
export interface WireCluster {
  id: string;
  label: string;
  items: WireItem[];
  leans: Lean[];
  /** 0-1: how evenly the story is covered across the spectrum. */
  balance: number;
}

export interface LiveMarket {
  platform: "Kalshi" | "Polymarket";
  question: string;
  outcome: string;
  probability: number; // 0-1
  volume: number | null;
  url: string;
}
