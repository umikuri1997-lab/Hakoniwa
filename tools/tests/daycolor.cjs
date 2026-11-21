/* 時間の色（daycolor.js）：時刻ごとに、層ごとの色がかわる。昼は地面・水・屋根に何もかけない。ブルーアワーと夜は、地面が寒色・夜の暗さが青、窓のあかりはのこる。いろいろな時刻・段差・遠くの画面で描いてもエラーが出ない */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;`);
  const at=async h=>JSON.parse(await run(`(()=>{S.t=1440*3+${h}*60;DC.h=-1;const v=dcNow();render(performance.now());return JSON.stringify(v)})()`));
  const noon=await at(12);assert.equal(noon.g,null,'noon: no ground tint');assert.equal(noon.w,null);assert.equal(noon.r,null);
  const rgb=s=>s.match(/\d+/g).map(Number);
  const blue=await at(19.3);{const g=rgb(blue.g);assert.ok(g[2]>g[0],'blue hour: ground goes cool '+blue.g);assert.ok(blue.dk[2]>blue.dk[0],'blue hour: darkness is blue');assert.ok(blue.win>=1,'blue hour: windows lit')}
  const eve=await at(17.2);{const g=rgb(eve.g);assert.ok(g[0]>g[2],'evening: ground goes warm '+eve.g)}
  const night=await at(23);assert.ok(night.win>1,'deep night: windows stand out');{const g=rgb(night.g);assert.ok(g[2]>g[0])}
  for(const h of [0,3,5,6,7,9,15,16.5,18,18.8,20,21.5])await at(h);
  await run(`(()=>{for(let i=0;i<W*H;i+=97)if(!S.obj[i]&&S.ground[i]===0)S.hi[i]=1;dirty=true;recount()})()`);
  for(const z of [1.6,.4]){await run(`cam.z=${z}`);for(const h of [12,19.3,23])await at(h)}
  console.log('daycolor: layers change by hour (warm evening, cool blue hour, lit windows at night)');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
