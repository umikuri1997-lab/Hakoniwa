/* 草原の転「霧のむこうの影」（kiri.js）：はじまりの会話で、あしたがあらし → あらしのつぎの朝、村の南のはしの霧で、フタバがノドカをかばい、みどりがかれる →
   フタバは御神木の根もとでじっとする（たたかわない）→ ほかの4人が花の世話をおえたら、フタバも動く。古いセーブの番号の読みかえ */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.kiriEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.kiriEval);const run=s=>page.evaluate(s=>kiriEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{};`);
 await run(`(()=>{resetVillageTransient();setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;window.__noIdle=true;S.introSeen=true;S.flags.minaCame=true;S.flags.nushiAlive=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;S.feat={summon:true,build:true,plant:true,craft:true,people:true};
   sacredRootEnsure();const x=S.sacredRoot%W,y=S.sacredRoot/W|0;S.res=[mkRes(S,POKO,'wood',x-2.5,y+5.5),mkRes(S,MINA,'earth',x+4.5,y+5.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,x+i+.5,y+6.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}
   S.fieldStories=Object.fromEntries(Object.entries(FIELD_STORIES).map(([id,L])=>[id,{step:L.length}]));S.spotSeen=Object.fromEntries(SPOTS.map(v=>[v.k,1]));S.sev=Object.fromEntries(SEV1.map(v=>[v.k,1]));growStoryTree();
   S.quest=questIndexOf('kiri');S.qStory=null;S.qTalked=false;S.shards=2;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();showUI(true);})()`);
 await page.waitForFunction(()=>kiriEval('stageReady()'),{},{timeout:60000});
 const step=`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil)b.click();})()`;
 async function talkOut(t=30000){const t0=Date.now();while(await run(`document.querySelector('#dialog').hidden`)){assert(Date.now()-t0<t,'dialog did not open');await page.waitForTimeout(80);}
   while(!await run(`document.querySelector('#dialog').hidden`)){assert(Date.now()-t0<t,'dialog timeout');await run(step);await page.waitForTimeout(40);}await page.waitForTimeout(300);}
 assert.deepEqual(await run(`QUESTS[S.quest-1].id+'>'+QUESTS[S.quest].id+'>'+QUESTS[S.quest+1].id`),'omoi>kiri>wood6','なかよしの想いと花畑のあいだ');
 await run('DLGGAP=0;DLGTAP=performance.now();startTalk()');await talkOut();
 const st=JSON.parse(await run(`JSON.stringify({d:S.flags.kiriD,today:dayNo(),next:S.stormNext,q:wxQ()[dayNo()+1]})`));
 assert.equal(st.d,st.today+1,'あしたが、あらし');assert.equal(st.next,st.d);assert.equal(st.q.s,1);
 assert.equal(await run('QUESTS[S.quest].check()'),false);
 /* あらしのつぎの朝 */
 const pre=JSON.parse(await run(`(()=>{S.t=(S.flags.kiriD)*1440+9*60;S.storm=S.flags.kiriD;const j=kiriSpot();if(j<0)return JSON.stringify({j});const x=j%W,y=j/W|0;for(let b=-6;b<=6;b++)for(let a=-6;a<=6;a++){const k=(y+b)*W+x+a;if(!S.obj[k]&&walk(k)&&S.ground[k]===0&&(a+b)%2===0)S.obj[k]='clover'}S.bud={};recount();return JSON.stringify({j,g:GRASSN})})()`));
 assert.ok(pre.j>=0,'村の南のはしが見つかる');
 await run('kiriTry()');await talkOut();
 await page.waitForFunction(()=>kiriEval('!!KIRI&&KIRI.a>.5'),{},{timeout:5000});
 await page.waitForFunction(()=>kiriEval('!KIRI'),{},{timeout:15000});await talkOut();
 const o=JSON.parse(await run(`(()=>{const f=S.res.find(r=>r.name===POKO),n=S.res.find(r=>r.name===MINA);const o={seen:!!S.flags.kiriSeen,sit:!!S.flags.kiriSit,kare:Object.keys(S.kare||{}).length,g:GRASSN,done:QUESTS[S.quest].check(),alive:S.res.includes(f),sitting:kiriSitting(f),fight:fighter(f),hold:SCENEHOLD};
   endAct(f);f.x=40.5;f.y=40.5;S.t=S.flags.kiriD*1440+10*60;o.goes=tryKiriSit(f)&&f.act.type==='kirisit';
   S.flags.flTend=wflWho().filter(q=>q!==f).map(q=>q.id);o.wflOn=wflOn();o.after=kiriSitting(f);return JSON.stringify(o)})()`));
 assert.ok(o.seen&&o.sit,'場面を見たら、フタバがすわる');assert.equal(o.kare,40,'みどりが40マスかれる');assert.ok(o.g<pre.g);assert.ok(o.done,'クエストがおわる');assert.ok(o.alive);assert.equal(o.hold,0);
 assert.ok(o.sitting);assert.equal(o.fight,false,'すわっているあいだは、たたかわない');assert.ok(o.goes,'昼は、御神木の根もとへ');
 if(o.wflOn)assert.equal(o.after,false,'ほかの4人が花の世話をおえたら、フタバも動く');
 /* 古いセーブ：花畑の話を聞く前なら kiri から・聞いたあとなら花畑のまま */
 const m=JSON.parse(await run(`(()=>{const k=qsIx('kiri'),a={world:0,quest:k,qTalked:false},b={world:0,quest:k,qTalked:true},c={world:0,quest:k+1,qStory:k};kiriIns(a);kiriIns(b);kiriIns(c);return JSON.stringify({k,a:a.quest,b:b.quest,c:[c.quest,c.qStory]})})()`));
 assert.equal(m.a,m.k);assert.equal(m.b,m.k+1);assert.deepEqual(m.c,[m.k+2,m.k+1]);
 assert.deepEqual(errors,[]);await browser.close();console.log('kiri ok');
})().catch(e=>{console.error(e);process.exit(1)});
