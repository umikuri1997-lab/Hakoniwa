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
  /* 作戦：「作戦をたてよう」を受けるまでは、欄を出さない */
  let c=JSON.parse(await run(`JSON.stringify([...document.querySelector('#prepPop').querySelectorAll('h3')].map(x=>x.textContent))`));
  assert.ok(!c.includes('作戦'),'no tactic section before the quest');
  /* 作戦をたてよう：火のせいれいがいる昼に出る → 受けたら、ふつう・まもる */
  c=JSON.parse(await run(`(()=>{document.querySelector('#prepPop').remove();S.t=3*1440+9*60;const q=SUBQ.find(q=>q.k==='tacStart'),q2=SUBQ.find(q=>q.k==='tacSeme');const r0=S.res[0],el0=r0.elem,no=q.at();r0.elem='fire';const at=q.at(),at2=q2.at();r0.elem=el0;return JSON.stringify({no,at,at2})})()`));
  assert.deepEqual([c.no,c.at],[false,true],'tacStart offered only when a fire spirit is in the village');assert.equal(c.at2,false,'tacSeme waits');
  await run(`(S.subSt||(S.subSt={})).tacStart=2;S.t=3*1440+17*60;nightPrepTick.t=0;nightPrepTick()`);
  c=JSON.parse(await run(`(()=>{const o=document.querySelector('#prepPop');const b=[...[...o.querySelectorAll('.sec')][0].querySelectorAll('button')];const names=b.map(x=>x.textContent);b.find(x=>x.textContent==='まもる').click();const o2=document.querySelector('#prepPop');return JSON.stringify({names,tac:S.tac,now:tacNow(),ch:tacChase(),sel:[...o2.querySelectorAll('.btn.pri')].map(x=>x.textContent)})})()`));
  assert.deepEqual(c.names,['ふつう','まもる'],'futsu and mamoru');assert.equal(c.tac,'mamoru');assert.equal(c.now,'mamoru');assert.equal(c.ch,20,'chase 20');assert.ok(c.sel.includes('まもる'));
  /* まもる：夜だけ、受けるおなかのへり0.5倍・攻撃力0.8倍。朝5時までこしたら、たっせい */
  c=JSON.parse(await run(`(()=>{const day=[tacFx('hurt'),tacFx('atk')];S.t=4*1440+1*60;const nt=[tacFx('hurt'),tacFx('atk'),tacFx('pw')];S.t=4*1440+5*60+10;tacTick();return JSON.stringify({day,nt,done:SUBQ.find(q=>q.k==='tacStart').ok()})})()`));
  assert.deepEqual(c,{day:[1,1],nt:[.5,.8,1],done:true},'mamoru effects at night, quest done');
  /* こっちからせめよう：作戦をたてようのあと、大きな影を追いはらったら → せめる */
  c=JSON.parse(await run(`(()=>{(S.subDone||(S.subDone={})).tacStart=1;S.subSt.tacStart=4;S.t=4*1440+9*60;const q=SUBQ.find(q=>q.k==='tacSeme');const a0=q.at();S.bossKills=1;const r0=S.res[0],el0=r0.elem;r0.elem='fire';const a1=q.at();r0.elem=el0;S.subSt.tacSeme=2;S.tac='semeru';S.t=4*1440+23*60;const fx=[tacFx('hurt'),tacFx('atk'),tacFx('pw')],ch=tacChase();const ty=Object.keys(EN).find(k=>!EN[k].boss&&EN[k].pw);for(let i=0;i<5;i++){const e={id:900+i,type:ty,x:5,y:5,hp:0,spawned:true};S.enemies.push(e);defeat(e)}S.enemies=S.enemies.filter(e=>!(e.id>=900&&e.id<905));return JSON.stringify({a0,a1,fx,ch,k:S.flags.tacSemeK,ok:q.ok()})})()`));
  assert.deepEqual(c,{a0:false,a1:true,fx:[1.5,1.3,1.5],ch:120,k:5,ok:true},'semeru quest and effects');
  await run(`S.tac='futsu';S.flags.sortie=1;S.t=4*1440+9*60`);
  console.log('Night prep: tactics by quests ->',JSON.stringify(c));
  /* たたかう・見張り台・ハーブの欄 */
  c=JSON.parse(await run(`(()=>{document.querySelectorAll('#prepPop,#prepWp').forEach(x=>x.remove());S.t=5*1440+17*60;S.npDay=null;S.herb=1;S.herbD=null;S.lastWarn=null;const k=S.obj.findIndex((o,j)=>!o&&j>W*5);S.obj[k]='watch';nightPrepTick.t=0;nightPrepTick();const o=document.querySelector('#prepPop'),h=[...o.querySelectorAll('h3')].map(x=>x.textContent);
    const r=S.res.find(x=>sortieOK(x));const was=fighter0(r);[...o.querySelectorAll('button')].find(b=>b.textContent===(was?'たたかわない':'たたかう')).click();const now=fighter0(r);
    [...document.querySelector('#prepPop').querySelectorAll('button')].find(b=>b.textContent.startsWith('見張り台1')).click();const pk=document.querySelector('#prepWp');[...pk.querySelectorAll('button.row')][1].click();const own=(S.wpOwn||{})[k];
    const hb=[...document.querySelector('#prepPop').querySelectorAll('button')].find(b=>b.textContent.startsWith('まよけのハーブ'));hb.click();return JSON.stringify({h,flip:was!==now,own:own===S.res.filter(x=>!x.hidden&&wpWhoOK(x))[0].id,herb:S.herb,lbl:[...document.querySelector('#prepPop').querySelectorAll('button')].find(b=>b.textContent.startsWith('見張り台1')).textContent})})()`));
  assert.deepEqual(c.h,['作戦','たたかう','見張り台','どうぐ']);assert.equal(c.flip,true,'sortie toggled');assert.equal(c.own,true,'tower owner set');assert.equal(c.herb,0,'herb used');
  console.log('Night prep: sortie, tower, herb ->',JSON.stringify(c));
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
