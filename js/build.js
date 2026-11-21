'use strict';
const LIGHTNAT={ntree:'wood',deadtree:'wood',tree:'wood',rock:'stone',bamboo:'bamboo',vcopper:'copper',viron:'iron',vobsid:'obsidian',vsilver:'silver',vgold:'gold'},NATG={ntree:30,deadtree:30,tree:30,rock:35,bamboo:30,vcopper:35,viron:35,vobsid:35,vsilver:35,vgold:35},LIGHTHIT={ntree:10,deadtree:10,tree:10,rock:12,bamboo:10,vcopper:12,viron:12,vobsid:12,vsilver:12,vgold:12},/* NATG：木・岩のゲージ（せいれいが切る・ほる秒数）。LIGHTHIT：守りの光1回でへる分。せいれいの作業と守りの光は、同じゲージをへらす */NATHIT=new Map(),DROPFX=new WeakMap();/* DROPFX：木・岩から落ちた素材が、とんで地面にころがるまでの動き（セーブしない） *//* 守り神の光をあてられる木・岩と、落ちる素材 */
const hudIc=id=>{const b=$('#'+id),im=b&&b.previousElementSibling;return im&&im.tagName==='IMG'?im:null};/* 画面の上の木材・石材のアイコン */
function natWork(a,dt){if(a.camp||!NATG[S.obj[a.obj]])return;const o=S.obj[a.obj],k='lp'+a.obj;S.hp[k]=(S.hp[k]||0)+dt*(1+(spotNear(a.obj,o==='rock'?'ishikiri':o==='bamboo'?'takeyabu':'kikori')?.1:0)+(spotNear(a.obj,'shigotoba')?.1:0));/* きこり小屋・いしきり小屋・竹やぶの小道：+10%、しごとば：+10%（ちがうスポットは、たし算で重なる） */NATHIT.set(a.obj,performance.now())}/* せいれいが木を切る・岩をほると、守りの光と同じゲージがへる */
const natDone=a=>(S.hp['lp'+a.obj]||0)>=(NATG[S.obj[a.obj]]||30);
function natLight(j){return glCast(j%W,(j/W)|0)}/* 木・岩をタップした：そのマスに光を落とす */
function natHit(j){/* まもりの光が、木・岩に当たった（glHit）：ゲージをへらし、なくなると木材・石材が1こ落ちる。のこりは、たいきゅうバーで見せる */const o=S.obj[j],k=LIGHTNAT[o],x=j%W,y=(j/W)|0,n=(S.hp['lp'+j]||0)+LIGHTHIT[o],cx=x*TS+16;delete S.hp['lt'+j];
  NATHIT.set(j,performance.now());if(n<NATG[o]){S.hp['lp'+j]=n;return}
  delete S.hp['lp'+j];fxSpr(o==='rock'||VEINS[o]?'rockbreak':'treefall',cx,y*TS+26);useNat(j);S.flags.lightBroke=1;/* サブクエスト「守り神の光で木や岩をこわそう」 */const n0=(S.drops||[]).length;dropAt(x,y,'mat:'+k,1);if(S.drops&&S.drops.length>n0){sfxAt('matDrop',x,y);const d=S.drops[S.drops.length-1];d.lt=1;DROPFX.set(d,{sx:x*TS+16,sy:y*TS+4,t0:performance.now()})}}/* 何も言わずに、木材・石材のアイコンを落とす *//* 落ちた物は、せいれいがひろう。木や岩は、せいれいが切ったときと同じようにへる */
/* 守り神の光は、はじめから木や岩にも使える。フタバの「やってみて」は、はじめての夜のあとのサブクエスト（lighttry） */
function spawnSeed(){
  for(let t=0;t<40;t++){const x=OFF+((Math.random()*OW)|0),y=OFF+((Math.random()*OW)|0),j=y*W+x;/* 前からの土地の中に落ちる */
    if(!VILL[j]&&!S.ground[j]&&!S.obj[j]&&!sacredNoBuild(j)&&!(fogAt(j))){S.seeds.push({x,y});return}}
}

/* ---------- 置く・こわす ---------- */
let undoStack=[];
const inv=id=>id.startsWith('seed:')?cseed(id.slice(5)):BL[id]&&BL[id].kind==='gear'?gearCount(id):S.inv[id]||0;
const iname=id=>id.startsWith('seed:')?CROPS[id.slice(5)].name+'のたね':STAGEN[WD]&&STAGEN[WD][id]?STAGEN[WD][id]:BL[id].item||BL[id].name;
const STAGEN={1:{tree:'とんがりの木の苗',deadtree:'とんがりの木'},4:{tree:'アカシアの苗',deadtree:'アカシア'},3:{tree:'オークの苗',deadtree:'水べの木'},5:{tree:'古いオークの苗',deadtree:'枯れたオーク'}};/* ステージでの名前（植えた木も自然の木も、火山はとんがりの木・風はアカシア。4 は WIND） */
const cseed=k=>(S.cseed||(S.cseed={}))[k]||0;
function sowFarm(d){if(d.sown!==false)return true;if(d.paid){d.paid=false;d.sown=true;d.g=0;d.ts=1;delete d.dry;dirty=true;return true}const k=cropK(d);if(cseed(k)>0){S.cseed[k]--;d.sown=true;d.g=0;d.ts=1;delete d.dry;dirty=true;return true}/* d.ts：まいてから、水が切れたか（d.dry）を見ている畑（つやつや tsuyaOf） */return false}
function giveItem(id,n,back){if(!back)gotNote(id);/* back：こわした・もどした物は「最近もらった」にしない */if(BL[id]&&BL[id].kind==='gear'){gearGive(id,n);return}/* そうびは S.gear に1つずつ */if(id.startsWith('seed:')){const k=id.slice(5);S.cseed[k]=cseed(k)+n;return}S.inv[id]=inv(id)+n}
const WIND_STAGE_TOYS=new Set(['slide','seesaw']);
function usable(id){const b=BL[id];if(id==='bridge'&&WD===WIND)return false;/* 風：木の橋はかけられない（風の道が雲の橋になる） */if(WIND_STAGE_TOYS.has(id)&&WD!==4&&inv(id)<=0)return false;/* もらって持っている物は、どのステージでも置ける */
  if(b.kind==='block')return !!S.unlocked[id]||inv(id)>0;
  if(b.kind==='furn')return inv(id)>0;
  if(b.kind==='plant')return !!S.feat.plant;
  if(b.kind==='seed')return true;
  if(b.kind==='build'){if(id==='tower'&&WD===0)return false;if(id==='statue')return RUINT<0&&!cnt('statue')&&!statueSite();/* 神殿は、はじめからある古い神殿を直す（templeRuinTap）。こわれた神殿を置けなかった古いセーブだけ、建てる */return !noTemple()&&lvOK(id)&&(id!=='tower'||!!S.flags.shrine&&!cnt('tower')&&!statueSite('tower'))/* 守護の台座は1つだけ */&&(id!=='well'||wellOK())&&(!BREQ[id]||elemCount(BREQ[id])>0)}
  return false}
/* 井戸は「水のせいれいをむかえよう」のあとに思いつく */
function wellOK(){const qi=QUESTS.findIndex(q=>q.id==='water');return qi<0||!!S.flags.wellR||S.quest>qi+1||(S.quest===qi+1&&S.qStory==null)}
function statueSite(id='statue'){for(const k in S.dyn)if(S.obj[k]==='site'&&S.dyn[k].build===id)return true;return false}/* 建てている途中の物があるか */
const BADC={k:'',t:0,L:[]},WBHINT={k:'',t:0,L:[]};/* 作業台をえらんでいるときの、箱のとなりのマス */
const RUGS=new Set(['rug1','rug2','hoshirug']);/* ラグは、床の上の層（S.rug：左上のマス→ラグ）。たて2・よこ2マス。上に家具を置ける */
const EDGES=new Set(['bedge']);/* 花壇のふちは、床の上の層（S.edge：マス→id）。花・雑草が生えていても置け、つながる */
function canEdge(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x>=W||y>=H)return false;const j=y*W+x;if(sacredNoBuild(j))return no('みんなで世話をしている木の場所です');if(S.ground[j]===1)return no(skyJ(j)?'雲の上には置けません':'水の上には置けません');if(S.ground[j]===2)return no('浅瀬には置けません');if(S.edge&&S.edge[j])return no('ここにはもうふちがあります');const o=S.obj[j];if(o&&!WEEDS.has(o)&&!FLOWERS.has(o))return no('ここにはもう何かあります');return true}
const rugCells=a=>[a,a+1,a+W,a+W+1];
const lowRoof=id=>{if(LOWROOF.has(id))return true;const b=BL[id];if(!b||CANOPY.has(id)||b.kind!=='furn'&&b.kind!=='plant')return false;const c=CHIPS[id]||CHIPS[id+'#0'];return !!c&&-(c.ay||0)*64/(c.g||32)<=24};/* 屋根の下に置ける、高さ1マスの物：絵がマスの上へ24ドット（g64）までしかはみ出さない物 */
const CANOPY=new Set(['gazebo','azumaya']),LOWROOF=new Set(['chair','stool','achair','pouf','kagoisu','sofa1','bench','takebench','table','dtable','ltable','clover','bellf','salvia','lily','tanpopo','ayame','tsukimi']);/* ガゼボ・東屋は、物の上にかぶせる層（S.roof：左上のマス→id）。たて2・よこ2マス。下に置けるのは、ひくい物だけ（ラグはべつの層なので、いつでも） */
function canRoof(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x+1>=W||y+1>=H)return false;{const h0=hiAt(y*W+x);if(hiAt(y*W+x+1)!==h0||hiAt(y*W+W+x)!==h0||hiAt(y*W+W+x+1)!==h0)return no('段差をまたいでは置けません')}
  if(x<0||y<0||x>=W-1||y>=H-1)return no('ここには置けません');for(const c of rugCells(y*W+x)){if(sacredNoBuild(c))return no('みんなで世話をしている木の場所です');if(S.ground[c]===1)return no(skyJ(c)?'雲の上には置けません':'水の上には置けません');if(RFC.has(c))return no('ここにはもう屋根があります');const o=S.obj[c],a=o==='part'?S.obj[S.ref[c]]:o;if(a&&!lowRoof(a)&&!WEEDS.has(a))return no('下には、ひくい物だけ置けます')}return true}
const rugsIn=set=>{const L=[];for(const k in S.rug||{})if(rugCells(+k).some(c=>set.has(c)))L.push(S.rug[k]);return L};/* 家の中（どこか1マスでも）にあるラグ */
function canRug(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x+1>=W||y+1>=H)return false;{const C=rugCells(y*W+x),h0=hiAt(C[0]);if(C.some(c=>hiAt(c)!==h0))return no('段差をまたいでは置けません')}/* 屋根と同じく、ラグも段差をまたがない */
  if(x<0||y<0||x>=W-1||y>=H-1)return no('ここには置けません');for(const c of rugCells(y*W+x)){if(sacredNoBuild(c))return no('みんなで世話をしている木の場所です');if(S.ground[c]===1)return no(skyJ(c)?'雲の上には置けません':'水の上には置けません');if(RUGC.has(c))return no('ここにはもうラグがあります');const o=S.obj[c],a=o==='part'?S.obj[S.ref[c]]:o;if(a&&!WEEDS.has(a)&&!(BL[a]&&BL[a].kind==='furn'&&!BL[a].trap&&!WALLD.has(a)))return no('ここにはもう何かあります')}return true}/* 家具の下にもしける */
