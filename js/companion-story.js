'use strict';
/* 仲間の力で現地を調べる、草原だけの物語。設置数・所持数では進まない。 */
const FIELD_STORIES={"earthListen":[{"site":"root","who":"N","label":"根を傷つけずに土をよける","kind":"root","anim":"weed","dur":6,"pre":[["N","ふくろ、置けたねぇ。じゃあ、まわりの土を、そっとよけるよぉ。"],["F","根っこ、見えるかな。"]],"lines":[["F","あっ、そこ！　根っこがある！",0,"stree:soil"],["F","……あったかい。でも、よわい……",0,"stree:touch"],["N","まわりの土が冷たいから、ぬくもりが、にげていっちゃうんだねぇ。"],["N","でも、さわったら、根が少しだけ、ふくらんだよぉ。",0,"stree:glow"]],"cast":["F","N"]}],"fireRoot":[{"site":"root","who":"H","label":"温めた石を根の周りに置く","kind":"ember","anim":"pray","dur":8,"pre":[["H","このたき火なら、石をちょうどよく温められるぞ。"],["F","もっと大きな火にしなくていいの？"],["H","ちょっとずつでいいんだよ。すぐ冷えないように、石を温めておこう。"]],"lines":[["H","火は消したぞ。あとは、この石が温めてくれる。",0,"stree:stone"],["N","土をよせて、ぬくもりがにげないようにするねぇ。",0,"stree:soil"],["F","かわいた草も、かぶせておくね。",0,"stree:cover"],["H","ああ。根は、押さえつけないようにな。"]],"cast":["F","N","H"]}],"waterFilm":[{"site":"root","who":"M","label":"根まで水を届ける","kind":"water","anim":"draw","dur":7,"pre":[["M","このかめの水なら、少しずつ使えますね。"],["M","でも、ここで水が横へ流れてしまっています。",0,"stree:runoff"],["N","石の間のかたい土を、ほんの少しほぐすよぉ。",0,"stree:soil"]],"lines":[["F","……土に、しみこんでる。",0,"stree:water"],["M","根のほうへ、行ったんですよ。"],["F","そっか。飲めたんだね。"],["M","芽がひらくまで、少しかかるかもしれません。"]],"cast":["F","N","M"]}],"windEcho":[{"site":"root","who":"K","label":"若葉の音を聞く","kind":"wind","anim":"wave","dur":7,"pre":[["K","風車が、ゆっくり回っているね。ここの風は、やさしい。"],["K","少しずつ、通すよ。",0,"stree:wind"]],"lines":[["K","……聞こえた。とても、細い音だ。"],["F","いま、何か言った？　……ヌシ様？"],["K","何も鳴らなかった木が、音を返してくれた。フタバ、きみが話してみて。"],["F","ヌシ様。ぼく、ここにいるよ。",0,"stree:quiet"],["F","……前は、ひとりだったけど。今は、ノドカも、みんなもいるんだ。"],["F","だから……もし、困ってるなら。今度は、ぼくたちが……。"],["……","……フタバ。",0,"stree:reply"],["F","……うん。"],["……","……そうか。……よかった。",0,"stree:quiet+stree:lookup+stree:glow"]],"cast":["F","N","H","M","K"]}],"tower":[{"site":"root","who":"F","label":"みんなと、木に力を届ける","kind":"root","anim":"pray","dur":12,"lines":[["F","ベンチ、できたね。ここなら、みんなで木を見ていられる。"],["F","ぼくたち、これからもお世話するよ。"],["G","……よいか。根を通して、土地の力を、ゆっくり結ぶのじゃ。",0,"stree:grow"]],"cast":["F","N","H","M","K"]}]};
const FIELD_SCENES=new WeakMap();
const FIELD_SITE_OFFSETS={soilSoft:[-4,1],soilCold:[-7,0],root:[-4,0],scorch:[-3,-7],pool:[-6,-5],echo:[-11,1]};
/* まとめる前（fieldMerge1 より前）の調べの段階の数と、まとめた先 */
const FIELD_V1_LEN={earthListen:1,earthRoot:2,fireRoot:2,fireTrace:3,waterFilm:3,waterLeaf:2,windEcho:3,windVoices:5},FIELD_MERGE1={earthRoot:'earthListen',fireTrace:'fireRoot',waterLeaf:'waterFilm',windVoices:'windEcho'};
/* 調べを、なかまごとに1つの場面にまとめた（1回だけ）。あとの調べを終えていれば、まとめた場面も終えたことに。とちゅうなら、まとめた場面のはじめから */
function migrateFieldMerge(state){if(!state.flags||state.flags.fieldMerge1)return;state.flags.fieldMerge1=1;const F=state.fieldStories;if(F)for(const [b,a]of Object.entries(FIELD_MERGE1)){const A=F[a],B=F[b];if(!A&&!B)continue;const done=!!B&&(B.step||0)>=FIELD_V1_LEN[b];if(A){A.step=done?1:0;if(!done)delete A.auto}else F[a]={step:done?1:0};delete F[b];}
  const W=state.flags.playWon;if(W)for(const [b,a]of Object.entries({earthRoot:'earthListen'}))if(W[b]){W[a]=true;delete W[b]}}
