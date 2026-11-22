/* 風の章のお話の後半（wind-story.js）：さいごの夜（遊具をねらう影・負けたらやりなおし）→ ヌシ様をむかえる → クリア */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:4});
  const until=(code,ms)=>page.waitForFunction(c=>sacredEval(c),code,{timeout:ms||60000,polling:300}).catch(async e=>{console.log(await run(`JSON.stringify({q:QUESTS[S.quest]&&QUESTS[S.quest].id,tk:S.qTalked,st:S.qStory,f:S.flags,ws:!!WSRUN,gift:GIFT_ACTIVE,cam:!!camAnim,h:hour(),dlg:!document.querySelector('#dialog').hidden,wind:S.wind})`));throw e});
  /* 会話は読んだことに。島はぜんぶうかせ、神殿を直し、観覧車の目標を受けたところから */
  const s0=JSON.parse(await run(`(()=>{dialog=(L,after)=>{window.__L=(window.__L||[]).concat(L.map(x=>x[0]));if(after)setTimeout(after,0)};setInterval(()=>{for(const id of['#lvOk','#rlv button']){const b=document.querySelector(id);if(b&&b.offsetParent)b.click()}},400);
    S.introSeen=true;S.hold=0;S.t=1440+9*60;USERPAUSE=false;showItemGift=()=>{};const I=windIsles(S);for(let k=1;k<=I.n;k++)S.wind.up[k]=1;WRISEQ.length=0;
    const tj=RUINT;for(const k of templeRuinCells(tj))if(S.obj[k]==='part'){S.obj[k]='';delete S.ref[k]}S.obj[tj]='statue';S.flags.hayate=2;S.flags.calmNight=1;
    if(!S.res.some(r=>r.name===HAYATE)){const k=S.res[0];const r=mkRes(S,HAYATE,'wind',k.x+1,k.y,'merry');S.res.push(r)}
    const fix=b=>{const j=S.obj.indexOf(b);if(j>=0)S.obj[j]=RIDEB[b]};fix('wheelb');recount();
    S.flags.rideRun={merry:1,cup:1,skyswing:1};
    return JSON.stringify({wheel:cnt('wheel')})})()`));
  assert.equal(s0.wheel,1);
  /* 雲の下までおわったところから：さいごの夜の目標 */
  const t2=JSON.parse(await run(`(()=>{S.rideRun=1;S.flags.rideRun.wheel=1;S.flags.kumo=1;S.quest=questIndexOf('windNight');S.qTalked=true;S.qStory=null;checkQuest();return JSON.stringify({q:QUESTS[S.quest].id,prog:QUESTS[S.quest].prog(),last:QUESTS[QUESTS.length-1].id})})()`));
  console.log(JSON.stringify(t2));assert.equal(t2.q,'windNight');assert.equal(t2.prog,'直した遊具 1/4');assert.equal(t2.last,'windEnd');
  /* 遊具を4つ直すと、その夜に影が来る。影は遊具をねらう */
  const n1=JSON.parse(await run(`(()=>{for(const b of['merryb','cupb','skyswingb']){const j=S.obj.indexOf(b);if(j>=0)S.obj[j]=RIDEB[b]}recount();S.t=1440*2+10*60;windStoryTick();const d=S.wind.fnD,p=QUESTS[S.quest].prog();S.t=1440*2+21*60+30;windStoryTick();S.obj[S.wind.holes[0].j]='kazaana';recount();const ng=S.enemies.find(e=>e.type==='nagi'),hj=S.wind.holes[0].j,bs=S.enemies.find(e=>e.type!=='nagi');return JSON.stringify({rides:windRidesN(),d,day:dayNo(),p,on:S.wind.fnOn,en:S.enemies.length,nagi:!!ng,lures:LURES.filter(j=>RIDES.has(S.obj[j])).length,holeLure:LURES.includes(hj),nagiHole:!!ng&&windLureOn(S.obj[hj])&&(EN.nagi.windLure===1),basicHole:!!bs&&!windLureOK(hj,bs)})})()`));
  console.log(JSON.stringify(n1));assert.equal(n1.rides,4);assert.equal(n1.d,n1.day,'今夜');assert.equal(n1.p,'今夜、影がやってくる');assert.equal(n1.on,1);assert.equal(n1.en,13);assert.ok(n1.nagi,'ナギノオオカゲが来る');assert.ok(n1.holeLure,'風穴もねらわれる');assert.ok(n1.nagiHole);assert.ok(n1.basicHole,'ふつうの影は、風穴をねらわない');assert.equal(n1.lures,4,'遊具が、ねらわれる');
  const n2=JSON.parse(await run(`(()=>{const M=skyM(),rt=()=>S.enemies.filter(e=>e.spawned&&!e.dead&&typeof e.tg==='string'&&e.tg[0]==='d'&&RIDES.has(S.obj[+e.tg.slice(1)])).length;let mx=0;for(let i=0;i<1600;i++){stepWorld(.5);for(const r of S.res){r.hunger=Math.max(r.hunger,400)}if(i%10===0)mx=Math.max(mx,rt());if(hour()>=23.5)break}const L=S.enemies.filter(e=>e.spawned&&!e.dead);return JSON.stringify({n:L.length,land:L.every(e=>!M[(e.y|0)*W+(e.x|0)]),rideT:Math.max(mx,rt()),h:hour()})/* 遊具をねらった影がいたか（とちゅうで1つこわれて、ほかの遊具に行けなくなることもある） */})()`));
  console.log(JSON.stringify(n2));assert.ok(n2.n>0,'影が来る');assert.ok(n2.land,'影は陸から来る');assert.ok(n2.rideT>0,'影は遊具をねらう');
  /* こわされた遊具は、こわれた遊具にもどる。朝に1つしかのこっていなければ負け → 3日あとにまた */
  const n3=JSON.parse(await run(`(()=>{for(const id of['merry','cup','skyswing'])windRideBreak(S.obj.indexOf(id));const b=['merryb','cupb','skyswingb'].every(k=>S.obj.includes(k));S.t=1440*3+7*60;stepWorld(.5);windStoryTick();return JSON.stringify({b,won:!!S.flags.windWon,on:S.wind.fnOn,fnD:S.wind.fnD,day:dayNo(),en:S.enemies.length,p:QUESTS[S.quest].prog(),lures:LURES.filter(j=>RIDES.has(S.obj[j])).length})})()`));
  console.log(JSON.stringify(n3));assert.ok(n3.b,'こわれた遊具にもどる');assert.equal(n3.won,false);assert.equal(n3.on,0);assert.equal(n3.fnD,n3.day+2,'3日あとの夜');assert.equal(n3.lures,0,'朝は、ねらわれない');
  /* 直して、また来た夜を守りぬく */
  const n4=JSON.parse(await run(`(()=>{for(const b of['merryb','cupb','skyswingb']){const j=S.obj.indexOf(b);if(j>=0)S.obj[j]=RIDEB[b]}recount();S.t=1440*(S.wind.fnD)+21*60+30;windStoryTick();const on=S.wind.fnOn;S.t=1440*(S.wind.fnD+1)+7*60;stepWorld(.5);windStoryTick();checkQuest();return JSON.stringify({on,won:S.flags.windWon,q:QUESTS[S.quest].id})})()`));
  console.log(JSON.stringify(n4));assert.equal(n4.on,1);assert.equal(n4.won,1);assert.equal(n4.q,'windEnd');
  /* 朝、ヌシ様が雲の上へ → 風がつばさに → クリア */
  await run(`S.t=1440*(S.wind.fnD+1)+9*60;S.enemies=[];window.__L=[];windStoryTick()`);
  assert.equal(await run(`!!WSRUN`),true,'ヌシ様をむかえる場面');
  await until(`typeof SPLAY!=='undefined'&&!!SPLAY&&SPLAY.id==='windLift'`,60000);
  const tr=JSON.parse(await run(`(()=>{const P=SPLAY,now=performance.now();const L0=P.paths[0];traceDown(P,L0[0],now);traceMove(P,{x:L0[0].x+30,y:L0[0].y},now);const miss=P.fails;for(let k=0;k<P.need;k++){const L=P.paths[P.k];traceDown(P,L[0],now);for(const p of L)traceMove(P,p,now)}return JSON.stringify({miss,got:P.got,won:!!P.won})})()`));
  console.log(JSON.stringify(tr));assert.equal(tr.miss,1,'すじからはなれると、風がちる');assert.equal(tr.got,3);assert.ok(tr.won,'風をつばさへとどける');
  await until(`!!WV.bird`,60000);
  await until(`!WSRUN&&S.flags.windEnd===1`,60000);
  await run(`checkQuest();windStoryTick()`);
  const e=JSON.parse(await run(`JSON.stringify({cl:!!S.cleared,nushi:window.__L.includes(NUSHI4),q:S.quest,n:QUESTS.length})`));
  console.log(JSON.stringify(e));assert.ok(e.cl,'クリア');assert.ok(e.nushi);assert.equal(await run(`(()=>{const c=document.createElement('canvas').getContext('2d');drawWindNushi(c,performance.now());return 1})()`),1,'クリアのあとも、ヌシ様を描ける');
  await run(`render(performance.now())`).catch(()=>{});
  assert.deepEqual(errors,[]);await browser.close();console.log('wind-story ok')})().catch(e=>{console.error(e);process.exit(1)});