function canPlace(id,x,y,quiet){if(typeof fogBlock==='function'&&fogBlock(id,x,y,quiet))return false;/* 霧の中には置けない */if(WD===YAMI&&typeof yamiNoBuild==='function'&&yamiNoBuild(id,x,y,quiet))return false;/* 闇のステージ：ゆりかごと、あけよい草（yami.js） */if(WD===0&&id!=='tower'&&S.sacredRoot!=null){const z=szR(id,PLROTS[id]||0)||[1,1];for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)if(sacredNoBuild((y+b)*W+x+a,id)){if(!quiet)toast('みんなで世話をしている木の場所です','warn');return false;}}
  if(EDGES.has(id))return canEdge(x,y,quiet);
  if(RUGS.has(id))return canRug(x,y,quiet);
  if(CANOPY.has(id))return canRoof(x,y,quiet);
  if(id==='watch'&&watchNear(x,y)){if(!quiet)toast('見張り台は、5マスはなさないと置けません','warn');return false}
  if(id==='statue'&&!(canPlace('fence',x-1,y,quiet)&&canPlace('fence',x+1,y,quiet)&&canPlace('fence',x,y+1,quiet)))return false;
  if(BL[id].sz){const F=fp(id,x,y);for(const[a,b]of F)if(!canPlace1(id,a,b,quiet))return false;if(F.some(([a,b])=>hiAt(b*W+a)!==hiAt(F[0][1]*W+F[0][0]))){if(!quiet)toast('段差をまたいでは置けません');return false}return true}
  return canPlace1(id,x,y,quiet);
}
const WATCHGAP=5;function watchNear(x,y){/* 見張り台（建てている途中の物も）と、あいだが5マスより少ないか。2×2どうし、たて・よこ・ななめで数える */for(let k=0;k<S.obj.length;k++){if(S.obj[k]!=='watch'&&!(S.obj[k]==='site'&&S.dyn[k]&&S.dyn[k].build==='watch'))continue;const ax=k%W,ay=(k/W)|0,gx=Math.max(x-(ax+2),ax-(x+2)),gy=Math.max(y-(ay+2),ay-(y+2));if(Math.max(gx,gy)<WATCHGAP)return true}return false}
const starterGapCells=s=>s.flags.home2?[CX-5,CX-6,CX-7].map(x=>(CY-3)*W+x):[CX-3,CX-4,CX-5].map(x=>(CY-2)*W+x);/* 草原のはじめの家の、壁のすきま（家の右から。前のセーブは、前の家の所 home2 なし） */
function starterGap(j){if(WD!==0||!S||S.free||S.obj[j]||qDone('wall'))return false;return starterGapCells(S).includes(j)}/* 草原のはじめの家の、壁のすきま（壁のクエストで直す所） */
function canPlace1(id,x,y,quiet){
  if(x<0||y<0||x>=W||y>=H)return false;
  if(starterGap(y*W+x)&&!HOME_WALLS.has(id)&&!HOME_DOORS.has(id)){if(!quiet)toast('ここは家の壁のすきまです','warn');return false}/* 箱や神殿を置くと、こわせずに家が直せなくなる */
  if(WALLD.has(id)){const j=y*W+x,iw=k=>HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k)),wreath=id==='wreath',target=HOME_WALLS.has(S.obj[j])&&S.obj[j]!=='wall'||wreath&&HOME_DOORS.has(S.obj[j]);/* 石の塀にはかけられない */if(!target||wreath&&HOME_DOORS.has(S.obj[j])&&(iw(j-W)||iw(j+W))&&!(iw(j-1)||iw(j+1))||!wreath&&(iw(j-W)||iw(j+W))||(S.win&&S.win[j]&&!((id==='curtain1'||id==='curtain2')&&S.win[j]===1))||((id==='curtain1'||id==='curtain2')&&!(S.win&&S.win[j]===1&&HOUSES.some(h=>h.set.has(j)&&h.inside.has(j+W)&&!h.inside.has(j-W))))){if(!quiet)toast((id==='curtain1'||id==='curtain2')?'カーテンは、家の上がわの窓にだけかけられます':wreath?'リースは、壁か横向きのドアにだけかけられます':BL[id].name+'は、横向きの家の壁にだけかけられます');return false}return true}/* 窓は壁にはめる */
  const j=y*W+x;if(typeof mzPlaceCheck==='function'){const v=mzPlaceCheck(id,j,quiet);if(v!=null)return v}/* 水のステージ：水路・船着き場・いかだ乗り場 */if(id==='yudekago'){if(!hotW(j)){if(!quiet)toast('ゆでかごは、あたたかい温泉の水の上にだけ置けます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}if(![j-1,j+1,j-W,j+W].some(k=>k>=0&&k<W*H&&Math.abs(k%W-x)<=1&&S.ground[k]!==1&&walk(k))){if(!quiet)toast('岸のすぐそばの水に置いてください');return false}return true}/* ゆでかご：温泉の水のマス。となりの岸から、せいれいが使う */
  if(id==='lotus'){if(!waterJ(j)){if(!quiet)toast('ハスは池の上にだけ植えられます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(id==='bridge'){if(S.ground[j]!==1){if(!quiet)toast(WD===WIND?'橋は水か雲の上にだけかけられます':'橋は水の上にだけかけられます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(S.ground[j]===1){if(!quiet)toast(skyJ(j)?'雲の上には置けません':'水の上には置けません');return false}
  if(S.ground[j]===2){if(!quiet)toast('浅瀬には置けません');return false}
  if(id==='suisha'&&![j-1,j+1,j-W,j+W].some(n=>n>=0&&n<W*H&&waterJ(n)&&(n%W===x||((n/W)|0)===y))){if(!quiet)toast('水車は、水のとなりにだけ建てられます');return false}
  if(TERRA.has(id)){const k=id==='dig';if(k?!hiAt(j):hiAt(j)>=HMAX){if(!quiet)toast(k?'高いマスだけ、けずれます':'これより高くは、もれません');return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])||S.floor[j]){if(!quiet)toast('なにもない所だけです');return false}if([j-1,j+1,j-W,j+W].some(n=>STAIRS.has(S.obj[n])&&stairTop(n,stairDir(n))===j)){if(!quiet)toast(k?'階段のうしろは、けずれません':'階段のうしろは、もれません');return false}return true}/* だんさスコップ：けずる・もる */
  if(LADDERS.has(id)){if(ladderDir(j)<0){if(!quiet)toast('ハシゴは、がけの下の、うしろか左右が1だん高い所に置けます');return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(STAIRS.has(id)){const d=SROT[stairRot(id,j)];if(!stairOK(j,d)){if(!quiet)toast('その向きには置けません');return false}if(d){const o=stairOut(j,d);if(S.obj[o]&&!WEEDS.has(S.obj[o])||o<0||o>=W*H){if(!quiet)toast('階段は2マスいります');return false}}}/* 階段は、段差の下の低い地面に1×2 */
  if(BL[id].floor)return S.floor[j]!==id&&!(S.obj[j]&&BL[S.obj[j]].job);
  if(S.obj[j]&&!WEEDS.has(S.obj[j])){if(!quiet)toast('ここにはもう何かあります');return false}/* 雑草の上には、そのまま置ける（置いた物が上書きする） */
  if(RFC.has(j)&&!lowRoof(id)){if(!quiet)toast('屋根の下には、ひくい物だけ置けます');return false}
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
  for(let j=0;j<S.obj.length;j++){if(S.obj[j]!=='swing')continue;const x=j%W;if(x<W-1&&ok(j+1)){S.obj[j+1]='part';S.ref[j+1]=j}else if(x>0&&ok(j-1)){S.obj[j-1]='swing';S.obj[j]='part';S.ref[j]=j-1;if(S.rot&&S.rot[j]!=null){S.rot[j-1]=S.rot[j];delete S.rot[j]}}else{clearObj(j);giveItem('swing',1,1);back++}}
  if(back)setTimeout(()=>toast('ブランコが2マスはばになったので、ひろげられないブランコを'+back+'つ、もちものにもどした'),1500)}
function setParts(id,j,kind){const x=j%W,y=(j/W)|0;for(const[a,b]of fp(id,x,y)){const k=b*W+a;if(k===j)continue;S.obj[k]=kind;S.ref[k]=j}}
/* 植える芽は、せいれいが歩いて行ける所だけ。池・川の上は、行ける岸から水の中をおよいでとどく所ならどこでも（plantWet：岸につながる水。せいれいの道 spirit-work.js の plant の wade と同じ決まり）。行けない所に置くと、植える予定の10この枠がうまったままになる */
function plantDist(){const r=S.res.find(q=>!q.hidden)||S.res[0];return r?bfs(r.x|0,r.y|0).dist:null}
function plantWet(D){if(D._wet)return D._wet;const M=D._wet=new Uint8Array(W*H),Q=[],sw=k=>waterJ(k)&&!solidOf(k);
  for(let j=0;j<W*H;j++){if(!sw(j))continue;const x=j%W;if([1,-1,W,-W].some(d=>{const k=j+d;return k>=0&&k<W*H&&Math.abs(k%W-x)<=1&&S.ground[k]!==1&&walk(k)&&D[k]>=0})){M[j]=1;Q.push(j)}}/* 行ける岸のとなりの水 */
  for(let h=0;h<Q.length;h++){const j=Q[h],x=j%W;for(const d of[1,-1,W,-W]){const k=j+d;if(k<0||k>=W*H||Math.abs(k%W-x)>1||M[k]||!sw(k))continue;M[k]=1;Q.push(k)}}/* そこから水の中をおよいで */
  return M}
const plantReach=(D,j)=>!D||D[j]>=0||[1,-1,W,-W].some(d=>{const k=j+d;return k>=0&&k<W*H&&Math.abs(k%W-j%W)<=1&&D[k]>=0})||S.ground[j]===1&&!!plantWet(D)[j];
function place(id,x,y){
  const b=BL[id];
  if(WALLD.has(id)){if(!usable(id)||inv(id)<=0)return toast(BL[id].name+'が足りません','warn');if(!canPlace(id,x,y))return;const j=y*W+x;S.inv[id]--;/* カーテンは、上がわの壁の窓にかける。窓はそのまま（S.win がカーテンなら、その下に窓がある） */(S.win||(S.win={}))[j]=id==='window'?1:id;noteQuestPlacement(HOME_DOORS.has(S.obj[j])?'door':'hwall',j);burst(j,'furn');recount();if(BOXCAP[id])boxUnstash(j,id);dirty=true;renderPalette();return}
  if(b.kind==='seed'){const k=id.slice(5),j=y*W+x,d=S.dyn[j];if(S.obj[j]!=='farm'||!d)return toast('たねは、畑にしかまけません');
    if(d.crop&&d.sown!==false)return toast('もう'+CROPS[d.crop].name+'が植えてある');if(cseed(k)<1)return toast('たねがありません');
    if(d.paid&&d.crop)S.cseed[d.crop]=cseed(d.crop)+1;S.cseed[k]--;d.paid=true;/* たねは、えらんだときに減る */d.crop=k;d.sown=false;if(k==='imo'&&WD===0&&!S.free&&!qDone('imoseed')){const plots=imoSeedQuestPlots();if(!plots.includes(j))plots.push(j)}/* 話を聞く前にまいた分も、数に入れる */noteQuestPlacement('farm',j);burst(j,'plant','pat');toast(CROPS[k].name+'のたねをまいた');checkQuest();renderPalette();return}/* せいれいが、たねをまく */
  if(id==='tower'&&!towerReady())return openSheet('clear');/* 条件がそろうまで、台座は建てられない */
  if(!usable(id)){if(b.kind==='furn'){toast(b.name+'が足りません','warn')}/* 足りないときは、知らせるだけ（画面は開かない） */else toast('まだつかえません');return}
  if(!canPlace(id,x,y))return;
  if(id==='bridge'){/* 橋：タップした水のマスから、向こう岸まで、まっすぐかける（よこ・たての短いほう）。パワー・素材は、マスの数ぶん */
    const L=bridgeSpan(x,y);if(!L)return toast('向こう岸が見つかりません');const n=L.length,pc=b.pc*n,bm={};for(const k in b.mat)bm[k]=b.mat[k]*n;
    if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');
    S.pt-=pc;rsvAdd(bm);/* 素材は、とっておく（せいれいが箱から運ぶ） */for(const q of L){S.obj[q]='site';S.dyn[q]={build:'bridge',p:0,need:b.time,mat:Object.assign({},b.mat),got:{}}}undoStack.push({j:L[0],id,pc,mat:bm,span:L});
    toast('せいれいが'+b.name+'を'+n+'マスかけにきてくれる');S.placed[id]=(S.placed[id]||0)+1;if(S.placed[id]===1&&typeof juiceFirst==='function')juiceFirst(L[0],id);recount();burst(L[0],'furn');renderPalette();checkQuest();return}
  const j=y*W+x;
  if(b.kind==='plant'||b.kind==='build'){
    if(b.kind==='plant'&&inv(id)<=0){toast(iname(id)+'がおそなえ箱にありません');return}
    const free=id==='watch'&&watchQ(),pc=free?0:b.pc,bm=id==='tower'?TOWER_MAT():free?null:b.mat;/* 台座は木材・石材を使う（取り消すともどる） *//* 建物はパワーと素材を使う */
    if(b.kind==='build'&&S.pt<pc)return toast('パワーが足りません（'+SP(b.pc)+'）');
    if(b.kind==='build'&&!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');
    if(b.kind==='plant'&&cnt('sprout')>=10)return toast('植える予定がいっぱいです');
    if(b.kind==='plant'&&!plantReach(plantDist(),j))return toast('せいれいが行けない場所です','warn');
    if(b.kind==='build'&&!TERRA.has(id)&&S.obj.reduce((n,o,k)=>n+(o==='site'&&!(S.dyn[k]&&S.dyn[k].bp!=null)?1:0),0)>=3)return toast('建てる予定がいっぱいです');
    if(b.kind==='plant'){S.inv[id]--;S.obj[j]='sprout';S.dyn[j]={plant:id,p:0,userMound:true};undoStack.push({j,id,seed:1})}
    else{S.pt-=pc;rsvAdd(bm);/* 素材は、とっておく（せいれいが箱から運ぶ） */S.obj[j]='site';S.dyn[j]={build:id,p:0,need:b.time,mat:bm?Object.assign({},bm):undefined,got:{}};undoStack.push({j,id,pc,mat:bm});
      if(LADDERS.has(id))(S.rot||(S.rot={}))[j]=ladderDir(j);/* ハシゴの向き */
      else if(STAIRS.has(id)){const v=stairRot(id,j),d=SROT[v];(S.rot||(S.rot={}))[j]=v;if(d){const o=stairOut(j,d);S.obj[o]='site2';S.ref[o]=j}}/* 階段：向きをきめて、低いほうのマスも足場に */
      else if(id==='statue'){for(const k of[j-1,j+1,j+2,j+W]){S.obj[k]='site2';S.ref[k]=j}}else setParts(id,j,'site2')}/* 足場のどのマスからでも、まわりから作業できる */
    toast(b.kind==='plant'?'せいれいが植えにきてくれる':'せいれいが'+b.name+'を建てにきてくれる');
  }else{
    if(inv(id)<=0){toast(b.name+'が足りません','warn');return}/* 足りないときは、知らせるだけ（おそなえ箱は開かない） */
    const prevFloor=b.floor?S.floor[j]:'';undoStack.push({j,prevFloor,id});
    if(ROTS[id]){const R=S.rot||(S.rot={}),v=PLROTS[id]||0;if(v)R[j]=v;else delete R[j]}/* 置くときにえらんだ向き（大きさの計算より先に） */
    S.inv[id]--;if(prevFloor)giveItem(prevFloor,1,1);
    if(CANOPY.has(id)||RUGS.has(id))for(const c of rugCells(j))if(WEEDS.has(S.obj[c]))S.obj[c]='';/* ラグ・屋根の下の雑草は、なくなる */
    if(CANOPY.has(id)){(S.roof||(S.roof={}))[j]=id;/* S.rot は下にある物の向き：けさない */undoStack[undoStack.length-1].roof=1}
    else if(EDGES.has(id)){(S.edge||(S.edge={}))[j]=id;if(WEEDS.has(S.obj[j]))S.obj[j]='';undoStack[undoStack.length-1].edge=1}/* 花壇のふち：花があっても同じマスに置ける */
    else if(RUGS.has(id)){(S.rug||(S.rug={}))[j]=id;const RR=S.rugRot||(S.rugRot={});if(PLROTS[id])RR[j]=PLROTS[id];else delete RR[j];undoStack[undoStack.length-1].rug=1}/* ラグは床の上の層にしく */
    else setBlock(id,j)
  }
  if(undoStack.length>30)undoStack.shift();
  if(typeof fieldBuildNote==='function')fieldBuildNote(id,j);/* 御神木の調べのために作った物 */
  S.placed[id]=(S.placed[id]||0)+1;if(S.placed[id]===1&&typeof juiceFirst==='function')juiceFirst(j,id);/* はじめて置いた家具：シール（juice3.js） */recount();if(BOXCAP[id]&&S.obj[j]===id)boxUnstash(j,id);/* 前にこわした同じ家具の中身を、この箱へ */if(S.obj[j]===id||S.floor[j]===id||RUGS.has(id)&&S.rug&&S.rug[j]===id||EDGES.has(id)&&S.edge&&S.edge[j]===id||CANOPY.has(id)&&S.roof&&S.roof[j]===id)noteQuestPlacement(id,j);burst(j,b.kind==='block'?'block':b.kind==='plant'?'plant':'furn',b.kind==='furn'?'furnPlace':b.kind==='plant'?'pat':null);if(SEATS.includes(id)&&spotW(j)>=0)addFloat(j%W+.5,(j/W|0)-.3,'つりスポット！');renderPalette();checkQuest();
  if(id==='door'||id==='yozoradoor'){const w=houseWhy(j);if(w)setTimeout(()=>toast(w,'warn'),400);else if(HOUSES.some(h=>h.set.has(j))){omo('house');setTimeout(()=>toast('家ができた！','good'),400)}}/* ドアを置いたら、家になったかを知らせる */
}
function undo(){
  const u=undoStack.pop();if(!u)return toast('もどせるものがありません');
  const o=S.obj[u.j];
  if(u.seed){if(o==='sprout'){clearObj(u.j);giveItem(u.id,1,1)}else return toast('もう手をつけているので、もどせません')}
  else if(u.span){if(!u.span.every(q=>S.obj[q]==='site'&&!((S.dyn[q]||{}).p>0)))return toast('もう手をつけているので、もどせません');for(const q of u.span){siteRefund(S.dyn[q]||{},q);clearObj(q)}S.pt+=u.pc}/* 橋はまとめてもどす */
  else if(u.pc!=null){if(o==='site'){if(u.id==='statue')return toast('神殿はもどせません');siteRefund(S.dyn[u.j]||{},u.j);clearObj(u.j);S.pt+=u.pc}else return toast('もう手をつけているので、もどせません')}
  else if(BL[u.id].floor){if(S.floor[u.j]!==u.id)return toast('もうもどせません');/* とりのぞいたあとの床は、もどさない（ふえてしまう） */S.floor[u.j]=u.prevFloor;if(u.prevFloor)S.inv[u.prevFloor]=Math.max(0,inv(u.prevFloor)-1);giveItem(u.id,1,1)}
  else if(u.roof){if(!(S.roof&&S.roof[u.j]===u.id))return toast('もうもどせません');delete S.roof[u.j];giveItem(u.id,1,1)}/* ガゼボ・東屋 */
  else if(u.edge){if(!(S.edge&&S.edge[u.j]===u.id))return toast('もうもどせません');delete S.edge[u.j];giveItem(u.id,1,1)}
  else if(u.rug){if(!(S.rug&&S.rug[u.j]===u.id))return toast('もうもどせません');delete S.rug[u.j];if(S.rugRot)delete S.rugRot[u.j];giveItem(u.id,1,1)}/* ラグ */
  else{if(o!==u.id&&!(u.id==='farm'&&o==='plot'))return toast('もうもどせません');if(BOXCAP[o])boxStash(u.j,o);/* しまう家具の中身は、散らさない */clearObj(u.j);giveItem(u.id,1,1)}
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
  for(const[j,id,rt]of old){const x=j%W,y=(j/W)|0,a=[[x,y],[x-1,y],[x,y-1],[x-1,y-1]].find(([ax,ay])=>canRug(ax,ay,true));if(!a){giveItem(id,1,1);back++;continue}const k=a[1]*W+a[0];S.rug[k]=id;if(rt)S.rugRot[k]=rt;for(const c of rugCells(k))RUGC.set(c,k)}
  if(back)setTimeout(()=>toast('ラグが大きくなったので、しけないラグを'+back+'つ、もちものにもどした'),1500)}
function clearObj(j){j=anc(j);const o=S.obj[j];if(S.bedOwn)delete S.bedOwn[j];/* ベッドをどけたら、だれのベッドかも消す */if(S.wpOwn)delete S.wpOwn[j];/* 見張り台も */if(S.useOwn)delete S.useOwn[j];/* いす・遊び家具なども */if(S.jobOwn)delete S.jobOwn[j];/* しごと場の担当も */const tl=o&&BL[o]&&BL[o].sz?fp(o,j%W,(j/W)|0).map(([a,b])=>b*W+a):[j];delete S.hp['L'+j];if(S.win&&S.win[j]){const p=S.win[j],wid='window';giveItem(p===1?wid:p,1,1);if(p==='curtain1'||p==='curtain2')giveItem(wid,1,1);delete S.win[j]}/* カーテンの下の窓ももどす */if(S.rot)delete S.rot[j];for(const k in S.ref)if(S.ref[k]===j){S.obj[k]='';delete S.ref[k]}S.obj[j]='';delete S.dyn[j];delete S.hp[j];delete S.hp['L'+j];
  for(const r of S.res)if(r.act&&r.act.obj===j)endAct(r);return o}
const CELLSTATE=['prQ','prIn','prOut','prW','smQ','smIn','cmpQ','ovenSet'];/* マスごとにしまう、家具の予定・中身 */
function moveCellState(a,j){/* ひっこしミトンでうつした家具の、予定・入れた物・できた物・進みぐあい・運んでいるとちゅうの行き先を、うつした先へ */
  for(const f of CELLSTATE){const Q=S[f];if(Q&&Q[a]!=null){Q[j]=Q[a];delete Q[a]}}
  for(const r of S.res){for(const k of['ppk','spk','cpk'])if(r[k]&&r[k].j===a)r[k].j=j;const A=r.act;if(A){if(A.sj===a)A.sj=j;if(A.cj===a)A.cj=j}}}
let MOVESRC=null;/* ひっこしミトン：えらんだ物 {k:'obj'|'rug'|'roof',j} */
const NOMOVE=new Set(['kaeribi','kazaana','kazaanab','oldmill','merryb','cupb','skyswingb','wheelb','statue','statueb','obox','board','altar','tower','site','site2','matyard']);/* 神殿まわり・建てている物は、うつせない */
function moveTarget(j){if(S.rug&&RUGC.has(j)&&!(S.obj[j]&&S.obj[j]!=='part'&&!WEEDS.has(S.obj[j])))return {k:'rug',j:RUGC.get(j)};const a=anc(j),o=S.obj[a];
  if(o&&BL[o]&&(BL[o].kind==='furn'||BL[o].kind==='build')&&!BL[o].natural&&!NOMOVE.has(o))return {k:'obj',j:a};if(RFC.has(j))return {k:'roof',j:RFC.get(j)};return null}
function moveName(m){return BL[m.k==='rug'?S.rug[m.j]:m.k==='roof'?S.roof[m.j]:S.obj[m.j]].name}
function writeObj(id,j,v){/* うつした物を書きこむ（向き・状態・じょうぶさもそのまま） */if(v.rot!=null)(S.rot||(S.rot={}))[j]=v.rot;S.obj[j]=id;if(STAIRS.has(id)){const d=stairDir(j);if(d>0){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}else setParts(id,j,'part');if(v.dyn)S.dyn[j]=v.dyn;if(v.hp!=null)S.hp[j]=v.hp;if(v.hpL!=null)S.hp['L'+j]=v.hpL;if(v.own!=null)(S.bedOwn||(S.bedOwn={}))[j]=v.own;if(v.wown!=null)(S.wpOwn||(S.wpOwn={}))[j]=v.wown;if(v.uown!=null)(S.useOwn||(S.useOwn={}))[j]=v.uown;if(v.jown!=null)(S.jobOwn||(S.jobOwn={}))[j]=v.jown;if(v.cd!=null)(S.trapCd||(S.trapCd={}))[j]=v.cd}
function moveTap(tx,ty){const j=ty*W+tx;
  if(!MOVESRC){const m=moveTarget(j);if(!m)return toast('うつしたい家具・建物をタップ');if(m.k==='obj'&&fireAt(m.j))return toast('燃えているあいだは、うつせません');MOVESRC=m;sfx('tplace');toast(moveName(m)+'を、どこへうつす？');dirty=true;renderPalette();return}
  const m=MOVESRC;if(m.j===j||m.k==='obj'&&anc(j)===m.j){MOVESRC=null;dirty=true;renderPalette();return toast('やめた')}/* 同じ物をタップしたら、やめる */
  if(m.k==='rug'||m.k==='roof'){const L=m.k==='rug'?S.rug:S.roof,id=L[m.j],rr=m.k==='rug'&&S.rugRot?S.rugRot[m.j]:null;delete L[m.j];if(rr!=null)delete S.rugRot[m.j];recount();
    if(!(m.k==='rug'?canRug(tx,ty,false):canRoof(tx,ty,false))){L[m.j]=id;if(rr!=null)S.rugRot[m.j]=rr;recount();return}
    L[j]=id;if(rr!=null)S.rugRot[j]=rr;for(const c of rugCells(j))if(WEEDS.has(S.obj[c]))S.obj[c]=''}
  else{const a=m.j,id=S.obj[a],cells=fp(id,a%W,(a/W)|0).map(([x,y])=>y*W+x),v={rot:S.rot?S.rot[a]:null,dyn:S.dyn[a],hp:S.hp[a],hpL:S.hp['L'+a],own:S.bedOwn?S.bedOwn[a]:null,wown:S.wpOwn?S.wpOwn[a]:null,uown:S.useOwn?S.useOwn[a]:null,jown:S.jobOwn?S.jobOwn[a]:null,cd:S.trapCd?S.trapCd[a]:null};
    if(STAIRS.has(id)){const d=stairDir(a);if(d>0)cells.push(stairOut(a,d))}
    for(const c of cells){if(c!==a&&S.obj[c]!=='part')continue;S.obj[c]='';delete S.ref[c]}if(S.rot)delete S.rot[a];delete S.dyn[a];delete S.hp[a];delete S.hp['L'+a];if(S.bedOwn)delete S.bedOwn[a];if(S.wpOwn)delete S.wpOwn[a];if(S.useOwn)delete S.useOwn[a];if(S.jobOwn)delete S.jobOwn[a];if(S.trapCd)delete S.trapCd[a];
    const pr=PLROTS[id];PLROTS[id]=v.rot||0;let ok=false;try{ok=canPlace(id,tx,ty,false)}finally{if(pr==null)delete PLROTS[id];else PLROTS[id]=pr}
    if(!ok){writeObj(id,a,v);return}
    for(const r of S.res)if(r.act&&(r.act.obj===a||cells.includes(r.act.obj)))endAct(r);
    for(const b of S.broken||[])if(b.j===a)b.j=j;if(typeof fieldBuildMove==='function')fieldBuildMove(id,a,j);/* 調べのために置いた物をうつしたら、記録もうつす */
    boxMove(a,j);/* 箱の中身も、いっしょに */moveCellState(a,j);/* 加工・炉・コンポスター・料理の家具の予定も */if(id==='wbench'){for(const o of S.orders||[])if(o.cs===a)o.cs=j}/* 作業台の依頼も */for(const q of S.ani||[])if(q.h===a){q.h=j;q.path=null;q.go=null;if(q.in){q.x+=j%W-a%W;q.y+=((j/W)|0)-((a/W)|0)}else{const f=id==='barn'?j+2*W:j+W;q.x=f%W+.5;q.y=((f/W)|0)+.6}}/* 飼う生き物の小屋も（外にいる生き物は、新しい小屋の前へ） */writeObj(id,j,v)}
  MOVESRC=null;recount();dirty=true;burst(j,'furn','furnPlace');renderPalette();checkQuest()}
function removeAt(x,y){const tx0=x,ty0=y;
  const j=anc(y*W+x),o=S.obj[j];x=j%W;y=(j/W)|0;
  if(typeof mzRemove==='function'&&mzRemove(j))return;/* 水のステージ：水路をうめる・水門はこわせない */
  if(S.win&&S.win[j]){const id=S.win[j]===1?'window':S.win[j];if(BOXCAP[id])boxStash(j,id);/* 中身は散らさない */if(id==='curtain1'||id==='curtain2')S.win[j]=1;else delete S.win[j];giveItem(id,1,1);/* カーテンをはずすと、窓がのこる */toast(BL[id].name+'をもちものにもどした');burst(j,'furn','rm');recount();renderPalette();return}
  if(o){const b=BL[o];if(o==='grave'){const d=S.dyn[j];if(d&&!d.buried&&d.name)for(const L of[S.buried||[],S.lost||[]])for(const q of L)if(q.name===d.name)delete q.unb}/* おみおくりの前のお墓をこわしたら、おみおくりがすんだことにする（unb がのこると、その子を二度と呼びもどせない） */if(o==='tower')return toast(storyTreeName()+'はこわせません');if(o==='kazaana'||o==='kazaanab'||o==='oldmill'||o==='site'&&S.dyn[j]&&S.dyn[j].hole)return toast((o==='oldmill'?'古い風車':'風穴')+'はこわせません');if(RIDEB[o]||o==='site'&&S.dyn[j]&&S.dyn[j].wfix)return toast('こわれた遊具は、こわせません');if(o==='volcano'||o==='heatv'||o==='kaeribi'||o==='crack'||o==='boulder'||o==='fogbox'||o==='nushiprint'||o==='fogspring'||typeof KDIDS!=='undefined'&&KDIDS.has(o))return toast(b.name+'はこわせません');if(S.free&&(o==='obox'||o==='board'))return toast(BL[o].name+'はこわせません');if(o==='statue'||o==='statueb'||o==='obox'||o==='board'||o==='altar'||o==='site2')return toast('神殿はこわせません');if((o==='stor'||o==='mbox')&&cnt(o)<=1&&!(WD===0&&!S.free&&!qDone('wall')&&y===CY-2&&x>=CX-5&&x<=CX-3))return toast(BL[o].name+'は、1つはいります');
    if(o==='matyard')return toast('材料置き場は、作りおわるとかたづきます');
    if(o==='site'){const d=S.dyn[j];if(d.build==='statue')return toast('神殿はこわせません');if(d.bp!=null&&typeof bpOfSite==='function'){const e=bpOfSite(j);if(e)return bpCancel(e)}siteRefund(d,j);clearObj(j);toast('建てるのをやめた')}/* 素材はもどる・パワーはもどらない */
    else if(o==='sprout'){const d=S.dyn[j];clearObj(j);giveItem(d.plant,1,1);toast('植えるのをやめた')}
    else{if(BOXCAP[o])boxStash(j,o);/* しまう家具：中身は散らさず、つぎに置いた同じ家具へ */clearObj(j);
      if(b.natural){toast(b.name+'をかたづけた')}
      else if(FLOWERS.has(o)||o==='tree'||o==='fruit'){giveItem(o,1,1);toast(iname(o)+'をもらった')}/* 花・木をこわすと、種・苗がもどる */
      else if(o==='plot'||o==='farm'){giveItem('farm',1,1);toast('畑をもちものにもどした')}
      else if(b.kind==='block'||b.kind==='furn'){giveItem(o,1,1);toast(b.name+'をもちものにもどした')}
      else if(b.kind==='build'&&b.mat){if(S.freeB)delete S.freeB[j];for(const k in b.mat)S.mat[k]=(S.mat[k]||0)+b.mat[k];toast(b.name+'をこわした')}/* 建物：素材はもどる・パワーはもどらない（カミサマにもらった見張り台も、素材がもどる） */
      else toast(b.name+'をとりのぞいた')}
    burst(j,'block','rm');recount();renderPalette();return}
  {const c=ty0*W+tx0;if(RFC.has(c)){const a=RFC.get(c),id=S.roof[a];delete S.roof[a];giveItem(id,1,1);toast(BL[id].name+'をもちものにもどした');burst(a,'furn','rm');recount();renderPalette();return}}/* 下に物がなければ、ガゼボ・東屋をはずす（ラグより先） */
  {const c=ty0*W+tx0;if(RUGC.has(c)){const a=RUGC.get(c),id=S.rug[a];delete S.rug[a];if(S.rugRot)delete S.rugRot[a];giveItem(id,1,1);toast(BL[id].name+'をもちものにもどした');burst(a,'furn','rm');recount();renderPalette();return}}/* 上に物がなければ、ラグをはずす */
  if(S.edge&&S.edge[j]){const id=S.edge[j];delete S.edge[j];giveItem(id,1,1);toast(BL[id].name+'をもちものにもどした');burst(j,'block','rm');recount();renderPalette();return}/* 花などをとりのぞいたあと、もう1回で、ふちをはずす */
  if(S.floor[j]){const f=S.floor[j];S.floor[j]='';giveItem(f,1,1);burst(j,'block','rm');recount();renderPalette()}
}
function finishBuild(j,r){
  if(S.dyn[j]&&S.dyn[j].bp!=null&&typeof bpFinish==='function')return bpFinish(j,r);/* 家の設計図の部品 */
  if(S.dyn[j]&&S.dyn[j].build==='canal')return mzCanalDone(j,r);/* 水路をほりおえた */
  if(TERRA.has(S.dyn[j]&&S.dyn[j].build)){const up=S.dyn[j].build==='mound';delete S.dyn[j];S.obj[j]='';S.hi[j]=up?Math.min(HMAX,(S.hi[j]|0)+1):Math.max(0,(S.hi[j]|0)-1);recount();dirty=true;burst(j,'block');if(r)addSpiritXp(2,r);return}/* けずる・もる：段差の高さをかえる */
  const d=S.dyn[j],id=d.build,fix=!!d.ruin;/* こわれた神殿を直した */if(d.hole){delete S.dyn[j];S.obj[j]='kazaana';recount();burst(j,'furn');sfx('level');if(r)addSpiritXp(4,r);toast('風穴がひらいた！ 風がふき出した','good');memo('leaf','風穴がひらいて、風がふき出した');checkQuest();return}/* 風穴の石をどけた（wind.js） */if(d.wfix){windFixDone(j,d,r);return}/* こわれた遊具を直した */if(!d.mat&&BL[id].mat&&id!=='tower')(S.freeB||(S.freeB={}))[j]=1;/* ただで建てた（素材を使わなかった） */delete S.dyn[j];S.obj[j]=id;noteQuestPlacement(id,j);setParts(id,j,'part');if(STAIRS.has(id)){const d=stairDir(j);if(d>0){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}/* 階段：低いほうのマス */if(BL[id].hp)S.hp[j]=BL[id].hp;if(BL[id].dyn)S.dyn[j]={g:0};
  recount();burst(j,'furn');if(r){addSpiritXp(4,r);r.made=(r.made||0)+1}if(fix)toast(BL[id].name+'が直った！','good');else{kurashi('b:'+id,['🏠','はじめて'+BL[id].name+'が建った']);toast(BL[id].name+'が建った！','good')}checkQuest();
  if(id==='statue'){const b=boardFree(j+3)?j+2:j+1;/* 依頼ボードは、神殿から2つ右・3つ右（絵のある所）。右がどうしてもあかないときだけ、1つ右から */S.obj[j-1]='obox';if(b===j+2){S.obj[j+1]='part';S.ref[j+1]=j}S.obj[b]='board';delete S.ref[b];S.obj[b+1]='part';S.ref[b+1]=b;S.obj[j+W]='altar';S.flags.board3=1;recount();burst(j-1,'furn');burst(b,'furn')}
  if(id==='tower'&&!S.cleared){if(WD===1){memo('rock','守護の台座が建った');setTimeout(()=>toast('守護の台座が建った','good'),900)}/* 火山：火だねをはめて火を入れるのは、台座をタップしてから（story-stage.js の towerLightTap） */else{memo('grass','御神木が育った');setTimeout(()=>toast('御神木が育った','good'),900)}finalCheck()}/* ヌシ様の前に、きびしい最後の夜 */
}
function finishCraft(o,r){
  S.orders=S.orders.filter(q=>q!==o);wbenchDel(o);if(o.type==='board'){S.flags.board5=true;delete S.recipes.board;addSpiritXp(3,r);burst(BOARD,'furn');toast('依頼ボードが広がった！','good');checkSub();if(sheet==='craft')renderSheet();return}S.unlocked[o.type]=true;craftCarry(o,r);if(o.type==='arrow2')S.flags.a2made=(S.flags.a2made||0)+BL.arrow2.qty;addSpiritXp(3,r);if(r)r.made=(r.made||0)+1;kurashi('f:'+o.type,['🪑','はじめて'+BL[o.type].name+'を作った']);burstAt(r.x,r.y,'furn');
  renderPalette();if(sheet==='craft')renderSheet();
}
function craftCarry(o,r){/* できた物は、作ったせいれいが頭の上につんで、おそなえ箱（なければ箱）へはこぶ。1回の依頼でできた分（木の矢10本・柵10こなど）は、ひとまとめで1つ（'set:'+id）。持てる数がいっぱいなら、その場におき、せいれいがはこぶ。箱がひとつもないときだけ、すぐ入れる */
  const id=o.type,n=BL[id].qty||1,nm=BL[id].name,key=n>1?'set:'+id:id;
  if(['w','a'].includes(BL[id].g?.s))gearIdea(null,id);
  if(!r||!itemBoxOK()){giveItem(id,n);toast((r?r.name+'が':'')+nm+'を作った！','good');return}
  gotNote(id);if(addItem(r,key,1))(r.cmade||(r.cmade={}))[key]=(r.cmade[key]||0)+1;
  else{const b=(S.drops||[]).length;dropAt(r.x,r.y,key,1);if(S.drops&&S.drops.length>b){const d=S.drops[S.drops.length-1];d.tap=1;d.made=1}else giveItem(id,n,1)}/* 置けなければ、そのまま入れる */
  toast(r.name+'が'+nm+'を作った！','good')}
const setId=k=>String(k).startsWith('set:')?k.slice(4):k,setN=(k,n)=>String(k).startsWith('set:')?n*(BL[k.slice(4)].qty||1):n;/* ひとまとめ（'set:'+id）を、物と数に */
function madeStow(id,n,r){/* 作った物をしまった：「ひろった」とは言わない。しまった数（のこりはふつうにしまう）をかえす */
  const c=r&&r.cmade,m=c?Math.min(n,c[id]||0):0;if(m<=0)return 0;c[id]-=m;if(!(c[id]>0))delete c[id];const b=setId(id),k=setN(id,m);giveItem(b,k,1);toast((r.name?r.name+'が':'')+itemName(b)+(k>1?'×'+k:'')+'を'+(itemDest(id)==='obox'?'おそなえ箱':'箱')+'に入れた','good');return m}
function rectCells(a,b){const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);const c=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)c.push([x,y]);return c}
let pending=null;
function yesLbl(t){$('#cYes').textContent=t}/* たしかめのボタンの字は、することのことば（植える・つけかえる・置く） */
const STAMPC10={farm:32,fence:16,stone:16,path:8};/* スタンプで足りない分を買うときの値段（1こあたり、パワーの10倍の数：畑3.2・柵1.6・石1.6・あぜ道0.8） */
function stampCost(need){let c10=0;const parts=[];for(const id in need){const short=Math.max(0,need[id]-inv(id));c10+=short?short*(STAMPC10[id]==null?Infinity:STAMPC10[id]):0;/* 足りない分だけ、1こあたりの値段で買う（足りていれば0） */if(short)parts.push(BL[id].name+short+'こ')}return {cost:Math.ceil(c10/10),parts}}
function shortCost(need){let cost=0;const parts=[];for(const id in need){const short=Math.max(0,need[id]-inv(id));cost+=short*(BL[id].qty?Infinity:BL[id].cost);if(short)parts.push(BL[id].name+short+'こ')}return {cost,parts}}
function askBulk(id,cells){if(WALLD.has(id))return toast(BL[id].name+'は、ハケではぬれません');/* 窓・カーテンは、壁に1つずつかける */
  const ok=cells.filter(([x,y])=>canPlace(id,x,y,true));
  if(!ok.length){toast('置ける場所がありません');return}
  const b=BL[id];
  if(b.kind==='plant'){const n=Math.min(ok.length,inv(id),Math.max(0,10-cnt('sprout')));if(!inv(id))return toast(iname(id)+'がおそなえ箱にありません');if(!n)return toast('植える予定がいっぱいです');/* 植える予定は10か所まで（1つずつ置くときと同じ） */ok.length=n;pending={kind:'plant',id,cells:ok};$('#confirmTxt').textContent=iname(id)+'を'+n+'か所に植えてもらう';lackOn($('#cYes'),'');yesLbl('うえる')}
  else{const s=shortCost({[id]:ok.length});if(b.qty){const n=Math.min(ok.length,inv(id));if(!n)return toast(b.name+'が足りません','warn');ok.length=n;s.cost=0;s.parts=[]}
    pending={kind:'bulk',id,cells:ok,cost:s.cost,need:{[id]:ok.length}};$('#confirmTxt').textContent=b.name+' '+ok.length+'マス'+(s.parts.length?'・足りない'+s.parts.join('・')+'は'+SP(s.cost)+'で':'・おそなえ箱から');lackOn($('#cYes'),lackPt(s.cost));yesLbl('おく')}
  ($('#cRot').hidden=true,$('#confirm').hidden=false);
}
function askStamp(sid,x,y){
  const st=STAMPS[sid];const lock=st.cells.map(c=>c[2]).filter(id=>!S.unlocked[id]);
  if(lock.length)return toast(BL[lock[0]].name+'が足りません','warn');
  for(const[dx,dy,id]of st.cells)if(!canPlace(id,x+dx,y+dy,true)||(!BL[id].floor&&S.obj[(y+dy)*W+x+dx]&&!WEEDS.has(S.obj[(y+dy)*W+x+dx])))return toast('ここには置けません');
  const need={};for(const c of st.cells)need[c[2]]=(need[c[2]]||0)+1;
  const s=stampCost(need);if(!isFinite(s.cost))return toast('足りません：'+s.parts.join('・'),'warn');
  pending={kind:'stamp',sid,x,y,cost:s.cost,need};
  $('#confirmTxt').textContent=st.name+(s.parts.length?'・足りない分は'+SP(s.cost)+'で':'・おそなえ箱から');lackOn($('#cYes'),lackPt(s.cost));yesLbl('おく');($('#cRot').hidden=true,$('#confirm').hidden=false);
}
const SWAPG=[['fence','misugaki','ropefence','logfence','bamboofence','parkfence','wall'],['hwall','bamboowall','canvaswall','acaciawall','logwall','plasterwall','brickwall','yozorawall'],['path','gravel','woodpath','stone','brick'],['floor','brickfloor','stonefloor','herrfloor','carpet']],SWAPTHRU=[new Set(['gate','stonegate','logdoor','sdoor']),new Set(['door','yozoradoor']),new Set(),new Set()],SWAPNO=['柵や塀ではありません','家の壁ではありません','道ではありません','床ではありません'];/* つけかえトンカチ：柵・塀／家の壁／道／床のなかま。ドア・門はとおりぬけて、その先もつけかえる。道・床は S.floor */
const swapT=(id,k)=>BL[id].floor?S.floor[k]:S.obj[k];
function askSwap(id,x,y){const gi=SWAPG.findIndex(g=>g.includes(id)),G=SWAPG[gi],T=SWAPTHRU[gi],j0=y*W+x;
  if(!G.includes(swapT(id,j0)))return toast(SWAPNO[gi]);
  const seen=new Set([j0]),q=[j0],cells=[];while(q.length){const j=q.pop();const tj=swapT(id,j);if(tj!==id&&G.includes(tj))cells.push(j);const x0=j%W;for(const k of [x0>0?j-1:-1,x0<W-1?j+1:-1,j-W,j+W]){if(k<0||k>=W*H||seen.has(k))continue;const o=swapT(id,k);if(G.includes(o)||T.has(o)&&!T.has(tj)){seen.add(k);q.push(k)}}}/* ドア・門はとおりぬけるが、ドアどうしはつながらない */
  if(!cells.length)return toast('もう'+BL[id].name+'です');
  if(inv(id)<cells.length)return toast(BL[id].name+'が足りません（'+inv(id)+'/'+cells.length+'）','warn');
  pending={kind:'swap',id,cells};$('#confirmTxt').textContent='つながっている'+cells.length+'マスを'+BL[id].name+'にかえる';lackOn($('#cYes'),'');yesLbl('かえる');($('#cRot').hidden=true,$('#confirm').hidden=false)}
function confirmOne(){const p=pending;if(!p||p.kind!=='one')return;const rb=$('#cRot'),rt=ROTS[p.id];rb.hidden=!rt;const lb=rt?'（'+ROTL[rt][rt===5?stairRot(p.id,p.y*W+p.x):PLROTS[p.id]||0]+'）':'';$('#confirmTxt').textContent=p.ok?BL[p.id].name+lb+'をここに置く？':rt===5?ROTL[5][stairRot(p.id,p.y*W+p.x)]+'おりる向きには置けません':'ここには置けません';lackOn($('#cYes'),'').disabled=!p.ok;yesLbl(BL[p.id]&&BL[p.id].kind==='plant'?'うえる':'おく')}
function rotPending(){const p=pending;if(!p||p.kind!=='one'||!ROTS[p.id])return;PLROTS[p.id]=ROTS[p.id]===5?stairRot(p.id,p.y*W+p.x)%4+1:((PLROTS[p.id]||0)+1)%ROTN(p.id);p.ok=canPlace(p.id,p.x,p.y,true);sfx('tap');confirmOne();dirty=true}/* ↻：置く前に向きをかえる */
function confirmYes(){
  if(pending&&nightLock()){pending=null;$('#confirm').hidden=true;selRect=null;return toast('夜のあいだは、置くことも、こわすこともできません')}
  if(!pending)return;const p=pending;pending=null;$('#confirm').hidden=true;selRect=null;
  if(p.kind==='one'){place(p.id,p.x,p.y);return}
  if(p.kind==='bp'){bpPlace(p.i,p.x,p.y);return}/* 家の設計図 */
  if(p.kind==='plant'){{const D=plantDist();p.cells=p.cells.filter(([x,y])=>plantReach(D,y*W+x));if(!p.cells.length)return toast('せいれいが行けない場所です','warn')}if(inv(p.id)<p.cells.length)return toast(iname(p.id)+'が足りません');S.inv[p.id]-=p.cells.length;for(const[x,y]of p.cells){const j=y*W+x;S.obj[j]='sprout';S.dyn[j]={plant:p.id,p:0,userMound:true}}
    p.cells.forEach(([x,y],i)=>{if(i<12)burstAt(x,y,'plant')});recount();toast('せいれいたちが植えにきてくれる','good');return}
  if(p.kind==='swap'){const G=SWAPG.find(g=>g.includes(p.id)),fl=!!BL[p.id].floor,L=p.cells.filter(j=>G.includes(swapT(p.id,j))&&swapT(p.id,j)!==p.id);if(inv(p.id)<L.length)return toast(BL[p.id].name+'が足りません');
    for(const j of L){giveItem(swapT(p.id,j),1,1);S.inv[p.id]--;if(fl)S.floor[j]=p.id;else{S.obj[j]=p.id;S.hp[j]=BL[p.id].hp}}/* 窓・カーテンは、そのまま家の壁にのこる */S.placed[p.id]=(S.placed[p.id]||0)+L.length;
    L.forEach((j,i)=>{if(i<14)burstAt(j%W,(j/W)|0,'block')});undoStack=[];recount();renderPalette();checkQuest();dirty=true;toast('つけかえた！','good');return}
  if(S.pt<p.cost)return toast('パワーが足りません');
  S.pt-=p.cost;for(const id in p.need)S.inv[id]=Math.max(0,inv(id)-p.need[id]);
  const put=(id,j)=>{if(BL[id].floor&&S.floor[j])giveItem(S.floor[j],1,1);setBlock(id,j)};
  const cells=[];
  if(p.kind==='bulk'){for(const[x,y]of p.cells){put(p.id,y*W+x);cells.push([x,y]);if(BL[p.id].kind==='furn'||BL[p.id].floor)noteQuestPlacement(p.id,y*W+x)}S.placed[p.id]=(S.placed[p.id]||0)+p.cells.length}
  else for(const[dx,dy,id]of STAMPS[p.sid].cells){put(id,(p.y+dy)*W+p.x+dx);cells.push([p.x+dx,p.y+dy])}
  cells.forEach(([x,y],i)=>{if(i<14)burstAt(x,y,'block')});
  undoStack=[];recount();renderPalette();checkQuest();toast('ぬりおわった！','good');
}

/* ---------- 家具の注文 ---------- */
const RLOCK=new Set(['kazami','merry','cup','skyswing','wheel','wbench','coop','barn','lumber','quarry','stele','fountain','lighthouse','windmill','bed','loom','campfire','oven','swing','lamp','bench','chair','stool','arrow2','drum','pit','yudekago']);/* 会話でひらめくまで作れない家具 */
/* ほかの土地でおぼえた物か（依頼ボード・「建てる」で、「この土地」のときは出さない）。この土地のお話・村レベル・思いつきでおぼえる物は、この土地の物 */
let RECALL=false,NATIVE=null,NATIVEW=-1;
function nativeSet(){if(NATIVE&&NATIVEW===WD)return NATIVE;const N=new Set();const add=L=>{for(const id of L||[])N.add(id)};
  for(const q of QUESTS||[]){add(q.learn);add(q.talk&&q.talk.learn);add(q.gives&&q.gives.recipes);add(QUEST_INSPIRATIONS[q.id]);add(QUEST_INSPIRATIONS_CLEAR[q.id])}
  for(const q of SUBQ)if(q.w==null||q.w===WD){add(q.learn);add(QUEST_INSPIRATIONS[q.k]);add(QUEST_INSPIRATIONS_CLEAR[q.k])}
  for(const id in BL){const b=BL[id];if(STAGEONLY[id]===WD||b.kwr||b.g&&WD===(b.g.gr?0:b.g.wd||1)||(b.w!=null&&b.w===WD))N.add(id);else if(STAGEONLY[id]==null&&(b.w||0)<=WD&&b.lv&&(LEVELUP_ITEMS.has(id)||b.kind!=='furn')&&!RLOCK.has(id)&&!QB.has(id))N.add(id)}
  NATIVEW=WD;return NATIVE=N}
function otherLand(id){if(!S||S.free||!WD)return false;const g=grecOf().get(id);return g!=null&&g<WD&&!nativeSet().has(id)}
function recShown(id){return RECALL||!otherLand(id)}
function recToggle(box,ids){/* 「この土地」「ぜんぶ」の切りかえ（ほかの土地の物があるときだけ） */if(!ids.some(otherLand))return;const w=el('<div class="ctabs recsw"></div>');for(const[t,v]of[['この土地',false],['ぜんぶ',true]]){const b=el('<button class="ctab'+(RECALL===v?' on':'')+'"></button>');b.textContent=t;b.onclick=e=>{e.stopPropagation();if(RECALL===v)return;sfx('tap');RECALL=v;renderSheet();renderPalette()};w.appendChild(b)}box.appendChild(w)}
function recipeKnown(id,s=S){if(id==='board')return !!(s.recipes||{}).board&&!s.flags.board5&&!s.orders.some(o=>o.type==='board');const b=BL[id];if(s&&s.free&&(FREEHIDE.has(id)||s===S&&b&&(b.w||0)>WT()))return false;/* フリーモード：守りの物・まだ開いていない土地の物はない */if(b&&b.kwr)return !!(s.recipes||{})[id];return !!b&&(!WIND_STAGE_TOYS.has(id)||WD===4)&&(id!=='noren'||WT()>=1||grec(id))/* のれんは火山のふもとから */&&(id!=='window'||!!(s.unlocked||{}).window)&&(!(b.kind==='furn'||RLOCK.has(id)||b.offerOnly||b.g)||!!(s.recipes||{})[id])}

const MANUAL=[['せいれいのようす',[['おなか','へると元気がなくなり、0になると消えてしまう。箱のごはんを食べる。料理はおなかがたくさんふくれる。'],['たのしさ','遊ぶ・おしゃべり・水あびでふえる。満タンになると、おそなえ箱におそなえをしてくれる。低いとつかれやすくなる。'],['つかれ','はたらくとたまる。たまると昼でもひと休みする。夜はベッドや家で眠ってなおす。休けい中は、まわりの物でふえるたのしさと同じだけ、つかれもとれる。'],['住み心地','家をタップすると見られる。家具・床がふえると上がる。かざりは、家の中か、家のそばにあれば入る。そのせいれいの好きな家具は、その家具のぶんのポイントが2倍になる。'],['住み心地の効果','高いほど、眠ったときのつかれのとれる速さが上がる。0.6〜3.3倍。住み心地は最大300まで上がる。180以上でぐっすり眠れて、朝にたのしさ+10。90より下だと、たのしさ－5。'],['ベッドの数','家の中の広さ4マスにつき、ベッド1つがおすすめ。それより多く置くと、きゅうくつで、ベッド1つにつき住み心地－105。そこで寝ると、たのしさ－15。']]],['ステータス',[['はたらく速さ','仕事の速さ。'],['移動速度','歩く速さ。'],['スタミナ','つかれにくさ。'],['持てる数','一度に運べる数。'],['攻撃力','「コワイノ」とたたかう力。']]],['属性と得意なこと',[['木','はたらく速さ20・移動速度20・スタミナ20・畑の収穫+1・畑の世話・花や木を植える・サラダを作る・木の家具づくり'],['水','はたらく速さ26・移動速度20・スタミナ14・水やり・スープ・ジュースを作る・水の家具づくり'],['火','はたらく速さ20・移動速度20・スタミナ20・「コワイノ」とたたかう・夜の見回り・ベイクドポテト・焼き魚を作る・火の家具づくり'],['土','はたらく速さ16・移動速度18・スタミナ26・畑を耕す・柵を直す・パンを作る・土の家具づくり'],['風','はたらく速さ18・移動速度26・スタミナ16・たのしさ60より下で遊びに行く・ふしぎな種をひろう・風の家具づくり'],['みんな','建てる・たねまき・木や石を集める・つり・おそなえ']]],['家具の種類',[['【ダイニング家具】','食卓のある家の中に置くと、その家の食卓で食べたときにもらえるパワーがふえる。'],['【料理家具】','料理をする家具のまわり3マスにあると、料理家具の種類1つにつき、料理の時間－10%。料理をする家具をタップすると、いまの料理の速さが見られる。'],['【あかり】','夜の外を照らしたり、家の中を明るくしたりするのに使う。家の中に置くあかりは、その家ぜんたいを照らす。'],['【庭の家具】','まわりにいるせいれいの、たのしさがふえる。'],['【あそび道具】','遊ぶと、たのしさがふえる。'],['【かべ・かざり】','住み心地が上がる。'],['おそなえでしか手に入らない家具','依頼ボードでは作れない家具もある。せいれいが、ごくまれにおそなえしてくれる。']]],['くらし',[['季節','春：木のせいれいの、はたらく速さ・移動速度・スタミナ1.2倍。夏：火と水のせいれいの、はたらく速さ・移動速度・スタミナ1.2倍、つかれのへり1.2倍。秋：土のせいれいの、はたらく速さ・移動速度・スタミナ1.2倍。冬：移動速度0.8倍、おなかのへり1.2倍、風のせいれいの、はたらく速さ・移動速度・スタミナ1.2倍、「コワイノ」の体力・攻撃・速さ0.8倍。せいれいは雪だるまを作る。あたたかい料理で6時間、冬の寒さがとどかない。つめたい料理で6時間、夏の暑さがとどかない。'],['天気のよほう','天気の所をタップすると、きょう・あした・あさっての天気。'],['設計図','設計図をえらんで置くと、せいれいが素材を運んで、床や道・家具や花・壁や柵の順に建てる。置く所の木や岩は、せいれいが先にかたづける。家・庭・畑・遊び場・守りの設計図がある。できた家には名前がつき、住み心地+10。'],['もりのこだま','ゆれる草むら・ふしぎな切り株・欠けた石の輪・1本たりない花の輪で見つかる。見つけると、パワー+5と小さな物1こ。10こ・20こ・30こ・40こで、設計図1まい。'],['宝の地図','地図の切れはしを3こつなげると、宝の地図になる。地図をひらくと、村の外に宝の場所の印がつき、せいれいがほりにいく。'],['ふしぎなふくろ','あけると、素材・たね・食べ物・ふしぎな種・地図の切れはし・家具のどれかが出てくる。'],['むらのちから','パワーを使って、村（くらし・しごと・まもり）と守り神の力をのばす。村の枝は、下からじゅんにひらく。ひらいた所の力は、その土地だけでずっとつづく。'],['せいれいのゆめ','夜にねたせいれいが、ときどき、ゆめを見る。ゆめの話は、お話しすると聞ける。ゆめで見た家具が村にできると、たのしさ+30。なかよしのゆめは、なかよし+3。'],['あらしの日','ときどき、あらしの日がある。前の日の夕方に知らせがくる。外にいるせいれいは、たのしさのへりかた1.5倍。木のまわりに枝が落ち、つぎの朝、水べに物がながれつく。'],['村の記録','村でしたこと（木を切る・しゅうかく・料理・「コワイノ」を追いはらう など）を数える。10・50・100・300・1000の節目で、パワー5・10・20・40・80。'],['流れ星','晴れた夜に、ときどき空を流れる。流れているあいだにタップすると、おねがいができる。つぎの朝、「ゆたかに」は素材15こ、「みのりを」はたね3こ、「げんきに」はみんなのたのしさ+20。'],['せいれいの手紙','村に来たとき・なかよしになったとき・仲なおりしたとき・村に来た記念日・こまりごとがなおったとき・ゆめがかなったとき・じぶんの家ができたとき・はじめて料理を作ったとき・あの大きな影を追いはらったとき・よみがえったとき・Lv5ごと・季節がかわったとき、せいれいが手紙を書く。つぎの朝にとどき、もちもので読める。お礼の手紙には、お礼の品が入っている。'],['なかよし','いっしょに遊ぶ・おしゃべり・同じ食卓・同じ夜に守るとふえる。30で、なかよし。60で、遊びにさそう。100で、3マス以内のはたらく速さ+5%。30・60・100で、2人の会話。夜、3マス以内でいっしょにたたかうと、攻撃力は、30で+2・60で+3・100で+5。おなかが250より少なくなってにげる、たたかうせいれいに、なかよし30いじょうの、たたかうせいれいがついていき、攻撃をかわりにうける。とどけたら、なかよし+2。'],['ゆうべのかつやく','朝の日記で、ゆうべ追いはらった数と、まもった数をたして、2点いじょうでいちばん多いせいれいをえらぶ。えらばれたせいれいは、たのしさ+10。'],['加工','加工の家具をタップして作る数をえらぶと、せいれいが箱から運んで加工する。できた物は、せいれいが箱にしまう。水車のまわり5マスの加工の家具は、せいれいがいなくても動く。'],['使うマス','加工・料理・もの作り・精錬の家具は、せいれいが前のマスに立って使う。前に物があると使えない。向きは、置くときにえらべる。'],['飼う生き物','ときどき村の外に野良の生き物が来る。柵でかこんだ所に小屋を建てて、おむかえすると、せいれいがつれてきて、小屋にすむ。せいれいが、えさの草と水をあげる。えさと水をもらった日の夕方に、小屋にとれる物ができる。なでると、たのしさ+5。'],['しごと場の担当','しごと場をタップすると、そこではたらくせいれいをきめられる。担当がきまったしごと場は、担当のせいれいだけがはたらく。担当が時計の3時間はたらくごとに、なれ+1。なれ1つで、そのしごと場でのはたらく速さ+2。'],['床','家の中の床のわりあいに応じて、住み心地が最大+45。床は歩く速さも上がる。'],['水あび','夕方、水べか、水あびできる家具で水あびをする。水あびすると、たのしさ+10。'],['あかり','家の中か、すぐそばにあかりがないと、住み心地－60。'],['朽ちた壁','家の壁は、じょうぶさが半分以下になると朽ちた壁になり、家の壁にならない。直すと、もとの壁にもどる。'],['クモの巣','毎朝、家ごとに10%で、家の中にクモの巣が1つできる。クモの巣1つで、住み心地－5。「しらべる」でタップすると、せいれいがそうじする。'],['畑とたね','もちものや「おく」でたねをえらんで、畑をタップしてまく。収穫したら、また植える。'],['ベッド','ベッドをタップすると、そこで眠るせいれいをきめられる。家をタップしても、中のベッドをえらべる。'],['かまど','「しらべる」でかまどをタップして、「おまかせ」か「入れる」をえらぶ。入れた材料の組み合わせと家具で、できる料理がかわる。作るまで、なにができるかはわからない。'],['調理台','「しらべる」で調理台をタップして、火を使わない料理の材料を入れる。'],['料理を作るせいれい','料理は、それぞれ決まった属性のせいれいだけが作る。']]],['守り神のちから',[['せいれいパワー','せいれいが食べる・眠る・遊ぶと、たまる。'],['カミサマとの交換','カミサマが来たら、交換ができる。'],['おつげ','メニューから、きょういちにちの指示を出せる。'],['依頼ボード','家具や罠をたのむ。手のあいたせいれいが作ってくれる。'],['なかまを呼ぶ','属性の力がたまったつぎの朝、神殿の「！」をタップ。']]],['そうび',[['つけられるそうび','武器・防具・アクセサリーを1つずつつけられる。せいれいの画面の「そうび」でつける。'],['鉱石','火山の鉱脈をほると、鉱石がとれる。鉱脈は、火山の熱がもどると目をさまし、毎朝ふえる。炉で、鉱石2こから延べ棒1こを作る。ひびわれのそばの岩からは、硫黄・赤い水晶。'],['作る','はじめて鉱石を手に入れると、そうびのレシピを思いつく。はじめて布を手に入れると、防具のレシピを思いつく。依頼ボードの「そうび」で依頼をはる。矢は「ワナ」。'],['強化','武器・防具は+3まで強化できる。+1は素材1こ・+2は素材2こ・+3は素材3ことパワー50。武器は攻撃+10、防具はおなかのへり－10。'],['矢','見張り台は、威力の大きい矢から使う。']]],['夜と「コワイノ」',[['「コワイノ」','夜12時ごろ、南からやってくる。せいれいをねらってくる。柵や壁をこわして、中にも入ってくる。'],['見張り台','夜、せいれいが上に立つと、「コワイノ」に木の矢を放つ。木の矢1本で1発。上に立っているせいれいは、見張り台がこわれるまで攻撃されない。上に立っているせいれいは、つかれない。上に立つせいれいの属性で、うち方がかわる。木：木の矢を放つ。土：威力1.5倍・うつ速さ0.5倍。風：射程1.5倍・威力0.5倍。水：木の矢をつかわない。あたった「コワイノ」は1分＋攻撃力1につき30秒止まる。オオカゲなどは半分。ダメージなし。見張り台をタップすると、上に立つせいれいをきめられる。強化はLv10まで。Lv5から夜にあかりがつく。Lv5で、強化の道（とおめ：射程+1マス、はやうち：うつ間かく0.7倍）をえらぶ。Lv8から、せいれいが2人立てる。段差の上では、1だんごとに射程+0.5マス。'],['たたかう','6時から23時まで、せいれいの画面で、たたかう・たたかわないをえらべる。たたかうせいれいは、夜、近くの「コワイノ」とたたかう。木：攻撃5。土：攻撃8・攻撃の速さ0.5倍。風：攻撃3・とどくきょり1.5倍。水：ダメージなし。たたいた「コワイノ」は1分＋攻撃力1につき30秒止まる。オオカゲなどは半分。たたかわない火のせいれいは、見張り台に立つ。火：威力0.5倍・木の矢を1回に2本。あたった「コワイノ」は、2分ごとに3ダメージを3回。'],['まもりの光','まもりの光のアイコンをタップしてから地図をタップすると、パワー1を使い、そこに光を落とす。範囲の「コワイノ」を光でおどかして、ダメージをあたえ、少しのあいだ止める。木や岩に当たると、木材・石材が1こ落ちる。'],['守り神の強化','パワーを使って、まもりの光のチャージ・威力・とめる時間・範囲を5段階まで、こもれびのまもりを10段階まで強くできる。'],['直す','こわれた柵・壁・見張り台・罠は、昼に土のせいれいが素材を使って直す。'],['火事（火山のふもと）','木でできた家具・柵・壁は、ハイカゲ・ヒノオオカゲにふれたり、昼に火の粉がとんできたりすると燃える。燃えているあいだ、15分ごとにじょうぶさが1へり、0になるとこわれる。昼なら、水のせいれいが消しにいく。家の中の物には、火の粉はとどかない。'],['朝まで休む','「コワイノ」をぜんぶ追いはらった夜や、せいれいがみんな消えてしまった夜は、上の「朝まで休む」で朝までとばせる。'],['そなえ','柵・壁・見張り台・罠でまもる。家の中で眠っているせいれいは、攻撃されない。でも、壁がこわれると、「コワイノ」が入ってくる。'],['おとしもの','「コワイノ」を追いはらうと、たまにおとしものをする。せいれいがひろって、箱へはこぶ。'],['やすらぎの砂','「コワイノ」のおとしものだけで手に入る、とくべつな素材。見張り台・ようがん台の強化と、石どうろうづくりに使う。'],['ヌシのかけら','3つ集めると、ヌシ様がもどってくる。手に入れかたは土地ごとにちがう。'],['めぶきのしずく','オオカゲを追いはらうと、25%で落とす。せいれいのリストの「消えてしまったせいれい」から使うと、そのせいれいがもどってくる。'],['おみおくり','消えたせいれいのお墓は、なかまが神殿へはこび、おいのりして、おみおくりする。'],['お墓','「めぐり」の特性をもつせいれいは、土地とのつながりをたどり、つぎの朝、神殿の「！」から、レベルそのままでもどってこられる。ほかのせいれいは、消えると自然にかえり、自分の力だけではもどれない。「めぶきのしずく」で呼びもどせる。']]],['夜の種類',[['霧の夜','見張り台のとどく所が半分。'],['群れの夜','「コワイノ」が、南のはしの1か所からまとめて来る。'],['影の波','「コワイノ」が、5つの波に分かれて来る。'],['先ぶれ','村をのぞいて帰るハヤカゲ。帰りつく前に1ぴき追いはらうごとに、まだ来ていない「コワイノ」が2わりへる。'],['横からの夜','「コワイノ」の3分の1が、東か西のはしから来る。'],['雨の夜','ほのおの罠のダメージ半分・延焼なし。水の足止め1.5倍。'],['風の強い夜','見張り台の射程+1マス。つむじ風の罠のとばすきょり9マス。'],['あらしの夜','見張り台の射程－1マス。ほのおの罠のダメージ半分・延焼なし。水の足止め1.5倍。'],['ワナクイのうたげ','「コワイノ」は、ワナクイだけ。数は半分。'],['かげのどろぼう市','「コワイノ」は、カゲドロボウだけ。'],['かげのうしお','「コワイノ」は、コカゲだけ。来る間かくが半分。'],['満月','「コワイノ」の歩く速さ0.9倍。'],['新月','「コワイノ」の歩く速さ1.1倍。'],['おだやかな夜','今夜の「コワイノ」が半分。'],['星空の夜','3時に寝ているせいれいのたのしさ+15。'],['オオカゲの夜','大きな「コワイノ」、オオカゲがやってくる。'],['角笛の夜','よびごえの角笛をふいた夜。ふつうの「コワイノ」が1.5倍。'],['まよけの夜','まよけのハーブをつかった夜。ふつうの「コワイノ」が半分。']]]];
/* ひでんのしょ：まだ出会っていないことは「？？？」。いちど出会ったら S.flags.man におぼえる（フリーモードは、はじめからぜんぶ） */
const manNv=k=>!!(S.flags.nv||{})[k],manKnow=id=>!!((S.recipes||{})[id]||cnt(id)>0||((S.inv||{})[id]||0)>0),manEl=k=>[...S.res,...(S.buried||[]),...(S.lost||[])].some(x=>x&&x.elem===k),manKowa=()=>(S.nights||0)>0||S.enemies.some(e=>e.spawned),manGone=()=>(S.buried||[]).length>0||(S.lost||[]).length>0||cnt('grave')>0;
const MANMET={'木':()=>manEl('wood'),'水':()=>manEl('water'),'火':()=>manEl('fire'),'土':()=>manEl('earth'),'風':()=>manEl('wind'),'攻撃力':()=>manEl('fire'),
  'もりのこだま':()=>(S.kodama||0)>0,'宝の地図':()=>!!(S.seenIt||{})['x:mapPc']||!!(S.seenIt||{})['x:tmap'],'ふしぎなふくろ':()=>!!(S.seenIt||{})['x:fukuro'],'むらのちから':()=>!!S.vpath&&Object.keys(S.vpath).length>0||!!S.gup&&Object.keys(S.gup).length>0,'せいれいのゆめ':()=>!!S.dream||!!S.flags.dreamSeen,'ゆうべのかつやく':()=>(S.diary||[]).some(e=>!!e.mvp),'なかよし':()=>!!S.bond&&Object.keys(S.bond).some(k=>S.bond[k]>=30),'あらしの日':()=>S.storm!=null||S.stormNext!=null,'村の記録':()=>!!S.vrec&&Object.keys(S.vrec).length>0,'流れ星':()=>!!S.starN&&S.starN.shown!=null,'せいれいの手紙':()=>!!(S.letters&&S.letters.length),'加工':()=>manKnow('loom')||manKnow('mill'),'設計図':()=>(S.bpInv||[]).length>0||(S.bp||[]).length>0||(S.bpDone||0)>0,'飼う生き物':()=>manKnow('coop')||manKnow('barn')||aniHome().length>0,'しごと場の担当':()=>manKnow('lumber')||manKnow('quarry')||manKnow('smelter'),'朽ちた壁':()=>S.obj.some((o,j)=>DECAYW.has(o)&&decayed(j)),'クモの巣':()=>Object.keys(S.web||{}).length>0,
  'かまど':()=>manKnow('oven'),'調理台':()=>manKnow('cooktable'),'料理を作るせいれい':()=>manKnow('oven')||manKnow('cooktable'),
  'おつげ':()=>WD!==0||!!((S.subDone||{}).oracle||(S.subSt||{}).oracle>=2),'見張り台':()=>manKnow('watch'),'たたかう':()=>sortieOn(),
  '「コワイノ」':manKowa,'直す':manKowa,'朝まで休む':manKowa,'そなえ':manKowa,'おとしもの':manKowa,'火事（火山のふもと）':()=>WD===1,
  'やすらぎの砂':()=>(S.sand||0)>0,'ヌシのかけら':()=>(S.shards||0)>0,'めぶきのしずく':()=>(S.mebuki||0)>0,'おみおくり':manGone,'お墓':manGone,'霧の夜':()=>manNv('kiri'),'群れの夜':()=>manNv('mure'),'影の波':()=>manNv('wave'),'先ぶれ':()=>manNv('scout'),'横からの夜':()=>manNv('side'),'雨の夜':()=>manNv('wx_rain')||manNv('wx_storm'),'風の強い夜':()=>manNv('wx_kaze'),'あらしの夜':()=>manNv('wx_storm'),'ワナクイのうたげ':()=>manNv('wana'),'かげのどろぼう市':()=>manNv('doro'),'かげのうしお':()=>manNv('ushio'),'満月':()=>manNv('full'),'新月':()=>manNv('new'),'おだやかな夜':()=>manNv('odayaka'),'星空の夜':()=>manNv('hoshi'),'オオカゲの夜':()=>manNv('boss')||!!S.flags.bossIntro||(S.bossKills||0)>0,'角笛の夜':()=>manNv('horn')||S.hornD!=null,'まよけの夜':()=>manNv('herb')||S.herbD!=null};
function manMet(t){if(S.free||!MANMET[t])return true;const F=S.flags.man||(S.flags.man={});if(F[t])return true;if(MANMET[t]()){F[t]=1;return true}return false}
const boardMax=()=>S.flags.board5?5:3;
/* 作業台（家具）：依頼は、空いた作業台で1つずつ作る（S.dyn[j].order・o.cs）。作業台のとなりの箱にある素材は、運ばずに使う（benchPull）。
   作業台が1つもないときは、作業台そのものの依頼だけ、いままでどおり依頼ボードのそばの地面で作る（o.gnd） */
const isBench=(o,j)=>j!=null&&j>=0&&S.obj[j]==='wbench'&&S.dyn[j]&&S.dyn[j].order===o.id;
const benchOf=o=>o&&isBench(o,o.cs)?o.cs:-1;
function wbCells(j,s){/* 作業台（よこ2マス・向き4つ）の、作業台のマス b と材料置き場のマス y。向き0：左が作業台・1：上が作業台・2：右が作業台・3：下が作業台 */s=s||S;const r=(s.rot&&s.rot[j])||0,d=r%2?W:1;return r>=2?{b:j+d,y:j}:{b:j,y:j+d}}
function wbenchAt(s,j,r){/* 作業台をマス j（左上）に向き r で置く（置けるかは見ない） */const d=r%2?W:1;s.obj[j]='wbench';s.obj[j+d]='part';(s.ref||(s.ref={}))[j+d]=j;(s.rot||(s.rot={}))[j]=r;(s.dyn||(s.dyn={}))[j]=s.dyn[j]||{}}
function benchBoxes(cs){/* 作業台・材料置き場のとなり（たて・よこ）の箱（かべかけの物は、すぐ上の壁だけ） */const L=[];if(cs==null||cs<0)return L;const c=wbCells(cs),me=[c.b,c.y];for(const p of me)for(const k of[p+1,p-1,p+W,p-W]){if(k<0||k>=W*H||Math.abs(k%W-p%W)>1||me.includes(k))continue;if(!boxTypeAt(k)||!boxSide(p,k))continue;const a=anc(k);if(!L.includes(a))L.push(a)}return L}
function benchHas(cs,key){let n=0;for(const a of benchBoxes(cs))n+=boxHas(a,key);return n}
function benchLeft(t){/* まだ運んでいない素材のうち、作業台のとなりの箱にない分（運ぶ分） */const m=needLeft(t),cs=(S.orders||[]).includes(t)?benchOf(t):-1;if(cs<0)return m;for(const k in m){m[k]-=Math.min(m[k],benchHas(cs,k));if(m[k]<=0)delete m[k]}return m}
const benchEx=t=>{const cs=(S.orders||[]).includes(t)?benchOf(t):-1;return cs<0?null:new Set(benchBoxes(cs))};
const benchDone=t=>hasNeed(t)&&!Object.keys(benchLeft(t)).length;/* のこりの素材は、ぜんぶとなりの箱にある */
function benchPull(o){/* 作業台のとなりの箱から、いる素材をとる（運ばない） */const cs=benchOf(o);if(cs<0)return 0;const m=needLeft(o),g=o.got||(o.got={});let n=0;for(const key in m)for(const a of benchBoxes(cs)){if(m[key]<=0)break;const t=boxOutR(a,key,m[key]);if(t>0){g[key]=(g[key]||0)+t;m[key]-=t;n+=t}}return n}
function wbenchLost(o){/* 作業台がなくなった・うつした：運びこんだ素材は、そこに落とし、作っていた子は手をとめる */const j=o.cs;o.cs=null;o.worker=null;if(j!=null&&o.got&&Object.keys(o.got).length)gotDrop(o,j);for(const r of S.res)if(r.act&&r.act.type==='craft'&&r.act.order===o.id){endAct(r);r.act=null;r.path=[]}}
function wbenchScore(o,j){/* となりの箱にある、いる素材の数 */let n=0;const m=needLeft(o);for(const k in m)n+=Math.min(m[k],benchHas(j,k));return n}
function wbenchTick(){/* 1秒ごと（と、依頼をはったとき）：依頼に空いた作業台をわりあてる */if(!S)return;const L=S.orders||(S.orders=[]),ids=new Set(L.map(o=>o.id));const B=[];
  for(let j=0;j<W*H;j++){if(S.obj[j]!=='wbench')continue;const d=S.dyn[j];if(d&&d.order!=null&&!(ids.has(d.order)&&L.some(o=>o.id===d.order&&o.cs===j)))delete d.order;if(workOK(j)||d&&d.order!=null)B.push(j)}/* 前（作業するマス）がふさがった作業台には、新しい依頼をわりあてない */
  for(const o of L){if(o.gnd){if(B.length&&!(o.got&&Object.keys(o.got).length)&&!S.res.some(r=>r.act&&r.act.type==='craft'&&r.act.order===o.id)){delete o.gnd;o.cs=null}continue}/* 地面で作っていた作業台の依頼：作業台ができたら、そちらで */if(o.cs!=null&&!isBench(o,o.cs))wbenchLost(o)}
  for(const o of L){if(o.gnd||o.cs!=null)continue;let best=-1,bs=-1,bd=1e9;for(const j of B){const d=S.dyn[j];if(d&&d.order!=null)continue;const sc=wbenchScore(o,j),dd=distJ(j,BOARD);if(sc>bs||sc===bs&&dd<bd){best=j;bs=sc;bd=dd}}
    if(best>=0){(S.dyn[best]||(S.dyn[best]={})).order=o.id;o.cs=best}else if(!B.length&&o.type==='wbench')o.gnd=1}}
function wbenchDel(o){const j=benchOf(o);if(j>=0)delete S.dyn[j].order}
function wbenchFix(){/* 読みこんだとき */if(!S.flags.wbFurn1){S.flags.wbFurn1=1;/* 前は、依頼のあいだだけ作業台が出ていた：依頼のある作業台は、そのまま家具に。依頼のない作業台はかたづけ、地面で作っていた依頼は、作業台を待つ */
    const ids=new Set((S.orders||[]).map(o=>o.id));for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='wbench'&&!(S.dyn[j]&&ids.has(S.dyn[j].order))){S.obj[j]='';delete S.dyn[j]}
    for(const o of S.orders||[])if(!(o.cs!=null&&S.obj[o.cs]==='wbench'&&S.dyn[o.cs]&&S.dyn[o.cs].order===o.id))o.cs=null;
    const w=qsIx('wbench'),past=S.free||((S.world||0)!==0?(S.quest||0)>0:S.cleared||(S.quest||0)>w||(S.quest||0)===w&&S.qTalked);/* 火山は、神殿を直したときにもらう */
    if(past&&!S.obj.includes('wbench')&&!((S.inv||{}).wbench>0)){S.unlocked=S.unlocked||{};S.unlocked.wbench=true;giveItem('wbench',1,1);villageTimeout(()=>toast('カミサマが、作業台をおそなえ箱に入れてくれた','good'),1800)}
    if(past)(S.recipes||(S.recipes={})).wbench=true}
  if(!S.flags.wbYard1){S.flags.wbYard1=1;/* 作業台に材料置き場がついて、よこ2マスになった：まわりが空いていれば広げ、空いていなければ、もちものにもどす */
    for(let j=0;j<S.obj.length;j++){if(S.obj[j]!=='wbench')continue;const d=S.dyn[j];let ok=false;S.obj[j]='';
      for(const [r,a] of [[0,j],[1,j],[2,j-1],[3,j-W]]){if(a<0)continue;const pr=PLROTS.wbench;PLROTS.wbench=r;let c=false;try{c=canPlace('wbench',a%W,(a/W)|0,true)}catch(e){}finally{if(pr==null)delete PLROTS.wbench;else PLROTS.wbench=pr}
        if(!c)continue;delete S.dyn[j];wbenchAt(S,a,r);S.dyn[a]=d||{};for(const o of S.orders||[])if(o.cs===j)o.cs=a;ok=true;break}
      if(!ok){delete S.dyn[j];giveItem('wbench',1,1)}}
    recount()}
  wbenchTick()}
function wbenchStand(cs,G){return workStand(G,cs)}/* 作業台の前（向きの前。workCells）に立って作る */
/* 材料置き場（matyard）：素材のいる依頼・建てる所・設計図のとなりに1マス（S.dyn[j].yt：'o'+依頼・'s'+建てる所・'b'+設計図）。せいれいは運んだ素材をここへ置く（ydrop）。
   絵は、運んだ素材の合計のわりあいで4まい（matyard#0 空・#1 半分より少ない・#2 半分から・#3 ぜんぶ）。1秒ごとに出す・かたづける（yardTick） */
function yardOwner(yt){/* {ts:運ぶ先の一覧, an:となりにするマス, g:運んだ数, n:いる数}（なければ null） */if(typeof yt!=='string')return null;const id=+yt.slice(1);let ts=[],an=[],g=0,n=0;
  const add=t=>{for(const [,a,b] of gotList(t)){g+=a;n+=b}};
  if(yt[0]==='o'){const o=(S.orders||[]).find(q=>q.id===id);if(!o)return null;ts=[o];an=[o.cs!=null?o.cs:BOARD];if(an[0]<0)return null;add(o)}
  else if(yt[0]==='s'){const d=S.obj[id]==='site'&&S.dyn[id];if(!d||d.bp!=null)return null;ts=[d];an=[id];for(const k in S.ref)if(S.ref[k]===id&&S.obj[k]==='site2')an.push(+k);add(d)}
  else if(yt[0]==='b'){const e=(S.bp||[]).find(q=>q.id===id);if(!e)return null;an=e.cells;for(const p of e.ps){const m=bpPieceMat(p.t,p.id);let need=0;for(const k in m)need+=m[k];n+=need;if(p.s===2)g+=need;else if(p.s===1&&S.obj[p.j]==='site'&&S.dyn[p.j]&&S.dyn[p.j].bp===e.id){const d=S.dyn[p.j];ts.push(d);for(const [,a] of gotList(d))g+=a}}}
  else return null;return{ts,an,g:Math.min(g,n),n}}
const yardStage=yt=>{const w=yardOwner(yt);if(!w||!w.n||w.g<=0)return 0;return w.g>=w.n?3:w.g*2<w.n?1:2};
const yardKey=bid=>{if(typeof bid!=='string')return null;if(bid[0]==='s'){const d=S.dyn[+bid.slice(1)];return d&&d.bp!=null?'b'+d.bp:bid}return bid};/* 運ぶ先（bid：建てる所・依頼）の置き場のキー（設計図の部品は、設計図の置き場） */
function yardAt(yt){if(!yt)return -1;if(yt[0]==='o'){const o=(S.orders||[]).find(q=>q.id===+yt.slice(1)),cs=benchOf(o);if(cs>=0)return wbCells(cs).y}/* 作業台の依頼は、作業台についた材料置き場 */const L=YARDS[yt];return L!=null&&S.obj[L]==='matyard'&&S.dyn[L]&&S.dyn[L].yt===yt?L:-1}
let YARDS={};/* yt → マス（yardTick で作りなおす。セーブには S.dyn[j].yt だけ） */
function yardPut(yt,w,G){/* となり（たて・よこ → ななめ → 2マス先）の空いたマスに置く。せいれいが行けて、置き場のとなりに立てる所 */const ex=new Set();for(const e of S.bp||[]){for(const c of e.cells)ex.add(c);for(const p of e.ps)if(p.t==='door'||p.t==='gate')for(const k of[p.j+1,p.j-1,p.j+W,p.j-W])ex.add(k)}/* これから建つドア・柵のドアの前も、あけておく */for(const o of S.orders||[])if(o.cs!=null)ex.add(o.cs)
  const door=k=>HOME_DOORS.has(typeAt(k))||GATE_IDS.has(typeAt(k)),inH=k=>HOUSES.some(h=>h.inside.has(k));
  const ok=j=>{if(j<0||j>=W*H||S.obj[j]||ex.has(j)||!walk(j)||G.dist[j]<0||inH(j)||j===BOARD+W||j===BOARD+W+1)return false;if(S.res.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===j))return false;let st=0;for(const k of[j+1,j-1,j+W,j-W]){if(k<0||k>=W*H||Math.abs(k%W-j%W)>1)continue;if(door(k))return false;if(walk(k)&&G.dist[k]>=0&&!w.an.includes(k))st++}if(!st)return false;
    const nb=a=>[a+1,a-1,a+W,a-W].filter(k=>k>=0&&k<W*H&&Math.abs(k%W-a%W)<=1);/* 作業台・建てる所のとなりに、立つ所がのこる（ふさがない） */
    for(const a of new Set([...(yt[0]==='b'?[]:w.an),...(S.orders||[]).filter(o=>o.cs!=null&&S.obj[o.cs]==='wbench').map(o=>o.cs)]))if(nb(a).includes(j)&&!nb(a).some(k=>k!==j&&!w.an.includes(k)&&walk(k)&&G.dist[k]>=0))return false;return true};
  const rings=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]],r2=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===2)r2.push([dx,dy]);
  for(const ds of[rings.slice(0,4),rings.slice(4),r2])for(const a of w.an)for(const [dx,dy] of ds){const x=a%W+dx,y=((a/W)|0)+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(ok(j)){S.obj[j]='matyard';S.dyn[j]={yt};YARDS[yt]=j;return j}}
  return -1}
function yardTick(){/* 1秒ごと：運ぶ先のなくなった置き場をかたづけ、素材のいる所に置き場を出す */if(!S||typeof MEMRUN!=='undefined'&&MEMRUN)return;wbenchTick();let ch=false;YARDS={};
  for(let j=0;j<W*H;j++){if(S.obj[j]!=='matyard')continue;const d=S.dyn[j],yt=d&&d.yt;if(!yt||YARDS[yt]!=null||!yardOwner(yt)||yt[0]==='o'&&benchOf((S.orders||[]).find(q=>q.id===+yt.slice(1)))>=0){S.obj[j]='';delete S.dyn[j];ch=true;continue}YARDS[yt]=j}/* 作業台の依頼の置き場は、作業台についている */
  const want=[];for(const o of S.orders||[])if(o.gnd&&Object.keys(benchLeft(o)).length)want.push('o'+o.id);/* 地面で作る作業台の依頼だけ（作業台には材料置き場がついている） */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='site'&&S.dyn[j]&&S.dyn[j].bp==null&&S.dyn[j].mat&&Object.values(S.dyn[j].mat).some(v=>v>0))want.push('s'+j);
  for(const e of S.bp||[])want.push('b'+e.id);
  let G=null;for(const yt of want){if(YARDS[yt]!=null)continue;const w=yardOwner(yt);if(!w||!w.n)continue;if(!G){const r0=S.res.find(q=>!q.hidden);if(!r0)break;G=bfs(r0.x|0,r0.y|0)}if(yardPut(yt,w,G)>=0)ch=true}
  if(ch){recount();dirty=true}}
