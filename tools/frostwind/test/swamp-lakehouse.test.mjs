import test from 'node:test';
import assert from 'node:assert/strict';

import { CAST_BY_KEY, castStates } from '../src/people.js';
import { CH } from '../src/constants.js';
import { RESIDENTS, activeSchedule, compileCulturePlan } from '../src/culture.js';
import { ACTOR } from '../src/fauna.js';
import { LIFE } from '../src/life.js';
import {
  CORRIDOR_M, LOG_COURSE_M, M_PER_PX, PX_PER_M, obliqueCols, obliqueRows,
} from '../src/scale.js';
import { SURFACE, SURF } from '../src/surface.js';
import { SWAMP_MAX_M } from '../src/sunlight.js';
import {
  LAKEHOUSE, ROCKER, makeHouseLadder, makeLakeHouse, makeRockingChair,
  makeSwampLakehouse, rockerFrameAt, rockerPeriodS, rockerShiftPx,
} from '../src/swamp-lakehouse.js';
import { SWAMP_HOUSE, makeSwampHouse } from '../src/swamp-settlement.js';
import { makeWorldGen } from '../src/worldgen.js';

const SEED=20260727;
const OPT={biome:'swamp',lake:0.55,density:0.65};
/* The expression src/world/swamp-water.js derives SWAMP_WADE_M from. */
const SWAMP_WADE_M=SURFACE[SURF.flooded].depth[1];
const SEEDS=[SEED,1234,7,99,2026,555,31337];

/* The pond court test's synthetic field: enough wet and dry for the scorer,
   independent of world tuning. */
function syntheticEnv(){
  const threshold=0.2;
  return {
    common:{x:0,y:700},worldR:4000,threshold,poi:[],alligatorHoles:[],
    pathX:y=>Math.sin(y*0.002)*55,
    wetness:(x,y)=>threshold+Math.sin(x*0.011+y*0.007)*0.075,
    /* One synthetic backwater for the sinkhole to merge with (the compound
       basin). */
    basinMetric:(x,y)=>Math.hypot((x-140)/150,(y-760)/75),
    basinFloorSignal:0.42,
  };
}

test('the basin is a dissolved hole, not a bank, and it clears the flood datum',()=>{
  for(const seed of SEEDS){
    const gen=makeWorldGen(seed,OPT);
    const L=gen.swampLakehouse;
    assert.ok(L,`seed ${seed} compiled no lakehouse`);

    /* Deep water where the swamp has none. The optics saturate at SWAMP_MAX_M
       and the place carries its true depth as a model fact past that. */
    const centre=gen.hydrologyAt(L.pond.cx,L.pond.cy);
    assert.equal(centre.water,true);
    assert.equal(centre.depth,SWAMP_MAX_M);
    assert.ok(L.pond.depthM>SWAMP_MAX_M,
      'a basin that only reaches the ramp ceiling has no reason to need a ladder');
    assert.equal(gen.traversalAt(L.pond.cx,L.pond.cy).medium,'deep');
    assert.equal(gen.traversalAt(L.pond.cx,L.pond.cy).walk,false);

    /* Wall, not bank. Peat stands at its angle of repose, 30-42 degrees; rock
       does not. The shore gradient tells them apart. */
    const step=4;
    let dropPerM=0;
    for(let a=0;a<360;a+=30){
      const r=a*Math.PI/180;
      const px=x=>L.pond.cx+Math.cos(r)*x*L.pond.rx;
      const py=x=>L.pond.cy+Math.sin(r)*x*L.pond.ry;
      for(let t=0.60;t<1.0;t+=0.02){
        const here=gen.hydrologyAt(px(t),py(t)).depth;
        const out=gen.hydrologyAt(px(t)+step,py(t)).depth;
        dropPerM=Math.max(dropPerM,Math.abs(here-out)/(step*M_PER_PX));
      }
    }
    const wallDeg=Math.atan(dropPerM)*180/Math.PI;
    assert.ok(wallDeg>50,
      `the basin wall stands at ${wallDeg.toFixed(1)} deg, inside the 30-42 deg `+
      'repose band a peat bank would take — it has stopped being a sinkhole');
  }
});

