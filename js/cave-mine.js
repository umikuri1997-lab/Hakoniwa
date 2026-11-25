'use strict';
/* 4階「古い採掘場」のしくみ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・まきあげの足場（P：2×2）：上の段か下の段に止まっている。止まっている段のほうへだけ出入りできる（さく。cave.js の cvStepOK）
     まきあげ機（w）は、上の段と下の段に1つずつ。足場がほかの段にいれば、よびよせる。この段にいれば、みんなで乗って、もう片方の段へ
   ・ほりくず（u）：ほりくず人形（cave-bake.js の bk_kuzu）がたおれると、そのマスにのこる岩。だれでもおせる・まもりの光でくずれる
   ・かけたつるはし（むかしの道具 rel_tsuru）：うすい壁（W）を、たたいてくずせる
   たしかめは tools/tests/cave-mine.cjs */
const cvIsP=j=>!!(CV&&CV.lift&&CV.lift.set.has(j));
/* 入るとき：足場のマス・止まる2つの段（となりの床の、いちばん高い段と低い段）。はじめは上の段 */
function cvLiftInit(C){C.lift=null;const L=[];for(const[j,o]of C.ob)if(o.k==='P')L.push(j);for(const[j,o]of C.ob)if(o.k==='w'){o.lv=C.lv[j];o.j=j}if(!L.length)return;
  const set=new Set(L);let a=-1,b=99;for(const j of L)for(const[dx,dy]of DIRS){const x=cvX(j)+dx,y=cvY(j)+dy;if(x<0||y<0||x>=CVW||y>=CVH)continue;const k=cvJ(x,y);if(set.has(k)||!C.g[k]||C.wt[k])continue;const o=C.ob.get(k);if(o&&o.k!=='w'&&!cvWalk0(o))continue;a=Math.max(a,C.lv[k]);b=Math.min(b,C.lv[k])}
  L.sort((p,q)=>p-q);C.ob.get(L[0]).top=true;C.lift={cells:L,set,a,b,lv:a,h:a,mv:null};for(const j of L)C.lv[j]=a}
const cvWalk0=o=>'SR!g^qhkDE12'.includes(o.k);/* 歩けるかもしれない物（足場の止まる段をきめるとき） */
/* 足場をうごかす（のっている物ごと） */
function cvLiftGo(to){const C=CV,P=C.lift;if(!P||P.mv||P.lv===to)return false;P.mv={from:P.lv,to,e:0};
  for(const q of C.party.concat(C.en))if(!q.dead&&P.set.has(cvCell(q))){q.path=[];q.mv=false;q.chase=false}
  sfx('crank');return true}
function cvLiftTick(mv,now){const C=CV,P=C.lift;if(!P||!P.mv)return;P.mv.e+=mv;const t=Math.min(1,P.mv.e/CVLIFTS),e=t<.5?2*t*t:1-2*(1-t)*(1-t);P.h=P.mv.from+(P.mv.to-P.mv.from)*e;
  if(t<1)return;P.lv=P.h=P.mv.to;P.mv=null;for(const j of P.cells)C.lv[j]=P.lv;sfx('tstone');
  for(const a of C.party)if(P.set.has(cvCell(a))){cvReveal(a.x,a.y-CVOY,cvSeeR());a.jumpT=now}cvHudUpd()}
/* まきあげ機をタップ */
function cvWinchUse(j,o){const C=CV,P=C.lift;if(!P)return;if(P.mv)return toast('足場がうごいています');
  const ride=P.lv===o.lv,goal=ride?q=>P.set.has(q)&&cvAdj(q,j):q=>cvAdj(q,j)&&!P.set.has(q);
  let ba=null,bp=null;for(const a of C.party){const p=cvBfs(cvCell(a),goal);if(p&&(!bp||p.length<bp.length)){bp=p;ba=a}}if(!ba)return toast('そこへ行けません');
  ba.job={k:'winch',j,ride,t:0};ba.jq=[];ba.path=bp;ba.mv=false;ba.chase=false;const to=bp.length?bp[bp.length-1]:cvCell(ba);
  if(ride){/* ほかのなかまも足場へ */const free=P.cells.filter(q=>q!==to);for(const a of C.party){if(a===ba)continue;let best=null;for(const q of free){const p=cvBfs(cvCell(a),k=>k===q);if(p&&(!best||p.length<best.length))best=p}
      if(best){const q=best.length?best[best.length-1]:cvCell(a);free.splice(free.indexOf(q),1);a.job=null;a.jq=[];a.path=best;a.mv=true;a.chase=false}}}
  else cvGo(to,ba);sfx('tap')}
