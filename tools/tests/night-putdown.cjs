/* 夜、素材を持っていて、しまう所がない（箱がいっぱい）とき（spirit-act.js の nightPutDown）：
   ひとやすみ（idle）をはじめる→夜なのですぐやめる、を毎コマくり返さず、素材を地面において、ねる */
const boot=require('../sim/boot.cjs'),assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await boot();
const out=await run(`(()=>{LOGV=true;const r=S.res[0];S.t+=((5.1-hour()+24)%24)*60;
 r.act=null;r.energy=100;r.hunger=1000;r.cmat={wood:3};S.mat.wood=(S.mat.wood||0)+5;/* matCap()>0 で、箱には入らない */
 const n0=LOGB.length;for(let i=0;i<300;i++)stepWorld(1/30);
 const L=LOGB.slice(n0);return {cap:matCap(),idle:L.filter(s=>/フタバ#1 はじめる idle/.test(s)).length,act:r.act&&r.act.type,cmat:r.cmat,drop:(S.drops||[]).filter(d=>d.id==='mat:wood').reduce((a,d)=>a+d.n,0)}})()`);
console.log(out);
assert.ok(out.cap>0,'しまう所のない形');assert.equal(out.idle,0,'ひとやすみをくり返さない');assert.equal(out.act,'sleep','ねる');assert.equal(out.cmat,null,'持っていない');assert.equal(out.drop,3,'地面においた');
assert.deepEqual(errors,[]);console.log('Night, no box room: puts materials down and sleeps, no idle loop. Browser errors: none');
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
