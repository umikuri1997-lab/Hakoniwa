import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { PX_PER_M } from '../src/scale.js';
import { SCENES } from '../src/scene.js';
import { SURFACE, SURF } from '../src/surface.js';
import { W_GROUND_FS } from '../src/shaders/world.js';
import {
  WAVE_EFFICIENCY, WORM, WORM_GLSL, WORM_GIRTH_PX, WORM_LEN_PX, WORM_REPOSE,
  WORM_SPEED_MPS, WORM_SPEED_PX, WORM_MIN_DEPTH_M, swellHalfPx, swellRisePx,
  wormAt, wormDepthAt, wormHeavePx,
} from '../src/worm.js';

const renderSource=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const wormSource=readFileSync(new URL('../src/worm.js',import.meta.url),'utf8');

test('the worm moves at its own wave, and the wave is measured',()=>{
  /* Maladen, Ding, Li & Goldman, Science 325:314-318 (2009): a sand-swimmer
     propagates a travelling wave down its body and advances at the wave's
     speed times an efficiency near 0.5 (half the wave's progress is slip).
     Speed is wavelength times frequency times that, with no speed constant. */
  assert.equal(WAVE_EFFICIENCY,0.50);
  assert.ok(Math.abs(WORM_SPEED_MPS
    -WORM.waveLengthM*WORM.waveHz*WAVE_EFFICIENCY)<1e-12,
    'the worm has a speed that is not its wave times its efficiency');
  assert.ok(Math.abs(WORM_SPEED_PX-WORM_SPEED_MPS*PX_PER_M)<1e-9);
  /* Slower than the running traveller: a presence to get away from, not a
     pursuit. */
  assert.ok(WORM_SPEED_PX<62,
    `the worm crosses at ${WORM_SPEED_PX.toFixed(1)} px/s against a running `
    +`traveller's 62, so it can chase him`);
});

test('how deep it runs decides how wide it reads, and nothing else does',()=>{
  /* The relation is the angle of repose, the dune field's constant. A
     subsurface displacement reaches the surface inside a cone limited by that
     angle, so each metre of depth buys 1/tan(repose) metres of half-width,
     and the same displaced volume over that width sets the height. Shallow
     is a narrow sharp ridge, deep a broad low swell. */
  assert.ok(Math.abs(WORM_REPOSE-SURFACE[SURF.sand].repose*Math.PI/180)<1e-12,
    'the worm is not reading its repose angle from the surface table');
  let priorHalf=0, priorRise=Infinity;
  for(const d of [WORM_MIN_DEPTH_M,1.6,2.4,3.4,4.4]){
    const half=swellHalfPx(d), rise=swellRisePx(d);
    assert.ok(half>priorHalf,'a deeper worm did not read wider');
    assert.ok(rise<priorRise,'a deeper worm did not read lower');
    /* the derived width, checked against the cone rather than against a table */
    assert.ok(Math.abs(half
      -(WORM.girthM*0.5+d/Math.tan(WORM_REPOSE))*PX_PER_M)<1e-9);
    priorHalf=half; priorRise=rise;
  }
  /* The swell's flank obeys repose too, and that constraint sets how shallow
     the animal can run. A raised cosine's steepest slope goes as 1/w^2 and w
     grows with depth, so below some depth the mark cannot stand. */
  for(const d of [WORM_MIN_DEPTH_M,2.4,4.4]){
    const half=swellHalfPx(d), rise=swellRisePx(d);
    /* a raised cosine of this height and half-width has a steepest slope of
       pi*rise/(2*half) */
    const steepest=Math.PI*rise/(2*half);
    assert.ok(steepest<=Math.tan(WORM_REPOSE),
      `at ${d} m the swell's flank stands at ${steepest.toFixed(3)} against a `
      +`repose slope of ${Math.tan(WORM_REPOSE).toFixed(3)}`);
  }
  /* At its shallowest the mark stands exactly at repose. */
  const lo=WORM_MIN_DEPTH_M;
  const steepestAtLo=Math.PI*swellRisePx(lo)/(2*swellHalfPx(lo));
  assert.ok(Math.abs(steepestAtLo-Math.tan(WORM_REPOSE))<1e-6,
    `at its shallowest the mark stands at ${steepestAtLo.toFixed(4)}, not at repose`);
  /* it surfaces in the middle of a crossing and is deep at both ends */
  assert.ok(wormDepthAt(0.5)<wormDepthAt(0.05));
  assert.ok(wormDepthAt(0.5)<wormDepthAt(0.95));
  assert.ok(Math.abs(wormDepthAt(0.5)-WORM_MIN_DEPTH_M)<1e-9);
});

