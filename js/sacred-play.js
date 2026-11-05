'use strict';
/* 御神木の調べ：村での準備と、守り神の出番（指でする操作）。調べは1回タップすると、その話の最後まで自動で続く。 */
const fieldNear=(j,R,f)=>{const s=fieldStump(j),sx=s%W,sy=s/W|0;for(let y=sy-R;y<=sy+R;y++)for(let x=sx-R;x<=sx+R;x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x,o=S.obj[k]==='part'?S.obj[S.ref[k]]:S.obj[k];if(o&&f(o,k))return true}return false};
/* 調べの前に、その調べのために作る物（作る・建てる → 切り株のそばに置く）。依頼を受けてから、この調べのために置いた物だけを数える（前からある物では進まない） */
const FIELD_PREP={
  earthRoot:{label:'切り株のそばに、あぜ道を3マスしこう',build:{ids:['path'],n:3},legacy:j=>!fieldNear(j,2,o=>WEEDS.has(o))},
  fireRoot:{label:'切り株のそばに、たき火を置こう',build:{ids:['campfire']},learn:['campfire'],legacy:j=>fieldNear(j,3,o=>o==='campfire')},
  waterFilm:{label:'切り株のそばに、みずがめを置こう',build:{ids:['jar']},learn:['jar'],legacy:j=>fieldNear(j,3,o=>o==='well'||o==='jar')},
  windEcho:{label:'切り株のそばに、風車を建てよう',wait:'風車ができあがるのを待とう',build:{ids:['windmill']},learn:['windmill'],legacy:j=>fieldNear(j,3,o=>o==='lily')},
  tower:{label:'切り株のそばに、ベンチを置こう',build:{ids:['bench']},learn:['bench'],legacy:()=>false}
};
const FIELD_NEAR_R=3;
const fieldBuildHas=(k,ids)=>ids.includes(S.obj[k])||ids.includes(S.floor[k]);
function fieldBuildCount(id){const p=FIELD_PREP[id],b=fieldStoryState(id)?.built;if(!p||!b)return 0;if(b.legacy)return p.build.n||1;return (b.cells||[]).filter(k=>fieldBuildHas(k,p.build.ids)).length}
const fieldBuildOK=id=>fieldBuildCount(id)>=(FIELD_PREP[id]?.build?.n||1);
/* 作った物のマス（なかまが見にいく所）。古いセーブで前の準備のまま進めたときは、なし */
function fieldBuiltCell(id){const p=FIELD_PREP[id],b=fieldStoryState(id)?.built;if(!p||!b||b.legacy)return null;const k=(b.cells||[]).find(k=>fieldBuildHas(k,p.build.ids));return k==null?null:k}
/* 置いたとき（place）：いまの調べが作る物を待っていて、切り株のそばなら、この調べの物として記録する */
function fieldBuildNote(id,j){if(IS_STORY_REPLAY)return;const q=fieldStoryCurrent();if(!q)return;const fid=q.id,p=FIELD_PREP[fid];if(!p||!p.build.ids.includes(id)||S.sacredRoot==null||fieldDistance(j,S.sacredRoot)>FIELD_NEAR_R)return;
  const st=fieldStoryEnsure(fid);if(!st||(st.step||0)>0||fieldBuildOK(fid))return;const b=st.built||(st.built={cells:[]});if(b.legacy)return;if(!b.cells.includes(j))b.cells.push(j);dirty=true;renderQuest();}
function fieldPrepNeed(id){const st=fieldStoryState(id),p=FIELD_PREP[id],j=S.sacredRoot;if(IS_STORY_REPLAY||!p||j==null||(st?.step||0)>0||fieldBuildOK(id))return null;{const nw=(p.learn||[]).filter(k=>!S.recipes[k]);recipeNotice(nw);for(const k of nw){S.recipes[k]=true;dirty=true}}/* 古いセーブでも、準備に使う物を作れるように */
  const n=p.build.n||1,b=st?.built;if(n>1)return {...p,label:p.label+'（'+fieldBuildCount(id)+'/'+n+'）'};
  if(p.wait&&b&&!b.legacy&&(b.cells||[]).some(k=>S.obj[k]==='site'&&S.dyn[k]?.build===p.build.ids[0]))return {...p,label:p.wait};return p}
