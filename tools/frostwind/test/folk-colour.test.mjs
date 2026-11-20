import test from 'node:test';
import assert from 'node:assert';
import {
  FOLK_STATES, folkLandmarks, folkPose,
} from '../src/body-folk.js';
import { makeFolk } from '../src/figure-folk.js';
import { CAST, paintPerson } from '../src/people.js';
import { PLAYER_H } from '../src/scale.js';
import { RAMP, RAMP_ID } from '../src/palette.js';
import { chromaOf } from '../src/sunlight.js';
import { SCENES } from '../src/scene.js';
import { HUMAN_AERIAL, SPRITE_FS } from '../src/shaders/sprite.js';
import {
  aerial, colourDistance, everyFrame, luminance, rampStep,
  resolveColour, saturation,
} from './folk-helpers.mjs';

test('the legs use the dedicated human black', () => {
  const dark = RAMP.folkDark.slice(0, 2).map((c) => c.map(Math.round).join(','));
  for (const [name, d, state, f] of everyFrame()) {
    const sp = makeFolk(name, d, f, state);
    for (let y = sp.hemRow + 1; y < sp.h; y++)
      for (let x = 0; x < sp.w; x++) {
        const i = y * sp.w + x, mat = sp.occ[i];
        if (!mat) continue;
        assert.notEqual(mat, 5,
          `${name} dir ${d} ${state}:${f} draws coat cloth below its own hem`);
        if (mat !== 17) continue;
        assert.ok(dark.includes(resolveColour(sp, i).join(',')),
          `${name} dir ${d} ${state}:${f} has a ${resolveColour(sp, i)} leg pixel`);
      }
  }
});

test('the face is two stacked bands, and the hands are the eye value again', () => {
  // The ten source sheets use a two-pixel eye band and face band.
  const L = folkLandmarks(PLAYER_H);
  const base = makeFolk('traveller', 0, 0, 'walk');
  const pose = folkPose({ h: PLAYER_H, state: 'walk', frame: 0 });
  const rowOf = (r) => 6 + r - pose.lift;
  const bandAt = (sp, y, want) => {
    let n = 0;
    for (let x = 0; x < sp.w; x++)
      if (sp.occ[y * sp.w + x] === 6 &&
        Math.abs(sp.shade[y * sp.w + x] - want) < 1e-6) n++;
    return n;
  };
  assert.equal(bandAt(base, rowOf(L.eye), 1.00), 2, 'the eye band is not two pixels');
  assert.equal(bandAt(base, rowOf(L.face), 0.34), 2, 'the face band is not two pixels');

  const bright = [];
  for (let y = 0; y < base.h; y++)
    for (let x = 0; x < base.w; x++) {
      const i = y * base.w + x;
      if (base.occ[i] === 6 && base.shade[i] === 1) bright.push([x, y]);
    }
  const handRows = [...new Set(bright.map(([, y]) => y))]
    .filter((y) => y > rowOf(L.jaw));
  assert.equal(handRows.length, 2, `the hands span ${handRows.length} rows`);
  const hands = bright.filter(([, y]) => handRows.includes(y));
  assert.equal(hands.length, 4, `expected four hand pixels, found ${hands.length}`);
  const cx = base.ax;
  for (const [label, side] of [['left', -1], ['right', 1]]) {
    const hand = hands.filter(([x]) => Math.sign(x - cx) === side);
    assert.equal(hand.length, 2, `the ${label} hand is not two pixels`);
    assert.equal(new Set(hand.map(([x]) => x)).size, 1, `the ${label} hand is horizontal`);
  }
  for (const d of [1, 4]) {
    const sp = makeFolk('traveller', d, 0, 'walk');
    assert.equal(bandAt(sp, rowOf(L.eye), 1.00), 0,
      `dir ${d} is the back of a head and it has a face`);
  }
});

test('the signal is the brightest thing on the body, and only two colours', () => {
  for (const d of [0, 2, 3]) {
    const sp = makeFolk('traveller', d, 0, 'walk');
    let best = -1, bestMat = 0;
    for (let i = 0; i < sp.occ.length; i++) {
      if (!sp.occ[i]) continue;
      const l = luminance(resolveColour(sp, i));
      if (l > best) { best = l; bestMat = sp.occ[i]; }
    }
    assert.equal(bestMat, 6,
      `dir ${d}: the brightest pixel is material ${bestMat}, not the signal`);
  }
  const seen = new Set();
  for (const [name, d, state, f] of everyFrame()) {
    const sp = makeFolk(name, d, f, state);
    for (let i = 0; i < sp.occ.length; i++)
      if (sp.occ[i] === 6) seen.add(resolveColour(sp, i).join(','));
  }
  assert.equal(RAMP.folkSignal.length, 2, 'the signal ramp grew rungs');
  assert.ok(seen.size <= 2, `the signal resolves to ${seen.size} colours: ${[...seen]}`);
  for (const c of seen)
    for (const s of RAMP.skin)
      assert.notEqual(c, s.map(Math.round).join(','), 'the signal landed on skin');
});

