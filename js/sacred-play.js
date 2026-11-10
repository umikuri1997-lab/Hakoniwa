'use strict';
/* 御神木の調べ：村での準備と、守り神の出番（指でする操作）。調べは1回タップすると、その話の最後まで自動で続く。 */
const fieldNear=(j,R,f)=>{const s=fieldStump(j),sx=s%W,sy=s/W|0;for(let y=sy-R;y<=sy+R;y++)for(let x=sx-R;x<=sx+R;x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x,o=S.obj[k]==='part'?S.obj[S.ref[k]]:S.obj[k];if(o&&f(o,k))return true}return false};
/* 調べの前に、その調べのために作る物（作る・建てる → 切り株のそばに置く）。依頼を受けてから、この調べのために置いた物だけを数える（前からある物では進まない） */
const FIELD_PREP={
  earthListen:{label:'切り株のそばに、あさぶくろを置こう',build:{ids:['asabukuro']},learn:['asabukuro'],legacy:j=>fieldNear(j,3,o=>o==='asabukuro')},
  fireRoot:{label:'切り株のそばに、たき火を置こう',build:{ids:['campfire']},learn:['campfire'],legacy:j=>fieldNear(j,3,o=>o==='campfire')},
  waterFilm:{label:'切り株のそばに、みずがめを置こう',build:{ids:['jar']},learn:['jar'],legacy:j=>fieldNear(j,3,o=>o==='well'||o==='jar')},
  windEcho:{label:'切り株のそばに、風車を建てよう',wait:'風車ができあがるのを待とう',build:{ids:['windmill']},learn:['windmill'],legacy:j=>fieldNear(j,3,o=>o==='lily')},
  tower:{label:'切り株のそばに、ベンチを置こう',build:{ids:['bench']},learn:['bench'],legacy:()=>false}
};
const FIELD_NEAR_R=6;/* 「切り株のそば」：木のマスから6マスまで */
const fieldBuildHas=(k,ids)=>ids.includes(S.obj[k])||ids.includes(S.floor[k]);
function fieldBuildCount(id){const p=FIELD_PREP[id],b=fieldStoryState(id)?.built;if(!p||!b)return 0;if(b.legacy)return p.build.n||1;return (b.cells||[]).filter(k=>fieldBuildHas(k,p.build.ids)).length}
const fieldBuildOK=id=>fieldBuildCount(id)>=(FIELD_PREP[id]?.build?.n||1);
/* 作った物のマス（なかまが見にいく所）。古いセーブで前の準備のまま進めたときは、なし */
function fieldBuiltCell(id){const p=FIELD_PREP[id],b=fieldStoryState(id)?.built;if(!p||!b||b.legacy)return null;const k=(b.cells||[]).find(k=>fieldBuildHas(k,p.build.ids));return k==null?null:k}
/* 置いたとき（place）：いまの調べが作る物を待っていて、切り株のそばなら、この調べの物として記録する */
function fieldBuildNote(id,j){if(IS_STORY_REPLAY)return;const q=fieldStoryCurrent();if(!q)return;const fid=q.id,p=FIELD_PREP[fid];if(!p||!p.build.ids.includes(id)||S.sacredRoot==null||fieldDistance(j,S.sacredRoot)>FIELD_NEAR_R)return;
  const st=fieldStoryEnsure(fid);if(!st||(st.step||0)>0||fieldBuildOK(fid))return;const b=st.built||(st.built={cells:[]});if(b.legacy)return;if(!b.cells.includes(j))b.cells.push(j);dirty=true;renderQuest();}
/* ひっこしミトンでうつしたとき：この調べのために置いた物なら、記録のマスもうつす（切り株のそばでなくなったら、記録からはずす） */
function fieldBuildMove(id,a,j){if(IS_STORY_REPLAY)return;const q=fieldStoryCurrent();if(!q)return;const st=fieldStoryState(q.id),b=st&&st.built;if(!b||b.legacy||!b.cells)return;const i=b.cells.indexOf(a);if(i<0)return;b.cells.splice(i,1);if((st.step||0)===0&&S.sacredRoot!=null&&fieldDistance(j,S.sacredRoot)<=FIELD_NEAR_R)b.cells.push(j);dirty=true;renderQuest()}
function fieldPrepNeed(id){const st=fieldStoryState(id),p=FIELD_PREP[id],j=S.sacredRoot;if(IS_STORY_REPLAY||!p||j==null||(st?.step||0)>0||fieldBuildOK(id))return null;{const nw=(p.learn||[]).filter(k=>!S.recipes[k]);recipeNotice(nw);for(const k of nw){S.recipes[k]=true;dirty=true}}/* 古いセーブでも、準備に使う物を作れるように */
  const n=p.build.n||1,b=st?.built;if(n>1)return {...p,label:p.label+'（'+fieldBuildCount(id)+'/'+n+'）'};
  if(p.wait&&b&&!b.legacy&&(b.cells||[]).some(k=>S.obj[k]==='site'&&S.dyn[k]?.build===p.build.ids[0]))return {...p,label:p.wait};return p}
/* 古いセーブ：いまの依頼で、前の準備（その時の決まり）がもうそろっていた調べは、そのまま進める（1回だけ） */
function migrateFieldBuild(state){if(!state.flags||state.flags.fieldBuild1)return;state.flags.fieldBuild1=1;if(state.free||(state.world||0)!==0||state.sacredRoot==null||!state.qTalked||state.qStory!=null)return;
  const q=QUESTS1[state.quest];if(!q?.fieldParts)return;const S0=S;S=state;try{{const id=q.fieldParts.find(p=>((state.fieldStories?.[p]?.step)||0)<(FIELD_STORIES[p]?.length||0)),p=id&&FIELD_PREP[id],st=state.fieldStories?.[id];if(p&&!((st?.step||0)>0)&&!st?.built)if(p.legacy(state.sacredRoot)){state.fieldStories||(state.fieldStories={});(state.fieldStories[id]||(state.fieldStories[id]={step:0})).built={legacy:1};}}}finally{S=S0}}
