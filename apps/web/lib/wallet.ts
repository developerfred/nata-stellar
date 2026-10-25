"use client";

import { Asset, BASE_FEE, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { PasskeyKit } from "passkey-kit";
import { rpcServer } from "./chain";
import { config } from "./config";
import { KeyedError, apiError } from "./errors";

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
  if (!res.ok) throw apiError(json, "err.walletCreate");
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

const TRUST = "nata.wallet.trusted";

/**
 * Classic accounts can only receive the reward token after opting in with a trustline. The owner signs the
 * opt-in; the server wraps it in a fee bump, so nobody pays fees. Idempotent: re-running is harmless.
 */
export async function addTrustline(kp: Keypair): Promise<void> {
  if (!config.tokenIssuer) return;
  try {
    const account = await rpcServer().getAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: config.networkPassphrase })
      .addOperation(Operation.changeTrust({ asset: new Asset(config.tokenSymbol, config.tokenIssuer) }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    const res = await fetch("/api/trustline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ xdr: tx.toXDR() }),
    });
    if (!res.ok) throw apiError(await res.json().catch(() => null), "err.trustline");
  } catch (e) {
    throw e instanceof KeyedError ? e : new KeyedError("err.trustline");
  }
}

/** Device wallets: opt in once, remembered in this browser. */
export async function ensureTrustline(w: WalletInfo): Promise<void> {
  if (w.kind !== "local" || !config.tokenIssuer) return;
  try {
    if (localStorage.getItem(TRUST) === w.address) return;
    const secret = localStorage.getItem("nata.wallet.secret");
    if (!secret) return;
    await addTrustline(Keypair.fromSecret(secret));
    localStorage.setItem(TRUST, w.address);
  } catch (e) {
    throw e instanceof KeyedError ? e : new KeyedError("err.trustline");
  }
}
