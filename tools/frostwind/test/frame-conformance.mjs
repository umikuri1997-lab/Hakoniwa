/* Frame conformance gate. One real frame per world, held to the laws the
   model proves.

   Target: dist/frostwood.html; override with FROSTWOOD_HTML.

   A real frame makes the one claim no model test can: the shader agrees with
   the model. One shot per world, roughly nineteen seconds each. Colour
   authorities live in test/palette.test.mjs.

   The law is the output end of the sprite channel contract. A sprite stores
   material, normal, occlusion and thickness; colour resolves at draw time
   against the scene's locked palette, and POST_FS snaps the result to the
   nearest entry that world declared. So every pixel in a quantised frame is
   one of those entries. src/palette.js and test/biome.test.mjs prove the list
   closed, reachable and inside the 64 the shader iterates. This test checks
   it against pixels a GPU produced. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureAll, allShots, shotName, RESOLUTION } from './capture.mjs';
import { SCENES, sceneRamps } from '../src/scene.js';
import { bakeOutPalette, repaint, warmShift } from '../src/palette.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function targetHtml() {
  if (process.env.FROSTWOOD_HTML) return resolve(ROOT, process.env.FROSTWOOD_HTML);
  return resolve(ROOT, 'dist/frostwood.html');
}

/* The scene id a place resolves to is the renderer's answer, asserted below. */
const sceneOf = (name) => name.startsWith('meadow-') ? 'meadow'
  : name.startsWith('swamp-') ? 'swamp'
  : name.startsWith('desert-') ? 'desert'
  : name.startsWith('hollow-') ? 'hollow' : 'frostwood';

/* Captures are expensive, so they are taken once and every assertion reads
   the same results. */
test('the frame the GPU draws obeys the laws the model proves', { timeout: 900000 },
  async (t) => {
    const html = targetHtml();
    t.diagnostic(`capturing from ${html.replace(ROOT + '/', '')}`);
    const actual = await captureAll(html);

    const names = allShots().map((s) => shotName(s.seed, s.res, s.place));
    assert.deepEqual(Object.keys(actual).sort(), names.slice().sort(),
      'captured shot list does not match the declared matrix');

    const rows = [];
    const strayed = [];
    for (const name of names) {
      const got = actual[name], id = sceneOf(name);

      /* A measurement of the wrong place, or of a target whose size moved,
         would pass every colour test below. */
      assert.equal(got.scene, id,
        `${name}: captured scene '${got.scene}', expected '${id}'`);
      assert.equal(`${got.internal[0]}x${got.internal[1]}`, RESOLUTION,
        `${name}: internal resolution is ${got.internal.join('x')}, not ${RESOLUTION}`);
      assert.ok(got.w >= got.internal[0] && got.h >= got.internal[1],
        `${name}: the ${got.w}x${got.h} drawing buffer is smaller than the `
        + `${got.internal.join('x')} world it must present`);

      /* The snap list is derived from the scene authority, independent of
         the renderer readback. The warm shift must match the run because it
         changes the bound palette. */
      const out = bakeOutPalette(got.warmth, sceneRamps(id), repaint(SCENES[id].fog));
      out.tex.dispose();
      assert.equal(out.n, got.snapEntries,
        `${name}: the renderer bound ${got.snapEntries} snap entries and this test `
        + `derived ${out.n} from SCENES.${id} at warmth ${got.warmth}. The frame is `
        + `being measured against a palette no pass ever used.`);
      /* bakeOutPalette returns the list unshifted and writes warm-shifted bytes
         into the texture POST_FS samples. The frame carries the texture values. */
      const snap = new Set(out.list.map(
        (c) => warmShift(c, got.warmth).map(Math.round).join(',')));

      let off = 0;
      const worst = [];
      for (const [colour, count] of got.colours) {
        if (snap.has(colour)) continue;
        off += count;
        if (worst.length < 6) worst.push(`[${colour}] x${count}`);
      }
      const share = off / got.pixels;
      rows.push(`  ${name.padEnd(22)} warmth ${got.warmth.toFixed(2)}  `
        + `${String(got.distinct).padStart(3)} colours of ${snap.size} declared, `
        + `${(share * 100).toFixed(2)}% off-palette`);
      if (off) strayed.push(`  ${name}: ${(share * 100).toFixed(2)}% of pixels `
        + `(${off}/${got.pixels}) are not entries in the ${id} snap list; ${worst.join(' ')}`);

      /* A frame with only a handful of colours is a flat fill that happens to
         be quantised. The low floor catches a broken bake; composition
         belongs to visual review. */
      assert.ok(got.distinct >= 8,
        `${name}: the frame carries only ${got.distinct} colours`);
    }

    console.log(`\n  FRAME PALETTE CONFORMANCE: every pixel is an entry its `
      + `world declared\n${rows.join('\n')}`);

    assert.deepEqual(strayed, [],
      `a frame carries colours its world's palette cannot produce:\n${strayed.join('\n')}\n\n`
      + `Every pixel leaves POST_FS snapped to the nearest entry of the scene's\n`
      + `locked palette, so a colour outside that list did not come through the\n`
      + `snap. Either a pass draws after the quantiser, or the scene declares a\n`
      + `different list than the one it draws with; see SCENES in src/scene.js\n`
      + `and 'every scene declares the ramps it actually draws with'.`);
  });
