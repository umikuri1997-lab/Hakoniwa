import { FLAG_Q } from '../constants.js';
import { RAMP_ID } from '../palette.js';
import { SURF, glslSurfaceHeat, glslSurfaceLerps, glslSurfacePaint, glslSurfaceRainGround,
         glslSurfaceShadowRamp, glslSurfaceThaw, glslSurfaceTone, glslSurfaceWet } from '../surface.js';
import { GLSL_COMMON } from '../shaders/common.js';
import { SPELL_GLSL } from '../spell.js';
import { RAIN_GLSL, WIND_GLSL } from '../weather.js';
import { WORM_GLSL } from '../worm.js';

/* GLSL for the streaming world: ground, water, shadows, blits. */

/* chunk geometry -> screen-space geometry buffer */
const BLIT_VS=`
uniform vec2 uOrigin, uSize, uRes;
varying vec2 vT;
void main(){
  vec2 corner = position.xy + 0.5;
  vT = corner;
  vec2 px = uOrigin + corner*uSize;
  gl_Position = vec4(px.x/uRes.x*2.0-1.0, 1.0-px.y/uRes.y*2.0, 0.0, 1.0);
}`;
const BLIT_FS=`
precision highp float;
uniform sampler2D uTex;
varying vec2 vT;
void main(){ gl_FragColor = texture2D(uTex, vT); }`;

/* Sprite vertex stage. Wind phase comes from world position (iPhase): a phase
   derived from iPos re-phases every tree as the camera moves. */
const W_SPRITE_VS=`
attribute vec2 iPos;
attribute vec4 iRect;
attribute vec4 iAnchor;
attribute vec4 iRange;
attribute vec2 iAtm;
attribute vec4 iMat;
attribute float iPhase;
/* whole pixels a spell front bends this crown, positive to screen right
   (propFx in src/spell.js) */
attribute float iFx;
varying vec2 vUV;
varying vec2 vLocal;
varying vec4 vRect;
varying float vFlip, vPhase, vBend;
varying float vRamp, vSMin, vSMax, vTL, vComp, vDesat, vFog;
varying float vRamp2, vVol, vDMin, vDMax;
uniform vec2 uRes;
uniform vec2 uAtlas;
void main(){
  vec2 corner = position.xy + 0.5;
  float flip = iAnchor.z;
  vBend = iFx;
  vec2 local = vec2(mix(corner.x, 1.0-corner.x, flip), corner.y) * iRect.zw;
  vec2 px = iPos + vec2(corner.x*iRect.z - iAnchor.x, corner.y*iRect.w - iAnchor.y);
  vUV = (iRect.xy + local) / uAtlas;
  vLocal = local; vRect = iRect; vFlip = flip;
  vPhase = iPhase;
  vRamp=iAnchor.w; vSMin=iRange.x; vSMax=iRange.y;
  vTL=iRange.z*255.0; vComp=iRange.w; vDesat=iAtm.x; vFog=iAtm.y;
  vRamp2=iMat.x; vDMin=iMat.y; vDMax=iMat.z; vVol=iMat.w;
  vec2 ndc = vec2(px.x/uRes.x*2.0-1.0, 1.0-px.y/uRes.y*2.0);
  gl_Position = vec4(ndc,0.0,1.0);
}`;

/* A reflection is the caster seen through the water surface: the same atlas
   texels, drawn into a separate target, mirrored vertically from the instance's
   contact anchor. The water pass alone decides where that image is visible. */
