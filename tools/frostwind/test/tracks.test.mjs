/* ═══════════════════════════════════════════════════════════════════════════
   Ground contact: the shadow under a thing, and the tracks behind it.

     1  a contact shadow is drawn, not sampled from a distance field
     2  a footprint is weather, and goes away

   Reports print only when FROSTWIND_TEST_REPORT is set.

   Run: node --test test/tracks.test.mjs
   ═══════════════════════════════════════════════════════════════════════════ */

import test from 'node:test';
import assert from 'node:assert/strict';

import { CH, FLAG_Q, PRINT_HOLD, PRINT_LIFE, printStrength } from '../src/constants.js';
import { ACTOR, PRINT } from '../src/fauna.js';
import { DEER_SLIP, DEER_TRAVEL_PX } from '../src/body-deer.js';
import { WOLF_SLIP, WOLF_TRAVEL_PX } from '../src/body-wolf.js';
import { CAMEL_SLIP, CAMEL_TRAVEL_PX } from '../src/body-camel.js';
import { MACHINE, machineModel } from '../src/machine.js';
import { Scene } from '../src/scene.js';
import { CAST, TRACK_HALF_WIDTH, gaitCyclePx, heightPx } from '../src/people.js';
import { CONTACT_RUNGS, contactRows, contactRung, makeContact } from '../src/sprite.js';
import { SURF, SURFACE } from '../src/surface.js';
import { reportConsole as console } from './report.mjs';

const f2 = (n) => n.toFixed(2);
const pad = (s, n) => String(s).padEnd(n);

/* ── 1 ────────────────────────────────────────────────────────────────────
   No smooth curve. A thresholded `dx*dx+dy*dy<=1.0` mask is a distance field.
   A solid sampled ellipse has no interior holes; a dithered blob has holes
   wherever the dot screen thins, so its edge reads as a shade. */
test('the contact shadow is dithered, not a sampled ellipse', () => {
  const cases = [[13, 5], [16, 6], [21, 7], [9, 4]];
  const rows = [];
  let worst = 1;
  for (const [w, h] of cases) {
    const sp = makeContact(w, h);
    let on = 0, holes = 0, span = 0;
    for (let y = 0; y < h; y++) {
      /* A hole is an empty pixel with set pixels on both sides in its row,
         which a solid convex mask cannot have. */
      let first = -1, last = -1;
      for (let x = 0; x < w; x++) if (sp.occ[y * w + x]) { if (first < 0) first = x; last = x; }
      if (first < 0) continue;
      span += last - first + 1;
      for (let x = first; x <= last; x++) (sp.occ[y * w + x] ? on++ : holes++);
    }
    const frac = holes / Math.max(1, span);
    worst = Math.min(worst, frac);
    rows.push(`    ${pad(w + 'x' + h, 7)} ${pad(on + ' px', 8)} ${pad(holes + ' holes', 10)}` +
      ` = ${f2(100 * frac)}% of the blob's span is dot screen`);
  }
  console.log('\n  contact shadow, dithered blob');
  console.log(rows.join('\n'));
  console.log(`    a thresholded ellipse measures 0% here, by definition`);
  assert.ok(worst > 0.10,
    `the contact shadow has no dither in it — the thinnest case is ${f2(100 * worst)}% holes.\n` +
    `    A solid mask is a sampled distance field, which is the one curve this project does not draw.\n` +
    `    See makeContact in src/sprite.js.`);
});

/* A contact wider than its plant reads as a puddle: one 13 px blob under a
   5 px sedge tuft is two and a half times its width. */
