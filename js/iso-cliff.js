'use strict';
/* ---------- クォータービューの段差（ブロック・坂・階段・ハシゴ） ----------
   ふつうのアイソメトリックの作り方：高い段のマスは、上の面を段の高さだけ上に描き、手前のとなり（左下 y+1・右下 x+1）が
   低い所だけ、1だんずつ壁のタイル（左の面・右の面）をならべる。描く順は x+y（D）。
   土のだんは、3Dで写した角の形ごとのチップ（icBlkKey）。石のブロックの壁のタイルは、まうえから見た四角の絵（cubeTex）を、ドットのまん中の点で面へ写して作り、
   とっておく（1マスの1だんぶん：はば 32・高さ 54 のひし形の半分のはば）。左の面は少し明るく、右の面はこい。
   坂・階段・ハシゴは、3Dの点を画面へ写した形をぬり、ふちをぼかさずに切る（ドットにそろえる）。形ごとに1回作ってとっておく。 */
/* 段差のマスを描く順（draw-world.js の dd）：高い段のマスは、うしろのマスの物・せいれいより後、そのマスの上の物より先（ふつうのアイソメトリックの順）。
   入隅の丸いかべだけをかさねるひくいマスは、そのマスの物より先 */
function icBlkDD(j){const x=j%W,y=(j/W)|0;return hiAt(j)>0?x+y+1:x+y-.99}
const ICK=new Map();/* 作った絵（key → canvas） */
const ICLF=.94,ICRT=.74;/* 左の面・右の面の明るさ */
/* 3Dの点（せかいの点 wx,wy、高さ z だん）→ 画面の点（ゲームの点） */
const icP=(wx,wy,z)=>[(wx-wy)*IQA,(wx+wy)*IQB-z*IQL];
/* 壁のタイル：side 0 左の面（y+1 がわ）・1 右の面（x+1 がわ）。src は 64×64 の絵、g は上の行に草のたれ（0：なし・1〜2：ばらつき） */
function icFace(side,src,key,g){const K='f'+side+key+'|'+g;let c=ICK.get(K);if(c)return c;const S0=igPix(src),w=IQW/2,h=IQH/2+IQL;c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),id=x.createImageData(w,h),d=id.data,k=side?ICRT:ICLF;
  for(let v=0;v<h;v++)for(let u=0;u<w;u++){const t=(u+.5)/w,top=side?IQH/2*(1-t):IQH/2*t,vv=v+.5-top;if(vv<0||vv>=IQL)continue;const tx=Math.min(63,(t*64)|0),ty=Math.min(63,(vv/IQL*64)|0),si=(ty*S0.w+tx)*4,o=(v*w+u)*4;
    let r=S0.d[si],gg=S0.d[si+1],b=S0.d[si+2];if(g&&vv<2+((hash(u*13+g*7)*3)|0)){r=112;gg=158;b=70}/* 上が草地：草が正面にたれる */
    d[o]=r*k;d[o+1]=gg*k;d[o+2]=b*k;d[o+3]=255}
  x.putImageData(id,0,0);ICK.set(K,c);return c}
/* 石のブロックの上の面（64×48 のひし形） */
function icTop(src,key){const K='t'+key;let c=ICK.get(K);if(c)return c;const S0=igPix(src);c=document.createElement('canvas');c.width=IQW;c.height=IQH;const x=c.getContext('2d'),id=x.createImageData(IQW,IQH),d=id.data;
  for(let v=0;v<IQH;v++)for(let u=0;u<IQW;u++){const ix=u-IQW/2+.5,iy=v+.5,wx=(ix/IQA+iy/IQB)/2,wy=(iy/IQB-ix/IQA)/2;if(wx<0||wy<0||wx>=TS||wy>=TS)continue;const si=(((wy*2)|0)*S0.w+((wx*2)|0))*4,o=(v*IQW+u)*4;d[o]=S0.d[si];d[o+1]=S0.d[si+1];d[o+2]=S0.d[si+2];d[o+3]=255}
  x.putImageData(id,0,0);ICK.set(K,c);return c}
/* そのだんの壁の絵（土は、上にブロックがつづくだんは帯のない絵） */
function icSrc(j,L,h){const id=cubeAt(j,L);if(id){const t=cubeTex(id);return t?[t,id]:null}const C=window.CHIPS||{},k=L<h?'cliff:blockm':'cliff:block',ch=C[k],im=ch&&chipImgs(ch,'cliff')[0];return im&&im.ok?[im,k]:null}
/* 土のだんのチップ（tools/art/iso/iso_block.py：3Dで組んだまるい箱を、角の形ごとに写した絵。g64。ax・ay は、そのだんの下の面のまん中の点）
   なまえ：iso:blk-<だん>:<nsew>[-<南西><南東><北東>]。だん：g 草・d 草原のかれた地面・k ほかのステージの地面・v 火山の地面（いちばん上のだん）・m 上につづくだん。
   nsew：そのだんで、となりのマスが低い（外に出ている）向き。ななめ：内がわの角になるななめのマスがうまっている（道具の dgof と同じ）。 */
