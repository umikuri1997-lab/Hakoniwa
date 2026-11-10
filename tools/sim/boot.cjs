/* ゲームをブラウザで開いて、新しい草原のゲームをはじめる。run(コード) で、ゲームの中のコードを動かせる。
   サーバー：GAME_URL（なければ、自分で立てる）。ブラウザ：CHROME_PATH（なければ Playwright の物）。 */
const {chromium}=require('playwright');
module.exports=async function(opt={}){
  let server=null;if(!process.env.GAME_URL){server=await require('./serve.cjs')();process.env.GAME_URL='http://127.0.0.1:'+server.address().port}/* サーバーがなければ、自分で立てる */
  const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
  const page=await browser.newPage({viewport:opt.viewport||{width:900,height:700}}),errors=[];
  page.on('pageerror',e=>errors.push('PE '+e.message+' @'+((e.stack||'').split('\n')[1]||'').trim().slice(0,160)));
  page.on('console',m=>{if(m.type()==='error')errors.push('CE '+m.text().slice(0,300))});
  await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.sacredEval=s=>eval(s);window.__noIdle=1;'})});
  await page.goto(process.env.GAME_URL);await page.waitForFunction(()=>window.sacredEval);
  const run=s=>page.evaluate(s=>sacredEval(s),s);
  await run(`(()=>{newGame(${opt.world||0});for(const id of ['#title','#maps','#pro'])document.querySelector(id).hidden=true;showUI(true);started=true;})()`);
  await page.waitForFunction(()=>sacredEval('stageReady()'),{},{timeout:90000});
  const close0=browser.close.bind(browser);browser.close=async()=>{await close0();if(server)server.close()};
  return {browser,page,run,errors};
};
