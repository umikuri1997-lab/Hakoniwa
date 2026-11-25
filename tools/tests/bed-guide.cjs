/* ベッドの目標の指の案内：はたおり機を置く → はたおり機をタップ → 数をえらんで「おる」 → 依頼ボードでベッドをはる → 家の中に置く */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;S.qStory=null;S.quest=QUESTS.findIndex(q=>q.id==='bed');S.qTalked=true;S.inv.loom=1;S.orders=[];setMode('look');`);
  const lbl=async(pre='')=>run(`(()=>{${pre};updTut();const h=$('#tutHand');return h.hidden?'':h.querySelector('.lbl').textContent})()`);
  assert.equal(await lbl(),'「おく」をタップ');
  const j=await run(`(()=>{for(let r=2;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=CX+dx,y=CY+4+dy;if(canPlace('loom',x,y,true)){const j=y*W+x;S.obj[j]='loom';S.dyn[j]={};S.inv.loom=0;recount();return j}}return -1})()`);
  assert.ok(j>=0);
  assert.equal(await lbl(`centerOn((j%W+.5)*TS,((j/W)|0)*TS)`.replace(/j/g,j)),'はたおり機をタップ');
  await run(`S.mat.kasa=(S.mat.kasa||0)+6;boxSync&&boxSync();prPop(${j})`);
  assert.equal(await lbl(),'「＋」で数をえらぶ');
  assert.equal(await run(`$('#tutHand').style.zIndex`),'46','hand is drawn above the popup');
  await run(`$('#prPop .ks .p').click()`);
  assert.equal(await lbl(),'「おる」をタップ');
  await run(`$('#prPop .go').click()`);
  assert.equal(await lbl(),'','wait while weaving');
  /* せいれいが草を分けて運ぶとき（運んでいる2こ・のこり1こ）も、布をおるのを待つ */
  await run(`S.prQ={${j}:{kasa:1}};S.prIn={};S.prOut={};S.res[0].ppk={j:${j},m:{kasa:2}}`);
  assert.equal(await lbl(),'','wait while grass is split between the box and a spirit');
  assert.equal(await run(`bedStep()`),'手順 2/4 布をおっている');
  /* おりおわって、せいれいが布を箱へ運んでいるあいだも待つ */
  await run(`S.prQ={};S.res[0].ppk=null;S.res[0].cmat={nuno:1}`);
  assert.equal(await lbl(),'','wait while a spirit carries the cloth to a box');
  await run(`S.res[0].cmat=null`);
  await run(`if(BOARD<0){const free=(x,y,w,h)=>{for(let b=0;b<h;b++)for(let c=0;c<w;c++){const k=(y+b)*W+x+c;if(S.obj[k]||S.ground[k]||hiAt(k)||(S.fog&&S.fog[k]))return false}return true};let p=null;for(let y=CY-12;y<CY+20&&!p;y++)for(let x=CX-14;x<CX+14;x++)if(free(x,y,6,3)){p=[x,y];break}const k=p[1]*W+p[0]+1;S.obj[k]='statue';S.obj[k+1]='board';S.obj[k+2]='part';S.ref[k+2]=k+1;recount()}S.prQ={};S.prIn={};S.prOut={};S.mat.nuno=1;boxSync&&boxSync();centerOn((BOARD%W+1)*TS,((BOARD/W)|0)*TS)`);
  assert.equal(await lbl(),'依頼ボードをタップ');
  await run(`S.recipes.bed=true;openSheet('craft')`);{const t=await lbl();assert.ok(/ベッドの「はる」|待とう|タップ|けそう/.test(t),t);console.log('craft sheet: '+t)}
  await run(`closeSheet()`);
  await run(`S.orders.push({type:'bed',p:0})`);assert.equal(await lbl(),'');
  await run(`S.orders=[];S.mat.nuno=0;S.res[0].cmat={};S.res[0].citem={bed:1}`);assert.equal(await lbl(),'');{const t=await page.evaluate(()=>bedStep());assert.ok(/3\/4 ベッドができた/.test(t),t);console.log('carrying: '+t)}
  await run(`S.res[0].citem=null;S.drops=(S.drops||[]).filter(d=>d.id!=='mat:nuno')`);
  await run(`S.orders=[];S.inv.bed=1;setMode('look')`);assert.equal(await lbl(),'「おく」をタップ');
  console.log('Bed guide: loom → weave → board → place');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
