import { GRAVITY_M_S2 } from './weather.js';

/* ═══════════════════════════════════════════════════════════════════════════
   MATTER. The measured laws a medium runs after an impulse (src/spell.js):
   what a fuel bed costs to light, how fast a grass fire runs, how tall its
   flame stands, which crown it reaches, and how a clump of snow falls.

   A surface names its bed in the `fuel` column of src/surface.js. A plant
   kind names its crown class in PLANT_FUEL. SI units: metres, seconds,
   kilograms, kJ, kW per metre of fire front. Moisture and curing are
   fractions.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Low heat of combustion of fine fuel: 8000 Btu/lb (Rothermel 1972, USDA
   INT-115). Latent heat of fusion of water. */
const HEAT_KJ_KG=18600;
const FUSION_KJ_KG=334;
/* Rothermel 1972: heat of pre-ignition, 250 + 1116 M Btu/lb. */
const preIgnitionKJkg=(moisture)=>581+2594*moisture;

/* Fuel beds. AUTHORED states of measured kinds.
   sward: natural pasture at 3 t/ha (Cheney, Gould & Catchpole 1998), dead
   fuel at 6% on a clear warm day, 70% cured: a green summer meadow.
   peat: sedge and moss in the capillary fringe (capillaryM in SURFACE),
   wetter than its own dry mass. */
const BED=Object.freeze({
  sward:Object.freeze({loadKgM2:0.30,moisture:0.06,curing:0.70}),
  peat:Object.freeze({loadKgM2:0.40,moisture:1.20,curing:0.20}),
});
/* AUTHORED: rain on a bed adds this much water to the fuel. */
const RAIN_WET=0.30;
/* The snow an impulse must melt before it reaches anything: the top 2 cm of
   a pack at 100 kg/m3. */
const SNOW_SKIN_KG_M2=0.02*100;

/* ── Cheney, Gould & Catchpole 1998, Int. J. Wildland Fire 8: head fire rate
   of spread in natural grass. Wind is the 10 m open wind in km/h, moisture
   and curing in percent, the rate in km/h. */
const cheneyWindKmh=(u)=>u<=5?0.054+0.269*u:1.4+0.838*Math.pow(u-5,0.844);
function cheneyMoisture(pct,uKmh){
  if(pct<12) return Math.exp(-0.108*pct);
  return Math.max(0,uKmh<10?0.684-0.0342*pct:0.547-0.0228*pct);
}
const cheneyCuring=(pct)=>1.12/(1+59.2*Math.exp(-0.124*(pct-50)));
const KMH=3.6;
function spreadMps(bed,windMps,wet=0){
  const u=windMps*KMH;
  return cheneyWindKmh(u)*cheneyMoisture((bed.moisture+wet)*100,u)
    *cheneyCuring(bed.curing*100)/KMH;
}

/* Byram 1959: fireline intensity I = H w R, flame length 0.0775 I^0.46. */
const firelineKWm=(loadKgM2,mps)=>HEAT_KJ_KG*loadKgM2*mps;
const flameLengthM=(kWm)=>kWm<=0?0:0.0775*Math.pow(kWm,0.46);

/* Van Wagner 1977, Can. J. For. Res. 7: a crown ignites when the fire under
   it passes (0.010 * CBH * (460 + 25.9 FMC))^1.5 kW/m. CBH is the crown base
   height in metres, FMC the foliar moisture in percent. */
const crownThresholdKWm=(cbhM,fmcPct)=>Math.pow(0.010*cbhM*(460+25.9*fmcPct),1.5);

/* Crown classes. AUTHORED states. `bed`: ground cover, part of the fuel bed
   it stands in. `bare`: a leafless crown has nothing to carry a fire. */
