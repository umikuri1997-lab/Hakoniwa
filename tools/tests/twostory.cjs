const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 2階建ての家：階段・2階の壁・2階の家具・2階で眠る・人数と住み心地・見かた・セーブ・古いセーブ */
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:900,height:700}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.fl2Eval=s=>eval(s);'});});
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.fl2Eval);
  const run=s=>page.evaluate(s=>fl2Eval(s),s);
  /* 家：よこ7・たて6（中は5×4）、下のまん中にドア */
  await run(`(()=>{tryQuestVisit=()=>false;tryMainStoryWait=()=>false;tryEarthIntro=()=>false;updTut=()=>{};finalCheck=()=>{};showItemGift=()=>{};showSpotPop=()=>{};setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;S.introSeen=true;S.enemyOn=false;S.t=720;S.hold=0;S.food=30;S.lv=10;S.pt=5000;S.mat.wood=500;S.feat={summon:true,build:true,plant:true,craft:true,people:true};
    for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}
    window.HX0=CX-4;window.HY0=CY-7;for(let y=HY0;y<HY0+6;y++)for(let x=HX0;x<HX0+7;x++){const j=y*W+x,edge=x===HX0||x===HX0+6||y===HY0||y===HY0+5;if(edge){S.obj[j]=(y===HY0+5&&x===HX0+3)?'door':'hwall';S.hp[j]=BL[S.obj[j]].hp}else S.floor[j]='floor'}
    S.obj[(CY+6)*W+CX+8]='statue';S.res=[mkRes(S,POKO,'wood',CX+.5,CY+2.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=90;}
    S.spotSeen=Object.fromEntries(SPOTS.map(x=>[x.k,1]));for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);cam.z=2;centerOn((HX0+3.5)*TS,(HY0+3)*TS);})()`);
  await page.waitForFunction(()=>fl2Eval('stageReady()'),{},{timeout:90000});
  const R={};
  R.stairs=await run(`(()=>{const h=HOUSES[0];if(!h)throw Error('no house');const st=(HY0+1)*W+HX0+1;
    if(canPlace('stairs2f',CX+8,CY+8,true))throw Error('stairs outside house');if(!canPlace('stairs2f',HX0+1,HY0+1,true))throw Error('stairs inside refused');
    if(!lvOK('stairs2f'))throw Error('level');place('stairs2f',HX0+1,HY0+1);if(S.obj[st]!=='site')throw Error('no site '+S.obj[st]);
    const r=S.res[0];for(let i=0;i<4000&&S.obj[st]==='site';i++){updRes(r,.5);S.t+=.5;if(S.t%1440>1260)S.t=720}
    if(S.obj[st]!=='stairs2f')throw Error('spirit did not build stairs '+JSON.stringify(r.act)+' '+JSON.stringify(S.dyn[st])+' '+r.x+','+r.y);if(HOUSES[0].st!==st)throw Error('house stair');
    if(canPlace('stairs2f',HX0+2,HY0+2,true))throw Error('second stairs allowed');return 'built by '+r.name+' level '+BL.stairs2f.lv})()`);
  R.view=await run(`(()=>{const h=HOUSES[0],w=(HY0)*W+HX0+2,inn=(HY0+2)*W+HX0+3,v=[fl2View(h)];fl2Tap(h,inn);v.push(fl2View(h));fl2Tap(h,w);v.push(fl2View(h));fl2Tap(h,w);v.push(fl2View(h));if(v.join()!=='0,1,2,0')throw Error('cycle '+v);fl2Tap(h,inn);return v.join('>')})()`);
  R.before=await run(`(()=>{const h=HOUSES[0];return {cap:houseCap(h),comfy:houseComfort(h).v}})()`);
  R.walls=await run(`(()=>{S.inv.hwall=40;let n=0;for(let y=HY0;y<HY0+6;y++)for(let x=HX0;x<HX0+7;x++){const edge=x===HX0||x===HX0+6||y===HY0||y===HY0+5;if(!edge)continue;if(!canPlace('hwall',x,y,true))throw Error('2F wall refused '+x+','+y);place('hwall',x,y);n++}
    if(fl2Target(HX0-1,HY0))throw Error('outside house is 2F');if(S.obj[HY0*W+HX0]!=='hwall'||S.fl2.obj[HY0*W+HX0]!=='hwall')throw Error('layer');
    const h=HOUSES[0];if(!h.fl2||h.fl2.inside.size!==20)throw Error('2F room '+(h.fl2&&h.fl2.inside.size));return n+' walls, room '+h.fl2.inside.size})()`);
  R.furn=await run(`(()=>{S.inv.bed=2;S.inv.lamp=1;S.inv.window=1;const b1=(HY0+3)*W+HX0+4;
    if(canPlace('bed',HX0+1,HY0+1,true))throw Error('bed on stair');place('bed',HX0+4,HY0+3);place('bed',HX0+5,HY0+3);place('lamp',HX0+5,HY0+1);place('window',HX0+3,HY0+5);
    if(S.fl2.obj[b1]!=='bed'||S.obj[b1]==='bed')throw Error('bed layer');if(S.fl2.win[HY0*W+5*W+HX0+3]!==1)throw Error('window');
    if(canPlace('stor',HX0+2,HY0+2,true))throw Error('storage on 2F');return Object.keys(S.fl2.obj).filter(k=>BL[S.fl2.obj[k]].kind==='furn').map(k=>S.fl2.obj[k]).join(',')})()`);
  R.after=await run(`(()=>{const h=HOUSES[0];return {cap:houseCap(h),comfy:houseComfort(h).v,bed:houseComfort(h).bed}})()`);
  assert.ok(R.after.cap>R.before.cap,'capacity');assert.ok(R.after.comfy>R.before.comfy,'comfort');
  R.sleep=await run(`(()=>{const r=S.res[0];endAct(r);r.x=CX+.5;r.y=CY+2.5;r.energy=40;S.t=1440*2+23.5*60;const b1=(HY0+3)*W+HX0+4,b2=b1+1;let up=false;
    for(let i=0;i<3000&&!(r.fl===1&&r.act&&r.act.type==='sleep'&&r.act.stage==='do');i++){updRes(r,.25);if(r.act&&r.act.ph==='climb')up=true}
    if(!up)throw Error('did not climb '+JSON.stringify(r.act));if(r.fl!==1||![b1,b2].includes(r.act.obj))throw Error('not in 2F bed '+JSON.stringify(r.act));if(!r.hidden)throw Error('night sleeper not hidden');
    const e0=r.energy;for(let i=0;i<40;i++)updRes(r,.5);if(r.energy<=e0)throw Error('no rest');
    S.enemies=[{spawned:true,dead:false,flee:false,x:HX0+3.5,y:HY0+2.5,type:Object.keys(EN)[0]}];if(hostileNow(r)||!onTower(r))throw Error('2F sleeper scared or targetable');S.enemies=[];
    return 'slept at '+r.act.obj+' energy '+e0.toFixed(1)+'>'+r.energy.toFixed(1)})()`);
  R.saveLoad=await run(`(()=>{const r=S.res[0],snap=JSON.stringify(S.fl2);window.FL2SNAP=snap;save();const d=load(0);if(JSON.stringify(d.fl2)!==snap)throw Error('fl2 not saved');const sr=d.res[0];if(sr.fl)throw Error('floor saved');if((sr.y|0)*W+(sr.x|0)!==HOUSES[0].st)throw Error('2F spirit not saved at stairs');
    continueGame(d);if(!HOUSES[0]||!HOUSES[0].fl2||HOUSES[0].fl2.inside.size!==20)throw Error('2F after load');return 'cap '+houseCap(HOUSES[0])+' comfy '+houseComfort(HOUSES[0]).v})()`);
  R.oldSave=await run(`(()=>{save();const d=load(0);delete d.fl2;delete d.flags.fl2v1;continueGame(d);if(!S.fl2||!S.fl2.obj||!S.flags.fl2v1)throw Error('no layer for old save');if(HOUSES[0].fl2)throw Error('old save got 2F');for(let i=0;i<20;i++){for(const r of S.res)updRes(r,.5)}render(performance.now());return 'empty layer added, house cap '+houseCap(HOUSES[0])})()`);
  R.expand=await run(`(()=>{const n=OW*OW,d={world:0,ground:Array(n).fill(0),floor:Array(n).fill(''),obj:Array(n).fill(''),dyn:{},ref:{},hp:{},res:[],fl2:{obj:{5:'bed',6:'part'},ref:{6:5},floor:{5:'floor'},dyn:{},hp:{},rot:{},win:{}}};expandMap(d);const m=OFF*W+OFF+5;if(d.fl2.obj[m]!=='bed'||d.fl2.ref[m+1]!==m||d.fl2.floor[m]!=='floor')throw Error('expandMap fl2');return 'remapped '+m})()`);
  console.log(JSON.stringify(R,null,1));
  /* 見た目：もう一度2階を作って、見かたごとに写す */
  const shots=process.env.SHOT_DIR;
  if(shots){await run(`(()=>{save();continueGame(load(0));S.fl2=JSON.parse(FL2SNAP);OPENH.clear();FL2V.clear();recount();S.t=720;S.hold=0;S.res[0].x=CX+.5;S.res[0].y=CY+2.5;endAct(S.res[0]);cam.z=2;centerOn((HX0+3.5)*TS,(HY0+3)*TS);for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;showUI(true);dirty=true})()`);
    await page.waitForFunction(()=>fl2Eval('stageReady()'),{},{timeout:90000});await page.waitForTimeout(1500);
    const h=`HOUSES[0]`,tap=async(cell)=>{await run(`fl2Tap(${h},${cell})`);await page.waitForTimeout(700)};
    await page.screenshot({path:shots+'/fl2-view0-roof.png'});
    await tap(`(HY0+2)*W+HX0+3`);await page.screenshot({path:shots+'/fl2-view1-2F.png'});
    const corners=async tag=>{for(const [nm,cx,cy] of [['tl',0,0],['tr',6,0],['bl',0,5],['br',6,5]]){const p=await run(`(()=>{cam.z=3;centerOn((HX0+${cx}+.5)*TS,(HY0+${cy}+.5)*TS);dirty=true;return [((HX0+${cx}+.5)*TS-cam.x)*cam.z,((HY0+${cy}+.5)*TS-cam.y)*cam.z]})()`);await page.waitForTimeout(500);await page.screenshot({path:shots+'/fl2-corner-'+tag+'-'+nm+'.png',clip:{x:Math.round(p[0]-80),y:Math.round(p[1]-80),width:160,height:160}})}};
    await corners('2F');
    await run(`(()=>{cam.z=2;centerOn((HX0+3.5)*TS,(HY0+3)*TS)})()`);
    await tap(`HY0*W+HX0+2`);await page.screenshot({path:shots+'/fl2-view2-1F.png'});await corners('1F');await run(`(()=>{cam.z=2;centerOn((HX0+3.5)*TS,(HY0+3)*TS)})()`);
    await tap(`HY0*W+HX0+2`);await page.screenshot({path:shots+'/fl2-view0-back.png'});
    await run(`(()=>{const h=HOUSES[0];fl2Tap(h,(HY0+2)*W+HX0+3);const r=S.res[0];endAct(r);r.energy=5;for(let i=0;i<3000&&!(r.fl===1&&r.act&&r.act.stage==='do');i++)updRes(r,.25);if(r.fl!==1)throw Error('day nap not on 2F '+JSON.stringify(r.act))})()`);await page.waitForTimeout(700);await page.screenshot({path:shots+'/fl2-sleep-2F.png'});console.log(await run('JSON.stringify([S.res[0].fl,S.res[0].x,S.res[0].y,S.res[0].act,S.res[0].hidden,USERPAUSE,fl2View(HOUSES[0])])'));}
  assert.deepEqual(errors,[]);
  await browser.close();console.log('twostory ok');
})().catch(e=>{console.error(e);process.exit(1)});
