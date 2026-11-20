import test from 'node:test';
import assert from 'node:assert/strict';
import { BIOMES } from '../src/biome.js';
import { RNG } from '../src/rng.js';
import { Scene } from '../src/scene.js';
import {
  HOUSE_M, HOUSE_SCALE, PUMP_M, ROOF_M, ROTORS, houseDims, houseDoorDX,
  houseRotorLift,
  houseRotorSite,
  houseSlab,
  makeHouse,
  makeRoofRotor, makeTrussBay, makeWheel, rotorFrame, rotorRps,
  steadingFootprint,
} from '../src/steading.js';
import { cabinFootprint, cabinSlab } from '../src/cabin.js';
import { pavilionDoorDX, pavilionFootprint, pavilionSlab } from '../src/pavilion.js';
import { swampHouseBox, swampHouseFootprint } from '../src/swamp-settlement.js';
import { makeWorldGen } from '../src/worldgen.js';
import { CH, PATHW } from '../src/constants.js';
import { W_SHADOW_VS } from '../src/shaders/world.js';
import { CROWN_HALF } from '../src/species.js';
import { ACTOR } from '../src/fauna.js';
import { PX_PER_M } from '../src/scale.js';
import { reportConsole as console } from './report.mjs';

const mask=(sp)=>Array.from(sp.occ,Boolean);
const count=(sp,pred)=>{ let n=0; for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++)
  if(sp.occ[y*sp.w+x]&&(!pred||pred(x,y))) n++; return n; };

test('both meadow machines turn at rates derived from wind and tip-speed ratio', () => {
  assert.deepEqual(Object.keys(ROTORS).sort(),['pump','roof']);
  for(const [name,spec] of Object.entries(ROTORS)){
    const expected=spec.tsr*spec.wind/(Math.PI*spec.wheel);
    assert.ok(Math.abs(rotorRps(spec,1)-expected)<1e-12,
      `${name} turns at ${rotorRps(spec,1)} rev/s, not λU/(πD) = ${expected}.`);
    assert.equal(rotorRps(spec,0),0,
      `${name} still turns at zero wind; a wind-driven machine has no phase source then.`);

    /* A frame bank covers one blade period, not one revolution: rotating a
       B-fold symmetric wheel by 1/B is the same silhouette. */
    const period=1/(rotorRps(spec,1)*spec.blades);
    const frames=[];
    for(let f=0;f<spec.frames;f++)
      frames.push(rotorFrame(spec,(f+0.05)*period/spec.frames,0));
    assert.deepEqual(frames,[0,1,2,3,4,5],
      `${name} does not visit its six baked silhouettes in angular order: ${frames}.`);
    assert.equal(rotorFrame(spec,0.137,0.23),rotorFrame(spec,0.137+period,0.23),
      `${name} does not repeat after one ${spec.blades}-blade symmetry period.`);
  }

  console.log('  WIND MACHINES — λU/(πD), before the blade-symmetry fold');
  console.log(`  pump  λ ${PUMP_M.tsr}  D ${PUMP_M.wheel.toFixed(2)} m`
    + `  ${rotorRps(PUMP_M,1).toFixed(3)} rev/s  ${(rotorRps(PUMP_M,1)*60).toFixed(0)} rpm`);
  console.log(`  roof  λ ${ROOF_M.tsr}  D ${ROOF_M.wheel.toFixed(2)} m`
    + `  ${rotorRps(ROOF_M,1).toFixed(3)} rev/s  ${(rotorRps(ROOF_M,1)*60).toFixed(0)} rpm`);
});

test('changing wind changes rotor velocity without changing its phase', () => {
  const scene={};
  const windSeconds=(t,w)=>Scene.prototype.rotorWindSeconds.call(scene,t,w);
  assert.equal(windSeconds(10,1),10);
  assert.equal(windSeconds(10,2),10,
    `changing wind at one instant changed accumulated phase.`);
  assert.equal(windSeconds(11,2),12,
    `one second at 2x wind did not add two wind-seconds.`);
  assert.equal(windSeconds(11,0),12,
    `stopping the wind changed accumulated phase.`);
  assert.equal(windSeconds(20,0),12,
    `a stopped wind continued advancing the rotor clock.`);
});

