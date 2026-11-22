'use strict';
/* ---------- ときどき起きるできごと ----------
   朝6時（morning の hapMorning）に HAPP で、4つのうち、その朝に条件のあう物が1つ出る（1日に1つまで。S.hap）。
   どのステージもフリーモードも。思い出帳の再生・洞窟では出ない。えらぶのは日にちの hash（ほかの乱数の順番をかえない）。
   ・大きなかぶ（kabu）：育ちきった畑の作物が大きくなる。「しらべる」でタップすると、せいれいが3人（いなければいる人数）あつまり、
     そろったら、せーのでひっぱる（KABUPULL）。ぬけるとしりもち（KABUFALL）。収穫 KABUN こ。18時（HAPEND）に、ふつうの作物にもどる。
   ・まいごのヒナ（hina）：村の中の行ける所。タップすると、近いせいれいがヒナを頭にのせ、いちばん近い木へとどける。
     17時（HINAPAR）に親鳥が来て、ベリー HINAFOOD こと花のたね HINASEED つを落とす。とどけないまま18時になると、親鳥がつれていく。
   ・きんいろの木（kin）：村の木（植えた木・りんごの木）1本に金の実。タップすると、せいれいがとる（KINT）。りんご KINAPPLE こ、KINGIFT でおくりもの1つ。18時に実がおちて消える。
   ・きのこの輪（kino）：雨のつぎの朝（S.wetD）だけ。村のそばの草地に、5×5のふちのきのこの輪（まん中3×3があく）。
     昼（KINOH0〜KINOH1）、ひまなせいれいが KINOP でおどりに行き（goWander の hapDance）、たのしさ+KINOFUN（1人1回）。17時（KINOEND）に輪がきえ、きのこ KINON こが落とし物になる。
   絵は、もらうまでコードのドット（1ドット2点の整数の四角）。 */
