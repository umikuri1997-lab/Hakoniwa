'use strict';
const foodLow=()=>S.res.filter(r=>!r.hidden).length*2;/* 食料箱が、せいれいの人数×2より少なくなったら、食べ物を先にあつめる */
function tryJob(r,G,k){
  if(!canJob(r,k))return false;
  let j;
  switch(k){
  case'repair':{if(isNight())return false;const dmg=q=>(breakable(S.obj[q])&&(S.hp[q]??BL[S.obj[q]].hp)<BL[S.obj[q]].hp||DEFS.has(S.obj[q])&&S.hp[q]!=null||burnt(q)||(bk=>!!bk&&canRebuild(bk.j)&&free('o'+bk.j,1))(brokenCover(q)))&&free('o'+(brokenCover(q)?brokenCover(q).j:q),1);j=nearest(G,j=>!brokenCover(j)&&adjOf(j,dmg)>=0);/* こわれた場所の中ではなく、外から直す */if(j>=0){const q0=adjOf(j,dmg),bk=brokenCover(q0),q=bk?bk.j:q0;startAct(r,G,'repair',j,{key:'o'+q,obj:q});return true}return false}
  case'till':j=nearest(G,j=>S.obj[j]==='plot'&&free('o'+j,1));if(j>=0){startAct(r,G,'till',j,{key:'o'+j,obj:j});return true}return false;
  case'sow':j=nearest(G,j=>S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].sown===false&&(S.dyn[j].paid||cseed(cropK(S.dyn[j]))>0)&&free('o'+j,1));if(j>=0){startAct(r,G,'sow',j,{key:'o'+j,obj:j});return true}return false;
  case'plant':{j=nearest(G,j=>S.obj[j]==='sprout'&&free('o'+j,1));if(j>=0){startAct(r,G,'plant',j,{key:'o'+j,obj:j});return true}const wq=q=>S.obj[q]==='sprout'&&S.ground[q]===1&&free('o'+q,1);j=nearest(G,j=>adjOf(j,wq)>=0);if(j>=0){const q=adjOf(j,wq);startAct(r,G,'plant',j,{key:'o'+q,obj:q});return true}
    for(let q=0;q<W*H;q++){if(!wq(q))continue;const prev=new Int32Array(W*H).fill(-2),Q=[q];prev[q]=-1;let w=-1,sh=-1;/* 岸からとどかないハス：水の中を歩いて植える */
      for(let h=0;h<Q.length&&w<0;h++){const i=Q[h],x=i%W,y=(i/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(S.ground[k]!==1&&walk(k)&&G.dist[k]>=0&&i!==q){w=i;sh=k;break}if(S.ground[k]===1&&!solidOf(k)&&prev[k]===-2){prev[k]=i;Q.push(k)}}}
      if(w<0)continue;const p=[];for(let k=w;k>=0&&k!==q;k=prev[k])p.push(k);startAct(r,G,'plant',sh,{key:'o'+q,obj:q,wade:p});return true}
    return false}/* ハスは岸から植える */
  case'build':{const st=q=>{const a=anc(q);return S.obj[a]==='site'&&free('o'+a,2)};j=nearest(G,j=>adjOf(j,st)>=0);if(j>=0){const q=anc(adjOf(j,st));startAct(r,G,'build',j,{key:'o'+q,obj:q});return true}return false}
  case'water':case'tend':j=nearest(G,j=>S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].sown!==false&&S.dyn[j].wet<=0&&S.dyn[j].g<100&&free('w'+j,1));if(j<0)return false;if((r.wcan||0)>0){startAct(r,G,k,j,{key:'w'+j,obj:j});return true}{const s=nearest(G,q=>waterSrc(q)>=0,80);if(s>=0){startAct(r,G,'draw',s,{src:waterSrc(s)});return true}}return false;/* 水やりは、池・川・井戸・みずがめで水をくんでから（持てる数1ごとに、畑3マス） */
  case'craft':{const o=S.orders.find(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q));if(!o)return false;o.worker=r.id;const sp=craftSpot(G);startAct(r,G,'craft',sp>=0?sp:nearTile(G,BOARD),sp>=0?{order:o.id,key:'cs'+sp}:{order:o.id});return true}
  case'chop':case'mine':{if(k==='mine'&&WD===1&&!isNight()){const bq=q=>S.obj[q]==='boulder'&&free('o'+q,1);const bj=nearest(G,j=>adjOf(j,bq)>=0,90);if(bj>=0){const q=adjOf(bj,bq);startAct(r,G,'mine',bj,{key:'o'+q,obj:q});return true}}/* 大岩を先にくだく */
    if(isNight()||!(matCap()>0)||roomN(r)<1||matTot()+matN(r)>=matCap())return false;/* 素材箱に1つでも空きがあれば集めにいく（ぴったり満杯までためられる） */const camp=k==='chop'?'lumber':'quarry',nat=k==='chop'?(WD===1?((S.mat.bamboo||0)<(S.mat.wood||0)?[['bamboo'],['ntree','deadtree']]:[['ntree','deadtree'],['bamboo']]):[['ntree','deadtree']]):[['rock']];/* 火山：木材と竹の、すくないほうを先に切る */
    const cp=q=>typeAt(q)===camp&&free('o'+anc(q),2);j=nearest(G,j=>adjOf(j,cp)>=0,60);if(j>=0){const q=anc(adjOf(j,cp));startAct(r,G,k,j,{key:'o'+q,obj:q,camp:true});return true}
    for(const ns of nat){const nt=q=>ns.includes(S.obj[q])&&free('o'+q,1);j=nearest(G,j=>adjOf(j,nt)>=0,40);if(j>=0){const q=adjOf(j,nt);startAct(r,G,k,j,{key:'o'+q,obj:q});return true}}return false}
  case'cook':{if(!cnt('oven')||!(foodCap()>0)||isNight())return false;const rs=RECIPES.filter(R=>Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]));if(!rs.length)return false;
    if(!S.ovenSet)S.ovenSet={};const ok=q=>{const o=S.ovenSet[q];return o&&rs.some(R=>R.out===o)};/* かまどで、守り神さまがえらんだ料理だけ作る */
    const ov=q=>S.obj[q]==='oven'&&ok(q)&&!ashed(q)&&free('o'+q,1)&&!S.res.some(x=>x.cing&&x.cing.ov===q);j=nearest(G,j=>adjOf(j,ov)>=0,80);if(j<0)return false;const q=adjOf(j,ov),R=RECIPES.find(x=>x.out===S.ovenSet[q]);
    const sj=nearestVia(G,bfs(j%W,(j/W)|0),j=>storeAdj(j,'food')>=0,80);if(sj<0)return false;/* 材料は、かまどまでの道のりがいちばん短くなる食料箱からとる */
    startAct(r,G,'cgrab',sj,{rec:R.out,ov:q});return true}
  case'harvest':{if(!(foodCap()>0&&S.food<foodCap()))return false;const fRoom=foodCap()-S.food-carryN(r);j=nearest(G,j=>{if(S.obj[j]!=='farm'||!S.dyn[j]||S.dyn[j].g<100||!free('o'+j,1)||roomN(r)<1)return false;const c=CROPS[cropK(S.dyn[j])];return fRoom>=(c?c.yield:2)+(NEARMILL.has(j)?1:0)+(trt(r,'shukaku')?1:0)+(S.today==='hosaku'?1:0)+(r.elem==='wood'?1:0)});/* 食料箱に入りきらないときは収穫しない（持っている物を捨てない）。木の子は+1ぶんも見る */if(j>=0){startAct(r,G,'harvest',j,{key:'o'+j,obj:j,food:1});return true}
    const fr=ripeAdj(['fruit']);j=roomN(r)>=1&&fRoom>=2?nearest(G,j=>fr(j)>=0):-1;if(j>=0){const q=fr(j);startAct(r,G,'harvest',j,{key:'o'+q,obj:q,food:1});return true}return false}
  case'offer':{if(OBOX<0||isNight()||r.fun<99||r.offDay===dayNo())return false;/* おそなえは1人1日1回まで *//* たのしさが満タンになったら、おそなえする */j=nearTile(G,OBOX);if(j>=0){startAct(r,G,'offer',j);return true}return false}
  case'gather':{if(S.food>=(r.elem==='earth'?25:12)||isNight()||roomN(r)<1)return false;const bb=ripeAdj(['berry','takenoko']);j=nearest(G,j=>bb(j)>=0);if(j>=0){const q=bb(j);startAct(r,G,'gather',j,{key:'o'+q,obj:q});return true}return false}
  case'drop':if(!(S.drops&&S.drops.length)||isNight())return false;const noF=!S.res.some(x=>x.name===POKO&&!x.hidden);j=nearest(G,j=>S.drops.some(q=>q.y*W+q.x===j&&(q.id==='shard'||q.lt||q.tap||Math.hypot(q.x+.5-r.x,q.y+.5-r.y)<=(r.elem==='wind'?10:5))/* 落ちている物は、まわり5マス（風の子は10マス）に来て見つけたときにひろう（ヌシのかけらと、守り神の光でこわした物はべつ：どこでも、木を切る・石をほるより先にひろいに行く） */&&(q.id!=='shard'||r.name===POKO||noF)&&!(q.id.startsWith('food:')&&foodCap()-S.food<=0)&&!(q.id.startsWith('mat:')&&matCap()-matTot()<=0)&&!((q.id.startsWith('food:')||q.id.startsWith('mat:'))&&roomN(r)<1))&&free('d'+j,1),S.drops.some(q=>q.tap||q.lt)?9999:90);/* 食料箱がいっぱいのときは、食料のおとしものはひろわない */if(j>=0){startAct(r,G,'pickdrop',j,{key:'d'+j,obj:j});return true}return false;
  case'otaki':{if(isNight()||STATUE<0)return false;if(r.otaki){j=nearest(G,j=>adjOf(j,k=>k===STATUE||k===STATUE+W)>=0,300);if(j>=0){startAct(r,G,'otaki',j,{});return true}return false}
    if(!S.otakiQ||!Object.keys(S.otakiQ).length||S.res.some(q=>q!==r&&q.act&&q.act.type==='otakiget'))return false;j=nearest(G,j=>storeAdj(j,'mat')>=0,200);if(j>=0){startAct(r,G,'otakiget',j,{});return true}return false}/* おたきあげ：素材箱から素材をとって、神殿へ */
  case'weed':{if(isNight()||matTot()+matN(r)>=matCap()||roomN(r)<1)return false;{const RQ=wreqList();j=RQ.length?nearest(G,j=>RQ.includes(j)&&free('o'+j,1),9999):-1}if(j<0)j=nearest(G,j=>WEEDS.has(S.obj[j])&&free('o'+j,1),WEEDNEAR||(r.elem==='wind'?120:60));/* 「みる」でタップした草は、遠くてもさきに */if(j>=0){startAct(r,G,'weed',j,{key:'o'+j,obj:j});return true}return false}
      case'seed':if(!S.seeds.length||isNight())return false;j=nearest(G,j=>S.seeds.some(q=>q.y*W+q.x===j)&&free('s'+j,1),90);if(j>=0){startAct(r,G,'pickseed',j,{key:'s'+j,obj:j});return true}return false;
  }
  return false;
}
const JOBCAT=[['build','repair'],['craft'],['drop','harvest','water','tend','till','sow','plant'],['cook','chop','mine','seed','offer','gather','weed']];
const ALLJOB=['harvest','sow','offer','gather'],FARMJ=['harvest','water','tend','till','sow'];/* 畑の世話 */
const IDLE_ACTS=['fish','play','wander','idle'];
// 種まき・植える・依頼・建築があるか（いつもの作業を中断してでも向かう仕事）
function hasHighWork(r){
  if(!isNight()&&!(r.act&&(r.act.type==='pickdrop'||FARMJ.includes(r.act.type)))&&((S.drops||[]).some(q=>(q.lt||q.tap)&&free('d'+(q.y*W+q.x),1))||!(r.act&&r.act.type==='weed')&&wreqList().some(k=>free('o'+k,1)))&&matCap()-matTot()>0)return true;/* 「みる」でタップした草・落とし物も同じ *//* 守り神がこわした物があれば、いまの作業をやめてひろいに行く（畑の世話をしているときは、やめない） */
  if(S.food<foodLow()&&foodCap()>0&&!(r.act&&(r.act.type==='gather'||r.act.type==='harvest'))){const bb=ripeAdj(['berry']);if(S.obj.some((o,j)=>(o==='farm'&&S.dyn[j]&&S.dyn[j].g>=100&&free('o'+j,1))||((o==='berry'||o==='takenoko')&&S.dyn[j]&&S.dyn[j].g>=100&&free('o'+j,1))))return true}
  if(canJob(r,'build')&&S.obj.some((o,j)=>o==='site'&&free('o'+j,2)))return true;
  if(!isNight()&&canJob(r,'repair')&&S.obj.some((o,q)=>o&&BL[o]&&(breakable(o)&&(S.hp[q]??BL[o].hp)<BL[o].hp||DEFS.has(o)&&S.hp[q]!=null||burnt(q))&&free('o'+q,1)||!o&&canRebuild(q)))return true;/* こわれた所があれば、木を切るより先に直す */
  if(S.orders.some(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q)))return true;
  for(const k in S.dyn){const j=+k,o=S.obj[j],d=S.dyn[k];
    if(o==='farm'&&d&&d.sown===false&&(d.paid||cseed(cropK(d))>0)&&free('o'+j,1))return true;
    if(o==='sprout'&&canJob(r,'plant')&&free('o'+j,1))return true}
  return false}
