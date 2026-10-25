import { FaucetForm } from "@/components/FaucetForm";
import { T } from "@/lib/i18n";

export default function FaucetPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight"><T k="faucet.title" /></h1>
        <p className="mt-2 text-muted"><T k="faucet.lead" /></p>
      </div>
      <FaucetForm />
    </div>
  );
}
