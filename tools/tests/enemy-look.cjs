/* 「みる」でコワイノをタップすると、名前と体力を出す（何も起きないタップにしない）。守りの光はあてない */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  const r=JSON.parse(await run(`(()=>{setMode('look');LIGHTARM=false;let lit=0;const g0=guardLight;guardLight=()=>{lit++};const x=CX+4,y=CY+6;const e={id:S.nid++,type:'basic',x:x+.5,y:y+.5,hp:73,max:100,spawned:true,path:[],atk:0,stun:0,flash:0};S.enemies=[e];cam.z=1.5;
    const b=enemyBox(e),wx=e.x*TS,wy=e.y*TS+8-uLift(e)+(b.t+b.b)/2;onTap((wx-cam.x)*cam.z,(wy-cam.y)*cam.z);guardLight=g0;const t=[...document.querySelectorAll('#toasts > *')].map(x=>x.textContent).join('|');S.enemies=[];return JSON.stringify({t,lit,name:EN.basic.name})})()`));
  assert.equal(r.lit,0,'no guard light in look mode');assert.ok(r.t.includes(r.name+'（体力 73/100）'),'shows name and HP: '+r.t);
  console.log('Look: tapping an enemy shows its name and HP ('+r.t+')');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