function yardTxt(yt){/* タップの知らせ：素材ごとの「木材（2/5）」（設計図は、ぜんぶの部品をたす） */const w=yardOwner(yt);if(!w)return '';const g={},n={};
  if(yt[0]==='b'){const e=(S.bp||[]).find(q=>q.id===+yt.slice(1));for(const p of e.ps){const m=bpPieceMat(p.t,p.id),d=p.s===1&&S.obj[p.j]==='site'?S.dyn[p.j]:null;for(const k in m){n[k]=(n[k]||0)+m[k];g[k]=(g[k]||0)+(p.s===2?m[k]:d&&d.got?Math.min(m[k],d.got[k]||0):0)}}}
  else for(const t of w.ts)for(const [k,a,b] of gotList(t)){n[k]=(n[k]||0)+b;g[k]=(g[k]||0)+a}
  return Object.keys(n).map(k=>itemKeyName(k)+'（'+g[k]+'/'+n[k]+'）').join('　')}
/* 依頼をやめる：パワーと素材はもどる。作っていた子は手をとめる */
function cancelOrder(oid){const k=S.orders.findIndex(q=>q.id===oid);if(k<0)return;const o=S.orders[k],b=BL[o.type];S.orders.splice(k,1);
  S.pt+=b.pc;const cs=benchOf(o)>=0?wbCells(o.cs).y:o.cs;wbenchDel(o);if(o.mat||o.food)siteRefund(o,cs!=null?cs:BOARD);/* 作業台なら、材料置き場のところに */else for(const m in b.mat||{})S.mat[m]=(S.mat[m]||0)+b.mat[m];if(b.sand)S.sand=(S.sand||0)+b.sand;/* とっておいた素材はもどし、運んだ分は作る場所（なければ依頼ボードのまえ）に置く */
  for(const r of S.res)if(r.act&&r.act.type==='craft'&&r.act.order===oid){endAct(r);r.act=null;r.path=[]}
  toast(b.name+'の依頼をやめた');sfx('post');renderSheet()}
