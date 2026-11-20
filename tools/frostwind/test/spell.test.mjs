import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorldAtlas } from '../src/atlas.js';
import { observeActor } from '../src/behavior.js';
import { GRAVITY_PX_S2, KICK, kickFor, stepKick } from '../src/kickup.js';
import { LIFE } from '../src/life.js';
import { LifeRuntime } from '../src/life-runtime.js';
import { LifeSession } from '../src/life-session.js';
import {
  BED, CLUMP_TERMINAL_MPS, CROWN, PLANT_FUEL, RAIN_WET, cheneyCuring, cheneyMoisture,
  cheneyWindKmh, crownThresholdKWm, fireAt, flameLengthM, plantCatches,
  preIgnitionKJkg, spreadMps,
} from '../src/matter.js';
import { CAST, travellerFor } from '../src/people.js';
import { PX_PER_M } from '../src/scale.js';
import { SCENES, Scene, sceneRamps } from '../src/scene.js';
import { SPRITE_FS } from '../src/shaders/sprite.js';
import { W_GROUND_FS, W_WATER_FS } from '../src/shaders/world.js';
import {
  CHAR, FLAME, FLAME_SHAPES, MARK_CHAR, MARK_MAX, MOTE_MAX, SPELLS, SPELL_ORDER,
  TREMOR_CREST_PX, TREMOR_FOOT_AMP_M, TREMOR_LAUNCH_PX, TREMOR_LIFTOFF_M,
  TREMOR_SHED_PX, TREMOR_SPEED_PX, TREMOR_WAVE_S, WIND_GX, WIND_GY,
  burnArrivalS, burnRadiusPx, burnRunPx, burntAt, castSpell, createSpellState,
  emberGlints, emitMarks, flameSize, flameTongues, frostRadiusPx, frozenAt,
  holdIce, hotAt, markUniforms, propFx, pruneMarks, squallFall, stepMotes,
  tremorAmpM, tremorLaunchM, tremorRingPx, wetAt, windMps,
} from '../src/spell.js';
import { KINDS } from '../src/species.js';
import { FROST, GLOW } from '../src/sprite.js';
import { SURF, SURFACE } from '../src/surface.js';
import { GRAVITY_M_S2, RAIN, SAND } from '../src/weather.js';
import { makeWorldGen } from '../src/worldgen.js';

const near=(a,b,tol,message)=>assert.ok(Math.abs(a-b)<=tol,`${message}: ${a} against ${b}`);
const HERE={x:0,y:0,hx:1,hy:0};
const vec=()=>({x:0,y:0,z:0,w:0,set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;}});
const rows=()=>Array.from({length:MARK_MAX},vec);
/* What a cast is told about one uniform surface. 9 m/s is the control's 1.0. */
const on=(flag,over={})=>({flagAt:()=>flag,windMps:9,...over});
/* A world of one surface and a given list of plants. */
const worldOf=(flag,plants=[],snowy=false)=>({
  flagAt:()=>flag,props:()=>plants,coat:{ramp:'folkCoat'},snowy,wind:0,
});

test('a spell is a row: a slot, a medium and the impulse it puts in',()=>{
  assert.deepEqual(SPELL_ORDER.map((id)=>SPELLS[id].slot),[1,2,3,4]);
  assert.deepEqual(new Set(SPELL_ORDER.map((id)=>SPELLS[id].medium)).size,4,
    'two spells share a medium');
  for(const id of SPELL_ORDER){
    const row=SPELLS[id];
    for(const field of ['label','medium','impulse','cooldownS','noise'])
      assert.ok(row[field]!==undefined,`${id} states no ${field}`);
  }
});

test('a tremor throws loose ground inside its liftoff radius, and nothing else',()=>{
  const run=(flag)=>{
    const state=createSpellState(),pool=[];
    castSpell(state,'tremor',HERE,0);
    for(let t=1/60;t<1;t+=1/60)emitMarks(state,pool,t,1/60,worldOf(flag));
    return pool.filter((p)=>!p.glow);
  };
  const snow=run(SURF.snow);
  assert.ok(snow.length>20,`a tremor over snow threw ${snow.length} grains`);
  assert.ok(snow.every((p)=>p.ramp==='snow'),'thrown ground left its own ramp');
  assert.ok(snow.every((p)=>Math.hypot(p.x,p.y*2)<=TREMOR_LAUNCH_PX+4),
    'a grain left the ground where a*omega^2 is under g');
  assert.equal(run(SURF.hamada).length,0,'desert pavement gave the wave loose material');
  assert.equal(run(SURF.sward).length,0,'a sward gave the wave loose material');
  assert.ok(kickFor(SURF.snow)&&!kickFor(SURF.sward));
});

test('the tremor spreads, damps, and lifts grains where a*omega^2 passes g',()=>{
  const T=SPELLS.tremor,omega=2*Math.PI*T.hz;
  near(tremorAmpM(T.footM),TREMOR_FOOT_AMP_M,1e-12,'amplitude at the foot');
  near(tremorLaunchM(T.footM),T.launchM,1e-9,'the authored launch height at the foot');
  near(tremorAmpM(TREMOR_LAUNCH_PX/PX_PER_M)*omega*omega,GRAVITY_M_S2,1e-6,
    'liftoff radius');
  near(TREMOR_LIFTOFF_M,GRAVITY_M_S2/(omega*omega),1e-12,'liftoff amplitude');
  /* Bornitz: geometric spreading times material damping */
  const a=tremorAmpM(2),b=tremorAmpM(4);
  near(b/a,Math.sqrt(2/4)*Math.exp(-T.dampPerM*2),1e-9,'spreading and damping');
  assert.ok(TREMOR_LAUNCH_PX<TREMOR_SHED_PX&&TREMOR_SHED_PX<TREMOR_CREST_PX,
    'a crown must shed further out than a grain lifts, inside the drawn ring');
  assert.ok(TREMOR_CREST_PX<160,'the ring leaves a 320 px frame');
  near(tremorRingPx(1)-tremorRingPx(0),T.speedMps*PX_PER_M,1e-9,'ring speed');
});

test('a full mark table keeps the plate he stands on',()=>{
  const state=createSpellState();
  const env={flagAt:(x)=>(x<1000?SURF.sward:SURF.water),rain:false,snow:false,windMps:0};
  let now=0;
  for(let i=0;i<MARK_MAX-1;i++){
    state.ready={};
    castSpell(state,'kindle',{x:100+i*120,y:500,hx:-1,hy:0},now,env);
    now+=3.1;
  }
  state.ready={};
  castSpell(state,'frost',{x:995,y:500,hx:1,hy:0},now,env);
  for(let t=0;t<4;t+=0.05){ now+=0.05; holdIce(state,1030,500,now); pruneMarks(state,now); }
  assert.equal(state.marks.length,MARK_MAX,'the table is not full');
  assert.ok(frozenAt(state,1030,500,now),'no plate to stand on');
  state.ready={};
  castSpell(state,'squall',{x:1030,y:500,hx:1,hy:0},now,env);
  assert.equal(state.marks.length,MARK_MAX,'the table grew past its bound');
  assert.ok(frozenAt(state,1030,500,now),'the loaded plate was dropped');
});