test('the keeper builds the way his people build, on the rim and on trunks',()=>{
  /* Read from the settlement. */
  assert.equal(LAKEHOUSE.rimM,SWAMP_HOUSE.floorM);
  assert.equal(LAKEHOUSE.rimM,SWAMP_HOUSE.designFloodM+SWAMP_HOUSE.freeboardM);
  assert.ok(LAKEHOUSE.rimM>=2.35);
  /* Trunks at the settlement's pile height. The rim already clears the flood;
     the form is cultural (canon: environment constrains culture without
     selecting meaning). The medium has no terrain elevation, so the rim's
     height shows only inside a sprite: the drawn trunks. */
  assert.equal(LAKEHOUSE.trunkM,SWAMP_HOUSE.pileM);

  for(const seed of SEEDS){
    const gen=makeWorldGen(seed,OPT),L=gen.swampLakehouse;
    /* A house is a wall: the pad is checked across the whole footprint. */
    const half=L.house.half;
    for(let x=L.x-half;x<=L.x+half;x+=4)
      for(const y of [L.y,L.y-6,L.y+L.deckRows]){
        assert.equal(gen.hydrologyAt(x,y).water,false,
          `seed ${seed}: the pad floods at ${x},${y}`);
        assert.equal(gen.traversalAt(x,y).walk,true);
      }
    /* The site is a hummock the field offers beside water it already holds.
       Both are required, so the compound term matters; the individual floors
       catch a collapse. Measured over ten worlds: wet 0.27-1.00, dry
       0.67-0.95, site 0.41-0.96, each floor just under its minimum. The wet
       term samples 68 px across, so a station finds real water or flooded
       forest in patches smaller than its footprint. Peat at the swamp's
       median dry signal scores wet 0.08 and its driest tenth scores 0,
       against a worst observed site of 0.27. */
    assert.ok(L.score.site>0.40,`seed ${seed}: site score is only ${L.score.site}`);
    assert.ok(L.score.dry>0.60,`seed ${seed}: pad dryness is only ${L.score.dry}`);
    assert.ok(L.score.wet>0.20,`seed ${seed}: the basin was cut into dry ground`);
  }
});

test('the ladder is an OSHA fixed ladder and climbs a drawn height',()=>{
  /* OSHA 1910.23: 75.5 deg pitch, 0.30 m rungs, 1.07 m of side rail above the
     landing. A fixed ladder reaching a raised floor. */
  assert.equal(LAKEHOUSE.pitchDeg,75.5);
  const pitch=Math.atan2(LAKEHOUSE.ladderRiseM,LAKEHOUSE.ladderRunM)*180/Math.PI;
  assert.ok(Math.abs(pitch-75.5)<1,`the ladder stands at ${pitch.toFixed(2)} deg`);
  assert.ok(Math.abs(LAKEHOUSE.rungM-0.30)<0.02);
  assert.equal(LAKEHOUSE.ladderRiseM,LAKEHOUSE.trunkM,
    'the ladder no longer spans the floor it exists to reach');
  assert.equal(LAKEHOUSE.rungs,Math.floor(LAKEHOUSE.ladderLenM/LAKEHOUSE.rungM));

  const sp=makeHouseLadder();
  const rungRows=[];
  for(let y=0;y<sp.h;y++){
    let n=0;
    for(let x=1;x<=sp.w-2;x++) if(sp.occ[y*sp.w+x]) n++;
    if(n===sp.w-2) rungRows.push(y);
  }
  const step=LAKEHOUSE.rungM*LAKEHOUSE.ladderRowsPerM;
  for(let i=1;i<rungRows.length;i++)
    assert.ok(Math.abs((rungRows[i]-rungRows[i-1])-step)<=1,
      'a rung drifted off the projected 0.30 m spacing');
  /* The anchor is the foot. */
  assert.equal(sp.ay,sp.h-1);
  assert.ok(rungRows.includes(sp.h-1),'the bottom rung is off the ground');
  /* The rails carry past the top rung by the landing extension, with no rungs
     in that length. */
  const topRung=Math.min(...rungRows);
  const grabRows=topRung;
  assert.ok(Math.abs(grabRows-Math.round(LAKEHOUSE.railExtendM*PX_PER_M))<=3,
    `the grab extension is ${grabRows} rows, not 1.07 m`);
  assert.ok(sp.w>=Math.round(LAKEHOUSE.ladderWM*PX_PER_M)-1);

  /* It reaches the deck it leans on. Against 2.35 m of rim the medium draws
     as nothing, 58 of its 69 rows stand in open grass. The rise is legible
     because the trunks are drawn. */
  const house=makeLakeHouse(null,0);
  const trunkPx=Math.round(LAKEHOUSE.trunkM*PX_PER_M);
  assert.ok(sp.h>=trunkPx,'the ladder is shorter than the floor it serves');
  assert.ok(house.h-1-trunkPx>0,'the house has no drawn undercroft to climb');

  for(const seed of SEEDS){
    const gen=makeWorldGen(seed,OPT),L=gen.swampLakehouse;
    /* On the house: inside the wall, on the dry pad, one row down-screen so
       it composites in front of the deck. */
    assert.ok(Math.abs(L.ladder.x-L.x)<L.house.half,
      `seed ${seed}: the ladder is not against its own balcony`);
    assert.equal(gen.hydrologyAt(L.ladder.x,L.ladder.y).water,false,
      `seed ${seed}: the ladder foot stands in water`);
    assert.equal(gen.traversalAt(L.ladder.x,L.ladder.y).walk,true);
    assert.ok(L.ladder.y>L.y,`seed ${seed}: the ladder sorts behind the house`);
    /* At the other end of the deck from the chair, so the two props never
       overlap on a balcony five metres wide. */
    assert.ok(Math.abs(L.ladder.x-L.seat.x)>=Math.round(1.4*PX_PER_M),
      `seed ${seed}: the ladder is drawn through the rocking chair`);
  }
});

