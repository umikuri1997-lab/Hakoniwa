'use strict';
/* 雪のつもり方・物の上の雪・池の氷（snow.js）。見た目だけ（セーブしない）。こおった池のマスでは、つりをしない（iceW）。
   考え方は SpriteCook の「How to add snow and ice to a 2D pixel art scene」から（数字は、はこにわの1ドット＝ゲームの1点に合わせた）：
   - 地面：ドットごとに「何段めで雪がのるか」（1〜4）を1回だけきめておき（snowBake）、毎コマは、いまの段（snowStage）とくらべるだけ。
     段は、1コマでぱっと切りかわる（うすくまぜない）。ひらけた所が先、木の下と道はあと。1・2段めは、大きさ・のびのちがうかたまりが、種から育つ。
     絵は、地面と同じ区画（iso-ground.js の IGW×IGH、画面の向きのドット）ごとに作る（snowGround）。高い段のマスは、マスごとの絵（snowLift）。
   - 物の上：絵の上の面ごと（絵の上のはしと、暗いすきまの下の明るい葉のかたまり）に、上から何行か（SNOWCAPD）。上の輪郭の行はのこす。3段（snowCapStage）。
   - 池（川・温泉はのぞく）：冬の日がすすむほど、岸からまん中へこおる（iceFreeze）。冬の4日めの朝に、ひび（iceCrack）。春にとける。
     氷の色は、止めた水の模様の明るさから（水より1つ明るい）。まだこおっていない水とのさかいは、明るいふち。氷の上の雪は、岸から3段。
   色は、かげの青から白までの5つ（SNOWC・ICEC）。 */
const SNOWC=['#546088','#8090ba','#b8c6e4','#e2e9f7','#f8faff'],ICEC=['#426280','#6890ac','#92bace','#bedce9','#eaf6fb'];
const SNOWGST=[.06,.25,.5,.8];/* 地面の雪：つもり（S.snowA）がこれをこえると、1〜4段め */
const SNOWCST=[.03,.4,.65];/* 物の上の雪：1〜3段め（地面と、かわるときをずらす） */
/* 種：1マスに何こ・のこるわりあい・大きさ（半径、点）・g：1〜3段めのかたまりの大きさ（その段に使わないときは0）。
   open：ひらけた所ほど多い（(1-かげ)²+0.03）・wood：木の下（かげ SNOWWOOD 以上）だけ */
const SNOWSEED=[
  {n:1,acc:1,r:[.7,2.6],g:[1,1.8,2.6],open:1},
  {n:2,acc:.8,r:[.8,2.8],g:[0,1,1.9],open:1},
  {n:1,acc:.45,r:[.6,1.8],g:[0,1,0],wood:1},
  {n:2,acc:.62,r:[1,3.2],g:[0,0,1],wood:1}];
const SNOWSX=[.55,1],SNOWSY=[.85,1.25];/* かたまりの、よこ・たてののび */
const SNOWROUGH=.4;/* かたまりのふちのでこぼこ（なめらかなノイズを、きょりにたす） */
const SNOWRING=[.38,.32,.32],SNOWRINGW=.9;/* ふちの外の、ばらばらのドット：1〜3段めの出るわりあい・はば */
const SNOWHOLE=.12;/* 1・2段めのかたまりの中で、つぎの段まで待つドット */
const SNOWSPECK=[.004,.012];/* ひらけた所に、ぽつんと1ドット：1段め・2段め */
const SNOWOPEN=.45,SNOWPATHK=.55,SNOWSEEDPATH=.3,SNOWWOOD=.5;/* かげ・道のしきい：これより下は3段め（それより上は4段め）・種をおかない道・木の下の種 */
const SNOWSHEL=[1,.6],SNOWSHELK=.7;/* 木のかげ：木のマス・となりのマス（かける SNOWSHELK） */
const SNOWCAPD={tree:4.5,ntree:4.5,fruit:4.5,deadtree:3.5,bamboo:3.5,berry:3,rock:3,boulder:3},SNOWCAPD0=2;/* 物の上の雪のあつさ（行）。表にない物（家具・建物）は SNOWCAPD0 */
const SNOWCAPRISE=28,SNOWCAPLO=.1,SNOWCAPRK=[.22,.58],SNOWCAPW=[.35,.25,.4];/* 葉のかたまりの上のふち（2行で明るさがこれだけ上がる）・暗すぎるドットにはのせない・1段め・2段めまでのわりあい・ならべる重み（深さ・暗さ・ノイズ） */
const ICEDAYS=2,ICECRACKD=3,ICECRACKH=2;/* 冬の1日めの朝6時から、こおりきるまで（日）・ひびが入りはじめる日（4日めの朝）・ひびがのびきるまで（時間） */
const ICENOISE=1.2,ICEPAD=3;/* こおるふちのでこぼこ・こおりきる所（いちばん遠い所＋これだけ） */
const ICEN=5,ICECRL=[16,34],ICEBR=.12,ICEBRL=[3,6];/* ひびの数（池ごと、多くて）・長さ（点）・わかれる確率・わかれた先の長さ */
const ICESNOWR=[.15,.42,.68];/* 氷の上の雪：1〜3段め（岸が先） */
const SNP=2,SNOWBAND=8,SNOWBUD=6;/* 区画の絵ののりしろ（ドット）・1回に作る行・1コマに作る時間（ミリ秒） */
const snowRun=g=>{let r;do r=g.next();while(!r.done);return r.value};/* 少しずつ作る物を、いっぺんに作る */
const SNW={s:null,shel:null,path:null,key:null,elig:null,eck:'',ev:0,ef:-1,R:new Map(),T:new Map(),rgb:null};
const SNI={bf:-1,bt:0,s:null,h:null,hf:-1,tc:null,comp:[],R:new Map(),wp:null,wpc:null};

