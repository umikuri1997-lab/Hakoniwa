import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { RAMP, RAMP_ID, bakeOutPalette, repaint, warmShift } from '../src/palette.js';
import { Scene, SCENES } from '../src/scene.js';
import { MARK_MAX } from '../src/spell.js';
import { KINDS, SPECIES } from '../src/species.js';
import { POST_FS, SPRITE_FS } from '../src/shaders/sprite.js';
import { W_GROUND_FS, W_WATER_FS } from '../src/shaders/world.js';
import { SURFACE, SURF } from '../src/surface.js';
import {
  RAIN, RAIN_GLSL, projectedRippleDistance, rainDiameter, rainEventAt,
  rainEventRandom, rainLambda, rainRingCount, rainTerminalMps, rainTerminalPx,
  rainWeber, rippleRadiusPx,
  SAND, SAND_GLSL, SAND_THRESHOLD_SHEAR, SAND_THRESHOLD_WIND,
  sandShear, sandFlux, sandHopHeightM, sandHopLengthM, sandGrainSpeedMps,
  sandHaze, sandCoverage,
  GUST, WIND_GLSL, gustAt, gustPhase,
} from '../src/weather.js';
import { WCA, WSA } from '../src/constants.js';
import { PX_PER_M } from '../src/scale.js';
import { W_SHADOW_FS } from '../src/shaders/world.js';

const renderSource=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const sceneSource=readFileSync(new URL('../src/scene.js',import.meta.url),'utf8');

test('only a growing stem bends in the wind',()=>{
  /* windUV shears a sprite's rows sideways in a gust and skips any instance
     whose phase is negative. That is the only switch: a positive phase or a
     literal 0 bends, so built props and actors must write a negative one. */
  /* a negative phase is rigid, in still air and under a spell front alike */
  assert.match(SPRITE_FS,/if\(vPhase < 0\.0 \|\| \(uWind < 0\.001 && abs\(vBend\) < 0\.5\)\) return vUV;/);
  assert.match(renderSource,/this\.ph\[i\]=e\.phase===undefined\?-1:e\.phase;/);

  /* One prop per placeable atlas kind, resolved through the real
     Scene.resolve with stub atlas and rects. */
  const scene=new Scene({W:320,H:180,time:0},7,{},'frostwood');
  const built=['log','house','cabin','swampHouse','swampDock','lakeHouse',
               'ruinWall','pillar','derelict','wheel','bay','hut','tent',
               'capHouse','lampPost','cutBench'];
  const kinds=[...KINDS,...built];
  scene.atlas=Object.fromEntries(kinds.map(k=>[k,[[{ramp:'trunk',sMin:0,sMax:1,tilt:0}]]]));
  scene.baked={rects:Object.fromEntries(kinds.map(k=>
    [`${k}:0:0`,{x:0,y:0,w:4,h:8,ax:2,ay:7}]))};
  const chunk={props:kinds.map((kind,i)=>
    ({kind,tier:0,x:40+i*7,y:60+i*11,vari:0,tilt:0,flip:false}))};
  scene.resolve(chunk);
  for(const p of chunk.props){
    if(KINDS.includes(p.kind)&&SPECIES[p.kind].rigid){
      /* stone, and a body that grows in still air */
      assert.ok(p.phase<0,`${p.kind} is rigid and bends in a gust`);
    } else if(KINDS.includes(p.kind)){
      assert.ok(p.phase>=0,`${p.kind} is a plant and should bend`);
      assert.ok(Number.isFinite(p.phase),`${p.kind} phase is not a number`);
    } else {
      assert.ok(p.phase<0,`${p.kind} is built and must not bend`);
    }
  }
  /* Stems in different places gust out of step. */
  const stems=chunk.props.filter(p=>KINDS.includes(p.kind)&&!SPECIES[p.kind].rigid)
    .map(p=>p.phase);
  assert.equal(new Set(stems).size,stems.length,'every stem shares one phase');

  /* The only positive phase any draw-list producer writes is a prop's own. */
  const literal=[...sceneSource.matchAll(/phase:([^,}\s]+)/g)].map(m=>m[1]);
  for(const v of literal)
    assert.ok(v==='RIGID'||v==='p.phase',`a draw list writes phase:${v}`);
});

