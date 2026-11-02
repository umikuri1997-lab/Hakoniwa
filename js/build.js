'use strict';
const LIGHTNAT={ntree:'wood',deadtree:'wood',tree:'wood',rock:'stone',bamboo:'bamboo'},NATG={ntree:30,deadtree:30,tree:30,rock:35,bamboo:30},LIGHTHIT={ntree:10,deadtree:10,tree:10,rock:12,bamboo:10},/* NATG：木・岩のゲージ（せいれいが切る・ほる秒数）。LIGHTHIT：守りの光1回でへる分。せいれいの作業と守りの光は、同じゲージをへらす */NATHIT=new Map(),DROPFX=new WeakMap();/* DROPFX：木・岩から落ちた素材が、とんで地面にころがるまでの動き（セーブしない） *//* 守り神の光をあてられる木・岩と、落ちる素材 */
const hudIc=id=>{const b=$('#'+id),im=b&&b.previousElementSibling;return im&&im.tagName==='IMG'?im:null};/* 画面の上の木材・石材のアイコン */
function natWork(a,dt){if(a.camp||!NATG[S.obj[a.obj]])return;const o=S.obj[a.obj],k='lp'+a.obj;S.hp[k]=(S.hp[k]||0)+dt*(spotNear(a.obj,o==='rock'?'ishikiri':o==='bamboo'?'takeyabu':'kikori')?1.1:1);/* きこり小屋・いしきり小屋・竹やぶの小道：+10% */NATHIT.set(a.obj,performance.now())}/* せいれいが木を切る・岩をほると、守りの光と同じゲージがへる */
const natDone=a=>(S.hp['lp'+a.obj]||0)>=(NATG[S.obj[a.obj]]||30);
function natLight(j){PTW.q=true;const o=S.obj[j],k=LIGHTNAT[o];if(LIGHTCD>0){toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒');return}if(S.pt<1){toast('パワーが足りません');return}S.pt-=1;LIGHTCD=LIGHTCDL[S.lv]||10;/* 1回パワー1。コワイノと同じ待ち時間 */
  const x=j%W,y=(j/W)|0,n=(S.hp['lp'+j]||0)+LIGHTHIT[o],cx=x*TS+16,cy=y*TS+8;delete S.hp['lt'+j];fx.push({k:'ring',x:cx,y:cy,life:1});for(let m=0;m<12;m++){const a=Math.random()*7,v=rnd(40,100);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:1,col:pick(['#fffbe0','#fff','#ffe9a0']),r:rnd(1.5,3)})}sfxAt('shoot',x,y);
  NATHIT.set(j,performance.now());if(n<NATG[o]){S.hp['lp'+j]=n;return}/* ゲージがなくなると、木材・石材が1こ落ちる。のこりは、たいきゅうバーで見せる */
  delete S.hp['lp'+j];useNat(j);S.flags.lightBroke=1;/* サブクエスト「守り神の光で木や岩をこわそう」 */const n0=(S.drops||[]).length;dropAt(x,y,'mat:'+k,1);if(S.drops&&S.drops.length>n0){sfxAt('matDrop',x,y);const d=S.drops[S.drops.length-1];d.lt=1;DROPFX.set(d,{sx:x*TS+16,sy:y*TS+4,t0:performance.now()})}}/* 何も言わずに、木材・石材のアイコンを落とす *//* 落ちた物は、せいれいがひろう。木や岩は、せいれいが切ったときと同じようにへる */
/* 守り神の光は、はじめから木や岩にも使える。フタバの「やってみて」は、はじめての夜のあとのサブクエスト（lighttry） */
function spawnSeed(){
  for(let t=0;t<40;t++){const x=OFF+((Math.random()*OW)|0),y=OFF+((Math.random()*OW)|0),j=y*W+x;/* 前からの土地の中に落ちる */
    if(!VILL[j]&&!S.ground[j]&&!S.obj[j]){S.seeds.push({x,y});return}}
}

/* ---------- 置く・こわす ---------- */
let undoStack=[];
const inv=id=>id.startsWith('seed:')?cseed(id.slice(5)):S.inv[id]||0;
const iname=id=>id.startsWith('seed:')?CROPS[id.slice(5)].name+'のたね':BL[id].item||BL[id].name;
const cseed=k=>(S.cseed||(S.cseed={}))[k]||0;
function sowFarm(d){if(d.sown!==false)return true;if(d.paid){d.paid=false;d.sown=true;d.g=0;dirty=true;return true}const k=cropK(d);if(cseed(k)>0){S.cseed[k]--;d.sown=true;d.g=0;dirty=true;return true}return false}
function giveItem(id,n){if(id.startsWith('seed:')){const k=id.slice(5);S.cseed[k]=cseed(k)+n;return}S.inv[id]=inv(id)+n}
const WIND_STAGE_TOYS=new Set(['slide','seesaw']);
function usable(id){const b=BL[id];if(WIND_STAGE_TOYS.has(id)&&WD!==4)return false;
  if(b.kind==='block')return !!S.unlocked[id]||inv(id)>0;
  if(b.kind==='furn')return inv(id)>0;
  if(b.kind==='plant')return !!S.feat.plant;
  if(b.kind==='seed')return true;
  if(b.kind==='build'){if(id==='statue')return !cnt('statue')&&!statueSite();return STATUE>=0&&lvOK(id)&&(id!=='tower'||!!S.flags.shrine&&!cnt('tower')&&!statueSite('tower'))/* 守護の台座は1つだけ */&&(id!=='well'||wellOK())&&(!BREQ[id]||elemCount(BREQ[id])>0)}
  return false}
/* 井戸は「水のせいれいをむかえよう」のあとに思いつく */
function wellOK(){const qi=QUESTS.findIndex(q=>q.id==='water');return qi<0||!!S.flags.wellR||S.quest>qi+1||(S.quest===qi+1&&S.qStory==null)}
function statueSite(id='statue'){for(const k in S.dyn)if(S.obj[k]==='site'&&S.dyn[k].build===id)return true;return false}/* 建てている途中の物があるか */
const BADC={k:'',t:0,L:[]};
const RUGS=new Set(['rug1','rug2','hoshirug']);/* ラグは、床の上の層（S.rug：左上のマス→ラグ）。たて2・よこ2マス。上に家具を置ける */
const rugCells=a=>[a,a+1,a+W,a+W+1];
const CANOPY=new Set(['gazebo','azumaya']),LOWROOF=new Set(['chair','stool','achair','pouf','sofa1','bench','takebench','table','stable','ltable','clover','bellf','salvia','lily']);/* ガゼボ・東屋は、物の上にかぶせる層（S.roof：左上のマス→id）。たて2・よこ2マス。下に置けるのは、ひくい物だけ（ラグはべつの層なので、いつでも） */
function canRoof(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x+1>=W||y+1>=H)return false;{const h0=hiAt(y*W+x);if(hiAt(y*W+x+1)!==h0||hiAt(y*W+W+x)!==h0||hiAt(y*W+W+x+1)!==h0)return no('段差をまたいでは置けません')}
  if(x<0||y<0||x>=W-1||y>=H-1)return no('ここには置けません');for(const c of rugCells(y*W+x)){if(S.ground[c]===1)return no('水の上には置けません');if(RFC.has(c))return no('ここにはもう屋根があります');const o=S.obj[c],a=o==='part'?S.obj[S.ref[c]]:o;if(a&&!LOWROOF.has(a)&&!WEEDS.has(a))return no('下には、ひくい物だけ置けます')}return true}
