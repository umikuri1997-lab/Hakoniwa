/* 目標・早送り・よろこび：村のようすの「つぎのレベルでおぼえる物」、見た会話の早送り、夜のコワイノをぜんぶ追いはらったときのよろこび */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  /* 1. 村のようす：つぎのレベルでおぼえる物 */
  const nx=JSON.parse(await run(`(()=>{S.lv=1;const L=nextLevelItems(2);return JSON.stringify({L,ok:L.every(stageItemOK),html:nextLvHtml(2)})})()`));
  assert.ok(nx.L.length>0,'level 2 has something to learn');assert.ok(nx.ok);assert.ok(nx.html.includes('レベル2でおぼえる'));
  const nx2=JSON.parse(await run(`(()=>{const id=nextLevelItems(2)[0];S.unlocked[id]=true;S.recipes[id]=true;const r=!nextLevelItems(2).includes(id);delete S.unlocked[id];delete S.recipes[id];return JSON.stringify(r)})()`));
  assert.ok(nx2,'already learned things are not shown');
  console.log('Village: the next level shows what will be learned');
  /* 2. 見た会話の早送り：はじめては出ない。見おえたら出る。動作の待ちは守る */
  const L=`[['${'フタバ'}','#joy|はじめのセリフ'],['${'フタバ'}','つぎのセリフ'],['${'フタバ'}','さいごのセリフ']]`;
  await run(`DLGGAP=0;DLGTAP=performance.now();dialog(${L})`);await page.waitForTimeout(200);
  assert.equal(await run(`[...document.querySelectorAll('#dlgBtns button')].some(b=>b.textContent==='はやおくり')`),false,'no fast-forward the first time');
  for(let i=0;i<12&&!(await run(`document.querySelector('#dialog').hidden`));i++){await page.waitForTimeout(1100);await run(`(()=>{const b=document.querySelector('#dlgBtns button[data-nx]');if(b&&!b.disabled)b.click()})()`);await page.waitForTimeout(260);await run(`(()=>{const b=document.querySelector('#dlgBtns button[data-nx]');if(b&&!b.disabled)b.click()})()`)}
  assert.equal(await run(`document.querySelector('#dialog').hidden`),true);
  await page.waitForTimeout(3300);
  await run(`DLGGAP=0;DLGTAP=performance.now();dialog(${L})`);await page.waitForTimeout(150);
  assert.equal(await run(`[...document.querySelectorAll('#dlgBtns button')].some(b=>b.textContent==='はやおくり')`),true,'fast-forward appears for a seen talk');
  const t0=Date.now();await run(`[...document.querySelectorAll('#dlgBtns button')].find(b=>b.textContent==='はやおくり').click()`);
  await page.waitForTimeout(500);assert.equal(await run(`document.querySelector('#dialog').hidden`),false,'the first line waits for its motion (hold 950)');
  await page.waitForFunction(()=>sacredEval(`document.querySelector('#dialog').hidden`),{},{timeout:5000});
  const dt=Date.now()-t0;assert.ok(dt>=900&&dt<3000,'fast-forward ends quickly but after the hold: '+dt);
  console.log('Talk: fast-forward only for seen talks, and it waits for the motions ('+dt+'ms)');
  /* 3. 夜のコワイノをぜんぶ追いはらった：起きている子がよろこぶ。1晩1回 */
  const j=JSON.parse(await run(`(()=>{S.nightHad=true;S.nushi=0;S.ns={n:1,kill:1,lost:[],hurt:0,broke:0};S.enemies=[{dead:true}];const r=S.res[0];endAct(r);JUMP.delete(r);EVAP.push({e:S.enemies[0],t0:performance.now(),dur:1300,die:true});nightClearJoy();const w=!!S.ns.clr;EVAP.length=0;nightClearJoy();const a=S.ns.clr,b=JUMP.has(r);JUMP.delete(r);nightClearJoy();return JSON.stringify({w,a,b,c:JUMP.has(r)})})()`));
  assert.equal(j.w,false,'waits while the last one is falling');assert.equal(j.a,1);assert.equal(j.b,true,'awake spirits jump');assert.equal(j.c,false,'only once a night');
  const j2=JSON.parse(await run(`(()=>{S.ns={n:1,kill:0,lost:[],hurt:0,broke:0};nightClearJoy();return JSON.stringify(!!S.ns.clr)})()`));
  assert.equal(j2,false,'a night with no enemies driven away does not celebrate');
  console.log('Night: driving all enemies away makes awake spirits jump once');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
