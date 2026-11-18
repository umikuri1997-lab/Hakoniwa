/* まもりの光：画面のゆれと光は、光の槌が地面に当たるとき（GLFX）。音は余韻のある音（1.5秒より長い） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  const shk=()=>run(`document.querySelector('#cv').classList.contains('shk2')`);
  await run(`window.__t0=performance.now();lightSnd(CX,CY)`);
  await page.waitForTimeout(250);assert.equal(await shk(),false,'no shake before the light hits');
  await page.waitForFunction(()=>document.querySelector('#cv').classList.contains('shk2'),{},{timeout:3000,polling:10});
  const dt=Number(await run(`performance.now()-__t0`));
  assert.ok(dt>=600-20&&dt<600+250,'shake at the hit: '+dt);
  const len=Number(await run(`(async()=>{const r=await fetch(SAMPLES.glight[0]);const b=await new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,44100,44100).decodeAudioData(await r.arrayBuffer());return b.duration})()`));
  assert.ok(len>1.5,'long tail: '+len);
  console.log('Guard light: shake at '+Math.round(dt)+'ms, sound '+len.toFixed(2)+'s');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
