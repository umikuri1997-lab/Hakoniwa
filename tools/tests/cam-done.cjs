/* おわりの処理つきのカメラ（演出のカメラ）は、さわっても・ほかの動きに上書きされても、最後まで進む（止まったままにならない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const st=async()=>JSON.parse(await run(`JSON.stringify({gift:GIFT_ACTIVE,fin:!!window.__camFin,paused:paused()})`));
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const go=`(()=>{window.__camFin=false;GIFT_ACTIVE=true;camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:(CX+20)*TS,ty:(CY+20)*TS,t:0,dur:1.6,done:()=>{window.__camFin=true;GIFT_ACTIVE=false}}})()`;
  /* 1. カメラが動いているあいだに画面をさわる */
  await run(go);await page.waitForTimeout(300);await page.mouse.move(450,350);await page.mouse.down();await page.mouse.up();
  await page.waitForFunction(()=>sacredEval('!!window.__camFin&&!GIFT_ACTIVE'),{},{timeout:8000});
  assert.equal((await st()).paused,false,'touch during the camera move must not freeze the game');
  console.log('Camera with an ending: touching the screen does not stop it');
  /* 2. ほかのカメラの動きに上書きされる */
  await run(go);await page.waitForTimeout(300);await run(`camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:CX*TS,ty:CY*TS,t:0,dur:.6}`);
  await page.waitForFunction(()=>sacredEval('!!window.__camFin&&!GIFT_ACTIVE'),{},{timeout:8000});
  assert.equal((await st()).paused,false,'an overwritten camera must still finish');
  console.log('Camera with an ending: an overwritten camera still runs its ending');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
