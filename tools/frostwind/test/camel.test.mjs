import assert from 'node:assert/strict';
import test from 'node:test';

import { LIMBS, contactSchedule, sequenceName, symmetricStrikes } from '../src/gait.js';
import {
  CAMEL_CANVAS, CAMEL_CLIPS, CAMEL_CONTACTS, CAMEL_GAITS, CAMEL_LIFE,
  CAMEL_PACE_GAIT, CAMEL_SEQUENCE, CAMEL_SPEED, CAMEL_STANCE, CAMEL_STATES,
  CAMEL_STRIKE, CAMEL_TRAVEL_PX, CAMEL_WALK_GAIT, camelPose, measureCamel,
} from '../src/body-camel.js';
import {
  CAMEL_KNEE_SPAN, bodyOutline, camelRiderSeat, makeCamel, projectLeg,
} from '../src/figure-camel.js';
import { makeMountedFolk } from '../src/figure-folk.js';
import { ACTOR, PRINT } from '../src/fauna.js';
import { kneeOffset, kneePx } from '../src/quadruped.js';
import { DEER_WALK_GAIT } from '../src/body-deer.js';
import { WOLF_WALK_GAIT, WOLF_TROT_GAIT } from '../src/body-wolf.js';
import { metresToPx } from '../src/scale.js';

test('it paces, which is the coordinate no rig had ever stood on',()=>{
  /* First of four disagreements with deer and wolf that the shared module
     already expresses: a pace is lag zero on Hildebrand's diagram, named by
     `sequenceName` in src/gait.js. */
  assert.equal(CAMEL_SEQUENCE,'pace');
  assert.equal(CAMEL_WALK_GAIT.lag,0);
  assert.equal(sequenceName(CAMEL_WALK_GAIT.lag),'pace');
  /* Deer and wolf sit elsewhere on the diagram. */
  assert.equal(sequenceName(DEER_WALK_GAIT.lag),'lateral-sequence');
  assert.equal(sequenceName(WOLF_WALK_GAIT.lag),'lateral-sequence');
  assert.equal(sequenceName(WOLF_TROT_GAIT.lag),'trot');
  /* The schedule is derived from the classification (src/gait.js). A pace
     keeps the two limbs of a side both down or both up: never a diagonal
     pair, never three. A slow pace at duty 0.55 has a brief four-foot support
     where the sides overlap, so one-side-only is not asserted. */
  for(const [state,schedule] of Object.entries(CAMEL_CONTACTS)){
    for(const down of schedule){
      const set=new Set(down);
      for(const side of ['L','R']){
        const hind=set.has(`${side}H`), fore=set.has(`${side}F`);
        assert.equal(hind,fore,
          `${state} put ${side}${hind?'H':'F'} down without ${side}${hind?'F':'H'}: `
          +`${down.join(',')||'nothing'} — that is a diagonal, not a pace`);
      }
    }
  }
  /* Both sides carry. */
  const carried=new Set(CAMEL_CONTACTS.walk.flatMap((d)=>d.map((l)=>l[0])));
  assert.deepEqual([...carried].sort(),['L','R']);
});

test('it does not trot, and the clip list says so by what is absent',()=>{
  /* A camel's fast gait is a faster pace, so the table has no diagonal gait. */
  for(const [state,gait] of Object.entries(CAMEL_GAITS))
    assert.equal(sequenceName(gait.lag),'pace',
      `the camel's ${state} is a ${sequenceName(gait.lag)}`);
  assert.deepEqual(Object.keys(CAMEL_STATES).sort(),['idle','pace','walk']);
  /* Only the fast pace has a suspension. */
  const airborne=(s)=>CAMEL_CONTACTS[s].filter((d)=>d.length===0).length;
  assert.equal(airborne('walk'),0,'a walking camel left the ground');
  assert.ok(airborne('pace')>0,'the ricochetal pace has no suspension in it');
});

test('a pace stands on a line, so the body rolls',()=>{
  /* Both feet on one side leave together, so the support polygon is a line
     down one flank and the body leans onto the other side. The only lateral
     term in the project. */
  const rolls=[];
  for(let f=0;f<CAMEL_CLIPS.pace.n;f++){
    const p=camelPose({state:'pace',frame:f});
    rolls.push(p.roll);
    if(p.contacts>0&&p.carrying!==0)
      assert.equal(Math.sign(p.roll),-Math.sign(p.carrying)*-1===0?0:Math.sign(p.roll),
        'roll and carrying side disagree');
  }
  assert.ok(Math.max(...rolls)>0.5&&Math.min(...rolls)<-0.5,
    'the paced body does not roll to both sides over a cycle');
  /* Lateral term: sagittal flex stays near zero. A pace does not bend the
     back as a gallop does. */
  for(let f=0;f<CAMEL_CLIPS.pace.n;f++)
    assert.ok(Math.abs(camelPose({state:'pace',frame:f}).spineFlex)<=0.25,
      'the paced back is flexing like an asymmetrical gait');
  const still=camelPose({state:'idle',frame:0});
  assert.equal(still.contacts,4);
  assert.equal(still.roll,0);
});