/* 守り神の出番：その話の、どの段階で、どんな操作か。pop：地図を見なくてよい出番は、ポップアップの中で（その見出し） */
const FIELD_PLAY={
  earthListen:{phase:0,type:'root',pop:'根をほりだす',hint:'光る根の先から、根を指でなぞる。はずれると根が切れて、はじめから',bonus:{fun:10,word:'根がほっとした'}},
  fireRoot:{phase:0,type:'hold',pop:'石をあたためる',hint:'石を長おしして、ゲージが緑のときにはなす',bonus:{fun:10,word:'石がぽかぽか'}},
  waterFilm:{phase:0,type:'trace',pop:'水の通り道をつなぐ',hint:'光る所から、指でなぞって根まで水をとどける',bonus:{fun:10,word:'水がしみわたった'}},
  windEcho:{phase:0,type:'rhythm',pop:'葉の音を聞く',hint:'葉がゆれた順に、指で風をおくって葉をなぞる',bonus:{fun:10,word:'葉がうたった'}},
};
const MGSPR={src:"assets/g/b942f0109a.webp",r:{"stone0":[83,26,19,16],"stone1":[103,26,19,16],"stone2":[71,0,19,24],"grass":[39,26,15,21],"cold":[123,26,17,15],"drop":[244,26,9,8],"leafL":[0,0,50,25],"tip":[172,26,11,12],"bud0":[236,26,7,11],"bud1":[184,26,8,12],"bud2":[159,26,12,13],"bud3":[141,26,17,14],"wind0":[193,26,17,12],"wind1":[55,26,27,18],"wind2":[91,0,30,24],"spark0":[0,49,7,6],"spark1":[211,26,12,12],"spark2":[0,26,18,22],"spark3":[224,26,11,12],"leaf0":[159,0,19,23],"leaf0s":[122,0,20,24],"leaf1":[19,26,19,22],"leaf1s":[179,0,19,23],"leaf2":[199,0,19,23],"leaf2s":[219,0,21,23],"leaf3":[143,0,15,24],"leaf3s":[51,0,19,25]}};
/* 出番の絵（もらった絵から作ったドット絵、tools/art/minigame）。1ドット＝世界の1。読みこむ前は、コードの絵 */
const MGIMG=new Image();MGIMG.onload=()=>{MGIMG.ok=1};MGIMG.src=MGSPR.src;
const mgOK=()=>!!MGIMG.ok;
/* (x,y) がまん中（by：'b' なら下のはし）。fl：左右をはんてん */
function mgs(id,x,y,by,fl){const r=MGSPR.r[id];if(!r||!MGIMG.ok)return false;const [sx,sy,w,h]=r,dx=PXR(x-w/2),dy=by==='b'?PXR(y)-h:PXR(y-h/2);if(fl){PXG.save();PXG.translate(dx*2+w,0);PXG.scale(-1,1)}PXG.drawImage(MGIMG,sx,sy,w,h,dx,dy,w,h);if(fl)PXG.restore();return true}
const mgFrame=(n,ms,t0=0)=>Math.floor((performance.now()-t0)/ms)%n;
let SPLAY=null;
/* 遊べる出番：3回しっぱいしても、お話はそのまま進む（ごほうびだけ、なし） */
const PLAY_MISS=3;
const sacredPlayActive=()=>!!SPLAY&&SPLAY.owner===S&&SPLAY.session===VILLAGE_SESSION;
function sacredPlayHint(t){if(SPLAY?.pop&&SPLAY.popHint){SPLAY.popHint.textContent=t;t=''}let h=$('#playHint');if(!h){h=document.createElement('div');h.id='playHint';h.className='toast';$('#toasts').appendChild(h)}h.textContent=t;h.hidden=!t}
function sacredPlayCount(){const P=SPLAY;if(!P)return '';const n=P.need?' '+P.got+'/'+P.need:'';return FIELD_PLAY[P.id]?.bonus?n+' のこり'+(PLAY_MISS-(P.fails||0))+'回':n}
function startSacredPlay(id,j,cast,done){
  const def=FIELD_PLAY[id];if(!def)return done();
  const s=fieldStump(j),pop=!!def.pop,cx=pop?PLAYW/2:storyTreeX(j)*TS,cy=pop?PLAYBASE:((s/W|0)+.8)*TS-hiAt(j)*LIFT,now=performance.now();
  const P={owner:S,session:VILLAGE_SESSION,id,type:def.type,hint:def.hint,pop,j,cx,cy,t0:now,done,cast,got:0,need:0,prog:0,msg:'',msgT:0};
  const ring=(n,rx,ry,a0=0)=>Array.from({length:n},(_,i)=>{const a=a0+i/n*Math.PI*2;return{x:cx+Math.cos(a)*rx,y:cy+8+Math.sin(a)*ry}});
  if(P.type==='cover'){P.spots=ring(6,36,14,.2);const c=new Set();let k=0;while(c.size<3)c.add((hash((S.sacredRoot||0)*3+k++)*6)|0);P.cold=c;P.covered=new Set();P.need=3;P.pile={x:cx-50,y:cy-30};P.carry=null}/* 草の山から、草を1つずつ指で運ぶ */
  if(P.type==='hold'){P.stone={x:cx+20,y:cy+12};P.heat=0;P.holding=false}
  if(P.type==='root'){P.path=[];for(let i=0;i<=28;i++){const u=i/28;P.path.push(pop?{x:cx+52-u*52-Math.sin(u*Math.PI)*42,y:cy+22-u*20+Math.sin(u*Math.PI*2)*4}:{x:cx+30-u*58,y:cy+26-u*20+Math.sin(u*Math.PI*3)*5})}P.reach=0;P.tip=0}/* 根の先（土の深い所）から、地面の上（切り株の根元）へ */
  if(P.type==='rhythm'){P.leaves=[[-44,-46],[44,-46],[-44,-6],[44,-6]].map(([dx,dy])=>({x:cx+dx,y:cy+dy}));P.need=4;P.order=[];let k=0;while(P.order.length<P.need){const v=(hash((S.sacredRoot||0)*7+k++)*4)|0;if(v!==P.order[P.order.length-1])P.order.push(v)}P.sw=[0,0,0,0];P.trail=[];P.show=now+700;P.showEnd=()=>P.show+P.need*700}/* 4まいの葉が、じゅんにゆれて鳴る → 同じ順に、指で風をおくる（となりあう葉は、ほかの葉の上を通らない並び） */
  if(P.type==='trace'){P.path=[];for(let i=0;i<=24;i++){const u=i/24;P.path.push(pop?{x:cx-54+u*48,y:cy+14+Math.sin(u*Math.PI*2)*9-u*10}:{x:cx-74+u*66,y:cy+16-Math.sin(u*Math.PI)*14+u*-6})}P.reach=0}
  if(P.type==='drip'){P.path=[];for(let i=0;i<=24;i++){const u=i/24;P.path.push({x:cx-50+u*40,y:cy-51+u*13})}P.reach=0;P.hold=false;P.bud={x:cx-4,y:cy-20};P.leaf={x:cx-53,y:cy-57}}/* かたむいた葉の上を、しずくが芽まで */
  if(P.type==='swipe'){P.need=3}
  if(P.type==='gather'){P.order=[...cast.filter(r=>r.name!==POKO),...cast.filter(r=>r.name===POKO)];P.need=P.order.length;P.prog=0;P.holding=false}/* 切り株を長おし：みんなが、じゅんに切り株へ力をおくる（フタバはさいご） */
  if(P.type==='brush'){P.area={x:cx-34,y:cy-10,w:68,h:20}}
  SPLAY=P;if(pop)sacredPlayPopOpen(P,def.pop);else camAnim={fz:cam.z,tz:Math.max(cam.z,2.4),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cx,ty:cy-10,t:0,dur:.6};
  sacredPlayHint(P.hint+sacredPlayCount());sfx('tap');
  if(IS_STORY_REPLAY)setTimeout(()=>{if(SPLAY===P)sacredPlayWin()},1600);/* 思い出帳では、守り神の手は見せるだけ */
}
function sacredPlayWin(){const P=SPLAY;if(!P)return;sacredPlayClose();if(P.owner!==S||P.session!==VILLAGE_SESSION)return;fxSpr('lighthit',P.cx,P.cy);sfx('good');sacredPlayBonus(P);P.done()}
/* うまくできたときのごほうび（その出番で1回だけ。思い出帳ではなし） */
function sacredPlayBonus(P){const b=FIELD_PLAY[P.id]?.bonus;if(!b||IS_STORY_REPLAY)return;const F=S.flags.playWon||(S.flags.playWon={});if(F[P.id])return;F[P.id]=true;dirty=true;
  if(b.word)addFloat(P.cx/TS,P.cy/TS-1.6,b.word,'#fff3c4');/* 木のようすが、うれしそうにかわる（物はもらわない） */
  if(b.fun)for(const r of S.res){if(r.hidden||r.coffin)continue;r.fun=Math.min(100,r.fun+b.fun);addFloat(r.x,r.y-1.4,'たのしさ+'+b.fun)}}/* 村のみんなが、うれしくなる */
