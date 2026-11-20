/* たのしさのわけ（fun-why.js）：funAdd がわけごとに朝6時からの合計をのこす・0〜100にまるめた分だけ数える・じかに入れた分は「そのほか」・朝6時で0にもどる・毎コマのへりが「時間でへる」に入る・せいれいの画面でたのしさをタップすると一覧 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:420,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.t=1440*2+600;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;
for(let y=CY-8;y<CY+8;y++)for(let x=CX-8;x<CX+8;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';delete S.ref[j];delete S.dyn[j]}S.res=[mkRes(S,'a','wood',CX+.5,CY+.5)];const r=S.res[0];r.hunger=450;r.energy=100;r.fun=40;r.fd=null;recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const a=await run(`(()=>{const r=S.res[0];funAdd(r,10,'play');funAdd(r,5,'play');funAdd(r,-3,'foe');funAdd(r,80,'meal');/* 100でとまる：55→100 は +45 */r.fun-=20;/* じかに：そのほか */return {fun:r.fun,k:r.fd.k,f0:r.fd.f0}})()`);
assert.equal(a.f0,40,'朝の数');assert.deepEqual(a.k,{play:15,foe:-3,meal:48},'わけごと・100でまるめた分だけ '+JSON.stringify(a));assert.equal(a.fun,80);
const pop=await run(`(()=>{const r=S.res[0];resTab=0;openSheet('res',r.id);const sp=[...document.querySelectorAll('#sheetWrap .gauges>span')][1];if(!sp||!sp.classList.contains('comfyTap'))return 'notap';sp.click();const c=[...document.querySelectorAll('.pxpopw')].pop();if(!c)return 'nopop';const t=[...c.querySelectorAll('.st')].map(d=>d.textContent);c.remove();return t})()`);
assert.ok(Array.isArray(pop),'たのしさをタップするとポップアップ '+pop);
for(const t of['ごはん+48','あそび+15','「コワイノ」－3','そのほか－20','たのしさ80 / 100'])assert.ok(pop.includes(t),t+' '+JSON.stringify(pop));
assert.ok(pop.some(t=>t.startsWith('時間でへる－5')),'時間でへる（1時間） '+JSON.stringify(pop));
const tk=await run(`(()=>{closeSheet();const r=S.res[0];r.act={type:'wander',stage:'do',t:1};const o=preBedCalm;preBedCalm=()=>false;const f=r.fun;updRes(r,9);preBedCalm=o;return {d:Math.round((f-r.fun)*100)/100,t:Math.round(r.fd.k.time*100)/100}})()`);
assert.ok(tk.d>0&&Math.abs(tk.d+tk.t)<.01,'毎コマのへりは「時間でへる」 '+JSON.stringify(tk));
const nd=await run(`(()=>{const r=S.res[0];S.t+=1440;funAdd(r,2,'care');return {k:r.fd.k,f0:Math.round(r.fd.f0)}})()`);
assert.deepEqual(nd.k,{care:2},'つぎの日は0から '+JSON.stringify(nd));
assert.deepEqual(errors,[]);console.log('fun-why ok',JSON.stringify({a,pop,tk,nd}));await browser.close()})();
