import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEER_CLIPS, DEER_SLIP, DEER_SPEED, DEER_TRAVEL_PX, GALLOP_CONTACTS,
  ROE_DEER_LIFE, deerPose, measureDeer,
} from '../src/body-deer.js';
import { makeRoeDeer, projectLeg } from '../src/figure-deer.js';
import { RNG } from '../src/rng.js';

const STATES=['idle','walk','gallop'];
const DIRS=[0,1,2];
const sprite=(state,dir,frame)=>makeRoeDeer(new RNG(0xc4a4c3),frame,dir,state);
const materialKey=(sp)=>`${sp.w}x${sp.h}:`+Array.from(sp.occ).join(',');

function connectedFraction(sp){
  const start=sp.occ.findIndex(Boolean);
  if(start<0)return 1;
  const seen=new Uint8Array(sp.occ.length),stack=[start];
  seen[start]=1;
  let count=0,total=0;
  for(const m of sp.occ)if(m)total++;
  while(stack.length){
    const i=stack.pop(),x=i%sp.w,y=(i-x)/sp.w;
    count++;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=sp.w||yy>=sp.h)continue;
      const j=yy*sp.w+xx;
      if(!seen[j]&&sp.occ[j]){seen[j]=1;stack.push(j);}
    }
  }
  return count/total;
}

test('northern roe-buck measurements resolve from life through the shared scale',()=>{
  const M=measureDeer();
  assert.deepEqual(ROE_DEER_LIFE.bodyLengthM,[1.07,1.27]);
  assert.deepEqual(ROE_DEER_LIFE.shoulderM,[0.65,0.84]);
  assert.equal(M.bodyLength,18);
  assert.equal(M.withers,11);
  assert.equal(M.sacrum,12);
  assert.equal(M.chestDepth,4);
  assert.equal(M.skull,3);
  assert.equal(M.ear,2);
  assert.equal(M.velvet,3);
  assert.equal(M.silhouetteLength,20);
  assert.equal(M.coatDepth,5);
  assert.equal(M.antlerSilhouette,5);
  assert.equal(M.alertHeight,22);
  assert.ok(M.sacrum>M.withers,'roe deer lost its diagnostic high rump');
});

test('idle lowers to feed, holds a chew, and raises without moving its hooves',()=>{
  const poses=Array.from({length:DEER_CLIPS.idle.n},(_,frame)=>deerPose({state:'idle',frame}));
  assert.deepEqual(poses.map((pose)=>pose.head.drop),[0,0,0.35,0.72,1,1,0.65,0.25]);
  assert.deepEqual(poses.map((pose)=>pose.headMode),
    ['alert','listen','lower','lower','browse','browse','raise','raise']);
  assert.ok(poses[4].head.muzzle.y>poses[2].head.muzzle.y);
  assert.ok(poses[6].head.muzzle.y<poses[4].head.muzzle.y);
  for(const pose of poses)assert.equal(pose.contacts.length,4);
});

test('walk is a single-foot sequence with three supports and no flight',()=>{
  const strikes=[];
  for(let frame=0;frame<DEER_CLIPS.walk.n;frame++){
    const P=deerPose({state:'walk',frame});
    assert.equal(P.contacts.length,3,`walk frame ${frame} does not have three supports`);
    assert.equal(P.flight,false,`walk frame ${frame} became aerial`);
    strikes.push(...P.feet.filter((foot)=>foot.event==='strike').map((foot)=>foot.limb));
  }
  assert.deepEqual(strikes,['LH','LF','RH','RF']);
});

test('escape is the documented roe-deer rotary gallop with two flight poses',()=>{
  const masks=[];
  for(let frame=0;frame<DEER_CLIPS.gallop.n;frame++){
    const P=deerPose({state:'gallop',frame});
    masks.push(P.contacts.map((foot)=>foot.limb).sort());
    assert.equal(P.flight,GALLOP_CONTACTS[frame].length===0);
  }
  assert.deepEqual(masks,GALLOP_CONTACTS.map((row)=>[...row].sort()));
  assert.deepEqual(masks.filter((row)=>row.length===1).flat(),['RH','LH','LF','RF']);
  assert.deepEqual(masks.map((row,i)=>row.length?null:i).filter((v)=>v!==null),[0,4]);
});

test('every production hoof target preserves all three deer-leg segments',()=>{
  for(const state of STATES)for(let frame=0;frame<DEER_CLIPS[state].n;frame++){
    const P=deerPose({state,frame});
    for(const leg of P.legs){
      assert.ok(leg.reachError<1e-9,`${state} f${frame} ${leg.limb} clamps its ankle`);
      assert.ok(leg.segmentError<1e-9,`${state} f${frame} ${leg.limb} changes segment length`);
      if(leg.contact)assert.equal(leg.hoof.y,P.M.ground,`${state} f${frame} ${leg.limb} floats`);
    }
  }
});