test('Scene resolves animated rotor rects and emits one streamed landmark', () => {
  const frames=Array.from({length:PUMP_M.frames},(_,i)=>({
    x:i*25,y:0,w:24,h:24,ax:12,ay:12,
  }));
  const sprites=frames.map(()=>({
    tilt:0,ramp:'birch',sMin:0,sMax:1,dMin:0,dMax:1,vol:0,
  }));
  const rects={};
  frames.forEach((r,i)=>{ rects[`wheel:0:${i}`]=r; });
  const prop=()=>({
    x:50,y:50,kind:'wheel',tier:0,vari:0,flip:false,tilt:0,
    warm:false,dark:false,rotor:'pump',spinPhase:0,
  });
  const chunks=[
    {ox:0,oy:0,props:[prop()]},
    {ox:0,oy:0,props:[prop()]},
  ];
  const scene=Object.create(Scene.prototype);
  Object.assign(scene,{
    r:{
      atlasGen:1,time:0,W:120,H:90,
      shadowMat:{uniforms:{uLight:{value:{x:0,y:0,z:1}},uLen:{value:1}}},
      shoreCol:new Int32Array(120).fill(-100000),
    },
    spec:{aer:()=>[0,0,0,0]},
    baked:{rects},
    atlas:{wheel:[sprites]},
    chunks:new Map([['0,0',chunks[0]],['1,0',chunks[1]]]),
    actors:[],wind:1,dir:0,moving:false,gait:0,
  });
  chunks.forEach((c)=>scene.resolve(c));

  const drawn=()=>{
    const v=scene.visible(0,0,0);
    return [...v.behind,...v.front].filter((e)=>frames.includes(e.r));
  };
  const first=drawn();
  assert.equal(first.length,1,
    `one physical wheel replicated into two streaming chunks emitted ${first.length} draw instances.`);
  assert.equal(first[0].r,frames[0]);

  const period=1/(rotorRps(PUMP_M,1)*PUMP_M.blades);
  scene.r.time=period/PUMP_M.frames*1.1;
  const second=drawn();
  assert.equal(second.length,1);
  assert.notEqual(second[0].r,first[0].r,
    `Scene.visible kept the same rotor atlas rect after more than one frame interval.`);
});

test('machine members and rotor solidity survive the pixel medium', () => {
  assert.ok(PUMP_M.memberPx>=2,
    `the pump's ${PUMP_M.member} m members resolve to ${PUMP_M.memberPx} px;`
    + ` a one-pixel lattice is wire, not structure.`);
  assert.ok(ROOF_M.memberPx>=2,
    `the roof turbine's ${ROOF_M.member} m mast resolves to ${ROOF_M.memberPx} px.`);

  const bay=makeTrussBay(new RNG(1),0);
  for(let y=0;y<bay.h;y++){
    const row=count(bay,(x,yy)=>yy===y);
    if(row) assert.ok(row>=PUMP_M.memberPx,
      `truss row ${y} has only ${row} occupied pixels; its converged members fall`
      + ` below the ${PUMP_M.memberPx}-pixel medium floor.`);
  }

  const wheel=makeWheel(new RNG(2),0);
  const R=Math.max(4,Math.round(PUMP_M.wheel*PX_PER_M)>>1), cx=wheel.w>>1, cy=R+1;
  const swept=count(wheel,(x,y)=>(x-cx)*(x-cx)+(y-cy)*(y-cy)<=R*R);
  const drawnSolidity=swept/(Math.PI*R*R);
  assert.ok(drawnSolidity>=PUMP_M.solidity*0.72,
    `the pump asks for solidity ${PUMP_M.solidity}, but only ${drawnSolidity.toFixed(3)}`
    + ` of its swept disc survives rasterisation.`);

  const pumpFrames=[], roofFrames=[];
  for(let f=0;f<6;f++){
    pumpFrames.push(mask(makeWheel(new RNG(2),f)));
    roofFrames.push(mask(makeRoofRotor(new RNG(3),f)));
  }
  assert.equal(new Set(pumpFrames.map(v=>v.join(''))).size,6,
    `the pump's six angular frames collapse to duplicate pixel masks.`);
  assert.equal(new Set(roofFrames.map(v=>v.join(''))).size,6,
    `the roof turbine's six angular frames collapse to duplicate pixel masks.`);

  /* The rotor is its own sprite. Otherwise six frames duplicate the whole
     house in the atlas. */
  for(let v=0;v<3;v++){
    const house=makeHouse(new RNG(4+v),v), site=houseRotorSite(v);
    assert.ok(site.y<-(house.h>>1),
      `house ${v}'s rotor hub ${site.y} px from ground is not above its roof.`);
  }

  console.log(`  MEMBERS — pump ${PUMP_M.memberPx}px, roof mast ${ROOF_M.memberPx}px;`
    + ` pump raster solidity ${drawnSolidity.toFixed(3)} from target ${PUMP_M.solidity}`);
});

/* ══════════════════════════════════════════════════════════════════════════
   The hamlet is sited

   Siting laws for the meadow's buildings, checked against the world model.
   Measured failure: offsets from the trail with no predicate put the windpump
   30 px from a house whose half-width is 57.
   ══════════════════════════════════════════════════════════════════════════ */

const MEADOW={biome:'meadow',density:0.95,snow:0.5,lake:0.55};
/* Eight seeds: a siting rule must hold beyond the seed it was tuned on. */
const SITE_SEEDS=[20260727,7,999666333,42,1234,88,20261111,5];
const WOODY=new Set(['meadowTree','palm','shrub','log','birch','spruce','snag',
                     'bramble','cypress','tupelo','stranglerFig','buttonbush']);
const COMMON_Y_OF=(g)=>g.POI.find(p=>p.kind==='village').y;
const overlap=(a,b)=>{
  const f=steadingFootprint(a.kind,a.vari||0), g=steadingFootprint(b.kind,b.vari||0);
  return Math.abs(a.x-b.x)<f.hx+g.hx
      && Math.abs(a.y-b.y)<Math.max(f.back+g.front,g.back+f.front);
};

