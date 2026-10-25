import { NextResponse } from "next/server";
import { loadCampaign } from "@/lib/server/campaigns";

export async function GET(_req: Request, ctx: RouteContext<"/api/campaigns/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d{1,10}$/.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const campaign = await loadCampaign(BigInt(id));
    if (!campaign) return NextResponse.json({ error: "Unreadable campaign" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
}
