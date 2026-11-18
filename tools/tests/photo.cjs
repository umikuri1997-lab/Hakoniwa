/* 村の名前・村の写真：名前はフォントにある字だけで8字まで。写真はいまの画面を IndexedDB にしまい、思い出帳で見る・けす */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:390,height:780}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();`);
  /* 村の名前：村のようすからつける */
  await run(`openSheet('vill')`);
  const hasRow=await run(`[...document.querySelectorAll('#sheetBody .vlSec h4')].some(h=>h.textContent==='村の名前')`);assert.ok(hasRow,'village sheet shows the name row');
  await run(`[...document.querySelectorAll('#sheetBody .vlSec')].find(s=>s.querySelector('h4').textContent==='村の名前').querySelector('button').click()`);
  await page.waitForSelector('.vn-reveal input');await page.fill('.vn-reveal input','こもれび😀漢字ABC12345');
  const typed=await run(`document.querySelector('.vn-reveal input').value`);assert.equal(typed,'こもれびABC1','only font characters, 8 at most');
  await page.screenshot({path:process.env.SHOT_DIR?process.env.SHOT_DIR+'/vname.png':'/dev/null'}).catch(()=>{});
  await run(`[...document.querySelectorAll('.vn-reveal button')].find(b=>b.textContent==='きめる').click()`);
  const nm=JSON.parse(await run(`JSON.stringify({v:S.vname,row:[...document.querySelectorAll('#sheetBody .vlSec')].find(s=>s.querySelector('h4').textContent==='村の名前').textContent})`));
  assert.equal(nm.v,'こもれびABC1');assert.ok(nm.row.includes('こもれびABC1村'),'name shown after renaming');
  console.log('Village name: set from the village sheet, limited to font characters');
  /* 写真：思い出帳から写す */
  await run(`closeSheet();openSheet('menu','record')`);await page.waitForTimeout(300);
  await run(`[...document.querySelectorAll('#sheetBody button')].find(b=>b.textContent==='いまの村を写す').click()`);
  await page.waitForFunction(()=>sacredEval('phList(WD).then(L=>window.__ph=L.length)')&&window.__ph>=1,{},{timeout:8000}).catch(()=>{});
  await page.waitForTimeout(1500);
  const n=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.map(p=>({d:p.d,vn:p.vn,size:p.b.size,type:p.b.type}))));
  assert.equal(n.length,1,'one photo stored');assert.equal(n[0].vn,'こもれびABC1');assert.ok(n[0].size>2000,'photo has content');
  await run(`MEMPG=0;openSheet('menu','record');[...document.querySelectorAll('#sheetBody .mtocr')].find(b=>/村の写真/.test(b.textContent)).click()`);/* 思い出帳は本：目次から「村の写真」のページへめくる */await page.waitForSelector('#sheetBody .mpg:not([hidden]):not(.mflip) .phT img');
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/record.png'});
  await run(`document.querySelector('#sheetBody .phT').click()`);await page.waitForSelector('.ph-reveal img');
  const cap=await run(`document.querySelector('.ph-reveal p').textContent`);assert.ok(cap.startsWith('こもれびABC1村・'),cap);
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/view.png'});
  await run(`(()=>{const b=[...document.querySelectorAll('.ph-reveal button')].find(b=>b.textContent==='けす');b._held=1;b.click()})()`);await page.waitForTimeout(500);
  const n2=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.length));assert.equal(n2,0,'photo deleted');
  console.log('Village photo: taken, shown in the memory book, deleted');
  /* マップえらびに村の名前 */
  const mp=await run(`(()=>{save();showMaps();return document.querySelector('#mList').textContent})()`);assert.ok(mp.includes('こもれびABC1村'),'map card shows the village name');
  console.log('Village name: shown on the map select');
  assert.deepEqual(errors,[]);await browser.close();console.log('Photo: ok');
})().catch(e=>{console.error(e);process.exit(1)});
