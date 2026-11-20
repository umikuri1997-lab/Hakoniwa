import assert from 'node:assert/strict';
import test from 'node:test';

import { cabinFootprint } from '../src/cabin.js';
import { LIFE, actionSiteAffinity } from '../src/life.js';
import { makeWorldGen } from '../src/worldgen.js';

const OPTIONS={
  boreal:{biome:'boreal',lake:0.45,density:0.65},
  meadow:{biome:'meadow',lake:0.45,density:0.65},
  swamp:{biome:'swamp',lake:0.55,density:0.65},
};

test('stable life plans are independent of compile order',()=>{
  const seed=20260803;
  const a=makeWorldGen(seed,OPTIONS.boreal);
  a.bakeChunk(0,0,true);
  const planA=a.compileLifePlans();
  const b=makeWorldGen(seed,OPTIONS.boreal);
  const planB=b.compileLifePlans();
  b.bakeChunk(-2,3,true);
  assert.deepEqual(planA,planB);
  assert.deepEqual(a.compileLifePlans(),planA);
});

test('boreal cohorts enforce current social and taxonomic contracts',()=>{
  const plan=makeWorldGen(77,OPTIONS.boreal).compileLifePlans();
  assert.equal(plan.sceneId,'frostwood');
  const deer=plan.cohorts.filter((q)=>q.profileId==='roeDeer');
  const boar=plan.cohorts.filter((q)=>q.profileId==='boar');
  const squirrels=plan.cohorts.filter((q)=>q.profileId==='squirrel');
  assert.equal(deer.length,1);
  assert.equal(deer[0].memberIds.length,1);
  assert.equal(boar.length,1);
  assert.ok([1,3].includes(boar[0].memberIds.length));
  assert.equal(boar[0].social.form,
    boar[0].memberIds.length===1?'solitary-adult':'matrilineal-unit');
  assert.equal(squirrels.length,3);
  assert.ok(squirrels.every((q)=>q.memberIds.length===1));
  assert.equal(plan.residents.length,14);
  assert.deepEqual(plan.residents.map((q)=>q.profileId).sort(),
    ['axeman','bearKid','bookDude','elder','featherHat','fruitBearer',
      'graveWatcher','headphones','leader','merchant','spearGuard','thickDude',
      'wayfarer','woodcutter']);
});

test('every frostwood resident stands in an open yard and nobody shares a pixel',()=>{
  /* AUTHORITY: src/culture.js compiles the use nodes and worldgen anchors a
     resident on one. Three things were wrong and each has a number here. The
     ten townfolk sat on a 24 px ring around the common, so the village was one
     knot in the middle of an empty clearing. The elder's household nodes were
     behind his own front wall, so he spawned inside the log mass. The merchant
     and the wayfarer share a home id and therefore shared one pixel.

     A yard is the apron `buildingDoor` reports, which the cabin site check has
     already proved dry and off the trail. */
  for(const seed of [5,77,123,20260803]){
    const gen=makeWorldGen(seed,OPTIONS.boreal);
    const plan=gen.compileLifePlans();
    const cabins=gen.BUILDINGS.filter((b)=>b.kind==='cabin');
    assert.ok(cabins.length>=3,`seed ${seed} sited only ${cabins.length} cabins`);
    const doors=cabins.map((b)=>({b,d:gen.buildingDoor(b),f:cabinFootprint(gen.buildingDoor(b).v)}));

    for(const r of plan.residents){
      const p=r.position;
      for(const {b,f} of doors)
        assert.ok(!(p.x>b.x-f.hx&&p.x<b.x+f.hx&&p.y>b.y-f.back&&p.y<b.y+f.front),
          `seed ${seed}: ${r.profileId} stands inside the cabin at ${b.x},${b.y}`);
    }

    /* A townfolk belongs to a door and stands in front of it. */
    const townfolk=plan.residents.filter((q)=>q.anchor.nodeId.startsWith('townfolk-'));
    assert.equal(townfolk.length,10);
    const occupied=new Set();
    for(const r of townfolk){
      const near=doors
        .map(({b,d,f})=>({b,d,f,dist:Math.hypot(r.position.x-d.x,r.position.y-d.y)}))
        .sort((a,q)=>a.dist-q.dist)[0];
      assert.ok(near.dist<=45,
        `seed ${seed}: ${r.profileId} is ${near.dist.toFixed(0)} px from the nearest door`);
      assert.ok(r.position.y>=near.d.y+near.f.front,
        `seed ${seed}: ${r.profileId} stands ${near.d.y-r.position.y} rows behind his door`);
      occupied.add(`${near.b.x},${near.b.y}`);
    }
    assert.ok(occupied.size>=Math.min(3,cabins.length-1),
      `seed ${seed}: ten townfolk occupy only ${occupied.size} yards`);

    /* Nobody shares a pixel, and the gap is measured on screen rather than in
       world rows because the projection halves depth. */
    const all=plan.residents.map((q)=>q.position);
    let closest=Infinity,pair='';
    for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
      const gap=Math.hypot(all[i].x-all[j].x,(all[i].y-all[j].y)/0.66);
      if(gap<closest){closest=gap;pair=`${plan.residents[i].profileId}/${plan.residents[j].profileId}`;}
    }
    assert.ok(closest>=12,`seed ${seed}: ${pair} stand ${closest.toFixed(1)} px apart`);
  }
});