const ROUTINE=['chop','mine','gather'];
const URGNO=['phew','sevreact','questjoy','nmeet','step','shiver','reunion','bury','pray','build','craft','repair','eat','sleep','flee','faint','cook','store','smat','fetch','cgrab','chat','chatwait','npl','tag','offer','pickdrop','pickseed','bathe','rest'];/* 水浴びやベンチの休けいは、とちゅうでやめない */
function hasUrgent(r){/* 建てる場所か、だれも受けていない依頼があるか */
  if(canJob(r,'build')&&S.obj.some((o,j)=>o==='site'&&free('o'+j,2)))return true;
  return S.orders.some(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q))}
function hasWork(r){
  if(!isNight()&&STATUE>=0&&(r.otaki||S.otakiQ&&Object.keys(S.otakiQ).length))return true;
  if(!isNight()&&S.drops&&S.drops.length&&S.drops.some(q=>(q.id==='shard'||Math.hypot(q.x+.5-r.x,q.y+.5-r.y)<=(r.elem==='wind'?10:5))&&(q.id!=='shard'||r.name===POKO||!S.res.some(x=>x.name===POKO&&!x.hidden))&&walk(q.y*W+q.x)&&free('d'+(q.y*W+q.x),1)))return true;
  if(canJob(r,'build')&&S.obj.some((o,j)=>o==='site'&&free('o'+j,2)))return true;
  if(S.orders.some(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q)))return true;
  const room=foodCap()>0&&S.food<foodCap();
  for(const k in S.dyn){const j=+k,o=S.obj[j],d=S.dyn[k];if(o==='farm'&&d){if(room&&d.g>=100&&free('o'+j,1))return true;if(d.sown===false&&(d.paid||cseed(cropK(d))>0)&&free('o'+j,1))return true;if(d.sown!==false&&d.wet<=0&&d.g<100&&free('w'+j,1)&&(canJob(r,'water')||canJob(r,'tend')))return true}
    if((o==='plot'&&canJob(r,'till')||o==='sprout'&&canJob(r,'plant'))&&free('o'+j,1))return true}
  return false}
