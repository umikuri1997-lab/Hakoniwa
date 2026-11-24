/* 草原のヌシ様の奥の脚（NSPR の dark）は、もとの絵の色を0.9倍にした絵になる（キャンバスの filter を使わない） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await page.waitForFunction(()=>sacredEval(`['L0','L3','L5'].every(k=>NSPR[k].dark)`),{},{timeout:20000});
  const r=JSON.parse(await run(`JSON.stringify(['L0','L3','L5'].map(k=>{const g=NSPR[k],a=document.createElement('canvas');a.width=g.w;a.height=g.h;const c=a.getContext('2d',{willReadFrequently:true});c.drawImage(g.img,0,0);const o=c.getImageData(0,0,g.w,g.h).data,d=g.dark.getContext('2d').getImageData(0,0,g.w,g.h).data;a.width=a.height=0;let mx=0,al=0,n=0;for(let i=0;i<o.length;i+=4){if(o[i+3]!==d[i+3])al++;if(o[i+3]===255){n++;for(let j=0;j<3;j++)mx=Math.max(mx,Math.abs(o[i+j]*.9-d[i+j]))}}return {k,mx,al,n}}))`));
  for(const x of r){assert.ok(x.n>0,x.k+' has opaque pixels');assert.equal(x.al,0,x.k+' keeps alpha');assert.ok(x.mx<=2,x.k+' is 0.9x color (diff '+x.mx+')')}
  console.log('Nushi back legs: dark image is the color x0.9, alpha kept');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
