import test from "node:test";
import assert from "node:assert/strict";
import { MAP_H, MAP_W, ZONES, locate, project, spread } from "./lisbon.ts";
import { SEED_PLACES } from "./seed.ts";

test("every seed venue lands inside the map", () => {
  for (const p of SEED_PLACES) {
    const at = locate(p.name, p.address, p.name);
    assert.ok(at, p.name);
    assert.ok(at.x > 0 && at.x < MAP_W && at.y > 0 && at.y < MAP_H, p.name);
  }
});

test("projection puts Belém west of Alfama and Parque das Nações north-east", () => {
  const belem = project([38.6975, -9.2032]);
  const alfama = project([38.7106, -9.1285]);
  const parque = project([38.763, -9.0946]);
  assert.ok(belem.x < alfama.x);
  assert.ok(parque.y < alfama.y && parque.x > alfama.x);
});

test("zone keywords place live campaigns by address, accents ignored", () => {
  const a = locate("Café X", "Rua da Graça 10, Lisboa", "1");
  assert.ok(a);
  assert.equal(locate("Café X", "Somewhere else", "1"), null);
  assert.ok(ZONES.length >= 8);
});

test("spread separates overlapping pins and is deterministic", () => {
  const pins = [{ x: 100, y: 100 }, { x: 102, y: 100 }, { x: 100, y: 101 }];
  const a = spread(pins);
  assert.deepEqual(a, spread(pins));
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) assert.ok(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y) > 20);
});
