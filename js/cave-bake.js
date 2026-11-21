'use strict';
/* 洞窟のバケモノ（cave.js のつづき）。設定は STORY.md の「土の谷の大穴とバケモノ」
   ・階ごとの、たたかえるバケモノ（CVBK。EN に入れて、たたかいの数字は村と同じしくみ）：その階で人がしたことから生まれた物
   ・4つのこわい物（CVSC。たおせない。よけ方がある）：声のこだま（1階から）・見はりの目（2階から）・えさ（3階から）・ほりつづける手（4階から。大穴のある階だけ）
   ・絵は、コードの仮のドット絵（トリポの絵ができたら、かえる）
   たしかめは tools/tests/cave-bake.cjs */
/* たたかえるバケモノ（数字は実数。hitF・hitN は、たたかれたせいれいのへるおなか） */
const CVBK={
  bk_kui:{bk:1,name:'くいのホムンクルス',xp:12,pw:8,hp:300,sp:.45,atk:30,hit:30,hitF:90,hitN:80,hitFS:60,hitNS:50,hitFN:90,hitFNS:60,col:'#6a5a48',eye:'#e8d8a0',size:1.1},/* おそいが、じょうぶ */
  bk_sui:{bk:1,name:'光すい',xp:8,pw:6,hp:140,sp:.8,atk:25,hit:20,hitF:40,hitN:60,hitFS:25,hitNS:35,hitFN:40,hitFNS:25,col:'#2a2040',eye:'#b49cff',size:.85,drain:1},/* そばにいると、光の広さが小さくなる */
  bk_yoru:{bk:1,name:'夜の水のかたまり',xp:10,pw:7,hp:200,sp:.7,atk:28,hit:25,hitF:50,hitN:70,hitFS:30,hitNS:40,hitFN:50,hitFNS:30,col:'#0c1018',eye:'#7fe8ff',size:.95,split:1},/* たたくと、2つにわかれる（1回だけ） */
  bk_tame:{bk:1,name:'ためしのからだ',xp:12,pw:9,hp:240,sp:.6,atk:30,hit:30,hitF:60,hitN:80,hitFS:40,hitNS:50,hitFN:60,hitFNS:40,col:'#9cbcd0',eye:'#2a3a4e',size:1.05,thaw:1},/* 火のせいれいが近づくと、とけて目をさます */
  bk_hone:{bk:1,name:'組みかけのほね',xp:12,pw:9,hp:180,sp:.75,atk:28,hit:25,hitF:50,hitN:70,hitFS:30,hitNS:40,hitFN:50,hitFNS:30,col:'#e8dcc0',eye:'#ff8a5a',size:1,rebuild:1},/* たおしても、組みなおして起きる（まもりの光でとどめ） */
  bk_ro:{bk:1,name:'炉にくべられたもの',xp:12,pw:9,hp:160,sp:1.4,atk:22,hit:20,hitF:45,hitN:65,hitFS:28,hitNS:40,hitFN:45,hitFNS:28,col:'#3a1810',eye:'#ffd860',size:.9,hot:1},/* 速い。通った所が、あつい床になる */
  bk_mi:{bk:1,name:'ゆりかごのみはり',xp:14,pw:10,hp:260,sp:.9,atk:30,hit:30,hitF:60,hitN:85,hitFS:40,hitNS:50,hitFN:60,hitFNS:40,col:'#4c535c',eye:'#ffe08a',size:1.15,patrol:1}};/* ゆりかごのそばに来た子をねらう */
