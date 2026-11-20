'use strict';
/* ---------- イベントのひらき方と、あたらしい効果（持ち主がきめた） ----------
   はじめにひらいているのは「朝の体そう」と「お誕生日会」だけ（EVOPEN0）。草原のイベントは、せいれいの「〇〇したい」のサブクエスト（EVSUB、デイリーの1つ）をおえると、ひらく。
   火山・フリーモード・大会は、じょうけん（EVCOND）をみたすと、ひらく（朝と、ときどき evOpenTick）。ひらいたら、大きな知らせ（evOpenFx：光の帯・紙ふぶき・1つずつ・「ひらいた」のハンコ）。
   ひらいたイベントは S.evOpen（id→1）。前のセーブで、もう出たことのあるイベント（S.evDone）は、ひらいたまま（S.flags.evOpen1）。 */
const EVOPEN0=['taiso','bday'];
function evOpened(id){if(!S)return false;if(EVOPEN0.includes(id))return true;return!!(S.evOpen&&S.evOpen[id])}
/* あたらしい効果（EVENTS の fx・fxv）：イベントがおわったときに、出た子に（per）か、村に1回 */
const EVFXT={full:()=>'まんぷく（1日、おなかのへり0.6倍）',xp:v=>'けいけん+'+v,insp:()=>'ひらめき（あした、1人がひらめきの日）',natk:v=>'その夜の攻撃力+'+v,sunny:()=>'あしたは晴れ',seeds:v=>'花のたね'+v+'こ',bloom:()=>'村の花のつぼみが、ぜんぶ咲く',pt:v=>'パワー+'+v,tokui:v=>'得意な仕事の回数+'+v,ripen:()=>'畑の作物が、ぜんぶとれごろになる',rest:()=>'つかれが、ぜんぶとれる',calm:()=>'その夜の「コワイノ」が半分',donguri:v=>'どんぐり'+v+'こ'};
function evFxTxt(D){return D.fx&&EVFXT[D.fx]?EVFXT[D.fx](D.fxv):''}
function evFxApply(D,P){const v=D.fxv||0,d=callDay();if(!D.fx||!P.length)return;
  for(const r of P){if(D.fx==='full')r.full=S.t+1440;else if(D.fx==='xp'&&typeof addSpiritXp==='function')addSpiritXp(v,r);else if(D.fx==='natk')r.evb={d,atk:v};else if(D.fx==='rest')r.energy=100;
    else if(D.fx==='tokui'&&typeof tokuiList==='function'){const L=tokuiList(r),k=L.length?L[0][0]:tokuiBase(r)[0];if(k){const C=r.jc||(r.jc={});C[k]=(C[k]||0)+v}}}
  if(D.fx==='insp'){const r=pick(P);S.insp={id:r.id,d:d+1}}
  else if(D.fx==='sunny'){const Q=typeof wxQ==='function'?wxQ():null,t=dayNo()+1;if(Q){Q[t]=Object.assign({},Q[t]||{},{r:false,s:false});if(S.stormNext===t)S.stormNext=null}}
  else if(D.fx==='seeds'){const L=[...FLOWERS].filter(id=>BL[id]&&(!BL[id].w||BL[id].w<=WD));for(let i=0;i<v&&L.length;i++){const id=pick(L);giveItem(id,1)}}
  else if(D.fx==='bloom'){if(S.bud)for(const k in S.bud)if(FLOWERS.has(S.obj[+k]))delete S.bud[k];recount()}
  else if(D.fx==='pt')rewardPower(v);
  else if(D.fx==='ripen'){for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].crop)S.dyn[j].g=100}
  else if(D.fx==='calm'){if(S.herbD==null)S.herbD=dayNo()}
  else if(D.fx==='donguri'){if(typeof addFood==='function')for(let i=0;i<v;i++)addFood('donguri',1)}}
/* ひらくじょうけん（サブクエストでひらかない物） */
const EVCOND={cup0:()=>S.res.length>=3,cup1:()=>(S.bossKills||0)>=1,cup2:()=>cnt('wbench')>=1,cup3:()=>(typeof BOXL!=='undefined'?BOXL.length:0)>=3,cup4:()=>Object.keys(S.cookKn||{}).length>=1,cup5:()=>cnt('lumber')>=1,cup6:()=>!!(S.subDone||{}).fish5||(S.fishN||0)>=5,cup7:()=>cnt('quarry')>=1,
  undo:()=>S.res.length>=5,onsen:()=>!!EVNEED.spring3.list().length,taikokai:()=>cnt('taiko')>=1,ocha:()=>cnt('chadogu')>=1,hokomairi:()=>cnt('hokora')>=1,himatsuri:()=>!!(S.st2&&S.st2.fest)||typeof festOn==='function'&&festOn(),utage:()=>!!S.flags.guestDone||typeof visitMorning==='function'&&!!S.flags.visit1,
  fhanami:()=>true,fsuzumi:()=>true,fdonguri:()=>true,fhoshi:()=>true};
