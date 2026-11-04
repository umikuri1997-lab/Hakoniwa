'use strict';
/* 火山（2章）の物語の演出。会話の行の「vol:<場面>」で動かす。
   歩み寄り → 視線・構え → 動作 → 結果 → 反応と余韻。動きもカメラも実時間で、大事な動きが終わるまで、つぎの行へ送らない（sacredDirection の waitUntil）。
   夜・敵・人物不在・道がないときは、動きを省いてそのまま進める。村を切りかえたら残さない（VILLAGE_SESSION）。絵はコードで描くドット絵（1ドット＝整数の四角）。 */
const VOL_BEAT_MS={introStart:400,lookbackH:1300,lookbackS:1300,wave:900,shoulders:1800,springWalk:900,hidane:900,summonRing:1000,meet:900,fanS:800,jumpBoth:800,traceRock:900,canal:1200,benchSit:900,armsCross:600,egg:900,eatS:1200,crackSeal:1000,yoganSide:800,fist:1000,stepBackS:1000,yoganPulse:1200,sitBeside:900,bump:1400,lanterns:1200,eggsUp:1200,cheer:800,ashiyu:900,ripple:900,scaredS:1000,pointDevice:1000,ashFall:600,stepMountain:900,grab:900,backToBack:1300,morning:1500,shadowSpot:900,kneelAsh:1500,skyH:1100,innFront:900,soakBoth:1000,kneelNushi:1500};
const HINO_AT=new WeakMap();/* ヒノオオカゲが消えた所（保存しない） */
function volDir(){if(!S||WD!==1||S.free)return null;const d=sacredDirection(true);if(!d)return null;if(!d.vol){d.vol=true;d.volKey=DLGCUR;}return d;}
function volWho(n){return S.res.find(r=>r.name===n&&!r.hidden)||null;}
function volUnsafe(){return isNight()||S.enemies.some(e=>e.spawned&&!e.dead&&S.res.some(r=>!r.hidden&&Math.hypot(e.x-r.x,e.y-r.y)<6));}
/* 動きが終わるまで待つ：task を出して、終わったら done(余韻)。cap は、じゃまされたときに止まったままにしないための上限 */
function volTask(d,cap){const t={};(d.tasks||(d.tasks=new Set())).add(t);d.waitUntil=Math.max(d.waitUntil||0,performance.now()+cap);
  return (tail=0)=>{if(!d.tasks.delete(t))return;const now=performance.now();d.tail=Math.max(d.tail>now?d.tail:now,now+tail);if(!d.tasks.size)d.waitUntil=d.tail;};}
function volHold(ms){const d=sacredDirection();if(d)d.waitUntil=Math.max(d.waitUntil||0,performance.now()+ms);}
function volFace(r,x){if(r)r.face=x>=r.x?1:-1;}
function volPose(r,anim,ms,extra={}){if(r)sacredScenePose(r,anim,ms,{side:!extra.back&&!extra.front,face:r.face,...extra});}
let VOLFXN=0;function volFx(kind,ms,extra={}){return sacredStartEffect(kind+'#'+(VOLFXN++),ms,{kind,...extra});}
function volFxEnd(kind){const d=sacredDirection();if(!d)return;const now=performance.now();for(const e of d.effects.values())if(e.kind===kind&&!e.stop){e.stop=now;e.ms=Math.min(e.ms,now-e.at+900);}}
/* カメラ：人物と場所（マスの座標）が、会話欄と立ち絵を避けて見えるように */
function volShot(tiles=[],cast=[],limit=2.4,seconds=1.2){const P=[];for(const r of cast)if(r)P.push([r.x*TS-24,r.y*TS-58-uLift(r)],[r.x*TS+24,r.y*TS+10-uLift(r)]);
  for(const [x,y]of tiles){const lift=hiAt((y|0)*W+(x|0))*LIFT;P.push([x*TS-22,y*TS-34-lift],[x*TS+22,y*TS+12-lift]);}return storyShot(P,{limit,seconds});}
