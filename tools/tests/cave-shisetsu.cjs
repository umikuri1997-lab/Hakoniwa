/* 7階「力を奪う施設」（cave-shisetsu.js）：くいを3本、ひとりずつぬくと、根の橋が大穴の中の島（坂）へかかる（ずっと橋のまま）・
   ぬいているあいだ、そのせいれいは、ほかの指示をきかない・ゆりかごのみはりは、ぬいていないくいのそばのせいれいをねらう・
   炉のふいご（深い階で、いるだけでへるおなか）・手がかりの管の口 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;delete S.flags.cvKuiB;delete S.flags.cvKuiDone;const out={};
    const nw=el=>{const q=mkRes(S,'h'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},wait=(f,sec)=>{for(let i=0;i<sec*10&&!f();i++)tick(.1);return f()},
      enter=(els,keep)=>{day();S.pt=500;caveEnter(els.map(nw),{},6);CV.sc=[];if(!keep)CV.en=[];return CV},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j),one=k=>fk(k)[0],all=[...Array(CVW*CVH).keys()];
    let C=enter(['fire','water','wind'],1);out.theme=C.F.theme;out.bk=CVBKFL[6];out.rel=CVREL[6];out.n=fk('n').length;out.J=C.kui.J.length;out.ab=C.kui.J.every(j=>C.ab[j]===1);
    out.mi=[C.en.length>0,C.en.every(e=>e.type==='bk_mi')];
    /* ゆりかごのみはり：ぬいていないくいのそばのせいれいをねらう */
    {const e=C.en[0],a=C.party[0],n=one('n'),st=all.find(j=>cvWalk(j)&&cvAdj(j,n));for(const q of C.party)put(q,st);
      e.x=cvX(st)+6.5;e.y=cvY(st)+.5+CVOY;e.tg=null;const t0=cvPatrol(e,0);C.ob.get(n).done=true;e.tg=null;const t1=cvPatrol(e,0);C.ob.get(n).done=false;out.guard=[t0,t1]}
    caveAbort();
    /* くいをぬかないと、坂へ行けない */
    C=enter(['fire','water','wind']);const S0=one('S'),R0=one('R');out.shut=!cvBfs(S0,j=>j===R0);
    /* 1本ぬく：ぬいているあいだ、ほかの指示をきかない */
    {const L=C.kui.L;for(const a of C.party)put(a,S0);cvUse(L[0],C.ob.get(L[0]));const a=C.party.find(q=>q.job&&q.job.k==='kui');out.one=!!a&&C.party.filter(q=>q.job).length===1;
      wait(()=>a.job&&a.job.on,60);const p0=[a.x,a.y];cvGo(S0);tick(.5);out.lock=[a.job&&a.job.k==='kui',a.x===p0[0]&&a.y===p0[1]];
      const t0=C.t;wait(()=>C.ob.get(L[0]).done,60);out.pulled=C.ob.get(L[0]).done&&!a.job;out.bit=S.flags.cvKuiB;out.still=!cvBfs(S0,j=>j===R0);
      out.tap=cvObjTap(C.ob.get(L[0]))}
    caveAbort();
    /* つぎに来ても、ぬけたまま。のこりの2本を、ふたりで同時に */
    C=enter(['fire','water']);{const L=C.kui.L;out.keep=C.ob.get(L[0]).done&&!C.ob.get(L[1]).done;
      const[a,b]=C.party;put(a,all.find(j=>cvWalk(j)&&cvAdj(j,L[1])));put(b,all.find(j=>cvWalk(j)&&cvAdj(j,L[2])));cvUse(L[1],C.ob.get(L[1]));cvUse(L[2],C.ob.get(L[2]));
      out.two=[a.job&&a.job.j===L[1],b.job&&b.job.j===L[2]];out.down=wait(()=>C.kui.done,120);out.flag=S.flags.cvKuiDone===1;
      out.bridge=C.kui.J.every(j=>C.ab[j]===0&&cvWalk(j));out.route=!!cvBfs(one('S'),j=>j===one('R'));out.rim=cvRimCells().every(j=>!C.sb[j])}
    C.seen.fill(1);caveRender(performance.now());caveAbort();
    C=enter(['earth']);out.again=[C.kui.done,!!cvBfs(one('S'),j=>j===one('R'))];C.seen.fill(1);caveRender(performance.now());caveAbort();
    /* 炉のふいご：7階で、いるだけでへるおなか */
    {C=enter(['earth']);const a=C.party[0],h=a.r.hunger;cvActor(a,1,0,performance.now());const d0=h-a.r.hunger;S.flags.cvItem=S.flags.cvItem||{};S.flags.cvItem.rel_fuigo=1;const h1=a.r.hunger;cvActor(a,1,0,performance.now());const d1=h1-a.r.hunger;delete S.flags.cvItem.rel_fuigo;
      out.fuigo=[+d0.toFixed(3),+d1.toFixed(3),CVDEEPF.length];out.desc=BL.rel_fuigo.desc;caveAbort()}
    /* 手がかり：装置の管の口。しらべると、炉のふいご */
    C=enter(['earth','fire']);{const K=fk('K'),st=all.find(j=>cvWalk(j)&&cvAdj(j,K[0]));for(const a of C.party)put(a,st);cvUse(K[0],C.ob.get(K[0]));tick(3);out.fuigoGot=!!C.loot.items.rel_fuigo}
    C.seen.fill(1);caveRender(performance.now());caveAbort();delete S.flags.cvKuiB;delete S.flags.cvKuiDone;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'shisetsu');assert.equal(r.bk,'bk_mi','7階のバケモノ');assert.equal(r.rel,'fuigo','7階の道具');assert.equal(r.n,3,'くいは3本');assert.ok(r.J>8&&r.ab,'根の橋がかかる所は、かかるまで大穴');
  assert.deepEqual(r.mi,[true,true],'7階のバケモノは、ゆりかごのみはり');assert.deepEqual(r.guard,[true,false],'ぬいていないくいのそばのせいれいをねらう');
  assert.equal(r.shut,true,'くいをぬかないと、坂へ行けない');assert.equal(r.one,true,'ひとりでぬく');assert.deepEqual(r.lock,[true,true],'ぬいているあいだ、ほかの指示をきかない');
  assert.equal(r.pulled,true,'4でぬける');assert.equal(r.bit,1);assert.equal(r.still,true,'1本では、橋はかからない');assert.equal(r.tap,false,'ぬいたくいは、タップできない');
  assert.equal(r.keep,true,'ぬいたくいは、つぎに来ても、ぬけたまま');assert.deepEqual(r.two,[true,true],'2本を同時に、べつのせいれいがぬける');
  assert.equal(r.down,true,'3本ぬくと、根の橋がかかる');assert.equal(r.flag,true);assert.equal(r.bridge,true);assert.equal(r.route,true,'橋をわたって、坂へ行ける');assert.equal(r.rim,true,'橋は、大穴のふちではない');
  assert.deepEqual(r.again,[true,true],'つぎに来ても、橋のまま');
  assert.deepEqual(r.fuigo,[+(.2+.05).toFixed(3),+(.1+.05).toFixed(3),10],'炉のふいご：7階0.2→0.1（立っている分0.05をたす）');
  assert.equal(r.fuigoGot,true,'管の口から、炉のふいご');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
