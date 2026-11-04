const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 料理：その料理の属性のせいれいだけが作る・時間は料理の time・サラダは調理台・夜は材料をもどす・古いセーブ（料理じょうず） */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.cookEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.cookEval);
const out=await page.evaluate(()=>cookEval(`(()=>{const out={};
function setup(){S=newState(0);setWorld(0);S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.enemies=[];S.t=1440*2+600;USERPAUSE=true;
  const box=50*W+50,tb=50*W+56,ov=50*W+62;S.obj[box]='stor';S.obj[tb]='cooktable';S.obj[ov]='oven';S.fs={tomato:4,mugi:4};syncFood();S.ovenSet={};
  const base=S.res[0];S.res=[];const mk=(el,x)=>{const r=JSON.parse(JSON.stringify(base));r.id=100+x;r.name='t'+x;r.elem=el;r.x=x+.5;r.y=52.5;r.act=null;r.cing=null;r.hunger=200;r.hidden=false;r.vr=r.vr||{};r.vr.tr='hayaashi';S.res.push(r);return r};recount();return {box,tb,ov,mk}}
out.times=Object.fromEntries(ALLRECIPES.map(R=>[R.out,R.time]));out.hasTimeR=ALLRECIPES.some(R=>'timeR' in R);out.noTrait=!('ryouri' in TRAITS);
let E=setup();const wood=E.mk('wood',55);S.ovenSet[E.tb]='salad';S.ovenSet[E.ov]='bread';
let G=bfs(wood.x|0,wood.y|0);out.woodJob=tryJob(wood,G,'cookS');out.woodAct=wood.act&&{type:wood.act.type,rec:wood.act.rec,ov:wood.act.ov===E.tb};
ACT.cgrab.start(wood,wood.act);out.cing=wood.cing&&wood.cing.rec;const a={obj:E.tb};out.cookStart=ACT.cook.start(wood,a)!==false;out.tableNoFire=a.tb===true;out.woodTime=cookTime(wood,E.tb);
out.els=Object.fromEntries(ALLRECIPES.map(R=>[R.out,R.el]));out.ovenListHasSalad=RECIPES.filter(R=>dishSt(R)==='oven').some(R=>R.out==='salad');
E=setup();const water=E.mk('water',60);S.ovenSet[E.ov]='bread';G=bfs(water.x|0,water.y|0);out.waterBread=tryJob(water,G,'cook')||tryJob(water,G,'cookS');
const fire=E.mk('earth',64);out.fireTakes=tryJob(fire,bfs(fire.x|0,fire.y|0),'cookS')&&fire.act.rec;ACT.cgrab.start(fire,fire.act);out.fireTime=cookTime(fire,E.ov);
fire.act=null;const fb=S.fs.mugi;S.t=1440*3+23*60+30;decide0(fire);out.nightReturned=S.fs.mugi-fb;out.nightCing=fire.cing;
S=newState(0);setWorld(0);const j=60*W+60;S.obj[j]='oven';S.ovenSet={[j]:'salad'};delete S.flags.cookfit1;S.mig=9;S.res[0].vr.tr='ryouri';const saved=JSON.parse(JSON.stringify(S));continueGame(saved);out.oldSalad=S.ovenSet[j]||null;out.flag=S.flags.cookfit1;out.oldTrait=S.res[0].vr.tr;
/* 村の中で動かす：ほかの属性だけでは作らない、その属性の子は作る */
const sim={};for(const R of ALLRECIPES)for(const el of[R.el,'wind']){S=newState(0);setWorld(R.out==='soup'?1:0);soupFilter();S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.enemies=[];S.drops=[];S.seeds=[];S.t=1440*2+540;USERPAUSE=true;
  const box=50*W+50,st=50*W+56;S.obj[box]='stor';S.obj[st]=dishSt(R);S.fs={};for(const k in R.need)S.fs[k]=R.need[k]*3;syncFood();S.ovenSet={[st]:R.out};
  const base=S.res[0];S.res=[];for(let i=0;i<2;i++){const q=JSON.parse(JSON.stringify(base));q.id=200+i;q.name='e'+i;q.elem=el;q.x=53.5+i;q.y=52.5;q.act=null;q.cing=null;q.hunger=150;q.fun=90;q.energy=100;q.hidden=false;q.vr=q.vr||{};q.vr.tr='';S.res.push(q)}recount();
  const c0=S.cookN||0;let n=0;for(;n<1500&&(S.cookN||0)===c0;n++){stepWorld(.25);for(const q of S.res){q.hunger=150;q.fun=90}}sim[R.out+':'+el]=(S.cookN||0)-c0}out.sim=sim;
const txt=JSON.stringify(MANUAL)+ALLRECIPES.map(DISHD).join()+Object.values(ELEM).map(e=>e.can).join();out.tokui=/とくい|焼きりんご|焼きベリー/.test(txt);out.juiceIcons=['berryjuice','applejuice'].map(k=>!!icURL(FOODS[k].e));out.juiceSt=['berryjuice','applejuice'].map(k=>dishSt(ALLRECIPES.find(R=>R.out===k)));
S=newState(0);setWorld(0);const ov2=61*W+61;S.obj[ov2]='oven';S.ovenSet={[ov2]:'yakiapple'};S.fs.yakiberry=2;S.seenIt={'f:yakiapple':1};delete S.flags.juice1;S.res[0].elem='fire';S.res[0].cing={rec:'bread',ov:ov2};S.fs.mugi=0;continueGame(JSON.parse(JSON.stringify(S)));out.mig={fs:S.fs.berryjuice||0,old:'yakiberry' in S.fs,oven:S.ovenSet[ov2]||null,seen:Object.keys(S.seenIt).filter(k=>/juice|yaki(apple|berry)/.test(k)),cing:S.res[0].cing,mugi:S.fs.mugi};out.dishd=DISHD(ALLRECIPES[1]);
return out})()`));
console.log(out);
assert.deepEqual(out.times,{soup:107.1,bread:84,yakizakana:42,yakiimo:35,berryjuice:42,applejuice:42,salad:63});assert.equal(out.hasTimeR,false);assert.equal(out.noTrait,true);
assert.equal(out.woodJob,true);assert.deepEqual(out.woodAct,{type:'cgrab',rec:'salad',ov:true});assert.equal(out.cing,'salad');assert.equal(out.cookStart,true);assert.equal(out.tableNoFire,true);assert.equal(out.woodTime,63);assert.equal(out.ovenListHasSalad,false);assert.deepEqual(out.els,{soup:'water',bread:'earth',yakizakana:'fire',yakiimo:'fire',berryjuice:'water',applejuice:'water',salad:'wood'});
assert.equal(out.waterBread,false);assert.equal(out.fireTakes,'bread');assert.equal(out.fireTime,84);assert.equal(out.nightReturned,2);assert.equal(out.nightCing,null);
assert.equal(out.oldSalad,null);assert.equal(out.flag,1);assert.notEqual(out.oldTrait,'ryouri');
for(const R of Object.keys(out.els)){assert.ok(out.sim[R+':'+out.els[R]]>=1,R+' by '+out.els[R]);assert.equal(out.sim[R+':wind'],0,R+' by wind')}
assert.equal(out.tokui,false);assert.deepEqual(out.juiceIcons,[true,true]);assert.deepEqual(out.juiceSt,['cooktable','cooktable']);assert.deepEqual(out.mig,{fs:2,old:false,oven:null,seen:['f:applejuice'],cing:null,mugi:2});assert.ok(out.dishd.includes('作る:土'));assert.deepEqual(errors,[]);
console.log('Cooking: bread=earth, juices=water at the cooking table, old yakiapple/yakiberry saves migrated, each dish is made only by its element (wind-only village cooks nothing; the element cooks each dish in a running village), times are the real dish times, no とくい wording, salad at the cooking table, night returns ingredients, old oven salad cleared, old 料理じょうず trait migrated. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
