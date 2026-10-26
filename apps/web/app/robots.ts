import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Crawlers and agents that may read the public pages and machine-readable docs. */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  const rule = { allow: "/", disallow: "/api/" };
  return {
    rules: [{ userAgent: "*", ...rule }, ...AI_CRAWLERS.map((userAgent) => ({ userAgent, ...rule }))],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
