'use strict';

// せいれいは道（道・石だたみ）を優先して歩く：道は1マス2、ほかは3の重みで最短を探す
const FSPD={path:1.25,floor:1.15,brickfloor:1.15,stonefloor:1.15,herrfloor:1.15,carpet:1,gravel:1.4,woodpath:1.55,stone:1.55,brick:1.75},FCOST={path:4,floor:5,brickfloor:5,stonefloor:5,herrfloor:5,carpet:6,gravel:4,woodpath:3,stone:3,brick:3};// 道の速さと、道えらびの重み（ふつうは6）
function bfs(sx,sy,enemy){if(!enemy)return roadSearch(sx,sy);return bfs0(sx,sy,enemy)}
function roadSearch(sx,sy,block){
  const N=W*H,dist=new Int16Array(N).fill(-1),prev=new Int32Array(N).fill(-1),cost=new Int32Array(N).fill(-1),B=[];
  const s=clamp(sy,0,H-1)*W+clamp(sx,0,W-1);cost[s]=0;dist[s]=0;B[0]=[s];
  for(let c=0;c<B.length;c++){const L=B[c];if(!L)continue;for(const i of L){if(cost[i]!==c)continue;const x=i%W,y=(i/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(!walk(j)&&!(S.ground[i]===1&&S.ground[j]===1&&!solidOf(j))||block&&block.has(j)||cliff2(i,j))continue;/* 水の中にいるときは、水の中も歩ける */
      const fl=S.floor[j],nc=c+(FCOST[fl]||6)*(jumpEdge(i,j)?5:1)*(S.ground[j]===2?2:1)*(onLadder(i,j)?2:1);/* せいれいは、段差をよじのぼると5倍の手間（階段・坂をえらびやすい） *//* 段差を飛ぶのは、歩くより3倍の手間 */if(cost[j]>=0&&cost[j]<=nc)continue;
      cost[j]=nc;dist[j]=dist[i]+1;prev[j]=i;(B[nc]||(B[nc]=[])).push(j)}}}
  return {dist,prev};
}
function bfs0(sx,sy,enemy){
  const dist=new Int16Array(W*H).fill(-1),prev=new Int32Array(W*H).fill(-1),q=new Int32Array(W*H);
  let h=0,t=0;const s=clamp(sy,0,H-1)*W+clamp(sx,0,W-1);dist[s]=0;q[t++]=s;
  while(h<t){const i=q[h++],x=i%W,y=(i/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(dist[j]>=0)continue;
      if(wetJ(j)||cliff2(i,j))continue;if((solidOf(j)||HOME_DOORS.has(typeAt(j))||GATE_IDS.has(typeAt(j)))&&(enemy===2||!breakable(typeAt(j))))continue;
      dist[j]=dist[i]+1;prev[j]=i;q[t++]=j}}
  return {dist,prev};
}
/* コワイノの道さがし：まわり道と、壁をこわす手間をくらべる（うすい壁・弱い壁ほどねらわれる）。sdで1体ずつ道が少しちがう */
function bfsE(sx,sy,wk,sd){
  const N=W*H,dist=new Int16Array(N).fill(-1),prev=new Int32Array(N).fill(-1),cost=new Int32Array(N).fill(-1),B=[];
  const s=clamp(sy,0,H-1)*W+clamp(sx,0,W-1);cost[s]=0;dist[s]=0;B[0]=[s];
  for(let c=0;c<B.length;c++){const L=B[c];if(!L)continue;for(const i of L){if(cost[i]!==c)continue;const x=i%W,y=(i/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(wetJ(j)||cliff2(i,j))continue;
      let add=2+((Math.imul(j^sd,2654435761)>>>29)&1);const o=typeAt(j);
      if(jumpEdge(i,j))add*=3;/* 段差を飛ぶのは3倍 */if(S.ground[j]===2)add*=2;/* 浅瀬は2倍 */if(solidOf(j)||HOME_DOORS.has(o)||GATE_IDS.has(o)){if(!breakable(o))continue;add+=wk}/* 壁はどれも同じ手間（守りの薄い所をねらうことはしない） */
      const nc=c+add;if(cost[j]>=0&&cost[j]<=nc)continue;cost[j]=nc;dist[j]=dist[i]+1;prev[j]=i;(B[nc]||(B[nc]=[])).push(j)}}}
  return {dist,prev};
}
function pathTo(G,j){const p=[];while(j>=0&&G.dist[j]>0){p.push(j);j=G.prev[j]}return p.reverse()}
// ほかの子がいる・向かっているマスは避けて、空いている別のマスから作業する（空きがなければ同じマスも使う）
let TAKEN=null;
let WEEDNEAR=0;function wreqList(){/* 「みる」でタップした草・きのこ（のこっている物だけ） */const q=S.wreq;if(!q)return [];const L=[];for(const k in q){if(WEEDS.has(S.obj[+k]))L.push(+k);else delete q[k]}return L}
function nearest(G,pred,maxD=60){let best=-1,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>=bd||d>maxD)continue;if(TAKEN&&TAKEN.has(j))continue;if(pred(j)){best=j;bd=d}}
  return best}
function nearestVia(G,G2,pred,maxD=60){let best=-1,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j],d2=G2.dist[j];if(d<0||d2<0||d>maxD||d+d2>=bd)continue;if(TAKEN&&TAKEN.has(j))continue;if(pred(j)){best=j;bd=d+d2}}
  return best}/* よりみち：いまの場所 → ここ → G2 のはじまりまで、いちばん近くなるマス（料理の材料をとる箱など） */

/* ---------- 演出 ---------- */
/* 作業する物の方を向く（木・岩） */
function faceTo(r,j){if(j==null||j<0)return;const ox=j%W+.5,oy=((j/W)|0)+.5;if(Math.abs(ox-r.x)>.15)r.face=ox>=r.x?1:-1;r.faceObj=j}
const floats=[],shots=[],fx=[],pops=new Map(),RLVQ=[];
function addFloat(x,y,text,color){if(floats.length>40)floats.shift();floats.push({x,y,text,color:color||'#ecdcbc',life:1})}
/* 作業：経験値だけ（パワーは、遊ぶ・食べる・たのしいときだけ）。成長を少しゆっくりにし、端数は保存する */
function addSpiritXp(n,r){if(!n||!r||r.xp==null)return;const before=rLv(r),scaled=(n+XPBL[before])*.8+(r.xpf||0),whole=Math.floor(scaled+1e-9);r.xpf=Math.round((scaled-whole)*1000)/1000;r.xp+=whole;const after=rLv(r);if(after>before){addFloat(r.x,r.y-1.8,'Lv'+after+'!','#9ff0ff');RLVQ.push({id:r.id,from:before,to:after})}}

const DINEPT=[1,1,2,2,3,3,4];/* 家の中の食卓で食べたときの経験値：ダイニング家具の数（0〜6）ごと */
const HOUSEPW=[.45,.45,.9,.9,1.35,1.35,1.8];/* 家の中の食卓で食べたときのパワー（[ダイニング家具の数]） */
const LVPW=[0,0,0,.45,.45,.9,.9,1.35,1.35,1.8,1.8,2.25,2.25,2.7,2.7,3.15,3.15,3.6,3.6,4.05,4.05];/* せいれいのレベルで足されるパワー（[レベル]） */
function addPt(pw,r,xp){if(!pw&&!xp)return;/* pw：もらえるパワー、xp：せいれいの経験値（どちらも実数） */
  if(r&&r.xp!=null){addSpiritXp(xp,r);pw+=LVPW[Math.min(LVPW.length-1,rLv(r))]}/* レベルアップは、ゲームを止めて知らせる */
  S.ptFrac=(S.ptFrac||0)+pw;let n=Math.floor(S.ptFrac+1e-9);S.ptFrac=Math.max(0,S.ptFrac-n);if(!n)return;/* パワーは小数のまま足していき、1たまるごとにふえる */
  S.pt+=n;S.totalPt+=n;if(r)addFloat(r.x,r.y-1,'+'+n,'#ecdcbc')}
function burst(j,kind,snd){
  const cx=(j%W)*TS+16,cy=((j/W)|0)*TS+18;
  const cols=kind==='block'?['#e2cd98','#b4925e','#fff6dc']:kind==='plant'?['#8fe07a','#ffd35c','#ff9cc0','#fff']:['#ffe27a','#fff','#9ff0ff','#ffb35c'];
  fx.push({k:'ring',x:cx,y:cy,life:1});
  for(let n=0;n<16;n++){const a=Math.random()*Math.PI*2,s=rnd(40,110);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:1,col:pick(cols),r:rnd(1.5,3)})}
  if(kind!=='block')for(let n=0;n<6;n++){const a=Math.random()*Math.PI*2,s=rnd(20,60);fx.push({k:'star',x:cx,y:cy-8,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:1.2,col:'#fff7c0'})}
  pops.set(j,performance.now());sfxAt(snd||kind,(j%W)+.5,(j/W)|0);
}
function plantMound(c,x,y,i){const k=i==null?0:hash(i*13+5);const w=7.5+k*2,h=2.8+k*.8;c.fillStyle='rgba(54,38,24,.22)';c.beginPath();c.ellipse(x+16,y+29,w+1,h*.72,0,0,7);c.fill();c.fillStyle='#a9784f';c.beginPath();c.ellipse(x+16,y+27.5,w,h,0,Math.PI,0);c.ellipse(x+16,y+27.5,w,h*.48,0,0,Math.PI);c.fill();c.fillStyle='rgba(225,177,125,.5)';c.beginPath();c.ellipse(x+15,y+26.3,w*.58,h*.38,-.08,Math.PI,0);c.fill()}
function plantSparkle(j,id){const FK={clover:'fl_clover',bellf:'fl_bell',salvia:'fl_salvia',lily:'fl_lily',lotus:'fl_lotus'},key=FK[id]||'tree',a=ART[key],w=FLOWERS.has(id)?26:30,h=a&&a.ok?w*a.h/a.w:w,cx=(j%W)*TS+16,cy=((j/W)|0)*TS+30-h*.65;for(let n=0;n<3;n++)fx.push({k:'star',x:cx+(n-1)*8,y:cy+(n%2?3:-2),vx:(n-1)*3,vy:-rnd(5,10),life:rnd(.55,.75),col:n===1?'#fff9d8':'#dfffba'});sfxAt('sow',(j%W)+.5,(j/W)|0)}
/* ---------- 効果範囲の表示 ---------- */
// おく画面ではまわりに効く物の範囲を出す。みる画面ではタップした物の範囲をしばらく出す
const RANGE_COL={flower:'255,150,190',well:'90,170,240',windmill:'90,210,180',light:'255,190,90',watch:'255,110,110',env:'150,205,110',vane:'150,170,255',sign:'255,170,120'};
function rangeOf(o,j){if(o==='lotus')return{k:'flower',cells:2,sq:1};/* ハス：まわり2マスの四角（nearLotus） */if(FLOWERS.has(o))return{k:'flower',cells:1};if(o==='well')return{k:'well',cells:3};if(o==='windmill')return{k:'windmill',cells:5};if(o==='jar')return{k:'well',cells:1};if(o==='vane')return{k:'vane',cells:3};if(o==='signpost')return{k:'sign',cells:3};if(BL[o]&&BL[o].env)return{k:'env',cells:BL[o].er||3,sq:1};
  if(INDL.has(o)){const h=j!=null&&roomOf(j);if(!h)return{k:'light',r:1.5};let m=1;for(const k of h.set)m=Math.max(m,Math.hypot(k%W-j%W,((k/W)|0)-((j/W)|0)));return{k:'light',r:m+1.5}}
  if(o==='lamp'||o==='campfire'||o==='torch'||o==='yomawari'||o==='toro'||o==='takeakari'||o==='andon')return{k:'light',r:3.5};if(o==='lighthouse')return{k:'light',r:8};if(o==='stele')return{k:'sign',cells:5};if(o==='tower')return{k:'light',r:7};
  if(o==='watch'||o==='yogan'){const st=(o==='yogan'?YOGAN:WATCH)[(j!=null&&S.hp['L'+j])||1];return{k:'watch',r:st.range}}return null}
let SHOWR=null,MANC='あそびかた';
function drawRangeOne(o,j,x,y,strong){const R=rangeOf(o,j);if(!R)return;const col=RANGE_COL[R.k],z=BL[o].sz||[1,1],cx=(x+z[0]/2)*TS,cy=(y+z[1]/2)*TS;
  ctx.save();if(R.cells){const set=new Set(),r=R.cells;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(!R.sq&&dx*dx+dy*dy>r*r+1)continue;set.add((dx+8)*32+(dy+8))}
    ctx.fillStyle='rgba('+col+','+(strong?.28:.14)+')';for(const k of set){const dx=((k/32)|0)-8,dy=k%32-8;ctx.fillRect((x+dx)*TS,(y+dy)*TS,TS,TS)}
    ctx.strokeStyle='rgba('+col+','+(strong?.95:.6)+')';ctx.lineWidth=strong?2:1.5;ctx.beginPath();
    for(const k of set){const dx=((k/32)|0)-8,dy=k%32-8,px=(x+dx)*TS,py=(y+dy)*TS,has=(a,b)=>set.has((dx+a+8)*32+(dy+b+8));
      if(!has(0,-1)){ctx.moveTo(px,py);ctx.lineTo(px+TS,py)}if(!has(0,1)){ctx.moveTo(px,py+TS);ctx.lineTo(px+TS,py+TS)}if(!has(-1,0)){ctx.moveTo(px,py);ctx.lineTo(px,py+TS)}if(!has(1,0)){ctx.moveTo(px+TS,py);ctx.lineTo(px+TS,py+TS)}}ctx.stroke()}
  else{ctx.fillStyle='rgba('+col+','+(strong?.22:.1)+')';ctx.beginPath();ctx.arc(cx,cy,R.r*TS,0,7);ctx.fill();ctx.strokeStyle='rgba('+col+','+(strong?.95:.55)+')';ctx.lineWidth=strong?2:1.5;ctx.setLineDash([6,5]);ctx.stroke();ctx.setLineDash([])}
  ctx.restore()}