const W_REFLECT_VS=`
attribute vec2 iPos;
attribute vec4 iRect;
attribute vec4 iAnchor;
attribute vec4 iRange;
attribute vec2 iAtm;
attribute vec4 iMat;
attribute float iPhase;
attribute float iLift;
attribute float iFx;
varying vec2 vUV;
varying vec2 vLocal;
varying vec4 vRect;
varying float vFlip, vPhase, vBend;
varying float vRamp, vSMin, vSMax, vTL, vComp, vDesat, vFog;
varying float vRamp2, vVol, vDMin, vDMax;
uniform vec2 uRes;
uniform vec2 uAtlas;
void main(){
  vec2 corner = position.xy + 0.5;
  float flip = iAnchor.z;
  vBend = iFx;
  /* Screen geometry starts at the grounded edge and extends down. Atlas rows
     run in reverse so feet remain at the waterline and the crown recedes.
     The mirror plane is the water: a caster iLift rows above it has its foot
     image 2*iLift rows below the grounded edge. */
  vec2 local = vec2(mix(corner.x, 1.0-corner.x, flip), 1.0-corner.y) * iRect.zw;
  /* A negative lift is a ground skirt (rows drawn below the caster's own
     ground line): the mirror ignores it. */
  float baseY = iPos.y + iRect.w - iAnchor.y + 2.0*max(iLift, 0.0);
  vec2 px = vec2(iPos.x + corner.x*iRect.z - iAnchor.x,
                 baseY + corner.y*iRect.w);
  vUV = (iRect.xy + local) / uAtlas;
  vLocal = local; vRect = iRect; vFlip = flip;
  vPhase = iPhase;
  vRamp=iAnchor.w; vSMin=iRange.x; vSMax=iRange.y;
  vTL=iRange.z*255.0; vComp=iRange.w; vDesat=iAtm.x; vFog=iAtm.y;
  vRamp2=iMat.x; vDMin=iMat.y; vDMax=iMat.z; vVol=iMat.w;
  vec2 ndc = vec2(px.x/uRes.x*2.0-1.0, 1.0-px.y/uRes.y*2.0);
  gl_Position = vec4(ndc,0.0,1.0);
}`;

/* A contact shadow is drawn flat, not projected: a five-row ellipse through
   the shear comes out one and a half rows tall. Stamped unsheared and nudged
   away from the light. */
const CONTACT_VS=`
attribute vec2 iPos;
attribute vec4 iRect;
attribute vec4 iAnchor;
attribute float iPhase;
varying vec2 vUV;
varying vec2 vLocal;
varying vec4 vRect;
varying float vPhase, vFlip;
uniform vec2 uRes, uAtlas;
uniform vec3 uLight;
uniform float uLen;
varying float vH;
varying float vLift;
void main(){
  vH = 0.0;
  vLift = 0.0;
  vec2 corner = position.xy + 0.5;
  vec2 local = corner * iRect.zw;
  vUV = (iRect.xy + local) / uAtlas;
  vLocal=local;vRect=iRect;vPhase=iPhase;vFlip=iAnchor.z;
  vec2 px = iPos + vec2(corner.x*iRect.z - iAnchor.x,
                        corner.y*iRect.w - iAnchor.y + 1.0)
          + vec2(-uLight.x, -uLight.y*0.5) * uLen * 1.7;
  vec2 ndc = vec2(px.x/uRes.x*2.0-1.0, 1.0-px.y/uRes.y*2.0);
  gl_Position = vec4(ndc,0.0,1.0);
}`;

/* Projected-shadow vertex stage, with a floor on caster height (uMinH). A prop
   ten pixels tall projects to a strip one pixel deep, and the palette snap
   hardens it into a straight dark run eight to ten pixels long on open snow.
   Undergrowth gets a contact ellipse instead. */
