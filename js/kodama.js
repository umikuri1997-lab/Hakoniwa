'use strict';
/* もりのこだま（小さな発見）：マップの16エリア（areaOf）に3こずつ、ぜんぶで48こ。草原は霧が晴れたエリアに、ほかのステージは、はじめから（kdInit・kdGenArea）。フリーモード・思い出帳の再生にはない。
   しゅるい（KDK）：ゆれる草むら（kdkusa。タップすると、せいれいがしらべにいく）・ふしぎな切り株（kdkabu。同じ）・
     欠けた石の輪（小石 kdishi が7つ。タップすると、せいれいが箱から石材を1こはこんで、すきまをうめる）・1本たりない花の輪（kdhana が7本。すきまに同じ花を植えて咲かせると、せいれいが見にいく）。
   S.kd：[{id,k,a,j,gap,fl,st,ws}]（st 0 まだ・1 せいれいが見にいく・2 見つけた。ws 1 石材をとりにいく・2 はこんでいる）。エリアに3こ置けなかったら、つぎの朝にまた置く。S.kodama：見つけた数。S.kdOwe：まだわたしていない設計図。
   見つけたら：もりのこだま1こ・パワー5（KDPT）・小さな物1こ（KDLOOT。せいれいが頭の上につんで箱へはこぶ）。10・20・30・40こで、まだない設計図（KDBP）。 */