/* 古いセーブ：いまの依頼で、前の準備（その時の決まり）がもうそろっていた調べは、そのまま進める（1回だけ） */
function migrateFieldBuild(state){if(!state.flags||state.flags.fieldBuild1)return;state.flags.fieldBuild1=1;if(state.free||(state.world||0)!==0||state.sacredRoot==null||!state.qTalked||state.qStory!=null)return;
  const q=QUESTS1[state.quest];if(!q?.fieldParts)return;const S0=S;S=state;try{{const id=q.fieldParts.find(p=>((state.fieldStories?.[p]?.step)||0)<(FIELD_STORIES[p]?.length||0)),p=id&&FIELD_PREP[id],st=state.fieldStories?.[id];if(p&&!((st?.step||0)>0)&&!st?.built)if(p.legacy(state.sacredRoot)){state.fieldStories||(state.fieldStories={});(state.fieldStories[id]||(state.fieldStories[id]={step:0})).built={legacy:1};}}}finally{S=S0}}
/* 守り神の出番：その話の、どの段階で、どんな操作か。pop：地図を見なくてよい出番は、ポップアップの中で（その見出し） */
const FIELD_PLAY={
  earthRoot:{phase:0,type:'root',hint:'光る根の先から、根を指でなぞって土から出す。はずれると根が切れて、はじめから',bonus:{items:{bellf:2}}},
  fireRoot:{phase:0,type:'hold',pop:'石をあたためる',hint:'石を長おしして、ゲージが緑のときにはなす',bonus:{fun:10}},
  fireTrace:{phase:2,type:'cover',pop:'草をかぶせる',hint:'青く光るつめたい所をタップ'},
  waterFilm:{phase:2,type:'trace',hint:'光る所から、水の通り道を指でなぞって根までつなぐ',bonus:{items:{lotus:2}}},
  waterLeaf:{phase:1,type:'wait',pop:'芽を見守る',hint:'芽にふれずに、まつ'},
  windEcho:{phase:0,type:'rhythm',pop:'葉の音を聞く',hint:'光ってゆれた葉をタップ',bonus:{items:{lily:2}}},
  windVoices:{phase:4,type:'gather',hint:'切り株を長おしして、みんなの力をあつめる'}
};
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
  if(P.type==='cover'){P.spots=ring(6,36,14,.2);const c=new Set();let k=0;while(c.size<3)c.add((hash((S.sacredRoot||0)*3+k++)*6)|0);P.cold=c;P.covered=new Set();P.need=3}
  if(P.type==='hold'){P.stone={x:cx+20,y:cy+12};P.heat=0;P.holding=false}
  if(P.type==='root'){P.path=[];for(let i=0;i<=28;i++){const u=i/28;P.path.push({x:cx+30-u*58,y:cy+26-u*20+Math.sin(u*Math.PI*3)*5})}P.reach=0;P.tip=0}/* 根の先（土の深い所）から、地面の上（切り株の根元）へ */
  if(P.type==='rhythm'){P.leaves=[-1,0,1].map(k=>({x:cx+k*20,y:cy-22-Math.abs(k)*4}));P.need=4;P.beat=null;P.nextBeat=now+900}
  if(P.type==='trace'){P.path=[];for(let i=0;i<=24;i++){const u=i/24;P.path.push({x:cx-74+u*66,y:cy+16-Math.sin(u*Math.PI)*14+u*-6})}P.reach=0}
  if(P.type==='wait'){P.ms=6000;P.since=now;P.shrink=0}
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
  if(b.items){for(const[id,n]of Object.entries(b.items))giveItem(id,n);queueItemGift(b.items,'うまくできた！')}
  if(b.fun)for(const r of P.cast||[]){r.fun=Math.min(100,r.fun+b.fun);addFloat(r.x,r.y-1.4,'たのしさ+'+b.fun)}}
