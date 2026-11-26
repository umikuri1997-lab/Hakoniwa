/* はこにわ 3Dの試作：地面・段差・池・木・草花・小物・せいれいを、ぜんぶ3Dで描いて、重さをはかる（ゲームとはべつのページ）。
   - ドット絵ふう：小さい画面（1ドット＝画面の DOT ピクセル）に描いて、なめらかにせず大きくする。
   - かげは家具の5色のかげと同じ（tools/art/furntone.py）：明るさ（HSV の V）をかえず、あざやかさ（S）でつける。
     光の向きとの内積の数でだんをきめる（CUTS）。輪郭だけ少し暗く（OLK）。光は左上・手前から（LIGHT、画面の向き）。
   - 木・草花・小物はトリポのモデル（tools/art/models/tripo）、せいれいは持ち主のモデル（tools/art/spirit3d/model/*.fbx）。
   - 同じ物は、まとめて1回で描く（InstancedMesh）。せいれいは骨で歩く（1体ずつ描く）。 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const TRIPO='../tools/art/models/tripo/', SPDIR='../tools/art/spirit3d/model/';
const PPU=16;          // 1マスのドット数（小さい画面の上で）
const HSTEP=.75;       // 段差1つの高さ（マス）
const MAPN=24;         // マップのはば（マス）
const PITCH=38;        // 見おろす角度（度）
const SPH=.85;         // せいれいの高さ（マス）
const WALK=1.2;        // せいれいの歩く速さ（マス/秒）
// かげ（furntone.py と同じ数）：(明るさ, あざやかさ) の足し算（%）
const TONE={deep:[0,20],shade:[0,10],base:[0,0],hi:[0,-5],hi2:[0,-10],line:[-38,10]};
const CUTS=[-.2,.4,.88,.97];
const LIGHT=[-.6,-.5,.8];  // 画面の向き（右・下・手前）
const AMB=.5,SUN=.6;       // 明かり（かげの所かどうかを見分けるのに使う）
const OUTLINE_DEPTH=.004;
const LOWKEEP=.25;        // 形をあらくするとき、のこす点のわりあい  // 輪郭にする奥行きの差（0〜1の奥行き）
// 色
const COL={grass:'#8fcf6a',grass2:'#86c763',path:'#e6c993',cliff:'#c99c6c',cliffTop:'#7fbf5c',pondBed:'#9ccfd8',water:'#7cc6ec'};
const SPCOL={body:'#fdf8ef',eye:'#5a4038',cheek:'#f4a7a0',
  earth:{hood:'#8f6a50',acc:'#8bc34a'},water:{hood:'#78c3fb'},fire:{hood:'#e8604f'},wind:{hood:'#c8e2b4',acc:'#9ccf7a'},wood:{hood:'#6fae4c'}};
const ELS=['earth','water','fire','wind','wood'];
// 置く物：モデル・高さ（マス）・物の数（少し・ふつう・多い）
const PROPS=[
  {id:'oak',h:2.4,n:[3,7,16],kind:'tree'},{id:'maple',h:2.1,n:[2,6,14],kind:'tree'},{id:'cedar',h:2.8,n:[2,5,12],kind:'tree'},{id:'appletree',h:2.1,n:[1,3,8],kind:'tree'},
  {id:'nat_bush',h:.6,n:[4,10,24],kind:'small'},{id:'berrybush',h:.6,n:[3,8,18],kind:'small'},
  {id:'grass',h:.35,n:[16,50,130],kind:'tiny'},{id:'clover',h:.3,n:[8,25,60],kind:'tiny'},{id:'bellflower',h:.4,n:[8,25,60],kind:'tiny'},
  {id:'rock',h:.3,n:[3,6,12],kind:'small'},{id:'stone_big',h:.45,n:[2,4,8],kind:'small'},
  {id:'lantern',h:.7,n:[2,3,4],kind:'item'},{id:'sack',h:.5,n:[2,3,4],kind:'item'},{id:'firewood',h:.4,n:[1,2,3],kind:'item'},{id:'stump',h:.4,n:[2,3,5],kind:'item'},
  {id:'log_lying',h:.35,n:[1,2,3],kind:'item'},{id:'jar_band',h:.5,n:[1,2,3],kind:'item'},{id:'wateringcan',h:.35,n:[1,1,2],kind:'item'}];

const $=id=>document.getElementById(id);
const showErr=e=>{const b=$('err');b.style.display='block';b.textContent+=String(e&&e.stack||e)+'\n'};
addEventListener('error',e=>showErr(e.error||e.message));addEventListener('unhandledrejection',e=>showErr(e.reason));

// ---- 設定（ボタン） ----
const OPT={dot:3,spirits:20,props:1,shadow:true,yaw:0,low:false};
try{Object.assign(OPT,JSON.parse(localStorage.getItem('hakoniwa-proto3d')||'{}'))}catch(e){}
const saveOpt=()=>{try{localStorage.setItem('hakoniwa-proto3d',JSON.stringify(OPT))}catch(e){}};

// ---- しかけ ----
const cv=$('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,3));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#cfe6c4');
const cam=new THREE.OrthographicCamera(-1,1,1,-1,30,100);
const target=new THREE.Vector3(MAPN/2,0,MAPN/2);
scene.add(new THREE.AmbientLight(0xffffff,AMB));
const sun=new THREE.DirectionalLight(0xffffff,SUN);
sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:80});
sun.shadow.bias=-.002;scene.add(sun,sun.target);

// 光の向き（せかい）：見おろしの角度で、画面の向きの光をせかいの向きにする（furntone.worldlight と同じ考え）。カメラをまわしても光はかわらない
function worldLight(){
  const t=PITCH*Math.PI/180,D=new THREE.Vector3(0,-Math.sin(t),-Math.cos(t)); // カメラの見る向き（yaw 0）
  const X=new THREE.Vector3(1,0,0),U=new THREE.Vector3().crossVectors(X,D).normalize(); // 画面の上
  if(U.y<0)U.negate();
  const l=new THREE.Vector3(...LIGHT).normalize();
  return new THREE.Vector3().addScaledVector(X,l.x).addScaledVector(U,-l.y).addScaledVector(D,-l.z).normalize();
}
const LW=worldLight();
const uLV={value:new THREE.Vector3()};

// ---- 5色のかげのマテリアル ----
const GLSL_TONE=`
uniform vec3 uLV;
vec3 tnRgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x);}
vec3 tnHsv2rgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
vec3 tnShift(vec3 lin,vec2 dvs){vec3 h=tnRgb2hsv(pow(max(lin,0.),vec3(1./2.2)));h.z=clamp(h.z+dvs.x/100.,0.,1.);h.y=clamp(h.y+dvs.y/100.,0.,1.);return pow(tnHsv2rgb(h),vec3(2.2));}
`;
const toneFrag=`
{
  vec3 tnBase=diffuseColor.rgb;
  float tnD=dot(normalize(normal),normalize(uLV));
  float tnLb=dot(tnBase,vec3(.299,.587,.114))+1e-4, tnLo=dot(outgoingLight,vec3(.299,.587,.114));
  float tnK=tnLo/tnLb, tnExp=${AMB.toFixed(3)}+${SUN.toFixed(3)}*max(tnD,0.);
  if(tnD>0. && tnK<tnExp-.12) tnD=min(tnD,-.3); // かげの中（ほかの物のかげ）
  vec2 tnS=vec2(${TONE.base[0]}.,${TONE.base[1]}.);
  if(tnD<${CUTS[0]}) tnS=vec2(${TONE.deep[0]}.,${TONE.deep[1]}.);
  else if(tnD<${CUTS[1]}) tnS=vec2(${TONE.shade[0]}.,${TONE.shade[1]}.);
  else if(tnD<${CUTS[2]}) tnS=vec2(${TONE.base[0]}.,${TONE.base[1]}.);
  else if(tnD<${CUTS[3]}) tnS=vec2(${TONE.hi[0]}.,${TONE.hi[1]}.);
  else tnS=vec2(${TONE.hi2[0]}.,${TONE.hi2[1]}.);
  gl_FragColor=vec4(tnShift(tnBase,tnS),diffuseColor.a);
}`;
function toneMat(o={}){
  const m=new THREE.MeshLambertMaterial(o);
  m.onBeforeCompile=sh=>{
    sh.uniforms.uLV=uLV;
    sh.fragmentShader=GLSL_TONE+sh.fragmentShader.replace('#include <opaque_fragment>',toneFrag);
  };
  return m;
}

// ---- 地図 ----
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const HM=[],KIND=[];// 高さ（だん）・しゅるい（g 草・p 道・w 池）
for(let z=0;z<MAPN;z++){HM.push([]);KIND.push([]);for(let x=0;x<MAPN;x++){
  let h=0;if(z<7)h=1;if(x>17&&z<12)h=1;if(x<5&&z<4)h=2;
  let k='g';if(z===14||(x===11&&z>=7))k='p';
  if(Math.hypot(x+.5-5,z+.5-18.5)<2.6){k='w';h=0}
  HM[z].push(h);KIND[z].push(k)}}
const hAt=(x,z)=>(x<0||z<0||x>=MAPN||z>=MAPN)?-1:HM[z][x];
const yTop=(x,z)=>hAt(x,z)*HSTEP-(KIND[z]&&KIND[z][x]==='w'?.3:0);

function buildGround(){
  const P=[],N=[],C=[];const c=new THREE.Color();
  const quad=(a,b,cc,d,n,col)=>{for(const v of [a,b,cc,a,cc,d]){P.push(...v);N.push(...n);c.set(col).convertSRGBToLinear();C.push(c.r,c.g,c.b)}};
  for(let z=0;z<MAPN;z++)for(let x=0;x<MAPN;x++){
    const k=KIND[z][x],y=yTop(x,z);
    const col=k==='p'?COL.path:k==='w'?COL.pondBed:((x+z)&1?COL.grass:COL.grass2);
    quad([x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z],[0,1,0],col);
    // 横の面：となりが低い所
    const side=[[0,1,[x,y,z+1],[x+1,y,z+1],[0,0,1]],[0,-1,[x+1,y,z],[x,y,z],[0,0,-1]],[1,0,[x+1,y,z+1],[x+1,y,z],[1,0,0]],[-1,0,[x,y,z],[x,y,z+1],[-1,0,0]]];
    for(const [dx,dz,A,B,n] of side){
      const nx=x+dx,nz=z+dz;const ny=(nx<0||nz<0||nx>=MAPN||nz>=MAPN)?-1.2:yTop(nx,nz);
      if(ny>=y-1e-4)continue;
      quad([A[0],ny,A[2]],[B[0],ny,B[2]],[B[0],y,B[2]],[A[0],y,A[2]],n,k==='w'?COL.pondBed:COL.cliff);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  const m=new THREE.Mesh(g,toneMat({vertexColors:true}));m.receiveShadow=true;m.castShadow=true;scene.add(m);
  // 池の水
  const wg=new THREE.CircleGeometry(2.6,32);wg.rotateX(-Math.PI/2);
  const w=new THREE.Mesh(wg,toneMat({color:COL.water,transparent:true,opacity:.85}));w.position.set(5,-.08,18.5);w.receiveShadow=true;
  scene.add(w);
  return {ground:m,water:w};
}

// ---- モデル ----
const gltf=new GLTFLoader(),fbx=new FBXLoader();
// くらい色・色むらをへらし、あざやかに（blueprint.model_tris と同じ考え）
function cleanColors(geo){
  const a=geo.getAttribute('color');if(!a)return;const c=new THREE.Color(),hsl={};let lsum=0;
  for(let i=0;i<a.count;i++){c.fromBufferAttribute(a,i);c.getHSL(hsl);lsum+=hsl.l}
  const lm=lsum/a.count;
  for(let i=0;i<a.count;i++){c.fromBufferAttribute(a,i);c.getHSL(hsl);
    const l=Math.max(.38,hsl.l*.5+lm*.5),s=Math.min(1,hsl.s*1.15+.05);c.setHSL(hsl.h,s,l);a.setXYZ(i,c.r,c.g,c.b)}
  a.needsUpdate=true;
}
async function loadProp(p){
  const g=await gltf.loadAsync(TRIPO+p.id+'.glb');const root=g.scene;root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(root),sz=bb.getSize(new THREE.Vector3()),s=p.h/sz.y;
  const norm=new THREE.Matrix4().makeScale(s,s,s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2));
  const parts=[];
  root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm,o.matrixWorld));
    if(!geo.getAttribute('normal'))geo.computeVertexNormals();cleanColors(geo);
    const src=o.material||{};parts.push({geo,mat:toneMat({vertexColors:!!geo.getAttribute('color'),color:geo.getAttribute('color')?0xffffff:(src.color||0xffffff),map:src.map||null})})});
  p.parts=parts;p.foot=Math.max(sz.x,sz.z)*s;
}
const SPMODELS={};
async function loadSpirit(el){
  const g=await fbx.loadAsync(SPDIR+el+'.fbx');
  g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),s=SPH/bb.getSize(new THREE.Vector3()).y;
  g.scale.multiplyScalar(s);
  const c=SPCOL[el];
  g.traverse(o=>{if(!o.isMesh)return;const n=o.name.toLowerCase();o.castShadow=true;o.receiveShadow=false;o.frustumCulled=false;
    if(n.startsWith('eye'))o.material=new THREE.MeshBasicMaterial({color:SPCOL.eye});
    else if(n.startsWith('cheek'))o.material=new THREE.MeshBasicMaterial({color:SPCOL.cheek});
    else if(n.startsWith('hood')||n.startsWith('hane'))o.material=toneMat({color:c.hood});
    else if(n.startsWith('sprout')||n.startsWith('headacc'))o.material=toneMat({color:c.acc||c.hood});
    else o.material=toneMat({color:SPCOL.body});
  });
  SPMODELS[el]=g;
}

// 形をあらくする（三角形をへらす。はじめてえらんだときに作る）
function lowGeo(part){
  if(!part.low){const g=mergeVertices(part.geo.clone());const n=g.getAttribute('position').count;
    part.low=new SimplifyModifier().modify(g,Math.floor(n*(1-LOWKEEP)));part.low.computeVertexNormals()}
  return part.low;
}
// ---- 置く ----
let propMeshes=[];
const free=(x,z)=>x>=1&&z>=1&&x<MAPN-1&&z<MAPN-1&&KIND[z][x]==='g';
function placeProps(level){
  for(const m of propMeshes){scene.remove(m)}propMeshes=[];
  seed=11;const used=new Set();
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S=new THREE.Vector3();
  for(const p of PROPS){
    const n=p.n[level],mats=[];
    for(let i=0,tries=0;i<n&&tries<n*40;tries++){
      const x=Math.floor(rnd()*MAPN),z=Math.floor(rnd()*MAPN);if(!free(x,z))continue;
      const big=p.kind==='tree'||p.kind==='item';const key=x+','+z;if(big&&used.has(key))continue;
      if(p.kind==='tree'&&(hAt(x,z+1)<hAt(x,z)))continue; // がけのふちには木を植えない
      if(big)used.add(key);
      const jx=p.kind==='tiny'?rnd()*.8+.1:.5,jz=p.kind==='tiny'?rnd()*.8+.1:.5,sc=.85+rnd()*.3;
      Q.setFromAxisAngle(Y,rnd()*Math.PI*2);V.set(x+jx,yTop(x,z),z+jz);S.set(sc,sc,sc);M.compose(V,Q,S);mats.push(M.clone());i++;
    }
    for(const part of p.parts){
      const im=new THREE.InstancedMesh(OPT.low?lowGeo(part):part.geo,part.mat,Math.max(1,mats.length));im.count=mats.length;
      mats.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=p.kind!=='tiny';im.receiveShadow=true;im.computeBoundingSphere();
      scene.add(im);propMeshes.push(im);
    }
    p.at=used;
  }
  return used;
}

// ---- せいれい ----
let sprites=[];let blocked=new Set();
function walkable(x,z,h){return x>=0&&z>=0&&x<MAPN&&z<MAPN&&KIND[z][x]!=='w'&&HM[z][x]===h&&!blocked.has(x+','+z)}
function lineOK(a,b,h){const n=Math.ceil(a.distanceTo(b)*3);for(let i=0;i<=n;i++){const t=i/n;if(!walkable(Math.floor(a.x+(b.x-a.x)*t),Math.floor(a.z+(b.z-a.z)*t),h))return false}return true}
function makeSpirits(n){
  for(const s of sprites)scene.remove(s.obj);sprites=[];seed=3;
  for(let i=0;i<n;i++){
    const el=ELS[i%ELS.length],obj=SkeletonUtils.clone(SPMODELS[el]);
    let x,z;do{x=Math.floor(rnd()*MAPN);z=Math.floor(rnd()*MAPN)}while(!walkable(x,z,HM[z][x]));
    const h=HM[z][x];const bones={};obj.traverse(o=>{if(o.isBone)bones[o.name]={b:o,q:o.quaternion.clone()}});
    obj.position.set(x+.5,yTop(x,z),z+.5);obj.rotation.y=rnd()*Math.PI*2;scene.add(obj);
    sprites.push({obj,h,bones,to:null,wait:rnd()*2,ph:rnd()*6});
  }
}
const QA=new THREE.Quaternion(),AX=new THREE.Vector3(1,0,0);
function bend(s,name,a){const r=s.bones[name];if(!r)return;QA.setFromAxisAngle(AX,a);r.b.quaternion.copy(r.q).multiply(QA)}
function stepSpirits(dt){
  for(const s of sprites){
    const p=s.obj.position;let moving=false;
    if(s.to){const d=new THREE.Vector3(s.to.x-p.x,0,s.to.z-p.z),L=d.length();
      if(L<.05){s.to=null;s.wait=.8+rnd()*2.5}
      else{const st=Math.min(L,WALK*dt);p.addScaledVector(d.normalize(),st);moving=true;
        const ang=Math.atan2(d.x,d.z);let da=ang-s.obj.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));s.obj.rotation.y+=da*Math.min(1,dt*10)}}
    else if((s.wait-=dt)<=0){
      for(let t=0;t<8;t++){const tx=Math.floor(p.x)+Math.round((rnd()-.5)*8),tz=Math.floor(p.z)+Math.round((rnd()-.5)*8);
        const v=new THREE.Vector3(tx+.2+rnd()*.6,0,tz+.2+rnd()*.6);if(walkable(tx,tz,s.h)&&lineOK(p,v,s.h)){s.to=v;break}}
      if(!s.to)s.wait=.5;
    }
    s.ph+=dt*(moving?9:2.5);
    const sw=moving?Math.sin(s.ph)*.6:0;
    bend(s,'thighL',sw);bend(s,'thighR',-sw);bend(s,'upper_armL',-sw*.7);bend(s,'upper_armR',sw*.7);
    p.y=s.h*HSTEP+(moving?Math.abs(Math.sin(s.ph))*.04:Math.sin(s.ph)*.008);
  }
}

// ---- 小さい画面と、大きくして出す ----
let rt=null,rtW=0,rtH=0;
const post=new THREE.ShaderMaterial({
  uniforms:{tC:{value:null},tD:{value:null},px:{value:new THREE.Vector2()}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:GLSL_TONE.replace('uniform vec3 uLV;','')+`
    uniform sampler2D tC,tD;uniform vec2 px;varying vec2 vUv;
    void main(){
      vec2 uv=(floor(vUv/px)+.5)*px;vec4 c=texture2D(tC,uv);float d=texture2D(tD,uv).x;
      float n=max(max(texture2D(tD,uv+vec2(px.x,0.)).x,texture2D(tD,uv-vec2(px.x,0.)).x),max(texture2D(tD,uv+vec2(0.,px.y)).x,texture2D(tD,uv-vec2(0.,px.y)).x));
      if(n-d>${OUTLINE_DEPTH}){vec3 h=tnRgb2hsv(c.rgb);h.z=clamp(h.z+${TONE.line[0]}./100.,0.,1.);h.y=clamp(h.y+${TONE.line[1]}./100.,0.,1.);c.rgb=tnHsv2rgb(h);}
      gl_FragColor=vec4(c.rgb,1.);
    }`,depthTest:false,depthWrite:false});
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));
function resize(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);
  const W=Math.max(32,Math.floor(w/OPT.dot)),H=Math.max(32,Math.floor(h/OPT.dot));
  if(W===rtW&&H===rtH&&rt)return;rtW=W;rtH=H;if(rt){rt.depthTexture.dispose();rt.dispose()}
  rt=new THREE.WebGLRenderTarget(W,H,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
  rt.texture.colorSpace=THREE.SRGBColorSpace;rt.depthTexture=new THREE.DepthTexture(W,H);
  post.uniforms.tC.value=rt.texture;post.uniforms.tD.value=rt.depthTexture;post.uniforms.px.value.set(1/W,1/H);
  placeCam();
}
function placeCam(){
  const hw=rtW/PPU/2,hh=rtH/PPU/2;Object.assign(cam,{left:-hw,right:hw,top:hh,bottom:-hh});cam.updateProjectionMatrix();
  const t=PITCH*Math.PI/180,y=OPT.yaw*Math.PI/180,R=60;
  // ドットにそろえる：カメラの右・上の向きで、1ドットの倍数に
  cam.position.set(target.x+Math.sin(y)*Math.cos(t)*R,target.y+Math.sin(t)*R,target.z+Math.cos(y)*Math.cos(t)*R);cam.lookAt(target);cam.updateMatrixWorld();
  const r=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0),u=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1);
  const pr=cam.position.dot(r),pu=cam.position.dot(u),q=1/PPU;
  cam.position.addScaledVector(r,Math.round(pr/q)*q-pr).addScaledVector(u,Math.round(pu/q)*q-pu);cam.updateMatrixWorld();
  sun.position.copy(target).addScaledVector(LW,30);sun.target.position.copy(target);sun.target.updateMatrixWorld();
}

// ---- さわる：ドラッグで動かす ----
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=(e.clientX-drag.x)/OPT.dot/PPU,dy=(e.clientY-drag.y)/OPT.dot/PPU;drag={x:e.clientX,y:e.clientY};
  const y=OPT.yaw*Math.PI/180,f=1/Math.sin(PITCH*Math.PI/180);
  target.x-=dx*Math.cos(y)+dy*f*Math.sin(y);target.z-=-dx*Math.sin(y)+dy*f*Math.cos(y);
  target.x=Math.max(0,Math.min(MAPN,target.x));target.z=Math.max(0,Math.min(MAPN,target.z));placeCam()});
cv.addEventListener('pointerup',()=>drag=null);cv.addEventListener('pointercancel',()=>drag=null);

// ---- ボタン ----
function group(label,items,get,set){
  const g=document.createElement('div');g.className='g';g.append(label);
  for(const [txt,v] of items){const b=document.createElement('button');b.textContent=txt;b.onclick=()=>{set(v);saveOpt();refresh()};b.dataset.v=JSON.stringify(v);g.append(b)}
  g.refresh=()=>g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===JSON.stringify(get())));
  $('ctl').append(g);return g;
}
let groups=[];
function refresh(){groups.forEach(g=>g.refresh&&g.refresh())}
function buildUI(){
  groups.push(group('せいれい',[['5',5],['20',20],['50',50],['100',100]],()=>OPT.spirits,v=>{OPT.spirits=v;makeSpirits(v)}));
  groups.push(group('物',[['少し',0],['ふつう',1],['多い',2]],()=>OPT.props,v=>{OPT.props=v;blocked=placeProps(v);makeSpirits(OPT.spirits)}));
  groups.push(group('ドット',[['2',2],['3',3],['4',4]],()=>OPT.dot,v=>{OPT.dot=v;resize()}));
  groups.push(group('形',[['もとのまま',false],['あらく',true]],()=>OPT.low,v=>{OPT.low=v;blocked=placeProps(OPT.props)}));
  groups.push(group('かげ',[['あり',true],['なし',false]],()=>OPT.shadow,v=>{OPT.shadow=v;sun.castShadow=v}));
  const g=document.createElement('div');g.className='g';
  const rb=document.createElement('button');rb.textContent='まわす';rb.onclick=()=>{OPT.yaw=(OPT.yaw+45)%360;saveOpt();placeCam()};
  const mb=document.createElement('button');mb.textContent='10秒はかる';mb.onclick=()=>startMeasure(mb);
  g.append(rb,mb);$('ctl').append(g);
  refresh();
}

// ---- はかる ----
let frames=0,lastT=performance.now(),fps=0,cpuMs=0,cpuAcc=0,meas=null,measRes='';
function gpuName(){try{const gl=renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info');return x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):''}catch(e){return ''}}
function startMeasure(btn){if(meas)return;meas={t0:performance.now(),dts:[],btn};btn.textContent='はかっています…'}
function endMeasure(){
  const d=meas.dts.sort((a,b)=>a-b),n=d.length,avg=d.reduce((a,b)=>a+b,0)/n,slow=d[Math.floor(n*.99)]||avg;
  measRes=`10秒の平均 ${(1000/avg).toFixed(0)}コマ/秒・おそいコマ（1%） ${(1000/slow).toFixed(0)}コマ/秒`;
  meas.btn.textContent='10秒はかる';meas=null;
}
function hud(){
  const i=renderer.info.render;
  $('hud').innerHTML=`<b>${fps.toFixed(0)}</b> コマ/秒　1コマの処理 ${cpuMs.toFixed(1)}ms<br>`+
    `描く回数 ${i.calls}・三角形 ${(i.triangles/1000).toFixed(0)}千・小さい画面 ${rtW}×${rtH}<br>`+
    `せいれい ${sprites.length}体`+(measRes?`<br>${measRes}`:'')+(gpu?`<br><span style="opacity:.6">${gpu}</span>`:'');
}

// ---- まわす ----
let gpu='',prev=performance.now();
function frame(now){
  const dt=Math.min(.1,(now-prev)/1000);prev=now;
  const t0=performance.now();
  stepSpirits(dt);
  uLV.value.copy(LW).transformDirection(cam.matrixWorldInverse);
  renderer.setRenderTarget(rt);renderer.render(scene,cam);
  const info={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  renderer.setRenderTarget(null);renderer.render(postScene,postCam);
  Object.assign(renderer.info.render,info);
  cpuAcc+=performance.now()-t0;frames++;
  if(meas){meas.dts.push(dt*1000);if(now-meas.t0>10000)endMeasure()}
  if(now-lastT>=1000){fps=frames*1000/(now-lastT);cpuMs=cpuAcc/frames;frames=0;cpuAcc=0;lastT=now;hud()}
  requestAnimationFrame(frame);
}

async function main(){
  renderer.info.autoReset=true;
  buildGround();
  await Promise.all([...PROPS.map(loadProp),...ELS.map(loadSpirit)]);
  blocked=placeProps(OPT.props);makeSpirits(OPT.spirits);sun.castShadow=OPT.shadow;
  resize();addEventListener('resize',resize);buildUI();gpu=gpuName();
  $('load').remove();hud();window.__proto3dReady=true;
  requestAnimationFrame(t=>{prev=t;frame(t)});
}
main().catch(showErr);
