'use strict';
/* ---------- クォータービューの段差（ブロック・坂・階段・ハシゴ） ----------
   ふつうのアイソメトリックの作り方：高い段のマスは、上の面を段の高さだけ上に描き、手前のとなり（左下 y+1・右下 x+1）が
   低い所だけ、1だんずつ壁のタイル（左の面・右の面）をならべる。描く順は x+y（D）。
   壁のタイルは、まうえから見た四角の絵（cliff:block・cliff:blockm・石のブロック cubeTex）を、ドットのまん中の点で面へ写して作り、
   とっておく（1マスの1だんぶん：はば 32・高さ 54 のひし形の半分のはば）。左の面は少し明るく、右の面はこい。
   坂・階段・ハシゴは、3Dの点を画面へ写した形をぬり、ふちをぼかさずに切る（ドットにそろえる）。形ごとに1回作ってとっておく。 */
const ICK=new Map();/* 作った絵（key → canvas） */
const ICLF=.94,ICRT=.74;/* 左の面・右の面の明るさ */
function icClear(){for(const c of ICK.values())c.width=c.height=0;ICK.clear()}
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
/* 高い段のマス (x,y)（c は画面の向き、ゲームの点で描く） */
function icBlock(c,x,y){const j=y*W+x,h=hiAt(j);if(h<=0)return;const hv=(a,b)=>a<0||b<0||a>=W||b>=H?0:Math.max(0,hiAt(b*W+a)),ix=(x-y)*IQW/2,iy=(x+y)*IQH/2,top=cubeAt(j,h),gr=!top&&REV.has(j)?1+(hash(j)<.5?1:0):0;
  for(const side of[0,1]){const n=side?hv(x+1,y):hv(x,y+1);for(let L=h;L>n;L--){const s=icSrc(j,L,h);if(!s)continue;const f=icFace(side,s[0],s[1],L===h?gr:0);c.drawImage(f,side?ix:ix-IQW/2,iy+IQH/2-L*IQL)}}
  if(top){const t=cubeTex(top);if(t)c.drawImage(icTop(t,top),ix-IQW/2,iy-h*IQL)}else igTile(c,x,y,ix,iy-h*IQL);
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
