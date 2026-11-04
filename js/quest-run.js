'use strict';
function kurashi(key,mt){if(!S)return;const K=S.kb||(S.kb={done:{}});if(K.done[key])return;K.done[key]=1;if(mt)memo(mt[0],mt[1]);}/* 暮らしボーナスはなし（思い出帳のメモだけ） */
function logEv(t){if(!S.log)S.log=[];S.log.push([dayNo(),t]);if(S.log.length>300)S.log.shift()}
function checkQuest(){
  if(sacredQuietActive())return;
  if(WD===0&&!S.cleared&&(S.setSh||0)>=3&&!NUSHI_RUN&&sheet==null&&$('#dialog').hidden&&!DLGQ.length)scheduleGrassReunion();
  if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.quest!==S.quest)QUEST_CLEAR_WAIT=null;
  TALKW=null;if(S.qStory==null)QUESTCLEARW=null;finalCheck();
  if(NEWRES!=null||NEWQ.length)return;
  if(S.cleared){if(WD!==FREE)afterTick();return}
  if(S.quest>=QUESTS.length)return;
  const q=QUESTS[S.quest];
  if(q.id==='guest'&&S.qTalked&&!S.flags.guestDone&&!GUESTRUN&&!isNight()&&$('#dialog').hidden&&S.qStory==null)guestScene();
  if(q.skip&&S.qStory==null){/* ステージ2：草原で説明したことは、お話なしでとばす（もらえる物はもらう） */for(const id of [...questRecipeIds(q),...questRecipeIds(q,'clear')])if(BL[id]&&(!S.free||BL[id].kind!=='furn'))S.recipes[id]=true;if(q.talk){for(const id of q.talk.learn||[])S.recipes[id]=true;questGives(q,Object.assign({},q.talk.gives||{},{watchNow:false}))}if(q.pre)questGives(q,q.pre);questGives(q,Object.assign({},q.gives||{},{watchNow:false}));S.quest++;S.qTalked=false;return checkQuest()}
  if(!$('#dialog').hidden)return;
  if(S.qStory!=null){TALKW=storyWho(QUESTS[S.qStory]);QUESTCLEARW=TALKW;renderQuest();return}/* クエストのあとのお話は、💬をタップしてから */
  {const e=grassEndingTalk();if(e){if(grassEndingTalkLines(e))TALKW=POKO;renderQuest();return}}/* 最後のかけらの話：フタバの吹き出しから */
  if(qMissing(q).length){renderQuest();return}
  if(q.talk&&!S.qTalked){if(q.talk.when()&&!isNight())TALKW=earthIntroQuest(q)?earthIntroSpeaker(q):firstSpk(q.talk.lines,q.talk.who);renderQuest();return}/* 新しいクエストの声かけは、昼だけ */
  if(q.id==='nushi'&&S.qTalked&&!S.flags.greenTold&&!S.flags.finalWon&&GRASSN<2000&&!isNight())talkOnce('greenTold',[...greenTalk(),[POKO,'#joy|うん！　みんなで、草原をみどりにしよう！']]);/* 前のセーブで、この話を聞かずに目標が出ていたとき */
  if(q.field)fieldStoryEnsure(fieldActiveId(q));
  const complete=q.check();if(!complete)checkQuestParts(q);
  if(complete){
    if(isNight()){renderQuest();return}/* クリアの話・お礼は、昼だけ */
    if(q.pay&&!PAYOK){if(!ASKING&&sheet==null&&(S.payNo==null||S.t-S.payNo>60)){ASKING=true;const who=(q.talk&&q.talk.who)||POKO;
      askYesNo(who,matTxt(q.pay)+'、もらってもいい？',()=>{ASKING=false;PAYOK=true;checkQuest()},()=>{ASKING=false;S.payNo=S.t;renderQuest()})}renderQuest();return}/* 材料を使うクエストは、きいてから */
    let wait=QUEST_CLEAR_WAIT;
    if(wait&&wait.quest!==S.quest){QUEST_CLEAR_WAIT=wait=null}
    if(wait&&!wait.done){if(!qvHas(wait.obj,wait.id)||!S.res.includes(wait.r))QUEST_CLEAR_WAIT=wait=null;else{renderQuest();return}}/* 見にくる子が消えたら、べつの子で見にくるのを入れなおす */
    if(wait&&wait.done)QUEST_CLEAR_WAIT=null;
    if(!wait&&!q.field){const visit=queueQuestVisit(q,storyWho(q));if(visit){QUEST_CLEAR_WAIT=Object.assign({quest:S.quest,done:false},visit);renderQuest();return}}
    PAYOK=false;
    if(q.pay)for(const k in q.pay)S.mat[k]=Math.max(0,(S.mat[k]||0)-q.pay[k]);/* 材料を使うクエスト */
    S.quest++;S.qTalked=false;sfx('quest');logEv('目標「'+q.text+'」をたっせい');
    if(q.story){S.qStory=S.quest-1;TALKW=storyWho(q);QUESTCLEARW=TALKW;if(/^lv\d/.test(q.id))focusQuestSpeaker(TALKW);renderQuest();renderPalette();/* お礼は吹き出しをタップしてから。自動では会話を開かない */return}
    const after=questGives(q);inspireQuest(q,'clear');if(after)after();
    renderQuest();renderPalette();
  }else renderQuest();
}
let ASKING=false,PAYOK=false,SUBT=0;
/* はい／いいえ をきく（話す人の顔つき） */
function askYesNo(who,text,yes,no){const o=document.createElement('div');o.className='askyn';o.innerHTML='<div class="ak"><b></b><p></p><div class="ab"><button class="btn">あとで</button><button class="btn pri">はい</button></div></div>';o.querySelector('b').textContent=who;o.querySelector('p').textContent=text;
  const [bn,by]=o.querySelectorAll('button');by.onclick=()=>{sfx('next');o.remove();yes()};bn.onclick=()=>{sfx('tap');o.remove();no()};document.body.appendChild(o);sfx('next')}
