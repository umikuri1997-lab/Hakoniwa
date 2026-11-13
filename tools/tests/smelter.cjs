const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 火山の炉：おねがいでおぼえる・タップで数をえらぶ・せいれいが運ぶ・火のせいれいが精錬（鉱石2こ→延べ棒1こ）・火のついた絵・こわれたら返す・そうびは延べ棒で作る */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:430,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.smEval=s=>eval(s);'})});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.smEval);const run=s=>page.evaluate(s=>smEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};true`);
 await run(`(()=>{resetVillageTransient();setWorld(1);S=newState(1);LIVE[1]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();return 1})()`);
 /* おぼえる */
 assert.equal(await run(`lvOK('smelter')`),false,'はじめから炉');
 const q=await run(`(()=>{const q=SUBQ.find(q=>q.k==='smelter1');const a0=q.at();S.gotMat={copper:1};return [a0,q.at(),q.learn.join()]})()`);assert.deepEqual(q,[false,true,'smelter']);
 await run(`(()=>{S.recipes.smelter=true;return 1})()`);assert.equal(await run(`lvOK('smelter')`),true);
 /* 置いて、たのむ */
 const sj=await run(`(()=>{let j=-1;for(let y=CY+3;y<CY+10&&j<0;y++)for(let x=CX+2;x<CX+9;x++){const k=y*W+x;if([k,k+1,k+W,k+W+1].every(q=>!S.obj[q]&&S.ground[q]===0&&!S.floor[q]&&!hiAt(q))){j=k;break}}S.obj[j]='smelter';for(const q of[j+1,j+W,j+W+1]){S.obj[q]='part';S.ref[q]=j}recount();S.mat.copper=7;S.mat.iron=1;S.t=dayNo()*1440+8*60;return j})()`);
 await run(`smPop(${sj});1`);
 const pop=await page.evaluate(()=>[...document.querySelectorAll('.pxcard .nm')].map(e=>e.textContent));assert.deepEqual(pop,['銅の延べ棒（銅鉱石0/7）'],'鉄は2こないので出ない');
 await page.click('.pxcard .p');await page.click('.pxcard .p');await page.click('.pxcard .p');
 assert.equal(await page.textContent('.pxcard .v'),'3');assert.equal(await page.evaluate(()=>document.querySelector('.pxcard .p').disabled),true,'7こなら3つまで');
 if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/smpop.png'});
 await page.click('.pxcard .go');
 assert.deepEqual(await run(`[S.mat.copper,JSON.stringify(S.smQ)]`),[1,JSON.stringify({[sj]:{copper:6}})]);
 /* せいれいが運んで、火のせいれいが精錬 */
 const sim=await run(`(()=>{const fire=S.res.find(r=>r.elem==='fire');S.res.forEach(r=>{r.hidden=false;r.act=null});let lit=false,n=0;for(;n<6000&&(S.mat.icopper||0)<3;n++){stepWorld(.25);for(const q of S.res){q.hunger=hMax(q);q.fun=90;q.energy=90}if(smLit(${sj}))lit=true}return {n,ic:S.mat.icopper||0,cu:S.mat.copper,left:JSON.stringify(S.smIn||{}),lit,xp:fire.xp}})()`);
 console.log(JSON.stringify(sim));assert.equal(sim.ic,3,'延べ棒3こ');assert.equal(sim.cu,1);assert.equal(sim.lit,true,'火のついた絵');assert.equal(sim.left,'{}');
 /* こわれたら、入れた鉱石は返す */
 const rf=await run(`(()=>{S.mat.iron=0;S.mat.gold=4;boxSync();S.smIn={[${sj}]:{iron:2}};S.smQ={[${sj}]:{gold:4}};boxSync();const g0=S.mat.gold;clearObj(${sj});smTick();boxSync();return [S.mat.iron,S.mat.gold+g0,Object.keys(S.smIn).length+Object.keys(S.smQ).length]})()`);assert.deepEqual(rf,[2,4,0],'炉がなくなったら、入れた鉱石はもどり、とっておいた鉱石は使える数にもどる');
 /* そうびは延べ棒で作る・鉱石で思いつく */
 const gr=await run(`(()=>{const b=BL.gw03;S.recipes={};S.mat={};S.gotMat={copper:1};gearIdea();return [JSON.stringify(b.mat),!!S.recipes.gw03,!!S.recipes.gw05,MATN.icopper]})()`);
 assert.deepEqual(gr,['{"icopper":2,"bamboo":1}',true,false,'銅の延べ棒']);
 assert.equal(await run(`Object.values(GEARBL).filter(b=>b.mat&&['copper','iron','silver','gold'].some(k=>b.mat[k])).length`),0,'鉱石のままのそうび');
 assert.deepEqual(errors,[]);console.log('smelter: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