test('rain events are deterministic, bounded, and move their impact each cycle',()=>{
  const a=rainEventAt(-17,31,12.5),b=rainEventAt(-17,31,12.5);
  assert.deepEqual(a,b);
  assert.ok(a.age>=0&&a.age<a.period);
  assert.ok(a.x>=-17*RAIN.cellPx&&a.x<-16*RAIN.cellPx);
  assert.ok(a.y>=31*RAIN.cellPx&&a.y<32*RAIN.cellPx);
  const next=rainEventAt(-17,31,12.5,RAIN.intensity,1);
  assert.equal(next.age,a.age);
  assert.notDeepEqual([next.x,next.y],[a.x,a.y],
    'a lattice cell repeats the same impact point every cycle');
});

test('Marshall-Palmer sampling stays inside its authored visible diameter band',()=>{
  assert.equal(RAIN.rateMmH,12);
  assert.ok(rainLambda(24)<rainLambda(6),
    'heavier rain should shift the exponential prior toward larger drops');
  let prior=RAIN.minDiameterMm;
  for(let i=0;i<=1000;i++){
    const d=rainDiameter(i/1000);
    assert.ok(d>=RAIN.minDiameterMm-1e-12&&d<=RAIN.maxDiameterMm+1e-12);
    assert.ok(d>=prior-1e-12,'inverse CDF is not monotonic');
    prior=d;
  }
});

test('Atlas terminal velocity and Weber impact energy are monotonic and capped',()=>{
  let lastV=-1,lastW=-1;
  for(let d=RAIN.minDiameterMm;d<=RAIN.maxDiameterMm;d+=0.01){
    const v=rainTerminalMps(d),w=rainWeber(d);
    assert.ok(v>=lastV&&w>=lastW);
    assert.ok(v<9.65,'terminal velocity exceeded the Atlas asymptote');
    assert.ok(Math.abs(rainTerminalPx(d)/v-RAIN_GLSL.match(/RAIN_PX_PER_M=([\d.]+)/)[1])<1e-5);
    lastV=v;lastW=w;
  }
});

test('water rings use measured capillary-gravity speed and the 2:1 projection',()=>{
  assert.ok(RAIN.waveSpeedMps>0.22&&RAIN.waveSpeedMps<0.24);
  assert.equal(rippleRadiusPx(0),0);
  assert.ok(rippleRadiusPx(0.5)<rippleRadiusPx(1));
  assert.equal(projectedRippleDistance(2,0),2);
  assert.equal(projectedRippleDistance(0,1),2);
  assert.match(RAIN_GLSL,/rainProjectedDistance\(vec2 d\).*vec2\(1\.0,2\.0\)/);
  assert.match(W_WATER_FS,/rainRippleRadius\(age\)/);
});

test('each impact deterministically selects one to three concentric rings',()=>{
  const seen=new Set();
  for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){
    const a=rainRingCount(x,y,17),b=rainRingCount(x,y,17);
    assert.equal(a,b);
    assert.ok(a>=1&&a<=RAIN.maxRippleRings);
    assert.equal(rainEventRandom(x,y,17,83.1),
      rainEventRandom(x,y,17,83.1));
    seen.add(a);
  }
  assert.deepEqual([...seen].sort(),[1,2,3]);
  assert.match(W_WATER_FS,/ringCount>1\.5/);
  assert.match(W_WATER_FS,/ringCount>2\.5/);
});