test('the balcony is a real circulation width with a balustrade, not a guard',()=>{
  assert.equal(LAKEHOUSE.deckM,CORRIDOR_M);
  const deckRows=obliqueRows(2*Math.round(26*(LAKEHOUSE.deckM/1.70)/2));
  assert.ok(deckRows>=6,'the deck is too shallow to seat one person and pass another');
  /* A balcony 2.35 m up is a fall, so the rail is a guard at the standard
     1.00 m. */
  assert.ok(LAKEHOUSE.trunkM>1.00,'a knee-high deck does not need a guard');
  assert.ok(LAKEHOUSE.railM>=1.00,
    'a 2.35 m drop is guarded by a rail nobody would lean on');
  /* And the chair still works over it: a seated eye is about 1.20 m up. */
  assert.ok(LAKEHOUSE.railM<1.20,'the keeper cannot see his own water sitting down');
  assert.ok(LAKEHOUSE.railM<=ROCKER.backM,
    'the rail hides the chair back it is supposed to sit under');

  const sp=makeLakeHouse(null,0);
  assert.ok(sp.h>Math.round((LAKEHOUSE.wallM+LAKEHOUSE.rimM*0)*PX_PER_M));
  /* Log courses are a carpentry size, so the wall carries a countable
     number. */
  assert.equal(LAKEHOUSE.courses,Math.round(LAKEHOUSE.wallM/LOG_COURSE_M));
  assert.ok(LAKEHOUSE.courses>=8);
  assert.equal(Math.max(2,Math.round(LOG_COURSE_M*PX_PER_M)),4);
  /* The one warm note, and only one: the accent budget belongs to people. */
  const ochre=sp.occ.reduce((n,m)=>n+(m===6?1:0),0);
  assert.ok(ochre>0&&ochre<=40,`the lit window spends ${ochre} px of ochre`);
  assert.equal(sp.ramp2,'swampAccent');
  /* Open timber paints as wood but is skipped by the projected-shadow pass,
     so the balustrade cannot throw bar shadows across the pad. */
  assert.ok(sp.occ.some(m=>m===12));

  /* The rail survives the wall. Drawn before the logs, the wall paints over
     every column of it between the corners. Open timber must stand in front
     of the wall's columns after compositing. */
  const wallHalf=Math.round(LAKEHOUSE.widthM*PX_PER_M)>>1;
  const railRow=(()=>{
    let bestY=-1,bestN=0;
    for(let y=0;y<sp.h;y++){
      let n=0;
      for(let x=sp.ax-wallHalf;x<=sp.ax+wallHalf;x++)
        if(sp.occ[y*sp.w+x]===12) n++;
      if(n>bestN){bestN=n;bestY=y;}
    }
    return {y:bestY,n:bestN};
  })();
  assert.ok(railRow.n>=wallHalf,
    `the top rail survives only ${railRow.n} px across the wall`);
  /* It stops for the doorway. */
  assert.ok(railRow.n<2*wallHalf,'the balustrade has no way onto the balcony');

  /* An open undercroft on drawn trunks. Height in this engine exists inside a
     sprite, so the legs are drawn. */
  const groundRow=sp.h-1;
  let legPx=0,runs=0,wasOn=false;
  for(let x=0;x<sp.w;x++){
    const on=!!sp.occ[groundRow*sp.w+x];
    if(on){legPx++; if(!wasOn) runs++;}
    wasOn=on;
  }
  assert.equal(runs,3,`the ground course is ${runs} legs, not a trunk at each bay`);
  assert.ok(legPx<Math.round(sp.w*0.40),
    `the ground course is ${legPx}/${sp.w} px, which is a plinth and not daylight`);
  /* Whole logs: each leg is about 0.45 m across. */
  const legW=legPx/runs/PX_PER_M;
  assert.ok(legW>=0.30&&legW<=0.60,`each trunk is ${legW.toFixed(2)} m across`);
  /* The drawn rise is the declared floor height. */
  const trunkPx=Math.round(LAKEHOUSE.trunkM*PX_PER_M);
  const plateRow=sp.h-1-trunkPx;
  let plate=0;
  for(let x=0;x<sp.w;x++) if(sp.occ[plateRow*sp.w+x]) plate++;
  /* Measured against the front face. The house carries a return, so `sp.w`
     is wider than the elevation by the depth it draws, and the floor plate is
     a front-face member. */
  const frontW=Math.round(LAKEHOUSE.widthM*PX_PER_M)+
    Math.round(LAKEHOUSE.eaveM*PX_PER_M)*2+2;
  assert.ok(plate>=Math.round(frontW*0.85),
    `the floor plate is ${plate}/${frontW} px of front face, so the trunks carry nothing`);

  /* The rear-right trunk reaches the rear floor corner as one casting member,
     with no deck-width gap. */
  const bodyPx=2*Math.round(LAKEHOUSE.planDepthM*PX_PER_M/2);
  const bodyCols=obliqueCols(bodyPx),bodyRows=obliqueRows(bodyPx);
  const trunkR=Math.max(2,Math.round(0.22*PX_PER_M));
  const rearRight=sp.ax+wallHalf-trunkR+bodyCols;
  const rearEdge=sp.ax+wallHalf+1+bodyCols;
  const rearFloor=groundRow-trunkPx-deckRows-bodyRows;
  const rearGround=groundRow-bodyRows;
  for(let y=rearFloor;y<=rearGround;y++)
    assert.equal(sp.occ[y*sp.w+rearRight],1,
      `the rear-right trunk breaks before the floor at row ${y}`);
  for(let x=rearRight;x<=rearEdge;x++)
    assert.equal(sp.occ[rearFloor*sp.w+x],1,
      `the rear support leaves a gap before the floor return at column ${x}`);
});

