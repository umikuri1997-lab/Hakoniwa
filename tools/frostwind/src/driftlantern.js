import { PX_PER_M } from './scale.js';
import { frameOf } from './skeleton.js';
import { LUMEN } from './sprite.js';

/* The drift lantern: fictional animal on the glowworm's body. The brief
   states its one law and boundary; docs/CANON.md carries the row.

   Arachnocampa luminosa: larva 30 to 40 mm, glows blue-green near 487 nm
   (Johnson & Haneda 1966) from a mucus hammock on a cave roof, lets down
   sticky snares to 0.5 m in still cave air (Science Learning Hub 2017).
   The hammock is the bell, off the roof, snares trailing under it.

   LANTERN_SCALE: smallest whole factor at which the bell draws three pixels
   (0.175 m at 15.3 px/m), the floor under which a bell has no rim. The law
   grows the body only: snares keep their real length. */

const REAL_BODY_M = 0.035;
const LANTERN_SCALE = 5;
const BELL_M = REAL_BODY_M * LANTERN_SCALE;        // 0.175 m

/* Heights are whole rows, so the bell is the same two rows at every height. */
const ROW_M = 1 / PX_PER_M;
/* Two snares, root to tip: 0.33 and 0.20 m, inside the real 0.5 m. */
const THREAD_M = Object.freeze([5 * ROW_M, 3 * ROW_M]);
/* Lamp height. Moored, the long thread's tip is on the floor. Adrift, the
   lamp rides at 0.65 m, the traveller's hip. */
const MOOR_M = THREAD_M[0] + ROW_M, FLOAT_M = 10 * ROW_M;
/* Adrift, a snare's tip hangs this far behind its root per metre of thread. */
const TRAIL = 0.40;

const MAT_THREAD = 1;    // the instance ramp: glowcap, lit by the cave
const MAT_GLOW = LUMEN;  // ramp2: glowcap, unlit. Its value is a rung.
const LAMP = 1.00, BELL = 0.66, THREAD = 0.40;

/* Two frames a state: bell open, then its mouth drawn in. Measured failure:
   a bell drawn in to one column and dimmed leaves a white pixel on two dark
   threads for half of every second. */
const LANTERN_STATES = Object.freeze({ drift: 2, moor: 2 });
const PULSE_HZ = 1;
const LANTERN_SPEED = 0.15 * PX_PER_M;
const LANTERN_GAIT = LANTERN_STATES.drift * PULSE_HZ;

const CANVAS = Object.freeze({ w: 9, h: 16, ax: 5, ay: 13 });

function lanternPose(frame = 0, state = 'drift') {
  const open = frameOf(frame, LANTERN_STATES[state] || 1) === 0;
  const drift = state === 'drift';
  const z = drift ? FLOAT_M : MOOR_M, root = z - ROW_M;
  return {
    /* one snare off the rear rim on the left, one off the fore rim on the right */
    limbs: [[-1, 1, THREAD_M[0]], [1, -1, THREAD_M[1]]].map(([fore, side, len]) => {
      const u = fore * 0.06, v = side * 0.05;
      return { pts: [[u, v, root], [u - (drift ? len * TRAIL : 0), v, root - len]],
        mat: MAT_THREAD, near: THREAD, far: THREAD };
    }),
    /* a one-pixel crown over the bell: two rows open, the upper row drawn in */
    parts: [{ u: 0, z: z + (open ? ROW_M / 2 : ROW_M), ru: BELL_M / 2, rv: BELL_M / 2,
      rz: 0.03, mat: MAT_GLOW, shade: BELL }],
    dots: [{ u: 0, z: z + 2 * ROW_M, mat: MAT_GLOW, shade: BELL },
      /* the lamp sits in the mouth of the bell */
      { u: 0, z, mat: MAT_GLOW, shade: LAMP }],
  };
}

const LANTERN_SPEC = Object.freeze({ kind: 'driftlantern', biome: 'hollow',
  states: LANTERN_STATES, canvas: CANVAS, pose: lanternPose,
  mats: [MAT_THREAD, MAT_GLOW],
  brief: Object.freeze({
    cause: 'the cave air does not move, and the glowcaps draw what flies',
    authority: 'Arachnocampa luminosa: a 30 to 40 mm larva, light near 487 nm, snares to 0.5 m',
    law: 'the still float: in air that does not move, one animal is lighter than the air and hangs in it',
    boundary: Object.freeze(['its pulse is its whole thrust, so moving air carries it off',
      'the light and the snares are the glowworm\'s', 'it rests moored by its long thread']),
    read: 'a teal bell at hip height with a white core, trailing two threads',
  }),
  /* profile, moored: the bell's width, and floor to crown */
  size: Object.freeze({ state: 'moor', length: BELL_M, height: MOOR_M + 3 * ROW_M }),
  plants: Object.freeze([]) });

export {
  BELL_M, LANTERN_GAIT, LANTERN_SCALE, LANTERN_SPEC, LANTERN_SPEED,
  LANTERN_STATES, REAL_BODY_M, THREAD_M,
};