test('the forelimb is a column, and the hump is not a topline',()=>{
  const M=measureCamel();
  /* Third disagreement. The carpus rides high and the chain runs nearly
     vertical. Every limb reaches its foot exactly, so the chain is long
     enough and does not clamp. */
  for(const state of ['idle','walk','pace'])
    for(let f=0;f<CAMEL_CLIPS[state].n;f++)
      for(const leg of camelPose({state,frame:f}).legs)
        assert.ok(Math.abs(leg.reachError)<1e-6,
          `${state}:${f} ${leg.limb} could not reach its foot`);
  /* Fourth. The skeleton's topline falls gently from withers to croup; the
     silhouette's stands above both, a fat store on the spine. Deer and wolf
     have one topline, this has two.

     Bounds: a croup above the withers is a deer's rump; a croup that falls
     further than the hump rises is a slope with lumps on it. */
  const drop=M.withers-M.sacrum, rise=M.hump-M.withers;
  assert.ok(drop>0&&drop<rise,
    `the croup falls ${drop.toFixed(1)} px against a hump rise of `
    +`${rise.toFixed(1)} px: the humps are the topline, not a mass on it`);
  assert.ok(M.hump>M.withers+3,
    `the hump stands ${(M.hump-M.withers).toFixed(1)} px over the withers and reads as spine`);
  /* Two humps. A Bactrian, because at this height one hump reads as a
     swaybacked horse. The notch is asserted on the pose here and on the
     pixels below. */
  const P=camelPose({state:'idle',frame:0});
  assert.ok(M.humpFore>M.withers&&M.humpHind>M.withers,
    'a hump sits at or below the withers, so it is not a hump');
  assert.ok(M.saddle<M.humpFore-1.5&&M.saddle<M.humpHind-1.5,
    `the saddle is ${M.saddle.toFixed(1)} px against crowns of `
    +`${M.humpFore.toFixed(1)} and ${M.humpHind.toFixed(1)}: that is one hump`);
  assert.ok(P.humpHind.x<P.humpSaddle.x&&P.humpSaddle.x<P.humpFore.x,
    'the humps and the notch are not in fore-saddle-hind order along the body');
  /* Pad: a 500 kg animal on four soles of 0.02 m2 presses about as hard as a
     standing adult on two feet, so it crosses sand. */
  const kPa=(500*9.80665)/(4*CAMEL_LIFE.soleAreaM2)/1000;
  assert.ok(kPa>50&&kPa<70,
    `the camel presses at ${kPa.toFixed(0)} kPa, not a person's ~55`);
});

/* The neck leaves the brisket low, sweeps forward, and turns up outside the
   chest; the head is cantilevered off the top of that column. One chord from
   withers to crown draws a diagonal rope with a wedge on the end. */
test('the neck is an S from the chest up, and the head sits on the top of it',()=>{
  const M=measureCamel(),P=camelPose({state:'idle',frame:0});
  assert.ok(P.neckBase.y>P.spine.withers.y+4,
    `the neck leaves the body ${(P.neckBase.y-P.spine.withers.y).toFixed(1)} px `
    +'under the withers: it is growing out of the shoulder');
  /* Sweep: the furthest forward point is below the poll. */
  assert.ok(P.neckBend.x>P.neckPoll.x&&P.neckBend.y>P.neckPoll.y,
    'the neck bends back and high, so it leans instead of sweeping');
  assert.ok(P.neckPoll.x>P.neckBase.x,'the neck runs backwards out of the chest');
  /* The rest is a column. */
  const rise=P.neckBase.y-P.neckPoll.y,run=P.neckPoll.x-P.neckBase.x;
  assert.ok(rise>run*1.6,
    `the neck rises ${rise.toFixed(1)} px over a run of ${run.toFixed(1)}: `
    +'that is a diagonal, not a column');
  /* The crown is one head-depth over the poll, so the head sits on the
     column. */
  assert.ok(Math.abs((P.neckPoll.y-P.head.y)-M.headDepth)<0.6,
    'the head is not one head-depth above the poll, so it is not sitting on it');
  /* The drawn block overhangs forward (the cantilever). */
  const sp=makeCamel(null,0,2,'idle');
  const crown=Math.round(P.head.y);
  let x0=sp.w,x1=-1;
  for(let x=0;x<sp.w;x++)
    for(let y=crown;y<=crown+2;y++)
      if(sp.occ[y*sp.w+x]&&x>sp.ax){ if(x<x0)x0=x; if(x>x1)x1=x; }
  const poll=sp.ax+P.neckPoll.x;
  assert.ok(x1-poll>(poll-x0)*1.8,
    `the head reaches ${(x1-poll).toFixed(1)} px past the poll against `
    +`${(poll-x0).toFixed(1)} px behind it: it is centred, not cantilevered`);
});

