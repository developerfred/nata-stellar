"use client";

import Link from "next/link";
import { config } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { PlaceCampaign } from "@/lib/server/campaigns";

export function PlaceView({ c }: { c: PlaceCampaign }) {
  const t = useT();
  const left = Math.max(c.maxClaims - c.claims, 0);
  const live = c.active && left > 0 && BigInt(c.remainingRaw) >= BigInt(c.rewardRaw);

  return (
    <article className="grid gap-5">
      {c.place.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.place.photo} alt="" className="h-48 w-full rounded-[var(--radius)] object-cover" />
      )}
      <header>
        <p className="eyebrow">{c.place.kind}</p>
        <h1 className="display text-4xl">{c.place.name}</h1>
        <p className="mt-1 text-muted">{c.place.address}</p>
        {c.place.blurb && <p className="mt-3">{c.place.blurb}</p>}
      </header>

      <section className="card relative overflow-hidden !border-0 !bg-custard text-on-custard">
        <div className="azulejo-band absolute inset-x-0 top-0" aria-hidden />
        <p className="mt-2 text-sm font-bold uppercase">{t("place.reward")}</p>
        <p className="display text-5xl tabular-nums">
          {live ? `+${formatAmount(BigInt(c.rewardRaw))} ${config.tokenSymbol}` : t("place.ended")}
        </p>
        {c.place.promo && <p className="mt-2">{c.place.promo}</p>}
        {live && <p className="mt-2 text-sm">{t("place.leftOne", { n: left })}</p>}
        {live && (
          <Link href="/scan" className="btn mt-4 w-full !bg-[#1b2233] !text-[#f6f2e9]">
            {t("place.here")}
          </Link>
        )}
      </section>

      {c.place.menu.length > 0 && (
        <section>
          <h2 className="display mb-3 text-2xl">{t("place.menu")}</h2>
          <ul className="card divide-y divide-line !p-0">
            {c.place.menu.map((m, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 px-5 py-3">
                <span>
                  <span className="font-semibold">{m.name}</span>
                  {m.note && <span className="block text-sm text-muted">{m.note}</span>}
                </span>
                <span className="font-semibold tabular-nums">{m.price}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
