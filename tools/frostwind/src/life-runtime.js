import {
  anticipationFrame, createAttentionState, figureViewFromHeading,
  setAttentionTarget, updateAttention,
} from './attention.js';
import { decide, observeActor, REACTIVE, riskFromObservations, socialAggregate,
         transitionResponses } from './behavior.js';
import { RESIDENTS, activeSchedule } from './culture.js';
import { applyDisturbance } from './disturbance.js';
import { ACTOR } from './fauna.js';
import { CAST_BY_KEY, folkFootWorld, folkStrikes, gaitFrames, heightPx } from './people.js';
import { LIFE } from './life.js';
import { clamp } from './math.js';
import { keyedRandom } from './rng.js';

const RUNTIME_LIMITS=Object.freeze({
  activeActors:24,semanticDecisionsPerStep:8,observationsPerStep:96,
  candidatesPerStep:64,
  activationRadiusX:704,activationRadiusY:468,deactivationScale:1.28,
  tracesPerStep:12,
});
const MACHINE_COMPANION=Object.freeze({
  noticeRadius:160,greetRadius:58,abandonRadius:230,followDistance:46,
  approachMinutes:18,greetMinutes:4,followMinutes:18,cooldownMinutes:120,
});
const FRIENDLY_ACTIONS=new Set(['approach-traveller','greet','follow-traveller']);
/* A body states its own companion distances where its law sets them
   (src/shadeguest.js); the machines' row is the default. */
const companionOf=(key)=>ACTOR[key]?.companion||MACHINE_COMPANION;
/* The point `gap` short of `to` on the way from `from`. A companion's
   semantic route ends where its body stops. Measured: a route that ran on to
   the walker's own position put a stork inside its own fear radius, and it
   fled every following. */
const shortOf=(from,to,gap)=>{
  const d=Math.hypot(to.x-from.x,to.y-from.y);
  if(d<=gap)return {x:from.x,y:from.y};
  return {x:from.x+(to.x-from.x)*(d-gap)/d,y:from.y+(to.y-from.y)*(d-gap)/d};
};
/* Identity of a commitment: a route and an actor each remember the one they serve. */
const keyOf=(commitment)=>commitment
  ?[commitment.startedAt,commitment.action,commitment.targetId||''].join(':'):null;

const STILL_ACTIONS=new Set([
  'rest','sit','bask','float','observe','orient','freeze','hide','hold','greet',
  'display','defend','attend-stall','tend-hearth','inspect-storage',
  'unpack','repack','split-fuel','stack-fuel','inspect-trap',
  'tend-rack','inspect-winch','repair-boardwalk','record-water-mark',
]);

function expressionIntent(profile,action,actor){
  const candidates=[
    actor.motionState==='prepare'?'prepare':null,
    action==='orient'||action==='observe'?'look':null,
    action,
    actor.motionState,
    actor.moving?'walk':'idle',
    'idle',
  ];
  return candidates.find((q)=>q&&profile.expressions.includes(q))||
    profile.expressions[0];
}

class LifeRuntime{
  constructor(session,gen,sceneId,options={}){
    this.session=session;this.gen=gen;this.sceneId=sceneId;
    this.options=options;
    this.plan=gen.compileLifePlans();
    this.nodes=new Map(this.plan.useNodes.map((q)=>[q.id,q]));
    this.actors=new Map();
    /* Member ids the world holds a body for. A ridden camel is out of the herd
       but not out of its record, so streaming must not build a second one. */
    this.detached=new Set();
    this.metrics={activeActors:0,decisions:0,observations:0,
      candidates:0,materialized:0,dematerialized:0,traces:0};
    this.installPlan();
  }

  installPlan(){
    for(const input of this.plan.roster){
      const existing=this.session.record(input.id);
      if(existing){
        /* Static bindings regenerate from seed; semantic progress remains. */
        existing.nodeBindings=input.nodeBindings||existing.nodeBindings;
        existing.agenda=input.agenda||existing.agenda;
        continue;
      }
      const record=this.session.addRecord(input);
      this.session.initializeRecord(record.id,this.session.clock.minute);
    }
  }

  records(){return [...this.session.records.values()].filter((q)=>q.sceneId===this.sceneId);}

  node(id){return id?this.nodes.get(id)||null:null;}

