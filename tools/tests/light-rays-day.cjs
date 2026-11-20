/* 光の帯（light-rays.js）は、昼（8時〜15時半）には出さない。朝・夕方・夜（月）には出る */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
const run=s=>page.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.t=720;S.rain=0;for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);})()`);
await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const at=JSON.parse(await run(`JSON.stringify((()=>{const o={};S.hold=0;S.rain=0;for(let m=0;m<1440;m+=15){S.t=1440*3+m;const L=rayNow();o[m/60]=L?L.kind:''}S.t=720;return o})())`));
for(const [h,k] of Object.entries(at)){const x=+h;if(x>=8&&x<15.5)assert.equal(k,'',`${h}時に光の帯が出ている`)}
assert.equal(at['7'],'morn');assert.equal(at['17'],'eve');
/* 月の帯は、上の欄の月（moonNow）と同じ日の月：新月の夜は、23時も0時すぎも出ない（闇のステージは空の時刻がいつも0時なので、時計の時刻で日をきめる） */
const YAMIW=await run(`YAMI`);for(const w of [0,YAMIW]){const m=JSON.parse(await run(`JSON.stringify((()=>{const W0=WD;WD=${w};const o=[];for(const [d,h] of [[4,23],[5,.17],[8,23]]){S.t=(d-1)*1440+h*60;const L=rayNow();o.push([moonNow(),L?L.a:0])}WD=W0;S.t=720;return o})())`));
  assert.equal(m[0][0],'new');assert.equal(m[0][1],0,`WD${w}：4日23時の新月に月の帯が出ている`);assert.equal(m[1][1],0);assert.equal(m[2][0],'full');assert.ok(m[2][1]>.6,`WD${w}：8日23時の満月の帯がうすい`)}
await page.waitForTimeout(500);assert.deepEqual(errors,[]);console.log('light rays: none from 8:00 to 15:30');await browser.close()})();