function icBlkKey(x,y,L,v,hv){const n=hv(x,y-1)<L,s=hv(x,y+1)<L,e=hv(x+1,y)<L,w=hv(x-1,y)<L,
  sw=hv(x-1,y+1)>=L&&s&&!w,se=hv(x+1,y+1)>=L&&(s&&!e||e&&!s),ne=hv(x+1,y-1)>=L&&e&&!n,b=a=>a?'1':'0';
  return 'iso:blk-'+v+':'+b(n)+b(s)+b(e)+b(w)+(sw||se||ne?'-'+b(sw)+b(se)+b(ne):'')}
/* 入隅（L字の内がわの角）：まわりの3マス（たて B・よこ C・ななめ A）がそのだんまであって、このマスだけひくい角に、まるいかべを1まいの絵でかさねる（iso_block.py の build_fillet・fillets_for と同じ）。
   なまえ：iso:blkf-<だん>:<角 nw|ne|sw|se>-<A><B><C>（そのマスがこのだんでいちばん上なら1）。B・C どちらも上にだんがつづくときは iso:blkf-m:<角>-000 */
const ICFOFF=[['nw',0,-1,-1,0,-1,-1],['ne',0,-1,1,0,1,-1],['sw',0,1,-1,0,-1,1],['se',0,1,1,0,1,1]];
function icFils(x,y,h,hv){const L=[];for(const[c,bx,by,cx,cy,ax,ay]of ICFOFF){const B=hv(x+bx,y+by),C=hv(x+cx,y+cy),A=hv(x+ax,y+ay),top=Math.min(A,B,C);
  for(let l=Math.max(1,h+1);l<=top;l++){const jB=(y+by)*W+x+bx,jC=(y+cy)*W+x+cx,jA=(y+ay)*W+x+ax;if(cubeAt(jB,l)||cubeAt(jC,l)||cubeAt(jA,l))continue;/* 石のブロックの所は、まるめない */
    const tA=A===l,tB=B===l,tC=C===l,j0=tB?jB:jC,v=REV.has(j0)?'g':WD===KUSA?'d':WD===KAZAN?'v':'k';
    L.push([tB||tC?'iso:blkf-'+v+':'+c+'-'+(tA?1:0)+(tB?1:0)+(tC?1:0):'iso:blkf-m:'+c+'-000',l])}}return L}
function icHasFil(x,y){const hv=(a,b)=>a<0||b<0||a>=W||b>=H?0:Math.max(0,hiAt(b*W+a)),h=hv(x,y);for(const[,bx,by,cx,cy,ax,ay]of ICFOFF)if(Math.min(hv(x+bx,y+by),hv(x+cx,y+cy),hv(x+ax,y+ay))>h)return true;return false}
function icFilDraw(c,x,y,h,hv){const ix=(x-y)*IQW/2,iy=(x+y)*IQH/2;for(const[k,l]of icFils(x,y,h,hv)){const t=icBlkImg(k);if(!t)continue;const[ch,im]=t;c.drawImage(im,ix-ch.ax/2,iy+IQH/2-(l-1)*IQL-ch.ay/2,ch.w/2,ch.h/2)}}
function icBlkImg(k){const ch=window.CHIPS&&CHIPS[k];if(!ch)return null;const im=chipImgs(ch,k)[0];return im&&im.ok?[ch,im]:null}
/* 上の面：その所の地面（igTile0）を、3Dで写した上の面のかたち（<なまえ>~top）で切った絵を、マスごとにとっておく（ICT。地面の区画がかわったら作りなおす。igTileVer）。
   毎コマ描くのは、とっておいた絵と、上の面のかたちの色の絵（時間の色・高いだんほど明るく。かたちと色ごとに1まい）だけ */
