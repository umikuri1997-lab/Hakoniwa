'use strict';
/* せいれいどうしのなかよし：S.bond（2人の id を小さい順に「a_b」）→ 0〜100。
   ふえる：同じ遊び家具でいっしょに遊ぶ+1・おしゃべり+1.5・同じ食卓でいっしょに食べる+1・同じ夜にいっしょに守る+1（1晩1回）。
   30：なかよし（2人のピンクの会話が1回）。60：遊ぶときに、なかよしをさそう。100：3マス以内にいるとはたらく速さ+5%（重複なし）。
   思い出帳の再生（IS_STORY_REPLAY）では、ふやさない。 */
const BOND_TALK=30,BOND_PLAY=60,BOND_MAX=100;
const BOND5=new Set();/* なかよし100の子が3マス以内にいる子（毎秒つくりなおす） */
function bondKey(a,b){return a.id<b.id?a.id+'_'+b.id:b.id+'_'+a.id}
function bondOf(a,b){return a&&b&&a!==b&&S&&S.bond?S.bond[bondKey(a,b)]||0:0}
function bondAdd(a,b,n,kind){if(!S||!a||!b||a===b||IS_STORY_REPLAY)return;if(kind)(S.bondDid||(S.bondDid={}))[bondKey(a,b)]=kind;/* 2人でさいごにしたこと（消えたときの思い出） */const B=S.bond||(S.bond={}),k=bondKey(a,b),v0=B[k]||0,v=Math.min(BOND_MAX,v0+n);if(v===v0)return;B[k]=v;
  if(v0<BOND_TALK&&v>=BOND_TALK){for(const x of[a,b])addFloat(x.x,x.y-1.4,'なかよし！');memo('🤝',a.name+'と'+b.name+'がなかよしになった');logEv(a.name+'と'+b.name+'がなかよしになった');SPOT_POPS.push({bond:[a.name,b.name],pair:[a,b].map(r=>({el:r.elem,vr:r.vr})),state:S});omoiNote(a,b,false)}
  else if(v0<BOND_PLAY&&v>=BOND_PLAY)omoiNote(a,b,true)}
function bondSet(a,b,n){if(bondOf(a,b)<n)bondAdd(a,b,n-bondOf(a,b))}
/* 草原のメイン「なかよしの想い」（omoi）：なかよしの組を数える（S.flags.omoiP）。依頼を受ける前から、なかよしの組も、御神木へ行く組になる（omoiSeed：なかよしの数の大きい組から、3組まで） */
function omoiOn(){return !!S&&WD===0&&!S.free&&!IS_STORY_REPLAY&&typeof QUESTS!=='undefined'&&QUESTS[S.quest]?.id==='omoi'&&S.qTalked&&S.qStory==null}
function omoiN(){return (S&&S.flags.omoiP||[]).length}
function omoiNote(a,b,deep){if(!omoiOn())return;const L=S.flags.omoiP||(S.flags.omoiP=[]),Q=S.flags.omoiW||(S.flags.omoiW=[]),k=bondKey(a,b);if(L.length+Q.length>=3||L.includes(k)||Q.includes(k))return;
  Q.push(k);sfx('bush');toast(a.name+'と'+b.name+'が、御神木に会いにいきたそう','good');renderQuest();dirty=true}/* 数えるのは、2人が御神木へ行く場面を見おえてから（omoiScene） */
/* なかよしの想いの場面：御神木（青いふきだし）をタップすると、待っている2人が根もとへ歩いて行き、それぞれの属性のしかたで木の世話をする。2人の光がひとつになって、枝のあかりになり（omoiLight・drawOmoiLamps）、2人がひとことずつ話す。
   会話を最後まで聞いたら1組に数える（S.flags.omoiP）。夜・コワイノが近い・2人のどちらかが村にいないときは、はじめない。とちゅうでやめたら、待っている組のまま */
const OMOI_CARE={wood:['storyOffer','touch'],water:['storyPour','water'],fire:['storyStone','stone'],earth:['storySoil','soil'],wind:['storyWind','wind']};
/* 御神木の前のひとこと：その子の言いかたで、いくつか用意して、ぜんぶ出しおわるまで同じ物を出さない（pickFresh。同じ場面の2人も、べつのセリフ） */
const OMOI_VOICE={[POKO]:['#joy|{P}と、いっしょに来たかったんだ。','{P}とならんで歩くとね、足が、かってにはずむんだ。','#joy|この木にね、{P}のこと、おしえてあげたかったんだ。','{P}のとなりは、ひなたみたいに、あったかいんだ。'],
 [MINA]:['ふたりで来るとねぇ、なんだか、あったかいねぇ。','{P}といるとねぇ、土まで、にこにこしてる気がするよぉ。','#joy|{P}のこと、この木にも、見せてあげたかったんだぁ。','いそがなくていいよぉ。{P}と、ゆっくり見ていこうねぇ。']};
const OMOI_KEYV={fire:['#joy|へへっ、{P}となら、どこへだって行けるぜ。','{P}は、おれが守る。……木のまえで言うと、てれるな。','{P}は、いいやつだぜ。おれが言うんだ、まちがいねえ。','#joy|{P}がとなりにいると、火が、いつもよりあったけえんだ。'],
 water:['{P}さんといっしょに来られて、うれしいです。','{P}さんのそばは、しずかな水面みたいに、心がおちつきます。','#joy|この木に、{P}さんのことを、つたえたかったんです。','{P}さんと歩いた道は、ぜんぶ、おぼえています。'],
 wind:['フッ…{P}となら、悪くないね。','フッ…風は気まぐれだけど、{P}のそばには、よく吹くんだ。','{P}と来ると、葉ずれの音まで、やさしく聞こえるよ。','フッ…{P}。きみといると、どこへも行きたくなくなるね。']};
