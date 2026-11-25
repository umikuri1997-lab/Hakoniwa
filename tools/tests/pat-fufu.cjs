/* せいれいをなでる（patJoy）：なでているあいだは音なし（こすれる音 pat を鳴らさない）。2.4秒あと、ぴょんとはねるときに、会話の声から作った「ふふっ」（joyFufu）だけ。よろこぶ音 good は鳴らさない */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const p=await browser.newPage({viewport:{width:900,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.rain=false;S.t=1440*2+600;recount();return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(async()=>{audioInit();if(typeof loadSamples==='function'&&!SBUF.voice)loadSamples();for(let i=0;i<100&&!(SBUF.voice||[])[0];i++)await new Promise(r=>setTimeout(r,100));if(AC.state!=='running')await AC.resume();
  cam.z=2;centerOn(CX*TS,CY*TS);const r=S.res[0];r.x=CX+.5;r.y=CY+.5;const log=[];const a0=sfxAt;sfxAt=(k,...q)=>{log.push(k);return a0(k,...q)};const f0=joyFufu;let fu=0;joyFufu=x=>{fu++;return f0(x)};
  for(const k in lastSfx)delete lastSfx[k];patJoy(r);const now=log.slice();clockStep(2500);const out={now,after:log.slice(),fu,rang:lastSfx.fufu!=null,voice:!!(SBUF.voice||[])[0]};sfxAt=a0;joyFufu=f0;return out})()`);
console.log(JSON.stringify(o));
assert.ok(o.voice,'会話の声の録音が読みこめた');
assert.deepEqual(o.now,[],'なでているあいだは音なし');
assert.ok(!o.after.includes('pat')&&!o.after.includes('good'),'pat・good は鳴らさない '+o.after);
assert.equal(o.fu,1,'はねるときに「ふふっ」を1回');assert.ok(o.rang,'「ふふっ」が鳴った');
assert.deepEqual(errors,[]);console.log('pat-fufu ok');await browser.close()})();
