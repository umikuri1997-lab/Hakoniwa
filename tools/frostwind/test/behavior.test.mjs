import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BEHAVIOR_LIMITS, categoryCandidates, chooseAction, decide, eligibleActions, observeActor,
  riskFromObservations, socialAggregate, targetCandidates, transitionResponses,
} from '../src/behavior.js';
import { LIFE } from '../src/life.js';

const observer={
  id:'frostwood:cohort:roeDeer:0',profileId:'roeDeer',
  position:{x:0,y:0},decisionIndex:2,commitment:null,responseState:null,
};
const context={
  seed:19,now:100,
  siteAt:(x,y)=>({conditions:{cover:x>50?0.8:0.1,quiet:0.8},
    resources:{browse:0.8,snowShelter:0.7,reedCover:0.1}}),
  suitabilityAt:()=>1,
  resourceField:(id)=>({
    'birch-rubus-browse':'browse','sheltered-snow':'snowShelter',
    'reed-cover':'reedCover',
  }[id]),
};

test('perception is partial, channel-specific, uncertain, and bounded',()=>{
  const subjects=[
    {id:'person:traveller',kind:'traveller',x:35,y:0,moving:true,noise:0.6},
    {id:'hidden',kind:'traveller',x:145,y:0,moving:false,noise:0},
  ];
  const a=observeActor(observer,subjects,context);
  const b=observeActor(observer,[...subjects].reverse(),context);
  assert.deepEqual(a,b,'subject iteration order changed observations');
  assert.ok(a.some((q)=>q.kind==='sight'&&q.subjectId==='person:traveller'));
  assert.ok(a.some((q)=>q.kind==='sound'&&q.subjectId==='person:traveller'));
  assert.ok(!a.some((q)=>q.subjectId==='hidden'));
  assert.ok(a.length<=BEHAVIOR_LIMITS.observationsPerActor);
  assert.notDeepEqual(a.find((q)=>q.kind==='sight').position,{x:35,y:0});
});

test('fear and aggression have independent hysteretic transitions',()=>{
  const profile=LIFE.boar;
  const record={responseState:{fear:false,aggression:false}};
  let state=transitionResponses(record,profile,{fear:profile.fear.enter,aggression:0});
  assert.equal(state.fear,true);
  assert.equal(state.aggression,false);
  record.responseState=state;
  state=transitionResponses(record,profile,{
    fear:(profile.fear.enter+profile.fear.clear)/2,
    aggression:profile.aggression.enter,
  });
  assert.equal(state.fear,true,'fear cleared without crossing its clear threshold');
  assert.equal(state.aggression,true);
});

test('social aggregates preserve declared cohort semantics without invented ties',()=>{
  const record={id:'boar:cohort',profileId:'boar',
    memberIds:['boar:0','boar:1','boar:2'],
    social:{form:'declared-cohort'},position:{x:0,y:0},commitment:{action:'root'}};
  const aggregate=socialAggregate(record,[
    {id:'boar:0',lifeId:'boar:cohort',x:0,y:0},
    {id:'boar:1',lifeId:'boar:cohort',x:4,y:0},
    {id:'other',lifeId:'other',x:100,y:100},
  ]);
  assert.equal(aggregate.form,'declared-cohort');
  assert.equal(aggregate.size,3);
  assert.equal(aggregate.realized,2);
  assert.equal(aggregate.commitment,'root');
  assert.equal('friendship' in aggregate,false);
});

test('current commitments persist unless a declared interrupt fires',()=>{
  const record={...observer,commitment:{
    action:'browse',targetId:'browse:1',startedAt:80,endsAt:140,interruptible:true,
  }};
  const continued=eligibleActions(record,{...context,response:{fear:false,aggression:false}});
  assert.equal(continued.category,'continue');
  assert.equal(chooseAction(record,{...context,response:{fear:false,aggression:false}}).action,'browse');
  const interrupted=eligibleActions(record,{...context,response:{fear:true,aggression:false},
    escapeTargetId:'cover:1'});
  assert.equal(interrupted.category,'safety');
  assert.ok(interrupted.candidates.every((q)=>LIFE.roeDeer.fear.actions.includes(q.action)));
});

