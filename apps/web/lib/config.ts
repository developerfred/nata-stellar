import { Networks } from "@stellar/stellar-sdk";

export const config = {
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET,
  campaignsContractId: process.env.NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID ?? "",
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet",
};