test('no two meadow structures stand inside one another',()=>{
  const rows=[];
  for(const seed of SITE_SEEDS){
    const g=makeWorldGen(seed,MEADOW);
    const S=g.STEADING;
    let closest=Infinity, pair='';
    for(let i=0;i<S.length;i++)for(let j=i+1;j<S.length;j++){
      assert.ok(!overlap(S[i],S[j]),
        `seed ${seed}: ${S[i].kind} at (${S[i].x},${S[i].y}) and ${S[j].kind} at `
        +`(${S[j].x},${S[j].y}) share ground. Their footprints are `
        +`${JSON.stringify(steadingFootprint(S[i].kind,S[i].vari||0))} and `
        +`${JSON.stringify(steadingFootprint(S[j].kind,S[j].vari||0))}. Two buildings `
        +`in one place is not a looser composition, it is a broken one.`);
      const d=Math.hypot(S[i].x-S[j].x,S[i].y-S[j].y);
      if(d<closest){ closest=d; pair=`${S[i].kind}/${S[j].kind}`; }
    }
    rows.push(`  ${String(seed).padStart(9)}  ${S.length} placed  closest `
      +`${pair} ${closest.toFixed(1)}px`);
  }
  console.log('  STRUCTURE SEPARATION — the pump measured 30.0px from a house before');
  console.log(rows.join('\n'));
});

test('every emitted structure stands on dry, walkable, un-spoken-for ground',()=>{
  for(const seed of SITE_SEEDS){
    const g=makeWorldGen(seed,MEADOW);
    for(const s of g.STEADING){
      const f=steadingFootprint(s.kind,s.vari||0);
      /* The wet test samples lines across the footprint. */
      const step=Math.max(8,f.hx>>2);
      for(let q=-f.hx;q<=f.hx;q+=step)
        for(const dy of [0,-f.back,f.front])
          assert.ok(!g.isWater(s.x+q,s.y+dy),
            `seed ${seed}: the ${s.kind} at (${s.x},${s.y}) has its footprint in water `
            +`at (${s.x+q},${s.y+dy}). A basin decided after the site was chosen is `
            +`how this happened before: STEADING is now compiled after the water is.`);
      assert.ok(g.pathDist(s.x,s.y)>=PATHW+f.hx,
        `seed ${seed}: the ${s.kind} at (${s.x},${s.y}) is ${g.pathDist(s.x,s.y).toFixed(1)}px `
        +`from the trail centre, inside its own ${f.hx}px half-width plus the path`);
      assert.ok(g.rimAt(s.x,s.y)<=0.02,
        `seed ${seed}: the ${s.kind} at (${s.x},${s.y}) is inside the closing treeline`);
      for(const p of g.POI){
        if(p.kind==='village') continue;               // the steading IS the village
        assert.ok(Math.hypot(s.x-p.x,s.y-p.y)>=p.r*0.55,
          `seed ${seed}: the ${s.kind} at (${s.x},${s.y}) is inside the ${p.kind} at `
          +`(${Math.round(p.x)},${Math.round(p.y)}) r ${p.r}`);
      }
    }
  }
});

test('the walk never emits a site it rejected',()=>{
  /* The boreal cabin walk pushes the last site it tried when all 48 angles
     fail, so an illegal cabin ships. The meadow walk drops what it cannot
     place, and a dropped site is not in the list. */
  const rows=[];
  for(const seed of SITE_SEEDS){
    const g=makeWorldGen(seed,MEADOW);
    const S=g.STEADING, D=g.steadingDropped;
    for(const d of D)
      assert.ok(!S.some(s=>s.kind===d.kind&&s.y===COMMON_Y_OF(g)+d.dy),
        `seed ${seed}: a dropped ${d.kind} is still in STEADING`);
    const asked=BIOMES.meadow.slots.length;
    assert.ok(S.length+D.length===asked,
      `seed ${seed}: ${S.length} placed + ${D.length} dropped is not the ${asked} slots asked for`);
    const houses=S.filter(s=>s.kind==='house').length;
    assert.ok(houses>=4,`seed ${seed} placed only ${houses} houses of 5`);
    assert.equal(S.filter(s=>s.kind==='pump').length,1,
      `seed ${seed} did not place exactly one windpump`);
    assert.equal(S.filter(s=>s.kind==='pavilion').length
      +D.filter(s=>s.kind==='pavilion').length,1,
    `seed ${seed} did not resolve the one pavilion request`);
    for(const s of S) assert.ok(['none','margin','places'].includes(s.relaxed),
      `seed ${seed}: the ${s.kind} records no relaxation level, so nothing can check it`);
    const relaxed=S.filter(s=>s.relaxed!=='none').map(s=>`${s.kind}:${s.relaxed}`);
    rows.push(`  ${String(seed).padStart(9)}  ${S.length}/8 placed  ${houses} houses  `
      +(relaxed.length?`relaxed ${relaxed.join(' ')}`:'no constraint gave way'));
  }
  console.log('  THE SITING WALK');
  console.log(rows.join('\n'));
});

