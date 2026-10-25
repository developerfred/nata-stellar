"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectPasskeyWallet,
  createLocalWallet,
  createPasskeyWallet,
  forgetWallet,
  loadWallet,
  passkeysEnabled,
  type WalletInfo,
} from "@/lib/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [passkeys, setPasskeys] = useState(false);

  useEffect(() => {
    setWallet(loadWallet());
    setPasskeys(passkeysEnabled());
    setReady(true);
  }, []);

  const refresh = useCallback(async (address: string) => {
    try {
      const r = await fetch(`/api/balance?address=${address}`);
      const j = await r.json();
      setBalance(BigInt(j.balance ?? "0"));
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    if (wallet) void refresh(wallet.address);
  }, [wallet, refresh]);

  const run = useCallback(async (fn: () => Promise<WalletInfo>) => {
    setBusy(true);
    setError(null);
    try {
      setWallet(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    wallet,
    ready,
    busy,
    error,
    balance,
    passkeys,
    refresh: () => wallet && refresh(wallet.address),
    create: () => run(passkeys ? createPasskeyWallet : createLocalWallet),
    connect: () => run(connectPasskeyWallet),
    disconnect: () => {
      forgetWallet();
      setWallet(null);
      setBalance(null);
    },
  };
}
