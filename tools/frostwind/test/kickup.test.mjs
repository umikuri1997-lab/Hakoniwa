import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorldAtlas } from '../src/atlas.js';
import {
  GRAVITY_PX_S2, KICK, KICK_POOL_MAX, flightFor, kickFor, spawnKick, stepKick,
} from '../src/kickup.js';
import { RAMP } from '../src/palette.js';
import { PX_PER_M } from '../src/scale.js';
import { GRAIN } from '../src/sprite.js';
import { SURF, SURFACE } from '../src/surface.js';

test('each loose surface names its material, independent of whether it prints',()=>{
  const expected={
    snow:'snow',trail:'snow',peat:'peat',sand:'sand',sabkha:'sabkha',
    cavestone:'silt',geode:'silt',moonfloor:'silt',geodeHot:'silt',
  };
  for(const [i,row] of SURFACE.entries()){
    const cfg=kickFor(i);
    assert.equal(row.kick??null,expected[row.name]??null,
      `${row.name} has an undeclared airborne material`);
    assert.equal(cfg,row.kick?KICK[row.kick]:null);
  }
  assert.equal(kickFor(SURF.hamada),null);
  assert.equal(kickFor(SURF.boardwalk),null,
    'a pressure mark on a made board must not manufacture trail dust');
  assert.ok(kickFor(SURF.sand));
});

test('the meadow trail records boots without throwing airborne material',()=>{
  assert.equal(SURFACE[SURF.dust].print,1);
  assert.equal(SURFACE[SURF.dust].kick,null);
  const pool=[];
  spawnKick(pool,0,0,SURF.dust,0,'run');
  assert.equal(pool.length,0);
});

test('launch height derives velocity, and terminal speed derives landing time',()=>{
  for(const [name,cfg] of Object.entries(KICK)){
    for(const state of ['walk','run']){
      for(const heightM of cfg.heightM[state]){
        const f=flightFor(heightM,cfg.terminalMps);
        assert.ok(Math.abs(f.peakPx-heightM*PX_PER_M)<1e-10,
          `${name} ${state} apex drifted from its material height`);
        assert.ok(Math.abs(f.launchPxS*f.launchPxS
          -2*GRAVITY_PX_S2*(f.peakPx-0.5))<1e-8,
        `${name} ${state} launch no longer solves v²=2gh`);
        assert.ok(f.durationS>f.ascentS&&f.fallS>0);
      }
    }
    assert.ok(cfg.heightM.run[0]>cfg.heightM.walk[1],
      `${name} running does not clear its walking spray`);
  }
  const sand=flightFor(0.20,KICK.sand.terminalMps);
  const snow=flightFor(0.20,KICK.snow.terminalMps);
  assert.ok(snow.fallS>sand.fallS,
    'equal-height snow must settle more slowly than sand');
});

test('the exact integrator reaches its apex, caps the fall, and lands',()=>{
  const pool=[];
  spawnKick(pool,0,0,SURF.snow,0,'run');
  const particle=pool[0],dt=1/240;
  let t=0,top=particle.z,minVz=particle.vz;
  while(pool.includes(particle)&&t<4){
    stepKick(pool,dt,0.5);t+=dt;
    top=Math.max(top,particle.z);
    minVz=Math.min(minVz,particle.vz);
  }
  assert.ok(!pool.includes(particle),'snow outlived its computed flight');
  assert.ok(Math.abs(top-particle.peak)<0.01,
    `integrated apex ${top.toFixed(3)} missed ${particle.peak.toFixed(3)} px`);
  assert.ok(Math.abs(t-particle.life)<=dt*1.01,
    `landing ${t.toFixed(3)}s missed ${particle.life.toFixed(3)}s`);
  assert.ok(minVz>=-particle.terminal-1e-10,'terminal speed was exceeded');
  assert.ok(Math.abs(minVz+particle.terminal)<1e-6,
    'snow never reached its material terminal speed');
});

test('running throws a higher and denser spray than walking',()=>{
  const walk=[],run=[];
  spawnKick(walk,0,0,SURF.sand,4,'walk');
  spawnKick(run,0,0,SURF.sand,4,'run');
  assert.equal(walk.length,KICK.sand.count.walk);
  assert.equal(run.length,KICK.sand.count.run);
  assert.ok(Math.min(...run.map((p)=>p.peak))>Math.max(...walk.map((p)=>p.peak)));
  assert.ok(run.every((p)=>p.life>0&&p.maxAge>p.life));
});

test('sand keeps the approved desert spray while snow stays pale and fluffy',()=>{
  assert.deepEqual(KICK.sand.count,{walk:3,run:5});
  assert.deepEqual(KICK.sand.heightM,{walk:[0.08,0.16],run:[0.18,0.32]});
  assert.deepEqual(KICK.sand.radialMps,{walk:[0.15,0.45],run:[0.30,0.80]});
  assert.equal(KICK.sand.terminalMps,2);
  assert.equal(KICK.sand.driftMps,0.13);
  assert.equal(KICK.sand.size,2);
  assert.deepEqual(KICK.sand.band,[0,1]);
  assert.equal(KICK.sand.flutterMps,0);

  assert.ok(KICK.snow.band[0]>=0.70);
  assert.equal(KICK.snow.band[1],1);
  assert.equal(KICK.snow.size,1);
  assert.ok(KICK.snow.heightM.run[1]<=KICK.sand.heightM.walk[1]);
  assert.ok(KICK.snow.terminalMps<KICK.sand.terminalMps);
  assert.ok(KICK.snow.flutterMps>0);
  const pool=[];
  spawnKick(pool,0,0,SURF.snow,0,'walk');
  assert.ok(pool.every((p)=>p.size===1&&p.sMin>=0.70&&p.flutter>0));
});

test('the spawn is deterministic and cannot overrun its pool',()=>{
  const a=[],b=[];
  spawnKick(a,7,9,SURF.sand,3,'run');
  spawnKick(b,7,9,SURF.sand,3,'run');
  assert.deepEqual(a,b,'the same footfall threw two different sprays');
  const full=Array.from({length:KICK_POOL_MAX-1},()=>({}));
  spawnKick(full,7,9,SURF.sand,4,'run');
  assert.equal(full.length,KICK_POOL_MAX);
});

test('each grain carries both legal contrast endpoints of its material',()=>{
  const atlas=buildWorldAtlas(31,0,'meadow');
  for(const [i,sp] of atlas.grain[0].entries()){
    assert.deepEqual([...new Set(sp.occ)],[GRAIN],`grain ${i+1} lost its material id`);
    assert.deepEqual([...new Set(sp.shade)].sort(),[0,1],
      `grain ${i+1} does not carry a dark and light pixel`);
  }
  const luma=(c)=>c[0]*0.30+c[1]*0.59+c[2]*0.11;
  for(const row of SURFACE.filter((q)=>q.kick)){
    const cfg=KICK[row.kick],ramp=RAMP[row.ramp];
    const rung=(t)=>ramp[Math.round(t*(ramp.length-1))];
    const pair=cfg.band.map((t)=>rung(t));
    const minStep=Math.min(...ramp.slice(1).map((c,i)=>
      Math.abs(luma(c)-luma(ramp[i]))));
    for(const bg of ramp){
      const clearance=Math.max(...pair.map((c)=>Math.abs(luma(c)-luma(bg))));
      assert.ok(clearance+1e-9>=minStep,
        `${row.name} pair clears a background by ${clearance.toFixed(2)}, `
        +`below its one-rung floor ${minStep.toFixed(2)}`);
    }
  }
});
