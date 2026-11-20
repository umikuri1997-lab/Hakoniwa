import { reposeDepth } from './basin.js';
import { clamp, lerp } from './math.js';
/* AUTHORITY: scale.js. This module states no `PX_PER_M` literal of its own. */
import { M_PER_PX, PX_PER_M } from './scale.js';

/* INVARIANT: sprites store material/normal plus ramp id and rung, never colour.
   Meadow ramps derive light, albedo, response and Oklab spacing; winter remains authored.
   See docs/CANON.md and docs/DECISIONS.md. */

/* SOURCE: Bjorn Ottosson (2020), Oklab. Rungs use perceptual L spacing;
   out-of-gamut conversion reduces chroma without bending that ladder. */
const srgbToLin=u=>u<=0.04045?u/12.92:Math.pow((u+0.055)/1.055,2.4);
const linToSrgb=u=>u<=0.0031308?12.92*u:1.055*Math.pow(u,1/2.4)-0.055;

function linToOklab(r,g,b){
  const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b);
  const m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b);
  const s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
  return [0.2104542553*l+0.7936177850*m-0.0040720468*s,
          1.9779984951*l-2.4285922050*m+0.4505937099*s,
          0.0259040371*l+0.7827717662*m-0.8086757660*s];
}
function oklabToLin(L,A,B){
  const l=(L+0.3963377774*A+0.2158037573*B)**3;
  const m=(L-0.1055613458*A-0.0638541728*B)**3;
  const s=(L-0.0894841775*A-1.2914855480*B)**3;
  return [ 4.0767416621*l-3.3077115913*m+0.2309699292*s,
          -1.2684380046*l+2.6097574011*m-0.3413193965*s,
          -0.0041960863*l-0.7034186147*m+1.7076147010*s];
}
/* Oklab to a byte triple. Out of gamut reduces chroma and keeps L. */
function oklabToBytes(L,A,B){
  let k=1;
  for(let i=0;i<24;i++){
    const [r,g,b]=oklabToLin(L,A*k,B*k);
    if(r>=-0.0005&&g>=-0.0005&&b>=-0.0005&&r<=1.0005&&g<=1.0005&&b<=1.0005) break;
    k*=0.94;
  }
  const [r,g,b]=oklabToLin(L,A*k,B*k);
  return [Math.round(clamp(linToSrgb(clamp(r,0,1)),0,1)*255),
          Math.round(clamp(linToSrgb(clamp(g,0,1)),0,1)*255),
          Math.round(clamp(linToSrgb(clamp(b,0,1)),0,1)*255)];
}
const bytesToOklab=c=>linToOklab(srgbToLin(c[0]/255),srgbToLin(c[1]/255),srgbToLin(c[2]/255));
const chromaOf=c=>{ const [,A,B]=bytesToOklab(c); return Math.hypot(A,B); };
const dEok=(p,q)=>{ const a=bytesToOklab(p), b=bytesToOklab(q);
  return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]); };

/* SOURCE: Rayleigh scattering (lambda^-4); Cooper 1969 declination; Duffie &
   Beckman solar geometry. Beam is transmitted light and sky is its scattered complement. */
const TAU={r:0.060,g:0.098,b:0.220};        // Rayleigh optical depth, sea level
const DECL=23.45;                           // solstice declination, degrees

const norm3=v=>{ const m=(v[0]+v[1]+v[2])/3; return [v[0]/m,v[1]/m,v[2]/m]; };

/* WHY: clear-sky diffuse is the mean Rayleigh-scattered fraction. It matches
   tabulated 62 N/38 N values within 0.004 but remains an aerosol-free approximation. */
function diffuseFraction(airmass){
  const s=[TAU.r,TAU.g,TAU.b].map(t=>1-Math.exp(-t*airmass));
  return (s[0]+s[1]+s[2])/3;
}

/* A sun, as a value. Everything downstream takes one, so a world with another
   latitude is a row in a table. */
function sunAt(latDeg,declDeg){
  const decl=declDeg===undefined?DECL:declDeg;
  const altDeg=90-Math.abs(latDeg-decl);
  const alt=altDeg*Math.PI/180;
  const airmass=1/Math.sin(alt);
  /* the beam, after the atmosphere took its blue */
  const beam=norm3([Math.exp(-TAU.r*airmass),Math.exp(-TAU.g*airmass),Math.exp(-TAU.b*airmass)]);
  /* the sky is what the beam lost: the complement of the same transmittance */
  const sky=norm3([1-Math.exp(-TAU.r*airmass),1-Math.exp(-TAU.g*airmass),1-Math.exp(-TAU.b*airmass)]);
  const diffuse=diffuseFraction(airmass);
  const eSun=beam.map(v=>v*(1-diffuse));
  const eSky=sky.map(v=>v*diffuse);
  return {lat:latDeg,decl,altDeg,alt,airmass,diffuse,beam,sky,
          eSun,eSky,eFull:eSun.map((v,i)=>v+eSky[i]),
          /* The ground's share of the beam. A horizontal surface receives
             E*sin(altitude) and a blade turned to the beam receives E, so this
             is also the blade-tilt gain's denominator. Lambert's cosine law,
             1760. */
          ground:Math.sin(alt)};
}

/* SOURCE: Duffie & Beckman solar geometry; Reda & Andreas NREL SPA (2003).
   solarPosition returns physical altitude and screen azimuth for latitude/hour angle. */
