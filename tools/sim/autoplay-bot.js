/* 自動プレイ（草原）：はじめから、メインクエストを順に進める。ブラウザの中で動く（tools/sim/autoplay.cjs が読みこむ）。
   - 会話・知らせをとじる、話しかける、なかまを呼ぶ、クエストごとの物を置く、守りの光をあてる。
   - 守り神の出番（ミニゲーム）は、成功あつかいで進める（sacredPlayWin）。
   - BOT_OPTS：supply（パワー・食べ物・花のたねを補給し、やられないようにする。物語の進行だけをたしかめるとき）・light（守りの光を使う）・speed（倍速）。
   - 記録：BOT.log（クエスト・レベル・人数）・BOT.days（1日ごとの数字）・BOT.nights（夜の結果）。
   注意：この中で H という名前を使うので、マップの高さ H は使えない（S.obj.length を使う）。 */
(()=>{
const B=window.BOT={log:[],days:[],nights:[],q:-1,H:{},st:{},on:true,opts:Object.assign({supply:false,light:true,speed:20},window.BOT_OPTS||{})};
B.lg=m=>{B.log.push('D'+dayNo()+' '+hour().toFixed(1)+'h '+m)};
const vis=id=>{const e=document.querySelector(id);return e&&!e.hidden&&e.offsetParent!==null};
B.sites=id=>{let n=0;for(const j in S.dyn){const d=S.dyn[j];if(d&&d.build===id&&S.obj[j]==='site')n++}return n};
B.have=id=>cnt(id)+B.sites(id);
B.spot=(id,nx,ny,ok)=>{for(let r=0;r<30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=nx+dx,y=ny+dy;if(x<1||y<1||x>=W-1||y>=H-1)continue;if(ok&&!ok(x,y))continue;if(canPlace(id,x,y,false))return [x,y]}return null};
B.put=(id,nx,ny,ok)=>{const p=B.spot(id,nx,ny,ok);if(!p)return false;const a=B.have(id),i0=inv(id);place(id,p[0],p[1]);return B.have(id)>a||inv(id)<i0};
B.ordered=id=>S.orders.some(o=>o.type===id);
B.ensure=(id,n,nx,ny,ok)=>{if(B.have(id)>=n)return true;const b=BL[id];if(!b)return false;
  if(b.kind==='furn'||b.kind==='block'&&!S.unlocked[id]){if(inv(id)>0){B.put(id,nx,ny,ok)}else if(!B.ordered(id)&&recipeKnown(id)){orderFurn(id)}return false}
  B.put(id,nx,ny,ok);return B.have(id)>=n};
B.ui=()=>{
  const b=[...document.querySelectorAll('.idea-reveal button')].find(b=>!b.disabled);if(b){b.click();return true}if(document.querySelector('.idea-reveal'))return true;
  for(const id of ['#lvup','#rlv']){const e=document.querySelector(id);if(e&&!e.hidden){const bs=[...e.querySelectorAll('button')].filter(b=>!b.classList.contains('lvic'));if(bs.length){bs[bs.length-1].click();return true}}}
  if(vis('#dialog')){const bs=[...document.querySelectorAll('#dlgBtns button')].filter(b=>b.offsetParent!==null);try{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0}catch(e){}if(bs.length)bs[0].click();return true}
  if(typeof sheet!=='undefined'&&sheet!=null){closeSheet();return true}
  return false};
B.talk=()=>{ if(isNight())return;
  if(TALKW){if(TALKW===GOD){if(mainStoryBubbleReady())startTalk()}else{const tr=S.res.find(r=>r.name===TALKW&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(tr&&mainStoryBubbleReady(tr))startTalk()}return}
  for(const n in SEVW){const r=S.res.find(r=>r.name===n&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(r){sevTalk(SEVW[n]);return}}
  for(const n in SUBW){if(n===GOD){if(godHere()){subTalk(SUBW[n]);return}continue}const r=S.res.find(r=>r.name===n&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(r){subTalk(SUBW[n]);return}}
  if(S.summon){try{doSummon()}catch(e){B.lg('summon err '+e.message)}}
};
B.light=()=>{ if(!B.opts.light||!S.enemies.length||LIGHTCD>0||S.pt<20)return;let best=null,bd=1e9;for(const e of S.enemies){if(e.dead)continue;let d=1e9;for(const r of S.res)d=Math.min(d,Math.hypot(e.x-r.x,e.y-r.y));if(d<bd){bd=d;best=e}}if(best&&bd<12){B.lt=(B.lt||0)+1;guardLight(best)}};
B.tick=()=>{ if(!B.on||!S)return; try{
  if(B.ui())return;
  if(S.quest!==B.q){B.lg('QUEST '+S.quest+' '+(QUESTS[S.quest]?QUESTS[S.quest].id:'-')+' lv'+S.lv+' res'+S.res.length+' tp'+Math.floor(S.totalPt)+' food'+S.food);B.q=S.quest}
  if(S.lv!==B.lv){B.lg('LV '+S.lv+' tp'+Math.floor(S.totalPt));B.lv=S.lv}
  if(S.res.length!==B.rn){B.lg('RES '+S.res.map(r=>r.name+':'+r.elem[0]+(r.lv||'')).join(','));B.rn=S.res.length}
  if(S.cleared&&!B.cl){B.cl=1;B.lg('CLEARED')}
  const d=dayNo();if(d!==B.d0&&hour()>=12&&hour()<13){B.d0=d;const n=S.res.length||1;B.days.push([d,S.lv,Math.floor(S.totalPt),Math.floor(S.pt),S.food,S.res.length,JSON.stringify(S.deaths||0).length>3?Object.values(S.deaths).reduce((a,b)=>a+(+b||0),0):(S.deaths||0),Math.round(S.res.reduce((a,r)=>a+r.fun,0)/n),Math.round(S.res.reduce((a,r)=>a+r.hunger/hMax(r)*100,0)/n),QUESTS[S.quest]?QUESTS[S.quest].id:'-',cnt('farm'),S.nights,B.lt||0,GRASSN])}
  if(S.ns&&S.ns!==B.ns0){B.ns0=S.ns;B.nights.push([d,JSON.stringify(S.ns)])}
  if(B.opts.supply)for(const r of S.res){const m=hMax(r)*.6;if(r.hunger<m)r.hunger=m}
  B.light();B.talk();
  const now=performance.now();if(now-(B.ht||0)<1200)return;B.ht=now;
  const q=QUESTS[S.quest];if(q&&B.H[q.id])B.H[q.id](q);
  B.H._all();
}catch(e){B.lg('BOT ERR '+e.message+' '+(e.stack||'').split('\n')[1])}};
const H=B.H,inHouse=(x,y)=>x>=48&&x<=51&&y>=49&&y<=51,SR=()=>{const j=S.sacredRoot;return [j%W,(j/W)|0]};
B.plantAll=(id,nx,ny)=>{let n=0;while(inv(id)>0&&cnt('sprout')<10&&n++<10){if(!B.put(id,nx||58,ny||58))break}};
B.sow=k=>{let n=0;for(let j=0;j<S.obj.length;j++){if(S.obj[j]!=='farm')continue;const d=S.dyn[j];if(!d||d.crop)continue;if(cseed(k)<1)break;place('seed:'+k,j%W,(j/W)|0);n++}return n};
H.statue=()=>B.ensure('statue',1,54,57);H.stor=()=>B.ensure('stor',1,50,55);H.mbox=()=>B.ensure('mbox',1,52,55);
H.table=()=>B.ensure('table',1,49,50,inHouse);
H.wall=()=>{for(const [x,y] of [[49,52],[50,52],[51,52]])if(!S.obj[y*W+x])place('hwall',x,y)};
H.bed=()=>B.ensure('bed',1,48,49,inHouse);
H.path=()=>{if(pathMade()<5)B.put('path',58,60)};
H.fence4=()=>B.ensure('fence',4,54,76);
H.watch1=()=>{B.ensure('watch',1,56,70);B.ensure('spike',2,54,72)};/* 切り株のまわり（調べの物を置く所）は、あけておく */
H.kikyo=()=>B.plantAll('bellf');H.farm6=()=>{B.ensure('farm',6,44,56)};H.imoseed=()=>B.sow('imo');
const field=prep=>q=>{const [sx,sy]=SR(),st=B.st;
  if(typeof SPLAY!=='undefined'&&SPLAY){if(!st.pw||performance.now()-st.pw>4000){st.pw=performance.now();sacredPlayWin()}return}
  /* 調べの準備の物：依頼のあとに、切り株のそばへ置いた物だけが数に入る（前からある物では進まない）。足りないあいだは、持っていれば置き、なければたのむ・建てる */
  if(S.qTalked&&!fieldBuildOK(q.id)&&!B.sites(prep)){const near=(x,y)=>fieldDistance(y*W+x,S.sacredRoot)<=FIELD_NEAR_R-1,k=BL[prep].kind;
    if(k==='build')B.put(prep,sx+2,sy+6,near);else if(inv(prep)>0)B.put(prep,sx+2,sy+6,near);else if(!B.ordered(prep)&&recipeKnown(prep))orderFurn(prep)}
  if(!isNight()&&S.qTalked){try{fieldStoryTap(sx+1,sy+1)}catch(e){B.lg('fieldTap err '+e.message)}}};
H.earthListen=field('asabukuro');H.fireRoot=field('campfire');H.waterFilm=field('jar');H.windEcho=field('windmill');H.tower=field('bench');
H.fire=()=>{if(elemCount('fire')<1&&B.have('watch')<2)B.ensure('watch',2,52,70)};
H.wind=()=>{B.ensure('swing',2,58,54)};
H.kagemark=()=>{if(S.flags.kgMark!=null&&!S.flags.kgLook&&!isNight()){const j=S.flags.kgMark;if(typeof j==='number'){setMode('look');centerOn((j%W+.5)*TS,((j/W|0)+.5)*TS);onTap(VW/2,VH/2)}}};
H.nushi=()=>{if(!isNight()&&S.qTalked&&(S.shards||[]).length&&!B.st.nt||performance.now()-(B.st.nt||0)>8000){B.st.nt=performance.now();const [sx,sy]=SR();setMode('look');centerOn((sx+1.5)*TS,(sy+1.5)*TS);try{onTap(VW/2,VH/2)}catch(e){}}};
H._all=()=>{
  if(S.flags.tapAsk&&!S.flags.tapped&&sheet==null){S.flags.tapPend=true;openSheet('res',S.res[0].id)}
  if(S.quest<6)return;const n=S.res.length;
  for(const id in S.inv){const b=BL[id];if(b&&b.kind==='plant'&&S.inv[id]>0)B.plantAll(id,56+(dayNo()%5)*3,46+(dayNo()%7)*3)}
  if(S.quest>12)for(const k of ['imo','mugi','tomato','cabbage'])if(CROPS[k])B.sow(k);
  if((S.mat.eda||0)<12){let c=0;for(const d of S.drops){if(d.id==='mat:eda'&&!d.tap&&Math.hypot(d.x-54,d.y-54)<22&&!(S.fog&&fogAt(d.y*W+d.x))){d.tap=1;if(++c>=6)break}}}
  if((S.mat.kasa||0)<8){let c=0;S.wreq=S.wreq||{};for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='weed0k'&&!S.wreq[j]&&Math.hypot(j%W-54,(j/W|0)-54)<24&&!(S.fog&&fogAt(j))){S.wreq[j]=1;if(++c>=4)break}}}
  if(houseBedCount()+inv('bed')<n){if(!B.ordered('bed'))orderFurn('bed')}
  if(inv('bed')>0)(B.put('bed',48,49,inHouse)||B.put('bed',60,49));
  if(S.quest>7){for(const [id,k] of [['chair',2],['bench',2],['swing',1],['campfire',1],['sandbox',1]])if(recipeKnown(id)&&lvOK(id)&&B.have(id)<k&&S.pt>50)B.ensure(id,k,60,50)}
  if(S.enemyOn&&S.quest>9){
    if((S.inv.arrow||0)<30&&!B.ordered('arrow')&&recipeKnown('arrow')&&(S.mat.eda||0)>=3)orderFurn('arrow');
    const wn=Math.min(3,elemCount('wood'));if(B.have('watch')<wn&&S.pt>80)B.ensure('watch',wn,50+B.have('watch')*4,70);
    for(const [id,k] of [['spike',4],['sticky',3],['puddle',3]])if(recipeKnown(id)&&lvOK(id)&&B.have(id)<k&&S.pt>60)B.ensure(id,k,48+((B.have(id)*3)%12),74);
    if(S.pt>120&&B.have('fence')<16)B.ensure('fence',16,46+B.have('fence'),76,(x,y)=>y===76);
  }
  if(S.feat.shop&&godHere()&&S.pt>80&&cnt('farm')+inv('farm')<Math.min(30,4+n*3)){const p=shopPrice('farm',1);S.pt-=p;S.farmBuy=(S.farmBuy||0)+1;S.unlocked.farm=true;S.inv.farm=(S.inv.farm||0)+1}
  if(inv('farm')>0)B.put('farm',44,56);
  if(S.feat.shop&&godHere()&&S.pt>60){for(const k of ['imo','mugi'])if(BL['seed:'+k]&&cseed(k)<3&&S.unlocked['seed:'+k]!==false){try{const p=shopPrice('seed:'+k,2);if(p>0&&p<20){S.pt-=p;S.cseed[k]=cseed(k)+2}}catch(e){}}}
};

B.tapTree=()=>{const [sx,sy]=SR();setMode('look');centerOn((sx+1.5)*TS,(sy+1.5)*TS);try{onTap(VW/2,VH/2)}catch(e){B.lg('tapTree err '+e.message)}};
H.nushi=()=>{if(isNight()||!S.qTalked)return;if(performance.now()-(B.st.nt||0)<6000)return;B.st.nt=performance.now();B.tapTree()};
H.lv5=()=>{};H.omoi=()=>{};H.wood6=()=>{};
const all0=H._all;
H._all=()=>{all0();
  if(B.opts.supply){
  /* 補給（進行のたしかめ用）：パワー・食べ物・やられない */
  if(S.pt<400)S.pt=400;for(const k of ['wood','stone'])if((S.mat[k]||0)<60)S.mat[k]=60;for(const k of ['eda','kasa','shina','funba'])if((S.mat[k]||0)<12)S.mat[k]=12;if((S.fs.imo||0)<30){S.fs.imo=40;S.food=Object.values(S.fs).reduce((a,b)=>a+b,0)}
  for(const r of S.res){if(r.hunger<70)r.hunger=70}
  const q=QUESTS[S.quest];if(q&&q.steps&&q.steps.some(s=>/^lv\d/.test(s.id))&&S.lv<10){S.totalPt+=25}
  if(q&&q.id==='lv2')S.totalPt+=10;
  if(S.quest>=questIndexOf('tower')||S.cleared){
    for(const id of ['clover','bellf','lily','salvia','tree'])if((S.inv[id]||0)<6){S.unlocked[id]=true;S.inv[id]=(S.inv[id]||0)+6}
    /* みどりをひろげる：晴れた所の、まだみどりでないマスをえらんで植える（みどりの中にばかり植えると、ひろがらない） */
    B.pc=((B.pc||0)+1)%997;let cx=54,cy=54;for(let i=0;i<60;i++){const x=20+((B.pc*37+i*53)%68),y=20+((B.pc*61+i*29)%68),j=y*W+x;if(!(S.fog&&fogAt(j))&&!REV.has(j)&&!S.obj[j]){cx=x;cy=y;break}}
    for(const id of ['tree','clover','bellf','lily','salvia']){if(cnt('sprout')>=10)break;if(inv(id)>0)B.put(id,cx,cy,(x,y)=>!(S.fog&&fogAt(y*W+x)))}
  }
  for(const e of S.enemies)if(e.type==='boss2'&&e.hp>30)e.hp=30;
  }
  if(S.cleared&&!B.cl2){B.cl2=1;B.lg('CLEARED flags '+Object.keys(S.flags).filter(k=>/reun|final|sacred/i.test(k)).join(','))}
};
TESTM=true;S.speed=B.opts.speed;B.iv=setInterval(()=>B.tick(),200);return 'bot2 ok'})()