test('the mark table holds MARK_MAX rows and drops the one nearest its end',()=>{
  const state=createSpellState();
  castSpell(state,'kindle',HERE,0);
  for(let i=0;i<MARK_MAX-1;i++){
    state.ready={};
    castSpell(state,'frost',{...HERE,x:i*500},1+i);
  }
  assert.equal(state.marks.length,MARK_MAX);
  state.ready={};
  castSpell(state,'tremor',HERE,20);
  assert.equal(state.marks.length,MARK_MAX,'the table grew past its bound');
  assert.ok(state.marks.some((m)=>m.spell==='kindle'),
    'the longest-lived mark was dropped first');
  assert.ok(!state.marks.some((m)=>m.spell==='frost'&&m.at===1),
    'the mark nearest its end survived');
  pruneMarks(state,1e6);
  assert.equal(state.marks.length,0);
});

test('a cast waits out its own cooldown and no other',()=>{
  const state=createSpellState();
  assert.ok(castSpell(state,'frost',HERE,0).mark);
  assert.equal(castSpell(state,'frost',HERE,0.5).refused,'cooldown');
  assert.ok(castSpell(state,'tremor',HERE,0.5).mark,'one spell locked another');
  assert.ok(castSpell(state,'frost',HERE,SPELLS.frost.cooldownS+0.01).mark);
});

test('position is the identity: the marks alone answer for every plant',()=>{
  const state=createSpellState();
  castSpell(state,'tremor',{...HERE,x:30},0,{snow:true});
  castSpell(state,'kindle',{...HERE,x:-80},0);
  castSpell(state,'squall',{...HERE,x:40},1,{snow:true});
  /* a second copy of the rows, as a snapshot or a replay would hold them */
  const replay={...createSpellState(),marks:JSON.parse(JSON.stringify(state.marks))};
  const read=(s,x,y,now)=>{const f=propFx(s,now,x,y,4,true);return [f.bend,f.bare,f.char];};
  let moved=0;
  for(const now of [0.3,0.6,2,30])
  for(let y=-40;y<=40;y+=8)for(let x=-140;x<=180;x+=8){
    const a=read(state,x,y,now);
    /* asked twice, in another order, and of the copy */
    assert.deepEqual(read(replay,x,y,now),a,`the copy disagrees at ${x},${y}`);
    read(state,-x,-y,now);
    assert.deepEqual(read(state,x,y,now),a,`asking moved the answer at ${x},${y}`);
    if(a[0]||a[1]||a[2])moved++;
  }
  assert.ok(moved>40,`three marks touched ${moved} of the sampled positions`);
});

test('a crown leans as the crest passes under it and stands again after',()=>{
  const T=SPELLS.tremor,state=createSpellState();
  castSpell(state,'tremor',HERE,0);
  const d=TREMOR_SHED_PX-10,arrive=(d-T.footM*PX_PER_M)/TREMOR_SPEED_PX;
  assert.equal(propFx(state,arrive-0.01,d,0).bend,0,'it leant before the crest reached it');
  assert.equal(propFx(state,arrive+0.01,d,0).bend,1,'a crown leans away from the foot');
  assert.equal(propFx(state,arrive+0.01,-d,0).bend,-1,'a crown leans away from the foot');
  assert.equal(propFx(state,arrive+T.swayS+0.02,d,0).bend,0,'it stayed over');
  assert.equal(propFx(state,1,TREMOR_SHED_PX+6,0).bend,0,'a crown leant where no branch sheds');
});

test('a tremor bares laden crowns inside the shed radius, and only under snow',()=>{
  const state=createSpellState();
  castSpell(state,'tremor',HERE,0,{snow:true});
  const inside=TREMOR_SHED_PX-4,outside=TREMOR_SHED_PX+4;
  assert.equal(propFx(state,0.01,inside,0,0,true).bare,false,'bare before the ring arrived');
  assert.equal(propFx(state,2,inside,0,0,true).bare,true);
  assert.equal(propFx(state,2,outside,0,0,true).bare,false);
  assert.equal(propFx(state,2,inside,0,0,false).bare,false,'a crown shed snow it does not carry');
  /* the crossing is the event: each tall plant sheds once */
  const plants=[{x:40,y:0,w:24,h:40,plant:true},{x:60,y:10,w:9,h:10,plant:true}];
  const pool=[],world=worldOf(SURF.stone,plants,true);
  for(let t=1/60;t<1.2;t+=1/60) emitMarks(state,pool,t,1/60,world);
  const clumps=pool.filter((p)=>p.heavy);
  assert.equal(clumps.length,12,`the spruce dropped ${clumps.length} clumps`);
  assert.ok(clumps.every((p)=>p.ramp==='snow'&&p.peak>=40*0.35),
    'snow fell from below the crown');
  assert.ok(SPELLS.tremor.holdS>TREMOR_WAVE_S,'the bare hold ends before the wave does');
});

test('a frost plate grows from its centre, holds, and thaws from its rim',()=>{
  const F=SPELLS.frost,state=createSpellState();
  const {mark}=castSpell(state,'frost',HERE,0);
  near(mark.x,F.aheadM*PX_PER_M,1e-9,'the plate sits ahead of the caster');
  const grown=mark.r/(F.frontMps*PX_PER_M);
  assert.equal(frostRadiusPx(mark,0),0);
  near(frostRadiusPx(mark,grown/2),mark.r/2,1e-9,'the freeze front');
  assert.equal(frozenAt(state,mark.x+mark.r-1,0,grown/2),false,'the rim froze first');
  assert.equal(frozenAt(state,mark.x+mark.r-1,0,grown+1),true);
  /* a circle on the ground is an ellipse on the screen */
  assert.equal(frozenAt(state,mark.x,mark.r/2-1,grown+1),true);
  assert.equal(frozenAt(state,mark.x,mark.r/2+1,grown+1),false);
  const thaw=mark.endAt+F.thawS/2;
  near(frostRadiusPx(mark,thaw),mark.r/2,1e-9,'the thaw front');
  assert.equal(frozenAt(state,mark.x,0,thaw),true,'the centre thawed before the rim');
  assert.equal(frozenAt(state,mark.x+mark.r-1,0,thaw),false);
  assert.equal(frostRadiusPx(mark,mark.endAt+F.thawS),0);
});

