import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function anthropic() {
  client ??= new Anthropic();
  return client;
}

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/** One structured call: system + user prompt in, schema-validated object out. */
export async function structured<S extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: S;
  effort?: Effort;
}): Promise<z.infer<S>> {
  const res = await anthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Server-side fallback: if the model declines, the API retries on its recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  if (res.stop_reason === "refusal") {
    throw new Error(`Model declined: ${res.stop_details?.category ?? "unknown"}`);
  }
  if (res.parsed_output == null) throw new Error(`No structured output (stop_reason=${res.stop_reason})`);
  return res.parsed_output as z.infer<S>;
}

/**
 * Open-web research with Claude's server-side web search. Returns research notes
 * (plain text with URLs) that a later structured call turns into the fact ledger.
 */
export async function research(opts: { system: string; prompt: string; maxSearches?: number }): Promise<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.prompt }];
  // Server tools can pause long turns; resume a few times before giving up.
  for (let i = 0; i < 4; i++) {
    const stream = anthropic().beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high" },
      system: opts.system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: opts.maxSearches ?? 12 }],
      messages,
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new Error(`Model declined: ${msg.stop_details?.category ?? "unknown"}`);
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    return msg.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }
  throw new Error("Research did not finish after resuming paused turns");
}