const rugsIn=set=>{const L=[];for(const k in S.rug||{})if(rugCells(+k).some(c=>set.has(c)))L.push(S.rug[k]);return L};/* 家の中（どこか1マスでも）にあるラグ */
function canRug(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x+1>=W||y+1>=H)return false;
  if(x<0||y<0||x>=W-1||y>=H-1)return no('ここには置けません');for(const c of rugCells(y*W+x)){if(S.ground[c]===1)return no('水の上には置けません');if(RUGC.has(c))return no('ここにはもうラグがあります');const o=S.obj[c],a=o==='part'?S.obj[S.ref[c]]:o;if(a&&!WEEDS.has(a)&&!(BL[a]&&BL[a].kind==='furn'&&!BL[a].trap&&!WALLD.has(a)))return no('ここにはもう何かあります')}return true}/* 家具の下にもしける */
function canPlace(id,x,y,quiet){if(id==='shinboku'&&(cnt('shinboku')>0||S.obj.some((o,k)=>o==='site'&&S.dyn[k]&&S.dyn[k].build==='shinboku'))){if(!quiet)toast('ご神木は、1本だけです','warn');return false}/* ご神木は村に1本 */
  if(RUGS.has(id))return canRug(x,y,quiet);
  if(CANOPY.has(id))return canRoof(x,y,quiet);
  if(id==='statue'&&!(canPlace('fence',x-1,y,quiet)&&canPlace('fence',x+1,y,quiet)&&canPlace('fence',x,y+1,quiet)))return false;
  if(BL[id].sz){const F=fp(id,x,y);for(const[a,b]of F)if(!canPlace1(id,a,b,quiet))return false;if(F.some(([a,b])=>hiAt(b*W+a)!==hiAt(F[0][1]*W+F[0][0]))){if(!quiet)toast('段差をまたいでは置けません');return false}return true}
  return canPlace1(id,x,y,quiet);
}
function canPlace1(id,x,y,quiet){
  if(x<0||y<0||x>=W||y>=H)return false;
  if(WALLD.has(id)){const j=y*W+x,iw=k=>HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k)),wreath=id==='wreath',target=HOME_WALLS.has(S.obj[j])&&S.obj[j]!=='wall'||wreath&&HOME_DOORS.has(S.obj[j]);/* 石の塀にはかけられない */if(!target||wreath&&HOME_DOORS.has(S.obj[j])&&(iw(j-W)||iw(j+W))&&!(iw(j-1)||iw(j+1))||!wreath&&(iw(j-W)||iw(j+W))||(S.win&&S.win[j]&&!((id==='curtain1'||id==='curtain2')&&S.win[j]===1))||((id==='curtain1'||id==='curtain2')&&!(S.win&&S.win[j]===1&&HOUSES.some(h=>h.set.has(j)&&h.inside.has(j+W)&&!h.inside.has(j-W))))){if(!quiet)toast((id==='curtain1'||id==='curtain2')?'カーテンは、家の上がわの窓にだけかけられます':wreath?'リースは、壁か横向きのドアにだけかけられます':BL[id].name+'は、横向きの家の壁にだけかけられます');return false}return true}/* 窓は壁にはめる */
  const j=y*W+x;if(id==='lotus'){if(S.ground[j]!==1){if(!quiet)toast('ハスは池の上にだけ植えられます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(id==='bridge'){if(S.ground[j]!==1){if(!quiet)toast('橋は水の上にだけかけられます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(S.ground[j]===1){if(!quiet)toast('水の上には置けません');return false}
  if(S.ground[j]===2){if(!quiet)toast('浅瀬には置けません');return false}
  if(TERRA.has(id)){const k=id==='dig';if(k?!hiAt(j):hiAt(j)>=HMAX){if(!quiet)toast(k?'高いマスだけ、けずれます':'これより高くは、もれません');return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])||S.floor[j]){if(!quiet)toast('なにもない所だけです');return false}if([j-1,j+1,j-W,j+W].some(n=>STAIRS.has(S.obj[n])&&stairTop(n,stairDir(n))===j)){if(!quiet)toast(k?'階段のうしろは、けずれません':'階段のうしろは、もれません');return false}return true}/* だんさスコップ：けずる・もる */
  if(LADDERS.has(id)){if(ladderDir(j)<0){if(!quiet)toast('ハシゴは、がけの下の、うしろか左右が1だん高い所に置けます');return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(STAIRS.has(id)){const d=PLROTS[id]?SROT[PLROTS[id]]:stairDir(j);if(d<0||!stairOK(j,d)){if(!quiet)toast(PLROTS[id]?ROTL[5][PLROTS[id]]+'には置けません':'段差の下に、2マスあいている所に置けます');return false}if(d){const o=stairOut(j,d);if(S.obj[o]&&!WEEDS.has(S.obj[o])||o<0||o>=W*H){if(!quiet)toast('階段は2マスいります');return false}}}/* 階段は、段差の下の低い地面に1×2 */
  if(BL[id].floor)return S.floor[j]!==id&&!(S.obj[j]&&BL[S.obj[j]].job);
  if(S.obj[j]&&!WEEDS.has(S.obj[j])){if(!quiet)toast('ここにはもう何かあります');return false}/* 雑草の上には、そのまま置ける（置いた物が上書きする） */
  if(RFC.has(j)&&!LOWROOF.has(id)){if(!quiet)toast('屋根の下には、ひくい物だけ置けます');return false}
  if(RUGC.has(j)&&BL[id].kind!=='furn'){if(!quiet)toast('ラグの上には、家具だけ置けます');return false}/* ラグの上には家具を置ける */
  {const b=BL[id];if(b&&(b.solid||HOME_WALLS.has(id)||(FENCE_IDS.has(id)&&!GATE_IDS.has(id)))&&(S.res.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===j)||S.enemies.some(e=>e.spawned&&!e.dead&&(e.y|0)*W+(e.x|0)===j))){if(!quiet)toast('せいれいか「コワイノ」がいるので、置けません');return false}}/* 立っている子がいる場所には、通れなくなる物は置けない */
  return true;
}
function bridgeSpan(x,y){/* (x,y) の水から、よこ・たてに水がつづくぶんをしらべて、両はしが歩ける岸のほう（短いほう）のマス。10マスまで */const wt=(a,b)=>a>=0&&b>=0&&a<W&&b<H&&S.ground[b*W+a]===1&&!S.obj[b*W+a],land=(a,b)=>a>=0&&b>=0&&a<W&&b<H&&S.ground[b*W+a]!==1&&walk(b*W+a);let best=null;
  for(const[dx,dy]of[[1,0],[0,1]]){let a=x,b=y;while(wt(a-dx,b-dy)){a-=dx;b-=dy}let c=x,d=y;while(wt(c+dx,d+dy)){c+=dx;d+=dy}if(!land(a-dx,b-dy)||!land(c+dx,d+dy))continue;const L=[];for(let p=a,q=b;;p+=dx,q+=dy){L.push(q*W+p);if(p===c&&q===d)break}if(L.length<=10&&(!best||L.length<best.length))best=L}return best}
function setBlock(id,j){
  if(BL[id].floor){S.floor[j]=id;return}
  if(id==='farm'){S.obj[j]='plot';S.dyn[j]={p:0};return}
  S.obj[j]=id;if(BL[id].dyn)S.dyn[j]={g:0};if(BL[id].hp)S.hp[j]=BL[id].hp;
  if(STAIRS.has(id)){const d=stairDir(j);if(d>=0){(S.rot||(S.rot={}))[j]=SROT.indexOf(d);if(d){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}return}/* 階段は1×2：向きをきめて、低いほうのマスもつかう */
  setParts(id,j,'part');
}
function swingWide(){/* ブランコが2マスはばになった：前のセーブのブランコは、右か左のあいたマスへひろげる。どちらもふさがっていたら、おそなえ箱にもどす */let back=0;const ok=k=>k>=0&&k<W*H&&!S.obj[k]&&S.ground[k]!==1;
  for(let j=0;j<S.obj.length;j++){if(S.obj[j]!=='swing')continue;const x=j%W;if(x<W-1&&ok(j+1)){S.obj[j+1]='part';S.ref[j+1]=j}else if(x>0&&ok(j-1)){S.obj[j-1]='swing';S.obj[j]='part';S.ref[j]=j-1;if(S.rot&&S.rot[j]!=null){S.rot[j-1]=S.rot[j];delete S.rot[j]}}else{clearObj(j);giveItem('swing',1);back++}}
  if(back)setTimeout(()=>toast('ブランコが2マスはばになったので、ひろげられないブランコを'+back+'つ、おそなえ箱にもどしました'),1500)}
function setParts(id,j,kind){const x=j%W,y=(j/W)|0;for(const[a,b]of fp(id,x,y)){const k=b*W+a;if(k===j)continue;S.obj[k]=kind;S.ref[k]=j}}
function place(id,x,y){
  const b=BL[id];
  if(WALLD.has(id)){if(!usable(id)||inv(id)<=0)return toast(BL[id].name+'が足りません','warn');if(!canPlace(id,x,y))return;const j=y*W+x;S.inv[id]--;/* カーテンは、上がわの壁の窓にかける。窓はそのまま（S.win がカーテンなら、その下に窓がある） */(S.win||(S.win={}))[j]=id==='window'?1:id;noteQuestPlacement(HOME_DOORS.has(S.obj[j])?'door':'hwall',j);burst(j,'furn');recount();dirty=true;renderPalette();return}
  if(b.kind==='seed'){const k=id.slice(5),j=y*W+x,d=S.dyn[j];if(S.obj[j]!=='farm'||!d)return toast('たねは、畑にしかまけません');
    if(d.crop&&d.sown!==false)return toast('もう'+CROPS[d.crop].name+'が植えてある');if(cseed(k)<1)return toast('たねがありません');
    if(d.paid&&d.crop)S.cseed[d.crop]=cseed(d.crop)+1;S.cseed[k]--;d.paid=true;/* たねは、えらんだときに減る */d.crop=k;d.sown=false;if(k==='imo'&&QUESTS[S.quest]?.id==='imoseed'&&S.qTalked){const plots=imoSeedQuestPlots();if(!plots.includes(j))plots.push(j)}noteQuestPlacement('farm',j);burst(j,'plant','pat');toast(CROPS[k].name+'のたねをまいた');checkQuest();renderPalette();return}/* せいれいが、たねをまく */
  if(id==='tower'&&!towerReady())return openSheet('clear');/* 条件がそろうまで、台座は建てられない */
  if(!usable(id)){if(b.kind==='furn'){toast(b.name+'が足りません','warn')}/* 足りないときは、知らせるだけ（画面は開かない） */else toast('まだつかえません');return}
  if(!canPlace(id,x,y))return;
  if(id==='bridge'){/* 橋：タップした水のマスから、向こう岸まで、まっすぐかける（よこ・たての短いほう）。パワー・素材は、マスの数ぶん */
    const L=bridgeSpan(x,y);if(!L)return toast('向こう岸が見つかりません');const n=L.length,pc=b.pc*n,bm={};for(const k in b.mat)bm[k]=b.mat[k]*n;
    if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');
    S.pt-=pc;for(const k in bm)S.mat[k]-=bm[k];for(const q of L){S.obj[q]='site';S.dyn[q]={build:'bridge',p:0,need:b.time,mat:b.mat}}undoStack.push({j:L[0],id,pc,mat:bm,span:L});
    toast('せいれいが'+b.name+'を'+n+'マスかけにきてくれる');S.placed[id]=(S.placed[id]||0)+1;recount();burst(L[0],'furn');renderPalette();checkQuest();return}
  const j=y*W+x;
  if(b.kind==='plant'||b.kind==='build'){
    if(b.kind==='plant'&&inv(id)<=0){toast(iname(id)+'がおそなえ箱にありません');return}
    const free=id==='watch'&&watchQ(),pc=free?0:b.pc,bm=id==='tower'?TOWER_MAT():free?null:b.mat;/* 台座は木材・石材を使う（取り消すともどる） *//* 建物はパワーと素材を使う */
    if(b.kind==='build'&&S.pt<pc)return toast('パワーが足りません（'+SP(b.pc)+'）');
    if(b.kind==='build'&&!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');
    if(b.kind==='plant'&&cnt('sprout')>=10)return toast('植える予定がいっぱいです');
    if(b.kind==='build'&&!TERRA.has(id)&&cnt('site')>=3)return toast('建てる予定がいっぱいです');
    if(b.kind==='plant'){S.inv[id]--;S.obj[j]='sprout';S.dyn[j]={plant:id,p:0,userMound:true};undoStack.push({j,id,seed:1})}
    else{S.pt-=pc;for(const k in bm||{})S.mat[k]-=bm[k];S.obj[j]='site';S.dyn[j]={build:id,p:0,need:b.time,mat:bm||undefined};undoStack.push({j,id,pc,mat:bm});
      if(LADDERS.has(id))(S.rot||(S.rot={}))[j]=ladderDir(j);/* ハシゴの向き */
      else if(STAIRS.has(id)){const v=PLROTS[id]||0,d=v?SROT[v]:stairDir(j);(S.rot||(S.rot={}))[j]=SROT.indexOf(d);if(d){const o=stairOut(j,d);S.obj[o]='site2';S.ref[o]=j}}/* 階段：向きをきめて、低いほうのマスも足場に */
      else if(id==='statue'){for(const k of[j-1,j+1,j+W]){S.obj[k]='site2';S.ref[k]=j}}else setParts(id,j,'site2')}/* 足場のどのマスからでも、まわりから作業できる */
    toast(b.kind==='plant'?'せいれいが植えにきてくれる':'せいれいが'+b.name+'を建てにきてくれる');
  }else{
    if(inv(id)<=0){toast(b.name+'が足りません','warn');return}/* 足りないときは、知らせるだけ（おそなえ箱は開かない） */
    const prevFloor=b.floor?S.floor[j]:'';undoStack.push({j,prevFloor,id});
    if(ROTS[id]){const R=S.rot||(S.rot={}),v=PLROTS[id]||0;if(v)R[j]=v;else delete R[j]}/* 置くときにえらんだ向き（大きさの計算より先に） */
    S.inv[id]--;if(prevFloor)giveItem(prevFloor,1);
    if(CANOPY.has(id)||RUGS.has(id))for(const c of rugCells(j))if(WEEDS.has(S.obj[c]))S.obj[c]='';/* ラグ・屋根の下の雑草は、なくなる */
    if(CANOPY.has(id)){(S.roof||(S.roof={}))[j]=id;/* S.rot は下にある物の向き：けさない */undoStack[undoStack.length-1].roof=1}
    else if(RUGS.has(id)){(S.rug||(S.rug={}))[j]=id;const RR=S.rugRot||(S.rugRot={});if(PLROTS[id])RR[j]=PLROTS[id];else delete RR[j];undoStack[undoStack.length-1].rug=1}/* ラグは床の上の層にしく */
    else setBlock(id,j)
  }
  if(undoStack.length>30)undoStack.shift();
  S.placed[id]=(S.placed[id]||0)+1;recount();if(S.obj[j]===id||S.floor[j]===id||RUGS.has(id)&&S.rug&&S.rug[j]===id||CANOPY.has(id)&&S.roof&&S.roof[j]===id)noteQuestPlacement(id,j);burst(j,b.kind==='block'?'block':b.kind==='plant'?'plant':'furn',b.kind==='furn'?'furnPlace':b.kind==='plant'?'pat':null);if(SEATS.includes(id)&&spotW(j)>=0)addFloat(j%W+.5,(j/W|0)-.3,'つりスポット！');renderPalette();checkQuest();
  if(id==='door'||id==='yozoradoor'){const w=houseWhy(j);if(w)setTimeout(()=>toast(w,'warn'),400);else if(HOUSES.some(h=>h.set.has(j)))setTimeout(()=>toast('家ができた！','good'),400)}/* ドアを置いたら、家になったかを知らせる */
}
function undo(){
  const u=undoStack.pop();if(!u)return toast('もどせるものがありません');
  const o=S.obj[u.j];
  if(u.seed){if(o==='sprout'){clearObj(u.j);giveItem(u.id,1)}else return toast('もう手をつけているので、もどせません')}
  else if(u.span){if(!u.span.every(q=>S.obj[q]==='site'&&!((S.dyn[q]||{}).p>0)))return toast('もう手をつけているので、もどせません');for(const q of u.span)clearObj(q);S.pt+=u.pc;for(const k in u.mat||{})S.mat[k]=(S.mat[k]||0)+u.mat[k]}/* 橋はまとめてもどす */
  else if(u.pc!=null){if(o==='site'){if(u.id==='statue')return toast('神殿はもどせません');clearObj(u.j);S.pt+=u.pc;for(const k in u.mat||{})S.mat[k]=(S.mat[k]||0)+u.mat[k]}else return toast('もう手をつけているので、もどせません')}
  else if(BL[u.id].floor){if(S.floor[u.j]!==u.id)return toast('もうもどせません');/* とりのぞいたあとの床は、もどさない（ふえてしまう） */S.floor[u.j]=u.prevFloor;if(u.prevFloor)S.inv[u.prevFloor]=Math.max(0,inv(u.prevFloor)-1);giveItem(u.id,1)}
  else if(u.roof){if(!(S.roof&&S.roof[u.j]===u.id))return toast('もうもどせません');delete S.roof[u.j];giveItem(u.id,1)}/* ガゼボ・東屋 */
  else if(u.rug){if(!(S.rug&&S.rug[u.j]===u.id))return toast('もうもどせません');delete S.rug[u.j];if(S.rugRot)delete S.rugRot[u.j];giveItem(u.id,1)}/* ラグ */
  else{if(o!==u.id&&!(u.id==='farm'&&o==='plot'))return toast('もうもどせません');clearObj(u.j);giveItem(u.id,1)}
  if(S.placed&&S.placed[u.id]>0)S.placed[u.id]--;/* もどした分は、置いた数からひく */
  recount();renderPalette();
}
function dropChair2(){/* なくしたクッションチェア：置いてある物・持ち物・依頼は、いすにかえる。レシピからはけす */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='chair2')S.obj[j]='chair';
  if(S.inv&&S.inv.chair2){S.inv.chair=(S.inv.chair||0)+S.inv.chair2;delete S.inv.chair2}
  for(const o of S.orders||[])if(o.type==='chair2')o.type='chair';
  if(S.recipes)delete S.recipes.chair2;if(S.guardianIdeas)delete S.guardianIdeas.chair2}
function dropBirdhouse(){/* なくした巣箱：置いてある物・持ち物・依頼は、生垣にかえる。レシピからはけす */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='birdhouse')S.obj[j]='hedge';
  if(S.inv&&S.inv.birdhouse){S.inv.hedge=(S.inv.hedge||0)+S.inv.birdhouse;delete S.inv.birdhouse}
  for(const o of S.orders||[])if(o.type==='birdhouse')o.type='hedge';
  if(S.recipes)delete S.recipes.birdhouse;if(S.guardianIdeas)delete S.guardianIdeas.birdhouse}
function dropNtree(){/* まん中から28マスより外の森の木は、枯れ木にする（生えなおす木も）。フリーモードはべつ */if(WD===FREE)return;const far=j=>Math.max(Math.abs(j%W+.5-CX),Math.abs(((j/W)|0)+.5-CY))>28;for(let j=0;j<W*H;j++)if(S.obj[j]==='ntree'&&far(j))S.obj[j]='deadtree';for(const g of S.regrow||[])if(g.id==='ntree'&&far(g.j))g.id='deadtree'}
function dropFlower(){/* なくした花だん：置いてある物・持ち物・依頼は、シロツメクサにかえる。レシピ・しるしからはけす */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='flower')S.obj[j]='clover';
  if(S.inv&&S.inv.flower){S.inv.clover=(S.inv.clover||0)+S.inv.flower;delete S.inv.flower}
  for(const o of S.orders||[])if(o.type==='flower')o.type='clover';
  if(S.recipes)delete S.recipes.flower;if(S.guardianIdeas)delete S.guardianIdeas.flower;if(S.unlocked&&S.unlocked.flower){delete S.unlocked.flower;S.unlocked.clover=true}}
