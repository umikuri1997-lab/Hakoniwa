'use strict';
/* ---------- 風のしくみ（風のやんだ空の村）----------
   風穴（kazaana。はじめは石でふさがった kazaanab）から、きまった向きへ風がまっすぐふく（風の道）。1つの風穴の風は、曲げた分もあわせて WINDMAX マスまで。
   風の道に「かざみ」（kazami）を置くと、そこで向きがかわる。家の壁・木・岩・建物に当たると止まる。段差はこえる。
   風が雲の海をこえて、向こうの陸にとどいた所だけ、歩ける雲の橋になる（風の向きをかえると消える）。
   風の道が雲にしずんだ島にふれると、島がうかぶ（S.wind.up。いちどうかんだら、しずまない）。しずんだ島は、霧と同じく歩けない・置けない（fogAt）。
   橋が消えて、まん中の島へもどれなくなったせいれいは、風にのって、まん中の島へはこばれる。
   風の道の上を、風と同じ向きに歩くと、移動速度 WINDTAIL 倍。
   セーブに入るのは S.wind（風穴のマスと向き・うかんだ島）だけ。風の道・雲の橋・島の番号は、地形と置いた物から作る（windSync。recount のたび）。
   絵は、どれもコードの仮のドット絵。 */
const WINDMAX=40,WINDTAIL=1.5,WDIR=[[0,1],[1,0],[0,-1],[-1,0]];/* 向き：0 手前（南）・1 右（東）・2 奥（北）・3 左（西）。置く家具の向き（rotAt）と同じ */
const WINDIDS=new Set(['kazaana','kazaanab','kazami','oldmill']),WINDHOLET=60/* 風穴をひらく時間 */,WINDRISE=2600/* 島の雲がわれる時間（ミリ秒） */;
const windOn=()=>!!S&&WD===WIND&&!!S.wind;
/* 島の番号（1〜）。雲の海は0。島の中の池は、その島。地形はかわらないので、ステートごとに1回だけ作る */
const WISLE=new WeakMap();
function windIsles(s){let I=WISLE.get(s);if(I)return I;const M=skyOf(s.ground),id=new Int16Array(W*H),size=[0],cx=[0],cy=[0];
  for(let j=0;j<W*H;j++){if(id[j]||M[j])continue;const k=size.length,q=[j];id[j]=k;let n=0,sx=0,sy=0;while(q.length){const c=q.pop(),x=c%W,y=(c/W)|0;n++;sx+=x;sy+=y;for(const m of[x>0?c-1:-1,x<W-1?c+1:-1,c-W,c+W]){if(m<0||m>=W*H||id[m]||M[m])continue;id[m]=k;q.push(m)}}size.push(n);cx.push(sx/n);cy.push(sy/n)}
  I={id,size,cx,cy,mid:id[CY*W+CX],n:size.length-1};WISLE.set(s,I);return I}
/* あたらしい風の村：風穴（まん中の島と、大きな島に1つずつ。どれも石でふさがっている）と、まん中の風穴のそばの古い風車 */
function windGen(s,R){const I=windIsles(s),holes=[],land=j=>j>=0&&j<W*H&&I.id[j]>0&&s.ground[j]===0,free=j=>land(j)&&!s.floor[j]&&(!s.obj[j]||BL[s.obj[j]]&&BL[s.obj[j]].natural);
  const put=(k,tx,ty,d)=>{let best=-1,bd=1e9;for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const j=y*W+x;if(I.id[j]!==k||!free(j))continue;let ok=true;for(let b=-2;b<=2&&ok;b++)for(let a=-2;a<=2;a++)if(!land(j+b*W+a)||s.floor[j+b*W+a]||s.obj[j+b*W+a]&&!BL[s.obj[j+b*W+a]].natural){ok=false;break}if(!ok)continue;const dd=Math.hypot(x-tx,y-ty);if(dd<bd){bd=dd;best=j}}
    if(best<0)return -1;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const q=best+b*W+a;s.obj[q]='';delete s.dyn[q];delete s.hp[q]}s.obj[best]='kazaanab';holes.push({j:best,d});return best};
  const h0=put(I.mid,CX+11,CY+2,1);if(h0>=0){const m=h0-W+2;if(land(m)&&!s.floor[m]){s.obj[m]='oldmill';delete s.dyn[m];delete s.hp[m]}}/* まん中の風穴は、東へふく。そのすぐ北東に古い風車 */
  for(let k=1;k<=I.n;k++)if(k!==I.mid&&I.size[k]>=150)put(k,I.cx[k],I.cy[k],(R()*4)|0);
  s.wind={holes,up:{[I.mid]:1}};s.fog=[]}/* s.fog：しずんだ島を、霧と同じ「歩けない・置けない」にするための印（fogAt が windSunk を見る） */
