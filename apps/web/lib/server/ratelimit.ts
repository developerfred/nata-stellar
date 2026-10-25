import "server-only";

/**
 * Fixed-window rate limiter. Serverless instances share nothing, so when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (Vercel KV / Upstash) counters live there and hold across instances.
 * Without them it falls back to per-instance memory, which is fine locally and for a small demo.
 */
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const memory = new Map<string, { n: number; reset: number }>();

async function allowRemote(key: string, limit: number, windowMs: number): Promise<boolean> {
  const k = `nata:rl:${key}`;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([["INCR", k], ["PEXPIRE", k, String(windowMs), "NX"]]),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`rate limit store ${res.status}`);
  const [incr] = (await res.json()) as { result: number }[];
  return incr.result <= limit;
}

function allowLocal(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || now >= cur.reset) {
    memory.set(key, { n: 1, reset: now + windowMs });
    if (memory.size > 5000) for (const [k, v] of memory) if (now >= v.reset) memory.delete(k);
    return true;
  }
  cur.n += 1;
  return cur.n <= limit;
}

export async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (url && token) {
    try {
      return await allowRemote(key, limit, windowMs);
    } catch {
      /* store unreachable: degrade to the local limiter rather than blocking every visitor */
    }
  }
  return allowLocal(key, limit, windowMs);
}