/* しっぱい：数えて、3回でおわり（お話は進む） */
function sacredPlayMiss(t){const P=SPLAY;if(!P)return;P.fails=(P.fails||0)+1;sacredPlayMsg(t);if(P.fails<PLAY_MISS){sacredPlayHint(P.hint+sacredPlayCount());return}sacredPlayClose();if(P.owner!==S||P.session!==VILLAGE_SESSION)return;sfx('tap');P.done()}
function sacredPlayClose(){SPLAY=null;sacredPlayHint('');pxTextFree();pxLayerFree();sacredPlayPopFree()}
function cancelSacredPlay(){sacredPlayClose()}
function sacredPlayMsg(t){const P=SPLAY;if(!P)return;P.msg=t;P.msgT=performance.now()}
function sacredPlayNear(w,p,r){return Math.hypot(w.x-p.x,w.y-p.y)<=r}
/* 指の動き（世界の座標） */
function sacredPlayDown(w,now){const P=SPLAY;P.down={x:w.x,y:w.y,t:now,last:{x:w.x,y:w.y,t:now}};
  if(P.type==='cover'){P.spots.forEach((s,i)=>{if(!sacredPlayNear(w,s,10)||P.covered.has(i))return;if(P.cold.has(i)){P.covered.add(i);P.got=P.covered.size;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,500)}else sacredPlayMsg('ここは、あたたかい')})}
  else if(P.type==='hold'){if(sacredPlayNear(w,P.stone,14)){P.holding=true;P.heat=0}}
  else if(P.type==='wait'){P.since=now;P.shrink=now;sacredPlayMsg('そっと……')}
  else if(P.type==='gather'){if(sacredPlayNear(w,{x:P.cx,y:P.cy-6},26))P.holding=true}
  else if(P.type==='trace'){P.tracing=sacredPlayNear(w,P.path[0],12);P.reach=0}
  else if(P.type==='root'){P.tracing=sacredPlayNear(w,P.path[P.reach],12)}/* 切れたら、根の先から（reach=0）。とちゅうではなしたら、そこからつづけられる */
  else if(P.type==='rhythm'){const b=P.beat;let hit=-1;P.leaves.forEach((l,i)=>{if(sacredPlayNear(w,l,11))hit=i});if(hit<0)return;if(b&&b.leaf===hit&&!b.hit&&now-b.t<560){b.hit=true;P.got++;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,500)}else sacredPlayMiss(b&&!b.hit&&b.leaf!==hit?'そっちじゃない':'まだ、ゆれていない')}
}
function sacredPlayMove(w,now){const P=SPLAY,d=P.down;if(!d)return;const l=d.last,dt=Math.max(1,now-l.t)/1000,dist=Math.hypot(w.x-l.x,w.y-l.y),v=dist/dt;d.last={x:w.x,y:w.y,t:now};
  if(P.type==='brush'){const a=P.area;if(w.x<a.x||w.x>a.x+a.w||w.y<a.y-6||w.y>a.y+a.h)return;if(v>260){if(P.prog>0)sacredPlayMsg('つよすぎる。そっと');P.prog=Math.max(0,P.prog-.25);return}P.prog=Math.min(1,P.prog+dist/360);if(Math.random()<.3)fx.push({k:'p',x:w.x,y:w.y,vx:(Math.random()-.5)*30,vy:-30,life:.6,col:'#b4925e',r:2});if(P.prog>=1)sacredPlayWin()}
  else if(P.type==='root'&&P.tracing){let best=-1,bd=1e9;for(let i=Math.max(0,P.reach-2);i<=Math.min(P.path.length-1,P.reach+4);i++){const p=P.path[i],dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}}if(bd>10){P.tracing=false;P.reach=0;P.snap=now;sfx('hit');sacredPlayMiss('根が切れちゃった');return}if(best>P.reach){P.reach=best;if(Math.random()<.4)fx.push({k:'p',x:w.x,y:w.y,vx:(Math.random()-.5)*30,vy:-30,life:.6,col:'#b4925e',r:2})}if(P.reach>=P.path.length-1)sacredPlayWin()}
  else if(P.type==='trace'&&P.tracing){let best=-1,bd=1e9;P.path.forEach((p,i)=>{const dd=Math.hypot(w.x-p.x,w.y-p.y);if(dd<bd){bd=dd;best=i}});if(bd>12){P.tracing=false;P.reach=0;sacredPlayMiss('こぼれちゃった');return}if(best>=P.reach&&best<=P.reach+3)P.reach=best;if(P.reach>=P.path.length-1)sacredPlayWin()}
}
function sacredPlayUp(w,now){const P=SPLAY,d=P.down;P.down=null;
  if(P.type==='hold'&&P.holding){P.holding=false;if(P.heat>=.58&&P.heat<=.84){sfx('bush');sacredPlayWin()}else if(P.heat<.6)sacredPlayMsg('まだ、つめたい');else sacredPlayMiss('こげちゃった')}
  else if(P.type==='swipe'&&d){const len=Math.hypot(w.x-d.x,w.y-d.y),ms=now-d.t;if(len<18)return;if(len>110||ms<140){sacredPlayMsg('つよすぎる。やさしく');P.gust=now;return}P.got++;P.sway=now;sfx('bush');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need)setTimeout(sacredPlayWin,600)}
  else if(P.type==='trace'||P.type==='root')P.tracing=false;
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
  if(P.type==='cover'){P.spots.forEach((s,i)=>{if(P.covered.has(i)){PXG.fillStyle='#c9b46a';for(let k=-2;k<=2;k++)PXG.fillRect(PXR(s.x)+k*2,PXR(s.y)-3+Math.abs(k),1,4)}else if(P.cold.has(i))glow(s.x,s.y,9,.65+.15*Math.sin(t*3+i),'150,205,255');else glow(s.x,s.y,7,.3,'255,214,150')})}
  if(P.type==='hold'){const s=P.stone;{const dt=Math.min(.1,(now-(P.lt||now))/1000);P.lt=now;if(P.holding)P.heat=Math.min(1.05,P.heat+dt*.55)}if(P.heat>1){P.holding=false;P.heat=0;P.scorch=now;sacredPlayMiss('こげちゃった')}
    const hc=k=>`rgb(${Math.min(255,(120+P.heat*120)*k)|0},${Math.min(255,(110+P.heat*40)*k)|0},${Math.min(255,(105-P.heat*40)*k)|0})`;PXG.fillStyle=hc(.75);pxDisk(s.x,s.y+1,6,4);PXG.fillStyle=hc(1);pxDisk(s.x,s.y,6,4);PXG.fillStyle=hc(1.25);PXG.fillRect(PXR(s.x)-3,PXR(s.y)-3,3,1);glow(s.x,s.y,10+P.heat*8,.2+P.heat*.4,'255,170,90');
    const bx=PXR(s.x)-16,by=PXR(s.y)-18;PXG.fillStyle='#4a3424';PXG.fillRect(bx-1,by-1,34,6);PXG.fillStyle='#7a6048';PXG.fillRect(bx,by,32,4);PXG.fillStyle='#8fdc6a';PXG.fillRect(bx+19,by,8,4);PXG.fillStyle='#ffb347';PXG.fillRect(bx,by+1,PXR(32*Math.min(1,P.heat)),2)}
  if(P.type==='brush'){const a=P.area;PXG.globalAlpha=.7*(1-P.prog);PXG.fillStyle='#9c7a52';pxDisk(a.x+a.w/2,a.y+a.h/2,a.w/2,a.h/2);PXG.globalAlpha=P.prog;PXG.fillStyle='#d9b98a';{let q=null;for(let i=0;i<=16;i++){const u=i/16,x=(1-u)**2*(a.x+6)+2*u*(1-u)*(a.x+a.w/2)+u*u*(a.x+a.w-6),y=(1-u)**2*(a.y+12)+2*u*(1-u)*(a.y+2)+u*u*(a.y+14);if(q)pxLine(q.x,q.y,x,y,1);q={x,y}}}PXG.globalAlpha=1}
  if(P.type==='root'){const pa=P.path,sn=P.snap&&now-P.snap<500;PXG.fillStyle='rgba(120,88,52,.75)';pxDisk(P.cx,P.cy+18,40,14);/* 根の上の土 */PXG.fillStyle=sn?'rgba(232,120,110,.8)':'rgba(255,246,200,.55)';pa.forEach((p,i)=>{if(i>P.reach&&i%2===0)PXG.fillRect(PXR(p.x)-1,PXR(p.y)-1,2,2)});PXG.fillStyle='#9c7a52';pxPath(pa.map(p=>({x:p.x,y:p.y+1})),P.reach,3);PXG.fillStyle='#d9b98a';pxPath(pa,P.reach,3);const tp=pa[P.reach];glow(tp.x,tp.y,10,.45+.15*Math.sin(t*5),'255,236,170')}
  if(P.type==='rhythm'){if(!P.beat||now-P.beat.t>700){if(now>=P.nextBeat){P.beat={t:now,leaf:(hash(now|0)*3)|0,hit:false};P.nextBeat=now+900+hash((now|0)+3)*700}}const b=P.beat;P.leaves.forEach((l,i)=>{const on=b&&b.leaf===i&&now-b.t<520,sw=on?Math.sin((now-b.t)/50)*.5:0;if(on&&!b.hit)glow(l.x,l.y,12,.55);pxLeaf(l.x,l.y,sw,b&&b.leaf===i&&b.hit?'#bfe89a':'#8fdc6a','#5f9e3f')})}
  if(P.type==='trace'){PXG.fillStyle='rgba(255,255,255,.7)';P.path.forEach((p,i)=>{if(i%2===0)PXG.fillRect(PXR(p.x)-1,PXR(p.y)-1,2,2)});PXG.fillStyle='#4f93c0';pxPath(P.path.map(p=>({x:p.x,y:p.y+1})),P.reach,3);PXG.fillStyle='#7fc4ec';pxPath(P.path,P.reach,3);glow(P.path[0].x,P.path[0].y,10,.5,'150,210,255')}
  if(P.type==='wait'){const p=Math.min(1,(now-P.since)/P.ms),sh=Math.max(0,1-(now-P.shrink)/800);PXG.fillStyle='#c8ffd0';pxRing(P.cx,P.cy-18,12,2,p);PXG.fillStyle='#8fdc6a';const s=1-sh*.5,w=Math.max(2,PXR(6*s));PXG.fillRect(PXR(P.cx)-(w>>1),PXR(P.cy)-20,w,Math.max(2,PXR(4*s)));if(p>=1)sacredPlayWin()}
  if(P.type==='swipe'){const sw=P.sway&&now-P.sway<900?Math.sin((now-P.sway)/90)*(1-(now-P.sway)/900)*4:0,gu=P.gust&&now-P.gust<600?Math.sin((now-P.gust)/30)*3:0;pxLeaf(P.cx,P.cy-24,(sw+gu)*.08,'#8fdc6a','#5f9e3f');const d=P.down;if(d){PXG.fillStyle='rgba(255,255,255,.6)';pxLine(d.x,d.y,d.last.x,d.last.y,2)}}
  if(P.type==='gather'){const dt=Math.min(.1,(now-(P.lt||now))/1000);P.lt=now;if(P.holding&&P.got<P.need){P.prog+=dt*1.25;if(P.prog>=P.got+1){const r=P.order[P.got];P.got++;if(r){faceTo(r,(Math.floor(P.cy/TS))*W+Math.floor(P.cx/TS));JUMP.set(r,now);fxSpr('twinkle',r.x*TS,r.y*TS-14)}sfx('tap');sacredPlayHint(P.hint+sacredPlayCount());if(P.got>=P.need){P.holding=false;setTimeout(sacredPlayWin,700)}}}
    PXG.fillStyle='rgba(255,246,200,.75)';for(let i=0;i<P.got;i++){const r=P.order[i];if(!r)continue;pxLine(r.x*TS,r.y*TS-12,P.cx,P.cy-6,2);glow(r.x*TS,r.y*TS-12,10,.45)}/* 力をおくった子から、切り株へ光の線 */
    glow(P.cx,P.cy-6,18+P.got*4,.25+.1*Math.sin(t*4)+P.got*.06);if(!P.holding&&P.got<P.need){PXG.fillStyle='rgba(255,246,200,'+(.5+.3*Math.sin(t*4))+')';pxRing(P.cx,P.cy-6,PXR(20+2*Math.sin(t*4)),2)}/* 長おしする所に、光の輪 */
    if(P.holding){const f=P.prog-P.got;PXG.fillStyle='#fff6c8';pxRing(P.cx,P.cy-6,20,3,f)}}
  if(P.msg&&now-P.msgT<1400)pxText(P.msg,P.cx,P.pop?14:P.cy-36);else if(PXTXT.c&&!P.msg)pxTextFree();}
