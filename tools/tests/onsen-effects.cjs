const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 火山の温泉ごとの効き目・いちばん要る温泉へ行く・夜の熱の道の光 */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:430,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.onEval=s=>eval(s);'})});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.onEval);const run=s=>page.evaluate(s=>onEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};true`);
 await run(`(()=>{resetVillageTransient();setWorld(1);S=newState(1);LIVE[1]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;S.flags.onsen=true;const t=st2();t.sp.b=1;t.sp.c=1;t.d1=0;t.d2=0;for(const j of CRACKS)if(S.obj[j]==='crack')S.obj[j]='';recount();return 1})()`);
 assert.deepEqual(await run(`['a','b','c'].map(springOn)`),[true,true,true]);
 /* 効き目 */
 const eff=await run(`(()=>{const out={};for(const k of ['a','b','c']){const w=[...Array(W*H).keys()].find(j=>S.ground[j]===1&&sprMap()[j]===k);const stand=[w-1,w+1,w-W,w+W].find(q=>S.ground[q]!==1&&walk(q));const r=mkRes(S,'t'+k,'water',stand%W+.5,(stand/W|0)+.5);S.res.push(r);r.energy=20;r.fun=20;const a={type:'bathe',stand,t:0};ACT.bathe.start(r,a);const e0=r.energy,f0=r.fun;a.t=10;ACT.bathe.tick(r,a,1);out[k]={sk:a.sk,de:+(r.energy-e0).toFixed(3),df:+(r.fun-f0).toFixed(3)};a.t=30;ACT.bathe.end(r,a);out[k].c=r.sprC===dayNo()}return out})()`);
 console.log(JSON.stringify(eff));
 assert.equal(eff.a.sk,'a');assert.equal(eff.a.de,0.3);assert.equal(eff.b.df,0.7);assert.equal(eff.a.df,0.45);assert.equal(eff.c.c,true);assert.equal(eff.a.c,false);
 const hun=await run(`(()=>{const r=S.res.find(q=>q.name==='tc');const r2=S.res.find(q=>q.name==='tb');r.act=null;r2.act=null;r.hunger=r2.hunger=80;r.energy=r2.energy=80;updRes(r,1);updRes(r2,1);return [80-r.hunger,80-r2.hunger]})()`);
 console.log('おなか',hun);assert.ok(Math.abs(hun[0]/hun[1]-0.8)<0.01,'奥の温泉のあとは0.8倍');
 /* いちばん要る温泉へ */
 const pick=await run(`(()=>{const res={};for(const [k,set] of [['a',r=>{r.energy=5;r.fun=90;r.hunger=hMax(r)}],['b',r=>{r.energy=90;r.fun=5;r.hunger=hMax(r)}],['c',r=>{r.energy=90;r.fun=90;r.hunger=5}]]){const r=mkRes(S,'p'+k,'water',CX+.5,CY+.5);S.res.push(r);set(r);const G=bfs(r.x|0,r.y|0);goBathe(r,G);const a=r.act;res[k]=a&&adjOf(a.stand,q=>hotW(q)&&sprMap()[q]===k)>=0;r.act=null;S.res.pop()}return res})()`);
 assert.deepEqual(pick,{a:true,b:true,c:true},'いちばん要る温泉');
 /* 夜の熱の道 */
 await run(`(()=>{S.res.forEach(r=>r.hidden=true);S.t=Math.floor(S.t/1440)*1440+23*60;GRD.pre=S;cam.z=1.2;centerOn((CX+.5)*TS,(OFF+9)*TS);dirty=true;USERPAUSE=false;return heatPts().length})()`).then(n=>assert.ok(n>10,'熱の道の点 '+n));
 await page.waitForTimeout(1200);if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/heat-night.png'});
 const tx=await run(`SPR_TXT.b`);assert.equal(tx,'入っているあいだ、たのしさ+63／1時間');
 assert.deepEqual(errors,[]);console.log('onsen-effects: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
