/* にじみは設定のボタンでだけ入り・切りする（fps などで自動ではかえない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;`);
  assert.equal(await run(`typeof HDQ`),'undefined','the automatic quality step must be gone');
  assert.equal(await run(`HDGLOW`),true,'glow starts on');
  await run(`openSheet('menu','settings')`);await page.waitForTimeout(300);
  const btn=()=>run(`[...document.querySelectorAll('.btn')].map(b=>b.textContent).find(t=>t.startsWith('にじみ'))||''`);
  assert.equal(await btn(),'にじみ：オン');
  await run(`[...document.querySelectorAll('.btn')].find(b=>b.textContent.startsWith('にじみ')).click()`);await page.waitForTimeout(200);
  assert.equal(await btn(),'にじみ：オフ');assert.equal(await run(`HDGLOW`),false);
  assert.equal(await run(`KV.getItem('hakoniwa-hdglow')`),'0','the choice is remembered');
  await page.waitForTimeout(1500);/* 切りのまま何コマか描く */
  await run(`setHdGlow(true)`);await page.waitForTimeout(1500);
  console.log('Glow: the settings button turns it on and off, and nothing changes it on its own');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