/* しっぱい：数えて、3回でおわり（お話は進む） */
function sacredPlayMiss(t){const P=SPLAY;if(!P)return;P.fails=(P.fails||0)+1;sacredPlayMsg(t);if(P.fails<PLAY_MISS){sacredPlayHint(P.hint+sacredPlayCount());return}sacredPlayClose();if(P.owner!==S||P.session!==VILLAGE_SESSION)return;sfx('tap');P.done()}
function sacredPlayClose(){SPLAY=null;sacredPlayHint('');pxTextFree();pxLayerFree();sacredPlayPopFree()}
function cancelSacredPlay(){sacredPlayClose()}
function sacredPlayMsg(t){const P=SPLAY;if(!P)return;P.msg=t;P.msgT=performance.now()}
function sacredPlayNear(w,p,r){return Math.hypot(w.x-p.x,w.y-p.y)<=r}
/* 風：指がはじめて入った葉を、順番とくらべる（同じ葉にいるあいだは1回） */
function sacredPlayWind(P,w,now){let hit=-1;P.leaves.forEach((l,i)=>{if(sacredPlayNear(w,l,9))hit=i});if(hit<0||hit===P.last)return;P.last=hit;if(now<P.showEnd()){sacredPlayMsg('よく聞いて……');return}P.sw[hit]=now;
  if(hit===P.order[P.got]){P.got++;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(()=>{if(SPLAY===P)sacredPlayWin()},600);return}
  P.got=0;P.show=now+1000;sacredPlayMiss('そっちじゃない')}