const HAPP=.3,HAPEND=18,KABUN=8,KABUPULL=9,KABUFALL=4,KABUMAX=3,HINAPAR=17,HINAFOOD=3,HINASEED=1,KINAPPLE=5,KINGIFT=.2,KINT=9,KINOH0=8,KINOH1=17,KINOEND=17,KINOP=.3,KINOFUN=10,KINODUR=24,KINON=3,KINODMAX=3;
const HAPK=['kabu','hina','kin','kino'];
let HAPFX=null;/* 見た目だけ（実時間）：{k:'par'|'bye'|'fall'|'pop',t0,...}。セーブしない */
function hapOK(){return !!(S&&!MEMRUN&&!(typeof NOSAVE!=='undefined'&&NOSAVE)&&!(typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY)&&!(typeof caveOn==='function'&&caveOn()))}
function hapNow(k){const h=S&&S.hap;return h&&h.d===dayNo()&&(!k||h.k===k)?h:null}
function hapG(){const r0=S.res.find(q=>!q.hidden);return r0?bfs(r0.x|0,r0.y|0):null}
function hapStands(G,j,farmOK){/* そのマスのまわり（たて・よこ・ななめ）の、立てるマス。畑でない所を先に */const x=j%W,y=(j/W)|0,A=[],B=[];
  for(const[dx,dy]of[[-1,0],[1,0],[0,1],[0,-1],[-1,1],[1,1],[-1,-1],[1,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const k=yy*W+xx;if(G.dist[k]<0||!walk(k)||fogAt(k))continue;if(S.obj[k]==='farm')B.push(k);else if(!S.obj[k]||BL[S.obj[k]]&&BL[S.obj[k]].floor)A.push(k)}
  return farmOK?A.concat(B):A}
function hapTreeOf(j){const t=S.obj[j];return t==='tree'||t==='fruit'}
/* ---- 朝：きめる ---- */
function hapMorning(){if(!S)return;const d=dayNo();S.hap=null;HAPFX=null;if(!hapOK()||!S.res.some(r=>!r.hidden))return;
  const hk=k=>hash(d*6151+k*977+(S.world||0)*13);if(hk(1)>=HAPP)return;const G=hapG();if(!G)return;
  const C={};{const L=[];for(let j=0;j<W*H;j++){if(S.obj[j]!=='farm')continue;const q=S.dyn[j];if(q&&q.g>=100&&q.sown!==false&&hapStands(G,j,1).length)L.push(j)}if(L.length)C.kabu=L}
  {const L=[];for(let j=0;j<W*H;j++){if(!VILL[j]||S.obj[j]||S.floor[j]||S.ground[j]||!walk(j)||fogAt(j)||G.dist[j]<0)continue;if(typeof roomOf==='function'&&roomOf(j))continue;if((S.drops||[]).some(q=>q.y*W+q.x===j))continue;L.push(j)}
    const M=[];for(let i=0;i<24&&L.length;i++){const j=L.splice(Math.floor(hk(10+i)*L.length),1)[0];if(hapNest(G,j)>=0)M.push(j)}if(M.length)C.hina=M}/* 木のそばの所だけ（しらべるのは24マスまで） */
  {const L=[],V=[];for(let j=0;j<W*H;j++){if(!hapTreeOf(j)||!hapStands(G,j).length)continue;(VILL[j]?V:L).push(j)}if(V.length||L.length)C.kin=V.length?V:L}
  if(S.wetD===d){const L=hapRingSpots(G);if(L.length)C.kino=L}
  const ks=HAPK.filter(k=>C[k]);if(!ks.length)return;const k=ks[Math.floor(hk(2)*ks.length)],L=C[k],j=L[Math.floor(hk(3)*L.length)];
  S.hap={d,k,j,ph:k==='kino'?'on':'wait',tk:0};
  if(k==='hina')S.hap.tj=hapNest(G,j);if(k==='kino')S.hap.dn={};if(k==='kabu')S.hap.crop=cropK(S.dyn[j]);
  const T={kabu:['grass','畑に、とても大きな'+hapCropName()+'ができている'],hina:['heart','村に、まいごのヒナがいる'],kin:['apple','木に、きんいろの実がなっている'],kino:['leaf','草地に、きのこの輪ができている']}[k];
  setTimeout(()=>{if(hapNow(k))toast(T[1],'good')},1700);memo(T[0],T[1]);dirty=true}
function hapCropName(){const h=S.hap,k=h&&h.crop;return k&&FOODS[k]?FOODS[k].name:'かぶ'}
function hapNest(G,j){/* ヒナをとどける木：ヒナからいちばん近い木（立てるマスのある木） */const x=j%W,y=(j/W)|0;let best=-1,bd=1e9;
  for(let dy=-14;dy<=14;dy++)for(let dx=-14;dx<=14;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const k=yy*W+xx;if(!TREES.has(typeAt(k))||fogAt(k))continue;const dd=dx*dx+dy*dy;if(dd>=bd||!hapStands(G,k).length)continue;bd=dd;best=k}return best}
function hapRingSpots(G){/* 5×5がぜんぶ空いた、同じ高さの草地。村のそば（村から8マスまで、村の外を先に） */const out=[],inn=[],ok=k=>!S.obj[k]&&!S.floor[k]&&!S.ground[k]&&walk(k)&&!fogAt(k)&&REV.has(k)&&G.dist[k]>=0;
  for(let cy=4;cy<H-4;cy+=2)for(let cx=4;cx<W-4;cx+=2){const c=cy*W+cx,h0=hiAt(c);let good=true,near=false,inV=false;
    for(let dy=-2;dy<=2&&good;dy++)for(let dx=-2;dx<=2;dx++){const k=c+dy*W+dx;if(!ok(k)||hiAt(k)!==h0){good=false;break}if(VILL[k])inV=true}if(!good)continue;
    for(let dy=-8;dy<=8&&!near;dy+=2)for(let dx=-8;dx<=8;dx+=2){const xx=cx+dx,yy=cy+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&VILL[yy*W+xx]){near=true;break}}if(!near)continue;(inV?inn:out).push(c)}
  return out.length?out:inn}
function hapRing(c){/* 輪のきのこ：5×5のふちから、角をのぞいた12マス */const L=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(Math.abs(dx)<2&&Math.abs(dy)<2)continue;if(Math.abs(dx)===2&&Math.abs(dy)===2)continue;L.push(c+dy*W+dx)}return L}
function hapInner(c){const L=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)L.push(c+dy*W+dx);return L}
function hapBlock(j){/* 大きなかぶの畑は、ふつうの収穫をしない */const h=hapNow('kabu');return !!h&&h.j===j&&h.ph!=='end'}
/* ---- タップ ---- */
function hapTap(tx,ty){const h=hapNow();if(!h||h.ph==='end')return false;const j=ty*W+tx;
  if(h.k==='kabu'){if(j!==h.j&&j!==h.j-W)return false}
  else if(h.k==='kin'){if(j!==h.j&&j!==h.j-W&&j!==h.j-2*W)return false}
  else if(h.k==='hina'){if(h.ph!=='wait'||Math.max(Math.abs(h.j%W-tx),Math.abs(((h.j/W)|0)-ty))>1)return false}
  else return false;
  if(h.tk){toast('もう、たのんである');return true}if(isNight())return toast('夜はできません','warn'),true;
  if(!S.res.some(r=>!r.hidden))return toast('行けるせいれいがいません','warn'),true;
  h.tk=1;sfx('seed');addFloat(tx+.5,ty,'たのんだ','#fff3b0');toast(h.k==='kabu'?'みんなで、ひっぱりに行く':h.k==='hina'?'ヒナを、木へとどけに行く':'きんいろの実を、とりに行く','good');dirty=true;return true}
