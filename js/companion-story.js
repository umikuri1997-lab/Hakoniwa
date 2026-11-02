'use strict';
/* 仲間の力で現地を調べる、草原だけの物語。設置数・所持数では進まない。 */
const FIELD_STORIES={
  earthListen:[
    {site:'soilSoft',who:'N',label:'やわらかい土',kind:'soil',anim:'pray',dur:6,lines:[['N','ここは、こつん……こつん。奥まで音が返ってくるねぇ。'],['F','耳をつけたら、ぼくにも聞こえた！']]},
    {site:'soilCold',who:'N',label:'音の途切れる土',kind:'soil',anim:'pray',dur:6,lines:[['N','ここだけ、音が返ってこないねぇ。地面も冷たいよぉ。'],['F','すぐ隣なのに、どうしてだろう。']]},
    {site:'root',who:'N',label:'根のそばの土',kind:'root',anim:'pray',dur:6,lines:[['N','根に耳をすませると、向こうから、かすかに響いてくるよぉ。'],['F','この下に、続きがあるんだね。']]}
  ],
  earthRoot:[
    {site:'root',who:'N',label:'埋もれた大きな根',kind:'root',anim:'weed',dur:10,lines:[['N','石じゃなかったねぇ。曲がった根が、ずっと先まで続いてる。'],['F','ありがとう、ノドカ！ ぼく、葉っぱのつけ根を見てみるよ。']]},
    {site:'root',who:'F',label:'掘り出した根',kind:'root',anim:'pluck',dur:6,lines:[['F','切り口はないよ。でも、ここだけ、きゅうっと縮んでる……。'],['N','傷じゃなくて、冷えて動けないみたいだねぇ。']]}
  ],
  fireRoot:[
    {site:'root',who:'H',label:'冷えきった根',kind:'ember',anim:'pray',dur:16,lines:[['H',{A:'ほら、小さな火だ。ゆっくりでいい。燃えなくていいんだよ。',B:'ほら、小さな火だ。ゆっくりでいい。燃えなくていいんだぜ。'}],['N','……あ。根の先が動いたねぇ。']]}
  ],
  fireTrace:[
    {site:'root',who:'H',label:'根の黒い膜',kind:'root',anim:'talkthink',dur:6,lines:[['H',{A:'これは、温めても、焦げた匂いがしない。黒い膜の下には、生きた根があるね。',B:'これは、温めても、焦げた匂いがしねえ。黒い膜の下には、生きた根があるな。'}]]},
    {site:'scorch',who:'H',label:'古い落雷の跡',kind:'scorch',anim:'talkthink',dur:6,lines:[['H',{A:'こっちは、炭になってる。触ると、ぱらぱら崩れるだろう？',B:'こっちは、炭になってる。触ると、ぱらぱら崩れるだろ？'}],['F','根の黒いところとは、ぜんぜん違うね。']]}
  ],
  waterFilm:[
    {site:'root',who:'M',label:'根を覆う冷たい膜',kind:'water',anim:'draw',dur:10,lines:[['M','根をこすらずに、水だけを通します。……黒いものが、浮いてきました。'],['F','葉っぱの筋みたいな模様が、見えてきたよ！']]},
    {site:'pool',who:'M',label:'根から流れ出た水',kind:'pool',anim:'talkthink',dur:6,lines:[['M','水を静めると、黒い泥と、薄い葉が分かれました。'],['F','泥の中に、隠れてたんだね。']]}
  ],
  waterLeaf:[
    {site:'pool',who:'M',label:'葉の沈んだ水たまり',kind:'pool',anim:'pray',dur:8,lines:[['M','波を止めました。フタバさん、今なら、葉を破らずに持ち上げられます。']]},
    {site:'pool',who:'F',label:'水底の光る葉',kind:'leaf',anim:'pluck',dur:6,lines:[['F','そっと……そっと……。取れた！'],['M','#joy|葉の形が残っています。上手にすくえましたね。']]}
  ],
  windEcho:[
    {site:'pool',who:'K',label:'風に鳴る葉',kind:'leaf',anim:'talkthink',dur:5,lines:[['K','ここからは、細い笛のような音。風下に、続きを聞きにいこう。']]},
    {site:'echo',who:'K',label:'声の跳ね返る場所',kind:'wind',anim:'talkthink',dur:5,lines:[['K','音が、ここで折り返している。聞こえてくるのは、根のほうだ。'],['F','遠くから呼んでるんじゃなかったんだね。']]},
    {site:'root',who:'K',label:'響きの戻る根',kind:'root',anim:'pray',dur:6,lines:[['K','……ここだ。根を通った音が、葉から返ってきていたんだね。']]}
  ],
  windVoices:[
    {site:'root',who:'N',label:'土の響きを通す',kind:'root',anim:'pray',dur:5,lines:[['N','固い土を、もう少しゆるめるねぇ。……うん。奥まで響くよぉ。']]},
    {site:'root',who:'H',label:'根のぬくもりを保つ',kind:'ember',anim:'pray',dur:5,lines:[['H',{A:'あったかさは、ここで保ってる。みんな、安心して続けな。',B:'あったかさは、ここで保ってる。みんな、安心して続けろよ。'}]]},
    {site:'root',who:'M',label:'根の先まで水を届ける',kind:'water',anim:'draw',dur:5,lines:[['M','水が、根の先へしみこんでいきます。もう、冷たい膜に止められていません。']]},
    {site:'root',who:'K',label:'仲間の声を風にのせる',kind:'wind',anim:'wave',dur:5,lines:[['K','道は開いた。風を、根の奥へ通そう。フタバ。きみの声を聞かせて。']]},
    {site:'root',who:'F',label:'フタバの声を届ける',kind:'root',anim:'talk',dur:6,lines:[['F','ヌシ様。どこにいるのか、まだわからないけど……。ぼく、いまは、みんなといっしょだよ。'],['F','ずっと探すから。……聞こえたら、返事して！'],['N','……こつん。……聞こえたねぇ。奥のほうからだよぉ。']]}
  ]
};
const FIELD_SCENES=new WeakMap();
const FIELD_SITE_OFFSETS={soilSoft:[-4,1],soilCold:[-7,0],root:[-8,-3],scorch:[-3,-7],pool:[-6,-5],echo:[-11,1]};
const fieldStoryState=id=>S.fieldStories?.[id];
const fieldStoryDone=id=>(fieldStoryState(id)?.step||0)>=(FIELD_STORIES[id]?.length||Infinity);
function fieldStoryProgress(id){const n=fieldStoryState(id)?.step||0,L=FIELD_STORIES[id];return L&&n<L.length?L[n].label+'　'+n+'/'+L.length:'調査を終えた';}
function fieldStoryCurrent(){if(!S||WD!==0||S.free||S.cleared||S.qStory!=null||!S.qTalked)return null;const q=QUESTS[S.quest];return q?.field&&!fieldStoryDone(q.id)?q:null;}
function fieldStoryActor(step){const name=sevName(step.who);return S.res.find(r=>r.name===name);}
function fieldStorySpotOK(j){
  if(j<0||j>=W*H||!walk(j)||S.obj[j]||S.floor[j]||roomOf(j)||RUGC.has(j)||(S.drops||[]).some(d=>d.y*W+d.x===j))return false;
  // 木の葉や建物に調査場所が隠れない、ひらけた所を使う。
  for(let dy=0;dy<=3;dy++)for(let dx=-1;dx<=1;dx++){const x=j%W+dx,y=(j/W|0)+dy;if(x>=0&&x<W&&y<H&&solidOf(y*W+x))return false;}
  return true;
}
function fieldStoryEnsure(id){
  const L=FIELD_STORIES[id];if(!L)return null;
  S.fieldStories||(S.fieldStories={});const state=S.fieldStories[id]||(S.fieldStories[id]={step:0});
  const step=L[state.step];if(!step)return state;
  S.fieldSites||(S.fieldSites={});let j=S.fieldSites[step.site];const r=fieldStoryActor(step);if(!r)return state;
  const G=bfs(r.x|0,r.y|0);
  if(j!=null&&fieldStorySpotOK(j)&&G.dist[j]>=0)return state;
  const offset=FIELD_SITE_OFFSETS[step.site],x=CX+offset[0],y=CY+offset[1];let best=-1,score=Infinity;
  for(let k=0;k<W*H;k++){const d=G.dist[k];if(d<0||d>80)continue;const sc=Math.hypot(k%W-x,(k/W|0)-y)+d*.03+(step.site==='pool'&&adjOf(k,q=>S.ground[q]===1)<0?12:0);if(sc>=score||!fieldStorySpotOK(k)||Object.entries(S.fieldSites).some(([key,v])=>key!==step.site&&Math.hypot(k%W-v%W,(k/W|0)-(v/W|0))<2))continue;best=k;score=sc;}
  if(best>=0)S.fieldSites[step.site]=best;
  return state;
}
function fieldStoryFocus(id){const state=fieldStoryEnsure(id),step=FIELD_STORIES[id]?.[state?.step],j=step&&S.fieldSites?.[step.site];if(j!=null)panTo((j%W+.5)*TS,((j/W|0)+.5)*TS);}
function fieldStoryTap(tx,ty){
  const q=fieldStoryCurrent();if(!q)return false;const state=fieldStoryEnsure(q.id),step=FIELD_STORIES[q.id][state.step],j=S.fieldSites?.[step.site];
  if(j==null||Math.abs(tx-j%W)>1||ty<(j/W|0)-1||ty>(j/W|0))return false;
  if(isNight()){toast('調べるのは、明るくなってから');return true;}
  if(FIELD_SCENES.get(S)?.session===VILLAGE_SESSION||S.res.some(r=>r.act?.type==='fieldstory')){toast('なかまが調べにむかっている');return true;}
  const r=fieldStoryActor(step);
  if(!r||r.hidden||r.coffin||HOLD.has(r.id)||hungry(r)||r.energy<20||r.cing||r.meal||carryN(r)||matN(r)||['eat','fetch','forage','flee','faint','sleep'].includes(r.act?.type)||hostileNow(r)){
    toast((r?.name||'なかま')+'が、食事や休けい・用事を終えてから調べよう');return true;
  }
  const G=bfs(r.x|0,r.y|0),occupied=occTiles(r),stand=nearest(G,k=>{const d=Math.abs(k%W-j%W)+Math.abs((k/W|0)-(j/W|0));return walk(k)&&!occupied.has(k)&&d>=1&&d<=(q.id==='windVoices'?2:1)&&free('field'+k,1)},100);
  if(stand<0){toast('調べる場所までの道をあけよう');return true;}
  endAct(r);startAct(r,G,'fieldstory',stand,{key:'field'+stand,fieldId:q.id,phase:state.step,obj:j});
  toast(r.name+'が「'+step.label+'」を調べにいく');return true;
}
function fieldStoryValid(a){const q=fieldStoryCurrent(),step=FIELD_STORIES[a.fieldId]?.[a.phase];return q?.id===a.fieldId&&fieldStoryState(a.fieldId)?.step===a.phase&&step&&S.fieldSites?.[step.site]===a.obj&&fieldStorySpotOK(a.obj);}
function fieldStoryResult(r,a){
  const step=FIELD_STORIES[a.fieldId]?.[a.phase];if(!step||a.t<step.dur||!fieldStoryValid(a))return;
  const owner=S,token={session:VILLAGE_SESSION,id:a.fieldId,phase:a.phase};if(FIELD_SCENES.get(owner)?.session===VILLAGE_SESSION)return;FIELD_SCENES.set(owner,token);dialog(KS(step.lines),()=>{
    if(FIELD_SCENES.get(owner)===token)FIELD_SCENES.delete(owner);
    if(S!==owner||!fieldStoryValid(a))return;
    fieldStoryState(a.fieldId).step++;r.bubble='';
    if(a.fieldId==='windVoices'&&!fieldStoryDone(a.fieldId)&&S.res.includes(r)&&!hungry(r)&&!isNight()){
      endAct(r);startAct(r,null,'fieldwait',-1,{fieldId:a.fieldId});
    }
    renderQuest();checkQuest();if(!fieldStoryDone(a.fieldId))fieldStoryFocus(a.fieldId);
  });
}
ACT.fieldstory={
  start(r,a){if(!fieldStoryValid(a))return false;faceTo(r,a.obj);r.bubble='';},
  tick(r,a,dt){if(!fieldStoryValid(a))return;const step=FIELD_STORIES[a.fieldId][a.phase];if(step.kind==='ember'&&(a.spark=(a.spark||0)+dt)>2){a.spark=0;burst(a.obj,'plant','none');}},
  done:(r,a)=>!fieldStoryValid(a)||a.t>=FIELD_STORIES[a.fieldId][a.phase].dur,
  end:fieldStoryResult
};
ACT.fieldwait={start(r){r.bubble='♪';},done:(r,a)=>fieldStoryCurrent()?.id!==a.fieldId||isNight()||hungry(r)};
function fieldStoryAnim(r){return r.act?.type==='fieldstory'?FIELD_STORIES[r.act.fieldId]?.[r.act.phase]?.anim||'talk':r.act?.type==='fieldwait'?'talk':r.act?.type;}
function drawFieldStory(now,labelsOnly=false){
  const q=fieldStoryCurrent();if(!q)return;const state=fieldStoryState(q.id),step=FIELD_STORIES[q.id][state?.step||0],j=S.fieldSites?.[step.site];if(j==null)return;
  const x=(j%W+.5)*TS,y=((j/W|0)+.5)*TS-hiAt(j)*LIFT,t=now/600;
  ctx.save();if(labelsOnly){ctx.font='bold 11px "PixelMplus10",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff5d4';ctx.strokeStyle='#695438';ctx.lineWidth=3;const label='！ '+step.label;ctx.strokeText(label,x,y-17);ctx.fillText(label,x,y-17);ctx.restore();return;}
  ctx.strokeStyle='#f9d77b';ctx.fillStyle='rgba(255,231,153,.22)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y+5,15+Math.sin(t),8,0,0,7);ctx.fill();ctx.stroke();
  if(['pool','water','leaf'].includes(step.kind)){ctx.fillStyle='#8ac9ca';ctx.beginPath();ctx.ellipse(x,y,12,6,0,0,7);ctx.fill();ctx.strokeStyle='#d8f5ef';ctx.beginPath();ctx.ellipse(x,y,8,3,0,0,7);ctx.stroke();}
  if(['root','ember','water'].includes(step.kind)){ctx.strokeStyle='#ab8559';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-12,y+3);ctx.quadraticCurveTo(x,y-6,x+12,y+2);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y+7);ctx.stroke();}
  if(step.kind==='soil'||step.kind==='scorch'){ctx.fillStyle=step.kind==='scorch'?'#8b7868':'#ba9972';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x-7+i*7,y+(i%2)*3,4,2,0,0,7);ctx.fill();}}
  if(step.kind==='leaf'){ctx.fillStyle='#b9e6a1';ctx.beginPath();ctx.ellipse(x,y-1,8,3.5,-.5,0,7);ctx.fill();ctx.strokeStyle='#effbd5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-6,y+2);ctx.lineTo(x+6,y-4);ctx.stroke();}
  if(step.kind==='wind'){ctx.strokeStyle='#d5f5df';ctx.lineWidth=2;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(x-10,y-5+n*5);ctx.quadraticCurveTo(x+15,y-9+n*5,x+9,y+n*5);ctx.stroke();}}
  if(step.kind==='ember'){ctx.fillStyle='#ffd28d';ctx.beginPath();ctx.arc(x+6,y-4,3+Math.sin(t)*.5,0,7);ctx.fill();}
  ctx.restore();
}
