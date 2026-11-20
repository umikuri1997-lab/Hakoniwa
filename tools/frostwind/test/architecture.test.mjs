/* THE ARCHITECTURE GATE.

   test/archcast.mjs snapshots every built shell as a measurement plus a set of
   channel hashes. This compares that snapshot against test/golden/architecture.json
   and reports which building moved and how.

   Regeneration is `npm run arch:update` and lives outside this file on purpose:
   a gate that can rewrite its own baseline approves its own change. */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { castKeys, diff, snapshot } from './archcast.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = resolve(ROOT, 'test/golden/architecture.json');
const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';

test('every built shell matches the architecture baseline', () => {
  let want;
  try { want = JSON.parse(readFileSync(BASELINE, 'utf8')); } catch {
    assert.fail(`no baseline at test/golden/architecture.json. Run \`npm run arch:update\`.`);
  }
  const got = snapshot();
  const drifted = diff(want, got);
  assert.deepEqual(drifted, [],
    `these built shells no longer draw what the baseline recorded:\n`
    + drifted.map((d) => `  ${d.key}: ${d.why}`).join('\n')
    + `\n\nA building changing is a demand to LOOK, not automatically a failure.\n`
    + `  node tools/houses.mjs <kind> <variant> --faces\n`
    + `  node tools/houses.mjs <kind> <variant> --value\n`
    + `Then, once you have looked and decided it is right: npm run arch:update`);
});

test('a built shell is a volume, and the cast says which ones are not', () => {
  const got = snapshot();
  const rows = [], flat = [];
  for (const key of castKeys()) {
    const m = got[key];
    rows.push(`  ${key.padEnd(14)} ${m.dims.padStart(8)}  ${String(m.occupied).padStart(6)} px`
      + `  front ${String(m.faces.front).padStart(5)}`
      + `  top ${String(m.faces.top).padStart(5)}`
      + `  side ${String(m.faces.side).padStart(5)}`
      + `  depth ${((100 * m.depth) / Math.max(1, m.occupied)).toFixed(0).padStart(3)}%`
      + `  ao ${m.aoSpread.toFixed(2)}`);
    if (m.depth === 0) flat.push(key);
  }
  if (REPORT) {
    console.log('  BUILT SHELLS — depth is the share of pixels facing anywhere but the camera');
    console.log(rows.join('\n'));
    console.log(`  no depth at all: ${flat.join(', ') || 'none'}`);
  }

  /* THE HOUSES, THE CABINS AND THE PILE HOUSES ALL CARRY A VOLUME NOW. A ladder
     and a derelict do not, and are not buildings: one is a fixed ladder seven
     pixels wide and the other is a seated machine. They are named here so the
     list is a statement and not an omission. */
  const SHELLS = ['house:0', 'house:1', 'house:2', 'cabin:0', 'cabin:1', 'cabin:2',
    'swampHouse:0', 'swampHouse:1', 'swampHouse:2', 'pavilion:0'];
  for (const key of SHELLS) {
    const m = got[key];
    assert.ok(m.depth > m.occupied * 0.20,
      `${key} spends ${m.depth} of ${m.occupied} pixels on a face that is not the `
      + `front. docs/CANON.md: a building carries its own depth axis, and a shell `
      + `that spends none of it is the flat rectangle this gate exists to stop.`);
  }

  assert.deepEqual(flat, [],
    `these forms carry no pixel facing anywhere but the camera: ${flat.join(', ')}. `
    + `Every built form in the world now has some, which is the bar; a form `
    + `joining this list lost its volume.`);
});

test('a built shell keeps its form in the channel the shader reads', () => {
  /* THE DEFECT THIS CATCHES SHIPPED IN THREE VERNACULARS AT ONCE. The atlas
     packs thickness into channel b for materials 1, 3, 9 and 12, so `shade` is
     discarded for anything a building is made of, and the wood branch resolves
     posterise(lit * ao). The pile houses authored 0.87 of variation across
     boards, joists, piles and roof with ao pinned at 0.92, and rendered as a
     flat dark cutout. The lakehouse did the same with 0.86. Every pixel test
     over them passed, because they all read the channel that was being written
     rather than the one being drawn. */
  const got = snapshot();
  const thin = [];
  for (const key of castKeys()) {
    const m = got[key];
    if (!m.mats['1'] && !m.mats['3'] && !m.mats['12']) continue;
    if (m.aoSpread < 0.30) thin.push(`${key} (${m.aoSpread.toFixed(2)})`);
  }
  assert.deepEqual(thin, [],
    `these shells put less than 0.30 of range into ao, which is the only channel `
    + `the wood branch of shaders/sprite.js resolves against:\n  ${thin.join('\n  ')}\n`
    + `A form authored into shade is a form the GPU never sees. Check with `
    + `\`node tools/houses.mjs <kind> <variant>\`, which reports both spreads.`);
});
