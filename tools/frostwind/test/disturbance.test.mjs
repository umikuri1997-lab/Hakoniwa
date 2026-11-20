import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DISTURBANCE_STAGES, DISTURBANCE_TYPES, applyDisturbance, recordTravellerPresence,
} from '../src/disturbance.js';
import { LifeSession } from '../src/life-session.js';
import { makeWorldGen } from '../src/worldgen.js';

test('disturbance ledger is typed and rejects universal pressure aliases',()=>{
  for(const type of ['cutting','traffic','noise','construction','flood','drawdown',
                      'fire','grazing','foodSubsidy','machinePressure','repeatedPresence'])
    assert.ok(DISTURBANCE_TYPES.includes(type));
  assert.ok(!DISTURBANCE_TYPES.includes('humanPressure'));
  const gen=makeWorldGen(1,{biome:'boreal',lake:0.45,density:0.65});
  const session=new LifeSession(1);
  assert.throws(()=>applyDisturbance(session,gen,{type:'humanPressure',x:0,y:0}),
    /unknown disturbance/);
});

test('cutting produces staged species-specific response and material legacies',()=>{
  const seed=71,gen=makeWorldGen(seed,{biome:'boreal',lake:0.45,density:0.65});
  const session=new LifeSession(seed),anchor=gen.compileLifePlans().cohorts
    .find((q)=>q.profileId==='roeDeer').anchor;
  const base=gen.lifeSiteAt(anchor.x,anchor.y,session);
  const result=applyDisturbance(session,gen,{
    id:'cut:1',type:'cutting',x:anchor.x,y:anchor.y,intensity:1,
    sourceId:'person:woodcutter',
  });
  const immediate=gen.lifeSiteAt(anchor.x,anchor.y,session);
  assert.equal(result.deviation.succession,'opened');
  assert.ok(immediate.resources.coneMast<base.resources.coneMast);
  assert.ok(immediate.resources.snowShelter<base.resources.snowShelter);
  assert.ok(immediate.risks.activeWork>0.8);
  for(const kind of ['stumps','slash','retained-seed-trees'])
    assert.ok(session.traces.some((q)=>q.kind===kind),`${kind} legacy was not stored`);
  const response=Object.fromEntries(result.responses.map((q)=>[q.profileId,q]));
  assert.match(response.squirrel.response,/cone-and-canopy-loss/);
  assert.match(response.boar.response,/later-rooting/);

  session.advanceTo(session.clock.minute+3*1440);
  const release=gen.lifeSiteAt(anchor.x,anchor.y,session);
  assert.equal(session.deviations.get(anchor.patchId).succession,'release');
  assert.equal(release.risks.activeWork,0);
  assert.ok(release.resources.browse>immediate.resources.browse);
  assert.ok(release.resources.rooting>immediate.resources.rooting);
  assert.ok(gen.occupancyInput('boar',release).input>
    gen.occupancyInput('boar',immediate).input);

  session.advanceTo(session.clock.minute+27*1440);
  assert.equal(session.deviations.get(anchor.patchId).succession,'dense-regrowth');
  assert.ok(session.deviations.get(anchor.patchId).legacies.includes('regrowth'));
});

test('swamp drawdown changes prey, basking, and depth without manufacturing refuge',()=>{
  const seed=20260727,gen=makeWorldGen(seed,{biome:'swamp',lake:0.55,density:0.65});
  const session=new LifeSession(seed),hole=gen.alligatorHoles[0];
  /* A DRAWDOWN THIS TEST CAN READ IS ONE THE SITE SURVIVES. The stage takes
     0.28 m off the water, so a 0.13 m margin does not get shallower, it stops
     being water, and every resource that keys off standing water goes to its
     dry value. That is a correct outcome and the wrong measurement: what is
     being tested here is that a shallower margin means more prey and more
     basking, so the site has to still be a margin afterwards. The floor comes
     from the disturbance itself rather than a literal, so it tracks the stage. */
  const DRAWN=Math.abs(DISTURBANCE_STAGES.drawdown[0].conditionDelta.depth);
  let point=null;
  for(let r=hole.r;r<=hole.influenceRadius&&!point;r+=4)
    for(let i=0;i<32&&!point;i++){
      const a=i/32*Math.PI*2,x=hole.x+Math.cos(a)*r,y=hole.y+Math.sin(a)*r;
      const q=gen.hydrologyAt(x,y);
      if(q.water&&q.depth>DRAWN&&q.depth<=0.38)point={x,y};
    }
  assert.ok(point,'no shallow refuge margin was found');
  const base=gen.lifeSiteAt(point.x,point.y,session);
  const result=applyDisturbance(session,gen,{
    id:'drawdown:1',type:'drawdown',x:point.x,y:point.y,intensity:0.8,
  });
  const immediate=gen.lifeSiteAt(point.x,point.y,session);
  assert.ok(immediate.conditions.depth<base.conditions.depth);
  assert.ok(immediate.resources.shallowPrey>=base.resources.shallowPrey);
  assert.ok(immediate.resources.bask>=base.resources.bask);
  assert.equal(immediate.resources.refuge,base.resources.refuge);
  for(const id of ['alligator','heron','turtle'])
    assert.ok(result.responses.some((q)=>q.profileId===id),`${id} did not read drawdown`);
  assert.ok(session.traces.some((q)=>q.kind==='old-water-mark'));

  session.advanceTo(session.clock.minute+10*1440);
  const dry=gen.lifeSiteAt(point.x,point.y,session);
  assert.ok(dry.resources.shallowPrey<immediate.resources.shallowPrey);
  assert.equal(dry.resources.refuge,base.resources.refuge);
});

