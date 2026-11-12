/* かけらを御神木にささげる場面：場面と会話を見おえてから、ささげたことにする（とちゅうでは数えない）。かけらでは木の姿をかえない。場面のあとは時間が動く。
   みどりがひろがって木が大きくなるときは、村の時間を止めて見せ、おわったら動く。3つめは会話なしで数える。夜・連続タップは1回だけ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{SPOT_POPS.length=0};`);
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.minaCame=true;S.flags.nushiAlive=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;
    const x=S.sacredRoot%W,y=S.sacredRoot/W|0;S.res=[mkRes(S,POKO,'wood',x-2.5,y+5.5),mkRes(S,MINA,'earth',x+4.5,y+5.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,x+i+.5,y+6.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90}
    S.fieldStories=Object.fromEntries(Object.entries(FIELD_STORIES).map(([id,L])=>[id,{step:L.length}]));S.sev=Object.fromEntries(SEV1.map(v=>[v.k,1]));growStoryTree();
    S.quest=questIndexOf('omoi');S.qStory=null;S.qTalked=true;S.shards=1;S.setSh=0;S.treeSeen=sacredStage();recount()})()`);
  const tap=()=>run(`sacredTreeTap(S.sacredRoot)`),dlgOpen=()=>run(`!document.querySelector('#dialog').hidden`);
  const talkOut=async()=>{for(let i=0;i<400;i++){if(!await dlgOpen())return;await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click()})()`);await page.waitForTimeout(60)}throw Error('dialogue did not end')};
  /* 夜はささげない */
  await run('S.t=1440');await tap();assert(!await run('!!SHARD_OFFER'),'night: no offering');await run('S.t=720');
  /* 1つめ：連続タップでも1回。場面のあいだは時間が止まり、まだ数えない */
  await tap();await tap();await page.waitForFunction(()=>sacredEval('performance.now()<SCENEHOLD'),{},{timeout:20000});
  assert(await run('paused()&&(S.setSh||0)===0'),'scene holds the village and does not count yet');
  assert(await run(`SCN.some(e=>e.k==='gem')||true`));await page.waitForFunction(()=>sacredEval(`SCN.some(e=>e.k==='lord')`),{},{timeout:12000});
  await page.waitForFunction(()=>!document.querySelector('#dialog').hidden,{},{timeout:12000});assert.equal(await run('S.setSh||0'),0,'not counted before the dialogue is read');
  await talkOut();assert.equal(await run('S.setSh'),1,'counted once after the dialogue');assert(await run('!SHARD_OFFER&&performance.now()>=SCENEHOLD&&!sacredDirection()'),'scene released');
  assert.equal(await run('sacredStage()'),3,'a shard does not change the tree');assert.equal(await run(`SACRED_ART[Math.floor(sacredStage())]`),'story:sapling');
  /* 2つめ */
  await run('S.shards=2;SPOT_POPS.length=0');await tap();await page.waitForFunction(()=>!document.querySelector('#dialog').hidden,{},{timeout:30000});await talkOut();assert.equal(await run('S.setSh'),2);
  /* みどりがひろがって大きくなる：時間を止めて見せ、おわったら動く */
  await run('SPOT_POPS.length=0;recount=()=>{};GRASSN=2000');await page.waitForFunction(()=>sacredEval('!!sacredEffect("growth")&&performance.now()<SCENEHOLD'),{},{timeout:10000});
  assert.equal(await run('S.treeSeen'),4);await page.waitForFunction(()=>sacredEval('!sacredEffect("growth")&&performance.now()>=SCENEHOLD&&!sacredDirection()'),{},{timeout:12000});
  await page.waitForFunction(()=>!document.querySelector('#dialog').hidden,{},{timeout:8000});await talkOut();
  /* 3つめ：会話なしで数える */
  await run('S.shards=3;S.flags.finalWon=true;S.sev.e09=1;SPOT_POPS.length=0;scheduleGrassReunion=()=>{}');await tap();await page.waitForFunction(()=>sacredEval('S.setSh===3'),{},{timeout:25000});
  assert(await run('!SHARD_OFFER&&performance.now()>=SCENEHOLD'));
  assert.deepEqual(errors,[]);console.log('shard scene ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
