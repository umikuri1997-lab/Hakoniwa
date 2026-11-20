import { ACTION_EVIDENCE, activeSchedule, PROJECTS, RESIDENTS,
         projectMilestoneForAction } from './culture.js';
import { mergeDisturbanceDeviation } from './disturbance.js';
import { activityAt, drivePriority, lifeProfile, seasonModeAt } from './life.js';
import { TRAVELLER_BY_BIOME } from './people.js';
import { keyedInt, keyedRandom } from './rng.js';
import { WorldClock } from './world-clock.js';

const LIFE_SNAPSHOT_VERSION=1;
const LIFE_LIMITS=Object.freeze({
  records:256,events:1024,eventsPerStep:64,memoriesPerRecord:12,
  observationsPerActor:12,traces:512,disturbances:256,deviations:512,
});

const clone=(value)=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const eventOrder=(a,b)=>a.at-b.at||String(a.id).localeCompare(String(b.id));
const snapshotRecord=(record)=>{
  const row=clone(record);
  delete row.activeScene;
  return row;
};

function semanticRecord(input){
  const profile=lifeProfile(input.profileId);
  return {
    id:String(input.id),profileId:input.profileId,
    identityClass:profile.identity.class,sceneId:input.sceneId||profile.biomes[0],
    cohortId:input.cohortId||null,memberIds:clone(input.memberIds||[]),
    anchor:clone(input.anchor||null),position:clone(input.position||input.anchor||{x:0,y:0}),
    route:clone(input.route||null),routeProgress:Number(input.routeProgress||0),
    commitment:clone(input.commitment||null),
    needs:{energy:'steady',safety:'clear',social:'settled',...(input.needs||{})},
    seasonMode:input.seasonMode||seasonModeAt(profile),
    social:clone(input.social||{form:profile.social.form}),
    observations:clone(input.observations||[]),memories:clone(input.memories||[]),
    appearance:clone(input.appearance||{}),project:clone(input.project||null),
    nodeBindings:clone(input.nodeBindings||{}),placeStates:clone(input.placeStates||{}),
    practices:clone(input.practices||[]),householdIds:clone(input.householdIds||[]),
    workGroupIds:clone(input.workGroupIds||[]),ties:clone(input.ties||[]),
    duties:clone(input.duties||[]),
    agenda:clone(input.agenda||[]),agendaIndex:Number(input.agendaIndex||0),
    decisionIndex:Number(input.decisionIndex||0),nextEventAt:input.nextEventAt??null,
    lastObservedAt:input.lastObservedAt??null,
    activeScene:false,lastAdvancedAt:Number(input.lastAdvancedAt||0),
  };
}

class LifeSession{
  constructor(seed,state={}){
    this.version=LIFE_SNAPSHOT_VERSION;
    this.seed=seed>>>0;
    this.clock=state.clock instanceof WorldClock?state.clock:new WorldClock(state.clock);
    this.records=new Map();
    const traveller=semanticRecord({
      id:'person:traveller',profileId:'traveller',sceneId:'global',
      /* By biome, not by scene id: TRAVELLER_BY_BIOME in people.js is the one
         authority. Nothing reads this field at runtime. */
      appearance:{byBiome:{...TRAVELLER_BY_BIOME}},
      needs:{energy:'player-directed',safety:'player-directed',
        social:'player-directed'},
    });
    this.records.set(traveller.id,traveller);
    this.events=[];
    this.traces=[];
    this.disturbances=[];
    this.deviations=new Map();
    this.placeStates=new Map();
    this.sequence=0;
    this.metrics={processedEvents:0,maxQueue:0,lastStepEvents:0};
  }

  addRecord(input){
    if(this.records.has(String(input.id)))throw new Error(`duplicate life record '${input.id}'`);
    if(this.records.size>=LIFE_LIMITS.records)throw new Error('life record budget exceeded');
    const row=semanticRecord({...input,lastAdvancedAt:this.clock.minute,
      seasonMode:input.seasonMode||seasonModeAt(input.profileId,this.clock.dayOfYear)});
    this.records.set(row.id,row);
    for(const [id,value] of Object.entries(row.placeStates))
      if(!this.placeStates.has(id))this.placeStates.set(id,clone(value));
    if(row.nextEventAt!==null)this.schedule({
      id:`${row.id}:initial`,at:row.nextEventAt,type:'advance-record',recordId:row.id,
    });
    return row;
  }