/* 指の動き（世界の座標） */
function sacredPlayDown(w,now){const P=SPLAY;P.down={x:w.x,y:w.y,t:now,last:{x:w.x,y:w.y,t:now}};
  if(P.type==='hold'){if(sacredPlayNear(w,P.stone,14)){P.holding=true;P.heat=0}}
  else if(P.type==='cover'){if(sacredPlayNear(w,P.pile,12)&&P.got<P.need){P.carry={x:w.x,y:w.y};sfx('tap')}}
  else if(P.type==='drip'){if(!P.open&&sacredPlayNear(w,P.path[P.reach],9))P.hold=true}
  else if(P.type==='gather'){if(sacredPlayNear(w,{x:P.cx,y:P.cy-6},26))P.holding=true}
  else if(P.type==='trace'){P.tracing=sacredPlayNear(w,P.path[0],P.pop?14:12);P.reach=0}
  else if(P.type==='root'){P.tracing=sacredPlayNear(w,P.path[P.reach],P.pop?14:12)}/* 切れたら、根の先から（reach=0）。とちゅうではなしたら、そこからつづけられる */
  else if(P.type==='rhythm'){P.last=-1;P.trail=[{x:w.x,y:w.y,t:now}];sacredPlayWind(P,w,now)}
}
function sacredPlayMove(w,now){const P=SPLAY,d=P.down;if(!d)return;const l=d.last,dt=Math.max(1,now-l.t)/1000,dist=Math.hypot(w.x-l.x,w.y-l.y),v=dist/dt;d.last={x:w.x,y:w.y,t:now};
  if(P.type==='brush'){const a=P.area;if(w.x<a.x||w.x>a.x+a.w||w.y<a.y-6||w.y>a.y+a.h)return;if(v>260){if(P.prog>0)sacredPlayMsg('つよすぎる。そっと');P.prog=Math.max(0,P.prog-.25);return}P.prog=Math.min(1,P.prog+dist/360);if(Math.random()<.3)fx.push({k:'p',x:w.x,y:w.y,vx:(Math.random()-.5)*30,vy:-30,life:.6,col:'#b4925e',r:2});if(P.prog>=1)sacredPlayWin()}
  else if(P.type==='cover'&&P.carry){P.carry.x=w.x;P.carry.y=w.y}
  else if(P.type==='rhythm'){P.trail.push({x:w.x,y:w.y,t:now});if(P.trail.length>12)P.trail.shift();sacredPlayWind(P,w,now)}
  else if(P.type==='drip'&&P.hold){let best=-1,bd=1e9;for(let i=Math.max(0,P.reach-2);i<=Math.min(P.path.length-1,P.reach+4);i++){const p=P.path[i],dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}}if(bd>8){const p=P.path[P.reach];P.hold=false;P.fall={x:p.x,y:p.y,t:now};P.reach=0;sacredPlayMiss('しずくが、おちちゃった');return}if(best>P.reach)P.reach=best;if(P.reach>=P.path.length-1){P.hold=false;P.open=now;sfx('bush');setTimeout(()=>{if(SPLAY===P)sacredPlayWin()},900)}}
  else if(P.type==='root'&&P.tracing){let best=-1,bd=1e9;for(let i=Math.max(0,P.reach-2);i<=Math.min(P.path.length-1,P.reach+4);i++){const p=P.path[i],dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}}if(bd>(P.pop?13:10)){P.tracing=false;P.reach=0;P.snap=now;sfx('hit');sacredPlayMiss('根が切れちゃった');return}if(best>P.reach){P.reach=best;if(Math.random()<.4)fx.push({k:'p',x:w.x,y:w.y,vx:(Math.random()-.5)*30,vy:-30,life:.6,col:'#b4925e',r:2})}if(P.reach>=P.path.length-1)sacredPlayWin()}
  else if(P.type==='trace'&&P.tracing){let best=-1,bd=1e9;P.path.forEach((p,i)=>{const dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}});if(bd>(P.pop?14:12)){P.tracing=false;P.reach=0;sacredPlayMiss('こぼれちゃった');return}if(best>=P.reach&&best<=P.reach+3)P.reach=best;if(P.reach>=P.path.length-1)sacredPlayWin()}
}
function sacredPlayUp(w,now){const P=SPLAY,d=P.down;P.down=null;
  if(P.type==='hold'&&P.holding){P.holding=false;if(P.heat>=.58&&P.heat<=.84){sfx('bush');sacredPlayWin()}else if(P.heat<.6)sacredPlayMsg('まだ、つめたい');else sacredPlayMiss('こげちゃった')}
  else if(P.type==='swipe'&&d){const len=Math.hypot(w.x-d.x,w.y-d.y),ms=now-d.t;if(len<18)return;if(len>110||ms<140){sacredPlayMsg('つよすぎる。やさしく');P.gust=now;return}P.got++;P.sway=now;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,600)}
  else if(P.type==='trace'||P.type==='root')P.tracing=false;
  else if(P.type==='drip')P.hold=false;
  else if(P.type==='rhythm')P.last=-1;
  else if(P.type==='cover'&&P.carry){const c=P.carry;P.carry=null;let hit=-1;P.spots.forEach((p,i)=>{if(!P.covered.has(i)&&sacredPlayNear(c,p,10))hit=i});if(hit>=0&&P.cold.has(hit)){P.covered.add(hit);P.got=P.covered.size;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(()=>{if(SPLAY===P)sacredPlayWin()},500);return}if(hit>=0)sacredPlayMsg('ここは、あたたかい');P.back={x:c.x,y:c.y,t:now}}/* のせなかった草は、山へもどる */
  else if(P.type==='gather'&&P.holding){P.holding=false;if(P.got<P.need)sacredPlayMsg('はなさずに……')}
}
/* 出番のあいだは、地図の操作より先に指をうけとる */
for(const [ev,fn] of [['pointerdown',sacredPlayDown],['pointermove',sacredPlayMove],['pointerup',sacredPlayUp]])cv.addEventListener(ev,e=>{if(!sacredPlayActive()||SPLAY.pop||!$('#dialog').hidden)return;e.stopImmediatePropagation();e.preventDefault();if(ev==='pointerdown')cv.setPointerCapture(e.pointerId);fn({x:cam.x+e.clientX/cam.z,y:cam.y+e.clientY/cam.z},performance.now())},{capture:true});
/* 出番の絵は、ぜんぶドット絵：世界の1を1ドットにして、整数の四角（fillRect）だけでかく（線・円・グラデーションのなめらかな絵は使わない） */
const PXR=Math.round,PX={c:null,g:null,w:0,h:0};let PXG=null;/* g：出番の絵をかく小さいキャンバス（世界の1＝1ドット）。かいたあと、ぼかさずに画面へのばす */
function pxLayerFree(){if(PX.c){PX.c.width=PX.c.height=0;PX.c=PX.g=null}}
function pxDisk(x,y,rx,ry=rx){x=PXR(x);y=PXR(y);rx=PXR(rx);ry=PXR(ry);for(let dy=-ry;dy<=ry;dy++){const h=PXR(rx*Math.sqrt(Math.max(0,1-(dy/(ry+.5))**2)));PXG.fillRect(x-h,y+dy,h*2+1,1)}}
/* 光：まるい段々を3まい、うすく重ねる */
function pxGlow(x,y,r,a,col='255,246,200'){a=Math.max(0,Math.min(1,a));for(const k of [1,.66,.33]){PXG.fillStyle=`rgba(${col},${(a/3).toFixed(3)})`;pxDisk(x,y,Math.max(1,r*k))}}
/* 輪：f（0〜1）は上から右回りにどこまでかくか。th は太さ（ドット） */
function pxRing(x,y,r,th,f=1){x=PXR(x);y=PXR(y);const R=PXR(r)+th;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const d=Math.hypot(dx,dy);if(d>r+th/2||d<r-th/2)continue;if(f<1){let an=Math.atan2(dx,-dy);if(an<0)an+=Math.PI*2;if(an>f*Math.PI*2)continue}PXG.fillRect(x+dx,y+dy,1,1)}}
/* 線：1マスずつ、th ドットの四角をならべる */
function pxLine(x0,y0,x1,y1,th){x0=PXR(x0);y0=PXR(y0);x1=PXR(x1);y1=PXR(y1);const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1),o=th>>1;for(let i=0;i<=n;i++)PXG.fillRect(PXR(x0+(x1-x0)*i/n)-o,PXR(y0+(y1-y0)*i/n)-o,th,th)}
/* 草のたば：かぶせる草 */
function pxTuft(x,y){if(mgs('grass',x,y+3,'b'))return;PXG.fillStyle='#8a7a3e';for(let k=-2;k<=2;k++)PXG.fillRect(PXR(x)+k*2,PXR(y)-2+Math.abs(k),1,4);PXG.fillStyle='#c9b46a';for(let k=-2;k<=2;k++)PXG.fillRect(PXR(x)+k*2,PXR(y)-3+Math.abs(k),1,4)}
function pxPath(pa,n,th){for(let i=1;i<=n;i++)pxLine(pa[i-1].x,pa[i-1].y,pa[i].x,pa[i].y,th)}
/* 葉っぱ：ゆれは、行ごとに横へずらす（まわさない） */
function pxLeaf(x,y,sw,col,vein){x=PXR(x);y=PXR(y);for(let dy=-7;dy<=7;dy++){const h=PXR(4*Math.sqrt(Math.max(0,1-(dy/7.5)**2))),sx=PXR(sw*(7-dy)*.5);PXG.fillStyle=col;PXG.fillRect(x-h+sx,y+dy,h*2+1,1);if(dy>-7&&dy<7){PXG.fillStyle=vein;PXG.fillRect(x+sx,y+dy,1,1)}}}
/* 文字：ドットのフォントを1倍の小さい絵にかいて、ぼかさずにのばす（ふちどりは、まわり8方向に1ドット） */
const PXTXT={t:'',c:null};
function pxText(t,x,y){if(PXTXT.t!==t||!PXTXT.c){const c=PXTXT.c||document.createElement('canvas'),tg=c.getContext('2d');tg.font='10px "PixelMplus10",sans-serif';const w=Math.ceil(tg.measureText(t).width)+2;c.width=w;c.height=13;tg.font='10px "PixelMplus10",sans-serif';tg.textBaseline='top';tg.fillStyle='#695438';for(const[dx,dy]of[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])tg.fillText(t,1+dx,1+dy);tg.fillStyle='#fff5d4';tg.fillText(t,1,1);
  /* ふちのにじみをけす：うすさを、あり・なしの2つに */const im=tg.getImageData(0,0,c.width,c.height),d=im.data;for(let i=3;i<d.length;i+=4)d[i]=d[i]<96?0:255;tg.putImageData(im,0,0);PXTXT.t=t;PXTXT.c=c}
  const c=PXTXT.c;PXG.drawImage(c,PXR(x-c.width/2),PXR(y-10))}