test('the rocking motion is a measured pendulum, not an animation choice',()=>{
  /* T = 2*pi*sqrt((k^2 + d^2)/(g*d)), d = R - c. The centre of mass has to
     hang BELOW the rockers' centre of curvature or the chair does not rock. */
  assert.ok(ROCKER.comM<ROCKER.radiusM);
  const d=ROCKER.radiusM-ROCKER.comM;
  const expected=2*Math.PI*Math.sqrt(
    (ROCKER.gyrationM**2+d*d)/(9.81*d));
  const T=rockerPeriodS();
  assert.ok(Math.abs(T-expected)<1e-9);
  assert.ok(T>1.6&&T<1.8,`the chair rocks with a period of ${T.toFixed(3)} s`);

  /* At 15.29 px/m an 8 deg sweep is two pixels at the rockers, one at the
     seat, and nothing at the shoulders, which counter-swing because they are
     above the centre of curvature. Anything larger is invented motion. */
  const toe=Math.abs(rockerShiftPx(0,0.25));
  const seat=Math.abs(rockerShiftPx(ROCKER.seatM,0.25));
  const head=rockerShiftPx(1.10,0.25);
  assert.ok(toe>1.5&&toe<=2.5,`the rockers sweep ${toe.toFixed(2)} px`);
  assert.ok(seat>0.8&&seat<=1.5,`the seat sweeps ${seat.toFixed(2)} px`);
  assert.ok(Math.abs(head)<0.5,`the head sweeps ${head.toFixed(2)} px`);
  assert.ok(head<0,'the counter-swing above the centre of curvature was lost');

  /* Half a period apart the chair is back through vertical, so those frames
     are the same picture and the two extremes are mirror images. */
  const frames=Array.from({length:ROCKER.frames},(_,f)=>makeRockingChair(f));
  const same=(a,b)=>a.occ.every((v,i)=>v===b.occ[i]);
  assert.ok(same(frames[0],frames[ROCKER.frames/2]));
  assert.ok(!same(frames[0],frames[1]));
  assert.ok(!same(frames[1],frames[ROCKER.frames-1]));
  for(const f of frames)
    assert.equal(f.occ.reduce((n,m)=>n+(m?1:0),0),
      frames[0].occ.reduce((n,m)=>n+(m?1:0),0),
      'the shear gained or lost pixels, so it is not one object moving');
  /* The frame comes off the clock at the measured rate, and completes exactly
     one cycle per period. */
  assert.equal(rockerFrameAt(0),0);
  assert.equal(rockerFrameAt(T),0);
  assert.equal(rockerFrameAt(T/4),1);
  assert.equal(rockerFrameAt(T/2),ROCKER.frames/2);

  /* The chair carries the deck lift: the draw list gives a prop one anchor,
     the one that sorts. */
  const chair=frames[0];
  const lowest=(()=>{
    for(let y=chair.h-1;y>=0;y--)
      for(let x=0;x<chair.w;x++) if(chair.occ[y*chair.w+x]) return y;
    return -1;
  })();
  assert.equal(chair.ay-lowest,Math.round(LAKEHOUSE.trunkM*PX_PER_M));
});