Object.assign(EN,CVBK);
const CVBKFL={roots:'bk_kui',crystal:'bk_sui',lake:'bk_yoru',ice:'bk_tame',fossil:'bk_hone',magma:'bk_ro',cradle:'bk_mi'};/* 階のバケモノ */
function cvFoeType(ch,th){return CVBKFL[th]||CVFOES[ch]}
const CVSUIR=3,CVSUIK=.6;/* 光すい：まわりのマス・光の広さ */
const CVTAMER=3;/* ためしのからだ：火のせいれいが、このマスまで近づくと目をさます */
const CVHONET=20;/* 組みかけのほね：組みなおすまで（時計の分） */
const CVROHOT=10;/* 炉にくべられたもの：通った所が、あつい床のままの時間（時計の分） */
const CVMIR=2,CVMIEYE=2.5;/* ゆりかごのみはり：ゆりかごのまわりのマス・自分のまわりで見つけるマス */
/* こわい物の数字（秒は実時間。マスは洞窟のマス） */
const CVSC={
  koe:{fl:0,sp:.55,near:1.4,frz:2.2,far:9,cd:[25,45],step:.55},/* 声のこだま：足音が近づき、そばまで来ると、みんなが すくむ（秒） */
  me:{fl:1,gaze:6,wake:7,d:[5,8],cd:[12,25]},/* 見はりの目：見られている秒・目をさます広さ */
  esa:{fl:2,sp:.9,hun:120,cd:[35,60],lure:5},/* えさ：かみつかれたせいれいのへるおなか */
  te:{fl:3,sp:.35,see:3,seeD:1.5,wind:1.2,hun:150,r:2,stun:4,shake:6,rest:8}};/* ほりつづける手：見つける広さ（光をしぼったとき）・ためる秒・とどく広さ・まもりの光で止まる秒 */
const cvRnd=a=>a[0]+Math.random()*(a[1]-a[0]);
/* 入るとき：こわい物を用意する */
function cvBakeEnter(C){C.sc=[];C.hotT=new Map();C.lrK=1;const fl=C.fl;
  if(fl>=CVSC.koe.fl)C.sc.push({k:'koe',on:false,cd:cvRnd(CVSC.koe.cd)});
  if(fl>=CVSC.me.fl)C.sc.push({k:'me',on:false,cd:cvRnd(CVSC.me.cd)});
  if(fl>=CVSC.esa.fl)C.sc.push({k:'esa',on:false,cd:cvRnd(CVSC.esa.cd)});
  if(fl>=CVSC.te.fl&&C.ab.some(v=>v)){const R=cvRimCells();if(R.length>8){/* 入口からいちばん遠い所から */let s=0,sd=-1;const S0=[...C.ob].find(([,o])=>o.k==='S');if(S0)for(let i=0;i<R.length;i++){const d=Math.hypot(cvX(R[i])-cvX(S0[0]),cvY(R[i])-cvY(S0[0]));if(d>sd){sd=d;s=i}}
    C.sc.push({k:'te',on:true,rim:R,i:s,dir:1,st:0,t:0,stun:0})}}}
/* 大穴のふちの、歩けるマス（大穴のまん中からの角度のじゅん） */
function cvRimCells(){const C=CV;let sx=0,sy=0,n=0;for(let j=0;j<CVW*CVH;j++)if(C.ab[j]){sx+=cvX(j);sy+=cvY(j);n++}if(!n)return[];const cx=sx/n,cy=sy/n,L=[];
  for(let j=0;j<CVW*CVH;j++){if(!cvWalk(j))continue;const x=cvX(j),y=cvY(j);if(DIRS.some(([dx,dy])=>{const a=x+dx,b=y+dy;return a>=0&&b>=0&&a<CVW&&b<CVH&&C.ab[cvJ(a,b)]}))L.push([Math.atan2(y-cy,x-cx),j])}
  return L.sort((a,b)=>a[0]-b[0]).map(q=>q[1])}
