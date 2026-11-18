/* 数がたまって、はじける演出（juice3.js）
   - 朝の日記：「きのうのしごと」の欄が出て、数が0から数え上げられ、さいごに大きなハンコ。タップでとばすと、すぐさいごの数
   - なかよし30：マップにハートが出て、はじけたあとにポップアップ
   - 守りつづけた夜：画面が出ているあいだは前の数、とじたら新しい数にめくれる
   - はじめての料理：名前が「？」から1字ずつ名前になる
   - 地図の切れはし：つなげると、くっつく絵が出て消える
   - つくった数：せいれいの上で数がふえる
   - 村レベル：カードをとじたあと、バーが満ちて、焼き印で数が見える
   どれも、エラーが出ないこと */
const assert=require('node:assert/strict');
(async()=>{
  const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};true`);
  const W8=ms=>page.waitForTimeout(ms);
  /* 日記 */
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.hold=0;const r=S.res[0];S.dy={d:dayNo(),w:{},m:[],k:{},o:{},g:{}};
    for(let i=0;i<7;i++)dyWork(r,'harvest',Object.keys(FOODS)[0]);dyWork(r,'build','fence');dyWork(r,'cook',Object.keys(FOODS)[0]);
    S.ns={n:6,kill:5,hurt:0,broke:0,lost:[]};diaryClose();return 1})()`);
  await W8(200);
  const d0=JSON.parse(await run(`JSON.stringify({sheet,h:[...document.querySelectorAll('#sheetBody .sec h3')].map(e=>e.textContent),v:[...document.querySelectorAll('#sheetBody .stat b')].map(e=>e.textContent)})`));
  console.log('diary start',JSON.stringify(d0));assert.ok(d0.h.includes('きのうのしごと'));assert.ok(d0.v.every(t=>/^0|なし/.test(t)),'はじめは0から');
  await W8(4500);
  const d1=JSON.parse(await run(`JSON.stringify({v:[...document.querySelectorAll('#sheetBody .stat b')].map(e=>e.textContent),st:!!document.querySelector('#sheetBody .ustamp.b')})`));
  console.log('diary end',JSON.stringify(d1));assert.ok(d1.v.includes('7回'));assert.ok(d1.v.includes('5体'));assert.ok(d1.st,'大きなハンコ');
  /* タップでとばす */
  await run(`(()=>{closeSheet();S.dy={d:dayNo(),w:{},m:[],k:{},o:{},g:{}};for(let i=0;i<30;i++)dyWork(S.res[0],'build','fence');diaryClose();return 1})()`);await W8(600);
  await run(`(()=>{document.querySelector('#sheetBody').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return 1})()`);
  const d2=await run(`[...document.querySelectorAll('#sheetBody .stat b')].map(e=>e.textContent).join()`);console.log('skip',d2);assert.ok(d2.includes('30回'));
  await run(`closeSheet();true`);
  /* なかよし */
  const b=JSON.parse(await run(`(()=>{const[a,c]=S.res.length>1?S.res:[S.res[0],Object.assign({},S.res[0],{id:999,name:'テスト'})];if(S.res.length<2)S.res.push(c);S.bond={};const n0=SPOT_POPS.length;bondAdd(a,c,30);return JSON.stringify({h:J3H.length,p:SPOT_POPS.length-n0})})()`));
  console.log('bond',JSON.stringify(b));assert.equal(b.h,1);assert.equal(b.p,0,'ポップアップはハートのあと');
  await W8(1800);assert.ok(+await run(`SPOT_POPS.filter(p=>p.bond).length+document.querySelectorAll('.bondpic').length`)>=1,'ハートのあとにポップアップ');await run(`SPOT_POPS.length=0;document.querySelectorAll('.bondpic').forEach(c=>{const o=c.closest('.idea-reveal');if(o)o.remove()});GIFT_ACTIVE=false;true`);
  /* 守りつづけた夜 */
  await run(`(()=>{S.streak=2;J3ST={s:S,v:2};updHUD();openSheet('menu');S.streak=3;updHUD();return 1})()`);await W8(200);
  const s0=await run(`document.querySelector('#dayLbl .stkn').textContent`);await run(`closeSheet();true`);await W8(400);
  const s1=await run(`document.querySelector('#dayLbl .stkn').textContent`);console.log('streak',s0,s1);assert.equal(s0,'2');assert.equal(s1,'3');
  /* 料理の名前 */
  await run(`(()=>{const nm=document.createElement('span');document.body.appendChild(nm);nm.id='j3nm';juiceNameFlip(nm,'やきりんご');return 1})()`);
  const n0=await run(`document.querySelector('#j3nm').textContent`);await W8(1400);const n1=await run(`document.querySelector('#j3nm').textContent`);console.log('name',n0,n1);assert.equal(n0,'？？？？？');assert.equal(n1,'やきりんご');
  /* 地図 */
  await run(`(()=>{S.mapPc=3;mapJoin();return 1})()`);await W8(300);assert.ok(+await run(`document.querySelectorAll('.j3map').length`)===1);
  await page.screenshot({path:process.env.SHOT||'/tmp/j3map.png'});
  await W8(1500);assert.ok(+await run(`document.querySelectorAll('.j3map').length`)===0);
  /* つくった数 */
  await run(`(()=>{const r=S.res[0];r.cmade={'set:arrow':1};madeStow('set:arrow',1,r);return 1})()`);
  const m=JSON.parse(await run(`JSON.stringify(J3M.map(m=>m.k))`));console.log('made',m);
  /* 村レベル */
  await run(`(()=>{const e=$('#lvLbl');JLVL=+e.textContent;JLVW=80;$('#lvup').hidden=false;e.textContent=+e.textContent+1;return 1})()`);await W8(100);
  const l0=await run(`$('#lvLbl').style.visibility`);await run(`$('#lvup').hidden=true;true`);await W8(2500);const l1=await run(`$('#lvLbl').style.visibility+'|'+$('#xpBar').className`);
  console.log('lv',l0,l1);assert.equal(l0,'hidden');assert.equal(l1,'|');
  console.log('errors',errors);assert.equal(errors.length,0);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
