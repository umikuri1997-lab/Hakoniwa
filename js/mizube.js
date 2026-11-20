'use strict';
/* 水のステージ「霧のみずべの村」（WD===MIZU）の試作。お話・新しい絵・夜のコワイノは、まだない。
   水路：北の高い所の池（ため池）に、こわれた水門が3つ。「しらべる」でタップすると、せいれいが直してひらく。
         「水路をほる」（1マス パワー5）でほった水路を、水は、ひらいた水門から、同じ高さか低いほうへだけ流れる。
         ひらいた水門1つで、水路 MZFLOW マスまで（水門に近いマスから）。水のとどいた水路は浅瀬（ground 2）と同じあつかい。
   霧  ：はじめは、村のまん中のまわりだけ晴れている。水のとどいた水路のまわり MZCLR マス・ひらいた水門のまわり MZGCLR マスが晴れる（晴れた所は、もどらない）。
   舟便：船着き場（dock）が、同じ高さの水でつながると、小舟が行き来する。荷はこび（1回 MZBOATN こ）・せいれいがのってわたる（歩く MZBOATK 倍）・ほかの土地とのやりとり。
   川くだり：いかだ乗り場（raft）から下流へつづく水路を、せいれいがいかだで下って遊ぶ。
   しずんだ町：ため池に、しずんだ宝箱が3つ。水門を1つひらくごとに水が引いて、宝箱のまわりが浅瀬になる。
   セーブは S.mz。水のとどき方・舟の道は、S.mz からそのつど作る（mzRefresh。recount のはじめによぶ） */
const MZIDS=new Set(['mzgateb','mzgate','mzchest','dock','raft']);
const MZFLOW=40/* 水門1つで水のとどく水路のマス */,MZCLR=4/* 水路のまわりの晴れるマス */,MZGCLR=6/* 水門のまわりの晴れるマス */,MZBASE=13/* はじめから晴れている、まん中からのマス */;
const MZBOATN=20/* 舟が1回にはこぶ数 */,MZBOATK=3/* 舟は歩く何倍の速さか */,MZBOATWAIT=4/* 船着き場でとまる時間 */,MZNEAR=3/* 船着き場のそばの箱（まわりのマス） */;
const MZTRADEN=10/* ほかの土地へおくる素材の数 */,MZTRADE=[{w:0,name:'はじまりの草原',food:'apple',n:3},{w:1,name:'火山のふもとの村',mat:'bamboo',n:5}];/* お返し（実数） */
const MZRAFT={fun:20,per:10,add:5,drop:5,max:30};/* 川くだり：たのしさ20。コース10マスごとに+5・段差を1だん下るごとに+5（ふえるのは+30まで） */
const MZGATET=6,MZOPENT=3;/* 水門を直す時間・宝箱をあける時間 */

BL.canal={name:'水路をほる',kind:'build',pc:5,time:20,maker:'earth',attr:{},desc:'地面をほって水路にする工事。パワー5'};
BL.dock={hp:5,brk:1,fix:4,fixm:{wood:4},name:'船着き場',kind:'build',mat:{wood:10,stone:5},pc:0,time:60,maker:'water',lv:1,w:MIZU,solid:1,attr:{water:1},desc:'小舟がとまる所。水でつながった船着き場のあいだを、小舟が行き来する'};
BL.raft={hp:5,brk:1,fix:4,fixm:{wood:4},name:'いかだ乗り場',kind:'build',mat:{wood:15},pc:0,time:60,maker:'water',lv:1,w:MIZU,solid:1,play:{pt:5,pw:2,fun:20,dur:50,cap:1,adj:1},attr:{water:1},desc:'水路をいかだで下って遊ぶ。たのしさ+20'};
BL.mzgateb={name:'こわれた水門',solid:1,natural:1};BL.mzgate={name:'水門',solid:1,natural:1};BL.mzchest={name:'しずんだ宝箱',solid:1,natural:1,anim:1};
TERRA.add('canal');for(const id of['canal','dock','raft'])GNOREC.add(id);BUILDS.splice(BUILDS.indexOf('bridge')+1,0,'dock','raft');STAGEONLY.dock=MIZU;STAGEONLY.raft=MIZU;
FAVTOY.water.push('raft');FAVTOY.wind.push('raft');/* 川くだりは、水のせいれいの好きな遊び場。風のせいれいは、どの遊び場も好き */
if(typeof ACT_LBL!=='undefined')Object.assign(ACT_LBL,{mzgate:'水門を直している',mzopen:'宝箱をあけている',mzraft:'川くだりをしている'});

function mzOn(){return !!S&&WD===MIZU&&!!S.mz}
const mzWater=j=>S.ground[j]===1&&S.obj[j]!=='bridge'||S.ground[j]===2;
const mzAdj=j=>{const x=j%W,L=[];if(j>=W)L.push(j-W);if(x>0)L.push(j-1);if(x<W-1)L.push(j+1);if(j<W*H-W)L.push(j+W);return L};
const mzOpenN=()=>S.mz.gates.reduce((n,g)=>n+(g.open?1:0),0);

