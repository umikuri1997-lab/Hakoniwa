import assert from 'node:assert/strict';
import test from 'node:test';

import { LIFE_LIMITS, LifeSession } from '../src/life-session.js';
import { keyedRandom, keyedSeed } from '../src/rng.js';
import { WorldClock, declinationForDay } from '../src/world-clock.js';

function makeSession(seed=41){
  const s=new LifeSession(seed,{clock:{dayOfYear:172,minuteOfDay:360}});
  s.addRecord({
    id:'cohort:roe:1',profileId:'roeDeer',sceneId:'frostwood',
    anchor:{x:10,y:20},appearance:{coat:'winter'},
    agenda:[{action:'browse',targetId:'site:a',duration:30},
            {action:'rest',targetId:'site:b',duration:20}],
  });
  s.initializeRecord('cohort:roe:1');
  return s;
}

test('keyed randomness is stable and independent of call order',()=>{
  const a=keyedRandom(9,'roe:1',3,'goal');
  keyedRandom(9,'unrelated',100,'camera');
  assert.equal(keyedRandom(9,'roe:1',3,'goal'),a);
  assert.notEqual(keyedSeed(9,'roe:1',3,'goal'),keyedSeed(9,'roe:1',4,'goal'));
});

test('world clock owns date, time band, and seasonal declination',()=>{
  const c=new WorldClock({dayOfYear:172,minuteOfDay:720});
  assert.equal(c.dayOfYear,172);
  assert.equal(c.minuteOfDay,720);
  assert.equal(c.timeBand,'day');
  assert.ok(Math.abs(c.declination-declinationForDay(172))<1e-12);
  const copy=WorldClock.fromSnapshot(c.snapshot());
  assert.deepEqual(copy.snapshot(),c.snapshot());
});

test('the traveller is one unscheduled identity across scene appearances',()=>{
  const session=new LifeSession(9),traveller=session.record('person:traveller');
  assert.equal(traveller.identityClass,'human-person');
  assert.equal(traveller.commitment,null);
  /* Keyed by BIOME, and it is the same object people.js resolves the atlas and
     the scene from. It used to be a third hand-written map keyed by scene id
     that gave the meadow the boreal winter coat. */
  assert.deepEqual(traveller.appearance.byBiome,{
    boreal:'traveller',meadow:'meadowTraveller',swamp:'swampTraveller',
    desert:'desertTraveller',hollow:'hollowTraveller',
  });
  assert.equal(session.events.some((q)=>q.recordId===traveller.id),false);
});

test('incremental and time-jump advancement produce identical semantic state',()=>{
  const incremental=makeSession(),jump=makeSession();
  const target=incremental.clock.minute+240;
  for(let t=incremental.clock.minute+10;t<=target;t+=10)incremental.advanceTo(t);
  jump.advanceTo(target);
  assert.deepEqual(incremental.snapshot(),jump.snapshot());
  const row=jump.record('cohort:roe:1');
  assert.equal(row.appearance.coat,'winter');
  assert.equal(row.position.x,10);
  assert.ok(row.decisionIndex>2);
});

test('snapshots contain semantic state and round-trip without generated data',()=>{
  const a=makeSession();
  a.remember('cohort:roe:1',{id:'seen:1',kind:'traveller',salience:0.8,fact:{near:true}});
  a.addTrace({id:'hoof:1',kind:'hoof-print',x:4,y:8});
  a.addDisturbance({id:'traffic:1',kind:'traffic',patchId:'frostwood:0:0',intensity:0.4});
  a.setDeviation('frostwood:0:0',{succession:'opened'});
  const snap=a.snapshot();
  assert.equal('atlas' in snap,false);
  assert.equal('fields' in snap,false);
  assert.ok(snap.records.every((q)=>!('activeScene' in q)));
  const b=LifeSession.fromSnapshot(JSON.parse(JSON.stringify(snap)));
  assert.deepEqual(b.snapshot(),snap);
});

test('memories and event work are explicitly bounded',()=>{
  const s=makeSession();
  for(let i=0;i<LIFE_LIMITS.memoriesPerRecord+8;i++)
    s.remember('cohort:roe:1',{id:`m:${i}`,kind:'fact',at:i,salience:i/100});
  assert.equal(s.record('cohort:roe:1').memories.length,LIFE_LIMITS.memoriesPerRecord);
  const start=s.clock.minute;
  for(let i=0;i<LIFE_LIMITS.eventsPerStep+5;i++)
    s.schedule({id:`obs:${i}`,at:start,type:'observation',recordId:'cohort:roe:1',
      observation:{id:`o:${i}`,kind:'sound',salience:0.1}});
  assert.equal(s.processDue(start),LIFE_LIMITS.eventsPerStep);
  assert.ok(s.events.length>=5);
});
