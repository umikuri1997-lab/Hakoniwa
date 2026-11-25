/* 9階「失敗した神の墓場」（cave-hakaba.js）：組みかけのほね・まもりの光でとどめをさすたびに、ほねの橋が3つに分けてかかる（ずっと橋のまま）・
   ほねが多くならんでいる・手がかり（ならべかけのほね）から組み立ての石板 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;delete S.flags.cvHoneN;const out={};
    const nw=el=>{const q=mkRes(S,'h'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},wait=(f,sec)=>{for(let i=0;i<sec*10&&!f();i++)tick(.1);return f()},
      enter=(els,keep)=>{day();S.pt=500;caveEnter(els.map(nw),{},8);CV.sc=[];if(!keep)CV.en=[];return CV},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j),one=k=>fk(k)[0],all=[...Array(CVW*CVH).keys()],
      light=e=>cvLightHit(cvX(cvCell(e)),cvY(cvCell(e)),1),segOpen=k=>{const H=CV.hone;return [...H.seg].filter(([,s])=>s===k).every(([j])=>CV.ab[j]===0&&cvWalk(j))};
    let C=enter(['fire','water','earth'],1);out.theme=C.F.theme;out.bk=CVBKFL[8];out.rel=CVREL[8];out.open=cvFlOpen();
    const hs=C.en.filter(e=>e.type==='bk_hone');out.hones=[hs.length,hs.length===C.en.length];out.V=C.hone.V.length;out.ab=C.hone.V.every(j=>C.ab[j]===1);
    out.segs=[0,1,2].map(k=>[...C.hone.seg].filter(([,s])=>s===k).length);
    const S0=one('S'),R0=one('R');out.shut=!cvBfs(S0,j=>j===R0);
    /* ほねをたおす：組みなおして起きる（橋はかからない）。まもりの光で、とどめ：橋の足になる */
    {const e=hs[0],a=C.party[0];e.hp=0;cvDefeat(e,a);out.down=[!!e.down,!e.dead];light(e);out.n1=[S.flags.cvHoneN,e.dead,segOpen(0),segOpen(1)];out.still=!cvBfs(S0,j=>j===R0)}
    /* 立っているほねが、光で倒れても、橋の足になる */
    {const e=hs[1];e.hp=1;e.asleep=false;light(e);out.n2=[S.flags.cvHoneN,e.dead,segOpen(1),segOpen(2)];out.still2=!cvBfs(S0,j=>j===R0)}
    /* あるいは、たたかいでたおして、くずれたまま、組みなおして起きる */
    {const e=hs[2],a=C.party[0];e.hp=0;cvDefeat(e,a);const t=C.t;C.t=e.down+1;cvBakeTick(.1,.1,performance.now());out.rebuilt=[!e.down,e.hp===e.max,S.flags.cvHoneN]}
    {const e=hs[3];e.hp=0;cvDefeat(e,C.party[0]);light(e);out.n3=[S.flags.cvHoneN,segOpen(2),!!cvBfs(S0,j=>j===R0),C.hone.V.every(j=>C.sb[j]===1)]}
    {const e=hs[4];e.hp=1;e.asleep=false;light(e);out.cap=S.flags.cvHoneN}
    /* 坂までおりると、9階のクリア（10階は、まだひらかない） */
    {const R=one('R'),a=C.party[0];put(a,cvBfsRing(R,3).find(q=>q!==R&&cvWalk(q)));tick(1);out.clr=S.cvClr;document.querySelectorAll('.idea-reveal').forEach(e=>e.remove());GIFT_ACTIVE=false}
    C.seen.fill(1);caveRender(performance.now());caveAbort();
    /* つぎに来ても、橋はかかったまま */
    C=enter(['earth']);out.again=[cvHoneCount(),C.hone.V.every(j=>C.ab[j]===0),!!cvBfs(one('S'),j=>j===one('R'))];C.seen.fill(1);caveRender(performance.now());caveAbort();
    /* 1つだけとどめをさしたあとは、1つめだけがかかる */
    S.flags.cvHoneN=1;C=enter(['earth']);out.part=[segOpen(0),!segOpen(1),!segOpen(2),!cvBfs(one('S'),j=>j===one('R'))];caveAbort();delete S.flags.cvHoneN;
    /* 手がかり：ならべかけのほね。しらべると、組み立ての石板 */
    C=enter(['earth','fire']);{const K=fk('K'),st=all.find(j=>cvWalk(j)&&cvAdj(j,K[0]));for(const a of C.party)put(a,st);cvUse(K[0],C.ob.get(K[0]));tick(3);out.sekiban=!!C.loot.items.rel_sekiban;out.nK=K.length}
    C.seen.fill(1);caveRender(performance.now());caveAbort();delete S.flags.cvHoneN;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'hakaba');assert.equal(r.bk,'bk_hone');assert.equal(r.rel,'sekiban');assert.ok(r.open>=9);
  assert.ok(r.hones[0]>=6&&r.hones[1],'ほねは、橋に要る数より多く');assert.ok(r.V>0&&r.ab);assert.deepEqual(r.segs.map(n=>n>0),[true,true,true]);
  assert.ok(r.shut);
  assert.deepEqual(r.down,[true,true]);assert.deepEqual(r.n1,[1,true,true,false]);assert.ok(r.still);
  assert.deepEqual(r.n2,[2,true,true,false]);assert.ok(r.still2);
  assert.deepEqual(r.rebuilt,[true,true,2]);
  assert.deepEqual(r.n3,[3,true,true,true]);assert.equal(r.cap,3);assert.equal(r.clr,9,'9階をクリアしても、10階はひらかない');
  assert.deepEqual(r.again,[3,true,true]);assert.deepEqual(r.part,[true,true,true,true]);
  assert.ok(r.sekiban&&r.nK>=3);
  assert.deepEqual(errors,[]);await browser.close();console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
