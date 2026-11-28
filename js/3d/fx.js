/* せいれいのまわりの小さな効果（3Dの面と線）：道具の先の水（じょうろ）・水浴びのしぶき・つりの糸とうきと波の輪。
   出る場所は、spirits.js が出す、道具の先 tip・手のまん中 hn・hf（せかいの場所）。動き方は、2Dの drawspmDraw・drawFishLine（js/draw-spirits.js）と同じ。 */
import * as THREE from 'three';
import {HSTEP} from './look.js';
import {fxMat} from './mats.js';

const DOT=1/32,HD=HSTEP/32,ADOT=.0133;   /* ゲームの1ドット（よこ・たて）・せいれいの絵の1ドットの大きさ（マス） */
const ND=96,NL=8,LS=12;                  /* つぶの数・糸の数・糸のくぎり */
export class Fx{
  constructor(scene,right){this.right=right;this.n=0;
    const mk=(geo,col,n)=>{const m=new THREE.InstancedMesh(geo,fxMat(new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:1})),n);m.frustumCulled=false;m.count=0;m.renderOrder=3;m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3).fill(1),3);scene.add(m);return m};
    const sp=new THREE.SphereGeometry(1,6,4),ring=new THREE.RingGeometry(.84,1,28);ring.rotateX(-Math.PI/2);
    this.drops=mk(sp,0xffffff,ND);this.fl=mk(sp,0xe0533d,NL);this.fw=mk(sp,0xffffff,NL);this.rings=mk(ring,0xffffff,NL*2);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(NL*LS*2*3),3));this.lg=g;
    this.lines=new THREE.LineSegments(g,fxMat(new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.75})));this.lines.frustumCulled=false;this.lines.renderOrder=3;scene.add(this.lines)}
  /* L：せいれいの一覧。e.fx：{k:'water'|'bathe'|'fish',t,ph,B,tx,ty,tz}（draw-3d.js の g3Pose）。e.tip・e.hn・e.hf：spirits.js が出す場所 */
  set(L){const M=new THREE.Matrix4(),C=new THREE.Color(),R=this.right(),V=new THREE.Vector3(),Sc=new THREE.Vector3(),Q=new THREE.Quaternion(),I=new THREE.Quaternion();let nd=0,nf=0,nr=0,nl=0;const LP=this.lg.getAttribute('position').array;
    const drop=(x,y,z,r,col)=>{if(nd>=ND)return;M.compose(V.set(x,y,z),I,Sc.setScalar(r));this.drops.setMatrixAt(nd,M);this.drops.setColorAt(nd,C.set(col));nd++};
    for(const e of L){const f=e.fx;if(!f)continue;
      if(f.k==='water'&&e.tip){for(let k=0;k<3;k++){const p=(f.t*1.8+k/3)%1;drop(e.tip.x+R.x*p*3*ADOT,e.tip.y-p*24*ADOT,e.tip.z+R.z*p*3*ADOT,.07*(1-p*.6),'#78beff')}}
      else if(f.k==='bathe'&&e.hn&&e.hf){const mx=(e.hn.x+e.hf.x)/2,my=(e.hn.y+e.hf.y)/2,mz=(e.hn.z+e.hf.z)/2;
        for(let k=0;k<6;k++){const p=(f.ph-.44-k*.025)/.42;if(p<=0||p>=1)continue;const dx=(k-2.5)*4.5*p*ADOT*1.8,dy=-(20+(k%3)*5)*p+34*p*p;drop(mx+R.x*dx,my-dy*ADOT*1.8,mz+R.z*dx,.045*(1-p*.5),k%2?'#d6f2ff':'#6fc0ff')}}
      else if(f.k==='fish'&&e.tip&&f.B&&!(f.B.cast<0)){const B=f.B,T=e.tip;let X=f.tx,Y=f.ty,Z=f.tz,sag=0;
        const fly=B.cast!=null||B.yank!=null;
        if(fly){const k=B.cast!=null?B.cast:1-B.yank,h=(1-(2*k-1)*(2*k-1))*(B.cast!=null?26:16);X=T.x+(f.tx-T.x)*k;Z=T.z+(f.tz-T.z)*k;Y=T.y+(f.ty-T.y)*k+h*ADOT*1.5}
        else{Y=f.ty+(Math.sin(f.t*3)*1.2-(B.dip||0))*ADOT*1.5*(B.big?0:1);sag=B.big?0:.1;
          if(B.ring!=null&&nr<NL*2){const R0=((B.big?5:3)+B.ring*(B.big?14:10))*DOT,al=(1-B.ring)*(B.big?.85:.7);M.compose(V.set(f.tx,f.ty+.012,f.tz),I,Sc.set(R0,1,R0));this.rings.setMatrixAt(nr,M);this.rings.setColorAt(nr,C.setRGB(1-(1-.37)*(1-al),1-(1-.66)*(1-al),1-(1-.85)*(1-al)));nr++}}
        if(!B.big&&nf<NL){M.compose(V.set(X,Y+.06,Z),I,Sc.setScalar(.065));this.fl.setMatrixAt(nf,M);M.compose(V.set(X,Y-.02,Z),I,Sc.setScalar(.055));this.fw.setMatrixAt(nf,M);nf++}
        if(nl<NL){const ex=X,ey=B.big?Y:Y+.05,ez=Z;for(let i=0;i<LS;i++){for(let j=0;j<2;j++){const u=(i+j)/LS,o=((nl*LS+i)*2+j)*3;LP[o]=T.x+(ex-T.x)*u;LP[o+1]=T.y+(ey-T.y)*u-Math.sin(Math.PI*u)*sag;LP[o+2]=T.z+(ez-T.z)*u}}nl++}}}
    for(const [m,n] of [[this.drops,nd],[this.fl,nf],[this.fw,nf],[this.rings,nr]]){m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
    this.lg.setDrawRange(0,nl*LS*2);this.lg.getAttribute('position').needsUpdate=true}
}
