import { Scanner } from "@/components/Scanner";
import { WalletCard } from "@/components/WalletCard";

export default function ScanPage() {
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold">Scan at the counter</h1>
      <Scanner />
      <WalletCard compact />
    </div>
  );
}