const ICT={s:null,c:new Map(),m:new Map(),f:-1};
function icCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function icMask(k,ch,im,col){/* 上の面のかたちを、色 col でぬった絵 */const K=k+'|'+col;let c=ICT.m.get(K);if(c)return c;if(col!=='#fff8e0'&&ICT.mc!==col){for(const[q,e]of ICT.m)if(!q.endsWith('|#fff8e0')){e.width=e.height=0;ICT.m.delete(q)}ICT.mc=col}/* 時間の色がかわったら、前の色の絵は手ばなす（かたちごとに、いまの色と明るさの2まいだけ） */
  c=icCanvas(ch.w,ch.h);const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle=col;g.fillRect(0,0,ch.w,ch.h);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);
  /* かたちは、となりのマスへ少しはみ出す（すきまを出さないため）。色の絵は、そのマスのひし形の中だけにする（となりとかさなると、さかいめだけ2回ぬられて、明るい筋・暗い筋になる）。
     ひし形は、片がわだけをふくむ（となりのマスと1ドットもかさならず、すきまもない） */
  const id=g.getImageData(0,0,ch.w,ch.h),d=id.data,cx=ch.ax,cy=ch.ay-2*IQL;
  for(let v=0;v<ch.h;v++)for(let u=0;u<ch.w;u++){const dx=(u+.5-cx)/IQW,dy=(v+.5-cy)/IQH,a=dx+dy,b=dy-dx;if(a<-1||a>=1||b<-1||b>=1)d[(v*ch.w+u)*4+3]=0}
  g.putImageData(id,0,0);ICT.m.set(K,c);return c}
function icTopImg(x,y,h,k,ch,im){/* マス (x,y) の上の面の地面を、かたちで切った絵。拡大0.6より小さいときは、ゲームの点と同じ細かさ（4分の1の大きさ）、それより大きいときは2倍の細かさ */const j=y*W+x,v=igTileVer(x,y);if(v==null)return null;
  if(ICT.s!==S){for(const e of ICT.c.values())e.c.width=e.c.height=0;ICT.c.clear();ICT.s=S}
  if(ICT.f!==RFN){ICT.f=RFN;if(RFN%30===0)for(const[q,f]of ICT.c)if(RFN-f.t>60){f.c.width=f.c.height=0;ICT.c.delete(q)}}/* 60コマ描いていないマスは手ばなす（画面に見えているマスだけのこす） */
  const r=cam.z<IGTZ?1:2,w=ch.w*r/2,hh=ch.h*r/2;let e=ICT.c.get(j);if(e&&e.v===v&&e.k===k&&e.h===h&&e.r===r){e.t=RFN;return e.c}
  if(!e){e={c:icCanvas(w,hh)};ICT.c.set(j,e)}else if(e.c.width!==w||e.c.height!==hh){e.c.width=w;e.c.height=hh}
  const X0=(x-y)*IQW/2-ch.ax/2,Y0=(x+y)*IQH/2+IQH/2-(h-1)*IQL-ch.ay/2,g=e.c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,hh);g.imageSmoothingEnabled=false;g.setTransform(r,0,0,r,-r*X0,-r*Y0);
  igTile0(g,x,y,(x-y)*IQW/2,(x+y)*IQH/2-h*IQL,2);/* ひし形より2点ひろく写す（ぴったりで切ると、ふちがうすくなり、さかいめに筋が出る。かたちの絵で切る） */g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0,w,hh);g.globalCompositeOperation='source-over';
  e.v=v;e.k=k;e.h=h;e.r=r;e.t=RFN;return e.c}
function icBlkTop(c,x,y,h,ix,iy,k){const t=icBlkImg(k+'~top');if(!t)return false;const[ch,im]=t,G=icTopImg(x,y,h,k,ch,im);if(!G)return false;const m=c===ctx&&dcLayer('g'),X0=ix-ch.ax/2,Y0=iy+IQH/2-(h-1)*IQL-ch.ay/2,w=ch.w/2,hh=ch.h/2;
  c.drawImage(G,X0,Y0,w,hh);c.save();
  if(m){c.globalCompositeOperation='multiply';c.drawImage(icMask(k,ch,im,m),X0,Y0,w,hh)}/* 時間の色（daycolor.js の dcTop と同じ） */
  c.globalCompositeOperation='source-over';c.globalAlpha=Math.min(.24,.06*h);c.drawImage(icMask(k,ch,im,'#fff8e0'),X0,Y0,w,hh);c.restore();/* 上の面は、高いだんほど明るく */
  return true}