const OMOI_ELV={wood:['#joy|{P}といっしょだと、花がもっときれいに見えるね。','{P}とね、この木が大きくなるの、ずっと見ていたいな。','#joy|{P}と、なかよしになったんだよ。木にも、聞こえたかな。','{P}のとなりにいると、葉っぱが、ぴんってなるんだ。'],
 water:['お水、{P}とふたりで、あげたよ。','{P}といるとね、心が、すうっと、すんでいくんだ。','#joy|{P}と見る水たまりは、空がふたつ分、うつるよ。','この木も、{P}のこと、好きになってくれるかな。'],
 fire:['あったかい？ {P}がとなりにいるから、ぽかぽかなんだ。','#joy|{P}といると、むねの火が、ぱちぱちするよ。','{P}のことは、ぼくが、あっためるからね。','{P}って、すごくたのもしいんだよ。木にも、おしえたくて。'],
 earth:['土、ふかふかにしたよ。{P}とふたりで。','{P}といると、足もとが、しっかりする気がするんだ。','#joy|この根っこみたいに、{P}と、ずっとつながっていたいな。','{P}と来ると、土のにおいまで、うれしそうだよ。'],
 wind:['葉っぱが、くすぐったそうにゆれてる。{P}も、見て。','#joy|{P}といっしょだと、風が、うたってるみたいなんだ。','{P}とならね、どこまでも歩いていけそうだよ。','{P}のいいところ、ぜんぶ、風にのせて木にとどけたよ。']};
function omoiLine(r,p){const key=keyName(r.elem)===r.name,L=OMOI_VOICE[r.name]||(key?OMOI_KEYV[r.elem]:null)||OMOI_ELV[r.elem]||OMOI_ELV.wood;return [r.name,pickFresh('omoi:'+(OMOI_VOICE[r.name]||key?r.name:r.elem),L).replace('{P}',p.name)]}
function omoiSeed(){/* いままでに、なかよしになっている組も、御神木へ行く組にする（村にいる2人だけ） */if(!omoiOn()||!S.bond)return;const L=S.flags.omoiP||(S.flags.omoiP=[]),Q=S.flags.omoiW||(S.flags.omoiW=[]);if(L.length+Q.length>=3)return;
  const C=Object.keys(S.bond).filter(k=>S.bond[k]>=BOND_TALK&&!L.includes(k)&&!Q.includes(k)&&bondPair(k)).sort((a,b)=>S.bond[b]-S.bond[a]);if(!C.length)return;for(const k of C){if(L.length+Q.length>=3)break;Q.push(k)}renderQuest();dirty=true}
