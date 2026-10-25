import "server-only";
import { connection } from "next/server";
import { getCampaign, getCampaignCount, type Campaign } from "../chain";
import { config } from "../config";
import { decodePlace, type Place } from "../place";

export type PlaceCampaign = {
  id: string;
  merchant: string;
  rewardRaw: string;
  remainingRaw: string;
  claims: number;
  maxClaims: number;
  start: number;
  end: number;
  active: boolean;
  place: Place;
};

const toView = (c: Campaign): PlaceCampaign | null => {
  const place = decodePlace(c.metaUri);
  if (!place) return null;
  return {
    id: c.id.toString(),
    merchant: c.merchant,
    rewardRaw: c.reward.toString(),
    remainingRaw: c.remaining.toString(),
    claims: c.claims,
    maxClaims: c.maxClaims,
    start: Number(c.start),
    end: Number(c.end),
    active: c.active,
    place,
  };
};

let cache: { at: number; data: PlaceCampaign[] } | null = null;

/** Lists campaigns from the contract; cached briefly so the home page stays fast under load. */
export async function listCampaigns(): Promise<PlaceCampaign[]> {
  if (!config.campaignsContractId) return [];
  await connection();
  if (cache && Date.now() - cache.at < 10_000) return cache.data;
  const count = await getCampaignCount();
  const ids = Array.from({ length: Math.min(count, 100) }, (_, i) => BigInt(count - 1 - i));
  const all = await Promise.all(ids.map((id) => getCampaign(id).catch(() => null)));
  const data = all.flatMap((c) => (c ? [toView(c)] : [])).filter((v): v is PlaceCampaign => v !== null);
  cache = { at: Date.now(), data };
  return data;
}

export async function loadCampaign(id: bigint): Promise<PlaceCampaign | null> {
  await connection();
  return toView(await getCampaign(id));
}