/* ---- はじめの地形 ---- */
function mzGenWorld(s){const R=mulberry(20261120),N=W*H,h=new Array(N).fill(0),PX0=CX-12,PX1=CX+12,PY0=CY-40,PY1=CY-30;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const w1=Math.round(1.6*Math.sin(x*.21)+Math.sin(x*.07+2)),w2=Math.round(1.2*Math.sin(x*.17+1));h[y*W+x]=y<CY-25+w2?2:y<CY-15+w1?1:0}/* 北ほど高い、2だんの台地 */
  const hill=(cx,cy,r)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<2||y<2||x>=W-2||y>=H-2)continue;const d=Math.hypot(x-cx,(y-cy)*1.2);if(d<r)h[y*W+x]=Math.max(h[y*W+x],d<r-4?2:1)}};
  hill(CX-36,CY+10,8);hill(CX+36,CY+30,8);hill(CX+32,CY-2,7);hill(CX-24,CY+38,7);/* 南にも丘（水は、のぼれない） */
  const pond=(cx,cy,rx,ry)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.hypot((x+.5-cx)/rx,(y+.5-cy)/ry)<1){s.ground[y*W+x]=1;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++)h[(y+b)*W+x+a]=0}};
  pond(CX-20,CY+15,4,2.6);pond(CX+18,CY+21,5,3);/* 低い所の、よどんだ池（まわりは平ら） */
  for(let y=PY0-2;y<=PY1+4;y++)for(let x=PX0-2;x<=PX1+2;x++)h[y*W+x]=2;
  for(let y=PY0;y<=PY1;y++)for(let x=PX0;x<=PX1;x++)s.ground[y*W+x]=1;/* ため池（高い所の、石でかこんだ池） */
  s.hi=h;
  for(let y=CY-8;y<H;y++){const j=y*W+CX;if(s.ground[j]!==1)s.floor[j]='path'}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x;if(s.ground[j]===1||s.floor[j])continue;const core=Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7,r=R();if(core||Math.abs(x-CX)<=1&&y<CY&&y>PY1)continue;/* 水門への道すじはあけておく */
    if(r<.06)s.obj[j]='deadtree';else if(r<.1)s.obj[j]='rock';else if(r<.107){s.obj[j]='berry';s.dyn[j]={g:100}}}
  for(let d=1;d<=4;d++){const j=(CY-4)*W+CX+d;s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}
  const gates=[CX-8,CX,CX+8].map(x=>{const j=(PY1+1)*W+x;s.obj[j]='mzgateb';delete s.dyn[j];return {j,open:0}});
  const chests=[[CX-8,PY1-1],[CX+1,PY1-4],[CX+8,PY1-7]].map(([x,y])=>{const j=y*W+x;s.obj[j]='mzchest';return {j,got:0}});
  const clr=new Array(N).fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.max(Math.abs(x-CX),Math.abs(y-CY))<=MZBASE||Math.abs(x-CX)<=3&&y<CY&&y>=PY1-1)clr[y*W+x]=1;/* まん中のまわりと、まん中の水門への道 */
  s.mz={gates,chests,pond:[PX0,PY0,PX1,PY1],cn:{},clr,req:[],send:{},trade:[],td:{},boats:{},v:0}}
function mzSetup(s){/* 試作：お話がないので、くらしの道具は、はじめからある */
  s.keyN={water:MIO};s.flags.minaCame=true;s.flags.sumTold=true;s.flags.tapped=true;
  Object.assign(s.feat,{inv:true,craft:true,remove:true,plant:true,people:true,shop:true,summon:true});
  s.fs={berry:12};s.food=12;s.mat={wood:30,stone:30};s.pt=150;s.unlocked.dock=true;s.unlocked.raft=true;
  {const fr=k=>!s.obj[k]&&s.ground[k]!==1&&!s.floor[k];let p=-1;for(let r=0;r<8&&p<0;r++)for(let dy=-r;dy<=r&&p<0;dy++)for(let dx=-r;dx<=r;dx++){const k=(CY+1+dy)*W+CX+3+dx;if([0,1,2,3].every(c=>fr(k+c))){p=k;break}}if(p>=0){s.obj[p]='crate';wbenchAt(s,p+1,0);s.obj[p+3]='crate'}}
  for(const k of['tree','bellf','salvia','lily','lotus','clover'])if(BL[k])s.unlocked[k]=true;
  s.inv=Object.assign(s.inv||{},{bellf:3,salvia:3,lily:3,lotus:3,clover:9,bed:1});
  syncQuestRecipes(s)}

