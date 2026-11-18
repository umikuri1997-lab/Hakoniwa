/* 村の名前・村の写真：名前はフォントにある字だけで8字まで。写真は昼12時に自動で村を写して IndexedDB にしまい（30まい、古いのからけす）、思い出帳で見る・けす */
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
  /* 写真：昼12時に、自動で写す（カメラはうごかさない。写す所は村） */
  await run(`closeSheet();USERPAUSE=true;S.phD=null;S.dy=null;cam.z=2.2;centerOn((CX-20)*TS,(CY+18)*TS)`);
  const cam0=JSON.parse(await run(`JSON.stringify(cam)`));
  const F=JSON.parse(await run(`JSON.stringify(Object.assign(phFrame(),{m:PHZMIN}))`));assert.ok(F.z>=F.m&&F.cw>0,'photo frame');
  const before=JSON.parse(await run(`(()=>{S.t=Math.floor(S.t/1440)*1440+11*60+59;return JSON.stringify({d:dayNo(),h:hour()})})()`));
  await page.waitForTimeout(400);
  const n0=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.length));assert.equal(n0,0,'no photo before noon');
  await run(`S.t=Math.floor(S.t/1440)*1440+12*60+1`);
  await page.waitForFunction(()=>sacredEval('!!(S.dy&&S.dy.ph)'),{},{timeout:8000});
  const n=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.map(p=>({d:p.d,h:p.h,vn:p.vn,size:p.b.size,type:p.b.type}))));
  assert.equal(n.length,1,'one photo at noon');assert.equal(n[0].vn,'こもれびABC1');assert.ok(n[0].size>2000,'photo has content');assert.equal(n[0].d,before.d);assert.ok(n[0].h>=12&&n[0].h<13,'taken at noon');
  const cam1=JSON.parse(await run(`JSON.stringify(cam)`));assert.deepEqual(cam1,cam0,'the camera did not move');
  await page.waitForTimeout(600);const n1=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.length));assert.equal(n1,1,'only once a day');
  if(process.env.SHOT_DIR){const u=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(L[0].b)})));require('fs').writeFileSync(process.env.SHOT_DIR+'/noon.jpg',Buffer.from(u.split(',')[1],'base64'))}
  console.log('Village photo: taken by itself at noon, without moving the camera');
  /* いっぱいのときは、いちばん古い写真をけして、しまう */
  const full=await page.evaluate(()=>sacredEval(`(async()=>{const L=await phList(WD),b=L[0].b;for(let i=L.length;i<PHN;i++)await phAdd({w:WD,d:-i,h:12,vn:'',at:i,b});const id0=(await phList(WD))[0].id;S.phD=null;return id0})()`));
  await page.waitForFunction(id0=>sacredEval('phList(WD)').then(L=>window.__pf=L.length===PHN&&!L.some(p=>p.id===id0)&&L.some(p=>p.d===dayNo()))&&window.__pf,full,{timeout:8000});
  console.log('Village photo: keeps 30 photos, the oldest goes first');
  await page.evaluate(()=>sacredEval(`phList(WD).then(async L=>{for(const p of L.slice(0,-1))await phDel(p.id)})`));
  /* 思い出帳には、写すボタンはない */
  {const t=await run(`(()=>{openSheet('menu','record');return [...document.querySelectorAll('#sheetBody button')].some(b=>/写す/.test(b.textContent))})()`);assert.equal(t,false,'no take-photo button')}
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