test('ice under load holds',()=>{
  const state=createSpellState();
  const {mark}=castSpell(state,'frost',HERE,0);
  const end=mark.endAt;
  for(let t=1;t<end+10;t+=0.25) holdIce(state,mark.x,0,t);
  assert.ok(frozenAt(state,mark.x,0,end+9.9),'the plate thawed under him');
  near(frostRadiusPx(mark,end+9.9),mark.r,1e-9,'the rim started to thaw under load');
  assert.ok(mark.endAt<=end+10+SPELLS.frost.loadS,'the hold outlasts its load by more than loadS');
});

test('heat, cold and shock answer each other',()=>{
  const fire=createSpellState();
  const {mark:burn}=castSpell(fire,'kindle',HERE,0);
  const at=1.5,front=burnRadiusPx(burn,at);
  castSpell(fire,'frost',HERE,at);
  assert.equal(burn.flameEnd,at,'a frost cast left the flames burning');
  near(burnRadiusPx(burn,at+10),front,1e-9,'a quenched fire kept spreading');

  const ice=createSpellState();
  const {mark:plate}=castSpell(ice,'frost',HERE,0);
  castSpell(ice,'kindle',HERE,3);
  assert.equal(plate.endAt,3,'a fire on a plate did not start its thaw');

  const shock=createSpellState();
  const {mark:far}=castSpell(shock,'frost',{...HERE,x:200},0);
  castSpell(shock,'tremor',HERE,3);
  near(far.endAt,3+far.x/(SPELLS.tremor.speedMps*PX_PER_M),1e-9,
    'the ice breaks when the shock reaches it');
});

test('a fire refuses open water and stops where its heat does',()=>{
  const K=SPELLS.kindle;
  const wet=castSpell(createSpellState(),'kindle',HERE,0,on(SURF.pond));
  assert.equal(wet.refused,'wet');
  assert.equal(wet.flag,SURF.pond,'the refusal does not say which water');
  const dry=castSpell(createSpellState(),'kindle',HERE,0,on(SURF.sward,{windMps:0})).mark;
  near(dry.r,K.radiusM*PX_PER_M,1e-9,'the disc one impulse lights in dry sward');
  near(burnRadiusPx(dry,1),K.frontMps*PX_PER_M,1e-9,'the ignition front');
  near(burnRadiusPx(dry,30),dry.r,1e-9,'the fire passed its heated radius');
  assert.equal(burnRadiusPx(dry,dry.endAt+K.healS),0,'the char never closed');
  const fx=(now,x)=>propFx({marks:[dry]},now,dry.x+x,0);
  assert.equal(fx(0.5,dry.r-2).char,false,'a plant charred before the front reached it');
  assert.equal(fx(30,dry.r-2).char,true);
  assert.equal(fx(30,dry.r+2).char,false);
});

test('the fire laws are the cited ones',()=>{
  near(cheneyWindKmh(5),1.4,0.002,'the two wind branches meet at 5 km/h');
  near(cheneyMoisture(6,20),Math.exp(-0.648),1e-12,'moisture damping at 6%');
  assert.equal(cheneyMoisture(30,20),0,'grass at 30% moisture carried a fire');
  near(cheneyCuring(100),1,0.01,'a fully cured sward');
  assert.ok(cheneyCuring(60)<0.1,'a green sward spread a fire');
  near(preIgnitionKJkg(0),581,1e-9,'heat of pre-ignition, dry');
  near(flameLengthM(150),0.0775*Math.pow(150,0.46),1e-12,'Byram flame length');
  near(crownThresholdKWm(0.6,100),Math.pow(0.006*3050,1.5),1e-9,'Van Wagner threshold');
  /* a table nothing reads is a comment: every kind and every bed resolves */
  for(const kind of KINDS)
    assert.ok(CROWN[PLANT_FUEL[kind]],`${kind} names no crown class`);
  for(const row of SURFACE)
    if(row.fuel)assert.ok(BED[row.fuel],`${row.name} names no bed`);
  assert.equal(SURFACE[SURF.sward].fuel,'sward');
  assert.equal(SURFACE[SURF.peat].fuel,'peat');
  near(windMps(1),SAND.refWindMps,1e-12,'the control and the 10 m wind');
});

test('a fire burns as wet and as windy as its bed',()=>{
  const K=SPELLS.kindle;
  const light=(env)=>castSpell(createSpellState(),'kindle',HERE,0,env).mark;
  const meadow=light(on(SURF.sward)),calm=light(on(SURF.sward,{windMps:0}));
  const swamp=light(on(SURF.peat,{rain:true})),snow=light(on(SURF.snow));
  const sand=light(on(SURF.sand));
  /* the swamp: a smaller disc, no run, a flash, a weaker flame */
  assert.ok(swamp.r<0.45*meadow.r,`peat lit ${(swamp.r/meadow.r).toFixed(2)} of the sward disc`);
  assert.equal(swamp.damp,0,'saturated peat carries a fire');
  assert.equal(swamp.runMax,0);
  assert.equal(swamp.flameS,K.flashS);
  assert.ok(swamp.flameEnd<meadow.flameEnd-3,'the swamp burnt as long as the meadow');
  assert.ok(flameSize(swamp.kWm)<flameSize(calm.kWm)&&flameSize(calm.kWm)<flameSize(meadow.kWm),
    'flame height does not follow the bed and the wind');
  /* rain on the meadow costs it reach and its run */
  const rained=light(on(SURF.sward,{rain:true}));
  assert.ok(rained.r<meadow.r&&rained.runMax===0,'rain left the sward burning');
  /* the wind carries the meadow fire, and only downwind */
  near(meadow.runPx,spreadMps(BED.sward,9)*PX_PER_M,1e-9,'the head fire rate');
  assert.ok(meadow.runMax>20,`the head ran ${meadow.runMax.toFixed(1)} px`);
  assert.ok(calm.runMax<2,`still air ran the fire ${calm.runMax.toFixed(1)} px`);
  const late=meadow.flameEnd-0.1,reach=meadow.r+meadow.runMax-2;
  const down=[meadow.x+WIND_GX*reach,meadow.y+WIND_GY*reach/2];
  const up=[meadow.x-WIND_GX*reach,meadow.y-WIND_GY*reach/2];
  assert.equal(burntAt(meadow,late,...down),true,'the head did not reach downwind');
  assert.equal(burntAt(meadow,late,...up),false,'the fire backed into the wind');
  assert.equal(burntAt(meadow,1,...down),false,'the head arrived at once');
  near(burnRunPx(meadow,1),meadow.runPx,1e-9,'the run after one second');
  assert.ok(burnArrivalS(meadow,...down)>burnArrivalS(meadow,meadow.x,meadow.y));
  assert.equal(burnArrivalS(meadow,...up),Infinity);
  /* snow costs its melt, and bare sand costs nothing and burns nothing */
  assert.ok(snow.r<meadow.r&&snow.r>swamp.r);
  near(sand.r,meadow.r,1e-9,'bare ground');
  assert.equal(sand.bed,null);
  /* the run ends at the first break in the bed */
  const broken=light({windMps:9,flagAt:(x,y)=>
    (x-meadow.x)*WIND_GX+(y-meadow.y)*2*WIND_GY<12?SURF.sward:SURF.stone});
  assert.ok(broken.runMax<=12,`the fire crossed a path: ${broken.runMax}`);
});

