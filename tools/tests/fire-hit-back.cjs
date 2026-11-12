/* 火のせいれいは、自分やほかの火のせいれいを、とどかない所からたたくコワイノ（オオカゲなど）に近よって攻撃する */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:1});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=true;USERPAUSE=true;S.t=1440*2+23.5*60;
    const h=S.res[0];h.nap=false;h.hunger=hMax(h);h.energy=100;S.res=[h];endAct(h);h.act=null;
    const e={type:'boss',x:h.x+2.0,y:h.y,hp:EN.boss.hp,spawned:true,path:[],tg:h.id};S.enemies=[e];
    const g0=foeGuard(e,h),hp0=e.hp;let walked=0;
    for(let i=0;i<400;i++){S.t+=.05;updRes(h,.05);if(h.act&&h.act.type==='patrol'&&h.act.hunt!=null)walked=1}
    return JSON.stringify({guard:g0,walked,hit:hp0-e.hp})})()`));
  console.log(r);
  assert.equal(r.guard,true,'enemy hitting the fire spirit is a target');assert.equal(r.walked,1,'moves toward it');assert(r.hit>0,'attacks it');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
