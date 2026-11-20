import { PX_PER_M } from './scale.js';
import { frameOf, stepPhase } from './skeleton.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The brown hare, Lepus europaeus. A real animal and no invented law.

   Measured (Macdonald & Barrett, Mammals of Britain and Europe; Schai-Braun
   & Hackländer in Handbook of the Mammals of the World, vol. 6): head and
   body 0.52 to 0.70 m, ear 0.10 to 0.14 m with a black tip, hind foot 0.12
   to 0.15 m, a burst near 70 km/h and bounds of 2.5 m and more.

   It is here for the open sward. A hare has no burrow: by day it lies in a
   form, a body-length hollow in the grass, ears flat along the back, and
   sits tight until a walker is almost on it. Then it goes. At the pinned
   noon that is all it does, so the meadow's hare is a lump you do not see
   and a streak you do.

   Three states are the three things it does: `form` (down, ears flat),
   `orient` (up, ears raised), `lope` (the bound).

   Leverets, boxing, home range and population density are not claimed.
   ═══════════════════════════════════════════════════════════════════════════ */

const HARE_BODY_M = 0.60;
const EAR_M = 0.13;
const EAR_SPREAD_M = 0.085;      // half the gap between raised ear tips

const MAT_FUR = 1;       // the instance ramp: timber
const MAT_PALE = 2;      // ramp2: loam, the scut
const MAT_BLACK = 17;    // folkDark, the ear tips
const LIGHT = 1.00, MID = 0.66, DARK = 0.33;

const BODY = Object.freeze({
  haunch: Object.freeze({ u: -0.13, z: 0.170, ru: 0.140, rv: 0.085, rz: 0.115 }),
  /* rv is the haunch's: at 0.070 the chest is one column head-on and the
     head stands on a stalk */
  chest:  Object.freeze({ u:  0.07, z: 0.150, ru: 0.130, rv: 0.085, rz: 0.085 }),
  /* Legibility floor: the real head is 0.09 m across, one column. At 0.080
     of half-width it draws three, and stops reading as a neck. */
  head:   Object.freeze({ u:  0.225, z: 0.250, ru: 0.065, rv: 0.080, rz: 0.050 }),
});
const HARE_STATES = Object.freeze({ lope: 4, form: 1, orient: 1 });
const CROUCH_M = 0.055, RISE_M = 0.06, STEP_M = 0.09;
/* One bound in four: hind push, extended flight, fore landing, gathered
   flight. Each row is how far the haunch and the chest ride above standing,
   so the back pitches through the cycle and no two frames are one shape
   head-on. */
const BOUND = Object.freeze([[0, 0], [0.05, 0.05], [0.06, -0.01], [0.02, 0.06]]);

/* A lope covers 0.6 m a bound; a flushed hare covers 2.5 m. The dash is
   50 km/h, under the measured burst: the 70 is a few seconds on a road. */
const LOPE_STRIDE_M = 0.6, DASH_STRIDE_M = 2.5;
const HARE_SPEED = Object.freeze({ lope: 2.0 * PX_PER_M, dash: 50 / 3.6 * PX_PER_M });
const HARE_GAIT = Object.freeze({
  lope: HARE_STATES.lope * HARE_SPEED.lope / (LOPE_STRIDE_M * PX_PER_M),
  dash: HARE_STATES.lope * HARE_SPEED.dash / (DASH_STRIDE_M * PX_PER_M),
});

const CANVAS = Object.freeze({ w: 15, h: 16, ax: 7, ay: 11 });