test('a footprint is stated once, next to the geometry that draws it',()=>{
  /* src/steading.js owns the widths, so it owns the footprints. */
  for(let v=0;v<HOUSE_SCALE.length;v++){
    const f=steadingFootprint('house',v), D=houseDims(v);
    assert.ok(f.hx*2===D.W||f.hx*2===D.W-1,
      `the house footprint half-width ${f.hx} does not come from houseDims(${v}).W `
      +`= ${D.W}; the keep-out and the drawing disagree about how wide a house is`);
  }
  const pump=steadingFootprint('pump');
  assert.equal(pump.hx,Math.round(PUMP_M.baseW*PX_PER_M)>>1,
    `the pump footprint half-width ${pump.hx} is not M(PUMP_M.baseW)>>1 = `
    +`${Math.round(PUMP_M.baseW*PX_PER_M)>>1}; makeTrussBay draws with baseW, so a `
    +`footprint that does not read it is a second copy of the tower's width`);
  /* The cabin row is frozen. Deriving its yard from CABIN_W waits on
     docs/DECISIONS.md. */
  assert.deepEqual(steadingFootprint('cabin'),{hx:36,back:34,front:26,yard:0},
    'the cabin yard is no longer the pre-table 36/34/26 box with no band. That box '
    +'is what keeps boreal and swamp byte-identical through the keep-out law.');
  /* The pile house has its own row: its footprint comes from swampHouseBox,
     next to the geometry that draws it, and footOf in src/world/siting.js
     reads that. The cabin's 36/34/26 box is half the width of its cabinet
     volume. */
  for(let v=0;v<3;v++){
    const f=swampHouseFootprint(v),box=swampHouseBox(v);
    assert.ok(f.hx*2>=box.w,
      `the swamp house footprint ${f.hx*2}px is narrower than its ${box.w}px face`);
    assert.equal(f.back,box.rows,
      `the swamp house reaches ${f.back}px back and draws ${box.rows}`);
  }
  console.log('  FOOTPRINTS, from the module that draws them');
  for(let v=0;v<HOUSE_SCALE.length;v++){
    const f=steadingFootprint('house',v);
    console.log(`  house v${v}  ${f.hx*2}px wide  ${f.back}back ${f.front}front  `
      +`yard ${f.yard}px`);
  }
  const d=steadingFootprint('derelict');
  const pavilion=pavilionFootprint(), pavilionBase=pavilionSlab();
  assert.equal(pavilion.back,pavilionBase.back,
    'the pavilion keep-out and collider disagree about plan depth');
  assert.ok(pavilion.hx>=pavilionBase.hx,
    'the pavilion keep-out is narrower than its drawn base');
  console.log(`  pump      ${pump.hx*2}px wide  yard ${pump.yard}px`);
  console.log(`  derelict  ${d.hx*2}px wide  yard ${d.yard}px`);
  console.log(`  pavilion ${pavilion.hx*2}px wide  ${pavilion.back}back  `
    +`yard ${pavilion.yard}px`);
  console.log(`  cabin     ${steadingFootprint('cabin').hx*2}px wide  yard 0 (frozen)`);
});

test('the keep-out admits grass to a yard and refuses a crown',()=>{
  for(const seed of SITE_SEEDS.slice(0,4)){
    const g=makeWorldGen(seed,MEADOW);
    const s=g.STEADING.find(t=>t.kind==='house');
    const f=steadingFootprint('house',s.vari||0);
    /* just outside the wall, inside the yard: nothing woody, ground cover yes */
    const x=s.x+f.hx+2, y=s.y-2;
    assert.equal(g.keepOutAt(x,y,0),1,
      `seed ${seed}: (${x},${y}) is ${f.yard}px outside a house wall and the keep-out `
      +`grades it ${g.keepOutAt(x,y,0)}, not 1 (ground cover only)`);
    assert.equal(g.keepOutAt(x,y,CROWN_HALF.meadowTree),1,
      `seed ${seed}: a meadow tree's crown reach does not register in the yard`);
    assert.equal(g.keepOutAt(s.x,s.y-1,0),2,
      `seed ${seed}: the inside of a house is not graded 2`);
    /* The keep-out is finite. keepOutAt reads BUILDINGS and STEADING and tests
       boxes, and a house is 148 px wide, so the first point clear of one yard
       can sit inside the next building's. Walk out along the row and assert
       the refusal ends within a hamlet's width. */
    const start=s.x+f.hx+f.yard+CROWN_HALF.meadowTree+4;
    const LIMIT=1400;
    let far=start;
    while(far<start+LIMIT&&g.keepOutAt(far,y,CROWN_HALF.meadowTree)!==0) far+=2;
    assert.ok(far<start+LIMIT,
      `seed ${seed}: every point from (${start},${y}) to (${far},${y}) refuses a `
      +`meadow crown, so the keep-out is not finite in this direction`);
    assert.equal(g.keepOutAt(far,y,CROWN_HALF.meadowTree),0,
      `seed ${seed}: (${far},${y}) is meant to be the first free point on the row`);
    assert.equal(g.keepOutAt(far,y,0),0,
      `seed ${seed}: (${far},${y}) admits a crown but refuses a tuft, which grades `
      +`the small plant harder than the large one`);
  }
});

