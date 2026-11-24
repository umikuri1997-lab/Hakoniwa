'use strict';
/* ---------- クォータービューの地面（ひし形のタイルとオートタイル） ----------
   地面は、画面の向きの四角の区画（IGW×IGH、ゲームの点。1ドット＝ゲームの1点。1マスのひし形は 64×48）に作っておき、ならべて描く。
   ステージを開くときに、ぜんぶ作って、すてない（作りなおすのは、物を置いて変わった区画だけ）。
   1. 下の地面（あれ地・火山の地面）と、上の平らな物（床・道・畑・平らな物）は、いままでの上から見た絵を、ひし形へ写す（ひし形の絵がとどくまでの仮）。
      写すのは、ドットのまん中の点がどのマスのどこかを見て、その色をとる（ドットのますめにそろう。まわして描かない）。
   2. 草地とあれ地のさかい（ふちは、道と同じ草の葉）・水と岸は、デュアルグリッドのオートタイル：マスの角（となり4マスのまん中）ごとに、4マスの草（水）のあるなし（16とおり）で
      えらんだタイル（IGTG・IGTW）をならべる。タイルの形は、4マスの値をなめらかにつないだ面を、しきいでくぎる（マーチングスクエア）。
   3. 水は岸より一段ひくい：画面で水のすぐ上が陸なら、岸の断面（WBANKC）とそのかげ。水面は、毎コマ、水の模様をゆっくり流す（igShimmer）。 */
const IGSKYH=18;/* 浮き島のがけ（雲の海の上、画面で島のすぐ下）の高さ（ゲームの点） */
const IGW=512,IGH=384,IGX0=-H*IQW/2,IGM=Math.max(WBANK+WBSH,IGSKYH)+2,IGP=GPAD;/* 区画の大きさ・左のはし・岸の断面を見るために上へよけいに見る行・となりの区画とかさねるのりしろ */
const IGNX=Math.ceil((W+H)*IQW/2/IGW),IGNY=Math.ceil((W+H)*IQH/2/IGH);
const IGWT=.72;/* 水のしきい：まっすぐな岸は、水のマスの7ドット内がわ（前と同じ） */
const IG={s:null,c:new Map(),tg:null,tw:null,pt:null,tmp:null,n:0};
function igq(cx,cy){const k=cy*64+cx;let q=IG.c.get(k);if(!q){q={cx,cy,f:null,l:null,w:null,st:false,e:false,u:0};IG.c.set(k,q)}return q}
function igClear(){for(const q of IG.c.values())igFree(q);IG.c.clear();IG.s=S;IG.pt=null;igTileFree()}
function igTileFree(){if(IG.tc){for(const e of IG.tc.values())e.c.width=e.c.height=0;IG.tc=null}}
function igFree(q){for(const k of['f','l','w','ws','k'])if(q[k]){q[k].width=q[k].height=0;q[k]=null}q.wk=null}
function igOK(){return groundChipsOK()&&waterChipsOK()}
/* デュアルグリッドのタイル（1まい 64×48。ドットのまん中の点が、そのタイルの四角のどこにあるかで、なかみをきめる）
   角の番号：1 左上のマス・2 右上・4 左下・8 右下（せかいの向き） */
function igTiles(fn){const T=[];for(let m=0;m<16;m++){const a=new Uint8Array(IQW*IQH);for(let v=0;v<IQH;v++)for(let u=0;u<IQW;u++){const ix=u-IQW/2+.5,iy=v+.5,wx=(ix/IQA+iy/IQB)/2,wy=(iy/IQB-ix/IQA)/2;if(wx<0||wy<0||wx>=TS||wy>=TS){a[v*IQW+u]=255;continue}/* この点は、となりのタイル */
  const s=wx/TS,t=wy/TS,f=(m&1)*(1-s)*(1-t)+(m>>1&1)*s*(1-t)+(m>>2&1)*(1-s)*t+(m>>3&1)*s*t;a[v*IQW+u]=fn(f)}T.push(a)}return T}
/* 草：1 草・2 草の葉のかげの色・0 あれ地。ふちは、あぜ道・砂利道の草のふち（draw-ground.js の roadGrassEdge）と同じ：
   さかいの線から、あれ地のほうへ、まるいふくらみと、とがった草の葉がはみ出す。葉は、さかいにそった向き（4マスの値の面の、等高線の向き）にならべる。
   ならびは1マス（TS）でくりかえすので、まっすぐなさかいは、となりのタイルとつながる。 */
