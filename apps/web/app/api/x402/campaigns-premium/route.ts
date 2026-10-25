import { NextResponse, connection, type NextRequest } from "next/server";
import { listCampaigns } from "@/lib/server/campaigns";
import { parseX402 } from "@/lib/server/x402";
import { paywall } from "@/lib/server/x402-gate";

export const maxDuration = 60;

const PATH = "/api/x402/campaigns-premium";

/** Paid content: active campaigns with budget analytics that the free /api/campaigns does not compute. */
async function premium(): Promise<NextResponse<unknown>> {
  await connection();
  try {
    const campaigns = (await listCampaigns()).filter((c) => c.active);
    const rows = campaigns.map((c) => ({
      ...c,
      fillRate: c.maxClaims ? c.claims / c.maxClaims : 0,
      claimsLeft: Math.max(0, c.maxClaims - c.claims),
    }));
    const budgetRaw = rows.reduce((sum, c) => sum + BigInt(c.remainingRaw), 0n);
    return NextResponse.json({ summary: { active: rows.length, remainingBudgetRaw: budgetRaw.toString() }, campaigns: rows });
  } catch {
    return NextResponse.json({ error: "Could not read campaigns from the network" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const settings = parseX402(process.env);
  if (!settings) {
    return NextResponse.json({ error: "x402 paywall is not configured on this deployment" }, { status: 503 });
  }
  try {
    return await paywall(premium, settings, PATH, "Active nata campaigns with budget analytics")(req);
  } catch {
    // The paywall needs the facilitator to advertise payment options; fail closed, never serve unpaid.
    return NextResponse.json({ error: "x402 facilitator unavailable" }, { status: 503 });
  }
}