function drawRanges(now){
  if(mode==='build'){const x0=Math.floor(cam.x/TS)-7,y0=Math.floor(cam.y/TS)-7,x1=Math.ceil((cam.x+VW/cam.z)/TS)+7,y1=Math.ceil((cam.y+VH/cam.z)/TS)+7;
    const U={};// 同じ種類のマス範囲はまとめて1つの形にする
    for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const j=y*W+x,o=S.obj[j];if(!o)continue;const R=rangeOf(o,j);if(!R||R.k==='watch')continue;// 射程は「みる」でタップしたときだけ
      if(R.cells){const st=U[R.k]||(U[R.k]=new Set()),r=R.cells;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(!R.sq&&dx*dx+dy*dy>r*r+1)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)st.add(ny*W+nx)}}else drawRangeOne(o,j,x,y,false)}
    for(const k in U){const set=U[k],col=RANGE_COL[k];ctx.save();ctx.fillStyle='rgba('+col+',.14)';for(const j of set)ctx.fillRect((j%W)*TS,((j/W)|0)*TS,TS,TS);
      ctx.strokeStyle='rgba('+col+',.7)';ctx.lineWidth=1.5;ctx.beginPath();for(const j of set){const px=(j%W)*TS,py=((j/W)|0)*TS;
        if(!set.has(j-W)){ctx.moveTo(px,py);ctx.lineTo(px+TS,py)}if(!set.has(j+W)){ctx.moveTo(px,py+TS);ctx.lineTo(px+TS,py+TS)}if(!set.has(j-1)){ctx.moveTo(px,py);ctx.lineTo(px,py+TS)}if(!set.has(j+1)){ctx.moveTo(px+TS,py);ctx.lineTo(px+TS,py+TS)}}ctx.stroke();ctx.restore()}
    if(pending&&pending.kind==='one'&&rangeOf(pending.id)&&pending.id!=='watch')drawRangeOne(pending.id,null,pending.x,pending.y,true);
    if(pending&&pending.kind==='plant'&&FLOWERS.has(pending.id))for(const c of pending.cells)drawRangeOne(pending.id,null,c[0],c[1],true)}
  else if(SHOWR){if(now>SHOWR.until||S.obj[SHOWR.j]!==SHOWR.o)SHOWR=null;else drawRangeOne(SHOWR.o,SHOWR.j,SHOWR.j%W,(SHOWR.j/W)|0,true)}}
function burstAt(x,y,kind){burst((y|0)*W+(x|0),kind)}
function spawnFX(x,y,col){const cx=x*TS+16,cy=y*TS+20;
  fx.push({k:'pillar',x:cx,y:cy,vx:0,vy:0,life:1.6,col});
  for(let n=0;n<3;n++)fx.push({k:'ring',x:cx,y:cy,life:1+n*.35,col});
  for(let n=0;n<40;n++){const a=Math.random()*Math.PI*2,s=rnd(50,170);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-140,life:1.3,col:pick([col,col,'#fff','#fff7c0']),r:rnd(2,4)})}
  for(let n=0;n<14;n++){const a=Math.random()*Math.PI*2,s=rnd(30,90);fx.push({k:'star',x:cx,y:cy-20,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:1.6,col:pick(['#fff7c0',col,'#fff'])})}
  dirty=true}

/* ---------- せいれいの行動 ---------- */
function occTiles(r){const bl=new Set();for(const q of S.res)if(q!==r&&!q.hidden&&!(q.act&&q.act.stage==='walk'&&q.path&&q.path.length))bl.add((q.y|0)*W+(q.x|0));return bl}
// 止まっている子のマスを避けた道を選ぶ（なければふつうの道）
let FLEEBL=null;/* 逃げるとき、「コワイノ」のそばを通らないための通れないマス */
function avoidPath(r,G,goal){const bl=occTiles(r);if(FLEEBL)for(const k of FLEEBL)bl.add(k);bl.delete(goal);bl.delete((r.y|0)*W+(r.x|0));if(!bl.size)return pathTo(G,goal);
  const G2=roadSearch(r.x|0,r.y|0,bl);return G2.dist[goal]>=0?pathTo(G2,goal):pathTo(G,goal)}
const benchSpot=G=>nearest(G,j=>(BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j))&&free('o'+j,1),40);
const KEEPC=new Set(['store','smat','eat','fetch','flee','faint','shiver','step','chatwait','questjoy','pickdrop','pickseed']),FOODJOB=new Set(['harvest','gather','fish']),MATJOB=new Set(['chop','mine','weed']);/* 持ったままでいい行動・食べ物をあつめる作業・素材をあつめる作業 */
function startAct(r,G,type,stand,o){
  if(stand>=0&&stand===r.avoidJ&&S.t<r.avoidU&&type!=='idle')return startAct(r,G,'idle',-1,{dur:15});/* 10分止まったままだった行き先は、しばらくえらばない */
  if(!KEEPC.has(type)&&G&&!(o&&(o.run||o.hunt!=null))&&!r.coffin){let k=-1;if(matN(r)>0&&!MATJOB.has(type)&&matTot()<matCap()){k=nearest(G,j=>adjOf(j,q=>storageAt(q,'mat'))>=0,200);if(k>=0){type='smat';stand=k;o=null}}if(k<0&&carryN(r)>0&&!FOODJOB.has(type)&&S.food<foodCap()){k=nearest(G,j=>adjOf(j,q=>storageAt(q,'food'))>=0,200);if(k>=0){type='store';stand=k;o=null}}}/* べつの行動にうつる前に、持っている物を箱へしまう（同じ物をあつめる作業のつづきと、にげる・たたかう・食べるときはそのまま） */
  if(type==='idle'&&stand<0&&G&&!isNight()&&(r.restCD||0)<=S.t){const bj=benchSpot(G);if(bj>=0){type='rest';stand=bj;o={key:'o'+bj,obj:anc(bj),seat:bj,dur:Math.max(30,(o&&o.dur)||15)}}}/* ひとやすみは、あいているベンチがあればベンチで */
  r.bubble='';/* 前の行動の吹き出し（💤など）を残さない */
  r.act=Object.assign({type,stand,t:0,stage:'walk'},o||{});
  if(r.act.key)reserve(r.act.key);
  r.path=stand>=0?avoidPath(r,G,stand):[];
  if(stand>=0&&G&&G.dist[stand]<0||!r.path.length&&stand>=0&&stand!==(r.y|0)*W+(r.x|0)&&Math.abs(stand%W+.5-r.x)+Math.abs(((stand/W)|0)+.5-r.y)>1.6){noPass(r);endAct(r);r.act={type:'idle',stage:'do',t:0,dur:8};return}/* 行きたい場所に通れない */
  if(!r.path.length)beginDo(r);
}
function noPass(r){if(r.act){if(r.act.key)BAN.set(r.act.key,S.t+60);if(r.act.stand>=0){r.routeAvoid=r.routeAvoid||{};r.routeAvoid[r.act.stand]=S.t+60}}r.visitRetryAt=S.t+10;if((r.npT||0)>S.t)return;r.npT=S.t+90;addFloat(r.x,r.y-1.6,'通れないよ…','#ffd0c0')}
const workOn=j=>j!=null&&!!S&&S.res.some(r=>r.act&&r.act.stage==='do'&&r.act.obj===j&&WORKP[r.act.type]&&WORKP[r.act.type](r,r.act)!=null);/* せいれいが作業中のマス：そのマスの育ちぐあいのバーは出さない（足もとの作業のバーと二重にしない） */
const WORKP={/* 作業の進み具合（0〜1）。足もとの進捗バーに出す（建てる・直す・料理は、その場所のバーだけ出す） */
chop:(r,a)=>a.camp?a.t/20:null,mine:(r,a)=>a.camp?a.t/20:null,/* 木・岩は、その木・岩の上の「のこり」のバーだけ（足もとのバーと二重にしない） */
tend:(r,a)=>a.t/20,water:(r,a)=>a.t/(r.elem==='water'?8:16),sow:(r,a)=>a.t/10,harvest:(r,a)=>a.t/12,gather:(r,a)=>a.t/15,offer:(r,a)=>a.t/10,pickseed:(r,a)=>a.t/8,fish:(r,a)=>a.t/50,
till:(r,a)=>{const d=S.dyn[a.obj];return Math.max(a.t/45,d&&d.p!=null?d.p/30:0)},
plant:(r,a)=>{const d=S.dyn[a.obj];return Math.max(a.t/40,d&&d.p!=null?d.p/20:0)}};
const RESUME=new Set(['chop','mine','repair','water','tend','sow','harvest']);/* とちゅうでやめても、つぎは続きからする作業（建てる・家具づくり・耕す・植える・料理は、もとから続きから） */
function beginDo(r){const a=r.act;a.stage='do';a.t=0;a.e0=r.energy;if(RESUME.has(a.type)&&a.obj!=null){const k='w'+a.type+a.obj;if(S.hp[k]!=null){a.t=S.hp[k];delete S.hp[k]}}const f=ACT[a.type].start;if(f&&f(r,a)===false){endAct(r);r.act={type:'idle',stage:'do',t:0,dur:8}}}
function endAct(r){if(r.act){if(r.act.type==='watchpost'&&r.act.sx!=null){r.x=r.act.sx;r.y=r.act.sy;r.act.sx=null}/* 見張り台からおりる */{const a=r.act;if(a.stage==='do'&&!a.fin&&a.t>0&&RESUME.has(a.type)&&a.obj!=null)S.hp['w'+a.type+a.obj]=a.t}/* とちゅうでやめた作業は、どこまでやったかおぼえておく */if(r.act.type==='sevreact')sevInterrupted(r,r.act);if(r.act.type==='questjoy'){settleQuestVisit(r,r.act);if(r.act.joyUntil!=null&&JOYU.get(r)===r.act.joyUntil)JOYU.delete(r)}if(r.act.key)release(r.act.key);if(r.act.type==='bathe'){if(r.act.stage==='do')r.bathD=dayNo();/* 水に入ったあとでやめたら、その日はもう水浴びしない（入ったり出たりをくりかえさない） */if(!S.res.some(q=>q!==r&&q.act&&q.act.type==='bathe'&&q.act.stage==='do'))stopWave()}/* 水浴びをとちゅうでやめたら、ワープせず、水の中からは歩いて出る（rescueStuck） */if(r.act.order){const o=S.orders.find(q=>q.id===r.act.order);if(o&&o.worker===r.id)o.worker=null}}r.act=null;r.path=[];r.hidden=false;r.bubble=''}

function plantFin(r,a){/* 芽が育ちきったら、花や木にする */const d=S.dyn[a.obj];if(S.obj[a.obj]==='sprout'&&d&&d.p>=20){const id=d.plant;S.obj[a.obj]=id;if(BL[id].dyn)S.dyn[a.obj]={g:0};else delete S.dyn[a.obj];if(PLANTS.includes(id)){(S.bud||(S.bud={}))[a.obj]=dayNo()+1}noteQuestPlacement(id,a.obj);recount();if(PLANTS.includes(id))plantSparkle(a.obj,id);else burst(a.obj,'plant','sow');addSpiritXp(2,r);checkQuest()}}
const work=(r,dt)=>{r.energy=Math.max(0,r.energy-.22*dt*(r.fun<30?1.7:r.fun<60?1.3:1)/((r.vr&&r.vr.sta)||1)/(EL_STA[r.elem]||1)*(trt(r,'tafu')||trt(r,'nebari')?.75:1))};/* はたらくと疲れる。たのしさが低いと疲れやすい */
const fast=(r,el)=>r.elem===el?2:1;

