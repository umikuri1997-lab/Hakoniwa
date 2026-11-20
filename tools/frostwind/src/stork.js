import { PX_PER_M } from './scale.js';
import { frameOf, stepPhase } from './skeleton.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The white stork, Ciconia ciconia. A real bird and no invented law.

   Measured (Cramp & Simmons, Birds of the Western Palearctic, vol. 1; del
   Hoyo et al., Handbook of the Birds of the World, vol. 1): 1.00 to 1.15 m
   bill tip to tail, bill 0.14 to 0.19 m, tarsus 0.20 to 0.24 m, white with
   black flight feathers, red bill and legs.

   It is here for the cut sward. Storks walk behind mowers, ploughs and
   grazing stock and take what the disturbance flushes (commensal foraging),
   and this steading cuts hay. So its anchor is the grower's sward, and a
   walker crossing the grass is one more thing to follow at a wary distance.
   The bill clatter with the head thrown back is the species' one display.

   The meadow snap list has no white and no room for one (63 of 64). The body
   takes `loam`, the palest ramp the world declares, which reads white on
   grass. Bill and legs take `accent`; the flight feathers take folkDark.

   The nest is the pole in src/steading.js, with one adult on it. Flight, the
   brood, the change-over at the nest and migration are not drawn and not
   claimed.
   ═══════════════════════════════════════════════════════════════════════════ */

const STORK_LENGTH_M = 1.08;      // bill tip to tail
const STORK_HEIGHT_M = 1.07;      // standing, to the crown
const BILL_M = 0.17;

const MAT_BODY = 1;      // the instance ramp: loam
const MAT_RED = 6;       // accent
const MAT_BLACK = 17;    // folkDark
const LIGHT = 1.00, MID = 0.66;

const BODY = Object.freeze({
  trunk: Object.freeze({ u: -0.03, z: 0.67, ru: 0.225, rv: 0.110, rz: 0.130 }),
  /* the folded primaries: the black rear third */
  wing:  Object.freeze({ u: -0.20, z: 0.63, ru: 0.140, rv: 0.075, rz: 0.080 }),
  head:  Object.freeze({ u:  0.200, z: 1.030, ru: 0.045, rv: 0.035, rz: 0.040 }),
});
const HIP = Object.freeze([-0.03, 0.035, 0.57]);
/* A planted leg is one straight run from hip to foot: a column at rest, a
   slant of a pixel in stance. The hock shows only on the leg in swing,
   where it bends back as the foot lifts (the heron's law in src/animal.js,
   and the people's: a joint is drawn when it moves). */
const HOCK_Z = 0.30, HOCK_BACK = 0.06;

const STORK_STATES = Object.freeze({ stalk: 4, stand: 1, greet: 2 });
/* 0.08 is a slant of one pixel over the leg; at 0.10 a planted leg rounds to
   two jogs and reads as a knee */
const STEP_M = 0.08, LIFT_M = 0.10;
/* a foraging stork paces at about 0.6 m/s and strides out at 1.5 */
const STORK_SPEED = Object.freeze({ stalk: 0.6 * PX_PER_M, stride: 1.5 * PX_PER_M });
const STORK_CYCLE_PX = 4 * STEP_M * PX_PER_M;
const STORK_GAIT = Object.freeze({
  stalk: STORK_STATES.stalk * STORK_SPEED.stalk / STORK_CYCLE_PX,
  stride: STORK_STATES.stalk * STORK_SPEED.stride / STORK_CYCLE_PX,
});
/* Authored: how a stork keeps company with a walker. It follows three metres
   back, where a mower's swath falls, and never at the heel. */
const FOLLOW_M = 3.0;
const STORK_COMPANION = Object.freeze({
  noticeRadius: 150, greetRadius: 64, abandonRadius: 230,
  followDistance: Math.round(FOLLOW_M * PX_PER_M),
  approachMinutes: 12, greetMinutes: 3, followMinutes: 20, cooldownMinutes: 90,
});