test('a crossing is rare, committed and finite',()=>{
  /* More of the cycle is rest than crossing. */
  assert.ok(WORM.restS>WORM.crossingS,
    'a worm spends more of its time crossing than resting');
  const seed=0.37;
  let seen=0;
  for(let t=0;t<WORM.crossingS+WORM.restS;t+=2){
    const w=wormAt(0,t,seed);
    if(w.phase>0&&w.phase<1) seen++;
  }
  const share=seen/((WORM.crossingS+WORM.restS)/2);
  assert.ok(share>0.2&&share<0.5,
    `a worm is out ${(share*100).toFixed(0)}% of the time`);
  /* deterministic, and a route that actually goes somewhere */
  for(const t of [7,31,64]) assert.deepEqual(wormAt(0,t,seed),wormAt(0,t,seed));
  const a=wormAt(0,10,seed).head, b=wormAt(0,60,seed).head;
  assert.ok(Math.hypot(b.x-a.x,b.y-a.y)>WORM_LEN_PX,
    'a worm did not travel its own length in fifty seconds');
});

test('the heave is a bounded travelling mark on the ground',()=>{
  const seed=0.37;
  const w=wormAt(0,48,seed);
  assert.ok(w.phase>0&&w.phase<1,'the sampled instant has no worm out in it');
  /* Highest on the axis, falling to nothing by the derived half-width. */
  const depth=wormDepthAt(w.phase), half=swellHalfPx(depth);
  const n={x:-w.dir.y,y:w.dir.x};
  const mid={x:w.head.x-w.dir.x*WORM_LEN_PX*0.5,
             y:w.head.y-w.dir.y*WORM_LEN_PX*0.5};
  const at=(k)=>wormHeavePx(mid.x+n.x*k,mid.y+n.y*k,48,seed);
  assert.ok(at(0)>at(half*0.5),'the swell is not highest on its own axis');
  assert.ok(at(half*0.5)>at(half*0.95));
  assert.ok(at(half*1.2)===0,'the swell reaches past the cone that raised it');
  /* Far under the dune's amplitude: a mark on the landform. */
  assert.ok(at(0)<49,`the swell rises ${at(0).toFixed(1)} px, past a whole dune`);
  /* nothing at all when it is resting */
  const rest=wormAt(0,WORM.crossingS+40,seed);
  assert.ok(rest.phase>=1,'the rest sample is still a crossing');
});

test('the ground draws it, and only in the world whose ground it is',()=>{
  /* No sprite, no simulation: a function of world position and time added to
     the baked normal in the ground pass. */
  assert.match(W_GROUND_FS,/float wormHeave\(vec2 gp,float time,float seed\)/);
  assert.match(W_GROUND_FS,/N = normalize\(N \+ vec3\(-hx\*0\.5, -hy\*0\.5, 0\.0\)\*uWorm\)/);
  /* The ground plane: a screen row is two ground pixels of depth, so a
     screen-space route runs at the wrong speed across it. */
  assert.match(W_GROUND_FS,/\(floor\(gpx\.y\)\+uCam\.y\)\*2\.0/);
  assert.match(renderSource,/uWorm:\{value:0\}, uWormSeed:\{value:0\}/);
  /* declared by the scene and by exactly one scene */
  assert.equal(SCENES.desert.worm,true);
  for(const id of Object.keys(SCENES))
    if(id!=='desert') assert.ok(!SCENES[id].worm,`${id} has a worm in it`);
  /* both sides compute the same chain in the same order */
  for(const fn of ['wormDepthAt','wormSwellHalf','wormSwellRise','wormAt','wormHeave'])
    assert.ok(WORM_GLSL.includes(`${fn}(`),`WORM_GLSL has no ${fn}`);
});

test('the invention is one law, and its boundary is the thing it cannot cross',()=>{
  /* A dreamed animal is admissible when its invention is stated, narrow and
     bounded. The worm's: sand may fluidise around a body. It does not cancel
     mass, weight, momentum or contact. Gravel does not fluidise, so the worm
     cannot enter firm ground, which is why the settlement is on the pavement.
     The law and its boundary are stated in src/worm.js and docs/CANON.md. */
  assert.match(wormSource,/a body may fluidise the sand it displaces/i);
  assert.match(wormSource,/gravel does not fluidise/i);
  assert.match(wormSource,/Maladen, Ding, Li & Goldman/);
  const canon=readFileSync(new URL('../docs/CANON.md',import.meta.url),'utf8');
  assert.match(canon,/fluidise/i,'the invented law is not in the canon register');
  /* The breach is capped by the frame: 180 rows is 11.77 m and nothing may
     exceed half of it, so about five metres of body can clear the sand. The
     size is inferred from the ground moving. */
  assert.ok(WORM.bodyM*PX_PER_M>180,
    'the worm is shorter than the frame, so nothing about it has to be inferred');
  assert.ok(WORM_GIRTH_PX<90,
    `a ${WORM_GIRTH_PX.toFixed(0)} px girth breaches past half the frame`);
});