const GRBN=19,GRBS=TS/GRBN;/* 1マスの葉の数・葉のあいだ（道のふちと同じ、ほぼ1.7） */
function igBlade(u,e){const k0=Math.floor(u/GRBS);for(let k=k0-3;k<=k0+3;k++){const n=((k%GRBN)+GRBN)%GRBN,v=hash(n*71+3),pos=k*GRBS-1+hash(n*37+1)*1.8,dep=2+v*4.3,rx=2+hash(n*17+2)*1.6,ry=dep*.7;
  if(((u-pos)/rx)**2+((e-.6)/ry)**2<=1)return 1;/* ふくらみ */const L=dep+1.5;if(e<L){const w=1.7*(1-e/L),c=pos+(v-.5)*3*(e/L);if(Math.abs(u-c)<=w)return n%4?1:2}}/* とがった葉（4本に1本はかげの色） */
  return 0}
function igGrassTiles(){const T=[];for(let m=0;m<16;m++){const a=new Uint8Array(IQW*IQH),c0=m&1,c1=m>>1&1,c2=m>>2&1,c3=m>>3&1;for(let v=0;v<IQH;v++)for(let u=0;u<IQW;u++){const ix=u-IQW/2+.5,iy=v+.5,wx=(ix/IQA+iy/IQB)/2,wy=(iy/IQB-ix/IQA)/2;if(wx<0||wy<0||wx>=TS||wy>=TS){a[v*IQW+u]=255;continue}
  const s=wx/TS,t=wy/TS,f=c0*(1-s)*(1-t)+c1*s*(1-t)+c2*(1-s)*t+c3*s*t;if(f>=GRT){a[v*IQW+u]=1;continue}
  const fx=((1-t)*(c1-c0)+t*(c3-c2))/TS,fy=((1-s)*(c2-c0)+s*(c3-c1))/TS,g=Math.hypot(fx,fy);if(g<1e-6){a[v*IQW+u]=0;continue}/* 草のほうへの向き */
  const e=(GRT-f)/g;a[v*IQW+u]=e>9?0:igBlade(-wx*fy/g+wy*fx/g,e)}T.push(a)}return T}/* e：さかいの線からの、あれ地がわのきょり（ゲームの点） */
const igTG=()=>IG.tg||(IG.tg=igGrassTiles());
/* 水：1 水・2 陸にとなる水の線・10+k 陸の、水からの帯（k＝1〜3）・0 陸 */
const igTW=()=>IG.tw||(IG.tw=igTiles(f=>{if(f>=IGWT+1/TS)return 1;if(f>=IGWT)return 2;for(let k=1;k<WBAND.length;k++)if(f>=IGWT-k/TS)return 10+k;return 0}));
/* 絵の画素をとっておく（テクスチャ・上から見た絵） */
const IGPX=new WeakMap();function igPix(im){let d=IGPX.get(im);if(d)return d;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);d={w:c.width,h:c.height,d:g.getImageData(0,0,c.width,c.height).data};c.width=c.height=0;IGPX.set(im,d);return d}
/* 区画の、せかいのマスのはんい */
function igRange(X,Y,w,h){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[a,b]of[[X,Y],[X+w,Y],[X,Y+h],[X+w,Y+h]]){const p=isoInv(a,b);x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}
  return[Math.max(0,Math.floor(x0/TS)-1),Math.max(0,Math.floor(y0/TS)-1),Math.min(W-1,Math.floor(x1/TS)+1),Math.min(H-1,Math.floor(y1/TS)+1)]}
