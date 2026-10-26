import { ImageResponse } from "next/og";
import { AZUL, TILE_SVG } from "@/lib/azulejo";

const PAPER = "#f6f2e9";
const INK = "#1b2233";
const CUSTARD = "#f2b33d";

export const SITE_NAME = "nata";
export const TAGLINE = "Get paid to show up.";
export const SITE_DESCRIPTION =
  "nata is a pay-per-visit campaign network on Stellar Testnet. Places lock a test-token budget in a Soroban contract that pays only when a real visit is proven at the counter.";

const tileUri = `data:image/svg+xml;base64,${Buffer.from(TILE_SVG).toString("base64")}`;

const iconSvg = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" fill={AZUL} />
    <rect x="8" y="8" width="84" height="84" rx="13" fill="#fbf9f4" />
    <g fill="#b9cdee" stroke={AZUL} strokeWidth="3">
      <ellipse cx="50" cy="29" rx="10" ry="19" />
      <ellipse cx="50" cy="71" rx="10" ry="19" />
      <ellipse cx="29" cy="50" rx="19" ry="10" />
      <ellipse cx="71" cy="50" rx="19" ry="10" />
    </g>
    <circle cx="50" cy="50" r="9" fill={CUSTARD} stroke={AZUL} strokeWidth="3" />
  </svg>
);

/** Square app icon (PNG) in the azulejo style. */
export function iconImage(size: number) {
  return new ImageResponse(<div style={{ display: "flex" }}>{iconSvg(size)}</div>, { width: size, height: size });
}

export const SHARE_SIZE = { width: 1200, height: 630 } as const;

/** 1200x630 share card: paper background, azulejo tiles on the right, name and tagline on the left. */
export function shareImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "0 72px" }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: AZUL, textTransform: "uppercase" }}>Lisboa · Stellar</div>
          <div style={{ display: "flex", fontSize: 168, fontWeight: 700, lineHeight: 1, marginTop: 16, color: AZUL }}>{SITE_NAME}</div>
          <div style={{ display: "flex", fontSize: 56, marginTop: 20 }}>{TAGLINE}</div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 28, color: "#5d6475" }}>Pay-per-visit campaigns · Stellar Testnet</div>
        </div>
        <div
          style={{
            display: "flex",
            width: 420,
            height: "100%",
            borderLeft: `8px solid ${AZUL}`,
            backgroundImage: `url(${tileUri})`,
            backgroundSize: "210px 210px",
          }}
        />
      </div>
    ),
    SHARE_SIZE,
  );
}
