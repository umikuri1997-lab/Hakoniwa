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

  await run(`(()=>{S.quest=questIndexOf('earthRoot');S.fieldStories={...(S.fieldStories||{}),earthListen:{step:FIELD_STORIES.earthListen.length}};S.qTalked=true;fieldStoryEnsure('earthRoot');const j=S.sacredRoot,x=j%W,y=j/W|0;S.res.forEach((r,i)=>{endAct(r);r.x=x-1+i;r.y=y+2.5;r.act={type:'fieldwait',stage:'do',fieldId:'earthRoot',t:0};});S.res[0].x=x+.5;S.res[0].y=y+3.5;S.res[1].x=x+1.5;S.res[2].x=x-.5;S.res[3].x=x+2.5;S.res[4].x=x+3.5;S.res[4].y=y+3.5;S.nushi={x:x+3.2,y:y+2,app:1,dir:0,face:-1,path:[]};})()`);
  const close=()=>run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;document.querySelector('#dlgBtns button')?.click();})()`);
  const begin=cue=>run(`(()=>{document.querySelector('#dialog').hidden=true;DLGGAP=0;DLGQ.length=0;DLGTAP=performance.now();dialog([[POKO,'……。',0,'stree:${cue}']],()=>{});})()`);
  const frame=async name=>{if(process.env.SCREENSHOT_DIR)await page.screenshot({path:process.env.SCREENSHOT_DIR+'/'+name+'.png'});};
  for(const cue of ['soil','stone','bump','water','wind','leaf','hug']){
    await begin(cue);await close();assert(await page.locator('#dialog').isVisible(),cue+' must have time to play');
    if(cue==='bump'||cue==='hug')await page.waitForFunction(cue=>sacredEval(cue==='hug'?`!!sacredEffect('embrace')`:`S.res.some(r=>sacredPose(r)?.anim==='storyBump')`),cue,{timeout:7000});
    else if(cue!=='leaf'){const animation=await run(`S.res.map(r=>sacredPose(r)?.anim).filter(Boolean)`);assert(animation.length,cue+' has no cast motion');}
    await page.waitForTimeout(cue==='leaf'?1200:250);
    if(cue==='bump')assert(await run(`Math.abs(S.res[0].x-S.res[1].x)+Math.abs(S.res[0].y-S.res[1].y)<2`),'hands must be near each other');
    if(cue==='leaf'){
      const p=await run('sacredTreeMotion(performance.now()).progress');assert(p>0&&p<1,'leaf must unfold over time');
      const before=await run('sacredStage()');assert.equal(before,0,'preview must not complete quest');
    }
    if(cue==='hug')assert(await run(`!!sacredEffect('embrace')`),'must reach the lord during dialogue');
    await frame('direction-'+cue);
    while(await run('sacredMotionPending()'))await page.waitForTimeout(150);await page.waitForTimeout(Math.max(0,await run(`sacredLineHold('stree:${cue}')-(performance.now()-DLGA.lineT)`))+150);await close();assert.equal(await page.locator('#dialog').isVisible(),false,cue+' must allow continue');
  }
  for(const size of [{width:1200,height:900},{width:390,height:844}]){
    await begin('group');await page.setViewportSize(size);await page.waitForTimeout(150);await page.waitForTimeout(1900);await frame('direction-group-'+size.width);
    const bounds=await run(`(()=>{const q=sacredDirection().shot;return {left:(q.left-cam.x)*cam.z,right:(q.right-cam.x)*cam.z,top:(q.top-cam.y)*cam.z,bottom:(q.bottom-cam.y)*cam.z,safeBottom:q.safeBottom,dialogTop:document.querySelector('#dialog .dlg').getBoundingClientRect().top};})()`);
    assert(bounds.left>=0&&bounds.right<=size.width,JSON.stringify(bounds));assert(bounds.top>=65&&bounds.bottom<=bounds.safeBottom+2,JSON.stringify(bounds));assert(bounds.bottom<bounds.dialogTop-65,JSON.stringify(bounds));
    await page.waitForTimeout(100);await close();
  }
  await begin('hug');const savedPosition=await run('JSON.stringify([S.res[0].x,S.res[0].y])');const before=await run('VILLAGE_SESSION');await run('resetVillageTransient()');assert.equal(await run('VILLAGE_SESSION'),before+1);assert.equal(await run('sacredDirection()'),null);assert.equal(await run('SACRED_PREVIEW.has(S)'),false);assert.equal(await run('camAnim'),null);
  await page.waitForTimeout(400);assert.equal(await run('sacredDirection()'),null,'no stale callback');assert.equal(await run('JSON.stringify([S.res[0].x,S.res[0].y])'),savedPosition,'cancelled walk must stop');
  assert.deepEqual(errors,[]);console.log('Timed gestures, water, leaf unfolding, actual embrace, desktop/mobile framing, and scene cancellation passed. Browser errors: none');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