const ACT={
  watchpost:{start(r,a){if(S.obj[a.obj]!=='watch')return false;a.sx=r.x;a.sy=r.y;r.x=a.obj%W+1;r.y=((a.obj/W)|0)+1.95;r.bubble='';r.path=[]},tick(r,a,dt){a.cl=Math.min(1,(a.cl||0)+dt/8);/* ハシゴをのぼる */},/* コワイノが来るとこわがる顔（見張り台の上では攻撃されないので、泣かない） */done:(r,a)=>r.hunger<50||!isNight()||S.obj[a.obj]!=='watch'},/* 見張り台に立つ（木のせいれい。コワイノがいるあいだだけ） */
  eat:{start(r,a){if(!r.meal)return false;const m=typeof r.meal==='number'?{u:r.meal,pt:0,pw:0,e:'🍙'}:r.meal;r.meal=null;sfxAt('eat',r.x,r.y);a.to=Math.min(hMax(r),r.hunger+m.u*100/fullN(r));{const seat=!!a.pt;a.pt=(a.pt||0)+(seat?m.pt:Math.floor(m.pt/2));a.pw=(a.pw||0)+(seat?(m.pw||0):(m.pw||0)/2)}/* 席がないと、料理のぶんは半分 */a.e=m.e;a.items=m.items;r.bubble=m.e;if(a.tdir===-1||a.tdir===1)r.face=a.tdir;if(a.tdir!=null){const h=roomOf((r.y|0)*W+(r.x|0));if(h){let n=0;for(const j of h.inside){const o=S.obj[j];if(o&&BL[o]&&BL[o].cat==='living')n+=BL[o].dw||1}for(const o of rugsIn(h.inside))n+=BL[o].dw||1;a.pt=(a.pt||0)+DINEPT[Math.min(6,n)];a.pw=(a.pw||0)+HOUSEPW[Math.min(6,n)]}}/* 家の中の食卓：ダイニング家具が多いほど、パワーが多い */},tick(r,a,dt){r.hunger=Math.min(a.to,r.hunger+2.6*dt);if(a.tdir!=null){a.bt=(a.bt||0)+dt;if(a.bt>5){a.bt=0;const m=S.res.some(q=>q!==r&&q.act&&q.act.type==='eat'&&q.act.stage==='do'&&q.act.tdir!=null&&Math.hypot(q.x-r.x,q.y-r.y)<3.5);r.bubble=m?pick(['😊',a.e||'🍙','😋','🎵']):(a.e||'🍙');if(m){r.fun=Math.min(100,r.fun+1);if(!a.mc){const q=S.res.find(q=>q!==r&&q.act&&q.act.type==='eat'&&q.act.stage==='do'&&q.act.tdir!=null&&Math.hypot(q.x-r.x,q.y-r.y)<3.5);if(q&&!q.act.mc){a.mc=q.act.mc=1;mate(r,q)}}}}}},done:(r,a)=>r.hunger>=a.to-.01||a.t>=60,end(r,a){const it=a.items||[];if(it.includes('berry')||it.includes('apple'))r.fun=Math.min(100,r.fun+8);if(it.includes('yakiberry'))r.fun=Math.min(100,r.fun+15);if(it.includes('yakiimo'))r.wkB=S.t+180;/* wkT は、歩いてもすすまない時間（べつの物） */if(it.includes('yakiapple'))r.mvT=S.t+180;if(it.includes('bread'))r.full=S.t+300;if(it.includes('soup'))r.energy=Math.min(100,r.energy+25);if(it.includes('salad')){r.energy=Math.min(100,r.energy+10);r.fun=Math.min(100,r.fun+10)}if(it.includes('yakisoba')){r.energy=Math.min(100,r.energy+20);r.fun=Math.min(100,r.fun+10)}if(it.includes('takoyaki'))r.fun=Math.min(100,r.fun+25);if(it.includes('ringoame'))r.fun=Math.min(100,r.fun+20);if(it.includes('kakigori')){r.energy=Math.min(100,r.energy+15);r.fun=Math.min(100,r.fun+10)}if(it.includes('wataame'))r.fun=Math.min(100,r.fun+25);if(it.includes(favDish(r))){a.pt=(a.pt||0)+2;a.pw=(a.pw||0)+.9;addFloat(r.x,r.y-1.6,'だいすきな味！','#ffd38a')}addPt(a.pw,r,a.pt);if(a.snack){r.bubble='😊';r.fun=Math.min(100,r.fun+10);r.shine=performance.now()}}},/* 料理ごとの効果 */
  forage:{start(r,a){const d=S.dyn[a.obj];if(!d||d.g<100)return false;d.g=0;a.e=S.obj[a.obj]==='fruit'?'🍎':'🫐';r.bubble=a.e;sfxAt('bush',r.x,r.y)},tick(r,a,dt){if(a.t>=3.5)r.hunger=Math.min(hMax(r),r.hunger+1.3*dt)}/* むしる(2秒)→手に持つ(1.5秒)→食べる */,done:(r,a)=>a.t>=27,end(r){addPt(.45,r,1)}},
  sleep:{start(r,a){r.bubble='💤';if(a.house||isNight()&&a.obj!=null&&roomOf(a.obj))r.hidden=true;/* 夜、家のベッドで寝ている子は、かくれている（コワイノにねらわれない） */a.night=isNight();{const h=a.stand>=0?roomOf(a.obj!=null?a.obj:a.stand):null;a.cf=(h?.6+comfyFor(h,r)/100*.9:1)*(h&&[...h.inside].some(j=>S.obj[j]==='mimamori')?1.1:1)}/* みまもりのぬいぐるみのある家：1.1倍 *//* 家の住み心地で、つかれのとれる速さが変わる（0→0.6倍、100→1.5倍、300→3.3倍） */},tick(r,a,dt){if(a.ground&&!isNight()&&((a.bchk=(a.bchk||0)+dt)>2)){a.bchk=0;let bj=-1;for(let j=0;j<W*H&&bj<0;j++)if((BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j))&&free('o'+j,1))bj=j;if(bj>=0){endAct(r);return}}/* 昼に地面で休んでいる子は、ベンチがあいたら、そっちにすわりなおす */const cap=a.ground?50:100;if(r.energy<cap)r.energy=Math.min(cap,r.energy+a.rate*(a.night?1:2)*(a.cf||1)*mateK(r,'sleep')*recK(r)*(a.obj!=null&&spotHas(a.obj,'shinshitsu')?1.1:1)*dt)}/* しんしつ：+10% */,
    done:(r,a)=>hungry(r)&&a.t>5||r.hunger<18||(a.night?!isNight():r.energy>=(a.ground?50:90)),end(r,a){}/* 寝るだけでは、パワーも経験値もふえない */},/* 起きたときのパワーも住み心地で変わる */
  bury:{start(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]!=='grave'||!d||d.buried||r.coffin||heldN(r))return false},done:(r,a)=>a.t>=2,end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='grave'&&d&&!d.buried){r.coffin={name:d.name};S.obj[a.obj]='';delete S.dyn[a.obj];recount()}}},/* お墓から棺を持ちあげる（ほかのものは持たない） */
  reunion:{start(r,a){r.bubble='💕';JOYU.set(r,performance.now()+4000);const q=S.res.find(x=>x.id===a.who);if(q){r.face=q.x>=r.x?1:-1;if(!(q.act&&q.act.type==='reunion')&&!q.coffin&&!q.hidden){endAct(q);startAct(q,null,'reunion',-1,{who:r.id})}/* よみがえった子も、その場で止まって、いっしょによろこぶ */q.bubble='💕';JOYU.set(q,performance.now()+4000)}addFloat(r.x,r.y-1.2,'💕','#fff')},done:(r,a)=>a.t>=6},/* もどってきたなかよしに会えてよろこぶ */
  otakiget:{start(r){if(!S.otakiQ||!Object.keys(S.otakiQ).length)return false;r.bubble='📦';sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4,end(r){r.otaki=S.otakiQ;S.otakiQ={};r.bubble='🔥'}},/* おたきあげ：素材箱から、たのまれた素材をとる */
  otaki:{start(r){if(!r.otaki||STATUE<0)return false;r.bubble='🔥';sfxAt('cookfire',r.x,r.y)},tick(r,a,dt){a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;const x=STATUE%W+.5,y=((STATUE/W)|0)+.2;for(let n=0;n<6;n++){const an=Math.random()*7,v=rnd(20,50);fx.push({k:'p',x:x*TS,y:y*TS,vx:Math.cos(an)*v*.4,vy:-v,life:1,col:pick(['#ffd38a','#ff9f5a','#fff3c4']),r:rnd(1.5,3)})}}},done:(r,a)=>a.t>=10,end(r){let p=0;for(const k in r.otaki||{})p+=Math.floor(r.otaki[k]/(MATTRADE[k]||5));r.otaki=null;S.pt+=p;burst(STATUE,'furn');sfx('level');toast('おたきあげ：パワー+'+p,'good');addSpiritXp(1,r)}},/* 神殿で、おたきあげ */
  pray:{start(r){if(!r.coffin)return false},done:(r,a)=>a.t>=12,end(r){finishBurial(r)}},/* 神殿でおいのりして、埋葬する */
  rest:{start(r,a){if(!BENCHES.has(S.obj[a.obj]))return false;r.bubble='☕'},tick(r,a,dt){if(a.partner!=null&&!S.res.some(x=>x.id===a.partner&&x.act&&x.act.type==='rest'&&x.act.obj===a.obj)){a.topic=null;a.partner=null;a.sub=0;a.ended=1;r.bubble='☕'}/* 片方が休けいを終えたら、おしゃべりもおわり */r.energy=Math.min(100,r.energy+dt/3*mateK(r,'rest')*recK(r)*(1+.1*spotN(a.obj,'yasumi','wa','terrace')));/* やすみば・和の庭：+10% */r.fun=Math.min(100,r.fun+.08*dt*(1+.1*spotN(a.obj,'hana','chaya','kotori')));/* 花のベンチ・茶屋：+10% */
    if(a.topic==null){const q=a.ended||(r.chatCD||0)>S.t?null:S.res.find(x=>x!==r&&(x.chatCD||0)<=S.t&&x.act&&x.act.type==='rest'&&x.act.stage==='do'&&x.act.obj===a.obj&&x.act.topic==null);if(q){const t=chatTopic(r,q);a.topic=t;a.partner=q.id;q.act.topic=t;q.act.partner=r.id;q.act.sub=1;r.bubble=q.bubble='💬';mate(r,q);for(const x of[r,q])addPt(.45+(x.like==='chat'?.9:0)+(S.today==='oshaberi'?.9:0),x,1+(x.like==='chat'?2:0)+(S.today==='oshaberi'?2:0))}}/* ベンチに2人すわったら、おしゃべり */
    else{a.bt=(a.bt||0)+dt;if(a.bt>4){a.bt=0;r.bubble=pick(['💬','💬','😊','🎵','😆'])}r.fun=Math.min(100,r.fun+.3*dt)}},done:(r,a)=>(r.energy>=100&&a.t>=15)||a.t>=(a.dur||90)||isNight()||!BENCHES.has(S.obj[a.obj]),end(r,a){r.restCD=S.t+90;if(a&&a.t>=10)addPt(.45,r,1)}},/* ベンチでひと休み：すぐ終わったときはポイントなし。しばらくは、またベンチにはすわらない */
  play:{start(r,a){r.bubble={flower:'🌼',fountain:'💦',campfire:'🔥'}[a.what]||'🎵';if(a.obj!=null&&!a.pk){a.pk=1;a.fun*=1+.1*spotN(a.obj,'park','park2')+(a.what==='campfire'?.1*spotN(a.obj,'camp'):0)+(a.what==='fountain'?.1*spotN(a.obj,'funsui'):0)+(a.what==='swing'?.1*spotN(a.obj,'buranko','mori'):0)+(a.what==='sandbox'?.1*spotN(a.obj,'doronko'):0)}/* 公園：たのしさ+10%・+20%、キャンプ場・ふんすいひろば：+10% */if(a.nig){r.bubble='😣';if(Math.random()<.5)addFloat(r.x,r.y-1.2,'ちょっと、にがて…','#fff3d6')}},/* にがてなおもちゃ */tick(r,a,dt){r.fun=Math.min(100,r.fun+a.fun/a.dur*dt)}/* おもちゃは、お話よりたのしさがたまりやすい */,done:(r,a)=>a.t>=a.dur,end(r,a){addPt(a.pw+(r.like===a.what?.9:0),r,a.pt+(r.like===a.what?2:0));train(r,a.what);if(a.what!=='flower')r.lastToy={j:a.obj,t:S.t}}},/* 遊んだ遊び家具は覚えておき、しばらくは行かない */
  bathe:{start(r,a){const w=a.tub!=null?(typeAt(a.tub)==='bathtub'||typeAt(a.tub)==='onsen'?adjOf(a.stand,k=>anc(k)===a.tub):-1):adjOf(a.stand,k=>S.ground[k]===1);if(w<0)return false;r.face=w%W+.5>=r.x?1:-1;r.bubble='💦';sfxAt('wave',r.x,r.y);a.sx=r.x;a.sy=r.y;a.wx=w%W+.5;a.wy=((w/W)|0)+.5;a.in=0;a.hot=a.tub!=null?false:hotW(w)},tick(r,a,dt){/* 水の中まで入って、出てくる */a.in=Math.max(0,Math.min(1,a.t/3,(30-a.t)/3));const mv=a.tub!=null?1:.8;r.x=a.sx+(a.wx-a.sx)*a.in*mv;r.y=a.sy+(a.wy-a.sy)*a.in*mv;const hot=!!a.hot,m=S.res.find(q=>q!==r&&q.act&&q.act.type==='bathe'&&Math.hypot(q.x-r.x,q.y-r.y)<3.5);if(m){r.face=m.x>=r.x?1:-1;r.bubble=Math.floor(a.t/1.5)%2?'🎵':'💦'}else r.bubble=a.tub!=null?(Math.floor(a.t/3)%2?'♨️':'🎵'):'💦';/* ほかの子がいたら、いっしょに水かけっこ */const lo=nearLotus(r);r.fun=Math.min(100,r.fun+(hot?.45:.3)*(m?1.5:1)*(lo?1.5:1)*(hot&&r.elem==='fire'?1.3:1)*(a.tub!=null&&spotHas(a.tub,'ofuro')?1.1:1)*dt);/* おふろば：+10% */if(hot&&r.elem==='fire'&&Math.floor(a.t/2)%3===0)r.bubble='♨️';/* 火の子は温泉が大好き */if(lo)r.energy=Math.min(100,r.energy+.15*recK(r)*dt);/* ハスの近くの水浴びは、たのしい */if(hot)r.energy=Math.min(100,r.energy+.35*recK(r)*dt);/* 温泉は、つかれもとれる */a.h=(a.h||0)+dt;if(a.h>=4.5){a.h=0;sfxAt('wave',r.x,r.y)}},done:(r,a)=>a.t>=30,end(r,a){r.bathD=dayNo();r.bubble='✨';if(a&&a.tub!=null&&a.t>=30&&typeAt(a.tub)==='onsen'){r.energy=Math.min(100,r.energy+30);r.fun=Math.min(100,r.fun+10)}/* 露天ぶろ：つかれ−30・たのしさ+10 */r.shine=performance.now();addPt(.45,r,1);if(a&&a.hot)r.afterBath=S.t+90}},
  fish:{start(r,a){const w=fishW(a.stand);if(w>=0)r.face=w%W+.5>=r.x?1:-1;/* 釣竿は水のほうへ */r.bubble='🎣';sfxAt('cast',r.x,r.y)},tick(r,a,dt){r.fun=Math.min(100,r.fun+.5*dt)},done:(r,a)=>a.t>=50,end(r,a){const w=r.elem==='water';addPt(1.35+(r.like==='fish'?.9:0),r,3+(r.like==='fish'?2:0));if(Math.random()<(w?.7:.35)+(a&&a.spot?.25:0)+(a?.05*spotN(a.stand,'fishspot','yoruzuri'):0)){/* つりスポット：+5% */addCarry(r,'fish',1);S.fishN=(S.fishN||0)+1;kurashi('fish',['🐟','はじめて魚がつれた']);r.bubble='🐟';sfxAt('catch',r.x,r.y)}else fishLoot(r)}},
  chat:{start(r,a){const p=S.res.find(q=>q.id===a.partner);if(!p||!p.act||p.act.type!=='chatwait'||p.act.partner!==r.id||(r.chatCD||0)>S.t||(p.chatCD||0)>S.t)return false;mate(r,p);
      if(a.tag){const cx=Math.round((r.x+p.x)/2-.5),cy=Math.round((r.y+p.y)/2-.5);let ok=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!walk((cy+dy)*W+cx+dx))ok=false;
        if(ok){r.act={type:'tag',stage:'do',t:0,cx:cx+.5,cy:cy+.5,ph:0,partner:p.id,key:a.key};endAct(p);p.act={type:'tag',stage:'do',t:0,cx:cx+.5,cy:cy+.5,ph:Math.PI,partner:r.id};r.bubble='😆';p.bubble='😆';return}}
      r.face=p.x>=r.x?1:-1;p.face=-r.face;a.topic=chatTopic(r,p);/* 最近した話は、しばらく出ない */endAct(p);p.act={type:'chat',stage:'do',t:0,partner:r.id,topic:a.topic,sub:1};r.bubble='💬';p.bubble='💬'},
    tick(r,a,dt){r.fun=Math.min(100,r.fun+.4*dt*(spotNear((r.y|0)*W+(r.x|0),'oshaberi')?1.1:1));/* おしゃべりひろば：+10% */if(!a.waved&&a.t>14&&CHATS[a.topic]&&CHATS[a.topic].wave){a.waved=1;const p=S.res.find(q=>q.id===a.partner);r.waveU=S.t+4;if(p)p.waveU=S.t+4}/* 「手、ふっとこうか」のあと、手をふる */a.bt=(a.bt||0)+dt;if(a.bt>4){a.bt=0;r.bubble=pick(['💬','💬','😊','🎵','😆'])}}/* おしゃべり中は「…」の吹き出しが中心 */,done:(r,a)=>a.t>=25,end(r){r.chatCD=S.t+150;{const p=S.res.find(q=>q.id===r.act.partner);if(p)p.chatCD=S.t+150}/* おしゃべりのあとは、しばらく間をあける */addPt(.45+(r.like==='chat'?.9:0)+(S.today==='oshaberi'?.9:0),r,1+(r.like==='chat'?2:0)+(S.today==='oshaberi'?2:0))}},
  store:{start(r){if(!carryN(r))return false;r.bubble='📦'},done:(r,a)=>a.t>=4/(([-1,1,-W,W].some(o=>spotHas((r.y|0)*W+(r.x|0)+o,'shokuryo'))?1.1:1)+([-1,1,-W,W].some(o=>NEARCART.has((r.y|0)*W+(r.x|0)+o))?.2:0)+([-1,1,-W,W].some(o=>NEARTOOL.has((r.y|0)*W+(r.x|0)+o))?.2:0)/* どうぐたて：+20% */),/* にぐるま：+20% *//* 食料庫：しまう速さ+10% */end(r){sfxAt('box',r.x,r.y);if(typeof r.carry==='number')r.carry={mugi:r.carry};let room=Math.max(0,foodCap()-S.food),txt=[];r.toStor=0;for(const k in r.carry){const dish=RECIPES.some(R=>R.out===k),n=dish?r.carry[k]:Math.min(r.carry[k],room);room=Math.max(0,room-n);if(n){addFood(k,n);txt.push(FOODS[k].name+'+'+n)}if(r.carry[k]>n)dropAt(r.x,r.y,'food:'+k,r.carry[k]-n)}/* 入りきらない分は、足もとに置く */r.carry=null;addFloat(r.x,r.y-1.4,txt.length?txt.join(' '):'いっぱい',txt.length?'#bdf5c4':'#ffd2cc');if(sheet==='food')renderSheet()}},
  weed:{start(r,a){if(!WEEDS.has(S.obj[a.obj]))return false;a.w=S.obj[a.obj];faceTo(r,a.obj);r.bubble=a.w==='kinoko'?'🍄':'🌿'},tick(r,a,dt){work(r,dt)},done:(r,a)=>a.t>=5||S.obj[a.obj]!==a.w,end(r,a){if(S.obj[a.obj]===a.w&&a.t>=5){S.obj[a.obj]='';addMat(r,BL[a.w].weed,1);addSpiritXp(1,r)}}},/* 雑草・きのこをむしる（素材箱へはこぶ） */
  smat:{start(r){if(!r.cmat)return false;r.bubble='📦'},done:(r,a)=>a.t>=4/(([-1,1,-W,W].some(o=>spotHas((r.y|0)*W+(r.x|0)+o,'monooki'))?1.1:1)+([-1,1,-W,W].some(o=>NEARCART.has((r.y|0)*W+(r.x|0)+o))?.2:0)+([-1,1,-W,W].some(o=>NEARTOOL.has((r.y|0)*W+(r.x|0)+o))?.2:0)/* どうぐたて：+20% */),/* にぐるま：+20% *//* ものおき：しまう速さ+10% */end(r){sfxAt('box',r.x,r.y);const m=r.cmat;r.cmat=null;let room=Math.max(0,matCap()-matTot()),txt=[];for(const k in m){const n=Math.min(m[k],room);room-=n;S.mat[k]=(S.mat[k]||0)+n;if(!S.gotMat)S.gotMat={};S.gotMat[k]=(S.gotMat[k]||0)+n;if(n)txt.push(MATN[k]+'+'+n);if(m[k]>n)dropAt(r.x,r.y,'mat:'+k,m[k]-n)}/* 入りきらない分は、足もとに置く */bambooIdea();addFloat(r.x,r.y-1.4,txt.length?txt.join(' '):'いっぱい',txt.length?'#e8d3a8':'#ffd2cc');if(sheet==='craft')renderSheet()}},
  cgrab:{start(r,a){const R=RECIPES.find(x=>x.out===a.rec);if(!R||!Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]))return false;for(const k in R.need)S.fs[k]-=R.need[k];syncFood();r.cing={rec:a.rec,ov:a.ov};r.bubble=FOODS[Object.keys(R.need)[0]].e;sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4},
  cook:{start(r,a){if(!r.cing||S.obj[a.obj]!=='oven')return false;r.bubble='🔥';const ox=a.obj%W+.5;r.face=ox>=r.x?1:-1;a.t=r.cing.prog||0;/* 中断しても、続きから */sfxAt('cookfire',r.x,r.y)},tick(r,a,dt){work(r,dt);if(r.cing)r.cing.prog=a.t;a.h=(a.h||0)+dt;if(a.h>=6){a.h=0;sfxAt('cook',r.x,r.y)}if(a.t>4)r.bubble='🍳'},done:(r,a)=>a.t>=cookTime(r,a.obj),end(r,a){const k=r.cing.rec;r.cing=null;if(typeof r.carry==='number')r.carry={mugi:r.carry};r.carry=r.carry||{};r.carry[k]=(r.carry[k]||0)+1;r.toStor=1;/* できた料理は、すぐ食料箱へ */S.flags.cooked=true;S.cookN=(S.cookN||0)+1;kurashi('cook:'+k,['🍳','はじめて'+FOODS[k].name+'ができた']);r.bubble=FOODS[k].e;addFloat(a.obj%W+.5,((a.obj/W)|0)-.6,FOODS[k].name+'ができた','#ffd38a');sfxAt('harvest',r.x,r.y);addSpiritXp(1,r)}},
  chop:{start(r,a){if(!S.obj[a.obj])return false;a.tgt=S.obj[a.obj];r.bubble='🪓';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);natWork(a,dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;sfxAt('chop',r.x,r.y)}},done:(r,a)=>(a.camp?a.t>=20:natDone(a))||S.obj[a.obj]!==a.tgt,end(r,a){if(S.obj[a.obj]!==a.tgt)return;/* 木が先になくなったら、そこで終わり */if(!a.camp)delete S.hp['lp'+a.obj];addMat(r,a.tgt==='bamboo'?'bamboo':'wood',1+(trt(r,'kikori')?1:0));if(!a.camp)useNat(a.obj);addSpiritXp(1,r)}},
  mine:{start(r,a){if(!S.obj[a.obj])return false;a.tgt=S.obj[a.obj];r.bubble='⛏';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);natWork(a,dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;sfxAt('crack',r.x,r.y,1.5)/* 採掘の音は1.5倍 */}},done:(r,a)=>(a.camp?a.t>=20:natDone(a))||S.obj[a.obj]!==a.tgt,end(r,a){if(S.obj[a.obj]!==a.tgt)return;if(!a.camp)delete S.hp['lp'+a.obj];addMat(r,'stone',1+(trt(r,'ishiku')?1:0));if(!a.camp)useNat(a.obj);addSpiritXp(1,r)}},
  fetch:{start(r){if(S.food<=0)return false;r.bubble='📦';sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4,end(r){let need=Math.max(0,(hMax(r)-r.hunger)*fullN(r)/100),units=0,pt=0,pw=0,items=[];
    const keys=Object.keys(S.fs).filter(k=>S.fs[k]>0).sort((a,b)=>FOODS[b].v-FOODS[a].v);for(const k of keys){while(need>0&&S.fs[k]>0){S.fs[k]--;need-=FOODS[k].v;units+=FOODS[k].v;pt+=FOODS[k].pt||0;pw+=FOODS[k].pw||0;items.push(k)}if(need<=0)break}
    syncFood();if(units)r.meal={u:units,pt,pw,e:FOODS[items[0]].e,items};if(sheet==='food')renderSheet()}},
  npl:{start(r,a){if(!S.nushi||!S.cleared)return false;r.bubble='💚';r.face=S.nushi.x>=r.x?1:-1;if(!S.flags.nplayed){S.flags.nplayed=1;memo('🦌',r.name+'がヌシ様と遊んだ');logEv(r.name+'がヌシ様と遊んだ')}},tick(r,a,dt){r.fun=Math.min(100,r.fun+1.6*dt);a.bt=(a.bt||0)+dt;if(a.bt>3){a.bt=0;r.bubble=pick(['💚','😆','🎵'])}a.jt=(a.jt||0)+dt;if(a.jt>2.5&&S.nushi){a.jt=0;JUMP.set(r,performance.now());S.nushi.hop=performance.now()}},done:(r,a)=>a.t>=40||!S.nushi/* ぴょんぴょんはねて、ヌシ様もいっしょにはねる */,end(r){addPt(1.35,r,3)}},/* クリア後、ヌシ様のところへ遊びに行く */
  chatwait:{done:(r,a)=>{const p=S.res.find(q=>q.id===a.partner);return a.t>=40||!p||!p.act||p.act.type!=='chat'||p.act.partner!==r.id}},
  tag:{tick(r,a,dt){const ang=a.ph+a.t*.35,nx=a.cx+Math.cos(ang)*1.1,ny=a.cy+Math.sin(ang)*.8;r.face=nx>=r.x?1:-1;if(walk((ny|0)*W+(nx|0))){r.x=nx;r.y=ny}/* 通れないマスには入らない */r.fun=Math.min(100,r.fun+.6*dt)},
    done:(r,a)=>a.t>=30,end(r,a){addPt(.9,r,2)}},
  tend:{start(r,a){const d=S.dyn[a.obj];if(!d||S.obj[a.obj]!=='farm')return false;r.bubble='🌱';sfxAt('pour',r.x,r.y)},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=8){a.h=0;sfxAt('pour',r.x,r.y)}},done:(r,a)=>a.t>=20,end(r,a){const d=S.dyn[a.obj];if(d&&S.obj[a.obj]==='farm'){d.wet=100}addSpiritXp(1,r)}},
  water:{start(r,a){if(S.obj[a.obj]!=='farm')return false;r.bubble='💧';sfxAt('pour',r.x,r.y)},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=8){a.h=0;sfxAt('pour',r.x,r.y)}},/* 水をあげている間もちょろちょろ */done:(r,a)=>a.t>=(r.elem==='water'?8:16),end(r,a){const d=S.dyn[a.obj];if(d&&S.obj[a.obj]==='farm'){d.wet=100}addSpiritXp(1,r)}},
  till:{start(r,a){if(S.obj[a.obj]!=='plot')return false;r.bubble='⛏'},tick(r,a,dt){const d=S.dyn[a.obj];if(d)d.p+=dt*fast(r,'earth');work(r,dt)},
    done:(r,a)=>a.t>=45||S.obj[a.obj]!=='plot'||S.dyn[a.obj].p>=30,end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='plot'&&d&&d.p>=30){S.obj[a.obj]='farm';S.dyn[a.obj]={g:0,wet:0,crop:null,sown:false}/* 耕しただけでは、たねは決まらない */;noteQuestPlacement('farm',a.obj);recount();burst(a.obj,'plant','till');addSpiritXp(2,r);checkQuest()}}},
  sow:{start(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]!=='farm'||!d||d.sown!==false||cseed(cropK(d))<1&&!d.paid)return false;r.bubble='🌰';sfxAt('bush',r.x,r.y)},tick(r,a,dt){work(r,dt);if(spotNear(a.obj,'hatake'))a.t+=dt*.1},/* はたけの水場：+10% */
    done:(r,a)=>a.t>=10||S.obj[a.obj]!=='farm',end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='farm'&&d&&a.t>=10&&sowFarm(d)){burst(a.obj,'plant','sow');addSpiritXp(1,r);checkQuest()}}},
  plant:{start(r,a){if(a.back)return;/* 植えおわって、岸にもどってきた */if(S.obj[a.obj]!=='sprout')return false;if(a.wade&&a.wade.length&&!a.waded){a.waded=1;r.path=a.wade.slice();a.stage='walk';return}/* 池のまんなかは、水に入って植えにいく */r.bubble='🌱';sfxAt('bush',r.x,r.y)},tick(r,a,dt){const d=S.dyn[a.obj];if(d)d.p+=dt*fast(r,'wood');work(r,dt)},
    done:(r,a)=>{if(a.back)return true;const f=a.t>=40||S.obj[a.obj]!=='sprout'||S.dyn[a.obj].p>=20;if(f&&a.wade&&a.wade.length){plantFin(r,a);a.back=1;r.path=a.wade.slice().reverse().slice(1).concat([a.stand]);a.stage='walk';r.bubble='';return false}/* 水の中で植えたら、来た道をとおって岸へもどる */return f},end(r,a){if(!a.back)plantFin(r,a)}},
  build:{start(r,a){if(S.obj[a.obj]!=='site')return false;r.bubble='🔨'},tick(r,a,dt){const d=S.dyn[a.obj];if(d)d.p+=dt*(r.elem==='earth'?(BL[d.build]&&BL[d.build].maker==='earth'?2:1.3):1);work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('bnail',r.x,r.y)}},/* 土のせいれいは建てるのが速い（土の建物は×2、ほかは×1.3） */
    done:(r,a)=>a.t>=60||S.obj[a.obj]!=='site'||S.dyn[a.obj].p>=S.dyn[a.obj].need,end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='site'&&d&&d.p>=d.need)finishBuild(a.obj,r);else addSpiritXp(1,r)}},
  craft:{start(r,a){if(!S.orders.find(q=>q.id===a.order))return false;r.face=1;r.bubble=''},tick(r,a,dt){const o=S.orders.find(q=>q.id===a.order);if(o)o.prog+=dt*(r.elem===BL[o.type].maker?2:1);work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('nail',r.x,r.y)}},
    done:(r,a)=>{const o=S.orders.find(q=>q.id===a.order);return a.t>=60||!o||o.prog>=o.need},end(r,a){const o=S.orders.find(q=>q.id===a.order);if(o&&o.prog>=o.need)finishCraft(o,r);else addSpiritXp(1,r)}},
  dance:{start(r,a){r.bubble='🎵'},tick(r,a,dt){r.fun=Math.min(100,r.fun+.5*dt);a.h=(a.h||0)+dt;if(a.h>=1.2){a.h=0;JUMP.set(r,performance.now());r.face=-(r.face||1);r.bubble=pick(['🎵','🎶','🍡','😆'])}},done:(r,a)=>a.t>=40||!festOn()||isNight()||hour()>=20,end(r,a){}},/* おまつりのおどり（ごちそうも食べる） */
  bon:{start(r,a){r.bubble='🎵';a.ph=Math.atan2(r.y-a.cy,r.x-a.cx);a.rad=Math.max(1.6,Math.hypot(r.x-a.cx,r.y-a.cy));a.dur=20+Math.random()*15},tick(r,a,dt){const ang=a.ph+a.t*.22,tx=a.cx+Math.cos(ang)*a.rad,ty=a.cy+Math.sin(ang)*a.rad,dx=tx-r.x,dy=ty-r.y,L=Math.hypot(dx,dy),m=Math.min(L,1.5*dt);if(L>0){const nx=r.x+dx/L*m,ny=r.y+dy/L*m,k=(ny|0)*W+(nx|0);if(walk(k)&&!S.obj[k]){r.face=dx>=0?1:-1;r.x=nx;r.y=ny}}/* 輪にそって、ゆっくり回る（通れないマスでは止まる） */r.fun=Math.min(100,r.fun+.5*dt);a.h=(a.h||0)+dt;if(a.h>=1.5){a.h=0;JUMP.set(r,performance.now());r.bubble=pick(['🎵','🎶','😆','✨'])}},done:(r,a)=>a.t>=a.dur||!festOn()||isNight()||hour()>=22},/* おまつりのおどりの輪 */
  nmeet:{start(r,a){r.bubble='✨'},done:()=>!NUSHI_RUN},/* ヌシ様をむかえるとき、台座のまわりに集まる */
  shopkeep:{start(r,a){r.face=1;r.bubble=STALLM[r.elem].e},tick(r,a,dt){r.fun=Math.min(100,r.fun+.3*dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;r.bubble=pick([STALLM[r.elem].e,'😊','🎵','🏮'])}},done:(r,a)=>!festOn()||isNight()||hour()>=22||!S.fst||S.fst.k!==a.sk},/* おまつりの屋台の店番 */
  yatai:{start(r,a){r.bubble='🏮';r.face=1},done:(r,a)=>a.t>=4,end(r,a){const t=(S.fst&&S.fst.L||[]).find(t=>t.x===a.sx);if(!t)return;const M=STALLM[t.el],kp=S.res.find(o=>o.id===t.id);r.fyN=(r.fyN||0)+1;JUMP.set(r,performance.now());sfxAt('offer',r.x,r.y);addPt(.9,r,2);/* 屋台をまわると、パワーも少し */
    if(kp){JUMP.set(kp,performance.now());addFloat(kp.x,kp.y-1.3,'ありがとう！','#fff3d6')}
    if(t.el==='wind'&&Math.random()<.5){const ok=Math.random()<.35;r.fun=Math.min(100,r.fun+(ok?20:8));r.bubble=ok?'🎯':'😣';addFloat(r.x,r.y-1.2,ok?'わなげ、あたり！':'わなげ、おしい…',ok?'#ffd38a':'#fff3d6');return}/* 風の屋台は、わなげも */
    const f=FOODS[M.L[0][1]];r.hunger=Math.min(hMax(r),r.hunger+20);r.fun=Math.min(100,r.fun+10);r.bubble=f.e;r.fsnack=f.e}},/* 屋台の食べ物：おなか+20・たのしさ+10（食料箱はへらない） */
  fwalk:{start(r,a){a.dur=5+Math.random()*6;r.bubble=r.fsnack&&Math.random()<.5?r.fsnack:pick(['🏮','✨','😊','🎵'])},done:(r,a)=>a.t>=a.dur,end(r){r.fsnack=null}},/* おまつりを見てまわる */
  hanabi:{start(r){r.bubble='🎆';r.face=Math.random()<.5?1:-1},tick(r,a,dt){r.fun=Math.min(100,r.fun+.4*dt);a.h=(a.h||0)+dt;if(a.h>=2){a.h=0;r.bubble=pick(['🎆','🎇','✨','😆']);if(Math.random()<.15)addFloat(r.x,r.y-1.3,pick(['たまやー！','きれい…！','わあ…！']),'#fff3d6')}},done:(r,a)=>hour()>=21||!festOn()||isNight()},/* 花火を見る */
  douse:{start(r,a){if(!fireAt(a.obj))return false;r.bubble='💧';sfxAt('pour',r.x,r.y)},tick(r,a,dt){work(r,dt)},done:(r,a)=>a.t>=10||!fireAt(a.obj)||isNight(),end(r,a){if(a.t>=10&&fireAt(a.obj)){delete S.st2.fire[a.obj];sfxAt('pour',r.x,r.y);addSpiritXp(1,r)}}},/* 水をかけて、火を消す */
  repair:{start(r,a){const b=!S.obj[a.obj]?brokenAt(a.obj):null;if(!b&&!breakable(S.obj[a.obj])&&!DEFS.has(S.obj[a.obj])&&!burnt(a.obj))return false;a.re=b?b.id:null;r.bubble='🔨'},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('nail',r.x,r.y)}},done:(r,a)=>a.t>=repairTime(a)&&(!a.re||a.t>=60||repairFree(a)),/* 建て直す場所にだれかが立っているあいだは、終わらずに待つ（さいごまで空かなければ、素材をもどしてやめる） */end(r,a){if(a.re){const cells=fp(a.re,a.obj%W,(a.obj/W)|0,brokenRot(a.obj)).map(([cx,cy])=>cy*W+cx);if(!repairFree(a)){addFloat(r.x,r.y-1.2,'人がいて直せなかった','#ffd2cc')}else if(cells.every(k=>!S.obj[k])){S.obj[a.obj]=a.re;setRot(a.obj,brokenRot(a.obj));setParts(a.re,a.obj,'part');delete S.hp[a.obj];if(BL[a.re].dyn)S.dyn[a.obj]={g:0};{const bk=brokenAt(a.obj);if(bk&&bk.L)S.hp['L'+a.obj]=bk.L}/* 強化レベルは、建てなおしてももとにもどす */S.broken=S.broken.filter(b=>b.j!==a.obj);recount();dirty=true;burst(a.obj,'block');sfxAt('repair',r.x,r.y)}}else{const o=S.obj[a.obj];if(breakable(o)){S.hp[a.obj]=BL[o].hp;sfxAt('repair',r.x,r.y)}else if(DEFS.has(o)||burnt(a.obj)){delete S.hp[a.obj];sfxAt('repair',r.x,r.y)}}addSpiritXp(1,r)}},
  harvest:{start(r,a){const d=S.dyn[a.obj];if(!d||d.g<100)return false;r.bubble='🧺';sfxAt('bush',r.x,r.y)},tick(r,a,dt){work(r,dt);if(S.obj[a.obj]==='farm'&&spotNear(a.obj,'hatake'))a.t+=dt*.1},/* はたけの水場：+10% */done:(r,a)=>a.t>=12,end(r,a){const d=S.dyn[a.obj];if(!d)return;d.g=0;const fk=S.obj[a.obj]==='farm'?(cropK(d)):S.obj[a.obj]==='fruit'?'apple':'berry';if(S.obj[a.obj]==='farm'){if(Math.random()<.75){S.cseed[fk]=cseed(fk)+1;addFloat(r.x,r.y-1.2,CROPS[fk].name+'のたね+1','#e8d38a')}/* たねがとれるのは75% */d.sown=false;d.crop=null}/* 収穫したら、また植えないと育たない */const cr=CROPS[fk]||{yield:a.food||3},food=((fk==='berry'||fk==='apple')?2:cr.yield+(NEARMILL.has(a.obj)?1:0)+(NEARFLOWER.has(a.obj)?1:0))+(trt(r,'shukaku')?1:0)+(r.elem==='wood'&&S.obj[a.obj]==='farm'?1:0)+(S.today==='hosaku'?1:0);{const rm=roomN(r);addCarry(r,fk,Math.min(food,rm));if(food>rm)dropAt(r.x,r.y,'food:'+fk,food-rm)}/* 持ちきれない分は、足もとに置いて、あとでひろう */kurashi('hv:'+fk,['🧺','はじめて'+FOODS[fk].name+'を収穫した']);sfxAt('harvest',r.x,r.y);addSpiritXp(1,r)}},
  gather:{start(r,a){const d=S.dyn[a.obj];if(!d||d.g<100)return false;a.tk=S.obj[a.obj]==='takenoko';if(!a.tk)d.g=0;r.bubble='🧺';sfxAt('bush',r.x,r.y)},tick(r,a,dt){work(r,dt)},done:(r,a)=>a.t>=15,end(r,a){if(a.tk&&S.obj[a.obj]!=='takenoko')return;/* たけのこは、とると、なくなる */const fk=a.tk?'takenoko':'berry';if(a.tk){clearObj(a.obj);recount()}{const rm=roomN(r);addCarry(r,fk,Math.min(2,rm));if(2>rm)dropAt(r.x,r.y,'food:'+fk,2-rm)}/* 持ちきれない分は、足もとに置いて、あとでひろう */}},
  offer:{start(r,a){if(OBOX<0)return false;r.bubble='🎁'},done:(r,a)=>a.t>=10,end(r,a){r.offT=S.t;r.offDay=dayNo();r.fun=60;{const oo=FURN.filter(id=>BL[id]&&BL[id].offerOnly&&BL[id].maker===r.elem&&(!WIND_STAGE_TOYS.has(id)||WD===4));/* 風の村の遊具は、ほかのステージでは出さない */if(oo.length&&Math.random()<.06){/* おそなえでしか手に入らない家具 */const id=pick(oo);giveItem(id,1);addFloat(r.x,r.y-1.8,'レア！');toast(r.name+'が「'+BL[id].name+'」をおそなえした！','good');addSpiritXp(1,r);return}const fs=FURN.filter(id=>BL[id]&&BL[id].maker===r.elem&&!BL[id].trap&&!BL[id].offerOnly&&lvOK(id));if(fs.length&&Math.random()<.06){/* まれに家具（レア） */const id=pick(fs);giveItem(id,1);addFloat(r.x,r.y-1.8,'レア！');toast(r.name+'が「'+BL[id].name+'」をおそなえした！','good');addSpiritXp(1,r);return}}const g=offerFor(r);if(!g)return;giveItem(g[0],g[1]);addSpiritXp(1,r);
    const sx=OBOX%W,sy=(OBOX/W)|0;addFloat(sx+.5,sy-.8,'おそなえ '+iname(g[0])+'×'+g[1],'#ecdcbc');burst(OBOX,'block');sfx('offer');renderPalette();if(sheet==='inv')renderSheet()}},
  pickdrop:{start(r,a){const i=(S.drops||[]).findIndex(q=>q.y*W+q.x===a.obj);if(i<0)return false;takeDrop(S.drops.splice(i,1)[0],r);r.bubble='✨'},done:(r,a)=>a.t>=3},
  pickseed:{start(r,a){const i=S.seeds.findIndex(q=>q.y*W+q.x===a.obj);if(i<0)return false;S.seeds.splice(i,1);r.bubble='✨'},done:(r,a)=>a.t>=8,end(r){S.mseed=(S.mseed||0)+1;S.mseedGot=(S.mseedGot||0)+1;addFloat(r.x,r.y-1.6,'ふしぎな種+1','#d8f5c0');toast(r.name+'がふしぎな種をひろった','good')}},
  patrol:{done:()=>true},/* 見回りは、止まらずに歩きつづける（吹き出しなし） */
  faint:{done:(r,a)=>a.t>=30,end(r){r.fleeNow=true;r.faintGrace=S.t+40}/* 目をまわし終えたら、しばらくは攻撃されない（にげる間に、またすぐ気絶してしまわないように） */},
  flee:{start(r,a){r.bubble='💦'},/* 家へにげこんだ子も、消さずに家の中にいる（屋根の下） */done:(r,a)=>a.t>=(a.house&&!(S.food>0)?40:4),end(r,a){if(a.food)r.wantEat=1/* 食べ物のところへ逃げたら、そこで食べる。家へにげこんだときも、食料があれば、すぐ食べにいく */}},
  step:{done:()=>true},/* かべ・柵・水の中から、歩いて外へ出る */
  wander:{start(r,a){a.dur=rnd(10,30)},done:(r,a)=>a.t>=a.dur,end(r){r.wanderRestUntil=S.t+45}},
  idle:{start(r){r.bubble='☕'},done:(r,a)=>a.t>=a.dur},/* ひとやすみ中は、休けいの吹き出し */
  // ベッドがない子は、家の中で起きたまま夜をすごす
  stay:{start(r){r.bubble="🏠"},done:(r,a)=>hungry(r)&&a.t>5||r.hunger<18||!isNight()},
  shiver:{start(r){r.bubble='😨'},done:(r,a)=>r.hunger<50||!hostileNow(r)||r.hunger<hMax(r)*.5&&S.food>0&&!(r.eatTry>S.t),end(r){if(!hostileNow(r)&&r.hunger>=30)r.phewNext=true}},/* コワイノがいなくなったら、「ふぅ」とひと息ついてから寝る */
  phew:{start(r,a){r.bubble='';a.dl=PHEWDL[r.elem]||0},tick(r,a){r.bubble='';if(a.reactAt==null&&a.t>=a.dl){a.reactAt=performance.now();a.reactMotion='phew'}},done:(r,a)=>a.t>=a.dl+2},/* ふぅ：吹き出しは出さない。属性ごとに、すこしずつずらす *//* おなかが半分より少なくなったら、ふるえるのをやめて、安全に行ける食料箱へ食べにいく *//* たたかえない子は、コワイノがいるあいだ、家の中でふるえている */
};
const ACT_LBL={phew:'ほっとしている',shopkeep:'屋台の店番をしている',dance:'おどっている',bon:'おどりの輪でおどっている',yatai:'屋台にいる',fwalk:'おまつりを見てまわっている',hanabi:'花火を見ている',step:'あるいている',shiver:'こわくて、ふるえている',reunion:'なかよしに会いにいく',bury:'お墓へむかう',pray:'神殿でおいのり',sevreact:'気づいたものを見にいく',questjoy:'よろこんでいる',stay:'起きてすごしている',sow:'種をまいている',faint:'目をまわしている',eat:'ごはん中',forage:'ベリーを食べている',sleep:'おやすみ中',play:'遊んでいる',fish:'つりをしている',chat:'おしゃべり中',cook:'料理中',chop:'木を切っている',mine:'石をほっている',smat:'素材をしまう',store:'食料をしまう',fetch:'食料をとりに',chatwait:'待ちあわせ',npl:'ヌシ様と遊んでいる',tag:'おいかけっこ',tend:'畑の世話',water:'水やり',till:'畑を耕している',plant:'植えている',build:'建てている',craft:'家具づくり',harvest:'収穫中',gather:'食べ物あつめ',repair:'修理',otakiget:'おたきあげの素材をとりに',otaki:'おたきあげ',rest:'ベンチで休んでいる',bathe:'おふろに入っている',weed:'草むしり',douse:'火を消している',cgrab:'料理の材料をとりに',nmeet:'ヌシ様をむかえる',pickseed:'種ひろい',pickdrop:'おとしものひろい',offer:'おそなえ中',flee:'にげている',patrol:'見回り',wander:'おさんぽ',idle:'ひとやすみ'};