function solarPosition(latDeg,hourDeg,declDeg){
  const rad=Math.PI/180;
  const lat=latDeg*rad, dec=(declDeg===undefined?DECL:declDeg)*rad, h=hourDeg*rad;
  const sinAlt=clamp(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(h),-1,1);
  const alt=Math.asin(sinAlt);
  const ca=Math.cos(alt)*Math.cos(lat);
  const cosA=Math.abs(ca)<1e-9?1:clamp((Math.sin(dec)-sinAlt*Math.sin(lat))/ca,-1,1);
  let A=Math.acos(cosA)/rad;
  if(Math.sin(h)>0) A=360-A;           // afternoon: west of north
  return {altDeg:alt/rad, azDeg:(270+A)%360, hourDeg};
}

function solarPositionForClock(latDeg,clock){
  if(!clock)throw new Error('solarPositionForClock requires the canonical world clock');
  const hourDeg=clock.minuteOfDay/4-180;
  return solarPosition(latDeg,hourDeg,clock.declination);
}

/* INVARIANT: SUN duplicates BIOMES latitudes because ramps need light at module load;
   test/biome.test.mjs asserts the two tables agree. */
const SUN={boreal:sunAt(62),meadow:sunAt(38),swamp:sunAt(28),desert:sunAt(24)};

/* the boreal names; the winter world's derivations quote them */
const SUN_ALT=SUN.boreal.alt, AIRMASS=SUN.boreal.airmass, DIFFUSE=SUN.boreal.diffuse;
const BEAM=SUN.boreal.beam, SKY=SUN.boreal.sky;
const E_SUN=SUN.boreal.eSun, E_SKY=SUN.boreal.eSky, E_FULL=SUN.boreal.eFull;

/* SOURCE: informal remote-sensing ranges for vegetation, dry loam and petals.
   Rows are spectral reflectance, not display colours. */
const ALBEDO={
  sward  :[0.075,0.170,0.062],   // sunlit meadow sward, the largest surface
  foliage:[0.048,0.128,0.048],   // canopy leaf, seen through more layers
  /* WHY: warm dry sand reflectance rises from blue to red and separates path from
   dark sward and cool winter neutrals; palette collision tests guard the result. */
  loam   :[0.480,0.380,0.250],   // dry sandy loam: cut banks and wet pond bed
  sandstone:[0.700,0.480,0.160], // warm local paving and ruin stone
  /* WHY: carotenoid bloom keeps low blue reflectance and separates from loam by
   hue, not value. Values are informal literature ranges. */
  bloom  :[0.820,0.680,0.105],   // gorse / buttercup carotenoid, INFORMAL
  peat   :[0.075,0.065,0.040],   // saturated organic soil, informal field range
  swampGround:[0.260,0.300,0.080], // raised herbaceous hummock, reference-led cover
  swampBed:[0.300,0.380,0.340],  // pale mineral-organic bed visible through shallows
  swampFoliage:[0.025,0.075,0.020], // canopy leaf under humid diffuse light
  duckweed:[0.160,0.320,0.035],  // floating lemnoid leaf mat
  swampWood:[0.035,0.055,0.035], // wet weathered timber with algal surface
  swampAccent:[0.700,0.360,0.070], // authored ochre human focal material
  /* SOURCE: informal remote-sensing ranges for the Sahara/Arabian sand seas.
     Quartz is near-neutral; the rise from blue to red is the iron-oxide grain
     coating. Broadband mean near 0.34, inside the 0.30-0.40 quoted for bright
     dune sand. Separate from `loam`, a damp cut bank at 38 N. */
  duneSand:[0.460,0.340,0.205],
  /* Halite efflorescence on a sabkha: the brightest natural ground after
     snow, near-neutral. */
  saltCrust:[0.620,0.605,0.560],
  /* Desert pavement: ordinary gravel under the manganese-iron varnish that
     accretes on a clast that lies still. Dark because stable. */
  desertPavement:[0.150,0.125,0.105],
  /* Xerophytic leaf: greyer and brighter than a mesic one in every band
     (waxy cuticle, dense hair layer, less chlorophyll). A desert canopy is a
     low-contrast grey-green. */
  desertFoliage:[0.095,0.145,0.082],
  /* SOURCE: Anderson & Parrish 1981; Jacques' optical-properties compilation.
     Skin reflectance rises steeply through the red: haemoglobin and melanin
     absorb hardest at the blue end. Informal mid-complexion range. No ramp
     reads skin, hair or boot. */
  skin   :[0.380,0.245,0.190],   // mid complexion, diffuse dermal scattering
  hair   :[0.115,0.075,0.050],   // brown keratin, low and slightly warm
  boot   :[0.055,0.042,0.036],   // dark oiled leather
};

/* SOURCE: Dickinson 1983; Sellers 1985; Kubelka-Munk 1931. Leaf single-scattering
   albedo is reflectance+transmittance; per-band values are informal optics ranges. */
const LEAF_T={foliage:[0.050,0.130,0.030], sward:[0.050,0.130,0.030],
              swampFoliage:[0.040,0.115,0.026],duckweed:[0.035,0.105,0.022],
              /* A xerophytic leaf transmits less than a mesic one in every
                 band: it is thicker, and the cuticle and hair layer sit in
                 the path. */
              desertFoliage:[0.032,0.092,0.020]};
/* Foliage and sward share leaf transmittance (same tissue optics) but not
   reflectance: denser crown path vs sunlit floor. omega uses both. */
const omega=name=>ALBEDO[name].map((r,i)=>r+LEAF_T[name][i]);

/* SOURCE: Monsi & Saeki 1953, I/I0=exp(-k*LAI). k and LAI are informal
   standard ranges; they set canopy contrast, not a global brightness lift. */
