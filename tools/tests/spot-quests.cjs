const {chromium}=require('playwright'),assert=require('node:assert/strict');
/* 依頼の物でスポットを作るサブクエストの条件 */
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);'});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.sacredEval);const run=s=>page.evaluate(s=>sacredEval(s),s);
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};showItemGift=()=>{};showSpotPop=()=>{};`);
 const fresh=w=>run(`(()=>{resetVillageTransient();if(sheet)closeSheet();setWorld(${w});S=newState(${w});LIVE[${w}]=S;started=true;USERPAUSE=true;NOSAVE=true;window.__noIdle=true;S.introSeen=true;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();return true})()`);
 /* 依頼の物でスポットを作るサブクエスト：物を置くだけではクリアせず、スポットができたらクリア */
 await fresh(0);
 const r=await run(`(()=>{const q=k=>SUBQ.find(x=>x.k===k),o=[],b=(CY+18)*W+CX;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=8;dx++){S.obj[b+dy*W+dx]='';S.floor[b+dy*W+dx]=''}recount();
  S.obj[b]='table';S.obj[b+2]='chair';recount();o.push(q('chair2').ok());S.obj[b-2]='chair';recount();o.push(q('chair2').ok(),q('chair2').now());
  const p=b+W*4+6;S.obj[p]='parasol';recount();o.push(q('parasol').ok());S.obj[p+2]='bench';recount();o.push(q('parasol').ok());return o})()`);
 assert.deepEqual(r,[false,true,1,false,true]);
 console.log('いすでダイニング・パラソルでやすみば：スポットができてクリア');
 assert.deepEqual(errors,[]);await browser.close();console.log('spot-quests: ok');
})().catch(e=>{console.error(e);process.exit(1)});