test('flood condition deltas can inundate a previously dry swamp site',()=>{
  const seed=20260727,gen=makeWorldGen(seed,{biome:'swamp',lake:0.55,density:0.65});
  const session=new LifeSession(seed),landing=gen.swampSettlement.landing;
  let point=null;
  for(let r=8;r<=80&&!point;r+=8)for(let i=0;i<24&&!point;i++){
    const a=i/24*Math.PI*2,x=landing.x+Math.cos(a)*r,y=landing.y+Math.sin(a)*r;
    if(!gen.lifeSiteAt(x,y,session).conditions.water)point={x,y};
  }
  assert.ok(point,'no dry flood-margin site was found');
  const base=gen.lifeSiteAt(point.x,point.y,session);
  applyDisturbance(session,gen,{id:'flood:1',type:'flood',...point,intensity:1});
  const flooded=gen.lifeSiteAt(point.x,point.y,session);
  assert.equal(base.conditions.water,false);
  assert.equal(flooded.conditions.water,true);
  assert.ok(flooded.conditions.depth>base.conditions.depth);
});

test('repeated traveller presence shifts risk before making habitat impossible',()=>{
  const seed=91,gen=makeWorldGen(seed,{biome:'boreal',lake:0.45,density:0.65});
  const session=new LifeSession(seed),anchor=gen.compileLifePlans().cohorts
    .find((q)=>q.profileId==='roeDeer').anchor;
  const base=gen.lifeSiteAt(anchor.x,anchor.y,session);
  const baseEncounter=gen.encounterAt('roeDeer',anchor.x,anchor.y,720,
    undefined,0.65,session);
  for(let i=0;i<4;i++)recordTravellerPresence(session,gen,anchor.x,anchor.y);
  const changed=gen.lifeSiteAt(anchor.x,anchor.y,session);
  const changedEncounter=gen.encounterAt('roeDeer',anchor.x,anchor.y,720,
    undefined,0.65,session);
  assert.ok(changed.risks.humanTraffic>base.risks.humanTraffic);
  assert.ok(changedEncounter.activity<baseEncounter.activity,
    'traffic did not shift daytime activity before spatial absence');
  assert.ok(gen.profileSuitability('roeDeer',changed)>0,
    'bounded repeated presence forced immediate spatial absence');
  assert.ok(session.disturbances.some((q)=>q.type==='repeatedPresence'));
  assert.ok(session.deviations.get(anchor.patchId).legacies.includes('compacted-route'));
  const visits=session.deviations.get(anchor.patchId).visits;
  session.advanceTo(session.clock.minute+2*1440);
  assert.equal(session.deviations.get(anchor.patchId).visits,visits,
    'a staged traffic transition was counted as another visit');
});

test('every disturbance delta names a field that a life site reads',()=>{
  /* AUTHORITY: lifeSiteAt in src/world/life-field.js applies a resource delta
     only to a resource it computes, and reads `depth` and `hydroperiod` from a
     condition delta. A delta under another key changes nothing. MEASURED: the
     sand burial rows wrote `shade` and `forage` while the site fields are
     `desertShade` and `desertForage`, so a storm moved no resource. */
  const gen=makeWorldGen(20260727,{biome:'desert',lake:0.55,density:0.65});
  const resources=new Set(Object.keys(gen.lifeSiteAt(0,0).resources));
  const conditions=new Set(['depth','hydroperiod']);
  for(const [type,stages] of Object.entries(DISTURBANCE_STAGES))for(const row of stages){
    for(const key of Object.keys(row.resourceDelta))
      assert.ok(resources.has(key),`${type}/${row.succession}: resource delta '${key}' has no reader`);
    for(const key of Object.keys(row.conditionDelta))
      assert.ok(conditions.has(key),`${type}/${row.succession}: condition delta '${key}' has no reader`);
  }
});