test('a crown catches where the fire under it passes its threshold',()=>{
  const fire=(flag,over)=>{
    const f=fireAt(SURFACE[flag],{windMps:9,...over});
    return [Math.max(SPELLS.kindle.impulseKWm*f.share,f.headKWm),f.damp];
  };
  const meadow=fire(SURF.sward),calm=fire(SURF.sward,{windMps:0});
  const swamp=fire(SURF.peat,{rain:true}),snow=fire(SURF.snow),sand=fire(SURF.sand);
  assert.equal(plantCatches('meadowTree',...meadow),true,'a wind-driven grass fire spared the tree');
  assert.equal(plantCatches('meadowTree',...calm),false,'the impulse alone crowned a broadleaf');
  for(const kind of ['sward','shrub','palm'])
    assert.equal(plantCatches(kind,...calm),true,`${kind} did not burn in the meadow`);
  for(const kind of ['cypress','tupelo','stranglerFig','buttonbush','pickerel','sedge','swampRose'])
    assert.equal(plantCatches(kind,...swamp),false,`${kind} burnt in the swamp`);
  assert.equal(plantCatches('spruce',...snow),true,'a conifer did not torch');
  assert.equal(plantCatches('birch',...snow),false,'a leafless crown carried a fire');
  assert.equal(plantCatches('bramble',...snow),true);
  assert.equal(plantCatches('duneGrass',...sand),true);
  assert.equal(plantCatches('datePalm',...sand),true,'a frond skirt did not catch');
  assert.equal(plantCatches('acacia',...sand),false,'bare sand crowned an acacia');
  /* a mark carries that answer to the plant */
  const state=createSpellState();
  const {mark}=castSpell(state,'kindle',HERE,0,on(SURF.peat,{rain:true}));
  assert.equal(propFx(state,3,mark.x,mark.y,0,false,'buttonbush').char,false);
  assert.equal(propFx(state,3,mark.x,mark.y,0,false,'snag').char,true,'dead wood stayed whole');
  /* heat clears a laden crown it cannot light */
  const cold=createSpellState();
  const lit=castSpell(cold,'kindle',HERE,0,on(SURF.snow)).mark;
  const birch=propFx(cold,3,lit.x,lit.y,0,true,'birch');
  assert.deepEqual([birch.bare,birch.char],[true,false]);
});

test('heat opens ice: a plate, a shelf, and the walk across them',()=>{
  const K=SPELLS.kindle,state=createSpellState();
  const {mark:plate}=castSpell(state,'frost',HERE,0,on(SURF.pond));
  const {mark:melt}=castSpell(state,'kindle',HERE,3,on(SURF.pond));
  assert.equal(melt.melt,true,'heat on a plate lit a fire');
  near(melt.r,K.meltM*PX_PER_M,1e-9,'the hole');
  assert.equal(frozenAt(state,melt.x+10,melt.y,3.1),true,'the hole opened at once');
  assert.equal(frozenAt(state,melt.x+10,melt.y,7),false,'the plate held over the heat');
  assert.equal(hotAt(state,melt.x,melt.y,4),true);
  assert.equal(frozenAt(state,plate.x-20,plate.y,4),true,'the heat opened the whole plate');
  assert.equal(flameTongues(state,4,worldOf(SURF.pond)).length,0,'ice burned');
  /* A plate held under load keeps its hole: nothing freezes it over. */
  for(let t=4;t<40;t+=0.25) holdIce(state,plate.x-20,plate.y,t);
  assert.equal(frozenAt(state,plate.x-20,plate.y,40),true,'the fixture lost its plate');
  assert.equal(frozenAt(state,melt.x+10,melt.y,40),false,'the hole froze over again');
  /* the hole holds as a char does, then closes from its rim */
  assert.ok(melt.endAt>=3+K.holdS);
  assert.ok(burnRadiusPx(melt,melt.endAt+K.healS/2)<melt.r);
  assert.equal(hotAt(state,melt.x,melt.y,melt.hotEnd+0.01),false);
  /* steam is the water, on the water's ramp */
  const pool=[];
  for(let t=3;t<6;t+=1/60) emitMarks(state,pool,t,1/60,worldOf(SURF.pond));
  assert.ok(pool.some((p)=>p.ramp===SURFACE[SURF.pond].ramp&&!p.glow),'the melt gave no steam');
  /* the lake's own shelf opens too */
  const shelf=castSpell(createSpellState(),'kindle',HERE,0,on(SURF.shelf));
  assert.equal(shelf.mark?.melt,true,'heat on shelf ice was refused or lit');
  assert.equal(SURFACE[SURF.shelf].heat,'thaw');
  /* the shader is told which marks are hot and which keep a rim */
  const A=rows(),B=rows();
  state.ready={};
  const fire=castSpell(state,'kindle',{...HERE,x:600},3,on(SURF.sward)).mark;
  markUniforms(state,5,A,B);
  const row=(m)=>B[A.findIndex((v)=>v.x===m.x&&v.z===3)];
  assert.deepEqual([row(melt).z,row(melt).w],[1,0],'a melt draws a rim or is cold');
  assert.deepEqual([row(fire).z,row(fire).w],[1,1]);
  near(Math.hypot(row(fire).x,row(fire).y),burnRunPx(fire,5),1e-9,'the run reaches the shader');
  assert.ok(W_GROUND_FS.includes('markHot(wp)'),'the ground pass does not open shelf ice');
  assert.ok(W_WATER_FS.includes('markHeat('),'the water pass does not open a plate');
  /* cold closes what heat opened */
  state.ready={};
  castSpell(state,'frost',HERE,46,on(SURF.pond));
  assert.equal(melt.hotEnd,46,'a second frost left the hole open');
  assert.equal(frozenAt(state,melt.x,melt.y,48),true);
});

