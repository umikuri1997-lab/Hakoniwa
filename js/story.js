'use strict';


/* ---------- ステージ2：火山のふもとの村 ---------- */
const PROLOGUE2=[
  [GOD,'さて、次の土地じゃな。草原のみなも、元気にやっとるようで、なによりじゃ。'],
  [GOD,'ここは火の山のふもとの村。むかしは、あちこちから温泉がわく、あったかい村じゃった。'],
  [GOD,'じゃが、火のヌシ様が力をうばわれて、地面の熱が冷えきってしもうた。温泉も、いまではただの冷たい水たまりじゃ。'],
  [GOD,'#worry|あそこには、ひとりでがんばっとる子がおる。はよう行ってやらんとのう。'],
  [GOD,'では、行こうかの。'],
];
const INTRO2=[
  [GOD,'ほい到着〜。ここが火山のふもとの村じゃ。','volcam+vol:introStart'],
  [GOD,'#worry|見てみい、あの山を。ヌシ様の熱が、あそこから消えてしもうたんじゃ。'],
  [HOMURA,'…ん？ あんたが、うわさの守り神かい？','homcam+vol:lookbackH'],
  [HOMURA,'あたいはホムラ、火のせいれいさ。この村にのこってるのは、もうあたいひとりだよ。'],
  [HOMURA,'#think|……さいきんさ、風が、なんだかあったかい所から来る気がするんだ。……ふしぎだね。'],
  [HOMURA,'#wave|寒くてかなわないけど…ま、よろしく頼むよ。','vol:wave'],
  [GOD,'#joy|ほっほ、ひとりでよう村を守っとったのう、ホムラ。','vol:shoulders'],
  [GOD,'まずは、わしの居場所になる神殿じゃな。'],
];
const QUESTS2=[
  {id:'statue',text:'神殿を建ててもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'下の「おく」→「神殿」をえらび、空いた場所をタップ',story:[
    [HOMURA,'神殿？ あたいひとりで十分さ。……ま、あってもいいけど。'],[HOMURA,'へえ、なかなかいい神殿じゃないか。'],
    [GOD,'じゃろ〜。ここが、おヌシの居場所じゃ。'],
    [GOD,'#joy|くらしの道具は、とどけておいたぞい。'],[HOMURA,'……ま、助かるよ。']],
   gives:{feat:['inv','remove','plant','craft','people'],flag:'lv_oven',recipes:['oven','bed','stor','mbox'],flags:['yoganLearned'],items:{oven:1,bed:1,hwall:3,fence:10,spike:10},mat:{wood:10,stone:10},enemy:true}},
  {id:'coldSpring',text:'冷たい温泉を調べよう',check:()=>!!S.flags.sprLook,how:'「みる」で、村の水たまりをタップする',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'…なあ守り神。この村、むかしは湯気がもくもく上がってたんだよ。'],
    [HOMURA,'それが、いつのまにか消えちまってさ。そこらの水たまり、みんな温泉だったんだ。'],
    [GOD,'ふむふむ。では、まずは水たまりを見てみようかの。']]},
   story:[
    [HOMURA,'…やっぱり冷たいね。地面の熱が、ぜんぜんとどいてない。'],
    [HOMURA,'この村には、温泉が3つあったんだ。入口の温泉、西の温泉、それと村の奥の温泉さ。'],
    [GOD,'3つとも、よみがえらせたいのう。'],[HOMURA,'#think|……あたいひとりじゃ、どこから手をつけたもんか、わからなかったよ。']]},
  {id:'food3',text:'ホムラのおねがい：たけのこをとってこよう',check:()=>tkGot()>=2,prog:()=>'たけのこ '+Math.min(2,tkGot())+'/2',how:'竹のそばに生えた、たけのこを、せいれいに2こ、とってきてもらう',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉をなおすのは、ひと仕事だよ。その前に、腹ごしらえだね。'],
    [HOMURA,'#think|ほら、竹やぶのそばを見てごらん。土から、とんがった頭がのぞいてるだろ。'],
    [HOMURA,'#joy|あれは、たけのこさ。この村の、春のごちそうなんだ。いくつか、とってきておくれよ。']],gives:{run:()=>takenokoStart()}},
   story:[[HOMURA,'#joy|うん、いいたけのこだ。やわらかくて、あまいよ。'],[HOMURA,'よし、これで村の準備はばっちりだね。助かったよ。']],gives:{flag:'hReq'}},
  {id:'springA',text:'温泉をよみがえらせよう',check:()=>S.obj.some((o,j)=>o==='hotstone'&&adjOf(j,k=>S.ground[k]===1&&sprMap()[k]==='a')>=0),how:'「おく」→「ほのお石」をえらんで、村の南東の温泉の水べに置く',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'まずは、いちばん近い入口の温泉からだね。'],
    [GOD,'ほのお石を入れといたぞい。ホムラの火の力が、きっと温泉をあたためてくれるじゃろう。'],
    [HOMURA,'よし、やってみようじゃないか。']],gives:{items:{hotstone:1}}},
   story:[
    [HOMURA,'…湯気だ！ あったかい湯気が、のぼってきたよ！','vol:springWalk'],[HOMURA,'#joy|……ま、助かったよ。……ほんとに。'],
    [GOD,'#joy|ホムラ、ひと仕事のあとは、ここでゆっくりあったまるとよいぞ。'],
    [GOD,'それに…お湯から、水の力も満ちてきたようじゃな。'],
    [HOMURA,'…ん？ 湯気の中に、なにか光ってる。これ…火のヌシ様の、火だねじゃないか！','vol:hidane'],
    [GOD,'#joy|ほっほ、ホムラにも、やっと笑顔がもどったのう。わしもうれしいわい。'],[GOD,'では、わしはほかの土地を見まわってくるぞい。ときどき遊びに来るからの。ではな〜！']],
   gives:{flag:'onsen',feat:['summon','shop'],shard:'land',godLeave:true}},
  {id:'summon',text:'なかまをむかえよう',check:()=>!!S.flags.minaCame&&NEWRES==null&&!NEWQ.length,how:'朝、神殿の上に「！」が出たら、「みる」で神殿をタップ',
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
  {id:'shizukuRest',text:'シズクのおねがい：温泉のそばに休憩所を作ろう',check:()=>nearSp('bench')&&nearSp('tub'),prog:()=>'ベンチ '+(nearSp('bench')?1:0)+'/1・水おけ '+(nearSp('tub')?1:0)+'/1',how:'あたたかい温泉のそばに、ベンチと水おけを置く',
   talk:{who:SHIZUKU,when:()=>true,learn:['bench','tub'],lines:[
    [SHIZUKU,'わたしからも、ひとつおねがいがあります。'],
    [SHIZUKU,'温泉から上がると、足を休めたくなります。それに、からだに残ったお湯を、もう少し流せたら……。守り神さま、何かよい方法はありませんか。'],
    [HOMURA,'#think|湯上がりに、ぼんやり？ あたいは、すぐ次の仕事だけどね。……ま、守り神なら、面白いことを考えてくれそうだ。'],['@idea']],gives:{flags:['lv_tub','lv_bench']}},
   story:[[SHIZUKU,'#joy|ここで、ゆっくり足を休められます。'],[HOMURA,'#think|……ま、たまには悪くないね。']],gives:{flag:'sReq'}},
  {id:'yatai',text:'ホムラのおねがい：温泉のそばに屋台をひらこう',check:()=>nearSp('oven')&&nearSp('table'),prog:()=>'かまど '+(nearSp('oven')?1:0)+'/1・食卓 '+(nearSp('table')?1:0)+'/1',how:'あたたかい温泉のそばに、かまどと食卓を置く',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'#joy|温泉がひとつもどっただけで、村の空気がちがうね。'],
    [HOMURA,'むかしはさ、湯けむりの中で、温泉たまごをふるまう屋台が出てたんだ。'],
    [SHIZUKU,'#joy|まあ、すてきです。湯上がりに、みんなで食べたいですね。'],
    [HOMURA,'たまごは、かたゆでにかぎるよ。'],
    [SHIZUKU,'半熟がいちばんです。'],
    [HOMURA,'よし、決まりだ。温泉のそばに、かまどと食卓をたのむよ！','hop']]},
   story:[[HOMURA,'#joy|ほら、できたての温泉たまごだよ！ みんな、食べな！','cheer+vol:egg'],[SHIZUKU,'……かたいです。','vol:eatS'],[HOMURA,'半熟なんて、ぐにゃっとして……'],[SHIZUKU,'#joy|でも、おいしいです。'],[HOMURA,'#joy|だろ？ これで、湯けむりの村らしくなってきた！']]},

  {id:'haikage3',text:'ハイカゲの灰で、ひびわれをうめよう',check:()=>CRACKS.every(j=>S.obj[j]!=='crack'),prog:()=>'ひびわれ '+CRACKS.filter(j=>S.obj[j]!=='crack').length+'/'+CRACKS.length+'・灰 '+(st2().hai||0),how:'夜に来るハイカゲを追いはらうと、灰を落とす。せいれいがひろった灰で、村の北のひびわれを「みる」でタップしてうめる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。温泉の熱は、火山から地面の下の「熱の道」を通って、とどいていたのです。'],
    [SHIZUKU,'村の北の地面に、ひびわれがあります。そこから熱がもれているようです。'],
    [HOMURA,'#think|……それとさ、これから夜になると、火山のほうから「ハイカゲ」ってやつが来るよ。'],
    [SHIZUKU,'火を朝までのこそうとして、灰をかぶせていく子です。灰というのは、もともと、熱を外へにがさないように……'],
    [HOMURA,'つまり？'],
    [SHIZUKU,'#nod|灰は、熱をとじこめます。'],
    [HOMURA,'熱をとじこめる灰か……。だったら、そいつで、ひびわれをうめちまえばいいじゃないか。'],
    [HOMURA,'#joy|よし。ハイカゲが来たら、追いはらって、灰をいただこうじゃないか。']],gives:{flag:'ashOn'}},
   story:[[HOMURA,'よし、ふさがった！ 熱の道が、つながったよ。'],[SHIZUKU,'ハイカゲの灰が、熱をしっかりとじこめてくれましたね。'],[SHIZUKU,'わたしの知っていたことと……'],[HOMURA,'#joy|あたいの思いつきだ。'],[SHIZUKU,'#joy|……はい。あとは、熱をどこへ流すか、ですね。']]},
  {id:'springB',text:'熱の装置を左にむけて、西の温泉をよみがえらせよう',check:()=>!!st2().sp.b,how:'火山のふもとの「熱の装置」をタップして、向きを左にかえる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'火山のふもとに、熱の流れを切りかえる装置があるんだ。'],
    [HOMURA,'左にむければ、西の温泉に熱がとどくはずさ。']]},
   story:[[HOMURA,'#think|……熱が、ちゃんと流れてるか、たしかめてみるよ。',0,'heat:b'],[HOMURA,'#joy|西の温泉にも、湯気が上がった！'],[SHIZUKU,'すばらしいです。…残るは、奥の温泉ですね。'],[HOMURA,'#think|熱の道のそばの土も、ぽかぽかしてきたね。'],[HOMURA,'#nod|……あんた、けっこう役に立つじゃないか。'],[SHIZUKU,'#surprise|……いま、ほめられましたか？','vol:lookbackS']]},
  {id:'fire3',text:'ようがん台で、火山の熱を村へひこう',check:()=>yoganHeatN()>=2,prog:()=>'熱の道のそばのようがん台 '+Math.min(2,yoganHeatN())+'/2',how:'熱が流れている熱の道のそばに、ようがん台を2つ建ててもらう',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'#think hush|……なあ、守り神。むかし、この村には、火のせいれいがたくさんいたんだ。','vol:yoganSide'],
    [HOMURA,'#danger|温泉が冷えて、コワイノのうろつく寒い夜がつづいてさ。みんな、ちりぢりに逃げのびた。……あたいが、逃がしたんだ。','vol:fist'],
    [HOMURA,'#sigh|守れなかったんだよ。あたいは、のこっただけさ。'],
    [SHIZUKU,'それは、ホムラさんのせいではありません。コワイノの数を考えれば、どうやっても……'],
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
  {id:'ashiyu',text:'西の温泉に、あし湯をつくろう',check:()=>spNear(['bench','takebench'],'b')>=2&&spNear(FLOWERS2,'b')>=3,prog:()=>'ベンチ '+Math.min(2,spNear(['bench','takebench'],'b'))+'/2・花 '+Math.min(3,spNear(FLOWERS2,'b'))+'/3',how:'西の温泉のそばに、ベンチ2つと花3つ',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉は、湯がやわらかくて、足をつけるのにちょうどよいのです。'],
    [HOMURA,'足だけつかって、のんびりおしゃべり……いいね。すわる所と、花でもあれば最高さ。'],
    [SHIZUKU,'あし湯ができたら、みなさんも、きっと遊びに来ますね。'],
    [GOD,'花のたねを、とどけておいたぞい。']],gives:{items:{clover:3}}},
   story:[[SHIZUKU,'あし湯ができました……！ 足だけでも、ぽかぽかします。'],[SHIZUKU,'足だけなら、あつくありません。'],[HOMURA,'#joy|あんた、やっぱりお湯が苦手なんだろ。'],[SHIZUKU,'……水のせいれいですから。'],[HOMURA,'花を見ながら、のんびりおしゃべり。いいもんだね。']]},
  {id:'volcano',text:'火山を調べよう',check:()=>!!S.flags.volLook,how:'「みる」で、北の火山をタップする',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の温泉に熱をとどけるには、奥の装置を使うはずです。'],
    [SHIZUKU,'その前に、火山を調べてみませんか。熱の流れが、どうなっているか…。']]},
   story:[[HOMURA,'火山の熱は、ちゃんと生きてるね。'],[SHIZUKU,'#scared|でも……山の上から、いやな気配がします。わたし、これ以上は……'],[HOMURA,'#nod|……いいよ。あんたの足が動くまで、待つさ。'],[SHIZUKU,'#surprise|ホムラさんが、待つんですか。'],[HOMURA,'たまにはね。それと、奥の装置のまわり、大岩だらけだったよ。']]},
  {id:'rockDeep',text:'奥の装置のまわりの大岩をどかそう',check:()=>BVOL.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+BVOL.filter(j=>S.obj[j]!=='boulder').length+'/4',how:'せいれいに、大岩をくだいてもらう',
   talk:{who:HOMURA,when:()=>true,lines:[[HOMURA,'奥の装置にたどりつくには、まわりの大岩をどかさないとね。'],[HOMURA,'みんな、たのんだよ！']]},
   story:[[HOMURA,'よし、道がひらけた！'],[SHIZUKU,'#scared|…装置が、こわれていますね。'],[SHIZUKU,'#nod|……直し方は、わかります。こんどは、わたしがやります。']]},
  {id:'springC',text:'奥の装置を直して、奥の温泉に熱をとどけよう',check:()=>!!st2().sp.c,how:'奥の装置を直して、熱を奥の温泉へむける',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の装置を直すには、石材と木材、それに…ヌシ様の火だねの力がいります。'],
    [HOMURA,'入口の温泉で見つけた、あの火だねだね。'],
    [SHIZUKU,'直せば、熱が、奥の温泉まで流れるはずです。']]},
   story:[[SHIZUKU,'#think|……こわいですけど、そっと手をあててみます。',0,'heat:c'],[SHIZUKU,'火だねが、装置に熱を通してくれました……！'],[HOMURA,'#surprise|…奥の温泉にも、湯気だ！ 3つ、ぜんぶよみがえったよ！'],[SHIZUKU,'#joy|温泉が3つ、よみがえりました……！ 夢みたいです。'],[HOMURA,'#joy|やるじゃないか、シズク。……名前で呼んだの、はじめてかもね。','vol:lookbackH'],[SHIZUKU,'…守り神さま。空が、灰色にくもってきました。'],[HOMURA,'今夜は、ハイカゲがわんさか来そうだね…！']],gives:{flag:'ashNight'}},
  {id:'ashNight',text:'灰の降る夜をのりこえよう',check:()=>{const t=st2();return !!t.ashNightAt&&S.nights>=t.ashNightAt&&!isNight()},how:'灰の降る夜を、みんなでのりこえる',
   story:[[HOMURA,'…ふう、なんとかのりこえたね。','vol:ashFall'],[SHIZUKU,'灰は、山の上からふってきていました。なにかが、いるのです。'],[HOMURA,'#danger|なら、あたいが山へ行って、ひとりで……','vol:stepMountain'],[SHIZUKU,'#alarm|だめです！','vol:grab'],[SHIZUKU,'……むかし、ひとりでのこったのでしょう。今度は、ひとりにしません。'],[HOMURA,'#think hush|……。','vol:lookbackH'],[HOMURA,'#nod|……わかったよ。背中、たのむよ。','vol:backToBack'],[SHIZUKU,'#nod|はい。','vol:morning']],gives:{flag:'hinoNight'}},
  {id:'hinoookage',text:'ヒノオオカゲを追いはらおう',check:()=>!!S.flags.hinoDown,how:'火山から下りてくるヒノオオカゲを追いはらう',
   story:[[HOMURA,'#joy|やった…！ 火山の上の、いやな気配が消えたよ。','vol:shadowSpot'],[SHIZUKU,'#think|……あの影、さいごまで、ふるえていましたね。','vol:kneelAsh'],[SHIZUKU,'熱をうばっても、あたたまらなかったのかもしれません。'],[HOMURA,'#think|……つめたいのは、さみしいもんさ。あたいも、ちょっとはわかるよ。','vol:skyH'],[SHIZUKU,'ヌシ様の熱が、すこしずつ、もどってくる気がします。'],[HOMURA,'#nod|よし。ヌシ様をむかえる、仕上げだね！']]},
  {id:'inn',text:'温泉宿に、露天ぶろをつくろう',check:()=>!!innHouse(),prog:()=>'温泉のそばの家 '+(HOUSES.some(h=>[...h.inside].some(j=>nearHot(j,6)))?1:0)+'/1・宿のそばの露天ぶろ '+(innHouse()?1:0)+'/1',how:'あたたかい温泉のそばに家をつくり、その家のそばに露天ぶろを建ててもらう',
   talk:{who:HOMURA,when:()=>true,learn:['onsen'],lines:[
    [HOMURA,'ヒノオオカゲもいなくなって、やっと落ちついたね。'],
    [SHIZUKU,'#joy|湯上がりに、そのままゆっくり休める宿があると、うれしいですね。'],
    [HOMURA,'#think|宿のすぐそばに、岩でかこんだ湯船もほしいね。空を見ながら、のんびりつかれるやつさ。'],
    [SHIZUKU,'守り神さま、なにか、よい形はありませんか。'],['@idea']],gives:{flags:['lv_onsen']}},
   story:[[HOMURA,'温泉宿のできあがりだ！ 宿を出たら、すぐ露天ぶろさ。'],[SHIZUKU,'露天ぶろは、岩のかげのほうが少しぬるいです。'],[HOMURA,'あたいは、わき口のそばだね。'],[SHIZUKU,'#joy|……同じお湯に、ちがう場所で入れますね。'],[HOMURA,'#joy|今夜は、あたいも泊まってみようかな。']]},
  {id:'guest',text:'草原からのお客さんを、露天ぶろでもてなそう',check:()=>!!S.flags.guestDone,how:'温泉宿の露天ぶろで、お客さんをもてなす',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'温泉宿も、露天ぶろもできて、湯けむりの村らしくなってきましたね。'],
    [HOMURA,'こうなったら、だれかに入ってもらいたいねえ。'],
    [GOD,'#joy|ほっほ。それなら、草原から、ひとり連れてこようかの。']]},
   story:[[HOMURA,'#joy|お客さん、よろこんでくれたね！','cheer'],[SHIZUKU,'半熟のたまご、おいしいと言ってくれました。'],[HOMURA,'かたゆでも、食べてたよ。'],[HOMURA,'……あとは、ヌシ様をむかえるだけさ。']]},

  {id:'tower',text:'守護の台座を建ててもらおう',check:()=>cnt('tower')>=1,prog:()=>'じょうけん '+clearConds().filter(c=>c[1]).length+'/'+clearConds().length,how:'「おく」→「守護の台座」を建ててもらう。ヌシ様の火だねを、台座にはめる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'湯けむりの村も、だいぶ元にもどってきたね。'],
    [SHIZUKU,'台座を建てるのに、なにが足りないか、いっしょに確かめましょう。'],
    [SHIZUKU,'#think|……ただ、台座が光ると、山の上にのこった影が気づくかもしれません。'],
    [HOMURA,'そのときは、みんなでむかえうつまでさ。……今度は、みんなでね。'],
    [SHIZUKU,'それと、温泉の入り口に、のれんをかけたいですね。湯けむりの村らしくなりますよ。'],
    [HOMURA,'よし、仕上げだよ！'],['@idea']],learn:['noren'],gives:{shrine:true}},
   story:null},
];;
const QUESTS2_V1=['statue','coldSpring','food3','springA','summon','rockCanal','shizukuRest','yatai','haikage3','heatPath','springB','fire3','fest','ashiyu','volcano','rockDeep','springC','ashNight','hinoookage','inn','guest','tower'];/* 火山のクエストをかえる前のならび（古いセーブの読みかえ用） */
const QL=[QUESTS1,QUESTS2],PROS=[PROLOGUE,PROLOGUE2],INTROS=[INTRO,INTRO2];
/* ---------- フリーモード（ステージ1クリアで解放）：自然の力が弱く、せいれいはゆっくり増える。災いはほとんどない ---------- */
const FA=()=>(S&&S.fk||[])[0]||GOD,FB=()=>(S&&S.fk||[])[1]||GOD;
const PROF=[
  [GOD,'おお、いいところを見つけたのう！'],
  [GOD,'ここは自然の力が弱くて、せいれいがなかなか生まれん土地なんじゃ。'],
  [GOD,'そのかわり、災いもほとんど起きん。'],
  [GOD,'つまり、のんびり暮らすにはぴったりというわけじゃな！'],
  [GOD,'まあ、最初はちと寂しいかもしれんが……。'],
  [GOD,'せっかくじゃ！ ここにおヌシだけの村をつくってみんか？'],
  [GOD,'わしも楽しみにしとるぞ！']];