const W_SHADOW_VS=`
attribute vec2 iPos;
attribute vec4 iRect;
attribute vec4 iAnchor;
attribute float iPhase;
attribute float iLift;
varying vec2 vUV;
varying vec2 vLocal;
varying vec4 vRect;
varying float vPhase, vFlip;
uniform vec2 uRes, uAtlas;
uniform vec3 uLight;
uniform float uLen, uSquash, uMinH, uBase;
varying float vH;
varying float vLift;
void main(){
  /* The floor is on height above the ground, not on sprite height. The
     windpump tower is ten stacked bay sprites 15 rows tall: a 15 px bay 135 px
     in the air must cast. */
  vLift = iLift;
  if(iRect.w + iLift < uMinH){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vUV = vec2(0.0);
    vLocal=vec2(0.0);vRect=vec4(0.0);vPhase=0.0;vFlip=0.0;vH = 0.0; return; }
  vec2 corner = position.xy + 0.5;
  vH = 1.0 - corner.y;
  float flip = iAnchor.z;
  vec2 local = vec2(mix(corner.x, 1.0-corner.x, flip), corner.y) * iRect.zw;
  vUV = (iRect.xy + local) / uAtlas;
  vLocal=local;vRect=iRect;vPhase=iPhase;vFlip=flip;
  /* iLift is the caster's foot above the ground plane, in drawn rows (zero on
     the ground). The root drops to the ground under the caster (+lift on the
     near edge) and the shear runs from the ground to each corner (lift + the
     height within the sprite), so a rotor on a roof throws from the foot of
     its own house. */
  float lift = iLift;
  float hAbove = lift + iRect.w * (1.0 - corner.y);
  float k = uLen / max(0.30, uLight.z);
  vec2 off = vec2(-uLight.x, -uLight.y) * hAbove * k;
  /* uBase is a base depth. Every sprite anchors on its bottom row, so the quad
     has zero height before the light offset, and the offset is proportional
     to -uLight.y. Measured without it: a full-size birch casts 449 px at az
     160, 29 at az 179, none at az 180, and near 180 a 145 px wide, 2 px tall
     bar on open snow.

     The depth goes on the far edge, weighted by (1.0 - corner.y). The near
     edge (corner.y == 1, hAbove zero) stays on the sprite's bottom edge at
     iPos.y + 1. Added to the near edge, the shadow starts at iPos.y + 4 and
     leaves three bare rows under every wall and boot. */
  vec2 px = iPos + vec2(corner.x*iRect.z - iAnchor.x,
                        -iAnchor.y + iRect.w + lift + (1.0 - corner.y)*uBase);
  px += vec2(off.x, off.y * uSquash);
  vec2 ndc = vec2(px.x/uRes.x*2.0-1.0, 1.0-px.y/uRes.y*2.0);
  gl_Position = vec4(ndc,0.0,1.0);
}`;

/* Shadow buffer: r = coverage, g = how far along the shadow the pixel sits.
   The ground softens with g: crisp at the trunk, diffuse at the tip. b and a
   are written zero. */
const W_SHADOW_FS=`
precision highp float;
uniform sampler2D uMat;
uniform vec2 uAtlas;
uniform float uWind, uTime;
varying vec2 vUV;
varying vec2 vLocal;
varying vec4 vRect;
varying float vPhase, vFlip;
varying float vH;
varying float vLift;
${WIND_GLSL}
vec4 rootSampleAt(float screenDx){
  float atlasDx=vFlip>0.5?-screenDx:screenDx;
  vec2 uv=vUV+vec2(atlasDx/uAtlas.x,0.0);
  float localX=vLocal.x+screenDx;
  vec4 here=texture2D(uMat,uv);
  if(uWind<0.001||vPhase<0.0)return here;
  float gust=windGust(vPhase,uTime);
  float rs=gust*uWind*1.12;
  float shift=rs>0.72?1.0:(rs<-0.72?-1.0:0.0);
  if(shift==0.0)return here;
  float sourceX=localX-shift;
  if(sourceX>=0.0&&sourceX<=vRect.z-1.0){
    float du=(vFlip>0.5?shift:-shift)/uAtlas.x;
    vec4 source=texture2D(uMat,uv+vec2(du,0.0));
    float sourceMat=floor(source.r*255.0+0.5);
    if(sourceMat>8.5&&sourceMat<9.5)return source;
  }
  float hereMat=floor(here.r*255.0+0.5);
  if(hereMat>8.5&&hereMat<9.5)return vec4(0.0);
  return here;
}
void main(){
  vec4 m=rootSampleAt(0.0);
  if(m.a<0.5){
    vec4 a=rootSampleAt(-1.0),b=rootSampleAt(1.0);
    float am=floor(a.r*255.0+0.5),bm=floor(b.r*255.0+0.5);
    if(a.a>0.5&&am>8.5&&am<9.5)m=a;
    else if(b.a>0.5&&bm>8.5&&bm<9.5)m=b;
  }
  if(m.a < 0.5) discard;
  /* Material 12 is open undercroft timber: visible and reflective, no sun
     shadow. Sparse stilts and X braces otherwise throw short bars that read
     opposite the elevated body's cast. */
  float matId=floor(m.r*255.0+0.5);
  if(matId>11.5&&matId<12.5) discard;
  /* 19 is a luminous body: a light casts no shadow. */
  if(matId>18.5&&matId<19.5) discard;
  /* A negative lift declares a ground skirt: sprite rows below its own ground
     line lie on the soil (the tent's guy runs and anchor heaps) and cast
     nothing. The shear would sweep them toward the sun. */
  if(vLift < -0.5 && vRect.w*vH + vLift < 0.0) discard;
  gl_FragColor = vec4(1.0, vH, 0.0, 0.0);
}`;

