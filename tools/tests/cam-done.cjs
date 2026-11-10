/* おわりの処理つきのカメラ（霧が晴れる演出）は、さわっても・ほかの動きに上書きされても、最後まで進む（止まったままにならない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const st=async()=>JSON.parse(await run(`JSON.stringify({rev:FOGREVON,gift:GIFT_ACTIVE,idea:!!document.querySelector('.idea-reveal'),paused:paused()})`));
  const ok=()=>run(`(()=>{const b=document.querySelector('.idea-reveal button');if(b){b.disabled=false;b.click()}})()`);
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  /* 1. カメラが動いているあいだに画面をさわる */
  await run(`fogClear(1)`);await page.waitForFunction(()=>sacredEval('FOGREVON&&!!camAnim'),{},{timeout:8000});
  await page.waitForTimeout(300);await page.mouse.move(450,350);await page.mouse.down();await page.mouse.up();
  await page.waitForFunction(()=>!!document.querySelector('.idea-reveal'),{},{timeout:8000});
  await ok();await page.waitForTimeout(300);await page.mouse.down();await page.mouse.up();/* もどりのカメラ中にも、さわる */
  await page.waitForFunction(()=>sacredEval('!FOGREVON&&!GIFT_ACTIVE'),{},{timeout:8000});
  assert.equal((await st()).paused,false,'touch during the reveal camera must not freeze the game');
  console.log('Fog reveal: touching the screen during the camera moves does not freeze the game');
  /* 2. ほかのカメラの動きに上書きされる */
  await run(`fogClear(2)`);await page.waitForFunction(()=>sacredEval('FOGREVON&&!!camAnim'),{},{timeout:8000});
  await page.waitForTimeout(300);await run(`camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:CX*TS,ty:CY*TS,t:0,dur:.6}`);
  await page.waitForFunction(()=>!!document.querySelector('.idea-reveal'),{},{timeout:8000});
  await ok();await page.waitForTimeout(300);await run(`camAnim=null`);
  await page.waitForFunction(()=>sacredEval('!FOGREVON&&!GIFT_ACTIVE'),{},{timeout:8000});
  assert.equal((await st()).paused,false,'an overwritten reveal camera must still finish');
  console.log('Fog reveal: an overwritten camera still runs its ending');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
