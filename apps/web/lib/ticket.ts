import { Address } from "@stellar/stellar-sdk";

/**
 * Proof-of-visit tickets. Must stay byte-for-byte in sync with
 * `ticket_message` in contracts/campaigns/src/lib.rs:
 *
 *   domain || contract address (ScVal XDR) || campaign_id (u64 BE) || nonce (32) || expires_at (u64 BE)
 */
const DOMAIN = new TextEncoder().encode("nata-claim-v1");

/** How long a QR shown at the counter stays valid, in seconds. */
export const TICKET_TTL_SECONDS = 30;
/** How often the counter screen rotates its QR, in milliseconds. */
export const TICKET_ROTATE_MS = 20_000;

export type Ticket = {
  campaignId: bigint;
  nonce: Uint8Array;
  expiresAt: bigint;
  signature: Uint8Array;
};

function u64be(value: bigint): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, value);
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function ticketPayload(
  contractId: string,
  campaignId: bigint,
  nonce: Uint8Array,
  expiresAt: bigint,
): Uint8Array {
  if (nonce.length !== 32) throw new Error("nonce must be 32 bytes");
  const contract = new Uint8Array(Address.fromString(contractId).toScVal().toXDR());
  return concat([DOMAIN, contract, u64be(campaignId), nonce, u64be(expiresAt)]);
}

export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export function fromHex(hex: string): Uint8Array {
  if (!/^([0-9a-f]{2})*$/i.test(hex)) throw new Error("invalid hex");
  return Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16));
}

/** Query string carried by the counter QR: /claim?c=..&n=..&e=..&s=.. */
export function encodeTicket(t: Ticket): string {
  return new URLSearchParams({
    c: t.campaignId.toString(),
    n: toHex(t.nonce),
    e: t.expiresAt.toString(),
    s: toHex(t.signature),
  }).toString();
}

export function decodeTicket(params: URLSearchParams): Ticket {
  const c = params.get("c");
  const n = params.get("n");
  const e = params.get("e");
  const s = params.get("s");
  if (!c || !n || !e || !s) throw new Error("incomplete ticket");
  const ticket = {
    campaignId: BigInt(c),
    nonce: fromHex(n),
    expiresAt: BigInt(e),
    signature: fromHex(s),
  };
  if (ticket.nonce.length !== 32 || ticket.signature.length !== 64) {
    throw new Error("malformed ticket");
  }
  return ticket;
}
