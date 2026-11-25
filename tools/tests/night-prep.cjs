/* 今夜のそなえ：17時に、ポップアップを1日1回出す（上の札は出さない）。会話のあいだは、まつ */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  const st=async()=>JSON.parse(await run(`JSON.stringify({pop:!!document.querySelector('#prepPop'),badge:!!document.querySelector('#prepBadge'),txt:(document.querySelector('#prepPop')||{}).textContent||''})`));
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.enemyOn=true;S.t=1440+16*60;nightPrepTick.t=0;nightPrepTick()`);
  assert.equal((await st()).pop,false,'no popup before 17:00');
  await run(`S.t=1440+17*60;nightPrepTick.t=0;nightPrepTick()`);
  let s=await st();assert.equal(s.pop,true,'popup at 17:00');assert.equal(s.badge,false,'no badge at the top');assert.match(s.txt,/今夜のそなえ/);
  console.log('Night prep: popup at 17:00 ->',s.txt);
  await run(`document.querySelector('#prepPop .x').click();S.t=1440+18*60;nightPrepTick.t=0;nightPrepTick()`);
  assert.equal((await st()).pop,false,'only once a day');
  await run(`S.t=2*1440+17*60;document.querySelector('#dialog').hidden=false;nightPrepTick.t=0;nightPrepTick()`);
  assert.equal((await st()).pop,false,'wait during a dialog');
  await run(`document.querySelector('#dialog').hidden=true;nightPrepTick.t=0;nightPrepTick()`);
  assert.equal((await st()).pop,true,'shown after the dialog');
  console.log('Night prep: once a day, waits for dialogs');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