/* 下の地面（いまの上から見た絵）：あれ地・火山の地面 */
function igBaseDraw(g,X0,Y0,X1,Y1,inC){const C=window.CHIPS,r=WD===KAZAN?'r':'';
  if(WD===KUSA){const x0=X0*TS,y0=Y0*TS,x1=(X1+1)*TS,y1=(Y1+1)*TS;for(let by=Math.floor(y0/DRTEX)*DRTEX;by<y1;by+=DRTEX)for(let bx=Math.floor(x0/DRTEX)*DRTEX;bx<x1;bx+=DRTEX){const a=Math.max(bx,x0),b=Math.max(by,y0),c=Math.min(bx+DRTEX,x1),d=Math.min(by+DRTEX,y1);g.drawImage(dryTex(bx,by),a-bx,b-by,c-a,d-b,a,b,c-a,d-b)}return}/* 草原のあれ地：テクスチャ1まい（DRTEX）ごとに、まとめて描く */
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(!inC(x,y))continue;const px=x*TS,py=y*TS,i=y*W+x,ch=C['ground'+r+'#'+((hash(i*7+1)*8)|0)];if(ch)drawChip(g,ch,'ground',px,py,0,i)}}
/* 上の平らな物（いまの上から見た絵）：床・壁の下の床・畑など平らな物 */
function igUpperDraw(g,X0,Y0,X1,Y1,inC){let n=0;for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(!inC(x,y))continue;const i=y*W+x;if(S.ground[i]!==1&&S.floor[i]&&!((HOME_WALLS.has(S.obj[i])||HOME_DOORS.has(S.obj[i]))&&!ROADF.has(S.floor[i]))){drawFloor(g,S.floor[i],x*TS,y*TS,i);n++}if(HOME_DOORS.has(S.obj[i])||HOME_WALLS.has(S.obj[i])){wallMarg(g,i,x*TS,y*TS);n++}}
  const fixed=[];for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x,o=S.obj[i];if(!o||o==='part'||!BL[o]||BL[o].dyn||BL[o].anim||TREES.has(o)||!(FLAT.has(o)||BL[o].floor)||FLAT.has(o)&&RUGC.has(i))continue;fixed.push({i,o,k:objectDepth(o,i),t:BL[o].kind==='block'?0:1})}
  fixed.sort((a,b)=>a.k-b.k||a.t-b.t||a.i-b.i);for(const{i,o}of fixed)drawObj(g,o,(i%W)*TS,((i/W)|0)*TS,i);return n+fixed.length>0}/* 何か描いたか（描く物がない区画は、上の絵を作らない） */
