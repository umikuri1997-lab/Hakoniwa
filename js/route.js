/* ---------- 火・水・風の話（草原） ----------
   土のなかまのあと、火・水・オオカゲ・風の順にむかえる（ROUTE_DEF。えらべない。持ち主がきめた）。
   御神木の調べは、何番めかで、1つめ 芽・2つめ 一枚目の葉・3つめ ヌシ様の声（routePos）。会話も、何番めかでかわる。 */
const ROUTE_DEF=['fire','water','wind'];
const ROUTE_ROOT={fire:'fireRoot',water:'waterFilm',wind:'windEcho'};
const routePos=el=>ROUTE_DEF.indexOf(el);
/* ---- 何番めかで、かわる会話 ---- */
const rHas=el=>typeof elemCount==='function'&&elemCount(el)>0;
const rStageWord=st=>st===1?'芽':'若葉';
function routeWaterTalk(){const st=routePos('water');return [[FUTABA,st===0?'切り株の根っこに、毎日お水をあげてるんだ。':'切り株の'+rStageWord(st)+'、毎日見に行って、お水もあげてるんだ。'],[FUTABA,'#think|でも、ちゃんと飲めてるのか、わからなくて……。'],[NODOKA,'水のことなら、水のせいれいがくわしいよぉ。畑の水やりも、得意なんだってぇ。'],[NODOKA,'#nod|みんながここで楽しく暮らして、村が育って、水の力もたまったら、来てくれるかもねぇ。']]}
function routeWaterStory(){const st=routePos('water'),L=[['M','はじめまして。水やりや、水をくむ仕事なら、わたしにまかせてください。'],[FUTABA,'水のせいれいが来てくれた！ 畑がうるおうね！ これで、切り株'+(st?'の'+rStageWord(st):'')+'にも、ちゃんと水がとどくかな。']];if(rHas('fire'))L.push(['H','へぇ、水のせいれいか。悪くない村になってきたじゃねえか。']);L.push(['@choice',choiceGuide()]);return L}
function routeWindTalk(){const st=routePos('wind');return [[FUTABA,st===0?'#think|切り株、まだ、しずかなんだ。風がふくと、さみしそうな音がするの。':st===1?'#think|切り株の芽、風がふくと、ちょっとだけゆれるの。':'#think|切り株の葉っぱ、まだ一枚だけなんだ。風がふくと、ちょっとだけゆれるの。'],[NODOKA,'風のせいれいはねぇ、そよ風みたいな、やさしい風も使えるんだよぉ。遊ぶのが大好きなんだぁ。'],[NODOKA,'あの'+(st===0?'切り株':st===1?'芽':'葉っぱ')+'にも、いい風を運んでくれるかもしれないねぇ。風の力をためれば、来てくれるはずだよぉ。'],[FUTABA,'#think|じゃあ、ふわっとゆれる遊び道具があったら、よろこんでくれるかな？ 守り神さま、なにか思いつく？'],['@idea']]}
function routeWindStory(){const st=routePos('wind'),all=['wood','earth','fire','water','wind'].every(rHas);return [['K','フッ……風に呼ばれて来てみれば、ずいぶん素朴な村だね。'],[FUTABA,all?'風のせいれいが来た！ これで、木・土・火・水・風のなかまがそろったね！':'風のせいれいが来た！ 空が、ひろく見えるね！'],['K','フッ……素朴なのも、悪くない。ぼくの風で、もっと華やかにしてあげよう。'],[FUTABA,'#think|……そうだ。あの切り株'+(st?'の'+rStageWord(st):'')+'にも、やさしい風をとどけてくれるかな。']]}
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