function decide(r){TAKEN=new Set();for(const q of S.res){if(q===r||q.hidden)continue;if(q.act&&q.act.stand>=0)TAKEN.add(q.act.stand);if(!q.act||q.act.stage!=='walk')TAKEN.add((q.y|0)*W+(q.x|0))}
  for(const [j,t]of Object.entries(r.routeAvoid||{})){if(t>S.t)TAKEN.add(+j);else delete r.routeAvoid[j]}
  try{const x=decide0(r);if(!r.act&&r.elem==='fire'&&!r.hidden&&r.hunger>=20)huntNear(r);return x}finally{TAKEN=null}}
function springThreat(r){if(WD!==1||!S.st2||!S.st2.cool)return null;let best=null,bd=1e9;for(const e of S.enemies){if(!e.spawned||e.dead||e.flee)continue;const D=EN[e.type];if(!D.ash&&!D.vol)continue;const d=Math.hypot(e.x-r.x,e.y-r.y)-(String(e.tg).startsWith('s')?20:0);if(d<bd){bd=d;best=e}}return best}/* 火山のふもとの最後の夜：温泉を冷やしにくる敵（いま冷やしている敵を先に） */
function huntSpot(G,en,maxD,r){if(r&&(Math.hypot(r.x-en.x,r.y-en.y)<=1.45||Math.hypot(r.x-en.x,r.y-en.y)<=2.25&&overFence(r.x,r.y,en.x,en.y))&&!fenceBetween(r.x,r.y,en.x,en.y))return (r.y|0)*W+(r.x|0);/* もう攻撃がとどいているなら、動かない（柵の内側から出ない） *//* 攻撃できる場所（1.4マス以内で、壁をはさまない）のうち、いちばん近く。柵の内側からとどくなら、外へは出ない */const fo=fenceOut();let j=-1,bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||(maxD&&G.dist[k]>maxD)||!walk(k))continue;const cx=k%W+.5,cy=((k/W)|0)+.5,h=Math.hypot(cx-en.x,cy-en.y),ok=(h<=1.4||h<=2.2&&overFence(cx,cy,en.x,en.y))&&!fenceBetween(cx,cy,en.x,en.y),d=ok?G.dist[k]*.02+(fo[k]?6:0):50+Math.abs(h-1.3)+G.dist[k]*.02;if(d<bd){bd=d;j=k}}return j}
function pickFoe(r,L){/* いちばん近いコワイノをねらう。前にねらった子が、それより3マス以内の近さなら、そのままねらう（同じくらいの距離の2ひきで、まよって止まらないように） */let en=null,bd=1e9;for(const e of L){const d=Math.hypot(e.x-r.x,e.y-r.y);if(d<bd){bd=d;en=e}}const pv=r.foeId!=null&&L.find(e=>e.id===r.foeId);if(pv&&Math.hypot(pv.x-r.x,pv.y-r.y)<=bd+3)en=pv;r.foeId=en?en.id:null;return en}
function huntNear(r){/* 火のせいれいが、近くにコワイノがいるのに何もしないときは、たたかいに行く */const en=pickFoe(r,S.enemies.filter(e=>e.spawned&&!e.dead&&Math.hypot(e.x-r.x,e.y-r.y)<10));if(!en)return false;const G=bfs(r.x|0,r.y|0);const j=huntSpot(G,en,60,r);if(j<0)return false;startAct(r,G,'patrol',j,{hunt:S.t});return true}
// 家の中：壁とドアで外から閉じられたマス。壁が壊れると外とつながって中ではなくなる
function insideSet(){const out=new Uint8Array(W*H),q=[];const open=j=>!HOME_DOORS.has(S.obj[j])&&walk(j);
  for(let x=0;x<W;x++)for(const y of[0,H-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}
  for(let y=0;y<H;y++)for(const x of[0,W-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}
  while(q.length){const j=q.pop(),x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!out[k]&&open(k)){out[k]=1;q.push(k)}}}
  return out}
