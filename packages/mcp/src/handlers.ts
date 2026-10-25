import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { z } from "zod";
import type { McpConfig } from "./config.js";

/** Chain access, injected so the handlers can be tested without a network. */
export type ChainCampaign = {
  id: bigint;
  merchant: string;
  token: string;
  reward: bigint;
  remaining: bigint;
  claims: number;
  maxClaims: number;
  start: bigint;
  end: bigint;
  signer: string;
  metaUri: string;
  active: boolean;
};

export type PlaceProfile = {
  name: string;
  kind: string;
  address: string;
  blurb: string;
  promo: string;
  photo?: string;
  menu: { name: string; price: string; note?: string }[];
};

export type Deps = {
  encodePlace(p: PlaceProfile): string;
  decodePlace(uri: string): PlaceProfile | null;
  getCampaignCount(): Promise<number>;
  getCampaign(id: bigint): Promise<ChainCampaign>;
  getBalance(token: string, holder: string): Promise<bigint>;
  hasClaimed(id: bigint, visitor: string): Promise<boolean>;
  createCampaign(
    signer: Keypair,
    p: {
      reward: bigint;
      budget: bigint;
      maxClaims: number;
      start: bigint;
      end: bigint;
      signerPubkey: Uint8Array;
      metaUri: string;
    },
  ): Promise<{ hash: string; campaignId: bigint }>;
  closeCampaign(signer: Keypair, id: bigint): Promise<{ hash: string; refund: bigint }>;
  fund(address: string): Promise<void>;
  faucet(address: string): Promise<Record<string, unknown>>;
  now(): number;
};

/** An error whose message is safe and useful to show to the calling agent. */
export class ToolError extends Error {}

const SCALE = 10_000_000n;

export function parseAmount(input: string): bigint {
  const s = input.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(s)) throw new ToolError(`Invalid amount "${input}". Use a plain decimal like "2" or "1.25" (max 7 decimals).`);
  const [w, f = ""] = s.split(".");
  return BigInt(w) * SCALE + BigInt(f.padEnd(7, "0"));
}

