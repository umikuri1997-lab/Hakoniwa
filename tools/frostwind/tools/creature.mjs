/* ═══════════════════════════════════════════════════════════════════════════
   THE CREATURE LAB. Every frame of one projected-skeleton body, on its own
   world's ground, beside that world's traveller.

   No build and no browser. The body comes from src/bestiary.js, the colour
   from tools/resolve.mjs under the world's own noon sun.

     node tools/creature.mjs                   every rigged body -> sheets
     node tools/creature.mjs stork             one body
     node tools/creature.mjs stork --ascii     materials in the terminal
     node tools/creature.mjs stork --report    the brief and the measured box

   Sheets land in /tmp/frostwind-creature/<kind>.png: one row per view
   (profile, toward, away), one column per frame, states left to right, at
   10x nearest. A white tick on the left edge marks the ground row.
   ═══════════════════════════════════════════════════════════════════════════ */

import { mkdirSync } from 'node:fs';
import { RIGGED, RIGGED_BY_KIND, makeRigged, validateSpec } from '../src/bestiary.js';
import { ACTOR } from '../src/fauna.js';
import { paintPerson, travellerFor } from '../src/people.js';
import { pxToMetres } from '../src/scale.js';
import { extent, groundsOf, instOf, sunOf } from './lineup.mjs';
import { resolveColour, upscale, writePng } from './resolve.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const names = args.filter((a) => !a.startsWith('--'));
const SCALE = 10, GAP = 3, VIEWS = [2, 0, 1];


function report(spec) {
  const b = spec.brief, make = makeRigged(spec);
  console.log(`\n${spec.kind} (${spec.biome})${b.law ? ', fictional' : ''}`);
  console.log(`  cause      ${b.cause}`);
  console.log(`  authority  ${b.authority}`);
  if (b.law) console.log(`  law        ${b.law}\n  boundary   ${b.boundary.join('; ')}`);
  console.log(`  read       ${b.read}`);
  const box = extent(make(null, 0, 2, spec.size.state));
  console.log(`  size       stated ${spec.size.length.toFixed(2)} x ${spec.size.height.toFixed(2)} m, `
    + `drawn ${box.w} x ${box.h} px = ${pxToMetres(box.w).toFixed(2)} x ${pxToMetres(box.h).toFixed(2)} m`);
  for (const e of validateSpec(spec)) console.log(`  INVALID    ${e}`);
}

function ascii(spec) {
  const make = makeRigged(spec), CH = { 1: '#', 2: 'o', 4: '=', 6: 'r', 10: '*', 11: '*', 16: 's', 17: 'K', 18: 'y', 19: 'L' };
  for (const [state, n] of Object.entries(spec.states)) for (const d of VIEWS) for (let f = 0; f < n; f++) {
    const sp = make(null, f, d, state);
    console.log(`\n${spec.kind} ${state}:${f} dir ${d}`);
    for (let y = 0; y < sp.h; y++) {
      let row = '';
      for (let x = 0; x < sp.w; x++) {
        const m = sp.occ[y * sp.w + x];
        row += m ? CH[m] || '?' : y === sp.ay && x === sp.ax ? '+' : '.';
      }
      if (/[^.]/.test(row)) console.log(row);
    }
  }
}

function sheet(spec) {
  const make = makeRigged(spec), inst = instOf(ACTOR[spec.kind]);
  const sun = sunOf(spec.biome), bg = groundsOf(spec.biome)[0].colour;
  const frames = Object.entries(spec.states).flatMap(([state, n]) =>
    Array.from({ length: n }, (_, f) => ({ state, f })));
  const person = paintPerson(travellerFor(spec.biome), 2, 0, 'idle');
  const cw = spec.canvas.w + GAP, ch = Math.max(spec.canvas.h, person.h) + GAP;
  const W = cw * (frames.length + 1) + GAP + 2, H = ch * VIEWS.length + GAP;
  const img = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { img[i * 4] = bg[0]; img[i * 4 + 1] = bg[1]; img[i * 4 + 2] = bg[2]; img[i * 4 + 3] = 255; }
  const blit = (sp, cx, gy, pinst) => {
    for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
      const i = y * sp.w + x;
      if (!sp.occ[i]) continue;
      const px = cx - sp.ax + x, py = gy - sp.ay + y;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const c = resolveColour(sp, i, sun, pinst), p = (py * W + px) * 4;
      img[p] = c[0]; img[p + 1] = c[1]; img[p + 2] = c[2];
    }
  };
  VIEWS.forEach((d, r) => {
    /* the ground row sits the same distance up every cell */
    const gy = GAP + r * ch + ch - GAP - 1 - (spec.canvas.h - 1 - spec.canvas.ay);
    for (let x = 0; x < 2; x++) { const p = (gy * W + x) * 4; img[p] = img[p + 1] = img[p + 2] = 255; }
    if (r === 0) blit(person, 2 + GAP + (cw >> 1), gy, {});
    frames.forEach(({ state, f }, c) =>
      blit(make(null, f, d, state), 2 + GAP + (c + 1) * cw + spec.canvas.ax, gy, inst));
  });
  const big = upscale(img, W, H, SCALE);
  const dir = '/tmp/frostwind-creature';
  mkdirSync(dir, { recursive: true });
  writePng(`${dir}/${spec.kind}.png`, big.rgba, big.w, big.h);
  console.log(`  ${dir}/${spec.kind}.png  ${big.w}x${big.h}  columns: traveller, ${
    frames.map((q) => `${q.state}:${q.f}`).join(', ')}`);
}

for (const name of names) if (!RIGGED_BY_KIND[name]) {
  console.error(`unknown body "${name}": the rig holds ${RIGGED.map((q) => q.kind).join(', ')}`);
  process.exit(1);
}
for (const spec of names.length ? names.map((n) => RIGGED_BY_KIND[n]) : RIGGED) {
  report(spec);
  if (flags.has('--report')) continue;
  if (flags.has('--ascii')) ascii(spec); else sheet(spec);
}
