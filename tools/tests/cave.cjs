/* 洞窟の探検（cave.js）：入る・歩く・見える所・属性の道（土 岩をおす・火 たいまつ・水 水門・風 風車・木 葉）・光をしぼる・ふいうち・せまい道・
   ひびの床・うすい壁・落ちてくる岩・食べる・消える・帰る（ひろった物・村の時計） */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    for(const el of ['earth','fire','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const q of S.res){q.nap=false;q.hunger=hMax(q)}
    S.t=Math.floor(S.t/1440)*1440+9*60;S.hold=0;S.fs.imo=5;syncFood();S.pt=50;
    const by=el=>S.res.find(q=>q.elem===el),step=(sec)=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},J=cvJ,act=el=>CV.party.find(a=>a.elem===el),
      put=(a,x,y)=>{a.x=x+.5;a.y=y+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=J(x,y)},full=()=>{for(const a of CV.party)a.r.hunger=hMax(a.r)};
    /* 夜は出かけられない */{const t=S.t;S.t=Math.floor(S.t/1440)*1440+22*60;cavePrep();out.nightPop=!!document.querySelector('.pxpopw');S.t=t}
    /* えらぶ画面 */cavePrep();{const P=document.querySelector('.pxpopw');out.prep=!!P;out.slots=P.querySelectorAll('.grid')[0].children.length;P.remove()}
    const t0=S.t,f0=S.fs.imo;
    /* ===== 1回め：土・火・水 ===== */
    out.enter=caveEnter([by('earth'),by('fire'),by('water')],{imo:2});let C=CV;out.paused=paused();out.cls=document.body.classList.contains('cave');out.hud=!!document.querySelector('#caveHud');
    out.seenStart=!!C.seen[J(20,27)];out.unseenFar=!C.seen[J(20,2)];
    /* 門をひらかなくても、かえりの光まで行ける。属性の道の先は行けない */const go=(x,y)=>!!cvBfs(J(20,27),j=>j===J(x,y));
    out.mainPath=go(20,2);out.closed=[go(7,18),go(37,19),go(6,11),go(11,14),go(6,5),go(3,5),go(26,3),go(22,23)];
    C.en=[];C.seen.fill(1);
    /* 歩く */cvGo(J(20,22));step(4);out.walked=C.party.every(a=>Math.hypot(a.x-20.5,a.y-CVOY-22.5)<2.2);
    /* 風・木のせいれいがいないと、風車・われ目はつかえない */cvUse(J(2,5),C.ob.get(J(2,5)));out.windNo=!C.sel;cvUse(J(8,6),C.ob.get(J(8,6)));out.woodNo=!C.party.some(a=>a.job);
    /* 土：岩をおす（左はでっぱりでおせない → 下へ1マス → 左へ2マスで、くぼみにはまる） */put(act('earth'),12,19);
    cvUse(J(11,17),C.ob.get(J(11,17)));out.sel=C.sel&&C.sel.k;out.dirs=cvPushDirs(J(11,17)).map(d=>d.t).sort((a,b)=>a-b);
    const push=(bx,by2,tx,ty)=>{const d=cvPushDirs(J(bx,by2)).find(q=>q.t===J(tx,ty)),a=act('earth');a.job={k:'push',j:J(bx,by2),to:d.t,s:d.s,t:0};a.path=cvBfs(cvCell(a),q=>q===d.s);step(6)};
    push(11,17,11,18);out.pushed=!!C.ob.get(J(11,18))&&C.ob.get(J(11,18)).k==='b';push(11,18,10,18);
    /* もどす */out.reset=cvRockReset();out.home=!!C.ob.get(J(11,17))&&!C.ob.get(J(10,18));
    push(11,17,11,18);push(11,18,10,18);push(10,18,9,18);out.hole=C.ob.get(J(9,18)).done&&!C.ob.get(J(10,18));out.earthOpen=!!cvBfs(J(12,19),j=>j===J(7,18));
    /* 宝箱（洞窟だけの家具）・化石 */put(act('earth'),7,18);cvUse(J(7,19),C.ob.get(J(7,19)));step(1);out.chest=C.ob.get(J(7,19)).done;put(act('earth'),7,16);cvUse(J(6,16),C.ob.get(J(6,16)));step(1);out.fos=Object.values(C.loot.fos).reduce((a,b)=>a+b,0);
    /* 火：たいまつ。1本だけではひらかない。3本ともともすと、とびらがひらく。時間がたつと消える */full();put(act('fire'),29,17);cvUse(J(28,16),C.ob.get(J(28,16)));step(1);out.t1=C.ob.get(J(28,16)).until>C.t;out.doorNo=!C.ob.get(J(36,19)).done;
    C.t+=CVTORCH+1;out.tOut=!(C.ob.get(J(28,16)).until>C.t);
    cvUse(J(28,16),C.ob.get(J(28,16)));cvUse(J(35,16),C.ob.get(J(35,16)));cvUse(J(32,22),C.ob.get(J(32,22)));out.queued=act('fire').jq.length;step(12);out.door=C.ob.get(J(36,19)).done;out.fireOpen=!!cvBfs(J(29,17),j=>j===J(37,19));
    /* 水：片方だけ。水は1マスずつ流れて、わたれるようになる */full();put(act('water'),10,11);cvUse(J(9,10),C.ob.get(J(9,10)));step(4);out.sluice=C.sluice;out.dry=!cvWalk(J(9,11))||!cvWalk(J(9,12));
    {const n=performance.now()+2000;cvRocks(n)}out.wet=cvWalk(J(9,11))&&cvWalk(J(9,12));out.other=!cvWalk(J(11,13));cvUse(J(13,13),C.ob.get(J(13,13)));out.noSecond=!act('water').job;
    /* ひびの床：1人が通るとくずれる */full();const ea=act('earth');put(ea,20,12);ea.cj=J(20,12);ea.path=[J(20,11),J(20,10),J(20,9)];step(3);out.crack=[C.ob.get(J(20,11)).gone,C.ob.get(J(20,10)).gone];out.detour=!!cvBfs(J(20,12),j=>j===J(20,9));
    /* 落ちてくる岩：かげが出てから落ちる。そこにいると、おなかがへる */full();put(ea,20,16);ea.cj=J(20,16);const h0=ea.r.hunger;ea.path=[J(20,15)];step(.6);const ro=C.ob.get(J(20,15));out.rockArmed=ro.fall>0;cvRocks(ro.fall+1);out.rockHurt=Math.round(h0-ea.r.hunger)>=CVROCKHUN;
    /* うすい壁：まもりの光でくずれる */out.wall0=!C.g[J(21,23)];cvLightHit(21,23,0);out.wall=!!C.g[J(21,23)]&&!C.ob.get(J(21,23));out.hidden=!!cvBfs(J(20,23),j=>j===J(22,23));
    /* 光をしぼる・ふいうち */full();put(ea,20,7);const mk=(x,y)=>({id:C.eid++,type:'basic',x:x+.5,y:y+.5+CVOY,hp:300,max:300,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:J(x,y)});
    const e1=mk(22,7);C.en.push(e1);C.dim=true;step(.3);out.dimSleep=e1.asleep;C.focus=e1;const hp0=e1.hp;ea.fatk=0;step(.5);out.ambush=hp0-e1.hp>=CVAMBUSH;out.wokeHit=!e1.asleep;
    const e2=mk(23,5);C.en.push(e2);C.dim=false;C.focus=null;step(.3);out.wideWake=!e2.asleep;C.en=[];
    /* せまい道：コワイノどうしは同じマスに入らない */{const a1=mk(14,10),a2=mk(14,11);a1.asleep=a2.asleep=false;C.en.push(a1,a2);for(const a of C.party)put(a,17,7);let same=false;for(let i=0;i<120;i++){caveFrame(1/30,performance.now());if(cvCell(a1)===cvCell(a2))same=true}out.noStack=!same;C.en=[]}
    /* 食べる */const fr=by('fire');fr.hunger=300;out.ate=cvEat(act('fire'),'imo');out.hunAte=fr.hunger;out.fsAte=f0-S.fs.imo;
    /* 消える */const wr=by('water'),wn=wr.name;wr.hunger=.001;step(.2);out.gone=!S.res.includes(wr)&&!C.party.some(a=>a.r===wr);out.lost=(S.lost||[]).concat(S.buried||[]).some(q=>q.name===wn);document.querySelector('#dialog').hidden=true;
    /* 帰る */C.t=120;const lt=C.loot.pt,pb=S.pt;caveExit(true);out.exit=!CV&&!document.body.classList.contains('cave')&&!document.querySelector('#caveHud');out.pt=S.pt-pb-lt;out.dt=Math.round(S.t-t0);out.pop=!!document.querySelector('.pxpopw');document.querySelectorAll('.pxpopw').forEach(p=>p.remove());
    out.inv=S.inv.doki||0;out.fosRec=Object.values(S.fosRec||{}).reduce((a,b)=>a+b,0);out.zk=zkCount(10);out.zkAll=zkTotal(10);out.ico=String(fossilIcon('kai')).slice(0,10);{const L=[];fossilZukan(S,(n,d)=>L.push(n));out.zkList=L.length}out.lit=LIGHTQ.includes('oldlantern')&&INDL.has('oldlantern')&&DECOQ.includes('doki');
    /* ===== 2回め：風・木 ===== */S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter([by('wind'),by('wood')],{});C=CV;C.en=[];C.seen.fill(1);
    /* 家具は1回だけ。2回めはパワー */cvLoot({item:'doki'});out.again=[C.loot.items.doki||0,C.loot.pt];C.loot.pt=0;
    /* 風：まっすぐ先でない所からは、とどかない。岩のむこうからも、とどかない。同じ行からは、とどく */const wi=act('wind'),blow=(x,y)=>{put(wi,x,y);wi.job={k:'blow',j:J(2,5),at:J(x,y),t:0};step(.2);const g=C.gust;if(g)cvRocks(g.t0+60000);return g?g.hit:null};
    out.blowOff=blow(9,4);out.blowWall=blow(20,5);out.millNo=!C.ob.get(J(2,5)).done;out.blowHit=blow(9,5);out.mill=C.ob.get(J(2,5)).done&&C.ob.get(J(26,4)).done;
    /* 木：葉は3まい。まん中の列に置くと、島にもむこう岸にも行ける */const wo=act('wood');put(wo,9,6);const leaf=(x,y)=>{cvUse(J(x,y),C.ob.get(J(x,y)));step(5)};out.leaf0=C.leaf;leaf(8,6);leaf(7,6);leaf(6,6);out.leaf=C.leaf;
    out.island=!!cvBfs(J(9,6),j=>j===J(6,5));out.far=!!cvBfs(J(9,6),j=>j===J(3,5));cvUse(J(8,5),C.ob.get(J(8,5)));out.noLeaf=!wo.job;caveAbort();out.abort=!CV;
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.nightPop,false,'夜は出かけられない');assert.equal(r.prep,true);assert.equal(r.slots,5);
  assert.equal(r.enter,true);assert.equal(r.paused,true,'洞窟のあいだ村は止まる');assert.equal(r.cls,true);assert.equal(r.hud,true);assert.equal(r.seenStart,true);assert.equal(r.unseenFar,true);
  assert.equal(r.mainPath,true,'どのパーティでも、かえりの光まで行ける');assert.deepEqual(r.closed,[false,false,false,false,false,false,false,false]);assert.equal(r.walked,true);
  assert.equal(r.windNo,true);assert.equal(r.woodNo,true);
  assert.equal(r.sel,'b');assert.equal(r.dirs.length,2,'左はでっぱり・右は立つ所がない：上と下にだけおせる');assert.equal(r.pushed,true);assert.equal(r.reset,1);assert.equal(r.home,true);assert.equal(r.hole,true);assert.equal(r.earthOpen,true);
  assert.equal(r.chest,true);assert.equal(r.fos,1);
  assert.equal(r.t1,true);assert.equal(r.doorNo,true);assert.equal(r.tOut,true,'たいまつは消える');assert.equal(r.queued,2);assert.equal(r.door,true);assert.equal(r.fireOpen,true);
  assert.equal(r.sluice,'x');assert.equal(r.dry,true,'水は、すぐにはとどかない');assert.equal(r.wet,true);assert.equal(r.other,true);assert.equal(r.noSecond,true,'水門は片方だけ');
  assert.deepEqual(r.crack,[true,true]);assert.equal(r.detour,true,'まわり道がある');assert.equal(r.rockArmed,true);assert.equal(r.rockHurt,true);
  assert.equal(r.wall0,true);assert.equal(r.wall,true);assert.equal(r.hidden,true);
  assert.equal(r.dimSleep,true,'光をしぼると、そばでも起きない');assert.equal(r.ambush,true);assert.equal(r.wokeHit,true);assert.equal(r.wideWake,true);assert.equal(r.noStack,true);
  assert.equal(r.ate,true);assert.equal(r.hunAte,800);assert.equal(r.fsAte,1);assert.equal(r.gone,true);assert.equal(r.lost,true);
  assert.equal(r.exit,true);assert.ok(r.pt>=0&&r.pt<=3);assert.equal(r.dt,120,'洞窟にいた時間ぶん、村の時計が進む');assert.equal(r.pop,true);
  assert.equal(r.inv,1,'ほりだした土器');assert.equal(r.fosRec,1);assert.equal(r.zk,1);assert.equal(r.zkAll,5);assert.equal(r.ico,'data:image');assert.equal(r.zkList,1);assert.equal(r.lit,true);assert.deepEqual(r.again,[0,30]);
  assert.equal(r.blowOff,null,'まっすぐ先でない');assert.equal(r.blowWall,false,'岩のむこう');assert.equal(r.millNo,true);assert.equal(r.blowHit,true);assert.equal(r.mill,true);
  assert.equal(r.leaf0,3);assert.equal(r.leaf,0);assert.equal(r.island,true);assert.equal(r.far,true);assert.equal(r.noLeaf,true);assert.equal(r.abort,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
