/* ── The lit side belongs to the sun ─────────────────────

   A sprite is mirrored at draw time by mirroring the UV it reads
   (W_SPRITE_VS), which moves the pixels but not their directions. Unless the
   normal's x is negated to match, the lit side rides the body: half the forest
   is shaded against its own cast shadow, and a walking animal's lit flank
   stays on one side when it turns round.

   Asserted on the normals a rig writes and the rule SPRITE_FS applies to
   them, for the rigs that flip in profile: deer, wolf and folk.

   The shader rule is modelled, not executed (GLSL needs a GPU), so the model
   is short and pinned to the shader by name. */
import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { DEER_STATES } from '../src/body-deer.js';
import { WOLF_STATES } from '../src/body-wolf.js';
import { makeRoeDeer } from '../src/figure-deer.js';
import { makeWolf } from '../src/figure-wolf.js';
import { paintPerson } from '../src/people.js';
import { RAMP } from '../src/palette.js';
import { RNG } from '../src/rng.js';
import { newSprite } from '../src/sprite.js';

/* The light vector as FrostwoodWorld.setLight builds it (src/render.js). */
function lightDir(azDeg, elDeg) {
  const a = (azDeg * Math.PI) / 180, e = (elDeg * Math.PI) / 180;
  return { x: Math.cos(a) * Math.cos(e), y: Math.sin(a) * Math.cos(e), z: Math.sin(e) };
}

/* Every rigged body in profile, which is the only view that is ever mirrored. */
function profileBodies() {
  const out = [];
  for (const [state, n] of Object.entries(DEER_STATES))
    for (let f = 0; f < n; f++)
      out.push([`roeDeer@${state}:2:${f}`, makeRoeDeer(new RNG(0xc4a4c3), f, 2, state)]);
  for (const [state, n] of Object.entries(WOLF_STATES))
    for (let f = 0; f < n; f++)
      out.push([`wolf@${state}:2:${f}`, makeWolf(new RNG(0x0c1f7a), f, 2, state)]);
  /* figure-folk.js draws the people, and the mirror law binds it too. The
     woodcutter is a different stature on the same body. */
  for (let f = 0; f < 8; f++)
    out.push([`walk:2:${f}`, paintPerson('traveller', 2, f, 'walk')]);
  for (let f = 0; f < 6; f++)
    out.push([`walk@idle:2:${f}`, paintPerson('traveller', 2, f, 'idle')]);
  for (let f = 0; f < 8; f++)
    out.push([`woodcutter:2:${f}`, paintPerson('woodcutter', 2, f, 'walk')]);
  return out;
}

/* A left-right symmetric cylinder slab: the mirror law's strongest statement
   needs an antisymmetric normal field, and no shipping body has one. */
function symmetricSlab(h = 26) {
  const half = Math.max(1, Math.round(h * 0.18));
  const w = half * 2 + 1;
  const sp = newSprite(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const n = Math.max(-1, Math.min(1, (x - half) / half)) * 0.82;
    sp.occ[i] = 4;
    sp.nx[i] = n; sp.ny[i] = 0; sp.nz[i] = Math.sqrt(Math.max(0.04, 1 - n * n));
  }
  return sp;
}

/* SPRITE_FS reduced to this file's question. Two things happen at draw time:
   the UV mirror (screen column X reads sprite column w-1-X) and the normal
   mirror (the SPRITE_FS line "if(vFlip > 0.5) N.x = -N.x"). One without the
   other is the bug. */
const ndlAt = (sp, i, L, flip) =>
  (flip ? -sp.nx[i] : sp.nx[i]) * L.x + sp.ny[i] * L.y + sp.nz[i] * L.z;

const AZ = [0, 20, 45, 90, 140, 180, 218, 260, 300, 340];
const EL = [4, 20, 40, 60, 86];          // the full range of the elevation slider
test('mirroring a body is exactly the same thing as mirroring the sun', () => {
  /* A body in profile is not left-right symmetric, so the lit half's centre
     can sit anywhere. The identity holds for any normal field: a sprite drawn
     mirrored under sun L equals the sprite unmirrored under a sun with its x
     negated, read at the mirrored column. It is exact, and it fails if the
     negation is dropped. */
  let compared = 0, worst = 0;
  const bad = [];
  for (const [key, sp] of profileBodies()) {
    const w = sp.w;
    for (const az of AZ) for (const el of EL) {
      const L = lightDir(az, el), mirrored = { x: -L.x, y: L.y, z: L.z };
      for (let y = 0; y < sp.h; y++) for (let X = 0; X < w; X++) {
        const i = y * w + (w - 1 - X);
        if (!sp.occ[i]) continue;
        const d = Math.abs(ndlAt(sp, i, L, true) - ndlAt(sp, i, mirrored, false));
        worst = Math.max(worst, d);
        compared++;
        if (d > 1e-12 && bad.length < 8)
          bad.push(`${key} az=${az} el=${el} row ${y} col ${X}: ${d}`);
      }
    }
  }
  assert.ok(compared > 100000, `expected plenty of pixels, got ${compared}`);
  assert.deepEqual(bad, [],
    `Mirroring the sprite stopped being equivalent to mirroring the sun. That is
     the sprite wearing the light instead of receiving it — see this file's header.`);
  assert.equal(worst, 0, `worst mirror error ${worst}`);
});

