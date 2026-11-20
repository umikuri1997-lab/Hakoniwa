/* THE SCALE HARNESS

   PURPOSE: enforce the outdoor dimensional identities in scale.js and the
   cabinet-projection consequences in PROJECTION.md. Enterable rooms are gone;
   cabins remain outdoor props sized from the same authority.

   Scale authority is PLAYER_H = 26 px = 1.70 m. Window dimensions are
   presentation inputs, never world dimensions.

   Run: npm run test:scale */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAYER_H, HUMAN_M, HUMAN_D_M, M_PER_PX, PX_PER_M, ROWS_PER_PROJ_M,
  tr, trEven, metresToPx, pxToMetres, pxToTr,
  SUPPORTED_RESOLUTIONS, projectedM, projectedRate, obliqueRows, TILE_PX,
} from '../src/scale.js';

test('PLAYER_H is the dimensional axiom', () => {
  assert.equal(PLAYER_H, 26);
  assert.equal(HUMAN_M, 1.70);
  assert.equal(PX_PER_M, PLAYER_H / HUMAN_M);
  assert.equal(M_PER_PX, HUMAN_M / PLAYER_H);
  assert.ok(Math.abs(pxToMetres(PLAYER_H) - HUMAN_M) < 1e-12);
  assert.equal(metresToPx(HUMAN_M), PLAYER_H);
  assert.equal(pxToTr(PLAYER_H), 1);
});

test('traveller-unit helpers stay body-scaled', () => {
  assert.equal(tr(1), PLAYER_H);
  assert.equal(tr(0.5), 13);
  assert.equal(trEven(0.5) % 2, 0);
  assert.equal(TILE_PX % 2, 0);
  assert.equal(obliqueRows(10), 5);
});

test('cabinet projection foreshortens depth by one half', () => {
  assert.equal(projectedM({ h: 1.70, d: 0.24 }), 1.70 + 0.12);
  assert.equal(ROWS_PER_PROJ_M, PLAYER_H / projectedM({ h: HUMAN_M, d: HUMAN_D_M }));
  const rate = projectedRate(PLAYER_H, { h: HUMAN_M, d: HUMAN_D_M });
  assert.equal(rate, ROWS_PER_PROJ_M);
});

test('supported resolutions are presentation lists, not world sizes', () => {
  assert.ok(SUPPORTED_RESOLUTIONS.length >= 3);
  for (const [w, h] of SUPPORTED_RESOLUTIONS) {
    assert.ok(w > 0 && h > 0);
    assert.notEqual(w, PLAYER_H, 'frame width is not a world dimension');
  }
});
