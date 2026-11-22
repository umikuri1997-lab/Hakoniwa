const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* コワイノは、攻撃している相手のほうを向く（enFace：右・左・うしろ・正面）。クォータービューでは、前ななめ（<動き>）・うしろななめ（<動き>B）の絵と左右の反転で描く（isoFace。よこの絵 R・L はない） */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.efEval=s=>eval(s);'});});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>!!window.efEval);
await page.waitForFunction(()=>efEval('!!window.CHIPS&&!!CHIPS["kg_basic:idle"]'),null,{timeout:30000});
await page.waitForFunction(()=>efEval('drawShadeDot(document.createElement("canvas").getContext("2d"),"basic",0,0,.54,1,{t:0})'),null,{timeout:30000});
const out=await page.evaluate(()=>efEval(`(()=>{const o={};S=newState(0);setWorld(0);S.obj.fill('');S.hi.fill(0);if(S.fog)S.fog.fill(0);recount();
 o.side='basic fast thief brute breaker trapper ash rockc armor shiny hana hoteri ochiba yuki'.split(' ').every(k=>['idle','idleB','walk','walkB','atk','atkB'].every(m=>CHIPS['kg_'+k+':'+m])&&!['idleR','idleL','walkR','walkL','atkR','atkL'].some(m=>CHIPS['kg_'+k+':'+m]));
 o.iso=[isoFace(false,true,1),isoFace(false,true,-1),isoFace(true,false,1),isoFace(false,false,1)].map(q=>(q.back?'B':'F')+q.f).join(',');
 const r=S.res[0];S.res=[Object.assign(r,{hidden:false,act:null,hunger:9999,faintGrace:0})];S.t=(5*24+22)*60;
 const face=(dx,dy)=>{r.x=50.5+dx;r.y=50.5+dy;const e={id:1,type:'basic',x:50.5,y:50.5,hp:99,max:99,spawned:true,path:[],atk:0,stun:0,flash:0,repath:0,rest:0};S.enemies=[e];
  for(let i=0;i<20&&!AIMV.get(e);i++)updEnemy(e,.25);const v={x:e.x,y:e.y,back:false,f:1,mv:-1e9};return enFace(e,v,performance.now())};
 o.R=face(.6,0);o.L=face(-.6,0);o.B=face(0,-.6);o.F=face(0,.6);
 /* 壁をたたく：右の壁 */r.x=10.5;r.y=10.5;
 /* 絵：ななめの攻撃・歩くコマを描ける（反転も） */const c=document.createElement('canvas').getContext('2d');o.draw=drawShadeDot(c,'basic',40,60,.54,-1,{t:0,dot:1,atk:.97})&&drawShadeDot(c,'basic',40,60,.54,-1,{t:0,dot:1,back:true,atk:0})&&drawShadeDot(c,'basic',40,60,.54,1,{t:0,dot:1,walk:true});
 return o})()`));
console.log(JSON.stringify(out));
assert.equal(out.side,true,'14体ぶんの 前ななめ・うしろななめの絵');assert.equal(out.iso,'F-1,B-1,B1,F1','東・西・北・南');assert.equal(out.R,'R');assert.equal(out.L,'L');assert.equal(out.B,'B');assert.equal(out.F,'F');assert.equal(out.draw,true);
assert.deepEqual(errors,[]);console.log('Enemy face OK');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
