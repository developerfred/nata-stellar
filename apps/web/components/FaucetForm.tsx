"use client";

import { Keypair } from "@stellar/stellar-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useExplain, useT } from "@/lib/i18n";
import { fundWithFriendbot, loadMerchantKey } from "@/lib/merchant";
import { addTrustline, loadWallet } from "@/lib/wallet";

type State =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done"; amount: string; explorer: string }
  | { kind: "error"; message: string };

const SECRET_KEYS = ["nata.wallet.secret", "nata.merchant.secret"];

/** Keypair for `address` when this browser holds its secret (device wallet or counter key). */
function localKeypair(address: string): Keypair | null {
  for (const k of SECRET_KEYS) {
    try {
      const s = localStorage.getItem(k);
      if (s && Keypair.fromSecret(s).publicKey() === address) return Keypair.fromSecret(s);
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function waitForHash(hash: string) {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const j = await fetch(`/api/claim/status?hash=${encodeURIComponent(hash)}`).then((r) => r.json()).catch(() => ({}));
    if (j.status === "SUCCESS") return;
    if (j.status === "FAILED") throw Object.assign(new Error(""), { code: "err.faucet_failed" });
  }
}

export function FaucetForm() {
  const t = useT();
  const explain = useExplain();
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const w = loadWallet()?.address ?? null;
    const m = loadMerchantKey()?.publicKey() ?? null;
    setWallet(w);
    setMerchant(m);
    setAddress(m ?? w ?? "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const to = address.trim();
    setState({ kind: "working" });
    try {
      // Accounts this browser controls opt in to vUSD first (fees sponsored); pasted addresses must already have it.
      const kp = to.startsWith("G") ? localKeypair(to) : null;
      if (kp) {
        await fundWithFriendbot(to);
        await addTrustline(kp);
      }
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: to }),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 202) throw Object.assign(new Error(json.error ?? ""), { code: json.code });
      if (json.pending) await waitForHash(json.hash);
      setState({ kind: "done", amount: json.amount, explorer: json.explorer });
    } catch (err) {
      setState({ kind: "error", message: explain(err) });
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-4">
      <div>
        <label className="label" htmlFor="addr">{t("faucet.address")}</label>
        <input id="addr" className="input font-mono text-sm" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="G… / C…" autoComplete="off" spellCheck={false} />
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {wallet && <button type="button" className="btn btn-ghost !min-h-9" onClick={() => setAddress(wallet)}>{t("faucet.useWallet")}</button>}
          {merchant && <button type="button" className="btn btn-ghost !min-h-9" onClick={() => setAddress(merchant)}>{t("faucet.useMerchant")}</button>}
        </div>
      </div>
      <button className="btn" disabled={state.kind === "working" || !address.trim()}>
        {state.kind === "working" ? t("faucet.sending") : t("faucet.get", { symbol: config.tokenSymbol })}
      </button>
      <p className="text-xs text-muted">{t("faucet.note")}</p>
      {state.kind === "done" && (
        <div className="text-sm text-ok" role="status">
          <p className="font-semibold">{t("faucet.done", { amount: state.amount, symbol: config.tokenSymbol })}</p>
          <a className="underline" href={state.explorer} target="_blank" rel="noreferrer">{t("claim.viewTx")}</a>
          {" · "}
          <Link className="underline" href="/merchant">{t("nav.merchant")}</Link>
        </div>
      )}
      {state.kind === "error" && <p role="alert" className="text-sm text-burnt">{state.message}</p>}
    </form>
  );
}