  positionAt(record,at=this.session.clock.minute){
    const route=record.route;
    if(!route)return {...record.position};
    if(!Number.isFinite(route.startedAt)||!Number.isFinite(route.arrivesAt))
      return {...record.position};
    if(route.fromPosition&&route.toPosition){
      const t=clamp((at-route.startedAt)/Math.max(1e-6,route.arrivesAt-route.startedAt),0,1);
      return {
        x:route.fromPosition.x+(route.toPosition.x-route.fromPosition.x)*t,
        y:route.fromPosition.y+(route.toPosition.y-route.fromPosition.y)*t,
      };
    }
    const ids=route.nodeIds||[],a=this.node(ids[route.from]),b=this.node(ids[route.to]);
    if(!a||!b)return {...record.position};
    const t=clamp((at-route.startedAt)/Math.max(1e-6,route.arrivesAt-route.startedAt),0,1);
    return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  }

  syncRoute(record,at=this.session.clock.minute){
    const commitment=record.commitment;
    const commitmentKey=keyOf(commitment);
    if(!commitment||record.route?.commitmentKey===commitmentKey)return;
    const target=commitment.target||this.node(commitment.targetId);
    const current=this.positionAt(record,at);
    record.position=current;
    if(!target||STILL_ACTIONS.has(commitment.action)){
      if(record.route)
        record.routeProgress=clamp((at-record.route.startedAt)/
          Math.max(1e-6,record.route.arrivesAt-record.route.startedAt),0,1);
      record.route=null;
      return;
    }
    const F=ACTOR[LIFE[record.profileId].morphology]||ACTOR[record.profileId];
    const distance=Math.hypot(target.x-current.x,target.y-current.y);
    const available=Math.max(1,commitment.endsAt-commitment.startedAt);
    const travelMinutes=Math.min(available*0.76,
      Math.max(1,distance/Math.max(1,(F?.speed||12)*3)));
    record.route={
      fromPosition:current,toPosition:{x:target.x,y:target.y},
      startedAt:commitment.startedAt,arrivesAt:commitment.startedAt+travelMinutes,
      commitmentStartedAt:commitment.startedAt,commitmentKey,
      targetId:commitment.targetId||null,
    };
  }

  activationCandidates(px,py,W,H){
    const rows=[];
    for(const record of this.records()){
      this.syncRoute(record);
      const position=this.positionAt(record);
      let dx=Math.abs(position.x-px),dy=Math.abs(position.y-py);
      const active=this.actors.has(record.id);
      /* An active record is where its bodies are. The semantic point travels a
         commitment route in minutes and can be seven hundred pixels ahead of
         the drawn herd, so deactivating on the point deletes bodies in view.
         Measured: three camels, on screen, gone in one frame. While bodies
         exist, the nearest one holds the record active. */
      if(active)for(const a of this.actors.get(record.id)||[]){
        const adx=Math.abs(a.x-px),ady=Math.abs(a.y-py);
        if(Math.hypot(adx,ady)<Math.hypot(dx,dy)){dx=adx;dy=ady;}
      }
      const scale=active?RUNTIME_LIMITS.deactivationScale:1;
      if(dx<=RUNTIME_LIMITS.activationRadiusX*scale&&
         dy<=RUNTIME_LIMITS.activationRadiusY*scale)
        rows.push({record,position,distance:Math.hypot(dx,dy),active});
    }
    rows.sort((a,b)=>a.distance-b.distance||a.record.id.localeCompare(b.record.id));
    return rows;
  }

  reconcile(px,py,W,H){
    const candidates=this.activationCandidates(px,py,W,H);
    const wanted=new Set();let actorBudget=0;
    for(const row of candidates){
      const members=row.record.memberIds?.length||1;
      if(actorBudget+members>RUNTIME_LIMITS.activeActors)continue;
      wanted.add(row.record.id);actorBudget+=members;
      if(!this.actors.has(row.record.id))this.materialize(row.record,row.position);
    }
    for(const id of [...this.actors.keys()])if(!wanted.has(id))this.dematerialize(id);
    this.metrics.activeActors=[...this.actors.values()].reduce((n,a)=>n+a.length,0);
    return this.actorList();
  }