function snowStage(){const a=snowCover();let n=0;for(const t of SNOWGST)if(a>=t)n++;return n}
function snowCapStage(){const a=snowCover();let n=0;for(const t of SNOWCST)if(a>=t)n++;return n}
function snowRGB(){if(SNW.rgb)return SNW.rgb;const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];return SNW.rgb={s:SNOWC.map(p),i:ICEC.map(p)}}
const snowH=(x,y,s)=>hash(((y|0)*4099+(x|0))*31+s);
function snowVN(x,y,sc,salt){/* なめらかなノイズ（0〜1） */const X=x/sc,Y=y/sc,ix=Math.floor(X),iy=Math.floor(Y),fx=X-ix,fy=Y-iy,u=fx*fx*(3-2*fx),w=fy*fy*(3-2*fy),v=(a,b)=>hash((iy+b)*977+(ix+a)*131+salt);
  return(v(0,0)*(1-u)+v(1,0)*u)*(1-w)+(v(0,1)*(1-u)+v(1,1)*u)*w}
function snowAt(A,wx,wy){/* 木のかげ・道（0〜1）：マスのまん中の値を、なめらかにつなぐ */const fx=wx/TS-.5,fy=wy/TS-.5,ix=Math.floor(fx),iy=Math.floor(fy),u=fx-ix,w=fy-iy,g=(x,y)=>A[Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x))];
  return(g(ix,iy)*(1-u)+g(ix+1,iy)*u)*(1-w)+(g(ix,iy+1)*(1-u)+g(ix+1,iy+1)*u)*w}
/* 木のかげ・道の表と、雪がのるマス（1：区画の絵・2：高い段・0：のらない）を作る */
function snowPrep(){if(SNW.s!==S){SNW.s=S;SNW.key=null;snowDrop()}
  if(SNW.key!==counts){SNW.key=counts;const sh=new Float32Array(W*H),pa=new Float32Array(W*H);
    for(let j=0;j<W*H;j++){const o=S.obj[j],f=S.floor[j];if(f==='path'||f==='gravel'||f==='stone'||f==='brick')pa[j]=1;if(!o||!TREES.has(o)||o==='deadtree')continue;const x=j%W,y=(j/W)|0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X,v=SNOWSHEL[dx||dy?1:0]*SNOWSHELK;if(v>sh[k])sh[k]=v}}
    const same=(a,b)=>{if(!a||a.length!==b.length)return false;for(let i=0;i<b.length;i++)if(a[i]!==b[i])return false;return true};
    if(!same(SNW.shel,sh)||!same(SNW.path,pa)){SNW.shel=sh;SNW.path=pa;snowDrop()}SNW.ef=-1}
  if(SNW.ef<0||RFN-SNW.ef>=15){SNW.ef=RFN;const e=SNW.elig||(SNW.elig=new Uint8Array(W*H));let ck=0;
    for(let i=0;i<W*H;i++){const v=snowTileOK(i)?(hiAt(i)?2:1):0;e[i]=v;ck=(ck*31+v*(i+1))|0}const k=String(ck);if(k!==SNW.eck){SNW.eck=k;SNW.ev++}}}
function snowTileOK(i){/* 雪がつもるマス：家の中・床・じゅうたん・畑・水・浅瀬・火のまわり・霧はのぞく。物の下・道の上にはつもる */const gr=S.ground[i];if(gr===1||gr===2)return false;
  const o=S.obj[i];if(FEELIN.has(i)||RUGC.has(i)||o==='farm'||o==='part'&&S.obj[S.ref[i]]==='farm'||feelMelt(i)||fogAt(i))return false;const f=S.floor[i];return !f||f==='path'||f==='gravel'||f==='stone'||f==='brick'}
