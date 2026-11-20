import assert from 'node:assert';
import { FOLK, FOLK_STATES, FOLK_VIEWS } from '../src/body-folk.js';
import { BAKE_SUN, rampStep, resolveColour } from '../tools/resolve.mjs';

export const NAMES = Object.keys(FOLK);

export const occupiedRows = (sp) => {
  const rows = [];
  for (let y = 0; y < sp.h; y++)
    for (let x = 0; x < sp.w; x++)
      if (sp.occ[y * sp.w + x]) { rows.push(y); break; }
  return rows;
};

export const topRow = (sp) => occupiedRows(sp)[0];
export const bottomRow = (sp) => occupiedRows(sp).at(-1);

export const everyFrame = function* () {
  for (const name of NAMES)
    for (let d = 0; d < FOLK_VIEWS; d++)
      for (const [state, n] of Object.entries(FOLK_STATES))
        for (let f = 0; f < n; f++) yield [name, d, state, f];
};

/* The colour of a sprite pixel: tools/resolve.mjs, the one software mirror of
   SPRITE_FS. */
export const SUN = BAKE_SUN;
export { rampStep, resolveColour };

export const luminance = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

export const saturation = (c) => {
  const mx = Math.max(...c) / 255, mn = Math.min(...c) / 255;
  return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(mx + mn - 1));
};

export const colourDistance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));

export const aerial = (c, targetL, comp, desat, fogA, fog) => {
  let L = 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  const out = c.map((v) => v * (1 - desat) + L * desat);
  L = 0.30 * out[0] + 0.59 * out[1] + 0.11 * out[2];
  return out.map((v, i) =>
    (v + (targetL - L) * comp) * (1 - fogA) + fog[i] * fogA);
};

export function connectivity(sp) {
  const seen = new Uint8Array(sp.w * sp.h);
  let start = -1, total = 0;
  for (let i = 0; i < sp.occ.length; i++)
    if (sp.occ[i]) { total++; if (start < 0) start = i; }
  if (start < 0) return { joined: 0, total: 0 };
  const stack = [start];
  seen[start] = 1;
  let joined = 1;
  while (stack.length) {
    const i = stack.pop(), x = i % sp.w, y = (i / sp.w) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= sp.w || ny >= sp.h) continue;
        const j = ny * sp.w + nx;
        if (sp.occ[j] && !seen[j]) {
          seen[j] = 1;
          joined++;
          stack.push(j);
        }
      }
  }
  return { joined, total };
}

export const failureBucket = () => ({ count: 0, examples: [] });

export function addFailure(bucket, message, limit = 10) {
  bucket.count++;
  if (bucket.examples.length < limit) bucket.examples.push(message);
}

export function assertNoFailures(bucket, label) {
  const remaining = bucket.count - bucket.examples.length;
  const details = bucket.examples.length ? `\n${bucket.examples.join('\n')}` : '';
  const omitted = remaining > 0 ? `\n... ${remaining} more` : '';
  assert.equal(bucket.count, 0, `${label}:${details}${omitted}`);
}
