'use strict';
/* 土のステージの夜（tsuchi.js のつづき）。設定は STORY.md の「夜の土の谷」
   ・ツチノオオカゲを巣穴へ追いかえした（S.flags.tsOokDown）つぎの夜から、コワイノとバケモノが谷の地われから来る
   ・数は、ほかのステージと同じ（せいれいの人数×1〜2倍）。そのうち3びきに1ぴきが、洞窟でひらいた階のバケモノ（CVBK。ひらいた階から、じゅんばんに）
   ・朝、のこったバケモノは、歩いて地われへもどる（朝の光でも消えない）。コワイノは、ほかのステージと同じく、とけて消える
   ・洞窟のとくちょうのうち、村でもうごく物：光をおがむせきぞうは、村のあかりへよってきて、その前でおがむ・夜の水のかたまりは2つにわかれる・組みかけのほねは組みなおして起きる（まもりの光でとどめ）・炉にくべられたものの通った所は、あつい床
   たしかめは tools/tests/tsuchi-night.cjs */
const TSBKEVERY=3;/* 3びきに1ぴきがバケモノ */
const TSRIFTFAR=10;/* 地われから来るとき、村のまん中からはなれる広さ（マス） */
/* ひらいた階のバケモノ（上の階から） */
function tsBkFloors(){const n=Math.min(S.cvClr|0,CVBKFL.length),L=[];for(let i=0;i<n;i++){const t=CVBKFL[i];if(t)L.push(t)}return L}
/* 今夜のならび（waveFor から）：3びきめごとをバケモノにする。ひらいた階から、じゅんばんに（夜ごとに、はじめの階をずらす） */
function tsBkWave(list){if(WD!==TSUCHI||!S.ts)return;const F=tsBkFloors(),nb=Math.floor(list.length/TSBKEVERY);if(!F.length||!nb)return;
  const ko=list.slice(0,list.length-nb),out=[];let k=(S.nights||0)%F.length,b=0;
  for(let i=0;out.length<list.length;i++){if(i%TSBKEVERY===TSBKEVERY-1&&b<nb||!ko.length){let t=F[k%F.length];if((EN[t].pack||1)>list.length-out.length)t=F.find(q=>!EN[q].pack)||null;/* のこりが3つより少ないときは、むれでないバケモノ */if(!t){out.push(ko.shift()||'basic');continue}const n=EN[t].pack||1;for(let q=0;q<n;q++)out.push(t);ko.splice(0,n-1);/* うえたちねずみは3びきで来て、来る数の3つ分 */k++;b++}else out.push(ko.shift())}
  out.length=list.length;list.length=0;list.push(...out)}
/* 地われのとなりの、歩けて、村から行けるマス（下絵が変わったら作りなおす） */
const TSRF={n:-1,s:null,L:null};
function tsRiftEdge(){if(TSRF.n===STATN&&TSRF.s===S&&TSRF.L)return TSRF.L;const R=spawnReach(),L=[];
  for(let j=0;j<W*H;j++){if(!walk(j)||riftJ(j)||R[j]<0)continue;if([1,-1,W,-W].some(d=>riftJ(j+d)))L.push(j)}
  TSRF.n=STATN;TSRF.s=S;TSRF.L=L;return L}
const tsRiftNext=j=>[1,-1,W,-W].some(d=>riftJ(j+d));
/* 来る所（updEnemy から）：地われのふちの、村からはなれた所。群れの夜は、その夜の1か所のまわり */
const TSPACK={j:-1,n:0,t:''};/* むれのバケモノ（うえたちねずみ）：むれのなかまは、同じ所のそばから来る */
function tsRiftSpot(e){const L=tsRiftEdge();if(!L.length)return edgeSpot();
  const pk=e&&EN[e.type]&&EN[e.type].pack;if(pk&&TSPACK.n>0&&TSPACK.t===e.type&&TSPACK.j>=0){TSPACK.n--;const N=L.filter(j=>Math.hypot(j%W-TSPACK.j%W,((j/W)|0)-((TSPACK.j/W)|0))<=2),j=N.length?N[(Math.random()*N.length)|0]:TSPACK.j;return [j%W+.5,((j/W)|0)+.5]}
  const r=tsRiftSpot0(L);if(pk){const j=((r[1]|0)*W)+(r[0]|0);TSPACK.j=j;TSPACK.n=pk-1;TSPACK.t=e.type}return r}
