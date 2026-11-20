import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTOR } from '../src/fauna.js';
import {
  DREAM_LAW, GREET_FRAMES, MACHINE, MAT, WALK_FRAMES, dampedOffset, machineModel,
  machinePose, makeMachine, springResponse,
} from '../src/machine.js';
import { RNG } from '../src/rng.js';

const NAMES=Object.keys(MACHINE);
const sprite=(name,frame=0,dir=0,state='walk')=>
  makeMachine(name,new RNG(20260731),frame,dir,state);
const hash=(sp)=>{
  let h=2166136261;
  for(let i=0;i<sp.occ.length;i++){
    h^=sp.occ[i]; h=Math.imul(h,16777619);
    if(sp.occ[i]){
      h^=Math.round((sp.nx[i]+1)*100); h=Math.imul(h,16777619);
      h^=Math.round((sp.ny[i]+1)*100); h=Math.imul(h,16777619);
    }
  }
  return h>>>0;
};
const structureHash=(sp)=>{
  let h=2166136261;
  for(const value of sp.occ){
    const m=value===MAT.eye||value===MAT.helloEye?MAT.bronze:value;
    h^=m;h=Math.imul(h,16777619);
  }
  return h>>>0;
};

test('the dream law is one bounded change to ordinary mechanics',()=>{
  assert.equal(DREAM_LAW.name,'curvature-heart');
  assert.match(DREAM_LAW.statement,/rest curvature/i);
  assert.doesNotMatch(DREAM_LAW.statement,/cancel|ignore|remove gravity/i);
});

test('the three topologies keep their enlarged scale and distinct structures',()=>{
  const M=NAMES.map(machineModel);
  assert.deepEqual(M.map(x=>x.hPx),[88,64,66]);
  assert.ok(Math.abs(M[0].hPx/M[1].hPx-1.375)<0.01);
  assert.ok(MACHINE.colossus.body.w>MACHINE.strider.body.w);
  assert.ok(MACHINE.pilgrim.body.h>MACHINE.strider.body.h);
  assert.ok(MACHINE.strider.body.top>MACHINE.colossus.body.top);
  assert.ok(new Set(NAMES.map(n=>MACHINE[n].body.profile)).size===3);
});

test('mass, frequency and pressure derive from hollow shells and feet',()=>{
  const c=machineModel('colossus'),s=machineModel('strider'),p=machineModel('pilgrim');
  assert.ok(c.massKg>p.massKg&&p.massKg>s.massKg,
    `expected colossus > pilgrim > strider, got ${c.massKg}, ${p.massKg}, ${s.massKg} kg`);
  for(const M of [c,s,p]){
    assert.ok(M.bronzeKg>M.mossKg);
    assert.ok(M.naturalHz>0&&M.naturalHz<5);
    assert.ok(M.pressureKPa>20&&M.pressureKPa<100);
  }
});

test('every solved walk pose keeps the centre of mass over support',()=>{
  for(const name of NAMES) for(let f=0;f<WALK_FRAMES;f++){
    const p=machinePose(name,f,0,'walk');
    assert.ok(p.contacts.length>0,`${name} frame ${f} has no planted contact`);
    assert.ok(p.supportMargin>=-1e-9,
      `${name} frame ${f} moves COM outside support by ${-p.supportMargin}px`);
  }
});

test('the footfall response is bounded by a decaying elastic envelope',()=>{
  for(const name of NAMES){
    const M=machineModel(name),z=M.row.damping,w=M.omega;
    for(let t=0;t<4;t+=0.02){
      const q=Math.abs(springResponse(M,t));
      const envelope=Math.exp(-z*w*t);
      assert.ok(q<=envelope+1e-12,`${name} response escaped envelope at ${t}s`);
    }
    assert.ok(Math.exp(-z*w*2)<Math.exp(-z*w*0.5));
    const samples=[];
    for(let f=0;f<WALK_FRAMES;f++){
      const q=dampedOffset(name,f); samples.push(q);
      assert.ok(Math.abs(q)<=M.row.shakePx);
    }
    if(M.row.shakePx)
      assert.ok(samples.some(q=>q!==0),`${name} oscillator vanished in pixel quantisation`);
    else
      assert.ok(samples.every(q=>q===0),`${name} should carry no shell shake`);
  }
});

test('a dark upper pelt carries a wind-driven fringe on a settled body',()=>{
  for(const name of NAMES){
    const p0=machinePose(name,0,0,'idle'),p1=machinePose(name,1,0,'idle');
    assert.equal(p0.bodyX,p1.bodyX);
    assert.equal(p0.sink,p1.sink);
    assert.equal(p0.shake,p1.shake);
    assert.notEqual(p0.wind,p1.wind);
    assert.ok(ACTOR[name].dMax<=0.50,`${name} moss reaches outside the dark canopy half`);
    for(let d=0;d<3;d++){
      const a=sprite(name,0,d,'idle'),b=sprite(name,1,d,'idle');
      let moss=0,bronze=0;
      for(const m of a.occ){
        if(m===MAT.moss) moss++;
        if(m===MAT.bronze) bronze++;
      }
      assert.ok(moss/(moss+bronze)>0.28,`${name} view ${d} has too little exterior pelt`);
      assert.ok(a.mossFringe.pixels>20,`${name} view ${d} lost its hanging fringe`);
      assert.notEqual(hash(a),hash(b),`${name} view ${d} wind phase did not move pixels`);
    }
  }
});

