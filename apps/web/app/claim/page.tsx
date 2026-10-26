import { Suspense } from "react";
import { T } from "@/lib/i18n";
import { ClaimFlow } from "@/components/ClaimFlow";

export default function ClaimPage() {
  return (
    <>
      <h1 className="sr-only"><T k="counter.title" /></h1>
      <Suspense fallback={<div className="skeleton h-32" />}>
        <ClaimFlow />
      </Suspense>
    </>
  );
}
