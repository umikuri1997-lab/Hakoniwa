import * as THREE from 'three';
import { cabinSlab, makeCabin } from './cabin.js';
import { PUMP_M, ROOF_M, houseSlab, makeDerelict, makeHouse, makeNestPole,
         makeRoofRotor, makeTrussBay, makeWheel } from './steading.js';
import {
  makeSwampHouse, makeSwampProp, swampHouseSlab, swampPileSlab,
} from './swamp-settlement.js';
import {
  ROCKER, makeHouseLadder, makeLakeHouse, makeRockingChair,
} from './swamp-lakehouse.js';
import { makePavilion, pavilionSlab } from './pavilion.js';
import { HUT_VARIANTS, hutSlab, makeHut } from './desert-hamlet.js';
import { CAP_HOUSE_VARIANTS, capHouseSlab, makeCapHouse, makeCutBench,
         makeLampPost } from './hollow-village.js';
import { CAMEL_STATES } from './body-camel.js';
import { camelRiderSeat, makeCamel } from './figure-camel.js';
import { makeMountedFolk } from './figure-folk.js';
import { TENT_VARIANTS, makeTent, tentSlab } from './desert-camp.js';
import { PILLAR_VARIANTS, WALL_VARIANTS, makePillar, makeRuinWall } from './ruins.js';
import { makeAlligator, makeBoar, makeFennec, makeHeron, makeSandgrouse, makeSquirrel, makeTurtle, makeViper } from './animal.js';
import { DEER_STATES } from './body-deer.js';
import { WOLF_STATES } from './body-wolf.js';
import { makePaleDeer, makeRoeDeer } from './figure-deer.js';
import { makeWolf } from './figure-wolf.js';
import { RIGGED, makeRigged } from './bestiary.js';
import { MACHINE, makeMachine } from './machine.js';
import { LOOK_KEYS } from './attention.js';
import { CAST, PERSON_VIEWS, appearanceOf, castStates, paintPerson,
         travellerKeyFor } from './people.js';
import { ATLAS_S } from './constants.js';
import { clamp } from './math.js';
import { RNG } from './rng.js';
import { BOTANY, KINDS, makeLog, makeTree, MAX_LEAN, MIN_H, SPECIES, SPECIES_H, TIER_N, tierHeight, VARIANTS } from './species.js';
import { BARK, CONTACT_RUNGS, FROST, GLOW, GRAIN, bareTwin, contactRows, dropFragments, makeContact, makeFlame, makeFootprint, newSprite, partThickness, SNOW, trimLeader, underPlate } from './sprite.js';
import { FLAME_SHAPES } from './spell.js';
import { BIOMES, TIERS, growsIn } from './biome.js';
import { ACTOR, stateKey } from './fauna.js';
import { morphologiesIn } from './life.js';

/* A scene bakes its own biome's cast; no biome bakes everything (the lab
   inspector). Authorities: BIOMES for built forms, growsIn for species, LIFE
   for bodies. No separate roster list. */
function biomeRoster(biome){
  if(!biome) return null;
  const plan=BIOMES[biome];
  if(!plan) throw new Error(`unknown biome '${biome}': see BIOMES in biome.js`);
  const morphs=new Set(morphologiesIn(biome));
  /* ACTOR.key is the atlas key, not always the morphology: the lakekeeper
     borrows the fisher's row. */
  const cast=new Set();
  for(const m of morphs){ const row=ACTOR[m]; if(row?.key) cast.add(row.key); }
  /* The traveller's wardrobe is a scene choice; people.js owns the mapping. */
  cast.add(travellerKeyFor(biome));
  return {
    plan, morphs, cast,
    grows:(k)=>growsIn(biome,k),
    animal:(name)=>morphs.has(name),
  };
}

/* The values the world atlas grows trees at. species.js and sprite.js hold the
   growth defaults; a bake applies these rows and restores the defaults after.
   An ungated snow crust follows the trunk as one white stripe. Birch wood at
   the default sMax lands at L=129, 11 below the ground it stands on. */
