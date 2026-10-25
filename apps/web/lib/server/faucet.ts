import "server-only";
import { Address, Asset, BASE_FEE, Contract, Keypair, Operation, StrKey, TransactionBuilder, nativeToScVal } from "@stellar/stellar-sdk";
import { hasTrustline, rpcServer } from "../chain";
import { config, TOKEN_DECIMALS } from "../config";
import { parseAmount } from "../format";

export const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT ?? "100";
/** Whole-request deadline: stays under a 10 s serverless limit; after it the client polls for the hash. */
const BUDGET_MS = Number(process.env.FAUCET_BUDGET_MS ?? 8_000);

export const faucetSecret = () => process.env.FAUCET_SECRET || null;

/** The faucet key must be the token's issuer so it can mint; refuse to run with any other key. */
export function faucetKeypair(): Keypair | null {
  const secret = faucetSecret();
  if (!secret || !config.tokenIssuer) return null;
  const kp = Keypair.fromSecret(secret);
  return kp.publicKey() === config.tokenIssuer ? kp : null;
}

export type FaucetResult = { hash: string; status: "SUCCESS" | "PENDING" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mints vUSD from the issuer account. The issuer is the only source account, so concurrent requests
 * race for its sequence number: a bad-sequence rejection is retried with a fresh sequence and jitter.
 */
export async function sendFaucet(to: string): Promise<FaucetResult> {
  const issuer = faucetKeypair();
  if (!issuer) throw new Error("Faucet is not configured");
  const server = rpcServer();
  const deadline = Date.now() + BUDGET_MS;
  const amount = parseAmount(FAUCET_AMOUNT);
  const classic = StrKey.isValidEd25519PublicKey(to);
  if (classic && !(await hasTrustline(to))) throw new Error("no_trustline");

  for (let attempt = 0; attempt < 5 && Date.now() < deadline; attempt++) {
    const account = await server.getAccount(issuer.publicKey());
    const b = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: config.networkPassphrase });
    if (classic) {
      b.addOperation(
        Operation.payment({
          destination: to,
          asset: new Asset(config.tokenSymbol, config.tokenIssuer),
          amount: (Number(amount) / 10 ** TOKEN_DECIMALS).toFixed(TOKEN_DECIMALS),
        }),
      );
    } else {
      // Passkey (contract) wallets receive through the token contract, no trustline needed.
      b.addOperation(
        new Contract(config.tokenContractId).call(
          "transfer",
          new Address(issuer.publicKey()).toScVal(),
          new Address(to).toScVal(),
          nativeToScVal(amount, { type: "i128" }),
        ),
      );
    }
    let tx = b.setTimeout(30).build();
    if (!classic) tx = await server.prepareTransaction(tx);
    tx.sign(issuer);
    const sent = await server.sendTransaction(tx);
    if (sent.status === "ERROR" || sent.status === "TRY_AGAIN_LATER") {
      await sleep(150 + Math.random() * 350 * (attempt + 1)); // lost the sequence race: refetch and retry
      continue;
    }
    while (Date.now() < deadline) {
      const r = await server.getTransaction(sent.hash);
      if (r.status === "SUCCESS") return { hash: sent.hash, status: "SUCCESS" };
      if (r.status === "FAILED") throw new Error("Transaction failed on-chain");
      await sleep(1000);
    }
    return { hash: sent.hash, status: "PENDING" };
  }
  throw new Error("busy");
}