/* ---- 水の流れ・霧・舟の道（S.mz から作る） ---- */
const MZC={S:null,wet:null,fd:null,mist:null,comps:[],wetN:0,mv:0,used:[]};
function mzRefresh(){if(!mzOn()){MZLANE=null;MZC.S=null;return}const M=S.mz,N=W*H,first=MZC.S!==S;MZC.S=S;
  const wet=new Uint8Array(N),fd=new Int16Array(N).fill(-1),used=[];
  for(const g of M.gates){let left=MZFLOW;if(g.open){const seen=new Uint8Array(N),q=[g.j];seen[g.j]=1;
    for(let i=0;i<q.length;i++){const c=q[i],dc=c===g.j?0:fd[c];for(const n of mzAdj(c)){if(seen[n]||!M.cn[n]||hiAt(n)>hiAt(c))continue;seen[n]=1;if(!wet[n]){if(left<=0)continue;wet[n]=1;left--;fd[n]=dc+1}q.push(n)}}}
    used.push(MZFLOW-left)}
  let wn=0,ch=0;for(const k in M.cn){const j=+k,g=wet[j]?2:0;if(wet[j])wn++;if(S.ground[j]!==g){S.ground[j]=g;ch++}}
  MZC.wet=wet;MZC.fd=fd;MZC.wetN=wn;MZC.used=used;
  let nw=0;const mark=(j,r)=>{const x=j%W,y=(j/W)|0;for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!M.clr[k]){M.clr[k]=1;nw++}}};
  for(const k in M.cn)if(wet[+k])mark(+k,MZCLR);for(const g of M.gates)if(g.open)mark(g.j,MZGCLR);
  if(!MZC.mist||first||nw){const m=new Uint8Array(N);for(let j=0;j<N;j++)m[j]=M.clr[j]?0:1;MZC.mist=m;MZC.mv++}
  if(nw&&!first&&typeof stageReady==='function'&&stageReady()&&started){toast('霧が晴れた','good');sfx('arrive')}
  /* 舟の道：同じ高さの水でつながった船着き場を、じゅんにめぐる */
  const comp=new Int32Array(N).fill(-1),docks=[];let cn=0;
  for(let j=0;j<N;j++)if(S.obj[j]==='dock'){const w=mzAdj(j).find(n=>mzWater(n)&&hiAt(n)===hiAt(j)&&!solidOf(n));if(w!=null)docks.push({j,w})}
  for(const d of docks){if(comp[d.w]>=0)continue;const q=[d.w];comp[d.w]=cn;for(let i=0;i<q.length;i++)for(const n of mzAdj(q[i]))if(comp[n]<0&&mzWater(n)&&hiAt(n)===hiAt(q[i])&&!solidOf(n)){comp[n]=cn;q.push(n)}cn++}
  const lane=new Uint8Array(N),comps=[];let any=false;
  for(let c=0;c<cn;c++){const D=docks.filter(d=>comp[d.w]===c).sort((a,b)=>a.j-b.j);if(D.length<2)continue;const route=[],stops={};
    for(let i=0;i<D.length;i++){const a=D[i].w,b=D[(i+1)%D.length].w,prev=new Int32Array(N).fill(-1),q=[a];prev[a]=a;for(let k=0;k<q.length&&prev[b]<0;k++)for(const n of mzAdj(q[k]))if(prev[n]<0&&comp[n]===c){prev[n]=q[k];q.push(n)}
      const P=[];for(let k=b;k!==a;k=prev[k])P.push(k);P.push(a);P.reverse();stops[route.length]=D[i].j;for(let k=0;k<P.length-1;k++)route.push(P[k]);if(P.length===1)route.push(a)}
    for(const k of route){lane[k]=1;any=true}comps.push({key:D.map(d=>d.j).join('_'),docks:D.map(d=>d.j),route,stops})}
  MZC.comps=comps;MZLANE=any?lane:null;
  for(const k in M.boats)if(!comps.some(c=>c.key===k)){const B=M.boats[k];if(B.cg)availAdd(B.cg.k,B.cg.n);delete M.boats[k]}/* 道がなくなった舟の荷は、もちものへ */
  for(const k in M.send)if(S.obj[+k]!=='dock'||S.obj[M.send[k].to]!=='dock')delete M.send[k];
  M.req=M.req.filter(j=>S.obj[j]==='mzgateb'||S.obj[j]==='mzchest');
  if(ch)dirty=true}
function mzMistAt(j){if(MZC.S!==S||!MZC.mist)mzRefresh();return !!MZC.mist&&MZC.mist[j]===1}

/* ---- 置く・こわす ---- */
function mzPlaceCheck(id,j,quiet){/* canPlace1 から：true・false をかえしたら、それで決まり。null は、ふつうのきまりへ */
  const no=t=>{if(!quiet)toast(t);return false};
  if(id==='canal'){if(!mzOn())return no('ここでは、ほれません');if(S.mz.cn[j])return no('ここは、もう水路です');if(S.ground[j])return no('水の上は、ほれません');if(S.obj[j]&&!WEEDS.has(S.obj[j])||S.floor[j])return no('なにもない所だけです');return true}
  if(!mzOn())return null;
  if(S.mz.cn[j])return no('水路の上には置けません');
  if(id==='dock'&&!mzAdj(j).some(n=>mzWater(n)&&hiAt(n)===hiAt(j)))return no('船着き場は、水のとなりにだけ建てられます');
  if(id==='raft'&&!mzAdj(j).some(n=>MZC.wet&&MZC.wet[n]))return no('いかだ乗り場は、水の流れる水路のとなりにだけ建てられます');
  return null}
function mzCanalDone(j,r){delete S.dyn[j];S.obj[j]='';S.mz.cn[j]=1;S.mz.v++;recount();dirty=true;burst(j,'block');if(r)addSpiritXp(2,r);checkQuest()}
function mzRemove(j){/* removeAt から：水路をうめる・こわせない物 */if(!mzOn())return false;const o=S.obj[j];if(o==='mzgateb'||o==='mzgate'||o==='mzchest'){toast(BL[o].name+'はこわせません');return true}
  if(!o&&S.mz.cn[j]){delete S.mz.cn[j];S.ground[j]=0;S.mz.v++;toast('水路をうめた');burst(j,'block','rm');recount();dirty=true;return true}return false}

