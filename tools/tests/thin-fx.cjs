/* うすかった演出のたしかめ：子どもが生まれた（aniBirth）・流れ星のおねがいがかなった（starWishShow）・遊び方を思い出した（windRemFx）・
   そうびの強化（gearUpFx）・洞窟の階のクリア（cvClearCard・cvPillDraw）・得意の★（tokuiStarFx）。どれも見た目と音だけで、さいごまで見たら印をけす */
const assert=require('node:assert/strict');
const wait=ms=>new Promise(f=>setTimeout(f,ms));
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({world:0});
  const ev=s=>page.evaluate(s);
  await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.t=Math.floor(S.t/1440)*1440+10*60;return 1})()`);
  /* 子どもが生まれた：nb の子がいれば、カメラがよってカードが出る。とじると nb がきえる */
  await ev(`(()=>{const r=S.res[0];S.ani=S.ani||[];S.ani.push({id:900,k:'hane',h:-1,born:dayNo(),fun:50,x:r.x+1,y:r.y,face:1,wt:2,nb:1});aniBirthTick();window.__b=!!AMEET&&GIFT_ACTIVE})()`);
  assert.equal(await ev('window.__b'),true,'演出がはじまる');
  await page.waitForSelector('.anim-meet .btn',{timeout:8000});await wait(900);
  const bt=await ev(`document.querySelector('.anim-meet h2').textContent`);assert.equal(bt,'子どもが生まれた！');
  await page.click('.anim-meet .btn');await wait(1600);
  assert.deepEqual(await ev(`[S.ani.find(a=>a.id===900).nb,!!AMEET,GIFT_ACTIVE]`),[undefined,false,false]);
  await ev(`S.ani=S.ani.filter(a=>a.id!==900)`);
  /* 流れ星：朝にかなうと S.starG。演出のあと、けす */
  await ev(`(()=>{S.starW={d:dayNo()-1,k:'yutaka'};starMorning();window.__g=!!S.starG;starWishTick();window.__s=!!STARG})()`);
  assert.deepEqual(await ev('[window.__g,window.__s]'),[true,true]);
  await page.waitForSelector('.gift-reveal[aria-label="流れ星のおねがいが、かなった"] .btn',{timeout:9000});await wait(900);
  await page.click('.gift-reveal[aria-label="流れ星のおねがいが、かなった"] .btn');await wait(1600);
  assert.deepEqual(await ev(`[S.starG===undefined,!!STARG,GIFT_ACTIVE]`),[true,false,false]);
  /* 思い出した・得意の★：頭の上の絵（SCN）がならぶ */
  const sc=await ev(`(()=>{const r=S.res[0];windRemFx(r,'swing');tokuiStarFx(r,2);return SCN.filter(e=>e.k==='windrem'||e.k==='tkstar').length})()`);
  assert.equal(sc,2);await wait(800);
  /* 強化：カードに「+1」のハンコ */
  await ev(`gearUpFx({id:Object.keys(BL).find(k=>BL[k].g&&ICONS['g_'+k]),lv:1})`);await wait(900);
  assert.equal(await ev(`!!document.querySelector('.gift-reveal[aria-label="強化できた"] .ustamp')`),true);
  await page.click('.gift-reveal[aria-label="強化できた"] .btn');
  /* 洞窟：光の柱を描いて、時間がたったら消える。カードが出て、とじると GIFT_ACTIVE がもどる */
  await ev(`(()=>{const q=S.res[0];q.nap=false;q.hunger=hMax(q);S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter([q],{});const C=CV;window.__C=C;C.pill={x:3,y:3,t0:performance.now()};cvPillDraw(performance.now());cvClearCard(C)})()`);
  await page.waitForSelector('.gift-reveal[aria-label="下へおりる坂"] .btn',{timeout:5000});await wait(1500);
  await page.click('.gift-reveal[aria-label="下へおりる坂"] .btn');
  assert.deepEqual(await ev(`(()=>{cvPillDraw(performance.now()+9999);const r=[__C.pill,GIFT_ACTIVE];caveAbort();return r})()`),[null,false]);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