const KDK={kusa:{n:'ゆれる草むら',o:'kdkusa'},kabu:{n:'ふしぎな切り株',o:'kdkabu'},ishi:{n:'欠けた石の輪',o:'kdishi'},hana:{n:'1本たりない花の輪',o:'kdhana'}};
const KDIDS=new Set(['kdkusa','kdkabu','kdishi','kdhana']),KDPER=3,KDMID=12,KDPT=5,KDBP=[10,20,30,40],KDFL=['clover','bellf','salvia','lily'];
const KDLOOT=[['mat:eda',2,30],['seed',2,25],['food:apple',2,25],['mapPc',1,12],['fukuro',1,8]];/* [物,数,えらばれやすさ] */
const KDRING=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],KDGAP=[[0,-1],[-1,0],[1,0],[0,1]];/* 輪のマス（まん中のまわり8マス）・すきまにする所（上下左右のまん中） */
const KDLINE=['こんな所に、かくれてた！','見つけた！ 小さな声がしたんだ。','わあ、ひかってる……！','ここにいたんだね。','ふふ、くすぐったいよ。','森の声みたい。きれいだね。'];
function kdOn(){return !!S&&!S.free&&!IS_STORY_REPLAY&&!(typeof MEMRUN!=='undefined'&&MEMRUN)}
const kdTotal=()=>(S.kd||[]).length;
function kdCells(e){return e.k==='ishi'||e.k==='hana'?KDRING.map(([dx,dy])=>e.j+dy*W+dx):[e.j]}
let KDMAP=null,KDMS=null,KDMN=-1;
function kdAt(j){/* マス j にある、もりのこだまの所 */if(!S||!S.kd)return null;if(KDMS!==S||KDMN!==S.kd.length){KDMS=S;KDMN=S.kd.length;KDMAP=new Map();for(const e of S.kd){for(const k of kdCells(e))KDMAP.set(k,e);KDMAP.set(e.j,e)}}/* 輪のまん中も */return KDMAP.get(j)||null}
function kdSpotOK(k,hi){if(k<0||k>=W*H)return false;const o=S.obj[k];return S.ground[k]===0&&(!o||WEEDS.has(o))&&!S.floor[k]&&!(S.rug&&S.rug[k])&&!(S.edge&&S.edge[k])&&!VILL[k]&&(S.hi?S.hi[k]||0:0)===hi&&!(typeof fogAt==='function'&&fogAt(k))&&!kdAt(k)}
function kdNeed(e,hi){/* 置くのに空いている所：草むら・切り株はそのマスと上下左右、輪は3×3と、すきまの外がわ1マス（せいれいが立てる所） */const C=e.k==='ishi'||e.k==='hana'?[...KDRING.map(([dx,dy])=>e.j+dy*W+dx),e.j,e.gap+(e.gap-e.j)]:[e.j,e.j+1,e.j-1,e.j+W,e.j-W];return C.every(k=>kdSpotOK(k,hi))}
function kdGenArea(a,G){/* エリア a に、3こになるまで置く（行けない所しかなければ、つぎの朝にまた） */if(!kdOn())return 0;S.kd=S.kd||[];if(Array.isArray(S.fog)&&WD===0&&S.fog[a])return 0;let have=S.kd.filter(e=>e.a===a).length;if(have>=KDPER)return 0;
  const x0=(a%AREAN)*AREAW,y0=((a/AREAN)|0)*AREAW,ks=Object.keys(KDK).filter(k=>!S.kd.some(e=>e.a===a&&e.k===k));for(let i=ks.length-1;i>0;i--){const q=(Math.random()*(i+1))|0;[ks[i],ks[q]]=[ks[q],ks[i]]}
  if(!G){const r0=S.res.find(q=>!q.hidden);G=r0?bfs(r0.x|0,r0.y|0):null}
  let put=0;for(const k of ks){if(have>=KDPER)break;for(let tr=0;tr<600;tr++){const x=x0+2+((Math.random()*(AREAW-4))|0),y=y0+2+((Math.random()*(AREAW-4))|0),j=y*W+x,hi=S.hi?S.hi[j]||0:0,e={id:0,k,a,j,st:0};
      if(k==='ishi'||k==='hana'){const[gx,gy]=KDGAP[(Math.random()*4)|0];e.gap=j+gy*W+gx;if(k==='hana')e.fl=KDFL[(Math.random()*KDFL.length)|0]}
      if(Math.abs(x-CX)<=KDMID&&Math.abs(y-CY)<=KDMID||!kdNeed(e,hi))continue;/* はじめに建てるまん中はあけておく */const st=e.gap!=null?e.gap+(e.gap-e.j):e.j+W;if(G&&G.dist[st]<0&&G.dist[e.j]<0)continue;/* せいれいが行ける所 */
      e.id=S.kdN=(S.kdN||0)+1;for(const c of kdCells(e)){if(WEEDS.has(S.obj[c]))S.obj[c]='';if(c!==e.gap)S.obj[c]=KDK[k].o}if(e.gap!=null&&WEEDS.has(S.obj[e.j]))S.obj[e.j]='';
      S.kd.push(e);KDMN=-1;put++;have++;break}}
  if(put)dirty=true;return put}
function kdInit(){/* ステージを開いたとき：見えているエリアのうち、まだ作っていない所に置く */if(!kdOn())return;const r0=S.res.find(q=>!q.hidden),G=r0?bfs(r0.x|0,r0.y|0):null;
  let n=0;for(let a=0;a<AREAN*AREAN;a++)n+=kdGenArea(a,G);if(n)recount()}
function kdTap(tx,ty){/* 「しらべる」のタップ */if(tx<0||ty<0||tx>=W||ty>=H)return false;const e=kdAt(ty*W+tx);if(!e)return false;const K=KDK[e.k];
  if(e.st===2){sfx('tgrass');toast(K.n+'：もりのこだまは、もう見つけた');return true}
  if(e.st===1){toast(K.n+'：せいれいが見にいく');return true}
  if(e.k==='kusa'||e.k==='kabu'){e.st=1;sfx(e.k==='kusa'?'tgrass':'twood');toast(K.n+'：せいれいがしらべにいく');dirty=true;return true}
  if(e.k==='ishi'){sfx('tstone');if(e.ws){toast(K.n+'：せいれいが石材をはこんでいる');return true}if(availOf('stone')<1){toast('石材が足りません','warn');return true}e.ws=1;boxSync();toast(K.n+'：せいれいが石材をはこぶ');dirty=true;return true}
  sfx('tgrass');toast(K.n);return true}
