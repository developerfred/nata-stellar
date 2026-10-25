/** Place profile stored in a campaign's `meta_uri` as a data: URI (fully on-chain, no database). */
export type MenuItem = { name: string; price: string; note?: string };

export type Place = {
  name: string;
  kind: string;
  address: string;
  blurb: string;
  promo: string;
  photo?: string;
  menu: MenuItem[];
};

const PREFIX = "data:application/json;base64,";
const MAX_BYTES = 3000;

export function encodePlace(place: Place): string {
  const json = JSON.stringify(place);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  if (b64.length > MAX_BYTES) throw new Error("Place profile too large: shorten the menu or blurb");
  return PREFIX + b64;
}

export function decodePlace(uri: string): Place | null {
  try {
    if (!uri.startsWith(PREFIX)) return null;
    const bytes = Uint8Array.from(atob(uri.slice(PREFIX.length)), (c) => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof p?.name !== "string") return null;
    return {
      name: p.name,
      kind: String(p.kind ?? "Place"),
      address: String(p.address ?? ""),
      blurb: String(p.blurb ?? ""),
      promo: String(p.promo ?? ""),
      photo: typeof p.photo === "string" && p.photo.startsWith("https://") ? p.photo : undefined,
      menu: Array.isArray(p.menu)
        ? p.menu.slice(0, 30).map((m: MenuItem) => ({
            name: String(m.name ?? ""),
            price: String(m.price ?? ""),
            note: m.note ? String(m.note) : undefined,
          }))
        : [],
    };
  } catch {
    return null;
  }
}
