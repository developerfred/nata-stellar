import Link from "next/link";
import { Suspense } from "react";
import { T } from "@/lib/i18n";
import { PlaceList } from "@/components/PlaceList";
import { WalletCard } from "@/components/WalletCard";

export default function Home() {
  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight"><T k="home.title" /></h1>
        <p className="mt-2 text-muted">
          <T k="home.lead" />
        </p>
      </section>
      <WalletCard />
      <Link href="/scan" className="btn w-full text-lg"><T k="home.scan" /></Link>
      <section className="grid gap-3">
        <h2 className="text-xl font-bold"><T k="home.places" /></h2>
        <Suspense fallback={<div className="card h-32 animate-pulse" />}>
          <PlaceList />
        </Suspense>
      </section>
    </div>
  );
}