function tsRiftSpot0(L){
  const far=L.filter(j=>Math.hypot(j%W+.5-CX,((j/W)|0)+.5-CY)>=TSRIFTFAR&&!lightAt(j%W+.5,((j/W)|0)+.5)),P=far.length?far:L;
  if(nightVarNow()==='mure'){const v=S.nightVar;if(v.rj==null||v.s!==S.nights){v.rj=P[(Math.random()*P.length)|0];v.s=S.nights}const N=P.filter(j=>Math.hypot(j%W-v.rj%W,((j/W)|0)-((v.rj/W)|0))<=3);const j=N.length?N[(Math.random()*N.length)|0]:v.rj;return [j%W+.5,((j/W)|0)+.5]}
  const j=P[(Math.random()*P.length)|0];return [j%W+.5,((j/W)|0)+.5]}
/* もどる先（にげる道さがしから）：いちばん近い地われのふち */
function tsRiftHome(e){const L=tsRiftEdge();let b=-1,bd=1e9;for(const j of L){const d=Math.hypot(j%W+.5-e.x,((j/W)|0)+.5-e.y);if(d<bd){bd=d;b=j}}return b<0?edgeSpot():[b%W+.5,((b/W)|0)+.5]}
/* もどるバケモノが、地われのふちに着いたか（にげる所から）。着いたら、地われへおりて消える */
function tsBkHomeAt(e){if(!e.home||!tsRiftNext((e.y|0)*W+(e.x|0)))return false;e.dead=true;spawnFX(e.x-.5,e.y-.5,'#3a3028');return true}
/* 朝6時（level.js）：のこったバケモノは、歩いて地われへもどる。くずれたほねも起きて、いっしょにもどる。もどる物をかえす */
function tsBkMorning(){if(WD!==TSUCHI||!S.ts)return[];const L=[];
  for(const e of S.enemies){if(e.dead||!EN[e.type].bk)continue;if(e.down){e.down=0;e.spawned=true;e.hp=e.max}if(!e.spawned)continue;e.home=1;e.flee=true;e.path=[];e.repath=0;e.stun=0;L.push(e)}
  if(L.length&&!S.flags.tsBkHome){S.flags.tsBkHome=1;villageTimeout(()=>toast('バケモノは、朝日の中を、地われへもどっていく','warn'),1200)}
  TSBKN.clear();return L}
/* ---- 光をおがむせきぞう：いちばん近い村のあかり（歩いて行けるとなりのマス）へ。着いたら、あかりを向いておがむ（-2）。行けるあかりがなければ -1（ほかのバケモノと同じ） ---- */
function tsPrayGoal(e){if(WD!==TSUCHI||!LITP.length)return -1;if(!EREACH.has(e))EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const RD=EREACH.get(e);let bq=-1,bl=-1,bd=1e9;
  for(const l of LITP){const lx=l%W,ly=(l/W)|0;for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=lx+dx,y=ly+dy;if(x<0||y<0||x>=W||y>=H)continue;const q=y*W+x;if(!walk(q)||!(RD&&RD[q]>=0))continue;const d=Math.hypot(x+.5-e.x,y+.5-e.y);if(d<bd){bd=d;bq=q;bl=l}}}
  if(bq<0)return -1;if(bd<.6){e.busyT=S.t;e.path=[];e.pray=1;enAim(e,bl%W+.5,((bl/W)|0)+.5);if(!TSBKN.has('pray')){TSBKN.add('pray');toast('せきぞうが、村のあかりを、おがんでいる','warn')}return -2}e.pray=0;return bq}
/* ---- 組みかけのほね：たおしても、くずれたまま組みなおして起きる。まもりの光で、とどめ ---- */
function tsBoneDown(e){/* defeat から。true なら、まだ消えない */if(WD!==TSUCHI||!EN[e.type].rebuild||e.byLight||typeof CV!=='undefined'&&CV)return false;
  e.down=S.t+CVHONET;e.spawned=false;e.hp=0;e.path=[];e.repath=0;e.stun=0;sfxAt('crack',e.x,e.y);if(!TSBKN.has('hdown')){TSBKN.add('hdown');toast('ほねが、くずれた','good')}return true}