function pxTextFree(){if(PXTXT.c){PXTXT.c.width=PXTXT.c.height=0;PXTXT.c=null;PXTXT.t=''}}
/* 出番の絵（P.cx・P.cy をまん中に、PXG へ。地図の上でも、ポップアップの中でも同じ） */
function sacredPlayPaint(P,now){const t=(now-P.t0)/1000;
  const glow=pxGlow;
  if(P.type==='cover'){P.spots.forEach((s,i)=>{if(P.covered.has(i))pxTuft(s.x,s.y);else if(P.cold.has(i)){glow(s.x,s.y,9,.35+.15*Math.sin(t*3+i),'150,205,255');mgs('cold',s.x,s.y)||glow(s.x,s.y,9,.65,'150,205,255')}else glow(s.x,s.y,7,.3,'255,214,150')});
    const pl=P.pile;PXG.fillStyle='rgba(66,53,28,.2)';pxDisk(pl.x,pl.y+3,9,3);if(mgOK()){pxTuft(pl.x-4,pl.y);pxTuft(pl.x+4,pl.y+1)}else{pxTuft(pl.x-5,pl.y+1);pxTuft(pl.x+5,pl.y+1);pxTuft(pl.x,pl.y-2)}if(!P.carry&&P.got<P.need){PXG.fillStyle='rgba(255,246,200,'+(.45+.3*Math.sin(t*4))+')';pxRing(pl.x,pl.y,12,1)}/* 草の山 */
    if(P.back&&now-P.back.t<300){const u=(now-P.back.t)/300;pxTuft(P.back.x+(pl.x-P.back.x)*u,P.back.y+(pl.y-P.back.y)*u)}
    if(P.carry){PXG.fillStyle='rgba(66,53,28,.25)';pxDisk(P.carry.x,P.carry.y+4,4,1);pxTuft(P.carry.x,P.carry.y-2)}}
  if(P.type==='hold'){const s=P.stone;{const dt=Math.min(.1,(now-(P.lt||now))/1000);P.lt=now;if(P.holding)P.heat=Math.min(1.05,P.heat+dt*.55)}if(P.heat>1){P.holding=false;P.heat=0;P.scorch=now;sacredPlayMiss('こげちゃった')}
    const hc=k=>`rgb(${Math.min(255,(120+P.heat*120)*k)|0},${Math.min(255,(110+P.heat*40)*k)|0},${Math.min(255,(105-P.heat*40)*k)|0})`;glow(s.x,s.y,10+P.heat*8,.2+P.heat*.4,'255,170,90');if(!mgs(P.heat<.3?'stone0':P.heat<.58?'stone1':'stone2',s.x,s.y+7,'b')){PXG.fillStyle=hc(.75);pxDisk(s.x,s.y+1,6,4);PXG.fillStyle=hc(1);pxDisk(s.x,s.y,6,4);PXG.fillStyle=hc(1.25);PXG.fillRect(PXR(s.x)-3,PXR(s.y)-3,3,1)}
    const bx=PXR(s.x)-16,by=PXR(s.y)-26;PXG.fillStyle='#4a3424';PXG.fillRect(bx-1,by-1,34,6);PXG.fillStyle='#7a6048';PXG.fillRect(bx,by,32,4);PXG.fillStyle='#8fdc6a';PXG.fillRect(bx+19,by,8,4);PXG.fillStyle='#ffb347';PXG.fillRect(bx,by+1,PXR(32*Math.min(1,P.heat)),2)}
  if(P.type==='brush'){const a=P.area;PXG.globalAlpha=.7*(1-P.prog);PXG.fillStyle='#9c7a52';pxDisk(a.x+a.w/2,a.y+a.h/2,a.w/2,a.h/2);PXG.globalAlpha=P.prog;PXG.fillStyle='#d9b98a';{let q=null;for(let i=0;i<=16;i++){const u=i/16,x=(1-u)**2*(a.x+6)+2*u*(1-u)*(a.x+a.w/2)+u*u*(a.x+a.w-6),y=(1-u)**2*(a.y+12)+2*u*(1-u)*(a.y+2)+u*u*(a.y+14);if(q)pxLine(q.x,q.y,x,y,1);q={x,y}}}PXG.globalAlpha=1}
  if(P.type==='root'){const pa=P.path,sn=P.snap&&now-P.snap<500,th=P.pop?4:3;PXG.fillStyle='rgba(120,88,52,.75)';if(P.pop)PXG.fillRect(0,PXR(P.cy-1),PLAYW,PLAYH);else pxDisk(P.cx,P.cy+18,40,14);/* 根の上の土 */PXG.fillStyle=sn?'rgba(232,120,110,.8)':'rgba(255,246,200,.55)';pa.forEach((p,i)=>{if(i>P.reach&&i%2===0)PXG.fillRect(PXR(p.x)-1,PXR(p.y)-1,2,2)});PXG.fillStyle='#9c7a52';pxPath(pa.map(p=>({x:p.x,y:p.y+1})),P.reach,th);PXG.fillStyle='#d9b98a';pxPath(pa,P.reach,th);const tp=pa[P.reach];glow(tp.x,tp.y,10,.45+.15*Math.sin(t*5),'255,236,170');mgs('tip',tp.x-2,tp.y-3)}
  if(P.type==='rhythm'){const k=Math.floor((now-P.show)/700),sh=now>=P.show&&k<P.need;if(sh&&P.rang!==P.show*10+k){P.rang=P.show*10+k;P.sw[P.order[k]]=now;sfx('bush')}/* お手本：順にゆれて鳴る */
    P.leaves.forEach((l,i)=>{const a=now-P.sw[i],on=P.sw[i]&&a<520,sw=on?Math.sin(a/50)*.5*(1-a/520):0;if(on)glow(l.x,l.y,12,.55*(1-a/520));if(!mgs('leaf'+i+(on?'s':''),l.x+PXR(sw*2),l.y+11,'b'))pxLeaf(l.x,l.y,sw,on?'#bfe89a':'#8fdc6a','#5f9e3f')});
    if(P.down&&P.trail.length>1){for(let i=1;i<P.trail.length;i++){const a=Math.max(0,1-(now-P.trail[i].t)/400);if(a<=0)continue;PXG.fillStyle='rgba(255,255,255,'+(a*.7).toFixed(2)+')';pxLine(P.trail[i-1].x,P.trail[i-1].y,P.trail[i].x,P.trail[i].y,1)}const q=P.trail[P.trail.length-1];mgs('wind'+mgFrame(3,110),q.x,q.y)}/* 指の風 */
    if(now>=P.showEnd()){PXG.fillStyle='#fff6c8';for(let i=0;i<P.need;i++)PXG.fillRect(PXR(P.cx)-P.need*3+i*6+1,90,4,i<P.got?3:1)}}
  if(P.type==='trace'){if(P.pop){PXG.fillStyle='rgba(120,88,52,.55)';PXG.fillRect(0,PXR(P.cy),PLAYW,PLAYH)}PXG.fillStyle='rgba(255,255,255,.7)';P.path.forEach((p,i)=>{if(i%2===0)PXG.fillRect(PXR(p.x)-1,PXR(p.y)-1,2,2)});PXG.fillStyle='#4f93c0';pxPath(P.path.map(p=>({x:p.x,y:p.y+1})),P.reach,P.pop?4:3);PXG.fillStyle='#7fc4ec';pxPath(P.path,P.reach,P.pop?4:3);glow(P.path[0].x,P.path[0].y,10,.5,'150,210,255');{const d=P.path[P.reach];mgs('drop',d.x,d.y-2)}}
  if(P.type==='drip'){const pa=P.path,b=P.bud;if(!mgs('leafL',P.leaf.x+25,P.leaf.y+12.5,0,1)){PXG.fillStyle='#5f9e3f';pxPath(pa.map(p=>({x:p.x,y:p.y+2})),pa.length-1,7);PXG.fillStyle='#8fdc6a';pxPath(pa,pa.length-1,5);PXG.fillStyle='#bfe89a';pxPath(pa.map(p=>({x:p.x,y:p.y-1})),pa.length-1,1);PXG.fillStyle='#5f9e3f';PXG.fillRect(PXR(pa[0].x)-4,PXR(pa[0].y)-1,2,3)}/* かたむいた葉（葉のすじ・茎） */
    PXG.fillStyle='rgba(255,255,255,.6)';pa.forEach((p,i)=>{if(i>P.reach&&i%3===0)PXG.fillRect(PXR(p.x),PXR(p.y),1,1)});
    const op=P.open?Math.min(1,(now-P.open)/700):0,bx=PXR(b.x),by=PXR(b.y);if(mgOK()){if(op>0)glow(b.x,b.y-6,10,.5*(1-op*.5));mgs('bud'+Math.min(3,Math.floor(op*3.99)),b.x,b.y+3,'b')}else{PXG.fillStyle='#5f9e3f';PXG.fillRect(bx,by-2,1,4);PXG.fillStyle='#8fdc6a';if(op<=0)PXG.fillRect(bx-1,by-5,3,3);else{const n=1+PXR(op*3);PXG.fillRect(bx-n,by-3-PXR(op*2),n,2);PXG.fillRect(bx+1,by-3-PXR(op*2),n,2);PXG.fillStyle='#bfe89a';PXG.fillRect(bx,by-4-PXR(op*2),1,2);glow(b.x,b.y-3,10,.5*(1-op*.5))}}/* 芽：とどくと、ひらく */
    if(!P.open){const d=pa[P.reach];glow(d.x,d.y-1,7,P.hold?.25:.4+.2*Math.sin(t*5),'150,210,255');if(!mgs('drop',d.x,d.y-3)){PXG.fillStyle='#4f93c0';pxDisk(d.x,d.y-1,2);PXG.fillStyle='#7fc4ec';pxDisk(d.x,d.y-2,1);PXG.fillStyle='#ffffff';PXG.fillRect(PXR(d.x)-1,PXR(d.y)-3,1,1)}}/* しずく */
    if(P.fall&&now-P.fall.t<600){const u=(now-P.fall.t)/600;if(!mgs('drop',P.fall.x,P.fall.y+u*u*30)){PXG.fillStyle='#7fc4ec';pxDisk(P.fall.x,P.fall.y+u*u*30,1)}}}
  if(P.type==='swipe'){const sw=P.sway&&now-P.sway<900?Math.sin((now-P.sway)/90)*(1-(now-P.sway)/900)*4:0,gu=P.gust&&now-P.gust<600?Math.sin((now-P.gust)/30)*3:0;pxLeaf(P.cx,P.cy-24,(sw+gu)*.08,'#8fdc6a','#5f9e3f');const d=P.down;if(d){PXG.fillStyle='rgba(255,255,255,.6)';pxLine(d.x,d.y,d.last.x,d.last.y,2)}}
  if(P.type==='gather'){const dt=Math.min(.1,(now-(P.lt||now))/1000);P.lt=now;if(P.holding&&P.got<P.need){P.prog+=dt*1.25;if(P.prog>=P.got+1){const r=P.order[P.got];P.got++;if(r){faceTo(r,(Math.floor(P.cy/TS))*W+Math.floor(P.cx/TS));JUMP.set(r,now);fxSpr('twinkle',r.x*TS,r.y*TS-14)}sfx('tap');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need){P.holding=false;setTimeout(sacredPlayWin,700)}}}
    PXG.fillStyle='rgba(255,246,200,.75)';for(let i=0;i<P.got;i++){const r=P.order[i];if(!r)continue;pxLine(r.x*TS,r.y*TS-12,P.cx,P.cy-6,2);glow(r.x*TS,r.y*TS-12,10,.45);mgs('spark'+((mgFrame(4,140)+i)%4),r.x*TS,r.y*TS-14)}/* 力をおくった子から、切り株へ光の線 */
    glow(P.cx,P.cy-6,18+P.got*4,.25+.1*Math.sin(t*4)+P.got*.06);if(!P.holding&&P.got<P.need){PXG.fillStyle='rgba(255,246,200,'+(.5+.3*Math.sin(t*4))+')';pxRing(P.cx,P.cy-6,PXR(20+2*Math.sin(t*4)),2)}/* 長おしする所に、光の輪 */
    if(P.got)mgs('spark'+mgFrame(4,120),P.cx,P.cy-10);if(P.holding){const f=P.prog-P.got;PXG.fillStyle='#fff6c8';pxRing(P.cx,P.cy-6,20,3,f)}}
  if(P.msg&&now-P.msgT<1400)pxText(P.msg,P.cx,P.pop?14:P.cy-36);else if(PXTXT.c&&!P.msg)pxTextFree();}
