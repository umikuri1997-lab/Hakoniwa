'use strict';
/* 草原の転「霧のむこうの影」（data.js の kiri。なかよしの想いのあと、きょうだいの花畑の前）：
   はじまりの会話で、あしたをあらしにする（kiriStormSet）→ あらしのつぎの朝、村の南のはしに、その日だけ霧がおりる（kiriTry）。
   霧から影が出てノドカをおそい、フタバがかばう。フタバのまわりのみどり KIRI_KARE マスがかれる（daichiTake）。
   そのあと、フタバは花畑がおわるまで御神木の根もとでじっとする（S.flags.kiriSit。仕事・夜のたたかい・見張り台に出ない。ごはん・ねるのはする）。
   花の世話は、ほかの4人がおえてから、さいごにフタバが自分の1本をする（kiriSitting）。 */
const KIRI_KARE=40;
let KIRI=null;/* 演出のあいだだけ：{x,y,a（霧のこさ）,foe} */
function kiriStormSet(){/* あしたを、あらしの日にする（天気のよほう weather.js） */const d=dayNo()+1,Q=wxQ();Q[d]={r:1,b:0,s:1,t:null};S.stormNext=d;S.stormWarn=0;S.flags.kiriD=d}
function kiriSpot(){/* 村の南のはしの、空いた地面 */let best=-1,by=-1,bx=1e9;for(let j=0;j<W*H;j++){if(!VILL[j]||S.obj[j]||S.floor&&S.floor[j]||S.ground[j]!==0||!walk(j)||fogAt(j))continue;const y=(j/W)|0,dx=Math.abs(j%W-CX);if(y>by||y===by&&dx<bx){by=y;bx=dx;best=j}}return best}
function kiriReady(){if(WD!==KUSA||S.free||S.flags.kiriSeen||S.flags.kiriD==null||KIRI)return false;if(dayNo()<=S.flags.kiriD||isNight()||hour()<7||hour()>=16)return false;
  if(SCENEHOLD||camAnim||GIFT_ACTIVE||!$('#dialog').hidden||typeof sevBusy==='function'&&sevBusy())return false;
  const f=S.res.find(r=>r.name===POKO),n=S.res.find(r=>r.name===MINA);return !!(f&&n&&!f.hidden&&!n.hidden&&!f.coffin&&!n.coffin)}
function kiriTry(){if(!kiriReady())return;const j=kiriSpot();if(j<0)return;kiriScene(j)}
function kiriScene(j){const owner=S,session=VILLAGE_SESSION,f=S.res.find(r=>r.name===POKO),n=S.res.find(r=>r.name===MINA);
  const alive=()=>S===owner&&VILLAGE_SESSION===session&&S.res.includes(f)&&S.res.includes(n);
  const at=(ms,fn)=>later(()=>{if(alive())fn()},ms);
  const px=j%W+.5,py=((j/W)|0)+.5;KIRI={x:px,y:py,a:0,foe:null};
  const tween=(r,tx,ty,ms)=>{const x0=r.x,y0=r.y,t0=clockNow(),tick=()=>{if(!alive())return;const k=Math.min(1,(GCLK-t0)/ms);r.x=x0+(tx-x0)*k;r.y=y0+(ty-y0)*k;if(k<1)later(tick,16)};later(tick,16)};
  const fade=(to,ms)=>{const a0=KIRI.a,t0=clockNow(),tick=()=>{if(!alive()||!KIRI)return;const k=Math.min(1,(GCLK-t0)/ms);KIRI.a=a0+(to-a0)*k;if(k<1)later(tick,16)};later(tick,16)};
  const L1=KS([['N','#surprise|あれぇ……村のはしが、まっしろだよぉ。'],['F','#worry|霧……？ あらしは、もうおわったのに。'],['N','ちょっと、見てくるねぇ。']]);
  dialog(L1,()=>{if(!alive()){KIRI=null;return}
    for(const r of[f,n]){endAct(r);r.path=null;r.bubble=null}
    n.x=px;n.y=py;n.face=1;f.x=px-.4;f.y=py-3;f.face=1;
    SCENEHOLD=performance.now()+7600;camAnim={fz:cam.z,tz:Math.min(3,Math.max(2,cam.z*1.3)),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:px*TS,ty:(py-.8)*TS,t:0,dur:1};
    fade(1,1200);
    at(1500,()=>{KIRI.foe={type:'basic',x:px,y:py+2.6,spawned:true,id:-77,hp:100,max:100};tween(KIRI.foe,px,py+1.2,900);sfx('arrive')});
    at(2500,()=>{JUMP.set(n,performance.now());addFloatG(n.x,n.y,-1.2,'！','#e06060')});
    at(2900,()=>{tween(f,px,py+.6,350);JUMP.set(f,performance.now())});
    at(3300,()=>{leafFX(f);shakeScreen('l');sfx('hit');addFloatG(f.x,f.y,-1.2,'！','#e06060');daichiTake(f.x,f.y,KIRI_KARE);for(const r of[f,n])r.face=1});
    at(4300,()=>{const e=KIRI.foe;KIRI.foe=null;if(e)EVAP.push({e,t0:performance.now(),dur:1300});sfx('evap');fade(0,2400)});
    at(7600,()=>{SCENEHOLD=0;KIRI=null;S.flags.kiriSeen=1;S.flags.kiriSit=1;dialog(kiriLines(),()=>{})});
  })}
