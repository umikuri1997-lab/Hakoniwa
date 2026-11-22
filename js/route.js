/* ---------- お話の道をえらぶ（草原） ----------
   土のなかまのあと、火・水・風の3つの話（ROUTE_ARCS）の順番を、自分でえらぶ。オオカゲの話（ROUTE_BOSS）は、2つめの話のあと。
   こもれびのまもり（夜に火のせいれいを守る）・オオカゲとたたかうのは火のせいれいなので、火は1つめか2つめ。
   S.flags.route：えらんだ順（新しいゲームは []。前のセーブは、ない＝いまのならび 火・水・風）。
   QUESTS1 を、その順にならべかえる（routeApply。QUESTS は同じ配列）。えらぶのは、その話の目標になったとき（話を聞く前）だけ。
   御神木の調べは、何番めかで、1つめ 芽・2つめ 一枚目の葉・3つめ ヌシ様の声（routePos）。会話も、何番めかでかわる。 */
const ROUTE_ARCS={fire:['fire','fireRoot','warmMeal'],water:['water','waterFilm','aoFish'],wind:['wind','windEcho','kite']},ROUTE_BOSS=['kagemark','ookage','guardLearn'],ROUTE_DEF=['fire','water','wind'];
const ROUTE_ROOT={fire:'fireRoot',water:'waterFilm',wind:'windEcho'};
function routeFull(s){s=s||S;const r=s&&s.flags&&Array.isArray(s.flags.route)?s.flags.route.slice(0,3):ROUTE_DEF.slice();for(const e of ROUTE_DEF)if(!r.includes(e))r.push(e);if(r[2]==='fire'){r[2]=r[1];r[1]='fire'}return r}/* まだえらんでいない所は、いまのならびでうめる（火は3つめにしない） */
const routePos=el=>routeFull().indexOf(el);
let QROUTE='def',QORIG=null;
function routeApply(){if(typeof QUESTS1==='undefined')return;if(!QORIG||QORIG.length!==QUESTS1.length&&QROUTE==='def')QORIG=QUESTS1.slice();
  const key=S&&WD===0&&!S.free&&!IS_STORY_REPLAY?routeFull().join():'def';if(key===QROUTE&&QUESTS1.length===QORIG.length)return;
  const ids=QORIG.map(q=>q.id),all=[...ROUTE_DEF.flatMap(e=>ROUTE_ARCS[e]),...ROUTE_BOSS],ix=all.map(id=>ids.indexOf(id));if(ix.some(i=>i<0))return;const a=Math.min(...ix),b=Math.max(...ix);if(b-a+1!==all.length)return;/* つづいてならんでいないときは、ならべかえない */
  const by=id=>QORIG[ids.indexOf(id)],R=key==='def'?ROUTE_DEF:routeFull(),mid=[...ROUTE_ARCS[R[0]],...ROUTE_ARCS[R[1]],...ROUTE_BOSS,...ROUTE_ARCS[R[2]]].map(by);
  QUESTS1.splice(0,QUESTS1.length,...QORIG.slice(0,a),...mid,...QORIG.slice(b+1));QROUTE=key}
const ROUTE_NAME={fire:'火のせいれい',water:'水のせいれい',wind:'風のせいれい'},ROUTE_DESC={fire:'夜、村を守る。',water:'水やり・水くみをする。',wind:'落ちている物をひろう。遊ぶのが好き。'};
let ROUTEPOP=null;
function routeTick(){if(!S||WD!==0||S.free||IS_STORY_REPLAY||!Array.isArray(S.flags.route))return;routeApply();const r=S.flags.route;if(r.length>=3)return;
  const slot=QUESTS1.findIndex(q=>q.id===ROUTE_ARCS[routeFull()[r.length]][0]);if(slot<0||S.quest<slot)return;/* その話の目標になったときに、えらぶ */
  if(r.length===2||S.quest>slot||S.qTalked){r.push(routeFull()[r.length]);if(r.length===2)r.push(routeFull()[2]);routeApply();dirty=true;return}/* 話を聞いたあと・前のならびのまま進んだ：いまのならびにきめる */
  const opts=r.length===0?ROUTE_DEF.slice():r[0]==='fire'?['water','wind']:['fire'];if(opts.length===1){r.push(opts[0]);r.push(ROUTE_DEF.find(e=>!r.includes(e)));routeApply();dirty=true;return}
  if(ROUTEPOP||sheet||typeof MEMRUN!=='undefined'&&MEMRUN)return;{const dg=document.getElementById('dialog'),lu=document.getElementById('lvup');if(dg&&!dg.hidden||lu&&!lu.hidden)return}if(typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE||typeof LVPOP!=='undefined'&&LVPOP)return;routePop(opts)}
