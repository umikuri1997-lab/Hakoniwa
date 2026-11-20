import { WCA, WSA } from '../constants.js';
import { clamp, smoothstep } from '../math.js';
import { fbm, hashf } from '../rng.js';
import { PX_PER_M } from '../scale.js';
import { SURF, SURFACE } from '../surface.js';

function makeDunes(w){
  const {
    COMMON, PLAN, POI, nB, nDE, pathX, reliefAt, seed,
  }=w;
  /* ── THE OASIS ─────────────────────────────────────────────────────────────
     One pool, in the lowest pavement: the interdune floor is deflated to the
     water table, so the scour limit bounds it.
     Anisotropy 0.50 is the projection (PROJECTION.md, k = 1/2). */
  const OASIS_RX=Math.round(15*PX_PER_M);   // 15 m of open water, a small pool
  const OASIS_AMP=0.62;
  /* Outer limit of capillary rise, where the evaporite crust forms. */
  const SABKHA_PX=Math.round(4*PX_PER_M);
  /* Fresh margin inside it, flushed by the pool, held by reeds. Wide enough to
     read as a band. */
  const OASIS_FRINGE=Math.round(1.2*PX_PER_M);
  const OASIS=PLAN.water==='oasis'?(()=>{
    /* Off the road, past the common. */
    const y=COMMON.y+Math.round(1.4*OASIS_RX);
    return {kind:'bay',x:Math.round(pathX(y)+4.4*OASIS_RX),y,r:Math.round(OASIS_RX*3.2)};
  })():null;
  if(OASIS) POI.push(OASIS);

  /* ── THE DUNE FIELD ────────────────────────────────────────────────────────
     Transverse dune: gentle windward face, lee face at repose. Authority:
     Bagnold, The Physics of Blown Sand and Desert Dunes (1941). The slip angle
     is SURFACE[SURF.sand].repose (dry medium sand).

     Concession, uniform: real spacing is 100-300 m and the viewport covers
     about 63 m, so the field is drawn at DUNE_DRAW in x, y and z. One factor
     keeps every angle; only absolute size is conceded, as trees concede it at
     0.16-0.20x life.

     Wavelength and two slopes determine the profile: the crest sits where the
     faces meet, so the amplitude is derived. */
  const DUNE_REAL_WAVE_M=160;       // simple transverse dune spacing, low end
  /* The factor is measured against the 480 px viewport. At 1/4 a dune is
     612 px and a screen holds three quarters of one windward face, which reads
     as a vignette. At 1/8 it is 306 px: a crest, a slip face and the next
     crest. Medium law, beside trees at 0.16-0.20x life in docs/CANON.md. */
  const DUNE_DRAW=0.125;            // the concession above, applied to all axes
  const DUNE_STOSS=12*Math.PI/180;  // windward slope, planed by the flow
  const DUNE_REPOSE=SURFACE[SURF.sand].repose*Math.PI/180;
  const DUNE_WAVE_PX=DUNE_REAL_WAVE_M*DUNE_DRAW*PX_PER_M;
  /* Crest position in the cycle: both faces reach the same height at the
     brink, so tan(stoss)*a = tan(repose)*(1-a). */
  const DUNE_BRINK=Math.tan(DUNE_REPOSE)
                  /(Math.tan(DUNE_REPOSE)+Math.tan(DUNE_STOSS));
  const DUNE_AMP_PX=Math.tan(DUNE_STOSS)*DUNE_BRINK*DUNE_WAVE_PX;
  /* Measured: the ground bake takes elevAt on an 8 px lattice, central-
     differences it by es (not 2*es), bilinear-samples, doubles and multiplies
     by 7.5. The composite factor from an elevAt gradient to the encoded normal
     is 30, so the normal saturates at a gradient of 1/30. test/desert.test.mjs
     re-measures the chain. */
  const NORMAL_SAT=30;
  /* The repose face sits exactly at normal saturation. Nothing is steeper
     than repose, so nothing clips. */
  const DUNE_FIELD=1/(NORMAL_SAT*Math.tan(DUNE_REPOSE));

  /* Sand cover is a threshold with a stated taper; a dune that exists is full
     height. A linear remap of thickness never reaches 1: every dune stands at
     a quarter of its derived height and the normal peaks at 0.18 of the repose
     face. Below the floor the train dies out to wind-swept pavement, where the
     corridors, the road and the settlement sit. */
  const DUNE_FLOOR=0.36;   // thickness below which the train dies out
  const DUNE_ROAD_PX=Math.round(14*PX_PER_M);  // half-width of the swept corridor
  /* The sheet edge is ground, so it obeys repose: from full dune to bare
     pavement the surface descends the whole amplitude. With no taper the
     corridor flank measures a gradient of 4.7 against a repose slope of 0.67.

     Cover truncates the dune (min) and does not scale it. Multiplied, a
     half-cover dune carries its own faces plus the cover gradient on one
     budget. min() cannot be steeper than either operand, so the taper is
     bounded by the cover term alone.

     Two terms taper the cover (the corridor, the sheet's thinning) and they
     multiply, so each gets half the repose slope. A smoothstep's steepest
     point is 1.5 times its average, so each runs 1.5 amplitudes over its
     half. */
  const DUNE_BUDGET=0.5*Math.tan(DUNE_REPOSE)/DUNE_AMP_PX;   // per-term |grad cover|
  /* Corridor distance is the horizontal offset, not pathDist. pathDist divides
     by the local slope of a curve evaluated at wy: 270 px out |grad pathDist|
     reaches 2.5, which puts a gradient of 1.67 on ground whose repose slope is
     0.67. The offset's gradient is sqrt(1 + (dx/dy)^2), and the trail caps
     |dx/dy| near 0.9, so it is bounded by 1.35. */
  const DUNE_PATH_GRAD=Math.sqrt(1+0.9*0.9);
  const DUNE_TAPER_PX=Math.ceil(1.5*DUNE_PATH_GRAD/DUNE_BUDGET);
  /* Measured: the steepest gradient of the thickness field is 7.49e-4 per
     pixel (base term 5.20e-4 plus the finger term in duneEnvelope), over a
     6000 px square at the canonical seed. The cover ramp widens by the same
     rule. */
  const DUNE_ENV_SLOPE=7.49e-4;
  const DUNE_RISE=clamp(1.5*DUNE_ENV_SLOPE/DUNE_BUDGET,0.10,0.90);
  /* ── WIND RIPPLES ──────────────────────────────────────────────────────────
     Crest spacing for this grain is about 8 cm, 1.2 px at 15.3 px per metre,
     which is noise. The drawn spacing is the legibility floor, as the meadow's
     culm micro-relief sits at 4-5 px.

     The shading is not exaggerated. The ripple index (spacing over height)
     measures 15 to 20, so the steepest face is about 10.5 degrees. Under a sun
     89 degrees above the horizon a 10.5 degree tilt costs 1.7% of the cosine
     and a 34 degree slip face 17%, so a ripple gets a tenth of the dune's
     shading. */
  const RIPPLE_INDEX=17;                        // measured spacing over height
  const RIPPLE_SLOPE=Math.PI/RIPPLE_INDEX;      // steepest face of that sinusoid
  const RIPPLE_WAVE_PX=4.6;                     // the legibility floor, exaggerated from 1.2
  const RIPPLE_K=2*Math.PI/RIPPLE_WAVE_PX;
  /* Ripple shading relative to the dune that saturates the normal. */
  const RIPPLE_N=(1-Math.cos(Math.atan(RIPPLE_SLOPE)))
                /(1-Math.cos(SURFACE[SURF.sand].repose*Math.PI/180));

  /* Crest sinuosity: two sine terms, in wavelengths of along-wind shift.
     Amplitudes are authored (a shape). The tilt correction in duneAt keeps the
     faces at their angles. Phases are seeded. */
  const DUNE_A1=0.30, DUNE_A2=0.09;
  const DUNE_W1=2*Math.PI/2600, DUNE_W2=2*Math.PI/900;
  const DUNE_PH1=hashf(0,0,seed^0xd0e1)*Math.PI*2;
  const DUNE_PH2=hashf(1,0,seed^0xd0e2)*Math.PI*2;
  const duneEnvelope=(wx,wy)=>{
    /* The thickness field's wavelength is about 2400 px, so its iso-line
       crosses a viewport as one slow curve. The finger term scallops the
       threshold at the train's wavelength. Its gradient is inside
       DUNE_ENV_SLOPE, so the margin stays within the repose budget. */
    const e=fbm(nDE,wx*0.00042+19,wy*0.00042+61,3)*0.5+0.5
           +fbm(nDE,wx*0.0032+5,wy*0.0032+43,2)*0.055;
    /* The road is a corridor of bare pavement: sand thins toward the route.
       Its width is in metres, set by what stands in it: a 6 m house, three to
       a hamlet with room between, so about 20 m of firm ground. A wavelength
       of exponential falloff makes the clearing over 1100 px, wider than the
       viewport. Multiplied, not subtracted, so the flank is exactly the
       derived taper. */
    const road=1-smoothstep(DUNE_ROAD_PX,DUNE_ROAD_PX+DUNE_TAPER_PX,
                            Math.abs(wx-pathX(wy)));
    /* The oasis clears the sand: the pool is a deflation hollow. Without this
       term the pool survives at one seed in three (test/desert.test.mjs
       measures three seeds). Depth is doubled in the distance because a screen
       row is two ground pixels: the clearing is a circle on the ground.

       The rim is lobed. Outward bays are free; the inward bite is scaled down
       so no sand tongue passes the crust's outer limit into the pan. */
    const ol=OASIS?fbm(nDE,wx*0.006+7,wy*0.006+29,2)*OASIS_RX*0.30:0;
    const oasis=OASIS
      ?1-smoothstep(OASIS_RX*1.30,OASIS_RX*1.30+DUNE_TAPER_PX,
                    Math.hypot(wx-OASIS.x,(wy-OASIS.y)*2)+(ol>0?ol*0.35:ol))
      :0;
    return smoothstep(DUNE_FLOOR,DUNE_FLOOR+DUNE_RISE,e)*(1-road)*(1-oasis);
  };
  /* h is height above the interdune floor in screen pixels. cover is the
     fraction of a full dune this point stands on. */
  const duneAt=(wx,wy)=>{
    /* Distance along the wind, in wavelengths, with a sinuous crest line. The
       wander depends on the across-wind coordinate only. A shift that also
       varies along the wind compresses the cycle: measured 0.728 against a
       repose slope of 0.675. */
    const along=(wx*WCA+wy*WSA)/DUNE_WAVE_PX;
    const across=(-wx*WSA+wy*WCA);
    /* Two sines, not an fbm: the tilt correction below needs the exact
       derivative. They also cost two sines against three octaves of noise on
       the ground pass's hot path. */
    const s1=Math.sin(across*DUNE_W1+DUNE_PH1), s2=Math.sin(across*DUNE_W2+DUNE_PH2);
    const wander=DUNE_A1*s1+DUNE_A2*s2;
    const u=along+wander;
    const p=u-Math.floor(u);
    /* d(wander)/d(across), in wavelengths per pixel. */
    const tilt=DUNE_A1*DUNE_W1*Math.cos(across*DUNE_W1+DUNE_PH1)
              +DUNE_A2*DUNE_W2*Math.cos(across*DUNE_W2+DUNE_PH2);
    /* An oblique crest is a lower dune. The profile spans the wavelength along
       the wind, but crest spacing is perpendicular to the crest and shorter by
       this factor. Uncorrected, the faces stand up to 10% past repose. */
    const k=1/Math.sqrt(1+tilt*tilt*DUNE_WAVE_PX*DUNE_WAVE_PX);
    const cover=duneEnvelope(wx,wy);
    if(cover<=0) return {h:0,cover:0,face:0,crest:0,lee:0};
    const profile=(p<DUNE_BRINK?p/DUNE_BRINK:(1-p)/(1-DUNE_BRINK))*k;
    const h=Math.min(profile,cover);
    return {h:h*DUNE_AMP_PX, cover,
            /* Signed face steepness in units of the repose slope: lee face -1,
               windward face the ratio of the two tangents, truncated crest
               0. */
            face:profile>cover?0
                :p<DUNE_BRINK?Math.tan(DUNE_STOSS)/Math.tan(DUNE_REPOSE):-1,
            /* Height as a fraction of a full dune, from the composed surface,
               so a sliced crest is not a peak. Grain sorting follows it. */
            crest:h,
            /* On the lee face: px along the wind from the visible top edge,
               which is the brink or the rim of a truncated crest. */
            lee:(Math.min(k,cover)-profile)/k*(1-DUNE_BRINK)*DUNE_WAVE_PX};
  };
  const elevAt=PLAN.dunes
    ? (wx,wy)=>reliefAt(wx,wy)+duneAt(wx,wy).h*DUNE_FIELD
    : reliefAt;

  const oasisAt=(wx,wy)=>{
    if(!OASIS) return 0;
    /* The shore wobble is a ground field, so the waterline is one continuous
       curve, as in the meadow basins. */
    const wob=fbm(nB,wx*0.011,wy*0.011,3)*0.10;
    const q=Math.hypot((wx-OASIS.x)/OASIS_RX,(wy-OASIS.y)/(OASIS_RX*0.5))+wob;
    if(q>=1) return 0;
    return OASIS_AMP*(0.5+0.5*Math.cos(Math.PI*clamp(q,0,1)));
  };

  return {
    OASIS, OASIS_RX, SABKHA_PX, OASIS_FRINGE, RIPPLE_K, RIPPLE_N,
    duneEnvelope, duneAt, elevAt, oasisAt,
    /* Derived numbers for siting, traversal and test/desert.test.mjs. */
    dune:{waveM:DUNE_REAL_WAVE_M,draw:DUNE_DRAW,wavePx:DUNE_WAVE_PX,
          stoss:DUNE_STOSS,repose:DUNE_REPOSE,brink:DUNE_BRINK,
          ampPx:DUNE_AMP_PX,field:DUNE_FIELD,normalSat:NORMAL_SAT,
          floor:DUNE_FLOOR,rise:DUNE_RISE,roadPx:DUNE_ROAD_PX,
          taperPx:DUNE_TAPER_PX,envSlope:DUNE_ENV_SLOPE,budget:DUNE_BUDGET,
          sabkhaPx:SABKHA_PX,fringePx:OASIS_FRINGE},
  };
}

export { makeDunes };
