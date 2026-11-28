/* 3Dのせいれい：しゅるいごとに、体（トゥーン）・目とほっぺ（色だけ）・背面法の線を、まとめて描く（InstancedMesh）。
   形は tools/3d/bake-spirits.cjs が書いた assets/3d/sp-*.bin。姿勢は、2Dの絵と同じ骨の動き（tools/3d/bake-poses.py が焼いた assets/3d/pose-*.bin）を、
   骨の表（テクスチャ）にして、シェーダーで体をまげる（mats.js の SPVS）。コマのあいだは、骨の回転・場所をなめらかにつなぐ。
   手に持つ道具（props.py の形）は、道具ごとにまとめて描き、手の骨の列といっしょに動かす。 */
import * as THREE from 'three';
import {ELS,HULL,ISOPT,CLOTHSPAN,OBJSCALE,SPH,BLOB} from './look.js';
import {toon,hullMat} from './mats.js';
import {SPFILE,SPDATA} from './spirit-data.js';
import {POSEFILE,POSE} from './pose-data.js';

const TYPES={Float32Array,Int8Array,Uint8Array,Uint16Array,Uint32Array};
export const blobTex=(()=>{const N=64,d=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const r=Math.hypot(i+.5-N/2,j+.5-N/2)/(N/2),a=Math.max(0,1-r);const o=(j*N+i)*4;d[o]=d[o+1]=d[o+2]=0;d[o+3]=Math.round(255*a*a*(3-2*a))}
  const t=new THREE.DataTexture(d,N,N);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
export const blobMat=new THREE.MeshBasicMaterial({map:blobTex,color:0x2a2440,transparent:true,opacity:BLOB.k,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
export const blobGeo=(()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g})();
const SPB=.7*OBJSCALE*SPH;   /* 足もとの丸いかげの大きさ */
const PTW=2048;               /* 骨の表のよこの数（1つの列に2つの点：回転 q・場所 t） */
const NCH=POSE.nch,ROWS=POSE.rows,PROP0=NCH-2;   /* 列の数（さいごの2つは、手前の手・奥の手の道具）・コマの数（1つの属性） */
const SCREF=ELS.reduce((a,e)=>a+POSE.scale[e],0)/ELS.length;   /* 道具の形の大きさ（属性ごとのちがいは、インスタンスの倍で） */

/* いまの動きのコマ（表の行 a・b と、そのあいだの場所 t）。ph：動きの中の場所（0〜1）。1回だけの動き（'ph' の動き。遊具のゆれ play_… はくりかえす）は、さいごのコマで止める */
export function poseFr(mo,ph){const m=POSE.mo[mo]||POSE.mo.stand,n=m[1],one=m[2]==='ph'&&!/^play_/.test(mo),f=(((ph||0)%1)+1)%1*n,a=Math.min(n-1,Math.floor(f));let b=a+1,t=f-a;if(b>=n){if(one){b=a;t=0}else b=0}return[m[0]+a,m[0]+b,t]}

export class Spirits{
  constructor(scene){this.scene=scene;this.M={};this.cap={};this.blob=null;this.P={};this.pq=null}
  async load(cloth){
    const [buf,pbuf]=await Promise.all([SPFILE,POSEFILE].map(async f=>(await fetch(f)).arrayBuffer())),dotW=HULL.w/ISOPT;
    /* 表情の目の絵（属性・層ごとのならび）：1つのテクスチャ */
    const FC=POSE.face,fa=new Uint8Array(pbuf,FC.tex[0],FC.tex[1]).slice(),ftex=new THREE.DataTexture(fa,FC.cw*FC.xl.length,FC.ch*ELS.length,THREE.RGBAFormat);ftex.magFilter=ftex.minFilter=THREE.NearestFilter;ftex.needsUpdate=true;this.xl=FC.xl;
    /* 骨の表：属性・コマ・列ごとに、回転（Int16 ×32767）と場所（Int16 ×tq） */
    const Q=new Int16Array(pbuf,0,ELS.length*ROWS*NCH*7),N=ELS.length*ROWS*NCH,H=Math.ceil(N*2/PTW),T=new Float32Array(PTW*H*4);
    for(let i=0;i<N;i++){const o=i*7,d=i*8;for(let k=0;k<4;k++)T[d+k]=Q[o+k]/32767;for(let k=0;k<3;k++)T[d+4+k]=Q[o+4+k]/POSE.tq}
    this.hm=new Int16Array(pbuf,POSE.hm[0],POSE.hm[1]);/* 手のまん中（属性・コマ・手前/奥・xyz） */
    this.pq=T;const tex=new THREE.DataTexture(T,PTW,H,THREE.RGBAFormat,THREE.FloatType);tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.needsUpdate=true;
    const u={uPose:{value:tex},uNch:{value:NCH},key:'sp'};
    for(const el of ELS){const E=SPDATA.els[el],b2c=POSE.b2c;
      const wing=POSE.wing[el],fu=new THREE.Vector4(...FC.aff[el].u),fv=new THREE.Vector4(...FC.aff[el].v),ff=new THREE.Vector4(...FC.aff[el].f);
      const geo=part=>{const P=E[part],g=new THREE.BufferGeometry();for(const [a,d] of Object.entries(P)){const A=new TYPES[d.t](buf,d.o,d.n);
          if(a==='index')g.setIndex(new THREE.BufferAttribute(A,1));
          else if(a==='aSI'){const C=new Uint8Array(A.length);for(let i=0;i<A.length;i++)C[i]=b2c[A[i]];g.setAttribute('aSC',new THREE.BufferAttribute(C,4,false))}/* 骨の番号 → 列 */
          else g.setAttribute(a,new THREE.BufferAttribute(A,d.z,d.t!=='Float32Array'))}
        g.setAttribute('aWD',new THREE.BufferAttribute(wing?new Float32Array(pbuf,wing[0],wing[1]):new Float32Array(P.position.n),3));/* はねをたたんだ形へのずれ（風だけ） */
        g.computeBoundingSphere();return g};
      const face={ax0:FC.ax0,ay0:FC.ay0,cw:FC.cw,ch:FC.ch,u:{uFu:{value:fu},uFv:{value:fv},uFf:{value:ff},uFE:{value:ELS.indexOf(el)},uFA:{value:ftex}}};
      this.M[el]={body:geo('body'),mat:toon({vertexColors:true},{cloth:E.scale/CLOTHSPAN,spirit:u,face}),hull:hullMat({vertexColors:true},dotW,u)}}
    /* 道具の形（うでの座標・ドット → 3D）。裏がえしの手（mir）は、形を z で裏がえして、面の向きもかえる */
    const pm=toon({vertexColors:true}),ph=hullMat({vertexColors:true},dotW);
    POSE.plist.forEach((pn,pi)=>{const D=POSE.props[pn];for(const sl of [0,1]){const mir=POSE.mir[sl],g=new THREE.BufferGeometry();
      const P=new Float32Array(pbuf,D.position[0],D.position[1]).map((v,i)=>v*SCREF*(mir&&i%3===2?-1:1)),Nn=new Int8Array(pbuf,D.normal[0],D.normal[1]).map((v,i)=>mir&&i%3===2?-v:v);
      const I=new (D.index[2]==='uint32'?Uint32Array:Uint16Array)(pbuf,D.index[0],D.index[1]).slice();if(mir)for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t}
      g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(Nn,3,true));g.setAttribute('color',new THREE.BufferAttribute(new Uint8Array(pbuf,D.color[0],D.color[1]),3,true));g.setIndex(new THREE.BufferAttribute(I,1));
      this.P[pi+'|'+sl]={g,ims:[[g,pm],[g,ph]].map(([gg,mt],i)=>{const im=new THREE.InstancedMesh(gg,mt,4);im.frustumCulled=false;im.castShadow=false;im.receiveShadow=i===0;im.count=0;this.scene.add(im);return im}),n:0}}});
    this.cloth=cloth;
  }
  grow(el,n){const m=this.M[el];if((this.cap[el]||0)>=n)return;const c=Math.max(8,Math.ceil(n*1.5));this.cap[el]=c;
    if(m.ims)for(const im of m.ims){this.scene.remove(im);im.dispose()}
    m.fr=new THREE.InstancedBufferAttribute(new Float32Array(c*4),4);m.body.setAttribute('aFr',m.fr);m.ex=new THREE.InstancedBufferAttribute(new Float32Array(c*3),3);m.body.setAttribute('aEx',m.ex);
    m.ims=[[m.body,m.mat],[m.body,m.hull]].map(([g,mt],i)=>{const im=new THREE.InstancedMesh(g,mt,c);im.frustumCulled=false;im.castShadow=false;im.receiveShadow=i!==1;im.count=0;this.scene.add(im);return im})}
  /* 道具の列の、行 a・b のあいだの姿勢（回転 Qo・場所 Vo） */
  pch(ei,fr,c,Qo,Vo){const T=this.pq,ga=((ei*ROWS+fr[0])*NCH+c)*8,gb=((ei*ROWS+fr[1])*NCH+c)*8,t=fr[2];let s=T[ga]*T[gb]+T[ga+1]*T[gb+1]+T[ga+2]*T[gb+2]+T[ga+3]*T[gb+3]<0?-1:1;
    Qo.set(T[ga]+(s*T[gb]-T[ga])*t,T[ga+1]+(s*T[gb+1]-T[ga+1])*t,T[ga+2]+(s*T[gb+2]-T[ga+2])*t,T[ga+3]+(s*T[gb+3]-T[ga+3])*t).normalize();Vo.set(T[ga+4]+(T[gb+4]-T[ga+4])*t,T[ga+5]+(T[gb+5]-T[ga+5])*t,T[ga+6]+(T[gb+6]-T[ga+6])*t)}
  /* 手のまん中（k：0 手前・1 奥）の、行 a・b のあいだの場所を、Mx（せいれいの場所）でせかいへ */
  hand(ei,fr,k,Mx){const H=this.hm,q=POSE.tq,ga=((ei*ROWS+fr[0])*2+k)*3,gb=((ei*ROWS+fr[1])*2+k)*3,t=fr[2];return new THREE.Vector3((H[ga]+(H[gb]-H[ga])*t)/q,(H[ga+1]+(H[gb+1]-H[ga+1])*t)/q,(H[ga+2]+(H[gb+2]-H[ga+2])*t)/q).applyMatrix4(Mx)}
  /* L：[{el,x,y,z,yaw,mo,ph}]（マス・3Dの高さ・動きの名前・動きの中の場所 0〜1）。毎コマよぶ */
  set(L){const by={};for(const s of L){const el=this.M[s.el]?s.el:'earth';(by[el]=by[el]||[]).push(s)}
    const Mx=new THREE.Matrix4(),Mp=new THREE.Matrix4(),Q=new THREE.Quaternion(),Q2=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),S1=new THREE.Vector3(1,1,1),V=new THREE.Vector3(),V2=new THREE.Vector3();
    for(const k in this.P)this.P[k].n=0;
    for(const el of ELS){const m=this.M[el],A=by[el]||[],ei=ELS.indexOf(el),base=ei*ROWS,sc=new THREE.Vector3().setScalar(POSE.scale[el]/SCREF);if(A.length)this.grow(el,A.length);if(!m.ims)continue;
      const F=m.fr.array,X=m.ex.array;
      A.forEach((s,i)=>{Q.setFromAxisAngle(Y,s.yaw);Mx.compose(V.set(s.x,s.y,s.z),Q,S1.setScalar(s.k||1));for(const im of m.ims)im.setMatrixAt(i,Mx);
        const fr=poseFr(s.mo,s.ph);F[4*i]=base+fr[0];F[4*i+1]=base+fr[1];F[4*i+2]=fr[2];F[4*i+3]=POSE.wf[fr[0]]+(POSE.wf[fr[1]]-POSE.wf[fr[0]])*fr[2];/* はねをたたむ量 */
        const fm=s.fm||'n';X[3*i]=Math.max(0,this.xl.indexOf(fm));X[3*i+1]=s.lash&&this.xl.includes('lash:'+fm)?this.xl.indexOf('lash:'+fm):-1;X[3*i+2]=s.cheek?1:0;
        s.tip=null;if(s.an){/* 水・糸の出る所（道具の先・手のまん中）を、せかいの場所で */s.hn=this.hand(ei,fr,0,Mx);s.hf=this.hand(ei,fr,1,Mx)}
        const rp=POSE.rp[fr[0]];for(const sl of [0,1]){const pi=rp[sl];if(pi<0)continue;const P=this.P[pi+'|'+sl];if(!P)continue;
          this.pch(ei,fr,PROP0+sl,Q2,V2);Mp.compose(V2,Q2,sc).premultiply(Mx);if(s.an&&!s.tip){const D=POSE.props[POSE.plist[pi]],mir=POSE.mir[sl];if(D&&D.tip&&(POSE.plist[pi]==='rod'||POSE.plist[pi]==='can'))s.tip=new THREE.Vector3(D.tip[0]*SCREF,D.tip[1]*SCREF,D.tip[2]*SCREF*(mir?-1:1)).applyMatrix4(Mp)}this.ensure(P,P.n+1);for(const im of P.ims)im.setMatrixAt(P.n,Mp);P.n++}});
      for(const im of m.ims){im.count=A.length;im.instanceMatrix.needsUpdate=true}m.fr.needsUpdate=true;m.ex.needsUpdate=true}
    for(const k in this.P){const P=this.P[k];for(const im of P.ims){im.count=P.n;im.instanceMatrix.needsUpdate=true}}
    if(!this.blob||this.blob.instanceMatrix.count<L.length){if(this.blob){this.scene.remove(this.blob);this.blob.dispose()}this.blob=new THREE.InstancedMesh(blobGeo,blobMat,Math.max(16,Math.ceil(L.length*1.5)));this.blob.renderOrder=2;this.blob.frustumCulled=false;this.scene.add(this.blob)}
    const SB=new THREE.Vector3(SPB,1,SPB);Q.identity();L.forEach((s,i)=>{Mx.compose(V.set(s.x,(s.gy??s.y)+.012,s.z),Q,s.bed?SB.clone().setScalar(0):SB);this.blob.setMatrixAt(i,Mx)});this.blob.count=L.length;this.blob.instanceMatrix.needsUpdate=true}
  /* 道具のインスタンスの数がたりないときは、作りなおす */
  ensure(P,n){if(P.ims[0].instanceMatrix.count>=n)return;const c=Math.ceil(n*1.5)+2;P.ims=P.ims.map(im=>{this.scene.remove(im);const nm=new THREE.InstancedMesh(im.geometry,im.material,c);nm.frustumCulled=false;nm.castShadow=false;nm.receiveShadow=im.receiveShadow;nm.instanceMatrix.array.set(im.instanceMatrix.array);im.dispose();this.scene.add(nm);return nm})}
}
