/* 守護の台座の火入れ（火山）：建てただけでは山の影は来ない → 昼に台座をタップ → 前の会話 → 守り神の出番（towerLight）→ あとの会話 → 火が入って、その夜に来る。
   夜はことわる・3回しっぱいでつぎの日・古いセーブの台座は火が入っている・草原の出番の表はかわらない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780},world:1});
  const wait=ms=>page.waitForTimeout(ms);
  await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;S.godGone=true;
    S.res.push(mkRes(S,SHIZUKU,'water',CX+2.5,CY+6.5));for(const r of S.res){r.x=CX+.5+(r.name===SHIZUKU?2:0);r.y=CY+7.5;r.hunger=hMax(r);r.energy=100;r.fun=50;r.nap=false;endAct(r)}
    for(let y=CY+2;y<CY+10;y++)for(let x=CX-4;x<CX+6;x++){const k=y*W+x;S.obj[k]='';S.ground[k]=0;S.floor[k]='';S.hi[k]=0}
    {const j=(CY+4)*W+CX;window.TW=j;S.obj[j]='tower';for(const k of[j+1,j+W,j+W+1]){S.obj[k]='part';S.ref[k]=j}S.hp[j]=BL.tower.hp}
    S.quest=QUESTS.findIndex(q=>q.id==='tower');S.qTalked=true;S.qStory=null;S.shards=2;S.usedSh=1;S.t=12*60;recount();`);
  assert.deepEqual(await run(`Object.keys(FIELD_PLAY)`),['earthListen','fireRoot','waterFilm','windEcho'],'grass plays unchanged');
  assert.equal(await run(`altarLit()`),false);assert.equal(await run(`QUESTS[S.quest].check()`),false,'built but not lit: quest not done');
  assert.equal(await run(`altarProg()`),'台座に火を入れよう');assert.equal(await run(`!!S.finalNight`),false,'no final night by building');
  /* 夜はことわる */
  await run(`S.t=1*60`);assert.equal(await run(`altarWhy()`),'火入れは、朝になってから');assert.equal(await run(`towerLightTap(TW)`),true);assert.equal(await run(`document.querySelector('#dialog').hidden`),true,'no dialog at night');
  await run(`S.t=12*60`);assert.equal(await run(`altarWhy()`),'');
  /* 会話を、さいごまで読む（動きがおわるまで待つ行は、待ってから送る） */
  const talk=async()=>{const t0=Date.now();while(Date.now()-t0<90000){if(await run(`document.querySelector('#dialog').hidden`))return;await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=[...document.querySelectorAll('#dlgBtns button')].find(b=>!b.classList.contains('dlgSkip')&&!b.classList.contains('dlgFF'));if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click()})()`);await wait(100)}throw Error('dialog did not end')};
  /* しっぱい3回：おしっぱなし */
  assert.equal(await run(`towerLightTap(TW)`),true);await wait(200);assert.equal(await run(`document.querySelector('#dialog').hidden`),false,'pre talk opens');
  assert.equal(await run(`towerLightTap(TW)`),true,'second tap is swallowed');await talk();await wait(300);
  assert.equal(await run(`sacredPlayActive()&&SPLAY.type`),'bellows');assert.equal(await run(`!!document.querySelector('#playPop')`),true);
  {const t0=await run(`S.t`);await wait(400);assert.equal(await run(`S.t`),t0,'village time stops during the play')}
  for(let k=0;k<3;k++){await run(`(()=>{const P=SPLAY;P.start=0;P.holding=true;P.fire=1;P.over=BELLOWS.over-.01})()`);await wait(250)}
  await wait(300);assert.equal(await run(`sacredPlayActive()`),false,'3 misses end the play');await wait(300);await talk();
  assert.equal(await run(`altarLit()`),false);assert.equal(await run(`S.st2.litRetry`),await run(`callDay()+1`));assert.equal(await run(`altarWhy()`),'火入れは、あした、もう一度');
  assert.equal(await run(`!!S.finalNight`),false);
  /* つぎの日：うまくいく（火を帯のまん中におく） */
  await run(`S.t+=1440;DLGGAP=0`);assert.equal(await run(`altarWhy()`),'');
  await run(`towerLightTap(TW)`);await wait(200);await talk();await wait(300);assert.equal(await run(`SPLAY&&SPLAY.type`),'bellows');
  await page.screenshot({path:(process.env.SCREENSHOT_DIR||'/tmp')+'/altar-play.png'}).catch(()=>{});
  await run(`window.BT=setInterval(()=>{const P=SPLAY;if(!P||P.type!=='bellows')return clearInterval(window.BT);P.start=0;P.fire=bellowsBand(P,performance.now()).c;P.holding=false;P.keep=Math.max(P.keep,BELLOWS.need-.6)},30)`);
  await page.waitForFunction(()=>sacredEval('!sacredPlayActive()'),{},{timeout:15000});await wait(300);
  assert.equal(await run(`document.querySelector('#dialog').hidden`),false,'post talk opens right after the play');assert.equal(await run(`altarLit()`),false,'not lit until the talk is read');
  await talk();await wait(200);
  assert.equal(await run(`altarLit()`),true);assert.equal(await run(`S.finalNight`),true);assert.equal(await run(`S.usedSh`),2,'the ember is set');assert.equal(await run(`!!(S.flags.playWon||{}).towerLight`),true);
  assert.ok(await run(`S.res.every(r=>r.fun>=59)`),'everyone happier');assert.equal(await run(`QUESTS.find(q=>q.id==='tower').check()`),true,'quest condition met');assert.equal(await run(`altarProg()`),'夜、山の影がやってくる');
  assert.equal(await run(`towerLightTap(TW)`),false,'lit: tap falls through');
  /* 夜20時：山の影が来る夜になる */
  await run(`(()=>{S.t=(Math.floor(S.t/1440))*1440+19.9*60;for(let i=0;i<40;i++)stepWorld(1)})()`);assert.equal(await run(`!!S.finalOn`),true,'final night starts at 20:00');
  /* 古いセーブ：もう建っている台座は、火が入っている */
  assert.equal(await run(`(()=>{const t=JSON.parse(JSON.stringify(S));delete t.flags.altarLit1;delete t.st2.lit;const keep=S;continueGame(t);const r=!!S.st2.lit&&!!S.flags.altarLit1;return r})()`),true,'old save with a tower is lit');
  await wait(300);assert.deepEqual(errors,[]);await browser.close();console.log('Altar light: ok');
})().catch(e=>{console.error(e);process.exit(1)});