const omoiWait=()=>omoiOn()&&(S.flags.omoiW||[]).length>0;
let OMOI_RUN=null;/* いまの場面（かさねてタップしても1回。保存しない） */
function omoiScene(j){
  if(OMOI_RUN&&OMOI_RUN.state===S&&OMOI_RUN.session===VILLAGE_SESSION)return true;
  const Q=S.flags.omoiW||[];if(!Q.length)return false;if(isNight()){toast('御神木へ行くのは、朝になってから');return true}
  const pk=Q[0],pr=bondPair(pk);if(!pr){S.flags.omoiW=Q.slice(1);renderQuest();dirty=true;return false}/* 2人のどちらかが、もういない：この組はやめて、つぎの組を待つ */
  const [A,B]=pr;for(const r of pr)if(r.hidden){toast(r.name+'が、村にいません');return true}
  if(S.enemies.some(e=>e.spawned&&!e.dead&&pr.some(r=>Math.hypot(e.x-r.x,e.y-r.y)<6))){toast('コワイノが近くにいます','warn');return true}
  const owner=S,session=VILLAGE_SESSION,run={state:S,session};OMOI_RUN=run;const span=sacredSpan(),by=(j/W|0)+span-1+.5,tx=storyTreeX(j);
  const alive=()=>S===owner&&VILLAGE_SESSION===session&&pr.every(r=>S.res.includes(r)&&!r.hidden)&&S.obj[j]==='tower';
  const hold=r=>{endAct(r);r.path=[];r.act={type:'idle',stage:'do',t:0,dur:999,omoiHold:1};r.face=r.x<tx?1:-1};
  const stop=(msg)=>{if(OMOI_RUN===run){OMOI_RUN=null;SCENEHOLD=0}for(const r of pr){if(r.act&&(r.act.omoiHold||r.act.type==='nmeet'))endAct(r);SACRED_POSES.delete(r)}if(sacredDirection())sacredEndDirection(true);if(msg)toast(msg)};
  let n=0,begun=false;const arrive=()=>{if(++n<2||begun)return;begun=true;care()};
  const care=()=>{if(!alive())return stop();if(isNight())return stop('御神木へ行くのは、朝になってから');for(const r of pr)hold(r);const view=[[storyTreeX(j)*TS-40,sacredTopY(j)+20],[storyTreeX(j)*TS+40,storyTreeY(j)*TS-hiAt(j)*LIFT],...pr.flatMap(r=>[[r.x*TS-24,r.y*TS-55-uLift(r)],[r.x*TS+24,r.y*TS+10-uLift(r)]])];storyShot(view,{limit:2.4,seconds:1.2,full:true});
    const one=(r,at,then)=>villageTimeout(()=>{if(!alive())return stop();const c=OMOI_CARE[r.elem]||OMOI_CARE.wood;sacredScenePose(r,c[0],2200,{side:true,target:j,face:r.face});sacredStartEffect(c[1],2200,{actor:r});sfx(r.elem==='water'?'wave':'bush');
      if(r.elem==='wood')for(let i=0;i<10;i++)villageTimeout(()=>fx.push({k:'p',x:r.x*TS+r.face*8,y:r.y*TS-26-uLift(r),vx:r.face*(30+Math.random()*30),vy:-20-Math.random()*30,life:1,col:i%2?'#f6c6d6':'#fff2f6',r:2}),400+i*80);/* 花びら */
      if(then)villageTimeout(then,2300)},at);
    SCENEHOLD=performance.now()+9500;/* 2人の光が、あかりになるまで、村の時間を止める */
    one(A,500);one(B,1300,()=>{if(!alive())return stop();const idx=Math.min(2,omoiN());/* 2人の想いが、ひとつの光になって、枝のあかりになる */
      omoiLight(j,A,B,idx,cols=>{if(OMOI_RUN===run)run.lamp=cols});
      villageTimeout(()=>{if(!alive())return stop();for(const r of pr)SACRED_POSES.delete(r);A.face=B.x>=A.x?1:-1;B.face=-A.face;const now=performance.now();for(const r of pr){JUMP.set(r,now);JOYU.set(r,now+1300)}sfx('good')},3700);/* 向かい合って、はねる */
      villageTimeout(()=>{if(!alive())return stop();SCENEHOLD=0;storyShot(view,{limit:2.4,seconds:.9});for(const r of pr){r.face=r.x<tx?1:-1;sacredScenePose(r,'storyListen',600000,{side:true,target:j,face:r.face})}
        dialog([omoiLine(A,B),omoiLine(B,A)],()=>{if(S!==owner||VILLAGE_SESSION!==session)return;stop();const L=S.flags.omoiP||(S.flags.omoiP=[]);S.flags.omoiW=(S.flags.omoiW||[]).filter(k=>k!==pk);if(!omoiOn()||L.includes(pk))return;L.push(pk);toast('ふたりの想いが、御神木のあかりになった（'+L.length+'/3）','good');logEv(A.name+'と'+B.name+'の想いが、御神木にとどいた');renderQuest();checkQuest();dirty=true})},5200)})};
  const near=r=>Math.hypot(r.x-tx,r.y-by-1)<3;/* 根もとのそば */
  const taken=new Set();/* 2人は、木の左と右の、べつのマスに立つ（近くにいても、自分のマスへ歩く。同じマスに重ならない） */
  for(const [r,dx] of [[A,-1.5],[B,1.5]])if(!sacredSceneWalk(r,tx+dx,by+1,{avoid:taken},arrive)){stop(r.name+'が、御神木まで行けません');return true}/* 行けないときは、はじめない（待っている組のまま） */
  villageTimeout(()=>{if(begun||OMOI_RUN!==run)return;if(pr.every(near)){n=2;arrive()}else stop('御神木に、ふたりがそろいませんでした')},Math.max(20000,2000+Math.max(...pr.map(r=>(r.path||[]).length))*900));/* 歩くのをじゃまされたら、遠くのまま始めずに、やめる（待つ時間は道のりに合わせる） */
  return true}
function shardOfferReady(){/* 御神木にかけらをささげられる（sacredTreeTap と同じ条件） */if(!S||WD!==0||S.free||S.cleared||isNight())return false;if((S.shards||0)-(S.setSh||0)<=0)return false;if((S.setSh||0)>=2)return !!S.flags.finalWon&&!!(S.sev&&S.sev.e09)&&clearReady();return true}
function drawOmoiBub(now){/* なかよしの2人が待っている・かけらをささげられるときは、御神木に青いふきだし */if(!S||WD!==0||!(omoiWait()||shardOfferReady())||OMOI_RUN&&OMOI_RUN.state===S&&OMOI_RUN.session===VILLAGE_SESSION||SHARD_OFFER&&SHARD_OFFER.state===S||!$('#dialog').hidden)return;const j=S.sacredRoot;if(j==null||S.obj[j]!=='tower')return;talkBub(storyTreeX(j)*TS,sacredTopY(j)+34,now)}
function sacredTopY(j,st){/* 御神木の絵のてっぺん（世界の座標）。育ちぐあい（st。なければ、いま）で絵がかわる */const a=window.CHIPS&&CHIPS[SACRED_ART[Math.floor(st==null?sacredStage():st)]];return (j/W|0)*TS+(sacredSpan()-4)*TS-hiAt(j)*LIFT+(a?a.ay/2:-60)}
/* いちばんなかよしの子（村にいる子だけ）。{q,v} */
function bondBest(r){let q=null,v=0;if(!S||!S.bond)return null;for(const o of S.res){if(o===r)continue;const b=S.bond[bondKey(r,o)]||0;if(b>v){v=b;q=o}}return q?{q,v}:null}
function bondPair(pk){const [a,b]=pk.split('_').map(Number),A=S.res.find(r=>r.id===a),B=S.res.find(r=>r.id===b);return A&&B?[A,B]:null}

