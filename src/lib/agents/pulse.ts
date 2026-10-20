// "The Pulse": Grok searches X for what's trending, what people are claiming and
// which Community Notes are attached. Output is treated as LEADS, never proof.
//
// xAI Responses API with the server-side `x_search` tool (verified against docs.x.ai
// 2026-10-20). Pricing: X Search is billed per post fetched (~$5 / 1k posts), so keep
// the date window tight.

const XAI_URL = "https://api.x.ai/v1/responses";
const XAI_MODEL = process.env.XAI_MODEL ?? "grok-4.7";

export interface Pulse {
  summary: string;
  trending: string[];
  claims: string[];
  communityNote?: string;
}

export function pulseConfigured() {
  return Boolean(process.env.XAI_API_KEY);
}

const EMPTY: Pulse = {
  summary: "X pulse unavailable (Grok not configured). The Panel worked from outlet coverage and primary sources only.",
  trending: [],
  claims: [],
};

function isoDay(offsetDays: number) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export async function xPulse(topic: string, coverage: string): Promise<Pulse> {
  if (!pulseConfigured()) return EMPTY;
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.XAI_API_KEY}`, "content-type": "application/json" },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: XAI_MODEL,
      max_turns: 3,
      tools: [{ type: "x_search", from_date: isoDay(-3), to_date: isoDay(1) }],
      input: [
        {
          role: "system",
          content:
            "You monitor X for a nonpartisan fact-checking newsroom. Report what people on X are saying and claiming about a story, across the political spectrum. Do not judge truth; list claims so they can be fact-checked. Mention any Community Notes you find. Reply with JSON only.",
        },
        {
          role: "user",
          content: `Story: ${topic}\n\nMainstream coverage:\n${coverage}\n\nSearch X and reply as JSON: {"summary": "2-3 sentences on the conversation on X, including how the left and right are reacting", "trending": ["up to 6 hashtags or phrases"], "claims": ["up to 5 specific factual claims circulating, each attributed (e.g. '@handle claims ...')"], "communityNote": "text of a relevant Community Note, or empty string"}`,
        },
      ],
    }),
  });
  if (!res.ok) return { ...EMPTY, summary: `X pulse failed (HTTP ${res.status}).` };
  const data = (await res.json()) as { output?: { type: string; content?: { type: string; text?: string }[] }[] };
  const textOut = (data.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("\n");
  const json = textOut.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { ...EMPTY, summary: textOut.slice(0, 500) || EMPTY.summary };
  try {
    const p = JSON.parse(json) as Partial<Pulse>;
    return {
      summary: String(p.summary ?? ""),
      trending: (p.trending ?? []).map(String).slice(0, 6),
      claims: (p.claims ?? []).map(String).slice(0, 5),
      communityNote: p.communityNote ? String(p.communityNote) : undefined,
    };
  } catch {
    return { ...EMPTY, summary: textOut.slice(0, 500) };
  }
}
