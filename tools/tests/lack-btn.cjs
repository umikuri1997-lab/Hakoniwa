/* 足りなくて押せないボタンは、押したら、何が足りないかを知らせる（何も起きないボタンを作らない。lackOn） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  /* 1. パワーが足りない：灰色で、押すと知らせる。もとの処理は動かない */
  const r=JSON.parse(await run(`(()=>{let hit=0;const b=document.createElement('button');b.className='btn';b.onclick=()=>hit++;document.body.appendChild(b);S.pt=5;lackOn(b,lackPt(20));b.click();const t=[...document.querySelectorAll('#toasts *,.toast')].map(x=>x.textContent).join('|');const o={hit,lack:b.classList.contains('lack'),dis:b.disabled,op:getComputedStyle(b).opacity,t};S.pt=50;lackOn(b,lackPt(20));b.click();o.hit2=hit;o.lack2=b.classList.contains('lack');b.remove();return JSON.stringify(o)})()`));
  assert.equal(r.hit,0,'the action does not run');assert.equal(r.lack,true);assert.equal(r.dis,false,'the button can be pressed');assert.equal(r.op,'0.45','looks like a disabled button');
  assert.ok(r.t.includes('パワーが足りません（あと15）'),'tells what is missing: '+r.t);assert.equal(r.hit2,1,'works when enough');assert.equal(r.lack2,false);
  console.log('Lack: a button without enough power tells why, and works once there is enough');
  /* 2. 素材 */
  assert.equal(await run(`(S.mat.stone=1,lackMat('stone',3))`),MATN_STONE(await run(`MATN.stone`)));
  console.log('Lack: material message');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
function MATN_STONE(n){return n+'が足りません（あと2）'}