function kdRsv(add){/* とっておく石材（rsvNeed から） */for(const e of S.kd||[])if(e.ws===1&&e.st===0)add('stone',1)}
function kdById(id){return (S.kd||[]).find(e=>e.id===id)||null}
function kdNear(G,c){return nearest(G,k=>k!==c&&adjOf(k,q=>q===c)>=0&&walk(k),9999)}
function kdJob(r,G){/* せいれいの仕事（goWork から。昼だけ） */if(!kdOn()||isNight()||!S.kd||!S.kd.length)return false;
  if(r.kdst){const e=kdById(r.kdst);if(!e||e.st!==0||S.obj[e.gap]&&!WEEDS.has(S.obj[e.gap])){kdStoneBack(r);return false}const st=kdNear(G,e.gap);if(st<0)return false;startAct(r,G,'kdput',st,{key:'kd'+e.id,kid:e.id,obj:e.gap});return true}
  for(const e of S.kd){if(e.st!==0||e.ws!==1||!free('kds'+e.id,1))continue;if(totKey('stone')<=0){e.ws=0;continue}const st=nearest(G,j=>keysAdj(j,['stone'])>=0,300);if(st<0)continue;startAct(r,G,'kdsget',st,{key:'kds'+e.id,kid:e.id});return true}
  for(const e of S.kd){if(e.st!==1||!free('kd'+e.id,1))continue;const c=e.k==='hana'?e.gap:e.j,st=kdNear(G,c);if(st<0)continue;startAct(r,G,'kdlook',st,{key:'kd'+e.id,kid:e.id,obj:c});return true}
  return false}
function kdStoneBack(r){/* はこべなくなった石材は、箱へもどす */if(!r.kdst)return;const e=kdById(r.kdst);if(e&&e.ws===2)e.ws=0;r.kdst=null;S.mat.stone=(S.mat.stone||0)+1;boxSync()}
function kdHanaCheck(){/* 花の輪のすきまに、同じ花が咲いたら、せいれいが見にいく */for(const e of S.kd||[])if(e.k==='hana'&&e.st===0&&S.obj[e.gap]===e.fl&&!isBud(e.gap)){e.st=1;dirty=true}}
function kdLoot(r){const tot=KDLOOT.reduce((n,q)=>n+q[2],0);let p=Math.random()*tot,q=KDLOOT[0];for(const L of KDLOOT){if((p-=L[2])<0){q=L;break}}let[id,n]=q;
  if(id==='seed'){const L=Object.keys(CROPS).filter(k=>cropOn(k));id=L.length?'seed:'+pick(L):'mat:eda'}
  const nm=id.startsWith('mat:')?MATN[id.slice(4)]:id.startsWith('food:')?FOODS[id.slice(5)].name:itemName(id);
  if(id.startsWith('mat:')||id.startsWith('food:')){const food=id.startsWith('food:'),k=id.slice(food?5:4),m=Math.min(n,roomN(r));if(m>0){if(food)addCarry(r,k,m);else addMat(r,k,m)}if(m<n)dropAt(r.x,r.y,id,n-m)}
  else if(!(itemBoxOK()&&addItem(r,id,n)===n))dropAt(r.x,r.y,id,n);
  return nm+'×'+n}
function kdFound(e,r){if(!e||e.st===2)return;e.st=2;S.kodama=(S.kodama||0)+1;const n=S.kodama,c=e.k==='hana'||e.k==='ishi'?e.gap:e.j;
  sfx('seed');burst(c,'furn','furnPlace');r.bubble='✨';addFloat(r.x,r.y-1.7,chatTone(pickFresh('kodama',KDLINE),r));
  const got=kdLoot(r);toast(r.name+'が、もりのこだまを見つけた（'+n+'/'+kdTotal()+'）。'+got,'good');rewardPower(KDPT);addSpiritXp(1,r);logEv('もりのこだまを見つけた（'+n+'）');
  if(KDBP.includes(n)){memo('leaf','もりのこだまを'+n+'こ見つけた');if(!kdGiveBp(r))S.kdOwe=(S.kdOwe||0)+1}
  if(typeof juiceCheer==='function')juiceCheer();dirty=true}
