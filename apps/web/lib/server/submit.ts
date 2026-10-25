import "server-only";
import { Keypair, Transaction } from "@stellar/stellar-sdk";
import { PasskeyServer } from "passkey-kit/server";
import { config } from "../config";
import { rpcServer } from "../chain";
import { parseRelayer, submitWithFallback } from "./fallback";

export const relayerSettings = () => parseRelayer(process.env);
export const relayerConfigured = () => relayerSettings() !== null;
export const sponsorConfigured = () => Boolean(process.env.SPONSOR_SECRET);

export function sponsorKeypair(): Keypair {
  const secret = process.env.SPONSOR_SECRET;
  if (!secret) throw new Error("Server has no fee sponsor configured");
  return Keypair.fromSecret(secret);
}

export type Submitted = { hash: string; status: "SUCCESS" | "PENDING" };

/** Time spent waiting for confirmation before handing back a pending hash (stays under serverless limits). */
const CONFIRM_BUDGET_MS = Number(process.env.CONFIRM_BUDGET_MS ?? 20_000);
const RELAYER_TIMEOUT_MS = Number(process.env.RELAYER_TIMEOUT_MS ?? 12_000);

/**
 * Submits a transaction without ever exposing credentials to the browser: OpenZeppelin Relayer
 * when configured, falling back to the sponsor account (SPONSOR_SECRET) if the relayer fails or
 * is slow. If the network has not confirmed within the budget the hash is returned as PENDING
 * and the client polls /api/claim/status.
 */
export async function submitSponsored(tx: Transaction): Promise<Submitted> {
  const relayer = relayerSettings();
  return submitWithFallback<Submitted>({
    relayer: relayer
      ? async () => {
          const server = new PasskeyServer({
            networkPassphrase: config.networkPassphrase,
            rpcUrl: config.rpcUrl,
            relayer: { baseUrl: relayer.baseUrl, apiKey: relayer.apiKey },
          });
          const res = await server.send(tx);
          if (!res.success) throw new Error(res.error.message || "Relayer rejected the transaction");
          return { hash: res.hash, status: "SUCCESS" };
        }
      : null,
    sponsor: sponsorConfigured() ? () => submitWithSponsor(tx) : null,
    relayerTimeoutMs: RELAYER_TIMEOUT_MS,
    onFallback: (reason) => console.warn("relayer failed, falling back to sponsor:", reason),
  });
}

async function submitWithSponsor(tx: Transaction): Promise<Submitted> {
  const rpc = rpcServer();
  tx.sign(sponsorKeypair());
  const sent = await rpc.sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error("Transaction rejected by the network");
  const deadline = Date.now() + CONFIRM_BUDGET_MS;
  while (Date.now() < deadline) {
    const r = await rpc.getTransaction(sent.hash);
    if (r.status === "SUCCESS") return { hash: sent.hash, status: "SUCCESS" };
    if (r.status === "FAILED") throw new Error("Transaction failed on-chain");
    await new Promise((res) => setTimeout(res, 1000));
  }
  return { hash: sent.hash, status: "PENDING" };
}
