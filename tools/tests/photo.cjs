/* 村の名前・村の写真：名前はフォントにある字だけで8字まで。日記の絵は、その日いちばん大事な物（できた家具・スポット・夕方は書く子のまわり）に近よって写し、IndexedDB にしまう（30まい、古いのからけす）、思い出帳で見る・けす */
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
  /* 日記の絵：家具ができたら、その所に近よって写す（カメラはうごかさない）。夜は写さない。もっと大事な物（スポット）なら写しなおし、前の絵はけす */
  await run(`closeSheet();USERPAUSE=true;S.dy=null;PHQ=null;cam.z=2.2;centerOn((CX-20)*TS,(CY+18)*TS)`);
  const cam0=JSON.parse(await run(`JSON.stringify(cam)`));
  const F=JSON.parse(await run(`JSON.stringify(Object.assign(phFrame(phBoxJ('bench',CY*W+CX+3)),{m:PHZMIN,hz:homeZ()}))`));assert.ok(F.z>=F.m&&F.cw>0,'photo frame');assert.ok(F.z>1,'close to the thing: '+F.z);
  await run(`S.t=Math.floor(S.t/1440)*1440+22*60;S.dy=null;PHQ=null;admireNote('bench',CY*W+CX+3)`);await page.waitForTimeout(2600);
  const n0=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.length));assert.equal(n0,0,'no photo at night');
  const before=JSON.parse(await run(`(()=>{S.t=Math.floor(S.t/1440)*1440+10*60;S.dy=null;PHQ=null;admireNote('bench',CY*W+CX+3);return JSON.stringify({d:dayNo()})})()`));
  await page.waitForFunction(()=>sacredEval("!!(S.dy&&S.dy.ph!=null&&S.dy.phK==='built')"),{},{timeout:8000});
  await page.waitForTimeout(400);
  const n=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.map(p=>({d:p.d,h:p.h,vn:p.vn,size:p.b.size,type:p.b.type}))));
  assert.equal(n.length,1,'one picture');assert.equal(n[0].vn,'こもれびABC1');assert.ok(n[0].size>2000,'photo has content');assert.equal(n[0].d,before.d);
  const dy=JSON.parse(await run(`JSON.stringify({k:S.dy.phK,n:S.dy.phN,bn:BL.bench.name})`));assert.equal(dy.n,dy.bn,'the diary knows what is in the picture');
  const cam1=JSON.parse(await run(`JSON.stringify(cam)`));assert.deepEqual(cam1,cam0,'the camera did not move');
  if(process.env.SHOT_DIR){const u=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(L[0].b)})));require('fs').writeFileSync(process.env.SHOT_DIR+'/built.jpg',Buffer.from(u.split(',')[1],'base64'))}
  await run(`phWant('see',phBoxOf(CX,CY,1),'','sunset')`);await page.waitForTimeout(2400);
  const k1=await run(`S.dy.phK`);assert.equal(k1,'built','a smaller thing does not replace it');
  await run(`phWant('spot',phBoxOf(CX+3,CY,1),'しょくたく')`);
  await page.waitForFunction(()=>sacredEval("S.dy.phK==='spot'"),{},{timeout:8000});await page.waitForTimeout(400);
  const n1=await page.evaluate(()=>sacredEval('phList(WD)').then(L=>L.length));assert.equal(n1,1,'the old picture is deleted');
  console.log('Diary picture: taken close to the new thing, only in the day, the most important one stays');
  /* 夕方まで何もなかった日は、書く子のまわり */
  await run(`S.dy=null;PHQ=null;S.t=Math.floor(S.t/1440)*1440+17*60+30`);
  await page.waitForFunction(()=>sacredEval("!!(S.dy&&S.dy.ph!=null&&S.dy.phK==='day')"),{},{timeout:8000});
  console.log('Diary picture: on a quiet day, where Futaba is in the evening');
  /* いっぱいのときは、いちばん古い写真をけして、しまう */
  const full=await page.evaluate(()=>sacredEval(`(async()=>{const L=await phList(WD),b=L[0].b;for(let i=L.length;i<PHN;i++)await phAdd({w:WD,d:-i,h:12,vn:'',at:i,b});const id0=(await phList(WD))[0].id;S.dy=null;PHQ=null;return id0})()`));
  await page.waitForFunction(id0=>sacredEval('phList(WD)').then(L=>window.__pf=L.length===PHN&&!L.some(p=>p.id===id0)&&L.some(p=>p.d===dayNo()))&&window.__pf,full,{timeout:8000});
  console.log('Village photo: keeps 30 photos, the oldest goes first');
  await page.evaluate(()=>sacredEval(`phList(WD).then(async L=>{for(const p of L.slice(0,-1))await phDel(p.id)})`));
  /* 思い出帳には、写すボタンはない */
  {const t=await run(`(()=>{openSheet('menu','record');return [...document.querySelectorAll('#sheetBody button')].some(b=>/写す/.test(b.textContent))})()`);assert.equal(t,false,'no take-photo button')}
  await run(`MEMPG=0;openSheet('menu','record')`);/* 思い出帳は本：村の写真は、その日の日記のページに、テープではる */await page.waitForFunction(()=>sacredEval("!!document.querySelector('#sheetBody .dyph img')"));
  if(process.env.SHOT_DIR)await page.screenshot({path:process.env.SHOT_DIR+'/record.png'});
  await run(`document.querySelector('#sheetBody .dyph').click()`);await page.waitForSelector('.ph-reveal img');
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