test('no material spends more than the four values posterise can keep', () => {
  // The four-tier invariant applies per material.
  const byMat = new Map();
  for (const [name, d, state, f] of everyFrame()) {
    const sp = makeFolk(name, d, f, state);
    for (let i = 0; i < sp.occ.length; i++) {
      const m = sp.occ[i];
      if (!m) continue;
      if (!byMat.has(m)) byMat.set(m, new Set());
      byMat.get(m).add(sp.shade[i].toFixed(4));
    }
  }
  for (const [m, values] of byMat)
    assert.ok(values.size <= 4,
      `material ${m} authors ${values.size} values: ${[...values].sort().join(' ')}`);
});

test('the mass is undyed fleece, the band is dye, and the signal is above both', () => {
  const fleece = ['folkWool', 'folkUmber', 'folkOat'];
  const heroCoats = ['folkCoat', 'swampCoat'];
  for (const name of [...fleece, ...heroCoats, 'folkDye', 'folkSignal'])
    for (let i = 1; i < RAMP[name].length; i++)
      assert.ok(luminance(RAMP[name][i]) > luminance(RAMP[name][i - 1]),
        `${name} rung ${i} is not lighter than rung ${i - 1}`);

  // Oklab chroma is the palette authority for lightness-independent quietness.
  const chroma = (ramp) => Math.max(...RAMP[ramp].map(chromaOf));
  const field = luminance(RAMP.snow[3]);
  for (const name of fleece) {
    const r = RAMP[name];
    assert.ok(chroma(name) < 0.10,
      `${name} reaches Oklab chroma ${chroma(name).toFixed(3)}; a fleece is`
      + ` undyed and a mass this size cannot be the loud thing`);
    assert.ok(luminance(r.at(-1)) < field,
      `${name} tops out at ${luminance(r.at(-1)).toFixed(0)} against a snowfield at`
      + ` ${field.toFixed(0)}; a figure lighter than the ground it stands on has`
      + ` no silhouette left`);
  }
  const tops = fleece.map((name) => luminance(RAMP[name].at(-1))).sort((a, b) => a - b);
  for (let i = 1; i < tops.length; i++)
    assert.ok(tops[i] - tops[i - 1] > 12,
      `two fleeces are ${(tops[i] - tops[i - 1]).toFixed(0)} luminance apart and`
      + ` read as one garment`);

  assert.equal(RAMP.folkDye.length, 2, 'the dye ramp grew rungs');
  for (const name of fleece)
    assert.ok(chroma('folkDye') > 1.5 * chroma(name),
      `the dyed band reaches ${chroma('folkDye').toFixed(3)} chroma against`
      + ` ${name} at ${chroma(name).toFixed(3)} and is not the loud thing`);

  for (const coat of heroCoats) {
    assert.ok(chroma(coat) > 0.10,
      `${coat} reaches only ${chroma(coat).toFixed(3)} chroma`);
    assert.ok(saturation(RAMP[coat].at(-1)) > 2 * saturation(RAMP.warm.at(-1)),
      `${coat} is not meaningfully louder than the world cloth it replaced`);
    for (const name of fleece)
      assert.ok(chroma(coat) > 1.2 * chroma(name),
        `${coat} is not louder than ${name}, which every villager wears`);
  }

  assert.ok(luminance(RAMP.folkSignal.at(-1)) > 200,
    'the signal is not bright enough to be the thing you look at');
  for (const name of [...fleece, ...heroCoats, 'folkDye'])
    assert.ok(luminance(RAMP.folkSignal.at(-1)) > luminance(RAMP[name].at(-1)),
      `${name} is brighter than the face; where to look has to be one answer`);
});

