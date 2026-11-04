'use strict';
/* 草原の物語の木。tower は既存セーブの建物IDとして保ち、火山の台座とは表示・育て方を分ける。 */
const storyTreeName=()=>WD===0?'御神木':'守護の台座';
const SACRED_PREVIEW=new WeakMap(),SACRED_POSES=new WeakMap();
const sacredSpan=()=>S?.sacredLegacy2?2:S?.sacredLegacy3?3:4;
const sacredCells=(j,n=sacredSpan())=>Array.from({length:n*n},(_,i)=>j+(i/n|0)*W+i%n);
const storyTreeX=j=>j%W+(WD===0?sacredSpan():2)/2;
const storyTreeY=j=>(j/W|0)+(WD===0?sacredSpan()-1:1);
function migrateSacredFootprint3(state){/* 御神木を4×4へ（前は2×2・3×3）。空きがなければ、いまの大きさのまま、あとで空いたら広げる */
  if(state.free||(state.world||0)!==0||state.flags.sacredFootprint4&&!state.sacredLegacy2&&!state.sacredLegacy3)return;const N=4,cur=state.sacredLegacy2?2:state.sacredLegacy3||!state.flags.sacredFootprint4&&state.flags.sacredFootprint3?3:2;
  const old=state.obj.indexOf('tower'),pending=state.obj.findIndex((o,j)=>o==='site'&&state.dyn[j]?.build==='tower'),origin=old>=0?old:pending>=0?pending:state.sacredRoot;
  if(origin==null){state.flags.sacredFootprint3=state.flags.sacredFootprint4=1;delete state.sacredLegacy2;delete state.sacredLegacy3;return;}
  const own=new Set(old>=0||pending>=0?[origin]:[]);for(let k=0;k<state.obj.length;k++)if(state.obj[k]==='part'&&state.ref[k]===origin)own.add(k);
  const fits=j=>j>=0&&j%W<=W-N&&(j/W|0)<=H-N&&sacredCells(j,N).every(k=>(!state.obj[k]||own.has(k))&&(own.has(k)||!state.floor[k])&&state.ground[k]!==1&&state.ground[k]!==2&&(state.hi?.[k]||0)===(state.hi?.[origin]||0)&&!state.res?.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===k)&&!Object.keys(state.rug||{}).some(a=>sacredCells(+a,2).includes(k))&&!Object.keys(state.roof||{}).some(a=>sacredCells(+a,2).includes(k)));
  let target=fits(origin)?origin:-1,best=Infinity;
  if(target<0)for(let j=0;j<state.obj.length;j++){const d=Math.abs(j%W-origin%W)+Math.abs((j/W|0)-(origin/W|0));if(d<best&&fits(j)){best=d;target=j;}}
  if(target<0){if(cur===3){state.sacredLegacy3=true;delete state.sacredLegacy2;}else state.sacredLegacy2=true;state.flags.sacredFootprint3=state.flags.sacredFootprint4=1;return;} // 空きがない古い村の家具は消さない。次回読み込みで再確認する。
  const type=old>=0?'tower':pending>=0?'site':null,dy=state.dyn[origin],hp=state.hp?.[origin],lv=state.hp?.['L'+origin];
  for(const k of own){if(k===origin&&type||k!==origin){state.obj[k]='';delete state.ref[k];}}if(type){delete state.dyn[origin];if(state.hp){delete state.hp[origin];delete state.hp['L'+origin];}}
  state.sacredRoot=target;(state.fieldSites||(state.fieldSites={})).root=target;delete state.sacredLegacy2;delete state.sacredLegacy3;
  if(type){state.obj[target]=type;for(const k of sacredCells(target,N).slice(1)){state.obj[k]='part';state.ref[k]=target;}if(dy)state.dyn[target]=dy;if(hp!=null)state.hp[target]=hp;if(lv!=null)state.hp['L'+target]=lv;}
  for(const b of state.broken||[])if(b.id==='tower'&&b.j===origin)b.j=target;
  for(const r of state.res||[])if(r.act?.obj===origin&&['fieldintro','fieldstory','fieldassist','fieldgather','fieldwait','storywait','build','repair'].includes(r.act.type)){r.act=null;r.path=[];}
  if(target!==origin)(state.log||(state.log=[])).push([Math.floor((state.t||0)/1440)+1,'御神木のため、空いた4×4の場所を整えた']);
  state.flags.sacredFootprint3=state.flags.sacredFootprint4=1;
}
function tryExpandSacredLegacy(state){
  if(!state.sacredLegacy2&&!state.sacredLegacy3||state.sacredRoot==null)return;
  const j=state.sacredRoot,cells=sacredCells(j,4);if(j%W>W-4||(j/W|0)>H-4)return;
  if(cells.some(k=>state.obj[k]&&k!==j&&!(state.obj[k]==='part'&&state.ref[k]===j)||state.res?.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===k)))return;
  migrateSacredFootprint3(state);
}
function sacredNoBuild(j){if(sacredReserved(j))return true;if(!S||WD!==0||S.free||S.sacredRoot==null)return false;const s=fieldStump(S.sacredRoot);return Math.abs(j%W-s%W)<=1&&Math.abs((j/W|0)-(s/W|0))<=1}/* 切り株のまわり1マスにも、物を置かない */
function sacredReserved(j){return !!S&&WD===0&&!S.free&&S.sacredRoot!=null&&sacredCells(S.sacredRoot).includes(j);}
const sacredQuestIndex=id=>QUESTS1.findIndex(q=>q.id===id||!!q.fieldParts&&q.fieldParts.includes(id));
function sacredCompleted(id){const i=sacredQuestIndex(id);return fieldStoryDone(id)||i>=0&&S.quest>i&&S.qStory!==i;}
function sacredRevealed(id){const i=sacredQuestIndex(id);return i>=0&&S.quest>i&&S.qStory!==i;}
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
    const id=QUESTS1_V1[state.quest];if(state.qStory==null&&(COMPANION_QUESTS.has(id)||id==='tower')&&!(id==='tower'&&state.obj.includes('tower')))state.qTalked=false;/* まだ目標をまとめる前（QUESTS1_V1）の番号 */
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
function sacredGrowWatch(j){/* 物語の場面の外で木が育ったとき（かけら・みどりのマス）：その場で育つ演出をして、みんながよろこぶ */
  if(!S||WD!==0||S.free||IS_STORY_REPLAY)return;const st=sacredStage()+(sacredStage()===3&&(S.setSh||0)>=1?.5:0);if(S.treeSeen==null||st<S.treeSeen){S.treeSeen=st;return;}
  if(st===S.treeSeen||sacredDirection()||!$('#dialog').hidden||isNight())return;
  const from=S.treeSeen;S.treeSeen=st;const ms=3200;sacredStartEffect('growth',ms,{from,to:st});const d=sacredDirection();if(d)d.watch=true;villageTimeout(()=>{const e=sacredDirection();if(e&&e.watch)sacredEndDirection(false);},ms+100);sacredGrowSparks(j,ms,Math.ceil(st));
  const cx=storyTreeX(j),cy=storyTreeY(j),now=performance.now();
  for(const r of S.res){if(r.hidden||Math.hypot(r.x-cx,r.y-cy)>10)continue;r.face=r.x<cx?1:-1;r.bubble='✨';JOYU.set(r,now+2600);}
  panTo(cx*TS,(cy-1)*TS);/* 育つところを見せる */
  const lines=sacredGrowLines(st);if(!lines.length)return;let tries=0;const say=()=>{if($('#dialog').hidden&&!sacredDirection())dialog(lines,()=>{},null,'');else if(tries++<40)villageTimeout(say,1500);};villageTimeout(say,ms+400);/* ほかの会話中なら、おわってから */
}
function sacredGrowLines(st){/* 木が育ったときの、みんなの会話（いる子の行だけ） */
  const N=keyName('earth'),H=keyName('fire'),M=keyName('water'),K=keyName('wind');
  const L=st>=4?[[POKO,'#surprise|わあ……！　木が、こんなに大きく……！'],[N,'見てぇ。根っこが、土の中で、ずうっと先までのびてるよぉ。'],[H,'#joy|みんなで世話した木だ。……葉っぱまで、あったかい。'],[M,'しずくが、葉の先で光っています。……きれいですね。'],[K,'#think|……葉ずれの音が、ずっと大きくなった。だれかが、こたえてるみたいだ。'],[GOD,'#joy|……ほんに、りっぱになったのう。おヌシらの手が、この木をここまで育てたんじゃ。'],[POKO,'#think|……ヌシ様に、もうすこしで、会えるのかな。'],[GOD,'#nod|うむ。のこりのかけらがそろえば、きっとのう。']]
    :[[POKO,'#joy|あっ……！　木が、ぐんって、のびた！'],[N,'かけらの光が、根っこまで、しみこんでいったねぇ。'],[GOD,'#nod|うむ。ヌシ様の力が、この木にやどりはじめたんじゃ。'],[POKO,'#joy|……もっと、大きくなってね。']];
  let g=0;return L.filter(l=>l[0]&&(l[0]===GOD||spkOK(l[0]))).map(l=>{if(l[0]!==GOD||g++)return l;const m=/^(#[a-z]+\|)?(.*)$/.exec(l[1]);return [GOD,(m[1]||'')+GVOICE()+m[2]]});/* カミサマが遠くにいるときは、はじめの行だけ「聞こえるかの？」 */
}
function drawStoryTree(c,x,y,j,now,full=false){
  if(!full)sacredGrowWatch(j);
  x+=(sacredSpan()-4)*TS/2;y+=(sacredSpan()-4)*TS;
  const motion=sacredTreeMotion(now),g=motion.growth,p=motion.progress;
  c.save();c.translate(x+64,y+122);c.rotate(motion.sway);c.translate(-x-64,-y-122);
  if(g&&p<1){/* 育つ：根もとに光がたまり、前の姿がうすれ、新しい姿が根もとから、のびあがる（少しのびすぎて、もどる） */
    const t=Math.min(1,(now-g.at)/g.ms),bx=x+64,by=y+122,glow=Math.sin(Math.PI*Math.min(1,t*1.25));
    if(glow>0){c.save();const rg=c.createRadialGradient(bx,by-6,2,bx,by-6,46+30*t);rg.addColorStop(0,'rgba(255,248,200,'+(.55*glow)+')');rg.addColorStop(1,'rgba(255,248,200,0)');c.fillStyle=rg;c.fillRect(bx-80,by-122,160,120);c.restore();}
    const fade=Math.max(0,1-t/.45);if(fade>0){c.save();c.globalAlpha=fade;drawStoryTreeFrame(c,x,y,j,now,g.from,1);c.restore();}
    const u=Math.max(0,(t-.2)/.8),back=u<1?1+2.2*Math.pow(u-1,3)+1.2*Math.pow(u-1,2):1,sy=.12+.88*back,sx=.55+.45*Math.min(1,back);
    if(u>0){c.save();c.globalAlpha=Math.min(1,u*2.5);c.translate(bx,by);c.scale(sx,sy);c.translate(-bx,-by);drawStoryTreeFrame(c,x,y,j,now,g.to,Math.min(1,u*1.4));c.restore();}}
  else drawStoryTreeFrame(c,x,y,j,now,full?4:null,1);
  c.restore();
  if(sacredCompleted('fireRoot')||(fieldStoryState('fireRoot')?.step||0)>=1){const moving=sacredEffect('stone');for(const [dx,dy]of[[-20,1],[19,4],[10,14]]){if(moving&&dx===19&&(now-moving.at)/moving.ms<.9)continue;sacredStone(c,x+64+dx,y+112+dy,1);}}
}
function drawStoryTreeFrame(c,x,y,j,now,forced=null,unfold=1){
  let stage=forced??sacredStage();const preview=S&&SACRED_PREVIEW.get(S);if(forced==null&&preview?.session===VILLAGE_SESSION&&performance.now()<preview.until)stage=Math.max(stage,preview.stage);
  const young=stage===3.5||stage===3&&forced==null&&(S.setSh||0)>=1;stage=Math.floor(stage);const key=['story:stump','story:bud','story:leaf',young?'story:tree-young':'story:sapling','story:tree'][stage],art=window.CHIPS?.[key];
  if(art&&drawChip(c,art,key,x,y,now,j))return;
  const cx=x+64,cy=y+112;c.save();c.imageSmoothingEnabled=false;
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
  ['F','……きょうだいたちのことも、聞きたかったんだ。'],['U','うむ。'],['F','どこかで、元気にしてるかな。'],['U','……。'],['U','わたしにも、まだわからぬ。'],['F','……そっか。'],['U','ただ、あの子らがおまえを守ったことは、覚えている。'],['F','……うん。'],['U','こうして生きているおまえを見たら、きっと、喜ぶだろう。'],['F','#teary|……。'],['N','#hush|……となり、座るねぇ。',1,'stree:sit'],['F','#hush|……今日は、ここにいてもいい？'],['U','もちろんだ。']
];
function sacredQuietScene(){return startSacredQuiet();}
function drawSacredQuiet(now){if(WD===0&&S.nushi&&S.flags.sacredReunion&&!S.flags.sacredQuietSeen&&$('#dialog').hidden){talkBub(S.nushi.x*TS,S.nushi.y*TS-42,now,'#b7ddba');}}
