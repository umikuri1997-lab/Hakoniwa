'use strict';
function kurashi(key,mt){if(!S)return;const K=S.kb||(S.kb={done:{}});if(K.done[key])return;K.done[key]=1;if(mt)memo(mt[0],mt[1]);}/* 暮らしボーナスはなし（思い出帳のメモだけ） */
function logEv(t){if(!S.log)S.log=[];S.log.push([dayNo(),t]);if(S.log.length>300)S.log.shift()}
function checkQuest(){
  if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.quest!==S.quest)QUEST_CLEAR_WAIT=null;
  TALKW=null;if(S.qStory==null)QUESTCLEARW=null;finalCheck();
  if(NEWRES!=null||NEWQ.length)return;
  if(S.cleared){if(WD!==FREE)afterTick();return}
  if(S.quest>=QUESTS.length)return;
  const q=QUESTS[S.quest];
  if(q.skip&&S.qStory==null){/* ステージ2：草原で説明したことは、お話なしでとばす（もらえる物はもらう） */for(const id of [...questRecipeIds(q),...questRecipeIds(q,'clear')])if(BL[id]&&(!S.free||BL[id].kind!=='furn'))S.recipes[id]=true;if(q.talk){for(const id of q.talk.learn||[])S.recipes[id]=true;questGives(q,Object.assign({},q.talk.gives||{},{watchNow:false}))}if(q.pre)questGives(q,q.pre);questGives(q,Object.assign({},q.gives||{},{watchNow:false}));S.quest++;S.qTalked=false;return checkQuest()}
  if(!$('#dialog').hidden)return;
  if(S.qStory!=null){TALKW=storyWho(QUESTS[S.qStory]);QUESTCLEARW=TALKW;renderQuest();return}/* クエストのあとのお話は、💬をタップしてから */
  if(qMissing(q).length){renderQuest();return}
  if(q.talk&&!S.qTalked){if(q.talk.when()&&!isNight())TALKW=firstSpk(q.talk.lines,q.talk.who);renderQuest();return}/* 新しいクエストの声かけは、昼だけ */
  const complete=q.check();if(!complete)checkQuestParts(q);
  if(complete){
    if(isNight()){renderQuest();return}/* クリアの話・お礼は、昼だけ */
    if(q.pay&&!PAYOK){if(!ASKING&&sheet==null&&(S.payNo==null||S.t-S.payNo>60)){ASKING=true;const who=(q.talk&&q.talk.who)||POKO;
      askYesNo(who,matTxt(q.pay)+'、もらってもいい？',()=>{ASKING=false;PAYOK=true;checkQuest()},()=>{ASKING=false;S.payNo=S.t;renderQuest()})}renderQuest();return}/* 材料を使うクエストは、きいてから */
    let wait=QUEST_CLEAR_WAIT;
    if(wait&&wait.quest!==S.quest){QUEST_CLEAR_WAIT=wait=null}
    if(wait&&!wait.done){if(!qvHas(wait.obj,wait.id)||!S.res.includes(wait.r))QUEST_CLEAR_WAIT=wait=null;else{renderQuest();return}}/* 見にくる子が消えたら、べつの子で見にくるのを入れなおす */
    if(wait&&wait.done)QUEST_CLEAR_WAIT=null;
    if(!wait){const visit=queueQuestVisit(q,storyWho(q));if(visit){QUEST_CLEAR_WAIT=Object.assign({quest:S.quest,done:false},visit);renderQuest();return}}
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
const SPOT_POPS=[],GUIDE_POPS=[];/* はじめてできたスポットの説明・会話のあとの案内 */
function showSpotPop(){for(const Q of[GUIDE_POPS,SPOT_POPS])while(Q.length&&Q[0].state!==S)Q.shift();if(!(SPOT_POPS.length||GUIDE_POPS.length)||GIFT_ACTIVE)return;
  GIFT_ACTIVE=true;const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true"></div>'),card=el('<div class="idea-card"><h2></h2><div class="spotpop"><b></b><p></p><p></p></div></div>');
  const q=card.querySelector('.spotpop'),h=card.querySelector('h2');if(GUIDE_POPS.length){const g=GUIDE_POPS.shift();h.textContent='あんない';q.children[0].remove();q.children[1].remove();q.children[0].textContent=g.t}else{const sp=SPOT_POPS.shift().sp;h.textContent='スポットができた！';q.children[0].textContent=sp.n;q.children[1].textContent=sp.how+(sp.room?'を置く。':'を、まわり3マスに置く。');q.children[2].textContent=sp.eff}overlay.setAttribute('aria-label',h.textContent);
  const button=el('<button class="btn pri" type="button">OK</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');const prior=document.activeElement;
  setTimeout(()=>{if(overlay.isConnected){button.disabled=false;button.focus({preventScroll:true})}},650);button.onclick=()=>{if(button.disabled)return;overlay.remove();GIFT_ACTIVE=false;if(prior&&prior.isConnected)prior.focus({preventScroll:true})}}
function questGives(q,g){g=g||q.gives||{};
    (g.feat||[]).forEach(f=>S.feat[f]=true);for(const k in (g.food||{}))addFood(k,g.food[k]);for(const k in (g.mat||{}))S.mat[k]=(S.mat[k]||0)+g.mat[k];for(const k in (g.items||{})){S.unlocked[k]=true;giveItem(k,g.items[k])}queueItemGift(g.items);
    if(g.flags)g.flags.forEach(f=>S.flags[f]=true);if(g.recipes)g.recipes.forEach(id=>S.recipes[id]=true);if(g.shard)giveShard(g.shard);if(g.enemy)S.enemyOn=true;if(g.shrine)S.flags.shrine=true;if(g.flag){S.flags[g.flag]=true;if(g.flag==='onsen')dirty=true}
    if(g.godLeave){S.godGone=true;const GX=godX(),GY=godY();fx.push({k:'ring',x:GX*TS,y:GY*TS,life:1});for(let n=0;n<20;n++){const a=Math.random()*7;fx.push({k:'p',x:GX*TS,y:GY*TS,vx:Math.cos(a)*90,vy:Math.sin(a)*90-40,life:1,col:'#fff',r:3})}sfx('poof')}
    if(g.fest)freeFest();if(g.msg)toast(g.msg,'good');applyFeats();
    const hadW=g.watchNow&&(cnt('watch')>0||S.obj.some((o,j)=>o==='site'&&S.dyn[j]&&S.dyn[j].build==='watch'));// 先に建てていたら、その分のパワーを返す（おごり）
    const after=g.watchNow?(hadW?()=>{S.pt+=BL.watch.pc;for(const k in BL.watch.mat)S.mat[k]=(S.mat[k]||0)+BL.watch.mat[k];toast('見張り台の分のパワーと素材をカミサマが返してくれた','good');checkQuest()}:()=>{setMode('build');sel='watch';renderPalette();toast('見張り台を置く場所をタップ')}):null;
    return after}
/* ヌシのかけら：オオカゲ・土地の復興・キーキャラのおねがい、それぞれ1つずつ */
function giveShard(src){if(S.flags['sh_'+src])return;S.flags['sh_'+src]=true;S.shards=Math.min(3,(S.shards||0)+1);sfx('level');toast('「ヌシのかけら」を手に入れた！（'+S.shards+'/3）','good');logEv('ヌシのかけらを手に入れた');memo('💎','ヌシのかけらを手に入れた（'+S.shards+'/3）')}
/* 吹き出しは、最初に話す人から出す */
function spkOK(w){return w===GOD?godHere():!!w&&S.res.some(r=>r.name===w&&!r.hidden)}
function firstSpk(lines,fb){const w=lines&&lines[0]&&lines[0][0];return spkOK(w)?w:fb}
function storyWho(q){if(q.story&&spkOK(q.story[0]&&q.story[0][0]))return q.story[0][0];{const w=q.by||(q.talk&&q.talk.who);if(w===GOD?godHere():w&&S.res.some(r=>r.name===w&&!r.hidden))return w}/* お礼は、クエストをくれた子から */
  for(const[w]of q.story||[]){if(w===GOD){if(godHere())return GOD;continue}if(S.res.some(r=>r.name===w&&!r.hidden))return w}
  if(godHere())return GOD;const r=S.res.find(r=>!r.hidden);return r?r.name:null}
/* 水色の吹き出しのせいれいをタップ → 会話 → クエストがはじまる（会話の中でレシピを思いつくことも） */
function startTalk(){if(!$('#dialog').hidden)return;
  if(S.qStory!=null){const sq=QUESTS[S.qStory];TALKW=null;QUESTCLEARW=null;S.flags.talked1=true;
    if(sq.pre&&!S.flags['pre'+WD+'_'+S.qStory]){S.flags['pre'+WD+'_'+S.qStory]=true;questGives(sq,sq.pre);if(sheet==='food')renderSheet()}/* お礼の会話がはじまったら、すぐわたす（ベリーなど） */
    let once=0;return dialog(ideaDialogue(sq,sq.story,'clear'),()=>{if(once++||S.qStory!==QUESTS.indexOf(sq))return;/* 2回よばれても1回だけ */if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.quest===S.qStory)QUEST_CLEAR_WAIT=null;if(S.quest<=S.qStory)S.quest=S.qStory+1;/* 設置クエストは、お礼を聞き終えてから次の目標へ */S.qStory=null;const after=questGives(sq);inspireQuest(sq,'clear');{const rw=sq.reward??5;if(rw){S.pt+=rw;S.totalPt+=rw;toast('ごほうび：パワー+'+rw,'good')}}renderQuest();renderPalette();if(after)after();else checkQuest()},null)}
  const q=QUESTS[S.quest];if(!q||!q.talk)return;TALKW=null;QUESTCLEARW=null;S.flags.talked1=true;
  let once=0;dialog(ideaDialogue(q,q.talk.lines),()=>{if(once++||QUESTS[S.quest]!==q)return;/* 2回よばれても1回だけ */S.qTalked=true;recount();
    for(const id of q.talk.learn||[])S.recipes[id]=true;
    const after=q.talk.gives?questGives(q,q.talk.gives):null;inspireQuest(q);/* クエストに使う物は、会話のあとでわたす */
    sfx('quest');renderQuest();renderPalette();if(after)after();else checkQuest()},null)}
