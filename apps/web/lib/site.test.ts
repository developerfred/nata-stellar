import test from "node:test";
import assert from "node:assert/strict";
import { SITEMAP_PATHS, siteUrl } from "./site.ts";

test("siteUrl prefers NEXT_PUBLIC_SITE_URL and trims trailing slashes", () => {
  assert.equal(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://nata.example/", VERCEL_URL: "x.vercel.app" }), "https://nata.example");
});

test("siteUrl falls back to the Vercel URL, then localhost", () => {
  assert.equal(siteUrl({ VERCEL_URL: "x.vercel.app" }), "https://x.vercel.app");
  assert.equal(siteUrl({}), "http://localhost:3000");
});

test("sitemap lists no API routes", () => {
  assert.ok(SITEMAP_PATHS.every((p) => !p.startsWith("/api")));
});

test("sitemap includes the Lisbon map", () => {
  assert.ok((SITEMAP_PATHS as readonly string[]).includes("/map"));
});
