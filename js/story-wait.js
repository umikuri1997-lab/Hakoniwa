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
  if(p?.key===key&&p.session===VILLAGE_SESSION&&p.cast.every(r=>S.res.includes(r)&&!r.hidden)&&(!q.field||p.cast.length===(FIELD_STORIES[q.id].at(-1).cast||[]).length)&&(p.id==null||qvHas(p.obj,p.id)))return p;
  const who=report?storyWho(q):firstSpk(q.talk.lines,q.talk.who);
  const lead=S.res.find(r=>r.name===who&&!r.hidden);if(!lead&&!(q.field&&report))return null;
  const last=q.field&&FIELD_STORIES[q.id]?.at(-1),cast=last?fieldCast(last):[lead,...storyLineCast(report?q.story:q.talk.lines).filter(r=>r!==lead)];if(!cast.length)return null;/* 会話でしゃべる子は、みんな集まってから話す（いない子は、その行だけはぶく） */
  let obj=q.field?S.sacredRoot:null,id=null,free=false,tree=false;
  if(obj==null){
    const ids=QUEST_VISIT_MAIN[q.id]||(q.id==='nushi'?['tower']:null),recent=QUEST_PLACEMENTS.get(S);let best=-Infinity;
    if(ids)for(let j=0;j<S.obj.length;j++){if(!questVisitTarget(q,ids,j))continue;const placed=recent?.get(j),score=(placed&&qvHas(j,placed.id)?placed.n*100000:0)-Math.hypot(j%W+.5-lead.x,(j/W|0)+.5-lead.y);if(score>best){best=score;obj=j;}}
    if(obj!=null)id=S.obj[obj]||S.floor[obj];
    else if(q.id==='kagemark'&&S.flags.kgMark!=null){obj=S.flags.kgMark;free=true;}/* 大きなかげのあと：そのまわりへ駆け寄って話す */
    else{/* どこで話してもよい会話：ひとりなら、そのまま暮らしながら話しかけられる。みんなで話すときは、近くの空いた場所に集まる */
      if(cast.length<2||!lead)return null;
      if(WD===0&&S.sacredRoot!=null){obj=S.sacredRoot;tree=true}/* 草原：御神木のまわりは、いつも空いているので、みんなで話すときは御神木のまわりに集まる */
      else{obj=storyOpenSpot(lead,cast.length);free=true;}
    }
  }
  if(obj==null)return null;
  p={key,session:VILLAGE_SESSION,index,report,q,who,cast,obj,id,field:!!q.field,free,tree};STORY_WAIT_PLANS.set(S,p);return p;
}
function storyLineCast(L){return [...new Set((L||[]).map(l=>l&&l[0]).filter(n=>typeof n==='string'))].map(n=>S.res.find(r=>r.name===sevName(n)&&!r.hidden)).filter(Boolean)}
function rememberStoryHome(r,key){if(!r.storyWaitHome||r.storyWaitHome.world!==WD)r.storyWaitHome={j:(r.y|0)*W+(r.x|0),key,world:WD};else r.storyWaitHome.key=key;}
function storyWaitProtected(r){
  const a=r.act;if(!a||a.stage!=='do'||isNight())return false;
  if(a.type==='fieldintro')return earthIntroValid(r,a)&&questVisitSafe(r,a.obj);
  if(a.type!=='storywait')return false;const p=mainStoryWaitInfo();return !!p&&p.key===a.storyKey&&p.obj===a.obj&&p.cast.includes(r)&&questVisitSafe(r,p.obj);
}
function storyWaitStand(r,G,p){
  if(!p.slots)p.slots=storySlots(p.cast,p.field||p.tree?{stump:p.obj}:p.free?{center:p.obj}:{obj:p.obj});
  const k=p.slots.get(r);if(k!=null&&G.dist[k]>=0&&free('storywait'+k,1))return k;
  const occupied=occTiles(r);return p.id!=null?questVisitStand(r,G,p.obj):-1;
}
/* 集まる場所：ひとりずつ、ずらした定位置を決める（となりどうし1マスあける・手前の列を先に） */
function storySlotFocus(t){if(t.stump!=null)return[storyTreeX(t.stump),(fieldStump(t.stump)/W|0)+.5];if(t.center!=null)return[t.center%W+.5,(t.center/W|0)+.5];const b=BL[S.obj[t.obj]],z=b&&szAt(S.obj[t.obj],t.obj)||[1,1];return[t.obj%W+z[0]/2,(t.obj/W|0)+z[1]/2];}
function storySlotCells(t){const[fx,fy]=storySlotFocus(t),L=[];const R=t.stump!=null?2.6:t.center!=null?1.6:2.4;
  for(let y=Math.floor(fy-R);y<=Math.ceil(fy+R);y++)for(let x=Math.floor(fx-R);x<=Math.ceil(fx+R);x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x,d=Math.hypot(x+.5-fx,y+.5-fy);if(d>R||d<.6||!walk(k)||S.obj[k]&&!WEEDS.has(S.obj[k]))continue;
    if(t.stump!=null&&(k===fieldStump(t.stump)||y<(fieldStump(t.stump)/W|0)))continue;/* 切り株のうしろ（上の列）には立たない */if(t.obj!=null&&!questVisitReachedTile(t.obj,k))continue;L.push({k,d:d+(y+.5<fy-.4?.5:0)})}
  return L.sort((a,b)=>a.d-b.d);}