const W_GROUND_FS=`
precision highp float;
${GLSL_COMMON}
${RAIN_GLSL}
uniform sampler2D uBayer;

/* Ordered-dither quantiser: the fractional rung index goes through an 8x8
   Bayer threshold. Anchored to world position, so the pattern travels with the
   ground. A screen-anchored dither shimmers when the camera moves.

   The seam is a pixel budget. Rapid fields need three pixels to avoid a bare
   water contour. Gentle area lines use the narrower rung-space floor. */
const float SEAM_PX = 3.0;
const float SEAM_MIN = 0.08;
const float SEAM_MAX = 0.34;
vec3 rampDither(float id, float t, vec2 wp, float slope){
  float rungs = floor(texture2D(uRungTex, vec2((id+0.5)/RH,0.5)).r*255.0+0.5);
  float f = clamp(t,0.0,1.0)*(rungs-1.0);
  float b = texture2D(uBayer, (floor(mod(wp,8.0))+0.5)/8.0).r;
  /* Banded, not global: flat, seam, flat. A plain floor(f + bayer) dithers
     every pixel with a fractional rung index. Measured, the largest flat
     colour region in a frame drops to 4.3%. */
  float fr = fract(f);
  /* Seam width, in rung units. At 0.24 the checker covers a quarter of every
     rung, and the snowfield crosses a rung every fifteen pixels or so: the
     largest quiet area of the frame measures 1.4 per cent, against ten in the
     reference painting. A 0.12 floor spreads gentle area lines too wide (human
     review).

     A rung-unit width buys pixels by how fast the field crosses a rung. On
     swamp water (a solution basin under a saturating optical curve) 0.12 buys
     0.38 px of seam at the median boundary pixel and 0.15 px at the steep
     decile: a hard cut. 971 px of one such boundary crossed the lakehouse
     basin as a line between two flat teals.

     So the width is SEAM_PX pixels of checker at the local slope. SEAM_MIN is
     the floor for a slower field. SEAM_MAX is the ceiling: past a third of a
     rung no plateau remains, and a field that steps in one pixel (a trail's
     border, a shadow's rim) is a real edge and stays one. */
  float w = clamp(SEAM_PX*slope*(rungs-1.0), SEAM_MIN, SEAM_MAX);
  float e = clamp((fr - 0.5)/w + 0.5, 0.0, 1.0);
  /* Density is quantised to flat or the half checker, never a continuum. A
     shallow continuous density lights four cells of sixty-four in a rigid 8x8
     lattice, which reads as dirt over a large area. */
  e = floor(e*2.0 + 0.5)/2.0;
  float r = floor(f) + (b < e ? 1.0 : 0.0);
  return texture2D(uPal, vec2((clamp(r,0.0,rungs-1.0)+0.5)/RW,(id+0.5)/RH)).rgb;
}
uniform sampler2D uGeom, uShadow;
uniform vec3 uLight, uLightCol, uFog;
uniform vec3 uLantern; uniform float uLanternI;
uniform vec2 uRes;
uniform float uTime, uRain;
/* Worm switch and world seed. Zero in every world but one. */
uniform float uWorm, uWormSeed;
uniform vec2 uCam;
uniform vec4 uAer;
varying vec2 vUV;
${WORM_GLSL}
${SPELL_GLSL}

/* Albedo field slope, in t per pixel. rampDither converts its pixel budget to
   rung units with it.

   Central difference on uGeom neighbours, not fwidth: one fragment covers one
   geom texel, and dFdx needs GL_OES_standard_derivatives in GLSL ES 1.0
   (SwiftShader is a render target).

   A neighbour with a different surface flag is another material on another
   ramp. Counting it measures half a ramp per pixel on every water pixel at its
   bank and dithers the whole waterline, so the difference goes one-sided
   there. */
vec2 fieldAt(vec2 uv, float flag){
  vec4 s = texture2D(uGeom, uv);
  return vec2(s.r, abs(floor(s.a*255.0/${FLAG_Q}.0 + 0.5) - flag) < 0.5 ? 1.0 : 0.0);
}
float axisSlope(vec2 back, vec2 fwd, float t0){
  float n = back.y + fwd.y;
  if(n < 0.5) return 0.0;
  return ((back.y > 0.5 ? t0 - back.x : 0.0) + (fwd.y > 0.5 ? fwd.x - t0 : 0.0))/n;
}
float fieldSlope(vec2 uv, float flag, float t0){
  vec2 e = 1.0/uRes;
  return length(vec2(
    axisSlope(fieldAt(uv - vec2(e.x,0.0), flag), fieldAt(uv + vec2(e.x,0.0), flag), t0),
    axisSlope(fieldAt(uv - vec2(0.0,e.y), flag), fieldAt(uv + vec2(0.0,e.y), flag), t0)));
}

void main(){
  /* uGeom and uShadow are render targets: sample through rtUV. */
  vec4 g = texture2D(uGeom, rtUV(vUV));
  float t = g.r;
  float flag = floor(g.a*255.0/${FLAG_Q}.0 + 0.5);
  vec3 N = normalize(vec3((g.gb*2.0-1.0)*vec2(-1.0,-1.0), 1.0));
  /* Worm swell: a travelling ground deformation, a function of world position
     and time, added to the baked normal here because the chunk is static. The
     ground pass stores slope, so the swell adds its own gradient: central
     difference at one pixel on the ground plane. */
  if(uWorm > 0.01){
    /* Ground plane, not screen: a screen row is two ground pixels of depth. */
    vec2 gpx = vUV*uRes;
    vec2 wpg = vec2(floor(gpx.x)+uCam.x, (floor(gpx.y)+uCam.y)*2.0);
    float h  = wormHeave(wpg, uTime, uWormSeed);
    if(h > 0.0001){
      float hx = wormHeave(wpg+vec2(1.0,0.0), uTime, uWormSeed) -
                 wormHeave(wpg-vec2(1.0,0.0), uTime, uWormSeed);
      float hy = wormHeave(wpg+vec2(0.0,2.0), uTime, uWormSeed) -
                 wormHeave(wpg-vec2(0.0,2.0), uTime, uWormSeed);
      N = normalize(N + vec3(-hx*0.5, -hy*0.5, 0.0)*uWorm);
    }
  }
  float ndl = max(dot(N, normalize(uLight)), 0.0);
  bool LERPS = ${glslSurfaceLerps()};

  vec2 wp = floor(vUV*uRes) + uCam;
  /* Ice inside a mark that holds its heat is open water (heat:'thaw' in
     src/surface.js). */
  if(uMarkN > 0.5 && (${glslSurfaceThaw('flag')}) && markHot(wp)) flag = ${SURF.water}.0;
  float slope = fieldSlope(rtUV(vUV), flag, t);
  vec3 c;
  float surfaceRamp = ${glslSurfaceShadowRamp()};
  float tone = ${glslSurfaceTone()};
  /* A spell mark is a deviation of the tone field, one whole rung, so the
     paint and the shadow branch below both carry it on the surface's own
     ramp. A crest already on the last rung steps the other way. A heat rim
     only darkens. */
  float markT = 0.0;
  if(uMarkN > 0.5 && !(${glslSurfaceWet('flag')})){
    float dr = markRung(wp, ${glslSurfaceHeat('flag')});
    if(dr != 0.0){
      float rungs = floor(texture2D(uRungTex, vec2((surfaceRamp+0.5)/RH,0.5)).r*255.0+0.5);
      float at = floor(clamp(tone,0.0,1.0)*(rungs-1.0)+0.5);
      if(dr > 0.0 && at+dr > rungs-1.0) dr = -dr;
      markT = dr/(rungs-1.0);
      tone += markT;
    }
  }
  /* This dispatch, the tone and the shadow-branch ramp are all emitted from
     SURFACE in src/surface.js. Adding a surface is a row. */
${glslSurfacePaint()}
  c *= uLightCol;

  /* Water takes no cast shadow here: the water pass draws its own surface.
     Water is the wet column of SURFACE. */
  if(!(${glslSurfaceWet('flag')})){
    /* Soften with distance along the shadow: crisp at the trunk, diffuse at
       the tip. A fixed 3x3 tap destroys anything thinner than about four
       pixels. */
    vec4 s0 = texture2D(uShadow, rtUV(vUV));
    float rad = 0.4 + 2.8*s0.g;
    float sh = 0.0;
    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++)
      sh += texture2D(uShadow, rtUV(vUV) + vec2(float(i),float(j))/uRes*rad).r;
    sh /= 9.0;
    sh = floor(sh*3.0 + 0.35)/3.0;
    if(sh > 0.01){
      /* Shade the surface through its own ramp. Shading every surface through
         the snow ramp replaced up to 101 px a frame of shelf ice and stone
         with snow colour. */
      float t2 = clamp(t + 0.38*ndl - sh*0.45 + markT, 0.0, 1.0);
      vec3 sc = surfaceRamp < 0.5
        ? rampDither(surfaceRamp,t2,wp,slope) : rampStep(surfaceRamp,t2);
      /* A step on any surface that does not dither (glslSurfaceLerps in
         src/surface.js): a partial mix of two legal colours is an illegal one,
         and the snap sends a shadowed green to the winter blue-greys. */
      float shA = min(1.0, sh*1.15);
      c = LERPS ? mix(c, sc*uLightCol, shA) : (shA > 0.5 ? sc*uLightCol : c);
    }
  }
  /* A ground hit is brief and causal. Peat and made timber declare in SURFACE
     that they receive it. Duckweed is water with no open optical surface:
     neither this branch nor W_WATER_FS. The Weber number selects drops
     energetic enough to clear the one-pixel floor. */
  if(uRain>0.01 && (${glslSurfaceRainGround('flag')})){
    vec2 baseCell=floor(wp/RAIN_CELL);
    float splash=0.0;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
      vec2 cell=baseCell+vec2(float(i),float(j));
      float period,age,cycle;
      rainClock(cell,uRain,uTime,period,age,cycle);
      if(age<RAIN_GROUND_LIFE){
        float diameter,speedPx;vec2 centre;
        rainDrop(cell,cycle,uRain,centre,diameter,speedPx);
        float q=rainProjectedDistance(wp-centre);
        float life=age/RAIN_GROUND_LIFE;
        float energy=smoothstep(45.0,300.0,rainWeber(diameter,speedPx));
        float spreadSeed=rainEventRandom(cell,cycle,61.7);
        float jetSeed=rainEventRandom(cell,cycle,73.9);
        float radius=(max(0.75,0.45+diameter*0.32)+life*0.85)*
          mix(0.86,1.16,spreadSeed);
        float crown=1.0-smoothstep(0.28,0.68,abs(q-radius));
        float core=(1.0-smoothstep(0.35,0.95,q))*(1.0-life);
        /* One to three asymmetric ballistic flecks. Their directions are
           event-hashed, so the shape varies without boiling frame to frame. */
        vec2 delta=wp-centre;
        float arc=4.0*life*(1.0-life);
        vec2 jetA=vec2(-mix(0.65,1.55,spreadSeed)*life,
                       -mix(0.65,1.45,jetSeed)*arc);
        vec2 jetB=vec2(mix(0.55,1.45,jetSeed)*life,
                       -mix(0.55,1.30,spreadSeed)*arc);
        vec2 jetC=vec2(mix(-0.30,0.30,spreadSeed)*life,
                       -mix(1.0,1.75,jetSeed)*arc);
        float jets=1.0-smoothstep(0.28,0.72,length(delta-jetA));
        if(jetSeed>0.28)
          jets=max(jets,1.0-smoothstep(0.28,0.72,length(delta-jetB)));
        if(jetSeed>0.78)
          jets=max(jets,1.0-smoothstep(0.25,0.68,length(delta-jetC)));
        splash=max(splash,max(max(crown,core),jets)*energy*(1.0-life*0.42));
      }
    }
    if(splash>0.34)
      c=rampStep(surfaceRamp,clamp(t+0.42,0.0,1.0))*uLightCol;
  }
  /* No sparkle on snow: lit snow is a flat bright shape. Isolated top-of-ramp
     pixels cut the largest quiet region of a frame to one and a half per cent,
     against ten in the reference painting. */
  if(uLanternI > 0.001){
    float d = distance(vUV*uRes, uLantern.xy);
    c += vec3(1.0,0.60,0.32) * uLanternI * exp(-d/uLantern.z) * 0.55;
  }

  /* Aerial treatment: one flat constant, the same the sprites get. Haze from
     screen y puts a horizontal seam across the world that slides with the
     camera.

     Per scene: uAer is (targetL, compress, desaturate, fog). The snow's
     literals (targetL 150) desaturate a meadow green by a fifth and lift it
     32 luminance: measured, 72.6% of an open meadow frame is one colour, off
     the ground's own ramp.

     The label is taste (docs/DECISIONS.md). Airlight over the thirty metres a
     screen covers, in clear air, is about six parts in ten thousand. This is
     a glare and contrast treatment, applied uniformly. */
  c = aerialApply(c*255.0, uAer.x, uAer.y, uAer.z, uAer.w, uFog*255.0)/255.0;
  gl_FragColor = vec4(c,1.0);
}`;