/* ---- せいれいの仕事（goWork のはじめのほう） ---- */
function hapReady(r){return !isNight()&&!enemyLive()&&r.hunger>=250&&!r.hidden}
function hapJob(r,G){const h=hapNow();if(!h||h.ph==='end'||!hapReady(r))return false;
  if(h.k==='kabu'&&h.tk&&h.ph==='wait'){const on=S.res.filter(q=>q.act&&q.act.type==='hkabu').length,need=Math.min(KABUMAX,S.res.filter(q=>!q.hidden).length);if(on>=need)return false;
    const s=hapStands(G,h.j,1).find(k=>free('hk'+k,1));if(s==null)return false;startAct(r,G,'hkabu',s,{key:'hk'+s,obj:h.j});return true}
  if(h.k==='hina'){if(h.ph==='held'&&h.who===r.id){const s=hapStands(G,h.tj)[0];if(s==null){h.ph='wait';h.who=null;return false}startAct(r,G,'hnest',s,{key:'hn',obj:h.tj});return true}
    if(h.ph==='wait'&&h.tk&&free('hh',1)){const s=G.dist[h.j]>=0&&walk(h.j)?h.j:adjOf(h.j,k=>G.dist[k]>=0&&walk(k));if(s<0)return false;startAct(r,G,'hhina',s,{key:'hh',obj:h.j});return true}}
  if(h.k==='kin'&&h.tk&&free('hkn',1)){const s=hapStands(G,h.j)[0];if(s==null)return false;startAct(r,G,'hkin',s,{key:'hkn',obj:h.j});return true}
  return false}
function hapDance(r,G){/* goWander から：ひまなせいれいが、きのこの輪でおどる */const h=hapNow('kino');if(!h||h.ph!=='on'||h.dn[r.id]||!hapReady(r))return false;const hr=hour();if(hr<KINOH0||hr>=KINOH1)return false;
  if(S.res.filter(q=>q.act&&q.act.type==='hdance').length>=KINODMAX||Math.random()>=KINOP)return false;
  const s=hapInner(h.j).find(k=>G.dist[k]>=0&&walk(k)&&free('hd'+k,1));if(s==null)return false;startAct(r,G,'hdance',s,{key:'hd'+s,obj:h.j,dur:KINODUR});return true}
