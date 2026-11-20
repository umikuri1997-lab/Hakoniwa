/* ═══════════════════════════════════════════════════════════════════════════
   Carpentry harness.

   src/construct.js is the drawing authority for anything built. These checks
   hold a building to a volume. The cheapest matters most: count the normals.
   Measured failure: `node tools/houses.mjs house 0 --faces` on a 4.5 m deep
   house reports 4037 pixels of front face, 0 of top and 0 of side.
   ═══════════════════════════════════════════════════════════════════════════ */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FACE, GLAZE, M, MEven, N_FRONT, N_SIDE, N_TOP, SOLID,
  bayRhythm, cabinet, cabinetBox, courseFit, courseWall, doorPx, eavePx,
  groundFootprint, opening, put, roofNormal, roofPlane, tiltNormal, wallSlab,
} from '../src/construct.js';
/* eavePx's floor is a constant in construct.js. The case below asserts the
   behaviour, not the number. */
import { LOG_COURSE_M, PLAYER_H, PX_PER_M, obliqueCols, obliqueRows } from '../src/scale.js';
import { newSprite } from '../src/sprite.js';

const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';

/* A box roughly the size of the meadow house, used by most cases below. */
const BOX = { wM: 6.0, dM: 4.5, hM: 2.35 };

function bakeBox(box = cabinetBox(BOX), opts = {}) {
  const sp = newSprite(box.W, box.H);
  const V = cabinet(box, 0, box.H - 1);
  courseWall(sp, V, opts);
  return { sp, V, box };
}

/* Which of the three declared normals a pixel carries, by dot product, so a
   pitched roof plane still counts as a top face. */
function faceOf(sp, i) {
  const n = { x: sp.nx[i], y: sp.ny[i], z: sp.nz[i] };
  let best = null, bestD = 0.86;
  for (const [k, N] of [['front', N_FRONT], ['top', N_TOP], ['side', N_SIDE]]) {
    const d = n.x * N.x + n.y * N.y + n.z * N.z;
    if (d > bestD) { bestD = d; best = k; }
  }
  return best;
}
function faceTally(sp) {
  const t = { front: 0, top: 0, side: 0, other: 0 };
  for (let i = 0; i < sp.w * sp.h; i++) if (sp.occ[i]) t[faceOf(sp, i) || 'other']++;
  return t;
}

/* ── 1. the projection ─────────────────────────────────────────────────────── */

test('a building spends its depth on rows AND columns, so it has a side face', () => {
  const box = cabinetBox(BOX);

  assert.equal(box.d % 2, 0,
    `a ${BOX.dM} m depth baked to ${box.d} px, which is odd. PROJECTION.md: the `
    + `cabinet halves depth, so an odd one puts the back edge on a half pixel.`);
  assert.equal(box.rows, obliqueRows(box.d),
    'cabinetBox stopped reading obliqueRows, so scale.js is no longer the authority');
  assert.equal(box.cols, obliqueCols(box.d),
    'cabinetBox stopped reading obliqueCols, so the return is not the declared one');
  assert.equal(box.cols, box.rows,
    `the return steps ${box.cols} columns over ${box.rows} rows, which is not 1:1. `
    + `PROJECTION.md refuses slopes that form ragged stairs.`);
  assert.equal(box.W, box.w + box.cols,
    'the sprite is not wide enough to hold the return it declares');
  assert.equal(box.H, box.h + box.rows,
    'the sprite is not tall enough to hold the top face it declares');

  const { sp } = bakeBox(box);
  const t = faceTally(sp);
  if (REPORT) console.log(`  ${box.w}x${box.h} front, ${box.cols} col / ${box.rows} row return`
    + `  ->  front ${t.front}  side ${t.side}  top ${t.top}`);

  assert.ok(t.front > 0, 'the wall emitted no front face at all');
  assert.ok(t.side > 0,
    `the wall emitted ${t.side} side-face pixels. This is the exact failure this `
    + `module exists to prevent: a building with no return is a rectangle, which `
    + `is what makeCabin, makeHouse and makeSwampHouse all were.`);
  assert.equal(t.other, 0,
    'a wall pixel carries a normal that is none of N_FRONT, N_TOP or N_SIDE');
});

