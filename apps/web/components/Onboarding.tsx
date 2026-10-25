"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import type { Key } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";

const SEEN = "nata.onboarded";
const STEPS = [1, 2, 3, 4, 5] as const;
const ICONS = ["👋", "📍", "🏪", "🔑", "🧪"];
const listeners = new Set<() => void>();

const seen = () => {
  try {
    return localStorage.getItem(SEEN) === "1";
  } catch {
    return true; // storage blocked: never nag
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

/** First-run walkthrough; the nav "How it works" button reopens it. */
export function Onboarding() {
  const t = useT();
  const firstRun = useSyncExternalStore(subscribe, () => !seen(), () => false);
  const [manual, setManual] = useState(false);
  const [step, setStep] = useState(0);
  const open = firstRun || manual;
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const openIt = () => {
      setStep(0);
      setManual(true);
    };
    window.addEventListener("nata:onboarding", openIt);
    return () => window.removeEventListener("nata:onboarding", openIt);
  }, []);

  useEffect(() => {
    if (open) next.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
     
  }, [open]);

  function close() {
    try {
      localStorage.setItem(SEEN, "1");
    } catch {
      /* ignore */
    }
    setManual(false);
    listeners.forEach((cb) => cb());
  }

  if (!open) return null;
  const n = step + 1;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0d1424]/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <div className="card rise grid w-full max-w-md gap-4 overflow-hidden !p-0">
        <div className="azulejo-band" aria-hidden />
        <div className="grid gap-4 p-5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="label">{t("ob.step", { n, total: STEPS.length })}</p>
          <LanguageSwitcher />
        </div>
        <div className="grid size-16 place-items-center rounded-[var(--radius)] bg-azul-soft text-4xl shadow-[inset_0_0_0_1px_var(--azul)]" aria-hidden>{ICONS[step]}</div>
        <h2 id="ob-title" className="display text-3xl">{t(`ob.${n}.title` as Key)}</h2>
        <p className="text-muted">{t(`ob.${n}.body` as Key)}</p>
        {n === 4 && (
          <Link href="/faucet" onClick={close} className="inline-flex min-h-11 items-center text-sm font-semibold text-azul underline">{t("faucet.title")} →</Link>
        )}
        <div className="flex justify-center gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 w-6 rounded-full ${i === step ? "bg-azul" : "bg-line"}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {step === 0 ? (
            <button className="btn btn-ghost" onClick={close}>{t("ob.skip")}</button>
          ) : (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>{t("ob.back")}</button>
          )}
          <button ref={next} className="btn flex-1" onClick={last ? close : () => setStep(step + 1)}>
            {last ? t("ob.start") : t("ob.next")}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export const openOnboarding = () => window.dispatchEvent(new Event("nata:onboarding"));
