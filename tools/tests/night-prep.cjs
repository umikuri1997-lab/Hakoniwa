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
  /* かえられる物：作戦・たたかう・見張り台・ハーブ */
  let c=JSON.parse(await run(`(()=>{const o=document.querySelector('#prepPop');const h=[...o.querySelectorAll('h3')].map(x=>x.textContent);return JSON.stringify({h,tac:[...o.querySelectorAll('.sec')][0].querySelectorAll('button').length})})()`));
  assert.ok(c.h.includes('作戦'),'tactic section');assert.equal(c.tac,1,'only ふつう at first');
  /* 思いつく：たたかれた・大きな影・見張り台2つ・合わせわざ */
  await run(`document.querySelector('#prepPop').remove();S.t=3*1440+9*60;S.flags.tacHit=1;S.bossKills=1;S.flags.tacCombo=1;nightPrepTick.t=0;nightPrepTick()`);
  let d=JSON.parse(await run(`JSON.stringify({open:!document.querySelector('#dialog').hidden,ok:S.tacOK})`));
  assert.equal(d.open,true,'learn dialog');assert.deepEqual(d.ok,{mamoru:1},'one at a time');
  await run(`document.querySelector('#dialog').hidden=true;DLGQ.length=0;nightPrepTick.t=0;nightPrepTick();document.querySelector('#dialog').hidden=true;DLGQ.length=0;nightPrepTick.t=0;nightPrepTick();document.querySelector('#dialog').hidden=true;DLGQ.length=0`);
  d=JSON.parse(await run(`JSON.stringify(S.tacOK)`));assert.deepEqual(d,{mamoru:1,oikaesu:1,issho:1},'learned three');
  await run(`S.t=3*1440+17*60;nightPrepTick.t=0;nightPrepTick()`);
  c=JSON.parse(await run(`(()=>{const o=document.querySelector('#prepPop');const b=[...[...o.querySelectorAll('.sec')][0].querySelectorAll('button')];b.find(x=>x.textContent==='まもる').click();const o2=document.querySelector('#prepPop');return JSON.stringify({n:b.length,tac:S.tac,now:tacNow(),ch:tacChase(),sel:[...o2.querySelectorAll('.btn.pri')].map(x=>x.textContent)})})()`));
  assert.equal(c.n,4,'four tactics shown');assert.equal(c.tac,'mamoru');assert.equal(c.now,'mamoru');assert.equal(c.ch,20,'chase 20');assert.ok(c.sel.includes('まもる'));
  /* 見張り台まかせ：たたかうせいれいも、夜は家へ */
  c=JSON.parse(await run(`(()=>{S.tacOK.watch=1;S.tac='watch';S.flags.sortie=1;const r=S.res.find(x=>x.elem==='fire')||S.res[0];r.sortie=true;const day=fighter(r);S.t=4*1440+1*60;const nt=fighter(r),hm=tacHome(r);S.tac='futsu';const nf=fighter(r);return JSON.stringify({day,nt,hm,nf})})()`));
  assert.deepEqual(c,{day:true,nt:false,hm:true,nf:true},'watch tactic hides fighters at night only');
  console.log('Night prep: tactics learned and chosen ->',JSON.stringify(c));
  /* たたかう・見張り台・ハーブの欄 */
  c=JSON.parse(await run(`(()=>{document.querySelectorAll('#prepPop,#prepWp').forEach(x=>x.remove());S.t=5*1440+17*60;S.npDay=null;S.herb=1;S.herbD=null;S.lastWarn=null;const k=S.obj.findIndex((o,j)=>!o&&j>W*5);S.obj[k]='watch';nightPrepTick.t=0;nightPrepTick();const o=document.querySelector('#prepPop'),h=[...o.querySelectorAll('h3')].map(x=>x.textContent);
    const r=S.res.find(x=>sortieOK(x));const was=fighter0(r);[...o.querySelectorAll('button')].find(b=>b.textContent===(was?'たたかわない':'たたかう')).click();const now=fighter0(r);
    [...document.querySelector('#prepPop').querySelectorAll('button')].find(b=>b.textContent.startsWith('見張り台1')).click();const pk=document.querySelector('#prepWp');[...pk.querySelectorAll('button.row')][1].click();const own=(S.wpOwn||{})[k];
    const hb=[...document.querySelector('#prepPop').querySelectorAll('button')].find(b=>b.textContent.startsWith('まよけのハーブ'));hb.click();return JSON.stringify({h,flip:was!==now,own:own===S.res.filter(x=>!x.hidden&&wpWhoOK(x))[0].id,herb:S.herb,lbl:[...document.querySelector('#prepPop').querySelectorAll('button')].find(b=>b.textContent.startsWith('見張り台1')).textContent})})()`));
  assert.deepEqual(c.h,['作戦','たたかう','見張り台','どうぐ']);assert.equal(c.flip,true,'sortie toggled');assert.equal(c.own,true,'tower owner set');assert.equal(c.herb,0,'herb used');
  console.log('Night prep: sortie, tower, herb ->',JSON.stringify(c));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
