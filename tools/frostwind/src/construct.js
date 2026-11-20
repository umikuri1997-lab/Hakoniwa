/* ═══════════════════════════════════════════════════════════════════════════
   Carpentry. The constructive layer between a metre table and a material
   buffer, and the drawing authority for anything built.

   Authority: src/scale.js for every dimension, PROJECTION.md for the mapping,
   docs/CANON.md for the cabinet-return concession, PIXEL-ART.md section 6 for
   the medium floors these emitters enforce.

   The atom is a physical unit: a course, a bay, an eave in metres.

   Invariant: emitters write occ, shade, ao and unit normals. Never a colour,
   never a ramp name, never a biome branch. A vernacular owns its metre table,
   its mass, and its meaning; this module owns how a member becomes pixels.
   ═══════════════════════════════════════════════════════════════════════════ */

import { clamp } from './math.js';
import { LOG_COURSE_M, PLAYER_H, PX_PER_M, obliqueCols, obliqueRows } from './scale.js';

/* ── 1. faces ───────────────────────────────────────────────────────────────
   Three visible planes, three normals, three values. N_TOP is the cabinet top
   face, normalize(0, -2, 1). */

const N_TOP = { x: 0, y: -0.8944, z: 0.4472 };
const N_FRONT = { x: 0, y: 0, z: 1 };
const N_SIDE = { x: 0.78, y: -0.10, z: 0.62 };

/* The value budget. With uSteps = 3 a posterised term takes one of four
   levels. These three land on separate rungs under round(t*3): 3, 2 and 1. A
   fourth face value rounds onto one of them, so a flat wall carries no
   gradient. */
const FACE = Object.freeze({ top: 1.00, front: 0.62, side: 0.30 });

/* Materials this module writes. The rest of the table lives in the branch in
   src/shaders/sprite.js. */
const SOLID = 1;         // timber, masonry, anything that casts
const GLAZE = 6;         // a window is a light, not a hole
/* Open timber: paints as wood and is discarded by the projected-shadow pass, so
   sparse stilts and X braces throw no short bars across the cast of the body
   they hold up. */
const OPEN = 12;

/* ── 2. metres ──────────────────────────────────────────────────────────── */

const M = (m) => Math.round(m * PX_PER_M);

/* Depth forced even before the cabinet halves it, so a back edge never lands on
   a half pixel. Same contract as trEven, in metres. */
const MEven = (m) => 2 * Math.round((m * PX_PER_M) / 2);

/* Medium floor: a roof that clears its wall by one pixel reads as a lid. */
const EAVE_MIN_PX = 2;
const eavePx = (eaveM) => Math.max(EAVE_MIN_PX, M(eaveM));

/* Medium floor: the traveller must fit a door, so PLAYER_H is the floor. */
const doorPx = (headM) => Math.max(PLAYER_H, M(headM));

function unit(x, y, z) {
  const l = Math.hypot(x, y, z) || 1;
  return { x: x / l, y: y / l, z: z / l };
}

/* Lean a face normal sideways and renormalise. */
const tiltNormal = (N, dx) => unit(N.x + dx, N.y, N.z);

/* ── 3. the cabinet volume ──────────────────────────────────────────────────
   The world's depth axis draws straight up the screen with a screen-x term of
   zero, so a camera-facing wall has a side face zero pixels wide. A building
   carries depth up and to the right instead, halved on both axes. Equal rows
   and columns put the receding edge on a 1:1 step. */

function cabinetBox({ wM, dM, hM }) {
  const w = Math.max(1, M(wM));
  const d = Math.max(2, MEven(dM));
  const h = Math.max(1, M(hM));
  const cols = obliqueCols(d), rows = obliqueRows(d);
  return { w, d, h, cols, rows, W: w + cols, H: h + rows, wM, dM, hM };
}

/* Place a box in a sprite and return the three face mappings, the one home of
   the shear arithmetic.

     front(fx, fy)  fx from the left of the front face, fy down from its top
     top(tx, r)     tx across the front-top edge, r rows back from it
     side(fy, r)    the right return, fy as on the front, r rows back

   x0 / yBase are the front-bottom-left corner, where the building meets the
   ground and footprints are measured from. */