function fixBeds(){/* 2マスだったころのベッド：のこりのマス（part）をあける（下のラグは、ラグの層にのこる） */
  for(const k in S.ref){const j=S.ref[k];if(S.obj[k]==='part'&&BEDSET.has(S.obj[j])){S.obj[k]='';delete S.ref[k]}}}
function rugsBig(){/* ラグがたて2・よこ2マスになった：前のラグ（1マス・家具の下の分も）を、そのマスをふくむ2×2にひろげる。ひろげられないラグは、おそなえ箱にもどす */
  const old=[];for(let j=0;j<W*H;j++)if(RUGS.has(S.obj[j])){old.push([j,S.obj[j],(S.rot||{})[j]||0]);S.obj[j]='';if(S.rot)delete S.rot[j]}
  for(const k in S.rug||{})old.push([+k,S.rug[k],(S.rugRot||{})[k]||0]);S.rug={};S.rugRot={};RUGC=new Map();let back=0;
  for(const[j,id,rt]of old){const x=j%W,y=(j/W)|0,a=[[x,y],[x-1,y],[x,y-1],[x-1,y-1]].find(([ax,ay])=>canRug(ax,ay,true));if(!a){giveItem(id,1);back++;continue}const k=a[1]*W+a[0];S.rug[k]=id;if(rt)S.rugRot[k]=rt;for(const c of rugCells(k))RUGC.set(c,k)}
  if(back)setTimeout(()=>toast('ラグが大きくなったので、しけないラグを'+back+'つ、おそなえ箱にもどしました'),1500)}