/* 歩いて行く。そばにいれば歩かない。行けないとき・じゃまされたときは、その場で続ける */
function volWalk(r,x,y,o,arrive){const d=sacredDirection();let done=false;const fin=ok=>{if(done)return;done=true;if(!ok&&S.res.includes(r)&&r.act?.type==='nmeet'){r.path=[];endAct(r);}if(arrive)arrive();};
  if(!r)return fin(true);if(Math.hypot(r.x-x,r.y-y)<(o.close||1))return fin(true);
  if(!sacredSceneWalk(r,x,y,{adjacentSide:!!o.side},()=>fin(true)))return fin(true);
  villageTimeout(()=>{if(!done&&sacredDirection()===d)fin(false);},o.cap||Math.max(4000,1500+(r.path?.length||0)*1000));}/* 道のりに合わせた上限（じゃまされて止まったときだけ使う） */
/* 物の上（ベンチ・湯船）へ、ひょいと移る（1マスほど。実時間） */
function volHop(r,x,y,ms,then){if(!r){then&&then();return}const owner=S,session=VILLAGE_SESSION,sx=r.x,sy=r.y,t0=performance.now();r.path=[];
  const step=now=>{if(S!==owner||VILLAGE_SESSION!==session)return;const q=sacredEase((now-t0)/ms);r.x=sx+(x-sx)*q;r.y=sy+(y-sy)*q;if(q<1)requestAnimationFrame(step);else if(then)then();};requestAnimationFrame(step);}
function volNear(ids,x,y,R=8,skip=-1){let b=-1,bd=1e9;for(let j=0;j<W*H;j++){if(j===skip||!ids.includes(S.obj[j]))continue;const d=Math.hypot(j%W+.5-x,(j/W|0)+.5-y);if(d<bd&&d<=R){bd=d;b=j}}return b;}
const volXY=j=>[j%W+.5,(j/W|0)+.5];
function volYogan(){const j=volNear(['yogan'],CX,CY,60);return j>=0?volXY(j):[D1%W+.5,(D1/W|0)+1.5];}
function volHotSpring(r){let b='a',bd=1e9;for(const k of['a','b','c']){if(!st2().sp[k]&&k!=='a')continue;const d=r?Math.hypot(HSPC[k][0]-r.x,HSPC[k][1]-r.y):0;if(d<bd){bd=d;b=k}}return b;}
/* ふたりの位置を、場所 (x,y) の前（下の行）に、左右にならべる */
function volPair(x,y,then,o={}){const d=volDir(),h=volWho(HOMURA),s=volWho(SHIZUKU);if(!d)return;const done=volTask(d,o.cap||30000);let n=0;const one=()=>{if(++n===2){then&&then(h,s);done(o.tail??600);}};
  const dy=o.dy??1.5;volWalk(h,x-(o.gap||1),y+dy,{},one);volWalk(s,x+(o.gap||1),y+dy,{},one);volShot([[x,y]],[h,s],o.limit||2.2);}