test('snow leaves a crown as clumps: fast, heavy, straight down',()=>{
  const state=createSpellState();
  castSpell(state,'tremor',HERE,0,{snow:true});
  const tree={x:40,y:0,w:24,h:60,plant:true};
  const pool=[],world=worldOf(SURF.stone,[tree],true);
  let t=0;
  while(!pool.some((p)=>p.heavy)){t+=1/60;emitMarks(state,pool,t,1/60,world);}
  const clumps=pool.filter((p)=>p.heavy),veil=pool.filter((p)=>!p.heavy&&p.ramp==='snow');
  assert.ok(veil.length>0&&veil.length<clumps.length,'the veil outweighs the clumps');
  for(const p of clumps){
    assert.equal(p.g,GRAVITY_PX_S2,'a clump does not fall under gravity');
    assert.deepEqual([p.flutter,p.drift,p.vz],[0,0,0],'a clump flutters, drifts or is thrown');
    assert.equal(p.size,2);
    near(p.life,Math.sqrt(2*p.z/GRAVITY_PX_S2),1e-9,'free fall from its bough');
    assert.ok(p.wait>=0&&p.wait<=0.3,'the cascade runs top down inside 0.3 s');
  }
  /* the terminal speed is out of reach from any crown */
  assert.ok(CLUMP_TERMINAL_MPS>Math.sqrt(2*GRAVITY_M_S2*6),'a clump reaches terminal in 6 m');
  assert.ok(CLUMP_TERMINAL_MPS>10*KICK.snow.terminalMps,'a clump falls like powder');
  const top=clumps.reduce((a,b)=>(b.z>a.z?b:a)),low=clumps.reduce((a,b)=>(b.z<a.z?b:a));
  assert.ok(top.wait<low.wait,'the lower bough let go first');
  /* it lands inside a second and throws the snow it lands on */
  let landed=0,air=0,puffs=0;
  for(let k=0;k<90;k++){
    const heavy=pool.filter((p)=>p.heavy).length;
    stepMotes(state,pool,1/60,0,worldOf(SURF.snow));
    const now=pool.filter((p)=>p.heavy).length;
    if(now<heavy){landed+=heavy-now;air=k/60;}
    puffs+=pool.filter((p)=>!p.heavy&&p.age===0).length;
  }
  assert.equal(landed,clumps.length,'a clump never landed');
  assert.ok(air<1.5,`the last clump was in the air for ${air.toFixed(2)} s`);
  assert.equal(puffs,landed*3,'a landing threw no snow');
  /* A bare crown has no snow to give: a second shock sheds nothing until
     the first mark has let the snow settle again. */
  const twice=createSpellState(),again=[],stand=worldOf(SURF.stone,[tree],true);
  const shake=(from,to)=>{
    twice.ready={};
    castSpell(twice,'tremor',HERE,from,{snow:true});
    const before=again.filter((p)=>p.heavy).length;
    for(let k=from+1/60;k<to;k+=1/60){ pruneMarks(twice,k); emitMarks(twice,again,k,1/60,stand); }
    return again.filter((p)=>p.heavy).length-before;
  };
  assert.ok(shake(0,2)>0,'the first shock shed nothing');
  assert.equal(shake(3,5),0,'a bare crown shed snow again');
  const settled=3+SPELLS.tremor.holdS+1;
  assert.ok(shake(settled+60,settled+62)>0,'a crown the snow covered again kept it');
});

test('flames are derived: a band behind the front, small and coherent',()=>{
  const K=SPELLS.kindle,state=createSpellState();
  const {mark}=castSpell(state,'kindle',HERE,0,on(SURF.sward));
  const shrub={x:mark.x+16,y:mark.y,w:12,h:10,plant:true};
  const tree={x:mark.x-10,y:mark.y+4,w:30,h:44,plant:true};
  const world=worldOf(SURF.sward,[shrub,tree]);
  const reach=burnArrivalS(mark,shrub.x,shrub.y);
  const at=(t)=>flameTongues(state,t,world);
  const onShrub=(t)=>Math.abs(t.x-shrub.x)<6&&t.y===shrub.y+1;
  assert.equal(at(reach-0.2).filter(onShrub).length,0,'the shrub flamed before the front reached it');
  assert.deepEqual(at(reach+0.5),at(reach+0.5),'the same instant drew two fires');
  /* every drawn tongue over the fire's life */
  const all=[];
  for(let t=0.1;t<mark.flameEnd;t+=0.1) all.push(...at(t));
  assert.ok(all.some(onShrub),'the shrub never caught');
  assert.ok(all.some((t)=>t.z>tree.h*0.4),'a tall plant carried no fire up its crown');
  assert.ok(all.some((t)=>t.core)&&all.some((t)=>!t.core));
  for(const t of all){
    assert.ok(Number.isInteger(t.size)&&t.size>=0&&t.size<FLAME_SHAPES.length,`size ${t.size}`);
    assert.ok([-1,0,1].includes(t.lean),`lean ${t.lean}`);
  }
  assert.equal(at(mark.flameEnd+0.01).length,0,'flames outlived the residence time');
  /* small: no tongue stands half the traveller, and each is wider than the
     lattice pitch so neighbours merge */
  for(const [w,h] of FLAME_SHAPES){
    assert.ok(h<=10&&h<=1.5*w,`a ${w}x${h} tongue`);
    assert.ok(w>=FLAME.bedPx-1);
  }
  assert.ok(flameSize(mark.headKWm)>flameSize(mark.flankKWm),'the head burns no taller than the flank');
  /* a band: with the front half way out, the centre has burnt out */
  const calm=createSpellState();
  const ring=castSpell(calm,'kindle',HERE,0,on(SURF.sward,{windMps:0})).mark;
  const mid=ring.r/(K.frontMps*PX_PER_M)*0.9;
  const bed=flameTongues(calm,mid,worldOf(SURF.sward)).filter((t)=>!t.core&&t.z===0);
  assert.ok(bed.length>20,`${bed.length} tongues on the front`);
  const depth=K.frontMps*PX_PER_M*K.flameS;
  assert.ok(bed.every((t)=>Math.hypot(t.x-ring.x,(t.y-ring.y)*2)>=burnRadiusPx(ring,mid)-depth-1),
    'a tongue burns behind the flame zone');
  /* coherent: neighbours on the lattice differ by one size at most, mostly */
  let pairs=0,close=0;
  for(const a of bed)for(const b of bed){
    if(a===b||Math.hypot(a.x-b.x,(a.y-b.y)*2)>FLAME.bedPx*1.5)continue;
    pairs++;if(Math.abs(a.size-b.size)<=1)close++;
  }
  assert.ok(pairs>10&&close>=0.9*pairs,`${close} of ${pairs} neighbours within one size`);
  /* embers glow in the burnt bed and nowhere else */
  const glints=emberGlints(calm,mid,worldOf(SURF.sward));
  assert.ok(glints.length>0,'the burnt bed has no ember');
  assert.ok(glints.every((q)=>burntAt(ring,mid,q.x,q.y)));
  assert.equal(emberGlints(calm,mid,worldOf(SURF.sand)).length,0);
  /* fuel is a property of the surface */
  assert.equal(SURFACE[SURF.sward].heat,'char');
  assert.equal(SURFACE[SURF.snow].heat,'melt');
  assert.equal(SURFACE[SURF.sand].heat,undefined);
  assert.equal(flameTongues(state,2,worldOf(SURF.sand)).length,0,'sand burned');
  /* sparks and smoke stay inside the pool bound */
  const pool=[],thrown=new Set();
  for(let t=1/60;t<mark.flameEnd;t+=1/60){
    emitMarks(state,pool,t,1/60,world);
    for(const p of pool)thrown.add(p.ramp);
    stepKick(pool,1/60,0.5);
    assert.ok(pool.length<=MOTE_MAX);
  }
  assert.ok(thrown.has('folkSignal'),'the fire threw no spark');
  assert.ok(thrown.has(CHAR.ramp),'the fire made no smoke');
});

