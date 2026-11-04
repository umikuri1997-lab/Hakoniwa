'use strict';
/* 草原の物語の木。tower は既存セーブの建物IDとして保ち、火山の台座とは表示・育て方を分ける。 */
const storyTreeName=()=>WD===0?'御神木':'守護の台座';
const SACRED_PREVIEW=new WeakMap(),SACRED_POSES=new WeakMap();
const sacredSpan=()=>S?.sacredLegacy2?2:3;
const sacredCells=(j,n=sacredSpan())=>Array.from({length:n*n},(_,i)=>j+(i/n|0)*W+i%n);
const storyTreeX=j=>j%W+(WD===0?sacredSpan():2)/2;
const storyTreeY=j=>(j/W|0)+(WD===0?sacredSpan()-1:1);
function migrateSacredFootprint3(state){
  if(state.free||(state.world||0)!==0||state.flags.sacredFootprint3&&!state.sacredLegacy2)return;
  const old=state.obj.indexOf('tower'),pending=state.obj.findIndex((o,j)=>o==='site'&&state.dyn[j]?.build==='tower'),origin=old>=0?old:pending>=0?pending:state.sacredRoot;
  if(origin==null){state.flags.sacredFootprint3=1;return;}
  const own=new Set(old>=0||pending>=0?[origin]:[]);for(let k=0;k<state.obj.length;k++)if(state.obj[k]==='part'&&state.ref[k]===origin)own.add(k);
  const fits=j=>j>=0&&j%W<=W-3&&(j/W|0)<=H-3&&sacredCells(j,3).every(k=>(!state.obj[k]||own.has(k))&&(own.has(k)||!state.floor[k])&&state.ground[k]!==1&&state.ground[k]!==2&&(state.hi?.[k]||0)===(state.hi?.[origin]||0)&&!state.res?.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===k)&&!Object.keys(state.rug||{}).some(a=>sacredCells(+a,2).includes(k))&&!Object.keys(state.roof||{}).some(a=>sacredCells(+a,2).includes(k)));
  let target=fits(origin)?origin:-1,best=Infinity;
  if(target<0)for(let j=0;j<state.obj.length;j++){const d=Math.abs(j%W-origin%W)+Math.abs((j/W|0)-(origin/W|0));if(d<best&&fits(j)){best=d;target=j;}}
  if(target<0){state.sacredLegacy2=true;return;} // 空きがない古い村の家具は消さない。次回読み込みで再確認する。
  const type=old>=0?'tower':pending>=0?'site':null,dy=state.dyn[origin],hp=state.hp?.[origin],lv=state.hp?.['L'+origin];
  for(const k of own){if(k===origin&&type||k!==origin){state.obj[k]='';delete state.ref[k];}}if(type){delete state.dyn[origin];if(state.hp){delete state.hp[origin];delete state.hp['L'+origin];}}
  state.sacredRoot=target;(state.fieldSites||(state.fieldSites={})).root=target;delete state.sacredLegacy2;
  if(type){state.obj[target]=type;for(const k of sacredCells(target,3).slice(1)){state.obj[k]='part';state.ref[k]=target;}if(dy)state.dyn[target]=dy;if(hp!=null)state.hp[target]=hp;if(lv!=null)state.hp['L'+target]=lv;}
  for(const b of state.broken||[])if(b.id==='tower'&&b.j===origin)b.j=target;
  for(const r of state.res||[])if(r.act?.obj===origin&&['fieldintro','fieldstory','fieldassist','fieldwait','storywait','build','repair'].includes(r.act.type)){r.act=null;r.path=[];}
  if(target!==origin)(state.log||(state.log=[])).push([Math.floor((state.t||0)/1440)+1,'御神木のため、空いた3×3の場所を整えた']);
  state.flags.sacredFootprint3=1;
}
function tryExpandSacredLegacy(state){
  if(!state.sacredLegacy2||state.sacredRoot==null)return;
  const j=state.sacredRoot,cells=sacredCells(j,3);if(j%W>W-3||(j/W|0)>H-3)return;
  if(cells.some(k=>state.obj[k]&&k!==j&&!(state.obj[k]==='part'&&state.ref[k]===j)||state.res?.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===k)))return;
  migrateSacredFootprint3(state);
}
function sacredReserved(j){return !!S&&WD===0&&!S.free&&S.sacredRoot!=null&&sacredCells(S.sacredRoot).includes(j);}
function sacredCompleted(id){const i=QUESTS1.findIndex(q=>q.id===id);return fieldStoryDone(id)||i>=0&&S.quest>i&&S.qStory!==i;}
function sacredRevealed(id){const i=QUESTS1.findIndex(q=>q.id===id);return i>=0&&S.quest>i&&S.qStory!==i;}
function sacredStage(){
  if(!S)return 4;if(IS_STORY_REPLAY&&S.replayMature)return 4;
  if(S.obj.includes('tower'))return S.cleared||(S.setSh||0)>=2&&GRASSN>=1750?4:3;
  if(sacredRevealed('waterLeaf'))return 2;
  if(sacredRevealed('fireTrace'))return 1;
  return 0;
}
function sacredRootFits(j){return j>=0&&j%W<=W-sacredSpan()&&(j/W|0)<=H-sacredSpan()&&sacredCells(j).every(k=>(walk(k)||STUMPB.has(k))&&!S.obj[k]&&!S.floor[k]&&!roomOf(k)&&!RUGC.has(k)&&hiAt(k)===hiAt(j));}
function migrateSacredStory(state){
  if(state.flags.sacredStoryV1)return;
  if(!state.free&&(state.world||0)===0){
    const old={earthListen:3,earthRoot:2,fireRoot:1,fireTrace:2,waterFilm:2,waterLeaf:2,windEcho:3,windVoices:5};
    for(const [id,n]of Object.entries(old)){const d=state.fieldStories?.[id];if(d)d.step=d.step>=n?FIELD_STORIES[id].length:0;}
    const q=QUESTS1[state.quest];if(state.qStory==null&&q?.field&&!((q.id==='tower')&&state.obj.includes('tower')))state.qTalked=false;
    const j=state.obj.indexOf('tower'),pending=state.obj.findIndex((o,k)=>o==='site'&&state.dyn[k]?.build==='tower');
    if(j>=0||pending>=0){state.sacredRoot=j>=0?j:pending;(state.fieldSites||(state.fieldSites={})).root=state.sacredRoot;}
  }
  state.flags.sacredStoryV1=1;
}
function growStoryTree(){
  if(WD!==0||S.free||S.obj.includes('tower'))return true;
  const j=S.sacredRoot;if(j==null||!sacredRootFits(j))return false;
  S.obj[j]='tower';for(const k of sacredCells(j).slice(1)){S.obj[k]='part';S.ref[k]=j;}S.hp[j]=BL.tower.hp;S.flags.shrine=true;
  S.flags.treeBlessed=true;noteQuestPlacement('tower',j);recount();dirty=true;burst(j,'plant','none');memo('🌳','みんなで世話をした木が、御神木になった');return true;
}
function sacredPose(r){const q=SACRED_POSES.get(r);return q&&q.state===S&&q.session===VILLAGE_SESSION&&performance.now()<q.until?q:null;}
function sacredSetPose(r,pose){SACRED_POSES.set(r,{...pose,state:S,session:VILLAGE_SESSION,until:performance.now()+(pose.duration||8000)});}
function sacredCue(c){sacredBeat(c);}
function sacredSceneWalk(r,x,y,pose,arrived){
  const owner=S,session=VILLAGE_SESSION,direction=sacredDirection(true),G=bfs(r.x|0,r.y|0),occupied=occTiles(r),stand=nearest(G,j=>walk(j)&&!occupied.has(j)&&(pose.adjacentSide?Math.abs((j/W|0)+.5-y)<.1&&Math.abs(j%W+.5-x)===1:Math.hypot(j%W+.5-x,(j/W|0)+.5-y)<1.5),80);
  if(stand<0)return false;
  endAct(r);startAct(r,G,'nmeet',stand,{});let last=performance.now();const tick=now=>{if(S!==owner||VILLAGE_SESSION!==session||sacredDirection()!==direction||!S.res.includes(r)||r.act?.type!=='nmeet')return;const dt=Math.min(.1,(now-last)/1000);last=now;if(r.act.stage==='walk'){moveR(r,dt*4);requestAnimationFrame(tick);}else{if(pose.anim)sacredSetPose(r,pose);if(arrived)arrived();}};requestAnimationFrame(tick);return true;
}
function drawStoryTree(c,x,y,j,now,full=false){
  x+=(sacredSpan()-3)*TS/2;y+=(sacredSpan()-3)*TS;
  const motion=sacredTreeMotion(now),g=motion.growth,p=motion.progress;
  c.save();c.translate(x+48,y+90);c.rotate(motion.sway);c.translate(-x-48,-y-90);
  if(g&&p<1){c.save();c.globalAlpha=1-p;drawStoryTreeFrame(c,x,y,j,now,g.from,1);c.restore();c.save();c.globalAlpha=p;drawStoryTreeFrame(c,x,y,j,now,g.to,p);c.restore();}
  else drawStoryTreeFrame(c,x,y,j,now,full?4:null,1);
  c.restore();
  if(sacredCompleted('fireRoot')||(fieldStoryState('fireRoot')?.step||0)>=1){const moving=sacredEffect('stone');for(const [dx,dy]of[[-20,1],[19,4],[10,14]]){if(moving&&dx===19&&(now-moving.at)/moving.ms<.9)continue;sacredStone(c,x+48+dx,y+80+dy,1);}}
}
function drawStoryTreeFrame(c,x,y,j,now,forced=null,unfold=1){
  let stage=forced??sacredStage();const preview=S&&SACRED_PREVIEW.get(S);if(forced==null&&preview?.session===VILLAGE_SESSION&&performance.now()<preview.until)stage=Math.max(stage,preview.stage);
  const key=['story:stump','story:bud','story:leaf',(S.setSh||0)>=1?'story:tree-young':'story:sapling','story:tree'][stage],art=window.CHIPS?.[key];
  if(art&&drawChip(c,art,key,x,y,now,j))return;
  const cx=x+48,cy=y+80;c.save();c.imageSmoothingEnabled=false;
  c.fillStyle='rgba(66,53,28,.17)';c.beginPath();c.ellipse(cx,cy+9,23,7,0,0,7);c.fill();
  c.strokeStyle='#ab855e';c.lineWidth=7;c.lineCap='round';for(const [dx,dy]of[[-23,10],[24,8],[-14,17],[13,18]]){c.beginPath();c.moveTo(cx,cy+2);c.quadraticCurveTo(cx+dx*.5,cy+dy*.7,cx+dx,cy+dy);c.stroke();}
  c.fillStyle='#b78c61';c.fillRect(cx-14,cy-17,28,24);c.fillStyle='#d2ad7c';c.beginPath();c.ellipse(cx,cy-17,14,6,0,0,7);c.fill();
  c.strokeStyle='#b99268';c.lineWidth=1.3;for(const r of[4,9]){c.beginPath();c.ellipse(cx,cy-17,r,r*.37,0,0,7);c.stroke();}
  c.strokeStyle='#a27752';c.lineWidth=2;c.beginPath();c.moveTo(cx-10,cy-10);c.lineTo(cx-10,cy+1);c.moveTo(cx+7,cy-9);c.lineTo(cx+5,cy-2);c.stroke();
  if(stage>=1){c.strokeStyle='#779753';c.lineWidth=3;c.beginPath();c.moveTo(cx+9,cy-14);c.lineTo(cx+13,cy-28);c.stroke();c.fillStyle=stage===1?'#8cb46b':'#9ecf75';c.beginPath();c.ellipse(cx+14,cy-29,stage===1?3:3+6*unfold,stage===1?6:6-2*unfold,stage===1?.2:-1.3+.8*unfold,0,7);c.fill();}
  c.restore();
}
function drawSacredRoot(now){if(!S||WD!==0||S.free||S.sacredRoot==null||S.obj.includes('tower'))return;const j=S.sacredRoot;if(S.obj[j]==='site')return;drawStoryTree(ctx,(j%W)*TS,(j/W|0)*TS-hiAt(j)*LIFT,j,now);}
const SACRED_QUIET=[
  ['F','……きょうだいたちのことも、聞きたかったんだ。'],['U','うむ。'],['F','どこかで、元気にしてるかな。'],['U','……。'],['U','わたしにも、まだわからぬ。'],['F','……そっか。'],['U','ただ、あの子らがおまえを守ったことは、覚えている。'],['F','……うん。'],['U','こうして生きているおまえを見たら、きっと、喜ぶだろう。'],['F','#teary|……。'],['N','……となり、座るねぇ。',1,'stree:sit'],['F','……今日は、ここにいてもいい？'],['U','もちろんだ。']
];
function sacredQuietScene(){return startSacredQuiet();}
function drawSacredQuiet(now){if(WD===0&&S.nushi&&S.flags.sacredReunion&&!S.flags.sacredQuietSeen&&$('#dialog').hidden){talkBub(S.nushi.x*TS,S.nushi.y*TS-42,now,'#b7ddba');}}