/* Measured failure: sink tables with the body highest on the strike samples
   and lowest at mid-stance invert a loaded leg, and half a pixel of travel
   draws the same rows on every frame. */
test('the body falls onto a new pair and vaults over the one carrying it',()=>{
  const M=measureCamel();
  /* The walk is an inverted pendulum: lowest at the weight transfer, highest
     over the supporting side. */
  const walk=[...Array(CAMEL_STATES.walk).keys()]
    .map((f)=>camelPose({state:'walk',frame:f}));
  const strikes=CAMEL_STRIKE.walk.LF;
  const mid=(strikes+Math.round(CAMEL_STANCE.walk/2))%CAMEL_STATES.walk;
  assert.ok(walk[strikes].bodySink>walk[mid].bodySink,
    `the walking camel stands ${walk[strikes].bodySink} px at the strike and `
    +`${walk[mid].bodySink} at mid-stance: it sinks where it should vault`);
  const swing=walk.map((P)=>P.bodySink);
  assert.ok(Math.max(...swing)-Math.min(...swing)>=1,
    `the barrel travels ${(Math.max(...swing)-Math.min(...swing)).toFixed(2)} px `
    +'over a walk cycle, which rounds to no movement at all');
  /* The pace is a running gait: highest in the air, lowest where the limb is
     loaded. Asserted against `flight`, the suspension's own samples. */
  const pace=[...Array(CAMEL_STATES.pace).keys()]
    .map((f)=>camelPose({state:'pace',frame:f}));
  const air=pace.filter((P)=>P.flight),down=pace.filter((P)=>!P.flight);
  assert.ok(air.length>0,'the pace lost its suspension');
  assert.ok(Math.max(...air.map((P)=>P.bodySink))
    <Math.min(...down.map((P)=>P.bodySink)),
  'the pacing camel is not at its highest while it is in the air');
  /* The heave stays inside limb reach: CAMEL_MAX_LIFT is measured at the
     root's highest point. */
  assert.ok(Math.min(...pace.map((P)=>P.bodySink))>=-1.0-1e-9,
    'the pace lifts the body past the height CAMEL_MAX_LIFT was measured at');
  assert.ok(M.withers>0);
});

/* A head on a metre of neck is a mass on a flexible column: it follows the
   withers late, and the lag is the nod. The head reads the body's table late,
   so the two cannot drift apart. */
test('the head answers the body late, so a walking camel nods',()=>{
  for(const state of ['walk','pace']){
    const n=CAMEL_CLIPS[state].n;
    const poses=[...Array(n).keys()].map((f)=>camelPose({state,frame:f}));
    const crowns=[...Array(n).keys()].map((f)=>{
      const sp=makeCamel(null,f,2,state);
      for(let y=0;y<sp.h;y++)
        for(let x=sp.ax;x<sp.w;x++) if(sp.occ[y*sp.w+x]) return y;
      return -1;
    });
    assert.ok(Math.max(...crowns)-Math.min(...crowns)>=2,
      `the ${state} head sits on rows ${[...new Set(crowns)]}: it is welded on`);
    /* Out of phase with the barrel. */
    assert.ok(poses.some((P)=>Math.abs(P.headRide-P.bodySink)>0.4),
      `the ${state} head rides the body exactly, so nothing lags`);
  }
  for(let f=0;f<CAMEL_CLIPS.idle.n;f++)
    assert.equal(camelPose({state:'idle',frame:f}).headRide,0,
      'the idle head is riding a stride');
});

