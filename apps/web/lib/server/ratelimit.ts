import "server-only";

/**
 * Rate limiter that is safe on serverless. When Upstash Redis / Vercel KV REST credentials are set
 * the counters are shared across instances; otherwise (or if the store is unreachable) it falls
 * back to a per-instance in-memory window.
 */
const hits = new Map<string, number[]>();

function allowInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

function store(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export const sharedLimiterConfigured = () => store() !== null;

/** Fixed-window counter: INCR the key, set its expiry on first hit. */
async function allowShared(s: { url: string; token: string }, key: string, limit: number, windowMs: number): Promise<boolean> {
  const bucket = Math.floor(Date.now() / windowMs);
  const k = `nata:rl:${key}:${bucket}`;
  const res = await fetch(`${s.url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${s.token}`, "content-type": "application/json" },
    body: JSON.stringify([["INCR", k], ["PEXPIRE", k, String(windowMs), "NX"]]),
    signal: AbortSignal.timeout(1500),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`rate limit store ${res.status}`);
  const out = (await res.json()) as { result?: number; error?: string }[];
  const count = out[0]?.result;
  if (typeof count !== "number") throw new Error(out[0]?.error ?? "rate limit store error");
  return count <= limit;
}

export async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  const s = store();
  if (s) {
    try {
      return await allowShared(s, key, limit, windowMs);
    } catch (err) {
      console.warn("rate limit store unavailable, using in-memory fallback:", err instanceof Error ? err.message : err);
    }
  }
  return allowInMemory(key, limit, windowMs);
}
