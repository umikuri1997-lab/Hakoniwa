import assert from 'node:assert/strict';
import test from 'node:test';

import { applyDisturbance } from '../src/disturbance.js';
import { LIFE_LIMITS, LifeSession } from '../src/life-session.js';
import { LifeRuntime, RUNTIME_LIMITS } from '../src/life-runtime.js';
import { CAST, folkFootWorld, folkStrikes, heightPx } from '../src/people.js';
import { makeWorldGen } from '../src/worldgen.js';

const OPT={biome:'boreal',lake:0.45,density:0.65};

function runtime(seed=37){
  const session=new LifeSession(seed);
  const gen=makeWorldGen(seed,OPT);
  const life=new LifeRuntime(session,gen,'frostwood');
  return {session,gen,life};
}

function meadowRuntime(seed=37){
  const session=new LifeSession(seed);
  const gen=makeWorldGen(seed,{biome:'meadow',lake:0.35,density:0.50});
  const life=new LifeRuntime(session,gen,'meadow');
  return {session,gen,life};
}

function humanFixture(seed=71,profileId='merchant'){
  const fixture=runtime(seed);
  const record=fixture.life.records().find((q)=>q.profileId===profileId);
  const position=fixture.life.positionAt(record);
  const actor=fixture.life.reconcile(position.x,position.y,1200,900)
    .find((q)=>q.lifeId===record.id);
  assert.ok(actor,`${profileId} did not materialize`);
  return {...fixture,record,actor};
}

test('runtime installs stable plans into a persistent cross-scene session',()=>{
  const {session,life}=runtime();
  assert.equal(session.records.size,life.plan.roster.length+1);
  assert.deepEqual([...session.records.keys()].filter((q)=>q!=='person:traveller').sort(),
    life.plan.roster.map((q)=>q.id).sort());
  assert.equal(session.record('person:traveller').commitment,null);
  assert.ok(life.records().every((q)=>q.commitment&&q.nextEventAt!==null));
});

test('nearby realization is budgeted and preserves member identity on return',()=>{
  const {session,life}=runtime(43);
  const first=life.reconcile(0,0,1200,900);
  assert.ok(first.length>0);
  assert.ok(first.length<=RUNTIME_LIMITS.activeActors);
  const ids=first.map((q)=>q.id).sort();
  const lifeIds=Object.fromEntries(first.map((q)=>[q.id,q.lifeId]));
  life.reconcile(100000,100000,320,180);
  assert.equal(life.actorList().length,0);
  assert.ok([...session.records.values()].every((q)=>q.activeScene===false));
  session.advanceTo(session.clock.minute+90);
  for(const id of ids){
    const record=session.record(lifeIds[id]);
    life.syncRoute(record);
    const position=life.positionAt(record);
    const returned=life.reconcile(position.x,position.y,320,180);
    assert.ok(returned.some((q)=>q.id===id),`${id} did not retain identity on return`);
  }
});

test('human transient body state is deterministic across materialization',()=>{
  /* Gait phase is seeded so nearby people do not plant in lockstep. It remains
     transient and is rebuilt from identity on re-entry. */
  const a=humanFixture(72),b=humanFixture(72);
  assert.equal(a.actor.gait,b.actor.gait);
  assert.equal(a.actor.acc,0);
  const gait=a.actor.gait,id=a.record.id,position=a.life.positionAt(a.record);
  a.life.dematerialize(id);
  assert.equal(Object.hasOwn(a.record,'gait'),false);
  assert.equal(Object.hasOwn(a.record,'acc'),false);
  const returned=a.life.materialize(a.record,position)[0];
  assert.equal(returned.gait,gait);
});

test('blocked human motion cannot advance gait or claim movement',()=>{
  const {session,life,record,actor}=humanFixture(73);
  record.commitment={action:'travel',target:{x:actor.x+120,y:actor.y},
    startedAt:session.clock.minute,endsAt:session.clock.minute+30,interruptible:true};
  life.syncActorCommitment(actor,record);actor.prepareLeft=0;
  const gait=actor.gait;
  life.stepActor(actor,record,0.1,{
    blocked:()=>true,mark:()=>assert.fail('blocked actor marked ground'),
    prints:[],renderTime:0,allowTrace:true,
  });
  assert.equal(actor.moving,false);
  assert.equal(actor.gait,gait,'a blocked actor advanced a foot pose');
});