/* ---------- なかよし30の会話（2人のピンクの会話。1組に1回） ---------- */
/* 名前のある組：セリフは、その子の言いかたのまま */
const BOND_TALKS={
 'フタバ|ノドカ':[['フタバ','ノドカ、きょうも畑、いっしょに見てまわろうよ！'],['ノドカ','いいよぉ。フタバといると、時間があっというまだねぇ。'],['フタバ','#joy|えへへ。ぼくもね、ノドカのとなりだと、なんだか安心するんだ。'],['ノドカ','#joy|ふふ。じゃあ、これからも、となりにいようねぇ。']],
 'フタバ|ホノ':[['ホノ','おい、フタバ。ゆうべ、家の窓からずっとこっちを見てたろ。'],['フタバ','#surprise|えっ、気づいてたの？'],['ホノ','あたりめえだ。……見ててくれるやつがいると、なんだか力が出るんだよな。'],['フタバ','#joy|じゃあ、こんどの夜も、ずっと見てるね！']],
 'フタバ|アオ':[['アオ','フタバさん、さっきは、かわいた畑を教えてくれて助かりました。'],['フタバ','#joy|えへへ、葉っぱがしょんぼりしてたから、すぐわかったよ！'],['アオ','#joy|よく見ているんですね。……なんだか、うれしいです。'],['フタバ','こんどは、ぼくがアオに、花の冠の作りかたを教えてあげる！']],
 'フタバ|フウ':[['フウ','フッ…フタバ、風が、きみの好きな花のにおいを運んできたよ。'],['フタバ','#surprise|ほんと？ どっちから？'],['フウ','日のあたる、あの丘のほうさ。……いっしょに行ってみるかい？'],['フタバ','#joy|行く行く！ フウと歩くと、どこでも楽しいんだ！']],
 'ノドカ|ホノ':[['ホノ','ノドカ、さっき運んでた石、重くなかったか？'],['ノドカ','へいきだよぉ。ホノこそ、ゆうべはおつかれさまぁ。'],['ホノ','#joy|へっ……おまえにそう言われると、つかれがとんでくぜ。'],['ノドカ','ふふ。じゃあ、きょうはいっしょに、ひなたぼっこしようねぇ。']],
 'ノドカ|アオ':[['アオ','ノドカさん、畑の土が、やわらかくなっていますね。'],['ノドカ','アオが水をあげてくれるから、土もよろこんでるんだよぉ。'],['アオ','#joy|土と水で、いっしょに畑をそだてているんですね。'],['ノドカ','そうだねぇ。アオとなら、もっといい畑になるよぉ。']],
 'ノドカ|フウ':[['フウ','ノドカ、きみのそばは、風がやさしくなる気がするよ。'],['ノドカ','そうなのぉ？ ぼくは、のんびりしてるだけだよぉ。'],['フウ','フッ…そののんびりが、いいのさ。'],['ノドカ','#joy|じゃあ、きょうは、いっしょにのんびりしようかぁ。']],
 'ホノ|アオ':[['ホノ','アオ、ゆうべのたき火、しずめてくれたのは、おまえだろ。'],['アオ','はい。風が出てきたので、念のためです。'],['ホノ','……たすかったぜ。おれ、つい火を大きくしちまうからな。'],['アオ','#joy|火と水で、ちょうどいいですね。これからも、よろしくおねがいします。']],
 'ホノ|フウ':[['フウ','ホノ、きみの火は、風にのると、よく燃えるね。'],['ホノ','へっ、おまえの風がいいからだぜ。'],['フウ','フッ…それなら、夜の見まわりも、ふたりで行こうか。'],['ホノ','#joy|おう！ たのもしいぜ。']],
 'アオ|フウ':[['フウ','アオ、池の水面が、きょうはとてもしずかだね。'],['アオ','はい。風がやさしいからだと思います。……フウさんのおかげですね。'],['フウ','フッ…ほめられると、てれるな。'],['アオ','#joy|ふふ。また、いっしょに池をながめましょう。']],
 'ホムラ|シズク':[['ホムラ','シズク、温泉の湯かげん、きょうもばっちりだったよ。'],['シズク','ホムラさんが、まきをくべてくれたからですよ。'],['ホムラ','#joy|へへっ。あんたとなら、どんな仕事も楽しいね。'],['シズク','#joy|わたしもです。これからも、よろしくおねがいしますね。']]
};
/* どの組でも：属性の組ごと。0・1 は ELEM_KEYS の順で前・うしろの子。@0・@1 は名前。言いかたは chatTone で属性に合わせる */
const BOND_GEN={
 'wood|wood':[[0,'@1、いっしょにいると、なんだか日なたにいるみたいだね。'],[1,'うん、ぽかぽかするよね。'],[0,'これからも、いっしょに村をそだてようね！']],
 'wood|earth':[[0,'@1、きのう植えた芽、もう顔を出してたよ！'],[1,'ほんと？ いい土になってきたんだね。'],[0,'@1がたがやしてくれたおかげだよ。ありがとう！']],
 'wood|fire':[[1,'@0、ゆうべは、ちゃんと家にいたよね？'],[0,'うん。@1が守ってくれるから、安心してねむれるよ。'],[1,'えへへ、まかせといて！']],
 'wood|water':[[0,'@1、畑の花が、きょうはとっても元気なんだ。'],[1,'水をたっぷりあげたからかな。'],[0,'いっしょに世話すると、花もうれしそうだね！']],
 'wood|wind':[[1,'@0、風にのって、花のたねが遠くまでとんでいったよ。'],[0,'すごい！ どこかで、新しい花がさくかな。'],[1,'こんど、いっしょに見にいこうよ。']],
 'earth|earth':[[0,'@1、この岩のそば、ひんやりして気持ちいいね。'],[1,'うん。ここで、ひと休みしようか。'],[0,'ふたりでいると、時間がゆっくりになるね。']],
 'earth|fire':[[1,'@0、ゆうべたたかれた壁、こわれなかったよ。'],[0,'よかった。なおしておいてよかったね。'],[1,'いっしょに村を守ってるんだね。']],
 'earth|water':[[0,'@1が水をくれると、土がふかふかになるよ。'],[1,'ほんと？ 土のにおいが、いいにおいだね。'],[0,'いっしょに、いい畑にしようね。']],
 'earth|wind':[[1,'@0、きょうは、どこまで風がとどいたと思う？'],[0,'村のはしっこまで、かな。'],[1,'正解！ こんど、いっしょに歩いてみようよ。']],
 'fire|fire':[[0,'@1、ゆうべの見まわり、たのもしかったよ。'],[1,'@0こそ！ ふたりなら、こわくないね。'],[0,'こんどの夜も、いっしょにがんばろうね！']],
 'fire|water':[[0,'@1、さっき、火の粉をしずめてくれて、ありがとう。'],[1,'どういたしまして。けがはなかった？'],[0,'うん！ @1がいると、安心だよ。']],
 'fire|wind':[[1,'@0、たき火の火が、風でゆらゆらしてたね。'],[0,'うん。きれいだったよね。'],[1,'こんど、いっしょにたき火をかこもうよ。']],
 'water|water':[[0,'@1、池の水、きょうはすきとおってるね。'],[1,'ほんとだ。空がうつってるよ。'],[0,'いっしょにながめると、もっときれいに見えるね。']],
 'water|wind':[[0,'@1、さっきの雨、もうやんだね。'],[1,'風が雲を運んでいったからね。'],[0,'@1のおかげで、お日さまが出てきたよ。']],
 'wind|wind':[[0,'@1、きょうの風は、どこから来たと思う？'],[1,'山のほうかな。すこし、つめたいね。'],[0,'いっしょに、風のくる道をさがしにいこうよ。']]
};
function bondLines(pk){const p=bondPair(pk);if(!p)return [];const [a,b]=p,nk=BOND_TALKS[a.name+'|'+b.name]||BOND_TALKS[b.name+'|'+a.name];if(nk)return nk.map(l=>[l[0],l[1]]);
  const o=ELEM_KEYS.indexOf(a.elem)<=ELEM_KEYS.indexOf(b.elem)?[a,b]:[b,a],G=BOND_GEN[o[0].elem+'|'+o[1].elem];if(!G)return [];
  return G.map((l,i)=>{const sp=o[l[0]];return [sp.name,chatTone(l[1].replace(/@0/g,o[0].name).replace(/@1/g,o[1].name),sp,i)]})}