function drawSacredPlay(now){const P=SPLAY;if(!sacredPlayActive())return;if(P.pop)return drawSacredPlayPop(now);const lw=Math.ceil(VW/cam.z)+2,lh=Math.ceil(VH/cam.z)+2+LIFT*3;if(!PX.c){PX.c=document.createElement('canvas');PX.g=PX.c.getContext('2d')}if(PX.c.width!==lw||PX.c.height!==lh){PX.c.width=PX.w=lw;PX.c.height=PX.h=lh}PXG=PX.g;const ox=Math.floor(cam.x),oy=Math.floor(cam.y);/* 見えている所ぜんぶ（段差の高さのぶん下も） */PXG.setTransform(1,0,0,1,0,0);PXG.clearRect(0,0,PX.w,PX.h);PXG.save();PXG.translate(-ox,-oy);sacredPlayPaint(P,now);
  PXG.restore();if(PX.c){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(PX.c,ox,oy);ctx.restore()}}/* とちゅうで出番がおわったら（PX.c をすてたあと）、かかない */
/* ポップアップの出番：わくつきのパネルに、切り株とその出番だけをかく（世界の1を1ドット。切り株の絵は2倍の細かさ） */
const PLAYW=128,PLAYH=96,PLAYBASE=68,PLAYK=2;
function sacredPlayPopOpen(P,title){sacredPlayPopFree();const o=el('<div id="playPop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.35);padding:16px"><div class="pxcard" style="background:var(--panel);padding:14px 14px 12px;max-width:360px;width:100%;color:var(--ink);text-align:center"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note h" style="margin:0 0 8px"></p><canvas style="display:block;width:100%;image-rendering:pixelated;touch-action:none"></canvas></div></div>');
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
