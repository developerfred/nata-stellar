import { Suspense } from "react";
import { CounterQr } from "@/components/CounterQr";

export default function CounterPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse" />}>
      <CounterQr />
    </Suspense>
  );
}
