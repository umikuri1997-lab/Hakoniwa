/* 守りの光をえらんでいるあいだは、みる・おく・こわすはしない。みる・おく・こわすをおすと、やめる */
const {chromium}=require('playwright'),assert=require('node:assert/strict');

(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);
const run=s=>page.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;NOSAVE=true;S.introSeen=true;S.flags.minaCame=true;S.enemyOn=false;S.t=720;S.pt=50;S.res=[mkRes(S,POKO,'wood',CX+.5,CY+.5)];for(const id of ['#title','#maps','#pro','#dialog'])document.querySelector(id).hidden=true;recount();showUI(true);})()`);
await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const st=async()=>JSON.parse(await run(`JSON.stringify({mode,LIGHTARM,on:[...document.querySelectorAll('#dock [data-mode].on')].map(b=>b.dataset.mode),pal:!$('#palette').hidden})`));
await run(`setMode('build')`);
await page.click('#guardStatus');assert.deepEqual(await st(),{mode:'look',LIGHTARM:true,on:[],pal:false},'守りの光をえらぶと、おくはやめ、下のバーは光らない');
const b0=await run(`JSON.stringify([S.obj.filter(Boolean).length,sheet])`);await run(`onTap(VW/2,VH/2)`);assert.equal(await run(`JSON.stringify([S.obj.filter(Boolean).length,sheet])`),b0,'光をあてられない所のタップでは、なにもしない');assert.equal((await st()).LIGHTARM,true);
await page.click('#dock [data-mode="remove"]');assert.deepEqual(await st(),{mode:'remove',LIGHTARM:false,on:['remove'],pal:false},'こわすをおすと、守りの光はやめる');
await page.click('#guardStatus');await page.click('#dock [data-mode="build"]');assert.equal((await st()).LIGHTARM,false,'おくをおすと、守りの光はやめる');
await page.click('#guardStatus');await page.click('#dock [data-mode="look"]');assert.deepEqual(await st(),{mode:'look',LIGHTARM:false,on:['look'],pal:false},'みるをおすと、守りの光はやめる');
assert.deepEqual(errors,[]);console.log('guard light mode: exclusive with look/build/remove, cancelled by dock buttons');await browser.close()})();
