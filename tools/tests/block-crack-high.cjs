/* こわすの長おしのひび：平らな地面でも、つんだブロックの上でも、ひびがブロックの上の面に見える（高いマスのブロックの下にかくれない） */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
await run(`(()=>{if(sheet)closeSheet();document.querySelector('#dialog').hidden=true;S.t=1440+10*60;mode='remove';
 const red=document.createElement('canvas');red.width=red.height=64;const g=red.getContext('2d');g.fillStyle='#f0f';g.fillRect(0,0,64,64);red.ok=1;window.crackImg=()=>red;return 1})()`);/* ひびの絵を、めだつ色の四角にかえて、画面にのこるかはかる */
const one=async(h,dx)=>{const P=JSON.parse(await run(`(()=>{const r=S.res[0];let x,y,j;outer:for(let b=3;b<9;b++)for(let a=-5;a<5;a++){x=(r.x|0)+a+${dx};y=(r.y|0)+b;j=y*W+x;if(pickFree(j)&&canPlace0('dig',x,y,true)&&!treeNextHigh(j,${h}))break outer}
 for(let i=0;i<${h};i++)terraUp(j,'blk_stone');recount();dirty=true;window._j=j;
 for(let sy=0;sy<VH;sy+=3)for(let sx=0;sx<VW;sx+=3){const c=pickCell(sx,sy);if(c&&c.j===j){pickDown(sx,sy);return JSON.stringify({sx,sy,h:hiAt(j)})}}return 'null'})()`));
 await page.waitForTimeout(1500);
 const n=await run(`(()=>{const g=cv.getContext('2d'),dpr=cv.width/cv.getBoundingClientRect().width;let n=0;for(let dy=-40;dy<=40;dy+=2)for(let dx=-40;dx<=40;dx+=2){const d=g.getImageData((${P.sx}+dx)*dpr,(${P.sy}+dy)*dpr,1,1).data;if(d[0]>180&&d[2]>180&&d[1]<80)n++}const dig=!!(PICKH&&PICKH.dig);pickCancel();return JSON.stringify({n,dig})})()`).then(JSON.parse);
 return {h:P.h,...n}};
const flat=await one(0,0);console.log('flat',flat);assert.ok(flat.dig);assert.ok(flat.n>10,'crack shows on flat ground');
const high=await one(2,6);console.log('high',high);assert.equal(high.h,2);assert.ok(high.dig);assert.ok(high.n>10,'crack shows on a stacked block');
assert.deepEqual(errors,[]);console.log('Block crack shows on flat ground and on stacked blocks');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
