/* はこにわ 3Dの試作：やわらかい3Dの箱庭（スマホの『どうぶつの森』のような見え方。形・キャラクター・絵はまねしない）。
   ゲームとはべつのページ。持ち主が「ルールを破ってもいいので、ゲーム性を保ったまま、できるだけきれいに」とたのんだ（ドット絵・彩度だけのかげ・ゲームの絵の地面は使わない）。
   - 画面：スマホの細かさのまま（2倍まで）なめらかに描く。遠近のあるカメラ（せまい画角）。奥・手前ほど地面が下へまがる（丸い地面 CURVE）。
   - 光：空と地面の色の光（HemisphereLight）・太陽のやわらかいかげ（PCF）・トゥーンのかげ（さかいめをぼかす TOON）・ふちの光（RIM）。
   - しあげ（HD-2D。持ち主がたのんだ）：奥行きでぼかす（ピントはカメラの見るまん中。手前と奥ほどぼける DOF）・明るい所の強いにじみ（BLOOM）・光の筋・あたたかい色（GRADE）・四すみを暗く。
   - 地面：草・あれ地・土の道・がけ・池を、その場で作る色（ノイズ）で描く。地形のマスの絵（マスク）をなめらかに読んで、さかいめを自然に。
   - 植物は持ち主のモデル（make_plants.py）、岩・小物はトリポのモデル（make_uv.py で UV 展開）。材質の絵（make_textures.py）は明るさのむらとしてうすくのせる。
   - 地形と物は、ゲームの草原の最初のマップ（新しいゲーム）のまん中 32×32 マス（map0.js・tex/map.glb。make_map.py が書く）。
     物の形は、ゲームのドット絵を作った3Dの設計図から。木・しげみ・雑草は持ち主の植物のモデル。
   - 空気感（持ち主がえらんだ）：日なたは金色・かげは青むらさき（光の温度）・奥ほどかすむもや・風でゆれる植物・流れる雲のかげ・光の粒と舞う葉・
     すける葉・接地のかげ・光の筋とあたたかいにじみ。ドット絵（小さい画面に描いて、なめらかにせず大きくする）。
   - 道は草地より少し低く（PATHDIP）、道のふちと段のふちに、とげとげの草（BLADES）。どの面にも絵（地面は Poly Haven の CC0：leafy_grass・dirt_floor・cliff_side）。水はすけて空がうつる・金属は空がうつる。 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {SimplifyModifier} from 'three/addons/modifiers/SimplifyModifier.js';
import {MAP} from './map0.js';

const SPDIR='../tools/art/spirit3d/model/';
// ---- 見え方 ----
const MAPN=MAP.n;              // 地形のはば（マス）。ゲームの草原の最初のマップのまん中（make_map.py）
const BORDER=16;               // まわりに足す地面（マス）
const HSTEP=1.2;               // 段差1つの高さ（マス。前の試作と同じ）
const PITCH=35*Math.PI/180;    // 見おろす角度
const YAW=Math.PI/4;           // カメラの向き（マスの x が右下・z が左下）
const FOV=28;                  // 画角（度）
// 「大きさ」（2・3・4）：前の試作と同じ大きさ。ゲームの1ドット（1マス 64/√2 ドット）を、画面の細かい点 2・3・4 こぶんに（細かさは3倍まで）
const viewW=()=>innerWidth*Math.min(devicePixelRatio||1,3)/OPT.zoom/(64/Math.SQRT2);  // 画面の横に入るマスの数（カメラの見るまん中で）
const CURVE=0;                 // 丸い地面：カメラの見るまん中から、奥・手前へ d マスはなれた所を d²×CURVE だけ下げる（0：まげない。持ち主がきめた）
const MAXPR=2;                 // 画面の細かさ（スマホの点の何倍まで）。ドット絵の1ドットは、この点の「大きさ」こぶん
// ---- 光とかげ ----
const SKY='#d7ecf0',SKYTOP='#2f86d6',GROUND='#7f9a5a',FOG=[14,46];  // 地平の空の色（霧）・上の空の色・地面からの光・霧のはじまりとおわり（カメラの見るまん中より先、マス）
const HEMI=.8,SUN=2.3,SUNCOL='#ffd9a6',HEMISKY='#a8cdf5';             // 空と地面の光・太陽の光（持ち主の参考の絵：日の光が強く、かげとの差がはっきり）
const SUNDIR=[-.55,1,.35];                           // 太陽の向き（せかい。左上・手前から）
const TOON=[.36,.62,1,1];                             // トゥーンの明るさのだん（かげ→光。なめらかにつなぐ）
const RIM={k:.35,pow:3,col:[1,.96,.86]};             // ふちの光
const AO=.13;                                        // 葉の下のかげ：_under 1だんごとに暗くする量
const TEMP={shadow:[.76,.83,1.14],light:[1.05,1.0,.9]};  // 光の温度：かげ（青むらさき）・日なた（金色）にかける色（PX の前の、もとの考え。いまは PX の青へずらす色で）
// ドット絵シェーダー（持ち主が送った記事「実践ドット絵シェーダー」mizuooon.hatenablog.jp のやり方）：
// 光の量（光の色をのせた明るさ ÷ もとの色の明るさ）を lo〜hi で0〜1にし、PXLV だんにへらす。だん−0.5 を d として、
// 明るさ ×(1+d×PXV)・暗い所は色を青へ（PXHUE）・明るい所はあざやかさを下げる（PXSAT）。ふちどりは、いちばん暗い所の色
const HULL={w:.8};   // 背面法の線：裏返した形を、ゲームの1ドット×この太さぶん外へふくらませて、いちばん暗いだんの色で描く（輪郭と、物どうしの境界の線）
const PX={lv:4,vUp:.28,vDn:.85,hue:.28,sat:.15,gain:1.0,edge:.035,shadow:.45,hl:.95,hlk:.32};
// なめらかなトゥーン（セル画ふう。持ち主がえらんだ）：かげ・光の2だん＋ハイライト。さかいめは細くぼかして、ギザギザをとる
const CEL={cut:.5,soft:.08,shade:-.3,light:.06,hl:.95,hlk:.18};  // cut：かげと光のさかい（シェーディングマップの明るさ×かげ）・shade／light：色の式にわたす d・hl：ハイライトのさかい・hlk：ハイライトの d
// lv：だんの数・vUp／vDn：明るいがわ・暗いがわの明るさの差・shadow：太陽のかげの中は明るさをこの倍に・hl：シェーディングマップがこれより明るい所はハイライト（hlk だけ明るいだん）・edge：ふちどりにする奥行きの差（カメラからのきょりの割合）
// シェーディングマップ（記事）：画面から見た面の向き（x 右・y 上）で、太陽のほう（左上・手前）ほど明るい 0.5+0.5×(太陽との内積)
const MIST={h:1.2,k:.03,col:'#e8f2ea'};               // 地面の近くのもや：この高さ（マス）より下ほど、この色をこのこさで
const WIND={amp:.035,speed:1.3};                     // 風：植物の高さ²にかけるゆれの大きさ・速さ
const CLOUDSH={scale:.05,speed:[.035,.02],k:.3};     // 流れる雲のかげ：ノイズの細かさ・流れる速さ・暗くする量
const SSS={k:.55,col:[1.05,1.0,.55]};                // すける葉：光と反対を向いた葉を、この色で明るく
const METAL={refl:.5,spec:1.6,pow:48};               // 金属：空のうつりこみ・つやの強さ・つやの小ささ
const FALLING={n:22,size:.18};                       // 舞う葉：数・大きさ（マス）
const BLOB={k:.42};
const PATHDIP=.12;                                   // 道を草地より下げる高さ（マス）
const GBUMP={amp:.09,scale:.55,f:1.3,k:.12,t:.001};  // 地面のこぼこ：もりあがりの高さ（マス）・細かさ（形）／面の向きだけのこまかいこぼこ：細かさ・強さ・草の絵から作る強さ
const BLADES={h:[.12,.26],w:.1,pathPer:30,edgePer:12,fieldPer:13,fieldH:.62,clump:4,col:['#58a044','#8fca5c']}; // とげとげの草：高さ・はば（マス）・1マスあたりの数（道のふち・段のふち）・色                                  // 接地のかげ：こさ
const RAYS={k:.08,col:[1,.9,.66]};                   // 光の筋
const PEBBLE={per:1.6,r:[.04,.11],col:['#a99c88','#c9bfae']};   /* 荒れた土地の小石：1マスあたりの数・大きさ（マス）・色 */
const CRACK={scale:1.5,w:.07,k:.3};                              /* 荒れた土地のひび：細かさ・線のはば・こさ */
const WATER={shallow:'#8ed3c4',deep:'#236f86',caus:.16,cloud:.35,alpha:[.5,.94]};   /* 水：岸の近くの色・深い所の色・底にゆれる光のあみ・うつる雲のこさ・すけぐあい（岸・深い所） */
const RIPPLE={cell:1.7,period:5.5,r:.62,k:.22};   /* 水面の波紋：1つの波紋のマスの大きさ・出るまでの秒・広がる半径・明るさ */
const GLINT={n:16,k:1.3};                         /* 水面のきらめきの粒：細かさ（1マスあたり）・明るさ */
const DUST={n:160,every:.22,life:.7,size:.34,dry:'#d9c7a2',grass:'#a6cf7a'};   /* 足もとの土けむり：粒の数（上限）・出す間（秒）・消えるまで（秒）・大きさ（マス）・荒れた土地と草地の色 */
// ---- しあげ ----
const DOF={near:.5,far:.8,amt:.4};   // 奥行きのぼかし：ピントの所（カメラの見るまん中）から、手前へ near・奥へ far（カメラのきょりに対する割合）はなれると、いちばんぼける（ぼかしの強さ）
const SSAO={r:.6,k:1.7,bias:.012,max:1.6};  /* すみのやわらかいかげ（空の光がとどきにくい所）：しらべる半径（マス）・こさ・平らな面を暗くしないためのあそび・これより奥行きがはなれた物は数えない（マス） */
const BLOOM={th:.95,k:.12,col:[1,.86,.62]};  // にじみ：これより明るい所を、この強さ・あたたかい色で
const GRADE={warm:[1.0,1.0,1.0],sat:1.0,vig:.15,exp:.9};  // あたたかい色・あざやかさ・四すみ・明るさ（ACES のトーンカーブの前にかける）
// ---- 地面の色（sRGB） ----
const COLS={grassA:'#74ad52',grassB:'#5c9848',grassC:'#8dbd5e',dry:'#c4a97c',path:'#d9b98a',pathB:'#c7a173',cliff:'#b98d63',cliffB:'#9a7250',water:'#5cc3e6',waterB:'#2f9ccc',foam:'#eafaff'};
const OBJSCALE=1.5;             // 地形（マス・段差）に対する、せいれい・植物・岩・小物の大きさ（持ち主がきめた）
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
const PROPS=[PLANT('T0',1.9,0,'tree'),PLANT('B0',.7,0,'small'),...['F0','F1','F2','F3','F4','F5','F6','F7','F8','F9'].map(id=>PLANT(id,.45,0,'tiny'))];
// マップの物（tex/map.glb）：ゲームのドット絵を作った3Dの設計図から。nat：自然の物（地形に対して OBJSCALE 倍・向きをばらばらに）。piv：まわす・大きくするまん中（マスの左上から）
const MAPOBJ={deadtree:{nat:1,piv:[.5,.5],solid:1},rock:{nat:1,piv:[.5,.5],solid:1},kinoko:{nat:1,piv:[.5,.5]},sacred:{nat:1,big:1,piv:[2,2]},statueb:{piv:[0,0]},floor:{piv:[0,0]},door:{piv:[0,0]},hwall:{piv:[0,0],solid:1},farm:{piv:[0,0]}};
// 自然の物の色（tex/map.glb の色の明るさのむらはのこし、色をこの色に）。moss：下のほうにのせるコケの色と、のせる高さ（物の高さの割合）
const NATCOL={farm:{col:'#7d5638'},rock:{col:'#b4b1ab',moss:'#6d8a4c',mossH:.38},deadtree:{col:'#9a8572'}};
const FLOWERS={per:.4};
const PETAL={sat:1.05,tex:.75};      /* 花びらのあざやかさ（もとの色の何倍） */
const TINYHULL=.3;          /* 花・草（細い物）の背面法の線の太さ（ふつうの何倍） */   /* よみがえった草地の花・草（持ち主の植物 F）：1マスに置く割合 */
const LEAFSOFT={lo:.8,hi:1.12,rim:.3};   /* 木の葉をふんわり：下を向いた面・上を向いた面の明るさ、ふちの光 */
const MAPPLANT={ntree:'T0',berry:'B0'};   // 木・ベリーのしげみは、持ち主の植物のモデル。雑草（weed）は F のどれか
const objBase=n=>n.split('_')[0];  // 名前の _ のあとは、つなぎ方（壁・畑）・向き（ドア）
const MATIDX={wood:1,stone:2,metal:3,cloth:4,bark:5,leaf:6,soil:7};  // soil：畑の土（地面の土の絵 g_dirt）
const LEAFTEX={file:'m_leaf.jpg',span:.45,mean:[.1373,.4102,0]};  // 持ち主の葉っぱの絵（色つき）：1まいのマス・絵の色の平均（linear）
const MATK={1:.6,2:.95,3:.45,4:.65,5:1.0,7:1.0};  // 材質の絵の明るさのむらを、色にのせる強さ（材質の番号ごと。木の皮はこく）
const GTEX={grass:{f:'g_grass.jpg',span:3,lum:.248},dirt:{f:'g_dirt.jpg',span:2.5,lum:.316},cliff:{f:'g_cliff.jpg',span:2.4,lum:.121}};  // 地面の絵（1まいのマス・明るさの平均 linear）