/* ---- しらべる ---- */
function mzTap(tx,ty){if(!mzOn())return false;let j=ty*W+tx;if(mzMistAt(j)){toast('霧で見えません');return true}j=anc(j);const o=S.obj[j],M=S.mz;
  if(o==='mzgateb'){if(!M.req.includes(j))M.req.push(j);toast('せいれいが水門を直しにきてくれる');return true}
  if(o==='mzgate'){const i=M.gates.findIndex(g=>g.j===j);toast('水門：水のとどいた水路（'+(MZC.used[i]||0)+'/'+MZFLOW+'）');return true}
  if(o==='mzchest'){if(S.ground[j]===1){toast('水の底に、なにかがしずんでいる');return true}if(!M.req.includes(j))M.req.push(j);toast('せいれいが宝箱をあけにいく');return true}
  if(o==='dock'){mzDockPop(j);return true}
  if(o==='raft'){const c=mzCourse(j);toast(c.length?'いかだ乗り場：コース'+c.length+'マス・たのしさ+'+mzRaftFun(j):'いかだ乗り場：水の流れる水路がありません');return true}
  if(!o&&M.cn[j]){toast(MZC.wet&&MZC.wet[j]?'水路：水がとどいている':'水路：水がとどいていない');return true}
  return false}
function mzGateOpen(j,r){const M=S.mz,g=M.gates.find(q=>q.j===j);if(!g||g.open)return;g.open=1;S.obj[j]='mzgate';const n=mzOpenN(),[x0,y0,x1,y1]=M.pond;
  for(let y=Math.max(y0,y1-3*n+1);y<=y1;y++)for(let x=x0;x<=x1;x++)S.ground[y*W+x]=2;/* 水が引いて、池の南がわから浅瀬になる */
  M.v++;recount();dirty=true;burst(j,'furn');sfx('level');toast('水門がひらいた','good');if(typeof juiceGlowAt==='function')juiceGlowAt(j%W+.5,((j/W)|0)+.6,2);if(typeof juiceCheer==='function')juiceCheer();if(r)addSpiritXp(5,r);checkQuest()}
function mzChestOpen(j,r){const M=S.mz,c=M.chests.find(q=>q.j===j);if(!c||c.got)return;c.got=1;clearObj(j);S.mz.v++;burst(j,'furn','furnPlace');if(typeof juiceGlowAt==='function')juiceGlowAt(j%W+.5,((j/W)|0)+.6,2);
  let nm=null;if(typeof bpGiveNext==='function'&&M.chests.filter(q=>q.got).length===2){const k=bpGiveNext(r?r.id:null);if(k)nm='設計図'}
  if(!nm){S.fukuro=(S.fukuro||0)+1;(S.seenIt||(S.seenIt={}))['x:fukuro']=1;nm='ふしぎなふくろ';toast((r?r.name+'が':'')+'宝箱から「'+nm+'」をみつけた','good')}
  sfx('seed');if(r)JUMP.set(r,performance.now());recount();checkQuest()}
function mzJob(r,G){if(!mzOn()||isNight()||!S.mz.req.length)return false;for(const j of S.mz.req){const o=S.obj[j];if(o!=='mzgateb'&&!(o==='mzchest'&&S.ground[j]===2))continue;if(!free('o'+j,1))continue;
    const st=nearest(G,k=>walk(k)&&mzAdj(j).includes(k),9999);if(st<0)continue;startAct(r,G,o==='mzgateb'?'mzgate':'mzopen',st,{key:'o'+j,obj:j});return true}return false}
ACT.mzgate={start(r,a){if(S.obj[a.obj]!=='mzgateb')return false;r.bubble='';r.face=(a.obj%W+.5)<r.x?-1:1},tick(r,a,dt){a.h=(a.h||0)+dt;if(a.h>=2){a.h=0;sfxAt('twood',r.x,r.y)}},done:(r,a)=>a.t>=MZGATET,end(r,a){if(a.t>=MZGATET)mzGateOpen(a.obj,r)}};
ACT.mzopen={start(r,a){if(S.obj[a.obj]!=='mzchest')return false;r.bubble='';r.face=(a.obj%W+.5)<r.x?-1:1},done:(r,a)=>a.t>=MZOPENT,end(r,a){if(a.t>=MZOPENT)mzChestOpen(a.obj,r)}};

/* ---- 川くだり ---- */
function mzCourse(j){/* いかだ乗り場 j から、下流へつづく水路のマス（となりの水路・枝わかれは、いちばん長く下れるほう） */if(!mzOn()||!MZC.wet)return[];
  const memo=new Map(),next=c=>mzAdj(c).filter(n=>MZC.wet[n]&&hiAt(n)<=hiAt(c)&&MZC.fd[n]>MZC.fd[c]),len=c=>{if(memo.has(c))return memo.get(c);let b=1;for(const n of next(c))b=Math.max(b,1+len(n));memo.set(c,b);return b};
  const c0=mzAdj(j).filter(n=>MZC.wet[n]).sort((a,b)=>len(b)-len(a))[0];if(c0==null)return[];
  const L=[c0];for(let c=c0;;){const nx=next(c).sort((a,b)=>len(b)-len(a))[0];if(nx==null)break;L.push(nx);c=nx}return L}
