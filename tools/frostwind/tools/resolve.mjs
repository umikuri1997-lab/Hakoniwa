/* ═══════════════════════════════════════════════════════════════════════════
   The software sprite resolver. One mirror of the material branches of
   SPRITE_FS (src/shaders/sprite.js), for sheets and tests that run with no
   browser. test/resolve.test.mjs reads the coefficients out of the GLSL and
   fails when this file and the shader disagree.

   Scope: one sprite pixel, lit by one direction, snapped to its ramp. Aerial
   perspective, fog, wind and the scene snap are frame laws and stay in the
   shader.
   ═══════════════════════════════════════════════════════════════════════════ */

import { RAMP } from '../src/palette.js';

/* the bake-time default sun of src/sprite.js */
const BAKE_SUN = (() => {
  const v = { x: -0.55, y: -0.42, z: 0.72 };
  const m = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / m, y: v.y / m, z: v.z / m };
})();

/* uSteps in the shader: a posterised term takes one of four values */
const STEPS = 3;

/* [offset, gain, ambient, diffuse] of `offset + gain*baked*(ambient + diffuse*ndl)`,
   one row per material that uses that form. */
const FORM = Object.freeze({
  4:  Object.freeze({ ramp: 'trunk',    k: [0.02, 0.92, 0.62, 0.52] }),
  6:  Object.freeze({ ramp: null,       k: [0.06, 0.78, 0.65, 0.45] }),
  16: Object.freeze({ ramp: 'skin',     k: [0.10, 0.90, 0.55, 0.55] }),
  17: Object.freeze({ ramp: 'folkDark', k: [0.04, 0.82, 0.45, 0.55] }),
  18: Object.freeze({ ramp: 'folkDye',  k: [0.06, 0.78, 0.65, 0.45] }),
});
/* the coat: clamp((form - bias) * (ambient + diffuse*ndl)) */
const COAT = Object.freeze({ bias: 0.08, ambient: 0.50, diffuse: 0.72 });
/* world light: lit = ambient + diffuse*ndl */
const LIT = Object.freeze({ ambient: 0.16, diffuse: 0.94 });
/* the deposit: floor + gain*posterise(ao*(ambient + diffuse*ndl)) */
const DEPOSIT = Object.freeze({ floor: 0.14, gain: 0.86, ambient: 0.60, diffuse: 0.55 });
/* bronze: a posterised diffuse base under a glint stepped at two thresholds */
const BRONZE = Object.freeze({ ambient: 0.12, diffuse: 0.78, base: 0.72, power: 18,
  full: 0.70, part: 0.42, partRung: 0.66 });
/* the bark mark: the wood's own value, dimmed */
const BARK = 0.24;
/* the rim: thresholds on |Ldir.x| and the two allowances on ao */
const RIM = Object.freeze({ full: 0.444, shoulder: 0.167, snowAo: 0.5, coatAo: 0.3,
  snowFull: 1.00, snowShoulder: 0.60, coat: 0.95 });

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const posterise = (t) => Math.floor(clamp01(t) * STEPS + 0.5) / STEPS;

const rampStep = (name, t) => {
  const ramp = RAMP[name] || RAMP.snow;
  return ramp[Math.max(0, Math.min(ramp.length - 1,
    Math.floor(clamp01(t) * (ramp.length - 1) + 0.5)))];
};

/* The ramp and rung of one sprite pixel. `inst` overrides what the draw
   instance supplies: ramp, ramp2, sMin, sMax, dMin, dMax, vol. */