const hapFace=(r,j)=>{r.face=j%W+.5>=r.x?1:-1};
ACT.hkabu={start(r,a){const h=hapNow('kabu');if(!h||h.ph==='end')return false;hapFace(r,a.obj);r.bubble=''},
  tick(r,a){const h=hapNow('kabu');if(!h)return;if(h.ph==='wait'){const here=S.res.filter(q=>q.act&&q.act.type==='hkabu'&&q.act.stage==='do'),need=Math.min(KABUMAX,S.res.filter(q=>!q.hidden).length);if(here.length>=need){h.ph='pull';h.p0=S.t;HAPFX={k:'pull',t0:performance.now()};for(const q of here)addFloat(q.x,q.y-1.6,'せーの！','#fff3b0');sfxAt('bush',r.x,r.y)}}
    else if(h.ph==='pull'&&S.t-h.p0>=KABUPULL)hapPull();},
  done(r,a){const h=hapNow('kabu');return !h||h.ph==='end'||h.ph==='pop'&&S.t-h.p1>=KABUFALL},
  end(r,a){const h=hapNow('kabu');if(h&&h.ph==='pop'){JUMP.set(r,performance.now());if(S.res.every(q=>!(q.act&&q.act.type==='hkabu')||q===r))h.ph='end'}}};
function hapPull(){const h=hapNow('kabu');if(!h||h.ph!=='pull')return;const j=h.j,d=S.dyn[j],P=S.res.filter(q=>q.act&&q.act.type==='hkabu'&&q.act.stage==='do');h.ph='pop';h.p1=S.t;
  const k=h.crop&&FOODS[h.crop]?h.crop:'mugi';if(d){d.g=0;d.sown=false;d.crop=null;d.fb=0;delete d.ts;delete d.dry;delete d.stolen}if(CROPS[k])S.cseed[k]=cseed(k)+1;
  let left=KABUN;P.forEach((q,i)=>{const n=Math.min(Math.ceil(left/(P.length-i)),roomN(q));if(n>0){addCarry(q,k,n);left-=n}});if(left>0)dropAt(j%W+.5,((j/W)|0)+.5,'food:'+k,left);
  HAPFX={k:'pop',t0:performance.now(),j,crop:k};for(const q of P){JUMP.set(q,performance.now());addFloat(q.x,q.y-1.6,'ぬけた！','#fff3b0')}
  sfxAt('harvdone',j%W+.5,(j/W)|0);if(typeof juiceBreak==='function')juiceBreak(j,'crop',P[0]);if(typeof shakeScreen==='function')shakeScreen('s');if(typeof juiceCheer==='function')juiceCheer('hap');
  toast('大きな'+FOODS[k].name+'がぬけた：'+FOODS[k].name+'×'+KABUN,'good');memo('grass','大きな'+FOODS[k].name+'を、みんなでぬいた');logEv('大きな作物をぬいた');dirty=true}
ACT.hhina={start(r,a){const h=hapNow('hina');if(!h||h.ph!=='wait')return false;hapFace(r,a.obj);r.bubble='❗'},done:(r,a)=>a.t>=2||!hapNow('hina')||hapNow('hina').ph!=='wait',
  end(r,a){const h=hapNow('hina');if(!h||h.ph!=='wait'||a.t<2)return;h.ph='held';h.who=r.id;sfxAt('good',r.x,r.y);addFloat(r.x,r.y-1.8,'よしよし','#fff3b0');dirty=true}};
ACT.hnest={start(r,a){const h=hapNow('hina');if(!h||h.ph!=='held'||h.who!==r.id)return false;hapFace(r,a.obj);r.bubble=''},done:(r,a)=>a.t>=3||!hapNow('hina')||hapNow('hina').ph!=='held',
  end(r,a){const h=hapNow('hina');if(!h||h.ph!=='held'||a.t<3)return;h.ph='nest';h.who=null;JUMP.set(r,performance.now());addFloat(r.x,r.y-1.8,'おうちだよ','#fff3b0');sfxAt('good',r.x,r.y);toast(r.name+'が、ヒナを木へとどけた','good');memo('heart','まいごのヒナを、木へとどけた');logEv('まいごのヒナをとどけた');dirty=true}};