const cvPd=(a,x,y)=>Math.hypot(a.x-x-.5,a.y-CVOY-y-.5);/* せいれいと、マス（x,y）のまん中のきょり */
function cvNearest(x,y){let b=null,bd=1e9;for(const a of CV.party){const d=cvPd(a,x,y);if(d<bd){bd=d;b=a}}return[b,bd]}
/* 光の広さ（光すいのそばでは小さい） */
function cvLR(){const C=CV;return (C.dim?CVLIGHTD:CVLIGHT)*(C.lrK||1)}
/* 毎コマ */
function cvBakeTick(cdt,mv,now){const C=CV;if(!C.sc)return;
  /* 光すい：そばにいると、光の広さが小さくなる */
  {let k=1;for(const e of C.en){if(e.dead||e.down||!EN[e.type].drain)continue;if(C.party.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<=CVSUIR)){k=CVSUIK;if(!C.note.sui){C.note.sui=1;toast('光が、すいこまれていく','warn')}}}C.lrK=k}
  for(const e of C.en.slice()){if(e.dead)continue;const D=EN[e.type];
    if(D.split&&!e.kid&&!e.spl&&e.hp<e.max&&e.hp>0){/* 夜の水のかたまり：はじめてたたかれると、2つにわかれる */e.spl=1;const h=Math.ceil(e.hp/2);e.hp=h;const j=cvBfsRing(cvCell(e),2).find(q=>q!==cvCell(e));if(j!=null){C.en.push({id:C.eid++,type:e.type,x:cvX(j)+.5,y:cvY(j)+.5+CVOY,hp:h,max:h,spawned:true,asleep:false,stun:0,atk:0,path:[],rp:0,dead:false,tg:e.tg,cj:j,kid:1});cvSpark(cvX(j)+.5,cvY(j)+.5,'#7fe8ff',12);sfx('pour')}}
    if(e.down&&C.t>=e.down){/* 組みかけのほね：組みなおして起きる */e.down=0;e.hp=e.max;e.asleep=false;e.stun=0;cvSpark(e.x,e.y-CVOY,'#e8dcc0',14);sfx('crack');if(!C.note.hone){C.note.hone=1;toast('ほねが、また組みあがった','warn')}}
    if(D.hot&&!e.asleep&&!e.down){const j=cvCell(e);if(C.g[j]&&!C.wt[j])C.hotT.set(j,C.t+CVROHOT)}}
  for(const[j,u]of C.hotT)if(u<=C.t)C.hotT.delete(j);
  for(const a of C.party){const u=C.hotT.get(a.cj);if(u&&a.elem!=='fire'){a.r.hunger-=CVHOTHUN*cdt;if(!C.note.rohot){C.note.rohot=1;toast('あつい床。火のせいれいのほかは、おなかがはやくへる','warn')}}}
  for(const s of C.sc)cvScTick(s,cdt,mv,now)}
/* ねむりからさめるか（ためしのからだは、火のせいれいが近づいたときだけ） */
function cvWakeOK(e,a){const D=EN[e.type];if(D.thaw)return a.elem==='fire'&&Math.hypot(a.x-e.x,a.y-e.y)<=CVTAMER;return true}
/* ゆりかごのみはり：ゆりかごのそば・自分のそばに来た子だけ、ねらう。いなければ見回る */
function cvPatrol(e,mv){const C=CV;let tg=null,bd=1e9;for(const a of C.party){const d=Math.hypot(a.x-e.x,a.y-e.y);let near=d<=CVMIEYE;if(!near)for(let dy=-CVMIR;dy<=CVMIR&&!near;dy++)for(let dx=-CVMIR;dx<=CVMIR;dx++){const x=(a.x|0)+dx,y=((a.y-CVOY)|0)+dy,o=x>=0&&y>=0&&x<CVW&&y<CVH&&C.ob.get(cvJ(x,y));if(o&&o.k==='Y'){near=true;break}}if(near&&d<bd){bd=d;tg=a}}
  if(tg){e.tg=tg;return true}if(e.tg&&Math.hypot(e.tg.x-e.x,e.tg.y-e.y)<CVAGGRO)return true;e.tg=null;
  if(!e.path.length&&(e.pw=(e.pw||0)-mv)<=0){e.pw=2+Math.random()*3;const Y=[...C.ob].filter(([,o])=>o.k==='Y').map(([j])=>j);if(Y.length){const y=Y[(Math.random()*Y.length)|0],p=cvBfs(cvCell(e),q=>cvAdj(q,y));if(p)e.path=p.slice(0,12)}}
  if(e.path.length)cvMove(e,mv*CVFOE*EN[e.type].sp*.6);return false}