test('the meadow steading is a pure function of its seed',()=>{
  /* src/chunk-worker.js holds a second generator built from {seed,opt}. A
     walk that reads mutable state makes worker chunks draw a different hamlet
     from the collider's. */
  for(const seed of SITE_SEEDS){
    const a=makeWorldGen(seed,MEADOW).STEADING;
    const b=makeWorldGen(seed,MEADOW).STEADING;
    assert.deepEqual(a,b,`seed ${seed}: two generators sited the hamlet differently`);
  }
});

/* ── Collision, spawning, and walls ────────────────────
   Measured failure: two dream machines on the roofs of two houses. Three
   causes, one assertion each: a wall narrower than the building, a step
   affordance that ignores buildings, and a body that meets a wall with a
   point. */

/* ── The whole base figure ─────────────────────────
   solidAt applies Scene.blocked's metric to the baked solids over the whole
   base figure. Measured failure: a disc collider 2.4 rows deep behind a house
   34 rows deep leaves 31 of every 34 rows open. */
const solidAt=(chunk,wx,wy)=>{
  const SQ=1.9;                                   // Scene.blocked's own metric
  for(const s of chunk.solids){
    if(s.hx!==undefined){
      const t=s.y-wy;
      if(t<-s.front||t>s.back) continue;
      const u=s.back>0?Math.min(1,Math.max(0,t/s.back)):0;
      if(s.doorHW&&t<=s.front&&Math.abs(wx-(s.x+s.doorDX))<s.doorHW) continue;
      if(Math.abs(wx-(s.x+(s.shear||0)*u))<=s.hx) return true;
      continue;
    }
    const dx=s.x-wx, dy=(s.y-wy)*SQ;
    if(dx*dx+dy*dy<s.r*s.r) return true;
  }
  return false;
};

test('cabinet walls block on their drawn base row and doors remain open',()=>{
  const rows=[];
  for(const seed of SITE_SEEDS.slice(0,4)){
    const cases=[];
    const boreal=makeWorldGen(seed,{biome:'boreal',density:0.95,snow:0.5,lake:0.55});
    for(const b of boreal.BUILDINGS.filter(q=>q.kind==='cabin')){
      const door=boreal.buildingDoor(b),x=Math.round(b.x),y=Math.round(b.y);
      cases.push({name:'cabin',gen:boreal,x,y,slab:cabinSlab(door.v),doorDX:door.dx});
    }
    const meadow=makeWorldGen(seed,MEADOW);
    for(const s of meadow.STEADING){
      if(s.kind==='house')
        cases.push({name:'house',gen:meadow,x:s.x,y:s.y,slab:houseSlab(s.vari||0),
          doorDX:houseDoorDX(s.vari||0)});
      else if(s.kind==='pavilion')
        cases.push({name:'pavilion',gen:meadow,x:s.x,y:s.y,slab:pavilionSlab(),
          doorDX:pavilionDoorDX()});
    }
    for(const q of cases){
      const chunk=q.gen.bakeChunk(Math.floor(q.x/CH),Math.floor(q.y/CH));
      const wallX=q.x+q.slab.dx-q.slab.hx+3;
      assert.ok(solidAt(chunk,wallX,q.y),
        `seed ${seed}: ${q.name} wall is open on its drawn base row`);
      assert.ok(!solidAt(chunk,q.x+q.doorDX,q.y),
        `seed ${seed}: ${q.name} doorway closed when the slab reached the wall row`);
      assert.ok(!solidAt(chunk,q.x+q.slab.dx-q.slab.hx-3,q.y),
        `seed ${seed}: ${q.name} collider reaches past the drawn side at the wall row`);
      for(let r=0;r<=q.slab.back;r++){
        const cx=q.x+q.slab.dx+q.slab.shear*(r/q.slab.back);
        const yy=q.y-q.slab.front-r;
        assert.ok(solidAt(chunk,cx-q.slab.hx+3,yy),
          `seed ${seed}: ${q.name} opens at depth row ${r}/${q.slab.back}`);
      }
    }
    rows.push(`  ${String(seed).padStart(9)}  ${cases.length} cabinet fronts closed`);
  }
  console.log('  DRAWN WALL ROW');
  console.log(rows.join('\n'));
});

test('a building blocks its whole drawn base, not a line across its front',()=>{
  const rows=[];
  for(const seed of SITE_SEEDS){
    const g=makeWorldGen(seed,MEADOW);
    let open=0, sampled=0, worst='';
    for(const t of g.STEADING){
      if(t.kind!=='house') continue;
      const slab=houseSlab(t.vari||0);
      const chunk=g.bakeChunk(Math.floor(t.x/CH),Math.floor(t.y/CH));
      /* Every row of the depth and every column of the width, on the sheared
         figure. From row 3 back: the first two rows carry the threshold and
         its doorway gap. */
      for(let r=3;r<slab.back;r++){
        const cx=t.x+slab.dx+slab.shear*(r/slab.back);
        for(let q=-slab.hx+2;q<=slab.hx-2;q+=3){
          sampled++;
          if(!solidAt(chunk,cx+q,t.y-2-r)){ open++; worst=t.kind; }
        }
      }
      /* The threshold stays open. */
      assert.ok(!solidAt(chunk,t.x+houseDoorDX(t.vari||0),t.y-2),
        `seed ${seed}: the doorway is solid, so the door is painted on`);
    }
    assert.equal(open,0,
      `seed ${seed}: ${open} of ${sampled} points inside a ${worst}'s own base are `
      +`walkable. A disc blocks r/1.9 rows, so a line of them across the front `
      +`covered 2.4 of the 34 rows the building occupies.`);
    rows.push(`  ${String(seed).padStart(9)}  ${sampled} interior points, ${open} open`);
  }
  console.log('  BASE COVERAGE — every row of the depth, on the sheared figure');
  console.log(rows.join('\n'));
});