test('the colossus carries one small flower on an upper silhouette corner',()=>{
  assert.ok(MACHINE.colossus.flower);
  assert.equal(MACHINE.strider.flower,undefined);
  assert.equal(MACHINE.pilgrim.flower,undefined);
  for(let d=0;d<3;d++)for(let f=0;f<MACHINE.colossus.frames.idle;f++){
    const sp=sprite('colossus',f,d,'idle'),F=sp.flower;
    assert.ok(F);
    assert.ok(F.y<F.rootY);
    assert.equal(Math.sign(F.rootX-sp.ax),F.side);
    assert.equal(sp.occ[F.rootY*sp.w+F.rootX],MAT.moss);
    assert.equal(sp.occ[F.y*sp.w+F.x],MAT.bloom);
  }
});

test('all views and states stay grounded and carry unit normals',()=>{
  for(const name of NAMES) for(const state of Object.keys(MACHINE[name].frames)){
    const n=MACHINE[name].frames[state];
    for(let d=0;d<3;d++)for(let f=0;f<n;f++){
      const sp=sprite(name,f,d,state);
      assert.equal(sp.ay,sp.h-1);
      let bottom=-1,occupied=0;
      for(let i=0;i<sp.occ.length;i++) if(sp.occ[i]){
        occupied++; bottom=Math.max(bottom,(i/sp.w)|0);
        assert.ok(i%sp.w!==0&&i%sp.w!==sp.w-1,
          `${name}/${state}/${d}/${f} is clipped by a canvas edge`);
        const q=Math.hypot(sp.nx[i],sp.ny[i],sp.nz[i]);
        assert.ok(Math.abs(q-1)<1e-5,`${name}/${state}/${d}/${f} normal ${q}`);
      }
      assert.ok(occupied>40);
      assert.equal(bottom,sp.ay,`${name}/${state}/${d}/${f} left the ground`);
    }
  }
});

test('a greeting changes only the planted eye signal',()=>{
  assert.equal(GREET_FRAMES,7);
  for(const name of NAMES)for(let d=0;d<3;d++){
    const hashes=[];
    for(let f=0;f<GREET_FRAMES;f++){
      const pose=machinePose(name,f,d,'greet');
      assert.deepEqual(pose.contacts,pose.feet);
      assert.equal(pose.bodyX,0);
      assert.equal(pose.leftLift,0);
      assert.equal(pose.rightLift,0);
      const greeting=sprite(name,f,d,'greet');
      hashes.push(hash(greeting));
      assert.equal(structureHash(greeting),structureHash(sprite(name,f,d,'idle')),
        `${name} view ${d} frame ${f} moved more than its eye`);
    }
    if(d!==1)
      assert.ok(new Set(hashes).size>=3,`${name} view ${d} lost its eye blink`);
  }
});

test('eyes stay lit and pulse green three times before returning red',()=>{
  for(const name of NAMES)for(const d of [0,2]){
    const awake=sprite(name,0,d,'idle');
    assert.ok(awake.occ.includes(MAT.eye));
    assert.ok(!awake.occ.includes(MAT.helloEye));
    for(const f of [0,2,4,6]){
      const red=sprite(name,f,d,'greet');
      assert.ok(red.occ.includes(MAT.eye));
      assert.ok(!red.occ.includes(MAT.helloEye));
      assert.equal(structureHash(red),structureHash(sprite(name,f,d,'idle')));
    }
    for(const f of [1,3,5]){
      const green=sprite(name,f,d,'greet');
      assert.ok(green.occ.includes(MAT.helloEye));
      assert.ok(!green.occ.includes(MAT.eye));
      assert.equal(structureHash(green),structureHash(sprite(name,f,d,'idle')));
    }
  }
});

test('walk banks contain eight derived poses without material flicker',()=>{
  for(const name of NAMES) for(let d=0;d<3;d++){
    const hashes=[];
    for(let f=0;f<WALK_FRAMES;f++){
      const sp=sprite(name,f,d);
      hashes.push(hash(sp));
      const mats=new Set(sp.occ);
      mats.delete(0);
      for(const m of mats) assert.ok(Object.values(MAT).includes(m),
        `${name} emitted undeclared material ${m}`);
      assert.ok(mats.has(MAT.bronze)&&mats.has(MAT.moss)&&mats.has(MAT.seam));
      if(d!==1) assert.ok(mats.has(MAT.eye));
      for(let i=0;i<sp.occ.length;i++)
        assert.ok(!(sp.occ[i]===MAT.moss&&sp.noSnow[i]),
          `${name} moss entered a swept/contact exclusion`);
    }
    assert.ok(new Set(hashes).size>=6,`${name} view ${d} collapsed its eight-pose walk`);
  }
});

test('speed, stride and animation cadence are one equation',()=>{
  for(const name of NAMES){
    const F=ACTOR[name],row=MACHINE[name];
    const derivedSpeed=F.stride*row.frameRate/4;
    assert.ok(Math.abs(derivedSpeed-F.speed)<1e-9);
    assert.equal(F.states.walk,WALK_FRAMES);
    assert.equal(F.ramp,'masonry');
    assert.equal(F.ramp2,'canopy');
  }
});