let FOUT=null,FOUTT=-1;function fenceOut(){/* 柵（門もふくむ）と壁で外から閉じられていないマス。ここに入っていないマスが「柵の内側」 */const t=Math.floor(S.t);if(FOUT&&FOUTT===t)return FOUT;const out=new Uint8Array(W*H),q=[];const open=j=>walk(j)&&!GATE_IDS.has(typeAt(j))&&!HOME_DOORS.has(S.obj[j]);
  for(let x=0;x<W;x++)for(const y of[0,H-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}for(let y=0;y<H;y++)for(const x of[0,W-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}
  while(q.length){const j=q.pop(),x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!out[k]&&open(k)){out[k]=1;q.push(k)}}}
  FOUT=out;FOUTT=t;return out}
let PMASK=null,PMASKT=-1;function patrolMask(){/* 見回りの場所：1＝柵・塀（家の壁・ドアがまざってもよい）でかこまれた所、2＝家のまわり3マス、3＝家の中。ゲームの1分ごとに作りなおす */const t=Math.floor(S.t);if(PMASK&&PMASKT===t)return PMASK;
  const m=new Uint8Array(W*H),out=new Uint8Array(W*H),q=[],bar=j=>{const o=typeAt(j);return FENCE_IDS.has(o)||HOME_WALLS.has(o)||HOME_DOORS.has(o)};
  for(let x=0;x<W;x++)for(const y of[0,H-1]){const j=y*W+x;if(!bar(j)&&!out[j]){out[j]=1;q.push(j)}}for(let y=0;y<H;y++)for(const x of[0,W-1]){const j=y*W+x;if(!bar(j)&&!out[j]){out[j]=1;q.push(j)}}
  while(q.length){const j=q.pop(),x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!out[k]&&!bar(k)){out[k]=1;q.push(k)}}}
  for(const h of HOUSES)for(const j of h.set){const x=j%W,y=(j/W)|0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)m[ny*W+nx]=2}}
  for(let j=0;j<W*H;j++)if(!out[j]&&!bar(j))m[j]=1;for(const h of HOUSES)for(const j of h.set)m[j]=3;
  PMASK=m;PMASKT=t;return m}