/* たおれたとき（組みかけのほねは、まもりの光でとどめをさすまで、たおれたまま組みなおす）。true なら、まだ消えない */
function cvBakeDown(e,a){const D=EN[e.type];if(!D||!D.rebuild||!a)return false;const C=CV;e.down=C.t+CVHONET;e.hp=0;e.path=[];e.tg=null;if(C.focus===e)C.focus=null;sfx('crack');if(!C.note.hdown){C.note.hdown=1;toast('ほねが、くずれた','good')}return true}
/* こわい物 */
function cvScTick(s,cdt,mv,now){const C=CV,P=CVSC[s.k];if(!C.party.length)return;
  if(!s.on){if((s.cd-=mv)>0)return;if(cvScSpawn(s))s.on=true;else s.cd=3;return}
  if(s.k==='koe'){const[a,d]=cvNearest(s.x,s.y);if(!a)return;
    if((s.st=(s.st||0)-mv)<=0){s.st=P.step;sfxAt('fstone',s.x+.5,s.y+.5+CVOY,.7)}/* 足音 */
    if(d<5)for(const q of C.party)if(!q.path.length&&(q.lk=(q.lk||0)-mv)<=0){q.lk=.6;q.face=-q.face;q.shockU=now+300}/* きょろきょろ */
    if(d<=P.near){for(const q of C.party){q.frzU=now+P.frz*1000;q.shockU=now+P.frz*1000;q.path=[];q.mv=false}sfx('warn');if(!C.note.koe){C.note.koe=1;toast('だれもいないのに、すぐそばで声がした','warn')}cvScOff(s);return}
    if((s.rp=(s.rp||0)-mv)<=0||!s.path||!s.path.length){s.rp=1;const tj=a.cj,p=cvBfs(cvJ(s.x,s.y),q=>q===tj);s.path=p||[]}
    cvScMove(s,mv*P.sp);return}
  if(s.k==='me'){const x=cvX(s.j),y=cvY(s.j),[a,d]=cvNearest(x,y);if(!a)return;
    if(d<cvLR()*.9){cvScOff(s,[3,6]);return}/* 光がとどくと消える */
    if(d<10)s.t+=mv*(C.dim?.5:1);
    if(s.t>=P.gaze){let n=0;for(const e of C.en)if(!e.dead&&e.asleep&&!EN[e.type].thaw&&C.party.some(q=>Math.hypot(q.x-e.x,q.y-e.y)<=P.wake)){e.asleep=false;e.wakeT=now;n++}sfx('warn');toast(n?'見られていた。バケモノが目をさました':'暗がりから、だれかが見ていた','warn');cvScOff(s);return}return}
  if(s.k==='esa'){const[a,d]=cvNearest(s.x,s.y);if(!a)return;
    if(s.rev){if(now>s.rev)cvScOff(s);return}
    if(!s.lured){/* ひまなせいれいが、見にいきたがる */const q=C.party.find(q=>!q.path.length&&!q.job&&cvPd(q,s.x,s.y)<=P.lure);if(q){s.lured=1;const tj=cvJ(s.x,s.y),p=cvBfs(q.cj,k=>cvAdj(k,tj));if(p)q.path=p}}
    if(d<=1.1){a.r.hunger=Math.max(0,a.r.hunger-P.hun);a.hurtU=now+3000;hitFx(a,P.hun,{sx:s.x+.5,sy:s.y+.5+CVOY,silent:1});for(const q of C.party)q.shockU=now+1200;s.rev=now+700;s.bite=1;sfx('warn');sfx('hit');if(!C.note.esa){C.note.esa=1;toast('かわいい生き物じゃなかった','warn')}cvHudUpd();return}
    if((s.rp=(s.rp||0)-mv)<=0||!s.path||!s.path.length){s.rp=1;const tj=a.cj,p=cvBfs(cvJ(s.x,s.y),q=>q===tj);s.path=p||[]}
    cvScMove(s,mv*P.sp);return}
  if(s.k==='te'){const j=s.rim[(s.i|0)%s.rim.length],x=cvX(j),y=cvY(j),[a,d]=cvNearest(x,y);s.x=x;s.y=y;
    if(s.stun>0){s.stun-=mv;return}
    if(d<=P.shake){/* 近づくと、地面がゆれて小石が落ちる */if((s.qk=(s.qk||0)-mv)<=0){s.qk=.7+Math.random()*.6;cvSpark(a.x+(Math.random()-.5)*3,a.y-CVOY-1.5,'#85776a',3);if(Math.random()<.4)sfx('crack')}if(!C.note.te){C.note.te=1;toast('地面が、ゆれている','warn')}}
    if(s.st===1){if((s.t+=mv)>=P.wind){/* 手をのばす */s.st=2;s.t=0;let hit=false;for(const q of C.party)if(cvPd(q,x,y)<=P.r){q.r.hunger=Math.max(0,q.r.hunger-P.hun);q.hurtU=now+3000;hitFx(q,P.hun,{sx:x+.5,sy:y+.5+CVOY,silent:1});hit=true}for(const q of C.party)q.shockU=now+1500;sfx('crack');if(hit){sfx('hit');cvHudUpd()}}return}
    if(s.st===2){if((s.t+=mv)>=P.rest){s.st=0;s.t=0}else{s.i+=s.dir*mv*P.sp*.5}return}
    if(d<=(C.dim?P.seeD:P.see)){s.st=1;s.t=0;sfx('warn');return}
    s.i+=s.dir*mv*P.sp;if(s.i<0)s.i+=s.rim.length;return}}
