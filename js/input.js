'use strict';

/* ---------- カメラ・入力 ---------- */
const ZMAX=3,ZRUB=.1,ZBACKS=.2;let ZBACK=null;/* ズームのはしの手ごたえ（下の zoomRubber） */
function minZ(){return Math.max(.3,Math.min(VW/((W+H)*IQW/2),VH/((W+H)*IQH/2)))}
function clampCam(look){if(typeof caveOn==='function'&&caveOn())return caveClamp(look);/* 洞窟のあいだは、カメラはパーティを追う（cave.js） */
  {const rb=ZBACK||gest&&gest.type==='pinch';cam.z=clamp(cam.z,minZ()*(rb?1-ZRUB:1),rb?ZMAX*(1+ZRUB):ZMAX)}/* ピンチ中・もどるあいだだけ、はしをこえてよい */
  const vw=VW/cam.z,vh=VH/cam.z;
  /* 画面のまん中のせかいの点を、マップの中にとどめる（オオカゲの登場のあいだは、南のはしのオオカゲも画面のまん中に） */const cx=clamp(camCX(),0,W*TS),cy=clamp(camCY(),0,H*TS+(performance.now()<(window.BOSSCAM||0)?4*TS:0));cam.x=cx-vw/2;cam.y=cy-vh/2;
}
function resize(){dpr=Math.min(window.devicePixelRatio||1,1.25);/* 発熱対策で解像度をおさえる */VW=innerWidth;VH=innerHeight;cv.width=VW*dpr|0;cv.height=VH*dpr|0;cv.style.width=VW+'px';cv.style.height=VH+'px';clampCam();sacredResizeShot()}
function panTo(wx,wy){if(camAnim&&camAnim.done)return;/* 演出のカメラ（おわりの処理つき）は、上書きしない */camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:wx,ty:wy,t:0,dur:.6}}/* 話しかけた子を、画面の中央へ */
function centerOn(wx,wy){cam.x=wx-VW/cam.z/2;cam.y=wy-VH/cam.z/2;clampCam()}
const homeZ=()=>Math.max(minZ(),Math.min(1.8,VW/(13*TS)*.82));/* ひし形のマスがいままでの四角のマスと同じくらいの数だけ見える大きさ（ひし形1つの広さは、四角の1.5倍） */
const toWorld=(sx,sy)=>s2w(sx,sy);
/* カメラをうごかす */
function camPan(cx0,cy0,dx,dy){cam.x=cx0;cam.y=cy0;camShift(dx,dy)}
function camKeep(w,sx,sy){camAt(w.x,w.y,sx,sy)}/* せかいの点 w を、画面の (sx,sy) に */

let mode='look',sel='farm',selStamp=null;
let CVR=null,CVRT=0;function cvRect(){const t=performance.now();if(!CVR||t-CVRT>250){CVR=cv.getBoundingClientRect();CVRT=t}return CVR}/* 画面がずれた（文字を打ったあとページがスクロールしたまま など）ときも、キャンバスの上の場所でタップをはかる */
const cX=e=>e.clientX-cvRect().left,cY=e=>e.clientY-cvRect().top;
window.addEventListener('scroll',()=>{CVR=null;const a=document.activeElement;if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName))return;if(scrollX||scrollY)scrollTo(0,0)},{passive:true});/* ページがずれたままにしない */
window.addEventListener('resize',()=>{CVR=null});document.addEventListener('focusout',()=>setTimeout(()=>{CVR=null;if(scrollX||scrollY)scrollTo(0,0)},120));
const ptrs=new Map();let gest=null,GLHOLD=0;
let GLRING=null;function glRing(x,y){glRingOff();const d=document.createElement('div');d.className='glring';d.style.left=x+'px';d.style.top=y+'px';d.style.setProperty('--ms',GLCHARGEMS+'ms');d.addEventListener('animationend',()=>{d.classList.add('full');sfx('chime')});document.body.appendChild(d);GLRING=d}/* ためている輪：2秒でいっぱいになり、光る（見た目のみ。はなしたときの長さで決まる） */
function glRingOff(){if(GLRING){GLRING.remove();GLRING=null}}