test('one world-anchored event feeds streak, ground, water and canopy responses',()=>{
  assert.match(POST_FS,/vec2 wp = px \+ uCam/);
  assert.match(POST_FS,/rainDrop\(cell,cycle\+1\.0/);
  assert.match(POST_FS,/uWindX/);
  assert.match(W_GROUND_FS,/rainClock\(cell,uRain,uTime/);
  assert.match(W_WATER_FS,/vec2 wp = floor\(px\)\+uCam/);
  assert.match(W_WATER_FS,/rippleOffset/);
  assert.match(SPRITE_FS,/RAIN_LEAF_LIFE/);
  assert.match(SPRITE_FS,/Reflected sprites receive uRain=0/);
});

test('distant rain is occluded by animated sprites while a near layer survives',()=>{
  assert.match(POST_FS,/uniform sampler2D uWeatherMask/);
  assert.match(POST_FS,/texture2D\(uWeatherMask,rtUV\(vUV\)\)\.a/);
  assert.match(POST_FS,/nearLayer=step\(0\.74,rainEventRandom/);
  assert.match(POST_FS,/nearLayer>0\.5\|\|weatherOcclusion<0\.5/);
  assert.match(renderSource,/this\.rtWeather=new THREE\.WebGLRenderTarget/);
  assert.match(renderSource,/R\.setRenderTarget\(this\.rtWeather\)/);
  assert.match(renderSource,/R\.render\(this\.bBehind\.scene,this\.cam\)/);
  assert.match(renderSource,/R\.render\(this\.bFront\.scene,this\.cam\)/);
});

test('rain uses scene and receiving-surface ramps rather than RGB literals',()=>{
  assert.ok(RAMP[RAIN.ramp]);
  assert.ok(SCENES.swamp.ramps.includes(RAIN.ramp));
  assert.equal(RAMP_ID[RAIN.ramp],RAMP_ID.birch);
  assert.match(POST_FS,/c=rampStep\(uRainRamp,rung\)/);
  assert.match(W_GROUND_FS,/c=rampStep\(surfaceRamp/);
  assert.match(W_WATER_FS,/c=rampStep\(surfaceRamp/);
  assert.match(SPRITE_FS,/c=rampStep\(vRamp2,1\.0\)/);
  assert.equal(SURFACE[SURF.peat].rainGround,1);
  assert.equal(SURFACE[SURF.boardwalk].rainGround,1);
  assert.equal(SURFACE[SURF.duckweed].rainGround,undefined);
});

const scalar=value=>({value});
const vector=()=>({value:{
  set(...v){this.last=v;return this;},
  copy(v){this.last=v;return this;},
}});
function rendererMock(){
  const sprite=()=>({uniforms:{
    uWind:scalar(0),uLight:vector(),uDesat:scalar(0),uRain:scalar(0),
    uIce:scalar(-1),
  }});
  return {
    spriteMat:sprite(),reflectionMat:sprite(),
    shadowMat:{uniforms:{uWind:scalar(0)}},
    post:{mat:{uniforms:{uFlakes:scalar(0),uRain:scalar(0),uRainRamp:scalar(0),
      uSand:scalar(0)}}},
    ground:{mat:{uniforms:{uRain:scalar(0),uAer:vector(),
      uWorm:scalar(0),uWormSeed:scalar(0),uMarkN:scalar(0)}}},
    water:{mat:{uniforms:{uRain:scalar(0),uReflect:vector(),
      uMarkN:scalar(0),uIce:scalar(-1)}}},
    /* the spell mark rows; none are live here */
    markA:Array.from({length:MARK_MAX},vector).map((v)=>v.value),
    markB:Array.from({length:MARK_MAX},vector).map((v)=>v.value),
  };
}
function weatherFor(id,{enabled=true}={}){
  const r=rendererMock(),scene=new Scene(r,7,{},id);
  scene.uniforms({precipitation:enabled,wind:1.25},0,0);
  return {
    snow:r.post.mat.uniforms.uFlakes.value,
    rain:r.post.mat.uniforms.uRain.value,
    spriteRain:r.spriteMat.uniforms.uRain.value,
    reflectedRain:r.reflectionMat.uniforms.uRain.value,
    sand:r.post.mat.uniforms.uSand.value,
    wind:r.spriteMat.uniforms.uWind.value,
  };
}

test('scene climate gates snow, clear air, swamp rain and the control',()=>{
  assert.deepEqual(Object.fromEntries(Object.entries(SCENES).map(([k,v])=>
    [k,v.precipitation.kind])),
    {frostwood:'snow',meadow:'clear',swamp:'rain',desert:'sand',hollow:'rain'});
  assert.deepEqual(weatherFor('frostwood'),{
    sand:0,snow:1,rain:0,spriteRain:0,reflectedRain:0,wind:1.25,
  });
  assert.deepEqual(weatherFor('meadow'),{
    sand:0,snow:0,rain:0,spriteRain:0,reflectedRain:0,wind:1.25,
  });
  assert.deepEqual(weatherFor('swamp'),{
    sand:0,snow:0,rain:1,spriteRain:1,reflectedRain:0,wind:1.25,
  });
  /* The desert's control only makes sand available. Whether any moves comes
     from the wind against a threshold friction velocity, so `sand:1` with the
     wind below 8 m/s draws nothing. The transport model below asserts it. */
  assert.deepEqual(weatherFor('desert'),{
    sand:1,snow:0,rain:0,spriteRain:0,reflectedRain:0,wind:1.25,
  });
  assert.equal(weatherFor('desert',{enabled:false}).sand,0);
  assert.equal(weatherFor('swamp',{enabled:false}).rain,0);
});

/* ── BLOWN SAND ───────────────────────────────────────────────────────────── */

test('nothing moves until the wind can lift the grain it is blowing over',()=>{
  /* Sand moves only when the shear at the bed exceeds what lifts a grain of
     that size, so this weather has a physical off state.

     u*t = A sqrt(((rho_s - rho)/rho) g d), Bagnold 1941, A near 0.1 for loose
     graded sand. At 0.25 mm this is 0.230 m/s, and through the law of the wall
     an 8.1 m/s wind at ten metres, the observed onset of visible drift. */
  assert.ok(Math.abs(SAND_THRESHOLD_SHEAR-0.2302)<0.001,
    `threshold friction velocity is ${SAND_THRESHOLD_SHEAR.toFixed(4)} m/s`);
  assert.ok(SAND_THRESHOLD_WIND>7.5&&SAND_THRESHOLD_WIND<8.5,
    `the grain needs a ${SAND_THRESHOLD_WIND.toFixed(2)} m/s wind, outside the observed band`);
  assert.equal(sandFlux(SAND_THRESHOLD_SHEAR),0,'sand moved at exactly the threshold');
  assert.equal(sandFlux(SAND_THRESHOLD_SHEAR*0.999),0,'sand moved below the threshold');
  assert.ok(sandFlux(SAND_THRESHOLD_SHEAR*1.001)>0,'nothing moved above the threshold');
  /* The control's scale crosses the threshold: at rest at 0.85, drifting at
     the default 1.0. */
  assert.equal(sandFlux(sandShear(0.85)),0,'the default-minus wind is already a storm');
  assert.ok(sandFlux(sandShear(1.0))>0,'the desert is dead calm at its own default wind');
});

test('sand transport is cubic in the shear, and its geometry is ballistic',()=>{
  /* q = C (rho/g) u*^3: twice the wind is eight times the sand. */
  const a=sandShear(1.4),b=sandShear(2.8);
  assert.ok(Math.abs(sandFlux(b)/sandFlux(a)-8)<0.4,
    `doubling the shear multiplied the flux by ${(sandFlux(b)/sandFlux(a)).toFixed(2)}, not 8`);
  /* The hop is a launch: height goes as the square of launch speed, time of
     flight as the square root of height. Grain speed is hop length over hop
     time, so the model has no separate speed constant. */
  for(const w of [1.0,1.5,2.0,2.6]){
    const s=sandShear(w);
    const h=sandHopHeightM(s), L=sandHopLengthM(s);
    assert.ok(Math.abs(L/h-SAND.hopLengthRatio)<1e-9,'the hop lost its measured aspect');
    const derived=L/Math.sqrt(8*h/9.80665);
    assert.ok(Math.abs(sandGrainSpeedMps(s)-derived)<1e-9,
      'the grain speed is not its hop over its time of flight');
  }
  /* Saltating grains are measured at 1-6 m/s. */
  assert.ok(sandGrainSpeedMps(sandShear(1))>1.5&&sandGrainSpeedMps(sandShear(1))<3.5);
  assert.ok(sandGrainSpeedMps(sandShear(3))<8,'a saltating grain outran the wind');
  /* The drawn dash is an exposure: a 3 m hop takes half a second and a frame
     is a twenty-fourth of one, so a grain draws two to five pixels. */
  for(const w of [1.0,2.0,3.0]){
    const px=sandGrainSpeedMps(sandShear(w))*15.294*SAND.exposureS;
    assert.ok(px>=1&&px<=6,`a grain draws a ${px.toFixed(1)} px dash at wind ${w}`);
  }
});

test('the storm obscures by Beer\'s law and never goes fully opaque',()=>{
  let prior=-1;
  for(let w=0;w<=3.001;w+=0.05){
    const h=sandHaze(sandShear(w));
    assert.ok(h>=prior-1e-12,'haze is not monotonic in the wind');
    assert.ok(h<=SAND.hazeMax+1e-12,'haze passed its own ceiling');
    prior=h;
  }
  assert.equal(sandHaze(sandShear(0.8)),0,'the air is dirty with nothing moving');
  assert.ok(sandHaze(sandShear(2))>0.30,'a storm at twice the reference wind is see-through');
  assert.ok(sandCoverage(sandShear(3))<=SAND.maxCoverage+1e-12,
    'the saltation skin became an opaque sheet');
  /* The ceiling is the medium's, and it is measured. Mixing every entry of
     the desert's snap list toward the sand's lit rung, the distinct colours
     that survive fall from fourteen to eight between 0.50 and 0.55. A palette
     change that moves the cliff fails here. */
  const out=bakeOutPalette(0.10,SCENES.desert.ramps,repaint(SCENES.desert.fog));
  const lit=warmShift(RAMP.sand[Math.round(0.94*(RAMP.sand.length-1))],0.10);
  const snap=(c)=>{ let best=0,bd=Infinity;
    out.list.forEach((p,i)=>{ const d=(c[0]-p[0])**2+(c[1]-p[1])**2+(c[2]-p[2])**2;
      if(d<bd){bd=d;best=i;} }); return best; };
  const survives=(h)=>new Set(out.list.map((c)=>
    snap([0,1,2].map((i)=>c[i]+(lit[i]-c[i])*h)))).size;
  assert.ok(survives(SAND.hazeMax)>=12,
    `at its own ceiling the storm leaves ${survives(SAND.hazeMax)} of `
    +`${out.n} colours, which is not a picture`);
  assert.ok(survives(SAND.hazeMax+0.05)<survives(SAND.hazeMax),
    'the haze ceiling is no longer sitting at the cliff it was measured against');
});

test('blown sand is the ground, and it travels along it',()=>{
  /* One colour authority: an airborne grain is the floor's material and
     resolves on the floor's ramp. */
  assert.equal(SAND.ramp,'sand');
  assert.ok(RAMP[SAND.ramp]);
  assert.ok(SCENES.desert.ramps.includes(SAND.ramp));
  /* The drift takes the whole wind vector, because sand does not fall. Snow
     and rain lean downwind with uWindX alone. */
  assert.match(POST_FS,/uniform float uVig, uWind, uWindX, uWindY;/);
  assert.match(POST_FS,/vec2 dir=normalize\(vec2\(uWindX,uWindY\)\);/);
  assert.match(renderSource,/uWindY:\{value:Math\.sin\(WIND_A\)\}/);
  /* The lattice is in ground coordinates: a screen row is two ground pixels
     of depth, so a screen-space lattice drifts at the wrong speed across the
     depth axis. */
  assert.match(POST_FS,/vec2 gp=vec2\(wp\.x,wp\.y\*2\.0\);/);
  /* Saltation lives in the first few centimetres, so a grain is never in
     front of anything standing on the surface. */
  assert.match(POST_FS,/sandSegmentDistance\(q,tail,head\)<0\.62 && occ<0\.5/);
  assert.match(renderSource,/uSand\.value>0\.01/);
  /* Both sides compute the same chain. */
  for(const fn of ['sandShear','sandFlux','sandHopHeightM','sandGrainSpeedPx',
                   'sandHaze','sandCoverage'])
    assert.ok(SAND_GLSL.includes(`float ${fn}(`),`SAND_GLSL has no ${fn}`);
  assert.match(SAND_GLSL,/shear<=SAND_THRESHOLD \? 0\.0/);
});

test('the desert refuses the mirage, and says why where it would have gone',()=>{
  /* An inferior mirage needs a grazing ray and a horizon, and this projection
     has neither: W_GROUND_FS states that airlight over the thirty metres a
     screen covers is six parts in ten thousand. The refusal is asserted. */
  const weatherSource=readFileSync(new URL('../src/weather.js',import.meta.url),'utf8');
  assert.match(weatherSource,/the mirage is not drawn/i);
  assert.ok(!/mirage/i.test(POST_FS)&&!/mirage/i.test(W_GROUND_FS),
    'something in the shaders draws a mirage this projection cannot support');
});

test('a gust crosses a stand as a front, downwind, at the mean flow',()=>{
  /* Authority: GUST in src/weather.js, wind axis in src/constants.js. A stem
     `d` px downwind meets the same gust d/U seconds later (Taylor 1938). Both
     components must advect at one speed or the pattern shears apart. */
  const U=GUST.speedMps*PX_PER_M;
  for(const d of [40,160,480])for(const t of [0,3.7,19]){
    const here=gustAt(gustPhase(100,-60),t);
    const downwind=gustAt(gustPhase(100+d*WCA,-60+d*WSA),t+d/U);
    assert.ok(Math.abs(here-downwind)<1e-6,
      `gust at ${d} px downwind after ${(d/U).toFixed(2)} s is ${downwind.toFixed(4)}, source ${here.toFixed(4)}`);
  }
  /* across the wind the front is one line: equal phase, so equal sway */
  assert.ok(Math.abs(gustAt(gustPhase(0,0),5)-gustAt(gustPhase(-90*WSA,90*WCA),5))<1e-6);
  /* a negative phase means rigid, so no stem in the world may reach it */
  for(const [x,y] of [[2600,2600],[-2600,2600],[2600,-2600],[-2600,-2600]])
    assert.ok(gustPhase(x,y,0)>0,`gust phase at ${x},${y} is negative`);
  /* one formula: the sprite pass and its shadow sway together */
  for(const [name,src] of [['SPRITE_FS',SPRITE_FS],['W_SHADOW_FS',W_SHADOW_FS]]){
    assert.ok(src.includes(WIND_GLSL),`${name} lost the shared gust function`);
    assert.match(src,/windGust\(vPhase, ?uTime\)/,`${name} does not call windGust`);
  }
});