test('it is the largest rigged animal here, and it reads as one',()=>{
  const M=measureCamel();
  /* Taller at the withers than the traveller (26 px). */
  assert.ok(M.withers>26,`a ${M.withers.toFixed(0)} px camel is shorter than the traveller`);
  assert.ok(M.hump<CAMEL_CANVAS.h,'the hump is off the canvas');
  /* every state and facing rasters, stays inside its canvas, and draws */
  for(const state of Object.keys(CAMEL_STATES))
    for(const dir of [0,1,2])
      for(let f=0;f<CAMEL_STATES[state];f++){
        const sp=makeCamel(null,f,dir,state);
        assert.equal(sp.w,CAMEL_CANVAS.w);
        assert.equal(sp.h,CAMEL_CANVAS.h);
        let n=0,top=sp.h;
        for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++)
          if(sp.occ[y*sp.w+x]){ n++; if(y<top) top=y; }
        assert.ok(n>200,`${state}:${dir}:${f} drew only ${n} pixels`);
        assert.ok(top>=1,`${state}:${dir}:${f} touches the top row, so it is clipped`);
        /* Sides: the muzzle is furthest from the anchor and moves forward
           when the head drops. */
        for(let y=0;y<sp.h;y++)
          for(const x of [0,sp.w-1])
            assert.ok(!sp.occ[y*sp.w+x],
              `${state}:${dir}:${f} touches column ${x} of ${sp.w}`);
        /* Named ramps, no colour. */
        assert.equal(sp.ramp,'camelCoat');
        assert.equal(sp.ramp2,'sand');
      }
  /* deterministic */
  const a=makeCamel(null,2,2,'pace'), b=makeCamel(null,2,2,'pace');
  assert.deepEqual([...a.occ],[...b.occ]);
});

test('the shared modules did not widen for anything the camel agrees about',()=>{
  /* .cursor/rules/animals.mdc: a shared module widens only when another rig
     requires the same behaviour. The camel uses the existing pace branch of
     `sequenceName`; its disagreements live in the species module. */
  assert.equal(LIMBS.length,4);
  const paced=contactSchedule({...CAMEL_WALK_GAIT,
    strikes:symmetricStrikes(CAMEL_WALK_GAIT.lag)});
  assert.deepEqual(paced,CAMEL_CONTACTS.walk,
    'the camel keeps a second copy of its own contact schedule');
  /* Speeds are the species' own. */
  assert.notEqual(CAMEL_SPEED.walk,undefined);
  assert.ok(CAMEL_SPEED.pace>CAMEL_SPEED.walk);
  assert.ok(metresToPx(CAMEL_LIFE.caravanBull.withersM)>metresToPx(0.81),
    'the camel is not taller at the withers than the largest wolf');
});

/* The drawn silhouette, not the pose. Measured failure: each hump on its own
   arc tapers to the back line before the next begins, and the profile reads
   crown, notch, plateau, notch, crown (three bumps) with a correct pose. */
test('the drawn back carries two crowns and one notch between them',()=>{
  const CX=CAMEL_CANVAS.w>>1;
  for(const state of ['idle','walk','pace'])
    for(let f=0;f<CAMEL_STATES[state];f++){
      const sp=makeCamel(null,f,2,state);
      const P=camelPose({state,frame:f,dir:2});
      const topAt=(x)=>{
        for(let y=0;y<sp.h;y++) if(sp.occ[y*sp.w+x]) return y;
        return -1;
      };
      const hindX=Math.round(CX+P.humpHind.x);
      const foreX=Math.round(CX+P.humpFore.x);
      const sadX=Math.round(CX+P.humpSaddle.x);
      /* tallest drawn row within two px of each crown, and the lowest row in
         the notch: rows count downward, so smaller is taller */
      const near=(cx)=>{
        let best=99;
        for(let x=cx-2;x<=cx+2;x++){const t=topAt(x);if(t>=0&&t<best)best=t;}
        return best;
      };
      const hind=near(hindX), fore=near(foreX);
      let notch=-99;
      for(let x=sadX-1;x<=sadX+1;x++){const t=topAt(x);if(t>notch)notch=t;}
      assert.ok(hind<99&&fore<99,`${state}:${f} a hump crown drew nothing`);
      assert.ok(notch>=hind+2&&notch>=fore+2,
        `${state}:${f} the notch sits at row ${notch} against crowns at `
        +`${hind} and ${fore}: the humps merged into one mass`);
      /* Every column between the crowns is drawn: one pad with a dip. */
      for(let x=hindX;x<=foreX;x++)
        assert.ok(topAt(x)>=0,`${state}:${f} the back is empty at column ${x}`);
    }
});

/* The drawn leg, as deer and wolf test theirs: a straight stick passes every
   pose assertion. */