ACT.hkin={start(r,a){const h=hapNow('kin');if(!h||h.ph==='end'||!hapTreeOf(a.obj))return false;hapFace(r,a.obj);r.bubble='🧺';sfxAt('bush',r.x,r.y)},tick(r,a,dt){if(typeof work==='function')work(r,dt)},done:(r,a)=>a.t>=KINT||!hapNow('kin')||hapNow('kin').ph==='end',
  end(r,a){const h=hapNow('kin');if(!h||h.ph==='end'||a.t<KINT)return;h.ph='end';const j=a.obj,n=Math.min(KINAPPLE,roomN(r));if(n>0)addCarry(r,'apple',n);if(KINAPPLE>n)dropAt(r.x,r.y,'food:apple',KINAPPLE-n);
    let gt='';if(Math.random()<KINGIFT&&typeof GIFTDROP!=='undefined'&&GIFTDROP.length){const g=pick(GIFTDROP);if(!(itemBoxOK()&&addItem(r,g,1)))giveItem(g,1);gt='・'+BL[g].name}
    sfxAt('harvdone',r.x,r.y);if(typeof juiceGlowAt==='function')juiceGlowAt(j%W+.5,((j/W)|0)+.2,gt?2:1);if(typeof juiceBreak==='function')juiceBreak(j,'crop',r);JUMP.set(r,performance.now());
    toast(r.name+'が、きんいろの実をとった：りんご×'+KINAPPLE+gt,'good');memo('apple','きんいろの実をとった');logEv('きんいろの実をとった');dirty=true}};
ACT.hdance={start(r,a){const h=hapNow('kino');if(!h||h.ph!=='on')return false;r.bubble='🎵'},done:(r,a)=>a.t>=a.dur||!hapNow('kino')||hapNow('kino').ph!=='on',
  end(r,a){const h=hapNow('kino');if(!h||a.t<a.dur)return;h.dn[r.id]=1;funAdd(r,KINOFUN,'hap');addFloat(r.x,r.y-1.6,'たのしい！','#ffd6f0');sfxAt('good',r.x,r.y);dirty=true}};
Object.assign(ACT_LBL,{hkabu:'大きな作物をひっぱる',hhina:'ヒナをむかえに行く',hnest:'ヒナを木へとどける',hkin:'きんいろの実をとる',hdance:'きのこの輪でおどる'});
if(typeof FUNW!=='undefined')FUNW.hap='きのこの輪でおどった';
function hapAnim(r){const t=r.act&&r.act.type;if(t==='hkabu'){const h=hapNow('kabu');return h&&h.ph==='pull'?'weed':h&&h.ph==='pop'?'sitfront':'talkthink'}if(t==='hhina')return'pickdrop';if(t==='hnest')return'raise';if(t==='hkin')return'pluck';if(t==='hdance')return'dance';return''}
/* ---- 1秒に1回：時間で、すすめる・おわらせる ---- */
function hapTick(){const h=hapNow();if(S&&S.hap&&!h){S.hap=null;return}if(!h||h.ph==='end')return;const hr=hour(),now=performance.now();
  if(h.k==='kabu'){const d=S.dyn[h.j],on=S.res.some(q=>q.act&&q.act.type==='hkabu');if(h.ph==='pop'&&!on){h.ph='end';return}if(h.ph==='pull'&&!on)h.ph='wait';if(h.ph==='wait'&&(S.obj[h.j]!=='farm'||!d||d.g<100||hr>=HAPEND||isNight())){if(hr>=HAPEND||isNight())toast('大きな'+hapCropName()+'は、ふつうの大きさにもどった');h.ph='end';dirty=true}return}
  if(h.k==='kin'){if(!hapTreeOf(h.j)){h.ph='end';return}if(hr>=HAPEND||isNight()){h.ph='end';HAPFX={k:'fall',t0:now,j:h.j};toast('きんいろの実は、おちて消えてしまった');dirty=true}return}
  if(h.k==='hina'){if(h.ph==='held'&&!S.res.some(q=>q.id===h.who&&!q.hidden)){h.ph='wait';h.who=null}
    if(h.ph==='nest'&&hr>=HINAPAR){h.ph='par';HAPFX={k:'par',t0:now,j:h.tj};return}
    if(h.ph==='par'&&HAPFX&&HAPFX.k==='par'&&now-HAPFX.t0>=2600){const x=h.tj%W+.5,y=((h.tj/W)|0)+.5;dropAt(x,y,'food:berry',HINAFOOD);const fl=FLOWERS2.filter(f=>stageItemOK(f));if(fl.length)for(let i=0;i<HINASEED;i++)dropAt(x,y,pick(fl),1);
      h.ph='end';HAPFX={k:'fly',t0:now,j:h.tj};sfxAt('good',x,y);toast('親鳥が来て、お礼をおいていった','good');memo('heart','ヒナの親鳥が、お礼をおいていった');dirty=true;return}
    if(h.ph==='par'&&(!HAPFX||HAPFX.k!=='par'))HAPFX={k:'par',t0:now,j:h.tj};
    if((h.ph==='wait'||h.ph==='held')&&(hr>=HAPEND||isNight())){let j=h.j;if(h.ph==='held'){const r=S.res.find(q=>q.id===h.who);if(r){j=(r.y|0)*W+(r.x|0);if(r.act&&(r.act.type==='hnest'||r.act.type==='hhina'))endAct(r),r.act=null}}h.ph='end';h.j=j;HAPFX={k:'bye',t0:now,j};toast('ヒナは、親鳥といっしょに帰っていった');dirty=true}
    return}
  if(h.k==='kino'&&(hr>=KINOEND||isNight())){h.ph='end';const R=hapRing(h.j).filter(k=>!S.obj[k]&&walk(k));if(!S.drops)S.drops=[];for(let i=0;i<KINON&&R.length;i++){const k=R.splice(Math.floor(Math.random()*R.length),1)[0];S.drops.push({x:k%W,y:(k/W)|0,id:'food:kinoko',n:1})}toast('きのこの輪がきえて、きのこがのこった','good');dirty=true}}
