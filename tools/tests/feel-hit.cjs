/* 手ざわり：たおした反応は白く止まったあと・ヒットストップの長さ・画面のゆれの段・木や岩のゆれ・こわす・ことわる */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  /* 1. ヒットストップは、ふつう・大きなダメージ・わざで長さがちがう。止まっているあいだ、受けた側がふるえる */
  const hs=JSON.parse(await run(`(()=>{const a={x:5,y:5},b={x:5,y:5},c={x:5,y:5};hitFx(a,1,{sx:4,sy:5});hitFx(b,1,{sx:4,sy:5,big:1});hitFx(c,1,{sx:4,sy:5,skill:1});const t=performance.now();
    const sh=[hitOff(a,t+5,1)[0],hitOff(a,t+35,1)[0]];return JSON.stringify({s:[HITV.get(a).s,HITV.get(b).s,HITV.get(c).s],stopA:hitOff(a,t+90,1)[2],stopB:hitOff(b,t+90,1)[2],sh})})()`));
  assert.deepEqual(hs.s,[70,110,130]);assert.equal(hs.stopA,false);assert.equal(hs.stopB,true);assert.notEqual(hs.sh[0],hs.sh[1],'the hit target must tremble during the stop');
  console.log('Hit stop: 70 / 110 / 130 ms and the target trembles');
  /* 2. たおしたとき：音・数字・知らせは、白く止まったあと */
  const df=JSON.parse(await run(`(()=>{const L=[];const o=sfx;window.sfx=k=>{if(k==='defeat')L.push(performance.now())};const e={type:'basic',x:CX,y:CY+3,hp:0,max:100,spawned:1,id:999,path:[],f:0};S.enemies.push(e);const t=performance.now();defeat(e);window._df={L,t,o};return JSON.stringify({now:L.length,pend:JPTPEND})})()`));
  assert.equal(df.now,0,'the defeat sound must not play before the KO hold');assert.ok(df.pend>0,'the top power number waits for the particles');
  await page.waitForTimeout(400);
  const df2=JSON.parse(await run(`(()=>{const d=window._df;window.sfx=d.o;return JSON.stringify({n:d.L.length,dt:d.L.length?d.L[0]-d.t:-1})})()`));
  assert.equal(df2.n,1);assert.ok(df2.dt>=170,'defeat sound after KO_HOLD ('+df2.dt+')');
  console.log('Defeat: sound and power after the white hold ('+Math.round(df2.dt)+' ms)');
  /* 3. 画面のゆれ：小さいゆれは、大きいゆれを上書きしない */
  const sk=JSON.parse(await run(`(()=>{const v=document.getElementById('cv');shakeScreen('l');const a=v.className;shakeScreen('s');const b=v.className;return JSON.stringify({a,b})})()`));
  assert.ok(/\bshk\b/.test(sk.a));assert.ok(/\bshk\b/.test(sk.b)&&!/shk2/.test(sk.b),'a small shake must not cut a big one');
  console.log('Screen shake: 3 levels, small does not override big');
  /* 4. 木・岩：たたくとゆれる。ことわると、ふるえる */
  const jt=JSON.parse(await run(`(()=>{const j=(CY+6)*W+CX+6;natJolt(j,1);const t=performance.now();const a=natJoltOff(j,t+10),b=natJoltOff(j,t+50),c=natJoltOff(j,t+200);refuseFx(CX+6,CY+6);return JSON.stringify({a,b,c,r:REFUSE.length})})()`));
  assert.equal(jt.a,1.5);assert.equal(jt.b,-.75);assert.equal(jt.c,0);assert.equal(jt.r,1);
  console.log('Tree/rock jolt and refusal frame');
  /* 5. こわす：置くときの着地・音の上がりをしない。写しがうきあがる。つづけるほど低い音 */
  const rm=JSON.parse(await run(`(()=>{let x=CX+8,y=CY+8;for(let k=0;k<30&&!canPlace('stool',x,y,true);k++){x++}const j=y*W+x;giveItem('stool',2,1);place('stool',x,y);const had=S.obj[j];LANDFX.delete(j);const n0=TOASTN;removeAt(x,y);
    const g=RMFX.length,land=LANDFX.has(j);place('stool',x,y);removeAt(x,y);return JSON.stringify({had,now:S.obj[j]||'',g,land,n:RMCOMBO.n,ref:REFUSE.length})})()`));
  assert.equal(rm.had,'stool');assert.equal(rm.now,'');assert.ok(rm.g>=1,'a ghost of the removed object');assert.equal(rm.land,false);assert.equal(rm.n,1,'second remove in a row steps down');
  console.log('Remove: ghost, no landing, descending sound');
  /* 6. こわせない所：ふるえる */
  const nr=JSON.parse(await run(`(()=>{REFUSE.length=0;const j=+Object.keys(S.obj).find(k=>S.obj[k]==='statueb'||S.obj[k]==='statue');removeAt(j%W,(j/W)|0);return JSON.stringify({r:REFUSE.length})})()`));
  assert.equal(nr.r,1,'refusing to remove the temple shakes the cell');
  console.log('Remove refusal shakes the cell');
  if(errors.length)console.log(JSON.stringify(errors).slice(0,1500));assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
