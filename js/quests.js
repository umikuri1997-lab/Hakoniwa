'use strict';
const FREEG=[{k:'g900',t:'みどりのマスを900に',now:()=>GRASSN,ok:()=>GRASSN>=900,rw:30},{k:'r15',t:'せいれいを15人に',now:()=>S.res.length,ok:()=>S.res.length>=15,rw:30},{k:'fl30',w:0,t:'花を30こさかせる',now:()=>flowerN(),ok:()=>flowerN()>=30,rw:40},
  {k:'h3',t:'家を3けん',now:()=>HOUSES.length,ok:()=>HOUSES.length>=3,rw:30},{k:'m3',t:'なかよしを3組',now:()=>{let n=0;for(const r of S.res)if(bestMate(r))n++;return Math.floor(n/2)},ok:()=>{let n=0;for(const r of S.res)if(bestMate(r))n++;return n>=6},rw:30},
  {k:'b5',w:0,t:'オオカゲを5回追いはらう',now:()=>S.bossKills||0,ok:()=>(S.bossKills||0)>=5,rw:50},{k:'lv5',t:'Lv5のせいれいを5人',now:()=>S.res.filter(r=>rLv(r)>=5).length,ok:()=>S.res.filter(r=>rLv(r)>=5).length>=5,rw:40},
  {k:'vlv15',t:'村レベルを15に',now:()=>S.lv,ok:()=>S.lv>=15,rw:100},{k:'h5',t:'家を5けん',now:()=>HOUSES.length,ok:()=>HOUSES.length>=5,rw:60},{k:'fl80',w:0,t:'花を80こさかせる',now:()=>flowerN(),ok:()=>flowerN()>=80,rw:60},
  {k:'k300',t:'「コワイノ」を300体追いはらう',now:()=>S.kills||0,ok:()=>(S.kills||0)>=300,rw:80},{k:'tr3',t:'「コワイノ」の試練を3回のりこえる',now:()=>S.trials||0,ok:()=>(S.trials||0)>=3,rw:60},{k:'p20k',t:'パワーを合計20000ためる',now:()=>S.totalPt||0,ok:()=>(S.totalPt||0)>=20000,rw:150},
  {k:'tk30',w:1,t:'たけのこを30こ、とる',now:()=>(S.st2&&S.st2.tkGot)||0,ok:()=>((S.st2&&S.st2.tkGot)||0)>=30,rw:40},{k:'onsen3',w:1,t:'露天ぶろを3つ',now:()=>cnt('onsen'),ok:()=>cnt('onsen')>=3,rw:40},
  {k:'andon10',w:1,t:'行燈を10こともす',now:()=>cnt('andon'),ok:()=>cnt('andon')>=10,rw:40},{k:'ore50',w:1,t:'鉱石を50こほる',now:()=>oreGot(),ok:()=>oreGot()>=50,rw:50}];/* クリア後のじゆうな目標（やりこみ） */
const AFTERQ=[/* クリア後の新しいクエスト：カミサマからのおねがい。ひとつずつ出る。数は、うけたときからふえた分（d）。w：その土地だけ */
  {k:'aq2',w:0,t:'家を、あと2けんふやそう',how:'家の壁とドアで、家をつくる',now:()=>HOUSES.length,d:2,rw:50,
   L:[[GOD,'なかまがふえても、みんなが安心してねむれるように、家をふやしてやらんか？']],X:[[GOD,'#nod|うむ。どの家からも、ねいきが聞こえてきそうじゃ。']]},
  {k:'aq3',w:0,t:'せいれいを、あと3人ふやそう',how:'属性の力をため、朝に神殿の「！」からなかまを呼ぶ',now:()=>S.res.length,d:3,max:30,rw:50,
   L:[[GOD,'この土地が元気になったら、新しいせいれいも、きっと来たがるはずじゃ。'],[GOD,'力をためて、なかまを呼んでやるんじゃぞ。']],X:[[GOD,'#joy|にぎやかになったのう！ わしも、声をかけるのがたいへんじゃ。']]},
  {k:'aq4',w:0,t:'村レベルを、あと2上げよう',how:'せいれいが満足してパワーがたまると、村レベルが上がる',now:()=>S.lv,d:2,max:15,rw:60,
   L:[[GOD,'村が育つほど、せいれいたちも、のびのびくらせる。もっと、すみやすい村にしてみんか？']],X:[[GOD,'#joy|りっぱな村になったのう。ヌシ様も、きっとよろこんどるぞい。']]},
  {k:'aq5',w:0,t:'木材と石材を、合わせて200あつめよう',how:'せいれいが木を切り、石をほって、箱にためる',now:()=>((S.gotMat||{}).wood||0)+((S.gotMat||{}).stone||0),d:200,rw:40,
   L:[[GOD,'#think|……そうじゃ。いつか大きな物を作るとき、たくわえがあると心強いのう。']],X:[[GOD,'#nod|これだけあれば、なにを作るにもこまらんわい。']]},
  {k:'aqv1',w:1,t:'露天ぶろを2つにしよう',how:'「おく」で露天ぶろを建ててもらう',now:()=>cnt('onsen'),d:2,max:2,rw:50,
   L:[[GOD,'#joy|ヌシ様の熱がもどって、お湯がたっぷりわいとるのう。'],[GOD,'みんなで、ゆったりつかれるように、湯船をふやしてやらんか？']],X:[[GOD,'#joy|ほっほ、湯けむりが二つ。いいながめじゃわい。']]},
  {k:'aqv2',w:1,t:'行燈を5つともそう',how:'依頼ボードの「あかり」で行燈をはって、村に置く',now:()=>cnt('andon'),d:5,max:5,rw:40,
   L:[[GOD,'夜の湯けむりの村も、やさしいあかりがともったら、きっときれいじゃろうなあ。']],X:[[GOD,'#nod|うむ。あたたかい光じゃ。夜道も、こわくないのう。']]},
  {k:'aqv3',w:1,t:'竹と石材を、合わせて200あつめよう',how:'せいれいが竹を切り、石をほって、箱にためる',now:()=>((S.gotMat||{}).bamboo||0)+((S.gotMat||{}).stone||0),d:200,rw:40,
   L:[[GOD,'#think|……竹と石は、この土地のめぐみじゃ。たくわえておくと、心強いのう。']],X:[[GOD,'#nod|これだけあれば、なにを作るにもこまらんわい。']]},
  {k:'aqv4',w:1,t:'たけのこを、あと10こ、とろう',how:'竹のそばに生えた、たけのこを、せいれいにとってきてもらう',now:()=>(S.st2&&S.st2.tkGot)||0,d:10,rw:40,
   L:[[GOD,'#joy|この村のたけのこは、ほんにうまいのう。'],[GOD,'みんなのごはんに、もっととってきてくれんか？']],X:[[GOD,'#joy|ほっほ、たけのこごはんじゃ！ みんな、いい顔をしとるわい。']]}];
const aqGoal=q=>q.max!=null?Math.min(q.max,(S.aqB??q.now())+q.d):(S.aqB??q.now())+q.d;/* うけたときの数＋d（いちばん上があれば、そこまで） */
const aqTitle=q=>{if(q.k!=='aq3')return q.t;const b=S.aqOn===(S.aq||0)&&S.aqB!=null?S.aqB:q.now();return b>=30?'せいれいが30人そろった！':b===29?'せいれいを、あと1人ふやそう':b===28?'せいれいを、あと2人ふやそう':q.t};
const aqProg=q=>'いま '+Math.max(0,q.now()-(S.aqB??q.now()))+' / '+Math.max(0,aqGoal(q)-(S.aqB??q.now()));
const DAILYG=[/* クリア後の「きょうの目標」：毎朝2つ。b＝その朝からふえた数で数える。s＝いまの数で数える */
  {k:'pt',t:'パワーを40ためる',b:()=>S.totalPt||0,n:40,rw:15},{k:'wood',w:0,t:'木材を20あつめる',b:()=>(S.gotMat||{}).wood||0,n:20,rw:15},{k:'stone',t:'石材を15あつめる',b:()=>(S.gotMat||{}).stone||0,n:15,rw:15},{k:'bamboo',w:1,t:'竹を10あつめる',b:()=>(S.gotMat||{}).bamboo||0,n:10,rw:15},
  {k:'kill',t:'「コワイノ」を5体追いはらう',b:()=>S.kills||0,n:5,rw:20},{k:'cook',t:'料理を3つ作る',b:()=>S.cookN||0,n:3,rw:15},
  {k:'food',t:'箱に食べ物を30こ入れる',s:()=>S.food,n:30,rw:15},{k:'fun',t:'みんなのたのしさを70より上にする',s:()=>S.res.length&&S.res.every(r=>r.fun>70)?1:0,n:1,rw:15}];
function dailyNow(g,d){return g.b?g.b()-(d.b0[g.k]||0):g.s()}
const dailyHere=()=>DAILYG.filter(g=>g.w==null||g.w===WD);/* その土地の、きょうの目標 */
function dailySet(){const D=dailyHere(),day=dayNo(),i=(day*2)%D.length,L=[D[i],D[(i+1)%D.length]];S.daily={d:day,k:L.map(g=>g.k),b0:Object.fromEntries(L.filter(g=>g.b).map(g=>[g.k,g.b()])),done:{}}}/* 毎朝、きょうの目標を2つ出す */
function dailyCheck(){const d=S.daily;if(!d)return;for(const k of d.k){const g=DAILYG.find(x=>x.k===k);if(g&&!d.done[k]&&dailyNow(g,d)>=g.n){d.done[k]=1;S.pt+=g.rw;S.totalPt+=g.rw;toast('きょうの目標たっせい：'+g.t+'（パワー+'+g.rw+'）','good')}}}
function afterTick(){/* クリア後：新しいクエスト・きょうの目標・やりこみ（昼だけ。クリアした日のつぎの朝から） */if(isNight()||!$('#dialog').hidden||NEWRES!=null)return;if(WD===0&&S.flags.sacredReunion&&!S.flags.sacredQuietSeen)return;/* 草原：再会のあとの木陰の話を見てから */if(departTick())return;/* 草原：出発の場面を見おわってから */if(S.clearDay==null)S.clearDay=0;/* クリアした日をしまっていない古いセーブは、すぐ */if(dayNo()<=S.clearDay)return;if(!S.daily||S.daily.d!==dayNo())dailySet();dailyCheck();checkFree();
  const i=S.aq||0,q=AFTERQ[i];if(!q)return;if(q.w!=null&&q.w!==WD){S.aq=i+1;return}/* その土地のクエストではない */if(S.aqOn!==i){S.aqOn=-1;let once=0;dialog(q.L,()=>{if(once++)return;S.aqOn=i;S.aqB=q.now();sfx('quest');toast('クエスト：'+aqTitle(q),'good');renderQuest()});return}
  if(S.aqB==null)S.aqB=q.now();/* 前のセーブ：いまから数える */if(q.now()>=aqGoal(q)){let once=0;dialog(q.X,()=>{if(once++)return;S.aq=i+1;S.aqB=null;rewardPower(q.rw);memo('🎯',aqTitle(q));renderQuest()})}}