function cabinet(box, x0, yBase) {
  const { w, h } = box;
  const yTop = yBase - h + 1;
  return {
    ...box, x0, yBase, yTop,
    front: (fx, fy) => ({ x: x0 + fx, y: yTop + fy }),
    top: (tx, r) => ({ x: x0 + tx + r, y: yTop - r }),
    side: (fy, r) => ({ x: x0 + w - 1 + r, y: yTop + fy - r }),
  };
}

/* The drawn ground parallelogram, as the axis-aligned box a keep-out needs.
   Concession (docs/CANON.md): this is sheared `cols` right of world truth. The
   collider follows the drawing; following the world it disagrees with the
   pixels by half the building's depth. `eave` widens both sides, so no tree
   stands under the overhang. */
function groundFootprint(box, eave = 0) {
  return { hx: (box.W + eave * 2) >> 1, back: box.rows, front: 0 };
}

/* The same base as the exact figure collision needs: the drawn parallelogram,
   offset from the sprite's anchor. `dx` is where the front edge's centre sits
   relative to that anchor, because a sheet with eaves and a return is not
   centred on its wall. */
function wallSlab(box, x0, anchorX) {
  return {
    dx: x0 + (box.w - 1) / 2 - anchorX,
    hx: box.w / 2,
    back: box.rows,
    /* The solid origin is two rows behind the drawn wall base. The matching
       front band reaches back to the sprite anchor and carries the threshold. */
    front: 2,
    shear: box.cols,
  };
}

/* ── 4. the writer ──────────────────────────────────────────────────────────
   Measured failure: the atlas packs thickness into channel b for materials 1,
   3, 9 and 12, so `sp.shade` is discarded for everything a building is made
   of. The wood branch of shaders/sprite.js resolves

       posterise(lit * ao)

   so `ao` is the albedo channel. Face values authored only in shade ship as
   one flat rung.

   `t` is the face value and lands in both channels. `occ` is a separate
   geometric term for a junction or a cast, multiplied in. */

function put(sp, x, y, m, t, occ, N) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= sp.w || y >= sp.h) return false;
  const i = y * sp.w + x;
  sp.occ[i] = m;
  sp.shade[i] = clamp(t, 0, 1);
  sp.ao[i] = clamp(t * (occ === undefined ? 1 : occ), 0.04, 1);
  const n = N || N_FRONT;
  sp.nx[i] = n.x; sp.ny[i] = n.y; sp.nz[i] = n.z;
  sp.rad[i] = 2;
  return true;
}

/* Darken what is already there without spending a face value on an outline.
   PROJECTION.md: a part on the same rung as the material behind it must separate
   in space or value. A junction is geometry, so it scales ao. */
function occlude(sp, x, y, k) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= sp.w || y >= sp.h) return;
  const i = y * sp.w + x;
  if (!sp.occ[i]) return;
  sp.ao[i] = clamp(sp.ao[i] * k, 0.04, 1);
}

/* ── 5. course rhythm ───────────────────────────────────────────────────────
   A wall's texture sits on the spacing of a real member. LOG_COURSE_M = 0.27 is
   the carpentry size; a vernacular with boards or panels passes its own
   nominal and gets the nearest whole division of the same wall height (head
   height is climate law, the cladding module is free). Seam rows are placed
   by exact division, so the last course is the same height as the first. */

function courseFit(hPx, nominalM = LOG_COURSE_M) {
  const nominalPx = Math.max(2, M(nominalM));
  const n = Math.max(1, Math.round(hPx / nominalPx));
  const seam = new Uint8Array(Math.max(1, hPx));
  for (let c = 0; c < n; c++) seam[Math.round((c * hPx) / n)] = 1;
  return { n, seam, courseM: (hPx / n) / PX_PER_M, coursePx: hPx / n };
}

/* Window columns from the bay count over the wall, never from a random draw.
   Returns inclusive [fx0, fx1] spans in front-face coordinates. */
