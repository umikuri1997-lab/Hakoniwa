import test from 'node:test';
import assert from 'node:assert/strict';

import { CH, FLAG_Q } from '../src/constants.js';
import { makePondCourt } from '../src/pond-court.js';
import { RNG } from '../src/rng.js';
import { makePillar, makeRuinWall } from '../src/ruins.js';
import { meadowRamps } from '../src/sunlight.js';
import { SURFACE, SURF } from '../src/surface.js';
import { makeWorldGen } from '../src/worldgen.js';

const SEED=20260727;
const OPT={biome:'meadow',lake:0.55,density:0.65};

function syntheticEnv(){
  const threshold=0.2;
  return {
    common:{y:700},worldR:4000,threshold,poi:[],
    pathX:y=>Math.sin(y*0.002)*55,
    wetness:(x,y)=>threshold+Math.sin(x*0.011+y*0.007)*0.075,
  };
}

test('the court selects groundwater, preserves dry occupation, and remains deterministic',()=>{
  const a=makePondCourt(SEED,syntheticEnv());
  const b=makePondCourt(SEED,syntheticEnv());

  assert.deepEqual(
    {x:a.x,y:a.y,pond:a.pond,route:a.route,architecture:a.architecture,frameTrees:a.frameTrees},
    {x:b.x,y:b.y,pond:b.pond,route:b.route,architecture:b.architecture,frameTrees:b.frameTrees},
  );
  assert.ok(a.score.water>0.55,`the selected basin's groundwater score is only ${a.score.water}.`);
  assert.ok(a.score.dry>0.45,`the court's dry-ground score is only ${a.score.dry}.`);
  assert.equal(a.waterAt(a.pond.cx,a.pond.cy),true);
  assert.equal(a.waterAt(a.x,a.y),false);
  assert.equal(a.architecture.filter(x=>x.kind==='pillar').length,3);
  assert.equal(a.architecture.filter(x=>x.kind==='ruinWall').length,4);
  assert.equal(a.frameTrees.length,5);
  for(let i=0;i<a.frameTrees.length;i++)for(let j=i+1;j<a.frameTrees.length;j++)
    assert.ok(Math.hypot(a.frameTrees[i].x-a.frameTrees[j].x,
                         a.frameTrees[i].y-a.frameTrees[j].y)>=82,
      'the selected framing trees violate their crown-clearance distance.');
});

test('the meadow bake carries one pond, fitted paving, and all planned landmarks',()=>{
  const gen=makeWorldGen(SEED,OPT), p=gen.pondCourt;
  const chunks=[];
  for(let cy=Math.floor((p.y-180)/CH);cy<=Math.floor((p.y+180)/CH);cy++)
    for(let cx=Math.floor((p.x-220)/CH);cx<=Math.floor((p.x+220)/CH);cx++)
      chunks.push(gen.bakeChunk(cx,cy));
  const chunkAt=(x,y)=>chunks.find(c=>c.cx===Math.floor(x/CH)&&c.cy===Math.floor(y/CH));
  const flagAt=(x,y)=>{
    const X=Math.round(x),Y=Math.round(y),c=chunkAt(X,Y);
    return Math.round(c.geom[((Y-c.oy)*CH+(X-c.ox))*4+3]/FLAG_Q);
  };

  let paving=0,water=0;
  const props=new Set();
  for(const c of chunks){
    for(let i=3;i<c.geom.length;i+=4){
      const flag=Math.round(c.geom[i]/FLAG_Q);
      if(flag===SURF.flagstone) paving++;
      if(flag===SURF.pond) water++;
    }
    for(const o of c.props) props.add(`${o.kind}:${o.x}:${o.y}`);
  }

  assert.ok(paving>5000,`only ${paving} fitted-paving pixels survived the ground bake.`);
  assert.ok(water>2500,`only ${water} pond pixels survived hydrology and despeckling.`);
  for(const o of [...p.architecture,...p.frameTrees])
    assert.ok(props.has(`${o.kind}:${o.x}:${o.y}`),
      `${o.kind} at ${o.x},${o.y} was absent from every resident chunk.`);

  assert.equal(gen.isWater(p.pond.cx,p.pond.cy),true);
  assert.equal(gen.isWater(p.x,p.y),false);
  for(let i=0;i+1<p.route.length;i++)for(let q=0;q<=8;q++){
    const t=q/8,x=p.route[i][0]+(p.route[i+1][0]-p.route[i][0])*t;
    const y=p.route[i][1]+(p.route[i+1][1]-p.route[i][1])*t;
    assert.equal(flagAt(x,y),SURF.flagstone,`the approach opens at ${x},${y}.`);
  }
  const mainY=p.route[0][1]+45;
  assert.equal(flagAt(gen.pathX(mainY),mainY),SURF.flagstone,
    'the fitted-stone field stops where the approach meets the world trail.');
  chunks.forEach(c=>c.tex.dispose());
});

test('ruin masonry keeps structural faces and unit normals in the pixel medium',()=>{
  const sprites=[
    makePillar(new RNG(17),{h:47,shaftW:7,baseW:15,broken:false,salt:17}),
    makePillar(new RNG(29),{h:36,shaftW:7,baseW:13,broken:true,salt:29}),
    makeRuinWall({w:38,h:8,d:6,course:4,brick:7,salt:41}),
  ];

  for(const sp of sprites){
    let occupied=0;
    for(let i=0;i<sp.occ.length;i++)if(sp.occ[i]){
      occupied++;
      const n=Math.hypot(sp.nx[i],sp.ny[i],sp.nz[i]);
      assert.ok(Math.abs(n-1)<0.002,`${sp.kind} has a ${n.toFixed(4)}-length normal.`);
    }
    assert.ok(occupied>sp.h*4,`${sp.kind} collapsed below a legible structural mass.`);
    assert.equal(sp.ramp,'masonry');
  }
  const ramps=meadowRamps();
  assert.equal(ramps.masonry.length,5);
  assert.equal(SURFACE[SURF.flagstone].ramp,'masonry');
  assert.notDeepEqual(Array.from(sprites[0].occ),Array.from(sprites[1].occ),
    'intact and broken pillars collapsed to one silhouette.');
});
