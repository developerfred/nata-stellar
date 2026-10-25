"use client";

import Link from "next/link";
import { config } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { PlaceCampaign } from "@/lib/server/campaigns";

export function PlaceCard({ c }: { c: PlaceCampaign }) {
  const t = useT();
  const left = Math.max(c.maxClaims - c.claims, 0);
  const live = c.active && left > 0 && BigInt(c.remainingRaw) >= BigInt(c.rewardRaw);
  return (
    <Link href={`/place/${c.id}`} className="card relative block overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{c.place.kind}</p>
          <h3 className="display text-xl leading-tight">{c.place.name}</h3>
          <p className="mt-1 text-sm text-muted">{c.place.address}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${live ? "bg-custard text-on-custard" : "bg-line text-muted"}`}>
          {live ? `+${formatAmount(BigInt(c.rewardRaw))} ${config.tokenSymbol}` : t("place.ended")}
        </span>
      </div>
      {c.place.promo && <p className="mt-3 text-sm">{c.place.promo}</p>}
      {live && <p className="mt-2 text-xs text-muted">{t("place.left", { n: left })}</p>}
    </Link>
  );
}
