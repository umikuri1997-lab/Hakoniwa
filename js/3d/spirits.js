/* 3Dのせいれい（試作 proto3d/main.js と同じ描き方）：しゅるいごとに、体（トゥーン）・目とほっぺ（色だけ）・背面法の線を、まとめて描く（InstancedMesh）。
   手足のふりはシェーダーでまわす。形は tools/3d/bake-spirits.cjs が書いた assets/3d/sp-*.bin。 */
import * as THREE from 'three';
import {ELS,HULL,ISOPT,CLOTHSPAN,OBJSCALE,SPH,BLOB} from './look.js';
import {toon,hullMat,flatMat} from './mats.js';
import {SPFILE,SPDATA} from './spirit-data.js';

const TYPES={Float32Array,Int8Array,Uint8Array,Uint16Array,Uint32Array};
export const blobTex=(()=>{const N=64,d=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const r=Math.hypot(i+.5-N/2,j+.5-N/2)/(N/2),a=Math.max(0,1-r);const o=(j*N+i)*4;d[o]=d[o+1]=d[o+2]=0;d[o+3]=Math.round(255*a*a*(3-2*a))}
  const t=new THREE.DataTexture(d,N,N);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
export const blobMat=new THREE.MeshBasicMaterial({map:blobTex,color:0x2a2440,transparent:true,opacity:BLOB.k,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
export const blobGeo=(()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g})();
const SPB=.7*OBJSCALE*SPH;   /* 足もとの丸いかげの大きさ */

export class Spirits{
  constructor(scene){this.scene=scene;this.M={};this.cap={};this.blob=null}
  async load(cloth){
    const buf=await (await fetch(SPFILE)).arrayBuffer(),dotW=HULL.w/ISOPT;
    for(const el of ELS){const E=SPDATA.els[el],u={uSpP:{value:E.uSpP.map(a=>new THREE.Vector3(...a))},uSpA:{value:E.uSpA.map(a=>new THREE.Vector3(...a))},key:el};
      const geo=part=>{const P=E[part],g=new THREE.BufferGeometry();for(const [a,d] of Object.entries(P)){const A=new TYPES[d.t](buf,d.o,d.n);
          if(a==='index')g.setIndex(new THREE.BufferAttribute(A,1));else g.setAttribute(a,new THREE.BufferAttribute(A,d.z,d.t!=='Float32Array'))}
        g.computeBoundingSphere();return g};
      this.M[el]={body:geo('body'),face:geo('face'),u,
        mat:toon({vertexColors:true},{cloth:E.scale/CLOTHSPAN,spirit:u}),face_mat:flatMat(u),hull:hullMat({vertexColors:true},dotW,u)}}
    this.cloth=cloth;
  }
  grow(el,n){const m=this.M[el];if((this.cap[el]||0)>=n)return;const c=Math.max(8,Math.ceil(n*1.5));this.cap[el]=c;
    if(m.ims)for(const im of m.ims){this.scene.remove(im);im.dispose()}
    for(const g of [m.body,m.face])g.setAttribute('aSw',new THREE.InstancedBufferAttribute(new Float32Array(c),1));
    m.ims=[[m.body,m.mat],[m.face,m.face_mat],[m.body,m.hull]].map(([g,mt],i)=>{const im=new THREE.InstancedMesh(g,mt,c);im.frustumCulled=false;im.castShadow=false;im.receiveShadow=i!==2;im.count=0;this.scene.add(im);return im})}
  /* L：[{el,x,y,z,yaw,sw}]（マス・3Dの高さ）。毎コマよぶ */
  set(L){const by={};for(const s of L){const el=this.M[s.el]?s.el:'earth';(by[el]=by[el]||[]).push(s)}
    const Mx=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),S1=new THREE.Vector3(1,1,1),V=new THREE.Vector3();
    for(const el of ELS){const m=this.M[el],A=by[el]||[];if(A.length)this.grow(el,A.length);if(!m.ims)continue;
      const sw=m.body.getAttribute('aSw').array,sw2=m.face.getAttribute('aSw').array;
      A.forEach((s,i)=>{Q.setFromAxisAngle(Y,s.yaw);Mx.compose(V.set(s.x,s.y,s.z),Q,S1);for(const im of m.ims)im.setMatrixAt(i,Mx);sw[i]=sw2[i]=s.sw||0});
      for(const im of m.ims){im.count=A.length;im.instanceMatrix.needsUpdate=true}m.body.getAttribute('aSw').needsUpdate=true;m.face.getAttribute('aSw').needsUpdate=true}
    if(!this.blob||this.blob.instanceMatrix.count<L.length){if(this.blob){this.scene.remove(this.blob);this.blob.dispose()}this.blob=new THREE.InstancedMesh(blobGeo,blobMat,Math.max(16,Math.ceil(L.length*1.5)));this.blob.renderOrder=2;this.blob.frustumCulled=false;this.scene.add(this.blob)}
    const SB=new THREE.Vector3(SPB,1,SPB);Q.identity();L.forEach((s,i)=>{Mx.compose(V.set(s.x,(s.gy??s.y)+.012,s.z),Q,SB);this.blob.setMatrixAt(i,Mx)});this.blob.count=L.length;this.blob.instanceMatrix.needsUpdate=true}
}
