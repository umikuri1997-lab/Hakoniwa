'use strict';
/* せいれいとのお話（せいれいの画面の「お世話」タブ）。
   話すのは、えらんだせいれいだけ（守り神さまに話しかける）。口調は chatTone で、その子の言いかたにかえる。
   はじめのあいさつ（時刻）＋ 話題（いまのようす・きょうあったこと・たのしかったこと・雑談）。
   いつでも話せる。たのしさ+10（TALKFUN）は、1日に1回（r.care.talk、callDay）。
   きょうあったこと：作業がおわったときに dayNote でおぼえる（r.dl：{d:callDay, e:[[種類,なに],...]}）。 */
const TALKFUN=10,DLMAX=16;
const DLFUN=new Set(['play','chat','fish','bathe','critwatch','sunset','rainjoy','eat','admire','ownseat']);/* たのしかったことにする物 */
function dayNote(r,a){if(!r||!a||IS_STORY_REPLAY)return;let v='';const t=a.type;
  if(t==='play')v=a.what||'';else if(t==='chat'||t==='tag'){const p=S.res.find(q=>q.id===a.partner);if(!p)return;v=p.name}
  else if(t==='eat'){v=(a.items||[])[0]||'';if(!FOODS[v])return}else if(t==='cook'){v=r.cing&&r.cing.rec||'';if(!FOODS[v])return}
  else if(t==='build'){const d=S.dyn[a.obj];v=d&&d.build||'';if(!BL[v])return}else if(t==='craft'){const o=(S.orders||[]).find(q=>q.id===a.order);v=o&&o.type||'';if(!BL[v])return}
  else if(t==='harvest'){const d=S.dyn[a.obj],o=S.obj[a.obj];v=o==='farm'?(d&&cropK(d)):o==='fruit'?'apple':'berry';if(!FOODS[v]&&!(CROPS[v]))return}
  else if(t==='plant'){const d=S.dyn[a.obj];v=d&&d.plant||'';if(!BL[v])return}
  else if(t==='admire'){v=S.obj[a.obj]||'';if(!BL[v])return}
  else if(!['fish','bathe','critwatch','sunset','rainjoy','chop','mine','weed','water','till','repair','ownseat'].includes(t))return;
  const d=callDay();if(!r.dl||r.dl.d!==d)r.dl={d,e:[]};const E=r.dl.e;for(let i=E.length-1;i>=0;i--)if(E[i][0]===t&&E[i][1]===v)E.splice(i,1);E.push([t,v]);if(E.length>DLMAX)E.shift()}
const dlToday=r=>r.dl&&r.dl.d===callDay()?r.dl.e:[];
const tName=id=>BL[id]?BL[id].name:FOODS[id]?FOODS[id].name:CROPS[id]?CROPS[id].name:LIKES[id]||'',fName=id=>FOODS[id]?FOODS[id].name:CROPS[id]?CROPS[id].name:tName(id);/* 食べ物は、食べ物の名前（ベリーの茂みでなく、ベリー） */
/* きょうしたことのセリフ（2行） */
function dayLine(r,[t,v]){const fav=favDish(r);switch(t){
  case 'play':{if(v==='flower')return['きょうは、お花のそばで遊んだんだ。','いいにおいがして、うれしくなっちゃった。'];const n=tName(v)||'遊び家具';return r.like===v?['#joy|きょうは、'+n+'で遊んだよ！',n+'、だいすきなんだ。']:['きょうは、'+n+'で遊んだよ。','またあした、遊びにいこうかな。']}
  case 'chat':case 'tag':return['きょうは、'+v+'とおしゃべりしたよ。','いろんな話をして、たのしかったな。'];
  case 'eat':return v===fav?['#joy|きょうは、'+fName(v)+'を食べたんだ！','いちばん好きなごはんなんだ。']:['きょうは、'+fName(v)+'を食べたよ。','おなかいっぱいで、しあわせ。'];
  case 'cook':return['きょうは、'+fName(v)+'を作ったよ。','みんな、よろこんでくれるといいな。'];
  case 'build':return['きょうは、'+tName(v)+'を建てたんだ。','できあがると、やっぱりうれしいね。'];
  case 'craft':return['きょうは、'+tName(v)+'を作ったよ。','どこに置いてもらえるかな。'];
  case 'harvest':return['きょうは、畑で'+fName(v)+'をとったよ。','たくさんとれると、うれしいね。'];
  case 'plant':return['きょうは、'+tName(v)+'を植えたよ。','大きくなるのが、たのしみだな。'];
  case 'admire':return['きょう、あたらしい'+tName(v)+'を見にいったよ。','村が、またすてきになったね。'];
  case 'fish':return['きょうは、つりをしたんだ。','じっと待つ時間も、わるくないね。'];
  case 'bathe':return['きょうは、水あびをしたよ。','さっぱりして、気持ちよかった！'];
  case 'critwatch':return['きょう、ちいさな生き物を見つけたんだ。','そっと見てたら、時間をわすれちゃった。'];
  case 'sunset':return['さっき、夕やけを見たよ。','空が、まっかで、きれいだったなあ。'];
  case 'rainjoy':return['#joy|雨、気持ちよかったね！','ぽつぽつって、からだにしみこむ感じ。'];
  case 'chop':return['きょうは、木を切ったよ。','木のにおいって、おちつくね。'];
  case 'mine':return['きょうは、石をほったよ。','かたい石も、こつこつやれば、ちゃんとわれるんだ。'];
  case 'weed':return['きょうは、草むしりをしたよ。','すっきりして、気持ちいいね。'];
  case 'water':return['きょうは、畑に水をやったよ。','作物が、ごくごく飲んでるみたいだった。'];
  case 'till':return['きょうは、畑をたがやしたよ。','ふかふかの土になったんだ。'];
  case 'repair':return['きょうは、こわれた所を直したよ。','これで、またみんなを守れるね。'];
  case 'ownseat':return['きょうは、じぶんの席でひと休みしたよ。','あそこに座ると、ほっとするんだ。']}
  return null}