/* クエストのごほうび・解放。お話のあとに行う。続けてすることがあれば関数を返す */
const ITEM_GIFTS=[];let GIFT_ACTIVE=false;
function queueItemGift(items,title,rec){const entries=Object.entries(items||{}).filter(([id,n])=>BL[id]&&n>0);if(entries.length)ITEM_GIFTS.push({state:S,items:entries,title,rec})}/* title：見出し（なければ「うけとった！」）。rec：レシピをおぼえた知らせ */
function showItemGift(){while(ITEM_GIFTS.length&&ITEM_GIFTS[0].state!==S)ITEM_GIFTS.shift();if(!ITEM_GIFTS.length||GIFT_ACTIVE)return;
  const items=new Map(),g0=ITEM_GIFTS[0],ttl=g0.title||'うけとった！',rec=!!g0.rec;while(ITEM_GIFTS.length&&ITEM_GIFTS[0].state===S&&(ITEM_GIFTS[0].title||'うけとった！')===ttl&&!!ITEM_GIFTS[0].rec===rec)for(const[id,n]of ITEM_GIFTS.shift().items)items.set(id,(items.get(id)||0)+n);/* 見出しがおなじものだけ、1まいにまとめる */
  GIFT_ACTIVE=true;const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="うけとったもの"></div>'),card=el('<div class="idea-card"><div class="idea-symbol">'+(rec?'📜':'🎁')+'</div><h2></h2><div class="idea-items"></div></div>');
  card.querySelector('h2').textContent=ttl;for(const[id,n]of items){const item=el('<div class="idea-item"></div>'),img=document.createElement('img'),name=document.createElement('span');img.src=iconURL(id);img.alt='';name.textContent=rec?BL[id].name:iname(id)+' ×'+n;item.append(img,name);card.querySelector('.idea-items').append(item)}
  const button=el('<button class="btn pri" type="button">'+(rec?'OK':'うけとる')+'</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');const prior=document.activeElement;
  setTimeout(()=>{if(overlay.isConnected){button.disabled=false;button.focus({preventScroll:true})}},650);button.onclick=()=>{if(button.disabled)return;overlay.remove();GIFT_ACTIVE=false;if(prior&&prior.isConnected)prior.focus({preventScroll:true})};
}
const spotCond=sp=>(sp.room?'家の中に、':'')+sp.how.replace(/^家の中に、/,'').split('と、').map(t=>t.replace(/([0-9]+)(つ|本)$/,'×$1')).join('・');/* 「井戸と、畑3つ」→「井戸・畑×3」 */
const SPOT_POPS=[];/* はじめてできたスポットの説明 */
function showSpotPop(){if(MEMRUN)return;while(SPOT_POPS.length&&SPOT_POPS[0].state!==S)SPOT_POPS.shift();if(!SPOT_POPS.length||GIFT_ACTIVE)return;
  GIFT_ACTIVE=true;const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true"></div>'),card=el('<div class="idea-card"><h2></h2><div class="spotpop"><b></b><p></p><p></p></div></div>');
  const q=card.querySelector('.spotpop'),h=card.querySelector('h2');{const sp=SPOT_POPS.shift().sp;h.textContent='スポットができた！';q.children[0].textContent=sp.n;q.children[1].textContent='条件：'+spotCond(sp);q.children[2].textContent=sp.eff}overlay.setAttribute('aria-label',h.textContent);
  const button=el('<button class="btn pri" type="button">OK</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');const prior=document.activeElement;
  setTimeout(()=>{if(overlay.isConnected){button.disabled=false;button.focus({preventScroll:true})}},650);button.onclick=()=>{if(button.disabled)return;overlay.remove();GIFT_ACTIVE=false;if(prior&&prior.isConnected)prior.focus({preventScroll:true})}}
function questGives(q,g){g=g||q.gives||{};
    (g.feat||[]).forEach(f=>S.feat[f]=true);for(const k in (g.food||{}))addFood(k,g.food[k]);for(const k in (g.mat||{}))S.mat[k]=(S.mat[k]||0)+g.mat[k];for(const k in (g.items||{})){S.unlocked[k]=true;giveItem(k,g.items[k])}queueItemGift(g.items);
    if(g.flags)g.flags.forEach(f=>S.flags[f]=true);if(g.recipes)g.recipes.forEach(id=>S.recipes[id]=true);if(g.shard)giveShard(g.shard);for(const s of g.shards||[])giveShard(s);if(g.enemy)S.enemyOn=true;if(g.shrine)S.flags.shrine=true;if(g.flag){S.flags[g.flag]=true;if(g.flag==='onsen')dirty=true}
    if(g.godLeave){S.godGone=true;const GX=godX(),GY=godY();fxSpr('poof',GX*TS,GY*TS);sfx('poof')}
    if(g.fest)freeFest();if(g.msg)toast(g.msg,'good');applyFeats();
    const hadW=g.watchNow&&(cnt('watch')>0||S.obj.some((o,j)=>o==='site'&&S.dyn[j]&&S.dyn[j].build==='watch'));// 先に建てていたら、その分のパワーを返す（おごり）
    const after=g.watchNow?(hadW?()=>{S.pt+=BL.watch.pc;for(const k in BL.watch.mat)S.mat[k]=(S.mat[k]||0)+BL.watch.mat[k];toast('見張り台の分のパワーと素材をカミサマが返してくれた','good');checkQuest()}:()=>{setMode('build');sel='watch';renderPalette();toast('見張り台を置く場所をタップ')}):null;
    return after}
/* 草原のかけら：村の想い・土地の復興・最後の防衛。それぞれ、もとから土地に残っていた力が応える */
function giveShard(src){if(S.flags['sh_'+src])return;S.flags['sh_'+src]=true;S.shards=Math.min(3,(S.shards||0)+1);sfx('level');const nm=SHN(),c=WD===1?'':'（'+S.shards+'/3）';toast('「'+nm+'」を手に入れた！'+c,'good');logEv(nm+'を手に入れた');memo('💎',nm+'を手に入れた'+c)}
/* 吹き出しは、最初に話す人から出す */
function spkOK(w){return w===GOD?godHere():!!w&&S.res.some(r=>r.name===w&&!r.hidden)}
function firstSpk(lines,fb){const w=lines&&lines[0]&&lines[0][0];return spkOK(w)?w:fb}
function storyWho(q){if(q.story&&spkOK(q.story[0]&&q.story[0][0]))return q.story[0][0];{const w=q.by||(q.talk&&q.talk.who);if(w===GOD?godHere():w&&S.res.some(r=>r.name===w&&!r.hidden))return w}/* お礼は、クエストをくれた子から */
  for(const[w]of q.story||[]){if(w===GOD){if(godHere())return GOD;continue}if(S.res.some(r=>r.name===w&&!r.hidden))return w}
  if(godHere())return GOD;const r=S.res.find(r=>!r.hidden);return r?r.name:null}
/* 水色の吹き出しのせいれいをタップ → 会話 → クエストがはじまる（会話の中でレシピを思いつくことも） */
function startTalk(){if(!$('#dialog').hidden)return;if(isNight())return toast('お話は、朝になってから');
  if(S.qStory!=null){const sq=QUESTS[S.qStory];TALKW=null;QUESTCLEARW=null;S.flags.talked1=true;
    if(sq.pre&&!S.flags['pre'+WD+'_'+S.qStory]){S.flags['pre'+WD+'_'+S.qStory]=true;questGives(sq,sq.pre);if(sheet==='food')renderSheet()}/* お礼の会話がはじまったら、すぐわたす（ベリーなど） */
    if(sq.field)sacredShot('care');else stageMotion('cheer');/* クエストをクリアしたお礼：みんながとびはねて、よろこぶ */
    let once=0;return dialog(ideaDialogue(sq,sq.story,'clear'),()=>{if(once++||S.qStory!==QUESTS.indexOf(sq))return;/* 2回よばれても1回だけ */if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.quest===S.qStory)QUEST_CLEAR_WAIT=null;if(S.quest<=S.qStory)S.quest=S.qStory+1;/* 設置クエストは、お礼を聞き終えてから次の目標へ */S.qStory=null;if(sq.field)sacredEndDirection();const after=questGives(sq);inspireQuest(sq,'clear');rewardPower(sq.reward??5);renderQuest();renderPalette();if(after)after();else checkQuest()},null)}
  {const e=grassEndingTalk();if(e)return startGrassEndingTalk(e)}
  const q=QUESTS[S.quest];if(!q||!q.talk)return;if(earthIntroQuest(q)&&!earthIntroSpeaker(q))return checkQuest();TALKW=null;QUESTCLEARW=null;S.flags.talked1=true;
  if(q.field)sacredShot('care');let once=0;dialog(ideaDialogue(q,q.talk.lines),()=>{if(once++||QUESTS[S.quest]!==q)return;/* 2回よばれても1回だけ */S.qTalked=true;if(q.field)sacredEndDirection();if(!WD&&q.id==='nushi')acceptFinalDefense();recount();
    for(const id of q.talk.learn||[])S.recipes[id]=true;
    const after=q.talk.gives?questGives(q,q.talk.gives):null;inspireQuest(q);/* クエストに使う物は、会話のあとでわたす */
    sfx('quest');renderQuest();renderPalette();if(after)after();else checkQuest()},null)}
