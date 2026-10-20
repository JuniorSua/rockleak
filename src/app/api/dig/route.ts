import { getDig } from "@/lib/dig";

/** The Dig: fresh primary-source records and whether the Wire has covered them yet. */
export async function GET() {
  return Response.json(await getDig());
}