function snowDrop(){for(const e of SNW.R.values())if(e.c)e.c.width=e.c.height=0;SNW.R.clear();for(const e of SNW.T.values())if(e.c)e.c.width=e.c.height=0;SNW.T.clear()}

/* せかいの四角（点）の、ドットごとの段（1〜4）と色（0〜4）。種は、まわりのマスのもの（どの区画で作っても同じになる） */
function snowBake(x0,y0,w,h){const N=w*h,m=[new Float32Array(N).fill(9),new Float32Array(N).fill(9),new Float32Array(N).fill(9)],st=new Uint8Array(N),tn=new Uint8Array(N),SH=SNW.shel,PA=SNW.path,M=16;
  const tx0=Math.max(0,Math.floor((x0-M)/TS)),ty0=Math.max(0,Math.floor((y0-M)/TS)),tx1=Math.min(W-1,Math.floor((x0+w+M)/TS)),ty1=Math.min(H-1,Math.floor((y0+h+M)/TS));
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const j=ty*W+tx;SNOWSEED.forEach((K,kn)=>{for(let c=0;c<K.n;c++){const s=j*97+kn*13+c*5,px=tx*TS+hash(s+1)*TS,py=ty*TS+hash(s+2)*TS,sh=snowAt(SH,px,py);
    if(K.open){if(snowAt(PA,px,py)>=SNOWSEEDPATH||hash(s+3)>=((1-sh)*(1-sh)+.03)*K.acc)continue}else if(sh<SNOWWOOD||hash(s+3)>=K.acc)continue;
    const r=K.r[0]+(K.r[1]-K.r[0])*hash(s+4),sx=SNOWSX[0]+(SNOWSX[1]-SNOWSX[0])*hash(s+5),sy=SNOWSY[0]+(SNOWSY[1]-SNOWSY[0])*hash(s+6),gm=Math.max(...K.g),R=r*gm*(1+SNOWRINGW)+3;
    const ax=Math.max(x0,Math.floor(px-R)),bx=Math.min(x0+w-1,Math.ceil(px+R)),ay=Math.max(y0,Math.floor(py-R)),by=Math.min(y0+h-1,Math.ceil(py+R));
    for(let y=ay;y<=by;y++)for(let x=ax;x<=bx;x++){const dx=(x+.5-px)/sx,dy=(y+.5-py)/sy,n=(.7*(snowVN(x,y,3,11)-.5)+.3*(snowVN(x,y,5,23)-.5))*2,dn=Math.sqrt(dx*dx+dy*dy)/r+SNOWROUGH*n,i=(y-y0)*w+(x-x0);
      for(let k=0;k<3;k++)if(K.g[k]){const v=dn/K.g[k];if(v<m[k][i])m[k][i]=v}}}})}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,wx=x0+x,wy=y0+y,sh=snowAt(SH,wx+.5,wy+.5),pa=snowAt(PA,wx+.5,wy+.5),open=sh<SNOWOPEN&&pa<SNOWPATHK,bare=sh<SNOWOPEN&&pa<SNOWSEEDPATH;
    const blob=(k)=>{const v=m[k][i];if(v<=1)return 2;if(v<1+SNOWRINGW&&snowH(wx,wy,41+k)<SNOWRING[k]*(1+SNOWRINGW-v)/SNOWRINGW)return 1;return 0};
    let s=open||blob(2)?3:4;const b2=blob(1),b1=blob(0);if(b2||bare&&snowH(wx,wy,53)<SNOWSPECK[1])s=2;if(b1||bare&&snowH(wx,wy,59)<SNOWSPECK[0])s=1;
    if(s===1&&b1===2&&snowH(wx,wy,61)<SNOWHOLE)s=2;else if(s===2&&b2===2&&snowH(wx,wy,67)<SNOWHOLE)s=3;/* かたまりの中の、まだのドット */
    st[i]=s;tn[i]=Math.max(0,Math.min(4,Math.floor(3.7-sh*2.4-pa*.5+(snowVN(wx,wy,4,71)-.5)*1.4+(snowH(wx,wy,73)-.5)*.5)))}/* 色：木の下と道は、すこし青いかげの色 */
  return{st,tn}}