function kdGiveBp(r){if(typeof bpNext!=='function'||!bpNext())return false;bpGiveNext(r?r.id:null);return true}
function kdMorning(){if(!kdOn())return;kdInit();kdHanaCheck();while((S.kdOwe||0)>0&&kdGiveBp(null))S.kdOwe--}
ACT.kdsget={start(r,a){const e=kdById(a.kid);if(!e||e.ws!==1)return false;a.box=keysAdj(a.stand,['stone']);if(a.box<0)return false;faceTo(r,a.box);r.bubble=''},done:(r,a)=>a.t>=4,
  end(r,a){const e=kdById(a.kid);if(!e||e.ws!==1||a.t<4)return;if(boxOutR(a.box,'stone',1)>0){r.kdst=e.id;e.ws=2}}};/* 箱から石材を1こ */
ACT.kdput={start(r,a){if(!r.kdst||r.kdst!==a.kid)return false;faceTo(r,a.obj);r.bubble=''},tick(r,a,dt){a.h=(a.h||0)+dt;if(a.h>=2){a.h=0;sfxAt('tstone',r.x,r.y)}},done:(r,a)=>a.t>=4,
  end(r,a){if(a.t<4)return;const e=kdById(a.kid);if(!e||e.st!==0||S.obj[e.gap]&&!WEEDS.has(S.obj[e.gap])){kdStoneBack(r);return}r.kdst=null;e.ws=0;S.obj[e.gap]='kdishi';KDMN=-1;kdFound(e,r);recount()}};/* すきまに石をおいて、輪ができる */
ACT.kdlook={start(r,a){const e=kdById(a.kid);if(!e||e.st!==1)return false;faceTo(r,a.obj);r.bubble=''},tick(r,a,dt){a.h=(a.h||0)+dt;if(a.h>=1.5){a.h=0;sfxAt('tgrass',r.x,r.y)}},done:(r,a)=>a.t>=3,
  end(r,a){if(a.t<3)return;kdFound(kdById(a.kid),r)}};
if(typeof WORKFACE!=='undefined')for(const k of['kdsget','kdput','kdlook'])WORKFACE.add(k);if(typeof TAKEACT!=='undefined')TAKEACT.add('kdsget');
/* ---------- 絵 ---------- */
function drawKd(c,id,x,y,i,g,now){const e=i!=null?kdAt(i):null,C=window.CHIPS||{};
  if(id==='kdishi'){const ch=C['rim:c'+((i||0)*7%4)];if(ch)drawChip(c,ch,'rim',x+16,y+17,now);return}
  if(id==='kdhana'){const fl=e&&e.fl||'clover';drawObj(c,fl,x,y,i,g,now);return}
  const ch=C[id];if(!ch)return;let dx=0;
  if(id==='kdkusa'&&e&&e.st!==2){const t=((now||performance.now())/1000+((i||0)%97)*.37)%2.6;if(t<.6)dx=[1,-1,1,-1,1,-1][(t/.1)|0]||0}/* ゆれる草むら：ときどき、こまかくゆれる（1点ずつ） */
  drawChip(c,ch,id,x+dx,y,now,i)}
/* ---------- 図鑑 ---------- */
function kdZukan(d,add){const L=d.kd||[];if(!L.length)return;const n=L.filter(e=>e.st===2).length;if(!n)return;add('もりのこだま','見つけた数 '+n+'/'+L.length,null);
  for(const k in KDK){const A=L.filter(e=>e.k===k),f=A.filter(e=>e.st===2).length;if(f)add(KDK[k].n,'見つけた数 '+f+'/'+A.length,k==='kusa'||k==='kabu'?iconURL(KDK[k].o):null)}}