const fieldStoryState=id=>S.fieldStories?.[id];
const fieldStoryDone=id=>(fieldStoryState(id)?.step||0)>=(FIELD_STORIES[id]?.length||Infinity);
/* 1つの依頼で、いくつかの調べ（parts）をじゅんにする。いまの調べは、まだ終わっていない最初のもの */
const fieldActiveId=q=>q.fieldParts?q.fieldParts.find(id=>!fieldStoryDone(id))||q.fieldParts[q.fieldParts.length-1]:q.id;
const fieldLastId=q=>q.fieldParts?q.fieldParts[q.fieldParts.length-1]:q.id;
const fieldPartsDone=q=>(q.fieldParts||[q.id]).every(fieldStoryDone);
const FIELD_VIEWS=new WeakMap();
function fieldView(q){/* いまの調べの名前を id に持つ、その依頼の見かた（同じ調べなら同じ物） */const id=fieldActiveId(q);if(id===q.id)return q;let m=FIELD_VIEWS.get(q);if(!m){m=new Map();FIELD_VIEWS.set(q,m)}let v=m.get(id);if(!v){v=Object.create(q,{id:{value:id}});m.set(id,v)}return v}
function fieldQuestProgress(parts){const id=parts.find(p=>!fieldStoryDone(p));if(!id)return '調査を終えた';const prep=typeof fieldPrepNeed==='function'&&fieldPrepNeed(id);if(prep)return prep.label;let n=0,all=0;for(const p of parts){const L=FIELD_STORIES[p]||[];all+=L.length;n+=Math.min(L.length,fieldStoryState(p)?.step||0)}const st=FIELD_STORIES[id][fieldStoryState(id)?.step||0],miss=S.qTalked&&(st.cast||[st.who]).map(sevName).find(m=>!S.res.some(r=>r.name===m&&!r.hidden));return st.label+'　'+n+'/'+all+(miss?'　'+miss+'がもどるのを待とう':S.qTalked&&isNight()?'　朝を待とう':'')}/* 調べは昼だけ・そろってから */
function fieldStoryProgress(id){const n=fieldStoryState(id)?.step||0,L=FIELD_STORIES[id],prep=typeof fieldPrepNeed==='function'&&fieldPrepNeed(id);if(prep)return prep.label;return L&&n<L.length?L[n].label+'　'+n+'/'+L.length:'調査を終えた';}
function fieldStoryCurrent(){if(!S||WD!==0||S.free||S.cleared||S.qStory!=null||!S.qTalked)return null;const q=QUESTS[S.quest];return q?.field&&!(q.id==='tower'&&S.obj.includes('tower'))&&!fieldPartsDone(q)?fieldView(q):null;}
function fieldStoryActor(step){const name=sevName(step.who);return S.res.find(r=>r.name===name);}
function fieldStorySpotOK(j){return j===S.sacredRoot?sacredRootFits(j):sacredRootFits(j);}
function fieldStoryEnsure(id){
  const L=FIELD_STORIES[id];if(!L)return null;
  S.fieldStories||(S.fieldStories={});const state=S.fieldStories[id]||(S.fieldStories[id]={step:0});
  const step=L[state.step];if(!step)return state;
  S.fieldSites||(S.fieldSites={});const r=fieldStoryActor(step);if(!r)return state;
  sacredRootEnsure(r);return state;
}
/* 御神木の切り株の場所：草原のはじめから置いておく（新しいゲーム・切り株のない古いセーブ）。神殿の西どなりの、歩いて行ける空いた所 */
function sacredRootEnsure(r){
  if(!S||WD!==0||S.free)return S&&S.sacredRoot;S.fieldSites||(S.fieldSites={});
  if(S.sacredRoot!=null){S.fieldSites.root=S.sacredRoot;return S.sacredRoot;}
  if(S.obj.includes('tower'))return null;
  const G=r?bfs(r.x|0,r.y|0):bfs(CX,CY+2),old=S.fieldSites.root,x=old!=null?old%W:CX-5,y=old!=null?(old/W|0):CY;if(old==null){const tj=y*W+x,cs=sacredCells(tj),nat=o=>!o||WEEDS.has(o)||o==='ntree'||o==='deadtree'||o==='rock'||o==='bush';if(cs.every(k=>nat(S.obj[k])&&!S.floor[k]&&!roomOf(k)&&S.ground[k]!==1&&S.ground[k]!==2&&hiAt(k)===hiAt(tj))){let ch=false;for(const k of cs)if(S.obj[k]){S.obj[k]='';ch=true}if(ch)recount()}}/* 切り株の場所の、自然の木・岩・草は片づける */let best=-1,score=Infinity;
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>100)continue;const sc=Math.hypot(j%W-x,(j/W|0)-y)+d*.03;if(sc>=score||!sacredRootFits(j))continue;best=j;score=sc;}
  if(best>=0){S.sacredRoot=best;S.fieldSites.root=best;dirty=true;}
  return S.sacredRoot;
}
const fieldStump=j=>j+(sacredSpan()-1)*W+(sacredSpan()>>1);/* 切り株（木）の根元のマス */
function fieldLeadStand(G,j,ok){/* 調べる子は、切り株のすぐよこ・すぐ前に立つ（近い順） */const s=fieldStump(j),sx=storyTreeX(j),sy=(s/W|0)+.5;let best=-1,bd=Infinity;for(let y=(s/W|0);y<=(s/W|0)+1;y++)for(let x=Math.floor(sx-1.5);x<=Math.ceil(sx+.5);x++){const k=y*W+x;if(k===s||x<0||x>=W||y>=H||G.dist[k]<0||!walk(k)||!ok(k))continue;const d=Math.hypot(x+.5-sx,y+.5-sy);if(Math.abs(x+.5-sx)>1.5||d>=bd)continue;bd=d;best=k}return best}
const fieldDistance=(k,j)=>Math.max(j%W-k%W,0,k%W-(j%W+sacredSpan()-1))+Math.max((j/W|0)-(k/W|0),0,(k/W|0)-(j/W|0)-sacredSpan()+1);
const fieldCast=step=>(step.cast||[step.who]).map(w=>S.res.find(r=>r.name===sevName(w))).filter(Boolean);
const fieldCastFull=step=>!!step&&fieldCast(step).length===(step.cast||[step.who]).length;/* 調べにいる子が、みんな村にいる */
function fieldMissNames(q){if(!q||!q.field||!FIELD_STORIES[q.id])return [];const L=FIELD_STORIES[q.id],st=S.qStory!=null?L[L.length-1]:L[fieldStoryState?.(q.id)?.step||0];return st?(st.cast||[st.who]).map(sevName).filter(n=>!S.res.some(r=>r.name===n)&&((S.buried||[]).some(b=>b.name===n)||(S.lost||[]).some(b=>b.name===n))):[]}/* 調べ・お礼にいる子で、村にいない子 */
const fieldActorReady=r=>!r.hidden&&!r.coffin&&!HOLD.has(r.id)&&!hungry(r)&&!r.meal&&!['eat','fetch','flee','faint','pray','bury'].includes(r.act?.type)&&!(r.act?.type==='sleep'&&isNight())&&!hostileNow(r);/* お話によばれたら、仕事・遊び・荷物はそのままで、すぐ向かう（おなかがすいた・ごはんを持っている子は、先に食べる） */
// 会話の前から、その場にいる登場人物へ歩いて集まる。古い関数名は呼び出し元との互換のため保つ。
const earthIntroQuest=q=>!!q&&q.field&&!(q.id==='tower'&&(cnt('tower')||statueSite('tower')));
function earthIntroCurrent(){const q=S&&QUESTS[S.quest];return WD===0&&!S.free&&!S.cleared&&S.qStory==null&&!S.qTalked&&earthIntroQuest(q)&&q.talk.when()&&!qMissing(q).length?q:null;}
function earthIntroValid(r,a){const q=earthIntroCurrent(),step=q&&FIELD_STORIES[q.id][0];return !!step&&q.id===a.fieldId&&fieldCast(step).includes(r)&&S.sacredRoot===a.obj&&fieldStorySpotOK(a.obj);}
function earthIntroSpeaker(q){
  if(earthIntroCurrent()!==q||isNight())return null;fieldStoryEnsure(q.id);const step=FIELD_STORIES[q.id][0],group=fieldCast(step),lead=fieldStoryActor(step);
  if(group.length!==(step.cast||[step.who]).length||!lead)return null;
  return group.every(r=>r.act?.type==='fieldintro'&&r.act.stage==='do'&&earthIntroValid(r,r.act)&&fieldDistance((r.y|0)*W+(r.x|0),r.act.obj)<=3&&!r.hidden&&!hungry(r))?lead.name:null;
}
const INTRO_SLOTS=new WeakMap();function introSlots(id,cast,j){const key=id+':'+j+':'+cast.map(r=>r.id).join(',');let c=INTRO_SLOTS.get(S);if(!c||c.key!==key||c.session!==VILLAGE_SESSION){c={key,session:VILLAGE_SESSION,m:storySlots(cast,{stump:j})};INTRO_SLOTS.set(S,c)}return c.m}
function tryEarthIntro(r){
  const q=earthIntroCurrent();if(!q||isNight())return false;const step=FIELD_STORIES[q.id][0];if(!fieldCastFull(step)||!fieldCast(step).includes(r))return false;
  fieldStoryEnsure(q.id);if(r.act?.type==='fieldintro'){if(earthIntroValid(r,r.act))return false;endAct(r);}
  if(!fieldActorReady(r)||onHold(r))return false;const j=S.sacredRoot;if(j==null||!questVisitSafe(r,j))return false;
  const G=bfs(r.x|0,r.y|0),slots=introSlots(q.id,fieldCast(step),j),s0=slots.get(r),spot=k=>k!=null&&k>=0&&G.dist[k]>=0&&!(k===r.avoidJ&&S.t<r.avoidU)/* しばらくえらばない行き先（startAct で、ひとやすみにかわる）はさける */&&walk(k)&&!(S.obj[k]&&!WEEDS.has(S.obj[k])&&!(BL[S.obj[k]]&&BL[S.obj[k]].kind==='plant'))&&free('field'+k,1),stand=spot(s0)?s0:((storySlotCells({stump:j}).find(c=>spot(c.k)&&!sacredReserved(c.k))||storySlotCells({stump:j},5.6).find(c=>spot(c.k)&&!sacredReserved(c.k)))?.k??-1);/* 定位置が物でふさがった・行けなくなったときは、切り株のそばの空いた所へ（定位置を待ちつづけて、ほかの子が止まったままにならないように） */
  if(stand<0){const open=nearest(G,k=>walk(k)&&!sacredReserved(k)&&fieldDistance(k,j)>=1&&fieldDistance(k,j)<=3,100)>=0;noteStoryWaitBlock(r,j,open?'crowded':'path');return false;}clearStoryWaitBlock(r);rememberStoryHome(r,WD+':'+S.quest+':intro');endAct(r);startAct(r,G,'fieldintro',stand,{key:'field'+stand,fieldId:q.id,obj:j});return true;
}
ACT.fieldintro={start(r,a){if(!earthIntroValid(r,a))return false;faceTo(r,fieldStump(a.obj));r.bubble='';checkQuest();},done:(r,a)=>!earthIntroValid(r,a)||isNight()||hungry(r)||r.energy<10||!questVisitSafe(r,a.obj)};
function fieldStoryFocus(id){const state=fieldStoryEnsure(id),step=FIELD_STORIES[id]?.[state?.step],j=step&&S.fieldSites?.[step.site];if(j!=null)panTo((j%W+sacredSpan()/2)*TS,((j/W|0)+sacredSpan()-1.4)*TS);}
function fieldStoryTap(tx,ty){
  const q=fieldStoryCurrent();if(!q)return false;const state=fieldStoryEnsure(q.id),step=FIELD_STORIES[q.id][state.step],j=S.fieldSites?.[step.site];
  if(j==null||tx<j%W||tx>j%W+sacredSpan()-1||ty<(j/W|0)-1||ty>(j/W|0)+sacredSpan()-1)return false;
  fieldStoryStart(q,false);return true;
}
/* 調べをはじめる。quiet：自動で続けるとき（知らせを出さない） */
function fieldStoryStart(q,quiet){
  const say=t=>{if(!quiet)toast(t);return false};const state=fieldStoryEnsure(q.id),step=FIELD_STORIES[q.id][state.step],j=S.fieldSites?.[step.site];if(j==null)return false;
  if(isNight())return say('調べるのは、明るくなってから');
  {const prep=typeof fieldPrepNeed==='function'&&fieldPrepNeed(q.id);if(prep)return say(prep.label);}
  if(FIELD_SCENES.get(S)?.session===VILLAGE_SESSION||S.res.some(r=>r.act?.type==='fieldstory'))return say('なかまが調べにむかっている');
  const r=fieldStoryActor(step),group=fieldCast(step);
  if(!r||group.length!==(step.cast||[step.who]).length){const missing=(step.cast||[step.who]).map(sevName).find(n=>!S.res.some(p=>p.name===n));return say(missing?missing+'がもどってから、一緒に世話をしよう':'なかまがそろったら、一緒に世話をしよう');}
  if(group.some(p=>!fieldActorReady(p)||p.act?.type==='fieldgather'&&p.act.stage!=='do')){state.auto=true;/* 予定のある子がいても、とりやめない。予定がおわった子から、じゅんに木のそばへ集まる（tryFieldGather） */if(!quiet){const w=group.find(p=>!fieldActorReady(p));toast(w?storyWaitReason(w,j):'みんなが木のそばへ集まっている')}return !quiet;}
  const selected=new Set(),occupied=occTiles(r);for(const p of group)occupied.delete((p.y|0)*W+(p.x|0));const plans=[];
  const look=state.step===0&&typeof fieldBuiltCell==='function'?fieldBuiltCell(q.id):null;/* 作った物を、まず見にいく */
  const here=p=>{const k=(p.y|0)*W+(p.x|0);return ['fieldwait','fieldgather'].includes(p.act?.type)&&p.act.stage==='do'&&p.act.obj===j&&k!==fieldStump(j)&&walk(k)&&fieldDistance(k,j)<=(p===r?1:3)?k:-1};/* もう木のそばで待っている子は、その場所のまま（解散しない） */
  for(const p of group)if(p!==r&&here(p)>=0)occupied.add(here(p));/* その場で待つ子のマスは、ほかの子に使わせない */
  const leadG=bfs(r.x|0,r.y|0),lead0=look!=null?nearest(leadG,k=>walk(k)&&k!==look&&!sacredReserved(k)&&!occupied.has(k)&&Math.abs(k%W-look%W)<=1&&Math.abs((k/W|0)-(look/W|0))<=1&&free('field'+k,1),100):here(r)>=0?here(r):fieldLeadStand(leadG,j,k=>!occupied.has(k)&&free('field'+k,1)),slots=storySlots([r,...group.filter(p=>p!==r)],{stump:j},lead0>=0?lead0:null);
  for(const p of [r,...group.filter(p=>p!==r)]){const G=bfs(p.x|0,p.y|0),sl=slots.get(p),h=p===r?(lead0>=0&&G.dist[lead0]>=0&&!selected.has(lead0)?lead0:-1):here(p),stand=h>=0&&!selected.has(h)?(occupied.delete(h),h):sl!=null&&G.dist[sl]>=0&&!selected.has(sl)?sl:p===r?fieldLeadStand(G,j,k=>!occupied.has(k)&&!selected.has(k)&&free('field'+k,1)):nearest(G,k=>walk(k)&&!sacredReserved(k)&&!occupied.has(k)&&!selected.has(k)&&fieldDistance(k,j)>=1&&fieldDistance(k,j)<=(p===r?1:3)&&free('field'+k,1),100);if(stand<0)return say('木の周りに、なかまが集まれる道をあけよう');selected.add(stand);plans.push({p,G,stand});}
  for(const {p,G,stand}of plans){delete p.storyWaitHome;endAct(p);startAct(p,G,p===r?'fieldstory':'fieldassist',stand,{key:'field'+stand,fieldId:q.id,phase:state.step,obj:j,...(p===r&&look!=null?{look}:{})});}
  state.auto=true;/* 1回はじめたら、この話の最後まで自動で続く */if(!quiet)toast(r.name+'が「'+step.label+'」を調べにいく');return true;
}
function fieldStoryValid(a){const q=fieldStoryCurrent(),step=FIELD_STORIES[a.fieldId]?.[a.phase];return q?.id===a.fieldId&&fieldStoryState(a.fieldId)?.step===a.phase&&step&&S.fieldSites?.[step.site]===a.obj&&fieldStorySpotOK(a.obj);}
function fieldStoryResult(r,a){
  const step=FIELD_STORIES[a.fieldId]?.[a.phase];if(!step||a.cancel||a.t<step.dur||!fieldStoryValid(a))return;
  const owner=S,token={session:VILLAGE_SESSION,id:a.fieldId,phase:a.phase};if(FIELD_SCENES.get(owner)?.session===VILLAGE_SESSION)return;FIELD_SCENES.set(owner,token);
  const cast=fieldCast(step);for(const p of cast)if(p!==r&&p.act?.type==='fieldassist'&&p.act.phase===a.phase){endAct(p);fieldWaitHere(p,a.obj);}/* 会話のあいだも、その場で待つ */dialog(KS(typeof sacredDirectedLines==='function'?sacredDirectedLines(step,a):step.lines),()=>{
    if(FIELD_SCENES.get(owner)===token)FIELD_SCENES.delete(owner);
    if(S!==owner||VILLAGE_SESSION!==token.session||!fieldStoryValid(a))return;
    if(a.fieldId==='tower'&&!growStoryTree())return;
    fieldStoryState(a.fieldId).step++;r.bubble='';dirty=true;
    {const q=QUESTS[S.quest],P=q?.fieldParts,k=P?P.indexOf(a.fieldId):-1;if(k>=0&&k<P.length-1&&fieldStoryDone(a.fieldId)){const nx=fieldStoryEnsure(P[k+1]);if(nx)nx.auto=true}}/* おなじ依頼のつぎの調べも、そのままつづける */
    for(const p of cast)if(S.res.includes(p)&&!p.hidden&&(p===r||p.act?.type==='fieldwait')&&!hungry(p)&&!isNight()){endAct(p);fieldWaitHere(p,a.obj);}/* 解散しない。つづきがなければ fieldwait がおわる */
    if(typeof FIELD_AUTO_AT!=='undefined')FIELD_AUTO_AT.set(S,performance.now()+DLGWAIT);/* つぎの調べは、3秒あけてから */
    if(typeof sacredEndDirection==='function')sacredEndDirection();renderQuest();checkQuest();
  });
}
ACT.fieldstory={
  start(r,a){if(!fieldStoryValid(a))return false;faceTo(r,a.look!=null?a.look:fieldStump(a.obj));r.bubble='';},
  tick(r,a,dt){
    if(!fieldStoryValid(a))return;const step=FIELD_STORIES[a.fieldId][a.phase],others=fieldCast(step).filter(p=>p!==r);
    if(others.some(p=>p.act?.type!=='fieldassist'||p.act.phase!==a.phase)){a.cancel=true;return;}
    if(others.some(p=>p.act.stage!=='do')){a.t=0;return;}
    if(step.pre&&!a.preDone){if(!a.preOpen&&$('#dialog').hidden){a.preOpen=1;const owner=S,ses=VILLAGE_SESSION;dialog(KS(step.pre),()=>{if(S===owner&&VILLAGE_SESSION===ses)a.preDone=true})}a.t=0;return;}/* 集まったら、まず話してから、守り神の出番と動き */
    {const pl=typeof FIELD_PLAY!=='undefined'&&FIELD_PLAY[a.fieldId];if(pl&&pl.phase===a.phase&&!a.played){if(!sacredPlayActive())startSacredPlay(a.fieldId,a.obj,fieldCast(step),()=>{a.played=true});a.t=0;return;}}/* 守り神の出番がすんでから、つづきの動き */
    if(step.pose==='sit')for(const p of fieldCast(step))sacredSetPose(p,{anim:'talkthink',sit:true});

  },
  done:(r,a)=>a.cancel||!fieldStoryValid(a)||a.t>=FIELD_STORIES[a.fieldId][a.phase].dur,
  end:fieldStoryResult
};
ACT.fieldassist={start(r,a){faceTo(r,fieldStump(a.obj));r.bubble='';},done:(r,a)=>!fieldStoryValid(a)||isNight()||hungry(r)||!S.res.some(p=>p.act?.type==='fieldstory'&&p.act.fieldId===a.fieldId&&p.act.phase===a.phase)};
/* 調べのあいまの待ち：つぎの段階・つぎの調べがすぐつづくあいだは、木のそばでそのまま待つ。
   村での準備がいるとき・夜・コワイノ・おなかがすいたとき・調べがおわったとき・ゲームの1時間で、おわる */
