/* 10階「神の創造炉」（cave-ro.js）：いちばんおくの階。下へおりる坂はない・まん中の島に、根と土にくるまれた失敗した神 N（見るだけ・歩けない）・
   炉から谷の上へのびる大きなひび・炉にくべられたもの（通ったあとが、あつくなる）・手がかり（われた炉）から、ゆりかごのすず */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'h'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},
      enter=(els,keep)=>{day();S.pt=500;caveEnter(els.map(nw),{},9);CV.sc=[];if(!keep)CV.en=[];return CV},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j),all=[...Array(CVW*CVH).keys()];
    let C=enter(['fire','water','earth'],1);out.theme=C.F.theme;out.bk=CVBKFL[9];out.rel=CVREL[9];out.open=cvFlOpen();out.nFl=CVFLOORS.filter(f=>f).length;
    out.ro=[C.en.length,C.en.every(e=>e.type==='bk_ro')];out.noR=fk('R').length;
    const N=fk('N');out.N=N.length;out.Nwalk=N.some(j=>cvWalk(j));out.Ntop=N.filter(j=>C.ob.get(j).top).length;
    /* まん中の島へ行ける（見るだけ。そばまで） */
    const S0=fk('S')[0],near=all.find(j=>cvWalk(j)&&N.some(q=>cvAdj(j,q)));out.reach=!!cvBfs(S0,j=>j===near);
    /* ひび：北のはしまでの大穴（歩けない） */
    out.crack=[...Array(14).keys()].every(y=>C.ab[cvJ(28,y+1)]===1);
    /* 炉にくべられたもの：目をさまして歩くと、通ったあとが、あつい床になる */
    {const e=C.en[0];e.asleep=false;e.x=cvX(near)+.5;e.y=cvY(near)+.5+CVOY;e.cj=near;for(const a of C.party)put(a,S0);cvBakeTick(.1,.1,performance.now());out.hot=C.hotT.size>0}
    C.seen.fill(1);caveRender(performance.now());caveAbort();
    /* 手がかり：われた炉。しらべると、ゆりかごのすず */
    C=enter(['earth','fire']);{const K=fk('K'),st=all.find(j=>cvWalk(j)&&cvAdj(j,K[0]));for(const a of C.party)put(a,st);cvUse(K[0],C.ob.get(K[0]));tick(3);out.suzu=!!C.loot.items.rel_suzu;out.nK=K.length}
    C.seen.fill(1);caveRender(performance.now());caveAbort();
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'ro');assert.equal(r.bk,'bk_ro');assert.equal(r.rel,'suzu');assert.equal(r.open,10);assert.equal(r.nFl,10,'10階ぜんぶに地図がある');
  assert.ok(r.ro[0]>=5&&r.ro[1]);assert.equal(r.noR,0,'10階には、下へおりる坂はない');
  assert.equal(r.N,9);assert.ok(!r.Nwalk,'失敗した神は、歩けない');assert.equal(r.Ntop,1);assert.ok(r.reach,'まん中の島のそばまで行ける');assert.ok(r.crack,'大きなひび');
  assert.ok(r.hot,'通ったあとが、あつくなる');assert.ok(r.suzu&&r.nK>=3);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