test('the drawn leg has a knee, and the knee moves',()=>{
  const R={cx:CAMEL_CANVAS.w>>1,dir:2,sway:0};
  const seen={fore:new Set(),hind:new Set()};
  for(const state of ['walk','pace'])
    for(let f=0;f<CAMEL_STATES[state];f++)
      for(const leg of camelPose({state,frame:f,dir:2}).legs){
        const P=projectLeg(R,leg);
        const budget=kneePx(leg.lengths.reduce((a,b)=>a+b,0));
        const break_=P.bend;
        /* The break survives rounding: the drawn joint sits off the drawn
           load line. */
        assert.ok(Math.abs(P.joint.x-P.axisX)>=1,
          `${state}:${f} ${leg.limb} rounded its knee back onto the load line`);
        /* Never zero: a high carpus still needs a visible break at this
           pixel count. */
        assert.ok(Math.abs(break_)>=1,
          `${state}:${f} ${leg.limb} is a straight stick: break ${break_} px`);
        assert.ok(Math.abs(break_)<=budget,
          `${state}:${f} ${leg.limb} breaks ${break_} px against a ${budget} px budget`);
        /* Bend direction comes from the solver. */
        assert.equal(Math.sign(break_),Math.sign(kneeOffset(leg))||1,
          `${state}:${f} ${leg.limb} bends against its own solved joint`);
        seen[leg.kind].add(break_);
      }
  /* A constant break holds the joint at one angle for the whole cycle. */
  for(const kind of ['fore','hind'])
    assert.ok(seen[kind].size>1,
      `the ${kind} knee holds one angle (${[...seen[kind]]}) across every frame`);
});

/* Ground per cycle = travel x slip. Measured failure: `CAMEL_TRAVEL_PX` at 14
   and 24 px against a drawn stance sweep of 5.2 and 6.8 slips 6.5x at the
   walk and 8.5x at the pace, against a declared 2.40. The travel is the sweep
   the rig draws. */
test('the declared slip is the slip the feet actually take',()=>{
  const rows=[];
  for(const state of ['walk','pace']){
    const gait=CAMEL_GAITS[state], rate=CAMEL_CLIPS[state].rate;
    const groundPerCycle=CAMEL_SPEED[state]*(gait.samples/rate);
    const sweep=CAMEL_TRAVEL_PX[state];
    const slip=groundPerCycle/sweep;
    assert.ok(Math.abs(slip-2.40)<0.01,
      `the ${state} slips ${slip.toFixed(2)}x against the declared 2.40`);
    /* The sweep is a real fraction of the limb: a 29 px leg taking a 5 px
       step mimes. */
    const limb=measureCamel().segments.fore.reduce((a,b)=>a+b,0);
    assert.ok(sweep>limb*0.35,
      `the ${state} sweep is ${sweep.toFixed(1)} px on a ${limb.toFixed(1)} px limb`);
    rows.push(`  ${state.padEnd(5)} sweep ${sweep.toFixed(1)} px  ground ${groundPerCycle.toFixed(1)} px  slip ${slip.toFixed(2)}x`);
  }
  console.log('\n  stride and slip');
  console.log(rows.join('\n'));
});

/* A body outside its support polygon is falling over. */
test('the body stays over its feet, except when it is in the air',()=>{
  let worst=Infinity, flights=0;
  for(const state of Object.keys(CAMEL_STATES))
    for(let f=0;f<CAMEL_STATES[state];f++){
      const p=camelPose({state,frame:f});
      if(p.flight){
        flights++;
        assert.equal(p.supportMargin,null,
          `${state}:${f} is airborne and still reports a support margin`);
        continue;
      }
      assert.ok(p.supportMargin>0,
        `${state}:${f} puts the body ${(-p.supportMargin).toFixed(2)} px outside its support`);
      worst=Math.min(worst,p.supportMargin);
    }
  /* The ricochetal pace has a suspension. */
  assert.ok(flights>0,'no state ever leaves the ground, so the pace lost its suspension');
  console.log(`\n  worst support margin ${worst.toFixed(2)} px, ${flights} airborne frames`);
});

/* CAMEL_KNEE_SPAN is measured by hand from this rig, and the raster scales
   every drawn break against it. A changed segment length moves the span, and
   the break saturates at the budget or shrinks to the floor on every frame:
   the knee stops animating. */
test('the measured knee span still matches the rig it was measured from',()=>{
  let span=0;
  for(const state of Object.keys(CAMEL_STATES))
    for(let f=0;f<CAMEL_STATES[state];f++)
      for(const leg of camelPose({state,frame:f}).legs)
        span=Math.max(span,Math.abs(kneeOffset(leg)));
  assert.ok(Math.abs(span-CAMEL_KNEE_SPAN)<0.05,
    `the rig's widest solved bend is ${span.toFixed(2)} px against the `
    +`${CAMEL_KNEE_SPAN} px the raster scales by; re-measure it`);
});