/* 高い段のマス (x,y)（c は画面の向き、ゲームの点で描く）。土のだんは、下のだんから、角の形ごとのチップをならべる。石のブロックのだんは、面の絵を写したタイル */
function icBlock(c,x,y){const j=y*W+x,h=Math.max(0,hiAt(j)),hv=(a,b)=>a<0||b<0||a>=W||b>=H?0:Math.max(0,hiAt(b*W+a));if(h>0)icBlock0(c,x,y,j,h,hv);icFilDraw(c,x,y,h,hv)}/* 入隅は、このマスの列を描いたあと */
function icBlock0(c,x,y,j,h,hv){const ix=(x-y)*IQW/2,iy=(x+y)*IQH/2,top=cubeAt(j,h),
    gv=REV.has(j)?'g':WD===KUSA?'d':WD===KAZAN?'v':'k',gr=!top&&REV.has(j)?1+(hash(j)<.5?1:0):0;let soilTop=null;
  for(let L=1;L<=h;L++){
    if(!cubeAt(j,L)){const v=L===h?gv:'m',k=icBlkKey(x,y,L,v,hv),t=icBlkImg(k);if(t){const[ch,im]=t;c.drawImage(im,ix-ch.ax/2,iy+IQH/2-(L-1)*IQL-ch.ay/2,ch.w/2,ch.h/2);if(L===h)soilTop=k;continue}if(L===h)icBlkImg(k+'~top')}/* 上の面の絵のページも、いっしょに読みはじめる（段の絵がとどくのを待つと、読みこみのさいごに、ぜんぶのマスの上の面を作りなおすことになる） */
    for(const side of[0,1]){const n=side?hv(x+1,y):hv(x,y+1);if(L<=n)continue;const s=icSrc(j,L,h);if(!s)continue;const f=icFace(side,s[0],s[1],L===h?gr:0);c.drawImage(f,side?ix:ix-IQW/2,iy+IQH/2-L*IQL)}}/* チップがまだないときも、前の面の絵 */
  if(soilTop&&icBlkTop(c,x,y,h,ix,iy,soilTop))return;
  if(top){const t=cubeTex(top);if(t)c.drawImage(icTop(t,top),ix-IQW/2,iy-h*IQL)}else igTile(c,x,y,ix,iy-h*IQL);dcTop(c,ix,iy-h*IQL);/* 時間の色（daycolor.js） */
  c.save();c.globalAlpha=Math.min(.24,.06*h);c.fillStyle='#fff8e0';c.beginPath();c.moveTo(ix,iy-h*IQL);c.lineTo(ix+IQW/2,iy+IQH/2-h*IQL);c.lineTo(ix,iy+IQH-h*IQL);c.lineTo(ix-IQW/2,iy+IQH/2-h*IQL);c.closePath();c.fill();c.restore()}/* 上の面は、高いだんほど明るく */
/* 形の絵：3Dの多角形（[[wx,wy,z],…] と色）を、ゲームの点の画面へぬり、ふちのうすい所を切る（ドットにそろえる） */
function icShape(K,polys){let c=ICK.get(K);if(c)return c;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[P]of polys)for(const p of P){const q=icP(...p);x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])}
  x0=Math.floor(x0)-1;y0=Math.floor(y0)-1;c=document.createElement('canvas');c.width=Math.ceil(x1)-x0+2;c.height=Math.ceil(y1)-y0+2;const g=c.getContext('2d');
  for(const[P,col]of polys){g.fillStyle=col;g.beginPath();P.forEach((p,i)=>{const q=icP(...p);i?g.lineTo(q[0]-x0,q[1]-y0):g.moveTo(q[0]-x0,q[1]-y0)});g.closePath();g.fill()}
  const id=g.getImageData(0,0,c.width,c.height),d=id.data;for(let i=3;i<d.length;i+=4)d[i]=d[i]>110?255:0;g.putImageData(id,0,0);c.ox=x0;c.oy=y0;ICK.set(K,c);return c}
