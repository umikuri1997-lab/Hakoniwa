import { PX_PER_M } from './scale.js';
import { frameOf, scalePose } from './skeleton.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The lamp snail. A fictional animal made of two real ones.

   The body is the giant African land snail's (Lissachatina fulica), whose
   shell reaches 0.20 m on a foot of 0.30 m. The light is the organ of
   Quantula striata, the one land snail known to glow: it flashes green from
   its head.

   ONE INVENTED LAW, kept foxfire: it eats the glowing fungus of rotting wood
   and keeps the light, as glow and as growth. So the small snail's flash is
   in the large snail's body, the body is KEPT_SCALE times the real one, and
   it lives where the dead wood is. docs/CANON.md carries the row.

   Its boundary is what the law does not touch:
     - it moves at a snail's pace, 1 cm a second, which at this scale is no
       motion you can see. It changes place while you are away;
     - it flashes; it does not shine. One frame in two is dark;
     - touched or crowded it withdraws, and a withdrawn snail shows no light.

   The light is the machines' signal ramp, the one glow the palette holds. On
   a machine the green means a greeting; here it is the only thing lit in a
   swamp under rain.
   ═══════════════════════════════════════════════════════════════════════════ */

const REAL_SHELL_M = 0.20, REAL_FOOT_M = 0.30;
/* The smallest half-step at which the shell holds one seam and the lamp is
   its own pixel: a shell of 0.30 m, five pixels. Measured failure: at 2.5
   the snail stood a third of the traveller's height and outsized the turtle. */
const KEPT_SCALE = 1.5;
const SHELL_M = REAL_SHELL_M * KEPT_SCALE, FOOT_M = REAL_FOOT_M * KEPT_SCALE;   // 0.30, 0.45
/* The pose table below is written at 2.5 times life and drawn at K of it. */
const K = KEPT_SCALE / 2.5;

const MAT_SHELL = 1;     // the instance ramp: warm
const MAT_FOOT = 2;      // ramp2: birch, the pale wet body
const MAT_LAMP = 11;     // machineSignal, green
const LIGHT = 1.00, MID = 0.66, DARK = 0.33;

/* Two frames a state: lit and dark. A pedal wave moves the foot by under a
   pixel at this scale, so the glide is the reach of the head and the flash. */
const SNAIL_STATES = Object.freeze({ glide: 2, rest: 2, hide: 1 });
const WAVE = Object.freeze([0.07, 0.00]);
const SNAIL_SPEED = 0.01 * PX_PER_M;               // 1 cm/s
const SNAIL_GAIT = SNAIL_STATES.glide * SNAIL_SPEED / (0.05 * PX_PER_M);

const CANVAS = Object.freeze({ w: 13, h: 13, ax: 6, ay: 8 });

function snailPose(frame = 0, state = 'glide') {
  const n = SNAIL_STATES[state] || 1;
  const f = frameOf(frame, n);
  const hidden = state === 'hide';
  const stretch = state === 'glide' ? WAVE[f] : 0;
  const lit = !hidden && f % 2 === 0;
  const parts = [], limbs = [], dots = [];
  if (!hidden) {
    parts.push({ u: stretch * 0.5, z: 0.07, ru: 0.375 + stretch * 0.5, rv: 0.11, rz: 0.07,
      mat: MAT_FOOT, shade: MID });
    const headU = 0.375 + stretch - 0.05;
    /* the two upper tentacles; the lamp sits in the head under them */
    for (const side of [1, -1])
      limbs.push({ pts: [[headU, side * 0.04, 0.13], [headU + 0.07, side * 0.11, 0.30]],
        mat: MAT_FOOT, near: LIGHT, far: MID, over: true });
    if (lit) for (const du of [0, -0.065])
      dots.push({ u: headU + du, z: 0.10, mat: MAT_LAMP, shade: LIGHT });
  }
  /* the shell rides the back half, and sits on the ground when it is all
     there is */
  parts.push({ u: hidden ? 0 : -0.08, z: hidden ? 0.21 : 0.28, ru: 0.25, rv: 0.18,
    rz: 0.21, mat: MAT_SHELL, shade: MID, seams: [-0.25, 0.35], seamShade: DARK,
    crest: { above: -0.45, shade: LIGHT } });
  /* 2.5 times life to KEPT_SCALE */
  return scalePose({ parts, limbs, dots }, K);
}

const SNAIL_SPEC = Object.freeze({ kind: 'lampsnail', biome: 'swamp',
  states: SNAIL_STATES, canvas: CANVAS, pose: snailPose,
  mats: [MAT_SHELL, MAT_FOOT, MAT_LAMP],
  brief: Object.freeze({
    cause: 'dead wood rots wet here, and glowing fungus grows on it',
    authority: 'Lissachatina fulica for the body (shell to 0.20 m); Quantula striata for the light',
    law: 'kept foxfire: it eats the glowing fungus of rotting wood and keeps the light, as glow and as growth',
    boundary: Object.freeze(['it moves at a snail\'s 1 cm a second', 'it flashes and does not shine',
      'withdrawn, it shows no light']),
    read: 'the one green light in the swamp, blinking at ground level',
  }),
  size: Object.freeze({ state: 'rest', length: FOOT_M + 0.03, height: SHELL_M }),
  plants: Object.freeze([]) });

export { KEPT_SCALE, REAL_SHELL_M, SHELL_M, SNAIL_GAIT, SNAIL_SPEC, SNAIL_SPEED,
  SNAIL_STATES };
