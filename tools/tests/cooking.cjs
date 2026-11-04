const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 料理：だれでも作れる・とくいな子は timeR・サラダは調理台・夜は材料をもどす・古いセーブ */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.cookEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.cookEval);
const out=await page.evaluate(()=>cookEval(`(()=>{const out={};
function setup(){S=newState(0);setWorld(0);S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.enemies=[];S.t=1440*2+600;USERPAUSE=true;
  const box=50*W+50,tb=50*W+56,ov=50*W+62;S.obj[box]='stor';S.obj[tb]='cooktable';S.obj[ov]='oven';S.fs={tomato:4,mugi:4};syncFood();S.ovenSet={};
  const base=S.res[0];S.res=[];const mk=(el,x)=>{const r=JSON.parse(JSON.stringify(base));r.id=100+x;r.name='t'+x;r.elem=el;r.x=x+.5;r.y=52.5;r.act=null;r.cing=null;r.hunger=200;r.hidden=false;r.vr=r.vr||{};r.vr.tr='hayaashi';S.res.push(r);return r};recount();return {box,tb,ov,mk}}
let E=setup();const wood=E.mk('wood',55);S.ovenSet[E.tb]='salad';S.ovenSet[E.ov]='bread';
let G=bfs(wood.x|0,wood.y|0);out.woodJob=tryJob(wood,G,'cookS');out.woodAct=wood.act&&{type:wood.act.type,rec:wood.act.rec,ov:wood.act.ov===E.tb};
ACT.cgrab.start(wood,wood.act);out.cing=wood.cing&&wood.cing.rec;const a={obj:E.tb};out.cookStart=ACT.cook.start(wood,a)!==false;out.tableNoFire=a.tb===true;out.woodTime=cookTime(wood,E.tb);
out.els=Object.fromEntries(ALLRECIPES.filter(R=>/^yaki|salad/.test(R.out)).map(R=>[R.out,R.el]));out.ovenListHasSalad=RECIPES.filter(R=>dishSt(R)==='oven').some(R=>R.out==='salad');
E=setup();const water=E.mk('water',60);S.ovenSet[E.ov]='bread';G=bfs(water.x|0,water.y|0);out.waterSpecOnly=tryJob(water,G,'cookS');out.waterBread=tryJob(water,G,'cook')&&water.act.rec;
ACT.cgrab.start(water,water.act);const b={obj:E.ov};out.ovenStart=ACT.cook.start(water,b)!==false;out.waterTime=cookTime(water,E.ov);
E=setup();const w2=E.mk('water',60),fire=E.mk('fire',64);S.ovenSet[E.ov]='bread';G=bfs(w2.x|0,w2.y|0);out.waitsForFire=tryJob(w2,G,'cook');out.fireTakes=tryJob(fire,bfs(fire.x|0,fire.y|0),'cookS')&&fire.act.rec;
fire.act=null;fire.cing={rec:'bread',ov:E.ov};const fb=S.fs.mugi;S.t=1440*3+23*60+30;decide0(fire);out.nightReturned=S.fs.mugi-fb;out.nightCing=fire.cing;
S=newState(0);setWorld(0);const j=60*W+60;S.obj[j]='oven';S.ovenSet={[j]:'salad'};delete S.flags.cookfit1;const saved=JSON.parse(JSON.stringify(S));continueGame(saved);out.oldSalad=S.ovenSet[j]||null;out.flag=S.flags.cookfit1;
return out})()`));
console.log(out);
assert.equal(out.woodJob,true);assert.deepEqual(out.woodAct,{type:'cgrab',rec:'salad',ov:true});assert.equal(out.cing,'salad');assert.equal(out.cookStart,true);assert.equal(out.tableNoFire,true);assert.equal(out.woodTime,63);assert.equal(out.ovenListHasSalad,false);assert.deepEqual(out.els,{yakizakana:'fire',yakiimo:'fire',yakiberry:'fire',yakiapple:'fire',salad:'wood'});
assert.equal(out.waterSpecOnly,false);assert.equal(out.waterBread,'bread');assert.equal(out.ovenStart,true);assert.equal(out.waterTime,120);
assert.equal(out.waitsForFire,false);assert.equal(out.fireTakes,'bread');assert.equal(out.nightReturned,2);assert.equal(out.nightCing,null);
assert.equal(out.oldSalad,null);assert.equal(out.flag,1);assert.deepEqual(errors,[]);
console.log('Cooking: grilled dishes are fire specialties, salad is wood; wood cooks salad at the cooking table (timeR 63), water cooks bread at the oven without fire (120), idle fire specialist takes bread first, night returns ingredients, old oven salad cleared. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
