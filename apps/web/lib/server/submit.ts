import "server-only";
import { Keypair, Transaction } from "@stellar/stellar-sdk";
import { PasskeyServer } from "passkey-kit/server";
import { config } from "../config";
import { rpcServer } from "../chain";

export const relayerConfigured = () => Boolean(process.env.RELAYER_URL && process.env.RELAYER_API_KEY);
export const sponsorConfigured = () => Boolean(process.env.SPONSOR_SECRET);

export function sponsorKeypair(): Keypair {
  const secret = process.env.SPONSOR_SECRET;
  if (!secret) throw new Error("Server has no fee sponsor configured");
  return Keypair.fromSecret(secret);
}

/**
 * Submits a transaction without ever exposing credentials to the browser:
 * OpenZeppelin Relayer Channels when configured, otherwise a signed-in-place sponsor account.
 */
export async function submitSponsored(tx: Transaction): Promise<string> {
  if (relayerConfigured()) {
    const server = new PasskeyServer({
      networkPassphrase: config.networkPassphrase,
      rpcUrl: config.rpcUrl,
      relayer: { baseUrl: process.env.RELAYER_URL!, apiKey: process.env.RELAYER_API_KEY! },
    });
    const res = await server.send(tx);
    if (!res.success) throw new Error(res.error.message || "Relayer rejected the transaction");
    return res.hash;
  }
  const rpc = rpcServer();
  tx.sign(sponsorKeypair());
  const sent = await rpc.sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error("Transaction rejected by the network");
  for (let i = 0; i < 30; i++) {
    const r = await rpc.getTransaction(sent.hash);
    if (r.status === "SUCCESS") return sent.hash;
    if (r.status === "FAILED") throw new Error("Transaction failed on-chain");
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error("Timed out waiting for confirmation");
}
