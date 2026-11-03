'use strict';
/* 仲間の力で現地を調べる、草原だけの物語。設置数・所持数では進まない。 */
const FIELD_STORIES={"earthListen":[{"site":"root","who":"N","label":"切り株の根元を確かめる","kind":"root","anim":"pray","dur":7,"lines":[["N","ここに、細い根があるよぉ。"],["F","……まだ、やわらかい。"]],"cast":["F","N"]}],"earthRoot":[{"site":"root","who":"N","label":"根を傷つけずに土をよける","kind":"root","anim":"weed","dur":9,"lines":[["F","あっ、そこ！　そこにある！"],["N","はいはい。……ほんとだねぇ。"]],"cast":["F","N"]},{"site":"root","who":"F","label":"掘り出した根にそっと触れる","kind":"root","anim":"pluck","dur":6,"lines":[["N","そっとなら、だいじょうぶだよぉ。"],["F","……つめたい。"],["N","ずいぶん長いあいだ、日に当たってなかったんだねぇ。"]],"cast":["F","N"]}],"fireRoot":[{"site":"root","who":"H","label":"根から離して小さな火を使う","kind":"ember","anim":"pray","dur":10,"lines":[["H",{"A":"……うん。これくらいの温かさなら、だいじょうぶだ。","B":"……うん。これくらいの温かさなら、だいじょうぶだ。"}],["N","土にも、ゆっくり伝わってるよぉ。"]],"cast":["F","N","H"]},{"site":"root","who":"F","label":"温まった土に手を重ねる","kind":"root","anim":"pray","dur":5,"lines":[["N","あらら。手がぶつかったねぇ。"],["F","#joy|えへへ……。"]],"cast":["F","N","H"]}],"fireTrace":[{"site":"root","who":"N","label":"温かさが逃げる隙間を整える","kind":"root","anim":"weed","dur":7,"lines":[["N","この土を、石のまわりへ寄せておくねぇ。"]],"cast":["F","N","H"]},{"site":"root","who":"H","label":"温め直した石を根の周りに置く","kind":"ember","anim":"pray","dur":7,"lines":[["H",{"A":"火は消したよ。あとは、この石が温めてくれる。","B":"火は消したぞ。あとは、この石が温めてくれる。"}]],"cast":["F","N","H"]},{"site":"root","who":"F","label":"乾いた草を石の周りにかぶせる","kind":"root","anim":"pluck","dur":5,"lines":[["F","これで、いい？"],["H",{"A":"ああ。根は、押さえつけないようにね。","B":"ああ。根は、押さえつけないようにな。"}]],"cast":["F","N","H"]}],"waterFilm":[{"site":"root","who":"M","label":"少しの水で流れを確かめる","kind":"water","anim":"draw","dur":7,"lines":[["M","ここで、水が横へ流れてしまっていますね。"]],"cast":["F","N","M"]},{"site":"root","who":"N","label":"石の間の固い土をほぐす","kind":"root","anim":"weed","dur":7,"lines":[["N","ここを、ほんの少しだけ……。"],["M","はい。そのまま、水を通します。"]],"cast":["F","N","M"]},{"site":"root","who":"M","label":"根まで水を届ける","kind":"water","anim":"draw","dur":6,"lines":[["F","……土に、しみこんでる。"]],"cast":["F","N","M"]}],"waterLeaf":[{"site":"root","who":"M","label":"芽に触れず、根元に水を届ける","kind":"water","anim":"draw","dur":6,"lines":[["M","あとは、木の準備を待ちましょう。"]],"cast":["F","M"]},{"site":"root","who":"F","label":"水の子と並んで芽を見守る","kind":"root","anim":"talkthink","dur":9,"lines":[["F","……。"],["M","……。"]],"cast":["F","M"],"pose":"sit"}],"windEcho":[{"site":"root","who":"K","label":"葉を落とさない風を通す","kind":"wind","anim":"wave","dur":7,"lines":[["K","少しずつ、通すよ。"]],"cast":["F","N","M","K"]},{"site":"root","who":"N","label":"根元の土に空気を通す","kind":"root","anim":"weed","dur":5,"lines":[["N","水の通り道は、そのままにしておくよぉ。"]],"cast":["F","N","M","K"]},{"site":"root","who":"K","label":"若葉の音を聞く","kind":"wind","anim":"talkthink","dur":7,"lines":[["K","……聞こえた。とても、細い音だ。"]],"cast":["F","N","M","K"]}],"windVoices":[{"site":"root","who":"N","label":"いつものように土をゆるめる","kind":"root","anim":"weed","dur":5,"lines":[["N","今日は、土がやわらかいねぇ。"]],"cast":["F","N","H","M","K"]},{"site":"root","who":"H","label":"石の温かさを確かめる","kind":"ember","anim":"pray","dur":5,"lines":[["H",{"A":"……うん。まだ温かい。","B":"……うん。まだ温かい。"}]],"cast":["F","N","H","M","K"]},{"site":"root","who":"M","label":"細く、水を通す","kind":"water","anim":"draw","dur":5,"lines":[["M","根の先まで、届いています。"]],"cast":["F","N","H","M","K"]},{"site":"root","who":"K","label":"葉が揺れるほどの風を起こす","kind":"wind","anim":"wave","dur":5,"lines":[["K","……どうぞ。ぼくたちも、聞いているよ。"]],"cast":["F","N","H","M","K"]},{"site":"root","who":"F","label":"フタバの声を届ける","kind":"root","anim":"talk","dur":7,"lines":[["F","ヌシ様。"],["F","ぼく、ここにいるよ。",0,"stree:quiet"],["F","……前は、ひとりだったけど。今は、ノドカも、みんなもいるんだ。"],["F","だから……もし、困ってるなら。今度は、ぼくたちが……。"],["……","……フタバ。",0,"stree:reply"],["F","……うん。"],["……","……そうか。……よかった。",0,"stree:quiet"]],"cast":["F","N","H","M","K"]}],"tower":[{"site":"root","who":"F","label":"みんなと、木に力を届ける","kind":"root","anim":"pray","dur":12,"lines":[["F","ぼくたち、これからもお世話するよ。"],["G","……よいか。根を通して、土地の力を、ゆっくり結ぶのじゃ。",0,"stree:grow"]],"cast":["F","N","H","M","K"]}]};
const FIELD_SCENES=new WeakMap();
const FIELD_SITE_OFFSETS={soilSoft:[-4,1],soilCold:[-7,0],root:[-8,-3],scorch:[-3,-7],pool:[-6,-5],echo:[-11,1]};
const fieldStoryState=id=>S.fieldStories?.[id];
const fieldStoryDone=id=>(fieldStoryState(id)?.step||0)>=(FIELD_STORIES[id]?.length||Infinity);
function fieldStoryProgress(id){const n=fieldStoryState(id)?.step||0,L=FIELD_STORIES[id];return L&&n<L.length?L[n].label+'　'+n+'/'+L.length:'調査を終えた';}
function fieldStoryCurrent(){if(!S||WD!==0||S.free||S.cleared||S.qStory!=null||!S.qTalked)return null;const q=QUESTS[S.quest];return q?.field&&!(q.id==='tower'&&S.obj.includes('tower'))&&!fieldStoryDone(q.id)?q:null;}
function fieldStoryActor(step){const name=sevName(step.who);return S.res.find(r=>r.name===name);}
function fieldStorySpotOK(j){return j===S.sacredRoot?sacredRootFits(j):sacredRootFits(j);}
function fieldStoryEnsure(id){
  const L=FIELD_STORIES[id];if(!L)return null;
  S.fieldStories||(S.fieldStories={});const state=S.fieldStories[id]||(S.fieldStories[id]={step:0});
  const step=L[state.step];if(!step)return state;
  S.fieldSites||(S.fieldSites={});const r=fieldStoryActor(step);if(!r)return state;
  if(S.sacredRoot!=null){S.fieldSites.root=S.sacredRoot;return state;}
  const G=bfs(r.x|0,r.y|0),old=S.fieldSites.root,x=old!=null?old%W:CX-8,y=old!=null?(old/W|0):CY-3;let best=-1,score=Infinity;
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>100)continue;const sc=Math.hypot(j%W-x,(j/W|0)-y)+d*.03;if(sc>=score||!sacredRootFits(j))continue;best=j;score=sc;}
  if(best>=0){S.sacredRoot=best;S.fieldSites.root=best;dirty=true;}
  return state;
}
const fieldDistance=(k,j)=>Math.max(j%W-k%W,0,k%W-(j%W+sacredSpan()-1))+Math.max((j/W|0)-(k/W|0),0,(k/W|0)-(j/W|0)-sacredSpan()+1);
const fieldCast=step=>(step.cast||[step.who]).map(w=>S.res.find(r=>r.name===sevName(w))).filter(Boolean);
const fieldActorReady=r=>!r.hidden&&!r.coffin&&!HOLD.has(r.id)&&!hungry(r)&&r.energy>=20&&!r.cing&&!r.meal&&!carryN(r)&&!matN(r)&&!['eat','fetch','forage','flee','faint','sleep','pray','bury'].includes(r.act?.type)&&!hostileNow(r);
// 会話の前から、その場にいる登場人物へ歩いて集まる。古い関数名は呼び出し元との互換のため保つ。
const earthIntroQuest=q=>!!q&&q.field&&!(q.id==='tower'&&(cnt('tower')||statueSite('tower')));
function earthIntroCurrent(){const q=S&&QUESTS[S.quest];return WD===0&&!S.free&&!S.cleared&&S.qStory==null&&!S.qTalked&&earthIntroQuest(q)&&q.talk.when()&&!qMissing(q).length?q:null;}
function earthIntroValid(r,a){const q=earthIntroCurrent(),step=q&&FIELD_STORIES[q.id][0];return !!step&&q.id===a.fieldId&&fieldCast(step).includes(r)&&S.sacredRoot===a.obj&&fieldStorySpotOK(a.obj);}
function earthIntroSpeaker(q){
  if(earthIntroCurrent()!==q||isNight())return null;fieldStoryEnsure(q.id);const step=FIELD_STORIES[q.id][0],group=fieldCast(step),lead=fieldStoryActor(step);
  if(group.length!==(step.cast||[step.who]).length||!lead)return null;
  return group.every(r=>r.act?.type==='fieldintro'&&r.act.stage==='do'&&earthIntroValid(r,r.act)&&fieldDistance((r.y|0)*W+(r.x|0),r.act.obj)<=3&&!r.hidden&&!hungry(r))?lead.name:null;
}
function tryEarthIntro(r){
  const q=earthIntroCurrent();if(!q||isNight())return false;const step=FIELD_STORIES[q.id][0];if(!fieldCast(step).includes(r))return false;
  fieldStoryEnsure(q.id);if(r.act?.type==='fieldintro'){if(earthIntroValid(r,r.act))return false;endAct(r);}
  if(!fieldActorReady(r)||onHold(r))return false;const j=S.sacredRoot;if(j==null||!questVisitSafe(r,j))return false;
  const G=bfs(r.x|0,r.y|0),occupied=occTiles(r),stand=nearest(G,k=>walk(k)&&!sacredReserved(k)&&!occupied.has(k)&&fieldDistance(k,j)>=1&&fieldDistance(k,j)<=3&&free('field'+k,1),100);
  if(stand<0)return false;rememberStoryHome(r,WD+':'+S.quest+':intro');endAct(r);startAct(r,G,'fieldintro',stand,{key:'field'+stand,fieldId:q.id,obj:j});return true;
}
ACT.fieldintro={start(r,a){if(!earthIntroValid(r,a))return false;faceTo(r,a.obj);r.bubble='';checkQuest();},done:(r,a)=>!earthIntroValid(r,a)||isNight()||hungry(r)||r.energy<10||!questVisitSafe(r,a.obj)};
function fieldStoryFocus(id){const state=fieldStoryEnsure(id),step=FIELD_STORIES[id]?.[state?.step],j=step&&S.fieldSites?.[step.site];if(j!=null)panTo((j%W+sacredSpan()/2)*TS,((j/W|0)+sacredSpan()-1.4)*TS);}
function fieldStoryTap(tx,ty){
  const q=fieldStoryCurrent();if(!q)return false;const state=fieldStoryEnsure(q.id),step=FIELD_STORIES[q.id][state.step],j=S.fieldSites?.[step.site];
  if(j==null||tx<j%W||tx>j%W+sacredSpan()-1||ty<(j/W|0)-1||ty>(j/W|0)+sacredSpan()-1)return false;
  if(isNight()){toast('調べるのは、明るくなってから');return true;}
  if(FIELD_SCENES.get(S)?.session===VILLAGE_SESSION||S.res.some(r=>r.act?.type==='fieldstory')){toast('なかまが調べにむかっている');return true;}
  const r=fieldStoryActor(step),group=fieldCast(step);
  if(!r||group.length!==(step.cast||[step.who]).length||group.some(p=>!fieldActorReady(p))){toast('なかまの食事や休けい・用事が終わってから、一緒に世話をしよう');return true;}
  const selected=new Set(),occupied=occTiles(r);for(const p of group)occupied.delete((p.y|0)*W+(p.x|0));const plans=[];
  for(const p of [r,...group.filter(p=>p!==r)]){const G=bfs(p.x|0,p.y|0),stand=nearest(G,k=>walk(k)&&!sacredReserved(k)&&!occupied.has(k)&&!selected.has(k)&&fieldDistance(k,j)>=1&&fieldDistance(k,j)<=(p===r?1:3)&&free('field'+k,1),100);if(stand<0){toast('木の周りに、なかまが集まれる道をあけよう');return true;}selected.add(stand);plans.push({p,G,stand});}
  for(const {p,G,stand}of plans){delete p.storyWaitHome;endAct(p);startAct(p,G,p===r?'fieldstory':'fieldassist',stand,{key:'field'+stand,fieldId:q.id,phase:state.step,obj:j});}
  toast(r.name+'が「'+step.label+'」を調べにいく');return true;
}
function fieldStoryValid(a){const q=fieldStoryCurrent(),step=FIELD_STORIES[a.fieldId]?.[a.phase];return q?.id===a.fieldId&&fieldStoryState(a.fieldId)?.step===a.phase&&step&&S.fieldSites?.[step.site]===a.obj&&fieldStorySpotOK(a.obj);}
function fieldStoryResult(r,a){
  const step=FIELD_STORIES[a.fieldId]?.[a.phase];if(!step||a.cancel||a.t<step.dur||!fieldStoryValid(a))return;
  const owner=S,token={session:VILLAGE_SESSION,id:a.fieldId,phase:a.phase};if(FIELD_SCENES.get(owner)?.session===VILLAGE_SESSION)return;FIELD_SCENES.set(owner,token);dialog(KS(typeof sacredDirectedLines==='function'?sacredDirectedLines(step,a):step.lines),()=>{
    if(FIELD_SCENES.get(owner)===token)FIELD_SCENES.delete(owner);
    if(S!==owner||VILLAGE_SESSION!==token.session||!fieldStoryValid(a))return;
    if(a.fieldId==='tower'&&!growStoryTree())return;
    fieldStoryState(a.fieldId).step++;r.bubble='';dirty=true;
    if(!fieldStoryDone(a.fieldId)&&S.res.includes(r)&&!hungry(r)&&!isNight()){
      endAct(r);startAct(r,null,'fieldwait',-1,{fieldId:a.fieldId});
    }
    if(typeof sacredEndDirection==='function')sacredEndDirection();renderQuest();checkQuest();
  });
}
ACT.fieldstory={
  start(r,a){if(!fieldStoryValid(a))return false;faceTo(r,a.obj);r.bubble='';},
  tick(r,a,dt){
    if(!fieldStoryValid(a))return;const step=FIELD_STORIES[a.fieldId][a.phase],others=fieldCast(step).filter(p=>p!==r);
    if(others.some(p=>p.act?.type!=='fieldassist'||p.act.phase!==a.phase)){a.cancel=true;return;}
    if(others.some(p=>p.act.stage!=='do')){a.t=0;return;}
    if(step.pose==='sit')for(const p of fieldCast(step))sacredSetPose(p,{anim:'talkthink',sit:true});

  },
  done:(r,a)=>a.cancel||!fieldStoryValid(a)||a.t>=FIELD_STORIES[a.fieldId][a.phase].dur,
  end:fieldStoryResult
};
ACT.fieldassist={start(r,a){faceTo(r,a.obj);r.bubble='';},done:(r,a)=>!fieldStoryValid(a)||isNight()||hungry(r)||!S.res.some(p=>p.act?.type==='fieldstory'&&p.act.fieldId===a.fieldId&&p.act.phase===a.phase)};
ACT.fieldwait={start(r){r.bubble='';},done:(r,a)=>fieldStoryCurrent()?.id!==a.fieldId||isNight()||hungry(r)};
function fieldStoryAnim(r){const pose=sacredPose(r);if(pose)return pose.anim;return r.act?.type==='storywait'?'storyListen':r.act?.type==='fieldstory'?FIELD_STORIES[r.act.fieldId]?.[r.act.phase]?.anim||'talk':['fieldwait','fieldintro','fieldassist'].includes(r.act?.type)?'talkthink':r.act?.type;}
function drawFieldStory(now,labelsOnly=false){
  if(!$('#dialog').hidden)return;const q=fieldStoryCurrent();if(!q)return;const state=fieldStoryState(q.id),step=FIELD_STORIES[q.id][state?.step||0],j=S.fieldSites?.[step.site];if(j==null)return;
  const x=(j%W+sacredSpan()/2)*TS,y=((j/W|0)+sacredSpan()-.45)*TS-hiAt(j)*LIFT,t=now/600;
  ctx.save();if(labelsOnly){ctx.font='bold 11px "PixelMplus10",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff5d4';ctx.strokeStyle='#695438';ctx.lineWidth=3;const label='！ '+step.label;ctx.strokeText(label,x,y-17);ctx.fillText(label,x,y-17);ctx.restore();return;}
  ctx.strokeStyle='#f9d77b';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y+5,19+Math.sin(t),9,0,0,7);ctx.stroke();ctx.restore();
}
