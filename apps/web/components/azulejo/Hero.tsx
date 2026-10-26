"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { TileCluster } from "./Tile";

// three.js is only fetched when the scene is actually going to run.
const TileScene = dynamic(() => import("./TileScene"), { ssr: false });

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Heavy WebGL only where it is welcome: no reduced-motion, no data-saver, not a low-end device. */
function canRunScene() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const n = navigator as NavigatorHints;
  if (n.connection?.saveData) return false;
  if ((n.deviceMemory ?? 8) < 4 || (n.hardwareConcurrency ?? 8) < 4) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Static azulejo cluster first; the WebGL scene fades in over it once loaded. */
export function Hero() {
  const t = useT();
  const [run, setRun] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    // Wait until the browser is idle so the scene never competes with first paint.
    const go = () => setRun(canRunScene());
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 400);
    return () => clearTimeout(id);
  }, []);

  return (
    <div role="img" aria-label={t("hero.alt")} suppressHydrationWarning className="relative mx-auto aspect-square w-64 sm:w-72">
      <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
        <TileCluster />
      </div>
      {run && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
          <TileScene onReady={onReady} />
        </div>
      )}
    </div>
  );
}