/* ピンクの会話（SEV1）に、なかよし30になった組の会話を足す。キーは「bd_a_b」 */
function bondSevEntry(pk){const k='bd_'+pk;if(SEV1.some(e=>e.k===k))return;SEV1.push({k,bd:pk,at(){const p=bondPair(this.bd);return !!p&&bondOf(p[0],p[1])>=BOND_TALK&&!p[0].hidden&&!p[1].hidden&&S.qStory==null},get L(){return bondLines(this.bd)}})}
function bondTalkTick(){if(!S||!S.bond)return;const D=S.sev||{};for(const pk in S.bond)if(S.bond[pk]>=BOND_TALK&&!D['bd_'+pk])bondSevEntry(pk);
  if(!WD||sevBusy()||isNight()||(S.sevQuietUntil||0)>S.t)return;/* 草原は checkSev が出す。ほかの土地は、なかよしの会話だけここで出す */
  const P=S.sevP||(S.sevP=[]),M=S.sevMiss||{};if(!P.some(k=>/^bd_/.test(k)))for(const e of SEV1){if(!e.bd||D[e.k]||M[e.k]||P.includes(e.k)||!e.at())continue;const L=sevLines(e.L);if(L&&L.length&&sevAllHere(e)){P.push(e.k);break}}
  sevBub()}

/* ---------- なかよしが消えたとき：のこった子が、見た会話の思い出を話す ----------
   思い出は、プレイヤーが見た2人の会話だけ（なかよしの雑談 CHATS の mate・mem は bondMemNote、なかよし30の会話は S.sev の bd_）。
   見た会話がなければ、2人でさいごにしたこと（S.bondDid）。$ は消えた子の名前 */