function renderQuest(){const q=QUESTS[Math.min(S.quest,QUESTS.length-1)];let pr='',t=S.cleared?(WD===FREE?'村づくりは、つづく…':'世界クリア！'):q.text;
  if(S.cleared&&WD!==FREE){const a=AFTERQ[S.aq||0],dd=S.daily,dn=dd?dd.k.filter(k=>dd.done[k]).length:0;if(a&&S.aqOn===(S.aq||0)){t=a.t;pr=aqProg(a)}else t=dd?'きょうの目標 '+dn+'/'+dd.k.length:'世界クリア！'}/* クリア後は、新しいクエストか、きょうの目標を出す */
  if(!S.cleared){const ms=qMissing(q);
    if(ms.length)t=ms.join('と')+'がもどるまで、お話は進まない';
    else if(S.qStory!=null||q.talk&&!S.qTalked)t=TALKW?TALKW+'が話したそうにしている':S.qStory==null&&q.talk.wait||'いまは、村をそだてよう';/* なにをすればいいか書く */
    else if(q.prog)pr=q.prog()}
  const qt=$('#questTxt');if(qt.dataset.k!==t+'|'+pr){qt.dataset.k=t+'|'+pr;qt.textContent='';const m=document.createElement('span'),g=document.createElement('span');m.className='qm';g.className='qp';m.textContent=t;g.textContent=pr;qt.append(m,g)}/* 進み具合は2行目に */
  const h=$('#questHow');if(!h.hidden&&h.dataset.q==S.quest)return;h.dataset.q=S.quest;h.hidden=true;h.innerHTML='<b>やりかた</b>';h.appendChild(document.createTextNode(q.how||''))}
