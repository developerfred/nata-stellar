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
    name: "Tasca do Alfama",
    kind: "Restaurant",
    address: "Rua de São Pedro 22, Alfama, Lisbon",
    blurb: "Home cooking and fado on Thursdays.",
    promo: "Sit down for lunch and collect a reward at the counter.",
    menu: [
      { name: "Bacalhau à Brás", price: "€11.50" },
      { name: "Sardinhas assadas", price: "€9.00" },
      { name: "Vinho verde (glass)", price: "€3.50" },
    ],
  },
  {
    name: "Livraria do Chiado",
    kind: "Bookshop",
    address: "Rua Garrett 73, Chiado, Lisbon",
    blurb: "Second-hand books in six languages.",
    promo: "Browse the shelves, scan at the till, get paid for the visit.",
    menu: [],
  },
  {
    name: "Cervejaria Cais do Sodré",
    kind: "Bar",
    address: "Rua Nova do Carvalho 12, Lisbon",
    blurb: "Craft beer and petiscos near the river.",
    promo: "Order a drink and scan the counter code for cashback.",
    menu: [
      { name: "Imperial", price: "€1.80" },
      { name: "Pica-pau", price: "€7.50" },
    ],
  },
  {
    name: "Mercado da Ribeira Stall 14",
    kind: "Market stall",
    address: "Av. 24 de Julho 49, Lisbon",
    blurb: "Fresh fruit and juices from the Ribatejo.",
    promo: "Taste a juice, scan, and collect your reward.",
    menu: [{ name: "Orange juice", price: "€3.00" }],
  },
  {
    name: "Museu do Azulejo Café",
    kind: "Museum café",
    address: "Rua da Madre de Deus 4, Lisbon",
    blurb: "Coffee in a tiled 16th-century cloister.",
    promo: "Visit the café after the exhibition and collect a reward.",
    menu: [
      { name: "Bica", price: "€1.00" },
      { name: "Queijada de Sintra", price: "€2.50" },
    ],
  },
  {
    name: "LX Factory Maker Space",
    kind: "Shop",
    address: "Rua Rodrigues de Faria 103, Lisbon",
    blurb: "Local designers and ceramics.",
    promo: "Walk in, scan at the desk, and get paid to look around.",
    menu: [],
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
