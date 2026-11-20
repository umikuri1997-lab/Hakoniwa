/* Architecture cast: every built shell the atlas ships, measured and hashed.

   Localises building drift without a build or browser, in building terms.
   Each entry carries a measurement block (dimensions, the three face counts,
   materials, anchor), then channel hashes. A diff reports the measurement
   that moved and falls back to channels only when the shape is unchanged.

   The face tally matters most: a building with no top face and no side face
   is a rectangle. Measured failure: the meadow house at 4037 pixels of front
   face and zero of everything else.

   Scope: deterministic source sprites. Atlas packing, palette snap and final
   composition stay with test/frame-conformance.mjs. */

import { createHash } from 'node:crypto';
import { RNG } from '../src/rng.js';
import { N_FRONT, N_SIDE, N_TOP } from '../src/construct.js';
import { makeCabin } from '../src/cabin.js';
import { HOUSE_SCALE, makeDerelict, makeHouse, makeNestPole } from '../src/steading.js';
import { PILLAR_VARIANTS, WALL_VARIANTS, makePillar, makeRuinWall } from '../src/ruins.js';
import { makeSwampHouse } from '../src/swamp-settlement.js';
import { makeHouseLadder, makeLakeHouse } from '../src/swamp-lakehouse.js';
import { makePavilion } from '../src/pavilion.js';
import { HUT_VARIANTS, makeHut } from '../src/desert-hamlet.js';
import { TENT_VARIANTS, makeTent } from '../src/desert-camp.js';
import { CAP_HOUSE_VARIANTS, makeCapHouse, makeCutBench, makeLampPost } from '../src/hollow-village.js';

const SEED = 20260727;

/* Table-driven. Machines have their own gate in test/machine.test.mjs; these
   are the shells. */
const CAST = {
  house: { n: HOUSE_SCALE.length, make: (v) => makeHouse(new RNG(SEED ^ (0x4075e + v)), v) },
  cabin: { n: 3, make: (v) => makeCabin(new RNG(SEED ^ (0xcab0 + v)), v) },
  swampHouse: { n: 3, make: (v) => makeSwampHouse(new RNG(SEED ^ v), v) },
  derelict: { n: 1, make: () => makeDerelict(new RNG(SEED ^ 0x0de1)) },
  nestPole: { n: 1, make: () => makeNestPole(new RNG(SEED ^ 0x57a11)) },
  pillar: { n: PILLAR_VARIANTS.length, make: (v) => makePillar(new RNG(17 + v), PILLAR_VARIANTS[v]) },
  ruinWall: { n: WALL_VARIANTS.length, make: (v) => makeRuinWall(WALL_VARIANTS[v]) },
  lakeHouse: { n: 1, make: () => makeLakeHouse(null, 0) },
  houseLadder: { n: 1, make: () => makeHouseLadder() },
  pavilion: { n: 1, make: () => makePavilion(null, 0) },
  hut: { n: HUT_VARIANTS.length, make: (v) => makeHut(new RNG(SEED ^ (0x407a + v)), v) },
  tent: { n: TENT_VARIANTS.length, make: (v) => makeTent(new RNG(SEED ^ (0x7e07 + v)), v) },
  capHouse: { n: CAP_HOUSE_VARIANTS.length, make: (v) => makeCapHouse(null, v) },
  lampPost: { n: 1, make: () => makeLampPost() },
  cutBench: { n: 1, make: () => makeCutBench() },
};

const castKeys = () => Object.entries(CAST)
  .flatMap(([k, s]) => [...Array(s.n).keys()].map((v) => `${k}:${v}`));

const buildOne = (key) => {
  const [k, v] = key.split(':');
  return CAST[k].make(+v);
};

/* Which of the three declared normals a pixel is nearest, by dot product.
   Nearest-of-three, not a threshold: the references do not span the
   hemisphere. The boreal cabin's roof pitches at 54 degrees, closer to N_SIDE
   than to N_TOP and within 0.86 of neither, so a threshold classifier drops
   2213 of its pixels into `other`. */
function faceOf(sp, i) {
  const n = { x: sp.nx[i], y: sp.ny[i], z: sp.nz[i] };
  let best = 'front', bestD = -Infinity;
  for (const [k, N] of [['front', N_FRONT], ['top', N_TOP], ['side', N_SIDE]]) {
    const d = n.x * N.x + n.y * N.y + n.z * N.z;
    if (d > bestD) { bestD = d; best = k; }
  }
  return best;
}

/* Whether a pixel carries depth, independent of the face labels. A shell's
   elevation normal is near (0, 0, 1) with a slight lean up-screen; anything
   meaningfully off it is not the front. */
const carriesDepth = (sp, i) =>
  Math.abs(sp.nx[i]) > 0.30 || sp.ny[i] < -0.38;

