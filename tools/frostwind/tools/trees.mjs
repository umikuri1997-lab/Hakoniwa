/* ═══════════════════════════════════════════════════════════════════════════
   Tree lab, in a terminal.

   Structural tests cannot say whether a fringe reads as needles or as a mop.
   This prints the sprite so the eye can.

   No build, no browser, no atlas. It calls makeTree as bakeWorldAtlas does,
   at the same tier heights.

     node tools/trees.mjs                     every species, mid tier
     node tools/trees.mjs spruce              one species, all seven tiers
     node tools/trees.mjs spruce 4            one species, one tier
     node tools/trees.mjs spruce 4 --value    shade/ao instead of material id
     node tools/trees.mjs spruce 4 --seed 9   another tree of the same species

   MATERIALS:  . empty   L wood   * deposit   b bark   r aerial root

   The tier ladder is geometric, seven rungs, and the pixel height depends on
   the species (SPECIES_H, tierHeight). Each sprite's header prints its
   height.
   ═══════════════════════════════════════════════════════════════════════════ */

import { RNG } from '../src/rng.js';
import { KINDS, SPECIES, SPECIES_H, TIER_N, makeTree, tierHeight } from '../src/species.js';
import { ATLAS_S } from '../src/constants.js';

const SEED = 20260727;

/* The cast comes from KINDS, so a species added as a table row appears here.
   KINDS, not SPECIES: SPECIES holds `bough`, which nothing builds. */
const MAT = { 0: '.', 1: 'L', 2: '*', 3: 'b', 9: 'r' };
const VAL = ' .:-=+*#%@';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const rest = args.filter((a) => !a.startsWith('--'));
const showValue = flags.has('--value');
const si = args.indexOf('--seed');
const seed = si >= 0 && args[si + 1] !== undefined ? +args[si + 1] : 0;

const names = rest[0] ? [rest[0]] : KINDS;
const tiers = rest[1] !== undefined ? [+rest[1]] : null;

for (const n of names) {
  if (!KINDS.includes(n)) {
    console.error(`unknown species "${n}" — KINDS is ${KINDS.join(', ')}`);
    process.exit(1);
  }
}

/* The height bakeWorldAtlas requests at this tier. */
const heightOf = (kind, ti) =>
  Math.round(tierHeight(ti) * ATLAS_S * (SPECIES_H[kind] / SPECIES_H.birch));

function rows(sp) {
  const out = [];
  for (let y = 0; y < sp.h; y++) {
    let line = '';
    for (let x = 0; x < sp.w; x++) {
      const i = y * sp.w + x, m = sp.occ[i];
      if (!m) { line += '.'; continue; }
      if (!showValue) { line += MAT[m] || '?'; continue; }
      /* Material 1 carries its value in ao, everything else in shade: the
         channel the shader reads. */
      const v = m === 1 ? sp.ao[i] : sp.shade[i];
      line += VAL[Math.max(0, Math.min(VAL.length - 1, Math.round(v * (VAL.length - 1))))];
    }
    out.push(line);
  }
  return out;
}

/* How much of the underside is pendant dark, the number droopPass moves. An
   underside is any solid pixel with air directly beneath it, the surface
   droopPass hangs from. Testing only each column's lowest pixel finds the
   trunk base and reports 0% on a spruce with a fringe. */
function fringeStat(sp) {
  const { w, h, occ, ao } = sp;
  let under = 0, dark = 0;
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!occ[i] || occ[i + w]) continue;          // solid, with air below
    under++;
    /* droopPass writes wood at ao 0.34; aoPass never takes an unenclosed
       pixel that low, so this marks pendant dark. */
    if (occ[i] === 1 && ao[i] <= 0.40) dark++;
  }
  return { under, dark, frac: under ? dark / under : 0 };
}

function show(kind, ti) {
  const h = heightOf(kind, ti);
  const rnd = new RNG((SEED ^ (seed * 7919)) >>> 0);
  const sp = makeTree(kind, h, rnd, 1.0, 0.78, 0);
  const g = rows(sp);
  const f = fringeStat(sp);
  const droop = SPECIES[kind].droop;
  console.log(
    `\n${kind}  tier ${ti}  asked ${h}px  got ${sp.w}x${sp.h}` +
    `  droop ${droop === undefined ? '—' : droop}${h >= 34 || droop === undefined ? '' : ' (below the 34px gate)'}` +
    `${showValue ? '  (values)' : '  (materials)'}`);
  console.log(`  underside ${f.under}px, ${f.dark} of it pendant dark (${(f.frac * 100).toFixed(0)}%)`);
  for (const line of g) console.log('  ' + line);
}

for (const kind of names) {
  const list = tiers || (names.length > 1 ? [4] : [...Array(TIER_N).keys()]);
  for (const ti of list) show(kind, ti);
}
