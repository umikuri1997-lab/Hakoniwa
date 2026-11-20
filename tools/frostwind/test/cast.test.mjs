import assert from 'node:assert/strict';
import test from 'node:test';

import { BIOMES } from '../src/biome.js';
import { SCENES } from '../src/scene.js';
import { castDistances, measure, rosterOf } from '../tools/lineup.mjs';

const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';

/* The least silhouette distance (1 - IoU, anchors aligned, the more distinct
   of front and profile) between two people of one world who wear the same
   cloth ramp. Measured floors: a new row may raise a floor and may not lower
   it. Boreal's 0.09 is graveWatcher and spearGuard. */
const SAME_CLOTH_FLOOR = { boreal: 0.08, desert: 0.22 };
/* A person added from here on clears this against everyone in their world. */
const NEW_ROW_FLOOR = 0.28;
const NEW_ROWS = { desert: ['desertDigger', 'desertKeeper'] };

test('two people of one world in one cloth are two silhouettes', () => {
  for (const biome of Object.keys(BIOMES)) {
    const pairs = castDistances(biome);
    const same = pairs.filter((p) => p.sameRamp);
    if (REPORT) console.log(`  CAST ${biome} — closest: ${pairs.slice(0, 3)
      .map((p) => `${p.a}/${p.b} ${p.distance.toFixed(2)}`).join(', ')}`);
    if (!same.length) continue;
    const floor = SAME_CLOTH_FLOOR[biome] ?? NEW_ROW_FLOOR;
    assert.ok(same[0].distance >= floor,
      `${biome}: ${same[0].a} and ${same[0].b} wear one ramp and differ by `
      + `${same[0].distance.toFixed(2)} of their silhouette, under the floor of ${floor}`);
    for (const name of NEW_ROWS[biome] || [])
      for (const p of pairs.filter((q) => q.a === name || q.b === name))
        assert.ok(p.distance >= NEW_ROW_FLOOR,
          `${p.a} and ${p.b} differ by ${p.distance.toFixed(2)}; a new row clears ${NEW_ROW_FLOOR}`);
  }
});

test('every body of a world is drawn from that world\'s declared ramps', () => {
  /* A body on a ramp the scene does not snap to draws in the nearest other
     colour, and every palette law still passes. */
  for (const [id, scene] of Object.entries(SCENES)) {
    const declared = new Set(scene.ramps);
    for (const body of rosterOf(scene.biome)) {
      const sp = body.paint(0);
      const ramp = body.kind === 'person' ? sp.ramp : null;
      if (ramp) assert.ok(declared.has(ramp),
        `${body.name} wears ${ramp}, which ${id} does not declare`);
      const m = measure(body, scene.biome);
      assert.ok(m.hPx > 0 && m.pixels > 0, `${body.name} draws nothing`);
    }
  }
});