test('swamp plans bind animals and residents to one hydrological world',()=>{
  const gen=makeWorldGen(20260727,OPTIONS.swamp),plan=gen.compileLifePlans();
  assert.equal(plan.cohorts.filter((q)=>q.profileId==='alligator').length,2);
  assert.equal(plan.cohorts.filter((q)=>q.profileId==='heron').length,2);
  assert.equal(plan.cohorts.filter((q)=>q.profileId==='turtle').length,3);
  assert.deepEqual(plan.residents.map((q)=>q.profileId).sort(),
    ['swampBoatwright','swampFisher','swampLakekeeper']);
  const fisher=plan.residents.find((q)=>q.profileId==='swampFisher');
  const boatwright=plan.residents.find((q)=>q.profileId==='swampBoatwright');
  assert.equal(fisher.anchor.nodeId,'swamp-landing:gathering');
  assert.equal(boatwright.anchor.nodeId,'swamp-landing:water-mark');
  const workGap=Math.hypot(fisher.position.x-boatwright.position.x,
    fisher.position.y-boatwright.position.y);
  assert.ok(workGap>=18&&workGap<=30,
    `the mutual-repair pair stand ${workGap.toFixed(1)} px apart`);
  /* The keeper is anchored on his own place, not on the landing the other two
     share, which is the whole point of compiling a second site. */
  const keeper=plan.residents.find((q)=>q.profileId==='swampLakekeeper');
  assert.ok(keeper.anchor.nodeId.startsWith('swamp-sinkhole:'));
  assert.ok(Math.hypot(keeper.position.x-gen.swampLakehouse.x,
    keeper.position.y-gen.swampLakehouse.y)<=60);
  for(const q of plan.cohorts){
    assert.equal(gen.lifePatchId(q.anchor.x,q.anchor.y),q.anchor.patchId);
    assert.ok(gen.entityAffordance(q.profileId,q.anchor.x,q.anchor.y));
  }
});

test('meadow machines are unique persistent individuals, never a population count',()=>{
  const gen=makeWorldGen(99,OPTIONS.meadow),plan=gen.compileLifePlans();
  /* The meadow's wildlife is cohorts (a stork, two hares). No machine is
     one. */
  assert.deepEqual(plan.cohorts.map((q)=>q.profileId).sort(),['hare','hare','stork']);
  assert.ok(plan.cohorts.every((q)=>
    LIFE[q.profileId].identity.class!=='fictional-species'),
    'a machine compiled as a cohort');
  assert.deepEqual(plan.individuals.map((q)=>q.profileId).sort(),
    ['colossus','pilgrim','strider']);
  assert.ok(plan.individuals.every((q)=>q.memberIds.length===1));
  assert.equal(new Set(plan.individuals.map((q)=>q.id)).size,3);
  const common=gen.POI.find((q)=>q.kind==='village');
  for(const id of ['colossus','strider']){
    const q=plan.individuals.find((row)=>row.profileId===id);
    assert.ok(Math.hypot(q.position.x-common.x,q.position.y-common.y)<=230,
      `${id} route tradition is disconnected from the meadow common`);
  }
  /* The meadow used to have no residents at all: a steading, a pump and a
     pavilion, and nobody with a reason to have built any of them. It has three
     now and they are individuals like the machines, never a cohort. */
  assert.deepEqual(plan.residents.map((q)=>q.profileId).sort(),
    ['meadowGrower','meadowTender','meadowWeaver']);
  for(const row of plan.residents)
    assert.ok(Object.keys(row.nodeBindings).length,
      `${row.id} compiled with no bound use node`);
});

test('compiled use nodes are actual readers of plans and resources',()=>{
  for(const [biome,opt] of Object.entries(OPTIONS)){
    const gen=makeWorldGen(123,opt),plan=gen.compileLifePlans();
    assert.ok(plan.useNodes.length,`${biome} has no use nodes`);
    const ids=new Set(plan.useNodes.map((q)=>q.id));
    assert.equal(ids.size,plan.useNodes.length,`${biome} has duplicate use-node ids`);
    const nodes=new Map(plan.useNodes.map((q)=>[q.id,q]));
    for(const row of plan.roster){
      assert.ok(row.agenda.length,`${row.id} has no executable agenda`);
      for(const entry of row.agenda)if(entry.targetId){
        assert.ok(ids.has(entry.targetId),`${row.id} targets missing ${entry.targetId}`);
        const node=nodes.get(entry.targetId);
        assert.ok(actionSiteAffinity(row.profileId,entry.action,
          gen.lifeSiteAt(node.x,node.y))>=0,
          `${row.id} cannot perform ${entry.action} at ${entry.targetId}`);
      }
    }
  }
});
