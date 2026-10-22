import { getMidtermMarkets } from "@/lib/markets";

export async function GET() {
  return Response.json(await getMidtermMarkets());
}
