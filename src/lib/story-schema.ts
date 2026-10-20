import { z } from "zod";
import type { Story } from "./types";

// Runtime check for stories written by the newsroom (scripts/newsroom.mts). A story that
// fails this never reaches content/stories.json, so a bad draft can't break the site.
// Plain relative imports only: Node runs the newsroom script directly.

const url = z.url({ protocol: /^https?$/ });
const text = z.string().trim().min(1);

const Source = z.object({
  label: text,
  url,
  tier: z.enum(["primary", "wire", "outlet", "social", "market"]),
});

const Verdict = z.enum(["confirmed", "likely", "unverified", "misleading", "false"]);
const Lean = z.enum(["left", "lean-left", "center", "lean-right", "right"]);

export const StorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase-words-with-dashes").max(90),
  category: z.enum(["midterms", "congress", "white-house", "courts", "economy", "campaigns", "foreign-policy"]),
  kicker: text.max(40),
  headline: text.max(120),
  dek: text.max(320),
  publishedAt: z.iso.datetime({ offset: true }),
  status: z.enum(["developing", "verified", "contested"]),
  agreementScore: z.number().min(0).max(100),
  bottomLine: text,
  coreFacts: z.array(z.object({ text, verdict: Verdict, sources: z.array(Source).min(1) })).min(3),
  claims: z.array(
    z.object({ claim: text, claimant: text, verdict: Verdict, explanation: text, sources: z.array(Source).min(1) }),
  ),
  coverage: z.array(z.object({ outlet: text, lean: Lean, headline: text, url, framing: z.string() })).min(2),
  xPulse: z.object({ summary: text, trending: z.array(z.string()), communityNote: z.string().optional() }),
  markets: z.array(
    z.object({
      platform: z.enum(["Kalshi", "Polymarket"]),
      question: text,
      probability: z.number().min(0).max(100),
      url,
      asOf: z.string().refine((d) => !Number.isNaN(Date.parse(d)), "not a date"),
    }),
  ),
  debate: z.array(z.object({ persona: z.enum(["Grant", "Rosa", "Mercer", "Vex"]), position: text, argument: text, concedes: text })).length(4),
  consensus: text,
  stillUnknown: z.array(text),
  body: z.array(text).min(3),
  stat: z.object({ value: text.max(14), label: text.max(160) }).optional(),
  tldr: z.object({ what: text, why: text, truth: text }).optional(),
  newAngle: text.optional(),
  seo: z
    .object({
      title: text.max(70),
      description: text.max(170),
      keywords: z.array(text),
      faq: z.array(z.object({ q: text, a: text })),
    })
    .optional(),
  social: z
    .object({
      headlineVariants: z.array(z.object({ text, score: z.number(), rationale: z.string() })),
      xPost: text.max(280),
      thread: z.array(text.max(280)),
      shortVideoHook: z.string(),
      shareCardText: z.string(),
    })
    .optional(),
  review: z
    .object({
      approvedBy: text,
      approvedAt: z.iso.datetime({ offset: true }),
      notes: text,
      edition: z.enum(["morning", "evening", "night", "manual"]),
    })
    .optional(),
});

// Compile-time guard: the schema and the Story type must describe the same thing.
type Parsed = z.infer<typeof StorySchema>;
export const _schemaMatchesStory: [Parsed extends Story ? true : false, Story extends Parsed ? true : false] = [true, true];
