import { T } from "@/lib/i18n";
import { Scanner } from "@/components/Scanner";
import { WalletCard } from "@/components/WalletCard";

export default function ScanPage() {
  return (
    <div className="grid gap-5">
      <h1 className="display text-3xl"><T k="scan.title" /></h1>
      <Scanner />
      <WalletCard compact />
    </div>
  );
}
