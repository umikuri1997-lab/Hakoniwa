import { HABITAT } from '../biome.js';
import { PATHW } from '../constants.js';
import { compileCulturePlan } from '../culture.js';
import { ACTION_AFFORDANCES, LIFE, RESOURCE_GUILDS, actionSiteAffinity, activityAt } from '../life.js';
import { clamp, smoothstep } from '../math.js';
import { fbm, hashf, keyedInt, keyedRandom } from '../rng.js';
import { SWAMP_WADE_M } from './swamp-water.js';

const LIFE_PATCH_SIZE=320;
const LIFE_SITE_SIZE=80;

/* Who lives wild in each world, as cohort rows. LIFE in src/life.js owns each
   profile; this table owns how many cohorts a world compiles and where the
   first anchor sits.
     cohorts  number of cohorts (default 1)
     members  a count, or [lo,hi] drawn per seed (default 1)
     forms    two social forms; the first holds with probability p
     half     'north' keeps anchors in the northern half (authored presence)
     at       a named first anchor; default is the three best-suited sites
     kinds    for `at:'place'`: the place kinds, one cohort to a place */
const ROSTER={
  boreal:{individuals:[],cohorts:[
    {profile:'roeDeer'},
    {profile:'boar',half:'north',forms:[{form:'solitary-adult',members:1,p:0.72},
                                        {form:'matrilineal-unit',members:3}]},
    {profile:'squirrel',cohorts:3},
  ]},
  swamp:{individuals:[],cohorts:[
    {profile:'alligator',cohorts:2,at:'alligatorHole'},
    {profile:'heron',cohorts:2},
    {profile:'turtle',cohorts:3},
    /* one water, one group: two cohorts draw the same best site */
    {profile:'skimmer',members:[2,3]},
    {profile:'lampsnail',cohorts:3},
  ]},
  /* Desert habitat fields are functions of oasis distance, so suitability
     places the wild three near the water. */
  desert:{individuals:[],cohorts:[
    {profile:'fennec'},
    {profile:'viper'},
    {profile:'sandgrouse',members:[2,5]},
    {profile:'camel',members:[2,4],at:'camp'},
    {profile:'shadeguest'},
  ]},
  /* The stork off the nest stands by its pole and where the grower cuts; the
     hares take the quietest open grass. */
  meadow:{cohorts:[
    {profile:'stork',at:'nestPole'},
    {profile:'hare',cohorts:2},
  ],individuals:[
    {profile:'colossus',preferDX:-120,maxYDelta:110},
    {profile:'strider',preferDX:120,maxYDelta:110},
    {profile:'pilgrim',origin:'pondCourt',maxYDelta:210},
  ]},
  /* The herd keeps to the hall. A carbuncle to each of the first two crystal
     places, a lantern group to each room, and one olm to each pool: a second
     member is stood 13 px off its anchor unchecked, which is the bank. */
  hollow:{individuals:[],cohorts:[
    {profile:'paleDeer',members:[3,4],at:'place',kinds:['village']},
    {profile:'olm',cohorts:6,at:'gour'},
    {profile:'driftlantern',cohorts:3,members:[2,3],at:'place',
     kinds:['village','bay','cairn']},
    {profile:'carbuncle',cohorts:2,at:'place',kinds:['geode']},
  ]},
};

