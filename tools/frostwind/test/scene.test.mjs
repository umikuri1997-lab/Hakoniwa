import assert from 'node:assert/strict';
import test from 'node:test';

import { SCENES, Scene, TRAVELLER_SPEED } from '../src/scene.js';
import { bakeWorldAtlas, buildWorldAtlas } from '../src/atlas.js';
import { TIERS, growsIn } from '../src/biome.js';
import { CAMEL_STATES } from '../src/body-camel.js';
import { DEER_STATES } from '../src/body-deer.js';
import { CH, FLAG_Q } from '../src/constants.js';
import { ACTOR, PRINT } from '../src/fauna.js';
import { CAST, castStates, gaitCyclePx, heightPx, stepPx,
  travellerKeyFor } from '../src/people.js';
import { LifeRuntime } from '../src/life-runtime.js';
import { LifeSession } from '../src/life-session.js';
import { morphologiesIn } from '../src/life.js';
import { KINDS } from '../src/species.js';
import { SURF } from '../src/surface.js';
import { makeWorldGen } from '../src/worldgen.js';

/* Read from the authority, not copied. */
const TRAVELLER_WALK=TRAVELLER_SPEED.walk;

function motionScene(blocked=()=>false,speed=1){
  const scene=new Scene({W:320,H:180,time:0},23,{},'frostwood');
  scene.px=0;scene.py=0;scene.camXf=-160;scene.camYf=-100;
  scene.gait=0;scene.moving=false;scene.locomotionState='idle';
  scene.gen={traversalAt:()=>({speed,medium:'dry'}),lifePatchId:()=>null};
  scene.portals=[];scene.blocked=blocked;scene.dropPrints=()=>{};scene.stepLife=()=>{};
  return scene;
}

test('disposing a scene releases every resident GPU texture', () => {
  const released = [];
  let terminated=0;
  const tex = (name) => ({ dispose: () => released.push(name) });
  const scene = new Scene({}, 7, {}, 'frostwood');

  scene.chunkWorker={terminate:()=>terminated++};
  scene.chunks.set('0,0', { tex: tex('chunk') });
  scene.baked = { nrm: tex('atlas-normal'), mat: tex('atlas-material') };

  scene.dispose();

  assert.deepEqual(released.sort(), [
    'atlas-material', 'atlas-normal', 'chunk',
  ]);
  assert.equal(scene.chunks.size, 0);
  assert.equal(scene.baked, null);
  assert.equal(terminated,1);
});

test('runtime chunk misses queue without calling the main-thread generator',()=>{
  const messages=[];
  const scene=new Scene({W:320,H:180,atlasGen:1,time:0},9,{},'frostwood');
  scene.chunkWorker={postMessage:m=>messages.push(m)};
  scene.gen={bakeChunk:()=>assert.fail('runtime ensure compiled on the main thread')};
  scene.camXf=0;scene.camYf=0;
  const queued=scene.ensure(false),pending=scene.chunkPending.size;
  assert.ok(queued>0);
  assert.equal(messages.length,queued);
  assert.equal(pending,queued);
  assert.ok(messages.every(m=>m.type==='bake'));
  assert.equal(scene.ensure(false),0,'pending misses were queued twice');
});

test('traveller attention moves the head and preserves body facing',()=>{
  const scene=new Scene({time:1},11,{},'frostwood');
  scene.px=10;scene.py=20;scene.dir=0;scene.faceLeft=false;scene.moving=false;
  scene.setAttention({x:-20,y:20,z:0,kind:'creature'});
  for(let i=0;i<16;i++)scene.updateTravellerAttention(0.04);
  const a=scene.travellerAppearance();
  /* The look reaches the draw list while locomotion remains the body-facing
     authority after the traveller stops. */
  assert.equal(a.dir,0);
  assert.equal(a.flip,false);
  assert.ok(a.look==='left'||a.look==='right',`look was ${a.look}`);
  assert.equal(scene.px,10);
  assert.equal(scene.py,20);
  const key=scene.clipKey('walk',a.dir,false,a.look);
  assert.match(key,new RegExp(`^walk@idle~${a.look}:${a.dir}:\\d$`),
    'the look did not pick a baked look bank');
});

test('traveller travel follows post-collision distance, not requested input',()=>{
  const blocked=motionScene(()=>true);
  blocked.step(0.5,{right:true});
  assert.equal(blocked.moving,false);
  assert.equal(blocked.locomotionState,'idle');

  const slide=motionScene((x)=>Math.abs(x)>1e-9);
  slide.step(0.5,{right:true,down:true});
  const distance=TRAVELLER_WALK*0.5/Math.sqrt(2);
  assert.ok(Math.abs(slide.py-distance)<1e-9,'a wall took the whole diagonal');
  assert.equal(slide.moving,true);

  const terrain=motionScene(()=>false,0.5);
  terrain.step(0.5,{right:true});
  assert.ok(Math.abs(terrain.px-TRAVELLER_WALK*0.25)<1e-9,'terrain speed was ignored');
});