function bayRhythm(w, bays, { widthFrac = 0.46, widthPx = 0, margin = 0 } = {}) {
  const spans = [];
  const usable = w - margin * 2;
  if (bays < 1 || usable < 3) return spans;
  const pitch = usable / bays;
  /* widthPx when the opening area is a law (a glazing figure in square metres),
     widthFrac when the bay sets the proportion. Every bay is the same width. */
  const wide = widthPx > 0 ? widthPx : pitch * widthFrac;
  const half = Math.max(1, Math.min(Math.round((pitch - 2) / 2), Math.round(wide / 2)));
  for (let b = 0; b < bays; b++) {
    const c = Math.round(margin + pitch * (b + 0.5));
    spans.push([c - half, c + half]);
  }
  return spans;
}

/* ── 6. the wall ────────────────────────────────────────────────────────────
   Front face and right return in one pass, so the courses wrap the corner. */

function courseWall(sp, V, opts = {}) {
  const {
    material = SOLID,
    courseM = LOG_COURSE_M,
    value = FACE.front,
    sideValue = FACE.side,
    seamDrop = 0.42,
    skip = null,             // (fx, fy) => true leaves the pixel unwritten
    occ = 1,
    fit = null,
  } = opts;
  const { w, h, rows } = V;
  const C = fit || courseFit(h, courseM);
  /* Measured failure: a 0.20 albedo spread over 92 columns crosses two rungs
     of the value ladder and prints as three flat bands. A planar wall is one
     value and its form comes from the three normals. PIXEL-ART.md section 6. */

  for (let fy = 0; fy < h; fy++) {
    const seam = C.seam[fy] && fy > 0;
    for (let fx = 0; fx < w; fx++) {
      if (skip && skip(fx, fy)) continue;
      const p = V.front(fx, fy);
      put(sp, p.x, p.y, material, seam ? value * seamDrop : value, occ, N_FRONT);
    }
    for (let r = 1; r <= rows; r++) {
      if (skip && skip(w - 1 + r, fy)) continue;
      const p = V.side(fy, r);
      put(sp, p.x, p.y, material, seam ? sideValue * seamDrop : sideValue, occ, N_SIDE);
    }
  }
  /* The corner where front meets return: occlusion, since the faces are
     already a rung apart. */
  for (let fy = 0; fy < h; fy++) {
    const p = V.front(w - 1, fy);
    occlude(sp, p.x, p.y, 0.88);
  }
  return C;
}

/* ── 7. the roof ────────────────────────────────────────────────────────────
   A roof is a height profile over the front-face columns plus a depth sweep.
   Along the depth axis the surface is level, so one column of profile becomes
   one 1:1 band of top face. The eave overhang is columns outside the wall, and
   the eave cast puts the roof in front of the wall. */

function roofPlane(sp, V, opts = {}) {
  const {
    riseAt,                        // (fx) => rows the surface sits above V.yTop
    fx0 = 0, fx1 = V.w - 1,
    material = SOLID,
    valueAt = () => FACE.top,
    normalAt = () => N_TOP,
    fascia = 2,                    // rows of front edge under the surface
    fasciaValue = FACE.front * 0.34,
    castRows = 2,                  // eave shadow on whatever is under the roof
    cast = 0.58,
    wallX0 = 0, wallX1 = V.w - 1,
    occ = 1,
    depth = V.rows,
  } = opts;

  for (let fx = fx0; fx <= fx1; fx++) {
    const rise = riseAt(fx);
    const yFront = V.yTop - rise;
    const N = normalAt(fx), val = valueAt(fx);
    /* Measured failure: one pixel per column leaves holes wherever the pitch
       steps. A column's depth sweep runs up-right at 1:1, so a neighbour one
       row lower lands offset (1, 1), across the diagonal, and the two runs
       miss: the butterfly's left plane prints as `TT TTTTT TTTTT`. Where the
       surface falls away to the right, this column carries the riser. */
    const riser = Math.max(0, rise - riseAt(fx + 1));
    /* far rows first, so the near edge of the surface wins the shared pixels a
       1:1 shear produces between adjacent columns */
    for (let r = depth; r >= 0; r--)
      for (let q = 0; q <= riser; q++)
        put(sp, V.x0 + fx + r, yFront - r + q, material, val, occ, N);
    for (let f = 1; f <= fascia; f++)
      put(sp, V.x0 + fx, yFront + riser + f, material, fasciaValue, occ, N_FRONT);
    /* the shadow the overhang throws down the wall */
    if (fx >= wallX0 && fx <= wallX1)
      for (let c = 0; c < castRows; c++)
        occlude(sp, V.x0 + fx, yFront + riser + fascia + 1 + c,
          cast + (1 - cast) * (c / Math.max(1, castRows)));
  }
}