test('the place clears the settlement, the refugia and the flora',()=>{
  for(const seed of SEEDS){
    const gen=makeWorldGen(seed,OPT);
    const L=gen.swampLakehouse,s=gen.swampSettlement;
    assert.ok(Math.hypot(L.x-s.landing.x,L.y-s.landing.y)>400,
      `seed ${seed}: the keeper lives in the settlement's lap`);
    for(const h of s.houses)
      assert.ok(Math.hypot(h.x-L.x,h.y-L.y)>L.r,
        `seed ${seed}: a pile house was sited inside the compiled place`);
    /* The settlement's own margin off a refuge. The basin may be an alligator
       attractor; a doorway may not. */
    for(const h of gen.alligatorHoles)
      assert.ok(Math.hypot(h.x-L.x,h.y-L.y)-h.r>=84,
        `seed ${seed}: the porch is ${Math.round(Math.hypot(h.x-L.x,h.y-L.y))} px from a gator hole`);
    /* Nothing woody grows through the walls or the deck. */
    assert.equal(gen.keepOutAt(L.x,L.y,0),2);
    assert.equal(gen.keepOutAt(L.seat.x,L.seat.y,0),2);
    assert.equal(gen.keepOutAt(L.x+L.house.half+400,L.y,0),0);
  }
});

/* ── Nothing grows out of the roof ────────────────────────────────────
   Every keep-out is a footprint on the ground plane. A building a hundred
   rows tall occupies a hundred rows of the frame, and a plant anchored inside
   them sorts behind it and paints its crown out of the roof. Measured on the
   compiled frame: the lakehouse's yard ellipse reaches 46 rows up-screen and
   the house 104, so a cypress 60 rows back is legal and grows out of the
   chimney. No woody plant may be anchored in the band the sprite draws
   into. */
test('nothing woody is anchored in the rows a house draws into',()=>{
  const TALL=new Set(['cypress','tupelo','stranglerFig','birch','spruce','snag',
                      'meadowTree','palm','shrub','swampRose','buttonbush']);
  for(const seed of SEEDS.slice(0,4)){
    const gen=makeWorldGen(seed,OPT);
    const L=gen.swampLakehouse;
    /* Heights and half-widths are read off the baked sheet, independent of
       the keep-out's numbers. */
    const lh=makeLakeHouse(()=>0.5,0);
    const buildings=[{x:L.x,y:L.y,half:L.house.half,rows:lh.h},
      ...gen.swampSettlement.houses.map(h=>{
        const sp=makeSwampHouse(()=>0.5,h.variant||0);
        return {x:h.x,y:h.y,half:sp.w>>1,rows:sp.h};
      })];
    const c0=Math.floor((L.y-CH*2)/CH);
    const hits=[];
    for(let cy=c0;cy<c0+5;cy++)for(let cx=Math.floor((L.x-CH*2)/CH);
                                    cx<Math.floor((L.x+CH*2)/CH);cx++){
      const c=gen.bakeChunk(cx,cy);
      for(const q of c.props){
        if(!TALL.has(q.kind)) continue;
        for(const b of buildings){
          const dy=q.y-b.y;
          if(Math.abs(q.x-b.x)<b.half&&dy>-b.rows&&dy<0)
            hits.push(`${q.kind} at ${q.x},${q.y} is ${-dy} rows up-screen of `
              +`the ${b.rows}-row building at ${b.x},${b.y}`);
        }
      }
      c.tex.dispose();
    }
    assert.equal(hits.length,0,`seed ${seed}: ${hits[0]}`);
  }
});

