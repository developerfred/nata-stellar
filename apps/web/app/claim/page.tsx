import { Suspense } from "react";
import { ClaimFlow } from "@/components/ClaimFlow";

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="skeleton h-32" />}>
      <ClaimFlow />
    </Suspense>
  );
}
