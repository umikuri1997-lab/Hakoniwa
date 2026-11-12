const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
/* 火山らしさ：ベリーなし・ようがん台はおねがいでおぼえる・カミサマのお店に草原の苗を出さない・温泉宿のお客さんのお店・「この土地」「ぜんぶ」 */
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:430,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/js/main.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.vlEval=s=>eval(s);'})});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await page.waitForFunction(()=>window.vlEval);const run=s=>page.evaluate(s=>vlEval(s),s);const shot=n=>process.env.SHOT_DIR?page.screenshot({path:process.env.SHOT_DIR+'/'+n+'.png'}):0;
 await run(`checkQuest=()=>{};updTut=()=>{};checkLevel=()=>{};true`);
 await run(`(()=>{resetVillageTransient();setWorld(1);S=newState(1);LIVE[1]=S;started=true;USERPAUSE=true;NOSAVE=true;S.introSeen=true;for(const id of ['#title','#maps','#pro','#dialog','#lvup','#rlv'])document.querySelector(id).hidden=true;recount();return 1})()`);
 assert.equal(await run(`S.obj.filter(o=>o==='berry').length`),0,'火山にベリー');
 /* ようがん台 */
 assert.equal(await run(`lvOK('yogan')`),false,'はじめからようがん台');
 const yq=await run(`(()=>{S.nights=1;const q=SUBQ.find(q=>q.k==='yogan1');return q.at()})()`);assert.equal(yq,true);
 await run(`(()=>{S.recipes.yogan=true;return 1})()`);assert.equal(await run(`lvOK('yogan')`),true);
 assert.deepEqual(await run(`QUESTS2[questIndexOf('fire3')].talk.learn`),['yogan']);
 /* 古いセーブ：ベリーをけす・使っていないようがん台はわすれる */
 const old=await run(`(()=>{const s=newState(1);s.flags.noBerry1=0;s.flags.yogan2=0;s.flags.yoganLearned=true;delete s.recipes.yogan;const j=s.obj.findIndex(o=>!o);s.obj[j]='berry';s.dyn[j]={g:100};s.introSeen=true;S=s;LIVE[1]=s;NOSAVE=false;save();continueGame(loadStage(1));NOSAVE=true;return [S.obj.filter(o=>o==='berry').length,!!S.flags.yoganLearned]})()`);
 assert.deepEqual(old,[0,false]);
 /* カミサマのお店 */
 await run(`(()=>{S.feat.plant=true;S.feat.shop=true;S.pt=500;S.lv=3;openSheet('shop');return 1})()`);
 const shopTxt=await page.textContent('#sheetBody');for(const n of ['果物の苗','サルビアの種'])assert.ok(!shopTxt.includes(n),'カミサマが売る: '+n);assert.ok(shopTxt.includes('杉の苗'),'杉の苗');
 await run(`closeSheet()`);
 /* 温泉宿のお客さん */
 await run(`(()=>{S.flags.guestDone=1;S.t=dayNo()*1440+600;visitMorning();return 1})()`);
 assert.equal(await run(`visitHere()`),true);const day0=await run(`S.st2.visit.day`);
 await run(`(()=>{const g=visitor();centerOn(g.x*TS,g.y*TS);dirty=true;return 1})()`);await page.waitForTimeout(400);await shot('visitor');
 const tap=await run(`(()=>{const g=visitor();return visitTap(g.x,g.y-.5)})()`);assert.equal(tap,true);
 await page.waitForFunction(()=>!document.querySelector('#dialog').hidden);await run(`(()=>{$('#dialog').hidden=true;openSheet('vshop');return 1})()`);
 const vt=await page.textContent('#sheetBody');assert.ok(vt.includes('果物の苗')&&!vt.includes('木の苗')&&!vt.includes('杉の苗'),'お客さんのお店');await shot('vshop');
 const buy=await run(`(()=>{const b=[...document.querySelectorAll('#sheetBody .btn.pri')][5];const p=S.pt;b.click();return [p-S.pt>0,inv('fruit')]})()`);assert.ok(buy[0]&&buy[1]===1);
 await run(`closeSheet()`);
 await run(`(()=>{S.t+=1440;visitMorning();return 1})()`);assert.equal(await run(`visitHere()`),false,'つぎの日は帰る');
 await run(`(()=>{S.t+=1440;visitMorning();S.t+=1440;visitMorning();return 1})()`);assert.equal(await run(`visitHere()&&S.st2.visit.day===${day0}+3`),true,'3日ごと');
 /* この土地・ぜんぶ */
 await run(`(()=>{grecOf().set('swing',0);grecOf().set('fountain',0);S.recipes.swing=true;S.lv=10;return 1})()`);
 assert.equal(await run(`[otherLand('swing'),otherLand('bed'),otherLand('takebench')].join()`),'true,false,false');
 await run(`(()=>{RECALL=false;craftTab='遊び';openSheet('craft');return 1})()`);
 let ct=await page.textContent('#sheetBody');assert.ok(ct.includes('この土地')&&!ct.includes('ブランコ'));await shot('craft-here');
 await page.click('.recsw .ctab:nth-child(2)');ct=await page.textContent('#sheetBody');assert.ok(ct.includes('ブランコ'));await shot('craft-all');
 const rad=await run(`[...document.querySelectorAll('#sheetBody *')].filter(n=>parseFloat(getComputedStyle(n).borderRadius)>0&&n.offsetParent).length`);assert.equal(rad,0);
 /* 火山の杉 */
 const cd=await run(`[plantChip('deadtree',0)===CHIPS['deadtree~v'],plantChip('tree',0)===CHIPS['tree~v'],iname('tree'),iname('deadtree')]`);assert.deepEqual(cd,[true,true,'杉の苗','山の杉']);
 const gr=await run(`(()=>{const w=WD;WD=0;const r=[plantChip('deadtree',0)===CHIPS.deadtree,iname('tree')];WD=w;return r})()`);assert.deepEqual(gr,[true,'木の苗']);
 /* 竹の壁 */
 const bw=await run(`(()=>{const s=newState(1);return [s.obj.filter(o=>o==='bamboowall').length>5,s.obj.includes('hwall'),!!s.unlocked.bamboowall,!!QUESTS2[0].gives.items.bamboowall,stageItemOK('hwall'),stageItemOK('bamboowall'),HOME_WALLS.has('bamboowall'),!!CHIPS['bamboowall:HLR'],!!CHIPS['bamboowall.door#h0'],!CHIPS.bamboowall]})()`);
 assert.deepEqual(bw,[true,false,true,true,false,true,true,true,true,true],'竹の壁');
 /* 御簾垣・石組み */
 const ms=await run(`(()=>{const s=newState(1);return [!!s.unlocked.misugaki,!!QUESTS2[0].gives.items.misugaki,stageItemOK('fence'),stageItemOK('misugaki'),FENCE_IDS.has('misugaki'),!!CHIPS['misugaki:HLR'],!!CHIPS['misugaki.gate#h3'],!!CHIPS['rim:c0']&&!CHIPS['rim:T'],typeof drawOnsenRim]})()`);
 assert.deepEqual(ms,[true,true,false,true,true,true,true,true,'function'],'御簾垣');
 assert.deepEqual(errors,[]);console.log('volcano-land: ok');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
