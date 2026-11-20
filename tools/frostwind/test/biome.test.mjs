/* Biome harness: world, botany, palette and sunlight laws, with measured
   values and units in every diagnostic. Direct module imports only: no build,
   browser, or atlas texture. Causes are recovered from finished sprites (fork
   radii, crown depth, lobes, material channels, normals). A declaration check
   is paired with a drawn consequence.

   Run: npm run test:biome */

import test from 'node:test';
import assert from 'node:assert/strict';
import { reportConsole as console } from './report.mjs';

import { RNG } from '../src/rng.js';
import {
  BOTANY, CROWN_HALF, KINDS, MAX_LEAN, MIN_H, SPECIES, SPECIES_H, TIER_N, VARIANTS,
  makeTree, tierHeight,
} from '../src/species.js';
import { ATLAS_S } from '../src/constants.js';
import { CABIN_H, cabinFootprint } from '../src/cabin.js';
import { BIOMES, HABITAT, LAYERS, TIERS, makeWorldGen } from '../src/worldgen.js';
import { growsIn } from '../src/biome.js';
import {
  FOG, MAX_RUNGS, PALETTE, RAMP, RAMP_BASE, RAMP_ID, RAMP_ORDER,
  bakeOutPalette, repaint,
} from '../src/palette.js';
import {
  A_WATER, CANOPY, FRESNEL, LEAF_T, POND_MARGIN_PX, POND_MAX_M, SUN, WATER_PATH,
  SIGMA_MEADOW, bytesToOklab, dEok, ladder, meadowRamps, omega, pondDepth, pondRadiance, pondT,
  hollowRamps, sunAt, swampRadiance, swampRamps, SWAMP_MAX_M, vegStates,
} from '../src/sunlight.js';
import { SURFACE } from '../src/surface.js';
import { steadingFootprint } from '../src/steading.js';
import { makePavilion, pavilionFootprint } from '../src/pavilion.js';
import { makeHut } from '../src/desert-hamlet.js';
import { makeTent } from '../src/desert-camp.js';
import { makeCapHouse, makeCutBench, makeLampPost } from '../src/hollow-village.js';
import { CAST, CAST_BY_KEY, FASHION } from '../src/people.js';
import { ACTOR } from '../src/fauna.js';
import { LIFE } from '../src/life.js';
import { MACHINE } from '../src/machine.js';
import { SCENES, sceneRamps } from '../src/scene.js';
import { SNOW, THICK_PX, grow, newSprite } from '../src/sprite.js';

/* Computed ramps, read from the generators so a ramp that becomes derived is
   asserted at once. */
const DERIVED = new Set([...Object.keys(meadowRamps()),...Object.keys(swampRamps()),
  ...Object.keys(hollowRamps())]);

/* Vegetation families. Canopy (foliage deposits) and grass (meadow floor) are
   independent four-rung ramps: shared rungs give every plant and moss deposit
   the ground's colour. CANON allows exact shared rungs or clearance. Swamp
   water windows share by design. */
/* The two cave floors are one albedo under two lamps: they share the two
   resting rungs by derivation (hollowRamps). */
const FAMILY = [['swampWater','swampShallow'],['caveRock','geodeRock','moonRock'],
  ['dripstone','geodeStone']];
const sameFamily = (a, b) => FAMILY.some((p) => p.includes(a) && p.includes(b));
const OVERLAP = 3;                    // swamp water window shared block
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lum709 = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

const SEED = 20260727;
const pct = (x) => `${(x * 100).toFixed(1)}%`;

/* Height bakeWorldAtlas requests, so a tier claim is about the drawn sprite.
   Birch ratio is the denominator; ATLAS_S is the atlas-space scale. */
const heightOf = (kind, ti) =>
  Math.round(tierHeight(ti) * ATLAS_S * (SPECIES_H[kind] / SPECIES_H.birch));

const treesOf = (kind) => {
  const out = [];
  for (let ti = 0; ti < TIER_N; ti++) {
    const h = heightOf(kind, ti);
    if (h < (MIN_H[kind] || 12)) continue;
    for (let v = 0; v < 3; v++) out.push({ ti, h, sp: makeTree(kind, h, new RNG(SEED ^ (ti * 977 + v)), 1.0, 0.78, 0) });
  }
  return out;
};

/* ═══════════════════════════════════════════════════════════════════════════
   1. Area conservation at every fork
   Leonardo da Vinci, Notebooks, c. 1500. Encoded at BOTANY.alpha and grow().

   Recovered from sp.forks:

       residual = | r_p^a - (r_c^a + r_k^a) | / r_p^a

   The 0.8 px child-radius floor makes conservation unreachable below a derived
   parent thickness (the medium overrides the law). Assert above it, report
   below it.
   ═══════════════════════════════════════════════════════════════════════════ */
