import { MAX_RUNGS, RAMP_ORDER } from '../palette.js';

/* GLSL shared by every fragment shader. Interpolates MAX_RUNGS and the ramp
   count, so it must evaluate after palette.js. */

/* Sprite atlases: two RGBA8 textures over one shelf-packed layout.
     NRM   rgb = surface normal, a = coverage
     MAT   r = material id, g = occlusion, b = baked shade, a = spare
   Occlusion and baked shade sit apart from the normal: contact occlusion and
   snow depth must survive a light that moves. */
const GLSL_COMMON=`
uniform sampler2D uPal, uRungTex;
const float RW=${MAX_RUNGS}.0, RH=${RAMP_ORDER.length}.0;

/* Orientation. Mixing the two renders the scene mirrored while every isolated
   test passes.
     vUV.y = 0 is the top of the screen, world row 0.
     A CPU-baked texture (flipY=false) stores world row 0 at v=0: sample vUV.
     A render target stores world row 0 at v=1 (GL is bottom-up): sample rtUV. */
vec2 rtUV(vec2 v){ return vec2(v.x, 1.0 - v.y); }

vec3 rampStep(float id, float t){
  float rungs = floor(texture2D(uRungTex, vec2((id+0.5)/RH,0.5)).r*255.0+0.5);
  float r = floor(clamp(t,0.0,1.0)*(rungs-1.0)+0.5);
  return texture2D(uPal, vec2((r+0.5)/RW,(id+0.5)/RH)).rgb;
}
/* Aerial perspective, same order as the software path: drain chroma, compress
   luminance toward the plane's target, tint toward haze. */
vec3 aerialApply(vec3 c, float targetL, float comp, float desat, float fogA, vec3 fogC){
  float L = dot(c, vec3(0.30,0.59,0.11));
  c = mix(c, vec3(L), desat);
  L = dot(c, vec3(0.30,0.59,0.11));
  c += (targetL - L) * comp;
  return mix(c, fogC, fogA);
}
`;

export { GLSL_COMMON };