/* いまのようす：urgent は、ほかの話題より先 */
function nowTopic(r){const n=hour(),gn=goneTalkName(),T=S.trouble&&S.trouble.id===r.id?S.trouble.k:null,foe=isNight()&&S.enemies.some(e=>e.spawned&&!e.dead);
  if(foe)return{u:1,L:r.elem==='fire'||fighter(r)?['#danger|「コワイノ」が来てる……！','だいじょうぶ、村はぼくたちが守るから。']:['#scared|「コワイノ」が来てる……こわいよ。','守り神さま、そばにいてね。']};
  if(r.came===dayNo()&&!r.back)return{u:1,L:['この村に来たばかりで、まだ、どきどきしてるんだ。','#joy|これから、よろしくね！']};
  if(r.grief&&gn)return{u:1,L:['#sigh|……'+gn+'のこと、ときどき思い出すんだ。','いつも、そこにいたのにね。']};
  if(r.hunger<500)return{u:1,L:['#sigh|おなか、ぺこぺこなんだ……。','あとで、ごはんを食べにいくね。']};
  if(r.energy<30)return{u:1,L:['ふあぁ……ちょっと、つかれちゃった。','すこし休んだら、また、がんばるね。']};
  const L=[];
  if(T==='cramped')L.push(['#think|家が、ちょっとせまくて……。','もうすこし広かったら、のびのびできるのにな。']);
  if(T==='dark')L.push(['#think|夜、家のまわりが暗くて、ちょっとこわいんだ。','あかりがあったら、安心できるのにな。']);
  if(T==='fav')L.push([BL[likeF(r)].name+'が、ずっとほしいんだ。','あったら、毎日ながめちゃうな。']);
  if(T==='far')L.push(['ごはんの箱まで、ちょっと遠いんだ。','おなかがすくと、たどりつくまでがたいへん。']);
  if(isNight())L.push(['夜は、しずかだね。','みんな、ぐっすり眠れるといいな。']);
  else if(S.rain)L.push(r.elem==='water'?['#joy|雨の日って、うれしくなっちゃう。','ぽつぽつって、だれかが歌ってるみたい。']:['雨、なかなかやまないね。','でも、草や花は、よろこんでるみたい。']);
  else if(rainbowToday())L.push(['#joy|空に、虹が出てるよ！','見てるだけで、元気になっちゃうね。']);
  if(S.ns&&S.ns.rw&&n<12)L.push(['ゆうべは、ぶじでよかった！','守り神さまも、ありがとう。']);
  if(S.today){const t={hosaku:['きょうは、畑がにぎやかだね！','たくさんとれるといいな。'],oshaberi:['きょうは、おしゃべりしたい気分！','だれと話そうかな。'],odayaka:['今夜は、しずかになりそうだね。','ゆっくり休めそう。'],kaze:['きょうは、風がつよいね！','種が、とんでくるかもしれないよ。'],kami:['#joy|カミサマが来てるよ！','なにを持ってきてくれたのかな。'],hoshi:['今夜は、星がきれいなんだって。','早く夜にならないかな。'],mono:['きょうは、落とし物がいっぱいあるんだって。','さがしにいかなくちゃ。']}[S.today];if(t)L.push(t)}
  if(festOn())L.push(['#joy|おまつり、たのしいね！','ちょうちんのあかりが、きれいだなあ。']);
  return L.length?{u:0,L:pick(L)}:null}