function routePop(opts){/* つぎにむかえるなかまを、えらぶ（えらぶまで、とじない） */
  const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:12px 24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:360px;width:100%;max-height:100%;box-sizing:border-box;display:flex;flex-direction:column;color:var(--ink)"><b style="display:block;font-size:15px;margin-bottom:8px">つぎは、どのせいれいをむかえる？</b><div class="rows ks" style="min-height:0;overflow-y:auto"></div></div></div>');
  ROUTEPOP=o;const R=o.querySelector('.ks');
  for(const e of opts){const r=rowEl(ROUTE_NAME[e],ROUTE_DESC[e],null),b=el('<button class="btn pri">むかえる</button>');b.onclick=()=>{sfx('good');const L=S.flags.route;L.push(e);if(L.length===2)L.push(ROUTE_DEF.find(x=>!L.includes(x)));if(L.length===1&&e!=='fire'){L.push('fire');L.push(ROUTE_DEF.find(x=>!L.includes(x)))}routeApply();dirty=true;o.remove();ROUTEPOP=null;memo('leaf',ROUTE_NAME[e]+'を、つぎにむかえることにした')};r.appendChild(b);R.appendChild(r)}
  document.body.appendChild(o)}
/* ---- 何番めかで、かわる会話 ---- */
const rHas=el=>typeof elemCount==='function'&&elemCount(el)>0;
const rStageWord=st=>st===1?'芽':'若葉';
function routeWaterTalk(){const st=routePos('water');return [[POKO,st===0?'切り株の根っこに、毎日お水をあげてるんだ。':'切り株の'+rStageWord(st)+'、毎日見に行って、お水もあげてるんだ。'],[POKO,'#think|でも、ちゃんと飲めてるのか、わからなくて……。'],[MINA,'水のことなら、水のせいれいがくわしいよぉ。畑の水やりも、得意なんだってぇ。'],[MINA,'#nod|みんながここで楽しく暮らして、村が育って、水の力もたまったら、来てくれるかもねぇ。']]}
function routeWaterStory(){const st=routePos('water'),L=[['M','はじめまして。水やりや、水をくむ仕事なら、わたしにまかせてください。'],[POKO,'水のせいれいが来てくれた！ 畑がうるおうね！ これで、切り株'+(st?'の'+rStageWord(st):'')+'にも、ちゃんと水がとどくかな。']];if(rHas('fire'))L.push(['H','へぇ、水のせいれいか。悪くない村になってきたじゃねえか。']);L.push(['@choice',choiceGuide()]);return L}
function routeWindTalk(){const st=routePos('wind');return [[POKO,st===0?'#think|切り株、まだ、しずかなんだ。風がふくと、さみしそうな音がするの。':st===1?'#think|切り株の芽、風がふくと、ちょっとだけゆれるの。':'#think|切り株の葉っぱ、まだ一枚だけなんだ。風がふくと、ちょっとだけゆれるの。'],[MINA,'風のせいれいはねぇ、そよ風みたいな、やさしい風も使えるんだよぉ。遊ぶのが大好きなんだぁ。'],[MINA,'あの'+(st===0?'切り株':st===1?'芽':'葉っぱ')+'にも、いい風を運んでくれるかもしれないねぇ。風の力をためれば、来てくれるはずだよぉ。'],[POKO,'#think|じゃあ、ふわっとゆれる遊び道具があったら、よろこんでくれるかな？ 守り神さま、なにか思いつく？'],['@idea']]}
function routeWindStory(){const st=routePos('wind'),all=['wood','earth','fire','water','wind'].every(rHas);return [['K','フッ……風に呼ばれて来てみれば、ずいぶん素朴な村だね。'],[POKO,all?'風のせいれいが来た！ これで、木・土・火・水・風のなかまがそろったね！':'風のせいれいが来た！ 空が、ひろく見えるね！'],['K','フッ……素朴なのも、悪くない。ぼくの風で、もっと華やかにしてあげよう。'],[POKO,'#think|……そうだ。あの切り株'+(st?'の'+rStageWord(st):'')+'にも、やさしい風をとどけてくれるかな。']]}
function routeWaterFilmIn(){const st=routePos('water');return [["M","フタバさん。その水は、どちらへ？"],["F",st===0?"あの木に。根っこが、かわいてると思って。":st===1?"あの木に。芽が出たんだよ！":"あの木に。葉っぱが、一枚ひらいたんだよ！"],["M","……根のところまで、届いていないようです。"],["F","こんなに、持ってきたのに？"],["M","ええ。でも、どこで止まっているか、わかりました。"],["M","木のそばに、井戸をほりましょう。地面の下の水を、木のそばでくんで、少しずつ流して確かめたいのです。"]]}
function routeWindEchoIn(){const st=routePos('wind');return [["K","ずいぶん大事にされているね。この木は。"],["F","みんなで、お世話してるんだ。"],["K","……根もとへ、風を通してみてもいいかな。"],["F",st===0?"根っこ、冷えない？":st===1?"芽、飛んでいかない？":"葉っぱ、飛んでいかない？"],["K","そんな乱暴な風は、使わないさ。"],["K","木のそばに、風車を建ててもいいかな。羽が回れば、風の強さが目で見える。強すぎたら、すぐわかるよ。"]]}
const ROUTE_C={fire:'H',water:'M',wind:'K'};
function routeOut(el){/* 調べのあとの会話：その話の会話 → 何番めかで、芽・一枚目・ヌシ様の声 */const c=ROUTE_C[el],p=routePos(el),L=el==='fire'?[["F","ずっと、そばにいなくてもいいの？"],["H","村の見回りもあるからな。おれがいないあいだも、冷えにくくしてやろう。"]]:el==='water'?[["F","じゃあ、いっしょに見ててくれる？"],["M","はい。",0,"stree:sit"]]:[["F","風、きもちいいね。"],["K","フッ……この木も、そう言ってるさ。"]];
  if(p===0)L.push(["F","待って。前に来たときも、ここにあった？",0,"stree:bud"],["N","……芽だねぇ。"],["F","#joy|芽！"],...(el==='fire'?[["H","見張ってても、急にはでかくならねえぞ。"],["F","でも、見てたい。"],["H","……じゃあ、ちょっとだけな。"]]:[[c,el==='water'?"芽が、出ましたね。":"フッ……小さいけど、いい芽だ。"],["F","#joy|うん！ ずっと見てたい。"]]));
  else if(p===1)L.push(["F","……あ。",0,"stree:leaf"],["F","一枚だけだ。"],[c,el==='fire'?"一枚目、だな。":el==='water'?"一枚目、ですね。":"フッ……一枚目、だね。"],["F","#teary|うん。一枚目。"]);
  else L.push(["F","#teary|……生きてる。"],["N","聞いてくれたねぇ。",0,"stree:touch"],["F","守り神さま。……ヌシ様を、もとの姿にもどしてあげたい。"],["F","また、この木の下で……みんなで会いたい。"]);return L}