function cvScMove(s,v){if(!s.path||!s.path.length)return;const j=s.path[0],tx=cvX(j),ty=cvY(j),dx=tx-s.x,dy=ty-s.y,l=Math.hypot(dx,dy);if(l<=v){s.x=tx;s.y=ty;s.path.shift()}else{s.x+=dx/l*v;s.y+=dy/l*v}}
function cvScOff(s,cd){s.on=false;s.path=null;s.rev=0;s.lured=0;s.t=0;s.cd=cvRnd(cd||CVSC[s.k].cd)}
/* 出る所：パーティから見えない、はなれた所 */
function cvScSpawn(s){const C=CV,P=CVSC[s.k];let cx=0,cy=0;for(const a of C.party){cx+=a.x;cy+=a.y-CVOY}cx/=C.party.length;cy/=C.party.length;const L=[],lr=cvLR();
  for(let j=0;j<CVW*CVH;j++){if(!cvWalk(j))continue;const d=Math.hypot(cvX(j)+.5-cx,cvY(j)+.5-cy);
    if(s.k==='me'){if(d>=P.d[0]&&d<=P.d[1]&&d>lr+.5)L.push([!C.seen[j]?0:1,j])}
    else if(d>=6&&d<=(s.k==='koe'?P.far:8)&&!C.ice[j]&&C.party.every(a=>cvPd(a,cvX(j),cvY(j))>lr))L.push([0,j])}
  if(!L.length)return false;const best=Math.min(...L.map(q=>q[0])),M=L.filter(q=>q[0]===best),j=M[(Math.random()*M.length)|0][1];
  if(s.k==='me'){s.j=j;s.t=0}else{s.x=cvX(j);s.y=cvY(j);s.path=null;if(s.k==='esa')s.cr=Math.random()<.5?'critusagi':'critrisu'}return true}
/* まもりの光があたったとき */
function cvBakeLight(tx,ty,R){const C=CV;if(!C.sc)return;const now=performance.now();
  for(const s of C.sc){if(!s.on)continue;const x=s.k==='me'?cvX(s.j):s.x,y=s.k==='me'?cvY(s.j):s.y,d=Math.max(Math.abs(x-tx),Math.abs(y-ty));
    if(s.k==='te'){if(d<=R+2){s.stun=CVSC.te.stun;s.st=0;s.t=0;cvSpark(x+.5,y+.5,'#fff3c4',14)}continue}
    if(d>R+1)continue;
    if(s.k==='koe'){s.vis=now+1500;setTimeout(()=>{if(CV===C)cvScOff(s,[35,60])},1500);cvSpark(x+.5,y+.5,'#d8d0ff',16);if(!C.note.koeL){C.note.koeL=1;toast('光の中に、うすいすがたが見えて、消えた','good')}}
    else if(s.k==='esa'&&!s.rev){s.rev=now+900;s.bite=0;cvSpark(x+.5,y+.5,'#fff3c4',12);if(!C.note.esaL){C.note.esaL=1;toast('光をあびて、正体をあらわした','good')}}
    else if(s.k==='me')cvScOff(s,[6,12])}}
