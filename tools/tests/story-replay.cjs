const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
 const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=false;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5)];for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};checkQuest=()=>{};checkLevel=()=>{};openSheet('menu','record');if(availableStoryReplays().length||openStoryReplay('quest:earthListen'))throw Error('locked replay');S.cleared=true;S.sev=Object.fromEntries(SEV1.map(e=>[e.k,1]));S.flags.sacredQuietSeen=true;closeSheet();openSheet('menu','record');KV.setItem(SAVE_KEYS[0],'parent save sentinel');})()`);
 let before;const keys=await run('availableStoryReplays().map(e=>e.key)');assert.equal(keys.length,11);
 for(const key of (process.env.REPLAY_KEYS?process.env.REPLAY_KEYS.split(','):keys)){
   before=await run(`(()=>{KV.setItem(SAVE_KEYS[0],'parent save sentinel');const before=JSON.stringify(S);if(!openStoryReplay(${JSON.stringify(key)}))throw Error('open failed');if(JSON.stringify(S)!==before)throw Error('opening changed village');return before;})()`);
   const frame=await page.waitForSelector('iframe');const child=await frame.contentFrame();
   await child.waitForSelector('.replay-start',{timeout:60000});
   assert(await child.evaluate(()=>sacredEval(`IS_STORY_REPLAY&&NOSAVE&&save()===false`)));
   await child.evaluate(()=>sacredEval(`KV.setItem(SAVE_KEYS[0],'child cannot overwrite');KV.removeItem(SAVE_KEYS[0]);`));
   await child.locator('.replay-start button').click();
   if(key==='event:e15')assert(await child.evaluate(()=>sacredEval("S.ns?.final&&S.enemies.some(e=>e.type==='boss2'&&e.spawned&&!e.dead)&&!!sacredDirection()?.shot")),'missing battle context');
   // Skip reading time only. Authored movement and holds still finish before advancing.
   await child.evaluate(()=>sacredEval(`window.replayTestReader=setInterval(()=>{if(!document.querySelector('#dialog').hidden){DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(performance.now()>=DLGA.holdUntil&&!sacredMotionPending()&&b&&!b.disabled)b.click();}},40);`));
   try{await child.waitForSelector('.replay-end',{timeout:120000});}catch(e){console.log(key,await child.evaluate(()=>sacredEval(`JSON.stringify({run:STORY_REPLAY_RUN,quest:S.quest,qStory:S.qStory,talked:S.qTalked,step:S.fieldStories,TALKW,dlg:DLGA.full,acts:S.res.map(r=>({name:r.name,x:r.x,y:r.y,act:r.act})),sev:S.sev,enc:SEV_ENCOUNTERS.get(S)})`)));throw e;}
   {const after=await run('JSON.stringify(S)');if(after!==before){const a=JSON.parse(after),b=JSON.parse(before);throw Error('Parent changed '+JSON.stringify(Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>[k,a[k],b[k]])));}}
   assert.equal(await page.evaluate(()=>localStorage.getItem('hakoniwa-w1-v8')),'parent save sentinel');
   if(process.env.SCREENSHOT_DIR)await page.screenshot({path:process.env.SCREENSHOT_DIR+'/replay-'+key.replace(':','-')+'.png'});
   await page.getByRole('button',{name:'思い出帳へ戻る',exact:true}).click();
   assert.equal(await run('JSON.stringify(S)'),before,'parent changed after '+key);console.log('Replay passed:',key);
 }
 // Closing in mid-scene destroys pending callbacks and returns to the untouched village.
 before=await run("(()=>{SND.bgm=false;SND.sfx=false;openStoryReplay('quest:waterFilm');return JSON.stringify(S);})()");
 let child=await (await page.waitForSelector('iframe')).contentFrame();await child.waitForSelector('.replay-start');
 assert(await child.evaluate(()=>sacredEval('!SND.bgm&&!SND.sfx')),'sound settings not inherited');
 await child.locator('.replay-start button').click();await child.waitForSelector('#dialog:not([hidden])');
 await child.evaluate(()=>sacredEval("sacredBeat('water')"));await page.getByRole('button',{name:'思い出帳へ戻る',exact:true}).click();
 await page.waitForTimeout(3000);assert.equal(await run('JSON.stringify(S)'),before,'cancelled scene changed parent');
 assert.deepEqual(errors,[]);await browser.close();console.log('Selected replays: native movement/holds, completion, parent village and storage isolation, sound settings and mid-scene cancellation passed; no browser errors.');
})().catch(e=>{console.error(e);process.exit(1)});
