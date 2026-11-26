/* はこにわ 3Dの試作：やわらかい3Dの箱庭（スマホの『どうぶつの森』のような見え方。形・キャラクター・絵はまねしない）。
   ゲームとはべつのページ。持ち主が「ルールを破ってもいいので、ゲーム性を保ったまま、できるだけきれいに」とたのんだ（ドット絵・彩度だけのかげ・ゲームの絵の地面は使わない）。
   - 画面：スマホの細かさのまま（2倍まで）なめらかに描く。遠近のあるカメラ（せまい画角）。奥・手前ほど地面が下へまがる（丸い地面 CURVE）。
   - 光：空と地面の色の光（HemisphereLight）・太陽のやわらかいかげ（PCF）・トゥーンのかげ（さかいめをぼかす TOON）・ふちの光（RIM）。
   - しあげ：画面の上と下を少しぼかす（ミニチュア TILT）・明るい所のにじみ（BLOOM）・あたたかい色（GRADE）・四すみを少し暗く。
   - 地面：草・あれ地・土の道・がけ・池を、その場で作る色（ノイズ）で描く。地形のマスの絵（マスク）をなめらかに読んで、さかいめを自然に。
   - 植物は持ち主のモデル（make_plants.py）、岩・小物はトリポのモデル（make_uv.py で UV 展開）。材質の絵（make_textures.py）は明るさのむらとしてうすくのせる。
   - マスの大きさ・段差・置き場所・歩ける所は、前の試作と同じ（ゲーム性）。 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';

const SPDIR='../tools/art/spirit3d/model/';
// ---- 見え方 ----
const MAPN=24;                 // 地形のはば（マス）
const BORDER=16;               // まわりに足す地面（マス）
const HSTEP=1.2;               // 段差1つの高さ（マス。前の試作と同じ）
const PITCH=35*Math.PI/180;    // 見おろす角度
const YAW=Math.PI/4;           // カメラの向き（マスの x が右下・z が左下）
const FOV=28;                  // 画角（度）
const VIEWW={2:7,3:10,4:14};   // 「大きさ」：画面の横に入るマスの数（近い・ふつう・遠い）
const CURVE=.018;              // 丸い地面：カメラの見るまん中から、奥・手前へ d マスはなれた所を d²×CURVE だけ下げる
const MAXPR=2;                 // 画面の細かさ（スマホの点の何倍まで）
// ---- 光とかげ ----
const SKY='#bfe8f5',GROUND='#6f9a52',FOG=[6,30];     // 空の色（背景・霧）・地面からの光・霧のはじまりとおわり（カメラの見るまん中より先、マス）
const HEMI=1.35,SUN=2.3,SUNCOL='#fff1d6';            // 空と地面の光・太陽の光
const SUNDIR=[-.55,1,.35];                           // 太陽の向き（せかい。左上・手前から）
const TOON=[.42,.7,1,1];                             // トゥーンの明るさのだん（かげ→光。なめらかにつなぐ）
const RIM={k:.35,pow:3,col:[1,.96,.86]};             // ふちの光
const AO=.13;                                        // 葉の下のかげ：_under 1だんごとに暗くする量
// ---- しあげ ----
const TILT={top:.3,bot:.82,amt:.9};    // ぼかす所：画面の上からこの割合まで・この割合から下（ぼかしの強さ）
const BLOOM={th:.72,k:.55};            // にじみ：これより明るい所を、この強さで
const GRADE={warm:[1.04,1.0,.93],sat:1.12,vig:.22};
// ---- 地面の色（sRGB） ----
const COLS={grassA:'#a3dc72',grassB:'#7fca60',grassC:'#c2e690',dry:'#bdd27e',path:'#d9b98a',pathB:'#c7a173',cliff:'#b98d63',cliffB:'#9a7250',water:'#5cc3e6',waterB:'#2f9ccc',foam:'#eafaff'};
// ---- せいれい ----
const SPH=.8,WALK=1.2;
const CREAM='#fdf8ef';
const SPCOL={earth:{hood:'#8f6a50',cheek:'#f1b8a8',eye:'#5e3d2a'},water:{hood:'#78c3fb',cheek:'#f4b8b8',eye:'#1d4f7c'},fire:{hood:'#f07a4f',cheek:'#f2ac9f',eye:'#8f3a22'},
  wind:{hood:'#a6cc8a',cheek:'#f0c0b0',eye:'#456a2a'},wood:{hood:'#6fae4c',cheek:'#f0c0b0',eye:'#3f5e26'}};
const SPROUT='#5e8f43',HEADACC='#e8cdb0';
const ELS=['earth','water','fire','wind','wood'];
// ---- 置く物 ----
// 植物（plants の名前：T 木・B しげみ・F 花と草）。木は1マスに1本、がけのふちには植えない
const PLANT=(id,h,n,kind)=>({id,h,n,kind,src:'plants'});
// 岩・小物（props）：tint＝ぬる色（sRGB）・mat＝明るさのむらにする材質の絵
const PROPS=[
  ...['T0','T2','T3','T4','T5','T6','T8','T9'].map(id=>PLANT(id,1.9,[1,2,4],'tree')),PLANT('T1',2.2,[1,2,3],'tree'),PLANT('T7',2.2,[0,1,2],'tree'),
  ...['B0','B1','B2'].map(id=>PLANT(id,.7,[2,4,9],'small')),
  ...['F0','F1','F2','F3','F4','F5','F6','F7','F8','F9'].map(id=>PLANT(id,.45,[2,6,14],'tiny')),
  {id:'rock',h:.3,n:[3,6,12],kind:'small',mat:'stone',tint:'#b9b4aa'},{id:'stone_big',h:.45,n:[2,4,8],kind:'small',mat:'stone',tint:'#c4bdb0'},
  {id:'lantern',h:.7,n:[2,3,4],kind:'item',mat:'metal',tint:'#6f6a66'},{id:'sack',h:.5,n:[2,3,4],kind:'item',mat:'cloth',tint:'#dcc08e'},
  {id:'firewood',h:.4,n:[1,2,3],kind:'item',mat:'bark',tint:'#a8754e'},{id:'stump',h:.4,n:[2,3,5],kind:'item',mat:'bark',tint:'#a4724c'},
  {id:'log_lying',h:.35,n:[1,2,3],kind:'item',mat:'bark',tint:'#a8754e'},{id:'jar_band',h:.5,n:[1,2,3],kind:'item',mat:'stone',tint:'#cf8a5c'},
  {id:'wateringcan',h:.35,n:[1,1,2],kind:'item',mat:'metal',tint:'#79aab4'}];
const MATIDX={wood:1,stone:2,metal:3,cloth:4,bark:5};
const MATK=.35;                // 材質の絵の明るさのむらを、色にのせる強さ

const $=id=>document.getElementById(id);
const showErr=e=>{const b=$('err');b.style.display='block';b.textContent+=String(e&&e.stack||e)+'\n'};
addEventListener('error',e=>showErr(e.error||e.message));addEventListener('unhandledrejection',e=>showErr(e.reason));

// ---- 設定（ボタン） ----
const OPT={zoom:3,spirits:20,props:1,shadow:true,low:false};
try{Object.assign(OPT,JSON.parse(localStorage.getItem('hakoniwa-proto3d5')||'{}'))}catch(e){}
const saveOpt=()=>{try{localStorage.setItem('hakoniwa-proto3d5',JSON.stringify(OPT))}catch(e){}};

// ---- 地形（前の試作と同じ） ----
const HM=[],KIND=[],GRASS=[];
for(let z=0;z<MAPN;z++){HM.push([]);KIND.push([]);GRASS.push([]);for(let x=0;x<MAPN;x++){
  let h=0;if(z<7)h=1;if(x>17&&z<12)h=1;if(x<5&&z<4)h=2;
  let k='g';if(z===14||(x===11&&z>=7))k='p';
  if(Math.hypot(x+.5-5,z+.5-18.5)<2.6){k='w';h=0}
  const d=Math.hypot(x+.5-12,z+.5-13),a=Math.atan2(z-13,x-12);
  HM[z].push(h);KIND[z].push(k);GRASS[z].push(d<11+1.6*Math.sin(a*3)+1.1*Math.sin(a*5+1)?1:0)}}
const inMap=(x,z)=>x>=0&&z>=0&&x<MAPN&&z<MAPN;
const hAt=(x,z)=>inMap(x,z)?HM[z][x]:0;
const isW=(x,z)=>inMap(x,z)&&KIND[z][x]==='w';
const yTop=(x,z)=>hAt(x,z)*HSTEP-(isW(x,z)?.45:0);
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;

// ---- しかけ ----
const cv=$('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});
const PR=Math.min(devicePixelRatio||1,MAXPR);
renderer.setPixelRatio(PR);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();
scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,50,80);
const cam=new THREE.PerspectiveCamera(FOV,1,1,200);
const target=new THREE.Vector3(MAPN/2,0,MAPN/2);
const CAMDIR=new THREE.Vector3(Math.sin(YAW)*Math.cos(PITCH),Math.sin(PITCH),Math.cos(YAW)*Math.cos(PITCH));
const RT=new THREE.Vector3(Math.cos(YAW),0,-Math.sin(YAW));        // 画面の右
const FWD=new THREE.Vector2(-Math.sin(YAW),-Math.cos(YAW));         // 画面の奥（地面の上）
scene.add(new THREE.HemisphereLight(SKY,GROUND,HEMI));
const sun=new THREE.DirectionalLight(SUNCOL,SUN);
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:120});
sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;sun.shadow.radius=3;
sun.position.set(MAPN/2,0,MAPN/2).addScaledVector(new THREE.Vector3(...SUNDIR).normalize(),50);sun.target.position.set(MAPN/2,0,MAPN/2);
scene.add(sun,sun.target);

// ---- マテリアル（トゥーン・ふちの光・丸い地面） ----
const uCurve={value:new THREE.Vector4(target.x,target.z,CURVE,0)},uTime={value:0};
const GRAD=(()=>{const d=new Uint8Array(TOON.length*4);TOON.forEach((v,i)=>{d[i*4]=d[i*4+1]=d[i*4+2]=Math.round(v*255);d[i*4+3]=255});
  const t=new THREE.DataTexture(d,TOON.length,1);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
const CURVE_VS=`
vec4 mvPosition=vec4(transformed,1.);
#ifdef USE_INSTANCING
mvPosition=instanceMatrix*mvPosition;
#endif
vec4 cwp=modelMatrix*mvPosition;float cd=dot(cwp.xz-uCurve.xy,vec2(${FWD.x.toFixed(5)},${FWD.y.toFixed(5)}));cwp.y-=uCurve.z*cd*cd;
mvPosition=viewMatrix*cwp;gl_Position=projectionMatrix*mvPosition;`;
// 全部の物の頂点に、丸い地面をかける（three の project_vertex をおきかえる）
function curveVS(sh){sh.uniforms.uCurve=uCurve;sh.vertexShader='uniform vec4 uCurve;\n'+sh.vertexShader.replace('#include <project_vertex>',CURVE_VS)}
const RIM_FS=`outgoingLight+=vec3(${RIM.col.join(',')})*${RIM.k.toFixed(2)}*pow(1.-clamp(dot(normalize(normal),normalize(vViewPosition)),0.,1.),${RIM.pow}.)*(.4+.6*clamp(normal.y*.5+.5,0.,1.));`;
const uMat={value:[]};
// o：MeshToonMaterial の設定。extra：{mat:材質の絵をのせる, uvk:UV にかける数}
function toon(o={},extra={}){
  const m=new THREE.MeshToonMaterial({gradientMap:GRAD,...o});
  m.onBeforeCompile=sh=>{curveVS(sh);sh.uniforms.uMat=uMat;
    sh.vertexShader='attribute float _under,_mat;varying float vUnder,vMat;varying vec2 vUv2;\n'+sh.vertexShader.replace('void main() {','void main() {\nvUnder=_under;vMat=_mat;vUv2=uv;');
    sh.fragmentShader='uniform sampler2D uMat[5];varying float vUnder,vMat;varying vec2 vUv2;\n'+sh.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
  ${extra.mat?`{int k=int(vMat+.5)-1;if(k>=0){vec2 uv=vUv2*${extra.uvk.toFixed(4)};float l=k==0?texture2D(uMat[0],uv).r:k==1?texture2D(uMat[1],uv).r:k==2?texture2D(uMat[2],uv).r:k==3?texture2D(uMat[3],uv).r:texture2D(uMat[4],uv).r;
    diffuseColor.rgb*=mix(1.,l*2.,${MATK.toFixed(2)});}}`:''}
  diffuseColor.rgb*=1.-${AO.toFixed(2)}*vUnder;`)
      .replace('#include <opaque_fragment>',RIM_FS+'\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey=()=>'toon'+(extra.mat?extra.uvk.toFixed(3):'');
  return m;
}

// ---- 地面（その場で作る色） ----
// マスクの絵：R 道・G 池・B あれ地（草のない所）。1マス MASKR 点。なめらかに読み、ノイズでさかいめをゆらす
const MASKR=4,MN=MAPN+2*BORDER;
const maskTex=(()=>{const W=MN*MASKR,d=new Uint8Array(W*W*4);
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){const x=Math.floor(i/MASKR)-BORDER,z=Math.floor(j/MASKR)-BORDER,k=inMap(x,z)?KIND[z][x]:'g',o=(j*W+i)*4;
    d[o]=k==='p'?255:0;d[o+1]=k==='w'?255:0;d[o+2]=inMap(x,z)&&!GRASS[z][x]&&k==='g'?255:0;d[o+3]=255}
  const t=new THREE.DataTexture(d,W,W);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
const NOISE=`
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return .5*vn(p)+.25*vn(p*2.03+7.)+.125*vn(p*4.01+3.)+.0625*vn(p*8.07+11.);}
vec3 lin(vec3 c){return pow(c,vec3(2.2));}
`;
const C3=h=>{const c=new THREE.Color(h);c.convertLinearToSRGB();return `vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`};
function groundMat(){
  const m=new THREE.MeshToonMaterial({gradientMap:GRAD});
  m.onBeforeCompile=sh=>{curveVS(sh);sh.uniforms.uMask={value:maskTex};
    sh.vertexShader='attribute float aTop;varying vec3 vW;varying float vTop,vNy;\n'+sh.vertexShader.replace('void main() {','void main() {\nvW=(modelMatrix*vec4(position,1.)).xyz;vTop=aTop;vNy=normal.y;');
    sh.fragmentShader='uniform sampler2D uMask;varying vec3 vW;varying float vTop,vNy;\n'+NOISE+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  {vec2 p=vW.xz;vec2 muv=(p+${BORDER}.)/${MN}.;
   float n1=fbm(p*.35),n2=fbm(p*1.7+5.),n3=vn(p*6.);
   vec3 mk=texture2D(uMask,muv+(vec2(fbm(p*1.3),fbm(p*1.3+9.))-.5)*.012).rgb;
   vec3 g=mix(${C3(COLS.grassB)},${C3(COLS.grassA)},smoothstep(.3,.7,n1));g=mix(g,${C3(COLS.grassC)},smoothstep(.62,.8,n2)*.6);
   g*=.94+.1*n3;                                                         // 草のこまかい色むら
   float tuft=step(.82,hs(floor(p*5.)))*smoothstep(.35,.0,length(fract(p*5.)-.5));g=mix(g,g*1.12+vec3(.02,.03,0.),tuft); // 小さな草のかたまり
   vec3 dry=mix(${C3(COLS.dry)},${C3(COLS.dry)}*.92,n2);
   g=mix(g,dry,smoothstep(.45,.6,mk.b+(n1-.5)*.3));
   vec3 pth=mix(${C3(COLS.pathB)},${C3(COLS.path)},smoothstep(.2,.8,n2))*(.95+.08*n3);
   float pm=smoothstep(.42,.58,mk.r+(n2-.5)*.25);
   vec3 c=mix(g,pth,pm);
   if(vNy<.5){  // がけの横の面：土の地層と、上のふちの草
     float st=fbm(vec2((p.x+p.y)*1.6,vW.y*5.));vec3 cl=mix(${C3(COLS.cliffB)},${C3(COLS.cliff)},smoothstep(.3,.7,st))*(.92+.1*n3);
     float lip=smoothstep(vTop-.2,vTop-.06,vW.y+.06*(n2-.5));c=mix(cl,c,lip);}
   diffuseColor.rgb=lin(c);}`);
  };
  m.customProgramCacheKey=()=>'ground';return m;
}
function buildGround(){
  const P=[],N=[],T=[];
  const quad=(vs,n,top)=>{for(const i of [0,1,2,0,2,3]){P.push(...vs[i]);N.push(...n);T.push(top)}};
  for(let z=-BORDER;z<MAPN+BORDER;z++)for(let x=-BORDER;x<MAPN+BORDER;x++){
    const y=yTop(x,z);quad([[x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z]],[0,1,0],y);
    for(const [dx,dz,A,B,n] of [[0,1,[x,y,z+1],[x+1,y,z+1],[0,0,1]],[0,-1,[x+1,y,z],[x,y,z],[0,0,-1]],[1,0,[x+1,y,z+1],[x+1,y,z],[1,0,0]],[-1,0,[x,y,z],[x,y,z+1],[-1,0,0]]]){
      const ny=yTop(x+dx,z+dz);if(ny>=y-1e-4)continue;
      quad([[A[0],ny,A[2]],[B[0],ny,B[2]],[B[0],y,B[2]],[A[0],y,A[2]]],n,y);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('aTop',new THREE.Float32BufferAttribute(T,1));
  const m=new THREE.Mesh(g,groundMat());m.receiveShadow=true;m.castShadow=true;scene.add(m);
  // 池の水：ゆれる水面・岸のあわ
  const wg=new THREE.PlaneGeometry(MAPN,MAPN,MAPN*2,MAPN*2);wg.rotateX(-Math.PI/2);wg.translate(MAPN/2,-.16,MAPN/2);
  const wm=new THREE.ShaderMaterial({transparent:true,fog:true,uniforms:{uMask:{value:maskTex},uTime,uCurve,...THREE.UniformsLib.fog},
    vertexShader:`uniform vec4 uCurve;varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec3 transformed=position;vW=(modelMatrix*vec4(position,1.)).xyz;${CURVE_VS}\n#include <fog_vertex>\n}`,
    fragmentShader:`uniform sampler2D uMask;uniform float uTime;varying vec3 vW;\n#include <fog_pars_fragment>\n${NOISE}
      void main(){vec2 p=vW.xz;float w=texture2D(uMask,(p+${BORDER}.)/${MN}.+(vec2(fbm(p*1.3),fbm(p*1.3+9.))-.5)*.012).g;if(w<.42)discard;
        float r=fbm(p*1.6+vec2(uTime*.15,uTime*.1))+.5*fbm(p*3.1-vec2(uTime*.12,0.));vec3 c=mix(${C3(COLS.waterB)},${C3(COLS.water)},smoothstep(.45,1.1,r));
        float hl=smoothstep(.93,1.,fbm(p*2.4+vec2(uTime*.2,-uTime*.15)));c=mix(c,vec3(1.),hl*.55);           // 水面の光
        float foam=smoothstep(.62,.5,w+.06*sin(uTime*2.+fbm(p*3.)*9.));c=mix(c,${C3(COLS.foam)},foam*.9);      // 岸のあわ
        gl_FragColor=vec4(lin(c),.92);\n#include <fog_fragment>\n}`});
  const water=new THREE.Mesh(wg,wm);water.renderOrder=1;scene.add(water);
}

// ---- モデル ----
const gltf=new GLTFLoader(),fbx=new FBXLoader();
// 面の向きを、同じ場所の点でならす（UV のさかいで点がわかれていても、なめらかなかげに）
function smoothNormals(geo){
  const P=geo.getAttribute('position'),I=geo.index,M=new Map(),key=i=>Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4);
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),tri=I?I.count/3:P.count/3,vi=k=>I?I.getX(k):k;
  for(let t=0;t<tri;t++){const i0=vi(3*t),i1=vi(3*t+1),i2=vi(3*t+2);a.fromBufferAttribute(P,i0);b.fromBufferAttribute(P,i1);c.fromBufferAttribute(P,i2);
    n.subVectors(c,b).cross(a.sub(b));for(const i of [i0,i1,i2]){const k=key(i),v=M.get(k)||[0,0,0];v[0]+=n.x;v[1]+=n.y;v[2]+=n.z;M.set(k,v)}}
  const N=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const v=M.get(key(i)),l=Math.hypot(...v)||1;N[3*i]=v[0]/l;N[3*i+1]=v[1]/l;N[3*i+2]=v[2]/l}
  geo.setAttribute('normal',new THREE.BufferAttribute(N,3));
}
let PLANTS=null,PROPSGLB=null;const MATSPAN={};
async function loadProp(p){
  let root;
  if(p.src==='plants'){PLANTS=PLANTS||gltf.loadAsync('./tex/plants.glb');root=(await PLANTS).scene.getObjectByName(p.id).clone()}
  else{PROPSGLB=PROPSGLB||gltf.loadAsync('./tex/props.glb');root=(await PROPSGLB).scene.getObjectByName(p.id).clone()}
  root.position.set(0,0,0);root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(root),sz=bb.getSize(new THREE.Vector3()),s=p.h/sz.y;
  const norm=new THREE.Matrix4().makeScale(s,s,s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2));
  const parts=[];
  root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm,o.matrixWorld));
    smoothNormals(geo);const n=geo.getAttribute('position').count,mk=v=>new THREE.Float32BufferAttribute(new Float32Array(n).fill(v),1);
    if(p.src!=='plants'){geo.setAttribute('_mat',mk(p.mat?MATIDX[p.mat]:0));geo.setAttribute('_under',mk(0));geo.deleteAttribute('color')}
    const span=p.src==='plants'?MATSPAN.bark:MATSPAN[p.mat]||1;
    const mat=p.src==='plants'?toon({vertexColors:true},{mat:true,uvk:s/span}):toon({color:p.tint},{mat:!!p.mat,uvk:s/span});
    parts.push({geo,mat})});
  p.parts=parts;
}
const SPMODELS={};
async function loadSpirit(el){
  const g=await fbx.loadAsync(SPDIR+el+'.fbx');
  g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),s=SPH/bb.getSize(new THREE.Vector3()).y;
  g.scale.multiplyScalar(s);
  const c=SPCOL[el],flat=col=>{const m=new THREE.MeshBasicMaterial({color:col});m.onBeforeCompile=curveVS;m.customProgramCacheKey=()=>'flat';return m};
  g.traverse(o=>{if(!o.isMesh)return;const n=o.name.toLowerCase();o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;
    if(n.startsWith('eye'))o.material=flat(c.eye);
    else if(n.startsWith('cheek'))o.material=flat(c.cheek);
    else if(n.startsWith('hood')||n.startsWith('hane'))o.material=toon({color:c.hood});
    else if(n.startsWith('sprout'))o.material=toon({color:SPROUT});
    else if(n.startsWith('headacc'))o.material=toon({color:HEADACC});
    else o.material=toon({color:CREAM});
  });
  SPMODELS[el]=g;
}
// 形をあらくする（三角形をへらす。はじめてえらんだときに作る）
const LOWKEEP=.25;
function lowGeo(part){
  if(!part.low){const g=part.geo.clone();const n=g.getAttribute('position').count;
    part.low=new SimplifyModifier().modify(g,Math.floor(n*(1-LOWKEEP)));part.low.computeVertexNormals();
    const m=part.low.getAttribute('position').count,src=part.geo;
    for(const a of ['_mat','_under'])part.low.setAttribute(a,new THREE.Float32BufferAttribute(new Float32Array(m).fill(src.getAttribute(a).getX(0)),1))}
  return part.low;
}

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
function walkable(x,z,h){return inMap(x,z)&&KIND[z][x]!=='w'&&HM[z][x]===h&&!blocked.has(x+','+z)}
function lineOK(a,b,h){const n=Math.ceil(a.distanceTo(b)*3);for(let i=0;i<=n;i++){const t=i/n;if(!walkable(Math.floor(a.x+(b.x-a.x)*t),Math.floor(a.z+(b.z-a.z)*t),h))return false}return true}
function makeSpirits(n){
  for(const s of sprites)scene.remove(s.obj);sprites=[];seed=3;
  for(let i=0;i<n;i++){
    const el=ELS[i%ELS.length],obj=SkeletonUtils.clone(SPMODELS[el]);
    let x,z;do{x=Math.floor(rnd()*MAPN);z=Math.floor(rnd()*MAPN)}while(!walkable(x,z,HM[z][x])||!GRASS[z][x]);
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
  if(sprites.length)renderer.shadowMap.needsUpdate=true; // せいれいのかげは動く
}

// ---- しあげ：画面 → ちぢめてぼかす → ミニチュアのぼかし・にじみ・色 ----
let rtMain=null,rtA=null,rtB=null,W0=0,H0=0;
const quadGeo=new THREE.PlaneGeometry(2,2),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const pass=(fs,uniforms)=>{const m=new THREE.ShaderMaterial({uniforms,vertexShader:VS,fragmentShader:fs,depthTest:false,depthWrite:false});const s=new THREE.Scene();s.add(new THREE.Mesh(quadGeo,m));return {m,s}};
const blur=pass(`uniform sampler2D t;uniform vec2 d;varying vec2 vUv;
  void main(){vec4 c=texture2D(t,vUv)*.227;c+=(texture2D(t,vUv+d*1.385)+texture2D(t,vUv-d*1.385))*.316;c+=(texture2D(t,vUv+d*3.23)+texture2D(t,vUv-d*3.23))*.07;gl_FragColor=c;}`,{t:{value:null},d:{value:new THREE.Vector2()}});
const fin=pass(`uniform sampler2D t,b;varying vec2 vUv;
  void main(){vec3 c=texture2D(t,vUv).rgb,bl=texture2D(b,vUv).rgb;
    float tl=max(smoothstep(${TILT.top.toFixed(2)},0.,1.-vUv.y),smoothstep(${TILT.bot.toFixed(2)},1.,1.-vUv.y))*${TILT.amt.toFixed(2)};
    c=mix(c,bl,tl);                                                                  // ミニチュアのぼかし（上と下）
    c+=max(bl-${BLOOM.th.toFixed(2)},0.)*${BLOOM.k.toFixed(2)};                       // にじみ
    c*=vec3(${GRADE.warm.join(',')});float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,${GRADE.sat.toFixed(2)}); // あたたかい色・あざやかに
    vec2 q=vUv-.5;c*=1.-${GRADE.vig.toFixed(2)}*smoothstep(.35,.75,length(q));        // 四すみ
    gl_FragColor=vec4(pow(clamp(c,0.,1.),vec3(1./2.2)),1.);}`,{t:{value:null},b:{value:null}});
function resize(){
  renderer.setSize(innerWidth,innerHeight,false);const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  cam.aspect=innerWidth/innerHeight;placeCam();
  if(sz.x===W0&&sz.y===H0&&rtMain)return;W0=sz.x;H0=sz.y;
  for(const r of [rtMain,rtA,rtB])if(r)r.dispose();
  rtMain=new THREE.WebGLRenderTarget(W0,H0,{type:THREE.HalfFloatType,samples:4});
  const q=[Math.max(1,W0>>2),Math.max(1,H0>>2)];
  rtA=new THREE.WebGLRenderTarget(...q,{type:THREE.HalfFloatType});rtB=new THREE.WebGLRenderTarget(...q,{type:THREE.HalfFloatType});
  fin.m.uniforms.t.value=rtMain.texture;fin.m.uniforms.b.value=rtB.texture;
}
function placeCam(){
  const vw=VIEWW[OPT.zoom]||10,dist=vw/(2*Math.tan(THREE.MathUtils.degToRad(FOV)/2)*cam.aspect);
  cam.fov=FOV;cam.position.copy(target).addScaledVector(CAMDIR,dist);cam.lookAt(target);cam.updateProjectionMatrix();
  uCurve.value.set(target.x,target.z,CURVE,0);scene.fog.near=dist+FOG[0];scene.fog.far=dist+FOG[1];
}

// ---- さわる：ドラッグで動かす ----
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!drag)return;const k=(VIEWW[OPT.zoom]||10)/innerWidth,dx=(e.clientX-drag.x)*k,dy=(e.clientY-drag.y)*k;drag={x:e.clientX,y:e.clientY};
  target.addScaledVector(RT,-dx).add(new THREE.Vector3(FWD.x,0,FWD.y).multiplyScalar(dy/Math.sin(PITCH)));
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
  groups.push(group('大きさ',[['近い',2],['ふつう',3],['遠い',4]],()=>OPT.zoom,v=>{OPT.zoom=v;placeCam()}));
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
    `描く回数 ${calls}・三角形 ${(tris/1000).toFixed(0)}千<br>画面 ${W0}×${H0}<br>`+
    `せいれい ${sprites.length}体`+(measRes?`<br>${measRes}`:'')+(gpu?`<br><span style="opacity:.6">${gpu}</span>`:'');
}

// ---- まわす ----
let gpu='',prev=performance.now();
function draw(to,sc,cm){renderer.setRenderTarget(to);renderer.render(sc,cm);calls+=renderer.info.render.calls;tris+=renderer.info.render.triangles}
function frame(now){
  const dt=Math.min(.1,(now-prev)/1000);prev=now;uTime.value=now/1000;
  const t0=performance.now();
  stepSpirits(dt);calls=0;tris=0;
  draw(rtMain,scene,cam);
  blur.m.uniforms.t.value=rtMain.texture;blur.m.uniforms.d.value.set(1/rtA.width,0);draw(rtA,blur.s,postCam);
  blur.m.uniforms.t.value=rtA.texture;blur.m.uniforms.d.value.set(0,1/rtA.height);draw(rtB,blur.s,postCam);
  draw(null,fin.s,postCam);
  cpuAcc+=performance.now()-t0;frames++;
  if(meas){meas.dts.push(dt*1000);if(now-meas.t0>10000)endMeasure()}
  if(now-lastT>=1000){fps=frames*1000/(now-lastT);cpuMs=cpuAcc/frames;frames=0;cpuAcc=0;lastT=now;hud()}
  requestAnimationFrame(frame);
}

async function loadMats(){
  const meta=await (await fetch('./tex/mats.json')).json(),names=Object.keys(MATIDX).sort((a,b)=>MATIDX[a]-MATIDX[b]);
  for(const k of names){const t=await new THREE.TextureLoader().loadAsync('./tex/m_'+k+'.png');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;
    uMat.value.push(t);MATSPAN[k]=meta[k].span}
}
async function main(){
  await loadMats();
  buildGround();
  await Promise.all([...PROPS.map(loadProp),...ELS.map(loadSpirit)]);
  sun.castShadow=OPT.shadow;blocked=placeProps(OPT.props);makeSpirits(OPT.spirits);
  resize();addEventListener('resize',resize);buildUI();gpu=gpuName();
  $('load').remove();hud();window.__proto3dReady=true;
  requestAnimationFrame(t=>{prev=t;frame(t)});
}
main().catch(showErr);