const C3=h=>{const c=new THREE.Color(h);c.convertLinearToSRGB();return `vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`};
const $=id=>document.getElementById(id);
const showErr=e=>{const b=$('err');b.style.display='block';b.textContent+=String(e&&e.stack||e)+'\n'};
addEventListener('error',e=>showErr(e.error||e.message));addEventListener('unhandledrejection',e=>showErr(e.reason));

// ---- 設定（ボタン） ----
const OPT={zoom:1.5,spirits:20,props:1,shadow:true,low:false};
try{Object.assign(OPT,JSON.parse(localStorage.getItem('hakoniwa-proto3d6')||'{}'))}catch(e){}
const saveOpt=()=>{try{localStorage.setItem('hakoniwa-proto3d6',JSON.stringify(OPT))}catch(e){}};

// ---- 地形（ゲームの草原の最初のマップ） ----
const HM=[],KIND=[],GRASS=[];
for(let z=0;z<MAPN;z++){HM.push([]);KIND.push([]);GRASS.push([]);for(let x=0;x<MAPN;x++){
  const k=MAP.kind[z][x];HM[z].push(MAP.hi[z][x]);KIND[z].push(k==='w'||k==='s'?'w':k==='p'?'p':'g');GRASS[z].push(+MAP.grass[z][x])}}  // 地形：段の高さ・水（浅瀬も）・道・よみがえった草地（ほかは荒れた土地）
const inMap=(x,z)=>x>=0&&z>=0&&x<MAPN&&z<MAPN;
// 地面をもりあげない所（家・畑・神殿・切り株の下）と、せいれいが通れない所
const FLAT=new Set(),SOLID=new Set();
for(const [x,z,n] of MAP.objs){const b=objBase(n),add=(S,a,c)=>{for(let dz=0;dz<c;dz++)for(let dx=0;dx<a;dx++)S.add((x+dx)+','+(z+dz))};
  if(b==='statueb'){for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){FLAT.add((x+dx)+','+(z+dz));if(dz<1||dx===0)SOLID.add((x+dx)+','+(z+dz))}}
  else if(b==='sacred'){add(FLAT,4,4);for(const [a,c] of [[1,1],[2,1],[1,2],[2,2]])SOLID.add((x+a)+','+(z+c))}
  else if(['floor','door','hwall','farm'].includes(b))add(FLAT,1,1);
  if(MAPOBJ[b]&&MAPOBJ[b].solid||MAPPLANT[b])SOLID.add(x+','+z)}
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
scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,50,80);  // 背景は空の球（buildSky）でおおう
const cam=new THREE.PerspectiveCamera(FOV,1,1,200);
const target=new THREE.Vector3(MAPN/2,0,MAPN/2);
const CAMDIR=new THREE.Vector3(Math.sin(YAW)*Math.cos(PITCH),Math.sin(PITCH),Math.cos(YAW)*Math.cos(PITCH));
const RT=new THREE.Vector3(Math.cos(YAW),0,-Math.sin(YAW));        // 画面の右
const FWD=new THREE.Vector2(-Math.sin(YAW),-Math.cos(YAW));         // 画面の奥（地面の上）
scene.add(new THREE.HemisphereLight(HEMISKY,GROUND,HEMI));
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
vec4 cwp=modelMatrix*mvPosition;
#ifdef TN_WIND
{float wh=max(transformed.y,0.);vec2 ph=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xz;cwp.xz+=vec2(sin(uTime*${WIND.speed}+ph.x*.7+ph.y*.3),cos(uTime*${(WIND.speed*.83).toFixed(2)}+ph.y*.6))*${WIND.amp}*wh*wh;} // 風でゆれる（上ほど大きく）
#endif
vec3 cwp0=cwp.xyz;float cd=dot(cwp.xz-uCurve.xy,vec2(${FWD.x.toFixed(5)},${FWD.y.toFixed(5)}));cwp.y-=uCurve.z*cd*cd;
mvPosition=viewMatrix*cwp;gl_Position=projectionMatrix*mvPosition;`;
// 全部の物の頂点に、丸い地面をかける（three の project_vertex をおきかえる）
function curveVS(sh){sh.uniforms.uCurve=uCurve;sh.uniforms.uTime=uTime;sh.vertexShader='uniform vec4 uCurve;uniform float uTime;\n'+sh.vertexShader.replace('#include <project_vertex>',CURVE_VS)}
const RIM_FS=`outgoingLight+=vec3(${RIM.col.join(',')})*${RIM.k.toFixed(2)}*pow(1.-clamp(dot(normalize(normal),normalize(vViewPosition)),0.,1.),${RIM.pow}.)*(.4+.6*clamp(normal.y*.5+.5,0.,1.));`;
const uMat={value:[]},uSunV={value:new THREE.Vector3()},uViewInv={value:new THREE.Matrix3()};
const LUM='vec3(.3,.59,.11)';
// 光のあと（トゥーンの光の量を見て）：光の温度・流れる雲のかげ・地面の近くのもや。どの物にもかける
// ドット絵シェーダー（記事）：シェーディングマップの明るさ×太陽のかげ → PX.lv だん → 記事の色の式。そのあと、もとの光は使わない
// ノーマルマップ（持ち主がきめた：ツルツル（金属・水）いがいの、どの物にも）：材質・地面の絵の明るさを高さとして、
// 絵の上の、となりの場所との高さの差（tnG：UV の向きごとのかたむき）から、面の向きをかたむける。UV の向き（tnUV）は、画面でのかわり方からもとめる。
// （画面のとなりの点との高さの差から作ると、点ごとにばらばらの向きになって、ザラザラになった。絵はとおくで自動でぼけるので、とおくでもちらつかない）
const BUMP={mat:.012,leaf:.008,ground:.05,soil:.03,light:.9,e:.004};   /* でこぼこの強さ（材質・葉・地面・畑の土）・でこぼこの向きで明るさをかえる強さ・となりの場所までの長さ（UV） */
const CLOD={amp:.035,f:11};   /* 畑の土のかたまり：形のでこぼこの高さ（マス）・細かさ */
const BUMP_FS=`{vec3 sp=-vViewPosition,q0=dFdx(sp),q1=dFdy(sp),bN=normalize(normal);vec2 s0=dFdx(tnUV),s1=dFdy(tnUV);vec3 q1p=cross(q1,bN),q0p=cross(bN,q0),bT=q1p*s0.x+q0p*s1.x,bB=q1p*s0.y+q0p*s1.y;
  float bd=max(dot(bT,bT),dot(bB,bB));if(bd>0.)tnBump+=normalize(bN-(bT*tnG.x+bB*tnG.y)*inversesqrt(bd))-bN;}
`;
const PXSHADE_FS=`{vec3 nV=normalize(normal+tnBump);float sm=.5+.5*dot(nV,uSunV),shd=getShadowMask(),s=sm*mix(${PX.shadow},1.,shd);
  vec3 b=pow(max(diffuseColor.rgb,0.),vec3(1./2.2));float lit=smoothstep(${CEL.cut-CEL.soft},${CEL.cut+CEL.soft},s);
  vec3 o=mix(pxShade(b,${CEL.shade.toFixed(2)}),pxShade(b,${CEL.light.toFixed(2)}),lit);
  o=mix(o,pxShade(b,${CEL.hlk.toFixed(2)}),smoothstep(${CEL.hl-CEL.soft},${CEL.hl+CEL.soft},sm)*step(.5,shd));o*=clamp(1.+${BUMP.light}*(dot(nV,uSunV)-dot(normalize(normal),uSunV)),.55,1.45);outgoingLight=lin(o)*${PX.gain.toFixed(2)};}
`;
// 光のあと：流れる雲のかげ・地面の近くのもや。どの物にもかける
const AIR_FS=`{float cs=smoothstep(.5,.72,fbm(vWP.xz*${CLOUDSH.scale}+uTime*vec2(${CLOUDSH.speed.join(',')})));outgoingLight*=1.-${CLOUDSH.k}*cs; // 雲のかげ
  outgoingLight=mix(outgoingLight,lin(${C3(MIST.col)})*dot(outgoingLight,${LUM})*1.3,${MIST.k}*clamp(1.-vWP.y/${MIST.h},0.,1.));}  // もや