/* 区画 q を作る */
function igBuild(q){const t0=performance.now(),X=IGX0+q.cx*IGW-IGP,Y=q.cy*IGH-IGP,w=IGW+2*IGP,h=IGH+2*IGP,Yt=Y-IGM,ht=h+IGM;q.st=false;q.u=RFN;
  const[X0,Y0,X1,Y1]=igRange(X,Yt,w,ht);if(X1<X0||Y1<Y0){igFree(q);q.e=true;return}
  const sw=(X1-X0+1)*TS,sh=(Y1-Y0+1)*TS,sx0=X0*TS,sy0=Y0*TS,inC=(x,y)=>{const a=(x-y)*IQW/2,b=(x+y)*IQH/2;return a+3*IQW/2>=X&&a-3*IQW/2<=X+w&&b+4*IQH/2>=Yt&&b-2*IQH/2<=Yt+ht},/* マス (x,y) が、この区画の画面の四角にかかるか（まわり1マスもふくめる）。四角のマスのはんいのうち、かからないマスは描かない */
    sc=document.createElement('canvas'),src=(fn)=>{const g=sc.getContext('2d',{willReadFrequently:true});if(sc.width!==sw||sc.height!==sh){sc.width=sw;sc.height=sh}else{g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,sw,sh)}g.setTransform(1,0,0,1,-sx0,-sy0);return fn(g,X0,Y0,X1,Y1,inC)===false?null:g.getImageData(0,0,sw,sh).data};/* 描いて読むだけの絵なので、読みとりの速い形（willReadFrequently）。下の地面と上の物で、1まいを使いまわす。何も描かなかったら null */
  const p0=CHPN,B=src(igBaseDraw),U=src(igUpperDraw);sc.width=sc.height=0;q.pend=CHPN>p0;/* 読みこみ中のページの絵（道・畑など）は、仮の絵か、なにもない。ページがとどいたら作りなおす（igPendDone。しないと、となりの区画とのさかいに、たての線が出る） */const C=window.CHIPS,GT=igPix(chipImgs(C['tex:grass'],'ground')[0]),WT=igPix(chipImgs(C['tex:water'],'water')[0]),SM=skyM(),ST=SM?igPix(skyTex()):null/* 雲の海（風） */,RM=riftM()/* 土の地われ：陸の地面に作り、上に地われのタイル（tsuchi.js の tsRiftDraw） */,SP=WD===KAZAN&&S.st2?sprMap():null,TG=igTG(),TW=igTW();
  /* マスの草・水の値（区画のマスのはんい＋まわり1マス） */const gx0=X0-1,gy0=Y0-1,gw=X1-X0+3,gh=Y1-Y0+3,GV=new Uint8Array(gw*gh),WV=new Uint8Array(gw*gh),inM=(x,y)=>x>=0&&y>=0&&x<W&&y<H,land=j=>S.ground[j]!==1&&S.ground[j]<1;
  for(let b=0;b<gh;b++)for(let a=0;a<gw;a++){const x=Math.min(W-1,Math.max(0,gx0+a)),y=Math.min(H-1,Math.max(0,gy0+b)),j=y*W+x,wt=S.ground[j]>=1&&!(RM&&RM[j]===1);WV[b*gw+a]=wt?1:0;
    GV[b*gw+a]=wt?(REV.has(j)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>inM(x+dx,y+dy)&&land(j+dy*W+dx)&&REV.has(j+dy*W+dx))?1:0):REV.has(j)?1:0}/* 水のマスは、となりの草地の陸があれば草（水の丸い角の外に見える所） */
  const N=w*ht,O=new Uint8ClampedArray(N*4),K=new Uint8Array(N);/* K：1 水面・2 水の線・3 浅瀬・4 雲の海・0 そのほか */
  const AU=new Float64Array(w);for(let u=0;u<w;u++)AU[u]=(X+u+.5)/IQA;/* 列ごとの割り算は1回だけ */
  const WTS=W*TS,HTS=H*TS,SG=S.ground,GD=GT.d,GTW=GT.w,GTH=GT.h,WTD=WT.d,WTW=WT.w,WTH=WT.h,WB0=WBAND[0];/* ドットごとに見る物は、先に手もとへ */
  for(let v=0;v<ht;v++){const iy=Yt+v,bv=(iy+.5)/IQB;for(let u=0;u<w;u++){const ix=X+u,au=AU[u],wx=(au+bv)/2,wy=(bv-au)/2;if(wx<0||wy<0||wx>=WTS||wy>=HTS)continue;
    const p=v*w+u,o=p*4,fx=wx|0,fy=wy|0,tx=(fx/TS)|0,ty=(fy/TS)|0,vx=(wx/TS+.5)|0,vy=(wy/TS+.5)|0,lu=ix-((vx-vy)*IQW/2-IQW/2),lv=iy-(vx+vy-1)*IQH/2,li=lv*IQW+lu;
    const ca=vx-1-gx0,cb=vy-1-gy0,c1=cb*gw+ca,c2=c1+1,c3=c1+gw,c4=c3+1,mg=GV[c1]|GV[c2]<<1|GV[c3]<<2|GV[c4]<<3,mw=WV[c1]|WV[c2]<<1|WV[c3]<<2|WV[c4]<<3;
    const si=((fy-sy0)*sw+(fx-sx0))*4;let r=B[si],g=B[si+1],b=B[si+2];
    const kg=mg?TG[mg][li]:0;if(kg===1||kg===2){const ti=((fy%GTH)*GTW+fx%GTW)*4;r=GD[ti];g=GD[ti+1];b=GD[ti+2];if(kg===2){r=r*.89;g=g*.92;b=b*.89}}/* 草の葉のかげの色（道のふちの葉と同じくらい） */
    const kw=mw?TW[mw][li]:0,j=ty*W+tx,sky=SM&&SM[j]===1;
    if(kw===1||kw===2){if(sky){const ti=((fy%ST.h)*ST.w+fx%ST.w)*4;r=ST.d[ti];g=ST.d[ti+1];b=ST.d[ti+2];K[p]=4}else{const ti=((fy%WTH)*WTW+fx%WTW)*4;r=WTD[ti];g=WTD[ti+1];b=WTD[ti+2];K[p]=1;
      if(SP&&springOn(SP[j])){r=r+(232-r)*.6;g=g+(238-g)*.6;b=b+(232-b)*.6;K[p]=3}/* よみがえった温泉：乳白色の湯 */
      if(SG[j]===2){r=r+(226-r)*.45;g=g+(214-g)*.45;b=b+(170-b)*.45;K[p]=3}/* 浅瀬：水の底の砂がすける */
      if(kw===2){r=WB0[0];g=WB0[1];b=WB0[2];K[p]=2}}}
    else if(kw>10&&(kg===1||kg===2)){const c=WBAND[kw-10],a=WBANDA[kw-10]/255;r=r+(c[0]-r)*a;g=g+(c[1]-g)*a;b=b+(c[2]-b)*a}/* 草地の岸：水からの帯 */
    const ua=U?U[si+3]:0;if(ua){const a=ua/255;r=r+(U[si]-r)*a;g=g+(U[si+1]-g)*a;b=b+(U[si+2]-b)*a}
    O[o]=r;O[o+1]=g;O[o+2]=b;O[o+3]=255}}
  for(let v=IGM;v<ht;v++)for(let u=0;u<w;u++){const p=v*w+u;if(K[p]!==1&&K[p]!==2&&K[p]!==3)continue;let k=0;for(let q2=1;q2<=WBANK+WBSH;q2++){const kk=K[p-q2*w];if(!kk&&O[(p-q2*w)*4+3]){k=q2;break}if(kk===4)break}if(!k)continue;/* 水は岸より一段ひくい：画面で水のすぐ上が陸なら、岸の断面 */
    const o=p*4;if(k<=WBANK){const c=WBANKC[k-1];O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2]}else{const a=WBSHA[k-WBANK-1]/255;O[o]=O[o]+(24-O[o])*a;O[o+1]=O[o+1]+(52-O[o+1])*a;O[o+2]=O[o+2]+(70-O[o+2])*a}K[p]=5}
  if(SM)for(let v=IGM;v<ht;v++)for(let u=0;u<w;u++){const p=v*w+u;if(K[p]!==4)continue;let k=0;for(let q2=1;q2<=IGSKYH;q2++){const kk=K[p-q2*w];if(!kk&&O[(p-q2*w)*4+3]){k=q2;break}if(kk&&kk!==4&&kk!==5)break}if(!k)continue;/* 雲の海：画面で、すぐ上が島の陸なら、島のがけ（上から：土のかげ・岩・岩のかげ・うら。いままでの SKYFACE） */
    const c=SKYFACE[k<=3?0:k<=IGSKYH-6?1:k<=IGSKYH-3?2:3],o=p*4;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2];K[p]=5}
  /* できた絵（上の行 IGM はのぞく）を、色のある所だけに切りつめる */
  let ax=w,ay=ht,bx=-1,by=-1,wa=w,wb=ht,wc=-1,wd=-1,ka=w,kb=ht,kc=-1,kd=-1;for(let v=IGM;v<ht;v++)for(let u=0;u<w;u++){const p=v*w+u;if(!O[p*4+3])continue;if(u<ax)ax=u;if(u>bx)bx=u;if(v<ay)ay=v;if(v>by)by=v;if(K[p]===1){if(u<wa)wa=u;if(u>wc)wc=u;if(v<wb)wb=v;if(v>wd)wd=v}if(K[p]===4){if(u<ka)ka=u;if(u>kc)kc=u;if(v<kb)kb=v;if(v>kd)kd=v}}
  if(bx<0){igFree(q);q.e=true;IG.n++;return}
  const put=(x0,y0,x1,y1,fn)=>{const cw=x1-x0+1,ch=y1-y0+1,c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d'),id=g.createImageData(cw,ch);for(let v=0;v<ch;v++)for(let u=0;u<cw;u++){const p=(y0+v)*w+x0+u;fn(id.data,(v*cw+u)*4,p)}g.putImageData(id,0,0);return c};
  igFree(q);q.e=false;{const cw=bx-ax+1,ch=by-ay+1,c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d'),id=g.createImageData(cw,ch);for(let v=0;v<ch;v++){const p=((ay+v)*w+ax)*4;id.data.set(O.subarray(p,p+cw*4),v*cw*4)}g.putImageData(id,0,0);q.f=c}/* 地面の絵：行ごとにまとめてうつす */q.ox=ax-IGP;q.oy=ay-IGM-IGP;
  if(wc>=0){q.w=put(wa,wb,wc,wd,(d,i,p)=>{d[i+3]=K[p]===1?255:0});q.wx=wa-IGP;q.wy=wb-IGM-IGP}/* 水面の形（毎コマ、水の模様を流す所） */
  if(kc>=0){q.k=put(ka,kb,kc,kd,(d,i,p)=>{d[i+3]=K[p]===4?255:0});q.kx=ka-IGP;q.ky=kb-IGM-IGP}/* 雲の海の形（時間の色を、地面とかえる所。daycolor.js の dcGround） */
  q.v=++IG.n;GRD.bt+=performance.now()-t0}
/* アトラスのページがとどいた：読みこみ中の絵で作った区画に、作りなおすしるし */
function igPendDone(){for(const q of IG.c.values())if(q.pend)q.st=true}
/* 区画の左上（ゲームの点） */const igX=q=>IGX0+q.cx*IGW,igY=q=>q.cy*IGH;
/* 物を置いて変わったマスの四角 R（[x0,y0,x1,y1] の一覧）にかかる区画に、作りなおすしるし */
function igDirty(R){if(IG.s!==S)return;for(const r of R){const a=Math.max(0,r[0]-2),b=Math.max(0,r[1]-2),c=Math.min(W,r[2]+3),d=Math.min(H,r[3]+3),xs=[isoX(a*TS,d*TS),isoX(c*TS,b*TS)],ys=[isoY(a*TS,b*TS)-IGM,isoY(c*TS,d*TS)];
  for(let cy=Math.max(0,Math.floor((ys[0]-IGP)/IGH));cy<=Math.min(IGNY-1,Math.floor((ys[1]+IGP+IGM)/IGH));cy++)for(let cx=Math.max(0,Math.floor((xs[0]-IGP-IGX0)/IGW));cx<=Math.min(IGNX-1,Math.floor((xs[1]+IGP-IGX0)/IGW));cx++){const q=IG.c.get(cy*64+cx);if(q)q.st=true}}}
/* ステージを開くときに作る仕事の一覧 */
function igJobs(L){L.push(()=>{if(IG.s!==S)igClear()});for(let cy=0;cy<IGNY;cy++)for(let cx=0;cx<IGNX;cx++)L.push(()=>{if(!igNear(cx,cy,IGRING))return;const q=igq(cx,cy);if(igOK()&&(!q.f&&!q.e||q.st))igBuild(q)})}/* 作るのは、画面のまわりの区画だけ */
/* 区画は、画面に見えている所と、そのまわり IGRING 区画だけ作っておく。見えなくなって IGFREE コマたち、まわり IGRING 区画より外になった区画は手ばなす（とおい所は、近づいたときに作りなおす） */
const IGRING=1,IGFREE=300;
function igNear(cx,cy,m){const[c0,r0,c1,r1]=igVis();return cx>=c0-m&&cx<=c1+m&&cy>=r0-m&&cy<=r1+m}
function igFar(){if(RFN%60)return;const[c0,r0,c1,r1]=igVis(),m=IGRING;for(const q of IG.c.values()){if(RFN-q.u<IGFREE||q.cx>=c0-m&&q.cx<=c1+m&&q.cy>=r0-m&&q.cy<=r1+m)continue;if(q.f||q.w||q.k||q.l){igFree(q);q.e=false}}}
/* 画面に見えている区画 */
function igVis(){const P=[s2w(0,0),s2w(VW,0),s2w(0,VH),s2w(VW,VH)].map(p=>[isoX(p.x,p.y),isoY(p.x,p.y)]),xa=Math.min(...P.map(p=>p[0])),xb=Math.max(...P.map(p=>p[0])),ya=Math.min(...P.map(p=>p[1])),yb=Math.max(...P.map(p=>p[1]))+HMAX*IQL;/* 高い段は、下の区画の地面を上に描く */
  return[Math.max(0,Math.floor((xa-IGX0)/IGW)),Math.max(0,Math.floor(ya/IGH)),Math.min(IGNX-1,Math.floor((xb-IGX0)/IGW)),Math.min(IGNY-1,Math.floor(yb/IGH))]}
/* 地面を描く（k：画面のドットの倍率）。区画は、画面のドットのさかいに合わせ、のりしろごと描いて、となりとかさねる */
function igDraw(k,now){if(IG.s!==S)igClear();if(!igOK())return;const O=isoOff(k),[c0,r0,c1,r1]=igVis(),lod=k<1.2,fresh=!IG.c.size;let built=0;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const q=igq(cx,cy);if((!q.f&&!q.e||q.st)&&(fresh||!built||GRD.bt<GBUD)){igBuild(q);built++}q.u=RFN;if(!q.f)continue;
    let im=q.f;if(lod){if(!q.l&&GRD.bt<GBUD){const t0=performance.now(),l=document.createElement('canvas');l.width=Math.ceil(q.f.width/2);l.height=Math.ceil(q.f.height/2);const g=l.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(q.f,0,0,l.width,l.height);q.l=l;GRD.bt+=performance.now()-t0}if(q.l)im=q.l}
    const x=igX(q)+q.ox,y=igY(q)+q.oy,a=Math.round(O[0]+k*x),b=Math.round(O[1]+k*y);ctx.drawImage(im,a,b,Math.round(O[0]+k*(x+q.f.width))-a,Math.round(O[1]+k*(y+q.f.height))-b)}
  for(let cy=Math.max(0,r0-IGRING);cy<=Math.min(IGNY-1,r1+IGRING)&&GRD.bt<GBUD;cy++)for(let cx=Math.max(0,c0-IGRING);cx<=Math.min(IGNX-1,c1+IGRING)&&GRD.bt<GBUD;cx++){if(cx>=c0&&cx<=c1&&cy>=r0&&cy<=r1)continue;const q=igq(cx,cy);if(!q.f&&!q.e||q.st)igBuild(q)}/* 時間があまったら、まわりの区画も作っておく（動かしたとき、まだない区画が見えないように） */
  igFar();igShimmer(k,O,c0,r0,c1,r1,now);ctx.restore()}
