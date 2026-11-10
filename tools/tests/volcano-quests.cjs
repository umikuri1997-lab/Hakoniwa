const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 火山（WD=1）のクエストが、草原と同じ・にたものにならないこと。新しいクエストの条件と、古いセーブの読みかえ */
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{};`);
 const fresh=w=>run(`(()=>{resetVillageTransient();if(sheet)closeSheet();setWorld(${w});S=newState(${w});LIVE[${w}]=S;started=true;USERPAUSE=true;NOSAVE=true;window.__noIdle=true;S.introSeen=true;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();return true})()`);

 /* 1. 草原と同じ・にたクエストは、火山に出ない */
 await fresh(1);
 const dup=['chair2','light3','lv_toy2','toy2','toy3','deco3','tree5','food40','room','paint','compost','fish5','lv_parasol','parasol','trap4','fbench2','fbed2','twbox1','yoganup'];
 const subs=await run(`subList().map(q=>q.k)`);
 for(const k of dup)assert.ok(!subs.includes(k),'火山に出てしまう: '+k);
 for(const k of ['shishi1','takeakari1','andonyogan','wall10','ore10','benchwood','twmat1'])assert.ok(subs.includes(k),'火山のサブクエストがない: '+k);
 const v1=await run(`AFTERQ.filter(q=>q.w==null||q.w===1).map(q=>q.k)`);assert.deepEqual(v1,['aqv1','aqv2','aqv3','aqv4']);
 const v0=await run(`AFTERQ.filter(q=>q.w==null||q.w===0).map(q=>q.k)`);assert.deepEqual(v0,['aq2','aq3','aq4','aq5']);
 const d1=await run(`dailyHere().map(g=>g.k)`);assert.ok(!d1.includes('wood')&&d1.includes('bamboo'));
 const d0=await run(`(()=>{const w=WD;WD=0;const r=dailyHere().map(g=>g.k);WD=w;return r})()`);assert.ok(d0.includes('wood')&&!d0.includes('bamboo'));
 await run(`S.cleared=true;dailySet();true`);const dk=await run(`S.daily.k`);assert.ok(!dk.includes('wood'));
 const f1=await run(`freeHere().map(g=>g.k)`);for(const k of ['b5','fl30','fl80'])assert.ok(!f1.includes(k));for(const k of ['tk30','onsen3','andon10','ore50'])assert.ok(f1.includes(k));
 const ids=await run(`QUESTS2.map(q=>q.id)`);assert.ok(!ids.includes('heatPath'));
 const same=await run(`QUESTS2.filter(q=>q.id!=='statue'&&QUESTS1.some(p=>p.text===q.text)).map(q=>q.id)`);assert.deepEqual(same,[]);
 const texts=await run(`Object.fromEntries(['food3','haikage3','fire3','inn','guest'].map(id=>[id,QUESTS2[questIndexOf(id)].text]))`);
 assert.equal(texts.food3,'ホムラのおねがい：たけのこをとってこよう');assert.equal(texts.haikage3,'ハイカゲの灰で、ひびわれをうめよう');assert.equal(texts.fire3,'ようがん台で、火山の熱を村へひこう');assert.equal(texts.inn,'温泉宿に、露天ぶろをつくろう');
 console.log('火山：草原と同じクエストは出ない');

 /* 2. たけのこ */
 await run(`(()=>{for(let j=0;j<W*H;j++)if(S.obj[j]==='takenoko'){S.obj[j]='';delete S.dyn[j]}S.cleared=false;S.quest=questIndexOf('food3');S.qTalked=true;S.qStory=null;st2().tkGot=4;takenokoStart();return true})()`);
 assert.ok(await run(`S.obj.filter(o=>o==='takenoko').length`)>=2,'たけのこが生えない');
 assert.equal(await run(`QUESTS2[S.quest].check()`),false,'うける前のたけのこを数えている');
 await run(`(()=>{const j=S.obj.indexOf('takenoko');const r=S.res[0];const a={obj:j,tk:true};ACT.gather.end(r,a);return true})()`);
 assert.equal(await run(`tkGot()`),1);assert.equal(await run(`QUESTS2[S.quest].check()`),false);
 await run(`(()=>{const j=S.obj.indexOf('takenoko');ACT.gather.end(S.res[0],{obj:j,tk:true});return true})()`);
 assert.equal(await run(`QUESTS2[S.quest].check()`),true);
 /* 食べ物が多くても、たけのこのおねがいのあいだは、とりにいく */
 const tj=await run(`(()=>{S.t=720;takenokoSpawn(2);S.food=20;const r=mkRes(S,'テスト','fire',CX+.5,CY+.5);S.res.push(r);const G=bfs(r.x|0,r.y|0);const ok1=tryJob(r,G,'gather')&&r.act&&S.obj[r.act.obj]==='takenoko';r.act=null;S.quest=questIndexOf('springA');const ok2=!tryJob(r,G,'gather');S.quest=questIndexOf('food3');return [!!ok1,ok2]})()`);
 assert.deepEqual(tj,[true,true],'食べ物が多いとき、たけのこをとりにいかない');
 console.log('たけのこ：うけてから2こで、クリア');

 /* 3. ハイカゲの灰で、ひびわれ */
 await run(`(()=>{S.quest=questIndexOf('haikage3');S.qTalked=true;S.flags.ashOn=true;S.drops=[];st2().hai=0;return true})()`);
 assert.equal(await run(`QUESTS2[S.quest].check()`),false);
 await run(`(()=>{const e={type:'ash',x:CX+.5,y:CY+2.5,hp:0};S.enemies.push(e);defeat(e);return true})()`);
 const hd=await run(`S.drops.filter(d=>d.id==='hai').length`);assert.equal(hd,1,'ハイカゲが灰を落とさない');
 await run(`(()=>{const i=S.drops.findIndex(d=>d.id==='hai');const r=S.res[0];r.carry=null;r.cmat=null;r.citem=null;r.coffin=null;r.meal=null;/* 手ぶらにしてから、ひろう */takeDrop(S.drops.splice(i,1)[0],r);if(r.citem&&r.citem.hai){stowItem('hai',r.citem.hai,r);delete r.citem.hai}/* ひろった灰は、はこんで箱にしまったときに入る */return true})()`);
 assert.equal(await run(`st2().hai`),1);
 await run(`(()=>{st2().hai=CRACKS.length;for(const j of CRACKS){st2().hai--;clearObj(j)}return true})()`);
 assert.equal(await run(`QUESTS2[S.quest].check()`),true);
 await run(`(()=>{const e={type:'ash',x:CX+.5,y:CY+2.5,hp:0};S.enemies.push(e);defeat(e);return true})()`);
 assert.equal(await run(`S.drops.filter(d=>d.id==='hai').length`),0,'ひびわれがないのに灰を落とす');
 console.log('ハイカゲの灰：ひびわれがあるあいだだけ落とし、ぜんぶうめるとクリア');

 /* 4. ようがん台で熱をひく */
 await run(`(()=>{S.quest=questIndexOf('fire3');S.qTalked=true;return true})()`);
 assert.equal(await run(`QUESTS2[S.quest].check()`),false);
 await run(`(()=>{for(const[x,y]of[[CX+1,OFF+6],[CX-6,OFF+7]]){const j=y*W+x;S.obj[j]='yogan'}return true})()`);
 assert.equal(await run(`yoganHeatN()`),2);assert.equal(await run(`QUESTS2[S.quest].check()`),true);
 await run(`(()=>{for(let j=0;j<W*H;j++)if(S.obj[j]==='yogan')S.obj[j]='';const j=(CY+20)*W+CX;S.obj[j]='yogan';S.obj[j+4]='yogan';return true})()`);
 assert.equal(await run(`QUESTS2[S.quest].check()`),false,'熱の道からはなれたようがん台を数えている');
 console.log('ようがん台：熱の道のそばに2つでクリア');

 /* 5. 温泉宿と露天ぶろ */
 const inn=await run(`(()=>{S.flags.onsen=true;SPRM=null;const M=sprMap();const h=M.findIndex((k,j)=>k==='a'&&S.ground[j]===1);if(h<0)return 'nohot';let c=-1;for(let r=1;r<6&&c<0;r++)for(let dy=-r;dy<=r&&c<0;dy++)for(let dx=-r;dx<=r;dx++){const k=h+dy*W+dx;if(S.ground[k]!==1){c=k;break}}HOUSES=[{inside:new Set([c]),set:new Set([c])}];const a=innHouse();const o=c+3;S.obj[o]='onsen';const b=innHouse();S.obj[o]='';const far=c+12*W;S.obj[far]='onsen';const d=innHouse();S.obj[far]='';return [!!a,!!b,!!d]})()`);
 assert.deepEqual(inn,[false,true,false]);
 console.log('温泉宿：温泉のそばの家と、家のそばの露天ぶろでクリア');

 /* 6. サブクエストの条件 */
 const sq=await run(`(()=>{const q=k=>SUBQ.find(x=>x.k===k),o=[];for(let j=0;j<W*H;j++)if(['andon','yogan','wall','shishiodoshi','takeakari','takebench'].includes(S.obj[j]))S.obj[j]='';recount();
  o.push(q('andonyogan').ok());const y=(CY+20)*W+CX;S.obj[y]='yogan';S.obj[y+3]='andon';o.push(q('andonyogan').ok());S.obj[y+3]='';S.obj[y+8]='andon';o.push(q('andonyogan').ok());S.obj[y+8]='';S.obj[y]='';
  for(let i=0;i<9;i++)S.obj[(CY+22)*W+CX-5+i]='wall';recount();o.push(q('wall10').ok());S.obj[(CY+22)*W+CX+4]='wall';recount();o.push(q('wall10').ok());
  S.gotMat={copper:3};S.subB={ore10:q('ore10').base()};S.gotMat.iron=9;o.push(q('ore10').ok());S.gotMat.gold=1;o.push(q('ore10').ok());
  o.push(q('shishi1').ok());S.obj[(CY+24)*W+CX]='shishiodoshi';recount();o.push(q('shishi1').ok());
  {const tj=(CY+24)*W+CX+3;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(S.obj[tj+dy*W+dx]==='bamboo')S.obj[tj+dy*W+dx]='';recount();o.push(q('takeakari1').ok());S.obj[tj]='takeakari';recount();o.push(q('takeakari1').ok());for(const d of [2,W*2,-2])S.obj[tj+d]='bamboo';recount();o.push(q('takeakari1').ok())}
  S.mat.wood=150;S.mat.bamboo=49;o.push(q('twmat1').ok());S.mat.bamboo=50;o.push(q('twmat1').ok());
  o.push(q('benchwood').at());S.recipes.takebench=true;S.quest=questIndexOf('ashiyu');S.qTalked=true;recount();const at=q('benchwood').at();o.push(at);
  o.push(q('wall10').at()===(S.lv>=8));return o})()`);
 assert.deepEqual(sq,[false,true,false,false,true,false,true,false,true,false,false,true,false,true,false,true,true]);
 console.log('火山のサブクエストの条件が、文面と合う');

 /* 7. 古いセーブの読みかえ */
 const mig=await run(`(()=>{const ix=id=>QUESTS2.findIndex(q=>q.id===id),old=id=>QUESTS2_V1.indexOf(id),mk=(o)=>{const s=newState(1);delete s.flags.vq1;return Object.assign(s,o)};const out={};
  let s=mk({quest:old('springB'),qTalked:true});migrateVolcanoQuests(s);out.springB=s.quest===ix('springB');
  s=mk({quest:old('heatPath'),qTalked:false});migrateVolcanoQuests(s);out.heat=s.quest===ix('haikage3')&&!s.qTalked;
  s=mk({quest:old('haikage3'),qStory:old('haikage3'),qTalked:true});migrateVolcanoQuests(s);out.ashStory=s.quest===ix('haikage3')&&s.qStory==null&&s.qTalked;
  s=mk({quest:old('fire3'),qStory:old('fire3'),qTalked:true});migrateVolcanoQuests(s);out.fire=s.quest===ix('fire3')&&s.qStory==null;
  s=mk({quest:old('fest'),qStory:old('fire3'),qTalked:false});migrateVolcanoQuests(s);out.fireDone=s.quest===ix('fest')&&s.qStory==null;
  s=mk({quest:old('inn'),qTalked:true});migrateVolcanoQuests(s);out.inn=s.quest===ix('inn')&&!!s.flags.lv_onsen&&!!s.recipes.onsen;
  s=mk({quest:old('food3'),qTalked:true});s.st2.tkGot=5;migrateVolcanoQuests(s);out.food=s.quest===ix('food3')&&s.st2.tkBase===5&&!!s.flags.tkSpawn;
  s=mk({quest:old('tower'),qStory:old('tower')});migrateVolcanoQuests(s);out.tower=s.quest===ix('tower')&&s.qStory===ix('tower');
  s=mk({quest:QUESTS2_V1.length,cleared:true,aq:3,aqOn:3,aqB:5});migrateVolcanoQuests(s);out.end=s.quest===QUESTS2.length&&s.aq===AFTERQ.findIndex(q=>q.w===1)&&s.aqOn===-1;
  s=mk({subSt:{chair2:2,fbench2:3,benchwood:2,shishi1:0},subDone:{light3:1},subSeen:{chair2:1}});const pt=s.pt;migrateVolcanoQuests(s);out.sub=s.subSt.chair2==null&&!s.subSeen.chair2&&s.subDone.fbench2===1&&s.pt===pt+10&&s.subSt.benchwood===2&&s.subDone.light3===1;
  const q=s.quest;migrateVolcanoQuests(s);out.twice=s.quest===q;
  const g=newState(0);delete g.flags.vq1;Object.assign(g,{cleared:true,aq:3,aqOn:3});migrateVolcanoQuests(g);out.grass=g.aq===2&&g.aqOn===2&&AFTERQ[g.aq].k==='aq4';
  const n=newState(1);out.newGame=!!n.flags.vq1;return out})()`);
 for(const k in mig)assert.ok(mig[k],'読みかえ: '+k);
 console.log('古いセーブの読みかえ：'+Object.keys(mig).join('・'));
 assert.deepEqual(errors,[]);await browser.close();console.log('volcano-quests: ok');
})().catch(e=>{console.error(e);process.exit(1)});
