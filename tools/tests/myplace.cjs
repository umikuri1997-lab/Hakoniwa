/* じぶんの場所：つかうせいれいをきめたいすで、ひまなときに休む。まわり3マスのかざり1つにつき、たのしさ+2。そのいすのそばのかざりは、その子が見にくる */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.t=1440*2+600;
for(let y=CY-16;y<CY+16;y++)for(let x=CX-16;x<CX+16;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{const r=mkRes(S,'a','wood',CX+.5,CY+.5);S.res=[r];r.hunger=hMax(r);r.energy=100;r.fun=40;const cj=(CY+4)*W+CX+3;S.obj[cj]='chair';S.useOwn={[cj]:r.id};
  S.obj[cj+2]='birdbath';S.obj[cj-W*2]='parasol';recount();const deco=decoNear(cj);
  endAct(r);const went=goOwnSeat(r,bfs(r.x|0,r.y|0))&&r.act.type==='ownseat';const f0=r.fun;for(let i=0;i<2000&&r.act&&r.act.type==='ownseat';i++){updRes(r,.1);r.hunger=hMax(r);r.energy=100}const gain=Math.round((r.fun-f0)*10)/10;
  /* いすのそばにかざりを置くと、遠くからでも見にくる */r.x=CX-12.5;r.y=CY+.5;endAct(r);const dj=cj+W*2;S.obj[dj]='birdbath';noteQuestPlacement('birdbath',dj);const far=goAdmire(r,bfs(r.x|0,r.y|0));
  return {deco,went,gain,far}})()`);
assert.equal(o.deco,2);assert.ok(o.went,'じぶんのいすへ');assert.ok(o.gain>=3.5,'かざり2つで+4 '+o.gain);assert.ok(o.far,'じぶんのいすのそばのかざりは、遠くからでも見にくる');
assert.deepEqual(errors,[]);console.log('myplace ok',JSON.stringify(o));await browser.close()})();
