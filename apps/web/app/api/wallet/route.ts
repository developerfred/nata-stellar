import { NextResponse } from "next/server";
import { PasskeyServer } from "passkey-kit/server";
import { config } from "@/lib/config";
import { allow } from "@/lib/server/ratelimit";
import { relayerSettings } from "@/lib/server/submit";

export const maxDuration = 60;

/** Submits a passkey wallet deployment through the relayer so visitors never need XLM. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allow(`wallet-create:${ip}`, 5, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many wallets created from this network", code: "err.rate_wallet_create" }, { status: 429 });
  }
  const relayer = relayerSettings();
  if (!relayer) {
    return NextResponse.json({ error: "Passkey wallets are not enabled on this server", code: "err.passkeys_off" }, { status: 503 });
  }
  const { xdr } = (await req.json().catch(() => ({}))) as { xdr?: string };
  if (!xdr || xdr.length > 100_000) return NextResponse.json({ error: "Bad request", code: "err.bad_request" }, { status: 400 });

  const server = new PasskeyServer({
    networkPassphrase: config.networkPassphrase,
    rpcUrl: config.rpcUrl,
    relayer: { baseUrl: relayer.baseUrl, apiKey: relayer.apiKey },
  });
  const res = await server.send(xdr);
  if (!res.success) return NextResponse.json({ error: res.error.message }, { status: 422 });
  return NextResponse.json({ hash: res.hash });
}
