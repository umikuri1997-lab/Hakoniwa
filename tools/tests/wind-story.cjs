/* 風の章のお話の後半（wind-story.js）：観覧車のてっぺん → 雲の切れ目 → さいごの夜（遊具をねらう影・負けたらやりなおし）→ ヌシ様をむかえる → クリア */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:4});
  const until=(code,ms)=>page.waitForFunction(c=>sacredEval(c),code,{timeout:ms||60000,polling:300}).catch(async e=>{console.log(await run(`JSON.stringify({q:QUESTS[S.quest]&&QUESTS[S.quest].id,tk:S.qTalked,st:S.qStory,f:S.flags,ws:!!WSRUN,gift:GIFT_ACTIVE,cam:!!camAnim,h:hour(),dlg:!document.querySelector('#dialog').hidden,wind:S.wind})`));throw e});
  /* 会話は読んだことに。島はぜんぶうかせ、神殿を直し、観覧車の目標を受けたところから */
  const s0=JSON.parse(await run(`(()=>{dialog=(L,after)=>{window.__L=(window.__L||[]).concat(L.map(x=>x[0]));if(after)setTimeout(after,0)};setInterval(()=>{for(const id of['#lvOk','#rlv button']){const b=document.querySelector(id);if(b&&b.offsetParent)b.click()}},400);
    S.introSeen=true;S.hold=0;S.t=1440+9*60;USERPAUSE=false;showItemGift=()=>{};const I=windIsles(S);for(let k=1;k<=I.n;k++)S.wind.up[k]=1;WRISEQ.length=0;
    const tj=RUINT;for(const k of templeRuinCells(tj))if(S.obj[k]==='part'){S.obj[k]='';delete S.ref[k]}S.obj[tj]='statue';S.flags.hayate=2;S.flags.calmNight=1;
    if(!S.res.some(r=>r.name===HAYATE)){const k=S.res[0];const r=mkRes(S,HAYATE,'wind',k.x+1,k.y,'merry');S.res.push(r)}
    const fix=b=>{const j=S.obj.indexOf(b);if(j>=0)S.obj[j]=RIDEB[b]};fix('wheelb');recount();
    S.quest=questIndexOf('windWheel');S.qTalked=true;S.qStory=null;S.flags.rideRun={merry:1,cup:1,skyswing:1};checkQuest();
    return JSON.stringify({q:QUESTS[S.quest].id,wheel:cnt('wheel'),gap:windGap(),ok:windGapOK(),n:QUESTS.length})})()`));
  console.log(JSON.stringify(s0));
  assert.equal(s0.q,'windWheel');assert.equal(s0.wheel,1);assert.ok(s0.gap&&s0.gap.j>=0,'雲の切れ目がある');assert.equal(s0.ok,false,'まだ風はとどいていない');
  /* 観覧車にのる前は、場面は出ない。のったら、てっぺんの場面 → つばさが見える → つぎの目標 */
  await run(`windStoryTick()`);assert.equal(await run(`!!WSRUN`),false,'のる前は出ない');
  await run(`S.flags.rideRun.wheel=1;window.__L=[];windStoryTick()`);assert.equal(await run(`GIFT_ACTIVE&&!!WSRUN`),true,'場面のあいだ、村の時間が止まる');
  await until(`!WSRUN&&!GIFT_ACTIVE&&S.flags.windTop===1`);
  const t1=JSON.parse(await run(`(()=>{checkQuest();S.qTalked=true;return JSON.stringify({q:QUESTS[S.quest].id,L:window.__L})})()`));
  console.log(JSON.stringify(t1));assert.equal(t1.q,'windCall');assert.ok(t1.L.includes('カザネ')&&t1.L.includes('ハヤテ'),'てっぺんで2人が話す');
  /* 雲の切れ目まで風の道をとどける → ヌシ様の声 */
  await run(`(()=>{const g=windGap();S.obj[g.c]='kazaana';S.wind.holes.push({j:g.c,d:g.d});for(let s=1;s<4;s++){const k=g.c+(WDIR[g.d][0]+WDIR[g.d][1]*W)*s;S.obj[k]=''}recount();window.__L=[];windStoryTick()})()`);
  assert.equal(await run(`windGapOK()`),true,'風が雲の切れ目にとどく');
  await until(`!WSRUN&&S.flags.windCall===1`);
  const t2=JSON.parse(await run(`(()=>{checkQuest();S.qTalked=true;return JSON.stringify({q:QUESTS[S.quest].id,nushi:window.__L.includes(NUSHI5),prog:QUESTS[S.quest].prog()})})()`));
  console.log(JSON.stringify(t2));assert.equal(t2.q,'windNight');assert.ok(t2.nushi,'ヌシ様が話す');assert.equal(t2.prog,'直した遊具 1/4');
  /* 遊具を4つ直すと、その夜に影が来る。影は遊具をねらう */
  const n1=JSON.parse(await run(`(()=>{for(const b of['merryb','cupb','skyswingb']){const j=S.obj.indexOf(b);if(j>=0)S.obj[j]=RIDEB[b]}recount();S.t=1440*2+10*60;windStoryTick();const d=S.wind.fnD,p=QUESTS[S.quest].prog();S.t=1440*2+21*60+30;windStoryTick();return JSON.stringify({rides:windRidesN(),d,day:dayNo(),p,on:S.wind.fnOn,en:S.enemies.length,lures:LURES.filter(j=>RIDES.has(S.obj[j])).length})})()`));
  console.log(JSON.stringify(n1));assert.equal(n1.rides,4);assert.equal(n1.d,n1.day,'今夜');assert.equal(n1.p,'今夜、影がやってくる');assert.equal(n1.on,1);assert.equal(n1.en,12);assert.equal(n1.lures,4,'遊具が、ねらわれる');
  const n2=JSON.parse(await run(`(()=>{const M=skyM();for(let i=0;i<1600;i++){stepWorld(.5);for(const r of S.res){r.hunger=Math.max(r.hunger,400)}if(hour()>=23.5)break}const L=S.enemies.filter(e=>e.spawned&&!e.dead);return JSON.stringify({n:L.length,land:L.every(e=>!M[(e.y|0)*W+(e.x|0)]),rideT:L.filter(e=>typeof e.tg==='string'&&e.tg[0]==='d'&&RIDES.has(S.obj[+e.tg.slice(1)])).length,h:hour()})})()`));
  console.log(JSON.stringify(n2));assert.ok(n2.n>0,'影が来る');assert.ok(n2.land,'影は陸から来る');assert.ok(n2.rideT>0,'影は遊具をねらう');
  /* こわされた遊具は、こわれた遊具にもどる。朝に1つしかのこっていなければ負け → 3日あとにまた */
  const n3=JSON.parse(await run(`(()=>{for(const id of['merry','cup','skyswing'])windRideBreak(S.obj.indexOf(id));const b=['merryb','cupb','skyswingb'].every(k=>S.obj.includes(k));S.t=1440*3+7*60;stepWorld(.5);windStoryTick();return JSON.stringify({b,won:!!S.flags.windWon,on:S.wind.fnOn,fnD:S.wind.fnD,day:dayNo(),en:S.enemies.length,p:QUESTS[S.quest].prog(),lures:LURES.filter(j=>RIDES.has(S.obj[j])).length})})()`));
  console.log(JSON.stringify(n3));assert.ok(n3.b,'こわれた遊具にもどる');assert.equal(n3.won,false);assert.equal(n3.on,0);assert.equal(n3.fnD,n3.day+2,'3日あとの夜');assert.equal(n3.lures,0,'朝は、ねらわれない');
  /* 直して、また来た夜を守りぬく */
  const n4=JSON.parse(await run(`(()=>{for(const b of['merryb','cupb','skyswingb']){const j=S.obj.indexOf(b);if(j>=0)S.obj[j]=RIDEB[b]}recount();S.t=1440*(S.wind.fnD)+21*60+30;windStoryTick();const on=S.wind.fnOn;S.t=1440*(S.wind.fnD+1)+7*60;stepWorld(.5);windStoryTick();checkQuest();return JSON.stringify({on,won:S.flags.windWon,q:QUESTS[S.quest].id})})()`));
  console.log(JSON.stringify(n4));assert.equal(n4.on,1);assert.equal(n4.won,1);assert.equal(n4.q,'windEnd');
  /* 朝、ヌシ様が雲の上へ → 風がつばさに → クリア */
  await run(`S.t=1440*(S.wind.fnD+1)+9*60;S.enemies=[];window.__L=[];windStoryTick()`);
  assert.equal(await run(`!!WSRUN`),true,'ヌシ様をむかえる場面');await until(`!!WV.bird`);
  await until(`!WSRUN&&S.flags.windEnd===1`,60000);
  await run(`checkQuest();windStoryTick()`);
  const e=JSON.parse(await run(`JSON.stringify({cl:!!S.cleared,nushi:window.__L.includes(NUSHI5),q:S.quest,n:QUESTS.length})`));
  console.log(JSON.stringify(e));assert.ok(e.cl,'クリア');assert.ok(e.nushi);
  await run(`render(performance.now())`).catch(()=>{});
  assert.deepEqual(errors,[]);await browser.close();console.log('wind-story ok')})().catch(e=>{console.error(e);process.exit(1)});
