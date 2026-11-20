/* ═══════════════════════════════════════════════════════════════════════════
   THE DROOP HARNESS — the constraints that keep a fringe from becoming fuzz.

   droopPass is the only pass in sprite.js that makes the silhouette ROUGHER.
   Every other one — aoPass, snowPass, underPlate — smooths, encloses or seats,
   and each of them arrived with a note about the fuzz it was written to avoid.
   A pass that deliberately adds high-frequency dark at the outline is one
   parameter away from undoing all of that work, so its limits are asserted
   here rather than left to the eye.

   These are not regression tests. They are the executable statement of what
   "a fringe, not a mop" means, and each reports the measured number so a
   failure is a specification rather than a complaint.

   The pass came out of a pine-tree tutorial by Penusbmic — see PIXEL-ART.md.
   The claim being encoded is his: the thing that sells a conifer is short dark
   strokes hanging off the undersides, added last, on the outer edge as much as
   the interior.

   Run: node --test test/droop.test.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import test from 'node:test';
import assert from 'node:assert';
import { droopPass, newSprite } from '../src/sprite.js';
import { RNG } from '../src/rng.js';

/* A bar of wood `run` wide with clear air beneath it: the geometry a stroke is
   supposed to hang from. Anything narrower than DROOP_MIN_RUN must stay bare. */
function bar(w,h,run,y){
  const sp=newSprite(w,h);
  const x0=(w-run)>>1;
  for(let x=x0;x<x0+run;x++){
    const i=y*w+x;
    sp.occ[i]=1; sp.shade[i]=0.5;
  }
  return sp;
}
const below=(sp,y)=>{
  let n=0;
  for(let yy=y+1;yy<sp.h;yy++)for(let x=0;x<sp.w;x++) if(sp.occ[yy*sp.w+x]) n++;
  return n;
};

test('1. density 0 is byte-identical — the pass is genuinely opt-in', () => {
  const a=bar(24,16,10,6), before=Uint8Array.from(a.occ);
  droopPass(a,new RNG(1),0,2);
  assert.deepStrictEqual(a.occ, before,
    'droopPass with density 0 altered the sprite. Every species without a ' +
    '`droop` field depends on this being a no-op — if it is not, the golden ' +
    'frames move for trees that were never meant to change.');
});

test('2. a speck grows no whiskers — runs under 3 are refused', () => {
  for(const run of [1,2]){
    const sp=bar(24,16,run,6);
    droopPass(sp,new RNG(7),1.0,3);           // density 1: every column tries
    assert.strictEqual(below(sp,6), 0,
      `a ${run}-pixel underside grew ${below(sp,6)} droop pixels at density 1. ` +
      'Isolated twig tips must stay bare or the canopy reads as fuzz — this is ' +
      'the same run test underPlate makes, for the same reason.');
  }
});

test('3. a real bough does grow a fringe', () => {
  const sp=bar(24,16,12,6);
  droopPass(sp,new RNG(3),1.0,2);
  const n=below(sp,6);
  assert.ok(n>0,
    'a 12-pixel underside grew nothing at density 1. The run test is meant to ' +
    'reject specks, not boughs.');
  assert.ok(n<=12*2,
    `grew ${n} pixels from 12 columns at maxLen 2; the ceiling is 24.`);
});

test('4. strokes stay short — maxLen is a real bound', () => {
  const sp=bar(24,40,12,6);
  droopPass(sp,new RNG(11),1.0,2);
  let deepest=6;
  for(let y=7;y<sp.h;y++)for(let x=0;x<sp.w;x++) if(sp.occ[y*sp.w+x]) deepest=Math.max(deepest,y);
  assert.ok(deepest-6<=2,
    `a stroke reached ${deepest-6} rows below the bough with maxLen 2. Past two ` +
    'or three rows a needle stops reading as a needle and becomes a branch ' +
    'that goes nowhere.');
});

test('5. structure is never overwritten', () => {
  const sp=bar(24,16,12,6);
  /* a second bar two rows down: strokes must stop at it, not through it */
  for(let x=0;x<24;x++){ const i=9*24+x; sp.occ[i]=1; sp.shade[i]=0.9; }
  const keep=Float32Array.from(sp.shade);
  droopPass(sp,new RNG(5),1.0,4);
  for(let x=0;x<24;x++)
    assert.strictEqual(sp.shade[9*24+x], keep[9*24+x],
      `droopPass overwrote existing structure at row 9, column ${x}. It may ` +
      'only ever write into empty pixels.');
});

test('6. sparse means sparse — density is per eligible column', () => {
  const sp=bar(64,16,48,6);
  droopPass(sp,new RNG(13),0.16,2);          // the shipped spruce value
  const n=below(sp,6), frac=n/48;
  assert.ok(frac<0.55,
    `48 eligible columns produced ${n} droop pixels (${(frac*100).toFixed(0)}% ` +
    'of the run). At the shipped density this should be a fringe, not a mop. ' +
    'If this fails the density is doing something other than what its name says.');
});
