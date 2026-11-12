/* せいれいが消えたとき：なかよしの子が、見た会話の思い出を話す。棺は、なかよしの子がはこぶ（いなければ、章のはじめからいる子） */
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  const setup=`(()=>{resv.clear();setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=30;for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}
    S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+1.5,CY+.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,CX+i+2.5,CY+.5)),mkRes(S,'テスト','wood',CX+6.5,CY+.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);})()`;
  await run(setup);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  const last=`(()=>{const P=S.pendTalk||{},k=Object.keys(P).pop(),L=k?P[k]:null;if(!L)return null;if(!/teary hush/.test(L[0][1])||!goneEntry(L[0][0]))throw Error('no last word '+JSON.stringify(L[0]));return L.slice(1)})()`;/* はじめの行は、消える子のさいごのひとこと */
  /* ふつうの子：なかよしのホノが、見た雑談の思い出を話す。棺はホノだけ */
  console.log('generic',await run(`(()=>{const [f,n,h,a,w,t]=S.res;S.bond={};bondAdd(t,h,40);const ci=CHATS.findIndex(c=>c.mate&&/合図/.test(c.mem||''));if(ci<0)throw Error('no mem chat');bondMemNote(t,h,ci);S.pendTalk={};die(t);
    const L=${last};if(!L)throw Error('no talk');if(L.slice(0,3).some(l=>l[0]!==h.name))throw Error('not mate '+JSON.stringify(L));if(!/合図/.test(L[1][1]))throw Error('no memory '+L[1][1]);if(L.some(l=>l[0]===POKO))throw Error('futaba talks');
    if(!/わすれない/.test(L[L.length-1][1])||L[L.length-1][0]!==h.name)throw Error('end');const g=Object.keys(S.dyn).find(j=>S.obj[j]==='grave');if(!g||S.dyn[g].mate!==h.name)throw Error('grave mate');
    for(const r of S.res)endAct(r);const Gf=bfs(f.x|0,f.y|0);if(goBurial(f,Gf))throw Error('futaba buried before mate');const Gh=bfs(h.x|0,h.y|0);if(!goBurial(h,Gh))throw Error('mate not burying');
    return L.map(l=>l[0]+'：'+l[1]).join(' / ')})()`));
  /* なかよしがいない：フタバがはこぶ */
  await run(setup);
  console.log('no mate',await run(`(()=>{const [f,n,h,a,w,t]=S.res;S.bond={};S.flags.lostA=1;S.flags.death2Told=1;die(t);const g=Object.keys(S.dyn).find(j=>S.obj[j]==='grave');if(!g||S.dyn[g].mate)throw Error('grave');for(const r of S.res)endAct(r);
    if(goBurial(n,bfs(n.x|0,n.y|0)))throw Error('nodoka before futaba');if(!goBurial(f,bfs(f.x|0,f.y|0)))throw Error('futaba not burying '+JSON.stringify({rv:[...resv],ban:[...BAN],acts:S.res.map(r=>r.act&&r.act.type),cnt:cnt('grave'),dist:bfs(f.x|0,f.y|0).dist[+g],by:(buryWho(S.dyn[g])||{}).name,d:S.dyn[g],h:f.hunger,held:heldN(f),meal:f.meal,cing:f.cing,coffin:f.coffin,night:isNight()}));S.dyn[g].t0=S.t-BURYWAIT-1;endAct(f);endAct(n);resv.clear();if(!goBurial(n,bfs(n.x|0,n.y|0)))throw Error('no fallback');return 'futaba first, others after wait'})()`));
  /* キーキャラ：なかよし30の会話を見た組。説明（カミサマ）は残す */
  await run(setup);
  console.log('key',await run(`(()=>{const [f,n,h,a,w]=S.res;S.bond={};bondAdd(a,w,35);(S.sev||(S.sev={}))['bd_'+bondKey(a,w)]=1;S.pendTalk={};die(a);const L=gvOnce(${last});if(!L)throw Error('no talk');
    if(L.slice(0,3).some(l=>l[0]!==w.name))throw Error('not mate '+JSON.stringify(L));if(!/池/.test(L[1][1]))throw Error('memory '+L[1][1]);if(!L.some(l=>l[0]===GOD&&/つながり/.test(l[1])))throw Error('no explain');if(!S.flags.lostKwater||!S.flags.deathTold)throw Error('flags');
    if(L.some(l=>l[0]===POKO))throw Error('futaba talks');return L.map(l=>l[0]+'：'+l[1]).join(' / ')})()`));
  /* 見た会話がない：いっしょにしたこと */
  await run(setup);
  console.log('did',await run(`(()=>{const [f,n,h,a,w,t]=S.res;S.bond={};const j=CY*W+CX+9;S.obj[j]='swing';bondAdd(n,t,29);n.act={type:'play',stage:'do',obj:j,t:0};bondPlayStart(t,{obj:j,what:'swing'});S.obj[j]='';endAct(n);S.pendTalk={};die(t);const L=${last};
    if(L[0][0]!==n.name||!/ブランコ/.test(L[1][1]))throw Error(JSON.stringify(L));return L[1][1]})()`));
  /* 火山：なかよしの子が話す */
  console.log('volcano',await run(`(()=>{setWorld(1);S=newState(1);LIVE[1]=S;started=true;S.t=720;S.hold=0;if(S.res.length<2)S.res.push(mkRes(S,SHIZUKU,'water',S.res[0].x+1,S.res[0].y));const [a,b]=S.res;for(const r of S.res){r.hunger=hMax(r);r.energy=100}
    S.bond={};bondAdd(a,b,30);(S.sev||(S.sev={}))['bd_'+bondKey(a,b)]=1;S.pendTalk={};die(b);const L=${last};if(!L||L[0][0]!==a.name)throw Error(JSON.stringify(L));return L.map(l=>l[0]+'：'+l[1]).join(' / ')})()`));
  /* 消えたあと：思い出帳・しょんぼり・お墓まいり・雑談・にている子 */
  await run(setup);
  console.log('after',await run(`(()=>{const [f,n,h,a,w,t]=S.res;S.bond={};bondAdd(t,h,40);bondMemNote(t,h,CHATS.findIndex(c=>c.mate&&/星/.test(c.mem||'')));S.pendTalk={};die(t);
    const e=goneEntry('テスト');if(!e||e.mate!==h.name||!/星/.test(e.mem||''))throw Error('book '+JSON.stringify(e));
    griefTick();if(!h.grief||f.grief)throw Error('grief');
    for(const r of S.res)endAct(r);if(goMourn(h,bfs(h.x|0,h.y|0)))throw Error('mourn before burial');
    for(const L of [S.lost||[]])for(const q of L)delete q.unb;for(const j in S.dyn)if(S.obj[j]==='grave'){S.obj[j]='';delete S.dyn[j]}recount();
    if(!goMourn(h,bfs(h.x|0,h.y|0)))throw Error('no mourn');if(h.act.type!=='mourn')throw Error('act');if(goMourn(h,bfs(h.x|0,h.y|0))&&h.act.who!=='テスト')throw Error('twice');
    const fk=h.act.obj;if(h.act.fl!=='clover'||fk<0||Math.hypot(fk%W-e.j%W,(fk/W|0)-(e.j/W|0))>MOURN_R*1.5)throw Error('spot '+JSON.stringify(h.act));h.act.stage='do';ACT.mourn.start(h,h.act);ACT.mourn.tick(h,Object.assign(h.act,{t:5}));if(S.obj[fk]!=='clover')throw Error('flower not planted');endAct(h);
    /* 水のせいれい：そばに水がなければ、ゆり */const wq={elem:'water',j:e.j};const ws=mournSpot(wq);if(!ws||ws.id!=='lily')throw Error('water no-pond '+JSON.stringify(ws));S.ground[e.j+2]=1;recount();const ws2=mournSpot(wq);if(!ws2||ws2.id!=='lotus'||ws2.k!==e.j+2)throw Error('water pond '+JSON.stringify(ws2));S.ground[e.j+2]=0;recount();
    if(goneTalkName()!=='テスト')throw Error('talk name');const gi=CHATS.findIndex(c=>c.gone);if(gi<0)throw Error('no gone chat');
    let seen=0;for(let i=0;i<40;i++)if(CHATS[chatTopic(f,n)].gone)seen++;if(!seen)throw Error('gone chat never');
    const x=mkRes(S,'あたらしい','wood',CX+8.5,CY+.5);S.res.push(x);simNote(x);if(!x.simTo||x.simTo.m!==h.name)throw Error('sim');
    return 'book「'+e.mem+'」 grief mourn clover/lotus/lily chat'+seen+'/40 sim'})()`));
  /* よみがえったとき：なかよしとの再会の会話（さいごのひとこと・見た会話にこたえる）と、よろこぶ場面 */
  await run(setup);
  console.log('reunion',await run(`(()=>{const [f,n,h,a,w,t]=S.res;S.bond={};bondAdd(t,h,40);bondMemNote(t,h,CHATS.findIndex(c=>c.mate&&/星/.test(c.mem||'')));S.pendTalk={};die(t);const e=goneEntry('テスト');if(!e.lw)throw Error('no lw');
    const q=mkRes(S,'テスト','wood',CX+3.5,CY+2.5);q.id=t.id;S.res.push(q);goneBack('テスト');q.reMate=h.name;reunite(q,[CX+3,CY+2]);if(q.reTalk!==h.name)throw Error('reTalk');
    const L=reunionLines(q,h);if(L[0][0]!==h.name||L[1][0]!=='テスト'||!/星/.test(L[3][1]))throw Error(JSON.stringify(L));if(/ごめん|わる|わり|すまない/.test(e.lw)&&!/あやまった/.test(L[2][1]))throw Error('lw reply '+e.lw+' | '+JSON.stringify(L));
    e.fl=[];const fk=e.j+1;S.obj[fk]='clover';e.fl.push(fk);recount();reunionJoy(q,h);if(!JOYU.has(h)||!JOYU.has(q))throw Error('joy');if(!S.rvq||reWithP(q)!==h||reWithP(h)!==q)throw Error('after reunion '+JSON.stringify(S.rvq));
    S.rvq.t=0;for(const r of S.res){endAct(r);r.hunger=hMax(r)}revisitTick(true);if(!q.act||q.act.type!=='rvisit'||!h.act||h.act.type!=='rvisit'||q.act.obj!==fk)throw Error('revisit '+JSON.stringify([q.act,h.act]));
    q.act.stage='do';h.act.stage='do';ACT.rvisit.start(q,q.act);ACT.rvisit.start(h,h.act);ACT.rvisit.tick(q,q.act);if(!q.act.talk)throw Error('no talk');if(document.querySelector('#dialog').hidden)throw Error('no dialog');if(h.grief&&griefOn(h))throw Error('still grief');return L.map(l=>l[0]+'：'+l[1]).join(' / ')+' + revisit'})()`));
  /* 会話を最後まで送ると、よみがえった子が、なかよしの属性の花をとなりに植える */
  for(let i=0;i<120;i++){const done=await run(`(()=>{if(!document.querySelector('#dialog').hidden){DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=(DLGA.holdUntil||0))b.click();return false}return (S.memo||[]).some(m=>/お礼の花/.test(m[2]))})()`);if(done)break;await page.waitForTimeout(150)}
  console.log('thanks',await run(`(()=>{const m=(S.memo||[]).find(m=>/お礼の花/.test(m[2]));if(!m)throw Error('no thanks flower');const e=goneEntry('テスト');const id=S.obj[e.fl[e.fl.length-1]];if(id!=='salvia')throw Error('flower '+id);return m[2]+' ('+id+')'})()`));
  if(errors.length)throw Error(errors.join('\n'));
  await browser.close();console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
