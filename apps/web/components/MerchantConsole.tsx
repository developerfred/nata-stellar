"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Keypair } from "@stellar/stellar-sdk";
import { createCampaignArgs, getBalance, invokeAndWait } from "@/lib/chain";
import { config } from "@/lib/config";
import { explainError } from "@/lib/errors";
import { formatAmount, parseAmount, short } from "@/lib/format";
import { createMerchantKey, fundWithFriendbot, importMerchantKey, loadMerchantKey } from "@/lib/merchant";
import { encodePlace, type MenuItem } from "@/lib/place";
import type { PlaceCampaign } from "@/lib/server/campaigns";
import { nativeToScVal } from "@stellar/stellar-sdk";

function parseMenu(text: string): MenuItem[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, price, note] = l.split("|").map((s) => s.trim());
      return { name, price: price ?? "", note: note || undefined };
    });
}

export function MerchantConsole() {
  const [key, setKey] = useState<Keypair | null>(null);
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [mine, setMine] = useState<PlaceCampaign[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [kind, setKind] = useState("Café");
  const [address, setAddress] = useState("");
  const [blurb, setBlurb] = useState("");
  const [promo, setPromo] = useState("");
  const [photo, setPhoto] = useState("");
  const [menu, setMenu] = useState("");
  const [reward, setReward] = useState("2");
  const [budget, setBudget] = useState("100");
  const [days, setDays] = useState("7");

  useEffect(() => {
    setKey(loadMerchantKey());
    setReady(true);
  }, []);

  const reload = useCallback(async (k: Keypair) => {
    if (config.tokenContractId) {
      getBalance(config.tokenContractId, k.publicKey()).then(setBalance).catch(() => setBalance(null));
    }
    try {
      const r = await fetch("/api/campaigns").then((x) => x.json());
      setMine((r.campaigns as PlaceCampaign[]).filter((c) => c.merchant === k.publicKey()));
    } catch {
      setMine([]);
    }
  }, []);

  useEffect(() => {
    if (key) void reload(key);
  }, [key, reload]);

  async function guard(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(explainError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="card h-40 animate-pulse" />;

  if (!key) {
    return (
      <section className="card grid gap-3">
        <h2 className="text-lg font-bold">Set up your counter</h2>
        <p className="text-sm text-muted">
          This device holds the key that signs the QR codes at your counter. It never leaves this browser.
        </p>
        <button className="btn" onClick={() => setKey(createMerchantKey())}>Create counter key</button>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">Use an existing secret key</summary>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget).get("secret") as string;
              guard(async () => setKey(importMerchantKey(v)));
            }}
          >
            <input name="secret" className="input" placeholder="S…" autoComplete="off" />
            <button className="btn btn-ghost">Import</button>
          </form>
        </details>
        {error && <p role="alert" className="text-sm text-burnt">{error}</p>}
      </section>
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!key) return;
    await guard(async () => {
      if (!config.campaignsContractId || !config.tokenContractId) {
        throw new Error("This deployment has no contract configured yet.");
      }
      setStatus("Locking your budget in the contract…");
      const now = Math.floor(Date.now() / 1000);
      const rewardRaw = parseAmount(reward);
      const budgetRaw = parseAmount(budget);
      const metaUri = encodePlace({
        name: name.trim(),
        kind: kind.trim(),
        address: address.trim(),
        blurb: blurb.trim(),
        promo: promo.trim(),
        photo: photo.trim() || undefined,
        menu: parseMenu(menu),
      });
      const { hash } = await invokeAndWait(
        key,
        config.campaignsContractId,
        "create_campaign",
        createCampaignArgs({
          merchant: key.publicKey(),
          token: config.tokenContractId,
          reward: rewardRaw,
          budget: budgetRaw,
          maxClaims: Number(budgetRaw / rewardRaw),
          start: BigInt(now - 60),
          end: BigInt(now + Number(days) * 86400),
          signerPubkey: key.rawPublicKey(),
          metaUri,
        }),
      );
      setStatus(`Campaign created. Transaction ${hash.slice(0, 8)}…`);
      await reload(key);
    });
  }

  async function close(id: string) {
    if (!key) return;
    await guard(async () => {
      await invokeAndWait(key, config.campaignsContractId, "close_campaign", [
        nativeToScVal(BigInt(id), { type: "u64" }),
      ]);
      await reload(key);
    });
  }

  return (
    <div className="grid gap-6">
      <section className="card grid gap-2">
        <p className="label">Merchant account</p>
        <a className="font-mono text-sm underline" href={`${config.explorerUrl}/account/${key.publicKey()}`} target="_blank" rel="noreferrer">
          {short(key.publicKey())}
        </a>
        <p className="text-sm">
          Balance: <b>{balance === null ? "…" : formatAmount(balance)} {config.tokenSymbol}</b>
        </p>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost !min-h-10 text-sm"
            disabled={busy}
            onClick={() => guard(async () => { await fundWithFriendbot(key.publicKey()); setStatus("Account funded with test XLM."); })}
          >
            Fund with test XLM
          </button>
        </div>
      </section>

      {mine.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xl font-bold">Your campaigns</h2>
          {mine.map((c) => {
            const reward = BigInt(c.rewardRaw);
            const spent = reward * BigInt(c.claims);
            return (
              <div key={c.id} className="card grid gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{c.place.name}</h3>
                    <p className="text-sm text-muted">{c.active ? "Live" : "Closed"} · #{c.id}</p>
                  </div>
                  <Link href={`/place/${c.id}`} className="text-sm underline">Public page</Link>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div><dt className="label">Visits</dt><dd className="text-2xl font-extrabold">{c.claims}</dd></div>
                  <div><dt className="label">Cost / visit</dt><dd className="text-2xl font-extrabold">{formatAmount(reward)}</dd></div>
                  <div><dt className="label">Left</dt><dd className="text-2xl font-extrabold">{formatAmount(BigInt(c.remainingRaw))}</dd></div>
                </dl>
                <p className="text-xs text-muted">Spent {formatAmount(spent)} {config.tokenSymbol} for {c.claims} verified visits.</p>
                <div className="flex gap-2">
                  {c.active && (
                    <Link href={`/merchant/counter?c=${c.id}`} className="btn flex-1">Counter mode</Link>
                  )}
                  {c.active && (
                    <button className="btn btn-ghost" disabled={busy} onClick={() => close(c.id)}>Close &amp; refund</button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <form onSubmit={create} className="card grid gap-4">
        <h2 className="text-xl font-bold">New campaign</h2>
        <div><label className="label" htmlFor="name">Place name</label><input id="name" className="input" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="kind">Type</label><input id="kind" className="input" required maxLength={30} value={kind} onChange={(e) => setKind(e.target.value)} /></div>
          <div><label className="label" htmlFor="addr">Address</label><input id="addr" className="input" required maxLength={80} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        </div>
        <div><label className="label" htmlFor="blurb">Short description</label><input id="blurb" className="input" maxLength={120} value={blurb} onChange={(e) => setBlurb(e.target.value)} /></div>
        <div><label className="label" htmlFor="promo">Promotion</label><input id="promo" className="input" maxLength={120} value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Visit us and get paid" /></div>
        <div><label className="label" htmlFor="photo">Photo URL (https, optional)</label><input id="photo" className="input" type="url" value={photo} onChange={(e) => setPhoto(e.target.value)} /></div>
        <div>
          <label className="label" htmlFor="menu">Menu, one item per line: name | price | note</label>
          <textarea id="menu" className="input !min-h-28" value={menu} onChange={(e) => setMenu(e.target.value)} placeholder={"Pastel de nata | €1.30 | Fresh from the oven\nGalão | €2.20"} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label" htmlFor="reward">Reward / visit</label><input id="reward" className="input" inputMode="decimal" required value={reward} onChange={(e) => setReward(e.target.value)} /></div>
          <div><label className="label" htmlFor="budget">Budget</label><input id="budget" className="input" inputMode="decimal" required value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          <div><label className="label" htmlFor="days">Days</label><input id="days" className="input" inputMode="numeric" required value={days} onChange={(e) => setDays(e.target.value)} /></div>
        </div>
        <button className="btn" disabled={busy}>{busy ? "Working…" : `Lock ${budget || 0} ${config.tokenSymbol} and launch`}</button>
        {status && <p className="text-sm text-ok">{status}</p>}
        {error && <p role="alert" className="text-sm text-burnt">{error}</p>}
      </form>
    </div>
  );
}
