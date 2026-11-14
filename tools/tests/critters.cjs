/* 小さな生き物：昼の花にちょう・木のそばに小鳥・夕方の水べにかえる。小鳥はせいれいが近づくと飛びたつ。ひまなせいれいは見にいって、たのしさ+2。夜は出ない */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:900,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.rain=false;S.t=1440*2+600;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}
for(const d of [-3,-2,-1])S.obj[CY*W+CX+d]='salvia';S.obj[(CY-3)*W+CX+5]='tree';for(let y=CY+3;y<CY+6;y++)for(let x=CX-8;x<CX-4;x++)S.ground[y*W+x]=1;S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{cam.z=2;centerOn(CX*TS,(CY+.5)*TS);CRIT=[];for(let i=0;i<300;i++)critTick(.5);const kinds=[...new Set(CRIT.map(c=>c.k))];
  /* 小鳥は、せいれいが近づくと飛びたつ */CRIT=[];CRIT.push({id:999,k:'bird',x:CX+4.5,y:CY-2.4,hx:CX+4.5,hy:CY-2.4,z:0,face:1,t:0,life:100,hop:9,fl:0});const r=mkRes(S,'a','wind',CX+4.5,CY-1.5);S.res=[r];critTick(.1);const flew=!!critById(999).fl;
  /* 見にいく */CRIT=[{id:7,k:'fly',x:CX-2.5,y:CY+.5,hx:CX-2.5,hy:CY+.5,z:12,face:1,t:0,life:999,hop:0,fl:0,ci:3}];r.x=CX+2.5;r.y=CY+.5;r.fun=50;r.hunger=hMax(r);r.energy=100;endAct(r);const ok=goCritter(r,bfs(r.x|0,r.y|0));const f0=r.fun;
  for(let i=0;i<400&&r.act&&r.act.type==='critwatch';i++){updRes(r,.1);CRIT[0]&&(CRIT[0].life=999)}const gain=r.fun-f0;
  /* 夜は出ない */S.t=1440*3+60;CRIT=[];for(let i=0;i<100;i++)critTick(.5);const night=CRIT.length;
  return {kinds,flew,ok,gain,night}})()`);
assert.ok(o.kinds.includes('fly')&&o.kinds.includes('bird'),'昼：ちょうと小鳥 '+o.kinds);assert.ok(o.flew,'小鳥は飛びたつ');assert.ok(o.ok,'見にいく');assert.ok(o.gain>=1.5,'たのしさ+2 '+o.gain);assert.equal(o.night,0,'夜は出ない');
const ev=await run(`(()=>{S.t=1440*4+1080;CRIT=[];for(let i=0;i<300;i++)critTick(.5);return CRIT.some(c=>c.k==='frog')})()`);assert.ok(ev,'夕方の水べに、かえる');
assert.deepEqual(errors,[]);console.log('critters ok',JSON.stringify(o));await browser.close()})();
