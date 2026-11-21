/* はじめの30分：ベッドの目標の手順・夢の場面の前の待ちはタップでとばせる・場面転換のフェードの長さ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  const st=JSON.parse(await run(`(()=>{const L=[];const loom=S.obj.indexOf('loom');if(loom>=0)S.obj[loom]='';L.push(bedStep());const j=(CY+8)*W+CX+8;S.obj[j]='loom';L.push(bedStep());S.mat.nuno=1;L.push(bedStep());S.mat.nuno=0;S.inv.bed=1;L.push(bedStep());S.inv.bed=0;S.obj[j]='';return JSON.stringify(L)})()`));
  assert.ok(/^手順 1\/4/.test(st[0]),st[0]);assert.ok(/^手順 2\/4/.test(st[1]),st[1]);assert.ok(/^手順 3\/4 依頼ボード/.test(st[2]),st[2]);assert.ok(/^手順 4\/4/.test(st[3]),st[3]);
  assert.ok(st.every(t=>!/[（）]/.test(t)),'no parenthetical');
  console.log('Bed goal shows the current step:',st.join(' / '));
  const tp=await run(`new Promise(ok=>{const t0=performance.now();tapOr(5000,()=>ok(performance.now()-t0));setTimeout(()=>dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})),50)})`);
  assert.ok(tp<1000,'tap skips the wait ('+tp+')');
  const tw=await run(`new Promise(ok=>{const t0=performance.now();tapOr(120,()=>ok(performance.now()-t0))})`);
  assert.ok(tw>=100,'without a tap it waits');
  assert.equal(await run(`SHIFTMS`),400);
  console.log('Dream wait: tap skips; scene fade 400 ms');
  if(errors.length)console.log(JSON.stringify(errors).slice(0,800));assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
