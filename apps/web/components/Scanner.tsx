"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import type { Key } from "@/lib/i18n/dictionaries";

export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<Key | null>(null);

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let done = false;
    const reader = new BrowserQRCodeReader();
    reader
      .decodeFromVideoDevice(undefined, video.current!, (result) => {
        if (!result || done) return;
        try {
          const url = new URL(result.getText());
          if (url.searchParams.has("c") && url.searchParams.has("s")) {
            done = true;
            controls?.stop();
            router.push(`/claim?${url.searchParams.toString()}`);
          } else {
            setError("scan.notNata");
          }
        } catch {
          setError("scan.notNata");
        }
      })
      .then((c) => {
        controls = c;
        if (done) c.stop();
      })
      .catch(() => setError("scan.noCamera"));
    return () => {
      done = true;
      controls?.stop();
    };
  }, [router]);

  return (
    <div className="grid gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-black">
        <video ref={video} className="h-full w-full object-cover" muted playsInline />
        {/* four custard corners instead of a full frame: quieter, and the camera stays visible */}
        <div className="pointer-events-none absolute inset-8" aria-hidden>
          <span className="absolute left-0 top-0 size-10 rounded-tl-xl border-l-4 border-t-4 border-custard" />
          <span className="absolute right-0 top-0 size-10 rounded-tr-xl border-r-4 border-t-4 border-custard" />
          <span className="absolute bottom-0 left-0 size-10 rounded-bl-xl border-b-4 border-l-4 border-custard" />
          <span className="absolute bottom-0 right-0 size-10 rounded-br-xl border-b-4 border-r-4 border-custard" />
        </div>
      </div>
      {error && <p role="alert" className="card border-burnt text-sm text-burnt">{t(error)}</p>}
      <p className="text-sm text-muted">{t("scan.hint")}</p>
    </div>
  );
}
