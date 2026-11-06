const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 物語のできごとのあと、なかまが村に物を置く：1回だけ・置ける所がなければしない・夜はまつ・ロードしても残る・古いセーブはしない */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  await run(`(()=>{updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};scheduleGrassReunion=()=>{};window.SAID=[];talkOnce=(k,L)=>{SAID.push([k,L[0][0],L[0][1]]);S.flags[k]=1};
    S.introSeen=true;S.t=1440+10*60;S.enemies=[];const add=(n,el,dx)=>{if(!S.res.some(r=>r.name===n)){const r=mkRes(S,n,el,CX+dx,CY+4);S.res.push(r)}};add(MINA,'earth',1);add(FIXK0.fire,'fire',2);add(FIXK0.water,'water',3);add(FIXK0.wind,'wind',-2);
    for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;r.act=null}recount();})()`);
  /* 前からのセーブ：もうおわったできごとは置かない */
  const old=JSON.parse(await run(`(()=>{S.flags.vgift1=0;S.vgSeen={};S.vgift=[];S.quest=questIndexOf('wind');S.qStory=null;S.qTalked=true;vgScan();vgScan();return JSON.stringify({p:S.vgift,seen:Object.keys(S.vgSeen).sort()})})()`));
  assert.deepEqual(old.p,[],'old save: nothing placed for past events');assert.deepEqual(old.seen,['earthListen','fire','fireRoot','ookage','summon','water','waterFilm']);
  /* 夜はまつ */
  const night=JSON.parse(await run(`(()=>{S.quest=questIndexOf('wind')+1;S.qStory=null;S.t=1440*2+23*60+30;villageGiftTick();return JSON.stringify({p:S.vgift,act:S.res.some(r=>r.act&&r.act.type==='vgift')})})()`));
  assert.deepEqual(night.p,['wind'],'queued once after the wind talk');assert.equal(night.act,false,'no walking at night');
  /* ロードしても残る */
  const re=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));S=s;LIVE[0]=S;recount();return JSON.stringify({p:S.vgift,seen:!!S.vgSeen.wind})})()`));
  assert.deepEqual(re.p,['wind']);assert.equal(re.seen,true);
  /* 思い出帳の再生ではしない */
  assert.equal(await run(`(()=>{S.t=1440*3+10*60;MEMRUN=true;villageGiftTick();const a=S.res.some(r=>r.act&&r.act.type==='vgift');MEMRUN=false;return a})()`),false);
  /* 昼：風のせいれいが歩いて行って置く（本当に歩かせる） */
  await run(`(()=>{for(const r of S.res)if(r.name!==keyName('wind')){r.act={type:'idle',stage:'do',t:0,dur:9999}}villageGiftTick();USERPAUSE=false})()`);
  assert.equal(await run(`S.res.find(r=>r.name===keyName('wind')).act?.type`),'vgift','wind spirit starts walking');
  await page.waitForFunction(()=>sacredEval(`!S.vgift.length&&SAID.some(x=>x[0]==='vg_wind')`),{},{timeout:60000});
  await run('USERPAUSE=true');
  const wind=JSON.parse(await run(`JSON.stringify({n:cnt('parasol'),who:SAID.find(x=>x[0]==='vg_wind')[1]})`));
  assert.equal(wind.n,1,'one parasol');assert.equal(wind.who,await run(`keyName('wind')`));
  /* 1回だけ */
  assert.deepEqual(JSON.parse(await run(`(()=>{vgScan();vgScan();return JSON.stringify(S.vgift)})()`)),[],'not queued again');
  /* ほかのできごと：着いたときの置き方（それぞれ1回ずつ） */
  const each=JSON.parse(await run(`(()=>{const out={};for(const g of VGIFT){if(g.k==='wind')continue;const r=S.res.find(q=>q.name===vgWho(g));const before=cnt(g.id);S.vgift=[g.k];const p=vgPick(g,r);if(!p){out[g.k]='none';continue}const a={gk:g.k,cells:p.cells};const ok=ACT.vgift.start(r,a)!==false;out[g.k]=[ok,cnt(g.id)-before,S.vgift.length]}return JSON.stringify(out)})()`));
  for(const g of ['summon','earthListen','fire','fireRoot','water','ookage','windEcho']){const n={summon:3,earthListen:2,fireRoot:2,windEcho:2}[g]||1;assert.deepEqual(each[g],[true,n,0],g+' '+JSON.stringify(each[g]))}
  /* 置ける所がなければ、なにもしない（ハス：近くに水がない） */
  const none=JSON.parse(await run(`(()=>{for(let j=0;j<W*H;j++)if(S.ground[j]===1)S.ground[j]=0;recount();S.vgift=['waterFilm'];const b=cnt('lotus');for(const r of S.res)r.act=null;villageGiftTick();return JSON.stringify({p:S.vgift,n:cnt('lotus')-b,act:S.res.some(r=>r.act&&r.act.type==='vgift')})})()`));
  assert.deepEqual(none,{p:[],n:0,act:false},'no water: skipped silently');
  /* 草原のほか（フリーモード）ではしない */
  assert.equal(await run(`(()=>{S.free=true;S.vgift=['fire'];villageGiftTick();const a=S.res.some(r=>r.act&&r.act.type==='vgift');S.free=false;return a})()`),false);
  assert.deepEqual(errors,[]);
  console.log('Village gifts: once per event, old saves skip, night wait, reload, real walk, every event, no space, replay/free skip',JSON.stringify(each));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
