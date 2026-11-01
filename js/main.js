'use strict';
function talkOnce(key,lines,delay){/* 1回だけの会話：最後まで見てから「見た」にする。とちゅうでとじたら、次に開いたときにもう一度 */if(!S||S.flags[key]||!lines||!lines.length)return;const P=S.pendTalk||(S.pendTalk={});P[key]=lines;setTimeout(()=>{if(!S||S.flags[key])return;dialog(P[key]||lines,()=>{S.flags[key]=1;if(S.pendTalk)delete S.pendTalk[key]})},delay||900)}
function replayTalks(){if(!S||!S.pendTalk)return;for(const k in S.pendTalk){if(S.flags[k]){delete S.pendTalk[k];continue}talkOnce(k,S.pendTalk[k],1500)}}
function continueGame(saved){if(saved&&saved.summary)saved=loadStage(saved.world);if(!saved)return;recSync();/* いまのステージでおぼえた物を、先にしまう */setWorld(saved.world||0);S=saved;LIVE[WD]=S;ensureStor(S);S.flags=S.flags||{};if(!S.flags.festq2){S.flags.festq2=1;for(const q of SUBQ)if(q.base&&(S.subSt||{})[q.k]===2&&S.subB)S.subB[q.k]=q.base()}/* かざり・あかりの数え方がかわったので、とちゅうのクエストの数えはじめを作りなおす */{let back=0;for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='soko'){S.obj[j]='';back++;for(const k of[j+1,j+W,j+W+1])if(S.obj[k]==='part'&&S.ref[k]===j){S.obj[k]='';delete S.ref[k]}delete S.hp[j]}const d=S.dyn[j];if(d&&d.build==='soko'){S.obj[j]='';delete S.dyn[j];back++;for(const k of[j+1,j+W,j+W+1])if((S.obj[k]==='part'||S.obj[k]==='site2')&&S.ref[k]===j){S.obj[k]='';delete S.ref[k]}}}if(back){S.pt+=20*back;S.mat.wood=(S.mat.wood||0)+30*back;S.mat.stone=(S.mat.stone||0)+20*back}if(S.recipes)delete S.recipes.soko;if(S.unlocked)delete S.unlocked.soko}if(!S.flags.shin3){S.flags.shin3=1;/* ご神木は3×3になった：まわりがあいていれば広げる。あいていなければ、素材とパワーをかえして、けす */for(let j=0;j<S.obj.length;j++){const o=S.obj[j],st=o==='site'&&S.dyn[j]&&S.dyn[j].build==='shinboku';if(o!=='shinboku'&&!st)continue;const x=j%W,y=(j/W)|0,pt=st?'site2':'part',add=[];let ok=x+2<W&&y+2<H;for(let b=0;b<3&&ok;b++)for(let a=0;a<3;a++){if(a<2&&b<2)continue;const k=(y+b)*W+x+a;if(S.obj[k]){ok=false;break}add.push(k)}
  if(ok){for(const k of add){S.obj[k]=pt;S.ref[k]=j}}else{for(let b=0;b<2;b++)for(let a=0;a<2;a++){const k=(y+b)*W+x+a;if(k!==j&&S.ref[k]===j){S.obj[k]='';delete S.ref[k]}}S.obj[j]='';delete S.dyn[j];delete S.hp[j];S.pt+=160;S.mat.wood=(S.mat.wood||0)+40}}}if(!S.flags.arrow0){S.flags.arrow0=1;if(S.obj.includes('watch'))S.inv.arrow=(S.inv.arrow||0)+30}/* 見張り台が木の矢を使うようになった：見張り台がある前のセーブには、木の矢30本 */if(S.win)for(const key in S.win)if(S.win[key]==='kabedougu'){delete S.win[key];S.inv.kabedougu=(S.inv.kabedougu||0)+1}/* どうぐたては床に置く物になった：壁にかけてあった物は、もちものにもどす *//* 倉庫はなくした：置いてあった倉庫は、素材とパワーをかえして、けす */for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='niguruma'&&!(S.obj[j+1]==='part'&&S.ref[j+1]===j)){if(!S.obj[j+1]&&(j+1)%W!==0){S.obj[j+1]='part';S.ref[j+1]=j}else{S.obj[j]='';S.inv.niguruma=(S.inv.niguruma||0)+1}}/* にぐるまは2×1になった：右があいていればのばす。あいていなければ、もちものにもどす */if(S.flags.lightTold&&!(S.subDone||{}).lighttry)(S.subDone||(S.subDone={})).lighttry=true;/* 前のセーブ：守りの光の話をもう聞いていたら、サブクエストは出さない */if(!S.free&&!S.flags.rec3){S.flags.rec3=1;const own=ownLearned(S,WD);for(const[id,o]of grecOf())if(o>WD&&!own.has(id)){delete(S.recipes||{})[id];delete(S.guardianIdeas||{})[id];delete(S.unlocked||{})[id]}}/* 前のセーブ：この先のステージでおぼえたレシピを、もっていたら消す */if(!S.flags.land2){S.flags.land2=1;S.flags.land3=1;S.flags.land4=1;genLand(S,WD);/* はじめて作るときは、いまの作り方なので、あとの作りなおしはいらない *//* 地形を作りなおす（川・浅瀬・0〜3だんの段差）。人の作った物の所は、そのまま */S.drops=(S.drops||[]).filter(d=>!S.ground[d.y*W+d.x]);S.seeds=(S.seeds||[]).filter(d=>!S.ground[d.y*W+d.x]);S.regrow=(S.regrow||[]).filter(g=>!S.ground[g.j])}else if(!S.hi)genHeights(S,WD);if(!S.flags.land3){S.flags.land3=1;genHeights(S,WD)}if(!S.flags.land4){S.flags.land4=1;/* ステージごとの地形にする：火山は前の南北の川を地面にもどして、東西の川を流す。段差も作りなおす */if(WD===1){const old=genRiver(S,1,{ns:true,dry:true});let back=0;for(let j=0;j<W*H;j++){if(!old[j]||!S.ground[j])continue;if(S.obj[j]==='bridge'){S.obj[j]='';S.pt+=BL.bridge.pc;for(const k in BL.bridge.mat)S.mat[k]=(S.mat[k]||0)+BL.bridge.mat[k];back++}S.ground[j]=0}genRiver(S,1);if(back)setTimeout(()=>toast('川がかわったので、橋を'+back+'つ、パワーと素材にもどしました'),1500)}genHeights(S,WD);S.drops=(S.drops||[]).filter(d=>!S.ground[d.y*W+d.x]);S.seeds=(S.seeds||[]).filter(d=>!S.ground[d.y*W+d.x]);S.regrow=(S.regrow||[]).filter(g=>!S.ground[g.j])}/* 段の高さだけ作りなおす（段と段のあいだを2マス以上に）。川はそのまま */bambooMig();{for(let j=0;j<S.floor.length;j++)if(S.floor[j]==='hoshifloor')S.floor[j]='stonefloor';if(S.inv&&S.inv.hoshifloor){S.inv.stonefloor=(S.inv.stonefloor||0)+S.inv.hoshifloor;delete S.inv.hoshifloor}if(S.recipes)delete S.recipes.hoshifloor;if(S.unlocked)delete S.unlocked.hoshifloor;for(const o of S.orders||[])if(o.type==='hoshifloor'){S.pt+=4;S.mat.stone=(S.mat.stone||0)+3}/* 依頼中だった分は、パワー4・石材3をもどす */S.orders=(S.orders||[]).filter(o=>o.type!=='hoshifloor')}/* ほしくずの床はなくした：置いた床は石の床に */{delete S.ywin;if(S.inv&&S.inv.yozorawin){S.inv.window=(S.inv.window||0)+S.inv.yozorawin;delete S.inv.yozorawin}if(S.recipes)delete S.recipes.yozorawin;if(S.unlocked)delete S.unlocked.yozorawin;for(const o of S.orders||[])if(o.type==='yozorawin'){S.pt+=3;S.mat.wood=(S.mat.wood||0)+3}/* 依頼中だった分は、パワー3・木材3をもどす */S.orders=(S.orders||[]).filter(o=>o.type!=='yozorawin')}/* よぞらの窓はなくした：置いてあった窓は、ふつうの窓に */{for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='stairs_log')S.obj[j]='stairs_wood';if(S.dyn[j]&&S.dyn[j].build==='stairs_log')S.dyn[j].build='stairs_wood'}if(S.inv&&S.inv.stairs_log){S.inv.stairs_wood=(S.inv.stairs_wood||0)+S.inv.stairs_log;delete S.inv.stairs_log}if(S.recipes)delete S.recipes.stairs_log;if(S.unlocked)delete S.unlocked.stairs_log;for(const o of S.orders||[])if(o.type==='stairs_log'){S.pt+=4;S.mat.wood=(S.mat.wood||0)+5}S.orders=(S.orders||[]).filter(o=>o.type!=='stairs_log')}/* 丸太の階段はなくした：置いてあった分・持っていた分は木の階段に、依頼中の分はパワー4・木材5をもどす */{for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='stonefence')S.obj[j]='wall';if(S.inv&&S.inv.stonefence){S.inv.wall=(S.inv.wall||0)+S.inv.stonefence;delete S.inv.stonefence}if(S.recipes)delete S.recipes.stonefence;if(S.unlocked)delete S.unlocked.stonefence;for(const o of S.orders||[])if(o.type==='stonefence'){S.pt+=9;S.mat.stone=(S.mat.stone||0)+6}/* 依頼中だった分は、パワー9・石材6をもどす */S.orders=(S.orders||[]).filter(o=>o.type!=='stonefence')}/* 石の柵はなくした：置いてあった石の柵は、石の塀に */{for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='kusarug')S.obj[j]='rug1';if(S.inv&&S.inv.kusarug){S.inv.rug1=(S.inv.rug1||0)+S.inv.kusarug;delete S.inv.kusarug}for(const o of S.orders||[])if(o.type==='kusarug')o.type='rug1';if(S.recipes&&S.recipes.kusarug){delete S.recipes.kusarug;S.recipes.rug1=true}if(S.guardianIdeas)delete S.guardianIdeas.kusarug}/* 草あみのラグはなくした：ひしがたラグに */{const MV={stairs_earth:'slope_earth',slope_wood:'stairs_wood',slope_stone:'stairs_stone',slope_brick:'stairs_brick'};for(let j=0;j<S.obj.length;j++){if(MV[S.obj[j]])S.obj[j]=MV[S.obj[j]];const d=S.dyn[j];if(d&&MV[d.build])d.build=MV[d.build]}for(const id in MV){if(S.recipes)delete S.recipes[id];if(S.unlocked)delete S.unlocked[id]}}/* 土は坂だけ、木・石・レンガは階段だけ：なくした物は、同じ素材のほうにかえる */{let back=0;for(let j=0;j<S.obj.length;j++){const id=S.obj[j];if(!STAIRS.has(id))continue;{const d=stairDir(j);if(d>=0&&stairOK(j,d))continue}S.pt+=BL[id].pc;for(const k in BL[id].mat||{})S.mat[k]=(S.mat[k]||0)+BL[id].mat[k];clearObj(j);back++}if(back)setTimeout(()=>toast('置けない所の階段を'+back+'つ、パワーと素材にもどしました'),1500)}/* 前の、段差の上に切りこんだ階段（なまえのかえを先にしてから） */for(const k in S.ref){const a=S.ref[k];if(STAIRS.has(S.obj[a])&&stairDir(a)===0&&S.obj[k]==='part'){S.obj[k]='';delete S.ref[k]}}/* 手前向きの階段は1マスになった */for(const id of STAIRS){const n=(S.inv||{})[id]||0;if(n){S.pt+=n*BL[id].pc;delete S.inv[id]}for(const o of S.orders||[])if(o.type===id){S.pt+=BL[id].pc;for(const k in BL[id].mat)S.mat[k]=(S.mat[k]||0)+BL[id].mat[k]}S.orders=(S.orders||[]).filter(o=>o.type!==id);if(S.recipes)delete S.recipes[id]}/* 階段は建物になった：持っていた階段・依頼中の階段は、パワー（と素材）にもどす */{const MV={kusa:WD===1?'kuru':'shina',kare:WD===1?'chiri':'kasa'},mv=o=>{if(!o)return;for(const k in MV)if(o[k]!=null){o[MV[k]]=(o[MV[k]]||0)+o[k];delete o[k]}};mv(S.mat);mv(S.gotMat);for(const r of S.res)mv(r.cmat)}/* 草・かれ草は、草の名前ごとの素材になった */kwrSync();recSync();for(const r of S.res){delete r.swing;delete r.swingT}/* たたいた時刻（画面の時計）は、読みこみなおしたら使えない */if((S.mig||0)<1){fixBeds();dropChair2();dropBirdhouse();dropFlower();dropNtree();if(((S.subSt||{}).watch2||0)>=4){S.recipes=S.recipes||{};S.guardianIdeas=S.guardianIdeas||{};S.recipes.signpost=true;S.guardianIdeas.signpost=true}/* 見張り台を2つにしたあと（フタバの「道がわかる目印」）で、道しるべをおぼえる */S.mig=1}if(S.mig<2){if(S.flags.traded)S.flags.tradedSeen=1;if(S.flags.oracleSet)S.flags.oracleSeen=1;if(S.flags.minaCame&&S.flags.mnN==null)S.flags.mnN=S.nights||0;S.mig=2}if(S.mig<3){swingWide();S.mig=3}if(S.mig<4){recount();rugsBig();S.mig=4}if(S.mig<5){for(const r of [...S.res,...(S.lost||[]),...(S.buried||[])])if(r.vr&&r.vr.tr==='ryouri'&&r.elem!=='fire')r.vr.tr=pick(TRK(r.elem));S.mig=5}if(S.mig<6){const N=new Set([19,25,36,44,48,49,51,55,59,71,72,85,89,90,91,98,99,120,127,134,168,174,177,183,202]);S.chatRec=(S.chatRec||[]).filter(i=>!N.has(i));S.mig=6}if(S.mig<7){for(const r of [...S.res,...(S.lost||[]),...(S.buried||[])])if((NIGATE[r.elem]||{})[r.like]!=null)r.like=pick(LIKE_KEYS.filter(k=>(k!=='slide'||WD===4)&&(NIGATE[r.elem]||{})[k]==null));S.mig=7}if(S.mig<8&&S.mig>=7){if(WD===1){const fi=QUESTS.findIndex(q=>q.id==='fest');if(fi>=0&&S.quest>=fi){S.quest++;if(S.qStory!=null&&S.qStory>=fi)S.qStory++}}S.mig=8}if(S.mig<9){for(const r of [...S.res,...(S.lost||[]),...(S.buried||[])])if(r.vr&&KEYVR[r.name]&&KEYVR[r.name].tr==='nebari')r.vr.tr='nebari';S.mig=9}/* 章のはじめからいる子（フタバ・ホムラ）の特技を、ねばりづよいに *//* 火山のふもとに「おまつりをひらこう」を足したので、それより先のクエストの番号をずらす *//* 好きな遊びが、にがてなおもちゃだった子は、えらびなおす *//* 似ていた会話を、べつの会話にさしかえた：さしかえた会話は、まだしていない話にもどす *//* 料理じょうずは火の子だけ：ほかの子は、べつの特技に *//* 古いセーブを直すのは、1回だけ */setTimeout(replayTalks,2500);/* とちゅうでとじた会話を、もう一度 */if(S.flags&&S.flags.nushiDue&&!S.cleared)setTimeout(()=>{if(!S.cleared)nushiReturns()},3000);else if(!S.cleared&&(S.setSh||0)>=3&&S.flags&&!S.flags.nushiWait)setTimeout(shards3,3000);/* かけら3つの会話を、とちゅうでとじていたら、もう一度 *//* ヌシ様が帰ってくる場面を、とちゅうでとじていたら、はじめから */syncTools(S);dirty=true;closeSheet();{const F=S.flags||(S.flags={});for(const f of ['berryHalf','berryHalf2'])if(!F[f]){F[f]=1;let n=0;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='berry'&&(n++)%2){S.obj[j]='';delete S.dyn[j]}}}/* ベリーの茂みを、半分にした（前からのセーブも1回だけ） */undoStack=[];resv.clear();BAN.clear();/* ほかのステージの「もどす」・予約・しばらく行かない場所は使わない */S.res.forEach(r=>{if(r.act&&r.act.type==='watchpost'&&r.act.sx!=null){r.x=r.act.sx;r.y=r.act.sy}r.act=null;r.path=[];r.hidden=false});S.orders.forEach(o=>o.worker=null);recount();renderQuest();applyFeats();setMode('look');glassUI();
  cam.z=homeZ();centerOn(CX*TS,CY*TS);$('#title').hidden=true;$('#maps').hidden=true;started=true;stageMusic();showUI(true);if(!WD&&S.flags&&S.flags.ret1===1){S.flags.ret1=2;(S.sevQ||(S.sevQ=[])).push('ret')}}


