/* コワイノに当たった音（foehit：当たって見える時刻・同じときに当たった物は近い物から2つ）と、倒した音（defeat：さいごに当たって見える時刻。さいごの「ぽんっ」とかさなる） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=(5*24+23.5)*60;S.enemies=[];S.ns={n:1,kill:0,lost:[]};S.drops=[];1`);
  await page.waitForTimeout(1500);/* 画面が止まらなくなってから、はかる */
  const out=await page.evaluate(()=>sacredEval(`new Promise(done=>{
   const cx=(cam.x+VW/cam.z/2)/TS,cy=(cam.y+VH/cam.z/2)/TS,L=[],t0=performance.now();const o0=sfx;sfx=function(k){L.push([k,Math.round(performance.now()-t0)]);};
   const mk=dx=>{const e={type:'basic',hp:EN.basic.hp,max:EN.basic.hp,x:cx+dx,y:cy,spawned:true,path:[]};S.enemies.push(e);return e};
   const a=mk(0);hurtEn(a,10,{lag:HIT_LAG,sx:cx-1,sy:cy});/* 1回め */
   setTimeout(()=>{[0,.5,1,1.5,2].map(mk).forEach(e=>hurtEn(e,10,{}));/* 5ひきに同時 */
    setTimeout(()=>{a.hp=5;const t1=performance.now()-t0;hurtEn(a,10,{lag:HIT_LAG,sx:cx-1,sy:cy});defeat(a,'',null);/* さいごの一撃 */
     setTimeout(()=>{sfx=o0;done({L,t1:Math.round(t1)})},700)},400)},400)})`));
  console.log(JSON.stringify(out));
  const h=out.L.filter(x=>x[0]==='foehit'),d=out.L.filter(x=>x[0]==='defeat');
  const first=h.filter(x=>x[1]<400),many=h.filter(x=>x[1]>=400&&x[1]<out.t1),last=h.filter(x=>x[1]>=out.t1);
  assert.equal(first.length,1,'1回めの当たり');assert.ok(first[0][1]>=150,'当たって見える時刻（HIT_LAG）より前に鳴らない');
  assert.equal(many.length,2,'同時に5ひき当たっても2つ');
  assert.equal(last.length,1);assert.equal(d.length,1,'倒した音は1つ');
  assert.ok(Math.abs(d[0][1]-last[0][1])<=30,'さいごの「ぽんっ」と倒した音が、同じころに鳴る');assert.ok(d[0][1]-out.t1>=140,'倒した音も、当たって見える時刻に');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('Foe sound OK. Browser errors: none');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