const TRAPS=['spike','sticky','puddle','firetrap','gust'],CN=a=>a.reduce((n,k)=>n+cnt(k),0),FOODN=()=>Object.values(S.fs||{}).reduce((n,v)=>n+v,0);
const outCnt=ids=>{const ins=new Set(HOUSES.flatMap(h=>[...h.inside]));let n=0;S.obj.forEach((o,j)=>{if(ids.has(o)&&!ins.has(j))n++});return n};/* 家の外にある数 */
function houseBedCount(){const cells=new Set(HOUSES.flatMap(h=>[...h.inside]));return [...cells].filter(j=>BEDSET.has(S.obj[j])).length}
function diningSeatCount(){return S.obj.reduce((n,o,j)=>n+(SEATS.includes(o)&&[-1,1,-W,W].some(d=>{const k=j+d;return k>=0&&k<W*H&&Math.abs(k%W-j%W)+Math.abs((k/W|0)-(j/W|0))===1&&TABLES.has(typeAt(k))})),0)}
const waitingBellflowers=()=>WD===0&&qAt('kikyo')&&cnt('bellf')>0&&bloomCount('bellf')<2&&!S.flags.minaCame;
const yoganUp=()=>Object.keys(S.hp).some(k=>k[0]==='L'&&S.hp[k]>=2&&S.obj[+k.slice(1)]==='yogan');/* ようがん台を強化した */
const houseFood=()=>HOUSES.some(h=>[...h.inside].some(j=>storageAt(j,'food')));/* 家の中に食べ物の箱がある */
const oreGot=()=>{const g=S.gotMat||{};return ['copper','iron','obsidian','silver','gold','sulfur','crystal'].reduce((n,k)=>n+(g[k]||0),0)};/* ほって箱に入れた鉱石の数 */
function andonYogan(){/* ようがん台から3マス以内の行燈 */let n=0;for(let j=0;j<W*H;j++){if(S.obj[j]!=='andon')continue;const x=j%W,y=(j/W)|0;let ok=false;for(let dy=-4;dy<=3&&!ok;dy++)for(let dx=-4;dx<=3;dx++){const k=(y+dy)*W+x+dx;if(x+dx>=0&&y+dy>=0&&x+dx<W&&y+dy<H&&S.obj[k]==='yogan'){ok=true;break}}if(ok)n++}return n}
const spotWith=(k,ids)=>(SPOTI||[]).some(I=>I.sp.k===k&&[I.j,...I.found.flat()].some(q=>ids.includes(S.obj[anc(q)])));/* そのスポットができていて、たのまれた物がその中に入っている */
const SUBQ=[/* サブクエスト：メインと別に、いつでもできるおねがい。at=出てくる条件 */
  {k:'seedwait_gate',w:0,g:'wood',t:'柵に出入り口をつくろう',how:'柵の途中を「こわす」で1マス戻し、依頼ボードの「道・囲い」で柵のドアをはる。できたら空いた場所に置く',L:[['K','ききょうがさくまで、もうすこしかかりそう。そのあいだに、村をひと回りしてこようっと。'],['K','#think|……あれ？ この柵、ぐるっと遠回りしないと、むこうに出られないや。'],['K','通るときだけ開くところがあったら、すぐ行き来できるのにな。']],X:[['K','ぱたん、って開いた！ こっちからも出られるね。'],['K','#joy|守り神さま、ありがとう！']],at:()=>waitingBellflowers(),ok:()=>cnt('gate')>=1,n:1,now:()=>cnt('gate'),rw:5},
  {k:'seedwait_food',w:0,g:'wood',t:'朝のごはんを10こ用意しよう',how:'フタバがベリーの茂みから実を集め、箱へ運ぶのを手伝おう。食べ物を10こ以上にする',L:[['K','なかまが来てくれたら……いっしょにごはん、食べたいな。'],['K','箱に、少し多めに入れておこうよ。ぼく、ベリーを集めてくる！']],X:[['K','これだけあれば、新しい子のぶんもあるね。'],['K','#joy|どんな子かなあ。……えへへ、たのしみ！']],at:()=>waitingBellflowers(),ok:()=>FOODN()>=10,n:10,now:()=>Math.min(10,FOODN()),rw:5},

  /* カミサマとの交換・おつげの出し方（もとはメインの目標）。いものたねをまいたあとに出る */
  {k:'trade',w:0,g:'wood',t:'カミサマと交換してみよう',how:"カミサマをタップし、何かと交換してから「交換をおわる」をタップ",who:GOD,L:[[GOD,'これから、いろいろ必要なものが出てくるじゃろ。'],[GOD,'困ったことがあったら、言うんじゃぞ。わしが力になってやろう。'],
    [GOD,'ほしい物があったら、わしに声をかけておくれ〜。']],get X(){return [[GOD,'まいど〜！ ほっほっ。'],...GOD_FAREWELL()]},at:()=>qDone('imoseed')&&!qDone('fire')&&!S.godGone&&godHere(),ok:()=>!!S.flags.tradedSeen,feat:['shop'],godLeave:1},
  {k:'oracle',w:0,g:'wood',t:'おつげを出してみよう',how:'メニューの「おつげ」で、きょういちにちの方針をえらぶ。わからないことは、メニューの「ひでんのしょ」で見られる',L:[[POKO,'ねえ、守り神さま。みんな、言われなくても自分で動いてくれるけど……'],
    [POKO,'「今日は、これをやってほしいな」って、お願いもできるんだよ。'],
    [MINA,'守り神さまのお願いなら、みんな、はりきるよぉ。'],
    [POKO,'やってみよう！ 守り神さま、きょうは、みんなに何をお願いする？']],X:[[POKO,'#surprise|わあ、みんなの動きが変わった！'],
    [POKO,'#joy|みんな、守り神さまのおねがいを聞いてくれたね！']],at:()=>qDone('imoseed'),ok:()=>!!S.flags.oracleSeen},
  {k:'lighttry',w:0,g:'wood',t:'守り神の光で木や岩をこわそう',how:'守りの光のボタンをおしてから、木か岩をタップ。何回かあてると、木材・石材が1こ落ちる。1回パワー1',L:[['K','#think|ねえ、守り神さま。木材や石材、もっとたくさんあったらいいのにね。'],['K','#surprise|……そうだ！ 守り神さまの光、木や岩にもあてられないかな？'],['K','#joy|光があたったら、木ぎれや石ころが、ころんって落ちてくるかも。そしたら、ぼくたちがひろって、箱にしまうよ！']],X:[['K','#surprise|ほんとに、ころんって落ちてきた！'],['K','#joy|ひろって、箱にしまっておくね。守り神さま、ありがとう！']],at:()=>(S.nights||0)>=1&&!isNight(),ok:()=>!!S.flags.lightBroke,rw:5},/* はじめての夜をこえたら、フタバが守りの光を木や岩にあててみてとたのむ */
  {k:'sortie',w:0,g:'wood',t:'みんなで村をまもろう',how:'6時から23時のあいだに、せいれいをタップして「出撃する」をえらぶ。夜、出撃したせいれいが、コワイノを1回たたく',L:[['K','#think|ねえ、守り神さま。夜になると、コワイノが来るよね。'],['K','ぼくの力は、つよくないけど……'],['K','#joy|そばに来たら、えいって、たたくくらいなら、できるかも。みんなで村をまもりたいな！']],X:[['K','#surprise|えいってしたら、コワイノがひるんだよ！'],['K','#joy|ちいさな力でも、みんなでやれば、村をまもれるね。ありがとう、守り神さま！']],at:()=>(S.nights||0)>=1&&!isNight()&&!!(S.subDone||{}).lighttry,ok:()=>!!S.flags.sortieHit,rw:5},/* はじめての夜のあと、フタバが、火のせいれいでない子もたたかう「出撃」をおしえる（受けたら S.flags.sortie） */
  {k:'compost',w:0,how:'神殿の依頼ボードをタップ →「庭」→「コンポスター」をはる。できたら「おく」で置く',g:'wood',L:[['K','むしった草、箱にずいぶんたまったね。'],['K','#think|この草、そのままにしておくのは、もったいない気がするんだ。'],['K','土にかえしてあげたら、畑の作物が、もっと元気に育つかも……。'],['K','守り神さま、草をためておける入れ物、思いつかないかな？'],['@idea']],X:[['K','これなら、草をためて、ふかふかの肥料にできるね！'],['K','#joy|肥料をまいた畑は、きっと、たくさん実るよ。ありがとう、守り神さま！']],t:'コンポスターを作ろう',at:()=>elemCount('wood')>=1&&GRASSK.reduce((a,k)=>a+(S.mat[k]||0),0)>=10,ok:()=>cnt('composter')>=1,n:1,now:()=>cnt('composter'),rw:10},
  {k:'benchbreak',w:0,g:'wood',t:'外にベンチを置こう',how:'依頼ボードの「庭」でベンチをはり、できたら外に置く',L:[['K','歩きまわってたら、足がくたくたになっちゃった。'],['K','外でも、ちょこんと座ってひと休みできたらいいな。'],['@idea']],X:[['K','ここなら、足をのばして休めるね。ふう……。'],['K','#joy|守り神さま、ありがとう！']],learn:['bench'],at:()=>qAt('lv2')||qAt('wall')&&!isNight()&&(hour()>=18||S.res.some(r=>r.name===POKO&&r.energy<50)),/* フタバのつかれがたまったら（げんき50より下）、おそくても夕方18時に出てくる（1日目は、ベッドの前に18時で時計が止まる） */ok:()=>outCnt(BENCHES)>=1,n:1,now:()=>outCnt(BENCHES),rw:5},
  {k:'salvia3',how:'「おく」→「サルビアの種」を置く。せいれいに植えてもらい、花が咲くのを待とう',g:'earth',L:[['K','火の力をためるなら、赤いサルビアがいいよぉ。'],['K','種、あげるねぇ。5本植えたら、きっとぽかぽかだよぉ。']],X:[['K','まっかなサルビアが5本も増えたねぇ。火の力、たまってきたよぉ。'],['K','#joy|サルビアを咲かせてくれて、ありがとうねぇ。火のなかまも、きっとよろこぶよぉ。']],w:0,t:'サルビアを5本植えよう',ln:'赤いサルビアは、火の力をためてくれるよぉ。種、あげるねぇ',at:()=>qAt('fire'),give:{salvia:5},base:()=>cnt('salvia'),ok:()=>bloomCount('salvia')-((S.subB||{}).salvia3||0)>=5,n:5,now:()=>Math.max(0,bloomCount('salvia')-((S.subB||{}).salvia3||0)),rw:10},
  /* lv_〇〇：村レベル待ち。建物は村レベルを案内する。家具（toy2・parasol）は、むかしのセーブの報告待ちのためだけに残す */
  {k:'lv_watch2',how:'せいれいがくらしていると、村レベルが上がる',w:0,g:'wood',L:[["K","お願いしたいことがあるんだけど、まだ村がちいさいみたい！"],["K","村がもっと育ったら、おねがいするね！"]],X:[["K","#joy|村、大きくなったね！ やったね、ありがとう！"]],t:'村レベルを2にしよう',at:()=>(qAt('fire'))&&(S.lv<2||(S.subSt||{}).lv_watch2>=2),ok:()=>S.lv>=2,n:2,rw:3,now:()=>S.lv},
 {k:'watch2',how:'「おく」→「見張り台」を置き、合計2つにしよう',g:'wood',L:[["K", "見張り台があると、遠くから来る「コワイノ」にも気づけるね！"], ["K", "でも、向こうのはしは、まだ守りがうすいんだ。あっちも守れたらいいなあ。"],['@idea']],X:[['K','見張り台が2つになった！ これで夜も、ちょっと安心だね！'],['K','#joy|向こうのはしも、これでちゃんと見わたせるね。'],['K','#joy|守り神さま、ありがとう！']],w:0,t:'見張り台を2つにしよう',ln:"向こうのはしも、安心して過ごせたらいいな",at:()=>(qAt('fire'))&&S.lv>=2,ok:()=>cnt('watch')>=2,n:2,now:()=>cnt('watch'),rw:15},
  {k:'sticky1',w:0,g:'wood',t:'どくの罠を2つ置こう',how:'依頼ボードの「ワナ」でどくの罠をはる。できたら「おく」で置く',learn:['sticky'],L:[['K','きのこ、とってきたよ。……あれ、このあかいきのこ、さわると手がぴりぴりする。'],['K','#think|これを「コワイノ」がふんだら、どうなるのかな。'],['K','しるを地面にしみこませておいたら、夜のあいだに、少しずつ弱らせられるかも……。'],['@idea']],X:[['K','#joy|とげの罠と、どくの罠。これで、もっと村を守れるね！']],at:()=>qDone('watch1')&&elemCount('wood')>=1&&!!(S.seenIt||{})['f:kinoko'],ok:()=>cnt('sticky')>=2,n:2,now:()=>Math.min(2,cnt('sticky')),rw:10},/* どくの罠：はじめてきのこを手に入れたあと */
  {k:'puddle1',w:0,g:'water',t:'すべる水たまりを2つ置こう',how:'依頼ボードの「ワナ」ですべる水たまりをはる。できたら「おく」で置く',learn:['puddle'],L:[['K','池のそばのぬれた石は、つるっとすべりますよね。'],['K','#think|「コワイノ」も、ふんだら、すべってころぶでしょうか。'],['K','村に、すべる水たまりを作っておけば、足止めできるかもしれません。'],['@idea']],X:[['K','#joy|これで「コワイノ」も、つるつるですね。']],at:()=>qDone('watch1')&&elemCount('water')>=1,ok:()=>cnt('puddle')>=2,n:2,now:()=>Math.min(2,cnt('puddle')),rw:10},/* すべる水たまり：水のせいれいが来たあと */
  {k:'arrow2',how:'依頼ボードの「ワナ」で、かなものの矢をはる',learn:['arrow2'],g:'fire',L:[['K','見張り台の矢、オオカゲには、ちょっと軽かったな。'],['K','つりで出てくる空き缶……あれをたたいて矢じりにしたら、かたい矢ができそうだ。'],['@idea']],X:[['K','#joy|いい矢だ！ これなら、オオカゲにだって、ずしっと効く。']],w:0,t:'かなものの矢を作ろう',ln:'もっとかたい矢があればな',at:()=>(S.bossKills||0)>=1&&elemCount('fire')>=1,ok:()=>(S.flags.a2made||0)>=10,n:10,now:()=>Math.min(10,S.flags.a2made||0),rw:15},
  {k:'watchup',how:'見張り台をタップして「強化する」をえらぶ。パワーと素材を使う',g:'wood',L:[['K','オオカゲって、どのくらい強いのかな……。'],['K','見張り台の矢が、もっと強くなったら、安心して眠れるのになあ。']],X:[['K','見張り台が、ぐっと強くなった！'],['K','#joy|これなら、オオカゲが来ても、きっとだいじょうぶ。守り神さま、ありがとう！']],w:0,t:'見張り台を強くしよう',ln:'見張り台の矢、もっと強くならないかな',at:()=>qAt('ookage')&&!watchUp(),ok:()=>watchUp(),n:1,now:()=>watchUp()?1:0,rw:15},
  {k:'stor2',how:'神殿の依頼ボードをタップ →「収納」→「たる」をはる。できたら「おく」で置く',g:'wood',w:0,L:[['K','なかまがふえてきたね！ ごはんをしまう場所も、もっとほしいな。'],['K','#think|……そうだ！ 木の板をまるくくんで、たるにしたら、たくさん入りそう！'],['@idea'],['K','#joy|守り神さま、たるを作って、置いてみたいな。']],X:[['K','たるができた！ 食べものがいっぱい入るね！'],['K','#joy|守り神さま、ありがとう！']],t:'たるを置こう',ln:'たるがあったら、ごはんがたくさん入るな',at:()=>qAt('baseUp'),ok:()=>cnt('taru')>=1,n:1,now:()=>cnt('taru'),rw:15},
  {k:'mbox2',how:'神殿の依頼ボードをタップ →「収納」→「まき棚」をはる。できたら「おく」で置く',g:'wood',w:0,L:[['K','木材が、ふえてきたね。箱に、入りきらなくなりそう。'],['K','#think|……そうだ！ 木でたなをくんだら、木材も枝も、たくさんつんでおけるかも！'],['@idea'],['K','#joy|守り神さま、まき棚を作って、置いてみたいな。']],X:[['K','まき棚ができた！ ぜんぶしまえて、すっきりだね！'],['K','#joy|守り神さま、ありがとう！']],t:'まき棚を置こう',ln:'まき棚があったら、木材がもっとしまえるな',at:()=>elemCount('water')>=1,ok:()=>cnt('makidana')>=1,n:1,now:()=>cnt('makidana'),rw:15},
  {k:'housefood',w:0,how:'神殿の依頼ボードをタップ →「収納」から、しまう家具をはる。できたら「おく」で家の中に置く',g:'earth',L:[['K','#alarm|夜、「コワイノ」からにげてるときにねぇ、おなかがすいて、外の箱まで走っちゃう子がいるんだよぉ。'],['K','家の中に、ごはんをしまう箱があったら、外に出なくても食べられるのにねぇ。']],X:[['K','これで、夜におなかがすいても、家の中で食べられるねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'家の中に、しまう家具を置こう',ln:'夜も、家の中でごはんが食べられたらいいねぇ',at:()=>HOUSES.length>0&&S.res.length>=3&&!houseFood(),ok:()=>houseFood(),n:1,now:()=>houseFood()?1:0,rw:15},
  {k:'oldhouse',w:1,how:'「おく」→「竹の壁」をえらんで、南西の古い家のこわれた壁に置く',g:'fire',L:[['K','南西の古い家、壁がくずれてるだろ？'],['K','あそこ、直してやりたいんだ。手を貸しておくれよ。']],X:[['K','#joy|よし、これで家になった！'],['K','ありがとよ、守り神。']],t:'古い家の壁を直そう',ln:'古い家を直せば、夜も安心なんだけどね',at:()=>!!S.enemyOn&&!HOUSES.length,ok:()=>HOUSES.length>0,n:1,now:()=>HOUSES.length?1:0,rw:10},
  {k:'yogan1',w:1,how:'「おく」→「ようがん台」を置く。せいれいが建てるのを待とう',g:'fire',L:[['K','ゆうべは、あぶなかったね。'],['K','#alarm|火山の石で「ようがん台」を作れば、火の玉で「コワイノ」を追いはらえるんだ。'],['K','石をあつめて、建ててみないかい？']],X:[['K','#joy|ようがん台ができた！ これで夜も、こっちから戦えるね。'],['K','ありがとよ、守り神。']],t:'ようがん台を置こう',ln:'ようがん台があれば、夜も戦えるんだけどね',learn:['yogan'],at:()=>(S.nights||0)>=1&&cnt('yogan')<1,/* ようがん台は、この会話でおぼえる */ok:()=>cnt('yogan')>=1,n:1,now:()=>cnt('yogan'),rw:15},
  {k:'bossfood',w:0,how:'せいれいが木の実や畑でとってきた食べ物が、箱にたまる',g:'earth',L:[['K','オオカゲが来る夜は、きっと長くなるよぉ。'],['K','おなかがすいても困らないように、食べ物をたっぷりためておこうねぇ。']],X:[['K','これだけあれば、長い夜でも安心だねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'食べ物を30こためよう',ln:'長い夜にそなえて、食べ物をためておきたいねぇ',at:()=>qAt('ookage'),ok:()=>FOODN()>=30,n:30,now:()=>FOODN(),rw:10},
  {k:'twbox0',w:0,how:'神殿の依頼ボードをタップ →「収納」から、しまう家具をはる',g:'earth',L:[['K','村の木と石を、ぜんぶしまっておけるかなぁ。'],['K','しまう箱を、もう少しふやしておこうねぇ。']],X:[['K','これで、集めた素材もぜんぶしまえるねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'しまえる数を150こにしよう',ln:'村の素材を、しまっておく場所がほしいねぇ',at:()=>false,ok:()=>boxCapTot()>=150,n:150,now:()=>boxCapTot(),rw:10},
  {k:'twwood0',w:0,how:'せいれいが木をきって、木材をあつめる',g:'wood',L:[['K','村が、ずいぶんにぎやかになったね！'],['K','木材が100こいるんだ。みんなで、いっぱいあつめよう！']],X:[['K','木材が100こたまった！ 村で、だいじに使おうね。'],['K','#joy|守り神さま、ありがとう！']],t:'木材を100こためよう',ln:'村で使う木材を、いっぱいあつめたいな',at:()=>false,/* 台座のときは、伐採場・採石場のおねがいを出す（前のセーブで受けたぶんだけ残す） */ok:()=>(S.mat.wood||0)>=100,n:100,now:()=>S.mat.wood||0,rw:10},
  {k:'twstone0',w:0,how:'せいれいが岩をほって、石材をあつめる',g:'earth',L:[['K','村で使う石材を、ためておきたいねぇ。'],['K','岩をほって、少しずつためていこうねぇ。']],X:[['K','石材が50こ、そろったねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'石材を50こためよう',ln:'村で使う石材を、ためておきたいねぇ',at:()=>false,ok:()=>(S.mat.stone||0)>=50,n:50,now:()=>S.mat.stone||0,rw:10},
  {k:'festdeco',w:0,how:'神殿の依頼ボードをタップ →「庭」→好きなかざりをはる。できたら「おく」で置く',g:'wood',L:[['K','ヌシ様をむかえる日まで、あと少しだね！'],['K','おまつりみたいに、村をかざりたいな！ かざりを、あと5つ置けないかな？']],X:[['K','村が、おまつりみたいになった！ ヌシ様、よろこんでくれるかな。'],['K','#joy|守り神さま、ありがとう！']],t:'おまつりのかざりをあと5つ置こう',ln:'ヌシ様をむかえる前に、村をかざりたいな',at:()=>!!S.finalDay&&!S.cleared,ok:()=>CN(DECOQ)-((S.subB||{}).festdeco||0)>=5,n:5,now:()=>Math.max(0,CN(DECOQ)-((S.subB||{}).festdeco||0)),base:()=>CN(DECOQ),rw:20},
  {k:'festlight',w:0,how:'神殿の依頼ボードをタップ →「あかり」→好きなあかりをはる。できたら「おく」で置く',g:'fire',L:[['K','ヌシ様が来る道、明るくしておきたいね。'],['K','#nod|あかりを、あと5つふやそうじゃないか。']],X:[['K','よし、村じゅうが明るくなった！ これならヌシ様も、まよわないね。'],['K','ありがとよ、守り神。']],t:'あかりをあと5つ置こう',ln:'ヌシ様が来る道を、明るくしておきたいね',at:()=>!!S.finalDay&&!S.cleared,ok:()=>CN(LIGHTQ)-((S.subB||{}).festlight||0)>=5,n:5,now:()=>Math.max(0,CN(LIGHTQ)-((S.subB||{}).festlight||0)),base:()=>CN(LIGHTQ),rw:20},
  {k:'benchwood',w:1,how:'神殿の依頼ボードをタップ →「庭」→「竹のベンチ」をはる。できたら「おく」で置く。木の力がたまった次の朝、神殿の「！」で木のせいれいを呼べる',g:'water',L:[['K','この村には、まだ木のせいれいがいませんね。花を植えるのは、木のせいれいの役目なのです。'],['K','#think|竹は、木のせいれいとも、なかよしだそうですよ。竹のベンチがあれば、木の力も、少しずつたまっていくはずです。']],X:[['K','竹のベンチ、ひんやりして、すわりごこちがいいですね。'],['K','#joy|木の力も、たまりました。守り神さま、ありがとうございます。']],t:'竹のベンチを置いて、木の力をためよう',ln:'木のせいれいに来てもらえたら、花が植えられるのですが',at:()=>qAt('ashiyu')&&!!(S.recipes||{}).takebench&&elemCount('wood')<1&&(ATTR.wood||0)<needFor('wood'),ok:()=>cnt('takebench')>=1&&(elemCount('wood')>=1||(ATTR.wood||0)>=needFor('wood')),get n(){return S?needFor('wood'):1},now:()=>cnt('takebench')>=1?Math.floor(ATTR.wood||0):0,rw:10},
  {k:'twmat1',w:1,how:'せいれいが木をきったり、竹を切ったりしてあつめる',g:'fire',L:[['K','台座を建てるなら、まわりもしっかりこしらえたいね。'],['K','#think|木材と、火山のふもとの竹を、たっぷりためておこうじゃないか。']],X:[['K','木材も竹も、そろったね！'],['K','ありがとよ、守り神。']],t:'木材150・竹50をためよう',ln:'木材と竹を、ためておきたいね',at:()=>qAt('tower')&&((S.mat.wood||0)<150||(S.mat.bamboo||0)<50),ok:()=>(S.mat.wood||0)>=150&&(S.mat.bamboo||0)>=50,n:200,now:()=>Math.min(150,S.mat.wood||0)+Math.min(50,S.mat.bamboo||0),rw:15},
  /* 火山だけのサブクエスト（竹・ようがん台・石の塀・鉱脈など、火山の物を使う） */
  {k:'shishi1',w:1,how:'神殿の依頼ボードをタップ →「庭」→「ししおどし」をはる。できたら「おく」で置く',g:'water',L:[['K','竹のつつに水がたまって、ことん、と石をたたく音……。'],['K','#think|あの音を聞くと、こころが、しずかになるのです。村にも、ひとつほしいですね。']],X:[['K','#joy|ことん……。いい音です。'],['K','ありがとうございます、守り神さま。']],t:'ししおどしを置こう',ln:'ことん、という音が聞きたいですね',at:()=>!!(S.recipes||{}).shishiodoshi&&elemCount('water')>=1,ok:()=>cnt('shishiodoshi')>=1,n:1,now:()=>cnt('shishiodoshi'),rw:15},
  {k:'takeakari1',w:1,how:'神殿の依頼ボードをタップ →「あかり」→「竹あかり」をはる。できたら「おく」で竹のそばに置いて、竹やぶの小道を作る。条件：竹あかり・竹×3',g:'fire',L:[['K','竹のつつに穴をあけてさ、中に火をともすと、もようの光が地面にうつるんだ。'],['K','#joy|竹やぶの中の道に置いたら、夜の竹やぶが、ちょっとたのしくなりそうだろ？']],X:[['K','#joy|ほら、竹のあいだで、光のもようが、ゆらゆらしてる！'],['K','ありがとよ、守り神。']],t:'竹あかりで「竹やぶの小道」を作ろう',ln:'竹のあかりで、夜をたのしくしたいね',at:()=>!!(S.recipes||{}).takeakari&&(S.nights||0)>=1,ok:()=>spotWith('takeyabu',['takeakari']),n:1,now:()=>spotWith('takeyabu',['takeakari'])?1:0,rw:15},
  {k:'andonyogan',w:1,how:'神殿の依頼ボードをタップ →「あかり」→「行燈」をはる。できたら「おく」で、ようがん台のそばに置く',g:'fire',L:[['K','ようがん台のまわり、夜になると、足もとがまっくらでさ。'],['K','#think|やわらかいあかりがあれば、夜の見はりも、ずっと楽になるよ。']],X:[['K','#joy|やさしいあかりだね。これなら、夜も安心さ。'],['K','ありがとよ、守り神。']],t:'ようがん台のそばに行燈をともそう',ln:'ようがん台のまわりを、明るくしたいね',at:()=>!!(S.recipes||{}).andon&&cnt('yogan')>=1,ok:()=>andonYogan()>=1,n:1,now:()=>andonYogan(),rw:15},
  {k:'wall10',w:1,how:'神殿の依頼ボードをタップ →「道・囲い」→「石の塀」をはる。できたら「おく」で置く',g:'fire',L:[['K','#think|火山のふもとは、石がいっぱいあるだろ。'],['K','石をつんだ、じょうぶな塀で、村をぐるっとかこんでおきたいね。']],X:[['K','#joy|どっしりした塀だ！ これなら、夜も心強いよ。'],['K','ありがとよ、守り神。']],t:'石の塀で村をかこもう',ln:'じょうぶな石の塀がほしいね',at:()=>lvOK('wall')&&cnt('wall')<10,ok:()=>cnt('wall')>=10,n:10,now:()=>cnt('wall'),rw:15},
  {k:'ore10',w:1,how:'せいれいが、鉱脈の岩をほって、箱にためる',g:'water',L:[['K','火山のふもとの岩には、色のちがう石がまじっているのです。'],['K','#think|ほり出してみたら、なにかの役に立つかもしれませんね。']],X:[['K','#joy|きらきらした鉱石が、こんなに……！'],['K','ありがとうございます、守り神さま。']],t:'鉱脈から鉱石を10こほろう',ln:'鉱脈の石を、ほり出してみたいですね',at:()=>S.obj.some(o=>VEINS[o])&&(S.nights||0)>=2,base:()=>oreGot(),ok:()=>oreGot()-((S.subB||{}).ore10||0)>=10,n:10,now:()=>Math.max(0,oreGot()-((S.subB||{}).ore10||0)),rw:15},
  {k:'smelter1',w:1,how:'「おく」→「炉」を建ててもらう。できたら炉をタップして、延べ棒にする鉱石をえらぶ',learn:['smelter'],g:'fire',L:[['K','#think|ほり出した鉱石、そのままじゃ、まじりものだらけだね。'],['K','火でとかして、まじりものをとりのぞけば、じょうぶな延べ棒になるんだ。'],['K','#joy|石をつんで、炉をこしらえようじゃないか。']],X:[['K','#joy|炉に火が入ったね！'],['K','これで、鉱石から、じょうぶな延べ棒が作れるよ。']],t:'炉を建てよう',ln:'鉱石を、とかしてみたいね',at:()=>oreGot()>=1,ok:()=>cnt('smelter')>=1,n:1,now:()=>cnt('smelter'),rw:15},
  {k:'chair2',w:0,how:'神殿の依頼ボードをタップ →「家具」→いすをはる。できたら「おく」で食卓のそばに置いて、しょくたくを作る。条件：食卓・いす×2',g:'wood',L:[["K", "#joy|食べ物に土がつかなくなったの、うれしいな！ でも、立ったまま食べてると足がつかれちゃう。"], ["K", "ごはんを食べるとき、ぼくも座れたらいいなあ。"],['@idea']],X:[["K", "#surprise|わあ、これなら座って食べられるね！"], ["K", "足もらくちん。ゆっくり食べようっと。"], ['K','#joy|みんなで食べる場所ができたね！ ありがとう！']],t:'いすで「しょくたく」を作ろう',ln:"ごはんを食べるとき、ぼくも座れたらいいな",at:()=>cnt('table')>=1,ok:()=>spotWith('dining',SEATS),n:1,now:()=>spotWith('dining',SEATS)?1:0,rw:10},
  {k:'bed3',how:'神殿の依頼ボードをタップ →「家具」→「ベッド」をはる。できたら「おく」で家の中に置く',g:'earth',L:[["K", "なかまが3人になって、にぎやかだねぇ。"], ["K", "#think|……でもねぇ、まだ地面で寝ている子がいるんだよぉ。朝、背中が冷たそうでねぇ。"], ["K", "守り神さま、みんながあったかく眠れるように、してあげられないかなぁ。"],['@idea']],X:[["K", "ふかふかが、みんなの分あるねぇ。これなら、冷たくないよぉ。"], ['K','#joy|ベッドをそろえてくれて、ありがとうねぇ。みんな、ぐっすり眠れるよぉ。']],w:0,t:'ベッドを3つにしよう',ln:"地面で寝ている子が、あったかく眠れたらいいねぇ",at:()=>S.res.length>=3&&houseBedCount()<3,learn:['bed'],ok:()=>houseBedCount()>=3,n:3,now:()=>houseBedCount(),rw:15},
  {k:'light3',w:0,how:'神殿の依頼ボードをタップ →「あかり」→好きなあかりをはる。できたら「おく」で置く',g:'fire',L:[["K", "夜の村、まっくらじゃないか。足もとが見えなくて、落ち着かないよ。"], ['K',{h:'守り神、あたいの火、もっと遠くまで届けられないかい？',a:'守り神、あたしの火、もっと遠くまで届けられないかい？'}],['@idea']],X:[['K','よし、明るくなった！ これで夜も、ちっとはマシだね。'],['K','灯りを置いてくれて、ありがとよ。これで夜の見張りが、ずっとラクになるよ。']],t:'あかりを3つ置こう',ln:'夜の村、もうちょっと明るいといいね',at:()=>elemCount('fire')>=1,ok:()=>CN(LIGHTQ)>=3,n:3,now:()=>CN(LIGHTQ),rw:15},
  {k:'houselight',how:'神殿の依頼ボードをタップ →「あかり」→あかりをはる。できたら「おく」で家の中に置く',g:'fire',L:[["K", "なあ守り神、外が明るくなったら、今度は家の中が暗く感じるね。"], ["K", "夜に、だれかがつまずいたら、かわいそうだろ。"], ["K", "中でも足もとが見えるように、できないかな。"],['@idea']],X:[['K','おっ、あったかい灯りだね。……これで夜も、安心して眠れるよ。'],['K','家ん中に灯りをつけてくれて、ありがとよ。もう夜でも、つまずかないね。']],w:0,t:'家の中にあかりを置こう',ln:'家の中も、もう少し明るくしてやりたいね',at:()=>!!(S.subDone||{}).light3&&HOUSES.length>=1,ok:()=>HOUSES.some(h=>[...h.inside].some(j=>LIGHTQ.includes(S.obj[j]))),n:1,now:()=>Math.min(1,HOUSES.reduce((n,h)=>n+[...h.inside].filter(j=>LIGHTQ.includes(S.obj[j])).length,0)),rw:15},
  {k:'boost1',how:'画面の下の「せいれい」をタップ → 強化したいせいれいをえらぶ → 上の「強化」タブをタップ → 「パワーをそそぐ」をタップ。パワーを使って、ランダムな能力が1つ上がる',g:'earth',L:[['K','ねえ守り神さま、せいれいはね、守り神さまの力をもらうと、ちょっとだけ強くなれるんだよぉ。'],['K','だれか1人でいいから、力をわけてあげてねぇ。']],X:[['K','#surprise|わぁ、元気になったみたいだねぇ。'],['K','これからも、ときどき力をわけてあげてねぇ。'],['K','#joy|力をわけてくれて、ありがとうねぇ。なかまが元気だと、ぼくもうれしいよぉ。']],w:0,t:'せいれいにパワーをそそごう',ln:'せいれいに、守り神さまの力をわけてほしいなぁ',at:()=>S.res.some(r=>r.elem==='fire'&&r.name===keyName('fire')),ok:()=>S.res.some(r=>(r.boost||0)>=1),n:1,now:()=>S.res.some(r=>(r.boost||0)>=1)?1:0,rw:10},
  {k:'board',how:'神殿の依頼ボードをタップ →「クエスト」→「依頼ボード」をはる。せいれいが作るのを待とう',g:'earth',L:[["K", "お願いの板、紙が重なって、下の絵が見えないねぇ……。"], ["K", "もっとたくさん、見えるようにできないかなぁ。"], ["K", "#think|守り神さまが形を考えてくれたら、ぼくも手伝うよぉ。"],['@idea']],X:[['K','板をつぎたしたよぉ。これで、もっとたくさん貼れるねぇ。'],['K','#joy|お願いの板を広げてくれて、ありがとうねぇ。これで、たくさんお願いできるよぉ。']],w:0,t:'依頼ボードを広げよう',ln:"紙が重なって、下の絵が見えないねぇ",at:()=>elemCount('fire')>=1,ok:()=>!!S.flags.board5,rw:3},
  {k:'lotus3',how:'「おく」→「ハスの種」を池の上に置く。せいれいに植えてもらい、花が咲くのを待とう',g:'earth',L:[['K','水の力をためるなら、池にハスを咲かせるといいよぉ。'],['K','ハスの種、少しあげるねぇ。']],X:[['K','#joy|ハスが咲いたねぇ。池が、うれしそうだよぉ。'],['K','#joy|ハスを咲かせてくれて、ありがとうねぇ。池が、きれいになったよぉ。']],w:0,t:'ハスを5つ咲かせよう',ln:'池にハスを咲かせたら、水の力がたまるよぉ。種、あげるねぇ',at:()=>qAt('water'),give:{lotus:5},ok:()=>bloomCount('lotus')>=5,n:5,now:()=>bloomCount('lotus'),rw:10},
  {k:'lily5',how:'「おく」→「ゆりの種」を置く。せいれいに植えてもらい、花が咲くのを待とう',g:'earth',L:[['K','風の力をためるなら、ゆりがいいねぇ。'],['K','ゆりの種、あげるよぉ。5つ咲いたら、いい風がふくかもねぇ。']],X:[['K','ゆりの香りが、風にのってるねぇ。'],['K','#joy|ゆりを咲かせてくれて、ありがとうねぇ。いい香りで、ほっとするよぉ。']],w:0,t:'ゆりを5つ咲かせよう',ln:'ゆりを咲かせれば、風の力がたまるはずだねぇ。種、あげるよぉ',at:()=>qAt('wind'),give:{lily:5},ok:()=>bloomCount('lily')>=5,n:5,now:()=>bloomCount('lily'),rw:10},
  {k:'swing1',how:'神殿の依頼ボードをタップ →「遊び」→ブランコをはる。できたら「おく」で外に置く',g:'wood',L:[['K','ねえ、ブランコができたら、いちばんにのってみたいな！'],['K','風を受けて揺れるから、風の力もたまるんだって！'],['@idea']],X:[['K','#joy|ブランコ、できた！ 風がきもちいいね！'],['K','#joy|守り神さま、ありがとう！']],w:0,t:'ブランコを置こう',ln:'ブランコをつくったら、風の力がたまるんだって！',at:()=>qAt('wind'),learn:['swing'],ok:()=>CN(['swing'])>=1,n:1,now:()=>CN(['swing']),rw:10},
  {k:'lumber1',how:'「おく」→「伐採場」を置く。ここで働くと木材がふえる',g:'wood',L:[['K','木材、ちょっとずつ足りなくなってきたね。'],['K','#cry|木を切るたびに、森がさみしくなっちゃう……。木を切らなくても、木材がもらえる場所があったらいいのにな。'],['@idea']],X:[['K','#joy|伐採場ができた！ ここで働けば、木をへらさずに木材がもらえるんだね。'],['K','#joy|守り神さま、ありがとう！']],learn:['lumber'],w:0,t:'伐採場を建てよう',ln:'木を切らなくても、木材がふえたらいいな',at:()=>S.lv>=5,ok:()=>cnt('lumber')>=1,n:1,now:()=>cnt('lumber'),rw:10},
  {k:'quarry1',how:'「おく」→「採石場」を置く。ここで働くと石材がふえる',g:'earth',L:[['K','石も、だいぶ使っちゃったねぇ。'],['K','岩をくだくのも大変だよぉ。石をもらえる場所を、つくれないかなぁ。'],['@idea']],X:[['K','採石場ができたねぇ。ここなら、岩をへらさずに石がもらえるよぉ。'],['K','#joy|守り神さま、ありがとうねぇ。']],learn:['quarry'],w:0,t:'採石場を建てよう',ln:'石も、もっと楽に集めたいなぁ',at:()=>S.lv>=6||qAt('tower'),ok:()=>cnt('quarry')>=1,n:1,now:()=>cnt('quarry'),rw:10},
  {k:'stele1',how:'「おく」→「ノームの石像」を置く。まわりの壁がじょうぶになる',g:'earth',L:[['K','#danger|「コワイノ」に壁をたたかれると、いつもひやひやするよぉ。'],['K','壁を、もっとじょうぶにできる物があったら安心だねぇ。'],['@idea']],X:[['K','ノームさんの石像が立ったねぇ。まわりの壁が、前よりしっかりしてるよぉ。'],['K','#joy|守り神さま、ありがとうねぇ。']],learn:['stele'],w:0,t:'ノームの石像を建てよう',ln:'壁をもっとじょうぶにしたいなぁ',at:()=>S.lv>=6&&elemCount('earth')>=1,ok:()=>cnt('stele')>=1,n:1,now:()=>cnt('stele'),rw:12},
  {k:'fountain1',how:'「おく」→「噴水」を置く',g:'water',L:[['K','みんなが遊べる場所が、もっとほしいですね。'],['K','水が空に向かってふき出す、広場の真ん中のような……そんな場所は、どうでしょう。'],['@idea']],X:[['K','噴水ができました。水がきらきらして、きれいですね。'],['K','#joy|守り神さま、ありがとうございます。']],learn:['fountain'],w:0,t:'噴水を建てよう',ln:'みんなで遊べる広場がほしいです',at:()=>S.lv>=6&&elemCount('water')>=1,ok:()=>cnt('fountain')>=1,n:1,now:()=>cnt('fountain'),rw:12},
  {k:'lighthouse1',how:'「おく」→「灯台」を置く。遠くまで照らす',g:'fire',L:[['K','夜の見回り、まだ暗いところがあって不安なんだ。'],['K','もっと遠くまで照らせる、でっかい灯りがあれば、いいんだけどね。'],['@idea']],X:[['K','おお、灯台だ！ これなら遠くまでよく見える。'],['K','ありがとよ、守り神。']],learn:['lighthouse'],w:0,t:'灯台を建てよう',ln:'もっと遠くまで照らせたらいいな',at:()=>S.lv>=7&&elemCount('fire')>=1,ok:()=>cnt('lighthouse')>=1,n:1,now:()=>cnt('lighthouse'),rw:12},
  {k:'clover3',how:'「おく」→「シロツメクサの種」を置く。せいれいに植えてもらい、花が咲くのを待とう',g:'wood',L:[['K','ねえ見て、シロツメクサの種を見つけたよ！'],['K','木の力がたまるんだって。5つ咲かせてみよう！']],X:[['K','シロツメクサ、かわいい！ 四つ葉、さがしてみようっと！'],['K','#joy|シロツメクサを咲かせてくれて、ありがとう！ こんど、花かんむり作ってあげるね！']],w:0,t:'シロツメクサを5つ咲かせよう',ln:'シロツメクサの種、見つけたよ！ 木の力がたまるんだって！',at:()=>qAt('wood6'),give:{clover:5},ok:()=>bloomCount('clover')>=5,n:5,now:()=>bloomCount('clover'),rw:10},
  {k:'lv_toy2',w:0,how:'せいれいがくらしていると、村レベルが上がる',g:'fire',L:[["K","たのみたいモンがあるんだけどさ、この村にはまだ早いみたいだよ。"],["K","村がもっと育ったら、また話すよ。"]],X:[["K","村、でっかくなったね。やるねえ！"]],t:'村レベルを2にしよう',at:()=>(S.res.some(r=>r.elem==='fire'&&r.name===keyName('fire')))&&((S.subSt||{}).lv_toy2===3),ok:()=>S.lv>=2,n:2,rw:3,now:()=>S.lv},
 {k:'toy2',w:0,how:'神殿の依頼ボードをタップ →「遊び」→砂場をはる。できたら「おく」で置く',g:'fire',L:[["K", "なあ、守り神。ここ、走りまわれる場所はあるけど、ちょっと物足りなくないか？"], ["K", "砂の山をつくったり、穴をほったり……そういう遊び場があったら、みんな喜ぶと思うんだ。"], ["K", "守り神、どんな形を思い浮かべる？"],['@idea']],X:[['K','おお、砂場だ！ さっそく山をつくろうじゃないか！'],['K','砂場を置いてくれて、ありがとよ。みんなで山をつくって遊ぶよ！']],t:'砂場を置こう',ln:'みんなで遊べる場所がほしいな！',at:()=>S.res.some(r=>r.elem==='fire'&&r.name===keyName('fire')),learn:['sandbox'],ok:()=>CN(['sandbox'])>=1,n:1,now:()=>CN(['sandbox']),rw:15},
  {k:'toy3',w:4,how:'神殿の依頼ボードをタップ →「遊び」→シーソーをはる。できたら「おく」で置く',g:'wind',L:[["K", "フッ……風は、ゆれるものに宿るのだよ。"], ["K", "板の両はしに乗って、ギッコン、バッタン……そんな遊び道具があれば、きっと風も楽しい。"], ["K", "守り神、きみなら、どんな形を思い浮かべる？"],['@idea']],X:[['K','見たまえ、風がシーソーを動かしている。…美しいね。'],['K','#joy|…ありがとう、守り神。']],t:'シーソーを置こう',ln:'ギッコン、バッタン、遊びたいな！',at:()=>elemCount('wind')>=1,learn:['seesaw'],ok:()=>CN(['seesaw'])>=1,n:1,now:()=>CN(['seesaw']),rw:15},
  {k:'deco3',w:0,how:'神殿の依頼ボードをタップ →「庭」→好きなかざりをはる。できたら「おく」で置く',g:'wood',L:[["K", "ねえ、村をもっとかわいくしたいな！"], ["K", "#joy|花とか、小鳥とか、好きなものを見ながら歩けたら、うれしいなあ。"], ["K", "守り神さま、どんなふうになるかな？"],['@idea']],X:[['K','#joy|村をかざってくれて、ありがとう！ どこを見ても、かわいくて、うれしくなっちゃう！']],t:'かざりを3つ置こう',ln:"花や小鳥をながめながら歩けたらいいな",at:()=>S.lv>=2,ok:()=>CN(DECOQ)>=3,n:3,now:()=>CN(DECOQ),rw:15},
  {k:'tree5',w:0,how:'「おく」→「木の苗」を置く。せいれいが植えるのを待とう',g:'wood',L:[['K','おひるねするとき、木かげがあったらいいなあ。'],['K','木を5本植えたら、すずしい木かげができるよね！']],X:[['K','木かげ、すずしい〜。ここでおひるねしようっと！'],['K','#joy|木を植えてくれて、ありがとう！ 大きくなったら、いっしょにおひるねしようね！']],t:'木を5本植えよう',ln:'木かげで、おひるねしたいな',at:()=>S.lv>=3&&elemCount('earth')>=1,/* 土のせいれいが来てから */ok:()=>bloomCount('tree')+bloomCount('fruit')>=5,n:5,now:()=>bloomCount('tree')+bloomCount('fruit'),rw:15},
  {k:'farm10',how:'「おく」→「畑」を置く',g:'earth',L:[['K','なかまがふえて、ごはんもたくさんいるねぇ。'],['K','畑が10こあったら、ごはんにこまらないよぉ。']],X:[['K','畑がいっぱいだねぇ。耕すの、がんばるよぉ。'],['K','#joy|畑をふやしてくれて、ありがとうねぇ。収穫の日が、いまから楽しみだよぉ。']],w:0,t:'畑を10にしよう',ln:'畑がもっとあると、ごはんにこまらないねぇ',at:()=>cnt('farm')>=6,ok:()=>cnt('farm')>=10,n:10,now:()=>cnt('farm'),rw:15},
  {k:'food40',w:0,how:'畑で作物を育てて収穫してもらう',g:'wood',L:[['K','ねえ、箱って、どのくらい入るのかな？'],['K','40こくらい、ためてみたい！ そしたら、なにがあってもへっちゃらだよ！']],X:[['K','箱がいっぱい！ 見てるだけで、おなかいっぱいになりそう！'],['K','#joy|食べ物をいっぱいためてくれて、ありがとう！ これで、おなかがすいても安心だね！']],t:'食べ物を40こためよう',ln:'箱をいっぱいにしたいな！',at:()=>foodCap()>0&&S.res.length>=3,ok:()=>FOODN()>=40,n:40,now:()=>FOODN(),rw:15},
  {k:'house2',how:'家の壁で囲って、ドアをつけると家になる',g:'earth',L:[['K','なかまがふえて、家がちょっときゅうくつだねぇ…。'],['K','もう1けん、家があるといいなぁ。']],X:[['K','新しい家だぁ。のびのび眠れるねぇ。'],['K','ものをしまえる場所や、お湯につかってゆっくりできる場所もあったらいいねぇ。'],['K','#joy|新しい家を建ててくれて、ありがとうねぇ。みんな、ゆっくり休めるよぉ。']],t:'家を2けんにしよう',ln:'なかまがふえて、家がきゅうくつだねぇ',w:0,at:()=>qAt('baseUp')&&S.res.length>=4&&elemCount('fire')>=1,ok:()=>HOUSES.length>=2,n:2,now:()=>HOUSES.length,rw:20},
  {k:'room',w:0,how:'神殿の依頼ボードをタップ →「家具」から、好きな家具やかざりをはる。できたら「おく」で家の中に置く。ちがう種類を5つ',g:'wind',L:[["K", "家の中が、どうにも味気ないね。"], ["K", "本棚でも、ラグでも、ぼくの好きなもので、おへやをかざれたら……。"], ["K", "#think|守り神、きみの考える形を、見せてくれないか。"],['@idea']],X:[['K','#nod|うん、悪くない。ぼくにふさわしい、品のあるおへやだ。'],['K','部屋を整えてくれて、感謝するよ。ここなら、気持ちよく過ごせそうだ。']],t:'家の中に家具やかざりを5種類置こう',ln:'家の中を、すてきにかざりたいな',at:()=>HOUSES.length>=1&&S.lv>=3,ok:()=>inHouseFurn()>=5,n:5,now:()=>inHouseFurn(),rw:15},
  {k:'paint',w:0,how:'神殿の依頼ボードをタップ →「家具」→絵をはる。できたら「おく」で家の壁にかける',g:'water',L:[["K", "#cry|家の壁を見ていると、少しさみしく感じます。"], ["K", "きれいな景色を、ここに残しておけたら……。季節が変わっても、見られるように。"], ["K", "守り神さま、そんなことはできるでしょうか。"],['@idea']],X:[["K", "壁に、景色が……！ こんなふうに残せるのですね。"], ["K", "#think|見ていると、考えごとがはかどります。"], ['K','#joy|絵をかざってくださって、ありがとうございます。壁が、ぐっと明るくなりました。']],t:'壁に絵をかざろう',ln:"きれいな景色を、壁に残しておけたら……",at:()=>S.lv>=7,ok:()=>Object.values(S.win||{}).some(v=>v==='paint1'||v==='paint2'||v==='paint3'),rw:15},
  {k:'trap4',w:0,how:'神殿の依頼ボードをタップ →「ワナ」→好きな罠をはる。できたら「おく」で「コワイノ」が通りそうな所に置く',g:'fire',L:[["K", "#danger|守ってばっかりじゃ、つまらないね。"], ["K", "#danger|近づいてくる「コワイノ」を、途中でびっくりさせてやりたいよ。"], ["K", "守り神、もう少し手を打てないかい？"],['@idea']],X:[['K','いいねえ、罠だらけだ！ 来るなら来いってんだ！'],['K','#alarm|罠をふやしてくれて、ありがとよ。これで「コワイノ」も、手出しできないね。']],t:'罠をあと4つ置こう',at:()=>elemCount('fire')>=1&&S.enemyOn&&(WD===1||(S.bossKills||0)>=1||qAt('ookage')),ok:()=>CN(TRAPS)-((S.subB||{}).trap4||0)>=4,n:4,now:()=>Math.max(0,CN(TRAPS)-((S.subB||{}).trap4||0)),base:()=>CN(TRAPS),rw:15},
  {k:'fish5',w:0,how:'池や水べがあると、せいれいがつりをする。池のそばにいすを置くと「つり場」になり、つりに行きやすくなる',g:'water',L:[["K", "池のさかな、何びきいるか、数えてみたいんです。"], ["K", "守り神さま、せいれいたちに、さかなをつってもらえませんか？ まずは5ひき。記録しておきますから。"], ["K", "#joy|水べでじっと待つのは、少し足がつかれますね。ゆっくり待てる場所も、あればうれしいのですが。"]],X:[['K','5ひき、たしかに。…記録によると、まだまだいそうですね。'],['K','#joy|せいれいたちがつってくれたおかげで、いい観察になりました。ありがとうございます。']],t:'せいれいたちにさかなを5ひきつってもらおう',at:()=>elemCount('water')>=1,ok:()=>(S.fishN||0)-((S.subB||{}).fish5||0)>=5,n:5,now:()=>Math.max(0,(S.fishN||0)-((S.subB||{}).fish5||0)),base:()=>S.fishN||0,rw:15},
  {k:'lv_parasol',w:0,how:'せいれいがくらしていると、村レベルが上がる',g:'wind',L:[["K","フッ…頼みたいものがあるんだが、この村にはまだ早いらしい。"],["K","村がもっと育ったら、また声をかけるよ。"]],X:[["K","#joy|村も育ったな。悪くない。ありがとう。"]],t:'村レベルを5にしよう',at:()=>(elemCount('wind')>=1)&&((S.subSt||{}).lv_parasol===3),ok:()=>S.lv>=5,n:5,rw:7,now:()=>S.lv},
 {k:'parasol',w:0,how:'神殿の依頼ボードをタップ →「庭」→「パラソル」をはる。できたら「おく」でベンチのそばに置いて、やすみばを作る。条件：ベンチ・パラソル',g:'wind',L:[["K", "フッ……日なたは好きだが、ずっといると、さすがに暑いね。"], ["K", "風を感じながら、日かげのベンチでひと休みできたら、優雅に過ごせそうだ。"], ["K", "守り神、きみに任せてみてもいいかな。"],['@idea']],X:[['K','いい日かげのやすみばだ。ここでお茶でもいかがかな？'],['K','#joy|ありがとう。おかげで、優雅な午後が過ごせそうだ。']],t:'パラソルで「やすみば」を作ろう',at:()=>elemCount('wind')>=1,ok:()=>spotWith('yasumi',['parasol']),n:1,now:()=>spotWith('yasumi',['parasol'])?1:0,rw:15},
  {k:'fence20',how:'神殿の依頼ボードをタップ →「道・囲い」→「柵」をはる。できたら「おく」で置く',g:'fire',w:0,L:[['K','村が大きくなったぶん、守る場所もふえたね。'],['K','まわりは、まだがら空きじゃないか。'],['K','#alarm|柵をずらっと並べて、「コワイノ」の足を止めてやろうじゃないか。']],X:[['K','いいじゃないか、これならそう簡単には入ってこれないよ！'],['K','ありがとよ、守り神。']],t:'柵を20こ並べよう',ln:'村のまわりが、がら空きだね',at:()=>qAt('baseUp')&&S.enemyOn,ok:()=>CN(['fence','misugaki','logfence','bamboofence'])>=20,n:20,now:()=>CN(['fence','misugaki','logfence','bamboofence']),rw:20},
  {k:'house3',how:'家の壁で囲んで、ドアをつけると家になる',g:'earth',w:0,L:[['K','村がにぎやかになってきたから、もう1けん、家を建てたいねぇ。'],['K','みんなで、ゆったり暮らせるようにしたいよぉ。']],X:[['K','3けんめの家だぁ。村らしくなってきたねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'家を3けんにしよう',ln:'もう1けん、家がほしいねぇ',at:()=>S.lv>=4&&!!(S.subDone||{}).house2,ok:()=>HOUSES.length>=3,n:3,now:()=>HOUSES.length,rw:25},
  {k:'fruit1',how:'「おく」でりんごの苗を置く。せいれいが植えるのを待とう。育つまで少しかかる',g:'wood',w:0,give:{fruit:1},L:[['K','#joy|広い土地に、おいしい実のなる木があったらいいな。'],['K','りんごの木、植えてみたい！']],X:[['K','#surprise|わあ、りんごの木だ！ 実がなるの、たのしみだね！'],['K','#joy|守り神さま、ありがとう！']],t:'りんごの木を育てよう',ln:'実のなる木があったらうれしいな',at:()=>qAt('baseUp')&&S.lv>=6,ok:()=>bloomCount('fruit')>=1,n:1,now:()=>bloomCount('fruit'),rw:15},
];

const FIREB={/* 火のキーキャラが、あにきのとき */
  light3:{L:[['K','#alarm|夜の村、まっくらじゃねえか。これじゃ「コワイノ」にやりたい放題されるぜ。'],['K','#think|おれの火を、もっと遠くまで届けられねえかな。おまえ、いい考えはねえか？'],['@idea']],X:[['K','よし、明るくなった！ これで夜も、ちっとはマシだな。'],['K','灯り、ありがとな。これで夜の見張りが、ずっとラクになるぜ。']]},
  trap4:{L:[['K','#danger|守ってばっかりじゃ、つまらねえな。'],['K','近づいてくるやつを、途中でぎゃふんと言わせたいぜ。おまえ、まだ手はあるよな？'],['@idea']],X:[['K','いいねえ、罠だらけだ！ 来るなら来やがれ！'],['K','#alarm|罠、ありがとな。これで「コワイノ」も、手出しできねえだろ！']]},
  houselight:{L:[['K','なあ守り神、外が明るくなったら、今度は家の中が暗く感じるな。'],['K','夜に、だれかがつまずいたら、かわいそうだろ。'],['K','中でも足もとが見えるように、できねえかな。'],['@idea']],X:[['K','おっ、あったけえ灯りだな。……これで夜も、安心して眠れるぜ。'],['K','ありがとよ、守り神。']]},
  lighthouse1:{L:[['K','夜の見回り、まだ暗いところがあって不安なんだ。'],['K','もっと遠くまで照らせる、でっかい灯りがあれば、いいんだがな。'],['@idea']],X:[['K','おお、灯台だ！ これなら遠くまでよく見えるぜ。'],['K','ありがとよ、守り神。']]},
  toy2:{L:[['K','なあ、守り神。ここ、走りまわれる場所はあるけど、ちょっと物足りなくねえか？'],['K','砂の山をつくったり、穴をほったり……そういう遊び場があったら、みんな喜ぶと思うぜ。'],['K','守り神、どんな形を思い浮かべる？'],['@idea']],X:[['K','おお、砂場だ！ さっそく山をつくろうぜ！'],['K','ありがとな、守り神。']]},
  festlight:{L:[['K','ヌシ様が来る道、明るくしておきたいな。'],['K','#nod|あかりを、あと5つふやそうぜ。']],X:[['K','よし、村じゅうが明るくなった！ これならヌシ様も、まよわねえな。'],['K','ありがとよ、守り神。']]},
  fence20:{L:[['K','村が大きくなったぶん、守る場所もふえたな。'],['K','まわりは、まだがら空きじゃねえか。'],['K','#alarm|柵をずらっと並べて、「コワイノ」の足を止めてやろうぜ。']],X:[['K','いいじゃねえか、これならそう簡単には入ってこれねえぜ！'],['K','ありがとよ、守り神。']]}};/* ホノ（あにき）は、いつも「おれ」。あたいは、ホムラ（あねご）だけ */
function inHouseFurn(){const k=new Set();for(let j=0;j<S.obj.length;j++){const o=S.obj[j];if(!o||!BL[o]||BL[o].kind!=='furn'||BL[o].trap)continue;if(HOUSES.some(h=>h.set&&h.set.has(j)))k.add(o)}for(const h of HOUSES)if(h.set)for(const o of rugsIn(h.set))k.add(o);return k.size}/* 家の中にある家具・かざりの種類の数 */
/* クエストの番号。まとめた目標は、中の小さな目標の名前（parts）でもさがせる */
const qHas=(q,id)=>q.id===id||!!q.parts&&q.parts.includes(id)||!!q.fieldParts&&q.fieldParts.includes(id);
function questIndexOf(id){return QUESTS.findIndex(q=>qHas(q,id))}
function qNow(id){const q=S&&QUESTS[S.quest];return !!q&&!S.cleared&&S.qTalked&&S.qStory==null&&qHas(q,id)}/* いま受けている目標に、その小さな目標がある */
function qAt(id){const qi=questIndexOf(id);if(qi<0)return false;return (S.quest>qi||S.quest===qi&&!!S.qTalked)}/* そのメインクエストを受けたあと */
function qDone(id){const index=questIndexOf(id);if(index<0)return false;if(S.qStory===index)return false;return S.quest>index}
const SUB_MAIN_AFTER={chair2:'table',farm10:'farm6',light3:'fire'};
function subOfferReady(q){if(S.qStory!=null||QUEST_CLEAR_WAIT)return false;return WD!==0||!SUB_MAIN_AFTER[q.k]||qDone(SUB_MAIN_AFTER[q.k])}
const LEVEL_HELP={2:['benchbreak','chair2'],3:['bed3'],4:['farm10'],5:['toy2','deco3'],8:['room','paint','parasol']};
function levelHelpKeys(){const out=[];for(const n in LEVEL_HELP){const main=qAt('lv'+n),side=SUBQ.some(q=>q.k.startsWith('lv_')&&q.n===+n&&(S.subSt||{})[q.k]>=2);if(main||side)out.push(...LEVEL_HELP[n])}return out}
function subList(){const help=levelHelpKeys();if(waitingBellflowers())help.unshift('seedwait_gate','seedwait_food');return SUBQ.filter(q=>q.w==null||q.w===WD).sort((a,b)=>(help.includes(a.k)?0:1)-(help.includes(b.k)?0:1))}
let SUBW={};/* サブクエストで話したそうにしている子（名前→k） */
const KEYEL0={wood:POKO,earth:MINA};
function keyName(el){const N=S.keyN||(S.keyN={});/* 5属性のキーキャラ：決まった子か、その属性で最初に来た子 */
  if(N[el]&&(S.res.some(r=>r.name===N[el])||(S.buried||[]).some(r=>r.name===N[el])))return N[el];
  let nm=null;if(!WD&&(KEYEL0[el]||FIXK0[el]))nm=KEYEL0[el]||FIXK0[el];else{for(const k in KEYEL)if(KEYEL[k]===el&&KEYS[WD]&&KEYS[WD].includes(k))nm=k}
  if(!nm){const r=S.res.filter(r=>r.elem===el).sort((a,b)=>a.id-b.id)[0];nm=r?r.name:null}
  if(nm&&S.res.some(r=>r.name===nm))N[el]=nm;return nm}
function subWho(q){return q.who||keyName(q.g)}/* who：話す人がきまっている（交換はカミサマ） */
function checkSub(){const D=S.subDone||(S.subDone={}),Sn=S.subSeen||(S.subSeen={}),St=S.subSt||(S.subSt={});if((St.sortie>=2||D.sortie)&&!S.flags.sortie)S.flags.sortie=1;/* 出撃のサブクエストを受けたら、出撃をえらべる */S.subB||(S.subB={});SUBW={};const SL=subList();/* 1回だけ作って使いまわす */
  const busy={};
  for(const q of SL){if(D[q.k])continue;if(St[q.k]===1&&(!subOfferReady(q)))delete St[q.k];if(Sn[q.k]&&!St[q.k])St[q.k]=2;
    if(St[q.k]===3&&FLOWER_QUESTS.has(q.k)&&!q.ok()){St[q.k]=2;delete (S.subArrived||{})[q.k];delete SUB_CLEAR_WAIT[q.k]}
    if(St[q.k]===3&&!isNight()&&!(S.subArrived||{})[q.k]&&!SUB_CLEAR_WAIT[q.k]){const visit=queueQuestVisit(q,subWho(q));if(visit){St[q.k]=2;SUB_CLEAR_WAIT[q.k]=Object.assign({done:false},visit)}}/* 前からの人：もう受けている */
    if(St[q.k]===2&&q.ok()&&!isNight()){let wait=SUB_CLEAR_WAIT[q.k];if(wait&&!wait.done&&(S.obj[wait.obj]!==wait.id||!S.res.includes(wait.r))){delete SUB_CLEAR_WAIT[q.k];wait=null}
      if(wait&&wait.done){delete SUB_CLEAR_WAIT[q.k];St[q.k]=3;sfx('quest');toast('サブクエストたっせい：'+q.t,'good')}
      else if(!wait){const visit=queueQuestVisit(q,subWho(q));if(visit)SUB_CLEAR_WAIT[q.k]=Object.assign({done:false},visit);else{St[q.k]=3;sfx('quest');toast('サブクエストたっせい：'+q.t,'good')}}}
    if(St[q.k])busy[q.g]=busy[q.g]&&!(St[q.k]===3&&St[busy[q.g].k]!==3)?busy[q.g]:q}/* 終わったクエストの報告を先に出す */
  /* サブクエストは一つずつ提示。会話のあいだを村の時間で2時間あける */
  const spaced=!isNight()&&(S.subTalkAt==null||S.t-S.subTalkAt>=120);/* 新しいサブクエストは、昼だけ */
  if(spaced&&!Object.values(busy).some(q=>St[q.k]===1||St[q.k]===3)&&SL.filter(q=>!D[q.k]&&St[q.k]===2).length<6)for(const q of SL){/* 前のおねがいが終わっていなくても、条件がそろえば出す（受けているのは6つまで） */if(D[q.k]||St[q.k])continue;const w=keyName(q.g);if(!w||!q.at()||!subOfferReady(q))continue;St[q.k]=1;busy[q.g]=q;break}
  if(spaced&&waitingBellflowers()&&!SL.some(q=>St[q.k]===1||St[q.k]===3)&&SL.filter(q=>St[q.k]===2).length<3){const next=SL.find(q=>q.k.startsWith('seedwait_')&&!D[q.k]&&!St[q.k]&&q.at());if(next&&subOfferReady(next))St[next.k]=1}
  const summonHelp=WD===0&&S.qStory==null&&S.qTalked?({fire:'salvia3',water:'lotus3',wind:'lily5'}[QUESTS[S.quest]?.id]||''):'',supportKeys=summonHelp?(summonHelp==='salvia3'?['salvia3','watch2']:summonHelp==='lily5'?['lily5','swing1']:[summonHelp]):[];
  for(const k of supportKeys){if(D[k]||St[k])continue;const q=SL.find(q=>q.k===k);if(!q||!q.at()||!subOfferReady(q)||!keyName(q.g))continue;if(!isNight()&&(k===summonHelp||spaced)){St[k]=1;break}}
  const visiting=!!QUEST_CLEAR_WAIT&&!QUEST_CLEAR_WAIT.done||Object.values(SUB_CLEAR_WAIT).some(w=>w&&!w.done)||S.res.some(r=>(QUEST_VISITS.get(r)||[]).length||r.act&&r.act.type==='questjoy'&&r.act.joyAt==null);/* クエストのものを見にいく途中は、新しい話の黄色い吹き出しは出さない（着いて喜び始めてから） */
  const requests=visiting?[]:SL.filter(q=>St[q.k]===1&&!isNight()&&(spaced||summonHelp&&q.k===summonHelp));
  const pending=requests.filter(q=>supportKeys.includes(q.k)).concat(SL.filter(q=>St[q.k]===3),requests.filter(q=>!supportKeys.includes(q.k)));
  for(const q of pending){const w=St[q.k]===3?questReplyWho(q):subWho(q);if(w&&spkOK(w)&&w!==TALKW){SUBW[w]=q.k;break}}}
function subTalk(k){const q=SUBQ.find(q=>q.k===k),St=S.subSt,D=S.subDone;if(!q||!$('#dialog').hidden||St[k]===1&&!subOfferReady(q))return;S.subTalkAt=S.t;const offer=St[k]===1;/* おねがいの会話を聞きおえたら、とちゅうでメインの目標ができても、受けたことにする */const w=subWho(q)||POKO,L=(St[k]===1?q.L:typeof q.X==='function'?q.X():q.X)||[[w,q.t]];
  const rw=S.res.find(z=>z.name===w),FB2=q.g==='fire'&&rw&&elemKey(rw)==='fireB'&&FIREB[k];let once=0;dialog(ideaDialogue(q,(FB2?(St[k]===1?FB2.L:FB2.X):L).map(x=>[x[0]==='K'?w:x[0],x[1]&&typeof x[1]==='object'?(w===HOMURA?x[1].h:x[1].a):x[1]]),/* {h,a}：ホムラ（あたい）と、ほかの火の子（あたし） */St[k]===1?'accept':'clear'),()=>{if(once++)return;
    if(offer&&!D[k]&&St[k]==null)St[k]=1;
    if(St[k]===1){St[k]=2;Sn0(k);if(q.base)S.subB[k]=q.base();for(const id of q.learn||[])if(!(S.free&&BL[id]&&BL[id].kind==='furn'))S.recipes[id]=true;inspireQuest(q);for(const x in q.give||{}){S.unlocked[x]=true;giveItem(x,q.give[x])}queueItemGift(q.give);if(q.feat)questGives(q,{feat:q.feat});sfx('quest');toast('サブクエスト：'+q.t,'good');renderPalette()}
    else if(St[k]===3){St[k]=4;D[k]=1;inspireQuest(q,'clear');if(q.godLeave&&!S.godGone)questGives(q,{godLeave:true});if(q.rw){rewardPower(q.rw)}memo('📌','サブクエスト「'+q.t+'」をたっせい');logEv('サブクエスト「'+q.t+'」をたっせい')}
    checkSub()},null)}
function Sn0(k){(S.subSeen||(S.subSeen={}))[k]=1}
/* ---------- ステージ1の物語イベント（フタバと5属性のキーキャラ） ----------
   F=フタバ N=ノドカ H=火の子 M=水の子 K=風の子（その属性で最初に来た子） G=カミサマ U=草原のヌシ
   いない子のセリフ（3つめに1）はとばす。need の子がいないと出ない */
const NUSHI1='草原のヌシ';
function guardSevOld(){return WD!==0||!!S.free||S.cleared||S.quest>qsIx('guardLearn')}/* こもれびのまもりは、メインの「こもれびのまもり」でおぼえる。メインをもうすぎた古いセーブだけ、ピンクの会話でおぼえる */
function sevName(t){return t==='F'?POKO:t==='N'?MINA:t==='H'?keyName('fire'):t==='M'?keyName('water'):t==='K'?keyName('wind'):t==='G'?GOD:t==='U'?NUSHI1:t}
function sevAllHere(e){return (e.L||[]).every(x=>x[2]===1||typeof x[2]==='string'||sevHere(x[0]))}/* ピンクの会話：話す子がみんな村にいるときだけ（「Nがいるときだけ」の行はのぞく） */
function sevHere(t){if(t==='G'||t==='U')return true;const n=sevName(t);return !!n&&S.res.some(r=>r.name===n)}
function sevLines(L,dead){const out=[];for(const x of L){const t=x[0],dp=x[2];if(dp==='1st'&&S.flags&&S.flags.kizunaTold)continue;/* '1st'=最初にもどった子の会話だけ */if(typeof dp==='string'&&dp!=='1st'&&!dp.split('&').every(c=>c.startsWith('sev:')?!!(S.sev||{})[c.slice(4)]:c[0]==='!'?!sevHere(c.slice(1)):sevHere(c)))continue;/* 'sev:e05'=その会話を見たあとだけ、'N'=Nがいるときだけ、'!N'=Nがいないときだけ（'&'でかさねる） *//* 3つめが'N'なら「Nがいるときだけ」、'!N'なら「Nがいないときだけ」 */if(!sevHere(t)){if(dp)continue;return null}const n=sevName(t);let s=x[1];
  if(typeof s==='object'){const r=S.res.find(q=>q.name===n);s=r&&elemKey(r)==='fireB'?s.B:s.A}out.push([n,s.split('$').join(dead||'').replace(/@([HMK])/g,(m,c)=>sevName(c)),typeof x[3]==='string'?x[3]:0])}return out}
/* 属性のシンボルの建物のそばで、その属性のキーキャラが過ごしているとき */
const SYMB={fire:'lighthouse',water:'fountain',wind:'windmill',earth:'stele'};
function natNear(el,f){const q=S.res.find(x=>x.name===keyName(el));if(!q||q.hidden||(q.act&&['flee','faint','sleep'].includes(q.act.type)))return false;return f(q)}/* その属性のキーキャラが、条件 f をみたす所にいるか */
function tileNear(q,r,f){const x0=q.x|0,y0=q.y|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(x>=0&&y>=0&&x<W&&y<H&&f(y*W+x))return true}return false}
function symNear(el){const id=SYMB[el];if(!id||!cnt(id))return false;const q=S.res.find(x=>x.name===keyName(el));if(!q||q.hidden||(q.act&&['flee','faint','sleep'].includes(q.act.type)))return false;for(let j=0;j<S.obj.length;j++)if(S.obj[j]===id&&Math.hypot((j%W+.5)-q.x,((j/W)|0)+.5-q.y)<=3)return true;return false}
function atFarm(r){if(!r||r.hidden||r.act&&['flee','faint','sleep'].includes(r.act.type))return false;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&Math.hypot((j%W+.5)-r.x,((j/W)|0)+.5-r.y)<=1.35)return true;return false}
const SEV1=[
 {k:'e04',at:()=>!!S.flags.minaCame&&cnt('table')>=1,L:[['F','ノドカ！ いっしょにごはん食べよ！'],['N','いいよぉ。なにを食べようかねぇ。'],['F','#surprise|えっとね、ベリー！ ……あれ、どこにしまったっけ？'],['N','ふふ。木箱の中だよぉ。'],['F','#joy|そうだった！ えへへ、ふたりだと楽しいね！']]},
 {k:'e04b',at:()=>!!S.flags.minaCame&&S.flags.mnN!=null&&(S.nights||0)>S.flags.mnN&&S.lastMorning>S.lastNight,L:[['F','ノドカ、おはよう！'],['F','ノドカが来てからね、ぐっすり眠れるようになったんだ。'],['N','そうなのぉ？'],['F','となりにだれかいるって、こんなに安心するんだね。'],['N','ふふ。ぼくも、ぐっすりだったよぉ。']]},
 {k:'e05',at:()=>!!(S.subDone||{}).bed3,L:[['F','#joy|こんなになかまがふえたよ！ ぼく、うれしいな！'],['F','#sigh alarm|……でも、また「コワイノ」が来たら、どうしよう。'],['N','#think|みんなで考えたらいいよぉ。ひとりじゃないんだからねぇ。'],['F','そうだね！ ぼくだって、だれかを守れるようになりたい！']]},
 {k:'e06',at:()=>sevHere('H')&&S.enemyOn&&(S.bossKills||0)>=1&&!S.flags.guard&&!S.flags.hDied&&guardSevOld(),/* こもれびのまもりは、最初のオオカゲを追いはらったあと、火の子を心配する流れで */L:[['F','#surprise|@H……オオカゲとたたかって、だいじょうぶだった！？'],['H','へっちゃらだ。これくらいで、へこたれるおれじゃねえ。'],['F','#think|……あの大きな影を思い出すと、まだ手がふるえるんだ。'],['H','#think|あんなでかい影だ。こわくて、あたりめえだ。……おれだって、足がすくんだぜ。'],['F','#scared|……ぼく、なんにもできなかった。むかしね、ぼくのきょうだいは、前に出て、ぼくを守ってくれたのに。'],['H','おれたちが前に出られるのは、おまえらが村にいてくれるからだ。村のちびたちを守りたいのは、おまえも同じだろ？'],['F','#think|……うん。ぼくも、守りたい！'],['F','ノドカが言ってたんだ。ひとりじゃないから、みんなで考えたらいいって。','sev:e05&N'],['F','ぼくは@Hみたいに強くないけど……葉っぱで守ることならできるかも！'],['F','ほらっ！ こもれびの、まもり！ ……わっ、葉っぱが顔にくっついた！',0,'guarddemo'],['H','#think|……ははっ。しょうがねえやつだな。……ありがとな。いっしょに守ろうぜ。']],
  go:()=>{S.flags.guard=true;memo('🍃','フタバが「こもれびのまもり」をおぼえた');skillPop('leaf','フタバが「こもれびのまもり」をおぼえた！',['夜、「コワイノ」にねらわれている火のせいれいを、はなれた所から葉っぱで1人守る。','守られたせいれいは、40分のあいだ、「コワイノ」から受けるダメージ0.5倍。','つかったあとは、75分たつと、また守れる。'])}},
 {k:'e06d',at:()=>sevHere('H')&&S.enemyOn&&(S.bossKills||0)>=1&&!S.flags.guard&&!!S.flags.hDied&&guardSevOld(),/* 火の子がオオカゲの夜にいなくなっていたら、よみがえってから */L:[['F','@H……！ もどってきてくれたんだね……！'],['F','#scared|オオカゲの夜に、@Hがいなくなっちゃって……ぼく、ずっと、こわかった。'],['H','#think|……心配かけたな。もう、だいじょうぶだ。'],['F','#scared|ぼく、見てるだけで、なんにもできなかった。むかしね、ぼくのきょうだいも、前に出て、ぼくを守ってくれたのに。'],['H','おれたちが前に出られるのは、おまえらが村にいてくれるからだ。村のちびたちを守りたいのは、おまえも同じだろ？'],['F','#think|……うん。もう、だれにもいなくなってほしくない。ぼくも、守りたい！'],['F','ノドカが言ってたんだ。ひとりじゃないから、みんなで考えたらいいって。','sev:e05&N'],['F','ぼくは@Hみたいに強くないけど……葉っぱで守ることならできるかも！'],['F','ほらっ！ こもれびの、まもり！ ……わっ、葉っぱが顔にくっついた！',0,'guarddemo'],['H','#think|……ははっ。しょうがねえやつだな。……ありがとな。いっしょに守ろうぜ。']],
  go:()=>{S.flags.guard=true;memo('🍃','フタバが「こもれびのまもり」をおぼえた');skillPop('leaf','フタバが「こもれびのまもり」をおぼえた！',['夜、「コワイノ」にねらわれている火のせいれいを、はなれた所から葉っぱで1人守る。','守られたせいれいは、40分のあいだ、「コワイノ」から受けるダメージ0.5倍。','つかったあとは、75分たつと、また守れる。'])}},
 {k:'e07',at:()=>sevHere('M'),L:[['F','ねえねえ、@M！ 畑、見てくれた？'],['M','#joy|はい、見ましたよ。よくそだっていますね。'],['M','#think|ただ……この村には、水が必要な場所が、まだたくさんありますね。'],['F','ぼくね、いっぺんに水を運ぼうとして、ぜんぶこぼしたことがあるんだ！'],['N','#surprise|あれは、びっくりしたねぇ。',1],['M','#think|……一度に運ぶ量を、半分にしてみましょう。そのほうが、結果的に早いですよ。'],['F','#joy|えへへ……今日はこぼさないよ！']]},
 {k:'e08',night:1,at:()=>{const f=S.res.find(r=>r.name===POKO);return !!f&&S.enemies.some(e=>!e.dead&&((e.type==='boss'||e.type==='boss2'))&&Math.hypot(e.x-f.x,e.y-f.y)<12)&&!(S.ns&&S.ns.final)},L:[['F','#think|……あの感じ。まえの夜と、おんなじ……！',0,'dim'],['F','あれが、オオカゲ……。'],['F','#ponder|あの夜も、あの影がいた……。'],['F','#scared|……あのときと、同じつめたさ。'],['F','#scared|もう、だれにもこわい思いをさせないで！'],['F','#danger|……こわい。でも、ここは、ぼくたちの草原なんだ。'],['F','#worry|守り神さま、みんなを……おねがい！']]},
 {k:'e09',at:()=>!!S.flags.finalWon&&((S.shards||0)>=3||(S.setSh||0)>=3)&&S.qStory==null,L:[["F","#think|……あの夜から、ずっとあったかい。"],["F","……最後の、かけら。"],["N","みんなで、守り抜いたんだねぇ。",1],["H","よし、そのかけらも、木にとどけてやろうぜ。",1],["F","うん。みんなで、いっしょに持っていきたいんだ。"],["M","では、一緒に。",1],["K","この木なら、きっと受けとめてくれる。",1]],go:()=>renderQuest()},
 {k:'e17',at:()=>elemCount('wood')>=5&&S.qStory==null,L:[['F','なかまが、こんなにふえた！'],['F','みんなでくっついてた、あのころみたい……。'],['F','#cry|むかしのきょうだいとは、ちがう子たちだけど……ここにも、きょうだいができたみたいで、うれしいな。'],['N','#cry|フタバのきょうだいが、ふえたねぇ。',1],['F','#cry|えへへ。……むかしのきょうだいたちも、きっとよろこんでくれるよね。']]},
 {k:'e18',at:()=>sevHere('M')&&!!(S.sev||{}).e07&&cnt('farm')>=6,L:[['M','畑がふえてきたので、水まきの順番を計算してみました。……ですが、どう回っても、ぜんぶの畑に水が行きわたりません。'],['F','えー！ それなら、ぼくも手伝うよ！ かわいた畑を見つけたら、すぐ教えるね！'],['M','#think|……計算より、だれかの目のほうが確実なこともあるのですね。'],['F','そうそう！ みんなでやれば、へっちゃらだよ！'],['M','#joy|はい。……ありがとうございます。']]},
 {k:'e20',at:()=>cnt('tree')+cnt('fruit')>=1&&S.qStory==null&&sevHere('F'),L:[['F','見て見て！ 木が植わってる！ まだちっちゃいね。'],['N','大きくなるまで、時間がかかるよぉ。',1],['F','#cry|むかし、きょうだいと大きな木の下で遊んだんだ。かくれんぼして、ぼくはいつもすぐ見つかっちゃって。'],['F','#think|……この木も、あの木みたいに、おっきくなるといいな。']]},
 {k:'e21',at:()=>flowerN()>=5&&S.qStory==null&&sevHere('F')&&sevHere('N'),L:[['F','花が咲くと、ヌシ様がいたころの景色がもどってくるみたい。'],['F','ここは、いつも花の冠を作ってた場所なんだ。'],['N','上手に作れるのぉ？'],['F','もちろん！ ほら、ノドカにもあげる！',0,'give'],['N','#joy|ふふ、ありがとうねぇ。']]},
 {k:'e22',at:()=>cnt('swing')>=1&&sevHere('F')&&sevHere('N'),L:[['F','ブランコ、できたー！'],['F','ノドカ、押して押して！'],['N','いくよぉ、せーの。',0,'push'],['F','#surprise|わあーっ！ たかーい！'],['N','フタバ、ほどほどにねぇ。'],['F','もう一回！ もう一回！']]},
 {k:'e23',at:()=>atFarm(S.res.find(r=>r.name===sevName('N')))&&cnt('farm')>=6&&!!(S.sev||{}).e04b,L:[['F','ノドカ、ずっと畑にいるよ。ごはん、食べた？'],['N','あれぇ……もうこんな時間かぁ。畑が気になって、つい。'],['F','もう！ ぼくがお弁当もっていくから、ちょっと休もう！'],['N','#joy|ふふ、ありがとうねぇ。……フタバがいてくれて、助かるよぉ。']]},
 {k:'e10',at:()=>sevHere('K'),L:[['K','フッ…村の外まで、風がずっと続いているね。'],['F','#surprise|えっ、風で、外のことがわかるの！？'],['F','#think|……でも、あんまり遠くへ行っちゃだめだよ。迷子になっちゃうから。'],['K','おや。それは、きみのことじゃないのかな？'],['F','#joy|えへへ……このまえ迷ったの、見られてた？'],['K','#sigh|風はなんでも知っているのさ。…安心したまえ、ぼくの胸にしまっておくよ。']]},
 {k:'p1',at:()=>!!S.flags.minaCame&&(qi=>qi>=0&&S.quest>qi)(questIndexOf('tale')),L:[['N','この前のお話、ずっと考えてたんだぁ。フタバは、あれから、ずっとひとりでここにいたのぉ？'],['F','#worry|……うん。あのころは、きょうだいがいっぱいいたのにね。'],['F','ぼくがいちばん下で、みんなでくっついて寝てたの。にぎやかだったなあ。'],['N','そっかぁ。……いまは、どこにいるのかなぁ。'],['F','#think|……わかんない。でも、どこかで、げんきだったらいいなって思うんだ。'],['N','#nod|うん。ぼくは、ずっととなりにいるよぉ。']]},
 {k:'e12f',at:()=>!!S.flags.fHurtG&&!!S.flags.guard&&!(S.sev||{}).e12n&&sevHere('H'),/* こもれびのまもりをおぼえたあと、べつの夜に。e06（まもりをおぼえる話）とは、ちがう話 */L:[['F','#surprise|@H、ゆうべ、いっぱいたたかれてたよね……！ 葉っぱ、ちゃんと届いた？'],['H','#sigh|ああ、届いたぜ。……おまえの葉っぱのおかげで、ちょっとだけ痛くなかった。'],['F','#think|ちょっとだけ……。もっと早く、もっとたくさん守れるようになるからね！'],['H','#think|……へっ。じゃあ、たよりにしてるぜ。'],['F','#think|……でも、むりはしないでね。ほんとうに心配したんだから。'],['H','#think|……ばか。そんな顔すんな。……ありがとな。']]},
 {k:'e13m',at:()=>sevHere('M')&&fieldStoryDone('waterFilm')&&(S.bossKills||0)>=1&&qDone('tower')&&!!(S.sev||{}).e07,/* 3つのかけらの話は、御神木の依頼（tower）でカミサマから聞いたあと */L:[['M','守り神さま、オオカゲが消えた場所を調べてみました。地面に、ふしぎな光が少しだけ残っていました。'],['M','そこに置いた花は、いつもより長く咲いていて……光の色も、見る角度で変わるんです。'],['F','#sigh|ふしぎ！ どうして？'],['M','#think|切り株に開いた若葉に残っていた光と、似ています。……影が通った場所にも、土地に散らばったヌシ様の力が残っているのかもしれません。'],['M','ノドカさんは、ヌシ様の力が、まだ土に残っていると言っていましたね。言い伝えでは、「守る力」「育てる力」「想う力」の3つのかけらになったそうです。','N'],['M','言い伝えでは、ヌシ様の力は「守る力」「育てる力」「想う力」の3つのかけらになったそうです。','!N'],['N','3つそろったら、ヌシ様の形にもどれるんだよねぇ。',1],['M','ええ。のこりのかけらも、きっとどこかで、見つけてもらうのを待っています。']]},
 {k:'r1',at:()=>!!(S.sev||{}).e04&&sevHere('N')&&S.qStory==null,L:[["F","ノドカ、今日はぼくがごはんを運ぶよ。土のついた手で食べると、じゃりじゃりするもん。"],["N","#joy|ありがとうねぇ。じゃあ、ぼくはフタバのぶんも、畑を見ておくよぉ。"],["F","あとで、いっしょに食べようね！"]]},
 {k:'r2',at:()=>sevHere('H')&&natNear('fire',q=>hour()>=9&&hour()<16&&!S.rain&&!roomOf((q.y|0)*W+(q.x|0)))&&S.qStory==null,L:[["H","遠くの子をさがしてたら、見まわりの帰りが遅くなっちまってな。"],["F","こんどは、ぼくも家の前で待ってるよ。帰ってきたら、すぐわかるように！"],["H","ありがとな。先に休めるときは、ちゃんと休めよ。"]]},
 {k:'r3',at:()=>sevHere('M')&&cnt('farm')>0&&natNear('water',q=>tileNear(q,2,j=>S.ground[j]===1))&&S.qStory==null,L:[["M","水辺の近くは、土がまだ湿っています。今日は、遠い畑から水を運びましょう。"],["F","そっか！ 近い畑は、ぼくが見ておくね。"],["M","#joy|ありがとうございます、フタバさん。"]]},
 {k:'r4',at:()=>sevHere('K')&&natNear('wind',q=>!isNight()&&!S.rain&&!roomOf((q.y|0)*W+(q.x|0)))&&S.qStory==null,L:[["K","風上から、乾いた土の匂いがする。あちらの花、少し元気がないようだ。"],["F","見てくる！ 教えてくれてありがとう。"],["K","ぼくは、道に落ちた枝を片づけておくよ。水を運ぶ子が通りやすいようにね。"]]},
 {k:'r5',at:()=>sevHere('N')&&natNear('earth',q=>tileNear(q,3,j=>S.obj[j]==='rock'))&&S.qStory==null,L:[["N","この岩のそば、昼はあったかくて、夕方は日かげになるねぇ。"],["F","休んでる子のじゃまにならないように、ぼく、こっちから回っていくね。"],["N","#joy|ふふ。フタバは、小さなことによく気がつくねぇ。"]]},
 {k:'r2j',at:()=>sevHere('H')&&symNear('fire')&&S.qStory==null,L:[['H','#joy|見ろよ、フタバ。灯台の光、村のはしっこまでとどいてるぜ！'],['F','#joy|ほんとだ！ 夜でも、みちがよく見えるね。'],['H','これなら、夜の見まわりも、こわくねえな。']]},
 {k:'r3j',at:()=>sevHere('M')&&symNear('water')&&S.qStory==null,L:[['M','#joy|フタバさん、見てください。噴水の水が、お日さまできらきらしています。'],['F','#joy|ほんとだ！ 虹も見えるよ！'],['M','みなさんが水しぶきで遊んでいると、わたしもうれしくなります。']]},
 {k:'r4j',at:()=>sevHere('K')&&symNear('wind')&&S.qStory==null,L:[['K','#joy|フッ…いい音だね。風車が、風といっしょに歌っているよ。'],['F','#joy|くるくる、くるくる！ 見てると、目がまわりそう！'],['K','風の通る道ができると、村じゅうが、すこし軽くなるのさ。']]},
 {k:'r5j',at:()=>sevHere('N')&&symNear('earth')&&S.qStory==null,L:[['N','#joy|フタバ、このノームさん、どっしりしてて、いいねぇ。'],['F','うん！ にこにこしてて、そばにいると安心する！'],['N','壁も、まえよりしっかりしたよぉ。みんなを守ってくれてるんだねぇ。']]},
 {k:'e14k',at:()=>sevHere('K')&&!!(S.sev||{}).e10&&(S.bossKills||0)>=2,L:[['K','#worry hush|……風が、熱を失っている。'],['F','え？'],['K','遠くの火の山から吹いてくる風が、冷たいんだ。あそこにも、困っている子たちがいるのかもしれないね。'],['F','#think|……ここみたいに？'],['K','フッ…いつか、だれかが助けに行くさ。たとえば、守り神とかね。']]},
 {k:'e11',at:()=>qAt('nushi'),L:[['F','#think|……ヌシ様、ほんとうに帰ってきてくれるかな。'],['N','ここまでできたんだよぉ。あと少しだねぇ。',1],['H','#sigh|夜はおれにまかせろ。最後まで村を守りぬくぜ。',1],['M','準備は進んでいます。できることを、ひとつずつ続けましょう。',1],['K','この場所なら、遠くからでも光が見えるはずさ。',1],['F','#think|……うん！ ぼくも、みんなといっしょにやる！'],['F','守り神さま！ ヌシ様を迎えに行こう！']]},
 {k:'e16',at:()=>(S.finalNight||S.finalOn)&&!S.cleared&&sevHere('H'),L:[["F","木の葉が、暗くなってきた……。"],["N","影が、根のそばへ来てるねぇ。",1],["H","ここは、おれが行く。"],["F","……でも。"],["H","おまえまで、前に出なくていい。その代わり、頼むぞ。おれたちが帰ってくる所。"],["F","……うん。この木も、村も、守ってる。"]]},
 {k:'e15',night:1,at:()=>!!(S.ns&&S.ns.final)&&S.enemies.some(e=>e.type==='boss2'&&e.spawned&&!e.dead)&&sevHere('F'),L:[["F","#think|……来た。あの、大きな影……！",0,"shake"],["F","あの夜みたいには、させない。"],["H","フタバ、後ろを頼むぞ！",1],["F","……うん。ここにいるよ。","H"],["F","ちゃんと、帰ってきてね。ぼくも、みんなを守るから！",0,"guarddemo"],["N","葉っぱが、みんなのそばへ届いてるよぉ。",1]],
  go:()=>{S.flags.finF=1;S.flags.guard=true;toast('フタバが、近くのみんなを葉っぱで守る！','good')}},
 {k:'e16g',at:()=>false,/* 力を受けつぐのは、お見送り（depart）の中で（守り神がつぎの土地へ行くとわかってから） */L:[['F','#think|……だから、守り神さま。ぼくの力、もっていって。'],['F','ほかの土地の子たちも、葉っぱのまもりで、守ってあげて！',0,'guarddemo'],['G','#joy|フタバの力が、守り神にとどいたのう。']],
  go:()=>{S.flags.areaSkill=true;toast('守り神が「こもれびのまもり」を受けついだ！','good');memo('✨','守り神が「こもれびのまもり」を受けついだ')}},/* 草原：ヨルノオオカゲをたおした朝に、守り神が目ざめる */
 /* 消えた子がもどったとき（S.sevQ に入る） */
 {k:'b_N',q:1,L:[['N','#surprise|ふわぁ……ただいまぁ。'],['F','ノドカ！！'],['F','#think|……もう！ すっごく、心配したんだから！'],['N','#joy|ごめんねぇ。待っててくれて、ありがとう。'],['F','#think hush|……ほんとに、帰ってきた。'],['F','むかしは、いなくなった子に、もう声がとどかなかったんだ。……だから、こわかった。','1st'],['F','#joy|おかえり！ こんどは、いっしょにごはん食べようね！']]},
 {k:'b_H',q:1,L:[['F','#joy|おかえり！ もう、ひとりでむちゃしないでよ！'],['F','ずっとむかしに消えて、いまも会えていない子がいるんだ。……だから、帰ってきてくれて、ほんとによかった。','1st'],['H','#think|……おう。今度は、いっしょに守ろうぜ。'],['F','#nod|うん！ ぼくも、もっとがんばる！']]},
 {k:'b_F',q:1,L:[['F','ただいま……！ ……あれ、ぼく、どれくらいいなかったの？'],['N','#joy|おかえりぃ。待ってたよぉ。',1],['F','消えてるあいだのことは、なんにも覚えてないんだ。ずっと、ねむってたみたい。'],['F','#worry|……むかしの、きょうだいたちも、こんなふうに、いなくなっちゃったのかな。','1st'],['F','#think|……うん。もう一回、みんなとがんばる！']]},
 {k:'ret',q:1,L:[['F','#think|……あっ！ 守り神さま！？'],['F','ほんとに帰ってきてくれたんだ！'],['F','#joy|えへへ……また会えた！'],['F','#joy|見て見て！ ぼくたち、ここを守ってたんだよ！']]},
];
function sevBusy(){return !started||!$('#dialog').hidden||sheet!=null||NEWRES!=null||NEWQ.length||!$('#lvup').hidden||!$('#rlv').hidden||ASKING}
const SEVRUN=new Set();/* いま再生中の会話（セーブしない） */
let SCENEHOLD=0;/* 演出のあいだ、村の時間を止める（実時間でうごく） */
function guardInherit(e,L,f,owner,session,after){/* フタバの力（こもれびのまもり）を受けつぐ場面：はじめの一言 → 会話をとじて、時間を止めたまま、フタバが祈り、葉と光が守り神へながれこみ、まもりの光がひろがる → のこりの会話 */
  const kd=Math.max(1,L.findIndex(l=>/guarddemo/.test(l[typeof l[2]==='string'?2:3]||''))),first=L.slice(0,kd),rest=L.slice(kd).map(l=>{const c=typeof l[2]==='string'?2:3;if(!/guarddemo/.test(l[c]||''))return l;const m=l.slice();m[c]='hop';return m});
  const alive=()=>S===owner&&VILLAGE_SESSION===session&&S.res.includes(f);
  const finish=()=>{(S.sev||(S.sev={}))[e.k]=1;SEVRUN.delete(e.k);if(e.go)e.go();if(after)after();};
  const at=(ms,fn)=>setTimeout(()=>{if(alive())fn()},ms);
  dialog(first,()=>{if(!alive())return;const T=performance.now();SCENEHOLD=T+6200;
    camAnim={fz:cam.z,tz:Math.min(3,Math.max(2,cam.z*1.4)),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:f.x*TS,ty:f.y*TS-14,t:0,dur:.9};
    f.face=1;sacredScenePose(f,'pray',5600);
    at(700,()=>{leafFX(f);sfx('bush')});
    at(1500,()=>{lightFlow(f.x,f.y-.3);sfx('shard')});
    at(3600,()=>{f.shDemo=performance.now()+2600;leafFX(f);for(const r of S.res)if(r!==f&&!r.hidden&&Math.hypot(r.x-f.x,r.y-f.y)<=4){leafFX(r);r.shDemo=f.shDemo}addFloat(f.x,f.y-1,'こもれびのまもり！','#5fbf3f');dlgCue('flash');sfx('level')});
    at(6200,()=>{SCENEHOLD=0;dialog(rest,()=>{if(alive())finish()})});
  });
}
function guardPowerUp(e,L,f,owner,session){/* ヨルノオオカゲが来た夜：フタバのこもれびのまもりが強くなる場面。「みんなを守るから！」のあと会話をとじ、時間を止めて、フタバが光り、葉の輪が大きくひろがって、そばのみんなに葉のまもりがかかる → のこりの会話 */
  const cueOf=l=>typeof l[2]==='string'?2:3,k=L.findIndex(l=>/guarddemo/.test(l[cueOf(l)]||''));/* 会話の行は [話す人, セリフ, 合図] か [話す人, セリフ, 0, 合図] */if(k<0){const run=()=>dialog(L,()=>{if(S!==owner||VILLAGE_SESSION!==session)return;(S.sev||(S.sev={}))[e.k]=1;SEVRUN.delete(e.k);if(e.go)e.go()});return run()}
  const first=L.slice(0,k+1).map((l,i)=>{if(i!==k)return l;const c=cueOf(l),m=l.slice();m[c]=(l[c]||'').split('+').filter(x=>x!=='guarddemo').join('+')||0;return m}),rest=L.slice(k+1);
  const alive=()=>S===owner&&VILLAGE_SESSION===session&&S.res.includes(f);
  const finish=()=>{(S.sev||(S.sev={}))[e.k]=1;SEVRUN.delete(e.k);if(e.go)e.go();};
  const at=(ms,fn)=>setTimeout(()=>{if(alive())fn()},ms);
  dialog(first,()=>{if(!alive())return;const T=performance.now();SCENEHOLD=T+5600;
    camAnim={fz:cam.z,tz:Math.min(3,Math.max(2,cam.z*1.3)),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:f.x*TS,ty:f.y*TS-14,t:0,dur:.8};
    sacredScenePose(f,'pray',5000);
    at(500,()=>{leafFX(f);sfx('bush')});
    at(1300,()=>{const cx=f.x*TS,cy=f.y*TS-10;for(let i=0;i<3;i++)setTimeout(()=>{if(alive())fx.push({k:'ring',x:cx,y:cy,life:1,col:'rgba(150,230,120,.9)'})},i*420);for(let i=0;i<36;i++){const a=i/36*Math.PI*2;fx.push({k:'p',x:cx+Math.cos(a)*8,y:cy+Math.sin(a)*4,vx:Math.cos(a)*90,vy:Math.sin(a)*45-60,life:1.3,col:i%2?'#c8f5a0':'#fff6c8',r:3})}sfx('shard')});
    at(3000,()=>{const t=performance.now()+3000;f.shDemo=t;leafFX(f);for(const r of S.res)if(r!==f&&!r.hidden&&Math.hypot(r.x-f.x,r.y-f.y)<=3.6){leafFX(r);r.shDemo=t}addFloat(f.x,f.y-1.2,'こもれびのまもりが、強くなった！','#5fbf3f');dlgCue('flash');sfx('level')});
    at(5600,()=>{SCENEHOLD=0;if(rest.length)dialog(rest,()=>{if(alive())finish()});else finish()});
  });
}
function playDirectStoryEvent(e,L){
  SEVRUN.add(e.k);const owner=S,session=VILLAGE_SESSION,f=S.res.find(r=>r.name===POKO);
  if(f)centerOn(f.x*TS,f.y*TS);
  const run=()=>dialog(L,()=>{if(S!==owner||VILLAGE_SESSION!==session)return;(S.sev||(S.sev={}))[e.k]=1;SEVRUN.delete(e.k);if(e.go)e.go();});
  if(e.k==='e16g'&&f)return guardInherit(e,L,f,owner,session);
  if(e.k==='e15'&&f&&!IS_STORY_REPLAY)return guardPowerUp(e,L,f,owner,session);
  const result=e.vis?visionFX(e.vis,run):run();if(IS_STORY_REPLAY&&e.k==='e15')sacredShot('battle',S.res);return result;
}
function checkSev(){if(WD||!S){SEVW={};return}if(!sevBusy())sevBub();if(S.cleared&&!(S.sevQ||[]).length)return;const D=S.sev||(S.sev={}),ending=grassEndingEvent();if(sevBusy()||!ending&&(S.sevQuietUntil||0)>S.t)return;
  const Q=S.sevQ||(S.sevQ=[]);while(Q.length){const k=Q[0],e=SEV1.find(x=>x.k===k);const L=e&&sevLines(e.L);if(!L){Q.shift();continue}return dialog(L,()=>{D[k]=1;const i=Q.indexOf(k);if(i>=0)Q.splice(i,1);if(/^b_/.test(k))S.flags.kizunaTold=1})}/* 会話を最後まで見てから「見た」にする（途中でゲームをとじたら、はじめから） */
  if(ending){const lines=sevLines(ending.L);if(!lines)return;if(ending.k==='e16g')return playDirectStoryEvent(ending,lines);return;}/* 最後のかけらの話は、メインの会話（checkQuest・storywait）で出す */
  const h=hour(),day=h>=6&&h<21;
  for(const e of SEV1){if(e.q||D[e.k]||(S.sevMiss||{})[e.k]||SEVRUN.has(e.k)||(S.sevP||[]).includes(e.k))continue;if(!e.night&&!day)continue;if(!e.at())continue;const L=sevLines(e.L);if(!L)continue;
    if(['e08','e15','e16g'].includes(e.k))return playDirectStoryEvent(e,L);/* ムービー・会話は、最後まで見てから「見た」にする（途中でゲームをとじたら、はじめから） */
    if(!sevAllHere(e))continue;(S.sevP||(S.sevP=[])).push(e.k)}/* ふつうの条件会話は、吹き出しをタップしてから。「見た」にするのは、最後まで見てから */
  sevBub()}
/* 話したそうな子：S.sevP にたまった条件会話を、先頭のセリフの子の吹き出しにする */
let SEVW={};
/* ピンクの条件会話：対象のそばへ集まり、到着してからリアクションと吹き出し。 */
const SEV_OBJECTS={e04:['table'],e07:['farm'],e18:['farm'],e20:['tree','fruit'],e21:['clover','bellf','salvia','lily','lotus'],e22:['swing'],e09:['tower'],e11:['tower'],e16:['tower'],r5:['rock'],r2j:['lighthouse'],r3j:['fountain'],r4j:['windmill'],r5j:['stele']};/* 「前にも知っている気がする」話（r2〜r5）は、自然の物（お日さま・池・風・岩）のそば。守り神がひらめいた建物では、よろこぶ話（r2j〜r5j） */
const SEV_CHARACTERS={e04b:'N',e05:'N',e06:'H',e06d:'H',e17:'F',e23:'N',e10:'K',p1:'F',e12f:'H',e13m:'M',r1:'N',e14k:'K'};
const SEV_HAPPY=new Set(['e04','e05','e17','e20','e21','e22','e16']);
const SEV_ENCOUNTERS=new WeakMap(),SEV_RETRY=new WeakMap();
function sevActors(L){return [...new Set(L.map(l=>l[0]).filter(n=>n&&n!==GOD&&n!==NUSHI1))].map(n=>S.res.find(r=>r.name===n)).filter(Boolean)}
function sevAvailable(r){return !r.hidden&&r.hunger>=300&&!hungry(r)&&r.energy>=10&&!onHold(r)&&!HOLD.has(r.id)&&!(r.spawnT&&performance.now()-r.spawnT<1300)&&!(r.act&&['eat','fetch','eatwait','forage','flee','faint','sleep','questjoy','store','bathe'].includes(r.act.type))&&!(r.toStor&&carryN(r)>0)&&!(r.act&&r.act.stage==='walk'&&!['wander','idle','sevreact'].includes(r.act.type)&&r.path&&r.path.length>8)&&!r.cing/* 荷物をしまう・作業に向かう道のり・料理の途中は、ピンクの会話に呼ばない（着くまぎわなら、いい） */}
function sevTargetAlive(t){return t.obj!=null?S.obj[t.obj]===t.id:S.res.some(r=>r.name===t.who&&!r.hidden)}
function sevClose(r,t){const dx=Math.max(t.x-r.x,0,r.x-(t.x+t.w)),dy=Math.max(t.y-r.y,0,r.y-(t.y+t.h));return Math.hypot(dx,dy)<=1.05}
function sevTargets(e,actors){const ids=SEV_OBJECTS[e.k],lead=actors[0];if(ids){const found=[],recent=QUEST_PLACEMENTS.get(S);for(let j=0;j<S.obj.length;j++){const id=S.obj[j];if(!ids.includes(id))continue;if(e.k==='e21'&&isBud(j))continue;const b=BL[id],z=b&&szAt(id,j)||[1,1],last=recent&&recent.get(j);found.push({obj:j,id,x:j%W,y:(j/W)|0,w:z[0],h:z[1],score:(last&&last.id===id?last.n*100000:0)-Math.hypot(j%W+.5-lead.x,(j/W|0)+.5-lead.y)})}return found.sort((a,b)=>b.score-a.score)}
  const n=SEV_CHARACTERS[e.k]&&sevName(SEV_CHARACTERS[e.k]),anchor=actors.find(r=>r.name===n)||actors[1]||lead;return anchor?[{who:anchor.name,x:anchor.x|0,y:anchor.y|0,w:1,h:1}]:[];
}
function sevCancel(enc,skip,retry=true){if(!enc||SEV_ENCOUNTERS.get(S)!==enc)return;SEV_ENCOUNTERS.delete(S);if(retry){let m=SEV_RETRY.get(S);if(!m){m={};SEV_RETRY.set(S,m)}m[enc.k]=S.t+60}/* やめたら、60分はさそいなおさない */for(const r of enc.actors)if(r!==skip&&r.act&&r.act.type==='sevreact'&&r.act.sevKey===enc.k)endAct(r);SEVW={}}
function sevMissed(enc){const e=SEV1.find(x=>x.k===enc.k);if(!(e&&e.go))(S.sevMiss||(S.sevMiss={}))[enc.k]=1;/* 話がすすむ大事な会話（まもりをおぼえる など）は、また出す */const P=S.sevP||[],i=P.indexOf(enc.k);if(i>=0)P.splice(i,1);sevCancel(enc,null,!(e&&e.go))}
function sevInterrupted(r,a){if(a.reactUntil!=null&&JOYU.get(r)===a.reactUntil)JOYU.delete(r);const enc=SEV_ENCOUNTERS.get(S);if(enc&&enc.k===a.sevKey&&!enc.ready)sevCancel(enc,r)}
function sevEncounterSafe(enc,pre){return !isNight()&&sevTargetAlive(enc.target)&&enc.actors.every(r=>S.res.includes(r)&&(pre?sevAvailable(r)&&r.hunger>=400&&r.energy>=25&&!carryN(r)&&!r.cmat&&!r.meal:sevStay(r,enc))&&questVisitSafe(r,enc.target.y*W+enc.target.x))}/* pre：さそうとき（おなか・元気に余ゆうがあって、荷物を持っていない子だけ）。さそったあとは、おなか・元気が切れたときだけやめる */
function sevStay(r,enc){return !r.hidden&&r.hunger>=300&&!hungry(r)&&r.energy>=10&&!onHold(r)&&!HOLD.has(r.id)&&!!r.act&&r.act.type==='sevreact'&&r.act.sevKey===enc.k}
function sevPlans(actors,target){const used=new Set(),plans=[];for(const r of [...actors].sort((a,b)=>(b.name===target.who)-(a.name===target.who))){const G=bfs(r.x|0,r.y|0),occupied=occTiles(r);let stand=-1,best=Infinity;for(let yy=Math.max(0,target.y-1);yy<=Math.min(H-1,target.y+target.h);yy++)for(let xx=Math.max(0,target.x-1);xx<=Math.min(W-1,target.x+target.w);xx++){const inside=xx>=target.x&&xx<target.x+target.w&&yy>=target.y&&yy<target.y+target.h;if(inside&&r.name!==target.who)continue;const j=yy*W+xx;if(G.dist[j]<0||!walk(j)||used.has(j)||occupied.has(j))continue;const score=G.dist[j]*10+(yy<target.y?0.1:0);if(score<best){stand=j;best=score}}if(stand<0)return null;used.add(stand);plans.push({r,G,stand})}return plans}
function sevBegin(e,L){const actors=sevActors(L);if(!actors.length||actors.some(r=>!sevAvailable(r)))return false;for(const target of sevTargets(e,actors).slice(0,16)){const enc={k:e.k,actors,target,speaker:actors[0],L,ready:false,started:S.t};if(!sevEncounterSafe(enc,true))continue;const plans=sevPlans(actors,target);if(!plans)continue;for(const {r}of plans)endAct(r);SEV_ENCOUNTERS.set(S,enc);for(const {r,G,stand}of plans){startAct(r,G,'sevreact',stand,{sevKey:e.k});if(SEV_ENCOUNTERS.get(S)!==enc)return false}return true}return false}
function sevReactReady(enc){if(enc.ready||!sevEncounterSafe(enc))return;if(!enc.actors.every(r=>r.act&&r.act.type==='sevreact'&&r.act.sevKey===enc.k&&r.act.stage==='do'&&sevClose(r,enc.target)))return;enc.ready=true;enc.readyT=S.t;const now=performance.now();for(const r of enc.actors){const a=r.act,line=enc.L.find(l=>l[0]===r.name)||[],lk=lineLook(line[1]||'');a.reactMotion=lk.motion==='none'?(SEV_HAPPY.has(enc.k)?'joy':'nod'):lk.motion;a.reactAt=now;a.reactUntil=now+2400;const look=enc.target.who===r.name?enc.actors.find(q=>q!==r):null;r.face=(look?look.x:enc.target.x+enc.target.w/2)>=r.x?1:-1;if(a.reactMotion==='joy'){JOYU.set(r,a.reactUntil);JUMP.set(r,now);r.shine=now;r.bubble='😊'}else r.bubble=a.reactMotion==='shock'?'！':a.reactMotion==='think'?'💭':a.reactMotion==='sad'?'…':'♪'}if(enc.actors.some(r=>r.act.reactMotion==='joy'))sfxAt('good',enc.speaker.x,enc.speaker.y);SEVW[enc.speaker.name]=enc.k}
ACT.sevreact={start(r,a){const enc=SEV_ENCOUNTERS.get(S);if(!enc||enc.k!==a.sevKey||!sevClose(r,enc.target))return false;sevReactReady(enc)},tick(r,a){const enc=SEV_ENCOUNTERS.get(S);if(!enc||enc.k!==a.sevKey)return;if(enc.ready&&S.t-enc.readyT>30){sevMissed(enc);return}/* そろってから30分、話しかけられなかったら、この会話はもう出ない */if(!sevEncounterSafe(enc)||!enc.ready&&S.t-enc.started>30){sevCancel(enc);return}/* 30分たってもそろわないときは、やめる */sevReactReady(enc);if(a.reactMotion==='joy'&&!a.secondHop&&performance.now()-a.reactAt>=900){a.secondHop=true;JUMP.set(r,performance.now())}},done:(r,a)=>{const enc=SEV_ENCOUNTERS.get(S);return !enc||enc.k!==a.sevKey}};/* リアクションのあとも、話しかけられるまでその場で待つ */

/* 掛け合い会話は、話す子たちが近くにいるときだけ吹き出しを出す */
function sevNear(L){const ps=[...new Set(L.map(l=>l[0]).filter(n=>n&&n!==GOD&&n!==NUSHI1))].map(n=>S.res.find(r=>r.name===n)).filter(Boolean);for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(Math.hypot(ps[i].x-ps[j].x,ps[i].y-ps[j].y)>6)return false;return true}
const MAINGO=new Set(['storywait','fieldintro','fieldstory','fieldassist','fieldgather','fieldwait','nmeet']);
function mainGathering(){return S.res.some(r=>!r.hidden&&r.act&&MAINGO.has(r.act.type))}
function sevQuestBusy(){return !!QUEST_CLEAR_WAIT||Object.values(SUB_CLEAR_WAIT).some(w=>w&&!w.done)||Object.values(SUBW).some(k=>S.subSt&&S.subSt[k]===3)}
function sevBub(){SEVW={};if(!S)return;const P=S.sevP||[];for(let i=P.length-1;i>=0;i--)if(!SEV1.some(e=>e.k===P[i]))P.splice(i,1);
  {const D=S.sev||(S.sev={});for(let i=P.length-1;i>=0;i--){const k=P[i],e=SEV1.find(x=>x.k===k);let ok=true;try{ok=!e.at||!!e.at()}catch(_){}if(ok)continue;/* きっかけの条件（畑にいる・近くにいる など）がなくなったら、ピンクを引っこめる。またそろったら、出しなおす */const enc=SEV_ENCOUNTERS.get(S);if(enc&&enc.k===k)sevCancel(enc,null,false);P.splice(i,1);delete D[k]}}
  const ending=grassEndingEvent();let enc=SEV_ENCOUNTERS.get(S);{const m=typeof grassEndingTalk==='function'&&grassEndingTalk();if(m){const i=P.indexOf(m.k);if(i>=0)P.splice(i,1);if(enc&&enc.k===m.k){sevCancel(enc,null,false);enc=null}}}/* 古いセーブのピンク待ち（sevP の e09）は消す */if(enc&&ending&&enc.k!==ending.k){sevCancel(enc,null,false);enc=null;}if(enc&&(!P.includes(enc.k)||!sevTargetAlive(enc.target))){sevCancel(enc);enc=null}
  if(!ending&&mainGathering()){if(enc)sevCancel(enc,null,false);return}/* メインの会話・調べに向かっているあいだは、ピンクの会話を出さない */
  if(sevBusy()||!ending&&sevQuestBusy()||S.qStory!=null||isNight()||!ending&&S.sevTalkAt!=null&&S.t-S.sevTalkAt<180)return;
  if(enc){if(!sevEncounterSafe(enc)){sevCancel(enc);return}if(enc.ready){if(sevNear(enc.L)&&enc.actors.every(r=>sevClose(r,enc.target)))SEVW[enc.speaker.name]=enc.k;else sevCancel(enc)}return}
  const retry=SEV_RETRY.get(S)||{};for(const k of P){if(ending&&k!==ending.k)continue;if(retry[k]>S.t)continue;const e=SEV1.find(x=>x.k===k),L=sevLines(e.L);if(!L||!sevAllHere(e))continue;if(sevBegin(e,L))return;retry[k]=S.t+5}SEV_RETRY.set(S,retry)}
function pauseAfterPink(lines){S.sevTalkAt=S.t;S.sevQuietUntil=S.t+180;for(const [name]of lines){const r=S.res.find(r=>r.name===name);if(r)r.chatCD=Math.max(r.chatCD||0,S.sevQuietUntil)}}
function sevTalk(k){if(!$('#dialog').hidden)return;const enc=SEV_ENCOUNTERS.get(S);if(!enc||enc.k!==k||!enc.ready||SEVW[enc.speaker.name]!==k)return;const P=S.sevP||[],i=P.indexOf(k),e=SEV1.find(x=>x.k===k);if(i<0||!e)return;const L=sevLines(e.L);if(!L)return;P.splice(i,1);S.sevTalkAt=S.t;const actors=enc.actors.filter(r=>!r.hidden);if(actors.length){const tx=actors.reduce((v,r)=>v+r.x,0)/actors.length*TS,ty=(actors.reduce((v,r)=>v+r.y,0)/actors.length-.7)*TS;camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx,ty,t:0,dur:.6}}sevCancel(enc,null,false);sevBub();pauseAfterPink(L);for(const r of actors)r.chatCD=Math.max(r.chatCD||0,S.sevQuietUntil);/* ピンクの会話のあいだ、ふつうの会話は始めない */
  const run=()=>dialog(L,()=>{(S.sev||(S.sev={}))[k]=1;pauseAfterPink(L);if(e.go)e.go()});e.vis?visionFX(e.vis,run):run()}/* 最後まで見てから「見た」にする（途中でゲームをとじたら、はじめから） */
/* 消えたときの会話。null ならいつもの説明 */
const GVOICE=()=>godHere()?'':'……聞こえるかの？ 遠くから、声だけ届けておるぞい。';
const HOWK=n=>[[GOD,GVOICE()+backWhen(n)+n+'は、きっともどってくるぞい。']];
/* 「聞こえるかの？」は、会話の中でカミサマがはじめて話す行にだけつける */
function gvOnce(L){if(!L)return L;const v='……聞こえるかの？ 遠くから、声だけ届けておるぞい。';let first=true;return L.map(l=>{if(l[0]!==GOD||typeof l[1]!=='string')return l;const had=l[1].includes(v);let t=l[1].replace(v,'');if(first){first=false;if(!godHere()){const m=t.match(/^#[^|]*\|/),h=m?m[0]:'';t=h+v+t.slice(h.length)}}else if(!had)return l;const c=l.slice();c[1]=t;return c})}
function deathTalk(r){const L=deathTalk0(r);if(!L||!L.length)return L;const m=bestMate(r),lw=lastWord(r,m&&!m.hidden?m:null),ge=goneEntry(r.name);if(ge)ge.lw=lw[1];return gvOnce([lw].concat(L))}/* さいごに、消える子のひとこと */
function deathTalkMate(r,m){/* なかよしの子が話す：おどろき → 見た会話の思い出 → かなしみ。そのあとに、もどってこられるか（自然にかえるか）の説明だけ */const F=S.flags,n=r.name,L=deathMateLines(m,r),T=x=>[m.name,chatTone(x,m,2)],G0=WD===0,NH=G0&&sevHere('N')&&m.name!==MINA;
  if(isKey(n)){if(n===POKO)F.lostF=1;else if(n===MINA)F.lostN=1;else if(n===keyName('fire')&&F.guard){F.lostH=1;if(m.name===POKO)L[2]=[POKO,'#sigh|ぼく、守るって言ったのに……！ 葉っぱのまもり、もっと早く使えてたら……。']}else F['lostK'+r.elem]=1;
    if(!G0){F.deathTold=true;return L.concat([T('#think|……'+backWhen(n)+n+'は、もどってくるんだよね。……ずっと、待ってるからね。')])}
    const first=!F.deathTold;F.deathTold=true;
    if(first)L.push(n===POKO&&(NH||m.name===MINA)?[MINA,'#think|……フタバは、この土地にすっかりなじんでるからねぇ。消えても、土や草とのつながりが残ってるんだぁ。それをたどって、帰ってこられるよぉ。']:[GOD,'この土地に深くなじんだせいれいは、消えても土地とのつながりが残る。それをたどって、また帰ってこられるんじゃ。']);
    return L.concat(HOWK(n),[T('#think|……うん。帰ってくるまで、待ってるからね。')])}
  const m2=!F.death2Told;F.death2Told=true;if(G0)F.lostA=1;
  if(m2){if(G0){const NN=NH||m.name===MINA;L.push(NN?[MINA,'#think|……ふつうの子はねぇ、消えると、自然にかえるんだよぉ。自分の力だけでは、戻ってこられないんだぁ。']:[GOD,'#think|……ふつうのせいれいは、消えると自然にかえる。自分の力だけでは、戻ってこられんのじゃ。'],NN?[MINA,'#think|……あのねぇ。オオカゲが持ってる「めぶきのしずく」っていう、いのちの力があったら、またあえるかもしれないんだぁ。']:[GOD,'#think|……じゃが、オオカゲがためこんだ「めぶきのしずく」があれば、もう一度あえるかもしれん。あきらめるのは、まだ早いぞい。'])}
    else{const D=DEATHL2[elemKey(m)];if(D)L.push([m.name,D(n)[1]])}}
  return L.concat([T('#cry|……'+n+'のこと、ずっと、わすれないよ。')])}
function deathTalk0(r){const mt=bestMate(r);if(mt&&!mt.hidden&&S.res.includes(mt))return deathTalkMate(r,mt);/* なかよしの子がいれば、その子が話す */if(WD)return null;const F=S.flags,n=r.name,tell=k=>{const t=!F.deathTold;F.deathTold=true;return t?[[GOD,'この土地に深くなじんだせいれいは、消えても土地とのつながりが残る。それをたどって、また帰ってこられるんじゃ。']].concat(HOWK(n)):[]};
  if(n===POKO&&!F.lostF){const L=sevLines([['N','#worry hush|……フタバ、いなくなっちゃったねぇ。',1],['N','フタバは、この土地にすっかりなじんでるからねぇ。消えても、土や草とのつながりが残ってるんだぁ。それをたどって、帰ってこられるよぉ。',1],['N','ぼくがいるからねぇ。フタバが帰ってくるまで、いっしょに村を守ろうねぇ。',1],['H','#sigh|あいつ、最後までだれかを守ろうとしてたぜ。',1],['M','神殿に力を集めましょう。また会えるはずです。',1],['K','帰ってきたら、ちゃんと迎えてあげよう。',1]]);if(!L)return null;F.lostF=1;F.deathTold=true;return L.concat(HOWK(n))}
  if(!sevHere('F'))return null;
  if(n===MINA&&!F.lostN){F.lostN=1;F.deathTold=true;return sevLines([['F','#think hush|……ノドカ？ ねえ、ノドカ！'],['F','#think|……いつもみたいに、「だいじょうぶだよぉ」って言ってよ……。'],['F','#think|……やだよ。ぼく、またひとりになるの……？'],['G',GVOICE()+'フタバ。ノドカは、この土地に深くなじんでおる。土地とのつながりをたどって、神殿から帰ってこられるんじゃ。'],['G',backWhen(MINA)+'ノドカは、きっともどってくるぞい。'],['F',backFirst(MINA)?'#think|……ほんと？ じゃあ、ぼく……明日まで待ってる。':'#think|……ほんと？ じゃあ、ぼく……帰ってくるまで待ってる。']])}
  if(n===keyName('fire')&&F.guard&&!F.lostH){F.lostH=1;return sevLines([['F','#think hush|……うそ。$が……。'],['F','さっきまで、ぼくの前で、あんなに強く戦ってたのに……。'],['F','#sigh|ぼく、守るって言ったのに……！'],['F','葉っぱのまもり、もっと早く使えてたら……。'],['N','フタバがいっしょに守ろうとしたことは、なくならないよぉ。',1],['G',GVOICE()+'フタバ。そやつの勇気は、ちゃんと皆に届いておるぞい。','!N'],['F','#scared|……ううん、泣いてばかりじゃだめだ。$は、ぼくたちを守ってくれたんだもん。'],['F','#think|……うん。帰ってきたら、ちゃんと「おかえり」って言うんだ。']],n).concat(tell())}
  if(isKey(n)&&n!==MINA&&n!==POKO&&!F['lostK'+r.elem]){F['lostK'+r.elem]=1;return sevLines([['F','#worry|……$！？ ……いなくなっちゃったの？'],['F','いっしょに、もっといろんなことしたかったのに……。'],['F','#cry|まだ、ありがとうも言えてないよ……。'],['N','$も、フタバのこと、大事に思ってたよぉ。',1],['G',GVOICE()+'フタバ。神殿の力で、$はまた帰ってこられる。それまでは、みんなで村を守るんじゃ。','!N'],['F','#nod|……うん。帰ってくるまで、村を守ってるからね。']],n).concat(tell())}
  if(!isKey(n)&&!F.lostA){F.lostA=1;const L=sevLines([['F','#worry|……え？ $が、いなくなっちゃった……？'],['F','さっきまで、いっしょにいたのに……。'],['F','ぼく、もっとちゃんと見ててあげればよかった……。',0,'dim']],n);
    const NH=sevHere('N'),m2=!F.death2Told;F.death2Told=true;/* 話す子は、さいごまで同じ（とちゅうでカミサマがわりこまない） */
    L.push(NH?[MINA,'#think|……ふつうの子はねぇ、消えると、自然にかえるんだよぉ。自分の力だけでは、戻ってこられないんだぁ。']:[GOD,(GVOICE()||'#think|')+'……ふつうのせいれいは、消えると自然にかえる。自分の力だけでは、戻ってこられんのじゃ。']);
    L.push([POKO,'#think|……そっか。'],NH?[MINA,'#think|かえった子は、この土地の風や土になって、ずっとそばにいてくれるよぉ。']:[GOD,'#cry|かえった子は、この土地の風や土になって、そばにおる。……さみしいのう。'],[POKO,'ぼく、'+n+'のこと、忘れないよ。']);
    if(m2)L.push(NH?[MINA,'#think|……あのねぇ。オオカゲが持ってる「めぶきのしずく」っていう、いのちの力があったら、またあえるかもしれないんだぁ。']:[GOD,'#think|……そうじゃ、フタバ。オオカゲがためこんだ「めぶきのしずく」があれば、もう一度あえるかもしれん。あきらめるのは、まだ早いぞい。'])
    L.push([POKO,'#think|……みんな、ちゃんとごはんを食べて、休もうね。']);return L}
  return null}
function sevBack(n){if(WD||!S.flags)return;const Q=S.sevQ||(S.sevQ=[]),F=S.flags;if(n===POKO&&F.nushiWait&&!S.cleared){F.nushiWait=0;F.nushiDue=1;villageTimeout(()=>{if(!S.cleared)nushiReturns()},7000)}/* フタバがもどってから、ヌシ様がくる */
  if(n===MINA&&F.lostN&&!F.backN){F.backN=1;Q.push('b_N')}else if(n===POKO&&F.lostF&&!F.backF){F.backF=1;Q.push('b_F')}else if(n===keyName('fire')&&F.lostH&&!F.backH){F.backH=1;Q.push('b_H')}}
/* フタバの「こもれびのまもり」：マップのどこでも、「コワイノ」にねらわれている火の子を、はなれた所から葉っぱで守る（受けるダメージ半分）。見張り台の上からもつかう */
function atkFX(r,en){fxSpr('slash',en.x*TS,en.y*TS-6,null,en.x>=r.x?1:-1)}/* 攻撃：弧をえがく斬撃と火花 */
function leafFX(t){fxSpr('leafguard',t.x*TS,t.y*TS)}
const faceTo2=(f,t)=>{f.face=t.x>=f.x?1:-1};
function guardTick(){const fin=!WD&&!!(S.ns&&S.ns.final)&&isNight();if(WD||!(S.flags.guard||fin)||!S.enemies.length)return;const f=S.res.find(r=>r.name===POKO);if(!f||(f.act&&f.act.type==='faint')||f.hunger<250)return;
  if(f.gw){if(S.t<f.gw.t)return;const t=f.gw.tg;f.gw=null;if(S.res.includes(t)&&!t.hidden&&(t.shU||0)<=S.t){t.shU=S.t+40;if(fin)f.shU=S.t+40;f.gcd=S.t+75;leafFX(t);leafFX(f);if(qNow('guardUse'))S.flags.guardUsed=1;/* メインの「こもれびのまもり」：受けてから守った *//* ふだんは、守るのは火の子1人だけ */if(fin)for(const u of S.res){if(u===t||u===f||u.hidden||Math.hypot(u.x-t.x,u.y-t.y)>3)continue;u.shU=S.t+40;leafFX(u)}/* 最後の夜：守る子のまわり3マスの子もまとめて守る */addFloat(f.x,f.y-1,'こもれびのまもり！','#5fbf3f');sfx('bush');if(fin&&!S.flags.finF){S.flags.finF=1;S.flags.guard=true;}/* セリフは、ヨルノオオカゲが来たときのお話（e15）で言う */}return}/* ひとふりしてから発動（はなれていても、とどく） */
  if((f.gcd||0)>S.t)return;
  let best=null;const hk=keyName('fire');for(const t of S.res){if(t===f||t.hidden||(t.elem!=='fire'&&!fin)||(t.shU||0)>S.t)continue;if(!S.enemies.some(e=>!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<2.6))continue;const p=t.name===hk?0:1;if(!best||p<best[0])best=[p,t]}
  if(!best)return;f.gw={t:S.t+.8,tg:best[1]};if(!(f.act&&f.act.type==='sleep')){JUMP.set(f,performance.now());faceTo2(f,best[1])}}/* 最後の夜：フタバがみんなを守る */
function drawLeaf(r,now){const px=r.x*TS,py=r.y*TS;ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle='rgba(130,215,100,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,py+6,14,6,0,0,7);ctx.stroke();
  for(let i=0;i<5;i++){const a=now/450+i*1.2566,lx=px+Math.cos(a)*15,ly=py-4+Math.sin(a)*7;ctx.fillStyle=i%2?'#7ccf5a':'#a8e67f';ctx.beginPath();ctx.ellipse(lx,ly,3.6,1.9,a,0,7);ctx.fill()}ctx.restore()}
/* 次のステージへ、はじめて出発するとき：フタバとのお見送り */
/* クリアのあと（再会・木陰の話のあと）の、草原の村での出発：a) ヌシ様が守り神に話す → b) カミサマ「次は火山」 → c) フタバの力を受けつぐ → d) お見送り → e) 火山へ。
   どこまで見たかは S.flags.depStep（1:ヌシ様 2:カミサマ 3:受けつぎ）。おわりまで見たら S.flags.ret1（セーブごと）。とちゅうでとじたら、見おわっていない所から（昼だけ） */
const DEPART_NUSHI=[['U','守り神よ。少し、いいか。'],['U','かけらの中で眠っていたあいだも、声は、根をつたって届いていた。'],['U','土をよける音。石のぬくもり。根までしみる水。葉をゆらす風。'],['U','#think|……そして、わたしを呼ぶ、フタバの声。'],['U','そのそばには、いつも、おまえの光があった。'],['U','夜が来るたびに、この子らのそばに立ってくれたのだな。'],['U','ありがとう、守り神。この草原は、もう一度、息をしている。']];
let DEPART_RETRY=0;
function departDone(){return !!(S&&S.flags&&S.flags.ret1)}/* お見送りを見おわったか（セーブごと。前はブラウザ全体で1つだったので、草原をはじめからやりなおすと、お見送りと力の受けつぎがとばされていた） */
function departDue(){if(WD!==0||!S||S.free||!S.cleared||isNight()||departDone())return false;if(S.flags.sacredReunion&&!S.flags.sacredQuietSeen)return false;
  return S.res.some(r=>r.name===POKO&&!r.hidden)}
function departTick(){if(!departDue())return false;if(DEPART_RUN||NUSHI_RUN||performance.now()<DEPART_RETRY||!$('#dialog').hidden)return true;departScene();return true}/* 出発の場面がのこっているあいだは、クリア後のクエストを出さない */
function departToVolcano(){const ov=document.getElementById('deptLd');const L=loadStage(1);if(L&&L.introSeen){continueGame(L);if(ov){ov.style.opacity='0';setTimeout(()=>ov.remove(),900)}}else newGame(1)}
function departScene(){const owner=S,session=VILLAGE_SESSION,alive=()=>S===owner&&VILLAGE_SESSION===session,f=S.res.find(r=>r.name===POKO&&!r.hidden);if(!f)return;
  const gv=S.godVisit;S.godVisit=true;/* 見送りには、カミサマも村に来ている */
  const tw=S.obj.indexOf('tower'),TX=tw>=0?storyTreeX(tw):CX+.5,TY=tw>=0?storyTreeY(tw):CY;
  const A1=sevLines([['G','さあ、次は火山のふもとの村じゃ。そろそろ行くぞい。'],['G','#worry|あちらでは、影たちにヌシ様の熱をうばわれて、温泉も冷めてしもうたそうじゃ。せいれいたちが、こごえておる。'],['F','#think hush|……もう、行っちゃうんだね。'],['F','#think|……ほんとはね、行かないでって、言いたい。'],['F','#scared|あの夜、みんながぼくの前に立ってくれたから、ぼくは生きてる。だから、だれかがいなくなるのが、こわくて……。'],['U','フタバ。守り神は、いなくなるのではない。ほかの土地を助けに行くのだ。'],['F','#think|……うん。あの夜のぼくみたいな子が、待ってるかもしれないんだ。'],['F','ぼく、もうかくれてるだけじゃないよ。みんなのことは、ぼくが守るから！'],]),A1B=sevLines([['F','#think|……いってらっしゃい！ ちゃんと、ここで待ってるから！ でも、たまには帰ってきてね。ぜったいだよ？'],['G','#nod|うむ……。鼻の奥がつーんとしたわい。行ってくるぞい。'],
    ['N','ここは、ぼくたちにまかせてねぇ。',1],['H','安心して行ってこい。夜はおれたちが守るぜ。',1],['M','次の村のせいれいたちも、元気になりますように。',1],['K','フッ……最初は、なんとも素朴な村だと思ったけれど。',1],['K','今では、世界でいちばん心地よい風が吹く場所かもしれないね。きみの旅路に、いい風が吹きますように。',1],['K','……火の山の風、きっとあたためてきておくれ。',1],['U','この草原は、わたしたちが見守ろう。']]);
  const A2=sevLines([['F','#think hush|……いっちゃったね。',0,'nfG'],['N','#worry|……さみしいねぇ。',1],['F','#think|……うん。すっごく。'],['F','#think|……でも、ぼく、ここをきれいにして待ってるんだ。'],['F','#surprise|帰ってきたら、びっくりさせちゃうんだから……！']]);
  const hold=v=>{const n=performance.now();for(const r of S.res)RHOLD.set(r,v?n+300000:0)};
  const step=n=>{if(!alive())return false;S.flags.depStep=n;dirty=true;save();return true};/* その部分を見おわってから、1回だけ「見た」にする */
  const stop=()=>{DEPART_RUN=false;GODOUT=false;if(alive()){hold(false);S.godVisit=gv}};
  const finish=()=>{if(!alive())return;DEPART_RUN=false;GODOUT=false;hold(false);delete S.flags.depStep;S.flags.ret1=1;S.godVisit=gv;save();const ov=document.createElement('div');ov.id='deptLd';ov.style.cssText='position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:#1e1810;color:#fff3d6;font-size:16px;opacity:0;transition:opacity .8s';ov.textContent='火山のふもとの村へ…';document.body.appendChild(ov);requestAnimationFrame(()=>requestAnimationFrame(()=>{ov.style.opacity='1'}));villageTimeout(()=>requestAnimationFrame(()=>setTimeout(departToVolcano,50)),900)};/* 画面を暗くして「…へ」と出してから、つぎの土地を作る */
  const leave=()=>{if(!alive())return;/* 守り神とカミサマが、光になって空へのぼっていく */
    dlgCue('flash');const gx=godX()*TS,gy=godY()*TS;sfx('level');for(let k=0;k<3;k++)villageTimeout(()=>fxSpr('appear',gx,gy,'#fff6c8'),k*500);
    for(let k=0;k<4;k++)villageTimeout(()=>fx.push({k:'ring',x:gx,y:gy-40,life:1.4,col:'#fff6c8'}),k*350);
    camAnim={fz:cam.z,tz:Math.max(1.2,cam.z*.8),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:gx,ty:gy-70,t:0,dur:1.6};
    for(const r of S.res)if(!r.hidden){r.face=r.x<godX()?1:-1;JUMP.set(r,performance.now()+Math.random()*300)}
    villageTimeout(()=>{GODOUT=true;S.godVisit=false;sfx('arrive')},1100);
    villageTimeout(()=>{dialog(A2,finish,'出発する');villageTimeout(dlgNext,60)},3400)};
  const nu=S.nushi;if(nu){nu.x=TX+1.7;nu.y=TY+.95;nu.mv=0;nu.path=[];nu.dir=1;nu.face=-1}/* ヌシ様も、木のそばにいる */
  const farewell=()=>{if(alive())dialog(A1B,leave,'つぎへ')};
  const inherit=()=>{if(!alive())return;if(S.flags.areaSkill||(S.sev||{}).e16g||!S.res.includes(f)){step(3);return farewell()}const e=SEV1.find(x=>x.k==='e16g'),L=sevLines(e.L);if(!L){step(3);return farewell()}guardInherit(e,L,f,owner,session,()=>{if(step(3))farewell()})};
  const kami=()=>{if(!alive())return;if((S.flags.depStep||0)>=2)return inherit();dialog(A1,()=>{if(step(2))inherit()},'つぎへ')};
  const talk=()=>{if(!alive())return;if((S.flags.depStep||0)>=1)return kami();if(nu)centerOn(nu.x*TS,nu.y*TS);dialog(sevLines(DEPART_NUSHI),()=>{if(step(1))kami()},'つぎへ',NUSHI1)};
  DEPART_RUN=true;centerOn(TX*TS,TY*TS);gatherAt(TX,TY,()=>{if(!alive())return;if(isNight()){stop();DEPART_RETRY=performance.now()+5000;return}hold(true);villageTimeout(talk,400)},null,()=>{stop();DEPART_RETRY=performance.now()+20000})}/* 集まれなかったら、しばらくして集まるところから */
/* ふしぎな種：せいれいにあげると、能力のどれかが上がる（パワーの強化とは別） */
const UPK=[['atk','攻撃力'],['pow','はたらく速さ'],['spd','移動速度'],['sta','スタミナ'],['cap','持てる数']];
const UPINC={atk:[10,20],pow:[10,20],spd:[10,20],sta:[10,20],cap:[1,2]},SEEDMAX={atk:60,pow:60,spd:60,sta:60,cap:6};/* 強化・ふしぎな種で1回にふえる数：[75%で,25%で]。ふしぎな種でふやせる上限 */
function giveSeed(r){if((S.mseed||0)<1)return;const T=r.sst||(r.sst={}),L=UPK.filter(([k])=>(T[k]||0)<SEEDMAX[k]&&(k!=='atk'||r.elem==='fire'));/* 攻撃力は火の子だけ */if(!L.length)return toast(r.name+'は、これ以上ふしぎな種で強くならない');
  S.mseed--;const[k,nm]=pick(L),n=T[k]||0,U=UPINC[k],inc=Math.min(Math.random()<.75?U[0]:U[1],SEEDMAX[k]-n);T[k]=n+inc;
  if(k==='pow'||k==='spd'||k==='sta'){vrInt(r.vr);r.vr[k]=(r.vr[k]||0)+inc}
  RSC.delete(r);addFloat(r.x,r.y-1.6,nm+'+'+inc,'#9fe8ff');upFx(r,nm,'+'+inc,inc===U[1]);if(!S.mseed)sheetArg=null;renderSheet()}
/* 強化の演出：せいれいが喜んで、光とキラキラ */
const JOYU=new WeakMap(),STRAINU=new WeakMap(),RHOLD=new WeakMap(),DLGN=new Set();/* STRAINU：力をそそぐあいだの >< の顔 *//* HOLD：話している・喜んでいる間は作業を止める */
const onHold=r=>(RHOLD.get(r)||0)>performance.now()||DLGN.has(r.name)&&!document.getElementById('dialog').hidden;/* 画面だけの時間（セーブしない） */

/* 会話はせいれいの願い、図案はプレイヤーである守り神のひらめき。 */
const QUEST_INSPIRATIONS={"compost": ["composter"], "stor2": ["taru"], "mbox2": ["makidana"], "stor": ["crate"], "table": ["table"], "bed": ["bed"], "watch1": ["watch", "spike"], "wind": ["swing"], "wood6": ["campfire"], "flower50": ["campfire"], "shizukuRest": ["bench", "tub"], "ep1": ["bed"], "ep2": ["table", "swing", "sandbox"], "ep4": ["fountain"], "ep5": ["campfire"], "chair2": ["chair"], "bed3": ["bed"], "light3": ["torch"], "houselight": ["lantern"], "board": ["board"], "watch2": ["watch"], "toy2": ["sandbox"], "toy3": ["seesaw"], "swing1": ["swing"], "deco3": ["hedge"], "room": ["shelf1", "rug1", "curtain1"], "paint": ["paint2"], "trap4": ["spike", "puddle", "sticky"], "parasol": ["parasol"]};
const QUEST_INSPIRATIONS_CLEAR={"mbox": ["crate"], "stor2": ["kabebukuro"], "mbox2": ["niguruma"], "chair2": ["stool"], "wood6": [], "flower50": [], "shizukuRest": ["sink"], "ep1": ["crate", "rug1"], "ep2": [], "ep4": ["parasol"], "ep5": [], "bed3": ["rug1"], "light3": [], "houselight": [], "board": ["shelf1"], "watch2": ["signpost"], "toy2": [], "deco3": ["hedge"], "house2": [], "room": [], "paint": [], "waterFilm": ["tub"], "fish5": ["bench"], "parasol": []};
function questRecipeIds(q,phase='accept'){return [...new Set(phase==='clear'?(QUEST_INSPIRATIONS_CLEAR[q.k||q.id]||[]):[...(QUEST_INSPIRATIONS[q.k||q.id]||[]),...(q.learn||[]),...(q.talk&&q.talk.learn||[])])].filter(id=>!!BL[id]&&!(BL[id].offerOnly&&BL[id].kind==='furn'))}
function ideaDialogue(q,lines,phase='accept'){const ids=questRecipeIds(q,phase).filter(id=>!(S.guardianIdeas||{})[id]&&(!S.free||BL[id].kind!=='furn')),out=[];let put=false;for(const x of lines){if(x[0]==='@idea'){if(ids.length)out.push(['@idea',ids]);put=true}else out.push(x.slice())}if(!put&&ids.length)out.push(['@idea',ids]);return out}/* セリフの表の ['@idea'] の場所で、思いついた形を見せる（印がなければ、さいごに） */
function showGuardianIdea(ids,done){voiceStop();const overlay=document.createElement('div');overlay.className='idea-reveal';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','あたらしいかたち');const rays=document.createElement('div');rays.className='idea-rays';overlay.appendChild(rays);for(let k=0;k<18;k++){const star=document.createElement('span');star.className='idea-spark';star.textContent=k%3?'✦':'✧';const a=k*Math.PI*2/18;star.style.setProperty('--sx',Math.cos(a)*(120+k%4*45)+'px');star.style.setProperty('--sy',Math.sin(a)*(150+k%4*50)+'px');star.style.animationDelay=k%4*.08+'s';overlay.appendChild(star)}const card=document.createElement('div');card.className='idea-card';const symbol=document.createElement('div');symbol.className='idea-symbol';symbol.innerHTML=pxi('bulb');/* 絵文字ではなく、ドットのアイコン */const heading=document.createElement('h2');heading.textContent='あたらしいかたち';const list=document.createElement('div');list.className='idea-items';for(const id of ids){const item=document.createElement('div');item.className='idea-item';const img=document.createElement('img');img.src=iconURL(id);img.alt='';const name=document.createElement('span');name.textContent=BL[id].name;item.append(img,name);list.appendChild(item)}const button=document.createElement('button');button.type='button';button.className='btn pri';button.textContent='つづける';button.disabled=true;card.append(symbol,heading,list,button);overlay.appendChild(card);document.body.appendChild(overlay);sfx('level');let ended=false;const prior=document.activeElement;setTimeout(()=>{if(!overlay.isConnected)return;button.disabled=false;button.focus({preventScroll:true})},1300);button.onclick=()=>{if(ended||button.disabled)return;ended=true;overlay.remove();if(prior&&prior.isConnected)prior.focus({preventScroll:true});done()}}
function inspireQuest(q,phase='accept'){const ids=questRecipeIds(q,phase).filter(id=>!S.free||BL[id].kind!=='furn');if(!ids.length)return;
  const known=S.guardianIdeas||(S.guardianIdeas={});S.recipes||(S.recipes={});const fresh=ids.filter(id=>!known[id]);recipeNotice(fresh);ids.forEach(id=>{known[id]=true;S.recipes[id]=true});
}
const IDEA_SHOWN=new Set();/* 会話の中の「あたらしいかたち」の画面で、もう見せたレシピ（同じレシピを2回知らせない） */
function recipeNotice(ids){/* あたらしくおぼえたレシピを、大きな知らせで見せる。前のステージからもらった物・もう知らせた物・会話の中で見せた物は出さない */if(!S)return;const known=S.guardianIdeas||(S.guardianIdeas={});const L=[...new Set(ids||[])].filter(id=>BL[id]&&!known[id]&&!grec(id)&&!(S.free&&BL[id].kind==='furn'));if(!L.length)return;
  L.forEach(id=>known[id]=true);const nw=L.filter(id=>!IDEA_SHOWN.has(id));L.forEach(id=>IDEA_SHOWN.delete(id));if(!nw.length)return;sfx('level');queueItemGift(Object.fromEntries(nw.map(id=>[id,1])),'あたらしいレシピ！',true);memo('💡','あたらしいかたち：'+nw.map(id=>BL[id].name).join('・'))}
function otherModeFurnitureRecipes(){const known=new Set();for(const w of[0,1]){let d=LIVE&&LIVE[w];if(!d)try{const raw=KV.getItem(SAVE_KEYS[w]);if(raw)d=JSON.parse(raw)}catch(e){}if(!d||d.free)continue;syncQuestRecipes(d);for(const id of FURN)if((d.recipes||{})[id])known.add(id);if((d.recipes||{}).window)known.add('window')}return known}
function syncQuestRecipes(s){const shared=s.free?otherModeFurnitureRecipes():null,learn=(q,phase)=>{for(const id of questRecipeIds(q,phase)){if(s.free&&BL[id].kind==='furn')continue;(s.recipes||(s.recipes={}))[id]=true;(s.guardianIdeas||(s.guardianIdeas={}))[id]=true}};
  for(const id of FURN)if(!BL[id].offerOnly&&((s.inv||{})[id]||(s.obj||[]).includes(id)||(s.orders||[]).some(o=>o.type===id)||Object.values(s.win||{}).includes(id)))(s.recipes||(s.recipes={}))[id]=true;/* 旧セーブの所持・設置済み家具は既知の形として維持 */
  if((s.inv||{}).window||(s.obj||[]).includes('window')||(s.orders||[]).some(o=>o.type==='window')||Object.values(s.win||{}).includes('window'))(s.recipes||(s.recipes={})).window=true;
  const list=(s.world||0)===0&&!s.free?companionQuestList(s):(QL[s.world||0]||[]);list.forEach((q,i)=>{const done=i<s.quest&&s.qStory!==i,accepted=i<s.quest||i===s.quest&&s.qTalked;if(accepted)learn(q,'accept');if(done)learn(q,'clear')});
  for(const q of SUBQ){if(q.w!=null&&q.w!==(s.world||0))continue;const done=(s.subDone||{})[q.k];if(done||(s.subSt||{})[q.k]>=2||(s.subSeen||{})[q.k])learn(q,'accept');if(done)learn(q,'clear')}
  if(!s.free&&(s.lv||1)>=4){s.unlocked||(s.unlocked={});s.unlocked.window=true;(s.recipes||(s.recipes={})).window=true;(s.guardianIdeas||(s.guardianIdeas={})).window=true}
  if(s.free){if(shared.has('window')){(s.recipes||(s.recipes={})).window=true;(s.unlocked||(s.unlocked={})).window=true}else{delete(s.recipes||{}).window;delete(s.unlocked||{}).window}
    for(const id of FURN){if(shared.has(id)){(s.recipes||(s.recipes={}))[id]=true;(s.guardianIdeas||(s.guardianIdeas={}))[id]=true}else{delete(s.recipes||{})[id];delete(s.guardianIdeas||{})[id]}}}
}
/* クエスト達成の喜び：経路で対象のそばへ行く。会話や進行は自動で開かない。 */
const QUEST_VISIT_MAIN={"inn": ["bed"], "ashiyu": ["bench"], "statue": ["statue"], "kikyo": ["bellf"], "tower": ["tower"], "stor": ["crate"], "table": ["table"], "wall": ["hwall", "door"], "path": ["path"], "bed": ["bed"], "fence4": ["fence", "logfence", "bamboofence", "wall"], "watch1": ["watch", "spike", "puddle", "sticky"], "farm6": ["farm"], "imoseed": ["farm"], "wood6": ["clover", "bellf", "salvia", "lily", "lotus"], "springA": ["hotstone"], "shizukuRest": ["bench", "tub"], "ep1": ["hwall", "door", "bed"], "ep2": ["clover", "bellf", "salvia", "lily", "lotus", "table", "swing", "sandbox"], "ep4": ["fountain"], "ep5": ["campfire"]};
const QUEST_VISIT_SUB={"sticky1": ["sticky"], "puddle1": ["puddle"], "shishi1": ["shishiodoshi"], "takeakari1": ["takeakari"], "andonyogan": ["andon"], "benchwood": ["takebench"], "compost": ["composter"], "housefood": ["stor"], "yogan1": ["yogan"], "festdeco": ["hedge", "birdbath", "parasol", "arch", "signpost", "monstera"], "festlight": ["torch", "lamp", "campfire", "lantern", "candle"], "fence20": ["fence", "logfence", "bamboofence"], "lumber1": ["lumber"], "quarry1": ["quarry"], "stele1": ["stele"], "fountain1": ["fountain"], "lighthouse1": ["lighthouse"], "fruit1": ["fruit"], "stor2": ["taru"], "mbox2": ["makidana"], "seedwait_gate": ["gate"], "benchbreak": ["bench", "takebench"], "chair2": ["chair", "stool", "achair", "bench", "pouf", "sofa1"], "bed3": ["bed", "yorubed"], "light3": ["torch", "lamp", "campfire"], "houselight": ["candle", "lantern", "flamp"], "salvia3": ["salvia"], "watch2": ["watch"], "lotus3": ["lotus"], "lily5": ["lily"],  "clover3": ["clover"], "toy2": ["sandbox"], "toy3": ["seesaw"], "swing1": ["swing"], "deco3": ["hedge", "birdbath", "parasol", "arch", "signpost", "monstera"], "tree5": ["tree", "fruit"], "farm10": ["farm"], "house2": ["hwall", "door"], "room": ["@furniture"], "paint": ["@painting"], "trap4": ["spike", "sticky", "puddle", "firetrap", "gust"], "parasol": ["parasol"]};
const QUEST_PLACEMENTS=new WeakMap(),QUEST_VISITS=new WeakMap();let questPlaceSerial=0,QUEST_CLEAR_WAIT=null,SUB_CLEAR_WAIT={};const questGuideBlocked=()=>!!QUEST_CLEAR_WAIT||Object.keys(SUB_CLEAR_WAIT).some(k=>!!SUB_CLEAR_WAIT[k])||Object.keys(SUBW).length>0;const questGuideBlockedNow=()=>!!QUEST_CLEAR_WAIT;const questGuideAccepted=()=>{const q=S&&QUESTS[S.quest];return !!q&&!S.cleared&&S.qStory==null&&(!q.talk||S.qTalked)};
const QUEST_PARTS={
  /* 小さな目標ができるたびに、見にくる */
  'watch1':[[['watch'],()=>cnt('watch')>=1],[['spike'],()=>(S.placed.spike||0)>=2]],
  'kikyo':[[['bellf'],()=>bloomCount('bellf')>=2]],
  'shizukuRest':[[['bench'],()=>nearSp('bench')],[['tub'],()=>nearSp('tub')]],
  'ep1':[[['hwall','door'],()=>HOUSES.length>=1],[['bed'],()=>cnt('bed')>=2]],
  'ep2':[[['clover','bellf','salvia','lily','lotus'],()=>flowerN()>=10],[['table'],()=>cnt('table')>=1],[['swing','sandbox'],()=>CN(TOYS4)>=1]],
  'ep5':[[['campfire'],()=>cnt('campfire')>=1]]
};
function checkQuestParts(q){const parts=QUEST_PARTS[q.id];if(!parts)return;for(let i=0;i<parts.length;i++){const [ids,ready]=parts[i],partKey=(S.world||0)+':'+q.text+':'+i;if((S.questPartSeen||{})[partKey]||!ready())continue;
  if(S.res.some(r=>r.act&&r.act.partKey===partKey||(QUEST_VISITS.get(r)||[]).some(v=>v.partKey===partKey)))continue;
  queueQuestVisit(q,storyWho(q),ids,partKey);
}}
function questReplyWho(q){if(!q.k)return storyWho(q);const who=subWho(q);return firstSpk((q.X||[]).map(line=>[line[0]==='K'?who:line[0],line[1]]),who)}
function noteQuestPlacement(id,j){admireNote(id,j);let m=QUEST_PLACEMENTS.get(S);if(!m){m=new Map();QUEST_PLACEMENTS.set(S,m)}m.set(j,{id,n:++questPlaceSerial})}
function qvHas(j,id){return S.obj[j]===id||S.floor[j]===id}/* 見にくる物が、置いた物か、しいた床（あぜ道など）か */
function questVisitTarget(q,ids,j){if(ids.includes(S.floor[j]))return true;const o=S.obj[j];if(!o||o==='part'||!BL[o])return false;
  if(!ids.includes(o)&&!(ids.includes('@furniture')&&BL[o].kind==='furn')&&!(ids.includes('@painting')&&['paint1','paint2','paint3'].includes((S.win||{})[j])))return false;
  if(PLANTS.includes(o)&&isBud(j))return false;/* 花も木も、育ってから見にいく */
  if(q.id==='imoseed'&&imoSeedQuestPlots().length)return imoSeedQuestPlots().includes(j);
  if(q.k==='bed3'||q.k==='houselight'||q.k==='room'||q.id==='bed'&&o==='bed')return HOUSES.some(h=>h.inside.has(j));
  if(q.id==='shizukuRest')return nearHot(j,4);
  if(q.k==='chair2')return [-1,1,-W,W].some(d=>{const k=j+d;return k>=0&&k<W*H&&Math.abs(k%W-j%W)+Math.abs((k/W|0)-(j/W|0))===1&&TABLES.has(typeAt(k))});
  return true;
}
function queueQuestVisit(q,who,partIds,partKey){const ids=partIds||(q.k?QUEST_VISIT_SUB[q.k]:QUEST_VISIT_MAIN[q.id]);if(!ids)return null;
  const r=S.res.find(r=>r.name===who)||S.res.find(r=>r.name===(q.talk&&q.talk.who))||S.res.find(r=>(q.story||[]).some(line=>line[0]===r.name))||S.res.find(r=>!r.hidden)||S.res[0];if(!r)return;
  const recent=QUEST_PLACEMENTS.get(S),RG=bfs(r.x|0,r.y|0);let target=-1,best=-Infinity;
  for(let j=0;j<S.obj.length;j++){if(!questVisitTarget(q,ids,j)||questVisitStand(r,RG,j)<0)continue;/* そばに立てる物だけ見にいく（ベッドがかこまれていると、行けない） */const last=recent&&recent.get(j),score=(last&&qvHas(j,last.id)?last.n*100000:0)-Math.hypot(j%W+.5-r.x,(j/W|0)+.5-r.y);if(score>best){best=score;target=j}}
  if(target<0)return null;
  // メインの訪問は、未完了のサブの訪問より先に行う。中断したサブは後で再開する。
  if(!q.k&&!partKey&&r.act&&r.act.type==='questjoy'&&r.act.obj!==target)endAct(r);
  const id=ids.includes(S.floor[target])&&!ids.includes(S.obj[target])?S.floor[target]:S.obj[target],list=(QUEST_VISITS.get(r)||[]).filter(v=>v.obj!==target||v.id!==id);
  if(q.k||partKey)list.push({obj:target,id,partKey});else list.unshift({obj:target,id});QUEST_VISITS.set(r,list.slice(0,4));return{r,obj:target,id};
}
function settleQuestVisit(r,a){const waits=[];if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.r===r&&QUEST_CLEAR_WAIT.obj===a.obj)waits.push(QUEST_CLEAR_WAIT);for(const k in SUB_CLEAR_WAIT){const w=SUB_CLEAR_WAIT[k];if(w&&w.r===r&&w.obj===a.obj)waits.push(w)}if(a.partKey&&a.joyAt==null&&qvHas(a.obj,a.targetId)){const list=QUEST_VISITS.get(r)||[];if(!list.some(v=>v.partKey===a.partKey))list.push({obj:a.obj,id:a.targetId,partKey:a.partKey});QUEST_VISITS.set(r,list)}if(!waits.length)return;const arrived=a.joyUntil!=null&&performance.now()>=a.joyUntil&&qvHas(a.obj,a.targetId);
  for(const w of waits){if(arrived){w.done=true;if(w===QUEST_CLEAR_WAIT&&S.qStory===w.quest)QUEST_CLEAR_WAIT=null;continue}if(qvHas(a.obj,a.targetId)){const list=QUEST_VISITS.get(r)||[];if(!list.some(v=>v.obj===a.obj&&v.id===a.targetId))list.unshift({obj:a.obj,id:a.targetId});QUEST_VISITS.set(r,list)}else if(w===QUEST_CLEAR_WAIT)QUEST_CLEAR_WAIT=null;else for(const k in SUB_CLEAR_WAIT)if(SUB_CLEAR_WAIT[k]===w)delete SUB_CLEAR_WAIT[k]}}
function questVisitSafe(r,j){return !S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&(Math.hypot(e.x-r.x,e.y-r.y)<8||Math.hypot(e.x-(j%W+.5),e.y-((j/W|0)+.5))<8))}
function questVisitStand(r,G,j){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0,occupied=occTiles(r);let stand=-1,best=Infinity;
  for(let yy=Math.max(0,y-1);yy<=Math.min(H-1,y+z[1]);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(W-1,x+z[0]);xx++){
    if(xx>=x&&xx<x+z[0]&&yy>=y&&yy<y+z[1])continue;
    const k=yy*W+xx,d=G.dist[k];if(d<0||!walk(k)||occupied.has(k))continue;const score=d*10-Math.min(1,yy-y)*.1;if(score<best){best=score;stand=k}}
  return stand;
}
function questVisitReached(r,j){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0,dx=Math.max(x-r.x,0,r.x-(x+z[0])),dy=Math.max(y-r.y,0,r.y-(y+z[1]));return Math.hypot(dx,dy)<=1.05}
function questVisitOpen(G,j){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0;for(let yy=Math.max(0,y-1);yy<=Math.min(H-1,y+z[1]);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(W-1,x+z[0]);xx++){const k=yy*W+xx;if(G.dist[k]>=0&&walk(k))return true}return false}/* まわりに、歩いて行けるマスがあるか */
const partVisitStale=v=>{if(!v.partKey)return false;const m=/^\d+:sub:([^:]+):/.exec(v.partKey);if(m)return (S.subSt||{})[m[1]]!==2;return !v.partKey.startsWith((S.world||0)+':'+(QUESTS[S.quest]?.text)+':')};/* 目標がかわったら、前の目標の物は見にいかない。サブクエストの物（かまど）は、そのサブクエストを受けているあいだだけ見にいく */
function tryQuestVisit(r){const list=QUEST_VISITS.get(r);if(!list||!list.length||r.act&&(r.act.type==='questjoy'||MAINGO.has(r.act.type))||GATHER_HOLD||WELCOME_RUN)return false;/* なかまのお迎え・お見送り・メインのお話で集まっているあいだは、見にいかない（終わってから見にいく） */
  const v=list[0];if(!qvHas(v.obj,v.id)||partVisitStale(v)){list.shift();return false}
  if(r.hunger<300||hungry(r)||(r.visitRetryAt||0)>S.t||onHold(r)||HOLD.has(r.id)||!questVisitSafe(r,v.obj))return false;
  if(r.act&&['eat','fetch','flee','faint'].includes(r.act.type))return false;/* おなかがすいているとき以外は、ねむくても、すぐ見にいく */
  const G=bfs(r.x|0,r.y|0),stand=questVisitStand(r,G,v.obj);if(stand<0){if(!questVisitOpen(G,v.obj)){r.visitRetryAt=S.t+10;if(!v.told){v.told=1;toast(r.name+'が'+(BL[v.id]?BL[v.id].name:'')+'まで行けません','warn')}}return false}list.shift();/* 見にいけないときは、見たことにせず、知らせて、行けるようになるまで待つ */
  endAct(r);startAct(r,G,'questjoy',stand,{obj:v.obj,targetId:v.id,partKey:v.partKey});return true;
}
ACT.questjoy={start(r,a){if(!qvHas(a.obj,a.targetId)||!questVisitReached(r,a.obj))return false;const now=performance.now();a.joyAt=now;a.joyUntil=now+2400;if(a.partKey)(S.questPartSeen||(S.questPartSeen={}))[a.partKey]=true;JOYU.set(r,a.joyUntil);JUMP.set(r,now);r.shine=now;r.bubble='😊';r.face=a.obj%W+.5>=r.x?1:-1;sfxAt('good',r.x,r.y);
  const main=QUEST_CLEAR_WAIT;if(main&&main.r===r&&main.obj===a.obj&&!main.prompted){main.prompted=true;const q=QUESTS[main.quest];if(q&&q.story&&S.quest===main.quest){PAYOK=false;if(q.pay)for(const k in q.pay)S.mat[k]=Math.max(0,(S.mat[k]||0)-q.pay[k]);S.qTalked=false;S.qStory=main.quest;sfx('quest');logEv('目標「'+q.text+'」をたっせい');TALKW=questReplyWho(q);QUESTCLEARW=TALKW;if(/^lv\d/.test(q.id))focusQuestSpeaker(TALKW);renderQuest();renderPalette()}}
  for(const k in SUB_CLEAR_WAIT){const w=SUB_CLEAR_WAIT[k];if(!w||w.r!==r||w.obj!==a.obj||w.prompted)continue;const q=SUBQ.find(x=>x.k===k);if(!q)continue;w.prompted=true;(S.subArrived||(S.subArrived={}))[k]=true;S.subSt[k]=3;const reply=questReplyWho(q);if(reply)SUBW[reply]=k}
},
  tick(r,a){if(!a.secondHop&&performance.now()-a.joyAt>=900){a.secondHop=true;JUMP.set(r,performance.now())}},
  done:(r,a)=>!qvHas(a.obj,a.targetId)||performance.now()>=a.joyUntil||partVisitStale(a),/* 小さな目標を見にいくのは、その目標のあいだだけ */
  end(r,a){if(JOYU.get(r)===a.joyUntil)JOYU.delete(r)}};
function upFx(r,nm,txt,big){const now=performance.now();r.shine=now;if(!inBattle(r)){JOYU.set(r,now+2600);RHOLD.set(r,now+2600);r.bubble='😆';JUMP.set(r,now);setTimeout(()=>{if(S.res.includes(r)&&!inBattle(r))JUMP.set(r,performance.now())},900)}/* たたかっている子は、よろこばずに、そのままたたかう */
  fxSpr('levelup',r.x*TS,(r.y-.5)*TS);
  sfx('level');if(big)setTimeout(()=>sfx('good'),350);
  const o=$('#upfx');o.querySelector('.upt').style.backgroundImage='url('+spiritPort(r.elem,120,r.vr)+')';o.querySelector('.utt').textContent=r.name+'の'+nm;const u=o.querySelector('.unn');u.textContent=txt+(big?'！！':'！');u.classList.toggle('big',!!big);
  o.querySelectorAll('i').forEach(e=>e.remove());for(let n=0;n<(big?18:12);n++){const e=document.createElement('i'),a=n/(big?18:12)*6.28,d=110+Math.random()*60;e.textContent=pick(['✨','⭐','💫','✨']);e.style.setProperty('--dx',Math.cos(a)*d+'px');e.style.setProperty('--dy',Math.sin(a)*d+'px');e.style.animationDelay=(Math.random()*.25)+'s';o.appendChild(e)}
  o.hidden=false;const rays=o.querySelector('.rays');rays.style.animation='none';void rays.offsetWidth;rays.style.animation='';clearTimeout(upFx.t);const end=()=>{o.hidden=true};upFx.t=setTimeout(end,1800);o.onclick=()=>{clearTimeout(upFx.t);end()}}
function howBtn(r,how){if(!how)return;const b=el('<button class="btn" style="min-width:34px;padding:4px 0;border-radius:50%">？</button>');b.onclick=()=>{const o=el('<div style="position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:16px 18px;max-width:340px;width:100%;animation:sup .18s ease-out"><b style="display:block;margin-bottom:8px"></b><p style="margin:0 0 14px;white-space:pre-line;line-height:1.7;font-size:14px"></p><button class="btn" style="width:100%">とじる</button></div></div>');o.querySelector('b').textContent='やりかた';o.querySelector('p').textContent=how;o.onclick=e=>{if(e.target===o||e.target.tagName==='BUTTON')o.remove()};$('#upfx').parentNode.appendChild(o);sfx('tap')};r.appendChild(b)}/* やりかたは「？」でポップアップ */
function subSec(body,main){const D=S.subDone||{},St=S.subSt||{},L=subList().filter(q=>St[q.k]>=2),on=L.filter(q=>!D[q.k]).sort((a,b)=>(St[b.k]===3)-(St[a.k]===3)),dn=L.filter(q=>D[q.k]);
  const sec=(h)=>{const f=el('<div class="sec"><h3></h3><div class="rows"></div></div>');f.querySelector('h3').textContent=h;body.appendChild(f);return f.querySelector('.rows')};
  {const rw=sec('すすめているもの');let n=0;
    if(main&&!S.cleared&&S.quest<QUESTS.length){const q=QUESTS[S.quest];{const wt=(S.qStory!=null||q.talk&&!S.qTalked)&&mainTalkWaitText(q);if(wt){const sq=S.qStory!=null?QUESTS[S.qStory]:q;rw.appendChild(rowEl('メイン：'+sq.text,wt));n++}}/* 会話・お礼を待っているときも、止まっている理由を出す */
    if(S.qStory==null&&!(q.talk&&!S.qTalked)){const wn=questWaitNote(q),r=rowEl('メイン：'+q.text,(q.prog?q.prog():'')+(wn?'　'+wn:''));howBtn(r,q.how);rw.appendChild(r);n++;
      for(const st of q.steps||[]){const ok=!!st.check(),sr=rowEl((ok?'✓ ':'・')+st.t,ok?'':st.prog?st.prog():'');if(ok)sr.classList.add('done');else howBtn(sr,st.how);sr.style.marginLeft='14px';rw.appendChild(sr)}}}/* 受けるまでは見せない。まとめた目標は、小さな目標ごとに、できた・まだを出す */
    for(const q of on){const r=rowEl('サブ：'+q.t,St[q.k]===3?'たっせい！ '+subWho(q)+'に話しかけよう':St[q.k]===2&&isNight()&&(()=>{try{return q.ok()}catch(e){return false}})()?'たっせい！ 朝を待とう':(q.n?'いま '+Math.min(q.n,q.now())+' / '+q.n:'')+(q.rw?(q.n?' / ':'')+'ごほうび パワー+'+q.rw:''));howBtn(r,q.how);
      if(q.pay){const b=el('<button class="btn pri" style="flex:none;padding:6px 12px">わたす</button>'),en=St[q.k]===2&&!q.ok()&&Object.keys(q.pay).every(k=>(S.mat[k]||0)>=q.pay[k]);const nt=Object.keys(q.pay).map(k=>MATN[k]+' '+Math.min(S.mat[k]||0,999)+'/'+q.pay[k]).join('　');const sm=r.querySelector('small');if(sm)sm.textContent=(sm.textContent?sm.textContent+'　':'')+'いまの素材：'+nt;b.disabled=!en;b.onclick=()=>{if(St[q.k]!==2||q.ok()||!Object.keys(q.pay).every(k=>(S.mat[k]||0)>=q.pay[k]))return;for(const k in q.pay)S.mat[k]-=q.pay[k];S.flags.board5=true;checkSub();renderSheet()};r.appendChild(b)}
      rw.appendChild(r);n++}
    if(!n)rw.appendChild(rowEl('いまは、なし',''))}
  const md=main?QUESTS.slice(0,Math.min(S.quest,QUESTS.length)).filter(q=>!(WD===0&&q.id==='mbox')).map(q=>'メイン：'+q.text).reverse():[];
  if(md.length||dn.length){const rw=sec('達成済み');for(const t of [...dn.slice().reverse().map(q=>'サブ：'+q.t),...md]){const r=rowEl('✓ '+t,'');r.classList.add('done');rw.appendChild(r)}}}
function migrateVolcanoQuests(s){/* 火山のクエストを、草原とちがう物にかえた：古いセーブの番号・とちゅうのクエストを、名前で読みかえる（1回だけ） */
  s.flags=s.flags||{};if(s.flags.vq1)return;s.flags.vq1=1;if(s.free)return;const w=s.world||0;
  if(s.aq!=null){if(w===1){s.aq=AFTERQ.findIndex(q=>q.w===1);s.aqOn=-1;s.aqB=null}/* 火山：前のクリア後のおねがいは、火山だけの物におきかえる */else{if(s.aqOn!=null&&s.aqOn>=0)s.aqOn=s.aqOn>=1?s.aqOn-1:-1;s.aq=Math.max(0,s.aq-1)}}/* 草原：いちばん前の（火山だけの）おまつりをけしたぶん、ずらす */
  if(w!==1)return;
  const ix=id=>QUESTS2.findIndex(q=>q.id===id),map=i=>{if(i==null)return i;const id=QUESTS2_V1[i];if(id==null)return i-(QUESTS2_V1.length-QUESTS2.length);return ix(id==='heatPath'?'haikage3':id)};
  const oldQ=QUESTS2_V1[s.quest],oldS=s.qStory!=null?QUESTS2_V1[s.qStory]:null;s.quest=map(s.quest);if(s.qStory!=null)s.qStory=map(s.qStory);
  if(oldS&&['food3','haikage3','fire3','inn'].includes(oldS)){s.qStory=null;s.qTalked=true}/* お礼の会話を待っていた、かわったクエスト：新しい目標をやってから */
  const cur=QUESTS2[s.quest]&&QUESTS2[s.quest].id;const t=s.st2||(s.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw:[]});
  if(cur==='food3'&&s.qTalked&&t.tkBase==null){t.tkBase=t.tkGot||0;s.flags.tkSpawn=1}/* たけのこを、あとで生やす */
  if(cur==='inn'&&s.qTalked){s.flags.lv_onsen=true;(s.recipes||(s.recipes={})).onsen=true}/* 宿の話を聞いたあと：露天ぶろを建てられるように */
  if(oldQ==='heatPath'&&!s.qTalked&&!s.flags.ashOn)s.flags.ashOn=true;
  const St=s.subSt||{},D=s.subDone||(s.subDone={});for(const k of['chair2','light3','lv_toy2','toy2','deco3','tree5','food40','room','paint','compost','fish5','lv_parasol','parasol','trap4','fbench2','fbed2','twbox1','yoganup']){if(D[k])continue;if(St[k]===3){St[k]=4;D[k]=1;s.pt=(s.pt||0)+10;s.totalPt=(s.totalPt||0)+10}/* 報告まちだった物は、たっせいにする */else{delete St[k];if(s.subSeen)delete s.subSeen[k];if(s.subB)delete s.subB[k];if(s.subArrived)delete s.subArrived[k]}}}
const freeHere=()=>FREEG.filter(g=>g.w==null||g.w===WD);/* その土地のやりこみ */
function checkFree(){if(!S.cleared)return;const D=S.freeDone||(S.freeDone={});for(const g of freeHere())if(!D[g.k]&&g.ok()){D[g.k]=1;S.pt+=g.rw;S.totalPt+=g.rw;toast('目標たっせい：'+g.t+'（パワー+'+g.rw+'）','good');memo('🎯',g.t)}}
const DAYEV={hosaku:['🌾','豊作の日','収穫がひとつ多い'],oshaberi:['💬','おしゃべりの日','おしゃべりがはずむ。おしゃべり1回のパワー+0.9'],odayaka:['🌙','おだやかな夜','今夜の「コワイノ」が半分'],kaze:['🍃','風の強い日','ふしぎな種が3〜6こ落ちてくる'],kami:['⛩️','カミサマの訪問日','カミサマが遊びにくる'],hoshi:['✨','星空の夜','3時に寝ているせいれいのたのしさ+15'],mono:['🎁','ものひろいの日','村のあちこちに落とし物がある']};
function killsSince(){/* 「夜をこえて、つよくなろう」：クエストが出てから追いはらったコワイノの数 */if(S.flags.kb==null)S.flags.kb=S.kills||0;return (S.kills||0)-S.flags.kb}
function kgOpen(j){/* かげのあとが見えるか：そのマスと、左右・手前の5マスに物がない（草・茂み・木の下にかくれない） */const x=j%W,y=(j/W)|0;if(x<1||x>=W-1||y>=H-1)return false;for(const k of[j,j-1,j+1,j+W-1,j+W,j+W+1])if(S.obj[k])return false;return !(S.floor&&S.floor[j])&&S.ground[j]===0&&walk(j)}
function kgPlace(){/* 大きなかげのあと：村の南のはしの、まわりの空いた地面（なるべく草地）に出す */for(const g of[2,1,0]){let best=-1,by=-1,bx=1e9;for(let j=0;j<W*H;j++){if(!VILL[j]||(g>=1?!kgOpen(j):S.obj[j]||(S.floor&&S.floor[j])||S.ground[j]!==0||!walk(j))||g===2&&!REV.has(j))continue;const y=(j/W)|0,dx=Math.abs(j%W-CX);if(y>by||y===by&&dx<bx){by=y;bx=dx;best=j}}if(best>=0){S.flags.kgMark=best;return}}}
function morning(){sfx('morning');troubleMorning();if(S.cleared&&S.daily)dailyCheck();/* 夜のうちのたっせいも、朝にかぞえる */S.oracle=null;finalCheck();if(S.bud){let nb=0;for(const j in S.bud)if(S.bud[j]<=callDay()){delete S.bud[j];nb++}if(nb){recount();dirty=true}}S.res.filter(r=>r.comfy===dayNo()).forEach(r=>addFloat(r.x,r.y-1.4,'ぐっすり！','#d8f5c0'));{const L=S.res.filter(r=>r.crowd===dayNo());if(L.length){L.forEach(r=>{r.bubble='😣';addFloat(r.x,r.y-1.4,'きゅうくつだった…','#ffd2cc')});toast('家がきゅうくつで、よく眠れなかったせいれいがいる','warn')}}
  if(S.regrow&&S.regrow.length){let ch=false;S.regrow=S.regrow.filter(g=>{if(g.day!=null?dayNo()<g.day:S.t<g.t)return true;if(!S.obj[g.j]&&!S.floor[g.j]&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===g.j)){S.obj[g.j]=g.id;ch=true;return false}return true});if(ch)recount()}
  for(const k in S.dyn){const o=S.obj[k],d=S.dyn[k];if((o==='berry'||o==='fruit')&&d&&d.g<100){d.g=Math.min(100,d.g+25);continue}/* ベリー・りんごは4日（朝ごとに25） */if(o!=='farm')continue;if(d.sown===false){d.wet=0;continue}if(d.wet>0&&d.g<100)d.g=Math.min(100,d.g+100/((CROPS[d.crop]||CROPS.mugi).days)*(warmSet().has(+k)?1.5:1)*(d.gw||1));/* あたたかい畑：育つ速さ+50% */delete d.gw;d.wet=0}
  if(WD===1){takenokoMorning();eruptMorning();gearMorning();veinMorning();visitMorning()}weedMorning();webMorning();
  if(cnt('bell')>0){BELLRING=performance.now();{const j=S.obj.indexOf('bell');if(j>=0)bellRing(j%W+1,((j/W)|0)+1)}for(const r of S.res)if(!r.hidden)r.fun=Math.min(100,r.fun+15)}/* 村の鐘：朝に鳴って、たのしさ+15（いくつあっても1回） */
  {const wr=S.rain;S.rain=Math.random()<.22;weatherMorning(wr)}/* 雨のつぎの朝は、虹が出ることがある */
  S.today=null;if(S.enemyOn&&dayNo()>=3&&Math.random()<.4){const ks=Object.keys(DAYEV).filter(k=>k!=='kami');const k=pick(ks),E=DAYEV[k];S.today=k;/* 日替わりのできごと */
    setTimeout(()=>toast('きょうは「'+E[1]+'」：'+E[2],'good'),1200);memo(E[0],'きょうは「'+E[1]+'」');
    if(k==='kami'){S.godVisit=true;S.godNextVisitDay=dayNo()+2;}
    if(k==='mono')monoDrops(4)}
  if(S.rain)toast('今日は雨');
  {const d=dayNo(),ev={6:[[MINA,'#alarm|村が大きくなってきたねぇ。…でも、夜の「コワイノ」も、前より多い気がするよぉ。'],[POKO,'#nod|にぎやかになるほど、よってくるのかな…。']],
}[d];
   if(ev&&S.enemyOn&&!S.flags['day'+d]){const L=ev.filter(l=>S.res.some(r=>r.name===l[0]));if(L.length)talkOnce('day'+d,L)}/* さいごまで見てから「見た」に */}
  checkFree();
  summonMorning();
}

/* 虹：雨のつぎの朝に出ることがある。S.rbDay：虹の日 */
const rainbowToday=()=>!!S&&S.rbDay===dayNo()&&!S.rain;
const RB_FUN=.5;/* 虹の日：たのしさのへりかた0.5倍 */
function weatherMorning(wasRain){/* morning() の雨を決めたあと */
  if(!IS_STORY_REPLAY&&wasRain&&Math.random()<.5){S.rain=false;S.rbDay=dayNo();setTimeout(()=>toast('雨あがりの空に、虹が出ている','good'),900)}}
/* 草原のメイン「木のなかまと花畑」（wood6）：えらんだ「ヌシ様に見せたい花」（S.flags.choice.nushiFlower）を、御神木のそば（FIELD_NEAR_R）に5本咲かせる。
   咲いたら、木のせいれいが1人ずつ世話をしにいく（S.flags.flTend：世話をした子の id。この依頼のあいだにした世話だけ）。5人が世話をおえたら、花畑が満開になる */
const WFL_N=5,WFL_TEND=5,WFL_AT=3,WFL_NAME={bellf:'ききょう',lily:'ゆり',clover:'シロツメクサ'};
const wflKind=()=>S&&S.flags.choice&&S.flags.choice.nushiFlower||'bellf',wflName=()=>WFL_NAME[wflKind()]||BL[wflKind()].name;
function wflOn(){return !!S&&WD===0&&!S.free&&!IS_STORY_REPLAY&&QUESTS[S.quest]?.id==='wood6'&&S.qTalked&&S.qStory==null}
function wflCells(){/* 御神木のそばで咲いている、えらんだ花 */const j=S.sacredRoot;if(j==null)return [];const id=wflKind(),R=FIELD_NEAR_R,n=sacredSpan()+R*2,x0=j%W-R,y0=(j/W|0)-R,L=[];
  for(let b=0;b<n;b++)for(let a=0;a<n;a++){const x=x0+a,y=y0+b;if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x;if(S.obj[k]===id&&!isBud(k))L.push(k)}return L}
const wflN=()=>Math.min(WFL_N,wflCells().length),wflT=()=>S&&S.flags.flTend||[],wflTN=()=>Math.min(WFL_TEND,wflT().length);
function wflWant(r){if(!wflOn()||isNight()||r.elem!=='wood'||r.hidden)return false;const T=wflT();return T.length<WFL_TEND&&!T.includes(r.id)&&S.res.filter(q=>q!==r&&q.act&&q.act.type==='fltend').length<WFL_AT&&wflCells().length>=WFL_N}/* 3人まで同時に */
function wflJob(r,G){if(!wflWant(r))return false;if(!S.unlocked[wflKind()])S.unlocked[wflKind()]=true;/* えらんだ花は、カミサマのお店でも買える */const C=wflCells().filter(c=>free('fl'+c,1)),ad=(k,c)=>Math.abs(k%W-c%W)+Math.abs((k/W|0)-(c/W|0))===1;
  const st=nearest(G,k=>walk(k)&&!S.obj[k]&&C.some(c=>ad(k,c)),9999);if(st<0)return false;const c=C.find(c=>ad(st,c));startAct(r,G,'fltend',st,{key:'fl'+c,obj:c});return true}/* 同じ花には1人ずつ */