cv.addEventListener('pointerdown',e=>{
  if(!started)return;if(!(camAnim&&camAnim.done))camAnim=null;/* 演出のカメラ（おわりの処理つき）は、さわっても止めない（止めると、おわりの処理がよばれず、ゲームが止まったままになる） */
  cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:cX(e),y:cY(e)});
  if(ptrs.size===1){gest={type:'maybe',sx:cX(e),sy:cY(e),cx:cam.x,cy:cam.y};if(FLING&&Math.hypot(FLING.vx,FLING.vy)>FLINGSTOP)gest.stopTap=1;/* すべっている地図をおさえて止めたタップは、タップにしない */gest.grab=grabAt(cX(e),cY(e));FLING=null;if(LIGHTARM&&!(typeof caveOn==='function'&&caveOn())){gest.glT=performance.now();glRing(e.clientX,e.clientY)}/* 守りの光をえらんでいるとき：おしつづけて、ためる */}
  else if(ptrs.size===2){const[p,q]=[...ptrs.values()];gest={type:'pinch',d:Math.hypot(p.x-q.x,p.y-q.y),z:cam.z,mid:toWorld((p.x+q.x)/2,(p.y+q.y)/2)};if(selRect&&!pending)selRect=null}
  if(ptrs.size===1&&mode==='remove'&&!LIGHTARM&&!LEAFARM&&!AREAARM)pickDown(cX(e),cY(e));else pickCancel();/* こわす：ブロック・地面は長おしでこわす（build.js） */
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:cX(e),y:cY(e)});if(!gest)return;
  if(gest.type==='pinch'&&ptrs.size>=2){const[p,q]=[...ptrs.values()];const d=Math.hypot(p.x-q.x,p.y-q.y);cam.z=zoomRubber(gest.z*d/gest.d);const mx=(p.x+q.x)/2,my=(p.y+q.y)/2;gest.mx=mx;gest.my=my;camKeep(gest.mid,mx,my);clampCam(1);return}
  const dx=cX(e)-gest.sx,dy=cY(e)-gest.sy;
  if(gest.type==='maybe'&&Math.hypot(dx,dy)>8){
    const k=BL[sel]&&BL[sel].kind;
    if(gest.grab)gest.type='grab';/* 置く前の家具の絵をつまんで、ずらす */
    else if(LEAFARM){gest.type='leaf';LEAFDRAG=[];const w0=tapW(gest.sx,gest.sy);leafAdd(Math.floor(w0.y/TS)*W+Math.floor(w0.x/TS))}/* 葉のかべ：なぞる（defense.js） */
    else if(mode==='bulk'&&!selStamp&&S.bulk&&(k==='block'&&S.unlocked[sel]||k==='plant'&&usable(sel)||sel==='spike'&&usable(sel))){let w=tapW(gest.sx,gest.sy);gest.type='rect';gest.a={x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)};$('#confirm').hidden=true;pending=null}
    else{gest.type='pan';pickCancel();glRingOff()}}
  if(gest.type==='grab'){grabMove(cX(e),cY(e));return}
  if(gest.type==='pan'){if(FOLLOW)followEnd();/* 見守るは、ドラッグでおわる */camPan(gest.cx,gest.cy,dx,dy);clampCam(1);const t=performance.now(),V=gest.vs||(gest.vs=[]);V.push({t,x:cX(e),y:cY(e)});while(V.length>2&&t-V[0].t>FLINGWIN)V.shift()}/* 指の速さ（はなしたときの慣性） */
  if(gest.type==='leaf'){const w=tapW(cX(e),cY(e));leafAdd(Math.floor(w.y/TS)*W+Math.floor(w.x/TS));return}
  if(gest.type==='rect'){const w=tapW(cX(e),cY(e));selRect={a:gest.a,b:{x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)}}}
});
/* 地図の慣性：はなしたときの指の速さで、すこしすべってから止まる（画面の点／秒。FLINGK は1秒でのこる速さのわりあいの対数） */
let FLING=null;const FLINGWIN=90,FLINGMIN=180,FLINGMAX=2600,FLINGK=5.5,FLINGSTOP=40;
function flingStart(V){FLING=null;if(!V||V.length<2||typeof uiReduced==='function'&&uiReduced())return;const a=V[0],b=V[V.length-1],dt=b.t-a.t;if(dt<16||performance.now()-b.t>60)return;/* 止めてからはなしたら、すべらない */let vx=(b.x-a.x)/dt*1000,vy=(b.y-a.y)/dt*1000;const v=Math.hypot(vx,vy);if(v<FLINGMIN)return;if(v>FLINGMAX){vx*=FLINGMAX/v;vy*=FLINGMAX/v}FLING={vx,vy}}
function flingTick(rdt){zoomBackTick(rdt);const F=FLING;if(!F)return;if(!S||camAnim||FOLLOW||ptrs.size){FLING=null;return}const x0=cam.x,y0=cam.y;camPan(cam.x,cam.y,F.vx*rdt,F.vy*rdt);const ex=cam.x,ey=cam.y;clampCam(1);if(Math.abs(cam.x-ex)>.01||Math.abs(cam.y-ey)>.01){FLING=null;return}/* はしについたら、止める */const k=Math.exp(-FLINGK*rdt);F.vx*=k;F.vy*=k;if(Math.hypot(F.vx,F.vy)<FLINGSTOP||cam.x===x0&&cam.y===y0)FLING=null}
/* ズームのはし：いちばん大きく・小さくしたあとも、少しだけ（ZRUB）手ごたえをのこしてのび、はなすと ZBACKS 秒でもどる */
function zoomRubber(z){const mn=minZ();if(z>ZMAX)return ZMAX*(1+ZRUB*(1-1/(1+Math.log(z/ZMAX)*3)));if(z<mn)return mn*(1-ZRUB*(1-1/(1+Math.log(mn/z)*3)));return z}
function zoomSettle(mx,my){const mn=minZ(),to=clamp(cam.z,mn,ZMAX);if(Math.abs(to-cam.z)<1e-4){clampCam(1);return}if(mx==null){mx=VW/2;my=VH/2}if(typeof uiReduced==='function'&&uiReduced()){const w=toWorld(mx,my);cam.z=to;camKeep(w,mx,my);clampCam(1);return}ZBACK={fz:cam.z,tz:to,t:0,mx,my,w:toWorld(mx,my)}}
function zoomBackTick(rdt){const B=ZBACK;if(!B)return;if(!S||camAnim||ptrs.size>=2){ZBACK=null;return}B.t+=rdt;const k=Math.min(1,B.t/ZBACKS),e=1-Math.pow(1-k,3);cam.z=B.fz+(B.tz-B.fz)*e;camKeep(B.w,B.mx,B.my);clampCam(1);if(k>=1)ZBACK=null}
/* 置く前の家具の絵（pending）を、指でつまんでマスごとにずらす */
function grabTile(sx,sy){const w=tapW(sx,sy);return{x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)}}
function grabAt(sx,sy){const p=pending;if(mode!=='build'||!p||p.kind!=='one'||p.id==='statue')return null;const z=szR(p.id,PLROTS[p.id]||0)||[1,1],t=grabTile(sx,sy),ox=t.x-p.x,oy=t.y-p.y;return ox>=0&&oy>=0&&ox<z[0]&&oy<z[1]?{ox,oy}:null}
function grabMove(sx,sy){const p=pending,g=gest&&gest.grab;if(!p||p.kind!=='one'||!g)return;const t=grabTile(sx,sy),nx=clamp(t.x-g.ox,0,W-1),ny=clamp(t.y-g.oy,0,H-1);if(nx===p.x&&ny===p.y)return;p.x=nx;p.y=ny;p.ok=canPlace(p.id,nx,ny,true);confirmOne();sfx('notch');dirty=true}
function endPtr(e){
  if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(pickEnd()&&gest&&gest.type==='maybe'){gest=null;return}/* 長おしでこわしていたら、タップにしない */
  glRingOff();if(gest&&gest.type==='maybe'&&e.type==='pointerup'){if(!gest.stopTap){GLHOLD=gest.glT?performance.now()-gest.glT:0;try{onTap(cX(e),cY(e))}finally{GLHOLD=0}}}
  else if(gest&&gest.type==='pan'&&e.type==='pointerup'&&!ptrs.size)flingStart(gest.vs);
  else if(gest&&gest.type==='rect'&&selRect)askBulk(sel,rectCells(selRect.a,selRect.b));
  else if(gest&&gest.type==='leaf'){const c=LEAFDRAG;LEAFDRAG=null;leafPlace(c)}
  if(gest&&gest.type==='pinch')zoomSettle(gest.mx,gest.my);/* はしをこえてピンチしたら、もどる */
  if(ptrs.size===1){const p=[...ptrs.values()][0];gest={type:'pan',sx:p.x,sy:p.y,cx:cam.x,cy:cam.y}}else if(!ptrs.size)gest=null;
}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();if(!started)return;FLING=null;const w=toWorld(cX(e),cY(e));cam.z=clamp(cam.z*(e.deltaY<0?1.12:.89),minZ(),3);camKeep(w,cX(e),cY(e));clampCam(1)},{passive:false});