function fieldWaitHere(p,j){startAct(p,null,'fieldwait',-1,{key:'field'+((p.y|0)*W+(p.x|0)),obj:j,qid:QUESTS[S.quest]?.id});}/* 立っているマスは、あとから来る子に使わせない */
function fieldWaitKeep(r,a){
  if(isNight()||hungry(r)||hostileNow(r)||!questVisitSafe(r,a.obj))return false;
  if(a.cu==null)a.cu=S.t+60;if(S.t>=a.cu)return false;
  if(FIELD_SCENES.get(S)?.session===VILLAGE_SESSION||(typeof sacredPlayActive==='function'&&sacredPlayActive()))return true;/* 会話・守り神の出番のあいだ */
  const f=fieldStoryCurrent();
  if(!f){const o=S.qStory!=null&&QUESTS[S.qStory];return !!o&&o.field&&o.id===a.qid&&fieldCast(FIELD_STORIES[o.id][FIELD_STORIES[o.id].length-1]).includes(r);}/* お礼の会話も、その場で */
  if(QUESTS[S.quest]?.id!==a.qid||S.fieldSites?.root!==a.obj)return false;
  const st=fieldStoryState(f.id),step=FIELD_STORIES[f.id][st?.step||0];
  if(!st?.auto||(typeof fieldPrepNeed==='function'&&fieldPrepNeed(f.id)))return false;
  return !!step&&fieldCast(step).includes(r);
}
ACT.fieldwait={start(r,a){r.bubble='';if(a.obj!=null)faceTo(r,fieldStump(a.obj));},done:(r,a)=>!fieldWaitKeep(r,a)};
function fieldStoryAnim(r){const pose=sacredPose(r);if(pose)return pose.anim;return r.act?.type==='storywait'?'storyListen':r.act?.type==='fieldstory'?FIELD_STORIES[r.act.fieldId]?.[r.act.phase]?.anim||'talk':['fieldwait','fieldintro','fieldassist','fieldgather'].includes(r.act?.type)?'talkthink':r.act?.type==='cook'&&r.act.tb?'cookcut':r.act?.type==='vgift'?(r.act.said?'talkjoy':'sow'):r.act?.type;}/* 調理台：きざむ・まぜる動き */
function drawFieldStory(now,labelsOnly=false){
  if(!$('#dialog').hidden)return;const q=fieldStoryCurrent();if(!q)return;const state=fieldStoryState(q.id),step=FIELD_STORIES[q.id][state?.step||0],j=S.fieldSites?.[step.site];if(j==null)return;
  const x=(j%W+sacredSpan()/2)*TS,y=((j/W|0)+sacredSpan()-.45)*TS-hiAt(j)*LIFT,t=now/600;
  ctx.save();if(labelsOnly){ctx.font='bold 11px "PixelMplus10",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff5d4';ctx.strokeStyle='#695438';ctx.lineWidth=3;const label='！ '+step.label;ctx.strokeText(label,x,y-17);ctx.fillText(label,x,y-17);ctx.restore();return;}
  ctx.strokeStyle='#f9d77b';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y+5,19+Math.sin(t),9,0,0,7);ctx.stroke();ctx.restore();
}

