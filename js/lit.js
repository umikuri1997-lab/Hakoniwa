/* 光と影（ノーマルマップ）：昼の日ざしと夜の明かりが、物の向いている面に当たるようにする。
   ・チップを描くとき、同じ場所のノーマルマップ（window.CHIPN、tools/normals.py）を、面の向きの絵 NC にも描く（drawChip が LITN をきめ、ctx.drawImage がうつす）。
   ・ノーマルマップのない絵（せいれい・コワイノ・地面など）は、NC のその所を消す（＝上向き、地面と同じ。光の当たり方はかわらない）。
   ・夜の暗さの所（draw-world.js の DMK）で、WebGL で色の絵・NC・DMK をあわせて、画面にもどす（litComposite）。
   ・上向きの面は、いままでと同じ明るさ。かたむいた面だけ、日ざし・明かりのほうを向けば明るく、そむけば暗くなる。
   WebGL がつかえない・ノーマルマップがまだ読みこめていないときは、いままでどおり。設定の「光と影」（SND.lit）で切れる。 */
const NC=document.createElement('canvas'),nx=NC.getContext('2d');let NLIVE=false,LITN=null,LITF=0;
const NPG={};function nPage(n){/* ノーマルマップのアトラス。色のアトラスと同じならび */let a=NPG[n];if(!a){a=NPG[n]={im:new Image(),ok:false};a.im.onload=()=>{a.ok=true;dirty=true};a.im.onerror=()=>{a.bad=true};a.im.src=(window.CHIPN||[])[n]}return a}
function litOn(){return !!(LGL.ok&&!LGL.soft&&window.CHIPN&&window.CHIPN.length&&!(typeof SND!=='undefined'&&SND.lit===false))}
function litN(r){/* drawChip：つぎに描く絵のノーマルマップの場所 [ページ,x,y,w,h] */if(!NLIVE||!r||typeof r==='string'){LITN=null;return}const a=nPage(r[0]);LITN=a.ok?r:null;if(!a.ok)LITF=1}
{const DI=CanvasRenderingContext2D.prototype.drawImage;ctx.drawImage=function(){DI.apply(ctx,arguments);if(NLIVE)litMirror(arguments)}}
function litMirror(A){const c=ctx,r=LITN;LITN=null;if(c.globalCompositeOperation!=='source-over'||c.globalAlpha<.35)return;
  const T=c.getTransform();nx.setTransform(T.a,T.b,T.c,T.d,T.e,T.f);nx.globalAlpha=c.globalAlpha;
  let dx,dy,dw,dh,im=A[0];if(A.length>=9){dx=A[5];dy=A[6];dw=A[7];dh=A[8]}else{dx=A[1];dy=A[2];dw=A.length>=5?A[3]:(im.width||im.naturalWidth);dh=A.length>=5?A[4]:(im.height||im.naturalHeight)}
  if(r){nx.globalCompositeOperation='source-over';nx.drawImage(NPG[r[0]].im,r[1],r[2],r[3],r[4],dx,dy,dw,dh);return}
  nx.globalCompositeOperation='destination-out';if(A.length>=9)nx.drawImage(im,A[1],A[2],A[3],A[4],dx,dy,dw,dh);else nx.drawImage(im,dx,dy,dw,dh);nx.globalCompositeOperation='source-over'}
function litBegin(){/* 地面のあと、物を描くまえ */NLIVE=false;if(!litOn())return;if(NC.width!==cv.width||NC.height!==cv.height){NC.width=cv.width;NC.height=cv.height}nx.setTransform(1,0,0,1,0,0);nx.globalAlpha=1;nx.globalCompositeOperation='source-over';nx.clearRect(0,0,NC.width,NC.height);NLIVE=true}
function litEnd(){NLIVE=false;LITN=null}
/* 日ざし：6時に東・12時に南の高い所・18時に西。夕方と朝は、あたたかい色 */
function sunNow(){const h=hour();if(h<5.5||h>18.5)return null;const p=Math.max(0,Math.min(1,(h-6)/12)),az=p*Math.PI,el=.3+Math.sin(p*Math.PI)*.85,ce=Math.cos(el);
  const L=[Math.cos(az)*ce,Math.sin(az)*ce*.7,Math.sin(el)],n=Math.hypot(...L);for(let i=0;i<3;i++)L[i]/=n;
  const edge=Math.min(1,Math.min(h-5.5,18.5-h)/1.5),warm=1-Math.sin(p*Math.PI);let k=LITSUN*edge;if(S&&S.rain)k*=.4;return{L,k,warm}}