`;
// o：MeshToonMaterial の設定。extra：{mat:材質の絵をのせる, uvk:UV にかける数, span, wind:風でゆれる}
function toon(o={},extra={}){
  const m=new THREE.MeshToonMaterial({gradientMap:GRAD,...o});
  m.onBeforeCompile=sh=>{curveVS(sh);Object.assign(sh.uniforms,{uMat,uSunV,uViewInv});
    if(extra.wind)sh.vertexShader='#define TN_WIND\n'+sh.vertexShader;
    sh.vertexShader='attribute float _under,_mat;varying float vUnder,vMat;varying vec2 vUv2;varying vec3 vWP;\n'+sh.vertexShader.replace('void main() {','void main() {\nvUnder=_under;vMat=_mat;vUv2=uv;').replace(CURVE_VS,CURVE_VS+'\nvWP=cwp0;');
    sh.fragmentShader='uniform sampler2D uMat[7];uniform vec3 uSunV;uniform mat3 uViewInv;uniform float uTime;varying float vUnder,vMat;varying vec2 vUv2;varying vec3 vWP;\nfloat tnMh(int k,vec2 u){return k==0?texture2D(uMat[0],u).r:k==1?texture2D(uMat[1],u).r:k==2?texture2D(uMat[2],u).r:k==3?texture2D(uMat[3],u).r:k==4?texture2D(uMat[4],u).r:texture2D(uMat[6],u).g;}\n'+NOISE+sh.fragmentShader
      .replace('void main() {','#include <shadowmask_pars_fragment>\nvoid main() {')
      .replace('#include <color_fragment>',`#include <color_fragment>
  int tnK=int(vMat+.5)-1;vec3 tnBump=vec3(0.);vec2 tnG=vec2(0.),tnUV=vUv2;
  ${extra.mat?`{int k=tnK;
    if(k==5){vec3 t=texture2D(uMat[5],vUv2*${(extra.uvk*extra.span/LEAFTEX.span).toFixed(4)}).rgb;float lm=dot(vec3(${LEAFTEX.mean.join(',')}),${LUM}); // 葉：葉っぱの絵のすじと明るさを、植物の色にのせる
      float l=dot(t,${LUM})/lm,gr=step(max(diffuseColor.r,diffuseColor.b),diffuseColor.g); // 花びら（緑でない所）は、すじと明るさだけ
      diffuseColor.rgb=mix(diffuseColor.rgb*l,t*dot(diffuseColor.rgb,${LUM})/lm,.12*gr);
      if(gr<.5){vec3 pc=diffuseColor.rgb/max(l,1e-3);float pl=dot(pc,${LUM});diffuseColor.rgb=max(mix(vec3(pl),pc,${PETAL.sat}),0.)*mix(1.,l,${PETAL.tex});}{vec2 uq=vUv2*${(extra.uvk*extra.span/LEAFTEX.span).toFixed(4)};tnUV=uq;tnG=(vec2(dot(texture2D(uMat[5],uq+vec2(${BUMP.e},0.)).rgb,${LUM}),dot(texture2D(uMat[5],uq+vec2(0.,${BUMP.e})).rgb,${LUM}))/lm-l)*${(BUMP.leaf/BUMP.e).toFixed(3)};}}  /* 花びら（緑でない所）：葉っぱの絵はほとんどのせず、色をあざやかに */
    else if(k>=0){vec2 uv=vUv2*${extra.uvk.toFixed(4)};float l=k==0?texture2D(uMat[0],uv).r:k==1?texture2D(uMat[1],uv).r:k==2?texture2D(uMat[2],uv).r:k==3?texture2D(uMat[3],uv).r:k==4?texture2D(uMat[4],uv).r:texture2D(uMat[6],uv).g;
    float mk=k==0?${MATK[1].toFixed(2)}:k==1?${MATK[2].toFixed(2)}:k==2?${MATK[3].toFixed(2)}:k==3?${MATK[4].toFixed(2)}:k==4?${MATK[5].toFixed(2)}:${MATK[7].toFixed(2)};diffuseColor.rgb*=mix(1.,l*2.,mk);tnUV=uv;tnG=(vec2(tnMh(k,uv+vec2(${BUMP.e},0.)),tnMh(k,uv+vec2(0.,${BUMP.e})))-l)*(k==2?0.:k==6?${(BUMP.soil/BUMP.e).toFixed(3)}:${(BUMP.mat/BUMP.e).toFixed(3)});}}`:''}
  diffuseColor.rgb*=1.-${AO.toFixed(2)}*vUnder;`)
      .replace('#include <opaque_fragment>',BUMP_FS+PXSHADE_FS+RIM_FS+`
  {vec3 n=normalize(normal),V=normalize(vViewPosition);
   if(tnK==5){float up=(uViewInv*n).y;outgoingLight*=mix(${LEAFSOFT.lo},${LEAFSOFT.hi},smoothstep(-.5,.8,up));   /* 木の葉をふんわり：上を向いた面は明るく・下はこく、ふちに日の色の光 */
     outgoingLight+=diffuseColor.rgb*vec3(1.,.98,.7)*${LEAFSOFT.rim}*pow(1.-clamp(dot(n,V),0.,1.),2.)*clamp(up+.4,0.,1.);}
   if(tnK==5)outgoingLight+=diffuseColor.rgb*vec3(${SSS.col.join(',')})*${SSS.k}*max(0.,-dot(n,uSunV));      // すける葉：光と反対を向いた葉も明るく
   if(tnK==2){vec3 Rv=reflect(-V,n),Rw=uViewInv*Rv;vec3 env=mix(lin(${C3(GROUND)}),lin(${C3(SKYTOP)})*1.4,smoothstep(-.2,.6,Rw.y)); // 金属：空のうつりこみとつや
     outgoingLight=mix(outgoingLight,env*diffuseColor.rgb*2.2,${METAL.refl})+vec3(1.,.95,.85)*${METAL.spec}*pow(max(dot(Rv,uSunV),0.),${METAL.pow}.);}}
`+AIR_FS+'\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey=()=>'toon'+(extra.mat?extra.uvk.toFixed(3):'')+(extra.wind?'w':'');
  return m;
}

// 背面法の線のマテリアル：o はもとの物の色（color・vertexColors）。w：ふくらませる長さ（物の座標。ドットの太さ÷物の大きさ）
function hullMat(o,w){
  const m=new THREE.MeshBasicMaterial({...o,side:THREE.BackSide});
  m.onBeforeCompile=sh=>{curveVS(sh);
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normalize(normal)*'+w.toFixed(5)+';');
    sh.fragmentShader=NOISE+sh.fragmentShader.replace('#include <opaque_fragment>','gl_FragColor=vec4(lin(pxShade(pow(max(diffuseColor.rgb,0.),vec3(1./2.2)),-.5))*.85,1.);')};
  m.customProgramCacheKey=()=>'hull'+w.toFixed(5)+(o.vertexColors?'v':'');return m;
}
const dotW=()=>HULL.w/(64/Math.SQRT2);   // ゲームの1ドットの長さ（マス）×太さ

// ---- 地面（その場で作る色） ----
// マスクの絵：R 道・G 池・B あれ地（草のない所）。1マス MASKR 点。なめらかに読み、ノイズでさかいめをゆらす
// R は道の度合い（0〜1。マスの中心どうしをなめらかにつなぎ、ノイズでゆらして、しきいでくっきり）。地形の高さ（道を下げる）とも同じ値を使う
const MASKR=8,MN=MAPN+2*BORDER;
const cpuNoise=(()=>{const N=64,v=new Float32Array(N*N);let sd=91;for(let i=0;i<N*N;i++){sd=(sd*16807)%2147483647;v[i]=sd/2147483647}
  const at=(i,j)=>v[((j%N+N)%N)*N+((i%N+N)%N)];return (x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    return (at(i,j)*(1-sx)+at(i+1,j)*sx)*(1-sy)+(at(i,j+1)*(1-sx)+at(i+1,j+1)*sx)*sy}})();
const pathTile=(x,z)=>inMap(x,z)&&KIND[z][x]==='p'?1:0;
const waterTile=(x,z)=>isW(x,z)?1:0;
function pmAt(px,pz,tile=pathTile){ // 道（と池）の度合い：マスの中心で 0/1 をなめらかにつなぎ、ノイズでさかいめをゆらす（池のかどもまるく）
  const u=px-.5,v=pz-.5,i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j;
  const b=(tile(i,j)*(1-fx)+tile(i+1,j)*fx)*(1-fy)+(tile(i,j+1)*(1-fx)+tile(i+1,j+1)*fx)*fy;
  const n=cpuNoise(px*1.7,pz*1.7)*.6+cpuNoise(px*4.1+9,pz*4.1)*.4;const t=Math.min(1,Math.max(0,(b+(n-.5)*.35-.47)/.06));return t*t*(3-2*t);  // さかいめはくっきり
}
const maskTex=(()=>{const W=MN*MASKR,d=new Uint8Array(W*W*4);
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){const px=(i+.5)/MASKR-BORDER,pz=(j+.5)/MASKR-BORDER,x=Math.floor(px),z=Math.floor(pz),k=inMap(x,z)?KIND[z][x]:'g',o=(j*W+i)*4;
    d[o]=Math.round(255*pmAt(px,pz));d[o+1]=Math.round(255*pmAt(px,pz,waterTile));d[o+2]=!inMap(x,z)||!GRASS[z][x]&&k==='g'?255:0;/* マップの外も荒れた土地 */d[o+3]=255}
  const t=new THREE.DataTexture(d,W,W);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
const NOISE=`
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
float vor(vec2 p){vec2 i=floor(p),f=fract(p);float a=8.,b=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));float d=length(g+vec2(hs(i+g),hs(i+g+17.3))-f);if(d<a){b=a;a=d;}else if(d<b)b=d;}return b-a;}   /* ひびのもよう：いちばん近い点と2ばんめの点の差（0がさかいめ） */
float fbm(vec2 p){return .5*vn(p)+.25*vn(p*2.03+7.)+.125*vn(p*4.01+3.)+.0625*vn(p*8.07+11.);}
vec3 lin(vec3 c){return pow(c,vec3(2.2));}
vec3 pxHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x);}
vec3 pxRgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
vec3 pxShade(vec3 c,float d){vec3 h=pxHsv(c);h.z=clamp(h.z*(1.+d*(d>0.?${PX.vUp}:${PX.vDn})),0.,1.);   // 記事の色の式（sRGB の色で）
  if(d<0.){float dh=fract(2./3.-h.x+.5)-.5;h.x=fract(h.x+dh*(-d)*${PX.hue});}else h.y=clamp(h.y*(1.-d*${PX.sat}),0.,1.);return pxRgb(h);}
