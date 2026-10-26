import type { Metadata } from "next";
import { Suspense } from "react";
import { T } from "@/lib/i18n";
import { ChallengeMap } from "@/components/ChallengeMap";

export const metadata: Metadata = {
  title: "Lisbon challenge map",
  description: "Animated map of Lisbon showing the places paying people to visit right now.",
  alternates: { canonical: "/map" },
};

export default function MapPage() {
  return (
    <div className="grid gap-6">
      <div className="rise">
        <p className="eyebrow">Lisboa · Stellar</p>
        <h1 className="display mt-3 text-4xl leading-tight"><T k="map.title" /></h1>
        <p className="mt-3 max-w-prose text-lg text-muted"><T k="map.lead" /></p>
      </div>
      <Suspense fallback={<div className="skeleton h-80" />}>
        <ChallengeMap />
      </Suspense>
    </div>
  );
}
