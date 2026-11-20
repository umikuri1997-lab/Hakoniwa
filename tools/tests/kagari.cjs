/* 火山の物語（kagari.js）：入り口のあかり → ホムラが夕方にともす → かえり道のあかりの依頼 → つぎの夕方、カガリが自分で帰ってくる（会話をさいごまで見てから）
   → 幕間「影のがわ」3つ（夜のはじめ、1晩に1つ、村の時間が止まる）→ クリアのあとのさいごのうずみ火。前のセーブの番号の読みかえ・カガリのいない村ではカガリの行をはぶく */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780},world:1});
  const wait=ms=>page.waitForTimeout(ms);
  const talk=async()=>{const t0=Date.now();while(Date.now()-t0<90000){if(await run(`document.querySelector('#dialog').hidden`))return;await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=[...document.querySelectorAll('#dlgBtns button')].find(b=>!b.classList.contains('dlgSkip')&&!b.classList.contains('dlgFF'));if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click()})()`);await wait(100)}throw Error('dialog did not end')};
  await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;S.godGone=true;
    if(!S.res.some(r=>r.name===SHIZUKU))S.res.push(mkRes(S,SHIZUKU,'water',CX+2.5,CY+6.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=60;r.nap=false;endAct(r)}
    S.quest=QUESTS.findIndex(q=>q.id==='kagari');S.qTalked=false;S.qStory=null;S.t=12*60;DLGGAP=0;recount();`);
  /* あかりが置かれる・こわせない・うつせない */
  await run(`kgrTick()`);await wait(1100);await run(`KGRT=0;kgrTick()`);
  const L=await run(`kgrLampJ()`);assert.ok(L>=0,'lamp placed');assert.equal(await run(`NOMOVE.has('kaeribi')`),true);
  await run(`removeAt(${L}%W,${L}/W|0)`);assert.equal(await run(`S.obj[${L}]`),'kaeribi','lamp cannot be removed');
  assert.equal(await run(`kgrLit()`),false,'not lit at noon');
  /* カガリは、ふつうの呼び出しでは来ない名前 */
  assert.equal(await run(`isKey(KAGARI)`),true);
  /* 依頼の会話：カガリはまだいないので、カガリの行はない */
  assert.equal(await run(`ideaDialogue(QUESTS[S.quest],QUESTS.find(q=>q.id==='ashNight').story).some(l=>l[0]===KAGARI)`),false,'kagari lines dropped when absent');
  await run(`S.qTalked=true;QUESTS[S.quest].talk.done()`);assert.equal(await run(`kgrDue()`),false,'not the same day');
  assert.equal(await run(`kgrProg()`),'夕方を待とう');
  /* つぎの日の夕方：カガリが帰ってくる */
  await run(`S.t+=1440;S.t=Math.floor(S.t/1440)*1440+17.6*60;for(const r of S.res){r.x=CX+.5;r.y=CY+4.5;endAct(r)}KGRT=0`);
  assert.equal(await run(`kgrDue()`),true);await run(`kgrTick()`);
  await page.waitForFunction(()=>sacredEval('!document.querySelector("#dialog").hidden'),{},{timeout:60000});
  assert.equal(await run(`S.res.some(r=>r.name===KAGARI&&r.kgrTemp)`),true,'kagari walks in');assert.equal(await run(`!!S.flags.kagariCame`),false,'not yet until talks end');
  for(let k=0;k<3;k++){await talk();await page.waitForFunction(()=>sacredEval('!document.querySelector("#dialog").hidden||!!S.flags.kagariCame'),{},{timeout:30000})}
  assert.equal(await run(`!!S.flags.kagariCame`),true,'kagari came');assert.equal(await run(`S.res.filter(r=>r.name===KAGARI&&!r.kgrTemp).length`),1);
  assert.equal(await run(`kgrLit()`),true,'lamp stays lit after she came');assert.equal(await run(`QUESTS.find(q=>q.id==='kagari').check()`),true);
  /* 幕間：夜のはじめ、1晩に1つ。村の時間が止まる */
  await run(`S.quest=QUESTS.findIndex(q=>q.id==='hinoookage');S.qTalked=false;S.flags.kgrIv=0;S.t=Math.floor(S.t/1440)*1440+20.5*60;KGRT=0;if(sheet)closeSheet()`);
  assert.equal(await run(`kgrIvWhich()`),'a');await run(`kgrTick()`);assert.equal(await run(`KGRIV&&KGRIV.k`),'a');
  {const t0=await run(`S.t`);await wait(500);assert.equal(await run(`S.t`),t0,'village time stops')}
  await page.waitForFunction(()=>sacredEval('!KGRIV'),{},{timeout:20000});assert.equal(await run(`S.flags.kgrIv&1`),1);
  await run(`KGRT=0;kgrTick()`);assert.equal(await run(`KGRIV`),null,'one per night');
  await run(`S.t+=1440;KGRT=0;kgrTick()`);assert.equal(await run(`KGRIV&&KGRIV.k`),'b');await page.waitForFunction(()=>sacredEval('!KGRIV'),{},{timeout:20000});
  await run(`S.t+=1440;KGRT=0;kgrTick()`);assert.equal(await run(`KGRIV&&KGRIV.k`),'c');await page.waitForFunction(()=>sacredEval('!KGRIV'),{},{timeout:20000});
  await run(`S.t+=1440;KGRT=0;kgrTick()`);assert.equal(await run(`KGRIV`),null,'all three seen');
  /* クリアのあと：さいごのうずみ火 */
  await run(`(()=>{const j=(CY+2)*W+CX+4;for(const k of[j,j+1,j+W,j+W+1]){S.obj[k]='';S.ground[k]=0}S.obj[j]='tower';for(const k of[j+1,j+W,j+W+1]){S.obj[k]='part';S.ref[k]=j}S.cleared=true;recount();S.t+=1440;KGRT=0;kgrTick()})()`);
  await page.waitForFunction(()=>sacredEval('!!KGRIV&&KGRIV.k==="end"'),{},{timeout:30000});
  assert.equal(await run(`document.querySelector('#dialog').hidden`),true,'no other talk during the scene');
  await page.waitForFunction(()=>sacredEval('!KGRIV&&!document.querySelector("#dialog").hidden'),{},{timeout:30000});await talk();
  assert.equal(await run(`!!S.flags.kgrEnd`),true,'ending seen');
  /* 前のセーブ：おまつりのあとで止まっていた番号を、1回だけずらす */
  assert.equal(await run(`(()=>{const at=QUESTS2.findIndex(q=>q.id==='kagari'),s={world:1,flags:{},quest:at,qStory:at,qTalked:true};migrateKagariIns(s);const a=s.quest===at+1&&s.qStory===at+1;migrateKagariIns(s);return a&&s.quest===at+1})()`),true,'old save shifted once');
  assert.deepEqual(errors,[]);await browser.close();console.log('Kagari: ok');
})().catch(e=>{console.error(e);process.exit(1)});
