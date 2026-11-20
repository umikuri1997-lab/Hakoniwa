import assert from 'node:assert/strict';
import test from 'node:test';

import { LIFE } from '../src/life.js';
import { LIFE_PATCH_SIZE, LIFE_SITE_SIZE, makeWorldGen } from '../src/worldgen.js';

const OPT={
  boreal:{biome:'boreal',lake:0.45,density:0.65},
  meadow:{biome:'meadow',lake:0.45,density:0.65},
  swamp:{biome:'swamp',lake:0.55,density:0.65},
};

test('life patch and site ids are stable across coordinates and rebuilds',()=>{
  const a=makeWorldGen(71,OPT.boreal),b=makeWorldGen(71,OPT.boreal);
  assert.equal(a.lifePatchId(1,1),b.lifePatchId(1,1));
  assert.equal(a.lifePatchId(1,1),a.lifePatchId(LIFE_PATCH_SIZE-1,LIFE_PATCH_SIZE-1));
  assert.notEqual(a.lifePatchId(1,1),a.lifePatchId(LIFE_PATCH_SIZE+1,1));
  assert.equal(a.lifeSiteId(1,1),a.lifeSiteId(LIFE_SITE_SIZE-1,LIFE_SITE_SIZE-1));
  assert.deepEqual(a.lifeSiteAt(80,160),b.lifeSiteAt(80,160));
});

test('site samples keep conditions resources and risks separate',()=>{
  for(const [biome,opt] of Object.entries(OPT)){
    const g=makeWorldGen(83,opt),site=g.lifeSiteAt(g.pathX(300)+100,300);
    assert.equal(site.biome,biome);
    assert.ok(site.conditions.medium);
    assert.equal(typeof site.resources.firmSubstrate,'number');
    assert.equal(typeof site.risks.humanTraffic,'number');
    assert.equal('occupancy' in site,false);
    assert.equal('population' in site,false);
  }
});

test('resource web rows are executable and biome-scoped',()=>{
  const boreal=makeWorldGen(91,OPT.boreal),swamp=makeWorldGen(91,OPT.swamp);
  const bw=boreal.resourceWebAt(200,200),sw=swamp.resourceWebAt(200,200);
  assert.ok(bw.some((q)=>q.id==='spruce-cones'&&q.supports.includes('squirrel')));
  assert.ok(!bw.some((q)=>q.id==='shallow-prey'));
  assert.ok(sw.some((q)=>q.id==='shallow-prey'&&q.supports.includes('heron')));
  assert.ok(sw.every((q)=>Number.isFinite(q.value)&&q.value>=0&&q.value<=1));
});

test('suitability occupancy inputs and encounters are distinct quantities',()=>{
  const g=makeWorldGen(101,OPT.boreal),x=g.pathX(800)+260,y=800;
  const site=g.lifeSiteAt(x,y),input=g.occupancyInput('roeDeer',site);
  const encounter=g.encounterAt('roeDeer',x,y,360,input.input,0.4);
  assert.equal(encounter.occupancyInput,input.input);
  assert.equal(encounter.detectability,0.4);
  assert.ok(encounter.encounter<=encounter.occupancyInput);
  assert.ok(encounter.encounter<=encounter.activity);
  assert.equal('occupancy' in encounter,false);
  assert.equal('count' in encounter,false);
  assert.equal('carryingCapacity' in encounter,false);
});

test('profile gates reject cross-biome leakage and use shared site samples',()=>{
  const boreal=makeWorldGen(111,OPT.boreal);
  const meadow=makeWorldGen(111,OPT.meadow);
  const p={x:meadow.pathX(900)+180,y:900};
  assert.equal(boreal.entityAffordance(LIFE.colossus,p.x,p.y),false);
  assert.equal(meadow.profileSuitability(LIFE.roeDeer,meadow.lifeSiteAt(p.x,p.y)),0);
  const patch=boreal.lifePatchAt(0,0);
  assert.ok('roeDeer' in patch.occupancyInputs);
  assert.ok(!('colossus' in patch.occupancyInputs));
});

test('session deviations alter resources without mutating static fields',()=>{
  const g=makeWorldGen(121,OPT.boreal),x=160,y=160;
  const base=g.lifeSiteAt(x,y),id=g.lifePatchId(x,y);
  const changed=g.lifeSiteAt(x,y,new Map([[id,{
    resourceDelta:{coneMast:-0.6,browse:0.3},humanTraffic:0.4,
  }]]));
  assert.ok(changed.resources.coneMast<=base.resources.coneMast);
  assert.ok(changed.resources.browse>=base.resources.browse);
  assert.ok(changed.risks.humanTraffic>=base.risks.humanTraffic);
  assert.deepEqual(g.lifeSiteAt(x,y),base,'static compiler field was mutated');
});