/* 画面の向きのドット (X,Y) の、せかいの点 */
const snowWX=(X,Y)=>(X/IQA+Y/IQB)/2,snowWY=(X,Y)=>(Y/IQB-X/IQA)/2;
function* snowDots(X0,Y0,RW,RH,one){/* 画面の向きの四角（ドット）の、ドットごとの段と色（段 | 色<<3。0：地図の外・one のマスの外）。少しずつ作る（yield のたびに、つぎのコマへ） */
  let ax=Infinity,bx=-Infinity,ay=Infinity,by=-Infinity;for(const[X,Y]of[[X0,Y0],[X0+RW,Y0],[X0,Y0+RH],[X0+RW,Y0+RH]]){const a=snowWX(X,Y),b=snowWY(X,Y);ax=Math.min(ax,a);bx=Math.max(bx,a);ay=Math.min(ay,b);by=Math.max(by,b)}
  ax=Math.max(0,Math.floor(ax));ay=Math.max(0,Math.floor(ay));bx=Math.min(W*TS-1,Math.ceil(bx));by=Math.min(H*TS-1,Math.ceil(by));if(bx<ax||by<ay)return null;
  if(one!=null){const x=one%W,y=(one/W)|0;ax=Math.max(ax,x*TS);ay=Math.max(ay,y*TS);bx=Math.min(bx,x*TS+TS-1);by=Math.min(by,y*TS+TS-1)}
  const bw=bx-ax+1,bh=by-ay+1,B={st:new Uint8Array(bw*bh),tn:new Uint8Array(bw*bh)},pk=new Uint8Array(RW*RH),tj=new Uint16Array(RW*RH);let any=false;
  for(let y=ay;y<=by;y+=SNOWBAND){const b=snowBake(ax,y,bw,Math.min(SNOWBAND,by-y+1));B.st.set(b.st,(y-ay)*bw);B.tn.set(b.tn,(y-ay)*bw);yield}/* 帯ごとにやきつけても、種はまわりのマスの物なので、同じになる */
  for(let v=0;v<RH;v++){if(v%SNOWBAND===0)yield;const Y=Y0+v+.5;for(let u=0;u<RW;u++){const X=X0+u+.5,wx=Math.floor(snowWX(X,Y)),wy=Math.floor(snowWY(X,Y));if(wx<ax||wy<ay||wx>bx||wy>by)continue;const k=(wy-ay)*bw+(wx-ax);pk[v*RW+u]=B.st[k]|B.tn[k]<<3;tj[v*RW+u]=((wy/TS)|0)*W+((wx/TS)|0);any=true}}
  return any?{pk,tj}:null}/* tj：ドットのマス */
function snowPaint(e,st,want){/* e.pk から、いまの段までの雪を絵にする（want：そのマスの雪のしるし SNW.elig の値） */const RGB=snowRGB().s,el=SNW.elig;if(!e.c){e.c=document.createElement('canvas');e.c.width=e.w;e.c.height=e.h}
  const g=e.c.getContext('2d'),id=g.createImageData(e.w,e.h),D=id.data;let any=false;
  if(e.pk){const P=e.pk.pk,TJ=e.pk.tj;for(let i=0;i<P.length;i++){const code=P[i];if(!code||(code&7)>st||el[TJ[i]]!==want)continue;
    const c=RGB[code>>3],o=i*4;D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255;any=true}}
  g.putImageData(id,0,0);e.any=any}
/* 地面の雪を、見えている区画ごとに描く（feel.js の feelGround から。地面の区画と同じ所・同じドット） */
function snowGround(k){if(!S||!igOK())return;const st=snowStage();if(!st){if(SNW.R.size||SNW.T.size)snowDrop();return}snowPrep();
  const O=isoOff(k),[c0,r0,c1,r1]=igVis(),rk=st+'|'+SNW.ev,t0=performance.now();let busy=false;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const key=cy*64+cx;let e=SNW.R.get(key);
    if(!e){if(busy)continue;const X0=IGX0+cx*IGW-SNP,Y0=cy*IGH-SNP,w=IGW+SNP*2,h=IGH+SNP*2;e={X0,Y0,w,h,pk:null,g:snowDots(X0,Y0,w,h),c:null,rk:'',any:false,u:RFN};SNW.R.set(key,e)}
    e.u=RFN;if(e.g){if(busy)continue;busy=true;let r;while(!(r=e.g.next()).done)if(performance.now()-t0>SNOWBUD)break;if(!r.done)continue;e.g=null;e.pk=r.value}/* 作るのは、1コマに1区画を SNOWBUD まで（できるまで、その区画の雪は出さない） */
    if(!e.pk)continue;if(e.rk!==rk&&(e.st!==st||performance.now()-t0<SNOWBUD)){snowPaint(e,st,1);e.rk=rk;e.st=st}if(!e.any)continue;/* 段がかわったときは、見えている区画をそのコマでぜんぶ（ぱっと切りかえる）。マスのかわり（物を置いたなど）は、時間があるときに1つずつ */
    const a=Math.round(O[0]+k*e.X0),b=Math.round(O[1]+k*e.Y0);ctx.drawImage(e.c,a,b,Math.round(O[0]+k*(e.X0+e.w))-a,Math.round(O[1]+k*(e.Y0+e.h))-b)}
  ctx.restore();if(RFN%60===0)for(const[key,e]of SNW.R)if(RFN-e.u>300){if(e.c)e.c.width=e.c.height=0;SNW.R.delete(key)}}