test('the whole burnt area darkens on a dither that thins as it heals',()=>{
  const K=SPELLS.kindle,state=createSpellState(),A=rows(),B=rows();
  const {mark}=castSpell(state,'kindle',HERE,0,on(SURF.sward,{windMps:0}));
  markUniforms(state,20,A,B);
  assert.equal(B[0].w,1,'the char is thin while it holds');
  markUniforms(state,mark.endAt+K.healS/2,A,B);
  near(B[0].w,0.5,1e-9,'half healed');
  assert.ok(MARK_CHAR>0.5&&MARK_CHAR<1,'the char is a dither, never a flat area');
  assert.ok(W_GROUND_FS.includes('markBayer(wp)'),'the ground pass lost the dither');
});

test('the shader takes radii from the CPU',()=>{
  const state=createSpellState(),A=rows(),B=rows();
  castSpell(state,'tremor',{...HERE,x:10},0);
  castSpell(state,'frost',{...HERE,x:20},0);
  /* clear of the plate: a fire on it would start the thaw */
  castSpell(state,'kindle',{...HERE,x:400},0);
  assert.equal(markUniforms(state,0.3,A,B),3);
  assert.deepEqual(A.slice(0,3).map((v)=>v.z),[1,2,3],'crest, plate, rim');
  near(A[0].w,tremorRingPx(0.3),1e-9,'the crest radius');
  near(A[1].w,frostRadiusPx(state.marks[1],0.3),1e-9,'the plate radius');
  near(A[2].w,burnRadiusPx(state.marks[2],0.3),1e-9,'the rim radius');
  assert.equal(B[0].y,2,'the leading crest is two pixels while it lifts grains');
  assert.equal(B[1].x,1,'a growing plate draws its front');
  assert.ok(A.slice(3).every((v)=>v.z===0),'an unused row draws');
  /* the wave leaves the table; the mark may stay for its hold */
  assert.equal(markUniforms(state,TREMOR_WAVE_S+0.3,A,B),2);
  for(const source of [W_GROUND_FS,W_WATER_FS])
    assert.ok(source.includes(`uniform vec4 uMarkA[${MARK_MAX}]`),
      'a ground pass lost the mark table');
});

test('a spell brings no colour: every world already declares its ramps',()=>{
  for(const id of Object.keys(SCENES)){
    const ramps=sceneRamps(id);
    const coat=CAST[travellerFor(SCENES[id].biome)].ramp;
    for(const ramp of ['folkSignal',CHAR.ramp,coat])
      assert.ok(ramps.includes(ramp),`${id} does not declare ${ramp}`);
    if(SCENES[id].ice)
      assert.ok(ramps.includes(SCENES[id].ice),`${id} names an undeclared ice ramp`);
  }
  assert.equal(SCENES.frostwood.ice,'ice');
  /* emitted light takes no aerial treatment */
  const branch=SPRITE_FS.slice(SPRITE_FS.indexOf('// 14, a spell\'s light'));
  assert.ok(branch.indexOf('return;')<branch.indexOf('else if'),
    'material 14 falls through to the aerial treatment');
});

test('a frost cast shows as falling ice, never as the caster\'s light',()=>{
  const F=SPELLS.frost,state=createSpellState(),pool=[];
  castSpell(state,'frost',HERE,0);
  const seen=[];
  for(let t=1/60;t<F.dustS+1.5;t+=1/60){
    emitMarks(state,pool,t,1/60,worldOf(SURF.pond));
    for(const p of pool)if(!seen.includes(p))seen.push(p);
    stepKick(pool,1/60,0);
    assert.ok(pool.length<=MOTE_MAX/2,`${pool.length} crystals in the air`);
  }
  assert.ok(seen.length>60,`the cast made ${seen.length} crystals`);
  assert.ok(seen.every((p)=>p.frost&&!p.glow),'a frost mote is drawn as light');
  assert.ok(seen.every((p)=>p.vz===0||p.vz<0),'a crystal rose');
  assert.ok(seen.every((p)=>p.terminal===F.crystalMps*PX_PER_M));
  assert.equal(pool.length,0,'crystals still fall after the dust ends');
  assert.ok(SPRITE_FS.includes('// 15, a frost crystal'));
  const atlas=buildWorldAtlas(7,0.55,'meadow');
  assert.ok(atlas.frost[0].every((sp)=>[...sp.occ].every((m)=>m===FROST)));
});

