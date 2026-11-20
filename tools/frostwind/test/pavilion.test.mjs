import assert from 'node:assert/strict';
import test from 'node:test';

import { M, MEven, OPEN, SOLID } from '../src/construct.js';
import {
  PAVILION_M, makePavilion, pavilionDoorDX, pavilionFootprint,
  pavilionGeometry, pavilionScreenPoint, pavilionSlab,
} from '../src/pavilion.js';
import { PLAYER_H } from '../src/scale.js';

const REPORT = process.env.FROSTWIND_TEST_REPORT === '1';
const build = () => makePavilion(null, 0);

function linePoints(a, b) {
  let x0 = Math.round(a.x), y0 = Math.round(a.y);
  const x1 = Math.round(b.x), y1 = Math.round(b.y);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  const out = [];
  for (;;) {
    out.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return out;
}

function components(sp) {
  const n = sp.w * sp.h, seen = new Uint8Array(n), sizes = [];
  for (let s = 0; s < n; s++) {
    if (!sp.occ[s] || seen[s]) continue;
    const q = [s]; seen[s] = 1;
    for (let k = 0; k < q.length; k++) {
      const i = q[k], x = i % sp.w, y = (i / sp.w) | 0;
      for (const [xx, yy] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (xx < 0 || yy < 0 || xx >= sp.w || yy >= sp.h) continue;
        const j = yy * sp.w + xx;
        if (!seen[j] && sp.occ[j]) { seen[j] = 1; q.push(j); }
      }
    }
    sizes.push(q.length);
  }
  return sizes.sort((a, b) => b - a);
}

test('pavilion dimensions and collision derive from one metre table', () => {
  const G = pavilionGeometry(), slab = pavilionSlab(), foot = pavilionFootprint();
  assert.equal(G.box.w, M(PAVILION_M.width));
  assert.equal(G.box.d, MEven(PAVILION_M.depth));
  assert.equal(G.box.h, M(PAVILION_M.eave));
  assert.equal(G.box.rows, G.box.d / 2);
  assert.equal(G.box.cols, G.box.d / 2);
  assert.equal(G.doorHead, PLAYER_H,
    'the reference entrance is one standing traveller high');
  assert.equal(slab.back, G.box.rows);
  assert.equal(slab.shear, G.box.cols);
  assert.equal(slab.hx * 2, G.box.w);
  assert.equal(pavilionDoorDX(), -2,
    'the tied flap gives the doorway its declared left drift');
  assert.ok(foot.hx * 2 >= G.box.W + 2 * (G.guy + G.over) - 1,
    'the keep-out must include the guy stakes and roof overhang');
  assert.equal(foot.back, G.box.rows);
});

test('pavilion panels carry runtime-visible form', () => {
  const sp = build();
  let occupied = 0, depth = 0, aoMin = 1, aoMax = 0, open = 0, accent = 0;
  for (let i = 0; i < sp.w * sp.h; i++) {
    const m = sp.occ[i];
    if (!m) continue;
    occupied++;
    assert.ok(m === SOLID || m === OPEN || m === 6,
      `pixel ${i} carries undeclared pavilion material ${m}`);
    const l = Math.hypot(sp.nx[i], sp.ny[i], sp.nz[i]);
    assert.ok(Math.abs(l - 1) < 0.015,
      `pixel ${i} has a non-unit normal of ${l}`);
    if (Math.abs(sp.nx[i]) > 0.30 || sp.ny[i] < -0.38) depth++;
    if (m === SOLID || m === OPEN) {
      aoMin = Math.min(aoMin, sp.ao[i]); aoMax = Math.max(aoMax, sp.ao[i]);
    }
    if (m === OPEN) open++;
    if (m === 6) accent++;
  }
  assert.ok(depth > occupied * 0.35,
    `${depth} of ${occupied} pixels carry depth, below the faceted-shell floor`);
  assert.ok(aoMax - aoMin > 0.30,
    `pavilion ao spread ${(aoMax - aoMin).toFixed(3)} cannot survive the wood shader`);
  assert.ok(open > 250, 'panel piping, guys and garland did not reach the sprite');
  assert.ok(accent > 100, 'the side wing and tied flap did not reach the secondary ramp');
  if (REPORT)
    console.log(`  pavilion ${sp.w}x${sp.h}, ${occupied} px, `
      + `${(100 * depth / occupied).toFixed(1)}% depth, ao ${(aoMax - aoMin).toFixed(3)}`);
});

test('the cloth mass stays connected and every front panel reaches the apex', () => {
  const sp = build(), G = pavilionGeometry();
  const occupied = sp.occ.reduce((n, m) => n + (m ? 1 : 0), 0);
  const cc = components(sp);
  assert.ok(cc[0] > occupied * 0.98,
    `the largest connected assembly is ${cc[0]} of ${occupied} occupied pixels`);
  const apex = pavilionScreenPoint(G.apex);
  for (const [i, h] of G.frontHem.entries()) {
    const line = linePoints(apex, pavilionScreenPoint(h));
    const covered = line.filter(([x, y]) => sp.occ[y * sp.w + x]).length;
    assert.ok(covered >= line.length * 0.92,
      `front panel ${i} reaches the apex on ${covered} of ${line.length} edge pixels`);
  }
});

test('the tapered entrance preserves the traveller-height opening', () => {
  const sp = build(), G = pavilionGeometry();
  const base = pavilionScreenPoint({ x: 0, d: 0, z: 0 });
  const widths = [];
  for (let y = Math.round(base.y - G.doorHead); y <= Math.round(base.y); y++) {
    let dark = 0;
    for (let x = Math.round(base.x) - G.doorHalf - 4;
      x <= Math.round(base.x) + G.doorHalf + 4; x++) {
      const i = y * sp.w + x;
      if (sp.occ[i] === SOLID && sp.ao[i] < 0.08) dark++;
    }
    widths.push(dark);
  }
  assert.equal(widths.length, PLAYER_H + 1);
  assert.ok(widths.every((w) => w > 0), 'one entrance row closed completely');
  assert.ok(widths[0] <= 3, `the slit begins ${widths[0]} px wide`);
  assert.ok(widths.at(-1) >= G.doorHalf * 2 - 2,
    `the threshold opens only ${widths.at(-1)} px`);
  for (let i = 1; i < widths.length; i++)
    assert.ok(widths[i] + 2 >= widths[i - 1],
      `the doorway narrows from ${widths[i - 1]} to ${widths[i]} at row ${i}`);
});

test('structural guys meet their attachments and poles stay solid at ground', () => {
  const sp = build(), G = pavilionGeometry();
  for (const [hem, stake] of [[G.frontHem[0], G.stakes[0]], [G.frontHem[4], G.stakes[1]]]) {
    const line = linePoints(pavilionScreenPoint(hem), pavilionScreenPoint(stake));
    const covered = line.filter(([x, y]) => sp.occ[y * sp.w + x]).length;
    const casting = line.filter(([x, y]) => sp.occ[y * sp.w + x] === 6).length;
    assert.ok(covered >= line.length * 0.85,
      `a guy reaches only ${covered} of its ${line.length} attachment pixels`);
    assert.ok(casting >= line.length * 0.90,
      `only ${casting} of ${line.length} guy pixels use the shadow-casting fibre material`);
  }
  for (const [i, p] of G.frontPoles.entries()) {
    const foot = pavilionScreenPoint(p.foot);
    assert.equal(sp.occ[Math.round(foot.y) * sp.w + Math.round(foot.x)], SOLID,
      `front pole ${i} does not cast from its ground contact`);
  }
});

test('front curtain closes against the right return', () => {
  const sp = build(), G = pavilionGeometry();
  assert.deepEqual(G.frontBase.at(-1), G.rightBase[0],
    'the front and right cloth disagree about their ground corner');
  assert.deepEqual(G.frontMid.at(-1), G.rightMid[0],
    'the front and right cloth disagree about their billow at the corner');
  const seam = [
    ...linePoints(pavilionScreenPoint(G.frontHem.at(-1)),
      pavilionScreenPoint(G.rightMid[0])),
    ...linePoints(pavilionScreenPoint(G.rightMid[0]),
      pavilionScreenPoint(G.rightBase[0])),
  ];
  const open = seam.filter(([x, y]) => !sp.occ[y * sp.w + x]);
  assert.deepEqual(open, [],
    `the front-to-return arris leaves ${open.length} pixels open through the shell`);
});

test('front curtain billows spend separate discrete facet values', () => {
  const sp = build(), G = pavilionGeometry();
  const mean = (...ps) => ({
    x: ps.reduce((n, p) => n + p.x, 0) / ps.length,
    d: ps.reduce((n, p) => n + p.d, 0) / ps.length,
    z: ps.reduce((n, p) => n + p.z, 0) / ps.length,
  });
  const valueAt = (p) => {
    const q = pavilionScreenPoint(p);
    return sp.ao[Math.round(q.y) * sp.w + Math.round(q.x)];
  };
  const upper = valueAt(mean(G.frontTop[1], G.frontTop[2], G.frontMid[2]));
  const lower = valueAt(mean(G.frontMid[1], G.frontMid[2], G.frontBase[2]));
  assert.ok(upper - lower > 0.10,
    `adjacent curtain facets resolve only ${(upper - lower).toFixed(3)} apart`);
  assert.ok(upper >= 0.54 && upper <= 0.66 && lower >= 0.40 && lower <= 0.54,
    `curtain facet values ${upper.toFixed(3)}/${lower.toFixed(3)} left their flat steps`);
});
