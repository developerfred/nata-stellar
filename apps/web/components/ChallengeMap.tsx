import { config } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { locate, spread } from "@/lib/lisbon";
import { SEED_PLACES } from "@/lib/seed";
import { listCampaigns } from "@/lib/server/campaigns";
import { LisbonMap, type MapPin } from "./LisbonMap";

/** Live campaigns when there are any, otherwise the labelled demo venues. Never throws: the map is a bonus view. */
export async function ChallengeMap({ compact = false }: { compact?: boolean }) {
  let campaigns: Awaited<ReturnType<typeof listCampaigns>> = [];
  try {
    campaigns = await listCampaigns();
  } catch {
    /* fall back to demo venues */
  }

  const live = campaigns.length > 0;
  const placed: MapPin[] = [];
  const unplaced: Omit<MapPin, "x" | "y">[] = [];

  const items: (Omit<MapPin, "x" | "y"> & { at: { x: number; y: number } | null })[] = live
    ? campaigns.map((c) => {
        const left = Math.max(c.maxClaims - c.claims, 0);
        const open = c.active && left > 0 && BigInt(c.remainingRaw) >= BigInt(c.rewardRaw);
        return {
          key: c.id,
          name: c.place.name,
          kind: c.place.kind,
          address: c.place.address,
          reward: open ? `${formatAmount(BigInt(c.rewardRaw))} ${config.tokenSymbol}` : null,
          left: open ? left : null,
          end: c.end > 0 ? c.end : null,
          href: `/place/${c.id}`,
          demo: false,
          at: locate(c.place.name, c.place.address, c.id),
        };
      })
    : SEED_PLACES.map((p) => ({
        key: p.name,
        name: p.name,
        kind: p.kind,
        address: p.address,
        reward: null,
        left: null,
        end: null,
        href: null,
        demo: true,
        at: locate(p.name, p.address, p.name),
      }));

  for (const { at, ...pin } of items) {
    if (at) placed.push({ ...pin, ...at });
    else unplaced.push(pin);
  }

  return <LisbonMap pins={spread(placed)} unplaced={unplaced} compact={compact} />;
}
