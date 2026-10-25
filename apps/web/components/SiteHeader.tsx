"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { openOnboarding } from "./Onboarding";

const LINKS = [
  { href: "/", key: "nav.places" },
  { href: "/scan", key: "nav.scan" },
  { href: "/merchant", key: "nav.merchant" },
  { href: "/faucet", key: "nav.faucet" },
] as const;

const LINK_CLASS =
  "flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-muted hover:bg-azul-soft aria-[current=page]:text-azul aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8 sm:flex-none";

function NavLinks({ path }: { path: string | null }) {
  const t = useT();
  const active = (href: string) =>
    path !== null && (href === "/" ? path === "/" || path.startsWith("/place") : path.startsWith(href));
  return LINKS.map((l) => (
    <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={LINK_CLASS}>
      {t(l.key)}
    </Link>
  ));
}

/** usePathname needs a Suspense boundary under cache components; links render unmarked until it resolves. */
function ActiveNavLinks() {
  return <NavLinks path={usePathname()} />;
}

export function SiteHeader() {
  const t = useT();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/95 pt-[env(safe-area-inset-top)]">
      <nav className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-2 px-4 py-2">
        <Link href="/" className="display flex min-h-11 items-center gap-2 text-2xl">
          <span aria-hidden className="size-6 rounded-[3px] bg-azul-soft bg-[url('/azulejo.svg')] bg-cover shadow-[inset_0_0_0_1px_var(--azul)]" />
          nata
        </Link>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <button onClick={openOnboarding} aria-label={t("nav.help")} title={t("nav.help")} className="grid size-11 place-items-center rounded-full hover:bg-azul-soft">?</button>
          <LanguageSwitcher />
        </div>
        <div className="-mx-2 flex w-full items-center text-sm font-semibold sm:mx-0 sm:w-auto">
          <Suspense fallback={<NavLinks path={null} />}>
            <ActiveNavLinks />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
