import { HABITAT, TIERS } from '../biome.js';
import { cabinSlab } from '../cabin.js';
import { CH, PAD, PATHW } from '../constants.js';
import { tentDoorDX, tentDoorHW, tentShadowLift, tentSlab } from '../desert-camp.js';
import { hutDoorDX, hutSlab } from '../desert-hamlet.js';
import { capHouseDoorHW, capHouseSlab, cutBenchSlab, lampPostFootprint } from '../hollow-village.js';
import { clamp, smoothstep } from '../math.js';
import { pavilionDoorDX, pavilionDoorHW, pavilionSlab } from '../pavilion.js';
import { fbm, hashf } from '../rng.js';
import { PX_PER_M } from '../scale.js';
import { lightOf, madeLight } from '../glow.js';
import { CROWN_HALF, MAX_LEAN } from '../species.js';
import { PUMP_M, houseDoorDX, houseRotorLift, houseRotorSite, houseSlab, steadingFootprint } from '../steading.js';
import { swampHouseFloorPx, swampHousePileDX } from '../swamp-settlement.js';

/* The mast in bays and pixels. src/steading.js PUMP_M owns the height. */
const PUMP_BAYS=PUMP_M.bays;
const BAY_H=Math.round(PUMP_M.bay*PX_PER_M);

