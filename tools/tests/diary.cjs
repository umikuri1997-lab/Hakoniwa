/* きのうの日記：作業・できごと・ゆうべの守りが、朝にしめた日記に入り、紙が出る。章のはじめの子（草原フタバ・火山ホムラ）のひとこと（同じ日記はできない）と昼の写真ものる（その子がいなければ、どちらもない）。思い出帳から読める。思い出帳の再生では書かない */
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
  {const b=r.body,i=['ゆうべの守り','できごと','みんなのしたこと'].map(t=>b.indexOf(t));assert.ok(i[0]<i[1]&&i[1]<i[2],'diary order: night, events, work '+i)}
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
  /* フタバのひとことと、その日の昼の写真 */
  const f=JSON.parse(await run(`(async()=>{closeSheet();const a=S.res.find(r=>r.name===POKO);S.dy=null;dyWork(S.res[0],'build','bench');dyNoon(12);
    const b=await new Promise(ok=>{const c=document.createElement('canvas');c.width=c.height=8;c.toBlob(ok,'image/jpeg')});const id=await phAdd({w:WD,d:S.dy.d,h:12,vn:'',at:1,b});S.dy.ph=id;
    diaryClose();const L=S.diary[S.diary.length-1];await new Promise(ok=>setTimeout(ok,300));
    return JSON.stringify({has:!!a,ft:L.ft,ph:L.ph,id,wx:L.wx,img:!!document.querySelector('#sheetBody .dyPh img[src]'),body:document.querySelector('#sheetBody').textContent})})()`));
  assert.ok(f.has,'Futaba is in the village');assert.ok(f.ft&&f.ft.length>=3&&f.ft.length<=4,'Futaba writes 3-4 lines');assert.equal(f.ph,f.id,'photo of the day');assert.ok(f.wx,'weather of the day');
  assert.ok(f.img,'photo shown in the diary');assert.ok(f.body.includes('フタバのひとこと'),'note shown');for(const t of f.ft)assert.ok(f.body.includes(t.replace(/#[a-z ]+\|/,'')),'line shown: '+t);
  for(const t of f.ft)assert.ok(t.length<=60&&!/子|オオカゲ|タップ|最後の夜/.test(t),'line rules: '+t);
  console.log('Diary: Futaba\'s note and the noon photo');
  /* 同じできごとの日がつづいても、同じ日記はできない。同じ文も、しゅるいの文をぜんぶ使うまで出ない */
  const u=JSON.parse(await run(`(()=>{closeSheet();const a=S.res.find(r=>r.name===POKO),T=new Set(),seen={};let dupT=0,dupL=0;S.dyU={};S.dyTx=[];
    for(let i=0;i<150;i++){const e={d:5,w:[[S.res[0].name,'earth',null,'build','bench',1]],m:[],k:{},o:{},wx:'sun1'},L=dyNote(e,a),t=L.join('|');if(T.has(t))dupT++;T.add(t);
      if(i<20){const o=L[0];if(seen[o])dupL++;seen[o]=1}}
    return JSON.stringify({dupT,dupL,n:T.size,o:DYOPEN.sun1.length})})()`));
  assert.equal(u.dupT,0,'no two diaries are the same');assert.ok(u.o<=20&&u.dupL<=20-u.o,'openers do not repeat until all are used');
  console.log('Diary: '+u.n+' different notes in a row');
  /* フタバがいないときは、ひとことも写真もない */
  const g=JSON.parse(await run(`(()=>{closeSheet();const keep=S.res.slice();S.res=S.res.filter(r=>r.name!==POKO);S.dy=null;dyEv('いなくなったテスト');S.dy.ph=12345;diaryClose();const L=S.diary[S.diary.length-1];S.res=keep;closeSheet();return JSON.stringify({ft:L.ft||null,ph:L.ph||null})})()`));
  assert.equal(g.ft,null,'no note without Futaba');assert.equal(g.ph,null,'no photo without Futaba');
  console.log('Diary: no note and no photo when Futaba is gone');
  /* 思い出帳の再生（MEMRUN）では書かない */
  const z=await run(`(()=>{S.dy=null;MEMRUN=true;dyWork(S.res[0],'build','bench');const v=S.dy;MEMRUN=false;return JSON.stringify(v)})()`);
  assert.equal(z,'null');
  assert.deepEqual(errors,[]);
  /* 火山：ホムラが、ホムラの言いかたで書く。いなければ、ひとことも写真もない */
  {const V=await require('../sim/boot.cjs')({world:1});
    const v=JSON.parse(await V.run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;const h=dyWriter();if(!h)return JSON.stringify({name:null});S.dyU={};S.dyTx=[];const out=[];
      for(let i=0;i<30;i++)out.push(...dyNote({d:5,w:[[h.name,h.elem,null,'build','bench',1]],m:[],k:{},o:{},wx:'sun1'},h));
      S.dy=null;dyEv('テスト');S.dy.ph=1;diaryClose();const L=S.diary[S.diary.length-1];
      const keep=S.res.slice();S.res=S.res.filter(r=>r!==h);S.dy=null;dyEv('テスト2');S.dy.ph=2;diaryClose();const G=S.diary[S.diary.length-1];S.res=keep;
      return JSON.stringify({name:h.name,boku:out.filter(t=>/ぼく/.test(t)).length,atai:out.filter(t=>/あたい/.test(t)).length,ft:!!L.ft,fw:L.fw&&L.fw[0],ph:L.ph,gft:G.ft||null,gph:G.ph||null})})()`));
    assert.equal(v.name,'ホムラ','Homura writes in the volcano');assert.equal(v.boku,0,'Homura does not say ぼく');assert.ok(v.atai>0,'Homura says あたい');
    assert.ok(v.ft&&v.fw==='ホムラ'&&v.ph===1,'note and photo');assert.equal(v.gft,null);assert.equal(v.gph,null,'no note or photo without Homura');
    assert.deepEqual(V.errors,[]);await V.browser.close();console.log('Diary: Homura writes in the volcano')}
  await browser.close();console.log('Diary: ok');
})().catch(e=>{console.error(e);process.exit(1)});
