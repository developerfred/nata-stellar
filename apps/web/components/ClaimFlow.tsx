"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { KeyedError } from "@/lib/errors";
import { formatAmount } from "@/lib/format";
import { useExplain, useT } from "@/lib/i18n";
import { decodeTicket } from "@/lib/ticket";
import { ensureTrustline } from "@/lib/wallet";
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
    if (json.status === "FAILED") throw new KeyedError("err.claimOnchain");
  }
  throw new KeyedError("err.stillConfirming");
}

export function ClaimFlow() {
  const params = useSearchParams();
  const w = useWallet();
  const t = useT();
  const explain = useExplain();
  const [state, setState] = useState<State>({ kind: "idle" });
  const started = useRef(false);

  let ticketError = false;
  let ticket: ReturnType<typeof decodeTicket> | null = null;
  try {
    ticket = decodeTicket(new URLSearchParams(params.toString()));
  } catch {
    ticketError = true;
  }

  async function claim() {
    if (!ticket || !w.wallet) return;
    setState({ kind: "sending" });
    try {
      await ensureTrustline(w.wallet); // device wallets opt in to the reward token first; sponsored, no XLM
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
      if (!res.ok && res.status !== 202) throw Object.assign(new Error(json.error ?? ""), { code: json.code });
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
      setState({ kind: "error", message: explain(e) });
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
        <p role="alert" className="display text-xl">{t("claim.invalid")}</p>
        <Link href="/scan" className="btn mt-4">{t("claim.scanAgain")}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {state.kind === "done" ? (
        <section className="card rise grid justify-items-center gap-1 overflow-hidden !p-0 text-center" role="status">
          <div className="azulejo-band w-full" aria-hidden />
          <div className="grid justify-items-center gap-1 p-6">
          <span aria-hidden className="mb-2 grid size-14 place-items-center rounded-full bg-ok text-3xl text-background">✓</span>
          <p className="display text-5xl tabular-nums text-ok">+{state.reward ?? ""} {config.tokenSymbol}</p>
          <p className="mt-2 font-semibold">{t("claim.confirmed")}</p>
          <a className="mt-3 inline-flex min-h-11 items-center text-sm text-azul underline" href={state.explorer} target="_blank" rel="noreferrer">
            {t("claim.viewTx")}
          </a>
          </div>
        </section>
      ) : state.kind === "sending" ? (
        <section className="card grid justify-items-center gap-2 text-center" role="status" aria-live="polite">
          <div className="spinner" aria-hidden />
          <p className="display text-xl">{t("claim.sending")}</p>
          <p className="mt-1 text-sm text-muted">{t("claim.seconds")}</p>
        </section>
      ) : state.kind === "error" ? (
        <section className="card">
          <p role="alert" className="display text-xl text-burnt">{state.message}</p>
          <Link href="/scan" className="btn mt-4">{t("claim.scanAgain")}</Link>
        </section>
      ) : !w.wallet && w.ready ? (
        <section className="card">
          <p className="display text-xl">{t("claim.createFirst")}</p>
          <p className="mt-1 text-sm text-muted">{t("claim.hurry")}</p>
        </section>
      ) : null}
      <WalletCard />
    </div>
  );
}