function graveCheck(){if(isNight()||STATUE<0||!cnt('grave')||S.graveDay===dayNo())return;const gs=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='grave'&&S.dyn[j]&&!S.dyn[j].buried)gs.push(j);if(!gs.length)return;
  let G=null;for(const r of S.res){if(r.hidden)continue;const g=bfs(r.x|0,r.y|0);if(nearest(g,j=>adjOf(j,k=>k===STATUE||k===STATUE+W)>=0,300)>=0){G=g;break}}if(!G)return;/* 神殿まで行ける子から見て */
  if(gs.some(j=>nearest(G,k=>adjOf(k,q=>q===j)>=0,300)<0)){S.graveDay=dayNo();toast('お墓まで行けません','warn')}}/* とどかない所にあるお墓は、動かさずに知らせる（1日1回） */
function trapCheck(){if(isNight()||!S.obj.some((o,j)=>storageAt(j,'food')))return;for(const r of S.res){if(r.hidden||!isKey(r.name)||r.trapDay===dayNo())continue;const G=bfs(r.x|0,r.y|0);if(nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,400)<0){r.trapDay=dayNo();toast(r.name+'がとじこめられています','warn')}}}/* 物語の子が、かこまれて食料箱へ行けないときは知らせる（1日1回） */
function hideIn(r,G){if(S.food>0&&S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<7)&&(goEatSafe(r)||goEatSafe(r,true)))return true;/* 食料があれば、かくれずに、すぐ食料箱へ食べにいく（安全な箱がなければ、コワイノのすぐそばを通らずに行ける箱へ） */if(!HOUSES.length||!S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<7))return false;const hs=new Set();for(const h of HOUSES)for(const q of h.inside)hs.add(q);const k=nearest(G,j=>hs.has(j)&&walk(j)&&!HOME_DOORS.has(S.obj[j]),60);if(k<0)return false;startAct(r,G,'flee',k,{house:true,food:1,run:true});return true}/* 火の子は、おなかがへってコワイノがそばにいたら、まず家の中へにげこんで、それから食べにいく */
function fleeHit(r,G){
  if(r.elem==='fire'&&r.hunger<50&&hideIn(r,G))return true;
  if(r.hunger<50&&S.food>0){const sj=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,60);if(sj>=0){r.refill=S.t+60;startAct(r,G,'fetch',sj,{run:true});return true}}/* おなかがすいていたら、にげながら食料箱でごはんをとる */
  if(r.elem==='fire'&&S.food>0&&r.hunger<hMax(r)-8){const sj=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,60);if(sj>=0){r.refill=S.t+60;startAct(r,G,'flee',sj,{food:1});return true}}/* 火の子は、おなかがすいていて食料があるときだけ、食料箱へ逃げる（食べられないのに箱の前でにげ続けない） */
  if(isNight()&&r.elem!=='fire'){const out=insideSet(),bj=nearest(G,j=>BEDSET.has(S.obj[j])&&!out[j]&&free('o'+j,1)&&bedFor(j,r),200);if(bj>=0){const b=BL.bed.sleep;startAct(r,G,'sleep',bj,{key:'o'+bj,obj:bj,rate:b.rate,pt:b.pt,run:true});return true}}
  const ens=S.enemies.filter(e=>e.spawned&&!e.dead),fr=r.elem==='fire'?null:S.res.find(q=>q!==r&&q.elem==='fire'&&!q.hidden);/* 「コワイノ」からはなれる。火のせいれいがいれば、そのそばへ */
  const fo=fenceOut();let best=-1,bs=-1e9;for(let j=0;j<W*H;j++){const d=G.dist[j],ins=!fo[j];if(!(d>=3&&d<=(ins?30:14))||!VILL[j])continue;/* にげるのは村（家・物のまわり）だけ */const x=j%W+.5,y=((j/W)|0)+.5;let me=99;for(const e of ens)me=Math.min(me,Math.hypot(x-e.x,y-e.y));if(me<2)continue;const sc=(fr?Math.min(me,6)-Math.hypot(x-fr.x,y-fr.y)*.8-d*.05:me-d*.15)+(ins?10:0);if(sc>bs){bs=sc;best=j}}/* 柵の内側へ、すすんで逃げる */
  if(best>=0){startAct(r,G,'flee',best);return true}return false}
function fleeGraph(r){const bl=new Set();for(const e of S.enemies){if(!e.spawned||e.dead)continue;const ex=e.x|0,ey=e.y|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=ex+dx,ny=ey+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)bl.add(ny*W+nx)}}bl.delete((r.y|0)*W+(r.x|0));const G=roadSearch(r.x|0,r.y|0,bl);G.bl=bl;return G}/* 「コワイノ」のすぐそばを通らずに逃げられる道 */
function withFlee(r,fn,G){const Gf=fleeGraph(r);let ok=false;FLEEBL=Gf.bl;try{ok=fn(r,Gf)}finally{FLEEBL=null}return ok||fn(r,G)}
function fleeAlarm(r,G){
  if(r.elem==='fire'&&r.hunger<50&&hideIn(r,G))return true;
  if(r.elem==='fire'){if(S.food>0){if(r.hunger<hMax(r)-8){const sj=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,60);if(sj>=0){r.refill=S.t+60;startAct(r,G,'flee',sj,{food:1});return true}}}else{const f=ripeAdj(['berry','fruit']),fj=nearest(G,j=>f(j)>=0,60);if(fj>=0){const k=f(fj);startAct(r,G,'forage',fj,{key:'o'+k,obj:k});return true}const bj=nearest(G,j=>adjOf(j,k=>S.obj[k]==='berry'||S.obj[k]==='fruit')>=0,60);if(bj>=0){startAct(r,G,'flee',bj,{food:1});return true}}}/* 火の子は、おなかがすいていて食料があるときだけ食料箱へ逃げる。食べ物がなければ、ベリーの茂みや果物の木へ逃げて、実を食べる */
  const en=S.enemies.find(e=>e.spawned&&!e.flee);if(!en)return false;const fo=fenceOut();let best=-1,bs=-1e9;for(let j=0;j<W*H;j++){const d=G.dist[j],ins=!fo[j];if(d<2||d>(ins?30:12)||!VILL[j])continue;/* にげるのは村（家・物のまわり）だけ */const sc=Math.hypot(j%W+.5-en.x,((j/W)|0)+.5-en.y)-d*.2+(ins?10:0);if(sc>bs){bs=sc;best=j}}/* 柵の内側へ、すすんで逃げる */
  if(best>=0){startAct(r,G,'flee',best);return true}return false}