/* ---------- マップ選択 ---------- */
const LIVE=[null,null];
function stageInfo(w){
  const live=LIVE[w];if(live&&!live.summary)return live;
  const raw=KV.getItem(SAVE_KEYS[w]);if(!raw)return null;
  // 旧セーブもマップ配列をJSON展開せず、選択画面に必要な項目だけ拾う。
  const flag=k=>new RegExp('"'+k+'"\\s*:\\s*true').test(raw);
  const lv=raw.match(/"lv"\s*:\s*(\d+)/);
  return {summary:true,world:w,introSeen:flag('introSeen'),cleared:flag('cleared'),bulk:flag('bulk'),stamps:flag('stamps'),swap:flag('swap'),dig:flag('dig'),areaSkill:flag('areaSkill'),lv:lv?+lv[1]:1,res:[]};
}
function loadStage(w){if(LIVE[w]&&!LIVE[w].summary)return LIVE[w];return LIVE[w]=load(w)}
function refreshStageInfo(){for(const w of[0,1,FREE])if(!LIVE[w]||LIVE[w].summary)LIVE[w]=stageInfo(w)}
/* ステージごとのセーブ */
/* ステージは属性の数だけ（木・火・水・土・風）と、さいごの庭 */
function freeCard(list){if(!(LIVE[0]&&LIVE[0].cleared))return;let told=false;try{told=KV.getItem('hakoniwa-freeTold')==='1'}catch(e){}if(!told){try{KV.setItem('hakoniwa-freeTold','1')}catch(e){}setTimeout(()=>toast('フリーモードが解放されました！','good'),400)}
  const L=LIVE[FREE],k=FREE,card=el(`<div class="wcard open"><canvas width="760" height="280"></canvas><div class="wb"><span class="wn">FREE MODE</span><h3>フリーモード</h3><p></p><div class="wbtns"></div></div></div>`);
  card.querySelector('p').textContent=L&&L.introSeen?(L.summary?'':'せいれい '+L.res.length+'人・')+'村レベル '+L.lv+(L.cleared?'・お祭りをひらいた！':''):'自然の力が弱く、災いもほとんどない、しずかな土地。のんびり、自分だけの村をつくろう。';
  const bt=card.querySelector('.wbtns');
  if(L&&L.introSeen){const c=el('<button class="btn pri">つづきから</button>');c.onclick=()=>{sfx('tap');$('#maps').hidden=true;continueGame(L)};bt.appendChild(c);
    const n=el('<button class="btn">はじめから</button>');n.onclick=()=>{if(n.dataset.ok){$('#maps').hidden=true;newGame(k)}else{n.dataset.ok=1;n.textContent='データを消してはじめる（もう一度タップ）';n.style.borderColor='var(--danger)'}};bt.appendChild(n)}
  else{const n=el('<button class="btn pri">あそぶ</button>');n.onclick=()=>{sfx('tap');$('#maps').hidden=true;newGame(k)};bt.appendChild(n)}
  list.appendChild(card);thumb(card.querySelector('canvas'),k,true)}
