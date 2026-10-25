import { tileDataUri } from "@/lib/azulejo";

/** A single static azulejo tile. Decorative, so hidden from assistive tech. */
export function Tile({ className = "", tilt = 0 }: { className?: string; tilt?: number }) {
  return (
    <span
      aria-hidden
      className={`block aspect-square bg-cover shadow-[0_1px_0_var(--line)] ${className}`}
      style={{ backgroundImage: `url("${tileDataUri}")`, transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    />
  );
}

/** Static 3x3 cluster, used wherever the WebGL scene is not shown. Slightly off-grid, like hand-laid tiles. */
export function TileCluster() {
  const tilts = [-1.2, 0.6, 1.4, 0.8, -0.5, -1.6, 1.1, -0.9, 0.4];
  return (
    <div aria-hidden className="grid size-full -rotate-6 grid-cols-3 gap-1 p-2">
      {tilts.map((d, i) => (
        <Tile key={i} tilt={d} className="rounded-[3px]" />
      ))}
    </div>
  );
}
