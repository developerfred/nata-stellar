"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { errorKey } from "../errors";
import { DICTIONARIES, LOCALES, isKey, type Key, type Locale } from "./dictionaries";

const STORE = "nata.locale";
const listeners = new Set<() => void>();

const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/** Saved choice first, then the browser's language list, then English. */
function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORE);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage blocked: fall through to the browser language */
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l?.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: Key, vars?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // The server snapshot is always "en" so hydration matches; the client then switches to the detected language.
  const locale = useSyncExternalStore(subscribe, detect, () => "en" as Locale);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(STORE, l);
    } catch {
      /* ignore */
    }
    listeners.forEach((cb) => cb());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => {
        const text = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key;
        return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? "")) : text;
      },
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export const useT = () => useI18n().t;

/** Inline translated text for server components: <T k="home.title" />. */
export function T({ k, vars }: { k: Key; vars?: Record<string, string | number> }) {
  return <>{useT()(k, vars)}</>;
}

/** Turns anything thrown (or an API error body) into a message in the current language. */
export function useExplain() {
  const t = useT();
  return useCallback(
    (raw: unknown): string => {
      const code = (raw as { code?: unknown } | null)?.code;
      if (typeof code === "string" && isKey(code)) return t(code);
      const key = errorKey(raw);
      if (key) return t(key);
      const text = raw instanceof Error ? raw.message : typeof (raw as { error?: unknown })?.error === "string" ? (raw as { error: string }).error : "";
      if (!text) return t("err.generic");
      return text.length > 200 ? text.slice(0, 200) + "…" : text;
    },
    [t],
  );
}
