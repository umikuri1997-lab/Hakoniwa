'use strict';


/* ---------- ステージ2：火山のふもとの村 ---------- */
const PROLOGUE2=[
  [GOD,'さて、次の土地じゃな。草原のみなも、元気にやっとるようで、なによりじゃ。'],
  [GOD,'ここは火の山のふもとの村。……この山のヌシが、力をうばわれてしもうてな。'],
  [GOD,'#worry|あそこには、ひとりでのこっとる子がおる。はよう行ってやらんとのう。'],
  [GOD,'では、行こうかの。'],
];
const INTRO2=[
  [GOD,'ほい到着〜。ここが火山のふもとの村じゃ。','volcam+vol:introStart'],
  [HOMURA,'…ん？ あんたが、うわさの守り神かい？','homcam+vol:lookbackH'],
  [HOMURA,'あたいはホムラ、火のせいれいさ。この村にのこってるのは、もうあたいひとりだよ。'],
  [HOMURA,'#think|……さいきんさ、風が、なんだかあったかい所から来る気がするんだ。……ふしぎだね。'],
  [HOMURA,'#hush|……つめたいね。ここ、朝はいちばんに湯気が上がるとこだったんだよ。','vol:touchA'],/* 入口の温泉まで歩いて、水に手を入れる */
  [GOD,'#joy|ひとりで、よう待っとったのう。……その湯気、わしにも見せてくれんか。','vol:shoulders'],
  [HOMURA,'#wave|……ま、寒くてかなわないからね。よろしく頼むよ。','vol:wave'],
  [GOD,'まずは、わしの居場所になる神殿じゃな。……あそこの古い神殿、ずいぶん、くずれとるのう。','vol:temple'],
  [HOMURA,'#think|ああ、あれかい。だれも直す子がいなくてさ。'],
  [GOD,'#joy|では、ホムラに直してもらおうかの。'],
];
const QUESTS2=[
  {id:'statue',text:'神殿を直してもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'「しらべる」で、こわれた神殿をタップ',story:[
    [HOMURA,'#surprise|ほんとに直っちまった。'],[HOMURA,'へえ、なかなかいい神殿じゃないか。'],
    [GOD,'じゃろ〜。ここが、おヌシとわしの居場所じゃ。'],
    [GOD,'#joy|くらしの道具は、とどけておいたぞい。'],[HOMURA,'……ま、助かるよ。']],
   gives:{feat:['inv','remove','plant','craft','people'],flag:'lv_oven',recipes:['oven','bed','crate','wbench'],items:{oven:1,bed:1,wbench:1,bamboowall:3,misugaki:10,spike:10},mat:{wood:10,stone:10},enemy:true}},
  {id:'coldSpring',text:'冷たい温泉を調べよう',check:()=>sprLookN()>=2,prog:()=>'調べた水たまり '+Math.min(2,sprLookN())+'/2',how:'「しらべる」で、西と奥の水たまりをタップする',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'#think|……神殿も直ったし。西と奥の水たまりも、見てまわりたいんだ。'],
    [HOMURA,'どれか一つでも、まだぬくいのが残ってたらって思ってさ。'],
    [GOD,'ふむ。いっしょに見てまわろうかの。']]},
   story:[
    [HOMURA,'……西も、奥も、だめか。','vol:touchH'],/* さいごに調べた温泉へ歩いて、水に手を入れる */
    [HOMURA,'湯の出る所は、3つとも、ちゃんと残ってるのにね。熱だけが、とどかないんだ。'],
    [GOD,'湯の通り道が残っとるなら、熱をとどけてやればよい。'],
    [HOMURA,'#think|……あたいひとりじゃ、どこから手をつけたもんか、わからなかったよ。'],
    [HOMURA,'#point|……どれか一つでいい。朝いちばんの、あそこに、もう一度湯気を上げたいんだ。'],
    [GOD,'#joy|ならば、そこからじゃな。']]},
  {id:'food3',text:'ホムラのおねがい：たけのこをとってこよう',check:()=>tkGot()>=2,prog:()=>'たけのこ '+Math.min(2,tkGot())+'/2',how:'竹のそばに生えた、たけのこを、せいれいに2こ、とってきてもらう',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉をなおすのは、ひと仕事だよ。その前に、腹ごしらえだね。'],
    [HOMURA,'#think|ほら、竹やぶのそばを見てごらん。土から、とんがった頭がのぞいてるだろ。'],
    [HOMURA,'#joy|あれは、たけのこさ。この村の、ごちそうなんだ。いくつか、とってきておくれよ。']],gives:{run:()=>takenokoStart()}},
   story:[[HOMURA,'#joy|うん、いいたけのこだ。やわらかくて、あまいよ。'],[HOMURA,'よし、これで村の準備はばっちりだね。助かったよ。']],gives:{flag:'hReq'}},
  {id:'springA',text:'温泉をよみがえらせよう',check:()=>S.obj.some((o,j)=>o==='hotstone'&&adjOf(j,k=>S.ground[k]===1&&sprMap()[k]==='a')>=0),how:'「おく」→「湯のわき岩」をえらんで、村の南東の温泉の水べに置く',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'まずは、いちばん近い入口の温泉からだね。'],
    [GOD,'湯のわき岩を入れといたぞい。ホムラの火の力をこめれば、きっと、あたたかいお湯がわいてくるじゃろう。'],
    [HOMURA,'よし、やってみようじゃないか。']],gives:{items:{hotstone:1}}},
   story:[
    [HOMURA,'…湯気だ！ ここから、また上がったよ！','vol:springWalk'],[HOMURA,'#joy|……ま、助かったよ。……ほんとに。'],
    [GOD,'#joy|ホムラ、ひと仕事のあとは、ここでゆっくりあったまるとよいぞ。'],
    [GOD,'それに…お湯から、水の力も満ちてきたようじゃな。'],
    [HOMURA,'…ん？ 湯気の中に、なにか光ってる。これ…ヌシ様の、火だねじゃないか！','vol:hidane'],
    [GOD,'#nod|ほう、ヌシの火だねか。だいじに持っておくんじゃぞ。きっと、この村の力になってくれるはずじゃ。'],
    [GOD,'#joy|ほっほ、ホムラにも、やっと笑顔がもどったのう。わしもうれしいわい。'],[GOD,'では、わしはほかの土地を見まわってくるぞい。ときどき遊びに来るからの。ではな〜！']],
   gives:{flag:'onsen',feat:['summon','shop'],shard:'land',godLeave:true}},
  {id:'summon',text:'なかまをむかえよう',check:()=>!!S.flags.minaCame&&NEWRES==null&&!NEWQ.length,how:'朝、神殿の上に「！」が出たら、「しらべる」で神殿をタップ',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'お湯から、水の力が満ちてきたね。だれか来てくれるかもしれないよ。'],
    [HOMURA,'なかまか…。にぎやかになるのは、悪くないね。']],gives:{flag:'sumTold'}},
   by:SHIZUKU,story:[
    [SHIZUKU,'はじめまして。水のせいれい、シズクと申します。','vol:summonRing'],
    [HOMURA,'#wave|へえ、水のせいれいかい。あたいはホムラ。よろしく頼むよ。','vol:meet'],
    [SHIZUKU,'さっそくですが、この温泉の湯は、地面の下の熱と、わき水の量と、それから……'],[HOMURA,'つまり？'],[SHIZUKU,'#nod|……のこりの温泉も、よみがえらせられます。'],[HOMURA,'#joy|はは、それを先に言っとくれよ。'],[SHIZUKU,'#think|……あの、ここのお湯、少しあつくありませんか。','vol:fanS'],[HOMURA,'あつい？ ぬるいくらいさ。'],[SHIZUKU,'#joy|……にぎやかな村に、なりそうですね。','vol:jumpBoth']]},
  {id:'rockCanal',text:'水路をふさぐ大岩をどかそう',check:()=>st2().bw.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+st2().bw.filter(j=>S.obj[j]!=='boulder').length+'/'+st2().bw.length,how:'せいれいに、大岩をくだいてもらう',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉を調べてきました。'],
    [SHIZUKU,'温泉に水をはこぶ水路が、大きな岩でふさがれています。くだく前に、岩のすじを調べて……','vol:traceRock'],
    [HOMURA,'#joy|調べてるあいだに、くだけちまうよ。岩なら、まかせときな。'],
    [SHIZUKU,'#think|……すじにそって、くだいてくださいね。']]},
   story:[[SHIZUKU,'水路に、水がもどりました。','vol:canal'],[HOMURA,'#joy|な、くだけば早いだろ。'],[SHIZUKU,'すじにそったから、水路がこわれなかったのです。'],[SHIZUKU,'#think|……でも、まだ冷たいままですね。熱が、とどいていません。']]},
  {id:'shizukuRest',text:'シズクのおねがい：入口の温泉の湯をももう',check:()=>!!st2().yumomi,prog:()=>yumomiWhy(),how:'昼に「しらべる」で入口の温泉をタップして、湯をもむ',
   talk:{who:SHIZUKU,when:()=>true,learn:['bench','tub'],lines:[
    [SHIZUKU,'わたしからも、ひとつおねがいがあります。'],
    [SHIZUKU,'#think|……この湯、わたしには、あつすぎるのです。'],
    [HOMURA,'#joy|これがいいんじゃないか。'],
    [SHIZUKU,'むかしの湯治場では、板で湯をもんで、さましたそうです。水でうすめると、湯のよさがへってしまうので。'],
    [HOMURA,'#think|へえ。……やってみなよ。見ててやるからさ。'],['@idea']],gives:{flags:['lv_tub','lv_bench']}},
   story:[[SHIZUKU,'#joy|……ちょうどよい湯かげんです。足を入れても、あつくありません。','vol:dipS'],[HOMURA,'#think|あたいには、ぬるくなっちまったけどね。……ま、たまには悪くないよ。','vol:armsCross'],[SHIZUKU,'#joy|湯上がりに、すわって休む所もあると、うれしいですね。']],gives:{flag:'sReq'}},
  {id:'yatai',text:'ホムラのおねがい：温泉の湯で、ゆでてみよう',check:()=>(st2().yude||0)>=2,prog:()=>'ゆでかごの料理 '+Math.min(2,st2().yude||0)+'/2',how:'「おく」→「ゆでかご」を、あたたかい温泉の、岸のすぐそばの水に置く。ゆでかごをタップして「入れる」で、たけのこをえらぶ',
   talk:{who:HOMURA,when:()=>true,learn:['yudekago'],lines:[
    [HOMURA,'#joy|温泉がひとつもどっただけで、村の空気がちがうね。'],
    [HOMURA,'#think|温泉がもどったら、あれだよ。湯でゆでた、たけのこさ。'],
    [SHIZUKU,'火を使わずに、ですか。'],
    [HOMURA,'湯けむりの中に、竹のかごをしずめとくだけさ。むかしは、どの湯にも、かごがぶら下がってたんだ。'],
    [SHIZUKU,'#joy|……それなら、わたしにも作れそうです。'],
    [HOMURA,'かごは、あたいが編んどいたよ。たのむよ、守り神！','hop']],gives:{items:{yudekago:1}}},
   story:[[HOMURA,'#joy|ほら、ゆであがったよ！ みんな、食べな！','cheer+vol:egg'],[SHIZUKU,'……かたいです。','vol:eatS'],[HOMURA,'ゆでたけのこは、歯ごたえが命さ。'],[SHIZUKU,'#joy|でも、おいしいです。湯のかおりがします。'],[HOMURA,'#joy|だろ？ これで、湯けむりの村らしくなってきた！']]},

  {id:'haikage3',text:'ハイカゲの灰で、ひびわれをうめよう',check:()=>CRACKS.every(j=>S.obj[j]!=='crack'),prog:()=>'ひびわれ '+CRACKS.filter(j=>S.obj[j]!=='crack').length+'/'+CRACKS.length+'・灰 '+(st2().hai||0),how:'夜に来るハイカゲを追いはらうと、灰を落とす。せいれいがひろった灰で、村の北のひびわれを「しらべる」でタップしてうめる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。温泉の熱は、火山から地面の下の「熱の道」を通って、とどいていたのです。'],
    [SHIZUKU,'村の北の地面に、ひびわれがあります。そこから熱がもれているようです。'],
    [HOMURA,'#think|……それとさ、これから夜になると、火山のほうから「ハイカゲ」ってやつが来るよ。'],
    [SHIZUKU,'火を朝までのこそうとして、灰をかぶせていく子です。灰というのは、もともと、熱を外へにがさないように……'],
    [HOMURA,'つまり？'],
    [SHIZUKU,'#nod|灰は、熱をとじこめます。'],
    [HOMURA,'熱をとじこめる灰か……。だったら、そいつで、ひびわれをうめちまえばいいじゃないか。'],
    [HOMURA,'#joy|よし。ハイカゲが来たら、追いはらって、灰をいただくよ。']],gives:{flag:'ashOn'}},
   story:[[HOMURA,'よし、ふさがった！ 熱の道が、つながったよ。','vol:crackSeal'],[SHIZUKU,'ハイカゲの灰が、熱をしっかりとじこめてくれましたね。'],[SHIZUKU,'わたしの知っていたことと……'],[HOMURA,'#joy|あたいの思いつきだ。'],[SHIZUKU,'#joy|……はい。あとは、熱をどこへ流すか、ですね。']]},
  {id:'springB',text:'熱の切りかえ装置を西へむけて、西の温泉をよみがえらせよう',check:()=>!!st2().sp.b,how:'火山のふもとの「熱の切りかえ装置」をタップして、ハンドルを回し、西へむける',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'火山のふもとに、熱の流れを切りかえる装置があるんだ。'],
    [HOMURA,'西へむければ、西の温泉に熱がとどくはずさ。']]},
   story:[[HOMURA,'#think|……熱が、ちゃんと流れてるか、たしかめてみるよ。',0,'heat:b'],[HOMURA,'#joy|西の温泉にも、湯気が上がった！'],[SHIZUKU,'すばらしいです。…残るは、奥の温泉ですね。'],[HOMURA,'#think|熱の道のそばの土も、ぽかぽかしてきたね。'],[HOMURA,'#nod|……あんた、けっこう役に立つじゃないか。'],[SHIZUKU,'#surprise|……いま、ほめられましたか？','vol:lookbackS']]},
  {id:'fire3',text:'ようがん台で、火山の熱を村へひこう',check:()=>yoganHeatN()>=2,prog:()=>'熱の道のそばのようがん台 '+Math.min(2,yoganHeatN())+'/2',how:'熱が流れている熱の道のそばに、ようがん台を2つ建ててもらう',
   talk:{who:HOMURA,when:()=>true,learn:['yogan'],lines:[
    [HOMURA,'#think hush|……なあ、守り神。むかし、この村には、火のせいれいがたくさんいたんだ。','vol:yoganSide'],
    [HOMURA,'#danger|温泉が冷えて、「コワイノ」のうろつく寒い夜がつづいてさ。みんな、ちりぢりに逃げのびた。……あたいが、逃がしたんだ。','vol:fist'],
    [HOMURA,'#sigh|守れなかったんだよ。あたいは、のこっただけさ。'],
    [SHIZUKU,'それは、ホムラさんのせいではありません。「コワイノ」の数を考えれば、どうやっても……'],
    [HOMURA,'#sigh|……わかってるよ。わかってるけどさ。'],
    [SHIZUKU,'#teary|……すみません。いまのは、言わなくてよいことでした。','vol:stepBackS'],
    [SHIZUKU,'村の中を、あたためましょう。帰り道が、見つけやすくなるように。'],
    [HOMURA,'#nod|……うん。熱の道のそばに、ようがん台を建てよう。火山の熱を、すいあげてくれるはずさ。']]},
   story:[[HOMURA,'#joy|見なよ。ようがん台が、熱の道の熱をすって、まっ赤にかがやいてる！','vol:yoganPulse'],[SHIZUKU,'……。'],[HOMURA,'#think|……今日は、説明しないのかい。'],[SHIZUKU,'#nod|はい。今日は、となりにいるだけにします。','vol:sitBeside'],[HOMURA,'#think hush|……この熱が、遠くまでとどけばいい。ちりぢりになったなかまにもさ。','vol:bump']]},
  {id:'fest',text:'おまつりをひらこう',check:()=>S.festAtQ==='fest'&&festOn(),prog:()=>S.festDay!=null&&S.festDay>dayNo()?'あしたはおまつり':'',how:'カミサマとの「とくべつな交換」で、おまつりをえらぶ',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'#joy|温泉も、熱の道もよみがえって、村がずいぶんあったかくなったねえ。'],
    [HOMURA,'#think|むかしはね、湯けむりの夜に、みんなで屋台を出して、おまつりをしたもんさ。'],
    [SHIZUKU,'おまつり……すてきですね。温泉のまわりに、ちょうちんをともして。'],
    [HOMURA,'たまごは、かたゆでだよ。'],
    [SHIZUKU,'おまつりは、半熟と決まっています。'],
    [HOMURA,'#joy|だれが決めたのさ。'],
    [HOMURA,'#joy|守り神、みんなで、おまつりをひらこうじゃないか！']]},
   story:[[HOMURA,'#joy|これこれ！ やっぱり、おまつりはいいねえ！','vol:lanterns'],[SHIZUKU,'#joy|たまごは、両方ならべてみました。','vol:eggsUp'],[HOMURA,'……どっちも、売り切れだね。'],[HOMURA,'#joy|また、いつでもひらこうじゃないか。','vol:cheer']]},
  {id:'kagari',text:'かえり道のあかり',check:()=>!!S.flags.kagariCame,prog:()=>kgrProg(),how:'夕方、ホムラが村の入り口のあかりをともすのを、いっしょに見る',
   talk:{who:SHIZUKU,when:()=>true,done(){S.flags.kgrFrom=callDay()},lines:[
    [SHIZUKU,'#think|……ホムラさん。おまつりの夜も、入り口のあかりを、ともしに行っていましたね。'],
    [HOMURA,'#surprise|……見てたのかい。'],
    [HOMURA,'#think hush|ちりぢりになったなかまがさ、いつか、この村を思い出すかもしれないだろ。'],
    [HOMURA,'#sigh|そのとき、まっくらじゃ、帰り道がわからないからね。'],
    [SHIZUKU,'#nod|……あしたの夕方は、わたしも、となりにいます。'],
    [HOMURA,'#think|……すきにしな。']]},
   story:null},
  {id:'ashiyu',text:'西の温泉に、あし湯をつくろう',check:()=>spNear(['bench','takebench'],'b')>=2&&spNear(FLOWERS2,'b')>=3,prog:()=>'ベンチ '+Math.min(2,spNear(['bench','takebench'],'b'))+'/2・花 '+Math.min(3,spNear(FLOWERS2,'b'))+'/3',how:'西の温泉のそばに、ベンチ2つと花3つ',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉は、湯がやわらかくて、足をつけるのにちょうどよいのです。'],
    [HOMURA,'足だけつかって、のんびりおしゃべり……いいね。すわる所と、花でもあれば最高さ。'],
    [SHIZUKU,'あし湯ができたら、みなさんも、きっと遊びに来ますね。'],
    [GOD,'花のたねを、とどけておいたぞい。']],gives:{items:{clover:3}}},
   story:[[SHIZUKU,'あし湯ができました……！ 足だけでも、ぽかぽかします。','vol:ashiyu'],[SHIZUKU,'足だけなら、あつくありません。','vol:ripple'],[HOMURA,'#joy|あんた、やっぱりお湯が苦手なんだろ。'],[SHIZUKU,'……水のせいれいですから。'],[HOMURA,'花を見ながら、のんびりおしゃべり。いいもんだね。']]},
  {id:'volcano',text:'火山を調べよう',check:()=>!!S.flags.volLook,how:'「しらべる」で、北の火山をタップする',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の温泉に熱をとどけるには、奥の装置を使うはずです。'],
    [SHIZUKU,'その前に、火山を調べてみませんか。熱の流れが、どうなっているか…。']]},
   story:[[HOMURA,'火山の熱は、ちゃんと生きてるね。'],[SHIZUKU,'#scared|でも……山の上から、いやな気配がします。わたし、これ以上は……','vol:scaredS'],[HOMURA,'#nod|……いいよ。あんたの足が動くまで、待つさ。'],[SHIZUKU,'#surprise|ホムラさんが、待つんですか。'],[HOMURA,'たまにはね。それと、奥の装置のまわり、大岩だらけだったよ。']]},
  {id:'rockDeep',text:'奥の装置のまわりの大岩をわろう',check:()=>BVOL.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+BVOL.filter(j=>S.obj[j]!=='boulder').length+'/4',how:'まもりの光を、奥の装置のまわりの大岩に当てる。赤くなった大岩に、せいれいが水をかけるとわれる',
   talk:{who:HOMURA,when:()=>true,lines:[[HOMURA,'#sigh|……だめだ。奥の装置のまわりの岩は、たたいても、びくともしないよ。'],[SHIZUKU,'#think|岩のすじが、つまっています。あつくしてから、きゅうに冷やせば……'],[HOMURA,'つまり？'],[SHIZUKU,'#nod|守り神さまの光であたためて、そこへ水をかけます。'],[HOMURA,'#joy|……こんどは、あんたの番ってわけだ。']]},
   story:[[HOMURA,'#joy|われた！ ……あんたの言うとおりだったね。'],[SHIZUKU,'#joy|すじを調べておいて、よかったです。'],[SHIZUKU,'#scared|…装置が、こわれていますね。','vol:pointDevice'],[SHIZUKU,'#nod|……直し方は、わかります。こんどは、わたしがやります。']]},
  {id:'springC',text:'奥の装置を直して、奥の温泉に熱をとどけよう',check:()=>!!st2().sp.c,how:'奥の装置を直して、熱を奥の温泉へむける',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の装置を直すには、石材と木材、それに…ヌシ様の火だねの力がいります。'],
    [HOMURA,'入口の温泉で見つけた、あの火だねだね。'],
    [SHIZUKU,'直せば、熱が、奥の温泉まで流れるはずです。']]},
   story:[[SHIZUKU,'#think|……こわいですけど、そっと手をあててみます。',0,'heat:c'],[SHIZUKU,'火だねが、装置に熱を通してくれました……！'],[HOMURA,'#surprise|…奥の温泉にも、湯気だ！ 3つ、ぜんぶよみがえったよ！'],[SHIZUKU,'#joy|……夢みたいです。'],[HOMURA,'#joy|やるじゃないか、シズク。……名前で呼んだの、はじめてかもね。','vol:lookbackH'],[SHIZUKU,'…守り神さま。空が、灰色にくもってきました。'],[HOMURA,'今夜は、ハイカゲがわんさか来そうだね…！']],gives:{flag:'ashNight'}},
  {id:'ashNight',text:'灰の降る夜をのりこえよう',check:()=>{const t=st2();return !!t.ashNightAt&&S.nights>=t.ashNightAt&&!isNight()},how:'灰の降る夜を、みんなでのりこえる',
   story:[[HOMURA,'…ふう、なんとかのりこえたね。','vol:ashFall'],[SHIZUKU,'灰は、山の上からふってきていました。なにかが、いるのです。'],[HOMURA,'#danger|なら、あたいが山へ行って、ひとりで……','vol:stepMountain'],[KAGARI,'#alarm big|また、ひとりで行くの！？'],[SHIZUKU,'#alarm big|だめです！','vol:grab'],[SHIZUKU,'……むかし、ひとりでのこったのでしょう。今度は、ひとりにしません。'],[KAGARI,'#teary|……あたしも行く。こんどは、待ってるだけなんて、いやだ。'],[HOMURA,'#think hush|……。','vol:lookbackH'],[HOMURA,'#nod|……わかったよ。背中、たのむよ。','vol:backToBack'],[SHIZUKU,'#nod|はい。','vol:morning']],gives:{flag:'hinoNight'}},
  {id:'hinoookage',text:'ヒノオオカゲを追いはらおう',check:()=>!!S.flags.hinoDown,how:'火山から下りてくるヒノオオカゲを追いはらう',
   story:[[HOMURA,'#joy big|やった…！ 火山の上の、いやな気配が消えたよ。','vol:shadowSpot'],[SHIZUKU,'#think|……あの影、さいごまで、ふるえていましたね。','vol:kneelAsh'],[SHIZUKU,'#surprise|……この砂、つめたいです。うばった熱が、そのまま、こおったように。'],[HOMURA,'#think hush|……思い出したよ。むかし、夜になると、火のそばに、小さな影が来てたんだ。'],[HOMURA,'#sigh|火がねむるまで、じっと見ててさ。……あの子たち、火の番をしてくれてたんだ。'],[KAGARI,'#teary|……あたしも見たことある。あったまりに来てるんだと、思ってた。'],[SHIZUKU,'熱をうばっても、あたたまれなかったのですね。ほしかったのは、熱ではなかったのかもしれません。'],[HOMURA,'#sigh|……追いはらうしか、なかったのかね。','vol:skyH'],[HOMURA,'#surprise|……あれ？ 砂の中で、なにか光ってる。ヌシ様の火だねだ！'],[SHIZUKU,'#joy|ヌシ様の熱が、影の中にも、のこっていたのですね。だいじに持っておきましょう。'],[HOMURA,'#nod|……ヌシ様をむかえる、仕上げだね。']]},
  {id:'inn',text:'温泉宿に、露天ぶろをつくろう',check:()=>!!innHouse(),prog:()=>'温泉のそばの家 '+(HOUSES.some(h=>[...h.inside].some(j=>nearHot(j,6)))?1:0)+'/1・宿のそばの露天ぶろ '+(innHouse()?1:0)+'/1',how:'あたたかい温泉のそばに家をつくり、その家のそばに露天ぶろを建ててもらう',
   talk:{who:HOMURA,when:()=>true,learn:['onsen'],lines:[
    [HOMURA,'ヒノオオカゲもいなくなって、やっと落ちついたね。'],
    [SHIZUKU,'#joy|湯上がりに、そのままゆっくり休める宿があると、うれしいですね。'],
    [HOMURA,'#think|宿のすぐそばに、岩でかこんだ湯船もほしいね。空を見ながら、のんびりつかれるやつさ。'],
    [SHIZUKU,'守り神さま、なにか、よい形はありませんか。'],['@idea']],gives:{flags:['lv_onsen']}},
   story:[[HOMURA,'温泉宿のできあがりだ！ 宿を出たら、すぐ露天ぶろさ。','vol:innFront'],[SHIZUKU,'露天ぶろは、岩のかげのほうが少しぬるいです。'],[HOMURA,'あたいは、わき口のそばだね。','vol:soakBoth'],[SHIZUKU,'#joy|……同じお湯に、ちがう場所で入れますね。'],[HOMURA,'#joy|今夜は、あたいも泊まってみようかな。']]},
  {id:'guest',text:'草原からのお客さんを、露天ぶろでもてなそう',check:()=>!!S.flags.guestDone,how:'温泉宿の露天ぶろで、お客さんをもてなす',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'温泉宿も、露天ぶろもできて、村じゅうに湯けむりがただようようになりましたね。'],
    [HOMURA,'こうなったら、だれかに入ってもらいたいねえ。'],
    [GOD,'#joy|ほっほ。それなら、草原から、ひとり連れてこようかの。']]},
   story:[[HOMURA,'#joy|お客さん、よろこんでくれたね！','cheer'],[SHIZUKU,'#joy|とろけちゃいそう、と言ってくれました。'],[HOMURA,'かたゆでも、食べてたよ。'],[HOMURA,'……あとは、ヌシ様をむかえるだけさ。']]},

  {id:'tower',text:'守護の台座を建てて、火を入れよう',check:()=>cnt('tower')>=1&&altarLit(),prog:()=>altarProg(),how:'「おく」→「守護の台座」を建ててもらう。建ったら、昼に「しらべる」で台座をタップして、ヌシ様の火だねに火を入れる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'湯けむりの村も、だいぶ元にもどってきたね。あとは、ヌシ様の火だねをはめる「守護の台座」だ。'],
    [SHIZUKU,'台座を建てるのに、なにが足りないか、いっしょに確かめましょう。'],
    [SHIZUKU,'#think|……ただ、台座が光ると、山の上にのこった影が気づくかもしれません。'],
    [HOMURA,'そのときは、みんなでむかえうつまでさ。……今度は、みんなでね。'],
    [HOMURA,'#think|……それとさ。台座の火は、夜は灰の下でねむる「うずみ火」にしようと思うんだ。'],
    [SHIZUKU,'#surprise|ねむる火、ですか。'],
    [HOMURA,'夜はしずかにねむって、朝まで、ぬくもりだけのこす。……あの影たちが、ほんとうにしたかったのは、それだろ。'],
    [KAGARI,'#joy|……うん。いいと思う。'],
    [HOMURA,'よし、仕上げだよ！'],
    [SHIZUKU,'守り神さま。温泉の入り口に、のれんをかけたいですね。お客さんが、ほっとひと息つけるように。'],['@idea']],learn:['noren'],gives:{shrine:true}},
   story:null},
];;
const QUESTS2_V1=['statue','coldSpring','food3','springA','summon','rockCanal','shizukuRest','yatai','haikage3','heatPath','springB','fire3','fest','ashiyu','volcano','rockDeep','springC','ashNight','hinoookage','inn','guest','tower'];/* 火山のクエストをかえる前のならび（古いセーブの読みかえ用） */
const QL=[QUESTS1,QUESTS2],PROS=[PROLOGUE,PROLOGUE2],INTROS=[INTRO,INTRO2];
/* ---------- フリーモード（ステージ1クリアで解放）：自然の力が弱く、せいれいはゆっくり増える。災いはほとんどない ---------- */
const FVAL=()=>S&&S.flags&&S.flags.valley?'谷':'村';/* 花の谷（新しいフリーモード）か、前の地形のセーブか */
const FA=()=>(S&&S.fk||[])[0]||GOD,FB=()=>(S&&S.fk||[])[1]||GOD;
const PROF=[
  [GOD,'おお、いいところを見つけたのう！'],
  [GOD,'丘にぐるりとかこまれた、花の谷じゃ。'],
  [GOD,'ここは自然の力が弱くて、せいれいがなかなか生まれん土地なんじゃ。'],
  [GOD,'そのかわり、災いもほとんど起きん。'],
  [GOD,'つまり、のんびりくらすにはぴったりというわけじゃな！'],
  [GOD,'まあ、最初はちとさみしいかもしれんが……。'],
  [GOD,'せっかくじゃ！ ここにおヌシだけの村をつくってみんか？'],
  [GOD,'わしも楽しみにしとるぞ！']];