const ORDER_LOCK={'stor':'crate'};
const orderLock=()=>{const q=QUESTS[S.quest];return !S.cleared&&q&&ORDER_LOCK[q.id]||null};/* このクエストのあいだは、そのものしかたのめない（ほかをたのむと、材料がなくなって進めなくなる） */
function canMakeNow(id){/* パワー・素材・村レベルがそろっていて、作る属性のせいれいが村にいて、いま依頼をはれる物 */const b=BL[id],mk=makerOf(id);return lvOK(id)&&(!mk||S.res.some(r=>r.elem===mk))&&S.pt>=b.pc&&matOK(b.mat)&&(!b.sand||(S.sand||0)>=b.sand)&&Object.keys(b.food||{}).every(k=>(S.fs[k]||0)>=b.food[k])}
function orderFurn(id){if(!recipeKnown(id))return;if(!lvOK(id))return toast('村レベル'+BL[id].lv+'から作れます');{const L=orderLock();if(L&&id!==L)return toast('いまは「'+BL[L].name+'」だけたのめます')}
  const b=BL[id];if(BOARD<0)return toast('神殿がありません');if(S.orders.length>=boardMax())return toast('依頼ボードがいっぱいです（'+boardMax()+'まい）');if(S.pt<b.pc)return toast('パワーが足りません');if(!matOK(b.mat))return toast('素材が足りません（'+matTxt(b.mat)+'）');if(b.sand&&(S.sand||0)<b.sand)return toast('やすらぎの砂が足りません（'+b.sand+'）');for(const k in b.food||{})if((S.fs[k]||0)<b.food[k])return toast(FOODS[k].name+'が足りません（'+b.food[k]+'）');
  S.pt-=b.pc;rsvAdd(b.mat);rsvAdd(b.food,true);if(b.sand)S.sand-=b.sand;/* 素材・食べ物（どくの罠のきのこ）は、とっておく（せいれいが箱から運ぶ） */S.orders.push({id:S.nid++,type:id,prog:0,need:b.time,worker:null,mat:Object.assign({},b.mat||{}),food:Object.assign({},b.food||{}),got:{}});wbenchTick();toast(b.name+'の依頼をはった');if(!S.obj.includes('wbench')&&id!=='wbench')villageTimeout(()=>toast('作業台がありません','warn'),900);sfx('post');renderSheet();
}

