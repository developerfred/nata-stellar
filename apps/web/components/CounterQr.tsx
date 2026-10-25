"use client";

import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadMerchantKey, signTicket } from "@/lib/merchant";
import { TICKET_ROTATE_MS } from "@/lib/ticket";

export function CounterQr() {
  const id = useSearchParams().get("c");
  const [src, setSrc] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = loadMerchantKey();
    if (!id || !/^\d+$/.test(id)) return setError("Missing campaign. Open counter mode from the Merchant page.");
    if (!key) return setError("This device has no counter key. Open the Merchant page first.");

    let cancelled = false;
    const render = async () => {
      const url = `${window.location.origin}/claim?${signTicket(key, BigInt(id))}`;
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 640, errorCorrectionLevel: "M" });
      if (!cancelled) {
        setSrc(dataUrl);
        setTick((t) => t + 1);
      }
    };
    void render();
    const timer = setInterval(render, TICKET_ROTATE_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  if (error) return <p role="alert" className="card text-burnt">{error}</p>;

  return (
    <div className="grid justify-items-center gap-4 text-center">
      <h1 className="text-3xl font-extrabold">Scan to get paid</h1>
      <div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-lg">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Rotating visit QR code" className="aspect-square w-full" />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-line" />
        )}
      </div>
      <div key={tick} className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full origin-left bg-custard" style={{ animation: `shrink ${TICKET_ROTATE_MS}ms linear forwards` }} />
      </div>
      <p className="text-sm text-muted">Changes every 20 seconds. Photos of this screen stop working.</p>
      <style>{`@keyframes shrink { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>
    </div>
  );
}