test('human attention eases during preparation without entering semantic state',()=>{
  const {session,life,record,actor}=humanFixture(74);
  record.commitment={action:'travel',target:{x:actor.x+100,y:actor.y-60},
    startedAt:session.clock.minute,endsAt:session.clock.minute+30,interruptible:true};
  life.syncActorCommitment(actor,record);
  for(let i=0;i<4;i++)life.stepActor(actor,record,0.04,{
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0,allowTrace:false,
  });
  assert.equal(actor.motionState,'prepare');
  assert.equal(actor.semanticAction,'travel');
  assert.ok(actor.attention.transition>0&&actor.attention.transition<=1);
  assert.ok(actor.attention.appearance);
});

test('human boot prints come from a planted pose after real displacement',()=>{
  const {session,life,record,actor}=humanFixture(75);
  record.commitment={action:'travel',target:{x:actor.x+120,y:actor.y},
    startedAt:session.clock.minute,endsAt:session.clock.minute+30,interruptible:true};
  life.syncActorCommitment(actor,record);actor.prepareLeft=0;actor.gait=3.9;
  const gait=actor.gait;
  const x0=actor.x,y0=actor.y;
  const prints=[],marks=[];
  const made=life.stepActor(actor,record,0.1,{
    blocked:()=>false,mark:(...q)=>marks.push(q),prints,renderTime:2,allowTrace:true,
  });
  assert.equal(actor.motionState,'walk');
  assert.ok(actor.gait>gait,'walking did not advance the figure frame');
  assert.equal(prints.length,1);
  assert.equal(marks.length,1);
  assert.equal(marks[0][3],'walk');
  const foot=folkStrikes(gait,actor.gait,{h:heightPx(CAST.merchant),state:'walk'})[0];
  const p=folkFootWorld(
    x0+(actor.x-x0)*foot.at,y0+(actor.y-y0)*foot.at,actor.hx,actor.hy,foot);
  assert.ok(Math.abs(marks[0][0]-p.x)<1e-9&&Math.abs(marks[0][1]-p.y)<1e-9,
    'the mark missed the planted boot point');
  assert.equal(made.kind,'boot-print');
  assert.equal(made.transient,true);
});

test('a fleeing human marks each running footfall as a run',()=>{
  const {session,life,record,actor}=humanFixture(751);
  record.responseState={fear:true,aggression:false};
  record.commitment={action:'flee',target:{x:actor.x+120,y:actor.y},
    startedAt:session.clock.minute,endsAt:session.clock.minute+30,interruptible:true};
  life.syncActorCommitment(actor,record);actor.prepareLeft=0;actor.gait=3.9;
  const marks=[];
  life.stepActor(actor,record,0.1,{
    blocked:()=>false,mark:(...q)=>marks.push(q),prints:[],renderTime:2,allowTrace:true,
  });
  assert.equal(actor.motionState,'run');
  assert.equal(marks.length,1);
  assert.equal(marks[0][3],'run');
});

test('a human blocked against a wall leaves no prints',()=>{
  /* The half of the law that a time-based accumulator would silently break:
     walking on the spot is not walking. */
  const {session,life,record,actor}=humanFixture(76);
  record.commitment={action:'travel',target:{x:actor.x+120,y:actor.y},
    startedAt:session.clock.minute,endsAt:session.clock.minute+30,interruptible:true};
  life.syncActorCommitment(actor,record);actor.prepareLeft=0;
  actor.gait=3.99;
  const prints=[];
  for(let i=0;i<20;i++)life.stepActor(actor,record,0.1,{
    blocked:()=>true,mark:()=>{},prints,renderTime:2,allowTrace:true,
  });
  assert.equal(prints.length,0,'a blocked human left tracks');
});

test('an unrealized planned route begins at its declared anchor',()=>{
  const {session,life}=runtime(47);
  const record=[...session.records.values()].find((q)=>q.profileId==='roeDeer');
  const actor=life.reconcile(record.anchor.x,record.anchor.y,800,600)
    .find((q)=>q.lifeId===record.id);
  assert.ok(actor);
  assert.equal(actor.x,record.anchor.x);
  assert.equal(actor.y,record.anchor.y);
});

test('nearby realization is independent of viewport dimensions',()=>{
  const a=runtime(48),b=runtime(48);
  const small=a.life.reconcile(0,0,320,180).map((q)=>q.id).sort();
  const large=b.life.reconcile(0,0,1600,1000).map((q)=>q.id).sort();
  assert.deepEqual(small,large);
});

