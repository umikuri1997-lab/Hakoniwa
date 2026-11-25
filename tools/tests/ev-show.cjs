/* イベントの演出（js/ev-show.js）：はじまり（かざり・せーの）→ 指あそびをえらぶ → 山場 → おわりの札・紙ふぶき。
   指あそびがうまくいくと、上がる能力とたのしさがふえる。足すごほうび（体そう・水あそび・的あて）・お話・手紙・日記・雑談。
   24のイベントの指あそびは、どれも10秒、描いて・タップしてもエラーが出ない。 */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];
    for(const el of ['wood','earth','water','fire'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50}
    S.pt=5000;S.mat.wood=60;for(let i=0;i<99;i++)addFood('apple',1);S.t=12*60;`);
  const sim=(clockMin,stopIf)=>run(`(()=>{const end=S.t+${clockMin};let n=0;while(S.t<end&&n<40000){stepWorld(1.5);for(const r of S.res){updRes(r,1.5);r.hunger=Math.max(r.hunger,400);r.energy=Math.max(r.energy,40)}S.enemies=[];n++;${stopIf?'if('+stopIf+')break;':''}}return S.t})()`);
  const to=(d,h)=>run(`(()=>{const t=(${d}-1)*1440+(${h})*60;if(t>S.t)S.t=t;return dayNo()})()`);
  /* 1. 指あそび：24こ、どれも描いて・タップして・10秒でおわる */
  const ids=JSON.parse(await run(`JSON.stringify(Object.keys(EVMG))`));assert.equal(ids.length,24,'24 minigames');
  for(const id of Object.keys(JSON.parse(await run(`JSON.stringify(EVKIND)`))))assert.ok(ids.includes(id),'minigame for '+id);
  const mg=JSON.parse(await run(`(()=>{const out={};for(const id in EVMG){const M=EVMG[id],s={E:{id,who:[]}},g=document.createElement('canvas').getContext('2d');M.init(s);
    for(let i=0;i<600;i++){const t=i/60;if(M.tick)M.tick(s,1/60,t);if(i%9===0){if(M.down)M.down(s,t,60,28);if(M.tap)M.tap(s,t,60,28);if(M.move)M.move(s,t,60+(i%18<9?-30:30),28,true)}if(i%9===4&&M.up)M.up(s,t);M.draw(g,s,t)}
    const k=M.k(s);out[id]=typeof k==='number'&&k>=0&&k<=1}return JSON.stringify(out)})()`));
  for(const id in mg)assert.ok(mg[id],'minigame k in 0..1: '+id);
  /* 2. 体そう：はじまり → 指あそび（うまくいった）→ 山場 → おわりの札 */
  let d=await run(`dayNo()`);while(await run(`seasonDay(dayNo()+1)===CUPDAY`)){d++;await to(d,15)}
  const who=JSON.parse(await run(`JSON.stringify(S.res.map(r=>r.id))`));
  assert.ok(await run(`!!evOpen('taiso',${JSON.stringify(who)})`),'open taiso');
  const day=await run(`S.ev.day`);await to(day,5.9);
  const est0=JSON.parse(await run(`JSON.stringify(S.res.map(r=>(r.est||{}).sta||0))`));
  await sim(120,"S.ev&&S.ev.ph==='do'");
  assert.equal(await run(`S.ev&&S.ev.ph`),'do','gathered');assert.equal(await run(`EVV.id`),'taiso','show begun');assert.ok(await run(`!!EVV.box`),'deco box');assert.equal(await run(`EVV.song`),'','taiso: no bgm');assert.ok(await run(`EVNODECO.has('taiso')`),'taiso: no garland');assert.equal(await run(`(()=>{try{for(const k of['flag','rw','lamp','flower'])isoGarland(ctx,50*TS,56*TS,50*TS,k,1e9,performance.now());const A=gFoot(50*TS,50*TS),B=gFoot(56*TS,50*TS);return B.px>A.px&&B.py>A.py?'ok':'flat'}catch(e){return String(e)}})()`),'ok','garland follows the grid row');
  await page.waitForTimeout(2600);assert.ok(await run(`!!document.getElementById('evAsk')`),'ask card shown');
  await run(`document.querySelector('#evAsk .a').click()`);assert.ok(await run(`!!document.getElementById('cupMG')`),'minigame open');
  await run(`S.ev.ek=1`);/* うまくいったことにする */
  await sim(15,"S.ev&&S.ev.cx");assert.ok(await run(`!!(S.ev&&S.ev.cx)`),'climax');assert.equal(await run(`evShowPose(S.res[0])`),'qrain','climax pose');
  await sim(60,'!S.ev');assert.equal(await run(`S.ev`),null,'ended');
  const r1=JSON.parse(await run(`JSON.stringify({end:!!EVV.end,tags:EVV.end&&EVV.end.tags.map(t=>t.L),est:S.res.map(r=>(r.est||{}).sta||0),evb:S.res.map(r=>r.evb&&r.evb.work),work:[rStat(S.res[0],rLv(S.res[0])).work],evm:S.res.map(r=>r.evm&&r.evm.id),lq:(S.letterQ||[]).filter(q=>q.k==='ev').length,dy:dyCur()&&dyCur().ev})`));
  assert.ok(r1.end&&r1.tags.length===who.length,'end tags');
  r1.est.forEach((v,i)=>assert.equal(v-est0[i],2,'sta +1 and +1 for playing well'));
  assert.ok(r1.tags[0].some(t=>t.includes('たのしさ+20')),'fun 15+5 on tag '+JSON.stringify(r1.tags[0]));
  assert.ok(r1.evb.every(v=>v===2),'taiso day buff work+2');
  assert.ok(r1.evm.every(v=>v==='taiso'),'memory');assert.equal(r1.lq,1,'one letter');assert.equal(r1.dy&&r1.dy[0],'taiso','diary topic');
  /* お話・雑談・手紙の文 */
  const tp=JSON.parse(await run(`JSON.stringify(evTopic(S.res[1]))`));assert.ok(tp&&tp.L.length>=2,'talk topic with thanks '+JSON.stringify(tp));
  assert.equal(await run(`evTopic(S.res[1])`),null,'once a day');
  assert.ok(await run(`CHATS.some(c=>c.evc&&c.ok(S.res[0],S.res[1]))`),'chat about it');
  assert.ok(await run(`letterTx('ev','taiso','fire').length===5&&letterTx('ev','taiso','fire').every(L=>L.length>=3&&L.length<=8)`),'5 whole letters');
  /* 3. 体そうの日の、はたらく速さは、つぎの朝6時にもどる */
  await to(day+1,6.2);assert.equal(await run(`evSt(S.res[0],'work')`),0,'buff ends next morning');
  /* 4. 水あそび（夏）：つかれ－30 */
  await to(day+1,15);while(await run(`seasonOf(dayNo()+1)!==1||seasonDay(dayNo()+1)===CUPDAY`)){const dd=await run(`dayNo()`)+1;await to(dd,15)}
  await run(`{const j=(CY+6)*W+CX-8;S.obj[j]='fountain';for(const k of[j+1,j+W,j+W+1]){S.obj[k]='part';S.ref[k]=j}recount()}`);
  assert.ok(await run(`!!evOpen('mizu',${JSON.stringify(who)})`),'open mizu');const d2=await run(`S.ev.day`);await to(d2,12.9);
  await sim(200,"S.ev&&S.ev.ph==='do'");await run(`for(const r of S.res)r.energy=40;document.getElementById('evAsk')&&document.getElementById('evAsk').remove()`);
  await sim(80,'!S.ev');assert.ok(await run(`S.res.filter(r=>r.evm&&r.evm.id==='mizu').every(r=>r.energy>=60)`),'mizu energy +30');
  await page.waitForTimeout(500);
  assert.deepEqual(errors,[],'no errors');console.log('ev-show: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
