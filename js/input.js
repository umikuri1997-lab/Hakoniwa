'use strict';

/* ---------- カメラ・入力 ---------- */
function minZ(){return Math.max(.3,Math.min(VW/(W*TS),VH/(H*TS)))}
function clampCam(){
  cam.z=clamp(cam.z,minZ(),3);
  const vw=VW/cam.z,vh=VH/cam.z;
  cam.x=vw>=W*TS?(W*TS-vw)/2:clamp(cam.x,-40,W*TS-vw+40);
  cam.y=vh>=H*TS?(H*TS-vh)/2:clamp(cam.y,-80,H*TS-vh+(performance.now()<(window.BOSSCAM||0)?vh/2+120:120));/* オオカゲの登場のあいだは、南のはしのオオカゲも画面のまん中に */
}
function resize(){dpr=Math.min(window.devicePixelRatio||1,1.25);/* 発熱対策で解像度をおさえる */VW=innerWidth;VH=innerHeight;cv.width=VW*dpr|0;cv.height=VH*dpr|0;cv.style.width=VW+'px';cv.style.height=VH+'px';clampCam()}
function panTo(wx,wy){camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:wx,ty:wy,t:0,dur:.6}}/* 話しかけた子を、画面の中央へ */
function centerOn(wx,wy){cam.x=wx-VW/cam.z/2;cam.y=wy-VH/cam.z/2;clampCam()}
const homeZ=()=>Math.max(minZ(),Math.min(2.2,VW/(13*TS)));
const toWorld=(sx,sy)=>({x:cam.x+sx/cam.z,y:cam.y+sy/cam.z});

let mode='look',sel='farm',selStamp=null;
const ptrs=new Map();let gest=null;
cv.addEventListener('pointerdown',e=>{
  if(!started)return;camAnim=null;
  cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1)gest={type:'maybe',sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y};
  else if(ptrs.size===2){const[p,q]=[...ptrs.values()];gest={type:'pinch',d:Math.hypot(p.x-q.x,p.y-q.y),z:cam.z,mid:toWorld((p.x+q.x)/2,(p.y+q.y)/2)};if(selRect&&!pending)selRect=null}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!gest)return;
  if(gest.type==='pinch'&&ptrs.size>=2){const[p,q]=[...ptrs.values()];const d=Math.hypot(p.x-q.x,p.y-q.y);cam.z=clamp(gest.z*d/gest.d,minZ(),3);const mx=(p.x+q.x)/2,my=(p.y+q.y)/2;cam.x=gest.mid.x-mx/cam.z;cam.y=gest.mid.y-my/cam.z;clampCam();return}
  const dx=e.clientX-gest.sx,dy=e.clientY-gest.sy;
  if(gest.type==='maybe'&&Math.hypot(dx,dy)>8){
    const k=BL[sel]&&BL[sel].kind;
    if(mode==='bulk'&&!selStamp&&S.bulk&&(k==='block'&&S.unlocked[sel]||k==='plant'&&usable(sel)||sel==='spike'&&usable(sel))){let w=toWorld(gest.sx,gest.sy);{const tl=tapLv(w.x,w.y);if(tl)w={x:w.x,y:w.y+tl*LIFT}}gest.type='rect';gest.a={x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)};$('#confirm').hidden=true;pending=null}
    else gest.type='pan'}
  if(gest.type==='pan'){cam.x=gest.cx-dx/cam.z;cam.y=gest.cy-dy/cam.z;clampCam()}
  if(gest.type==='rect'){let w=toWorld(e.clientX,e.clientY);{const tl=tapLv(w.x,w.y);if(tl)w={x:w.x,y:w.y+tl*LIFT}}selRect={a:gest.a,b:{x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)}}}
});
function endPtr(e){
  if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(gest&&gest.type==='maybe'&&e.type==='pointerup')onTap(e.clientX,e.clientY);
  else if(gest&&gest.type==='rect'&&selRect)askBulk(sel,rectCells(selRect.a,selRect.b));
  if(ptrs.size===1){const p=[...ptrs.values()][0];gest={type:'pan',sx:p.x,sy:p.y,cx:cam.x,cy:cam.y}}else if(!ptrs.size)gest=null;
}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();if(!started)return;const w=toWorld(e.clientX,e.clientY);cam.z=clamp(cam.z*(e.deltaY<0?1.12:.89),minZ(),3);cam.x=w.x-e.clientX/cam.z;cam.y=w.y-e.clientY/cam.z;clampCam()},{passive:false});