/* 調べの集まり：はじめた調べ（auto）は、予定がおわった子から、じゅんに木のそばへ来て待つ。ほかの予定には移らない。みんながそろったら、tryFieldAuto ではじまる */
function fieldGatherWant(){const q=fieldStoryCurrent();if(!q||isNight())return null;const st=fieldStoryState(q.id);if(!st?.auto||fieldStoryDone(q.id))return null;if(FIELD_SCENES.get(S)?.session===VILLAGE_SESSION||S.res.some(p=>p.act?.type==='fieldstory'||p.act?.type==='fieldassist')||(typeof sacredPlayActive==='function'&&sacredPlayActive()))return null;const step=FIELD_STORIES[q.id][st.step],j=step&&S.fieldSites?.[step.site];if(j==null)return null;if(typeof fieldPrepNeed==='function'&&fieldPrepNeed(q.id))return null;if(!fieldCastFull(step))return null;/* 調べにいる子がそろっていなければ、だれも集まらない */return {q,st,step,j,group:fieldCast(step)};}
function tryFieldGather(r){const w=fieldGatherWant();if(!w||!w.group.includes(r))return false;
  if(r.act?.type==='fieldgather'&&r.act.fieldId===w.q.id&&r.act.phase===w.st.step)return false;
  if(r.act?.type==='fieldwait'&&r.act.obj===w.j)return false;/* もう木のそばで待っている */
  if(!fieldActorReady(r)||onHold(r)||!questVisitSafe(r,w.j))return false;
  const G=bfs(r.x|0,r.y|0),slots=introSlots(w.q.id+'#'+w.st.step,w.group,w.j),s0=slots.get(r);let stand=s0!=null&&G.dist[s0]>=0&&free('field'+s0,1)?s0:-1;
  if(stand<0)stand=nearest(G,k=>walk(k)&&!sacredReserved(k)&&fieldDistance(k,w.j)>=1&&fieldDistance(k,w.j)<=3&&free('field'+k,1),100);
  if(stand<0){noteStoryWaitBlock(r,w.j,'path');return false;}clearStoryWaitBlock(r);endAct(r);startAct(r,G,'fieldgather',stand,{key:'field'+stand,fieldId:w.q.id,phase:w.st.step,obj:w.j});return true;}
ACT.fieldgather={start(r,a){faceTo(r,fieldStump(a.obj));r.bubble='';},done:(r,a)=>{const w=fieldGatherWant();return !w||w.q.id!==a.fieldId||w.st.step!==a.phase||hungry(r)||hostileNow(r);}};
