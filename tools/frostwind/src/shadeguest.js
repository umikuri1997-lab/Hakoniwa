import { HUMAN_M, PX_PER_M } from './scale.js';
import { frameOf, stepPhase } from './skeleton.js';
import { SUN } from './sunlight.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The shade guest. A fictional animal on a real body plan.

   The body is a camel spider's (Solifugae, Galeodes arabs): two forward jaws a
   third of the body long, leg-like pedipalps carried raised, eight legs with
   the hind pair longest, a long segmented abdomen. The behaviour is the
   order's own name: solifugae, "those that flee the sun". It has no venom and
   spins no silk, and neither is claimed.

   ONE INVENTED LAW, the gallery moult: in the still, saturated air of the
   dug gallery a soft cuticle hardens before it collapses, at any size. So the
   animal is ten times the length of the real one, and only where a gallery
   opens. docs/CANON.md carries the row.

   Its boundary is everything the law does not touch:
     - it still cannot stay in the sun. SUN_LIMIT_S is how long it leaves
       shade for, and its range from shade follows from that and its speed;
     - it keeps the real animal's absolute speed, so it gains no pace with
       size (GUEST_SPEED);
     - at the desert's noon a standing person casts a shadow NOON_SHADOW_M
       long, so a person is shade only at the heel. That is the distance it
       follows at, and why it reads as a chase.

   The raster is a projection, never a drawing: the skeleton below is metres
   in the body's own frame, and src/skeleton.js writes all three views from
   it.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Galeodes arabs reaches about 70 mm of body. */
const REAL_BODY_M = 0.070;
const GALLERY_SCALE = 10;
const BODY_M = REAL_BODY_M * GALLERY_SCALE;          // 0.70 m

/* The body as three ellipsoids on one axis: centre u, half-length, half-width,
   half-height, and the height of the centre. Proportions off the real animal:
   jaws 0.28 of body length, prosoma 0.20, abdomen 0.52. */
const BODY = Object.freeze({
  abdomen: Object.freeze({ u: -0.215, ru: 0.185, rv: 0.105, rz: 0.095, z: 0.225 }),
  prosoma: Object.freeze({ u:  0.040, ru: 0.075, rv: 0.085, rz: 0.070, z: 0.220 }),
  jaws:    Object.freeze({ u:  0.200, ru: 0.100, rv: 0.065, rz: 0.060, z: 0.210 }),
});
/* Hip and resting foot of each leg on the left side (the right mirrors v).
   Leg IV is the longest and leg I the thinnest, carried forward as a feeler.
   The knee is out past the body and just over the hip. Projected, a far knee
   then stands over the back and a near knee falls below the belly: the
   arachnid's outline, with the body left uncovered. */
const LEGS = Object.freeze([
  Object.freeze({ hip: [ 0.095, 0.070], foot: [ 0.400, 0.300] }),
  Object.freeze({ hip: [ 0.060, 0.080], foot: [ 0.210, 0.520] }),
  Object.freeze({ hip: [ 0.020, 0.080], foot: [-0.120, 0.580] }),
  Object.freeze({ hip: [-0.020, 0.070], foot: [-0.480, 0.430] }),
]);
const HIP_Z = 0.200, KNEE_Z = 0.270, KNEE_AT = 0.55;
/* The pedipalp: carried forward and raised. `taste` lifts the tip over the
   back, one side then the other. */
const PALP = Object.freeze({
  hip: [0.150, 0.050, 0.220],
  carry: Object.freeze({ elbow: [0.330, 0.130, 0.330], tip: [0.500, 0.110, 0.240] }),
  taste: Object.freeze({ elbow: [0.290, 0.130, 0.420], tip: [0.400, 0.150, 0.560] }),
  rest:  Object.freeze({ elbow: [0.300, 0.110, 0.200], tip: [0.440, 0.090, 0.060] }),
});
const SPAN_M = 2 * Math.max(...LEGS.map((q) => q.foot[1]));   // 1.16 m

/* Alternating tetrapods: legs I and III of one side move with II and IV of
   the other. Four frames are one cycle. */
const GUEST_STATES = Object.freeze({ scuttle: 4, still: 1, greet: 2 });
const STEP_M = 0.075;        // half-excursion of a foot along the heading
const LIFT_M = 0.075;        // swing clearance
const CROUCH_M = 0.085;      // how far the body drops at rest

/* Real solifuges are clocked near 16 km/h in a burst. The law gives no pace
   with size, so that is the dash; the scuttle is its working gait. */
const GUEST_SPEED_MPS = Object.freeze({ scuttle: 1.6, dash: 16 / 3.6 });
const GUEST_SPEED = Object.freeze({
  scuttle: GUEST_SPEED_MPS.scuttle * PX_PER_M,
  dash: GUEST_SPEED_MPS.dash * PX_PER_M,
});
/* Ground covered per cycle: each foot is planted over 2*STEP_M and there are
   two alternating sets. */
const GUEST_CYCLE_PX = 4 * STEP_M * PX_PER_M;
const GUEST_GAIT = Object.freeze({
  scuttle: GUEST_STATES.scuttle * GUEST_SPEED.scuttle / GUEST_CYCLE_PX,
  dash: GUEST_STATES.scuttle * GUEST_SPEED.dash / GUEST_CYCLE_PX,
});

/* Authored, the one free number of the law: seconds in open sun before it
   turns back. Its tether from shade is out and back at the scuttle. */
