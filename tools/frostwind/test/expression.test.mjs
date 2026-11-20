import assert from 'node:assert/strict';
import test from 'node:test';

import { LifeRuntime } from '../src/life-runtime.js';
import { LifeSession } from '../src/life-session.js';
import { makeWorldGen } from '../src/worldgen.js';

function boreal(seed=107){
  const gen=makeWorldGen(seed,{biome:'boreal',lake:0.45,density:0.65});
  const session=new LifeSession(seed);
  return {gen,session,life:new LifeRuntime(session,gen,'frostwood')};
}

test('resident interruption is anticipated, remembered, and resumed',()=>{
  const {session,life}=boreal();
  const merchantRecord=session.record('person:merchant');
  const near=life.reconcile(merchantRecord.position.x,merchantRecord.position.y,1600,1000);
  const merchant=near.find((q)=>q.profileId==='merchant');
  assert.ok(merchant,'merchant did not realize near the common');
  const original={...merchantRecord.commitment};
  life.step(0.04,{
    px:merchant.x,py:merchant.y,W:1600,H:1000,travellerMoving:true,
    blocked:()=>false,mark:()=>{},prints:[],renderTime:0,
  });
  const interrupted=session.record('person:merchant');
  const visible=life.actorList().find((q)=>q.profileId==='merchant');
  assert.equal(interrupted.commitment.action,'orient');
  assert.equal(visible.motionState,'prepare');
  assert.equal(visible.expressionIntent,'prepare');
  assert.equal(visible.attend.kind,'commitment-target');
  assert.ok(visible.attention?.appearance,'preparation discarded transient gaze');
  assert.ok(visible.attention.transition>0,'gaze snapped instead of easing');
  assert.ok(interrupted.memories.some((q)=>
    q.kind==='interruption'&&q.fact.interrupted===original.action));
  assert.equal(interrupted.suspendedCommitment.action,original.action);

  for(let i=0;i<30&&interrupted.commitment.action==='orient';i++)
    life.step(0.04,{
      px:merchant.x+300,py:merchant.y+300,W:2000,H:1600,travellerMoving:false,
      blocked:()=>false,mark:()=>{},prints:[],renderTime:0,
    });
  assert.equal(interrupted.commitment.action,original.action);
  assert.equal(interrupted.commitment.reason,'resume-interrupted');
  assert.equal(interrupted.suspendedCommitment,null);
});

test('semantic travel drives locomotion state and bounded material traces',()=>{
  const {session,life}=boreal(109);
  const deerRecord=[...session.records.values()].find((q)=>q.profileId==='roeDeer');
  const actors=life.reconcile(deerRecord.position.x,deerRecord.position.y,1600,1000);
  const deer=actors.find((q)=>q.profileId==='roeDeer');
  const target=deerRecord.agenda.map((q)=>life.node(q.targetId)).find((q)=>
    q&&Math.hypot(q.x-deer.x,q.y-deer.y)>20);
  assert.ok(target,'deer agenda has no distant travel target');
  deerRecord.commitment={
    action:'travel',targetId:target.id,startedAt:session.clock.minute,
    endsAt:session.clock.minute+120,reason:'drive',interruptible:true,
  };
  deerRecord.responseState={fear:false,aggression:false};
  life.syncRoute(deerRecord);
  life.syncActorCommitment(deer,deerRecord);
  const prints=[],marks=[];let made=null;
  for(let i=0;i<60;i++){
    made=life.stepActor(deer,deerRecord,0.1,{
      px:10000,py:10000,traveller:{x:10000,y:10000},
      blocked:()=>false,mark:(...q)=>marks.push(q),prints,renderTime:i/10,
    });
    if(made)break;
  }
  assert.equal(deer.semanticAction,'travel');
  assert.equal(deer.motionState,'walk');
  assert.equal(deer.expressionIntent,'walk');
  assert.ok(deer.moving);
  assert.ok(prints.length>0);
  assert.equal(prints.length,marks.length);
  assert.equal(made.kind,'hoof-print');
  assert.equal(made.transient,true);
  assert.equal(session.traces.length,0);
});