const SUMMON_EL={fire:'fire',water:'water',wind:'wind'};
function questWaitNote(q){/* 条件はそろったのに、朝にならないと進まないとき */if(!q||S.cleared)return '';const el=SUMMON_EL[q.id];
  if(el&&elemCount(el)<1){if(S.summon&&S.summon.elem===el)return calledToday()?'朝を待とう':'神殿の「！」から呼ぼう';if((ATTR[el]||0)>=needFor(el))return '力がたまった。朝を待とう'}
  let ok=false;try{ok=!!q.check()}catch(e){}return ok&&isNight()?'朝を待とう':''}
function renderQuest(){const q=QUESTS[Math.min(S.quest,QUESTS.length-1)];let pr='',t=S.cleared?(WD===FREE?'村づくりは、つづく…':'世界クリア！'):q.text;
  if(S.cleared&&WD!==FREE){const a=AFTERQ[S.aq||0],dd=S.daily,dn=dd?dd.k.filter(k=>dd.done[k]).length:0;if(a&&S.aqOn===(S.aq||0)){t=aqTitle(a);pr=aqProg(a)}else t=dd?'きょうの目標 '+dn+'/'+dd.k.length:'世界クリア！'}/* クリア後は、新しいクエストか、きょうの目標を出す */
  if(!S.cleared){const ms=qMissing(q);
    if(ms.length)t=ms.join('と')+'がもどるまで、お話は進まない';
    else if(isNight()&&(S.qStory!=null||q.talk&&!S.qTalked))t='お話は、朝になってから';
    else if(S.qStory!=null||q.talk&&!S.qTalked)t=storyWaitStatusText()||(TALKW?mainStoryPromptText(TALKW):S.qStory==null&&q.talk.wait||'いまは、村をそだてよう');/* なにをすればいいか書く */
    else{if(q.prog)pr=q.prog();const wn=questWaitNote(q);if(wn)pr=pr?pr+'　'+wn:wn}}
  const qt=$('#questTxt');if(qt.dataset.k!==t+'|'+pr){qt.dataset.k=t+'|'+pr;qt.textContent='';const m=document.createElement('span'),g=document.createElement('span');m.className='qm';g.className='qp';m.textContent=t;g.textContent=pr;qt.append(m,g)}/* 進み具合は2行目に */
  const h=$('#questHow'),how=q.how||'';if(!h.hidden&&h.dataset.q==S.quest&&h.dataset.text===how)return;h.dataset.q=S.quest;h.dataset.text=how;h.hidden=true;h.innerHTML='<b>やりかた</b>';h.appendChild(document.createTextNode(how))}
const NUSHI_T=[
  {"open":[["フタバ","みんな、一緒に。あの木の下へ帰ろう。"],["ノドカ","ゆっくりで、だいじょうぶだよぉ。"]],"name":"草原のヌシ","nushi":["……大きくなったな。"],"world":[],"reu":[["U","木も。おまえも。",0,"nfF"],["F","……あのとき。"],["F","よかった、って言ったの……ヌシ様だったんだね。"],["U","ああ。"],["F","……遅いよ。",0,"stree:hug"],["U","待たせてしまった。"],["F","……。"],["F","みんなが、手伝ってくれたんだ。",0,"stree:group"],["F","ぼく、ひとりじゃ、何もわからなかった。"],["N","ぼくも、ひとりじゃ土をよけただけだったよぉ。",1],["H",{"A":"あたいは、石を温めただけだね。","B":"おれは、石を温めただけだな。"},1],["M","その後に、水を通せました。",1],["K","そして、ようやく声が届いた。",1],["U","……よい仲間に会えたな。"],["F","うん。"],["F","#teary|おかえりなさい。"],["U","……ただいま。",0,"stree:group"]],"next":[],"after":[],"toast":"ステージクリア！","last":"草原にもどる"},
  {open:[[HOMURA,'夜をこえたよ…！','cheer'],[SHIZUKU,'みなさん、力をそそいでください。']],
   nushi:['#think|……ふう。ようやく、体があたたまってきた。','守り神よ、せいれいたちよ。この地の熱を取りもどしてくれて、礼を言う。','わたしは、火のせいれいたちを生み、この火の山の熱を見守る者。草原のヌシとは、むかしからの知り合いだ。','#think|……あの影たちは、わたしの熱をうばっても、すこしもあたたまれなかったようだ。','もどった熱をたどると、次は霧につつまれた水べの村が見える。水の流れが止まり、霧がはれないままだという。'],
   after:[[GOD,'おつかれさん〜！ 見とったぞい。'],[GOD,'次は「霧のみずべの村」じゃ。…まだ道が通じておらんのじゃ。準備ができたら知らせるぞい。'],[HOMURA,'あたいたちは、この村と温泉をまもるよ。また入りにおいで！','cheer'],[SHIZUKU,'お気をつけて。…ときどき、温泉にいらしてくださいね。']],toast:'ステージクリア！ 「霧のみずべの村」は、ただいま準備中',last:'村にもどる'}];
