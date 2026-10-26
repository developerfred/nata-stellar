/**
 * Stylized map of Lisbon. No tiles, no API keys: approximate WGS84 coordinates are projected onto a fixed SVG
 * viewBox. Everything here is pure so it can be unit tested and shared by server and client.
 */

export type LatLon = readonly [lat: number, lon: number];

const SOUTH = 38.685;
const NORTH = 38.775;
const WEST = -9.225;
const EAST = -9.085;

export const MAP_W = 1000;
/** Longitude degrees are shorter than latitude degrees at this latitude, so scale by cos(lat). */
export const MAP_H = Math.round((MAP_W * (NORTH - SOUTH)) / ((EAST - WEST) * Math.cos((38.73 * Math.PI) / 180)));

export function project([lat, lon]: LatLon): { x: number; y: number } {
  return {
    x: Math.round(((lon - WEST) / (EAST - WEST)) * MAP_W * 10) / 10,
    y: Math.round(((NORTH - lat) / (NORTH - SOUTH)) * MAP_H * 10) / 10,
  };
}

const pts = (list: LatLon[]) => list.map((p) => project(p)).map(({ x, y }) => `${x},${y}`);

/** Northern shore of the Tejo (west to east); water lies south and east of it. */
const SHORE: LatLon[] = [
  [38.6935, WEST],
  [38.6935, -9.206],
  [38.701, -9.176],
  [38.704, -9.15],
  [38.705, -9.144],
  [38.7068, -9.1365],
  [38.7095, -9.124],
  [38.7135, -9.119],
  [38.7255, -9.109],
  [38.739, -9.099],
  [38.75, -9.096],
  [38.76, -9.0925],
  [NORTH, -9.0905],
];

export const RIVER_PATH = `M${pts([...SHORE, [NORTH, EAST], [SOUTH, EAST], [SOUTH, WEST]]).join(" L")} Z`;
export const SHORE_PATH = `M${pts(SHORE).join(" L")}`;

/** Tram 28, simplified: Martim Moniz, Baixa, Chiado, Estrela. */
export const TRAM_PATH = `M${pts([
  [38.7172, -9.136],
  [38.7118, -9.1385],
  [38.7107, -9.1418],
  [38.7125, -9.1485],
  [38.7135, -9.158],
  [38.7145, -9.1665],
]).join(" L")}`;

export type Zone = { id: string; name: string; at: LatLon; keywords: string[]; label: { dx: number; dy: number; anchor: "start" | "middle" | "end" } };

export const ZONES: Zone[] = [
  { id: "belem", name: "Belém", at: [38.6975, -9.2032], keywords: ["belem", "jeronimos"], label: { dx: 0, dy: 56, anchor: "middle" } },
  { id: "lx", name: "LX Factory", at: [38.7035, -9.1788], keywords: ["lx factory", "alcantara", "rodrigues de faria"], label: { dx: 0, dy: 56, anchor: "middle" } },
  { id: "sodre", name: "Cais do Sodré", at: [38.7064, -9.1445], keywords: ["cais do sodre", "ribeira", "24 de julho", "nova do carvalho"], label: { dx: -26, dy: 50, anchor: "end" } },
  { id: "chiado", name: "Chiado", at: [38.7101, -9.1425], keywords: ["chiado", "garrett", "carmo"], label: { dx: -26, dy: -26, anchor: "end" } },
  { id: "baixa", name: "Baixa", at: [38.7107, -9.1394], keywords: ["baixa", "rossio", "augusta", "comercio", "terreiro"], label: { dx: 0, dy: 60, anchor: "middle" } },
  { id: "bairro-alto", name: "Bairro Alto", at: [38.7131, -9.145], keywords: ["bairro alto", "misericordia"], label: { dx: -26, dy: -30, anchor: "end" } },
  { id: "alfama", name: "Alfama", at: [38.7106, -9.1285], keywords: ["alfama", "sao pedro", "sao vicente", "se de lisboa"], label: { dx: 30, dy: 34, anchor: "start" } },
  { id: "graca", name: "Graça", at: [38.7167, -9.1305], keywords: ["graca"], label: { dx: 0, dy: -30, anchor: "middle" } },
  { id: "madre", name: "Madre de Deus", at: [38.7249, -9.1136], keywords: ["madre de deus", "beato", "xabregas"], label: { dx: 0, dy: -30, anchor: "middle" } },
  { id: "parque", name: "Parque das Nações", at: [38.763, -9.0946], keywords: ["parque das nacoes", "pavilhao do conhecimento", "oriente", "expo"], label: { dx: -28, dy: 6, anchor: "end" } },
];

/** Exact positions of the built-in demo venues, by name. */
const SEED_AT: Record<string, LatLon> = {
  "Pastelaria Belém Nova": [38.6975, -9.2032],
  "Tasca do Alfama": [38.7106, -9.1285],
  "Livraria do Chiado": [38.7101, -9.1425],
  "Cervejaria Cais do Sodré": [38.7064, -9.1445],
  "Mercado da Ribeira Stall 14": [38.7062, -9.1455],
  "Museu do Azulejo Café": [38.7249, -9.1136],
  "LX Factory Maker Space": [38.7035, -9.1788],
  "HackMeridian Expo Booth 7": [38.763, -9.0946],
};

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Where on the map a place goes, or null when neither its name nor its address says where in Lisbon it is. */
export function locate(name: string, address: string, seed: string): { x: number; y: number } | null {
  const exact = SEED_AT[name];
  if (exact) return project(exact);
  const text = norm(`${name} ${address}`);
  const zone = ZONES.find((z) => z.keywords.some((k) => text.includes(k)));
  if (!zone) return null;
  const h = hash(seed);
  // Several campaigns in one neighbourhood fan out around its centre instead of stacking.
  const angle = ((h % 360) * Math.PI) / 180;
  const r = 14 + ((h >>> 9) % 22);
  const c = project(zone.at);
  return { x: c.x + Math.cos(angle) * r, y: c.y + Math.sin(angle) * r };
}

/** Nudge overlapping pins apart (deterministic, input order wins) so each stays tappable. */
export function spread<T extends { x: number; y: number }>(items: T[], gap = 44, rounds = 12): T[] {
  const out = items.map((p) => ({ ...p }));
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        const d = Math.hypot(dx, dy);
        if (d >= gap) continue;
        const [ux, uy] = d === 0 ? [1, 0] : [dx / d, dy / d];
        const push = (gap - d) / 2;
        out[i].x -= ux * push;
        out[i].y -= uy * push;
        out[j].x += ux * push;
        out[j].y += uy * push;
      }
    }
  }
  return out.map((p) => ({
    ...p,
    x: Math.round(Math.min(MAP_W - 24, Math.max(20, p.x)) * 10) / 10,
    y: Math.round(Math.min(MAP_H - 20, Math.max(20, p.y)) * 10) / 10,
  }));
}
