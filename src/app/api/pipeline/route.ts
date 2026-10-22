import { pipelineStatus, runPipeline } from "@/lib/agents/pipeline";
import { authorized } from "@/lib/auth";

export const maxDuration = 300;

/** Which agents have credentials configured. */
export async function GET() {
  return Response.json(pipelineStatus());
}

/** Run the full newsroom on the top story (or `{ "clusterId": "..." }`). Returns the draft; nothing is published. */
export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { clusterId?: string };
  try {
    return Response.json(await runPipeline(body));
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