test('a mounted traveller selects camel movement and collision breadth',()=>{
  const mounted=motionScene();
  mounted.mount={id:'camel:0',key:'camel',x:0,y:0,hx:1,hy:0};
  assert.equal(mounted.camelMounted(),true);
  assert.deepEqual(mounted.travellerSpeed(),{
    walk:ACTOR.camel.speed,run:ACTOR.camel.runSpeed,
  });
  mounted.step(0.5,{right:true});
  assert.ok(Math.abs(mounted.px-ACTOR.camel.speed*0.5)<1e-9);
  mounted.step(0.5,{right:true,run:true});
  assert.equal(mounted.locomotionState,'run');
  assert.equal(mounted.mountedState(),'pace');

  const collision=new Scene({W:320,H:180,time:0},23,{},'desert');
  collision.gen={beyondRim:()=>false,traversalAt:()=>({walk:true})};
  collision.chunks=new Map();
  collision.actors=[{key:'camel',x:20,y:0}];
  collision.mount={id:'camel:1',key:'camel',x:0,y:0,hx:1,hy:0};
  assert.equal(collision.blocked(0,0),true,
    'the mounted traveller passed through a camel-width body');
  collision.mount=null;
  assert.equal(collision.blocked(0,0),false,
    'camel breadth leaked into an on-foot traveller');
});

test('mounted strikes plant camel pads and request paced sand intensity',()=>{
  for(const locomotionState of ['walk','run']){
    const scene=motionScene();
    scene.mount={id:'camel:0',key:'camel',x:0,y:0,hx:1,hy:0};
    delete scene.dropPrints;
    scene.prints=[];scene.printGait=0;scene.lastPX=0;scene.lastPY=0;
    scene.px=80;scene.py=0;scene.gait=8;scene.moving=true;
    scene.locomotionState=locomotionState;scene.r={time:4};
    const marks=[];scene.mark=(...args)=>marks.push(args);
    scene.dropPrints();
    assert.ok(marks.length>=2,`${locomotionState} planted no paced contacts`);
    assert.ok(marks.every(([, ,kind,state])=>
      kind===PRINT.camelPad&&state===locomotionState));
    assert.ok(new Set(marks.map(([,y])=>Math.sign(y))).size>1,
      `${locomotionState} collapsed four pads onto one track line`);
  }
});

test('boot prints follow planted pose boundaries and alternate feet',()=>{
  const scene=motionScene();
  delete scene.dropPrints;
  scene.prints=[];scene.printGait=0;
  scene.lastPX=0;scene.lastPY=0;scene.mark=()=>{};
  scene.r={time:0};
  const cycle=gaitCyclePx(heightPx(CAST.traveller),'walk');

  scene.px=cycle*2;scene.py=0;scene.gait=16;
  scene.locomotionState='walk';
  scene.dropPrints();
  assert.equal(scene.prints.length,4,'two gait cycles did not plant four boots');
  const sides=scene.prints.map(([,y])=>Math.sign(y));
  assert.deepEqual(sides,[1,-1,1,-1],'the trail is one file, not two');

  const still=motionScene();
  delete still.dropPrints;
  still.prints=[];still.printGait=0;still.lastPX=0;still.lastPY=0;
  still.mark=()=>{};still.r={time:0};
  still.dropPrints();
  assert.equal(still.prints.length,0,'a standing traveller left a print');
});

test('foot response reads the baked surface under the contact',()=>{
  const geom=new Uint8Array(CH*CH*4);
  const c={ox:0,oy:0,geom};
  const scene=Object.create(Scene.prototype);
  scene.gen={traversalAt:()=>({surface:SURF.snow})};
  scene.chunkAt=()=>c;
  scene.stampPrint=()=>{};
  scene.kick=[];scene.kickSeq=0;
  const flag=(v)=>{ geom[(3*CH+2)*4+3]=v*FLAG_Q; };

  flag(SURF.dust);
  assert.equal(scene.surfaceFlagAt(2,3,c),SURF.dust);
  scene.mark(2,3,PRINT.boot,'run');
  assert.equal(scene.kick.length,0,'meadow dust used the analytic snow fallback');

  flag(SURF.sand);
  assert.equal(scene.materialSinkAt(2,3),1);
  scene.mark(2,3,PRINT.boot,'walk');
  assert.ok(scene.kick.length>0,'baked sand did not throw its approved spray');
  flag(SURF.snow);
  assert.equal(scene.materialSinkAt(2,3),2);
});

