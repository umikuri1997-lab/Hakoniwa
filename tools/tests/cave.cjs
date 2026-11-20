/* 洞窟の探検（cave.js）：入る・歩く・見える所・大穴・属性の道（土 岩をおす・火 たいまつ・水 水門・風 風車・木 葉）・光をしぼる・ふいうち・せまい道・
   ひびの床・うすい壁・落ちてくる岩・食べる・消える・帰る（ひろった物・村の時計）・氷の階（すべる氷・氷のかべ・氷づけの宝箱）・マグマの階（冷やす溶岩・ふきだす溶岩・岩の橋・あつい床）。
   地図は tools/cave/cave_maps.py で作るので、場所は数字でなく、物のしゅるい（S・R・b・t・x・m・k など）でさがす */
const assert=require('node:assert/strict');
(async()=>{const {browser,run,errors}=await require('../sim/boot.cjs')({world:0});
  const r=JSON.parse(await run(`(()=>{document.querySelector('#dialog').hidden=true;S.introSeen=true;S.flags.tapped=1;const out={};
    for(const el of ['earth','fire','water','wind'])S.res.push(mkRes(S,'t'+el,el,CX+.5+S.res.length,CY+2.5));for(const q of S.res){q.nap=false;q.hunger=hMax(q)}
    S.t=Math.floor(S.t/1440)*1440+9*60;S.hold=0;S.fs.imo=5;syncFood();S.pt=50;
    const by=el=>S.res.find(q=>q.elem===el),step=(sec)=>{for(let i=0;i<sec*30;i++)caveFrame(1/30,performance.now())},J=cvJ,act=el=>CV.party.find(a=>a.elem===el),
      put=(a,x,y)=>{a.x=x+.5;a.y=y+.5+CVOY;a.path=[];a.job=null;a.jq=[];a.mv=false;a.cj=J(x,y)},putJ=(a,j)=>put(a,cvX(j),cvY(j)),full=()=>{for(const a of CV.party)a.r.hunger=hMax(a.r)},
      fk=k=>[...CV.ob].filter(([,o])=>o.k===k).map(([j])=>j).sort((a,b)=>a-b),one=k=>fk(k)[0],
      nb=j=>DIRS.map(([dx,dy])=>J(cvX(j)+dx,cvY(j)+dy)).filter(k=>cvWalk(k)),nb8=j=>[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].map(([dx,dy])=>J(cvX(j)+dx,cvY(j)+dy)).filter(k=>cvWalk(k)),
      reachAdj=(from,j)=>!!cvBfs(from,k=>cvAdj(k,j)),
      chests=fl=>Object.keys(CVFLOORS[fl].chest).map(s=>{const[x,y]=s.split(',').map(Number);return J(x,y)}),
      backAll=()=>{const S0=one('S'),R0=one('R'),from=new Set([S0]),q=[S0];for(let h=0;h<q.length;h++){const j=q[h];for(const[dx,dy]of DIRS){const k=J(cvX(j)+dx,cvY(j)+dy);if(from.has(k)||!cvWalk(k)||!cvStepOK(j,k))continue;from.add(k);q.push(k)}}
        let bad=0;for(const j of from)if(!(CV.ice[j])&&!cvBfs(j,k=>k===S0||k===R0))bad++;return[!!cvBfs(S0,j=>j===R0),bad,from.size>200]},
      tierPair=()=>{for(let j=0;j<CVW*CVH-CVW;j++){const k=j+CVW,o=CV.ob.get(k);if(cvWalk(j)&&cvWalk(k)&&CV.lv[j]===CV.lv[k]+1&&!(o&&o.k==='^'))return[j,k]}return null};
    /* 夜は出かけられない */{const t=S.t;S.t=Math.floor(S.t/1440)*1440+22*60;cavePrep();out.nightPop=!!document.querySelector('.pxpopw');S.t=t}
    /* えらぶ画面 */cavePrep();{const P=document.querySelector('.pxpopw');out.prep=!!P;out.slots=P.querySelectorAll('.grid')[0].children.length;P.remove()}
    const t0=S.t,f0=S.fs.imo;
    /* ===== 1回め：土・火・水 ===== */
    out.enter=caveEnter([by('earth'),by('fire'),by('water')],{imo:2});let C=CV;out.paused=paused();out.cls=document.body.classList.contains('cave');out.hud=!!document.querySelector('#caveHud');
    const S0=one('S'),R0=one('R');out.seenStart=!!C.seen[S0];out.unseenFar=!C.seen[R0];
    /* 大穴：歩けない・むこうが見える（見とおせる） */{const a=C.ab.indexOf(1);out.abyss=[C.ab.reduce((s,v)=>s+v,0)>150,!cvWalk(a),!cvOpaque(a)]}
    /* 門をひらかなくても、かえりの光まで行ける。宝箱は、どれも属性の道・うすい壁の先 */out.mainPath=!!cvBfs(S0,j=>j===R0);out.closed=chests(0).map(c=>reachAdj(S0,c));
    out.back0=backAll();
    /* 水は歩けない・石じゅんは歩けない・光るきのこは歩ける */out.terr=[cvWalk(C.wt.indexOf(1)),cvWalk(one('A')),cvWalk(one('g'))];
    /* 高さ：上の段から下へは、とびおりられる。のぼるのは坂から */{const[hj,lj]=tierPair(),sl=fk('^').find(j=>C.lv[j-CVW]===C.lv[j]+1);out.step=[cvStepOK(hj,lj),cvStepOK(lj,hj),cvStepOK(sl,sl-CVW),(cvBfs(lj,j=>j===hj)||[]).length>2]}
    out.ore=C.ore.size>0;out.top=C.top;
    C.en=[];C.seen.fill(1);
    /* 歩く */{const g=nb(R0)[0];cvGo(J(cvX(S0),cvY(S0)+3));step(4);out.walked=C.party.every(a=>Math.hypot(a.x-cvX(S0)-.5,a.y-CVOY-cvY(S0)-3.5)<2.2)}
    /* 風・木のせいれいがいないと、風車・われ目はつかえない */const M0=one('m'),K0=one('k');cvUse(M0,C.ob.get(M0));out.windNo=!C.sel;cvUse(K0,C.ob.get(K0));out.woodNo=!C.party.some(a=>a.job);
    /* 土：岩をおす（左はでっぱりでおせない → 下へ1マス → 左へ2マスで、くぼみにはまる） */const B0=one('b'),bx=cvX(B0),bY=cvY(B0);put(act('earth'),bx+3,bY+1);
    cvUse(B0,C.ob.get(B0));out.sel=C.sel&&C.sel.k;out.dirs=cvPushDirs(B0).map(d=>d.t).sort((a,b)=>a-b);
    const push=(x0,y0,tx,ty)=>{const d=cvPushDirs(J(x0,y0)).find(q=>q.t===J(tx,ty)),a=act('earth');a.job={k:'push',j:J(x0,y0),to:d.t,s:d.s,t:0};a.path=cvBfs(cvCell(a),q=>q===d.s);step(6)};
    push(bx,bY,bx,bY+1);out.pushed=!!C.ob.get(J(bx,bY+1))&&C.ob.get(J(bx,bY+1)).k==='b';push(bx,bY+1,bx-1,bY+1);
    /* もどす */out.reset=cvRockReset();out.home=!!C.ob.get(B0)&&!C.ob.get(J(bx-1,bY+1));
    push(bx,bY,bx,bY+1);push(bx,bY+1,bx-1,bY+1);push(bx-1,bY+1,bx-2,bY+1);const ET=chests(0).find(j=>cvX(j)<bx&&Math.abs(cvY(j)-bY)<5);out.hole=C.ob.get(J(bx-2,bY+1)).done&&!C.ob.get(J(bx-1,bY+1));out.earthOpen=reachAdj(J(bx+3,bY+1),ET);
    /* 宝箱（洞窟だけの家具）・化石 */{const a=act('earth');putJ(a,nb(ET)[0]);cvUse(ET,C.ob.get(ET));step(1);out.chest=C.ob.get(ET).done;const fo=fk('o').find(j=>Math.abs(cvX(j)-cvX(ET))<4&&Math.abs(cvY(j)-cvY(ET))<4);putJ(a,nb(fo)[0]);cvUse(fo,C.ob.get(fo));step(1);out.fos=Object.values(C.loot.fos).reduce((a,b)=>a+b,0)}
    /* 火：たいまつ。1本だけではひらかない。3本ともともすと、とびらがひらく。時間がたつと消える */const TT=fk('t'),D0=one('D');full();putJ(act('fire'),nb8(TT[0])[0]);cvUse(TT[0],C.ob.get(TT[0]));step(1);out.t1=C.ob.get(TT[0]).until>C.t;out.doorNo=!C.ob.get(D0).done;
    C.t+=CVTORCH+1;out.tOut=!(C.ob.get(TT[0]).until>C.t);
    for(const t of TT)cvUse(t,C.ob.get(t));out.queued=act('fire').jq.length;step(14);out.door=C.ob.get(D0).done;out.fireOpen=reachAdj(nb8(TT[0])[0],chests(0).find(j=>Math.abs(cvX(j)-cvX(D0))<4&&Math.abs(cvY(j)-cvY(D0))<3));
    /* 水：片方だけ。水は1マスずつ流れて、わたれるようになる */{full();const X0=one('x'),Y0=one('y'),c1=fk('1'),c2=fk('2');putJ(act('water'),nb8(X0)[0]);cvUse(X0,C.ob.get(X0));step(4);out.sluice=C.sluice;out.dry=c1.some(j=>!cvWalk(j));
      {const n=performance.now()+4000;cvRocks(n)}out.wet=c1.every(j=>cvWalk(j));out.other=c2.every(j=>!cvWalk(j));cvUse(Y0,C.ob.get(Y0));out.noSecond=!act('water').job}
    /* ひびの床：1人が通るとくずれる。まわり道がある */{full();const ea=act('earth'),Q=fk('q'),top=Q[0]-CVW,bot=Q[Q.length-1]+CVW;putJ(ea,top);ea.path=[...Q,bot];step(3);out.crack=Q.map(j=>!!C.ob.get(j).gone);out.detour=!!cvBfs(top,j=>j===bot)}
    /* 落ちてくる岩：かげが出てから落ちる。そこにいると、おなかがへる */const ea=act('earth');{full();const F0=one('!');putJ(ea,F0-CVW);const h0=ea.r.hunger;ea.path=[F0];step(.6);const ro=C.ob.get(F0);out.rockArmed=ro.fall>0;cvRocks(ro.fall+1);out.rockHurt=Math.round(h0-ea.r.hunger)>=CVROCKHUN}
    /* うすい壁：まもりの光でくずれる */{const W0=one('W'),WT=chests(0).find(j=>Math.abs(cvX(j)-cvX(W0))<3&&Math.abs(cvY(j)-cvY(W0))<3);out.wall0=!C.g[W0];cvLightHit(cvX(W0),cvY(W0),0);out.wall=!!C.g[W0]&&!C.ob.get(W0);out.hidden=reachAdj(S0,WT)}
    /* 光をしぼる・ふいうち（入口の部屋で） */full();const sx=cvX(S0),sy=cvY(S0);put(ea,sx-2,sy+2);const mk=(x,y)=>({id:C.eid++,type:'basic',x:x+.5,y:y+.5+CVOY,hp:300,max:300,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:J(x,y)});
    const e1=mk(sx,sy+2);C.en.push(e1);C.dim=true;step(.3);out.dimSleep=e1.asleep;C.focus=e1;const hp0=e1.hp;ea.fatk=0;step(.5);out.ambush=hp0-e1.hp>=CVAMBUSH;out.wokeHit=!e1.asleep;
    const e2=mk(sx+1,sy);C.en.push(e2);C.dim=false;C.focus=null;step(.3);out.wideWake=!e2.asleep;C.en=[];
    /* せまい道：コワイノどうしは同じマスに入らない（入口の西のまわり道） */{let nx=-1,ny=-1;for(let y=sy+3;y<sy+9&&nx<0;y++)for(let x=sx-8;x<sx;x++){const j=J(x,y);if(cvWalk(j)&&!cvWalk(j-1)&&!cvWalk(j+1)&&cvWalk(j+CVW)&&cvWalk(j-CVW)){nx=x;ny=y;break}}
      const a1=mk(nx,ny),a2=mk(nx,ny-1);a1.asleep=a2.asleep=false;C.en.push(a1,a2);for(const a of C.party)put(a,nx,ny+3);let same=false;for(let i=0;i<120;i++){caveFrame(1/30,performance.now());if(cvCell(a1)===cvCell(a2))same=true}out.noStack=!same&&nx>=0;C.en=[]}
    /* 食べる */const fr=by('fire');fr.hunger=300;out.ate=cvEat(act('fire'),'imo');out.hunAte=fr.hunger;out.fsAte=f0-S.fs.imo;
    /* 消える */const wr=by('water'),wn=wr.name;wr.hunger=.001;step(.2);out.gone=!S.res.includes(wr)&&!C.party.some(a=>a.r===wr);out.lost=(S.lost||[]).concat(S.buried||[]).some(q=>q.name===wn);document.querySelector('#dialog').hidden=true;
    /* 下へおりる坂：そばまで来ると、その階はクリア。つぎの階がひらく */out.clr0=S.cvClr||0;putJ(act('earth'),R0-CVW);step(.5);out.clr=S.cvClr;out.clrF=C.clr;
    /* 下絵の区画・大穴の絵 */caveRender(performance.now());out.abyssPath=[...C.ch.values()].some(q=>q.wp&&q.wp.AP);
    /* 帰る */C.t=120;const lt=C.loot.pt,pb=S.pt;caveExit(true);out.exit=!CV&&!document.body.classList.contains('cave')&&!document.querySelector('#caveHud');out.pt=S.pt-pb-lt;out.dt=Math.round(S.t-t0);out.pop=!!document.querySelector('.pxpopw');document.querySelectorAll('.pxpopw').forEach(p=>p.remove());
    out.inv=S.inv.doki||0;out.fosRec=Object.values(S.fosRec||{}).reduce((a,b)=>a+b,0);out.zk=zkCount(10);out.zkAll=zkTotal(10);out.ico=String(fossilIcon('kai')).slice(0,10);{const L=[];fossilZukan(S,(n,d)=>L.push(n));out.zkList=L.length}out.lit=LIGHTQ.includes('oldlantern')&&INDL.has('oldlantern')&&DECOQ.includes('doki');
    /* ===== 2回め：風・木 ===== */S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter([by('wind'),by('wood')],{});C=CV;out.fl0=C.fl;C.en=[];C.seen.fill(1);
    /* 家具は1回だけ。2回めはパワー */cvLoot({item:'doki'});out.again=[C.loot.items.doki||0,C.loot.pt];C.loot.pt=0;
    /* 風：まっすぐ先でない所からは、とどかない。岩のむこうからも、とどかない。同じ行からは、とどく */const wi=act('wind'),M=one('m'),mx=cvX(M),my=cvY(M),blow=(x,y)=>{put(wi,x,y);wi.job={k:'blow',j:M,at:J(x,y),t:0};step(.2);const g=C.gust;if(g)cvRocks(g.t0+60000);return g?g.hit:null};
    {let hx=-1,wx=-1,wy=-1;for(let x=mx-1;x>mx-14;x--){const j=J(x,my);if(!C.g[j]&&!C.ob.has(j))break;if(cvWalk(j)&&C.ob.get(j-1)&&C.ob.get(j-1).k==='k'){hx=x;break}}
      for(let y=my-2;y>=0&&wx<0;y--){const j=J(mx,y);if(cvWalk(j)){for(let yy=y+1;yy<my;yy++)if(!C.g[J(mx,yy)]&&!C.ob.has(J(mx,yy))){wx=mx;wy=y;break}}}
      if(wx<0)for(let y=my+2;y<CVH&&wx<0;y++){const j=J(mx,y);if(cvWalk(j)){for(let yy=my+1;yy<y;yy++)if(!C.g[J(mx,yy)]&&!C.ob.has(J(mx,yy))){wx=mx;wy=y;break}}}
      const off=nb(J(hx,my)).map(j=>J(cvX(j),cvY(j))).find(j=>cvY(j)!==my&&cvX(j)!==mx);
      out.blowOff=blow(cvX(off),cvY(off));out.blowWall=wx<0?false:blow(wx,wy);out.millNo=!C.ob.get(M).done;out.blowHit=blow(hx,my);out.mill=C.ob.get(M).done&&fk('E').every(j=>C.ob.get(j).done)}
    /* 木：葉は3まい。われ目をわたって、宝箱の島にも、むこう岸にも行ける */{const wo=act('wood'),KT=chests(0).find(j=>{for(const[dx,dy]of DIRS){const o=C.ob.get(J(cvX(j)+dx,cvY(j)+dy));if(o&&o.k==='k')return true}return false}),ky=cvY(KT)+1;
      let x0=-1;for(let x=0;x<CVW;x++){const o=C.ob.get(J(x,ky));if(o&&o.k==='k'&&cvWalk(J(x-1,ky))){x0=x;break}}put(wo,x0-1,ky);const leaf=(x,y)=>{cvUse(J(x,y),C.ob.get(J(x,y)));step(5)};
      out.leaf0=C.leaf;leaf(x0,ky);leaf(x0+1,ky);let x2=x0+2;while(!(C.ob.get(J(x2,ky))&&C.ob.get(J(x2,ky)).k==='k'))x2++;leaf(x2,ky);out.leaf=C.leaf;
      out.island=reachAdj(J(x0-1,ky),KT);out.far=!!cvBfs(J(x0-1,ky),j=>j===J(x2+2,ky));const kk=[...C.ob].find(([j,o])=>o.k==='k'&&!o.done)[0];cvUse(kk,C.ob.get(kk));out.noLeaf=!wo.job}
    /* しずく・下絵の区画 */for(let i=0;i<30&&!C.drips.length;i++){C.dripT=0;cvDripTick(performance.now())}out.drip=C.drips.length;caveRender(performance.now());out.chunks=C.ch.size>0&&C.ch.size<=CVCHMAX;caveAbort();out.abort=!CV;
    /* ===== 2階：ひらいた階からえらべる ===== */cavePrep();{const P=document.querySelector('.pxpopw');out.flBtn=[...P.querySelectorAll('button')].filter(b=>/^[12]階$/.test(b.textContent)).length;P.remove()}
    S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter([by('earth'),by('fire')],{},1);C=CV;{const S1=one('S'),R1=one('R');out.fl1=C.fl;out.main2=!!cvBfs(S1,j=>j===R1);
      out.closed2=chests(1).map(c=>reachAdj(S1,c));out.back1=backAll()[1];
      /* だんだんの広間：上から下へは行ける。下から上は、坂を通る */{const[hj,lj]=tierPair();out.tier=[cvStepOK(hj,lj),cvStepOK(lj,hj),(cvBfs(lj,j=>j===hj)||[]).length>2]}
      /* 島：岩を水の上へはおせない。くぼみへおすと、島へわたれる */{const B1=one('b'),H1=one('h');out.dirs2=cvPushDirs(B1).map(d=>d.t);C.en=[];const a=act('earth'),st=J(2*cvX(B1)-cvX(H1),cvY(B1));putJ(a,st);a.job={k:'push',j:B1,to:H1,s:st,t:0};step(6);
        const IT=chests(1).find(j=>Math.abs(cvX(j)-cvX(H1))<4&&cvY(j)===cvY(H1));out.isle=reachAdj(st,IT)}}
    caveAbort();
    const nw=el=>{const r=mkRes(S,'n'+el,el,CX+.5,CY+2.5);r.nap=false;r.hunger=hMax(r);S.res.push(r);return r},P3=()=>[nw('fire'),nw('water'),nw('earth')];/* 前のたしかめで消えた子がいても、べつの子でたしかめる */
    /* ===== 3階（氷）：すべる氷・氷のかべ・氷づけの宝箱 ===== */{S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter(P3(),{},2);C=CV;C.en=[];const b=backAll();out.iceB=[b[0],b[1]];const S2=one('S'),R2=one('R');
      /* すべる：氷の上には止まれない（道さがしの行き先にならない）。すべった道は、氷のマスをとおる */{const p=cvBfs(S2,j=>j===R2)||[];
        let mid=-1;for(let j=0;j<CVW*CVH&&mid<0;j++)if(C.ice[j]&&C.ice[j-1]&&C.ice[j+1]&&C.ice[j-CVW]&&C.ice[j+CVW]&&!cvBfs(S2,k=>k===j))mid=j;out.slide=[p.length>0,p.some(j=>C.ice[j]),mid>=0]}
      const WT=chests(2).find(j=>{const o=C.ob.get(j);return o&&o.k==='T'&&cvX(j)<20});out.westNo=!reachAdj(S2,WT);const f=act('fire');const FW=fk('F');putJ(f,nb(FW[0]).find(j=>!FW.includes(j)));cvUse(FW[0],C.ob.get(FW[0]));step(12);out.melt=!!C.ob.get(FW[0]).done;
      for(const j of FW)C.ob.get(j).done=true;out.westOk=reachAdj(S2,WT);
      const z=fk('Z').find(j=>cvX(j)<20);putJ(f,nb(z)[0]);cvUse(z,C.ob.get(z));step(10);out.thaw=C.ob.get(z).k==='T';caveAbort()}
    /* ===== 4階（マグマ）：冷やす溶岩・ふきだす溶岩・ゆらぐ岩の橋・あつい床 ===== */{S.t=Math.floor(S.t/1440)*1440+9*60;caveEnter(P3(),{},3);C=CV;C.en=[];const S3=one('S'),R3=one('R');
      out.mainM=!!cvBfs(S3,j=>j===R3);const LL=fk('L'),IT=chests(3).find(j=>cvX(j)>cvX(LL[LL.length-1]));out.islNo=!reachAdj(S3,IT);const w=act('water');putJ(w,LL[0]-1);cvUse(LL[0],C.ob.get(LL[0]));step(12);out.cool=[!!C.ob.get(LL[0]).done,!C.wt[LL[LL.length-1]]];out.islOk=reachAdj(S3,IT);
      /* ふきだす：上にいると、おなかがへる */const V=one('V');let tn=performance.now();while(cvVent(V,tn)!==2)tn+=50;const e=act('earth');full();putJ(e,V);const h0=e.r.hunger;caveFrame(1/30,tn);out.vent=e.r.hunger<h0;
      /* 橋：3回わたると、くずれる */const zb=one('z'),zo=C.ob.get(zb),zn=nb(zb).find(j=>!C.ob.get(j));for(let i=0;i<3;i++){putJ(e,zb);e.cj=zb;putJ(e,zn);e.cj=zb;cvStep(e,performance.now(),true)}out.bridge=[!!zo.gone,!!C.wt[zb],!cvWalk(zb)];
      /* あつい床：火のせいれいのほかは、おなかがへる */full();const f=act('fire'),HH=fk('H');putJ(e,HH[0]);putJ(f,HH[1]);const he=e.r.hunger,hf=f.r.hunger;step(2);out.hot=(he-e.r.hunger)>(hf-f.r.hunger)+1;caveAbort()}
    return JSON.stringify(out)})()`));
  console.log(JSON.stringify(r));
  assert.equal(r.nightPop,false,'夜は出かけられない');assert.equal(r.prep,true);assert.equal(r.slots,5);
  assert.equal(r.enter,true);assert.equal(r.paused,true,'洞窟のあいだ村は止まる');assert.equal(r.cls,true);assert.equal(r.hud,true);assert.equal(r.seenStart,true);assert.equal(r.unseenFar,true);
  assert.deepEqual(r.abyss,[true,true,true],'大穴：大きい・歩けない・見とおせる');assert.equal(r.abyssPath,true,'大穴の暗がりの形');
  assert.equal(r.mainPath,true,'どのパーティでも、かえりの光まで行ける');assert.ok(r.closed.every(v=>v===false),'宝箱は、どれも門の先');assert.equal(r.walked,true);
  assert.equal(r.windNo,true);assert.equal(r.woodNo,true);
  assert.equal(r.sel,'b');assert.equal(r.dirs.length,2,'左はでっぱり・右は立つ所がない：上と下にだけおせる');assert.equal(r.pushed,true);assert.equal(r.reset,1);assert.equal(r.home,true);assert.equal(r.hole,true);assert.equal(r.earthOpen,true);
  assert.equal(r.chest,true);assert.equal(r.fos,1);
  assert.equal(r.t1,true);assert.equal(r.doorNo,true);assert.equal(r.tOut,true,'たいまつは消える');assert.equal(r.queued,2);assert.equal(r.door,true);assert.equal(r.fireOpen,true);
  assert.equal(r.sluice,'x');assert.equal(r.dry,true,'水は、すぐにはとどかない');assert.equal(r.wet,true);assert.equal(r.other,true);assert.equal(r.noSecond,true,'水門は片方だけ');
  assert.ok(r.crack.length>=2&&r.crack.every(v=>v));assert.equal(r.detour,true,'まわり道がある');assert.equal(r.rockArmed,true);assert.equal(r.rockHurt,true);
  assert.equal(r.wall0,true);assert.equal(r.wall,true);assert.equal(r.hidden,true);
  assert.equal(r.dimSleep,true,'光をしぼると、そばでも起きない');assert.equal(r.ambush,true);assert.equal(r.wokeHit,true);assert.equal(r.wideWake,true);assert.equal(r.noStack,true);
  assert.equal(r.ate,true);assert.equal(r.hunAte,800);assert.equal(r.fsAte,1);assert.equal(r.gone,true);assert.equal(r.lost,true);
  assert.equal(r.exit,true);assert.ok(r.pt>=0&&r.pt<=3);assert.equal(r.dt,120,'洞窟にいた時間ぶん、村の時計が進む');assert.equal(r.pop,true);
  assert.equal(r.inv,1,'ほりだした土器');assert.equal(r.fosRec,1);assert.equal(r.zk,1);assert.equal(r.zkAll,5);assert.equal(r.ico,'data:image');assert.equal(r.zkList,1);assert.equal(r.lit,true);assert.deepEqual(r.again,[0,30]);
  assert.equal(r.blowOff,null,'まっすぐ先でない');assert.equal(r.blowWall,false,'岩のむこう');assert.equal(r.millNo,true);assert.equal(r.blowHit,true);assert.equal(r.mill,true);
  assert.deepEqual(r.back0,[true,0,true],'1階：どこからでも入口か坂へもどれる');assert.deepEqual(r.terr,[false,false,true]);assert.deepEqual(r.step,[true,false,true,true],'とびおりる・坂からのぼる');assert.equal(r.ore,true);assert.equal(r.top,3);
  assert.equal(r.clr0,0);assert.equal(r.clr,1,'坂まで来ると、つぎの階がひらく');assert.equal(r.clrF,true);assert.equal(r.fl0,0);assert.equal(r.drip,1);assert.equal(r.chunks,true);
  assert.equal(r.flBtn,2,'出かける階をえらべる');assert.equal(r.fl1,1);assert.equal(r.main2,true,'2階：どのパーティでも坂まで行ける');assert.ok(r.closed2.every(v=>v===false));assert.equal(r.back1,0);assert.deepEqual(r.tier,[true,false,true]);assert.equal(r.dirs2.length,1);assert.equal(r.isle,true);
  assert.equal(r.leaf0,3);assert.equal(r.leaf,0);assert.equal(r.island,true);assert.equal(r.far,true);assert.equal(r.noLeaf,true);assert.equal(r.abort,true);
  assert.deepEqual(r.iceB,[true,0],'氷の階：坂まで行ける・どこからでももどれる');assert.deepEqual(r.slide,[true,true,true],'氷の上は、すべって、とちゅうで止まれない');
  assert.equal(r.westNo,true);assert.equal(r.melt,true,'火のせいれいが氷のかべをとかす');assert.equal(r.westOk,true);assert.equal(r.thaw,true,'氷づけの宝箱がとける');
  assert.equal(r.mainM,true,'マグマの階：坂まで行ける');assert.equal(r.islNo,true);assert.deepEqual(r.cool,[true,true],'水のせいれいが溶岩を冷やす（つながった所みな）');assert.equal(r.islOk,true);
  assert.equal(r.vent,true,'ふきだす溶岩にあたると、おなかがへる');assert.deepEqual(r.bridge,[true,true,true],'岩の橋は3回でくずれる');assert.equal(r.hot,true,'あつい床');
  assert.deepEqual(errors,[]);await browser.close();console.log('OK');
})().catch(e=>{console.error(e);process.exit(1)});