const CANOPY={ meadow:{k:0.70,lai:0.80}, boreal:{k:0.50,lai:4.00},
  /* a sparse swamp stand: open water and walkable hummocks break the crown
     cover */
  swamp:{k:0.62,lai:3.10},
  /* a date grove and a scatter of umbrella acacias: almost all light reaches
     the ground, so a desert shadow is a hard edge */
  desert:{k:0.50,lai:0.35},

  crown:{k:0.70,lai:3.00} };
const transmit=c=>Math.exp(-c.k*c.lai);

/* SOURCE: Dickinson 1983; Sellers 1985. The similarity transform
   exp(-k*LAI*sqrt(1-omega)) supplies per-channel canopy transmission. */
const diffuseT=(c,name)=>omega(name).map(w=>Math.exp(-c.k*c.lai*Math.sqrt(1-w)));

/* WHY: an isolated crown covers only CROWN_SKY of the cosine-weighted hemisphere;
   mix filtered and open sky instead of applying stand transmittance globally. */
const CROWN_SKY=0.50;
const underCrown=(name='foliage')=>
  diffuseT(CANOPY.crown,name).map(T=>(1-CROWN_SKY)+CROWN_SKY*T);

const crownVF=(c,name='foliage')=>{ const vf=1-Math.exp(-c.k*c.lai), w=omega(name);
  return sunlitFraction(c)*vf/(1-w[1]*vf); };

const sunlitFraction=c=>(1-Math.exp(-c.k*c.lai))/(c.k*c.lai);

function leafLift(c,sun,name,cover){
  const inter=1-Math.exp(-c.k*c.lai/sun.ground);
  return LEAF_T[name].map(t=>cover*inter*t);
}

/* SOURCE: Naka & Rushton, Journal of Physiology 185:536-555 (1966).
   Apply response to luminance once; per-channel response would double-count adaptation. */
const NR_N=0.85;
function nakaRushton(I,sigma){
  const a=Math.pow(Math.max(0,I),NR_N), s=Math.pow(sigma,NR_N);
  return a/(a+s);
}

function adaptation(cover,sun){
  const E=(sun||SUN.boreal).eFull;
  let sum=0,w=0;
  for(const k in cover){ const a=ALBEDO[k], f=cover[k];
    for(let i=0;i<3;i++){ sum+=f*a[i]*E[i]; w+=f; } }
  return sum/w;
}

const WHITE_ALBEDO=0.90, WHITE_L=0.95;
const exposureFor=(sigma,sun)=>{ const E=(sun||SUN.boreal).eFull;
  return WHITE_L/nakaRushton(WHITE_ALBEDO*(E[0]+E[1]+E[2])/3,sigma); };

/* WHY: first-bounce environment light is albedo*E_FULL*BOUNCE_VF.
   BOUNCE_VF=0.50 is a named enclosure approximation, not a measured constant. */
const BOUNCE_VF=0.50;
/* 0.50, not 0.35 (open ground under open sky): at blade height a sward is
   radiatively enclosed. Most of the lower hemisphere and part of the upper is
   other grass, so its shadows are green and open. */

/* INVARIANT: physics selects radiance endpoints; ladder places equal Oklab-L rungs.
   test/biome.test.mjs asserts spacing and oklabToBytes preserves L over gamut. */
function makeRamp(name,rungs,opt){
  const [R0,R1]=rampEnds(name,opt);
  return ladder(R0,R1,rungs,(opt||{}).sigma,(opt||{}).sun);
}

/* The two radiance ends, apart from the ladder. The water's ends are not
   albedo times irradiance, and vegStates reads ends without rungs. */
function rampEnds(name,opt){
  const o=opt||{}, alb=ALBEDO[name];
  const sun=o.sun||SUN.boreal;
  const E_SUN=sun.eSun, E_SKY=sun.eSky, E_FULL=sun.eFull;

  const sh=o.shade===undefined?1:o.shade;
  const t=Array.isArray(sh)?sh:[sh,sh,sh];

  const env=o.envW?omega(o.env||'foliage'):ALBEDO[o.env||'sward'];
  const vf0=o.vf0===undefined?BOUNCE_VF:o.vf0;
  const bounce=E_FULL.map((e,i)=>env[i]*e*vf0);
  const bounce1=E_FULL.map((e,i)=>env[i]*e*BOUNCE_VF*0.5);
  /* The two ends as linear radiance: albedo times the irradiance that reaches
     it. WHY: lift is residual beam at a surface's realistic dark end,
     optionally per channel. Placement physics, not a brightness control. */
  const lf=o.lift===undefined?0:o.lift;
  const lift=Array.isArray(lf)?lf:[lf,lf,lf];
  const R0=alb.map((a,i)=>a*(E_SKY[i]*t[i]+bounce[i]+E_SUN[i]*lift[i]));

  const tilt=o.tilt===undefined?1:o.tilt;
  const sheen=o.sheen===undefined?0:o.sheen;
  const R1=alb.map((a,i)=>a*(E_FULL[i]*tilt+bounce1[i])+E_SUN[i]*sheen);
  return [R0,R1];
}