function INTROFL(){return [[FA(),'#surprise|わあ、守り神さまだ！ ぼく、'+FA()+'！ この土地で、ひっそり暮らしてたんだ！'],[FB(),'#surprise|ふわぁ…。'+FB()+'#joy|だよぉ。ふたりきりだったから、うれしいねぇ。'],[GOD,'この土地にも、おヌシの力を集める場所がいるのう。わしの居場所にもなる神殿を建てよう。建てる場所は、おヌシが好きにえらんでよいぞ。']]}
const TOYS4=['swing','sandbox','seesaw','slide'];/* 遊び道具（どれでもよい） */
const LIGHTQ=['torch','lamp','campfire','lantern','candle','flamp','toro','takeakari','andon','yomawari'];/* クエストで数える「あかり」（どれでもよい） */
const DECOQ=['hedge','birdbath','parasol','arch','signpost','monstera','jar','rockart','vane','kamizo','shishiodoshi','noren'];/* クエストで数える「かざり」（どれでもよい） */
const QUESTSF=[
  {id:'statue',text:'神殿を建ててもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'下の「おく」→「神殿」をえらび、空いた場所をタップ',story:[
    [GOD,'#think|思いついた形は、依頼ボードに描いて伝えるんじゃ。せいれいが手を貸してくれるぞい。力がたまれば、なかまも呼べるからの。'],[GOD,'わしはここで、交換でもしながら見とるからの。']]},
  {id:'ep1',text:'第1話 はじめての居場所：家とベッド2つ',check:()=>HOUSES.length>=1&&houseBedCount()>=2,/* ベッドは家の中に2つ */prog:()=>'家 '+Math.min(1,HOUSES.length)+'/1・ベッド '+Math.min(2,houseBedCount())+'/2',how:'家の壁のすきまをオークの壁でふさぎ、依頼ボードでベッドをたのんで家の中に置く',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえねえ、あそこの家、まだ中がからっぽなの。'],[FB(),'草の上で寝るとねぇ、朝には背中がひんやりしてるんだよぉ。'],[FA(),'ここで、あったかく眠れるようになるかな？ 守り神さま、お願い！'],['@idea']]}},
   get story(){return [[FA(),'#joy|できた！ ぼくたちの家だ！'],[FB(),'ふたりきりのころは、雨の日、木の下でくっついて雨宿りしてたねぇ。'],[FA(),'#nod|うん！ これからは、屋根があるね！'],[FB(),'ここ、日なたがぽかぽかで、お気に入りの場所になりそうだねぇ。']]}},
  {id:'ep2',text:'第2話 みんなの好きなもの：花10・食卓・遊び道具',check:()=>flowerN()>=10&&cnt('table')>=1&&CN(TOYS4)>=1,prog:()=>'花 '+Math.min(10,flowerN())+'/10・食卓 '+Math.min(1,cnt('table'))+'/1・遊び道具 '+Math.min(1,CN(TOYS4))+'/1',how:'花の種を植え、依頼ボードの「家具」で食卓、「遊び」で好きな遊び道具をたのむ',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、好きなもの言いっこしよ！ ぼくは、花！'],[FB(),'ぼくは、みんなでごはんを食べるのが好きだねぇ。'],[FA(),'あと、遊ぶのも！ ぜんぶそろったら、きっと毎日たのしいよ！'],['@idea']]}},
   get story(){return [[FA(),'花も、食卓も、遊び道具もある！ 好きなものだらけ！'],[FA(),'ねえ'+FB()+'、ふたりのころ、いっしょに見つけた花、おぼえてる？'],[FB(),'おぼえてるよぉ。あれが、この村のさいしょの花だったねぇ。']]}},
  {id:'ep3',text:'第3話 遠くからのお客さん：せいれいを4人に',check:()=>S.res.length>=4,prog:()=>'せいれい '+Math.min(4,S.res.length)+'/4',how:'花や家具で属性の力をため、朝に神殿の「！」から呼ぶ',
   talk:{who:GOD,when:()=>true,lines:[[GOD,'この村も、ちょっとずつにぎやかになってきたのう。'],[GOD,'なかまがふえたら、遠くからお客さんが来るかもしれんぞ？']]},
   get story(){const ids=['hedge'].filter(id=>recipeKnown(id)),gift=ids.length?'草原で見つけたかざりを、おみやげに持ってきたよ！ よかったら使ってね！':'シロツメクサの種を、おみやげに持ってきたよ！ よかったら植えてね！';return [[POKO,'#wave|こんにちはー！ ぼく、はじまりの草原から来たフタバ！'],[POKO,'#surprise|守り神さまの新しい村、見に来ちゃった！ わあ、すてきなところだね！'],[FA(),'#surprise|わあ、お客さんだ！ いらっしゃい！'],[POKO,'草原にはね、花がいっぱいの広場があるんだ！ '+gift],[GOD,'遠くの友だちが訪ねてくる村は、いい村になってきた証拠じゃよ。']]},get gives(){const items={};for(const[id,n]of[['hedge',3]])if(recipeKnown(id))items[id]=n;if(!Object.keys(items).length)items.clover=5;return{items}}},
  {id:'ep4',text:'第4話 ここが好き！：噴水の広場',check:()=>cnt('fountain')>=1,prog:()=>'噴水 '+Math.min(1,cnt('fountain'))+'/1',how:'「おく」から噴水をえらび、みんなで眺められる場所に建てる',
   talk:{get who(){return FB()},when:()=>true,get lines(){return [[FB(),'みんなで、のんびりできる広場があったらいいねぇ。'],[FA(),'#joy|水がきらきらして、みんなで眺められたらうれしいな！'],['@idea']]}},
   get story(){return [[FA(),'ここ、だーいすき！'],[FB(),'水の音を聞きながら、みんなでのんびりできるねぇ。'],[FA(),'#nod|うん！ ここで、ゆっくりしていこう！'],[FB(),'この広場、大切な場所になりそうだねぇ。']]}},
  {id:'ep5',text:'最終話 みんなのふるさと：たき火とせいれい6人',check:()=>cnt('campfire')>=1&&S.res.length>=6,prog:()=>'たき火 '+Math.min(1,cnt('campfire'))+'/1・せいれい '+Math.min(6,S.res.length)+'/6',how:'火のせいれいに、たき火を作ってもらう。なかまを6人に',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、村のお祭りしようよ！'],[FB(),'夜もあったかいところで、みんなで踊れたら、楽しいだろうねぇ。'],[GOD,'#nod|うむ！ なかまがそろったら、盛大にやるとしようかの！'],['@idea']]}},
   get story(){return [[GOD,'おお、にぎやかじゃのう！ ほれ、もっと踊らんか！'],[FA(),'#think|……ねえ'+FB()+'。ふたりだけだったころ、おぼえてる？'],[FB(),'#cry hush|おぼえてるよぉ。しずかで、ちょっとさみしくて……でも、きみがいたから、へいきだったねぇ。'],[FA(),'いまは、こんなにいっぱい！ 守り神さまが来てくれたからだね。'],[FB(),'ここが、みんなの帰る場所になったんだねぇ。'],[FA(),'ここが、ぼくたちのふるさとだね！'],[GOD,'物語はひと区切りじゃが、村づくりはまだまだこれからじゃぞ！']]},gives:{fest:true}},
];
function freeFest(){for(const r of S.res){r.fun=100;spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))}startClap();setTimeout(endClap,3200);S.cleared=true;S.clearDay=dayNo();memo('🎉','村のお祭りをひらいた');omo('fest');logEv('村のお祭りをひらいた');toast('物語はひと区切り！ 村づくりはつづくよ','good')}
function freeSetup(s){const used=new Set(['フタバ','ノドカ']);const nm=()=>{let n;do{n=NAMES[s.nameIdx%NAMES.length];s.nameIdx++}while(used.has(n));used.add(n);return n};
  const a=nm(),b=nm();s.res=[mkRes(s,a,'wood',CX+.5,CY-1.5,'swing'),mkRes(s,b,'earth',CX+1.5,CY-1.5,'chat')];s.fk=[a,b];s.keyN={wood:a,earth:b};
  s.flags.minaCame=true;s.flags.sumTold=true;s.flags.tapped=true;s.free=1;
  Object.assign(s.feat,{inv:true,craft:true,remove:true,plant:true,people:true,shop:true,summon:true});
  s.fs={berry:12};s.food=12;s.mat={wood:20,stone:20};s.pt=40;
  for(let j=0;j<W*H;j++)if(s.obj[j]==='deadtree')s.obj[j]=Math.random()<.5?'ntree':'';
  for(let d=3;d<=5;d++){const j=(CY-2)*W+CX-d;s.obj[j]='hwall';s.floor[j]='';s.hp[j]=BL.hwall.hp}/* 家はこわれていない */
  putNear(s,'stor',CX+3,CY+1);putNear(s,'mbox',CX+5,CY+1);
  for(const k of ['tree','bellf','salvia','lily','lotus','clover'])if(BL[k]){s.unlocked[k]=true}
  s.inv=Object.assign(s.inv||{},{bellf:3,salvia:3,lily:3,lotus:3,clover:9});
  let c2=false;try{const t=KV.getItem(SAVE_KEYS[1]);c2=!!(t&&JSON.parse(t).cleared)}catch(e){}if(c2){s.inv.hotstone=(s.inv.hotstone||0)+2;s.flags.giftV=1}/* 火山の村をクリアしていたら、ほのお石もとどく */syncQuestRecipes(s)}
QL[FREE]=QUESTSF;PROS[FREE]=PROF;INTROS[FREE]=[];

let QUESTS=QUESTS1;
