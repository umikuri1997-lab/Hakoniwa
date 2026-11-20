import { clamp, lerp } from '../math.js';
import { makePondCourt } from '../pond-court.js';
import { fbm, hashf } from '../rng.js';
import { SURF, SURFACE } from '../surface.js';
import { makeSwampLakehouse } from '../swamp-lakehouse.js';
import { makeSwampSettlement } from '../swamp-settlement.js';
import { SWAMP_WADE_M, swampDepthOf, swampSignalOf } from './swamp-water.js';

function makeWater(w){
  const {
    ALLIGATOR_HOLES, CAVERN, COMMON, MOORING, PLAN, POI, SWAMP_WATER, TH, WORLD_R,
    cavePoolAt, coveredAt, duneEnvelope, nB, nK, nL, oasisAt, pathDist, pathSlope, pathX, poiKind,
    rimAt, seed, swampBasinMetric, swampSignal, swampWander, warpU, warpV,
  }=w;
  /* Meadow water = cosine basins (not fbm contours); ry=rx/2. See docs/MEADOW.md. */
  const BASIN={
    cell  :400,          // lattice pitch
    take  :0.60,         // share of cells that hold a lake at all
    inset :0.12,         // jitter keeps the site off the lattice node
    rx    :[100,200],    // half-width; ry is half of it, see above
    aniso :0.50,         // k = 1/2. Not taste. PROJECTION.md.
    amp   :0.70,         // bowl depth in field units; see the waterline note
    wobble:0.085,        // shore wander, in radius units
  };
  /* Lattice rings a point must ask, derived from radius and pitch. Too few
     cuts the water off along a lattice line. */
  const BASIN_R=Math.max(1,Math.ceil(
    (BASIN.rx[1]*(1+BASIN.wobble)+(1-BASIN.inset)*BASIN.cell)/BASIN.cell)-1);
  const meadowBasins=(wx,wy)=>{
    const gx0=Math.floor(wx/BASIN.cell), gy0=Math.floor(wy/BASIN.cell);
    /* Shore wander is sampled once per query: a ground field, so touching
       basins join continuously. */
    const wob=fbm(nB,wx*0.012,wy*0.012,3)*BASIN.wobble;
    let best=0;
    for(let gy=gy0-BASIN_R;gy<=gy0+BASIN_R;gy++)
    for(let gx=gx0-BASIN_R;gx<=gx0+BASIN_R;gx++){
      if(hashf(gx,gy,seed^0xba51)>BASIN.take) continue;
      const span=1-BASIN.inset*2;
      const bx=(gx+BASIN.inset+hashf(gx,gy,seed^0xba52)*span)*BASIN.cell;
      const by=(gy+BASIN.inset+hashf(gx,gy,seed^0xba53)*span)*BASIN.cell;
      const rx=lerp(BASIN.rx[0],BASIN.rx[1],hashf(gx,gy,seed^0xba54));
      const q=Math.hypot((wx-bx)/rx,(wy-by)/(rx*BASIN.aniso))+wob;
      if(q>=1) continue;
      best=Math.max(best,0.5+0.5*Math.cos(Math.PI*clamp(q,0,1)));
    }
    return best;
  };

  const WATER=PLAN.water;
  const naturalLakeAt=(wx,wy)=>{
    if(WATER==='karst') return TH+swampSignal(wx,wy);
    if(WATER==='oasis'){
      /* The envelope term keeps water off dunes. */
      return oasisAt(wx,wy)-duneEnvelope(wx,wy)*0.9-rimAt(wx,wy)*0.8;
    }
    /* A cavern's pools are stated in its plan. The trail stays dry. */
    if(CAVERN) return BASIN.amp*cavePoolAt(wx,wy)-0.34*Math.exp(-pathDist(wx,wy)/30);
    /* The waterline is a contour of the bowl: water where amp*bowl > TH, so
       the shore sits at radius acos(2*TH/amp - 1)/PI: 65% at the default lake
       0.55, 41% at 0, 96% at 1. Invariant: `amp` exceeds the dry end of TH
       (0.40), or lake:0 erases the water. */
    let f=WATER==='basins'?BASIN.amp*meadowBasins(wx,wy)
                          :fbm(nL,warpU(wx,wy),warpV(wx,wy),4,2.05,0.52);
    f-=0.34*Math.exp(-pathDist(wx,wy)/30);

    f-=poiKind(wx,wy,'village')*0.9;
    /* The rim is land. */
    f-=rimAt(wx,wy)*0.8;
    return f;
  };
  /* The court is selected where the unmodified wetness field favours a pond
     and the made ground stays dry. Its basin is the one local hydrology
     change; renderer, collider and habitat read the same field. */
  const POND_COURT=PLAN.pondCourt?makePondCourt(seed,{
    pathX,common:COMMON,worldR:WORLD_R,poi:POI,threshold:TH,wetness:naturalLakeAt,
  }):null;
  if(POND_COURT) POI.push(POND_COURT);
  /* Order is forced: the sinkhole changes the hydrology field, so it compiles
     before the settlement (below) and the portals and steading (siting.js)
     are sited. Otherwise a pile house lands in an undecided lake. */
  const SWAMP_LAKEHOUSE=PLAN.swampLakehouse?makeSwampLakehouse(seed,{
    pathX,common:COMMON,worldR:WORLD_R,poi:POI,threshold:TH,
    wetness:naturalLakeAt,alligatorHoles:ALLIGATOR_HOLES,
    /* The biome's basin outline, so the sinkhole joins the backwater it lands
       in (SWAMP_LAKEHOUSE.hydrologyAt). */
    basinMetric:(x,y)=>swampBasinMetric(x,y,swampWander(x,y)),
    basinFloorSignal:swampSignalOf(SWAMP_WATER.karstFloorM),
  }):null;
  if(SWAMP_LAKEHOUSE) POI.push(SWAMP_LAKEHOUSE);
  const lakeAt=(wx,wy)=>{
    let base=naturalLakeAt(wx,wy);
    if(POND_COURT) base=POND_COURT.hydrologyAt(wx,wy,base,TH);
    if(SWAMP_LAKEHOUSE) base=SWAMP_LAKEHOUSE.hydrologyAt(wx,wy,base,TH);
    return base;
  };
  const isWater=(wx,wy)=>lakeAt(wx,wy)>TH;
  /* One analytic hydrology answer for placement and traversal. The swamp frame
     is the fixed high-water state. */
  const hydrologyAt=(wx,wy)=>{
    const signal=lakeAt(wx,wy)-TH;
    const water=signal>0;
    if(WATER!=='karst'){
      return {water,depth:water?clamp(signal*2.8,0.02,2):0,
              hydroperiod:water?1:clamp(0.45+signal*1.8,0,1),
              flow:{x:0,y:0},hummock:!water,hollow:water&&signal<0.08};
    }
    const micro=fbm(nK,wx*0.014+73,wy*0.014+29,3);
    const s=pathSlope(wy), inv=1/Math.sqrt(1+s*s);
    const depth=water?swampDepthOf(signal):0;
    const refuge=ALLIGATOR_HOLES.find(h=>Math.hypot(wx-h.x,wy-h.y)<h.r);
    return {
      water,depth,
      hydroperiod:clamp(0.58+signal*2.1,0.08,1),
      flow:{x:s*inv*0.16,y:inv*0.16},
      hummock:!water&&(micro>-0.03||signal<-0.025),
      hollow:water&&depth<SWAMP_WADE_M,refuge:refuge?refuge.id:null,
    };
  };
  const traversalAt=(wx,wy)=>{
    /* rock, and the ground a wall hides */
    if(CAVERN&&coveredAt(wx,wy))
      return {surface:PLAN.dry,walk:false,speed:0,depth:0,medium:'rock'};
    const h=hydrologyAt(wx,wy);
    if(!h.water){
      /* Sand and pavement speeds come from the SURFACE rows, so the preferred
         route follows the material. */
      const surface=PLAN.dunes&&duneEnvelope(wx,wy)<=0?SURF.hamada:PLAN.dry;
      return {surface,walk:true,speed:SURFACE[surface].speed||1,depth:0,medium:'dry'};
    }
    if(WATER==='karst'&&h.depth<=SWAMP_WADE_M)
      return {surface:SURF.flooded,walk:true,speed:SURFACE[SURF.flooded].speed,
              depth:h.depth,medium:'shallow'};
    return {surface:PLAN.deep,
            walk:false,speed:0,depth:h.depth,medium:'deep'};
  };
  const SWAMP_SETTLEMENT=PLAN.swampSettlement
    ?makeSwampSettlement(seed,{pathX,common:COMMON,hydrologyAt,pool:MOORING,
                               alligatorHoles:ALLIGATOR_HOLES,
                               avoid:SWAMP_LAKEHOUSE?[SWAMP_LAKEHOUSE]:[]})
    :null;
  if(SWAMP_SETTLEMENT)POI.push({kind:'swampSettlement',
    x:SWAMP_SETTLEMENT.landing.x,y:SWAMP_SETTLEMENT.landing.y,r:180});

  /* Dryness of a 30 px line, two rows deep, not of a point. */
  const wet=(x,y)=>isWater(x,y)||isWater(x-15,y)||isWater(x+15,y)
                  ||isWater(x,y-3)||isWater(x-15,y-3)||isWater(x+15,y-3);

  return {
    BASIN, meadowBasins, naturalLakeAt, POND_COURT, SWAMP_LAKEHOUSE, lakeAt,
    isWater, hydrologyAt, traversalAt, SWAMP_SETTLEMENT, wet,
  };
}

export { makeWater };