/* 高い段のマスの雪（feelRow の高い段から。c には、その段の高さの地面の向き isoGroundLv がかかっている） */
function snowLift(c,i){const st=snowStage();if(!st||!SNW.elig||SNW.elig[i]!==2)return;const x=i%W,y=(i/W)|0;let e=SNW.T.get(i);
  if(!e){const X0=(x-y)*IQW/2-IQW/2-1,Y0=(x+y)*IQH/2-1,w=IQW+2,h=IQH+2;e={X0,Y0,w,h,pk:snowRun(snowDots(X0,Y0,w,h,i)),c:null,rk:'',any:false};SNW.T.set(i,e)}
  if(!e.pk)return;const rk=st+'|'+SNW.ev;if(e.rk!==rk){snowPaint(e,st,2);e.rk=rk}if(!e.any)return;
  const m=c.getTransform(),kk=m.a/IQA,wx=x*TS,wy=y*TS,sx=m.a*wx+m.c*wy+m.e,sy=m.b*wx+m.d*wy+m.f,X=(x-y)*IQW/2,Y=(x+y)*IQH/2;
  c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;const a=Math.round(sx+kk*(e.X0-X)),b=Math.round(sy+kk*(e.Y0-Y));c.drawImage(e.c,a,b,Math.round(sx+kk*(e.X0-X+e.w))-a,Math.round(sy+kk*(e.Y0-Y+e.h))-b);c.restore()}

/* ---------- 物の上の雪：チップの絵ごとに1回だけ、3段ぶんの絵を作る ---------- */
function snowCapOf(src,id){if(src._snowc!==undefined)return src._snowc;const im=chipImgs(src,id)[0];if(!im||!im.ok)return null;/* 絵が読みこみ中：あとでもう1回 */
  try{const w=src.w,h=src.h,t=document.createElement('canvas');t.width=w;t.height=h;const g=t.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h).data;t.width=t.height=0;
    const Q=src.g===64?2:1,op=(x,y)=>y>=0&&y<h&&d[(y*w+x)*4+3]>140,br=(x,y)=>{const o=(y*w+x)*4;return(30*d[o]+59*d[o+1]+11*d[o+2])/100};
    const L=[];for(let y=0;y<h;y+=Q)for(let x=0;x<w;x+=Q)if(op(x,y))L.push(br(x,y));if(!L.length){src._snowc=null;return null}L.sort((a,b)=>a-b);
    const lo=L[Math.floor(L.length*.1)],hi=Math.max(lo+1,L[Math.floor(L.length*.95)]),cut=lo+(hi-lo)*SNOWCAPLO,D=SNOWCAPD[id]||SNOWCAPD0,top=new Int16Array(w).fill(-1);
    for(let x=0;x<w;x+=Q)for(let y=0;y<h;y+=Q)if(op(x,y)){top[x]=y;break}
    const C=[],seen=new Set();
    for(let x=0;x<w;x+=Q){const a=top[x];if(a<0)continue;const l=x>=Q*2?top[x-Q*2]:-1,r=x+Q*2<w?top[x+Q*2]:-1,steep=Math.max(l<0?99:Math.abs(l-a),r<0?99:Math.abs(r-a))>Q*5;/* 切り立った横のふちには、のせない */
      for(let y=a;y<h*.85;y+=Q){if(!op(x,y))continue;let s=-1;if(y===a){if(!steep)s=y+Q}/* 絵の上のはし：輪郭の行はのこして、その下から */
        else if(!op(x,y-Q))s=y+Q;/* すきまの下の面：その上の輪郭はのこす */
        else if(op(x,y-Q*2)&&br(x,y)-br(x,y-Q*2)>SNOWCAPRISE&&br(x,y-Q)<br(x,y))s=y;/* 暗いすきまの下の、明るい葉のかたまり */
        if(s<0)continue;const dep=Math.floor(D)+(hash(x*7+y*3+w)<D%1?1:0);
        for(let k=0;k<dep;k++){const yy=s+k*Q;if(!op(x,yy))break;if(seen.has(yy*w+x))continue;const b=br(x,yy);if(b<cut)continue;seen.add(yy*w+x);
          C.push({x,y:yy,b,r:SNOWCAPW[0]*k/dep+SNOWCAPW[1]*(1-(b-lo)/(hi-lo))+SNOWCAPW[2]*hash(x*13+yy*7+w*3)})}}}
    if(!C.length){src._snowc=null;return null}C.sort((a,b)=>a.r-b.r);const n1=Math.round(C.length*SNOWCAPRK[0]),n2=Math.round(C.length*SNOWCAPRK[1]),S3=[];
    for(let s=0;s<3;s++){const c=document.createElement('canvas');c.width=w;c.height=h;S3.push(c)}
    C.forEach((p,n)=>{const s=n<n1?0:n<n2?1:2,tn=Math.max(0,Math.min(4,Math.floor((p.b-lo)/(hi-lo)*5)));for(let k=s;k<3;k++){const q=S3[k].getContext('2d');q.fillStyle=SNOWC[tn];q.fillRect(p.x,p.y,Q,Q)}});
    src._snowc=S3}catch(e){src._snowc=null}return src._snowc}

