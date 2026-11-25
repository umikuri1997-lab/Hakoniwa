const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
/* 持ち物のアイコンは、ゲームの手があいているときに先に作っておく（iconWarm）。開いたときに、かりの空の絵（ICWAIT）を出さない */
(async()=>{const {browser,page,run,errors}=await boot();
  await run(`(()=>{S.feat.inv=1;for(const id of FURN.slice(0,30))giveItem(id,2,1);for(const id of PLANTS.slice(0,8))giveItem(id,2,1);for(const k in INVMOBJ)S.mat[k]=5})()`);
  await page.waitForFunction(()=>sacredEval(`iconWarmIds().every(id=>iconCache[id])`),{},{timeout:30000});
  const r=JSON.parse(await run(`(()=>{const n=iconWarmIds().length;openSheet('inv');const imgs=[...document.querySelectorAll('#sheetBody img')].map(i=>i.getAttribute('src')||'');closeSheet();return JSON.stringify({n,wait:Object.keys(ICWAIT).length,svg:imgs.filter(s=>s.startsWith('data:image/svg')).length})})()`));
  assert.ok(r.n>=30,'owned icons '+r.n);assert.equal(r.wait,0,'no placeholder icons');assert.equal(r.svg,0,'no empty images');
  assert.deepEqual(errors,[],'no errors');console.log('inv-icon-warm ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
