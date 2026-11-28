/* 3Dのマテリアル（試作 proto3d/main.js のシェーダーをうつした物）：トゥーンのかげ2だん・ふちの光・雲のかげ・もや・背面法の線。 */
import * as THREE from 'three';
import {TOON,RIM,PX,CEL,MIST,CLOUDSH,BUMP} from './look.js';

export const C3=h=>{const c=new THREE.Color(h);c.convertLinearToSRGB();return `vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`};
export const U={time:{value:0},sunV:{value:new THREE.Vector3()},sunW:{value:new THREE.Vector3(-.55,1,.35).normalize()},viewInv:{value:new THREE.Matrix3()},mat:{value:[]},
  /* 時間の色と夜（r3d.js の light）：日なた・かげ・空の色（sRGB 0〜1）・夜の暗さ（こさ・色）・あかりの地図（上から見た絵。uLM の a＝のこる暗さ、uLW＝あたたかい光）と、その場所（マス：x0,z0,はば,おく） */
  sunC:{value:new THREE.Vector3(1,1,1)},ambC:{value:new THREE.Vector3(1,1,1)},skyL:{value:new THREE.Vector3(1,1,1)},skyT:{value:new THREE.Vector3(1,1,1)},
  dk:{value:0},dkC:{value:new THREE.Vector3()},lm:{value:null},lw:{value:null},lmr:{value:new THREE.Vector4(0,0,1,1)}};
/* 夜の暗さ（2Dの DMK と同じ：sRGB で、暗さの色を こさ×のこる暗さ でかさね、あたたかい光を足す）。c：リニアの色・p：せかいの場所（マス） */
export const NIGHT_U=`uniform vec3 uSunC,uAmbC,uDkC;uniform float uDk;uniform sampler2D uLM,uLW;uniform vec4 uLMR;
vec3 tnDark(vec3 c,vec2 p){if(uDk<=0.)return c;vec2 u=(p-uLMR.xy)/uLMR.zw;float m=1.;vec3 w=vec3(0.);
  if(u.x>0.&&u.y>0.&&u.x<1.&&u.y<1.){vec2 q=vec2(u.x,1.-u.y);m=texture2D(uLM,q).a;vec4 l=texture2D(uLW,q);w=l.rgb*l.a;}
  vec3 s=pow(max(c,0.),vec3(1./2.2));s=mix(s,uDkC,uDk*m)+w*uDk;return pow(max(s,0.),vec3(2.2));}
`;
export function nightU(u){return Object.assign(u,{uSunC:U.sunC,uAmbC:U.ambC,uDkC:U.dkC,uDk:U.dk,uLM:U.lm,uLW:U.lw,uLMR:U.lmr})}
export const GRAD=(()=>{const d=new Uint8Array(TOON.length*4);TOON.forEach((v,i)=>{d[i*4]=d[i*4+1]=d[i*4+2]=Math.round(v*255);d[i*4+3]=255});
  const t=new THREE.DataTexture(d,TOON.length,1);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t})();