function questVisitReachedTile(j,k){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0,kx=k%W+.5,ky=(k/W|0)+.5,dx=Math.max(x-kx,0,kx-(x+z[0])),dy=Math.max(y-ky,0,ky-(y+z[1]));return dx+dy>0&&Math.hypot(dx,dy)<=1.6}
function storySlots(cast,t,first){const L=storySlotCells(t),m=new Map(),used=[];
  for(const r of cast){if(first!=null&&r===cast[0]){m.set(r,first);used.push(first);continue}
    const G=bfs(r.x|0,r.y|0);let best=null,bs=Infinity;for(const c of L){if(G.dist[c.k]<0||used.includes(c.k))continue;const near=used.some(u=>Math.abs(u%W-c.k%W)+Math.abs((u/W|0)-(c.k/W|0))===1);const s=c.d+(near?.8:0);/* となりあうマスは、少しさける */if(s<bs){bs=s;best=c.k}}
    if(best!=null){m.set(r,best);used.push(best)}}
  return m}
/* みんなで話す場所：話す子の近くで、まわりが空いているマス */
function storyOpenSpot(lead,n){const G=bfs(lead.x|0,lead.y|0);return nearest(G,j=>{if(!walk(j)||S.obj[j]||roomOf(j))return false;let c=0;const x=j%W,y=j/W|0;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-2;xx<=x+2;xx++){const k=yy*W+xx;if(k!==j&&xx>=0&&xx<W&&yy>=0&&yy<H&&walk(k)&&!S.obj[k]&&!roomOf(k))c++}return c>=n+4},40);}
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
  if((carryN(r)||matN(r))&&!r.hidden&&!hungry(r)&&!['store','smat','eat','fetch','flee','faint','sleep','pray','bury'].includes(r.act?.type)&&!hostileNow(r)){const G=bfs(r.x|0,r.y|0);endAct(r);if(matN(r))goStoreMat(r,G);else goStore(r,G);return true}/* お話によばれたら、荷物をしまって、すぐ向かう */
  if(!fieldActorReady(r)||onHold(r)||['fieldstory','fieldassist','questjoy','nmeet','sevreact'].includes(r.act?.type)||!questVisitSafe(r,p.obj))return false;
  const G=bfs(r.x|0,r.y|0),stand=storyWaitStand(r,G,p);if(stand<0){const open=p.field?nearest(G,j=>walk(j)&&!sacredReserved(j)&&fieldDistance(j,p.obj)>=1&&fieldDistance(j,p.obj)<=3,150)>=0:questVisitOpen(G,p.obj);noteStoryWaitBlock(r,p.obj,open?'crowded':'path');return false;}clearStoryWaitBlock(r);
  rememberStoryHome(r,p.key);endAct(r);startAct(r,G,'storywait',stand,{key:'storywait'+stand,storyKey:p.key,obj:p.obj});return true;
}
ACT.storywait={start(r,a){const p=mainStoryWaitInfo();a.front=!!(p&&p.free&&!S.obj[a.obj]&&a.obj!==S.flags.kgMark);/* 場所に物がなければ、正面（手前）を向いて待つ。物があれば、そちらを向く */if(!a.front)faceTo(r,p?.field||p?.tree?fieldStump(a.obj):a.obj);r.bubble='';},done(r,a){const p=mainStoryWaitInfo();return !p||p.key!==a.storyKey||p.obj!==a.obj||!p.cast.includes(r)||!questVisitSafe(r,a.obj);}};
ACT.storyreturn={done:()=>true};
function mainStoryBubbleReady(r){
  if(isNight())return false;
  const pendingQ=QUESTS[S.qStory??S.quest];if(pendingQ?.field){const step=FIELD_STORIES[pendingQ.id][S.qStory!=null?FIELD_STORIES[pendingQ.id].length-1:0];if(fieldCast(step).length!==(step.cast||[step.who]).length)return false;}
  if(r?.act?.type==='fieldintro')return earthIntroSpeaker(QUESTS[S.quest])===r.name;
  const p=mainStoryWaitInfo();if(!r)return !p||p.who!==GOD||p.cast.every(x=>x.act?.type==='storywait'&&x.act.stage==='do'&&x.act.storyKey===p.key&&x.act.obj===p.obj);
  if(!p)return !!r&&!r.hidden&&TALKW===r.name;/* どこで話してもよいひとりの会話 */
  return !!p&&p.cast.includes(r)&&p.cast.every(x=>x.act?.type==='storywait'&&x.act.stage==='do'&&x.act.storyKey===p.key&&x.act.obj===p.obj)&&storyWaitProtected(r);
}
function mainStoryPromptText(w){if(w===GOD&&!mainStoryBubbleReady())return 'なかまが、お話の場所に集まっている';const r=S.res.find(r=>r.name===w),p=mainStoryWaitInfo();return r&&!mainStoryBubbleReady(r)?(p&&p.cast.length>1?'みんな':w)+'が、お話の場所に集まっている':w+'が話したそうにしている';}
/* 上の目標から、未読の会話・現在の調査の場所を探せる。夜は一覧を使う。 */
function mainStoryFocusTarget(){
  if(!S||S.free||S.cleared||isNight()||!$('#dialog').hidden)return null;
  const report=S.qStory!=null,q=QUESTS[report?S.qStory:S.quest];if(!q)return null;
  if(q.id==='nushi'&&S.qTalked){const target=grassEndingFocusTarget();if(target)return target;}
  if(TALKW===GOD&&godHere()&&mainStoryBubbleReady())return{x:godX(),y:godY()-.8,w:3,h:3};
  if(q.field){
    if(!report&&(!S.qTalked&&!earthIntroCurrent()||S.qTalked&&!fieldStoryCurrent()))return null;
    fieldStoryEnsure(q.id);const j=S.sacredRoot;
    if(j!=null)return{x:storyTreeX(j),y:storyTreeY(j)-.3,w:sacredSpan(),h:sacredSpan()};
  }
  const p=mainStoryWaitInfo();if(!p)return null;const z=p.id&&BL[p.id]?szAt(p.id,p.obj)||[1,1]:[1,1];
  return{x:p.obj%W+z[0]/2,y:(p.obj/W|0)+z[1]/2-.5,w:z[0],h:z[1]};
}
function focusMainStoryPlace(){
  const target=mainStoryFocusTarget();if(!target)return false;
  if(sheet)closeSheet();setMode('look');sfx('tap');
  const top=Math.max(76,($('#topUI').getBoundingClientRect().bottom||64)+12),bottom=Math.max(top+80,($('#botUI').getBoundingClientRect().top||VH-80)-14);
  const z=Math.max(minZ(),Math.min(2.2,Math.max(cam.z,homeZ(),1.6),(VW-56)/((target.w+3)*TS),(bottom-top)/((target.h+4)*TS)));
  const ty=target.y*TS+(VH/2-(top+bottom)/2)/z;
  camAnim={fz:cam.z,tz:z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:target.x*TS,ty,t:0,dur:.8,storyGoal:true};return true;
}
function openCurrentGoal(){if(!focusMainStoryPlace())openSheet('menu','goal');}
const STORY_WAIT_BLOCKS=new WeakMap();
function noteStoryWaitBlock(r,obj,reason){STORY_WAIT_BLOCKS.set(r,{owner:S,session:VILLAGE_SESSION,obj,until:S.t+3,reason});}
function clearStoryWaitBlock(r){STORY_WAIT_BLOCKS.delete(r);}
function storyWaitReason(r,obj){
  const n=r.name;
  if(r.hidden)return n+'がもどるのを待とう';
  if(r.coffin||['bury','pray'].includes(r.act?.type))return n+'がお見送りを終えてから向かう';
  if(!questVisitSafe(r,obj)||hostileNow(r))return '近くにコワイノがいる。安全になるのを待とう';
  if(r.meal||hungry(r)||['eat','fetch','forage'].includes(r.act?.type))return n+'が食事を済ませてから向かう';
  if(['sleep','faint'].includes(r.act?.type)||r.energy<20)return n+'が休んでから向かう';
  if(r.cing||r.act?.type==='cook')return n+'が料理を終えてから向かう';
  if(carryN(r)||matN(r))return n+'が荷物をしまってから向かう';
  if(HOLD.has(r.id)||onHold(r))return n+'の用事が終わるのを待とう';
  const b=STORY_WAIT_BLOCKS.get(r);
  if(b?.owner===S&&b.session===VILLAGE_SESSION&&b.obj===obj&&b.until>=S.t)return n+(b.reason==='crowded'?'の立つ場所を空けよう':'が通れない。道をあけよう');
  return n+(['fieldintro','storywait'].includes(r.act?.type)?'がお話の場所へ向かっている':'が向かう準備をしている');
}
function storyCalled(r){const p=mainStoryWaitInfo();if(p&&p.cast.includes(r))return true;{const fq=typeof fieldStoryCurrent==='function'&&fieldStoryCurrent();if(fq){const st=FIELD_STORIES[fq.id][fieldStoryState(fq.id)?.step||0];if(st&&fieldCast(st).includes(r))return true}}const q=typeof earthIntroCurrent==='function'&&earthIntroCurrent();return !!q&&fieldCast(FIELD_STORIES[q.id][0]).includes(r)}/* メインのお話によばれている */
function storyWaitStatusText(){
  if(!S||S.free||S.cleared||isNight())return null;
  let p=mainStoryWaitInfo();if(!p){const q=earthIntroCurrent();if(!q)return null;fieldStoryEnsure(q.id);const step=FIELD_STORIES[q.id][0];p={cast:fieldCast(step),obj:S.sacredRoot,who:fieldStoryActor(step)?.name,field:true,intro:true};}
  if(p.field){const step=FIELD_STORIES[(p.q||earthIntroCurrent()).id].at(p.intro?0:-1),missing=(step.cast||[step.who]).map(sevName).find(n=>!S.res.some(r=>r.name===n));if(missing)return missing+'がもどるまで、お話は進まない';}
  if(p.obj==null)return 'お話の場所を探している';
  if(p.field&&!S.obj.includes('tower')&&!sacredRootFits(p.obj))return '木のまわりにある物を、先に片づけよう';
  const pending=p.cast.find(r=>p.intro?!(r.act?.type==='fieldintro'&&r.act.stage==='do'&&earthIntroValid(r,r.act)):!(r.act?.type==='storywait'&&r.act.stage==='do'&&r.act.storyKey===p.key&&r.act.obj===p.obj));
  if(pending){const t=storyWaitReason(pending,p.obj);return p.cast.length>1&&/(お話の場所へ向かっている|向かう準備をしている)$/.test(t)?'みんなが、お話の場所へ向かっている':t}
  return (p.who||'なかま')+'が話したそうにしている';
}

/* 現地で待つ子のポーズと表情：その場面で、その子がはじめに話すセリフの印（#think| など）から決める（考える・おどろく・しょんぼり・よろこぶ）。印がなければ、ふつうに立って待つ */
const SWLOOK=new WeakMap();
function storyWaitLook(r){const p=mainStoryWaitInfo();if(!p)return null;const c=SWLOOK.get(r);if(c&&c.key===p.key)return c.v;
  const L=(p.report?p.q.story:p.q.talk&&p.q.talk.lines)||[],ln=L.find(l=>Array.isArray(l)&&l[0]===r.name&&typeof l[1]==='string');let v=null;
  if(ln){const o=lineLook(ln[1]);v={face:o.face==='smile'&&o.motion==='shock'?'shock':o.face,anim:{think:'talkthink',shock:'talkshock',sad:'talksad',nod:'talk'}[o.motion]||(o.motion==='joy'||o.wave?'wave':'')}}
  SWLOOK.set(r,{key:p.key,v});return v}
