/* せいれいが、みんなの合計で時計の3時間いたマスは、緑になる（2人なら1時間半）。歩いて通るだけでもふえる。水・家の中（かくれている子）は数えない */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.sacredEval);const run=s=>p.evaluate(s=>sacredEval(s),s);
await run(`(()=>{setWorld(0);S=newState(0);LIVE[0]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;S.enemyOn=false;S.hold=0;S.food=100;S.res=[];return 1})()`);
await p.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:60000});
const o=await run(`(()=>{let x=CX+6,y=CY+6,j=y*W+x;for(let k=0;k<400&&(REV.has(j)||S.obj[j]||S.ground[j]);k++){x++;j=y*W+x}S.grn={};S.stay={};
  const a=mkRes(S,'a','wood',x+.5,y+.5),b=mkRes(S,'b','earth',x+.5,y+.5);S.res=[a,b];
  const st=dt=>{stayTick(dt);stayGreen()};
  for(let i=0;i<134;i++)st(1);const mid=REV.has(j);/* 2人で 134/1.5=89分 */
  for(let i=0;i<4;i++)st(1);const done=REV.has(j)&&!!S.grn[j];
  /* かくれている子は数えない */const k2=j+2;a.x=b.x=k2%W+.5;a.y=b.y=((k2/W)|0)+.5;a.hidden=b.hidden=true;for(let i=0;i<600;i++)st(1);const hid=REV.has(k2);
  /* セーブして読みこんでも、緑のまま */const sv=JSON.parse(JSON.stringify(S.grn));S.grn={};recount();const lost=!REV.has(j);S.grn=sv;recount();
  return {mid,done,hid,lost,back:REV.has(j)}})()`);
assert.equal(o.mid,false,'3時間より前は、まだ緑にならない');assert.equal(o.done,true,'2人で1時間半いたら緑');assert.equal(o.hid,false,'かくれている子は数えない');assert.equal(o.back,true,'S.grn から緑にもどる');
assert.deepEqual(errors,[]);console.log('stay green ok',JSON.stringify(o));await browser.close()})();