const foeNear=r=>S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<7);/* すぐそば（7マス）にコワイノがいる */
const PHEWDL={wood:0,water:.4,earth:.8,fire:1.2,wind:1.6};/* ふぅのリアクションを始めるまでの時間（秒） */
function decide0(r){
  const tx=r.x|0,ty=r.y|0,G=bfs(tx,ty),here=ty*W+tx;
  if(r.phewNext){r.phewNext=false;if(!hostileNow(r))return startAct(r,G,'phew',-1)}/* コワイノがいなくなったら、その場で「ふぅ」 */
  if(r.cing&&isNight()){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null}/* 夜は料理ができないので、持っている材料は食料箱にもどす */
  if(r.wantEat){r.wantEat=0;if(r.hunger<hMax(r)-8&&!r.meal&&goEat(r,G))return}
  if(r.refill&&r.hunger<hMax(r)-1&&S.food>0&&!r.meal&&goEat(r,G))return;/* マックスまで食べてから、たたかいにもどる */
  if(r.meal&&S.enemies.some(e=>e.spawned&&!e.dead))return startAct(r,G,'eat',-1,{pt:0,pw:0});/* コワイノがいるときは、とってきたごはんを、その場で食べる */
  if(r.elem!=='fire'&&r.hunger<hMax(r)*.5&&S.food>0&&!(r.eatTry>S.t)&&S.enemies.some(e=>e.spawned&&!e.dead)){if(goEatSafe(r))return;r.eatTry=S.t+10}/* コワイノがいても、おなかが半分より少なければ、ふるえたり逃げたりするより先に、安全に行ける食料箱へ食べにいく（行けなければ10分ごとにためす） */
  if(isNight()&&r.elem==='wood'&&r.hunger>=50&&!r.coffin){for(const w of TOWERS){if(S.obj[w]!=='watch'||!free('wp'+w,1)||S.res.some(q=>q!==r&&q.act&&q.act.type==='watchpost'&&q.act.obj===w))continue;const st=nearest(G,k=>walk(k)&&adjOf(k,q=>q===w||(S.obj[q]==='part'&&S.ref[q]===w))>=0,120);if(st>=0)return startAct(r,G,'watchpost',st,{key:'wp'+w,obj:w})}r.wpNo=S.t+60}/* 行ける見張り台がなければ、しばらく起こさない *//* 行けない見張り台はとばして、行ける台へ *//* 夜、コワイノがいるあいだ、木のせいれいが見張り台に立つ（1つに1人） */
  if(!isWatch(r)&&hostileNow(r)&&r.hunger>=50&&!r.coffin&&goShiver(r,G))return;/* たたかえない子は、コワイノがいるあいだ、家でふるえる *//* 食べ物のところへ逃げてきたら、ちゃんと食べる */
  // 夜に家の中にいるせいれいは、おなかがすいても外へは出ない（見張り番の火のせいれいはべつ）
  if(isNight()&&!(isWatch(r)&&S.enemyOn&&r.hunger>=50)&&!(r.hunger<50&&S.food>0)&&!(r.hunger<hMax(r)*.5&&S.food>0)&&!HOME_DOORS.has(S.obj[here])){const out=insideSet();if(!out[here])for(let j=0;j<W*H;j++)if(out[j]||HOME_DOORS.has(S.obj[j]))G.dist[j]=-1}
  if(r.meal)return goMeal(r,G);
  if(r.hunger<50&&!(r.noEatU>S.t)){if(!foeNear(r))return goEat(r,G);if(goEatSafe(r))return;r.noEatU=S.t+10}/* そばにコワイノがいても、安全に行ける食料箱（家の中か、コワイノから4マス以上はなれた所）なら食べにいく *//* ごはんは、なによりも先（すぐそばにコワイノがいるときは、逃げるのが先）。基地から遠いときは早めに帰る */
  if(r.alarm!=null&&S.t-r.alarm<120&&r.hunger>=10&&!r.meal&&!(r.elem==='fire'&&r.hunger>=50)&&S.enemies.some(e=>e.spawned&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<10)){if(withFlee(r,fleeAlarm,G))return}
  if(isNight()&&r.hunger<hMax(r)*.5&&S.food>0){if(!S.enemies.some(e=>e.spawned&&!e.dead&&Math.hypot(e.x-r.x,e.y-r.y)<7))return goEat(r,G);if(goEatSafe(r))return}/* 夜も、おなかが半分になったら食べにいく（見回りの子もふくめて） */
  if(r.elem==='fire'&&r.hunger>=50&&!r.refill&&!r.coffin){{const st=springThreat(r);if(st){const j=huntSpot(G,st,60,r);if(j>=0)return startAct(r,G,'patrol',j,{hunt:S.t})}}/* 最後の夜は、温泉を守りに行く */const en=pickFoe(r,S.enemies.filter(e=>e.spawned&&!e.dead&&nearRes(e)));/* 「コワイノ」が拠点に近づいたら、たたかいに行く（おなか＝体力が少ないときは行かない）。おなかいっぱいになったら、ほかのことより先に、すぐ行く */
    if(en){const j=huntSpot(G,en,60,r);/* 敵と同じマスではなく、ひとます離れて */if(j>=0)return startAct(r,G,'patrol',j,{hunt:S.t})}}/* となりに行けなくても、いちばん近くまで行く。見回りの中断でぐるぐるしないよう hunt をつける */
  if(!isNight()&&hour()>=22&&r.dinD!==dayNo()&&r.hunger<hMax(r)-10&&S.food>0&&!foeNear(r)){r.dinD=dayNo();r.refill=S.t+60;if(goEat(r,G))return}/* 夜ごはんは22時。食卓のいすにすわって、おなかいっぱい食べる（夜中に食べに出ないように） */
  if((r.coffin||cnt('grave'))&&goBurial(r,G))return;
  if(r.cing&&!isNight()){const ov=q=>S.obj[q]==='oven'&&free('o'+q,1);let j=nearest(G,j=>adjOf(j,q=>q===r.cing.ov&&ov(q))>=0,90);if(j<0)j=nearest(G,j=>adjOf(j,ov)>=0,90);
    if(j>=0){const q=adjOf(j,k=>k===r.cing.ov&&ov(k))>=0?r.cing.ov:adjOf(j,ov);r.cing.ov=q;const st=ovenStand(G,q);return startAct(r,G,'cook',st>=0?st:j,{key:'o'+q,obj:q})}
    if(!cnt('oven')){const R=RECIPES.find(x=>x.out===r.cing.rec);for(const k in R.need)addFood(k,R.need[k]);r.cing=null}}
  if(r.toStor){if(carryN(r)>0&&foodCap()>0)return goStore(r,G);r.toStor=0}
  {const h=hour();if(!isNight()&&r.hunger>=40&&h>=18+hash((r.id||0)*13+5)*.4&&r.bathD!==dayNo()&&goBathe(r,G))return}/* 夜（23時〜）は水浴びを始めない（始めても、すぐやめさせられるので）。おなかがすいているときは、ごはんが先 */
  if(r.elem==='water'&&!isNight()&&r.hunger>=40&&r.bathW!==dayNo()&&hour()>=10+hash((r.id||0)*7+dayNo())*6){const bd=r.bathD;r.bathW=dayNo();if(goBathe(r,G))return;r.bathD=bd}/* 水のせいれいは、昼間にも水あそびをする */
  if(WD===1&&!isNight()&&r.hunger>=40&&springN()&&r.energy<35&&!((r.bathCD||0)>S.t)){r.bathCD=S.t+240;const bd=r.bathD;if(goBathe(r,G))return;r.bathD=bd}/* 温泉の村：つかれたら温泉へ */
  if(r.afterBath>S.t&&!isNight()&&(r.restCD||0)<=S.t){r.afterBath=0;const isB=j=>(BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j));const bj=nearest(G,j=>isB(j)&&free('o'+j,1),40);if(bj>=0)return startAct(r,G,'rest',bj,{key:'o'+bj,obj:anc(bj),seat:bj})}/* 湯上がりは、ベンチでひと休み *//* 水浴びは18時。せいれいごとに少しずつずれる */
  if(r.elem==='water'&&r.hunger>=25&&!isNight()&&goDouse(r,G))return;/* 水の子は、燃えている物があれば、まず消しにいく */
   if(heldN(r)>0&&r.elem==='earth'&&r.hunger>=55&&!isNight()&&tryJob(r,G,'repair'))return;/* 土のせいれいは、ついでの収穫・木切りより修理が先 */
  if(heldN(r)>0){if(heldN(r)<capOf(r)&&!isNight()&&r.hunger>=30&&!r.highFirst){const cm=r.cmat||{},gm=(cm.stone||0)>0?['mine']:(cm.wood||0)>0||(cm.bamboo||0)>0?['chop']:[];for(const k of['drop','harvest',...gm,'gather'])if(tryJob(r,G,k))return}/* 落ちている素材・食べ物も、持てる数までまとめてひろってから運ぶ */
    if(carryN(r)>0&&foodCap()>0)return goStore(r,G)}
  if(r.cmat&&matCap()>0)return goStoreMat(r,G);
  else if(isNight()&&isWatch(r)){// 火のせいれい（と、まもりをおぼえたフタバ）は寝ないで見回り
    if(r.elem==='fire'&&r.hunger<50&&hideIn(r,G))return;/* おなかが50より少ないときは、たたかわずに家へにげる */
    {const e=r.elem!=='fire'?null:pickFoe(r,S.enemies.filter(e=>e.spawned&&!e.dead&&nearRes(e)));if(e){const t=huntSpot(G,e,60,r);/* 届かない所にいても、いちばん近くまで行く */if(t>=0)return startAct(r,G,'patrol',t,{hunt:S.t})}}/* 拠点にコワイノが入ったら、まっすぐたたかいに行く */
    if(r.name===POKO){const hk=keyName('fire'),fs=S.res.filter(t=>t!==r&&!t.hidden&&t.elem==='fire'),tg=fs.find(t=>t.name===hk)||fs[0];if(tg&&Math.hypot(tg.x-r.x,tg.y-r.y)>1.5){let q=-1,bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||G.dist[k]>40||!walk(k))continue;const d=Math.hypot(k%W+.5-tg.x,((k/W)|0)+.5-tg.y)+G.dist[k]*.02;if(d<bd){bd=d;q=k}}if(q>=0)return startAct(r,G,'patrol',q)}}/* フタバは、火の子のそばについて回る */
    {const pm=patrolMask(),others=S.res.filter(t=>t!==r&&!t.hidden&&!t.dead),sx=STATUE%W,sy=(STATUE/W)|0;/* 見回る所：柵・塀でかこまれた所 → 家のまわり3マス → ほかの子のまわり3マス → 神殿のまわり3マス（家の中はのぞく） */
      const tiers=[j=>pm[j]===1,j=>pm[j]===2,others.length?j=>others.some(t=>Math.abs(j%W+.5-t.x)<3.5&&Math.abs(((j/W)|0)+.5-t.y)<3.5):null,STATUE>=0?j=>Math.abs(j%W-sx)<=3&&Math.abs(((j/W)|0)-sy)<=3:null];
      for(const f of tiers){if(!f)continue;const ok=j=>walk(j)&&pm[j]!==3&&f(j);let j=nearest(G,j=>ok(j)&&Math.random()<.04,8);if(j<0)j=nearest(G,ok,200);if(j>=0)return startAct(r,G,'patrol',j)}}
    return startAct(r,G,'wander',(r.y|0)*W+(r.x|0))}
  if(r.energy<25||isNight())return goSleep(r,G,S.enemies.some(e=>e.spawned));
  if(r.hunger<55&&!foeNear(r))return goEat(r,G);
  if(festOn()&&!isNight()&&r.energy>=30&&!foeNear(r)&&festAct(r,G))return;/* おまつりの日は、朝7時から夜10時まで、おどる・屋台・おしゃべり・見てまわる。夜8時から9時は花火 */
  if(!isNight()&&r.fun>=99&&tryJob(r,G,'offer'))return;
  // 楽しさが低いときは、仕事より先に遊びにいく
  if(!isNight()&&r.fun<(r.elem==='wind'?60:30)&&goPlay(r,G,true))return;/* 風の子はよく遊ぶ */
  if(!isNight()&&Math.random()<.05&&goPlay(r,G,true)){if(r.act)r.act.rand=1;return}/* たのしさがへっていなくても、ときどき（5%）遊ぶ */
  if(goWork(r,G,true))return;
  if(!isNight()&&r.fun<80&&Math.random()<(S.today==='oshaberi'?.75:.45)&&trySocial(r,G))return;
  return goPlay(r,G);
}
const ripeAdj=types=>j=>adjOf(j,k=>types.includes(S.obj[k])&&S.dyn[k]&&S.dyn[k].g>=100&&free('o'+k,1));
const SEATPT={stool:1,chair:2,pouf:3,achair:5},SEATPW={stool:.45,chair:.9,pouf:1.35,achair:2.25};/* SEATPT：経験値、SEATPW：パワー *//* いすの効果：スツール＜椅子＜クッション＜クッションチェア＜ひじかけいす（×0.45がパワー） */
function goMeal(r,G){
  if(r.hunger<15||isNight())return startAct(r,G,'eat',-1,{pt:0,pw:0});
  let best=-1,bs=1e9,tdir=0;
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>40||!free('seat'+j,1))continue;
    const td=[-1,1,-W,W].find(o=>typeAt(j+o)==='table');if(td==null)continue;const sc=d-(SEATPT[S.obj[j]]||0)*10;if(sc<bs){bs=sc;best=j;tdir=td}}
  if(best>=0)return startAct(r,G,'eat',best,{key:'seat'+best,tdir,pt:BL.table.eat.pt+(SEATPT[S.obj[best]]||0),pw:(BL.table.eat.pw+(SEATPW[S.obj[best]]||0))*(1+.1*spotN(best+tdir,'dining','party'))});/* ダイニング・ガーデンパーティー：パワー+10% */
  return startAct(r,G,'eat',-1,{pt:0,pw:0});
}
function fishLoot(r){/* つり：魚でないときは、空き缶・枝・レシピ・レアな家具 */const q=Math.random();sfxAt('catch',r.x,r.y);
  if(q<.07){const oo=FURN.filter(id=>BL[id]&&BL[id].offerOnly&&(!WIND_STAGE_TOYS.has(id)||WD===4));if(oo.length){const id=pick(oo);giveItem(id,1);r.bubble='✨';addFloat(r.x,r.y-1.8,'レア！');queueItemGift({[id]:1},'つりあげた！');return}}
  if(q<.15){r.bubble='📜';takeDrop({id:'recipe',n:1},r);return}
  const k=q<.6?'can':'eda';r.bubble='chip:drop:'+k;/* 落ちているときと同じ絵 */if(roomN(r)>0)addMat(r,k,1);else dropAt(r.x,r.y,'mat:'+k,1)}
