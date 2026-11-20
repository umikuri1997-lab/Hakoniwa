import {
  ACTION_AFFORDANCES, LIFE, actionSiteAffinity, drivePriority, responseAt,
} from './life.js';
import { clamp } from './math.js';
import { keyedInt, keyedRandom } from './rng.js';

const BEHAVIOR_LIMITS=Object.freeze({
  observationsPerActor:12,candidatesPerDecision:8,targetSitesPerAction:6,
});

const REACTIVE=new Set([
  'orient','freeze','flee','hide','submerge','hold','display','defend','withdraw',
  'approach-traveller','greet','follow-traveller',
]);
const RESTFUL=new Set(['rest','sit','bask','float','observe']);

function positionOf(subject){return subject.position||{x:subject.x,y:subject.y};}

function socialAggregate(record,realized=[]){
  const members=realized.filter((q)=>q.lifeId===record.id||q.id===record.id);
  if(!members.length)return {
    form:record.social?.form||LIFE[record.profileId]?.social.form,
    size:record.memberIds?.length||1,realized:0,centre:positionOf(record),spread:0,
  };
  const centre={
    x:members.reduce((n,q)=>n+positionOf(q).x,0)/members.length,
    y:members.reduce((n,q)=>n+positionOf(q).y,0)/members.length,
  };
  const spread=Math.max(...members.map((q)=>Math.hypot(
    positionOf(q).x-centre.x,positionOf(q).y-centre.y)));
  return {form:record.social?.form||LIFE[record.profileId]?.social.form,
    size:record.memberIds?.length||members.length,realized:members.length,
    centre,spread,commitment:record.commitment?.action||null};
}

/* Observers receive channel facts, not subject objects. Uncertainty is keyed so
   another observer or iteration order cannot move an estimated position. */
function observeActor(observer,subjects,context={}){
  const profile=LIFE[observer.profileId],origin=positionOf(observer);
  if(!profile)return [];
  const out=[];
  for(const subject of subjects){
    if(subject.id===observer.id||subject.lifeId===observer.id)continue;
    const target=positionOf(subject),dx=target.x-origin.x,dy=target.y-origin.y;
    const distance=Math.hypot(dx,dy),site=context.siteAt?.(target.x,target.y);
    const cover=site?.conditions?.cover||0;
    const moving=!!subject.moving;
    const sight=profile.perception.sight;
    const sightRange=sight?sight.range*(1-cover*(moving?0.42:0.68)):0;
    if(sight&&distance<=sightRange){
      const uncertainty=sight.uncertainty*(0.25+0.75*distance/Math.max(1,sightRange));
      const angle=keyedRandom(context.seed||0,observer.id,subject.id,
        observer.decisionIndex||0,'sight-uncertainty')*Math.PI*2;
      const error=distance*uncertainty;
      out.push({kind:'sight',subjectId:subject.id||subject.lifeId,
        subjectKind:subject.kind||subject.profileId||'unknown',
        distance,confidence:clamp(1-distance/Math.max(1,sightRange),0.08,1),
        position:{x:target.x+Math.cos(angle)*error,y:target.y+Math.sin(angle)*error},
        moving,at:context.now||0});
    }
    const sound=profile.perception.sound;
    const loudness=subject.noise===undefined?(moving?0.55:0):subject.noise;
    const soundRange=sound?sound.range*loudness:0;
    if(sound&&loudness>0&&distance<=soundRange)
      out.push({kind:'sound',subjectId:subject.id||subject.lifeId,
        subjectKind:subject.kind||subject.profileId||'unknown',
        distance,confidence:clamp(loudness-distance/Math.max(1,soundRange),0.05,1),
        bearing:Math.atan2(dy,dx),moving,at:context.now||0});
    const scent=profile.perception.scent;
    if(scent&&distance<=scent.range){
      const wind=context.wind||{x:0,y:0},windM=Math.hypot(wind.x,wind.y);
      const downwind=windM<1e-6?0.5:clamp((dx*wind.x+dy*wind.y)/
        Math.max(1e-6,distance*windM)*0.5+0.5,0,1);
      if(downwind>0.35)out.push({kind:'scent',subjectId:subject.id||subject.lifeId,
        subjectKind:subject.kind||subject.profileId||'unknown',
        distance,confidence:clamp((1-distance/scent.range)*downwind,0.04,1),
        bearing:Math.atan2(dy,dx),at:context.now||0});
    }
  }
  out.sort((a,b)=>b.confidence-a.confidence||a.distance-b.distance||
    String(a.subjectId).localeCompare(String(b.subjectId))||a.kind.localeCompare(b.kind));
  return out.slice(0,BEHAVIOR_LIMITS.observationsPerActor);
}

function riskFromObservations(profileOrId,observations,context={}){
  const profile=typeof profileOrId==='string'?LIFE[profileOrId]:profileOrId;
  const range=profile?.perception?.sight?.range||100;
  let perceived=0,nearest=null;
  for(const q of observations||[]){
    if(q.subjectKind!=='traveller'&&q.subjectId!=='person:traveller')continue;
    const value=clamp((1-q.distance/range)*0.72+q.confidence*0.42,0,1);
    if(value>perceived){perceived=value;nearest=q;}
  }
  perceived=clamp(perceived+(context.disturbanceRisk||0),0,1);
  const defend=!!context.defendContext;
  return {
    fear:perceived,
    aggression:defend?clamp(perceived+(context.defendValue||0.12),0,1):0,
    source:nearest,
  };
}

function transitionResponses(record,profileOrId,risk){
  const profile=typeof profileOrId==='string'?LIFE[profileOrId]:profileOrId;
  const before=record.responseState||{fear:false,aggression:false};
  const fear=responseAt(profile,'fear',risk.fear,before.fear);
  const aggression=responseAt(profile,'aggression',risk.aggression,before.aggression);
  return {fear,aggression,changed:fear!==before.fear||aggression!==before.aggression};
}

