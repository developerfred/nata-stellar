import { Keypair, Networks } from "@stellar/stellar-sdk";

export type McpConfig = {
  agentSecret?: string;
  campaignsContractId: string;
  tokenContractId: string;
  tokenSymbol: string;
  rpcUrl: string;
  networkPassphrase: string;
  friendbotUrl: string;
  faucetUrl?: string;
  explorerUrl: string;
  maxBudgetPerCall: bigint;
  maxTotalBudget: bigint;
  dryRun: boolean;
};

const SCALE = 10_000_000n;

const toRaw = (v: string, name: string): bigint => {
  if (!/^\d+(\.\d{1,7})?$/.test(v)) throw new Error(`${name} must be a decimal amount, got "${v}"`);
  const [w, f = ""] = v.split(".");
  return BigInt(w) * SCALE + BigInt(f.padEnd(7, "0"));
};

/** Reads and validates configuration from environment variables. Testnet only. */
export function loadConfig(env: Record<string, string | undefined> = process.env): McpConfig {
  const networkPassphrase = env.NATA_NETWORK_PASSPHRASE?.trim() || Networks.TESTNET;
  if (networkPassphrase !== Networks.TESTNET) {
    throw new Error("nata-mcp only runs on Stellar testnet. Remove NATA_NETWORK_PASSPHRASE or set it to the testnet passphrase.");
  }
  const agentSecret = env.NATA_AGENT_SECRET?.trim() || undefined;
  if (agentSecret) {
    try {
      Keypair.fromSecret(agentSecret);
    } catch {
      throw new Error("NATA_AGENT_SECRET is not a valid Stellar secret key (S...)");
    }
  }
  return {
    agentSecret,
    campaignsContractId: env.NATA_CAMPAIGNS_CONTRACT_ID?.trim() ?? "",
    tokenContractId: env.NATA_TOKEN_CONTRACT_ID?.trim() ?? "",
    tokenSymbol: env.NATA_TOKEN_SYMBOL?.trim() || "vUSD",
    rpcUrl: env.NATA_RPC_URL?.trim() || "https://soroban-testnet.stellar.org",
    networkPassphrase,
    friendbotUrl: env.NATA_FRIENDBOT_URL?.trim() || "https://friendbot.stellar.org",
    faucetUrl: env.NATA_FAUCET_URL?.trim() || undefined,
    explorerUrl: env.NATA_EXPLORER_URL?.trim() || "https://stellar.expert/explorer/testnet",
    maxBudgetPerCall: toRaw(env.NATA_MAX_BUDGET_PER_CALL?.trim() || "100", "NATA_MAX_BUDGET_PER_CALL"),
    maxTotalBudget: toRaw(env.NATA_MAX_TOTAL_BUDGET?.trim() || "500", "NATA_MAX_TOTAL_BUDGET"),
    dryRun: /^(1|true|yes)$/i.test(env.NATA_DRY_RUN?.trim() ?? ""),
  };
}
