const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 火山の鉱脈：お話が進むと目をさます・ほる数・毎朝ふえる・タップでほる・古いセーブ・演出 */
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:430,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.oreEval=s=>eval(s);'})});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.oreEval);const run=s=>page.evaluate(s=>oreEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showSpotPop=()=>{};true`);
 const fresh=()=>run(`(()=>{resetVillageTransient();if(sheet)closeSheet();setWorld(1);S=newState(1);LIVE[1]=S;started=true;USERPAUSE=true;NOSAVE=false;window.__noIdle=true;S.introSeen=true;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();return true})()`);
 const veins=`(()=>{const c={};for(const v of VEIN_IDS)c[v]=S.obj.filter(x=>x===v).length;return c})()`;
 const done=id=>`S.cleared=false;S.quest=questIndexOf('${id}')+1;S.qStory=null;S.qTalked=false;`;
 await fresh();
 /* 1. はじめは鉱脈なし */
 let v=await run(veins);assert.deepEqual(Object.values(v),[0,0,0,0,0],'はじめから鉱脈がある');
 assert.equal(await run(`[oreStage(),oreStageNow()].join()`),'0,0');
 assert.ok(await run(`S.obj.filter(x=>x==='rock').length`)>500);
 /* ひびわれの前は、硫黄が出ない */
 const sul0=await run(`(()=>{const r=S.res[0];r.cmat=null;const rj=S.obj.findIndex((x,j)=>x==='rock'&&oreNear(j));const rnd=Math.random;Math.random=()=>.05;ACT.mine.end(r,{obj:rj,tgt:'rock'});Math.random=rnd;return (r.cmat||{}).sulfur||0})()`);assert.equal(sul0,0);
 /* 2. 温泉Aのお話のあと：銅だけ */
 assert.equal(await run(`${done('springA')}oreStageNow()`),1);
 await run(`oreAwaken(1).length`);v=await run(veins);assert.ok(v.vcopper>50,'銅');assert.equal(v.viron+v.vobsid+v.vsilver+v.vgold,0);
 const m1=await run(`(()=>{const r=S.res[0];r.cmat=null;const j=S.obj.indexOf('vcopper');ACT.mine.end(r,{obj:j,tgt:'vcopper'});return r.cmat})()`);assert.deepEqual(m1,{copper:1});
 /* 3. 段階ごと */
 for(const [k,id,key] of [[2,'rockCanal','viron'],[3,'haikage3',null],[4,'fire3','vobsid'],[5,'rockDeep','vsilver'],[6,'hinoookage','vgold']]){assert.equal(await run(`${done(id)}oreStageNow()`),k,id);await run(`oreAwaken(${k}).length`);if(key){v=await run(veins);assert.ok(v[key]>0,key)}}
 const sul1=await run(`(()=>{const r=S.res[0];r.cmat=null;const rj=S.obj.findIndex((x,j)=>x==='rock'&&oreNear(j));const rnd=Math.random;Math.random=()=>.05;ACT.mine.end(r,{obj:rj,tgt:'rock'});Math.random=rnd;return (r.cmat||{}).sulfur||0})()`);assert.equal(sul1,1,'ひびわれのあとは硫黄');
 const m2=await run(`(()=>{const r=S.res[0];r.cmat=null;r.lv=1;const j=S.obj.indexOf('vgold');ACT.mine.end(r,{obj:j,tgt:'vgold'});return r.cmat})()`);assert.deepEqual(m2,{gold:2},'黒曜石の段階から2こ（持てる数1でも）');
 const m3=await run(`(()=>{const e=mkRes(S,'テスト土','earth',CX+.5,CY+.5);S.res.push(e);gearGive('gt17',1);gearEquip(e,gearList().findIndex(q=>q.id==='gt17'));e.cmat=null;const j=S.obj.indexOf('viron');ACT.mine.end(e,{obj:j,tgt:'viron'});return [e.cmat,gJob(e,'mine')]})()`);assert.deepEqual(m3,[{iron:3},1.6],'銀のつるはし');
 /* 4. 毎朝ふえる */
 const g=await run(`(()=>{const c=()=>S.obj.filter((x,j)=>VEINS[x]&&S.dyn[j]&&S.dyn[j].vg).length;S.st2.ore=1;veinMorning();const a=c();const k1=S.obj.filter((x,j)=>VEINS[x]&&S.dyn[j]&&S.dyn[j].vg).every(x=>x==='vcopper');S.st2.ore=6;veinMorning();const b=c();for(let i=0;i<20;i++)veinMorning();const d=c();const inV=S.obj.some((x,j)=>VEINS[x]&&S.dyn[j]&&S.dyn[j].vg&&VILL[j]);return [a,k1,b,d,inV]})()`);
 assert.deepEqual(g,[1,true,5,40,false],'毎朝ふえる数');
 /* 毎朝ふえた鉱脈は、ほりつくしても生えなおさない。もとからの鉱脈は生えなおす */
 const rg=await run(`(()=>{S.regrow=[];const j=S.obj.findIndex((x,j)=>VEINS[x]&&S.dyn[j]&&S.dyn[j].vg);S.hp['n'+j]=9;useNat(j);const a=S.regrow.length;const q=S.obj.findIndex((x,j)=>x==='vcopper'&&!VILL[j]&&!(S.dyn[j]&&S.dyn[j].vg));S.hp['n'+q]=9;useNat(q);return [a,S.regrow.length,S.regrow[0]&&S.regrow[0].id]})()`);assert.deepEqual(rg,[0,1,'vcopper']);
 /* 5. タップでほる */
 const tp=await run(`(()=>{S.t=720;S.mat={};const r=mkRes(S,'テスト火','fire',CX+.5,CY+.5);S.res.push(r);const G=bfs(r.x|0,r.y|0);let far=-1,fd=0;for(let j=0;j<W*H;j++)if(S.obj[j]==='vsilver'){const d=Math.hypot(j%W-CX,(j/W|0)-CY);if(d>fd&&[j-1,j+1,j-W,j+W].some(k=>G.dist[k]>=0)){fd=d;far=j}}S.vreq={[far]:1};const hw=hasHighWork(r);const ok=tryJob(r,G,'mine');return [far>=0,hw,ok&&r.act&&r.act.obj===far]})()`);assert.deepEqual(tp,[true,true,true],'タップした鉱脈をほりにいく');
 /* 6. 古いセーブ */
 await fresh();
 const old=await run(`(()=>{placeVeins(S);const all=S.obj.filter(x=>VEINS[x]).length;S.regrow=[{j:S.obj.indexOf('vgold'),id:'vgold',day:9}];${done('rockCanal')}oreMigrate(S);const a=JSON.stringify(${veins});oreMigrate(S);return [all,S.st2.ore,a,JSON.stringify(${veins}),S.regrow[0].id]})()`);
 const ov=JSON.parse(old[2]);assert.ok(old[0]>150);assert.equal(old[1],2);assert.ok(ov.vcopper>0&&ov.viron>0);assert.equal(ov.vobsid+ov.vsilver+ov.vgold,0);assert.equal(old[2],old[3],'2回読んでもかわらない');assert.equal(old[4],'rock');
 /* 7. 演出：知らせが出て、時間が止まり、おわるともどる */
 await fresh();
 await run(`(()=>{GRD.pre=S;${done('springA')}S.res.forEach(r=>r.hidden=false);USERPAUSE=false;oreWakeTick();return true})()`);
 assert.equal(await run(`GIFT_ACTIVE&&OREWAKEON`),true);
 await page.waitForSelector('.idea-reveal[aria-label="鉱脈が目をさました"] button:not([disabled])',{timeout:8000});
 const txt=await page.textContent('.idea-reveal[aria-label="鉱脈が目をさました"] p');assert.equal(txt,'銅の鉱脈が、見つかるようになった');
 if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/ore-wake.png'});
 await page.click('.idea-reveal[aria-label="鉱脈が目をさました"] button');
 await page.waitForFunction(()=>oreEval('!OREWAKEON&&!GIFT_ACTIVE'),null,{timeout:8000});
 await page.waitForFunction(()=>!document.querySelector('#dialog').hidden,null,{timeout:12000});
 const say=await page.textContent('#dlgText');console.log('ひとこと',say);
 assert.equal(await run(`oreStage()`),1);await run(`oreWakeTick();OREWAKEON`).then(x=>assert.equal(x,false,'二度出ない'));
 /* 8. 演出のとちゅうで村を切りかえても、旧い村のカメラの動きがのこらない */
 await fresh();
 const sw=await run(`(()=>{GRD.pre=S;${done('springA')}S.res.forEach(r=>r.hidden=false);USERPAUSE=false;camAnim=null;oreWakeTick();const on=[OREWAKEON,GIFT_ACTIVE,!!camAnim];resetVillageTransient();return JSON.stringify({on,after:[OREWAKEON,GIFT_ACTIVE,!!camAnim]})})()`);
 assert.deepEqual(JSON.parse(sw),{on:[true,true,true],after:[false,false,false]},'村を切りかえたら、演出も、そのカメラの動きも、かたづく');
 assert.deepEqual(errors,[]);console.log('ore-wake: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
