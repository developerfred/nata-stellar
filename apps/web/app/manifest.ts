import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nata",
    short_name: "nata",
    description: "Get paid to visit local places.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf5e9",
    theme_color: "#f2b33d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
