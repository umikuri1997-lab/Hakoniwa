'use strict';
/* 草原の物語の木。tower は既存セーブの建物IDとして保ち、火山の台座とは表示・育て方を分ける。 */
const storyTreeName=()=>WD===0?'御神木':'守護の台座';
const SACRED_PREVIEW=new WeakMap(),SACRED_POSES=new WeakMap();
const sacredCells=j=>[j,j+1,j+W,j+W+1];
function sacredReserved(j){return !!S&&WD===0&&!S.free&&S.sacredRoot!=null&&sacredCells(S.sacredRoot).includes(j);}
function sacredCompleted(id){const i=QUESTS1.findIndex(q=>q.id===id);return fieldStoryDone(id)||i>=0&&S.quest>i&&S.qStory!==i;}
function sacredRevealed(id){const i=QUESTS1.findIndex(q=>q.id===id);return i>=0&&S.quest>i&&S.qStory!==i;}
function sacredStage(){
  if(!S)return 4;
  if(S.obj.includes('tower'))return S.cleared||(S.setSh||0)>=2&&GRASSN>=1750?4:3;
  if(sacredRevealed('waterLeaf'))return 2;
  if(sacredRevealed('fireTrace'))return 1;
  return 0;
}
function sacredRootFits(j){return j>=0&&j%W<W-1&&(j/W|0)<H-1&&sacredCells(j).every(k=>walk(k)&&!S.obj[k]&&!S.floor[k]&&!roomOf(k)&&!RUGC.has(k)&&hiAt(k)===hiAt(j));}
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
  const motion=sacredTreeMotion(now),g=motion.growth,p=motion.progress;
  c.save();c.translate(x+32,y+58);c.rotate(motion.sway);c.translate(-x-32,-y-58);
  if(g&&p<1){c.save();c.globalAlpha=1-p;drawStoryTreeFrame(c,x,y,j,now,g.from,1);c.restore();c.save();c.globalAlpha=p;drawStoryTreeFrame(c,x,y,j,now,g.to,p);c.restore();}
  else drawStoryTreeFrame(c,x,y,j,now,full?4:null,1);
  c.restore();
  if(sacredCompleted('fireRoot')||(fieldStoryState('fireRoot')?.step||0)>=1){const moving=sacredEffect('stone');for(const [dx,dy]of[[-20,1],[19,4],[10,14]]){if(moving&&dx===19&&(now-moving.at)/moving.ms<.9)continue;sacredStone(c,x+32+dx,y+48+dy,1);}}
}
function drawStoryTreeFrame(c,x,y,j,now,forced=null,unfold=1){
  let stage=forced??sacredStage();const preview=S&&SACRED_PREVIEW.get(S);if(forced==null&&preview?.session===VILLAGE_SESSION&&performance.now()<preview.until)stage=Math.max(stage,preview.stage);
  const art=window.CHIPS?.[['story:stump','story:bud','story:leaf','story:sapling','shinboku'][stage]];
  if(art&&stage<4){drawChip(c,art,'story:tree',x,y,now,j);return;}
  if(stage>=3&&window.CHIPS?.shinboku){const sc=stage===4?1:(S.setSh||0)>=1?.78:.55,ax=x+32,ay=y+59;c.save();c.translate(ax,ay);c.scale(sc*(.25+.75*unfold),sc*(.25+.75*unfold));c.translate(-ax,-ay);drawChip(c,CHIPS.shinboku,'shinboku',x-6,y-30,now,j);c.restore();return;}
  const cx=x+32,cy=y+48;c.save();c.imageSmoothingEnabled=false;
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
function sacredQuietScene(){
  const owner=S,session=VILLAGE_SESSION,tw=S.obj.indexOf('tower');if(tw<0)return;
  sacredShot('care',S.res.filter(r=>Math.hypot(r.x-(tw%W+1),r.y-(tw/W|0)-1)<6));gatherAt(tw%W+1,(tw/W|0)+2,()=>{if(S!==owner||session!==VILLAGE_SESSION)return;dialog(sevLines(SACRED_QUIET),()=>{S.flags.sacredQuietSeen=true;dirty=true;sacredEndDirection();toast('御神木の葉が、静かに鳴っている');});});
}
function drawSacredQuiet(now){if(WD===0&&S.nushi&&S.flags.sacredReunion&&!S.flags.sacredQuietSeen&&$('#dialog').hidden){talkBub(S.nushi.x*TS,S.nushi.y*TS-42,now,'#b7ddba');}}