function clearObj(j){j=anc(j);const o=S.obj[j];if(S.bedOwn)delete S.bedOwn[j];/* ベッドをどけたら、だれのベッドかも消す */const tl=o&&BL[o]&&BL[o].sz?fp(o,j%W,(j/W)|0).map(([a,b])=>b*W+a):[j];delete S.hp['L'+j];if(S.win&&S.win[j]){const p=S.win[j],wid='window';giveItem(p===1?wid:p,1);if(p==='curtain1'||p==='curtain2')giveItem(wid,1);delete S.win[j]}/* カーテンの下の窓ももどす */if(S.rot)delete S.rot[j];for(const k in S.ref)if(S.ref[k]===j){S.obj[k]='';delete S.ref[k]}S.obj[j]='';delete S.dyn[j];delete S.hp[j];delete S.hp['L'+j];
  for(const r of S.res)if(r.act&&r.act.obj===j)endAct(r);return o}
let MOVESRC=null;/* ひっこしミトン：えらんだ物 {k:'obj'|'rug'|'roof',j} */
const NOMOVE=new Set(['statue','obox','board','altar','tower','site','site2']);/* 神殿まわり・建てている物は、うつせない */
function moveTarget(j){if(S.rug&&RUGC.has(j)&&!(S.obj[j]&&S.obj[j]!=='part'&&!WEEDS.has(S.obj[j])))return {k:'rug',j:RUGC.get(j)};const a=anc(j),o=S.obj[a];
  if(o&&BL[o]&&(BL[o].kind==='furn'||BL[o].kind==='build')&&!BL[o].natural&&!NOMOVE.has(o))return {k:'obj',j:a};if(RFC.has(j))return {k:'roof',j:RFC.get(j)};return null}
