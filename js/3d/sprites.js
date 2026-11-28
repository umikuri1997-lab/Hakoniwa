/* ドット絵を立てた板（ビルボード）：ゲームの今の描き方で描いた物を、3Dの中に立てる。
   - チップの1コマの絵（切り出したキャンバス）は、絵のページ（PAGEW 四方）につめて、1回だけ送る。
   - その場で描く絵（コードの絵・色をかえた絵など）は、毎コマ描く絵のページ（RASTER）に描いて送る。
   - 板は、足もとの点（3D）から、画面の向きにのばす。奥行きは足もとの点の奥行き（少し手前）にそろえる（前のクォータービューの「足もとの順」と同じ見え方）。
   - 描く順は、ゲームの奥行きの順（たがいの前後は奥行きでくらべ、同じ奥行きなら、あとの物が上）。 */
import * as THREE from 'three';
import {ISOPT} from './look.js';

export const PAGEW=2048,NPAGE=4,RASTERW=2048,RASTERH=1024;
const DEPTHBIAS=.6;   /* 奥行きを、足もとより手前へ（マス）。手前の地面に下のはしがうまらない */

export class Sprites{
  constructor(scene){this.scene=scene;this.pages=[];this.map=new Map();this.full=false;
    for(let i=0;i<NPAGE;i++){const c=document.createElement('canvas');c.width=c.height=PAGEW;const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;this.pages.push({c,g:c.getContext('2d'),t,x:0,y:0,rowH:0,dirty:false})}
    const rc=document.createElement('canvas');rc.width=RASTERW;rc.height=RASTERH;this.raster={c:rc,g:rc.getContext('2d'),t:new THREE.CanvasTexture(rc)};
    const t=this.raster.t;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;
    this.cap=0;this.mesh=null;this.mat=this.makeMat()}
  makeMat(){const u={uP0:{value:this.pages[0].t},uP1:{value:this.pages[1].t},uP2:{value:this.pages[2].t},uP3:{value:this.pages[3].t},uR:{value:this.raster.t}};
    return new THREE.ShaderMaterial({uniforms:u,transparent:true,side:THREE.DoubleSide,depthWrite:true,depthTest:true,fog:false,
      vertexShader:`attribute vec3 aAnc;attribute vec2 aOff;attribute vec3 aUvp;attribute float aA;varying vec2 vUv;varying float vP,vA;
        void main(){vec4 va=modelViewMatrix*vec4(aAnc,1.);vec4 p=projectionMatrix*vec4(va.xyz+vec3(aOff.x,-aOff.y,0.)/${ISOPT.toFixed(4)},1.);
          vec4 d=projectionMatrix*vec4(va.xy,va.z+${DEPTHBIAS.toFixed(2)},1.);p.z=d.z/d.w*p.w;gl_Position=p;vUv=aUvp.xy;vP=aUvp.z;vA=aA;}`,
      fragmentShader:`uniform sampler2D uP0,uP1,uP2,uP3,uR;varying vec2 vUv;varying float vP,vA;
        void main(){vec4 c=vP<.5?texture2D(uP0,vUv):vP<1.5?texture2D(uP1,vUv):vP<2.5?texture2D(uP2,vUv):vP<3.5?texture2D(uP3,vUv):texture2D(uR,vUv);c.a*=vA;if(c.a<.02)discard;gl_FragColor=c;
          #include <colorspace_fragment>
        }`})}
  /* チップの絵 src（キャンバス）の、絵のページの場所。はじめてなら、つめる。いっぱいなら null（つぎのコマに、ページをぜんぶ空けて作りなおす） */
  slot(src){let s=this.map.get(src);if(s)return s;const w=src.width,h=src.height;if(!w||!h||w>PAGEW||h>PAGEW)return null;
    for(let i=0;i<NPAGE;i++){const P=this.pages[i];if(P.x+w+2>PAGEW){P.x=0;P.y+=P.rowH+2;P.rowH=0}if(P.y+h+2>PAGEW)continue;
      P.g.drawImage(src,P.x+1,P.y+1);s={p:i,x:P.x+1,y:P.y+1};P.x+=w+2;P.rowH=Math.max(P.rowH,h);P.dirty=true;this.map.set(src,s);return s}
    this.full=true;return null}
  reset(){for(const P of this.pages){P.g.clearRect(0,0,PAGEW,PAGEW);P.x=P.y=P.rowH=0;P.dirty=true}this.map.clear();this.full=false}
  /* Q：板の一覧（描く順）。{src|raster:{x,y,w,h}, sx,sy,sw,sh, c:[x0,y0,x1,y1,x2,y2,x3,y3]（足もとからのゲームの点。左上・右上・右下・左下）, a:[x,y,z]（足もと・3D）, al} */
  set(Q,rasterUsed){if(this.full)this.reset();
    const n=Q.length;if(n>this.cap){if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose()}this.cap=Math.max(256,Math.ceil(n*1.5));
      const g=new THREE.BufferGeometry(),N=this.cap*4;g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));g.setAttribute('aAnc',new THREE.BufferAttribute(new Float32Array(N*3),3));
      g.setAttribute('aOff',new THREE.BufferAttribute(new Float32Array(N*2),2));g.setAttribute('aUvp',new THREE.BufferAttribute(new Float32Array(N*3),3));g.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(N),1));
      const I=new Uint32Array(this.cap*6);for(let i=0;i<this.cap;i++)I.set([i*4,i*4+3,i*4+1,i*4+1,i*4+3,i*4+2],i*6);g.setIndex(new THREE.BufferAttribute(I,1));
      this.mesh=new THREE.Mesh(g,this.mat);this.mesh.frustumCulled=false;this.mesh.renderOrder=5;this.scene.add(this.mesh)}
    const g=this.mesh.geometry,A=g.getAttribute('aAnc').array,O=g.getAttribute('aOff').array,UV=g.getAttribute('aUvp').array,AL=g.getAttribute('aA').array;let k=0;
    for(const q of Q){let u0,v0,u1,v1,p;
      if(q.raster){p=4;u0=(q.raster.x+q.sx)/RASTERW;u1=(q.raster.x+q.sx+q.sw)/RASTERW;v0=1-(q.raster.y+q.sy)/RASTERH;v1=1-(q.raster.y+q.sy+q.sh)/RASTERH}
      else{const s=this.slot(q.src);if(!s)continue;p=s.p;u0=(s.x+q.sx)/PAGEW;u1=(s.x+q.sx+q.sw)/PAGEW;v0=1-(s.y+q.sy)/PAGEW;v1=1-(s.y+q.sy+q.sh)/PAGEW}
      const T=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
      for(let c=0;c<4;c++){const i=k*4+c;A[i*3]=q.a[0];A[i*3+1]=q.a[1];A[i*3+2]=q.a[2];O[i*2]=q.c[c*2];O[i*2+1]=q.c[c*2+1];UV[i*3]=T[c][0];UV[i*3+1]=T[c][1];UV[i*3+2]=p;AL[i]=q.al}k++}
    g.setDrawRange(0,k*6);for(const a of ['aAnc','aOff','aUvp','aA'])g.getAttribute(a).needsUpdate=true;
    for(const P of this.pages)if(P.dirty){P.t.needsUpdate=true;P.dirty=false}
    if(rasterUsed)this.raster.t.needsUpdate=true}
}