export function formatAmount(raw: bigint): string {
  const whole = raw / SCALE;
  const frac = (raw % SCALE).toString().padStart(7, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

const amount = z.string().regex(/^\d+(\.\d{1,7})?$/, "decimal amount like 2 or 1.25");
const campaignId = z.string().regex(/^\d{1,18}$/, "numeric campaign id");

export const schemas = {
  list_active_campaigns: { limit: z.number().int().min(1).max(100).default(20).describe("Max campaigns to return, newest first") },
  get_campaign: { campaign_id: campaignId },
  get_claims: {
    campaign_id: campaignId,
    visitor: z.string().optional().describe("Optional wallet address (G... or C...) to check whether it already claimed"),
  },
  create_campaign: {
    title: z.string().trim().min(2).max(60).describe("Name of the place or activity"),
    location: z.string().trim().min(2).max(120).describe("Address or location where the visit happens"),
    kind: z.string().trim().max(30).default("Place").describe("e.g. Cafe, Museum, Event booth"),
    description: z.string().trim().max(300).default("").describe("Short blurb shown to visitors"),
    promo: z.string().trim().max(120).default("").describe("What the visitor gets or does"),
    reward: amount.describe("Reward per verified visit, in the campaign token (e.g. \"2\")"),
    budget: amount.describe("Total budget locked in escrow (e.g. \"50\"). Must be >= reward"),
    days: z.number().int().min(1).max(90).default(7).describe("How many days the campaign runs"),
    signer_public_key: z
      .string()
      .optional()
      .describe("Stellar public key (G...) of the counter device that signs visit QR codes. Defaults to the agent account"),
    dry_run: z.boolean().default(false).describe("Validate and preview without sending a transaction"),
  },
  close_campaign: { campaign_id: campaignId, dry_run: z.boolean().default(false) },
  get_agent_account: {},
  request_faucet: {
    fund_xlm: z.boolean().default(true).describe("Also fund the account with testnet XLM via Friendbot"),
  },
} as const;

type In<K extends keyof typeof schemas> = z.infer<z.ZodObject<(typeof schemas)[K]>>;


export class Handlers {
  private spent = 0n;
  private readonly key?: Keypair;

  constructor(
    private readonly cfg: McpConfig,
    private readonly deps: Deps,
  ) {
    this.key = cfg.agentSecret ? Keypair.fromSecret(cfg.agentSecret) : undefined;
  }

  private requireKey(): Keypair {
    if (!this.key) throw new ToolError("No agent account: set NATA_AGENT_SECRET (a testnet secret key) in the MCP server environment.");
    return this.key;
  }

  private requireContracts() {
    if (!this.cfg.campaignsContractId || !this.cfg.tokenContractId) {
      throw new ToolError("NATA_CAMPAIGNS_CONTRACT_ID and NATA_TOKEN_CONTRACT_ID must be set.");
    }
  }

  private tx = (hash: string) => `${this.cfg.explorerUrl}/tx/${hash}`;

  private view(c: ChainCampaign) {
    const now = BigInt(this.deps.now());
    const place = this.deps.decodePlace(c.metaUri);
    const status = !c.active ? "closed" : now < c.start ? "scheduled" : now > c.end ? "expired" : c.remaining < c.reward || c.claims >= c.maxClaims ? "exhausted" : "running";
    return {
      id: c.id.toString(),
      status,
      title: place?.name ?? null,
      kind: place?.kind ?? null,
      location: place?.address ?? null,
      description: place?.blurb ?? null,
      promo: place?.promo ?? null,
      reward: formatAmount(c.reward),
      remaining: formatAmount(c.remaining),
      claims: c.claims,
      maxClaims: c.maxClaims,
      starts: new Date(Number(c.start) * 1000).toISOString(),
      ends: new Date(Number(c.end) * 1000).toISOString(),
      merchant: c.merchant,
      token: this.cfg.tokenSymbol,
    };
  }

  private async load(idStr: string): Promise<ChainCampaign> {
    this.requireContracts();
    const id = BigInt(idStr);
    const count = await this.deps.getCampaignCount();
    if (id >= BigInt(count)) throw new ToolError(`Campaign ${idStr} does not exist (there are ${count} campaigns, ids 0..${count - 1}).`);
    return this.deps.getCampaign(id);
  }

  async list_active_campaigns({ limit }: In<"list_active_campaigns">) {
    this.requireContracts();
    const count = await this.deps.getCampaignCount();
    const ids: bigint[] = [];
    for (let i = count - 1; i >= 0 && ids.length < 100; i--) ids.push(BigInt(i));
    const all = await Promise.all(ids.map((id) => this.deps.getCampaign(id).catch(() => null)));
    const running = all.flatMap((c) => (c ? [this.view(c)] : [])).filter((v) => v.status === "running");
    return { total: count, returned: Math.min(limit, running.length), campaigns: running.slice(0, limit) };
  }

  async get_campaign({ campaign_id }: In<"get_campaign">) {
    return this.view(await this.load(campaign_id));
  }

  async get_claims({ campaign_id, visitor }: In<"get_claims">) {
    const c = await this.load(campaign_id);
    const out: Record<string, unknown> = {
      id: c.id.toString(),
      claims: c.claims,
      maxClaims: c.maxClaims,
      paidOut: formatAmount(BigInt(c.claims) * c.reward),
      remaining: formatAmount(c.remaining),
      token: this.cfg.tokenSymbol,
    };
    if (visitor) {
      if (!StrKey.isValidEd25519PublicKey(visitor) && !StrKey.isValidContract(visitor)) {
        throw new ToolError("visitor must be a Stellar address (G... or C...).");
      }
      out.visitor = visitor;
      out.visitorHasClaimed = await this.deps.hasClaimed(c.id, visitor);
    }
    return out;
  }

  async get_agent_account() {
    const key = this.requireKey();
    this.requireContracts();
    const balance = await this.deps.getBalance(this.cfg.tokenContractId, key.publicKey()).catch(() => null);
    return {
      address: key.publicKey(),
      network: "testnet",
      token: this.cfg.tokenSymbol,
      balance: balance === null ? "unknown (account may be unfunded: use request_faucet)" : formatAmount(balance),
      dryRun: this.cfg.dryRun,
      limits: {
        maxBudgetPerCall: formatAmount(this.cfg.maxBudgetPerCall),
        maxTotalBudget: formatAmount(this.cfg.maxTotalBudget),
        committedThisSession: formatAmount(this.spent),
        remainingThisSession: formatAmount(this.cfg.maxTotalBudget - this.spent),
      },
    };
  }

  async request_faucet({ fund_xlm }: In<"request_faucet">) {
    const key = this.requireKey();
    const result: Record<string, unknown> = { address: key.publicKey() };
    if (fund_xlm) {
      await this.deps.fund(key.publicKey());
      result.xlm = "funded via Friendbot";
    }
    try {
      result.token = await this.deps.faucet(key.publicKey());
    } catch (e) {
      result.token = `not available: ${(e as Error).message}`;
    }
    return result;
  }

  async create_campaign(i: In<"create_campaign">) {
    const key = this.requireKey();
    this.requireContracts();
    const reward = parseAmount(i.reward);
    const budget = parseAmount(i.budget);
    if (reward <= 0n) throw new ToolError("reward must be greater than 0.");
    if (budget < reward) throw new ToolError("budget must be at least one reward.");
    if (budget > this.cfg.maxBudgetPerCall) {
      throw new ToolError(`budget ${i.budget} exceeds the per-call cap of ${formatAmount(this.cfg.maxBudgetPerCall)} ${this.cfg.tokenSymbol}.`);
    }
    if (this.spent + budget > this.cfg.maxTotalBudget) {
      throw new ToolError(
        `budget would exceed the session total cap of ${formatAmount(this.cfg.maxTotalBudget)} ${this.cfg.tokenSymbol} (already committed ${formatAmount(this.spent)}).`,
      );
    }
    const maxClaims = Number(budget / reward);
    if (maxClaims > 100_000) throw new ToolError("budget / reward gives too many claims (max 100000). Raise the reward.");

    let signerPubkey: Uint8Array = key.rawPublicKey();
    if (i.signer_public_key) {
      if (!StrKey.isValidEd25519PublicKey(i.signer_public_key)) throw new ToolError("signer_public_key must be a Stellar public key (G...).");
      signerPubkey = Keypair.fromPublicKey(i.signer_public_key).rawPublicKey();
    }

    let metaUri: string;
    try {
      metaUri = this.deps.encodePlace({
        name: i.title,
        kind: i.kind,
        address: i.location,
        blurb: i.description,
        promo: i.promo,
        menu: [],
      });
    } catch (e) {
      throw new ToolError((e as Error).message);
    }

    const now = this.deps.now();
    const start = BigInt(now - 60);
    const end = BigInt(now + i.days * 86400);
    const preview = {
      title: i.title,
      location: i.location,
      reward: formatAmount(reward),
      budget: formatAmount(budget),
      maxClaims,
      token: this.cfg.tokenSymbol,
      ends: new Date(Number(end) * 1000).toISOString(),
      merchant: key.publicKey(),
      signer: StrKey.encodeEd25519PublicKey(Buffer.from(signerPubkey)),
    };

    if (i.dry_run || this.cfg.dryRun) return { dryRun: true, wouldCreate: preview };

    const balance = await this.deps.getBalance(this.cfg.tokenContractId, key.publicKey()).catch(() => null);
    if (balance !== null && balance < budget) {
      throw new ToolError(`Agent balance is ${formatAmount(balance)} ${this.cfg.tokenSymbol}, less than the budget ${i.budget}. Use request_faucet.`);
    }

    const { hash, campaignId: id } = await this.deps.createCampaign(key, { reward, budget, maxClaims, start, end, signerPubkey, metaUri });
    this.spent += budget;
    return { created: true, campaignId: id.toString(), ...preview, transaction: this.tx(hash) };
  }

  async close_campaign({ campaign_id, dry_run }: In<"close_campaign">) {
    const key = this.requireKey();
    const c = await this.load(campaign_id);
    if (c.merchant !== key.publicKey()) throw new ToolError("This campaign belongs to another merchant; the agent account can only close its own campaigns.");
    if (!c.active) throw new ToolError("This campaign is already closed.");
    if (dry_run || this.cfg.dryRun) {
      return { dryRun: true, wouldRefund: formatAmount(c.remaining), token: this.cfg.tokenSymbol };
    }
    const { hash, refund } = await this.deps.closeCampaign(key, c.id);
    this.spent = this.spent > refund ? this.spent - refund : 0n;
    return { closed: true, campaignId: campaign_id, refunded: formatAmount(refund), token: this.cfg.tokenSymbol, transaction: this.tx(hash) };
  }
}