test('the mirror check is not vacuous: dropping the negation would break it', () => {
  /* Counts the pixels whose lighting depends on the negation, so the check
     above is not a tautology about front-facing sprites. */
  const L = lightDir(20, 24), mirrored = { x: -L.x, y: L.y, z: L.z };
  let depends = 0, total = 0;
  for (const [, sp] of profileBodies()) {
    for (let i = 0; i < sp.occ.length; i++) {
      if (!sp.occ[i]) continue;
      total++;
      /* what the flipped read would give WITHOUT the negation */
      if (Math.abs(ndlAt(sp, i, L, false) - ndlAt(sp, i, mirrored, false)) > 1e-9) depends++;
    }
  }
  assert.ok(depends / total > 0.5,
    `only ${depends} of ${total} body pixels depend on the normal mirror`);
});

test('a left-right symmetric body keeps its lit side on one side of the screen', () => {
  /* The stronger claim, on the one body that can carry it: the slab's normal
     is antisymmetric by construction, so mirroring does not move the lit
     half. */
  const sp = symmetricSlab(26), w = sp.w;
  for (const az of AZ) for (const el of EL) {
    const L = lightDir(az, el);
    if (Math.abs(L.x) < 0.2) continue;      // a sun on the depth axis picks no side
    const meanOf = (flip) => {
      let lit = 0, sum = 0;
      for (let y = 0; y < sp.h; y++) for (let X = 0; X < w; X++) {
        const i = y * w + (flip ? w - 1 - X : X);
        if (!sp.occ[i] || ndlAt(sp, i, L, flip) <= 0.18) continue;
        lit++; sum += X;
      }
      return lit ? sum / lit : null;
    };
    const a = meanOf(false), b = meanOf(true);
    if (a === null || b === null) continue;
    assert.ok(Math.abs(a - b) < 1e-9,
      `az=${az} el=${el}: lit centre moved from x=${a.toFixed(2)} to x=${b.toFixed(2)} on a mirror`);
  }
});

test('the shader mirrors the normal field with the sprite', () => {
  /* The line the model in this file copies, asserted by name. */
  const src = readFileSync(new URL('../src/shaders/sprite.js', import.meta.url), 'utf8');
  assert.match(src, /if\(vFlip > 0\.5\) N\.x = -N\.x;/,
    'SPRITE_FS no longer negates N.x on a flipped sprite');
});

test('no rig knows where the sun is', () => {
  /* Single authority: a rig that imports LIGHT bakes a direction onto the
     body. */
  for (const path of ['../src/figure-deer.js', '../src/figure-wolf.js',
                      '../src/animal.js', '../src/figure-folk.js']) {
    const src = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.ok(!/\bLIGHT\b/.test(src.split('\n').filter((l) => l.startsWith('import')).join('\n')),
      `${path} imports LIGHT — the rig is baking a light direction again`);
  }
});

test('every body normal is a unit vector pointing out of the screen', () => {
  /* The model depends on this: a zero-length or back-facing normal makes ndl
     meaningless. */
  let worst = 0, checked = 0;
  for (const [key, sp] of profileBodies()) {
    for (let i = 0; i < sp.occ.length; i++) {
      if (!sp.occ[i]) continue;
      const len = Math.hypot(sp.nx[i], sp.ny[i], sp.nz[i]);
      assert.ok(sp.nz[i] > 0, `${key} pixel ${i} has a normal facing away from the camera`);
      worst = Math.max(worst, Math.abs(len - 1));
      checked++;
    }
  }
  assert.ok(checked > 2000, `expected plenty of body pixels, got ${checked}`);
  assert.ok(worst < 1e-5, `worst normal length error ${worst} over ${checked} pixels`);
});

test('cloth and accent branches consume runtime light',()=>{
  const src=readFileSync(new URL('../src/shaders/sprite.js',import.meta.url),'utf8');
  const cloth=src.match(/else if\(mat < 5\.5\)\{([\s\S]*?)\} else if\(mat < 6\.5\)/)?.[1]||'';
  const accent=src.match(/else if\(mat < 6\.5\)\{([\s\S]*?)\} else if\(mat < 7\.5\)/)?.[1]||'';
  assert.match(cloth,/\bndl\b/,'body cloth ignores uLight-derived ndl');
  assert.match(accent,/\bndl\b/,'the accent still carries baked light');
});

test('machine eyes and the colossus flower use one pastel signal ramp',()=>{
  const src=readFileSync(new URL('../src/shaders/sprite.js',import.meta.url),'utf8');
  /* The branch is bounded at both ends: open-undercroft timber (12) sits
     above the signal materials 10 and 11 and falls through to wood. `mat>10.5`
     separates the green pulse from the red. */
  const eyes=src.match(/if\(mat > 9\.5 && mat < 11\.5\)\{([\s\S]*?)\} else if\(mat < 1\.5/)?.[1]||'';
  assert.ok(eyes,'the machine signal branch is not bounded to materials 10 and 11');
  assert.deepEqual(RAMP.machineSignal,[[239,156,165],[185,223,174]]);
  assert.match(eyes,/\$\{RAMP_ID\.machineSignal\}/,
    'machine signals are not fixed to their palette authority');
  assert.match(eyes,/mat>10\.5/,
    'the green pulse is not isolated from the red eye material');
  assert.match(eyes,/gl_FragColor/,'machine eye signal does not reach the raster');
});
