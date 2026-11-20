import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CULTURE_PACKAGES, FASHION_VOCAB, IDENTITY_DRESS, PRACTICE_DRESS, PROJECTS,
  RESIDENTS,
  activeSchedule, compileCulturePlan, fashionFor, projectAction,
  validateCulture,
} from '../src/culture.js';
import { LifeSession } from '../src/life-session.js';
import { makeWorldGen } from '../src/worldgen.js';

const FROSTWOOD_RESIDENTS=[
  'elder','merchant','woodcutter','wayfarer','graveWatcher','fruitBearer',
  'headphones','thickDude','bookDude','axeman','leader','featherHat',
  'spearGuard','bearKid',
];
/* the wayfarer is not one of them: he is the second folk body, in the village
   for the road rather than for a household or a work role */
const TOWNFOLK=FROSTWOOD_RESIDENTS.slice(4);

/* EVERY WORLD'S RANGE IS WEATHER FIRST. The check is that a seeded row can
   only ever land inside the vocabulary its own biome declares, so a winter
   village cannot produce a short unlined coat and a warm swamp cannot produce
   a padded one. */
const WORLD_CAST={
  boreal:TOWNFOLK,
  meadow:['meadowGrower','meadowTender','meadowWeaver'],
  swamp:['swampFisher','swampBoatwright'],
  hollow:['hollowTender','hollowLamplighter','hollowCutter','hollowKeeper'],
};
test('dress is drawn from the vocabulary the biome declares, and nothing else',()=>{
  for(const [world,cast] of Object.entries(WORLD_CAST)){
    const vocab=FASHION_VOCAB[world];
    for(const id of cast){
      const row=fashionFor(id);
      assert.deepEqual(fashionFor(id),row,`${id} dress is not stable`);
      /* IDENTITY_DRESS may pin a value outside the seeded range, and where it
         does that is an authored exception rather than a leak. Everything not
         pinned has to come from the world's own list. */
      const pinned=IDENTITY_DRESS[id]||{};
      const inVocab=(key,field)=>{
        if(field in pinned)return;
        assert.ok(vocab[key].includes(row[field]),
          `${id}.${field} is ${row[field]}, outside ${world}'s ${key}`);
      };
      inVocab('ramps','ramp');
      inVocab('bodyProfiles','bodyProfile');
      inVocab('coatCuts','coatCut');
      inVocab('coatBulks','coatBulk');
      inVocab('hats','hat');
      inVocab('scarves','scarf');
      inVocab('dyeHues','dyeHue');
      assert.ok([-1,0,1].includes(row.staturePx));
      assert.ok([1,2].includes(row.sleeveWidth));
      assert.ok(['small','tall','block'].includes(row.handShape));
      /* a shoulder is always stepped: 0 is not in the vocabulary, because a
         coat drawn at its chest width from the shoulder row down is a box */
      assert.ok([1,2].includes(row.shoulderDrop),
        `shoulderDrop ${row.shoulderDrop} would square the upper body`);
      assert.ok([0,1,2].includes(row.hemRoundRows));
      assert.ok([-1,0,1].includes(row.planeSplit));
      assert.ok(['plain','ordered'].includes(row.clothPattern));
      /* a brow band with no hat under it is resolved before it reaches the
         raster, so this can only fail if that resolution was removed */
      if(row.dyePlace==='hat-band')
        assert.ok(row.hat&&row.hat!=='none',`${id} bands a bare head`);
    }
  }
  const rows=TOWNFOLK.map((id)=>fashionFor(id));
  assert.ok(new Set(rows.map((row)=>JSON.stringify(row))).size>=6,
    'the townfolk fashion seed produced fewer than six distinct combinations');
});

/* THE DYED BAND IS THE ONLY LOUD THING A VILLAGER WEARS, and the traveller is
   the only person whose whole coat is dyed. palette.js carries why. */