export const PROJ_VS=`
vec4 mvPosition=vec4(transformed,1.);
#ifdef USE_INSTANCING
mvPosition=instanceMatrix*mvPosition;
#endif
vec4 cwp=modelMatrix*mvPosition;
vec3 cwp0=cwp.xyz;
mvPosition=viewMatrix*cwp;gl_Position=projectionMatrix*mvPosition;`;
export function projVS(sh){sh.uniforms.uTime=U.time;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <project_vertex>',PROJ_VS)}
export const NOISE=`
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
float vor(vec2 p){vec2 i=floor(p),f=fract(p);float a=8.,b=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));float d=length(g+vec2(hs(i+g),hs(i+g+17.3))-f);if(d<a){b=a;a=d;}else if(d<b)b=d;}return b-a;}
float fbm(vec2 p){return .5*vn(p)+.25*vn(p*2.03+7.)+.125*vn(p*4.01+3.)+.0625*vn(p*8.07+11.);}
vec3 lin(vec3 c){return pow(c,vec3(2.2));}
vec3 pxHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-4)),d/(q.x+1e-4),q.x);}
vec3 pxRgb(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
vec3 pxShade(vec3 c,float d){vec3 h=pxHsv(c);h.z=clamp(h.z*(1.+d*(d>0.?${PX.vUp}:${PX.vDn})),0.,1.);
  if(d<0.){float dh=fract(2./3.-h.x+.5)-.5;h.x=fract(h.x+dh*(-d)*${PX.hue});}else h.y=clamp(h.y*(1.-d*${PX.sat}),0.,1.);return pxRgb(h);}
`;
const LUM='vec3(.3,.59,.11)';
export const BUMP_FS=`{vec3 sp=-vViewPosition,q0=dFdx(sp),q1=dFdy(sp),bN=normalize(normal);vec2 s0=dFdx(tnUV),s1=dFdy(tnUV);vec3 q1p=cross(q1,bN),q0p=cross(bN,q0),bT=q1p*s0.x+q0p*s1.x,bB=q1p*s0.y+q0p*s1.y;
  float bd=max(dot(bT,bT),dot(bB,bB));if(bd>1e-20&&dot(tnG,tnG)>0.){vec3 nb=bN-(bT*tnG.x+bB*tnG.y)*inversesqrt(bd);if(dot(nb,nb)>1e-6)tnBump+=normalize(nb)-bN;}}
`;
export const PXSHADE_FS=`{vec3 nV=normal+tnBump;nV=dot(nV,nV)>1e-6?normalize(nV):normal;float sm=.5+.5*dot(nV,uSunV),shd=getShadowMask(),s=sm*mix(${PX.shadow},1.,shd);
  vec3 b=pow(max(diffuseColor.rgb,0.),vec3(1./2.2));float lit=smoothstep(${CEL.cut-CEL.soft},${CEL.cut+CEL.soft},s);
  vec3 o=mix(pxShade(b,${CEL.shade.toFixed(2)}),pxShade(b,${CEL.light.toFixed(2)}),lit);
  o=mix(o,pxShade(b,${CEL.hlk.toFixed(3)}),smoothstep(${CEL.hl-CEL.soft},${CEL.hl+CEL.soft},sm)*step(.5,shd));o*=mix(uAmbC,uSunC,lit);o*=clamp(1.+${BUMP.light}*(dot(nV,uSunV)-dot(tnGeoN,uSunV)/max(length(tnGeoN),1e-4)),.55,1.45);outgoingLight=lin(o)*${PX.gain.toFixed(2)};}
`;
export const RIM_FS=`outgoingLight+=vec3(${RIM.col.join(',')})*${RIM.k.toFixed(2)}*pow(1.-clamp(dot(normalize(normal),normalize(vViewPosition)),0.,1.),${RIM.pow}.)*(.4+.6*clamp(normal.y*.5+.5,0.,1.));`;
export const AIR_FS=`{float cs=smoothstep(.5,.72,fbm(vWP.xz*${CLOUDSH.scale}+uTime*vec2(${CLOUDSH.speed.join(',')})));outgoingLight*=1.-${CLOUDSH.k}*cs;
  outgoingLight=mix(outgoingLight,lin(${C3(MIST.col)})*dot(outgoingLight,${LUM})*1.3,${MIST.k}*clamp(1.-vWP.y/${MIST.h},0.,1.));}
outgoingLight=tnDark(outgoingLight,vWP.xz);
`;
// せいれいの骨（まとめて描く）：骨の表 uPose（tools/3d/bake-poses.py が焼いた、コマごと・列ごとの 回転 q と場所 t。1つの列に2つの点）。
// 点は4つまでの列（aSC）に aSW ずつつく。インスタンスの aFr：コマ a・コマ b の表の行と、そのあいだの場所（なめらかにつなぐ）
export const SPVS=`attribute vec4 aSC,aSW,aFr;attribute vec3 aWD;uniform sampler2D uPose;uniform float uNch;
vec4 spTx(float row,float c,float k){int L=int((row*uNch+c)*2.+k+.5);int W=textureSize(uPose,0).x;return texelFetch(uPose,ivec2(L-(L/W)*W,L/W),0);}
vec3 spQr(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
vec3 spP,spN;
void spSkin(vec3 p,vec3 n){p+=aWD*aFr.w;spP=vec3(0.);spN=vec3(0.);for(int i=0;i<4;i++){float w=aSW[i];if(w<=0.)continue;
  vec4 qa=spTx(aFr.x,aSC[i],0.),qb=spTx(aFr.y,aSC[i],0.);if(dot(qa,qb)<0.)qb=-qb;vec4 q=normalize(mix(qa,qb,aFr.z));vec3 t=mix(spTx(aFr.x,aSC[i],1.).xyz,spTx(aFr.y,aSC[i],1.).xyz,aFr.z);
  spP+=w*(spQr(q,p)+t);spN+=w*spQr(q,n);}}
`;
function spiritVS(sh,u){Object.assign(sh.uniforms,u);sh.vertexShader=SPVS+sh.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nspSkin(position,objectNormal);objectNormal=spN;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=spP;')}
// せいれいの表情（目・まつげ・ほっぺ）：頭（顔）の面に、チップの絵（点）をはる。2Dと同じ式（tools/art/spirit3d/fbx_motion.py の face_fit）：
// 休みの形の点 vRest → チップの場所 (u,v)（uFu・uFv）。顔の前の面（uFf）にだけ。絵は、属性（uFE の行）ごと・層ごとに、1まいのならび（uFA。bake-poses.py の face）。
// 層：ほっぺ → 目 → まつげ（2Dと同じ順）。vEx：目の層・まつげの層（−1 でなし）・ほっぺ（0・1）。
export const FACE_PARS=F=>`uniform vec4 uFu,uFv,uFf;uniform float uFE;uniform sampler2D uFA;varying float vHd;varying vec3 vRest,vEx;
vec4 fcAt(float L,float u,float v){int x=int(floor(u))-(${F.ax0}),y=int(floor(v))-(${F.ay0});if(x<0||y<0||x>=${F.cw}||y>=${F.ch})return vec4(0.);return texelFetch(uFA,ivec2(int(L)*${F.cw}+x,int(uFE)*${F.ch}+y),0);}
`;
export const FACE_FS=`if(vHd>.5&&dot(uFf.xyz,vRest)<uFf.w){float fu=dot(uFu.xyz,vRest)+uFu.w,fv=dot(uFv.xyz,vRest)+uFv.w;vec3 fc=vec3(0.);vec4 q;float fa=0.;
  for(int k=0;k<3;k++){float L=k==0?(vEx.z>.5?21.:-1.):k==1?vEx.x:vEx.y;if(L<0.)continue;q=fcAt(L,fu,fv);if(q.a>.5){fc=q.rgb;fa=1.;}}
  if(fa>0.)outgoingLight=lin(fc)*mix(uAmbC,uSunC,.7);}
`;
// トゥーンのマテリアル。extra：{cloth:布の絵の UV の倍, spirit:手足のふりの uniforms}
export function toon(o={},extra={}){
  const m=new THREE.MeshToonMaterial({gradientMap:GRAD,...o});
  m.onBeforeCompile=sh=>{projVS(sh);Object.assign(sh.uniforms,nightU({uMat:U.mat,uSunV:U.sunV,uViewInv:U.viewInv}));
    if(extra.spirit)spiritVS(sh,extra.spirit);
    if(extra.face)Object.assign(sh.uniforms,extra.face.u);
    sh.vertexShader=(extra.face?'attribute float aHd;attribute vec3 aEx;varying float vHd;varying vec3 vRest,vEx;\n':'')+'varying vec2 vUv2;varying vec3 vWP;\n'+sh.vertexShader.replace('void main() {','void main() {\nvUv2=uv;'+(extra.face?'vHd=aHd;vRest=position;vEx=aEx;':'')).replace(PROJ_VS,PROJ_VS+'\nvWP=cwp0;');
    sh.fragmentShader=(extra.face?FACE_PARS(extra.face):'')+'uniform sampler2D uMat[1];uniform vec3 uSunV;uniform mat3 uViewInv;uniform float uTime;varying vec2 vUv2;varying vec3 vWP;\n'+NOISE+NIGHT_U+sh.fragmentShader
      .replace('void main() {','#include <shadowmask_pars_fragment>\nvoid main() {')
      .replace('#include <color_fragment>',`#include <color_fragment>
  vec3 tnBump=vec3(0.);vec2 tnG=vec2(0.),tnUV=vUv2;
  ${extra.cloth?`{float l=texture2D(uMat[0],vUv2*${extra.cloth.toFixed(4)}).r;diffuseColor.rgb*=mix(1.,l*2.,.65);}`:''}`)
      .replace('#include <normal_fragment_maps>','vec3 tnGeoN=normal;\n#include <normal_fragment_maps>').replace('#include <opaque_fragment>',BUMP_FS+PXSHADE_FS+RIM_FS+(extra.face?FACE_FS:'')+AIR_FS+'\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey=()=>'toon'+(extra.cloth?extra.cloth.toFixed(3):'')+(extra.spirit?'s'+extra.spirit.key:'')+(extra.face?'f':'');
  return m;
}
// 背面法の線：裏返した形を外へふくらませて、いちばん暗いだんの色で描く
export function hullMat(o,w,sp){
  const m=new THREE.MeshBasicMaterial({...o,side:THREE.BackSide});
  m.onBeforeCompile=sh=>{projVS(sh);nightU(sh.uniforms);sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace(PROJ_VS,PROJ_VS+'\nvWP=cwp0;');
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',sp?'spSkin(position,normal);vec3 transformed=spP+normalize(spN)*'+w.toFixed(5)+';':'vec3 transformed=position+normalize(normal)*'+w.toFixed(5)+';');
    if(sp){Object.assign(sh.uniforms,sp);sh.vertexShader=SPVS+sh.vertexShader}
    sh.fragmentShader='varying vec3 vWP;\n'+NOISE+NIGHT_U+sh.fragmentShader.replace('#include <opaque_fragment>','gl_FragColor=vec4(tnDark(lin(pxShade(pow(max(diffuseColor.rgb,0.),vec3(1./2.2)),-.5)*uAmbC)*.85,vWP.xz),1.);')};
  m.customProgramCacheKey=()=>'hull'+w.toFixed(5)+(o.vertexColors?'v':'')+(sp?'s'+sp.key:'');return m;
}
// 小さな効果（水のつぶ・つりの糸・うき・波の輪）：色だけ。夜の暗さ・日の光の色は、せいれいと同じにかける
export function fxMat(m){m.onBeforeCompile=sh=>{projVS(sh);nightU(sh.uniforms);sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace(PROJ_VS,PROJ_VS+'\nvWP=cwp0;');
  sh.fragmentShader='varying vec3 vWP;\n'+NOISE+NIGHT_U+sh.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=tnDark(outgoingLight*lin(mix(uAmbC,uSunC,.7)),vWP.xz);\n#include <opaque_fragment>')};m.customProgramCacheKey=()=>'fx';return m}