  materialize(record,position){
    const profile=LIFE[record.profileId],F=ACTOR[profile.morphology]||ACTOR[record.profileId];
    if(!F)return [];
    /* an encounter does not outlast the body's absence */
    if(!FRIENDLY_ACTIONS.has(record.commitment?.action))record.friendlyStage=null;
    const roster=(record.memberIds?.length?record.memberIds:[record.id])
      .filter((memberId)=>!this.detached.has(memberId));
    const members=roster.map((memberId,i)=>{
      const angle=keyedRandom(this.session.seed,memberId,'member-offset')*Math.PI*2;
      const radius=i===0?0:8+i*5;
      const target=record.commitment?.target||this.node(record.commitment?.targetId);
      const heading=target?Math.atan2((target.y-position.y)/0.66,target.x-position.x):angle;
      const actor={
        id:memberId,lifeId:record.id,profileId:record.profileId,key:profile.morphology,
        x:position.x+Math.cos(angle)*radius,y:position.y+Math.sin(angle)*radius*0.66,
        hx:Math.cos(heading),hy:Math.sin(heading),gx:target?.x,gy:target?.y,
        gait:keyedRandom(this.session.seed,memberId,'gait')*4,
        acc:0,flip:Math.cos(heading)<0,
        moving:false,motionState:F.restState||'idle',
        preparePhase:0,prepareLeft:0,greetPhase:0,
        expressionIntent:profile.expressions.includes('idle')?'idle':profile.expressions[0],
        attend:null,attention:F.figure?createAttentionState():null,
        look:'neutral',responseState:{fear:false,aggression:false},
        semanticAction:record.commitment?.action||'rest',
        lastCommitmentStart:record.commitment?.startedAt??-1,
        lastCommitmentKey:keyOf(record.commitment),
        ramp:F.ramp,sMin:F.sMin,sMax:F.sMax,
      };
      /* `record.appearance.colorway` is semantic identity, assigned in
         worldgen.js. Nothing reads it into a ramp. */
      if(F.figure&&target){
        actor.attend={x:target.x,y:target.y,z:0,kind:'commitment-target'};
        actor.attention=setAttentionTarget(actor.attention,actor.attend);
      }
      return actor;
    });
    this.actors.set(record.id,members);
    record.activeScene=true;
    this.metrics.materialized+=members.length;
    return members;
  }

  dematerialize(recordId){
    const actors=this.actors.get(recordId),record=this.session.record(recordId);
    if(!actors||!record)return;
    /* Kinematic samples are not semantic state. Reconstruct from the route so
       frame rate and body integration cannot perturb off-screen continuity. */
    record.position=this.positionAt(record);
    record.activeScene=false;
    this.actors.delete(recordId);
    this.metrics.dematerialized+=actors.length;
  }

  /* Lending a body to the world. A ridden animal is neither simulated as a
     herd member nor deleted: the caller holds the same actor object, so
     heading, gait phase and life record return with it. The record is
     untouched. */
  detach(actorId){
    for(const members of this.actors.values()){
      const i=members.findIndex((q)=>q.id===actorId);
      if(i<0)continue;
      const [actor]=members.splice(i,1);
      this.detached.add(actorId);
      this.metrics.activeActors=Math.max(0,this.metrics.activeActors-1);
      return actor;
    }
    return null;
  }

  attach(actor,x,y){
    if(!actor)return null;
    this.detached.delete(actor.id);
    if(x!==undefined){actor.x=x;actor.y=y;}
    actor.moving=false;actor.acc=0;
    const members=this.actors.get(actor.lifeId);
    if(members){ if(!members.some((q)=>q.id===actor.id))members.push(actor); }
    else{
      /* Its record may have streamed out while it was ridden. Putting the body
         back makes the record resident again. */
      this.actors.set(actor.lifeId,[actor]);
      const record=this.session.record(actor.lifeId);
      if(record)record.activeScene=true;
    }
    this.metrics.activeActors=[...this.actors.values()].reduce((n,a)=>n+a.length,0);
    return actor;
  }

  actorList(){
    return [...this.actors.values()].flat()
      .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  }

  escapeTarget(record,traveller,media=null){
    const profile=LIFE[record.profileId];
    const valid=[...this.nodes.values()].filter((q)=>{
      const site=this.gen.lifeSiteAt(q.x,q.y,this.session);
      return this.gen.profileSuitability(profile,site)>0&&
        (!media||media.includes(site.conditions.medium));
    });
    valid.sort((a,b)=>{
      const da=Math.hypot(a.x-traveller.x,a.y-traveller.y);
      const db=Math.hypot(b.x-traveller.x,b.y-traveller.y);
      return db-da||a.id.localeCompare(b.id);
    });
    return valid[0]||null;
  }

