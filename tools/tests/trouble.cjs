/* こまりごと：朝に1人・1つ（家がきゅうくつ・家のまわりが暗い・好きな家具がない・食料箱が遠い）。せいれいの画面に出る。なおったら、お礼とたのしさ+15 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.t=1440*2+600;
for(let y=CY-14;y<CY+14;y++)for(let x=CX-14;x<CX+14;x++){const j=y*W+x;S.obj[j]='';S.ground[j]=0;S.floor[j]='';S.hi[j]=0;delete S.ref[j];delete S.dyn[j]}S.res=[];recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{const hx=CX-3,hy=CY-3;for(let y=hy;y<hy+4;y++)for(let x=hx;x<hx+4;x++){const j=y*W+x;S.obj[j]=(y===hy||y===hy+3||x===hx||x===hx+3)?'hwall':''}S.obj[(hy+3)*W+hx+1]='door';const bj=(hy+1)*W+hx+1;S.obj[bj]='bed';
  const r=mkRes(S,'a','wood',CX+.5,CY+3.5);S.res=[r];r.hunger=hMax(r);r.energy=100;r.fun=50;S.bedOwn={[bj]:r.id};recount();findHouses();
  const darkOK=TROUBLE.dark.ok(r);S.trouble={id:r.id,k:'dark',d:dayNo()};const txt=troubleText(r);
  /* あかりを置くと、なおる */const lj=(hy+4)*W+hx+4;S.obj[lj]='lamp';recount();const f0=r.fun;for(let i=0;i<6;i++)troubleTick();const solved=S.trouble===null,gain=r.fun-f0;
  /* 朝にえらぶ（1つだけ） */S.trouble=null;troubleMorning();const picked=S.trouble&&S.trouble.k;
  return {darkOK,txt,solved,gain,picked}})()`);
assert.ok(o.darkOK,'家のまわりにあかりがないと、こまりごと');assert.equal(o.txt,'夜、家のまわりが暗くてこわい');assert.ok(o.solved,'あかりを置くと、なおる');assert.ok(o.gain>=14,'たのしさ+15 '+o.gain);
assert.deepEqual(errors,[]);console.log('trouble ok',JSON.stringify(o));await browser.close()})();
