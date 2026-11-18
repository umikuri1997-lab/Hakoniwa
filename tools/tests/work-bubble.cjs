/* 作業中（しまう・作る・料理・ごはん・水あびなど）は、せいれいのふきだしを出さない。ひまなときのふきだしは出す */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`window.__bub=0;const o=pxBub;pxBub=function(){window.__bub++;return o.apply(this,arguments)}`);
  /* 1コマだけ、その行動にして描き、すぐもとにもどす（ゲームの動きには、にせの行動をわたさない） */
  const count=type=>run(`(()=>{const r=S.res[0],a0=r.act,b0=r.bubble;r.act={type:'${type}',stage:'do',t:0};r.bubble='📦';window.__bub=0;render(performance.now());r.act=a0;r.bubble=b0;return window.__bub})()`);
  assert.ok(await count('idle')>0,'idle must show a bubble');
  for(const t of ['store','smat','craft','cook','eat','bathe','fetch'])assert.equal(await count(t),0,t+' must not show a bubble');
  assert.ok(await count('idle')>0,'idle must still show a bubble');
  console.log('Work bubbles: hidden while working, shown while idle');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