  step(dt,context){
    this.session.step(dt);
    this.metrics.candidates=0;
    this.metrics.traces=0;
    const semanticNow=Math.floor(this.session.clock.minute);
    const actorList=this.reconcile(context.px,context.py,context.W,context.H);
    const traveller={id:'person:traveller',kind:'traveller',
      x:context.px,y:context.py,moving:!!context.travellerMoving,
      noise:Math.max(context.castNoise||0,context.travellerMoving?0.68:0.12)};
    /* Any body whose profile declares the approach keeps company: the
       machines, the shade guest, and a stork that follows what flushes the
       grass. One at a time. */
    const machineActors=actorList.filter((actor)=>
      LIFE[actor.profileId]?.actions.includes('approach-traveller'));
    /* `friendlyStage` covers the step in which the session has replaced a
       stage's action and its successor is not yet decided. */
    const companionActive=machineActors.some((actor)=>{
      const record=this.session.record(actor.lifeId);
      return record?.friendlyStage||FRIENDLY_ACTIONS.has(record?.commitment?.action);
    });
    let greeterId=null;
    if(!companionActive){
      const candidates=machineActors.map((actor)=>{
        const record=this.session.record(actor.lifeId);
        const position=this.positionAt(record,semanticNow);
        return {record,distance:Math.hypot(position.x-traveller.x,position.y-traveller.y),
          notice:companionOf(actor.key).noticeRadius};
      }).filter(({record,distance,notice})=>
        distance>=18&&distance<=notice&&!record.responseState?.fear&&
        (record.friendlyCooldownAt||0)<=semanticNow);
      candidates.sort((a,b)=>a.distance-b.distance||a.record.id.localeCompare(b.record.id));
      greeterId=candidates[0]?.record.id||null;
    }
    const semanticSubjects=[traveller,...this.records().map((record)=>{
      const position=this.positionAt(record,semanticNow);
      return {id:record.id,lifeId:record.id,profileId:record.profileId,
        x:position.x,y:position.y,
        moving:!STILL_ACTIONS.has(record.commitment?.action)};
    })];
    let decisions=0,observations=0;
    const decided=new Set();
    for(const actor of actorList){
      if(observations>=RUNTIME_LIMITS.observationsPerStep)break;
      const record=this.session.record(actor.lifeId);
      if(!record)continue;
      if(record.lastObservedAt===semanticNow)continue;
      record.lastObservedAt=semanticNow;
      const observer={...record,position:this.positionAt(record,semanticNow)};
      const observed=observeActor(observer,semanticSubjects,{
        seed:this.session.seed,now:semanticNow,
        siteAt:(x,y)=>this.gen.lifeSiteAt(x,y,this.session),wind:context.wind,
      }).slice(0,RUNTIME_LIMITS.observationsPerStep-observations);
      observations+=observed.length;
      for(const q of observed)this.session.observe(record.id,q);
      actor.socialAggregate=socialAggregate(record,actorList);
      const profile=LIFE[record.profileId];
      const machine=profile.actions.includes('approach-traveller');
      const C=companionOf(actor.key);
      const travellerDistance=Math.hypot(
        observer.position.x-traveller.x,observer.position.y-traveller.y);
      const currentAction=record.commitment?.action;
      let friendlyCommitment=null,friendlyResume=null;
      /* The session ends a commitment on its own timer and installs the next
         agenda action, in the same step and before this loop runs. Measured:
         a greeting then ends as `rest` and no body ever follows. So the
         friendly action last decided is kept on the record as the stage of
         the encounter, and a stage whose action the session has already
         replaced counts as ended. */
      const stage=record.friendlyStage||null;
      const replaced=(action)=>stage===action&&currentAction!==action;
      if(record.id===greeterId){
        record.suspendedCommitment=record.commitment?{...record.commitment}:null;
        friendlyCommitment={
          action:'approach-traveller',targetId:traveller.id,
          target:shortOf(observer.position,traveller,C.greetRadius),
          reason:'friendly-acknowledgement',
        };
      }else if(machine&&(replaced('approach-traveller')||
               currentAction==='approach-traveller'&&
               (record.commitment.endsAt<=semanticNow||
                travellerDistance<=C.greetRadius))){
        friendlyCommitment=travellerDistance<=C.noticeRadius
          ?{action:'greet',targetId:traveller.id,target:{x:traveller.x,y:traveller.y},
            reason:'friendly-greeting'}:null;
        if(!friendlyCommitment&&record.suspendedCommitment)
          friendlyResume={...record.suspendedCommitment,reason:'resume-after-greeting'};
      }else if(machine&&(replaced('greet')||
               currentAction==='greet'&&record.commitment.endsAt<=semanticNow)){
        friendlyCommitment=travellerDistance<=C.abandonRadius
          ?{action:'follow-traveller',targetId:traveller.id,
            target:shortOf(observer.position,traveller,C.followDistance),
            reason:'brief-companionship'}:null;
        if(!friendlyCommitment&&record.suspendedCommitment)
          friendlyResume={...record.suspendedCommitment,reason:'resume-after-greeting'};
      /* The semantic position stays where the following began, so this
         distance is how far the walker has gone from that place: a leash on
         the meeting point, whatever the body's own distance. */
      }else if(machine&&(replaced('follow-traveller')||
               currentAction==='follow-traveller'&&
               (record.commitment.endsAt<=semanticNow||
                travellerDistance>C.abandonRadius))&&
               record.suspendedCommitment)
        friendlyResume={...record.suspendedCommitment,reason:'resume-after-greeting'};
      /* a replaced stage with no successor is over */
      if(stage&&!friendlyCommitment&&!FRIENDLY_ACTIONS.has(currentAction))
        record.friendlyStage=null;
      /* An anchor is a familiar place, not a territory. Defence requires a
         separately authored state such as young, a nest, or blocked escape. */
      const defendContext=record.defensibleState===true&&
        profile.aggression.actions.includes('defend')&&
        Math.hypot(observer.position.x-record.anchor.x,observer.position.y-record.anchor.y)<
          profile.spatial.siteRadius*0.38;
      const siteRisk=this.gen.lifeSiteAt(observer.position.x,observer.position.y,
        this.session).risks;
      const disturbanceRisk=Math.max(siteRisk.activeWork,siteRisk.machinePressure);
      const risk=riskFromObservations(record.profileId,observed,{
        disturbanceRisk,
        defendContext,defendValue:0.16,
      });
      const response=transitionResponses(record,LIFE[record.profileId],risk);
      if(response.changed&&response.fear&&!REACTIVE.has(record.commitment?.action)){
        record.suspendedCommitment=record.commitment?{...record.commitment}:null;
        const source=risk.source;
        this.session.remember(record.id,{
          id:`${record.id}:interruption:${record.decisionIndex}`,
          kind:'interruption',subjectId:source?.subjectId||null,
          placeId:record.anchor?.patchId||record.anchor?.nodeId||null,
          salience:risk.fear,at:semanticNow,
          fact:{channel:source?.kind||'disturbance',
            interrupted:record.commitment?.action||null},
        });
      }
      const resume=!response.fear&&response.changed&&record.suspendedCommitment
        ?{...record.suspendedCommitment,reason:'resume-interrupted'}:null;
      const coupled=resume||friendlyCommitment||friendlyResume;
      const responseMismatch=(response.fear||response.aggression)&&
        !REACTIVE.has(record.commitment?.action);
      const mustDecide=response.changed||responseMismatch||!record.commitment||
        record.commitment.endsAt<=semanticNow||!!friendlyCommitment||!!friendlyResume;
      if(mustDecide&&!decided.has(record.id)&&
         decisions<RUNTIME_LIMITS.semanticDecisionsPerStep){
        const escape=this.escapeTarget(record,traveller);
        const submerge=profile.fear.actions.includes('submerge')
          ?this.escapeTarget(record,traveller,['shallow','deep']):null;
        const resident=RESIDENTS[record.profileId];
        const schedule=resident?activeSchedule(resident,this.session.clock.minuteOfDay):null;
        const result=decide(record,{
          seed:this.session.seed,now:semanticNow,
          observations:observed,
          disturbanceRisk,
          response,escapeTargetId:escape?.id,submergeTargetId:submerge?.id,
          nodes:[...this.nodes.values()],
          siteAt:(x,y)=>this.gen.lifeSiteAt(x,y,this.session),
          suitabilityAt:(profile,site)=>this.gen.profileSuitability(profile,site),
          socialAggregate:actor.socialAggregate,
          interrupt:!!coupled,
          coupledCommitment:coupled,
          durationFor:(action)=>{
            if(action==='approach-traveller')return C.approachMinutes;
            if(action==='greet')return C.greetMinutes;
            if(action==='follow-traveller')return C.followMinutes;
            return null;
          },
          scheduledAction:schedule?{
            action:schedule.action,
            targetId:record.nodeBindings?.[schedule.nodeKind]?.[0]||null,
            reason:'schedule',
          }:null,
        });
        this.session.cancelEvents(record.id,'advance-record');
        record.responseState={fear:result.response.fear,aggression:result.response.aggression};
        record.commitment=result.commitment;
        if(record.commitment.action==='orient'&&risk.source?.position){
          record.commitment.target={...risk.source.position};
          record.commitment.targetId=risk.source.subjectId||null;
        }
        if(resume||friendlyResume)record.suspendedCommitment=null;
        /* written from what was decided: fear may refuse a friendly action */
        record.friendlyStage=FRIENDLY_ACTIONS.has(record.commitment.action)
          ?record.commitment.action:null;
        /* the cooldown runs from an approach that was granted */
        if(record.id===greeterId&&record.friendlyStage)
          record.friendlyCooldownAt=semanticNow+C.cooldownMinutes;
        record.decisionIndex++;
        this.session.schedule({id:`${record.id}:near:${record.decisionIndex}`,
          at:record.commitment.endsAt,type:'advance-record',recordId:record.id});
        this.syncRoute(record);
        this.metrics.candidates+=result.candidateCount;
        decisions++;decided.add(record.id);
      }else record.responseState={fear:response.fear,aggression:response.aggression};
    }

    let traceBudget=RUNTIME_LIMITS.tracesPerStep;
    for(const actor of actorList){
      const record=this.session.record(actor.lifeId);
      this.syncActorCommitment(actor,record);
      const made=this.stepActor(actor,record,dt,{
        ...context,traveller,allowTrace:traceBudget>0,
      });
      if(made&&traceBudget>0){
        if(!made.transient)this.session.addTrace(made);
        traceBudget--;this.metrics.traces++;
      }
    }
    this.persistActivePositions();
    this.metrics.decisions=decisions;this.metrics.observations=observations;
    return actorList;
  }