const windSunk=j=>{if(!windOn())return false;const k=windIsles(S).id[j];return k>0&&!S.wind.up[k]};
const windHoleAt=j=>windOn()?S.wind.holes.find(h=>h.j===j):null;
const windOpenN=()=>windOn()?S.wind.holes.filter(h=>S.obj[h.j]==='kazaana').length:0;
const windUpN=()=>windOn()?Object.keys(S.wind.up).length-1:0,windIsleN=()=>windOn()?windIsles(S).n-1:0;/* うかんだ島の数・うかせる島の数（まん中の島はのぞく） */
function windBlock(j){const o=typeAt(j);if(!o||o==='kazami')return false;const b=BL[o];if(!b)return false;return !!(b.natural&&b.solid||b.kind==='build'||HOME_WALLS.has(o)||HOME_DOORS.has(o)||o==='site'||o==='site2'||WINDIDS.has(o)||o==='statue'||o==='statueb'||o==='obox'||o==='board'||o==='altar')}/* 風を止める物：木・岩・茂み・建物・家の壁とドア・神殿・風穴 */
/* 風の道を作る：dir（マス→向き。なければ −1）・br（雲の橋）・うかせる島・つながった島 */
let WN=null,WNS=null;const WRISEQ=[],WRISE=new WeakMap();/* WRISE：島→雲がわれはじめた時刻（Infinity：演出まち） */
function windSync(){if(!windOn()){WN=null;WNS=null;return}if(!Array.isArray(S.fog))S.fog=[];
  const M=skyM(),I=windIsles(S),dir=new Int8Array(W*H).fill(-1),br=new Uint8Array(W*H),P=[];for(let k=0;k<=I.n;k++)P.push(k);const find=k=>P[k]===k?k:P[k]=find(P[k]);let rose=false;
  for(const h of S.wind.holes){if(S.obj[h.j]!=='kazaana')continue;let x=h.j%W,y=(h.j/W)|0,d=h.d&3,n=0,seg=[],from=I.id[h.j];const seen=new Set();
    while(n<WINDMAX){x+=WDIR[d][0];y+=WDIR[d][1];if(x<1||y<1||x>=W-1||y>=H-1)break;const j=y*W+x,key=j*4+d;if(seen.has(key))break;seen.add(key);
      if(M[j]){seg.push(j);dir[j]=d;n++;continue}
      if(windBlock(j))break;
      const k=I.id[j];if(seg.length){for(const q of seg)br[q]=1;P[find(from)]=find(k);seg=[]}from=k;dir[j]=d;n++;
      if(!S.wind.up[k]){S.wind.up[k]=1;rose=true;WRISE.set(S.wind,(WRISE.get(S.wind)||new Map()).set(k,Infinity));WRISEQ.push({state:S,k})}
      if(S.obj[j]==='kazami')d=rotAt(j)&3}}
  const reach=new Uint8Array(I.n+1),m=find(I.mid);for(let k=1;k<=I.n;k++)if(find(k)===m)reach[k]=1;
  WN={dir,br,reach,v:(WN&&WNS===S?WN.v:0)+1};WNS=S;
  if(rose){if(typeof waterDirty==='function')waterDirty(null);dirty=true}}