const WORLDS=[
  {name:'はじまりの草原',sub:'WORLD 1・木',el:'wood',desc:'自然の力がくずれて荒れた草原。せいれいたちと村をつくり、守護の力をとりもどそう。'},
  {name:'火山のふもとの村',sub:'WORLD 2・火',el:'fire',desc:'地面の熱が冷えきった、火の山のふもとの村。こおりかけた温泉に、ぬくもりをとりもどそう。'},
  {name:'霧のみずべの村',sub:'WORLD 3・水',el:'water',desc:'霧がはれず、水の流れが止まった村。'},
  {name:'ひびわれた岩の谷',sub:'WORLD 4・土',el:'earth',desc:'大地がひびわれ、くずれかけた谷の村。'},
  {name:'風のやんだ空の村',sub:'WORLD 5・風',el:'wind',desc:'風が止まり、しずみかけた浮き島の村。'},
  {name:'忘れられた神々の庭',sub:'WORLD 6',el:null,desc:'5つの力が生まれた場所。'},
];WORLDS[FREE]={name:'フリーモード',sub:'FREE',el:null,desc:''};
function thumb(cv2,k,open,hide){
  const c=cv2.getContext('2d');const w=cv2.width,h=cv2.height;
  if(hide){c.fillStyle='#1c1c26';c.fillRect(0,0,w,h);const li=emoImg('🔒');if(li){const ih=64,iw=ih*li.width/li.height;c.drawImage(li,w/2-iw/2,h/2-ih/2,iw,ih)}return}/* まだひらいていないステージは、絵も見せない */
  if(S&&k===(S.world||0)&&(LIVE[k]===S||!LIVE[k])){if(dirty)rebuildStatic(STATICFULL);const r=20,sw=r*2*TS,sh=sw*h/w;gblit(c,(CX-r)*TS,CY*TS-sh/2,sw,sh,0,0,w,h,true);return}
  const g=c.createLinearGradient(0,0,0,h);const GC={6:['#8cc46e','#2f5a2a'],2:['#4f7d8f','#1e3440'],3:['#7a5a3f','#2f2117'],4:['#9ec3e0','#3d5a78'],5:['#3a2a4a','#16101f']};if(k===1){g.addColorStop(0,'#8a4a35');g.addColorStop(1,'#3a201a')}else{const q=GC[k]||['#2a2a3a','#16161f'];g.addColorStop(0,q[0]);g.addColorStop(1,q[1])}
  c.fillStyle=g;c.fillRect(0,0,w,h);
  if(k===1){c.fillStyle='#5a3328';c.beginPath();c.moveTo(w*.18,h*.62);c.lineTo(w*.42,h*.16);c.lineTo(w*.58,h*.16);c.lineTo(w*.82,h*.62);c.closePath();c.fill();c.fillStyle='#ff7a3d';c.fillRect(w*.44,h*.16,w*.12,6);c.fillStyle='#7fd0e0';for(let i=0;i<3;i++){c.beginPath();c.ellipse(w*(.22+i*.28),h*(.78+(i%2)*.08),60,18,0,0,7);c.fill()}c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<9;i++){c.beginPath();c.arc(w*(.18+(i%3)*.28)+(i>>2)*6,h*(.7-(i/3|0)*.08),10+(i%3)*3,0,7);c.fill()}}
  else{c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<30;i++)c.fillRect((i*97)%w,(i*53)%h,2,2)}
  if(open)return;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,w,h);{const li=emoImg('🔒');if(li){const ih=48,iw=ih*li.width/li.height;c.drawImage(li,w/2-iw/2,h/2-ih/2,iw,ih)}}
}
const APP_VER='982';/* バージョン：PRを出すたびに、そのPRの番号に書きかえる */
function showMaps(){$('#mVer').textContent='バージョン '+APP_VER;
  refreshStageInfo();
  $('#title').hidden=true;$('#maps').hidden=false;showUI(false);started=false;
  const list=$('#mList');list.innerHTML='';freeCard(list);
  WORLDS.forEach((wd,k)=>{if(k===FREE)return;
    if(k)list.appendChild(el('<div class="wlink"></div>'));
    let w2o=false;try{w2o=KV.getItem('hakoniwa-w2open')==='1'}catch(e){}
    const L=LIVE[k]||null,open=k===0||(k===1&&!!((LIVE[0]&&LIVE[0].cleared)||L||w2o));
    const card=el(`<div class="wcard${open?' open':' lock'}"><canvas width="760" height="280"></canvas><div class="wb"><span class="wn"></span><h3></h3><p></p><div class="wbtns"></div></div></div>`);
    const hide=!open&&!(k===2&&LIVE[1]&&LIVE[1].cleared);/* まだひらいていないステージは、名前も絵も見せない */
    card.querySelector('.wn').textContent=hide?'🔒 WORLD '+(k+1):wd.sub;card.querySelector('h3').textContent=hide?'？？？':wd.name;
    let info=wd.desc;
    if(k<=1&&L&&L.introSeen)info=(L.summary?'':'せいれい '+L.res.length+'人・')+'村レベル '+L.lv+(L.cleared?'・ヌシ様が帰ってきた！':'');
    else if(k===1&&!open)info='はじまりの草原でヌシ様をむかえると、ひらきます。';
    if(k===2)info=LIVE[1]&&LIVE[1].cleared?'道がひらいた！ …けれど、まだ準備中。':'まえの土地でヌシ様をむかえると、ひらきます。';
    if(k>=3)info=k===5?'？？？':'まえの土地でヌシ様をむかえると、ひらきます。';
    card.querySelector('p').textContent=info;
    const bt=card.querySelector('.wbtns');
    if(k<=1&&open){
      if(L&&L.introSeen){const c=el('<button class="btn pri">つづきから</button>');c.onclick=()=>{sfx('tap');const go=()=>{$('#maps').hidden=true;continueGame(L)};if(k===1&&departOK())depart(go);else go()};bt.appendChild(c);
        const n=el('<button class="btn">はじめから</button>');n.onclick=()=>{if(n.dataset.ok){$('#maps').hidden=true;newGame(k)}else{n.dataset.ok=1;n.textContent='データを消してはじめる（もう一度タップ）';n.style.borderColor='var(--danger)'}};bt.appendChild(n)}
      else{const n=el('<button class="btn pri">あそぶ</button>');n.onclick=()=>{sfx('tap');const go=()=>{$('#maps').hidden=true;newGame(k)};if(k===1&&departOK())depart(go);else go()};bt.appendChild(n)}
    }
    if(k===1&&!open){let n=0;card.onclick=()=>{if(++n>=5){try{KV.setItem('hakoniwa-w2open','1')}catch(e){}sfx('arrive');showMaps()}}}/* 確認用：とじたWORLD 2を5回タップでひらく */
    list.appendChild(card);thumb(card.querySelector('canvas'),k,open,hide);
  });
  $('#mSnd').textContent=SND.bgm||SND.sfx?'♪ おと オン':'♪ おと オフ';
}
const dayNoOf=s=>Math.floor((s.t-(s.hold||0))/1440)+1;
$('#mSnd').onclick=()=>{const on=!(SND.bgm||SND.sfx);setSnd('bgm',on);setSnd('sfx',on);showMaps()};
$('#mBack').onclick=()=>{$('#maps').hidden=true;$('#title').hidden=false};
$('#tStart').onclick=()=>{audioInit();curSong=wantSong='opening';step=0;nextT=AC?AC.currentTime+.15:0;sfx('furn');const t0=Date.now(),go=()=>{if(KV.ready()||Date.now()-t0>5000)showMaps();else setTimeout(go,150)};if(!KV.ready())toast('セーブを読みこみ中…');go()};/* クラウドのセーブを待ってから、土地をえらぶ */
window.__ldDone=1;clearInterval(window.__ldT);$('#tLoad').hidden=true;if(window.__ldWant&&window.__ldWant())$('#tStart').onclick()/* 読みこみ中に「はじめる」をおしていたら、そのまま進む */

