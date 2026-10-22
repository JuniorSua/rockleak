import { authorized } from "@/lib/auth";

// Private FEC pass-through for the newsroom on the owner's PC. Vercel won't hand a Sensitive
// env var back to a laptop, so the newsroom asks the site to make the call with DATA_GOV_API_KEY.
// Locked to read-only OpenFEC endpoints and to callers holding CRON_SECRET.
//   GET /api/fec?path=schedules/schedule_e/&committee_id=C00901223&per_page=20

const FEC = "https://api.open.fec.gov/v1/";
const ALLOWED = /^(schedules\/schedule_[abe]|committee|committees|candidate|candidates|filings|reports)(\/[A-Za-z0-9_\/-]*)?$/;

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const key = process.env.DATA_GOV_API_KEY?.trim() ?? "";
  // Shape check that never reveals the key: real api.data.gov keys are 40 letters and digits.
  if (params.get("path") === "keyinfo")
    return Response.json({ set: key.length > 0, length: key.length, lettersAndDigitsOnly: /^[A-Za-z0-9]*$/.test(key), looksValid: /^[A-Za-z0-9]{40}$/.test(key) });
  const path = (params.get("path") ?? "").replace(/^\/+/, "");
  if (!ALLOWED.test(path) || path.includes("..")) return Response.json({ error: "path not allowed" }, { status: 400 });

  const target = new URL(path, FEC);
  for (const [k, v] of params) if (k !== "path" && k !== "api_key") target.searchParams.append(k, v);
  target.searchParams.set("api_key", key || "DEMO_KEY");

  const r = await fetch(target, { signal: AbortSignal.timeout(30_000) });
  return new Response(r.body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
      // Lets the newsroom confirm a real key is in use (DEMO_KEY reports a far lower limit).
      "x-ratelimit-limit": r.headers.get("x-ratelimit-limit") ?? "",
      "x-ratelimit-remaining": r.headers.get("x-ratelimit-remaining") ?? "",
      "cache-control": "no-store",
    },
  });
}
