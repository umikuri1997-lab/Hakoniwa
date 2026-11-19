/* とくにする仕事（focus.js）：えらんだ仕事を、ふだんの仕事より先にする・できない仕事はえらべない（風は料理なし）・せいれいの画面のボタン */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*3+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-10;y<CY+10;y++)for(let x=CX-10;x<CX+10;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';delete S.ref[j];delete S.dyn[j]}S.obj[CY*W+CX+4]='tree';S.obj[CY*W+CX-4]='rock';S.obj[(CY+2)*W+CX]='crate';S.drops=[];
S.res=[mkRes(S,'e','earth',CX+.5,CY+.5),mkRes(S,'w','wind',CX+.5,CY+1.5)];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=100}S.mat.wood=0;S.mat.stone=0;S.fs={bread:40};syncFood();recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const t=await run(`(()=>{const r=S.res[0],G=bfs(r.x|0,r.y|0),go=()=>{endAct(r);r.act=null;goWork(r,G,true);const k=r.act&&r.act.type;endAct(r);r.act=null;return k};const a=go();r.focus='mine';const b=go();return {a,b,okE:Object.keys(FOCUS).filter(k=>focusOK(r,k)),okW:Object.keys(FOCUS).filter(k=>focusOK(S.res[1],k))}})()`);
assert.equal(t.a,'chop','ふだんは木材が少ないと木');assert.equal(t.b,'mine','石をえらぶと石が先 '+JSON.stringify(t));
assert.ok(t.okE.includes('cook')&&!t.okW.includes('cook'),'風のせいれいは料理をえらべない '+JSON.stringify(t));
const ui=await run(`(()=>{const r=S.res[0];resTab=0;openSheet('res',r.id);const sec=[...document.querySelectorAll('#sheetWrap .sec')].find(s=>(s.querySelector('h3')||{}).textContent==='とくにする仕事');if(!sec)return 'nosec';const bs=[...sec.querySelectorAll('button')];const cur=bs.map(b=>b.textContent);bs[0].click();const pop=[...document.querySelectorAll('.fj .row')];const names=pop.map(b=>b.textContent);pop.find(b=>b.textContent==='なし').click();const f=r.focus;const left=document.querySelectorAll('.fj').length;closeSheet();return {cur,names,f:f||null,left}})()`);
assert.deepEqual(ui.cur,['石'],'ふだんは、いまの仕事だけ '+JSON.stringify(ui));assert.ok(ui.names.includes('石')&&ui.names.includes('なし'),'ポップアップでえらぶ '+JSON.stringify(ui));assert.equal(ui.f,null,'なしでもどる '+JSON.stringify(ui));assert.equal(ui.left,0,'えらんだらとじる');
assert.deepEqual(errors,[]);console.log('focus ok',JSON.stringify({t,ui}));await browser.close()})();