let NUSHI_RUN=false,WELCOME_RUN=false;
let DEPART_RUN=false,GATHER_HOLD=false;/* お見送りで集まっているあいだ（集まった子を、その場で待たせる） */
function gatherAt(TX,TY,then,skipId,abort){/* せいれいみんなが、台座のまわりへ歩いて集まる（瞬間移動はしない）。みんながそろってから、つぎへ。いなくなった子・通れない子がいたら、やめて知らせる */
  const owner=S,session=VILLAGE_SESSION,cast=S.res.filter(r=>!r.hidden&&r.id!==skipId),spot={},miss={},here=r=>r.act&&r.act.type==='nmeet'&&r.act.stage==='do';
  const go=()=>{const used=new Set(Object.values(spot));for(const r of cast){if(r.act&&r.act.type==='nmeet')continue;const G=bfs(r.x|0,r.y|0);let b=spot[r.id]??-1;if(b>=0&&G.dist[b]<0)b=-1;if(b<0){let bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||used.has(k)||!walk(k)||S.obj[k]||roomOf(k))continue;const ky=(k/W)|0,d=Math.hypot(k%W+.5-TX,ky+.5-TY);if(d<1.6||d>5)continue;const sc=d+(ky<TY+1?3:0)+G.dist[k]*.02;/* 家の外の、台座の前がわ（見えるところ）に */if(sc<bd){bd=sc;b=k}}}if(b<0){miss[r.id]=(miss[r.id]||0)+1;continue}miss[r.id]=0;spot[r.id]=b;used.add(b);if(r.cing){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null}/* 料理のとちゅうなら、材料は箱にもどす */endAct(r);startAct(r,G,'nmeet',b,{run:true})}};
  GATHER_HOLD=true;const stop=msg=>{GATHER_HOLD=false;for(const r of cast)if(S.res.includes(r)&&r.act&&r.act.type==='nmeet')endAct(r);if(msg)toast(msg,'warn');if(abort)abort(msg)};
  const t0=performance.now();let last=0;const chk=()=>{if(S!==owner||session!==VILLAGE_SESSION){GATHER_HOLD=false;return}const n=performance.now();
    const gone=cast.find(r=>!S.res.includes(r)||r.hidden);if(gone)return stop(gone.name+'がもどるまで、お話は進まない');
    if(n-last>1500){last=n;go()}
    const stuck=cast.find(r=>(miss[r.id]||0)>=3);if(stuck)return stop(stuck.name+'が通れない。道をあけよう');
    if(cast.every(here)){GATHER_HOLD=false;return then()}
    if(n-t0>90000){const p=cast.find(r=>!here(r));return stop(p?p.name+'が、集まれなかった':'')}/* 時間切れでも、遠くのまま話しはじめない */
    villageTimeout(chk,250)};villageTimeout(chk,300)}
function nushiReturns(resume){if(NUSHI_RUN||S.cleared||WD===0&&grassReunionBlockReason())return;NUSHI_RUN=true;S.flags.nushiDue=1;/* ヌシ様が帰ってくる場面。「クリア」にするのは、場面を最後まで見てから（途中でとじたら、はじめから） */
  checkQuest();renderQuest();const T=NUSHI_T[WD];
  const tw=S.obj.indexOf('tower'),TX=tw>=0?storyTreeX(tw):CX+.5,TY=tw>=0?storyTreeY(tw):CY;
  if(WD===0)sacredShot('care',S.res.filter(r=>Math.hypot(r.x-TX,r.y-TY)<6));else centerOn(TX*TS,(TY-1)*TS);
  const openF=L=>{const o=L.filter(l=>l[0]===GOD||S.res.some(r=>r.name===l[0]));return o.length?o:[[GOD,'朝じゃな。…さあ、台座に力をそそぐんじゃ。']]};
  const gathered=()=>gatherAt(TX,TY,()=>{
    // せいれいたちが、台座のまわりに集まってから、ひとりずつ力をそそぐ
    if(WD===0)sacredShot('group',S.res,1.5);towerGlow(60000);/* 台座が光りはじめる */{const hn=performance.now();for(const r of S.res){RHOLD.set(r,hn+300000);if(WD!==0)STRAINU.set(r,hn+S.res.length*260+1200)}}/* 場面のあいだ、せいれいは歩かない。力をそそぐあいだは >< の顔 */
    S.res.forEach((r,i)=>villageTimeout(()=>{r.face=TX>=r.x?1:-1;if(WD!==0)JUMP.set(r,performance.now());else sacredScenePose(r,'storyTouch',2200,{side:true,target:tw});spawnFX(r.x-.5,r.y-.6,ELEM[r.elem].col);sfx('furn')},i*260));
    const t0=S.res.length*260+500;
    villageTimeout(()=>{spawnFX(TX-.5,TY-.2,WD===0?'#e5f5ba':'#fff3a0');if(WD!==0)for(let k=0;k<3;k++)villageTimeout(()=>fx.push({k:'ring',x:TX*TS,y:TY*TS,life:1.4,col:'#fff6c8'}),k*300);sfx('bush');if(WD!==0)flashScreen()},t0);
    // 光がひろがって、荒れた土地に花が咲いていく
    villageTimeout(()=>{let n=0;const L=[];for(let t=0;t<4000&&L.length<60;t++){const x=(Math.random()*W)|0,y=(Math.random()*H)|0,k=y*W+x;if(Math.max(Math.abs(x+.5-TX),Math.abs(y+.5-TY))>14||S.obj[k]||S.floor[k]||S.ground[k]===1||L.includes(k)||S.res.some(r=>(r.x|0)===x&&(r.y|0)===y))continue;L.push(k)}
      L.sort((a,b)=>Math.hypot(a%W-TX,(a/W|0)-TY)-Math.hypot(b%W-TX,(b/W|0)-TY));L.forEach((k,i)=>villageTimeout(()=>{if(S.obj[k])return;S.obj[k]='clover';burst(k,'plant');if(i%6===0)sfx('bush');if(i===L.length-1)recount();dirty=true},i*45))},t0+700);
    villageTimeout(()=>{for(let k=0;k<(WD===0?3:8);k++)villageTimeout(()=>{leafFX({x:TX,y:TY});if(WD!==0)fx.push({k:'ring',x:TX*TS,y:TY*TS-k*14,life:1.2,col:'#e8ffe0'})},k*150);sfx('bush');},t0+3900);/* 葉のうず・光の柱 */villageTimeout(()=>{{/* 文字の説明はなし：光・花・風のあと、ヌシ様があらわれる */if(WD===0)sacredShot('group',S.res,1.8);else camAnim={fz:cam.z,tz:Math.max(cam.z,2),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:TX*TS,ty:(TY-.4)*TS,t:0,dur:1.2};
      // ヌシ様が台座の上にあらわれる
      S.nushi={x:WD===0?TX+2.2:TX,y:TY+.95,t:6,app:0,dir:1,face:1,path:[]};const owner=S,session=VILLAGE_SESSION,lord=S.nushi,appearAt=performance.now();const reveal=now=>{if(S!==owner||VILLAGE_SESSION!==session||S.nushi!==lord)return;lord.app=Math.min(1,(now-appearAt)/1500);if(lord.app<1)requestAnimationFrame(reveal)};requestAnimationFrame(reveal);if(WD===0)sacredShot('reunion',S.res,1.7);/* あらわれたときは、守り神のほう（正面） */
      spawnFX(TX-.5,TY-.6,'#c8ffd0');sfx('arrive');if(WD!==0)flashScreen();
      villageTimeout(()=>dialog(T.nushi,()=>{
        if(WD!==0){startClap();for(const r of S.res)r.bubble='👏';}if(WD!==0)for(let k=0;k<8;k++)villageTimeout(()=>{const r=pick(S.res);if(r)spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))},k*350);villageTimeout(endClap,3200);/* みんなで拍手 */
        dialog((T.world&&sevLines(T.world)||[]).concat(T.reu&&sevLines(T.reu)||[],T.next&&sevLines(T.next)||[],T.after),()=>{
          S.cleared=true;if(WD===0){S.flags.sacredReunion=true;S.flags.sacredQuietSeen=false;endClap();sacredEndDirection();dirty=true;}delete S.flags.nushiDue;NUSHI_RUN=false;TOWERGLOW=0;for(const r of S.res)RHOLD.set(r,0);renderQuest();toast(T.toast,'good');
          S.clearDay=dayNo();S.score=calcScore();villageTimeout(()=>WD===0?openSheet('score'):dialog(['#think hush|……この土地も、もとにもどったのう'],()=>openSheet('score'),T.last,GOD),1200);
        });
      },null,T.name||'ヌシ様'),3200);
    }},t0+5200);
  },null,()=>{NUSHI_RUN=false;TOWERGLOW=0;villageTimeout(()=>{if(!S.cleared&&S.flags.nushiDue)nushiReturns(true)},20000)});/* 集まれなかったら、しばらくして、集まるところから */
  if(resume)gathered();else dialog(openF(T.open),gathered);
}
/* 火山の装置：話す子が装置へ歩いていき、手をあてる → 温泉に湯気がのぼって音 → みんながよろこぶ（実時間。終わるまで、つぎのセリフへ送らない） */
function heatScene(k){if(WD!==1||!S||!HSPC[k])return;const who=k==='b'?HOMURA:SHIZUKU,r=S.res.find(q=>q.name===who&&!q.hidden),dj=k==='b'?D1:D2,owner=S,session=VILLAGE_SESSION,alive=()=>S===owner&&VILLAGE_SESSION===session;
  const dx=dj%W+.5,dy=(dj/W|0)+.5,[sx,sy]=HSPC[k],pan=(x,y,z)=>{camAnim={fz:cam.z,tz:Math.max(cam.z,z),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:x*TS,ty:y*TS,t:0,dur:1}};
  STAGEWAIT=performance.now()+15000;pan(dx,dy,1.6);
  const gesture=()=>{if(!alive())return;if(r){r.face=dx>=r.x?1:-1;sacredScenePose(r,'storyTouch',1800,{side:true,face:r.face})}sfx('furn');STAGEWAIT=performance.now()+3600;
    villageTimeout(()=>{pan(sx,sy-.5,1.6);sfx('wave');fxSpr('spring',sx*TS,sy*TS);for(let i=0;i<22;i++)villageTimeout(()=>fx.push({k:'p',x:sx*TS+(Math.random()-.5)*TS*1.6,y:sy*TS,vx:(Math.random()-.5)*14,vy:-45-Math.random()*35,life:1.8,col:'rgba(255,255,255,.75)',r:4}),i*55)},900);
    villageTimeout(()=>{for(const q of S.res)if(!q.hidden&&(q.name===HOMURA||q.name===SHIZUKU)){JUMP.set(q,performance.now());JOYU.set(q,performance.now()+1800)}sfx('good')},2500)};
  if(!r||Math.hypot(r.x-dx,r.y-dy)>10||!sacredSceneWalk(r,dx,dy+1,{},gesture))gesture()}/* 遠すぎるときは、その場で手をあてる */
