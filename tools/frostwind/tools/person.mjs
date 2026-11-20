/* ═══════════════════════════════════════════════════════════════════════════
   THE PERSON LAB. Sibling of tools/houses.mjs and tools/trees.mjs, for the one
   sprite family the other two cannot show: the cast.

   No build, no browser, no atlas. It calls paintPerson the way bakeWorldAtlas
   does, so a row lands on whichever raster src/people.js says owns it, and
   resolves colour through tools/resolve.mjs, the one software mirror of
   SPRITE_FS that test/resolve.test.mjs holds against the shader.

     node tools/person.mjs                        every cast row -> sheets/
     node tools/person.mjs traveller              one row
     node tools/person.mjs traveller --ascii      terminal materials, no file
     node tools/person.mjs traveller --state walk --dir 2   one bank
     node tools/person.mjs desertTraveller --wear felt-dome,windlass-rope
                                                  gear over the row's own dress;
                                                  --biome names the world whose
                                                  laws decide (default: the
                                                  traveller's own)

   Sheets land in /tmp/frostwind-person/<name>.png: one row per view
   (front, away, profile, front diagonal, away diagonal), columns are
   idle 0..5 | walk 0..7 | run 0..7, drawn at 6x nearest with the ground row
   aligned, plus the three look variants of the front idle at the right edge.
   ═══════════════════════════════════════════════════════════════════════════ */

import { mkdirSync } from 'node:fs';
import { wear } from '../src/gear.js';
import { CAST, PERSON_VIEWS, TRAVELLER_BY_BIOME, castStates,
         paintPerson } from '../src/people.js';
import { SCENES } from '../src/scene.js';
import { resolveColour, upscale, writePng } from './resolve.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const rest = args.filter((a) => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

/* Gear: src/gear.js folds the items over the row's dress and the world's
   laws refuse what they refuse. The sheet draws what is left. */
let OUTFIT = null;
const wearIds = (opt('wear', '') || '').split(',').filter(Boolean);
if (wearIds.length && rest[0]) {
  const biome = opt('biome', Object.keys(TRAVELLER_BY_BIOME)
    .find((b) => TRAVELLER_BY_BIOME[b] === rest[0]) || 'boreal');
  const scene = Object.values(SCENES).find((q) => q.biome === biome);
  const got = wear(rest[0], wearIds, { biome, ramps: scene?.ramps });
  for (const q of got.refused) console.log(`refused ${q.item}: ${q.reason}`);
  console.log(`worn in ${biome}: ${got.worn.join(', ') || 'nothing'}`);
  OUTFIT = got.changed ? got.fashion : null;
}

/* ── sheet assembly ──────────────────────────────────────────────────────── */
const SCALE = 6, GAP = 2;
const BG = [24, 26, 34, 255];

function sheet(name) {
  const cols = [];
  for (const [state, n] of Object.entries(castStates(CAST[name])))
    for (let f = 0; f < n; f++) cols.push({ state, f, look: 'neutral' });
  for (const look of ['left', 'right', 'up']) cols.push({ state: 'idle', f: 0, look });

  const sprites = [];
  let cellW = 0, cellH = 0;
  for (let d = 0; d < PERSON_VIEWS; d++) {
    const row = cols.map(({ state, f, look }) => paintPerson(name, d, f, state, look, OUTFIT));
    for (const sp of row) { cellW = Math.max(cellW, sp.w); cellH = Math.max(cellH, sp.h); }
    sprites.push(row);
  }
  const W = (cellW + GAP) * cols.length + GAP;
  const H = (cellH + GAP) * PERSON_VIEWS + GAP;
  const img = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) BG.forEach((v, k) => { img[i * 4 + k] = v; });
  for (let d = 0; d < PERSON_VIEWS; d++) {
    for (let c = 0; c < cols.length; c++) {
      const sp = sprites[d][c];
      const ox = GAP + c * (cellW + GAP) + ((cellW - sp.w) >> 1);
      const oy = GAP + d * (cellH + GAP) + (cellH - sp.h);   // ground rows align
      for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
        const i = y * sp.w + x;
        if (!sp.occ[i]) continue;
        const [r, g, b] = resolveColour(sp, i);
        const px = (oy + y) * W + ox + x;
        img[px * 4] = r; img[px * 4 + 1] = g; img[px * 4 + 2] = b; img[px * 4 + 3] = 255;
      }
    }
  }
  return upscale(img, W, H, SCALE);
}

function ascii(name, dir, state) {
  const MAT = { 4: '#', 5: 'C', 6: 'A', 7: '|', 16: '.', 2: 'r' };
  const n = castStates(CAST[name])[state];
  for (let f = 0; f < n; f++) {
    const sp = paintPerson(name, dir, f, state, 'neutral', OUTFIT);
    console.log(`\n${name} dir ${dir} ${state}:${f}  ${sp.w}x${sp.h}  anchor ${sp.ax},${sp.ay}`);
    for (let y = 0; y < sp.h; y++) {
      let row = '';
      for (let x = 0; x < sp.w; x++) row += MAT[sp.occ[y * sp.w + x]] || ' ';
      if (row.trim()) console.log(String(y).padStart(3) + ' ' + row);
    }
  }
}

const names = rest[0] ? [rest[0]] : Object.keys(CAST);
for (const n of names) if (!CAST[n]) {
  console.error(`unknown cast row "${n}" — the cast is ${Object.keys(CAST).join(', ')}`);
  process.exit(1);
}

if (flags.has('--ascii')) {
  for (const name of names) ascii(name, +opt('dir', 0), opt('state', 'walk'));
} else {
  const dir = '/tmp/frostwind-person';
  mkdirSync(dir, { recursive: true });
  for (const name of names) {
    const { rgba, w, h } = sheet(name);
    const path = `${dir}/${name}.png`;
    writePng(path, rgba, w, h);
    console.log(`${path}  ${w}x${h}`);
  }
}
