import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { SPRITE_FS } from '../src/shaders/sprite.js';
import { ANIMALS } from '../src/atlas.js';
import { RNG } from '../src/rng.js';
import { BARK, BRONZE, COAT, DEPOSIT, FORM, LIT, RIM, STEPS, resolveColour } from '../tools/resolve.mjs';
import { RAMP_ID } from '../src/palette.js';

/* tools/resolve.mjs draws every no-browser sheet and backs the folk colour
   tests. It is a second statement of SPRITE_FS, so its numbers are read back
   out of the GLSL here. A shader edit that moves a coefficient fails this
   test until the mirror moves with it. */

const has = (text, label) =>
  assert.ok(SPRITE_FS.includes(text), `${label}: SPRITE_FS no longer contains "${text}"`);

test('the software resolver states the shader\'s own coefficients', () => {
  for (const [mat, row] of Object.entries(FORM)) {
    const [o, g, a, d] = row.k.map((v) => v.toFixed(2));
    has(`${o} + ${g}*baked*(${a}+${d}*ndl)`, `material ${mat}`);
    if (row.ramp) assert.ok(RAMP_ID[row.ramp] !== undefined,
      `material ${mat} names ramp ${row.ramp}, which the palette does not hold`);
  }
  has(`(coatForm-${COAT.bias.toFixed(2)})*(${COAT.ambient.toFixed(2)}+${COAT.diffuse.toFixed(2)}*ndl)`,
    'the coat');
  has(`float lit = ${LIT.ambient.toFixed(2)} + ${LIT.diffuse.toFixed(2)}*ndl`, 'world light');
  has(`${DEPOSIT.floor.toFixed(2)} + ${DEPOSIT.gain.toFixed(2)}*posterise(clamp(ao*(${
    DEPOSIT.ambient.toFixed(2)}+${DEPOSIT.diffuse.toFixed(2)}*ndl)`, 'the deposit');
  has(`lat > ${RIM.full} && ao > ${RIM.snowAo}`, 'the full rim');
  has(`lat > ${RIM.shoulder} && ao > ${RIM.coatAo}`, 'the coat rim');
  has(`rampStep(vRamp, ${RIM.coat.toFixed(2)})`, 'the coat rim rung');
  has('v *= 1.0 - vVol*baked;', 'the deposit volume');
  has(`posterise(clamp(lit*ao,0.0,1.0)))*${BARK};`, 'the bark mark');
  has(`pow(max(dot(N,H),0.0), ${BRONZE.power.toFixed(1)})`, 'the bronze lobe');
  has(`posterise(clamp((${BRONZE.ambient.toFixed(2)} + ${BRONZE.diffuse.toFixed(2)}*ndl)*ao,0.0,1.0))`,
    'the bronze base');
  has(`max(base*${BRONZE.base.toFixed(2)}, spec > ${BRONZE.full.toFixed(2)} ? 1.0 : (spec > ${
    BRONZE.part.toFixed(2)} ? ${BRONZE.partRung.toFixed(2)} : 0.0))`, 'the bronze glint');
});

test('each mirrored material resolves through the ramp the shader names', () => {
  const branch = (ramp) => `rampStep(${RAMP_ID[ramp]}.0`;
  for (const ramp of ['trunk', 'skin', 'folkDark', 'folkDye'])
    has(branch(ramp), `the ${ramp} branch`);
  /* the value budget, as the renderer sets it on both sprite passes */
  const steps = [...readFileSync(new URL('../src/render.js', import.meta.url), 'utf8')
    .matchAll(/uSteps:\{value:([\d.]+)\}/g)].map((q) => +q[1]);
  assert.ok(steps.length > 0, 'src/render.js no longer sets uSteps');
  for (const v of steps) assert.equal(v, STEPS, 'the mirror posterises to another budget');
  /* the signal: material 11 is the green rung, 10 the red, and neither is lit */
  has('float greenSignal=mat>10.5?1.0:0.0;', 'the machine signal');
  has(`c=rampStep(${RAMP_ID.machineSignal}.0,greenSignal);`, 'the machine signal ramp');
});

test('every material an animal bakes has a mirrored branch', () => {
  /* Measured: with no bronze branch the meadow machines resolved through
     `trunk`, and every sheet drew them grey. An unmirrored material throws. */
  for (const [kind, row] of Object.entries(ANIMALS))
    for (const [state, n] of Object.entries(row.states)) for (let f = 0; f < n; f++) {
      const sp = row.make(new RNG(row.seed), f, 2, state);
      for (let i = 0; i < sp.occ.length; i++) if (sp.occ[i])
        assert.doesNotThrow(() => resolveColour(sp, i, undefined, { ramp: 'masonry' }),
          `${kind} ${state}:${f} paints material ${sp.occ[i]}`);
    }
});