test('hard site gates run before candidates are scored within one category',()=>{
  const record={...observer,commitment:null};
  const nodes=[
    {id:'invalid',x:10,y:0},{id:'valid-a',x:70,y:0},{id:'valid-b',x:90,y:0},
  ];
  const eligible=eligibleActions(record,{...context,nodes,
    suitabilityAt:(_profile,site)=>site.conditions.cover<0.2?0:1,
    response:{fear:false,aggression:false},
  });
  assert.ok(eligible.candidates.length<=BEHAVIOR_LIMITS.candidatesPerDecision);
  assert.ok(eligible.candidates.every((q)=>q.targetId!=='invalid'));
});

test('actions select their own resources and media rather than any profile resource',()=>{
  const record={id:'turtle:0',profileId:'turtle',position:{x:0,y:0}};
  const nodes=[
    {id:'prey',x:10,y:0},{id:'bask',x:20,y:0},{id:'cover',x:30,y:0},
  ];
  const sites={
    10:{conditions:{medium:'shallow',quiet:0.7},
      resources:{shallowPrey:0.9,bask:0,reedCover:0.2}},
    20:{conditions:{medium:'dry',quiet:0.7},
      resources:{shallowPrey:0.1,bask:0.9,reedCover:0.1}},
    30:{conditions:{medium:'dry',quiet:0.9},
      resources:{shallowPrey:0,bask:0,reedCover:1}},
  };
  const actionContext={nodes,siteAt:(x)=>sites[x],suitabilityAt:()=>1};
  const forage=targetCandidates('forage',record,actionContext);
  const bask=targetCandidates('bask',record,actionContext);
  const submerge=targetCandidates('submerge',record,actionContext);
  assert.equal(forage.reduce((best,q)=>q.score>best.score?q:best).targetId,'prey');
  assert.equal(bask.reduce((best,q)=>q.score>best.score?q:best).targetId,'bask');
  assert.deepEqual(submerge.map((q)=>q.targetId),['prey']);
});

test('aquatic escape requires a reachable water target',()=>{
  const record={id:'turtle:0',profileId:'turtle',commitment:null};
  const water=categoryCandidates(record,{
    now:10,response:{fear:true,aggression:false,changed:false},
    escapeTargetId:'dry:far',submergeTargetId:'water:far',
  });
  assert.deepEqual(water.candidates.map((q)=>[q.action,q.targetId]),
    [['submerge','water:far']]);
  const stranded=categoryCandidates(record,{
    now:10,response:{fear:true,aggression:false,changed:false},
    escapeTargetId:'dry:far',submergeTargetId:null,
  });
  assert.equal(stranded.candidates[0].action,'orient');
});

test('risk derives from observed evidence rather than omniscient traveller state',()=>{
  const none=riskFromObservations('roeDeer',[],{traveller:{x:1,y:1}});
  assert.equal(none.fear,0);
  const seen=riskFromObservations('roeDeer',[{
    kind:'sight',subjectId:'person:traveller',subjectKind:'traveller',
    distance:8,confidence:0.9,
  }]);
  assert.ok(seen.fear>0.8);
});

test('a decision emits one semantic commitment and response state',()=>{
  const observations=[{
    kind:'sight',subjectId:'person:traveller',subjectKind:'traveller',
    distance:12,confidence:0.9,
  }];
  const result=decide({...observer,responseState:{fear:false,aggression:false}},
    {...context,observations,escapeTargetId:'cover:1'});
  assert.equal(result.response.fear,true);
  assert.ok(LIFE.roeDeer.fear.actions.includes(result.commitment.action));
  assert.ok(result.candidateCount<=BEHAVIOR_LIMITS.candidatesPerDecision);
  assert.ok(result.commitment.endsAt>result.commitment.startedAt);
});