const LITSUN=.55,LITMAX=32;/* 日ざしの強さ・明かりの数（シェーダーにわたす） */
const LGL={ok:false};{try{const c=document.createElement('canvas'),g=c.getContext('webgl',{alpha:false,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});if(g){
  const sh=(t,s)=>{const o=g.createShader(t);g.shaderSource(o,s);g.compileShader(o);if(!g.getShaderParameter(o,g.COMPILE_STATUS))throw g.getShaderInfoLog(o);return o};
  const pr=g.createProgram();g.attachShader(pr,sh(g.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
  g.attachShader(pr,sh(g.FRAGMENT_SHADER,`precision mediump float;varying vec2 v;uniform sampler2D C,N,D;uniform vec3 Ls,Sc,Dc;uniform float Sk,Dk,Kz,Ln;uniform vec2 R;uniform vec4 L[${LITMAX}];
void main(){vec3 c=texture2D(C,v).rgb;vec4 n=texture2D(N,v);vec3 nn=normalize(mix(vec3(0.,0.,1.),n.rgb*2.-1.,n.a));
 if(Sk>0.){float d=dot(nn,Ls)-Ls.z;c*=1.+Sk*d*(d>0.?Sc:vec3(.92,.96,1.08));}
 if(Dk>0.){float da=texture2D(D,v).a,lit=clamp(1.-da/Dk,0.,1.);vec2 P=vec2(v.x,1.-v.y)*R;float ws=0.,rs=0.;
  for(int i=0;i<${LITMAX};i++){if(float(i)>=Ln)break;vec4 q=L[i];vec2 dd=(q.xy-P)/Kz;float r=length(dd);if(r>q.z)continue;float w=1.-r/q.z;vec3 ld=normalize(vec3(dd,q.w));ws+=w;rs+=w*mix(1.,clamp((dot(nn,ld)+.5)/(ld.z+.5),0.,1.6),clamp(r/14.,0.,1.));}
  if(ws>0.){float rel=mix(1.,rs/ws,clamp(ws*3.,0.,1.));lit=clamp(lit*rel,0.,1.);}
  float a=Dk*(1.-lit);c=c*(1.-a)+Dc*a;}
 gl_FragColor=vec4(c,1.);}`));
  g.linkProgram(pr);if(!g.getProgramParameter(pr,g.LINK_STATUS))throw g.getProgramInfoLog(pr);g.useProgram(pr);
  const b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);const pa=g.getAttribLocation(pr,'p');g.enableVertexAttribArray(pa);g.vertexAttribPointer(pa,2,g.FLOAT,false,0,0);
  const tx=[0,1,2].map(i=>{const t=g.createTexture();g.activeTexture(g.TEXTURE0+i);g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);return t});
  g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);const u={};for(const k of['C','N','D','Ls','Sc','Dc','Sk','Dk','Kz','Ln','R','L'])u[k]=g.getUniformLocation(pr,k);g.uniform1i(u.C,0);g.uniform1i(u.N,1);g.uniform1i(u.D,2);
  c.addEventListener('webglcontextlost',e=>{e.preventDefault();LGL.ok=false});
  const ri=g.getExtension('WEBGL_debug_renderer_info'),rn=ri?String(g.getParameter(ri.UNMASKED_RENDERER_WEBGL)):'';LGL.soft=/swiftshader|llvmpipe|software/i.test(rn);/* GPU のない WebGL（ソフトウェア）は重いので使わない（見た目のたしかめでは LGL.soft=false にする） */
  Object.assign(LGL,{ok:true,c,g,u,tx,LB:new Float32Array(LITMAX*4)})}}catch(e){LGL.ok=false}}
function litLights(k,x0,y0,x1,y1){/* 明かりの場所（画面のドット）・とどく所（世界のドット）・高さ */const B=LGL.LB;let n=0;for(const j of LITP){if(n>=LITMAX)break;const o=S.obj[j],L=litP(j,o);if(!L)continue;const x=j%W,y=(j/W)|0;if(x<x0-5||x>=x1+5||y<y0-5||y>=y1+5)continue;if(INDL.has(o)&&roomOf(j))continue;
    B[n*4]=(x*TS+L.dx-cam.x)*k;B[n*4+1]=(y*TS+L.dy-cam.y)*k;B[n*4+2]=L.R;B[n*4+3]=22;n++}return n}
const LITSLOW=10,LITN0=40;let LITT=0,LITC=0;/* 1コマ LITSLOW ミリ秒より重い端末では、光と影を止める（はじめの LITN0 コマの平均で） */
function litComposite(dk,k,x0,y0,x1,y1,dc){const t0=performance.now(),r=litComposite0(dk,k,x0,y0,x1,y1,dc);if(r&&LITC<LITN0){LITT+=performance.now()-t0;if(++LITC===LITN0&&LITT/LITN0>LITSLOW){setSnd('lit',false);toast('画面が重いので、光と影をオフにしました')}}return r}
function litComposite0(dk,k,x0,y0,x1,y1,dc){/* 色の絵（cv）・向きの絵（NC）・夜の暗さ（DMK）をあわせて、cv にもどす。もどしたら true */if(!litOn())return false;const{g,u,tx,c}=LGL;
  if(c.width!==cv.width||c.height!==cv.height){c.width=cv.width;c.height=cv.height}g.viewport(0,0,c.width,c.height);
  const sun=dk<.5?sunNow():null,SK=sun?sun.k*(1-dk/.58):0;if(SK<=0&&dk<=0)return false;
  try{g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,tx[0]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,cv);
    g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,tx[1]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,NC);
    g.activeTexture(g.TEXTURE2);g.bindTexture(g.TEXTURE_2D,tx[2]);if(dk>0)g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,DMK);else g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array(4));
  }catch(e){LGL.ok=false;return false}
  if(sun){g.uniform3f(u.Ls,sun.L[0],sun.L[1],sun.L[2]);const w=sun.warm;g.uniform3f(u.Sc,1+.12*w,1+.02*w,1-.14*w)}g.uniform1f(u.Sk,SK);if(dc)g.uniform3f(u.Dc,dc[0]/255,dc[1]/255,dc[2]/255);g.uniform1f(u.Dk,dk);g.uniform1f(u.Kz,k);g.uniform2f(u.R,c.width,c.height);
  const n=dk>0?litLights(k,x0,y0,x1,y1):0;g.uniform1f(u.Ln,n);if(n)g.uniform4fv(u.L,LGL.LB);
  g.drawArrays(g.TRIANGLE_STRIP,0,4);
  const s=ctx.globalCompositeOperation,a=ctx.globalAlpha;ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='copy';ctx.globalAlpha=1;CanvasRenderingContext2D.prototype.drawImage.call(ctx,c,0,0);ctx.globalCompositeOperation=s;ctx.globalAlpha=a;return true}
