/* 光と影（ノーマルマップ）：昼の日ざしと夜の明かりが、物の向いている面に当たるようにする。
   ・チップを描くとき、同じ場所のノーマルマップ（window.CHIPN、tools/normals.py）を、面の向きの絵 NC にも描く（drawChip が litN できめ、ctx.drawImage がうつす）。
   ・ノーマルマップのない絵（せいれい・コワイノ・地面など）は、NC のその所を消す（＝上向き、地面と同じ。明るさはかわらない）。
   ・軽くするため、NC と明るさの絵は画面の半分の細かさ（LITNS）。画面の色の絵は WebGL に送らない。WebGL は、NC から「暗くする絵」と「明るくする絵」を
     となりあわせに1まい作り（litApply）、画面に multiply（暗く）と color-dodge（明るく：色÷(1−v)）でかさねる。夜の暗さ（DMK）は、そのあと。
   ・ノーマルマップのない所（地面など）の明るさはかえない。物は、カメラを向いた面を基準に、日ざし・明かりのほうを向いた面を明るく、そむけた面を暗くする。
   WebGL がない・GPU のない WebGL（LGL.soft）・重い端末（LITSLOW）・ノーマルマップの読みこみ前は、いままでどおり。設定の「光と影」（SND.lit）で切れる。 */
const LITNS=.5,LITSUN=.55,LITMAX=32,LITSLOW=4,LITN0=40;/* 細かさ・日ざしの強さ・明かりの数・重いとみなす1コマのミリ秒（はじめの LITN0 コマの平均） */
const NC=document.createElement('canvas'),nx=NC.getContext('2d');let NLIVE=false,LITN=null,LITT=0,LITC=0;
const NPG={};function nPage(n){/* ノーマルマップのアトラス。色のアトラスと同じならび。使うページだけ読みこむ */let a=NPG[n];if(!a){a=NPG[n]={im:new Image(),ok:false};a.im.onload=()=>{a.ok=true;dirty=true};a.im.onerror=()=>{a.bad=true};a.im.src=(window.CHIPN||[])[n]}return a}
function litOn(){return !!(LGL.ok&&!LGL.soft&&window.CHIPN&&window.CHIPN.length&&!(typeof SND!=='undefined'&&SND.lit===false))}
function litN(r){/* drawChip：つぎに描く絵のノーマルマップの場所 [ページ,x,y,w,h] */if(!NLIVE||!r||typeof r==='string'){LITN=null;return}LITN=nPage(r[0]).ok?r:null}
function litT(T){nx.setTransform(T.a*LITNS,T.b*LITNS,T.c*LITNS,T.d*LITNS,T.e*LITNS,T.f*LITNS)}
{const DI=CanvasRenderingContext2D.prototype.drawImage;ctx.drawImage=function(){DI.apply(ctx,arguments);if(NLIVE)litMirror(arguments)}}
function litMirror(A){const c=ctx,r=LITN;LITN=null;if(c.globalCompositeOperation!=='source-over'||c.globalAlpha<.35)return;
  litT(c.getTransform());nx.globalAlpha=c.globalAlpha;
  let dx,dy,dw,dh,im=A[0];if(A.length>=9){dx=A[5];dy=A[6];dw=A[7];dh=A[8]}else{dx=A[1];dy=A[2];dw=A.length>=5?A[3]:(im.width||im.naturalWidth);dh=A.length>=5?A[4]:(im.height||im.naturalHeight)}
  if(r){nx.drawImage(NPG[r[0]].im,r[1],r[2],r[3],r[4],dx,dy,dw,dh);return}
  nx.globalCompositeOperation='destination-out';if(A.length>=9)nx.drawImage(im,A[1],A[2],A[3],A[4],dx,dy,dw,dh);else nx.drawImage(im,dx,dy,dw,dh);nx.globalCompositeOperation='source-over'}
