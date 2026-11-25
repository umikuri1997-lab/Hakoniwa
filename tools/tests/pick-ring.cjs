/* こわすの長おし：指にかくれても見えるように、指のまわりに進みぐあいの輪（こわれるまでにうまる）と、こわしているマスのわくが出る */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
const P=JSON.parse(await run(`(()=>{if(sheet)closeSheet();document.querySelector('#dialog').hidden=true;S.t=1440+10*60;mode='remove';const r=S.res[0];
 for(let b=3;b<9;b++)for(let a=-5;a<5;a++){const x=(r.x|0)+a,y=(r.y|0)+b,j=y*W+x;if(!(pickFree(j)&&canPlace0('dig',x,y,true)))continue;
  for(let yy=0;yy<VH;yy+=3)for(let xx=0;xx<VW;xx+=3){const c=pickCell(xx,yy);if(c&&c.j===j&&xx>60&&yy>60&&xx<VW-60&&yy<VH-60){pickDown(xx,yy);return JSON.stringify({sx:xx,sy:yy,j})}}}
 return 'null'})()`));
assert.ok(P,'found a cell to dig');
const ring=async()=>JSON.parse(await run(`(()=>{const g=cv.getContext('2d'),dpr=cv.width/cv.getBoundingClientRect().width;let n=0,t=0;
 for(let a=0;a<360;a+=3){const rad=a*Math.PI/180;for(let rr=41;rr<=47;rr++){const d=g.getImageData((${P.sx}+Math.cos(rad)*rr)*dpr,(${P.sy}+Math.sin(rad)*rr)*dpr,1,1).data;if(d[0]>235&&d[1]>225&&d[2]>170&&d[2]<215){n++;break}}t++}
 return JSON.stringify({n,t,dig:!!(PICKH&&PICKH.dig)})})()`));
await page.waitForTimeout(900);const a=await ring();
await page.waitForTimeout(1200);const b=await ring();
console.log('early',a,'later',b);
assert.ok(a.dig&&b.dig,'still digging');assert.ok(a.n>3,'ring shows');assert.ok(b.n>a.n+5,'ring fills up as it breaks');
await run(`pickCancel()`);assert.deepEqual(errors,[]);console.log('Ring around the finger fills while breaking');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