/* イベントをひらくサブクエスト（草原・デイリー）：K（話す子）・L（おねがい）・X（お礼）。文はその子の言いかたで */
const EVSUB=[
 {ev:'oni',g:'wood',t:'おにごっこをしよう',ln:'みんなで、おにごっこがしたいな',how:'せいれいが3人いれば、できる',at:()=>S.res.length>=3,ok:()=>S.res.length>=3,L:[['K','#joy|ねえ、守り神さま。みんなで、おにごっこがしたいな！'],['K','ひろい所で、いっしょに走りまわりたいんだ。']],X:[['K','#joy|やったあ！ こんどから、みんなでおにごっこができるね！']]},
 {ev:'soji',g:'earth',t:'クモの巣をはらおう',ln:'村をぴかぴかにしたいなぁ',how:'「しらべる」で家の中のクモの巣をタップして、はらってもらう',at:()=>S.res.length>=2&&HOUSES.length>=1,ok:()=>(S.flags.sweepN||0)>=1,n:1,now:()=>Math.min(1,S.flags.sweepN||0),L:[['K','お家のすみっこに、クモの巣があったよぉ。'],['K','いちど、みんなで村ぜんぶを、ぴかぴかにしたいなぁ。']],X:[['K','#joy|すっきりしたねぇ。こんどは、みんなで大そうじしようねぇ。']]},
 {ev:'matoate',g:'fire',t:'弓の的を置こう',ln:'的あてで、うでをみがきたいぜ',how:'依頼ボードで弓の的をはって、できたら「おく」で置く',at:()=>(S.bossKills||0)>=1,ok:()=>cnt('mato')>=1,n:1,now:()=>cnt('mato'),learn:['mato'],L:[['K','あの大きな影、追いはらえたけどよ。'],['K','もっと、うでをみがきてえ。的があれば、みんなで練習できるぜ。']],X:[['K','#joy|へへっ、いい的だ！ みんなで的あてしようぜ！']]},
 {ev:'takara',g:'wind',t:'しまう家具を3つ置こう',ln:'たから探しをしたいのさ',how:'しまう家具を、村に3つ置く',at:()=>S.res.length>=3,ok:()=>(typeof BOXL!=='undefined'?BOXL.length:0)>=3,n:3,now:()=>Math.min(3,typeof BOXL!=='undefined'?BOXL.length:0),L:[['K','フッ……箱の中のたからを、村のどこかにかくすのさ。'],['K','それを、みんなでさがす。どうだい、わくわくするだろう？']],X:[['K','#joy|箱がそろったね。さあ、たから探しのはじまりさ。']]},
 {ev:'gochi',g:'wood',t:'食卓にいすを2つ',ln:'みんなでごちそうを食べたいな',how:'食卓のそばに、いすを2つ置く',at:()=>!!(S.subDone||{}).table1,ok:()=>evTables().some(j=>[j-1,j+1,j-W,j+W,j+2,j+W+1,j+2*W].filter(k=>k>=0&&k<W*H&&SEATS.includes(S.obj[k])).length>=2),L:[['K','食卓、とってもいいね。'],['K','いすがそろったら、みんなで、ごちそう会をしたいんだ！']],X:[['K','#joy|いすがそろったね！ こんど、みんなでごちそうを食べようね！']]},
 {ev:'yomi',g:'water',t:'本棚を置こう',ln:'本を読んであげたいです',how:'依頼ボードで本棚をはって、できたら「おく」で置く',at:()=>S.res.length>=3,ok:()=>cnt('shelf1')+cnt('shelf2')>=1,n:1,now:()=>Math.min(1,cnt('shelf1')+cnt('shelf2')),L:[['K','わたし、むかしのお話を、たくさん知っているんです。'],['K','本棚があったら、みなさんに読んであげたいです。']],X:[['K','#joy|すてきな本棚ですね。こんど、みなさんに読みきかせをしますね。']]},
 {ev:'ensoku',g:'wind',t:'霧の向こうへ',ln:'遠くまで歩いてみたいのさ',how:'霧が晴れて、行ける所がふえると、できる',at:()=>S.res.length>=3,ok:()=>!S.fog||S.fog.filter(v=>!v).length>4,L:[['K','霧の向こうには、まだ見ぬ景色があるのさ。'],['K','いつか、みんなで遠くまで歩いてみたいね。']],X:[['K','#joy|道がひらけたね。さあ、みんなで遠足だ。']]},
 {ev:'mizu',g:'water',t:'噴水を建てよう',ln:'水あそびがしたいです',how:'「おく」で噴水を建ててもらう',at:()=>elemCount('water')>=1,ok:()=>cnt('fountain')>=1,n:1,now:()=>cnt('fountain'),L:[['K','あつい日は、水をかけあって遊ぶと、気持ちいいんです。'],['K','噴水があったら、みなさんで水あそびができますね。']],X:[['K','#joy|きれいな噴水です。夏になったら、水あそびをしましょうね。']]},
 {ev:'camp',g:'fire',t:'たき火を置こう',ln:'夜までしゃべりてえな',how:'依頼ボードでたき火をはって、できたら「おく」で置く',at:()=>elemCount('fire')>=1,ok:()=>cnt('campfire')>=1,n:1,now:()=>cnt('campfire'),L:[['K','たき火をかこんで、夜までしゃべるってのは、いいもんだぜ。'],['K','火があれば、みんな、ほっとするだろ。']],X:[['K','#joy|いい火だ！ 夏の夜は、みんなでキャンプしようぜ！']]},
 {ev:'cha',g:'earth',t:'屋根の下でお茶会',ln:'のんびりお茶をのみたいなぁ',how:'ガゼボか東屋が村にあると、できる',at:()=>S.res.length>=3,ok:()=>!!EVNEED.roof.list().length,L:[['K','屋根の下で、のんびりお茶をのみたいなぁ。'],['K','雨でも、おしゃべりできるもんねぇ。']],X:[['K','#joy|すてきな屋根だねぇ。秋になったら、お茶会をしようねぇ。']]},
 {ev:'hoshi',g:'wind',t:'冬の星を見よう',ln:'冬の星を、みんなで見たいのさ',how:'冬になると、できる',at:()=>S.res.length>=3,ok:()=>seasonNow()===3||!!S.flags.winter1,L:[['K','冬の夜空はね、いちばん星がすんで見えるのさ。'],['K','みんなで寝ころんで、星を見たいね。']],X:[['K','#joy|冬が来たね。夜になったら、星見の会をしようか。']]},
 {ev:'pikunikku',g:'wood',t:'ピクニックシートを置こう',ln:'お花のそばで、おべんとうしたいな',how:'ピクニックシートを置く',at:()=>!!(S.subDone||{}).clover3,ok:()=>cnt('picnic')>=1,n:1,now:()=>cnt('picnic'),L:[['K','シロツメクサ、いっぱい咲いたね！'],['K','お花のそばで、シートをひろげて、おべんとうしたいな。']],X:[['K','#joy|シートだ！ 春になったら、ピクニックしようね！']]},
 {ev:'hana',g:'wood',t:'花を30本咲かせよう',ln:'花まつりをしたいな',how:'村に、花を30本咲かせる',at:()=>!!(S.subDone||{}).lily5,ok:()=>!!EVNEED.flower30.list().length,n:30,now:()=>{let n=0;for(const o of S.obj)if(FLOWERS.has(o))n++;return Math.min(30,n)},L:[['K','お花でいっぱいの村って、きっと、すてきだよね。'],['K','花がいっぱい咲いたら、花まつりをしたいんだ！']],X:[['K','#joy|お花でいっぱいだね！ 春になったら、花まつりだよ！']]},
 {ev:'hanabi',g:'fire',t:'夜空に花火を',ln:'でっけえ花火をあげてえ',how:'風のせいれいが来ると、できる',at:()=>elemCount('wind')>=1,ok:()=>elemCount('wind')>=1,L:[['K','風のやつが来たからよ、でっけえ火の花を、空にうかせられるぜ。'],['K','夏の夜に、みんなで見ようぜ。']],X:[['K','#joy|よっしゃ！ 夏になったら、花火の夜だ！']]},
 {ev:'lantern',g:'earth',t:'家を3けんにしよう',ln:'ランタンをとばしたいなぁ',how:'家を3けんにする',at:()=>!!(S.subDone||{}).house2,ok:()=>HOUSES.length>=3,n:3,now:()=>Math.min(3,HOUSES.length),L:[['K','お家がふえたら、みんなのねがいごとを、ランタンにのせたいなぁ。'],['K','冬の夜空に、とばすんだよぉ。']],X:[['K','#joy|お家が3けんになったねぇ。冬になったら、ランタンをとばそうねぇ。']]},
 {ev:'shukaku',g:'earth',t:'畑を10にしよう',ln:'しゅうかく祭をしたいなぁ',how:'畑を10マスにする',at:()=>!!(S.subDone||{}).farm6||cnt('farm')>=6,ok:()=>cnt('farm')>=10,n:10,now:()=>Math.min(10,cnt('farm')),L:[['K','畑がもっとひろくなったら、みのりを、みんなでおいわいしたいなぁ。'],['K','秋の、しゅうかく祭だよぉ。']],X:[['K','#joy|ひろい畑になったねぇ。秋になったら、しゅうかく祭だよぉ。']]}];
