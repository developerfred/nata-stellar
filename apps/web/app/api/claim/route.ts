import { NextResponse } from "next/server";
import { Account, BASE_FEE, Contract, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { claimArgs, rpcServer } from "@/lib/chain";
import { config } from "@/lib/config";
import { explainError } from "@/lib/errors";
import { allow } from "@/lib/server/ratelimit";
import { relayerConfigured, sponsorKeypair, sponsorConfigured, submitSponsored } from "@/lib/server/submit";
import { fromHex } from "@/lib/ticket";

// Fluid compute / Pro allow more; Hobby caps at 60 s. The confirm budget (20 s) stays well under it.
export const maxDuration = 60;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allow(`ip:${ip}`, 20, 60_000))) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  if (!config.campaignsContractId || (!sponsorConfigured() && !relayerConfigured())) {
    return NextResponse.json({ error: "Claiming is not configured on this server" }, { status: 503 });
  }

  let body: { c?: string; visitor?: string; n?: string; e?: string; s?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { c, visitor, n, e, s } = body;
  if (
    !c || !/^\d{1,10}$/.test(c) || !visitor || !n || !e || !/^\d{1,12}$/.test(e) || !s ||
    !(StrKey.isValidEd25519PublicKey(visitor) || StrKey.isValidContract(visitor))
  ) {
    return NextResponse.json({ error: "Malformed ticket" }, { status: 400 });
  }
  if (!(await allow(`wallet:${visitor}`, 5, 60_000))) {
    return NextResponse.json({ error: "Too many attempts for this wallet. Wait a minute." }, { status: 429 });
  }

  try {
    const nonce = fromHex(n);
    const signature = fromHex(s);
    if (nonce.length !== 32 || signature.length !== 64) throw new Error("Malformed ticket");

    const server = rpcServer();
    const sponsor = sponsorConfigured() ? sponsorKeypair() : null;
    const source = sponsor ? await server.getAccount(sponsor.publicKey()) : new Account(process.env.RELAYER_SOURCE ?? "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
    const built = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: config.networkPassphrase })
      .addOperation(new Contract(config.campaignsContractId).call("claim", ...claimArgs(BigInt(c), visitor, nonce, BigInt(e), signature)))
      .setTimeout(60)
      .build();
    // Simulating first turns every contract rule (expired, replay, 2nd visit...) into a clear error before any fee is spent.
    const prepared = await server.prepareTransaction(built);
    const { hash, status } = await submitSponsored(prepared);
    // 202 = submitted but not yet confirmed; the client polls /api/claim/status?hash=...
    return NextResponse.json(
      { hash, pending: status === "PENDING", explorer: `${config.explorerUrl}/tx/${hash}` },
      { status: status === "PENDING" ? 202 : 200 },
    );
  } catch (err) {
    const message = explainError(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