/* 会話の中の手の動き：give＝フタバがノドカに花のかんむりをわたす／push＝ノドカがフタバの背中を押す */
function stageHands(c){if(!S)return;const f=S.res.find(q=>q.name===POKO&&!q.hidden),n=S.res.find(q=>q.name===MINA&&!q.hidden);if(!f||!n)return;const now=performance.now();
  if(c==='give'){f.face=n.x>=f.x?1:-1;n.face=-f.face;sacredScenePose(f,'storyOffer',1500,{side:true,face:f.face});for(let i=0;i<10;i++)villageTimeout(()=>{const q=i/10,hx=f.x*TS+f.face*6,hy=f.y*TS-30;fx.push({k:'p',x:hx+(n.x*TS-hx)*q,y:hy+(n.y*TS-44-hy)*q,vx:0,vy:-8,life:.7,col:i%2?'#ffd1e8':'#fff3a0',r:3})},500+i*50);villageTimeout(()=>{JOYU.set(n,performance.now()+1400);JUMP.set(n,performance.now());sfx('bush')},1100);STAGEWAIT=now+1500}
  else{n.face=f.x>=n.x?1:-1;f.face=n.face;sacredScenePose(n,'storyTouch',1300,{side:true,face:n.face});villageTimeout(()=>{JUMP.set(f,performance.now());JOYU.set(f,performance.now()+1500);sfx('wave')},450);STAGEWAIT=now+1300}}
function calcScore(){const d=S.clearDay||dayNo(),parts=[['クリアした日',d+'日目',d<=26?4000:d<=30?3200:d<=34?2600:d<=39?2000:d<=44?1500:d<=54?1000:500],['せいれい',S.res.length+'人',S.res.length*100],['消えてしまったせいれい',(S.deaths||0)+'人',-Math.min(1000,(S.deaths||0)*50)]];
 const tot=Math.max(0,parts.reduce((a,p)=>a+p[2],0)),rank=tot>=5000?'S':tot>=4000?'A':tot>=2500?'B':'C'/* ふつうはB。はやく・消さずにクリアでS */;return{tot,rank,parts}}/* クリアスコア：早いほど・せいれいが多いほど・消えたせいれいが少ないほど高い。夜の数・パワーなど、長く遊ぶほどふえるものは入れない。クリアした日：26日目まで4000・30日目まで3200・34日目まで2600・39日目まで2000・44日目まで1500・54日目まで1000・それより後500。せいれい：1人100てん。消えたせいれい：1人50てん引く（引くのは1000まで）。S 5000・A 4000・B 2500 */
