const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 草原の通しプレイで見つけた不具合：かまどの訪問でサブクエストが止まる・おねがいの会話のとちゅうでメインができる・全滅のあとのオオカゲの表示・もどったときのひとこと・「次の朝」・名前・見張り台の知らせ・行けない所の芽・ポップアップの絵 */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  const base=`resetVillageTransient();S.quest=questIndexOf('water');S.qTalked=true;S.qStory=null;S.t=1440*10+600;S.hold=0;S.subDone={};S.subSeen={};S.subTalkAt=null;
    if(S.res.length<3){const r=S.res[0];for(const [el,n] of [['earth',MINA],['fire',FIXK0.fire]])S.res.push(mkRes(S,n,el,r.x+1,r.y))}`;
  /* 1. かまどを置いて、まだ料理していなくても、かまどを見にいくのは1回だけ。そのあとは、ほかのサブクエストのふきだしが出る */
  await run(`(()=>{${base}S.t=1440*10+7*60;S.subSt={oven:2,compost:1};S.subSeen={oven:1};S.flags.cooked=false;S.questPartSeen={};const r=S.res[0],k=((r.y|0)+2)*W+(r.x|0)+3;S.obj[k]='oven';recount();for(const q of S.res){q.hunger=hMax(q);q.energy=100;q.fun=100}TESTM=true;S.speed=5;USERPAUSE=false})()`);
  await page.waitForFunction(()=>sacredEval(`!!(S.questPartSeen||{})['0:sub:oven:placed']`),{},{timeout:60000});
  await page.waitForFunction(()=>sacredEval(`(()=>{checkSub();return Object.keys(SUBW).length>0})()`),{},{timeout:30000});
  const oven=JSON.parse(await run(`(()=>{USERPAUSE=true;const w=JSON.stringify(SUBW),v={k:'0:sub:oven:placed'};const a=partVisitStale({partKey:v.k});S.subSt.oven=4;const b=partVisitStale({partKey:v.k});S.subSt.oven=2;return JSON.stringify({w,a,b,hour:hour()})})()`));
  assert.equal(oven.a,false,'the oven visit is kept while the sub quest is accepted');assert.equal(oven.b,true,'dropped after the sub quest ends');
  console.log('Oven placed but not cooked: visited once, then other sub quest bubbles appear',oven.w);
  /* 2. おねがいの会話のとちゅうでメインの目標ができても、聞きおえたら受けたことにする */
  const sub=JSON.parse(await run(`(()=>{${base}S.quest=questIndexOf('bed');S.subSt={benchbreak:1};subTalk('benchbreak');const open=!document.querySelector('#dialog').hidden;
    S.qStory=questIndexOf('bed');checkSub();const mid=S.subSt.benchbreak??null;
    for(let i=0;i<30&&!document.querySelector('#dialog').hidden;i++){DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;document.querySelector('#dlgBtns button').click()}
    const after=S.subSt.benchbreak;S.qStory=null;return JSON.stringify({open,mid,after,seen:(S.subSeen||{}).benchbreak||0})})()`));
  assert.equal(sub.open,true);assert.equal(sub.mid,null,'the offer is withdrawn while the main thanks is pending');assert.equal(sub.after,2,'heard request is accepted');assert.equal(sub.seen,1);
  console.log('Sub request heard while a main goal clears: accepted, not repeated');
  /* 3. 全滅のあとは、5人そろうまでオオカゲは来ない：表示・夕方の会話も同じ */
  const boss=JSON.parse(await run(`(()=>{${base}S.enemyOn=true;S.quest=questIndexOf('ookage');S.bossWarn=1;S.bossKills=0;S.res4Since=1;S.cleared=false;S.finalNight=false;while(S.res.length<4){const r=S.res[0];S.res.push(mkRes(S,'テスト'+S.res.length,'wood',r.x+2,r.y))}
    let d=dayNo()+1;while(!bossNight(d))d++;while(dayNo()<d)S.t+=1440;S.t=Math.floor(S.t/1440)*1440+600;while(dayNo()>d)S.t-=1440;S.wipe=true;const four=[bossDays(),bossTonight()];const r=S.res[0];S.res.push(mkRes(S,'テスト5','wood',r.x+3,r.y));const five=[bossDays(),bossTonight()];S.wipe=false;S.res.pop();const normal=[bossDays(),bossTonight()];
    const keep={bossWarn:S.bossWarn,bossOwed:S.bossOwed,lateWave:S.lateWave,bossDay:S.bossDay};S.wipe=true;const wv=waveFor(d+1);Object.assign(S,keep);S.wipe=false;return JSON.stringify({four,five,normal,bossInWave:wv.includes('boss')})})()`));
  assert.deepEqual(boss.four,['オオカゲ：なかまが5人そろうまで来ない',false],'after a wipe, 4 spirits: not tonight');
  assert.deepEqual(boss.five,['オオカゲが来るまで：今夜',true]);assert.deepEqual(boss.normal,['オオカゲが来るまで：今夜',true]);
  console.log('Boss after a wipe: goal text and the evening talk wait for 5 spirits');
  /* 4. もどったときのひとことは、ぜんぶ出しおわるまで同じ物を出さない */
  const back=JSON.parse(await run(`(()=>{const r=S.res.find(r=>r.name===POKO);r.back=true;const n=BACKL[elemKey(r)].length,L=[];for(let i=0;i<n;i++)L.push(helloLine(r));r.back=false;return JSON.stringify({n,u:new Set(L).size})})()`));
  assert.equal(back.u,back.n,'all return lines before repeating');
  console.log('Return lines: no repeat until all are used');
  /* 6. 先に消えた子が待っているときは「次の朝」と言わない */
  const morn=JSON.parse(await run(`(()=>{S.buried=[{name:FIXK0.fire,elem:'fire',unb:false}];const a=backWhen(FIXK0.fire);S.buried.push({name:MINA,elem:'earth',unb:true});const b=backWhen(MINA),c=HOWK(MINA)[0][1],d=DEATHL.earth(MINA)[2];S.buried=[];return JSON.stringify({a,b,c,d})})()`));
  assert.equal(morn.a,'次の朝、');assert.equal(morn.b,'何日かしたら、');assert.match(morn.c,/何日かしたら、ノドカは/);assert.match(morn.d,/何日かしたら、ノドカは/);
  console.log('Second key spirit lost: not promised for the next morning');
  /* 8. 名前を使いきっても、キーキャラの名前（フタバ2など）は使わない */
  const names=JSON.parse(await run(`(()=>{const keep=S.res.slice();S.nameIdx=NAMES.length-3;S.summon={elem:'wood'};S.summonDay=null;S.mebukiDay=null;const got=[];for(let i=0;i<4;i++){S.summon={elem:'wood',pick:1};S.summonDay=null;S.mebukiDay=null;S.flags.minaCame=true;doSummon();got.push(S.res[S.res.length-1].name)}S.res=keep;NEWQ.length=0;NEWRES=null;if(sheet)closeSheet();return JSON.stringify(got)})()`));
  const keyNames=JSON.parse(await run(`JSON.stringify([...KEYS.flat(),...Object.values(FIXK0)])`));
  assert(names.every(n=>!keyNames.some(k=>n.startsWith(k))),'no key-character names: '+names.join(','));
  console.log('Names after the list wraps:',names.join(' '));
  /* 9. 見張り台の知らせは、夜のあいだ、どの見張り台にもだれも向かっていないときだけ */
  const watch=JSON.parse(await run(`(()=>{const T=[];const t0=toast;toast=(m,k)=>{T.push(m)};try{${base}S.enemyOn=true;S.t=dayNo()*1440+23.5*60;const r=S.res[0],a=((r.y|0)+6)*W+(r.x|0)+6,b=a+6;for(const j of [a,b]){S.obj[j]='watch';setParts('watch',j,'part')}recount();
    const e={type:'basic',x:(a%W)+1,y:(a/W|0)+3,hp:5,spawned:true,path:[]};S.enemies=[e];S.ns={};const w=S.res.find(r=>r.elem==='wood');w.act={type:'watchpost',stage:'walk',obj:a};
    for(let i=0;i<5;i++)updTowers(.2);const one=T.filter(m=>m.includes('見張り台にせいれい')).length;w.act=null;S.ns={};for(let i=0;i<5;i++)updTowers(.2);const none=T.filter(m=>m.includes('見張り台にせいれい')).length;
    for(const j of [a,b]){clearObj(j)}S.enemies=[];recount();return JSON.stringify({one,none})}finally{toast=t0}})()`));
  assert.equal(watch.one,0,'one tower is being manned: no warning');assert.equal(watch.none,1,'nobody: one warning');
  console.log('Watch tower warning: only when no wood spirit is heading to any tower');
  /* 7. せいれいが行けない所には、植える予定を置かない */
  const reach=JSON.parse(await run(`(()=>{${base}S.t=dayNo()*1440+600;const r=S.res[0],x=(r.x|0)+8,y=(r.y|0)+8,j=y*W+x;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const k=(y+dy)*W+x+dx;S.obj[k]='';S.floor[k]='';S.ground[k]=0;S.hi[k]=0}
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)S.obj[(y+dy)*W+x+dx]='rock';recount();S.lv=Math.max(S.lv,3);S.feat.plant=true;S.inv.tree=2;const before=cnt('sprout');const T=[];const t0=toast;toast=m=>T.push(m);try{place('tree',x,y)}finally{toast=t0}const blocked=cnt('sprout')-before;
    S.obj[(y-1)*W+x]='';recount();place('tree',x,y);const open=cnt('sprout')-before;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)S.obj[(y+dy)*W+x+dx]='';recount();return JSON.stringify({blocked,open,msg:T.join('/')})})()`));
  assert.equal(reach.blocked,0,'unreachable cell: no sprout');assert.match(reach.msg,/行けない/);assert.equal(reach.open,1,'reachable after opening a way');
  console.log('Sprouts only where spirits can walk');
  /* 5. ポップアップの絵は、絵文字ではなくドットのアイコン */
  const pop=JSON.parse(await run(`(()=>{GIFT_ACTIVE=false;queueItemGift({hwall:1});showItemGift();const g=document.querySelector('.gift-reveal .idea-symbol');const a=[g.textContent.trim(),!!g.querySelector('svg.pxi')];document.querySelector('.gift-reveal').remove();GIFT_ACTIVE=false;
    showGuardianIdea(['chair'],()=>{});const i=document.querySelector('.idea-reveal .idea-symbol');const b=[i.textContent.trim(),!!i.querySelector('svg.pxi')];document.querySelector('.idea-reveal').remove();return JSON.stringify({a,b})})()`));
  assert.deepEqual(pop.a,['',true]);assert.deepEqual(pop.b,['',true]);
  console.log('Popups: pixel icons, no emoji');
  assert.deepEqual(errors,[]);console.log('Browser errors: none');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
