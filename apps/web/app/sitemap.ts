import type { MetadataRoute } from "next";
import { SITEMAP_PATHS, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  return SITEMAP_PATHS.map((p) => ({ url: p === "/" ? `${site}/` : `${site}${p}` }));
}
