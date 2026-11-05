const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 草原のはじめの目標（1つずつ）・まとめた目標からの読みかえ・夜のあぜ道のあとの案内・はじめからある切り株 */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;USERPAUSE=true;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  /* 切り株は、はじめからある */
  const stump=JSON.parse(await run(`(()=>{const j=S.sacredRoot;let drawn=0;const o=drawStoryTree;drawStoryTree=(...a)=>{drawn++;return o(...a)};try{drawSacredRoot(performance.now())}finally{drawStoryTree=o}const k=fieldStump(j);return JSON.stringify({j,drawn,fits:sacredRootFits(j),noBuild:sacredNoBuild(k)&&!canPlace('stor',k%W,k/W|0,true)})})()`));
  assert.notEqual(stump.j,null,'new grassland game has a stump');assert.equal(stump.drawn,1,'stump is drawn');assert.equal(stump.fits,true);assert.equal(stump.noBuild,true,'stump cannot be built over');
  /* はじめの目標を、1つずつじゅんに */
  const seq=JSON.parse(await run(`(()=>{updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};queueQuestVisit=()=>null;scheduleGrassReunion=()=>{};S.t=720;S.hold=0;S.introSeen=true;S.flags.tapped=1;
    const realDialog=dialog;dialog=(L,after)=>{if(after)after()};const ids=[],inv=[];
    for(let k=0;k<40&&QUESTS[S.quest]&&QUESTS[S.quest].id!=='fire';k++){const i=S.quest,q=QUESTS[i];ids.push(q.id);if(q.talk&&!S.qTalked){if(q.field)S.qTalked=true;else{TALKW=POKO;startTalk()}}
      if(q.field){for(const p of q.fieldParts)S.fieldStories[p]={step:FIELD_STORIES[p].length}}const c=q.check;q.check=()=>true;try{checkQuest()}finally{q.check=c}
      if(S.qStory===i)startTalk();if(S.quest===i)throw Error('stuck at '+q.id);inv.push(q.id+':'+(S.inv.bed||0)+'/'+(S.inv.path||0))}
    dialog=realDialog;return JSON.stringify({ids,inv,godGone:!!S.godGone,mat:S.mat})})()`));
  assert.deepEqual(seq.ids,['statue','stor','mbox','table','wall','bed','path','lv2','fence4','watch1','kikyo','summon','earthListen','farm6','imoseed','trade','oracle']);
  assert.equal(seq.godGone,true);
  /* まとめた目標のとちゅう（会話は聞いた・食料箱はもう置いた）から：はじめのできていない目標へ。もらった物をかさねない */
  const mig=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));s.flags.qsplit1=0;s.quest=1;s.qStory=null;s.qTalked=true;s.inv={};s.mat.wood=0;s.mat.stone=0;s.obj=s.obj.map(o=>o==='stor'||o==='mbox'||o==='table'?'':o);
    const j=(CY+4)*W+CX+6;s.obj[j]='stor';migrateQuestSplit(s);migrateQuestSplit(s);S=s;LIVE[0]=S;recount();checkQuest();checkQuest();return JSON.stringify({q:QUESTS[S.quest].id,qs:S.qStory,qt:S.qTalked,inv:S.inv,wood:S.mat.wood,pend:S.flags.qsplitPend||null,plant:!!S.feat.plant})})()`));
  assert.equal(mig.q,'mbox');assert.equal(mig.qt,true,'merged talk was heard: no part talk again');assert.deepEqual(mig.inv,{});assert.equal(mig.wood,0,'storage box materials come with its own clear');assert.equal(mig.plant,true,'skipped clear rewards are given');assert.equal(mig.pend,'kurashi');
  const mig2=JSON.parse(await run(`(()=>{const s=JSON.parse(JSON.stringify(S));s.flags.qsplit1=0;s.flags.qsplitPend=0;s.quest=7;s.qStory=null;s.qTalked=true;s.godGone=false;s.flags.tradedSeen=true;s.flags.oracleSeen=false;migrateQuestSplit(s);S=s;LIVE[0]=S;recount();checkQuest();return JSON.stringify({q:QUESTS[S.quest].id,qs:S.qStory!=null?QUESTS[S.qStory].id:null,god:!!S.godGone})})()`));
  assert.deepEqual(mig2,{q:'oracle',qs:'trade',god:false},'farewell talk is kept');
  /* 夜にあぜ道をしいた：目標は朝を待つと書く。朝には、お礼の会話がはじまる */
  const night=JSON.parse(await run(`(()=>{newGame(0);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);started=true;updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};S.introSeen=true;S.quest=questIndexOf('path');S.qTalked=true;S.qStory=null;S.flags.path0=0;S.t=1440*2+23*60+20;
    let n=0;for(let x=CX-8;n<5;x++){const j=(CY+3)*W+x;if(!S.obj[j]&&!S.floor[j]){S.floor[j]='path';n++}}recount();checkQuest();renderQuest();openSheet('menu','goal');const goal=document.querySelector('#sheetBody').innerText;closeSheet();
    return JSON.stringify({top:document.querySelector('#questTxt').textContent,goal})})()`));
  assert.match(night.top,/朝/,'top goal says to wait for morning: '+night.top);assert.match(night.goal,/朝/,'goal list says to wait for morning');
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  await run(`S.t=1440*3+6*60+5;USERPAUSE=false;checkQuest()`);
  await page.waitForFunction(()=>sacredEval(`(()=>{if(S.qStory==null)return true;const r=S.res.find(r=>r.name===TALKW);return !!r&&mainStoryBubbleReady(r)})()`),{},{timeout:60000});
  const morning=JSON.parse(await run(`(()=>{const sq=S.qStory;if(sq!=null)startTalk();return JSON.stringify({sq:sq!=null?QUESTS[sq].id:null,dlg:!document.querySelector('#dialog').hidden,top:document.querySelector('#questTxt').textContent})})()`));
  assert.equal(morning.sq,'path');assert.equal(morning.dlg,true,'morning: the thanks talk starts');
  assert.deepEqual(errors,[]);
  console.log('Early quests one at a time, split migration, night goal after path, morning talk, stump from the start');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
