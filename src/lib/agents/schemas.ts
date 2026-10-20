import { z } from "zod";

// Zod schemas for every structured hand-off between pipeline stages.

const SourceRef = z.object({
  label: z.string(),
  url: z.string(),
  tier: z.enum(["primary", "wire", "outlet", "social", "market"]),
});

const Verdict = z.enum(["confirmed", "likely", "unverified", "misleading", "false"]);

export const LedgerSchema = z.object({
  topic: z.string(),
  coreFacts: z.array(z.object({ text: z.string(), verdict: Verdict, sources: z.array(SourceRef) })),
  claims: z.array(
    z.object({
      claim: z.string(),
      claimant: z.string(),
      verdict: Verdict,
      explanation: z.string(),
      sources: z.array(SourceRef),
    }),
  ),
  stillUnknown: z.array(z.string()),
});
export type Ledger = z.infer<typeof LedgerSchema>;

export const DebateTurnSchema = z.object({
  position: z.string(),
  argument: z.string(),
  concedes: z.string(),
  /** Indexes into ledger.coreFacts the persona accepts as true. */
  acceptsFacts: z.array(z.number()),
  /** Any ledger fact the persona thinks is overstated, with the reason. */
  challenges: z.array(z.object({ factIndex: z.number(), reason: z.string() })),
});
export type DebateTurnOut = z.infer<typeof DebateTurnSchema>;

export const ArticleSchema = z.object({
  slug: z.string(),
  category: z.enum(["midterms", "congress", "white-house", "courts", "economy", "campaigns", "foreign-policy"]),
  kicker: z.string(),
  headline: z.string(),
  dek: z.string(),
  status: z.enum(["developing", "verified", "contested"]),
  bottomLine: z.string(),
  consensus: z.string(),
  body: z.array(z.string()),
});
export type ArticleOut = z.infer<typeof ArticleSchema>;

export const RedTeamSchema = z.object({
  pass: z.boolean(),
  unsupported: z.array(z.object({ sentence: z.string(), problem: z.string() })),
  headlineAccurate: z.boolean(),
  notes: z.string(),
});
export type RedTeamOut = z.infer<typeof RedTeamSchema>;