/* ---------- ループ ---------- */
let last=performance.now(),frameT=0,tutT=0,saveT=0,questT=0,running=true;
let STLD=false;let USERPAUSE=false;/* 「とめる」ボタン：ゲームの時間を止めて、ゆっくり配置を考える */
const paused=()=>USERPAUSE||!stageReady()||performance.now()<BOSSHOLD||GIFT_ACTIVE||!started||sheet!=null||!$('#dialog').hidden||!$('#lvup').hidden||!$('#rlv').hidden||NEWRES!=null||!$('#idle').hidden;
/* 寝落ち対策：2分さわらないと、時間を止める */
let lastIn=performance.now();
for(const ev of['pointerdown','keydown','wheel'])addEventListener(ev,()=>{lastIn=performance.now();const d=$('#idle');if(!d.hidden){d.hidden=true;last=performance.now()}},true);
let tutCache={k:'',t:0,v:null};
function orderTut(id){if(sheet){if(sheet!=='craft'||inv(id)>0||S.orders.some(o=>o.type===id))return{kind:'close'};const tab=craftTabFor(id);return craftTab===tab?{kind:'row'}:{kind:'tab',tab}}if(inv(id)>0)return{kind:'place'};if(S.orders.some(o=>o.type===id))return null;if(mode!=='look')return{kind:'look'};return BOARD>=0?{kind:'board'}:null}
function tutView(){/* 画面のうち、上のバーと下のパネルにかくれていない所 */const ar=$('#app').getBoundingClientRect(),q=$('#questChip').getBoundingClientRect();let b=$('#botUI').getBoundingClientRect().top;const ii=$('#itemInfo');if(!ii.hidden){const t=ii.getBoundingClientRect().top;if(t>0)b=Math.min(b,t)}return[30,q.bottom-ar.top+50,VW-30,b-ar.top-100]}
function tutSpot(id){const sz=BL[id].sz||[1,1],V=tutView(),vc=[Math.floor((cam.x+(V[0]+(V[2]-V[0])*.72)/cam.z)/TS-sz[0]/2+.5),Math.floor((cam.y+(V[1]+(V[3]-V[1])*.66)/cam.z)/TS-sz[1]/2+.5)];/* 画面の右下のマス（まん中だとじゃまなので） */
  const k=S.quest+':'+id+':'+vc;if(tutCache.k===k&&performance.now()-tutCache.t<1500)return tutCache.v;let v=null;
  const inV=(x,y)=>{const sx=((x+sz[0]/2)*TS-cam.x)*cam.z,sy=((y+sz[1]/2)*TS-cam.y)*cam.z;return sx>=V[0]&&sx<=V[2]&&sy>=V[1]&&sy<=V[3]};
  const nf=!BL[id].floor,bare=(x,y)=>fp(id,x,y).every(([a,c])=>!S.floor[c*W+a]);/* 道や床の上はなるべくさける */
  const gap=id!=='hwall'&&!HOUSES.length;/* 家の壁のすきまには、ほかの物を案内しない */
  const near=(c0,need)=>{for(const f of nf?[1,0]:[0])for(let r=0;r<14;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=c0[0]+dx,y=c0[1]+dy;if((!need||inV(x,y))&&canPlace(id,x,y,true)&&(!f||bare(x,y))&&!(gap&&fp(id,x,y).some(([a,c])=>c===CY-2&&a>=CX-5&&a<=CX-3)))return[x,y]}return null};
  if(id==='hotstone'){let bd=1e9;for(let j=0;j<W*H;j++){const x=j%W,y=(j/W)|0;if(S.ground[j]===1||S.obj[j]||adjOf(j,k=>S.ground[k]===1)<0||!canPlace(id,x,y,true))continue;const d=Math.hypot(x-CX,y-CY);if(d<bd){bd=d;v=[x,y]}}}/* 温泉の水べを指す */
  else if(id==='bed'&&HOUSES.length){for(const j of HOUSES[0].inside){const x=j%W,y=(j/W)|0;if(!S.obj[j]&&canPlace(id,x,y,true)){v=[x,y];break}}if(!v)v=near(vc,true)}/* ベッドは家の中を指す */
  else if(id==='hwall'&&QUESTS[S.quest]&&QUESTS[S.quest].id==='wall'){for(let d=3;d<=6;d++){const x=WD===1?CX+d:CX-d,y=CY-2;if(!S.obj[y*W+x]&&canPlace(id,x,y,true)){v=[x,y];break}}if(!v)v=near([WD===1?CX+3:CX-4,CY-2],false)}/* 家のすきまを指す */
  else v=near(vc,true)||near(id==='statue'?[CX,CY-8]:[CX+2,CY+2],false);/* 指は画面の右下。置けないときは、いちばん近い置ける所 */
  const pk=S.quest+':'+id;if(v&&!inV(v[0],v[1])&&tutCache.pan!==pk){tutCache.pan=pk;const s=V[1]+V[3]-VH;centerOn((v[0]+sz[0]/2)*TS,(v[1]+sz[1]/2)*TS-s/2/cam.z)}/* 見えない所なら、一度だけそこへカメラを寄せる（クエストと物ごとに1回。画面を動かしたあとに、もう一度引きもどさない） */
  tutCache={k,t:performance.now(),v,pan:tutCache.pan};return v}
