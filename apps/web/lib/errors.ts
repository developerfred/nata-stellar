import { isKey, type Key } from "./i18n/dictionaries";

/** An error whose message is a translation key, so the UI can show it in the visitor's language. */
export class KeyedError extends Error {
  constructor(public key: Key) {
    super(key);
  }
}

const ED25519 = /ed25519|InvalidAction|UnreachableCodeReached/i;

/** Maps a raw chain/SDK error to a translation key (`err.contract_N` mirrors contracts/campaigns/src/lib.rs). */
export function errorKey(raw: unknown): Key | null {
  if (raw instanceof KeyedError) return raw.key;
  const text = raw instanceof Error ? raw.message : String(raw);
  const m = /Error\(Contract, #(\d+)\)/.exec(text);
  const key = m ? (`err.contract_${m[1]}` as Key) : null;
  if (key && /^[1-9]$/.test(m![1])) return key;
  if (ED25519.test(text)) return "err.not_signed";
  return null;
}

/** Server-side: key plus an English fallback for clients that do not translate. */
export function describeError(raw: unknown): { code: Key | null; text: string } {
  const text = raw instanceof Error ? raw.message : String(raw);
  return { code: errorKey(raw), text: text.length > 200 ? text.slice(0, 200) + "…" : text };
}

/** Builds the error for a failed API response: the server's `code` when it is a known key, else `fallback`. */
export const apiError = (json: { code?: string } | null, fallback: Key) =>
  new KeyedError(json?.code && isKey(json.code) ? json.code : fallback);