test('every normal a construct emitter writes is a unit vector', () => {
  const box = cabinetBox(BOX);
  const sp = newSprite(box.W + 40, box.H + 40);
  const V = cabinet(box, 20, box.H - 1);
  courseWall(sp, V);
  roofPlane(sp, V, {
    riseAt: (fx) => Math.round(Math.abs(fx - box.w / 2) * 0.21),
    fx0: -6, fx1: box.w + 5,
    normalAt: (fx) => roofNormal(12 * Math.PI / 180, fx < box.w / 2 ? -1 : 1),
  });
  opening(sp, V, { fx0: 10, fx1: 18, fy0: 6, fy1: 14, kind: 'window' });

  let worst = 0, worstAt = -1;
  for (let i = 0; i < sp.w * sp.h; i++) {
    if (!sp.occ[i]) continue;
    const n = Math.hypot(sp.nx[i], sp.ny[i], sp.nz[i]);
    if (Math.abs(n - 1) > worst) { worst = Math.abs(n - 1); worstAt = i; }
  }
  assert.ok(worst < 0.002,
    `a pixel at ${worstAt % sp.w},${(worstAt / sp.w) | 0} carries a normal `
    + `${(1 + worst).toFixed(4)} long. The shader takes these as unit and a long `
    + `one is a brighter pixel with no cause.`);
});

test('a leaned normal stays a unit vector at every pitch a roof can take', () => {
  for (let deg = 0; deg <= 60; deg += 3) {
    for (const side of [-1, 1]) {
      const N = roofNormal((deg * Math.PI) / 180, side);
      assert.ok(Math.abs(Math.hypot(N.x, N.y, N.z) - 1) < 1e-9,
        `roofNormal(${deg}deg, ${side}) is not unit length`);
    }
    const N = tiltNormal(N_TOP, deg / 60);
    assert.ok(Math.abs(Math.hypot(N.x, N.y, N.z) - 1) < 1e-9,
      `tiltNormal drifted off unit length at dx=${(deg / 60).toFixed(2)}`);
  }
});

test('a face value reaches the channel the shader actually reads', () => {
  /* The atlas packs thickness into channel b for materials 1, 3, 9 and 12, so
     sp.shade is discarded for building materials and the wood branch resolves
     posterise(lit * ao). A face value written only to shade never reaches the
     GPU: a lit wall, two roof planes and a dark eave ship as one flat rung. */
  const box = cabinetBox(BOX);
  const { sp, V } = bakeBox(box);
  const f = V.front(10, 10), s = V.side(10, 3);
  assert.ok(Math.abs(sp.ao[f.y * sp.w + f.x] - FACE.front) < 1e-6,
    `the front face put ${sp.ao[f.y * sp.w + f.x]} in ao and the value is `
    + `${FACE.front}. ao is the albedo channel for wood.`);
  assert.ok(Math.abs(sp.ao[s.y * sp.w + s.x] - FACE.side) < 1e-6,
    'the return did not reach the ao channel');
  assert.ok(sp.ao[f.y * sp.w + f.x] > sp.ao[s.y * sp.w + s.x],
    'the front is not brighter than the return in the channel that renders');
});

test('the three faces land on three different rungs', () => {
  const vals = [FACE.top, FACE.front, FACE.side];
  /* PROJECTION.md: uSteps = 3 posterises to four levels with cuts at 1/6, 1/2
     and 5/6. Two faces on one level describe the same form twice. */
  const level = (t) => (t > 5 / 6 ? 3 : t > 1 / 2 ? 2 : t > 1 / 6 ? 1 : 0);
  const levels = vals.map(level);
  if (REPORT) console.log(`  top ${FACE.top} -> ${levels[0]}   front ${FACE.front} -> `
    + `${levels[1]}   side ${FACE.side} -> ${levels[2]}`);
  assert.equal(new Set(levels).size, 3,
    `the face values ${vals.join(', ')} posterise to levels ${levels.join(', ')}. `
    + `Two faces on one rung is a flat box.`);
  assert.ok(FACE.top > FACE.front && FACE.front > FACE.side,
    'the value order is no longer top lightest and side darkest, so the sun is '
    + 'coming from somewhere the rest of the world does not agree with');
});

