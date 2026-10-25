import { NextResponse, connection } from "next/server";
import { listCampaigns } from "@/lib/server/campaigns";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ campaigns: await listCampaigns() });
  } catch {
    return NextResponse.json({ error: "Could not read campaigns from the network" }, { status: 502 });
  }
}
