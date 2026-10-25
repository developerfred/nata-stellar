// Test-only: plain Node ESM cannot resolve "next/server" (no extension) or the extensionless
// relative imports that tsc/Next accept, so patch both.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "next/server") return n("next/server.js", c);
  if (s.startsWith("./") && !/\\.[a-z]+$/.test(s)) return n(s + ".ts", c);
  return n(s, c);
}`),
);
