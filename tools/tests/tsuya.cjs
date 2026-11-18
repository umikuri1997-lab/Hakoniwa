/* つやつやの作物：たねをまいてから、どの朝も水が切れなかった畑は、収穫+1（hYield・収穫）。一度でも朝にかわいていたら、ふつう。まく前の古い畑（d.ts なし）もふつう */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const J=async s=>JSON.parse(await run(s));
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.hold=0;dialog=()=>{};S.rain=false})()`);
  const a=await J(`(()=>{const mk=x=>{const j=50*W+x;S.obj[j]='farm';S.dyn[j]={crop:'mugi',sown:false,g:0,wet:0};S.cseed.mugi=(S.cseed.mugi||0)+1;sowFarm(S.dyn[j]);return j};
    const A=mk(40),B=mk(42),C=50*W+44;S.obj[C]='farm';S.dyn[C]={crop:'mugi',sown:true,g:0,wet:100};
    const grow=wetB=>{S.dyn[A].wet=100;S.dyn[B].wet=wetB?100:0;S.dyn[C].wet=100;morning()};
    grow(true);grow(false);grow(true);grow(true);/* B だけ、2回めの朝にかわいていた */
    const base=CROPS.mugi.yield;const r=S.res[0];r.carry=[];const before=S.dyn[A].g;
    const out={base,gA:S.dyn[A].g,gB:S.dyn[B].g,yA:hYield(A,0),yB:hYield(B,0),yC:hYield(C,0),tA:tsuyaOf(A),tB:tsuyaOf(B),tC:tsuyaOf(C)};
    const c0=carryN(r),fl=fx.length;let dropped=0;const od=dropAt;dropAt=(x,y,k,n)=>{dropped+=n};ACT.harvest.end(r,{obj:A,food:1});dropAt=od;out.after=tsuyaOf(A);out.got=carryN(r)-c0+dropped;out.glow=fx.length>fl;out.wood=r.elem==='wood'?1:0;return JSON.stringify(out)})()`);
  assert.equal(a.gA,100);assert.equal(a.tA,1,'watered every morning: tsuya');assert.equal(a.tB,0,'dry once: not tsuya');assert.equal(a.tC,0,'an old farm without the mark is not tsuya');
  assert.equal(a.yA,a.yB+1,'tsuya yields one more');assert.equal(a.yC,a.yB);assert.equal(a.after,0,'the mark clears after the harvest');assert.ok(a.got>=a.yA,'the harvest gives the tsuya bonus: '+a.got);
  console.log('Tsuya: yield '+a.yA+' vs '+a.yB+'; harvested '+a.got);
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