/* 箱（せかいの四角 [ax,ay]〜[bx,by]、高さ z0〜z1）：見える面（上・左 y+1・右 x+1） */
function icBoxP(ax,ay,bx,by,z0,z1,P,L){L.push([[[ax,by,z0],[bx,by,z0],[bx,by,z1],[ax,by,z1]],P[1]],[[[bx,ay,z0],[bx,by,z0],[bx,by,z1],[bx,ay,z1]],P[2]],[[[ax,ay,z1],[bx,ay,z1],[bx,by,z1],[ax,by,z1]],P[0]])}
/* 階段・坂：本体 a（のぼった先のうしろが高いマス）。せかいの点で、低いはしから高いはしへ */
function icStairPolys(id,d,n){const P=STPAL[id]||STPAL.slope_earth,[dx,dy]=SDIR[d],L=[];/* 本体のマスの左上を原点に、下りる向き (dx,dy) へ n マス */
  const rect=(s0,s1)=>{/* 高いはしから s0〜s1（0〜n マス）の所の四角 */const lo=v=>v*TS;let ax,ay,bx,by;if(dx===0){ax=0;bx=TS;if(dy>0){ay=lo(s0);by=lo(s1)}else{ay=TS-lo(s1);by=TS-lo(s0)}}else{ay=0;by=TS;if(dx>0){ax=lo(s0);bx=lo(s1)}else{ax=TS-lo(s1);bx=TS-lo(s0)}}return[ax,ay,bx,by]};
  const dist=(u,v)=>dx>0?u:dx<0?TS-u:dy>0?v:TS-v,zz=(u,v)=>1-Math.max(0,Math.min(1,dist(u,v)/(n*TS)));/* 高いはしからのみち → 高さ（1だん〜0） */
  if(SLOPES.has(id)){/* 坂：ひとつづきの面 */const[ax,ay,bx,by]=rect(0,n),C=[[ax,ay],[bx,ay],[bx,by],[ax,by]].map(([u,v])=>[u,v,zz(u,v)]);
    L.push([[[ax,by,0],[bx,by,0],C[2],C[3]],P[1]],[[[bx,ay,0],[bx,by,0],C[2],C[1]],P[2]],[C,P[0]]);return L}
  const ks=[...Array(SN).keys()];if(dx<0||dy<0)ks.reverse();/* うしろの段から（下りる向きが奥なら、低い段がうしろ） */
  for(const k of ks){const[ax,ay,bx,by]=rect(k*n/SN,(k+1)*n/SN);icBoxP(ax,ay,bx,by,0,1-k/SN,P,L)}/* 階段：高いはしから1だんずつ低く */
  return L}
/* 階段・坂をマス a に描く（c は画面の向き、ゲームの点） */
function icStair(c,a,id){const d=stairDir(a);if(d<0)return;const n=d===0?1:2,x=a%W,y=(a/W)|0,sh=icShape('s'+id+d+n,icStairPolys(id,d,n)),[px,py]=icP(x*TS,y*TS,Math.max(0,hiAt(a)));c.drawImage(sh,px+sh.ox,py+sh.oy)}
/* 階段・ハシゴの、描く順（x+y）：のぼった先がうしろならそのあと、手前ならその前 */
function icStairDD(a,o){const x=a%W,y=(a/W)|0;if(LADDERS.has(o))return x+y+.005;const d=stairDir(a);if(d<0)return x+y+.005;const n=d===0?1:2,[dx,dy]=SDIR[d];return x+y+Math.max(0,(n-1)*(dx+dy))+.005}
/* ハシゴ：低いマス a から、うしろ（d の向き）の高いマスの面に立てかける */
function icLadder(c,a,id){const d=ladderDir(a);if(d<0)return;const x=a%W,y=(a/W)|0,h=Math.max(0,hiAt(a)),col=id==='ladder_bamboo'?['#b9cf86','#93ad62']:['#c99a62','#9a7044'],L=[],r=1.6,
  /* 面の上の線：d0 うしろの面（y がはし）・d1 左のマス（x がはし）・d3 右のマス（x+1 がはし） */at=(t,z)=>d===0?[x*TS+t,y*TS+2,z]:d===1?[x*TS+2,y*TS+t,z]:[(x+1)*TS-2,y*TS+t,z];
  const bar=(t0,z0,t1,z1,w,cc)=>{const p0=at(t0,z0),p1=at(t1,z1);L.push([[[p0[0]-w,p0[1]+w,p0[2]],[p0[0]+w,p0[1]-w,p0[2]],[p1[0]+w,p1[1]-w,p1[2]],[p1[0]-w,p1[1]+w,p1[2]]],cc])};
  for(const t of[9,23])bar(t,0,t,1.12,r,col[1]);for(let k=1;k<=5;k++){const z=k/5.4;L.push([[[...at(9,z)],[...at(23,z)],[...at(23,z+.05)],[...at(9,z+.05)]],col[0]])}
  const K='l'+id+d,o=[x*TS,y*TS],sh=icShape(K,L.map(([P,cc])=>[P.map(([u,v,z])=>[u-o[0],v-o[1],z]),cc])),[px,py]=icP(x*TS,y*TS,h);c.drawImage(sh,px+sh.ox,py+sh.oy)}
/* 立てる形で描くとき：画面の向き（ゲームの点）にしてから f */
function icScreen(c,f){const k=dpr*cam.z,O=isoOff(k);c.save();c.setTransform(k,0,0,k,O[0],O[1]);c.imageSmoothingEnabled=false;try{f()}finally{c.restore()}}