function mzRaftFun(j){const C=mzCourse(j);if(!C.length)return 0;let dr=0;for(let i=1;i<C.length;i++)if(hiAt(C[i])<hiAt(C[i-1]))dr++;return MZRAFT.fun+Math.min(MZRAFT.max,Math.floor(C.length/MZRAFT.per)*MZRAFT.add+dr*MZRAFT.drop)}
function mzRaftPick(best){/* goPlay から：いかだ乗り場の遊びは、川くだりの行動にする（コースがなければ、えらばない） */if(!best||best.type!=='play'||best.o.what!=='raft')return best;const f=mzRaftFun(best.o.obj);if(!f)return null;best.type='mzraft';best.o.fun=f;return best}
ACT.mzraft={start(r,a){const C=mzCourse(a.obj);if(C.length<2)return false;a.cs=C;r.bubble='🎵'},
  tick(r,a,dt){funAdd(r,a.fun/a.dur*dt,'play');const C=a.cs,p=Math.min(1,a.t/a.dur)*(C.length-1),i=Math.floor(p),f=p-i,A=C[i],B=C[Math.min(C.length-1,i+1)];
    r.x=(A%W+.5)*(1-f)+(B%W+.5)*f;r.y=(((A/W)|0)+.5)*(1-f)+(((B/W)|0)+.5)*f;if(B%W!==A%W)r.face=B%W<A%W?-1:1;if(hiAt(B)<hiAt(A)&&f>.4&&!a['s'+i]){a['s'+i]=1;sfxAt('twater',r.x,r.y)}},
  done:(r,a)=>a.t>=a.dur,end(r,a){addPt(a.pw,r,a.pt);r.lastToy={j:a.obj,t:S.t}}};

/* ---- 舟便 ---- */
function mzNearBoxes(d){const x=d%W,y=(d/W)|0;return (typeof BOXL!=='undefined'?BOXL:[]).filter(j=>Math.max(Math.abs(j%W-x),Math.abs(((j/W)|0)-y))<=MZNEAR)}
function mzBoatStop(C,B,d){const M=S.mz;
  if(B.cg&&B.cg.to===d){let n=B.cg.n;for(const j of mzNearBoxes(d)){if(n<=0)break;n-=boxIn(j,B.cg.k,n)}if(n>0)availAdd(B.cg.k,n);sfxAt('twood',d%W+.5,((d/W)|0)+.5);B.cg=null}
  const o=M.send[d];if(o&&!B.cg&&C.docks.includes(o.to)){let t=0;for(const j of mzNearBoxes(d)){if(t>=MZBOATN)break;t+=boxOut(j,o.k,MZBOATN-t)}if(t>0)B.cg={k:o.k,n:t,to:o.to}}}
function mzTick(dt){if(!mzOn()||MZC.S!==S)return;const M=S.mz;for(const C of MZC.comps){const B=M.boats[C.key]||(M.boats[C.key]={d:0,w:0,cg:null}),n=C.route.length;if(!n)continue;if(B.w>0){B.w-=dt;continue}
    const p0=Math.floor(B.d);B.d+=.36*MZBOATK*dt;for(let i=p0+1;i<=Math.floor(B.d);i++){const d=C.stops[i%n];if(d!=null){B.d=i;B.w=MZBOATWAIT;mzBoatStop(C,B,d);break}}if(B.d>1e6)B.d%=n}}
function mzMorning(){if(!mzOn())return;const M=S.mz;for(const t of M.trade||[]){const T=MZTRADE.find(q=>q.w===t.w);if(!T)continue;if(T.food)addFood(T.food,T.n);else S.mat[T.mat]=(S.mat[T.mat]||0)+T.n;toast(T.name+'から、'+(T.food?FOODS[T.food].name:MATN[T.mat])+'が'+T.n+'こ とどいた','good')}M.trade=[]}
const mzKeyName=k=>k.startsWith('f:')?FOODS[k.slice(2)].name:MATN[k]||k;
function mzDockPop(j){const M=S.mz,C=MZC.comps.find(c=>c.docks.includes(j)),P=pxPop('船着き場'),B=P.body;let sel=(M.send[j]||{}).k||null;
  const day=typeof callDay==='function'?callDay():dayNo();
  const draw=()=>{B.innerHTML='';const head=t=>{const h=el('<b style="display:block;font-size:15px;margin:10px 0 5px"></b>');h.textContent=t;B.appendChild(h)},note=t=>{const p=el('<p class="note" style="margin:0 0 5px;font-size:15px"></p>');p.textContent=t;B.appendChild(p)},row=()=>B.appendChild(el('<div style="display:flex;flex-wrap:wrap;gap:5px"></div>'));
    const keys=[...Object.keys(S.mat).filter(k=>(S.mat[k]||0)>0),...Object.keys(S.fs||{}).filter(k=>(S.fs[k]||0)>0).map(k=>'f:'+k)];
    head('おくる物');if(!keys.length)note('おくれる物がありません');const r0=row();for(const k of keys){const b=el('<button class="btn'+(sel===k?' pri':'')+'" type="button"></button>');b.textContent=mzKeyName(k)+'（'+(k.startsWith('f:')?S.fs[k.slice(2)]:S.mat[k])+'）';b.onclick=()=>{sfx('tap');sel=k;draw()};r0.appendChild(b)}
    head('村の中へはこぶ');const o=M.send[j];
    if(!C)note('ほかの船着き場と、水でつながっていません');else{if(o)note('いま：'+mzKeyName(o.k)+'を、船着き場'+(C.docks.indexOf(o.to)+1)+'へ');const r1=row();
      C.docks.forEach((d,i)=>{if(d===j)return;const b=el('<button class="btn" type="button"></button>');b.textContent='船着き場'+(i+1)+'へはこぶ';b.onclick=()=>{if(!sel)return toast('おくる物をえらんでください');sfx('tap');M.send[j]={k:sel,to:d};toast('小舟が、'+mzKeyName(sel)+'をはこぶ');draw()};r1.appendChild(b)});
      if(o){const b=el('<button class="btn" type="button">はこぶのをやめる</button>');b.onclick=()=>{sfx('tap');delete M.send[j];draw()};r1.appendChild(b)}}
    head('ほかの土地へおくる');note('素材を'+MZTRADEN+'こおくると、つぎの朝に、お返しがとどく');const r2=row();
    for(const T of MZTRADE){const b=el('<button class="btn" type="button"></button>');b.textContent=T.name+'へおくる';b.onclick=()=>{if(!sel||sel.startsWith('f:'))return toast('おくる素材をえらんでください');if((S.mat[sel]||0)<MZTRADEN)return toast(MATN[sel]+'が足りません');if((M.td||(M.td={}))[T.w]===day)return toast('きょうは、もうおくりました');
        S.mat[sel]-=MZTRADEN;M.td[T.w]=day;M.trade.push({w:T.w});sfx('twater');toast('小舟が、'+T.name+'へ出た','good');draw()};r2.appendChild(b)}};
  draw()}

