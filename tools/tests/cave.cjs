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
    out.seenStart=!!C.seen[J(23,32)];out.unseenFar=!C.seen[J(23,2)];
    /* 門をひらかなくても、かえりの光まで行ける。属性の道の先は行けない */const go=(x,y)=>!!cvBfs(J(23,32),j=>j===J(x,y));
    out.mainPath=go(23,2);out.closed=[go(5,22),go(42,21),go(6,13),go(12,17),go(7,5),go(3,5),go(28,4),go(26,27)];
    /* どこからでも、入口か坂へもどれる（とびおりた先で、とじこめられない）。2つの階とも */{const back=fl=>{const F=CVFLOORS[fl];let S0=-1,R0=-1,bad=0;const ok=j=>cvWalk(j);for(let j=0;j<CVW*CVH;j++){const o=CV.ob.get(j);if(o&&o.k==='S')S0=j;if(o&&o.k==='R')R0=j}
      const from=new Set([S0]),q=[S0];for(let h=0;h<q.length;h++){const j=q[h];for(const[dx,dy]of DIRS){const k=J(cvX(j)+dx,cvY(j)+dy);if(from.has(k)||!ok(k)||!cvStepOK(j,k))continue;from.add(k);q.push(k)}}
      for(const j of from)if(!cvBfs(j,k=>k===S0||k===R0))bad++;return[from.has(R0),bad,from.size>200]};out.back0=back(0)}
    /* 水たまりは歩けない・石じゅんは歩けない・光るきのこは歩ける */out.terr=[cvWalk(J(19,8)),cvWalk(J(21,6)),cvWalk(J(20,24)),C.wt[J(19,8)]];
    /* 高さ：岩だなからくぼ地へは、とびおりられる。のぼるのは坂から */out.step=[cvStepOK(J(36,7),J(36,8)),cvStepOK(J(36,8),J(36,7)),cvStepOK(J(42,8),J(42,7)),(cvBfs(J(36,9),j=>j===J(36,7))||[]).length>6];
    out.ore=C.ore.size>0;out.top=C.top;
    C.en=[];C.seen.fill(1);
    /* 歩く */cvGo(J(23,27));step(4);out.walked=C.party.every(a=>Math.hypot(a.x-23.5,a.y-CVOY-27.5)<2.2);
    /* 風・木のせいれいがいないと、風車・われ目はつかえない */cvUse(J(2,5),C.ob.get(J(2,5)));out.windNo=!C.sel;cvUse(J(9,6),C.ob.get(J(9,6)));out.woodNo=!C.party.some(a=>a.job);
    /* 土：岩をおす（左はでっぱりでおせない → 下へ1マス → 左へ2マスで、くぼみにはまる） */put(act('earth'),12,21);
    cvUse(J(9,20),C.ob.get(J(9,20)));out.sel=C.sel&&C.sel.k;out.dirs=cvPushDirs(J(9,20)).map(d=>d.t).sort((a,b)=>a-b);
    const push=(bx,by2,tx,ty)=>{const d=cvPushDirs(J(bx,by2)).find(q=>q.t===J(tx,ty)),a=act('earth');a.job={k:'push',j:J(bx,by2),to:d.t,s:d.s,t:0};a.path=cvBfs(cvCell(a),q=>q===d.s);step(6)};
    push(9,20,9,21);out.pushed=!!C.ob.get(J(9,21))&&C.ob.get(J(9,21)).k==='b';push(9,21,8,21);
    /* もどす */out.reset=cvRockReset();out.home=!!C.ob.get(J(9,20))&&!C.ob.get(J(8,21));
    push(9,20,9,21);push(9,21,8,21);push(8,21,7,21);out.hole=C.ob.get(J(7,21)).done&&!C.ob.get(J(8,21));out.earthOpen=!!cvBfs(J(12,21),j=>j===J(5,22));
    /* 宝箱（洞窟だけの家具）・化石 */put(act('earth'),5,22);cvUse(J(4,22),C.ob.get(J(4,22)));step(1);out.chest=C.ob.get(J(4,22)).done;put(act('earth'),5,21);cvUse(J(5,20),C.ob.get(J(5,20)));step(1);out.fos=Object.values(C.loot.fos).reduce((a,b)=>a+b,0);
    /* 火：たいまつ。1本だけではひらかない。3本ともともすと、とびらがひらく。時間がたつと消える */full();put(act('fire'),34,21);cvUse(J(33,20),C.ob.get(J(33,20)));step(1);out.t1=C.ob.get(J(33,20)).until>C.t;out.doorNo=!C.ob.get(J(41,21)).done;
    C.t+=CVTORCH+1;out.tOut=!(C.ob.get(J(33,20)).until>C.t);
    cvUse(J(33,20),C.ob.get(J(33,20)));cvUse(J(39,19),C.ob.get(J(39,19)));cvUse(J(36,24),C.ob.get(J(36,24)));out.queued=act('fire').jq.length;step(12);out.door=C.ob.get(J(41,21)).done;out.fireOpen=!!cvBfs(J(34,21),j=>j===J(42,21));
    /* 水：片方だけ。水は1マスずつ流れて、わたれるようになる */full();put(act('water'),10,12);cvUse(J(9,11),C.ob.get(J(9,11)));step(4);out.sluice=C.sluice;out.dry=!cvWalk(J(9,12))||!cvWalk(J(9,13));
    {const n=performance.now()+2000;cvRocks(n)}out.wet=cvWalk(J(9,12))&&cvWalk(J(9,13));out.other=!cvWalk(J(11,15));cvUse(J(15,15),C.ob.get(J(15,15)));out.noSecond=!act('water').job;
    /* ひびの床：1人が通るとくずれる */full();const ea=act('earth');put(ea,22,13);ea.cj=J(22,13);ea.path=[J(23,13),J(23,12),J(23,11)];step(3);out.crack=[C.ob.get(J(23,13)).gone,C.ob.get(J(23,12)).gone];out.detour=!!cvBfs(J(22,13),j=>j===J(23,11));
    /* 落ちてくる岩：かげが出てから落ちる。そこにいると、おなかがへる */full();put(ea,24,18);ea.cj=J(24,18);const h0=ea.r.hunger;ea.path=[J(24,17)];step(.6);const ro=C.ob.get(J(24,17));out.rockArmed=ro.fall>0;cvRocks(ro.fall+1);out.rockHurt=Math.round(h0-ea.r.hunger)>=CVROCKHUN;
    /* うすい壁：まもりの光でくずれる */out.wall0=!C.g[J(25,27)];cvLightHit(25,27,0);out.wall=!!C.g[J(25,27)]&&!C.ob.get(J(25,27));out.hidden=!!cvBfs(J(24,27),j=>j===J(26,27));
    /* 光をしぼる・ふいうち */full();put(ea,23,7);const mk=(x,y)=>({id:C.eid++,type:'basic',x:x+.5,y:y+.5+CVOY,hp:300,max:300,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:J(x,y)});
    const e1=mk(25,7);C.en.push(e1);C.dim=true;step(.3);out.dimSleep=e1.asleep;C.focus=e1;const hp0=e1.hp;ea.fatk=0;step(.5);out.ambush=hp0-e1.hp>=CVAMBUSH;out.wokeHit=!e1.asleep;
    const e2=mk(26,5);C.en.push(e2);C.dim=false;C.focus=null;step(.3);out.wideWake=!e2.asleep;C.en=[];
    /* せまい道：コワイノどうしは同じマスに入らない */{const a1=mk(18,11),a2=mk(18,10);a1.asleep=a2.asleep=false;C.en.push(a1,a2);for(const a of C.party)put(a,22,14);let same=false;for(let i=0;i<120;i++){caveFrame(1/30,performance.now());if(cvCell(a1)===cvCell(a2))same=true}out.noStack=!same;C.en=[]}
    /* 食べる */const fr=by('fire');fr.hunger=300;out.ate=cvEat(act('fire'),'imo');out.hunAte=fr.hunger;out.fsAte=f0-S.fs.imo;
    /* 消える */const wr=by('water'),wn=wr.name;wr.hunger=.001;step(.2);out.gone=!S.res.includes(wr)&&!C.party.some(a=>a.r===wr);out.lost=(S.lost||[]).concat(S.buried||[]).some(q=>q.name===wn);document.querySelector('#dialog').hidden=true;
    /* 下へおりる坂：そばまで来ると、その階はクリア。つぎの階がひらく */out.clr0=S.cvClr||0;put(act('earth'),23,3);step(.5);out.clr=S.cvClr;out.clrF=C.clr;
    /* 帰る */C.t=120;const lt=C.loot.pt,pb=S.pt;caveExit(true);out.exit=!CV&&!document.body.classList.contains('cave')&&!document.querySelector('#caveHud');out.pt=S.pt-pb-lt;out.dt=Math.round(S.t-t0);out.pop=!!document.querySelector('.pxpopw');document.querySelectorAll('.pxpopw').forEach(p=>p.remove());
    out.inv=S.inv.doki||0;out.fosRec=Object.values(S.fosRec||{}).reduce((a,b)=>a+b,0);out.zk=zkCount(10);out.zkAll=zkTotal(10);out.ico=String(fossilIcon('kai')).slice(0,10);{const L=[];fossilZukan(S,(n,d)=>L.push(n));out.zkList=L.length}out.lit=LIGHTQ.includes('oldlantern')&&INDL.has('oldlantern')&&DECOQ.includes('doki');
    /* ===== 2回め：風・木 ===== */S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter([by('wind'),by('wood')],{});C=CV;out.fl0=C.fl;C.en=[];C.seen.fill(1);
    /* 家具は1回だけ。2回めはパワー */cvLoot({item:'doki'});out.again=[C.loot.items.doki||0,C.loot.pt];C.loot.pt=0;
    /* 風：まっすぐ先でない所からは、とどかない。岩のむこうからも、とどかない。同じ行からは、とどく */const wi=act('wind'),blow=(x,y)=>{put(wi,x,y);wi.job={k:'blow',j:J(2,5),at:J(x,y),t:0};step(.2);const g=C.gust;if(g)cvRocks(g.t0+60000);return g?g.hit:null};
    out.blowOff=blow(10,4);out.blowWall=blow(20,5);out.millNo=!C.ob.get(J(2,5)).done;out.blowHit=blow(10,5);out.mill=C.ob.get(J(2,5)).done&&C.ob.get(J(28,5)).done;
    /* 木：葉は3まい。まん中の列に置くと、島にもむこう岸にも行ける */const wo=act('wood');put(wo,10,6);const leaf=(x,y)=>{cvUse(J(x,y),C.ob.get(J(x,y)));step(5)};out.leaf0=C.leaf;leaf(9,6);leaf(8,6);leaf(7,6);out.leaf=C.leaf;
    out.island=!!cvBfs(J(10,6),j=>j===J(7,5));out.far=!!cvBfs(J(10,6),j=>j===J(3,5));cvUse(J(9,5),C.ob.get(J(9,5)));out.noLeaf=!wo.job;
    /* しずく・下絵の区画 */C.dripT=0;cvDripTick(performance.now());out.drip=C.drips.length;caveRender(performance.now());out.chunks=C.ch.size>0&&C.ch.size<=CVCHMAX;caveAbort();out.abort=!CV;
    /* ===== 2階：ひらいた階からえらべる ===== */cavePrep();{const P=document.querySelector('.pxpopw');out.flBtn=[...P.querySelectorAll('button')].filter(b=>/^[12]階$/.test(b.textContent)).length;P.remove()}
    S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter([by('earth'),by('fire')],{},1);C=CV;out.fl1=C.fl;{let S0=-1,R0=-1;for(const[j,o]of C.ob){if(o.k==='S')S0=j;if(o.k==='R')R0=j}out.main2=!!cvBfs(S0,j=>j===R0);
      out.closed2=[[21,17],[6,21],[10,25],[40,27],[11,28],[19,31]].map(([x,y])=>!!cvBfs(S0,j=>j===J(x,y)));
      const from=new Set([S0]),q=[S0];let bad=0;for(let h=0;h<q.length;h++){const j=q[h];for(const[dx,dy]of DIRS){const k=J(cvX(j)+dx,cvY(j)+dy);if(from.has(k)||!cvWalk(k)||!cvStepOK(j,k))continue;from.add(k);q.push(k)}}for(const j of from)if(!cvBfs(j,k=>k===S0||k===R0))bad++;out.back1=bad;
      /* だんだんの広間：上から下へは行ける。下から上は、坂を通る */out.tier=[cvStepOK(J(22,4),J(22,5)),cvStepOK(J(22,5),J(22,4)),(cvBfs(J(22,5),j=>j===J(22,4))||[]).length>4];
      /* 島：岩を水の上へはおせない。くぼみへおすと、島へわたれる */out.dirs2=cvPushDirs(J(23,17)).map(d=>d.t);C.en=[];const a=act('earth');put(a,24,17);a.job={k:'push',j:J(23,17),to:J(22,17),s:J(24,17),t:0};step(6);out.isle=!!cvBfs(J(24,17),j=>j===J(21,17))}
    caveAbort();
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
  assert.deepEqual(r.back0,[true,0,true],'1階：どこからでも入口か坂へもどれる');assert.deepEqual(r.terr,[false,false,true,1]);assert.deepEqual(r.step,[true,false,true,true],'とびおりる・坂からのぼる');assert.equal(r.ore,true);assert.equal(r.top,1);
  assert.equal(r.clr0,0);assert.equal(r.clr,1,'坂まで来ると、つぎの階がひらく');assert.equal(r.clrF,true);assert.equal(r.fl0,0);assert.equal(r.drip,1);assert.equal(r.chunks,true);
  assert.equal(r.flBtn,2,'出かける階をえらべる');assert.equal(r.fl1,1);assert.equal(r.main2,true,'2階：どのパーティでも坂まで行ける');assert.deepEqual(r.closed2,[false,false,false,false,false,false]);assert.equal(r.back1,0);assert.deepEqual(r.tier,[true,false,true]);assert.equal(r.dirs2.length,1);assert.equal(r.isle,true);
  assert.equal(r.leaf0,3);assert.equal(r.leaf,0);assert.equal(r.island,true);assert.equal(r.far,true);assert.equal(r.noLeaf,true);assert.equal(r.abort,true);
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
