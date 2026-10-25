// Signs a proof-of-visit ticket the way the counter screen does, using the exact bytes the contract expects.
// usage: node sign-ticket.mjs <contractId> <campaignId> <counterSeedHex> <sourceAlias> [network]
// prints {"c":..,"n":..,"e":..,"s":..}
import { execFileSync } from "node:child_process";
import { createPrivateKey, randomBytes, sign } from "node:crypto";

const [contract, campaignId, seedHex, source, network = "testnet"] = process.argv.slice(2);
if (!contract || !campaignId || !seedHex || !source) {
  console.error("usage: sign-ticket.mjs <contractId> <campaignId> <seedHex> <sourceAlias> [network]");
  process.exit(2);
}

const nonce = randomBytes(32).toString("hex");
const expiresAt = Math.floor(Date.now() / 1000) + 25;

const out = execFileSync(
  "stellar",
  ["contract", "invoke", "--id", contract, "--source", source, "--network", network, "--send=no", "--",
   "ticket_payload", "--campaign_id", campaignId, "--nonce", nonce, "--expires_at", String(expiresAt)],
  { encoding: "utf8" },
).trim().split("\n").pop();

const payload = Buffer.from(JSON.parse(out), "hex");
const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seedHex, "hex")]);
const signature = sign(null, payload, createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" })).toString("hex");

console.log(JSON.stringify({ c: campaignId, n: nonce, e: String(expiresAt), s: signature }));