/* ---------- 絵（仮のドット絵） ---------- */
/* 3Dから写したチップ（tools/art/cave/bake_build.py。bk<名前>#<コマ>）：止まる 0・1／歩く w0〜w3／たたく a0（ためる）・a1（ふりおろす） */
const CVBKV=new WeakMap();
function cvBkFrame(e,now){const D=EN[e.type];let v=CVBKV.get(e);if(!v){v={x:e.x,y:e.y,mv:0,f:1};CVBKV.set(e,v)}const dx=e.x-v.x,dy=e.y-v.y;if(Math.abs(dx)+Math.abs(dy)>.001){v.mv=now;if(Math.abs(dx)>.0005)v.f=dx<0?-1:1}v.x=e.x;v.y=e.y;
  if(e.tg&&!e.asleep&&Math.abs(e.tg.x-e.x)>.05)v.f=e.tg.x<e.x?-1:1;
  const t=now/1000+e.id*.7;let fr;if(now-(e.swing||-1e9)<260)fr='a1';else if(!e.asleep&&(e.atk||0)/D.atk>.55)fr='a0';else if(now-v.mv<220)fr='w'+(((t*6)|0)%4);else fr=((t*1.6)|0)%2?'1':'0';return[fr,v.f]}
function cvBkChip(g,id,fx,fy,f,al){const ch=cvChipOf(id);if(!ch)return false;const im=chipImgs(ch,id)[0];if(!im||!im.ok)return false;const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=false;g.save();g.globalAlpha=al==null?1:al;g.translate(Math.round(fx),Math.round(fy));if(f<0)g.scale(-1,1);g.drawImage(im,ch.ax/2,ch.ay/2,ch.w/2,ch.h/2);g.restore();g.imageSmoothingEnabled=sm;return true}
function cvBkDraw(e,now){if(!e.down){const D=EN[e.type],[fr,f]=cvBkFrame(e,now),ho=hitOff(e,now,1),x=e.x*TS+ho[0],y=e.y*TS+ho[1];P4('rgba(0,0,0,.3)',x-9*D.size,y+6,18*D.size,3);
    if(cvBkChip(ctx,'bk'+e.type.slice(3)+'#'+fr,x,y+7,f,e.stun>0?.6:1)){
      if(D.thaw&&e.asleep){ctx.globalAlpha=.55;P4('#c0e2f6',x-10,y-30,20,36);ctx.globalAlpha=.9;P4('#e6f8ff',x-10,y-30,2,36);ctx.globalAlpha=1}/* 氷の中でねむる */
      if(ho[2]){ctx.globalAlpha=.5;P4('#ffffff',x-8,y-28,16,30);ctx.globalAlpha=1}
      if(e.hp<e.max&&!e.asleep){const w=18;P4('rgba(0,0,0,.5)',x-w/2,y-40*D.size-4,w,3);P4('#ff8a8a',x-w/2,y-40*D.size-4,Math.max(1,Math.round(w*e.hp/e.max)),3)}return}}
  cvBkDraw0(e,now)}
