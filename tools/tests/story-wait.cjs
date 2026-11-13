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

  console.log('ordinary main prompt',await run(`(()=>{
    updTut=()=>{};finalCheck=()=>{};showItemGift=()=>{};showSpotPop=()=>{};S.enemyOn=true;S.t=720;S.hold=0;
    S.quest=questIndexOf('stor');S.qStory=null;S.qTalked=false;const r=S.res[0],home=(r.y|0)*W+(r.x|0),j=home+8;S.obj[j]='crate';recount();checkQuest();
    for(let i=0;i<400&&!(r.act?.type==='storywait'&&r.act.stage==='do');i++)updRes(r,.5);
    if(!mainStoryBubbleReady(r)||r.act?.type!=='storywait'||r.act.stage!=='do'||!questVisitReached(r,j))throw Error('not waiting at box '+JSON.stringify(r.act));
    const hunger=r.hunger,fun=r.fun;for(let i=0;i<720;i++)updRes(r,.5);if(r.hunger!==hunger)throw Error('waiting consumed food');if(r.fun<fun)throw Error('waiting reduced fun');
    S.qTalked=true;updRes(r,.5);if(r.act?.type!=='storyreturn')throw Error('no return after accepting');for(let i=0;i<400&&r.act?.type==='storyreturn';i++)updRes(r,.5);
    if(Math.abs((r.y|0)-(home/W|0))+Math.abs((r.x|0)-home%W)>1)throw Error('return did not reach home');return 'walk to box, no hunger for long wait, walk back after conversation';
  })()`));
  console.log('waiting reasons',await run(`(()=>{
    S.t=720;S.qTalked=false;S.qStory=null;S.quest=questIndexOf('stor');const r=S.res[0],obj=mainStoryWaitInfo().obj;endAct(r);r.hunger=0;
    if(!storyWaitStatusText().includes('食事'))throw Error('missing food reason');r.hunger=hMax(r);r.energy=0;
    if(!storyWaitStatusText().includes('休んで'))throw Error('missing rest reason');r.energy=100;r.cing={rec:'test'};
    if(!storyWaitStatusText().includes('料理'))throw Error('missing cook reason');r.cing=null;
    noteStoryWaitBlock(r,obj,'path');if(!storyWaitStatusText().includes('道をあけよう'))throw Error('missing path reason');
    noteStoryWaitBlock(r,obj,'crowded');if(!storyWaitStatusText().includes('立つ場所'))throw Error('missing crowding reason');
    tryMainStoryWait(r);if(STORY_WAIT_BLOCKS.has(r))throw Error('stale path reason after successful route');
    r.hidden=true;if(!storyWaitReason(r,obj).includes('もどる'))throw Error('hidden reason');r.hidden=false;
    S.enemies=[{spawned:true,dead:false,flee:false,x:r.x,y:r.y}];if(!storyWaitReason(r,obj).includes('安全'))throw Error('danger reason');S.enemies=[];
    return 'food, rest, cooking, blocked path, crowding, return, danger and cleared-route warnings';
  })()`));
  console.log('field waiting',await run(`(()=>{
    for(const r of S.res){endAct(r);delete r.storyWaitHome;RHOLD.delete(r);r.hunger=hMax(r);r.energy=100;r.carry=null;r.cmat=null;r.meal=null;}
    S.quest=questIndexOf('earthListen');S.fieldStories={...(S.fieldStories||{})};delete S.fieldStories.earthListen;/* 1つの依頼に調べは1つ（fieldMerge1） */S.qStory=null;S.qTalked=false;fieldStoryEnsure('earthListen');
    for(let i=0;i<1600&&!earthIntroSpeaker(QUESTS[S.quest]);i++){for(const r of S.res)updRes(r,.5);checkQuest();}
    if(!earthIntroSpeaker(QUESTS[S.quest]))throw Error('field group not gathered');const group=fieldCast(FIELD_STORIES.earthListen[0]),hunger=group.map(r=>r.hunger),fun=group.map(r=>r.fun);
    for(let i=0;i<600;i++)for(const r of group)updRes(r,.5);if(group.some((r,i)=>r.hunger!==hunger[i]))throw Error('field waiting hunger');if(group.some((r,i)=>r.fun<fun[i]))throw Error('field waiting fun');
    S.qStory=S.quest;S.quest++;S.qTalked=false;checkQuest();for(let i=0;i<1600&&!group.every(r=>r.act?.type==='storywait'&&r.act.stage==='do');i++)for(const r of S.res)updRes(r,.5);
    if(!group.every(r=>r.act?.type==='storywait'&&r.act.stage==='do'))throw Error('report group not waiting '+JSON.stringify(group.map(r=>r.act)));
    const absent=group[1];S.res=S.res.filter(p=>p!==absent);S.buried=[{name:absent.name,elem:absent.elem}];/* いない子＝お墓にいる子 */if(mainStoryBubbleReady(group[0])||!(mainTalkWaitText(QUESTS[S.qStory])||storyWaitStatusText()||'').includes(absent.name+'がもどる')/* いない子の案内は、目標の欄と同じ文（mainTalkWaitText） */)throw Error('missing cast allowed report');S.res.push(absent);S.buried=[];
    const h=group.map(r=>r.hunger),f=group.map(r=>r.fun);for(let i=0;i<200;i++)for(const r of group)updRes(r,.5);if(group.some((r,i)=>r.hunger!==h[i]))throw Error('report hunger');if(group.some((r,i)=>r.fun<f[i]))throw Error('report fun');
    S=JSON.parse(JSON.stringify(S));for(const r of S.res.filter(r=>r.act?.type==='storywait'))if(!storyWaitProtected(r))throw Error('save reload lost waiting');
    const r=S.res.find(r=>r.act?.type==='storywait');S.enemies=[{spawned:true,dead:false,flee:false,x:r.x+1,y:r.y}];if(storyWaitProtected(r)||!ACT.storywait.done(r,r.act))throw Error('unsafe wait');S.enemies=[];
    S.t=1440;const before=r.hunger;updRes(r,.5);if(['storywait','fieldintro'].includes(r.act?.type)||r.hunger>=before)throw Error('night must release and restore hunger');
    S.t=1800;for(const p of S.res){endAct(p);p.energy=100;p.hunger=hMax(p);}for(let i=0;i<1600&&!(r.act?.type==='storywait'&&r.act.stage==='do');i++)for(const p of S.res)updRes(p,.5);
    if(r.act?.type!=='storywait'||r.act.stage!=='do')throw Error('morning did not return');S.qStory=null;S.qTalked=true;updRes(r,.5);if(r.act?.type==='storywait')throw Error('finished report still waiting');
    return 'field intro/report cast, save reload, threats, night release, morning return, completion release';
  })()`));
  console.log('three by three tree',await run(`(()=>{
    for(const r of S.res){endAct(r);delete r.storyWaitHome;r.x=CX+12+r.id%4;r.y=CY+12;}
    const j=(CY-3)*W+CX-8;S.sacredRoot=j;S.fieldSites={root:j};for(const k of sacredCells(j)){S.obj[k]='';delete S.ref[k];S.floor[k]='';S.hi[k]=0;S.ground[k]=0;}
    if(BL.tower.sz.join()!=='4,4'||sacredCells(j).length!==16)throw Error('wrong size');if(!growStoryTree()||S.obj[j]!=='tower'||sacredCells(j).slice(1).some(k=>S.obj[k]!=='part'||S.ref[k]!==j))throw Error('wrong parts');
    const base=SACREDBASE.map(d=>fieldStump(j)+d);for(const k of sacredCells(j)){const refused=!canPlace('floor',k%W,k/W|0,true);if(base.includes(k)!==refused)throw Error('tree footprint not protected');}/* 道・床は根もとの2マスだけ置けない。ほかのマスには置ける */
    const make=()=>({world:0,flags:{sacredStoryV1:1},obj:Array(W*H).fill(''),ground:Array(W*H).fill(0),floor:Array(W*H).fill(''),hi:Array(W*H).fill(0),ref:{},dyn:{},hp:{},res:[],fieldSites:{root:j},sacredRoot:j});
    const old=make();old.obj[j]='tower';old.hp[j]=43;old.hp['L'+j]=2;for(const k of sacredCells(j,2).slice(1)){old.obj[k]='part';old.ref[k]=j;}
    migrateSacredFootprint3(old);if(old.sacredRoot!==j||sacredCells(j).some(k=>k!==j&&old.ref[k]!==j)||old.hp[j]!==43||old.hp['L'+j]!==2)throw Error('old tree expansion');const snap=JSON.stringify(old);migrateSacredFootprint3(old);if(JSON.stringify(old)!==snap)throw Error('migration not idempotent');
    const blocked=make();blocked.obj[j]='tower';blocked.hp[j]=51;for(const k of sacredCells(j,2).slice(1)){blocked.obj[k]='part';blocked.ref[k]=j;}blocked.obj[j+2]='table';migrateSacredFootprint3(blocked);if(blocked.obj[j+2]!=='table'||blocked.obj[blocked.sacredRoot]!=='tower'||blocked.hp[blocked.sacredRoot]!==51)throw Error('blocked migration damaged furniture');
    const full=make();full.obj.fill('rock');full.obj[j]='tower';for(const k of sacredCells(j,2).slice(1)){full.obj[k]='part';full.ref[k]=j;}migrateSacredFootprint3(full);if(!full.sacredLegacy2||full.obj.filter(o=>o==='rock').length!==W*H-4)throw Error('full village destroyed objects');
    for(const k of sacredCells(j,4))if(full.obj[k]==='rock')full.obj[k]='';tryExpandSacredLegacy(full);if(full.sacredLegacy2||sacredCells(j,4).slice(1).some(k=>full.ref[k]!==j))throw Error('clear space did not expand legacy tree');
    setWorld(1);if(BL.tower.sz.join()!=='2,2')throw Error('volcano footprint changed');setWorld(0);return '16 protected cells, 2x2 old tree grows safely, HP/level kept, furniture safe, dense village safe, volcano unchanged';
  })()`));
  const motions=['','walk','climb','punch','pray','pluck','hold','eat','chop','mine','till','build','repair','craft','draw','water','cook','talk','talkjoy','talkshock','talkthink','talksad','wave','clap','weed','plant','store','storySoil','storyTouch','storyStone','storyBump','storyHug'];
  console.log('back-facing arms',await run(`(()=>{
    const motions=${JSON.stringify(motions)},els=['wood','earth','fire','water','wind'];let count=0;
    const canvas=document.createElement('canvas');canvas.width=180;canvas.height=180;const c=canvas.getContext('2d'),original=c.drawImage.bind(c);
    for(const el of els)for(const anim of motions)for(const t of [0,.35,.8]){
      const hood=spDot('sp_'+el+':hood',el),hand=spDot('sp:hand',el),arms=[spDot('sp:arm',el),spDot('sp:armS',el)];const calls=[];c.clearRect(0,0,180,180);c.drawImage=(im,...args)=>{calls.push(im);return original(im,...args);};
      drawSpirit(c,el,90,170,1,1,{dot:1,t,anim,back:true,turn:0,walk:anim==='walk',sceneP:t,sceneT:t});
      const head=calls.lastIndexOf(hood),lastArm=Math.max(calls.lastIndexOf(hand),...arms.map(im=>calls.lastIndexOf(im)));if(head<0||lastArm>=head)throw Error(el+' '+anim+' paints arms over head');count++;
    }
    return count+' rendered poses keep arms below the back of the head';
  })()`));
  if(process.env.SCREENSHOT_DIR){
    await run(`(()=>{for(const r of S.res){endAct(r);delete r.storyWaitHome;RHOLD.delete(r);r.hunger=hMax(r);r.energy=100;r.carry=null;r.cmat=null;r.meal=null;r.cing=null;}const j=S.sacredRoot;S.res.forEach((r,i)=>{r.x=j%W-1.5+i*1.5;r.y=(j/W|0)+3.5;});S.qStory=questIndexOf('windVoices');S.quest=S.qStory+1;S.qTalked=false;S.setSh=2;GRASSN=3000;checkQuest();for(let i=0;i<1200&&!S.res.every(r=>r.act?.type==='storywait'&&r.act.stage==='do');i++)for(const r of S.res)updRes(r,.5);cam.z=2;centerOn(storyTreeX(j)*TS,(storyTreeY(j)+.5)*TS);})()`);
    await page.waitForFunction(()=>sacredEval('stageReady()'),null,{timeout:60000});await run('GRASSN=3000');await page.waitForTimeout(200);await page.screenshot({path:process.env.SCREENSHOT_DIR+'/story-wait-tree.png'});
    await page.evaluate(motions=>sacredEval(`(()=>{const cv=document.createElement('canvas');cv.width=960;cv.height=760;cv.style.cssText='position:fixed;inset:0;z-index:999;background:#f6f0df';document.body.append(cv);const c=cv.getContext('2d');const motions=${JSON.stringify(motions)};motions.forEach((anim,i)=>{const x=(i%8)*120,y=(i/8|0)*190;c.fillStyle='#77684d';c.font='12px sans-serif';c.fillText(anim||'idle',x+8,y+18);drawSpirit(c,'wood',x+60,y+172,1.1,1,{dot:1,t:.35,anim,back:true,walk:anim==='walk',sceneP:.35,sceneT:.35});});})()`),motions);
    await page.screenshot({path:process.env.SCREENSHOT_DIR+'/back-arm-motions.png'});
  }
  assert.deepEqual(errors,[]);console.log('Browser errors: none');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
