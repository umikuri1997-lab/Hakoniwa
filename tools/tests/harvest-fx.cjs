/* 収穫のエフェクトの場所：高い段の上の畑でも、絵（reap）・はじける粒が、その作物の足もと（objFootJ）に立つ。
   地面の点を書かない（gy なし）エフェクトは、うまれた点が、その段の地面の点になる（段の高さだけ上に出る） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const J=async s=>JSON.parse(await run(s));
  await run(`(()=>{document.querySelector('#dialog').hidden=true;USERPAUSE=true;S.introSeen=true;S.hold=0;dialog=()=>{};S.rain=false})()`);
  const a=await J(`(()=>{const out=[];for(const lv of[0,2]){const j=50*W+40;S.hi[j]=lv;S.obj[j]='farm';S.dyn[j]={crop:'mugi',sown:true,g:100,wet:100};
      const r=S.res[0];r.carry={};fx.length=0;const od=dropAt;dropAt=()=>{};ACT.harvest.end(r,{obj:j,food:1});dropAt=od;
      const F=objFootJ(j),near=f=>{const A=fxFoot(f);return Math.abs(A.px-F.px)<.01&&Math.abs(A.py-F.py)<.01&&Math.abs(A.fy-F.fy)<.01};
      const reap=fx.find(f=>f.k==='spr'&&f.n==='reap'),ps=fx.filter(f=>f.k==='p'&&f.A);
      /* 画面の高さ：足もとの画面の点 + (描く y − 足もとの y) × たての大きさ */
      const sy=f=>{const A=fxFoot(f);return A.py+(f.y-A.fy)*IQSY};
      const g={k:'p',x:(j%W+.5)*TS,y:((j/W|0)+.5)*TS};/* gy なし・段の高さをひかない点 */
      out.push({lv,reap:!!reap&&near(reap),reapY:reap?sy(reap)-(F.py-.3*TS*IQSY):null,np:ps.length,ps:ps.every(near),
        plain:sy(g)-(isoY(g.x,g.y)-lv*IQL)})}
    S.hi[50*W+40]=0;return JSON.stringify(out)})()`);
  for(const o of a){assert.ok(o.reap,'lv'+o.lv+': the reap sprite stands at the crop foot');assert.ok(Math.abs(o.reapY)<.01,'lv'+o.lv+': the reap sprite is 0.3 tiles above the foot: '+o.reapY);
    assert.ok(o.np>0&&o.ps,'lv'+o.lv+': the burst particles stand at the crop foot');
    assert.ok(Math.abs(o.plain)<.01,'lv'+o.lv+': an effect without gy sits on the ground of its level: '+o.plain)}
  console.log('Harvest fx: at the crop foot on level 0 and level 2');
  assert.deepEqual(errors,[],'no page errors');await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
