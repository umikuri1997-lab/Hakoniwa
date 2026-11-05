const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 火山の物語の演出：どの場面も、大事な動きが終わるまで、つぎの行へ送れない。夜・人物不在・道がない・村の切りかえで、きれいにやめる */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:900,height:700},deviceScaleFactor:2}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{setWorld(1);S=newState(1);LIVE[1]=S;started=true;USERPAUSE=true;window.__noIdle=true;S.introSeen=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=30;S.feat={summon:true,build:true,plant:true,craft:true,people:true};
    const put=(id,x,y)=>{for(let r=0;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const j=((y|0)+dy)*W+(x|0)+dx;if(walk(j)&&!S.obj[j]&&S.ground[j]!==1&&!S.floor[j]&&walk(j+W)&&walk(j-1)&&walk(j+1)){S.obj[j]=id;if(BL[id]?.hp)S.hp[j]=BL[id].hp;return j}}return -1};
    window.VT={put};put('yogan',D1%W+3,(D1/W|0)+3);put('bench',HSPC.a[0]+2,HSPC.a[1]+2);put('bench',HSPC.b[0]+2,HSPC.b[1]+2);put('bench',HSPC.b[0]-2,HSPC.b[1]+2);put('oven',HSPC.a[0]-3,HSPC.a[1]+3);put('table',HSPC.a[0]-1,HSPC.a[1]+3);put('hotstone',HSPC.a[0]+1,HSPC.a[1]);
    S.res=[mkRes(S,HOMURA,'fire',CX+.5,CY+.5),mkRes(S,SHIZUKU,'water',CX+1.5,CY+.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}S.spotSeen=Object.fromEntries(SPOTS.map(x=>[x.k,1]));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);cam.z=2;centerOn(CX*TS,CY*TS);})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
  const place=(x,y)=>run(`(()=>{const[h,s]=S.res;for(const r of S.res){endAct(r);r.path=[];r.hidden=false;}const ok=j=>walk(j)&&!S.obj[j]&&S.ground[j]!==1&&walk(j+1)&&!S.obj[j+1]&&S.ground[j+1]!==1&&!S.obj[j-W]&&!S.obj[j-W+1];let b=-1,bd=1e9;for(let yy=${y|0}-6;yy<=${y|0}+6;yy++)for(let xx=${x|0}-6;xx<=${x|0}+6;xx++){const j=yy*W+xx,dd=Math.hypot(xx-${x},yy-${y});if(dd<bd&&ok(j)){bd=dd;b=j}}const X=b%W+.5,Y=(b/W|0)+.5;h.x=X;h.y=Y;s.x=X+1;s.y=Y;h.face=1;s.face=-1;})()`);
  const begin=cue=>run(`(()=>{document.querySelector('#dialog').hidden=true;DLGGAP=0;DLGQ.length=0;DLGTAP=performance.now();dialog([[HOMURA,'……。','vol:${cue}'],[SHIZUKU,'……。']],()=>{});})()`);
  const click=()=>run(`(()=>{DLGA.n=DLGA.full.length;DLGA.readReady=0;document.querySelector('#dlgBtns button')?.click();return document.querySelector('#dlgWho').textContent})()`);
  const shot=async name=>{if(process.env.SCREENSHOT_DIR)await page.screenshot({path:process.env.SCREENSHOT_DIR+'/stg-'+name+'.png'});};
  const sp=await run('[HSPC.a,HSPC.b,[D1%W+.5,(D1/W|0)+.5],[D2%W+.5,(D2/W|0)+.5],[CRACKS[2]%W+.5,(CRACKS[2]/W|0)+.5],[VOLJ%W+.5,OFF+7]]');
  const at={springWalk:sp[0],hidane:sp[0],egg:sp[0],eatS:sp[0],benchSit:sp[0],canal:sp[1],ashiyu:sp[1],ripple:sp[1],traceRock:sp[1],yoganSide:sp[2],fist:sp[2],yoganPulse:sp[2],sitBeside:sp[2],crackSeal:sp[4],pointDevice:sp[3],shadowSpot:sp[5],kneelAsh:sp[5],skyH:sp[5]};
  const beats=['introStart','lookbackH','wave','shoulders','springWalk','hidane','summonRing','meet','fanS','jumpBoth','traceRock','canal','benchSit','armsCross','egg','eatS','crackSeal','lookbackS','yoganSide','fist','stepBackS','yoganPulse','sitBeside','bump','lanterns','eggsUp','cheer','ashiyu','ripple','scaredS','pointDevice','ashFall','stepMountain','grab','backToBack','morning','shadowSpot','kneelAsh','skyH','innFront','soakBoth'];
  const report=[];
  for(const b of process.env.ONLY_GUEST?[]:beats){
    const p=at[b]||[sp[0][0]-4,sp[0][1]+3];await place(p[0]+.5|0,(p[1]+3|0)+.5);await begin(b);
    const pending0=await run('sacredMotionPending()');
    const who=await click();assert.equal(who,'ホムラ',b+': must not skip the motion');
    const t0=Date.now();while(await run('sacredMotionPending()')){assert(Date.now()-t0<25000,b+' motion never completes');await page.waitForTimeout(100);}
    await page.waitForTimeout(Math.max(0,await run(`sacredLineHold('vol:${b}')-(performance.now()-DLGA.lineT)`))+80);
    report.push(b+':'+(pending0?'held':'none')+':'+(Date.now()-t0));
    await shot(b);
    assert.equal(await click(),'シズク',b+': must continue after motion');await click();
    assert.equal(await run('!!sacredDirection()'),false,b+': scene must clean up when the dialog closes');
  }
  /* 熱の装置の場面（springB・springC） */
  for(const k of process.env.ONLY_GUEST?[]:['b','c']){await place(sp[k==='b'?2:3][0]+.5|0,(sp[k==='b'?2:3][1]+4|0)+.5);await run(`(()=>{document.querySelector('#dialog').hidden=true;DLGGAP=0;DLGQ.length=0;dialog([[SHIZUKU,'……。',0,'heat:${k}'],[HOMURA,'……。']],()=>{});})()`);
    assert.equal(await click(),'シズク','heat '+k+' must hold');const t0=Date.now();while(await run('sacredMotionPending()')){assert(Date.now()-t0<25000,'heat '+k+' never completes');if(Date.now()-t0>1800&&Date.now()-t0<2000)await shot('heat-'+k);await page.waitForTimeout(100);}
    while(await run("!!document.querySelector('#dlgBtns button')?.disabled")){assert(Date.now()-t0<25000,'heat '+k+' button never enabled');await page.waitForTimeout(50);}/* うごきがおわったあと、つぎへのボタンは次のコマで押せるようになる */await shot('heat-'+k+'-end');assert.equal(await click(),'ホムラ');await click();}
  /* 夜：動きを省く */
  await place(sp[0][0]|0,(sp[0][1]+3|0)+.5);await run('S.t=23.5*60');await begin('springWalk');assert.equal(await run('!!sacredDirection()&&sacredMotionPending()'),false,'night aborts staging');await click();await click();await run('S.t=720');
  /* いない子：その子の動きだけ省く */
  await run('S.res[1].hidden=true');await begin('bump');assert.equal(await run('sacredMotionPending()'),false,'missing actor must not hold');await click();await click();await run('S.res[1].hidden=false');
  /* 道がない：かこまれていても、その場で続ける */
  await place(sp[0][0]-6+.5|0,(sp[0][1]+3|0)+.5);await run(`(()=>{const h=S.res[0],x=h.x|0,y=h.y|0;window.VT.box=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=(y+dy)*W+x+dx;if(dx||dy){if(!S.obj[j]){S.obj[j]='fence';window.VT.box.push(j)}}}recount();})()`);
  await begin('springWalk');const tb=Date.now();while(await run('sacredMotionPending()')){assert(Date.now()-tb<12000,'blocked walk must not stall');await page.waitForTimeout(100);}await click();await click();
  await run('for(const j of window.VT.box)S.obj[j]="";recount()');
  /* 村の切りかえ */
  await place(sp[0][0]-3|0,(sp[0][1]+3|0)+.5);await begin('meet');await run('resetVillageTransient()');assert.equal(await run('sacredDirection()'),null);await page.waitForTimeout(500);assert.equal(await run('sacredDirection()'),null,'no stale callback');
  /* お客さん：歩いて露天ぶろへ、着いてから会話 */
  await run(`(()=>{S.res.forEach((r,i)=>{endAct(r);r.x=HSPC.a[0]-3+i;r.y=HSPC.a[1]+3});S.flags.onsen=1;})()`);await run('guestScene()');
  await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden&&document.querySelector('#dlgWho').textContent===POKO`),{},{timeout:20000});
  const gx0=await run('GUEST&&[GUEST.x,GUEST.y]');
  for(let i=0;i<60&&!await run(`document.querySelector('#dialog').hidden`);i++){await click();await page.waitForTimeout(300);}
  await page.waitForFunction(()=>sacredEval(`!document.querySelector('#dialog').hidden&&GUEST&&sacredPose(GUEST)?.anim==='soak'`),{},{timeout:30000}).catch(async e=>{console.log(await run(`JSON.stringify({dlg:!document.querySelector('#dialog').hidden,who:document.querySelector('#dlgWho').textContent,g:GUEST&&[GUEST.x,GUEST.y,GUEST.act?.type,GUEST.act?.stage,sacredPose(GUEST)?.anim],q:DLGQ.length,gap:DLGGAP-performance.now()})`));throw e});await shot('guest-soak');
  const gx1=await run('[GUEST.x,GUEST.y]');assert(Math.hypot(gx1[0]-gx0[0],gx1[1]-gx0[1])>0.9,'guest must walk');
  for(let i=0;i<60&&!await run(`document.querySelector('#dialog').hidden`);i++){await click();await page.waitForTimeout(300);}
  await page.waitForFunction(()=>sacredEval('!!S.flags.guestDone&&!GUEST'),{},{timeout:10000});
  assert.deepEqual(errors,[]);console.log(report.join(' '));console.log('Volcano staging: all beats hold until motion ends, heat devices, night/missing/blocked/reset aborts, guest walk-soak passed. Browser errors: none');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
