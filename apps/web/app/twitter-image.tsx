import { SHARE_SIZE, SITE_NAME, TAGLINE, shareImage } from "@/lib/brand";

export const alt = `${SITE_NAME}: ${TAGLINE} Pay-per-visit campaigns on Stellar`;
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return shareImage();
}
