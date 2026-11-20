import { PX_PER_M } from './scale.js';
import { frameOf, scalePose } from './skeleton.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The skimmer. A fictional animal on a real body plan.

   The body is a water strider's: Gigantometra gigas (Gerridae), the largest
   known, 36 mm of body on middle legs that span over 200 mm. Three pairs do
   three jobs and the silhouette shows it: short forelegs that hold prey,
   long middle legs that row, hind legs that steer.

   ONE INVENTED LAW, the held film: the surface of still water does not break
   under its feet, whatever it weighs. A real strider stands on surface
   tension, which carries weight in proportion to wetted leg length while
   weight grows with the cube of size; at five times the length the film
   fails twenty-five times over. docs/CANON.md carries the row.

   FILM_SCALE is the smallest whole factor at which the body draws three
   pixels long (0.18 m at 15.3 px/m), the floor under which the cross has no
   centre. Measured failure: at 10 the animal spanned 2.0 m, wider than the
   traveller is tall, and read as a monster on a pool 4 m across.

   Its boundary is what the law does not touch:
     - there is no film on land or on a weed mat, so open water is the whole
       of where it can be, and the bank is a wall;
     - it keeps the real animal's speeds, a burst near 1.5 m/s;
     - it rows: one stroke of the middle pair, then a glide. The legs are not
       feet and it cannot walk.

   Each planted foot stands in a dimple, and the light on the dimple's rim is
   the one pale mark on the animal.
   ═══════════════════════════════════════════════════════════════════════════ */

const REAL_BODY_M = 0.036;
const FILM_SCALE = 5;
const BODY_M = REAL_BODY_M * FILM_SCALE;           // 0.18 m
/* The real span to body ratio, 200 mm on 36: middle foot to middle foot. */
const SPAN_M = BODY_M * 200 / 36;                  // 1.0 m
/* The pose table below is written at ten times life and drawn at K of it,
   so the proportions are the animal's at any FILM_SCALE. */
const K = FILM_SCALE / 10;

const MAT_BODY = 4;      // the trunk ramp: wet dark chitin
const MAT_LIMB = 17;     // folkDark
const MAT_GLINT = 1;     // the instance ramp: birch, the dimple's rim
const MID = 0.60, DARK = 0.20, LIGHT = 1.00;

const BODY = Object.freeze({
  abdomen: Object.freeze({ u: -0.125, z: 0.085, ru: 0.105, rv: 0.030, rz: 0.030 }),
  thorax:  Object.freeze({ u:  0.030, z: 0.090, ru: 0.090, rv: 0.040, rz: 0.038 }),
  head:    Object.freeze({ u:  0.125, z: 0.090, ru: 0.035, rv: 0.030, rz: 0.028 }),
});
const SKIMMER_STATES = Object.freeze({ row: 4, drift: 1 });
/* The middle foot's reach along the heading in the four frames of a stroke:
   catch, drive, finish, and the recovery carried clear of the water. */
const STROKE = Object.freeze([0.30, 0.00, -0.30, 0.00]);
const RECOVER = 3, RECOVER_Z = 0.07;

/* It cruises on one stroke and a glide of 0.6 m, and bursts at the real
   animal's 1.5 m/s. */
const GLIDE_M = 0.6 * K;
const SKIMMER_SPEED = Object.freeze({ cruise: 0.3 * PX_PER_M, burst: 1.5 * PX_PER_M });
const SKIMMER_GAIT = Object.freeze({
  cruise: SKIMMER_STATES.row * SKIMMER_SPEED.cruise / (GLIDE_M * PX_PER_M),
  burst: SKIMMER_STATES.row * SKIMMER_SPEED.burst / (GLIDE_M * PX_PER_M),
});

const CANVAS = Object.freeze({ w: 19, h: 13, ax: 9, ay: 6 });

function skimmerPose(frame = 0, state = 'row') {
  const n = SKIMMER_STATES[state] || 1;
  const f = frameOf(frame, n);
  const reach = state === 'row' ? STROKE[f] : 0;
  const lifted = state === 'row' && f === RECOVER;
  const limbs = [], dots = [];
  const foot = (p) => { dots.push({ u: p[0], v: p[1], z: 0, mat: MAT_GLINT, shade: LIGHT }); return p; };
  for (const side of [1, -1]) {
    limbs.push({ pts: [[0.10, side * 0.03, 0.08], foot([0.24, side * 0.10, 0])],
      mat: MAT_LIMB, near: LIGHT, far: DARK });
    const mid = [0.03 + reach, side * 1.0, lifted ? RECOVER_Z : 0];
    limbs.push({ pts: [[0.03, side * 0.035, 0.09], [0.03 + reach * 0.5, side * 0.45, 0.14],
      lifted ? mid : foot(mid)], mat: MAT_LIMB, near: LIGHT, far: DARK });
    limbs.push({ pts: [[-0.04, side * 0.03, 0.09], [-0.25, side * 0.30, 0.12],
      foot([-0.55, side * 0.55, 0])], mat: MAT_LIMB, near: LIGHT, far: DARK });
  }
  const parts = ['abdomen', 'thorax', 'head'].map((name) =>
    ({ ...BODY[name], mat: MAT_BODY, shade: name === 'thorax' ? LIGHT : MID }));
  /* ten times life to FILM_SCALE */
  return scalePose({ parts, limbs, dots }, K);
}

const SKIMMER_SPEC = Object.freeze({ kind: 'skimmer', biome: 'swamp',
  states: SKIMMER_STATES, canvas: CANVAS, pose: skimmerPose,
  mats: [MAT_BODY, MAT_LIMB, MAT_GLINT],
  brief: Object.freeze({
    cause: 'the flooded forest is open still water that nothing else here walks on',
    authority: 'Gigantometra gigas (Gerridae): 36 mm of body, middle legs spanning 200 mm',
    law: 'the held film: still water does not break under its feet, whatever it weighs',
    boundary: Object.freeze(['no film on land or on a weed mat, so the bank is a wall',
      'it keeps the real 1.5 m/s burst', 'it rows and cannot walk']),
    read: 'a dark cross on the water, a metre across, with a pale glint at each foot',
  }),
  /* profile: hind foot to fore foot, and near foot to far foot in rows */
  size: Object.freeze({ state: 'drift', length: 0.79 * K, height: 1.14 * K }),
  plants: Object.freeze([0, 1, 2, 3, 4, 5]) });

export {
  BODY_M, FILM_SCALE, REAL_BODY_M, SKIMMER_GAIT, SKIMMER_SPEC,
  SKIMMER_SPEED, SKIMMER_STATES, SPAN_M,
};
