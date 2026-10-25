import test from "node:test";
import assert from "node:assert/strict";
import { parseRelayer, submitWithFallback } from "./fallback.ts";

const never = () => new Promise<string>(() => {});

test("parseRelayer needs both values and a valid URL", () => {
  assert.equal(parseRelayer({ RELAYER_URL: "https://r.example" }), null);
  assert.equal(parseRelayer({ RELAYER_API_KEY: "k" }), null);
  assert.equal(parseRelayer({ RELAYER_URL: "not a url", RELAYER_API_KEY: "k" }), null);
  assert.equal(parseRelayer({ RELAYER_URL: "ftp://r.example", RELAYER_API_KEY: "k" }), null);
  assert.deepEqual(parseRelayer({ RELAYER_URL: " https://r.example/ ", RELAYER_API_KEY: " k " }), {
    baseUrl: "https://r.example",
    apiKey: "k",
  });
});

test("uses the relayer when it works", async () => {
  const out = await submitWithFallback({ relayer: async () => "relayer", sponsor: async () => "sponsor", relayerTimeoutMs: 50 });
  assert.equal(out, "relayer");
});

test("falls back to the sponsor when the relayer fails", async () => {
  let reason = "";
  const out = await submitWithFallback({
    relayer: async () => { throw new Error("boom"); },
    sponsor: async () => "sponsor",
    relayerTimeoutMs: 50,
    onFallback: (r) => (reason = r),
  });
  assert.equal(out, "sponsor");
  assert.equal(reason, "boom");
});

test("falls back to the sponsor when the relayer hangs", async () => {
  const out = await submitWithFallback({ relayer: never, sponsor: async () => "sponsor", relayerTimeoutMs: 20 });
  assert.equal(out, "sponsor");
});

test("rethrows the relayer error when there is no sponsor", async () => {
  await assert.rejects(
    submitWithFallback({ relayer: async () => { throw new Error("boom"); }, sponsor: null, relayerTimeoutMs: 50 }),
    /boom/,
  );
});

test("sponsor only, and neither configured", async () => {
  assert.equal(await submitWithFallback({ relayer: null, sponsor: async () => "sponsor", relayerTimeoutMs: 50 }), "sponsor");
  await assert.rejects(submitWithFallback({ relayer: null, sponsor: null, relayerTimeoutMs: 50 }), /configured/);
});