function drawSacredPlay(now){const P=SPLAY;if(!sacredPlayActive())return;if(P.pop)return drawSacredPlayPop(now);const lw=Math.ceil(VW/cam.z)+2,lh=Math.ceil(VH/cam.z)+2+LIFT*3;if(!PX.c){PX.c=document.createElement('canvas');PX.g=PX.c.getContext('2d')}if(PX.c.width!==lw||PX.c.height!==lh){PX.c.width=PX.w=lw;PX.c.height=PX.h=lh}PXG=PX.g;const ox=Math.floor(cam.x),oy=Math.floor(cam.y);/* 見えている所ぜんぶ（段差の高さのぶん下も） */PXG.setTransform(1,0,0,1,0,0);PXG.clearRect(0,0,PX.w,PX.h);PXG.save();PXG.translate(-ox,-oy);sacredPlayPaint(P,now);
  PXG.restore();if(PX.c){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(PX.c,ox,oy);ctx.restore()}}/* とちゅうで出番がおわったら（PX.c をすてたあと）、かかない */
/* ポップアップの出番：わくつきのパネルに、切り株とその出番だけをかく（世界の1を1ドット。切り株の絵は2倍の細かさ） */
const PLAYW=128,PLAYH=96,PLAYBASE=68,PLAYK=2;
function sacredPlayPopOpen(P,title){sacredPlayPopFree();const o=el('<div id="playPop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.35);padding:16px"><div class="pxcard" style="background:var(--panel);padding:14px 14px 12px;max-width:min(420px,calc((100dvh - 120px) * 4 / 3 + 28px));width:100%;color:var(--ink);text-align:center"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note h" style="margin:0 0 8px"></p><canvas style="display:block;width:100%;image-rendering:pixelated;touch-action:none"></canvas></div></div>');
  o.querySelector('.t').textContent=title;const cvs=o.querySelector('canvas');cvs.width=PLAYW*PLAYK;cvs.height=PLAYH*PLAYK;P.popEl=o;P.popCv=cvs;P.popHint=o.querySelector('.h');document.body.appendChild(o);
  const at=e=>{const r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*PLAYW,y:(e.clientY-r.top)/r.height*PLAYH}};
  for(const [ev,fn] of [['pointerdown',sacredPlayDown],['pointermove',sacredPlayMove],['pointerup',sacredPlayUp],['pointercancel',sacredPlayUp]])cvs.addEventListener(ev,e=>{if(SPLAY!==P||!sacredPlayActive()||!$('#dialog').hidden)return;e.preventDefault();if(ev==='pointerdown')cvs.setPointerCapture(e.pointerId);fn(at(e),performance.now())});
  o.addEventListener('pointerdown',e=>e.stopPropagation())}