function INTROFL(){return [[FA(),'#surprise|わあ、守り神さまだ！ ぼく、'+FA()+'！ この谷で、ひっそりくらしてたんだ！'],[FB(),'#surprise|ふわぁ…。'+FB()+'#joy|だよぉ。ふたりきりだったから、うれしいねぇ。'],[FA(),'#joy|ねえ、この谷を、いっしょにすてきにしようよ！']]}
const TOYS4=['swing','sandbox','seesaw','slide'];/* 遊び道具（どれでもよい） */
const LIGHTQ=['g_w_acorn','g_e_lantern','g_f_lamp','g_s_jelly','torch','lamp','campfire','lantern','oldlantern','candle','flamp','toro','takeakari','andon','yomawari','watchlight'];/* watchlight：あかりのついた見張り台（Lv5〜。recount で数える） *//* クエストで数える「あかり」（どれでもよい） */
const DECOQ=['g_w_kinoko','g_w_shelf','g_w_stump','g_e_planter','g_e_bath','g_e_arch','g_f_hanger','g_f_screen','g_f_sofa','g_k_fan','g_k_egg','g_k_screen','g_s_vanity','g_s_tank','g_s_sofa','hedge','birdbath','parasol','arch','signpost','monstera','jar','rockart','doki','vane','kamizo','shishiodoshi','noren'];/* クエストで数える「かざり」（どれでもよい） */
/* フリーモードの第1章：数ではなく、やり方をえらべる目標（住み心地・スポット・なかま・イベント・すてき度）。神殿もカミサマも出ない。第2章と季節の話は free.js */
const fComf=()=>HOUSES.reduce((m,h)=>Math.max(m,houseComfort(h).v),0),fComfSt=()=>Math.min(5,Math.max(HOUSES.length?1:0,Math.ceil(fComf()/60))),fSpotN=()=>new Set((SPOTI||[]).map(x=>x.sp.k)).size;
const QUESTSF=[
  {id:'fhome',text:'第1話 ふたりの家：家の住み心地を★3に',check:()=>fComfSt()>=3,prog:()=>'住み心地 ★'+Math.min(3,fComfSt())+'/3',how:'家の中に、家具・あかり・床をふやす。家をタップすると、住み心地がわかる',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、ぼくたちの家、まだ中がからっぽなんだ。'],[FB(),'ねるだけの家だったからねぇ。'],[FA(),'#joy|守り神さま、いごこちのいい家にしてほしいな！']]}},
   get story(){return [[FA(),'#joy|わあ、家の中が、ぽかぽかする！'],[FB(),'ずっと、ここにいたくなるねぇ。']]}},
  {id:'fspot',text:'第2話 谷のお気に入り：好きなスポットを1つ作る',check:()=>fSpotN()>=1,prog:()=>'スポット '+Math.min(1,fSpotN())+'/1',how:'ひでんのしょの「くらし・家具」にあるスポットから、好きな組み合わせをえらんで置く',
   talk:{get who(){return FB()},when:()=>true,get lines(){return [[FB(),'谷のどこかに、お気に入りの場所があるといいねぇ。'],[FA(),'物をならべると、とくべつな場所になるんだって！'],[FB(),'守り神さまの好きな場所を、つくっておくれよぉ。']]}},
   get story(){return [[FA(),'#joy|ここ、いいね！ ぼく、毎日来ちゃいそう！'],[FB(),'お気に入りが、ひとつできたねぇ。']]}},
  {id:'ffriend',text:'第3話 谷のむこうから：なかまをむかえる',check:()=>(S.farr||0)>=1,prog:()=>'なかま '+Math.min(1,S.farr||0)+'/1',how:'花や家具で属性の力がたまると、朝、谷の南からなかまがやってくる',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、丘のむこうには、ほかのせいれいもいるのかな。'],[FB(),'この谷がにぎやかになったら、のぞきに来るかもしれないねぇ。'],[FA(),'#joy|来てくれたら、うれしいな！']]}},
   get story(){return [[FA(),'#joy|ほんとに来てくれた！ ようこそ、花の谷へ！'],[FB(),'ふたりきりじゃ、なくなったねぇ。うれしいねぇ。']]}},
  {id:'fevent',text:'第4話 みんなであそぶ日：好きなイベントを1つひらく',check:()=>(S.fevN||0)>=1,prog:()=>'イベント '+Math.min(1,S.fevN||0)+'/1',how:'依頼ボードの「イベント」から、好きなイベントをひらく',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'なかまがふえたから、みんなで、なにかしたいな！'],[FB(),'みんなでやると、たのしいことって、あるよねぇ。']]}},
   get story(){return [[FA(),'#joy|たのしかったー！ また、やろうね！'],[FB(),'みんなの顔が、にこにこだったねぇ。']]}},
  {id:'fsuteki',text:'最終話 すてきな谷：すてき度を★3に',check:()=>suteki().st>=3,prog:()=>'すてき度 ★'+Math.min(3,suteki().st)+'/3',how:'かざり・花・道・スポットをふやす。村のようすで、すてき度がわかる',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、この谷、まえよりずっと、すてきになったよね。'],[FB(),'もっとすてきになったら、おいわいしたいねぇ。'],[FA(),'#joy|うん！ 谷のおまつりだ！']]}},
   get story(){return [[FA(),'#joy|見て見て！ 谷じゅうが、きらきらしてる！'],[FB(),'#cry hush|ふたりだけだったころは、しずかで、ちょっとさみしかったねぇ。'],[FA(),'いまは、こんなににぎやか！ 守り神さまが来てくれたからだね。'],[FB(),'ここが、みんなのふるさとだねぇ。']]},gives:{fest:true}},
];
function freeFest(){for(const r of S.res){r.fun=100;spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))}startClap();setTimeout(endClap,3200);S.cleared=true;S.clearDay=dayNo();memo('ball','村のおまつりをひらいた');omo('fest');logEv('村のおまつりをひらいた');toast('物語はひと区切り！ 村づくりはつづくよ','good')}
function freeSetup(s){const used=new Set(['フタバ','ノドカ']);const nm=()=>{let n;do{n=NAMES[s.nameIdx%NAMES.length];s.nameIdx++}while(used.has(n));used.add(n);return n};
  const a=nm(),b=nm();s.res=[mkRes(s,a,'wood',CX+.5,CY-1.5,'swing'),mkRes(s,b,'earth',CX+1.5,CY-1.5,'chat')];s.fk=[a,b];s.keyN={wood:a,earth:b};
  s.flags.minaCame=true;s.flags.sumTold=true;s.flags.tapped=true;s.free=1;for(const id of['wbench','crate','loom','bed','table','chair','stool','bench','torch'])s.recipes[id]=true;/* はじめから作れる物 */
  {const fr=k=>!s.obj[k]&&s.ground[k]!==1&&!s.floor[k],y=CY-9;let ox=-1;for(let d=1;d<12&&ox<0;d++)if([0,1,3,4].every(c=>fr(y*W+CX-d-2+c)))ox=CX-d-2;if(ox<0)ox=CX-4;const o=y*W+ox,b=o+3;s.obj[o]='obox';s.obj[b]='board';s.obj[b+1]='part';s.ref[b+1]=b;s.flags.board2x1=1;s.flags.board3=1}/* 神殿はない。おそなえ箱と依頼ボードは、べつべつに置いてある */
  Object.assign(s.feat,{inv:true,craft:true,remove:true,plant:true,people:true});/* カミサマのお店・なかまを呼ぶ、はない */
  s.fs={berry:12};s.food=12;s.mat={wood:20,stone:20};s.pt=40;
  for(let j=0;j<W*H;j++)if(s.obj[j]==='deadtree')s.obj[j]=Math.random()<.5?'ntree':'';
  for(let d=3;d<=5;d++){const j=(CY-2)*W+CX-d;s.obj[j]='hwall';s.floor[j]='';s.hp[j]=BL.hwall.hp}/* 家はこわれていない */
  {const fr=k=>!s.obj[k]&&s.ground[k]!==1&&!s.floor[k];let p=-1;for(let r=0;r<8&&p<0;r++)for(let dy=-r;dy<=r&&p<0;dy++)for(let dx=-r;dx<=r;dx++){const k=(CY+1+dy)*W+CX+3+dx;if([0,1,2,3].every(c=>fr(k+c))){p=k;break}}if(p>=0){s.obj[p]='crate';wbenchAt(s,p+1,0);s.obj[p+3]='crate'}}/* 作業台（材料置き場つき）は、木箱のあいだ */
  for(const k of ['tree','bellf','salvia','lily','lotus','clover'])if(BL[k]){s.unlocked[k]=true}
  s.inv=Object.assign(s.inv||{},{bellf:3,salvia:3,lily:3,lotus:3,clover:9});
  let c2=false;try{const t=KV.getItem(SAVE_KEYS[1]);c2=!!(t&&JSON.parse(t).cleared)}catch(e){}if(c2){s.inv.hotstone=(s.inv.hotstone||0)+2;s.flags.giftV=1}/* 火山の村をクリアしていたら、ほのお石もとどく */syncQuestRecipes(s)}
