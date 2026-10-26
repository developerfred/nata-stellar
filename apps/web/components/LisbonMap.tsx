"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MAP_H, MAP_W, RIVER_PATH, SHORE_PATH, TRAM_PATH, ZONES, project } from "@/lib/lisbon";

export type MapPin = {
  key: string;
  name: string;
  kind: string;
  address: string;
  /** "0.50 vUSD" while the campaign can still pay, otherwise null. */
  reward: string | null;
  left: number | null;
  /** Unix seconds. */
  end: number | null;
  /** Claim page; null for demo venues. */
  href: string | null;
  demo: boolean;
  x: number;
  y: number;
};

type Props = { pins: MapPin[]; unplaced: Omit<MapPin, "x" | "y">[]; compact?: boolean };

function Details({ pin }: { pin: Omit<MapPin, "x" | "y"> }) {
  const { t, locale } = useI18n();
  const until = pin.end ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(pin.end * 1000)) : null;
  return (
    <div className="grid gap-1">
      <p className="eyebrow">
        {pin.kind}
        {pin.demo && <> · {t("map.demo")}</>}
      </p>
      <h3 className="display text-xl leading-tight">{pin.name}</h3>
      <p className="text-sm text-muted">{pin.address}</p>
      {pin.reward && (
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="rounded-full bg-custard px-3 py-1 font-bold tabular-nums text-on-custard">+{pin.reward}</span>
          {pin.left !== null && <span className="text-muted">{t("place.left", { n: pin.left })}</span>}
          {until && <span className="text-muted">{t("map.until", { date: until })}</span>}
        </p>
      )}
      {!pin.reward && !pin.demo && <p className="text-sm text-muted">{t("place.ended")}</p>}
      {pin.demo && <p className="text-sm text-muted">{t("map.demoNote")}</p>}
      {pin.href ? (
        <Link href={pin.href} className="btn mt-2 w-full sm:w-auto">
          {t("map.go")}
        </Link>
      ) : (
        <Link href="/merchant" className="btn btn-ghost mt-2 w-full sm:w-auto">
          {t("map.own")}
        </Link>
      )}
    </div>
  );
}

export function LisbonMap({ pins, unplaced, compact = false }: Props) {
  const { t } = useI18n();
  const uid = useId();
  const [active, setActive] = useState<string | null>(null);
  const selected = pins.find((p) => p.key === active) ?? null;
  const all = [...pins, ...unplaced];

  return (
    <div className="grid gap-4">
      <div className="card overflow-hidden !p-0">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          role="group"
          aria-label={t("map.aria")}
          className="lisbon-map block h-auto w-full touch-manipulation select-none"
          onKeyDown={(e) => e.key === "Escape" && setActive(null)}
        >
          <defs>
            <pattern id={`${uid}-tile`} width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke="var(--azul)" strokeOpacity="0.18" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="2.5" fill="var(--azul)" fillOpacity="0.14" />
            </pattern>
          </defs>
          <rect width={MAP_W} height={MAP_H} fill="var(--card)" onClick={() => setActive(null)} />
          <path d={RIVER_PATH} fill="var(--azul-soft)" />
          <path d={RIVER_PATH} fill={`url(#${uid}-tile)`} />
          <path d={SHORE_PATH} fill="none" stroke="var(--azul)" strokeWidth="3" strokeLinejoin="round" />
          <text x={project([38.6875, -9.14]).x} y={project([38.6875, -9.14]).y} className="map-water" aria-hidden>
            Rio Tejo
          </text>

          <g aria-hidden>
            <path d={TRAM_PATH} fill="none" stroke="var(--line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 10" />
            <g className="map-tram motion-reduce:hidden" style={{ offsetPath: `path("${TRAM_PATH}")` }}>
              <rect x="-13" y="-7" width="26" height="14" rx="4" fill="var(--custard)" stroke="var(--azul)" strokeWidth="2" />
              <rect x="-8" y="-3" width="5" height="5" fill="var(--azul)" />
              <rect x="3" y="-3" width="5" height="5" fill="var(--azul)" />
            </g>
            <g transform={`translate(0 ${project([38.69, -9.19]).y})`} className="motion-reduce:hidden">
              <g className="map-boat">
                <path d="M-16 0 H16 L10 9 H-10 Z" fill="var(--azul)" />
                <path d="M0 0 V-16 L12 -4 Z" fill="var(--card)" stroke="var(--azul)" strokeWidth="2" />
              </g>
            </g>
            {ZONES.map((z) => {
              const p = project(z.at);
              return (
                <text key={z.id} x={p.x + z.label.dx} y={p.y + z.label.dy} textAnchor={z.label.anchor} className="map-zone">
                  {z.name}
                </text>
              );
            })}
          </g>

          {pins.map((p, i) => {
            const on = p.key === active;
            return (
              <g
                key={p.key}
                className="map-pin"
                data-demo={p.demo || !p.reward ? "" : undefined}
                data-on={on ? "" : undefined}
                transform={`translate(${p.x} ${p.y})`}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${p.name}${p.reward ? `, +${p.reward}` : ""}${p.demo ? `, ${t("map.demo")}` : ""}`}
                onClick={() => setActive(p.key)}
                onMouseEnter={() => setActive(p.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(p.key);
                  }
                }}
              >
                <circle r="28" fill="transparent" />
                {p.reward && <circle r="16" className="map-pulse" style={{ animationDelay: `${(i % 5) * 0.4}s` }} />}
                <circle r="15" className="map-dot" />
                <circle r="5.5" className="map-core" />
              </g>
            );
          })}
        </svg>
      </div>

      <div aria-live="polite" className="card min-h-32">
        {selected ? <Details pin={selected} /> : <p className="text-sm text-muted">{t(pins.length ? "map.hint" : "map.empty")}</p>}
      </div>

      {!compact && all.length > 0 && (
        <section aria-labelledby={`${uid}-list`} className="grid gap-3">
          <h2 id={`${uid}-list`} className="display text-2xl">
            {t("map.list")}
          </h2>
          <ul className="grid gap-3">
            {all.map((p) => (
              <li key={p.key} className="card">
                <Details pin={p} />
              </li>
            ))}
          </ul>
          {unplaced.length > 0 && <p className="text-xs text-muted">{t("map.unplaced", { n: unplaced.length })}</p>}
        </section>
      )}
    </div>
  );
}