const BAKE_TUNING=[
  [SNOW,{form:0.62}],
  [SPECIES.birch,{reach:5,snow:0.90,clump:0.82,sMax:1.00,sMin:0.30,bark:0.34}],
  [SPECIES.birch.cfg,{kidsMax:2,trunkKids:6}],
  [SPECIES.snag,{sMax:0.90}],
  [SPECIES.spruce.cfg,{falloff:0.90,whorlDensity:0.190}],
  [BOTANY.spruce.crownW,{m:0.40}],
  [BARK,{minR:1.15}],
];
function withTuning(rows,fn){
  const was=rows.map(([o,v])=>[o,Object.fromEntries(Object.keys(v).map((k)=>[k,o[k]]))]);
  try{ for(const [o,v] of rows) Object.assign(o,v); return fn(); }
  finally{ for(const [o,v] of was) Object.assign(o,v); }
}
/* SNOW.bridge and SNOW.tilt are set per species inside the bake, so they are
   saved and restored here without a start value. */
/* `outfit` is what the traveller wears over his world's dress (src/gear.js),
   or null. It reaches his rows and the rider and nobody else. */
const buildWorldAtlas=(seed,snowAmt,biome=null,outfit=null)=>withTuning(
  [...BAKE_TUNING,[SNOW,{bridge:SNOW.bridge,tilt:SNOW.tilt}]],
  ()=>growWorldAtlas(seed,snowAmt,biome,outfit));

/* Every non-human body the atlas can bake: painter, seed and frame counts.
   Invariant: ACTOR expression rows and clip keys stay wired to these entries
   and tests. tools/lineup.mjs draws a world's roster from the same rows. */
const ANIMALS={
  boar    :{make:makeBoar,     seed:0x5b0a4,states:{walk:4}},
  roeDeer :{make:makeRoeDeer,  seed:0xc4a4c3,states:DEER_STATES},
  paleDeer:{make:makePaleDeer, seed:0x9a1ede,states:DEER_STATES},
  wolf    :{make:makeWolf,     seed:0x0c1f7a,states:WOLF_STATES},
  squirrel:{make:makeSquirrel, seed:0x59125,states:{walk:4}},
  alligator:{make:makeAlligator,seed:0xa11160,
    states:{swim:4,float:1,submerge:2,bask:1,crawl:4}},
  heron:{make:makeHeron,seed:0x4e2011,states:{wade:4,still:1}},
  turtle:{make:makeTurtle,seed:0x7a871e,states:{crawl:4,bask:1,float:1}},
  camel:{make:makeCamel,seed:0xca43e1,states:CAMEL_STATES},
  fennec:{make:makeFennec,seed:0xfe33ec,states:{trot:4,still:1}},
  sandgrouse:{make:makeSandgrouse,seed:0x5a4d61,states:{shuffle:4,still:1}},
  viper:{make:(r,f,d,state)=>makeViper(r,f,d,state),seed:0x71be12,
         states:{sidewind:4,buried:1}},
};
/* Every projected-skeleton body: src/bestiary.js is the list. The pose is
   deterministic, so the seed is unread. */
for(const spec of RIGGED)
  ANIMALS[spec.kind]={make:makeRigged(spec),seed:0,states:spec.states};
for(const name of Object.keys(MACHINE)){
  const row=MACHINE[name];
  ANIMALS[name]={
    make:(r,f,d,state)=>makeMachine(name,r,f,d,state),
    seed:row.seed,states:row.frames,
  };
}