function volBeat(c){
  const d=volDir();if(!d)return;
  const h=volWho(HOMURA),s=volWho(SHIZUKU),now=performance.now();
  if(volUnsafe()){volEndScene(false);return;}/* 夜・敵が近い：演出を止めて、会話だけ進める */
  d.beat=c;const shot0=d.shot;
  switch(c){
  case 'introStart':{if(!h)break;h.face=1;volPose(h,'kneelHeat',600000,{back:true});volFx('campfire',600000,{x:h.x,y:h.y-.75});volFx('ashFall',600000,{haze:true,n:18});break;}
  case 'lookbackH':case 'lookbackS':{const r=c==='lookbackH'?h:s;if(!r)break;volPose(r,'lookback',600000,{back:true,keep:true});volShot([],[r],2.4,1);volHold(1300);break;}
  case 'wave':{if(!h)break;volPose(h,'wave',1100,{front:true,keep:true});volHold(900);break;}
  case 'shoulders':{if(!h)break;volPose(h,'shoulderDrop',600000,{front:true,keep:true});volHold(1800);break;}
  case 'springWalk':{if(!h)break;const[sx,sy]=HSPC.a,st=volNear(['hotstone'],sx,sy,6),[tx,ty]=st>=0?volXY(st):[sx,sy],done=volTask(d,30000);volShot([[tx,ty],[sx,sy]],[h]);
    volWalk(h,tx,ty+1,{},()=>{volFace(h,tx);volPose(h,'kneelHeat',600000,{});volFx('springWarm',3200,{x:sx,y:sy});volFx('steam',600000,{x:sx,y:sy});volFx('ember',3600,{x:tx,y:ty});sfx('wave');volShot([[sx,sy]],[h],2.4,1);done(2000);});break;}
  case 'hidane':{if(!h)break;const[sx,sy]=HSPC.a;volFx('hidane',600000,{x:sx,y:sy,actor:h,fly:2200});volFace(h,sx);volPose(h,'hold',600000,{});volShot([[sx,sy]],[h],2.4,1);villageTimeout(()=>sfx('shard'),1900);volHold(2300);break;}
  case 'summonRing':{if(!s)break;volFx('waterRing',1800,{actor:s});sfx('wave');volShot([],[s,h],2.4,1);volHold(1200);break;}
  case 'meet':{if(!h||!s)break;const done=volTask(d,30000);volWalk(h,s.x,s.y,{side:true},()=>{volFace(h,s.x);volFace(s,h.x);volPose(h,'wave',1200,{});volPose(s,'bow',1600,{});volShot([],[h,s],2.4,1);done(1500);});break;}
  case 'fanS':{if(!s)break;if(h)volFace(s,h.x);volPose(s,'fan',600000,{});volHold(900);break;}
  case 'jumpBoth':{for(const r of[h,s])if(r){SACRED_POSES.delete(r);JUMP.set(r,now);JOYU.set(r,now+1400);}volHold(900);break;}
  case 'traceRock':{if(!s)break;const bw=st2().bw||[],j=bw.find(k=>S.obj[k]==='boulder')??bw[0];if(j==null)break;const[x,y]=volXY(j),done=volTask(d,30000);volShot([[x,y]],[s]);
    volWalk(s,x,y,{side:true},()=>{volFace(s,x);volPose(s,'storyTouch',2200,{});volFx('trace',2000,{x,y});done(2000);});break;}
  case 'canal':{const bw=(st2().bw||[]).map(volXY),[bx,by]=HSPC.b;const path=[...bw].sort((p,q)=>Math.hypot(q[0]-bx,q[1]-by)-Math.hypot(p[0]-bx,p[1]-by));path.push([bx,by]);if(path.length<2)path.unshift([bx+3,by]);
    volFx('waterFlow',600000,{path,fill:3000});sfx('wave');volShot(path,[h,s],2,1.3);volHold(3000);break;}
  case 'benchSit':{if(!s)break;const k=volHotSpring(s),[sx,sy]=HSPC[k],b=volNear(['bench','takebench'],sx,sy,10),done=volTask(d,30000);const[x,y]=b>=0?volXY(b):[sx+1.5,sy+1.5];volShot([[x,y]],[s,h]);
    volWalk(s,x,y,{side:true},()=>volHop(s,x,y-.05,320,()=>{volFace(s,sx);volPose(s,'storyListen',600000,{sit:true});done(800);}));break;}
  case 'armsCross':{if(!h)break;if(s)volFace(h,s.x);volPose(h,'armsCross',600000,{});volHold(700);break;}
  case 'egg':{if(!h)break;const ov=volNear(['oven'],h.x,h.y,14),tb=volNear(['table'],h.x,h.y,14),[tx,ty]=tb>=0?volXY(tb):ov>=0?volXY(ov):[h.x+1,h.y],done=volTask(d,30000);if(ov>=0)volFx('steam',600000,{x:volXY(ov)[0],y:volXY(ov)[1]-.4});volShot([[tx,ty]],[h,s]);
    volWalk(h,tx,ty,{side:true},()=>{volFace(h,tx);volPose(h,'storyOffer',1800,{});villageTimeout(()=>volFx('egg',600000,{x:tx,y:ty-.2}),700);done(1700);});break;}
  case 'eatS':{if(!s)break;if(h)volFace(s,h.x);volPose(s,'eat',2800,{});volFx('egg',2800,{actor:s});volHold(1400);break;}
  case 'crackSeal':{const pts=CRACKS.map(volXY),[cx,cy]=pts[2];volPair(cx,cy,()=>{for(const r of[h,s])volPose(r,'storyListen',600000,{back:true});volFx('crackSeal',3000,{pts});sfx('bush');},{tail:2600});break;}
  case 'yoganSide':{const[x,y]=volYogan();volPair(x,y,()=>{for(const r of[h,s])volPose(r,'storyListen',600000,{back:true});volShot([[x,y],[x,y-5]],[h,s],2);},{dy:1.4});break;}
  case 'fist':{if(!h)break;volPose(h,'fistClench',600000,{back:true});volHold(1200);break;}
  case 'stepBackS':{if(!s)break;if(h)volFace(s,h.x);volPose(s,'stepBack',600000,{});volHold(1100);break;}
  case 'yoganPulse':{const[x,y]=volYogan();volPair(x,y,()=>{for(const r of[h,s])volPose(r,'storyListen',600000,{back:true});volFx('yoganPulse',600000,{x,y,grow:3200});sfx('furn');volShot([[x,y],[x,y-4]],[h,s],2);},{dy:1.4,tail:2600});break;}
  case 'sitBeside':{if(!h||!s)break;const[x]=volYogan(),done=volTask(d,30000);volWalk(s,h.x,h.y,{side:true},()=>{const f=x>=h.x?1:-1;h.face=s.face=f;volPose(h,'storyListen',600000,{sit:true,face:f});volPose(s,'storyListen',600000,{sit:true,face:f});volShot([],[h,s],2.4,1);done(1200);});break;}
  case 'bump':{if(!h||!s)break;const done=volTask(d,30000),go=()=>{volFace(h,s.x);volFace(s,h.x);for(const r of[h,s])volPose(r,'storyBump',1800,{});sfx('furn');volShot([],[h,s],2.6,1);done(1800);};
    if(Math.abs(h.y-s.y)<.6&&Math.abs(h.x-s.x)<1.6)go();else volWalk(s,h.x,h.y,{side:true},go);break;}
  case 'lanterns':{const cast=[h,s].filter(Boolean);if(!cast.length)break;const mx=cast.reduce((a,r)=>a+r.x,0)/cast.length,my=cast.reduce((a,r)=>a+r.y,0)/cast.length;
    let pts=festOn()?festPoles().map(([x,y])=>[x+.5,y+.5]).sort((p,q)=>Math.hypot(p[0]-mx,p[1]-my)-Math.hypot(q[0]-mx,q[1]-my)).slice(0,6):[];if(pts.length<4)pts=[0,1,2,3,4,5].map(i=>[mx+Math.cos(Math.PI*(1.1+i*.16))*3.2,my+Math.sin(Math.PI*(1.1+i*.16))*2.2]);
    volFx('lanterns',600000,{pts,step:450});volShot(pts,cast,2.2,1.3);for(let i=0;i<pts.length;i++)villageTimeout(()=>sfx('tap'),i*450);volHold(pts.length*450+500);break;}
  case 'eggsUp':{if(!h||!s)break;volFace(h,s.x);volFace(s,h.x);for(const r of[h,s]){volPose(r,'storyOffer',2400,{});volFx('egg',2400,{actor:r,up:true});}volShot([],[h,s],2.6,1);volHold(1600);break;}
  case 'cheer':{stageMotion('cheer');for(const r of[h,s])if(r)SACRED_POSES.delete(r);volHold(900);break;}
  case 'ashiyu':{const[sx,sy]=HSPC.b,b1=volNear(['bench','takebench'],sx,sy,10),b2=volNear(['bench','takebench'],sx,sy,10,b1),done=volTask(d,30000);let n=0;const one=()=>{if(++n===2)done(900);};volShot([[sx,sy]],[h,s]);
    const seat=(r,b,dx)=>{if(!r)return one();const[x,y]=b>=0?volXY(b):[sx+dx,sy+1.5];volWalk(r,x,y,{side:true},()=>volHop(r,x,y-.05,320,()=>{volFace(r,sx);volPose(r,'storyListen',600000,{sit:true});one();}));};seat(h,b1,-1);seat(s,b2,1);break;}
  case 'ripple':{if(!s)break;volFx('ripple',2200,{x:s.x+(s.face||1)*.35,y:s.y+.35});sfx('wave');volHold(1000);break;}
  case 'scaredS':{if(!s)break;const vx=VOLJ%W+.5,vy=OFF+2;volFace(s,vx);volPose(s,'stepBack',900,{});villageTimeout(()=>volPose(s,'tremble',600000,{}),900);
    if(h){const done=volTask(d,30000);volWalk(h,s.x,s.y-1,{},()=>{volPose(h,'shield',600000,{back:true});volShot([[s.x,s.y-2.5]],[h,s],2.4,1);done(900);});}volShot([[s.x,s.y-2.5]],[h,s]);volHold(1000);break;}/* 山のほう（北）をすこし入れる */
  case 'pointDevice':{if(!s)break;const[x,y]=volXY(D2);volFace(s,x);volPose(s,'point',600000,{});volShot([[x,y]],[s,h],2.2,1);volHold(1200);break;}
  case 'ashFall':{volFx('ashFall',600000,{n:36});volShot([],[h,s],2.2,1);volHold(700);break;}
  case 'stepMountain':{if(!h)break;const done=volTask(d,30000);volWalk(h,h.x,h.y-2,{},()=>{volPose(h,'storyListen',600000,{back:true});done(500);});volShot([[h.x,h.y-3]],[h,s]);break;}
  case 'grab':{if(!h||!s)break;const done=volTask(d,30000);volWalk(s,h.x,h.y,{side:true},()=>{volFace(s,h.x);volPose(s,'grabSleeve',600000,{});volPose(h,'storyListen',600000,{back:true});volShot([],[h,s],2.6,1);done(900);});break;}
  case 'backToBack':{if(!h||!s)break;const done=volTask(d,30000),go=()=>{h.face=s.x>h.x?-1:1;s.face=h.x>s.x?-1:1;volPose(h,'backToBack',600000,{});volPose(s,'backToBack',600000,{});volShot([],[h,s],2.6,1);done(1400);};
    if(Math.abs(h.y-s.y)<.6&&Math.abs(h.x-s.x)<1.6)go();else volWalk(s,h.x,h.y,{side:true},go);break;}
  case 'morning':{volFxEnd('ashFall');volFx('morning',3200,{});sfx('bush');volHold(1800);break;}
  case 'shadowSpot':{const[x,y]=HINO_AT.get(S)||[VOLJ%W+.5,OFF+7];volFx('ashPile',600000,{x,y});volPair(x,y,()=>{for(const r of[h,s])if(r){volFace(r,x);volPose(r,'storyListen',600000,{});}},{dy:.6,gap:1.2});break;}
  case 'kneelAsh':{if(!s)break;const[x,y]=HINO_AT.get(S)||[VOLJ%W+.5,OFF+7];volFace(s,x);volPose(s,'kneelTouch',600000,{});volFx('ember',3200,{x,y});volShot([[x,y]],[s,h],2.4,1);volHold(1800);break;}
  case 'skyH':{if(!h)break;volPose(h,'lookUp',600000,{front:true,keep:true});volHold(1200);break;}
  case 'innFront':{const inn=innHouse();let x,y;if(inn){const door=[...inn.h.set].find(j=>HOME_DOORS.has(S.obj[j]));[x,y]=door!=null?volXY(door):volXY(inn.onsen);}else[x,y]=HSPC.a;
    volPair(x,y,()=>{for(const r of[h,s])volPose(r,'storyListen',600000,{back:true});},{dy:1.5});break;}
  case 'soakBoth':{const inn=innHouse(),o=inn?inn.onsen:-1,[ox,oy]=o>=0?volXY(o):HSPC.a,done=volTask(d,30000);let n=0;const one=()=>{if(++n===2)done(900);};volFx('steam',600000,{x:ox+.5,y:oy+.3});volShot([[ox+.5,oy+.5]],[h,s]);
    const dip=(r,x,y)=>{if(!r)return one();volWalk(r,x,y,{},()=>volHop(r,x,y,360,()=>{volFace(r,ox+.5);volPose(r,'soak',600000,{});one();}));};dip(h,ox+.5,oy+.5);dip(s,ox+(o>=0?1.5:1),oy+(o>=0?1.4:1));break;}
  case 'kneelNushi':{if(!h||!S.nushi)break;const n=S.nushi,done=volTask(d,30000);volWalk(h,n.x,n.y,{side:true},()=>{volFace(h,n.x);volPose(h,'kneel',600000,{});volFx('lightPat',600000,{actor:h,from:n});volShot([[n.x,n.y-1.5]],[h,s],2.4,1);done(2000);});break;}
  }
  if(d.shot===shot0&&c!=='introStart'&&sacredDirection()===d){const cast=[h,s].filter(Boolean),q=d.shot,inView=r=>q&&r.x*TS>=q.left&&r.x*TS<=q.right&&r.y*TS-40>=q.top-30&&r.y*TS<=q.bottom+30;if(cast.length&&!cast.every(inView))volShot([],cast,2.4,1);}/* うつっていない子が動くときは、その子が見えるように */
}
/* 会話がとじたら、場面の動き・カメラを、演出前にもどす */
function volSceneEnd(key){const d=sacredDirection();if(d&&d.vol&&d.volKey===key)volEndScene(true);}
function volEndScene(restore){const d=sacredDirection();if(!d||!d.vol)return;for(const r of S.res)if(r.act?.type==='nmeet'&&!NUSHI_RUN&&!GATHER_HOLD){r.path=[];endAct(r);}sacredEndDirection(restore);}

