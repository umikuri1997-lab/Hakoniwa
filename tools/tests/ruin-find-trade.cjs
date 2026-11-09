const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 古い家のあと：家にもどると、せいれいが中へ歩いて行き、わすれ物を見つけて話してからわたす（1回だけ・夜はまつ）。
   交換のサブクエスト：カミサマに吹き出し・タップでカミサマが話す（フタバの行なし）、交換をおえると、そのままお礼と旅立ち。案内は昼だけ */
(async()=>{
  const SHOT=process.env.SHOT_DIR||'';
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  await run(`(()=>{updTut=()=>{};showSpotPop=()=>{};finalCheck=()=>{};scheduleGrassReunion=()=>{};window.GIFTS=[];const q0=queueItemGift;queueItemGift=g=>{GIFTS.push(g)};
    S.introSeen=true;S.godGone=true;S.t=1440+10*60;S.enemies=[];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;r.act=null}recount();})()`);
  /* 家にもどす */
  const a=JSON.parse(await run(`(()=>{const ru=S.fogF.find(f=>f.t==='ruin');fogClear(ru.a);const RG=fogRing(ru.j,...ruinWH(ru));for(const b of [...S.broken])if(RG.includes(b.j))S.obj[b.j]=b.id;for(const k of RG)if(S.hp[k]!=null)delete S.hp[k];recount();if(ru.done)throw Error('repair alone made a house');for(const k of RG)if(!S.obj[k])S.obj[k]='hwall';recount();
    const r=S.res[0];const st=ruinStand(ru)[0];r.x=st%W+.5;r.y=((st/W)|0)+4.5;r.act=null;return JSON.stringify({done:!!ru.done,find:!!ru.find,gifts:GIFTS.length})})()`));
  assert.deepEqual(a,{done:true,find:true,gifts:0},'no instant gift');
  /* 夜はまつ */
  assert.equal(await run(`(()=>{const t=S.t;S.t=1440+23*60+30;ruinFindTick();const x=S.res.some(r=>r.act&&r.act.type==='ruinfind');S.t=t;return x})()`),false);
  await run(`(()=>{ruinFindTick();const r=S.res.find(r=>r.act&&r.act.type==='ruinfind');panTo(r.x*TS,r.y*TS);USERPAUSE=false})()`);
  await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden`),{},{timeout:60000});
  await run('USERPAUSE=true');await page.waitForTimeout(1500);
  if(SHOT)await page.screenshot({path:SHOT+'/ruin-find.png'});
  const mid=JSON.parse(await run(`(()=>{const r=S.res.find(r=>r.act&&r.act.type==='ruinfind');const ru=S.fogF.find(f=>f.t==='ruin');const h=HOUSES.find(h=>h.inside.has((r.y|0)*W+(r.x|0)));return JSON.stringify({inside:!!h,gifts:GIFTS.length,txt:DLGA.full})})()`));
  assert.equal(mid.inside,true,'spirit is inside the house');assert.equal(mid.gifts,0,'gift after the talk');
  await run(`(()=>{DLGGAP=0;let n=0;while(!document.querySelector('#dialog').hidden&&n++<80){DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const b=document.querySelector('#dlgBtns button');if(b){b.disabled=false;b.click()}else dlgNext()}})()`);
  const end=JSON.parse(await run(`(()=>{const ru=S.fogF.find(f=>f.t==='ruin');ruinFindTick();return JSON.stringify({find:!!ru.find,gifts:GIFTS.length,again:S.res.filter(r=>r.act&&r.act.type==='ruinfind').length})})()`));
  assert.equal(end.find,false);assert.equal(end.gifts,1);
  /* 交換：カミサマが話す */
  const t=JSON.parse(await run(`(()=>{S.godGone=false;S.godShown=true;S.feat.shop=false;S.quest=questIndexOf('imoseed')+1;S.qTalked=false;S.qStory=null;S.subSt={};S.subDone={};for(const q of SUBQ)if(q.k!=='trade')S.subDone[q.k]=1;S.subTalkAt=null;S.flags.traded=0;S.flags.tradedSeen=0;
    TALKW=null;checkSub();const T=SUBQ.find(q=>q.k==='trade');return JSON.stringify({st:S.subSt.trade,w:SUBW[GOD],futaba:T.L.some(l=>l[0]==='K'||l[0]===POKO),who:subWho(T)===GOD})})()`));
  assert.deepEqual(t,{st:1,w:'trade',futaba:false,who:true});
  await run(`(()=>{panTo(godX()*TS,godY()*TS);setMode&&setMode('look')})()`).catch(()=>{});await page.waitForTimeout(800);
  if(SHOT)await page.screenshot({path:SHOT+'/god-trade-marker.png'});
  const nightGuide=await run(`(()=>{const t=S.t;S.t=1440*2+23*60+30;checkSub();const w=SUBW[GOD];S.t=t;checkSub();return !!w})()`);assert.equal(nightGuide,false,'no talk marker at night');
  await run(`(()=>{subTalk('trade')})()`);await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden`),{},{timeout:20000});await page.waitForTimeout(300);
  const first=await run(`document.querySelector('#dialog').innerText.slice(0,80)`);
  await run(`(()=>{DLGGAP=0;let n=0;while(!document.querySelector('#dialog').hidden&&n++<80){DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const b=document.querySelector('#dlgBtns button');if(b){b.disabled=false;b.click()}else dlgNext()}})()`);
  assert.equal(await run('S.subSt.trade'),2);
  await run(`(()=>{openSheet('shop');S.flags.traded=1;closeSheet()})()`);await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden`),{},{timeout:20000}).catch(()=>{});
  assert.equal(await run(`!document.querySelector('#dialog').hidden`),true,'GOD thanks right away');
  await run(`(()=>{DLGGAP=0;let n=0;while(!document.querySelector('#dialog').hidden&&n++<80){DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const b=document.querySelector('#dlgBtns button');if(b){b.disabled=false;b.click()}else dlgNext()}})()`);
  const fin=JSON.parse(await run(`JSON.stringify({d:S.subDone.trade,gone:!!S.godGone,st:S.subSt.trade})`));
  assert.deepEqual(fin,{d:1,gone:true,st:4});
  assert.deepEqual(errors,[]);console.log('Ruin find walk+talk+gift once, night waits; trade talk by GOD, thanks+farewell right after trading',first);await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
