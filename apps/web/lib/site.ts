/** Absolute origin for robots/sitemap. Public values only; no secrets. */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim();
  const origin = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
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
] as const;
