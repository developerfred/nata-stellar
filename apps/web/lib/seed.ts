import type { Place } from "./place";

/** Shown only when no live campaign exists yet, always labelled as a demo listing. */
export const SEED_PLACES: Place[] = [
  {
    name: "Pastelaria Belém Nova",
    kind: "Café",
    address: "Rua de Belém 84, Lisbon",
    blurb: "Warm custard tarts, all day.",
    promo: "Show up, scan, and get paid to taste a pastel de nata.",
    menu: [
      { name: "Pastel de nata", price: "€1.30" },
      { name: "Galão", price: "€2.20" },
    ],
  },
  {
    name: "HackMeridian Expo Booth 7",
    kind: "Event booth",
    address: "Pavilhão do Conhecimento",
    blurb: "Meet the Stellar builders.",
    promo: "Visit the booth and collect a reward.",
    menu: [],
  },
];
