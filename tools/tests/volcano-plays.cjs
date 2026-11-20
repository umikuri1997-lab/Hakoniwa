/* 火山の「くりかえし」を直した所：奥の大岩（光で熱して水でわる）・かじとり（熱の装置のハンドル）・湯もみ（シズクのおねがい）・サブクエスト（あたたかい畑・湯めぐり） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780},world:1});
  const wait=ms=>page.waitForTimeout(ms);
  await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();S.enemyOn=true;S.enemies=[];NOSAVE=true;S.godGone=true;S.flags.onsen=true;
    S.res.push(mkRes(S,SHIZUKU,'water',CX+2.5,CY+6.5));for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50;r.nap=false;endAct(r)}S.t=12*60;recount();`);
  const talk=async()=>{const t0=Date.now();while(Date.now()-t0<90000){if(await run(`document.querySelector('#dialog').hidden`))return;await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=[...document.querySelectorAll('#dlgBtns button')].find(b=>!b.classList.contains('dlgSkip')&&!b.classList.contains('dlgFF'));if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click()})()`);await wait(100)}throw Error('dialog did not end')};
  /* 1. 奥の大岩：せいれいはたたかない・光で赤くなる・水をかけるとわれる */
  assert.equal(await run(`BVOL.every(j=>S.obj[j]==='boulder'&&rockHard(j))`),true);
  assert.equal(await run(`rockHard(S.st2.bw[0])`),false,'the canal boulders stay breakable');
  await run(`(()=>{for(const j of BVOL)for(const d of[-1,1,-W,W]){const n=j+d;if(n!==D2&&!BVOL.includes(n)&&walk(n)&&walk(n+d)){window.RJ=j;window.RN=n;window.RN2=n+d;return}}})()`);
  assert.equal(await run(`window.RJ!=null`),true,'a boulder can be reached');
  assert.equal(await run(`(()=>{const j=RJ;glHit(j%W,(j/W)|0,0);return rockHot(j)&&BVOL.filter(rockHot).length===1})()`),true,'the light heats the tapped boulder');
  assert.equal(await run(`(()=>{const s=S.res.find(r=>r.name===SHIZUKU),h=S.res.find(r=>r.name===HOMURA);s.x=RN%W+.5;s.y=(RN/W|0)+.5;h.x=RN2%W+.5;h.y=(RN2/W|0)+.5;const a=goQuench(s,bfs(s.x|0,s.y|0)),b=goQuench(h,bfs(h.x|0,h.y|0));return [a,b,s.act&&s.act.type].join()})()`),'true,false,quench','the water spirit goes; others do not while she is here');
  await run(`(()=>{const s=S.res.find(r=>r.name===SHIZUKU);for(let i=0;i<400&&s.act&&s.act.type==='quench';i++)updRes(s,.5)})()`);
  assert.equal(await run(`S.obj[RJ]`),'','the hot boulder cracks');
  assert.equal(await run(`(()=>{const j=BVOL.find(q=>q!==RJ);rockHeat(j);S.t+=ROCKHOT+1;const r=rockHot(j);S.t=12*60+1440*Math.ceil(S.t/1440);return r})()`),false,'the heat fades after 2 hours');
  /* 2. かじとり：円をえがいて3回転。速すぎると、しっぱい */
  await run(`window.PD=0;window.PF=0;startSacredPlay('heatCrank',D1,[],()=>{window.PD++},()=>{window.PF++})`);await wait(150);
  assert.equal(await run(`SPLAY.type+','+!!document.querySelector('#playPop')`),'crank,true');
  const turn=(revs,msPer)=>run(`(()=>{const P=SPLAY,cx=P.cx,cy=P.cy-14;let t=performance.now();sacredPlayDown({x:cx+16,y:cy},t);const n=Math.round(${revs}*24);for(let i=1;i<=n&&SPLAY===P&&P.down;i++){t+=${msPer}/24;const a=i/24*Math.PI*2;sacredPlayMove({x:cx+Math.cos(a)*16,y:cy+Math.sin(a)*16},t)}if(SPLAY===P&&P.down)sacredPlayUp({x:cx,y:cy},t);return SPLAY===P?P.got:-1})()`);
  assert.equal(await turn(2,200),0,'too fast: the heat leaks and the turns are lost');assert.equal(await run(`SPLAY.fails`),1);
  assert.equal(await turn(3.1,900),3,'three slow turns');await wait(1000);
  assert.equal(await run(`window.PD+','+window.PF+','+sacredPlayActive()`),'1,0,false');
  /* 装置の画面：はじめて西へむけるときは、ハンドルを回す */
  await run(`S.st2.d1=1;delete S.st2.crank;S.st2.sp.b=0;openSheet('heatv',D1)`);await wait(200);
  assert.equal(await run(`[...document.querySelectorAll('#sheetBody button')].some(b=>b.textContent==='ハンドルを回す')`),true);
  await run(`closeSheet();S.st2.crank=1;openSheet('heatv',D1)`);await wait(200);
  assert.equal(await run(`[...document.querySelectorAll('#sheetBody button')].some(b=>b.textContent==='向きをかえる')`),true);await run(`closeSheet()`);
  /* 3. 湯もみ：依頼を聞いてから、入口の温泉をタップ */
  await run(`S.quest=QUESTS.findIndex(q=>q.id==='shizukuRest');S.qTalked=false;S.qStory=null;DLGGAP=0`);
  assert.equal(await run(`yumomiTap()`),false,'not before the request is heard');
  await run(`S.qTalked=true;for(const r of S.res){r.x=HSPC.a[0]+(r.name===SHIZUKU?0:2);r.y=HSPC.a[1]+3.5}`);
  assert.equal(await run(`yumomiWhy()`),'');assert.equal(await run(`yumomiTap()`),true);await wait(200);await talk();await wait(300);
  assert.equal(await run(`SPLAY&&SPLAY.type`),'yumomi');
  const swing=(n,ms)=>run(`(()=>{const P=SPLAY;let t=performance.now();sacredPlayDown({x:64,y:60},t);for(let i=0;i<${n}&&SPLAY===P&&P.down;i++){t+=${ms};sacredPlayMove({x:i%2?40:90,y:60},t)}if(SPLAY===P&&P.down)sacredPlayUp({x:64,y:60},t);return SPLAY===P?P.got:-1})()`);
  assert.equal(await swing(5,100)<3,true,'shaking too fast spills');assert.equal(await run(`SPLAY.fails>=1`),true);
  assert.equal(await swing(14,400),12);await wait(1100);
  assert.equal(await run(`!!S.st2.yumomi&&QUESTS.find(q=>q.id==='shizukuRest').check()`),true,'the bath is ready');await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0`);
  assert.equal(await run(`yumomiTap()`),false,'done: the tap falls through');
  /* 4. サブクエスト */
  assert.equal(await run(`(()=>{const q=k=>SUBQ.find(x=>x.k===k);return [!!q('warmfarm'),!!q('yumeguri'),!q('wall10'),!q('andonyogan')].join()})()`),'true,true,true,true');
  assert.equal(await run(`(()=>{const s={flags:{},subSt:{wall10:1,ore10:1},subDone:{andonyogan:1}};migrateVolSub(s);migrateVolSub(s);return JSON.stringify([s.subSt,s.subDone,s.flags.volSub1])})()`),'[{"ore10":1},{},1]');
  await wait(300);assert.deepEqual(errors,[]);await browser.close();console.log('Volcano plays: ok');
})().catch(e=>{console.error(e);process.exit(1)});