const NUSHI_T=[
  {pre:['台座に、3つのかけらがそろった。'],open:[[POKO,'#joy|やったぁ……！ みんなのおかげで、ここまで来たんだ……！'],[MINA,'みんなぁ、台座に力をそそいでねぇ。']],scene:['#shocked|あたたかい風がふいて、荒れていた土地に、花がいっせいに咲きはじめた。','草原の奥から、風がふきぬけた。','葉がうずをまき、光がさす。そのなかに、みどりのつのをいただく白い大鹿が立っていた。'],name:'草原のヌシ',
   nushi:['#think|……ずいぶん長く、るすにしてしまったな。'],world:[['U','#joy|守り神よ、せいれいたちよ。かけらを取りもどしてくれて、ありがとう。'],['U','#danger|わたしは草原のヌシ。木のせいれいたちを生み、この地を見守ってきた者だ。'],['U','#think|……むかしは、昼と夜にも、それを見守るヌシがいたのだがな。'],['U','#danger|……おまえが、わたしのかわりに、この地の子らを見守ってくれていたのだな。']],
   next:[['U','#think|……守り神よ。もう、その役目は返してもらおう。この地は、わたしが見守る。おまえは、ほかの土地へ行ってよいのだ。'],['U','かけらにのこった記憶が教えてくれる。ほかの土地でも、ヌシは力を失い、自然の力がくずれたままだ。'],['U','まずは、火の山のふもと。地面の熱が冷えきって、温泉もこおりかけている。']],/* 次の土地の話は、フタバとの再会のあと */
   after:[[GOD,'#joy wave|おーい！ 遠くから見とったぞい〜。ようやったのう！'],[GOD,'#worry|……うむうむ！ わしは泣いとらんぞ。目に花びらが入っただけじゃ！'],[GOD,'ヌシ様の話、聞いたかの？ 次は「火山のふもとの村」じゃ。出発は、おヌシの好きなときでよいぞ。']],reu:[['F','ヌシ様……！ ヌシ様ぁっ！！'],['U','#think|……フタバ。待たせてしまったな。'],['F','#teary|ぼく、ずっと……ずっと待ってたんだよ……！'],['U','かけらを通して、おまえたちのがんばりは、ずっと感じていた。'],['U','あの夜、いちばん奥でふるえていたおまえが、今度はみんなを守ったのだな。'],['U','#worry|……おまえを、ひとりにしてしまった。すまなかった。'],['F','#think|……ううん。今は、ひとりじゃないよ！ 見て！ こんなに、なかまができたんだ！'],['F','#joy|……えへへ。おかえりなさいっ！'],['U','#think|……この草原の花。おまえが、咲かせてくれたのだな。いちばんに見られて、うれしいぞ。'],['F','#worry|……ヌシ様。きょうだいたちは……？'],['U','#think|……わたしにも、まだわからない。すまないな。'],['F','めぶきのしずくでも、だめなの……？'],['U','しずくは、消えたばかりの子を呼びもどすもの。ずっとむかしの子には、とどかぬのだ。'],['U','#surprise|ただ……自然にかえった子らは、この土地の風や土になる。新しい子らが、ここをなつかしく思うのは、そのせいかもしれぬ。'],['U','それに、あの子たちは、おまえを守りたくて前に出た。……おまえが今を生きていることを、きっとよろこんでいる。'],['F','#worry|……うん。ぼく、もう泣かないよ。'],['F','#cry|きょうだいたちがくれた明日を、ここで、みんなといっしょに歩いていく！'],['N','よかったねぇ、フタバ。',1],['H',{A:'みんなで守りきったね。やるじゃないか。',B:'みんなで守りきったな。やるじゃねえか。'},1],['M','この土地に、力がもどってきましたね。',1],['K','#joy|フッ…風まで、うれしそうだ。',1]],toast:'ステージクリア！ 守護の台座をタップすると「火山のふもとの村」へ行ける',last:'草原にもどる'},
  {open:[[HOMURA,'夜をこえたよ…！'],[SHIZUKU,'みなさん、力をそそいでください。']],scene:['#shocked|あたたかい湯気が村をつつみ、冷えきっていた地面に、ぬくもりがもどってきた。','火の山のほうから、大きな赤いけものが、おりてきた。'],
   nushi:['#think|……ふう。ようやく、体があたたまってきた。','守り神よ、せいれいたちよ。この地の熱を取りもどしてくれて、礼を言う。','わたしは、火のせいれいたちを生み、この火の山の熱を見守る者。草原のヌシとは、むかしからの知り合いだ。','#think|……あの影たちは、わたしの熱をうばっても、すこしもあたたまれなかったようだ。','かけらの記憶によれば、次は霧につつまれた水べの村。水の流れが止まり、霧がはれないままだという。'],
   after:[[GOD,'おつかれさん〜！ 見とったぞい。'],[GOD,'次は「霧のみずべの村」じゃ。…まだ道が通じておらんのじゃ。準備ができたら知らせるぞい。'],[HOMURA,'あたいたちは、この村と温泉をまもるよ。また入りにおいで！'],[SHIZUKU,'お気をつけて。…ときどき、温泉にいらしてくださいね。']],toast:'ステージクリア！ 「霧のみずべの村」は、ただいま準備中',last:'村にもどる'}];