`;

const uGTex={value:[]};
function groundMat(){
  const m=new THREE.MeshToonMaterial({gradientMap:GRAD});
  m.onBeforeCompile=sh=>{curveVS(sh);Object.assign(sh.uniforms,{uMask:{value:maskTex},uG:uGTex,uSunV});
    sh.vertexShader='attribute float aTop;varying vec3 vW,vWP;varying float vTop,vNy;\n'+sh.vertexShader.replace('void main() {','void main() {\nvW=(modelMatrix*vec4(position,1.)).xyz;vTop=aTop;vNy=normal.y;').replace(CURVE_VS,CURVE_VS+'\nvWP=cwp0;');
    sh.fragmentShader='uniform sampler2D uMask,uG[3];uniform float uTime;uniform vec3 uSunV;varying vec3 vW,vWP;varying float vTop,vNy;\n'+NOISE+sh.fragmentShader.replace('void main() {','#include <shadowmask_pars_fragment>\nvoid main() {').replace('#include <opaque_fragment>',BUMP_FS+PXSHADE_FS+AIR_FS+'\n#include <opaque_fragment>').replace('#include <color_fragment>',`#include <color_fragment>
  vec3 tnBump=vec3(0.);vec2 tnG=vec2(0.),tnUV=vW.xz;
  {vec2 p=vW.xz;
   if(vNy>.5){float e=.1,h0=fbm(p*${GBUMP.f}),hx=fbm((p+vec2(e,0.))*${GBUMP.f}),hz=fbm((p+vec2(0.,e))*${GBUMP.f});   // 地面のこまかいこぼこ（面の向きだけ）
     vec3 gt0=texture2D(uG[0],p/${GTEX.grass.span}.).rgb,gtx=texture2D(uG[0],(p+vec2(.03,0.))/${GTEX.grass.span}.).rgb,gtz=texture2D(uG[0],(p+vec2(0.,.03))/${GTEX.grass.span}.).rgb;
     float l0=dot(gt0,vec3(.3,.59,.11));tnBump=mat3(viewMatrix)*vec3(-(hx-h0)/e*${GBUMP.k}-(dot(gtx,vec3(.3,.59,.11))-l0)/.03*${GBUMP.t},0.,-(hz-h0)/e*${GBUMP.k}-(dot(gtz,vec3(.3,.59,.11))-l0)/.03*${GBUMP.t});}vec2 muv=(p+${BORDER}.)/${MN}.;
   float n1=fbm(p*.35),n2=fbm(p*1.7+5.),n3=vn(p*6.);
   vec3 mk=texture2D(uMask,muv+(vec2(fbm(p*1.3),fbm(p*1.3+9.))-.5)*.012).rgb;
   vec3 g=mix(${C3(COLS.grassB)},${C3(COLS.grassA)},smoothstep(.3,.7,n1));g=mix(g,${C3(COLS.grassC)},smoothstep(.62,.8,n2)*.6);
   g*=.94+.1*n3;                                                         // 草のこまかい色むら
   {vec3 gt=texture2D(uG[0],p/${GTEX.grass.span}.).rgb;g=lin(g);g*=mix(1.,dot(gt,vec3(.3,.59,.11))/${GTEX.grass.lum},.75);g=pow(g,vec3(1./2.2));} // 草の絵（明るさのむら）
   float tuft=step(.82,hs(floor(p*5.)))*smoothstep(.35,.0,length(fract(p*5.)-.5));g=mix(g,g*1.12+vec3(.02,.03,0.),tuft); // 小さな草のかたまり
   vec3 dry=mix(${C3(COLS.dry)},${C3(COLS.dry)}*.92,n2);
   {vec3 dt=texture2D(uG[1],p/${GTEX.dirt.span}+.37).rgb;dry=pow(lin(dry)*mix(1.,dot(dt,vec3(.3,.59,.11))/${GTEX.dirt.lum},.7),vec3(1./2.2));}  // 荒れた土地：土の絵の明るさのむら
   dry*=1.-${CRACK.k}*smoothstep(${CRACK.w},0.,vor(p*${CRACK.scale}+vec2(n1,n2)*.6))*smoothstep(.4,.62,fbm(p*.22+3.));   /* かわいた土のひび（所どころ） */
   g=mix(g,dry,smoothstep(.45,.6,mk.b+(n1-.5)*.3));
   vec3 pth=mix(${C3(COLS.pathB)},${C3(COLS.path)},smoothstep(.2,.8,n2))*(.95+.08*n3);
   {vec3 dt=texture2D(uG[1],p/${GTEX.dirt.span}).rgb;pth=pow(mix(lin(pth)*dot(dt,vec3(.3,.59,.11))/${GTEX.dirt.lum},dt*1.05,.55),vec3(1./2.2));}  // 土の絵
   float pr=texture2D(uMask,muv).r,pm=smoothstep(.42,.58,pr);   // 道（さかいめはくっきり）
   g*=1.-.22*smoothstep(.05,.42,pr)*(1.-pm);                      // 道のふちの草：少しかげって、土手に見える
   vec3 c=mix(g,pth,pm);
   if(vNy<.5){  // がけの横の面：土の地層と、上のふちの草
     vec3 ct=texture2D(uG[2],vec2(p.x+p.y,-vW.y)/${GTEX.cliff.span}).rgb;vec3 cl=pow(lin(${C3(COLS.cliff)})*dot(ct,vec3(.3,.59,.11))/${GTEX.cliff.lum}*.7+ct*.9,vec3(1./2.2)); // がけの絵
     float q=(p.x+p.y)*6.,tooth=.06+.16*hs(vec2(floor(q),3.))*(1.-abs(fract(q)*2.-1.));c=mix(cl,c,step(vTop-tooth,vW.y));}  // 上のふちの草：とげとげにたれる
   {float e=.02,sD=max(pm,smoothstep(.45,.6,mk.b+(n1-.5)*.3));vec3 L3=vec3(.3,.59,.11);   /* ノーマルマップ：草・土・がけの絵の明るさを高さに */
    if(vNy<.5){vec2 q=vec2(p.x+p.y,-vW.y);tnUV=q;tnG=(vec2(dot(texture2D(uG[2],(q+vec2(e,0.))/${GTEX.cliff.span}).rgb,L3),dot(texture2D(uG[2],(q+vec2(0.,e))/${GTEX.cliff.span}).rgb,L3))-dot(texture2D(uG[2],q/${GTEX.cliff.span}).rgb,L3))/e*${BUMP.ground};}
    else{
#define TNGH(q) mix(dot(texture2D(uG[0],(q)/${GTEX.grass.span}.).rgb,L3)/${GTEX.grass.lum},dot(texture2D(uG[1],(q)/${GTEX.dirt.span}).rgb,L3)/${GTEX.dirt.lum},sD)
     tnUV=p;tnG=(vec2(TNGH(p+vec2(e,0.)),TNGH(p+vec2(0.,e)))-TNGH(p))/e*${(BUMP.ground*.3).toFixed(4)};}}
   diffuseColor.rgb=lin(c);}`);
  };
  m.customProgramCacheKey=()=>'ground';return m;
}
const SUB=4;   // 地形のマスは、上の面を SUB×SUB に分けて、道を下げ、ゆるやかにもりあげる
// 地面の高さ：段の高さ − 道の下げ ＋ ゆるやかなもりあがり（段・池・地図のはしのさかいでは0にして、ふちをそろえる）
function bumpAt(px,pz){const x=Math.floor(px),z=Math.floor(pz);if(!inMap(x,z)||isW(x,z)||FLAT.has(x+','+z))return 0;const y=yTop(x,z);let f=1;
  const ex=[px-x,0,x+1-px],ez=[pz-z,0,z+1-pz];   /* となりのマスのがわのはしまでの長さ（ななめのとなりは、かどまで。長いほう） */
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;
    if(!inMap(nx,nz)||yTop(nx,nz)!==y||FLAT.has(nx+','+nz)){const t=Math.min(1,Math.max(dx?ex[dx+1]:0,dz?ez[dz+1]:0)/.35);f*=t*t*(3-2*t)}}   /* 段・池・地図のはし・家などの平らなマスとのさかいでは0（すきまを作らない） */
  return GBUMP.amp*(cpuNoise(px*GBUMP.scale+31,pz*GBUMP.scale+17)-.5)*2*f}
const groundH=(px,pz)=>{const x=Math.floor(px),z=Math.floor(pz);return yTop(x,z)-(inMap(x,z)&&!isW(x,z)?PATHDIP*pmAt(px,pz):0)+bumpAt(px,pz)};
// 地面の形（上の面を SUB×SUB に分けた板）の上の高さ：草などを、板から浮かせない・うめない
const meshH=(px,pz)=>{const x=Math.floor(px),z=Math.floor(pz),u=(px-x)*SUB,v=(pz-z)*SUB,i=Math.min(SUB-1,Math.floor(u)),j=Math.min(SUB-1,Math.floor(v)),fx=u-i,fy=v-j,e=.9999,
  H=(a,b)=>groundH(Math.min(x+e,x+a/SUB),Math.min(z+e,z+b/SUB));return (H(i,j)*(1-fx)+H(i+1,j)*fx)*(1-fy)+(H(i,j+1)*(1-fx)+H(i+1,j+1)*fx)*fy};
const nearPath=(x,z)=>{for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(pathTile(x+dx,z+dz))return true;return false};
function buildGround(){
  const P=[],N=[],T=[];
  const quad=(vs,n,top)=>{for(const i of [0,1,2,0,2,3]){P.push(...vs[i]);N.push(...(Array.isArray(n[0])?n[i]:n));T.push(top)}};
  for(let z=-BORDER;z<MAPN+BORDER;z++)for(let x=-BORDER;x<MAPN+BORDER;x++){
    const y=yTop(x,z);
    if(inMap(x,z)&&!isW(x,z)){const H=(px,pz)=>groundH(Math.min(x+.9999,Math.max(x,px)),Math.min(z+.9999,Math.max(z,pz))),e=.05,nm=(px,pz)=>{const a=H(px-e,pz)-H(px+e,pz),b=H(px,pz-e)-H(px,pz+e),l=Math.hypot(a,2*e,b);return [a/l,2*e/l,b/l]};
      for(let j=0;j<SUB;j++)for(let i=0;i<SUB;i++){const x0=x+i/SUB,x1=x+(i+1)/SUB,z0=z+j/SUB,z1=z+(j+1)/SUB,V=[[x0,z1],[x1,z1],[x1,z0],[x0,z0]];
        quad(V.map(([a,b])=>[a,H(a,b),b]),V.map(([a,b])=>nm(a,b)),y)}}
    else quad([[x,y,z+1],[x+1,y,z+1],[x+1,y,z],[x,y,z]],[0,1,0],y);
    for(const [dx,dz,A,B,n] of [[0,1,[x,y,z+1],[x+1,y,z+1],[0,0,1]],[0,-1,[x+1,y,z],[x,y,z],[0,0,-1]],[1,0,[x+1,y,z+1],[x+1,y,z],[1,0,0]],[-1,0,[x,y,z],[x,y,z+1],[-1,0,0]]]){
      const ny=yTop(x+dx,z+dz);if(ny>=y-1e-4)continue;
      quad([[A[0],ny-PATHDIP,A[2]],[B[0],ny-PATHDIP,B[2]],[B[0],y,B[2]],[A[0],y,A[2]]],n,y);  // 下のはしは、下げた道より下まで
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('aTop',new THREE.Float32BufferAttribute(T,1));
  const m=new THREE.Mesh(g,groundMat());m.receiveShadow=true;m.castShadow=true;scene.add(m);
  // 池の水：すけて底が見え、空がうつる（ふちほど強く）。ゆれる水面・日の光のきらめき・岸のあわ
  const wg=new THREE.PlaneGeometry(MAPN,MAPN,MAPN*2,MAPN*2);wg.rotateX(-Math.PI/2);wg.translate(MAPN/2,-.16,MAPN/2);
  const wm=new THREE.ShaderMaterial({transparent:true,fog:true,uniforms:{uMask:{value:maskTex},uTime,uCurve,uSunW:{value:new THREE.Vector3(...SUNDIR).normalize()},...THREE.UniformsLib.fog},
    vertexShader:`uniform vec4 uCurve;uniform float uTime;varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec3 transformed=position;vW=(modelMatrix*vec4(position,1.)).xyz;${CURVE_VS}\n#include <fog_vertex>\n}`,
    fragmentShader:`uniform sampler2D uMask;uniform float uTime;uniform vec3 uSunW;varying vec3 vW;\n#include <fog_pars_fragment>\n${NOISE}
      float wv(vec2 p){return fbm(p*1.6+vec2(uTime*.15,uTime*.1))+.5*fbm(p*3.1-vec2(uTime*.12,0.));}
      void main(){vec2 p=vW.xz;float w=texture2D(uMask,(p+${BORDER}.)/${MN}.+(vec2(fbm(p*1.3),fbm(p*1.3+9.))-.5)*.012).g;if(w<.42)discard;
        float e=.04,h0=wv(p);vec3 N=normalize(vec3((h0-wv(p+vec2(e,0.)))*.7,1.,(h0-wv(p+vec2(0.,e)))*.7));    // 水面のゆれ（面の向き）
        vec3 V=normalize(cameraPosition-vW),Rf=reflect(-V,N);float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);    // ふちほど空がうつる（フレネル）
        float dp=smoothstep(.46,.98,w+(fbm(p*.9)-.5)*.12);                                                       // 岸からのはなれぐあい（深さのかわり）
        vec3 sky=mix(lin(${C3(SKY)}),lin(${C3(SKYTOP)}),smoothstep(0.,.6,Rf.y));
        sky=mix(sky,vec3(1.),${WATER.cloud}*smoothstep(.5,.75,fbm(Rf.xz/(Rf.y+.5)*1.4+p*.15+vec2(uTime*.012,0.))));  // うつる雲
        vec3 body=mix(lin(${C3(WATER.shallow)}),lin(${C3(WATER.deep)}),dp);                                      // 岸の近くは明るい水色、深い所はこい青緑
        vec2 cw=p+(vec2(fbm(p*1.1+uTime*.06),fbm(p*1.1+7.-uTime*.05))-.5)*1.1;                                    // 光のあみは、ゆがめて、やわらかく（まっすぐな線にしない）
        float c1=smoothstep(.3,0.,vor(cw*1.9+vec2(uTime*.04,uTime*.025))),c2=smoothstep(.3,0.,vor(cw*3.1-vec2(uTime*.03,0.)+3.));float ca=c1*c1*c2*2.2+.25*c1*c1;
        body+=vec3(.9,1.,.85)*${WATER.caus}*ca*(1.-dp*.75);                                                       // 底にゆれる光のあみ（浅い所ほどはっきり）
        vec3 c=mix(body,sky,clamp(fr*1.8+.06,0.,1.))+vec3(1.,.95,.82)*1.6*pow(max(dot(Rf,uSunW),0.),220.);       // 空のうつりこみ・日の光のきらめき
        {vec2 q=p/${RIPPLE.cell},ci=floor(q);float ph=fract(uTime/${RIPPLE.period}+hs(ci)),rr=ph*${RIPPLE.r},dd=length(fract(q)-.5-(vec2(hs(ci+3.1),hs(ci+7.7))-.5)*.4)*${RIPPLE.cell};   /* 波紋：マスごとに、広がって消える輪 */
         c+=vec3(${RIPPLE.k})*smoothstep(.035,0.,abs(dd-rr))*(1.-ph)*smoothstep(0.,.08,ph)*step(.35,hs(ci+1.3));
         vec2 gi=floor(p*${GLINT.n}.);float tw=pow(.5+.5*sin(uTime*2.6+hs(gi)*6.283),12.);c+=vec3(1.,.97,.86)*${GLINT.k}*tw*step(.972,hs(gi+5.))*smoothstep(.3,0.,length(fract(p*${GLINT.n}.)-.5));}   /* きらめきの粒 */
        float foam=smoothstep(.5,.44,w+.03*sin(uTime*1.6+fbm(p*3.)*9.))*(.55+.45*fbm(p*7.+uTime*.2));c=mix(c,lin(${C3(COLS.foam)}),foam*.7);   // 岸の細いあわ
        gl_FragColor=vec4(c,max(mix(${WATER.alpha[0]},${WATER.alpha[1]},dp),max(fr,foam)));\n#include <fog_fragment>\n}`});
  const water=new THREE.Mesh(wg,wm);water.renderOrder=1;scene.add(water);
}

