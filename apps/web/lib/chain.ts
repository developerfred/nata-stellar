import { Buffer } from "buffer";
import {
  Account,
  Address,
  Asset,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { config } from "./config";

export type Campaign = {
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

export const rpcServer = () => new rpc.Server(config.rpcUrl);

/** Read-only call through simulation; no funded account needed. */
export async function simulateRead<T = unknown>(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<T> {
  const source = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await rpcServer().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  if (!sim.result) throw new Error("No result from simulation");
  return scValToNative(sim.result.retval) as T;
}

const u64 = (n: bigint) => nativeToScVal(n, { type: "u64" });
export const addressVal = (a: string) => new Address(a).toScVal();

export async function getCampaignCount(): Promise<number> {
  return Number(await simulateRead<bigint>(config.campaignsContractId, "campaign_count", []));
}

export async function getCampaign(id: bigint): Promise<Campaign> {
  const c = await simulateRead<Record<string, unknown>>(config.campaignsContractId, "get_campaign", [
    u64(id),
  ]);
  return {
    id,
    merchant: c.merchant as string,
    token: c.token as string,
    reward: c.reward as bigint,
    remaining: c.remaining as bigint,
    claims: Number(c.claims),
    maxClaims: Number(c.max_claims),
    start: c.start as bigint,
    end: c.end as bigint,
    signer: Buffer.from(c.signer as Uint8Array).toString("hex"),
    metaUri: String(c.meta_uri),
    active: Boolean(c.active),
  };
}

export async function getBalance(token: string, holder: string): Promise<bigint> {
  return simulateRead<bigint>(token, "balance", [addressVal(holder)]);
}

export async function hasClaimed(id: bigint, visitor: string): Promise<boolean> {
  return simulateRead<boolean>(config.campaignsContractId, "has_claimed", [
    u64(id),
    addressVal(visitor),
  ]);
}

/** Builds, simulates, signs with `signer` and submits an invocation; resolves with the tx hash. */
export async function invokeAndWait(
  signer: Keypair,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<{ hash: string; returnValue: unknown }> {
  const server = rpcServer();
  const account = await server.getAccount(signer.publicKey());
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(60)
    .build();
  const prepared = await server.prepareTransaction(built);
  prepared.sign(signer);
  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error("Transaction rejected by the network");
  for (let i = 0; i < 30; i++) {
    const res = await server.getTransaction(sent.hash);
    if (res.status === "SUCCESS") {
      return { hash: sent.hash, returnValue: res.returnValue ? scValToNative(res.returnValue) : null };
    }
    if (res.status === "FAILED") throw new Error("Transaction failed on-chain");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for confirmation");
}

export const claimArgs = (
  campaignId: bigint,
  visitor: string,
  nonce: Uint8Array,
  expiresAt: bigint,
  signature: Uint8Array,
) => [
  u64(campaignId),
  addressVal(visitor),
  nativeToScVal(Buffer.from(nonce), { type: "bytes" }),
  u64(expiresAt),
  nativeToScVal(Buffer.from(signature), { type: "bytes" }),
];

export const createCampaignArgs = (p: {
  merchant: string;
  token: string;
  reward: bigint;
  budget: bigint;
  maxClaims: number;
  start: bigint;
  end: bigint;
  signerPubkey: Uint8Array;
  metaUri: string;
}) => [
  addressVal(p.merchant),
  addressVal(p.token),
  nativeToScVal(p.reward, { type: "i128" }),
  nativeToScVal(p.budget, { type: "i128" }),
  nativeToScVal(p.maxClaims, { type: "u32" }),
  u64(p.start),
  u64(p.end),
  nativeToScVal(Buffer.from(p.signerPubkey), { type: "bytes" }),
  nativeToScVal(p.metaUri, { type: "string" }),
];

/** True when a classic account holds a trustline for the reward asset (always true when no issuer is configured). */
export async function hasTrustline(account: string): Promise<boolean> {
  if (!config.tokenIssuer) return true;
  const key = xdr.LedgerKey.trustline(
    new xdr.LedgerKeyTrustLine({
      accountId: Keypair.fromPublicKey(account).xdrAccountId(),
      asset: new Asset(config.tokenSymbol, config.tokenIssuer).toTrustLineXDRObject(),
    }),
  );
  const res = await rpcServer().getLedgerEntries(key);
  return res.entries.length > 0;
}