const BOND_MEM={
 'フタバ|ノドカ':{'フタバ':'#cry|これからも、となりにいようねって……$、言ったじゃない……。','ノドカ':'#cry|これからも、となりにいようねって、言ったのにねぇ……。'},
 'フタバ|ホノ':{'フタバ':'#cry|こんどの夜も、ずっと見てるって、約束したのに……。','ホノ':'#cry|……見ててくれるやつがいると、力が出るって言ったろ。まだ、もらいたりねえよ……。'},
 'フタバ|アオ':{'フタバ':'#cry|花の冠の作りかた、$に教えてあげるって、約束してたのに……。','アオ':'#cry|花の冠の作りかた、教えてもらう約束でしたよね……。まだ、ひとつも作れていないんです。'},
 'フタバ|フウ':{'フタバ':'#cry|$と歩くと、どこでも楽しかったのに……。あの丘、まだ、いっしょに行ってないよ……。','フウ':'#cry|……花のにおいのする丘へ、また、ふたりで行くつもりだったんだ。'},
 'ノドカ|ホノ':{'ノドカ':'#cry|きょうはいっしょに、ひなたぼっこしようねって、言ったのにねぇ……。','ホノ':'#cry|おまえに「おつかれさま」って言われると、つかれがとんだんだ。……もう、だれが言ってくれるんだよ。'},
 'ノドカ|アオ':{'ノドカ':'#cry|$となら、もっといい畑になるよぉって、言ったのにねぇ……。','アオ':'#cry|土と水で、いっしょに畑をそだてていたのに……。畑は、まだとちゅうなんです。'},
 'ノドカ|フウ':{'ノドカ':'#cry|いっしょに、のんびりしようねって、言ったのにねぇ……。','フウ':'#cry|……そののんびりが、よかったんだ。きみのそばは、風がやさしくなったのに。'},
 'ホノ|アオ':{'ホノ':'#cry|火と水で、ちょうどいいって言ってくれたよな……。おれの火、もう、だれがしずめてくれんだよ。','アオ':'#cry|火と水で、ちょうどいいって……。これからもよろしくって、言ったばかりなのに。'},
 'ホノ|フウ':{'ホノ':'#cry|夜の見まわり、ふたりで行こうって言ったじゃねえか……。','フウ':'#cry|……夜の見まわりは、ふたりで行こうと、言ったのにね。'},
 'アオ|フウ':{'アオ':'#cry|また、いっしょに池をながめましょうって……約束、したのに。','フウ':'#cry|……しずかな池の水面、また、ふたりでながめるはずだったのに。'},
 'ホムラ|シズク':{'ホムラ':'#cry|あんたとなら、どんな仕事も楽しいって……あたい、ほんとに、そう思ってたんだよ。','シズク':'#cry|これからも、よろしくおねがいしますって……まだ、言ったばかりなのに。'}};
/* どの組でも：BOND_GEN と同じ組。[前の属性の子が言う, うしろの属性の子が言う] */
const BOND_MEMG={
 'wood|wood':['#cry|いっしょにいると、日なたにいるみたいって……ほんとに、ぽかぽかしてたのに。'],
 'wood|earth':['#cry|いっしょにそだてた芽、もう顔を出してたんだよ……。見せてあげたかった。','#cry|たがやしてくれてありがとうって、言ってくれたのに……。'],
 'wood|fire':['#cry|守ってくれるから、安心してねむれたのに……。','#cry|守ってくれるから安心だって、言ってくれたのに……。守れなかった。'],
 'wood|water':['#cry|いっしょに世話をすると、花もうれしそうだったのに……。','#cry|いっしょに花の世話をしたね……。花は、まだ元気なのに。'],
 'wood|wind':['#cry|とんでいった花のたね、いっしょに見にいこうって言ったのに……。','#cry|新しい花がさいたら、いっしょに見にいこうって、さそったのに……。'],
 'earth|earth':['#cry|ふたりでいると、時間がゆっくりになるねって……。もっと、ゆっくりしたかったよ。'],
 'earth|fire':['#cry|いっしょに村を守ってるんだねって、言ってくれたのに……。','#cry|なおしてくれた壁、こわれなかったんだよ……。いっしょに村を守ってたのに。'],
 'earth|water':['#cry|水をくれると、土がふかふかになったのに……。','#cry|いっしょに、いい畑にしようねって……言ったのに。'],
 'earth|wind':['#cry|こんど、いっしょに村のはしまで歩こうって、言ってたのに……。','#cry|こんど、いっしょに村のはしまで歩こうって、さそったのに……。'],
 'fire|fire':['#cry|ふたりなら、こわくないねって……。ひとりの夜は、こわいよ。'],
 'fire|water':['#cry|けがはなかったって、いつも心配してくれたのに……。','#cry|いてくれると安心だって、言ってくれたのに……。'],
 'fire|wind':['#cry|こんど、いっしょにたき火をかこもうって言ったのに……。','#cry|いっしょにたき火をかこもうって、さそったのに……。'],
 'water|water':['#cry|いっしょにながめると、池がもっときれいに見えたのに……。'],
 'water|wind':['#cry|雲をはこんで、お日さまを出してくれたのに……。','#cry|お日さまが出たのは、ぼくのおかげだって、言ってくれたのに……。'],
 'wind|wind':['#cry|いっしょに、風のくる道をさがしにいこうって、言ってたのに……。']};