function visionFX(lines,after){const d=document.createElement('div');d.style.cssText='position:absolute;inset:0;background:#0b0f0a;opacity:0;pointer-events:none;z-index:25;transition:opacity .9s ease';$('#app').appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity='.55'}));setTimeout(()=>dialog(lines,()=>{d.style.opacity='0';setTimeout(()=>{d.remove();after&&after()},900)},null,''),1000)}/* かけらにふれたとき、画面が暗くなって記憶がうかぶ（会話の枠は暗くしない・暗さは控えめ） */
function flashScreen(){const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:#fff;opacity:.85;pointer-events:none;z-index:60;transition:opacity 1.4s ease-out';document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity='0'}));setTimeout(()=>d.remove(),1600)}/* 白くひかる */
const NTALK=[[/* 草原のヌシ：守り神に話す（ひとつずつ、順番に） */
  '#think|……風が、やわらかくなったな。この土地が、息をふきかえしている。',
  '守り神よ。子らの笑い声は、どんな花より、この地を明るくする。',
  'わたしの角に、ときどき小鳥がとまる。……じっとしているのは、なかなかむずかしい。',
  '#think|フタバは、ずいぶんたくましくなった。……わたしがいないあいだに。',
  '#think|夕やけを見ると、思い出すことがある。さいごまで光ろうとする者のことを。',
  '花が咲くたび、この地のどこかで、新しい命がめざめる。……おまえのおかげだ。',
  'むかし、ここには、もっと多くの子らがいた。……いまも、風のなかに、その声がまざっている気がする。',
  '#joy|子らは、わたしの足あとに、花の種をうえてまわっている。……ありがたいが、少しくすぐったい。',
  '#think|むかしは、昼と夜にも、それを見守るヌシがいたのだがな。',
  '#think|昼と夜は、ふたつでひとつ。どちらかが欠けると、もう一方も、すこしずつ弱っていく。',
  '雨の日は、葉がよろこぶ。わたしも、すこしだけ、背がのびた気がする。',
  '守り神よ。おまえは、つかれないのか。……ふむ。神というのも、たいへんだな。',
  '#think|この御神木には、子らの「守りたい」が、たくさんしみこんでいる。……あたたかいな。',
  'ほかの土地のヌシたちも、きっと、だれかを待っている。……守り神よ、急ぐことはない。'],[/* 火のヌシ */
  '#think|……ふう。湯気のにおいがすると、落ちつく。',
  '火は、あたためもすれば、焼きもする。……ホムラは、それをよく知っている子だ。',
  '温泉に子らがつかっているのを見るのが好きだ。……わたしも入りたいが、湯がわいてしまう。',
  '#think|草原のヌシは、元気にしているだろうか。あいつは、むかしから心配性でな。',
  '#think|あの影たちは、熱をほしがっていた。……あたためてやれる日が、いつか来るといいのだが。',
  '火の山のおくで、また熱がめぐりはじめた。おまえたちのおかげだ。',
  'シズクは、湯の温度を毎朝はかっている。……わたしより、くわしいかもしれん。',
  '#joy|子らのおまつりは、にぎやかでいい。わたしの若いころを思いだす。']];
const NTALKN=['#think|夜は、静かに見守るときだ。……影たちも、本当は、休める場所がほしいのだろう。','#think|……夜の風は、つめたいな。子らは、よく眠れているだろうか。'];/* 夜に話しかけたとき */
const NPLAY=[[/* 草原：遊びにきた子と、ヌシ様の会話（0：遊びにきた子、U：ヌシ様） */
  [[0,'ヌシ様、せなかに乗ってもいい？'],['U','#think|……すこしだけだぞ。角には、さわるでない。'],[0,'#joy|わあ、たかーい！']],
  [[0,'ヌシ様の角の花、いいにおいがする！'],['U','花の季節には、もっと咲く。そのときは、また見においで。']],
  [[0,'ヌシ様って、なにを食べるの？'],['U','#think|朝つゆと、日の光だ。……それと、ときどき、子らがくれるベリーもな。']],
  [[0,'ヌシ様、かくれんぼしよう！'],['U','わたしは、どこにかくれても、角が見えてしまうのだが。'],[0,'#joy|あはは、ほんとだ！']],
  [[0,'ヌシ様がいないあいだ、さみしかった？'],['U','#think|……ああ。かけらのなかで、ずっと、子らの声を聞いていた。']],
  [[0,'ねえヌシ様、草原は、むかしもこんなだった？'],['U','もっと花が多かった。……だが、いまの草原も、わたしは好きだ。']],
  [[0,'ヌシ様の足あとに、花が咲いてる！'],['U','#joy|ふふ。おまえたちが、うえてくれたのだろう？']],
  [[0,'ヌシ様、夜はこわくないの？'],['U','#think|夜は、休むための時間だ。……こわいものでは、なかったはずなのだがな。']],
  [[0,'ヌシ様、なでてもいい？'],['U','#think|……かまわん。……そこだ。耳のうしろが、すこしかゆい。']],
  [[0,'ヌシ様の背中、あったかいね。'],['U','日なたに長くいたからな。おまえも、すこし休んでいけ。']]],[/* 火のヌシ */
  [[0,'ヌシ様、温泉、ちょうどいい熱さだよ！'],['U','#joy|そうか。……子らがよろこぶ湯は、いい湯だ。']],
  [[0,'ヌシ様のたてがみ、あったかい！'],['U','やけどせんようにな。……ふう、くすぐったい。']],
  [[0,'ヌシ様、火の山って、どんなところ？'],['U','#think|熱い風がふく。……だが、夜には、星がよく見える。']],
  [[0,'ヌシ様、いっしょに火の粉を見よう！'],['U','うむ。ぱちぱちと、よく笑う火だ。']],
  [[0,'ヌシ様が帰ってきて、村があったかくなったね。'],['U','わたしではない。……おまえたちが、あたためてくれたのだ。']],
  [[0,'ヌシ様、おまつりの屋台、いっしょにまわろう！'],['U','#think|わたしが行くと、屋台がこげてしまうかもしれん。……遠くから見ているよ。']]]];
function nushiTalk(){if(WD===0&&S.flags.sacredReunion&&!S.flags.sacredQuietSeen)return sacredQuietScene();const n=S.nushi,nm=WD===1?'火のヌシ':NUSHI1,k=WD===1?1:0;
  const r=n.pl&&S.res.find(q=>q.id===n.pl.id);if(r&&r.act&&r.act.type==='npl'&&r.act.stage==='do'){const P=NPLAY[k],L=P[(S.npc=(S.npc||0)+1)%P.length];return dialog(L.map(([w,t])=>w==='U'?[nm,t]:[r.name,chatTone(t,r)]))}/* 遊びにきた子がいれば、その子とヌシ様の会話 */
  if(isNight())return dialog([[nm,pick(NTALKN)]]);
  const T=NTALK[k];dialog([[nm,T[(S.ntk=(S.ntk||0)+1)%T.length]]])}/* 守り神に、ひとことずつ話す（順番にまわる） */
function updNushi(dt){const n=S.nushi;if(n.app==null)n.app=1;if(n.app<1){n.app=Math.min(1,n.app+dt/5);n.mv=0;return}/* 台座の上で、すこしずつ姿をあらわす */
  if(n.pl){const r=S.res.find(q=>q.id===n.pl.id);n.pl.t+=dt;if(r&&n.pl.t>90&&r.act&&r.act.type==='npl'&&r.act.stage!=='do')endAct(r);
    if(!r||!r.act||(r.act.type!=='npl'&&n.pl.t>3)){n.pl=null;n.pt=rnd(30,90)}else{n.mv=0;n.path=[];{const dx=r.x-n.x,dy=r.y-n.y;if(Math.abs(dx)<.8&&dy>0)n.dir=1;else{n.dir=0;n.face=dx<0?-1:1}}/* 遊びにくる子のほうを向く（前にいれば正面、横にいれば横向き） */if(r.act.type==='npl'&&r.act.stage==='do'){n.fx=(n.fx||0)+dt;if(n.fx>3){n.fx=0;spawnFX(n.x-.5,n.y-1.1,'#ffb8d8')}}return}}
  if(n.pt==null)n.pt=rnd(20,60);n.pt-=dt;
  if(n.pt<=0&&S.cleared&&!isNight()){/* クリア後、ときどき、精霊が遊びにくる（なにもしていない子・おもちゃで遊んでいる子から） */n.pt=20;const c=S.res.filter(r=>!r.hidden&&(!r.act||['wander','idle','play'].includes(r.act.type))&&r.hunger>30&&r.energy>25&&Math.abs(r.x-n.x)+Math.abs(r.y-n.y)<30);
    if(c.length){const r=pick(c),G=bfs(r.x|0,r.y|0),nj=(n.y|0)*W+(n.x|0),F=(j,ok)=>{const dx=j%W-(n.x|0),dy=(j/W|0)-(n.y|0);return ok(dx,dy)&&walk(j)},st0=nearest(G,j=>F(j,(dx,dy)=>dy===1&&Math.abs(dx)<=1),40),st=st0>=0?st0:nearest(G,j=>F(j,(dx,dy)=>dy===0&&Math.abs(dx)>=2&&Math.abs(dx)<=3||dy===2&&Math.abs(dx)<=1),40);/* ヌシ様の前（下）か、横に少しはなれたところ。うしろに立つと、ヌシ様にかくれて見えない */if(st>=0){endAct(r);startAct(r,G,'npl',st,{});n.pl={id:r.id,t:0};n.path=[];return}}}
  if(!n.path)n.path=[];
  if(!n.path.length){n.mv=0;n.t-=dt;if(n.t>0)return;n.t=rnd(30,90);
    let sx=n.x|0,sy=n.y|0;if(!walk(sy*W+sx)){const c=[];for(let y=sy-2;y<=sy+3;y++)for(let x=sx-2;x<=sx+2;x++){const j=y*W+x;if(x>=0&&y>=0&&x<W&&y<H&&walk(j))c.push(j)}c.sort((a,b)=>Math.hypot(a%W+.5-n.x,(a/W|0)+.5-n.y)-Math.hypot(b%W+.5-n.x,(b/W|0)+.5-n.y));if(!c.length)return;n.path=[c[0]];return}/* 台座からおりる */
    const HB=new Set();for(const h of HOUSES){for(const k of h.set)HB.add(k);for(const k of h.inside)HB.add(k)}const G=HB.has(sy*W+sx)?bfs(sx,sy):roadSearch(sx,sy,HB),r=10;for(let k=0;k<40;k++){const x=(CX+rnd(-r,r))|0,y=(CY+rnd(-r,r))|0,j=y*W+x;if(G.dist[j]>0&&G.dist[j]<40&&!HB.has(j)){n.path=pathTo(G,j);break}}return}/* 道をとおって歩く（壁や水はとおらない。家の中には入らない） */
  const j=n.path[0],tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-n.x,dy=ty-n.y,d=Math.hypot(dx,dy),s=.12*dt;
  if(!walk(j)&&d>1.2||d>.9&&HOUSES.some(h=>h.inside.has(j)||h.set.has(j))&&!HOUSES.some(h=>h.inside.has((n.y|0)*W+(n.x|0)))){n.path=[];return}/* とちゅうで家ができたら、入らずに止まる */
  if(d<=s){n.x=tx;n.y=ty;n.path.shift()}else{n.x+=dx/d*s;n.y+=dy/d*s}
  if(Math.abs(dx)>Math.abs(dy)*1.1){n.face=dx<0?-1:1;n.dir=0}else n.dir=dy<0?-1:1;n.mv=1}
function sceneShift(kind,body,after){/* 場面転換：画面が白く（夢・光）か暗く（むかし）なって、色をかえた世界で動きを見せ、もとにもどる。そのあいだはセーブしない */
  const S0=S,cv=$('#cv'),d=document.createElement('div'),ns=NOSAVE;d.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:25;opacity:0;transition:opacity .7s ease;background:'+(kind==='mem'?'#0b0f0a':'#fffbe8');$('#app').appendChild(d);
  const fade=(o,f)=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity=o}));setTimeout(f,800)};
  fade('1',()=>{if(S!==S0){d.remove();return}NOSAVE=true;cv.style.filter=kind==='mem'?'sepia(.85) brightness(.8)':'saturate(1.5) brightness(1.1)';fade('0',()=>body(()=>fade('1',()=>{cv.style.filter='';NOSAVE=ns;fade('0',()=>{d.remove();after&&after()})})))})}
