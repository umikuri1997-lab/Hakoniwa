import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { CH, FLAG_Q } from '../src/constants.js';
import { reflectionTouchesWet } from '../src/scene.js';
import { W_REFLECT_VS, W_WATER_FS } from '../src/shaders/world.js';
import { SURF } from '../src/surface.js';

const renderSource=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const sceneSource=readFileSync(new URL('../src/scene.js',import.meta.url),'utf8');

test('reflection has a dedicated caster-only target and batch',()=>{
  assert.match(renderSource,/this\.rtR=new THREE\.WebGLRenderTarget/);
  assert.match(renderSource,/this\.bReflect\.fill\(v\.reflection/);
  assert.match(renderSource,/R\.render\(this\.bReflect\.scene,this\.cam\)/);
  assert.doesNotMatch(W_WATER_FS,/uShadow|uShore/);
});

test('reflection mirrors caster geometry from its contact anchor',()=>{
  assert.match(W_REFLECT_VS,/float baseY = iPos\.y \+ iRect\.w - iAnchor\.y/);
  /* max(): a negative lift is a ground skirt (rows below the caster's own
     ground line), which the mirror ignores rather than reflecting deeper */
  assert.match(W_REFLECT_VS,/\+ 2\.0\*max\(iLift, 0\.0\)/);
  assert.match(W_REFLECT_VS,/1\.0-corner\.y/);
  assert.doesNotMatch(W_REFLECT_VS,/uLight/);
});

test('water clips reflection by surface wetness without a luminance gate',()=>{
  assert.match(W_WATER_FS,/if\(!\(abs\(flag - [\d.]+\) < 0\.5/);
  assert.match(W_WATER_FS,/texture2D\(uReflection/);
  assert.doesNotMatch(W_WATER_FS,/smoothstep\(uKeep|float lum|uKeep/);
});

test('calm reflection is stable and wind displaces it in world space',()=>{
  assert.match(W_WATER_FS,/float wy = y \+ uCam\.y/);
  assert.match(W_WATER_FS,/float sw = max\(0\.0,uWind\)/);
  assert.match(W_WATER_FS,/wob\*uReflect\.y/);
  assert.match(W_WATER_FS,/drift = uTime\*2\.6\*uWind/);
});

test('traveller and world share the reflection list independent of painter order',()=>{
  assert.match(sceneSource,/const reflection=behind\.concat\(front\)\.filter/);
  assert.match(sceneSource,/reflectionTouchesWet\(e,camX,camY,W,H,this\.chunks\)/);
  assert.match(sceneSource,/return \{behind,front,contact,reflection,highlight\}/);
  /* The traveller enters the same `front` list as everything else, so he
     reflects for the same reason a tree does. The flip is asked of figureFlip
     rather than written inline because a person and a retro figure mirror under
     different conditions — see the note on it in scene.js. */
  /* The stand lift is what the GROUND puts under him and it is read once for
     the whole traveller branch, mounted or not; the on-foot lift then takes the
     material sink back off it, because a boot sinks into loose ground and a
     camel's pad standing on the same spot does not. */
  assert.match(sceneSource,
    /const standLift=this\.gen\?\.standLift\?this\.gen\.standLift\(this\.px,this\.py\):0/);
  assert.match(sceneSource,
    /const lift=standLift-this\.materialSinkAt\(this\.px,this\.py\)/);
  assert.match(sceneSource,
    /front\.push\(\{x,y:y-lift,sortY:y,lift,r,\s*flip:this\.figureFlip\(app/);
});

test('caster reflection work is culled against resident open-water pixels',()=>{
  const geom=new Float32Array(CH*CH*4);
  for(let i=3;i<geom.length;i+=4)geom[i]=SURF.peat*FLAG_Q;
  const chunks=new Map([['0,0',{ox:0,oy:0,geom}]]);
  const caster={x:20,y:20,flip:false,r:{w:12,h:16,ax:6,ay:15}};
  for(let y=27;y<=30;y++)for(let x=20;x<=23;x++)
    geom[(y*CH+x)*4+3]=SURF.flooded*FLAG_Q;
  assert.equal(reflectionTouchesWet(caster,0,0,64,64,chunks),true);
  for(let y=27;y<=30;y++)for(let x=20;x<=23;x++)
    geom[(y*CH+x)*4+3]=SURF.peat*FLAG_Q;
  assert.equal(reflectionTouchesWet(caster,0,0,64,64,chunks),false);

  /* A foot 12 rows above its ground point is painted 12 rows above that point
     and reflected 12 rows below it, a separation of 24 rows. */
  const raised={...caster,y:8,lift:12};
  for(let y=33;y<=36;y++)for(let x=20;x<=23;x++)
    geom[(y*CH+x)*4+3]=SURF.flooded*FLAG_Q;
  assert.equal(reflectionTouchesWet(raised,0,0,64,64,chunks),true);
  assert.equal(reflectionTouchesWet({...raised,lift:0},0,0,64,64,chunks),false);
});