/* ---------- 目標 ---------- */
/* 物語のせいれい（フタバ・ノドカ）がいないあいだは、そのクエストは進まない */
function qNeed(q){const n=new Set();if(q.talk){n.add(q.talk.who);q.talk.lines.forEach(l=>KEYRES.includes(l[0])&&n.add(l[0]))}(q.story||[]).forEach(l=>KEYRES.includes(l[0])&&n.add(l[0]));return[...n].filter(x=>KEYRES.includes(x))}
const qMissing=q=>qNeed(q).filter(n=>!S.res.some(r=>r.name===n)&&((S.buried||[]).some(b=>b.name===n)||(S.lost||[]).some(b=>b.name===n))).concat(typeof fieldMissNames==='function'?fieldMissNames(q).filter(n=>!qNeed(q).includes(n)):[]);/* お話にいる子が、お墓・旅に出ていて村にいない */
let TALKW=null,QUESTCLEARW=null;/* 話したそうにしているせいれい／クエスト達成後のお礼 */
function resetQuestPrompts(){if(S)sevCancel(SEV_ENCOUNTERS.get(S),null,false);SEVW={};TALKW=null;QUESTCLEARW=null;SUBW={};QUEST_CLEAR_WAIT=null;SUB_CLEAR_WAIT={};PAYOK=false;ASKING=false}
function focusQuestSpeaker(w){if(!w||VW<100||VH<100)return;const r=S.res.find(q=>q.name===w&&!q.hidden);if(!r)return;const x=r.x*TS,y=(r.y-1.3)*TS,vw=VW/cam.z,vh=VH/cam.z;if(x<cam.x+48||x>cam.x+vw-48||y<cam.y+80||y>cam.y+vh-120)centerOn(r.x*TS,(r.y-1)*TS)}
/* きろく：できごとを日づけつきで残す */
function omo(k,who){/* いっしょにした「はじめて」を、その場にいた子といっしょにおぼえる（あとで、せいれいどうしの思い出話になる） */if(!S)return;const O=S.omo||(S.omo={});if(O[k])return;O[k]={d:dayNo(),w:who?[who]:S.res.filter(r=>!r.hidden).map(r=>r.name)}}
const omoWe=(k,r,p,days=2)=>{const o=S.omo&&S.omo[k];return !!(o&&r&&p&&dayNo()-o.d>=days&&o.w.includes(r.name)&&(o.w.length===1||o.w.includes(p.name)))}/* 思い出の話：その場にいた子が話す（2日たってから） */
function memo(e,t){if(!S)return;dyEv(t);(S.memo||(S.memo=[])).push([dayNo(),e,t]);if(S.memo.length>200)S.memo.shift()}/* 思い出帳 */
