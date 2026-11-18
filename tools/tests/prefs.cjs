/* せいれいの好み（prefs.js）：はじめは「？？？」。はじめて遊ぶ・食べる・見にくると、とくべつによろこんでわかる。お話で本人が言ったら、読みおえてわかる */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-8;y<CY+8;y++)for(let x=CX-8;x<CX+8;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';delete S.ref[j];delete S.dyn[j]}S.res=[mkRes(S,'a','wood',CX+.5,CY+.5)];const r=S.res[0];r.like='swing';r.hunger=500;r.energy=100;r.fun=40;recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const prof=()=>run(`(()=>{resTab=1;openSheet('res',S.res[0].id);const o={};for(const d of document.querySelectorAll('#sheetWrap .stat'))o[d.firstChild.textContent]=d.lastChild.textContent;closeSheet();return [o['好きな遊び'],o['好きな家具'],o['好きな料理'],o['にがてな遊び']]})()`);
const p0=await prof();await p.waitForTimeout(50);const say=await run(`(()=>{const r=S.res[0],k={...r.kn};r.kn={};return k})()`);/* ひとことで言った好みは、わかる */assert.deepEqual(p0,['？？？','？？？','？？？','？？？'],'はじめは？？？ '+JSON.stringify(p0));
/* はじめて好きな遊び */
const lk=await run(`(()=>{const r=S.res[0],now=performance.now();ACT.play.start(r,{what:'swing',fun:1});const a={kn:{...r.kn},jump:JUMP.has(r),joy:(JOYU.get(r)||0)>now+2000};JUMP.delete(r);JOYU.delete(r);ACT.play.start(r,{what:'swing',fun:1});a.again=JUMP.has(r);return a})()`);
assert.deepEqual(lk,{kn:{lk:1},jump:true,joy:true,again:false},'はじめて好きな遊びで、よろこぶ（2回めはふつう） '+JSON.stringify(lk));
/* はじめて好きな料理 */
const fd=await run(`(()=>{const r=S.res[0];r.meal={u:1,pt:0,pw:0,e:'🍞',items:[favDish(r)]};ACT.eat.start(r,{});return !!r.kn.fd&&JUMP.has(r)})()`);assert.ok(fd,'好きな料理');
/* はじめて好きな家具を見にくる */
const lf=await run(`(()=>{const r=S.res[0];JUMP.delete(r);const a={t:3,id:likeF(r),obj:0};ACT.admire.tick(r,a);return !!r.kn.lf&&JUMP.has(r)})()`);assert.ok(lf,'好きな家具');
/* にがてな遊び：お話で本人が言って、読みおえたらわかる */
const ng0=await run(`(()=>{const r=S.res[0];nowTopic=()=>null;smallTalk=q=>{q.tlast='ng';return ['じつはね……','ないしょだよ。']};talkTo(r);return !!r.kn.ng})()`);assert.equal(ng0,false,'会話のとちゅうでは、まだわからない');
for(let i=0;i<40&&!(await run(`$('#dialog').hidden`));i++){await run(`(()=>{const b=document.querySelector('#dlgBtns .btn[data-nx]');if(b){b.disabled=false;DLGA.holdUntil=0;b.click();b.click()}})()`);await p.waitForTimeout(60)}
const p1=await prof();assert.deepEqual(p1[3]!=='？？？'&&p1.every(v=>v!=='？？？'),true,'ぜんぶわかった '+JSON.stringify(p1));
assert.deepEqual(errors,[]);console.log('prefs ok',JSON.stringify({p0,say,p1}));await browser.close()})();
