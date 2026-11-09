'use strict';
/* 終盤の順番は、操作・自動再開・目標表示で同じ条件を使う。既読は会話の完了時だけ保存する。 */
function grassEndingEvent(){
  if(!S||WD!==0||S.free||S.cleared||!S.flags.finalWon||isNight()||S.qStory!=null)return null;
  if(!S.sev?.e09&&((S.shards||0)>=3||(S.setSh||0)>=3))return SEV1.find(e=>e.k==='e09');
  return null;
}
/* 最後のかけらの話（e09）はメインの会話：ピンクの会話の集まりは使わず、メインの集合（storywait）で話す。フタバは必須、ほかの子は、いれば話す */
function grassEndingTalk(){const e=grassEndingEvent();return e&&e.k!=='e16g'&&S.res.some(r=>r.name===POKO&&!r.hidden)?e:null}
function grassEndingTalkLines(e){return e&&sevLines(e.L)}
function startGrassEndingTalk(e){const L=grassEndingTalkLines(e);if(!L)return;TALKW=null;QUESTCLEARW=null;const owner=S,session=VILLAGE_SESSION;let once=0;
  dialog(L,()=>{if(once++||S!==owner||VILLAGE_SESSION!==session||(S.sev||{})[e.k])return;(S.sev||(S.sev={}))[e.k]=1;const P=S.sevP||[],i=P.indexOf(e.k);if(i>=0)P.splice(i,1);if(e.go)e.go();checkQuest()},null)}/* 最後まで見てから「見た」にする */