function cvBkDraw0(e,now){const D=EN[e.type],k=e.type,s=D.size,t=now/1000+e.id,ho=hitOff(e,now,1),x=Math.round(e.x*TS+ho[0]),y=Math.round(e.y*TS+ho[1]),R=(c,a,b,w,h)=>P4(c,x+a*s,y+b*s,Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s))),bob=Math.round(Math.sin(t*3)*1.5),fl=ho[2];
  ctx.globalAlpha=e.stun>0?.6:1;P4('rgba(0,0,0,.3)',x-9*s,y+6,18*s,3);
  if(e.down){/* くずれたほね */R('#b8a888',-10,0,20,4);R('#e8dcc0',-8,-2,8,3);R('#e8dcc0',2,-3,9,3);R('#e8dcc0',-3,-5,5,5);R('#8a7a62',-2,-4,2,2);ctx.globalAlpha=1;return}
  if(k==='bk_kui'){R('#4a3a2c',-6,-26+bob,12,26);R('#6a5a48',-5,-25+bob,9,24);R('#8a5a36',-1,-34+bob,3,40);R('#b06a3a',-1,-34+bob,1,10);R('#6a5030',-12,-18+bob,7,2);R('#6a5030',6,-16+bob,8,2);R('#6a5030',-13,-18+bob,2,8);R('#6a5030',13,-16+bob,2,7);R('#5a4a3c',-5,-32+bob,10,8);R(D.eye,-3,-29+bob,2,2);R(D.eye,1,-29+bob,2,2)}
  else if(k==='bk_sui'){const p=.5+.5*Math.sin(t*2);R('#1a1428',-9,-24+bob,18,16);R('#2a2040',-7,-26+bob,14,20);R('#0a0610',-4,-20+bob,8,8);ctx.globalAlpha=.4+.4*p;R('#6a4cc0',-11,-18+bob,2,4);R('#6a4cc0',9,-22+bob,2,5);R('#9a7ef0',-2,-30+bob,4,4);ctx.globalAlpha=e.stun>0?.6:1;R(D.eye,-1,-18+bob,2,2)}
  else if(k==='bk_yoru'){const w=Math.round(Math.sin(t*4)*2);R('#0c1018',-10-w/2,-10,20+w,10);R('#0c1018',-7,-17,14,8);R('#1a2230',-6,-16,5,2);R('#2a3a4e',-9,-3,18,1);R(D.eye,-3,-12,2,2);R(D.eye,2,-12,2,2);if(Math.sin(t*2)>.6)R('#7fe8ff',8,-6,1,1)}
  else if(k==='bk_tame'){if(e.asleep){ctx.globalAlpha=.85;R('#9ccae6',-9,-30,18,30);R('#c0e2f6',-7,-28,14,26);ctx.globalAlpha=1;R('#5a7086',-4,-24,8,18);R('#5a7086',-2,-27,5,4);R('#e6f8ff',-9,-30,2,30)}
    else{R('#7a98ae',-6,-24+bob,12,22);R(D.col,-5,-23+bob,10,20);R(D.col,-4,-30+bob,8,7);R('#7a98ae',-10,-18+bob,4,10);R('#7a98ae',6,-18+bob,4,10);R(D.eye,-3,-27+bob,2,2);R(D.eye,1,-27+bob,2,2);R('#e6f8ff',-5,-23+bob,1,8)}}
  else if(k==='bk_hone'){R('#b8a888',-1,-26+bob,2,22);for(let i=0;i<4;i++){R(D.col,-7,-22+i*4+bob,14,2)}R(D.col,-5,-33+bob,10,8);R('#5a4e42',-3,-30+bob,2,2);R('#5a4e42',1,-30+bob,2,2);R(D.eye,-3,-30+bob,1,1);R(D.col,-6,-4,3,4);R(D.col,3,-4,3,4);R(D.col,-11,-20+bob,4,2);R(D.col,8,-18+bob,4,2)}
  else if(k==='bk_ro'){const p=.5+.5*Math.sin(t*6);R('#1a0a06',-8,-18+bob,16,18);R(D.col,-7,-17+bob,14,16);ctx.globalAlpha=.6+.4*p;R('#ff5a20',-4,-14+bob,2,10);R('#ff7a1c',2,-12+bob,2,8);R('#ffd860',-1,-8+bob,2,3);ctx.globalAlpha=e.stun>0?.6:1;R(D.eye,-3,-15+bob,2,2);R(D.eye,1,-15+bob,2,2)}
  else if(k==='bk_mi'){R('#2a2e34',-5,-36+bob,10,36);R(D.col,-4,-35+bob,8,34);R('#606872',-4,-35+bob,8,2);R('#6a4a32',-6,-20+bob,12,2);R('#16181c',-3,-32+bob,6,5);const p=.5+.5*Math.sin(t*1.5);ctx.globalAlpha=.6+.4*p;R(D.eye,-1,-31+bob,3,3);ctx.globalAlpha=e.stun>0?.6:1;R('#3a4048',-9,-26+bob,3,14);R('#3a4048',6,-26+bob,3,14)}
  if(fl){ctx.globalAlpha=.6;R('#ffffff',-8,-30,16,30)}
  ctx.globalAlpha=1;if(e.hp<e.max&&!e.asleep){const w=18;P4('rgba(0,0,0,.5)',x-w/2,y-40*s-4,w,3);P4('#ff8a8a',x-w/2,y-40*s-4,Math.max(1,Math.round(w*e.hp/e.max)),3)}}
