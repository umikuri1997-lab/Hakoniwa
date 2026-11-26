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
// 見え方はゲームのクォータービューと同じ（js/iso.js：マスのひし形 IQW 64・IQH 48、段1だん IQL 36 ドット）
const PPU=64/Math.SQRT2;                // 1マスの1辺のドット数（小さい画面の上で。ゲームの点と同じ大きさ）
const PITCH=Math.asin(48/64)*180/Math.PI; // 見おろす角度（ひし形のたて:よこ＝48:64）
const GAMEYAW=45;                       // ゲームの向き（マスの x が右下・y が左下）
const HSTEP=36/(PPU*Math.cos(PITCH*Math.PI/180)); // 段差1つの高さ（マス）：画面で36ドットになる高さ
const MAPN=24;         // マップのはば（マス）
const SPH=.85;         // せいれいの高さ（マス）
const WALK=1.2;        // せいれいの歩く速さ（マス/秒）
// かげ（furntone.py と同じ数）：(明るさ, あざやかさ) の足し算（%）
const TONE={deep:[0,20],shade:[0,10],base:[0,0],hi:[0,-5],hi2:[0,-10],line:[-38,10]};
const CUTS=[-.2,.4,.88,.97];
const LIGHT=[-.6,-.5,.8];  // 画面の向き（右・下・手前）
const AMB=.5,SUN=.6;       // 明かり（かげの所かどうかを見分けるのに使う）
const OUTLINE_DEPTH=.004;  // 輪郭にする奥行きの差（0〜1の奥行き）
const LOWKEEP=.25;         // 形をあらくするとき、のこす点のわりあい
const GSHADOW=[40,46,104,.22];  // ほかの物のかげの色（ゲームの足もとのかげ shadow() と同じ）
const VIG={a:.3,r0:.42,r1:.78,col:[24,20,36]}; // 四すみの暗さ（ゲームの HD-2D の HDVIG・HDVIGR と同じ）
const SPR_LIFT=.5;         // 立てた木の絵を、カメラのほうへ出す量（マス。下のはしが地面にうまらないように）
// 色
const SPCOL={body:'#fdf8ef',eye:'#5a4038',cheek:'#f4a7a0',
  earth:{hood:'#8f6a50',acc:'#8bc34a'},water:{hood:'#78c3fb'},fire:{hood:'#e8604f'},wind:{hood:'#c8e2b4',acc:'#9ccf7a'},wood:{hood:'#6fae4c'}};
const ELS=['earth','water','fire','wind','wood'];
// 木は、ゲームのクォータービューの絵（チップ）を立てる（HD-2D と同じやり方）。足もとには、その木のかげの絵（:sh）をしく
const TREES=[{k:'tree',n:[6,14,30]},{k:'tree~m',n:[2,4,8]},{k:'tree~v',n:[2,4,8]},{k:'maple~m',n:[1,2,4]}];
// 置く物：モデル・高さ（マス）・物の数（少し・ふつう・多い）
const PROPS=[
  {id:'nat_bush',h:.6,n:[4,10,24],kind:'small'},{id:'berrybush',h:.6,n:[3,8,18],kind:'small'},
  {id:'grass',h:.35,n:[16,50,130],kind:'tiny'},{id:'clover',h:.3,n:[8,25,60],kind:'tiny'},{id:'bellflower',h:.4,n:[8,25,60],kind:'tiny'},
  {id:'rock',h:.3,n:[3,6,12],kind:'small'},{id:'stone_big',h:.45,n:[2,4,8],kind:'small'},
  {id:'lantern',h:.7,n:[2,3,4],kind:'item'},{id:'sack',h:.5,n:[2,3,4],kind:'item'},{id:'firewood',h:.4,n:[1,2,3],kind:'item'},{id:'stump',h:.4,n:[2,3,5],kind:'item'},
  {id:'log_lying',h:.35,n:[1,2,3],kind:'item'},{id:'jar_band',h:.5,n:[1,2,3],kind:'item'},{id:'wateringcan',h:.35,n:[1,1,2],kind:'item'}];

const $=id=>document.getElementById(id);
const showErr=e=>{const b=$('err');b.style.display='block';b.textContent+=String(e&&e.stack||e)+'\n'};
addEventListener('error',e=>showErr(e.error||e.message));addEventListener('unhandledrejection',e=>showErr(e.reason));