const windBr=j=>WD===WIND&&!!WN&&WNS===S&&WN.br[j]===1;
const windDirAt=j=>WD===WIND&&WN&&WNS===S?WN.dir[j]:-1;
function windNear(j,r){if(WD!==WIND||!WN||WNS!==S)return false;const x0=j%W,y0=(j/W)|0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++)if(x>=0&&y>=0&&x<W&&y<H&&WN.dir[y*W+x]>=0)return true;return false}
function windTail(r){/* 追い風：風の道の上を、風と同じ向きに歩いている */if(WD!==WIND||!WN||WNS!==S||!r.path||!r.path.length)return 1;const j=(r.y|0)*W+(r.x|0),d=WN.dir[j];if(d<0)return 1;const n=r.path[0],dx=Math.sign(n%W-(j%W)),dy=Math.sign(((n/W)|0)-((j/W)|0));return dx===WDIR[d][0]&&dy===WDIR[d][1]?WINDTAIL:1}
/* 風穴を「しらべる」でタップ：せいれいが石をどけにくる（建てる所のしくみ） */
function windHoleTap(j){if(!windOn()||S.obj[j]!=='kazaanab')return false;S.obj[j]='site';S.dyn[j]={build:'kazaana',p:0,need:WINDHOLET,hole:1};sfx('tstone');toast('せいれいが石をどけにきてくれる');recount();dirty=true;renderQuest();return true}
/* とりのこされたせいれい：橋が消えて、まん中の島へもどれなくなったら、風にのって、まん中の島へ */
let WCARV=-1,WCARS=null;
function windCarry(){if(!WN||WNS!==S||WCARS===S&&WCARV===WN.v)return;WCARS=S;WCARV=WN.v;const M=skyM(),I=windIsles(S);let home=null;
  for(const r of S.res){if(r.hidden||r.coffin)continue;const j=(r.y|0)*W+(r.x|0),k=I.id[j];if(M[j]?WN.br[j]===1:WN.reach[k]===1)continue;
    if(!home){const h=S.wind.holes.find(q=>I.id[q.j]===I.mid),c=STATUE>=0?STATUE+2*W:h?h.j:CY*W+CX,cx=c%W,cy=(c/W)|0;home=[];for(let rr=1;rr<7&&home.length<12;rr++)for(let b=-rr;b<=rr;b++)for(let a=-rr;a<=rr;a++){const q=(cy+b)*W+cx+a;if(Math.max(Math.abs(a),Math.abs(b))===rr&&I.id[q]===I.mid&&walk(q)&&!S.obj[q])home.push(q)}}
    const q=home.length?home[(Math.random()*home.length)|0]:CY*W+CX;spawnFX(r.x-.5,r.y-.6,'#e6f4fa');if(typeof endAct==='function')endAct(r);r.path=[];r.x=q%W+.5;r.y=((q/W)|0)+.5;spawnFX(r.x-.5,r.y-.6,'#e6f4fa');sfxAt('leaf',r.x,r.y);toast(r.name+'が、風にのって帰ってきた')}}
/* 島がうかぶ演出：村の時間を止め、カメラが島へ行ってから雲がわれ、大きな知らせを出し、もとの所へもどる（霧が晴れる演出と同じ作り） */
let WRISEON=false,WRISECAM=null;
function windRiseTick(){while(WRISEQ.length&&WRISEQ[0].state!==S)WRISEQ.shift();if(!WRISEQ.length||GIFT_ACTIVE||camAnim||!stageReady()||!$('#dialog').hidden)return;
  const it=WRISEQ.shift(),k=it.k,I=windIsles(S),T=WRISE.get(S.wind)||new Map(),owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION;GIFT_ACTIVE=true;WRISEON=true;
  const back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2},tz=Math.min(cam.z,1.2),tx=(I.cx[k]+.5)*TS,ty=(I.cy[k]+.5)*TS;
  const finish=()=>{if(!WRISEON)return;WRISEON=false;GIFT_ACTIVE=false;if(T.get(k)===Infinity)T.set(k,performance.now())};
  musicDuck(2600);camAnim=WRISECAM={fz:cam.z,tz,fx:back.x,fy:back.y,tx,ty,t:0,dur:1.6,done:()=>{if(!ok())return finish();T.set(k,performance.now());sfx('level');dirty=true;
    setTimeout(()=>{if(!ok())return finish();const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="島がうかんだ"></div>'),card=el('<div class="idea-card"><h2>島がうかんだ！</h2><div class="spotpop"><p></p></div></div>');
      card.querySelector('p').textContent='風がとどいて、雲の下から島があらわれた';
      const button=el('<button class="btn pri" type="button">とじる</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');setTimeout(()=>{if(overlay.isConnected)button.disabled=false},650);
      button.onclick=()=>{if(button.disabled)return;overlay.remove();if(!ok())return finish();memo('leaf','風がとどいて、島がうかんだ');checkQuest();camAnim=WRISECAM={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1.2,done:finish}}},WINDRISE+200)}}}