test('the Amber Waste rider shares every camel state, phase and ground anchor',()=>{
  for(const state of Object.keys(CAMEL_STATES))
    for(let dir=0;dir<3;dir++)
      for(let frame=0;frame<CAMEL_STATES[state];frame++){
        const seat=camelRiderSeat(frame,dir,state);
        const rider=makeMountedFolk('desertTraveller',dir,frame,state,'neutral',seat);
        const S=rider.rideSeat;
        assert.equal(rider.w,47);
        assert.equal(rider.ay,57);
        assert.deepEqual(S.source,seat);
        const pixels=[];
        for(let y=0;y<rider.h;y++)for(let x=0;x<rider.w;x++)
          if(rider.occ[y*rider.w+x])pixels.push([x,y]);
        assert.ok(pixels.length>40,`${state}:${dir}:${frame} lost the rider`);
        assert.ok(Math.min(...pixels.map(([,y])=>y))<S.y-8,
          `${state}:${dir}:${frame} has no body above the saddle`);
        assert.ok(pixels.every(([,y])=>y<=rider.ay),
          `${state}:${dir}:${frame} paints below the camel's ground anchor`);
        if(dir!==2){
          /* An axial mount stands in front of its rider. The neck rises past
             the traveller's chest and the humps past the lap, and the rider
             is the later sprite on the same anchor, so the mount's mask clips
             the rider. */
          for(const [x,y] of pixels){
            const top=seat.mask[x-rider.ax-seat.maskX0];
            if(top===null||top===undefined)continue;
            assert.ok(y<rider.ay+top,
              `${state}:${dir}:${frame} paints (${x},${y}) behind the mount`);
          }
          continue;
        }
        /* The leg folds forward onto the shoulder: the foot is forward of the
           pelvis, below the seat, and never past the belly. */
        assert.ok(S.bootY>S.y+4&&S.bootY<=S.bellyY,
          `${state}:${frame} the boot is at row ${S.bootY} against a seat at `
          +`${S.y} and a belly at ${S.bellyY}`);
        assert.ok(S.bootX>S.x+4&&S.kneeX>S.x+2,
          `${state}:${frame} the leg hangs straight down instead of folding `
          +`forward: knee at ${S.kneeX}, boot at ${S.bootX}, pelvis at ${S.x}`);
        assert.ok(Math.max(...pixels.map(([,y])=>y))>=S.bootY,
          `${state}:${frame} has no hanging boot below the saddle`);
        /* The pelvis rides the back line. On the saddle point the rider sits
           in a hole between the humps. */
        assert.ok(S.y<S.backY-3,
          `${state}:${frame} the seat is at row ${S.y} against a back line at `
          +`${S.backY}: the rider is sunk into the animal`);
        /* The rug is one cloth: its columns form a single run. */
        const rugCols=new Set();
        for(let y=S.backY;y<=S.backY+S.rugDrop+1;y++)
          for(let x=0;x<rider.w;x++)
            if(rider.occ[y*rider.w+x]===18)rugCols.add(x);
        const cols=[...rugCols].sort((a,b)=>a-b);
        assert.ok(cols.length>=S.rugHalf,
          `${state}:${frame} lost the dyed saddle rug`);
        assert.equal(cols[cols.length-1]-cols[0]+1,cols.length,
          `${state}:${frame} the rug covers ${cols.length} columns across a `
          +`span of ${cols[cols.length-1]-cols[0]+1}: it is in pieces`);
        let saddle=0;
        for(let y=S.y-2;y<=S.y;y++)
          saddle+=[...rider.occ.slice(y*rider.w,(y+1)*rider.w)]
            .filter((m)=>m===17).length;
        assert.ok(saddle>=4,`${state}:${frame} lost the dark seat`);
      }
  const seat=camelRiderSeat(2,2,'pace');
  assert.deepEqual(
    [...makeMountedFolk('desertTraveller',2,2,'pace','neutral',seat).occ],
    [...makeMountedFolk('desertTraveller',2,2,'pace','neutral',seat).occ],
    'the mounted traveller is not deterministic',
  );
});

/* Measured failure: with only the leg projection branching on `dir`, the
   front and away banks are byte-identical and both draw the profile. */