test('nearby semantic outcomes are independent of frame partition',()=>{
  const a=runtime(50),b=runtime(50);
  const context={px:0,py:0,W:320,H:180,travellerMoving:false,
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0};
  for(let i=0;i<128;i++)a.life.step(1/64,context);
  for(let i=0;i<32;i++)b.life.step(1/16,context);
  assert.deepEqual(a.session.snapshot(),b.session.snapshot());
});

test('nearby fear reads typed patch disturbance without an omniscient traveller',()=>{
  const {session,gen,life}=runtime(51);
  const record=[...session.records.values()].find((q)=>q.profileId==='roeDeer');
  applyDisturbance(session,gen,{type:'cutting',x:record.anchor.x,y:record.anchor.y,
    intensity:1});
  life.step(1/64,{
    px:record.anchor.x+300,py:record.anchor.y+300,W:320,H:180,
    travellerMoving:false,blocked:()=>false,mark:()=>{},prints:[],renderTime:0,
  });
  assert.equal(record.responseState.fear,true);
  assert.equal(record.commitment.action,'orient');
});

test('a familiar anchor is not automatically defended as territory',()=>{
  const {session,life}=runtime(52);
  const record=[...session.records.values()].find((q)=>q.profileId==='boar');
  life.step(1/64,{
    px:record.anchor.x+1,py:record.anchor.y,W:320,H:180,
    travellerMoving:true,blocked:()=>false,mark:()=>{},prints:[],renderTime:0,
  });
  assert.equal(record.responseState.aggression,false);
});

test('submergence travels to water before changing medium state',()=>{
  const seed=20260727;
  const session=new LifeSession(seed);
  const gen=makeWorldGen(seed,{biome:'swamp',lake:0.55,density:0.65});
  const life=new LifeRuntime(session,gen,'swamp');
  const record=life.records().find((q)=>q.profileId==='turtle');
  const water=life.node(record.route.nodeIds[0]);
  let dry=null;
  for(let radius=24;radius<=360&&!dry;radius+=24)
    for(let i=0;i<32&&!dry;i++){
      const angle=i/32*Math.PI*2;
      const point={x:water.x+Math.cos(angle)*radius,y:water.y+Math.sin(angle)*radius};
      const site=gen.lifeSiteAt(point.x,point.y);
      if(site.conditions.medium==='dry'&&gen.profileSuitability('turtle',site)>0)dry=point;
    }
  assert.ok(dry,'fixture could not find reachable dry turtle ground');
  life.materialize(record,dry);
  const actor=life.actorList().find((q)=>q.lifeId===record.id);
  record.commitment={
    action:'submerge',targetId:water.id,startedAt:session.clock.minute,
    endsAt:session.clock.minute+30,interruptible:true,
  };
  life.syncActorCommitment(actor,record);
  life.stepActor(actor,record,0.1,{
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0,allowTrace:false,
  });
  assert.equal(actor.moving,true);
  assert.equal(actor.motionState,'crawl');
  actor.x=water.x;actor.y=water.y;
  life.stepActor(actor,record,0.1,{
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0,allowTrace:false,
  });
  assert.equal(actor.moving,false);
  assert.equal(actor.motionState,'float');
});

test('one meadow machine greets, briefly follows, and resumes its route',()=>{
  const {session,life}=meadowRuntime(83);
  const machineRecords=life.records().filter((q)=>
    ['colossus','strider','pilgrim'].includes(q.profileId));
  const focus=machineRecords[0],position=life.positionAt(focus);
  const context={
    px:position.x+100,py:position.y,W:800,H:600,travellerMoving:true,
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0,
  };
  const originals=new Map(machineRecords.map((q)=>[q.id,{...q.commitment}]));
  life.step(0.01,context);
  const greeters=machineRecords.filter((q)=>q.commitment.action==='approach-traveller');
  assert.equal(greeters.length,1);
  const record=greeters[0],actor=life.actorList().find((q)=>q.lifeId===record.id);
  assert.ok(actor);
  assert.deepEqual(record.suspendedCommitment,originals.get(record.id));

  context.px=actor.x+36;context.py=actor.y;
  record.commitment.endsAt=Math.floor(session.clock.minute);
  life.step(1.01,context);
  assert.equal(record.commitment.action,'greet');
  assert.equal(actor.motionState,'greet');
  assert.ok(actor.greetPhase>=0&&actor.greetPhase<1,
    `greeting did not begin on its red eye frame: ${actor.greetPhase}`);

  record.commitment.endsAt=Math.floor(session.clock.minute);
  life.step(1.01,context);
  assert.equal(record.commitment.action,'follow-traveller');

  record.commitment.endsAt=Math.floor(session.clock.minute);
  life.step(1.01,context);
  assert.equal(record.commitment.action,originals.get(record.id).action);
  assert.equal(record.commitment.reason,'resume-after-greeting');
  assert.equal(record.suspendedCommitment,null);

  record.commitment={action:'rest',targetId:null,startedAt:session.clock.minute,
    endsAt:session.clock.minute+20,reason:'test-rest',interruptible:true};
  life.syncActorCommitment(actor,record);
  life.stepActor(actor,record,0.1,{
    traveller:{x:context.px,y:context.py},blocked:()=>false,
    mark:()=>{},prints:[],renderTime:0,allowTrace:false,
  });
  assert.equal(actor.motionState,'idle');
});

