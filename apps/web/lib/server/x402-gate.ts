import type { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { HTTPFacilitatorClient, x402ResourceServer, type FacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { routeConfig, type X402Settings } from "./x402";

export function facilitatorFor(s: X402Settings): FacilitatorClient {
  const headers: Record<string, string> = s.facilitatorApiKey ? { Authorization: `Bearer ${s.facilitatorApiKey}` } : {};
  return new HTTPFacilitatorClient({
    url: s.facilitatorUrl,
    createAuthHeaders: async () => ({ verify: headers, settle: headers, supported: headers }),
  });
}

/**
 * Wraps a route handler with the x402 paywall. Unpaid requests get HTTP 402 with the payment
 * requirements; the handler only runs after the payment verifies, and settlement happens
 * only when the handler answers with a success status.
 */
export function paywall<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  s: X402Settings,
  path: string,
  description: string,
  facilitator: FacilitatorClient = facilitatorFor(s),
) {
  const server = new x402ResourceServer(facilitator).register(s.network, new ExactStellarScheme());
  return withX402(handler, { [path]: routeConfig(s, description) }, server);
}