function palArrows(){const b=$('#palItems');if(!b)return;const m=b.scrollWidth-b.clientWidth;$('#palL').hidden=!(m>4&&b.scrollLeft>4);$('#palR').hidden=!(m>4&&b.scrollLeft<m-4)}
function updTut(){
  const hand=$('#tutHand');const hide=()=>{hand.hidden=true};
  if(!S||GIFT_ACTIVE||!$('#dialog').hidden||!$('#lvup').hidden||!$('#rlv').hidden||!$('#title').hidden||!$('#maps').hidden||!$('#pro').hidden||S.cleared||questGuideBlockedNow())return hide();
  const q=QUESTS[S.quest];if(!q)return hide();const qt=q.id;
  let el=null,wp=null,lbl='ここをタップ',swipe=0;
  const placeHint=id=>{
    if(sheet)return;
    if(pending&&pending.kind==='one'){el=$('#cYes');lbl='「置く」をタップ';return}
    if(mode!=='build'){el=document.querySelector('#dock [data-mode="build"]');lbl='「おく」をタップ';return}
    if(sel!==id||palOpen){if(!palOpen){el=$('#palMore');lbl='「ほかをえらぶ」をタップ';return}const nm=BL[id].kind==='plant'?iname(id):BL[id].name;el=[...document.querySelectorAll('#palItems .chip')].find(c=>c.querySelector('.nm').textContent===nm);lbl=nm+'をえらぶ';
      if(el){const pr=$('#palItems').getBoundingClientRect(),cr=el.getBoundingClientRect();if(cr.top<pr.top-2||cr.bottom>pr.bottom+2)el.scrollIntoView({block:'nearest'})}return}
    const sp=tutSpot(id);if(sp){const z=BL[id].sz||[1,1];wp=[(sp[0]+z[0]/2)*TS,(sp[1]+z[1]/2)*TS];const hh=HOUSES.find(h=>h.set.has(sp[1]*W+sp[0]));lbl=hh&&!OPENH.has(hKey(hh))?'家をタップして中を見る':'置きたい場所をタップ'}};
  const lookAt=(p,l)=>{if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else{wp=p;lbl=l}};
  if(WD===0&&TALKW&&(!S.flags.talked1||!S.godGone)&&!questGuideAccepted()&&!sheet){if(TALKW===GOD&&godHere())lookAt([godX()*TS,(godY()-2)*TS],'タップして話を聞こう');else{const r=S.res.find(q=>q.name===TALKW&&!q.hidden);if(r)lookAt([r.x*TS,(r.y-1.3)*TS],'タップして話を聞こう')}}
  else if(S.qStory!=null){}/* お話を聞く前は、クエストの案内を出さない */
  else if(WD===0&&S.summon&&STATUE>=0&&!sheet&&(S.summons||0)<2)lookAt([(STATUE%W+.5)*TS,((STATUE/W)|0)*TS-58],'「！」をタップ');
  else if(S.flags.tapAsk&&!S.flags.tapped&&$('#dialog').hidden){if(sheet==='res'){el=$('#sheetX');lbl='見たら、とじる'}else if(!sheet){if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else{const r=S.res.find(q=>!q.hidden);if(r){wp=[r.x*TS,(r.y-.5)*TS];lbl='せいれいをタップ'}}}}/* 神殿のあと：せいれいをタップしてステータスを見る */
  else if(q.talk&&!S.qTalked){}/* 会話の前は、クエストの案内を出さない */
  else if(qt==='statue'){if(WD===0&&STATUE<0&&!S.obj.includes('site'))placeHint('statue')}/* 操作の案内は1章だけ */
  else if(qt==='springA'){if(inv('hotstone')>0)placeHint('hotstone')}
  else if(qt==='table'){const g=orderTut('table');if(g&&g.kind==='place')placeHint('table');else if(g&&g.kind==='close'){el=$('#sheetX');lbl='依頼ボードをとじる'}else if(g&&g.kind==='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else if(g&&g.kind==='board'){wp=[(BOARD%W+.5)*TS,((BOARD/W)|0)*TS+8];lbl='依頼ボードをタップ'}else if(g&&g.kind==='tab'){el=document.querySelectorAll('.ctab')[g.tab];lbl='「家具」をタップ'}else if(g&&g.kind==='row'){const row=[...document.querySelectorAll('#sheetBody .row')].find(r=>r.textContent.includes(BL.table.name));el=row&&row.querySelector('button');lbl=el&&el.disabled?'パワーや素材が集まるまで待とう':'食卓の「はる」をタップ'}}
  else if((qt==='stor'||qt==='mbox')&&sheet==='craft'&&S.orders.some(o=>o.type===(qt==='stor'?'stor':'mbox'))&&inv(qt==='stor'?'stor':'mbox')<=0){el=$('#sheetX');lbl='とじる'}/* はったあと：画面をとじて、できあがりを待つ */
  else if(qt==='farm6'){if(inv('farm')>0)placeHint('farm')}
  else if(qt==='imoseed'){if(imoSeedQuestPlots().length>=2)return hide();if(sheet){el=$('#sheetX');lbl='とじる'}else if(mode!=='build'){el=document.querySelector('#dock [data-mode="build"]');lbl='「おく」をタップ'}
    else if(!(sel==='seed:imo'&&cseed('imo')>0)){const c=[...document.querySelectorAll('#palItems .chip')].find(b=>b.textContent.includes(CROPS.imo.name+'のたね')&&!b.classList.contains('zero'));if(c){el=c;lbl='たねをえらぶ'}else{el=$('#palMore');lbl='ほかをえらぶ'}}
    else{let fj=-1;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].crop===null&&!imoSeedQuestPlots().includes(j)){fj=j;break}if(fj>=0){wp=[(fj%W+.5)*TS,((fj/W)|0)*TS+16];lbl='畑をタップ'}}}/* たねは「おく」からえらんで、畑をタップ */
  else if(qt==='oracle'){
    if(S.flags.oracleSet){if(sheet){el=$('#sheetX');lbl='とじて、話を聞こう'}}
    else if(sheet==='menu'&&sheetArg==='oracle'){el=document.querySelector('#sheetBody [data-oracle="food"]');lbl='好きな方針をえらぶ'}
    else if(sheet==='menu'&&!sheetArg){el=document.querySelector('#sheetBody [data-menu="oracle"]');lbl='「おつげ」をタップ'}
    else if(sheet==='menu'){el=document.querySelector('#sheetBody .back');lbl='メニューにもどる'}
    else if(sheet){el=$('#sheetX');lbl='とじてメニューをひらこう'}
    else{el=document.querySelector('#dock [data-sheet="menu"]');lbl='「メニュー」をタップ'}
  }
  else if(qt==='stor'||qt==='mbox'){const bid=qt==='stor'?'stor':'mbox',tb=craftTabFor(bid),tn=CRAFT_TABS[tb][0],bn=BL[bid].name;
    if(inv(bid)>0)placeHint(bid);
    else if(!S.orders.some(o=>o.type===bid)){
      if(sheet==='craft'){if(craftTab!==tb){el=document.querySelectorAll('.ctab')[tb];lbl='「'+tn+'」をタップ'}else{const row=[...document.querySelectorAll('#sheetBody .row')].find(r=>r.textContent.includes(bn));el=row&&row.querySelector('button');lbl=el&&el.disabled?'木材が集まるまで待とう':'「はる」をタップ'}}
      else if(!sheet){if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else if(BOARD>=0){wp=[(BOARD%W+.5)*TS,((BOARD/W)|0)*TS+8];lbl='依頼ボードをタップ'}}}}
  else if(qt==='fence4'){if(inv('fence')>0)placeHint('fence')}
  else if(qt==='wall'){if(inv('hwall')>0)placeHint('hwall')}
  else if(qt==='bed'){if(inv('bed')>0)placeHint('bed')}
  else if(qt==='watch1'){if(watchQ())placeHint('watch');else if(inv('spike')>0&&(S.placed.spike||0)<2)placeHint('spike')}
  else if(qt==='trade'){if(sheet==='shop'){if(S.flags.traded){el=$('#shopEnd');lbl='交換がおわったら「交換をおわる」'}else{el=[...document.querySelectorAll('#sheetBody .btn.pri')].find(b=>!b.disabled);lbl='交換してみよう'}}else if(!sheet&&godHere()){if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else{wp=[godX()*TS,(godY()-.2)*TS];lbl='カミサマをタップ'}}}
  let x,y;
  if(el){const r=el.getBoundingClientRect(),ar=$('#app').getBoundingClientRect();if(!r.width)return hide();x=r.left-ar.left+r.width/2;y=r.top-ar.top+r.height/2}
  else if(wp){const ar=$('#app').getBoundingClientRect(),cr=cv.getBoundingClientRect();x=cr.left-ar.left+(wp[0]-cam.x)*cam.z*(cr.width/VW);y=cr.top-ar.top+(wp[1]-cam.y)*cam.z*(cr.height/VH);if(x<0||y<0||x>ar.width||y>ar.height)return hide()}
  else return hide();
  hand.hidden=false;hand.style.transform='translate('+x+'px,'+y+'px)';hand.classList.toggle('up',y<120);hand.classList.toggle('down',!swipe&&y>innerHeight-110);// 画面の下のほうは指を上から向ける
  hand.classList.toggle('swipe',!!swipe);hand.classList.toggle('rev',swipe<0);hand.querySelector('.lbl').textContent=lbl;{const L=hand.querySelector('.lbl');L.style.marginLeft='0px';const lr=L.getBoundingClientRect();let sh=0;if(lr.right>innerWidth-8)sh=innerWidth-8-lr.right;else if(lr.left<8)sh=8-lr.left;L.style.marginLeft=sh+'px'}// ラベルが画面からはみ出さないように
}
function frameErr(w,e){/* 1コマで失敗しても、表示（HUD）の更新や次のコマは止めない。原因をたどれるよう、メッセージをのこす */const m=w+': '+(e&&e.message)+' @'+((e&&e.stack||'').split('\n')[1]||'').replace(/^.*[\/\\]/,'').slice(-60);window.__frameErr=m;if(frameErr.last!==m){frameErr.last=m;console.error(m);try{toast('エラー '+m)}catch(x){}}}
function stepLooks(now,rdt){/* 見た目だけの動き（ドアの開け閉め・屋根のすけぐあい・まばたき・勇ましい顔・あらわれる演出）を、1コマに1回進める */
  const kd=1-Math.pow(.7,rdt*30);for(const[i,d]of DOOROP){if(!S.obj[i]){DOOROP.delete(i);continue}const near=S.res.some(r=>!r.hidden&&((r.y|0)*W+(r.x|0)===i||r.path&&r.path.length&&r.act&&r.act.stage==='walk'&&(r.path[0]===i||r.path[1]===i)&&Math.abs(r.x-d.cx)<d.ax+1&&Math.abs(r.y-d.cy)<d.ay+1));if(near&&d.op<.03)sfxAt('door',d.cx,d.cy);d.op+=((near?1:0)-d.op)*kd}/* ドアを通る子がいるときだけ開く：ドアのマスにいる子か、歩いていて、つぎの2マスのうちにドアを通る子（近くで休んだり遊んだりしているだけでは開かない）。開きはじめにガチャ */
  const dt=Math.min(.1,rdt);for(const[k,v]of ROOFS){const tg=OPENH.has(k)?0:1;v.a+=Math.sign(tg-v.a)*Math.min(Math.abs(tg-v.a),dt*5)}
  for(const r of S.res){
    if(r.spawnT&&now-r.spawnT>=1300){r.spawnT=0;JUMP.set(r,now)}
    if(isWatch(r)&&(r.act&&r.act.type==='patrol'&&r.act.hunt!=null||now-(r.swing||-1e9)<900&&now>=(r.swing||0)))BRAVET.set(r,now);/* 勇ましい顔は、ちらちら消えないよう、1.5秒つづける */
    const v=SPV.get(r);if(v&&now>v.bl+140)v.bl=now+2500+Math.random()*3500}}