function kiriLines(){return KS([['N','#surprise|フタバ……！'],['F','#think hush|……だいじょうぶ。ぼく、消えてないよ。'],['N','#worry|でも、まわりの草が、こんなに……。'],
  ['N','#think|……土がねぇ、おぼえてるって言ってるよぉ。むかしの、あの夜も、こうやって草がいっきにかれたんだってぇ。'],
  ['G','#think|……そうか。そういうことじゃったか。'],['G','あの夜、ヌシは、草原のみどりを、ぜんぶフタバにそそいだのじゃ。フタバを、消さないために。'],
  ['F','#think|……みんなが、ぼくの前に立って……そのあと、あったかい葉っぱに、つつまれたんだ。'],
  ['G','#sigh|力をつかいはたしたところを、オオカゲに、のこりの力をうばわれた。草原がかれたのは、そのときじゃ。'],
  ['F','#cry|……じゃあ、草原がかれたのは……ぼくの、せい……？'],['N','#worry|ちがうよぉ、フタバ……！'],
  ['F','#cry hush|……ごめん。すこし、ひとりにして。']])}
function kiriDrawAdd(add,now){/* 霧の中の影（演出だけ。夜のしくみには入れない） */const e=KIRI&&KIRI.foe;if(!e)return;const px=e.x*TS,fy=e.y*TS;add(e.y,2,[px-24,fy-66,px+24,fy+15],()=>drawEnemy(e,now),(e.y|0)*W+(e.x|0))}
function drawKiriFog(){/* その日だけの霧：村のはしに、白いもや（画面の上にかさねる） */if(!KIRI||KIRI.a<=0)return;const p=w2s(KIRI.x,KIRI.y),R=TS*cam.z*4.2;ctx.save();
  for(let i=0;i<7;i++){const a=i*0.9,ox=Math.cos(a)*R*.45,oy=Math.sin(a)*R*.22;ctx.globalAlpha=KIRI.a*.22;ctx.fillStyle='#f4f6f8';ctx.beginPath();ctx.ellipse(p.x+ox,p.y+oy+R*.1,R*(.8+i%3*.15),R*(.38+i%2*.08),0,0,7);ctx.fill()}
  ctx.restore()}
function kiriSitting(r){/* フタバが、御神木の根もとでじっとしているか */if(!r||r.name!==POKO||WD!==KUSA||!S.flags.kiriSit)return false;if(typeof wflOn==='function'&&wflOn()){const T=wflT(),rest=wflWho().filter(q=>q!==r);if(rest.every(q=>T.includes(q.id)))return false}/* ほかの4人が花の世話をおえたら、さいごにフタバが自分の1本 */return true}
function kiriRoot(r){const t=S.obj.indexOf('tower');if(t<0)return -1;const G=bfs(r.x|0,r.y|0),tx=storyTreeX(t),ty=storyTreeY(t);return nearest(G,j=>walk(j)&&!S.obj[j]&&Math.hypot(j%W+.5-tx,(j/W|0)+.5-ty)<=2.6,200)}
function tryKiriSit(r){/* 昼：ごはん・ねむるとき・にげるとき いがいは、御神木の根もとへ */if(!kiriSitting(r)||isNight()||hungry(r)||r.energy<20||r.hunger<250)return false;const a=r.act;if(a&&(a.type==='kirisit'||['eat','fetch','eatwait','flee','faint','sleep','store','smat','sitem','step','storywait','reunion'].includes(a.type)))return false;
  const k=kiriRoot(r);if(k<0)return false;endAct(r);startAct(r,bfs(r.x|0,r.y|0),'kirisit',k,{});return true}
ACT_LBL.kirisit='御神木の根もとで、じっとしている';
ACT.kirisit={start(r){const t=S.obj.indexOf('tower');if(t>=0)r.face=storyTreeX(t)>=r.x?1:-1;r.bubble=''},done:(r)=>!kiriSitting(r)||isNight()||hungry(r)||r.energy<20||r.hunger<250};
function kiriIns(s){/* 前のセーブ：kiri を足したので、花畑からあとの番号を1つずらす。花畑の話をまだ聞いていなければ、kiri から */if(s.free||(s.world||0)!==0)return;const k=qsIx('kiri');if(k<0)return;
  const atW=(s.quest||0)===k&&!s.qTalked;if((s.quest||0)>=k&&!atW)s.quest=(s.quest||0)+1;if(s.qStory!=null&&s.qStory>=k)s.qStory++}
