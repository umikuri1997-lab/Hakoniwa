/* 6階「忘れられた神殿」（cave-shinden.js）：石像を3人でおしてたおすと、せなかが大穴の橋になる（ずっとたおれたまま）・
   光をおがむせきぞう（しぼっていないと、よってくる・しぼると、おがむ・おがんでいるのをたたくと起きる・見うしなうと、またおがむ）・
   おひさまのかがみ（しぼっていないとき、光の広さが広い）・手がかりのかがみの台 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;delete S.flags.cvSkDown;const out={};
    const nw=el=>{const q=mkRes(S,'h'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},wait=(f,sec)=>{for(let i=0;i<sec*10&&!f();i++)tick(.1);return f()},
      enter=(els,keep)=>{day();S.pt=500;caveEnter(els.map(nw),{},5);CV.sc=[];if(!keep)CV.en=[];return CV},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j),one=k=>fk(k)[0],all=[...Array(CVW*CVH).keys()];
    let C=enter(['fire','water','wind'],1);out.theme=C.F.theme;out.bk=CVBKFL[5];out.rel=CVREL[5];out.g=fk('G').length;out.b=C.sk.B.length;out.ab=C.sk.B.every(j=>C.ab[j]===1);
    /* 光をおがむせきぞう */
    {const R=C.en.filter(e=>e.type==='bk_seki');out.seki=[R.length>0,R.length===C.en.length,R.every(e=>e.asleep)];C.seen.fill(1);
      const e=R[0],a=C.party[0],far=all.find(j=>cvWalk(j)&&Math.hypot(cvX(j)-cvX(e.cj),cvY(j)-cvY(e.cj))>12);for(const q of C.party)put(q,far);
      const k=all.find(j=>{const d=Math.hypot(cvX(j)-cvX(e.cj),cvY(j)-cvY(e.cj));return cvWalk(j)&&d>4&&d<6&&cvLos(e.x,e.y-CVOY,cvX(j)+.5,cvY(j)+.5)});put(a,k);
      C.dim=true;cvFoe(e,0,0,performance.now());const s0=e.asleep;C.dim=false;cvFoe(e,0,0,performance.now());const s1=e.asleep;
      C.dim=true;cvFoe(e,0,0,performance.now());out.pray=[s0,s1,e.asleep];/* しぼっていると、おがんだまま・しぼらないと起きる・しぼると、また、おがむ */
      const n=all.find(j=>cvWalk(j)&&cvAdj(j,e.cj));put(a,n);a.r.hunger=1000;cvAttack(a,e);cvFoe(e,0,0,performance.now());out.prov=[!e.asleep,!!e.prov];/* たたくと起きる（しぼっていても） */
      e.stun=0;for(const q of C.party)put(q,far);cvFoe(e,1/30,3,performance.now());const p0=e.asleep;cvFoe(e,1/30,3,performance.now());out.lost=[p0,e.asleep];/* 見うしなうと、また、おがむ */
      a.r.hunger=1000;put(a,all.find(j=>cvWalk(j)&&cvAdj(j,cvCell(e))));e.asleep=false;e.prov=1;e.stun=0;e.atk=EN.bk_seki.atk;cvFoe(e,1,0,performance.now());out.hit=Math.round(1000-a.r.hunger);
      out.num=[EN.bk_seki.hp,EN.bk_seki.sp]}
    caveAbort();
    /* 石像：3人そろって、おしてたおす */
    C=enter(['fire','water']);const S0=one('S'),R0=one('R'),G=one('G');out.shut=!cvBfs(S0,j=>j===R0);
    for(const a of C.party)put(a,S0);cvUse(G,C.ob.get(G));tick(2);out.two=[C.party.every(a=>!a.job),!C.sk.down];
    caveAbort();
    C=enter(['fire','water','wind']);for(const a of C.party)put(a,one('S'));cvUse(one('G'),C.ob.get(one('G')));out.jobs=C.party.every(a=>a.job&&a.job.k==='topple');
    out.down=wait(()=>C.sk.down,240);out.flag=S.flags.cvSkDown===1;out.bridge=C.sk.B.every(j=>C.ab[j]===0&&cvWalk(j))&&!fk('G').length;out.route=!!cvBfs(one('S'),j=>j===one('R'));
    C.seen.fill(1);caveRender(performance.now());
    caveAbort();
    /* つぎに来たときも、たおれたまま */
    C=enter(['earth']);out.again=[C.sk.down,!!cvBfs(one('S'),j=>j===one('R'))];caveAbort();
    /* おひさまのかがみ */
    C=enter(['earth']);const L0=[cvSeeR(),cvLR()];S.flags.cvItem=S.flags.cvItem||{};S.flags.cvItem.rel_kagami=1;const L1=[cvSeeR(),cvLR()];C.dim=true;const L2=[cvSeeR(),cvLR()];delete S.flags.cvItem.rel_kagami;out.light=[L0,L1,L2];
    caveAbort();
    /* 手がかり：かがみの台。しらべると、おひさまのかがみ */
    C=enter(['earth','fire']);{const K=fk('K'),st=all.find(j=>cvWalk(j)&&cvAdj(j,K[0]));for(const a of C.party)put(a,st);cvUse(K[0],C.ob.get(K[0]));tick(3);out.mirror=!!C.loot.items.rel_kagami;out.desc=BL.rel_kagami.desc}
    C.seen.fill(1);caveRender(performance.now());caveAbort();delete S.flags.cvSkDown;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'shinden');assert.equal(r.bk,'bk_seki','6階のバケモノ');assert.equal(r.rel,'kagami','6階の道具');assert.equal(r.g,4,'石像は2×2');assert.ok(r.b>8&&r.ab,'たおれる所は、たおれるまで大穴');
  assert.deepEqual(r.seki,[true,true,true],'せきぞうは、はじめは、おがんでいる');assert.deepEqual(r.pray,[true,false,true],'しぼると、おがむ・しぼらないと、よってくる');
  assert.deepEqual(r.prov,[true,true],'たたくと、しぼっていても起きる');assert.deepEqual(r.lost,[false,true],'見うしなって5秒で、また、おがむ');assert.equal(r.hit,70,'たたかれると、おなか70');assert.deepEqual(r.num,[420,.35]);
  assert.equal(r.shut,true,'石像をたおさないと、坂へ行けない');assert.deepEqual(r.two,[true,true],'ふたりでは、おせない');
  assert.equal(r.jobs,true);assert.equal(r.down,true,'3人でおすと、たおれる');assert.equal(r.flag,true);assert.equal(r.bridge,true,'せなかが橋になる');assert.equal(r.route,true,'橋をわたって、坂へ行ける');
  assert.deepEqual(r.again,[true,true],'つぎに来ても、たおれたまま');
  assert.deepEqual(r.light,[[4.2,4.4],[5.4,5.6],[2,2.4]],'かがみ：しぼっていないとき5.4・5.6、しぼると2・2.4');
  assert.equal(r.mirror,true,'かがみの台から、おひさまのかがみ');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
