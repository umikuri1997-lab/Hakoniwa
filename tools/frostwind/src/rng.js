import { clamp, lerp, TAU } from './math.js';

/* ═══════════════════════════════════════════════════════════════════════════
   DETERMINISM.

   Every world is a pure function of its seed, and this is where that starts.
   mulberry32 is the generator; RNG wraps it with the samplers the grammars
   actually want, of which `norm` — a truncated normal — matters most: a
   species is a distribution, not a value, and uniform sampling makes a forest
   of clones. makeNoise/fbm are the continuous fields the world is cut from.
   ═══════════════════════════════════════════════════════════════════════════ */

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* Stable, order-independent decision randomness. Sequential RNG remains valid
   inside one local grammar; persistent life decisions use these keyed helpers
   so camera order, frame rate and actor iteration cannot perturb outcomes. */
function hash32(value,seed=2166136261){
  let h=seed>>>0;
  const s=typeof value==='string'?value:String(value);
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;
  return h>>>0;
}

function keyedSeed(seed,...keys){
  let h=hash32(seed>>>0,0x811c9dc5);
  for(const key of keys)h=hash32(`${typeof key}:${String(key)}`,h^0x9e3779b9);
  return h>>>0;
}

function keyedRandom(seed,...keys){
  return mulberry32(keyedSeed(seed,...keys))();
}
function keyedRange(seed,a,b,...keys){return a+(b-a)*keyedRandom(seed,...keys);}
function keyedInt(seed,a,b,...keys){return Math.floor(keyedRange(seed,a,b+1,...keys));}

/* Coordinate hash retained byte-for-byte from worldgen's original authority.
   It lives here now so world, interiors and authored places share one copy. */
function hashf(x,y,s){
  let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,2246822519);
  h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;
  return(h>>>0)/4294967296;
}

class RNG{
  constructor(seed){this._=mulberry32(seed>>>0);}
  f(){return this._();}
  range(a,b){return a+(b-a)*this._();}
  int(a,b){return Math.floor(a+(b-a+1)*this._());}
  chance(p){return this._()<p;}
  pick(a){return a[Math.floor(this._()*a.length)];}
  gauss(){let u=0,v=0;while(u===0)u=this._();while(v===0)v=this._();
    return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);}
  /* truncated normal — the grammar should sample from a distribution with a
     stated mean and standard deviation, not from an arbitrary uniform band */
  norm(m,sd,lo,hi){
    for(let i=0;i<8;i++){ const v=m+this.gauss()*sd;
      if((lo===undefined||v>=lo)&&(hi===undefined||v<=hi)) return v; }
    return clamp(m,lo===undefined?-1e9:lo,hi===undefined?1e9:hi);
  }
}

/* gradient noise ─ deterministic from a seed, so a seed fully reproduces a scene */
function makeNoise(seed){
  const r=mulberry32(seed>>>0), p=new Uint8Array(256), P=new Uint8Array(512);
  for(let i=0;i<256;i++)p[i]=i;
  for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}
  for(let i=0;i<512;i++)P[i]=p[i&255];
  const G=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  const grad=(h,x,y)=>{const g=G[h&7];return g[0]*x+g[1]*y;};
  return function(x,y){
    const Xi=Math.floor(x),Yi=Math.floor(y);
    const X=Xi&255,Y=Yi&255,xf=x-Xi,yf=y-Yi,u=fade(xf),v=fade(yf);
    const aa=P[P[X]+Y],ab=P[P[X]+Y+1],ba=P[P[X+1]+Y],bb=P[P[X+1]+Y+1];
    return lerp(lerp(grad(aa,xf,yf),grad(ba,xf-1,yf),u),
                lerp(grad(ab,xf,yf-1),grad(bb,xf-1,yf-1),u),v);
  };
}
function fbm(n,x,y,oct=4,lac=2.0,gain=0.5){
  let s=0,a=0.5,f=1,norm=0;
  for(let i=0;i<oct;i++){s+=a*n(x*f,y*f);norm+=a;a*=gain;f*=lac;}
  return s/norm;
}


export {
  RNG, fbm, hash32, hashf, keyedInt, keyedRandom, keyedRange, keyedSeed,
  makeNoise, mulberry32,
};
