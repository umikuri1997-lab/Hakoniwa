/* はじめてスポットができたとき：カメラがよって、かこみ・物が光る・光の柱と紙ふぶきを見せてから、カードを出し、OK のあとカメラがもどって、ゲームがうごく */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();const shot=process.env.SHOT;
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const z0=await run('cam.z');
  await run(`(()=>{const a=(CY+6)*W+CX+6;for(const q of[a,a+1,a+2,a+W,a+W+1,a+W+2])if(S.obj[q])delete S.obj[q];S.obj[a]='crate';S.obj[a+2]='asabukuro';recount()})()`);
  assert(await run(`SPOT_POPS.some(e=>e.sp&&e.sp.k==='monooki')`),'spot popup queued');await run(`for(let i=SPOT_POPS.length-1;i>=0;i--)if(!SPOT_POPS[i].sp||SPOT_POPS[i].sp.k!=='monooki')SPOT_POPS.splice(i,1)`);
  await page.waitForFunction(()=>sacredEval('!!SPOTSCN'),{},{timeout:8000});
  assert(!(await run(`!!document.querySelector('.idea-reveal')`)),'card waits for the map scene');
  assert(await run('paused()'),'village time stops during the scene');
  await page.waitForTimeout(1200);console.log('zoom',await run('cam.z'));await page.waitForTimeout(600);if(shot)await page.screenshot({path:shot+'-1.png'});
  assert(await run(`SCN.some(e=>e.k==='spotline')`),'outline drawn');
  await page.waitForTimeout(900);if(shot)await page.screenshot({path:shot+'-2.png'});
  assert(await run(`SCN.some(e=>e.k==='spotconf')`),'confetti');
  await page.waitForFunction(()=>sacredEval("!!document.querySelector('.idea-reveal')"),{},{timeout:8000});await page.waitForTimeout(800);if(shot)await page.screenshot({path:shot+'-3.png'});
  await run(`(()=>{const b=document.querySelector('.idea-reveal button');b.disabled=false;b.click()})()`);
  assert(await run('GIFT_ACTIVE'),'still paused while the camera returns');
  await page.waitForFunction(()=>sacredEval('!SPOTSCN&&!GIFT_ACTIVE'),{},{timeout:8000});
  assert.equal(await run('paused()'),false,'game runs again');assert(Math.abs(await run('cam.z')-z0)<.01,'camera returned');
  /* 場面のとちゅうで村を切りかえても、止まったままにならない */
  await run(`(()=>{const a=(CY+9)*W+CX-8;for(const q of[a,a+1,a+2])if(S.obj[q])delete S.obj[q];S.obj[a]='sandbox';S.obj[a+2]='tub';recount()})()`);
  await page.waitForFunction(()=>sacredEval('!!SPOTSCN'),{},{timeout:8000});await page.waitForTimeout(1500);
  await run('resetVillageTransient()');await run(`SPOT_POPS.length=0`);assert.equal(await run('GIFT_ACTIVE||!!SPOTSCN'),false,'reset clears the scene');
  await run(`(()=>{for(;;){const b=document.querySelector('.idea-reveal button');if(!b)break;b.disabled=false;b.click()}})()`);
  console.log('Spot scene: map scene before the card, camera returns, reset is safe');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
