import { LIFE } from './life.js';
import { clamp } from './math.js';

const DISTURBANCE_VERSION=1;
const DISTURBANCE_TYPES=Object.freeze([
  'cutting','traffic','noise','construction','flood','drawdown','fire','grazing',
  'foodSubsidy','machinePressure','repeatedPresence','sandBurial',
]);

/* Stage times are authored world minutes. Values are deviations from static
   compiler fields, so generated terrain remains pure and snapshots stay small. */
const DISTURBANCE_STAGES=Object.freeze({
  cutting:Object.freeze([
    stage(0,'opened',{coneMast:-0.72,browse:-0.18,snowShelter:-0.36,
      deadwood:0.22,rooting:0.06},{},{humanTraffic:0.46,activeWork:0.92},
      ['stumps','slash','retained-seed-trees']),
    stage(3*1440,'release',{coneMast:-0.58,browse:0.30,snowShelter:-0.22,
      deadwood:0.28,rooting:0.24},{},{humanTraffic:0.12,activeWork:0},
      ['stumps','slash','retained-seed-trees','seed-bank']),
    stage(30*1440,'dense-regrowth',{coneMast:-0.34,browse:0.38,snowShelter:0.16,
      deadwood:0.20,rooting:0.18},{},{humanTraffic:0.04,activeWork:0},
      ['stumps','deadwood','seed-bank','regrowth']),
    stage(180*1440,'recovering',{coneMast:-0.12,browse:0.16,snowShelter:0.10,
      deadwood:0.12,rooting:0.08},{},{humanTraffic:0.02,activeWork:0},
      ['old-stumps','deadwood','mature-seed-trees']),
  ]),
  drawdown:Object.freeze([
    stage(0,'drawn-down',{shallowPrey:0.34,bask:0.30},
      {depth:-0.28,hydroperiod:-0.12},{humanTraffic:0.04},['old-water-mark','exposed-bank']),
    stage(10*1440,'drying-margin',{shallowPrey:-0.18,bask:0.18},
      {depth:-0.42,hydroperiod:-0.22},{},['old-water-mark','drying-mud']),
  ]),
  flood:Object.freeze([
    stage(0,'flooded',{shallowPrey:0.18,bask:-0.20},
      {depth:0.34,hydroperiod:0.12},{},['high-water-mark','drift-line']),
    stage(7*1440,'receding',{shallowPrey:0.24,bask:0.10},
      {depth:0.10,hydroperiod:0.04},{},['high-water-mark','drift-line']),
  ]),
  traffic:Object.freeze([
    stage(0,'trafficked',{}, {},{humanTraffic:0.28},['compacted-route']),
    stage(2*1440,'traffic-fading',{}, {},{humanTraffic:0.08},['compacted-route']),
  ]),
  repeatedPresence:Object.freeze([
    stage(0,'familiar-traffic',{}, {},{humanTraffic:0.20},['compacted-route']),
  ]),
  noise:Object.freeze([
    stage(0,'noisy',{}, {},{humanTraffic:0.34,activeWork:0.30},[]),
    stage(120,'quieting',{}, {},{humanTraffic:0.05,activeWork:0},[]),
  ]),
  construction:Object.freeze([
    stage(0,'construction',{deadwood:-0.14},{},{humanTraffic:0.62,activeWork:0.86},
      ['compacted-route','material-stack']),
    stage(14*1440,'built',{deadwood:-0.10},{},{humanTraffic:0.30,activeWork:0},
      ['compacted-route','foundation','material-offcuts']),
  ]),
  fire:Object.freeze([
    stage(0,'burned',{coneMast:-0.90,browse:-0.64,deadwood:0.44,
      rooting:-0.18},{},{activeWork:0.18},['char','snags','ash','seed-bank']),
    stage(90*1440,'fire-release',{coneMast:-0.70,browse:0.42,deadwood:0.32,
      rooting:0.20},{},{},['char','snags','seed-bank','regrowth']),
  ]),
  grazing:Object.freeze([
    stage(0,'grazed',{browse:-0.24,reedCover:-0.18},{},{humanTraffic:0.08},
      ['cropped-margin','dung']),
  ]),
  foodSubsidy:Object.freeze([
    stage(0,'subsidized',{rooting:0.36,shallowPrey:0.20},{},{humanTraffic:0.24},
      ['food-remains']),
    stage(1440,'subsidy-fading',{rooting:0.08,shallowPrey:0.04},{},{humanTraffic:0.08},
      ['food-remains']),
  ]),
  machinePressure:Object.freeze([
    stage(0,'machine-route',{browse:-0.08},{},{machinePressure:0.54},
      ['pressure-print','compacted-route']),
  ]),
  /* A storm is a disturbance. Blowing sand buries the windward side of
     anything that stands and scours the lee. It removes the record first: a
     footprint is a few millimetres deep and one hour of drift is more, so a
     trace here expires. Stage times are the storm and then the days after
     it. */
  sandBurial:Object.freeze([
    stage(0,'blowing',{desertShade:-0.30,desertForage:-0.44},{},
      {humanTraffic:-0.40,activeWork:-0.72},['drift','scour-hollow','buried-track']),
    stage(720,'settling',{desertShade:-0.10,desertForage:-0.18},{},
      {humanTraffic:-0.10,activeWork:-0.20},['drift','scour-hollow','fresh-ripple']),
    stage(6*1440,'reworked',{desertForage:-0.06},{},{},
      ['drift','fresh-ripple']),
  ]),
});