const AREAW=27,AREAN=4,areaOf=k=>((((k/W)|0)/AREAW)|0)*AREAN+((k%W)/AREAW|0);/* マップを4×4の16エリア（1エリア27×27マス）にわける */const WEEDDAY=3,WEEDMAX=20,FUNDAY=3,FUNMAX=20,KINODAY=1,KINOMAX=5,EDADAY=5,EDAMAX=20;/* 1エリアの雑草・きのこの最大 */
function weedMorning(first){/* 毎朝、16エリアごとに：雑草3本（20本まで）・ふんばり草3本（よみがえった土地、20本まで）・きのこ1本（木のそば、5本まで）・枝5本（落とし物、20本まで） */
  const st=WD===1?1:0,ok=k=>S.ground[k]===0&&!S.obj[k]&&!S.floor[k]&&!RFC.has(k)&&!RUGC.has(k),NA=AREAN*AREAN;const WN=new Array(NA).fill(0),FN=new Array(NA).fill(0),KN=new Array(NA).fill(0),RV=Array.from({length:NA},()=>[]),KT=Array.from({length:NA},()=>[]);
  S.obj.forEach((o,j)=>{const a=areaOf(j);if(o==='kinoko')KN[a]++;else if(o==='weedc')FN[a]++;else if(WEEDS.has(o))WN[a]++;if(o==='ntree'||o==='tree'||o==='deadtree'||o==='bamboo')KT[a].push(j)});for(const k of REV)RV[areaOf(k)].push(k);/* エリアごとの数 */
  const rk=a=>((((a/AREAN)|0)*AREAW+((Math.random()*AREAW)|0))*W+(a%AREAN)*AREAW+((Math.random()*AREAW)|0));/* エリアの中のマス */
  for(let a=0;a<NA;a++){
    for(let f=0,t=0;t<200&&RV[a].length&&f<FUNDAY&&FN[a]<FUNMAX;t++){const k=pick(RV[a]);if(!ok(k))continue;S.obj[k]='weedc';f++;FN[a]++}/* ふんばり草：よみがえった土地に */
    for(let n=0,t=0;t<200&&n<WEEDDAY&&WN[a]<WEEDMAX;t++){const k=rk(a);if(k<0||k>=W*H||!ok(k))continue;S.obj[k]='weed'+st+(REV.has(k)?'g':'k');n++;WN[a]++}/* 雑草：よみがえった土地は緑の草、荒れた土地は枯れた草 */
    for(let n=0,t=0;t<60&&KT[a].length&&n<KINODAY&&KN[a]<KINOMAX;t++){const j=pick(KT[a]),c=[j-1,j+1,j-W,j+W].filter(k=>k>=0&&k<W*H&&areaOf(k)===a&&ok(k));if(c.length){S.obj[pick(c)]='kinoko';n++;KN[a]++}}}/* きのこ：木のそば */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='weedc'&&!REV.has(j))S.obj[j]='weed'+st+'k';/* 荒れた土地のふんばり草は、枯れた草にする */
  {const TR=Array.from({length:AREAN*AREAN},()=>[]),EN=new Array(AREAN*AREAN).fill(0);S.obj.forEach((o,j)=>{if(o==='ntree'||o==='tree'||o==='deadtree'||o==='fruit')TR[areaOf(j)].push(j)});for(const d of S.drops||[])if(d.id==='mat:eda')EN[areaOf(d.y*W+d.x)]++;
   for(let a=0;a<AREAN*AREAN;a++){const T=TR[a];let add=0;for(let t=0;t<200&&T.length&&add<EDADAY&&EN[a]<EDAMAX;t++){const j=pick(T),k=j+((Math.random()*5)|0)-2+(((Math.random()*5)|0)-2)*W;if(k<0||k>=W*H||!ok(k)||areaOf(k)!==a||S.drops.some(d=>d.y*W+d.x===k))continue;S.drops.push({x:k%W,y:(k/W)|0,id:'mat:eda',n:1});add++;EN[a]++}}}/* 枝：16エリアごとに、木のまわり2マスに毎朝5本（1エリアの地面に20本まで） */
}
function takenokoMorning(){/* 火山：竹のとなりに、たけのこが生える（1本の竹ごとに8%・マップに12本まで）。とらずに3日たつと竹になる */let n=0,ch=false;const bam=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(o==='takenoko'){const d=S.dyn[j]||(S.dyn[j]={g:100,age:0});d.age=(d.age||0)+1;if(d.age>=3){S.obj[j]='bamboo';delete S.dyn[j];ch=true}else n++}else if(o==='bamboo')bam.push(j)}
  for(const j of bam){if(n>=12)break;if(Math.random()>=.08)continue;const x=j%W,c=[j-1,j+1,j-W,j+W].filter(k=>k>=0&&k<W*H&&Math.abs(k%W-x)<=1&&!S.obj[k]&&!S.floor[k]&&S.ground[k]===0&&!RFC.has(k)&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===k));if(!c.length)continue;const k=pick(c);S.obj[k]='takenoko';S.dyn[k]={g:100,age:0};n++;ch=true}
  if(ch)recount()}
function bambooMig(){/* 竹のなかった火山のセーブ：森の枯れ木の半分を竹に、基地のまわりに竹を6本 */S.flags=S.flags||{};if(WD!==1||S.flags.bambooV)return;S.flags.bambooV=1;if(S.obj.some((o,j)=>o==='bamboo'&&j%W>=OFF&&j%W<OFF+OW&&j/W>=OFF&&j/W<OFF+OW))return;/* 広げた外がわの竹は数えない */
  for(let j=0;j<W*H;j++){if(S.obj[j]!=='deadtree')continue;const ox=j%W-OFF,oy=((j/W)|0)-OFF;if(ox>=0&&oy>=0&&ox<14&&oy<16&&Math.random()<.5)S.obj[j]='bamboo'}
  let m=0;for(let t=0;t<600&&m<6;t++){const x=CX-12+((Math.random()*24)|0),y=CY-12+((Math.random()*24)|0),j=y*W+x;if(Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7)continue;if(S.obj[j]||S.floor[j]||S.ground[j]!==0)continue;S.obj[j]='bamboo';m++}}
function bambooIdea(){/* はじめて竹を手に入れたら、竹の家具を思いつく */if(WD!==1||S.free||!((S.mat.bamboo||0)>0)||(S.guardianIdeas||{}).takebench)return;const ids=['takebench','takeakari','shishiodoshi'];S.recipes||(S.recipes={});S.guardianIdeas||(S.guardianIdeas={});ids.forEach(id=>{S.recipes[id]=true;S.guardianIdeas[id]=true});const t='あたらしいかたち：'+ids.map(id=>BL[id].name).join('・');toast(t,'good');memo('💡',t)}
function useNat(j){const o=S.obj[j];if(!o)return;const n=(S.hp['n'+j]||0)+1;if(n<(o==='boulder'?4:10)){S.hp['n'+j]=n;return}
  delete S.hp['n'+j];const x=j%W,y=(j/W)|0;if(o==='boulder'){clearObj(j);burst(j,'block');recount();checkQuest();return}if(!VILL[j])(S.regrow||(S.regrow=[])).push({j,id:o,day:dayNo()+3})/* 3日後の朝に生えなおす */;clearObj(j);burst(j,'block');recount()}
function ovenStand(G,q){let b=-1,bd=1e9;for(const[k,pen]of[[q-1,0],[q+1,0],[q+W,2],[q-W,40]]){const d=G.dist[k];if(d<0||!walk(k))continue;if(d+pen<bd){bd=d+pen;b=k}}return b}
function goStoreMat(r,G){const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'mat'))>=0,200);if(j>=0)return startAct(r,G,'smat',j);return startAct(r,G,'idle',-1,{dur:15})}
function goStore(r,G){const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,90);if(j>=0)return startAct(r,G,'store',j);return startAct(r,G,'idle',-1,{dur:15})}
function goEatSafe(r,any){/* コワイノのすぐそばを通らずに行けて、家の中・柵や壁でかこまれた所（コワイノが中にいない）・コワイノから4マス以上はなれた所の食料箱へ、走って食べにいく */if(!(S.food>0))return false;const Gf=fleeGraph(r),fo=fenceOut(),al=S.enemies.filter(e=>e.spawned&&!e.dead),encl=al.every(e=>fo[(e.y|0)*W+(e.x|0)]),safe=j=>!!roomOf(j)||(encl&&!fo[j])||!al.some(e=>Math.hypot(e.x-(j%W+.5),e.y-(((j/W)|0)+.5))<4);
  const j=nearest(Gf,j=>(any||safe(j))&&adjOf(j,k=>storageAt(k,'food'))>=0,200);if(j<0)return false;r.refill=S.t+60;startAct(r,Gf,'fetch',j,{run:true});return !!r.act}
const hungry=r=>r.hunger<50&&S.food>0&&!(r.noEatU>S.t);/* おなかが50より少なく、食べにいける（どんなときも、食べにいく） */
function goEat(r,G){if(r.cmat&&matCap()>0&&r.hunger>=50&&!isNight()&&!hostileNow(r)&&!foeNear(r))return goStoreMat(r,G);/* ごはんに行く前に、持っている素材をしまう（おなか50より少なければ、そのまま食べにいく） */
  if(S.food>0){
    const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,200);
    if(j>=0){startAct(r,G,'fetch',j);return r.act&&r.act.type==='fetch'}
  }
  const f=ripeAdj(['berry','fruit']);const j=nearest(G,j=>f(j)>=0);
  if(j>=0){const k=f(j);startAct(r,G,'forage',j,{key:'o'+k,obj:k,run:S.food<=0});return r.act&&r.act.type==='forage'}/* 食料がゼロなら、茂みへは走る */
  r.bubble='😣';r.noEatU=S.t+20;goWander(r,G);return false;/* 食べにいけたら true。食べにいけないときは、20分は「おなか50で食べにいく」を休む（毎コマやめてはえらびなおすのをふせぐ） */
}
const fireMul=r=>(r.energy<10?.5:r.energy<25?.7:1)*(r.fun<20?.8:1);/* 火のせいれいは、つかれても楽しさが減ってもたたかう。そのぶん、こうげきが弱くなる（つかれ×0.7・楽しさ低下×0.8） */
const nightClear=()=>!!S.nightHad&&!S.nushi&&S.enemies.every(e=>e.dead);/* 今夜のコワイノを倒し切った */
const isWatch=r=>(r.elem==='fire'||r.name===POKO&&!WD&&!!S.flags.guard)&&!nightClear()/* コワイノをぜんぶ倒したら、火の子もフタバも寝る */;/* 夜の見回りをする子（フタバは、こもれびのまもりをおぼえたら） */
const hostileNow=r=>S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&foeAt(e,r));/* コワイノが、自分の3マス以内か、自分のいる家に来たときだけ、こわがる */
function goShiver(r,G){/* 家の中（なければ、いまの場所）で、ふるえる */let k=-1;if(HOUSES.length){const hs=new Set();for(const h of HOUSES)for(const q of h.inside)hs.add(q);k=nearest(G,j=>hs.has(j)&&walk(j)&&!HOME_DOORS.has(S.obj[j]),200)}if(k<0)return withFlee(r,fleeAlarm,G);/* 家がなければ、逃げつづける */startAct(r,G,'shiver',k,{run:true});return true}
function goSleep(r,G,run){
  if(!isNight()){const isB=j=>(BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j));const bj=nearest(G,j=>isB(j)&&free('o'+j,1),200);if(bj>=0)return startAct(r,G,'rest',bj,{key:'o'+bj,obj:anc(bj),seat:bj});if(cnt('bench')+cnt('takebench'))return startAct(r,G,'idle',-1,{dur:15})}/* 昼につかれたら、ベンチでひと休み（2人すわれる）。ベンチがあるのにうまっていたら、その場でひとやすみ。ベッドで眠るのは、夜と、ベンチがないときだけ */
  {const mb=myBed(r);if(mb>=0&&free('o'+mb,1)){const k=nearest(G,j=>j===mb,200);if(k>=0){const b=BL.bed.sleep;return startAct(r,G,'sleep',k,{key:'o'+k,obj:k,rate:b.rate,pt:b.pt,run:run&&!!isNight()})}}}/* じぶんのベッドがあれば、そこで眠る */
  const bedOK=j=>(BEDSET.has(S.obj[j])&&free('o'+j,1)&&bedFor(j,r));
  let j=nearest(G,j=>{if(!bedOK(j))return false;const h=roomOf(j);return !h||roomSleepN(h)<houseCap(h)},200);/* きゅうくつな家はなるべくさける */
  if(j<0)j=nearest(G,bedOK,200);
  if(j>=0){const b=BL[S.obj[j]].sleep;return startAct(r,G,'sleep',j,{key:'o'+j,obj:j,rate:b.rate,pt:b.pt,run:run&&!!isNight()})}
  if(isNight()&&HOUSES.length){// ベッドがない：家の中にいてもいいが、寝られない（家がなければ床で寝る）
    const hs=new Set();for(const h of HOUSES)for(const k of h.set)hs.add(k);
    const k=hs.size?nearest(G,j=>hs.has(j)&&walk(j)&&!HOME_DOORS.has(S.obj[j]),200):-1;
    return startAct(r,G,'stay',k,{run:run&&k>=0})}
  return startAct(r,G,'sleep',-1,{rate:.12,pt:1,ground:true});
}
function mate(a,b){const A=a.mates||(a.mates={}),B=b.mates||(b.mates={});A[b.id]=(A[b.id]||0)+1;B[a.id]=(B[a.id]||0)+1;if(A[b.id]===6){for(const x of[a,b])addFloat(x.x,x.y-1.4,'なかよし！');/* なかよしになったら、頭の上に「なかよし！」だけ */memo('🤝',a.name+'と'+b.name+'がなかよしになった');logEv(a.name+'と'+b.name+'がなかよしになった')}}/* いっしょに遊んだり食べたりした回数 */
const mateK=(r,ty)=>S.res.some(q=>q!==r&&((r.mates||{})[q.id]||0)>=6&&q.act&&q.act.type===ty&&q.act.stage==='do'&&Math.abs(q.x-r.x)+Math.abs(q.y-r.y)<5)?1.2:1;/* なかよしといっしょに寝る・休むと回復1.2倍 */
const bestMate=r=>{let b=null,n=5;for(const k in r.mates||{}){const q=S.res.find(x=>x.id===+k);if(q&&r.mates[k]>n){n=r.mates[k];b=q}}return b};
function socialBest(r,G){let best=null,bs=-1e9;
  for(const o of S.res){if(o===r||o.hidden)continue;const oj=(o.y|0)*W+(o.x|0),dd=G.dist[oj];
    if((r.chatCD||0)<S.t&&(o.chatCD||0)<S.t&&dd>=0&&dd<=16&&(!o.act||o.act.type==='wander'||o.act.type==='idle'||(o.act.stage==='walk'&&['chop','mine','play','fish'].includes(o.act.type)))&&o.hunger>35&&o.energy>25&&!o.carry&&!o.cmat&&!o.meal){
      const st=nearest(G,j=>[1,-1,W,-W].includes(j-oj)&&walk(j),14);if(st<0)continue;
      const tag=!isNight()&&r.energy>50&&o.energy>50&&Math.random()<.45;
      const s=8+(r.like==='chat'?6:0)-dd*.3+Math.random()*3;if(s>bs){bs=s;best={type:'chat',stand:st,o:{partner:o.id,tag}}}}}
  return best?{s:bs,b:best}:null}
