import Link from "next/link";
import { Suspense } from "react";
import { T } from "@/lib/i18n";
import { Hero } from "@/components/azulejo/Hero";
import { ChallengeMap } from "@/components/ChallengeMap";
import { PlaceList } from "@/components/PlaceList";
import { WalletCard } from "@/components/WalletCard";

export default function Home() {
  return (
    <div className="grid gap-[var(--space-ma)]">
      <section className="grid items-center gap-8 sm:grid-cols-[1fr_auto]">
        <div className="rise">
          <p className="eyebrow">Lisboa · Stellar</p>
          <h1 className="display mt-3 text-4xl leading-tight sm:text-5xl"><T k="home.title" /></h1>
          <p className="mt-4 max-w-prose text-lg text-muted">
            <T k="home.lead" />
          </p>
          <Link href="/scan" className="btn mt-6 w-full text-lg sm:w-auto sm:px-8"><T k="home.scan" /></Link>
        </div>
        <Hero />
      </section>
      <WalletCard />
      <section className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="display text-2xl"><T k="map.title" /></h2>
          <Link href="/map" className="min-h-11 content-center text-sm font-semibold text-azul underline underline-offset-4"><T k="map.open" /></Link>
        </div>
        <Suspense fallback={<div className="skeleton h-72" />}>
          <ChallengeMap compact />
        </Suspense>
      </section>
      <section className="grid gap-4">
        <h2 className="display text-2xl"><T k="home.places" /></h2>
        <Suspense fallback={<div className="skeleton h-32" />}>
          <PlaceList />
        </Suspense>
      </section>
    </div>
  );
}