test('a shed crown is the same tree with its snow gone',()=>{
  const atlas=buildWorldAtlas(7,0.55,'boreal');
  const keys=Object.keys(atlas.bare);
  for(const kind of ['spruce','birch'])
    assert.ok(keys.some((k)=>k.startsWith(kind+':')),`no bare ${kind}`);
  for(const key of keys){
    const [kind,ti,v]=key.split(':'),laden=atlas[kind][ti][v],bare=atlas.bare[key];
    assert.deepEqual([bare.w,bare.h,bare.ax,bare.ay],[laden.w,laden.h,laden.ax,laden.ay],
      `${key}: the swap moves the tree`);
    assert.equal(bare.occ.includes(2),false,`${key} still carries snow`);
    let wood=0,same=0,invented=0;
    for(let i=0;i<bare.w*bare.h;i++){
      if(bare.occ[i]===1){
        wood++;
        /* wood is wood the laden tree shows, or wood its snow frosted over */
        if(laden.occ[i]===1)same++;
        else if(!(laden.occ[i]===2&&laden.rad[i]>0))invented++;
      }
    }
    assert.equal(invented,0,`${key}: ${invented} wood pixels the laden tree never had`);
    assert.ok(wood>0&&same>0.5*wood,`${key}: ${same} of ${wood} wood pixels are the laden tree's`);
  }
  /* a crown of leaves is not snow: only a deposit with no ramp of its own */
  const meadow=buildWorldAtlas(7,0.55,'meadow');
  for(const key of Object.keys(meadow.bare)){
    const [kind,ti,v]=key.split(':');
    assert.equal(meadow[kind][ti][v].ramp2,undefined,`${key} lost its leaves`);
  }
  assert.ok(!Object.keys(meadow.bare).some((k)=>/^(meadowTree|palm|shrub):/.test(k)));
});

test('flame tongues and sparks are baked for every world',()=>{
  const atlas=buildWorldAtlas(7,0.55,'meadow');
  assert.equal(atlas.flame[0].length,FLAME_SHAPES.length*3);
  for(const [i,sp] of atlas.flame[0].entries()){
    const [w,h]=FLAME_SHAPES[Math.floor(i/3)];
    assert.equal(sp.h,h);
    assert.ok(sp.w>=w&&sp.w<=w+2);
    const drawn=[...sp.occ].filter(Boolean);
    assert.ok(drawn.every((m)=>m===GLOW),`tongue ${i} is not all light`);
    assert.equal([...sp.occ.subarray(0,sp.w)].filter(Boolean).length,1,
      `tongue ${i} does not end in one pixel`);
    const base=[...sp.occ.subarray((h-1)*sp.w,h*sp.w)].filter(Boolean).length;
    assert.ok(base>=Math.min(w,3),`tongue ${i} stands on ${base} px`);
    if(w>=5)assert.ok(sp.shade.some((v,k)=>sp.occ[k]&&v===1)&&sp.shade.some((v,k)=>sp.occ[k]&&v===0),
      `tongue ${i} lacks a body or a mantle`);
  }
  assert.equal(atlas.spark[0].length,2);
  assert.ok(atlas.spark[0].every((sp)=>[...sp.occ].every((m)=>m===GLOW)));
});

/* A scene with a real desert generator and no GPU: frost is a world fact. */
function oasisScene(seed=23){
  const opt={biome:'desert',lake:0.30,density:0.50};
  const session=new LifeSession(seed),gen=makeWorldGen(seed,opt);
  const scene=new Scene({W:320,H:180,time:0},seed,opt,'desert',session);
  scene.gen=gen;
  scene.lifeRuntime=new LifeRuntime(session,gen,'desert');
  scene.portals=[];scene.actors=[];
  scene.dir=0;scene.faceLeft=false;scene.gait=0;scene.moving=false;
  scene.locomotionState='idle';scene.mount=null;scene.interactHit=null;
  /* the west bank: the first walkable point left of the pool's deep water */
  const pool=gen.oasis;
  let x=pool.x;
  while(!gen.traversalAt(x,pool.y).walk)x--;
  scene.px=x-2;scene.py=pool.y;scene.lastPX=scene.px;scene.lastPY=scene.py;
  scene.camXf=scene.px-160;scene.camYf=scene.py-100;
  return {scene,gen,bank:x};
}

test('frost carries the traveller over water he could not enter',()=>{
  const {scene,gen,bank}=oasisScene();
  const wx=bank+12,wy=scene.py;
  assert.equal(gen.traversalAt(wx,wy).walk,false,'the fixture found no deep water');
  assert.equal(scene.blocked(wx,wy),true);
  scene.heading={x:1,y:0};
  assert.ok(scene.cast(2).mark,'the second slot is not frost');
  scene.r.time=1.5;
  assert.equal(scene.blocked(wx,wy),false,'the plate did not carry him');
  /* he walks onto it at his own speed and is held there */
  const from=scene.px;
  for(let i=0;i<40;i++){scene.r.time+=1/60;scene.step(1/60,{right:1});}
  assert.ok(scene.px>bank+4,`he stopped at the bank: ${scene.px-from} px`);
  assert.equal(gen.traversalAt(scene.px,scene.py).walk,false);
  for(let i=0;i<60*40;i++){scene.r.time+=1/60;scene.step(1/60,{});}
  assert.equal(scene.frozenAt(scene.px,scene.py),true,'the ice thawed under him');
});

test('a fire cast at water is refused and leaves no mark',()=>{
  const {scene}=oasisScene();
  scene.heading={x:1,y:0};
  const result=scene.cast('kindle');
  assert.equal(result.refused,'wet');
  assert.equal(scene.spells.marks.length,0);
  assert.ok(scene.motes.length>0,'a refused cast showed nothing');
});

test('a cast is heard further than a footfall and enters the typed ledger',()=>{
  const {scene}=oasisScene();
  scene.heading={x:-1,y:0};
  const before=scene.lifeSession.snapshot().disturbances?.length||0;
  scene.cast('tremor');
  assert.equal(scene.loud.level,SPELLS.tremor.noise);
  assert.ok((scene.lifeSession.snapshot().disturbances?.length||0)>before,
    'the tremor left no disturbance');
  /* the same listener, the same distance, two loudnesses */
  const id=Object.keys(LIFE).find((k)=>LIFE[k].perception?.sound&&!LIFE[k].perception.sight);
  const profileId=id||Object.keys(LIFE).find((k)=>LIFE[k].perception?.sound);
  const range=LIFE[profileId].perception.sound.range;
  const observer={id:'listener',profileId,x:0,y:0};
  const hears=(noise)=>observeActor(observer,
    [{id:'person:traveller',kind:'traveller',x:range*0.9,y:0,moving:false,noise}],{})
    .some((q)=>q.kind==='sound');
  assert.equal(hears(0.68),false,'a footfall carried to 0.9 of the hearing range');
  assert.equal(hears(SPELLS.tremor.noise),true,'a tremor was not heard');
});

