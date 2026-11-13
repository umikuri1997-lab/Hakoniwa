/* 天気・時間への反応：雨の日の水のせいれい（ばんざい）・夕焼け（すわって見る、2人ならならぶ）・朝ののび */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;
for(let y=CY-12;y<CY+12;y++)for(let x=CX-12;x<CX+12;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{const a=mkRes(S,'a','water',CX+.5,CY+.5),b=mkRes(S,'b','wood',CX+3.5,CY+.5);S.res=[a,b];for(const r of S.res){r.hunger=hMax(r);r.energy=100;r.fun=50}
  const tryW=r=>{for(let i=0;i<60;i++){endAct(r);if(goWeather(r,bfs(r.x|0,r.y|0)))return r.act.type}return null};
  S.t=1440*2+600;S.rain=true;const rain=tryW(a),woodRain=tryW(b);
  S.rain=false;S.t=1440*2+18*60;endAct(a);endAct(b);const s1=tryW(a);for(let i=0;i<20;i++)updRes(a,.25);const s2=tryW(b);for(let i=0;i<80&&b.act.stage!=='do';i++)updRes(b,.25);
  const side=Math.abs((b.y|0)-(a.y|0))===0&&Math.abs((b.x|0)-(a.x|0))===1;
  /* 朝ののび */endAct(a);S.t=1440*3+6*60+5;a.act={type:'sleep',stage:'do',t:100,night:true,rate:.1,pt:0};ACT.sleep.end(a,a.act);endAct(a);decide(a);const st=a.act&&a.act.type;
  return {rain,woodRain,s1,s2,side,st}})()`);
assert.equal(o.rain,'rainjoy','雨の日、水のせいれいはよろこぶ');assert.notEqual(o.woodRain,'rainjoy','ほかのせいれいはしない');
assert.equal(o.s1,'sunset');assert.equal(o.s2,'sunset');assert.ok(o.side,'2人目はとなりにすわる');assert.equal(o.st,'stretch','朝はのび');
assert.deepEqual(errors,[]);console.log('weather ok',JSON.stringify(o));await browser.close()})();