const CROWN=Object.freeze({
  conifer:  Object.freeze({cbhM:0.6,fmc:100}),
  broadleaf:Object.freeze({cbhM:2.0,fmc:120}),
  wetland:  Object.freeze({cbhM:3.0,fmc:110}),
  /* a palm carries a skirt of dead fronds */
  frond:    Object.freeze({cbhM:1.5,fmc:15}),
  thorn:    Object.freeze({cbhM:2.0,fmc:90}),
  shrub:    Object.freeze({cbhM:0.3,fmc:100}),
  wetShrub: Object.freeze({cbhM:0.3,fmc:180}),
  /* dead standing stems: canes, culms, a snag, a deadfall */
  cured:    Object.freeze({cbhM:0.1,fmc:10}),
  bed:      Object.freeze({bed:true}),
  bare:     Object.freeze({bare:true}),
  /* stone: nothing to carry a fire */
  mineral:  Object.freeze({bare:true}),
});
const PLANT_FUEL=Object.freeze({
  spruce:'conifer',birch:'bare',snag:'cured',bramble:'cured',log:'cured',
  reed:'cured',sward:'bed',shrub:'shrub',palm:'frond',meadowTree:'broadleaf',
  cypress:'wetland',tupelo:'wetland',stranglerFig:'broadleaf',
  buttonbush:'wetShrub',pickerel:'wetShrub',sedge:'bed',swampRose:'wetShrub',
  datePalm:'frond',acacia:'thorn',duneGrass:'cured',
  /* a fruit body is nine parts water: it scorches under a hard fire */
  glowcap:'wetShrub',glowlet:'wetShrub',
  stalagmite:'mineral',dripstub:'mineral',amethyst:'mineral',heartstone:'mineral',
  foxstone:'mineral',shard:'mineral',
});
/* Does a plant of this kind catch under a fire of `kWm` on a bed whose
   moisture damping is `damp`. An unnamed kind is dead wood. */
function plantCatches(kind,kWm,damp){
  const crown=CROWN[PLANT_FUEL[kind]]||CROWN.cured;
  if(crown.bare) return false;
  if(crown.bed) return damp>0;
  return kWm>=crownThresholdKWm(crown.cbhM,crown.fmc);
}

/* What one heat impulse does on a surface row. The impulse is a fixed energy:
   `reach` scales the radius it lights against the dry sward (area goes as
   1/demand, never past 1), `share` is what is left of its intensity after the
   bed's water, `damp` the bed's moisture damping (0: it cannot carry a fire),
   `headMps` and `headKWm` the wind-driven fire the bed then runs. */
const REFERENCE_KJ_M2=BED.sward.loadKgM2*preIgnitionKJkg(BED.sward.moisture);
const reachFor=(kJm2)=>Math.min(1,Math.sqrt(REFERENCE_KJ_M2/kJm2));
function fireAt(row,{rain=false,windMps=0}={}){
  const bed=BED[row?.fuel];
  if(bed){
    const wet=rain?RAIN_WET:0,moisture=bed.moisture+wet;
    const headMps=spreadMps(bed,windMps,wet);
    return {bed:row.fuel,
      reach:reachFor(bed.loadKgM2*preIgnitionKJkg(moisture)),
      share:Math.min(1,preIgnitionKJkg(BED.sward.moisture)/preIgnitionKJkg(moisture)),
      damp:cheneyMoisture(moisture*100,windMps*KMH),
      headMps,headKWm:firelineKWm(bed.loadKgM2,headMps)};
  }
  const reach=row?.heat==='melt'?reachFor(SNOW_SKIN_KG_M2*FUSION_KJ_KG):1;
  return {bed:null,reach,share:1,damp:0,headMps:0,headKWm:0};
}

/* ── snow off a bough ─────────────────────────────────────────────────────
   Unloaded snow leaves as clumps. A sphere's terminal speed is
   sqrt(4/3 * (rho/rho_air) * g * d / Cd). AUTHORED: a 6 cm clump of settled
   branch snow. 18 m/s: it never reaches terminal from a crown, so it
   falls under gravity alone. */
const CLUMP=Object.freeze({diameterM:0.06,kgM3:250,dragCd:0.47,airKgM3:1.29,
  /* AUTHORED: upper boughs let go first and knock the lower ones loose */
  cascadeS:0.30});
const CLUMP_TERMINAL_MPS=Math.sqrt(4/3*(CLUMP.kgM3/CLUMP.airKgM3)
  *GRAVITY_M_S2*CLUMP.diameterM/CLUMP.dragCd);

export {
  BED, CLUMP, CLUMP_TERMINAL_MPS, CROWN, FUSION_KJ_KG, HEAT_KJ_KG, PLANT_FUEL,
  RAIN_WET, SNOW_SKIN_KG_M2,
  cheneyCuring, cheneyMoisture, cheneyWindKmh, crownThresholdKWm, fireAt,
  firelineKWm, flameLengthM, plantCatches, preIgnitionKJkg, spreadMps,
};
