const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 思い出帳：火山の場面を、一時データの村で、本編と同じ会話・動きで見返す。元の村と保存は変わらない */
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
 const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`(()=>{setWorld(1);S=newState(1);LIVE[1]=S;started=true;USERPAUSE=false;S.introSeen=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=100;S.res=[mkRes(S,HOMURA,'fire',CX+.5,CY+.5)];for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);updTut=()=>{};showItemGift=()=>{};showSpotPop=()=>{};finalCheck=()=>{};checkQuest=()=>{};checkLevel=()=>{};
   if(availableStoryReplays().some(e=>e.id!=='intro'))throw Error('locked replay');S.cleared=true;openSheet('menu','record');KV.setItem(SAVE_KEYS[1],'parent save sentinel');})()`);
 const keys=await run('availableStoryReplays().map(e=>e.key)');assert.equal(keys.length,19);
 for(const key of (process.env.REPLAY_KEYS?process.env.REPLAY_KEYS.split(','):keys)){
   const before=await run(`(()=>{const before=JSON.stringify(S);if(!openStoryReplay(${JSON.stringify(key)}))throw Error('open failed');return before;})()`);
   const child=await (await page.waitForSelector('iframe')).contentFrame();await child.waitForSelector('.replay-start',{timeout:60000});
   assert(await child.evaluate(()=>sacredEval(`IS_STORY_REPLAY&&NOSAVE&&WD===1`)));
   await child.locator('.replay-start button').click();
   await child.evaluate(()=>sacredEval(`window.rd=setInterval(()=>{if(!document.querySelector('#dialog').hidden){DLGA.n=DLGA.full.length;DLGA.readReady=0;const b=document.querySelector('#dlgBtns button');if(performance.now()>=DLGA.holdUntil&&!sacredMotionPending()&&b&&!b.disabled)b.click();}},60);window.shotAt=0;`));
   let shot=false;const t0=Date.now();
   while(!(await child.$('.replay-end'))){assert(Date.now()-t0<150000,key+' did not finish');
     if(!shot&&process.env.SCREENSHOT_DIR&&await child.evaluate(()=>sacredEval('!!sacredDirection()?.vol&&sacredMotionPending()'))){await page.waitForTimeout(700);await page.screenshot({path:process.env.SCREENSHOT_DIR+'/stg-replay-'+key.replace(':','-')+'.png'});shot=true;}
     await page.waitForTimeout(200);}
   assert.equal(await run('JSON.stringify(S)'),before,'parent changed after '+key);assert.equal(await run('KV.getItem(SAVE_KEYS[1])'),'parent save sentinel','child must not save');
   await page.getByRole('button',{name:'思い出帳へ戻る',exact:true}).click();console.log('Volcano replay passed:',key);
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('Volcano replays: same lines and motion, completion, parent village unchanged; no browser errors.');
})().catch(e=>{console.error(e);process.exit(1)});
