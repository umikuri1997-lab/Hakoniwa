import { PX_PER_M } from './scale.js';
import { frameOf } from './skeleton.js';

/* The olm, Proteus anguinus: real animal, life size, no invented law.
   docs/life/HOLLOW.md owns claims and refusals.

   Measured (Weber 2000): 0.20 to 0.30 m, unpigmented, red external gills
   behind the head, eyes under the skin. Swims as an eel, rests under stones.
   Common name "human fish", for its colour: the body is the `skin` ramp.

   No scale invented: OLM_M draws five pixels, over the three-pixel floor
   under which a body does not read. Limbs are under a fifth of a pixel and
   not drawn. */

/* the long end of the adult range */
const OLM_M = 0.30;

const MAT_SKIN = 16;     // the skin ramp, resolved in SPRITE_FS
const MAT_GILL = 10;     // machineSignal rung 0, the one pink the scene holds
const LIGHT = 1.00, MID = 0.66;

const OLM_STATES = Object.freeze({ swim: 4, rest: 1 });
/* Legibility floor, the medium wins: an eel's wave at this length is under
   half a pixel. ROW_M is the sideways reach that moves the body one row
   (PROJECTION.md: a metre of depth is half a metre of rows). */
const ROW_M = 2 / PX_PER_M;
/* Wave travels head to tail: mid-body leads the tail by a quarter cycle,
   neck holds. Rows of sideways reach for [tail, middle]. */
const WAVE = Object.freeze([[1, 0], [0, 1], [-1, 0], [0, -1]]);

/* Authored, no measured speed in hand: a slow cruise, a burst under a
   walker's pace, one wave to half a body length. */
const WAVE_STRIDE_M = OLM_M / 2;
const OLM_SPEED = Object.freeze({ cruise: 0.10 * PX_PER_M, burst: 0.50 * PX_PER_M });
const gaitAt = (speed) => OLM_STATES.swim * speed / (WAVE_STRIDE_M * PX_PER_M);
const OLM_GAIT = Object.freeze({
  cruise: gaitAt(OLM_SPEED.cruise), burst: gaitAt(OLM_SPEED.burst) });

const CANVAS = Object.freeze({ w: 9, h: 7, ax: 4, ay: 3 });

function olmPose(frame = 0, state = 'swim') {
  const f = frameOf(frame, OLM_STATES[state] || 1);
  const [tail, middle] = state === 'swim' ? WAVE[f] : [0, 0];
  const tip = [-OLM_M / 2, tail * ROW_M, 0], mid = [-OLM_M / 6, middle * ROW_M, 0];
  const neck = [OLM_M / 6, 0, 0];
  return {
    /* the tail fin is a tier under the trunk, so the body has a front */
    limbs: [{ pts: [tip, mid], mat: MAT_SKIN, near: MID, far: MID },
      { pts: [mid, neck], mat: MAT_SKIN, near: LIGHT, far: LIGHT }],
    parts: [{ u: OLM_M * 0.4, z: 0, ru: OLM_M * 0.1, rv: 0.02, rz: 0.015,
      mat: MAT_SKIN, shade: LIGHT }],
    /* the gills: one pixel behind the head */
    dots: [{ u: neck[0], z: 0, mat: MAT_GILL, shade: LIGHT }],
  };
}

const OLM_SPEC = Object.freeze({ kind: 'olm', biome: 'hollow',
  states: OLM_STATES, canvas: CANVAS, pose: olmPose,
  mats: [MAT_SKIN, MAT_GILL],
  brief: Object.freeze({
    cause: 'still pools in a sunless cave: the water nothing else here swims in',
    authority: 'Proteus anguinus: 0.20 to 0.30 m, unpigmented, red external gills (Weber 2000)',
    read: 'a pale line in dark water with one pink pixel behind its head',
  }),
  size: Object.freeze({ state: 'rest', length: OLM_M, height: 0.03 }),
  plants: Object.freeze([]) });

export { OLM_GAIT, OLM_M, OLM_SPEC, OLM_SPEED, OLM_STATES };
