#!/usr/bin/env node
// Paying-client check for the x402 paywall. Needs a running app with X402_PAY_TO set and a funded
// testnet account holding the paywall token. The secret comes from the environment and is never printed.
//   X402_CLIENT_SECRET=S... [X402_URL=http://localhost:3000/api/x402/campaigns-premium] pnpm x402:e2e
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const url = process.env.X402_URL ?? "http://localhost:3000/api/x402/campaigns-premium";
const secret = process.env.X402_CLIENT_SECRET?.trim();
const explorer = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet";
if (!secret || !/^S[A-Z2-7]{55}$/.test(secret)) {
  console.error("Set X402_CLIENT_SECRET to a funded testnet secret key (S...).");
  process.exit(2);
}

let failed = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : ` (${detail})`}`);
  if (!ok) failed++;
};
const leaks = (text) => /"campaigns"\s*:|"summary"\s*:/.test(text);

// 1. Unpaid: 402 with Stellar requirements, no content.
const unpaid = await fetch(url);
const unpaidBody = await unpaid.text();
check(unpaid.status === 402, "unpaid request answers 402", `got ${unpaid.status}: ${unpaidBody.slice(0, 120)}`);
check(!leaks(unpaidBody), "unpaid body does not leak the premium payload");
let req = null;
try {
  req = JSON.parse(Buffer.from(unpaid.headers.get("payment-required") ?? "", "base64").toString()).accepts?.[0];
} catch {}
check(req?.scheme === "exact" && String(req?.network).startsWith("stellar:"), "requirements are exact on Stellar", JSON.stringify(req));
if (req) console.log(`      asks ${req.amount} raw of ${req.asset} -> ${req.payTo} on ${req.network}`);

// 2. Bad payment header: must not unlock the content.
const bad = await fetch(url, { headers: { "PAYMENT-SIGNATURE": Buffer.from("{}").toString("base64") } });
const badBody = await bad.text();
check(bad.status === 402 || bad.status === 400, "garbage payment is refused", `got ${bad.status}`);
check(!leaks(badBody), "garbage payment does not leak the premium payload");

// 3. Real payment: sign the auth entry, retry, expect 200 and a settled tx.
if (!req) {
  console.log("\nCannot pay without valid requirements");
  process.exit(1);
}
// x402 clients only pay default assets (USDC) unless told otherwise: allow exactly the advertised
// token, capped at the advertised amount, so a hostile server cannot ask for more.
const signer = createEd25519Signer(secret, "stellar:testnet");
const paidFetch = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "stellar:*", client: new ExactStellarScheme(signer) }],
  spendControls: { allowedAssets: [{ network: req.network, asset: req.asset, maxAmountPerPayment: req.amount }] },
});
let paid = null;
let paidText = "";
try {
  paid = await paidFetch(url);
  paidText = await paid.text();
} catch (e) {
  check(false, "paid request answers 200", e instanceof Error ? e.message : String(e));
}
if (paid) {
  check(paid.status === 200, "paid request answers 200", `got ${paid.status}: ${paidText.slice(0, 200)}`);
  let data = null;
  try {
    data = JSON.parse(paidText);
  } catch {}
  check(Array.isArray(data?.campaigns) && typeof data?.summary?.active === "number", "paid response has the premium payload");
  try {
    const settle = new x402HTTPClient(new x402Client()).getPaymentSettleResponse((n) => paid.headers.get(n));
    check(settle.success === true && Boolean(settle.transaction), "payment settled with a transaction hash", JSON.stringify(settle));
    if (settle.transaction) console.log(`      tx ${explorer}/tx/${settle.transaction}`);
  } catch (e) {
    check(false, "payment settled with a transaction hash", e instanceof Error ? e.message : String(e));
  }
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
