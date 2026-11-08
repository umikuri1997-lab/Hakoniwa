/* かけらは1つずつ：かけらさがし（lv5、みどりのマスだけ）→「育てる力」1つ、なかよしの想い（omoi）→「想う力」1つ。古いセーブの番号の読みかえ */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);globalThis.__errs=errors;const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{};`);
 await run(`(()=>{resetVillageTransient();setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;window.__noIdle=true;S.introSeen=true;S.flags.minaCame=true;S.flags.nushiAlive=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;S.feat={summon:true,build:true,plant:true,craft:true,people:true};
   const x=S.sacredRoot%W,y=S.sacredRoot/W|0;S.res=[mkRes(S,POKO,'wood',x-2.5,y+5.5),mkRes(S,MINA,'earth',x+4.5,y+5.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,x+i+.5,y+6.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}
   S.fieldStories=Object.fromEntries(Object.entries(FIELD_STORIES).map(([id,L])=>[id,{step:L.length}]));S.spotSeen=Object.fromEntries(SPOTS.map(v=>[v.k,1]));S.sev=Object.fromEntries(SEV1.map(v=>[v.k,1]));growStoryTree();
   S.quest=questIndexOf('lv5');S.qStory=null;S.qTalked=false;S.shards=0;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();showUI(true);})()`);
 await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
 async function read(){const t0=Date.now();await run('DLGGAP=0;DLGTAP=performance.now();startTalk()');assert(!await run(`document.querySelector('#dialog').hidden`),'dialog did not open');
   while(!await run(`document.querySelector('#dialog').hidden`)){assert(Date.now()-t0<30000,'dialog timeout');await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil)b.click();})()`);await page.waitForTimeout(40);}await page.waitForTimeout(300);}
 const clear=async id=>{await run(`(()=>{const q=QUESTS[S.quest];if(q.id!=='${id}')throw Error('quest '+q.id);if(!q.check())throw Error('not done');S.quest++;S.qTalked=false;S.qStory=S.quest-1;})()`);};
 /* かけらさがし：村レベルの目標はない。みどりのマスだけ */
 assert.deepEqual(await run(`QUESTS[S.quest].parts`),['green375']);
 await read();assert(await run('S.qTalked'));
 await run('S.lv=1;GRASSN=3600');assert(await run('QUESTS[S.quest].check()'),'lv5 should clear with green only (village level 1)');
 await clear('lv5');await read();
 assert.equal(await run('S.shards'),1);assert(await run('S.flags.sh_land&&!S.flags.sh_key'),'land shard only');
 assert.equal(await run('QUESTS[S.quest].id'),'omoi');
 /* 受ける前のなかよしは数えない */
 await run('(()=>{const [f,n]=S.res;bondSet(f,n,30)})()');assert.equal(await run('omoiN()'),0);
 await read();assert(await run('S.qTalked&&QUESTS[S.quest].id===\'omoi\''));
 assert.equal(await run('(()=>{const [f,n]=S.res;bondAdd(f,n,40);return omoiN()})()'),0,'already-bonded pair reaching 60 is not counted while others are unbonded');
 assert.equal(await run('(()=>{const [f,n,h,m,k]=S.res;bondSet(f,h,30);bondSet(f,h,40);bondSet(n,m,30);return omoiN()})()'),2,'new pairs counted once');
 assert(!await run('QUESTS[S.quest].check()'));
 assert.equal(await run('(()=>{const [f,n,h,m,k]=S.res;bondSet(m,k,30);bondSet(h,k,30);return omoiN()})()'),3,'stops at 3');
 assert(await run('QUESTS[S.quest].check()'));
 await clear('omoi');await read();
 assert.equal(await run('S.shards'),2);assert(await run('S.flags.sh_land&&S.flags.sh_key'));assert.equal(await run('QUESTS[S.quest].id'),'wood6');
 /* なかよしがもう、ぜんぶそろっているとき：なかよし60になった組を数える */
 assert.equal(await run(`(()=>{S.quest=questIndexOf('omoi');S.qTalked=false;S.qStory=null;S.flags.omoiP=[];const R=S.res;for(let i=0;i<R.length;i++)for(let k=i+1;k<R.length;k++)bondSet(R[i],R[k],30);S.qTalked=true;bondSet(R[2],R[4],60);return omoiN()})()`),1);
 /* 古いセーブ：今のならび（farmFirst1）で、omoi のない番号 */
 const mig=(q,s,pre=true)=>run(`(()=>{const old=QUESTS1.map(v=>v.id).filter(id=>id!=='omoi'),st={world:0,flags:{farmFirst1:1},quest:old.indexOf('${q}'),qStory:${s?`old.indexOf('${s}')`:'null'}};migrateOmoiIns(st,${pre});migrateOmoiIns(st,${pre});return [QUESTS1[st.quest]?.id||null,st.qStory==null?null:QUESTS1[st.qStory].id]})()`);
 assert.deepEqual(await mig('lv5'),['lv5',null]);
 assert.deepEqual(await mig('wood6'),['wood6',null],'past lv5: both shards already, skip omoi');
 assert.deepEqual(await mig('nushi'),['nushi',null]);
 assert.deepEqual(await mig('wood6','lv5'),['omoi','lv5'],'lv5 thanks pending: go to omoi after');
 assert.deepEqual(await mig('wind','tower'),['wind','tower']);
 /* もっと古いセーブ（farmFirst1 のあとで名前で読みかえた物）はずらさない */
 assert.deepEqual(await run(`(()=>{const st={world:0,flags:{},quest:questIndexOf('wood6'),qStory:questIndexOf('lv5')};migrateOmoiIns(st,false);return [QUESTS1[st.quest].id,QUESTS1[st.qStory].id]})()`),['omoi','lv5']);
 assert.deepEqual(errors,[]);console.log('omoi ok');await browser.close();
})().catch(e=>{console.error(e);console.error('ERRS',globalThis.__errs);process.exit(1)});