const SUN_LIMIT_S = 16;
const SUN_TETHER_PX = Math.round(GUEST_SPEED.scuttle * SUN_LIMIT_S / 2);
/* A standing person's shadow at the desert's noon, beyond their own feet. */
const NOON_SHADOW_M = HUMAN_M / Math.tan(SUN.desert.alt);
/* So the only shade a walker gives is at the heel: half a body length. */
const HEEL_PX = Math.round(BODY_M * 0.5 * PX_PER_M);

/* The traveller is noticed at the range the feelers work, followed at the
   heel and dropped at the sun tether. Minutes are the session's semantic
   minutes, as for the machines. */
const GUEST_COMPANION = Object.freeze({
  noticeRadius: 120, greetRadius: 26, abandonRadius: SUN_TETHER_PX,
  followDistance: HEEL_PX,
  approachMinutes: 10, greetMinutes: 3, followMinutes: 12, cooldownMinutes: 90,
});

/* The canvas holds the widest pose: the span head-on and a raised feeler
   seen from behind. */
const CANVAS = Object.freeze({ w: 27, h: 24, ax: 13, ay: 15 });

const MAT_BODY = 6;      // the accent ramp: the desert's one wild hue
const MAT_LIMB = 17;     // folkDark
const MID = 0.60, DARK = 0.20, LIGHT = 1.00;

/* One pose in metres. src/skeleton.js projects and rasters it. */
function guestPose(frame = 0, state = 'scuttle') {
  const still = state === 'still';
  const drop = still ? CROUCH_M : 0;
  const n = GUEST_STATES[state] || 1;
  const f = frameOf(frame, n);
  const limbs = [];
  /* The coxae are ventral: every leg leaves from under the body, so the body
     is laid over all eight and no leg crosses the back. */
  for (const side of [1, -1])
    for (let i = 0; i < LEGS.length; i++) {
      const L = LEGS[i];
      /* sets alternate: I and III of this side with II and IV of the other */
      const setA = (i % 2 === 0) === (side > 0);
      const step = state === 'scuttle' ? stepPhase(f, n, setA ? 0 : 1) : null;
      /* at rest the feet draw in under the knees */
      const tuck = still ? 0.72 : 1;
      const hip = [L.hip[0], side * L.hip[1], HIP_Z - drop];
      const foot = [L.foot[0] * tuck + (step ? STEP_M * step.along : 0),
        side * L.foot[1] * tuck, step ? step.lift * LIFT_M : 0];
      const knee = [hip[0] + (foot[0] - hip[0]) * KNEE_AT,
        hip[1] + (foot[1] - hip[1]) * KNEE_AT, KNEE_Z - drop * 0.4];
      limbs.push({ pts: [hip, knee, foot], mat: MAT_LIMB, near: LIGHT, far: DARK });
    }
  /* the feelers lie on the body: drawn over it on the near side */
  for (const side of [1, -1]) {
    const pose = still ? PALP.rest
      : state === 'greet' && (f === 0) === (side > 0) ? PALP.taste : PALP.carry;
    const at = ([u, v, z]) => [u, side * v, Math.max(0.03, z - drop)];
    limbs.push({ pts: [at(PALP.hip), at(pose.elbow), at(pose.tip)],
      mat: MAT_BODY, near: MID, far: DARK, over: true });
  }
  /* One mid value; two dark rows of segment on the abdomen and a light row
     on the head shield. */
  const part = (name, extra = {}) => ({ ...BODY[name], z: BODY[name].z - drop,
    mat: MAT_BODY, shade: MID, ...extra });
  const parts = [part('abdomen', { seams: [-0.36, 0.30], seamShade: DARK }),
    part('prosoma', { crest: { above: -0.25, shade: LIGHT } }), part('jaws')];
  /* the jaw tips: two dark points where the pincers close */
  const dots = [-1, 1].map((side) => ({ u: BODY.jaws.u + BODY.jaws.ru,
    v: side * 0.030, z: BODY.jaws.z - drop, mat: MAT_LIMB, shade: DARK }));
  return { parts, limbs, dots };
}

const GUEST_SPEC = Object.freeze({ kind: 'shadeguest', biome: 'desert',
  states: GUEST_STATES, canvas: CANVAS, pose: guestPose, mats: [MAT_BODY, MAT_LIMB],
  brief: Object.freeze({
    cause: 'the dug gallery that feeds the gardens opens at the oasis',
    authority: 'Galeodes arabs (Solifugae), 70 mm of body',
    law: 'the gallery moult: a soft cuticle hardens at any size in still saturated air',
    boundary: Object.freeze(['it keeps the real 16 km/h burst', 'it cannot stay in the sun',
      'it has no venom and no silk']),
    read: 'the only wine-red body in the desert, on eight dark legs',
  }),
  /* profile: rear foot to feeler tip, and feet to the far knee */
  size: Object.freeze({ state: 'scuttle', length: 1.06, height: 0.70 }),
  plants: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]) });

export {
  BODY, BODY_M, GUEST_COMPANION, GUEST_CYCLE_PX, GUEST_GAIT,
  GUEST_SPEC, GUEST_SPEED, GUEST_STATES, HEEL_PX, LEGS, NOON_SHADOW_M, SPAN_M,
  SUN_LIMIT_S, SUN_TETHER_PX,
};
