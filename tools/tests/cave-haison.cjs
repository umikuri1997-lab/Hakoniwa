/* 5階「地下の廃村」（cave-haison.js）：家の中を通らないと坂へ行けない・うらの窓は、とびおりるだけ（もどれない）・ゆかの穴は行き来できる・
   戸は家の中からだけあいて、あいたまま・うえたちねずみ（3びきのむれ・1ぴきが起きると、むれが起きる・かまれると、おなかが多くへる）・木のにんぎょう（ねずみが起きにくい） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'h'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      act=el=>CV.party.find(a=>a.elem===el),put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},wait=(f,sec)=>{for(let i=0;i<sec*10&&!f();i++)tick(.1);return f()},
      enter=(els,keep)=>{day();S.pt=500;caveEnter(els.map(nw),{},4);CV.sc=[];if(!keep)CV.en=[];return CV},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j),one=k=>fk(k)[0],all=[...Array(CVW*CVH).keys()];
    let C=enter(['fire','water','wind'],1);out.theme=C.F.theme;out.bk=CVBKFL[4];out.rel=CVREL[4];out.houses=(C.F.house||[]).length;out.hf=C.hf.reduce((a,b)=>a+b,0)>0;out.hw=C.hw.reduce((a,b)=>a+b,0)>0;
    /* うえたちねずみ：3びきで1つのむれ */
    {const R=C.en.filter(e=>e.type==='bk_nezu'),G={};for(const e of R)G[e.pk]=(G[e.pk]||0)+1;out.pack=[R.length>0,R.length===C.en.length,Object.values(G).every(n=>n===3)];
      const e=R[0],m=R.filter(q=>q.pk===e.pk&&q!==e);C.seen.fill(1);const a=C.party[0];put(a,e.cj);for(const q of C.party)if(q!==a)put(q,one('S'));for(const q of R)q.asleep=true;
      const k=all.find(j=>cvWalk(j)&&Math.hypot(cvX(j)-cvX(e.cj),cvY(j)-cvY(e.cj))<1.5&&j!==e.cj);put(a,k);cvFoe(e,0,0,performance.now());out.packWake=[!e.asleep,m.every(q=>!q.asleep)];
      out.wake=[cvWakeR(e)];C.dim=true;out.wake.push(cvWakeR(e));C.dim=false;S.flags.cvItem=S.flags.cvItem||{};S.flags.cvItem.rel_ningyo=1;out.wake.push(cvWakeR(e));C.dim=true;out.wake.push(cvWakeR(e));C.dim=false;delete S.flags.cvItem.rel_ningyo;
      const f=act('fire'),w=act('water');f.r.hunger=w.r.hunger=1000;cvHit(e,f);cvHit(e,w);out.bite=[Math.round(1000-f.r.hunger),Math.round(1000-w.r.hunger)]}
    caveAbort();
    C=enter(['fire','water','wind']);const S0=one('S'),R0=one('R'),D=fk('d');out.doors=D.length;
    out.shut=!cvBfs(S0,j=>j===R0);/* 戸があかないと、坂へは行けない */
    /* うらの窓：路地から、家の中へとびおりるだけ */
    {const v=one('v'),inn=all.find(j=>C.hf[j]&&cvAdj(j,v)),out0=all.find(j=>!C.hf[j]&&cvWalk(j)&&cvAdj(j,v));out.win=[cvStepOK(out0,v),cvStepOK(v,inn),cvStepOK(inn,v)]}
    /* ゆかの穴：横穴と、家の中を、行き来できる */
    {const z=one('z'),t=all.find(j=>!C.hf[j]&&cvWalk(j)&&cvAdj(j,z));out.hole=[C.hf[z]===1,cvStepOK(t,z),cvStepOK(z,t)]}
    /* 戸：そとからは、あかない（家の中へ行けないとき） */
    {const d=D.find(j=>cvY(j)<25),o=C.ob.get(d),st=all.find(j=>!C.hf[j]&&cvWalk(j)&&cvAdj(j,d));for(const a of C.party)put(a,st);out.tapOut=cvObjTap(o);cvUse(d,o);tick(3);out.outside=[!o.done,C.party.every(a=>!a.job)];
      /* 家の中からは、かんぬきをはずしてあく。あいたら、あいたまま（そとからも通れる） */
      const inn=all.find(j=>C.hf[j]&&cvAdj(j,d));for(const a of C.party)put(a,inn);cvUse(d,o);out.inside=wait(()=>o.done,20);out.walk=cvWalk(d)&&cvStepOK(st,d)&&cvStepOK(d,inn);C.seen.fill(1);caveRender(performance.now())}
    /* 窓から入って、中から戸をあけていくと、坂へ行ける */
    {for(const d of D)C.ob.get(d).done=true;out.route=!!cvBfs(S0,j=>j===R0)}
    caveAbort();
    /* 手がかり：食卓のいす。しらべると、木のにんぎょう */
    C=enter(['earth','fire']);{const K=fk('K'),st=all.find(j=>cvWalk(j)&&cvAdj(j,K[0]));for(const a of C.party)put(a,st);cvUse(K[0],C.ob.get(K[0]));tick(3);out.doll=!!C.loot.items.rel_ningyo;out.desc=BL.rel_ningyo.desc}
    caveAbort();
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'haison');assert.equal(r.bk,'bk_nezu','5階のバケモノ');assert.equal(r.rel,'ningyo','5階の道具');assert.equal(r.houses,3,'家は3けん');assert.deepEqual([r.hf,r.hw],[true,true]);
  assert.deepEqual(r.pack,[true,true,true],'ねずみは3びきで1つのむれ');assert.deepEqual(r.packWake,[true,true],'1ぴきが起きると、むれが起きる');
  assert.deepEqual(r.wake,[3.6,1.2,1.8,.6],'木のにんぎょうで、目をさます広さが1.8マス（光をしぼると0.6）');assert.deepEqual(r.bite,[80,100],'かまれると、火のせいれい80・ほか100');
  assert.equal(r.doors,3);assert.equal(r.shut,true,'戸があかないと、坂へ行けない');
  assert.deepEqual(r.win,[true,true,false],'窓から家の中へ、とびおりるだけ');assert.deepEqual(r.hole,[true,true,true],'ゆかの穴は行き来できる');
  assert.equal(r.tapOut,true);assert.deepEqual(r.outside,[true,true],'そとからは、あかない');assert.equal(r.inside,true,'家の中からあく');assert.equal(r.walk,true,'あいたら、あいたまま');
  assert.equal(r.route,true,'戸をあけていくと、坂へ行ける');assert.equal(r.doll,true,'食卓のいすから、木のにんぎょう');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
