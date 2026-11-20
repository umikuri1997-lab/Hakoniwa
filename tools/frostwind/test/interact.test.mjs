import assert from 'node:assert/strict';
import test from 'node:test';

import { ACTOR } from '../src/fauna.js';
import { LifeRuntime } from '../src/life-runtime.js';
import { LifeSession } from '../src/life-session.js';
import { Scene } from '../src/scene.js';
import { makeWorldGen } from '../src/worldgen.js';

const OPT={biome:'desert',lake:0.30,density:0.50};

/* A scene with a real generator and a real life runtime, and none of the GPU
   halves of build(): the mount is a world fact, so a baked atlas proves
   nothing about it. */
function desertFixture(seed=23){
  const session=new LifeSession(seed);
  const gen=makeWorldGen(seed,OPT);
  const scene=new Scene({W:320,H:180,time:0},seed,OPT,'desert',session);
  scene.gen=gen;
  scene.lifeRuntime=new LifeRuntime(session,gen,'desert');
  scene.chunks=new Map();
  scene.portals=[];
  scene.dir=0;scene.faceLeft=false;scene.gait=0;scene.moving=false;
  scene.locomotionState='idle';
  scene.mount=null;scene.interactHit=null;

  const record=scene.lifeRuntime.records().find((q)=>q.profileId==='camel');
  assert.ok(record,'the Amber Waste placed no camel cohort');
  const position=scene.lifeRuntime.positionAt(record);
  scene.px=position.x;scene.py=position.y;
  scene.lastPX=scene.px;scene.lastPY=scene.py;
  scene.actors=scene.lifeRuntime.reconcile(scene.px,scene.py,320,180);
  const camel=scene.actors.find((q)=>q.key==='camel');
  assert.ok(camel,'no camel body materialized beside the traveller');
  scene.px=camel.x;scene.py=camel.y;
  return {scene,life:scene.lifeRuntime,record,camel};
}

test('the traveller arrives on foot in every world',()=>{
  const {scene}=desertFixture();
  assert.equal(scene.camelMounted(),false);
  assert.equal(scene.mount,null);
});

test('a camel is offered within reach of the animal and not beyond it',()=>{
  const {scene,camel}=desertFixture();
  assert.equal(scene.interactTarget(),camel);

  const reach=scene.interactReach();
  assert.ok(reach>ACTOR.camel.solidRadius,
    'the offer is not wider than the body it is offering');

  /* One animal for the boundary, because the rest of the herd is standing
     within a few pixels of it and would answer for it. */
  scene.actors=[camel];
  scene.px=camel.x+reach-1;scene.py=camel.y;
  assert.equal(scene.interactTarget(),camel,'an arm from the barrel was refused');
  scene.px=camel.x+reach+1;
  assert.equal(scene.interactTarget(),null,'a camel was offered out of reach');

  /* Screen rows are foreshortened by half, so the same world distance up the
     screen must be inside the circle when the sideways one is outside it. */
  scene.px=camel.x;scene.py=camel.y+reach-1;
  assert.equal(scene.interactTarget(),null,
    'the row difference was compared without the projection');
  scene.py=camel.y+reach/2-1;
  assert.equal(scene.interactTarget(),camel,
    'foreshortened rows put the animal further away than it is');
});

test('the nearest animal in a herd is the one offered',()=>{
  const {scene}=desertFixture();
  const herd=scene.actors.filter((q)=>q.key==='camel');
  assert.ok(herd.length>1,'the fixture herd is a single animal');
  const nearest=herd.reduce((a,b)=>
    Math.hypot(a.x-scene.px,(a.y-scene.py)*1.9)<=
    Math.hypot(b.x-scene.px,(b.y-scene.py)*1.9)?a:b);
  assert.equal(scene.interactTarget(),nearest);
});

test('the prompt names the verb the scene is offering',()=>{
  const {scene}=desertFixture();
  scene.interactHit=null;
  assert.equal(scene.promptLabel(),null);
  scene.interactHit=scene.interactTarget();
  assert.equal(scene.promptLabel(),'ride');
  scene.interact();
  assert.equal(scene.promptLabel(),'dismount');
});

test('mounting takes the animal out of the herd and dismounting returns it',()=>{
  const {scene,life,camel}=desertFixture();
  const before=scene.actors.length;

  assert.equal(scene.interact(),true);
  assert.equal(scene.camelMounted(),true);
  assert.equal(scene.mount,camel,'a copy was ridden instead of the animal');
  assert.equal(scene.actors.length,before-1);
  assert.ok(!scene.actors.includes(camel),'the ridden camel stayed in the herd');
  assert.deepEqual(scene.travellerSpeed(),
    {walk:ACTOR.camel.speed,run:ACTOR.camel.runSpeed});
  assert.equal(scene.interactTarget(),null,'a mounted traveller was offered a mount');

  const seatX=scene.px,seatY=scene.py;
  assert.equal(scene.interact(),true);
  assert.equal(scene.camelMounted(),false);
  assert.equal(scene.mount,null);
  assert.ok(scene.actors.includes(camel),'the camel did not come back');
  assert.equal(life.actorList().filter((q)=>q.id===camel.id).length,1);
  assert.equal(camel.x,seatX,'the camel did not keep the ground the pair stood on');
  assert.equal(camel.y,seatY);
  assert.ok(Math.hypot(scene.px-seatX,scene.py-seatY)>0,
    'he dismounted into the animal');
});

test('streaming does not build a second body for a ridden camel',()=>{
  const {scene,life,camel}=desertFixture();
  scene.interact();

  /* Out past the deactivation radius and back: the record streams out and
     materializes again, and the member under the traveller must not. */
  life.reconcile(scene.px+100000,scene.py+100000,320,180);
  const returned=life.reconcile(scene.px,scene.py,320,180);
  assert.equal(returned.filter((q)=>q.id===camel.id).length,0,
    'the ridden camel was rebuilt in the herd');
  assert.ok(life.detached.has(camel.id));

  life.attach(camel,scene.px,scene.py);
  assert.equal(life.detached.has(camel.id),false);
  assert.equal(life.actorList().filter((q)=>q.id===camel.id).length,1);
});

test('one press is one interaction',()=>{
  const {scene}=desertFixture();
  scene.interactHit=scene.interactTarget();
  scene.step(0.016,{interact:1});
  assert.equal(scene.camelMounted(),true);
  scene.step(0.016,{});
  assert.equal(scene.camelMounted(),true,'a held key dismounted him again');
});
