/* ドット絵を立てた板（ビルボード）：ゲームの今の描き方で描いた物を、3Dの中に立てる。
   - チップの1コマの絵（切り出したキャンバス）は、絵のページ（PAGEW 四方）につめて、1回だけ送る。
   - その場で描く絵（コードの絵・色をかえた絵など）は、毎コマ描く絵のページ（RASTER）に描いて送る。
   - 板は、足もとの点（3D）から、画面の向きにのばす。奥行きは、足もとの線より上は立てた板（カメラの向きの、たての面）、下は地面にねかせた板にする。
     板を足もとの線で2つに分ける。前のクォータービューの「足もとの順」と同じ前後になり、下のはしは手前の地面にうまらない。
   - 描く順は、ゲームの奥行きの順（たがいの前後は奥行きでくらべ、同じ奥行きなら、あとの物が上）。
   - 時間の色と夜の暗さは、板ぜんたいに、足もとの場所で（光る物 lit：夜の窓のあかり などは、暗さをうけない）。 */
import * as THREE from 'three';
import {ISOPT,PITCH} from './look.js';
import {NIGHT_U,nightU} from './mats.js';

export const PAGEW=2048,NPAGE=4,RASTERW=2048,RASTERH=1024;
const TP=Math.tan(PITCH),DEPS=.03,DLY=.1;   /* DEPS：同じ所の地面より、少し手前（マス）・DLY：同じ物の中で重ねた絵1まいごとに手前へ（マス。板の奥行きは、たての面の点ごとに作るので、まっすぐの面とずれる。そのずれより大きく） */