const BOND_DIDL={eat:'#cry|いっしょにごはんを食べると、おいしかったのに……。',chat:'#cry|いっぱい、おしゃべりしたのに……。まだ、話したいこと、あるのに……。',guard:'#cry|夜、いっしょに村を守ったのに……。',tour:'#cry|村を、いっしょに見てまわったよね……。',any:'#cry|いつも、いっしょにいたのに……。'};
function bondMemNote(A,B,ci){/* なかよしの雑談を見た（input.js）。新しい物をうしろに、4つまで */if(!S||IS_STORY_REPLAY||!CHATS[ci]||!CHATS[ci].mem)return;const M=S.bondMem||(S.bondMem={}),k=bondKey(A,B),L=(M[k]||[]).filter(i=>i!==ci);L.push(ci);M[k]=L.slice(-4)}
function bondMemLine(m,d){/* のこった子 m が、消えた子 d との思い出を話す1行 */const k=bondKey(m,d),tone=t=>chatTone(t,m,1).replace(/\$/g,d.name);
  const L=(S.bondMem||{})[k]||[];if(L.length){const c=CHATS[L[L.length-1]];if(c&&c.mem)return tone(c.mem)}
  if((S.sev||{})['bd_'+k]){const nk=BOND_MEM[m.name+'|'+d.name]||BOND_MEM[d.name+'|'+m.name];if(nk&&nk[m.name])return nk[m.name].replace(/\$/g,d.name);
    const f=ELEM_KEYS.indexOf(m.elem)<=ELEM_KEYS.indexOf(d.elem),G=BOND_MEMG[f?m.elem+'|'+d.elem:d.elem+'|'+m.elem];if(G)return tone(m.elem===d.elem?G[0]:G[f?0:1]||G[0])}
  const did=(S.bondDid||{})[k]||'';if(/^play:/.test(did)){const w=BL[did.slice(5)];if(w)return tone('#cry|いっしょに'+w.name+'で遊んだの、たのしかったのに……。')}
  return tone(BOND_DIDL[did]||BOND_DIDL.any)}
/* 消えた子 d の、なかよしの子（村にいる子だけ）。なかよしがいなければ null */
function deathMate(d,name){const n=name||(d&&d.mate);if(!n)return null;const m=S.res.find(q=>q.name===n&&!q.hidden);return m||null}
/* なかよしの子が話す、はじめの3行（おどろき → 思い出 → かなしみ） */
function deathMateLines(m,d){const n=d.name;
  const A={wood:'#worry hush|……$？ ねえ、$……！',earth:'#worry hush|……$？ うそだよねぇ、$……。',fireA:'#danger hush|……$？ おい、うそだろ……！',fireB:'#danger hush|……$？ おい、うそだろ……！',water:'#worry hush|……$さん？ ……$さん！',wind:'#worry hush|……$？ ……風に、まぎれてしまったのかい。',windF:'#worry hush|……$？ ねえ、どこ行っちゃったの……？'},
    C={wood:'#cry|……もっと、いっしょにいたかったよ……。',earth:'#cry|……もっと、いっしょにいたかったよぉ……。',fireA:'#cry|……もっと、いっしょにいたかったよ。',fireB:'#cry|……ちくしょう。もっと、いっしょにいたかったぜ……。',water:'#cry|……もっと、いっしょにいたかったです……。',wind:'#cry|……もっと、となりにいたかったよ。',windF:'#cry|……もっと、いっしょにいたかったなあ……。'};
  const k=elemKey(m);return [[m.name,(A[k]||A.wood).replace(/\$/g,n)],[m.name,bondMemLine(m,d)],[m.name,C[k]||C.wood]]}

/* ---------- 同じ夜にいっしょに守る（見張り台・夜の見まわり・こもれびのまもりについて行く） ---------- */
const BOND_DEF=new Set(['watchpost','patrol','follow']);
function bondNightTick(){if(!isNight()||!S.enemyOn)return;const n=dayNo()-(hour()<12?1:0),D=S.bondDef&&S.bondDef.n===n?S.bondDef:(S.bondDef={n,ids:[]});
  for(const r of S.res){if(r.hidden||!r.act||!BOND_DEF.has(r.act.type)||D.ids.includes(r.id))continue;for(const id of D.ids){const q=S.res.find(x=>x.id===id);if(q)bondAdd(r,q,1,'guard')}D.ids.push(r.id)}}
/* ---------- なかよし100：3マス以内ではたらく速さ+5% ---------- */
function bondNearTick(){BOND5.clear();if(!S.bond)return;for(const pk in S.bond){if(S.bond[pk]<BOND_MAX)continue;const p=bondPair(pk);if(!p||p[0].hidden||p[1].hidden)continue;if(Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)<=3){BOND5.add(p[0]);BOND5.add(p[1])}}}
function bondTick(){if(!S||IS_STORY_REPLAY)return;omoiSeed();bondNightTick();bondNearTick();bondTalkTick()}

/* ---------- いっしょに遊ぶ ---------- */
/* 同じ遊び家具で遊びはじめたら、先に遊んでいる子と+2（1回の遊びで1回） */
function bondPlayStart(r,a){if(a.bd||a.obj==null)return;a.bd=1;for(const q of S.res)if(q!==r&&q.act&&q.act.type==='play'&&q.act.stage==='do'&&q.act.obj===a.obj)bondAdd(r,q,1,'play:'+a.what)}
/* なかよし60：遊びに行くとき、ひまにしているなかよしをさそう */
function bondInvite(r,o){if(!S||isNight()||!o||o.obj==null||(r.bdInv||0)>S.t)return false;const bb=bondBest(r);if(!bb||bb.v<BOND_PLAY)return false;const f=bb.q,p=BL[o.what]&&BL[o.what].play;
  if(!p||!free(o.key,p.cap)||f.hidden||!f.act||!['idle','wander'].includes(f.act.type)||f.fun>=100||f.hunger<50||hungry(f)||f.energy<25||onHold(f)||HOLD.has(f.id)||storyCalled(f)||carryN(f)>0||f.meal||toyTired(f,o.obj))return false;
  const G=bfs(f.x|0,f.y|0),mine=r.act&&r.act.stand;let st=-1;if(o.what==='swing'){if(G.dist[o.obj]>=0)st=o.obj}else st=nearest(G,k=>k!==mine&&walk(k)&&adjOf(k,t=>anc(t)===o.obj)>=0,45);if(st<0)return false;
  const ng=(NIGATE[f.elem]||{})[o.what];r.bdInv=S.t+120;endAct(f);startAct(f,G,'play',st,Object.assign({},o,{fun:ng!=null?ng:p.fun,nig:ng!=null,inv:r.id}));
  addFloat(r.x,r.y-1.4,'いっしょにあそぼう！');f.bubble='♪';return true}

