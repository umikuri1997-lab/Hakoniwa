/* 新しい物を見にくる：家具・建物ができたら、昼、7マス以内のひまなせいれいが2人まで見にくる。ひとこと（くりかえさない）・好きな家具ならよろこぶ・たのしさ+2 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.t=1440*2+600;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{const rs=['a','b','c'].map((n,i)=>mkRes(S,n,['wood','earth','water'][i],CX+i+.5,CY+.5));S.res=rs;for(const r of rs){r.hunger=hMax(r);r.energy=100;r.fun=50}
  const j=(CY+3)*W+CX+1;S.obj[j]='lamp';noteQuestPlacement('lamp',j);recount();
  const got=rs.map(r=>{endAct(r);return goAdmire(r,bfs(r.x|0,r.y|0))});
  const a=rs[0],f0=a.fun;for(let i=0;i<800&&a.act&&a.act.type==='admire';i++)updRes(a,.1);
  /* 柵・壁は見にこない */const k=(CY-3)*W+CX;S.obj[k]='fence';noteQuestPlacement('fence',k);endAct(rs[2]);const fence=goAdmire(rs[2],bfs(rs[2].x|0,rs[2].y|0));
  return {got,gain:a.fun-f0,fence}})()`);
assert.deepEqual(o.got,[true,true,false],'2人まで見にくる');assert.ok(o.gain>=1.5,'たのしさ+2 '+o.gain);assert.equal(o.fence,false,'柵は見にこない');
assert.deepEqual(errors,[]);console.log('admire ok',JSON.stringify(o));await browser.close()})();
