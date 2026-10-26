import type { Metadata } from "next";
import { T } from "@/lib/i18n";
import { MerchantConsole } from "@/components/MerchantConsole";

export const metadata: Metadata = {
  title: "Merchant console",
  description: "Create a pay-per-visit campaign on Stellar Testnet: lock a budget in the contract and pay only when a visitor scans your counter QR.",
  alternates: { canonical: "/merchant" },
};

export default function MerchantPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="display text-4xl"><T k="merchant.title" /></h1>
        <p className="mt-2 text-muted">
          <T k="merchant.lead" />
        </p>
      </div>
      <MerchantConsole />
    </div>
  );
}
