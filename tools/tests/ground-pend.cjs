/* 地面の区画を、読みこみ中のアトラスのページの絵（道・畑など）で作ったときは、ページがとどいたら作りなおす。
   作りなおさないと、その区画だけ仮の絵のままになり、となりの区画とのさかいに、たての線が出る */
const assert=require('node:assert/strict');
const CHK=`(()=>{const bad=[];for(const q of IG.c.values()){if(!q.f)continue;const ow=q.f.width,oh=q.f.height,ox=q.ox,oy=q.oy,old=q.f.getContext('2d').getImageData(0,0,ow,oh).data;q.f=q.l=q.w=q.k=null;
  igBuild(q);const nw=q.f.getContext('2d').getImageData(0,0,q.f.width,q.f.height).data;let d=0;if(q.f.width!==ow||q.f.height!==oh||q.ox!==ox||q.oy!==oy)d=-1;else for(let i=0;i<nw.length;i++)if(nw[i]!==old[i])d++;if(d)bad.push([q.cx,q.cy,d])}return JSON.stringify(bad)})()`;
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;`);
  const settle=async()=>{const r0=+await run('RFN');await page.waitForFunction(r=>sacredEval('RFN>'+(r+30)+'&&chaReady()&&![...IG.c.values()].some(q=>q.st)'),r0,{timeout:120000})};
  await settle();
  assert.equal(await run(CHK),'[]','blocks built at the start must match a fresh build once the atlas pages arrive');
  /* はじめて置く道（ページをまだ読んでいない）を、区画のさかいをまたいで置く */
  await run(`(()=>{for(let k=-6;k<=6;k++)for(const[x,y]of[[CX+k,CY+2],[CX+2,CY+k]]){const i=y*W+x;if(S.ground[i]===1||S.obj[i])continue;S.floor[i]=k&1?'stone':'brick'}recount()})()`);
  await settle();
  assert.equal(await run(CHK),'[]','blocks with a newly placed road must be rebuilt when its atlas page arrives');
  console.log('Ground blocks: rebuilt after the atlas pages they use arrive (no seam between blocks)');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