function stage(after,succession,resourceDelta={},conditionDelta={},risk={},legacies=[]){
  return Object.freeze({after,succession,resourceDelta:Object.freeze(resourceDelta),
    conditionDelta:Object.freeze(conditionDelta),risk:Object.freeze(risk),
    legacies:Object.freeze(legacies)});
}

function scaledStage(row,intensity,at){
  const scale=(values)=>Object.fromEntries(Object.entries(values)
    .map(([key,value])=>[key,value*intensity]));
  return {
    at,succession:row.succession,resourceDelta:scale(row.resourceDelta),
    conditionDelta:scale(row.conditionDelta),
    humanTraffic:(row.risk.humanTraffic||0)*intensity,
    activeWork:(row.risk.activeWork||0)*intensity,
    machinePressure:(row.risk.machinePressure||0)*intensity,
    legacies:[...row.legacies],
  };
}

function mergeDisturbanceDeviation(current,type,effect,countVisit=false){
  const effects={...(current?.effects||{}),[type]:effect};
  const resourceDelta={},conditionDelta={},legacies=new Set();
  let humanTraffic=0,activeWork=0,machinePressure=0,latest=null;
  for(const row of Object.values(effects)){
    for(const [key,value] of Object.entries(row.resourceDelta||{}))
      resourceDelta[key]=(resourceDelta[key]||0)+value;
    for(const [key,value] of Object.entries(row.conditionDelta||{}))
      conditionDelta[key]=(conditionDelta[key]||0)+value;
    for(const legacy of row.legacies||[])legacies.add(legacy);
    humanTraffic=Math.max(humanTraffic,row.humanTraffic||0);
    activeWork=Math.max(activeWork,row.activeWork||0);
    machinePressure=Math.max(machinePressure,row.machinePressure||0);
    if(!latest||(row.at||0)>(latest.at||0))latest=row;
  }
  return {
    version:DISTURBANCE_VERSION,effects,
    succession:latest?.succession||current?.succession||'mature',
    resourceDelta,conditionDelta,humanTraffic,activeWork,machinePressure,
    legacies:[...legacies].sort(),
    visits:(current?.visits||0)+(countVisit&&
      (type==='traffic'||type==='repeatedPresence')?1:0),
  };
}

function applyDisturbance(session,gen,input){
  if(!DISTURBANCE_TYPES.includes(input.type))
    throw new Error(`unknown disturbance '${input.type}'`);
  const intensity=clamp(Number(input.intensity??1),0,1);
  const patchId=input.patchId||gen.lifePatchId(input.x,input.y);
  const now=input.at??session.clock.minute;
  const stages=DISTURBANCE_STAGES[input.type]||[
    stage(0,input.type,{}, {},{humanTraffic:0.1},[]),
  ];
  const immediate=scaledStage(stages[0],intensity,now);
  const current=session.deviations.get(patchId);
  const value=mergeDisturbanceDeviation(current,input.type,immediate,true);
  session.setDeviation(patchId,value);
  const event=session.addDisturbance({
    id:input.id,type:input.type,patchId,intensity,at:now,
    sourceId:input.sourceId||null,observed:input.observed!==false,
    succession:immediate.succession,legacies:immediate.legacies,
  });
  for(const legacy of immediate.legacies)session.addTrace({
    id:`${event.id}:legacy:${legacy}`,kind:legacy,patchId,
    x:input.x,y:input.y,at:now,persistent:true,
  });
  for(let i=1;i<stages.length;i++){
    const effect=scaledStage(stages[i],intensity,now+stages[i].after);
    session.schedule({
      id:`${event.id}:stage:${i}`,at:effect.at,type:'disturbance-transition',
      patchId,effectType:input.type,effect,
    });
  }
  return {event,deviation:value,responses:speciesResponses(gen,input.type,
    input.x,input.y,current,value)};
}

function speciesResponses(gen,type,x,y,beforeDeviation,afterDeviation){
  if(!Number.isFinite(x)||!Number.isFinite(y))return [];
  const patchId=gen.lifePatchId(x,y);
  const beforeState=beforeDeviation?new Map([[patchId,beforeDeviation]]):null;
  const afterState=new Map([[patchId,afterDeviation]]);
  const beforeSite=gen.lifeSiteAt(x,y,beforeState);
  const afterSite=gen.lifeSiteAt(x,y,afterState);
  return Object.entries(LIFE)
    .filter(([,profile])=>profile.biomes.includes(gen.biome)&&profile.disturbance[type])
    .map(([profileId,profile])=>{
      const before=gen.occupancyInput(profile,beforeSite).input;
      const after=gen.occupancyInput(profile,afterSite).input;
      return {profileId,response:profile.disturbance[type],
        before,after,direction:after>before+0.02?'increase':after<before-0.02?'decrease':'timing-or-context'};
    });
}

function recordTravellerPresence(session,gen,x,y,sourceId='person:traveller'){
  const patchId=gen.lifePatchId(x,y),current=session.deviations.get(patchId);
  const visits=current?.visits||0;
  return applyDisturbance(session,gen,{
    type:visits>=2?'repeatedPresence':'traffic',x,y,patchId,
    intensity:clamp(0.18+visits*0.04,0.18,0.42),sourceId,
  });
}

export {
  DISTURBANCE_STAGES, DISTURBANCE_TYPES, DISTURBANCE_VERSION,
  applyDisturbance, mergeDisturbanceDeviation, recordTravellerPresence,
  speciesResponses,
};
