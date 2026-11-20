/* 洞窟の探検（cave.js）：入る・歩く・見える所・属性の道・たたかい・まもりの光・食べる・消える・帰る（ひろった物・村の時計） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    for(const el of ['earth','fire','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const q of S.res){q.nap=false;q.hunger=hMax(q)}
    S.t=Math.floor(S.t/1440)*1440+9*60;S.hold=0;S.fs.imo=5;syncFood();S.pt=50;
    const by=el=>S.res.find(q=>q.elem===el),step=(sec)=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())};
    /* 夜は出かけられない */{const t=S.t;S.t=Math.floor(S.t/1440)*1440+22*60;cavePrep();out.nightPop=!!document.querySelector('.pxpopw');S.t=t}
    /* えらぶ画面 */cavePrep();{const P=document.querySelector('.pxpopw');out.prep=!!P;out.slots=P.querySelectorAll('.grid')[0].children.length;P.remove()}
    /* 入る：土・火・水の3人、いも2こ */const m0=S.mat.stone||0,t0=S.t,f0=S.fs.imo;
    out.enter=caveEnter([by('earth'),by('fire'),by('water')],{imo:2});const C=CV;out.paused=paused();out.cls=document.body.classList.contains('cave');out.hud=!!document.querySelector('#caveHud');
    out.seenStart=!!C.seen[cvJ(15,21)];out.unseenFar=!C.seen[cvJ(17,2)];
    /* 門をひらかなくても、かえりの光まで行ける。門の先は行けない */out.mainPath=!!cvBfs(cvJ(15,21),j=>j===cvJ(17,2));out.roomA=!!cvBfs(cvJ(15,21),j=>j===cvJ(5,13));out.roomC=!!cvBfs(cvJ(15,21),j=>j===cvJ(25,6));
    /* 歩く：タップした所へ、3人とも */for(const k of [cvJ(15,19),cvJ(15,18),cvJ(15,17),cvJ(15,16),cvJ(14,16),cvJ(13,16),cvJ(12,16),cvJ(11,16),cvJ(10,16),cvJ(10,15),cvJ(10,14)])C.seen[k]=1;
    for(const e of C.en)e.asleep=true;cvGo(cvJ(10,14));step(12);out.walked=C.party.map(a=>Math.hypot(a.x-10.5,a.y-CVOY-14.5)<2.2);out.hunWalk=by('earth').hunger<hMax(by('earth'));
    /* 属性の道：風のせいれいがいないと、すきまはひらけない。土のせいれいは岩をどかす */C.seen[cvJ(12,20)]=1;cvUse(cvJ(12,20),C.ob.get(cvJ(12,20)));out.windNo=!C.party.some(a=>a.job);
    C.en=C.en.filter(e=>!(e.x>9&&e.x<21&&e.y-CVOY>12&&e.y-CVOY<17));/* 広間のコカゲは、あとでたしかめる */C.seen[cvJ(9,14)]=1;cvUse(cvJ(9,14),C.ob.get(cvJ(9,14)));out.earthJob=C.party.find(a=>a.elem==='earth').job?.k;step(14);out.rubble=C.ob.get(cvJ(9,14)).done;out.roomA2=!!cvBfs(cvJ(10,14),j=>j===cvJ(5,13));
    /* ひろう・宝箱 */cvReveal(6.5,14.5,6);cvUse(cvJ(7,15),C.ob.get(cvJ(7,15)));step(8);out.pile=C.loot.mat.stone;cvUse(cvJ(5,14),C.ob.get(cvJ(5,14)));step(8);out.chest=[C.loot.mat.stone,C.loot.pt,C.ob.get(cvJ(5,14)).done];
    /* たたかい：コカゲを1ぴき置く。光で目をさまし、たたかって、追いはらう */const e={id:99,type:'basic',x:4.5,y:16.5+CVOY,hp:100,max:100,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null};C.en.push(e);cvGo(cvJ(5,15));step(3);out.woke=!e.asleep;
    const h1=C.party.reduce((n,a)=>n+a.r.hunger,0);step(45);out.dead=e.dead;out.killPt=C.loot.pt;out.hurt=C.party.reduce((n,a)=>n+a.r.hunger,0)<h1;
    /* まもりの光 */const e2={id:98,type:'basic',x:4.5,y:12.5+CVOY,hp:100,max:100,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null};C.en.push(e2);LIGHTCD=0;const pp=S.pt;out.cast=caveLight(4,12);out.ptUsed=pp-S.pt;cvLightHit(4,12,gupOf('rng').v[gupLv('rng')]);out.lightDmg=e2.hp<100;out.lightStun=e2.stun>0;C.en=C.en.filter(q=>q!==e2);
    /* 食べる */const fr=by('fire');fr.hunger=300;const fa=C.party.find(a=>a.r===fr);out.ate=cvEat(fa,'imo');out.hunAte=fr.hunger;out.fsAte=f0-S.fs.imo;out.packLeft=C.food.imo;
    /* 消える：おなかがからっぽ */const wr=by('water'),wn=wr.name;wr.hunger=.001;step(.2);out.gone=!S.res.includes(wr)&&!C.party.some(a=>a.r===wr);out.lost=(S.lost||[]).concat(S.buried||[]).some(q=>q.name===wn);document.querySelector('#dialog').hidden=true;
    /* 帰る：ひろった物が入り、村の時計が進む */C.t=120;const lt=JSON.stringify(C.loot),pb=S.pt;caveExit(true);out.loot=lt;out.exit=!CV&&!document.body.classList.contains('cave')&&!document.querySelector('#caveHud');out.stone=(S.mat.stone||0)-m0;out.pt=S.pt-pb;out.dt=Math.round(S.t-t0);out.pop=!!document.querySelector('.pxpopw');document.querySelectorAll('.pxpopw').forEach(p=>p.remove());
    out.tapVillage=typeof onTap==='function';return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.nightPop,false,'夜は出かけられない');assert.equal(r.prep,true);assert.equal(r.slots,5);
  assert.equal(r.enter,true);assert.equal(r.paused,true,'洞窟のあいだ村は止まる');assert.equal(r.cls,true);assert.equal(r.hud,true);assert.equal(r.seenStart,true);assert.equal(r.unseenFar,true);
  assert.equal(r.mainPath,true);assert.equal(r.roomA,false);assert.equal(r.roomC,false);
  assert.deepEqual(r.walked,[true,true,true]);assert.equal(r.hunWalk,true);
  assert.equal(r.windNo,true);assert.equal(r.earthJob,'gate');assert.equal(r.rubble,true);assert.equal(r.roomA2,true);
  assert.equal(r.pile,3);assert.deepEqual(r.chest,[13,20,true]);
  assert.equal(r.woke,true);assert.equal(r.dead,true);assert.equal(r.killPt,24);assert.equal(r.hurt,true);
  assert.equal(r.cast,true);assert.equal(r.ptUsed,1);assert.equal(r.lightDmg,true);assert.equal(r.lightStun,true);
  assert.equal(r.ate,true);assert.equal(r.hunAte,800,'火のせいれいは、いも1こで500');assert.equal(r.fsAte,1);assert.equal(r.packLeft,1);
  assert.equal(r.gone,true);assert.equal(r.lost,true);
  assert.equal(r.exit,true);assert.equal(r.stone,13);assert.ok(r.pt>=24&&r.pt<=27,'ひろったパワー24（村が進むあいだにふえた分は、少しだけ）');assert.equal(r.dt,120,'洞窟にいた時間ぶん、村の時計が進む');assert.equal(r.pop,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
