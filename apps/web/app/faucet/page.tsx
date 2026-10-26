import type { Metadata } from "next";
import { FaucetForm } from "@/components/FaucetForm";
import { T } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Get test vUSD",
  description: "Free test vUSD for Stellar Testnet so you can try nata: add the trustline, request tokens and claim a visit reward. Test tokens have no monetary value.",
  alternates: { canonical: "/faucet" },
};

export default function FaucetPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="display text-4xl"><T k="faucet.title" /></h1>
        <p className="mt-2 text-muted"><T k="faucet.lead" /></p>
      </div>
      <FaucetForm />
    </div>
  );
}
