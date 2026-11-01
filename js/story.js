'use strict';


/* ---------- ステージ2：火山のふもとの村 ---------- */
const PROLOGUE2=[
  [GOD,'さて、次の土地じゃな。'],
  [GOD,'ここは火の山のふもとの村。むかしは、あちこちから温泉がわく、あったかい村じゃった。'],
  [GOD,'じゃが、火のヌシ様が力をうばわれて、地面の熱が冷えきってしもうた。温泉も、いまではただの冷たい水たまりじゃ。'],
  [GOD,'新しい土地じゃから、守り神の力も、また一からじゃな。力がとどくのは、はじめはせまい所だけじゃ。'],
  [GOD,'では、行こうかの。'],
];
const INTRO2=[
  [GOD,'ほい到着〜。ここが火山のふもとの村じゃ。'],
  [HOMURA,'…ん？ あんたが、うわさの守り神かい？'],
  [HOMURA,'あたいはホムラ、火のせいれいさ。この村にのこってるのは、もうあたいひとりだよ。'],
  [HOMURA,'#wave|寒くてかなわないけど…ま、よろしく頼むよ。'],
  [GOD,'まずは神殿じゃな。草原と同じように、置いてみい。'],
];
const QUESTS2=[
  {id:'statue',text:'神殿を建ててもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'下の「おく」→「神殿」をえらび、空いた場所をタップ',story:[
    [HOMURA,'へえ、なかなかいい神殿じゃないか。'],
    [GOD,'じゃろ〜。女神像もおそなえ箱も依頼ボードも、草原といっしょじゃよ。'],
    [GOD,'#danger|食料箱は古い家の中に、素材箱は村の北西に置いといたぞい。コワイノは南から来るからの。かまどやベッド、柵や罠も、おそなえ箱に入れといたからの。'],[HOMURA,'ありがとよ、守り神。']],
   gives:{feat:['inv','remove','plant','craft','people'],flag:'lv_oven',recipes:['oven','bed','stor','mbox'],flags:['yoganLearned'],items:{oven:1,bed:1,hwall:3,fence:10,spike:10},mat:{wood:10,stone:10},enemy:true}},
  {id:'coldSpring',text:'冷たい温泉を調べよう',check:()=>!!S.flags.sprLook,how:'「みる」で、村の水たまりをタップする',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'…なあ守り神。この村、むかしは湯気がもくもく上がってたんだよ。'],
    [HOMURA,'それが、いつのまにか消えちまってさ。そこらの水たまり、みんな温泉だったんだ。'],
    [GOD,'ふむふむ。では、まずは水たまりを見てみようかの。']]},
   story:[
    [HOMURA,'…やっぱり冷たいね。地面の熱が、ぜんぜんとどいてない。'],
    [HOMURA,'この村には、温泉が3つあったんだ。入口の温泉、西の温泉、それと村の奥の温泉さ。'],
    [GOD,'3つとも、よみがえらせたいのう。'],[HOMURA,'いっしょに調べてくれて、ありがとよ。']]},
  {id:'food3',text:'ホムラのおねがい：食料を3つためよう',check:()=>S.food>=3,prog:()=>'食料 '+Math.min(3,S.food)+'/3',how:'せいれいが木の実や畑でとってきた食べ物が、食料箱にたまる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉をなおすのは、ひと仕事だよ。その前に、腹ごしらえだね。'],
    [HOMURA,'あたいからのおねがいさ。食料を3つ、ためておいておくれ。腹いっぱいになったら、あたいもひと働きするよ。']]},
   story:[[HOMURA,'よし、これで村の準備はばっちりだね。ありがとよ、守り神。']],gives:{flag:'hReq'}},
  {id:'springA',text:'温泉をよみがえらせよう',check:()=>S.obj.some((o,j)=>o==='hotstone'&&adjOf(j,k=>S.ground[k]===1&&sprMap()[k]==='a')>=0),how:'「おく」→「ほのお石」をえらんで、村の南東の温泉の水べに置く',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'まずは、いちばん近い入口の温泉からだね。'],
    [GOD,'ほのお石を入れといたぞい。入口の温泉の水べに置いて、ホムラの火の力をこめてみい。'],
    [HOMURA,'よし、やってみようじゃないか。']],gives:{items:{hotstone:1}}},
   story:[
    [HOMURA,'…湯気だ！ あったかい湯気が、のぼってきたよ！'],[HOMURA,'#joy|守り神、ありがとよ！ ほんとにありがとう！'],
    [GOD,'夕方は、ここでひとっぷろ浴びるとよいぞ。つかれもとれるし、たのしさもふえるからの。'],
    [GOD,'それに…お湯から、水の力も満ちてきたようじゃな。'],
    [HOMURA,'…ん？ 湯気の中に、なにか光ってる。これ…火のヌシ様のかけらじゃないか！'],
    [GOD,'では、わしはほかの土地を見まわってくるぞい。ときどき遊びに来るからの。わからんことは「ひでんのしょ」を見るんじゃ。ではな〜！']],
   gives:{flag:'onsen',feat:['summon','shop'],shard:'land',godLeave:true}},
  {id:'summon',text:'なかまをむかえよう',check:()=>!!S.flags.minaCame&&NEWRES==null&&!NEWQ.length,how:'朝、神殿の上に「！」が出たら、「みる」で神殿をタップ',
   talk:{who:HOMURA,when:()=>nextOK(),lines:[
    [HOMURA,'お湯から、水の力が満ちてきたね。だれか来てくれるかもしれないよ。'],
    [HOMURA,'なかまか…。にぎやかになるのは、悪くないね。']],gives:{flag:'sumTold'}},
   by:SHIZUKU,story:[
    [SHIZUKU,'はじめまして。水のせいれい、シズクと申します。'],
    [HOMURA,'#wave|へえ、水のせいれいかい。あたいはホムラ。よろしく頼むよ。'],
    [SHIZUKU,'温泉の湯の加減は、おまかせください。…のこりの温泉も、よみがえらせたいですね。'],[SHIZUKU,'#joy|呼んでくださって、ありがとうございます。']]},
  {id:'rockCanal',text:'水路をふさぐ大岩をどかそう',check:()=>st2().bw.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+st2().bw.filter(j=>S.obj[j]!=='boulder').length+'/'+st2().bw.length,how:'西の温泉のそばの大岩は、せいれいが石をほりにいって、くだいてくれる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉を調べてきました。'],
    [SHIZUKU,'温泉に水をはこぶ水路が、大きな岩でふさがれています。'],
    [HOMURA,'岩なら、まかせときな。みんなでくだいてやろうじゃないか。']]},
   story:[[SHIZUKU,'水路に、水がもどりました。'],[SHIZUKU,'でも、まだ冷たいままです。熱が、とどいていないのですね。'],[SHIZUKU,'#joy|大岩をどかしてくださって、ありがとうございます。']]},
  {id:'shizukuRest',text:'シズクのおねがい：温泉のそばに休憩所を作ろう',check:()=>nearSp('bench')&&nearSp('tub'),prog:()=>'ベンチ '+(nearSp('bench')?1:0)+'/1・水おけ '+(nearSp('tub')?1:0)+'/1',how:'依頼ボードで「ベンチ」と「水おけ」をはって、あたたかい温泉の4マス以内に置く',
   talk:{who:SHIZUKU,when:()=>true,learn:['bench','tub'],lines:[
    [SHIZUKU,'わたしからも、ひとつおねがいがあります。'],
    [SHIZUKU,'温泉から上がると、足を休めたくなります。それに、からだに残ったお湯を、もう少し流せたら……。守り神さま、何かよい方法はありませんか。'],
    [HOMURA,'#think|湯上がりに、ぼんやりできる場所か。いいね。守り神なら、面白いことを考えてくれそうだ。'],['@idea']],gives:{flags:['lv_tub','lv_bench']}},
   story:[[SHIZUKU,'#joy|ありがとうございます。湯上がりのひととき、たいせつにしますね。']],gives:{flag:'sReq'}},
  {id:'lv3',text:'村レベルを3にしよう',check:()=>S.lv>=3,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉がひとつもどっただけで、村の空気がちがうね。'],
    [SHIZUKU,'みなさんが、ここで楽しく暮らしてくだされば、村も育っていきます。'],
    [HOMURA,'よし、もっとにぎやかな温泉郷にしてやろうじゃないか。']]},
   story:[[HOMURA,'村が、ひとまわり大きくなった気がするよ。'],[SHIZUKU,'新しく作れるものも、ふえたようです。']]},
  {id:'haikage3',text:'ハイカゲを3体追いはらおう',check:()=>(st2().ashKills||0)>=3,prog:()=>'ハイカゲ '+Math.min(3,st2().ashKills||0)+'/3',how:'夜に来る灰色の「ハイカゲ」を追いはらう。かまどやベンチを灰でよごして、しばらく使えなくする',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'…守り神。これから夜になると、火山のほうから「ハイカゲ」ってやつも来るよ。'],
    [SHIZUKU,'灰をまきちらして、かまどやベンチを使えなくしてしまうのです。'],
    [HOMURA,'来たら3体追いはらって、こらしめてやろうじゃないか。']],gives:{flag:'ashOn'}},
   story:[[HOMURA,'ふん、これでしばらくは、おとなしくなるだろ。'],[SHIZUKU,'灰でよごれた設備も、しばらくすれば元にもどりますよ。'],[HOMURA,'追いはらってくれて、ありがとよ、守り神。']]},
  {id:'heatPath',text:'ひびわれた熱の道を直そう',check:()=>CRACKS.every(j=>S.obj[j]!=='crack'),prog:()=>'ひびわれ '+CRACKS.filter(j=>S.obj[j]!=='crack').length+'/5',how:'村の北、火山のふもとの「ひびわれ」を「みる」でタップ。石材2で直せる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。温泉の熱は、火山から地面の下の「熱の道」を通って、とどいていたのです。'],
    [SHIZUKU,'村の北の地面に、ひびわれがあります。そこから熱がもれているようです。'],
    [HOMURA,'石でふさいじまえばいいんだね。']]},
   story:[[HOMURA,'よし、ふさがった！ 熱の道が、つながったよ。'],[SHIZUKU,'あとは、熱をどこへ流すか、ですね。'],[HOMURA,'直してくれて、ありがとよ！']]},
  {id:'springB',text:'熱の装置を左にむけて、西の温泉をよみがえらせよう',check:()=>!!st2().sp.b,how:'火山のふもとの「熱の装置」をタップして、向きを左にかえる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'火山のふもとに、熱の流れを切りかえる装置があるんだ。'],
    [HOMURA,'左にむければ、西の温泉に熱がとどくはずさ。']]},
   story:[[HOMURA,'西の温泉にも、湯気が上がった！'],[SHIZUKU,'すばらしいです。…残るは、奥の温泉ですね。'],[SHIZUKU,'#joy|ありがとうございます、守り神さま。']]},
  {id:'fire3',text:'火のせいれいを3人にしよう',check:()=>elemCount('fire')>=3&&NEWRES==null,how:'ようがん台を置いて火の力をためる。満ちた次の朝、神殿の「！」からなかまを呼ぶ',prog:()=>'火のせいれい '+Math.min(3,elemCount('fire'))+'/3・火の力 '+Math.floor(ATTR.fire)+'/'+needFor('fire'),
   talk:{who:HOMURA,when:()=>nextOK(),lines:[
    [HOMURA,'#think|……なあ、守り神。むかし、この村には、火のせいれいがたくさんいたんだ。'],
    [HOMURA,'#danger|温泉が冷えて、コワイノのうろつく寒い夜がつづいてさ……でも、あたいら火のせいれいは、からだが強いからね。消えずに、ちりぢりに逃げのびたんだ。'],
    [HOMURA,'あたいだけは、この村をはなれられなくて、ひとりでのこったのさ。'],
    [SHIZUKU,'では、みなさん、どこかで元気にしているのですね。西の温泉にも、湯気がもどりました。ぬくもりが伝われば、きっと帰ってきます。'],
    [HOMURA,'#think|……そうだね。火の力をためて、なかまをむかえようじゃないか。']]},
   story:[[HOMURA,'#think|……おかえり。待ってたよ。'],[HOMURA,'ほらね。みんな、ちゃんと生きてたんだ。温泉がもどれば、帰ってくるのさ。'],[SHIZUKU,'にぎやかになりましたね。'],[HOMURA,'ありがとよ、守り神。']]},
  {id:'fest',text:'おまつりをひらこう',check:()=>S.festAtQ==='fest'&&festOn(),prog:()=>S.festDay!=null&&S.festDay>dayNo()?'あしたはおまつり':'',how:'カミサマと交換の「とくべつな交換」で「おまつり」をえらぶ。つぎの日の朝に、おまつりがはじまる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'#joy|なかまが帰ってきて、村もにぎやかになったねえ。'],
    [HOMURA,'#think|むかしはね、なかまがそろうと、みんなで屋台を出して、おまつりをしたもんさ。'],
    [SHIZUKU,'おまつり……すてきですね。温泉のまわりに、ちょうちんをともして。'],
    [HOMURA,'よし、決まりだ！ 守り神、カミサマにたのんで、おまつりをひらいておくれよ。']]},
   story:[[HOMURA,'#joy|これこれ！ やっぱり、おまつりはいいねえ！'],[SHIZUKU,'#joy|みなさん、いいお顔をしています。'],[HOMURA,'ありがとよ、守り神。また、いつでもひらこうじゃないか。']]},
  {id:'ashiyu',text:'西の温泉に、あし湯をつくろう',check:()=>spNear(['bench','takebench'],'b')>=2&&spNear(FLOWERS2,'b')>=3,prog:()=>'ベンチ '+Math.min(2,spNear(['bench','takebench'],'b'))+'/2・花 '+Math.min(3,spNear(FLOWERS2,'b'))+'/3',how:'西の温泉の4マス以内に、ベンチを2つと、花を3つさかせる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉は、湯がやわらかくて、足をつけるのにちょうどよいのです。'],
    [HOMURA,'足だけつかって、のんびりおしゃべり……いいね。すわる所と、花でもあれば最高さ。'],
    [SHIZUKU,'あし湯ができたら、みなさんも、きっと遊びに来ますね。'],
    [GOD,'花のたねを3つ、おそなえ箱に入れといたぞい。']],gives:{items:{clover:3}}},
   story:[[SHIZUKU,'あし湯ができました……！ 足だけでも、ぽかぽかします。'],[HOMURA,'花を見ながら、のんびりおしゃべり。いいもんだね。'],[SHIZUKU,'#joy|ありがとうございます、守り神さま。']]},
  {id:'volcano',text:'火山を調べよう',check:()=>!!S.flags.volLook,how:'「みる」で、北の火山をタップする',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の温泉に熱をとどけるには、奥の装置を使うはずです。'],
    [SHIZUKU,'その前に、火山を調べてみませんか。熱の流れが、どうなっているか…。']]},
   story:[[HOMURA,'火山の熱は、ちゃんと生きてるね。'],[SHIZUKU,'でも…山の上から、いやな気配がします。'],[HOMURA,'それと、奥の装置のまわり、大岩だらけだったよ。'],[HOMURA,'いっしょに来てくれて、ありがとよ。']]},
  {id:'rockDeep',text:'奥の装置のまわりの大岩をどかそう',check:()=>BVOL.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+BVOL.filter(j=>S.obj[j]!=='boulder').length+'/4',how:'大岩は、せいれいが石をほりにいって、くだいてくれる',
   talk:{who:HOMURA,when:()=>true,lines:[[HOMURA,'奥の装置にたどりつくには、まわりの大岩をどかさないとね。'],[HOMURA,'みんな、たのんだよ！']]},
   story:[[HOMURA,'よし、道がひらけた！'],[SHIZUKU,'#scared|…装置が、こわれていますね。'],[HOMURA,'ありがとよ、守り神。']]},
  {id:'springC',text:'奥の装置を直して、奥の温泉に熱をとどけよう',check:()=>!!st2().sp.c,how:'奥の装置をタップして、石材8・木材5・ヌシのかけら1つで直す。手前の装置を右、奥の装置を左にむける',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の装置を直すには、石材と木材、それに…ヌシ様のかけらの力がいります。'],
    [HOMURA,'入口の温泉で見つけた、あのかけらだね。'],
    [SHIZUKU,'直したら、手前の装置を右に、奥の装置を左にむけてください。熱が、奥の温泉まで流れるはずです。']]},
   story:[[SHIZUKU,'かけらが、装置に熱を通してくれました……！'],[HOMURA,'#surprise|…奥の温泉にも、湯気だ！ 3つ、ぜんぶよみがえったよ！'],[SHIZUKU,'#joy|守り神さま、ありがとうございます。温泉が3つ、よみがえりました。'],[SHIZUKU,'…守り神さま。空が、灰色にくもってきました。'],[HOMURA,'今夜は、ハイカゲがわんさか来そうだね…！']],gives:{flag:'ashNight'}},
  {id:'ashNight',text:'灰の降る夜をのりこえよう',check:()=>{const t=st2();return !!t.ashNightAt&&S.nights>=t.ashNightAt&&!isNight()},how:'今夜はハイカゲがたくさん来る。かまどやベンチをまもろう',
   story:[[HOMURA,'…ふう、なんとかのりこえたね。'],[SHIZUKU,'#danger|守ってくださって、ありがとうございます。'],[SHIZUKU,'灰は、火山からふってきていました。山の上に、なにかがいるのです。'],[HOMURA,'次の夜、きっとそいつが下りてくる。むかえうってやろうじゃないか！']],gives:{flag:'hinoNight'}},
  {id:'hinoookage',text:'ヒノオオカゲを追いはらおう',check:()=>!!S.flags.hinoDown,how:'夜、火山から下りてくる「ヒノオオカゲ」を追いはらう。熱の装置をねらってくる',
   story:[[HOMURA,'#joy|やった…！ 火山の上の、いやな気配が消えたよ。'],[HOMURA,'ありがとよ、守り神！ あんたのおかげさ。'],[SHIZUKU,'ヒノオオカゲが、ヌシ様の熱をうばっていたのですね。'],[SHIZUKU,'落としたかけらは、朝にせいれいが拾ってくれますよ。'],[SHIZUKU,'そのかけらを守護の台座にはめれば、ヌシ様の力になるはずです。'],[HOMURA,'#nod|よし。ヌシ様のために、あとひとふんばりだね！']]},
  {id:'inn',text:'温泉宿をつくろう',check:()=>HOUSES.some(h=>[...h.inside].filter(j=>BEDSET.has(S.obj[j])).length>=2&&[...h.inside].some(j=>nearHot(j,6))),how:'あたたかい温泉の6マス以内に、家の壁とドアで家をつくり、中にベッドを2つ置く',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'ヒノオオカゲもいなくなって、やっと落ちついたね。'],
    [SHIZUKU,'#joy|湯上がりに、そのままゆっくり泊まれる場所があると、うれしいですね。'],
    [HOMURA,'温泉のそばに、宿をつくろうじゃないか。壁でかこって、ベッドを2つ。あたいらで、もてなすのさ。']]},
   story:[[HOMURA,'温泉宿のできあがりだ！'],[SHIZUKU,'湯上がりに、ここでぐっすり休めますね。'],[HOMURA,'ありがとよ、守り神。今夜は、あたいも泊まってみようかな。']]},
  {id:'lv5',text:'村レベルを5にしよう',check:()=>S.lv>=5,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'温泉郷らしくなってきましたね。'],
    [HOMURA,'あと少しさ。みんなが楽しく暮らせば、ヌシ様をむかえる力もたまる。']]},
   story:[[HOMURA,'村が、また大きく育ったね！'],[SHIZUKU,'ヌシ様をむかえる準備も、ととのってきました。']]},
  {id:'tower',text:'守護の台座を建ててもらおう',check:()=>cnt('tower')>=1,prog:()=>'じょうけん '+clearConds().filter(c=>c[1]).length+'/'+clearConds().length,how:'「おく」→「守護の台座」をえらぶと、足りない条件が見られる。ぜんぶそろったら置いて、建ててもらう',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉郷も、だいぶ元にもどってきたね。'],
    [SHIZUKU,'台座を建てるのに、なにが足りないか、いっしょに確かめましょう。'],
    [SHIZUKU,'#think|……ただ、台座が光ると、山の上にのこった影が気づくかもしれません。'],
    [HOMURA,'そのときは、みんなでむかえうつまでさ。'],
    [SHIZUKU,'それと、温泉の入り口に、のれんをかけたいですね。湯けむりの里らしくなりますよ。'],
    [HOMURA,'よし、仕上げだよ！'],['@idea']],learn:['noren'],gives:{shrine:true}},
   story:null},
];;
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
const LIGHTQ=['torch','lamp','campfire','lantern','candle','flamp','toro','takeakari','yomawari'];/* クエストで数える「あかり」（どれでもよい） */
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
  {id:'ep3',text:'第3話 遠くからのお客さん：せいれいを4人に',check:()=>S.res.length>=4,prog:()=>'せいれい '+Math.min(4,S.res.length)+'/4',how:'花や家具で属性の力をため、朝に神殿の「！」から呼ぶ。この土地では、力がたまるのがゆっくり',
   talk:{who:GOD,when:()=>true,lines:[[GOD,'この村も、ちょっとずつにぎやかになってきたのう。'],[GOD,'なかまが4人になったら、遠くからお客さんが来るかもしれんぞ？ ほっほっ。']]},
   get story(){const ids=['hedge'].filter(id=>recipeKnown(id)),gift=ids.length?'草原で見つけたかざりを、おみやげに持ってきたよ！ よかったら使ってね！':'シロツメクサの種を、おみやげに持ってきたよ！ よかったら植えてね！';return [[POKO,'#wave|こんにちはー！ ぼく、はじまりの草原から来たフタバ！'],[POKO,'#surprise|守り神さまの新しい村、見に来ちゃった！ わあ、すてきなところだね！'],[FA(),'#surprise|わあ、お客さんだ！ いらっしゃい！'],[POKO,'草原にはね、花がいっぱいの広場があるんだ！ '+gift],[GOD,'遠くの友だちが訪ねてくる村は、いい村になってきた証拠じゃよ。']]},get gives(){const items={};for(const[id,n]of[['hedge',3]])if(recipeKnown(id))items[id]=n;if(!Object.keys(items).length)items.clover=5;return{items}}},
  {id:'ep4',text:'第4話 ここが好き！：噴水の広場',check:()=>cnt('fountain')>=1,prog:()=>'噴水 '+Math.min(1,cnt('fountain'))+'/1',how:'「おく」から噴水をえらび、みんなで眺められる場所に建てる',
   talk:{get who(){return FB()},when:()=>true,get lines(){return [[FB(),'みんなで、のんびりできる広場があったらいいねぇ。'],[FA(),'#joy|水がきらきらして、みんなで眺められたらうれしいな！'],['@idea']]}},
   get story(){return [[FA(),'ここ、だーいすき！'],[FB(),'水の音を聞きながら、みんなでのんびりできるねぇ。'],[FA(),'#nod|うん！ ここで、ゆっくりしていこう！'],[FB(),'この広場、大切な場所になりそうだねぇ。']]}},
  {id:'ep5',text:'最終話 みんなのふるさと：たき火とせいれい6人',check:()=>cnt('campfire')>=1&&S.res.length>=6,prog:()=>'たき火 '+Math.min(1,cnt('campfire'))+'/1・せいれい '+Math.min(6,S.res.length)+'/6',how:'火のせいれいに、たき火を作ってもらう。なかまを6人に',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、村のお祭りしようよ！'],[FB(),'夜もあったかいところで、みんなで踊れたら、楽しいだろうねぇ。'],[GOD,'#nod|うむ！ なかまが6人そろったら、盛大にやるとしようかの！'],['@idea']]}},
   get story(){return [[GOD,'おお、にぎやかじゃのう！ ほれ、もっと踊らんか！'],[FA(),'#think|……ねえ'+FB()+'。ふたりだけだったころ、おぼえてる？'],[FB(),'#cry|おぼえてるよぉ。しずかで、ちょっとさみしくて……でも、きみがいたから、へいきだったねぇ。'],[FA(),'いまは、こんなにいっぱい！ 守り神さまが来てくれたからだね。'],[FB(),'ここが、みんなの帰る場所になったんだねぇ。'],[FA(),'ここが、ぼくたちのふるさとだね！'],[GOD,'物語はひと区切りじゃが、村づくりはまだまだこれからじゃぞ！']]},gives:{fest:true}},
];
function freeFest(){for(const r of S.res){r.fun=100;spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))}startClap();setTimeout(endClap,3200);S.cleared=true;S.clearDay=dayNo();memo('🎉','村のお祭りをひらいた');logEv('村のお祭りをひらいた');toast('物語はひと区切り！ 村づくりはつづくよ','good')}
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