  ensureRecord(input){return this.records.get(String(input.id))||this.addRecord(input);}
  record(id){return this.records.get(String(id))||null;}

  schedule(event){
    if(!Number.isFinite(event.at))throw new Error('life event time must be finite');
    if(this.events.length>=LIFE_LIMITS.events)throw new Error('life event queue budget exceeded');
    const row={...clone(event),id:event.id||`event:${this.sequence++}`};
    this.events.push(row);this.events.sort(eventOrder);
    this.metrics.maxQueue=Math.max(this.metrics.maxQueue,this.events.length);
    const record=row.recordId&&this.record(row.recordId);
    if(record&&(record.nextEventAt===null||row.at<record.nextEventAt))record.nextEventAt=row.at;
    return row;
  }

  cancelEvents(recordId,type){
    const id=String(recordId);
    this.events=this.events.filter((q)=>q.recordId!==id||(type&&q.type!==type));
    this.#syncNextEvent(id);
  }

  #syncNextEvent(recordId){
    const record=this.record(recordId);
    if(!record)return;
    const next=this.events.find((q)=>q.recordId===record.id);
    record.nextEventAt=next?next.at:null;
  }

  processDue(until=this.clock.minute,budget=LIFE_LIMITS.eventsPerStep){
    let n=0;
    while(n<budget&&this.events.length&&this.events[0].at<=until){
      const event=this.events.shift();
      this.#applyEvent(event);
      if(event.recordId)this.#syncNextEvent(event.recordId);
      n++;
    }
    this.metrics.processedEvents+=n;
    this.metrics.lastStepEvents=n;
    return n;
  }

  step(realSeconds){
    this.clock.advanceRealSeconds(realSeconds);
    return this.processDue(this.clock.minute,LIFE_LIMITS.eventsPerStep);
  }

  advanceTo(minute){
    if(minute<this.clock.minute)throw new Error('life session cannot run backward');
    this.clock.setMinute(minute);
    let total=0,n=0;
    do{
      n=this.processDue(minute,LIFE_LIMITS.eventsPerStep);
      total+=n;
    }while(n===LIFE_LIMITS.eventsPerStep&&this.events[0]?.at<=minute);
    return total;
  }

  #applyEvent(event){
    if(event.type==='disturbance-transition'){
      const current=this.deviations.get(String(event.patchId));
      this.setDeviation(event.patchId,mergeDisturbanceDeviation(
        current,event.effectType,event.effect));
      return;
    }
    if(event.type==='trace-expire'){
      this.traces=this.traces.filter((q)=>q.id!==event.traceId);
      return;
    }
    const record=this.record(event.recordId);
    if(!record)return;
    record.lastAdvancedAt=event.at;
    if(event.type==='observation'){
      this.remember(record.id,event.observation);
      return;
    }
    if(event.type==='project-milestone'){
      this.advanceProject(record.id,event.milestone);
      return;
    }
    if(event.type==='advance-record'){
      this.#completeCommitment(record,event.at);
      this.#advanceRecord(record,event.at);
    }
  }

  #completeCommitment(record,at){
    const commitment=record.commitment;
    if(!commitment||commitment.completedAt!==undefined||commitment.endsAt>at)return;
    commitment.completedAt=at;
    const projectId=record.project?.id;
    const milestone=projectId
      ?projectMilestoneForAction(projectId,record.project.index,commitment.action):null;
    if(milestone)this.advanceProject(record.id,milestone);
    const evidence=ACTION_EVIDENCE[commitment.action];
    if(evidence)this.addTrace({
      id:`${record.id}:evidence:${record.decisionIndex}`,kind:evidence,
      recordId:record.id,placeId:commitment.targetId||null,
      x:record.position.x,y:record.position.y,at,
    });
    if(commitment.targetId&&record.placeStates){
      const state={
        'repair-boardwalk':'sound','inspect-winch':'sound','check-mooring':'sound',
        'inspect-trap':'serviced','tend-rack':'tended','record-water-mark':'recorded',
        'inspect-storage':'ordered','tend-hearth':'tended','unpack':'unpacked',
        display:'displayed','attend-stall':'attended',repack:'packed',
        'inspect-woodlot':'marked','split-fuel':'split','stack-fuel':'stacked',
      }[commitment.action];
      if(state)this.setPlaceState(commitment.targetId,state);
    }
  }

  #advanceRecord(record,at){
    const profile=lifeProfile(record.profileId);
    const day=((Math.floor(at/1440)%365)+365)%365+1;
    record.seasonMode=seasonModeAt(profile,day);
    let action,targetId=null,duration;
    const resident=RESIDENTS[record.profileId];
    if(resident){
      const block=activeSchedule(resident,this.clockMinuteAt(at));
      action=block.action;
      let bindings=record.nodeBindings?.[block.nodeKind]||[];
      if(action==='repair-boardwalk'){
        const due=bindings.filter((id)=>this.placeStates.get(id)==='repair-due');
        if(due.length)bindings=due;
        else if(!bindings.length)
          bindings=record.nodeBindings?.winch||[];
      }
      targetId=bindings.length?bindings[keyedInt(this.seed,0,bindings.length-1,
        record.id,record.decisionIndex,'schedule-target')]:null;
      duration=Math.max(10,Math.min(120,block.end-this.clockMinuteAt(at)||30));
    }else if(record.agenda.length){
      const entry=record.agenda[record.agendaIndex%record.agenda.length];
      action=entry.action;targetId=entry.targetId||null;
      duration=entry.duration||30;
      record.agendaIndex=(record.agendaIndex+1)%record.agenda.length;
    }else{
      const actions=profile.actions.filter((q)=>![
        'flee','hide','submerge','hold','display','defend','orient','freeze',
        'approach-traveller','greet','follow-traveller',
      ].includes(q));
      const active=activityAt(profile,this.clockMinuteAt(at));
      const weights=actions.map((q)=>1+drivePriority(profile,q)*2);
      const total=weights.reduce((sum,q)=>sum+q,0);
      let pick=keyedRandom(this.seed,record.id,record.decisionIndex,
        'offscreen-action')*total,index=0;
      while(index<weights.length-1&&pick>=weights[index])pick-=weights[index++];
      action=actions[index]||'rest';
      duration=Math.round(18+(1-active)*32+
        keyedRandom(this.seed,record.id,record.decisionIndex,'duration')*34);
    }
    record.commitment={
      action,targetId,startedAt:at,endsAt:at+duration,
      reason:resident?'schedule':'drive',interruptible:true,
    };
    record.decisionIndex++;
    record.needs.energy=action==='rest'?'recovering':'spending';
    record.nextEventAt=at+duration;
    this.schedule({id:`${record.id}:advance:${record.decisionIndex}`,
      at:record.nextEventAt,type:'advance-record',recordId:record.id});
  }

  clockMinuteAt(absolute){
    return ((absolute%1440)+1440)%1440;
  }

  initializeRecord(id,at=this.clock.minute){
    const record=this.record(id);
    if(!record)return null;
    if(!record.commitment){
      this.cancelEvents(record.id);
      this.#advanceRecord(record,at);
    }
    return record;
  }

  remember(recordId,observation){
    const record=this.record(recordId);
    if(!record)return false;
    const row={
      id:observation.id||`${record.id}:memory:${observation.kind}:${observation.at}`,
      at:observation.at??this.clock.minute,kind:observation.kind,
      subjectId:observation.subjectId||null,placeId:observation.placeId||null,
      salience:Number(observation.salience??0.5),fact:clone(observation.fact||null),
    };
    const old=record.memories.findIndex((q)=>q.id===row.id);
    if(old>=0)record.memories.splice(old,1);
    record.memories.push(row);
    record.memories.sort((a,b)=>b.salience-a.salience||b.at-a.at||a.id.localeCompare(b.id));
    record.memories.length=Math.min(record.memories.length,LIFE_LIMITS.memoriesPerRecord);
    return true;
  }

  observe(recordId,observation){
    const record=this.record(recordId);
    if(!record)return false;
    record.observations.push({...clone(observation),at:observation.at??this.clock.minute});
    if(record.observations.length>LIFE_LIMITS.observationsPerActor)
      record.observations.splice(0,record.observations.length-LIFE_LIMITS.observationsPerActor);
    return true;
  }

  advanceProject(recordId,milestone){
    const record=this.record(recordId);
    if(!record)return false;
    const resident=RESIDENTS[record.profileId];
    const definition=resident&&PROJECTS[resident.project];
    if(!definition)return false;
    if(!record.project)record.project={id:resident.project,index:0,completed:[]};
    const expected=definition.milestones[record.project.index];
    if(milestone&&milestone!==expected)return false;
    if(expected)record.project.completed.push(expected);
    record.project.index=Math.min(definition.milestones.length,record.project.index+1);
    return true;
  }

  addTrace(trace){
    const row={...clone(trace),id:trace.id||`trace:${this.sequence++}`,
      at:trace.at??this.clock.minute};
    this.traces.push(row);
    if(this.traces.length>LIFE_LIMITS.traces)
      this.traces.splice(0,this.traces.length-LIFE_LIMITS.traces);
    if(row.expiresAt!==undefined)this.schedule({
      id:`expire:${row.id}`,at:row.expiresAt,type:'trace-expire',traceId:row.id,
    });
    return row;
  }

  addDisturbance(disturbance){
    const row={...clone(disturbance),id:disturbance.id||`disturbance:${this.sequence++}`,
      at:disturbance.at??this.clock.minute};
    this.disturbances.push(row);
    if(this.disturbances.length>LIFE_LIMITS.disturbances)
      this.disturbances.splice(0,this.disturbances.length-LIFE_LIMITS.disturbances);
    return row;
  }

  setDeviation(id,value){
    if(!this.deviations.has(id)&&this.deviations.size>=LIFE_LIMITS.deviations)
      throw new Error('life deviation budget exceeded');
    if(value===null||value===undefined)this.deviations.delete(id);
    else this.deviations.set(String(id),clone(value));
  }

  setPlaceState(id,value){
    this.placeStates.set(String(id),clone(value));
    for(const record of this.records.values())
      if(record.placeStates&&Object.hasOwn(record.placeStates,id))
        record.placeStates[id]=clone(value);
  }

  snapshot(){
    return {
      version:this.version,seed:this.seed,clock:this.clock.snapshot(),
      records:[...this.records.values()].map(snapshotRecord).sort((a,b)=>a.id.localeCompare(b.id)),
      events:this.events.map(clone),traces:clone(this.traces),
      disturbances:clone(this.disturbances),
      deviations:[...this.deviations.entries()].map(([id,value])=>[id,clone(value)])
        .sort((a,b)=>a[0].localeCompare(b[0])),
      placeStates:[...this.placeStates.entries()].map(([id,value])=>[id,clone(value)])
        .sort((a,b)=>a[0].localeCompare(b[0])),
      sequence:this.sequence,
    };
  }

  static fromSnapshot(value){
    if(!value||value.version!==LIFE_SNAPSHOT_VERSION)
      throw new Error(`unsupported life snapshot version '${value?.version}'`);
    const session=new LifeSession(value.seed,{clock:WorldClock.fromSnapshot(value.clock)});
    for(const row of value.records||[])session.records.set(String(row.id),
      {...clone(row),activeScene:false});
    session.events=clone(value.events||[]).sort(eventOrder);
    session.traces=clone(value.traces||[]);
    session.disturbances=clone(value.disturbances||[]);
    session.deviations=new Map(clone(value.deviations||[]));
    session.placeStates=new Map(clone(value.placeStates||[]));
    if(!value.placeStates)for(const record of session.records.values())
      for(const [id,state] of Object.entries(record.placeStates||{}))
        if(!session.placeStates.has(id))session.placeStates.set(id,clone(state));
    session.sequence=value.sequence||0;
    session.metrics.maxQueue=session.events.length;
    return session;
  }
}

export { LIFE_LIMITS, LIFE_SNAPSHOT_VERSION, LifeSession, semanticRecord };
