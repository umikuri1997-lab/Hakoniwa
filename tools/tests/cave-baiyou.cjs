/* 8階「異形の培養室」（cave-baiyou.js）：ふち道を、ガラスの入れ物（U）がふさぐ・まもりの光でわれる・
   見るだけの入れ物（Q）は、火のせいれいが近づくとわれる・名ふだ（K）をしらべると、むかしの道具・大穴の底の絵 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'y'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j);
    day();S.pt=500;caveEnter(['earth','fire','water'].map(nw),{},7);let C=CV;C.sc=[];
    out.theme=C.F.theme;out.hole=C.ab.some(v=>v);out.noN=fk('N').length===0&&fk('Y').length===0;out.U=fk('U').length;out.Q=fk('Q').length;out.K=fk('K').length;
    out.inside=C.en.filter(e=>e.gj!=null).length;out.solid=fk('U').concat(fk('Q')).every(j=>!cvWalk(j)&&C.g[j]===1&&!cvOpaque(j));
    /* 入口から坂までは、ふさぐガラスをわらないと行けない */
    const S0=fk('S')[0],R0=fk('R')[0];out.shut=!cvBfs(S0,j=>j===R0);
    /* ふさぐガラスの近くに来ると、まもりの光のことを知らせる */
    const U1=fk('U')[0],nb=[[1,0],[-1,0],[0,1],[0,-1],[0,2],[0,-2],[-2,0],[2,0]].map(([dx,dy])=>cvJ(cvX(U1)+dx,cvY(U1)+dy)).find(q=>cvWalk(q));for(const a of C.party)put(a,nb);cvGlassTick();out.hint=!!C.note.glassU;
    /* まもりの光で、そのへんのガラスがぜんぶわれる（ほかのマスは、そのまま） */
    S.pt=500;LIGHTCD=0;const far=fk('U').filter(j=>Math.hypot(cvX(j)-cvX(U1),cvY(j)-cvY(U1))>6).length;cvLightHit(cvX(U1),cvY(U1),2);out.broke=!C.ob.has(U1);out.farKeep=fk('U').length>=far&&far>0;
    for(const j of fk('U'))cvGlassBreak(j,0);out.open=!!cvBfs(S0,j=>j===R0);
    /* 名ふだ：しらべると、むかしの道具（読めない字の名ふだ） */
    const K0=fk('K')[0],kn=[[0,1],[0,-1],[1,0],[-1,0]].map(([dx,dy])=>cvJ(cvX(K0)+dx,cvY(K0)+dy)).find(q=>cvWalk(q));const a0=C.party[0];put(a0,kn);cvRelicLook(a0,K0,performance.now());tick(2);out.nafuda=!!C.loot.items.rel_nafuda;out.zk=CVRELD.nafuda.includes('ガラスの入れ物');
    out.bkzk=BKZK.bk_tame.includes('ガラス');
    /* 絵：入れ物・名ふだ・大穴の底 */
    C.seen.fill(1);for(const e of C.en)e.asleep=true;caveRender(performance.now());caveAbort();
    S.cvClr=7;out.open8=cvFlOpen();return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'cradle');assert.equal(r.hole,true,'大穴');assert.equal(r.noN,true,'8階に、ゆりかごと、かげはない（かげは10階）');
  assert.equal(r.U,4,'ふさぐ入れ物は、2か所で2つずつ');assert.ok(r.Q>=6,'見るだけの入れ物');assert.equal(r.K,5,'名ふだ');assert.equal(r.inside,r.U+r.Q,'入れ物ごとに、ためしのからだ');assert.equal(r.solid,true,'入れ物は、歩けない・見とおせる');
  assert.equal(r.shut,true,'ガラスをわらないと、坂へ行けない');assert.equal(r.hint,true);assert.equal(r.broke,true,'まもりの光でわれる');assert.equal(r.farKeep,true,'遠くの入れ物は、そのまま');assert.equal(r.open,true,'わると、坂へ行ける');
  assert.equal(r.nafuda,true,'名ふだをしらべると、むかしの道具');assert.equal(r.zk,true);assert.equal(r.bkzk,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
