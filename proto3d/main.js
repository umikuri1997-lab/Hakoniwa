/* はこにわ 3Dの試作：ゲームと同じ見た目で、地面・段差は3Dの形、せいれい・小物は3Dのモデルで描いて、重さをはかる（ゲームとはべつのページ）。
   - 見え方はゲームのクォータービュー（js/iso.js：ひし形 64×48・段1だん36ドット）。カメラは回さない。
   - 地面（草・あれ地・道・池・がけ）は、ゲームそのものに描かせた絵（bake_ground.cjs → tex/ground.webp）を、画面の向きから3Dの地面にはる。
   - 植物（木・しげみ・花と草）は持ち主のモデル（tools/art/models/plants/plants.glb）。make_plants.py が植物ごとに分けて部品ごとに色をぬる（tex/plants.glb）。
   - せいれいは持ち主のモデル（tools/art/spirit3d/model/*.fbx）。色・かげ・輪郭はゲームの絵を写す道具（fbx_pixel.py）と同じ数：
     画面の向きの光で3だん、明るさはかえず彩度だけ、まわりに1ドットの輪郭（となりの色×0.72）。見おろしは25度（体を奥へたおす）。
     ゲームと同じく、せいれいだけは画面の細かい点で描く（地面と物は、ゲームの1ドットの大きさ）。
   - 岩・小物はトリポのモデル。植物・岩・小物のかげは、ゲームの木・岩と同じ5色のかげ（natcommon.tone5）の数。同じ物は、まとめて1回で描く（InstancedMesh）。
   - 画面のしあげはゲームの HD-2D（js/hd2d.js）と同じ数：時間の光の色・空気の遠近・四すみの暗さ・明るい所のにじみ。 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const TRIPO='../tools/art/models/tripo/', SPDIR='../tools/art/spirit3d/model/';
// 見え方（js/iso.js と同じ）
const IQW=64,IQH=48,IQL=36;
const PPU=IQW/Math.SQRT2;                       // 1マスの1辺のドット数
const PITCH=Math.asin(IQH/IQW);                 // 見おろす角度（ラジアン）
const YAW=Math.PI/4;                            // マスの x が右下・y（z）が左下
const HSTEP=IQL/(PPU*Math.cos(PITCH));          // 段差1つの高さ（マス）
const RT=new THREE.Vector3(Math.cos(YAW),0,-Math.sin(YAW));                     // 画面の右
const CAMDIR=new THREE.Vector3(Math.sin(YAW)*Math.cos(PITCH),Math.sin(PITCH),Math.cos(YAW)*Math.cos(PITCH)); // カメラのほう
const BORDER=14;        // 地形のまわりに足す、平らなあれ地（マス）
// せいれい（fbx_pixel.py と同じ数）
const SPH=.8;           // 高さ（マス）
const SPELEV=25;        // せいれいの見おろし（度）
const WALK=1.2;         // 歩く速さ（マス/秒）
const SPLIGHT=[-.5,.6,.62];                     // 光（画面の右・上・手前）
const SPCUT=[.35,-.1];                          // かげのだんのさかい（光との内積）
const SPSAT={head:[.10,.20,.03,.06],body:[.06,.12,.02,.04]}; // 彩度の足し算：かげ・こいかげ・白っぽい色のおまけ（かげ・こいかげ）
const SPLINE=.72;       // 輪郭：となりの色×0.72
const SPSHADOW={r:.31,k:.33};                   // 足もとのかげ：半径（マス）・たて/よこ
const CREAM='#fdf8ef';
const SPCOL={
  earth:{hood:'#8f6a50',cheek:'#c6b1a0',eye:'#5e3d2a'},water:{hood:'#78c3fb',cheek:'#badef5',eye:'#1d4f7c'},fire:{hood:'#e8604f',cheek:'#f2ac9f',eye:'#8f3a22'},
  wind:{hood:'#a6cc8a',cheek:'#d2e2bc',eye:'#456a2a'},wood:{hood:'#6fae4c',cheek:'#b6d39e',eye:'#3f5e26'}};
const SPROUT='#5e8f43',HEADACC='#e8cdb0';
const FIRE=[[255,84,48],[255,150,40],[255,226,92]]; // 火のずきん：外がわ・中・こちらを向く所
const ELS=['earth','water','fire','wind','wood'];
// 物のかげ（tools/art/furn3d/items/natcommon.py の tone5 と同じ数）：(明るさ, あざやかさ) の足し算（%）
const TONE={deep:[-28,8],shade:[-15,4],base:[0,0],hi:[10,-4],hi2:[19,-8],line:[-38,10]};
const CUTQ=[.12,.35,.72,.92];   // だんのさかい：見える面の、太陽との内積の順の割合（tone5 の cuts と同じ）。物ごとに、読みこむときに内積の数にする
// 太陽（natcommon.SUN：高さ30度・正面から左へ8度）。ゲームの x 東 → x・y 南 → z・上 → y
const SUNEL=30*Math.PI/180,SUNAZ=8*Math.PI/180;
const AMB=.5,SUN=.6;
const OUTLINE_DEPTH=.004;      // 物の輪郭にする奥行きの差（0〜1の奥行き）
const LOWKEEP=.25;             // 形をあらくするとき、のこす点のわりあい
const GSHADOW=[40,46,104,.22]; // かげの色（ゲームの足もとのかげ shadow() と同じ）
// 画面のしあげ（js/hd2d.js と同じ数）
const HD={air:.16,airCol:[200,216,236],airH:.55,vig:.3,vigR:[.42,.78],vigCol:[24,20,36],glow:.48,a:6,b:12};
// 置く物：モデル・高さ（マス）・数（少し・ふつう・多い）
// 植物（plants の名前：T 木・B しげみ・F 花と草）。木は1マスに1本、がけのふちには植えない
const PLANT=(id,h,n,kind)=>({id,h,n,kind,src:'plants'});
const PROPS=[
  ...['T0','T2','T3','T4','T5','T6','T8','T9'].map(id=>PLANT(id,1.9,[1,2,4],'tree')),PLANT('T1',2.2,[1,2,3],'tree'),PLANT('T7',2.2,[0,1,2],'tree'),
  ...['B0','B1','B2'].map(id=>PLANT(id,.7,[2,4,9],'small')),
  ...['F0','F1','F2','F3','F4','F5','F6','F7','F8','F9'].map(id=>PLANT(id,.45,[2,6,14],'tiny')),
  // トリポのモデル：mat＝材質（ゲームの家具の設計図のように、物ごとにきめる）
  {id:'rock',h:.3,n:[3,6,12],kind:'small',mat:'stone'},{id:'stone_big',h:.45,n:[2,4,8],kind:'small',mat:'stone'},
  {id:'lantern',h:.7,n:[2,3,4],kind:'item',mat:'metal'},{id:'sack',h:.5,n:[2,3,4],kind:'item',mat:'cloth'},{id:'firewood',h:.4,n:[1,2,3],kind:'item',mat:'bark'},{id:'stump',h:.4,n:[2,3,5],kind:'item',mat:'bark'},
  {id:'log_lying',h:.35,n:[1,2,3],kind:'item',mat:'bark'},{id:'jar_band',h:.5,n:[1,2,3],kind:'item',mat:'stone'},{id:'wateringcan',h:.35,n:[1,1,2],kind:'item',mat:'metal'}];
// 材質（ゲームの道具の oblique3d.Tex と同じもよう。make_textures.py が tex/m_<名前>.png を作る）。番号は点の値 _mat
const MATIDX={wood:1,stone:2,metal:3,cloth:4,bark:5};
const SHINY={cut:.95,dv:34,ds:-40};  // 金属のつや（oblique3d の SHINYSPEC・SHINYSHINE）：光と目のあいだの向きとの内積がこれより大きい所
// 小さい画面のアルファにつける印（輪郭のつけ方を分ける）
const TAG={ground:1,prop:.75};

const $=id=>document.getElementById(id);
const showErr=e=>{const b=$('err');b.style.display='block';b.textContent+=String(e&&e.stack||e)+'\n'};
addEventListener('error',e=>showErr(e.error||e.message));addEventListener('unhandledrejection',e=>showErr(e.reason));
const f3=a=>a.slice(0,3).map(v=>(v/255).toFixed(4)).join(',');

// ---- 設定（ボタン） ----
const OPT={zoom:3,spirits:20,props:1,shadow:true,low:false};
try{Object.assign(OPT,JSON.parse(localStorage.getItem('hakoniwa-proto3d4')||'{}'))}catch(e){}
const saveOpt=()=>{try{localStorage.setItem('hakoniwa-proto3d4',JSON.stringify(OPT))}catch(e){}};

// ---- しかけ ----
const cv=$('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});
const PR=Math.min(devicePixelRatio||1,3);
renderer.setPixelRatio(PR);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;renderer.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();
const BG=new THREE.Color('#7fa66b'); // ゲームの地図の外の色
const cam=new THREE.OrthographicCamera(-1,1,1,-1,30,100);
let MAPN=24;const target=new THREE.Vector3(12,0,12);
const amb=new THREE.AmbientLight(0xffffff,AMB),sun=new THREE.DirectionalLight(0xffffff,SUN);
amb.layers.enable(1);sun.layers.enable(1);
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:90});
sun.shadow.bias=-.002;scene.add(amb,sun,sun.target);

// 物の光の向き（せかい）：太陽は、画面の正面（手前）から左へ SUNAZ・高さ SUNEL（natcommon.SUN・sunscreen と同じ考え。カメラの向きから）
const LW=(()=>{const F=new THREE.Vector3(CAMDIR.x,0,CAMDIR.z).normalize();
  return new THREE.Vector3().addScaledVector(RT,-Math.cos(SUNEL)*Math.sin(SUNAZ)).addScaledVector(F,Math.cos(SUNEL)*Math.cos(SUNAZ)).add(new THREE.Vector3(0,Math.sin(SUNEL),0)).normalize()})();
const uLV={value:new THREE.Vector3()};

// ---- マテリアル ----
const GLSL_HSV=`
vec3 tnRgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x);}
vec3 tnHsv2rgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
vec3 tnShift(vec3 lin,vec2 dvs){vec3 h=tnRgb2hsv(pow(max(lin,0.),vec3(1./2.2)));h.z=clamp(h.z+dvs.x/100.,0.,1.);h.y=clamp(h.y+dvs.y/100.,0.,1.);return pow(tnHsv2rgb(h),vec3(2.2));}
`;
// 物・地面：5色のかげ（flat：地面。ゲームの絵をそのまま出し、ほかの物のかげだけかさねる）。
// cuts：だんのさかい（太陽との内積。objCuts）。点の値 _under：葉の下のかげ（暗くするだんの数）・_flat：葉の部品（色をそのまま）・_mat：材質（MATIDX）。
// ax：材質のもようの流れる向き（物の座標。oblique3d は部品のいちばん長い向き）
const MATT={},uMat={value:[]},uMatK={value:[]};  // もようの絵・(1まいのマス, こい所にかける数, 明るい所にかける数)
function toneMat(o={},flat=false,cuts=[0,0,0,0],ax=[0,1,0]){
  const m=new THREE.MeshLambertMaterial(o),uCuts={value:new THREE.Vector4(...cuts)},uAx={value:new THREE.Vector3(...ax).normalize()};
  m.onBeforeCompile=sh=>{
    sh.uniforms.uLV=uLV;sh.uniforms.uCuts=uCuts;sh.uniforms.uAx=uAx;sh.uniforms.uMat=uMat;sh.uniforms.uMatK=uMatK;
    sh.vertexShader='attribute float _under,_flat,_mat;varying float vUnder,vFlat,vMat;varying vec3 vOP,vON;\n'+sh.vertexShader.replace('void main() {','void main() {\nvUnder=_under;vFlat=_flat;vMat=_mat;vOP=position;vON=normal;');
    sh.fragmentShader='uniform vec3 uLV,uAx;uniform vec4 uCuts;uniform sampler2D uMat[5];uniform vec3 uMatK[5];varying float vUnder,vFlat,vMat;varying vec3 vOP,vON;\n'+GLSL_HSV+`
float tnTex(int k,vec2 uv){return k==0?texture2D(uMat[0],uv).r:k==1?texture2D(uMat[1],uv).r:k==2?texture2D(uMat[2],uv).r:k==3?texture2D(uMat[3],uv).r:texture2D(uMat[4],uv).r;}
`+sh.fragmentShader
      .replace('void main() {','#include <shadowmask_pars_fragment>\nvoid main() {')
      .replace('#include <opaque_fragment>',`{
  vec3 tnC=diffuseColor.rgb;
  int tnM=int(vMat+.5)-1;
  if(tnM>=0){ // 材質のもよう：部品ののびる向き uAx にそって、明るさを3だん（oblique3d.Tex と同じ）
    vec3 n=normalize(vON),v2=cross(n,uAx);if(length(v2)<.3)v2=cross(n,vec3(0.,1.,0.));v2=normalize(v2);
    vec3 k=tnM==0?uMatK[0]:tnM==1?uMatK[1]:tnM==2?uMatK[2]:tnM==3?uMatK[3]:uMatK[4];
    float t=tnTex(tnM,vec2(dot(vOP,uAx),dot(vOP,v2))/k.x);
    vec3 s=pow(tnC,vec3(1./2.2))*(t<.25?k.y:t>.75?k.z:1.);tnC=pow(min(s,vec3(1.)),vec3(2.2));
  }
  ${flat?'':`if(vFlat<.5){float tnD=dot(normalize(normal),normalize(uLV));
  float tnF=tnD<uCuts.x?0.:tnD<uCuts.y?1.:tnD<uCuts.z?2.:tnD<uCuts.w?3.:4.;
  int tnB=int(clamp(floor(tnF-vUnder+.5),0.,4.));
  vec2 tnS=tnB==0?vec2(${TONE.deep}):tnB==1?vec2(${TONE.shade}):tnB==2?vec2(${TONE.base}):tnB==3?vec2(${TONE.hi}):vec2(${TONE.hi2});
  tnC=tnShift(tnC,tnS);
  if(tnM==${MATIDX.metal-1}&&dot(normalize(normal),normalize(uLV+vec3(0.,0.,1.)))>${SHINY.cut})tnC=tnShift(tnC,vec2(${SHINY.dv},${SHINY.ds}));}`}
  if(getShadowMask()<.5){vec3 s=pow(tnC,vec3(1./2.2));s=mix(s,vec3(${f3(GSHADOW)}),${GSHADOW[3]});tnC=pow(s,vec3(2.2));}
  gl_FragColor=vec4(tnC,${flat?TAG.ground.toFixed(2):TAG.prop.toFixed(2)});
}`);
  };
  m.customProgramCacheKey=()=>'tone'+flat;
  return m;
}
// せいれい：細かい画面に描く。奥行きは、小さい画面（地面・物）の奥行きとくらべて、うしろならけす
const uLowD={value:null},uHiRes={value:new THREE.Vector2(1,1)};
const depthCut=sh=>{sh.uniforms.uLowD=uLowD;sh.uniforms.uHiRes=uHiRes;
  sh.fragmentShader='uniform sampler2D uLowD;uniform vec2 uHiRes;\n'+sh.fragmentShader.replace('void main() {','void main() {\nif(gl_FragCoord.z>texture2D(uLowD,gl_FragCoord.xy/uHiRes).x+.0015)discard;')};
function spMat(color,part,mode){ // part：head・body（かげのゆるさ）。mode：''・'water'（つやの点）・'fire'（光る色）
  const m=new THREE.MeshLambertMaterial({color}),A=SPSAT[part],L=new THREE.Vector3(...SPLIGHT).normalize(),HV=L.clone().add(new THREE.Vector3(0,0,1)).normalize();
  const v3=v=>v.toArray().map(x=>x.toFixed(5)).join(',');
  m.onBeforeCompile=sh=>{depthCut(sh);
    sh.fragmentShader=GLSL_HSV+sh.fragmentShader.replace('#include <opaque_fragment>',`{
  vec3 n=normalize(normal);float dl=dot(n,vec3(${v3(L)}));
  vec3 h=tnRgb2hsv(pow(diffuseColor.rgb,vec3(1./2.2)));bool pale=h.y<.08;
  if(dl<=${SPCUT[1].toFixed(2)})h.y+=${A[1].toFixed(2)}+(pale?${A[3].toFixed(2)}:0.);else if(dl<=${SPCUT[0].toFixed(2)})h.y+=${A[0].toFixed(2)}+(pale?${A[2].toFixed(2)}:0.);
  h.y=min(1.,h.y);vec3 c=tnHsv2rgb(h);
  ${mode==='water'?`if(dot(n,vec3(${v3(HV)}))>.996)c=vec3(1.);`:''}
  ${mode==='fire'?`{float t=clamp(n.z,0.,1.);vec3 e=vec3(${f3(FIRE[0])}),m=vec3(${f3(FIRE[1])}),k=vec3(${f3(FIRE[2])});c=t<.55?mix(e,m,t/.55):mix(m,k,(t-.55)/.45);}`:''}
  gl_FragColor=vec4(pow(c,vec3(2.2)),1.);
}`)};
  m.customProgramCacheKey=()=>'sp'+part+mode;return m;
}
function spFlat(color){const m=new THREE.MeshBasicMaterial({color});m.onBeforeCompile=depthCut;m.customProgramCacheKey=()=>'spflat';return m}
// ブレンドしても、アルファの印をかえない（かげの絵）
const keepAlpha={blending:THREE.CustomBlending,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor,transparent:true,depthWrite:false};

// ---- 地図（ゲームに描かせた地面） ----
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
let HM=[],KIND=[],GRASS=[],GIMG=null;
const TEXL=new THREE.TextureLoader();
const inMap=(x,z)=>x>=0&&z>=0&&x<MAPN&&z<MAPN;
const hAt=(x,z)=>inMap(x,z)?HM[z][x]:0;
const yTop=(x,z)=>hAt(x,z)*HSTEP;
async function loadGround(){
  GIMG=await (await fetch('./tex/ground.json')).json();MAPN=GIMG.n;HM=GIMG.hm;KIND=GIMG.kind;GRASS=GIMG.grass;target.set(MAPN/2,0,MAPN/2);
  const tex=await TEXL.loadAsync('./tex/ground.webp');tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
  // せかいの点 → 絵の中の場所（ゲームの式：isoX・isoY・段の高さ IQL）
  const uv=(x,y,z)=>[(GIMG.ox+(x-z)*IQW/2)/GIMG.w,1-(GIMG.oy+(x+z)*IQH/2-y/HSTEP*IQL)/GIMG.h];
  const P=[],N=[],U=[];
  const quad=(vs,n)=>{for(const i of [0,1,2,0,2,3]){P.push(...vs[i]);N.push(...n);U.push(...uv(...vs[i]))}};
  for(let z=-BORDER;z<MAPN+BORDER;z++)for(let x=-BORDER;x<MAPN+BORDER;x++){
    const y=yTop(x,z);quad([[x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z]],[0,1,0]);
    for(const [dx,dz,A,B,n] of [[0,1,[x,y,z+1],[x+1,y,z+1],[0,0,1]],[0,-1,[x+1,y,z],[x,y,z],[0,0,-1]],[1,0,[x+1,y,z+1],[x+1,y,z],[1,0,0]],[-1,0,[x,y,z],[x,y,z+1],[-1,0,0]]]){
      const ny=yTop(x+dx,z+dz);if(ny>=y-1e-4)continue;
      quad([[A[0],ny,A[2]],[B[0],ny,B[2]],[B[0],y,B[2]],[A[0],y,A[2]]],n);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  const m=new THREE.Mesh(g,toneMat({map:tex},true));m.receiveShadow=true;m.castShadow=true;scene.add(m);
  sun.position.copy(target).addScaledVector(LW,40);sun.target.position.copy(target);sun.target.updateMatrixWorld();
}

// ---- モデル ----
const gltf=new GLTFLoader(),fbx=new FBXLoader();
// トリポのモデルの色：くらい色・色むらをへらし、あざやかに（tools/art/blueprint.py の model_tris と同じ式。sRGB の HSV で、
// 明るさ V はならした明るさ vm との差を0.4倍にして .6〜1 に、あざやかさ S は ×1.12+.04）
function cleanColors(geo){
  const a=geo.getAttribute('color');if(!a)return;const c=new THREE.Color(),H=[];let vm=0;
  for(let i=0;i<a.count;i++){c.fromBufferAttribute(a,i).convertLinearToSRGB();const mx=Math.max(c.r,c.g,c.b),mn=Math.min(c.r,c.g,c.b),d=mx-mn;
    let h=0;if(d>0)h=mx===c.r?((c.g-c.b)/d+6)%6:mx===c.g?(c.b-c.r)/d+2:(c.r-c.g)/d+4;H.push([h/6,mx>0?d/mx:0,mx]);vm+=mx}
  vm/=a.count;
  for(let i=0;i<a.count;i++){let [h,s,v]=H[i];v=Math.min(1,Math.max(.6,vm+(v-vm)*.4));s=Math.min(1,Math.max(0,s*1.12+.04));
    const k=n=>{const t=(n+h*6)%6;return v-v*s*Math.max(0,Math.min(t,4-t,1))};c.setRGB(k(5),k(3),k(1)).convertSRGBToLinear();a.setXYZ(i,c.r,c.g,c.b)}
  a.needsUpdate=true;
}
// だんのさかい：見える面（カメラを向いた面。面積×向きの重み。置くときにまわすので、8つの向きをまぜる）の、太陽との内積の順で CUTQ の所
function objCuts(geo){
  const P=geo.getAttribute('position'),I=geo.index,n=I?I.count/3:P.count/3,ds=[],ws=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),N=new THREE.Vector3();
  const vi=k=>I?I.getX(k):k,FL=geo.getAttribute('_flat');
  for(let r=0;r<8;r++){const q=r*Math.PI/4,cs=Math.cos(q),sn=Math.sin(q);
    for(let t=0;t<n;t++){a.fromBufferAttribute(P,vi(3*t));b.fromBufferAttribute(P,vi(3*t+1));c.fromBufferAttribute(P,vi(3*t+2));
      if(FL&&FL.getX(vi(3*t))>.5)continue; // 葉の部品は、かげをつけなおさないので数えない
      N.subVectors(b,a).cross(c.sub(a));const ar=N.length();if(!(ar>0))continue;N.divideScalar(ar);N.set(N.x*cs+N.z*sn,N.y,-N.x*sn+N.z*cs);
      const v=N.dot(CAMDIR);if(v<=0)continue;ds.push(N.dot(LW));ws.push(v*ar)}}
  const o=ds.map((_,i)=>i).sort((i,j)=>ds[i]-ds[j]),tot=ws.reduce((x,y)=>x+y,0);let acc=0,k=0;const out=[];
  for(const i of o){acc+=ws[i];while(k<CUTQ.length&&acc>=CUTQ[k]*tot){out.push(ds[i]);k++}}
  while(out.length<4)out.push(1);return out;
}
let PLANTS=null;
async function loadProp(p){
  let root;
  if(p.src==='plants'){PLANTS=PLANTS||gltf.loadAsync('./tex/plants.glb');root=(await PLANTS).scene.getObjectByName(p.id).clone();root.position.set(0,0,0)}
  else root=(await gltf.loadAsync(TRIPO+p.id+'.glb')).scene;
  root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(root),sz=bb.getSize(new THREE.Vector3()),s=p.h/sz.y;
  const norm=new THREE.Matrix4().makeScale(s,s,s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2));
  const parts=[];
  root.traverse(o=>{if(!o.isMesh)return;let geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm,o.matrixWorld));
    geo.deleteAttribute('normal');geo=mergeVertices(geo);geo.computeVertexNormals(); // まるい面は、なめらかなかげ
    if(p.src!=='plants'){cleanColors(geo); // 植物の色は、make_plants.py でゲームの色をぬってある
      const n=geo.getAttribute('position').count,mk=v=>new THREE.Float32BufferAttribute(new Float32Array(n).fill(v),1);
      geo.setAttribute('_mat',mk(p.mat?MATIDX[p.mat]:0));geo.setAttribute('_flat',mk(0));geo.setAttribute('_under',mk(0))}
    geo.computeBoundingBox();const bs=geo.boundingBox.getSize(new THREE.Vector3()),ax=p.src==='plants'?[0,1,0]:bs.x>=bs.y&&bs.x>=bs.z?[1,0,0]:bs.y>=bs.z?[0,1,0]:[0,0,1]; // もようの向き：植物（みき）はたて、ほかは物のいちばん長い向き
    const src=o.material||{};parts.push({geo,mat:toneMat({vertexColors:!!geo.getAttribute('color'),color:geo.getAttribute('color')?0xffffff:(src.color||0xffffff),map:src.map||null},false,objCuts(geo),ax)})});
  p.parts=parts;
}
const SPMODELS={};
async function loadSpirit(el){
  const g=await fbx.loadAsync(SPDIR+el+'.fbx');
  g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),s=SPH/bb.getSize(new THREE.Vector3()).y;
  g.scale.multiplyScalar(s);
  const c=SPCOL[el];
  g.traverse(o=>{if(!o.isMesh)return;const n=o.name.toLowerCase();o.frustumCulled=false;
    if(n.startsWith('eye'))o.material=spFlat(c.eye);
    else if(n.startsWith('cheek'))o.material=spFlat(c.cheek);
    else if(n.startsWith('hood')||n.startsWith('hane'))o.material=spMat(c.hood,'head',el==='water'?'water':el==='fire'?'fire':'');
    else if(n.startsWith('sprout'))o.material=spMat(SPROUT,'head','');
    else if(n.startsWith('headacc'))o.material=spMat(HEADACC,'head','');
    else o.material=spMat(CREAM,n==='body'?'body':'head','');
  });
  SPMODELS[el]=g;
}
// 形をあらくする（三角形をへらす。はじめてえらんだときに作る）
function lowGeo(part){
  if(!part.low){const g=part.geo.clone();const n=g.getAttribute('position').count;
    part.low=new SimplifyModifier().modify(g,Math.floor(n*(1-LOWKEEP)));part.low.computeVertexNormals()}
  return part.low;
}

// 画面の下へ1ドット動くと、地面の上では、どれだけ手前か
const DN=new THREE.Vector3(Math.sin(YAW),0,Math.cos(YAW)).multiplyScalar(1/Math.sin(PITCH));

// ---- 置く ----
let propMeshes=[];
const free=(x,z)=>x>=1&&z>=1&&x<MAPN-1&&z<MAPN-1&&KIND[z][x]==='g'&&GRASS[z][x];
function placeProps(level){
  for(const m of propMeshes){scene.remove(m)}propMeshes=[];
  seed=11;const used=new Set();
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S=new THREE.Vector3();
  for(const p of PROPS){
    const n=p.n[level],mats=[];
    for(let i=0,tries=0;i<n&&tries<n*40;tries++){
      const x=Math.floor(rnd()*MAPN),z=Math.floor(rnd()*MAPN);if(!free(x,z))continue;
      const big=p.kind==='item'||p.kind==='tree';const key=x+','+z;if(big&&used.has(key))continue;
      if(p.kind==='tree'&&(hAt(x,z+1)<hAt(x,z)||hAt(x+1,z)<hAt(x,z)))continue; // がけのふちには木を植えない
      if(big)used.add(key);
      const jx=p.kind==='tiny'?rnd()*.8+.1:.5,jz=p.kind==='tiny'?rnd()*.8+.1:.5,sc=.85+rnd()*.3;
      Q.setFromAxisAngle(Y,rnd()*Math.PI*2);V.set(x+jx,yTop(x,z),z+jz);S.set(sc,sc,sc);M.compose(V,Q,S);mats.push(M.clone());i++;
    }
    for(const part of p.parts){
      const im=new THREE.InstancedMesh(OPT.low?lowGeo(part):part.geo,part.mat,Math.max(1,mats.length));im.count=mats.length;
      mats.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=p.kind!=='tiny';im.receiveShadow=true;im.computeBoundingSphere();
      scene.add(im);propMeshes.push(im);
    }
  }
  renderer.shadowMap.needsUpdate=true;
  return used;
}

// ---- せいれい ----
let sprites=[];let blocked=new Set();
const TILT=new THREE.Quaternion().setFromAxisAngle(RT,-(PITCH-SPELEV*Math.PI/180)); // 体を奥へたおして、25度の見おろしに見せる
const shGeo=new THREE.CircleGeometry(1,20);shGeo.rotateX(-Math.PI/2);
const shMat=new THREE.MeshBasicMaterial({color:new THREE.Color(GSHADOW[0]/255,GSHADOW[1]/255,GSHADOW[2]/255),opacity:GSHADOW[3],...keepAlpha,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
function walkable(x,z,h){return inMap(x,z)&&KIND[z][x]!=='w'&&HM[z][x]===h&&!blocked.has(x+','+z)}
function lineOK(a,b,h){const n=Math.ceil(a.distanceTo(b)*3);for(let i=0;i<=n;i++){const t=i/n;if(!walkable(Math.floor(a.x+(b.x-a.x)*t),Math.floor(a.z+(b.z-a.z)*t),h))return false}return true}
function makeSpirits(n){
  for(const s of sprites)scene.remove(s.holder,s.sh);sprites=[];seed=3;
  for(let i=0;i<n;i++){
    const el=ELS[i%ELS.length],obj=SkeletonUtils.clone(SPMODELS[el]);
    let x,z;do{x=Math.floor(rnd()*MAPN);z=Math.floor(rnd()*MAPN)}while(!walkable(x,z,HM[z][x])||!GRASS[z][x]);
    const h=HM[z][x];const bones={};obj.traverse(o=>{o.layers.set(1);if(o.isBone)bones[o.name]={b:o,q:o.quaternion.clone()}});
    const tilt=new THREE.Group();tilt.quaternion.copy(TILT);tilt.add(obj);const holder=new THREE.Group();holder.add(tilt);
    holder.position.set(x+.5,yTop(x,z),z+.5);obj.rotation.y=rnd()*Math.PI*2;
    const sh=new THREE.Mesh(shGeo,shMat);sh.rotation.y=YAW;sh.scale.set(SPSHADOW.r,1,SPSHADOW.r*SPSHADOW.k/Math.sin(PITCH));sh.renderOrder=2;
    scene.add(holder,sh);
    sprites.push({holder,obj,sh,h,bones,to:null,wait:rnd()*2,ph:rnd()*6});
  }
}
const QA=new THREE.Quaternion(),AX=new THREE.Vector3(1,0,0);
function bend(s,name,a){const r=s.bones[name];if(!r)return;QA.setFromAxisAngle(AX,a);r.b.quaternion.copy(r.q).multiply(QA)}
function stepSpirits(dt){
  for(const s of sprites){
    const p=s.holder.position;let moving=false;
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
    const gy=s.h*HSTEP;p.y=gy+(moving?Math.abs(Math.sin(s.ph))*.04:Math.sin(s.ph)*.008);
    s.sh.position.set(p.x,gy+.02,p.z);
  }
}

// ---- 画面：小さい画面（地面・物）→ 細かい画面（せいれい）→ かさねてしあげ → にじみ ----
let rtLow=null,rtHi=null,rtComp=null,rtA=null,rtB=null,lowW=0,lowH=0,hiW=0,hiH=0,devW=0,devH=0;
const quadGeo=new THREE.PlaneGeometry(2,2),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const pass=(fs,uniforms)=>{const m=new THREE.ShaderMaterial({uniforms,vertexShader:VS,fragmentShader:fs,depthTest:false,depthWrite:false});const s=new THREE.Scene();s.add(new THREE.Mesh(quadGeo,m));return {m,s}};
// かさねる：物の輪郭（中がわ・furntone の OLK）、せいれいと輪郭（外がわ・×0.72）、時間の光（soft-light）・空気の遠近・四すみ
const comp=pass(GLSL_HSV+`
  uniform sampler2D tLow,tLowD,tHi;uniform vec2 lp,hp;uniform vec4 tint;varying vec2 vUv;
  float sl(float b,float s){return s<=.5?b-(1.-2.*s)*b*(1.-b):b+(2.*s-1.)*((b<=.25?((16.*b-12.)*b+4.)*b:sqrt(b))-b);}
  void main(){
    vec2 uv=(floor(vUv/lp)+.5)*lp;vec4 c=sRGBTransferOETF(texture2D(tLow,uv));float d=texture2D(tLowD,uv).x;
    float n=max(max(texture2D(tLowD,uv+vec2(lp.x,0.)).x,texture2D(tLowD,uv-vec2(lp.x,0.)).x),max(texture2D(tLowD,uv+vec2(0.,lp.y)).x,texture2D(tLowD,uv-vec2(0.,lp.y)).x));
    if(abs(c.a-${TAG.prop.toFixed(2)})<.1 && n-d>${OUTLINE_DEPTH}){vec3 h=tnRgb2hsv(c.rgb);h.z=clamp(h.z+${TONE.line[0]}./100.,0.,1.);h.y=clamp(h.y+${TONE.line[1]}./100.,0.,1.);c.rgb=tnHsv2rgb(h);}
    vec4 s=texture2D(tHi,vUv);
    if(s.a>.5)c.rgb=sRGBTransferOETF(s).rgb;
    else{vec4 a=texture2D(tHi,vUv+vec2(0.,hp.y));if(a.a<.5)a=texture2D(tHi,vUv-vec2(0.,hp.y));if(a.a<.5)a=texture2D(tHi,vUv+vec2(hp.x,0.));if(a.a<.5)a=texture2D(tHi,vUv-vec2(hp.x,0.));
      if(a.a>.5)c.rgb=sRGBTransferOETF(a).rgb*${SPLINE};}
    c.rgb=mix(c.rgb,vec3(sl(c.r,tint.r),sl(c.g,tint.g),sl(c.b,tint.b)),tint.a);
    c.rgb=mix(c.rgb,vec3(${f3(HD.airCol)}),${HD.air}*clamp((vUv.y-${(1-HD.airH).toFixed(2)})/${HD.airH},0.,1.));
    vec2 q=(vUv-.5)/hp;float r=length(q)/(.5*length(1./hp));
    c.rgb=mix(c.rgb,vec3(${f3(HD.vigCol)}),${HD.vig}*clamp((r-${HD.vigR[0]})/(${HD.vigR[1]}-${HD.vigR[0]}),0.,1.));
    gl_FragColor=vec4(c.rgb,1.);
  }`,{tLow:{value:null},tLowD:{value:null},tHi:{value:null},lp:{value:new THREE.Vector2()},hp:{value:new THREE.Vector2()},tint:{value:new THREE.Vector4(1,1,1,0)}});
const copy=pass('uniform sampler2D t;varying vec2 vUv;void main(){gl_FragColor=texture2D(t,vUv);}',{t:{value:null}});
// 出す：にじみ（小さくした絵を3回かけ算して、明るい所だけを screen でかさねる）
const fin=pass(`uniform sampler2D t,g;uniform vec2 crop;varying vec2 vUv;
  void main(){vec2 uv=vec2(vUv.x*crop.x,1.-(1.-vUv.y)*crop.y);vec3 c=texture2D(t,uv).rgb,b=texture2D(g,uv).rgb;b=b*b*b*${HD.glow};gl_FragColor=vec4(1.-(1.-c)*(1.-b),1.);}`,
  {t:{value:null},g:{value:null},crop:{value:new THREE.Vector2(1,1)}});
function mkRT(w,h,filter,depth){const r=new THREE.WebGLRenderTarget(w,h,{minFilter:filter,magFilter:filter,depthBuffer:!!depth});if(depth)r.depthTexture=new THREE.DepthTexture(w,h);return r}
function resize(){
  renderer.setSize(innerWidth,innerHeight,false);const sz=renderer.getDrawingBufferSize(new THREE.Vector2());devW=sz.x;devH=sz.y;
  const Z=OPT.zoom,W=Math.ceil(devW/Z/2)*2,H=Math.ceil(devH/Z/2)*2;
  if(W===lowW&&H===lowH&&rtLow&&hiW===W*Z){fin.m.uniforms.crop.value.set(devW/hiW,devH/hiH);return}
  for(const r of [rtLow,rtHi,rtComp,rtA,rtB])if(r){if(r.depthTexture)r.depthTexture.dispose();r.dispose()}
  lowW=W;lowH=H;hiW=W*Z;hiH=H*Z;
  rtLow=mkRT(lowW,lowH,THREE.NearestFilter,true);rtLow.texture.colorSpace=THREE.SRGBColorSpace;
  rtHi=mkRT(hiW,hiH,THREE.NearestFilter,true);rtHi.texture.colorSpace=THREE.SRGBColorSpace;
  rtComp=mkRT(hiW,hiH,THREE.LinearFilter,false);
  rtA=mkRT(Math.max(1,Math.round(hiW/HD.a)),Math.max(1,Math.round(hiH/HD.a)),THREE.LinearFilter,false);
  rtB=mkRT(Math.max(1,Math.round(hiW/HD.b)),Math.max(1,Math.round(hiH/HD.b)),THREE.LinearFilter,false);
  uLowD.value=rtLow.depthTexture;uHiRes.value.set(hiW,hiH);
  comp.m.uniforms.tLow.value=rtLow.texture;comp.m.uniforms.tLowD.value=rtLow.depthTexture;comp.m.uniforms.tHi.value=rtHi.texture;
  comp.m.uniforms.lp.value.set(1/lowW,1/lowH);comp.m.uniforms.hp.value.set(1/hiW,1/hiH);
  fin.m.uniforms.t.value=rtComp.texture;fin.m.uniforms.g.value=rtB.texture;fin.m.uniforms.crop.value.set(devW/hiW,devH/hiH);
  placeCam();
}
function placeCam(){
  const hw=lowW/PPU/2,hh=lowH/PPU/2;Object.assign(cam,{left:-hw,right:hw,top:hh,bottom:-hh});cam.updateProjectionMatrix();
  cam.position.copy(target).addScaledVector(CAMDIR,60);cam.lookAt(target);cam.updateMatrixWorld();
  // ドットにそろえる：カメラの右・上の向きで、1ドットの倍数に
  const r=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0),u=new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1);
  const pr=cam.position.dot(r),pu=cam.position.dot(u),q=1/PPU;
  cam.position.addScaledVector(r,Math.round(pr/q)*q-pr).addScaledVector(u,Math.round(pu/q)*q-pu);cam.updateMatrixWorld();
}

// ---- さわる：ドラッグで動かす ----
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!drag)return;const k=PR/OPT.zoom/PPU,dx=(e.clientX-drag.x)*k,dy=(e.clientY-drag.y)*k;drag={x:e.clientX,y:e.clientY};
  target.addScaledVector(RT,-dx).addScaledVector(DN,-dy);
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
  groups.push(group('大きさ',[['2',2],['3',3],['4',4]],()=>OPT.zoom,v=>{OPT.zoom=v;resize()}));
  groups.push(group('形',[['もとのまま',false],['あらく',true]],()=>OPT.low,v=>{OPT.low=v;blocked=placeProps(OPT.props)}));
  groups.push(group('かげ',[['あり',true],['なし',false]],()=>OPT.shadow,v=>{OPT.shadow=v;sun.castShadow=v;renderer.shadowMap.needsUpdate=true}));
  const g=document.createElement('div');g.className='g';
  const mb=document.createElement('button');mb.textContent='10秒はかる';mb.onclick=()=>startMeasure(mb);
  g.append(mb);$('ctl').append(g);
  refresh();
}

// ---- はかる ----
let frames=0,lastT=performance.now(),fps=0,cpuMs=0,cpuAcc=0,meas=null,measRes='',calls=0,tris=0;
function gpuName(){try{const gl=renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info');return x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):''}catch(e){return ''}}
function startMeasure(btn){if(meas)return;meas={t0:performance.now(),dts:[],btn};btn.textContent='はかっています…'}
function endMeasure(){
  const d=meas.dts.sort((a,b)=>a-b),n=d.length,avg=d.reduce((a,b)=>a+b,0)/n,slow=d[Math.floor(n*.99)]||avg;
  measRes=`10秒の平均 ${(1000/avg).toFixed(0)}コマ/秒・おそいコマ ${(1000/slow).toFixed(0)}コマ/秒`;
  meas.btn.textContent='10秒はかる';meas=null;
}
function hud(){
  $('hud').innerHTML=`<b>${fps.toFixed(0)}</b> コマ/秒　1コマの処理 ${cpuMs.toFixed(1)}ms<br>`+
    `描く回数 ${calls}・三角形 ${(tris/1000).toFixed(0)}千<br>地面と物 ${lowW}×${lowH}・せいれい ${hiW}×${hiH}<br>`+
    `せいれい ${sprites.length}体`+(measRes?`<br>${measRes}`:'')+(gpu?`<br><span style="opacity:.6">${gpu}</span>`:'');
}

// ---- まわす ----
let gpu='',prev=performance.now();
const CLEAR0=new THREE.Color(0,0,0);
function draw(to,sc,cm){renderer.setRenderTarget(to);renderer.render(sc,cm);calls+=renderer.info.render.calls;tris+=renderer.info.render.triangles}
function frame(now){
  const dt=Math.min(.1,(now-prev)/1000);prev=now;
  const t0=performance.now();
  stepSpirits(dt);calls=0;tris=0;
  uLV.value.copy(LW).transformDirection(cam.matrixWorldInverse);
  cam.layers.set(0);renderer.setClearColor(BG,1);draw(rtLow,scene,cam);          // 地面・木・物（ゲームの1ドット）
  cam.layers.set(1);renderer.setClearColor(CLEAR0,0);draw(rtHi,scene,cam);       // せいれい（細かい点）
  draw(rtComp,comp.s,postCam);
  copy.m.uniforms.t.value=rtComp.texture;draw(rtA,copy.s,postCam);
  copy.m.uniforms.t.value=rtA.texture;draw(rtB,copy.s,postCam);
  draw(null,fin.s,postCam);
  cpuAcc+=performance.now()-t0;frames++;
  if(meas){meas.dts.push(dt*1000);if(now-meas.t0>10000)endMeasure()}
  if(now-lastT>=1000){fps=frames*1000/(now-lastT);cpuMs=cpuAcc/frames;frames=0;cpuAcc=0;lastT=now;hud()}
  requestAnimationFrame(frame);
}

async function loadMats(){
  const meta=await (await fetch('./tex/mats.json')).json(),names=Object.keys(MATIDX).sort((a,b)=>MATIDX[a]-MATIDX[b]);
  for(const k of names){const t=await TEXL.loadAsync('./tex/m_'+k+'.png');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
    uMat.value.push(t);uMatK.value.push(new THREE.Vector3(meta[k].span,meta[k].dark,meta[k].light))}
}
async function main(){
  await loadMats();
  await Promise.all([loadGround(),...PROPS.map(loadProp),...ELS.map(loadSpirit)]);
  if(GIMG.glow)comp.m.uniforms.tint.value.set(GIMG.glow[0]/255,GIMG.glow[1]/255,GIMG.glow[2]/255,GIMG.glow[3]);
  sun.castShadow=OPT.shadow;blocked=placeProps(OPT.props);makeSpirits(OPT.spirits);
  resize();addEventListener('resize',resize);buildUI();gpu=gpuName();
  $('load').remove();hud();window.__proto3dReady=true;
  requestAnimationFrame(t=>{prev=t;frame(t)});
}
main().catch(showErr);
