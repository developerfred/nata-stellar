import test from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@stellar/stellar-sdk";
import { loadConfig } from "../src/config.js";
import { Handlers, ToolError, parseAmount, formatAmount, schemas, type ChainCampaign, type Deps } from "../src/handlers.js";
import { z } from "zod";

const NOW = 1_800_000_000;
const agent = Keypair.random();
const base = {
  NATA_AGENT_SECRET: agent.secret(),
  NATA_CAMPAIGNS_CONTRACT_ID: "CCONTRACT",
  NATA_TOKEN_CONTRACT_ID: "CTOKEN",
  NATA_MAX_BUDGET_PER_CALL: "100",
  NATA_MAX_TOTAL_BUDGET: "150",
};

const camp = (over: Partial<ChainCampaign> = {}): ChainCampaign => ({
  id: 0n, merchant: agent.publicKey(), token: "CTOKEN", reward: 20_000_000n, remaining: 1_000_000_000n, claims: 0, maxClaims: 50,
  start: BigInt(NOW - 100), end: BigInt(NOW + 86400), signer: "", metaUri: "meta", active: true, ...over,
});

function setup(env: Record<string, string> = {}, campaigns: ChainCampaign[] = [camp()], balance: bigint | null = 5_000_000_000n) {
  const calls: string[] = [];
  const deps: Deps = {
    encodePlace: (p) => `enc:${JSON.stringify(p)}`,
    decodePlace: () => ({ name: "Cafe Nata", kind: "Cafe", address: "Rua 1, Lisboa", blurb: "b", promo: "p", menu: [] }),
    getCampaignCount: async () => campaigns.length,
    getCampaign: async (id) => campaigns[Number(id)],
    getBalance: async () => { if (balance === null) throw new Error("no account"); return balance; },
    hasClaimed: async () => true,
    createCampaign: async () => { calls.push("create"); return { hash: "abc", campaignId: BigInt(campaigns.length) }; },
    closeCampaign: async () => { calls.push("close"); return { hash: "def", refund: 1_000_000_000n }; },
    fund: async () => { calls.push("friendbot"); },
    faucet: async () => { calls.push("faucet"); return { ok: true }; },
    now: () => NOW,
  };
  return { h: new Handlers(loadConfig({ ...base, ...env }), deps), calls };
}

const create = (over: Record<string, unknown> = {}) =>
  z.object(schemas.create_campaign).parse({ title: "Cafe Nata", location: "Rua 1, Lisboa", reward: "2", budget: "50", ...over });

test("amounts round-trip and reject garbage", () => {
  assert.equal(parseAmount("1.25"), 12_500_000n);
  assert.equal(formatAmount(12_500_000n), "1.25");
  assert.throws(() => parseAmount("-1"), ToolError);
  assert.throws(() => parseAmount("1.12345678"), ToolError);
});

test("config refuses non-testnet networks and bad secrets", () => {
  assert.throws(() => loadConfig({ NATA_NETWORK_PASSPHRASE: "Public Global Stellar Network ; September 2015" }), /testnet/);
  assert.throws(() => loadConfig({ NATA_AGENT_SECRET: "nope" }), /secret/);
});

test("create_campaign creates and reports tx link", async () => {
  const { h, calls } = setup();
  const r = await h.create_campaign(create());
  assert.equal("created" in r && r.created, true);
  assert.equal((r as { maxClaims: number }).maxClaims, 25);
  assert.match((r as { transaction: string }).transaction, /tx\/abc$/);
  assert.deepEqual(calls, ["create"]);
});

test("dry_run (param or env) sends nothing", async () => {
  for (const [env, over] of [[{}, { dry_run: true }], [{ NATA_DRY_RUN: "true" }, {}]] as const) {
    const { h, calls } = setup(env);
    const r = await h.create_campaign(create(over));
    assert.equal("dryRun" in r && r.dryRun, true);
    assert.deepEqual(calls, []);
  }
});

test("per-call and total caps are enforced", async () => {
  const { h } = setup();
  await assert.rejects(h.create_campaign(create({ budget: "101" })), /per-call cap/);
  await h.create_campaign(create({ budget: "100" }));
  await assert.rejects(h.create_campaign(create({ budget: "60" })), /session total cap/);
  await h.create_campaign(create({ budget: "50" }));
});

test("closing frees the session budget", async () => {
  const { h } = setup();
  await h.create_campaign(create({ budget: "100" }));
  await h.close_campaign({ campaign_id: "0", dry_run: false });
  await h.create_campaign(create({ budget: "100" }));
});

test("validation errors are clear", async () => {
  const { h } = setup();
  await assert.rejects(h.create_campaign(create({ reward: "10", budget: "5" })), /at least one reward/);
  await assert.rejects(h.create_campaign(create({ signer_public_key: "nope" })), /signer_public_key/);
  await assert.rejects(h.create_campaign(create({ reward: "0" })), /greater than 0/);
  assert.equal(z.object(schemas.create_campaign).safeParse({ title: "x", location: "y", reward: "a", budget: "1" }).success, false);
});

test("insufficient balance blocks creation", async () => {
  const { h, calls } = setup({}, [camp()], 10_000_000n);
  await assert.rejects(h.create_campaign(create()), /Use request_faucet/);
  assert.deepEqual(calls, []);
});

test("write tools need a key; reads do not", async () => {
  const { h } = setup({ NATA_AGENT_SECRET: "" });
  await assert.rejects(h.create_campaign(create()), /NATA_AGENT_SECRET/);
  const r = await h.list_active_campaigns({ limit: 20 });
  assert.equal(r.campaigns.length, 1);
});

test("list only returns running campaigns", async () => {
  const { h } = setup({}, [camp({ id: 0n }), camp({ id: 1n, active: false }), camp({ id: 2n, end: BigInt(NOW - 1) })]);
  const r = await h.list_active_campaigns({ limit: 20 });
  assert.deepEqual(r.campaigns.map((c) => c.id), ["0"]);
});

test("close refuses other merchants' and missing campaigns", async () => {
  const { h, calls } = setup({}, [camp({ merchant: Keypair.random().publicKey() })]);
  await assert.rejects(h.close_campaign({ campaign_id: "0", dry_run: false }), /another merchant/);
  await assert.rejects(h.get_campaign({ campaign_id: "9" }), /does not exist/);
  assert.deepEqual(calls, []);
});

test("get_claims reports payout and visitor status", async () => {
  const { h } = setup({}, [camp({ claims: 3 })]);
  const r = await h.get_claims({ campaign_id: "0", visitor: Keypair.random().publicKey() });
  assert.equal(r.paidOut, "6");
  assert.equal(r.visitorHasClaimed, true);
  await assert.rejects(h.get_claims({ campaign_id: "0", visitor: "bad" }), /Stellar address/);
});

test("request_faucet funds via friendbot and faucet", async () => {
  const { h, calls } = setup();
  await h.request_faucet({ fund_xlm: true });
  assert.deepEqual(calls, ["friendbot", "faucet"]);
});
