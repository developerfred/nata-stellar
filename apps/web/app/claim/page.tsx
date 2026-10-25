import { Suspense } from "react";
import { ClaimFlow } from "@/components/ClaimFlow";

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="card h-32 animate-pulse" />}>
      <ClaimFlow />
    </Suspense>
  );
}
