import { Networks } from "@stellar/stellar-sdk";

export const config = {
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET,
  campaignsContractId: process.env.NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID ?? "",
  /** Soroban token (USDC SAC or our vUSD SAC) used for budgets and rewards. */
  tokenContractId: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID ?? "",
  /** Issuer of the classic asset behind the token SAC; lets browser wallets get a trustline. */
  tokenIssuer: process.env.NEXT_PUBLIC_TOKEN_ISSUER ?? "",
  tokenSymbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "USDC",
  walletWasmHash: process.env.NEXT_PUBLIC_WALLET_WASM_HASH ?? "",
  friendbotUrl: process.env.NEXT_PUBLIC_FRIENDBOT_URL ?? "https://friendbot.stellar.org",
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet",
};

/** Stellar tokens use 7 decimals. */
export const TOKEN_DECIMALS = 7;

export const isConfigured = () => Boolean(config.campaignsContractId);
