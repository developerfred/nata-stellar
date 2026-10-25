import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";
import { paywall } from "./x402-gate.ts";
import { parseX402 } from "./x402.ts";

const PAY_TO = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const TOKEN = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const settings = parseX402({ X402_PAY_TO: PAY_TO, X402_ASSET: TOKEN })!;

// Offline facilitator: advertises the Stellar exact scheme and never sees real funds.
const facilitator = {
  getSupported: async () => ({
    kinds: [{ x402Version: 2, scheme: "exact", network: "stellar:testnet" }],
    extensions: [],
    signers: {},
  }),
  verify: async () => ({ isValid: false, invalidReason: "stub" }),
  settle: async () => ({ success: false, errorReason: "stub", transaction: "", network: "stellar:testnet" }),
};

test("unpaid request gets 402 with Stellar requirements and never reaches the handler", async () => {
  let ran = false;
  const handler = paywall(
    async () => {
      ran = true;
      return NextResponse.json({ secret: true });
    },
    settings,
    "/api/x402/campaigns-premium",
    "demo",
    facilitator as never,
  );
  const res = await handler(new NextRequest("http://localhost/api/x402/campaigns-premium"));
  assert.equal(res.status, 402);
  assert.equal(ran, false);
  const header = res.headers.get("PAYMENT-REQUIRED");
  assert.ok(header, "PAYMENT-REQUIRED header present");
  const req = JSON.parse(Buffer.from(header, "base64").toString()).accepts[0];
  assert.equal(req.scheme, "exact");
  assert.equal(req.network, "stellar:testnet");
  assert.equal(req.payTo, PAY_TO);
  assert.equal(req.asset, TOKEN);
  assert.equal(req.amount, "100000");
});