test('a contact rung is never wider than the prop standing on it', () => {
  const rows = [];
  for (const rung of CONTACT_RUNGS) {
    const h = contactRows(rung);
    const sp = makeContact(rung, h);
    assert.equal(sp.w, rung);
    assert.equal(sp.h, h);
    /* One projection for the ladder: 5/13 is the traveller's contact, and
       rounding to whole rows costs at most half a pixel. The narrowest rung
       is the medium's exception: 5/13 of 5 px is under two rows, and a
       two-row ellipse loses its dither to the palette snap. Three rows is the
       floor. */
    const projected = rung * 5 / 13;
    const floored = h === 3 && projected < 3;
    assert.ok(floored || Math.abs(h - projected) <= 0.5,
      `the ${rung} px rung is ${h} rows against ${f2(projected)} projected, `
      + `and it is not the three-row legibility floor`);
    rows.push(`    ${pad(rung + 'x' + h, 7)} serves props ${rung} px and wider`
      + (floored ? '   (legibility floor, projection wanted '
        + f2(projected) + ')' : ''));
  }
  for (let w = 1; w <= 40; w++) {
    const rung = contactRung(w);
    assert.ok(CONTACT_RUNGS.includes(rung), `width ${w} chose ${rung}, off the ladder`);
    assert.ok(rung <= w || rung === CONTACT_RUNGS[0],
      `a ${w} px prop got a ${rung} px contact, wider than the prop itself`);
  }
  /* The floor: below the narrowest rung, a slightly generous contact reads
     better than none. */
  assert.equal(contactRung(2), CONTACT_RUNGS[0]);
  assert.equal(contactRung(13), 13);
  assert.equal(contactRung(100), CONTACT_RUNGS.at(-1));
  if (process.env.FROSTWIND_TEST_REPORT) {
    console.log('\n  short-prop contact ladder');
    console.log(rows.join('\n'));
  }
});

/* ── 2 ────────────────────────────────────────────────────────────────────
   The dot screen is the GPU's. sprite.js keeps its own copy of the 8x8 Bayer
   table so the sprite layer does not depend on palette.js. The copy is held
   to the original here. */
test('the contact dither uses the same Bayer table the ground does', async () => {
  const src = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../src/sprite.js', import.meta.url), 'utf8'));
  const pal = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../src/palette.js', import.meta.url), 'utf8'));
  const nums = (s, name) => {
    const m = s.match(new RegExp(name + '\\s*=\\s*\\[([^\\]]*)\\]'));
    return m ? m[1].split(',').map((v) => +v.trim()).filter((v) => !Number.isNaN(v)) : null;
  };
  const a = nums(src, 'BAYER8'), b = nums(pal, 'B');
  console.log(`\n  Bayer table: sprite.js has ${a ? a.length : 0} entries,` +
    ` palette.js has ${b ? b.length : 0}`);
  assert.ok(a && a.length === 64, 'sprite.js BAYER8 should be 64 entries');
  assert.ok(b && b.length === 64, 'palette.js B should be 64 entries');
  assert.deepEqual(a, b,
    'the two Bayer tables have drifted apart — the contact shadow would dither on a\n' +
    '    different screen from the ground it lands on.');
});

/* ── 3 ────────────────────────────────────────────────────────────────────
   A footprint is weather: it holds, fades and goes. An array cap (900 for
   the traveller, 1400 for the fauna) removes the oldest print in a single
   frame. */
test('a footprint holds, then fades, then is gone', () => {
  const at = [0, 5, 10, PRINT_HOLD * PRINT_LIFE, 15, 20, 25, 29, 30, 45];
  console.log(`\n  print life ${PRINT_LIFE}s, full depth for the first` +
    ` ${(PRINT_HOLD * PRINT_LIFE).toFixed(1)}s`);
  console.log('    ' + at.map((a) => `${a}s ${f2(printStrength(a))}`).join('   '));

  assert.equal(printStrength(0), 1, 'a fresh print is at full depth');
  assert.equal(printStrength(PRINT_HOLD * PRINT_LIFE - 0.01), 1, 'it holds through PRINT_HOLD');
  assert.equal(printStrength(PRINT_LIFE), 0, 'it is gone at PRINT_LIFE');
  assert.equal(printStrength(PRINT_LIFE * 3), 0, 'and stays gone');

  /* monotone, or a track gets deeper as it ages */
  let prev = Infinity;
  for (let a = 0; a <= PRINT_LIFE + 1; a += 0.25) {
    const s = printStrength(a);
    assert.ok(s <= prev + 1e-9, `strength rose at age ${a}: ${prev} -> ${s}`);
    prev = s;
  }
  /* It spends time part-way. */
  const partial = [];
  for (let a = 0; a <= PRINT_LIFE; a += 0.5) {
    const s = printStrength(a);
    if (s > 0.02 && s < 0.98) partial.push(a);
  }
  console.log(`    visibly fading for ${(partial.length * 0.5).toFixed(1)}s of its ${PRINT_LIFE}s life`);
  assert.ok(partial.length * 0.5 > PRINT_LIFE * 0.4,
    `a print should spend most of its life visibly fading, not snap off; measured` +
    ` ${(partial.length * 0.5).toFixed(1)}s of ${PRINT_LIFE}s`);
});

