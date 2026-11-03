'use strict';
/* メインの会話を待つ場所。サブ依頼・ピンク会話とは分ける。 */
const STORY_WAIT_PLANS=new WeakMap();
function mainStoryWaitInfo(){
  if(!S||S.free||S.cleared||isNight())return null;
  const report=S.qStory!=null,index=report?S.qStory:S.quest,q=QUESTS[index];
  if(!q||!report&&(!q.talk||S.qTalked||!q.talk.when()||qMissing(q).length))return null;
  // 調査の前は既存の全員集合を使う。調査後の報告は、同じ木のそばで待つ。
  if(!report&&q.field)return null;
  const key=WD+':'+index+':'+(report?'report':'intro');let p=STORY_WAIT_PLANS.get(S);
  if(p?.key===key&&p.session===VILLAGE_SESSION&&p.cast.every(r=>S.res.includes(r)&&!r.hidden)&&(p.id==null||qvHas(p.obj,p.id)))return p;
  const who=report?storyWho(q):firstSpk(q.talk.lines,q.talk.who);
  const lead=S.res.find(r=>r.name===who&&!r.hidden);if(!lead&&!(q.field&&report))return null;
  const last=q.field&&FIELD_STORIES[q.id]?.at(-1),cast=last?fieldCast(last):[lead];if(!cast.length)return null;
  let obj=q.field?S.sacredRoot:null,id=null;
  if(obj==null){
    const ids=QUEST_VISIT_MAIN[q.id]||(q.id==='nushi'?['tower']:null),recent=QUEST_PLACEMENTS.get(S);let best=-Infinity;
    if(ids)for(let j=0;j<S.obj.length;j++){if(!questVisitTarget(q,ids,j))continue;const placed=recent?.get(j),score=(placed&&qvHas(j,placed.id)?placed.n*100000:0)-Math.hypot(j%W+.5-lead.x,(j/W|0)+.5-lead.y);if(score>best){best=score;obj=j;}}
    if(obj!=null)id=S.obj[obj]||S.floor[obj];
    else if(STATUE>=0){obj=STATUE;id=S.obj[STATUE];}
    else obj=(lead.y|0)*W+(lead.x|0);
  }
  if(obj==null)return null;
  p={key,session:VILLAGE_SESSION,index,report,q,who,cast,obj,id,field:!!q.field};STORY_WAIT_PLANS.set(S,p);return p;
}
function rememberStoryHome(r,key){if(!r.storyWaitHome||r.storyWaitHome.world!==WD)r.storyWaitHome={j:(r.y|0)*W+(r.x|0),key,world:WD};else r.storyWaitHome.key=key;}
function storyWaitProtected(r){
  const a=r.act;if(!a||a.stage!=='do'||isNight())return false;
  if(a.type==='fieldintro')return earthIntroValid(r,a)&&questVisitSafe(r,a.obj);
  if(a.type!=='storywait')return false;const p=mainStoryWaitInfo();return !!p&&p.key===a.storyKey&&p.obj===a.obj&&p.cast.includes(r)&&questVisitSafe(r,p.obj);
}
function storyWaitStand(r,G,p){
  const occupied=occTiles(r);if(p.field)return nearest(G,j=>walk(j)&&!sacredReserved(j)&&!occupied.has(j)&&fieldDistance(j,p.obj)>=1&&fieldDistance(j,p.obj)<=3&&free('storywait'+j,1),150);
  if(p.id!=null)return questVisitStand(r,G,p.obj);
  return nearest(G,j=>walk(j)&&!occupied.has(j)&&Math.abs(j%W-p.obj%W)+Math.abs((j/W|0)-(p.obj/W|0))<=1&&free('storywait'+j,1),150);
}
function tryMainStoryWait(r){
  const p=mainStoryWaitInfo(),home=r.storyWaitHome,a=r.act;
  if(a?.type==='storyreturn')return false;
  if(home&&(!p||p.key!==home.key)&&a?.type!=='fieldintro'){
    if(['fieldstory','fieldassist','fieldwait','nmeet','sevreact','questjoy'].includes(a?.type)){delete r.storyWaitHome;return false;}
    if(a?.type==='storywait')endAct(r);
    delete r.storyWaitHome;
    if(isNight()||home.world!==WD||hostileNow(r)||r.meal||r.cing||carryN(r)||matN(r)||['eat','fetch','flee','faint','sleep','bury','pray'].includes(r.act?.type))return false;
    const G=bfs(r.x|0,r.y|0),occupied=occTiles(r),goal=nearest(G,j=>walk(j)&&!occupied.has(j)&&Math.abs(j%W-home.j%W)+Math.abs((j/W|0)-(home.j/W|0))<=1,150);
    if(goal>=0&&goal!==((r.y|0)*W+(r.x|0))&&questVisitSafe(r,goal)){endAct(r);startAct(r,G,'storyreturn',goal,{});return true;}
  }
  if(!p||!p.cast.includes(r)||a?.type==='storywait'&&a.storyKey===p.key&&a.obj===p.obj)return false;
  if(!fieldActorReady(r)||onHold(r)||['fieldstory','fieldassist','questjoy','nmeet','sevreact'].includes(r.act?.type)||!questVisitSafe(r,p.obj))return false;
  const G=bfs(r.x|0,r.y|0),stand=storyWaitStand(r,G,p);if(stand<0)return false;
  rememberStoryHome(r,p.key);endAct(r);startAct(r,G,'storywait',stand,{key:'storywait'+stand,storyKey:p.key,obj:p.obj});return true;
}
ACT.storywait={start(r,a){faceTo(r,a.obj);r.bubble='';},done(r,a){const p=mainStoryWaitInfo();return !p||p.key!==a.storyKey||p.obj!==a.obj||!p.cast.includes(r)||!questVisitSafe(r,a.obj);}};
ACT.storyreturn={done:()=>true};
function mainStoryBubbleReady(r){
  if(isNight())return false;
  if(r?.act?.type==='fieldintro')return earthIntroSpeaker(QUESTS[S.quest])===r.name;
  const p=mainStoryWaitInfo();if(!r)return !p||p.who!==GOD||p.cast.every(x=>x.act?.type==='storywait'&&x.act.stage==='do'&&x.act.storyKey===p.key&&x.act.obj===p.obj);
  return !!p&&p.cast.includes(r)&&p.cast.every(x=>x.act?.type==='storywait'&&x.act.stage==='do'&&x.act.storyKey===p.key&&x.act.obj===p.obj)&&storyWaitProtected(r);
}
function mainStoryPromptText(w){if(w===GOD&&!mainStoryBubbleReady())return 'なかまが、お話の場所に集まっている';const r=S.res.find(r=>r.name===w);return r&&!mainStoryBubbleReady(r)?w+'が、お話の場所に集まっている':w+'が話したそうにしている';}