/* 見えている区画の雲の海の形を、画面（ドット）に描く（c：画面と同じ大きさの絵） */
function igSkyMask(c,k){if(!igOK())return false;const O=isoOff(k),[c0,r0,c1,r1]=igVis();let any=false;
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const q=IG.c.get(cy*64+cx);if(!q||!q.k)continue;const x=igX(q)+q.kx,y=igY(q)+q.ky,a=Math.round(O[0]+k*x),b=Math.round(O[1]+k*y);c.drawImage(q.k,a,b,Math.round(O[0]+k*(x+q.k.width))-a,Math.round(O[1]+k*(y+q.k.height))-b);any=true}return any}
/* ちぢめていないあいだ、半分の絵を手ばなす */
function igHalfFree(){if(GLOD){IG.lu=RFN;return}if(RFN-(IG.lu||0)<GHALFT)return;for(const q of IG.c.values()){if(q.l){q.l.width=q.l.height=0;q.l=null}if(q.ws){q.ws.width=q.ws.height=0;q.ws=null;q.wk=null}}igTileFree();IG.lu=RFN}
/* 水の模様（tex:water）を、ひし形へ写した絵（256×192 でくりかえす） */
function igWaterPat(){if(IG.pt)return IG.pt;const im=chipImgs(window.CHIPS['tex:water'],'water')[0],T=igPix(im),w=2*T.w*IQA,h=2*T.h*IQB,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),id=g.createImageData(w,h);
  for(let v=0;v<h;v++)for(let u=0;u<w;u++){const wx=Math.floor(((u+.5)/IQA+(v+.5)/IQB)/2),wy=Math.floor(((v+.5)/IQB-(u+.5)/IQA)/2),ti=((((wy%T.h)+T.h)%T.h)*T.w+(((wx%T.w)+T.w)%T.w))*4,o=(v*w+u)*4;id.data[o]=T.d[ti];id.data[o+1]=T.d[ti+1];id.data[o+2]=T.d[ti+2];id.data[o+3]=255}
  g.putImageData(id,0,0);return IG.pt={c,w,h}}
