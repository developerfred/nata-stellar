import type { Metadata } from "next";
import { T } from "@/lib/i18n";
import { Scanner } from "@/components/Scanner";
import { WalletCard } from "@/components/WalletCard";

export const metadata: Metadata = {
  title: "Scan a counter QR",
  description: "Scan the rotating QR code at a place's counter to prove your visit and receive the nata reward on Stellar Testnet.",
  alternates: { canonical: "/scan" },
};

export default function ScanPage() {
  return (
    <div className="grid gap-5">
      <h1 className="display text-3xl"><T k="scan.title" /></h1>
      <Scanner />
      <WalletCard compact />
    </div>
  );
}