/* ---------- 池の氷 ---------- */
function iceTw(){return feelSeasonDay()+(hour()-6)/24}/* 冬の1日めの朝6時からの日数 */
function iceFreeze(){if(!S||seasonNow()!==3)return 0;return Math.max(0,Math.min(1,iceTw()/ICEDAYS))}
function iceCrack(){if(!S||seasonNow()!==3)return 0;return Math.max(0,Math.min(1,(iceTw()-ICECRACKD)*24/ICECRACKH))}
function iceKey(){const f=iceFreeze();if(!f)return '';return Math.round(f*100)+'|'+Math.round(iceCrack()*20)+'|'+Math.max(0,snowStage()-1)}
/* 池ごとの、岸からのきょり（4点ごと）と、ひび（池の水がかわったら作りなおす） */
function icePrep(){if(SNI.s===S&&SNI.tc&&RFN-SNI.hf<60)return;SNI.hf=RFN;const h=fishWaterHash();if(SNI.s===S&&SNI.h===h&&SNI.tc)return;
  SNI.s=S;SNI.h=h;for(const e of SNI.R.values())if(e.c)e.c.width=e.c.height=0;SNI.R.clear();const tc=new Int16Array(W*H).fill(-1),comp=[];SNI.tc=tc;SNI.comp=comp;
  const pond=new Uint8Array(W*H),seen=new Uint8Array(W*H);/* 池：地図のはしにつながらない水（fish.js の waterKind と同じ。温泉はのぞく） */
  for(let j=0;j<W*H;j++){if(seen[j]||S.ground[j]!==1)continue;const L=[j];seen[j]=1;let edge=false;for(let n=0;n<L.length;n++){const k=L[n],x=k%W,y=(k/W)|0;if(x===0||y===0||x===W-1||y===H-1)edge=true;for(const q of[x>0?k-1:-1,x<W-1?k+1:-1,y>0?k-W:-1,y<H-1?k+W:-1])if(q>=0&&!seen[q]&&S.ground[q]===1){seen[q]=1;L.push(q)}}if(!edge)for(const k of L)if(!hotW(k))pond[k]=1}
  for(let j=0;j<W*H;j++){if(tc[j]>=0||!pond[j])continue;const id=comp.length,L=[j];tc[j]=id;let x0=W,y0=H,x1=0,y1=0;
    for(let n=0;n<L.length;n++){const k=L[n],x=k%W,y=(k/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);for(const q of[x>0?k-1:-1,x<W-1?k+1:-1,y>0?k-W:-1,y<H-1?k+W:-1])if(q>=0&&tc[q]<0&&pond[q]){tc[q]=id;L.push(q)}}
    const G=4,ox=(x0-1)*TS,oy=(y0-1)*TS,gw=(x1-x0+3)*TS/G,gh=(y1-y0+3)*TS/G,dd=new Float32Array(gw*gh),INF=1e9;
    for(let v=0;v<gh;v++)for(let u=0;u<gw;u++){const tx=Math.floor((ox+u*G)/TS),ty=Math.floor((oy+v*G)/TS);dd[v*gw+u]=tx>=0&&ty>=0&&tx<W&&ty<H&&tc[ty*W+tx]===id?INF:0}
    const D2=Math.SQRT2;/* 2回なぞって、岸からのきょり */
    for(let v=0;v<gh;v++)for(let u=0;u<gw;u++){const i=v*gw+u;if(!dd[i])continue;let m=dd[i];if(u>0)m=Math.min(m,dd[i-1]+1);if(v>0){m=Math.min(m,dd[i-gw]+1);if(u>0)m=Math.min(m,dd[i-gw-1]+D2);if(u<gw-1)m=Math.min(m,dd[i-gw+1]+D2)}dd[i]=m}
    for(let v=gh-1;v>=0;v--)for(let u=gw-1;u>=0;u--){const i=v*gw+u;if(!dd[i])continue;let m=dd[i];if(u<gw-1)m=Math.min(m,dd[i+1]+1);if(v<gh-1){m=Math.min(m,dd[i+gw]+1);if(u<gw-1)m=Math.min(m,dd[i+gw+1]+D2);if(u>0)m=Math.min(m,dd[i+gw-1]+D2)}dd[i]=m}
    let mx=0;for(let i=0;i<dd.length;i++){dd[i]*=G;if(dd[i]>mx)mx=dd[i]}
    const C={ox,oy,gw,gh,G,d:dd,mx,cr:new Map(),n:L.length};comp.push(C);
    const crn=Math.min(ICEN,Math.ceil(L.length/3)),dAt=(x,y)=>{const u=Math.floor((x-ox)/G),v=Math.floor((y-oy)/G);return u<0||v<0||u>=gw||v>=gh?0:dd[v*gw+u]};
    for(let c=0;c<crn;c++){let sx=-1,sy=-1;for(let t=0;t<40;t++){const k=L[Math.floor(hash(id*131+c*17+t*7)*L.length)],x=(k%W)*TS+hash(id*29+c*13+t*3+1)*TS,y=((k/W)|0)*TS+hash(id*37+c*11+t*5+2)*TS;if(dAt(x,y)>5){sx=x;sy=y;break}}if(sx<0)continue;
      const P=[];let x=sx,y=sy,a=hash(id*41+c*19)*6.283;const n=ICECRL[0]+Math.floor(hash(id*43+c*23)*(ICECRL[1]-ICECRL[0]+1));
      for(let s=0;s<n;s++){x+=Math.cos(a);y+=Math.sin(a);a+=(hash(id*47+c*29+s*3)*2-1)*.6;if(dAt(x,y)>1)P.push([x,y]);
        if(hash(id*53+c*31+s*5)<ICEBR){let bx=x,by=y,b=a+(hash(id*59+s)<.5?-1.1:1.1);const m=ICEBRL[0]+Math.floor(hash(id*61+s*7)*(ICEBRL[1]-ICEBRL[0]+1));for(let q=0;q<m;q++){bx+=Math.cos(b);by+=Math.sin(b);if(dAt(bx,by)>1)P.push([bx,by])}}}
      P.forEach(([px,py],q)=>{const key=Math.floor(py)*W*TS+Math.floor(px),v=(q+1)/P.length,o=C.cr.get(key);if(o==null||v<o)C.cr.set(key,v)})}}}