function harePose(frame = 0, state = 'lope') {
  const n = HARE_STATES[state] || 1;
  const f = frameOf(frame, n);
  const down = state === 'form';
  const [rear, front] = state === 'lope' ? BOUND[f] : [0, 0];
  const dz = (down ? -CROUCH_M : 0) + front;
  const dzRear = (down ? -CROUCH_M : 0) + rear;
  const rise = state === 'orient' ? RISE_M : 0;
  const limbs = [];
  if (!down) for (const side of [1, -1]) {
    /* hind pair and fore pair move together, half a cycle apart */
    const hind = state === 'lope' ? stepPhase(f, n, 0) : null;
    const fore = state === 'lope' ? stepPhase(f, n, 1) : null;
    limbs.push({ pts: [[0.12, side * 0.05, 0.10 + dz],
      [0.15 + (fore ? STEP_M * fore.along : 0), side * 0.05, fore ? fore.lift * 0.05 : 0]],
      mat: MAT_FUR, near: DARK, far: DARK });
    limbs.push({ pts: [[-0.16, side * 0.07, 0.12 + dzRear], [-0.24, side * 0.07, 0.08 + dzRear * 0.5],
      [-0.10 + (hind ? STEP_M * hind.along : 0), side * 0.07, hind ? hind.lift * 0.05 : 0]],
      mat: MAT_FUR, near: DARK, far: DARK });
  }
  const head = { u: BODY.head.u - (down ? 0.02 : 0), z: BODY.head.z + dz + rise };
  /* the neck: a raised head leaves the chest by a pixel in the axial views */
  limbs.push({ pts: [[0.13, 0, 0.19 + dz], [head.u - 0.02, 0, head.z - 0.02]],
    mat: MAT_FUR, near: MID, far: MID });
  /* Ears: raised a body-eighth over the crown, or laid flat along the back
     in the form, which is what makes the form a lump. */
  for (const side of [1, -1]) {
    /* raised ears stand apart in a V: at one column they are an antenna */
    const base = [head.u - 0.03, side * 0.035, head.z + 0.04];
    const tip = down ? [head.u - 0.03 - EAR_M, side * 0.03, head.z + 0.045]
      : [head.u - 0.07, side * EAR_SPREAD_M, head.z + 0.04 + EAR_M];
    /* a tier under the coat, or a raised ear is lost against the haunch */
    limbs.push({ pts: [base, tip], mat: MAT_FUR, near: DARK, far: DARK, over: true });
  }
  const parts = [
    { ...BODY.haunch, z: BODY.haunch.z + dzRear, mat: MAT_FUR, shade: MID,
      crest: { above: -0.35, shade: LIGHT } },
    { ...BODY.chest, z: BODY.chest.z + dz + rise * 0.5, mat: MAT_FUR, shade: MID },
    { ...BODY.head, u: head.u, z: head.z, mat: MAT_FUR, shade: LIGHT },
  ];
  const dots = [{ u: -0.275, z: 0.20 + dzRear, mat: MAT_PALE, shade: LIGHT }];
  if (!down) for (const side of [1, -1])
    dots.push({ u: head.u - 0.07, v: side * EAR_SPREAD_M, z: head.z + 0.04 + EAR_M,
      mat: MAT_BLACK, shade: DARK });
  return { parts, limbs, dots };
}

const HARE_SPEC = Object.freeze({ kind: 'hare', biome: 'meadow',
  states: HARE_STATES, canvas: CANVAS, pose: harePose,
  mats: [MAT_FUR, MAT_PALE, MAT_BLACK],
  brief: Object.freeze({
    cause: 'open quiet sward: a hare has no burrow and lies in the grass',
    authority: 'Lepus europaeus: head and body 0.52 to 0.70 m, ear 0.10 to 0.14 m',
    read: 'a brown lump that becomes two raised black-tipped ears',
  }),
  /* the profile box: near feet a row under the ground line, to the ear tips */
  size: Object.freeze({ state: 'orient', length: HARE_BODY_M, height: 0.62 }),
  plants: Object.freeze([]) });

export {
  DASH_STRIDE_M, EAR_M, HARE_BODY_M, HARE_GAIT, HARE_SPEC, HARE_SPEED, HARE_STATES,
  harePose,
};