test('the compiled place is deterministic and owns exactly its architecture',()=>{
  const a=makeSwampLakehouse(SEED,syntheticEnv());
  const b=makeSwampLakehouse(SEED,syntheticEnv());
  assert.deepEqual(
    {x:a.x,y:a.y,pond:a.pond,seat:a.seat,ladder:a.ladder,architecture:a.architecture},
    {x:b.x,y:b.y,pond:b.pond,seat:b.seat,ladder:b.ladder,architecture:b.architecture});
  assert.deepEqual(a.architecture.map(q=>q.kind).sort(),
    ['houseLadder','lakeHouse','rockingChair']);
  assert.equal(a.architecture.find(q=>q.kind==='rockingChair').rock,true);
  assert.equal(a.waterAt(a.pond.cx,a.pond.cy),true);
  assert.equal(a.waterAt(a.x,a.y),false);
  /* A ground circle is an ellipse with ry = rx/2 under this projection,
     unrounded. */
  assert.equal(a.pond.ry,a.pond.rx/2);
  /* The override is bounded: outside the influence box it returns its input
     untouched. */
  assert.equal(a.hydrologyAt(a.x+4000,a.y,0.123,0.2),0.123);
  assert.equal(a.sample(a.x+4000,a.y),null);

  /* Two worlds from one seed agree about where the place is. */
  const p=makeWorldGen(SEED,OPT).swampLakehouse;
  const q=makeWorldGen(SEED,OPT).swampLakehouse;
  assert.deepEqual([p.x,p.y,p.pond,p.seat,p.ladder],[q.x,q.y,q.pond,q.seat,q.ladder]);
});

