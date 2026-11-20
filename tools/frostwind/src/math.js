/* ═══════════════════════════════════════════════════════════════════════════
   MATH — the leaf. Imports nothing; nearly everything imports it.
   ═══════════════════════════════════════════════════════════════════════════ */

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smoothstep=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const TAU=Math.PI*2;

export { TAU, clamp, lerp, smoothstep };
