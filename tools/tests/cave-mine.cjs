/* 4階「古い採掘場」（cave-mine.js）：まきあげの足場（乗っていっしょに動く・止まった段のほうへだけ出入り・よびよせる）・
   ほりくず人形（たおすと岩がのこる・だれでもおせる・まもりの光でくずれる）・かけたつるはし（うすい壁をたたいてくずす） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    const nw=el=>{const q=mkRes(S,'m'+el+S.res.length,el,CX+.5,CY+2.5);q.nap=false;q.hunger=hMax(q);S.res.push(q);return q},day=()=>{S.t=Math.floor(S.t/1440)*1440+9*60},
      act=el=>CV.party.find(a=>a.elem===el),put=(a,j)=>{a.x=cvX(j)+.5;a.y=cvY(j)+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=j},
      tick=sec=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},wait=(f,sec)=>{for(let i=0;i<sec*10&&!f();i++)tick(.1);return f()},
      enter=els=>{day();S.pt=500;caveEnter(els.map(nw),{},3);CV.sc=[];CV.en=[];return CV},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j),one=k=>fk(k)[0];
    let C=enter(['fire','water','wind']);const P=C.lift;out.theme=C.F.theme;out.bk=CVBKFL[3];out.lift=[!!P,P&&P.cells.length,P&&P.a,P&&P.b,P&&P.lv];
    const S0=one('S'),R0=one('R'),W=fk('w'),wT=W.find(j=>C.ob.get(j).lv===P.a),wB=W.find(j=>C.ob.get(j).lv===P.b);out.winch=[W.length,wT!=null,wB!=null];
    out.noWalk=!cvBfs(S0,j=>j===R0);/* 足場をうごかさないと、坂へは行けない */
    const low=[...Array(CVW*CVH).keys()].find(j=>!cvIsP(j)&&cvWalk(j)&&C.lv[j]===P.b&&P.cells.some(q=>cvAdj(q,j)));
    out.fence=cvStepOK(P.cells[0],low)||P.cells.some(q=>cvAdj(q,low)&&cvStepOK(q,low));/* 上に止まった足場から、下の段へは出られない */
    /* 上のまきあげ機：みんなで乗って、下の段へ */
    const top=[...Array(CVW*CVH).keys()].find(j=>!cvIsP(j)&&cvWalk(j)&&C.lv[j]===P.a&&cvBfs(S0,q=>q===j));for(const a of C.party)put(a,top);C.seen.fill(1);
    cvUse(wT,C.ob.get(wT));out.ride=wait(()=>P.lv===P.b&&!P.mv,40);out.on=C.party.filter(a=>cvIsP(a.cj)).length;caveRender(performance.now());
    out.down=!!cvBfs(C.party[0].cj,j=>j===R0);/* 下におりたら、坂へ行ける */
    /* 上のまきあげ機から、足場をよびもどす（だれも乗っていなくても） */
    for(const a of C.party)put(a,top);cvUse(wT,C.ob.get(wT));out.call=wait(()=>P.lv===P.a&&!P.mv,40);
    /* うごいているあいだは、乗りおりできない */
    cvLiftGo(P.b);out.mvNo=!cvWalk(P.cells[0]);tick(4);out.mvEnd=P.lv===P.b;
    /* 下のまきあげ機で、上へ */
    for(const a of C.party)put(a,low);cvUse(wB,C.ob.get(wB));out.up=wait(()=>P.lv===P.a&&!P.mv,40)&&C.party.some(a=>cvIsP(a.cj));caveAbort();
    /* ほりくず人形：たおすと、そのマスに岩がのこる。土のせいれいがいなくてもおせる・まもりの光でくずれる */
    C=enter(['fire','water']);{const j=[...Array(CVW*CVH).keys()].find(j=>cvWalk(j)&&!C.ob.has(j)&&[1,2,-1].every(d=>cvWalk(j+d)&&!C.ob.has(j+d)&&C.lv[j+d]===C.lv[j]));const e={id:C.eid++,type:'bk_kuzu',x:cvX(j)+.5,y:cvY(j)+.5+CVOY,hp:1,max:EN.bk_kuzu.hp,spawned:true,asleep:false,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:j};C.en.push(e);
      put(act('fire'),j+2);put(act('water'),j+2);e.hp=0;cvDefeat(e,act('fire'));out.rub=C.ob.get(j)&&C.ob.get(j).k;out.rubDirs=cvPushDirs(j).length>0;
      cvUse(j,C.ob.get(j));out.sel=C.sel&&C.sel.k;const d=cvPushDirs(j).find(q=>q.t===j-1);caveTap(0,0);C.sel={k:'b',j};
      {const a=cvPusher(j,d.s);a.job={k:'push',j,to:d.t,s:d.s,t:0};a.path=cvBfs(a.cj,q=>q===d.s)||[]}out.pushed=wait(()=>C.ob.get(j-1)&&C.ob.get(j-1).k==='u',20);
      LIGHTCD=0;cvLightHit(cvX(j-1),cvY(j-1),1);out.lightRub=!C.ob.has(j-1)}caveAbort();
    /* かけたつるはし：うすい壁を、たたいてくずせる（ないときは、タップしても何もしない） */
    C=enter(['fire','water']);{const Wj=one('W');out.wTap0=cvObjTap(C.ob.get(Wj));S.flags.cvItem=S.flags.cvItem||{};S.flags.cvItem.rel_tsuru=1;out.wTap1=cvObjTap(C.ob.get(Wj));
      const st=[...Array(CVW*CVH).keys()].find(j=>cvWalk(j)&&cvAdj(j,Wj));for(const a of C.party)put(a,st);cvUse(Wj,C.ob.get(Wj));out.dug=wait(()=>!C.ob.has(Wj),30)&&cvWalk(Wj);C.seen.fill(1);caveRender(performance.now())}caveAbort();
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.theme,'mine');assert.equal(r.bk,'bk_kuzu','4階のバケモノ');assert.deepEqual(r.lift,[true,4,4,1,4],'2×2の足場、上の段4・下の段1、はじめは上');assert.deepEqual(r.winch,[2,true,true],'まきあげ機は上の段と下の段に1つずつ');
  assert.equal(r.noWalk,true,'足場をうごかさないと坂へ行けない');assert.equal(r.fence,false,'止まっていない段へは出られない');
  assert.equal(r.ride,true,'上のまきあげ機で、乗って下へ');assert.equal(r.on,3,'みんな乗っていっしょに');assert.equal(r.down,true);
  assert.equal(r.call,true,'よびよせる');assert.deepEqual([r.mvNo,r.mvEnd],[true,true],'うごいているあいだは乗りおりできない');assert.equal(r.up,true,'下のまきあげ機で上へ');
  assert.equal(r.rub,'u','ほりくず人形は岩をのこす');assert.equal(r.rubDirs,true,'土のせいれいがいなくてもおせる');assert.equal(r.sel,'b');assert.equal(r.pushed,true);assert.equal(r.lightRub,true,'まもりの光でくずれる');
  assert.deepEqual([r.wTap0,r.wTap1],[false,true],'つるはしがあると、うすい壁をたためる');assert.equal(r.dug,true,'たたいてくずした');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
