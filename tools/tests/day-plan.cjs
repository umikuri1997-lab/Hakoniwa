/* 今日の役：朝に、カミサマの会話ではなくポップアップでえらぶ。役の名前と効き目は2行（折り返しをへらす） */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')({viewport:{width:360,height:740}});
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;S.lv=2;S.t=1440*2+8*60;PLASK=null;planMorning()`);
  await new Promise(r=>setTimeout(r,3500));
  const s=JSON.parse(await run(`(()=>{const o=document.querySelector('#planPop');return JSON.stringify({pop:!!o,dlg:!document.querySelector('#dialog').hidden,n:o?o.querySelectorAll('.plOpt').length:0,txt:o?o.textContent:'',lines:o?[...o.querySelectorAll('.plOpt span')].map(e=>Math.round(e.getBoundingClientRect().height/22.5)):[]})})()`));
  assert.equal(s.pop,true,'popup shown');assert.equal(s.dlg,false,'no god dialog');assert.equal(s.n,3);
  console.log('Day plan popup:',s.txt,'lines per effect',s.lines);
  await run(`document.querySelectorAll('#planPop .plOpt')[1].click()`);
  assert.equal(await run(`planKey()`),'craft');assert.equal(await run(`!!document.querySelector('#planPop')`),false);
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