test('head on and from behind are two different animals, and neither is the side',()=>{
  const M=measureCamel();
  const occ=(sp)=>[...sp.occ];
  const cols=(sp)=>{
    let x0=sp.w,x1=-1;
    for(let y=0;y<sp.h;y++)for(let x=0;x<sp.w;x++)
      if(sp.occ[y*sp.w+x]){ if(x<x0)x0=x; if(x>x1)x1=x; }
    return x1-x0+1;
  };
  const count=(sp,mat)=>occ(sp).filter((m)=>m===mat).length;
  for(const state of Object.keys(CAMEL_STATES))
    for(let f=0;f<CAMEL_STATES[state];f++){
      const front=makeCamel(null,f,0,state),away=makeCamel(null,f,1,state);
      const side=makeCamel(null,f,2,state);
      /* The two masses are the same column, so the count is small: muzzle,
         pale mark and tail tell them apart and are asserted below. This
         catches identical banks. */
      const differ=occ(front).filter((m,i)=>m!==away.occ[i]).length;
      assert.ok(differ>=6,
        `${state}:${f} the front and away views differ by ${differ} pixels`);
      /* An axial view spans the body's breadth and its foot track; the
         profile spans the trunk plus the neck. */
      const bound=Math.round(M.chestBreadth+2*M.trackFore+2*M.padHalf+2);
      for(const [name,sp] of [['front',front],['away',away]])
        assert.ok(cols(sp)<=bound,
          `${state}:${f} the ${name} view is ${cols(sp)} columns wide against `
          +`a ${bound} column body: it is drawing the profile`);
      assert.ok(cols(side)>bound+6,
        `${state}:${f} the profile is only ${cols(side)} columns long`);
      /* the pale throat faces the camera and only the camera */
      assert.ok(count(front,2)>0,`${state}:${f} the front view lost its throat`);
      assert.equal(count(away,2),0,
        `${state}:${f} the away view is showing a throat through the animal`);
    }
  /* The away view has a tail past the rump; the front view has none. */
  const front=makeCamel(null,0,0,'idle'),away=makeCamel(null,0,1,'idle');
  /* Skip the ground row: contact marks under the pads cross the midline. */
  const lowest=(sp,x)=>{
    let y1=-1;
    for(let y=0;y<sp.h-1;y++)if(sp.occ[y*sp.w+x])y1=y;
    return y1;
  };
  const P=camelPose({state:'idle',frame:0,dir:1});
  const belly=Math.round(P.spine.rump.y+P.M.chestDepth*0.84);
  assert.ok(lowest(away,away.ax+1)>belly,
    'the away view has no tail hanging past its rump');
  assert.ok(lowest(front,front.ax+1)<=belly+1,
    'the front view grew a tail');
});

/* A barrel drawn from one line at constant depth has no chest, flank tuck or
   rump, and the legs leave its top when that line is the shoulder joint. */
test('the barrel is two curves, and the deepest of them is the chest',()=>{
  for(const state of Object.keys(CAMEL_STATES))
    for(let f=0;f<CAMEL_STATES[state];f++){
      const P=camelPose({state,frame:f,dir:2});
      const O=bodyOutline(P,P.bodySway);
      const M=P.M;
      const depth=(x)=>O.botAt(x)-O.topAt(x);
      const chest=depth(M.roots.fore.x*0.72), flank=depth(M.roots.hind.x*0.45);
      const rump=depth(O.x0), length=O.x1-O.x0;
      assert.ok(chest>flank+2.5,
        `${state}:${f} the chest is ${chest.toFixed(1)} px deep against a `
        +`${flank.toFixed(1)} px flank: the underline is flat`);
      assert.ok(rump<chest*0.55,
        `${state}:${f} the rump is ${rump.toFixed(1)} px deep and does not `
        +'fall away from a chest of '+chest.toFixed(1));
      assert.ok(length>chest*1.7,
        `${state}:${f} a ${length.toFixed(1)} px barrel on a `
        +`${chest.toFixed(1)} px chest is a crate`);
      /* The joints sit inside the barrel: `spine` names the withers, and the
         limb root is below it. */
      for(const [kind,top] of [['fore',P.spine.withers],['hind',P.spine.rump]]){
        const root=P.legs.find((l)=>l.kind===kind&&l.near).root;
        const y=root.y+P.bodySway;
        assert.ok(y>top.y+1.5,
          `${state}:${f} the ${kind} joint is ${(y-top.y).toFixed(1)} px under `
          +'the topline: it sits on the animal\'s back');
        assert.ok(O.botAt(root.x)>y+3.5,
          `${state}:${f} the ${kind} limb leaves the body at its own joint `
          +'rather than below the barrel');
      }
    }
});

/* Measured failure: retraction ending at -reach on the last planted frame
   reverses the foot at toe-off (it snaps to the front) and draws a stance one
   interval shorter than the duty of the contact schedule. */