function resolveRung(sp, i, sun = BAKE_SUN, inst = {}) {
  const m = sp.occ[i];
  if (!m) return null;
  const ramp = inst.ramp ?? sp.ramp ?? 'snow';
  const ramp2 = inst.ramp2 ?? sp.ramp2 ?? null;
  const sMin = inst.sMin ?? sp.sMin ?? 0, sMax = inst.sMax ?? sp.sMax ?? 1;
  const dMin = inst.dMin ?? sp.dMin ?? 0, dMax = inst.dMax ?? sp.dMax ?? 1;
  const N = { x: sp.nx[i], y: sp.ny[i], z: Math.max(sp.nz[i], 0.02) };
  const nn = Math.hypot(N.x, N.y, N.z) || 1;
  const ndl = Math.max(0, (N.x * sun.x + N.y * sun.y + N.z * sun.z) / nn);
  const baked = sp.shade[i], ao = sp.ao[i];
  const lit = LIT.ambient + LIT.diffuse * ndl;
  const form = FORM[m];
  if (form) {
    const [o, g, a, d] = form.k;
    /* ramp id 0 (snow) is the shader's "no second ramp" */
    return [form.ramp || (ramp2 && ramp2 !== 'snow' ? ramp2 : 'accent'),
      clamp01(o + g * baked * (a + d * ndl))];
  }
  /* 19, a luminous body: its baked position on the deposit ramp, unlit */
  if (m === 19) return [ramp2 || 'snow', clamp01(dMin + (dMax - dMin) * baked)];
  /* 10 eye, 11 flower: the two rungs of the machine signal, unlit */
  if (m === 10 || m === 11) return ['machineSignal', m === 11 ? 1 : 0];
  if (m === 1 || m === 9 || m === 12)
    return [ramp, clamp01(sMin + (sMax - sMin) * posterise(lit * ao))];
  if (m === 2) {
    const v = (DEPOSIT.floor + DEPOSIT.gain
      * posterise(ao * (DEPOSIT.ambient + DEPOSIT.diffuse * ndl)))
      * (1 - (inst.vol ?? sp.vol ?? 0) * baked);
    return [ramp2 || 'snow', clamp01(dMin + (dMax - dMin) * v)];
  }
  if (m === 3)
    return [ramp, clamp01((sMin + (sMax - sMin) * posterise(lit * ao)) * BARK)];
  if (m === 5) {
    const coatForm = clamp01(sMin + (sMax - sMin) * baked);
    return [ramp, posterise(clamp01((coatForm - COAT.bias)
      * (COAT.ambient + COAT.diffuse * ndl)))];
  }
  if (m === 7) {
    const faces = N.x * sun.x, lat = Math.abs(sun.x);
    if (faces > 0 && lat > RIM.full && ao > RIM.snowAo) return ['snow', RIM.snowFull];
    if (faces > 0 && lat > RIM.shoulder && ao > RIM.snowAo) return ['snow', RIM.snowShoulder];
    if (faces > 0 && lat > RIM.shoulder && ao > RIM.coatAo) return [ramp, RIM.coat];
    if (faces > 0 && lat > RIM.shoulder) {
      const [o, g, a, d] = FORM[4].k;
      return ['folkDark', clamp01(o + g * baked * (a + d * ndl))];
    }
    return ['folkDark', 0];
  }
  if (m === 13) return [ramp, baked < 0.5 ? sMin : sMax];
  if (m === 8) {
    /* H = normalize(L + V), and an orthographic sprite has one V */
    const hz = sun.z + 1, hn = Math.hypot(sun.x, sun.y, hz);
    const spec = Math.max(0, (N.x * sun.x + N.y * sun.y + N.z * hz) / (nn * hn)) ** BRONZE.power;
    const metal = Math.max(
      posterise((BRONZE.ambient + BRONZE.diffuse * ndl) * ao) * BRONZE.base,
      spec > BRONZE.full ? 1 : spec > BRONZE.part ? BRONZE.partRung : 0);
    return [ramp, clamp01(sMin + (sMax - sMin) * metal)];
  }
  throw new Error(`tools/resolve.mjs mirrors no branch for material ${m}`);
}

const resolveColour = (sp, i, sun = BAKE_SUN, inst = {}) => {
  const rung = resolveRung(sp, i, sun, inst);
  return rung ? rampStep(rung[0], rung[1]) : null;
};

/* ── minimal PNG writer: one IDAT, filter 0 per scanline ─────────────────── */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function writePng(path, rgba, w, h) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4);
    data.copy(out, 8);
    out.writeUInt32BE(crc(Buffer.concat([Buffer.from(type), data])), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++)
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]));
}

/* An RGBA image at `k` times its size, nearest neighbour. */
function upscale(rgba, w, h, k) {
  const out = Buffer.alloc(w * k * h * k * 4);
  for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++)
    rgba.copy(out, (y * w * k + x) * 4, ((y / k | 0) * w + (x / k | 0)) * 4,
      ((y / k | 0) * w + (x / k | 0)) * 4 + 4);
  return { rgba: out, w: w * k, h: h * k };
}

export {
  BAKE_SUN, BARK, BRONZE, COAT, DEPOSIT, FORM, LIT, RIM, STEPS,
  posterise, rampStep, resolveColour, upscale, writePng,
};
