const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
/* チップのページを読みこみ中に作ったアイコンは、とちゅうの絵（コードの仮の絵・影だけ）にしない。かりの空の絵（ICWAIT）にして、ページがとどいたら、ほんとうの絵にする */
(async()=>{const {browser,page,run,errors}=await boot();
  const a=JSON.parse(await run(`(()=>{const ids=CRAFT_TABS.flatMap(([,a])=>a).filter(id=>BL[id]),o={};for(const id of ids){delete iconCache[id];o[id]=iconURL(id)}window.__A=o;return JSON.stringify({n:ids.length,wait:ids.filter(i=>o[i].startsWith('data:image/svg')).length})})()`));
  assert.ok(a.n>=200,'craft ids '+a.n);assert.ok(a.wait>0,'some icons wait for pages');
  await page.waitForFunction(()=>sacredEval('chaReady()'),{},{timeout:60000});
  const b=JSON.parse(await run(`(()=>{const o=window.__A,bad=[];for(const id in o){if(o[id].startsWith('data:image/svg'))continue;delete iconCache[id];if(iconURL(id)!==o[id])bad.push(id)}return JSON.stringify({bad,wait:Object.keys(ICWAIT).length})})()`));
  assert.deepEqual(b.bad,[],'icons made while loading are the real ones');assert.equal(b.wait,0,'placeholders are replaced');
  assert.deepEqual(errors,[],'no errors');console.log('icon-pend ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