test('a building collider is the drawn base, and stops exactly at it',()=>{
  /* The collider is the third reader of the geometry, after the keep-out and
     the siting walk. Too small and you walk through the house; too large and
     air stops you beside it. */
  for(const seed of SITE_SEEDS.slice(0,3)){
    const g=makeWorldGen(seed,MEADOW);
    for(const t of g.STEADING){
      if(t.kind!=='house') continue;
      const slab=houseSlab(t.vari||0);
      const chunk=g.bakeChunk(Math.floor(t.x/CH),Math.floor(t.y/CH));
      const mid=Math.round(slab.back/2);
      const cx=t.x+slab.dx+slab.shear*(mid/slab.back), yy=t.y-2-mid;
      assert.ok(solidAt(chunk,cx,yy),
        `seed ${seed}: the middle of the house is not solid`);
      assert.ok(solidAt(chunk,cx-slab.hx+1,yy)&&solidAt(chunk,cx+slab.hx-1,yy),
        `seed ${seed}: the collider stops short of the wall it draws`);
      assert.ok(!solidAt(chunk,cx-slab.hx-6,yy)&&!solidAt(chunk,cx+slab.hx+6,yy),
        `seed ${seed}: the collider reaches past the wall into open ground`);
      /* The shear is real: a column inside at the front is outside at the
         back. */
      assert.ok(!solidAt(chunk,t.x+slab.dx-slab.hx-6,t.y-2-slab.back+1),
        `seed ${seed}: the back of the base did not shear with the drawing`);
    }
  }
});

test('no building in any world stands over water or across a trail',()=>{
  /* Both walks read the footprint they place. Sampling three rows (front,
     back, step) clears a stream crossing the middle of a house 34 rows deep;
     sampling one point against a literal 24 misses the cabin's half-width. */
  const rows=[];
  for(const world of [{name:'meadow',opt:MEADOW},{name:'boreal',opt:{}}]){
    for(const seed of SITE_SEEDS.slice(0,4)){
      const g=makeWorldGen(seed,world.opt);
      const sites=[...(g.STEADING||[]),
                   ...(g.BUILDINGS||[]).filter(b=>b.kind==='cabin')];
      let wet=0, onPath=0, n=0;
      for(const s of sites){
        const f=s.kind==='cabin'?cabinFootprint(0)
              :s.kind==='pavilion'?pavilionFootprint()
                :steadingFootprint(s.kind,s.vari||0);
        for(let q=-f.hx;q<=f.hx;q+=6)for(let d=-f.front;d<=f.back;d+=5){
          n++;
          if(g.isWater(s.x+q,s.y-d)) wet++;
          if(g.pathDist(s.x+q,s.y-d)<PATHW) onPath++;
        }
      }
      assert.equal(wet,0,
        `${world.name} seed ${seed}: ${wet} of ${n} footprint samples stand in `
        +`water. A building drawn over a stream is a building with no ground.`);
      assert.equal(onPath,0,
        `${world.name} seed ${seed}: ${onPath} of ${n} footprint samples sit on `
        +`the trodden trail, so the path runs under the building`);
      rows.push(`  ${world.name.padEnd(7)} ${String(seed).padStart(9)}  `
        +`${sites.length} sites, ${n} samples, all dry and clear`);
    }
  }
  console.log('  BUILT GROUND — every footprint sample, both worlds');
  console.log(rows.join('\n'));
});

test('a house elevation has no sky in it',()=>{
  /* Measured failure: a clerestory band of one height under a butterfly roof
     that rises outward from its valley leaves a triangular hole at each end,
     eight rows of meadow seen through the building. Every wall column is
     continuous from the roof's topmost pixel to the ground. */
  for(let v=0;v<HOUSE_SCALE.length;v++){
    const sp=makeHouse(new RNG(4+v),v);
    const slab=houseSlab(v), x0=Math.round(sp.ax+slab.dx-slab.hx);
    let holes=0, worst=-1;
    for(let x=x0;x<x0+Math.round(slab.hx*2);x++){
      let top=-1;
      for(let y=0;y<sp.h;y++) if(sp.occ[y*sp.w+x]){ top=y; break; }
      if(top<0) continue;
      for(let y=top;y<sp.h;y++) if(!sp.occ[y*sp.w+x]){ holes++; if(worst<0) worst=x; }
    }
    assert.equal(holes,0,
      `house v${v}: ${holes} pixels of sky inside the elevation, first at column `
      +`${worst}. A wall meets the underside of its own roof.`);
  }
});