test('run selection has resolved-speed hysteresis',()=>{
  const scene=motionScene();
  scene.step(0.25,{right:true,run:true});
  assert.equal(scene.locomotionState,'run');
  scene.step(0.5,{});
  assert.equal(scene.locomotionState,'idle');
  scene.step(0.25,{right:true});
  assert.equal(scene.locomotionState,'walk');
});

test('camera position cannot alter resolved displacement',()=>{
  const a=motionScene(),b=motionScene();
  b.camXf=900;b.camYf=-700;
  a.step(0.3,{left:true,up:true});
  b.step(0.3,{left:true,up:true});
  assert.deepEqual([a.px,a.py],[b.px,b.py]);
});

/* A figure NPC resolves into the person's three baked banks. A state the
   bake does not carry ('prepare', 'greet' from the life layer) falls back to
   one it does. */
test('figure NPC clip keys resolve to baked person banks',()=>{
  const scene=new Scene({time:2},13,{},'frostwood');
  const baked=new Set();
  for(const state of Object.keys(castStates()))
    baked.add(state==='walk'?'':'@'+state);
  for(const name of ['elder','merchant','woodcutter','swampFisher']){
    const F=ACTOR[name];
    assert.equal(F.figure,true);
    assert.deepEqual(F.states,castStates());
    for(const state of ['walk','run','idle','prepare','greet'])
      for(let dir=0;dir<5;dir++){
        const key=scene.actorClipKey(F,dir,state!=='idle',0,state,0);
        const m=key.match(/^([a-zA-Z]+)(@[a-z]+)?:(\d):(\d)$/);
        assert.ok(m,`${name} ${state} produced unparseable key ${key}`);
        assert.equal(m[1],F.key);
        assert.ok(baked.has(m[2]||''),`${name} ${state} left the baked banks: ${key}`);
        assert.equal(+m[3],dir);
      }
  }
});

test('every townfolk row walks and runs on the one shared body',()=>{
  /* Townfolk are drawn by figure-folk.js like everyone else: the same three
     states and frame counts, with a run for `withdraw`. */
  const scene=new Scene({time:2},13,{},'frostwood');
  const F=ACTOR.fruitBearer;
  assert.deepEqual(F.states,{idle:6,walk:8,run:8});
  assert.equal(scene.actorClipKey(F,2,true,3.4,'walk'),'fruitBearer:2:3');
  assert.equal(scene.actorClipKey(F,2,true,5.4,'run'),'fruitBearer@run:2:5');
  assert.equal(scene.actorClipKey(F,2,false,0,'idle',4.2),'fruitBearer@idle:2:4');
});

test('a figure NPC step length is derived from its own stature',()=>{
  /* The merchant is 0.77 of a traveller and leaves closer prints. No row
     authors a number: see STEP_OF_STATURE in body-folk.js. */
  assert.equal(ACTOR.merchant.stride,stepPx(heightPx(CAST.merchant)));
  assert.equal(ACTOR.merchant.stride,9);
  assert.equal(ACTOR.elder.stride,10);
  assert.ok(ACTOR.merchant.stride<ACTOR.elder.stride,
    'the shorter man did not take the shorter step');
});

test('roe deer clip keys cover idle, walk and rotary gallop banks',()=>{
  const scene=new Scene({time:2},17,{},'frostwood');
  const F=ACTOR.roeDeer;
  assert.equal(F.track,PRINT.hoof);
  for(const [state,n] of Object.entries(DEER_STATES))for(let dir=0;dir<3;dir++)
    for(let frame=0;frame<n;frame++){
      const key=scene.actorClipKey(F,dir,state!=='idle',frame,state,frame);
      const bank=state==='walk'?'roeDeer':`roeDeer@${state}`;
      assert.equal(key,`${bank}:${dir}:${frame}`);
    }
});

