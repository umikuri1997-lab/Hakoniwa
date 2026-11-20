/* ═══════════════════════════════════════════════════════════════════════════
   Building lab, in a terminal, sibling of tools/trees.mjs.

   Shows whether a building has a top and a side face. No build, no browser,
   no atlas. It calls the makers as bakeWorldAtlas does.

     node tools/houses.mjs                  every building, every variant
     node tools/houses.mjs house            one maker, all variants
     node tools/houses.mjs house 1          one maker, one variant
     node tools/houses.mjs house 0 --faces  which normal each pixel carries
     node tools/houses.mjs house 0 --value  the face value, from the ao channel

   MATERIALS:  . empty   # solid   * deposit   b bark   o glazing   : open timber
               d door (trunk)   L luminous
   FACES:      F front   T top     S side      ? something else

   --value reads `ao`, not `shade`: the atlas packs thickness into channel b
   for materials 1, 3, 9 and 12, and the wood branch of the sprite shader
   resolves posterise(lit * ao). For a building, nothing reads shade.

   --faces: a building that prints no T and no S is a rectangle.
   ═══════════════════════════════════════════════════════════════════════════ */

import { RNG } from '../src/rng.js';
import { makeCabin } from '../src/cabin.js';
import { HOUSE_SCALE, makeDerelict, makeHouse } from '../src/steading.js';
import { makePillar, makeRuinWall, PILLAR_VARIANTS, WALL_VARIANTS } from '../src/ruins.js';
import { makeSwampHouse } from '../src/swamp-settlement.js';
import { makeHouseLadder, makeLakeHouse } from '../src/swamp-lakehouse.js';
import { makePavilion } from '../src/pavilion.js';
import { HUT_VARIANTS, makeHut } from '../src/desert-hamlet.js';
import { TENT_VARIANTS, makeTent } from '../src/desert-camp.js';
import { CAP_HOUSE_VARIANTS, makeCapHouse, makeCutBench, makeLampPost } from '../src/hollow-village.js';
import { faceOf as castFace } from '../test/archcast.mjs';
import { PLAYER_H, PX_PER_M } from '../src/scale.js';

const SEED = 20260727;

/* One row per maker. */
const CAST = {
  house: { n: HOUSE_SCALE.length, make: (v) => makeHouse(new RNG(SEED ^ (0x4075e + v)), v) },
  cabin: { n: 3, make: (v) => makeCabin(new RNG(SEED ^ (0xcab0 + v)), v) },
  swampHouse: { n: 3, make: (v) => makeSwampHouse(new RNG(SEED ^ v), v) },
  derelict: { n: 1, make: () => makeDerelict(new RNG(SEED ^ 0x0de1)) },
  pillar: { n: PILLAR_VARIANTS.length, make: (v) => makePillar(new RNG(17 + v), PILLAR_VARIANTS[v]) },
  ruinWall: { n: WALL_VARIANTS.length, make: (v) => makeRuinWall(WALL_VARIANTS[v]) },
  lakeHouse: { n: 1, make: () => makeLakeHouse(null, 0) },
  houseLadder: { n: 1, make: () => makeHouseLadder() },
  pavilion: { n: 1, make: () => makePavilion(null, 0) },
  hut: { n: HUT_VARIANTS.length, make: (v) => makeHut(new RNG(SEED ^ (0x407a + v)), v) },
  tent: { n: TENT_VARIANTS.length, make: (v) => makeTent(new RNG(SEED ^ (0x7e07 + v)), v) },
  capHouse: { n: CAP_HOUSE_VARIANTS.length, make: (v) => makeCapHouse(null, v) },
  lampPost: { n: 1, make: () => makeLampPost() },
  cutBench: { n: 1, make: () => makeCutBench() },
};

const MAT = { 0: '.', 1: '#', 2: '*', 3: 'b', 4: 'd', 6: 'o', 12: ':', 19: 'L' };
const VAL = ' .:-=+*#%@';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const rest = args.filter((a) => !a.startsWith('--'));
const mode = flags.has('--faces') ? 'faces' : flags.has('--value') ? 'value' : 'mat';

const names = rest[0] ? [rest[0]] : Object.keys(CAST);
for (const n of names) {
  if (!CAST[n]) {
    console.error(`unknown building "${n}" — the cast is ${Object.keys(CAST).join(', ')}`);
    process.exit(1);
  }
}

/* The face classifier is test/archcast.mjs's own, so the lab agrees with the
   check it explains. A second copy prints 2213 cabin pixels as `?` while
   archcast counts them as depth. */
const LETTER = { front: 'F', top: 'T', side: 'S' };
const faceOf = (sp, i) => LETTER[castFace(sp, i)] || '?';

for (const name of names) {
  const spec = CAST[name];
  const vs = rest[1] !== undefined ? [+rest[1]] : [...Array(spec.n).keys()];
  for (const v of vs) {
    const sp = spec.make(v);
    const tally = { F: 0, T: 0, S: 0, '?': 0 };
    for (let i = 0; i < sp.w * sp.h; i++) if (sp.occ[i]) tally[faceOf(sp, i)]++;
    const occupied = sp.occ.reduce((n, m) => n + (m ? 1 : 0), 0);

    console.log(`\n${name}:${v}  ${sp.w}x${sp.h}px`
      + `  = ${(sp.w / PX_PER_M).toFixed(2)}x${(sp.h / PX_PER_M).toFixed(2)} m`
      + `  ${(sp.h / PLAYER_H).toFixed(2)}x the traveller`
      + `  ramp ${sp.ramp}/${sp.ramp2 || '-'}  anchor ${sp.ax},${sp.ay}`);
    /* Form that survives the bake: shade is dead for building materials and
       the wood branch resolves posterise(lit * ao), so a shell whose ao is
       one number renders as one flat rung. */
    const solid = [];
    for (let i = 0; i < sp.w * sp.h; i++)
      if (sp.occ[i] === 1 || sp.occ[i] === 3 || sp.occ[i] === 12) solid.push(i);
    const spread = (get) => {
      if (!solid.length) return 0;
      const v = solid.map(get);
      return Math.max(...v) - Math.min(...v);
    };
    const aoSpread = spread((i) => sp.ao[i]);
    const shSpread = spread((i) => sp.shade[i]);
    const levels = new Set(solid.map((i) => Math.min(3, Math.floor(sp.ao[i] * 4)))).size;

    console.log(`  ${occupied} px   front ${tally.F}  top ${tally.T}  side ${tally.S}`
      + `  other ${tally['?']}`
      + (tally.T === 0 && tally.S === 0 ? '   <-- FLAT: no depth face' : ''));
    console.log(`  renders: ao spread ${aoSpread.toFixed(2)} over ${levels} rung band(s)`
      + `   dead shade spread ${shSpread.toFixed(2)}`
      + (aoSpread < 0.25 && shSpread > 0.4
        ? '   <-- FORM IS IN THE DEAD CHANNEL: authored in shade, renders flat' : ''));

    const lines = [];
    for (let y = 0; y < sp.h; y++) {
      let row = '';
      for (let x = 0; x < sp.w; x++) {
        const i = y * sp.w + x;
        if (!sp.occ[i]) { row += mode === 'mat' ? '.' : ' '; continue; }
        row += mode === 'faces' ? faceOf(sp, i)
          : mode === 'value' ? VAL[Math.min(9, Math.round(sp.ao[i] * 9))]
            : (MAT[sp.occ[i]] || '?');
      }
      lines.push('  ' + row.replace(/\s+$/, ''));
    }
    console.log(lines.join('\n'));
  }
}
