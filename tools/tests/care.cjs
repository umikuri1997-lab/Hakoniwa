/* じかにお世話（お世話のタブ）：「お話する」（いつでも。たのしさ+10は1日1回）・せいれいの画面の「なでる」（たのしさ+10）・「毛布をかける」（外で寝ている子だけ、つかれのとれる速さ2倍）。どれも1日1回 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-8;y<CY+8;y++)for(let x=CX-8;x<CX+8;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';delete S.ref[j];delete S.dyn[j]}S.fs={bread:3};syncFood();S.res=[mkRes(S,'a','wood',CX+.5,CY+.5)];const r=S.res[0];r.hunger=500;r.energy=100;r.fun=40;recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const click=t=>run(`(()=>{const b=[...document.querySelectorAll('#sheetWrap button.btn')].find(x=>x.textContent===${JSON.stringify(t)});if(!b)return false;b.click();return true})()`);
await run(`resTab=2;openSheet('res',S.res[0].id)`);
const st0=await run(`(()=>{const r=S.res[0];return [r.fun,r.hunger,S.food]})()`);
assert.ok(await click('なでる'),'なでるボタン');await click('なでる');
const st1=await run(`(()=>{const r=S.res[0];return [r.fun,r.hunger,S.food,![...document.querySelectorAll('#sheetWrap button.btn')].some(x=>x.textContent==='毛布をかける')]})()`);
assert.equal(st1[0],st0[0]+10,'なでる+10（2回目はなし）');assert.ok(st1[3],'起きているときは毛布なし');
/* 外で寝ている子に毛布 */
const bl=await run(`(()=>{const r=S.res[0];closeSheet();S.t=1440*3+60;r.energy=10;r.act={type:'sleep',stage:'do',t:5,ground:true,night:true,rate:.12,pt:1};resTab=2;openSheet('res',r.id);const tk=[...document.querySelectorAll('#sheetWrap button.btn')].find(x=>x.textContent==='お話する');if(!tk||!tk.classList.contains('lack'))return 'talk-not-lack:'+(tk&&tk.className);const b=[...document.querySelectorAll('#sheetWrap button.btn')].find(x=>x.textContent==='毛布をかける');if(!b)return 'nobtn';const e0=r.energy;ACT.sleep.tick(r,r.act,10);const d0=r.energy-e0;b.click();const e1=r.energy;ACT.sleep.tick(r,r.act,10);const d1=r.energy-e1;return {on:!!r.act.blanket,ratio:Math.round(d1/d0*100)/100}})()`);
assert.ok(bl.on,'毛布 '+JSON.stringify(bl));assert.ok(Math.abs(bl.ratio-2)<.05,'つかれのとれる速さ2倍 '+bl.ratio);
/* お話：会話を読みおえたら、たのしさ+10（1日1回）。きょうしたことを話す */
const tl=await run(`(()=>{const r=S.res[0];closeSheet();S.t=1440*4+600;r.act=null;r.fun=40;(S.subSt||(S.subSt={})).talk1=2;dayNote(r,{type:'chop'});const L=talkLines(r).map(l=>l[1]);return {L,dl:r.dl.e.length}})()`);
assert.ok(tl.dl===1&&tl.L.length>=3,'お話の行 '+JSON.stringify(tl));
const talk=async()=>{await run(`(()=>{resTab=2;openSheet('res',S.res[0].id);[...document.querySelectorAll('#sheetWrap button.btn')].find(x=>x.textContent==='お話する').click()})()`);for(let i=0;i<40&&!(await run(`$('#dialog').hidden`));i++){await run(`(()=>{const b=document.querySelector('#dlgBtns .btn[data-nx]');if(b){b.disabled=false;DLGA.holdUntil=0;b.click();b.click()}})()`);await p.waitForTimeout(60)}return run(`[S.res[0].fun,!!S.flags.talkQ,sheet]`)};
const t1=await talk(),t2=await talk();
assert.equal(t1[0],50,'お話+10');assert.ok(t1[1],'お話の依頼');assert.equal(t1[2],'res','お話のあと、せいれいの画面にもどる');assert.equal(t2[0],50,'2回目はたのしさ+0');
assert.deepEqual(errors,[]);console.log('care ok',JSON.stringify({st0,st1,bl,t1,t2}));await browser.close()})();
