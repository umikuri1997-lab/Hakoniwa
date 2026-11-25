/* 土のステージ：谷をつなぐ石の大橋（tsuchi-bridge.js）：自然の岩の橋の南の2行・地われをタップして、せいれいに作ってもらう（材料は実数）・
   1マスずつできて、ぜんぶできたら、橋がつながる（歩いてわたれる）・らんかんの花をえらぶ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const a=await J(`(()=>{const L=tsBrCells(),rows=[...new Set(L.map(j=>(j/W)|0))].sort(),r={n:L.length,rows,rift:L.every(j=>riftJ(j)&&!walk(j)),nat:[...tsBrX()].every(x=>walk(TSBRY*W+x)),q:QUESTS.map(q=>q.id).slice(QUESTS.map(q=>q.id).indexOf('tsbridge')-2,QUESTS.map(q=>q.id).indexOf('tsbridge')+1),
      west:L.map(j=>j%W).reduce((m,x)=>Math.min(m,x),99),east:L.map(j=>j%W).reduce((m,x)=>Math.max(m,x),0)};r.west1=walk(L[0]%W-1+((L[0]/W)|0)*W);return r})()`);
  console.log(JSON.stringify(a));assert.equal(a.n,6,'はば3×2行');assert.deepEqual(a.rows,[a.rows[0],a.rows[0]+1]);assert.ok(a.rift);assert.ok(a.nat,'自然の岩の橋は歩ける');assert.deepEqual(a.q,['tsookage','tscave3','tsbridge']);
  /* 目標のまえは、タップしても何も起きない */
  const b0=await J(`(()=>{const j=tsBrCells()[0];return{tap:tsBridgeTap(j)}})()`);assert.equal(b0.tap,false);
  /* ひらく → タップ → 材料とパワーが足りない → たす → かける */
  const b1=await J(`(()=>{S.flags.tsBrOpen=1;const j=tsBrCells()[0];S.pt=0;S.mat.sagan=0;S.mat.stone=0;const t=tsBridgeTap(j);const pop=document.querySelector('.pxpopw');const btn=pop&&[...pop.querySelectorAll('button')].find(b=>b.textContent==='かける');const txt=pop&&pop.textContent;btn.click();const nSite0=tsBrCells().filter(k=>S.obj[k]==='site').length;
      S.pt=500;S.mat.sagan=${36};S.mat.stone=${12};tsBridgeTap(j);const pop2=document.querySelector('.pxpopw');[...pop2.querySelectorAll('button')].find(b=>b.textContent==='かける').click();
      const L=tsBrCells();return{t,txt,nSite0,sites:L.filter(k=>S.obj[k]==='site').length,pt:S.pt,d:S.dyn[L[0]],walkNo:L.every(k=>!walk(k))}})()`);
  console.log(JSON.stringify(b1));assert.ok(b1.t);assert.equal(b1.nSite0,0,'足りないときは、かからない');assert.equal(b1.sites,6);assert.equal(b1.pt,500-24);assert.equal(b1.d.build,'tsbridge');assert.deepEqual(b1.d.mat,{sagan:6,stone:2});assert.ok(b1.walkNo);assert.ok(b1.txt.includes('砂岩36'),b1.txt);
  /* 1マスずつ、できる（finishBuild）。ぜんぶできると、橋がつながる */
  const c=await J(`(()=>{const L=tsBrCells(),r={};finishBuild(L[0],null);r.one=[S.ground[L[0]],S.obj[L[0]],walk(L[0]),tsKind(L[0]%W,(L[0]/W)|0),!!S.flags.tsBridge,S.ts.brd.length];
      for(const j of L.slice(1))finishBuild(j,null);r.all=[!!S.flags.tsBridge,L.every(j=>walk(j)&&S.ground[j]===0),L.every(j=>tsKind(j%W,(j/W)|0)==='b'),!riftJ(L[0])];return r})()`);
  console.log(JSON.stringify(c));assert.deepEqual(c.one,[0,'',true,'b',false,1]);assert.deepEqual(c.all,[true,true,true,true]);
  /* 橋をわたれる：北の岸から南の岸へ（地われの西→東） */
  const d=await J(`(()=>{const L=tsBrCells(),y=(L[0]/W)|0,xs=L.filter(j=>((j/W)|0)===y).map(j=>j%W),w=Math.min(...xs)-1,e=Math.max(...xs)+1;const A=y*W+w,B=y*W+e;return{w:walk(A),e:walk(B),path:!!(typeof findPath==='function'?findPath(A,B):true)}})()`);
  console.log(JSON.stringify(d));assert.ok(d.w&&d.e);
  /* らんかんの花：えらぶ → 橋の絵を描いても、エラーが出ない */
  const e=await J(`(()=>{S.ts.brFlower='salvia';S.flags.tsBridge=1;try{rebuildStatic(true);render(performance.now())}catch(x){return{err:String(x)}}return{ok:1,f:S.ts.brFlower,col:TSBRFL[S.ts.brFlower]}})()`);
  console.log(JSON.stringify(e));assert.ok(e.ok);
  /* 地われをうめる（橋のあと）：橋のとなりの行から1行ずつ。となりでない行・上限の外はうめられない。切りはなされたマスは水にならない */
  const f=await J(`(()=>{const r={};const y0=TSBRY-1;r.row0=tsFillRow(y0);r.row1=tsFillRow(y0-1);r.sRow=tsFillRow(TSBR2Y+2);r.far=tsFillRow(TSBR2Y+2+TSFILLROWS);
      r.gapWater=[...Array(W).keys()].some(x=>{const j=(TSBRY+2)*W+x;return S.ground[j]===1&&Math.abs(x-tsRiftAt(TSBRY))<4});
      const cells=tsRowRift(y0);r.n=cells.length;S.pt=500;S.mat.sagan=60;S.mat.stone=20;
      r.tap=tsFillTap(cells[0]);const b=[...document.querySelectorAll('.pxpopw button')].find(b=>b.textContent==='うめる');b.click();
      r.sites=cells.filter(k=>S.obj[k]==='site').length;r.pt=S.pt;for(const k of cells)finishBuild(k,null);
      r.after=[cells.every(k=>S.ground[k]===0&&walk(k)),tsRowRift(y0).length,tsFillRow(y0-1),tsFillRow(y0-2),tsKind(cells[0]%W,y0)];
      const loose=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x;if(S.ground[j]===1&&!riftJ(j)&&Math.abs(x-tsRiftAt(y))<4&&y<TSBRY+8&&y>TSBRY-3)loose.push(j)}r.loose=loose.length;
      rebuildStatic(true);render(performance.now());return r})()`);
  console.log(JSON.stringify(f));assert.equal(f.row0,true);assert.equal(f.row1,false,'となりでない行は、まだ');assert.equal(f.sRow,true);assert.equal(f.far,false,'上限の外');assert.equal(f.gapWater,false,'橋とあいだの行は水にならない');assert.ok(f.tap);assert.equal(f.sites,f.n);assert.equal(f.pt,500-4*f.n);assert.deepEqual(f.after,[true,0,true,false,'b']);assert.equal(f.loose,0);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