/* ---- 絵（コードのドット。1ドット2点） ---- */
const HAPD=2,HAPBODY={imo:['#b8805e','#8f5f45'],tomato:['#a8d880','#7fb35c'],mugi:['#ecc86a','#c99e44']};
function hapPx(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w*HAPD,h*HAPD)}
function hapDrawBig(c,px,fy,k,now,wob){/* 大きな作物：根もとが土にうまった、まるい実と、上の葉 */const B=HAPBODY[k]||['#f3ead6','#d7c8a6'],L='#79b85a',LD='#5a9440',ox=px+wob,top=fy-30;
  for(const[dx,h]of[[-6,7],[-3,9],[0,10],[3,8],[6,6]]){hapPx(c,ox+dx*HAPD-2,top-h*HAPD,2,h,L);hapPx(c,ox+dx*HAPD,top-h*HAPD+4,1,h-2,LD)}
  const R=[[3,6],[2,8],[1,10],[0,11],[0,11],[0,11],[1,10],[2,8]];R.forEach(([s,n],i)=>{hapPx(c,ox-(n)*HAPD,top+i*2*HAPD-4,n*2,2,B[0]);hapPx(c,ox+(n-2)*HAPD,top+i*2*HAPD-4,2,2,B[1])});
  hapPx(c,ox-8*HAPD,top+4,3,2,'#fffaf0');hapPx(c,ox-12,fy-2,12,2,'#8a6a48')}
function hapDrawChick(c,x,y,now,ph){/* ヒナ：きいろい小さな鳥 */const b=Math.round(Math.abs(Math.sin(now/180+ph))*2)*HAPD/2;y-=b;
  hapPx(c,x-6,y-10,6,5,'#f7dc6a');hapPx(c,x-4,y-12,4,1,'#f7dc6a');hapPx(c,x-6,y-4,6,1,'#e2b94a');hapPx(c,x+2,y-8,1,1,'#4b3a2e');hapPx(c,x+6,y-6,2,1,'#f09a4a');hapPx(c,x-8,y-6,1,2,'#e2b94a')}