function ladder(R0,R1,rungs,sigma,sun){
  const exp=exposureFor(sigma,sun);
  const lum=v=>0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
  const L0=clamp(nakaRushton(lum(R0),sigma)*exp,0,1);
  const L1=clamp(nakaRushton(lum(R1),sigma)*exp,0,1);
  const O0=linToOklab(...R0), O1=linToOklab(...R1);
  const k0=O0[0]>1e-6?L0/O0[0]:0, k1=O1[0]>1e-6?L1/O1[0]:0;
  /* The hue path. The endpoints' a and b come from the two illuminants acting
     on one albedo: cool at the dark end (Rayleigh sky plus neighbour bounce),
     warm at the light end (the beam). */
  const A=[0,O0[1]*k0,O0[2]*k0], B=[0,O1[1]*k1,O1[2]*k1];
  const out=[];
  for(let i=0;i<rungs;i++){
    const u=rungs>1?i/(rungs-1):1;
    /* Evenly spaced in L, not in radiance. Chroma rides the same u, so a
       sunlit rung is more saturated than a shadowed one. */
    out.push(oklabToBytes(clamp(lerp(L0,L1,u),0,1),lerp(A[1],B[1],u),lerp(A[2],B[2],u)));
  }
  return out;
}

/* SOURCE: Pope & Fry 1997 pure-water absorption; Smith & Baker 1981 corroboration.
   PROJECTION.md k=1/2 fixes view incidence, refraction path and Fresnel reflection. */
const A_WATER=[0.350,0.060,0.015];        // m^-1, Pope & Fry 1997
const N_WATER=1.333;
const VIEW_ELEV=Math.asin(0.5);           // PROJECTION.md, k = 1/2
const THETA_I=Math.PI/2-VIEW_ELEV;        // incidence on a horizontal surface
const THETA_T=Math.asin(Math.sin(THETA_I)/N_WATER);
const WATER_PATH=2/Math.cos(THETA_T);     // metres of water per metre of depth
const FRESNEL=(()=>{
  const ci=Math.cos(THETA_I), ct=Math.cos(THETA_T);
  const rs=(ci-N_WATER*ct)/(ci+N_WATER*ct);
  const rp=(N_WATER*ci-ct)/(N_WATER*ci+ct);
  return (rs*rs+rp*rp)/2;
})();

/* The meadow lake is a kettle. Ground distance from the shore becomes depth
   under a margin standing at an angle, onto a flat floor at POND_MAX_M
   (authored within the 1.5-2.5 m range of an informal pond this size).

   Neumann's volume development D_V = 3*z_mean/z_max is 1.0 for a cone, and
   most lakes sit above it, flat-floored (Hutchinson 1957; Neumann 1959;
   docs/CANON.md). A cone at the 30° repose of loose saturated sand measures
   1.16-1.27 and draws the whole four-rung ramp across 43 px. The kettle
   measures near 2.

   The margin is a pixel budget and the angle derives from it. The medium
   wins, named: 18 ground px is 1.18 m of run for 2.0 m of fall, so the margin
   stands near 60°, above frictional repose and above the 42° of Pond Court's
   managed earthwork. Colour saturates at 0.80 of the floor depth, so the
   visible transition is about 14 px in x and 7 rows in y. */
const POND_MAX_M=2.00;
const POND_MARGIN_PX=18;
const BANK_KETTLE=Math.atan(POND_MAX_M/(POND_MARGIN_PX*M_PER_PX));
const pondDepth=(dGroundPx,repose)=>
  reposeDepth(dGroundPx,POND_MAX_M,repose===undefined?BANK_KETTLE:repose);

/* SOURCE: Angstrom 1925; wet/dry sand reflectance ratios 0.4-0.6.
   WET=0.50 also prevents pond and dry-loam ramp collision. */
const WET=0.50;

/* SOURCE: absorption-only bottom return plus Fresnel sky. Volume scattering
   (Maritorena et al. 1994) is deliberately omitted without a measured backscatter coefficient. */
function pondRadiance(depthM,sun){
  const bed=ALBEDO.loam.map(v=>v*WET), E=sun.eFull;
  return bed.map((a,i)=>(1-FRESNEL)*E[i]*a*Math.exp(-A_WATER[i]*WATER_PATH*depthM)
                        +FRESNEL*sun.eSky[i]);
}

/* INVARIANT: posterise supplies four levels. Canopy and grass are two
   independent four-rung ramps from foliage vs sward endpoints. They clear
   each other rather than sharing rungs, so plant/moss deposits cannot snap
   onto the meadow floor. test/biome.test.mjs checks clearance and spacing. */
/* Meadow ground cover, as fractions. Authored: see adaptation(). */

const MEADOW_COVER={sward:0.72,foliage:0.22,loam:0.06};
const SIGMA_MEADOW=adaptation(MEADOW_COVER,SUN.meadow);

/* half a crown's leaf area: what stands between a mid-crown leaf and the sky */
const HALF_CROWN={k:CANOPY.crown.k,lai:CANOPY.crown.lai*0.5};

/* WHY: the two surfaces keep separate optical placements even though they
   share leaf transmittance. Foliage is denser chlorophyll path; sward is the
   sunlit floor. Sharing a ladder made plant deposits identical to ground.
   Canopy lit-end tilt 0.72 / sheen 0 keeps the leaf below mid-sward. */
function vegStates(sun,s){
  const leaf=rampEnds('foliage',{sun,sigma:s,
    env:'foliage',envW:true, vf0:crownVF(HALF_CROWN),
    shade:diffuseT(HALF_CROWN,'foliage'),
    lift:leafLift(HALF_CROWN,sun,'foliage',1), tilt:0.72, sheen:0});
  const turf=rampEnds('sward',{sun,sigma:s, shade:underCrown(),
    env:'sward', envW:true,
    lift:leafLift(CANOPY.crown,sun,'sward',CROWN_SKY),
    tilt:1/sun.ground, sheen:0.055});
  return {crown:leaf[0], leaf:leaf[1], shade:turf[0], blade:turf[1]};
}
/* The five-rung span. The live meadow slices no window from it. */
const VEG_RUNGS=5;
function vegLadder(sun,s){ const v=vegStates(sun,s);
  return ladder(v.crown,v.blade,VEG_RUNGS,s,sun); }