/* ---------- 村をあんないする（えらぶ場面 guide でえらばれた子が、新しい子をつれて村をまわる） ----------
   S.tour={g:あんないする子のid,w:ついていく子のid,i:いまの場所,at:はじめた時刻}。場所は 畑・食料箱・池・家・切り株・神殿 のうち、ある物だけ。
   あんないする子は、つぎの場所へ歩いて、着いたらその物のほうを向いて手をふる（ついていく子が来るまで待つ）。ついていく子は、あとをついて歩く。
   夜・コワイノ・どちらかがいない・ながく進まないときは、やめる。 */
const TOUR_KINDS=['farm','stor','water','house','stump','statue'],TOUR_STOP=12,TOUR_LIMIT=500;
function tourStart(g,w){if(!S||IS_STORY_REPLAY||!g||!w||g===w)return;S.tour={g:g.id,w:w.id,i:0,at:S.t};for(const r of[g,w])if(r.act&&!URGNO.includes(r.act.type))endAct(r)}
function tourPair(){const T=S&&S.tour;if(!T)return null;const g=S.res.find(r=>r.id===T.g&&!r.hidden),w=S.res.find(r=>r.id===T.w&&!r.hidden);if(!g||!w||isNight()||S.t-T.at>TOUR_LIMIT||S.enemies.some(e=>e.spawned&&!e.dead)){delete S.tour;return null}return {T,g,w}}
function tourTarget(k){const isO=id=>q=>S.obj[q]===id||S.obj[q]==='part'&&S.obj[S.ref[q]]===id;
  if(k==='farm')return {pred:j=>adjOf(j,isO('farm'))>=0,look:j=>adjOf(j,isO('farm'))};
  if(k==='water')return {pred:j=>VILL[j]&&adjOf(j,q=>S.ground[q]===1)>=0,look:j=>adjOf(j,q=>S.ground[q]===1)};
  if(k==='stor')return {pred:j=>adjOf(j,isO('stor'))>=0,look:j=>adjOf(j,isO('stor'))};
  if(k==='house'){const out=insideSet();return {pred:j=>out[j]&&adjOf(j,q=>HOME_DOORS.has(S.obj[q]))>=0,look:j=>adjOf(j,q=>HOME_DOORS.has(S.obj[q]))}}
  if(k==='statue')return {pred:j=>adjOf(j,isO('statue'))>=0,look:j=>adjOf(j,isO('statue'))};
  if(k==='stump'&&S.sacredRoot!=null){const tx=storyTreeX(S.sacredRoot),ty=storyTreeY(S.sacredRoot);return {pred:j=>{const d=Math.hypot(j%W+.5-tx,((j/W)|0)+.5-ty);return d>2.4&&d<3.4},look:()=>Math.floor(ty)*W+Math.floor(tx)}}
  return null}
/* せいれいの行動をきめるときによぶ。あんないをしたら true */
function tourTick(r,G){const P=tourPair();if(!P||r.hunger<40)return false;const {T,g,w}=P;
  if(r===g){while(T.i<TOUR_KINDS.length){const tg=tourTarget(TOUR_KINDS[T.i]);const j=tg?nearest(G,j=>walk(j)&&tg.pred(j)&&Math.hypot(j%W+.5-r.x,((j/W)|0)+.5-r.y)>=3,80):-1;if(j>=0){const lk=tg.look(j);startAct(r,G,'tourgo',j,{dur:TOUR_STOP,look:lk});return true}T.i++}
    delete S.tour;JUMP.set(g,performance.now());JOYU.set(g,performance.now()+1500);if(Math.hypot(w.x-g.x,w.y-g.y)<4){JUMP.set(w,performance.now());JOYU.set(w,performance.now()+1500)}bondAdd(g,w,1.5,'tour');return false}/* さいごまで見せたら、ふたりでよろこぶ */
  if(r===w){const here=(r.y|0)*W+(r.x|0);if(Math.hypot(g.x-r.x,g.y-r.y)<=1.8){startAct(r,G,'tourf',here,{tg:g.id});return true}
    let q=-1,bd=1e9;for(let k=0;k<W*H;k++){const d=G.dist[k];if(d<0||d>60||!walk(k))continue;const h=Math.hypot(k%W+.5-g.x,((k/W)|0)+.5-g.y);if(h<.9||h>1.8)continue;if(d<bd){bd=d;q=k}}
    if(q>=0){startAct(r,G,'tourf',q,{tg:g.id});return true}}
  return false}
function tourFace(r,j){if(j!=null&&j>=0)r.face=j%W+.5>=r.x?1:-1}
