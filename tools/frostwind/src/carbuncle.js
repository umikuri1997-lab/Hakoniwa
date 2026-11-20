import { HARE_BODY_M, HARE_SPEC, HARE_STATES, harePose } from './hare.js';
import { LUMEN } from './sprite.js';

/* The carbuncle: fictional animal on the brown hare's body, whole
   (src/hare.js), at life size. The brief states its one law and boundary;
   docs/CANON.md carries the row.

   Authority: a chronicle, a small animal with "a shining mirror on its head,
   like a glowing coal" (Barco Centenera, La Argentina, 1602). It gives no
   body.

   Coat is `geodeRock`, the rock under crystal light: by a crystal the animal
   is the floor's colour and the stone is what shows. */

const MAT_FUR = 1;       // the instance ramp: geodeRock
const MAT_EAR = 17;      // folkDark, the hare's ear tips
const MAT_STONE = LUMEN; // ramp2: amethyst, unlit
/* Stone's reach forward of the crown. Measured failure: at 0.02 the ear
   laid flat in the form covers it, and the animal at rest is dark. */
const BROW_M = 0.05;

function carbunclePose(frame = 0, state = 'lope') {
  const pose = harePose(frame, state);
  const head = pose.parts.at(-1);
  return {
    ...pose,
    /* The hare's scut is a deposit on ramp2, which here is the stone's ramp:
       kept, it would be a second light. The ear tips stay. */
    dots: [...pose.dots.filter((q) => q.mat === MAT_EAR),
      { u: head.u + BROW_M, z: head.z + head.rz, mat: MAT_STONE, shade: 1 }],
  };
}

const CARBUNCLE_SPEC = Object.freeze({ kind: 'carbuncle', biome: 'hollow',
  states: HARE_STATES, canvas: HARE_SPEC.canvas,
  pose: carbunclePose, mats: [MAT_FUR, MAT_EAR, MAT_STONE],
  brief: Object.freeze({
    cause: 'crystals crowd in the geode chamber and round the Heart',
    authority: 'Barco Centenera, La Argentina, 1602, for the animal; Lepus europaeus for the body',
    law: 'the brow stone: one animal grows a crystal on its brow, and it shines as the cave\'s crystals do',
    boundary: Object.freeze(['the body, the bound and the speeds are the brown hare\'s',
      'the stone is one pixel and lights nothing', 'it sits tight, then goes']),
    read: 'one violet-white pixel that moves, over a body the colour of lit geode rock',
  }),
  size: Object.freeze({ state: 'orient', length: HARE_BODY_M, height: 0.62 }),
  plants: Object.freeze([]) });

export { CARBUNCLE_SPEC };