const isBuffer = (v) => ArrayBuffer.isView(v) && !(v instanceof DataView);

/* Normalise -0 so an invisible sign bit cannot fail identity. */
function bytesOf(a) {
  if (a instanceof Float32Array || a instanceof Float64Array) {
    const c = a.slice();
    for (let i = 0; i < c.length; i++) if (Object.is(c[i], -0)) c[i] = 0;
    a = c;
  }
  return Buffer.from(a.buffer, a.byteOffset, a.byteLength);
}

const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);

function measure(sp) {
  const faces = { front: 0, top: 0, side: 0, other: 0 };
  const mats = {};
  let occupied = 0, depth = 0, aoMin = 1, aoMax = 0;
  for (let i = 0; i < sp.w * sp.h; i++) {
    const m = sp.occ[i];
    if (!m) continue;
    occupied++;
    faces[faceOf(sp, i)]++;
    if (carriesDepth(sp, i)) depth++;
    mats[m] = (mats[m] || 0) + 1;
    /* the channel the wood branch posterises, for the shells made of wood */
    if (m === 1 || m === 3 || m === 12) {
      aoMin = Math.min(aoMin, sp.ao[i]); aoMax = Math.max(aoMax, sp.ao[i]);
    }
  }
  const out = {
    dims: `${sp.w}x${sp.h}`,
    anchor: `${sp.ax},${sp.ay}`,
    ramp: `${sp.ramp}/${sp.ramp2 === undefined ? '-' : sp.ramp2}`,
    occupied, depth,
    aoSpread: aoMax >= aoMin ? Number((aoMax - aoMin).toFixed(3)) : 0,
    faces, mats, chan: {},
  };
  const scalars = [];
  for (const k of Object.keys(sp).sort()) {
    const v = sp[k];
    if (isBuffer(v)) out.chan[k] = sha(bytesOf(v));
    else if (typeof v !== 'object' || v === null) scalars.push(`${k}=${v}`);
  }
  out.tags = scalars.join(' ');
  return out;
}

function snapshot() {
  const snap = {};
  for (const key of castKeys()) snap[key] = measure(buildOne(key));
  return snap;
}

const pct = (a, b) => (a === 0 ? (b === 0 ? '0%' : 'new') : `${(((b - a) / a) * 100).toFixed(0)}%`);

/* Report the measurement that moved, in building terms, before channel
   hashes. */
function diff(want, got) {
  const drifted = [];
  for (const key of Object.keys(want)) {
    const a = want[key], b = got[key];
    if (!b) { drifted.push({ key, why: 'missing from the rebuilt cast' }); continue; }
    const notes = [];
    if (a.dims !== b.dims) notes.push(`size ${a.dims} -> ${b.dims}`);
    if (a.anchor !== b.anchor) notes.push(`anchor ${a.anchor} -> ${b.anchor}`);
    if (a.ramp !== b.ramp) notes.push(`ramp ${a.ramp} -> ${b.ramp}`);
    if (a.depth !== b.depth)
      notes.push(`depth px ${a.depth} -> ${b.depth} (${pct(a.depth, b.depth)})`);
    if (a.aoSpread !== b.aoSpread)
      notes.push(`ao spread ${a.aoSpread} -> ${b.aoSpread}`);
    for (const f of ['front', 'top', 'side', 'other'])
      if (a.faces[f] !== b.faces[f])
        notes.push(`${f} face ${a.faces[f]} -> ${b.faces[f]} (${pct(a.faces[f], b.faces[f])})`);
    if (b.depth === 0 && a.depth > 0)
      notes.push('LOST ITS DEPTH: every normal faces the camera, so it is a rectangle');
    if (b.aoSpread < 0.2 && a.aoSpread >= 0.2)
      notes.push('LOST ITS FORM: ao is nearly one value, so it renders as one flat rung');
    for (const m of new Set([...Object.keys(a.mats), ...Object.keys(b.mats)]))
      if ((a.mats[m] || 0) !== (b.mats[m] || 0))
        notes.push(`material ${m} ${a.mats[m] || 0} -> ${b.mats[m] || 0}`);
    if (a.tags !== b.tags) notes.push(`tags(${a.tags} -> ${b.tags})`);
    if (!notes.length) {
      const chans = Object.keys(a.chan).filter((c) => a.chan[c] !== b.chan[c]);
      if (chans.length) notes.push(`same shape, different values in ${chans.join(', ')}`);
    }
    if (notes.length) drifted.push({ key, why: notes.join('; ') });
  }
  for (const key of Object.keys(got)) if (!want[key]) drifted.push({ key, why: 'new, not in the baseline' });
  return drifted;
}

export { castKeys, diff, faceOf, snapshot };