function frame(now){
  if(!running)return;requestAnimationFrame(frame);
  const menuOpen=!$('#title').hidden||!$('#maps').hidden;
  if(!S){last=now;return}
  if(now-frameT<(menuOpen?125:31))return;frameT=now;
  if(!stageReady()&&started){if(GRD.job&&GRD.job.s!==S)GRD.job=null;if(GRD.job)stageStep(now);else{if(GRD.wS!==S){GRD.wS=S;GRD.w0=now}if(assetsOK()||now-GRD.w0>20000)GRD.job=stageJob()}}/* ステージを開いたら、絵がぜんぶ読みこめてから、マップ全体を先に作る（ゲーム中に作らない） */
  {const ld=started&&!stageReady()&&!menuOpen&&$('#pro').hidden;if(ld||ld!==STLD){STLD=ld;stageLoading(ld)}}/* 作りおわるまで「マップを読みこみ中…」でマップをかくす *//* タイトルは静止画なので8コマ/秒。ゲーム中は30コマ/秒 */
  if(now-tutT>120){tutT=now;try{palArrows();updTut()}catch(e){}}
  const rdt=Math.min(.25,(now-last)/1000);last=now;
  const PZ=started&&sheet!=null,prdt=PZ?0:rdt;/* メニューを開いているあいだは、アニメーションも止める */
  if(camAnim){camAnim.t+=rdt;const p=Math.min(1,camAnim.t/camAnim.dur),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;cam.z=camAnim.fz+(camAnim.tz-camAnim.fz)*e;centerOn(camAnim.fx+(camAnim.tx-camAnim.fx)*e,camAnim.fy+(camAnim.ty-camAnim.fy)*e);if(p>=1){const d=camAnim.done;camAnim=null;if(d)d()}}
  if(started&&!window.__noIdle&&now-lastIn>120000&&$('#idle').hidden&&$('#title').hidden&&$('#maps').hidden){$('#idle').hidden=false;try{save()}catch(e){}}
  if(SKIP&&!(isNight()&&S.enemyOn))SKIP=false;/* 朝になったら、ふつうの速さにもどす */
  if(started&&!menuOpen&&$('#pro').hidden&&sheet==null&&NEWRES==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden){showItemGift();showSpotPop()}
  if(!paused()){if(S.speed>1&&!TESTSPD&&!TESTM){S.glassT=Math.max(0,(S.glassT||0)-rdt);if(S.glassT<=0)S.speed=1}glassUI();LIGHTCD=Math.max(0,LIGHTCD-rdt*S.speed*(SKIP?40:1));AREACD=Math.max(0,AREACD-rdt*S.speed*(SKIP?40:1));let g=rdt*MIN_PER_SEC*S.speed*(SKIP?40:1);while(g>0){const s=Math.min(g,2);try{stepWorld(s)}catch(e){frameErr('step',e);break}g-=s;if(performance.now()<BOSSHOLD)break}/* オオカゲの登場・撃破で止めたら、残りは進めない */}
  for(const f of floats)f.life-=prdt*.7;while(floats.length&&floats[0].life<=0)floats.shift();
  for(const s of shots)s.life-=prdt*1.4;while(shots.length&&shots[0].life<=0)shots.shift();
  for(const f of fx){f.life-=prdt*(f.k==='ring'?(f.col?1.3:2.2):f.k==='pillar'?.9:f.k==='slash'?3:1.4);if(f.k!=='ring'&&f.k!=='pillar'&&!PZ){f.x+=f.vx*rdt;f.y+=f.vy*rdt;f.vy+=(f.k==='p'?260:40)*rdt;f.vx*=.96}}
  for(let i=fx.length-1;i>=0;i--)if(fx[i].life<=0)fx.splice(i,1);
  for(const m of motes){m.y-=prdt*.012*m.s;m.x+=Math.sin(now/2000+m.p)*prdt*.004;if(m.y<0){m.y=1;m.x=Math.random()}}
  if(S.rain)for(const d of rain){d.y+=prdt*1.2*d.s;if(d.y>1){d.y=0;d.x=Math.random()}}
  stepLooks(now,rdt);
  if(!PZ&&!menuOpen&&$('#pro').hidden&&stageReady()){try{render(now)}catch(e){frameErr('render',e)}}/* タイトル・導入会話・メニュー中は、背景ワールドを描かない */
  if(AC)wantSong=(!$('#title').hidden||!$('#maps').hidden||!$('#pro').hidden)?'opening':(isDark()?'night':'day');
  if(started){hudT+=rdt;if(hudT>.3){hudT=0;updHUD()}
    if(!GIFT_ACTIVE&&RLVQ.length&&sheet==null&&NEWRES==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden)rlvShow(RLVQ.shift());
    if(!GIFT_ACTIVE&&NEWQ.length&&NEWRES==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden&&performance.now()>=NEWQ[0].t){const q=NEWQ.shift();if(S.res.some(x=>x.id===q.id)){NEWRES=q.id;resTab=0;sfx('next');openSheet('res',q.id)}else HOLD.delete(q.id)}
    questT+=rdt;if(questT>1&&!GIFT_ACTIVE){questT=0;checkLevel();checkQuest()}
    saveT+=rdt;if(saveT>10){saveT=0;save()}}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;save();KV.push(true);if(AC)AC.suspend()}else{if(AC)AC.resume();if(!running){running=true;last=performance.now();requestAnimationFrame(frame)}}});