test('traveller boots are emitted at pose strikes after post-collision travel',()=>{
  const step=gaitCyclePx(heightPx(CAST.traveller),'walk')/2;
  const marks=[];
  const scene={
    px:step,py:0,lastPX:0,lastPY:0,prints:[],printGait:0,gait:4,
    lastTrafficPatch:null,locomotionState:'walk',
    gen:{lifePatchId:()=>null},r:{time:3},
    travellerKey:()=>'walk',
    mark:(...q)=>marks.push(q),
  };
  Scene.prototype.dropPrints.call(scene);
  assert.equal(scene.prints.length,1,'one planted pose did not produce one print');
  assert.equal(marks.length,1);
  assert.equal(scene.prints[0][1],TRACK_HALF_WIDTH,'the print is not under the planted boot');

  /* half a pose further: not yet another contact */
  scene.px+=step*0.5;scene.gait=6;
  Scene.prototype.dropPrints.call(scene);
  assert.equal(scene.prints.length,1,'a swing phase emitted a boot');

  /* and the opposite foot plants */
  scene.px+=step*0.5;scene.gait=8;
  Scene.prototype.dropPrints.call(scene);
  assert.equal(scene.prints.length,2);
  assert.equal(scene.prints[1][1],-TRACK_HALF_WIDTH,'both prints landed under one foot');

  /* blocked: the resolver granted nothing, so nothing was walked */
  Scene.prototype.dropPrints.call(scene);
  assert.equal(scene.prints.length,2,'zero displacement emitted a boot');
});

test('pressure-derived machine feet compress sward that rejects a boot',()=>{
  const sward=SURFACE[SURF.sward];
  assert.equal(sward.print,0,'ordinary feet should still leave sward unmarked');
  assert.ok(sward.yieldKPa>0);

  const makeChunk=()=>{
    const geom=new Uint8Array(CH*CH*4);
    for(let i=0;i<CH*CH;i++){
      geom[i*4]=180;
      geom[i*4+3]=SURF.sward*FLAG_Q;
    }
    return {ox:0,oy:0,geom,tex:{needsUpdate:false},base0:null};
  };

  const boot=makeChunk();
  assert.equal(Scene.prototype.stampPrint.call({},boot,CH/2,CH/2,PRINT.boot,1),false,
    'a boot acquired enough pressure to mark springy grass');

  const rows=[];
  for(const name of Object.keys(MACHINE)){
    const M=machineModel(name),track=ACTOR[name].track,c=makeChunk();
    assert.ok(track.pressureKPa>=sward.yieldKPa,
      `${name} pressure ${track.pressureKPa.toFixed(1)} kPa is below sward yield`);
    assert.equal(Scene.prototype.stampPrint.call({},c,CH/2,CH/2,track,1),true,
      `${name} did not compress pressure-gated sward`);
    assert.ok(c.geom[(CH/2*CH+CH/2)*4]<180);
    assert.ok(Math.abs(track.pressureKPa-M.pressureKPa)<1e-9);
    rows.push(`  ${name.padEnd(9)} ${track.pressureKPa.toFixed(1)} kPa`
      + `  ${track.rx.toFixed(1)}x${track.ry.toFixed(1)} px`);
  }
  console.log('\n  machine contact pressure and sward prints');
  console.log(rows.join('\n'));
});

/* uMinH spares a walking figure taller than it. An actor shorter than it
   needs the contact fallback the prop branch takes from CONTACT_RUNGS, or
   the body sits on the ground with no shadow. */