/* A single pitched plane's normal, interpolated between the up axis and the
   across axis. `side` is -1 for a plane falling to the left.

   Measured failure: tiltNormal(N_TOP, side*sin(pitch)) adds the horizontal
   term without shortening the vertical one. At the meadow's 12 deg the error
   is under two degrees. At the boreal cabin's 54 deg it returns
   (0.62, -0.68, 0.34) where the plane's normal is (0.81, -0.53, 0.26). */
const roofNormal = (pitch, side) => unit(
  side * Math.sin(pitch),
  N_TOP.y * Math.cos(pitch),
  N_TOP.z * Math.cos(pitch));

/* ── 8. openings ────────────────────────────────────────────────────────────
   Medium floor: an opening is recessed, never a flat hole. Light enters from
   the left, so it lands on the right inner jamb and leaves the head and the
   left jamb dark. */

function opening(sp, V, opts = {}) {
  const {
    fx0, fx1, fy0, fy1,
    kind = 'window',              // 'window' glazes, 'door' opens to shadow
    material = SOLID,
    value = FACE.front,
    /* The vernacular chooses the pane's material. Material 6 resolves against
       `ramp2` when the sprite declares one, so a shell whose ramp2 is a
       foliage family glazes in leaves. Such a shell passes its own material
       at the top of its own ramp. */
    glazeMaterial = GLAZE,
    glaze = 0.94,
    sill = true,
    occ = 1,
  } = opts;

  const inner = kind === 'window' ? glazeMaterial : material;
  const innerVal = kind === 'window' ? glaze : value * 0.10;
  for (let fy = fy0; fy <= fy1; fy++) for (let fx = fx0; fx <= fx1; fx++) {
    const p = V.front(fx, fy);
    put(sp, p.x, p.y, inner, innerVal, occ, N_FRONT);
  }
  /* the reveal: head and left jamb in shadow, right jamb catching the sun */
  for (let fx = fx0; fx <= fx1; fx++) {
    const p = V.front(fx, fy0);
    put(sp, p.x, p.y, material, value * 0.18, occ, N_FRONT);
  }
  for (let fy = fy0; fy <= fy1; fy++) {
    const l = V.front(fx0, fy), r = V.front(fx1, fy);
    put(sp, l.x, l.y, material, value * 0.26, occ, N_FRONT);
    put(sp, r.x, r.y, material, Math.min(1, value * 1.55), occ, N_FRONT);
  }
  /* the sill projects, so it is brighter than the wall */
  if (sill && kind !== 'door') for (let fx = fx0 - 1; fx <= fx1 + 1; fx++) {
    const p = V.front(fx, fy1 + 1);
    put(sp, p.x, p.y, material, Math.min(1, value * 1.62), occ, N_FRONT);
  }
}

/* A vertical member, a pile brace, a stair and an arris line belong in this
   module. Vernaculars still paint their own; each arrives here when a second
   vernacular needs it. */

export {
  FACE, GLAZE, M, MEven, N_FRONT, N_SIDE, N_TOP, OPEN, SOLID,
  bayRhythm, cabinet, cabinetBox, courseFit, courseWall, doorPx, eavePx,
  groundFootprint, occlude, opening, put, roofNormal, roofPlane, tiltNormal,
  wallSlab,
};