let EXTRA=[],MEMRUN=false;/* 場面だけに出る子（むかしのきょうだいなど。セーブしない） */
function dreamScene(done){/* 草原のはじめ：むかしの、花畑。フタバと、だれかわからないきょうだいたち（草のせいれい）が、たのしそうに話す（セピアの思い出）。おわったら、いまの荒れた草原にもどす */
  const vx=(cam.x+VW/cam.z/2)/TS,vy=(cam.y+VH/cam.z/2)/TS,okC=k=>!S.obj[k]||(BL[S.obj[k]]&&BL[S.obj[k]].natural),flat=(k,h)=>hiAt(k)===h;
  let cx=vx,cy=vy,best=1e9;for(const [R,wy0,wy1,wx] of [[24,-4,3,5],[60,-4,3,5],[60,-2,3,3]]){for(let y=OFF+5;y<H-OFF-4;y++)for(let x=OFF+8;x<W-OFF-8;x++){const d=Math.hypot(x-vx,y-vy);if(d>R||d>=best)continue;const h=hiAt(y*W+x);let ok=true;for(let yy=wy0;yy<=wy1&&ok;yy++)for(let xx=-wx;xx<=wx;xx++){const k=(y+yy)*W+x+xx;if(!okC(k)||S.floor[k]||S.ground[k]||!flat(k,h)||!walk(k)||S.ref[k]!=null||VILL[k]){ok=false;break}}if(ok){best=d;cx=x+.5;cy=y+.5}}if(best<1e9)break}/* 壁・物・水・段差・いまの村のない、ひらけた所 */
  const ox=cx|0,oy=cy|0,h0=hiAt(oy*W+ox),prev=new Map(),put=(dx,dy,id)=>{const k=(oy+dy)*W+ox+dx;if(!okC(k)||S.floor[k]||S.ground[k]||hiAt(k)!==h0||S.ref[k]!=null||VILL[k])return;/* 壁・物・水・段差には、おかない */if(!prev.has(k))prev.set(k,S.obj[k]);S.obj[k]=id};
  const clear=(dx,dy)=>Math.abs(dx)<=2&&dy>=-1&&dy<=2;/* きょうだいの立つ所は、あけておく */
  const put0=(k,id)=>{if(!prev.has(k))prev.set(k,S.obj[k]);S.obj[k]=id;if(BL[id]&&BL[id].hp!=null)S.hp[k]=BL[id].hp};
  const FL=['clover','clover','bellf','salvia','lily'];
  for(let dy=-3;dy<=3;dy++)for(let dx=-4;dx<=4;dx++){if(clear(dx,dy))continue;const r=Math.abs(dx*31+dy*17)%10;if(r<5)put(dx,dy,FL[r%5])}/* 花 */
  if(WD===0)for(let d=3;d<=5;d++){const k=(CY-2)*W+CX+(-d);if(S.obj[k]==='')put0(k,'hwall')}/* 思い出の中では、いまの家のこわれた壁は、なおっている（家の下がわのかべのあな） */
  MEMRUN=true;const ss=Object.assign({},S.spotSeen||{});recount();dirty=true;const z0=cam.z;cam.z=1.5;centerOn(cx*TS,(cy-.8)*TS);
  const real=S.res.filter(r=>!r.hidden),keep=real.map(r=>[r,r.hidden]);real.forEach(r=>r.hidden=true);/* いまの子は、思い出のあいだ見せない */
  const mk=(name,dx,dy)=>{const g=mkRes({nid:-910},name,'wood',cx+dx,cy+dy);g.vr=mkVar(POKO,'wood');g.id=-910-EXTRA.length;return g};
  const F=mk(POKO,0,.4);EXTRA=[F,mk('？',-1.3,-.2),mk('？',1.3,-.2),mk('？',-1.6,1.2),mk('？',1.6,1.2)];EXTRA.forEach(g=>{g.face=g.x<cx?1:-1});F.face=1;
  setTimeout(()=>dialog([['？','#joy|フタバ、こっちこっち！ 花のかんむり、できたよ！'],[POKO,'#joy|わあ……！ ぼくに、くれるの？'],['？','#joy|お日さまの下であんだから、ぽかぽかだぞ。'],['？','その花かんむり、フタバによく似合ってるね。'],['？','#joy|あしたも、みんなで、ここであそぼうな！'],[POKO,'#joy|うんっ！ ずっと、ずーっとね！']],()=>{
    EXTRA.forEach((g,i)=>setTimeout(()=>{JUMP.set(g,performance.now());JOYU.set(g,performance.now()+1500)},i*120));
    setTimeout(()=>{for(const [k,v] of prev){S.obj[k]=v||'';if(!v)delete S.hp[k]}EXTRA=[];cam.z=z0;centerOn(vx*TS,vy*TS);keep.forEach(([r,h])=>r.hidden=h);recount();S.spotSeen=ss;for(let n=SPOT_POPS.length-1;n>=0;n--)if(SPOT_POPS[n].state===S)SPOT_POPS.splice(n,1);MEMRUN=false;dirty=true;done()},1400)},null,''),600);
  const tk=setInterval(()=>{if(!EXTRA.length){clearInterval(tk);return}const w=DLGA.who,L2=EXTRA.filter(q=>q.name===w);if(L2.length&&Math.random()<.5)JUMP.set(pick(L2),performance.now())},1300)}
