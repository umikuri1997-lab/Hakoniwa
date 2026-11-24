/* セーブが読めない（こわれている・版がちがう）ときは、知らせて聞く。「はじめから」をおすまで、もとのセーブに書かず、べつの所にとっておく */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const BAD='{"v":8,"introSeen":true,"lv":3,"savedAt":1,"res":[';
  await run(`(()=>{KV.setItem(SAVE_KEYS[1],${JSON.stringify(BAD)});KV.removeItem(SAVE_KEYS[1]+'-broken');LIVE[1]=null;started=false;continueGame(stageInfo(1))})()`);
  let st=JSON.parse(await run(`JSON.stringify({ask:!!document.querySelector('.bad-reveal'),keep:KV.getItem(SAVE_KEYS[1]),copy:KV.getItem(SAVE_KEYS[1]+'-broken'),why:LOADBAD[1]&&LOADBAD[1].why,kept:LOADBAD[1]&&LOADBAD[1].kept})`));
  assert.ok(st.ask,'a broken save shows the notice');assert.equal(st.keep,BAD,'the broken save is not overwritten');assert.equal(st.copy,BAD,'the broken save is copied');assert.ok(st.kept);assert.ok(st.why);
  await run(`save()`);assert.equal(await run(`KV.getItem(SAVE_KEYS[1])`),BAD,'autosave of another stage does not touch it');
  await run(`document.querySelector('.bad-reveal .btn.pri').click()`);
  st=JSON.parse(await run(`JSON.stringify({ask:!!document.querySelector('.bad-reveal'),maps:!$('#maps').hidden,keep:KV.getItem(SAVE_KEYS[1])})`));
  assert.equal(st.ask,false);assert.ok(st.maps,'back goes to the map list');assert.equal(st.keep,BAD);
  console.log('Broken save: notice, kept as it is, copied, back to the map list');
  /* 版がちがうセーブも同じ */
  await run(`(()=>{KV.setItem(SAVE_KEYS[1],'{"v":7,"introSeen":true}');LIVE[1]=null;continueGame(stageInfo(1))})()`);
  assert.ok(await run(`!!document.querySelector('.bad-reveal')&&/版/.test(LOADBAD[1].why)`),'another save version shows the notice');
  /* 「はじめから」（おしつづけて決める） */
  await run(`(()=>{const b=document.querySelector('.bad-reveal .btn:not(.pri)');b._held=true;b.click()})()`);
  st=JSON.parse(await run(`JSON.stringify({ask:!!document.querySelector('.bad-reveal'),wd:WD,bad:!!LOADBAD[1],copy:KV.getItem(SAVE_KEYS[1]+'-broken')})`));
  assert.equal(st.ask,false);assert.equal(st.wd,1,'new game starts on that stage');assert.equal(st.bad,false);assert.equal(st.copy,'{"v":7,"introSeen":true}','the copy stays');
  console.log('Broken save: hold "start over" begins that stage, the copy stays');
  const errs=errors.filter(e=>!/load w1/.test(e));assert.deepEqual(errs,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