function iceComp(j){icePrep();const c=SNI.tc[j];return c>=0?SNI.comp[c]:null}
function iceDist(C,wx,wy){const u=Math.floor((wx-C.ox)/C.G),v=Math.floor((wy-C.oy)/C.G);return u<0||v<0||u>=C.gw||v>=C.gh?0:C.d[v*C.gw+u]}
/* そのマス（水のマス）がこおっているか（マスのまん中で見る）。こおった所では、つりをしない */
function iceW(j){if(j==null||j<0||!S||S.ground[j]!==1)return false;const f=iceFreeze();if(!f)return false;const C=iceComp(j);if(!C)return false;return iceDist(C,(j%W+.5)*TS,(((j/W)|0)+.5)*TS)<=f*(C.mx+ICEPAD)}
/* 水面の区画 q の、氷の絵（iso-ground.js の igShimmer から。q.w と同じ大きさ・同じ所。止めた水の模様 P の明るさで色をきめる） */
function iceRegion(q,P,key){if(!key||!q.w)return null;icePrep();let e=SNI.R.get(q.cy*64+q.cx);
  if(!e||e.w!==q.w||e.ww!==q.w.width||e.hh!==q.w.height){if(e&&e.c)e.c.width=e.c.height=0;e={w:q.w,ww:q.w.width,hh:q.w.height,g:iceDots(q,P),n:0};SNI.R.set(q.cy*64+q.cx,e)}
  if(SNI.bf!==RFN){SNI.bf=RFN;SNI.bt=performance.now()}/* このコマで、氷を作りはじめた時刻 */
  if(e.g){if(performance.now()-SNI.bt>SNOWBUD)return null;let r;while(!(r=e.g.next()).done)if(performance.now()-SNI.bt>SNOWBUD)break;if(!r.done)return null;e=r.value;SNI.R.set(q.cy*64+q.cx,e)}/* 1コマに SNOWBUD まで（できるまで、その区画は水のまま） */
  if(!e.n)return null;if(e.k!==key&&(!e.c||performance.now()-SNI.bt<=SNOWBUD)){icePaint(e);e.k=key}return e.any?e.c:null}/* こおりぐあいがかわったら、時間があるときに描きなおす（それまでは前の絵） */
