"use client";

import { config } from "@/lib/config";
import { formatAmount, short } from "@/lib/format";
import { useWallet } from "./useWallet";

export function WalletCard({ compact = false }: { compact?: boolean }) {
  const w = useWallet();
  if (!w.ready) return <div className="card h-28 animate-pulse" aria-busy />;

  if (!w.wallet) {
    return (
      <section className="card">
        <h2 className="text-lg font-bold">Your wallet</h2>
        <p className="mt-1 text-sm text-muted">
          {w.passkeys
            ? "Create it with Face ID or Touch ID. No seed phrase, no fees."
            : "Create a wallet on this device to collect rewards."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" onClick={w.create} disabled={w.busy}>
            {w.busy ? "Creating…" : w.passkeys ? "Create with passkey" : "Create wallet"}
          </button>
          {w.passkeys && (
            <button className="btn btn-ghost" onClick={w.connect} disabled={w.busy}>
              I have a wallet
            </button>
          )}
        </div>
        {w.error && <p role="alert" className="mt-3 text-sm text-burnt">{w.error}</p>}
      </section>
    );
  }

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">Balance</p>
          <p className="text-3xl font-extrabold tracking-tight">
            {w.balance === null ? "…" : formatAmount(w.balance)}{" "}
            <span className="text-base font-semibold text-muted">{config.tokenSymbol}</span>
          </p>
        </div>
        <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => w.refresh()}>
          Refresh
        </button>
      </div>
      {!compact && (
        <p className="mt-3 text-xs text-muted">
          {w.wallet.kind === "passkey" ? "Passkey wallet" : "Device wallet"} ·{" "}
          <a className="underline" href={`${config.explorerUrl}/${w.wallet.kind === "passkey" ? "contract" : "account"}/${w.wallet.address}`} target="_blank" rel="noreferrer">
            {short(w.wallet.address)}
          </a>
        </p>
      )}
    </section>
  );
}