/* あつい床のあと・こわい物（足もとの順に描く） */
function cvBakeL(L,now){const C=CV;if(!C.sc)return;
  for(const[j,u]of C.hotT){if(!C.seen[j])continue;L.push([-1,()=>{const p=.5+.5*Math.sin(now/300+j),ox=cvX(j)*TS,oy=(cvY(j)+CVOY)*TS;ctx.globalAlpha=Math.min(1,(u-C.t)/3)*(.35+.3*p);P4('#ff5a20',ox+4,oy+8,24,16);P4('#ffb040',ox+10,oy+13,12,5);ctx.globalAlpha=1}])}
  for(const s of C.sc){if(!s.on)continue;
    if(s.k==='esa'){const ox=s.x*TS,oy=(s.y+CVOY)*TS;L.push([s.y+CVOY+.9,()=>{if(s.rev&&cvBkChip(ctx,'bkesa#'+(s.bite?'a1':'a0'),ox+16,oy+30,1))return;if(s.rev){/* 正体：口をあけた黒いかげ */const b=s.bite?1:.8;P4('#0a0608',ox+2,oy+2,28*b,26*b);P4('#3a0a10',ox+6,oy+10,20*b,10*b);for(let i=0;i<5;i++)P4('#e8e0d0',ox+7+i*4,oy+10,2,3);P4('#ff6b8a',ox+9,oy+5,3,2);P4('#ff6b8a',ox+20,oy+5,3,2);return}
      if(!cvChip(ctx,s.cr+'#'+(((now/250)|0)%2?'w0':'0'),ox,oy,now)){P4('#d8c8b0',ox+10,oy+16,12,10);P4('#d8c8b0',ox+12,oy+8,3,8)}/* かげがない（足もとに、かげを描かない） */}])}
    if(s.k==='koe'&&s.vis>now){const ox=s.x*TS,oy=(s.y+CVOY)*TS;L.push([s.y+CVOY+.9,()=>{ctx.globalAlpha=.35*(s.vis-now)/1500;P4('#d8d0ff',ox+10,oy-14,12,40);P4('#d8d0ff',ox+8,oy-18,16,8);ctx.globalAlpha=1}])}
    if(s.k==='te'&&C.seen[cvJ(s.x,s.y)]){const ox=s.x*TS,oy=(s.y+CVOY)*TS;L.push([s.y+CVOY+.95,()=>cvTeDraw(s,ox,oy,now)])}}}
/* ほりつづける手：大穴からのびる、黒い大きな手（仮の絵） */
function cvTeDraw(s,ox,oy,now){if(cvBkChip(ctx,'bkte#'+(s.st===1?'a0':s.st===2?'a1':'w'+(((now/400)|0)%4)),ox+16,oy+30,1,s.stun>0?.7:1))return;const up=s.st===1?Math.min(1,s.t/CVSC.te.wind):s.st===2?1-Math.min(1,s.t/1):0,t=now/1000,h=Math.round(30+up*40),wob=Math.round(Math.sin(t*1.3)*2),C=s.stun>0?'#3a3040':'#120e14';
  P4(C,ox+6+wob,oy+20-h,20,h+12);P4('#2a222c',ox+8+wob,oy+20-h,4,h+10);for(let i=0;i<4;i++){P4(C,ox+4+i*6+wob,oy+10-h-8-up*6,5,14+up*6);P4('#2a222c',ox+4+i*6+wob,oy+10-h-8-up*6,1,10)}
  P4(C,ox-2+wob,oy+14-h,6,10);if(Math.sin(t*5)>.5)P4('#85776a',ox+(Math.random()*30),oy+24,2,2)}
/* 暗さの上：見はりの目 */
function cvBakeGlow(now){const C=CV;if(!C.sc)return;for(const s of C.sc){if(!s.on||s.k!=='me')continue;const ox=cvX(s.j)*TS+10,oy=(cvY(s.j)+CVOY)*TS+10,bl=((now/1000+s.j)%4)<.15,g=Math.min(1,s.t/CVSC.me.gaze);if(bl)continue;
  ctx.globalAlpha=.7+.3*g;P4('#fff6d0',ox,oy,3,2);P4('#fff6d0',ox+9,oy,3,2);P4(g>.6?'#ff6b6b':'#ffd860',ox+1,oy,1,2);P4(g>.6?'#ff6b6b':'#ffd860',ox+10,oy,1,2);ctx.globalAlpha=1}}
