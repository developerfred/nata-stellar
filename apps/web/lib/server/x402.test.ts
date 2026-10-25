import test from "node:test";
import assert from "node:assert/strict";
import { parseX402, routeConfig, toRawAmount } from "./x402.ts";

const PAY_TO = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const TOKEN = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

test("toRawAmount converts decimals to 7-decimal units", () => {
  assert.equal(toRawAmount("0.01"), "100000");
  assert.equal(toRawAmount("1"), "10000000");
  assert.equal(toRawAmount("0.0000001"), "1");
  assert.equal(toRawAmount("0"), null);
  assert.equal(toRawAmount("0.00000001"), null);
  assert.equal(toRawAmount("-1"), null);
  assert.equal(toRawAmount("abc"), null);
});

test("parseX402 is off without a valid payTo and token", () => {
  assert.equal(parseX402({ X402_ASSET: TOKEN }), null);
  assert.equal(parseX402({ X402_PAY_TO: "nope", X402_ASSET: TOKEN }), null);
  assert.equal(parseX402({ X402_PAY_TO: PAY_TO }), null);
});

test("parseX402 applies defaults and validates the facilitator", () => {
  const s = parseX402({ X402_PAY_TO: PAY_TO, X402_ASSET: TOKEN });
  assert.ok(s);
  assert.equal(s.network, "stellar:testnet");
  assert.equal(s.amountRaw, "100000");
  assert.equal(s.facilitatorUrl, "https://www.x402.org/facilitator");
  assert.equal(s.facilitatorApiKey, null);
  assert.equal(parseX402({ X402_PAY_TO: PAY_TO, X402_ASSET: TOKEN, X402_FACILITATOR_URL: "http://x.test" }), null);
  assert.ok(parseX402({ X402_PAY_TO: PAY_TO, X402_ASSET: TOKEN, X402_FACILITATOR_URL: "http://localhost:3222" }));
  const oz = parseX402({
    X402_PAY_TO: PAY_TO,
    X402_ASSET: TOKEN,
    X402_FACILITATOR_URL: "https://channels.openzeppelin.com/x402/testnet/",
    X402_FACILITATOR_API_KEY: " k ",
  });
  assert.equal(oz?.facilitatorUrl, "https://channels.openzeppelin.com/x402/testnet");
  assert.equal(oz?.facilitatorApiKey, "k");
});

test("routeConfig prices in the SEP-41 token", () => {
  const s = parseX402({ X402_PAY_TO: PAY_TO, X402_ASSET: TOKEN })!;
  const r = routeConfig(s, "demo");
  assert.deepEqual(r.accepts.price, { asset: TOKEN, amount: "100000" });
  assert.equal(r.accepts.scheme, "exact");
});
