/* ひとりのときのしぐさ：昼、お散歩のかわりに、属性ごとの小さな動き。おわると、たのしさ+3。夜はしない */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.res=[];return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const sc=(el,setup,t)=>run(`(()=>{S.t=${t||1440*2+600};for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}${setup||''};recount();const r=mkRes(S,'q','${el}',CX+.5,CY+.5);S.res=[r];r.hunger=hMax(r);r.energy=100;r.fun=50;const f0=r.fun;const ok=goQuirk(r,bfs(r.x|0,r.y|0));if(!ok)return {ok};const k=r.act.k;let i=0;for(;i<600&&r.act&&r.act.type==='quirk';i++){updRes(r,.1);r.hunger=hMax(r);r.energy=100}return {ok,k,ended:!r.act||r.act.type!=='quirk',fun:Math.round((r.fun-f0)*10)/10}})()`);
const flower="S.obj[CY*W+CX-3]='salvia'",tree="S.obj[CY*W+CX+3]='tree'",pond="for(let y=CY+2;y<CY+5;y++)for(let x=CX-5;x<CX-2;x++)S.ground[y*W+x]=1",fire="S.obj[(CY+3)*W+CX+3]='campfire'";
const want=[['earth','','stone'],['wood',flower+';'+tree,'sniff'],['wood',tree,'lookup'],['water',pond,'peek'],['fire',fire,'warm'],['fire','','box'],['wind','','spin']];
for(const [el,s,k] of want){const o=await sc(el,s);assert.equal(o.ok,true,el+' '+k);assert.equal(o.k,k,el);assert.ok(o.ended,el+' ends');assert.ok(o.fun>=2.5,el+' fun '+o.fun)}
assert.equal((await sc('wood','')).ok,false,'花も木もなければ、しない');assert.equal((await sc('water','')).ok,false,'水がなければ、しない');
/* 夜はお散歩のかわりにしない（goWander は寝にいく） */
const night=await run(`(()=>{S.t=1440*3+60;const r=S.res[0];r.quirkT=0;endAct(r);goWander(r,bfs(r.x|0,r.y|0));return r.act&&r.act.type})()`);assert.notEqual(night,'quirk','夜はしない');
assert.deepEqual(errors,[]);console.log('quirk ok');await browser.close()})();
