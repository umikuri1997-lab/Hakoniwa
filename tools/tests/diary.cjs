/* きのうの日記：作業・できごと・ゆうべの守りが、朝にしめた日記に入り、紙が出る。思い出帳から読める。思い出帳の再生では書かない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();`);
  const r=JSON.parse(await run(`(()=>{const a=S.res[0];S.dy=null;
    dyWork(a,'build','bench');dyWork(a,'build','bench');dyWork(a,'harvest','mugi');dyWork(a,'chop','');
    memo('x','はじめてのテスト');logEv('はじめてのテスト');
    const e={type:'koka',dead:false,x:a.x,y:a.y};S.ns={n:3,kill:3,lost:[],hurt:0,broke:0,boss:0};dyKill(a,'');dyKill(a,'');dyKill(null,'とげの罠で');
    const d0=S.dy.d;diaryClose();const L=S.diary[S.diary.length-1];
    return JSON.stringify({d0,d:L.d,w:L.w.map(x=>[x[3],x[4],x[5]]),m:L.m,k:L.k[a.name][2],o:L.o,ns:!!L.ns,dd:!!S.ns.dd,sheet,arg:sheetArg,title:document.querySelector('#sheetTitle').textContent,body:document.querySelector('#sheetBody').textContent})})()`));
  assert.deepEqual(r.w,[['build','bench',2],['harvest','mugi',1]],'work entries counted, unknown types skipped');
  assert.deepEqual(r.m,['はじめてのテスト'],'memo and log text merged once');
  assert.equal(r.k,2);assert.deepEqual(r.o,{'罠':1});assert.ok(r.ns&&r.dd,'last night is stored once');
  assert.equal(r.sheet,'diary');assert.equal(r.arg,'m');assert.equal(r.title,r.d+'日めの日記');
  for(const t of['みんなのしたこと','ベンチを建てた（2回）','できごと','ゆうべの守り','2体を追いはらった','いちばんがんばったのは'])assert.ok(r.body.includes(t),'diary shows '+t);
  console.log('Diary: work, events and last night are written and the paper opens in the morning');
  /* 2回めの朝：ゆうべの守りを2回しまわない。書くことがなければ、日記をふやさない */
  const n2=JSON.parse(await run(`(()=>{closeSheet();const n=S.diary.length;diaryClose();return JSON.stringify({n,m:S.diary.length,sheet})})()`));
  assert.equal(n2.m,n2.n,'empty day is not stored');assert.equal(n2.sheet,null);
  /* 思い出帳から読む */
  const rec=await run(`(()=>{openSheet('menu','record');const t=document.querySelector('#sheetBody').textContent;const row=[...document.querySelectorAll('#sheetBody .row')].find(x=>/日めの日記/.test(x.textContent));row.click();return JSON.stringify({has:/日記/.test(t),sheet,back:!!document.querySelector('#sheetWrap header .back')})})()`);
  const R=JSON.parse(rec);assert.ok(R.has);assert.equal(R.sheet,'diary');assert.ok(R.back,'back button to the memory book');
  console.log('Diary: readable from the memory book');
  /* 朝6時をまたぐと、ふだんのしくみで日記がしまわれる */
  const m=JSON.parse(await run(`(()=>{closeSheet();const a=S.res[0];dyWork(a,'build','bench');const n=S.diary.length;S.lastMorning=-1;morning();return JSON.stringify({n,m:S.diary.length})})()`));
  assert.equal(m.m,m.n+1,'morning() closes the diary');
  await run(`if(sheet)closeSheet()`);
  /* 思い出帳の再生（MEMRUN）では書かない */
  const z=await run(`(()=>{S.dy=null;MEMRUN=true;dyWork(S.res[0],'build','bench');const v=S.dy;MEMRUN=false;return JSON.stringify(v)})()`);
  assert.equal(z,'null');
  assert.deepEqual(errors,[]);await browser.close();console.log('Diary: ok');
})().catch(e=>{console.error(e);process.exit(1)});
