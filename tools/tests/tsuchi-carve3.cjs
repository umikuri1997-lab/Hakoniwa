/* 土のお話：彫り絵3「あなぐまの足あと」（6階の坂のそば。ツチノオオカゲを追いはらったあと）→ トトが、ひとりで洞窟のおくへにげて、パーティからも村からもいなくなる。
   ツチノオオカゲの前は、出ない・トトがいないと、見ない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:2});
  const J=async s=>JSON.parse(await run(`JSON.stringify(${s})`));
  const talk=async()=>{for(let k=0;k<200;k++){const st=await run(`(()=>{if(!document.querySelector('#dialog').hidden||DLGQ.length){DLGGAP=0;DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const c=!document.querySelector('#dialog').hidden&&document.querySelector('#dialog button');if(c){c.disabled=false;c.click()}else dlgNext();return 'dlg'}return 'none'})()`);if(st==='none')return;await page.waitForTimeout(150)}throw new Error('会話がおわらない')};
  const enter=names=>J(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.t=Math.floor(S.t/1440)*1440+9*60;const L=${JSON.stringify(names)}.map(n=>S.res.find(r=>r.name===n)).filter(Boolean);caveEnter(L,{},5);const C=CV;C.en=[];let R=-1;for(const[j,o]of C.ob)if(o.k==='R')R=j;return{theme:C.F.theme,carve:C.carve&&C.carve.n,party:C.party.map(a=>a.r.name),R}})()`);
  const atSlope=()=>run(`(()=>{const C=CV;let R=-1;for(const[j,o]of C.ob)if(o.k==='R')R=j;for(const a of C.party){a.x=cvX(R)+.5;a.y=cvY(R)+.5+CVOY;a.path=[]}cvClearCheck()})()`);
  /* じゅんび：土のステージで、トトとイブキがいる。ツチノオオカゲの前 */
  await run(`(()=>{S.ts.carve=[0,1];S.cvClr=5;delete S.flags.tsOokDown;if(!S.res.some(r=>r.name===IBUKI)){const q=mkRes(S,'ibuki-t',KEYS?'fire':'fire',CX+.5,CY+2.5);q.name=IBUKI;S.res.push(q)}})()`);
  const a0=await enter([ 'トト','イブキ']);console.log(JSON.stringify(a0));assert.equal(a0.carve,null,'ツチノオオカゲの前は、彫り絵3は出ない');
  await run(`caveAbort()`);
  /* ツチノオオカゲのあと */
  await run(`(()=>{S.flags.tsOokDown=1})()`);
  const a1=await enter(['トト','イブキ']);console.log(JSON.stringify(a1));assert.equal(a1.carve,2);assert.deepEqual(a1.party,['トト','イブキ']);
  await atSlope();await page.waitForTimeout(1800);
  const t1=await J(`(()=>{const p=document.querySelector('.pxpopw');const t=p&&p.querySelector('.ppt').textContent;const b=p&&[...p.querySelectorAll('button')].find(b=>b.textContent==='つぎへ');b&&b.click();return{t,img:!!(p&&p.querySelector('canvas'))}})()`);
  console.log(JSON.stringify(t1));assert.equal(t1.t,'あなぐまの足あと');assert.ok(t1.img);
  await talk();await page.waitForTimeout(400);
  const t2=await J(`(()=>{const C=CV,g=S.ts.totoGone;const r={seen:(S.ts.carve||[]).slice(),party:C.party.map(a=>a.r.name),away:(S.cvAway||[]).map(r=>r.name),gone:g&&g.name,inRes:S.res.some(r=>r.name===TOTO)};return r})()`);
  console.log(JSON.stringify(t2));assert.deepEqual(t2.seen,[0,1,2]);assert.deepEqual(t2.party,['イブキ']);assert.ok(!t2.away.includes('トト'));assert.equal(t2.gone,'トト');assert.ok(!t2.inRes);
  await run(`(()=>{document.querySelectorAll('.idea-reveal').forEach(e=>e.remove());GIFT_ACTIVE=false})()`);
  const t3=await J(`(()=>{caveExit(true);document.querySelectorAll('.pxpopw').forEach(e=>e.remove());return{clr:S.cvClr,toto:S.res.some(r=>r.name===TOTO),ib:S.res.some(r=>r.name===IBUKI),gone:!!S.ts.totoGone,must:tsCaveMust()}})()`);
  console.log(JSON.stringify(t3));assert.equal(t3.clr,6);assert.ok(!t3.toto&&t3.ib&&t3.gone);assert.equal(t3.must,null,'トトがいなくても、出かけられる');
  /* セーブ・ロードしても、トトはいない（とっておいた子も、もどる） */
  const t4=await J(`(()=>{const s=JSON.parse(JSON.stringify(S.ts));return{g:s.totoGone&&s.totoGone.name,el:s.totoGone&&s.totoGone.elem}})()`);
  console.log(JSON.stringify(t4));assert.equal(t4.g,'トト');assert.equal(t4.el,'earth');
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