// ---- 設定（ボタン） ----
const OPT={dot:1,spirits:20,props:1,shadow:true,yaw:GAMEYAW,low:false};
try{Object.assign(OPT,JSON.parse(localStorage.getItem('hakoniwa-proto3d3')||'{}'))}catch(e){}
const saveOpt=()=>{try{localStorage.setItem('hakoniwa-proto3d3',JSON.stringify(OPT))}catch(e){}};

// ---- しかけ ----
const cv=$('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,3));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#7fa66b'); // ゲームの地図の外の色（index.html の html の背景）
const cam=new THREE.OrthographicCamera(-1,1,1,-1,30,100);
const target=new THREE.Vector3(MAPN/2,0,MAPN/2);
scene.add(new THREE.AmbientLight(0xffffff,AMB));
const sun=new THREE.DirectionalLight(0xffffff,SUN);
sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:80});
sun.shadow.bias=-.002;scene.add(sun,sun.target);

// 光の向き（せかい）：見おろしの角度で、画面の向きの光をせかいの向きにする（furntone.worldlight と同じ考え）。カメラをまわしても光はかわらない
function worldLight(){
  const t=PITCH*Math.PI/180,y=GAMEYAW*Math.PI/180,D=new THREE.Vector3(-Math.sin(y)*Math.cos(t),-Math.sin(t),-Math.cos(y)*Math.cos(t)); // ゲームの向きのカメラの見る向き
  const X=new THREE.Vector3(Math.cos(y),0,-Math.sin(y)),U=new THREE.Vector3().crossVectors(X,D).normalize(); // 画面の上
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
  bool tnSh=getShadowMask()<.5; // ほかの物のかげの中
  int tnB=tnD<${CUTS[0]}?0:tnD<${CUTS[1]}?1:tnD<${CUTS[2]}?2:tnD<${CUTS[3]}?3:4;  // 0 こいかげ・1 かげ・2 もとの色・3 ハイライト・4 明るいハイライト
  vec2 tnS=tnB==0?vec2(${TONE.deep}):tnB==1?vec2(${TONE.shade}):tnB==2?vec2(${TONE.base}):tnB==3?vec2(${TONE.hi}):vec2(${TONE.hi2});
  vec3 tnC=tnShift(tnBase,tnS);
  if(tnSh){vec3 s=pow(tnC,vec3(1./2.2));s=mix(s,vec3(${GSHADOW.slice(0,3).map(v=>(v/255).toFixed(4))}),${GSHADOW[3]});tnC=pow(s,vec3(2.2));}
  gl_FragColor=vec4(tnC,diffuseColor.a);
}`;
function toneMat(o={}){
  const m=new THREE.MeshLambertMaterial(o);
  m.onBeforeCompile=sh=>{
    sh.uniforms.uLV=uLV;
    sh.fragmentShader=GLSL_TONE+sh.fragmentShader
      .replace('void main() {','#include <shadowmask_pars_fragment>\nvoid main() {')
      .replace('#include <opaque_fragment>',toneFrag);
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

// 地面の絵は、ゲームのチップ（proto3d/make_tex.py で切り出す）。ゲームは1マス64ドット
const TEXL=new THREE.TextureLoader();
function gameTex(name,rep){
  const t=TEXL.load('./tex/'+name+'.png');t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapNearestFilter;return t;
}
// 絵1まいが何マスぶんか：草・水は上から見た絵（1マス32ドット）で 224・128 ドット。道は1マスに1つ。がけの絵は画面の64ドット
const TEXTILE={grass:224/32,water:128/32,path:1,cliffU:64/PPU,cliffV:64/36};
function buildGround(){
  const G={grass:{p:[],n:[],u:[]},path:{p:[],n:[],u:[]},cliff:{p:[],n:[],u:[]}};
  const quad=(D,vs,n,uv)=>{for(const i of [0,1,2,0,2,3]){D.p.push(...vs[i]);D.n.push(...n);D.u.push(...uv[i])}};
  for(let z=0;z<MAPN;z++)for(let x=0;x<MAPN;x++){
    const k=KIND[z][x],y=yTop(x,z),T=TEXTILE.grass;
    if(k==='p'){const v=(x*7+z*3)%4;quad(G.path,[[x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z]],[0,1,0],[[v/4,0],[(v+1)/4,0],[(v+1)/4,1],[v/4,1]])}
    else if(k==='g')quad(G.grass,[[x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z]],[0,1,0],[[x/T,-(z+1)/T],[(x+1)/T,-(z+1)/T],[(x+1)/T,-z/T],[x/T,-z/T]]);
    // 横の面：となりが低い所（がけの土のだん。1だんに絵1まい）
    const side=[[0,1,[x,y,z+1],[x+1,y,z+1],[0,0,1]],[0,-1,[x+1,y,z],[x,y,z],[0,0,-1]],[1,0,[x+1,y,z+1],[x+1,y,z],[1,0,0]],[-1,0,[x,y,z],[x,y,z+1],[-1,0,0]]];
    for(const [dx,dz,A,B,n] of side){
      const nx=x+dx,nz=z+dz;const ny=(nx<0||nz<0||nx>=MAPN||nz>=MAPN)?-1.2:yTop(nx,nz);
      if(ny>=y-1e-4)continue;
      const v0=-ny/HSTEP/TEXTILE.cliffV,v1=-y/HSTEP/TEXTILE.cliffV,u0=(A[0]+A[2])/TEXTILE.cliffU,u1=(B[0]+B[2])/TEXTILE.cliffU;
      quad(G.cliff,[[A[0],ny,A[2]],[B[0],ny,B[2]],[B[0],y,B[2]],[A[0],y,A[2]]],n,[[u0,v0],[u1,v0],[u1,v1],[u0,v1]]);
    }
  }
  const out={};
  for(const [name,D] of Object.entries(G)){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(D.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(D.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(D.u,2));
    const m=new THREE.Mesh(g,toneMat({map:gameTex(name)}));m.receiveShadow=true;m.castShadow=name==='cliff';scene.add(m);out[name]=m;
  }
  // 池の水（ゲームの水の絵）
  const wg=new THREE.CircleGeometry(2.6,32);wg.rotateX(-Math.PI/2);
  const uv=wg.getAttribute('uv'),pp=wg.getAttribute('position');
  for(let i=0;i<uv.count;i++)uv.setXY(i,(pp.getX(i)+5)/TEXTILE.water,-(pp.getZ(i)+18.5)/TEXTILE.water);
  const w=new THREE.Mesh(wg,toneMat({map:gameTex('water')}));w.position.set(5,-.08,18.5);w.receiveShadow=true;
  scene.add(w);out.water=w;
  return out;
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
    if(!geo.getAttribute('normal'))geo.computeVertexNormals();
    cleanColors(geo);
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
  for(const t of TREES)for(let i=0,tries=0;i<t.n[level]&&tries<400;tries++){
    const x=Math.floor(rnd()*MAPN),z=Math.floor(rnd()*MAPN),key=x+','+z;
    if(!free(x,z)||used.has(key)||hAt(x,z+1)<hAt(x,z)||hAt(x+1,z)<hAt(x,z))continue; // がけのふちには木を植えない
    used.add(key);propMeshes.push(...treeSprite(t.k,x,z));i++;
  }
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S=new THREE.Vector3();
  for(const p of PROPS){
    const n=p.n[level],mats=[];
    for(let i=0,tries=0;i<n&&tries<n*40;tries++){
      const x=Math.floor(rnd()*MAPN),z=Math.floor(rnd()*MAPN);if(!free(x,z))continue;
      const big=p.kind==='item';const key=x+','+z;if(big&&used.has(key))continue;
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

// ---- 木の絵 ----
const SPR={};  // チップの名前 → {tex, ax, ay, w, h}
async function loadSprites(){
  const meta=await (await fetch('./tex/sprites.json')).json();
  await Promise.all(Object.entries(meta).map(async([k,m])=>{const t=await TEXL.loadAsync('./tex/'+m.f);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;SPR[k]={...m,tex:t}}));
}
// 立てた絵の画素は、小さい画面のアルファを .5 にして、輪郭をつけない印にする（ゲームの絵には輪郭がもうある）
function sprMat(tex){const m=new THREE.SpriteMaterial({map:tex,alphaTest:.5,transparent:false});
  m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>','gl_FragColor=vec4(outgoingLight,.5);')};return m}
const camDir=()=>{const y=OPT.yaw*Math.PI/180,t=PITCH*Math.PI/180;return new THREE.Vector3(Math.sin(y)*Math.cos(t),Math.sin(t),Math.cos(y)*Math.cos(t))}; // カメラのほう
function treeSprite(k,x,z){
  const S=SPR[k],H=SPR[k+':sh'],gy=yTop(x,z),at=new THREE.Vector3(x+.5,gy,z+.5);
  const sp=new THREE.Sprite(sprMat(S.tex));sp.center.set(-S.ax/S.w,1+S.ay/S.h);sp.scale.set(S.w/PPU,S.h/PPU,1);
  sp.position.copy(at).addScaledVector(camDir(),SPR_LIFT);
  // かげの絵：画面の絵を、地面の上の四角にもどして写す（右へ1ドット＝カメラの右へ1/PPU、下へ1ドット＝地面の手前へ 1/PPU/sin(見おろし)）
  const y=OPT.yaw*Math.PI/180,Rt=new THREE.Vector3(Math.cos(y),0,-Math.sin(y)),Dn=new THREE.Vector3(Math.sin(y),0,Math.cos(y)).multiplyScalar(1/Math.sin(PITCH*Math.PI/180));
  const P=(sx,sy)=>at.clone().addScaledVector(Rt,sx/PPU).addScaledVector(Dn,sy/PPU).setY(gy+.01);
  const x0=H.ax,y0=H.ay,x1=H.ax+H.w,y1=H.ay+H.h,g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([P(x0,y1),P(x1,y1),P(x1,y0),P(x0,y1),P(x1,y0),P(x0,y0)].flatMap(v=>v.toArray()),3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));
  const sh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:H.tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));
  sh.renderOrder=1;scene.add(sp,sh);return [sp,sh];
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
      vec2 uv=(floor(vUv/px)+.5)*px;vec4 c=sRGBTransferOETF(texture2D(tC,uv));float d=texture2D(tD,uv).x;
      float n=max(max(texture2D(tD,uv+vec2(px.x,0.)).x,texture2D(tD,uv-vec2(px.x,0.)).x),max(texture2D(tD,uv+vec2(0.,px.y)).x,texture2D(tD,uv-vec2(0.,px.y)).x));
      if(c.a>.75 && n-d>${OUTLINE_DEPTH}){vec3 h=tnRgb2hsv(c.rgb);h.z=clamp(h.z+${TONE.line[0]}./100.,0.,1.);h.y=clamp(h.y+${TONE.line[1]}./100.,0.,1.);c.rgb=tnHsv2rgb(h);}
      vec2 q=(vUv-.5)/px;float r=length(q)/(.5*length(1./px));
      c.rgb=mix(c.rgb,vec3(${VIG.col.map(v=>(v/255).toFixed(4))}),${VIG.a}*clamp((r-${VIG.r0})/(${VIG.r1}-${VIG.r0}),0.,1.)); // 四すみを暗く
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
  groups.push(group('ドット',[['1',1],['2',2],['3',3]],()=>OPT.dot,v=>{OPT.dot=v;resize()}));
  groups.push(group('形',[['もとのまま',false],['あらく',true]],()=>OPT.low,v=>{OPT.low=v;blocked=placeProps(OPT.props)}));
  groups.push(group('かげ',[['あり',true],['なし',false]],()=>OPT.shadow,v=>{OPT.shadow=v;sun.castShadow=v}));
  const g=document.createElement('div');g.className='g';
  const rb=document.createElement('button');rb.textContent='まわす';rb.onclick=()=>{OPT.yaw=(OPT.yaw+45)%360;saveOpt();placeCam();blocked=placeProps(OPT.props)};
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
  await Promise.all([...PROPS.map(loadProp),...ELS.map(loadSpirit),loadSprites()]);
  blocked=placeProps(OPT.props);makeSpirits(OPT.spirits);sun.castShadow=OPT.shadow;
  resize();addEventListener('resize',resize);buildUI();gpu=gpuName();
  $('load').remove();hud();window.__proto3dReady=true;
  requestAnimationFrame(t=>{prev=t;frame(t)});
}
main().catch(showErr);
