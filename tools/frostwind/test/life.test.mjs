import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IDENTITY_CLASS, LIFE, LIFE_FIELD_READERS, LIFE_NON_GOALS, RESOURCE_GUILDS,
  activityAt, drivePriority, responseAt, seasonModeAt, validateLifeCatalog,
} from '../src/life.js';

test('the current life roster is schema checked and provenance complete',()=>{
  assert.deepEqual(validateLifeCatalog(),[]);
  for(const id of [
    'roeDeer','boar','squirrel','alligator','heron','turtle',
    'elder','merchant','woodcutter','swampFisher','swampBoatwright','traveller',
    'colossus','strider','pilgrim',
  ])assert.ok(LIFE[id],`${id} is absent from the life authority`);
  for(const row of Object.values(LIFE))
    for(const field of Object.keys(row))
      assert.ok(LIFE_FIELD_READERS[field],`${row.identity.common}.${field} has no executable reader`);
  assert.ok(LIFE_NON_GOALS.includes('population-equations'));
});

test('taxonomic precision and explicit guild boundaries survive compilation',()=>{
  assert.equal(LIFE.roeDeer.identity.taxon,'Capreolus capreolus');
  assert.equal(LIFE.boar.identity.taxon,'Sus scrofa');
  assert.equal(LIFE.squirrel.identity.taxon,'Sciurus vulgaris');
  assert.equal(LIFE.alligator.identity.taxon,'Alligator mississippiensis');
  assert.equal(LIFE.heron.identity.class,IDENTITY_CLASS.guild);
  assert.equal(LIFE.heron.identity.guild,'large-ardeid-wader');
  assert.equal(LIFE.turtle.identity.class,IDENTITY_CLASS.guild);
  assert.ok(LIFE.alligator.nonClaims.includes('17m-biological-home-range'));
});

test('resource relations have an executable world field and supported consumers',()=>{
  for(const [id,row] of Object.entries(RESOURCE_GUILDS)){
    assert.ok(row.field,`${id} has no field`);
    assert.ok(row.supports.length,`${id} has no consumers`);
    for(const consumer of row.supports)
      assert.ok(LIFE[consumer]?.resources.includes(id),
        `${id} declares ${consumer}, but the profile does not read it`);
  }
});

test('activity is circular and fear uses separate enter and clear thresholds',()=>{
  assert.equal(activityAt('traveller',0),1);
  assert.equal(activityAt('traveller',1439),1);
  assert.ok(activityAt('boar',0)>activityAt('boar',720));
  const deer=LIFE.roeDeer;
  assert.equal(responseAt(deer,'fear',deer.fear.enter,false),true);
  assert.equal(responseAt(deer,'fear',deer.fear.clear,true),false);
  assert.equal(responseAt(deer,'fear',(deer.fear.enter+deer.fear.clear)/2,true),true);
  assert.notDeepEqual(deer.fear,deer.aggression);
});

test('ordered drives and declared seasonal modes are executable',()=>{
  assert.ok(drivePriority('roeDeer','browse')>drivePriority('roeDeer','travel'));
  assert.ok(drivePriority('swampBoatwright','repair-boardwalk')>0);
  assert.equal(seasonModeAt('roeDeer',172),'solitary-buck');
  assert.equal(seasonModeAt('alligator',172),'forage-and-bask');
  assert.equal(seasonModeAt('alligator',20),'refuge-and-bask');
  assert.equal(seasonModeAt('colossus',172),'curvature-heart-route-tradition');
});
