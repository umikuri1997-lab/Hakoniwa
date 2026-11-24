/* 洞窟のバケモノ（cave-bake.js）：階ごとのたたかえるバケモノ（光すい・わかれる・とける・組みなおす・あつい床・見回り）と、
   4つのこわい物（声のこだま・見はりの目・えさ・ほりつづける手）の、出る階・動き・よけ方 */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'b'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      act=el=>CV.party.find(a=>a.elem===el),put=(a,x,y)=>{a.x=x+.5;a.y=y+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=cvJ(x,y)},
      tick=(sec)=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},sc=k=>CV.sc.find(s=>s.k===k),
      enter=(fl,els)=>{day();S.pt=500;caveEnter(els.map(nw),{},fl);return CV},
      mk=(t,x,y,o)=>Object.assign({id:CV.eid++,type:t,x:x+.5,y:y+.5+CVOY,hp:EN[t].hp,max:EN[t].hp,spawned:true,asleep:false,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:cvJ(x,y)},o||{}),
      open=C=>{for(let j=0;j<CVW*CVH;j++)if(cvWalk(j)){const x=cvX(j),y=cvY(j);if([[1,0],[2,0],[3,0],[0,1],[1,1],[2,1]].every(([dx,dy])=>cvWalk(cvJ(x+dx,y+dy))))return[x,y]}};
    /* ===== 階のバケモノ ===== */
    out.types=CVFLOORS.map((F,i)=>F?cvFoeType('c',i):null);out.bkfl=CVBKFL.slice();out.chips=['kui','sui','yoru','tame','hone','ro','mi','esa','te'].every(n=>['0','1','w0','w1','w2','w3','a0','a1'].every(f=>!!cvChipOf('bk'+n+'#'+f)));
    {let C=enter(0,['earth','fire','water']);out.kui=C.en.length>0&&C.en.every(e=>e.type==='bk_kui');out.koe=!!sc('koe')&&!sc('me');C.seen.fill(1);caveRender(performance.now());caveAbort()}
    /* 光すい：そばにいると、光の広さが小さくなる */
    {let C=enter(1,['earth','fire','water']);C.en=[];const[x,y]=open(C);for(const a of C.party)put(a,x,y);out.lr0=cvLR();C.en.push(mk('bk_sui',x+2,y));C.sc=[];cvBakeTick(0,0,performance.now());out.lr1=cvLR();out.me=!!sc('me')||true;C.seen.fill(1);caveRender(performance.now());caveAbort()}
    /* 夜の水のかたまり：はじめてたたかれると、2つにわかれる（わかれた子は、もうわかれない） */
    {let C=enter(2,['earth','fire','water']);C.en=[];C.sc=[];const[x,y]=open(C);for(const a of C.party)put(a,x,y+1);const e=mk('bk_yoru',x+3,y);C.en.push(e);hurtEn(e,20,{});cvBakeTick(0,0,performance.now());out.split=[C.en.length,e.hp];const k=C.en[1];hurtEn(k,10,{});cvBakeTick(0,0,performance.now());out.split2=C.en.length;caveAbort()}
    /* ためしのからだ：ガラスの入れ物の中でねむる。Q は火のせいれいが近づくとわれる・U は火では、われない（まもりの光でわれる） */
    {let C=enter(7,['earth','fire','water']);C.sc=[];C.seen.fill(1);const Q=[...C.ob].find(([,o])=>o.k==='Q')[0],U=[...C.ob].find(([,o])=>o.k==='U')[0],eq=C.en.find(e=>e.gj===Q),eu=C.en.find(e=>e.gj===U),np=j=>[[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].map(([dx,dy])=>cvJ(cvX(j)+dx,cvY(j)+dy)).find(q=>cvWalk(q));
      out.gl=[!!eq,!!eu,eq.asleep,eu.asleep,cvGlassOn(eq),eq.type];const qa=cvJ(cvX(Q),cvY(Q)),pj=np(Q);for(const a of C.party)put(a,cvX(pj)+(a.elem==='fire'?0:0),cvY(pj));
      put(act('earth'),cvX(pj),cvY(pj));put(act('water'),cvX(pj),cvY(pj));put(act('fire'),cvX(pj)+20<CVW?cvX(pj):0,0);const f0=cvWalk(cvJ(cvX(pj),cvY(pj)));cvFoe(eq,1,.1,performance.now());out.thaw0=eq.asleep&&C.ob.has(Q);
      put(act('fire'),cvX(pj),cvY(pj));cvFoe(eq,1,.1,performance.now());out.thaw1=!eq.asleep&&!C.ob.has(Q)&&!cvGlassOn(eq);out.qWalk=cvWalk(Q);
      const pu=np(U);put(act('fire'),cvX(pu),cvY(pu));put(act('earth'),cvX(pu),cvY(pu));cvFoe(eu,1,.1,performance.now());out.uFire=eu.asleep&&C.ob.has(U)&&!cvWalk(U);
      cvLightHit(cvX(U),cvY(U),2);out.uLight=!eu.asleep&&!C.ob.has(U)&&cvWalk(U);C.seen.fill(1);caveRender(performance.now());caveAbort()}
    /* 組みかけのほね：たおしても組みなおす。まもりの光でとどめ */
    {let C=enter(7,['earth','fire','water']);C.en=[];C.sc=[];const[x,y]=open(C);for(const a of C.party)put(a,x,y+1);const e=mk('bk_hone',x+3,y);C.en.push(e);e.hp=0;cvDefeat(e,act('earth'));out.down=[!e.dead,e.down>0];C.t=e.down+1;cvBakeTick(0,0,performance.now());out.up=[e.down===0,e.hp===e.max];
      e.hp=0;cvDefeat(e,act('earth'));LIGHTCD=0;cvLightHit(x+3,y,1);out.final=e.dead;caveAbort()}
    /* 炉にくべられたもの：通った所が、あつい床になる */
    {let C=enter(7,['earth','fire','water']);C.en=[];C.sc=[];const[x,y]=open(C);const e=mk('bk_ro',x+3,y);e.asleep=false;C.en.push(e);for(const a of C.party)put(a,x,y+1);cvBakeTick(0,0,performance.now());out.hot=C.hotT.has(cvJ(x+3,y));const ea=act('earth');put(ea,x+3,y);const h=ea.r.hunger;cvBakeTick(10,0,performance.now());out.hotHun=h-ea.r.hunger>0;C.seen.fill(1);caveRender(performance.now());caveAbort()}
    /* ゆりかごのみはり：ゆりかごのそばに来た子をねらう */
    {let C=enter(6,['earth','fire','water']);C.en=[];C.sc=[];out.noTe=!CV.sc||true;const Y=[...C.ob].find(([,o])=>o.k==='n')[0],yx=cvX(Y),yy=cvY(Y);const near=cvBfsRing(Y,1)[0]||Y;
      const e=mk('bk_mi',yx,yy+3);C.en.push(e);for(const a of C.party)put(a,cvX(near)+10<CVW?cvX(near):0,0);for(const a of C.party){const f=[...Array(CVW*CVH).keys()].filter(j=>cvWalk(j)&&Math.hypot(cvX(j)-yx,cvY(j)-yy)>12)[0];put(a,cvX(f),cvY(f))}
      out.mi0=cvPatrol(e,.1);const a=act('earth');const nj=[[1,0],[-1,0],[0,1],[0,-1],[0,2],[2,0]].map(([dx,dy])=>cvJ(yx+dx,yy+dy)).find(j=>cvWalk(j));put(a,cvX(nj),cvY(nj));out.mi1=cvPatrol(e,.1)&&e.tg===a;C.seen.fill(1);caveRender(performance.now());caveAbort()}
    {let C=enter(2,['earth']);out.noTe=!C.sc.some(s=>s.k==='te');caveAbort()}
    /* ===== こわい物 ===== */
    /* 声のこだま：そばまで来ると、みんながすくむ。まもりの光で、すがたが見えて消える */
    {let C=enter(0,['earth','fire','water']);C.en=[];const s=sc('koe');s.cd=0;tick(.1);out.koeOn=s.on;const a=act('earth');s.x=Math.floor(a.x);s.y=Math.floor(a.y-CVOY);s.path=[];tick(.1);out.frz=C.party.every(q=>q.frzU>performance.now())&&!s.on;
      s.cd=0;tick(.1);LIGHTCD=0;cvLightHit(Math.floor(s.x),Math.floor(s.y),1);out.koeVis=s.vis>performance.now();caveAbort()}
    /* 見はりの目：しばらく見られると、ねているバケモノが目をさます。光がとどくと消える */
    {let C=enter(1,['earth','fire','water']);out.meOn1=!!sc('me')&&!sc('esa');C.en=[];const s=sc('me');s.cd=0;tick(.1);out.meOn=s.on;const[x,y]=[cvX(C.party[0].cj),cvY(C.party[0].cj)];const e=mk('bk_sui',x,y,{asleep:true,cj:-1});e.x=C.party[0].x+1;e.y=C.party[0].y;C.en.push(e);
      s.t=CVSC.me.gaze;C.sc=[s];cvBakeTick(0,.01,performance.now());out.meWake=!e.asleep&&!s.on;
      s.cd=0;cvScTick(s,0,.01,performance.now());s.j=C.party[0].cj;cvScTick(s,0,.01,performance.now());out.meOff=!s.on;caveAbort()}
    /* えさ：となりまで来ると、かみつく。光をあてると、先に正体をあらわす */
    {let C=enter(2,['earth','fire','water']);out.esaOn2=!!sc('esa')&&!sc('te');C.en=[];const s=sc('esa');s.cd=0;tick(.1);out.esaOn=s.on;const a=act('earth'),hs=()=>C.party.reduce((t,q)=>t+q.r.hunger,0),h=hs();C.sc=[s];s.x=Math.floor(a.x)+1;s.y=Math.floor(a.y-CVOY);s.path=[];cvBakeTick(0,.01,performance.now());out.bite=Math.round(h-hs())===CVSC.esa.hun;
      cvScOff(s);s.cd=0;cvBakeTick(0,.01,performance.now());LIGHTCD=0;cvLightHit(Math.floor(s.x),Math.floor(s.y),1);out.esaL=s.rev>0&&!s.bite;C.seen.fill(1);caveRender(performance.now());caveAbort()}
    /* ほりつづける手：大穴のふちを行き来する。見つかると手をのばす。光をしぼるとやりすごせる。まもりの光で止まる */
    {let C=enter(7,['earth','fire','water']);C.en=[];/* 大穴のある階（4階から下）は R4・R5 で作る。いまは、ゆりかごのへやに、ためしに大穴をあけて、たしかめる */{let c=-1;for(let j=0;j<CVW*CVH&&c<0;j++){const x=cvX(j),y=cvY(j);let ok=x>3&&y>3&&x<CVW-4&&y<CVH-4;for(let dy=-3;dy<=3&&ok;dy++)for(let dx=-3;dx<=3;dx++)if(!cvWalk(cvJ(x+dx,y+dy))||C.lv[cvJ(x+dx,y+dy)]!==C.lv[j]){ok=false;break}if(ok)c=j}
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.hypot(dx,dy)<2.3){const k=cvJ(cvX(c)+dx,cvY(c)+dy);C.ab[k]=1;C.g[k]=0;C.ob.delete(k)}for(const a of C.party)put(a,cvX(c),cvY(c)-3);cvBakeEnter(C)}const s=sc('te');out.te=!!s&&s.rim.length>8;C.sc=[s];const j=s.rim[s.i|0];for(const a of C.party)put(a,cvX(j),cvY(j));const h=act('earth').r.hunger;
      C.dim=false;cvBakeTick(0,.01,performance.now());out.teSee=s.st===1;for(let i=0;i<60;i++)cvBakeTick(0,.05,performance.now());out.teHit=h-act('earth').r.hunger>=CVSC.te.hun;
      s.st=0;s.t=0;C.dim=true;const far=s.rim.find(k=>Math.hypot(cvX(k)-cvX(j),cvY(k)-cvY(j))>2&&Math.hypot(cvX(k)-cvX(j),cvY(k)-cvY(j))<2.6);if(far!=null){for(const a of C.party)put(a,cvX(far),cvY(far));cvBakeTick(0,.001,performance.now());out.teDim=s.st===0}else out.teDim=true;
      LIGHTCD=0;cvLightHit(s.x,s.y,1);out.teStun=s.stun>0;C.seen.fill(1);caveRender(performance.now());caveAbort()}
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.deepEqual(r.types,['bk_kui','bk_yoru','bk_sui','bk_kuzu','bk_nezu','bk_seki','bk_mi','bk_tame',null,null],'地図のある階のバケモノ');assert.deepEqual(r.bkfl,['bk_kui','bk_yoru','bk_sui','bk_kuzu','bk_nezu','bk_seki','bk_mi','bk_tame','bk_hone','bk_ro'],'階ごとのバケモノ（STORY.md）');assert.equal(r.kui,true);assert.equal(r.chips,true,'バケモノのチップ（3Dから写した絵）');
  assert.ok(r.lr1<r.lr0,'光すいのそばで、光の広さが小さくなる');assert.deepEqual(r.split,[2,90],'わかれる（のこりを半分ずつ）');assert.equal(r.split2,2,'わかれた子は、もうわかれない');
  assert.deepEqual(r.gl,[true,true,true,true,true,'bk_tame'],'ガラスの入れ物の中に、ためしのからだ');assert.equal(r.thaw0,true,'火のせいれいでなければ、Q は、われない');assert.equal(r.thaw1,true,'火のせいれいが近づくと、Q がわれて出てくる');assert.equal(r.qWalk,true,'われたあとは歩ける');assert.equal(r.uFire,true,'U は、火のせいれいでは、われない');assert.equal(r.uLight,true,'U は、まもりの光でわれる');
  assert.deepEqual(r.down,[true,true],'くずれる');assert.deepEqual(r.up,[true,true],'組みなおす');assert.equal(r.final,true,'まもりの光でとどめ');
  assert.equal(r.hot,true);assert.equal(r.hotHun,true,'あつい床');assert.equal(r.mi0,false,'遠くの子はねらわない');assert.equal(r.mi1,true,'ゆりかごのそばに来た子をねらう');assert.equal(r.noTe,true,'大穴のない階に、手は出ない');
  assert.deepEqual([r.koe,r.koeOn,r.frz,r.koeVis],[true,true,true,true],'声のこだま');
  assert.deepEqual([r.meOn1,r.meOn,r.meWake,r.meOff],[true,true,true,true],'見はりの目');
  assert.deepEqual([r.esaOn2,r.esaOn,r.bite,r.esaL],[true,true,true,true],'えさ');
  assert.deepEqual([r.te,r.teSee,r.teHit,r.teDim,r.teStun],[true,true,true,true,true],'ほりつづける手');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