test('profile legs raster as straight load lines with one inward knee pixel',()=>{
  for(let frame=0;frame<DEER_CLIPS.walk.n;frame++){
    const P=deerPose({state:'walk',frame});
    for(const leg of P.legs){
      const Q=projectLeg({cx:13,dir:2},leg);
      const lineX=(t)=>Math.round(Q.root.x+(Q.hoof.x-Q.root.x)*t);
      assert.equal(Q.joint.x-lineX(0.40),leg.kind==='hind'?1:-1,
        `${leg.limb} knee is not the one-pixel inward break`);
      assert.equal(Q.ankle.x,lineX(0.72),`${leg.limb} distal leg is not straight`);
    }
  }
});

test('walk and gallop cadence derive from one declared deer slip',()=>{
  for(const state of ['walk','gallop']){
    const cyclesPerSecond=DEER_CLIPS[state].rate/DEER_CLIPS[state].n;
    const slip=DEER_SPEED[state]/(cyclesPerSecond*DEER_TRAVEL_PX[state]);
    assert.ok(Math.abs(slip-DEER_SLIP)<1e-12,`${state} slip ${slip} != ${DEER_SLIP}`);
  }
});

test('the raster stays grounded, connected, normalised and state-complete',()=>{
  for(const state of STATES)for(const dir of DIRS){
    const frames=[];
    for(let frame=0;frame<DEER_CLIPS[state].n;frame++){
      const sp=sprite(state,dir,frame);
      frames.push(materialKey(sp));
      assert.deepEqual([sp.w,sp.h,sp.ax,sp.ay],[27,23,13,22]);
      assert.ok(sp.poseDeer,`${state} dir${dir} f${frame} lost pose metadata`);
      assert.equal(connectedFraction(sp),1,`${state} dir${dir} f${frame} disconnected`);
      for(let i=0;i<sp.occ.length;i++)if(sp.occ[i]){
        assert.ok(sp.occ[i]===2||sp.occ[i]===4,`unknown deer material ${sp.occ[i]}`);
        const n=Math.hypot(sp.nx[i],sp.ny[i],sp.nz[i]);
        assert.ok(Number.isFinite(n)&&Math.abs(n-1)<2e-5,
          `${state} dir${dir} f${frame} normal ${i} has length ${n}`);
      }
    }
    assert.equal(new Set(frames).size,DEER_CLIPS[state].n,
      `${state} dir${dir} collapsed ${DEER_CLIPS[state].n-new Set(frames).size} frames`);
  }
});

test('the alert silhouette keeps its declared stylized envelope and directional patch',()=>{
  for(const dir of DIRS){
    const sp=sprite('idle',dir,0),rows=[];
    for(let i=0;i<sp.occ.length;i++)if(sp.occ[i])rows.push((i/sp.w)|0);
    assert.equal(Math.max(...rows)-Math.min(...rows)+1,measureDeer().alertHeight);
  }
  const patches=DIRS.map((dir)=>Array.from(sprite('idle',dir,0).occ).filter((m)=>m===2).length);
  assert.equal(patches[0],0,'the front view grew a false white chest');
  assert.ok(patches[1]>=5,'the away view lost the kidney-shaped winter rump patch');
  assert.ok(patches[2]>=2,'the profile lost the edge of the winter rump patch');
});

test('the stylized face is solid and compact velvet reads above every alert view',()=>{
  for(const dir of DIRS){
    const sp=sprite('idle',dir,0),cut=Math.round(sp.poseDeer.neck.poll.y);
    let above=0;
    for(let i=0;i<sp.occ.length;i++)if(sp.occ[i]&&Math.floor(i/sp.w)<cut)above++;
    assert.ok(above>=15,`dir${dir} antlers collapsed to ${above} visible pixels`);
  }
  const sp=sprite('idle',2,0),P=sp.poseDeer;
  let face=0;
  const x0=sp.ax+Math.floor(P.neck.poll.x)-1,x1=sp.ax+Math.ceil(P.head.muzzle.x)+1;
  const y0=Math.floor(P.neck.poll.y)-1,y1=Math.ceil(P.head.muzzle.y)+1;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(sp.occ[y*sp.w+x])face++;
  assert.ok(face>=18,`profile face has only ${face} occupied pixels`);
});

test('deer synthesis is byte-deterministic for every declared bank',()=>{
  for(const state of STATES)for(const dir of DIRS)for(let frame=0;frame<DEER_CLIPS[state].n;frame++){
    const a=sprite(state,dir,frame),b=sprite(state,dir,frame);
    assert.deepEqual(Array.from(a.occ),Array.from(b.occ));
    assert.deepEqual(Array.from(a.shade),Array.from(b.shade));
    assert.deepEqual(Array.from(a.nx),Array.from(b.nx));
    assert.deepEqual(Array.from(a.ny),Array.from(b.ny));
    assert.deepEqual(Array.from(a.nz),Array.from(b.nz));
  }
});
