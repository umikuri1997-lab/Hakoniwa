const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=30;S.feat={summon:true,build:true,plant:true,craft:true,people:true};for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+1.5,CY+.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,CX+i+2.5,CY+.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}S.spotSeen=Object.fromEntries(SPOTS.map(x=>[x.k,1]));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);cam.z=3;centerOn(CX*TS,CY*TS);})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  const read=()=>run(`(()=>{DLGGAP=0;dlgNext();let n=0;while(!document.querySelector('#dialog').hidden&&n++<160){DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;if(sacredDirection())sacredDirection().waitUntil=0;const button=document.querySelector('#dlgBtns button');button.disabled=false;button.click();}return n;})()`);
  let root;
  for(const id of ['earthListen','earthRoot','fireRoot','fireTrace','waterFilm','waterLeaf','windEcho','windVoices','tower']){
    await run(`(()=>{for(const r of S.res){endAct(r);RHOLD.delete(r);SACRED_POSES.delete(r);r.hunger=hMax(r);r.energy=100;r.carry=null;r.cmat=null;r.meal=null;}S.quest=QUESTS1.findIndex(q=>q.id==='${id}');S.qStory=null;S.qTalked=false;DLGGAP=0;checkQuest();let n=0;while(!earthIntroSpeaker(QUESTS[S.quest])&&n++<1200){for(const r of S.res)updRes(r,.5);checkQuest();}if(!earthIntroSpeaker(QUESTS[S.quest]))throw Error('intro not gathered ${id}: '+JSON.stringify(S.res.map(r=>[r.name,r.act?.type,r.act?.stage,r.x,r.y])));DLGTAP=performance.now();startTalk();})()`);
    await read();assert(await run('S.qTalked'),id+' not accepted');
    const current=await run('S.sacredRoot');if(root==null)root=current;else assert.equal(current,root,'tree must not move');
    assert.equal(await run(`canPlace('floor',S.sacredRoot%W,S.sacredRoot/W|0,true)`),false);
    for(const fn of ['canRoof','canRug','canEdge'])assert.equal(await run(`${fn}(S.sacredRoot%W,S.sacredRoot/W|0,true)`),false);
    const count=await run(`FIELD_STORIES['${id}'].length`);
    for(let phase=0;phase<count;phase++){
      await run(`(()=>{for(const r of S.res){RHOLD.delete(r);r.hunger=hMax(r);r.energy=100;}DLGTAP=performance.now();DLGGAP=0;const j=S.sacredRoot;for(let k=0;k<W*H;k++)if(WEEDS.has(S.obj[k])&&Math.hypot(k%W-j%W,(k/W|0)-(j/W|0))<7)S.obj[k]='';{const s0=fieldStump(j),put=(dx,id)=>{const k=s0+2*W+dx;if(!S.obj[k]){S.obj[k]=id;recount()}};if('${id}'==='fireRoot')put(-2,'campfire');if('${id}'==='waterFilm')put(2,'jar');if('${id}'==='windEcho')put(0,'lily');}if(!fieldStoryTap(j%W,j/W|0))throw Error('tap missed');if(!S.res.some(r=>r.act?.type==='fieldstory'))throw Error('no lead ${id}');let n=0;while(document.querySelector('#dialog').hidden&&!DLGQ.length&&n++<1600){if(sacredPlayActive())sacredPlayWin();for(const r of S.res)updRes(r,.5);}if(document.querySelector('#dialog').hidden&&!DLGQ.length)throw Error('no scene ${id} phase ${phase}: '+JSON.stringify(S.res.map(r=>[r.name,r.act?.type,r.act?.stage])));if(fieldStoryState('${id}').step!==${phase})throw Error('progress before reading');DLGGAP=0;dlgNext();})()`);
      await read();assert.equal(await run(`fieldStoryState('${id}').step`),phase+1);
      const spots=await run(`S.res.filter(r=>r.act&&['fieldassist','fieldstory','fieldwait'].includes(r.act.type)).map(r=>(r.y|0)*W+(r.x|0))`);assert.equal(new Set(spots).size,spots.length,'cast overlaps');
    }
    if(await run('S.qStory!=null')){await run('DLGTAP=performance.now();startTalk()');await read();}
    console.log(id,'complete, tree stage',await run('sacredStage()'));
    if(process.env.SCREENSHOT_DIR&&['earthRoot','fireTrace','waterLeaf','tower'].includes(id)){
      await run('camAnim=null;centerOn((S.sacredRoot%W+1)*TS,((S.sacredRoot/W|0)+.8)*TS);');await page.waitForTimeout(150);await page.screenshot({path:process.env.SCREENSHOT_DIR+'/'+id+'.png'});
    }
  }
  assert(await run('S.flags.nushiAlive'));assert.equal(await run("S.obj.filter(o=>o==='tower').length"),1);assert.equal(await run('S.sacredRoot'),root);
  assert.equal(await run("usable('tower')"),false,'no second tree in build palette');
  console.log('migration',await run(`(()=>{const old={world:0,flags:{},obj:Array(W*H).fill(''),dyn:{},quest:0,qStory:null,fieldStories:{waterLeaf:{step:2},windEcho:{step:1}}};old.obj[1000]='tower';migrateSacredStory(old);if(old.sacredRoot!==1000||old.fieldSites.root!==1000||old.fieldStories.waterLeaf.step!==FIELD_STORIES.waterLeaf.length||old.fieldStories.windEcho.step!==0)throw Error('migration');const j=old.sacredRoot;migrateSacredStory(old);if(j!==old.sacredRoot)throw Error('repeat migration');setWorld(1);if(BL.tower.name!=='守護の台座'||TOWER_MAT().wood!==150)throw Error('volcano changed');setWorld(0);return 'old tree location/progress retained, active scene reset, idempotent, volcano unchanged';})()`));
  await run(`(()=>{S.quest=QUESTS1.findIndex(q=>q.id==='nushi');S.qStory=null;S.qTalked=true;S.flags.finalWon=true;S.sev={...(S.sev||{}),e16g:1,e09:1};S.setSh=S.shards=3;for(const r of S.res){endAct(r);r.hunger=hMax(r);r.energy=100;}DLGGAP=0;DLGTAP=performance.now();nushiReturns();})()`);
  const deadline=Date.now()+45000;
  while(!await run('S.cleared')&&Date.now()<deadline){if(await page.locator('#dialog').isVisible())await read();else await run(`S.res.forEach(r=>{if(r.act?.stage==='walk')moveR(r,1)});`);await page.waitForTimeout(100);}
  assert.equal(await run('S.nushi.app'),1,'lord must appear even while world paused');assert(await run('S.cleared'),'revival did not complete');assert(await run('S.flags.sacredReunion'));assert.equal(await run('S.flags.sacredQuietSeen'),false);
  await page.waitForTimeout(1500);await run("if(sheet)closeSheet();DLGGAP=0;DLGTAP=performance.now();nushiTalk()");
  const quietDeadline=Date.now()+15000;while(!await page.locator('#dialog').isVisible()&&Date.now()<quietDeadline){await run(`S.res.forEach(r=>{if(r.act?.stage==='walk')moveR(r,1)});`);await page.waitForTimeout(100);}
  assert.equal(await run('S.flags.sacredQuietSeen'),false);const finishQuiet=Date.now()+30000;while(!await run('S.flags.sacredQuietSeen')&&Date.now()<finishQuiet){if(await page.locator('#dialog').isVisible())await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(b&&!b.disabled&&performance.now()>=DLGA.holdUntil&&!sacredMotionPending())b.click();})()`);await page.waitForTimeout(100);}assert(await run('S.flags.sacredQuietSeen'),await run(`JSON.stringify({quiet:sacredQuietActive(),line:DLGA.full,dialog:document.querySelector('#dialog').hidden,acts:S.res.map(r=>({name:r.name,act:r.act,hold:onHold(r),ready:fieldActorReady(r)})),toasts:document.body.innerText.slice(-1500)})`));
  console.log('Revival and separate quiet reunion complete; unfinished scene is not marked read.');
  assert.deepEqual(errors,[]);console.log('Browser errors:',errors);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