for(const e of EVSUB){const q=Object.assign({k:'ev_'+e.ev,w:0,rw:10},e);if(!q.n){q.n=1;q.now=()=>q.ok()?1:0}SUBQ.push(q)}
function evOpenNow(id,quiet){if(!S||evOpened(id))return false;(S.evOpen||(S.evOpen={}))[id]=1;if(!quiet)EVOPENQ.push(id);return true}
const EVOPENQ=[];let EVOPENT=0;
function evOpenTick(){/* 1秒に1回：じょうけんでひらくイベント・ひらいた知らせを出す */if(!S||IS_STORY_REPLAY)return;
  for(const id in EVCOND){const D=EVENTS[id];if(!D||evOpened(id)||!evOn0(id))continue;let ok=false;try{ok=EVCOND[id]()}catch(e){}if(ok)evOpenNow(id)}
  if(WD!==0)for(const e of EVSUB){if(evOpened(e.ev)||!evOn0(e.ev))continue;let ok=false;try{ok=e.at()&&e.ok()}catch(err){}if(ok)evOpenNow(e.ev)}/* 草原のほかの土地では、サブクエストのかわりに、そのじょうけんでひらく */
  if(!EVOPENQ.length||GIFT_ACTIVE||!$('#dialog').hidden||sheet!=null||typeof calmNow==='function'&&calmNow())return;evOpenFx(EVOPENQ.splice(0))}
