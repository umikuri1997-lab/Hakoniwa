/* きのうの日記：作業・できごと・ゆうべの守りが、朝にしめた日記に入り、紙が出る。章のはじめの子（草原フタバ・火山ホムラ）の絵日記（その日の絵と、その下の文。絵の物の話からはじまる。同じ日記はできない）が1ページめにのる（その子がいなければ、どちらもない）。思い出帳から読める。思い出帳の再生では書かない */
const assert=require('node:assert/strict');
(async()=>{const {browser,page,run,errors}=await require('../sim/boot.cjs')();
  await run(`document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;S.hold=0;if(sheet)closeSheet();`);
  const r=JSON.parse(await run(`(()=>{const a=S.res[0];S.dy=null;
    dyWork(a,'build','bench');dyWork(a,'build','bench');dyWork(a,'harvest','mugi');dyWork(a,'chop','');
    memo('x','はじめてのテスト');logEv('はじめてのテスト');
    const e={type:'koka',dead:false,x:a.x,y:a.y};S.ns={n:3,kill:3,lost:[],hurt:0,broke:0,boss:0};dyKill(a,'');dyKill(a,'');dyKill(null,'とげの罠で');
    const d0=S.dy.d;diaryClose();const L=S.diary[S.diary.length-1];
    return JSON.stringify({d0,d:L.d,w:L.w.map(x=>[x[3],x[4],x[5]]),m:L.m,k:L.k[a.name][2],o:L.o,ns:!!L.ns,dd:!!S.ns.dd,sheet,arg:sheetArg,title:document.querySelector('#sheetTitle').textContent,body:BK.pages.map(p=>p.textContent).join('|')})})()`));
  assert.deepEqual(r.w,[['build','bench',2],['harvest','mugi',1]],'work entries counted, unknown types skipped');
  assert.deepEqual(r.m,['はじめてのテスト'],'memo and log text merged once');
  assert.equal(r.k,2);assert.deepEqual(r.o,{'罠':1});assert.ok(r.ns&&r.dd,'last night is stored once');
  assert.equal(r.sheet,'diary');assert.equal(r.arg,'m');assert.equal(r.title,r.d+'日めの日記');
  for(const t of['みんなのしたこと','ベンチを建てた（2回）','はじめてのテスト','ゆうべの守り','2ひきを追いはらった','ゆうべのかつやく'])assert.ok(r.body.includes(t),'diary shows '+t);
  {const b=r.body,i=['はじめてのテスト','ゆうべのかつやく','ゆうべの守り','みんなのしたこと'].map(t=>b.indexOf(t));assert.ok(i[0]<i[1]&&i[1]<i[2]&&i[2]<i[3],'diary order: day page (events), mvp, night, work '+i);assert.equal(b.split('はじめてのテスト').length,2,'same event once')}
  console.log('Diary: work, events and last night are written and the paper opens in the morning');
  /* ゆうべのかつやく：追いはらった数＋守った数が2点いじょうでいちばん。おなじ点なら追いはらった数。たのしさ+10・思い出帳・ハンコ */
  const mv=JSON.parse(await run(`(()=>{closeSheet();while(S.res.length<3)S.res.push(mkRes(S,'テスト'+S.res.length,'fire',CX+S.res.length+.5,CY+.5));const [a,b,c]=S.res;S.dy=null;
    dyKill(a,'');dyGuard(b);dyGuard(b);dyKill(c,'');const one=dyBest({k:S.dy.k,g:S.dy.g});/* a1点・b2点・c1点 → b */
    S.dy=null;dyKill(a,'');dyKill(a,'');dyGuard(b);dyKill(b,'');const tie=dyBest({k:S.dy.k,g:S.dy.g});/* a2点(2体)・b2点(1体) → a */
    S.dy=null;dyKill(a,'');dyGuard(c);const low=dyBest({k:S.dy.k,g:S.dy.g});/* だれも2点にとどかない */
    S.dy=null;S.ns={n:2,kill:1,lost:[],hurt:0,broke:0,boss:0};dyKill(c,'');dyGuard(b);dyGuard(b);b.fun=50;const m0=(S.memo||[]).length;diaryClose();
    const L=S.diary[S.diary.length-1],body=document.querySelector('#sheetBody');
    const want=BK.pages.findIndex(p=>p.querySelector('.dyMvp'));const vis=()=>BK.at===want||BK.sp&&BK.at+1===want,flip=()=>new Promise(ok=>{if(!vis())document.querySelector('#sheetBody .mnx').click();setTimeout(ok,1200)});/* 1ページめは絵日記：点のページまでめくる */
    return flip().then(()=>new Promise(res=>setTimeout(()=>res(JSON.stringify({one:one&&one.nm,tie:tie&&tie.nm,low,b:b.name,a:a.name,fun:b.fun,mvp:L.mvp&&L.mvp.nm,memo:(S.memo||[]).slice(m0).map(x=>x[2]),txt:body.querySelector('.dyMvp')&&body.querySelector('.dyMvp').textContent,first:(()=>{const p=BK.pages[want];return vis()&&p&&p.firstElementChild&&p.firstElementChild.className})(),at:BK.at,pages:BK.pages.map(p=>p.className+'>'+[...p.children].map(c=>c.className+':'+((c.querySelector('h3')||{}).textContent||'')).join(',')),stamp:!!body.querySelector('.dyMvp .ustamp')})),700)))})()`));
  assert.equal(mv.one,mv.b,'guards count as points');assert.equal(mv.tie,mv.a,'tie goes to more kills');assert.equal(mv.low,null,'under 2 points: nobody');
  assert.equal(mv.mvp,mv.b);assert.equal(mv.fun,60,'fun +10');assert.ok(mv.memo.some(t=>t.includes('ゆうべのかつやく')),'memo');
  assert.ok(/2回まもった/.test(mv.txt),'mvp text '+mv.txt);assert.ok(/dyMvp/.test(mv.first),'mvp is at the top of the score page '+mv.first+' at '+mv.at+JSON.stringify(mv.pages));assert.ok(mv.stamp,'stamp');
  console.log('Diary: last night MVP');
  /* 本（book.js）：1ページめは思い出帳と同じ日のページ（絵日記・できごと）、2ページめは点の出る所（かつやく・守り・しごと）、あとはつぎのページ。長い一覧はページをまたぐ */
  const bk=JSON.parse(await run(`(()=>{closeSheet();const a=S.res[0];S.dy=null;for(let i=0;i<25;i++){dyEv('ながいテストのできごと'+i)}dyWork(a,'build','bench');dyWork(a,'harvest','mugi');
    S.ns={n:4,kill:3,lost:[],hurt:0,broke:0,boss:0};dyKill(a,'');dyKill(a,'');dyGuard(a);DYBK.k=null;diaryClose();
    const P=BK.pages,H=p=>[...p.querySelectorAll('.sec>h3')].map(h=>h.textContent);
    const k=P.findIndex(p=>p.querySelector('.dyMvp')),r={e:P[0].classList.contains('mdy')?1:0,k,n:P.length,h1:H(P[k]),rest:P.slice(k+1).map(H).flat(),ev:P.reduce((t,p)=>t+[...p.querySelectorAll('li')].filter(x=>/ながいテスト/.test(x.textContent)).length,0)};
    document.querySelector('#sheetBody .mnx').click();return new Promise(ok=>setTimeout(()=>{r.turn=BK.at;ok(JSON.stringify(r))},900))})()`));
  assert.ok(bk.n>=3,'diary has pages '+bk.n);
  assert.equal(bk.e,1,'page 1 is the picture diary '+JSON.stringify(bk));assert.deepEqual(bk.h1.slice(0,2),['ゆうべのかつやく','ゆうべの守り'],'score page after the day page '+bk.h1);assert.ok(bk.h1.concat(bk.rest).includes('きのうのしごと'),'work count');
  assert.ok(bk.rest.includes('みんなのしたこと')&&bk.rest.includes('ゆうべ追いはらった'),'others on later pages '+bk.rest);
  assert.equal(bk.ev,25,'long list is split, nothing lost');assert.ok(bk.turn>0,'next page');
  console.log('Diary: a book (book.js), picture diary on page 1, score on page 2, '+bk.n+' pages');
  /* 2回めの朝：ゆうべの守りを2回しまわない。書くことがなければ、日記をふやさない */
  const n2=JSON.parse(await run(`(()=>{closeSheet();const n=S.diary.length;diaryClose();return JSON.stringify({n,m:S.diary.length,sheet})})()`));
  assert.equal(n2.m,n2.n,'empty day is not stored');assert.equal(n2.sheet,null);
  /* 思い出帳から読む */
  const rec=await run(`(()=>{openSheet('menu','record');const d=[...document.querySelectorAll('#sheetBody .mdy')].filter(x=>x.querySelector('.dyd'));const days=new Set(d.map(x=>x.querySelector('.dyd').textContent));return JSON.stringify({n:d.length,day:d.length?d[0].querySelector('.dyd').textContent:'',ok:S.diary.every(e=>days.has(e.d+'日め'))})})()`);
  const R=JSON.parse(rec);assert.ok(R.ok,'every diary day has a page');assert.ok(/日め$/.test(R.day),R.day);
  console.log('Diary: the memory book is a diary, one page per day');
  /* 朝6時をまたぐと、ふだんのしくみで日記がしまわれる */
  const m=JSON.parse(await run(`(()=>{closeSheet();const a=S.res[0];dyWork(a,'build','bench');const n=S.diary.length;S.lastMorning=-1;morning();return JSON.stringify({n,m:S.diary.length})})()`));
  assert.equal(m.m,m.n+1,'morning() closes the diary');
  await run(`if(sheet)closeSheet()`);
  /* 絵日記：その日の絵（できた家具）と、その下のフタバの文 */
  const f=JSON.parse(await run(`(async()=>{closeSheet();const a=S.res.find(r=>r.name===POKO);S.dy=null;dyWork(S.res[0],'build','bench');dyNoon(12);
    const b=await new Promise(ok=>{const c=document.createElement('canvas');c.width=c.height=8;c.toBlob(ok,'image/jpeg')});const id=await phAdd({w:WD,d:S.dy.d,h:12,vn:'',at:1,b});S.dy.ph=id;S.dy.phK='built';S.dy.phN=BL.bench.name;S.dy.phP=2;
    diaryClose();const L=S.diary[S.diary.length-1];await new Promise(ok=>setTimeout(ok,600));
    return JSON.stringify({has:!!a,ft:L.ft,ph:L.ph,id,wx:L.wx,img:!!document.querySelector('#sheetBody .mdy .dyph img[src]'),first:BK.at===0&&BK.pages[0].classList.contains('mdy'),port:!!document.querySelector('#sheetBody .mdy .dyport'),tx:[...document.querySelectorAll('#sheetBody .mdy .dyTx')].map(x=>x.textContent).join(''),same:(()=>{const a=BK.pages.map(p=>p.querySelector('.dyTx')).filter(Boolean).map(x=>x.textContent).join('');closeSheet();MEMPG=0;openSheet('menu','record');const t=[...document.querySelectorAll('#sheetBody .mdy .dyTx')].map(x=>x.textContent);closeSheet();return !!a&&t.some(x=>x&&a.startsWith(x))})(),bn:BL.bench.name,body:document.querySelector('#sheetBody').textContent})})()`));
  assert.ok(f.has,'Futaba is in the village');assert.ok(f.ft&&f.ft.length>=3&&f.ft.length<=4,'Futaba writes 3-4 lines');assert.equal(f.ph,f.id,'photo of the day');assert.ok(f.wx,'weather of the day');
  assert.ok(f.img,'photo shown in the diary');assert.ok(f.first,'picture diary on the first page');assert.ok(f.same,'the memory book shows the same page');assert.ok(!f.port&&!f.body.includes('のひとこと'),'no icon, no heading');for(const t of f.ft)assert.ok(f.tx.includes(t.replace(/#[a-z ]+\|/,'')),'line shown: '+t);assert.ok(f.ft.join('').includes(f.bn),'the diary is about the picture: '+f.ft[1]);
  for(const t of f.ft)assert.ok(t.length<=60&&!/子|オオカゲ|タップ|最後の夜/.test(t),'line rules: '+t);
  console.log('Diary: picture diary with the new furniture and Futaba\'s lines');
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