/* 水面：水の模様を、1秒に よこ4・たて2ドット（せかいの向き）流す */
function igShimmer(k,O,c0,r0,c1,r1,now){const P=igWaterPat(),t=now/1000,sx=Math.floor(t*4)%128,sy=Math.floor(t*2)%128,dx=Math.round((sx-sy)*IQA),dy=Math.round((sx+sy)*IQB),dc=dcLayer('w'),lod=k<1.2,key=dx+','+dy+','+dc;
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const q=IG.c.get(cy*64+cx);if(!q||!q.w)continue;
    if(lod&&q.ws&&q.wk===key){const x=igX(q)+q.wx,y=igY(q)+q.wy,a=Math.round(O[0]+k*x),b=Math.round(O[1]+k*y);ctx.drawImage(q.ws,a,b,Math.round(O[0]+k*(x+q.w.width))-a,Math.round(O[1]+k*(y+q.w.height))-b);continue}/* ちぢめたときは、流れが1ドットうごくまで、作った絵を使いまわす（IGWLOD） */
    const T=lod?(q.ws||(q.ws=document.createElement('canvas'))):IG.tmp||(IG.tmp=document.createElement('canvas'));if(lod){if(T.width!==q.w.width||T.height!==q.w.height){T.width=q.w.width;T.height=q.w.height}q.wk=key}else if(T.width<q.w.width||T.height<q.w.height){T.width=Math.max(T.width,q.w.width);T.height=Math.max(T.height,q.w.height)}
    const g=T.getContext('2d'),x=igX(q)+q.wx,y=igY(q)+q.wy,ww=q.w.width,hh=q.w.height;g.globalCompositeOperation='copy';g.drawImage(q.w,0,0);g.globalCompositeOperation='source-in';
    const ox=((x-dx)%P.w+P.w)%P.w,oy=((y-dy)%P.h+P.h)%P.h;for(let b=-oy;b<hh;b+=P.h)for(let a=-ox;a<ww;a+=P.w)g.drawImage(P.c,a,b);
    if(dc){g.globalCompositeOperation='multiply';g.fillStyle=dc;g.fillRect(0,0,ww,hh);g.globalCompositeOperation='destination-in';g.drawImage(q.w,0,0)}/* 夜の水の色（daycolor.js） */
    g.globalCompositeOperation='source-over';const a=Math.round(O[0]+k*x),b=Math.round(O[1]+k*y);ctx.drawImage(T,0,0,ww,hh,a,b,Math.round(O[0]+k*(x+ww))-a,Math.round(O[1]+k*(y+hh))-b)}}
