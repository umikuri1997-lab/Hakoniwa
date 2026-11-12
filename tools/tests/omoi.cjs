/* かけらは1つずつ：かけらさがし（lv5、ヌシ様の足あとを3つたどる）→「育てる力」1つ、なかよしの想い（omoi、なかよしの2人が御神木へ行く場面を3組）→「想う力」1つ。古いセーブの番号の読みかえ */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);globalThis.__errs=errors;const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{};`);
 await run(`(()=>{resetVillageTransient();setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;window.__noIdle=true;S.introSeen=true;S.flags.minaCame=true;S.flags.nushiAlive=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;S.feat={summon:true,build:true,plant:true,craft:true,people:true};
   sacredRootEnsure();const x=S.sacredRoot%W,y=S.sacredRoot/W|0;S.res=[mkRes(S,POKO,'wood',x-2.5,y+5.5),mkRes(S,MINA,'earth',x+4.5,y+5.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,x+i+.5,y+6.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}
   S.fieldStories=Object.fromEntries(Object.entries(FIELD_STORIES).map(([id,L])=>[id,{step:L.length}]));S.spotSeen=Object.fromEntries(SPOTS.map(v=>[v.k,1]));S.sev=Object.fromEntries(SEV1.map(v=>[v.k,1]));growStoryTree();
   S.quest=questIndexOf('lv5');S.qStory=null;S.qTalked=false;S.shards=0;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();showUI(true);})()`);
 await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
 async function read(){const t0=Date.now();await run('DLGGAP=0;DLGTAP=performance.now();startTalk()');assert(!await run(`document.querySelector('#dialog').hidden`),'dialog did not open');
   while(!await run(`document.querySelector('#dialog').hidden`)){assert(Date.now()-t0<30000,'dialog timeout');await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil)b.click();})()`);await page.waitForTimeout(40);}await page.waitForTimeout(300);}
 const clear=async id=>{await run(`(()=>{const q=QUESTS[S.quest];if(q.id!=='${id}')throw Error('quest '+q.id);if(!q.check())throw Error('not done');S.quest++;S.qTalked=false;S.qStory=S.quest-1;})()`);};
 async function talkOut(t=30000){const t0=Date.now();while(await run(`document.querySelector('#dialog').hidden`)){assert(Date.now()-t0<t,'scene dialog did not open');await page.waitForTimeout(80);}
   while(!await run(`document.querySelector('#dialog').hidden`)){assert(Date.now()-t0<t,'dialog timeout');await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil)b.click();})()`);await page.waitForTimeout(40);}await page.waitForTimeout(300);}
 /* かけらさがし：ヌシ様の足あとを3つたどる（みどりのマスの数だけでは、すすまない） */
 assert.deepEqual(await run(`QUESTS[S.quest].parts`),['green375']);
 await read();assert(await run('S.qTalked'));
 await run('S.lv=1;GRASSN=3600');assert(!await run('QUESTS[S.quest].check()'),'lv5 should not clear with green only');
 assert.equal(await run('printList().length'),3,'three footprints');
 for(let i=0;i<3;i++){
   await run(`(()=>{const f=printList().find(f=>!printTraced(f.j));fogClear(f.a,true);const r=S.res.find(r=>r.name===POKO);r.x=f.j%W+1.5;r.y=(f.j/W|0)+.5;ACT.foglook.end(r,{obj:f.j})})()`);
   await talkOut();assert.equal(await run('printN()'),i+1,'trace '+(i+1));
 }
 assert(await run('QUESTS[S.quest].check()'),'lv5 clears after three footprints');
 await clear('lv5');await read();
 await run(`(()=>{const r=S.res.find(r=>r.name===POKO),x=S.sacredRoot%W,y=S.sacredRoot/W|0;endAct(r);r.x=x-2.5;r.y=y+5.5})()`);/* 足あとから、木のそばへもどす */
 assert.equal(await run('S.shards'),1);assert(await run('S.flags.sh_land&&!S.flags.sh_key'),'land shard only');
 assert.equal(await run('QUESTS[S.quest].id'),'omoi');
 /* 受ける前のなかよしは、受けたあとで、御神木へ行く組になる */
 await run('(()=>{const [f,n]=S.res;bondSet(f,n,30)})()');assert.equal(await run('omoiN()+(S.flags.omoiW||[]).length'),0);
 await read();assert(await run('S.qTalked&&QUESTS[S.quest].id===\'omoi\''));
 assert.equal(await run('(()=>{omoiSeed();omoiSeed();return (S.flags.omoiW||[]).length})()'),1,'a pair bonded before the request waits for the tree scene');
 assert.equal(await run('(()=>{const [f,n,h,m,k]=S.res;bondSet(f,h,30);bondSet(f,h,40);bondSet(n,m,30);return (S.flags.omoiW||[]).length})()'),3,'new pairs wait once');
 assert.equal(await run('omoiN()'),0,'pairs count only after the tree scene');
 /* 御神木をタップすると、2人が根もとへ行って世話をし、ひとことずつ話す。聞きおえて1組 */
 for(let i=0;i<2;i++){assert(await run(`(sacredTreeTap(S.obj.indexOf('tower')),!!OMOI_RUN)`),'scene started');await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden`),{},{timeout:40000});assert(await run(`(()=>{const p=bondPair(S.flags.omoiW[0]);return ((p[0].y|0)*W+(p[0].x|0))!==((p[1].y|0)*W+(p[1].x|0))})()`),'the two stand on different cells');await talkOut();assert.equal(await run('omoiN()'),i+1);}
 assert(!await run('QUESTS[S.quest].check()'));
 assert.equal(await run('(()=>{const [f,n,h,m,k]=S.res;bondSet(m,k,30);bondSet(h,k,30);return omoiN()+(S.flags.omoiW||[]).length})()'),3,'stops at 3');
 await run(`sacredTreeTap(S.obj.indexOf('tower'))`);await talkOut();
 assert(await run('QUESTS[S.quest].check()'));
 await clear('omoi');await read();
 assert.equal(await run('S.shards'),2);assert(await run('S.flags.sh_land&&S.flags.sh_key'));assert.equal(await run('QUESTS[S.quest].id'),'wood6');
 /* 木のなかまと花畑：えらんだ花を御神木のそばに5本咲かせ、木のせいれい5人が1人ずつ世話をする */
 await read();assert(await run(`S.qTalked&&QUESTS[S.quest].id==='wood6'`));const fl=await run('wflKind()');assert(await run(`!!S.unlocked['${fl}']`),'chosen flower unlocked');
 assert.equal(await run(`(()=>{const j=S.sacredRoot;for(let a=0;a<5;a++){const k=j+(sacredSpan()+1)*W+a;S.obj[k]='${fl}';S.floor[k]=0}const k=j+(sacredSpan()+2)*W;S.obj[k]='lotus';return wflN()})()`),5);
 assert.equal(await run(`(()=>{const x=S.sacredRoot%W,y=S.sacredRoot/W|0;for(let i=0;i<4;i++){const r=mkRes(S,'木'+i,'wood',x+i+.5,y+sacredSpan()+3.5);r.hunger=hMax(r);r.energy=100;S.res.push(r)}return S.res.filter(r=>r.elem==='wood').length})()`),5);
 for(let i=0;i<5;i++){assert(await run(`(()=>{const r=S.res.filter(r=>r.elem==='wood'&&!wflT().includes(r.id))[0];endAct(r);r.carry=null;r.cmat=null;r.citem=null;r.meal=null;r.cing=null;r.avoidJ=-1;if(!wflJob(r,bfs(r.x|0,r.y|0))||r.act.type!=='fltend')return false;ACT.fltend.end(r,r.act);endAct(r);return true})()`),'tend '+i);
   assert(!await run(`(()=>{const r=S.res.filter(r=>r.elem==='wood'&&!wflT().includes(r.id))[0];return !!r&&S.res.some(q=>q!==r&&q.act&&q.act.type==='fltend')})()`));}
 assert.equal(await run('wflTN()'),5);assert(await run('QUESTS[S.quest].check()'),'wood6 clears');
 assert.match(await run(`QUESTS[S.quest].story[0][1]`),new RegExp(await run('wflName()')));
 /* なかよしがもう、ぜんぶそろっているとき：なかよし60になった組を数える */
 assert.equal(await run(`(()=>{S.quest=questIndexOf('omoi');S.qTalked=false;S.qStory=null;S.flags.omoiP=[];const R=S.res;for(let i=0;i<R.length;i++)for(let k=i+1;k<R.length;k++)bondSet(R[i],R[k],30);S.qTalked=true;S.flags.omoiW=[];omoiSeed();return (S.flags.omoiW||[]).length})()`),3);
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