const W_WATER_FS=`
precision highp float;
${GLSL_COMMON}
${RAIN_GLSL}
uniform sampler2D uScene, uGeom, uReflection;
uniform vec2 uRes;
uniform float uTime, uWind, uRain;
uniform vec2 uCam;
/* x: medium-legibility strength above physical Fresnel. y: wind-displacement
   scale. The physical 0.059 term is already in the water ramp. This pass
   replaces part of that sky return with a caster. */
uniform vec2 uReflect;
uniform vec3 uLightCol;
/* The ramp a frost plate draws on (SCENES.ice), or -1. A world with no ice
   ramp draws the plate on uIceCol, the pale blue every snap list carries
   (extraColour in src/palette.js), under a lip of the caster's signal. A
   pond's own ramp is a depth ramp: its pale end is the shore, and a plate on
   it reads as a sandbar. */
uniform float uIce;
uniform vec3 uIceCol;
varying vec2 vUV;
${SPELL_GLSL}

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main(){
  vec4 g = texture2D(uGeom, rtUV(vUV));
  float flag = floor(g.a*255.0/${FLAG_Q}.0 + 0.5);
  vec4 scene = texture2D(uScene, rtUV(vUV));
  if(!(${glslSurfaceWet('flag')})){ gl_FragColor = scene; return; }

  vec2 px = vUV*uRes;
  vec2 wp = floor(px)+uCam;
  float y = px.y;
  vec3 c = scene.rgb;
  float surfaceRamp=${glslSurfaceShadowRamp()};
  /* A frost plate is a solid over the water: no reflection, no ring, no
     swell. Its lip is the last rung of its ramp and its face the rung
     below. */
  float plate = uMarkN > 0.5 ? markPlate(wp) : 0.0;
  if(plate > 0.5){
    if(uIce < -0.5){
      gl_FragColor = vec4(plate > 1.5 ? rampStep(${RAMP_ID.folkSignal}.0, 1.0) : uIceCol, 1.0);
      return;
    }
    float rungs = floor(texture2D(uRungTex, vec2((uIce+0.5)/RH,0.5)).r*255.0+0.5);
    float face = (rungs - (plate > 1.5 ? 1.0 : 2.0))/(rungs-1.0);
    gl_FragColor = vec4(rampStep(uIce, face)*uLightCol, 1.0);
    return;
  }
  /* World row: a screen-row hash slides the lake surface across the world as
     the camera moves. */
  float wy = y + uCam.y;
  /* Waves are a displacement. The field shifts the column each reflected
     pixel is read from, so no new colour appears and nothing shimmers. It
     scrolls downwind, and amplitude follows uWind: a calm lake is a mirror. */
  float sw = max(0.0,uWind);
  float drift = uTime*2.6*uWind;
  float wob = (vnoise(vec2(wy*0.075 + drift*0.10, uTime*0.20))-0.5)*8.0*sw
            + (vnoise(vec2(wy*0.24  + drift*0.26, uTime*0.33+11.0))-0.5)*3.0*sw;
  /* Drop rings are events, not a surface texture. Each impact hashes one to
     three concentric crests with bounded spacing. A physical circle is
     measured with y doubled under the 1/2 cabinet projection. Its measured
     minimum gravity-capillary speed stays visible at project scale. The
     one-pixel crest is the declared legibility floor. */
  vec2 rippleOffset=vec2(0.0);
  float rippleHit=0.0,splashHit=0.0;
  if(uRain>0.01){
    vec2 baseCell=floor(wp/RAIN_CELL);
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
      vec2 cell=baseCell+vec2(float(i),float(j));
      float period,age,cycle;
      rainClock(cell,uRain,uTime,period,age,cycle);
      if(age<RAIN_RIPPLE_LIFE){
        float diameter,speedPx;vec2 centre;
        rainDrop(cell,cycle,uRain,centre,diameter,speedPx);
        vec2 delta=wp-centre;
        float q=rainProjectedDistance(delta);
        float impact=smoothstep(45.0,300.0,rainWeber(diameter,speedPx));
        float ringSeed=rainEventRandom(cell,cycle,83.1);
        float gapSeed=rainEventRandom(cell,cycle,97.3);
        float ringCount=floor(1.0+ringSeed*RAIN_MAX_RINGS);
        float rippleEnergy=(0.55+0.45*impact)*mix(0.86,1.08,gapSeed);
        float radius=rainRippleRadius(age);
        float gap=mix(RAIN_RING_GAP_MIN,RAIN_RING_GAP_MAX,gapSeed);
        float crest=mix(0.18,0.27,ringSeed);
        float ring=1.0-smoothstep(crest,crest+0.30,abs(q-radius));
        if(ringCount>1.5&&radius>gap+0.15)
          ring=max(ring,1.0-smoothstep(crest,crest+0.30,
            abs(q-(radius-gap))));
        if(ringCount>2.5&&radius>gap*2.0+0.15)
          ring=max(ring,1.0-smoothstep(crest,crest+0.30,
            abs(q-(radius-gap*2.0))));
        rippleHit=max(rippleHit,ring*rippleEnergy*
          (1.0-age/RAIN_RIPPLE_LIFE*0.65));
        vec2 projected=delta*vec2(1.0,2.0);
        vec2 direction=length(projected)>0.01
          ?normalize(projected)*vec2(1.0,0.5):vec2(0.0);
        rippleOffset+=direction*ring*rippleEnergy*(0.45+diameter*0.18);
        float splashSpread=mix(0.82,1.18,
          rainEventRandom(cell,cycle,109.7));
        float crown=(1.0-smoothstep(0.45*splashSpread,1.15*splashSpread,q))*
          (1.0-smoothstep(0.0,0.13,age));
        float stalk=(1.0-smoothstep(0.35,0.85,q))*
          (age>RAIN_SECOND_WAVE&&age<RAIN_SECOND_WAVE+0.08?1.0:0.0);
        splashHit=max(splashHit,max(crown,stalk)*impact);
      }
    }
  }
  rippleOffset=clamp(rippleOffset,vec2(-2.0),vec2(2.0));
  vec2 rpx = px + vec2(wob*uReflect.y, 0.0) + rippleOffset;
  vec4 reflected = texture2D(uReflection, rtUV(rpx/uRes));
  if(reflected.a > 0.01)
    c = mix(c, reflected.rgb, clamp(reflected.a*uReflect.x,0.0,1.0));
  if(splashHit>0.32)c=rampStep(surfaceRamp,1.0);
  else if(rippleHit>0.22)c=rampStep(surfaceRamp,1.0);
  /* a tremor crest crosses water as one ring on the water's own ramp */
  else if(uMarkN > 0.5 && markCrest(wp))c=rampStep(surfaceRamp,1.0);
  /* No animated surface texture on water: displacement and causal rain rings
     only. A thresholded noise crest hashed on screen x slides 1159 px of lake
     against the world on a one-pixel camera scroll and churns 1298 px with
     the camera stopped. Each ring has one impact centre, expands, ends, and
     uses the receiving water's own ramp. */
  gl_FragColor = vec4(c*uLightCol,1.0);
}`;

export { BLIT_FS, BLIT_VS, CONTACT_VS,
         W_GROUND_FS, W_REFLECT_VS, W_SHADOW_FS, W_SHADOW_VS, W_SPRITE_VS,
         W_WATER_FS };