/* おつげ：守り神さまからの、きょういちにちの指示 */
const toyTired=(r,j)=>!!(r.lastToy&&r.lastToy.j===j&&S.t-r.lastToy.t<240);/* 同じ遊び家具には4時間行かない */
const ORACLE={play:{name:'いっぱいあそぶ',e:'🎈',jobs:[],water:1},wood:{name:'木をあつめる',e:'🪵',jobs:['chop']},stone:{name:'石をあつめる',e:'🪨',jobs:['mine']},food:{name:'食料をあつめる',e:'🍎',jobs:['harvest','gather','fish']}};
const oracleOK=k=>!ORACLE[k].water||!!(S&&S.flags&&S.flags.oracleWater);/* はじめにえらべるおつげは、木・石・食料だけ。ほかは水のステージでおぼえる（S.flags.oracleWater） */
function goWork(r,G,nw){
  // 木材と石材は、少ないほうから集める（どちらかが得意なら両方やる）
  const mo=(S.mat.stone||0)<=(S.mat.wood||0)?['mine','chop']:['chop','mine'];let gd=false;
  // おつげがあれば、それを先にする
  if(S.oracle==='play'&&r.fun<98&&goPlay(r,G,true))return true;
  // 食料がゼロなら、まず食べ物を集める
  if(S.food<foodLow()&&foodCap()>0)for(const k of['harvest','gather'])if(tryJob(r,G,k))return true;/* 食料が人数×2より少なくなったら、ほかの仕事より先に食べ物をあつめる */
  // 花や木の苗は、空腹などの急ぎの用事を除いて、ほかの仕事より先に植える
  if(tryJob(r,G,'plant'))return true;
  if(tryJob(r,G,'otaki'))return true;
  if((S.drops||[]).some(q=>q.lt||q.tap)||wreqList().length){for(const k of FARMJ)if(tryJob(r,G,k))return true;if(tryJob(r,G,'drop'))return true;if(wreqList().length&&tryJob(r,G,'weed'))return true}/* 「みる」でタップした草・きのこ・落とし物も、ここでとりにいく *//* 守り神の光でこわした物（落ちた木材・石材）は、おつげ・木を切る・石をほるより先にひろう。畑の世話よりはあと */
  if(S.oracle&&ORACLE[S.oracle])for(const k of ORACLE[S.oracle].jobs)if(tryJob(r,G,k))return true;
  // 建てる・家具づくりがいちばん先。そのつぎに得意な仕事をする
  for(const k of['build','craft',...(SPEC[r.elem]||[])])if(tryJob(r,G,k))return true;
  for(const cat of JOBCAT)for(const k of cat){
    if(k==='chop'||k==='mine'){if(gd)continue;gd=true;if(Math.random()<.35){WEEDNEAR=15;const ok=tryJob(r,G,'weed');WEEDNEAR=0;if(ok)return true}/* 木を切る・石をほるかわりに、35%で、15マス以内の雑草・きのこをむしる */for(const m of mo)if(tryJob(r,G,m))return true;continue}
    if(tryJob(r,G,k))return true}
  if(nw)return false;goWander(r,G);return true;
}
/* 依頼ボードの作業場所：ボードの手前（下の列）にならぶ。ボードより手前なので、のこぎりがボードにかくれない */
function craftSpot(G){if(BOARD<0)return -1;for(const d of[2*W+1,2*W+2,W+2,3*W+1,3*W+2,2*W+3,W+3,3*W]){const j=BOARD+d;/* 依頼ボードのすぐ前はあけて、少しはなれて作業する */if(j<0||j>=W*H||G.dist[j]<0||!walk(j)||S.obj[j]&&!(BL[S.obj[j]]&&BL[S.obj[j]].floor)||!free('cs'+j,1))continue;return j}/* きまった場所がふさがっていたら、ボードから1マスはなれたまわり（2〜4マス）で、いちばん近い場所 */let best=-1,bd=1e9;const bx=BOARD%W,by=(BOARD/W)|0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const m=Math.max(Math.abs(dx),Math.abs(dy));if(m<2)continue;const x=bx+dx,y=by+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(G.dist[j]<0||!walk(j)||S.obj[j]&&!(BL[S.obj[j]]&&BL[S.obj[j]].floor)||!free('cs'+j,1))continue;const d=G.dist[j]+m*.5;if(d<bd){bd=d;best=j}}return best}
function nearTile(G,t){return t<0?-1:nearest(G,j=>adjOf(j,k=>k===t)>=0,80)}
const OFFER={/* [もの,数,レベル] 属性とレベルで中身がかわる。レベルが3上がるごとに数+1 */wood:[['tree',1,1],['seed:*',2,1],['floor',2,1],['clover',2,3],['fruit',1,6]],water:[['farm',1,1],['path',2,1],['seed:*',2,1],['lily',1,3],['lotus',1,5]],earth:[['path',3,1],['stone',2,1],['seed:*',2,1],['gravel',3,3],['brick',2,5],['wall',2,7]],fire:[['path',2,1],['stone',1,1],['brick',2,3],['bellf',1,4],['wall',2,6]],wind:[['tree',1,1],['path',2,1],['salvia',1,3],['fence',3,4],['gate',1,6]]};
function offerFor(r){const lv=rLv(r),opts=OFFER[r.elem].filter(o=>lv>=o[2]&&(o[0].startsWith('seed:')?cnt('farm')>0:BL[o[0]].kind==='plant'?S.feat.plant&&plantOK(o[0]):S.unlocked[o[0]]));if(!opts.length)return null;const hi=opts.filter(o=>o[2]>1),o=(hi.length&&Math.random()<.5?pick(hi):pick(opts)).slice(0,2);o[1]+=o[0]==='seed:*'?(Math.random()<SEEDPL[lv]?1:0)-1:OFFERPL[lv];/* たねは1こ。その子のレベルが1上がるごとに、+1こになる確率が50%ずつ上がる（Lv3で必ず+1） *//* レベルが高いほど、上の段のものが出やすい */if(o[0]==='seed:*'){/* たねは、持っている数が少ない作物を優先 */const ks=Object.keys(CROPS).filter(cropOn),mn=Math.min(...ks.map(cseed)),c=ks.filter(k=>cseed(k)===mn);o[0]='seed:'+pick(c)}return o}
/* おもちゃで遊ぶと、そのおもちゃのステータスがのびる */
const TRAIN={slide:['spd','移動速度'],seesaw:['pow','作業スピード'],sandbox:['sta','スタミナ'],swing:['spd','移動速度'],campfire:['pow','作業スピード'],fountain:['sta','スタミナ']};
function train(r,what){const t=TRAIN[what];if(!t||!r.vr)return;const v=r.vr[t[0]]||1;if(v>=1.6||Math.random()>=.1)return;r.vr[t[0]]=Math.round(Math.min(1.6,v+.1)*100)/100;RSC.delete(r);addFloat(r.x,r.y-1.6,t[1]+'+1','#9fe8ff')}/* 遊ぶと、たまに能力が1ふえる */
function goBathe(r,G){const hs=WD===1&&springN()>0,ons=cnt('onsen')>0;if(r.elem==='fire'&&!hs&&!ons){r.bathD=dayNo();return false}/* 火の子は温泉（露天ぶろもふくむ）でしか水浴びしない */const tubOf=j=>adjOf(j,k=>(typeAt(k)==='bathtub'&&r.elem!=='fire'&&free('b'+anc(k),1))||(typeAt(k)==='onsen'&&free('b'+anc(k)+':'+j,1))),ok=j=>S.ground[j]!==1&&!S.obj[j]&&(adjOf(j,k=>hs?hotW(k):S.ground[k]===1)>=0&&(r.elem!=='fire'||hs)&&free('b'+j,1)||tubOf(j)>=0),ms=S.res.filter(q=>q!==r&&q.act&&q.act.type==='bathe'&&q.act.stand!=null);let j=ms.length?nearest(G,j=>ok(j)&&ms.some(q=>Math.abs(j%W-q.act.stand%W)+Math.abs(((j/W)|0)-((q.act.stand/W)|0))<=3),70):-1;/* だれかが水浴びしていたら、そのそばへ */if(j<0)j=nearest(G,ok,70);if(j<0){r.bathD=dayNo();return false}const tk=adjOf(j,k=>hs?hotW(k):S.ground[k]===1)>=0&&free('b'+j,1)?-1:tubOf(j);if(tk>=0){const ta=anc(tk);startAct(r,G,'bathe',j,{key:typeAt(ta)==='onsen'?'b'+ta+':'+j:'b'+ta,stand:j,tub:ta});return true}/* 露天ぶろは、まわりから何人でも *//* 水べがなくても、バスタブがあれば、そこで水浴び */startAct(r,G,'bathe',j,{key:'b'+j,stand:j});return true}
function goWander(r,G){
  if(r.cmat&&matCap()>0){const j=nearest(G,j=>storeAdj(j,'mat')>=0,200);if(j>=0)return startAct(r,G,'smat',j);return startAct(r,G,'idle',-1,{dur:15})}/* 荷物を持ったままお散歩しない（先に素材箱へ） */
  if(carryN(r)>0&&foodCap()>0)return goStore(r,G);
  const fw=isWatch(r)&&S.enemyOn;if(isNight()&&!fw)return goSleep(r,G,S.enemies.some(e=>e.spawned));/* 夜はお散歩しないで休む */
  if((r.wanderRestUntil||0)>S.t)return startAct(r,G,'idle',-1,{dur:Math.min(20,r.wanderRestUntil-S.t)});
  const c=[];for(let j=0;j<W*H;j++){const d=G.dist[j];if(d>=2&&d<=7&&walk(j)&&!(TAKEN&&TAKEN.has(j))&&!((r.routeAvoid||{})[j]>S.t)){const x=j%W,y=(j/W)|0;if(isNight()&&!VILL[j])continue;c.push(j)}}
  if(!c.length)return startAct(r,G,'idle',-1,{dur:15});
  startAct(r,G,'wander',pick(c));
}
function moveR(r,dt){
  let step=.36*dt*rMul(r,'move')*(r.act&&['questjoy','sevreact','reunion'].includes(r.act.type)&&r.act.stage==='walk'?1.5:1)/* クエストで置いた物へ駆け寄る間だけ、1.5倍 */*Math.max(NEARVANE.has((r.y|0)*W+(r.x|0))?1.2:1,NEARSIGN.has((r.y|0)*W+(r.x|0))&&r.act&&r.act.type==='flee'?1.4:1)*/* 風見鶏と道しるべは重ならない（大きいほう） */(r.energy<5?.5:1)*(r.act&&(r.act.type==='flee'||r.act.run)?1.9:1)*(r.hunger<20&&r.act&&(r.act.type==='eat'||r.act.type==='fetch'||r.act.type==='forage')?1.6:1)/* おなかがへりすぎたら、急いで食べに行く */*(FSPD[S.floor[(r.y|0)*W+(r.x|0)]]||1);r.walkT=(r.walkT||0)+dt;
  if(r.path.length>1&&r.path[0]!==r.reroute){const n0=r.path[0];if(S.res.some(q=>q!==r&&!q.hidden&&(q.y|0)*W+(q.x|0)===n0&&!(q.act&&q.act.stage==='walk'&&q.path&&q.path.length))){r.reroute=n0;const g=r.path[r.path.length-1],G0=roadSearch(r.x|0,r.y|0),np=avoidPath(r,G0,g);if(np.length&&np.length<=r.path.length+4)r.path=np}}/* 遠まわりになるなら、よけずにそのまま進む（進んでは戻るのを防ぐ。進めなければ下の「つまり」で処理） */
  if(r.path.length){const cj=(r.y|0)*W+(r.x|0),n0=r.path[0];if(n0!==cj&&Math.abs(n0%W-cj%W)+Math.abs(((n0/W)|0)-((cj/W)|0))>1){/* 次のマスがとなりでない（古い道・押されてずれた）ときは、いまの場所から道を引きなおす。壁をすりぬけない */
    const g=r.path[r.path.length-1],G0=roadSearch(r.x|0,r.y|0);r.path=G0.dist[g]>=0?avoidPath(r,G0,g):[];if(!r.path.length&&g!==cj){noPass(r);endAct(r);return}}}
  while(step>0&&r.path.length){const j=r.path[0];if(!walk(j)&&!(S.ground[j]===1&&!solidOf(j)&&(S.ground[(r.y|0)*W+(r.x|0)]===1||r.act&&r.act.wade))){const goal=r.path[r.path.length-1],G=roadSearch(r.x|0,r.y|0);if(G.dist[goal]>=0&&walk(goal)){r.path=avoidPath(r,G,goal);if(r.path.length)return}noPass(r);endAct(r);return}
    const tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-r.x,dy=ty-r.y,d=Math.hypot(dx,dy),jf=(jumpEdge((r.y|0)*W+(r.x|0),j)?9:1)*(S.ground[j]===2?2:1)*(onLadder((r.y|0)*W+(r.x|0),j)?3:1);/* ハシゴは歩く速さ×0.5（マスのさかいまで3倍ゆっくり＝1マスで2倍の時間） *//* 段差をよじのぼる・おりる間（マスのさかいまで）は9倍ゆっくり＝1マスで5倍の時間 *//* 浅瀬は2倍ゆっくり *//* 段差を飛ぶ間（マスのさかいまで）は5倍ゆっくり＝1マスで3倍の時間 */
    if(dx)r.face=dx<0?-1:1;
    if(d*jf<=step){r.x=tx;r.y=ty;r.path.shift();step-=d*jf}else{r.x+=dx/d*step/jf;r.y+=dy/d*step/jf;step=0}}
  // ぶつかって進めないときは、止まっている子のマスを避けた道を探して回り込む。道がなければ少しの間すりぬける
  if(r.path.length){const g=r.path[r.path.length-1],n0=r.path[0],dd=Math.hypot(n0%W+.5-r.x,((n0/W)|0)+.5-r.y);
    const prog=r.lastN!==r.path.length||r.lastX==null||dd<r.lastX-.06*dt;
    if(prog){r.stk=0;r.lastN=r.path.length;r.lastX=dd}else r.stk=(r.stk||0)+dt;
    if(r.stk>2.5){r.stk=0;r.lastX=null;const bl=new Set();for(const q of S.res)if(q!==r&&!q.hidden&&!(q.act&&q.act.stage==='walk'&&q.path&&q.path.length))bl.add((q.y|0)*W+(q.x|0));bl.delete(g);bl.delete((r.y|0)*W+(r.x|0));
      const G2=roadSearch(r.x|0,r.y|0,bl);if(G2.dist[g]>=0&&!r.ghost&&G2.dist[g]<=r.path.length+6)r.path=pathTo(G2,g);else r.ghost=8}}
  else{r.stk=0;r.lastX=null;r.lastN=null}
  if(r.ghost>0)r.ghost-=dt;
  if(r.act&&r.act.stage==='walk'&&r.path.length){/* 長いあいだ1マスも近づけないときは、あきらめる */
    if(r.wkA!==r.act){r.wkA=r.act;r.wkMin=r.path.length;r.wkT=0}else if(r.path.length<r.wkMin){r.wkMin=r.path.length;r.wkT=0}else r.wkT+=dt;
    if(r.wkT>30&&r.act.type!=='nmeet'){if(r.act.key)BAN.set(r.act.key,S.t+180);noPass(r);endAct(r);r.path=[];r.act={type:'idle',stage:'do',t:0,dur:8};r.wkA=null;return}}
  if(!r.path.length&&r.act)beginDo(r);
}
const NIGHT_OK=['watchpost','phew','step','sleep','stay','shiver','eat','fetch','store','smat','flee','patrol','faint','forage','questjoy','pray','reunion']/* お墓へはこぶ（pray）は夜もつづける：やめると毎コマやりなおしになって動けない */;
const WORKT=new Set(['till','sow','plant','build','craft','water','tend','repair','harvest','gather','chop','mine','cook']);
function rescueStuck(r){if(r.hidden)return;const cj=(r.y|0)*W+(r.x|0),o=S.obj[cj];if(!(HOME_WALLS.has(o)||(FENCE_IDS.has(o)&&!GATE_IDS.has(o))||S.ground[cj]===1&&!(r.act&&(r.act.type==='bathe'||r.act.type==='plant'&&r.act.wade))))return;/* 水浴び・池のまんなかのハス植えは、水に入ってよい */if(r.act&&r.act.type==='step'||(r.stepT||0)>S.t)return;r.stepT=S.t+5;/* 壁や柵・水の中にいたら、いちばん近い歩ける場所へ歩いて出る（5分ごとにさがす） */const G=bfs(cj%W,(cj/W)|0),k=nearest(G,j=>j!==cj&&walk(j)&&!S.obj[j],12);if(k>=0){endAct(r);startAct(r,G,'step',k,{run:true})}}
function updRes(r,dt){rescueStuck(r);if((RHOLD.get(r)||0)>performance.now())return;/* 喜んでいる・話したあとの少しの間は、手をとめる */if(r._pe!=null&&r.energy>r._pe+1e-6)r.eUp=S.t;r._pe=r.energy;/* 元気が回復しているか */
  if(HOLD.has(r.id)){if(r.act)endAct(r);r.act=null;return}
  if(r.hidden||r.act&&r.act.stage==='do'||Math.hypot(r.x-(r.stX??r.x),r.y-(r.stY??r.y))>.3){r.stX=r.x;r.stY=r.y;r.stT=S.t}else if(S.t-(r.stT??S.t)>=10&&!(r.act&&r.act.type==='nmeet')){if(r.act&&r.act.stand>=0){r.avoidJ=r.act.stand;r.avoidU=S.t+120}r.stX=r.x;r.stY=r.y;r.stT=S.t;if(r.act)endAct(r)}/* 動いてもいない・作業もしていないまま10分たったら、いまの行動をやめて、べつの行動をえらぶ */
  const sleeping=r.act&&r.act.type==='sleep'&&r.act.stage==='do';
  const mv=r.act&&(r.act.stage==='walk'||r.act.type==='tag');const lazy=!r.act||r.act.type==='idle'||r.act.type==='wander'||r.act.type==='stay';const wk=r.act&&r.act.stage==='do'&&WORKT.has(r.act.type);/* おなかは、作業するとへる。つかれているほどへりやすい */r.hunger-=(sleeping?.003:wk?.3:mv?.04:.02)*(lazy?.5:1)*(r.energy<10?2:r.energy<30?1.5:1)*dt*(trt(r,'shoshoku')?.8:1)*(r.full>S.t?.6:1);
  if(!sleeping)r.fun-=.07*dt*(trt(r,'genki')?.6:1);
  {const jj=(r.y|0)*W+(r.x|0),ev=ENVG?Math.min(12,ENVG[jj]+(ENVE[r.elem]?ENVE[r.elem][jj]:0)):0;if(ev>0&&!sleeping){r.fun=Math.min(100,r.fun+ev*.006*dt);if(r.act&&r.act.stage==='do'&&(r.act.type==='idle'||r.act.type==='rest'))r.energy=Math.min(100,r.energy+ev*.006*recK(r)*dt)}}/* まわりの環境がいいと、休けい・たのしさが上がる */
  // 家の中で寝ている子は、壁が壊れて「コワイノ」が入ってこない限り起きない
  if(sleeping&&r.elem==='fire'&&r.energy>30&&S.enemies.some(e=>e.spawned&&Math.hypot(e.x-r.x,e.y-r.y)<8)){const out=insideSet(),me=(r.y|0)*W+(r.x|0);
    if(out[me]||S.enemies.some(e=>e.spawned&&!out[(e.y|0)*W+(e.x|0)])){endAct(r);r.bubble='🔥'}}
  r.fun=Math.max(0,r.fun);
  if(sleeping&&isWatch(r)&&isNight()&&S.enemyOn&&(r.hunger<hMax(r)*.5?S.food>0:true)){endAct(r);addFloat(r.x,r.y-1.4,'見張りの時間','#ffd38a')}/* 家の中で寝ている子もふくめて、見張りの番なら起きる */
  if(r.elem==='fire'&&!r.hidden&&!sleeping&&!(r.act&&(r.act.type==='flee'||r.act.type==='faint'))&&!((r.fatk||0)>S.t)){const lv=rLv(r);let en=null,bd=2.3;for(const e of S.enemies){if(!e.spawned||e.dead)continue;const d=Math.hypot(e.x-r.x,e.y-r.y);if(d<bd&&(d<1.5||overFence(r.x,r.y,e.x,e.y))&&!fenceBetween(r.x,r.y,e.x,e.y)){bd=d;en=e}}
    if(en){r.fatk=S.t+5;const ba=((r.bst&&r.bst.atk)||0)+((r.sst&&r.sst.atk)||0),dmg=Math.max(.5,(fAtk(lv)+ba)*fireMul(r));en.hp-=dmg;en.flash=6;en.stun=Math.max(en.stun||0,1);en.aggro=r.id;en.aggroT=S.t;/* たたかれたコワイノは、その子をねらう */r.face=en.x>=r.x?1:-1;r.fback=en.y<r.y-.3&&Math.abs(en.y-r.y)>Math.abs(en.x-r.x)*.6;/* うしろ（北）の敵には、うしろを向いてたたく */r.swing=performance.now();atkFX(r,en);sfxAt('hit',r.x,r.y);if(en.hp<=0){r.beat=(r.beat||0)+1;defeat(en,r.name+'が'+EN[en.type].name+'を追いはらった！')}}}/* 火のせいれいは、となりのコワイノに自分から攻撃する */
  if(r.act&&!isNight()&&!URGNO.includes(r.act.type)&&!heldN(r)&&!r.meal&&!r.cing&&r.hunger>=35&&r.energy>=25&&!(r.uchk>S.t)){r.uchk=S.t+2;if(hasUrgent(r)){// 建物や依頼は、いまの作業をやめてでも向かう
    const old=r.act,op=r.path,ob=r.bubble;endAct(r);const G=bfs(r.x|0,r.y|0);if(!(tryJob(r,G,'build')||tryJob(r,G,'craft'))){r.act=old;r.path=op;r.bubble=ob;if(old.key)reserve(old.key)}}}
  if(r.elem==='fire'&&r.act&&r.act.type==='patrol'&&isNight()&&S.enemyOn&&(r.act.hunt!=null?S.t-r.act.hunt>3:S.enemies.some(e=>e.spawned&&!e.dead&&nearRes(e))))endAct(r);/* 見回り中でも、拠点＋3マスにコワイノが来たらすぐ向かう */
  if(r.elem==='fire'&&r.act&&!['step','patrol','eat','fetch','flee','faint','forage','bury'].includes(r.act.type)&&r.hunger>=50&&!r.refill&&!r.coffin&&!r.meal&&S.enemies.some(e=>e.spawned&&!e.dead&&nearRes(e)))endAct(r);/* 火の子は、ほかのことをしていても、拠点＋3マスにコワイノが来たら、やめてたたかいに行く */
  if(r.act&&r.act.type==='wander'&&isNight()&&!(isWatch(r)&&S.enemyOn)){endAct(r)}/* 夜になったら、お散歩をやめて帰る */
  if(r.act&&IDLE_ACTS.includes(r.act.type)&&!isNight()&&r.hunger>=55&&!(r.fun<(S.oracle==='play'?98:r.elem==='wind'?60:30)&&r.act.type!=='wander'&&r.act.type!=='idle')&&!r.act.rand/* 遊ぶきまり（decide0・おつげ）と同じ数で、遊びをやめない */){r.wchk=(r.wchk||0)+dt;if(r.wchk>=3){r.wchk=0;if(hasWork(r)){// 実際に仕事を始められたときだけ遊びをやめる（できないなら続ける）
    const old=r.act,op=r.path,ob=r.bubble;endAct(r);if(!goWork(r,bfs(r.x|0,r.y|0),true)){r.act=old;r.path=op;r.bubble=ob;if(old.key)reserve(old.key)}}}}
  else if(r.act&&ROUTINE.includes(r.act.type)&&!isNight()&&!r.cing&&!(r.noInt>S.t)){r.wchk=(r.wchk||0)+dt;if(r.wchk>=3){r.wchk=0;if(hasHighWork(r)){const was=r.act.type;endAct(r);r.highFirst=true;decide(r);r.highFirst=false;if(r.act&&r.act.type===was)r.noInt=S.t+60}}}
  if(r.hurt>0)r.hurt-=dt;
  if(!S.enemyOn&&r.hunger<40)r.hunger=40;/* チュートリアル中は、おなかで消えない */
  if(r.hunger<10&&!r.hw10&&S.enemyOn){r.hw10=1;toast(r.name+'のおなかが、もうすぐからっぽ！','warn')}else if(r.hunger>=25)r.hw10=0;
  if(r.hunger<=0){r.hunger=0;return die(r)}
  if(r.act&&hungry(r)&&!['step','eat','fetch','forage','flee','faint','smat','store'].includes(r.act.type))endAct(r);/* おなかが50より少なくなったら、なにをしていても（ねていても・たたかっていても）、やめて食べにいく */
  if(r.act&&r.act.type==='repair'&&r.hunger<=50&&S.food>0&&!isNight()){endAct(r);goEat(r,bfs(r.x|0,r.y|0));return}
  if(r.cing&&r.hunger<=25&&S.food<=0){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null;if(r.act&&r.act.type==='cook')endAct(r);if(r.bubble==='🔥'||r.bubble==='🍳')r.bubble=null}/* 料理中におなかがすいたら、材料をもどして食べにいく */
  if(r.act&&r.hunger<=(r.act.type==='cook'?25:50)&&S.food>0&&!isNight()&&WORKT.has(r.act.type)){endAct(r)}/* おなかが50いかになったら、作業をやめて食べにいく */
  if(r.refill&&(r.refill<=S.t||r.hunger>=hMax(r)-1||S.food<=0))r.refill=0;/* にげて食べに来たときは、マックスまで食べる */
  if(r.elem==='fire'&&r.hunger>=50&&!r.refill){r.fleeNow=false;if(r.act&&r.act.type==='flee')endAct(r)}
  {const hj=(r.y|0)*W+(r.x|0);if((r.meal||r.act&&r.act.type==='eat'&&r.act.stage==='do')&&!r.hidden&&S.enemies.some(e=>e.spawned&&!e.dead)&&(!fenceOut()[hj]||HOUSES.some(h=>h.inside.has(hj)))){r.fleeNow=false;if(!(r.act&&r.act.type==='eat')){endAct(r);startAct(r,bfs(r.x|0,r.y|0),'eat',-1,{pt:0,pw:0});return}}}/* ごはんを持っていて（食べている途中も）、柵や家の壁の中にいるなら、コワイノが近くにいても、にげずにその場で食べる */
  if(r.fleeNow&&!r.hidden&&!(r.act&&(r.act.type==='flee'||r.act.run))){r.fleeNow=false;
    const fh=r.fleeHouse;r.fleeHouse=false;const en=S.enemies.find(e=>e.spawned&&Math.hypot(e.x-r.x,e.y-r.y)<(fh?12:6));/* 家の壁がこわされたときは、少しはなれたコワイノからも逃げる */
    if(en){r.fleeT=S.t;endAct(r);const G=bfs(r.x|0,r.y|0);if(withFlee(r,fleeHit,G))return}}
  if(r.act&&!isWatch(r)&&hostileNow(r)&&r.hunger>=30&&!['shiver','eat','fetch','flee','faint','forage','pray','bury','reunion','sevreact','step','watchpost'].includes(r.act.type)&&!r.coffin)endAct(r);/* 寝ている子も、コワイノが基地に入ってきたら起きて、家でふるえる *//* たたかえない子は、コワイノがいるあいだ、家でふるえる */
  if(r.elem==='wood'&&r.act&&(r.act.type==='sleep'||r.act.type==='stay')&&r.hunger>=50&&!(r.name===POKO&&!WD&&S.flags.guard)&&!r.coffin&&isNight()&&!(r.wpNo>S.t)&&TOWERS.filter(j=>S.obj[j]==='watch').length>S.res.filter(q=>q.act&&q.act.type==='watchpost').length)endAct(r);/* 夜（火の子が見回りをはじめるとき）、だれも立っていない見張り台があれば、ねている木の子も起きて見張り台へ */
  if(r.act&&isNight()&&!NIGHT_OK.includes(r.act.type))endAct(r)
  if(r.act&&r.act.type==='sevreact'&&(r.hunger<30||hungry(r)||r.energy<10||!SEV_ENCOUNTERS.get(S)||!sevEncounterSafe(SEV_ENCOUNTERS.get(S))))endAct(r);
  if(r.act&&r.act.type==='questjoy'&&(r.hunger<30||hungry(r)||!questVisitSafe(r,r.act.obj)))endAct(r);
  if(tryQuestVisit(r))return;
  if(!r.act){decide(r);return}
  const a=r.act;
  if(a.stage==='walk'){moveR(r,dt);return}
  const wdt=WORKT.has(a.type)&&a.type!=='cook'?dt*rMul(r,'work'):dt;/* 料理は、力に関係なく、説明どおりの時間 *//* 力があるほど作業が速い */
  a.t+=wdt;const A=ACT[a.type];
  if(A.tick)A.tick(r,a,wdt);
  if(A.done(r,a)){a.fin=1;if(A.end)A.end(r,a);endAct(r)}
}
function reunite(r,sp){/* もどってきた子の、もとのなかよしは、神殿へかけつけてよろこぶ */const m=r.reMate&&S.res.find(q=>q.name===r.reMate&&!q.hidden&&q!==r);r.reMate=null;if(!m||isNight()&&!m.act)return;const G=bfs(m.x|0,m.y|0),st=nearest(G,j=>Math.abs(j%W-sp[0])+Math.abs(((j/W)|0)-sp[1])===1&&walk(j),300);if(st<0)return;endAct(m);startAct(m,G,'reunion',st,{who:r.id})}
function finishBurial(r){const nm=r.coffin&&r.coffin.name;r.coffin=null;if(!nm)return;for(const L of[S.buried||[],S.lost||[]])for(const q of L)if(q.name===nm)delete q.unb;/* 埋葬してから、よみがえらせられる */S.pt+=1;S.totalPt+=1;toast(r.name+'が'+nm+'をおみおくりした。'+((S.buried||[]).some(q=>q.name===nm)?'次の朝、神殿で呼びもどせる':'パワー+1'),'good');logEv(r.name+'が'+nm+'をおみおくりした')}
function goBurial(r,G){/* 消えてしまった子のお墓へ行き、棺を神殿へはこぶ。なかよしがいれば、その子がする */
  if(r.coffin){if(STATUE>=0){const st=nearest(G,j=>adjOf(j,k=>k===STATUE||k===STATUE+W)>=0,300);if(st>=0){startAct(r,G,'pray',st,{});return true}}finishBurial(r);return false}
  if(!cnt('grave')||isNight()||r.hunger<25||heldN(r)||r.meal||r.cing)return false;
  const ok=j=>{if(S.obj[j]!=='grave')return false;const d=S.dyn[j];if(!d||d.buried||!free('bury'+j,1))return false;if(d.mate&&d.mate!==r.name&&S.res.some(q=>q.name===d.mate&&!q.hidden)&&S.t-(d.t0||0)<240)return false;return true};
  const gs=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='grave'&&ok(j))gs.push(j);if(!gs.length)return false;
  const st=nearest(G,k=>adjOf(k,q=>gs.includes(q))>=0,200);if(st<0)return false;const g=adjOf(st,q=>gs.includes(q));startAct(r,G,'bury',st,{key:'bury'+g,obj:g});return true}
