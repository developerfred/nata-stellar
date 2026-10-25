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
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-black">
        <video ref={video} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-custard/90" />
      </div>
      {error && <p role="alert" className="text-sm text-burnt">{t(error)}</p>}
      <p className="text-sm text-muted">{t("scan.hint")}</p>
    </div>
  );
}