test('only the traveller wears a dyed mass, and villagers wear a band',()=>{
  for(const [id,ramp] of [['traveller','folkCoat'],['swampTraveller','swampCoat']]){
    const row=fashionFor(id);
    assert.equal(row.ramp,ramp,`${id} lost the hero coat`);
    assert.equal(row.dyePlace,'none',
      `${id} carries a band as well as a dyed mass`);
  }
  /* `trunk` and `timber` are on this list because the meadow borrows them: its
     snap list had no room for a folk fleece and a weathered board is the same
     colour as an undyed wool. What matters is that the mass is a quiet ladder,
     not which file the quiet ladder was declared in. */
  /* `gourWater` is the Hollow's blue fleece, borrowed for the meadow's
     reason: Oklab chroma 0.081 at its loudest rung, under the 0.10 a fleece
     is held to (test/folk-colour.test.mjs). */
  const UNDYED=new Set(['folkWool','folkUmber','folkOat','trunk','timber','gourWater']);
  for(const cast of Object.values(WORLD_CAST))
    for(const id of cast)
      assert.ok(UNDYED.has(fashionFor(id).ramp),
        `${id} wears ${fashionFor(id).ramp} as a mass; only the traveller may`);
  /* and the band is not universal either: a village where everyone bands is a
     village that spent its scarce colour on nothing */
  const banded=TOWNFOLK.filter((id)=>fashionFor(id).dyePlace!=='none');
  assert.ok(banded.length>=4&&banded.length<=TOWNFOLK.length,
    `${banded.length} of ${TOWNFOLK.length} townfolk carry a dyed band`);
});

test('practice dress leaves the STRANDED identity signals intact',()=>{
  const grounded={
    graveWatcher:{outerLayer:'mantle',carriedKit:'hand-lantern'},
    fruitBearer:{outerLayer:'apron',carriedKit:'provision-basket'},
    headphones:{headAccent:'ear-wrap'},
    thickDude:{bodyProfile:'broad',outerLayer:'reinforced'},
    bookDude:{carriedKit:'winter-ledger'},
    axeman:{headAccent:'animal-ears',carriedKit:'wood-axe'},
    leader:{outerLayer:'mantle',closure:'clasp'},
    featherHat:{hat:'brim',headAccent:'feather'},
    /* NO POLE. He observes thresholds and route markers; the spear was a prop
       from a source sheet and never a thing his schedule asked for. */
    spearGuard:{hat:'earflap',carriedKit:null},
    bearKid:{hat:'hood',headAccent:'animal-ears'},
  };
  for(const id of TOWNFOLK){
    const row=fashionFor(id);
    assert.deepEqual(
      Object.fromEntries(Object.keys(grounded[id]).map((key)=>[key,row[key]])),
      grounded[id],`${id} lost its source-authored signal`);
    const practice=RESIDENTS[id].practices.find((key)=>PRACTICE_DRESS[key]);
    assert.equal(row.practice,practice,`${id} dress no longer names its practice`);
    assert.ok(IDENTITY_DRESS[id],`${id} has no authored identity layer`);
  }
});

test('culture authority declares concrete projects, schedules, and non-inferred ties',()=>{
  assert.deepEqual(validateCulture(),[]);
  for(const [id,row] of Object.entries(RESIDENTS)){
    assert.ok(PROJECTS[row.project],`${id} has no concrete project`);
    assert.ok(PROJECTS[row.project].milestones.length>=3);
    assert.ok(row.schedule.length);
  }
  assert.deepEqual(
    CULTURE_PACKAGES['boreal-hearth-market'].conditions,
    CULTURE_PACKAGES['boreal-coppice-counterfactual'].conditions,
    'identical nature fields cannot support distinct authored culture packages',
  );
  assert.notDeepEqual(
    CULTURE_PACKAGES['boreal-hearth-market'].meanings,
    CULTURE_PACKAGES['boreal-coppice-counterfactual'].meanings,
  );
});

