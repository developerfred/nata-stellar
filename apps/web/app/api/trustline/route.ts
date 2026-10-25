import { NextResponse } from "next/server";
import { Asset, Networks, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import { config } from "@/lib/config";
import { describeError } from "@/lib/errors";
import { allow } from "@/lib/server/ratelimit";
import { sendAndWait, sponsorConfigured, sponsorKeypair } from "@/lib/server/submit";

export const maxDuration = 60;

/**
 * Sponsors a visitor's trustline opt-in. The visitor signs a single `changeTrust` for the reward asset;
 * we only ever wrap that exact shape in a fee bump, so this cannot be used to pay for anything else.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allow(`trust:${ip}`, 10, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many attempts", code: "err.rate_ip" }, { status: 429 });
  }
  if (!config.tokenIssuer || !sponsorConfigured()) {
    return NextResponse.json({ error: "Not configured", code: "err.not_configured" }, { status: 503 });
  }
  const { xdr } = (await req.json().catch(() => ({}))) as { xdr?: string };
  if (!xdr || xdr.length > 10_000) return NextResponse.json({ error: "Bad request", code: "err.bad_request" }, { status: 400 });

  try {
    const inner = TransactionBuilder.fromXDR(xdr, config.networkPassphrase || Networks.TESTNET);
    if (!(inner instanceof Transaction) || inner.operations.length !== 1) throw new Error("bad shape");
    const op = inner.operations[0];
    const wanted = new Asset(config.tokenSymbol, config.tokenIssuer);
    if (op.type !== "changeTrust" || op.source !== undefined || !("line" in op) || !wanted.equals(op.line as Asset)) {
      throw new Error("bad shape");
    }
    if (inner.signatures.length === 0) throw new Error("unsigned");
    const sponsor = sponsorKeypair();
    const bumped = TransactionBuilder.buildFeeBumpTransaction(sponsor, "10000", inner, config.networkPassphrase);
    bumped.sign(sponsor);
    return NextResponse.json({ hash: await sendAndWait(bumped) });
  } catch (err) {
    const { code, text } = describeError(err);
    return NextResponse.json({ error: text, code: code ?? "err.trustline" }, { status: 422 });
  }
}
