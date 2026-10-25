"use client";

import { Keypair } from "@stellar/stellar-sdk";
import { PasskeyKit } from "passkey-kit";
import { config } from "./config";

/**
 * Visitor wallet. Preferred: a passkey smart wallet (C… address, Face ID / Touch ID, no gas).
 * Fallback when no passkey stack is configured: a key kept in this browser, so the claim flow
 * still works end to end.
 */
export type WalletInfo = { address: string; kind: "passkey" | "local" };

const STORE = "nata.wallet";

export const passkeysEnabled = () =>
  Boolean(config.walletWasmHash) &&
  typeof window !== "undefined" &&
  typeof window.PublicKeyCredential !== "undefined";

function kit() {
  return new PasskeyKit({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    walletWasmHash: config.walletWasmHash,
  });
}

export function loadWallet(): WalletInfo | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as WalletInfo) : null;
  } catch {
    return null;
  }
}

function save(info: WalletInfo) {
  try {
    localStorage.setItem(STORE, JSON.stringify(info));
  } catch {
    /* private mode: wallet lasts for this session only */
  }
  return info;
}

export async function createPasskeyWallet(): Promise<WalletInfo> {
  const k = kit();
  const created = await k.createWallet("nata", "nata visitor");
  const res = await fetch("/api/wallet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ xdr: created.signedTx }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Could not create the wallet");
  await k.confirmWalletCreation(created, json.hash);
  const connected = await k.connectWallet({ keyId: created.keyIdBase64 });
  return save({ address: connected.contractId, kind: "passkey" });
}

export async function connectPasskeyWallet(): Promise<WalletInfo> {
  const connected = await kit().connectWallet();
  return save({ address: connected.contractId, kind: "passkey" });
}

export async function createLocalWallet(): Promise<WalletInfo> {
  const kp = Keypair.random();
  try {
    localStorage.setItem("nata.wallet.secret", kp.secret());
  } catch {
    /* ignore */
  }
  await fetch(`${config.friendbotUrl}?addr=${kp.publicKey()}`).catch(() => undefined);
  return save({ address: kp.publicKey(), kind: "local" });
}

export function forgetWallet() {
  try {
    localStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
}