/* ---- 絵（コードで描く仮のドット絵。1ドットは2） ---- */
const mzPx=(c,col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
function mzDrawObj(c,id,x,y,i,now){now=now||performance.now();const P=(col,a,b,w,h)=>mzPx(c,col,x+a,y+b,w,h);
  if(id==='mzgateb'||id==='mzgate'){P('#a39d8c',2,6,6,26);P('#a39d8c',24,6,6,26);P('#c9c4b4',2,4,6,24);P('#c9c4b4',24,4,6,24);P('#d9d4c4',0,0,32,6);P('#b9b4a6',0,6,32,2);
    if(id==='mzgate'){P('#b07c4a',8,8,16,4);P('#8a5a33',8,12,16,2);P('#6fbfe0',8,14,16,18);const t=((now/160)|0)%6;for(let k=0;k<3;k++)P('#d7f1f8',10+k*5,14+((t+k*2)%6)*3,2,4)}
    else{P('#9a6b3f',8,10,16,22);P('#7a5230',8,16,16,2);P('#7a5230',8,24,16,2);P('#5a4a3a',14,10,2,8);P('#5a4a3a',18,22,2,10);P('#7fae5a',2,4,4,2);P('#7fae5a',26,10,4,2);P('#7fae5a',10,0,6,2)}return}
  if(id==='mzchest'){if(i!=null&&S&&S.ground[i]===1){c.save();c.globalAlpha=.45;P('#234f78',8,14,16,12);P('#3a6c98',8,14,16,4);c.restore();return}
    P('#6b4526',6,26,20,2);P('#9a6b3f',6,16,20,10);P('#b5834d',6,12,20,4);P('#c99a62',6,12,20,2);P('#e8c45a',14,12,4,14);P('#fff0b0',14,18,4,2);P('#7fae5a',6,22,4,2);return}
  if(id==='dock'){P('#8a6238',4,22,4,10);P('#8a6238',24,22,4,10);P('#a67c4c',2,24,28,2);P('#c49a66',2,12,28,12);for(let k=0;k<4;k++)P('#a67c4c',2+k*8,12,2,12);P('#d9b684',2,12,28,2);P('#8a6238',14,4,4,10);P('#a67c4c',12,4,8,2);P('#e9dcc0',12,8,8,2);return}
  if(id==='raft'){P('#8a6238',14,4,2,24);P('#e8734a',16,4,10,8);P('#f29a72',16,4,10,2);P('#b08552',4,26,24,4);P('#c49a66',4,22,24,4);P('#d9b684',4,22,24,2);P('#8a6238',8,22,2,8);P('#8a6238',22,22,2,8);return}}
function mzBoatDraw(px,py,cargo){mzPx(ctx,'#6b4526',px-12,py+2,24,2);mzPx(ctx,'#a8743f',px-12,py-4,24,6);mzPx(ctx,'#c99a62',px-12,py-4,24,2);mzPx(ctx,'#a8743f',px+12,py-2,2,4);mzPx(ctx,'#a8743f',px-14,py-2,2,4);if(cargo){mzPx(ctx,'#b08a4a',px-4,py-10,8,6);mzPx(ctx,'#d8b26a',px-4,py-10,8,2)}}
function mzRaftDraw(px,py){mzPx(ctx,'#b08552',px-10,py+2,20,4);mzPx(ctx,'#c49a66',px-10,py-2,20,4);mzPx(ctx,'#d9b684',px-10,py-2,20,2)}
function mzRowDraw(y,x0,x1,now){const M=S.mz,t=(now/260)|0;
  for(let x=Math.max(0,x0);x<Math.min(W,x1+1);x++){const j=y*W+x,hh=hiAt(j),X=x*TS,Y=y*TS-hh*LIFT,g=S.ground[j];
    if(M.cn[j]){const wet=MZC.wet&&MZC.wet[j],con=n=>n>=0&&n<W*H&&(!!M.cn[n]||S.obj[n]==='mzgate'||S.obj[n]==='mzgateb');
      mzPx(ctx,'#c9c4b4',X,Y,TS,TS);mzPx(ctx,wet?'#6fbfe0':'#8f8676',X+4,Y+4,TS-8,TS-8);
      if(con(j-W))mzPx(ctx,wet?'#6fbfe0':'#8f8676',X+4,Y,TS-8,4);if(con(j+W))mzPx(ctx,wet?'#6fbfe0':'#8f8676',X+4,Y+TS-4,TS-8,4);if(x>0&&con(j-1))mzPx(ctx,wet?'#6fbfe0':'#8f8676',X,Y+4,4,TS-8);if(x<W-1&&con(j+1))mzPx(ctx,wet?'#6fbfe0':'#8f8676',X+TS-4,Y+4,4,TS-8);
      mzPx(ctx,'#a39d8c',X,Y+TS-2,4,2);mzPx(ctx,'#a39d8c',X+TS-4,Y+TS-2,4,2);
      if(wet){const k=(t+x*3+y*5)%6;mzPx(ctx,'#bfe9f5',X+8+k*2,Y+8,6,2);mzPx(ctx,'#bfe9f5',X+18-k*2,Y+20,4,2);
        const s=j+W;if(s<W*H&&M.cn[s]&&hiAt(s)<hh&&MZC.wet[s]){const dh=(hh-hiAt(s))*LIFT;mzPx(ctx,'#9ad8ee',X+4,Y+TS,TS-8,dh);for(let k2=0;k2<3;k2++)mzPx(ctx,'#e6f7fb',X+8+k2*7,Y+TS+((t*4+k2*9)%Math.max(1,dh-4)),2,4)}}
      else{mzPx(ctx,'#7d766a',X+8,Y+10,4,2);mzPx(ctx,'#7d766a',X+20,Y+20,4,2)}}
    else if(hh>0&&(g===1||g===2)){const dry=n=>n<0||n>=W*H||!S.ground[n];mzPx(ctx,g===1?'#4f9fd0':'#8fd0e6',X,Y,TS,TS);const k=(t+x*5+y*3)%8;mzPx(ctx,g===1?'#7fbfe6':'#c8ecf5',X+4+k*2,Y+10,6,2);if(g===2){mzPx(ctx,'#d9cfa8',X+8,Y+22,4,2);mzPx(ctx,'#d9cfa8',X+22,Y+6,2,2)}
      if(dry(j-W))mzPx(ctx,'#c9c4b4',X,Y,TS,4);if(dry(j+W)){mzPx(ctx,'#c9c4b4',X,Y+TS-4,TS,4);mzPx(ctx,'#a39d8c',X,Y+TS-2,TS,2)}if(x===0||dry(j-1))mzPx(ctx,'#c9c4b4',X,Y,4,TS);if(x===W-1||dry(j+1))mzPx(ctx,'#c9c4b4',X+TS-4,Y,4,TS)}}}
function mzRows(add,x0,y0,x1,y1,now){if(!mzOn())return;if(MZC.S!==S)mzRefresh();
  for(let y=Math.max(0,y0-2);y<Math.min(H,y1+4);y++)add(y-1+.0007,-1,null,()=>mzRowDraw(y,x0-1,x1+1,now),-1);
  for(const C of MZC.comps){const B=S.mz.boats[C.key],n=C.route.length;if(!B||!n)continue;const i=Math.floor(B.d)%n,f=B.d-Math.floor(B.d),a=C.route[i],b=C.route[(i+1)%n],bx=(a%W+.5)*(1-f)+(b%W+.5)*f,by=(((a/W)|0)+.5)*(1-f)+(((b/W)|0)+.5)*f,L=hiAt(a)*LIFT;
    add(by+.02,-1,null,()=>mzBoatDraw(bx*TS,by*TS-L+Math.round(Math.sin(now/500)),B.cg),-1)}
  for(const r of S.res){if(r.hidden)continue;const j=(r.y|0)*W+(r.x|0);if(r.act&&r.act.type==='mzraft'&&r.act.stage!=='walk')add(r.y-.01,-1,null,()=>mzRaftDraw(r.x*TS,r.y*TS-zAt(r.x,r.y)+4),-1);
    else if(MZLANE&&MZLANE[j]&&r.path&&r.path.length)add(r.y-.01,-1,null,()=>mzBoatDraw(r.x*TS,r.y*TS-zAt(r.x,r.y)+4,0),-1)}}
let MZF=null,MZFX=null,MZFV=-1,MZFS=null;
function mzMistDraw(c,x0,y0,x1,y1){if(!mzOn())return;if(MZC.S!==S)mzRefresh();const n=W*4;
  if(MZFS!==S||MZFV!==MZC.mv){MZFS=S;MZFV=MZC.mv;if(!MZF){MZF=document.createElement('canvas');MZF.width=MZF.height=n;MZFX=MZF.getContext('2d')}const img=MZFX.createImageData(n,n),D=img.data,M=MZC.mist,N=fogNoise(),m=(x,y)=>x<0||y<0||x>=W||y>=H?1:M[y*W+x];
    for(let py=0;py<n;py++)for(let px=0;px<n;px++){const fx=(px+.5)/4-.5,fy=(py+.5)/4-.5,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,a=(m(ix,iy)*(1-tx)+m(ix+1,iy)*tx)*(1-ty)+(m(ix,iy+1)*(1-tx)+m(ix+1,iy+1)*tx)*ty,nz=N[py*n+px];
      let o=a<=0?0:Math.min(1,a*1.3)*(.86+nz*.14);o=Math.round(o*10)/10;const q=(py*n+px)*4,s=nz>.55?1:0;D[q]=s?244:226;D[q+1]=s?246:232;D[q+2]=s?248:238;D[q+3]=o*250}
    MZFX.putImageData(img,0,0)}
  const X0=Math.max(0,x0-1),Y0=Math.max(0,y0-1),X1=Math.min(W,x1+1),Y1=Math.min(H,y1+2);if(X1<=X0||Y1<=Y0)return;
  c.imageSmoothingEnabled=false;c.drawImage(MZF,X0*4,Y0*4,(X1-X0)*4,(Y1-Y0)*4,X0*TS,Y0*TS,(X1-X0)*TS,(Y1-Y0)*TS);c.imageSmoothingEnabled=true}
function mzToolIcon(g){/* 「水路をほる」のアイコン（72×72のキャンバスに、6のドット） */const P=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};P('#8cc35c',6,12,60,12);P('#c9c4b4',6,24,60,36);P('#6fbfe0',18,24,36,30);P('#bfe9f5',24,30,12,6);P('#bfe9f5',36,42,12,6);P('#a39d8c',6,54,12,6);P('#a39d8c',54,54,12,6)}