function memScene(done){/* むかしを思い出す：夜、影がせまり、フタバがふるえ、ほかの子が前に立つ。光がはじける */
  const f=S.res.find(r=>r.name===POKO)||S.res[0];if(!f)return done();centerOn(f.x*TS,f.y*TS);const hn=performance.now();for(const r of S.res)RHOLD.set(r,hn+7000);STRAINU.set(f,hn+5500);
  for(let n=0;n<26;n++)setTimeout(()=>{const a=Math.random()*Math.PI,R=5*TS;fx.push({k:'p',x:f.x*TS+Math.cos(a)*R*(Math.random()<.5?-1:1),y:f.y*TS+Math.sin(a)*R*.6+TS*2,vx:0,vy:-25,life:1.6,col:'#1a1420',r:5})},n*120);
  S.res.filter(r=>r!==f).forEach((r,i)=>setTimeout(()=>{r.face=f.x>=r.x?-1:1;JUMP.set(r,performance.now());spawnFX(r.x-.5,r.y-.6,ELEM[r.elem].col)},1600+i*300));
  [400,1400,2400].forEach(t=>setTimeout(()=>JUMP.set(f,performance.now()),t));
  setTimeout(()=>{for(let k=0;k<3;k++)fx.push({k:'ring',x:f.x*TS,y:f.y*TS,life:1.4,col:'#fff6c8'});sfx('level');flashScreen()},4200);setTimeout(done,5600)}
function lightFlow(TX,TY){/* フタバから、光と葉のつぶが守り神（画面の手前）へ流れこむ */const bx=cam.x+VW/cam.z/2,by=cam.y+VH/cam.z*.95;for(let n=0;n<40;n++)setTimeout(()=>{const x=TX*TS+(Math.random()-.5)*20,y=TY*TS-10;fx.push({k:'p',x,y,vx:(bx-x)/1.2,vy:(by-y)/1.2,life:1.2,col:n%2?'#c8f5a0':'#fff6c8',r:3})},n*60);for(const r of S.res)setTimeout(()=>leafFX(r),1500+Math.random()*800)}
let GUEST=null,GUESTRUN=false;
function guestScene(){/* 火山：草原のフタバが、温泉にあそびに来る。宿の前にあらわれ、温泉に入って、よろこんで帰る（場面だけ。セーブしない人） */
  const hot=[];for(let j=0;j<W*H;j++)if(S.ground[j]===1&&nearHot(j,0))hot.push(j);const ins=HOUSES.find(h=>[...h.inside].filter(j=>BEDSET.has(S.obj[j])).length>=2&&[...h.inside].some(j=>nearHot(j,6)));
  const tgt=hot.length?hot[(hot.length/2)|0]:STATUE>=0?STATUE+W:CY*W+CX;let st=-1;for(let r=1;r<6&&st<0;r++)for(let dy=-r;dy<=r&&st<0;dy++)for(let dx=-r;dx<=r;dx++){const k=tgt+dy*W+dx;if(k>0&&k<W*H&&walk(k)&&!S.obj[k]&&S.ground[k]!==1){st=k;break}}
  if(st<0)return;GUESTRUN=true;const S0=S;const g=mkRes({nid:-900},POKO,'wood',st%W+.5,(st/W|0)+.6);g.id=-900;g.hidden=false;
  centerOn(g.x*TS,g.y*TS);const hn=performance.now();for(const r of S.res)RHOLD.set(r,hn+40000);
  sceneShift('light',d=>{GUEST=g;g.spawnT=performance.now();spawnFX(g.x-.5,g.y-.6,'#c8ffd0');sfx('arrive');setTimeout(d,1200)},()=>{if(S!==S0)return;
    dialog([[POKO,'#joy|わぁ……！ ここが、火山のふもとの村？ ゆげが、もくもくしてる！','hop'],[HOMURA,'ようこそ、草原のお客さん。あたいはホムラさ。'],[SHIZUKU,'シズクです。どうぞ、ゆっくりしていってくださいね。'],[POKO,'ぼく、フタバ！ 温泉って、はじめてなんだ！']],()=>{
      if(S!==S0)return;const w=tgt;g.bubble='♨️';const sx=g.x,sy=g.y,ex=w%W+.5,ey=(w/W|0)+.5,t0=performance.now();const step=()=>{if(S!==S0)return;const k=Math.min(1,(performance.now()-t0)/1500);g.x=sx+(ex-sx)*k*.7;g.y=sy+(ey-sy)*k*.7;if(k<1)requestAnimationFrame(step)};step();
      setTimeout(()=>{if(S!==S0)return;sfx('wave');JOYU.set(g,performance.now()+4000);[0,900,1800].forEach(t=>setTimeout(()=>JUMP.set(g,performance.now()),t));for(let k=0;k<6;k++)setTimeout(()=>spawnFX(g.x-.5,g.y-.8,'#ffffff'),k*400)},1600);
      setTimeout(()=>{if(S!==S0)return;dialog([[POKO,'#joy|はぁぁ……あったかい……。からだが、とろけちゃいそう……。'],[POKO,'こんどは、ノドカも連れてきていい？ みんなに、教えてあげたいな！','hop'],[HOMURA,'#joy|もちろんさ。いつでもおいで！','cheer']],()=>{
        if(S!==S0)return;spawnFX(g.x-.5,g.y-.6,'#c8ffd0');sfx('arrive');setTimeout(()=>{GUEST=null;GUESTRUN=false;for(const r of S.res)RHOLD.set(r,0);S.flags.guestDone=1;checkQuest()},500)})},4200)})})}
