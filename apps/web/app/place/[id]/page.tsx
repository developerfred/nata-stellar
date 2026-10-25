import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlaceView } from "@/components/PlaceView";
import { loadCampaign } from "@/lib/server/campaigns";

async function Place({ id }: { id: string }) {
  if (!/^\d{1,10}$/.test(id)) notFound();
  const c = await loadCampaign(BigInt(id)).catch(() => null);
  if (!c) notFound();
  return <PlaceView c={c} />;
}

export default function PlacePage({ params }: PageProps<"/place/[id]">) {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse" />}>
      <PlaceResolver params={params} />
    </Suspense>
  );
}

async function PlaceResolver({ params }: { params: PageProps<"/place/[id]">["params"] }) {
  const { id } = await params;
  return <Place id={id} />;
}