// とげとげの草：道のふち（草地のがわ）と、段の上のふち（外へかたむけて、ふちからはみ出す）に、細い三角の葉をならべる
function buildBlades(){
  const g=new THREE.BufferGeometry(),w=BLADES.w/2;
  {const P=[],N=[],C=[],I=[],K=4;for(let k=0;k<=K;k++){const t=k/K,ww=w*(1-t*t),zz=.28*t*t,c=.78+.22*t;P.push(-ww,t,zz,ww,t,zz);N.push(0,1,0,0,1,0);C.push(c,c,c,c,c,c);if(k<K){const a=2*k;I.push(a,a+1,a+2,a+1,a+3,a+2,a,a+2,a+1,a+1,a+2,a+3)}}   /* 面の向きは上（地面と同じ明るさに）。うらからも見えるように、うら向きの三角も入れる */
  //   /* 細い葉：先へ細く、しなって前へたおれる。根もとは少し暗く */
   g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I)}
  const L=[],M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),camYaw=Math.atan2(CAMDIR.x,CAMDIR.z);seed=77;
  const add=(x,y,z,lean,dir)=>{for(let k=0;k<BLADES.clump;k++){const h=(BLADES.h[0]+rnd()*(BLADES.h[1]-BLADES.h[0]))*(k?.6+rnd()*.4:1),l2=lean+(rnd()-.5)*.5;   /* 1か所に、向きと高さのちがう葉をたばねる */
    E.set(l2*Math.cos(dir),camYaw+(rnd()-.5)*1.5,l2*Math.sin(dir)+(rnd()-.5)*.5,'YXZ');Q.setFromEuler(E);
    const bx=x+(rnd()-.5)*.07,bz=z+(rnd()-.5)*.07;L.push(M.compose(new THREE.Vector3(bx,y==null?meshH(bx,bz)-.02:y,bz),Q,new THREE.Vector3(1,h,1)).clone())}};   /* y がなければ、地面の板の上に（少しうめる） */
  for(let z=0;z<MAPN;z++)for(let x=0;x<MAPN;x++){
    if(isW(x,z)||!GRASS[z][x])continue;const y=yTop(x,z);  // とげとげの草は、よみがえった草地だけ
    if(nearPath(x,z))for(let k=0;k<BLADES.pathPer*10;k++){const px=x+rnd(),pz=z+rnd(),pm=pmAt(px,pz);if(pm>.01&&pm<.5&&rnd()<.5)add(px,null,pz,(rnd()-.5)*.5,rnd()*6.28)}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){if(yTop(x+dx,z+dz)>=y-1e-4)continue;
    if(!FLAT.has(x+','+z))for(let k=0;k<BLADES.fieldPer;k++){const px=x+rnd(),pz=z+rnd();if(pmAt(px,pz)<.01){add(px,null,pz,(rnd()-.5)*.6,rnd()*6.28);for(let q=1;q<=BLADES.clump;q++){const e=L[L.length-q].elements;e[4]*=BLADES.fieldH;e[5]*=BLADES.fieldH;e[6]*=BLADES.fieldH}}}   /* 草地ぜんたいの短い草 */
      for(let k=0;k<BLADES.edgePer;k++){const t=rnd(),ex=dx?x+(dx>0?1:0)-dx*.03:x+t,ez=dz?z+(dz>0?1:0)-dz*.03:z+t;add(ex,y,ez,.7+rnd()*.5,Math.atan2(dz,dx))}}
  }
  const m=toon({vertexColors:true,color:BLADES.col[1]},{wind:true});const im=new THREE.InstancedMesh(g,m,L.length);
  const c=new THREE.Color();L.forEach((mm,i)=>{im.setMatrixAt(i,mm);c.set(BLADES.col[0]).lerp(new THREE.Color(BLADES.col[1]),rnd());im.setColorAt(i,c)});
  im.receiveShadow=true;im.frustumCulled=false;scene.add(im);
}
// 荒れた土地の小石：ひくい多面体を、荒れた土地にばらまく（石の絵をのせる）
function buildPebbles(){
  const g=new THREE.IcosahedronGeometry(1,1);g.scale(1,.55,1);const n=g.getAttribute('position').count,mk=v=>new THREE.Float32BufferAttribute(new Float32Array(n).fill(v),1);
  g.setAttribute('_mat',mk(MATIDX.stone));g.setAttribute('_under',mk(0));
  const L=[],M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler();seed=131;
  for(let z=0;z<MAPN;z++)for(let x=0;x<MAPN;x++){if(isW(x,z)||GRASS[z][x]||KIND[z][x]!=='g'||FLAT.has(x+','+z))continue;
    for(let k=0;k<3;k++){if(rnd()>PEBBLE.per/3)continue;const px=x+.08+rnd()*.84,pz=z+.08+rnd()*.84,r=PEBBLE.r[0]+rnd()*rnd()*(PEBBLE.r[1]-PEBBLE.r[0]);
      E.set((rnd()-.5)*.5,rnd()*6.28,(rnd()-.5)*.5);Q.setFromEuler(E);L.push(M.compose(new THREE.Vector3(px,groundH(px,pz)+r*.2,pz),Q,new THREE.Vector3(r*(.8+rnd()*.5),r,r*(.8+rnd()*.5))).clone())}}
  const im=new THREE.InstancedMesh(g,toon({color:0xffffff},{mat:true,uvk:3,span:1}),L.length),c=new THREE.Color();
  L.forEach((m,i)=>{im.setMatrixAt(i,m);c.set(PEBBLE.col[0]).lerp(new THREE.Color(PEBBLE.col[1]),rnd());im.setColorAt(i,c)});im.receiveShadow=true;im.frustumCulled=false;scene.add(im);
}
// ---- 空 ----
// 空：上はこい青・地平はうすい青のグラデーションに、ゆっくり流れる白い雲（その場で作る）。丸い地面はかけない。
// カメラは見おろしているので、画面の上に見えるのは、地平より下の向き（丸い地面のむこう）。そこを地平として色をつける（SKYH：向きの上下の成分）
const SKYH=[-.62,-.3];
function buildSky(){
  const g=new THREE.SphereGeometry(150,32,16);
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uTime},
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uTime;varying vec3 vD;${NOISE}
      void main(){vec3 c=mix(${C3(SKY)},${C3(SKYTOP)},smoothstep(${SKYH[0]},${SKYH[1]},vD.y));   // 丸い地面のむこうに見える所から上へ、こい青に
        vec2 q=vD.xz/(vD.y+.9)*2.2+vec2(uTime*.01,0.);float cl=smoothstep(.55,.8,fbm(q))*smoothstep(${SKYH[0]},${SKYH[0]}+.12,vD.y);
        c=mix(c,vec3(1.),cl*.85);gl_FragColor=vec4(lin(c),1.);}`});
  const sky=new THREE.Mesh(g,m);sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);return sky;
}
// ---- モデル ----
const gltf=new GLTFLoader(),fbx=new FBXLoader();
// 面の向きを、同じ場所の点でならす（UV のさかいで点がわかれていても、なめらかなかげに）
// 面の向きを、かど（CREASE 度より急な所）ではならさない。平らな面はまっ平らに、丸い面はなめらかに（箱・石づみの面に、三角のかげのすじを出さない）
const CREASE=40;
function creaseNormals(geo){
  const g=geo.index?geo.toNonIndexed():geo,P=g.getAttribute('position'),n=P.count,FN=new Float32Array(n),cosT=Math.cos(CREASE*Math.PI/180),M=new Map();
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),key=i=>Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4),F=[];
  for(let t=0;t<n/3;t++){a.fromBufferAttribute(P,3*t);b.fromBufferAttribute(P,3*t+1);c.fromBufferAttribute(P,3*t+2);const w=c.sub(b).cross(a.sub(b)).clone(),u=w.clone().normalize();F.push([w,u]);
    for(let k=0;k<3;k++){const q=key(3*t+k);(M.get(q)||M.set(q,[]).get(q)).push(t)}}
  const N=new Float32Array(n*3),v=new THREE.Vector3();
  for(let i=0;i<n;i++){const u=F[(i/3)|0][1];v.set(0,0,0);for(const t of M.get(key(i)))if(F[t][1].dot(u)>cosT)v.add(F[t][0]);v.normalize();N[3*i]=v.x;N[3*i+1]=v.y;N[3*i+2]=v.z}
  g.setAttribute('normal',new THREE.BufferAttribute(N,3));return g;
}
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
  const bb=new THREE.Box3().setFromObject(root),sz=bb.getSize(new THREE.Vector3()),s=p.h*OBJSCALE/sz.y;
  const norm=new THREE.Matrix4().makeScale(s,s,s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2));
  const parts=[];
  root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(norm,o.matrixWorld));
    smoothNormals(geo);const n=geo.getAttribute('position').count,mk=v=>new THREE.Float32BufferAttribute(new Float32Array(n).fill(v),1);
    if(p.src!=='plants'){geo.setAttribute('_mat',mk(p.mat?MATIDX[p.mat]:0));geo.setAttribute('_under',mk(0));geo.deleteAttribute('color')}
    const span=p.src==='plants'?MATSPAN.bark:MATSPAN[p.mat]||1;
    const mat=p.src==='plants'?toon({vertexColors:true},{mat:true,uvk:s/span,span,wind:true}):toon({color:p.tint},{mat:!!p.mat,uvk:s/span,span});
    parts.push({geo,mat,hull:hullMat(p.src==='plants'?{vertexColors:true}:{color:p.tint},dotW()*(p.kind==='tiny'?TINYHULL:1))})});
  p.parts=parts;
}
// 御神木の切り株：なめらかな形を、その場で作る（もとのモデルは粗く、大きくするとガビガビに見えた）。
// 丸い幹（上へ少し細く）・根のはり出し（根もとで外へ広がる、ふぞろいな5本）・ふちを丸めた切り口（年輪の絵）・木の皮の絵。4×4マスのまん中が原点
const STUMP={r:.74,h:.92,flare:.78,flareH:.62,roots:5,bark:'#b0845c',barkDark:'#7a563c',cut:'#f0d9ad',ring:'#b58e5e',seg:96,rows:28};
function buildStump(){
  const S=STUMP,P=[],C=[],U=[],I=[],MT=[],bark=new THREE.Color(S.bark),dark=new THREE.Color(S.barkDark),col=new THREE.Color();
  const ph=[.3,1.7,2.9,4.1,5.4],am=[1,.75,.9,.6,.85];   /* 根の向きと大きさ */
  const root=a=>{let v=0;for(let k=0;k<S.roots;k++){let d=Math.atan2(Math.sin(a-ph[k]),Math.cos(a-ph[k]));v=Math.max(v,am[k]*Math.exp(-d*d/.05))}return v};
  const rad=(a,t)=>{const y=t*S.h,f=Math.max(0,1-y/S.flareH);return S.r*(1-.1*t)+.035*Math.sin(a*9+1)*(1-t*.5)+.02*Math.sin(a*23+t*5)+S.flare*f*f*f*(.12+.88*root(a))};
  for(let j=0;j<=S.rows;j++){const t=j/S.rows,bev=Math.max(0,(t-.93)/.07);   /* 上のふちは丸める */
    for(let i=0;i<=S.seg;i++){const a=i/S.seg*Math.PI*2,r=rad(a,t)*(1-.07*bev*bev),y=t*S.h-(.0)*bev;
      P.push(Math.cos(a)*r,y,Math.sin(a)*r);U.push(y,a*S.r);   /* 木の皮のすじは、たて向き */MT.push(MATIDX.bark);
      const g=.5+.5*Math.sin(a*9+1),k=Math.min(1,.25+.75*Math.min(1,y/.25))*(.8+.2*g);col.copy(dark).lerp(bark,k);C.push(col.r,col.g,col.b)}}   /* みぞと根もとは暗く */
  const W=S.seg+1;for(let j=0;j<S.rows;j++)for(let i=0;i<S.seg;i++){const a=j*W+i,b=a+1,c=a+W,d=c+1;I.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.setAttribute('_mat',new THREE.Float32BufferAttribute(MT,1));g.setAttribute('_under',new THREE.Float32BufferAttribute(new Float32Array(MT.length),1));g.setIndex(I);g.computeVertexNormals();
  /* 切り口：少しふくらんだ円（ふちは幹の上のはしと同じ形）。年輪の絵 */
  const P2=[0,S.h+.02,0],U2=[.5,.5],I2=[],RN=6;for(let k=1;k<=RN;k++)for(let i=0;i<=S.seg;i++){const a=i/S.seg*Math.PI*2,q=k/RN,r=rad(a,1)*.93*q;P2.push(Math.cos(a)*r,S.h+.02*(1-q*q),Math.sin(a)*r);U2.push(.5+.48*q*Math.cos(a),.5+.48*q*Math.sin(a))}
  for(let i=0;i<S.seg;i++)I2.push(0,2+i,1+i);for(let k=1;k<RN;k++)for(let i=0;i<S.seg;i++){const a=1+(k-1)*W+i,b=a+1,c=a+W,d=c+1;I2.push(a,b,c,b,d,c)}
  const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(P2,3));g2.setAttribute('uv',new THREE.Float32BufferAttribute(U2,2));g2.setIndex(I2);g2.computeVertexNormals();
  const n2=P2.length/3;g2.setAttribute('_mat',new THREE.Float32BufferAttribute(new Float32Array(n2),1));g2.setAttribute('_under',new THREE.Float32BufferAttribute(new Float32Array(n2),1));
  /* 年輪の絵：ゆらいだ輪・まん中から外への細いひび・外がわはこい色 */
  const N=512,cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d');x.fillStyle=S.cut;x.fillRect(0,0,N,N);
  const gr=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);gr.addColorStop(0,'rgba(190,140,90,.35)');gr.addColorStop(.25,'rgba(255,240,200,0)');gr.addColorStop(.8,'rgba(255,240,200,0)');gr.addColorStop(1,'rgba(150,105,65,.55)');x.fillStyle=gr;x.fillRect(0,0,N,N);
  let sd=5;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;x.strokeStyle=S.ring;
  for(let r=10;r<N/2-6;r+=9+rn()*9){x.lineWidth=2.5+rn()*3;x.globalAlpha=.6+rn()*.35;const p1=rn()*6,p2=rn()*6;x.beginPath();for(let i=0;i<=120;i++){const a=i/120*Math.PI*2,rr=r*(1+.035*Math.sin(a*3+p1)+.02*Math.sin(a*7+p2));x[i?'lineTo':'moveTo'](N/2+Math.cos(a)*rr,N/2+Math.sin(a)*rr)}x.closePath();x.stroke()}
  x.globalAlpha=.5;x.strokeStyle='#9a7350';for(let k=0;k<7;k++){const a=rn()*6.28,r0=rn()*30,r1=60+rn()*150;x.lineWidth=1+rn()*2;x.beginPath();x.moveTo(N/2+Math.cos(a)*r0,N/2+Math.sin(a)*r0);x.lineTo(N/2+Math.cos(a+.05)*r1,N/2+Math.sin(a+.05)*r1);x.stroke()}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  const hg=g.clone();
  return [{geo:g,hgeo:hg,mat:toon({vertexColors:true},{mat:true,uvk:1/MATSPAN.bark,span:MATSPAN.bark}),hull:hullMat({vertexColors:true},dotW())},{geo:g2,mat:toon({map:tex},{}),hull:null}];
}
let MAPPARTS={};
async function loadMapObjs(){
  const g=await gltf.loadAsync('./tex/map.glb');
  g.scene.traverse(o=>{if(!o.isMesh)return;const b=objBase(o.name),d=MAPOBJ[b];if(!d)return;const s=d.nat&&!d.big?OBJSCALE:1;  // 御神木の切り株は、ゲームと同じ大きさ（4×4マスの物）
    if(b==='sacred'){MAPPARTS[o.name]=buildStump();return}
    const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().makeScale(s,s,s).multiply(new THREE.Matrix4().makeTranslation(-d.piv[0],0,-d.piv[1])));  // まん中を原点に・大きさ
    if(b==='farm'){const P=geo.getAttribute('position');for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),e=Math.min(x,1-x,z,1-z),k=Math.min(1,e/.08)*Math.min(1,y/.02+.3);   /* 畑：土のかたまりのでこぼこ（マスのふちでは0。となりの畑とつながる） */
      P.setY(i,y+CLOD.amp*k*((cpuNoise(x*CLOD.f+5,z*CLOD.f+9)-.5)*1.4+(cpuNoise(x*CLOD.f*2.7,z*CLOD.f*2.7+3)-.5)*.9))}}
    smoothNormals(geo);
    if(NATCOL[b]){const nc=NATCOL[b],C=geo.getAttribute('color'),P=geo.getAttribute('position'),base=new THREE.Color(nc.col),moss=nc.moss&&new THREE.Color(nc.moss);geo.computeBoundingBox();const H=geo.boundingBox.max.y;
      let mean=0;for(let i=0;i<C.count;i++)mean+=.3*C.getX(i)+.59*C.getY(i)+.11*C.getZ(i);mean/=C.count;
      for(let i=0;i<C.count;i++){const l=Math.min(1.5,Math.max(.6,(.3*C.getX(i)+.59*C.getY(i)+.11*C.getZ(i))/mean));let r=base.r*l,g=base.g*l,bl=base.b*l;
        if(moss){const n=cpuNoise(P.getX(i)*9+3,P.getZ(i)*9+7),t=Math.min(1,Math.max(0,(nc.mossH+(n-.5)*.3-P.getY(i)/H)/.12));r+=(moss.r*l-r)*t;g+=(moss.g*l-g)*t;bl+=(moss.b*l-bl)*t}
        C.setXYZ(i,r,g,bl)}}   /* 色をかえる（明るさのむらはのこす）。岩は下のほうにコケ */
    MAPPARTS[o.name]={hgeo:geo,geo:creaseNormals(geo.clone()),mat:toon({vertexColors:true},{mat:true,uvk:s,span:1}),hull:hullMat({vertexColors:true},dotW())}});
}
const SPMODELS={};
async function loadSpirit(el){
  const g=await fbx.loadAsync(SPDIR+el+'.fbx');
  g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),s=SPH*OBJSCALE/bb.getSize(new THREE.Vector3()).y;
  g.scale.multiplyScalar(s);
  const sm=col=>toon({color:col},{mat:true,uvk:s/MATSPAN.cloth,span:MATSPAN.cloth});  // せいれいの体とずきんにも布の絵
  const c=SPCOL[el],flat=col=>{const m=new THREE.MeshBasicMaterial({color:col});m.onBeforeCompile=curveVS;m.customProgramCacheKey=()=>'flat';return m};
  g.traverse(o=>{if(!o.isMesh)return;const n=o.name.toLowerCase();o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;
    {const k=o.geometry.getAttribute('position').count,mk=v=>new THREE.Float32BufferAttribute(new Float32Array(k).fill(v),1);o.geometry.setAttribute('_mat',mk(MATIDX.cloth));o.geometry.setAttribute('_under',mk(0))}
    if(n.startsWith('eye'))o.material=flat(c.eye);
    else if(n.startsWith('cheek'))o.material=flat(c.cheek);
    else if(n.startsWith('hood')||n.startsWith('hane'))o.material=sm(c.hood);
    else if(n.startsWith('sprout'))o.material=sm(SPROUT);
    else if(n.startsWith('headacc'))o.material=sm(HEADACC);
    else o.material=sm(CREAM);
  });
  {const add=[];g.traverse(o=>{if(!o.isMesh)return;const n=o.name.toLowerCase();if(n.startsWith('eye')||n.startsWith('cheek'))return;   // 背面法の線（目・ほっぺはのぞく）
    const h=o.clone();g.updateMatrixWorld(true);h.material=hullMat({color:o.material.color.getHex()},dotW()/o.getWorldScale(new THREE.Vector3()).x);h.castShadow=false;h.receiveShadow=false;add.push([o.parent,h])});
   add.forEach(([p,h])=>p.add(h))}
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

// ---- 接地のかげ（物の足もとのやわらかいかげの絵）・舞う葉 ----
const blobTex=(()=>{const N=64,d=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const r=Math.hypot(i+.5-N/2,j+.5-N/2)/(N/2),a=Math.max(0,1-r);const o=(j*N+i)*4;d[o]=d[o+1]=d[o+2]=0;d[o+3]=Math.round(255*a*a*(3-2*a))}
  const t=new THREE.DataTexture(d,N,N);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
const blobMat=(()=>{const m=new THREE.MeshBasicMaterial({map:blobTex,color:0x2a2440,transparent:true,opacity:BLOB.k,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});m.onBeforeCompile=curveVS;m.customProgramCacheKey=()=>'blob';return m})();
const blobGeo=(()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g})();
// 舞う葉：葉っぱの絵の小さな板が、ゆれながら落ちて、地面につくと上からまた落ちる
let leaves=null;
function buildLeaves(){
  const g=new THREE.PlaneGeometry(FALLING.size,FALLING.size*.6);
  const m=new THREE.MeshToonMaterial({gradientMap:GRAD,map:uMat.value[5],color:0x9ccf62,side:THREE.DoubleSide,alphaTest:.5});m.onBeforeCompile=curveVS;m.customProgramCacheKey=()=>'leaf';
  leaves={mesh:new THREE.InstancedMesh(g,m,FALLING.n),s:[]};seed=57;
  for(let i=0;i<FALLING.n;i++)leaves.s.push({x:(rnd()-.5)*16,y:rnd()*4,z:(rnd()-.5)*16,ph:rnd()*6,sp:.25+rnd()*.25});
  leaves.mesh.frustumCulled=false;scene.add(leaves.mesh);
}
const LM=new THREE.Matrix4(),LQ=new THREE.Quaternion(),LE=new THREE.Euler(),LV=new THREE.Vector3(),LS=new THREE.Vector3(1,1,1);
function stepLeaves(dt,t){
  if(!leaves)return;
  leaves.s.forEach((l,i)=>{l.y-=l.sp*dt;if(l.y<0){l.y=4;l.x=(rnd()-.5)*16;l.z=(rnd()-.5)*16}
    LV.set(target.x+l.x+Math.sin(t*.9+l.ph)*.6,l.y+.1,target.z+l.z+Math.cos(t*.7+l.ph)*.6);LE.set(t*1.7+l.ph,t*1.3+l.ph*2,t+l.ph);LQ.setFromEuler(LE);
    LM.compose(LV,LQ,LS);leaves.mesh.setMatrixAt(i,LM)});
  leaves.mesh.instanceMatrix.needsUpdate=true;
}

// ---- 置く ----
let propMeshes=[];
// マップの物を置く（ゲームの草原の最初のマップと同じ場所）
function placeMap(){
  for(const m of propMeshes){scene.remove(m)}propMeshes=[];
  seed=11;const blobs=[],G={},add=(key,m)=>(G[key]=G[key]||[]).push(m);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S=new THREE.Vector3(1,1,1);
  const blob=(x,z,r)=>blobs.push(new THREE.Matrix4().compose(new THREE.Vector3(x,groundH(x,z)+.01,z),new THREE.Quaternion(),new THREE.Vector3(r,1,r)));
  for(const [x,z,n] of MAP.objs){const b=objBase(n);
    if(b==='weed'){for(let k=0;k<3;k++){const px=x+.15+rnd()*.7,pz=z+.15+rnd()*.7,sc=.85+rnd()*.3;Q.setFromAxisAngle(Y,rnd()*Math.PI*2);S.set(sc,sc,sc);add('P:F'+Math.floor(rnd()*10),M.compose(V.set(px,groundH(px,pz),pz),Q,S).clone())}continue}
    if(MAPPLANT[b]){const sc=.85+rnd()*.3;Q.setFromAxisAngle(Y,rnd()*Math.PI*2);S.set(sc,sc,sc);add('P:'+MAPPLANT[b],M.compose(V.set(x+.5,groundH(x+.5,z+.5),z+.5),Q,S).clone());blob(x+.5,z+.5,(b==='ntree'?1.5:.75)*sc*OBJSCALE);continue}
    const d=MAPOBJ[b];if(!d||!MAPPARTS[n])continue;
    if(d.nat){const px=x+d.piv[0],pz=z+d.piv[1];Q.setFromAxisAngle(Y,b==='sacred'?0:rnd()*Math.PI*2);S.set(1,1,1);add(n,M.compose(V.set(px,groundH(px,pz),pz),Q,S).clone());if(b!=='kinoko')blob(px,pz,b==='sacred'?2.4:(b==='deadtree'?1.2:.75)*OBJSCALE)}
    else{Q.identity();S.set(1,1,1);add(n,M.compose(V.set(x,yTop(x,z),z),Q,S).clone())}
  }
  for(let z=0;z<MAPN;z++)for(let x=0;x<MAPN;x++){if(!GRASS[z][x]||KIND[z][x]!=='g'||FLAT.has(x+','+z)||SOLID.has(x+','+z)||rnd()>FLOWERS.per)continue;   /* よみがえった草地の花・草 */
    for(let k=0,n=1+Math.floor(rnd()*2);k<n;k++){const px=x+.12+rnd()*.76,pz=z+.12+rnd()*.76,sc=.7+rnd()*.4;if(pmAt(px,pz)>.01)continue;Q.setFromAxisAngle(Y,rnd()*Math.PI*2);S.set(sc,sc,sc);add('P:F'+Math.floor(rnd()*10),M.compose(V.set(px,groundH(px,pz),pz),Q,S).clone())}}
  const inst=(geo,mat,ms,shadow,hull,hgeo)=>{const im=new THREE.InstancedMesh(geo,mat,ms.length);ms.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=shadow;im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);propMeshes.push(im);
    if(hull){const hm=new THREE.InstancedMesh(hgeo||geo,hull,ms.length);ms.forEach((m,i)=>hm.setMatrixAt(i,m));hm.computeBoundingSphere();scene.add(hm);propMeshes.push(hm)}};  // 背面法の線
  for(const [key,ms] of Object.entries(G)){
    if(key.startsWith('P:')){const p=PROPS.find(q=>q.id===key.slice(2));for(const part of p.parts)inst(OPT.low?lowGeo(part):part.geo,part.mat,ms,p.kind!=='tiny',part.hull);continue}
    for(const part of [].concat(MAPPARTS[key]))inst(OPT.low?lowGeo(part):part.geo,part.mat,ms,objBase(key)!=='floor',objBase(key)==='floor'?null:part.hull,part.hgeo);   /* 背面法の線は、なめらかにならした向きの形で（かどで線が切れない） */
  }
  const bm=new THREE.InstancedMesh(blobGeo,blobMat,Math.max(1,blobs.length));bm.count=blobs.length;blobs.forEach((m,i)=>bm.setMatrixAt(i,m));bm.renderOrder=2;bm.frustumCulled=false;scene.add(bm);propMeshes.push(bm);
  renderer.shadowMap.needsUpdate=true;
  return SOLID;
}

// ---- 足もとの土けむり：歩くせいれいの足もとに出る、カメラを向いた丸い粒（ふくらんで、小さくなって消える） ----
let dust=null;
function buildDust(){
  const m=new THREE.MeshBasicMaterial({map:blobTex,color:0xffffff,transparent:true,opacity:.75,depthWrite:false});m.onBeforeCompile=curveVS;m.customProgramCacheKey=()=>'dust';
  dust={mesh:new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),m,DUST.n),p:[],next:0};dust.mesh.frustumCulled=false;dust.mesh.renderOrder=3;
  const z=new THREE.Matrix4().makeScale(0,0,0),c=new THREE.Color(DUST.dry);for(let i=0;i<DUST.n;i++){dust.p.push({t:9,x:0,y:0,z:0,vx:0,vz:0});dust.mesh.setMatrixAt(i,z);dust.mesh.setColorAt(i,c)}
  scene.add(dust.mesh);
}
const DCOL=new THREE.Color();
function puff(x,y,z){const i=dust.next;dust.next=(i+1)%DUST.n;const tx=Math.floor(x),tz=Math.floor(z),g=inMap(tx,tz)&&GRASS[tz][tx]&&pmAt(x,z)<.3;
  Object.assign(dust.p[i],{t:0,x:x+(Math.random()-.5)*.12,y:y+.05,z:z+(Math.random()-.5)*.12,vx:(Math.random()-.5)*.25,vz:(Math.random()-.5)*.25,s:(g?.55:1)*(.7+Math.random()*.6)});
  dust.mesh.setColorAt(i,DCOL.set(g?DUST.grass:DUST.dry));dust.mesh.instanceColor.needsUpdate=true}
const DM=new THREE.Matrix4(),DV=new THREE.Vector3(),DS=new THREE.Vector3();
function stepDust(dt){
  dust.p.forEach((d,i)=>{if(d.t>DUST.life)return;d.t+=dt;const k=d.t/DUST.life,sz=k>=1?0:DUST.size*d.s*Math.sin(Math.PI*Math.sqrt(k));   /* ふくらんで、小さくなって消える */
    DM.compose(DV.set(d.x+d.vx*d.t,d.y+.25*k,d.z+d.vz*d.t),cam.quaternion,DS.set(sz,sz,sz));dust.mesh.setMatrixAt(i,DM)});
  dust.mesh.instanceMatrix.needsUpdate=true;
}
// ---- せいれい ----
let sprites=[];let blocked=new Set();
function walkable(x,z,h){return inMap(x,z)&&KIND[z][x]!=='w'&&HM[z][x]===h&&!blocked.has(x+','+z)}
function lineOK(a,b,h){const n=Math.ceil(a.distanceTo(b)*3);for(let i=0;i<=n;i++){const t=i/n;if(!walkable(Math.floor(a.x+(b.x-a.x)*t),Math.floor(a.z+(b.z-a.z)*t),h))return false}return true}
function makeSpirits(n){
  for(const s of sprites)scene.remove(s.obj,s.bl);sprites=[];seed=3;
  for(let i=0;i<n;i++){
    const el=ELS[i%ELS.length],obj=SkeletonUtils.clone(SPMODELS[el]);
    let x,z;do{x=Math.floor(rnd()*MAPN);z=Math.floor(rnd()*MAPN)}while(!walkable(x,z,HM[z][x])||!GRASS[z][x]);
    const h=HM[z][x];const bones={};obj.traverse(o=>{if(o.isBone)bones[o.name]={b:o,q:o.quaternion.clone()}});
    obj.position.set(x+.5,groundH(x+.5,z+.5),z+.5);obj.rotation.y=rnd()*Math.PI*2;scene.add(obj);
    const bl=new THREE.Mesh(blobGeo,blobMat);bl.scale.set(.7*OBJSCALE*SPH,1,.7*OBJSCALE*SPH);bl.renderOrder=2;scene.add(bl);
    sprites.push({obj,bl,h,bones,to:null,wait:rnd()*2,ph:rnd()*6});
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
        if((s.dust=(s.dust||0)-dt)<=0){s.dust=DUST.every;puff(p.x,groundH(p.x,p.z),p.z)}
        const ang=Math.atan2(d.x,d.z);let da=ang-s.obj.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));s.obj.rotation.y+=da*Math.min(1,dt*10)}}
    else if((s.wait-=dt)<=0){
      for(let t=0;t<8;t++){const tx=Math.floor(p.x)+Math.round((rnd()-.5)*8),tz=Math.floor(p.z)+Math.round((rnd()-.5)*8);
        const v=new THREE.Vector3(tx+.2+rnd()*.6,0,tz+.2+rnd()*.6);if(walkable(tx,tz,s.h)&&lineOK(p,v,s.h)){s.to=v;break}}
      if(!s.to)s.wait=.5;
    }
    s.ph+=dt*(moving?9:2.5);
    const sw=moving?Math.sin(s.ph)*.6:0;
    bend(s,'thighL',sw);bend(s,'thighR',-sw);bend(s,'upper_armL',-sw*.7);bend(s,'upper_armR',sw*.7);
    const gy=groundH(p.x,p.z);p.y=gy+(moving?Math.abs(Math.sin(s.ph))*.04:Math.sin(s.ph)*.008);
    s.bl.position.set(p.x,gy+.012,p.z);
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
const fin=pass(`uniform sampler2D t,b;uniform float uTime;uniform vec2 res,crop;varying vec2 vUv;${NOISE}
  uniform sampler2D dz;uniform float cn,cf,focus,pscale;
  float lz(vec2 u){float z=texture2D(dz,u).x;return cn*cf/(cf-z*(cf-cn));}
  void main(){vec2 U=vec2(vUv.x*crop.x,1.-(1.-vUv.y)*crop.y);
    vec3 c=texture2D(t,U).rgb,bl=texture2D(b,U).rgb;
   
    float zd=texture2D(dz,U).x,zv=cn*cf/(cf-zd*(cf-cn)),dd=(zv-focus)/focus;                  // 奥行き（カメラからのきょり）とピントの所との差
    float tl=clamp(dd<0.?-dd/${DOF.near}:dd/${DOF.far},0.,1.)*${DOF.amt.toFixed(2)};if(zd>=1.)tl=${DOF.amt.toFixed(2)};
    if(zd<1.){float ry=${SSAO.r}*pscale/zv,rx=ry*res.y/res.x,a0=6.2832*fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))),ao=0.;  // すみのかげ：向かいあう2点の奥行きの平均が、ここより手前ならへこみ（平らな面は0）
      for(int i=0;i<6;i++){float a=a0+float(i)*.5236,rr=.35+.65*fract(float(i)*.618+a0);vec2 o=vec2(cos(a)*rx,sin(a)*ry)*rr;
        float z1=lz(U+o),z2=lz(U-o),d=zv-.5*(z1+z2);ao+=clamp((d-${SSAO.bias})/${SSAO.r},0.,1.)*step(abs(zv-z1),${SSAO.max})*step(abs(zv-z2),${SSAO.max});}
      c*=mix(vec3(1.),vec3(.62,.66,.82),clamp(ao/6.*${SSAO.k},0.,1.));}   // かげは少し青く（空の光）
    c=mix(c,bl,tl);                                                                  // ミニチュアのぼかし（上と下）
    c+=max(bl-${BLOOM.th.toFixed(2)},0.)*${BLOOM.k.toFixed(2)}*vec3(${BLOOM.col.join(',')});  // あたたかい色のにじみ
    {vec2 dir=normalize(vec2(.55,-1.));float u=dot(U-vec2(0.,1.),vec2(-dir.y,dir.x));float along=dot(U-vec2(0.,1.),dir); // 左上から、光の筋
     float ray=pow(vn(vec2(u*9.+uTime*.05,0.)),3.)*smoothstep(1.3,0.,along)*smoothstep(0.,.15,along);c+=vec3(${RAYS.col.join(',')})*${RAYS.k}*ray;}
    c*=vec3(${GRADE.warm.join(',')});float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),max(c,0.),${GRADE.sat.toFixed(2)}); // あたたかい色・あざやかに
    c*=${GRADE.exp.toFixed(2)};c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);   // ACES のトーンカーブ（明るい所をやわらかく、こさを出す）
    vec2 q=U-.5;c*=1.-${GRADE.vig.toFixed(2)}*smoothstep(.35,.75,length(q));        // 四すみ
    gl_FragColor=vec4(pow(clamp(c,0.,1.),vec3(1./2.2)),1.);}`,{t:{value:null},b:{value:null},uTime,res:{value:new THREE.Vector2(1,1)},crop:{value:new THREE.Vector2(1,1)},dz:{value:null},cn:{value:1},cf:{value:200},focus:{value:40},pscale:{value:1}});
function resize(){
  renderer.setSize(innerWidth,innerHeight,false);const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  cam.aspect=innerWidth/innerHeight;placeCam();
  if(sz.x===W0&&sz.y===H0&&rtMain)return;W0=sz.x;H0=sz.y;
  for(const r of [rtMain,rtA,rtB])if(r)r.dispose();
  // ドット絵：1ドット＝画面の点「大きさ」こぶんの、小さい画面に描く（なめらかにしない）
  const LW=W0,LH=H0;   // なめらかなトゥーン：画面の細かさのまま描く（ギザギザは MSAA でとる）
  rtMain=new THREE.WebGLRenderTarget(LW,LH,{type:THREE.HalfFloatType,samples:4});rtMain.depthTexture=new THREE.DepthTexture(LW,LH);
  fin.m.uniforms.dz.value=rtMain.depthTexture;
  fin.m.uniforms.res.value.set(LW,LH);fin.m.uniforms.crop.value.set(1,1);
  const q=[Math.max(1,LW>>2),Math.max(1,LH>>2)];
  rtA=new THREE.WebGLRenderTarget(...q,{type:THREE.HalfFloatType});rtB=new THREE.WebGLRenderTarget(...q,{type:THREE.HalfFloatType});
  fin.m.uniforms.t.value=rtMain.texture;fin.m.uniforms.b.value=rtB.texture;
}
function placeCam(){
  const vw=viewW(),dist=vw/(2*Math.tan(THREE.MathUtils.degToRad(FOV)/2)*cam.aspect);
  cam.fov=FOV;cam.position.copy(target).addScaledVector(CAMDIR,dist);cam.lookAt(target);cam.updateProjectionMatrix();
  Object.assign(fin.m.uniforms,{cn:{value:cam.near},cf:{value:cam.far},focus:{value:dist},pscale:{value:1/(2*Math.tan(THREE.MathUtils.degToRad(FOV)/2))}});
  uCurve.value.set(target.x,target.z,CURVE,0);scene.fog.near=dist+FOG[0];scene.fog.far=dist+FOG[1];
}

// ---- さわる：ドラッグで動かす ----
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!drag)return;const k=viewW()/innerWidth,dx=(e.clientX-drag.x)*k,dy=(e.clientY-drag.y)*k;drag={x:e.clientX,y:e.clientY};
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
  groups.push(group('大きさ',[['1.5',1.5],['2',2],['3',3],['4',4]],()=>OPT.zoom,v=>{OPT.zoom=v;resize()}));
  groups.push(group('形',[['もとのまま',false],['あらく',true]],()=>OPT.low,v=>{OPT.low=v;blocked=placeMap()}));
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
  stepSpirits(dt);stepDust(dt);stepLeaves(dt,now/1000);calls=0;tris=0;
  uSunV.value.set(...SUNDIR).normalize().transformDirection(cam.matrixWorldInverse);uViewInv.value.setFromMatrix4(cam.matrixWorld);
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
  for(const k of names){if(k==='soil'){const t=await new THREE.TextureLoader().loadAsync('./tex/'+GTEX.dirt.f);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;uMat.value.push(t);MATSPAN.soil=GTEX.dirt.span;continue}
    if(k==='leaf'){const t=await new THREE.TextureLoader().loadAsync('./tex/'+LEAFTEX.file);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;uMat.value.push(t);MATSPAN.leaf=LEAFTEX.span;continue}
    const t=await new THREE.TextureLoader().loadAsync('./tex/m_'+k+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;
    if(meta[k]){uMat.value.push(t);MATSPAN[k]=meta[k].span}}
}
async function loadGroundTex(){
  for(const k of ['grass','dirt','cliff']){const t=await new THREE.TextureLoader().loadAsync('./tex/'+GTEX[k].f);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;uGTex.value.push(t)}
}
async function main(){
  await loadMats();await loadGroundTex();
  buildGround();buildBlades();buildPebbles();buildSky();buildLeaves();buildDust();
  await Promise.all([...PROPS.map(loadProp),...ELS.map(loadSpirit),loadMapObjs()]);
  sun.castShadow=OPT.shadow;blocked=placeMap();makeSpirits(OPT.spirits);
  resize();addEventListener('resize',resize);buildUI();gpu=gpuName();
  $('load').remove();hud();window.__proto3dReady=true;
  requestAnimationFrame(t=>{prev=t;frame(t)});
}
main().catch(showErr);
window.__pm=()=>propMeshes;window.__look=(x,z)=>{target.set(x,0,z);placeCam()};  // たしかめ用：カメラの見るまん中をうごかす
