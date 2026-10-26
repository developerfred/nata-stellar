import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nata: get paid to show up",
    short_name: "nata",
    description: "Pay-per-visit campaigns on Stellar Testnet. Scan the counter QR and receive the reward.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f2e9",
    theme_color: "#1d4ba0",
    categories: ["finance", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