test('a planar face carries exactly one normal class', () => {
  const box = cabinetBox(BOX);
  const { sp, V } = bakeBox(box);
  for (let fy = 0; fy < box.h; fy++) for (let fx = 0; fx < box.w; fx++) {
    const p = V.front(fx, fy), i = p.y * sp.w + p.x;
    assert.equal(faceOf(sp, i), 'front',
      `the front face at ${fx},${fy} carries a ${faceOf(sp, i)} normal. A planar `
      + `wall gets its form from one Lambert value; varying the normal across it `
      + `describes the same plane twice.`);
  }
  for (let fy = 0; fy < box.h; fy++) for (let r = 1; r <= box.rows; r++) {
    const p = V.side(fy, r), i = p.y * sp.w + p.x;
    assert.equal(faceOf(sp, i), 'side',
      `the return at row ${fy}, depth ${r} carries a ${faceOf(sp, i)} normal`);
  }
});

/* ── 2. the medium floors ──────────────────────────────────────────────────── */

test('a wall is a whole number of courses, and the last one is the first one', () => {
  const rows = [];
  for (const hM of [2.0, 2.35, 2.5, 3.2, 1.1]) {
    const hPx = M(hM), C = courseFit(hPx, LOG_COURSE_M);
    const seams = [...C.seam].reduce((a, b) => a + b, 0);
    assert.equal(seams, C.n,
      `a ${hM} m wall of ${hPx} px asked for ${C.n} courses and got ${seams} seams`);
    /* `fy % coursePx` leaves the top course short by hPx % coursePx: an
       orphan course at the eave. */
    const at = [...C.seam].map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    const gaps = at.slice(1).map((v, i) => v - at[i]);
    const spread = gaps.length ? Math.max(...gaps) - Math.min(...gaps) : 0;
    assert.ok(spread <= 1,
      `a ${hM} m wall has courses ${gaps.join(',')} px apart, a spread of `
      + `${spread}. PIXEL-ART.md section 6: no orphan half-course at the eave.`);
    rows.push(`  ${hM.toFixed(2)} m = ${String(hPx).padStart(3)} px  ->  ${C.n} courses `
      + `of ${C.coursePx.toFixed(2)} px = ${(C.courseM * 100).toFixed(1)} cm`);
  }
  if (REPORT) console.log('  COURSE FIT against LOG_COURSE_M = 0.27 m\n' + rows.join('\n'));
});

test('an eave clears its wall, and a door clears the traveller', () => {
  /* Medium floor: below two pixels a roof reads as a lid. */
  assert.equal(eavePx(0.74), M(0.74), 'a 0.74 m eave should convert straight through');
  assert.ok(eavePx(0.01) >= 2,
    `a small eave converted to ${eavePx(0.01)} px. The floor exists because one `
    + `pixel of overhang is a line, not a roof.`);
  for (const m of [0, 0.02, 0.05, 0.1, 0.3, 0.74, 1.2])
    assert.ok(eavePx(m) >= 2, `eavePx(${m}) fell under the two-pixel floor`);

  /* Medium floor: the door clears the traveller whatever its metres. */
  assert.ok(doorPx(2.03) >= PLAYER_H,
    'a 2.03 m door no longer clears PLAYER_H, so the size axiom moved');
  assert.equal(doorPx(1.2), PLAYER_H,
    `a 1.2 m door drew ${doorPx(1.2)} px. It must be raised to the traveller's own `
    + `height with the concession named, not drawn at a height he cannot use.`);
});

test('openings sit on a bay rhythm inside the wall', () => {
  const w = M(6.0);
  for (const bays of [1, 2, 3, 4]) {
    const spans = bayRhythm(w, bays, { margin: 4 });
    assert.equal(spans.length, bays, `asked for ${bays} bays and got ${spans.length}`);
    for (const [a, b] of spans) {
      assert.ok(a >= 0 && b <= w - 1,
        `a bay runs ${a}..${b} on a wall 0..${w - 1}, so a window is off the wall`);
      assert.ok(b > a, 'a bay collapsed to no width');
    }
    for (let i = 1; i < spans.length; i++)
      assert.ok(spans[i][0] > spans[i - 1][1],
        `bays ${i - 1} and ${i} overlap, so two windows share a jamb`);
    if (spans.length > 2) {
      const pitch = spans.slice(1).map((s, i) => s[0] - spans[i][0]);
      assert.ok(Math.max(...pitch) - Math.min(...pitch) <= 1,
        `bay pitch ${pitch.join(',')} is uneven, which reads as damage rather `
        + `than as a rhythm`);
    }
  }
});

