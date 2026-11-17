const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* コワイノは、攻撃している相手のほうを向く（enFace：右・左・うしろ・正面）。よこの絵（idleR・atkR・idleL・atkL）は14体ぶんある */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.efEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.efEval);
await page.waitForFunction(()=>efEval('!!window.CHIPS&&!!CHIPS["kg_basic:idle"]'),null,{timeout:30000});
await page.waitForFunction(()=>efEval('drawShadeDot(document.createElement("canvas").getContext("2d"),"basic",0,0,.54,1,{t:0})'),null,{timeout:30000});
const out=await page.evaluate(()=>efEval(`(()=>{const o={};S=newState(0);setWorld(0);S.obj.fill('');S.hi.fill(0);if(S.fog)S.fog.fill(0);recount();
 o.side='basic fast thief brute breaker trapper ash rockc armor shiny hana hoteri ochiba yuki'.split(' ').every(k=>['idleR','idleL','atkR','atkL'].every(m=>CHIPS['kg_'+k+':'+m]));
 const r=S.res[0];S.res=[Object.assign(r,{hidden:false,act:null,hunger:9999,faintGrace:0})];S.t=(5*24+22)*60;
 const face=(dx,dy)=>{r.x=50.5+dx;r.y=50.5+dy;const e={id:1,type:'basic',x:50.5,y:50.5,hp:99,max:99,spawned:true,path:[],atk:0,stun:0,flash:0,repath:0,rest:0};S.enemies=[e];
  for(let i=0;i<20&&!AIMV.get(e);i++)updEnemy(e,.25);const v={x:e.x,y:e.y,back:false,f:1,mv:-1e9};return enFace(e,v,performance.now())};
 o.R=face(.6,0);o.L=face(-.6,0);o.B=face(0,-.6);o.F=face(0,.6);
 /* 壁をたたく：右の壁 */r.x=10.5;r.y=10.5;
 /* 絵：よこの攻撃のコマを描ける */const c=document.createElement('canvas').getContext('2d');o.draw=drawShadeDot(c,'basic',40,60,.54,1,{t:0,dot:1,side:'R',atk:.97})&&drawShadeDot(c,'basic',40,60,.54,-1,{t:0,dot:1,side:'L',atk:0});
 return o})()`));
console.log(JSON.stringify(out));
assert.equal(out.side,true,'14体ぶんの よこの絵');assert.equal(out.R,'R');assert.equal(out.L,'L');assert.equal(out.B,'B');assert.equal(out.F,'F');assert.equal(out.draw,true);
assert.deepEqual(errors,[]);console.log('Enemy face OK');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
