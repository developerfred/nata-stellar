import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { config } from "@/lib/config";
import { FAUCET_AMOUNT, faucetKeypair, sendFaucet } from "@/lib/server/faucet";
import { allow, sharedLimiterConfigured } from "@/lib/server/ratelimit";

// The send is bounded to ~8 s and returns a pending hash after that, so a 10 s free-plan limit is enough.
export const maxDuration = 30;

const DAY = 24 * 60 * 60_000;
const fail = (code: string, error: string, status: number) => NextResponse.json({ error, code }, { status });

/** Mints test vUSD to a testnet address. Server-only key; limits are per address, per IP and global per day. */
export async function POST(req: Request) {
  if (!faucetKeypair()) return fail("err.faucet_off", "Faucet is not configured", 503);
  // On Vercel, per-instance memory is not a limit at all: refuse to mint money without the shared store.
  if (process.env.VERCEL && !sharedLimiterConfigured()) {
    return fail("err.faucet_off", "Faucet needs the shared rate-limit store", 503);
  }

  const { address } = (await req.json().catch(() => ({}))) as { address?: string };
  if (!address || !(StrKey.isValidEd25519PublicKey(address) || StrKey.isValidContract(address))) {
    return fail("err.faucet_address", "Invalid address", 400);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const perAddress = Number(process.env.FAUCET_PER_ADDRESS_DAILY ?? 3);
  const perIp = Number(process.env.FAUCET_PER_IP_DAILY ?? 10);
  const globalCap = Math.floor(Number(process.env.FAUCET_DAILY_BUDGET ?? 20_000) / Number(FAUCET_AMOUNT));
  if (!(await allow(`faucet:addr:${address}`, perAddress, DAY))) return fail("err.faucet_limit_address", "Daily limit reached for this address", 429);
  if (!(await allow(`faucet:ip:${ip}`, perIp, DAY))) return fail("err.faucet_limit_ip", "Daily limit reached for this network", 429);
  if (!(await allow("faucet:global", globalCap, DAY))) return fail("err.faucet_empty", "The faucet is empty for today", 429);

  try {
    const { hash, status } = await sendFaucet(address);
    return NextResponse.json(
      { hash, pending: status === "PENDING", amount: FAUCET_AMOUNT, explorer: `${config.explorerUrl}/tx/${hash}` },
      { status: status === "PENDING" ? 202 : 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "no_trustline") return fail("err.trustline", "Add the vUSD trustline first", 422);
    if (msg === "busy") return fail("err.faucet_busy", "The faucet is busy, try again", 503);
    return fail("err.faucet_failed", "Could not send vUSD", 502);
  }
}
