import { BIOMES, LAYERS, growsIn } from '../biome.js';
import { clamp, lerp, smoothstep } from '../math.js';
import { fbm, makeNoise } from '../rng.js';
import { ASPECT } from './cavern.js';

function makeTerrain(w){
  const {
    opt, seed,
  }=w;
  /* Defaults to boreal: `makeWorldGen` is on the console surface (__fw) and in
     three tools, called without a biome. */
  const BIOME=(opt&&opt.biome)||'boreal';
  const PLAN=BIOMES[BIOME];
  if(!PLAN) throw new Error(`unknown biome '${BIOME}' — see BIOMES in biome.js`);
  /* Layers narrowed to the kinds this world grows (LAYERS in src/biome.js).
     The filter is fixed before the first chunk, so cell size stays a pure
     function of cell coordinates. */
  const GROUND=PLAN.ground;
  const grows=k=>growsIn(BIOME,k);
  const layers=LAYERS.map(L=>({...L,cell:(L.cells&&L.cells[BIOME])||L.cell,
                              jitf:(L.jit&&L.jit[BIOME])||1,
                              kinds:L.kinds.filter(grows)}))
                     .filter(L=>L.kinds.length);
  const nWA=makeNoise(seed^0x11a3), nWB=makeNoise(seed^0x22b7),
        nL =makeNoise(seed^0x33c1), nE =makeNoise(seed^0x44d9),
        nG =makeNoise(seed^0x55e5), nC =makeNoise(seed^0x66f3),
        nU =makeNoise(seed^0x7701), nK =makeNoise(seed^0x8813),
        nP =makeNoise(seed^0x9927), nP2=makeNoise(seed^0xaa31),
        nD =makeNoise(seed^0xbb47),
        /* One tag per field, so no two fields correlate (hashf in src/rng.js).
           nB meadow shore wander, nS bloom patches, nSW swamp basin outline
           wander, nDW ripple phase wander (ground.js), nDE sand-thickness
           envelope (dunes.js). */
        nB =makeNoise(seed^0xcc59), nS =makeNoise(seed^0xdd6b),
        nSW=makeNoise(seed^0xee7d),
        nDW=makeNoise(seed^0xff91), nDE=makeNoise(seed^0x1fa3);

  /* Water threshold on a continuous field. */
  const TH=lerp(0.40,0.02,clamp(opt.lake,0,1));

  /* ── THE TRAIL ────────────────────────────────────────────────────────────
     x = pathX(y), a function of y alone, so it is continuous across chunks.
     Invariant: amplitudes keep |dx/dy| under ~0.9. Past that a
     distance-to-curve rasterisation breaks up. */
  /* Remembers the last row: a chunk row asks the same y for every pixel. */
  let pathY=NaN, pathAtY=0;
  const pathX=wy=>{
    if(wy!==pathY){
      pathY=wy;
      pathAtY=fbm(nP,wy*0.00075,0.5,3)*380 + fbm(nP2,wy*0.0052,1.5,2)*66;
    }
    return pathAtY;
  };
  const pathSlope=wy=>(pathX(wy+3)-pathX(wy-3))/6;
  const pathDist=(wx,wy)=>{
    const s=pathSlope(wy);
    return Math.abs(wx-pathX(wy))/Math.sqrt(1+s*s);
  };

  /* Bowl, POI and field stay analytic in world coordinates, so baker,
     collider, spawner and streaming chunks agree. */
  const WORLD_R = 2600;

  /* The rim: the forest thickens through the last 14% of the radius until it
     is impassable. The edge wanders by about a tenth of the radius. */
  const rimAt=(wx,wy)=>{
    const d=Math.hypot(wx,wy)/WORLD_R;
    const wob=fbm(nC,wx*0.00055+51,wy*0.00055+17,3)*0.13;
    return clamp((d+wob-0.86)/0.14,0,1);
  };
  const beyondRim=(wx,wy)=>rimAt(wx,wy)>=0.995;

  /* `x:null` in the biome table means "on the trail", resolved here because
     pathX does not exist when the table is evaluated. */
  const COMMON={kind:'village', r:PLAN.common.r, y:PLAN.common.y,
                x:PLAN.common.x===null?Math.round(pathX(PLAN.common.y)):PLAN.common.x};
  const POI=(()=>{
    const list=[COMMON];
    const kinds=PLAN.ring;
    const rr=makeNoise(seed^0x50c1);
    for(let i=0;i<kinds.length;i++){
      /* A stated place: an offset from the common on the cavern's metric. */
      if(typeof kinds[i]==='object'){
        const q=kinds[i];
        list.push({kind:q.kind,x:COMMON.x+q.dx,y:COMMON.y+q.dy/ASPECT,r:q.r});
        continue;
      }
      /* Jittered angle, radius kept inside the rim. */
      const a=(i/kinds.length)*Math.PI*2 + fbm(rr,i*3.1,0.5,2)*0.85;
      const d=WORLD_R*(0.34+0.40*(fbm(rr,i*7.7+13,2.5,2)*0.5+0.5));
      list.push({kind:kinds[i], x:Math.cos(a)*d, y:Math.sin(a)*d,
                 r:kinds[i]==='bay'?260:kinds[i]==='grove'?230:190});
    }
    return list;
  })();


  /* Strongest place here and its depth t: 1 at the middle, 0 at the edge,
     soft-edged. */
  const poiAt=(wx,wy)=>{
    let best=null, bt=0;
    for(const p of POI){
      const d=Math.hypot(wx-p.x,wy-p.y);
      if(d>p.r) continue;
      const t=smoothstep(p.r,p.r*0.45,d);
      if(t>bt){ bt=t; best=p; }
    }
    return best?{p:best,t:bt}:null;
  };
  /* Influence of one named kind. poiAt is for composition: used for hydrology,
     an overlapping settlement POI erases the village's raised ground and moves
     selected house sites. */
  const poiKind=(wx,wy,kind)=>{
    let best=0;
    for(const p of POI){
      if(p.kind!==kind)continue;
      const d=Math.hypot(wx-p.x,wy-p.y);
      if(d<=p.r)best=Math.max(best,smoothstep(p.r,p.r*0.45,d));
    }
    return best;
  };

  const warpU=(wx,wy)=>wx*0.0021+fbm(nWA,wx*0.0016,wy*0.0016,3)*0.55;
  const warpV=(wx,wy)=>wy*0.0021+fbm(nWB,wx*0.0016+7.3,wy*0.0016+3.1,3)*0.55;
  /* Relief is one number in the biome plan. Measured (test/biome.test.mjs,
     `sward reads as one grass mass`): the ground shader snaps `t + ndl*0.58`
     to four grass rungs, and the terrain normal carries it across a rung
     boundary. At full relief 4-10% of meadow sward sits off the modal rung in
     blobs a couple of hundred pixels across. The meadow is flat; its texture
     is the culm micro-relief. See docs/DECISIONS.md. */
  const RELIEF=PLAN.relief===undefined?1:PLAN.relief;
  /* Ground colour noise is rung-budgeted (docs/MEADOW.md). The coarse field
     GC at 0.115 is 69% of a four-rung step: right on snow, where it is the
     drifts, and over budget on grass. */
  const PATCH_A=PLAN.patch===undefined?0.115:PLAN.patch;
  /* Base relief of every world. A dune field adds to it in dunes.js. */
  const reliefAt=(wx,wy)=>fbm(nE,warpU(wx,wy)+3.7,warpV(wx,wy)+1.9,4,2.05,0.52)*RELIEF;

  return {
    BIOME, PLAN, GROUND, layers, nWA, nWB, nL, nG, nC, nU, nK, nP2, nD,
    nB, nS, nSW, nDW, nDE, TH, pathX, pathSlope, pathDist, WORLD_R, rimAt,
    beyondRim, COMMON, POI, poiAt, poiKind, warpU, warpV, reliefAt,
    PATCH_A,
  };
}

export { makeTerrain };