/* 1マスの地面を、画面の (ix,iy)（そのマスのひし形の上のかど、ゲームの点）に描く（高い段の上の面）。c は画面の向き（ゲームの点）で描く */
const IGTZ=.6;/* これより ちぢめたときは、高い段の上の面を、半分の細かさの絵にしてとっておく（IG.tc。1マス 32×24、ちぢめるのをやめたら手ばなす） */
function igTile(c,x,y,ix,iy){if(cam.z<IGTZ&&c===ctx){const T=igTileLod(x,y);if(T){c.drawImage(T,ix-IQW/2-1,iy-1,IQW+2,IQH+2);return}}igTile0(c,x,y,ix,iy)}
/* マス (x,y) の地面がかかる区画の、作りなおした回数（かわったら、とっておいた絵を作りなおす）。区画がまだなければ null */
function igTileVer(x,y){const sx=(x-y)*IQW/2,sy=(x+y)*IQH/2;let v='';for(let cy=Math.max(0,Math.floor((sy-IGP)/IGH));cy<=Math.min(IGNY-1,Math.floor((sy+IQH)/IGH));cy++)for(let cx=Math.max(0,Math.floor((sx-IQW/2-IGX0)/IGW));cx<=Math.min(IGNX-1,Math.floor((sx+IQW/2-IGX0)/IGW));cx++){const q=IG.c.get(cy*64+cx);if(!q||!q.f)return null;v+=q.v+','}return v}
function igTileLod(x,y){const j=y*W+x,v=igTileVer(x,y);if(v==null)return null;
  const M=IG.tc||(IG.tc=new Map());let e=M.get(j);if(e&&e.v===v)return e.c;if(!e){e={c:document.createElement('canvas'),v:''};e.c.width=IQW/2+1;e.c.height=IQH/2+1;M.set(j,e)}
  const g=e.c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,e.c.width,e.c.height);g.imageSmoothingEnabled=true;g.setTransform(.5,0,0,.5,0,0);igTile0(g,x,y,IQW/2+1,1,1);e.v=v;return e.c}/* まわり1ドット大きく切って、となりの面とのすきまを出さない */