function tsBoneUpd(e){/* updEnemy から（くずれているあいだ） */if(S.t<e.down)return;e.down=0;e.spawned=true;e.hp=e.max;e.stun=0;e.path=[];e.repath=0;spawnFX(e.x-.5,e.y-.5,'#e8dcc0');sfxAt('crack',e.x,e.y);if(!TSBKN.has('hone')){TSBKN.add('hone');toast('ほねが、また組みあがった','warn')}}
function tsBoneLight(e){/* glHit から：くずれたほねに、まもりの光 */e.down=0;e.spawned=true;e.byLight=1;defeat(e,'まもりの光で、組みかけのほねに、とどめをさした！')}
/* ---- 毎コマ（level.js、updEnemy のあと）：夜の水のかたまりがわかれる・あつい床 ---- */
const TSBKN=new Set();/* その夜に1回だけの知らせ */
const TSHOT={s:null,m:new Map()};/* あつい床：マス → いつまで（時計の分）。セーブしない */
function tsHotMap(){if(TSHOT.s!==S){TSHOT.s=S;TSHOT.m=new Map()}return TSHOT.m}
function tsNightTick(dt){if(WD!==TSUCHI||!S.ts)return;const M=tsHotMap();
  for(const e of S.enemies.slice()){if(e.dead||!e.spawned||e.down)continue;const D=EN[e.type];if(!D.bk)continue;
    if(D.split&&!e.kid&&!e.spl&&e.hp<e.max&&e.hp>0){e.spl=1;const h=Math.ceil(e.hp/2);e.hp=h;const c=(e.y|0)*W+(e.x|0),j=[1,-1,W,-W,W+1,W-1,-W+1,-W-1].map(d=>c+d).find(q=>walk(q)&&!riftJ(q));/* はじめてたたかれると、2つにわかれる（1回だけ） */
      if(j!=null){S.enemies.push({id:S.nid++,type:e.type,x:j%W+.5,y:((j/W)|0)+.5,hp:h,max:h,delay:0,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:!!e.flee,home:e.home,kid:1});if(S.ns)S.ns.n++;spawnFX(j%W,(j/W)|0,'#7fe8ff');sfxAt('pour',e.x,e.y);if(!TSBKN.has('split')){TSBKN.add('split');toast('夜の水のかたまりが、2つにわかれた','warn')}}}
    if(D.hot){const j=(e.y|0)*W+(e.x|0);if(walk(j)&&!S.ground[j])M.set(j,S.t+CVROHOT)}}/* 通った所が、あつい床になる */
  if(!M.size)return;for(const[j,u]of M)if(u<=S.t)M.delete(j);
  for(const r of S.res){if(r.hidden||r.elem==='fire')continue;const u=M.get((r.y|0)*W+(r.x|0));if(!u)continue;r.hunger=Math.max(0,r.hunger-CVHOTHUN*dt);if(!TSBKN.has('hot')){TSBKN.add('hot');toast('あつい床。火のせいれいのほかは、おなかがはやくへる','warn')}}}
/* あつい床の絵（draw-world.js、地面の上） */
function tsHotDraw(now){if(WD!==TSUCHI||TSHOT.s!==S||!TSHOT.m.size)return;for(const[j,u]of TSHOT.m){const x=(j%W)*TS,y=((j/W)|0)*TS,p=.5+.5*Math.sin(now/300+j);ctx.save();isoGroundLv(ctx,isoLv(j));ctx.globalAlpha=Math.min(1,(u-S.t)/3)*(.35+.3*p);ctx.fillStyle='#ff5a20';qRect(ctx,x+4,y+8,24,16,j);ctx.fillStyle='#ffb040';qRect(ctx,x+10,y+13,12,5,j);ctx.restore()}}
/* たおれたバケモノの消え方（drawEvap から）：白く止まって、うすれて消える */
function tsBkEvap(it,now){const e=it.e,a=now-it.t0;if(a<KO_HOLD){cvBkDraw(e,now);return}const p=(a-KO_HOLD)/(it.dur||1300);if(p>=1)return;const[,f]=cvBkFrame(e,now);if(!cvBkChip(ctx,'bk'+e.type.slice(3)+'#0',e.x*TS,e.y*TS+7+p*6,f,Math.max(0,1-p))){ctx.globalAlpha=Math.max(0,1-p);P4('#3a3028',e.x*TS-8,e.y*TS-18+p*10,16,18);ctx.globalAlpha=1}}
/* はじめて地われから来た夜（spawnWave から） */
function tsNightTold(list){if(WD!==TSUCHI||!S.ts||S.free)return;const ib=S.res.some(r=>r.name===IBUKI&&!r.hidden),to=S.res.some(r=>r.name===TOTO&&!r.hidden);
  if(!S.flags.tsFoeTold&&to){S.flags.tsFoeTold=1;dialog([[TOTO,'#scared|……地われの下から、なにか上がってくる。'],...(ib?[[IBUKI,'#think|影だな。地われの下の音は、こいつらか。']]:[]),[TOTO,'#proud|む、村には、入れさせないもん！']],null,null,TOTO);return}
  if(!S.flags.tsBkTold&&ib&&list.some(t=>EN[t].bk)){S.flags.tsBkTold=1;dialog([[IBUKI,'#alarm|おい、洞窟にいたやつまで、上がってきてるぞ！'],...(to?[[TOTO,'#worry|……巣穴の下から、地われをつたって来たのかな。']]:[])],null,null,IBUKI)}}
