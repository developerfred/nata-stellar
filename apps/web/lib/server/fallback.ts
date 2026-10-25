/** Pure helpers for the submit path, kept free of SDK imports so they can be unit tested. */

export function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export type Relayer = { baseUrl: string; apiKey: string };

/** Reads and validates RELAYER_URL / RELAYER_API_KEY. Returns null when unset or malformed. */
export function parseRelayer(env: Record<string, string | undefined>): Relayer | null {
  const rawUrl = env.RELAYER_URL?.trim();
  const apiKey = env.RELAYER_API_KEY?.trim();
  if (!rawUrl || !apiKey) return null;
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return { baseUrl: u.toString().replace(/\/+$/, ""), apiKey };
  } catch {
    return null;
  }
}

/**
 * Runs the relayer first; if it is missing, errors or times out, runs the sponsor path instead.
 * Resubmitting is safe: the contract rejects a replayed nonce, so a transaction never pays twice.
 */
export async function submitWithFallback<T>(opts: {
  relayer: (() => Promise<T>) | null;
  sponsor: (() => Promise<T>) | null;
  relayerTimeoutMs: number;
  onFallback?: (reason: string) => void;
}): Promise<T> {
  const { relayer, sponsor, relayerTimeoutMs, onFallback } = opts;
  if (!relayer && !sponsor) throw new Error("No relayer or sponsor configured");
  if (relayer) {
    try {
      return await withTimeout(relayer(), relayerTimeoutMs, "Relayer");
    } catch (err) {
      if (!sponsor) throw err;
      onFallback?.(err instanceof Error ? err.message : String(err));
    }
  }
  return sponsor!();
}