/* 作業：まきあげ機・つるはし（cvJobTick から。true なら、この作業をあつかった） */
function cvMineJob(a,J,o,cj,cdt,now){const C=CV,P=C.lift,end=()=>{a.job=null;return true};
  if(J.k==='winch'){if(!P||o.k!=='w')return end();if(P.mv)return true;if(J.ride&&P.lv!==o.lv)return end();
    const ok=J.ride?P.set.has(cj)&&cvAdj(cj,J.j):cvAdj(cj,J.j);if(!ok){const p=cvBfs(cj,q=>J.ride?P.set.has(q)&&cvAdj(q,J.j):cvAdj(q,J.j));if(!p)return end();a.path=p;return true}
    cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));
    if(J.ride&&C.party.some(q=>q!==a&&q.path.length&&P.set.has(q.path[q.path.length-1])))return true;/* 乗りに来るなかまを待つ（おいていかない） */
    J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;if(J.t<CVWINCHT)return true;
    cvLiftGo(J.ride?(o.lv===P.a?P.b:P.a):o.lv);return end()}
  if(J.k==='dig'){if(o.k!=='W')return end();if(!cvAdj(cj,J.j)){const p=cvBfs(cj,q=>cvAdj(q,J.j));if(!p)return end();a.path=p;return true}
    cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));a.swing=now;J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;if(J.t<CVDIGT)return true;
    C.ob.delete(J.j);C.g[J.j]=1;sfx('crack');cvSpark(cvX(J.j)+.5,cvY(J.j)+.5,'#d9c7a8',18);toast('うすい壁がくずれた','good');a.joyU=now+1400;for(const q of C.party)cvReveal(q.x,q.y-CVOY,cvSeeR());return end()}
  return false}
/* かけたつるはしで、うすい壁をたたく */
function cvDigUse(j){const C=CV;let ba=null,bp=null;for(const a of C.party){const p=cvBfs(cvCell(a),q=>cvAdj(q,j));if(p&&(!bp||p.length<bp.length)){bp=p;ba=a}}if(!ba)return toast('そこへ行けません');
  ba.job={k:'dig',j,t:0};ba.jq=[];ba.path=bp;ba.mv=false;ba.chase=false;cvGo(bp.length?bp[bp.length-1]:cvCell(ba),ba);sfx('tap')}
/* ほりくず：ほりくず人形がたおれた所に、のこる */
function cvKuzuRub(e){const C=CV,j=cvCell(e);if(j<0||j>=CVW*CVH||!C.g[j]||C.wt[j]||C.br[j]||C.ob.has(j)||C.party.some(a=>cvCell(a)===j))return;
  C.ob.set(j,{k:'u',done:false,home:j});cvSpark(cvX(j)+.5,cvY(j)+.5,'#a08a6a',14);later(()=>{if(CV===C)sfx('tstone')},HIT_LAG+KO_HOLD);if(!C.note.kuzu){C.note.kuzu=1;toast('くずれて、岩がのこった','warn')}}
/* 岩をおすせいれい：おせる岩 b は土のせいれい・ほりくず u は、だれでも（立つマスへ行けるせいれい） */
function cvPusher(j,s){const C=CV,o=C.ob.get(j);if(!o)return null;if(o.k==='b')return C.party.find(q=>q.elem==='earth')||null;
  let ba=null,bl=1e9;for(const a of C.party){const p=cvBfs(cvCell(a),q=>q===s);if(p&&p.length<bl){bl=p.length;ba=a}}return ba}