export class Sprites{
  constructor(scene){this.scene=scene;this.pages=[];this.map=new Map();this.full=false;
    for(let i=0;i<NPAGE;i++){const c=document.createElement('canvas');c.width=c.height=PAGEW;const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;this.pages.push({c,g:c.getContext('2d'),t,x:0,y:0,rowH:0,dirty:false})}
    const rc=document.createElement('canvas');rc.width=RASTERW;rc.height=RASTERH;this.raster={c:rc,g:rc.getContext('2d'),t:new THREE.CanvasTexture(rc)};
    const t=this.raster.t;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;
    this.cap=0;this.mesh=null;this.mat=this.makeMat()}
  makeMat(){const u=nightU({uP0:{value:this.pages[0].t},uP1:{value:this.pages[1].t},uP2:{value:this.pages[2].t},uP3:{value:this.pages[3].t},uR:{value:this.raster.t}});
    return new THREE.ShaderMaterial({uniforms:u,transparent:true,side:THREE.DoubleSide,depthWrite:true,depthTest:true,fog:false,
      vertexShader:`attribute vec3 aAnc;attribute vec2 aOff;attribute vec3 aUvp;attribute float aA,aLy;varying vec2 vUv;varying float vP,vA,vL;varying vec2 vAnc;
        void main(){vAnc=aAnc.xz;vec4 va=modelViewMatrix*vec4(aAnc,1.);vec2 o=aOff/${ISOPT.toFixed(4)};vec4 p=projectionMatrix*vec4(va.xy+vec2(o.x,-o.y),va.z,1.);
          float dz=(o.y<0.?-o.y*${TP.toFixed(5)}:o.y/${TP.toFixed(5)})+${DEPS}+aLy*${DLY};   /* 上は立てた面・下はねかせた面の奥行き。aLy：同じ物の中で、あとから重ねた絵（壁の窓など）ほど少し手前 */
          vec4 d=projectionMatrix*vec4(va.xy,va.z+dz,1.);p.z=d.z/d.w*p.w;gl_Position=p;vUv=aUvp.xy;vP=aUvp.z;vA=abs(aA);vL=aA<0.?1.:0.;}`,   /* aA がマイナス：光る物 */
      fragmentShader:`uniform sampler2D uP0,uP1,uP2,uP3,uR;varying vec2 vUv;varying float vP,vA,vL;varying vec2 vAnc;
${NIGHT_U}
        void main(){vec4 c=vP<.5?texture2D(uP0,vUv):vP<1.5?texture2D(uP1,vUv):vP<2.5?texture2D(uP2,vUv):vP<3.5?texture2D(uP3,vUv):texture2D(uR,vUv);c.a*=vA;if(c.a<.02)discard;
          if(vL<.5)c.rgb=tnDark(c.rgb*pow(mix(uAmbC,uSunC,.6),vec3(2.2)),vAnc);gl_FragColor=c;
          #include <colorspace_fragment>
        }`})}
  /* チップの絵 src（キャンバス）の、絵のページの場所。はじめてなら、つめる。いっぱいなら null（つぎのコマに、ページをぜんぶ空けて作りなおす） */
  slot(src){let s=this.map.get(src);if(s)return s;const w=src.width,h=src.height;if(!w||!h||w>PAGEW||h>PAGEW)return null;
    for(let i=0;i<NPAGE;i++){const P=this.pages[i];if(P.x+w+2>PAGEW){P.x=0;P.y+=P.rowH+2;P.rowH=0}if(P.y+h+2>PAGEW)continue;
      P.g.drawImage(src,P.x+1,P.y+1);s={p:i,x:P.x+1,y:P.y+1};P.x+=w+2;P.rowH=Math.max(P.rowH,h);P.dirty=true;this.map.set(src,s);return s}
    this.full=true;return null}
  reset(){for(const P of this.pages){P.g.clearRect(0,0,PAGEW,PAGEW);P.x=P.y=P.rowH=0;P.dirty=true}this.map.clear();this.full=false}
  /* Q：板の一覧（描く順）。{src|raster:{x,y,w,h}, sx,sy,sw,sh, c:[x0,y0,x1,y1,x2,y2,x3,y3]（足もとからのゲームの点。左上・右上・右下・左下）, a:[x,y,z]（足もと・3D）, al, lit（光る物）, ly（同じ物の中で何まいめに重ねた絵か）} */
  set(Q,rasterUsed){if(this.full)this.reset();
    const n=Q.length*2;if(n>this.cap){if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose()}this.cap=Math.max(512,Math.ceil(n*1.5));
      const g=new THREE.BufferGeometry(),N=this.cap*4;g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));g.setAttribute('aAnc',new THREE.BufferAttribute(new Float32Array(N*3),3));
      g.setAttribute('aOff',new THREE.BufferAttribute(new Float32Array(N*2),2));g.setAttribute('aUvp',new THREE.BufferAttribute(new Float32Array(N*3),3));g.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(N),1));g.setAttribute('aLy',new THREE.BufferAttribute(new Float32Array(N),1));
      const I=new Uint32Array(this.cap*6);for(let i=0;i<this.cap;i++)I.set([i*4,i*4+3,i*4+1,i*4+1,i*4+3,i*4+2],i*6);g.setIndex(new THREE.BufferAttribute(I,1));
      this.mesh=new THREE.Mesh(g,this.mat);this.mesh.frustumCulled=false;this.mesh.renderOrder=5;this.scene.add(this.mesh)}
    const g=this.mesh.geometry,A=g.getAttribute('aAnc').array,O=g.getAttribute('aOff').array,UV=g.getAttribute('aUvp').array,AL=g.getAttribute('aA').array,LY=g.getAttribute('aLy').array;let k=0;
    const put=(q,V,p)=>{for(let c=0;c<4;c++){const i=k*4+c,v=V[c];A[i*3]=q.a[0];A[i*3+1]=q.a[1];A[i*3+2]=q.a[2];O[i*2]=v[0];O[i*2+1]=v[1];UV[i*3]=v[2];UV[i*3+1]=v[3];UV[i*3+2]=p;AL[i]=q.lit?-Math.max(q.al,1e-3):q.al;LY[i]=q.ly||0}k++};
    const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
    for(const q of Q){let u0,v0,u1,v1,p;
      if(q.raster){p=4;u0=(q.raster.x+q.sx)/RASTERW;u1=(q.raster.x+q.sx+q.sw)/RASTERW;v0=1-(q.raster.y+q.sy)/RASTERH;v1=1-(q.raster.y+q.sy+q.sh)/RASTERH}
      else{const s=this.slot(q.src);if(!s)continue;p=s.p;u0=(s.x+q.sx)/PAGEW;u1=(s.x+q.sx+q.sw)/PAGEW;v0=1-(s.y+q.sy)/PAGEW;v1=1-(s.y+q.sy+q.sh)/PAGEW}
      const C=q.c,V=[[C[0],C[1],u0,v0],[C[2],C[3],u1,v0],[C[4],C[5],u1,v1],[C[6],C[7],u0,v1]];
      /* 足もとの線（ゲームの点の y=0）で、上と下に分ける（左の辺 0→3・右の辺 1→2） */
      const tl=V[0][1]<0&&V[3][1]>0?-V[0][1]/(V[3][1]-V[0][1]):-1,tr=V[1][1]<0&&V[2][1]>0?-V[1][1]/(V[2][1]-V[1][1]):-1;
      if(tl>0&&tr>0){const L=mix(V[0],V[3],tl),R=mix(V[1],V[2],tr);L[1]=R[1]=0;put(q,[V[0],V[1],R,L],p);put(q,[L,R,V[2],V[3]],p)}
      else put(q,V,p)}
    g.setDrawRange(0,k*6);for(const a of ['aAnc','aOff','aUvp','aA','aLy'])g.getAttribute(a).needsUpdate=true;
    for(const P of this.pages)if(P.dirty){P.t.needsUpdate=true;P.dirty=false}
    if(rasterUsed)this.raster.t.needsUpdate=true}
}