QL[FREE]=QUESTSF;PROS[FREE]=PROF;INTROS[FREE]=[];
/* ---------- 風のやんだ空の村（WORLD 5）：風のやんだ遊園地。この島は、むかし、ヌシ様の風で遊具がまわる空の遊び場だった。風が止まって遊具も止まり、せいれいたちは楽しむことをわすれている。
   いまあるのは、風穴 → 神殿 → ハヤテが目をさます → メリーゴーラウンド → コーヒーカップと空中ブランコ、まで。観覧車の山場・雲の下・さいごの夜は、これから（IDEAS.md）。夜のコワイノも、まだ来ない ---------- */
const PROLOGUE5=[
  [GOD,'つぎの土地は、空の上じゃ。雲の海に、島がいくつもうかんでおる。'],
  [GOD,'#joy|むかしは、風でまわる遊び場があってのう。笑い声が、雲の下までとどいたもんじゃ。'],
  [GOD,'#worry|……いまは、風がやんで、しんとしておる。島も、雲にしずみかけとる。'],
  [GOD,'笑い方をわすれた子らがおる。行ってやろうかの。'],
];
const INTRO5=[
  [KAZANE,'……おや。お客さんとは、めずらしいね。'],
  [KAZANE,'ぼくはカザネ。風のせいれいさ。……もっとも、風は、もうふかないけれどね。'],
  [GOD,'#worry|遊び場も、すっかり止まってしもうたのう。'],
  [KAZANE,'#think|遊び場？ ……ああ、あのさびた鉄のかたまりのことかい。どう遊ぶ物だったかも、わすれたよ。'],
  [GOD,'あそこに、石でふさがった風穴がある。風がもどれば、なにか思い出すかもしれんぞ。'],
  [KAZANE,'フッ……ものずきな守り神だ。まあ、ひまつぶしには、なるかな。'],
];
const WIND_HAYATE=[
  [HAYATE,'#surprise|……ふあ。……あれ、風？ 風がふいてる！'],
  [KAZANE,'#surprise|ハヤテ……！'],
  [HAYATE,'#joy|カザネじゃないか！ なんだい、その顔。ねぼけているのは、ぼくのほうだろう？'],
  [KAZANE,'#think|……フッ。おそいお目ざめだね。待ちくたびれたよ。'],
  [HAYATE,'#joy|ねえ、遊び場は？ メリーゴーラウンドは、まだまわっているかい？'],
  [KAZANE,'……あれは、もう動かないよ。動かし方も、わすれた。'],
  [HAYATE,'#think|わすれた？ きみが？ ……いちばん上手に、まわしていたのに。'],
];
const QUESTS5=[
  {id:'windHole',text:'風穴をひらこう',check:()=>windOpenN()>=1,by:GOD,how:'「しらべる」で、石でふさがった風穴をタップ',
   story:[[KAZANE,'#surprise|……風だ。'],[KAZANE,'フッ……ひさしぶりだね、この音。'],[GOD,'#joy|おお、古い風車がまわっとる！ ええ音じゃのう。'],[KAZANE,'#think|……べつに、うれしくなんかないさ。少し、なつかしいだけだよ。']],
   gives:{recipes:['kazami'],items:{kazami:3}}},
  {id:'statue',text:'神殿を直してもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'「しらべる」で、こわれた神殿をタップ',
   story:[[GOD,'#joy|ここが、おヌシとわしの居場所じゃ。'],[KAZANE,'神殿まで直すとはね。……ほんとうに、ものずきだ。'],[GOD,'雲の下に、まだ島がしずんでおる。風がとどけば、うかんでくるはずじゃ。'],[KAZANE,'#think|……しずんだ島、か。あそこには、まだ、ねむっているやつがいるんだ。']],
   gives:{feat:['inv','remove','plant','craft','people','summon','shop'],recipes:['bed','crate','wbench'],items:{wbench:1,bed:1},mat:{wood:10,stone:10},flag:'calmNight',run(){for(const k of['tree','bellf','salvia','lily','lotus','clover'])if(BL[k])S.unlocked[k]=true}}},/* 花のたね・木の苗は、カミサマのお店に出る */
  {id:'windReach',text:'となりの島に風をとどけよう',check:()=>windUpN()>=1&&S.flags.hayate===2,how:'風の道に「かざみ」を置くと、風の向きがかわる。雲にしずんだ島に風がとどくと、島がうかぶ'},
  {id:'merryFix',text:'メリーゴーラウンドを動かそう',check:()=>!!(S.flags.rideRun&&S.flags.rideRun.merry),prog:()=>cnt('merry')?'':'こわれたメリーゴーラウンド 0/1',how:'「しらべる」で、こわれたメリーゴーラウンドをタップして直す。風のせいれいが係になると動き、ほかのせいれいがのれる',
   talk:{who:HAYATE,when:()=>true,lines:[[HAYATE,'カザネ、あれを直そう。ぼくがのるから、きみがまわすんだ。'],[KAZANE,'#think|……やれやれ。むかしから、きみは言いだしたら聞かないね。'],[HAYATE,'#joy|そうこなくっちゃ！']]},
   story:[[HAYATE,'#joy big|あははは！ まわる、まわる！ カザネ、もっと速く！'],[KAZANE,'#surprise|……。'],[KAZANE,'#joy|……ふ、ははっ。なんだい、その顔。目がまわっているじゃないか。'],[HAYATE,'#joy|あ。カザネが、笑った。'],[KAZANE,'#shy|……わ、笑ってなんかいないさ。風が、くすぐったかっただけだよ。'],[GOD,'#joy|ええのう、ええのう。遊び場は、だれかが笑うと、またまわりだすもんじゃ。']]},
  {id:'rides2',text:'コーヒーカップと空中ブランコを動かそう',check:()=>!!(S.flags.rideRun&&S.flags.rideRun.cup&&S.flags.rideRun.skyswing),prog:()=>'動いた遊具 '+((S.flags.rideRun&&S.flags.rideRun.cup?1:0)+(S.flags.rideRun&&S.flags.rideRun.skyswing?1:0))+'/2',how:'うかんだ島で、こわれた遊具をさがして直す。風のせいれいが係になると動く',
   talk:{who:KAZANE,when:()=>true,lines:[[KAZANE,'#think|……ほかの島にも、遊具がしずんでいたはずだ。カップと、空のブランコ。'],[HAYATE,'#joy|ぜんぶ動かそう！ 音が聞こえたら、ねむっているみんなも、きっと起きてくるよ。'],[KAZANE,'フッ……きみに言われると、できる気がしてくるから、ふしぎだ。']]},
   story:[[KAZANE,'フッ……ひとつ動かすたびに、ひとつ思い出すね。遊ぶって、こういうことだったか。'],[HAYATE,'#think|ねえ、カザネ。……どうして風は、やんだんだろう。'],[KAZANE,'#think|……さあね。あの方は、なにも言わずに、行ってしまったから。'],[HAYATE,'……カザネ。']]},
  {id:'windAll',text:'島をぜんぶうかせよう',check:()=>windUpN()>=windIsleN(),prog:()=>'うかんだ島 '+windUpN()+'/'+windIsleN(),how:'うかんだ島の風穴をひらいて、風をつぎの島へとどける'},
  {id:'windVillage',text:'空の遊び場を、にぎやかにしよう',check:()=>false,how:'この土地のお話のつづきは、まだない'},
];
QL[WIND]=QUESTS5;PROS[WIND]=PROLOGUE5;INTROS[WIND]=INTRO5;

let QUESTS=QUESTS1;
