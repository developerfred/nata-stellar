import { TOKEN_DECIMALS } from "./config";

const SCALE = 10n ** BigInt(TOKEN_DECIMALS);

/** 20000000n -> "2" ; 12500000n -> "1.25" */
export function formatAmount(raw: bigint): string {
  const whole = raw / SCALE;
  const frac = (raw % SCALE).toString().padStart(TOKEN_DECIMALS, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac.slice(0, 2).padEnd(2, "0")}` : whole.toString();
}

/** "1.25" -> 12500000n */
export function parseAmount(input: string): bigint {
  if (!/^\d+(\.\d{1,7})?$/.test(input.trim())) throw new Error("Invalid amount");
  const [w, f = ""] = input.trim().split(".");
  return BigInt(w) * SCALE + BigInt(f.padEnd(TOKEN_DECIMALS, "0"));
}

export const short = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;
