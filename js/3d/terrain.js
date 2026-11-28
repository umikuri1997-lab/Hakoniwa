/* 3Dの地形（試作 proto3d/main.js の地面をうつした物）：段差の高さ・草地とあれ地・道・家の床・水を、ゲームのマップから作る。
   マップは区画（CH×CH マス）に分けて作り、かわった区画だけ作りなおす。 */
import * as THREE from 'three';
import {HSTEP,BORDER,PATHDIP,GBUMP,CRACK,WATER,RIPPLE,GLINT,BUMP,GTEX,SKY,SKYTOP,STAGECOL} from './look.js';
import {C3,U,GRAD,NOISE,BUMP_FS,PXSHADE_FS,AIR_FS,projVS,PROJ_VS} from './mats.js';

export const K={BARE:0,GRASS:1,PATH:2,FLOOR:3,WATER:4,FORD:5};   // マスのしゅるい（ゲームからわたす）
const MASKR=8,SUB=4,CH=16;
const G3FT=64,G3FN=32;   /* 道・床の絵のページ：1マスのドット・1行のマスの数（draw-3d.js と同じ） */
const cpuNoise=(()=>{const N=64,v=new Float32Array(N*N);let sd=91;for(let i=0;i<N*N;i++){sd=(sd*16807)%2147483647;v[i]=sd/2147483647}
  const at=(i,j)=>v[((j%N+N)%N)*N+((i%N+N)%N)];return (x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    return (at(i,j)*(1-sx)+at(i+1,j)*sx)*(1-sy)+(at(i,j+1)*(1-sx)+at(i+1,j+1)*sx)*sy}})();