function categoryCandidates(record,context){
  const profile=LIFE[record.profileId],now=context.now||0;
  const response=context.response||{fear:false,aggression:false};
  const interrupted=context.interrupt===true||
    (response.fear||response.aggression)&&record.commitment?.interruptible!==false;
  if(record.commitment&&record.commitment.endsAt>now&&!interrupted)
    return {category:'continue',candidates:[{...record.commitment,continued:true}]};
  if(response.fear){
    const actions=profile.fear.actions.filter((q)=>profile.actions.includes(q)&&
      (q!=='submerge'||context.submergeTargetId));
    const selected=response.changed&&actions.includes('orient')?['orient']
      :actions.includes('flee')?['flee']
      :actions.includes('submerge')?['submerge']
      :actions.includes('withdraw')?['withdraw']
      :actions.length?actions:['orient'];
    return {category:'safety',candidates:selected.map((action)=>({action,
      targetId:(action==='submerge'?context.submergeTargetId:context.escapeTargetId)||null,
      reason:'perceived-risk'}))};
  }
  if(response.aggression){
    const actions=profile.aggression.actions.filter((q)=>profile.actions.includes(q));
    return {category:'defence',candidates:actions.map((action)=>({action,
      targetId:context.defendTargetId||null,reason:'defend-context'}))};
  }
  if(context.coupledCommitment)
    return {category:'coupled',candidates:[context.coupledCommitment]};
  if(context.scheduledAction)
    return {category:'schedule',candidates:[context.scheduledAction]};
  if(context.projectAction)
    return {category:'project',candidates:[context.projectAction]};
  const primary=profile.actions.filter((q)=>!REACTIVE.has(q));
  return {category:'drive',candidates:primary.map((action)=>({action,
    score:drivePriority(profile,action)*0.08,reason:'drive'}))};
}

function targetCandidates(action,record,context){
  const profile=LIFE[record.profileId],nodes=context.nodes||[];
  const current=positionOf(record);
  const matching=nodes.map((q)=>{
    if(q.actions&& !q.actions.includes(action))return false;
    const site=context.siteAt?.(q.x,q.y);
    if(site&&context.suitabilityAt&&context.suitabilityAt(profile,site)<=0)return null;
    const affinity=actionSiteAffinity(profile,action,site);
    return affinity<0?null:{q,site,affinity};
  }).filter(Boolean).slice(0,BEHAVIOR_LIMITS.targetSitesPerAction);
  if(!matching.length)return ACTION_AFFORDANCES[action]?[]
    :[{action,targetId:null,score:RESTFUL.has(action)?0.45:0.12}];
  return matching.map(({q,site,affinity})=>{
    const distance=Math.hypot(q.x-current.x,q.y-current.y);
    const quiet=site?.conditions?.quiet??0.5;
    return {action,targetId:q.id,target:{x:q.x,y:q.y},
      score:affinity*0.52+quiet*0.18+1/(1+distance/80)*0.30};
  });
}

function eligibleActions(record,context={}){
  const group=categoryCandidates(record,context);
  if(group.category==='continue')return group;
  const expanded=[];
  for(const candidate of group.candidates){
    const targets=candidate.targetId!==undefined
      ?[candidate]
      :targetCandidates(candidate.action,record,context)
        .map((q)=>({...candidate,...q,score:(candidate.score||0)+(q.score||0)}));
    expanded.push(...targets);
  }
  expanded.sort((a,b)=>(b.score||0)-(a.score||0)||
    String(a.action).localeCompare(String(b.action))||
    String(a.targetId).localeCompare(String(b.targetId)));
  return {category:group.category,
    candidates:expanded.slice(0,BEHAVIOR_LIMITS.candidatesPerDecision)};
}

function chooseAction(record,context={},eligible=eligibleActions(record,context)){
  if(eligible.category==='continue')return eligible.candidates[0];
  if(!eligible.candidates.length)return {action:'rest',targetId:null,reason:'fallback'};
  const best=eligible.candidates[0].score||0;
  const peers=eligible.candidates.filter((q)=>Math.abs((q.score||0)-best)<0.035);
  const index=keyedInt(context.seed||0,0,peers.length-1,
    record.id,record.decisionIndex||0,eligible.category,'action');
  return {...peers[index],category:eligible.category};
}

function commitAction(record,choice,context={}){
  if(choice.continued)return choice;
  const now=context.now||0;
  const duration=context.durationFor?.(choice.action,record)||
    (RESTFUL.has(choice.action)?18:28)+keyedInt(context.seed||0,0,24,
      record.id,record.decisionIndex||0,choice.action,'dwell');
  return {
    action:choice.action,targetId:choice.targetId||null,
    target:choice.target||null,reason:choice.reason||choice.category||'fallback',
    startedAt:now,endsAt:now+duration,
    interruptible:choice.interruptible!==false,
  };
}

function decide(record,context={}){
  const observations=context.observations||[];
  const risk=riskFromObservations(record.profileId,observations,context);
  const response=transitionResponses(record,LIFE[record.profileId],risk);
  const eligible=eligibleActions(record,{...context,response});
  const choice=chooseAction(record,{...context,response},eligible);
  return {
    observations,risk,response,choice,candidateCount:eligible.candidates.length,
    commitment:commitAction(record,choice,context),
  };
}

export {
  BEHAVIOR_LIMITS, REACTIVE, categoryCandidates, chooseAction, commitAction,
  decide, eligibleActions, observeActor, riskFromObservations,
  socialAggregate, targetCandidates, transitionResponses,
};
