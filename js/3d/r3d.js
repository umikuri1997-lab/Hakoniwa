/* ゲームの3Dの描き方（three.js）。今のプログラム（ふつうの script）は window.R3D をよぶ。
   - カメラ：見るまん中（target、マス）と、拡大（z：見るまん中で、ゲームの1点が画面の何 px か）。遠近のあるせまい画角（試作と同じ）。
   - 地形（terrain.js）・せいれい（spirits.js）・立てたドット絵の板（sprites.js）・地面にはる絵（drape：ゲームの今の描き方で描いた、地面の上の物）。
   - しあげ（試作と同じ）：奥行きのぼかし・すみのかげ・にじみ・光の筋・色。 */
import * as THREE from 'three';
import {HSTEP,PITCH,YAW,FOV,ISOPT,MAXPR,SKY,SKYTOP,GROUND,FOG,HEMI,SUN,SUNCOL,HEMISKY,SUNDIR,DOF,SSAO,BLOOM,RAYS,GRADE} from './look.js';
import {U,C3,NOISE} from './mats.js';
import {Terrain,K} from './terrain.js';
import {Spirits} from './spirits.js';
import {Sprites,PAGEW} from './sprites.js';
import {TEX} from './files.js';

const CAMDIR=new THREE.Vector3(Math.sin(YAW)*Math.cos(PITCH),Math.sin(PITCH),Math.cos(YAW)*Math.cos(PITCH));
let renderer,scene,cam,sun,terrain,spirits,sprites,cv3,PR=1,VW=1,VH=1,zoom=1;
const target=new THREE.Vector3();
let rtMain=null,rtA=null,rtB=null,W0=0,H0=0,shadowAt=null,drapeTex=null,drapeCv=null;
const quadGeo=new THREE.PlaneGeometry(2,2),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const pass=(fs,uniforms)=>{const m=new THREE.ShaderMaterial({uniforms,vertexShader:VS,fragmentShader:fs,depthTest:false,depthWrite:false});const s=new THREE.Scene();s.add(new THREE.Mesh(quadGeo,m));return {m,s}};
let blur,fin;
function makePost(){
  blur=pass(`uniform sampler2D t;uniform vec2 d;varying vec2 vUv;
    vec4 tnOk(vec4 c){return any(isnan(c))||any(isinf(c))?vec4(0.):min(c,vec4(64.));}
    void main(){vec4 c=tnOk(texture2D(t,vUv))*.227;c+=(tnOk(texture2D(t,vUv+d*1.385))+tnOk(texture2D(t,vUv-d*1.385)))*.316;c+=(tnOk(texture2D(t,vUv+d*3.23))+tnOk(texture2D(t,vUv-d*3.23)))*.07;gl_FragColor=c;}`,{t:{value:null},d:{value:new THREE.Vector2()}});
  fin=pass(`uniform sampler2D t,b;uniform float uTime;uniform vec2 res;varying vec2 vUv;${NOISE}
    uniform sampler2D dz;uniform float cn,cf,focus,pscale;
    float lz(vec2 u){float z=texture2D(dz,u).x;return cn*cf/(cf-z*(cf-cn));}
    void main(){vec2 U=vUv;
      vec3 c=texture2D(t,U).rgb,bl=texture2D(b,U).rgb;if(any(isnan(c))||any(isinf(c)))c=bl;if(any(isnan(bl))||any(isinf(bl)))bl=vec3(0.);
      float zd=texture2D(dz,U).x,zv=cn*cf/(cf-zd*(cf-cn)),dd=(zv-focus)/focus;
      float tl=clamp(dd<0.?-dd/${DOF.near}:dd/${DOF.far},0.,1.)*${DOF.amt.toFixed(2)};if(zd>=1.)tl=${DOF.amt.toFixed(2)};
      if(zd<1.){float ry=${SSAO.r}*pscale/zv,rx=ry*res.y/res.x,a0=6.2832*fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))),ao=0.;
        for(int i=0;i<6;i++){float a=a0+float(i)*.5236,rr=.35+.65*fract(float(i)*.618+a0);vec2 o=vec2(cos(a)*rx,sin(a)*ry)*rr;
          float z1=lz(U+o),z2=lz(U-o),d=zv-.5*(z1+z2);ao+=clamp((d-${SSAO.bias})/${SSAO.r},0.,1.)*step(abs(zv-z1),${SSAO.max})*step(abs(zv-z2),${SSAO.max});}
        c*=mix(vec3(1.),vec3(.62,.66,.82),clamp(ao/6.*${SSAO.k},0.,1.));}
      c=mix(c,bl,tl);
      c+=max(bl-${BLOOM.th.toFixed(2)},0.)*${BLOOM.k.toFixed(2)}*vec3(${BLOOM.col.join(',')});
      {vec2 dir=normalize(vec2(.55,-1.));float u=dot(U-vec2(0.,1.),vec2(-dir.y,dir.x));float along=dot(U-vec2(0.,1.),dir);
       float ray=pow(vn(vec2(u*9.+uTime*.05,0.)),3.)*smoothstep(1.3,0.,along)*smoothstep(0.,.15,along);c+=vec3(${RAYS.col.join(',')})*${RAYS.k}*ray;}
      c*=vec3(${GRADE.warm.join(',')});float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),max(c,0.),${GRADE.sat.toFixed(2)});
      c*=${GRADE.exp.toFixed(2)};c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);
      vec2 q=U-.5;c*=1.-${GRADE.vig.toFixed(2)}*smoothstep(.35,.75,length(q));
      gl_FragColor=vec4(pow(clamp(c,0.,1.),vec3(1./2.2)),1.);}`,{t:{value:null},b:{value:null},uTime:U.time,res:{value:new THREE.Vector2(1,1)},dz:{value:null},cn:{value:1},cf:{value:200},focus:{value:40},pscale:{value:1}});
}
function buildSky(){
  const SKYH=[-.62,-.3],g=new THREE.SphereGeometry(150,32,16);
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uTime:U.time},
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uTime;varying vec3 vD;${NOISE}
      void main(){vec3 c=mix(${C3(SKY)},${C3(SKYTOP)},smoothstep(${SKYH[0]},${SKYH[1]},vD.y));
        vec2 q=vD.xz/(vD.y+.9)*2.2+vec2(uTime*.01,0.);float cl=smoothstep(.55,.8,fbm(q))*smoothstep(${SKYH[0]},${SKYH[0]}+.12,vD.y);
        c=mix(c,vec3(1.),cl*.85);gl_FragColor=vec4(lin(c),1.);}`});
  const sky=new THREE.Mesh(g,m);sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);return sky;
}
let sky;
async function loadTex(u,srgb){const t=await new THREE.TextureLoader().loadAsync(u);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=8;return t}
async function init(){
  cv3=document.createElement('canvas');cv3.id='cv3';cv3.setAttribute('aria-hidden','true');
  Object.assign(cv3.style,{position:'absolute',left:'0',top:'0',display:'none',pointerEvents:'none'});
  const cv=document.getElementById('cv');cv.parentNode.insertBefore(cv3,cv);
  renderer=new THREE.WebGLRenderer({canvas:cv3,antialias:false,powerPreference:'high-performance'});
  PR=Math.min(devicePixelRatio||1,MAXPR);renderer.setPixelRatio(PR);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  scene=new THREE.Scene();scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,50,80);
  cam=new THREE.PerspectiveCamera(FOV,1,1,300);
  scene.add(new THREE.HemisphereLight(HEMISKY,GROUND,HEMI));
  sun=new THREE.DirectionalLight(SUNCOL,SUN);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:140});
  sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;sun.shadow.radius=3;scene.add(sun,sun.target);
  makePost();sky=buildSky();
  const [grass,dirt,cliff,cloth]=await Promise.all([loadTex(TEX.grass,true),loadTex(TEX.dirt,true),loadTex(TEX.cliff,true),loadTex(TEX.cloth,false)]);
  U.mat.value=[cloth];
  terrain=new Terrain(scene,[grass,dirt,cliff]);spirits=new Spirits(scene);await spirits.load(cloth);sprites=new Sprites(scene);
  drapeCv=document.createElement('canvas');drapeCv.width=drapeCv.height=4;drapeTex=new THREE.CanvasTexture(drapeCv);drapeTex.colorSpace=THREE.NoColorSpace;drapeTex.magFilter=THREE.NearestFilter;drapeTex.minFilter=THREE.LinearFilter;drapeTex.generateMipmaps=false;
  terrain.drape={tex:drapeTex,r:new THREE.Vector4(0,0,1,1),on:{value:0}};
}
function size(w,h){VW=w;VH=h;renderer.setSize(w,h,false);cv3.style.width=w+'px';cv3.style.height=h+'px';const sz=renderer.getDrawingBufferSize(new THREE.Vector2());cam.aspect=w/h;
  if(sz.x===W0&&sz.y===H0&&rtMain)return;W0=sz.x;H0=sz.y;for(const r of [rtMain,rtA,rtB])if(r)r.dispose();
  rtMain=new THREE.WebGLRenderTarget(W0,H0,{type:THREE.HalfFloatType,samples:4});rtMain.depthTexture=new THREE.DepthTexture(W0,H0);
  fin.m.uniforms.dz.value=rtMain.depthTexture;fin.m.uniforms.res.value.set(W0,H0);
  const q=[Math.max(1,W0>>2),Math.max(1,H0>>2)];rtA=new THREE.WebGLRenderTarget(...q,{type:THREE.HalfFloatType});rtB=new THREE.WebGLRenderTarget(...q,{type:THREE.HalfFloatType});
  fin.m.uniforms.t.value=rtMain.texture;fin.m.uniforms.b.value=rtB.texture}
const dist=()=>VH/(2*Math.tan(THREE.MathUtils.degToRad(FOV)/2)*ISOPT*zoom);
function placeCam(){const d=dist();cam.fov=FOV;cam.position.copy(target).addScaledVector(CAMDIR,d);cam.lookAt(target);cam.near=Math.max(.5,d-60);cam.far=d+90;cam.updateProjectionMatrix();cam.updateMatrixWorld();
  Object.assign(fin.m.uniforms,{cn:{value:cam.near},cf:{value:cam.far},focus:{value:d},pscale:{value:1/(2*Math.tan(THREE.MathUtils.degToRad(FOV)/2))}});
  scene.fog.near=d+FOG[0];scene.fog.far=d+FOG[1];sky.position.copy(cam.position);
  if(!shadowAt||Math.hypot(shadowAt.x-target.x,shadowAt.z-target.z)>6){shadowAt=target.clone();sun.position.copy(target).addScaledVector(new THREE.Vector3(...SUNDIR).normalize(),60);sun.target.position.copy(target);sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true}}
/* 見るまん中（マス）と拡大 */
function view(x,z,zm,w,h){if(w!==VW||h!==VH)size(w,h);target.set(x,0,z);zoom=zm;placeCam()}
const V3=new THREE.Vector3();
/* せかいの点（マス・高さ）→ 画面の点（CSS の px）。s：その点で、ゲームの1点が何 px か */
function project(x,y,z){V3.set(x,y,z).project(cam);const p={x:(V3.x+1)/2*VW,y:(1-V3.y)/2*VH,z:V3.z};
  const dd=V3.set(x,y,z).sub(cam.position).dot(new THREE.Vector3().subVectors(target,cam.position).normalize());p.s=zoom*dist()/Math.max(.01,dd);return p}
function rayAt(sx,sy){const o=cam.position.clone(),d=new THREE.Vector3((sx/VW)*2-1,1-(sy/VH)*2,.5).unproject(cam).sub(o).normalize();return {o,d}}
/* 画面の点 → 高さ y0 の平らな面の点（マス） */
function plane(sx,sy,y0=0){const {o,d}=rayAt(sx,sy);if(Math.abs(d.y)<1e-6)return {x:target.x,z:target.z};const t=(y0-o.y)/d.y;return {x:o.x+d.x*t,z:o.z+d.z*t}}
/* 画面の点 → 地形のあたる所 {x,z,y,lv}（マス） */
function pick(sx,sy){const {o,d}=rayAt(sx,sy);return terrain.ray(o,d)}
let world=null;
function setWorld(m){world=m;terrain.set(m);renderer.shadowMap.needsUpdate=true}
function dirty(x0,z0,x1,z1){if(!world)return;terrain.update(x0,z0,x1,z1);renderer.shadowMap.needsUpdate=true}
/* 地面にはる絵：ゲームの点（クォータービューの地面の点）の四角 r=[x0,y0,w,h] に描いたキャンバス */
function drape(c,r){const D=terrain.drape;if(!c){D.on.value=0;return}if(drapeTex.image!==c){drapeTex.dispose();drapeTex.image=c}drapeTex.needsUpdate=true;D.r.set(r[0],r[1],r[2],r[3]);D.on.value=1}
function draw(to,sc,cm){renderer.setRenderTarget(to);renderer.render(sc,cm)}
function render(now){U.time.value=now/1000;
  U.sunV.value.set(...SUNDIR).normalize().transformDirection(cam.matrixWorldInverse);U.viewInv.value.setFromMatrix4(cam.matrixWorld);
  draw(rtMain,scene,cam);
  blur.m.uniforms.t.value=rtMain.texture;blur.m.uniforms.d.value.set(1/rtA.width,0);draw(rtA,blur.s,postCam);
  blur.m.uniforms.t.value=rtA.texture;blur.m.uniforms.d.value.set(0,1/rtA.height);draw(rtB,blur.s,postCam);
  draw(null,fin.s,postCam)}
function show(on){if(cv3)cv3.style.display=on?'block':'none'}
const ready=init().then(()=>{window.R3D.ok=true},e=>{window.R3D.err=String(e&&e.stack||e);console.error(e)});
window.R3D={ready,K,HSTEP,ISOPT,PAGEW,view,project,plane,pick,setWorld,dirty,drape,render,show,
  spirits:L=>spirits.set(L),sprites:(Q,r)=>sprites.set(Q,r),raster:()=>sprites.raster,groundH:(x,z)=>terrain.M?terrain.groundH(x,z):0,
  camRight:()=>new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion),info:()=>renderer.info};
