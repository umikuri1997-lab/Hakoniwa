import { RAMP_ID } from '../palette.js';
import { GLSL_COMMON } from '../shaders/common.js';
import { RAIN_GLSL, SAND_GLSL, WIND_GLSL } from '../weather.js';

/* Human colour remains scene-lit while spending less of its chroma on haze. */
const HUMAN_AERIAL=Object.freeze({compression:0.25,desaturation:0.15,fog:0.30});

/* GLSL for sprites and the post pass. The post pass owns the nearest-palette
   snap and the weather. Precipitation is a function of world position and
   time: no particles. */

const SPRITE_FS=`
precision highp float;
${GLSL_COMMON}
${RAIN_GLSL}
uniform sampler2D uNrm, uMat;
uniform vec3 uLight, uLightCol, uFog;
uniform vec3 uLantern;      // xy position in pixels, z radius
uniform float uLanternI;
uniform vec2 uRes;
varying vec2 vUV;
varying vec2 vLocal;
varying vec4 vRect;
varying float vFlip, vPhase, vBend;
varying float vRamp, vSMin, vSMax, vTL, vComp, vDesat, vFog;
/* vVol is the deposit's volume weight. Default 0. */
varying float vRamp2, vVol, vDMin, vDMax;
uniform float uWind, uTime, uRain;
uniform vec2 uCam;
uniform vec2 uAtlas;
uniform float uIce;
uniform vec3 uIceCol;

/* Chroma the aerial treatment removes. Per scene: SCENES.aer in scene.js. */
uniform float uDesat;
/* Lighting is quantised to uSteps steps before it reaches the ramp.
   Unquantised, an average prop carries eleven palette entries and 67
   luminance of local contrast, against 12 for the ground under it.
   uSteps = 0 disables the step. */
uniform float uSteps;

float posterise(float t){
  if(uSteps < 0.5) return t;
  return floor(clamp(t,0.0,1.0)*uSteps + 0.5)/uSteps;
}

${WIND_GLSL}
/* Wind on the pixel grid: a whole-pixel shift at sample time. Rotating or
   scaling a sprite resamples the grid. No filtering, no new colours. */
vec2 windUV(){
  if(vPhase < 0.0 || (uWind < 0.001 && abs(vBend) < 0.5)) return vUV;
  /* Aerial roots are flexible lines. Material 9 marks only their thin upper
     length; the grounded pillar stays material 1. The marked line translates
     one whole texel during a settled gust, so its base stays fixed and the
     one-pixel join reads as a bend. */
  float gust = windGust(vPhase, uTime);
  float rs = gust*uWind*1.12;
  float rootShift = rs > 0.72 ? 1.0 : (rs < -0.72 ? -1.0 : 0.0);
  if(rootShift != 0.0){
    float sourceX=vLocal.x-rootShift;
    float hereMat=floor(texture2D(uMat,vUV).r*255.0+0.5);
    if(sourceX>=0.0&&sourceX<=vRect.z-1.0){
      float du=(vFlip>0.5?rootShift:-rootShift)/uAtlas.x;
      vec2 sourceUV=vUV+vec2(du,0.0);
      float sourceMat=floor(texture2D(uMat,sourceUV).r*255.0+0.5);
      if(sourceMat>8.5&&sourceMat<9.5)return sourceUV;
    }
    if(hereMat>8.5&&hereMat<9.5)return vec2(-1.0);
  }
  /* Crown sway is a small, rare, settled event on a per-instance phase, a
     function of world position and time with no per-object state. One hinge,
     one pixel of displacement, gust periods of eleven and twenty-seven
     seconds, so a tree steps a few times a minute.
     A continuous per-row shear crawls a one-row discontinuity up the crown.
     Three stiffness hinges step a large segment a whole pixel at a couple of
     hertz. */
  float fromBase = clamp(1.0 - vLocal.y / max(1.0, vRect.w), 0.0, 1.0);
  /* A spell front (vBend, whole pixels to screen right) overrides the gust
     while it passes. Two pixels is a strong front: the crown takes both and
     a second hinge lower down takes one, so the stem bows. */
  if(abs(vBend) > 0.5){
    float lean = fromBase >= 0.62 ? vBend : (fromBase >= 0.36 && abs(vBend) > 1.5 ? sign(vBend) : 0.0);
    if(lean == 0.0) return vUV;
    /* the sample moves against the lean, mirrored with the sprite */
    float lxb = vLocal.x + (vFlip > 0.5 ? lean : -lean);
    if(lxb < 0.0 || lxb > vRect.z - 1.0) return vec2(-1.0);
    return vec2(vRect.x + lxb, vRect.y + vLocal.y) / uAtlas;
  }
  /* one hinge, high up: only the crown moves */
  if(fromBase < 0.62) return vUV;

  float s = gust * uWind * 1.35;
  /* a dead band, so a tree near the threshold settles */
  float shift = s > 0.62 ? 1.0 : (s < -0.62 ? -1.0 : 0.0);
  if(shift == 0.0) return vUV;
  if(vFlip > 0.5) shift = -shift;                   // the shear follows the screen
  float lx = vLocal.x + shift;
  if(lx < 0.0 || lx > vRect.z - 1.0) return vec2(-1.0);
  return vec2(vRect.x + lx, vRect.y + vLocal.y) / uAtlas;
}

void main(){
  vec2 uv = windUV();
  if(uv.x < 0.0) discard;
  vec4 m = texture2D(uMat, uv);
  if(m.a < 0.5) discard;
  /* Dissolve. Blending two legal colours makes an illegal one, so a sprite
     fades by an ordered threshold that removes pixels. The pattern is keyed
     to sprite-local coordinates and travels with the sprite. It covers the
     last stretch of the cull margin, so nothing snaps out of the picture. */
  if(vDesat < 0.999){
    vec2 q = mod(floor(vLocal), 4.0);
    float ord = (q.y*4.0 + mod(q.x*5.0 + q.y*2.0, 4.0))/16.0;
    if(ord >= vDesat) discard;
  }
  float mat = floor(m.r*255.0+0.5);
  bool aerialRoot = mat > 8.5 && mat < 9.5;
  bool humanSurface = (mat > 4.5 && mat < 5.5) ||
                      (mat > 6.5 && mat < 7.5) || mat > 15.5;
  vec4 nt = texture2D(uNrm, uv);
  /* No raw-colour material: a sprite never stores RGB (AGENTS.md). */
  vec3 N = normalize(vec3(nt.rg*2.0-1.0, max(nt.b,0.02)));
  /* A mirrored sprite has a mirrored normal field. W_SPRITE_VS mirrors the UV
     (world.js, mix(corner.x, 1.0-corner.x, flip)), which moves the texels but
     not their nx. Unnegated, the lit side rides the sprite and disagrees with
     its own cast shadow, which is built from uLight. */
  if(vFlip > 0.5) N.x = -N.x;
  float ao = m.g, baked = m.b;

  /* The dot product is evaluated per frame, so moving uLight relights every
     sprite. The result snaps to a ramp rung, so the palette never widens. */
  vec3 Ldir = normalize(uLight);
  float ndl = max(dot(N, Ldir), 0.0);
  float lit = 0.16 + 0.94*ndl;   // same curve the software path bakes

  vec3 c;
  if(mat > 9.5 && mat < 11.5){                    // 10 eye, 11 flower: machine signals
    float greenSignal=mat>10.5?1.0:0.0;
    c=rampStep(${RAMP_ID.machineSignal}.0,greenSignal);
    c=mix(c,uFog,vFog*0.22);
    gl_FragColor=vec4(c,1.0);return;
  } else if(mat < 1.5 || aerialRoot || (mat > 11.5 && mat < 12.5)){
    /* Wood, flexible aerial root, and open-undercroft timber (12), which
       paints like wood and is discarded by W_SHADOW_FS. */
    float tw = clamp(vSMin + (vSMax-vSMin)*posterise(clamp(lit*ao,0.0,1.0)), 0.0, 1.0);
    c = rampStep(vRamp, clamp(tw, 0.0, 1.0));
  } else if(mat < 2.5){                            // deposit: form from ao, light on top
    /* Material 2 is a deposit: a thing that sits on a structure and takes its
       own colour (snow on a branch, frost on a back, a palm frond's blade).
       snowPass writes it by sky exposure. The ramp comes off the instance:
       vRamp2, default 0 (snow). */
    float v = 0.14 + 0.86*posterise(clamp(ao*(0.60+0.55*ndl),0.0,1.0));
    /* A deposit may be a volume. baked is partThickness(): a two-pass chamfer
       distance transform plus a 5x5 dilation, normalised over 3 px. Foliage
       is a mass, so vVol pulls toward the dark end of the window. The
       vegetation ladder runs crown interior to sunlit blade (docs/MEADOW.md
       2b), so rung 0 of canopy is a leaf inside a crown. vVol is 0 for snow. */
    v *= 1.0 - vVol*baked;
    c = rampStep(vRamp2, clamp(vDMin + (vDMax-vDMin)*v, 0.0, 1.0));
  } else if(mat < 3.5){                            // bark mark
    float tb = (vSMin + (vSMax-vSMin)*posterise(clamp(lit*ao,0.0,1.0)))*0.24;
    c = rampStep(vRamp, clamp(tb, 0.0, 1.0));
  } else if(mat < 4.5){                            // animal body cloth
    c = rampStep(${RAMP_ID.trunk}.0, clamp(0.02 + 0.92*baked*(0.62+0.52*ndl), 0.0, 1.0));
  } else if(mat < 5.5){                            // 5, the person's coat
    /* Human cloth spends the whole declared window and has a steeper light
       response than the world. Dark facets choose, lit facets carry colour. */
    float coatForm = clamp(vSMin + (vSMax-vSMin)*baked, 0.0, 1.0);
    float coatLit = clamp((coatForm-0.08)*(0.50+0.72*ndl), 0.0, 1.0);
    c = rampStep(vRamp, posterise(coatLit));
  } else if(mat < 6.5){                            // the accent
    /* The accent keeps its own ramp and receives the same runtime light as
       the cloth under it. baked is symmetric form, never a painted sun side. */
    float accentLit = clamp(0.06 + 0.78*baked*(0.65+0.45*ndl), 0.0, 1.0);
    float accentRamp = vRamp2 > 0.5 ? vRamp2 : ${RAMP_ID.accent}.0;
    c = rampStep(accentRamp, accentLit);
    c = mix(c, uFog, vFog*0.4);
    gl_FragColor = vec4(c,1.0); return;
  } else if(mat < 7.5){                            // 7, the figure's silhouette edge
    /* The rim side is chosen here, per frame, from the uLight the cast
       shadows use. rimPass in figure-folk.js marks both silhouette columns as
       material 7 with nx = +-0.90, ny = 0, nz = 0.436.

       ndl cannot choose: ndl_left + ndl_right = 2*nz*Ldir.z =
       0.87*sin(elevation), so both edges light together as the sun climbs.
       The two edge columns of a row carry opposite nx signs, so N.x*Ldir.x is
       positive on at most one edge at every azimuth and elevation. With the
       sun up-screen or down-screen neither qualifies and both fall to
       folkDark rung 0, a full dark silhouette.

       Side and strength do not share a number. The sign of N.x*Ldir.x picks
       the edge. abs(Ldir.x) alone sets the fade: a threshold on the product
       moves with |N.x|, so the rim changes with the facing at one azimuth.
       The screen-left edge rims exactly when Ldir.x < 0, whichever way the
       figure faces (test/lighting.test.mjs). */
    float faces = N.x * Ldir.x;       // >0 on the one edge turned toward the sun
    float lat   = abs(Ldir.x);        // how lateral the sun is, the whole fade
    /* 0.444 and 0.167 are 0.40 and 0.15 divided by the 0.900 that |N.x|
       carries: a full rim over 61% of the azimuth sweep, the shoulder over a
       further 25%, nothing when the sun is up-screen or down-screen.

       ao is the rim allowance from rimPass: 0.40 above the hem, 0 below. The
       middle rung fades the rim in two steps: one step pops 190 luminance in
       a frame. */
    if(faces > 0.0 && lat > 0.444 && ao > 0.5)      c = rampStep(0.0, 1.00);  // snow 5, the catch
    else if(faces > 0.0 && lat > 0.167 && ao > 0.5) c = rampStep(0.0, 0.60);  // snow 3, its shoulder
    /* The coat rim (allowance 0.40): the top rung of the figure's own cloth,
       one step above its lit side. A snow-white edge outshines the face. */
    else if(faces > 0.0 && lat > 0.167 && ao > 0.3) c = rampStep(vRamp, 0.95);
    else if(faces > 0.0 && lat > 0.167)             c = rampStep(${RAMP_ID.folkDark}.0,
                                       clamp(0.02 + 0.92*baked*(0.62+0.52*ndl), 0.0, 1.0));
    else                                            c = rampStep(${RAMP_ID.folkDark}.0, 0.0);  // the outline
  } else if(mat > 12.5 && mat < 13.5){             // 13, airborne ground pair
    /* Local parity in the atlas writes baked as 0 or 1. Those values select
       both endpoints of the source material ramp, so at least one pixel clears
       any background by one legal rung. */
    c = rampStep(vRamp, baked < 0.5 ? vSMin : vSMax);
  } else if(mat > 13.5 && mat < 14.5){             // 14, a spell's light
    /* The pair of material 13, emitted. No aerial treatment: measured in
       Frostwood, haze drains a flame toward the snow's grey and the snap
       lands it on the accent ramp. */
    gl_FragColor = vec4(rampStep(vRamp, baked < 0.5 ? vSMin : vSMax), 1.0); return;
  } else if(mat > 14.5 && mat < 15.5){             // 15, a frost crystal
    /* The plate's ice in the air, as W_WATER_FS draws the plate: its face and
       its lip. A world with no ice ramp has the snap list's pale blue and the
       caster's signal. */
    if(uIce < -0.5)
      gl_FragColor = vec4(baked < 0.5 ? uIceCol : rampStep(${RAMP_ID.folkSignal}.0, 1.0), 1.0);
    else
      gl_FragColor = vec4(rampStep(uIce, baked < 0.5 ? 0.80 : 1.0)*uLightCol, 1.0);
    return;
  } else if(mat > 18.5 && mat < 19.5){             // 19, a luminous body
    /* Emitted, so no light term and no aerial treatment: the form is the
       baked position on the deposit ramp (src/speleo.js). */
    gl_FragColor = vec4(rampStep(vRamp2, clamp(vDMin + (vDMax-vDMin)*baked, 0.0, 1.0)), 1.0);
    return;
  } else if(mat > 15.5 && mat < 16.5){             // 16, skin
    /* The face plane uses its own ramp, not the instance window: an elder's
       dimmed coat (sMax 0.80) must not dim his face. */
    c = rampStep(${RAMP_ID.skin}.0, clamp(0.10 + 0.90*baked*(0.55+0.55*ndl), 0.0, 1.0));
  } else if(mat > 16.5 && mat < 17.5){             // 17, human under-layer
    c = rampStep(${RAMP_ID.folkDark}.0,
      clamp(0.04 + 0.82*baked*(0.45+0.55*ndl), 0.0, 1.0));
  } else if(mat > 17.5 && mat < 18.5){             // 18, the dyed band
    /* Two rungs, madder and ochre, on the accent branch's response curve.
       Over a two-rung ramp that arithmetic never crosses posterise's midpoint
       from either end, so a dyed pixel is one of exactly two colours at every
       sun elevation. figure-folk.js writes 0.34 for madder and 1.00 for
       ochre. */
    c = rampStep(${RAMP_ID.folkDye}.0,
      clamp(0.06 + 0.78*baked*(0.65+0.45*ndl), 0.0, 1.0));
  } else {                                         // 8, bronze
    /* Bronze has no ramp of its own: Pond Court brings the global vocabulary
       to the snap loop's practical ceiling. The meadow machines use masonry's
       warm mineral colours and differ by response: stone is diffuse material
       1, a conductor has a narrow view-dependent return. Orthographic sprites
       have one view vector, so H = normalize(L+V) is exact.

       The glint is stepped between two legal ramp positions. A smooth
       specular lobe manufactures off-palette colours. */
    vec3 H = normalize(Ldir + vec3(0.0,0.0,1.0));
    float spec = pow(max(dot(N,H),0.0), 18.0);
    float base = posterise(clamp((0.12 + 0.78*ndl)*ao,0.0,1.0));
    float metal = max(base*0.72, spec > 0.70 ? 1.0 : (spec > 0.42 ? 0.66 : 0.0));
    c = rampStep(vRamp, clamp(vSMin + (vSMax-vSMin)*metal, 0.0, 1.0));
  }
  c *= uLightCol;

  /* A leaf hit is a material response, not a second particle system. The
     world event that reaches a surface is tested against canopy pixels:
     upward-facing, exposed foliage spends one legal bright rung for a tenth
     of a second. Reflected sprites receive uRain=0 from Scene.uniforms. */
  if(uRain>0.01 && mat>1.5 && mat<2.5 &&
     abs(vRamp2-${RAMP_ID.swampCanopy}.0)<0.5 && N.z>0.30 && ao>0.20){
    vec2 fp=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
    vec2 wp=floor(fp)+uCam;
    vec2 baseCell=floor(wp/RAIN_CELL);
    float leafHit=0.0;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
      vec2 cell=baseCell+vec2(float(i),float(j));
      float period,age,cycle;
      rainClock(cell,uRain,uTime,period,age,cycle);
      if(age<RAIN_LEAF_LIFE){
        float diameter,speedPx;vec2 centre;
        rainDrop(cell,cycle,uRain,centre,diameter,speedPx);
        float energy=smoothstep(45.0,300.0,rainWeber(diameter,speedPx));
        float nearHit=1.0-smoothstep(0.55,1.75,length(wp-centre));
        leafHit=max(leafHit,nearHit*energy*(1.0-age/RAIN_LEAF_LIFE));
      }
    }
    if(leafHit>0.28)c=rampStep(vRamp2,1.0);
  }

  if(uLanternI > 0.001){
    float d = distance(vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y), uLantern.xy);
    float f = uLanternI * exp(-d/uLantern.z);
    c += vec3(1.0,0.60,0.32) * f * 0.7 * (0.25 + 0.75*max(dot(N,vec3(0.0,0.0,1.0)),0.0));
  }
  float aerComp = humanSurface ? vComp*${HUMAN_AERIAL.compression} : vComp;
  float aerDesat = humanSurface ? uDesat*${HUMAN_AERIAL.desaturation} : uDesat;
  float aerFog = humanSurface ? vFog*${HUMAN_AERIAL.fog} : vFog;
  c = aerialApply(c*255.0, vTL, aerComp, aerDesat, aerFog, uFog*255.0)/255.0;
  gl_FragColor = vec4(c,1.0);
}
`;
const QUAD_VS=`
varying vec2 vUV;
void main(){ vUV=vec2(uv.x,1.0-uv.y); gl_Position=vec4(position.xy*2.0,0.0,1.0); }
`;
const POST_FS=`
precision highp float;
${GLSL_COMMON}
${RAIN_GLSL}
${SAND_GLSL}
uniform sampler2D uScene;
uniform sampler2D uWeatherMask;
/* Coverage of the one body within the traveller's reach. See render.js pass 4b. */
uniform sampler2D uHighlight;
uniform float uHighlightOn;
uniform sampler2D uOut;
uniform float uOutN, uQuant, uTime, uFlakes, uRain, uRainRamp;
uniform float uSand;
uniform float uVig, uWind, uWindX, uWindY;
uniform vec2 uRes;
/* Camera offset in whole world pixels. Weather anchors to the world. */
uniform vec2 uCam;
varying vec2 vUV;

/* sin-free hash: fract(sin(...)) bands on the large, unbounded cell indices
   of a world-space snowfall */
float snowHash(vec2 p){
  vec3 q = fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y)*q.z);
}

void main(){
  vec2 px = vUV*uRes;
  vec2 wp = px + uCam;
  vec3 c = texture2D(uScene, rtUV(vUV)).rgb;

  /* Falling snow, anchored to the world. A flake's frame is world x, and world
     y minus how far it has fallen: anything stationary in that frame travels
     down the world at the fall rate and stays put relative to the ground when
     the camera moves. Sampling at px + uTime*speed makes the snow rise.

     Each layer has a constant lateral velocity, so a flake's path depends
     only on its cell and the clock. Depth comes from fall rate and flake
     size. Cost: three hashes and three distance tests per pixel. */
  if(uFlakes > 0.01){
    for(int L=0;L<3;L++){
      float lf = float(L);
      vec2 cs = vec2(16.0 + lf*7.0, 12.0 + lf*5.0);
      float fall = 16.0 + lf*20.0;
      /* Drift downwind, scaled by uWind. uWindX comes from the wind axis's
         owner: a literal copy goes stale and blows the snow against the
         drifts it falls onto. */
      float lat = fall * (0.10 + uWind*0.20) * uWindX;
      vec2 q = vec2(wp.x - uTime*lat, wp.y - uTime*fall);
      vec2 cell = floor(q/cs), fr = fract(q/cs);
      /* The cell index is a world coordinate and grows without bound:
         wrapped, then hashed without sin. */
      vec2 hc = mod(cell, 4096.0) + 17.0*lf;
      if(snowHash(hc) > 0.855){
        vec2 cp = vec2(snowHash(hc + 7.3), snowHash(hc + 19.1));
        vec2 d = (fr - cp)*cs;                  // in pixels, so flakes are round
        float r = 0.62 + lf*0.55;
        if(dot(d,d) < r*r)
          c = mix(c, vec3(0.87,0.91,0.94), uFlakes*(0.55 + 0.22*lf));
      }
    }
  }

  /* Falling rain and its impact share an event. rainClock gives each world
     cell a phase. The post pass draws the final RAIN_FALL_WINDOW before the
     next cycle's impact; ground, water and foliage draw the first instants
     after that cycle begins. Terminal velocity comes from drop diameter. The
     1/24 s streak exposure is the named pixel-medium choice that turns a
     subpixel drop into a short line. */
  if(uRain>0.01){
    vec2 baseCell=floor(wp/RAIN_CELL);
    float weatherOcclusion=texture2D(uWeatherMask,rtUV(vUV)).a;
    /* Impacts are down-screen from a falling fragment. At the bounded speed
       and fall window they can occupy this cell or the next two, never one
       above it, so nine candidate clocks cover the whole trajectory. */
    for(int j=0;j<=2;j++)for(int i=-1;i<=1;i++){
      vec2 cell=baseCell+vec2(float(i),float(j));
      float period,age,cycle,diameter,speedPx;vec2 centre;
      rainClock(cell,uRain,uTime,period,age,cycle);
      if(age>period-RAIN_FALL_WINDOW){
        rainDrop(cell,cycle+1.0,uRain,centre,diameter,speedPx);
        float untilImpact=period-age;
        float lateral=speedPx*(0.03+0.10*uWind)*uWindX;
        vec2 velocity=vec2(lateral,speedPx);
        vec2 head=centre-velocity*untilImpact;
        vec2 trail=head-velocity*RAIN_EXPOSURE;
        /* Event-hashed depth: most streaks sit behind standing sprites and
           are clipped by their exact animated coverage. A sparse near layer
           stays in front, so a tree is not a rain-shaped hole. This is
           occlusion, not roof collision. */
        float nearLayer=step(0.74,rainEventRandom(cell,cycle+1.0,131.9));
        float width=(0.40+0.14*smoothstep(1.0,2.8,diameter))*
          mix(0.90,1.10,nearLayer);
        if(rainSegmentDistance(wp,trail,head)<width &&
           (nearLayer>0.5||weatherOcclusion<0.5)){
          /* Neutral birch whites make airborne water legible over the olive
             swamp. Diameter still selects between its two palest legal rungs. */
          float rung=diameter>1.75?1.0:(diameter>1.0?0.92:0.82);
          c=rampStep(uRainRamp,rung);
        }
      }
    }
  }

  /* Blown sand travels along the ground. Saltation keeps almost all moving
     mass within the first few centimetres of the surface, so the drift
     direction is the whole wind vector, the lattice is in ground coordinates,
     and the mask clips a grain behind anything standing.

     A hop is up to three metres, but a 1/24 s frame is two to four pixels of
     travel: the dash is an exposure (RAIN_EXPOSURE), not a trajectory.

     Above the saltation skin the fine tail of the size distribution is in
     suspension: a haze, in the sand's own bright rung. */
  if(uSand>0.01){
    float shear=sandShear(uWind);
    float cover=sandCoverage(shear)*uSand;
    if(cover>0.002){
      float speedPx=sandGrainSpeedPx(shear);
      /* Ground plane, not screen: a screen row is two ground pixels of
         depth. */
      vec2 gp=vec2(wp.x,wp.y*2.0);
      vec2 dir=normalize(vec2(uWindX,uWindY));
      vec2 q=gp-dir*(uTime*speedPx);
      vec2 cell=floor(q/SAND_CELL);
      float occ=texture2D(uWeatherMask,rtUV(vUV)).a;
      /* Haze first, then grains by hashed depth. The suspended fines sit
         between the camera and everything, so a far grain is washed like the
         ground under it. A sparse near layer is drawn over the haze. */
      float haze=sandHaze(shear)*uSand;
      if(haze>0.002) c=mix(c,rampStep(uRainRamp,0.94),haze);
      for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
        vec2 cc=cell+vec2(float(i),float(j));
        vec2 hc=mod(cc,4096.0);
        if(sandHash(hc)>=cover) continue;
        vec2 seed=vec2(sandHash(hc+3.7),sandHash(hc+11.3));
        vec2 head=(cc+seed)*SAND_CELL;
        vec2 tail=head-dir*(speedPx*RAIN_EXPOSURE);
        if(sandSegmentDistance(q,tail,head)<0.62 && occ<0.5){
          /* the two palest rungs of the ground's own ramp: an airborne grain
             is lit from every side */
          float rung=sandHash(hc+29.1)>0.55?1.0:0.80;
          float near=step(0.66,sandHash(hc+53.7));
          c=mix(c,rampStep(uRainRamp,rung),mix(1.0-haze,1.0,near));
        }
      }
    }
  }

  float d = distance(px, uRes*vec2(0.5,0.48))/length(uRes*0.5);
  c *= 1.0 - smoothstep(0.58,1.16,d)*0.34*uVig;

  /* No frame-level dither: the ground's rampDither is the only dither in the
     pipeline. See docs/DECISIONS.md. */
  if(uQuant > 0.5){
    /* Fixed trip count and a clamped index: GLSL ES 1.0 implementations
       disagree about a dynamic break in a fragment loop, and a failure leaves
       most pixels unquantised. */
    vec3 best = c; float bd = 1e9;
    for(int i=0;i<64;i++){
      float fi = min(float(i), uOutN-1.0);
      vec3 p = texture2D(uOut, vec2((fi+0.5)/uOutN, 0.5)).rgb;
      vec3 dd = (c-p)*vec3(1.414,2.0,1.732);
      float s = dot(dd,dd);
      if(s < bd){ bd = s; best = p; }
    }
    c = best;
  }
  /* The interaction outline is UI, written after the snap: a desert
     out-palette has no white, and a snapped line is sand on sand. One pixel
     wide, traced just outside the coverage. */
  if(uHighlightOn > 0.5){
    vec2 t = 1.0/uRes;
    vec2 uvh = rtUV(vUV);
    float here = texture2D(uHighlight, uvh).a;
    if(here < 0.5){
      float n = max(max(texture2D(uHighlight, uvh+vec2( t.x,0.0)).a,
                        texture2D(uHighlight, uvh+vec2(-t.x,0.0)).a),
                    max(texture2D(uHighlight, uvh+vec2(0.0, t.y)).a,
                        texture2D(uHighlight, uvh+vec2(0.0,-t.y)).a));
      if(n >= 0.5) c = vec3(1.0);
    }
  }
  gl_FragColor = vec4(c,1.0);
}
`;

export { HUMAN_AERIAL, POST_FS, QUAD_VS, SPRITE_FS };