/* ── squall ───────────────────────────────────────────────────────────── */
test('a squall takes a bed past its moisture of extinction',()=>{
  const Q=SPELLS.squall,K=SPELLS.kindle;
  for(const u of [0,5,20,40])
    assert.equal(cheneyMoisture((BED.sward.moisture+RAIN_WET)*100,u),0,`a wet sward burns at ${u} km/h`);
  /* rain on a live fire */
  const state=createSpellState(),env=on(SURF.sward);
  const {mark}=castSpell(state,'kindle',HERE,0,env);
  const hot=burnRadiusPx(mark,2);
  castSpell(state,'squall',{...HERE,x:mark.x-Q.aheadM*PX_PER_M},2,env);
  assert.equal(mark.flameEnd,2);
  assert.equal(burnRadiusPx(mark,6),hot,'the fire spread in the rain');
  assert.equal(mark.endAt,2+Q.rainS,'regrowth waits past the fall');
  assert.equal(flameTongues(state,2.5,worldOf(SURF.sward)).length,0);
  /* a fire lit in the wet flashes and carries nothing */
  assert.equal(wetAt(state,mark.x,mark.y,2+Q.rainS+Q.wetS-1),true);
  const flash=castSpell(state,'kindle',HERE,12,env).mark;
  assert.deepEqual([flash.damp,flash.flameS,flash.runMax],[0,K.flashS,0]);
  /* a run ends at the edge of a wet bed downwind */
  const dry=createSpellState();
  const free=castSpell(dry,'kindle',HERE,0,env).mark.runMax;
  const cut=createSpellState();
  const ahead=(K.aheadM+3)*PX_PER_M;
  castSpell(cut,'squall',{x:ahead+WIND_GX*ahead-Q.aheadM*PX_PER_M,y:WIND_GY*ahead/2,hx:1,hy:0},0,env);
  const stopped=castSpell(cut,'kindle',HERE,1,env).mark;
  assert.ok(stopped.damp>0&&stopped.runMax<free,`the run crossed the wet bed: ${stopped.runMax} of ${free}`);
  /* the bed dries */
  pruneMarks(state,2+Q.rainS+Q.wetS+0.1);
  assert.equal(wetAt(state,mark.x,mark.y,2+Q.rainS+Q.wetS+0.1),false);
});

test('a wet bed does not fly',()=>{
  const Q=SPELLS.squall,env=on(SURF.sand),world=worldOf(SURF.sand);
  const thrown=(state)=>{
    const pool=[];
    castSpell(state,'tremor',HERE,1,env);
    for(let t=1.001;t<2;t+=1/60)emitMarks(state,pool,t,1/60,world);
    return pool.filter((p)=>p.ramp==='sand');
  };
  const state=createSpellState();
  const cell=castSpell(state,'squall',HERE,0,env).mark;
  const grains=thrown(state);
  assert.ok(grains.length>0,'the wave lifted no dry sand');
  assert.ok(grains.every((p)=>Math.hypot(p.x-cell.x,(p.y-cell.y)*2)>cell.r-4),
    'sand left a wet bed');
  assert.ok(thrown(createSpellState()).length>grains.length,'the cell cost the wave nothing');
  assert.ok(Q.wetS>Q.rainS);
});

test('snow comes back to a bared crown under a squall',()=>{
  const Q=SPELLS.squall,state=createSpellState(),env=on(SURF.snow,{snow:true});
  const at=SPELLS.tremor.footM*PX_PER_M+20;
  castSpell(state,'tremor',HERE,0,env);
  const pool=[],spruce={x:at,y:0,w:24,h:40,kind:'spruce',plant:true};
  const world=worldOf(SURF.snow,[spruce],true);
  for(let t=0.001;t<1;t+=1/60)emitMarks(state,pool,t,1/60,world);
  assert.equal(pool.filter((p)=>p.heavy).length,12);
  pool.length=0;
  assert.equal(propFx(state,3,at,0,0,true).bare,true);
  castSpell(state,'squall',{...HERE,x:at-Q.aheadM*PX_PER_M},4,env);
  assert.equal(propFx(state,4+Q.loadS-0.1,at,0,0,true).bare,true,'snow lay before it fell');
  assert.equal(propFx(state,4+Q.loadS+0.1,at,0,0,true).bare,false);
  assert.equal(propFx(state,4+Q.loadS+0.1,at-Q.radiusM*PX_PER_M-30,0,0,true).bare,true,
    'snow fell outside the cell');
  /* a laden crown can shed again */
  state.ready.tremor=0;
  castSpell(state,'tremor',HERE,10,env);
  assert.equal(propFx(state,12,at,0,0,true).bare,true);
  for(let t=10.001;t<11;t+=1/60)emitMarks(state,pool,t,1/60,world);
  assert.equal(pool.filter((p)=>p.heavy).length,12,'a laden crown shed nothing');
});

test('the fall of a squall is derived, inside its disc, and ends',()=>{
  const Q=SPELLS.squall,state=createSpellState();
  const {mark}=castSpell(state,'squall',HERE,0,on(SURF.sward));
  const calm={...worldOf(SURF.sward),rainRamp:null};
  const a=squallFall(state,3,calm),b=squallFall(state,3,calm);
  assert.deepEqual(a,b,'the fall is not a function of the mark and the clock');
  assert.ok(a.length>=Q.drops,`${a.length} dots of rain`);
  assert.ok(a.every((q)=>q.ice&&groundDist0(mark,q)<=mark.r+1),'rain fell outside the cell');
  assert.ok(a.every((q)=>q.z<=RAIN.fallWindowS*10*PX_PER_M+1));
  /* a world with its own rain lends its ramp */
  const swamp=squallFall(state,3,{...calm,rainRamp:'birch'});
  assert.ok(swamp.every((q)=>q.ramp==='birch'&&!q.ice));
  /* wind slants the streaks upwind of where they land */
  const blown=squallFall(state,3,{...calm,wind:1});
  assert.ok(blown.some((q)=>groundDist0(mark,q)>mark.r+4));
  assert.equal(squallFall(state,Q.rainS+Q.dropS+0.01,calm).length,0);
  /* graupel under snow */
  const cold=squallFall(state,3,{...calm,snowy:true});
  assert.ok(cold.length>20&&cold.every((q)=>q.ice&&q.z<=Q.flakeM*PX_PER_M));
  const A=rows(),B=rows();
  assert.equal(markUniforms(state,3,A,B),0,'a squall reached the ground pass');
});
function groundDist0(m,q){ return Math.hypot(q.x-m.x,(q.y-m.y)*2); }

test('a squall works through the scene',()=>{
  const {scene}=oasisScene();
  scene.heading={x:-1,y:0};
  assert.ok(scene.cast('squall').mark,'the squall was refused');
  assert.equal(scene.loud.level,SPELLS.squall.noise);
  for(let i=0;i<90;i++){scene.r.time+=1/60;scene.stepSpells(1/60);}
  assert.equal(scene.spellWorld().rainRamp,null,'the desert has a rain ramp');
  assert.ok(squallFall(scene.spells,scene.r.time,scene.spellWorld()).every((q)=>q.ice));
});