function sacredPlayPopFree(){const o=$('#playPop');if(o){const c=o.querySelector('canvas');if(c)c.width=c.height=0;o.remove()}}
function drawSacredPlayPop(now){const P=SPLAY,cvs=P.popCv;if(!cvs||!cvs.isConnected)return;const g=cvs.getContext('2d');PXG=g;g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.fillStyle='#a9c97a';g.fillRect(0,0,cvs.width,cvs.height);g.fillStyle='#9cbd6c';for(let y=0;y<PLAYH;y+=6)for(let x=(y/6&1)*5;x<PLAYW;x+=10)g.fillRect(x*PLAYK,y*PLAYK,PLAYK,PLAYK);/* 草地：うすい点々 */
  g.setTransform(PLAYK,0,0,PLAYK,0,0);g.fillStyle='rgba(66,53,28,.18)';pxDisk(P.cx,P.cy-8,30,7);if(S.sacredRoot!=null&&typeof drawStoryTreeFrame==='function')drawStoryTreeFrame(g,P.cx-64,P.cy-122,S.sacredRoot,now);/* 村と同じ切り株（いまの育ちぐあい） */
  sacredPlayPaint(P,now);g.setTransform(1,0,0,1,0,0)}
/* 調べを1回はじめたら、その話の最後まで自動で続ける（会話のあと3秒あける） */
function tryFieldAuto(r){const q=fieldStoryCurrent();if(!q||isNight()||!$('#dialog').hidden||sacredPlayActive())return false;const st=fieldStoryState(q.id);if(!st?.auto||fieldStoryDone(q.id))return false;
  const step=FIELD_STORIES[q.id][st.step];if(!step||fieldStoryActor(step)!==r)return false;if(r.act&&['eat','fetch','flee','faint','pray','bury','fieldstory','fieldassist'].includes(r.act.type))return false;/* 遊び・散歩などは、やめて調べへ */
  if(performance.now()<(FIELD_AUTO_AT.get(S)||0))return false;FIELD_AUTO_AT.set(S,performance.now()+2000);return fieldStoryStart(q,true)}
const FIELD_AUTO_AT=new WeakMap();