function meadowRamps(){
  const s=SIGMA_MEADOW, sun=SUN.meadow;
  const stone=makeRamp('sandstone',5,{sun,sigma:s,lift:0.08,env:'sward',envW:true});
  return {
    /* Crown leaf: denser path, exclusive of the floor. tilt < 1 keeps the lit
       end below mid-sward. At tilt 1 the two greens collide at dE_ok 0.040. */
    canopy:makeRamp('foliage',4,{sun,sigma:s,
      env:'foliage',envW:true, vf0:crownVF(HALF_CROWN),
      shade:diffuseT(HALF_CROWN,'foliage'),
      lift:leafLift(HALF_CROWN,sun,'foliage',1), tilt:0.72, sheen:0}),
    /* meadow floor: brighter sward, exclusive of foliage deposits */
    grass :makeRamp('sward',4,{sun,sigma:s, shade:underCrown(),
      env:'sward', envW:true,
      lift:leafLift(CANOPY.crown,sun,'sward',CROWN_SKY),
      tilt:1/sun.ground, sheen:0.055}),
    loam:makeRamp('loam',3,{sun,sigma:s,lift:0.44,env:'sward',envW:true}),
    masonry:stone,
    /* a flower head is the highest thing on its own plant */
    bloom:makeRamp('bloom',3,{sun,sigma:s,lift:0.26,env:'sward',envW:true}),

    pond :ladder(pondRadiance(POND_MAX_M,sun),pondRadiance(0,sun),4,s,sun),
  };
}

/* SOURCE: coloured dissolved organic matter absorbs short wavelengths most
   strongly. These are representative freshwater coefficients, not a claim for
   one measured site; pure-water A_WATER remains independently visible. */
const A_CDOM=[0.060,0.260,0.920];
const SWAMP_MAX_M=1.80;
const SWAMP_COVER={swampFoliage:0.28,duckweed:0.08,swampGround:0.52,swampWood:0.12};
const SIGMA_SWAMP=adaptation(SWAMP_COVER,SUN.swamp);
function swampRadiance(depthM,sun=SUN.swamp,doc=0.08){
  const bed=ALBEDO.swampBed.map(v=>v*0.75), E=sun.eFull;
  return bed.map((a,i)=>{
    const tr=Math.exp(-(A_WATER[i]+A_CDOM[i]*doc)*WATER_PATH*depthM);
    return (1-FRESNEL)*E[i]*a*tr+FRESNEL*sun.eSky[i];
  });
}
/* One optical ladder and the index that reads it. SWAMP_SHOAL is the shallow
   end the bright rung stands for; the bake's floor depth sits under it.

   The two material windows are slices of the one ladder. The slice offsets
   live here because the bake converts a depth to a rung index of the same
   ladder: a second copy of the offset grows a seam at the wade line. */
const SWAMP_SHOAL=0.03;
const SWAMP_LADDER=5;         // rungs in the ladder the physics places
const SWAMP_WINDOW_RUNGS=4;   // rungs each material window spends of it
const SWAMP_WINDOW={swampWater:0,swampShallow:1};

function swampRamps(){
  const sun=SUN.swamp,s=SIGMA_SWAMP;
  const water=ladder(swampRadiance(SWAMP_MAX_M,sun),swampRadiance(SWAMP_SHOAL,sun),
                     SWAMP_LADDER,s,sun);
  const window=(name)=>water.slice(SWAMP_WINDOW[name],
                                   SWAMP_WINDOW[name]+SWAMP_WINDOW_RUNGS);
  return {
    swampCanopy:makeRamp('swampFoliage',4,{sun,sigma:s,
      shade:diffuseT(CANOPY.swamp,'swampFoliage'),
      lift:leafLift(CANOPY.swamp,sun,'swampFoliage',0.58),
      env:'swampFoliage',envW:true,vf0:crownVF(CANOPY.swamp,'swampFoliage'),sheen:0.012}),
    swampGround:makeRamp('swampGround',4,{sun,sigma:s,
      shade:diffuseT(CANOPY.swamp,'swampFoliage'),
      lift:0.24,env:'swampGround'}),
    peat:makeRamp('peat',4,{sun,sigma:s,shade:diffuseT(CANOPY.swamp,'swampFoliage'),
      lift:0.03,env:'swampFoliage',envW:true}),
    /* One optical ladder, two material windows. Their exact overlap prevents
       the nearest-palette snap from inventing a seam at the depth boundary. */
    swampWater:window('swampWater'),
    swampShallow:window('swampShallow'),
    duckweed:makeRamp('duckweed',4,{sun,sigma:s,
      shade:diffuseT(CANOPY.swamp,'duckweed'),
      lift:leafLift(CANOPY.swamp,sun,'duckweed',0.58),
      env:'swampFoliage',envW:true,sheen:0.018}),
    swampWood:makeRamp('swampWood',4,{sun,sigma:s,
      shade:diffuseT(CANOPY.swamp,'swampFoliage'),lift:0.08,env:'swampFoliage',envW:true}),
    swampAccent:makeRamp('swampAccent',3,{sun,sigma:s,
      shade:underCrown('swampFoliage'),lift:0.24,env:'swampFoliage',envW:true}),
  };
}

/* Desert. The eye adapts to sand: an erg is one surface with a little
   pavement and a little salt in it. */