addEventListener('pagehide',()=>{save();KV.push(true)});
addEventListener('resize',resize);
/* 一度画面をとじて戻ると音が止まったままになる（iOS）→ 次のタッチで鳴らしなおす */
for(const ev of ['pointerdown','touchend','click'])document.addEventListener(ev,()=>{if(AC&&AC.state!=='running'&&!document.hidden)AC.resume().catch(()=>{})},true);addEventListener('focus',()=>{if(AC&&AC.state!=='running')AC.resume().catch(()=>{})});

$('#alert').addEventListener('click',()=>{const L=S.enemies.filter(e=>e.spawned&&!e.dead);if(!L.length)return;ALI=(ALI+1)%L.length;const e=L[ALI];centerOn(e.x*TS,e.y*TS);sfx('tap')});/* 「コワイノ ○体」をタップすると、その場所へ */
$('#guardStatus').addEventListener('click',e=>{e.stopPropagation();if(!S||!started)return;if(LIGHTCD>0)return toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒');if(S.pt<1)return toast('パワーが足りません');sfx('tap');LIGHTARM=!LIGHTARM;AREAARM=false;if(LIGHTARM)toast('光をあてる物をタップ')});
$('#areaBtn').addEventListener('click',e=>{e.stopPropagation();if(AREACD>0)return toast('ひかりのはどうは、あと'+Math.ceil(AREACD/(S.speed||1))+'秒');if(S.pt<3)return toast('パワーが足りません');sfx('tap');AREAARM=!AREAARM;LIGHTARM=false;if(AREAARM)toast('光をはなつ場所をタップ')});
$('#skipBtn').addEventListener('click',()=>{if(!canSkip())return;sfx('tap');SKIP=true;$('#skipBtn').hidden=true;toast('朝まで休もう…','good')});
let RLVR=null;
function rlvShow(q){const r=S.res.find(x=>x.id===q.id);if(!r)return;RLVR=r;const o=$('#rlv'),a=rStat(r,q.from),b=rStat(r,q.to);
  const pt=o.querySelector('.rpt');pt.style.backgroundImage='url('+spiritPort(r.elem,96,r.vr)+')';pt.style.boxShadow='inset 0 0 0 3px '+ELEM[r.elem].col;
  o.querySelector('.rtt').innerHTML='';o.querySelector('.rtt').append(r.name+' が ',Object.assign(document.createElement('b'),{textContent:'Lv'+q.to}),' になった！');
  const g=o.querySelector('.rrows');g.innerHTML='';for(const[k,n]of RSTN){const f=v=>k==='bonus'?'+'+v:k==='atk'&&!v?'なし':String(v);const up=b[k]!==a[k];const x=document.createElement('span'),y=document.createElement('span');x.textContent=n;y.textContent=up?f(a[k])+' → '+f(b[k]):f(b[k]);if(up)y.className='up';g.append(x,y)}
  if(q.to===3||q.to===5||q.to===10)memo('⬆️',r.name+'がLv'+q.to+'になった');o.hidden=false;sfx('quest')}
$('#rlvOk').addEventListener('click',e=>{e.stopPropagation();sfx('tap');$('#rlv').hidden=true;const r=RLVR;RLVR=null;if(r&&S.res.includes(r)){const t=performance.now();JOYU.set(r,t+2600);RHOLD.set(r,t+2600);JUMP.set(r,t);r.bubble='😆'}});/* レベルアップしたら、手をとめて喜ぶ */
for(const id of['#foodStk','#matStk']){const e=$(id);const go=ev=>{if(ev)ev.stopPropagation();if(!started||!S)return;sfx('tap');openSheet('inv')};e.addEventListener('click',go);e.addEventListener('keydown',k=>{if(k.key==='Enter'||k.key===' ')go()})}/* 食料・素材の数をタップすると、そうこが見られる */
$('#lvOk').addEventListener('click',e=>{e.stopPropagation();sfx('tap');$('#lvup').hidden=true;endClap()});
document.querySelector('.hud').addEventListener('click',()=>{if(!S)return;sfx('tap');openSheet('vill')});/* HUD をタップすると村のようす */
$('#dock').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sfx('tap');if(b.dataset.mode)setMode(b.dataset.mode);else if(b.dataset.sheet)openSheet(b.dataset.sheet)});
$('#sheetX').onclick=closeSheet;$('#scrim').onclick=closeSheet;
$('#questChip').onclick=()=>openSheet('menu','goal');/* 目標の一覧を直接ひらく */
$('#pauseBtn').onclick=()=>{sfx('tap');USERPAUSE=!USERPAUSE;$('#pauseIc').style.display=USERPAUSE?'none':'';$('#playIc').style.display=USERPAUSE?'':'none';$('#pauseBtn').setAttribute('aria-label',USERPAUSE?'うごかす':'とめる');$('#pauseBtn').classList.toggle('on',USERPAUSE)};
$('#speedBtn').onclick=()=>{if(!(hasGlass()||TESTM)){if(glassUnlocked())adPrompt();return}sfx('tap');S.speed=S.speed===1?2:S.speed===2&&TESTM?3:S.speed===3&&TESTM?5:1;/* 広告でできるのは2倍まで */glassUI()};
$('#helpPop').onclick=()=>{sfx('tap');$('#helpPop').hidden=true};$('#undoBtn').onclick=undo;$('#palL').onclick=()=>$('#palItems').scrollBy({left:-$('#palItems').clientWidth*.7,behavior:'smooth'});$('#palR').onclick=()=>$('#palItems').scrollBy({left:$('#palItems').clientWidth*.7,behavior:'smooth'});$('#palItems').addEventListener('scroll',palArrows,{passive:true});
$('#cYes').onclick=confirmYes;$('#cRot').onclick=e=>{e.stopPropagation();rotPending()};$('#cNo').onclick=()=>{pending=null;selRect=null;$('#confirm').hidden=true};

/* ---------- 起動 ---------- */
resize();
showUI(false);$('#app').classList.add('ready');
KV.onCloud(()=>{if(started)return;if(!$('#maps').hidden)showMaps()});
requestAnimationFrame(frame);
window.__game={get doSummon(){return doSummon},get pinkPrompts(){return {...SEVW}},checkSev,sevTalk,get RECIPES(){return RECIPES},subTalk,walk,hour,nushiReturns,centerOn,rebuild(){rebuildStatic(true)},get cam(){return cam},get avoidPath(){return avoidPath},get bfs(){return bfs},get moveR(){return moveR},get sepRes(){return sepRes},get pathTo(){return pathTo},dialog,get drawObj(){return drawObj},get drawFloor(){return drawFloor},get drawShade(){return drawShade},set ICON(v){ICON=v},openSheet,get S(){return S},stepWorld,place,spawnWave,waveFor,checkLevel,checkQuest,newGame,orderFurn,recount,get ATTR(){return ATTR},get BASEPCT(){return BASEPCT}};
