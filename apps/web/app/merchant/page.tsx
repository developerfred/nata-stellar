import { MerchantConsole } from "@/components/MerchantConsole";

export default function MerchantPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pay only for real visits</h1>
        <p className="mt-2 text-muted">
          Lock a budget in the contract. It pays a visitor only when they scan your counter QR.
        </p>
      </div>
      <MerchantConsole />
    </div>
  );
}
