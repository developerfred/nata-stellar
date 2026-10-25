"use client";

import { Buffer } from "buffer";
import { Keypair } from "@stellar/stellar-sdk";
import { config } from "./config";
import { TICKET_TTL_SECONDS, encodeTicket, ticketPayload } from "./ticket";

const KEY = "nata.merchant.secret";

/** The counter key lives only in the merchant's browser (ed25519, signs visit tickets). */
export function loadMerchantKey(): Keypair | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? Keypair.fromSecret(s) : null;
  } catch {
    return null;
  }
}

export function createMerchantKey(): Keypair {
  const kp = Keypair.random();
  localStorage.setItem(KEY, kp.secret());
  return kp;
}

export function importMerchantKey(secret: string): Keypair {
  const kp = Keypair.fromSecret(secret.trim());
  localStorage.setItem(KEY, kp.secret());
  return kp;
}

/** Signed, single-use, short-lived proof of visit as a claim-page query string. */
export function signTicket(key: Keypair, campaignId: bigint): string {
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + TICKET_TTL_SECONDS);
  const payload = ticketPayload(config.campaignsContractId, campaignId, nonce, expiresAt);
  const signature = key.sign(Buffer.from(payload));
  return encodeTicket({ campaignId, nonce, expiresAt, signature: new Uint8Array(signature) });
}

export async function fundWithFriendbot(address: string) {
  const res = await fetch(`${config.friendbotUrl}?addr=${encodeURIComponent(address)}`);
  if (!res.ok && res.status !== 400) throw new Error("Friendbot unavailable");
}