function makePlacement(w){
  const {
    BUILDINGS, CAVERN, PLAN, POND_COURT, STEADING, SWAMP_LAKEHOUSE, SWAMP_SETTLEMENT,
    buildingDoor, caveSet, coveredAt, duneEnvelope, elevAt, hydrologyAt, keepOutAt, layers, nC,
    nG, nK, nS, nU, openAt, opt, pathDist, poiAt, rimAt, seed, slabAt,
  }=w;
  /* Set pieces that stand on open floor. The plan states them before water
     and rock are asked, so the ones in a pool or a wall drop here, once. */
  const SETS=caveSet.filter(q=>!coveredAt(q.x,q.y)&&!hydrologyAt(q.x,q.y).water);
  /* ── AFFORDANCE, in world coordinates ────────────────────────────────────
     `dWater` and `dLand` are distances to open water and to land; `el` is
     elevation. Invariant: every falloff saturates below PAD, so a chunk
     answers for its own interior without its neighbours. */
  function host(kind,isW,dWater,dLand,el,wx,wy){
    /* Places are multipliers on the forest weight, not a second placement
       system. */
    let m=1;
    if(wx!==undefined){
      const H=HABITAT[kind];
      /* Desert axis: ground mobility. `sand` is the window of dune cover a
         species tolerates, read from the field the ground is painted from. */
      if(H&&H.sand){
        const cover=duneEnvelope(wx,wy);
        if(cover<H.sand[0]||cover>H.sand[1]) return 0;
      }
      if(H&&H.hydroperiod){
        const hy=hydrologyAt(wx,wy), hp=H.hydroperiod, dp=H.depth;
        if(hy.hydroperiod<hp[0]||hy.hydroperiod>hp[1]||
           hy.depth<dp[0]||hy.depth>dp[1]) return 0;
        const hm=Math.min(smoothstep(hp[0],Math.min(hp[1],hp[0]+0.16),hy.hydroperiod),
                          smoothstep(hp[1],Math.max(hp[0],hp[1]-0.16),hy.hydroperiod));
        m*=0.45+0.55*hm;
      }

      /* `wall` is the gain at a cavern wall: seepage runs down it, so the
         dripstone stands thickest at its foot. */
      if(H&&H.wall&&CAVERN) m*=1+H.wall*(1-smoothstep(4,70,openAt(wx,wy)));
      const rim=rimAt(wx,wy);
      /* At the rim the wood closes in and spruce takes over. */
      if(rim>0){
        if(H&&H.rim) m*= 1+rim*H.rim;
        else if(kind==='spruce') m*= 1+rim*7.0;
        else if(kind==='birch') m*= 1-rim*0.7;
        else m*= 1-rim*0.9;
      }
      const pc=POND_COURT&&POND_COURT.sample(wx,wy);
      if(pc){
        const made=pc.court>-8||pc.route<8;
        if(kind==='meadowTree'||kind==='palm'){
          if(pc.pond<1.22||made) return 0;
          const focus=Math.hypot((wx-POND_COURT.x)/175,(wy-POND_COURT.y)/112);
          const frame=smoothstep(0.72,0.96,focus)*(1-smoothstep(1.08,1.34,focus));
          m*=kind==='meadowTree'?frame*1.8:0.04;
        }else if(kind==='shrub'){
          if(pc.pond<1.05||pc.court>-2||pc.route<2) return 0;
          m*=1+0.9*(1-clamp(Math.abs(pc.pond-1.24)/0.34,0,1));
        }else if(kind==='sward'){
          if(pc.pond<1.08||pc.court>0||pc.route<1) return 0;
        }else if(kind==='reed'){
          m*=1+1.4*(1-clamp(Math.abs(pc.pond-0.98)/0.24,0,1));
        }
      }
      const q=poiAt(wx,wy);
      if(q){
        const t=q.t;
        switch(q.p.kind){
          /* A village fells timber, not scrub. Applied to every layer, the
             common is 83% one flat mass of bare snow. */
          case 'village':  m*= (kind==='birch'||kind==='spruce'||kind==='snag')
                               ? 1-t : 1-t*0.40;                      break;
          case 'clearing': m*= (kind==='bramble'?1-t*0.6:1-t*0.95);   break;
          case 'grove':    m*= kind==='birch'?1+t*2.6:1-t*0.75;       break;
          case 'cairn':    m*= 1-t*0.7;                               break;
          case 'geode':    m*= kind==='amethyst'?1+t*3.4
                               :kind==='shard'?1+t*14:1-t*0.72;       break;
          case 'sparbed':  m*= kind==='foxstone'?1+t*5.0:1-t*0.55;    break;
          case 'bay':      m*= kind==='reed'?1+t*1.2:1-t*0.5;         break;
          case 'portal':  m*= 1-t*0.90;                              break;
          case 'pondCourt':
            if(kind==='palm') m*=1-t*0.98;
            else if(kind==='meadowTree') m*=1-t*0.78;
            else m*=1-t*0.18;
            break;
        }
      }
    }
    if(m<=0) return 0;
    return m*hostBase(kind,isW,dWater,dLand,el);
  }
  function hostBase(kind,isW,dWater,dLand,el){
    const H=HABITAT[kind];
    if(!H) return 0;   // test/biome.test.mjs holds a HABITAT row for every layer kind
    /* Order matters: the piecewise shore shape is read before the flat
       hydroperiod weight. A row may carry both (the margin shrub): host() gates
       on the hydroperiod window, wet/dry distribute it across the edge. */
    if(H.wet) return isW?H.wet(dLand):H.dry(dWater);
    if(H.hydroperiod) return H.w;
    if(isW) return 0;
    const dw=smoothstep(H.water[0],H.water[1],dWater);
    const ev=H.el?smoothstep(H.el[0],H.el[1],el):1;
    /* elFloor is additive: at 1 the elevation smoothstep drops out. */
    const f=H.elFloor===undefined?ev:H.elFloor+(1-H.elFloor)*ev;
    return dw*f*H.w;
  }

  function placeProps(frame){
    const {cx,cy,ox,oy,n,wm,dW,dL}=frame;
    /* Invariant: the chunk containing a cell anchor owns its prop. Tall
       neighbours may be recomputed for drift input, but only the owner emits
       them. Buildings are claimed by anchor too. */
    const props=[], solids=[], windward=[];
    /* Every luminous body over the padded region, owned or not: the floor of
       this chunk is lit by its neighbours' caps (src/glow.js). */
    const lights=[];
    const GLOW=!!PLAN.glow;
    /* Set pieces (src/world/cavern.js): stated bodies. One near the padded
       window lights this chunk's floor and keeps the scatter off itself. */
    const sets=SETS.filter(q=>q.x>ox-PAD&&q.x<ox+n+PAD&&q.y>oy-PAD&&q.y<oy+n+PAD);
    for(const q of sets){
      const light=lightOf(q.kind,q.tier,q.x,q.y);
      if(light) lights.push(light);
      if(q.x<cx*CH||q.x>=(cx+1)*CH||q.y<cy*CH||q.y>=(cy+1)*CH) continue;
      props.push({x:q.x,y:q.y,kind:q.kind,tier:q.tier,vari:hashf(q.x,q.y,seed^0x5e7),
                  flip:hashf(q.x,q.y,seed^0x5e8)<0.5,tilt:0,warm:false,dark:false,
                  glow:!!light});
      if(q.r) solids.push({x:q.x,y:q.y,r:q.r});
    }
    for(const b of BUILDINGS){
      if(b.x<cx*CH||b.x>=(cx+1)*CH||b.y<cy*CH||b.y>=(cy+1)*CH) continue;
      if(b.kind!=='cabin') continue;  // compiled swamp architecture is emitted below

      const bx=Math.round(b.x), by=Math.round(b.y);
      /* A cabin with a return is never mirrored (docs/CANON.md): the return is
         the face the sun reaches last. */
      const bd=buildingDoor(b);
      props.push({x:bx,y:by,kind:'cabin',tier:0,
                  vari:hashf(bx,by,seed^0xcab1),
                  flip:false,tilt:0,warm:false,dark:false,
                  foot:'cabin:'+bd.v});

      /* The whole base is one slab. A row of discs blocks 2.4 rows of a cabin
         that draws 24 deep. The doorway gap stays in the front edge. */
      const cs=cabinSlab(bd.v);
      solids.push({x:bx+cs.dx, y:by-cs.front, hx:cs.hx, back:cs.back, front:cs.front,
                   shear:cs.shear, doorDX:bd.dx-cs.dx, doorHW:6});
    }
    for(const L of layers){
      const cell=L.cell;
      const pad=L.tall||(GLOW&&!L.tuft)?Math.ceil(PAD/cell)+1:1;
      const g0=Math.floor(cx*CH/cell)-pad, g1=Math.floor(((cx+1)*CH-1)/cell)+pad;
      const h0=Math.floor(cy*CH/cell)-pad, h1=Math.floor(((cy+1)*CH-1)/cell)+pad;
      for(let gy=h0;gy<=h1;gy++)for(let gx=g0;gx<=g1;gx++){
        const owned=Math.floor(gx*cell/CH)===cx&&Math.floor(gy*cell/CH)===cy;
        if(!owned&&!L.tall&&!L.log&&!(GLOW&&!L.tuft)) continue;
        /* At jitf 1 this is `h*cell*1 + cell*0*0.5`, exact in IEEE, so only the
           meadow's bytes differ. */
        const jf=L.jitf, jc=cell*(1-jf)*0.5;
        const jx=gx*cell+hashf(gx,gy,seed^0x101)*cell*jf+jc;
        const jy=gy*cell+hashf(gx,gy,seed^0x202)*cell*jf+jc;
        const ix=Math.round(jx)-ox, iy=Math.round(jy)-oy;
        if(ix<1||iy<1||ix>=n-1||iy>=n-1) continue;
        const pi=iy*n+ix;
        const clearW=PLAN.trailClear?PATHW+(L.tall?PLAN.trailClear.tall:PLAN.trailClear.low)
                    :L.log?PATHW+56:PATHW+6;
        if(PLAN.worldTrail&&pathDist(jx,jy)<clearW) continue;      // nothing grows in a trodden path
        if(SWAMP_SETTLEMENT&&SWAMP_SETTLEMENT.clearAt(jx,jy,L.tall))continue;
        if(CAVERN&&coveredAt(jx,jy)) continue;
        if(sets.some(q=>Math.hypot(q.x-jx,(q.y-jy)*2)<q.clear)) continue;
        const isW=!!wm[pi], el=elevAt(jx,jy);
        /* Keep-out is asked per kind: the answer depends on crown reach. A
           zero weight (not `continue`) lets the cell fall through to a legal
           kind. */
        let wsum=0; const ws=[];
        for(const k of L.kinds){
          const ko=keepOutAt(jx,jy,L.tuft?0:CROWN_HALF[k]||0);
          const v=(ko===2||(ko===1&&!L.tuft))
                  ?0:host(k,isW,dW[pi],dL[pi],el,jx,jy);
          ws.push(v); wsum+=v;
        }
        if(wsum<=0.001) continue;
        let r0=hashf(gx,gy,seed^0x303)*wsum, kind=L.kinds[0];
        for(let i=0;i<L.kinds.length;i++){ r0-=ws[i]; if(r0<=0){kind=L.kinds[i];break;} }
        /* Clump period: two to four spacings of the layer, so a frame holds a
           thicket and an opening. A period of one viewport reads uniform; at
           0.024 it is shorter than one tree spacing and modulates single
           trees. */
        const fq=kind==='spruce'?0.013:L.tuft?0.030:L.tall?0.010:0.012;
        const fld=kind==='spruce'?nC:L.tuft?nG:L.tall?nU:nK;

        const rimHere=rimAt(jx,jy)**2;
        const clump=Math.max(clamp(0.5+fbm(fld,jx*fq*0.62,jy*fq*0.95,3)*1.70,0,1),
                             rimHere);
        /* Meadow stand gate + lone-tree floor; shrub bloom groups
           (docs/DECISIONS.md). Only the gate differs per world. Do not
           reassociate the product: a shifted last bit against the hash below
           adds or removes a tree. */
        let gate;
        if(PLAN.stand&&L.tall){
          const stand=Math.pow(clamp(clump*2.30-0.90,0,1),PLAN.stand.gate);
          gate=Math.max(rimHere,stand+PLAN.stand.floor*(1-stand));
        }else if(PLAN.shrubPatch&&kind==='shrub'){
          const patch=clamp(0.5+fbm(nS,jx*0.0065,jy*0.0065,2)*1.70,0,1);
          gate=Math.max(rimHere,Math.pow(clamp(patch*3.00-1.75,0,1),1.6));
        }else{
          gate=Math.pow(clamp(clump*2.30-0.90,0,1),1.15);
        }
        let acc=clamp(host(kind,isW,dW[pi],dL[pi],el,jx,jy),0,1)
                 *gate*2.4*opt.density;
        /* Thin the wood beside the trail. */
        acc*= L.log ? (1.55-0.85*smoothstep(PATHW+8,PATHW+95,pathDist(jx,jy)))
                    : (0.45+0.55*smoothstep(PATHW+6,PATHW+52,pathDist(jx,jy)));
        if(hashf(gx,gy,seed^0x404)>acc) continue;
        const tl=TIERS[kind], tier=tl[Math.floor(hashf(gx,gy,seed^0x505)*tl.length)];
        /* A log through the base of a standing tree mis-sorts about a quarter
           of the time. `windward` holds every tall prop over the padded
           region. */
        if(L.log){
          const half=(tier?52:36); let clash=0;
          for(const s of windward)
            if(Math.abs(s.y-jy)<7&&Math.abs(s.x-jx)<half+4&&s.r>5.5) clash=1;
          if(clash) continue;
        }
        if(L.tall){
          const rad=(kind==='spruce'?5.0:4.0)*(1+0.5*(tier-3));
          windward.push({x:jx,y:jy,r:rad});
        }
        const light=GLOW?lightOf(kind,tier,jx,jy):null;
        if(light) lights.push(light);
        if(!owned) continue;
        const h6=hashf(gx,gy,seed^0x606);
        props.push({x:jx,y:jy,kind,tier,vari:hashf(gx,gy,seed^0x707),
          flip:h6<0.5, tilt:(hashf(gx,gy,seed^0x808)-0.5)*2*MAX_LEAN*0.55,
          /* Warm ramp is rationed. Measured: on a third of the wood it covers
             0.6-1.0% of a frame against the scarf's 0.02%, four to ten times
             the protagonist's chroma weight. */
          warm:(kind==='snag'&&hashf(gx,gy,seed^0x909)<0.12)||
               (kind==='birch'&&hashf(gx,gy,seed^0x909)<0.03),
          dark:kind==='birch'&&hashf(gx,gy,seed^0xa0a)<0.26,
          glow:!!light});
        if(L.tall) solids.push({x:jx,y:jy,r:(kind==='spruce'?5.0:4.0)*(1+0.42*(tier-3))});
        if(L.log){
          /* A fallen trunk is 60 to 100 px long: a PATHW+6 clearance puts four
             to seven across a 26 px trail (clearW uses PATHW+56). It is a
             collider. */
          const half=(tier?52:36);
          for(let q=-1;q<=1;q++) solids.push({x:jx+q*half*0.55,y:jy,r:5.5});
        }
      }
    }

    for(const t of STEADING){
      const lx=t.x-ox, ly=t.y-oy;
      if(lx<-140||ly<-200||lx>n+140||ly>n+200) continue;
      /* a made light reaches this floor as a cap's does */
      const made=GLOW?madeLight(t.kind,t.x,t.y):null;
      if(made) lights.push(made);
      if(t.kind==='house'){
        /* A house with a return is never mirrored (docs/CANON.md). Variety
           comes from the three mass scales. */
        props.push({x:t.x,y:t.y,kind:'house',tier:0,vari:t.vari/3+0.01,
                    flip:false,tilt:0,warm:false,dark:false,
                    foot:'house:'+(t.vari||0)});
        /* The rotor is a six-frame sprite at the hub houseRotorSite reports. */
        const hs=houseRotorSite(t.vari);
        props.push({x:t.x+hs.x,y:t.y+hs.y,kind:'roofRotor',
                    tier:0,vari:0,flip:false,tilt:0,warm:false,dark:false,
                    /* On a roof: the shadow pass assumes the ground unless
                       `lift` says otherwise. */
                    lift:houseRotorLift(t.vari),
                    rotor:'roof',spinPhase:hashf(t.x,t.y,seed^0x407f0)});
        /* One slab. Measured failure: a disc blocks r/GROUND_SQUASH rows, so
           4.5 px of radius covers 2.4 of this building's 34 rows.
           docs/CANON.md: the drawn base is sheared `cols` right over `back`
           rows, so the collider is a parallelogram. `houseSlab` states it from
           the drawing's geometry. */
        const hs2=houseSlab(t.vari);
        solids.push({x:t.x+hs2.dx, y:t.y-hs2.front, hx:hs2.hx, back:hs2.back,
                     front:hs2.front, shear:hs2.shear,
                     doorDX:houseDoorDX(t.vari)-hs2.dx, doorHW:8});
      }else if(t.kind==='hut'){
        props.push({x:t.x,y:t.y,kind:'hut',tier:0,vari:t.vari,
                    flip:false,tilt:0,warm:false,dark:false,
                    foot:'hut:'+t.vari});
        const hs=hutSlab(t.vari);
        solids.push({x:t.x+hs.dx, y:t.y-hs.front, hx:hs.hx, back:hs.back,
                     front:hs.front, shear:hs.shear,
                     doorDX:hutDoorDX(t.vari)-hs.dx, doorHW:5});
      }else if(t.kind==='tent'){
        props.push({x:t.x,y:t.y,kind:'tent',tier:0,vari:t.vari,
                    flip:false,tilt:0,warm:false,dark:false,
                    /* The guy skirt runs below the ground line and the shadow
                       pass roots at the rect bottom. Negative lift: rows of
                       sprite below the ground. */
                    lift:tentShadowLift(t.vari),
                    foot:'tent:'+t.vari});
        const ts=tentSlab(t.vari);
        solids.push({x:t.x+ts.dx, y:t.y-ts.front, hx:ts.hx, back:ts.back,
                     front:ts.front, shear:ts.shear,
                     doorDX:tentDoorDX(t.vari)-ts.dx, doorHW:tentDoorHW(t.vari)});
      }else if(t.kind==='capHouse'){
        /* Scene.resolve indexes a bank by floor(vari * length). */
        props.push({x:t.x,y:t.y,kind:'capHouse',tier:0,vari:(t.vari||0)/3+0.01,
                    flip:false,tilt:0,warm:false,dark:false,
                    foot:'capHouse:'+(t.vari||0)});
        /* the anchor is the door, so the door sits at -dx on the slab */
        const hs=capHouseSlab(t.vari||0);
        solids.push({x:t.x+hs.dx, y:t.y-hs.front, hx:hs.hx, back:hs.back,
                     front:hs.front, shear:hs.shear,
                     doorDX:-hs.dx, doorHW:capHouseDoorHW(t.vari||0)});
      }else if(t.kind==='lampPost'){
        props.push({x:t.x,y:t.y,kind:'lampPost',tier:0,vari:0,
                    flip:false,tilt:0,warm:false,dark:false});
        slabAt(solids,t.x,t.y-1,lampPostFootprint());
      }else if(t.kind==='cutBench'){
        props.push({x:t.x,y:t.y,kind:'cutBench',tier:0,vari:0,
                    flip:false,tilt:0,warm:false,dark:false});
        const bs=cutBenchSlab();
        solids.push({x:t.x+bs.dx, y:t.y-bs.front, hx:bs.hx, back:bs.back,
                     front:bs.front, shear:bs.shear});
      }else if(t.kind==='pavilion'){
        props.push({x:t.x,y:t.y,kind:'pavilion',tier:0,vari:0.01,
                    flip:false,tilt:0,warm:false,dark:false,foot:'pavilion:0'});
        const ps=pavilionSlab();
        solids.push({x:t.x+ps.dx,y:t.y-ps.front,hx:ps.hx,back:ps.back,
                     front:ps.front,shear:ps.shear,
                     doorDX:pavilionDoorDX()-ps.dx,doorHW:pavilionDoorHW()});
      }else if(t.kind==='pump'){
        for(let g=0;g<PUMP_BAYS;g++)
          /* Each bay carries its lift. Without it the stacked sprites cast a
             shadow one bay tall. */
          props.push({x:t.x,y:t.y-g*BAY_H,kind:'bay',tier:0,vari:g/PUMP_BAYS+0.001,
                      flip:false,tilt:0,warm:false,dark:false,lift:g*BAY_H});
        props.push({x:t.x,y:t.y-PUMP_BAYS*BAY_H,kind:'wheel',tier:0,vari:0,
                    flip:false,tilt:0,warm:false,dark:false,rotor:'pump',
                    lift:PUMP_BAYS*BAY_H,
                    spinPhase:hashf(t.x,t.y,seed^0x33ee)});
        /* Truss footing, from steadingFootprint. */
        slabAt(solids,t.x,t.y-2,steadingFootprint('pump'));
      }else if(t.kind==='nestPole'){
        props.push({x:t.x,y:t.y,kind:'nestPole',tier:0,vari:0,
                    flip:false,tilt:0,warm:false,dark:false});
        slabAt(solids,t.x,t.y-2,steadingFootprint('nestPole'));
      }else{
        props.push({x:t.x,y:t.y,kind:'derelict',tier:0,vari:0,
                    flip:hashf(t.x,t.y,seed^0x0de2)<0.5,tilt:0,warm:false,dark:false});
        slabAt(solids,t.x,t.y-3,steadingFootprint('derelict'));
      }
    }
    if(SWAMP_SETTLEMENT)for(const t of SWAMP_SETTLEMENT.architecture){
      const lx=t.x-ox,ly=t.y-oy;
      if(lx<-120||ly<-140||lx>n+120||ly>n+80)continue;
      const house=t.kind==='swampHouse',variant=t.variant||0;
      const variants=house?3:1,shadowFeet=house?swampHousePileDX(variant):undefined;
      props.push({x:t.x,y:t.y,kind:t.kind,tier:0,
        vari:variant/variants+0.01,flip:false,tilt:0,warm:false,dark:false,
        foot:house?'swampHouse:'+variant:undefined,
        footLift:house?swampHouseFloorPx():undefined,
        legFoot:house?'swampPile':undefined,shadowFeet});
      if(house)
        /* Colliders are the legs, at the drawn columns and rows. The
           undercroft is open: a body walks between the posts. */
        for(const q of shadowFeet)
          solids.push({x:t.x+q.dx,y:t.y-2+q.dy,r:4});
      else if(t.kind!=='swampSkiff'&&t.kind!=='swampDock')
        solids.push({x:t.x,y:t.y-2,r:4});
    }
    if(SWAMP_LAKEHOUSE)for(const t of SWAMP_LAKEHOUSE.architecture){
      const lx=t.x-ox,ly=t.y-oy;
      if(lx<-120||ly<-160||lx>n+120||ly>n+80)continue;
      /* The chair's frame comes from the clock, not from `vari`. */
      props.push({x:t.x,y:t.y,kind:t.kind,tier:0,
        vari:0.01,flip:false,tilt:0,warm:false,dark:false,
        /* The chair sits on the balcony, at the place's trunkPx. */
        lift:t.kind==='rockingChair'?SWAMP_LAKEHOUSE.trunkPx:0,
        rock:!!t.rock,rockPhase:t.rockPhase||0});
      /* Nothing here is enterable. The balcony is not a collider floor. */
      if(t.kind==='lakeHouse')
        /* Both trunk rows: open underneath, as the pile houses are. */
        for(const q of SWAMP_LAKEHOUSE.trunkDX)
          solids.push({x:t.x+q.dx,y:t.y-SWAMP_LAKEHOUSE.deckRows-2+q.dy,r:5});
      else if(t.kind==='houseLadder') solids.push({x:t.x,y:t.y-2,r:3.5});
    }
    if(POND_COURT) for(const t of POND_COURT.architecture){
      const lx=t.x-ox, ly=t.y-oy;
      if(lx<-90||ly<-120||lx>n+90||ly>n+80) continue;
      const count=t.kind==='pillar'?4:3;
      props.push({x:t.x,y:t.y,kind:t.kind,tier:0,
                  vari:t.variant/count+0.01,flip:false,tilt:0,warm:false,dark:false});
      if(t.kind==='pillar') solids.push({x:t.x,y:t.y-2,r:t.r});
      else for(let q=-1;q<=1;q++) solids.push({x:t.x+q*t.w*0.33,y:t.y-2,r:5});
    }
    if(POND_COURT) for(const t of POND_COURT.frameTrees){
      const lx=t.x-ox, ly=t.y-oy;
      if(lx<-140||ly<-150||lx>n+140||ly>n+100) continue;
      props.push({x:t.x,y:t.y,kind:t.kind,tier:t.tier,vari:t.vari,
                  flip:t.flip,tilt:0,warm:false,dark:false});
      solids.push({x:t.x,y:t.y,r:5.5});
    }
    props.sort((a,b)=>a.y-b.y);
    return {props,solids,lights};
  }

  return {host, placeProps};
}

export { makePlacement };
