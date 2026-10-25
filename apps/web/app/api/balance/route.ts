import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { getBalance } from "@/lib/chain";
import { config } from "@/lib/config";

export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address") ?? "";
  if (!StrKey.isValidEd25519PublicKey(address) && !StrKey.isValidContract(address)) {
    return NextResponse.json({ error: "Bad address" }, { status: 400 });
  }
  if (!config.tokenContractId) return NextResponse.json({ balance: "0" });
  try {
    return NextResponse.json({ balance: (await getBalance(config.tokenContractId, address)).toString() });
  } catch {
    return NextResponse.json({ balance: "0" });
  }
}