/* ---- ドット絵の演出（世界の座標。1ドット＝整数の四角） ---- */
function volDot(x,y,w,h,col,a=1){if(a<=0)return;ctx.globalAlpha=a;ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function volRing(x,y,rx,ry,col,a,step=10){for(let g=0;g<360;g+=step){const t=g*Math.PI/180;volDot(x+Math.cos(t)*rx,y+Math.sin(t)*ry,2,1,col,a);}}
function volEgg(x,y){volDot(x-2,y-3,4,1,'#fffaf0');volDot(x-3,y-2,6,3,'#fff6e4');volDot(x-2,y+1,4,1,'#eadcc4');volDot(x-2,y-2,1,1,'#ffffff');}
function volTileXY(x,y){return [x*TS,y*TS-hiAt((y|0)*W+(x|0))*LIFT];}
const VOL_GROUND=new Set(['campfire','ashPile','lanterns']);/* 地面に置く物は、奥行きの順で描く */
function storyStageAdd(add,now){const d=sacredDirection();if(!d||!d.effects.size)return;
  for(const [key,e]of d.effects){if(!(VOL_GROUND.has(e.kind)||e.kind==='egg'&&!e.actor))continue;const one=(y,fn)=>add(y,1,null,()=>{ctx.save();fn();ctx.globalAlpha=1;ctx.restore();},-1);
    if(e.kind==='lanterns')e.pts.forEach((p,i)=>one(p[1],()=>volDrawFx({...e,pts:[p],at:e.at+i*e.step},now)));else one(e.y,()=>volDrawFx(e,now));}}
function drawStoryStage(now){
  if(!S||WD!==1)return;const d=sacredDirection();if(!d||!d.effects.size)return;ctx.save();
  for(const [key,e]of d.effects){if((now-e.at)/e.ms>=1){d.effects.delete(key);continue;}if(!e.kind||VOL_GROUND.has(e.kind)||e.kind==='egg'&&!e.actor)continue;volDrawFx(e,now);}
  ctx.globalAlpha=1;ctx.restore();
}
function volDrawFx(e,now){{const T=(now-e.at)/1000,p=(now-e.at)/e.ms;if(p>=1||T<0)return;
    const fade=Math.min(1,T*3)*(e.stop?Math.max(0,1-(now-e.stop)/900):1);
    if(e.kind==='steam'||e.kind==='ember'){const[x,y]=volTileXY(e.x,e.y),hot=e.kind==='ember';
      for(let i=0;i<(hot?12:9);i++){const ph=(T*(hot?.7:.5)+i/(hot?12:9))%1,ox=((i*37)%23)-11+Math.sin(T*2+i)*3*ph;
        if(hot)volDot(x+ox,y-4-ph*46,2,2,i%3?'#ffb347':'#ffe08a',(1-ph)*fade*Math.min(1,(1-p)*4));
        else volDot(x+ox,y-6-ph*34,ph<.5?3:2,ph<.5?3:2,'#ffffff',(1-ph)*.75*fade);}}
    else if(e.kind==='springWarm'||e.kind==='ripple'){const[x,y]=volTileXY(e.x,e.y);for(let k=0;k<3;k++){const q=(p*1.6+k/3)%1,rx=5+q*(e.kind==='ripple'?14:26);volRing(x,y,rx,rx*.42,e.kind==='ripple'?'#eefaff':'#ffd08a',(1-q)*.85*Math.min(1,(1-p)*3));}}
    else if(e.kind==='waterRing'){const a=e.actor;if(!a)return;const q=sacredEase(p);volRing(a.x*TS,a.y*TS+8,8+q*16,(8+q*16)*.4,'#bfe8ff',(1-q)*.9,8);}
    else if(e.kind==='hidane'){const a=e.actor;if(!a)return;const[x0,y0]=volTileXY(e.x,e.y),hx=a.x*TS+(a.face||1)*8,hy=a.y*TS-24-uLift(a),q=sacredEase(Math.min(1,(now-e.at)/e.fly)),ax=e.to?hx:x0,ay=e.to?hy:y0-6,bx=e.to?x0:hx,by=e.to?y0-6:hy,x=ax+(bx-ax)*q,y=ay+(by-ay)*q-Math.sin(Math.PI*q)*26,f=Math.sin(T*9)>0?1:0;
      volDot(x-4,y-4,8,8,'#ffb347',.35);volDot(x-3,y-3-f,6,6,'#ff9a3a');volDot(x-2,y-2-f,4,4,'#ffd27a');volDot(x-1,y-1-f,2,2,'#fff3c0');}
    else if(e.kind==='ashFall'){const vx=cam.x,vy=cam.y,vw=VW/cam.z,vh=VH/cam.z,n=Math.min(e.n||30,40);
      for(let i=0;i<n;i++){const sp=16+(i%5)*5,x=vx+((i*0.6180339)%1)*vw+Math.sin(T+i)*6,y=vy+((T*sp+i*53)%vh);volDot(x,y,2,2,i%2?'#8f8a83':'#c9c3ba',.7*fade);}
      if(e.haze){const[x,y]=volTileXY(VOLJ%W+.5,OFF+1);for(let r=0;r<6;r++)volDot(x-150,y-60+r*14,300,8,'#8a8580',.08*fade);}}
    else if(e.kind==='campfire'){const[x,y]=volTileXY(e.x,e.y);volDot(x-6,y+2,12,2,'#6b4a33');for(let i=0;i<3;i++){const fh=5+((Math.sin(T*11+i*2)+1)*2|0);volDot(x-4+i*3,y+2-fh,3,fh,'#ff8a3a',fade);volDot(x-3+i*3,y+3-fh*.6,1,Math.max(1,fh*.6|0),'#ffe08a',fade);}}
    else if(e.kind==='trace'){const[x,y]=volTileXY(e.x,e.y);for(let i=0;i<6;i++){const q=Math.min(1,p*1.4-i*.1);if(q>0)volDot(x-10+i*4,y-8+((i%2)*3),3,1,'#e8f6ff',q*.9);}}
    else if(e.kind==='waterFlow'){const L=e.path.map(([x,y])=>volTileXY(x,y));let tot=0;const seg=[];for(let i=1;i<L.length;i++){const l=Math.hypot(L[i][0]-L[i-1][0],L[i][1]-L[i-1][1]);seg.push(l);tot+=l;}
      let left=tot*sacredEase(Math.min(1,(now-e.at)/e.fill));for(let i=0;i<seg.length&&left>0;i++){const[a0,b0]=L[i],[a1,b1]=L[i+1],len=Math.min(left,seg[i]);left-=len;
        for(let s=0;s<len;s+=2){const q=s/seg[i],x=a0+(a1-a0)*q,y=b0+(b1-b0)*q+6;volDot(x-2,y-1,4,3,'#8fd0f0',.85*fade);if(((s+T*40)|0)%10<2)volDot(x-1,y-1,2,1,'#e8f8ff',fade);}}}
    else if(e.kind==='egg'){if(e.actor){const a=e.actor,up=e.up?-10:0;volEgg(a.x*TS+(a.face||1)*9,a.y*TS-22-uLift(a)+up*Math.min(1,p*3));}else{const[x,y]=volTileXY(e.x,e.y);volEgg(x,y-4);}}
    else if(e.kind==='crackSeal'){const n=e.pts.length;e.pts.forEach(([cx,cy],i)=>{const[x,y]=volTileXY(cx,cy),q=Math.max(0,Math.min(1,p*n*1.3-i));if(!q)return;const w=Math.round(26*q);volDot(x-13,y+2,w,2,'#fff3c0',.9*Math.min(1,(1-p)*4+.25));volDot(x-13,y+4,w,1,'#ffd08a',.7);});}
    else if(e.kind==='yoganPulse'){const[x,y]=volTileXY(e.x,e.y),g=Math.min(1,(now-e.at)/e.grow);for(let k=0;k<3;k++){const q=(T*.8+k/3)%1,r=Math.round(6+q*22*g);ctx.globalAlpha=(1-q)*.8*fade;ctx.fillStyle=k%2?'#ff7a3a':'#ffd08a';ctx.fillRect(Math.round(x-r),Math.round(y-r*.5),r*2,1);ctx.fillRect(Math.round(x-r),Math.round(y+r*.5),r*2,1);ctx.fillRect(Math.round(x-r),Math.round(y-r*.5),1,r);ctx.fillRect(Math.round(x+r),Math.round(y-r*.5),1,r);}volDot(x-5,y-16,10,10,'#ffb347',.25*g*fade);}
    else if(e.kind==='heatPillar'){const[x,y]=volTileXY(e.x,e.y),hgt=Math.round(170*sacredEase(Math.min(1,p/.35))),out=Math.min(1,(1-p)*3);for(let r=0;r<hgt;r+=2){const w=10+((Math.sin(T*12+r*.3)+1)*2|0),a=(1-r/hgt)*.75*out;volDot(x-w/2,y-r,w,2,r%6<2?'#fff3c0':r%6<4?'#ffd08a':'#ffb347',a);}for(let i=0;i<8;i++){const ph=(T*.9+i/8)%1;volDot(x-14+((i*11)%28),y-ph*hgt,2,2,'#fff6c8',(1-ph)*out);}}
    else if(e.kind==='lanterns'){e.pts.forEach(([lx,ly],i)=>{const on=now-e.at-i*(e.step||0);if(on<0)return;const[x,y]=volTileXY(lx,ly),k=Math.min(1,on/300),fl=Math.sin(T*6+i)>0?1:0;volDot(x-6,y-26,12,12,'#ffcf7a',.25*k);volDot(x-2,y-24,4,1,'#5a3a2a');volDot(x-3,y-23,6,7,'#e25a3a');volDot(x-2,y-22,4,5,'#ffb36b',k);volDot(x-1,y-21,2,2+fl,'#fff0b8',k);volDot(x-2,y-16,4,1,'#5a3a2a');volDot(x,y-15,1,14,'#6b4a33');});}
    else if(e.kind==='morning'){const vx=cam.x,vy=cam.y,vw=VW/cam.z,vh=VH/cam.z,a=Math.sin(Math.PI*p);volDot(vx,vy,Math.ceil(vw)+2,Math.ceil(vh)+2,'#fff1c8',.22*a);for(let i=0;i<5;i++)volDot(vx+vw*(.15+i*.18),vy,6,Math.ceil(vh*.6),'#fff6dc',.12*a);}
    else if(e.kind==='ashPile'){const[x,y]=volTileXY(e.x,e.y);volDot(x-8,y+3,16,3,'#8f8a83',.9*fade);volDot(x-5,y+1,10,2,'#b3ada4',.9*fade);volDot(x-2,y,4,1,'#cfc9c0',.9*fade);}
    else if(e.kind==='lightPat'){const a=e.actor;if(!a)return;const k=sacredEase(Math.min(1,T/1.2)),n=e.from,x0=n.x*TS,y0=n.y*TS-70,x1=a.x*TS,y1=a.y*TS-44-uLift(a)+Math.round(Math.sin(T*6)*2)*(k>=1?1:0),x=x0+(x1-x0)*k,y=y0+(y1-y0)*k;volDot(x-5,y-5,10,10,'#fff3c0',.3);volDot(x-3,y-3,6,6,'#ffe7a0',.85);volDot(x-1,y-1,2,2,'#ffffff');}
    else if(e.kind==='deviceTurn'){const[x,y]=volTileXY(e.x,e.y),q=sacredEase(Math.min(1,p/.7)),ang=Math.round(q*8)/8*Math.PI,cx=x,cy=y-22;for(let i=-4;i<=4;i++)volDot(cx+Math.cos(ang)*i*1.5,cy-Math.sin(ang)*i*1.5*.6,2,2,'#ffe08a',fade);const tx=cx+Math.cos(ang)*7,ty=cy-Math.sin(ang)*7*.6;volDot(tx-2,ty-2,4,4,'#ffb347',fade);}
  }
}
