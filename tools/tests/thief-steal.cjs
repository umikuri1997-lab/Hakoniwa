const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* カゲドロボウは、盗んでいるあいだ、盗む動き（kg_thief:steal・stealB・stealR・stealL）をする。箱から盗むときは箱のほうを向き、畑はその上で正面 */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:900,height:600}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.tsEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.tsEval);
await page.waitForFunction(()=>tsEval('!!window.CHIPS&&!!CHIPS["kg_thief:idle"]'),null,{timeout:30000});
await page.waitForFunction(()=>tsEval('drawShadeDot(document.createElement("canvas").getContext("2d"),"thief",0,0,.54,1,{t:0})'),null,{timeout:30000});
const out=await page.evaluate(()=>tsEval(`(()=>{const o={};o.chips=['steal','stealB','stealR','stealL'].every(m=>CHIPS['kg_thief:'+m]);
 function setup(kind,ex){S=newState(0);S.ground.fill(0);S.hi.fill(0);S.obj.fill('');S.floor.fill('');S.dyn={};S.res=[];S.mat={wood:20};S.fs={};syncFood();S.enemies=[];const j=55*W+55;S.obj[j]=kind;S.dyn[j]={g:100,crop:'imo',sown:true};recount();boxSync();const e={id:1,type:'thief',spawned:true,x:ex,y:55.5,hp:30,max:30,path:[],repath:0,atk:0,stun:0};S.enemies=[e];for(let i=0;i<3;i++){S.t++;updEnemy(e,1.5)}return e}
 const keys=[],kd=kgDot;kgDot=(k,f)=>{keys.push(k);return kd(k,f)};
 let e=setup('crate',54.5);o.boxSteal=foeStealing(e);o.boxFace=enFace(e,{x:e.x,y:e.y,mv:-1e9},performance.now());
 const c=document.createElement('canvas').getContext('2d');drawShadeDot(c,'thief',40,60,.54,1,{t:0,dot:1,side:o.boxFace,steal:true});o.boxKey=keys.pop();
 e=setup('farm',55.5);o.farmSteal=foeStealing(e);o.farmFace=enFace(e,{x:e.x,y:e.y,mv:-1e9},performance.now());drawShadeDot(c,'thief',40,60,.54,1,{t:0,dot:1,steal:true});o.farmKey=keys.pop();
 drawShadeDot(c,'thief',40,60,.54,1,{t:0,dot:1,back:true,steal:true});o.backKey=keys.pop();
 drawShadeDot(c,'thief',40,60,.54,1,{t:0,dot:1});o.idleKey=keys.pop();
 kgDot=kd;return o})()`));
console.log(JSON.stringify(out));
assert.equal(out.chips,true,'盗む動きの絵（4つの向き）');assert.equal(out.boxSteal,true);assert.equal(out.boxFace,'R','箱のほうを向く');assert.equal(out.boxKey,'kg_thief:stealR');
assert.equal(out.farmSteal,true);assert.equal(out.farmFace,null,'畑は正面');assert.equal(out.farmKey,'kg_thief:steal');assert.equal(out.backKey,'kg_thief:stealB');assert.equal(out.idleKey,'kg_thief:idle');
assert.deepEqual(errors,[]);console.log('Thief steal motion OK');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