test('the keeper reads his own gauge and sits in his own chair',()=>{
  const gen=makeWorldGen(SEED,OPT);
  const L=gen.swampLakehouse;
  const plan=compileCulturePlan(gen,'swamp-water-road');
  const nodes=Object.fromEntries(plan.nodes.map(n=>[n.id,n]));
  assert.ok(nodes['swamp-sinkhole:seat']);
  assert.ok(nodes['swamp-sinkhole:water-mark']);
  /* The node is beside the chair. Bound to the chair's own coordinate, the
     standing keeper covers the sprite exactly. */
  assert.deepEqual([nodes['swamp-sinkhole:seat'].x,nodes['swamp-sinkhole:seat'].y],
    [L.seatStand.x,L.seatStand.y]);
  const asideM=Math.abs(L.seatStand.x-L.seat.x)/PX_PER_M;
  assert.ok(asideM>=0.60&&asideM<=1.20,
    `the keeper stands ${asideM.toFixed(2)} m from the chair`);
  assert.ok(Math.abs(L.seatStand.x-L.x)<L.house.half,
    'the keeper stands off the end of his own balcony');
  /* The mark is cut into the leg nearest the water and read over the rail.
     The settlement cuts high-water memory into the left pile of every house;
     a basin holding its level makes the mark yield a number. */
  assert.deepEqual(
    [nodes['swamp-sinkhole:water-mark'].x,nodes['swamp-sinkhole:water-mark'].y],
    [L.railGauge.x,L.railGauge.y]);
  assert.equal(nodes['swamp-sinkhole:water-mark'].source,'lakeHouse');
  /* He stands above the leg he is reading, within a lean of it. */
  assert.ok(Math.abs(L.railGauge.x-L.gauge.x)<=Math.round(0.8*PX_PER_M),
    'he cannot see the mark he is supposed to be reading');
  /* The threshold is the head of the ladder, the way in. */
  assert.deepEqual(
    [nodes['swamp-sinkhole:threshold'].x,nodes['swamp-sinkhole:threshold'].y],
    [L.ladderHead.x,L.ladderHead.y]);
  assert.equal(nodes['swamp-sinkhole:threshold'].source,'houseLadder');
  assert.equal(L.ladderHead.x,L.ladder.x,'the head is not over the ladder foot');

  /* Every work node is on the balcony, and the deck lifts him onto it. The
     lift belongs to the ground: the draw list paints him a storey up and
     sorts him at the row he stands on, because the building is one billboard
     whose far wall and near deck share a single anchor. */
  for(const id of ['seat','water-mark','threshold']){
    const n=nodes['swamp-sinkhole:'+id];
    assert.equal(gen.standLift(n.x,n.y),L.deck.lift,
      `the ${id} node is off the deck, so he would stand under his own house`);
  }
  assert.equal(L.deck.lift,Math.round(LAKEHOUSE.trunkM*PX_PER_M));
  /* Zero elsewhere: the world is a flat plane. */
  assert.equal(gen.standLift(L.x+400,L.y),0);
  assert.equal(gen.standLift(L.x,L.y+200),0);

  const row=plan.residents.find(q=>q.id==='swampLakekeeper');
  assert.deepEqual(row.nodeBindings['seat'],['swamp-sinkhole:seat']);
  assert.deepEqual(row.nodeBindings['water-mark'],['swamp-sinkhole:water-mark']);
  /* Two water marks. Each keeper reads his own. */
  const boatwright=plan.residents.find(q=>q.id==='swampBoatwright');
  assert.deepEqual(boatwright.nodeBindings['water-mark'],['swamp-landing:water-mark']);

  assert.equal(activeSchedule(RESIDENTS.swampLakekeeper,500).action,'sit');
  assert.equal(activeSchedule(RESIDENTS.swampLakekeeper,500).nodeKind,'seat');
  assert.equal(activeSchedule(RESIDENTS.swampLakekeeper,360).action,'record-water-mark');

  /* No seated pose exists. `sit` stays bound to the chair and resolves
     through the clip fallback; the node, the anchor and the hours hold. */
  assert.ok(LIFE.swampLakekeeper.actions.includes('sit'));
  assert.ok(!LIFE.swampLakekeeper.expressions.includes('sit'));
  assert.ok(LIFE.swampLakekeeper.nonClaims.includes('seated-pose-exists'));
  assert.equal(ACTOR.swampLakekeeper.key,'swampFisher');
  assert.equal(ACTOR.swampLakekeeper.figure,true);
  const bank=castStates(CAST_BY_KEY[ACTOR.swampLakekeeper.key]);
  assert.equal(bank.sit,undefined);
  assert.ok(bank.walk>0,'the keeper has no bank at all to fall back to');
});

test('the sinkhole reaches the streamed chunk as props, solids and deep water',()=>{
  const gen=makeWorldGen(SEED,OPT);
  const L=gen.swampLakehouse;
  /* The place is wider than one chunk, so every chunk it touches is baked. */
  const chunks=[],seen=[];
  for(let cy=Math.floor((L.y-L.r)/CH);cy<=Math.floor((L.y+L.r)/CH);cy++)
    for(let cx=Math.floor((L.x-L.r)/CH);cx<=Math.floor((L.x+L.r)/CH);cx++){
      const q=gen.bakeChunk(cx,cy,true);
      chunks.push(q);
      for(const p of q.props)
        if(['lakeHouse','houseLadder','rockingChair'].includes(p.kind))
          seen.push(p);
    }
  for(const k of ['lakeHouse','houseLadder','rockingChair'])
    assert.ok(seen.some(p=>p.kind===k),`${k} never reached a streamed chunk`);
  const chair=seen.find(p=>p.kind==='rockingChair');
  assert.equal(chair.rock,true);
  assert.ok(chunks.some(q=>q.solids.length>0));
  for(const q of chunks)
    assert.ok(q.props.length<=64&&q.solids.length<=64,
      'the compiled place blew the chunk placement budget');

  /* Baked water and the analytic collider describe one hole: the mask and the
     depth ramp read the same override. */
  const pc=gen.bakeChunk(Math.floor(L.pond.cx/CH),Math.floor(L.pond.cy/CH),true);
  const lx=L.pond.cx-Math.floor(L.pond.cx/CH)*CH;
  const ly=L.pond.cy-Math.floor(L.pond.cy/CH)*CH;
  assert.equal(pc.water[ly*CH+lx],1,'the basin centre baked as land');
  assert.equal(gen.hydrologyAt(L.pond.cx,L.pond.cy).water,true);
});