function moveName(m){return BL[m.k==='rug'?S.rug[m.j]:m.k==='roof'?S.roof[m.j]:S.obj[m.j]].name}
function writeObj(id,j,v){/* うつした物を書きこむ（向き・状態・じょうぶさもそのまま） */if(v.rot!=null)(S.rot||(S.rot={}))[j]=v.rot;S.obj[j]=id;if(STAIRS.has(id)){const d=stairDir(j);if(d>0){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}else setParts(id,j,'part');if(v.dyn)S.dyn[j]=v.dyn;if(v.hp!=null)S.hp[j]=v.hp;if(v.hpL!=null)S.hp['L'+j]=v.hpL;if(v.own!=null)(S.bedOwn||(S.bedOwn={}))[j]=v.own;if(v.cd!=null)(S.trapCd||(S.trapCd={}))[j]=v.cd}
function moveTap(tx,ty){const j=ty*W+tx;
  if(!MOVESRC){const m=moveTarget(j);if(!m)return toast('うつしたい家具・建物をタップ');if(m.k==='obj'&&fireAt(m.j))return toast('燃えているあいだは、うつせません');MOVESRC=m;sfx('tap');toast(moveName(m)+'を、どこへうつす？');dirty=true;renderPalette();return}
  const m=MOVESRC;if(m.j===j||m.k==='obj'&&anc(j)===m.j){MOVESRC=null;dirty=true;renderPalette();return toast('やめました')}/* 同じ物をタップしたら、やめる */
  if(m.k==='rug'||m.k==='roof'){const L=m.k==='rug'?S.rug:S.roof,id=L[m.j],rr=m.k==='rug'&&S.rugRot?S.rugRot[m.j]:null;delete L[m.j];if(rr!=null)delete S.rugRot[m.j];recount();
    if(!(m.k==='rug'?canRug(tx,ty,false):canRoof(tx,ty,false))){L[m.j]=id;if(rr!=null)S.rugRot[m.j]=rr;recount();return}
    L[j]=id;if(rr!=null)S.rugRot[j]=rr;for(const c of rugCells(j))if(WEEDS.has(S.obj[c]))S.obj[c]=''}
  else{const a=m.j,id=S.obj[a],cells=fp(id,a%W,(a/W)|0).map(([x,y])=>y*W+x),v={rot:S.rot?S.rot[a]:null,dyn:S.dyn[a],hp:S.hp[a],hpL:S.hp['L'+a],own:S.bedOwn?S.bedOwn[a]:null,cd:S.trapCd?S.trapCd[a]:null};
    if(STAIRS.has(id)){const d=stairDir(a);if(d>0)cells.push(stairOut(a,d))}
    for(const c of cells){if(c!==a&&S.obj[c]!=='part')continue;S.obj[c]='';delete S.ref[c]}if(S.rot)delete S.rot[a];delete S.dyn[a];delete S.hp[a];delete S.hp['L'+a];if(S.bedOwn)delete S.bedOwn[a];if(S.trapCd)delete S.trapCd[a];
    const pr=PLROTS[id];PLROTS[id]=v.rot||0;let ok=false;try{ok=canPlace(id,tx,ty,false)}finally{if(pr==null)delete PLROTS[id];else PLROTS[id]=pr}
    if(!ok){writeObj(id,a,v);return}
    for(const r of S.res)if(r.act&&(r.act.obj===a||cells.includes(r.act.obj)))endAct(r);
    for(const b of S.broken||[])if(b.j===a)b.j=j;
    writeObj(id,j,v)}
  MOVESRC=null;recount();dirty=true;burst(j,'furn','furnPlace');renderPalette();checkQuest()}
function removeAt(x,y){const tx0=x,ty0=y;
  const j=anc(y*W+x),o=S.obj[j];x=j%W;y=(j/W)|0;
  if(S.win&&S.win[j]){const id=S.win[j]===1?'window':S.win[j];if(id==='curtain1'||id==='curtain2')S.win[j]=1;else delete S.win[j];giveItem(id,1);/* カーテンをはずすと、窓がのこる */toast(BL[id].name+'をおそなえ箱にもどした');burst(j,'furn','rm');recount();renderPalette();return}
  if(o){const b=BL[o];if(o==='tower')return toast('守護の台座はこわせません');if(o==='volcano'||o==='heatv'||o==='crack'||o==='boulder')return toast(b.name+'はこわせません');if(o==='statue'||o==='obox'||o==='board'||o==='altar'||o==='site2')return toast('神殿はこわせません');if((o==='stor'||o==='mbox')&&cnt(o)<=1)return toast(BL[o].name+'は1つ以上必要です');
    if(o==='site'){const d=S.dyn[j];if(d.build==='statue')return toast('神殿はこわせません');const bm=d.mat||{};clearObj(j);for(const k in bm)S.mat[k]=(S.mat[k]||0)+bm[k];toast('建てるのをやめた')}/* 素材はもどる・パワーはもどらない */
    else if(o==='sprout'){const d=S.dyn[j];clearObj(j);giveItem(d.plant,1);toast('植えるのをやめた')}
    else{clearObj(j);
      if(b.natural){toast(b.name+'をかたづけた')}
      else if(FLOWERS.has(o)||o==='tree'||o==='fruit'){giveItem(o,1);toast(iname(o)+'をもらった')}/* 花・木をこわすと、種・苗がもどる */
      else if(o==='plot'||o==='farm'){giveItem('farm',1);toast('畑をおそなえ箱にもどした')}
      else if(b.kind==='block'||b.kind==='furn'){giveItem(o,1);toast(b.name+'をおそなえ箱にもどした')}
      else if(b.kind==='build'&&b.mat){const fr=S.freeB&&S.freeB[j];if(fr)delete S.freeB[j];else for(const k in b.mat)S.mat[k]=(S.mat[k]||0)+b.mat[k];toast(b.name+'をこわした')}/* ただで建てたもの（クエストの見張り台）は、素材がもどらない *//* 建物：素材はもどる・パワーはもどらない */
      else toast(b.name+'をとりのぞいた')}
    burst(j,'block','rm');recount();renderPalette();return}
  {const c=ty0*W+tx0;if(RFC.has(c)){const a=RFC.get(c),id=S.roof[a];delete S.roof[a];giveItem(id,1);toast(BL[id].name+'をおそなえ箱にもどした');burst(a,'furn','rm');recount();renderPalette();return}}/* 下に物がなければ、ガゼボ・東屋をはずす（ラグより先） */
  {const c=ty0*W+tx0;if(RUGC.has(c)){const a=RUGC.get(c),id=S.rug[a];delete S.rug[a];if(S.rugRot)delete S.rugRot[a];giveItem(id,1);toast(BL[id].name+'をおそなえ箱にもどした');burst(a,'furn','rm');recount();renderPalette();return}}/* 上に物がなければ、ラグをはずす */
  if(S.floor[j]){const f=S.floor[j];S.floor[j]='';giveItem(f,1);burst(j,'block','rm');recount();renderPalette()}
}
function finishBuild(j,r){
  if(TERRA.has(S.dyn[j]&&S.dyn[j].build)){const up=S.dyn[j].build==='mound';delete S.dyn[j];S.obj[j]='';S.hi[j]=up?Math.min(HMAX,(S.hi[j]|0)+1):Math.max(0,(S.hi[j]|0)-1);recount();dirty=true;burst(j,'block');if(r)addSpiritXp(2,r);return}/* けずる・もる：段差の高さをかえる */
  const d=S.dyn[j],id=d.build;if(!d.mat&&BL[id].mat&&id!=='tower')(S.freeB||(S.freeB={}))[j]=1;/* ただで建てた（素材を使わなかった） */delete S.dyn[j];S.obj[j]=id;noteQuestPlacement(id,j);setParts(id,j,'part');if(STAIRS.has(id)){const d=stairDir(j);if(d>0){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}/* 階段：低いほうのマス */if(BL[id].hp)S.hp[j]=BL[id].hp;if(BL[id].dyn)S.dyn[j]={g:0};
  recount();burst(j,'furn');if(r){addSpiritXp(4,r);r.made=(r.made||0)+1}kurashi('b:'+id,['🏠','はじめて'+BL[id].name+'が建った']);toast(BL[id].name+'が建った！','good');checkQuest();
  if(id==='statue'){S.obj[j-1]='obox';S.obj[j+1]='board';S.obj[j+W]='altar';recount();burst(j-1,'furn');burst(j+1,'furn')}
  if(id==='tower'&&!S.cleared){if(WD===1){if(shLeft()>=1)S.usedSh=(S.usedSh||0)+1;/* かけらを台座にはめる */S.finalNight=true;memo('🌑','守護の台座が建った。最後の夜がくる');setTimeout(()=>toast('守護の台座が光りはじめた…！ 今夜、オオカゲたちがおしよせてくる','warn'),900)}else{memo('🏛','守護の台座が建った');setTimeout(()=>toast('守護の台座が建った','good'),900)}finalCheck()}/* ヌシ様の前に、きびしい最後の夜 */
}
function finishCraft(o,r){
  S.orders=S.orders.filter(q=>q!==o);S.unlocked[o.type]=true;giveItem(o.type,BL[o.type].qty||1);addSpiritXp(3,r);if(r)r.made=(r.made||0)+1;kurashi('f:'+o.type,['🪑','はじめて'+BL[o.type].name+'を作った']);burstAt(r.x,r.y,'furn');
  toast(r.name+'が'+BL[o.type].name+'を作って、おそなえ箱に入れた！','good');renderPalette();if(sheet==='craft')renderSheet();
}
function rectCells(a,b){const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);const c=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)c.push([x,y]);return c}
let pending=null;
const STAMPC10={farm:32,fence:16,stone:16,path:8};/* スタンプで足りない分を買うときの値段（1こあたり、パワーの10倍の数：畑3.2・柵1.6・石1.6・あぜ道0.8） */
function stampCost(need){let c10=0;const parts=[];for(const id in need){const short=Math.max(0,need[id]-inv(id));c10+=short?short*(STAMPC10[id]==null?Infinity:STAMPC10[id]):0;/* 足りない分だけ、1こあたりの値段で買う（足りていれば0） */if(short)parts.push(BL[id].name+short+'こ')}return {cost:Math.ceil(c10/10),parts}}
function shortCost(need){let cost=0;const parts=[];for(const id in need){const short=Math.max(0,need[id]-inv(id));cost+=short*(BL[id].qty?Infinity:BL[id].cost);if(short)parts.push(BL[id].name+short+'こ')}return {cost,parts}}
function askBulk(id,cells){if(WALLD.has(id))return toast(BL[id].name+'は、ハケではぬれません');/* 窓・カーテンは、壁に1つずつかける */
  const ok=cells.filter(([x,y])=>canPlace(id,x,y,true));
  if(!ok.length){toast('置ける場所がありません');return}
  const b=BL[id];
  if(b.kind==='plant'){const n=Math.min(ok.length,inv(id),Math.max(0,10-cnt('sprout')));if(!inv(id))return toast(iname(id)+'がおそなえ箱にありません');if(!n)return toast('植える予定がいっぱいです');/* 植える予定は10か所まで（1つずつ置くときと同じ） */ok.length=n;pending={kind:'plant',id,cells:ok};$('#confirmTxt').textContent=iname(id)+'を'+n+'か所に植えてもらう';$('#cYes').disabled=false}
  else{const s=shortCost({[id]:ok.length});if(b.qty){const n=Math.min(ok.length,inv(id));if(!n)return toast(b.name+'が足りません','warn');ok.length=n;s.cost=0;s.parts=[]}
    pending={kind:'bulk',id,cells:ok,cost:s.cost,need:{[id]:ok.length}};$('#confirmTxt').textContent=b.name+' '+ok.length+'マス'+(s.parts.length?'（足りない'+s.parts.join('・')+'は'+SP(s.cost)+'で）':'（おそなえ箱から）');$('#cYes').disabled=S.pt<s.cost}
  ($('#cRot').hidden=true,$('#confirm').hidden=false);
}
function askStamp(sid,x,y){
  const st=STAMPS[sid];const lock=st.cells.map(c=>c[2]).filter(id=>!S.unlocked[id]);
  if(lock.length)return toast(BL[lock[0]].name+'が足りません','warn');
  for(const[dx,dy,id]of st.cells)if(!canPlace(id,x+dx,y+dy,true)||(!BL[id].floor&&S.obj[(y+dy)*W+x+dx]&&!WEEDS.has(S.obj[(y+dy)*W+x+dx])))return toast('ここには置けません');
  const need={};for(const c of st.cells)need[c[2]]=(need[c[2]]||0)+1;
  const s=stampCost(need);if(!isFinite(s.cost))return toast(s.parts.join('・')+'足りません','warn');
  pending={kind:'stamp',sid,x,y,cost:s.cost,need};
  $('#confirmTxt').textContent=st.name+(s.parts.length?'（足りない分は'+SP(s.cost)+'で）':'（おそなえ箱から）');$('#cYes').disabled=S.pt<s.cost;($('#cRot').hidden=true,$('#confirm').hidden=false);
}
const SWAPG=[['fence','logfence','bamboofence','wall'],['hwall','logwall','plasterwall','brickwall','yozorawall'],['path','gravel','woodpath','stone','brick'],['floor','brickfloor','stonefloor','herrfloor','carpet']],SWAPTHRU=[new Set(['gate','stonegate','logdoor','sdoor']),new Set(['door','yozoradoor']),new Set(),new Set()],SWAPNO=['柵や塀ではありません','家の壁ではありません','道ではありません','床ではありません'];/* つけかえトンカチ：柵・塀／家の壁／道／床のなかま。ドア・門はとおりぬけて、その先もつけかえる。道・床は S.floor */
const swapT=(id,k)=>BL[id].floor?S.floor[k]:S.obj[k];
function askSwap(id,x,y){const gi=SWAPG.findIndex(g=>g.includes(id)),G=SWAPG[gi],T=SWAPTHRU[gi],j0=y*W+x;
  if(!G.includes(swapT(id,j0)))return toast(SWAPNO[gi]);
  const seen=new Set([j0]),q=[j0],cells=[];while(q.length){const j=q.pop();const tj=swapT(id,j);if(tj!==id&&G.includes(tj))cells.push(j);const x0=j%W;for(const k of [x0>0?j-1:-1,x0<W-1?j+1:-1,j-W,j+W]){if(k<0||k>=W*H||seen.has(k))continue;const o=swapT(id,k);if(G.includes(o)||T.has(o)&&!T.has(tj)){seen.add(k);q.push(k)}}}/* ドア・門はとおりぬけるが、ドアどうしはつながらない */
  if(!cells.length)return toast('もう'+BL[id].name+'です');
  if(inv(id)<cells.length)return toast(BL[id].name+'が足りません（'+cells.length+'こいる）','warn');
  pending={kind:'swap',id,cells};$('#confirmTxt').textContent='つながっている'+cells.length+'マスを'+BL[id].name+'にかえる';$('#cYes').disabled=false;($('#cRot').hidden=true,$('#confirm').hidden=false)}
