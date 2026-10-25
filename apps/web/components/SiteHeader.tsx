"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { openOnboarding } from "./Onboarding";

export function SiteHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          <span className="text-burnt">●</span> nata
        </Link>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/" className="rounded-full px-3 py-2 hover:bg-line">{t("nav.places")}</Link>
          <Link href="/scan" className="rounded-full px-3 py-2 hover:bg-line">{t("nav.scan")}</Link>
          <Link href="/merchant" className="rounded-full px-3 py-2 hover:bg-line">{t("nav.merchant")}</Link>
          <Link href="/faucet" className="rounded-full px-3 py-2 hover:bg-line">{t("nav.faucet")}</Link>
          <button onClick={openOnboarding} aria-label={t("nav.help")} title={t("nav.help")} className="rounded-full px-3 py-2 hover:bg-line">?</button>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