test('an opening is recessed and glazing is a light', () => {
  const box = cabinetBox(BOX);
  const { sp, V } = bakeBox(box);
  const fx0 = 12, fx1 = 20, fy0 = 5, fy1 = 13;
  /* read ao, because that is the channel the wood branch posterises */
  const wallAt = (fx, fy) => { const p = V.front(fx, fy); return sp.ao[p.y * sp.w + p.x]; };
  const wall = wallAt(fx0 - 3, fy0 + 4);
  opening(sp, V, { fx0, fx1, fy0, fy1, kind: 'window' });

  const mid = V.front(fx0 + 4, fy0 + 4);
  assert.equal(sp.occ[mid.y * sp.w + mid.x], GLAZE,
    'the aperture is not material 6, so a window is a hole in the wall');
  assert.ok(wallAt(fx0 + 4, fy0) < wall,
    'the head of the opening is not darker than the wall, so there is no reveal');
  assert.ok(wallAt(fx0, fy0 + 4) < wall,
    'the left jamb is not in shadow. Light enters from the left, so the left '
    + 'inner jamb is the one it cannot reach.');
  assert.ok(wallAt(fx1, fy0 + 4) > wall,
    'the right jamb is not catching the light the left one is missing');
  assert.ok(wallAt(fx0 + 4, fy1 + 1) > wall,
    'the sill is not brighter than the wall, and a sill is the one part of a '
    + 'window that sticks out');

  const door = { fx0: 40, fx1: 48, fy0: box.h - doorPx(2.03), fy1: box.h - 1 };
  opening(sp, V, { ...door, kind: 'door' });
  const inside = V.front(door.fx0 + 4, door.fy0 + 4);
  assert.equal(sp.occ[inside.y * sp.w + inside.x], SOLID,
    'a doorway glazed itself');
  assert.ok(sp.ao[inside.y * sp.w + inside.x] < wall * 0.5,
    'the doorway is not appreciably darker than the wall around it');
  assert.ok(door.fy1 - door.fy0 + 1 >= PLAYER_H,
    `the clear door opening is ${door.fy1 - door.fy0 + 1} px and the traveller is `
    + `${PLAYER_H}`);
});

/* ── 3. the roof ───────────────────────────────────────────────────────────── */

test('a roof overhangs its wall and casts on it', () => {
  const box = cabinetBox(BOX);
  const eave = eavePx(0.74);
  const sp = newSprite(box.W + eave * 2, box.H + 20);
  const V = cabinet(box, eave, box.H - 1 + 20 - box.rows);
  courseWall(sp, V);

  const aoBefore = [];
  for (let fx = 0; fx < box.w; fx++) {
    const p = V.front(fx, 0);
    aoBefore.push(sp.ao[p.y * sp.w + p.x]);
  }
  roofPlane(sp, V, {
    riseAt: () => 0, fx0: -eave, fx1: box.w - 1 + eave,
    wallX0: 0, wallX1: box.w - 1, fascia: 1, castRows: 2,
  });

  /* the overhang exists on both sides */
  for (const fx of [-eave, box.w - 1 + eave]) {
    const p = { x: V.x0 + fx, y: V.yTop };
    assert.ok(sp.occ[p.y * sp.w + p.x],
      `nothing is drawn at overhang column ${fx}, so the roof stops at the wall`);
  }
  assert.ok(eave >= 2,
    `the overhang is ${eave} px. Both walkthroughs in the reading list put the `
    + `roof outline outside the footprint before anything else.`);

  /* and it darkens the wall under it */
  let cast = 0;
  for (let fx = 0; fx < box.w; fx++) {
    const p = V.front(fx, 2);
    if (sp.ao[p.y * sp.w + p.x] < aoBefore[fx]) cast++;
  }
  assert.ok(cast >= box.w * 0.8,
    `the eave shadow reached ${cast} of ${box.w} wall columns. Without it the `
    + `roof reads as glued to the wall rather than standing in front of it.`);
});

