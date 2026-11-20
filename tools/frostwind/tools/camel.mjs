/* THE CAMEL LAB. Sibling of tools/person.mjs, for the one figure that is two
   sprites on one ground anchor: the Amber Waste camel and the traveller riding
   it. Prints occupancy by material so a raster decision can be checked without
   a build, a browser or an atlas.

     node tools/camel.mjs                     profile walk, every frame
     node tools/camel.mjs --dir 0 --state idle
     node tools/camel.mjs --frame 2 --no-rider

   `#` is coat, `o` the pale throat, `@` the traveller, `S` the saddle tree and
   boots, `R` the dyed rug. */

import { CAMEL_STATES } from '../src/body-camel.js';
import { camelRiderSeat, makeCamel } from '../src/figure-camel.js';
import { makeMountedFolk } from '../src/figure-folk.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const dir = Number(opt('dir', 2));
const state = opt('state', 'walk');
const withRider = !args.includes('--no-rider');
const only = args.indexOf('--frame') >= 0 ? Number(opt('frame', 0)) : null;

const GLYPH = { 2: 'o', 17: 'S', 18: 'R' };

function compose(frame) {
  const camel = makeCamel(null, frame, dir, state);
  const rider = withRider
    ? makeMountedFolk('desertTraveller', dir, frame, state, 'neutral',
      camelRiderSeat(frame, dir, state))
    : null;
  const parts = [camel, ...(rider ? [rider] : [])];
  const ax = Math.max(...parts.map((p) => p.ax));
  const ay = Math.max(...parts.map((p) => p.ay));
  const w = ax + Math.max(...parts.map((p) => p.w - p.ax));
  const h = ay + Math.max(...parts.map((p) => p.h - p.ay));
  const grid = Array.from({ length: h }, () => Array(w).fill('.'));
  for (const p of parts)
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const m = p.occ[y * p.w + x];
      if (!m) continue;
      grid[ay + y - p.ay][ax + x - p.ax] =
        GLYPH[m] || (p === camel ? '#' : '@');
    }
  return grid;
}

const frames = only === null
  ? [...Array(CAMEL_STATES[state] || 1).keys()]
  : [only];
for (const f of frames) {
  const grid = compose(f);
  const top = grid.findIndex((row) => row.some((c) => c !== '.'));
  console.log(`\n${state} dir${dir} frame ${f}`);
  console.log(grid.slice(top).map((row, i) =>
    String(i + top).padStart(2) + '|' + row.join('')).join('\n'));
}
