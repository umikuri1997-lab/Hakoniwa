/* THE COLOUR GATE. Every ramp and every world's snap list, against a committed
   baseline, with no browser and no GPU.

     node --test test/palette.test.mjs      the gate
     npm run palette:update                 only once you have decided

   Regeneration lives outside the test so a failure cannot approve its own
   changed colours.

   WHAT THIS CATCHES that no other suite does: a change in one module that
   repaints a DIFFERENT world. test/biome.test.mjs proves each snap list is
   closed, reachable and within the 64 the shader iterates; it does not notice
   that meadow's water moved two bytes because someone edited a boreal term.
   That was the rendered frame hash's one unique value, and it lives here now,
   with the scene and the ramp named on failure. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diff, snapshot } from './palettecast.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('every ramp and every scene snap list matches the colour baseline', async (t) => {
  const want = JSON.parse(await readFile(resolve(ROOT, 'test/golden/palette.json'), 'utf8'));
  const got = snapshot();

  const scenes = Object.keys(got.scenes).length;
  t.diagnostic(`${Object.keys(got.ramps).length} ramps, ${scenes} scenes`);
  for (const id of Object.keys(got.scenes))
    t.diagnostic(`${id}: ${got.scenes[id].n}/64 entries`);

  const drifted = diff(want, got);
  assert.deepEqual(drifted.map((d) => `${d.what}  ${d.why}`), [],
    `${drifted.length} colour authorities moved.\n`
    + `    A colour changing is not automatically wrong. What is wrong is not\n`
    + `    knowing which one moved, so each line above names the ramp or the\n`
    + `    world and the size of the move in dE_ok.\n`
    + `    If you meant it: npm run palette:update`);
});