/* 雑談：その子の好きな物・なかよし・村のようす・属性ごとの話 */
function smallTalk(r){const m=bestMate(r),fav=FOODS[favDish(r)],L=[
  [LIKES[r.like]+'が、だいすきなんだ。','いつまでも、やっていられるよ。'],
  [fav.name+'が食べたいなあ。','思いうかべるだけで、おなかがなっちゃう。'],
  ['ねえ、雲って、どこまで流れていくのかな。','いつか、追いかけてみたいな。'],
  ['きのうね、ふしぎなゆめを見たんだ。','空をとぶ魚と、いっしょに泳ぐゆめ。'],
  ['きのう、石をひとつ拾ったんだ。','まるくて、つるつるで、ひみつのたからものにしたよ。'],
  ['星って、いくつあるのかな。','いつか、ぜんぶ数えてみたいな。'],
  ['この村に来てよかったなって、ときどき思うんだ。','#joy|守り神さまが、見ててくれるからかな。'],
  [BL[likeF(r)].name+'がある家って、すてきだと思うんだ。','ながめてるだけで、しあわせになるよ。'],
  {earth:['土って、さわると、あったかいんだよ。','きょうも、いい土のにおい。'],fire:['たき火の火を見てると、元気がわいてくるんだ。','ぱちぱちって音も、好きだな。'],water:['水の音を聞いてると、心がしずかになるの。','川のせせらぎって、ずっと聞いていられるね。'],wind:['風がね、遠くの話をはこんでくるんだよ。','きょうは、どんな話が来るかな。'],wood:['木の葉っぱが、さわさわ言ってるよ。','きっと、おしゃべりしてるんだね。']}[r.elem]];
  if(m)L.push([m.name+'とは、なかよしなんだ。','いっしょにいると、時間がすぐたっちゃう。']);
  if(!HOUSES.length)L.push(['みんなの家があったら、いいなあ。','雨の日も、ぽかぽかでいられるもん。']);
  if(GRASSN>=450)L.push(['みどりがふえて、風のにおいがかわったね。','草のにおい、好きなんだ。']);else if(GRASSN<60)L.push(['もっと草花がふえたら、いいなあ。','そしたら、村がもっとにぎやかになるよ。']);
  return pickFresh('talk:'+r.name,L)}
function hiLine(r){const n=hour();return n>=5&&n<10?'あ、守り神さま。おはよう！':n>=17&&n<20?'あ、守り神さま。もう夕方だね。':isNight()?'あ、守り神さま。まだ起きてるの？':pick(['#joy|あ、守り神さま！','守り神さま、こんにちは！','あ、守り神さま。ちょうどよかった。'])}
const evPick=(r,L)=>{const k=e=>e[0]+':'+e[1],C=L.filter(e=>k(e)!==r.tle),e=pick(C.length?C:L);r.tle=k(e);return e};/* 前に話したことは、つづけて話さない */
function talkLines(r){const now=nowTopic(r),E=dlToday(r);let L=null;
  if(now&&now.u)L=now.L;
  else{const C=[];if(now)C.push('now');const fun=E.filter(e=>DLFUN.has(e[0])),work=E.filter(e=>!DLFUN.has(e[0]));if(fun.length)C.push('fun');if(work.length)C.push('day');C.push('chat');
    const C2=C.filter(c=>c!==r.tlk),k=pick(C2.length?C2:C);r.tlk=k;/* 前と同じ種類の話題は、つづけない */
    if(k==='now')L=now.L;else if(k==='fun'){const e=evPick(r,fun),d=dayLine(r,e);if(d)L=e[0]==='rainjoy'||e[0]==='sunset'?d:['きょう、いちばんたのしかったのはね……',d[0].replace(/^(#[^|]*\|)?きょう(は)?、/,'$1'),d[1]]}else if(k==='day'){L=dayLine(r,evPick(r,work))}
    if(!L)L=smallTalk(r)}
  return[hiLine(r),...L].map((t,i)=>[r.name,chatTone(t,r,i)])}
function talkTo(r){if(!r||r.hidden||!S.res.includes(r))return;const owner=S,id=r.id,d=callDay();DLGTAP=performance.now();
  dialog(talkLines(r),()=>{if(S!==owner)return;const q=S.res.find(x=>x.id===id);if(!q)return;const c=q.care||(q.care={});if(c.talk!==d){c.talk=d;q.fun=Math.min(100,q.fun+TALKFUN);addFloat(q.x,q.y-1.6,'たのしさ+'+TALKFUN,'#ffd7e8')}JOYU.set(q,performance.now()+2000);q.bubble='💕';if((S.subSt||{}).talk1===2)S.flags.talkQ=1;dirty=true;resTab=2;openSheet('res',id)})}