let NUSHI_RUN=false;
function gatherAt(TX,TY,then){/* せいれいみんなが、台座のまわりへ歩いて集まる（瞬間移動はしない）。そろうか、10秒たったら、つぎへ */
  const spot={};const go=()=>{const used=new Set(Object.values(spot));for(const r of S.res){if(r.hidden||r.act&&r.act.type==='nmeet')continue;const G=bfs(r.x|0,r.y|0);let b=spot[r.id]??-1;if(b<0){let bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||used.has(k)||!walk(k)||S.obj[k]||roomOf(k))continue;const ky=(k/W)|0,d=Math.hypot(k%W+.5-TX,ky+.5-TY);if(d<1.6||d>5)continue;const sc=d+(ky<TY+1?3:0)+G.dist[k]*.02;/* 家の外の、台座の前がわ（見えるところ）に */if(sc<bd){bd=sc;b=k}}}if(b<0)continue;spot[r.id]=b;used.add(b);if(r.cing){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null}/* 料理のとちゅうなら、材料は箱にもどす */endAct(r);startAct(r,G,'nmeet',b,{run:true})}};
  const t0=performance.now();let last=0;const chk=()=>{const n=performance.now();if(n-last>1500){last=n;go()}if(S.res.every(r=>r.hidden||r.act&&r.act.type==='nmeet'&&r.act.stage==='do')||n-t0>10000)return then();setTimeout(chk,250)};setTimeout(chk,300)}