test('an actor too short to cast a projection still touches the ground', () => {
  const SHORT = ['fennec', 'sandgrouse', 'viper', 'turtle', 'squirrel', 'boar', 'heron'];
  const stub = (w, h) => ({ x: 0, y: 0, w, h });
  const rects = {};
  for (const rung of CONTACT_RUNGS) rects['contact:' + rung] = stub(rung, contactRows(rung));

  const rowFor = (key, w, h) => {
    rects[key + ':2:0'] = stub(w, h);
    return { key, x: 60, y: 45, hx: 1, hy: 0, gait: 0, moving: false, motionState: 'idle' };
  };
  /* the real canvases, read off src/animal.js and src/body-camel.js */
  const SIZE = {
    fennec: [9, 7], sandgrouse: [8, 6], viper: [11, 5], turtle: [10, 6],
    squirrel: [7, 6], boar: [16, 11], heron: [13, 19], camel: [47, 43],
  };

  const sceneFor = (keys) => {
    const scene = Object.create(Scene.prototype);
    Object.assign(scene, {
      r: { atlasGen: 1, time: 0, W: 120, H: 90,
        shadowMat: { uniforms: { uLight: { value: { x: 0, y: 0, z: 1 } }, uLen: { value: 1 } } },
        shoreCol: new Int32Array(120).fill(-100000) },
      spec: { aer: () => [0, 0, 0, 0] },
      baked: { rects }, atlas: { wheel: [[]] }, chunks: new Map(),
      gen: {}, actors: keys.map((k) => rowFor(k, ...SIZE[k])),
      wind: 1, dir: 0, moving: false, gait: 0, px: -9999, py: -9999,
    });
    return scene;
  };

  const blobs = [];
  for (const key of SHORT) {
    const v = sceneFor([key]).visible(0, 0, 0);
    const h = SIZE[key][1];
    assert.equal(v.contact.length, 1,
      `${key} is ${h} px tall, under the ${20} px projection floor, and threw ${v.contact.length} shadows`);
    assert.ok(v.contact[0].r.w <= SIZE[key][0],
      `${key} got a ${v.contact[0].r.w} px contact, wider than the ${SIZE[key][0]} px animal`);
    blobs.push(`  ${key.padEnd(10)} ${SIZE[key][0]}x${h} px  ->  ${v.contact[0].r.w} px contact`);
  }

  /* The camel is the control: it clears the floor, casts its sheared
     silhouette, and gets no round blob. */
  const tall = sceneFor(['camel']).visible(0, 0, 0);
  assert.equal(tall.contact.length, 0,
    'the camel clears uMinH and took a second, round shadow on top of its own');

  console.log('\n  actors under the projection floor');
  console.log(blobs.join('\n'));
});

/* Speed, stride and cadence are one equation (test/machine.test.mjs holds
   the machines to it). Measured failure: hand-typed print spacing puts the
   wolf's prints 35% closer than its trot covers ground and the camel's 17%
   closer. */
test('a rigged animal lays prints as far apart as it actually travels', () => {
  const rows = [
    ['roeDeer', 'walk', DEER_TRAVEL_PX.walk, DEER_SLIP],
    ['wolf', 'trot', WOLF_TRAVEL_PX.trot, WOLF_SLIP],
    ['camel', 'walk', CAMEL_TRAVEL_PX.walk, CAMEL_SLIP],
  ];
  const report = [];
  for (const [key, state, travel, slip] of rows) {
    /* Ground per cycle is travel x slip; one print per half cycle. */
    const want = travel * slip / 2;
    assert.ok(Math.abs(ACTOR[key].stride - want) < 1e-9,
      `${key} lays prints every ${ACTOR[key].stride.toFixed(2)} px while its `
      + `${state} covers ${(travel * slip).toFixed(2)} px a cycle`);
    report.push(`  ${key.padEnd(8)} ${state.padEnd(5)} ${want.toFixed(2)} px between prints`);
  }
  console.log('\n  derived print spacing');
  console.log(report.join('\n'));
});
