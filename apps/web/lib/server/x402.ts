/** Stellar tokens use 7 decimals (mirrors TOKEN_DECIMALS in lib/config; kept local so this file stays testable without bundler aliases). */
const TOKEN_DECIMALS = 7;

/** Stellar network ids in CAIP-2 form, as the x402 Stellar scheme expects them. */
export type X402Network = "stellar:testnet" | "stellar:pubnet";

export type X402Settings = {
  network: X402Network;
  payTo: string;
  /** SEP-41 token contract the caller pays in (vUSD or USDC). */
  asset: string;
  /** Price in the token's smallest unit (7 decimals). */
  amountRaw: string;
  facilitatorUrl: string;
  facilitatorApiKey: string | null;
};

const DEFAULT_FACILITATOR = "https://www.x402.org/facilitator";
const DEFAULT_PRICE = "0.01";

/** Decimal string to raw token units, without floats. Returns null for anything that is not a positive amount. */
export function toRawAmount(price: string, decimals = TOKEN_DECIMALS): string | null {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(price.trim());
  if (!m) return null;
  const frac = m[2] ?? "";
  if (frac.length > decimals) return null;
  const raw = BigInt(m[1] + frac.padEnd(decimals, "0"));
  return raw > 0n ? raw.toString() : null;
}

/**
 * Reads the x402 paywall settings. Returns null when the paywall is not configured,
 * so the route can answer 503 instead of serving the content for free.
 * `X402_PAY_TO` is a public key; the optional API key is server-only.
 */
export function parseX402(env: Record<string, string | undefined>): X402Settings | null {
  const payTo = env.X402_PAY_TO?.trim();
  const asset = (env.X402_ASSET ?? env.NEXT_PUBLIC_TOKEN_CONTRACT_ID ?? "").trim();
  if (!payTo || !/^G[A-Z2-7]{55}$/.test(payTo) || !asset) return null;
  const amountRaw = toRawAmount(env.X402_PRICE ?? DEFAULT_PRICE);
  if (!amountRaw) return null;
  const network: X402Network = env.X402_NETWORK === "stellar:pubnet" ? "stellar:pubnet" : "stellar:testnet";
  const facilitatorUrl = (env.X402_FACILITATOR_URL ?? DEFAULT_FACILITATOR).trim().replace(/\/+$/, "");
  try {
    if (new URL(facilitatorUrl).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return {
    network,
    payTo,
    asset,
    amountRaw,
    facilitatorUrl,
    facilitatorApiKey: env.X402_FACILITATOR_API_KEY?.trim() || null,
  };
}

/** x402 route config for one paid endpoint, pricing in the configured SEP-41 token. */
export function routeConfig(s: X402Settings, description: string) {
  return {
    accepts: {
      scheme: "exact" as const,
      network: s.network,
      payTo: s.payTo,
      price: { asset: s.asset, amount: s.amountRaw },
    },
    description,
    mimeType: "application/json",
  };
}
