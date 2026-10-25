import { Keypair } from "@stellar/stellar-sdk";
import type { McpConfig } from "./config.js";
import type { ChainCampaign, Deps } from "./handlers.js";

/**
 * Real chain access. Reuses the web app's contract client (apps/web/lib) so the
 * argument encoding and the place metadata format can never drift apart.
 * That module reads its settings from NEXT_PUBLIC_* at import time, so they are
 * set first and the module is loaded dynamically.
 */
export async function createChainDeps(cfg: McpConfig): Promise<Deps> {
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL = cfg.rpcUrl;
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE = cfg.networkPassphrase;
  process.env.NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID = cfg.campaignsContractId;
  process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID = cfg.tokenContractId;
  const chain = await import("../../../apps/web/lib/chain");
  const placeLib = await import("../../../apps/web/lib/place");
  const { nativeToScVal } = await import("@stellar/stellar-sdk");

  return {
    encodePlace: placeLib.encodePlace,
    decodePlace: placeLib.decodePlace,
    getCampaignCount: chain.getCampaignCount,
    getCampaign: chain.getCampaign as (id: bigint) => Promise<ChainCampaign>,
    getBalance: chain.getBalance,
    hasClaimed: chain.hasClaimed,
    now: () => Math.floor(Date.now() / 1000),
    async createCampaign(signer: Keypair, p) {
      const { hash, returnValue } = await chain.invokeAndWait(
        signer,
        cfg.campaignsContractId,
        "create_campaign",
        chain.createCampaignArgs({ merchant: signer.publicKey(), token: cfg.tokenContractId, ...p }),
      );
      return { hash, campaignId: BigInt(returnValue as bigint | number | string) };
    },
    async closeCampaign(signer: Keypair, id: bigint) {
      const { hash, returnValue } = await chain.invokeAndWait(signer, cfg.campaignsContractId, "close_campaign", [
        nativeToScVal(id, { type: "u64" }),
      ]);
      return { hash, refund: BigInt(returnValue as bigint | number | string) };
    },
    async fund(address: string) {
      const res = await fetch(`${cfg.friendbotUrl}?addr=${encodeURIComponent(address)}`);
      if (!res.ok && res.status !== 400) throw new Error("Friendbot is unavailable right now");
    },
    async faucet(address: string) {
      if (!cfg.faucetUrl) throw new Error("No vUSD faucet configured (set NATA_FAUCET_URL).");
      const res = await fetch(cfg.faucetUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(`Faucet refused the request: ${String(body.error ?? res.status)}`);
      return body;
    },
  };
}