const ROUTE_VOICE={fire:[["H","……石が、まだあったかい。……中で、なにかが、ゆれてる。"],["H","……フタバ。おまえが、話しかけてみな。"]],water:[["M","……水の中で、とても細い音がします。"],["M","……フタバさん。話しかけて、みてください。"]],wind:[["K","……聞こえた。とても、細い音だ。"],["K","……フタバ。きみが、話してみて。"]]};
function routeVoice(el){/* 3つめの調べ：ヌシ様の声（前は風の調べの中にあった） */return [...ROUTE_VOICE[el],["F","ヌシ様。ぼく、ここにいるよ。",0,"stree:quiet"],["F","……前は、ひとりだったけど。今は、ノドカも、みんなもいるんだ。"],["F","……。",0,"stree:echo"],["……","……フタバ。",0,"stree:reply"],["F","……うん。"],["……","……そうか。……よかった。",0,"stree:quiet+stree:lookup+stree:glow"]]}
function routeSceneSetup(){/* 御神木の調べの場面：3つめの話だけ、さいごにヌシ様の声 */if(typeof FIELD_STORIES==='undefined'||FIELD_STORIES.__route)return;FIELD_STORIES.__route=1;
  {const st=FIELD_STORIES.windEcho&&FIELD_STORIES.windEcho[0];if(st){const L=st.lines,k=L.findIndex(l=>/聞こえた。とても、細い音だ/.test(l[1]||''));if(k>0)ROUTE_BASE.wind=L.slice(0,k)}}
  for(const el of ROUTE_DEF){const st=FIELD_STORIES[ROUTE_ROOT[el]]&&FIELD_STORIES[ROUTE_ROOT[el]][0];if(!st)continue;if(!ROUTE_BASE[el])ROUTE_BASE[el]=st.lines.slice();Object.defineProperty(st,'lines',{configurable:true,enumerable:true,get(){return routePos(el)===2?ROUTE_BASE[el].concat(routeVoice(el)):el==='wind'?ROUTE_BASE.wind.concat([["K","……木が、風にこたえてる。"]]):ROUTE_BASE[el]}})}}
const ROUTE_BASE={};
(function routeHook(){/* 読みこみのとき：火・水・風の話の会話と、調べの場面を、何番めかでかわるようにする */
  const q=id=>QUESTS1.find(x=>x.id===id),lines=(o,f)=>{if(o&&o.talk)Object.defineProperty(o.talk,'lines',{configurable:true,enumerable:true,get:f})},story=(o,f)=>{if(o)Object.defineProperty(o,'story',{configurable:true,enumerable:true,get(){return KS(f())}})};
  lines(q('water'),routeWaterTalk);story(q('water'),routeWaterStory);lines(q('wind'),routeWindTalk);story(q('wind'),routeWindStory);
  lines(q('waterFilm'),()=>KS(routeWaterFilmIn()));lines(q('windEcho'),()=>KS(routeWindEchoIn()));
  for(const el of ROUTE_DEF){const o=q(ROUTE_ROOT[el]);if(!o)continue;story(o,()=>routeOut(el));delete o.gives;Object.defineProperty(o,'gives',{configurable:true,enumerable:true,get(){return routePos(el)===2?{flag:'nushiAlive'}:undefined}})}/* ヌシ様が生きているとわかるのは、3つめの調べ */
  routeSceneSetup()})();
