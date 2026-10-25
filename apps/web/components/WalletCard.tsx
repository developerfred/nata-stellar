"use client";

import { config } from "@/lib/config";
import { formatAmount, short } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useWallet } from "./useWallet";

export function WalletCard({ compact = false }: { compact?: boolean }) {
  const w = useWallet();
  const t = useT();
  if (!w.ready) return <div className="card h-28 animate-pulse" aria-busy />;

  if (!w.wallet) {
    return (
      <section className="card">
        <h2 className="text-lg font-bold">{t("wallet.title")}</h2>
        <p className="mt-1 text-sm text-muted">
          {w.passkeys ? t("wallet.passkeyHint") : t("wallet.localHint")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" onClick={w.create} disabled={w.busy}>
            {w.busy ? t("wallet.creating") : w.passkeys ? t("wallet.createPasskey") : t("wallet.create")}
          </button>
          {w.passkeys && (
            <button className="btn btn-ghost" onClick={w.connect} disabled={w.busy}>
              {t("wallet.have")}
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
          <p className="label">{t("wallet.balance")}</p>
          <p className="text-3xl font-extrabold tracking-tight">
            {w.balance === null ? "…" : formatAmount(w.balance)}{" "}
            <span className="text-base font-semibold text-muted">{config.tokenSymbol}</span>
          </p>
        </div>
        <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => w.refresh()}>
          {t("wallet.refresh")}
        </button>
      </div>
      {!compact && (
        <p className="mt-3 text-xs text-muted">
          {w.wallet.kind === "passkey" ? t("wallet.passkeyWallet") : t("wallet.deviceWallet")} ·{" "}
          <a className="underline" href={`${config.explorerUrl}/${w.wallet.kind === "passkey" ? "contract" : "account"}/${w.wallet.address}`} target="_blank" rel="noreferrer">
            {short(w.wallet.address)}
          </a>
        </p>
      )}
    </section>
  );
}