const DESERT_COVER={duneSand:0.86,desertPavement:0.10,saltCrust:0.04};
const SIGMA_DESERT=adaptation(DESERT_COVER,SUN.desert);

/* A dune field is radiatively enclosed, more than the meadow: most of the
   hemisphere is other sand at twice a sward's albedo, so a slip face turned
   from the sun fills with warm bounce. A named approximation: 0.62 against
   the enclosure default of 0.50. */
const DESERT_VF=0.62;

function desertRamps(){
  const sun=SUN.desert,s=SIGMA_DESERT;
  return {
    /* Four rungs by the medium: this is the largest surface in the frame and
       `uSteps` is 3, so four is the whole posterise ladder. */
    sand:makeRamp('duneSand',4,{sun,sigma:s,vf0:DESERT_VF,env:'duneSand',
      /* faceted quartz catches the beam off-normal at a ripple crest. Small:
         at 15 px per metre a glint is a rung. */
      sheen:0.030,lift:0.040}),
    /* The salt crust reads by value, brighter than sand: three rungs and a
       high dark end. */
    sabkha:makeRamp('saltCrust',3,{sun,sigma:s,vf0:DESERT_VF,env:'duneSand',
      lift:0.060,sheen:0.014}),
    /* Varnished gravel, the darkest ground in the world. It clears sand by
       value alone: at this scale a gravel texture is one pixel. */
    hamada:makeRamp('desertPavement',3,{sun,sigma:s,vf0:DESERT_VF,env:'duneSand',
      lift:0.030}),
    /* Foliage under a near-vertical sun over sand: bounce off the brightest
       ground in the world lifts the shade end warm. */
    desertCanopy:makeRamp('desertFoliage',4,{sun,sigma:s,
      shade:diffuseT(CANOPY.desert,'desertFoliage'),
      lift:leafLift(CANOPY.desert,sun,'desertFoliage',0.30),
      env:'duneSand',vf0:DESERT_VF,sheen:0.010}),
  };
}

/* ── THE HOLLOW: a world with no sun ───────────────────────────────────────
   Light is emitted, so an illuminant is a spectrum and its colour is a
   measurement. SOURCE: Wyman, Sloan & Shirley, JCGT 2(2), 2013, piecewise
   Gaussian fits to the CIE 1931 colour-matching functions; IEC 61966-2-1 for
   XYZ to linear sRGB. A band outside the sRGB gamut clamps at zero. */
const lobe=(l,mu,s1,s2)=>{ const t=(l-mu)/(l<mu?s1:s2); return Math.exp(-0.5*t*t); };
const CMF=l=>[
  1.056*lobe(l,599.8,37.9,31.0)+0.362*lobe(l,442.0,16.0,26.7)-0.065*lobe(l,501.1,20.4,26.2),
  0.821*lobe(l,568.8,46.9,40.5)+0.286*lobe(l,530.9,16.3,31.1),
  1.217*lobe(l,437.0,11.8,36.0)+0.681*lobe(l,459.0,26.0,13.8)];
function spectrumRGB(S){
  let X=0,Y=0,Z=0;
  for(let l=380;l<=780;l+=5){ const c=CMF(l),e=S(l); X+=e*c[0]; Y+=e*c[1]; Z+=e*c[2]; }
  return norm3([ 3.2406*X-1.5372*Y-0.4986*Z,
                -0.9689*X+1.8758*Y+0.0415*Z,
                 0.0557*X-0.2040*Y+1.0570*Z].map(v=>Math.max(v,0)));
}
const band=(peak,fwhm)=>l=>lobe(l,peak,fwhm/2.355,fwhm/2.355);
/* Emission bands, nm (docs/HOLLOW.md carries the citations).
   glowworm: Arachnocampa luminosa, the ceiling. fungus: the fungal luciferin
   system shared by every luminous agaric. */
const EMISSION={
  glowworm:{peak:487,fwhm:85},
  fungus  :{peak:530,fwhm:95},
  /* INVENTED LAW, the one this world carries: its crystals are phosphors. They
     store the ceiling's light and release it in the 425 nm band a fluorite
     Eu2+ centre fluoresces in. Boundary: real minerals glow only under UV or
     for seconds after it. The body colour stays real: amethyst's iron colour
     centre absorbs near 545 nm. `white` is the share of stored broadband
     light the body scatters, authored. */
  crystal :{peak:425,fwhm:70,body:{peak:545,fwhm:120,depth:0.85},white:0.30},
  /* The same law in calcite. SOURCE: cave calcite glows from the fulvic and
     humic acids it traps, 410-460 nm (van Beynen, Bourbonniere & Ford 2001),
     and the afterglow sits redward of the fluorescence (Shopov 2004).
     AUTHORED inside that: 450 nm, broad, over a share of white, which draws
     as a silver blue. MEASURED: at 470 nm its span lands 0.041 dE_ok from wet
     calcite's own ramp and 0.025 from a cap's crown; 450 nm clears both. */
  calcite :{peak:450,fwhm:120,white:0.45},
};
const emissionRGB=name=>{
  const e=EMISSION[name],b=band(e.peak,e.fwhm);
  const absorb=e.body?band(e.body.peak,e.body.fwhm):null;
  return spectrumRGB(l=>(b(l)+(e.white||0))*(absorb?1-e.body.depth*absorb(l):1));
};
/* Photometric: a lamp colour carries unit luminance, so NEAR compares what
   the eye is given. */