const CANVAS = Object.freeze({ w: 17, h: 25, ax: 7, ay: 20 });

function storkPose(frame = 0, state = 'stalk') {
  const n = STORK_STATES[state] || 1;
  const f = frameOf(frame, n);
  /* one value for both legs: a leg that changes tier as it passes the body
     axis flickers */
  const leg = (...pts) => ({ pts, mat: MAT_RED, near: MID, far: MID });
  const limbs = [];
  for (const side of [1, -1]) {
    const hip = [HIP[0], side * HIP[1], HIP[2]];
    /* at rest it stands on one leg, the other folded into the belly */
    if (state === 'stand' && side > 0) {
      limbs.push(leg(hip, [0.03, side * HIP[1], 0.46]));
      continue;
    }
    const step = state === 'stalk' ? stepPhase(f, n, side > 0 ? 0 : 1) : null;
    const foot = [HIP[0] + (step ? STEP_M * step.along : 0), side * HIP[1],
      step ? step.lift * LIFT_M : 0];
    if (!step || step.lift === 0) {
      limbs.push(leg(hip, foot));
      continue;
    }
    /* a bird's visible "knee" is its ankle and bends backward */
    const hock = [(hip[0] + foot[0]) / 2 - HOCK_BACK, side * HIP[1],
      HOCK_Z + step.lift * LIFT_M * 0.6];
    limbs.push(leg(hip, hock, foot));
  }
  /* The head: carried forward and nodding with the step; thrown back over
     the body and brought down again in the clatter. */
  const nod = state === 'stalk' ? 0.025 * stepPhase(f, n, 0).along : 0;
  const head = state === 'greet'
    ? (f === 0 ? { u: -0.06, z: 0.99 } : { u: 0.25, z: 0.90 })
    : { u: BODY.head.u + nod, z: BODY.head.z };
  const bill = state === 'greet' && f === 0
    ? [[head.u - 0.04, 0, head.z + 0.03], [head.u - BILL_M * 0.8, 0, head.z + 0.13]]
    : [[head.u + 0.05, 0, head.z - 0.01], [head.u + 0.05 + BILL_M, 0, head.z - (state === 'greet' ? 0.11 : 0.04)]];
  const neckMid = state === 'greet' && f === 0 ? [0.07, 0, 0.90] : [0.17 + nod * 0.5, 0, 0.88];
  limbs.push({ pts: [[0.12, 0, 0.72], neckMid, [head.u, 0, head.z]],
    mat: MAT_BODY, near: LIGHT, far: LIGHT, over: true });
  limbs.push({ pts: bill, mat: MAT_RED, near: MID, far: MID, over: true });
  const parts = [
    { ...BODY.trunk, mat: MAT_BODY, shade: LIGHT },
    { ...BODY.wing, mat: MAT_BLACK, shade: LIGHT },
    { ...BODY.head, u: head.u, z: head.z, mat: MAT_BODY, shade: LIGHT },
  ];
  return { parts, limbs, dots: [] };
}

const STORK_SPEC = Object.freeze({ kind: 'stork', biome: 'meadow',
  states: STORK_STATES, canvas: CANVAS, pose: storkPose,
  mats: [MAT_BODY, MAT_RED, MAT_BLACK],
  brief: Object.freeze({
    cause: 'the steading cuts hay, and storks follow what flushes the grass',
    authority: 'Ciconia ciconia: 1.00 to 1.15 m long, bill 0.14 to 0.19 m',
    read: 'the palest body in the meadow, on red legs, with a black rear',
  }),
  /* profile: wing tip to bill tip, and feet to crown */
  size: Object.freeze({ state: 'stand', length: 0.80, height: STORK_HEIGHT_M }),
  plants: Object.freeze([0, 1]) });

export {
  BILL_M, FOLLOW_M, STORK_COMPANION, STORK_CYCLE_PX, STORK_GAIT, STORK_HEIGHT_M,
  STORK_LENGTH_M, STORK_SPEC, STORK_SPEED, STORK_STATES,
};