test('boreal residents compile against shared semantic use nodes',()=>{
  const gen=makeWorldGen(1977,{biome:'boreal',lake:0.4,density:0.6});
  const plan=compileCulturePlan(gen,'boreal-hearth-market');
  assert.deepEqual(plan.residents.map((q)=>q.id),FROSTWOOD_RESIDENTS);
  const kinds=new Set(plan.nodes.map((q)=>q.kind));
  for(const kind of ['hearth','seat','storage','threshold','stall','woodlot',
                      'splitting-block','fuel-stack','route-marker'])
    assert.ok(kinds.has(kind),`${kind} use node was not compiled`);
  for(const id of TOWNFOLK){
    const resident=plan.residents.find((q)=>q.id===id);
    assert.ok(resident.schedule.some((q)=>q.action==='travel'),`${id} has no travel block`);
    assert.ok(new Set(resident.schedule.map((q)=>q.nodeKind)).size>=3,
      `${id} does not make a town circuit`);
    for(const kind of new Set(resident.schedule.map((q)=>q.nodeKind)))
      assert.ok(resident.nodeBindings[kind]?.length,`${id} cannot bind ${kind}`);
  }
  assert.deepEqual(plan.households[0].members,['elder']);
});

test('swamp work is one declared mutual-repair group without invented kinship',()=>{
  const gen=makeWorldGen(20260727,{biome:'swamp',lake:0.55,density:0.65});
  const plan=compileCulturePlan(gen,'swamp-water-road');
  assert.deepEqual(plan.residents.map((q)=>q.id),
    ['swampFisher','swampBoatwright','swampLakekeeper']);
  /* Three residents, two of whom owe each other repair work. The lakekeeper
     keeps a datum alone; living in the same swamp is not membership. */
  assert.equal(plan.workGroups.length,1);
  assert.deepEqual(plan.workGroups[0].members,['swampFisher','swampBoatwright']);
  assert.ok(plan.workGroups[0].nonClaims.includes('kinship'));
  assert.ok(plan.ties[0].nonClaims.includes('friendship'));
  assert.ok(!plan.residents.find((q)=>q.id==='swampLakekeeper').practices
    .includes('mutual-repair'));
  assert.ok(!plan.nodes.some((q)=>q.kind==='boardwalk'));
  assert.ok(plan.nodes.some((q)=>q.kind==='water-mark'));
});

test('schedule selection is periodic and action-specific',()=>{
  assert.equal(activeSchedule(RESIDENTS.merchant,600).action,'attend-stall');
  assert.equal(activeSchedule(RESIDENTS.merchant,120).action,'rest');
  assert.equal(activeSchedule(RESIDENTS.swampFisher,300).nodeKind,'fish-trap');
});

test('resident duties, projects, place state, and work evidence execute off-screen',()=>{
  const gen=makeWorldGen(20260727,{biome:'swamp',lake:0.55,density:0.65});
  const input=gen.compileLifePlans().residents.find((q)=>q.profileId==='swampBoatwright');
  const session=new LifeSession(20260727,{clock:{dayOfYear:172,minuteOfDay:500}});
  const record=session.addRecord(input);
  session.initializeRecord(record.id);
  assert.equal(record.commitment.action,'inspect-winch');
  assert.equal(projectAction(record.project.id,record.project.index),'inspect-winch');
  session.advanceTo(record.commitment.endsAt);
  assert.equal(record.project.index,1);
  assert.ok(session.traces.some((q)=>q.kind==='winch-state'));
  session.advanceTo(session.clock.minute+120);
  assert.ok(record.project.index>=2,'scheduled repair did not advance the concrete project');
  assert.ok(Object.values(record.placeStates).includes('sound'));
  assert.ok([...session.placeStates.values()].includes('sound'));
  assert.ok(record.workGroupIds.includes('swamp-mutual-repair'));
  assert.ok(record.duties.includes('repair-shared-infrastructure'));
  assert.ok(record.ties.every((q)=>q.nonClaims.includes('kinship')));
});
