import { structured } from "@/lib/agents/claude";
import { ViralCheckSchema, ViralSchema } from "@/lib/agents/schemas";
import type { Story } from "@/lib/types";

// The Viral Desk: turns a verified File into something people click, understand and share,
// then a separate accuracy check strips anything the facts don't support.

const VIRAL_SYSTEM = `You are RockLeak's Viral Desk. You make accurate political journalism spread.
Write for someone who does not follow politics (8th-grade reading level). Headlines must be catchy AND literally true.
Use only facts in the File. Never imply wrongdoing that isn't established, never invent quotes or numbers.
SEO: front-load the names and events people actually search for; titles <= 60 chars, descriptions 140-160 chars.`;

const CHECK_SYSTEM = `You are RockLeak's accuracy red team for promotional copy. Reject any headline, post or summary that
overstates the File's facts, implies an unproven crime, uses a quote not in the File, or could be defamatory. Be strict.`;

function fileText(s: Story) {
  return JSON.stringify({
    headline: s.headline,
    dek: s.dek,
    bottomLine: s.bottomLine,
    coreFacts: s.coreFacts.map((f) => `(${f.verdict}) ${f.text}`),
    claims: s.claims.map((c) => `${c.claimant}: "${c.claim}" => ${c.verdict}. ${c.explanation}`),
    coverage: s.coverage.map((c) => `[${c.lean}] ${c.outlet}: ${c.headline}`),
    stillUnknown: s.stillUnknown,
  });
}

export async function viralDesk(story: Story): Promise<Story> {
  const file = fileText(story);
  const draft = await structured({
    system: VIRAL_SYSTEM,
    schema: ViralSchema,
    effort: "medium",
    prompt: `FILE\n${file}\n\nProduce: one shareable stat backed by a confirmed fact; a plain-English tldr (what/why/truth,
<=30 words each); newAngle (what most coverage missed, grounded in the File); seo (title, description, 5-8 keywords,
3 FAQ Q&As phrased like real Google searches); social (6 headline variants in different formats with 1-10 CTR scores,
an X post <=270 chars, a 4-6 post thread, a 3-second video hook, share-card text <=12 words); and bestHeadline.`,
  });
  const check = await structured({
    system: CHECK_SYSTEM,
    schema: ViralCheckSchema,
    effort: "high",
    prompt: `FILE\n${file}\n\nPROMO COPY\n${JSON.stringify(draft)}\n\nList every rejected string with its field and problem.
Return safeHeadline: bestHeadline if it passes, otherwise the original File headline.`,
  });
  const rejected = new Set(check.rejected.map((r) => r.text));
  return {
    ...story,
    headline: check.safeHeadline || story.headline,
    stat: draft.stat,
    tldr: draft.tldr,
    newAngle: rejected.has(draft.newAngle) ? undefined : draft.newAngle,
    seo: { ...draft.seo, faq: draft.seo.faq.filter((f) => !rejected.has(f.a) && !rejected.has(f.q)) },
    social: {
      ...draft.social,
      headlineVariants: draft.social.headlineVariants.filter((v) => !rejected.has(v.text)),
      xPost: rejected.has(draft.social.xPost) ? story.headline : draft.social.xPost,
      thread: draft.social.thread.filter((t) => !rejected.has(t)),
    },
  };
}
