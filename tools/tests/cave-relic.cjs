/* むかしの道具（cave-relic.js）：手がかりの物（K）をしらべると、その階の道具が見つかる・出たら村の家具と図鑑に入る・洞窟でのふしぎな力・バケモノの図鑑 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'b'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      act=el=>CV.party.find(a=>a.elem===el),put=(a,x,y)=>{a.x=x+.5;a.y=y+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=cvJ(x,y)},
      tick=(sec)=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},
      enter=(fl,els)=>{day();S.pt=500;caveEnter(els.map(nw),{},fl);CV.sc=[];return CV},
      mk=(t,x,y,o)=>Object.assign({id:CV.eid++,type:t,x:x+.5,y:y+.5+CVOY,hp:EN[t].hp,max:EN[t].hp,spawned:true,asleep:false,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:cvJ(x,y)},o||{}),
      open=C=>{for(let j=0;j<CVW*CVH;j++)if(cvWalk(j)){const x=cvX(j),y=cvY(j);if([[1,0],[2,0],[3,0],[0,1],[1,1],[2,1]].every(([dx,dy])=>cvWalk(cvJ(x+dx,y+dy))))return[x,y]}};
    const RK=CVREL.filter(Boolean);out.chips=RK.every(k=>BL['rel_'+k]&&BL['rel_'+k].relic&&!!cvChipOf('rel_'+k));out.n=RK.length;out.rel=CVREL.slice();
    /* 階ごとに、手がかりの物をしらべて道具を見つける */
    out.found=[];
    for(let fl=0;fl<CVFLOORS.length;fl++){if(!CVFLOORS[fl])continue;const C=enter(fl,['earth','fire','water']);C.en=[];const K=[...C.ob].find(([,o])=>o.k==='K'||o.k==='Y');if(!K){out.found.push('noK'+fl);caveAbort();continue}
      const a=act('earth'),st=[...Array(CVW*CVH).keys()].find(j=>cvWalk(j)&&cvAdj(j,K[0]));put(a,cvX(st),cvY(st));for(const q of C.party)if(q!==a)put(q,cvX(st),cvY(st));
      cvUse(K[0],K[1]);for(let i=0;i<60&&!C.loot.items['rel_'+CVREL[C.fl]];i++)tick(.1);out.found.push(CVREL[C.fl]+':'+!!C.loot.items['rel_'+CVREL[C.fl]]);caveExit(true);for(const p of document.querySelectorAll('.pxpopw'))p.remove();GIFT_ACTIVE=false}
    const GOT=['kui','bin','suisho','tsuru','ningyo','nafuda'];out.rec=GOT.every(k=>S.relRec&&S.relRec['rel_'+k]&&(S.inv['rel_'+k]||0)>0);out.on=GOT.every(k=>relOn(k));/* 地図のまだない階（R4・R5）の道具は、ためしに、もたせてたしかめる */for(const k of['fuigo','sekiban','suzu']){S.flags.cvItem['rel_'+k]=1;S.relRec['rel_'+k]=1}
    /* 2回めは、もう出ない */
    {const C=enter(0,['earth']);const K=[...C.ob].find(([,o])=>o.k==='K'),a=act('earth'),st=[...Array(CVW*CVH).keys()].find(j=>cvWalk(j)&&cvAdj(j,K[0]));put(a,cvX(st),cvY(st));cvUse(K[0],K[1]);tick(3);out.again=!C.loot.items.rel_kui;caveAbort()}
    /* からの水晶：光すいのそばでも光が小さくならない */
    {const C=enter(1,['earth','fire','water']);C.en=[];const[x,y]=open(C);for(const a of C.party)put(a,x,y);const l0=cvLR();C.en.push(mk('bk_sui',x+2,y));cvBakeTick(0,0,performance.now());out.suisho=cvLR()===l0;caveAbort()}
    /* 黒い水のびん：夜の水のかたまりが、わかれない */
    {const C=enter(2,['earth','fire','water']);C.en=[];const[x,y]=open(C);for(const a of C.party)put(a,x,y+1);const e=mk('bk_yoru',x+3,y);C.en.push(e);hurtEn(e,20,{});cvBakeTick(0,0,performance.now());out.bin=C.en.length===1;caveAbort()}
    /* 名ふだ：声のこだまで、足がすくまない */
    {const C=enter(0,['earth','fire','water']);C.en=[];cvBakeEnter(C);const s=C.sc.find(q=>q.k==='koe');s.cd=0;tick(.1);const a=act('earth');s.x=Math.floor(a.x);s.y=Math.floor(a.y-CVOY);s.path=[];tick(.1);out.nafuda=C.party.every(q=>!(q.frzU>performance.now()))&&!s.on;caveAbort()}
    /* ゆりかごのすず：えさが3マスまで近づくと、正体をあらわす */
    {const C=enter(2,['earth','fire','water']);C.en=[];cvBakeEnter(C);const s=C.sc.find(q=>q.k==='esa');C.sc=[s];s.cd=0;tick(.1);const a=act('earth');s.x=Math.floor(a.x)+2;s.y=Math.floor(a.y-CVOY);s.path=[];s.lured=1;const h=a.r.hunger;cvBakeTick(0,.01,performance.now());out.suzu=s.rev>0&&!s.bite&&a.r.hunger===h;caveAbort()}
    /* 炉のふいご：あつい床で、おなかがへらない */
    {const C=enter(7,['earth','fire','water']);C.en=[];const[x,y]=open(C);const ea=act('earth');put(ea,x,y);C.hotT.set(cvJ(x,y),C.t+100);const h=ea.r.hunger;cvBakeTick(1,0,performance.now());out.fuigo=ea.r.hunger===h;caveAbort()}
    /* 図鑑 */
    S.bkRec={bk_kui:1,sc_koe:1,sc_te:1};ZKW=WD;const b=document.createElement('div');ZKT=11;zukanBody(b);const b2=document.createElement('div');ZKT=12;zukanBody(b2);
    out.zk=[zkCount(11),zkTotal(11),zkCount(12),zkTotal(12)];out.zkTx=b.textContent.includes('さびたくい')&&b2.textContent.includes('声のこだま');
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.chips,true,'10の道具の家具とチップ');assert.equal(r.n,10);assert.deepEqual(r.rel,['kui','bin','suisho','tsuru','ningyo','kagami','fuigo','nafuda','sekiban','suzu'],'階ごとの道具（STORY.md）');
  assert.deepEqual(r.found,['kui:true','bin:true','suisho:true','tsuru:true','ningyo:true','nafuda:true'],'地図のある階では、手がかりの物から道具が見つかる');
  assert.equal(r.rec,true,'もちものと図鑑に入る');assert.equal(r.on,true);assert.equal(r.again,true,'同じ道具は1回だけ');
  assert.equal(r.suisho,true,'からの水晶');assert.equal(r.bin,true,'黒い水のびん');assert.equal(r.nafuda,true,'名ふだ');assert.equal(r.suzu,true,'ゆりかごのすず');assert.equal(r.fuigo,true,'炉のふいご');
  assert.deepEqual(r.zk,[9,9,3,13],'図鑑の数');assert.equal(r.zkTx,true,'図鑑に出る');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