function makeLifeField(w){
  const {
    ALLIGATOR_HOLES, BIOME, BUILDINGS, CAVERN, COMMON, OASIS, OASIS_RX, PLAN, POI,
    POND_COURT, STEADING, SWAMP_LAKEHOUSE, SWAMP_SETTLEMENT, TH, WORLD_R,
    buildingDoor, caveSet, duneEnvelope, elevAt, hydrologyAt, keepOutAt, lakeAt, nG,
    nU, pathDist, poiKind, rimAt, seed, traversalAt,
  }=w;
  /* Life patches hold coarse continuity and disturbance; life sites hold local
     action affordances. Both are stable coordinate grids. */
  const gridId=(kind,size,wx,wy)=>{
    const gx=Math.floor(wx/size),gy=Math.floor(wy/size);
    return `${BIOME}:${kind}:${gx}:${gy}`;
  };
  const lifePatchId=(wx,wy)=>gridId('patch',LIFE_PATCH_SIZE,wx,wy);
  const lifeSiteId=(wx,wy)=>gridId('site',LIFE_SITE_SIZE,wx,wy);
  const centreOf=(size,wx,wy)=>({
    x:Math.floor(wx/size)*size+size/2,
    y:Math.floor(wy/size)*size+size/2,
  });
  const deviationAt=(state,id)=>{
    if(!state)return null;
    if(state instanceof Map)return state.get(id)||null;
    if(state.deviations instanceof Map)return state.deviations.get(id)||null;
    return state.deviations?.[id]||state[id]||null;
  };

  /* Which resource fields this world has. RESOURCE_GUILDS in src/life.js owns
     the answer; deadwood and firmSubstrate are computed in every world. */
  const HAS=Object.fromEntries(Object.values(RESOURCE_GUILDS)
    .map((row)=>[row.field,row.biomes.includes(BIOME)]));
  const DAMP=HABITAT.glowcap.hydroperiod;
  const lifeSiteAt=(wx,wy,state=null)=>{
    const patchId=lifePatchId(wx,wy),deviation=deviationAt(state,patchId);
    const baseHyd=hydrologyAt(wx,wy),delta=deviation?.conditionDelta||{};
    const depth=clamp(baseHyd.depth+(delta.depth||0),0,2);
    const hyd={...baseHyd,depth,hydroperiod:clamp(
      baseHyd.hydroperiod+(delta.hydroperiod||0),0,1),
      water:depth>0.01};
    const travel=traversalAt(wx,wy);
    const medium=!hyd.water?'dry':hyd.depth<=SWAMP_WADE_M?'shallow':'deep';
    const d=8,sx=(elevAt(wx+d,wy)-elevAt(wx-d,wy))/(2*d);
    const sy=(elevAt(wx,wy+d)-elevAt(wx,wy-d))/(2*d);
    const slope=clamp(Math.hypot(sx,sy)*32,0,1);
    const path=pathDist(wx,wy);
    let poiDistance=WORLD_R;
    for(const p of POI)poiDistance=Math.min(poiDistance,
      Math.max(0,Math.hypot(wx-p.x,wy-p.y)-p.r));
    const structure=clamp(0.52+fbm(nG,wx*0.0031+17,wy*0.0031+41,3)*0.46,0,1);
    /* Canopy closes toward the plan's driver: the rim in a forest, standing
       water in a swamp. */
    const C=PLAN.canopy;
    const canopy=clamp(structure*(C.by==='rim'?C.base+C.gain*rimAt(wx,wy)
      :C.by==='hydroperiod'?C.base+hyd.hydroperiod*C.gain:C.base),0,1);
    const cover=clamp(canopy*0.62+
      (0.5+0.5*fbm(nU,wx*0.0067+9,wy*0.0067+23,2))*0.38,0,1);
    const traffic=clamp((1-smoothstep(PATHW,PATHW+120,path))*0.72+
      (1-smoothstep(20,220,poiDistance))*0.74,0,1);
    const quiet=clamp(1-traffic,0,1);
    const open=1-cover;
    const shallow=hyd.water?1-smoothstep(0.12,0.55,hyd.depth):0;
    /* Nearness to the one pool, on the ground plane (depth doubled). Every
       desert resource below reads it. */
    const oasisNear=OASIS
      ?1-smoothstep(OASIS_RX,OASIS_RX*4.5,
                    Math.hypot(wx-OASIS.x,(wy-OASIS.y)*2))
      :0;
    const hole=ALLIGATOR_HOLES.reduce((best,h)=>{
      const dist=Math.hypot(wx-h.x,wy-h.y);
      return !best||dist<best.distance?{id:h.id,distance:dist,radius:h.r,
        influence:h.influenceRadius}:best;
    },null);
    const refuge=hole?clamp(1-hole.distance/Math.max(1,hole.influence),0,1):0;
    const edge=clamp(1-Math.abs(lakeAt(wx,wy)-TH)/0.18,0,1);
    /* `built` = keep-out ≥1 (yard counts for machines). Shared flora/life site
       condition (docs/DECISIONS.md). */
    const built=keepOutAt(wx,wy,0)>=1;
    const resources={
      coneMast:HAS.coneMast?clamp(canopy*(0.52+0.48*hashf(
        Math.floor(wx/LIFE_SITE_SIZE),Math.floor(wy/LIFE_SITE_SIZE),seed^0xc04e)),0,1):0,
      browse:HAS.browse?clamp((0.35+0.65*edge)*(0.35+0.65*(1-canopy))*cover,0,1):0,
      snowShelter:HAS.snowShelter?clamp(cover*(1-slope*0.5),0,1):0,
      rooting:HAS.rooting?clamp((0.35+0.65*(1-canopy))*(0.45+0.55*cover),0,1):0,
      deadwood:clamp(cover*(0.35+0.65*hashf(
        Math.floor(wx/LIFE_SITE_SIZE),Math.floor(wy/LIFE_SITE_SIZE),seed^0xdead)),0,1),
      reedCover:HAS.reedCover?clamp(edge*hyd.hydroperiod,0,1):0,
      shallowPrey:HAS.shallowPrey?clamp(shallow*(0.35+0.65*hyd.hydroperiod),0,1):0,
      refuge:HAS.refuge?refuge:0,
      bask:HAS.bask?clamp(edge*open*(0.45+0.55*(hyd.water?shallow:1)),0,1):0,
      thermal:HAS.thermal?clamp(open*(1-slope*0.45),0,1):0,
      /* the meadow's two: the wet edge of a basin, and open quiet grass */
      pondMargin:HAS.pondMargin?clamp(edge*(0.40+0.60*open),0,1):0,
      openSward:HAS.openSward?clamp(open*quiet*(hyd.water?0:1)*(built?0:1),0,1):0,
      /* ── THE DESERT'S FOUR ──────────────────────────────────────────────
         Shade, at a sun 89 degrees up, exists only under a crown (`canopy`).
         Water is the pool. Loose sand reads the dune-cover field the ground is
         painted from. Forage is sub-sprite prey and seed: a field with no
         body, per LIFE.md. It concentrates where plants grow and near the
         pool. */
      desertShade:HAS.desertShade?clamp(canopy*(0.20+0.80*oasisNear)*1.4,0,1):0,
      openWater:HAS.openWater?(hyd.water?1:clamp(oasisNear*1.6-0.6,0,1)):0,
      looseSand:HAS.looseSand?duneEnvelope(wx,wy):0,
      desertForage:HAS.desertForage?clamp(0.08+0.50*canopy+0.52*oasisNear,0,1):0,
      firmSubstrate:clamp((travel.walk?1:0)*(1-slope*0.65)*
        (hyd.water?1-hyd.depth/Math.max(0.01,SWAMP_WADE_M):1),0,1),
      /* The Hollow's two. Fungus rises with the damp across the glowcap's
         own window, so it peaks on a pool's skirt. Crystal is nearness to a
         geode place. */
      fungus:HAS.fungus&&!hyd.water?clamp((hyd.hydroperiod-DAMP[0])/(DAMP[1]-DAMP[0]),0,1):0,
      crystal:HAS.crystal&&!hyd.water?poiKind(wx,wy,'geode'):0,
    };
    if(deviation?.resourceDelta)for(const [key,value] of Object.entries(deviation.resourceDelta))
      if(resources[key]!==undefined)resources[key]=clamp(resources[key]+value,0,1);
    const risks={
      deepWater:hyd.water?clamp(hyd.depth/1.2,0,1):0,
      exposure:open,humanTraffic:clamp(traffic+(deviation?.humanTraffic||0),0,1),
      activeWork:clamp(deviation?.activeWork||0,0,1),
      machinePressure:clamp(deviation?.machinePressure||0,0,1),
      rim:rimAt(wx,wy),
    };
    return {
      id:lifeSiteId(wx,wy),patchId,x:wx,y:wy,biome:BIOME,
      conditions:{medium,water:hyd.water,depth:hyd.depth,
        hydroperiod:hyd.hydroperiod,hummock:!!hyd.hummock,hollow:!!hyd.hollow,
        flow:hyd.flow,elevation:elevAt(wx,wy),slope,pathDistance:path,
        poiDistance,canopy,cover,quiet,open,built,rock:travel.medium==='rock'},
      resources,risks,deviation,
    };
  };

  const profileSuitability=(profileOrId,site)=>{
    const profile=typeof profileOrId==='string'?LIFE[profileOrId]:profileOrId;
    if(!profile||!profile.biomes.includes(BIOME)||site.risks.rim>=0.995)return 0;
    /* Nothing lives inside a building's keep-out, in every world. Medium and
       habitat gates alone put two meadow machines on house roofs. Nor in
       rock: solid limestone is `dry`, and 66% of a 1000 by 800 px box on the hall. */
    if(site.conditions.built||site.conditions.rock)return 0;
    const C=profile.conditions,S=site.conditions;
    if(C.medium&&!C.medium.includes(S.medium))return 0;
    if(C.maxDepthM!==undefined&&S.depth>C.maxDepthM)return 0;
    if(C.minDepthM!==undefined&&S.depth<C.minDepthM)return 0;
    if(C.hydroperiodMin!==undefined&&S.hydroperiod<C.hydroperiodMin)return 0;
    if(C.coverMin!==undefined&&S.cover<C.coverMin)return 0;
    if(C.canopyMin!==undefined&&S.canopy<C.canopyMin)return 0;
    if(C.quietMin!==undefined&&S.quiet<C.quietMin)return 0;
    if(C.firmSubstrateMin!==undefined&&site.resources.firmSubstrate<C.firmSubstrateMin)return 0;
    const resourceValues=profile.resources.map((id)=>{
      const field=RESOURCE_GUILDS[id]?.field;
      return field===undefined?0:(site.resources[field]||0);
    });
    const resource=resourceValues.length
      ?resourceValues.reduce((a,b)=>a+b,0)/resourceValues.length:0.7;
    const safety=clamp(1-Math.max(site.risks.deepWater*
      (C.medium?.includes('deep')?0.15:1),site.risks.activeWork,site.risks.rim),0,1);
    const edge=C.edgeBias===undefined?1:clamp(
      1-Math.abs((1-S.canopy)-C.edgeBias),0,1);
    return clamp(resource*0.58+safety*0.27+edge*0.15,0,1);
  };

  const occupancyInput=(profileOrId,siteOrX,wy,state=null)=>{
    const site=typeof siteOrX==='object'?siteOrX:lifeSiteAt(siteOrX,wy,state);
    const suitability=profileSuitability(profileOrId,site);
    const connectivity=clamp(1-site.risks.rim-site.risks.humanTraffic*0.18,0,1);
    return {suitability,connectivity,input:suitability*connectivity};
  };

  const lifePatchAt=(wx,wy,state=null)=>{
    const c=centreOf(LIFE_PATCH_SIZE,wx,wy),o=LIFE_PATCH_SIZE*0.28;
    const sites=[[c.x,c.y],[c.x-o,c.y-o],[c.x+o,c.y-o],
      [c.x-o,c.y+o],[c.x+o,c.y+o]].map(([x,y])=>lifeSiteAt(x,y,state));
    const mean=(read)=>sites.reduce((sum,q)=>sum+read(q),0)/sites.length;
    const resources={};
    for(const row of Object.values(RESOURCE_GUILDS))
      resources[row.field]=mean((q)=>q.resources[row.field]||0);
    const risks={};
    for(const key of Object.keys(sites[0].risks))risks[key]=mean((q)=>q.risks[key]||0);
    const occupancyInputs={};
    for(const [id,profile] of Object.entries(LIFE))
      if(profile.biomes.includes(BIOME)&&profile.identity.class!=='human-person')
        occupancyInputs[id]=mean((q)=>occupancyInput(profile,q).input);
    const deviation=deviationAt(state,lifePatchId(c.x,c.y));
    return {id:lifePatchId(c.x,c.y),x:c.x,y:c.y,biome:BIOME,
      succession:deviation?.succession||'mature',connectivity:clamp(1-risks.rim,0,1),
      resources,risks,occupancyInputs,deviation};
  };

  const resourceWebAt=(wx,wy,state=null)=>{
    const site=lifeSiteAt(wx,wy,state);
    return Object.entries(RESOURCE_GUILDS)
      .filter(([,row])=>row.biomes.includes(BIOME))
      .map(([id,row])=>({id,field:row.field,value:site.resources[row.field]||0,
        supports:row.supports,kind:row.kind,provenance:row.provenance}));
  };

  const encounterAt=(profileOrId,wx,wy,minuteOfDay,occupancyValue,detectability,state=null)=>{
    const profile=typeof profileOrId==='string'?LIFE[profileOrId]:profileOrId;
    const site=lifeSiteAt(wx,wy,state);
    const input=occupancyValue===undefined?occupancyInput(profile,site).input:occupancyValue;
    const baseActivity=activityAt(profile,minuteOfDay);
    const timingShift=Object.values(profile.disturbance).some((q)=>
      String(q).includes('timing-shift'));
    const m=((minuteOfDay%1440)+1440)%1440;
    const daylight=m>=480&&m<1020?1:0;
    const active=timingShift
      ?clamp(baseActivity*(1-site.risks.humanTraffic*0.55*daylight),0,1)
      :baseActivity;
    const visible=clamp(detectability===undefined?0.65:detectability,0,1);
    return {occupancyInput:input,activity:active,detectability:visible,
      encounter:input*active*visible};
  };

  const SCENE_ID=PLAN.scene;
  let LIFE_PLAN=null;
  const NORTHERN=new Set(ROSTER[BIOME].cohorts.filter((q)=>q.half==='north').map((q)=>q.profile));
  /* Draw 384 keyed candidates, keep the suitable ones, rank by suitability,
     quiet and a keyed tie-break, then take the best `count` that stand a site
     radius apart. `draw(i)` returns a point or null. */
  const selectAnchors=(profileId,count,tag,tieKey,wFit,wQuiet,draw)=>{
    const profile=LIFE[profileId],candidates=[];
    for(let i=0;i<384;i++){
      const at=draw(i);
      if(!at)continue;
      const site=lifeSiteAt(at.x,at.y),fit=profileSuitability(profile,site);
      if(fit<=0)continue;
      const score=fit*wFit+site.conditions.quiet*wQuiet+
        keyedRandom(seed,SCENE_ID,tag,i,tieKey)*0.06;
      candidates.push({x:at.x,y:at.y,site,score,i});
    }
    candidates.sort((a,b)=>b.score-a.score||a.i-b.i);
    const chosen=[],separation=Math.max(LIFE_SITE_SIZE,profile.spatial.siteRadius*0.72);
    for(const q of candidates){
      if(chosen.every((p)=>Math.hypot(p.x-q.x,p.y-q.y)>=separation))chosen.push(q);
      if(chosen.length===count)break;
    }
    return chosen;
  };
  /* Anywhere in the world, between 18% and 76% of its radius. */
  const candidateAnchors=(profileId,count,tag=profileId)=>
    selectAnchors(profileId,count,tag,'tie',0.82,0.12,(i)=>{
      const a=keyedRandom(seed,SCENE_ID,tag,i,'angle')*Math.PI*2;
      const radius=WORLD_R*(0.18+keyedRandom(seed,SCENE_ID,tag,i,'radius')*0.58);
      const x=Math.round(Math.cos(a)*radius),y=Math.round(Math.sin(a)*radius);
      return {x,y:NORTHERN.has(profileId)?-Math.abs(y):y};
    });
  /* In a ring around an origin, nearest to `preferred` first. */
  const candidateAnchorsAround=(profileId,count,origin,minRadius,maxRadius,
                                maxYDelta=Infinity,preferred=origin,tag=profileId)=>{
    const chosen=selectAnchors(profileId,count,tag,'local-tie',0.86,0.08,(i)=>{
      const a=keyedRandom(seed,SCENE_ID,tag,i,'local-angle')*Math.PI*2;
      const radius=minRadius+keyedRandom(seed,SCENE_ID,tag,i,'local-radius')*
        (maxRadius-minRadius);
      const x=Math.round(origin.x+Math.cos(a)*radius);
      const y=Math.round(origin.y+Math.sin(a)*radius);
      return Math.abs(y-origin.y)>maxYDelta?null:{x,y};
    });
    chosen.sort((a,b)=>Math.hypot(a.x-preferred.x,a.y-preferred.y)-
      Math.hypot(b.x-preferred.x,b.y-preferred.y)||a.i-b.i);
    return chosen;
  };

  const agendaFor=(profileId,nodes)=>{
    const profile=LIFE[profileId];
    const reactive=new Set(['orient','freeze','flee','hide','submerge','hold',
      'display','defend','withdraw','approach-traveller','greet','follow-traveller']);
    const actions=profile.actions.filter((q)=>!reactive.has(q)&&q!=='player-directed');
    const agenda=[];
    for(const [i,action] of actions.slice(0,Math.max(2,Math.min(4,actions.length))).entries()){
      const ranked=nodes.map((node,index)=>({
        node,index,affinity:actionSiteAffinity(profile,action,lifeSiteAt(node.x,node.y)),
      })).filter((q)=>q.affinity>=0);
      if(ACTION_AFFORDANCES[action]&&!ranked.length)continue;
      const preferred=ranked.find((q)=>q.index===i%Math.max(1,nodes.length));
      ranked.sort((a,b)=>b.affinity-a.affinity||a.index-b.index);
      agenda.push({
        action,targetId:(preferred||ranked[0])?.node.id||null,
        duration:20+keyedInt(seed,0,35,SCENE_ID,profileId,i,'agenda-duration'),
      });
    }
    return agenda.length?agenda:[{action:'rest',targetId:nodes[0]?.id||null,duration:30}];
  };

  const compileLifePlans=()=>{
    if(LIFE_PLAN)return LIFE_PLAN;
    const facade={POI,plan:PLAN,BUILDINGS,buildingDoor,steading:STEADING,
      swampSettlement:SWAMP_SETTLEMENT,swampLakehouse:SWAMP_LAKEHOUSE,
      oasis:OASIS,cavern:CAVERN,caveSet,biome:BIOME};
    const cultures=PLAN.cultures.map((id)=>compileCulturePlan(facade,id));
    const culture=cultures[0]||null;
    /* Both desert packages anchor a node on the one pool, so the shared
       gathering arrives twice. Keep the first, as the id map in life-runtime
       does. */
    const seenNodeIds=new Set();
    const useNodes=cultures.flatMap((c)=>c.nodes)
      .filter((q)=>seenNodeIds.has(q.id)?false:(seenNodeIds.add(q.id),true));
    const cohorts=[],individuals=[],residents=[];
    const addCohort=(profileId,index,members,anchorRows,socialForm=null)=>{
      const profile=LIFE[profileId],anchor=anchorRows[0];
      if(!anchor)return;
      const nodes=anchorRows.map((q,i)=>({
        id:`${SCENE_ID}:${profileId}:${index}:site:${i}`,kind:'life-site',
        x:q.x,y:q.y,siteId:q.site.id,patchId:q.site.patchId,
        resources:profile.resources,
      }));
      useNodes.push(...nodes);
      const id=`${SCENE_ID}:cohort:${profileId}:${index}`;
      cohorts.push({
        id,profileId,sceneId:SCENE_ID,cohortId:id,
        memberIds:Array.from({length:members},(_,i)=>`${id}:member:${i}`),
        anchor:{x:anchor.x,y:anchor.y,siteId:anchor.site.id,patchId:anchor.site.patchId},
        position:{x:anchor.x,y:anchor.y},
        social:{form:socialForm||profile.social.form,size:members},
        appearance:{variant:keyedInt(seed,0,2,id,'appearance')},
        route:{nodeIds:nodes.map((q)=>q.id),from:0,to:Math.min(1,nodes.length-1)},
        agenda:agendaFor(profileId,nodes),nextEventAt:0,
      });
    };

    /* Wild cohorts, from the roster. A row with `cohorts` tags each cohort's
       anchor draw by index; a single cohort keeps the profile's own tag. */
    const anchorsAt={
      /* First anchor: the hole the animal keeps open. */
      alligatorHole:(row,i,tag)=>{
        const h=ALLIGATOR_HOLES[i];
        return h?[{x:h.x,y:h.y,site:lifeSiteAt(h.x,h.y),score:1},
                  ...candidateAnchors(row.profile,2,tag)]:null;
      },
      /* One adult is on the nest (the pole draws it). The other anchors at
         the foot of the pole, then on the first sward the grower cuts, then
         on the best margin. */
      nestPole:(row,i,tag)=>{
        const pole=STEADING.find((q)=>q.kind==='nestPole');
        const cut=useNodes.find((q)=>q.kind==='sward');
        const fixed=[pole&&{x:pole.x+22,y:pole.y+12},cut&&{x:cut.x,y:cut.y}]
          .filter(Boolean)
          .map((q)=>({x:q.x,y:q.y,site:lifeSiteAt(q.x,q.y),score:1}));
        return [...fixed,...candidateAnchors(row.profile,3-fixed.length||1,tag)];
      },
      /* The herd anchors on the camp pen first, then its browse sites. */
      camp:(row)=>{
        const camp=STEADING.find((q)=>q.kind==='tent');
        if(!camp)return null;
        const penNode=useNodes.find((q)=>q.id==='tent-camp:pen');
        const pen=penNode||{x:camp.x+40,y:camp.y+18};
        return [{x:pen.x,y:pen.y,site:lifeSiteAt(pen.x,pen.y),score:1},
                ...candidateAnchorsAround(row.profile,2,{x:camp.x,y:camp.y},150,420,300)];
      },
      /* Cohort i keeps to the i-th place of the row's kinds. A place is a
         ground circle, so its rows span 0.6 of its radius. Its near side
         comes first: a set piece at the centre hides a body behind it. */
      place:(row,i,tag)=>{
        const p=POI.filter((q)=>row.kinds.includes(q.kind))[i];
        return p?candidateAnchorsAround(row.profile,3,p,0,p.r,p.r*0.6,
          {x:p.x,y:p.y+p.r*0.3},tag):null;
      },
      /* Cohort i keeps to the i-th pool of the cavern's plan. A pool is rx
         wide and half as deep on screen (cavePoolAt). */
      gour:(row,i,tag)=>{
        const p=CAVERN?.pools[i];
        return p?candidateAnchorsAround(row.profile,3,p,0,p.rx,p.rx*0.5,p,tag):null;
      },
    };
    for(const row of ROSTER[BIOME].cohorts){
      const form=row.forms
        ?(keyedRandom(seed,SCENE_ID,row.profile,'social')<row.forms[0].p?row.forms[0]:row.forms[1])
        :null;
      const members=form?form.members
        :Array.isArray(row.members)
          ?keyedInt(seed,row.members[0],row.members[1],SCENE_ID,row.profile,'count')
          :row.members||1;
      for(let i=0;i<(row.cohorts||1);i++){
        const tag=row.cohorts?`${row.profile}:${i}`:row.profile;
        const anchors=row.at?anchorsAt[row.at](row,i,tag):candidateAnchors(row.profile,3,tag);
        if(anchors)addCohort(row.profile,i,members,anchors,form?form.form:null);
      }
    }
    /* Route-tradition machines: one individual each, on a three-marker route
       near the common or the pond court. */
    for(const row of ROSTER[BIOME].individuals){
      const profileId=row.profile;
      const origin=row.origin==='pondCourt'&&POND_COURT?POND_COURT:COMMON;
      const preferred=row.preferDX===undefined?origin:{x:COMMON.x+row.preferDX,y:COMMON.y};
      const anchors=candidateAnchorsAround(profileId,3,origin,70,210,row.maxYDelta,
        preferred,`${profileId}:route-tradition`);
      const anchor=anchors[0];
      if(!anchor)continue;
      const nodes=anchors.map((q,i)=>({
        id:`${SCENE_ID}:${profileId}:route:${i}`,kind:'route-marker',
        x:q.x,y:q.y,siteId:q.site.id,patchId:q.site.patchId,
      }));
      useNodes.push(...nodes);
      const id=`${SCENE_ID}:individual:${profileId}`;
      individuals.push({
        id,profileId,sceneId:SCENE_ID,memberIds:[id],
        anchor:{x:anchor.x,y:anchor.y,siteId:anchor.site.id,patchId:anchor.site.patchId},
        position:{x:anchor.x,y:anchor.y},social:{form:'stigmergic-route-tradition'},
        appearance:{variant:0},
        route:{nodeIds:nodes.map((q)=>q.id),from:0,to:Math.min(1,nodes.length-1)},
        agenda:agendaFor(profileId,nodes),nextEventAt:0,
      });
    }

    for(const cu of cultures)for(const row of cu.residents){
      const homeCandidates=useNodes.filter((q)=>q.id.startsWith(row.home)||q.id.includes(row.home));
      const anchor=(row.anchorKind&&homeCandidates.find((q)=>q.kind===row.anchorKind))
        ||homeCandidates[0]||useNodes.find((q)=>q.kind==='gathering')||useNodes[0];
      const project={id:row.project,index:0,completed:[]};
      const householdIds=cu.households.filter((q)=>q.members.includes(row.id)).map((q)=>q.id);
      const workGroups=cu.workGroups.filter((q)=>q.members.includes(row.id));
      const ties=cu.ties.filter((q)=>q.a===row.id||q.b===row.id);
      const placeStates=Object.fromEntries(useNodes
        .filter((q)=>Object.values(row.nodeBindings).flat().includes(q.id))
        .map((q)=>[q.id,q.state||'available']));
      residents.push({
        id:`person:${row.id}`,profileId:row.id,sceneId:SCENE_ID,
        memberIds:[`person:${row.id}`],anchor:{x:anchor.x,y:anchor.y,nodeId:anchor.id},
        position:{x:anchor.x,y:anchor.y},nodeBindings:row.nodeBindings,
        social:{form:LIFE[row.id].social.form},project,
        placeStates,practices:row.practices,householdIds,
        workGroupIds:workGroups.map((q)=>q.id),
        duties:[...new Set(workGroups.flatMap((q)=>q.duties)
          .concat(ties.flatMap((q)=>q.obligations)))],
        ties,
        appearance:{colorway:keyedInt(seed,0,2,row.id,'appearance')},
        agenda:row.schedule.map((q)=>({action:q.action,
          targetId:row.nodeBindings[q.nodeKind]?.[0]||null,
          duration:Math.max(15,Math.min(90,q.end-q.start))})),
        nextEventAt:0,
      });
    }

    const roster=[...cohorts,...individuals,...residents]
      .sort((a,b)=>a.id.localeCompare(b.id));
    LIFE_PLAN=Object.freeze({
      version:1,sceneId:SCENE_ID,biome:BIOME,
      cohorts:Object.freeze(cohorts),individuals:Object.freeze(individuals),
      residents:Object.freeze(residents),useNodes:Object.freeze(useNodes),
      culture,roster:Object.freeze(roster),
    });
    return LIFE_PLAN;
  };

  /* Moving life asks the site sample that placement and disturbance use, so
     plan, movement and diagnostics agree. */
  const entityAffordance=(spec,wx,wy)=>{
    const profile=typeof spec==='string'?LIFE[spec]
      :spec?.identity?spec
      :spec?.profileId?LIFE[spec.profileId]
      :LIFE[spec?.key];
    if(!profile)return false;
    const site=lifeSiteAt(wx,wy);
    /* Human place bindings use authored nodes; this gate only checks the
       medium. */
    if(profile.identity.class==='human-person')
      return profile.conditions.medium.includes(site.conditions.medium);
    return profileSuitability(profile,site)>0;
  };

  return {
    lifePatchId, lifeSiteId, lifeSiteAt, profileSuitability, occupancyInput,
    lifePatchAt, resourceWebAt, encounterAt, compileLifePlans,
    entityAffordance,
  };
}

export { LIFE_PATCH_SIZE, LIFE_SITE_SIZE, makeLifeField };