test('human surfaces keep their chroma while light and air still reach them', () => {
  assert.match(SPRITE_FS, /bool humanSurface/);
  assert.match(SPRITE_FS, new RegExp(`vComp\\*${HUMAN_AERIAL.compression}`));
  assert.match(SPRITE_FS, new RegExp(`uDesat\\*${HUMAN_AERIAL.desaturation}`));
  assert.match(SPRITE_FS, new RegExp(`vFog\\*${HUMAN_AERIAL.fog}`));

  for (const [sceneName, scene] of Object.entries(SCENES)) {
    const [targetL, comp, desat, fogA] = scene.aer();
    for (const rampName of ['folkCoat', 'folkDye', 'folkSignal']) {
      const source = RAMP[rampName].at(-1);
      const resolved = aerial(source, targetL,
        comp * HUMAN_AERIAL.compression,
        desat * HUMAN_AERIAL.desaturation,
        fogA * HUMAN_AERIAL.fog, scene.fog);
      const retention = saturation(resolved) / saturation(source);
      assert.ok(retention >= 0.75,
        `${sceneName} ${rampName} retains only ${retention.toFixed(3)} of its saturation`);
    }
  }

  const frost = SCENES.frostwood, [targetL, comp, desat, fogA] = frost.aer();
  const protect = (c, f = fogA * HUMAN_AERIAL.fog) => aerial(c, targetL,
    comp * HUMAN_AERIAL.compression,
    desat * HUMAN_AERIAL.desaturation, f, frost.fog);
  const dark = protect(rampStep('folkCoat', 0.60));
  const lit = protect(rampStep('folkCoat', 1.00));
  assert.ok(luminance(lit) > luminance(dark) + 15,
    'the protected coat stopped responding to light');

  const source = RAMP.folkCoat.at(-1), near = protect(source, 0), far = protect(source);
  assert.ok(colourDistance(far, frost.fog) < colourDistance(near, frost.fog),
    'the protected coat stopped moving toward scene fog');

  assert.doesNotMatch(SPRITE_FS, /mat > 254\.5/,
    'the raw-colour escape hatch is back in the sprite shader');
  for (const name of Object.keys(CAST)) {
    const sp = paintPerson(name, 0, 0, 'idle');
    assert.equal(sp.rgba, undefined, `${name} carries stored colour`);
    for (let i = 0; i < sp.occ.length; i++)
      assert.ok(sp.occ[i] < 20, `${name} paints material ${sp.occ[i]}`);
  }
});

test('folk colours clear world backgrounds and the under-layer owns near-black', () => {
  // Loud ramps separate by RGB distance while fleece separates by value.
  const worlds = [
    [['folkCoat', 'folkDye'], ['snow', 'birch', 'shade', 'trunk']],
    [['folkCoat', 'folkDye'], ['swampGround', 'swampWood', 'swampCanopy', 'swampWater']],
  ];
  for (const [garments, backgrounds] of worlds)
    for (const garment of garments)
      for (const background of backgrounds)
        for (const a of RAMP[garment])
          for (const b of RAMP[background])
            assert.ok(colourDistance(a, b) >= 35,
              `${garment} approaches ${background} by ${colourDistance(a, b).toFixed(1)} RGB`);
  assert.ok(luminance(RAMP.folkDark[0]) < 12,
    `folkDark starts at luminance ${luminance(RAMP.folkDark[0])}`);
  assert.match(SPRITE_FS, /RAMP_ID\.folkDark|human under-layer|coatForm/);
  assert.match(SPRITE_FS, /mat > 17\.5 && mat < 18\.5/);
  assert.match(SPRITE_FS,
    new RegExp(`mat > 17\\.5[\\s\\S]{0,900}rampStep\\(${RAMP_ID.folkDye}\\.0`));
});

test('the profile bank is eight frames, because near and far are a rung apart', () => {
  // Measured failure: equal leg rungs collapsed the eight-frame bank to four.
  for (const name of ['traveller', 'meadowTraveller', 'swampTraveller'])
    for (const state of ['walk', 'run']) {
      const frames = new Set();
      for (let f = 0; f < FOLK_STATES[state]; f++) {
        const sp = paintPerson(name, 2, f, state);
        const key = [];
        for (let i = 0; i < sp.occ.length; i++)
          key.push(!sp.occ[i] ? ''
            : sp.occ[i] === 17 ? resolveColour(sp, i).join(',')
              : `${sp.occ[i]}:${sp.shade[i].toFixed(2)}`);
        frames.add(key.join('|'));
      }
      assert.equal(frames.size, FOLK_STATES[state],
        `${name} ${state} in profile draws ${frames.size} distinct frames`
        + ` of ${FOLK_STATES[state]}`);
    }
});