test('a rotor is lifted by its height, and depth is not height',()=>{
  /* Under cabinet both height and depth move a sprite up the screen, so a
     lift read off the sprite's vertical offset counts the rows the mast
     stands back on its roof as rows above it. Measured: 17 px of depth read
     as 1.1 m of height. The check is in metres. */
  const rows=[];
  for(let v=0;v<HOUSE_SCALE.length;v++){
    const k=HOUSE_SCALE[v];
    const R=Math.max(4,Math.round(ROOF_M.wheel*PX_PER_M)>>1), foot=((R*2+5)|1)>>1;
    const heightM=(houseRotorLift(v)+foot)/PX_PER_M;
    const floorM=(HOUSE_M.head+HOUSE_M.mast)*k;
    assert.ok(heightM>=floorM-0.05,
      `house v${v}: the hub stands ${heightM.toFixed(2)} m up and the head plus `
      +`the mast is ${floorM.toFixed(2)} m. A rotor cannot be below its own mast.`);
    assert.ok(heightM<=floorM+0.9*k,
      `house v${v}: the hub stands ${heightM.toFixed(2)} m up, which is more than `
      +`the head plus the mast plus the roof's own rise. Depth is being counted `
      +`as height: under cabinet both move the sprite up the screen.`);
    rows.push(`  house v${v}  hub ${heightM.toFixed(2)} m  (head+mast `
      +`${floorM.toFixed(2)} m, roof rise adds the rest)`);
  }
  console.log('  ROTOR HEIGHT — measured on the axis the mistake was on');
  console.log(rows.join('\n'));
});

test('a caster on a roof throws from the ground, not from the roof',()=>{
  /* W_SHADOW_VS measures height within the sprite. Rooted on the sprite's
     bottom row, a micro-turbine eighty rows up a meadow house throws the
     shadow of a 27 px disc lying in the grass. `iLift` is the height above
     the ground. Asserts the shader's arithmetic against the engine's light,
     the rotor's lift, and the tower's stacked bays. */
  const SRC=W_SHADOW_VS;
  assert.ok(/attribute float iLift/.test(SRC),
    'the shadow pass no longer takes a per-instance lift, so every caster is '
    +'assumed to be standing on the ground');
  assert.ok(/hAbove\s*=\s*lift\s*\+/.test(SRC),
    'the shear no longer includes the height above the ground, so a rotor on a '
    +'roof casts as short as one lying in the grass');
  assert.ok(/iRect\.w\s*\+\s*lift/.test(SRC),
    'the near edge is no longer dropped back to the ground, so the cast starts '
    +'in mid-air under the thing that threw it');

  /* The shear W_SHADOW_VS computes, in JS. */
  const L={x:-0.55,y:-0.43,z:0.72};
  const n=Math.hypot(L.x,L.y,L.z), Lx=L.x/n, Ly=L.y/n, Lz=L.z/n;
  const uLen=Math.min(4.0,Math.max(0.4,0.55/Math.max(0.13,Lz)));
  const k=uLen/Math.max(0.30,Lz);
  const tip=(hAbove)=>Math.hypot(Math.abs(Lx*hAbove*k),Math.abs(Ly*hAbove*k)*0.55);

  const rows=[];
  for(let v=0;v<HOUSE_SCALE.length;v++){
    const lift=houseRotorLift(v), rotor=makeRoofRotor(new RNG(1),0);
    assert.ok(lift>houseDims(v).wall,
      `variant ${v}: the rotor's lift is ${lift}px, which is less than the wall `
      +`below it. A hub on a roof stands above the whole building.`);
    const grounded=tip(rotor.h), raised=tip(lift+rotor.h);
    assert.ok(raised>grounded*2.5,
      `variant ${v}: the raised rotor throws ${raised.toFixed(1)}px and the same `
      +`rotor on the ground throws ${grounded.toFixed(1)}px. The lift barely `
      +`changed the cast, so the height is not reaching the shear.`);
    rows.push(`  house v${v}  rotor ${rotor.h}px, lift ${lift}px  ->  cast `
      +`${raised.toFixed(0)}px, was ${grounded.toFixed(0)}px`);
  }
  console.log('  ELEVATED CASTERS — shadow length from the ground, not from the roof');
  console.log(rows.join('\n'));

  /* and the tower: every bay stands on the one below it */
  const g=makeWorldGen(SITE_SEEDS[0],MEADOW);
  const pump=g.STEADING.find(t=>t.kind==='pump');
  if(pump){
    const chunk=g.bakeChunk(Math.floor(pump.x/CH),Math.floor(pump.y/CH));
    const bays=chunk.props.filter(p=>p.kind==='bay').sort((a,b)=>b.y-a.y);
    const wheel=chunk.props.find(p=>p.kind==='wheel');
    assert.ok(bays.length>1,'the pump tower is not stacked from bays');
    assert.equal(bays[0].lift,0,'the ground bay is not on the ground');
    for(let i=1;i<bays.length;i++)
      assert.ok(bays[i].lift>bays[i-1].lift,
        `bay ${i} does not stand higher than the one below it`);
    assert.ok(wheel&&wheel.lift>=bays[bays.length-1].lift,
      'the wheel does not stand on the head of its own tower');
  }
});