export class Terrain{
  constructor(scene,gtex){this.scene=scene;this.gtex=gtex;this.chunks=new Map();this.M=null}
  /* m：{W,H,hi(段の高さ),kind(K),flat(1：もりあげない),fcol(床の色 RGB),stage} */
  set(m){const first=!this.M||this.M.W!==m.W||this.M.stage!==m.stage;this.M=m;const MN=m.W+2*BORDER;this.MN=MN;
    if(first){this.dispose();this.mask=new THREE.DataTexture(new Uint8Array(MN*MASKR*MN*MASKR*4),MN*MASKR,MN*MASKR);this.mask.magFilter=this.mask.minFilter=THREE.LinearFilter;
      this.ftex=new THREE.DataTexture(new Uint8Array(m.W*m.H*4),m.W,m.H);this.ftex.magFilter=this.ftex.minFilter=THREE.NearestFilter;
      this.stex=new THREE.DataTexture(new Uint8Array(m.W*m.H*4),m.W,m.H);this.stex.magFilter=this.stex.minFilter=THREE.NearestFilter;
      this.gmat=this.groundMat(m.stage);this.buildWater(m.stage)}
    if(m.fart){if(!this.atex||this.atex.image!==m.fart){if(this.atex)this.atex.dispose();const t=new THREE.CanvasTexture(m.fart);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.colorSpace=THREE.NoColorSpace;this.atex=t}else this.atex.needsUpdate=true;this.U.uFA.value=this.atex}
    this.update(0,0,m.W-1,m.H-1)}
  artDirty(){if(this.atex)this.atex.needsUpdate=true}
  dispose(){for(const c of this.chunks.values()){this.scene.remove(c);c.geometry.dispose()}this.chunks.clear();if(this.water){this.scene.remove(this.water);this.water.geometry.dispose()}}
  inMap(x,z){return x>=0&&z>=0&&x<this.M.W&&z<this.M.H}
  kindAt(x,z){return this.inMap(x,z)?this.M.kind[z*this.M.W+x]:K.BARE}
  hAt(x,z){const M=this.M;if(!this.inMap(x,z)){const cx=Math.max(0,Math.min(M.W-1,x)),cz=Math.max(0,Math.min(M.H-1,z));return Math.min(0,M.hi[cz*M.W+cx])}return M.hi[z*M.W+x]}
  isW(x,z){const k=this.kindAt(x,z);return this.inMap(x,z)&&k===K.WATER}
  yTop(x,z){return this.hAt(x,z)*HSTEP-(this.isW(x,z)?.45:0)}
  flat(x,z){return this.inMap(x,z)&&this.M.flat[z*this.M.W+x]}
  pathTile(x,z){const k=this.kindAt(x,z);return this.inMap(x,z)&&k===K.PATH?1:0}
  waterTile(x,z){return this.isW(x,z)?1:0}
  pmAt(px,pz,water){const u=px-.5,v=pz-.5,i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j,T=water?(a,b)=>this.waterTile(a,b):(a,b)=>this.pathTile(a,b);
    const b=(T(i,j)*(1-fx)+T(i+1,j)*fx)*(1-fy)+(T(i,j+1)*(1-fx)+T(i+1,j+1)*fx)*fy;
    const n=cpuNoise(px*1.7,pz*1.7)*.6+cpuNoise(px*4.1+9,pz*4.1)*.4;const t=Math.min(1,Math.max(0,(b+(n-.5)*.35-.47)/.06));return t*t*(3-2*t)}
  bumpAt(px,pz){const x=Math.floor(px),z=Math.floor(pz);if(!this.inMap(x,z)||this.isW(x,z)||this.flat(x,z)||this.kindAt(x,z)===K.FLOOR)return 0;const y=this.yTop(x,z);let f=1;
    const ex=[px-x,0,x+1-px],ez=[pz-z,0,z+1-pz];
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;
      if(!this.inMap(nx,nz)||this.yTop(nx,nz)!==y||this.flat(nx,nz)||this.kindAt(nx,nz)===K.FLOOR){const t=Math.min(1,Math.max(dx?ex[dx+1]:0,dz?ez[dz+1]:0)/.35);f*=t*t*(3-2*t)}}
    return GBUMP.amp*(cpuNoise(px*GBUMP.scale+31,pz*GBUMP.scale+17)-.5)*2*f}
  groundH(px,pz){const x=Math.floor(px),z=Math.floor(pz);return this.yTop(x,z)-(this.inMap(x,z)&&!this.isW(x,z)?PATHDIP*this.pmAt(px,pz):0)+this.bumpAt(px,pz)}
  /* マス (x0,z0)〜(x1,z1) がかわった：マスク・床の色・区画の形を作りなおす */
  update(x0,z0,x1,z1){const M=this.M,MN=this.MN,WM=MN*MASKR,d=this.mask.image.data;
    const mx0=Math.max(0,(x0-2+BORDER)*MASKR),mz0=Math.max(0,(z0-2+BORDER)*MASKR),mx1=Math.min(WM-1,(x1+3+BORDER)*MASKR),mz1=Math.min(WM-1,(z1+3+BORDER)*MASKR);
    for(let j=mz0;j<=mz1;j++)for(let i=mx0;i<=mx1;i++){const px=(i+.5)/MASKR-BORDER,pz=(j+.5)/MASKR-BORDER,x=Math.floor(px),z=Math.floor(pz),k=this.kindAt(x,z),o=(j*WM+i)*4;
      d[o]=Math.round(255*this.pmAt(px,pz));d[o+1]=Math.round(255*this.pmAt(px,pz,1));d[o+2]=!this.inMap(x,z)||k===K.BARE||k===K.FORD?255:0;d[o+3]=k===K.FORD?255:0}
    this.mask.needsUpdate=true;
    const f=this.ftex.image.data;for(let z=Math.max(0,z0-1);z<=Math.min(M.H-1,z1+1);z++)for(let x=Math.max(0,x0-1);x<=Math.min(M.W-1,x1+1);x++){const j=z*M.W+x,k=M.kind[j],o=j*4;
      f[o]=M.fcol[j*3];f[o+1]=M.fcol[j*3+1];f[o+2]=M.fcol[j*3+2];f[o+3]=k===K.FLOOR?255:k===K.PATH?128:0;
      const sl=M.fslot?M.fslot[j]:-1,a=this.stex.image.data;a[o]=sl<0?0:sl&255;a[o+1]=sl<0?0:sl>>8;a[o+2]=sl<0?0:255;a[o+3]=255}
    this.ftex.needsUpdate=true;this.stex.needsUpdate=true;
    for(let cz=Math.floor((z0-2)/CH);cz<=Math.floor((z1+2)/CH);cz++)for(let cx=Math.floor((x0-2)/CH);cx<=Math.floor((x1+2)/CH);cx++){
      if(cx<-1||cz<-1||cx*CH>=M.W+BORDER||cz*CH>=M.H+BORDER)continue;this.buildChunk(cx,cz)}}
  buildChunk(cx,cz){const key=cx+','+cz,old=this.chunks.get(key);if(old){this.scene.remove(old);old.geometry.dispose()}
    const P=[],N=[],T=[],I=[];const M=this.M;
    const X0=cx===-1?-BORDER:cx*CH,Z0=cz===-1?-BORDER:cz*CH,X1=cx===-1?0:(cx+1)*CH>=M.W?M.W+BORDER:(cx+1)*CH,Z1=cz===-1?0:(cz+1)*CH>=M.H?M.H+BORDER:(cz+1)*CH;/* さいごの区画は、まわりの地面まで */
    const quad=(vs,n,top)=>{const b=P.length/3;for(let i=0;i<4;i++){P.push(...vs[i]);N.push(...n);T.push(top)}I.push(b,b+1,b+2,b,b+2,b+3)};
    for(let z=Z0;z<Z1;z++)for(let x=X0;x<X1;x++){
      const y=this.yTop(x,z);
      if(this.inMap(x,z)&&!this.isW(x,z)){const H=(px,pz)=>this.groundH(Math.min(x+.9999,Math.max(x,px)),Math.min(z+.9999,Math.max(z,pz))),e=.05;
        const b=P.length/3;for(let j=0;j<=SUB;j++)for(let i=0;i<=SUB;i++){const a=x+i/SUB,c=z+j/SUB,h=H(a,c),na=H(a-e,c)-H(a+e,c),nb=H(a,c-e)-H(a,c+e),l=Math.hypot(na,2*e,nb);P.push(a,h,c);N.push(na/l,2*e/l,nb/l);T.push(y)}
        for(let j=0;j<SUB;j++)for(let i=0;i<SUB;i++){const q=b+j*(SUB+1)+i;I.push(q+SUB+1,q+SUB+2,q+1,q+SUB+1,q+1,q)}}
      else quad([[x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z]],[0,1,0],y);
      for(const [dx,dz,A,B,n] of [[0,1,[x,y,z+1],[x+1,y,z+1],[0,0,1]],[0,-1,[x+1,y,z],[x,y,z],[0,0,-1]],[1,0,[x+1,y,z+1],[x+1,y,z],[1,0,0]],[-1,0,[x,y,z],[x,y,z+1],[-1,0,0]]]){
        const ny=this.yTop(x+dx,z+dz);if(ny>=y-1e-4)continue;
        quad([[A[0],ny-PATHDIP,A[2]],[B[0],ny-PATHDIP,B[2]],[B[0],y,B[2]],[A[0],y,A[2]]],n,y)}}
    if(!P.length){this.chunks.delete(key);return}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('aTop',new THREE.Float32BufferAttribute(T,1));
    g.setIndex(P.length/3<65536?new THREE.Uint16BufferAttribute(I,1):new THREE.Uint32BufferAttribute(I,1));g.computeBoundingSphere();
    const m=new THREE.Mesh(g,this.gmat);m.receiveShadow=true;m.castShadow=true;m.userData.ground=1;this.scene.add(m);this.chunks.set(key,m)}
  meshes(){return [...this.chunks.values()]}
  groundMat(stage){
    const C=STAGECOL[stage]||STAGECOL[0],MN=this.MN,MW=this.M.W,MH=this.M.H;
    const m=new THREE.MeshToonMaterial({gradientMap:GRAD}),D=this.drape;
    this.U={uFA:{value:this.atex||null}};
    m.onBeforeCompile=sh=>{projVS(sh);Object.assign(sh.uniforms,{uFS:{value:this.stex},uFA:this.U.uFA,uMask:{value:this.mask},uFloor:{value:this.ftex},uG:{value:this.gtex},uSunV:U.sunV,uDrape:{get value(){return D.tex}},uDR:{value:D.r},uDOn:D.on});
      sh.vertexShader='attribute float aTop;varying vec3 vW,vWP;varying float vTop,vNy;\n'+sh.vertexShader.replace('void main() {','void main() {\nvW=(modelMatrix*vec4(position,1.)).xyz;vTop=aTop;vNy=normal.y;').replace(PROJ_VS,PROJ_VS+'\nvWP=cwp0;');
      sh.fragmentShader='uniform sampler2D uFS,uFA,uMask,uFloor,uG[3],uDrape;uniform vec4 uDR;uniform float uDOn;uniform float uTime;uniform vec3 uSunV;varying vec3 vW,vWP;varying float vTop,vNy;\n'+NOISE+sh.fragmentShader.replace('void main() {','#include <shadowmask_pars_fragment>\nvoid main() {').replace('#include <normal_fragment_maps>','vec3 tnGeoN=normal;\n#include <normal_fragment_maps>').replace('#include <opaque_fragment>',BUMP_FS+PXSHADE_FS+AIR_FS+'\n#include <opaque_fragment>').replace('#include <color_fragment>',`#include <color_fragment>
  vec3 tnBump=vec3(0.);vec2 tnG=vec2(0.),tnUV=vW.xz;
  {vec2 p=vW.xz;
   if(vNy>.5){float e=.1,h0=fbm(p*${GBUMP.f}),hx=fbm((p+vec2(e,0.))*${GBUMP.f}),hz=fbm((p+vec2(0.,e))*${GBUMP.f});
     vec3 gt0=texture2D(uG[0],p/${GTEX.grass.span}.).rgb,gtx=texture2D(uG[0],(p+vec2(.03,0.))/${GTEX.grass.span}.).rgb,gtz=texture2D(uG[0],(p+vec2(0.,.03))/${GTEX.grass.span}.).rgb;
     float l0=dot(gt0,vec3(.3,.59,.11));tnBump=mat3(viewMatrix)*vec3(-(hx-h0)/e*${GBUMP.k}-(dot(gtx,vec3(.3,.59,.11))-l0)/.03*${GBUMP.t},0.,-(hz-h0)/e*${GBUMP.k}-(dot(gtz,vec3(.3,.59,.11))-l0)/.03*${GBUMP.t});}vec2 muv=(p+${BORDER}.)/${MN}.;
   float n1=fbm(p*.35),n2=fbm(p*1.7+5.),n3=vn(p*6.);
   vec4 mk4=texture2D(uMask,muv+(vec2(fbm(p*1.3),fbm(p*1.3+9.))-.5)*.012);vec3 mk=mk4.rgb;
   vec3 g=mix(${C3(C.grassB)},${C3(C.grassA)},smoothstep(.3,.7,n1));g=mix(g,${C3(C.grassC)},smoothstep(.62,.8,n2)*.6);
   g*=.94+.1*n3;
   {vec3 gt=texture2D(uG[0],p/${GTEX.grass.span}.).rgb;g=lin(g);g*=mix(1.,dot(gt,vec3(.3,.59,.11))/${GTEX.grass.lum},.75);g=pow(g,vec3(1./2.2));}
   float tuft=step(.82,hs(floor(p*5.)))*smoothstep(.35,.0,length(fract(p*5.)-.5));g=mix(g,g*1.12+vec3(.02,.03,0.),tuft);
   vec3 dry=mix(${C3(C.dry)},${C3(C.dry)}*.92,n2);
   {vec3 dt=texture2D(uG[1],p/${GTEX.dirt.span}+.37).rgb;dry=pow(lin(dry)*mix(1.,dot(dt,vec3(.3,.59,.11))/${GTEX.dirt.lum},.7),vec3(1./2.2));}
   dry*=1.-${CRACK.k}*smoothstep(${CRACK.w},0.,vor(p*${CRACK.scale}+vec2(n1,n2)*.6))*smoothstep(.4,.62,fbm(p*.22+3.));
   g=mix(g,dry,smoothstep(.45,.6,mk.b+(n1-.5)*.3));
   vec2 tile=floor(p);vec4 fl=vec4(0.);if(tile.x>=0.&&tile.y>=0.&&tile.x<${MW}.&&tile.y<${MH}.)fl=texture2D(uFloor,(tile+.5)/vec2(${MW}.,${MH}.));
   vec3 pth=mix(${C3(C.pathB)},${C3(C.path)},smoothstep(.2,.8,n2))*(.95+.08*n3);
   if(fl.a>.3&&fl.a<.7)pth=fl.rgb*(.9+.12*smoothstep(.2,.8,n2))*(.95+.08*n3);   /* 道のしゅるいの色（ゲームの道の絵のまんなかの色） */
   {vec3 dt=texture2D(uG[1],p/${GTEX.dirt.span}).rgb;pth=pow(mix(lin(pth)*dot(dt,vec3(.3,.59,.11))/${GTEX.dirt.lum},lin(pth)*1.05,.55),vec3(1./2.2));}
   float pr=texture2D(uMask,muv).r,pm=smoothstep(.42,.58,pr);
   g*=1.-.22*smoothstep(.05,.42,pr)*(1.-pm);
   vec3 c=mix(g,pth,pm);
   if(fl.a>.7){vec2 q=fract(p);float pl=fract(q.y*4.+step(.5,fract(q.x*.5+floor(q.y*4.)*.5))*.0);float seam=smoothstep(.0,.06,pl)*smoothstep(1.,.94,pl);c=fl.rgb*(.86+.14*seam)*(.96+.06*vn(p*vec2(2.,12.)));}   /* 家の床：板のすじ（仮） */
   if(tile.x>=0.&&tile.y>=0.&&tile.x<${MW}.&&tile.y<${MH}.&&vNy>.5){vec4 fs=texture2D(uFS,(tile+.5)/vec2(${MW}.,${MH}.));   /* 道・床の絵（2Dの描き方で描いたマスの絵。draw-3d.js の G3FA） */
     if(fs.b>.5){float sl=floor(fs.r*255.+.5)+floor(fs.g*255.+.5)*256.;vec2 q=clamp(fract(p),.5/${G3FT}.,1.-.5/${G3FT}.),cell=vec2(mod(sl,${G3FN}.),floor(sl/${G3FN}.));
       vec4 fa=texture2D(uFA,vec2((cell.x+q.x)/${G3FN}.,1.-(cell.y+q.y)/${G3FN}.));c=mix(c,fa.rgb,fa.a);}}
   if(mk4.a>.5)c=mix(c,${C3(WATER.shallow)},.35);   /* 浅瀬 */
   if(uDOn>.5&&vNy>.5){vec2 ip=vec2((p.x-p.y)*32.,(p.x+p.y)*24.-vTop/${HSTEP}*36.),du=vec2((ip.x-uDR.x)/uDR.z,1.-(ip.y-uDR.y)/uDR.w);   /* 地面にはる絵（ゲームの今の描き方で描いた、地面の上の物）：クォータービューの地面の点で */
     if(du.x>0.&&du.y>0.&&du.x<1.&&du.y<1.){vec4 dc=texture2D(uDrape,du);c=mix(c,dc.rgb,dc.a);}}
   if(vNy<.5){
     vec3 ct=texture2D(uG[2],vec2(p.x+p.y,-vW.y)/${GTEX.cliff.span}).rgb;vec3 cl=pow(lin(${C3(C.cliff)})*dot(ct,vec3(.3,.59,.11))/${GTEX.cliff.lum}*.7+ct*.9,vec3(1./2.2));
     float q=(p.x+p.y)*6.,tooth=.06+.16*hs(vec2(floor(q),3.))*(1.-abs(fract(q)*2.-1.));c=mix(cl,c,step(vTop-tooth,vW.y)*step(.5,1.-step(.7,fl.a)));}
   {float e=.02,sD=max(pm,smoothstep(.45,.6,mk.b+(n1-.5)*.3));vec3 L3=vec3(.3,.59,.11);
    if(vNy<.5){vec2 q=vec2(p.x+p.y,-vW.y);tnUV=q;tnG=(vec2(dot(texture2D(uG[2],(q+vec2(e,0.))/${GTEX.cliff.span}).rgb,L3),dot(texture2D(uG[2],(q+vec2(0.,e))/${GTEX.cliff.span}).rgb,L3))-dot(texture2D(uG[2],q/${GTEX.cliff.span}).rgb,L3))/e*${BUMP.ground};}
    else if(fl.a<.7){
#define TNGH(q) mix(dot(texture2D(uG[0],(q)/${GTEX.grass.span}.).rgb,L3)/${GTEX.grass.lum},dot(texture2D(uG[1],(q)/${GTEX.dirt.span}).rgb,L3)/${GTEX.dirt.lum},sD)
     tnUV=p;tnG=(vec2(TNGH(p+vec2(e,0.)),TNGH(p+vec2(0.,e)))-TNGH(p))/e*${(BUMP.ground*.3).toFixed(4)};}}
   diffuseColor.rgb=lin(c);}`);
    };
    m.customProgramCacheKey=()=>'ground'+stage+'|'+MN;return m;
  }
  buildWater(stage){
    const M=this.M,MN=this.MN,cloud=stage===4;   /* 風のステージの水（雲の海）は、白い雲の色 */
    const sh=cloud?'#f4f8fb':WATER.shallow,dp=cloud?'#c9dbe8':WATER.deep;
    const wg=new THREE.PlaneGeometry(M.W+2*BORDER,M.H+2*BORDER,(M.W+2*BORDER),(M.H+2*BORDER));wg.rotateX(-Math.PI/2);wg.translate(M.W/2,-.16,M.H/2);
    const wm=new THREE.ShaderMaterial({transparent:true,fog:true,uniforms:{uMask:{value:this.mask},uTime:U.time,uSunW:{value:new THREE.Vector3(-.55,1,.35).normalize()},...THREE.UniformsLib.fog},
      vertexShader:`uniform float uTime;varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec3 transformed=position;vW=(modelMatrix*vec4(position,1.)).xyz;${PROJ_VS}\n#include <fog_vertex>\n}`,
      fragmentShader:`uniform sampler2D uMask;uniform float uTime;uniform vec3 uSunW;varying vec3 vW;\n#include <fog_pars_fragment>\n${NOISE}
        float wv(vec2 p){return fbm(p*1.6+vec2(uTime*.15,uTime*.1))+.5*fbm(p*3.1-vec2(uTime*.12,0.));}
        void main(){vec2 p=vW.xz;float w=texture2D(uMask,(p+${BORDER}.)/${MN}.+(vec2(fbm(p*1.3),fbm(p*1.3+9.))-.5)*.012).g;if(w<.42)discard;
          float e=.04,h0=wv(p);vec3 N=normalize(vec3((h0-wv(p+vec2(e,0.)))*.7,1.,(h0-wv(p+vec2(0.,e)))*.7));
          vec3 V=normalize(cameraPosition-vW),Rf=reflect(-V,N);float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
          float dp=smoothstep(.46,.98,w+(fbm(p*.9)-.5)*.12);
          vec3 sky=mix(lin(${C3(SKY)}),lin(${C3(SKYTOP)}),smoothstep(0.,.6,Rf.y));
          sky=mix(sky,vec3(1.),${WATER.cloud}*smoothstep(.5,.75,fbm(Rf.xz/(Rf.y+.5)*1.4+p*.15+vec2(uTime*.012,0.))));
          vec3 body=mix(lin(${C3(sh)}),lin(${C3(dp)}),dp);
          vec2 cw=p+(vec2(fbm(p*1.1+uTime*.06),fbm(p*1.1+7.-uTime*.05))-.5)*1.1;
          float c1=smoothstep(.3,0.,vor(cw*1.9+vec2(uTime*.04,uTime*.025))),c2=smoothstep(.3,0.,vor(cw*3.1-vec2(uTime*.03,0.)+3.));float ca=c1*c1*c2*2.2+.25*c1*c1;
          body+=vec3(.9,1.,.85)*${WATER.caus}*ca*(1.-dp*.75);
          vec3 c=mix(body,sky,clamp(fr*1.8+.06,0.,1.))+vec3(1.,.95,.82)*1.6*pow(max(dot(Rf,uSunW),0.),220.);
          {vec2 q=p/${RIPPLE.cell},ci=floor(q);float ph=fract(uTime/${RIPPLE.period}+hs(ci)),rr=ph*${RIPPLE.r},dd=length(fract(q)-.5-(vec2(hs(ci+3.1),hs(ci+7.7))-.5)*.4)*${RIPPLE.cell};
           c+=vec3(${RIPPLE.k})*smoothstep(.035,0.,abs(dd-rr))*(1.-ph)*smoothstep(0.,.08,ph)*step(.35,hs(ci+1.3));
           vec2 gi=floor(p*${GLINT.n}.);float tw=pow(.5+.5*sin(uTime*2.6+hs(gi)*6.283),12.);c+=vec3(1.,.97,.86)*${GLINT.k}*tw*step(.972,hs(gi+5.))*smoothstep(.3,0.,length(fract(p*${GLINT.n}.)-.5));}
          float foam=smoothstep(.5,.44,w+.03*sin(uTime*1.6+fbm(p*3.)*9.))*(.55+.45*fbm(p*7.+uTime*.2));c=mix(c,lin(vec3(.92,.98,1.)),foam*.7);
          gl_FragColor=vec4(c,max(mix(${WATER.alpha[0]},${WATER.alpha[1]},dp),max(fr,foam)));\n#include <fog_fragment>\n}`});
    this.water=new THREE.Mesh(wg,wm);this.water.renderOrder=1;this.scene.add(this.water);
  }
  /* 画面の光線（せかいの点 o・向き d）と地形があたる所：段の高さの表を、マスごとにたどる。かえすのは {x,z,y,lv}（マス） */
  ray(o,d){const M=this.M;if(!M)return null;let t=0;const tmax=400,stp=.05;
    for(let i=0;t<tmax&&i<12000;i++){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t,tx=Math.floor(x),tz=Math.floor(z);
      const gy=this.hAt(tx,tz)*HSTEP;if(y<=gy){/* 少しもどって、くわしく。水のマスは、水面（段の高さ）でとめる */let a=t-stp,b=t;for(let k=0;k<8;k++){const c=(a+b)/2,cy=o.y+d.y*c;if(cy<=this.hAt(Math.floor(o.x+d.x*c),Math.floor(o.z+d.z*c))*HSTEP)b=c;else a=c}
        const X=o.x+d.x*b,Z=o.z+d.z*b,TX=Math.floor(X),TZ=Math.floor(Z);return {x:X,z:Z,y:o.y+d.y*b,lv:this.inMap(TX,TZ)?this.hAt(TX,TZ):0}}
      if(y<-4*HSTEP)break;t+=stp}
    return null}
}
