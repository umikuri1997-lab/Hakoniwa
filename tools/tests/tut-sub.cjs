const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 交換・おつげは、メインではなくサブクエスト。古いセーブは名前で読みかえる（とちゅうならサブのつづき・おわっていれば出さない） */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  assert.equal(await run(`QUESTS1.some(q=>q.id==='trade'||q.id==='oracle')`),false,'not main quests');
  assert.equal(await run(`QUESTS1[questIndexOf('imoseed')+1].id`),'earthListen','imoseed is followed by earthListen');
  const mig=s=>run(`(()=>{const s=Object.assign({world:0,flags:{tutSub1:0},mat:{},inv:{}},${JSON.stringify(s)});const V=QUESTS1_V3();s.quest=V.indexOf(s.quest);if(s.qStory!=null)s.qStory=V.indexOf(s.qStory);migrateTutSub(s);const once=JSON.stringify([s.quest,s.qStory,s.subSt]);migrateTutSub(s);return JSON.stringify({q:QUESTS1_V4[s.quest],qs:s.qStory!=null?QUESTS1_V4[s.qStory]:null,qt:s.qTalked,st:s.subSt,done:s.subDone,same:once===JSON.stringify([s.quest,s.qStory,s.subSt])})})()`).then(JSON.parse);
  let r=await mig({quest:'oracle',qStory:null,qTalked:true});
  assert.deepEqual([r.q,r.qs,r.qt,r.st.oracle,r.st.trade,r.done.trade,r.same],['fire',null,false,2,4,1,true],'on oracle: continues as a sub quest');
  r=await mig({quest:'trade',qStory:null,qTalked:false});
  assert.deepEqual([r.q,r.st.trade,r.st.oracle],['fire',undefined,undefined],'trade not heard yet: offered again later as a sub quest');
  r=await mig({quest:'oracle',qStory:'trade',qTalked:false});
  assert.deepEqual([r.q,r.qs,r.st.trade],['fire',null,3],'trade thanks pending: sub quest report');
  r=await mig({quest:'water',qStory:'fire',qTalked:false});
  assert.deepEqual([r.q,r.qs,r.st.trade,r.st.oracle,r.done.trade,r.done.oracle],['water','fire',4,4,1,1],'past: done, never shown again');
  r=await mig({quest:'imoseed',qStory:'farm6',qTalked:false});
  assert.deepEqual([r.q,r.qs,r.st.trade],['imoseed','farm6',undefined],'before: unchanged');
  assert.equal(await run(`(()=>{const s={world:1,flags:{},quest:5,qStory:4};migrateTutSub(s);return s.quest===5&&s.qStory===4})()`),true,'volcano unaffected');
  assert.equal(await run(`(()=>{const s={world:0,free:true,flags:{},quest:5,qStory:4};migrateTutSub(s);return s.quest===5&&s.qStory===4})()`),true,'free unaffected');
  /* 新しいゲーム：いものたねのあとに、サブクエストとして受けて、たっせいする */
  const flow=JSON.parse(await run(`(()=>{dialog=(L,after)=>{if(after)after()};S.t=1440+10*60;S.godShown=true;S.godGone=false;S.quest=questIndexOf('imoseed');S.qTalked=true;S.qStory=null;
    const T=SUBQ.find(q=>q.k==='trade'),O=SUBQ.find(q=>q.k==='oracle'),b=[T.at(),O.at()];S.quest++;S.qTalked=false;const a=[T.at(),O.at()];
    checkSub();S.subSt.trade=1;S.subTalkAt=null;subTalk('trade');const acc=[S.subSt.trade,!!S.feat.shop];S.flags.tradedSeen=1;S.subTalkAt=-999;checkSub();const rep=S.subSt.trade;subTalk('trade');
    S.subSt.oracle=1;subTalk('oracle');S.flags.oracleSeen=1;checkSub();subTalk('oracle');
    return JSON.stringify({b,a,acc,rep,trade:S.subDone.trade,oracle:S.subDone.oracle,god:!!S.godGone,main:QUESTS[S.quest].id})})()`));
  assert.deepEqual(flow,{b:[false,false],a:[true,true],acc:[2,true],rep:3,trade:1,oracle:1,god:true,main:'earthListen'});
  /* 交換をしないまま火のせいれいをむかえた：カミサマは旅立ちの会話を1回して旅立つ。交換のサブクエストはとりやめ */
  const bye=JSON.parse(await run(`(()=>{let n=0,last=null;dialog=(L,after)=>{n++;last=L;if(after)after()};S.godGone=false;S.godShown=true;S.subSt.trade=2;delete S.subDone.trade;S.feat.shop=false;S.t=1440*5+10*60;S.quest=questIndexOf('fire');S.qStory=null;S.qTalked=true;GODBYE=0;
    godFarewellTick();const before=n;S.quest++;S.qTalked=false;godFarewellTick();godFarewellTick();
    return JSON.stringify({before,n,god:!!S.godGone,st:S.subSt.trade,done:S.subDone.trade,shop:!!S.feat.shop,first:last&&last[0][0],at:SUBQ.find(q=>q.k==='trade').at(),hint:last.some(l=>/ヌシの気配/.test(l[1]))})})()`));
  assert.deepEqual(bye,{before:0,n:1,god:true,st:4,done:1,shop:true,first:await run('GOD'),at:false,hint:true});
  assert.deepEqual(errors,[]);
  console.log('Trade/oracle are sub quests: old save migration by name, new game flow, other modes unaffected');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
