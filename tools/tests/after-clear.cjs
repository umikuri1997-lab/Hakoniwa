const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`window.nativeConsistencyCheck=checkQuest;checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{};`);
 async function prepare(quiet=false){await run(`(()=>{resetVillageTransient();if(sheet)closeSheet();setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;window.__noIdle=true;S.introSeen=true;S.flags.minaCame=true;S.flags.nushiAlive=true;S.flags.finalWon=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;S.totalPt=S.pt=4000;S.feat={summon:true,build:true,plant:true,craft:true,people:true};S.sacredRoot=(CY-3)*W+CX-2;S.fieldSites={root:S.sacredRoot};const x=S.sacredRoot%W,y=S.sacredRoot/W|0;for(let yy=y-20;yy<y+20;yy++)for(let xx=x-20;xx<x+20;xx++){const j=yy*W+xx;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}S.res=[mkRes(S,POKO,'wood',x-2.5,y+3.5),mkRes(S,MINA,'earth',x+4.5,y+3.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,x+i+.5,y+5.5)),...Array.from({length:5},(_,i)=>mkRes(S,'木の子'+i,'wood',x+i+.5,y+8.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}S.quest=questIndexOf('nushi');S.qStory=null;S.qTalked=true;S.fieldStories=Object.fromEntries(Object.entries(FIELD_STORIES).map(([id,L])=>[id,{step:L.length}]));S.spotSeen=Object.fromEntries(SPOTS.map(v=>[v.k,1]));S.sev=Object.fromEntries(SEV1.map(v=>[v.k,1]));S.sev.e16g=S.sev.e09=0;S.shards=3;S.setSh=2;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;growStoryTree();recount();GRASSN=2500;showUI(true);cam.z=2;centerOn(storyTreeX(S.sacredRoot)*TS,storyTreeY(S.sacredRoot)*TS);if(${quiet}){S.cleared=true;S.sev.e16g=S.sev.e09=1;S.setSh=3;S.flags.sacredReunion=true;S.flags.sacredQuietSeen=false;S.nushi={x:storyTreeX(S.sacredRoot)+2.2,y:storyTreeY(S.sacredRoot)+.95,t:6,app:1,dir:0,face:-1,path:[]};}})()`);await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});}
 async function readUntil(done,timeout=30000){const start=Date.now();while(!await run(done)&&Date.now()-start<timeout){await run(`(()=>{if(!document.querySelector('#dialog').hidden){DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click();}else if(!sacredQuietActive())for(const r of S.res)if(r.act?.type==='nmeet'&&r.act.stage==='walk')moveR(r,.5);})()`);await page.waitForTimeout(50);}assert(await run(done),'Timed out: '+done);}
 const tapTree=()=>run(`(()=>{const j=S.sacredRoot;onTap(((j%W+.5)*TS-cam.x)*cam.z,(((j/W|0)+.5)*TS-cam.y)*cam.z);})()`);
 const reset=`(()=>{try{KV.removeItem('hakoniwa-dep1')}catch(e){}LIVE[1]=null;window.went=0;departToVolcano=()=>{window.went=(window.went||0)+1};DEPART_RETRY=0;S.flags.sacredQuietSeen=true;S.flags.areaSkill=false;S.sev.e16g=0;S.clearDay=dayNo();S.godVisit=false;delete S.flags.depStep;})()`;
 await prepare(true);await run(reset);
 // 夜は始めない・クエストも出さない
 await run('S.t=1440;afterTick()');assert(await run("!DEPART_RUN&&document.querySelector('#dialog').hidden&&!S.daily"),'departure at night');
 // 昼：ヌシ様 → カミサマ → 受けつぎ → お見送り → 火山へ（クリアした日のクエストは出さない）
 await run('S.t=720;afterTick()');assert(await run('DEPART_RUN&&!S.daily'),'departure did not start before after-clear quests');
 const seen=[];const start=Date.now();while(!await run('window.went')&&Date.now()-start<90000){const t=await run(`(()=>{if(!document.querySelector('#dialog').hidden){const s=DLGA.full;DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click();return s}for(const r of S.res)if(r.act?.type==='nmeet'&&r.act.stage==='walk')moveR(r,.5);return ''})()`);if(t&&seen[seen.length-1]!==t)seen.push(t);await page.waitForTimeout(50);}
 assert(await run('window.went===1'),'did not go to the volcano');const idx=s=>seen.findIndex(t=>t.includes(s));
 const order=[idx('かけらの中で眠っていた'),idx('次は火山のふもと'),idx('ぼくの力、もっていって'),idx('いってらっしゃい'),idx('いっちゃったね')];console.log('order',order);
 assert(order.every(i=>i>=0)&&order.every((v,i)=>!i||v>order[i-1]),'wrong order');
 assert(await run("KV.getItem('hakoniwa-dep1')==='1'&&S.flags.areaSkill&&S.sev.e16g===1&&S.flags.depStep==null&&S.flags.ret1===1"),'flags after departure');
 assert(await run('!departDue()'),'departure replays');
 // 再開：受けつぎから
 await prepare(true);await run(reset);await run('S.flags.depStep=2;afterTick()');await readUntil("!document.querySelector('#dialog').hidden",30000);assert(await run("DLGA.full.includes('ぼくの力、もっていって')"),'resume did not start at the inheritance');
 // 再開：お見送りから（受けつぎずみ）
 await prepare(true);await run(reset);await run('S.flags.depStep=3;S.flags.areaSkill=true;S.sev.e16g=1;afterTick()');await readUntil("!document.querySelector('#dialog').hidden",30000);assert(await run("DLGA.full.includes('いってらっしゃい')"),'resume did not start at the farewell');
 // もう火山へ行ったセーブ・会話のとちゅうの村切りかえ
 await prepare(true);await run(reset);await run('LIVE[1]={introSeen:true,summary:true,world:1}');assert(await run("!departDue()&&KV.getItem('hakoniwa-dep1')==='1'"),'already departed save replays');
 await prepare(true);await run(reset);await run('afterTick();window.oldS=S;resetVillageTransient();');assert(await run('!DEPART_RUN&&!window.oldS.flags.depStep'),'switch keeps the run');
 // 地図からは出発の場面を出さない
 assert(await run("typeof depart==='undefined'&&typeof departOK==='undefined'"),'map path still exists');
 // クリア後のクエストは、クリアした日のつぎの朝から。古いセーブはすぐ
 await prepare(true);await run(reset);await run(`KV.setItem('hakoniwa-dep1','1');S.clearDay=dayNo();afterTick()`);assert(await run('!S.daily'),'quests on the clear day');await run('S.t+=1440;S.t=Math.floor(S.t/1440)*1440+420;afterTick()');assert(await run('S.daily&&S.daily.d===dayNo()'),'quests next morning');
 await prepare(true);await run(reset);await run(`KV.setItem('hakoniwa-dep1','1');delete S.clearDay;afterTick()`);assert(await run('S.clearDay===0&&!!S.daily'),'old cleared save blocked');
 await prepare(true);await run(reset);await run(`setWorld(1);S.world=1;S.clearDay=dayNo();afterTick()`);assert(await run('!S.daily'),'volcano quests on the clear day');await run('setWorld(0);S.world=0');
 // やりこみ
 assert(await run(`(()=>{const ss=[...document.scripts].map(s=>s.textContent).join('');return !document.body.innerHTML.includes('長い目標')})()`));
 assert.deepEqual(errors,[]);console.log('After-clear departure in the village, resume, no replay, next-morning quests; browser errors: none.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