function grassReunionBlockReason(){
  if(WD!==0)return '';
  if(isNight())return 'ヌシ様を迎えるのは、朝になってから';
  if(!S.flags.finalWon)return 'まず、御神木に集まる影を追いはらおう';
  if(!S.res.some(r=>r.name===POKO&&!r.hidden))return 'フタバがもどってから、一緒にヌシ様を迎えよう';
  if(S.qStory!=null)return '先に、いまのお話を聞こう';
  if(!S.sev?.e09)return '先に、最後のかけらを迎えるお話を聞こう';
  if((S.setSh||0)<3)return '最後のかけらの光を、御神木へ届けよう';
  return '';
}
const GRASS_REUNION_PENDING=new WeakMap();
function scheduleGrassReunion(){
  if(WD!==0||S.cleared||(S.setSh||0)<3||NUSHI_RUN||grassReunionBlockReason())return false;
  if(GIFT_ACTIVE||SPOT_POPS.some(e=>e.shard&&e.state===S))return false;/* かけらの知らせをとじてから */
  const old=GRASS_REUNION_PENDING.get(S);if(old?.session===VILLAGE_SESSION)return true;
  const owner=S,token={session:VILLAGE_SESSION};GRASS_REUNION_PENDING.set(owner,token);
  villageTimeout(()=>{if(GRASS_REUNION_PENDING.get(owner)!==token)return;GRASS_REUNION_PENDING.delete(owner);shards3();},900);return true;
}
function grassEndingGoal(){
  if(!S)return {text:'ヌシ様を迎えよう',progress:'',how:'御神木のそばで、なかまとヌシ様を迎えよう'};
  if(S.flags.finalWon){
    if(!S.res.some(r=>r.name===POKO&&!r.hidden))return {text:'フタバの帰りを待とう',progress:'もどったら、御神木のそばで話そう',how:'フタバが帰ってきたら、終わっていない話の続きから進めよう'};
    if((S.shards||0)<3&&(S.setSh||0)<3)return {text:'最後のかけらを迎えよう',progress:'影が消えた場所に、光が残っている',how:'ヨルノオオカゲが消えた場所のかけらを、なかまが拾うのを待とう'};
    if(!S.sev?.e09)return {text:'最後のかけらを、みんなで',progress:isNight()?'お話は、朝になってから':'御神木のそばで、フタバの話を聞こう',how:'御神木のそばに集まった、フタバたちの話を聞こう'};
    if((S.setSh||0)<3)return {text:'最後の光を御神木へ',progress:isNight()?'光を届けるのは、朝になってから':'御神木へ、かけらを3つ届けよう',how:'朝、御神木をタップして、最後のかけらの光を届けよう'};
    return {text:'ヌシ様を迎えよう',progress:isNight()?'再会は、朝になってから':'みんなと、御神木の下へ',how:'朝、フタバと一緒に、御神木の下でヌシ様を迎えよう'};
  }
  const night=isNight(),active=night&&(S.finalOn||S.rushOn||S.ns?.final||S.ns?.rush),wave=S.finalOn||S.ns?.final&&night?3:S.rushOn?S.rushN:S.ns?.rush&&night?S.ns.rush:Math.min(3,(S.rushN||0)+1);
  if(active)return {text:wave===3?'ヨルノオオカゲを追いはらおう':'御神木を守ろう',progress:'御神木の防衛 '+wave+'/3夜目',how:wave===3?'村と御神木を守り、ヨルノオオカゲを追いはらおう':'村と御神木を、朝まで守ろう'};
  if(S.finalNight||S.finalOn||S.rushOn)return {text:'今夜、御神木を守ろう',progress:'次は、防衛 '+wave+'/3夜目',how:'柵や罠を整え、食事と休息を済ませて、今夜の影に備えよう'};
  if(clearReady()){const left=Math.max(0,(S.finalDay??S.flags.finalReadyDay??dayNo())-dayNo());return {text:'御神木を守る準備をしよう',progress:left?'影が来るまで、あと'+left+'日':'今夜、影がやってくる',how:'御神木を守れるように、柵や罠・食事と休息の準備を整えよう'};}
  return {text:'ヌシのかけらを御神木へ届けよう',progress:'かけら '+Math.min(2,S.setSh||0)+'/2',how:'御神木をタップして、ヌシのかけらを届けよう'};
}
function grassEndingFocusTarget(){
  if(WD!==0||!S.flags.finalWon)return null;
  const drop=(S.shards||0)<3&&S.drops?.find(d=>d.id==='shard');
  if(drop)return {x:drop.x+.5,y:drop.y+.5,w:1,h:1};
  const j=S.obj.indexOf('tower');return j<0?null:{x:storyTreeX(j),y:storyTreeY(j)-.3,w:sacredSpan(),h:sacredSpan()};
}
/* 木陰の場面は、必要な人物だけがそろい、会話が終わるまで待つ。世界を止め、歩み寄りだけ実時間で進める。 */
const SACRED_QUIET_RUNS=new WeakMap();
function sacredQuietActive(){const run=S&&SACRED_QUIET_RUNS.get(S);return !!run&&run.session===VILLAGE_SESSION;}
function sacredQuietHolds(r){const run=S&&SACRED_QUIET_RUNS.get(S);return !!run&&run.session===VILLAGE_SESSION&&run.actors.includes(r);}
function cancelSacredQuiet(restore=true,message=''){
  const run=S&&SACRED_QUIET_RUNS.get(S);if(!run)return;
  SACRED_QUIET_RUNS.delete(S);for(const r of run.actors)if(r.act?.type==='nmeet')endAct(r);
  sacredEndDirection(restore);if(message)toast(message,'warn');
}
function startSacredQuiet(){
  if(sacredQuietActive())return toast('なかまが木陰へ向かっている');
  if(isNight())return toast('木陰のお話は、朝になってから');
  const f=S.res.find(r=>r.name===POKO&&!r.hidden),tw=S.obj.indexOf('tower');
  if(!f)return toast('フタバがもどったら、一緒に話そう');if(tw<0||!S.nushi)return;
  const lines=sevLines(SACRED_QUIET);if(!lines?.length)return toast('なかまがそろってから、一緒に話そう');
  const actors=sevActors(lines),unready=actors.find(r=>!fieldActorReady(r)||onHold(r));
  if(unready)return toast(storyWaitReason(unready,tw));
  if(!questVisitSafe(f,tw))return toast('木陰が安全になってから、話そう');
  const x=storyTreeX(tw),y=storyTreeY(tw)+1,used=new Set(),plans=[];
  for(const r of actors){const G=bfs(r.x|0,r.y|0),occupied=occTiles(r),stand=nearest(G,j=>walk(j)&&!sacredReserved(j)&&!occupied.has(j)&&!used.has(j)&&!S.obj[j]&&!roomOf(j)&&Math.hypot(j%W+.5-x,(j/W|0)+.5-y)>=1.6&&Math.hypot(j%W+.5-x,(j/W|0)+.5-y)<=4,120);
    if(stand<0)return toast(r.name+'が木陰へ行けない。木のまわりの道をあけよう','warn');used.add(stand);plans.push({r,G,stand});}
  const owner=S,session=VILLAGE_SESSION,run={session,actors,tw,phase:'gather',last:performance.now(),lastProgress:performance.now()};SACRED_QUIET_RUNS.set(owner,run);
  for(const {r,G,stand}of plans){rememberStoryHome(r,'quiet:'+session);endAct(r);startAct(r,G,'nmeet',stand,{});}
  sacredShot('care',actors);
  const tick=now=>{
    if(S!==owner||VILLAGE_SESSION!==session||SACRED_QUIET_RUNS.get(owner)!==run)return;
    if(!S.nushi||S.obj[tw]!=='tower'||isNight()||actors.some(r=>!S.res.includes(r)||r.hidden||hostileNow(r)))return cancelSacredQuiet(true,'なかまがそろって、安全になってから話そう');
    const dt=Math.min(.1,(now-run.last)/1000);run.last=now;
    if(sheet==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden){for(const r of actors){if(r.act?.type!=='nmeet')return cancelSacredQuiet(true,'なかまの用事が済んだら、また話そう');if(r.act.stage==='walk'){const x0=r.x,y0=r.y;moveR(r,dt*MIN_PER_SEC);if(Math.hypot(r.x-x0,r.y-y0)>.0001)run.lastProgress=now;}}
      if(now-run.lastProgress>6000&&actors.some(r=>r.act?.stage==='walk'))return cancelSacredQuiet(true,'木陰へ進めない。木のまわりの道をあけよう');
      if(actors.every(r=>r.act?.type==='nmeet'&&r.act.stage==='do')){
        const current=sevLines(SACRED_QUIET);if(!current?.length)return cancelSacredQuiet(true,'フタバがもどったら、一緒に話そう');run.phase='talk';sacredShot('care',actors);dialog(current,()=>{if(SACRED_QUIET_RUNS.get(owner)!==run)return;if(!actors.every(r=>S.res.includes(r)&&!r.hidden))return cancelSacredQuiet(true,'なかまがそろってから、また話そう');S.flags.sacredQuietSeen=true;dirty=true;cancelSacredQuiet();toast('御神木の葉が、静かに鳴っている');});return;
      }
    }
    requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
}