function evOpenFx(ids){/* あたらしいイベントの知らせ：あたらしいレシピと同じ、ためて → はじけて → 1つずつぺたっ → ハンコ */ids=ids.filter(id=>EVENTS[id]);if(!ids.length)return;
  GIFT_ACTIVE=true;const ov=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="あたらしいイベント"></div>'),card=el('<div class="idea-card"><div class="idea-symbol">'+pxi('star')+'</div><h2>あたらしいイベント！</h2><div class="idea-items"></div></div>');
  for(const id of ids){const D=EVENTS[id],it=el('<div class="idea-item evnew"><b></b><span></span></div>');it.querySelector('b').textContent=D.n;it.querySelector('span').textContent=D.cup?EVAT(D)+'から':evGainTxt(id);card.querySelector('.idea-items').append(it)}
  const b=el('<button class="btn pri" type="button">とじる</button>');b.disabled=true;card.append(b);ov.append(card);document.body.append(ov);sfx('good');recRevealFx(card,ov,'ひらいた');
  setTimeout(()=>{if(ov.isConnected)b.disabled=false},650+ids.length*240+500);b.onclick=()=>{if(b.disabled)return;ov.remove();GIFT_ACTIVE=false};
  memo('star','あたらしいイベント：'+ids.map(id=>EVENTS[id].n).join('・'))}
function evOpenMig(s){/* 前のセーブ：もう出たことのあるイベントは、ひらいたまま（1回だけ） */s.flags=s.flags||{};if(s.flags.evOpen1)return;s.flags.evOpen1=1;const O=s.evOpen||(s.evOpen={});for(const id in s.evDone||{})O[id]=1;for(const q of evChainOf(s))O[q.id]=1}
function evChainOf(s){const L=[];let e=s.ev;while(e){L.push(e);e=e.next}return L}