/* ---- はじまりの会話と目標（お話は、まだない） ---- */
PROS[MIZU]=[[GOD,'さて、こんどは水の土地じゃ。'],[GOD,'#worry|霧がはれず、水の流れも止まっておる。ひとりで歌っとる子が、まっておるぞい。'],[GOD,'では、行こうかの。']];
INTROS[MIZU]=[[GOD,'ほい到着〜。ここが霧のみずべの村じゃ。'],[MIO,'#shy|……あ。守り神さま……？ わたし、ミオ。'],[MIO,'水が止まってから、村は、ずっと霧の中なの。'],[GOD,'まずは、あそこの古い神殿を直すとしようかの。']];
QL[MIZU]=[
  {id:'statue',text:'神殿を直してもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'「しらべる」で、こわれた神殿をタップ',story:[[GOD,'#joy|ここが、おヌシとわしの居場所じゃ。'],[MIO,'……神殿。きれいに、なった。']]},
  {id:'mzgate1',text:'水門をひらこう',check:()=>mzOn()&&mzOpenN()>=1,prog:()=>'ひらいた水門 '+Math.min(1,mzOn()?mzOpenN():0)+'/1',how:'「しらべる」で、北の高い所にある、こわれた水門をタップ',story:[[MIO,'#joy|……水の音。ひさしぶりに、きこえた。']]},
  {id:'mzflow',text:'水路で水をながそう',check:()=>mzOn()&&MZC.wetN>=10,prog:()=>'水のとどいた水路 '+Math.min(10,MZC.wetN)+'/10',how:'「おく」→「水路をほる」で、ひらいた水門から低いほうへ、水路をつなぐ',story:[[MIO,'水がとおると、霧が、うすくなるの。'],[MIO,'#nod|もっと、とおくまで、ながしたいな。']]},
  {id:'mzdock',text:'船着き場を2つ、水でつなごう',check:()=>mzOn()&&MZC.comps.length>=1,prog:()=>'つながった船着き場 '+(mzOn()&&MZC.comps.length?2:Math.min(1,cnt('dock')))+'/2',how:'「おく」→「建てる」で、船着き場を水のとなりに2つ建てる。同じ高さの水でつながると、小舟が行き来する',story:[[MIO,'#joy|小舟が、うごいた。……むかしは、村じゅうを、舟がめぐっていたの。']]},
  {id:'mzraft',text:'いかだ乗り場をつくろう',check:()=>cnt('raft')>=1,prog:()=>'いかだ乗り場 '+Math.min(1,cnt('raft'))+'/1',how:'「おく」→「建てる」で、いかだ乗り場を、水の流れる水路のとなりに建てる',story:[[MIO,'いかだで、水といっしょに、くだるの。'],[MIO,'#shy|……わたしも、のってみたい。']]},
  {id:'mzchest',text:'しずんだ宝箱をあけよう',check:()=>mzOn()&&S.mz.chests.some(c=>c.got),prog:()=>'あけた宝箱 '+(mzOn()?Math.min(1,S.mz.chests.filter(c=>c.got).length):0)+'/1',how:'水門をひらくと、池の水が引く。浅くなった所の宝箱を、「しらべる」でタップ',story:[[MIO,'#think|池の底に、むかしの物が、のこっていたのね。']]},
  {id:'mzall',text:'水門を3つひらこう',check:()=>mzOn()&&mzOpenN()>=3,prog:()=>'ひらいた水門 '+(mzOn()?mzOpenN():0)+'/3',how:'水路をのばして霧を晴らすと、のこりの水門が見つかる',story:[[MIO,'#joy|みんな、ひらいた。水が、村へかえってくる。'],[MIO,'守り神さま、ありがとう。']]},
];