/* ---------- 絵（仮のドット絵。クォータービューの画面の点で） ---------- */
/* 足場：板の床・3方のさく・上の段のはりからの綱。止まっている段のほう（出入りできる側）は、さくがない */
function cvLiftDraw(c,now){const C=CV,P=C.lift;if(!P)return;cvqLv(0);const h=P.h-C.lv0,x0=cvX(P.cells[0]),y0=cvY(P.cells[0]),x1=cvX(P.cells[P.cells.length-1])+1,y1=cvY(P.cells[P.cells.length-1])+1;
  const pt=(x,y,l)=>{const Y=y+CVOY;return[(x-Y)*IQW/2,(x+Y)*IQH/2-l*IQL]},F=(col,a,b,w,hh)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(b),w,hh)};
  const N=pt(x0,y0,h),E=pt(x1,y0,h),S=pt(x1,y1,h),Wp=pt(x0,y1,h),poly=(L,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(L[0][0],L[0][1]);for(const q of L.slice(1))c.lineTo(q[0],q[1]);c.closePath();c.fill()};
  /* 綱：4すみから、上の段のはりへ */const top=P.a-C.lv0+2.4;for(const[x,y]of[[x0,y0],[x1,y0],[x0,y1],[x1,y1]]){const A=pt(x,y,h),B=pt(x,y,top);F('#3a2c1e',A[0]-1,B[1],1,A[1]-B[1]);F('#8a7050',A[0],B[1],1,A[1]-B[1])}
  {const A=pt(x0,y0,top),B=pt(x1,y0,top);poly([[A[0],A[1]-3],[B[0],B[1]-3],[B[0],B[1]+1],[A[0],A[1]+1]],'#5a4028')}/* はり */
  /* 床の厚み（手前の2面）と板 */const T=5;poly([Wp,S,[S[0],S[1]+T],[Wp[0],Wp[1]+T]],'#4a3420');poly([S,E,[E[0],E[1]+T],[S[0],S[1]+T]],'#5e4228');poly([N,E,S,Wp],'#8a6440');
  for(let i=1;i<6;i++){const a=pt(x0+(x1-x0)*i/6,y0,h),b=pt(x0+(x1-x0)*i/6,y1,h);c.strokeStyle='#6a4a2c';c.lineWidth=1;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
  /* さく：止まっている段のとなりのがわには、ない */const open=(dx,dy)=>P.cells.some(j=>{const x=cvX(j)+dx,y=cvY(j)+dy;if(x<0||y<0||x>=CVW||y>=CVH)return false;const k=cvJ(x,y);return !P.set.has(k)&&C.g[k]&&!C.wt[k]&&C.lv[k]===Math.round(P.h)&&!(C.ob.get(k)&&C.ob.get(k).k==='w')});
  const rail=(A,B)=>{const R=10;c.fillStyle='#a07a4c';for(let i=0;i<=4;i++){const x=A[0]+(B[0]-A[0])*i/4,y=A[1]+(B[1]-A[1])*i/4;c.fillRect(Math.round(x),Math.round(y-R),1,R)}c.strokeStyle='#c09060';c.beginPath();c.moveTo(A[0],A[1]-R);c.lineTo(B[0],B[1]-R);c.stroke()};
  if(!P.mv){if(!open(0,-1))rail(N,E);if(!open(-1,0))rail(N,Wp);if(!open(0,1))rail(Wp,S);if(!open(1,0))rail(E,S)}else{rail(N,E);rail(N,Wp);rail(Wp,S);rail(E,S)}}
/* まきあげ機：木のわくと、綱をまいた胴・ハンドル（立てて描く） */
function cvWinchDraw(o,ox,oy,now){const C=CV,P=C.lift,turn=C.party.some(a=>a.job&&a.job.k==='winch'&&a.job.j===o.j&&!a.path.length)||P&&P.mv,an=turn?now/180:0;
  P4('rgba(30,20,10,.3)',ox+5,oy+26,22,3);P4('#5a4028',ox+6,oy+8,3,20);P4('#5a4028',ox+23,oy+8,3,20);P4('#7a5634',ox+6,oy+8,1,20);P4('#7a5634',ox+23,oy+8,1,20);
  P4('#6a4a2c',ox+9,oy+11,14,8);P4('#c8b088',ox+9,oy+12,14,1);P4('#c8b088',ox+9,oy+14,14,1);P4('#c8b088',ox+9,oy+16,14,1);P4('#4a3420',ox+9,oy+18,14,1);
  const hx=ox+27,hy=oy+15;P4('#3a3a3e',hx,hy-1,2,3);P4('#5a5a60',hx+Math.round(Math.cos(an)*4),hy+Math.round(Math.sin(an)*4)-1,2,2)}
/* ほりくず：土と石くずのかたまり */
function cvRubDraw(j,o,ox,oy,now){let dx=0,dy=0;if(o.slide){const t=(now-o.slide.t0)/220;if(t>=1)o.slide=null;else{dx=(cvX(o.slide.from)-cvX(j))*TS*(1-t);dy=(cvY(o.slide.from)-cvY(j))*TS*(1-t)}}ox=Math.round(ox+dx);oy=Math.round(oy+dy);
  P4('rgba(30,20,10,.25)',ox+4,oy+26,24,3);P4('#5e4c3a',ox+5,oy+14,22,13);P4('#7a6650',ox+7,oy+10,16,12);P4('#968064',ox+10,oy+8,8,5);P4('#5e4c3a',ox+20,oy+18,6,8);P4('#a8946e',ox+11,oy+9,3,1);P4('#4a3a2c',ox+8,oy+20,4,2);P4('#4a3a2c',ox+16,oy+16,3,2)}
