/* ベッドがないとき：家があれば、家の中の床で寝る。家がない・家に行けないときは、前のまま */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j];}S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5)];})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const house="const hx=CX+4,hy=CY-4;for(let y=hy;y<hy+4;y++)for(let x=hx;x<hx+4;x++){const j=y*W+x;S.obj[j]=(y===hy||y===hy+3||x===hx||x===hx+3)?'hwall':''}S.obj[(CY-1)*W+CX+5]='door';";
const sc=(t,setup)=>run(`(()=>{S.t=${t};for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j]}${setup};recount();const r=S.res[0];r.x=CX+.5;r.y=CY+.5;r.energy=10;r.hunger=hMax(r);endAct(r);goSleep(r,bfs(r.x|0,r.y|0));const a=r.act,at=a.stand>=0?a.stand:(r.y|0)*W+(r.x|0);return {type:a.type,ground:!!a.ground,inHouse:HOUSES.some(h=>h.inside.has(at))}})()`);
const N=1440*2+60,D=1440*2+720;
for(const t of [N,D]){const o=await sc(t,house);assert.deepEqual(o,{type:'sleep',ground:true,inHouse:true},'家の床で寝る '+t+' '+JSON.stringify(o))}
assert.equal((await sc(N,'')).type,'sleep','家がなければ地面で寝る');
assert.equal((await sc(N,house+"for(let y=CY-1;y<=CY+1;y++)for(let x=CX-1;x<=CX+1;x++)if(x!==CX||y!==CY)S.obj[y*W+x]='fence';")).type,'stay','家に行けない夜は、その場でまつ');
/* 歩いて行って、床で寝て、つかれがとれる */
const e=await run(`(()=>{S.t=${N};for(let y=CY-20;y<CY+20;y++)for(let x=CX-20;x<CX+20;x++){const j=y*W+x;S.obj[j]='';delete S.ref[j];delete S.dyn[j]}${house};recount();const r=S.res[0];r.x=CX+.5;r.y=CY+.5;r.energy=10;r.hunger=hMax(r);endAct(r);goSleep(r,bfs(r.x|0,r.y|0));for(let i=0;i<400;i++){updRes(r,.25);r.hunger=hMax(r)}return {type:r.act&&r.act.type,stage:r.act&&r.act.stage,energy:r.energy,inHouse:HOUSES.some(h=>h.inside.has((r.y|0)*W+(r.x|0)))}})()`);
assert.ok(e.type==='sleep'&&e.stage==='do'&&e.inHouse&&e.energy>10,'床で寝てつかれがとれる '+JSON.stringify(e));
assert.deepEqual(errors,[]);console.log('floor sleep ok',JSON.stringify(e));await browser.close()})();
