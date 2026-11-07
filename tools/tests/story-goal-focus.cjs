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

  const target=await run(`(()=>{
    updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};S.t=720;S.hold=0;S.quest=questIndexOf('mbox');S.qStory=null;S.qTalked=false;
    const j=(CY+4)*W+CX+5;S.obj[j]='mbox';recount();checkQuest();cam.z=.4;centerOn(100,100);const target=mainStoryFocusTarget();camAnim=null;document.querySelector('#questChip').click();if(sheet!=='menu'||sheetArg!=='goal'||camAnim)throw Error('goal chip should open the goal list');focusMainStoryPlace();
    if(sheet!==null||!camAnim?.storyGoal||mode!=='look'||!document.querySelector('#dialog').hidden||S.qTalked)throw Error('goal did not focus without starting talk');
    return target;
  })()`);
  await page.waitForTimeout(1100);
  const visible=await run(`(()=>{const x=(${target.x}*TS-cam.x)*cam.z,y=(${target.y}*TS-cam.y)*cam.z;return x>24&&x<VW-24&&y>76&&y<VH-100;})()`);assert(visible,'ordinary destination outside visible area');
  for(const size of [{width:1200,height:900},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);await page.waitForTimeout(150);
    await run(`(()=>{S.quest=questIndexOf('earthListen');S.fieldStories={...(S.fieldStories||{}),earthListen:{step:0,built:{legacy:1}}};S.qStory=null;S.qTalked=false;fieldStoryEnsure('earthListen');cam.z=.4;centerOn(100,100);checkQuest();camAnim=null;document.querySelector('#questChip').click();if(sheet!=='menu'||sheetArg!=='goal'||camAnim)throw Error('goal chip should open the goal list');focusMainStoryPlace();if(sheet!==null||!camAnim?.storyGoal)throw Error('field intro focus');})()`);
    await page.waitForTimeout(1000);assert(await run(`(()=>{const p=mainStoryFocusTarget(),x=(p.x*TS-cam.x)*cam.z,y=(p.y*TS-cam.y)*cam.z;return x>28&&x<VW-28&&y>76&&y<VH-100;})()`),'field point outside viewport');
    await run(`(()=>{S.qTalked=true;camAnim=null;document.querySelector('#questChip').click();if(sheet!=='menu'||sheetArg!=='goal'||camAnim)throw Error('goal chip should open the goal list');focusMainStoryPlace();if(!camAnim?.storyGoal||S.qStory!=null)throw Error('accepted investigation focus');})()`);await page.waitForTimeout(1000);
    if(process.env.SCREENSHOT_DIR)await page.screenshot({path:process.env.SCREENSHOT_DIR+'/story-goal-'+size.width+'.png'});
    await run(`(()=>{camAnim=null;S.t=1440;document.querySelector('#questChip').click();if(sheet!=='menu'||sheetArg!=='goal'||camAnim)throw Error('night should open goals');closeSheet();S.t=1800;openSheet('menu','goal');})()`);
    await page.getByRole('button',{name:'お話・調査の場所へ'}).click();assert(await run("sheet===null&&!!camAnim?.storyGoal"),'menu focus button');
    await run(`(()=>{resetVillageTransient();if(camAnim)throw Error('old goal camera survived village reset');})()`);
  }
  await run(`(()=>{S.quest=questIndexOf('mbox');S.qTalked=true;S.qStory=null;TALKW=null;camAnim=null;document.querySelector('#questChip').click();if(sheet!=='menu'||sheetArg!=='goal')throw Error('ordinary non-story goal lost menu');})()`);
  assert.deepEqual(errors,[]);console.log('Goal tap opens the goal list; its place button focuses pending conversation and investigation without starting dialogue; desktop/phone framing, menu link, night/normal goal fallback, and village reset passed.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