function litBegin(){/* 地面のあと、物を描くまえ */NLIVE=false;if(!litOn())return;const w=Math.max(1,Math.round(cv.width*LITNS)),h=Math.max(1,Math.round(cv.height*LITNS));if(NC.width!==w||NC.height!==h){NC.width=w;NC.height=h}nx.setTransform(1,0,0,1,0,0);nx.globalAlpha=1;nx.globalCompositeOperation='source-over';nx.clearRect(0,0,w,h);NLIVE=true}
function litEnd(){NLIVE=false;LITN=null}
/* 日ざし：6時に東・12時に南の高い所・18時に西。朝と夕方は、あたたかい色 */
function sunNow(){const h=hour();if(h<5.5||h>18.5)return null;const p=Math.max(0,Math.min(1,(h-6)/12)),az=p*Math.PI,el=.3+Math.sin(p*Math.PI)*.85,ce=Math.cos(el);
  const L=[Math.cos(az)*ce,Math.sin(az)*ce*.7,Math.sin(el)],n=Math.hypot(...L);for(let i=0;i<3;i++)L[i]/=n;
  const edge=Math.min(1,Math.min(h-5.5,18.5-h)/1.5),warm=1-Math.sin(p*Math.PI);let k=LITSUN*edge;if(S&&S.rain)k*=.4;return{L,k,warm}}
const LGL={ok:false};{try{const c=document.createElement('canvas'),g=c.getContext('webgl',{alpha:false,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});if(g){
  const sh=(t,s)=>{const o=g.createShader(t);g.shaderSource(o,s);g.compileShader(o);if(!g.getShaderParameter(o,g.COMPILE_STATUS))throw g.getShaderInfoLog(o);return o};
  const pr=g.createProgram();g.attachShader(pr,sh(g.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
  /* 左半分：暗くする絵（multiply、1でそのまま）。右半分：明るくする絵（color-dodge、0でそのまま。色×f は 1−1/f） */
  g.attachShader(pr,sh(g.FRAGMENT_SHADER,`precision mediump float;varying vec2 v;uniform sampler2D N;uniform vec3 Ls,Sc;uniform float Sk,Kz,Ln;uniform vec2 R;uniform vec4 L[${LITMAX}];
void main(){bool br=v.x>=.5;vec2 u=vec2(fract(v.x*2.),v.y);vec4 n=texture2D(N,u);vec3 f=vec3(1.);
 if(n.a>.01){vec3 nn=normalize(mix(vec3(0.,0.,1.),n.rgb*2.-1.,n.a));
  const vec3 V=vec3(0.,.6247,.7809);/* カメラを向いた面（もとの絵の明るさ）を基準にする */
  if(Sk>0.){float d=dot(nn,Ls)-dot(V,Ls);f*=d>0.?1.+Sk*d*Sc:1.+Sk*.5*max(d,-.6)*vec3(.92,.96,1.08);/* そむけた面は、くらくしすぎない */}
  if(Ln>0.){vec2 P=vec2(u.x,1.-u.y)*R;float ws=0.,rs=0.;
   for(int i=0;i<${LITMAX};i++){if(float(i)>=Ln)break;vec4 q=L[i];vec2 dd=(q.xy-P)/Kz;float r=length(dd);if(r>q.z)continue;float w=1.-r/q.z;vec3 ld=normalize(vec3(dd.x,max(dd.y,0.),q.w));/* 画面で上にある明かりは、奥ではなく高い所とみる */ws+=w;rs+=w*mix(1.,clamp((dot(nn,ld)+.5)/(dot(V,ld)+.5),.6,1.6),clamp(r/14.,0.,1.));}
   if(ws>0.)f*=mix(1.,rs/ws,clamp(ws*1.5,0.,1.));}}
 gl_FragColor=br?vec4(1.-1./max(f,vec3(1.)),1.):vec4(min(f,vec3(1.)),1.);}`));
  g.linkProgram(pr);if(!g.getProgramParameter(pr,g.LINK_STATUS))throw g.getProgramInfoLog(pr);g.useProgram(pr);
  const b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);const pa=g.getAttribLocation(pr,'p');g.enableVertexAttribArray(pa);g.vertexAttribPointer(pa,2,g.FLOAT,false,0,0);
  const t=g.createTexture();g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,t);for(const[a,v]of[[g.TEXTURE_MIN_FILTER,g.LINEAR],[g.TEXTURE_MAG_FILTER,g.LINEAR],[g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE],[g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE]])g.texParameteri(g.TEXTURE_2D,a,v);
  g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);const u={};for(const k of['N','Ls','Sc','Sk','Kz','Ln','R','L'])u[k]=g.getUniformLocation(pr,k);g.uniform1i(u.N,0);
  const ri=g.getExtension('WEBGL_debug_renderer_info'),rn=ri?String(g.getParameter(ri.UNMASKED_RENDERER_WEBGL)):'';LGL.soft=/swiftshader|llvmpipe|software/i.test(rn);/* GPU のない WebGL（ソフトウェア）は重いので使わない（見た目のたしかめでは LGL.soft=false にする） */
  c.addEventListener('webglcontextlost',e=>{e.preventDefault();LGL.ok=false});
  Object.assign(LGL,{ok:true,c,g,u,LB:new Float32Array(LITMAX*4)})}}catch(e){LGL.ok=false}}
