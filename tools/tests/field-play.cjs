const {chromium}=require('playwright'),assert=require('node:assert/strict');
const OUT=process.env.SCREENSHOT_DIR;
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:900,height:700},deviceScaleFactor:OUT?2:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.food=30;S.feat={summon:true,build:true,plant:true,craft:true,people:true};for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5),mkRes(S,MINA,'earth',CX+1.5,CY+.5),...['fire','water','wind'].map((el,i)=>mkRes(S,FIXK0[el],el,CX+i+2.5,CY+.5))];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50;}for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);S.quest=questIndexOf('earthListen');fieldStoryEnsure('earthListen');})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  const scr=w=>run(`(()=>{const x=${w.x},y=${w.y};if(SPLAY&&SPLAY.pop){const r=SPLAY.popCv.getBoundingClientRect();return {x:r.left+x/PLAYW*r.width,y:r.top+y/PLAYH*r.height}}return {x:(x-cam.x)*cam.z,y:(y-cam.y)*cam.z}})()`);
  const closeGift=async()=>{for(let i=0;i<20;i++){await page.waitForTimeout(150);const b=page.locator('.gift-reveal button');if(await b.count()){await shot('gift');await b.first().click();}else if(i>4)break;}};
  const start=async id=>{await closeGift();await run(`(()=>{window.PDONE=0;camAnim=null;startSacredPlay('${id}',S.sacredRoot,S.res.slice(),()=>{window.PDONE++});camAnim=null;cam.z=3;centerOn(SPLAY.cx,SPLAY.cy);})()`);await page.waitForTimeout(200);};
  const P=k=>run(`SPLAY&&JSON.parse(JSON.stringify(SPLAY.${k}))`);
  const drag=async(pts,step=1)=>{const a=await scr(pts[0]);await page.mouse.move(a.x,a.y);await page.mouse.down();for(let i=1;i<pts.length;i+=step){const b=await scr(pts[i]);await page.mouse.move(b.x,b.y,{steps:4});await page.waitForTimeout(16);}await page.mouse.up();};
  const res=[];const shot=async n=>{if(!OUT)return;await page.waitForTimeout(120);await page.screenshot({path:OUT+'/'+n+'.png'});};
  const state=()=>run(`({pop:!!document.querySelector('#playPop'),active:sacredPlayActive(),done:window.PDONE,won:JSON.stringify(S.flags.playWon||{}),fails:SPLAY&&SPLAY.fails||0,inv:{bellf:inv('bellf'),lotus:inv('lotus'),lily:inv('lily')},fun:S.res.map(r=>Math.round(r.fun))})`);
  // earth: success
  await start('earthRoot');await shot('earth0');const path=await P('path');
  await drag(path.slice(0,12));await shot('earth-half');await drag(path.slice(11));res.push(['earth win',await state()]);
  // earth: fail 3 times (jump off path)
  await start('earthRoot');for(let k=0;k<3;k++){const p=await P('path');if(!p)break;await drag([p[0],p[2],{x:p[2].x,y:p[2].y-40}]);}res.push(['earth lose',await state()]);
  // fire: success: hold until heat in zone
  await start('fireRoot');assert(await run('!!document.querySelector("#playPop")'),'fireRoot in popup');await page.waitForTimeout(300);let st=await P('stone');let a=await scr(st);await page.mouse.move(a.x,a.y);await page.mouse.down();for(let i=0;i<80;i++){const h=await run('SPLAY.heat');if(h>=.45&&!globalThis.__fs){globalThis.__fs=1;await shot('stump2-fireRoot')}if(h>=.68)break;await page.waitForTimeout(25);}await page.mouse.up();res.push(['fire win',await state()]);
  await start('fireRoot');for(let k=0;k<3;k++){st=await P('stone');if(!st)break;a=await scr(st);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.waitForTimeout(2300);await page.mouse.up();}res.push(['fire lose',await state()]);
  // fire: cover the cold spots (popup)
  await start('fireTrace');assert(await run('!!document.querySelector("#playPop")'),'fireTrace in popup');await shot('stump2-fireTrace');{const sp=await P('spots'),cold=await run('[...SPLAY.cold]');for(const i of cold){const s=await scr(sp[i]);await page.mouse.click(s.x,s.y);await page.waitForTimeout(60);}await page.waitForTimeout(700);}res.push(['cover win',await state()]);
  // water: watch the bud without touching (popup)
  await start('waterLeaf');assert(await run('!!document.querySelector("#playPop")'),'waterLeaf in popup');await shot('stump2-waterLeaf');await page.waitForTimeout(6400);res.push(['wait win',await state()]);
  // water
  await start('waterFilm');await shot('water0');await drag(await P('path'));res.push(['water win',await state()]);
  await start('waterFilm');for(let k=0;k<3;k++){const p=await P('path');if(!p)break;await drag([p[0],p[3],{x:p[3].x,y:p[3].y+40}]);}res.push(['water lose',await state()]);
  // wind rhythm
  await start('windEcho');assert(await run('!!document.querySelector("#playPop")'),'windEcho in popup');let shotDone=false;for(let i=0;i<400;i++){const b=await run('SPLAY&&SPLAY.beat&&!SPLAY.beat.hit&&performance.now()-SPLAY.beat.t<300?SPLAY.leaves[SPLAY.beat.leaf]:null');if(!(await run('sacredPlayActive()')))break;if(b){if(!shotDone){await shot('stump2-windEcho');shotDone=true}const s=await scr(b);await page.mouse.click(s.x,s.y);}await page.waitForTimeout(40);}res.push(['wind win',await state()]);
  await start('windEcho');for(let k=0;k<3;k++){const l=await P('leaves');if(!l)break;await page.waitForFunction(()=>sacredEval('!SPLAY||!SPLAY.beat||performance.now()-SPLAY.beat.t>700'));const s=await scr(l[1]);await page.mouse.click(s.x,s.y);await page.waitForTimeout(100);}res.push(['wind lose',await state()]);
  // replay of a win does not give twice
  await start('earthRoot');await drag(await P('path'));res.push(['earth win again',await state()]);
  const R=Object.fromEntries(res);
  for(const [k,id,b] of [['earth','earthRoot','bellf'],['water','waterFilm','lotus'],['wind','windEcho','lily']]){assert.equal(R[k+' win'].done,1,k+' win');assert(JSON.parse(R[k+' win'].won)[id],k+' bonus flag');assert.equal(R[k+' win'].inv[b],2,k+' bonus item');assert.equal(R[k+' lose'].done,1,k+' lose continues');assert.equal(R[k+' lose'].active,false);}
  assert.equal(R['fire win'].done,1);assert(JSON.parse(R['fire win'].won).fireRoot);assert.equal(R['fire lose'].done,1);
  for(const k of ['cover win','wait win','fire win','wind win'])assert.equal(R[k].pop,false,k+' popup closed');assert.equal(R['cover win'].done,1);assert.equal(R['wait win'].done,1);
  assert.equal(await run("typeof FIELD_PLAY.earthListen"),'undefined','earthListen has no tap game');assert.equal(await run("QUESTS1.filter(q=>q.id==='earthRoot').length"),0);assert.deepEqual(await run("QUESTS1.find(q=>q.id==='earthListen').fieldParts"),['earthListen','earthRoot']);
  assert.equal(R['earth win again'].inv.bellf,2,'bonus only once');
  console.log('Field mini-games: earth root trace, fire heat release, water path, wind rhythm; win bonus once, three misses continue the story');
  // choices
  const dlg=async(key,sel)=>{await closeGift();await run(`(()=>{DLGGAP=0;DLGTAP=performance.now();dialog(${sel})})()`);let picked=false;for(let n=0;n<40;n++){if(await run(`document.querySelector('#dialog').hidden`))break;const btns=await run(`[...document.querySelectorAll('#dlgBtns button')].map(b=>b.textContent)`);if(btns.length>1&&!picked){await shot('choice-'+key);await run(`(()=>{DLGA.n=DLGA.full.length;})()`);await page.locator('#dlgBtns button').nth(1).click();picked=true;await page.waitForTimeout(200);await shot('choice-'+key+'-after');await closeGift();continue}await run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0;const b=document.querySelector('#dlgBtns button');b.disabled=false;b.click()})()`);await page.waitForTimeout(30);}return run(`JSON.stringify(S.flags.choice)`)};
  await dlg('guide',`QUESTS[questIndexOf('water')].story`);assert.equal(await run(`S.flags.choice.guide`),await run('MINA'));assert(await run(`(S.res.find(r=>r.name===MINA).mates||{})[S.res.find(r=>r.name===keyName('water')).id]>=6`),'guide becomes friend');
  await dlg('brave',`QUESTS[questIndexOf('kagemark')].story`);assert.match(await run(`QUESTS[questIndexOf('ookage')].story[0][1]`),/こわくなかった/);
  await dlg('flower',`QUESTS[questIndexOf('wood6')].talk.lines.filter(l=>l[0]!=='@idea')`);assert.equal(await run(`inv('lily')`),7);assert.match(await run(`QUESTS[questIndexOf('wood6')].story[0][1]`),/ゆり/);
  console.log('Choices: guide friendship, later Futaba line, chosen flower seeds and line');
  assert.deepEqual(errors,[]);console.log('Browser errors: none');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