const lumOf=v=>0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
const unitLum=v=>{ const y=lumOf(v); return v.map(c=>c/y); };
/* What a dim reflecting surface looks like. SOURCE: the Purkinje shift (CIE
   1951 scotopic V', peak 507 nm): rods carry a dim scene and carry no hue.
   Jensen et al., "A Night Rendering", 2000: the rod signal is drawn toward
   the bluish white at chromaticity (0.25, 0.25). `cone` is the share of the
   lamp's own hue that survives. AUTHORED inside the mesopic range: less on
   the resting floor, more in a pool of light, where cones wake. A luminous
   body is bright enough for cones and skips this. */
const CONE={rest:0.30,lit:0.62};
const NIGHT=unitLum([0.706,0.990,1.966]);   // xy (0.25,0.25) in linear sRGB
const mesopic=(E,cone)=>{ const y=lumOf(E);
  return E.map((c,i)=>cone*c+(1-cone)*y*NIGHT[i]); };
/* NEAR is the luminance an emitter adds at its own foot, in units of the
   ceiling's. AUTHORED: no radiometry of a luminous cap at 15 px per metre
   exists. */
const NEAR=4.0;
const CEILING=unitLum(emissionRGB('glowworm'));
/* A lamp is shaped like a sun so every ramp builder takes it: `eSky` is the
   ceiling's diffuse glow, `eSun` the local emitter, and eFull has unit
   luminance. `emit` is the emitter's own colour, for a body seen directly. */
function lampOf(name){
  const emit=unitLum(emissionRGB(name));
  const eSky=mesopic(CEILING,CONE.rest).map(v=>v/(1+NEAR));
  const eSun=mesopic(emit,CONE.lit).map(v=>v*NEAR/(1+NEAR));
  return {lamp:name,ground:1,emit,eSky,eSun,eFull:eSun.map((v,i)=>v+eSky[i])};
}
const LAMP={fungus:lampOf('fungus'),crystal:lampOf('crystal'),calcite:lampOf('calcite')};
/* `dir` is where the ceiling's light comes from on screen: straight
   up-screen, and under 90 degrees so a column keeps a lit top. Authored; the
   frame and the line-up both read it. */
SUN.hollow={...LAMP.fungus,dir:Object.freeze({az:270,el:66})};
/* SOURCE: limestone reflects 0.35-0.55 dry (informal engineering tables) and
   wet sand half of dry (Lekner & Dorf, Appl. Opt. 27, 1988; WET above). A cave
   floor is wet clay over it. Calcite flowstone is paler and cleaner, and wet. */
ALBEDO.caveRock=[0.200,0.185,0.170];
ALBEDO.calcite =[0.560,0.540,0.500];
/* The eye adapts to the pools of light it looks at: the cover is weighed
   under the full lamp. */
const SIGMA_HOLLOW=adaptation({caveRock:0.84,calcite:0.16},LAMP.fungus);
/* A gour is a rimstone pool over a sump: clear karst water on a calcite bed.
   Pure-water absorption only: the water left its organics in the soil above.
   Green dies faster than blue (A_WATER), so the deep end is the bluer one.
   Depth is authored: flooded shafts run to tens of metres. The margin is a
   pixel budget under PAD, as POND_MARGIN_PX is. Lit by the ceiling alone: no
   cap stands in water. */
const GOUR_MAX_M=9.0;
const GOUR_MARGIN_PX=46;
const GOUR_BANK=Math.atan(GOUR_MAX_M/(GOUR_MARGIN_PX*M_PER_PX));
/* What a pool's bed is lit by, in units of the ceiling: its own share of the
   lamps around it. Authored. */
const GOUR_LIT=2.4;
function gourRadiance(depthM,lamp=LAMP.fungus){
  return ALBEDO.calcite.map((a,i)=>
    (1-FRESNEL)*lamp.eSky[i]*GOUR_LIT*a*WET*Math.exp(-A_WATER[i]*WATER_PATH*depthM)
    +FRESNEL*lamp.eSky[i]);
}
/* The pondT invariant for the gour ladder. */
function gourT(dGroundPx){
  const S=LAMP.fungus, sig=SIGMA_HOLLOW, exp=exposureFor(sig,S);
  const L=d=>clamp(nakaRushton(lumOf(gourRadiance(d,S)),sig)*exp,0,1);
  const L0=L(GOUR_MAX_M), L1=L(0);
  return clamp((L(reposeDepth(dGroundPx,GOUR_MAX_M,GOUR_BANK))-L0)/Math.max(1e-6,L1-L0),0,1);
}
/* Radiance of a luminous body, in units of the adapted white: its dim flesh
   and its brightest face. AUTHORED: the two ends of what the eye is given. */
const LUMEN={glowcap:[0.050,1.10],amethyst:[0.050,1.10],moonstone:[0.030,0.70]};
/* A cap's pale flesh also returns the ceiling's light: the share of CEILING in
   what a cap sends out. Authored. */
