"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { decodeTicket } from "@/lib/ticket";
import { WalletCard } from "./WalletCard";
import { useWallet } from "./useWallet";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; hash: string; explorer: string; reward: string | null }
  | { kind: "error"; message: string };

/** The server hands back a pending hash when confirmation outlasts its time budget. */
async function waitForConfirmation(hash: string) {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`/api/claim/status?hash=${encodeURIComponent(hash)}`);
    const json = await res.json().catch(() => ({}));
    if (json.status === "SUCCESS") return;
    if (json.status === "FAILED") throw new Error("The claim failed on-chain. Scan a fresh code and try again.");
  }
  throw new Error("Still confirming. Check the transaction on the explorer before scanning again.");
}

export function ClaimFlow() {
  const params = useSearchParams();
  const w = useWallet();
  const [state, setState] = useState<State>({ kind: "idle" });
  const started = useRef(false);

  let ticketError: string | null = null;
  let ticket: ReturnType<typeof decodeTicket> | null = null;
  try {
    ticket = decodeTicket(new URLSearchParams(params.toString()));
  } catch {
    ticketError = "This link is not a valid counter code. Scan the QR at the counter again.";
  }

  async function claim() {
    if (!ticket || !w.wallet) return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          c: params.get("c"),
          n: params.get("n"),
          e: params.get("e"),
          s: params.get("s"),
          visitor: w.wallet.address,
        }),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 202) throw new Error(json.error ?? "Claim failed");
      if (json.pending) await waitForConfirmation(json.hash);
      let reward: string | null = null;
      try {
        const info = await fetch(`/api/campaigns/${params.get("c")}`).then((r) => r.json());
        reward = formatAmount(BigInt(info.campaign.rewardRaw));
      } catch {
        /* reward display is best-effort */
      }
      setState({ kind: "done", hash: json.hash, explorer: json.explorer, reward });
      void w.refresh();
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Claim failed" });
    }
  }

  // A counter QR lives ~30s, so claim immediately once a wallet exists.
  useEffect(() => {
    if (w.wallet && ticket && !started.current) {
      started.current = true;
      void claim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.wallet]);

  if (ticketError) {
    return (
      <div className="card">
        <p role="alert">{ticketError}</p>
        <Link href="/scan" className="btn mt-4">Scan again</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {state.kind === "done" ? (
        <section className="card text-center">
          <p className="text-5xl font-extrabold text-ok">+{state.reward ?? ""} {config.tokenSymbol}</p>
          <p className="mt-2 font-semibold">Visit confirmed. Enjoy!</p>
          <a className="mt-3 inline-block text-sm underline" href={state.explorer} target="_blank" rel="noreferrer">
            View the transaction on stellar.expert
          </a>
        </section>
      ) : state.kind === "sending" ? (
        <section className="card text-center">
          <p className="text-lg font-bold">Confirming your visit…</p>
          <p className="mt-1 text-sm text-muted">This takes a few seconds.</p>
        </section>
      ) : state.kind === "error" ? (
        <section className="card">
          <p role="alert" className="font-semibold text-burnt">{state.message}</p>
          <Link href="/scan" className="btn mt-4">Scan again</Link>
        </section>
      ) : !w.wallet && w.ready ? (
        <section className="card">
          <p className="font-semibold">Create your wallet to collect this reward.</p>
          <p className="mt-1 text-sm text-muted">Do it now: the counter code only lasts about 30 seconds.</p>
        </section>
      ) : null}
      <WalletCard />
    </div>
  );
}