const tapY=r=>r.y-(r.act&&r.act.type==='watchpost'&&r.act.stage==='do'?WPLIFT*Math.min(1,r.act.cl||0)/TS:0);/* 見張り台の上の子は、上に描いた所でタップする（見張り台の足もとをタップしても、子をえらばない） */
function tapLv(wx,wy){if(!S||!S.hi)return 0;const tx=Math.floor(wx/TS);if(tx<0||tx>=W)return 0;for(let lv=HMAX;lv>=1;lv--){const ty=Math.floor((wy+lv*LIFT)/TS);if(ty>=0&&ty<H&&hiAt(ty*W+tx)===lv)return lv}return 0}/* タップした所に見えている、いちばん手前の高い段 */
function onTap(sx,sy){DLGTAP=performance.now();/* タップで始める会話は、またずにすぐ出す */
  let w=toWorld(sx,sy);const tx=Math.floor(w.x/TS);{const tl=tapLv(w.x,w.y);if(tl)w={x:w.x,y:w.y+tl*LIFT}}const ty=Math.floor(w.y/TS);/* 高い段のマス・物・せいれい・コワイノは上にずらして描くので、タップの場所も高さの分だけ下へもどす */
  if(AREAARM){AREAARM=false;return areaBlast(w.x/TS,w.y/TS)}/* ひかりのはどう：タップした場所のまわり */
  if(LIGHTARM){LIGHTARM=false;const en=S.enemies.find(e=>e.spawned&&Math.hypot(e.x-w.x/TS,e.y-w.y/TS)<.8);if(en)return guardLight(en);const tj=ty*W+tx;if(tx>=0&&ty>=0&&tx<W&&ty<H&&LIGHTNAT[S.obj[tj]]&&!isBud(tj))return natLight(tj)}/* 守りの光：アイコンのあとにタップした「コワイノ」・木・岩にあてる */
  const si=S.seeds.findIndex(s=>s.x===tx&&s.y===ty);
  if(tx>=0&&ty>=0&&tx<W&&ty<H){const hh=HOUSES.find(h=>h.set.has(ty*W+tx));/* 開けた屋根は、壁をタップするまでそのまま */
    if(hh&&mode!=='look'&&!OPENH.has(hKey(hh))){OPENH.add(hKey(hh));dirty=true;return}}/* 置く・こわすときも、まず家をタップして中を見る */
  if(si>=0){sfx('seed');S.seeds.splice(si,1);S.mseed=(S.mseed||0)+1;S.mseedGot=(S.mseedGot||0)+1;addFloat(tx+.5,ty,'ふしぎな種+1','#d8f5c0');burstAt(tx,ty,'plant');toast('ふしぎな種をひろった','good');return}
  if(mode==='look'){
    const en=S.enemies.find(e=>e.spawned&&Math.hypot(e.x-w.x/TS,e.y-w.y/TS)<.8);
    if(en)return;/* 「コワイノ」に守りの光をあてるのは、アイコンをえらんでから */
    {const st=festStalls().find(t=>Math.abs(w.x/TS-(t.x+.5))<1.3&&w.y/TS>t.y-2.6&&w.y/TS<t.y+1);if(st){sfx('tap');openSheet('stall',st.x);return}}/* 屋台をタップすると、その屋台の品物 */
    if(godHere()&&Math.hypot(w.x/TS-godX(),w.y/TS-godY())<1.1){if(TALKW===GOD)return startTalk();if(S.feat.shop){const ln=pick(S.pt<2?GOD_POOR:GOD_SHOP);return dialog([[GOD,ln]],()=>{openSheet('shop');shopSay=ln;renderSheet()},'交換する')}toast('カミサマ「'+pick(GOD_IDLE)+'」');return}
    if(S.nushi&&Math.hypot(w.x/TS-S.nushi.x,w.y/TS-(S.nushi.y-.6))<1.4){sfx('tap');return nushiTalk()}/* ヌシ様と話す */
    if(S.cleared){const tw=S.obj.indexOf('tower');if(tw>=0&&Math.hypot(w.x/TS-(tw%W+1),w.y/TS-((tw/W|0)+.6))<1.4)return openSheet('travel')}/* クリア後は、台座から次の土地へ */
    if(sumHit(w.x/TS,w.y/TS))return doSummon();
    if(TALKW===GOD&&godHere()&&Math.hypot(w.x/TS-godX(),w.y/TS-(godY()-1.6))<1.2)return startTalk();
    if(TALKW){const tr=S.res.find(r=>r.name===TALKW&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(tr&&Math.hypot(tr.x-w.x/TS,(tapY(tr)-1)-w.y/TS)<1.4){panTo(tr.x*TS,(tr.y-.7)*TS);return startTalk()}}
    {const tr=S.res.find(r=>SEVW[r.name]&&!r.hidden&&!(r.act&&r.act.type==='sleep')&&Math.hypot(r.x-w.x/TS,(tapY(r)-1)-w.y/TS)<1.4);if(tr)return sevTalk(SEVW[tr.name])}
    {const tr=S.res.find(r=>SUBW[r.name]&&!r.hidden&&!(r.act&&r.act.type==='sleep')&&Math.hypot(r.x-w.x/TS,(tapY(r)-1)-w.y/TS)<1.4);if(tr){panTo(tr.x*TS,(tr.y-.7)*TS);return subTalk(SUBW[tr.name])}}
    let best=null,bd=1.1;for(const r of S.res){if(r.hidden&&!peekH(r))continue;const d=Math.hypot(r.x-w.x/TS,(tapY(r)-.5)-w.y/TS);if(d<bd){bd=d;best=r}}
    if(best&&best.act&&(best.act.type==='chat'||best.act.type==='rest')&&best.act.stage==='do'&&best.act.topic!=null&&best.act.seen!==best.act.topic){const p=S.res.find(q=>q.id===best.act.partner);if(p){const A=best.act.sub?p:best,B=best.act.sub?best:p;const C=CHATS[best.act.topic];for(const q of [A,B])if(q.act&&q.act.topic===best.act.topic)q.act.seen=best.act.topic;/* 一度見たおしゃべりは、もう一度タップしても出さない（ようすを出す） */return dialog(C.map((l,i)=>{const sp=l[0]?B:A;return [sp.name,((C.el&&!l[0])?l[1]:chatTone(l[1],sp,i)).replace(/@([HMK])/g,(m,c)=>sevName(c))]}),C.wave?()=>{A.waveU=B.waveU=S.t+4}:null)}}/* おしゃべり中の子をタップすると、会話が見られる */
    if(best){if(!S.flags.tapped&&S.flags.tapAsk){S.flags.tapPend=true}voiceHmm(best);return openSheet('res',best.id)}// ステータスを見て閉じたら、会話に進む
    if(tx<0||ty<0||tx>=W||ty>=H)return;
    {const j=anc(ty*W+tx);if(!isNight()&&godFix(S.obj[j]?j:ty*W+tx))return}/* こわれかけ・こわれた物は、守り神がパワーで直せる */
    {const hi=HOUSES.findIndex(h=>h.set.has(ty*W+tx));if(hi>=0){const hk=hKey(HOUSES[hi]);if(!OPENH.has(hk)){OPENH.add(hk);dirty=true;return}/* 1回目のタップで屋根を外す */const o0=S.obj[anc(ty*W+tx)];if(HOME_WALLS.has(o0)||HOME_DOORS.has(o0)){OPENH.delete(hk);dirty=true;return}/* 壁をタップすると屋根がもどる */if(!o0)return openSheet('house',hi)}}// 中が見えているときは、家具やせいれいもタップできる
    const j=anc(ty*W+tx),o=S.obj[j];
    if(WD===0&&S.flags.kgMark!=null&&!S.bossKills&&Math.abs(tx-S.flags.kgMark%W)<=1&&Math.abs(ty-((S.flags.kgMark/W)|0))<=1){if(!S.flags.kgLook){S.flags.kgLook=true;checkQuest()}return toast('大きなかげのあと：草がしおれて、つめたい')}/* 大きなかげのあとを調べる */
    if(WD===1&&S.st2){const g=ty*W+tx;
      if(S.ground[g]===1&&!o){const k=sprMap()[g];if(k){if(!S.flags.sprLook){S.flags.sprLook=true;checkQuest()}return toast(SPN[k]+'：'+(springOn(k)?'あたたかい湯がわいている':S.st2.sp[k]?'装置がこわれて、湯が冷めている':'冷たい水…熱がとどいていない'))}}
      if(o==='volcano'){if(!S.flags.volLook){S.flags.volLook=true;checkQuest()}return toast('火山：ふもとから、熱の道が村へのびている')}
      if(o==='heatv')return openSheet('heatv',j);
      if(o==='boulder')return toast('大岩：のこり '+Math.max(0,4-(S.hp['n'+j]||0))+'/4');
      if(o==='crack'){if((S.mat.stone||0)<2)return toast('ひびわれ：石材2で直せる（いま石材'+(S.mat.stone||0)+'）');S.mat.stone-=2;clearObj(j);S.floor[j]='path';burst(j,'block');sfx('level');recount();dirty=true;toast('ひびわれを直した（石材-2）','good');return checkQuest()}}
    {const g=ty*W+tx,dp=(S.drops||[]).find(q=>q.y*W+q.x===g&&q.id!=='shard');if(WEEDS.has(o)||dp){if((WEEDS.has(o)||dp.id.startsWith('mat:'))&&matCap()-matTot()<=0)return toast('素材箱に入りません');if(dp&&dp.id.startsWith('food:')&&foodCap()-S.food<=0)return toast('食料箱に入りません');let nm;if(WEEDS.has(o)){(S.wreq||(S.wreq={}))[j]=1;nm=BL[o].name}else{dp.tap=1;nm=dp.id.startsWith('mat:')?(MATN[dp.id.slice(4)]||'おとしもの'):'おとしもの'}sfx('tap');return toast(nm+'：せいれいがとりにいく'+'')}}/* 草・きのこ・枝などの落とし物は、タップすると、せいれいがとりにいく */
    if(HOME_WALLS.has(o)||HOME_DOORS.has(o)){const w=houseWhy(j);if(w)toast(w)}/* 家にならないかべ・ドアをタップすると、理由を出す */
    if(o&&rangeOf(o,j))SHOWR={j,o,until:performance.now()+4000};
    if(o==='farm')return openSheet('farm',j);
    if(BEDSET.has(o))return openSheet('bed',j);
    if(o==='stor')return openSheet('food');
    if(o==='oven')return openSheet('oven',j);
    if(o==='plot')return toast('耕す前の畑：せいれいが耕しにくる');
    if(o==='sprout')return toast(BL[S.dyn[j].plant].name+'を植える場所：せいれいが植えにくる');
    if(o==='site'){const d=S.dyn[j];return toast(BL[d.build].name+'を建設中：'+Math.floor(d.p/d.need*100)+'%')}
    if(o==='berry'||o==='fruit'){const g=(S.dyn[j]||{g:0}).g;return toast(BL[o].name+'：'+(g>=100?'実がなっている':'実がなるまで あと'+Math.max(1,Math.ceil((100-g)/25))+'日'))}/* タップで見るだけ（セーブの中身はかえない） */
    const fw=o&&(FENCE_IDS.has(o)||HOME_WALLS.has(o)||HOME_DOORS.has(o));/* 柵・塀・家の壁・ドア・門は、短い知らせのまま */
    if(fw&&breakable(o)&&BL[o].brk)return toast(BL[o].name+'：'+withAttr(o,BL[o].desc||'')+'（じょうぶさ '+Math.floor(S.hp[j]??BL[o].hp)+'/'+BL[o].hp+'）');
    if(fw&&breakable(o))return toast(BL[o].name+'：じょうぶさ '+Math.floor(S.hp[j]??BL[o].hp)+'/'+BL[o].hp);
    if(o==='rock'||o==='deadtree'||o==='ntree'||o==='bamboo')return toast(BL[o].name+'：のこり '+Math.max(0,10-(S.hp['n'+j]||0))+'/10');
    if(o==='takenoko')return toast('たけのこ：あと '+Math.max(1,3-((S.dyn[j]||{}).age||0))+'日で竹になる');
    if(o==='watch'||o==='yogan')return openSheet('watch',j);
    if(o==='obox')return S.feat.inv?openSheet('inv'):toast('おそなえ箱');
    if(o==='grave'){const d=S.dyn[j]||{};if(!d.buried)return toast((d.name||'せいれい')+'のお墓。なかまが神殿へはこんで、おみおくりしてくれる');/* 守り神は埋葬できない */return toast((d.name||'せいれい')+'のお墓')}
    if(o==='tower'&&!WD&&!S.cleared){const av=(S.shards||0)-(S.setSh||0);if(av>0&&(S.setSh||0)>=2){const NM=['木のせいれい','守護の台座','ヌシのかけら','みどりのマス','せいれいパワー'],miss=clearConds().findIndex(c=>!c[1]);if(miss>=0)return toast(NM[miss]+'が足りません','warn')}/* 3つ目をはめるときも、5つの条件がそろっているか見る */if(av>0){S.setSh=(S.setSh||0)+1;sfx('shard');burst(j,'furn','none');toast('台座に、ヌシのかけらをはめた（'+S.setSh+'/3）','good');logEv('かけらを台座にはめた');if(S.setSh>=3)setTimeout(shards3,900);checkQuest();return}return openSheet('clear')}
    if(o==='board')return S.feat.craft?openSheet('craft'):toast('依頼ボード。もう少ししたら使えるようになる');
    if(o==='statue')return toast('女神像。守り神の居場所');
    if(o==='altar')return toast('カミサマの台座。カミサマはここに現れる');
    if(o&&BL[o].kind==='furn'&&!BL[o].trap&&!fw)return openSheet('furn',j);/* 家具：説明と、向きをかえる */
    if(!o&&RUGC.has(ty*W+tx))return openSheet('furn',RUGC.get(ty*W+tx));/* ラグ */
    if(o&&fw)return toast(BL[o].name+'：'+withAttr(o,BL[o].desc||''));
    if(o)return openSheet('furn',j);/* 噴水・建物・植物・ワナなども、下から説明を出す */
    if(S.ground[j]===1)return toast('池。そばでつりができる');
    return toast(REV.has(j)?'よみがえった土地':'荒れた土地。まわりに何か置くと、よみがえる');
  }
  if((mode==='build'||mode==='remove'||mode==='bulk')&&nightLock())return toast('夜のあいだは、置くことも、こわすこともできません');
  if(mode==='build'){if(BL[sel]&&['furn','build','deco'].includes(BL[sel].kind)&&!BL[sel].trap){/* ワナは柵と同じで、タップするたびにそのまま置く */if(!usable(sel))return place(sel,tx,ty);const ok=canPlace(sel,tx,ty,true);pending={kind:'one',id:sel,x:tx,y:ty,ok};confirmOne();($('#cRot').hidden=!(pending&&pending.kind==='one'&&ROTS[pending.id]),$('#confirm').hidden=false);sfx('tap');return}return place(sel,tx,ty)}
  if(mode==='remove')return removeAt(tx,ty);
  if(mode==='bulk'){if(selStamp==='move')return moveTap(tx,ty);if(selStamp)return selStamp.startsWith('swap:')?askSwap(selStamp.slice(5),tx,ty):askStamp(selStamp,tx,ty);if(!S.bulk)return toast('下から道具をえらんでください');return toast('ハケで、なぞった範囲をぬれます')}
}
