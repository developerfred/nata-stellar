import { T } from "@/lib/i18n";
import { isConfigured } from "@/lib/config";
import { SEED_PLACES } from "@/lib/seed";
import { listCampaigns } from "@/lib/server/campaigns";
import { PlaceCard } from "./PlaceCard";

export async function PlaceList() {
  let campaigns: Awaited<ReturnType<typeof listCampaigns>> = [];
  let failed = false;
  try {
    campaigns = await listCampaigns();
  } catch {
    failed = true;
  }

  if (campaigns.length > 0) {
    return (
      <div className="grid gap-3">
        {campaigns.map((c) => (
          <PlaceCard key={c.id} c={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="card text-sm text-muted">
        <T k={failed ? "list.failed" : isConfigured() ? "list.empty" : "list.unconfigured"} />
      </p>
      {SEED_PLACES.map((p) => (
        <div key={p.name} className="card opacity-80">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.kind} · <T k="list.demo" /></p>
          <h3 className="text-lg font-bold">{p.name}</h3>
          <p className="mt-1 text-sm text-muted">{p.address}</p>
          <p className="mt-3 text-sm">{p.promo}</p>
        </div>
      ))}
    </div>
  );
}
