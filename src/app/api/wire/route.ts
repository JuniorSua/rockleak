import { getWireClusters } from "@/lib/feeds";

export async function GET() {
  return Response.json(await getWireClusters());
}