function windRiseReset(){WRISEQ.length=0;if(WRISEON){if(WRISECAM&&camAnim===WRISECAM)camAnim=null;WRISECAM=null;WRISEON=false;GIFT_ACTIVE=false;document.querySelectorAll('.idea-reveal[aria-label="島がうかんだ"]').forEach(e=>e.remove())}}/* 村を切りかえたとき */
function windTick(){if(!windOn())return;if(!WN||WNS!==S)windSync();windCarry();windRiseTick()}
/* ---------- 絵（コードの仮のドット絵。1ドット＝世界の1ドット） ---------- */
function windCover(k,now){/* しずんだ島の雲のこさ（0〜1）。うかんだ島は、雲がわれるあいだだけ */if(!S.wind.up[k])return 1;const T=WRISE.get(S.wind),t=T&&T.get(k);if(t==null)return 0;if(t===Infinity)return 1;const p=(now-t)/WINDRISE;if(p>=1){T.delete(k);return 0}return 1-p}
const WCOVP=new WeakMap();
function drawWindCover(c,x0,y0,x1,y1,now){/* しずんだ島：島の形に、雲をかぶせる（夜の暗さより下。うっすら島が見える） */if(!windOn())return;const I=windIsles(S);let P=WCOVP.get(S);
  if(!P){P=[null];for(let k=1;k<=I.n;k++)P.push(new Path2D());for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=I.id[y*W+x];if(!k)continue;const up=y>0&&I.id[(y-1)*W+x]===k?0:44+(S.hi?S.hi[y*W+x]|0:0)*LIFT,dn=y<H-1&&I.id[(y+1)*W+x]===k?0:22;P[k].rect(x*TS,y*TS-up,TS,TS+up+dn)}WCOVP.set(S,P)}
  const pt=c.createPattern(skyTex(),'repeat');pt.setTransform(new DOMMatrix().translate(Math.floor(now/1000*3)%128,0));
  for(let k=1;k<=I.n;k++){if(k===I.mid)continue;const a=windCover(k,now);if(a<=0)continue;if(I.cx[k]<x0-30||I.cx[k]>x1+30||I.cy[k]<y0-30||I.cy[k]>y1+30)continue;c.save();c.globalAlpha=.88*a;c.fillStyle=pt;c.fill(P[k]);c.restore()}}