test('off-screen route progress is analytic and independent of frame partitions',()=>{
  const a=runtime(49),b=runtime(49);
  const target=a.session.clock.minute+120;
  for(let t=a.session.clock.minute+1;t<=target;t++)a.session.advanceTo(t);
  b.session.advanceTo(target);
  for(const rt of [a,b])for(const record of rt.life.records()){
    rt.life.syncRoute(record);
    rt.life.persistActivePositions();
  }
  assert.deepEqual(a.session.snapshot(),b.session.snapshot());
});

test('runtime operation counters stay under explicit budgets',()=>{
  const {session,life}=runtime(53);
  const prints=[];
  const actors=life.step(0.016,{
    px:0,py:0,W:1200,H:900,travellerMoving:true,
    blocked:()=>false,mark:()=>{},prints,renderTime:0,wind:{x:1,y:0},
  });
  assert.ok(actors.length<=RUNTIME_LIMITS.activeActors);
  assert.ok(life.metrics.decisions<=RUNTIME_LIMITS.semanticDecisionsPerStep);
  assert.ok(life.metrics.observations<=RUNTIME_LIMITS.observationsPerStep);
  assert.ok(life.metrics.candidates<=RUNTIME_LIMITS.candidatesPerStep);
  assert.ok(life.metrics.traces<=RUNTIME_LIMITS.tracesPerStep);
  assert.ok(prints.length<=RUNTIME_LIMITS.tracesPerStep);
  assert.ok(session.metrics.lastStepEvents<=LIFE_LIMITS.eventsPerStep);
});

test('realized actors carry semantic action and expression state',()=>{
  const {life}=runtime(61);
  const actors=life.step(0.25,{
    px:0,py:0,W:1200,H:900,travellerMoving:false,
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0,
  });
  for(const actor of actors){
    assert.ok(actor.lifeId);
    assert.ok(actor.profileId);
    assert.ok(actor.semanticAction);
    assert.ok(actor.motionState);
    assert.equal(typeof actor.moving,'boolean');
  }
});

test('an active cohort is held by its bodies, not by its semantic point',()=>{
  /* The semantic point travels a commitment route in minutes, so it can be
     seven hundred pixels along the way to the water while the drawn herd is
     still stepping past the tent. Deactivating on the point deleted the
     bodies in full view: three camels, on screen, gone in one frame. */
  const session=new LifeSession(20260727);
  const gen=makeWorldGen(20260727,{biome:'desert',lake:0.55,density:0.65});
  const life=new LifeRuntime(session,gen,'desert');
  const record=life.records().find((q)=>q.profileId==='camel');
  const home=life.positionAt(record);
  const before=life.reconcile(home.x,home.y+30,480,270)
    .filter((a)=>a.lifeId===record.id);
  assert.ok(before.length>=2,'the herd did not materialize at its pen');
  /* the point sprints far outside the activation window; the bodies stay */
  record.position={x:home.x,y:home.y+RUNTIME_LIMITS.activationRadiusY*2};
  record.route=null;
  const held=life.reconcile(home.x,home.y+30,480,270)
    .filter((a)=>a.lifeId===record.id);
  assert.equal(held.length,before.length,
    'the herd was deleted in full view when its record moved first');
  /* once the bodies themselves have walked out, the point rules again */
  for(const a of life.actors.get(record.id))
    a.y=home.y+RUNTIME_LIMITS.activationRadiusY*3;
  record.route=null;
  const gone=life.reconcile(home.x,home.y+30,480,270)
    .filter((a)=>a.lifeId===record.id);
  assert.equal(gone.length,0,'a herd with no nearby bodies stays resident');
});