test('a startled roe deer changes to its gallop clip and run cadence',()=>{
  const gen=makeWorldGen(19,{biome:'boreal',lake:0.45,density:0.65});
  const session=new LifeSession(19),life=new LifeRuntime(session,gen,'frostwood');
  const record=[...session.records.values()].find((q)=>q.profileId==='roeDeer');
  let deer=life.reconcile(record.position.x,record.position.y,1600,1000)
    .find((q)=>q.profileId==='roeDeer');
  life.step(0.1,{px:deer.x,py:deer.y,W:1600,H:1000,travellerMoving:true,
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0});
  assert.equal(record.commitment.action,'orient');
  session.advanceTo(record.commitment.endsAt);
  const gait=deer.gait;
  life.step(0.1,{px:deer.x,py:deer.y,W:1600,H:1000,travellerMoving:true,
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0});
  deer=life.actorList().find((q)=>q.profileId==='roeDeer');
  const F=ACTOR.roeDeer;
  assert.equal(deer.motionState,'gallop');
  assert.equal(record.commitment.action,'flee');
  assert.ok(Math.abs((deer.gait-gait)-F.runGait*0.1)<1e-9,
    `gallop advanced ${deer.gait-gait}, expected ${F.runGait*0.1}`);
});

/* A rendered frame cannot check completeness: a missing sprite draws nothing
   and every colour law still passes. The roster is compared against the
   authorities: BIOMES and growsIn say which species root there, LIFE which
   bodies live there, and ACTOR.key maps a body to its atlas row. */
test('each world bakes every sprite it can place and nothing it cannot', () => {
  const SEED = 20260727;
  const biomes = [...new Set(Object.values(SCENES).map((s) => s.biome))];
  const full = bakeWorldAtlas(buildWorldAtlas(SEED, 1));
  const report = [];

  for (const biome of biomes) {
    const atlas = buildWorldAtlas(SEED, 1, biome);
    const { rects } = bakeWorldAtlas(atlas);
    const has = (key) => Object.hasOwn(rects, key);

    for (const kind of KINDS) {
      const tiers = TIERS[kind] || [];
      if (growsIn(biome, kind)) {
        for (const tier of new Set(tiers))
          assert.ok(has(`${kind}:${tier}:0`),
            `${biome} grows ${kind} at tier ${tier} but baked no sprite for it`);
      } else {
        assert.ok(!tiers.some((tier) => has(`${kind}:${tier}:0`)),
          `${biome} baked ${kind}, which growsIn says does not root there`);
      }
    }

    /* ACTOR.key is the atlas row, not always the morphology: the lakekeeper
       borrows the fisher's. */
    for (const morph of morphologiesIn(biome)) {
      const row = ACTOR[morph];
      if (!row?.key) continue;
      const state = row.states ? Object.keys(row.states)[0] : null;
      const key = row.figure || !state ? row.key : `${row.key}@${state}`;
      assert.ok(has(`${key}:0:0`) || has(`${row.key}:0:0`),
        `${biome} hosts ${morph} but baked no '${row.key}' bank`);
    }

    /* The wardrobe mapping is people.js's travellerKeyFor. */
    const traveller = travellerKeyFor(biome);
    assert.ok(has(`${traveller}:0:0`),
      `${biome} baked no traveller under key '${traveller}'`);
    if(biome==='desert')for(const [state,n] of Object.entries(CAMEL_STATES)){
      const bank=state==='walk'?ACTOR.camel.riderKey
        :`${ACTOR.camel.riderKey}@${state}`;
      const camel=state==='walk'?ACTOR.camel.key:`${ACTOR.camel.key}@${state}`;
      for(let dir=0;dir<3;dir++)for(let frame=0;frame<n;frame++){
        assert.ok(has(`${bank}:${dir}:${frame}`),
          `desert baked no mounted rider ${state}:${dir}:${frame}`);
        /* Both sprites are anchored on the camel's ground row. The rider
           draws nothing below his boots, so cropping leaves his anchor below
           his last row, and that gap is his height off the soil. Scene.visible
           adds it to his cast lift, and W_SHADOW_VS shears from the ground
           under him. The animal on the sand has no gap. */
        const air=(r)=>r.ay-(r.h-1);
        const rider=rects[`${bank}:${dir}:${frame}`];
        const mount=rects[`${camel}:${dir}:${frame}`]||rects[`${camel}:${dir}:0`];
        assert.ok(air(rider)>10,
          `the mounted rider ${state}:${dir}:${frame} reports ${air(rider)} rows `
          +'of air under him, so his shadow is cast from the ground');
        if(mount)assert.equal(air(mount),0,
          `the camel ${state}:${dir}:${frame} is not standing on the ground`);
      }
    }

    const keys = Object.keys(rects).length;
    assert.ok(keys < Object.keys(full.rects).length,
      `${biome} baked ${keys} keys, the same as the unfiltered cast`);
    report.push(`  ${biome.padEnd(8)} ${String(keys).padStart(5)} keys`);
  }

  if (process.env.FROSTWIND_TEST_REPORT)
    console.log(`\n  ATLAS SUBSET, of ${Object.keys(full.rects).length} `
      + `unfiltered keys\n${report.join('\n')}`);
});
