import { T } from "@/lib/i18n";
import { MerchantConsole } from "@/components/MerchantConsole";

export default function MerchantPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight"><T k="merchant.title" /></h1>
        <p className="mt-2 text-muted">
          <T k="merchant.lead" />
        </p>
      </div>
      <MerchantConsole />
    </div>
  );
}
