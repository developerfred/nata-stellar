"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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
            setError("That QR is not a nata counter code.");
          }
        } catch {
          setError("That QR is not a nata counter code.");
        }
      })
      .then((c) => {
        controls = c;
        if (done) c.stop();
      })
      .catch(() => setError("Camera unavailable. Allow camera access, or scan with your phone's camera app."));
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
      {error && <p role="alert" className="text-sm text-burnt">{error}</p>}
      <p className="text-sm text-muted">Point the camera at the QR code shown at the counter. It refreshes every 20 seconds.</p>
    </div>
  );
}