function confirmOne(){const p=pending;if(!p||p.kind!=='one')return;const rb=$('#cRot'),rt=ROTS[p.id];rb.hidden=!rt;const lb=rt?'（'+ROTL[rt][PLROTS[p.id]||0]+'）':'';$('#confirmTxt').textContent=p.ok?BL[p.id].name+lb+'をここに置く？':'ここには置けません'+lb;$('#cYes').disabled=!p.ok}
function rotPending(){const p=pending;if(!p||p.kind!=='one'||!ROTS[p.id])return;PLROTS[p.id]=((PLROTS[p.id]||0)+1)%ROTN(p.id);p.ok=canPlace(p.id,p.x,p.y,true);sfx('tap');confirmOne();dirty=true}/* ↻：置く前に向きをかえる */
function confirmYes(){
  if(pending&&nightLock()){pending=null;$('#confirm').hidden=true;selRect=null;return toast('夜のあいだは、置くことも、こわすこともできません')}
  if(!pending)return;const p=pending;pending=null;$('#confirm').hidden=true;selRect=null;
  if(p.kind==='one'){place(p.id,p.x,p.y);return}
  if(p.kind==='plant'){if(inv(p.id)<p.cells.length)return toast(iname(p.id)+'が足りません');S.inv[p.id]-=p.cells.length;for(const[x,y]of p.cells){const j=y*W+x;S.obj[j]='sprout';S.dyn[j]={plant:p.id,p:0,userMound:true}}
    p.cells.forEach(([x,y],i)=>{if(i<12)burstAt(x,y,'plant')});recount();toast('せいれいたちが植えにきてくれる','good');return}
  if(p.kind==='swap'){const G=SWAPG.find(g=>g.includes(p.id)),fl=!!BL[p.id].floor,L=p.cells.filter(j=>G.includes(swapT(p.id,j))&&swapT(p.id,j)!==p.id);if(inv(p.id)<L.length)return toast(BL[p.id].name+'が足りません');
    for(const j of L){giveItem(swapT(p.id,j),1);S.inv[p.id]--;if(fl)S.floor[j]=p.id;else{S.obj[j]=p.id;S.hp[j]=BL[p.id].hp}}/* 窓・カーテンは、そのまま家の壁にのこる */S.placed[p.id]=(S.placed[p.id]||0)+L.length;
    L.forEach((j,i)=>{if(i<14)burstAt(j%W,(j/W)|0,'block')});undoStack=[];recount();renderPalette();checkQuest();dirty=true;toast('つけかえた！','good');return}
  if(S.pt<p.cost)return toast('パワーが足りません');
  S.pt-=p.cost;for(const id in p.need)S.inv[id]=Math.max(0,inv(id)-p.need[id]);
  const put=(id,j)=>{if(BL[id].floor&&S.floor[j])giveItem(S.floor[j],1);setBlock(id,j)};
  const cells=[];
  if(p.kind==='bulk'){for(const[x,y]of p.cells){put(p.id,y*W+x);cells.push([x,y]);if(BL[p.id].kind==='furn'||BL[p.id].floor)noteQuestPlacement(p.id,y*W+x)}S.placed[p.id]=(S.placed[p.id]||0)+p.cells.length}
  else for(const[dx,dy,id]of STAMPS[p.sid].cells){put(id,(p.y+dy)*W+p.x+dx);cells.push([p.x+dx,p.y+dy])}
  cells.forEach(([x,y],i)=>{if(i<14)burstAt(x,y,'block')});
  undoStack=[];recount();renderPalette();checkQuest();toast('ぬりおわった！','good');
}

