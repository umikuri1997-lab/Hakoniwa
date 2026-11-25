/* 御神木の切り株の下の2×2マスは、だれも通れない（SACREDBASE・STUMPB）。芽が出る行・「芽！」の行は、セリフを読んだら会話のわくをしまって場面を見せ（dlgAway）、動きがおわったら、もどして「つぎへ」 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;S.enemyOn=false;`);
  /* 1. 切り株の下の4マス */
  const w=JSON.parse(await run(`(()=>{const s=fieldStump(S.sacredRoot);return JSON.stringify({base:[s,s-1,s-W,s-W-1].map(walk),side:[s+1,s-2,s+W,s-1+W].map(walk),floor:[s-W-1,s+1].map(k=>sacredNoBuild(k,'path'))})})()`));
  assert.deepEqual(w,{base:[false,false,false,false],side:[true,true,true,true],floor:[true,false]});
  console.log('stump: the 2x2 under the stump is not walkable');
  /* 2. わくをしまう */
  await run(`(()=>{const f=S.res.find(r=>r.name===FUTABA),s=fieldStump(S.sacredRoot);f.x=(s+W-2)%W+.5;f.y=((s+W)/W|0)+.5;f.path=[];f.act=null;f.nap=false;
    sacredDirection(true);dialog(KS([["F","待って。前に来たときも、ここにあった？",0,"stree:bud"],["N","……芽だねぇ。"],["F","#joy|芽！",0,"stree:gaze"],["N","うん。"]]),()=>{})})()`);
  const watch=async ms=>{const L=[];const t0=Date.now();while(Date.now()-t0<ms){L.push(JSON.parse(await run(`JSON.stringify({a:document.querySelector('#dialog').classList.contains('away'),d:!!document.querySelector('#dlgBtns button')?.disabled,v:getComputedStyle(document.querySelector('#dialog .dlg')).visibility})`)));await page.waitForTimeout(120)}return L};
  for(const k of['bud','gaze']){
    const L=await watch(4400),i=L.findIndex(x=>x.a),j=L.findIndex((x,n)=>n>i&&!x.a);
    assert(i>0,k+': the box is shown first, then put away');assert(j>i,k+': the box comes back');
    assert(L.slice(i,j).every(x=>x.d&&x.v==='hidden'),k+': hidden while the motion plays');assert.equal(L[L.length-1].d,false,k+': next is enabled after');
    if(k==='gaze')assert.equal(await run(`sacredPose(S.res.find(r=>r.name===FUTABA))?.anim`),'kneelGaze');
    console.log(k+': box hidden while the scene plays, then back with next');
    await run(`document.querySelector('#dlgBtns button').click()`);if(k==='bud'){await page.waitForTimeout(1500);await run(`document.querySelector('#dlgBtns button').click()`)}}
  assert.equal(await run(`document.querySelector('#dialog').classList.contains('away')`),false);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
