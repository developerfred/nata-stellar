/** Production origin, used when NEXT_PUBLIC_SITE_URL is unset. */
export const DEFAULT_SITE_URL = "https://nata-stellar.vercel.app";

/** Absolute origin for metadata, robots, sitemap and llms.txt. Public values only; no secrets. */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const origin = env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return origin.replace(/\/+$/, "");
}

/** Public, static pages and machine-readable docs. API routes are excluded on purpose. */
export const SITEMAP_PATHS = [
  "/",
  "/map",
  "/docs",
  "/faucet",
  "/scan",
  "/merchant",
  "/llms.txt",
  "/llms-full.txt",
  "/docs/agents.md",
  "/.well-known/mcp.json",
  "/openapi.json",
] as const;