/* ---------- 家具の注文 ---------- */
const RLOCK=new Set(['lumber','quarry','stele','fountain','lighthouse','windmill','bed','campfire','oven','swing','lamp','bench','chair','stool']);/* 会話でひらめくまで作れない家具 */
function recipeKnown(id,s=S){const b=BL[id];if(b&&b.kwr)return !!(s.recipes||{})[id];return !!b&&(!WIND_STAGE_TOYS.has(id)||WD===4)&&(id!=='noren'||WD>=1||grec(id))/* のれんは火山のふもとから */&&(id!=='window'||!!(s.unlocked||{}).window)&&(!(b.kind==='furn'||RLOCK.has(id)||b.offerOnly)||!!(s.recipes||{})[id])}

const MANUAL=[['せいれいのようす',[['おなか','へると元気がなくなり、0になると消えてしまう。食料箱のごはんを食べる。料理はおなかがたくさんふくれる。'],['たのしさ','遊ぶ・おしゃべり・水浴びでふえる。おもちゃで遊ぶといちばんふえる。満タンになると、おそなえ箱におそなえをしてくれる。低いと疲れやすくなる。'],['つかれ','はたらくとたまる。たまると昼でもひと休みする。夜はベッドや家で眠ってなおす。'],['住み心地','家をタップすると見られる。家具・床がふえると上がる。かざりは、家の中か、家のそばにあれば入る。そのせいれいの好きな家具は、その家具のぶんのポイントが2倍になる。'],['住み心地の効果','高いほど、眠ったときのつかれのとれ方が速くなる。0.6〜3.3倍。住み心地は最大300まで上がる。180以上でぐっすり眠れて、朝にたのしさ+10。90未満だと、たのしさ-5。'],['ベッドの数','家の中の広さ4マスにつき、ベッド1つがおすすめ。それより多く置くと、きゅうくつで住み心地が大きく下がり、元気とたのしさも下がる。']]],['ステータス',[['作業スピード','仕事の速さ。'],['移動速度','歩く速さ。'],['スタミナ','疲れにくさ。'],['持てる数','一度に運べる数。'],['攻撃力','「コワイノ」とたたかう力。']]],['属性と得意なこと',[['木','収穫・畑の収穫+1・畑の世話・花や木を植える・木の家具づくり'],['水','作業の速さ1.3倍・スタミナ0.7倍・水やり・水の家具づくり'],['火','「コワイノ」とたたかう・夜の見回り・料理・火の家具づくり'],['土','作業の速さ0.75倍・スタミナ1.45倍・畑を耕す・柵を直す・土の家具づくり'],['風','歩く速さ1.45倍・たのしさ60より下で遊びに行く・ふしぎな種を拾う・風の家具づくり'],['みんな','建てる・種まき・木や石を集める・つり・おそなえ']]],['家具の種類',[['【ダイニング家具】','食卓のある家の中に置くと、その家の食卓で食べたときにもらえるパワーがふえる。'],['【料理家具】','かまどのまわり3マスにあると、料理家具の種類1つにつき、料理の時間-10%。かまどをタップすると、いまの料理の速さが見られる。'],['【あかり】','夜の見回りや、家の中を明るくするのに使う。家の中に置くあかりは、その家ぜんたいを照らす。'],['【庭の家具】','まわりにいるせいれいの、たのしさがふえる。'],['【あそび道具】','遊ぶと、たのしさがいちばんふえる。'],['【かべ・かざり】','住み心地が上がる。'],['おそなえでしか手に入らない家具','依頼ボードでは作れない家具もある。せいれいが、ごくまれにおそなえしてくれる。']]],['くらし',[['床','家の中の床のわりあいに応じて、住み心地が最大+45。床は歩く速さも上がる。'],['水浴び','夕方、水べか、水浴びできる家具で水浴びをする。できないと、たのしさが下がる。'],['あかり','家の中か、すぐそばに灯りがあると、住み心地がいい。'],['畑とたね','おそなえ箱や「おく」でたねをえらんで、畑をタップしてまく。収穫したら、また植える。'],['ベッド','ベッドをタップすると、そこで眠るせいれいをきめられる。家をタップしても、中のベッドをえらべる。'],['かまど','「みる」でかまどをタップして、作る料理をえらぶ。料理ごとに時間がちがう。']]],['守り神のちから',[['おつげ','メニューから、きょういちにちの指示を出せる。'],['依頼ボード','家具や罠をたのむ。手のあいたせいれいが作ってくれる。'],['なかまを呼ぶ','属性の力がたまった次の朝、神殿の「！」をタップ。']]],['夜と「コワイノ」',[['「コワイノ」','夜12時ごろ、南からやってくる。せいれいをねらってくる。柵や壁の中にいても、こわして入ってくる。'],['見張り台','夜、木のせいれいが上に立つと、「コワイノ」に木の矢を放つ。木の矢1本で1発。上に立っている子は、見張り台がこわれるまで攻撃されない。'],['まもりの光','守りの光のアイコンをタップしてから「コワイノ」をタップすると、パワー1を使い、光でおどかしてダメージ1をあたえる。木や岩にあてると、木材・石材が1こ落ちる。'],['直す','こわれた柵・壁・見張り台・罠は、昼に土のせいれいが素材を使って直す。'],['火事（火山のふもと）','木でできた家具・柵・壁は、ハイカゲ・ヒノオオカゲにふれたり、昼に火の粉がとんできたりすると燃える。燃えているあいだ、15分ごとにじょうぶさが1へり、0になるとこわれる。昼なら、水のせいれいが消しにいく。家の中の物には、火の粉はとどかない。'],['朝まで休む','「コワイノ」をぜんぶ追いはらった夜や、せいれいがみんな消えてしまった夜は、上の「朝まで休む」で朝までとばせる。'],['そなえ','柵・壁・見張り台・罠でまもる。家の中にいるせいれいは攻撃されない。でも、「コワイノ」は家の壁をこわそうとする。'],['おとしもの','「コワイノ」を追いはらうと、たまにおとしものをする。朝になると、せいれいが拾ってくれる。'],['やすらぎの砂','「コワイノ」のおとしものだけで手に入る、とくべつな素材。見張り台・ようがん台をLv3に強化するとき、5ついる。'],['ヌシのかけら','3つ集めて台座にはめると、ヌシ様がもどってくる。手に入れかたは土地ごとにちがう。'],['めぶきのしずく','オオカゲを追いはらうと、半分くらいの確率で落とす。せいれいのリストの「消えてしまったせいれい」から使うと、そのせいれいがもどってくる。'],['おみおくり','消えた子のお墓は、なかまが神殿へはこび、おいのりして、おみおくりする。'],['お墓','この土地に深くなじんだ「めぐりの子」は、土地とのつながりをたどり、次の朝、神殿の「！」から、レベルそのままで戻ってこられる。ほかの子は、消えると自然にかえり、同じ姿では戻れない。「めぶきのしずく」があれば別。']]]];
const boardMax=()=>S.flags.board5?5:3;
/* 依頼をやめる：パワーと素材はもどる。作っていた子は手をとめる */
function cancelOrder(oid){const k=S.orders.findIndex(q=>q.id===oid);if(k<0)return;const o=S.orders[k],b=BL[o.type];S.orders.splice(k,1);
  S.pt+=b.pc;for(const m in b.mat||{})S.mat[m]=(S.mat[m]||0)+b.mat[m];if(b.sand)S.sand=(S.sand||0)+b.sand;
  for(const r of S.res)if(r.act&&r.act.type==='craft'&&r.act.order===oid){endAct(r);r.act=null;r.path=[]}
  toast(b.name+'の依頼をやめた');sfx('post');renderSheet()}