function growWorldAtlas(seed,snowAmt,biome,outfit=null){
  const R=biomeRoster(biome);
  const wants=(k)=>!R||R.grows(k);
  const builds=(flag)=>!R||!!R.plan[flag];
  const rnd=new RNG(seed^0x5bf03635);
  const used={};
  for(const k of KINDS) used[k]=wants(k)?new Set(TIERS[k]):new Set();
  const atlas={};
  for(const k of KINDS) atlas[k]=[];
  /* The bare twin of every sprite that carries snow, by the laden sprite's
     own key: what a crown is after it sheds (src/spell.js). */
  atlas.bare={};
  for(let ti=0;ti<TIER_N;ti++){
    for(const k of KINDS){
      if(!used[k].has(ti)){ atlas[k].push([]); continue; }
      const nv=VARIANTS[k], bank=[];
      /* Invariant: each species/tier owns its RNG stream. A shared stream
         re-rolls later atlas entries. */
      const kseed=SPECIES[k].seed;
      if(kseed===undefined) throw new Error(`SPECIES.${k} has no seed; add one to the row`);
      const rnd=new RNG(seed^kseed^(ti*0x9e3779b1));
      const base=tierHeight(ti)*ATLAS_S*(SPECIES_H[k]/SPECIES_H.birch);
      /* conifers lean less */
      const leanMul=SPECIES[k].conifer?0.35:1;
      /* Snow span per species. A birch is mostly air; bridging a laden
         conifer welds the whorls into a cone. */
      SNOW.bridge = k==='birch'?2 : k==='snag'?2 : k==='spruce'?1 : 0;
      /* Undergrowth is near-vertical stems, so a tilt gate strips its snow:
         0. Spruce at 0.5 lays crust across the bole between whorls and the
         trunk-continuity metric falls to 0.32-0.54. */
      SNOW.tilt   = k==='birch'?1 : k==='snag'?1 : k==='spruce'?0.85 : 0;
      for(let v=0;v<nv;v++){
        const hgt=Math.max(MIN_H[k]||9,Math.round(base*rnd.range(0.93,1.08)));
        let sp=makeTree(k,hgt,rnd,snowAmt,0.78,nv>1?(v/(nv-1))*MAX_LEAN*leanMul:0);
        if(SPECIES[k].conifer) sp=trimLeader(sp,Math.round(hgt*0.05)+2);
        /* Snow is the deposit of a species that names no other (ramp2). */
        const twin=sp.ramp2===undefined?bareTwin(sp):null;
        if(twin) atlas.bare[k+':'+ti+':'+v]=dropFragments(twin);
        if(SPECIES[k].conifer) sp=underPlate(sp);
        bank.push(dropFragments(sp));
      }
      atlas[k].push(bank);
    }
  }
  atlas.log=[];
  for(let ti=0;ti<2;ti++){
    const bank=[];
    if(wants('log'))
      for(let v=0;v<3;v++) bank.push(makeLog(Math.round((ti?92:62)*rnd.range(0.88,1.12)),rnd,snowAmt));
    atlas.log.push(bank);
  }
  /* Short-prop contact ladder (CONTACT_RUNGS in src/sprite.js). The 13 px
     rung is 13/26 = 0.500 by 5/26 = 0.192, the traveller's proportions. */
  atlas.contact=[CONTACT_RUNGS.map((w)=>makeContact(w,contactRows(w)))];
  /* Kicked grains: each speck carries both endpoints of the source material's
     ramp. The parity checker gives every background one contrasting rung
     without a new colour. */
  const speck=(material)=>[[2,1],[2,2]].map(([w,h])=>{
    const sp=newSprite(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x;
      sp.occ[i]=material; sp.shade[i]=(x+y)&1; sp.ao[i]=1;
      sp.nx[i]=0; sp.ny[i]=0; sp.nz[i]=1; sp.rad[i]=1;
    }
    return sp;
  });
  atlas.grain=[speck(GRAIN)];
  /* the same specks as a spell's light: sparks, embers and the cast's ring */
  atlas.spark=[speck(GLOW)];
  atlas.frost=[speck(FROST)];
  /* Flame tongues (src/spell.js): each size at three leans, keyed
     `flame:<size>:<lean+1>`. */
  atlas.flame=[FLAME_SHAPES.flatMap(([w,h])=>[-1,0,1].map((lean)=>makeFlame(w,h,lean)))];
  /* The ground each building stands on, one flat caster per variant
     (makeFootprint in src/sprite.js). Keyed by kind and variant, never by
     push order: which entries exist depends on the biome. */
  atlas.foot=[[]]; atlas.footKeys=[];
  const foot=(name,s)=>{
    atlas.footKeys.push(name);
    atlas.foot[0].push(makeFootprint(Math.round(s.hx*2),s.back,s.shear,s.dx));
  };

  atlas.cabin=[[]];
  if(builds('cabins')){
    for(let v=0;v<3;v++) atlas.cabin[0].push(makeCabin(new RNG(seed^(0xcab0+v)),v));
    for(let v=0;v<3;v++) foot('cabin:'+v,cabinSlab(v));
  }

  atlas.house=[[]]; atlas.roofRotor=[[]]; atlas.bay=[[]]; atlas.wheel=[[]];
  atlas.pavilion=[[]];
  atlas.derelict=[[]]; atlas.nestPole=[[]];
  if(builds('steading')){
    for(let v=0;v<3;v++) atlas.house[0].push(makeHouse(new RNG(seed^(0x4075e+v)),v));
    for(let v=0;v<3;v++) foot('house:'+v,houseSlab(v));
    atlas.pavilion[0].push(makePavilion(new RNG(seed^0x7a9e1),0));
    foot('pavilion:0',pavilionSlab());
    for(let f=0;f<ROOF_M.frames;f++) atlas.roofRotor[0].push(makeRoofRotor(new RNG(seed^0x407f0),f));
    for(let g=0;g<PUMP_M.bays;g++) atlas.bay[0].push(makeTrussBay(new RNG(seed^(0xba70+g)),g));
    for(let f=0;f<PUMP_M.frames;f++) atlas.wheel[0].push(makeWheel(new RNG(seed^0x33ee),f));
    atlas.derelict[0].push(makeDerelict(new RNG(seed^0x0de1)));
    atlas.nestPole[0].push(makeNestPole(new RNG(seed^0x57a11)));
  }
  atlas.pillar=[builds('pondCourt')
    ?PILLAR_VARIANTS.map((o,i)=>makePillar(new RNG(seed^(0x91a7+i)),o)):[]];
  atlas.ruinWall=[builds('pondCourt')?WALL_VARIANTS.map(o=>makeRuinWall(o)):[]];
  atlas.hut=[[]];
  if(builds('desertHamlet')){
    for(let v=0;v<HUT_VARIANTS.length;v++){
      atlas.hut[0].push(makeHut(new RNG(seed^(0x407a+v)),v));
      foot('hut:'+v,hutSlab(v));
    }
  }
  atlas.capHouse=[[]]; atlas.lampPost=[[]]; atlas.cutBench=[[]];
  if(builds('hollowVillage')){
    for(let v=0;v<CAP_HOUSE_VARIANTS.length;v++){
      atlas.capHouse[0].push(makeCapHouse(null,v));
      foot('capHouse:'+v,capHouseSlab(v));
    }
    atlas.lampPost[0].push(makeLampPost());
    atlas.cutBench[0].push(makeCutBench());
  }
  atlas.tent=[[]];
  if(builds('desertCamp')){
    for(let v=0;v<TENT_VARIANTS.length;v++){
      atlas.tent[0].push(makeTent(new RNG(seed^(0x7e07+v)),v));
      foot('tent:'+v,tentSlab(v));
    }
  }
  atlas.swampHouse=[[]];
  if(builds('swampSettlement')){
    foot('swampPile',swampPileSlab());
    for(let v=0;v<3;v++){
      atlas.swampHouse[0].push(makeSwampHouse(new RNG(seed^(0x5a4d0+v)),v));
      foot('swampHouse:'+v,swampHouseSlab(v));
    }
  }
  for(const k of ['swampDock','swampSkiff','swampRack','swampCistern','swampMooring',
                   'swampTrap','swampWinch','swampChest'])
    atlas[k]=[builds('swampSettlement')?[makeSwampProp(k)]:[]];
  /* The sinkhole place. The chair's bank is one object at ROCKER.frames
     phases of one oscillation. */
  const lakehouse=builds('swampLakehouse');
  atlas.lakeHouse=[lakehouse?[makeLakeHouse(new RNG(seed^0x1a4e0),0)]:[]];
  atlas.houseLadder=[lakehouse?[makeHouseLadder()]:[]];
  atlas.rockingChair=[lakehouse?(()=>{
    /* Half a period apart the chair is upright again: those frames share one
       sprite object, which the packer aliases. */
    const upright=makeRockingChair(0);
    return Array.from({length:ROCKER.frames},(_,f)=>
      f%(ROCKER.frames/2)===0?upright:makeRockingChair(f));
  })():[]];
  /* The cast. Five authored views per state (front, away, profile, front
     diagonal, away diagonal; the last three mirror for screen-left), and a
     look bank per state except run. A look does not read from the two away
     views (1 and 4), so those banks reuse the neutral sprite object and the
     packer aliases them. `cropSprite` trims canvas headroom: the swamp budget
     test meters atlas area. */
  atlas.figures={};
  for(const name of Object.keys(CAST)){
    const row=CAST[name];
    if(R&&!R.cast.has(row.key)) continue;
    const states=castStates(row);
    const worn=outfit&&row.key===travellerKeyFor(biome)?outfit:null;
    for(const state of Object.keys(states)){
      const banks=[];
      for(let d=0;d<PERSON_VIEWS;d++){
        const bank=[];
        for(let f=0;f<states[state];f++)
          bank.push(cropSprite(paintPerson(name,d,f,state,'neutral',worn)));
        banks.push(bank);
      }
      atlas.figures[stateKey(row.key,state)]=banks;
      if(state==='run') continue;
      for(const look of LOOK_KEYS){
        if(look==='neutral') continue;
        const lbanks=[];
        for(let d=0;d<PERSON_VIEWS;d++){
          const bank=[];
          for(let f=0;f<states[state];f++)
            bank.push(d===1||d===4?banks[d][f]
              :cropSprite(paintPerson(name,d,f,state,look,worn)));
          lbanks.push(bank);
        }
        atlas.figures[stateKey(row.key,state)+'~'+look]=lbanks;
      }
    }
  }
  /* The rider keeps the traveller's cloth ramps and shares the camel's ground
     anchor, state and phase. Baked where camels live. */
  if(!R||R.animal('camel')){
    const F=ACTOR.camel;
    const rider=outfit?appearanceOf('desertTraveller',outfit):null;
    for(const state of Object.keys(CAMEL_STATES)){
      const key=stateKey(F.riderKey,state);
      const banks=[];
      for(let d=0;d<3;d++){
        const bank=[];
        for(let f=0;f<CAMEL_STATES[state];f++)
          bank.push(cropSprite(makeMountedFolk('desertTraveller',d,f,state,
            'neutral',camelRiderSeat(f,d,state),rider)));
        banks.push(bank);
      }
      atlas.figures[key]=banks;
      if(state==='pace')continue;
      for(const look of LOOK_KEYS){
        if(look==='neutral')continue;
        const lbanks=[];
        for(let d=0;d<3;d++){
          const bank=[];
          for(let f=0;f<CAMEL_STATES[state];f++)
            bank.push(d===1?banks[d][f]
              :cropSprite(makeMountedFolk('desertTraveller',d,f,state,look,
                camelRiderSeat(f,d,state),rider)));
          lbanks.push(bank);
        }
        atlas.figures[key+'~'+look]=lbanks;
      }
    }
  }
  atlas.animals={};
  for(const name in ANIMALS){
    if(R&&!R.animal(name)) continue;
    const {make,seed:s,states}=ANIMALS[name];
    for(const state of Object.keys(states)){
      const key=stateKey(name,state);
      const views=[];
      for(let d=0;d<3;d++){
        const bank=[];
        for(let f=0;f<states[state];f++) bank.push(make(new RNG(seed^s),f,d,state));
        views.push(bank);
      }
      atlas.animals[key]=views;
      atlas[key]=views;          // the flat name the render loop still reads
    }
  }
  return atlas;
}

