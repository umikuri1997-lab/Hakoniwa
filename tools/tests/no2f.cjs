const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.tEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.tEval);const run=s=>page.evaluate(s=>tEval(s),s);
 assert(await run("!BL.stairs2f&&typeof fl2Init==='undefined'&&newState(0).flags.no2f1===1&&!('fl2' in newState(0))"),'2f still present');
 // 2階を使っていた古いセーブ
 const r=await run(`(()=>{NOSAVE=true;const s=newState(0);delete s.flags.no2f1;const j=CY*W+CX;s.obj[j]='stairs2f';s.obj[j+5]='site';s.dyn[j+5]={build:'stairs2f'};s.pt=100;s.mat.wood=10;s.inv={};s.placed={stairs2f:2};
  s.fl2={obj:{[j+1]:'chair',[j+2]:'hwall'},floor:{[j+1]:'floor'},ref:{},dyn:{},hp:{},rot:{},win:{[j+2]:'curtain1'}};
  s.res=[mkRes(s,POKO,'wood',CX+.5,CY+.5)];s.res[0].fl=1;s.res[0].fl2s=j;s.res[0].x=CX+3.5;s.res[0].act={type:'sleep',up:1};
  continueGame(JSON.parse(JSON.stringify(s)));const q=S.res[0];
  return {o:S.obj[j],o2:S.obj[j+5],pt:S.pt,wood:S.mat.wood,inv:S.inv,fl2:'fl2' in S,flag:S.flags.no2f1,fl:q.fl,x:q.x,act:q.act&&q.act.up,placed:S.placed.stairs2f}})()`);
 console.log(r);
 assert.equal(r.o,'');assert.equal(r.o2,'');assert.equal(r.pt,160);assert.equal(r.wood,70);
 assert.equal(r.inv.chair,1);assert.equal(r.inv.hwall,1);assert.equal(r.inv.floor,1);assert.equal(r.inv.curtain1,1);assert.equal(r.inv.window,1);
 assert.equal(r.fl2,false);assert.equal(r.flag,1);assert.equal(r.fl,undefined);assert.equal(r.x,await run('CX+.5'));assert(!r.act);assert.equal(r.placed,undefined);
 // 2回読みこんでも、もう一度はもどさない
 const pt2=await run(`(()=>{continueGame(JSON.parse(JSON.stringify(S)));return S.pt})()`);assert.equal(pt2,160);
 assert.deepEqual(errors,[]);console.log('Old 2F saves: stairs refunded, 2F items returned, spirits on 1F, fl2 dropped; browser errors: none.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