function drawWindGround(c,x0,y0,x1,y1,now){/* 地面の高さの絵：雲の橋と、風のすじ（物・せいれいより下） */if(!windOn()||!WN||WNS!==S)return;const t=now/1000;
  for(let y=Math.max(0,y0-1);y<Math.min(H,y1+1);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){const j=y*W+x,d=WN.dir[j];if(d<0)continue;const px=x*TS,py=y*TS-(S.hi?S.hi[j]|0:0)*LIFT,hz=d===1||d===3;
    if(WN.br[j]){/* 雲の橋：白い雲の道 */c.fillStyle='#a5d2e8';if(hz)c.fillRect(px,py+9,TS,18);else c.fillRect(px+7,py,18,TS);c.fillStyle='#f4fbfd';if(hz){c.fillRect(px,py+6,TS,18);for(let q=0;q<4;q++)c.fillRect(px+q*8+((j+q)&1)*2,py+4+((q+j)&1),6,3)}else{c.fillRect(px+7,py,18,TS);for(let q=0;q<4;q++)c.fillRect(px+5+((q+j)&1),py+q*8+((j+q)&1)*2,3,6)}c.fillStyle='#ffffff';if(hz)c.fillRect(px,py+9,TS,4);else c.fillRect(px+10,py,4,TS)}
    /* 風のすじ：風の向きへ流れる、白い短い線 */for(let q=0;q<3;q++){const ph=((t*1.4+hash(j*7+q*31))%1),off=Math.floor(ph*TS),sd=5+((hash(j*13+q*5)*20)|0),col=WN.br[j]?['rgba(120,180,212,.95)','rgba(165,210,232,.9)']:['rgba(255,255,255,.95)','rgba(214,240,250,.8)'];
      for(let s=0;s<2;s++){c.fillStyle=col[s];const a=s?-8:0,len=s?8:4;/* あたまは白く、うしろは、うすい尾 */
        if(d===1)c.fillRect(px+off+a,py+sd,len,2);else if(d===3)c.fillRect(px+TS-off-len-a,py+sd,len,2);else if(d===0)c.fillRect(px+sd,py+off+a,2,len);else c.fillRect(px+sd,py+TS-off-len-a,2,len)}}}}
function drawWindObj(c,id,x,y,i,g,now){const R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h)};
  if(id==='oldmill'){drawObj(c,'windmill',x,y,i,g,now);return}/* 古い風車：風があたっているときだけ、まわる */
  if(id==='kazaana'||id==='kazaanab'){/* 風穴：石でかこんだ穴。ふさがった風穴は、石の山 */
    R(5,12,22,14,'#8f8672');R(3,15,26,9,'#8f8672');R(6,11,20,2,'#b3aa94');R(4,14,3,2,'#b3aa94');R(25,14,3,2,'#b3aa94');R(5,25,22,2,'#6f6857');
    if(id==='kazaana'){R(8,14,16,9,'#3d4a5c');R(10,13,12,1,'#3d4a5c');R(10,23,12,1,'#3d4a5c');R(9,15,14,2,'#2b3442');
      if(i!=null){const h=windHoleAt(i),d=h?h.d&3:0,t=(now||0)/1000;for(let q=0;q<3;q++){const ph=(t*1.8+q/3)%1,k=Math.floor(ph*12);c.fillStyle='rgba(255,255,255,'+(.9-ph*.7)+')';c.fillRect(Math.round(x+15+WDIR[d][0]*k+(q-1)*3*Math.abs(WDIR[d][1])),Math.round(y+17+WDIR[d][1]*k+(q-1)*3*Math.abs(WDIR[d][0])),2,2)}}}
    else{R(8,10,8,8,'#a39a84');R(15,7,9,10,'#b3aa94');R(11,15,11,9,'#9a917b');R(18,16,7,7,'#a8a08a');R(9,11,6,1,'#cfc7b2');R(16,8,7,1,'#cfc7b2');R(12,16,9,1,'#c2baa4');R(8,17,1,1,'#6f6857');R(22,23,3,1,'#6f6857')}return}
  if(id==='kazami'){/* かざみ：柱の上に、風の向きをさす矢の羽 */const d=(i!=null?rotAt(i):(PLROTS.kazami||0))&3;R(12,26,8,3,'rgba(60,50,30,.25)');R(15,10,2,18,'#8a6a42');R(14,26,4,2,'#6f5433');R(14,8,4,3,'#c9a46a');
    const a='#f4fbfd',b='#7fc7b4';if(d===1){R(8,4,16,3,a);R(22,2,3,7,b);R(25,4,2,3,b);R(6,2,3,7,b)}else if(d===3){R(8,4,16,3,a);R(7,2,3,7,b);R(5,4,2,3,b);R(23,2,3,7,b)}else if(d===0){R(14,0,4,12,a);R(12,10,8,3,b);R(14,13,4,2,b);R(12,-1,8,2,b)}else{R(14,0,4,12,a);R(12,0,8,3,b);R(14,-2,4,2,b);R(12,11,8,2,b)}return}}