const FLESH=0.30;
function hollowRamps(){
  const s=SIGMA_HOLLOW, X=LAMP.fungus;   // one exposure for every ramp
  /* A reflecting surface has three states, so its ramp has three anchors:
     under a body, at rest under the ceiling, and at the foot of a lamp. The
     first two rungs are the ceiling's and the last two the lamp's. The two
     floors are one albedo, so they share rungs 0 and 1 exactly, and a pool of
     crystal light meets fungal light with no seam at rest. */
  const lit=(alb,lamp)=>{
    const A=ALBEDO[alb];
    const rest=A.map((a,i)=>a*lamp.eSky[i]), full=A.map((a,i)=>a*lamp.eFull[i]);
    /* The shadow rung sits one of the ladder's own perceptual steps below
       rest, so the four rungs are even in dE_ok. Solved for the share of the
       ceiling a body hides. */
    const up=ladder(rest,full,3,s,X);
    const want=(dEok(up[0],up[1])+dEok(up[1],up[2]))/2;
    const under=m=>ladder(rest.map(v=>v*m),rest,2,s,X)[0];
    let lo=0, hi=1;
    for(let i=0;i<40;i++){ const m=(lo+hi)/2; if(dEok(under(m),up[0])>want) lo=m; else hi=m; }
    return [under(hi),...up];
  };
  const glow=(name,emit)=>ladder(emit.map(v=>v*LUMEN[name][0]),
                                 emit.map(v=>v*LUMEN[name][1]),4,s,X);
  const cap=unitLum(LAMP.fungus.emit.map((v,i)=>v*(1-FLESH)+CEILING[i]*FLESH));
  return {
    caveRock :lit('caveRock',LAMP.fungus),
    geodeRock:lit('caveRock',LAMP.crystal),
    /* and under a foxstone's pale light */
    moonRock :lit('caveRock',LAMP.calcite),
    /* Calcite: stalagmite, rimstone, the stipe of a cap. Its lit end is the
       fungal lamp's, the commoner neighbour. */
    dripstone:lit('calcite',LAMP.fungus),
    /* the same calcite under crystal light: a wall beside a geode */
    geodeStone:lit('calcite',LAMP.crystal),
    gourWater:ladder(gourRadiance(GOUR_MAX_M),gourRadiance(0),4,s,X),
    glowcap  :glow('glowcap',cap),
    amethyst :glow('amethyst',LAMP.crystal.emit),
    moonstone:glow('moonstone',LAMP.calcite.emit),
  };
}

/* SIGMA_BOREAL is the boreal adaptation figure. The boreal ramps are
   authored. Snow dominates the visible hemisphere in winter. */
const BOREAL_COVER={snow:0.68,foliage:0.24,peat:0.08};
ALBEDO.snow=[0.780,0.800,0.820];   // dry cold snow, slightly blue-biased
const SIGMA_BOREAL=adaptation(BOREAL_COVER,SUN.boreal);

/* INVARIANT: pondT uses the same response/exposure as the ramp, mapping deepest
   water to 0 and shore to 1; absorption coefficients prevent inversion.
   `dGroundPx` is a ground distance from the shore: a screen-row count converted
   with PX_PER_M halves the near and far bank angles. PROJECTION.md. */
function pondT(dGroundPx,sun,repose){
  const S=sun||SUN.meadow, sig=SIGMA_MEADOW, exp=exposureFor(sig,S);
  const lum=v=>0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
  const L=d=>clamp(nakaRushton(lum(pondRadiance(d,S)),sig)*exp,0,1);
  const L0=L(POND_MAX_M), L1=L(0);
  return clamp((L(pondDepth(dGroundPx,repose))-L0)/Math.max(1e-6,L1-L0),0,1);
}

/* The pondT invariant for the swamp's ladder: one response, one exposure,
   deepest water at the ladder's dark end, the shoal at its bright one.

   Measured failure: straight-line fits (`0.84 - depth*1.1` in the shallows,
   `0.62 - depth*0.24` below) put one rung boundary at 0.006 m and the next at
   0.500 m, then clamp. Every depth past half a metre lands on one rung, the
   two darkest of five never draw, and both boundaries stack inside the 3 px
   of the solution wall.

   Derived, the boundaries fall at 0.23, 0.64, 1.09 and 1.56 m: one on the
   shallow shelf, three down the wall and across the floor. */
function swampT(depthM,ramp,sun){
  const S=sun||SUN.swamp, sig=SIGMA_SWAMP, exp=exposureFor(sig,S);
  const lum=v=>0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
  const L=d=>clamp(nakaRushton(lum(swampRadiance(d,S)),sig)*exp,0,1);
  const L0=L(SWAMP_MAX_M), L1=L(SWAMP_SHOAL);
  const u=clamp((L(depthM)-L0)/Math.max(1e-6,L1-L0),0,1);
  const rung=u*(SWAMP_LADDER-1)-SWAMP_WINDOW[ramp];
  return clamp(rung/(SWAMP_WINDOW_RUNGS-1),0,1);
}

export { A_CDOM, A_WATER, ALBEDO, AIRMASS, BANK_KETTLE, BEAM, BOUNCE_VF, CANOPY,
         DECL, DIFFUSE,
         E_FULL, E_SKY, E_SUN, FRESNEL, LEAF_T, MEADOW_COVER, NR_N, N_WATER,
         DESERT_COVER, DESERT_VF, SIGMA_DESERT, desertRamps,
         emissionRGB, gourT, hollowRamps,
         POND_MARGIN_PX, POND_MAX_M, PX_PER_M, SUN, SWAMP_COVER, SWAMP_LADDER,
         SWAMP_MAX_M, SWAMP_SHOAL, SWAMP_WINDOW, SWAMP_WINDOW_RUNGS,
         WATER_PATH,
         SIGMA_BOREAL,
         WHITE_ALBEDO, WHITE_L, exposureFor, SIGMA_MEADOW, SIGMA_SWAMP,
         SKY, SUN_ALT, TAU, adaptation, bytesToOklab,
         chromaOf, dEok, diffuseFraction, diffuseT, ladder, linToOklab, makeRamp,
         meadowRamps, nakaRushton, oklabToBytes, omega, pondDepth, pondRadiance,
         pondT, rampEnds, solarPosition, solarPositionForClock, sunAt, sunlitFraction, transmit,
         swampRadiance, swampRamps, swampT, vegLadder, vegStates,
         VEG_RUNGS };