function hapBird(c,x,y,now){const C=window.CHIPS||{},ch=C[Math.floor(now/120)%2?'critbird#f0':'critbird#f1']||C['critbird#0'];if(ch&&typeof drawChip==='function')drawChip(c,ch,'critbird',x-TS/2,y-TS/2,now)}
function hapDraw(add,vis,c,now){const h=hapNow();if(!h)return;const lf=j=>S.hi?liftOf(j):0;
  if(h.k==='kabu'&&(h.ph==='wait'||h.ph==='pull')){const j=h.j,o={x:j%W+.5,y:((j/W)|0)+.9};if(vis(o)){const px=o.x*TS,fy=((j/W)|0)*TS+TS-lf(j),wob=h.ph==='pull'?Math.round(Math.sin(now/70))*HAPD:0;add(o.y,1,[px-26,fy-60,px+26,fy+4],()=>hapDrawBig(c,px,fy,h.crop,now,wob),j)}}
  if(h.k==='hina'){if(h.ph==='wait'){const j=h.j,o={x:j%W+.5,y:((j/W)|0)+.8};if(vis(o)){const px=o.x*TS,fy=o.y*TS-lf(j);add(o.y,2,[px-10,fy-16,px+10,fy+2],()=>hapDrawChick(c,px,fy,now,0),j)}}
    else if(h.ph==='held'){const r=S.res.find(q=>q.id===h.who);if(r&&vis(r)){add(r.y+.002,2,null,()=>liftDraw(typeof uLift==='function'?uLift(r):0,()=>hapDrawChick(c,r.x*TS,r.y*TS-28,now,1)),(r.y|0)*W+(r.x|0))}}
    else if(h.ph==='nest'||h.ph==='par'){const j=h.tj,o={x:j%W+.5,y:((j/W)|0)+1};if(vis(o)){const px=o.x*TS+4,fy=((j/W)|0)*TS-14-lf(j);add(o.y+.05,2,null,()=>{hapPx(c,px-10,fy-2,10,2,'#9b7350');hapDrawChick(c,px,fy-1,now,2)},j)}}}
  if(h.k==='kino'&&h.ph==='on'){for(const k of hapRing(h.j)){if(S.obj[k])continue;const o={x:k%W+.5,y:((k/W)|0)+.5};if(!vis(o))continue;const C=window.CHIPS||{},ch=C['kinoko#'+(hash(k)*3|0)]||C.kinoko;if(!ch)continue;const x=(k%W)*TS,y=((k/W)|0)*TS-lf(k);add(o.y+.3,1,null,()=>drawChip(c,ch,'kinoko',x,y,now,k),k)}}
  const F=HAPFX;if(F){const dt=now-F.t0;if(dt>4000){HAPFX=null;return}const j=F.j;if(j==null)return;const tx=(j%W+.5)*TS,ty=((j/W)|0)*TS-lf(j);
    if(F.k==='par'){const p=Math.min(1,dt/2400),x=tx-160*(1-p),y=ty-40-90*(1-p)*(1-p);add(99999,3,null,()=>hapBird(c,x,y,now),j)}
    else if(F.k==='fly'||F.k==='bye'){const p=Math.min(1,dt/3000),x=tx+180*p,y=ty-30-120*p;add(99999,3,null,()=>{c.save();c.globalAlpha=1-Math.max(0,p-.7)/.3;hapBird(c,x,y,now);hapDrawChick(c,x+14,y+10,now,3);c.restore()},j)}
    else if(F.k==='fall'){const p=Math.min(1,dt/1600);add(((j/W)|0)+1.1,2,null,()=>{c.save();c.globalAlpha=1-p;for(const[cx,cy]of HAPGOLD){hapPx(c,(j%W)*TS+cx-2,((j/W)|0)*TS-lf(j)+cy+p*30,2,2,'#f5c542')}c.restore()},j)}}}
const HAPGOLD=[[2,-30],[26,-38],[40,-14],[12,-8],[-12,-16]];
function hapGoldOn(c,x,y,i,now){/* きんいろの実：木の絵に、金の実のドットをのせる（drawObj から） */const h=hapNow('kin');if(!h||h.ph==='end'||h.j!==i)return;
  HAPGOLD.forEach(([cx,cy],n)=>{const X=x+cx-3,Y=y+cy-3;hapPx(c,X,Y,3,3,'#f5c542');hapPx(c,X,Y+4,3,1,'#d39a26');hapPx(c,X,Y,1,1,'#fff6c2');if(Math.sin(now/300+n*1.7)>.85){hapPx(c,X+6,Y-4,1,1,'#fffbe0');hapPx(c,X+4,Y-6,1,1,'#fff6c2');hapPx(c,X+8,Y-6,1,1,'#fff6c2');hapPx(c,X+6,Y-8,1,1,'#fff6c2')}})}
