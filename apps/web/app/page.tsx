import Link from "next/link";
import { Suspense } from "react";
import { PlaceList } from "@/components/PlaceList";
import { WalletCard } from "@/components/WalletCard";

export default function Home() {
  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight">Get paid to show up.</h1>
        <p className="mt-2 text-muted">
          Local places pay a real reward when you actually visit. Scan the code at the counter and the
          money lands in your wallet in seconds.
        </p>
      </section>
      <WalletCard />
      <Link href="/scan" className="btn w-full text-lg">Scan a counter QR</Link>
      <section className="grid gap-3">
        <h2 className="text-xl font-bold">Places paying right now</h2>
        <Suspense fallback={<div className="card h-32 animate-pulse" />}>
          <PlaceList />
        </Suspense>
      </section>
    </div>
  );
}