test('a roof surface is a top face over its whole depth', () => {
  const box = cabinetBox(BOX);
  const sp = newSprite(box.W + 8, box.H + 8);
  const V = cabinet(box, 4, box.H + 3);
  roofPlane(sp, V, { riseAt: () => 0, fx0: 0, fx1: box.w - 1, fascia: 0, castRows: 0 });
  const t = faceTally(sp);
  if (REPORT) console.log(`  a flat ${box.w}x${box.d} px roof  ->  top ${t.top}  front ${t.front}`);
  assert.ok(t.top >= box.w * box.rows,
    `a ${box.w} px wide roof ${box.rows} rows deep drew ${t.top} top-face pixels, `
    + `fewer than the ${box.w * box.rows} its own depth requires`);
  assert.equal(t.side, 0, 'a level roof surface emitted a side face');
});

/* ── 4. the footprint follows the drawing ──────────────────────────────────── */

test('the keep-out is measured off the drawn base, not off the world rectangle', () => {
  const box = cabinetBox(BOX);
  const eave = eavePx(0.74);
  const f = groundFootprint(box, eave);
  assert.equal(f.back, box.rows,
    `the footprint reaches ${f.back} px back and the building draws ${box.rows}`);
  assert.equal(f.hx, (box.W + eave * 2) >> 1,
    'the footprint half-width stopped covering the drawn width, so a tree can '
    + 'stand inside the silhouette');
  assert.ok(f.hx * 2 >= box.w,
    'the footprint is narrower than the front face alone');
  if (REPORT) console.log(`  drawn ${box.W + eave * 2} px wide, ${box.rows} rows deep`
    + `  ->  keep-out hx ${f.hx}, back ${f.back}`);
});

test('the wall slab reaches from its inset origin to the drawn base row',()=>{
  const box=cabinetBox(BOX);
  const slab=wallSlab(box,0,box.W>>1);
  assert.equal(slab.front,2,
    'the slab origin is two rows behind the wall, but its front no longer reaches the wall row');
  assert.equal(slab.back,box.rows);
  assert.equal(slab.shear,box.cols);
});

/* ── 5. the module stays a carpenter ───────────────────────────────────────── */

test('construct writes materials and never a colour', () => {
  const box = cabinetBox(BOX);
  const { sp } = bakeBox(box);
  assert.equal(sp.ramp, undefined,
    'an emitter set a ramp. A vernacular chooses its ramp; carpentry does not.');
  const seen = new Set(sp.occ);
  for (const m of seen) assert.ok([0, SOLID, GLAZE].includes(m),
    `a wall wrote material ${m}, which is not empty, solid or glazing`);
});

test('put refuses to write outside the sprite', () => {
  const sp = newSprite(8, 8);
  assert.equal(put(sp, -1, 3, SOLID, 0.5), false, 'put wrote off the left edge');
  assert.equal(put(sp, 8, 3, SOLID, 0.5), false, 'put wrote off the right edge');
  assert.equal(put(sp, 3, -1, SOLID, 0.5), false, 'put wrote above the sprite');
  assert.equal(put(sp, 3, 8, SOLID, 0.5), false, 'put wrote below the sprite');
  assert.equal(put(sp, 3, 3, SOLID, 0.5), true, 'put refused a pixel inside the sprite');
  assert.equal(sp.occ.reduce((n, m) => n + (m ? 1 : 0), 0), 1,
    'a refused put still left a pixel behind');
});

test('metres convert through one authority', () => {
  assert.equal(M(1), Math.round(PX_PER_M), 'M stopped reading PX_PER_M');
  for (const m of [0.5, 1.7, 4.5, 6.0]) {
    assert.equal(MEven(m) % 2, 0, `MEven(${m}) returned an odd depth`);
    assert.ok(Math.abs(MEven(m) - M(m)) <= 1,
      `MEven(${m}) moved the dimension by more than the rounding it exists for`);
  }
});