const bubHit=(r,w)=>r.bubX!=null&&Math.abs(r.bubX-w.x)<33&&Math.abs(r.bubY-w.y)<33;/* 描いた吹き出しをタップ（遊具の上で遊ぶ子は、描く場所がr.x,r.yとずれる） */
const tapUp=r=>r.act&&r.act.type==='watchpost'&&r.act.stage==='do'?WPLIFT*Math.min(1,r.act.cl||0)/LIFT*IQD/TS:0,tapX=r=>r.x-tapUp(r),tapY=r=>r.y-tapUp(r);/* クォータービュー：上に描いた高さぶん、せかいの点を左上へ（iso.js の IQD） *//* 見張り台の上の子は、上に描いた所でタップする（見張り台の足もとをタップしても、子をえらばない） */
/* タップした画面の点の、見えている（高い段もふくめた）マスのせかいの点 */
function tapW(sx,sy){return liftW(toWorld(sx,sy))}
const ENBOX={};/* コワイノの絵のはば（向き・形ごとに1回はかって、数字だけとっておく） */
function enemyBox(e){const D=EN[e.type],z=D.size*2,v=EV.get(e)||{f:1,back:false},key=e.type+(v.back?'b':'f')+v.f+z;let b=ENBOX[key];
  if(!b){const R=36*z,ww=Math.ceil(R*2),hh=Math.ceil(R*2.2),c=document.createElement('canvas');c.width=ww;c.height=hh;const g=c.getContext('2d');/* 描くときと同じ場所（px=R, py+8=R*1.7） */
    drawShade(g,e.type,R,R*1.7,.27*z,v.f,{dot:1,t:0,back:v.back,walk:false,flash:false,hurt:null,atk:0});
    const d=g.getImageData(0,0,ww,hh).data;let x0=ww,y0=hh,x1=-1,y1=-1;for(let y=0;y<hh;y++)for(let x=0;x<ww;x++)if(d[(y*ww+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    c.width=c.height=0;b=x1<0?{l:-R*.6,r:R*.6,t:-R*1.5,b:R*.3,ok:0}:{l:x0-R,r:x1+1-R,t:y0-R*1.7,b:y1+1-R*1.7,ok:1};if(b.ok)ENBOX[key]=b}/* 絵がまだ読みこみ中なら、とっておかない */
  return b}
function enemyAtTap(wx,wy){/* 守りの光：コワイノの絵が描いてある所ぜんぶ（＋指のぶん）をあたりにする。重なったら手前（下）の子、同じならタップに近い子 */
  const M=6/Math.min(1,cam.z)+2;let best=null,bs=-1e9;
  const ISO=TAPS;for(const e of S.enemies){if(!e.spawned||e.dead)continue;const b=enemyBox(e),px=e.x*TS,py=e.y*TS+8-(ISO?uLift(e)*IQL/LIFT/IQSY:uLift(e));if(ISO){const q=tapAt(ptFoot(px,e.y*TS));wx=q.x;wy=q.y}/* クォータービュー：その子を立てて描いた絵の上の点 */
    if(wx<px+b.l-M||wx>px+b.r+M||wy<py+b.t-M||wy>py+b.b+M)continue;
    const sc=e.y*1000-Math.hypot(wx-px,wy-(py+(b.t+b.b)/2))*.01;if(sc>bs){bs=sc;best=e}}
  return best}
function sacredTapHit(b,px,py){if(TAPS){const n=typeof sacredSpan==='function'?sacredSpan():4,q=tapAt(objFoot(b%W,(b/W)|0,n,n,b));px=q.x/TS;py=q.y/TS}/* クォータービュー：立てて描いた切り株の絵の上の点 *//* 御神木・切り株の、タップをひろう所（切り株の絵のわく。育った木は根もと）。b は左上のマス。根もと（storyTreeX・storyTreeY+26）から、切り株の絵のわく（左35・右40・上79・下2 の点） */const dx=px*TS-storyTreeX(b)*TS,dy=py*TS-(storyTreeY(b)*TS+26);return dx>=-35&&dx<40&&dy>=-79&&dy<2||typeof omoiBubHit==='function'&&omoiBubHit(px,py)}/* 青いふきだしも */
function sacredTreeTap(j){/* 御神木をタップ：かけらの光をとどける・目標のじょうけんを見る */
  const av=(S.shards||0)-(S.setSh||0);
  if(av>0&&(S.setSh||0)>=2){
    if(isNight())return toast('最後の光を届けるのは、朝になってから');
    if(!S.flags.finalWon)return toast('まず、御神木に集まる影を追いはらおう');
    if(!S.sev?.e09)return toast('先に、最後のかけらを迎えるお話を聞こう');
    if(!clearReady())return toast('ヌシのかけらが足りません','warn');
  }
  omoiSeed();if(omoiWait()&&omoiScene(j))return;/* なかよしの2人が、御神木に会いにくる（青いふきだしが出ているときは、かけらより先） */
  if(av>0&&shardWarnAsk(j))return;/* 2つめをささげる前に、影がやってくることをたしかめる */
  if(av>0)return sacredOfferShard(j,()=>{S.setSh=(S.setSh||0)+1;sfx('shard');burst(j,'furn','none');SPOT_POPS.push({state:S,shard:S.setSh,after:S.setSh>=3?()=>scheduleGrassReunion():null});/* 大きな知らせ。最後のかけらは、知らせをとじてから再会へ */logEv('かけらの光を御神木へ届けた');dirty=true;checkQuest();});/* かけらは、フタバが御神木へ歩いていって、ささげる */
  if((S.setSh||0)>=3){const reason=grassReunionBlockReason();if(reason)return toast(reason);scheduleGrassReunion();return;}
  return openSheet('clear');
}
/* 「みる」でタップした物の音：材質で分ける（木・石・金物・布・植物・畑や地面・水。御神木と切り株は太い木の音、神殿と台座は石） */
let TAPPEND=0;const TAPCLOTH=new Set(['nuno','wool','shina','kasa','kuru','chiri','funba','nabiki','houki','kumowata','hane','ashi','gama','yotsuyu','kagekusa']),TAPMETAL=new Set(['can','icopper','iiron','isilver','igold']),TAPHOLY=new Set(['statue','statueb','altar','tower']),TAPNATW=new Set(['tree','ntree','deadtree','fruit','bamboo','takenoko']),TAPNATS=new Set(['rock','boulder','volcano','crack']);
function tapMatOf(o){if(o==='tower')return WD===KUSA?'tsacred':'tstone';/* 草原は御神木（木）、火山は守護の台座（石） */if(TAPHOLY.has(o))return 'tstone';if(TAPNATS.has(o))return 'tstone';if(TAPNATW.has(o))return 'twood';const b=BL[o];if(!b)return null;if(b.kind==='plant'||o==='berry')return 'tgrass';if(o==='farm'||o==='plot'||o==='sprout')return 'tsoil';
  let w=0,st=0,cl=0,me=0;for(const k in b.mat||{}){const n=b.mat[k];if(TAPCLOTH.has(k))cl+=n;else if(TAPMETAL.has(k))me+=n;else if(k==='stone')st+=n;else w+=n}
  if(b.mat&&b.mat.nuno||b.mat&&b.mat.wool||cl>w+st+me)return 'tcloth';if(me>w&&me>=st)return 'tcan';if(st>w)return 'tstone';return 'twood'}
function tapSnd(tx,ty){if(tx<0||ty<0||tx>=W||ty>=H)return;const g=ty*W+tx,j=anc(g),o=S.obj[j];if(WEEDS.has(o)||o==='kagenest'||VEINS[o]&&VOLK()||(S.drops||[]).some(q=>q.y*W+q.x===g&&q.id!=='shard'))return;/* 草・落とし物・鉱脈・かげの巣は、それぞれの音 */
  let k=o?tapMatOf(o):null;if(!o){const f=S.floor[g];if(RUGC.has(g))k='tcloth';else if(skyJ(g))k='tcloth';else if(S.ground[g]===1||S.ground[g]===2)k='twater';else k=footMat(tx+.5,ty+.5)||'fsoil'}/* 地面・床：その場所の足音の録音 */
  if(!k)return;const t0=performance.now();TAPPEND=t0;setTimeout(()=>{if(TAPPEND===t0){TAPPEND=0;if(TAPMAT<t0)sfx(k)}},0)}/* ほかの物の音（神殿・宝箱など）が同じタップで鳴ったら、そちらだけ */
function onTap(sx,sy){if(typeof caveOn==='function'&&caveOn())return caveTap(sx,sy);/* 洞窟の探検（cave.js） */if(GIFT_ACTIVE&&camAnim&&camAnim.done)return;if(typeof starTap==='function'&&starTap(sx,sy))return;TAPS={sx,sy,w:toWorld(sx,sy)};if(typeof letterTap==='function'&&letterTap(sx,sy))return;/* とどいた手紙のふうとう *//* 流れ星そのものをタップしたら、おねがい *//* 霧が晴れる・鉱脈が目をさます演出のカメラ中は、タップをうけない */DLGTAP=performance.now();/* タップで始める会話は、またずにすぐ出す */if(mode==='look'&&typeof tapFx==='function')tapFx(sx,sy);/* しらべるでタップしたところに、葉（火山は火の粉）が舞う */
  const w0=toWorld(sx,sy),w=tapW(sx,sy),tx=Math.floor(w.x/TS),ty=Math.floor(w.y/TS);TAPS={sx,sy,w};/* 高い段のマス・物・せいれい・コワイノは上にずらして描くので、タップの場所も高さの分だけ下へもどす */if(mode==='look'&&yamiTap(w0.x/TS,w0.y/TS,tx,ty))return;if(mode==='look'&&typeof ngTap==='function'&&ngTap(tx,ty))return;if(mode==='look'&&typeof hapTap==='function'&&hapTap(tx,ty))return;/* ときどき起きるできごと（happen.js） *//* 夜のたからさがし：光るつぶ（nightglow.js） *//* 闇のステージ：ヨリ・夜の仕事のあと（yami.js） */
  if(AREAARM){AREAARM=false;return areaBlast(w.x/TS,w.y/TS)}
  if(LEAFARM){LEAFDRAG=[];leafAdd(ty*W+tx);const c=LEAFDRAG;LEAFDRAG=null;return leafPlace(c)}/* 葉のかべ：タップは1マス *//* こもれびのまもり：タップした場所のまわり */
  if(LIGHTARM){const ch=GLHOLD>=GLCHARGEMS,en=enemyAtTap(w0.x,w0.y);if(en)return guardLight(en,ch);if(tx>=0&&ty>=0&&tx<W&&ty<H)glCast(tx,ty,null,ch);return}/* 守りの光：えらんでいるあいだにタップした所に落とす（えらんだまま）。コワイノをタップしたら、そのコワイノに。地図のどこでも（範囲のコワイノ・木・岩に当たる）。しらべる・おく・こわすと同時にはしない */
  const si=S.seeds.findIndex(s=>s.x===tx&&s.y===ty);
  if(tx>=0&&ty>=0&&tx<W&&ty<H){const hh=HOUSES.find(h=>h.set.has(ty*W+tx));/* 開けた屋根は、壁をタップするまでそのまま */
    if(hh&&mode!=='look'&&!OPENH.has(hKey(hh))){OPENH.add(hKey(hh));dirty=true;return}}/* 置く・こわすときも、まず家をタップして中を見る */
  if(si>=0){sfx('pick_tsoil');S.seeds.splice(si,1);S.mseed=(S.mseed||0)+1;S.mseedGot=(S.mseedGot||0)+1;addFloat(tx+.5,ty,'ふしぎな種+1','#d8f5c0');burstAt(tx,ty,'plant');toast('ふしぎな種をひろった','good');return}
  if(mode==='look'){
    if(fieldStoryTap(tx,ty,w.x/TS,w.y/TS))return;
    const en=enemyAtTap(w0.x,w0.y);
    if(en){sfx('tfoe');tgtShow(en);/* ねらっている物へ点線（support.js） */return toast(EN[en.type].name+'（体力 '+Math.max(0,Math.ceil(en.hp))+'/'+(en.max||EN[en.type].hp)+'）')}/* 「コワイノ」に守りの光をあてるのは、アイコンをえらんでから。「しらべる」では、名前と体力を出す（何も起きないタップにしない） */
    {const st=festStalls().find(t=>{const q=tapPt(t.x+.5,t.y+.5-4/TS);return Math.abs(q.x/TS-(t.x+.5))<1.3&&q.y/TS>t.y-2.6&&q.y/TS<t.y+1});if(st){sfx('tbell');openSheet('stall',st.x);return}}/* 屋台をタップすると、その屋台の品物 */
    if(typeof visitHere==='function'&&visitHere()){const g=visitor(),q=tapPt(g.x,g.y);if(visitTap(q.x/TS,q.y/TS))return}/* 温泉宿のお客さん */
    const gq=godHere()?tapPt(godX(),godY()):null;if(godHere()&&Math.hypot(gq.x/TS-godX(),gq.y/TS-godY())<1.1){if(TALKW===GOD&&mainStoryBubbleReady())return startTalk();if(SUBW[GOD])return subTalk(SUBW[GOD]);if(S.feat.shop){const ln=pick(S.pt<2?GOD_POOR:GOD_SHOP);return dialog([[GOD,ln]],()=>{openSheet('shop');shopSay=ln;renderSheet()},'交換する')}toast('カミサマ「'+pick(GOD_IDLE)+'」');return}
    if(S.nushi&&(q=>Math.hypot(q.x/TS-S.nushi.x,q.y/TS-(S.nushi.y-.6))<1.4)(tapPt(S.nushi.x,S.nushi.y))){sfx('tbell');return nushiTalk()}/* ヌシ様と話す */
    if(S.cleared){const tw=S.obj.indexOf('tower');if(tw>=0&&(q=>Math.hypot(q.x/TS-storyTreeX(tw),q.y/TS-(storyTreeY(tw)-.4))<1.4)(tapObj(tw))){sfx(WD===KUSA?'tsacred':'tstone');return openSheet('travel')}}/* クリア後は、台座から次の土地へ */
    if(STATUE>=0&&(q=>sumHit(q.x/TS,q.y/TS))(tapObj(STATUE)))return doSummon();
    if(TALKW===GOD&&mainStoryBubbleReady()&&godHere()&&Math.hypot(gq.x/TS-godX(),gq.y/TS-(godY()-1.6))<1.2)return startTalk();
    if(SUBW[GOD]&&godHere()&&Math.hypot(gq.x/TS-godX(),gq.y/TS-(godY()-1.6))<1.2)return subTalk(SUBW[GOD]);
    if(TALKW){const tr=S.res.find(r=>r.name===TALKW&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(tr&&mainStoryBubbleReady(tr)&&(q=>Math.hypot(tapX(tr)-q.x/TS,(tapY(tr)-1)-q.y/TS)<1.4||bubHit(tr,q))(tapPt(tr.x,tr.y))){panTo(tr.x*TS,(tr.y-.7)*TS);return startTalk()}}
    {const tr=S.res.find(r=>SEVW[r.name]&&!r.hidden&&!(r.act&&r.act.type==='sleep')&&(q=>Math.hypot(tapX(r)-q.x/TS,(tapY(r)-1)-q.y/TS)<1.4||bubHit(r,q))(tapPt(r.x,r.y)));if(tr)return sevTalk(SEVW[tr.name])}
    {const tr=S.res.find(r=>SUBW[r.name]&&!r.hidden&&!(r.act&&r.act.type==='sleep')&&(q=>Math.hypot(tapX(r)-q.x/TS,(tapY(r)-1)-q.y/TS)<1.4||bubHit(r,q))(tapPt(r.x,r.y)));if(tr){panTo(tr.x*TS,(tr.y-.7)*TS);return subTalk(SUBW[tr.name])}}
    let best=null,bd=1.1;for(const r of S.res){if(r.hidden&&!peekH(r))continue;const q=tapPt(r.x,r.y),d=Math.hypot(tapX(r)-q.x/TS,(tapY(r)-.5)-q.y/TS);if(d<bd){bd=d;best=r}}
    {const cr=typeof critTap==='function'&&(TAPS?CRIT.map(c=>{const q=tapAt(ptFoot(c.x*TS,c.y*TS));const r=critTap(q.x/TS,q.y/TS);return r&&r.c===c?r:null}).filter(Boolean).sort((a,b)=>a.d-b.d)[0]:critTap(w0.x/TS,w0.y/TS));/* 生き物は critTap が自分で高さ（uLift）をひくので、高さをもどす前の場所 */if(cr&&(!best||cr.d<bd)){critPoke(cr.c,w.x/TS,w.y/TS);return}}/* 小さな生き物：せいれいより近ければ、その場で反応して、図鑑に入る */
    if(best&&best.act&&best.act.type==='outing'&&best.act.stage==='do'&&typeof outingTalk==='function'&&outingTalk(best))return;/* おでかけ中の2人：会話を見る（outing.js） */
    if(best&&best.act&&(best.act.type==='chat'||best.act.type==='rest')&&best.act.stage==='do'&&best.act.topic!=null&&best.act.seen!==best.act.topic){const p=S.res.find(q=>q.id===best.act.partner);if(p){const A=best.act.sub?p:best,B=best.act.sub?best:p;const ti=best.act.topic,C=CHATS[ti];for(const q of [A,B])if(q.act&&q.act.topic===best.act.topic)q.act.seen=best.act.topic;/* 一度見たおしゃべりは、もう一度タップしても出さない（ようすを出す） */return dialog(C.map((l,i)=>{const sp=l[0]?B:A;return [sp.name,((C.el&&!l[0])?l[1]:chatTone(l[1],sp,i)).replace(/@([HMK])/g,(m,c)=>sevName(c)).replace(/@G/g,goneTalkName()||'あの子')]}),()=>{if(C.wave){A.waveU=B.waveU=S.t+4}if(C.mem)bondMemNote(A,B,ti)})}}/* なかよしの雑談は、さいごまで見たら思い出になる（消えたときに話す） *//* おしゃべり中の子をタップすると、会話が見られる */
    if(!best){const an=typeof aniAtTap==='function'&&(TAPS?(S.ani||[]).map(a=>{const q=tapPt(a.x,a.y);return aniAtTap(q.x/TS,q.y/TS)}).find(a=>a):aniAtTap(w.x/TS,w.y/TS));if(an){sfx('tani');return aniPop(an)}}/* 飼う生き物：物のタップの前に、足もとのまわりを見る */
    if(best){if(!S.flags.tapped&&S.flags.tapAsk){S.flags.tapPend=true}voiceHmm(best);if(typeof tapReact==='function')tapReact(best);/* タップした子が、こちらを見て、ぴょん（draw-spirits.js） */{const id=best.id;setTimeout(()=>{if(sheet==null&&S.res.some(q=>q.id===id))openSheet('res',id)},500);return}}/* ぴょんが見えるよう、ステータスの画面は0.5秒おそくひらく（持ち主がえらんだ） */// ステータスを見て閉じたら、会話に進む
    if(tx<0||ty<0||tx>=W||ty>=H)return;
    tapSnd(tx,ty);
    if(RUINT>=0&&S.obj[RUINT]==='statueb'){const q=tapObj(RUINT),px=q.x/TS-RUINT%W,py=q.y/TS-((RUINT/W)|0);if(px>=-.9&&px<1.9&&py>=-2.6&&py<2){templeRuinTap(RUINT);return}}/* こわれた神殿は、絵のどこをタップしても */
    if(typeof mzTap==='function'&&mzTap(tx,ty))return;/* 水のステージ：霧・水門・宝箱・船着き場・水路 */
    if(typeof fogTap==='function'&&fogTap(tx,ty))return;/* 霧の所・霧の中で見つけた物 */
    if(typeof kdTap==='function'&&kdTap(tx,ty))return;/* もりのこだまの見つかる所 */
    {const hw=HOUSES.find(h=>h.set.has(ty*W+tx));if((!hw||OPENH.has(hKey(hw)))&&webTap(tx,ty))return}/* クモの巣：せいれいがそうじする（屋根のある家は、屋根を外してから） */
    {const j=anc(ty*W+tx);if(!isNight()&&godFix(S.obj[j]?j:ty*W+tx))return}/* こわれかけ・こわれた物は、守り神がパワーで直せる */
    {const kg=WD===KUSA&&S.flags.kgMark!=null&&!(S.bossKills&&S.flags.kgLook)&&!S.flags.kgLook&&Math.abs(tx-S.flags.kgMark%W)<=1&&Math.abs(ty-((S.flags.kgMark/W)|0))<=1/* かげのあとは、家の中にあっても調べられる */,hi=kg?-1:HOUSES.findIndex(h=>h.set.has(ty*W+tx));if(hi>=0){const hk=hKey(HOUSES[hi]);if(!OPENH.has(hk)){OPENH.add(hk);dirty=true;return}/* 1回目のタップで屋根を外す */const o0=S.obj[anc(ty*W+tx)];if(HOME_WALLS.has(o0)||HOME_DOORS.has(o0)){OPENH.delete(hk);dirty=true;return}/* 壁をタップすると屋根がもどる */if(!o0)return openSheet('house',hi)}}// 中が見えているときは、家具やせいれいもタップできる
    if(WD===KUSA&&!S.free&&!S.cleared){const rt=S.obj.indexOf('tower'),b=rt>=0?rt:S.sacredRoot;if(b!=null&&sacredTapHit(b,w.x/TS,w.y/TS)){sfx('tsacred');return rt>=0?sacredTreeTap(rt):openSheet('clear')}}/* 御神木・切り株：切り株（育った木は根もと）の絵の所だけをタップすると、じょうけんを見る（葉の所・4×4のほかのマスはひろわない） */
    if(BOARD>=0){const q=tapObj(BOARD),bx=(q.x/TS-BOARD%W),by=(q.y/TS-(BOARD/W|0));if(bx>=-.15&&bx<2.15&&by>=-.9&&by<.95){sfx('twood');return S.feat.craft?openSheet('craft'):toast('依頼ボード。もう少ししたら使えるようになる')}}/* 依頼ボード：絵（2マスはば・上へはみ出す）のどこをタップしても */
    const j=anc(ty*W+tx),o=S.obj[j];
    if(WD===KUSA&&S.flags.kgMark!=null&&!(S.bossKills&&S.flags.kgLook)&&!S.flags.kgLook&&Math.abs(tx-S.flags.kgMark%W)<=1&&Math.abs(ty-((S.flags.kgMark/W)|0))<=1){S.flags.kgLook=true;checkQuest();toast('大きなかげのあと：草がしおれて、つめたい');if(S.res.some(r=>r.name===POKO))dialog([[POKO,'#sigh|……このつめたさ、知ってる気がする。守り神さま、夕方になったら、ちょっとだけ、ぼくの話を聞いてくれる？']]);return}/* 大きなかげのあとを調べる */
    if(WD===KAZAN&&S.st2){const g=ty*W+tx;
      if(S.ground[g]===1&&!o){const k=sprMap()[g];if(k==='a'&&WD===KAZAN&&yumomiTap())return;/* 湯もみ（シズクのおねがい） */if(k){sprLookTap(k);return toast(SPN[k]+'：'+(springOn(k)?'あたたかい湯がわいている'+SPR_TXT[k]:S.st2.sp[k]?'装置がこわれて、湯が冷めている':'冷たい水……熱がとどいていない'))}}
      if(o==='volcano'){if(!S.flags.volLook){S.flags.volLook=true;checkQuest()}return toast('火山：ふもとから、熱の道が村へのびている')}
      if(o==='heatv')return openSheet('heatv',j);
      if(o==='kaeribi'){sfx('twood');return toast(kgrLampTxt())}
      if(o==='boulder'&&rockHard(j))return toast(rockHot(j)?'大岩：赤く熱くなっている':'大岩：かたくて、くだけない');
      if(o==='boulder')return toast('大岩：のこり '+Math.max(0,4-(S.hp['n'+j]||0))+'/4');
      if(o==='crack'){const t=st2();if(!(t.hai>0))return toast('ひびわれ：ハイカゲの灰でうめられる（灰'+(t.hai||0)+'）');t.hai--;clearObj(j);S.floor[j]='path';burst(j,'block');sfx('level');recount();dirty=true;toast('ひびわれを、灰でうめた（灰－1）','good');return checkQuest()}}
    {const g=ty*W+tx,dp=(S.drops||[]).find(q=>q.y*W+q.x===g&&q.id!=='shard');if(WEEDS.has(o)||dp){if(o==='kinoko'&&foodCap()-S.food<=0)return toast('箱に入りません');if((WEEDS.has(o)&&o!=='kinoko'||dp&&dp.id.startsWith('mat:'))&&matCap()-matTot()<=0)return toast('箱に入りません');if(dp&&dp.id.startsWith('food:')&&foodCap()-S.food<=0)return toast('箱に入りません');let nm;if(WEEDS.has(o)){(S.wreq||(S.wreq={}))[j]=1;nm=BL[o].name}else{dp.tap=1;nm=dp.id.startsWith('mat:')?(MATN[dp.id.slice(4)]||'おとしもの'):'おとしもの'}sfx(o==='kinoko'?'tpuni':WEEDS.has(o)?'tgrass':dp.id==='mat:can'?'tcan':'twood');return toast(nm+'：せいれいがとりにいく'+'')}}/* 草・きのこ・枝などの落とし物は、タップすると、せいれいがとりにいく */
    if(HOME_WALLS.has(o)||HOME_DOORS.has(o)){const w=houseWhy(j);if(w)toast(w)}/* 家にならないかべ・ドアをタップすると、理由を出す */
    if(o&&rangeOf(o,j))SHOWR={j,o,until:performance.now()+4000};
    if(o==='farm')return openSheet('farm',j);
    if(BEDSET.has(o))return openSheet('bed',j);
    if(COOKST.has(o))return openSheet('oven',j);/* たき火も料理の家具 */
    if(o==='matyard'){const d=S.dyn[j];return toast('材料置き場：'+(yardTxt(d&&d.yt)||'からっぽ'))}/* 材料置き場：運んだ数 */
    if(o==='plot')return toast('耕す前の畑：せいれいが耕しにくる');
    if(o==='sprout')return toast(BL[S.dyn[j].plant].name+'を植える場所：せいれいが植えにくる');
    if(o==='site'){const d=S.dyn[j],rs=S.res.filter(q=>!q.hidden);toast(BL[d.build].name+'を建設中：'+Math.floor(d.p/d.need*100)+'%'+(gotList(d).length&&(hasNeed(d)||d.p<=0)?'　'+gotTxt(d).join(' '):''));/* 素材を運んでいるあいだは、運んだ数も */if(rs.length&&!rs.some(q=>{const G=bfs(q.x|0,q.y|0);return G.dist.some((v,k)=>v>=0&&adjOf(k,q2=>anc(q2)===j)>=0)}))toast('建てる所へ行けません','warn');return}/* 行けないときは、その理由を出す */
    if(o==='berry'||o==='fruit'){const g=(S.dyn[j]||{g:0}).g;return toast(BL[o].name+'：'+(g>=100?'実がなっている':'実がなるまで あと'+Math.max(1,Math.ceil((100-g)/25))+'日'))}/* タップで見るだけ（セーブの中身はかえない） */
    if(HOME_WALLS.has(o)&&boxTypeAt(j))return openSheet('box',j);/* 壁にかけた、しまう家具 */
    const fw=o&&(FENCE_IDS.has(o)||HOME_WALLS.has(o)||HOME_DOORS.has(o));/* 柵・塀・家の壁・ドア・門は、短い知らせのまま */
    if(fw&&breakable(o)&&BL[o].brk)return toast(BL[o].name+'：'+withAttr(o,BL[o].desc||'')+'（じょうぶさ '+Math.floor(S.hp[j]??BL[o].hp)+'/'+BL[o].hp+'）');
    if(fw&&breakable(o))return toast(BL[o].name+'：じょうぶさ '+Math.floor(S.hp[j]??BL[o].hp)+'/'+BL[o].hp);
    if(o==='kagenest'&&nestTap(j))return;/* かげの巣：せいれいがこわしにいく（defense.js） */
    if(VEINS[o]&&VOLK()){if(matCap()-matTot()<=0)return toast('箱に入りません');(S.vreq||(S.vreq={}))[j]=1;sfx('tstone');return toast(BL[o].name+'：せいれいがほりにいく')}/* 鉱脈は、タップすると、せいれいがほりにいく */
    if(o==='rock'||VEINS[o]||o==='deadtree'||o==='ntree'||o==='bamboo')return toast(iname(o)+'：のこり '+Math.max(0,10-(S.hp['n'+j]||0))+'/10');
    if(o==='takenoko')return takenokoPop(j);/* とる・そだてる をえらぶ */
    if(o==='watch'||o==='yogan')return openSheet('watch',j);
    if(o==='composter')return cmpPop(j);
    if(o==='smelter')return smPop(j);
    if(PROC[o])return prPop(j);/* 粉ひき小屋・はたおり機 */
    if(o==='obox')return S.feat.inv?openSheet('inv'):toast('おそなえ箱');
    if(o==='grave'){const d=S.dyn[j]||{};if(!d.buried)return toast((d.name||'せいれい')+'のお墓。なかまが神殿へはこんで、おみおくりしてくれる');/* 守り神は埋葬できない */return toast((d.name||'せいれい')+'のお墓')}
    if(o==='tower'&&WD===KAZAN&&!S.cleared&&towerLightTap(j))return;/* 火山：守護の台座に火を入れる */
    if(o==='tower'&&WD===KUSA&&!S.cleared){if(sacredTapHit(j,w.x/TS,w.y/TS))return sacredTreeTap(j);return}/* 御神木は、根もとの所だけ */
    if(o==='board')return S.feat.craft?openSheet('craft'):toast('依頼ボード。もう少ししたら使えるようになる');
    if(o==='statue')return typeof sasaPop==='function'?sasaPop():toast('神殿。守り神の居場所');/* 神殿：季節のささげもの（sasage.js） */
    if(o==='statueb'){templeRuinTap(j);return}
    if(o==='kazaanab'){windHoleTap(j);return}
    if((o==='anagura'||o==='tsrubble'||o==='tsroot'||o==='tsnushi')&&tsTap(j))return;/* 土：あなぐまの巣穴（tsuchi.js） */
    if(RIDEB[o]){windRideTap(j);return}/* こわれた遊具：せいれいが直しにくる *//* ふさがった風穴：せいれいが石をどけにくる（wind.js） */
    if(o==='altar')return toast('カミサマの台座。カミサマはここに現れる');
    {const c=ty*W+tx,lo=!o||WEEDS.has(o),rc=RFC.has(c)?c:lo&&RFC.has(c+W)?c+W:lo&&RFC.has(c+2*W)?c+2*W:-1;if(rc>=0&&lo)return openSheet('roof',RFC.get(rc))}/* ガゼボ・東屋：下に物がなければ、屋根の説明（屋根の絵はマスの上へはみ出すので、2マス上までみる） */
    if(o&&BL[o].kind==='furn'&&!BL[o].trap&&!fw)return openSheet('furn',j);/* 家具：説明と、向きをかえる */
    if(!o&&RUGC.has(ty*W+tx))return openSheet('furn',RUGC.get(ty*W+tx));/* ラグ */
    if(o&&fw)return toast(BL[o].name+'：'+withAttr(o,BL[o].desc||''));
    if(o)return openSheet('furn',j);/* 噴水・建物・植物・ワナなども、下から説明を出す */
    if(S.ground[j]===1&&typeof tsBridgeTap==='function'&&(tsBridgeTap(j)||tsFillTap(j)))return;/* 土：地われに石の大橋をかける（tsuchi-bridge.js） */
    if(S.ground[j]===1)return toast(skyJ(j)?'雲の海。橋をかけると、わたれる':riftJ(j)?'地われ。ふかくて、底が見えない':'池。そばでつりができる');
    return toast(REV.has(j)?'よみがえった土地':'荒れた土地。まわりに木や花を植えると、よみがえる');
  }
  if((mode==='build'||mode==='remove'||mode==='bulk')&&nightLock())return toast('夜のあいだは、置くことも、こわすこともできません');
  if(mode==='build'){if(BL[sel]&&['furn','build','deco'].includes(BL[sel].kind)&&!BL[sel].trap){/* ワナは柵と同じで、タップするたびにそのまま置く */if(!usable(sel))return place(sel,tx,ty);const ok=canPlace(sel,tx,ty,true);pending={kind:'one',id:sel,x:tx,y:ty,ok};confirmOne();($('#cRot').hidden=!(pending&&pending.kind==='one'&&ROTS[pending.id]),$('#confirm').hidden=false);sfx('tplace');return}return place(sel,tx,ty)}
  if(mode==='remove')return removeAt(tx,ty);
  if(mode==='bulk'){if(selStamp==='move')return moveTap(tx,ty,w.x/TS,w.y/TS);if(selStamp&&selStamp.startsWith('bp:'))return askBp(+selStamp.slice(3),tx,ty);if(selStamp)return selStamp.startsWith('swap:')?askSwap(selStamp.slice(5),tx,ty):askStamp(selStamp,tx,ty);if(!S.bulk)return toast('下から道具をえらぶ');return toast('ぬりたい物をえらんで、なぞる')}
}

/* Android の「戻る」で、ゲームのページから出ないようにする：さわったときに、履歴にゲームの印を1つ足しておき、戻るでその印がきえたら、すぐ足しなおす（Chrome は、さわらずに足した履歴を戻るでとばすので、さわるたびにたしかめる） */
let BACKTRAP=false;
function backTrap(){if(BACKTRAP)return;try{history.pushState({hk:1},'');BACKTRAP=true}catch(e){}}
document.addEventListener('pointerdown',backTrap,true);
window.addEventListener('popstate',()=>{BACKTRAP=false;backTrap()});