const ORDER_LOCK={'stor':'stor','mbox':'mbox'};
const orderLock=()=>{const q=QUESTS[S.quest];return !S.cleared&&q&&ORDER_LOCK[q.id]||null};/* このクエストのあいだは、そのものしかたのめない（ほかをたのむと、材料がなくなって進めなくなる） */
function orderFurn(id){if(!recipeKnown(id))return;if(!lvOK(id))return toast('村Lv'+BL[id].lv+'から作れます');{const L=orderLock();if(L&&id!==L)return toast('いまは「'+BL[L].name+'」だけたのめます')}
  const b=BL[id];if(BOARD<0)return toast('神殿がありません');if(S.orders.length>=boardMax())return toast('依頼ボードがいっぱいです（'+boardMax()+'まい）');if(S.pt<b.pc)return toast('パワーが足りません');if(!matOK(b.mat))return toast('素材が足りません（'+matTxt(b.mat)+'）');if(b.sand&&(S.sand||0)<b.sand)return toast('やすらぎの砂が足りません（'+b.sand+'）');
  S.pt-=b.pc;for(const k in b.mat||{})S.mat[k]-=b.mat[k];if(b.sand)S.sand-=b.sand;S.orders.push({id:S.nid++,type:id,prog:0,need:b.time,worker:null});toast(b.name+'の依頼をはった');sfx('post');renderSheet();
}

/* ---------- 目標 ---------- */
/* 物語のせいれい（フタバ・ノドカ）がいないあいだは、そのクエストは進まない */
function qNeed(q){const n=new Set();if(q.talk){n.add(q.talk.who);q.talk.lines.forEach(l=>KEYRES.includes(l[0])&&n.add(l[0]))}(q.story||[]).forEach(l=>KEYRES.includes(l[0])&&n.add(l[0]));return[...n].filter(x=>KEYRES.includes(x))}
const qMissing=q=>qNeed(q).filter(n=>!S.res.some(r=>r.name===n)&&(S.buried||[]).some(b=>b.name===n));
let TALKW=null,QUESTCLEARW=null;/* 話したそうにしているせいれい／クエスト達成後のお礼 */
function resetQuestPrompts(){if(S)sevCancel(SEV_ENCOUNTERS.get(S),null,false);SEVW={};TALKW=null;QUESTCLEARW=null;SUBW={};QUEST_CLEAR_WAIT=null;SUB_CLEAR_WAIT={};PAYOK=false;ASKING=false}
function focusQuestSpeaker(w){if(!w||VW<100||VH<100)return;const r=S.res.find(q=>q.name===w&&!q.hidden);if(!r)return;const x=r.x*TS,y=(r.y-1.3)*TS,vw=VW/cam.z,vh=VH/cam.z;if(x<cam.x+48||x>cam.x+vw-48||y<cam.y+80||y>cam.y+vh-120)centerOn(r.x*TS,(r.y-1)*TS)}
/* きろく：できごとを日づけつきで残す */
function memo(e,t){if(!S)return;(S.memo||(S.memo=[])).push([dayNo(),e,t]);if(S.memo.length>200)S.memo.shift()}/* 思い出帳 */