test('nothing spawns inside a building, in any world',()=>{
  /* `built` is a site condition because its two callers sit on opposite
     sides of the lifecycle: candidateAnchorsAround asks before an actor
     exists, entityAffordance asks on every step. */
  for(const [biome,opt] of [['meadow',MEADOW],
                            ['boreal',{biome:'boreal',density:0.95,snow:0.5,lake:0.55}]]){
    for(const seed of SITE_SEEDS.slice(0,4)){
      const g=makeWorldGen(seed,opt);
      const plans=g.compileLifePlans();
      const seen=[];
      const check=(x,y,tag)=>{
        if(x===undefined||y===undefined) return;
        seen.push(tag);
        assert.equal(g.lifeSiteAt(x,y).conditions.built,false,
          `${biome} seed ${seed}: ${tag} is anchored at (${Math.round(x)},${Math.round(y)}), `
          +`inside a building's silhouette. Two meadow machines were compiled onto the `
          +`roofs of two houses this way — medium and habitat are the only gates that `
          +`ran, and neither knows a wall is there.`);
      };
      /* Use nodes are exempt: an authored place binding may resolve inside a
         building, and those nodes do not pass through `profileSuitability`.
         What walks (cohorts and individuals) may not be inside a wall. */
      for(const r of [...(plans.individuals||[]),...(plans.cohorts||[])]){
        check(r.anchor?.x,r.anchor?.y,`${r.profileId} anchor`);
        check(r.position?.x,r.position?.y,`${r.profileId} position`);
        for(const n of r.route?.nodes||[]) check(n.x,n.y,`${r.profileId} route node`);
      }
      assert.ok(seen.length>0,`${biome} seed ${seed} compiled no anchors to check`);
    }
  }
});

test('built ground refuses every profile that could stand on it',()=>{
  /* The gate is in profileSuitability, so it holds for every reader. */
  for(const seed of SITE_SEEDS.slice(0,3)){
    const g=makeWorldGen(seed,MEADOW);
    const h=g.STEADING.find(t=>t.kind==='house');
    const f=steadingFootprint('house',h.vari||0);
    const inside=g.lifeSiteAt(h.x,h.y-1);
    assert.equal(inside.conditions.built,true,
      `seed ${seed}: the inside of a house does not report as built ground`);
    for(const id of ['colossus','strider','pilgrim'])
      assert.equal(g.profileSuitability(id,inside),0,
        `seed ${seed}: ${id} is still suitable inside a house`);
    assert.equal(g.entityAffordance('colossus',h.x,h.y-1),false,
      `seed ${seed}: the movement gate admits a colossus into a house`);
    /* The yard is refused too: eighteen pixels of clearance is nothing to a
       four-metre machine, which stands outside the wall and draws through
       the roof. */
    const yard=g.lifeSiteAt(h.x+f.hx+2,h.y-2);
    assert.equal(yard.conditions.built,true,
      `seed ${seed}: the yard beside a house admits a machine, so a colossus can `
      +`stand ${f.yard}px off the wall and be drawn through the roof behind it`);
    /* Clear of the yard is open ground: the band has an outside. */
    const open=g.lifeSiteAt(h.x+f.hx+f.yard+6,h.y-2);
    assert.equal(open.conditions.built,false,
      `seed ${seed}: ground beyond the yard still reports as built, so the band has `
      +`no outer edge and the machines have nowhere to stand at all`);
    for(const id of ['colossus','strider','pilgrim'])
      assert.ok(g.profileSuitability(id,open)>=0,`${id} broke outside the yard`);
  }
});

test('a declared shell meets a wall with its breadth; the traveller does not',()=>{
  /* A point test against every solid lets a colossus put its feet beside a
     house and its mass through the roof. Inflating by the traveller's 2.5px
     would move where every world seats it on the first frame, so the breadth
     is for declared shells only. */
  const solids=[{x:100,y:100,r:5}];
  const scene={inside:false,actors:[],chunks:new Map([['0,0',{solids}]]),
               gen:{beyondRim:()=>false,traversalAt:null}};
  const blocked=(x,y,e)=>Scene.prototype.blocked.call(scene,x,y,e);
  const shell=ACTOR.colossus?{key:'colossus'}:null;
  assert.ok(shell&&(ACTOR.colossus.solidRadius||0)>0,
    'the colossus declares no solidRadius, so it has no breadth to collide with');
  const r=ACTOR.colossus.solidRadius;
  /* just outside the trunk for a point, inside it for the shell */
  const gap=100+5+r*0.5;
  assert.equal(blocked(gap,100),false,
    'the traveller no longer passes where it used to; its point test changed');
  assert.equal(blocked(gap,100,shell),true,
    `a ${r}px shell passes within ${(gap-100-5).toFixed(1)}px of a solid, so its body `
    +`crosses what its anchor cleared`);
});