test('area conservation holds at every fork thick enough to carry it', () => {
  /* Threshold where the child's unfloored radius reaches 0.8:

         w * share^(1/alpha) < 0.8      =>      w < 0.8 / share^(1/alpha)

     `share` is norm(0.34, 0.09) clamped to [0.10, 0.62] and alpha is at least
     1.70. Worst case:

         0.10^(1/1.70) = 0.258      =>      w < 3.10 px

     Smallest share and exponent keep this conservative for every BOTANY row. */
  const SHARE_LO = 0.10, CHILD_FLOOR = 0.8;
  const alphaLo = Math.min(...Object.values(BOTANY).map((b) => b.alpha.m));
  const THICK = CHILD_FLOOR / Math.pow(SHARE_LO, 1 / alphaLo);
  const TOL = 0.02;         // 2% on the members thick enough to hold it
  const rows = [];
  let worstThick = 0, worstThickAt = '';

  for (const kind of KINDS) {
    const a = BOTANY[kind] ? BOTANY[kind].alpha.m : BOTANY.birch.alpha.m;
    const thick = [], thin = [];
    for (const { sp } of treesOf(kind)) {
      const alpha = sp.alpha;
      for (const [p, c, k] of sp.forks || []) {
        if (p <= 0) continue;
        const lhs = Math.pow(p, alpha);
        const res = Math.abs(lhs - (Math.pow(c, alpha) + Math.pow(k, alpha))) / lhs;
        (p >= THICK ? thick : thin).push(res);
        if (p >= THICK && res > worstThick) { worstThick = res; worstThickAt = `${kind} w=${p.toFixed(2)}px`; }
      }
    }
    const med = (v) => (v.length ? v.slice().sort((x, y) => x - y)[v.length >> 1] : 0);
    rows.push(`  ${kind.padEnd(8)} alpha ${a.toFixed(2)}  forks ${String(thick.length + thin.length).padStart(5)}`
      + `  thick ${String(thick.length).padStart(5)} median ${pct(med(thick)).padStart(6)}`
      + `  thin ${String(thin.length).padStart(5)} median ${pct(med(thin)).padStart(7)}`);
  }

  assert.ok(worstThick <= TOL,
    `area conservation is violated on a member thick enough to hold it.\n`
    + `worst residual ${pct(worstThick)} at ${worstThickAt}, tolerance ${pct(TOL)}.\n`
    + `This is the law the whole vegetation model rests on and the only thing\n`
    + `that should ever break it is the ${CHILD_FLOOR} px child floor in grow(), which\n`
    + `cannot reach a member ${THICK.toFixed(2)} px or thicker. Something changed grow().\n\n`
    + rows.join('\n'));

  console.log('  DA VINCI, per species — residual of r_p^a vs r_c^a + r_k^a');
  console.log(rows.join('\n'));
  console.log(`  thick/thin boundary ${THICK.toFixed(2)} px, DERIVED: ${CHILD_FLOOR} px child floor`);
  console.log(`  over the smallest share (${SHARE_LO}) at the smallest alpha (${alphaLo.toFixed(2)})`);
  console.log(`  worst on a thick member: ${pct(worstThick)} at ${worstThickAt}`);
  console.log('  THE THIN COLUMN IS THE MEDIUM WINNING, and it wins hugely: grow()');
  console.log('  floors a child radius at 0.8 px and leaves the continuing stem');
  console.log('  unfloored, so below the boundary the law is not approximately');
  console.log('  true, it is arithmetically unreachable — and most forks in this');
  console.log('  world are below it. A law of the world beaten by a law of the');
  console.log('  medium at the smallest scale in the picture. Recorded in');
  console.log('  docs/CANON.md, not tolerated by a loose number here.');
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. Palm taper and crown conservation
   Tomlinson, Bot. J. Linn. Soc. 151:5-14, 2006.

   A monocot has no vascular cambium: stem width is constant above
   establishment growth. With no stem forks, conservation holds once across
   all crown traces: r_stem^a = N * r_petiole^a. Asserted separately because
   either can drift alone.
   ═══════════════════════════════════════════════════════════════════════════ */
test('the palm does not taper, and conserves area at the crown instead', () => {
  const rows = [];
  let worstTaper = 0, worstTaperAt = '', worstCrown = 0, worstCrownAt = '';

  for (const { ti, h, sp } of treesOf('palm')) {
    /* Follow the run nearest the previous row's centre upward from the base.
       Material alone confuses frond rachises with trunk: both are wood. */
    const runAt = (y, near) => {
      let x0 = -1, x1 = -1, bx0 = -1, bx1 = -1, bd = 1e9;
      for (let x = 0; x <= sp.w; x++) {
        const m = x < sp.w ? sp.occ[y * sp.w + x] : 0;
        if (m === 1 || m === 3) { if (x0 < 0) x0 = x; x1 = x; }
        else if (x0 >= 0) {
          const d = Math.abs((x0 + x1) / 2 - near);
          if (d < bd) { bd = d; bx0 = x0; bx1 = x1; }
          x0 = -1;
        }
      }
      return bx0 < 0 ? null : { w: bx1 - bx0 + 1, c: (bx0 + bx1) / 2 };
    };
    const widths = [];
    let near = sp.ax, prev = null;
    for (let y = sp.h - 1; y >= 0; y--) {
      const r = runAt(y, near);
      if (!r) break;
      /* One-pixel width jitter is rasterisation; a larger jump begins the crown. */
      if (prev !== null && Math.abs(r.w - prev) > 1) break;
      widths.push(r.w); near = r.c; prev = r.w;
    }
    /* Exclude the wider primary-thickening cone at the bottom fifth. */
    const above = widths.slice(Math.max(1, Math.round(widths.length * 0.20)));
    const wMin = Math.min(...above), wMax = Math.max(...above);
    const spread = (wMax - wMin) / wMax;
    if (spread > worstTaper) { worstTaper = spread; worstTaperAt = `tier ${ti} h=${h}`; }

    /* Crown conservation from sp.forks, the finished sprite's record. */
    const f = sp.forks || [];
    const N = f.length;
    let crownRes = 0;
    if (N > 0) {
      const [rStem, rPet] = f[0];
      const lhs = Math.pow(rStem, sp.alpha);
      crownRes = Math.abs(lhs - N * Math.pow(rPet, sp.alpha)) / lhs;
      if (crownRes > worstCrown) { worstCrown = crownRes; worstCrownAt = `tier ${ti} h=${h}`; }
    }
    rows.push(`  tier ${ti}  h ${String(h).padStart(3)}px  stem ${wMin}-${wMax}px`
      + `  taper ${pct(spread).padStart(6)}  fronds ${String(N).padStart(2)}`
      + `  crown residual ${pct(crownRes).padStart(6)}`);
  }

  assert.ok(worstTaper <= 0.20,
    `the palm trunk tapers, and a monocot's cannot.\n`
    + `widest-to-narrowest spread ${pct(worstTaper)} at ${worstTaperAt}, tolerance 20%.\n`
    + `A palm has no vascular cambium (Tomlinson 2006) so its diameter is set by\n`
    + `the primary thickening meristem BEFORE the stem elongates. SPECIES.palm\n`
    + `carries taper: 0.0 and grow()'s term is pow(1-t, taperP), which is 1 at\n`
    + `every t. If this fails, either taperP moved or something is tapering the\n`
    + `stem that is not the taper term.\n\n` + rows.join('\n'));

  assert.ok(worstCrown <= 0.02,
    `the palm does not conserve area at the crown.\n`
    + `worst residual ${pct(worstCrown)} at ${worstCrownAt}.\n`
    + `r_stem^a = N * r_petiole^a is the ONE place a plant with no forks can\n`
    + `still obey da Vinci: every frond trace leaves the same fixed set of\n`
    + `fibrovascular bundles, so conservation applies once, across all N fronds\n`
    + `at the same time.\n\n` + rows.join('\n'));

  console.log('  THE PALM — Corner\'s Model, and the two claims it makes');
  console.log(rows.join('\n'));
  console.log('  taper is the spread of stem width above the establishment cone;');
  console.log('  a monocot has no cambium, so it must be ~0 by construction.');
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. Frond divergence is the golden angle
   Charles Bonnet, 1754; the golden-angle divergence, 137.5077 degrees.

   Declaration plus drawn consequence: leaf-base scars on the trunk keep the
   generated helix, so an unread declaration fails. Six scars reject a short
   accidental run.
   ═══════════════════════════════════════════════════════════════════════════ */
test('frond divergence is the golden angle, and the scars prove it was used', () => {
  const GOLDEN = 137.50776405;
  const declared = SPECIES.palm.cfg.divergence;

  assert.ok(Math.abs(declared - GOLDEN) < 0.01,
    `SPECIES.palm.cfg.divergence is ${declared}, and the golden angle is\n`
    + `${GOLDEN.toFixed(5)}. Phyllotaxis is not "about 137" -- the divergence is\n`
    + `360 * (1 - 1/phi), and a palm's Fibonacci fractions only come out of it if\n`
    + `it is the real number.`);

  /* Scar x-offsets follow cos(k * divergence). The side-change rate rejects a
     straight line or short period without exact subpixel offsets. */
  const { sp } = treesOf('palm').slice(-1)[0];
  const offs = [];
  for (let y = 0; y < sp.h; y++) {
    let x0 = -1, x1 = -1, sx = -1;
    for (let x = 0; x < sp.w; x++) {
      const m = sp.occ[y * sp.w + x];
      if (m === 1 || m === 3) { if (x0 < 0) x0 = x; x1 = x; }
      if (m === 3) sx = x;
    }
    if (sx >= 0 && x1 - x0 >= 1) offs.push((sx - (x0 + x1) / 2) / ((x1 - x0) / 2 || 1));
  }
  let flips = 0;
  for (let i = 1; i < offs.length; i++) if (Math.sign(offs[i]) !== Math.sign(offs[i - 1])) flips++;
  const rate = offs.length > 1 ? flips / (offs.length - 1) : 0;

  assert.ok(offs.length >= 6,
    `only ${offs.length} leaf-base scars were found on the tallest palm, and the\n`
    + `helix cannot be measured from fewer than six. scarPass writes material 3\n`
    + `onto the trunk; either it did not run or the trunk is too thin to carry it.`);
  assert.ok(rate > 0.30,
    `the leaf-base scars do not stagger: ${pct(rate)} of consecutive scars change\n`
    + `side, over ${offs.length} scars. At a 137.5 degree divergence cos(k*div)\n`
    + `changes sign about 55% of the time, so a low rate means the scars are\n`
    + `being drawn down one side and the divergence is DECLARED BUT NOT USED --\n`
    + `which is the failure mode this test exists for.`);

  console.log(`  PHYLLOTAXIS  declared ${declared} deg, golden ${GOLDEN.toFixed(5)} deg`);
  console.log(`  ${offs.length} leaf-base scars on the tallest palm, ${pct(rate)} change side`);
  console.log(`  ${sp.forks.length} silhouette fronds — the Fibonacci floor selected after`);
  console.log(`  the cabinet projection folds depth into separation. frondCount().`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. Species height ratios, in metres
   SPECIES_H is read only as a ratio against the birch. Asserts every KIND has
   a row (an undefined ratio is NaN and erases the species at atlas sizing) and
   prints the ladder in metres and traveller multiples. Heights are drawn
   metres: the medium compresses landmark vegetation, cabins stay near life
   scale. The placed maximum comes from TIERS, not atlas capacity.
   ═══════════════════════════════════════════════════════════════════════════ */
test('every species has a height ratio, and the ladder is printed in metres', () => {
  const missing = KINDS.filter((k) => SPECIES_H[k] === undefined);
  assert.equal(missing.length, 0,
    `these kinds are in KINDS with no SPECIES_H row: ${missing.join(', ')}.\n`
    + `atlas.js multiplies SPECIES_H[k] / SPECIES_H.birch, so a missing row is\n`
    + `NaN pixels tall and the species silently does not exist.`);

  /* Frame-dominance claims use TIERS (placed), not the tallest bakeable sprite. */
  let placedTall = 0, placedWho = '';
  const rows = KINDS.map((k) => {
    const atlasHs = [];
    for (let ti = 0; ti < TIER_N; ti++) {
      const h = heightOf(k, ti);
      if (h >= (MIN_H[k] || 12)) atlasHs.push(h);
    }
    const tl = TIERS[k];
    const placed = tl ? [...new Set(tl)].map((t) => heightOf(k, t)) : [];
    const pMax = placed.length ? Math.max(...placed) : 0;
    if (pMax > placedTall) { placedTall = pMax; placedWho = k; }
    return `  ${k.padEnd(8)} ratio ${SPECIES_H[k].toFixed(3)}`
      + `  atlas ${String(atlasHs.length).padStart(1)}/${TIER_N} to ${String(Math.max(...atlasHs)).padStart(3)}px`
      + `  PLACED ${(placed.join('/') || '—').padStart(7)}px`
      + `  = ${(pMax / 26 * 1.70).toFixed(2).padStart(5)} m  ${(pMax / 26).toFixed(2)}x the traveller`;
  });

  assert.ok(placedTall > 0,
    `no species has a TIERS row, so nothing would be placed in the world at all.`);

  console.log('  THE HEIGHT LADDER — drawn metres at PLAYER_H = 26 px = 1.70 m');
  console.log(rows.join('\n'));
  console.log(`  TALLEST TREE THE WORLD PLACES: ${placedWho} ${placedTall}px`
    + ` = ${(placedTall / 26 * 1.70).toFixed(2)} m = ${(100 * placedTall / 180).toFixed(0)}% of a 180-row frame`);
  console.log('  a 180-row frame is 11.77 m tall, and THAT is the authority for');
  console.log('  anything tall. These are DRAWN heights: a mature spruce is 25-30 m');
  console.log('  and draws at about a fifth of it, while the cabins draw at life.');
  console.log('  Two vertical scales, ~5x apart — see docs/CANON.md.');
});

/* ═══════════════════════════════════════════════════════════════════════════
   5. No sprite contains a colour
   ARCHITECTURE.md. Every field is a known shader or measurement channel, every
   material id dispatches, every normal is unit length: n·L turns length error
   into authored brightness that bypasses the palette.
   ═══════════════════════════════════════════════════════════════════════════ */
test('no sprite contains a colour, and every normal is a unit vector', () => {
  /* the materials tree sprites may carry: 0 empty, 1 wood, 2 deposit, 3 bark,
     and 9 flexible aerial-root wood. Figure and machine banks add 4-8. */
  /* 19 is a luminous body (src/speleo.js): SPRITE_FS reads it unlit. */
  const KNOWN = new Set([0, 1, 2, 3, 4, 5, 6, 9, 19]);
  const CHANNELS = new Set(['w', 'h', 'ax', 'ay', 'occ', 'shade', 'horiz', 'rad',
    'nx', 'ny', 'nz', 'ao', 'noSnow', 'forks', 'alpha', 'crownR', 'crownW',
    /* ramp/ramp2 are shader-resolved material-family names, not colours. */
    'ramp', 'ramp2', 'dMin', 'dMax', 'sMin', 'sMax', 'kind', 'tilt',
    /* vol is shader input; lobes/crownD retain measurable pipe-model causes. */
    'vol', 'lobes', 'crownD']);

  const rows = [];
  let worstNorm = 0, worstNormAt = '';
  for (const kind of KINDS) {
    const mats = new Set();
    let px = 0, offNorm = 0;
    for (const { sp } of treesOf(kind)) {
      for (const k of Object.keys(sp)) {
        assert.ok(CHANNELS.has(k),
          `a ${kind} sprite carries an unknown channel "${k}".\n`
          + `Every channel has to be something the shader resolves. A new one is\n`
          + `either a colour by another name or a channel nothing reads — and\n`
          + `this project has found both.`);
      }
      for (let i = 0; i < sp.w * sp.h; i++) {
        const m = sp.occ[i];
        mats.add(m);
        if (!m) continue;
        px++;
        const n = Math.hypot(sp.nx[i], sp.ny[i], sp.nz[i]);
        const err = Math.abs(n - 1);
        if (err > 0.02) offNorm++;
        if (err > worstNorm) { worstNorm = err; worstNormAt = `${kind} |n|=${n.toFixed(3)}`; }
      }
    }
    const unknown = [...mats].filter((m) => !KNOWN.has(m));
    assert.equal(unknown.length, 0,
      `a ${kind} sprite uses material id${unknown.length > 1 ? 's' : ''} ${unknown.join(', ')},\n`
      + `and the sprite shader has no branch for it. An unbranched material does\n`
      + `not fall back to a default — it falls through to the accent ramp, which\n`
      + `is the one saturated hue in the world.`);
    rows.push(`  ${kind.padEnd(8)} ${String(px).padStart(6)} px  materials {${[...mats].sort().join(',')}}`
      + `  off-unit normals ${offNorm}`);
  }

  assert.ok(worstNorm <= 0.02,
    `a normal is not a unit vector: worst |n| error ${worstNorm.toFixed(4)} at ${worstNormAt}.\n`
    + `The lambert term is n . L, so a normal of length 1.3 is a pixel 30%\n`
    + `brighter than its geometry earns. That is an authored brightness wearing a\n`
    + `geometry costume, and it is the one way a colour CAN get into a sprite.\n\n`
    + rows.join('\n'));

  console.log('  THE INVARIANT — material ids and normals, no colour anywhere');
  console.log(rows.join('\n'));
  console.log(`  worst |normal| error ${worstNorm.toFixed(4)} across every species and tier`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   6. The palette is closed and the snap reaches all of it
   docs/CANON.md, laws of the medium: "no code path accepts a colour".

   POST_FS runs a fixed 64-iteration nearest-palette loop; later entries are
   unreachable. Each scene snap list fits the loop and includes the haze colour
   the frame blends toward.

   Texture addressing: RAMP_ORDER is the exact key order of RAMP_BASE and every
   ramp fits MAX_RUNGS. A colour with no id or a rung past texture width is
   unreachable in the frame.
   ═══════════════════════════════════════════════════════════════════════════ */
/* The per-scene declaration is derived from what puts ramp ids on the GPU and
   compared with SCENES:

     the ground     every surface flag this world's remap can produce
     the plants     SPECIES.ramp and .ramp2, for kinds whose HABITAT row
                    belongs to this world
     the people     CAST and ACTOR expression rows
     the shader     SPRITE_FS hardcodes `trunk` (material 3, bark) and `accent`
                    (material 5) whatever ramp the instance carries, so any
                    world that draws a person needs both

   Built shells set ramp names inside draw functions, so the pavilion, hut and
   tent are compiled below for their shell-only ramps. */
/* Surplus is asserted: POST_FS snaps every output pixel to the nearest entry,
   so a ramp no material resolves still competes for "nearest". Measured: 8
   unresolved entries per scene put swamp at 59/64 against 51/64. See
   sceneRamps in src/scene.js.

   Allowed surplus, one reason per row. */
const SPARE_OK = {
  /* Material 16 resolves `skin` in SPRITE_FS for any person. The other worlds
     carry a warm ramp a face lands on; no cave colour is near one, and
     undeclared, a face snaps to the coat. */
  hollow: ['skin'],
  /* Reported debt: reeds do not grow in the swamp (HABITAT.reed.exclude), and
     this check read `biome:'both'` without the exclusion until the Hollow
     made it honour growsIn. Dropping `twig` moves the swamp's snap list, so
     it waits for a swamp change. */
  swamp: ['twig'],
  /* The contact sprite sets sp.ramp='shade' (src/sprite.js). The GPU draws
     contacts through the bContact batch on W_SHADOW_FS, a shadow mask that
     never reaches the snap list. The software compositor in sprite.js does
     resolve it. */
  frostwood: ['shade'],
};
test('every scene declares the ramps it actually draws with', () => {
  const HARDCODED = ['trunk', 'accent', 'machineSignal', 'folkDark'];
  /* SPRITE_FS hardcodes trunk, accent, machineSignal and the human under-layer.
     Each must be present wherever its material can draw. */
  const rows = [];
  for (const id of Object.keys(SCENES)) {
    const S = SCENES[id], B = BIOMES[S.biome];
    const ramps = sceneRamps(id);
    const need = new Map();                // ramp -> why
    const want = (r, why) => { if (r && !need.has(r)) need.set(r, why); };

    /* Ground: every flag the chunk baker can write, through this world's
       material remap. Flag 6 is the retired SURFACE slot. */
    for (let f = 0; f <= 5; f++) {
      const to = (B.ground && B.ground[f] !== undefined) ? B.ground[f] : f;
      want(SURFACE[to].ramp, `surface ${SURFACE[to].name}`);
    }
    /* what a world's own painter writes beyond the remap */
    for (const f of B.surfaces || []) want(SURFACE[f].ramp, `surface ${SURFACE[f].name}`);
    /* the plants this world grows */
    for (const k of Object.keys(HABITAT)) {
      if (!growsIn(S.biome, k)) continue;
      const sp = SPECIES[k];
      if (!sp) continue;
      want(sp.ramp, `species ${k}`);
      want(sp.ramp2, `species ${k} deposit`);
    }
    /* The traveller is scene-specific; resident figures enter through LIFE below. */
    const hero=S.biome==='swamp'?CAST.swampTraveller:CAST.traveller;
    want(hero.ramp,`cast ${hero.key}`);
    want(hero.ramp2,`cast ${hero.key} accent`);
    want(S.precipitation.ramp,`${S.precipitation.kind} precipitation`);
    for (const n of Object.keys(ACTOR)) {
      const F=ACTOR[n],profile=LIFE[n];
      if(!profile?.biomes.includes(S.biome))continue;
      want(F.ramp, `fauna ${n}`);
      want(F.ramp2, `fauna ${n} deposit`);
      /* Material 18 resolves `folkDye` in SPRITE_FS for any wearer, so the
         ramp is needed only where a dress bands or carries a lantern pane.
         Derived from FASHION so a world that starts banding must declare it. */
      const dress=FASHION[n];
      if(dress&&(dress.dyePlace&&dress.dyePlace!=='none'
        ||dress.carriedKit==='hand-lantern'))
        want('folkDye', `dyed band on ${n}`);
    }
    if(B.steading){
      const pavilion=makePavilion(null,0);
      want(pavilion.ramp,'pavilion cloth');
      want(pavilion.ramp2,'pavilion fibre');
    }
    /* Read from the shell, so new cladding must be a ramp its world declares. */
    if(B.desertHamlet){
      const hut=makeHut(null,0);
      want(hut.ramp,'hut earth');
      want(hut.ramp2,'hut opening');
    }
    if(B.hollowVillage){
      for(const shell of [makeCapHouse(null,0),makeLampPost(),makeCutBench()]){
        want(shell.ramp,`${shell.kind} stone`);
        want(shell.ramp2,`${shell.kind} light`);
      }
    }
    if(B.desertCamp){
      const tent=makeTent(null,0);
      want(tent.ramp,'tent cloth');
      want(tent.ramp2,'tent warp');
    }
    for (const r of HARDCODED) want(r, 'hardcoded in SPRITE_FS');

    const declared = new Set(ramps);
    const rig = 'cast';
    const missing = [...need.keys()].filter((r) => !declared.has(r));
    assert.deepEqual(missing, [],
      `scene '${id}' under the ${rig} draws with ramps it did not declare: `
      + missing.map((r) => `${r} (${need.get(r)})`).join(', ') + '.\n'
      + `Every pixel that wanted one of those snaps to the nearest entry of a\n`
      + `list that does not contain it — over the whole frame, with nothing\n`
      + `saying so. Add them to SCENES.${id}.ramps in src/scene.js.`);

    const spare = [...declared]
      .filter((r) => !need.has(r) && !(SPARE_OK[id] || []).includes(r));
    assert.deepEqual(spare, [],
      `scene '${id}' under the ${rig} declares ramps nothing draws with it: `
      + `${spare.join(', ')}.\n`
      + `Every entry costs one of the 64 the snap loop iterates AND competes to\n`
      + `be the nearest colour for pixels that resolve a different ramp, so an\n`
      + `unused one repaints the picture without drawing anything in it. Drop it\n`
      + `from SCENES.${id}.ramps, or add it to SPARE_OK with the reason.`);

    const unknown = ramps.filter((r) => !RAMP_ORDER.includes(r));
    assert.deepEqual(unknown, [],
      `scene '${id}' declares ramps that are not in RAMP_BASE: ${unknown.join(', ')}`);

    const fog = repaint(S.fog);
    const out = bakeOutPalette(0, ramps, fog);
    const n = out.n;
    assert.ok(n <= 64,
      `scene '${id}' under the ${rig} snaps against ${n} entries and POST_FS iterates 64.`);
    const key = (c) => c.map(Math.round).join(',');
    const colours = new Set(out.list.map(key));
    assert.ok(colours.has(key(fog)),
      `scene '${id}' blends toward ${key(fog)} but its snap list cannot reach that haze.`);
    if (id !== 'frostwood') {
      assert.ok(!colours.has(key(FOG)),
        `scene '${id}' includes the boreal haze ${key(FOG)} in its snap list.`);
    }

    rows.push(`  ${id.padEnd(10)} ${rig.padEnd(10)} ${String(n).padStart(2)}/64 entries`
      + `  ${ramps.length} ramps`);
  }
  console.log('  THE PER-SCENE SNAP BUDGET — all fifteen ramps together are '
    + `${bakeOutPalette(0).n}`);
  console.log(rows.join('\n'));
});

test('the palette snap can reach every colour in the palette', () => {
  const SNAP = 64;
  for(const [id,S] of Object.entries(SCENES)){
    const n=bakeOutPalette(0,S.ramps,repaint(S.fog)).n;
    assert.ok(n<=SNAP,
      `${id} holds ${n} output colours and POST_FS iterates ${SNAP}. The global\n`
      + `${PALETTE.length}-colour material vocabulary is not a frame snap list;\n`
      + `only the resident scene's declared ramps may reach this shader.`);
  }

  const baseKeys = Object.keys(RAMP_BASE);
  assert.deepEqual(RAMP_ORDER, baseKeys,
    `RAMP_ORDER and RAMP_BASE disagree.\n`
    + `RAMP_ORDER: ${RAMP_ORDER.join(', ')}\n`
    + `RAMP_BASE : ${baseKeys.join(', ')}\n`
    + `A ramp in one and not the other gets a palette entry with no id, or an id\n`
    + `with no colour, and nothing says which. RAMP_ORDER is Object.keys of\n`
    + `RAMP_BASE so this cannot drift by hand — if it fails, one of them stopped\n`
    + `being the other.`);

  const deep = Math.max(...RAMP_ORDER.map((k) => RAMP[k].length));
  assert.ok(deep <= MAX_RUNGS,
    `the deepest ramp has ${deep} rungs and MAX_RUNGS is ${MAX_RUNGS}, which is the\n`
    + `width of the palette texture. The extra rungs are baked past the edge and\n`
    + `sample as the last one.`);

  console.log(`  THE PALETTE  ${PALETTE.length} of ${SNAP} snap slots`
    + `  (headroom ${SNAP - PALETTE.length})`);
  console.log(`  ${RAMP_ORDER.length} ramps, deepest ${deep} of ${MAX_RUNGS} rungs`);
  console.log(`  ${RAMP_ORDER.map((k) => `${k}:${RAMP[k].length}`).join('  ')}`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   7. Derived ramps are evenly spaced
   docs/CANON.md and sunlight.js. Even Oklab spacing is asserted for derived
   ramps; authored ramps are reported. Tolerance is spread about each ramp's
   own mean step, so dark and light ladders are judged on regularity.

   Gamut mapping may reduce chroma but leaves L unchanged, so an uneven step
   means the derivation bent its lightness ladder.
   ═══════════════════════════════════════════════════════════════════════════ */
test('every derived ramp has provably even perceptual steps', () => {
  const TOL = 0.08;               // 8% spread of step size about its own mean
  const rows = [];
  let worst = 0, worstAt = '';

  for (const name of RAMP_ORDER) {
    const r = RAMP[name].map((c) => c.map(Math.round));
    if (r.length < 3) continue;
    const steps = [];
    for (let i = 1; i < r.length; i++) steps.push(dEok(r[i - 1], r[i]));
    const mean = steps.reduce((a, b) => a + b) / steps.length;
    const spread = (Math.max(...steps) - Math.min(...steps)) / (2 * mean);
    const gen = DERIVED.has(name);
    if (gen && spread > worst) { worst = spread; worstAt = name; }
    rows.push(`  ${gen ? 'derived ' : 'authored'} ${name.padEnd(7)}`
      + ` step ${mean.toFixed(3)}  spread ${pct(spread).padStart(7)}`
      + `  ${steps.map((s) => s.toFixed(3)).join(' ')}`);
  }

  assert.ok(worst <= TOL,
    `a derived ramp is not evenly spaced: ${worstAt} varies by ${pct(worst)} about\n`
    + `its own mean step, tolerance ${pct(TOL)}. src/sunlight.js lays the rungs at\n`
    + `equal intervals of Oklab L between two ends the physics chose, so this can\n`
    + `only fail if something bent the ladder — and the usual reason to bend it is\n`
    + `to keep chroma in gamut, which oklabToBytes must not do. It pulls chroma in\n`
    + `and leaves L alone precisely so this assertion stays true.\n\n`
    + rows.join('\n'));

  console.log('  PERCEPTUAL SPACING — dE_ok between adjacent rungs');
  console.log(rows.join('\n'));
  console.log('  the authored rows are not asserted and are not expected to pass;');
  console.log('  they are here so the difference between a picked ramp and a');
  console.log('  derived one is a number rather than an opinion.');
});

/* ═══════════════════════════════════════════════════════════════════════════
   8. No two ramps share a colour where form is carried
   Livingstone & Hubel, Science 240:740-749, 1988: shape-from-shading fails at
   equiluminance. Measured: a birch at luminance 129 vanishes against a
   snowfield at 140.

   Scope: asserted above Oklab L 0.45, where the picture carries form. Every
   ramp converges toward black, so collisions below are printed. Threshold is
   half the median rung step.

   Derived ramps only. The authored ones hold eight near-duplicates between
   L 0.35 and 0.45, including water against ice at dE_ok 0.014.
   docs/CANON.md governs.
   ═══════════════════════════════════════════════════════════════════════════ */
test('no two ramps land on one colour where the picture carries form', () => {
  /* Tolerance is half the median rung step, derived from the ramps. A fixed
     0.030 passes `bloom` at 0.041 from `sward`, and 69% of the meadow's ground
     renders as bloom's darkest rung: the aerial-perspective blend plus the
     palette snap needs to move a pixel by less than the gap. */
  const FLOOR = 0.45;
  const allSteps = [];
  /* A lamp world's ramps are three-anchor ladders (shadow, rest, lamp) and
     emitted spans, twice a sunlit rung apart. They are held to the tolerance
     and kept out of the population that sets it: counted, they lift it past
     pairs it was measured against (loam/masonry 0.049). */
  const LAMP_RAMPS = new Set(Object.keys(hollowRamps()));
  for (const k of RAMP_ORDER) {
    if (LAMP_RAMPS.has(k)) continue;
    const r = RAMP[k].map((c) => c.map(Math.round));
    for (let i = 1; i < r.length; i++) allSteps.push(dEok(r[i - 1], r[i]));
  }
  allSteps.sort((a, b) => a - b);
  const TOL = allSteps[allSteps.length >> 1] * 0.5;
  const hx = hex;
  const all = [], below = [];

  for (let i = 0; i < RAMP_ORDER.length; i++) {
    for (let j = i + 1; j < RAMP_ORDER.length; j++) {
      const ki = RAMP_ORDER[i], kj = RAMP_ORDER[j];
      /* FAMILY shares rungs by design. */
      if (sameFamily(ki, kj)) continue;
      /* A snap collision needs one scene with both ramps in its output
         texture. The frame snap vocabulary is scene-local. */
      if(!Object.values(SCENES).some(S=>S.ramps.includes(ki)&&S.ramps.includes(kj))) continue;
      for (const a of RAMP[ki]) for (const b of RAMP[kj]) {
        const A = a.map(Math.round), B = b.map(Math.round);
        const d = dEok(A, B);
        if (d >= TOL) continue;
        const lit = bytesToOklab(A)[0] >= FLOOR && bytesToOklab(B)[0] >= FLOOR;
        const rec = { ki, kj, A, B, d, gen: DERIVED.has(ki) || DERIVED.has(kj) };
        (lit ? all : below).push(rec);
      }
    }
  }
  /* Derived against derived is asserted: one derivation controls both sides.

     Derived against authored is reported. At the derived tolerance the
     authored ramps collide with each other four times (snow/birch, snow/trunk,
     birch/ice, warm/timber), so the pale warm band is already occupied.

     Authored against authored is reported as existing palette debt. */
  const mine = all.filter((r) => DERIVED.has(r.ki) && DERIVED.has(r.kj));
  const mixed = all.filter((r) => r.gen && !(DERIVED.has(r.ki) && DERIVED.has(r.kj)));
  const theirs = all.filter((r) => !r.gen);
  const fmt = (r) => `  ${r.ki} ${hx(r.A)} vs ${r.kj} ${hx(r.B)}  dE_ok ${r.d.toFixed(3)}`;

  assert.equal(mine.length, 0,
    `two DERIVED ramps land on the same colour above L ${FLOOR}:\n`
    + mine.map(fmt).join('\n')
    + `\n\nTwo materials on one colour cannot separate by value, and value is what\n`
    + `carries form. Do NOT nudge the output — reconsider the ALBEDO, which is\n`
    + `what happened to \`loam\`: it began as a dark tilled earth, collided with\n`
    + `\`timber\`, and became the pale sandy loam a solarpunk path actually is.\n`
    + `The collision chose the better surface.`);

  console.log(`  tolerance ${TOL.toFixed(3)} = half the median rung step`
    + ` (${(TOL * 2).toFixed(3)}), DERIVED from the ramps`);
  console.log(`  COLLISIONS above L ${FLOOR} (where form is carried): ${all.length}`);
  console.log(`    derived vs derived  ${mine.length}   <- asserted`);
  console.log(`    derived vs authored ${mixed.length}   <- reported; see the note above`);
  console.log(`    authored vs authored ${theirs.length}   <- predates this sprint`);
  all.forEach((r) => console.log(fmt(r)));
  console.log(`  and below it, where every material converges to black: ${below.length}`);
  console.log(`  of which involve a derived ramp: ${below.filter((r) => r.gen).length}`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   9. Each world has its own sun, and the two tables agree
   Cooper, Solar Energy 12(3):333-346, 1969 for the declination; Duffie &
   Beckman ch.1 for the altitude relation. Encoded at sunAt() in src/sunlight.js.

   Latitude is duplicated in BIOMES and SUN because ramp generation runs before
   worldgen. Assert the copies agree. Altitude and air mass are recomputed
   here, so both rows cannot drift together.
   ═══════════════════════════════════════════════════════════════════════════ */
test('each world derives its sun from its own latitude, and the two tables agree', () => {
  const rows = [];
  for (const id of Object.keys(SCENES)) {
    const b = SCENES[id].biome, B = BIOMES[b], s = SUN[b];
    if (B.sunless) {
      /* No sun reaches it: it states no latitude, and its light is a lamp
         with a stated direction that the scene row reads. */
      assert.equal(B.lat, undefined, `sunless '${b}' states a latitude`);
      assert.ok(s && s.lamp && s.dir, `sunless '${b}' has no lamp row in SUN`);
      assert.equal(SCENES[id].light, s.dir, `scene '${id}' is lit by a second copy of its lamp's direction`);
      rows.push(`  ${id.padEnd(10)} lamp '${s.lamp}', az ${s.dir.az} el ${s.dir.el}`);
      continue;
    }
    assert.ok(s,
      `BIOMES.${b} exists and SUN.${b} does not, so the world states a latitude\n`
      + `that nothing turns into light. Every biome needs a row in SUN — see\n`
      + `sunAt() in src/sunlight.js.`);
    assert.equal(B.lat, s.lat,
      `the latitude of '${b}' is written twice and the two copies disagree:\n`
      + `  BIOMES.${b}.lat        ${B.lat}\n`
      + `  SUN.${b}.lat           ${s.lat}\n`
      + `The ramps are derived from the second and the world is built by the\n`
      + `first, so a drift here means the meadow's colours are lit by a sun that\n`
      + `is not over the meadow — and nothing else would say so. The duplication\n`
      + `is deliberate (the generator needs a latitude before worldgen exists);\n`
      + `it is checked rather than removed.`);

    const alt = 90 - Math.abs(B.lat - 23.45);
    assert.ok(Math.abs(s.altDeg - alt) < 1e-9,
      `at latitude ${B.lat} the midsummer noon altitude is 90 - |lat - 23.45| =\n`
      + `${alt.toFixed(2)} degrees and sunAt returned ${s.altDeg.toFixed(2)}.`);
    const m = 1 / Math.sin(alt * Math.PI / 180);
    assert.ok(Math.abs(s.airmass - m) < 1e-9,
      `air mass is 1/sin(altitude) = ${m.toFixed(4)} and sunAt returned ${s.airmass.toFixed(4)}.`);
    /* Plane-parallel air mass holds to about 2% above 15 degrees. Below that
       the model needs Kasten–Young. */
    assert.ok(alt > 15,
      `'${b}' puts the sun at ${alt.toFixed(2)} degrees and the plane-parallel\n`
      + `air mass 1/sin(alt) is only good above about 15. Below that this model\n`
      + `needs Kasten & Young (1989) instead, and nothing here would notice.`);

    rows.push(`  ${id.padEnd(10)} ${b.padEnd(7)} lat ${String(B.lat).padStart(2)} N`
      + `  altitude ${s.altDeg.toFixed(2)}deg  air mass ${s.airmass.toFixed(3)}`
      + `  ground x${s.ground.toFixed(3)}  diffuse ${s.diffuse.toFixed(3)}`
      + `  beam [${s.beam.map((v) => v.toFixed(3)).join(' ')}]`);
  }

  /* Diffuse fraction derives from Rayleigh depths. Checked against independent
     solar-engineering figures. */
  for (const [lat, want] of [[62, 0.15], [38, 0.12]]) {
    const d = sunAt(lat).diffuse;
    assert.ok(Math.abs(d - want) < 0.01,
      `the derived clear-sky diffuse fraction at ${lat} N is ${d.toFixed(3)} and the\n`
      + `solar-engineering figure is about ${want}. They agreed to 0.004 when this\n`
      + `was written, which is the only reason the derivation is allowed to\n`
      + `replace the tabulated constant. If they have drifted apart, either TAU\n`
      + `moved or the mean is being taken over something else.`);
  }

  console.log('  THE TWO SUNS — one number per world, and everything below it derived');
  console.log(rows.join('\n'));
  console.log(`  diffuse fraction is the mean of 1-exp(-tau*m), NOT a table entry:`);
  console.log(`    62 N ${sunAt(62).diffuse.toFixed(3)} against the tabulated 0.15`);
  console.log(`    38 N ${sunAt(38).diffuse.toFixed(3)} against the tabulated 0.12`);
  console.log(`  the meadow's flat ground gets ${(SUN.meadow.ground / SUN.boreal.ground).toFixed(3)}x the boreal world's`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   10. Leaf transmittance
   Dickinson 1983; Sellers 1985; Kubelka & Munk 1931 for the same algebra.

   Assert green-dominant transmittance, then the crown-level consequence.
   Reflectance alone gives neutral crown interiors.

   Single-scattering albedo omega = rho + tau stays below one in every band.
   Otherwise the two-stream similarity term sqrt(1-omega) is imaginary: NaN,
   then a black generated ramp.
   ═══════════════════════════════════════════════════════════════════════════ */
test('leaf transmittance is present, green-dominant, and conserves energy', () => {
  const rows = [];
  for (const name of Object.keys(LEAF_T)) {
    const t = LEAF_T[name], w = omega(name);
    assert.ok(t[1] > t[0] && t[1] > t[2],
      `LEAF_T.${name} is [${t.join(', ')}] and its GREEN band is not the largest.\n`
      + `A leaf transmits green and absorbs red and blue — that is the chlorophyll\n`
      + `signature and it is the entire reason the inside of a crown is a green\n`
      + `place rather than a dark one. If this fails the bands are in the wrong\n`
      + `order somewhere, and the symptom will be a grey canopy, not an error.`);
    for (let i = 0; i < 3; i++) assert.ok(w[i] < 1,
      `omega('${name}') band ${i} is ${w[i].toFixed(3)}, and reflectance plus\n`
      + `transmittance cannot exceed 1 — a leaf that scatters more than it\n`
      + `receives is a light source. sqrt(1-omega) is the two-stream similarity\n`
      + `transform and it goes imaginary here, which would come out as NaN in the\n`
      + `canopy transmittance and as a black ramp on screen.`);
    rows.push(`  ${name.padEnd(8)} rho [${ALBEDO_OF(name).map((v) => v.toFixed(3)).join(' ')}]`
      + `  tau [${t.map((v) => v.toFixed(3)).join(' ')}]`
      + `  omega [${w.map((v) => v.toFixed(3)).join(' ')}]`
      + `  sqrt(1-w) [${w.map((v) => Math.sqrt(1 - v).toFixed(3)).join(' ')}]`);
  }
  /* Crown consequence: two-stream attenuation still favours green. */
  const T = omega('foliage').map((w) => Math.exp(-CANOPY.crown.k * CANOPY.crown.lai * Math.sqrt(1 - w)));
  assert.ok(T[1] > T[0] && T[1] > T[2],
    `a crown transmits [${T.map((v) => v.toFixed(3)).join(', ')}] and green is not the\n`
    + `largest, so the light inside it is not green and the deepest shadow in the\n`
    + `biome will read as mud. The similarity transform exp(-k*LAI*sqrt(1-omega))\n`
    + `is what carries this; if omega is flat the transmittance is flat too.`);

  console.log('  LEAF OPTICS — reflectance, transmittance, and what they make');
  console.log(rows.join('\n'));
  console.log(`  a crown at k*LAI ${(CANOPY.crown.k * CANOPY.crown.lai).toFixed(2)} transmits`
    + ` [${T.map((v) => v.toFixed(3)).join(' ')}] — green:red ${(T[1] / T[0]).toFixed(2)}x`);
  console.log('  measured under-canopy spectra run 2-3x, so this is the LOW end of');
  console.log('  the plausible range: the similarity form assumes isotropic');
  console.log('  scattering. Recorded in src/sunlight.js rather than tuned away.');
});
function ALBEDO_OF(name) {
  /* Reflectance recovered as omega - tau, so no second table is imported. */
  const w = omega(name), t = LEAF_T[name];
  return w.map((v, i) => v - t[i]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. Canopy and grass clear each other
   CANON: share rungs exactly, or clear each other. Shared middle greens give
   every foliage deposit and moss patch the meadow floor's colour. Each ramp
   is its own four-rung derivation (foliage vs sward albedo) and stays apart
   above the form-carrying floor, the clearance test 8 demands.
   ═══════════════════════════════════════════════════════════════════════════ */
test('canopy and grass clear each other on the meadow floor', () => {
  const can = RAMP.canopy.map((c) => c.map(Math.round));
  const gra = RAMP.grass.map((c) => c.map(Math.round));
  assert.equal(can.length, 4,
    `canopy has ${can.length} rungs; posterise exposes four levels.`);
  assert.equal(gra.length, 4,
    `grass has ${gra.length} rungs; posterise exposes four levels.`);

  const allSteps = [];
  for (const r of [can, gra]) for (let i = 1; i < r.length; i++) allSteps.push(dEok(r[i - 1], r[i]));
  allSteps.sort((a, b) => a - b);
  const TOL = allSteps[allSteps.length >> 1] * 0.5;
  const FLOOR = 0.45;
  const hits = [];
  for (const a of can) for (const b of gra) {
    const d = dEok(a, b);
    if (d < TOL && bytesToOklab(a)[0] >= FLOOR && bytesToOklab(b)[0] >= FLOOR)
      hits.push(`  canopy ${hex(a)} vs grass ${hex(b)}  dE_ok ${d.toFixed(3)}`);
  }
  assert.equal(hits.length, 0,
    `canopy and grass still collide above L ${FLOOR} (tolerance ${TOL.toFixed(3)}):\n`
    + `${hits.join('\n')}\n\n`
    + `They must CLEAR each other so plant deposits and moss cannot snap onto\n`
    + `the meadow floor. Near-overlap was measured at 72.6% of an open frame.`);

  const L = (c) => bytesToOklab(c)[0];
  console.log('  CANOPY vs GRASS — cleared foliage / floor families');
  console.log(`  canopy ${can.map((c) => `${hex(c)}(${Math.round(lum709(c))})`).join(' ')}`);
  console.log(`  grass  ${gra.map((c) => `${hex(c)}(${Math.round(lum709(c))})`).join(' ')}`);
  console.log(`  canopy L ${L(can[0]).toFixed(3)} -> ${L(can[3]).toFixed(3)}`
    + `   grass L ${L(gra[0]).toFixed(3)} -> ${L(gra[3]).toFixed(3)}`);
  console.log(`  clearance floor L ${FLOOR}, tolerance ${TOL.toFixed(3)}`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   12. Shallow water is brighter than deep water
   Pope & Fry, Applied Optics 36(33):8710, 1997. Four checks in one direction
   isolate an inverted pond to coefficients, depth mapping, ramp indexing, or
   palette order.
   ═══════════════════════════════════════════════════════════════════════════ */
test('the pond reads shallow-to-deep in the right direction', () => {
  const sun = SUN.meadow;
  const lum = (v) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];

  /* Law: pure water absorbs red more strongly than green, then blue. */
  assert.ok(A_WATER[0] > A_WATER[1] && A_WATER[1] > A_WATER[2],
    `pure-water absorption is [${A_WATER.join(', ')}] /m and it is not monotone from\n`
    + `red down to blue. Every colour a body of water has comes from that ordering.`);

  /* Radiance consequence: a longer two-way path is darker. */
  const shallow = pondRadiance(0, sun), deep = pondRadiance(POND_MAX_M, sun);
  assert.ok(lum(shallow) > lum(deep),
    `the water at the surface is radiance ${lum(shallow).toFixed(4)} and at ${POND_MAX_M} m it is\n`
    + `${lum(deep).toFixed(4)}, so the pond gets BRIGHTER with depth. Beer-Lambert cannot do\n`
    + `that; something has inverted the exponent or the bed albedo is darker than\n`
    + `the water column's own return.`);

  /* Geometry consequence: the chunk baker's t falls monotonically with depth. */
  const dls = [0, 1, 3, 6, 12, 22, 40, 56, 90];
  const ts = dls.map((d) => pondT(d));
  for (let i = 1; i < ts.length; i++) assert.ok(ts[i] <= ts[i - 1] + 1e-9,
    `pondT is not monotone: at ${dls[i - 1]} px from shore it is ${ts[i - 1].toFixed(3)} and at\n`
    + `${dls[i]} px it is ${ts[i].toFixed(3)}. The ramp is ordered dark-to-light, so t must\n`
    + `FALL as the water deepens. A rise here is the inverted shelf coming back.`);
  assert.ok(ts[0] > ts[ts.length - 1] + 0.5,
    `pondT runs ${ts[0].toFixed(3)} at the waterline to ${ts[ts.length - 1].toFixed(3)} in the deepest water,\n`
    + `a span of ${(ts[0] - ts[ts.length - 1]).toFixed(3)}. Under half the ramp and the pond is one flat colour:\n`
    + `depth is being computed but is not reaching the rungs.`);

  /* Rendered consequence: rampStep sends the waterline to the light end. */
  const pond = RAMP.pond;
  const rungAt = (dl) => Math.round(pondT(dl) * (pond.length - 1));
  assert.equal(rungAt(0), pond.length - 1,
    `at the waterline pondT is ${pondT(0).toFixed(3)}, which rampStep sends to rung ${rungAt(0)} of\n`
    + `${pond.length - 1}. The shallows must land on the ramp's LIGHT end. If they do not, the\n`
    + `pond is drawn inside out and it will look like a hole.`);
  assert.ok(lum709(pond[pond.length - 1]) > lum709(pond[0]),
    `the pond ramp's top rung ${hex(pond[pond.length - 1])} is not brighter than its bottom\n`
    + `${hex(pond[0])}. Every ramp in this palette is ordered dark to light and\n`
    + `rampStep indexes them that way.`);

  const rows = dls.map((d) => `  ${String(d).padStart(3)} px from shore`
    + `  depth ${pondDepth(d).toFixed(2)} m`
    + `  two-way T [${A_WATER.map((a) => Math.exp(-a * WATER_PATH * pondDepth(d)).toFixed(3)).join(' ')}]`
    + `  t ${pondT(d).toFixed(3)}  rung ${rungAt(d)}  ${hex(pond[rungAt(d)])}`);
  console.log('  THE POND — Beer-Lambert in water, at the depths the world can measure');
  console.log(rows.join('\n'));
  console.log(`  ramp ${pond.map((c) => `${hex(c)}(${Math.round(lum709(c))})`).join(' ')}`);
  console.log(`  path length ${WATER_PATH.toFixed(3)}x depth and Fresnel ${FRESNEL.toFixed(4)},`);
  console.log(`  both from PROJECTION.md's k = 1/2: the depth axis is halved, so the`);
  console.log(`  camera is 30 degrees above the ground and 60 off the water's normal.`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   13. Foliage and sward ramps keep their optical endpoints
   Each derived window is a ladder between the two optical states of one
   surface (vegStates). The live ramp equals that ladder, so drift in albedo
   or placement terms fails here.
   ═══════════════════════════════════════════════════════════════════════════ */
test('foliage and sward ramps keep their optical endpoints', () => {
  const v = vegStates(SUN.meadow, SIGMA_MEADOW);
  const canFrom = ladder(v.crown, v.leaf, 4, SIGMA_MEADOW, SUN.meadow)
    .map((c) => c.map(Math.round));
  const graFrom = ladder(v.shade, v.blade, 4, SIGMA_MEADOW, SUN.meadow)
    .map((c) => c.map(Math.round));
  const can = RAMP.canopy.map((c) => c.map(Math.round));
  const gra = RAMP.grass.map((c) => c.map(Math.round));

  assert.deepEqual(can, canFrom,
    'canopy no longer matches the foliage optical ladder from vegStates');
  assert.deepEqual(gra, graFrom,
    'grass no longer matches the sward optical ladder from vegStates');

  console.log('  FOLIAGE / SWARD ENDPOINTS — live ramps match their surfaces');
  console.log(`  canopy ${can.map((c) => `${hex(c)}(${Math.round(lum709(c))})`).join(' ')}`);
  console.log(`  grass  ${gra.map((c) => `${hex(c)}(${Math.round(lum709(c))})`).join(' ')}`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   14. Summer crowns carry their causal record

   Finished geometry retains the quantities that produced it:

     terminal pipe area  -> lobe area          (Shinozaki et al., 1964)
     k × LAI             -> crown attenuation  (Monsi & Saeki, 1953)
     drawn crown depth   -> local volume weight

   Broadleaf recursion terminates at the drawable-stem floor. The 38 °N date
   palm's five silhouette fronds are recovered from crown forks.

   The zero-child axis probes apical completion, distinct from recursion
   rejected at the drawable floor. Both contribute terminal pipe area.
   ═══════════════════════════════════════════════════════════════════════════ */
test('summer crowns retain the pipe, canopy, and latitude terms that made them', () => {
  const axis=newSprite(32,32); axis.tips=[];
  grow(axis,16,27,-Math.PI/2,9,2,0,{
    maxDepth:6,bud:true,twigDepth:9,taper:0.62,flare:0,flareLen:0.1,
    curl:0,upBias:0,wobble:0,trunkKids:0,kidsMin:0,kidsMax:0,
    clearBole:0,alpha:2,bA:{m:0,s:0,lo:0,hi:0},lenMin:0,lenMax:0,
  },new RNG(1),2);
  assert.equal(axis.tips.length,1,
    `a normally completed axis with zero children produced ${axis.tips.length} terminals;\n`
    + `its apical bud must enter the crown pipe sum even though no recursive call was rejected.`);
  assert.ok(Math.abs(axis.tips[0][2]-1)<1e-12,
    `the zero-child axis retained radius ${axis.tips[0][2]}, expected its unfloored 1 px pipe radius.`);

  assert.equal(SPECIES.meadowTree.model, 'rauh',
    `the summer broadleaf is dispatched through "${SPECIES.meadowTree.model}" instead of Rauh's model.`);
  assert.equal(SPECIES.meadowTree.cfg.bud, true,
    `the summer broadleaf does not stop at the drawable-stem floor. Without cfg.bud,\n`
    + `all recursion orders terminate together and the pipe model receives first limbs\n`
    + `and terminal twigs as if they were the same kind of shoot.`);
  assert.deepEqual([...new Set(TIERS.meadowTree)], [4, 5],
    `the open-grown broadleaf uses tiers ${TIERS.meadowTree.join('/')}; an open world's\n`
    + `landmark trees should place at 60/84 px, not inherit the closed forest's ceiling.`);

  assert.equal(SPECIES_H.palm, 0.250,
    `the palm height ratio is ${SPECIES_H.palm}; 38 °N selects a 15 m Phoenix canariensis,\n`
    + `so its ratio against an 18 m birch is 0.300 × 15/18 = 0.250.`);
  assert.deepEqual([...new Set(TIERS.palm)], [4, 5],
    `the date palm uses tiers ${TIERS.palm.join('/')}; the species change must not shrink\n`
    + `the existing 53-75 px landmark into a 40-56 px shrub.`);
  assert.ok(SPECIES.palm.cfg.dates >= 3,
    `Phoenix canariensis carries ${SPECIES.palm.cfg.dates || 0} fruit stalks; a female crown\n`
    + `normally carries three to six and the date palm should state its dates.`);
  assert.equal(SPECIES.palm.dMin, 0,
    `the palm's canopy window starts at ${SPECIES.palm.dMin}; the deposit shader's 0.14\n`
    + `floor makes canopy rung 0 unreachable unless the window starts at zero.`);

  const kLAI = CANOPY.crown.k * CANOPY.crown.lai;
  const rows = [];
  for (const kind of ['meadowTree', 'palm']) {
    for (const { ti, h, sp } of treesOf(kind)) {
      assert.ok(sp.crownD > 0,
        `${kind} tier ${ti} has no crownD after trimSprite. The volume weight was derived\n`
        + `from a drawn depth that the finished sprite then discarded.`);
      const expectedVol = 1 - Math.exp(-kLAI * THICK_PX / sp.crownD);
      assert.ok(Math.abs(sp.vol - expectedVol) < 1e-12,
        `${kind} tier ${ti} carries volume ${sp.vol}, expected ${expectedVol} from\n`
        + `1-exp(-k*LAI*${THICK_PX}/crownD), with crownD=${sp.crownD}.`);

      if (kind === 'meadowTree') {
        const free = (sp.lobes || []).filter((l) => !l[2]);
        assert.ok(free.length > 0,
          `${kind} tier ${ti} has no lobe above the ${1.6} px legibility floor, so the\n`
          + `pipe model cannot be recovered from any unconstrained crown member.`);
        const ratios = free.map(([R, pipe]) => R / pipe);
        const spread = Math.max(...ratios) - Math.min(...ratios);
        assert.ok(spread < 1e-9,
          `${kind} tier ${ti} does not preserve R_lobe ∝ r_pipe: R/r spans\n`
          + `${Math.min(...ratios).toFixed(6)}-${Math.max(...ratios).toFixed(6)}.`);
        rows.push(`  ${kind.padEnd(10)} tier ${ti} h ${String(h).padStart(3)}`
          + `  lobes ${String(sp.lobes.length).padStart(3)}  depth ${String(sp.crownD).padStart(2)}`
          + `  volume ${sp.vol.toFixed(3)}  pipe spread ${spread.toExponential(1)}`);
      } else {
        /* Corner palms recover pipe area from frond forks, not lobe fill. */
        assert.equal(sp.lobes.length, 0,
          `palm tier ${ti} still carries ${sp.lobes.length} crownMass lobes; the\n`
          + `frond strokes are the silhouette and a lobe fill erases them.`);
        assert.equal(sp.forks.length, 5,
          `Phoenix tier ${ti} draws ${sp.forks.length} silhouette fronds; five is the\n`
          + `Fibonacci floor selected by the dense-crown separation rule.`);
        const deposit = sp.occ.reduce((n, m) => n + (m === 2 ? 1 : 0), 0);
        assert.ok(deposit >= 20,
          `palm tier ${ti} has only ${deposit} frond/deposit pixels; the pinnae\n`
          + `did not draw.`);
        rows.push(`  ${kind.padEnd(10)} tier ${ti} h ${String(h).padStart(3)}`
          + `  fronds ${String(sp.forks.length).padStart(2)}  depth ${String(sp.crownD).padStart(2)}`
          + `  volume ${sp.vol.toFixed(3)}  deposit ${deposit}`);
      }
    }
  }
  console.log('  SUMMER CROWNS — recoverable causes on every baked tier');
  console.log(rows.join('\n'));
});

test('the frostwood arrival stands on the trail with no house drawn over it',()=>{
  /* Authority: `arrivalPoint` in src/world/siting.js.

     Measured: an arrival on the village axis three metres north of the
     northernmost house puts a cabin roof over the traveller on six of these
     eight seeds. A cabin's anchor is its wall base and its picture rises from
     there, so clearing the footprint does not clear the gable. Cabin siting
     rejects any site within PATHW of the trail plus the cabin's half width, so
     the trail stays clear.

     A world row is a screen row for drawing (scene.js sets camYf to
     py - H*0.56), so a cabin covers the rows from its ridge down to its
     anchor. */
  const rows=[];
  for(const seed of [20260727,5,77,123,20260803,999,31337,42]){
    const gen=makeWorldGen(seed,{biome:'boreal'});
    const a=gen.arrivalPoint();
    const common=gen.POI.find((p)=>p.kind==='village');
    const cabins=gen.BUILDINGS.filter((b)=>b.kind==='cabin');
    const north=Math.min(...cabins.map((b)=>b.y));

    assert.equal(a.x,Math.round(gen.pathX(a.y)),
      `seed ${seed} arrived ${a.x-Math.round(gen.pathX(a.y))} px off its own trail`);
    assert.ok(a.y<north,
      `seed ${seed} arrived at y ${a.y}, level with or below the house at ${north.toFixed(0)}`);

    const over=cabins.filter((b)=>{
      const v=gen.buildingDoor(b).v;
      return b.y>a.y&&Math.abs(a.x-b.x)<cabinFootprint(v).hx+5&&a.y>b.y-CABIN_H[v];
    });
    assert.equal(over.length,0,
      `seed ${seed} arrives behind ${over.map((b)=>`the cabin at ${b.x.toFixed(0)},${b.y.toFixed(0)}`).join(' and ')}`);

    assert.ok(gen.traversalAt(a.x,a.y).walk,
      `seed ${seed} arrives on ${gen.traversalAt(a.x,a.y).medium}`);
    assert.ok(!gen.beyondRim(a.x,a.y),`seed ${seed} arrives outside the rim`);
    /* Within the common's radius, so the village is in view. */
    assert.ok(common.y-a.y<=common.r,
      `seed ${seed} arrives ${common.y-a.y} rows out, past the common's own ${common.r}`);

    const ahead=gen.compileLifePlans().residents
      .filter((r)=>r.position.y>a.y&&r.position.y<a.y+300
        &&Math.abs(r.position.x-a.x)<230).length;
    assert.ok(ahead>=5,`seed ${seed} shows only ${ahead} residents ahead of the arrival`);
    rows.push(`  seed ${String(seed).padEnd(9)} arrive ${a.x},${a.y}`
      +`  north house ${north.toFixed(0).padStart(5)}`
      +`  ${common.y-a.y} rows to the common  ${ahead} residents ahead`);
  }
  console.log('  FROSTWOOD ARRIVAL');
  console.log(rows.join('\n'));

  /* Meadow and swamp arrive at the origin. biome.js puts their commons 500 to
     600 px down-trail. */
  for(const biome of ['meadow','swamp']){
    const gen=makeWorldGen(SEED,{biome});
    const a=gen.arrivalPoint();
    assert.equal(a.y,0,`${biome} moved its arrival off the origin`);
    assert.equal(a.x,Math.round(gen.pathX(0)),`${biome} left the trail`);
  }
});

test('dream-machine affordance is meadow-only and leaves usable habitat',()=>{
  const winter=makeWorldGen(SEED,{biome:'boreal'}),meadow=makeWorldGen(SEED,{biome:'meadow'});
  const rows=[];
  for(const name of Object.keys(MACHINE)){
    const F=ACTOR[name],profile=LIFE[name];
    assert.deepEqual(profile.biomes,['meadow']);
    assert.equal(meadow.compileLifePlans().individuals
      .filter((q)=>q.profileId===name).length,1);
    let valid=0,winterValid=0;
    for(let y=-1200;y<=1200;y+=80)for(let x=-1200;x<=1200;x+=80){
      valid+=meadow.entityAffordance(profile,x,y)?1:0;
      winterValid+=winter.entityAffordance(profile,x,y)?1:0;
    }
    assert.equal(winterValid,0,`${name} found ${winterValid} valid boreal sites`);
    assert.ok(valid>12,`${name} has only ${valid} valid sites in the sampled meadow`);
    rows.push(`  ${name.padEnd(9)} ${valid} / 961 meadow samples`);
  }
  console.log('  DREAM-MACHINE HABITAT');
  console.log(rows.join('\n'));
});

test('the meadow scene palette covers all machine materials',()=>{
  const scene=new Set(SCENES.meadow.ramps);
  for(const name of Object.keys(MACHINE)){
    const F=ACTOR[name];
    assert.ok(scene.has(F.ramp),`${name} base ramp ${F.ramp} is absent from meadow`);
    assert.ok(scene.has(F.ramp2),`${name} moss ramp ${F.ramp2} is absent from meadow`);
  }
  assert.ok(scene.has('accent'),'the traveller accent is absent from meadow');
  assert.ok(scene.has('machineSignal'),'the machine eye and flower signal ramp is absent from meadow');
  assert.ok(bakeOutPalette(0,SCENES.meadow.ramps,repaint(SCENES.meadow.fog)).n<=64,
    'machine materials grew the meadow output vocabulary past 64');
});

/* ══════════════════════════════════════════════════════════════════════════
   The meadow reads as a meadow

   Grouped because they interact: rounder water moves shore distance, which
   moves habitat, which moves tree counts, and a keep-out removes sites on top.
   Bounds are measured; the failing values are in the messages.
   ══════════════════════════════════════════════════════════════════════════ */

const MEADOW_OPT={biome:'meadow',density:0.95,snow:0.5,lake:0.55};
const meadowGen=(seed)=>makeWorldGen(seed,MEADOW_OPT);
const SEEDS3=[SEED,7,999666333];

/* 4-connected components of the analytic water field over one window, on a
   stated lattice. Shapes are compared in projected space (y doubled): under
   k = 1/2 a round pond draws twice as wide as it is deep. */
function waterBodies(g,{ox=-1100,oy=-100,w=2200,h=2200,step=4,isWet}={}){
  const test=isWet||((x,y)=>g.isWater(x,y));
  const n=Math.floor(w/step), m=Math.floor(h/step);
  const wm=new Uint8Array(n*m);
  for(let j=0;j<m;j++)for(let i=0;i<n;i++)
    wm[j*n+i]=test(ox+i*step,oy+j*step)?1:0;
  const lab=new Int32Array(n*m).fill(-1), out=[];
  let wet=0;
  for(let p=0;p<n*m;p++){
    if(wm[p]) wet++;
    if(!wm[p]||lab[p]>=0) continue;
    const id=out.length, st=[p]; lab[p]=id;
    let a=0,per=0,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,clipped=false;
    while(st.length){
      const q=st.pop(), qx=q%n, qy=(q/n)|0;
      a++; x0=Math.min(x0,qx);x1=Math.max(x1,qx);y0=Math.min(y0,qy);y1=Math.max(y1,qy);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const rx=qx+dx, ry=qy+dy;
        /* A body touching the window is skipped: its shape statistics are the
           window's. A clipped bowl measures 216x44 and fails a 1.25 bound. */
        if(rx<0||ry<0||rx>=n||ry>=m){per++;clipped=true;continue;}
        const r=ry*n+rx;
        if(!wm[r]){per++;continue;}
        if(lab[r]<0){lab[r]=id;st.push(r);}
      }
    }
    if(clipped) continue;
    /* Projected area and perimeter: a lattice cell is step x step/2 on screen,
       a boundary edge step across and step/2 down. The mean edge length is
       exact for an isotropic outline. */
    const A=a*step*step*0.5, P=per*step*0.75;
    out.push({areaPx:a*step*step, A, P,
      /* Isoperimetric quotient, 1 for a circle. Hutchinson's shoreline
         development D_L = 1/sqrt(IQ): 1.0 a circle, 1.1-1.5 a lowland pond,
         3-8 a dendritic reservoir. */
      iq:4*Math.PI*A/(P*P),
      wPx:(x1-x0+1)*step, hPx:(y1-y0+1)*step});
  }
  return {bodies:out.sort((p,q)=>q.areaPx-p.areaPx), wetFrac:wet/(n*m)};
}

/* A 4-connected lattice perimeter overestimates a curve by the staircase
   factor. D_L of a rasterised circle on the same lattice calibrates that bias
   out of the bound below. */
function calibrateDL(step,rWorld){
  const n=Math.ceil(rWorld*2.4/step), m=n;
  const cx=n/2, cy=m/2;
  const wm=new Uint8Array(n*m);
  for(let j=0;j<m;j++)for(let i=0;i<n;i++){
    /* a ground circle: k = 1/2 halves the depth axis, so y counts double */
    const dx=(i-cx)*step, dy=(j-cy)*step/0.5;
    wm[j*n+i]=Math.hypot(dx,dy)<=rWorld?1:0;
  }
  let a=0,per=0;
  for(let j=0;j<m;j++)for(let i=0;i<n;i++){
    if(!wm[j*n+i]) continue;
    a++;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const rx=i+dx, ry=j+dy;
      if(rx<0||ry<0||rx>=n||ry>=m||!wm[ry*n+rx]) per++;
    }
  }
  const A=a*step*step*0.5, P=per*step*0.75;
  return 1/Math.sqrt(4*Math.PI*A/(P*P));
}

/* Two claims. The bowl is round. The trail's drying term, the village's raised
   ground and the rim carve it, and a pond with the road cut through is a
   crescent, so roundness is asserted on the bowl and the carve is asserted to
   only subtract. */
test('the meadow lake bowl is round, in projection',()=>{
  const CAL=calibrateDL(4,150);
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    const cut=g.TH/g.BASIN.amp;                    // the waterline, as a bowl contour
    const {bodies}=waterBodies(g,{isWet:(x,y)=>g.meadowBasins(x,y)>cut});
    const big=bodies.filter(b=>b.areaPx>=4000);
    assert.ok(big.length>=4,`seed ${seed} has only ${big.length} bowls in the window`);
    const dls=big.map(b=>1/Math.sqrt(b.iq)/CAL).sort((a,b)=>a-b);
    for(const b of big){
      const dl=1/Math.sqrt(b.iq)/CAL;
      /* A threshold on warped noise measures shoreline development 2.0-2.6 on
         this window, a dendritic reservoir. The bound also catches two bowls
         joined by a thin neck. */
      assert.ok(dl<=1.12,
        `seed ${seed}: a ${b.areaPx}px bowl is ${dl.toFixed(2)}x a circle's shoreline `
        +`development. Either the shore wobble has grown an arm or two bowls `
        +`have merged into a neck.`);
    }
    /* Aspect is asserted on the median: two touching bowls are one component
       with the union's box, and D_L above refuses thin necks. A lone bowl is
       a ground circle; k = 1/2 halves the depth axis, so it draws at 2.0. */
    const asp=big.map(b=>b.wPx/b.hPx).sort((a,b)=>a-b);
    const medAsp=asp[asp.length>>1];
    assert.ok(medAsp>=1.7&&medAsp<=2.3,
      `seed ${seed}: the median bowl's bounding box aspect is ${medAsp.toFixed(2)}. A `
      +`ground circle under k = 1/2 draws at 2.0, so the basin's ry is not `
      +`BASIN.aniso of its rx in the field the raster actually sees.`);
    rows.push(`  ${String(seed).padStart(9)}  bowls ${String(big.length).padStart(2)}  `
      +`D_L/circle med ${dls[dls.length>>1].toFixed(2)} max ${dls[dls.length-1].toFixed(2)}`
      +`  aspect med ${medAsp.toFixed(2)} [${asp[0].toFixed(2)}-${asp[asp.length-1].toFixed(2)}]`);
  }
  console.log(`  MEADOW BOWLS — Hutchinson D_L = 1/sqrt(4*pi*A/P^2), projected, over a `
    +`rasterised circle's ${CAL.toFixed(3)} on the same lattice`);
  console.log(rows.join('\n'));
});

test('the trail, the village and the rim only ever take water away',()=>{
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    /* Exception: the pond court's managed basin raises the field inside an
       earthwork (src/pond-court.js, hydrologyAt). Excluded by its POI radius
       so the bound still catches an accidental second water source. */
    const court=g.POI.find(p=>p.kind==='pondCourt');
    let worst=0;
    for(let y=-400;y<=1400;y+=23)for(let x=-900;x<=900;x+=23){
      if(court&&Math.hypot(x-court.x,y-court.y)<court.r*1.35) continue;
      worst=Math.max(worst,g.lakeAt(x,y)-g.BASIN.amp*g.meadowBasins(x,y));
    }
    assert.ok(worst<=1e-9,
      `seed ${seed}: some carve term ADDS ${worst.toFixed(4)} to the bowl. The trail, `
      +`the village and the rim are subtractive; anything additive is a second `
      +`water source and the shoreline stops being the bowl's.`);
  }
});

test('meadow water covers a meadow fraction of the meadow',()=>{
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    /* TH is the only waterline, so `opt.lake` fills and drains monotonically. */
    const cover=[0,0.55,1].map(lake=>{
      const h=makeWorldGen(seed,{...MEADOW_OPT,lake});
      let w=0,t=0;
      for(let y=-1100;y<=1100;y+=9)for(let x=-1100;x<=1100;x+=9){ t++; if(h.isWater(x,y)) w++; }
      return w/t;
    });
    assert.ok(cover[1]>0.02&&cover[1]<0.14,
      `seed ${seed} covers ${pct(cover[1])} in water; a hay meadow with ponds in it `
      +`belongs in 2-14%`);
    assert.ok(cover[0]<cover[1]&&cover[1]<cover[2],
      `seed ${seed}: the lake slider is not monotonic (${cover.map(pct).join(' ')}). `
      +`amp must exceed TH's dry end or lake:0 erases the water instead of shrinking it`);
    assert.ok(cover[0]>0.005,`seed ${seed}: lake:0 erased the water entirely`);
    rows.push(`  ${String(seed).padStart(9)}  lake 0 ${pct(cover[0]).padStart(6)}  `
      +`0.55 ${pct(cover[1]).padStart(6)}  1 ${pct(cover[2]).padStart(6)}`);
  }
  console.log('  MEADOW WATER COVERAGE across the lake slider');
  console.log(rows.join('\n'));
});

test('a basin cannot reach past the lattice rings it scans',()=>{
  /* Seam guard on the table: BASIN.rx past the scan cuts the water off along
     a lattice line. */
  const g=meadowGen(SEED), B=g.BASIN;
  const reach=B.rx[1]*(1+B.wobble)+(1-B.inset)*B.cell;
  const scanned=Math.max(1,Math.ceil(reach/B.cell)-1)*B.cell+B.cell;
  assert.ok(reach<=scanned,
    `a basin reaches ${reach.toFixed(0)}px but the scan only covers ${scanned}px; `
    +`water will be clipped along a lattice line. Raise the derived ring count.`);
  console.log(`  BASIN REACH  ${reach.toFixed(0)}px reached, ${scanned}px scanned, `
    +`cell ${B.cell}, rx ${B.rx.join('-')}, ry = rx*${B.aniso}`);
});

test('the water raster and the water field are the same field',()=>{
  /* The drawn shoreline (bakeChunk water raster) and the collider (isWater)
     read one field. */
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    let tot=0, dis=0;
    for(let cy=0;cy<3;cy++)for(let cx=-1;cx<2;cx++){
      const ch=g.bakeChunk(cx,cy);
      for(let y=0;y<192;y+=3)for(let x=0;x<192;x+=3){
        tot++;
        if(!!ch.water[y*192+x]!==g.isWater(cx*192+x,cy*192+y)) dis++;
      }
    }
    assert.ok(dis/tot<0.005,
      `seed ${seed}: the baked water raster disagrees with isWater on `
      +`${pct(dis/tot)} of sampled pixels. Either despeckle is shaping the `
      +`outline or the field has been copied a second time.`);
  }
});

/* Bathymetry and margin width.

   Neumann's volume development D_V = 3 * z_mean / z_max is 1.0 for a cone and
   rises as the floor flattens; most lakes exceed 1, shallow flat-bottomed ones
   most (Hutchinson 1957, A Treatise on Limnology I; Neumann 1959). Measured
   failure: D_V 1.16-1.27, a cone, with the four-rung ramp drawn across 43 px,
   wider than the traveller is tall.

   A screen row is two ground pixels, so a shore distance in rows converted
   with PX_PER_M draws the near and far banks at half their angle. In ground
   pixels the margin is one number on both axes; in screen pixels the depth
   axis is half the width axis. */
test('the meadow lake is a kettle, and its margin is the same margin on both axes',()=>{
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    /* A block of the lake belt from the raster, large enough to hold whole
       lakes: a clipped body has a false centre. */
    const NC=5, W=192*NC, H=192*NC, wet=new Uint8Array(W*H), t=new Float32Array(W*H);
    for(let cy=0;cy<NC;cy++)for(let cx=0;cx<NC;cx++){
      const ch=g.bakeChunk(cx-2,cy-1);
      for(let y=0;y<192;y++)for(let x=0;x<192;x++){
        const p=(cy*192+y)*W+(cx*192+x);
        wet[p]=ch.water[y*192+x]?1:0;
        t[p]=ch.geom[(y*192+x)*4]/255;
      }
      ch.tex.dispose();
    }
    /* Depth from the painted rung, the depth the picture carries. */
    const rung=p=>Math.round(t[p]*3);
    const lab=new Int32Array(W*H).fill(-1), bodies=[];
    for(let s=0;s<W*H;s++){
      if(!wet[s]||lab[s]>=0) continue;
      const id=bodies.length, px=[], st=[s]; lab[s]=id;
      let clipped=false;
      while(st.length){
        const p=st.pop(), x=p%W, y=(p/W)|0; px.push(p);
        if(x<1||y<1||x>=W-1||y>=H-1) clipped=true;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=x+dx, ny=y+dy;
          if(nx<0||ny<0||nx>=W||ny>=H) continue;
          const q=ny*W+nx;
          if(wet[q]&&lab[q]<0){lab[q]=id;st.push(q);}
        }
      }
      if(!clipped&&px.length>=4000) bodies.push(px);
    }
    assert.ok(bodies.length>=1,
      `seed ${seed}: no lake sits whole inside the window, so there is nothing `
      +`here whose margin can be measured from its own middle`);
    for(const px of bodies.slice(0,4)){
      /* pondT is monotone in depth, so a flat floor is a mode at the deepest
         rung. */
      let deepest=0, hist=[0,0,0,0];
      for(const p of px){const r=rung(p); hist[r]++; if(r===0) deepest++;}
      assert.ok(deepest/px.length>=0.45,
        `a ${px.length}px lake spends only ${pct(deepest/px.length)} of itself at its `
        +`deepest rung. A flat floor is most of a kettle; a cone has almost none.`);
      /* the margin, walked out of the middle along each axis */
      let sx=0,sy=0; for(const p of px){sx+=p%W;sy+=(p/W)|0;}
      const cx=Math.round(sx/px.length), cy=Math.round(sy/px.length);
      const walk=(dx,dy)=>{
        let x=cx,y=cy;
        while(x>0&&y>0&&x<W-1&&y<H-1&&wet[y*W+x]){x+=dx;y+=dy;}
        x-=dx;y-=dy;
        let n=0;
        while(wet[y*W+x]&&rung(y*W+x)>0&&n<400){x-=dx;y-=dy;n++;}
        return n;
      };
      const mx=Math.min(walk(1,0),walk(-1,0));          // screen px = ground px
      const my=Math.min(walk(0,1),walk(0,-1));          // screen ROWS
      assert.ok(mx>0&&mx<=20,
        `the shore-to-deep transition is ${mx} px across the width. The budget is `
        +`${POND_MARGIN_PX} ground px of margin, of which colour spends about 0.8.`);
      assert.ok(Math.abs(mx-my*2)<=3,
        `the transition is ${mx} px wide and ${my} rows deep, which is `
        +`${(mx/Math.max(1,my)).toFixed(2)} rather than the 2.0 cabinet projection `
        +`gives a margin that is one margin on the ground. A shore distance `
        +`counted in rows was converted into metres somewhere.`);
      rows.push(`  ${String(seed).padStart(9)}  ${String(px.length).padStart(6)}px  `
        +`floor ${pct(deepest/px.length)}  margin ${mx}px x ${my}rows`);
    }
  }
  console.log(`\n  meadow bathymetry — floor share and margin\n${rows.join('\n')}`);
});

test('the meadow thins its tall layer by spacing, not by rejection',()=>{
  const tall=LAYERS.find(L=>L.tall&&L.kinds.includes('meadowTree'));
  assert.ok(tall.cells.meadow>tall.cell,
    `the meadow's tall layer still uses the boreal cell ${tall.cell}; thinning by `
    +`rejection keeps the survivors' crowding and only punches holes in it`);
  const floor=tall.cells.meadow*(1-tall.jit.meadow);
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    const P=[]; let area=0;
    for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
      const ch=g.bakeChunk(cx,cy); area+=192*192;
      for(const p of ch.props) if(p.kind==='palm'||p.kind==='meadowTree') P.push(p);
    }
    let mn=Infinity, sum=0;
    for(const p of P){
      let b=Infinity;
      for(const q of P){ if(q===p) continue;
        const d=Math.hypot(p.x-q.x,p.y-q.y); if(d<b) b=d; }
      mn=Math.min(mn,b); sum+=b;
    }
    const per=P.length/area*1e5;
    /* Measured unthinned: 10.08 per 1e5 px, nearest-neighbour minimum 7.8 px
       (two trunks fused). */
    assert.ok(per>3.0&&per<6.5,
      `seed ${seed} grows ${per.toFixed(2)} tall props per 1e5 px; the meadow was `
      +`thinned from 10.08 to about half and this is outside 3.0-6.5`);
    assert.ok(mn>=floor-0.5,
      `seed ${seed}: two tall props stand ${mn.toFixed(1)}px apart, inside the `
      +`cell*(1-jit) = ${floor.toFixed(1)}px the jitter fraction guarantees`);
    rows.push(`  ${String(seed).padStart(9)}  ${per.toFixed(2)}/1e5px  `
      +`min NN ${mn.toFixed(1)}px (floor ${floor.toFixed(1)})  `
      +`mean NN ${(sum/P.length).toFixed(1)}px`);
  }
  console.log(`  MEADOW TALL FLORA — cell ${tall.cells.meadow} (boreal ${tall.cell}), `
    +`jitter ${tall.jit.meadow}`);
  console.log(rows.join('\n'));
});

test('the bloom grows in groups, not as confetti',()=>{
  /* Clark & Evans, Ecology 35:445, 1954: mean nearest-neighbour distance over
     the random-field expectation 1/(2*sqrt(density)). Below 1 clustered, 1
     random, above 1 regular. Ungrouped, the flowering shrub measures 0.98. */
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    const P=[]; let area=0;
    for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
      const ch=g.bakeChunk(cx,cy); area+=192*192;
      for(const p of ch.props) if(p.kind==='shrub') P.push(p);
    }
    let sum=0;
    for(const p of P){
      let b=Infinity;
      for(const q of P){ if(q===p) continue;
        const d=Math.hypot(p.x-q.x,p.y-q.y); if(d<b) b=d; }
      sum+=b;
    }
    const ce=(sum/P.length)/(1/(2*Math.sqrt(P.length/area)));
    assert.ok(ce<0.85,
      `seed ${seed}: the bloom's Clark-Evans index is ${ce.toFixed(3)}; at 0.85 and `
      +`above it is not grouped, it is scattered (it measured 0.98 before)`);
    rows.push(`  ${String(seed).padStart(9)}  ${P.length} plants  `
      +`${(P.length/area*1e5).toFixed(2)}/1e5px  Clark-Evans ${ce.toFixed(3)}`);
  }
  console.log('  BLOOM GROUPING — Clark & Evans 1954; <1 clustered, 1 random');
  console.log(rows.join('\n'));
});

test('atlas birches do not clip flat against a sprite side',()=>{
  /* The temporary grammar atlas.js applies while baking the winter stand.
     Without pad the canvas is smaller than grow()+snowPass and stampDisc clips
     the overhang into a vertical cutout. */
  assert.ok(SPECIES.birch.pad>=1.1,
    `birch pad is ${SPECIES.birch.pad}; the measured clear value is 1.1`);
  const was={reach:SPECIES.birch.reach, snow:SPECIES.birch.snow, clump:SPECIES.birch.clump,
             kidsMax:SPECIES.birch.cfg.kidsMax, trunkKids:SPECIES.birch.cfg.trunkKids,
             bridge:SNOW.bridge, tilt:SNOW.tilt, form:SNOW.form};
  SPECIES.birch.reach=5; SPECIES.birch.snow=0.90; SPECIES.birch.clump=0.82;
  SPECIES.birch.cfg.kidsMax=2; SPECIES.birch.cfg.trunkKids=6;
  SNOW.bridge=2; SNOW.tilt=1; SNOW.form=0.62;
  const rows=[];
  try{
    for(let seed=0;seed<24;seed++){
      for(const ti of new Set(TIERS.birch)){
        const rnd=new RNG((SEED^SPECIES.birch.seed^(ti*0x9e3779b1)^(seed*7919))>>>0);
        const base=heightOf('birch',ti);
        const nv=VARIANTS.birch;
        for(let v=0;v<nv;v++){
          const h=Math.max(MIN_H.birch||9,Math.round(base*rnd.range(0.93,1.08)));
          const sp=makeTree('birch',h,rnd,1,0.78,nv>1?(v/(nv-1))*MAX_LEAN:0);
          let left=0,right=0;
          for(let y=0;y<sp.h;y++){
            left+=sp.occ[y*sp.w]?1:0;
            right+=sp.occ[y*sp.w+sp.w-1]?1:0;
          }
          const frac=Math.max(left,right)/sp.h;
          assert.ok(frac<0.25,
            `birch tier ${ti} seed ${seed} v${v} is clipped along a sprite side `
            +`(${pct(frac)} of rows touch an edge)`);
          if(seed===0&&v===0) rows.push(`  tier ${ti}  h ${h}  ${sp.w}x${sp.h}  `
            +`edge ${pct(frac)}`);
        }
      }
    }
  }finally{
    SPECIES.birch.reach=was.reach; SPECIES.birch.snow=was.snow; SPECIES.birch.clump=was.clump;
    SPECIES.birch.cfg.kidsMax=was.kidsMax; SPECIES.birch.cfg.trunkKids=was.trunkKids;
    SNOW.bridge=was.bridge; SNOW.tilt=was.tilt; SNOW.form=was.form;
  }
  console.log('  BIRCH SIDES — atlas grammar, no flat cutout');
  console.log(rows.join('\n'));
});

test('the crown table matches the sprites it protects',()=>{
  /* CROWN_HALF is measured off the rasters, built as atlas.js builds them: its
     heights and each variant's lean, most of a broadleaf's sideways reach. */
  const rows=[];
  for(const kind of Object.keys(TIERS)){
    if(kind==='log') continue;                    // makeLog, and its own `half`
    const declared=CROWN_HALF[kind];
    assert.ok(declared!==undefined,
      `${kind} is placed by the layer loop but has no CROWN_HALF row, so the `
      +`keep-out silently treats its crown as a point`);
    let worst=0, at='';
    for(const ti of new Set(TIERS[kind])){
      const base=heightOf(kind,ti);
      const rnd=new RNG(SEED^SPECIES[kind].seed^(ti*0x9e3779b1));
      const nv=VARIANTS[kind], leanMul=SPECIES[kind].conifer?0.35:1;
      for(let v=0;v<nv;v++){
        const h=Math.max(MIN_H[kind]||9,Math.round(base*rnd.range(0.93,1.08)));
        const sp=makeTree(kind,h,rnd,0,0.78,nv>1?(v/(nv-1))*MAX_LEAN*leanMul:0);
        for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++)
          if(sp.occ[y*sp.w+x]&&Math.abs(x-sp.ax)>worst){
            worst=Math.abs(x-sp.ax); at=`t${ti} v${v}`;
          }
      }
    }
    assert.ok(declared>=worst,
      `CROWN_HALF.${kind} is ${declared} but the sprite reaches ${worst}px from its `
      +`anchor at ${at}; the keep-out is smaller than the thing it keeps out, so a `
      +`crown ${worst-declared}px wide can still hang over a roof`);
    assert.ok(declared<=worst+10,
      `CROWN_HALF.${kind} is ${declared} against a measured ${worst}px — over 10px of `
      +`slack clears ground around every building for nothing`);
    rows.push(`  ${kind.padEnd(13)} declared ${String(declared).padStart(3)}  `
      +`measured ${String(worst).padStart(3)}  at ${at}`);
  }
  console.log('  CROWN REACH — half-width from the anchor, worst tier and variant');
  console.log(rows.join('\n'));
});

test('nothing woody stands in a yard, and grass does',()=>{
  const WOODY=new Set(['meadowTree','palm','shrub','log','birch','spruce','snag',
                       'bramble','cypress','tupelo','stranglerFig','buttonbush']);
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    const S=g.STEADING;
    const props=[];
    const c=(v)=>Math.floor(v/192);
    for(let cy=c(g.POI[0].y-520);cy<=c(g.POI[0].y+520);cy++)
    for(let cx=c(g.POI[0].x-520);cx<=c(g.POI[0].x+520);cx++)
      props.push(...g.bakeChunk(cx,cy).props);
    let core=0, woody=0, grass=0;
    for(const p of props){
      if(CROWN_HALF[p.kind]===undefined) continue;      // built props and rotors
      for(const s of S){
        const f=s.kind==='pavilion'?pavilionFootprint()
          :steadingFootprint(s.kind,s.vari||0);
        if(Math.abs(p.x-s.x)<f.hx&&p.y>s.y-f.back&&p.y<s.y+f.front){ core++; continue; }
        const band=f.yard+(WOODY.has(p.kind)?CROWN_HALF[p.kind]:0);
        if(Math.abs(p.x-s.x)<f.hx+band&&p.y>s.y-f.back-band&&p.y<s.y+f.front+band){
          if(WOODY.has(p.kind)) woody++; else if(p.kind==='sward') grass++;
        }
      }
    }
    assert.equal(core,0,
      `seed ${seed}: ${core} props stand inside a structure's own silhouette`);
    assert.equal(woody,0,
      `seed ${seed}: ${woody} woody plants reach into a yard. Before the keep-out `
      +`existed this measured 29 in a smaller block, including a 69px crown inside `
      +`a house — the meadow had no exclusion at all because inYard read BUILDINGS `
      +`and the meadow sets cabins:false.`);
    /* A yard swept of every layer is the flat tone host() in
       src/world/placement.js warns about at 'village'. */
    assert.ok(grass>0,
      `seed ${seed}: no grass grows in any yard, so the rule is not graded, it is `
      +`a clearing. A farmyard has grass in it.`);
    rows.push(`  ${String(seed).padStart(9)}  ${S.length} structures  `
      +`core ${core}  woody in yard ${woody}  grass in yard ${grass}`);
  }
  console.log('  THE KEEP-OUT, BOTH WAYS');
  console.log(rows.join('\n'));
});

test('the meadow is flat, and its ground stays one grass mass',()=>{
  /* `grass` has four rungs and `sward` has dither 0, so rampStep snaps
     t + 0.58*ndl and the surface changes colour at t = 1/6, 1/2, 5/6. Culm
     micro-relief may cross; a blob is a low-frequency term crossing. */
  const sward=SURFACE.find(s=>s.name==='sward');
  const rungs=RAMP.grass?RAMP.grass.length:4;
  const AZ=218*Math.PI/180, EL=40*Math.PI/180;         // the app's own defaults
  const L=[Math.cos(AZ)*Math.cos(EL),Math.sin(AZ)*Math.cos(EL),Math.sin(EL)];
  const rows=[];
  for(const seed of SEEDS3){
    const g=meadowGen(seed);
    const cx=Math.floor(g.POI[0].x/192), cy=Math.floor(g.POI[0].y/192);
    const d=g.bakeChunk(cx,cy).geom;
    const rung=new Int8Array(192*192).fill(-1), tally=new Array(rungs).fill(0);
    for(let p=0;p<192*192;p++){
      const i=p*4;
      if(Math.round(d[i+3]/16)!==SURFACE.findIndex(s=>s.name==='sward')) continue;
      const ax=-(d[i+1]/255*2-1), ay=-(d[i+2]/255*2-1), len=Math.hypot(ax,ay,1);
      const ndl=Math.max((ax*L[0]+ay*L[1]+L[2])/len,0);
      const r=Math.round(Math.min(1,Math.max(0,d[i]/255+sward.ndl*ndl))*(rungs-1));
      rung[p]=r; tally[r]++;
    }
    const total=tally.reduce((a,b)=>a+b,0);
    if(!total) continue;
    const modal=tally.indexOf(Math.max(...tally));
    /* Connected components of off-modal pixels: area fraction cannot tell a
       1069px blob from 2px speckle. */
    const seen=new Uint8Array(192*192), sizes=[];
    for(let p=0;p<192*192;p++){
      if(rung[p]<0||rung[p]===modal||seen[p]) continue;
      const st=[p]; seen[p]=1; let a=0;
      while(st.length){
        const q=st.pop(); a++;
        const qx=q%192, qy=(q/192)|0;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const rx=qx+dx, ry=qy+dy;
          if(rx<0||ry<0||rx>=192||ry>=192) continue;
          const r=ry*192+rx;
          if(rung[r]>=0&&rung[r]!==modal&&!seen[r]){seen[r]=1;st.push(r);}
        }
      }
      sizes.push(a);
    }
    sizes.sort((a,b)=>b-a);
    const off=(total-tally[modal])/total;
    const largest=sizes[0]||0;
    assert.ok(off<0.06,
      `seed ${seed}: ${pct(off)} of the sward sits off its modal grass rung `
      +`(4.2-9.6% before flattening); over 6% the ground stops reading as one mass`);
    /* No blob. At full relief the largest off-modal patch is 1069 px; 0.22 is
       the largest relief at which none survives at three seeds. */
    assert.ok(largest<64,
      `seed ${seed}: an off-modal patch of ${largest}px. Over 64px this is not the `
      +`culm texture, it is a coloured area — the thing that read as a hill `
      +`nobody recognised as a hill. Largest before flattening: 1069px.`);
    rows.push(`  ${String(seed).padStart(9)}  off-modal ${pct(off).padStart(6)}  `
      +`patches ${String(sizes.length).padStart(3)}  largest ${String(largest).padStart(3)}px  `
      +`median ${sizes[sizes.length>>1]||0}px`);
  }
  console.log(`  SWARD RUNG BUDGET — ${rungs} rungs, ndl ${sward.ndl}, dither `
    +`${sward.dither}, relief ${BIOMES.meadow.relief}, patch ${BIOMES.meadow.patch}`);
  console.log(rows.join('\n'));
});

test('flattening the meadow flattened the meadow, and only the meadow',()=>{
  /* relief scales elevAt, the field habitat windows and life sites read, so
     other worlds must keep the unscaled field. */
  assert.equal(BIOMES.boreal.relief,undefined,
    'boreal declared a relief scalar; winter must keep the unscaled field');
  assert.equal(BIOMES.swamp.relief,undefined,'the swamp declared a relief scalar');
  assert.equal(BIOMES.boreal.patch,undefined,'boreal declared a patch amplitude');
  const bor=makeWorldGen(SEED,{biome:'boreal',density:0.95,snow:0.5,lake:0.55});
  const mea=meadowGen(SEED);
  let ratio=0, n=0;
  for(let y=-600;y<=600;y+=137)for(let x=-600;x<=600;x+=137){
    const b=bor.elevAt(x,y);
    if(Math.abs(b)<1e-6) continue;
    ratio+=mea.elevAt(x,y)/b; n++;
  }
  const r=ratio/n;
  assert.ok(Math.abs(r-BIOMES.meadow.relief)<1e-9,
    `the meadow's elevation is ${r} of the boreal's, not the declared `
    +`relief ${BIOMES.meadow.relief}; the scalar is not the only difference`);
  console.log(`  RELIEF  meadow elevAt / boreal elevAt = ${r.toFixed(4)} `
    +`(declared ${BIOMES.meadow.relief})`);
});