function nushiReturns(){if(NUSHI_RUN||S.cleared)return;NUSHI_RUN=true;S.flags.nushiDue=1;/* ヌシ様が帰ってくる場面。「クリア」にするのは、場面を最後まで見てから（途中でとじたら、はじめから） */
  checkQuest();renderQuest();const T=NUSHI_T[WD];
  const tw=S.obj.indexOf('tower'),TX=tw>=0?tw%W+1:CX+.5,TY=tw>=0?((tw/W)|0)+1:CY;
  centerOn(TX*TS,(TY-1)*TS);
  const openF=L=>{const o=L.filter(l=>l[0]===GOD||S.res.some(r=>r.name===l[0]));return o.length?o:[[GOD,'朝じゃな。…さあ、台座に力をそそぐんじゃ。']]};
  const runOpen=()=>dialog(openF(T.open),()=>gatherAt(TX,TY,()=>{
    // せいれいたちが、台座のまわりに集まってから、ひとりずつ力をそそぐ
    S.res.forEach((r,i)=>setTimeout(()=>{r.face=TX>=r.x?1:-1;JUMP.set(r,performance.now());spawnFX(r.x-.5,r.y-.6,ELEM[r.elem].col);sfx('furn')},i*260));
    const t0=S.res.length*260+500;
    setTimeout(()=>{spawnFX(TX-.5,TY-.2,'#fff3a0');for(let k=0;k<3;k++)setTimeout(()=>fx.push({k:'ring',x:TX*TS,y:TY*TS,life:1.4,col:'#fff6c8'}),k*300);sfx('level');flashScreen()},t0);
    // 光がひろがって、荒れた土地に花が咲いていく
    setTimeout(()=>{let n=0;const L=[];for(let t=0;t<4000&&L.length<60;t++){const x=(Math.random()*W)|0,y=(Math.random()*H)|0,k=y*W+x;if(Math.max(Math.abs(x+.5-TX),Math.abs(y+.5-TY))>14||S.obj[k]||S.floor[k]||S.ground[k]===1||L.includes(k)||S.res.some(r=>(r.x|0)===x&&(r.y|0)===y))continue;L.push(k)}
      L.sort((a,b)=>Math.hypot(a%W-TX,(a/W|0)-TY)-Math.hypot(b%W-TX,(b/W|0)-TY));L.forEach((k,i)=>setTimeout(()=>{if(S.obj[k])return;S.obj[k]='clover';burst(k,'plant');if(i%6===0)sfx('bush');if(i===L.length-1)recount();dirty=true},i*45))},t0+700);
    setTimeout(()=>dialog(T.scene,()=>{
      // ヌシ様が台座の上にあらわれる
      S.nushi={x:TX,y:TY+.95,t:6,app:0,dir:1,face:1,path:[]};
      spawnFX(TX-.5,TY-.6,'#c8ffd0');sfx('arrive');flashScreen();
      setTimeout(()=>dialog(T.nushi,()=>{
        startClap();for(const r of S.res)r.bubble='👏';for(let k=0;k<8;k++)setTimeout(()=>{const r=pick(S.res);if(r)spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))},k*350);setTimeout(endClap,3200);/* みんなで拍手 */
        dialog((T.world&&sevLines(T.world)||[]).concat(T.reu&&sevLines(T.reu)||[],T.next&&sevLines(T.next)||[],T.after),()=>{
          S.cleared=true;delete S.flags.nushiDue;NUSHI_RUN=false;renderQuest();toast(T.toast,'good');
          S.clearDay=dayNo();S.score=calcScore();setTimeout(()=>dialog(['#think|……この土地も、元に戻ったのう'],()=>openSheet('score'),T.last,GOD),1200);
        });
      },null,T.name||'ヌシ様'),3200);
    },null,''),t0+3600);
  }));
  T.pre?dialog(T.pre,runOpen,null,''):runOpen();
}
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
  '#think|昼と夜は、ふたつでひとつ。どちらかが欠けると、もう一方も、すこしずつ弱っていく。',
  '雨の日は、葉がよろこぶ。わたしも、すこしだけ、背がのびた気がする。',
  '守り神よ。おまえは、つかれないのか。……ふむ。神というのも、たいへんだな。',
  '#think|この台座には、子らの「守りたい」が、たくさんしみこんでいる。……あたたかいな。',
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
function nushiTalk(){const n=S.nushi,nm=WD===1?'火のヌシ':NUSHI1,k=WD===1?1:0;
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