  advanceOffscreen(dt){
    this.session.step(dt);
    for(const record of this.records())this.syncRoute(record);
    return this.session.metrics.lastStepEvents;
  }

  syncActorCommitment(actor,record){
    const commitment=record?.commitment;
    if(!commitment)return;
    actor.semanticAction=commitment.action;
    const target=commitment.target||this.node(commitment.targetId);
    actor.gx=target?.x;actor.gy=target?.y;
    const commitmentKey=keyOf(commitment);
    if(actor.lastCommitmentKey!==commitmentKey){
      actor.lastCommitmentStart=commitment.startedAt;
      actor.lastCommitmentKey=commitmentKey;
      const F=ACTOR[actor.key];
      actor.prepareLeft=F?.figure?(F.prepareFor||0.22):0;
      actor.attend=target?{x:target.x,y:target.y,z:0,kind:'commitment-target'}:null;
      if(F?.figure)actor.attention=setAttentionTarget(actor.attention,actor.attend);
    }
  }

  stepActor(actor,record,dt,context){
    const F=ACTOR[actor.key],profile=LIFE[actor.profileId];
    if(!F||!profile)return null;
    const site=this.gen.lifeSiteAt(actor.x,actor.y,this.session);
    const medium=site.conditions.medium;
    const action=actor.semanticAction||'rest';
    const fear=record.responseState?.fear;
    if((action==='approach-traveller'||action==='follow-traveller')&&context.traveller){
      actor.gx=context.traveller.x;actor.gy=context.traveller.y;
    }
    const companionDistance=context.traveller
      ?Math.hypot(actor.x-context.traveller.x,(actor.y-context.traveller.y)/0.66):Infinity;
    let moving=!STILL_ACTIONS.has(action)&&Number.isFinite(actor.gx)&&Number.isFinite(actor.gy);
    const C=companionOf(actor.key);
    if(action==='approach-traveller'&&companionDistance<=C.greetRadius){
      record.commitment.endsAt=this.session.clock.minute;moving=false;
    }
    if(action==='follow-traveller'&&companionDistance<=C.followDistance)
      moving=false;
    const done=(trace=null)=>{
      if(F.figure){
        const view=figureViewFromHeading(actor.hx,actor.hy,actor.flip);
        actor.attention=updateAttention(actor.attention,{
          x:actor.x,y:actor.y,dir:view.dir,
          flip:view.flip,moving:actor.moving,views:5,
        },dt);
        actor.look=actor.attention.appearance?.look||'neutral';
      }
      actor.expressionIntent=expressionIntent(profile,action,actor);
      return trace;
    };
    actor.preparePhase=0;
    if(actor.prepareLeft>0&&(moving||action==='orient')){
      actor.prepareLeft=Math.max(0,actor.prepareLeft-dt);
      actor.motionState='prepare';
      actor.preparePhase=anticipationFrame(actor.prepareLeft,F.prepareFor||0.22,
        F.states?.prepare||2);
      actor.moving=false;
      return done();
    }
    if(action==='greet'){
      const dx=context.traveller?.x-actor.x;
      const dy=(context.traveller?.y-actor.y)/0.66;
      if(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.hypot(dx,dy)>1){
        const want=Math.atan2(dy,dx),current=Math.atan2(actor.hy,actor.hx);
        let da=want-current;
        while(da>Math.PI)da-=Math.PI*2;
        while(da<-Math.PI)da+=Math.PI*2;
        const heading=current+clamp(da,-F.turnRate*dt,F.turnRate*dt);
        actor.hx=Math.cos(heading);actor.hy=Math.sin(heading);actor.flip=actor.hx<0;
      }
      const frames=F.states?.greet||1;
      const duration=Math.max(1,record.commitment.endsAt-record.commitment.startedAt);
      actor.greetPhase=clamp(
        (this.session.clock.minute-record.commitment.startedAt)/duration*frames,
        0,frames-1e-6);
      actor.motionState=F.states?.greet?'greet':F.restState||'idle';
      actor.moving=false;return done();
    }
    if(action==='submerge'&&(medium==='shallow'||medium==='deep')){
      actor.motionState=F.responseState||F.stateByMedium?.[medium]||F.restState||'idle';
      actor.moving=false;return done();
    }
    if(!moving){
      actor.motionState=(F.stateByMedium&&F.stateByMedium[medium])||
        (F.states?.[action]?action:F.restState)||'idle';
      actor.moving=false;
      if(action==='orient'&&record.observations.length){
        const q=record.observations.at(-1);
        if(q.position){
          actor.attend={...q.position,z:0,kind:'observed-risk'};
          if(F.figure)actor.attention=setAttentionTarget(actor.attention,actor.attend);
        }
      }
      return done();
    }
    const dx=actor.gx-actor.x,dy=(actor.gy-actor.y)/0.66,distance=Math.hypot(dx,dy);
    if(distance<(F.arrive||6)){
      actor.moving=false;actor.motionState=F.restState||'idle';
      return done();
    }
    const want=Math.atan2(dy,dx),current=Math.atan2(actor.hy,actor.hx);
    let da=want-current;
    while(da>Math.PI)da-=Math.PI*2;
    while(da<-Math.PI)da+=Math.PI*2;
    const heading=current+clamp(da,-F.turnRate*dt,F.turnRate*dt);
    actor.hx=Math.cos(heading);actor.hy=Math.sin(heading);
    if(actor.hx>(F.faceLock||0.25))actor.flip=false;
    else if(actor.hx<-(F.faceLock||0.25))actor.flip=true;
    /* A follower left two follow distances behind strides out to close up,
       where its row states a faster pace. */
    const lagging=action==='follow-traveller'&&F.runSpeed>F.speed&&
      companionDistance>2*C.followDistance;
    const wantsRun=lagging||!!(fear&&(action==='flee'||action==='withdraw'));
    const speed=wantsRun
      ?(F.runSpeed||F.speed):F.speed;
    const ox=actor.x,oy=actor.y;
    const nx=actor.x+actor.hx*speed*dt,ny=actor.y+actor.hy*speed*dt*0.66;
    const okx=!context.blocked?.(nx,actor.y,actor)&&
      this.gen.entityAffordance(actor.profileId,nx,actor.y);
    const oky=!context.blocked?.(actor.x,ny,actor)&&
      this.gen.entityAffordance(actor.profileId,actor.x,ny);
    if(okx)actor.x=nx;if(oky)actor.y=ny;
    const movedDistance=Math.hypot(actor.x-ox,actor.y-oy);
    if(movedDistance<=1e-4){
      actor.moving=false;record.commitment.endsAt=this.session.clock.minute;
      return done();
    }
    actor.moving=true;actor.motionState=fear&&F.fleeState?F.fleeState:
      (F.moveByMedium&&F.moveByMedium[medium])||F.moveState||'walk';
    if(F.figure){
      const state=wantsRun&&F.states?.run?'run':'walk';
      actor.motionState=state;
      const cast=CAST_BY_KEY[F.key];
      const fromGait=actor.gait;
      actor.gait+=gaitFrames(movedDistance,heightPx(cast),state);
      if(!F.track||context.allowTrace===false)return done();
      const strikes=folkStrikes(fromGait,actor.gait,{h:heightPx(cast),state});
      for(const foot of strikes){
        const at=clamp(foot.at,0,1);
        const bx=ox+(actor.x-ox)*at,by=oy+(actor.y-oy)*at;
        const p=folkFootWorld(bx,by,actor.hx,actor.hy,foot);
        context.mark?.(p.x,p.y,F.track,state);
        context.prints?.push([p.x,p.y,F.track,context.renderTime||0]);
      }
      if(!strikes.length)return done();
      return done({
        id:`${actor.id}:trace:${record.decisionIndex}:${state}:${Math.round(actor.x)}:${Math.round(actor.y)}`,
        kind:'boot-print',recordId:record.id,
        x:actor.x,y:actor.y,at:this.session.clock.minute,transient:true,
      });
    }
    if(profile.identity.class==='fictional-species'&&F.machine){
      const patchId=this.gen.lifePatchId(actor.x,actor.y);
      if(actor.lastPressurePatch!==patchId){
        const current=this.session.deviations.get(patchId);
        if(!current?.effects?.machinePressure)applyDisturbance(this.session,this.gen,{
          type:'machinePressure',x:actor.x,y:actor.y,patchId,intensity:0.42,
          sourceId:record.id,
        });
        actor.lastPressurePatch=patchId;
      }
    }
    /* Cadence is ground covered, so it follows the speed. Measured: keyed on
       the flee state, a body whose flee and travel states are one clip ran
       its travel at the run cadence. */
    const gait=wantsRun?(F.runGait||F.gait*1.7):F.gait;
    const fromGait=actor.gait;
    actor.gait+=dt*gait;
    if(F.pose&&F.track&&context.allowTrace!==false){
      let marked=false;
      const locomotion=wantsRun?'run':'walk';
      for(let frame=Math.floor(fromGait)+1;frame<=Math.floor(actor.gait);frame++){
        const pose=F.pose({state:actor.motionState,frame});
        const before=F.pose({state:actor.motionState,frame:frame-1});
        const wasDown=new Map(before.feet.map((q)=>[q.limb,q.contact]));
        const at=clamp((frame-fromGait)/(actor.gait-fromGait),0,1);
        const bx=ox+(actor.x-ox)*at,by=oy+(actor.y-oy)*at;
        for(const foot of pose.feet.filter((q)=>q.contact&&!wasDown.get(q.limb))){
          const lateral=foot.side*(F.foot||1)*0.5;
          const fx=bx+actor.hx*foot.x-actor.hy*lateral;
          const fy=by+actor.hy*foot.x+actor.hx*lateral;
          context.mark?.(fx,fy,F.track,locomotion);
          context.prints?.push([fx,fy,F.track,context.renderTime||0]);
          marked=true;
        }
      }
      if(marked)return done({
        id:`${actor.id}:trace:${record.decisionIndex}:${Math.floor(actor.gait)}`,
        kind:profile.traces[0]||'track',recordId:record.id,
        x:actor.x,y:actor.y,at:this.session.clock.minute,transient:true,
      });
      return done();
    }
    actor.acc+=speed*dt;
    if(actor.acc<(F.stride||1e9))return done();
    actor.acc%=F.stride;
    if(!F.track||F.stride>=1e8)return done();
    if(context.allowTrace===false)return done();
    const trace={id:`${actor.id}:trace:${record.decisionIndex}:${Math.floor(actor.gait)}`,
      kind:profile.traces[0]||'track',recordId:record.id,
      x:actor.x,y:actor.y,at:this.session.clock.minute,transient:true};
    context.mark?.(actor.x,actor.y,F.track,wantsRun?'run':'walk');
    context.prints?.push([actor.x,actor.y,F.track,context.renderTime||0]);
    return done(trace);
  }

  persistActivePositions(){
    for(const [id] of this.actors){
      const record=this.session.record(id);
      if(record.route){
        record.routeProgress=clamp((this.session.clock.minute-record.route.startedAt)/
          Math.max(1e-6,record.route.arrivesAt-record.route.startedAt),0,1);
        if(record.routeProgress>=1)record.position=this.positionAt(record);
      }
    }
  }

  dispose(){
    for(const id of [...this.actors.keys()])this.dematerialize(id);
  }
}

export { LifeRuntime, MACHINE_COMPANION, RUNTIME_LIMITS };