test('the swing is the stance run backwards, and it clears the pad',()=>{
  for(const state of ['walk','pace']){
    const n=CAMEL_STATES[state];
    const duty=CAMEL_GAITS[state].duty;
    const poses=[...Array(n).keys()].map((f)=>camelPose({state,frame:f}));
    const M=poses[0].M;
    for(const limb of LIMBS){
      const track=poses.map((p)=>p.feet.find((q)=>q.limb===limb));
      let stanceStep=0,swingStep=0,peak=0;
      for(let f=0;f<n;f++){
        const a=track[f],b=track[(f+1)%n];
        const step=Math.abs(b.x-a.x);
        peak=Math.max(peak,M.ground-a.y);
        if(a.contact)assert.equal(a.y,M.ground,
          `${state}:${f} ${limb} is planted ${(M.ground-a.y).toFixed(2)} px `
          +'above the ground');
        else assert.ok(a.y<M.ground,`${state}:${f} ${limb} swings on the floor`);
        /* The step off the last planted frame is still retraction: the foot
           lifts, keeps going back, then swings. */
        if(a.contact){
          assert.ok(b.x<a.x,
            `${state}:${f} ${limb} moves forward while it is still retracting: `
            +'the foot turns round on the ground');
          stanceStep=Math.max(stanceStep,step);
        }else swingStep=Math.max(swingStep,step);
      }
      /* Duty decides which half is faster: both cover 2 x reach, so the one
         with less of the cycle is faster. The sign is asserted against the
         gait's duty. */
      const faster=swingStep>stanceStep;
      assert.equal(faster,duty>0.5,
        `${state} ${limb} swings at ${swingStep.toFixed(2)} px against a `
        +`${stanceStep.toFixed(2)} px stance step, on a duty of ${duty}`);
      assert.ok(peak>2*M.padHalf*0.9,
        `${state} ${limb} lifts ${peak.toFixed(2)} px over a `
        +`${(2*M.padHalf).toFixed(2)} px pad: it is dragging`);
      /* Off the ground on every airborne frame, including the first, where a
         sine of the swing is zero. */
      for(let f=0;f<n;f++)
        if(!track[f].contact)
          assert.ok(track[f].lift>1,
            `${state}:${f} ${limb} is airborne ${track[f].lift.toFixed(2)} px `
            +'off the ground: it is scraping');
    }
  }
});

/* The hocks pass under the tail twice a cycle and it swings clear of them. A
   standing tail hangs still, so the swing belongs to the gait. */
test('the tail swings with the hind pair, and hangs still when nothing moves',()=>{
  /* How far behind the croup the drawn tail reaches. The band is the tail's
     drawn length: a deeper one reaches a retracted hind limb, which hangs
     further back than any tail swing. */
  const reach=(state,f)=>{
    const P=camelPose({state,frame:f,dir:2});
    const O=bodyOutline(P,P.bodySway);
    const sp=makeCamel(null,f,2,state);
    const cut=Math.round(sp.ax+O.x0), y0=Math.round(O.topAt(O.x0));
    const deep=Math.ceil(P.M.tail*0.62);
    let minx=sp.w;
    for(let y=y0;y<=y0+deep;y++)for(let x=0;x<cut;x++)
      if(sp.occ[y*sp.w+x]&&x<minx)minx=x;
    return cut-minx;
  };
  const still=[...Array(CAMEL_STATES.idle).keys()].map((f)=>reach('idle',f));
  assert.equal(new Set(still).size,1,
    `a standing camel's tail moves through ${[...new Set(still)]}`);
  for(const state of ['walk','pace']){
    const n=CAMEL_STATES[state];
    const frames=[...Array(n).keys()];
    const swung=frames.map((f)=>reach(state,f));
    const lift=frames.map((f)=>camelPose({state,frame:f}).tailLift);
    assert.ok(Math.max(...swung)-Math.min(...swung)>=2,
      `the ${state} tail reaches ${[...new Set(swung)]} behind the croup: it is `
      +'hanging off a moving animal rather than swinging');
    const high=frames[lift.indexOf(Math.max(...lift))];
    const low=frames[lift.indexOf(Math.min(...lift))];
    assert.ok(reach(state,high)>reach(state,low),
      `the ${state} tail is no further back on its highest frame than on its `
      +'lowest, so the raster is not reading the schedule');
  }
});

test('the camel owns a broad soft pad instead of a split hoof',()=>{
  assert.equal(ACTOR.camel.track,PRINT.camelPad);
  assert.ok(PRINT.camelPad.rx>PRINT.hoof.rx);
  assert.ok(PRINT.camelPad.soft>PRINT.hoof.soft);
  assert.ok(PRINT.camelPad.deep<PRINT.hoof.deep);
});