function igTile0(c,x,y,ix,iy,pad){const sx=(x-y)*IQW/2,sy=(x+y)*IQH/2,p=pad||0;c.save();c.beginPath();c.moveTo(ix,iy-p);c.lineTo(ix+IQW/2+p,iy+IQH/2);c.lineTo(ix,iy+IQH+p);c.lineTo(ix-IQW/2-p,iy+IQH/2);c.closePath();c.clip();
  for(let cy=Math.max(0,Math.floor((sy-IGP)/IGH));cy<=Math.min(IGNY-1,Math.floor((sy+IQH)/IGH));cy++)for(let cx=Math.max(0,Math.floor((sx-IQW/2-IGX0)/IGW));cx<=Math.min(IGNX-1,Math.floor((sx+IQW/2-IGX0)/IGW));cx++){const q=IG.c.get(cy*64+cx);if(!q||!q.f)continue;{const gx=igX(q)+q.ox,gy=igY(q)+q.oy,u0=Math.max(0,Math.floor(sx-IQW/2-gx)),v0=Math.max(0,Math.floor(sy-gy)),u1=Math.min(q.f.width,Math.ceil(sx+IQW/2-gx)),v1=Math.min(q.f.height,Math.ceil(sy+IQH-gy));if(u1>u0&&v1>v0)c.drawImage(q.f,u0,v0,u1-u0,v1-v0,ix-sx+gx+u0,iy-sy+gy+v0,u1-u0,v1-v0)}}/* そのマスにかかる所だけ写す（区画ぜんぶを切りとって描くと、ちぢめた画面で重い） */
  c.restore()}