function die(r){if(r.otaki){const Q=S.otakiQ||(S.otakiQ={});for(const k in r.otaki)Q[k]=(Q[k]||0)+r.otaki[k];r.otaki=null}/* 持っていたおたきあげの素材は、まちにもどす */
  endAct(r);const dm=bestMate(r),dmN=dm?dm.name:null;{const t0=(r.y|0)*W+(r.x|0);let gj=-1;for(let rad=0;rad<4&&gj<0;rad++)for(let dy=-rad;dy<=rad&&gj<0;dy++)for(let dx=-rad;dx<=rad;dx++){const k=t0+dy*W+dx;if(k>=0&&k<W*H&&!S.obj[k]&&S.ground[k]!==1){gj=k;break}}
    if(gj>=0){S.obj[gj]='grave';S.dyn[gj]={name:r.name,buried:false,mate:dmN,t0:S.t};recount()}}S.res=S.res.filter(q=>q!==r);S.deaths++;for(const q of S.res)if(Math.hypot(q.x-r.x,q.y-r.y)<14)q.cryU=S.t+90;/* 近くのせいれいは、しばらく泣く */logEv(r.name+'が消えてしまった');
  if(!S.buried)S.buried=[];if(isKey(r.name)&&r.elem==='fire'&&!S.flags.guard&&S.ns&&S.ns.boss&&isNight())S.flags.hDied=1;/* こもれびのまもりをおぼえる前に、オオカゲの夜に火の子がいなくなった */if(isKey(r.name))S.buried.push({name:r.name,elem:r.elem,vr:r.vr,xp:r.xp||0,xpf:r.xpf||0,like:r.like,came:r.came,made:r.made,beat:r.beat,bst:r.bst,sst:r.sst,boost:r.boost,mate:dmN,unb:true});else{if(!S.lost)S.lost=[];S.lost.push({name:r.name,elem:r.elem,vr:r.vr,xp:r.xp||0,xpf:r.xpf||0,like:r.like,came:r.came,made:r.made,beat:r.beat,bst:r.bst,sst:r.sst,boost:r.boost,mate:dmN,unb:true})}/* 埋葬されるまでは、よみがえらせない（unb） *//* キーキャラは特性「きずな」でレベルそのまま。ふつうのせいれいは「めぶきのしずく」がないともどらない *//* もどってくるのはキーキャラだけ *//* 次の朝の召喚で、いちばんにもどってくる */
  addFloat(r.x,r.y-1,'👻','#fff');
  toast(r.name+'が消えてしまった…','warn');
  {const DT=S.res.length?deathTalk(r):null;if(DT&&DT.length)talkOnce('dt'+Math.round(S.t*60),DT);/* とちゅうでとじたら、つづきからでもう一度 */else{const key=isKey(r.name),fk=key?'deathTold':'death2Told';if(!S.flags[fk]&&S.res.length){const sp=S.res.find(q=>KEYRES.includes(q.name))||S.res[0],n=r.name;
    talkOnce(fk,(key?DEATHL:DEATHL2)[elemKey(sp)](n).map(t=>[sp.name,t]))}}}/* 話す子の性格で説明する */
  if(!S.res.length){S.wipe=true;S.wipeGift=WD===0?(lvOK('logfence')?'logfence':'fence'):(lvOK('wall')?'wall':'fence');giveItem(S.wipeGift,10);/* おくりものは、先にわたしておく（会話のとちゅうでとじても、なくならない） */for(const L of[S.buried||[],S.lost||[]])for(const q of L)delete q.unb}/* 全滅：埋葬する子がいないので、埋葬の前でも、次の朝から呼びもどせるようにする（お墓はそのまま） */
  if(!S.res.length)setTimeout(()=>STATUE<0?gameOver():dialog([[GOD,'#cry|みんな、消えてしもうた……。おヌシ、ひとりでよう耐えたのう。'],[GOD,'じゃが、だいじょうぶじゃ。朝になれば、この土地に深くなじんだ子から、神殿で呼びもどせるぞい。'],[GOD,'#alarm|人数が少ないうちは、「コワイノ」も少なめじゃ。オオカゲも、なかまがそろうまでは来んはずじゃ。'],[GOD,'それと…これを使うがよい。'+BL[S.wipeGift||'fence'].name+'を10こ、やろう。']],()=>toast(BL[S.wipeGift||'fence'].name+'を10こもらった','good')),800);/* 石の塀を覚えていたら、石の塀 */
}