/* Trim a sprite to its occupied box, keeping the anchor on the same world
   pixel. */
function cropSprite(sp){
  let x0=sp.w,y0=sp.h,x1=-1,y1=-1;
  for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++)
    if(sp.occ[y*sp.w+x]){
      if(x<x0)x0=x; if(x>x1)x1=x;
      if(y<y0)y0=y; if(y>y1)y1=y;
    }
  if(x1<0||(x0===0&&y0===0&&x1===sp.w-1&&y1===sp.h-1)) return sp;
  const w=x1-x0+1,h=y1-y0+1;
  const out={...sp,w,h,ax:sp.ax-x0,ay:sp.ay-y0};
  for(const ch of ['occ','shade','horiz','rad','nx','ny','nz','ao','noSnow']){
    const src=sp[ch]; if(!src) continue;
    const dst=new src.constructor(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)
      dst[y*w+x]=src[(y+y0)*sp.w+(x+x0)];
    out[ch]=dst;
  }
  return out;
}

function bakeWorldAtlas(atlas){
  const list=[];
  for(const kind of KINDS)
    atlas[kind].forEach((bank,ti)=>bank.forEach((sp,v)=>list.push({sp,key:kind+':'+ti+':'+v})));
  atlas.log.forEach((bank,ti)=>bank.forEach((sp,v)=>list.push({sp,key:'log:'+ti+':'+v})));
  for(const key in atlas.bare) list.push({sp:atlas.bare[key],key:'bare:'+key});
  for(const key of Object.keys(atlas.figures))
    atlas.figures[key].forEach((bank,d)=>bank.forEach((sp,f)=>list.push({sp,key:key+':'+d+':'+f})));
  atlas.cabin[0].forEach((sp,v)=>list.push({sp,key:'cabin:0:'+v}));
  for(const k of ['house','roofRotor','bay','wheel','derelict','nestPole','pavilion','pillar','ruinWall',
                   'hut','tent','capHouse','lampPost','cutBench',
                   'swampHouse','swampDock','swampSkiff','swampRack','swampCistern',
                   'swampMooring','swampTrap','swampWinch','swampChest',
                   'lakeHouse','houseLadder','rockingChair'])
    atlas[k][0].forEach((sp,v)=>list.push({sp,key:k+':0:'+v}));
  for(const name in atlas.animals)
    atlas.animals[name].forEach((bank,d)=>bank.forEach((sp,f)=>list.push({sp,key:name+':'+d+':'+f})));
  atlas.contact[0].forEach((sp,i)=>list.push({sp,key:'contact:'+CONTACT_RUNGS[i]}));
  atlas.grain[0].forEach((sp,i)=>list.push({sp,key:'grain:'+(i+1)}));
  atlas.spark[0].forEach((sp,i)=>list.push({sp,key:'spark:'+(i+1)}));
  atlas.frost[0].forEach((sp,i)=>list.push({sp,key:'frost:'+(i+1)}));
  atlas.flame[0].forEach((sp,i)=>list.push({sp,key:'flame:'+Math.floor(i/3)+':'+i%3}));
  atlas.foot[0].forEach((sp,i)=>list.push({sp,key:'foot:'+atlas.footKeys[i]}));
  /* Shared frames are aliases: every lookup key stays, the body packs once.
     Identity catches object reuse (rocking chair phases, away-view looks);
     the byte signature catches equal drawings in separate objects (the two
     zero-breath idle frames of every figure). Geometry and anchors are in the
     signature because rects carry them. */
  const aliases=[],owner=new Map(),byBytes=new Map(),unique=[];
  const signature=(sp)=>{
    let h=(sp.w*73856093^sp.h*19349663^(sp.ax+1)*83492791^(sp.ay+1)*2654435761)>>>0;
    for(let i=0;i<sp.occ.length;i++){
      if(!sp.occ[i]) continue;
      h=(h^(i*2246822519^sp.occ[i]*374761393
        ^(Math.round(sp.shade[i]*255)*668265263)
        ^(Math.round((sp.nx[i]+1)*127)*961748941)
        ^(Math.round((sp.ny[i]+1)*127)*879190841)
        ^(Math.round(sp.ao[i]*255)*57885161)))>>>0;
      h=Math.imul(h,2654435761)>>>0;
    }
    return h+':'+sp.w+':'+sp.h;
  };
  const sameBytes=(a,b)=>{
    if(a.w!==b.w||a.h!==b.h||a.ax!==b.ax||a.ay!==b.ay) return false;
    for(let i=0;i<a.occ.length;i++)
      if(a.occ[i]!==b.occ[i]||a.shade[i]!==b.shade[i]||a.nx[i]!==b.nx[i]
        ||a.ny[i]!==b.ny[i]||a.ao[i]!==b.ao[i]) return false;
    return true;
  };
  for(const e of list){
    const first=owner.get(e.sp);
    if(first){ aliases.push({key:e.key,owner:first}); continue; }
    const sig=signature(e.sp);
    const twin=(byBytes.get(sig)||[]).find((o)=>sameBytes(o.sp,e.sp));
    if(twin){ owner.set(e.sp,twin); aliases.push({key:e.key,owner:twin}); continue; }
    owner.set(e.sp,e);
    if(!byBytes.has(sig)) byBytes.set(sig,[]);
    byBytes.get(sig).push(e);
    unique.push(e);
  }
  list.length=0; list.push(...unique);
  /* Height-sorted shelves into a power-of-two texture. Width breaks a height
     tie so the order is a function of the sprite set alone. */
  list.sort((a,b)=>b.sp.h-a.sp.h||b.sp.w-a.sp.w);
  const W=1024, pad=1;
  let x=pad,y=pad,rowH=0,H=pad;
  for(const e of list){
    if(x+e.sp.w+pad>W){ x=pad; y+=rowH+pad; rowH=0; }
    e.x=x; e.y=y; x+=e.sp.w+pad; rowH=Math.max(rowH,e.sp.h);
    H=Math.max(H,y+e.sp.h+pad);
  }
  H=Math.pow(2,Math.ceil(Math.log2(H)));
  const nrm=new Uint8Array(W*H*4), mat=new Uint8Array(W*H*4), rects={};
  for(const e of list){
    const {sp}=e;
    /* Invariant: material/normal atlas channels keep the geometric thickness
       and AO meanings the shaders read. */
    const thickSnow=partThickness(sp, m=>m===2);
    const thickWood=partThickness(sp, m=>m===1||m===3||m===9||m===12);
    rects[e.key]={x:e.x,y:e.y,w:sp.w,h:sp.h,ax:sp.ax,ay:sp.ay};
    for(let sy=0;sy<sp.h;sy++)for(let sx=0;sx<sp.w;sx++){
      const si=sy*sp.w+sx, o=((e.y+sy)*W+(e.x+sx))*4, m=sp.occ[si];
      if(!m) continue;
      nrm[o]=Math.round((clamp(sp.nx[si],-1,1)*0.5+0.5)*255);
      nrm[o+1]=Math.round((clamp(sp.ny[si],-1,1)*0.5+0.5)*255);
      nrm[o+2]=Math.round(clamp(sp.nz[si],0,1)*255);
      nrm[o+3]=255;
      mat[o]=m; mat[o+1]=Math.round(clamp(sp.ao[si],0,1)*255);
      /* Channel b carries baked shade for figure cloth and the accent, and
         thickness for wood, bark and snow, which never read shade.
         Invariant: material 7 reuses AO as figure accent mix; other materials
         keep geometric AO. */
      const bch = m===2 ? thickSnow[si]
                : (m===1||m===3||m===9||m===12) ? thickWood[si]
                : sp.shade[si];
      mat[o+2]=Math.round(clamp(bch,0,1)*255); mat[o+3]=255;
    }
  }
  for(const a of aliases) rects[a.key]=rects[a.owner.key];
  const mk=d=>{ const t=new THREE.DataTexture(d,W,H,THREE.RGBAFormat);
    t.magFilter=t.minFilter=THREE.NearestFilter; t.needsUpdate=true; t.flipY=false; return t; };
  return {nrm:mk(nrm),mat:mk(mat),W,H,rects};
}

export { ANIMALS, bakeWorldAtlas, buildWorldAtlas };
