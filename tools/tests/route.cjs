/* 火・水・風の話：土のあと、火・水・オオカゲ・風のきまった順（えらばない）。御神木は、何番めかで芽・一枚目・ヌシ様の声 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.t=1440+600;`);
  const r=JSON.parse(await run(`(()=>{const o={};const ids=()=>QUESTS.map(q=>q.id);o.def=ids().slice(16,28).join();
    const slot=ids().indexOf('fire');S.quest=slot;S.qTalked=false;S.qStory=null;sheet=null;for(let i=0;i<5;i++)stepWorld(1);o.pop=[...document.querySelectorAll('.pxcard b')].some(b=>/むかえる/.test(b.textContent));
    o.fOut=routeOut('fire').map(l=>l[3]||'').filter(Boolean).join();o.mOut=routeOut('water').map(l=>l[3]||'').filter(Boolean).join();
    o.mTalk=routeWaterTalk()[0][1];o.wTalk=routeWindTalk()[0][1];o.kScene=FIELD_STORIES.windEcho[0].lines.some(l=>/stree:reply/.test(l[3]||''));
    o.giveK=JSON.stringify(QUESTS1.find(q=>q.id==='windEcho').gives);o.giveM=JSON.stringify(QUESTS1.find(q=>q.id==='waterFilm').gives||null);
    return JSON.stringify(o)})()`));
  console.log(r);
  assert.equal(r.def,'fire,fireRoot,warmMeal,water,waterFilm,aoFish,kagemark,ookage,guardLearn,wind,windEcho,kite');
  assert.ok(!r.pop,'えらぶ画面は出ない');
  assert.match(r.fOut,/stree:bud/,'火は1つめで芽');assert.match(r.mOut,/stree:leaf/,'水は2つめで一枚目');assert.match(r.mTalk,/芽/);assert.match(r.wTalk,/葉っぱ/);
  assert.ok(r.kScene,'風の調べでヌシ様の声');assert.match(r.giveK,/nushiAlive/);assert.equal(r.giveM,'null');
  assert.deepEqual(errors,[]);console.log('route: ok');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
