import { pipelineStatus, runPipeline } from "@/lib/agents/pipeline";
import { authorized } from "@/lib/auth";

export const maxDuration = 300;

/** API-key mode (optional): drafts the top story via the Anthropic API. The live newsroom runs on the
 *  Claude subscription instead (newsroom/PLAYBOOK.md), so no Vercel cron calls this by default. */
export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!pipelineStatus().ready) return Response.json({ skipped: "ANTHROPIC_API_KEY not set" });
  const result = await runPipeline();
  // TODO: persist result.story as a draft in the database once storage is chosen.
  return Response.json({ drafted: result.story.slug, redTeamPass: result.redTeam.pass, stages: result.stages });
}