function* iceDots(q,P){/* 少しずつ作る（池のマスごとに yield） */const ww=q.w.width,hh=q.w.height,X0=igX(q)+q.wx,Y0=igY(q)+q.wy,e={w:q.w,ww,hh,X0,Y0,n:0,c:null,k:'',any:false};
  if(SNI.wpc!==P.c){SNI.wpc=P.c;SNI.wp=P.c.getContext('2d').getImageData(0,0,P.w,P.h).data}const WP=SNI.wp;
  const idx=[],dj=[],mx=[],tn=[],rk=[],cr=[],pd=new Uint8Array(ww*hh);
  const tx0=Math.max(0,Math.floor(snowWX(X0,Y0)/TS)-1),tx1=Math.min(W-1,Math.ceil(snowWX(X0+ww,Y0+hh)/TS)+1),ty0=Math.max(0,Math.floor(snowWY(X0+ww,Y0)/TS)-1),ty1=Math.min(H-1,Math.ceil(snowWY(X0,Y0+hh)/TS)+1);
  for(let ty=ty0;ty<=ty1;ty++){for(let tx=tx0;tx<=tx1;tx++){const ci=SNI.tc[ty*W+tx];if(ci<0)continue;yield;const C=SNI.comp[ci],sx=(tx-ty)*IQW/2-X0,sy=(tx+ty)*IQH/2-Y0;/* 池のマスのひし形のドットだけ */
  for(let v=Math.max(0,Math.floor(sy));v<Math.min(hh,Math.ceil(sy+IQH));v++){const Y=Y0+v+.5;for(let u=Math.max(0,Math.floor(sx-IQW/2));u<Math.min(ww,Math.ceil(sx+IQW/2));u++){const X=X0+u+.5,wx=snowWX(X,Y),wy=snowWY(X,Y);if(Math.floor(wx/TS)!==tx||Math.floor(wy/TS)!==ty)continue;
    const d=iceDist(C,wx,wy),n=(snowVN(wx,wy,5,83)-.5)*2,o=((((Math.floor(Y0+v)%P.h)+P.h)%P.h)*P.w+(((Math.floor(X0+u)%P.w)+P.w)%P.w))*4,b=(30*WP[o]+59*WP[o+1]+11*WP[o+2])/100;
    pd[v*ww+u]=1;idx.push(v*ww+u);dj.push(d+ICENOISE*n);mx.push(C.mx+ICEPAD);tn.push(Math.min(4,Math.max(0,Math.min(4,Math.floor((b-50)/150*5)))+1));
    rk.push(.55*d/Math.max(1,C.mx)+.4*snowVN(wx,wy,7,89)+.1*snowH(wx,wy,97));const c=C.cr.get(Math.floor(wy)*W*TS+Math.floor(wx));cr.push(c==null?2:c)}}}}
  e.n=idx.length;e.idx=Int32Array.from(idx);e.dj=Float32Array.from(dj);e.mx=Float32Array.from(mx);e.tn=Uint8Array.from(tn);e.rk=Float32Array.from(rk);e.cr=Float32Array.from(cr);e.pd=pd;return e}
function icePaint(e){const f=iceFreeze(),cp=iceCrack(),ss=Math.max(0,snowStage()-1),RGB=snowRGB();if(!e.c){e.c=document.createElement('canvas');e.c.width=e.ww;e.c.height=e.hh}
  const g=e.c.getContext('2d'),id=g.createImageData(e.ww,e.hh),D=id.data,ic=new Uint8Array(e.ww*e.hh);let any=false;
  for(let n=0;n<e.n;n++)if(e.dj[n]<=f*e.mx[n])ic[e.idx[n]]=1;
  for(let n=0;n<e.n;n++){const i=e.idx[n];if(!ic[i])continue;const u=i%e.ww,v=(i/e.ww)|0,open=k=>e.pd[k]&&!ic[k];
    let c=RGB.i[(u>0&&open(i-1))||(u<e.ww-1&&open(i+1))||(v>0&&open(i-e.ww))||(v<e.hh-1&&open(i+e.ww))?4:e.tn[n]];/* まだこおっていない水とのさかいは、明るいふち */
    if(cp>0&&e.cr[n]<=cp)c=RGB.i[1];/* ひび */
    if(ss>0&&e.rk[n]<ICESNOWR[ss-1])c=RGB.s[Math.min(4,e.tn[n]+1)];/* 氷の上の雪（岸から） */
    const o=i*4;D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255;any=true}
  g.putImageData(id,0,0);e.any=any}