function litLights(k,x0,y0,x1,y1){/* 明かりの場所（NC のドット）・とどく所（世界のドット）・高さ */const B=LGL.LB;let n=0;for(const j of LITP){if(n>=LITMAX)break;const o=S.obj[j],L=litP(j,o);if(!L)continue;const x=j%W,y=(j/W)|0;if(x<x0-5||x>=x1+5||y<y0-5||y>=y1+5)continue;if(INDL.has(o)&&roomOf(j))continue;
    B[n*4]=(x*TS+L.dx-cam.x)*k*LITNS;B[n*4+1]=(y*TS+L.dy-cam.y)*k*LITNS;B[n*4+2]=L.R;B[n*4+3]=22;n++}return n}
function litApply(dk,k,x0,y0,x1,y1){/* 明るさの絵を作って、画面にかさねる */if(!litOn())return;const t0=performance.now(),{g,u,c}=LGL;
  const sun=dk<.5?sunNow():null,SK=sun?sun.k*(1-dk/.58):0,n=dk>0?litLights(k,x0,y0,x1,y1):0;if(SK<=0&&!n)return;
  const w=NC.width,h=NC.height;if(c.width!==w*2||c.height!==h){c.width=w*2;c.height=h}g.viewport(0,0,w*2,h);
  try{g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,NC)}catch(e){LGL.ok=false;return}
  if(sun){g.uniform3f(u.Ls,sun.L[0],sun.L[1],sun.L[2]);const q=sun.warm;g.uniform3f(u.Sc,1+.12*q,1+.02*q,1-.14*q)}g.uniform1f(u.Sk,Math.max(0,SK));g.uniform1f(u.Kz,k*LITNS);g.uniform2f(u.R,w,h);g.uniform1f(u.Ln,n);if(n)g.uniform4fv(u.L,LGL.LB);
  g.drawArrays(g.TRIANGLE_STRIP,0,4);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;const DI=CanvasRenderingContext2D.prototype.drawImage;
  ctx.globalCompositeOperation='multiply';DI.call(ctx,c,0,0,w,h,0,0,cv.width,cv.height);
  ctx.globalCompositeOperation='color-dodge';DI.call(ctx,c,w,0,w,h,0,0,cv.width,cv.height);ctx.restore();
  if(LITC<LITN0){LITT+=performance.now()-t0;if(++LITC===LITN0&&LITT/LITN0>LITSLOW){setSnd('lit',false);toast('画面が重いので、光と影をオフにしました')}}}
