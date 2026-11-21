/* 闇のステージ（WORLD 6「忘れられた神々の庭」、WD===YAMI）。お話の設定は STORY.md の「さいごの章」、作る順番は IDEAS.md。
   ずっと夜・はじめはだれもいない・まもりの光から光のせいれいトモリが生まれる・トモリのまわりは歩くあかり。 */
const YAMILIGHT=4;/* トモリが照らす半径（マス） */
EL_BASE.light={work:20,move:20,sta:20,cap:1};EL_GROW.light={atk:[0,0],work:90,move:80,cap:30};EL_ATK.light=0;/* 光のせいれい：たたかう力はない */
KEYVR[TOMORI]={key:true,tr:'nebari',h:0,l:0,lash:false,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.22};
KEYHELLO[TOMORI]='……あかるい。ここが、ぼくのいる所？';
KEYBACK[TOMORI]=['#wave|ただいま。また、ここを照らすね。','くらい所から、みんなのあかりが見えたよ。','#joy|もどってこられた……。うれしいな。'];
DEATHL.light=DEATHL.wood;DEATHL2.light=DEATHL2.wood;
OFFER.light=[['seed:*',2,1],['path',2,1],['clover',2,3]];
BDGIFT.light='ひかる石';
SECOND[YAMI]={elem:'fire',name:HIIRO,ok:()=>qAt('hiiro')};MAINEL[YAMI]='';/* はじめに来るのは、火のせいれいヒイロ（「なかまをむかえよう」を聞いてから） */
KEYVR[HIIRO]={key:true,tr:'',pk:'fireB',h:-10,l:.02,lash:false,cheek:false,spd:0,eat:1,pow:0,sta:0,iv:3,vo:.96};
KEYHELLO[HIIRO]='#wave|あかりが見えたんでな。来てやったぜ。';
KEYBACK[HIIRO]=['へっ……ちょっと、休んでただけだ。','#wave|待たせたな。また、おれが前に出るぜ。','……もどってこられたか。トモリは、ぶじか？'];
const PROLOGUE6=[
  [GOD,'さて、さいごの土地じゃな。'],
  [GOD,'ここは、むかし、昼と夜を見守るものたちが、いっしょにくらした庭じゃ。'],
  [GOD,'#worry|いまは、お日さまの光もとどかん。ずっと、夜のままじゃ。'],
  [GOD,'……わしも、長いこと、足がむかなんだ。'],
  [GOD,'では、行こうかの。'],
];
const INTRO6=[
  [GOD,'ほい到着……と言いたいところじゃが、まっ暗じゃのう。'],
  [GOD,'#think|せいれいのすがたも、見えん。……だれも、おらんようじゃ。'],
  [GOD,'#worry|むかしは、にぎやかな庭じゃったんじゃが。'],
  [GOD,'じゃが、おヌシの光なら、この闇にも、とどくかもしれんのう。'],
];
const QUESTS6=[
  {id:'tomori',text:'まっ暗な庭に、まもりの光を落とそう',check:()=>!!S.flags.tomori,by:GOD,how:'「まもりの光」のボタンをおしてから、地面をタップ',story:[
    [TOMORI,'#surprise|……わあ。'],
    [TOMORI,'あかるい……。ここは、どこ？'],
    [GOD,'#surprise|ほっ……！ 光の中から、せいれいが生まれおった。'],
    [GOD,'その色は……光のせいれいじゃな。お日さまに、まだこんな力が残っとったとはのう。'],
    [TOMORI,'ぼく、トモリ。……きみの光、あったかいね。'],
    [GOD,'#joy|よう来てくれたのう、トモリ。この庭は、ずっと夜でな。おヌシのあかりが、たよりじゃ。']]},
  {id:'statue',text:'神殿を直してもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'「しらべる」で、こわれた神殿をタップ',story:[
    [TOMORI,'#joy|できた。……ここ、なんだか、ほっとするね。'],
    [GOD,'じゃろ〜。ここが、おヌシとわしの居場所じゃ。'],
    [GOD,'#joy|くらしの道具は、とどけておいたぞい。']],
   gives:{feat:['inv','remove','plant','craft','people','summon'],recipes:['bed','crate','wbench','torch'],items:{bed:1,wbench:1,hwall:3,fence:10,torch:3},mat:{wood:10,stone:10}}},
  /* 場面1 ともしび */
  {id:'akari',text:'あかりを3つともそう',check:()=>CN(LIGHTQ)>=3,how:'あかりになる物を「おく」で置く',
   talk:{who:TOMORI,when:()=>true,lines:[
    [TOMORI,'#think|ねえ、カミサマ。くらい所って、なんだか、さみしいね。'],
    [TOMORI,'ぼくのあかりだけじゃ、ちいさくて。'],
    [GOD,'ならば、あかりをふやそうかの。あかりのある所には、いのちがあつまるもんじゃ。']]},
   story:[
    [TOMORI,'#joy big|わあ……！ あかりが、ならんでる！'],
    [TOMORI,'ひとつ、ふたつ、みっつ。……ぜんぶ、はじめて見る色だ。'],
    [GOD,'#think|ほう……見てみい、トモリ。東の空の、はしっこを。'],
    [TOMORI,'#surprise|ほんのすこし、白くなってる……？'],
    [GOD,'#joy|あかりがふえて、お日さまにも、この庭が見つけやすくなったのかもしれんのう。']]},
  {id:'hiiro',text:'なかまをむかえよう',check:()=>S.res.some(r=>r.name===HIIRO)&&NEWRES==null&&!NEWQ.length,how:'朝、神殿の上に「！」が出たら、「しらべる」で神殿をタップ',
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'あかりが、遠くまでとどいとる。'],
    [GOD,'#think|……だれかが、気づいてくれるかもしれんのう。']]},
   story:[
    [HIIRO,'おれはヒイロ。火のせいれいだ。'],
    [TOMORI,'#joy|ヒイロ！ ぼくはトモリ。きみの火、あったかいね。'],
    [HIIRO,'へっ、あたりめえだ。……それより、ここ、影がうようよいるじゃねえか。'],
    [HIIRO,'#proud|心配すんな。影なんか、おれがぜんぶ追っぱらってやる。おまえは、うしろにいな。'],
    [TOMORI,'#think|……うん。']]},
  /* 場面2 ついてくる影 */
  {id:'yori',text:'トモリのそばの影をしらべよう',check:()=>!!S.flags.yoriMet,how:'夜、ねているトモリのそばの影を「しらべる」でタップ',
   talk:{who:HIIRO,when:()=>true,lines:[
    [HIIRO,'#jolt|おい、守り神。ゆうべ、見ちまったんだ。'],
    [HIIRO,'ねてるトモリのすぐそばに、影がすわってた。……朝まで、ずっとだ。'],
    [TOMORI,'#tilt|影？ ぼく、ぜんぜん気づかなかった。'],
    [HIIRO,'今夜、たしかめてくれ。あやしい動きをしたら、おれがやる。']]},
   story:[
    [HIIRO,'#alarm big|トモリ！ 影に名前なんか、つけるんじゃねえ！'],
    [HIIRO,'影は、なかまをおそうんだぞ。おまえが消えちまったら、どうすんだ！'],
    [TOMORI,'#sad|……ヨリは、なにもしなかったよ。ずっと、となりにいただけ。'],
    [HIIRO,'#sigh|……っ。'],
    [GOD,'#think|ヒイロ。おヌシの言うことも、まちがっとらん。じゃが……もう少しだけ、見ていてやらんか。'],
    [HIIRO,'……あやしい動きをしたら、そのときは、ゆるさねえからな。']]},
  /* 場面3 夜の仕事のあと */
  {id:'shigoto',text:'ヨリについていこう',check:()=>yamiMarksSeen()>=3,how:'ヨリのいる所を「しらべる」でタップ',
   talk:{who:TOMORI,when:()=>true,lines:[
    [TOMORI,'#surprise|ねえ、見て。ヨリが、どこかへ行こうとしてる。'],
    [TOMORI,'#point|……ついてきてって、言ってるみたい。'],
    [HIIRO,'#sigh|わなかもしれねえ。……しかたねえ、おれもついてく。']]},
   story:[
    [GOD,'#sigh|……そろそろ、話さねばならんのう。'],
    [GOD,'影たちは、もとは「闇のせいれい」じゃった。夜のあいだ、みんながよく休めるように、見守るのが仕事でな。'],
    [GOD,'寝床を見守り、火のぬくもりをのこし、おやすみをとどける。……どれも、あの子らの仕事じゃ。'],
    [HIIRO,'#surprise|……じゃあ、ヨリは。'],
    [TOMORI,'ねてるぼくのそばに、ずっといたのは……見守ってくれてたんだ。'],
    [HIIRO,'#sigh|……おれ、ずっと、なかまをおそう影だと思ってた。'],
    [GOD,'#worry|いまの影は、やり方をわすれてしもうとる。じゃが、ヨリは……まだ、おぼえとるんじゃのう。']]},
  /* 場面4 あさやけ */
  {id:'asayake',text:'朝をむかえよう',check:()=>!!S.flags.asayake,how:'朝になるまで待とう',
   talk:{who:TOMORI,when:()=>true,lines:[
    [TOMORI,'#joy|ねえ、カミサマ。東の空が、まいにち明るくなってるよ。'],
    [TOMORI,'あしたの朝は、きっと、お日さまが見えるよね。'],
    [TOMORI,'ヨリにも見せてあげたいな。ぼくのそばで、いっしょに。'],
    [GOD,'#think|……そうじゃのう。']]},
   story:[
    [GOD,'#sigh|……すまんのう、トモリ。わしは、こうなるのを知っとった。'],
    [GOD,'影は、朝の光の中では、かたちをたもてんのじゃ。'],
    [TOMORI,'#cry|……朝を、よんだのは……ぼくだ。'],
    [HIIRO,'#sigh|……。']]},
];
QL[YAMI]=QUESTS6;PROS[YAMI]=PROLOGUE6;INTROS[YAMI]=INTRO6;
/* 朝の空：お話が進むたびに、朝の時間（4時半〜8時半、6時半がいちばん）の空が少し明るくなる。あさやけの場面からは、本当の朝の光 */
const YAMISKYK=.18,YAMISKYMAX=.8;let YDAWN=null;
function yamiSky(){if(!S)return 0;let k=0;for(const id of ['akari','hiiro','shigoto'])if(qDone(id))k++;if(S.flags.asayake||YDAWN)k=4;return k}
function yamiDawnW(h){return Math.max(0,1-Math.abs(h-6.5)/2)}
function yamiSkyHour(h){return yamiSky()>=4&&h>=5&&h<7.5?h:0}/* 空・光・環境音の時刻：ふだんは真夜中。本当の朝が来てからは、朝の時間だけ朝 */
function yamiDark(h){const mk=typeof moonOf==='function'?moonOf(h>=17?dayNo():dayNo()-1):null,M=mk?MOONDK[mk]:.66;return M*(1-Math.min(YAMISKYMAX,YAMISKYK*yamiSky())*yamiDawnW(h))}/* いつも夜の暗さ（満月・新月はほかのステージと同じ）。朝の時間だけ、朝の空の段階ぶん明るい */
function yamiLit(r){return r.elem==='light'&&!r.hidden&&!r.coffin}
function yamiLights(dmx){if(!S)return;const R=yamiR();if(R<=0)return;for(const r of S.res){if(!yamiLit(r))continue;const P=R*TS+16;dmx.drawImage(lightSpr(P),r.x*TS-P,r.y*TS-12-P,P*2,P*2)}}/* 暗さを、トモリのまわりだけけずる（そうびの明かり gearLights と同じ描き方） */
function yamiLightAt(x,y){if(!S)return false;const R=yamiR();if(R<=0)return false;for(const r of S.res)if(yamiLit(r)&&(r.x-x)**2+(r.y-y)**2<R*R)return true;return false}
function yamiBirthCell(tx,ty){/* 光が落ちたマスにいちばん近い、歩ける空いたマス */let best=-1,bd=1e9;for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(!walk(j)||S.obj[j])continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=j}}return best}
function yamiBirth(tx,ty){/* まもりの光が地面にとどいた：はじめの1回だけ、その光からトモリが生まれる */
  if(!S||WD!==YAMI||S.free||S.flags.tomori||!S.introSeen)return;const j=yamiBirthCell(tx,ty);if(j<0){toast('ここには、おりられないようだ');return}
  const r=mkRes(S,TOMORI,'light',j%W+.5,((j/W)|0)+.5,'swing');r.came=dayNo();S.res.push(r);S.flags.tomori=1;S.enemyOn=true;/* コワイノは、トモリが生まれたときから来る */
  burst(j,'furn');sfx('arrive');if(typeof hdBig==='function')hdBig();const now=performance.now();if(typeof JOYU!=='undefined')JOYU.set(r,now+2600);JUMP.set(r,now+200);
  LIGHTARM=false;dockSync();document.querySelectorAll('#toasts .toast').forEach(t=>{if(t.textContent.indexOf('光を落とす所')>=0)t.remove()});/* はじめの会話のふきだしを、そのまま押せるように、光をえらぶのをやめる（ふだんの、えらんだままうつのはそのまま） */
  recount();renderQuest();dirty=true;save()}
/* コワイノの来かた：23時〜6時は、ほかのステージと同じ大きな群れ（waveFor）。6時〜23時は、時計の1時間ごとに YAMIDAYP で、コカゲが1〜2ひき（来る時刻も数もランダム）。朝の光がないので、追いはらうまでのこる（level.js の yk） */
const YAMIDAYP=.25;
function yamiDayWave(n){/* 小さな群れを出す（夜の記録 S.ns は作りなおさない） */
  SKIP=false;const d=EN.basic;for(let k=0;k<n;k++)S.enemies.push({id:S.nid++,type:'basic',x:0,y:0,hp:d.hp,max:d.hp,delay:k*4,spawned:false,path:[],repath:0,atk:0,stun:0,flash:0,flee:false});
  if(!S.ns)S.ns={n:0,kill:0,lost:[],hurt:0,broke:0,boss:0};S.ns.n+=n;toast('コワイノが来ました','warn');dirty=true}
function yamiTick(prevH,h,dt){if(!S||WD!==YAMI)return;yamiDawnTick(prevH,h);yamiStoryTick(prevH,h,dt||0);if(S.free||!S.enemyOn||S.cleared)return;if(Math.floor(prevH)===Math.floor(h)||h<6||h>=23)return;if(Math.random()>=YAMIDAYP)return;yamiDayWave(Math.random()<.5?1:2)}

/* ヨリ：トモリのそばにいる、おそってこない影（コワイノの絵。S.enemies には入れないので、たたかいにはかかわらない） */
const YORIR=.9;
function yamiState(){return S.yami||(S.yami={})}
function yamiTomori(){return S&&S.res.find(r=>r.name===TOMORI&&!r.hidden)}
function yoriPos(){/* ヨリのいる所（いないときは null） */
  if(!S||WD!==YAMI||S.flags.asayake&&!YDAWN)return null;const t=yamiTomori();if(!t)return null;
  if(YDAWN)return{x:t.x+.9,y:t.y+.1,a:YDAWN.f?Math.max(0,1-(performance.now()-YDAWN.f)/YORIFADE):1};
  if(!qAt('yori'))return null;
  if(isNight())return{x:t.x+.9,y:t.y+.1,a:1};/* 夜は、ねているトモリのとなりに */
  if(qAt('shigoto')&&!qDone('shigoto')){const m=yamiNextMark();if(m)return{x:m.j%W+.5+.7,y:((m.j/W)|0)+.5,a:1}}/* 昼は、まだ見ていない夜の仕事のあとで待つ */
  return null}
/* 夜の仕事のあと：寝床・うずみ火・戸口のしるし（見た目だけ。物ではないので、マスをふさがない） */
const YMARKS=[{k:'nedoko',d:[-10,-5],lines:[
  [TOMORI,'#think|ここ……くぼんでて、やわらかい葉っぱがしいてある。'],
  [HIIRO,'だれかの寝床、だな。小さいのが、いくつもならんでる。'],
  [TOMORI,'ヨリが、ひとつひとつ、なでてる……。']]},
 {k:'uzumi',d:[9,-7],lines:[
  [HIIRO,'#surprise|灰の山……？ ……おい、まだ、あったけえぞ。'],
  [HIIRO,'火が消えたあとも、朝まで、ぬくもりをのこしておく……うずみ火ってやつだ。'],
  [HIIRO,'#think|こんなこと、火を大事にするやつしか、しねえ。']]},
 {k:'toguchi',d:[3,10],lines:[
  [TOMORI,'#point|戸口に、しるしがある。月のかたち……。'],
  [GOD,'#sigh|……なつかしいのう。「おやすみ」を、とどけたというしるしじゃ。'],
  [TOMORI,'#tilt|おやすみを、とどける……？']]}];
function yamiMarks(){const Y=yamiState();if(Y.marks)return Y.marks;Y.marks=[];
  for(const m of YMARKS){let best=-1,bd=1e9;const tx=CX+m.d[0],ty=CY+m.d[1];for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const x=tx+dx,y=ty+dy;if(x<1||y<1||x>=W-1||y>=H-1)continue;const j=y*W+x;if(!walk(j)||S.obj[j]||S.floor[j]||!walk(j+1))continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=j}}if(best>=0)Y.marks.push({k:m.k,j:best})}
  return Y.marks}
function yamiMarksSeen(){const Y=yamiState();return (Y.marks||[]).filter(m=>m.seen).length}
function yamiNextMark(){return yamiMarks().find(m=>!m.seen)||null}
function yamiTap(x,y,tx,ty){/* 「しらべる」のタップ：ヨリ・夜の仕事のあと・あかりを消す・トモリ・ゆりかご。うけたら true */
  if(!S||WD!==YAMI||!$('#dialog').hidden||S.free)return false;
  if(tx!=null&&ty>=0&&tx>=0&&tx<W&&ty<H){const j=anc(ty*W+tx);if(yamiOffTarget(j))return yamiLightOff(j),true;
    if(yamiCradleCells().includes(ty*W+tx)&&yamiCradleTap())return true}
  if(qAt('irana')&&S.qTalked&&!S.flags.irana){const t=yamiTomori();if(t&&Math.abs(x-t.x)<.7&&y>t.y-1.4&&y<t.y+.4)return yamiIrana(t),true}
  const p=yoriPos();
  if(p&&Math.abs(x-p.x)<YORIR&&y>p.y-1.4&&y<p.y+.6){
    if(isNight()&&!S.flags.yoriMet&&qAt('yori'))return yoriMeet(),true;
    if(!isNight()&&qAt('shigoto')&&!qDone('shigoto')){const m=yamiNextMark();if(m)return yamiMarkTalk(m),true}
    return false}
  if(qAt('shigoto')&&!qDone('shigoto'))for(const m of yamiMarks()){if(m.seen)continue;const mx=m.j%W+.5,my=((m.j/W)|0)+.5;if(Math.abs(x-mx)<.7&&Math.abs(y-my)<.8&&m===yamiNextMark()&&!isNight())return yamiMarkTalk(m),true}
  return false}
function yoriMeet(){const t=yamiTomori();if(!t)return;t.nap=false;panTo(t.x*TS,t.y*TS);
  dialog([[TOMORI,'#yawn|……ん……？ だれ……？'],[TOMORI,'#surprise|あ……影さんだ。'],[TOMORI,'……ずっと、ここにいたの？ つめたくて、ちょっと、きもちいいね。'],[TOMORI,'#think|ねえ、名前はある？ ……ないの？'],[TOMORI,'#joy|じゃあ、ヨリ。そばに、よりそってくれるから、ヨリ。'],[TOMORI,'おやすみ、ヨリ。']],()=>{S.flags.yoriMet=1;memo('moon','トモリが、そばの影に「ヨリ」と名前をつけた');renderQuest();save()},null,TOMORI)}
function yamiMarkTalk(m){const M=YMARKS.find(q=>q.k===m.k);if(!M)return;const L=M.lines.filter(l=>l[0]===GOD||S.res.some(r=>r.name===l[0]&&!r.hidden));/* いない子の行だけはぶく */if(!L.length)return;panTo((m.j%W+.5)*TS,((m.j/W)|0)*TS);
  dialog(L.slice(),()=>{m.seen=1;renderQuest();save()},null,L[0][0])}
/* あさやけ：朝をむかえようを聞いたあとの、つぎの朝6時。ヨリが朝の光の中で消える */
const YORIFADE=3200;
function yamiDawnTick(prevH,h){if(S.free||S.flags.asayake||YDAWN||!(prevH<6&&h>=6))return;if(!qAt('asayake')||qDone('asayake'))return;const t=yamiTomori();if(!t)return;
  const S0=S;YDAWN={t:performance.now(),f:0};t.nap=false;if(t.act&&t.act.type==='sleep')t.act=null;panTo(t.x*TS,t.y*TS);if(typeof hdBig==='function')hdBig();
  villageTimeout(()=>{if(S!==S0||!YDAWN)return;dialog([[TOMORI,'#joy big|……見て、ヨリ！ お日さまだよ！'],[TOMORI,'あったかい……。これが、朝なんだね。']],()=>{if(S!==S0||!YDAWN)return;YDAWN.f=performance.now();SCENEHOLD=YDAWN.f+YORIFADE+1200;const p=yoriPos();if(p){fxSpr('dawnfade',p.x*TS,p.y*TS);yamiState().yj=(p.y|0)*W+(p.x|0)}sfx('evap');
    villageTimeout(()=>{if(S!==S0||!YDAWN)return;dialog([[TOMORI,'#surprise|……ヨリ？'],[TOMORI,'#scared big|ヨリ、からだが、すけてる……！ まって、どこ行くの！'],[HIIRO,'#alarm|トモリ、光をおとせ！ 影は、光をあびたら——'],[TOMORI,'#cry|……ヨリ……。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden)),()=>{if(S!==S0)return;S.flags.asayake=1;YDAWN=null;SCENEHOLD=0;memo('moon','はじめての朝。ヨリが、朝の光の中に消えた');renderQuest();save()},null,TOMORI)},YORIFADE+400)},null,TOMORI)},1800)}
function yamiReset(){YDAWN=null;YSH=null;YEND=null}
function yamiDrawAdd(add,now){/* ヨリと夜の仕事のあとを、ほかの物と同じ奥行きの順に描く */
  yamiDrawAdd2(add,now);
  if(qAt('shigoto'))for(const m of yamiMarks()){const x=m.j%W,y=(m.j/W)|0,px=x*TS,py=y*TS;add(y+.4,2,[px,py-8,px+TS,py+TS],()=>yamiMarkDraw(m,px,py,now),m.j)}
  const p=yoriPos();if(!p||p.a<=0)return;const px=p.x*TS,py=p.y*TS;add(p.y,2,[px-24,py-60,px+24,py+15],()=>{ctx.save();ctx.globalAlpha=p.a;drawShade(ctx,'basic',px,py+8,.27*1.5,-1,{dot:1,t:now/1000});ctx.restore()},(p.y|0)*W+(p.x|0))}
function yamiMarkDraw(m,px,py,now){/* 1ドット2点のドット絵 */const c=ctx,d=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(px+x*2,py+y*2,w*2,h*2)};c.save();c.globalAlpha=m.seen?.55:1;
  if(m.k==='nedoko'){d(3,8,10,1,'#6b5038');d(2,9,12,3,'#8a6a48');d(3,12,10,1,'#6b5038');d(4,9,8,2,'#9fbf6a');d(5,10,2,1,'#7fa04e');d(9,9,2,1,'#b8d48a')}
  else if(m.k==='uzumi'){d(4,10,8,2,'#9a958e');d(5,9,6,1,'#b4afa7');d(6,8,4,1,'#c6c1b8');const f=((now/400)|0)%2;d(7,10,1,1,f?'#ff9a4a':'#e8703a');d(9,9,1,1,f?'#e8703a':'#ffb070')}
  else{d(6,4,4,9,'#8c8a86');d(5,12,6,1,'#706e6a');d(7,5,2,1,'#a8a6a2');d(7,7,2,3,'#f2d777');d(8,7,1,1,'#8c8a86');d(8,9,1,1,'#8c8a86')}
  c.restore()}

/* ===== お話の後半（場面5〜8）。STORY.md の「さいごの章」 =====
   5 朝なんて、いらない：ヨリが消えた所に、トモリがすわりこむ（あかり1マス）→ からっぽの夜のゆりかごで、カミサマが話す
   あけよい草：ヨリの消えた所に芽 → 朝ごとにのびて、つぼみ（2日）→ まわり3マスにあかりのない夜（20時〜）にだけひらく。トモリは自分のあかりをおとす。そばのあかりは「しらべる」で消す（つぎの朝6時にもどる）
   6 夜のゆりかご：土・木・水・火・風のせいれいが1人ずつ、ゆりかごを直す（どれからでも）
   7 さいごの夜：村のあかりをぜんぶ消す → トモリもあかりをおとし、道にあけよい草が咲く → 大きな影をむかえに行き、2人でゆりかごへ歩く。トモリが3回たたかれたら、3日あとにやりなおし
   8 おやすみ：大きな影がゆりかごでねむり、のこったコワイノは夜のほうへかえる → 朝6時、新しい闇のヌシが生まれてクリア */
const YKEL=['earth','wood','water','fire','wind'],YKN={earth:'土',wood:'木',water:'水',fire:'火',wind:'風'};
const YKDO={earth:{anim:'build',t:'台をつむ',line:'#proud|土の台、しっかりつんだよ。これなら、ゆれても、くずれない。'},
 wood:{anim:'pluck',t:'わくをあむ',line:'#joy|つるで、わくをあんだよ。だきしめてるみたいに、やわらかいでしょ。'},
 water:{anim:'draw',t:'よごれをあらう',line:'#joy|よごれ、ぜんぶあらったよ。月がうつるくらい、ぴかぴか。'},
 fire:{anim:'hold',t:'うずみ火をともす',line:'#nod|うずみ火を、そっとのこしたよ。朝まで、ぬくいままだ。',hiiro:'#proud|うずみ火、のこしといたぜ。ヨリが、してたみてえにな。'},
 wind:{anim:'lookUp',t:'とばりをかける',line:'#joy|夜のとばりを、かけたよ。風が、そっとゆらしてる。'}};
const YKWORK=6,YFLR=3,YHITMAX=3,YSHSP=.8,YRETRY=3;
let YSH=null/* 大きな影（たたかわない。S.enemies に入れない） */,YEND=null/* おやすみの場面 */;
QUESTS6.push(
  /* 場面5 朝なんて、いらない */
  {id:'irana',text:'すわりこんだトモリに、声をかけよう',check:()=>!!S.flags.irana,by:GOD,how:'「しらべる」で、トモリをタップ',
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'#worry|あの朝から、トモリが、ヨリのいた所をはなれんのじゃ。'],
    [GOD,'あかりも、あんなに小さくなってしもうた。……声を、かけてやってくれんか。']]},
   story:[
    [GOD,'#sigh|……あの子は、だれよりも、朝を待っとったからのう。'],
    [GOD,'守り神よ。わしにも、話さねばならんことがある。庭の北に、来てくれんか。']]},
  {id:'yurikago',text:'庭の北の、からっぽのゆりかごを見にいこう',check:()=>!!S.flags.yrk,by:GOD,how:'「しらべる」で、ゆりかごをタップ',
   story:[
    [GOD,'#worry|……トモリには、まだ言えんのう。あの子は、自分をせめすぎとる。']]},
  /* あけよい草（トモリが立ちなおる） */
  {id:'yoruhana',text:'ヨリのいた所の、あけよい草を見守ろう',check:()=>!!S.flags.bloom,how:'つぼみになったら、夜、まわり3マスのあかりを「しらべる」でタップして消す',
   prog:()=>{const f=yamiState().fl;if(!f)return 'あしたの朝を待とう';if(f.st<2)return 'つぼみまで：あと'+(2-f.st)+'日';const n=yamiNearLights().length;return n?'そばのあかり：'+n:'夜を待とう'},
   talk:{who:TOMORI,when:()=>!!yamiState().fl,lines:[
    [TOMORI,'#surprise|……あ。'],
    [TOMORI,'ヨリがいた所に……ちいさな芽が出てる。'],
    [GOD,'#think|ほう、あけよい草の芽じゃな。朝の光で育って、夜にだけ、花をひらくんじゃ。'],
    [TOMORI,'#think|……夜に、だけ？']]},
   story:[
    [TOMORI,'#joy|ぼくのあかり、もどってきた。……もう、だいじょうぶ。'],
    [GOD,'#joy|うむ。よい顔になったのう。']]},
  /* 場面6 夜のゆりかご */
  stepQuest({id:'naoshi',text:'夜のゆりかごを直そう',
   talk:{who:TOMORI,when:()=>true,lines:[
    [TOMORI,'ゆりかごを直すには、みんなの力がいるんだって。'],
    [GOD,'土・木・水・火・風。むかしは、どの子らも、夜のしたくを手つだっておった。'],
    [TOMORI,'#joy|なかまをよぼう。みんなで、影たちの帰る所をつくるんだ。']]},
   steps:YKEL.map(el=>({id:'yk_'+el,t:YKN[el]+'のせいれいが、'+YKDO[el].t,check:()=>!!(yamiState().crN||{})[el],
    prog:()=>S.res.some(r=>r.elem===el&&!r.hidden)?'':YKN[el]+'のせいれいが、まだ村にいない',how:'神殿で'+YKN[el]+'のせいれいを呼んで、「しらべる」でゆりかごをタップ'})),
   story:[
    [TOMORI,'#joy big|……できた！ 夜のゆりかごだ！'],
    [GOD,'#think|……感じるかの。夜が、ここへあつまってきとる。'],
    [GOD,'#worry|あつまった夜は、大きな影になって、ここへやってくるじゃろう。'],
    [HIIRO,'#alarm|大きな影……！ そんなもんが来たら、村ごとやられちまうぞ。'],
    [TOMORI,'#think|……ううん。その影も、きっと、帰る所をさがしてるんだと思う。'],
    [TOMORI,'#nod|ぼく、むかえに行く。ゆりかごまで、いっしょに歩くよ。'],
    [GOD,'あしたの夜じゃ。影は、あかりをこわがる。その夜だけは、村のあかりを消して、むかえてやろう。']]}),
  /* 場面7・8 さいごの夜・おやすみ */
  {id:'saigo',text:'さいごの夜に、大きな影をむかえよう',check:()=>!!S.flags.yamiEnd,how:'夜、「しらべる」で村のあかりをタップして消す。トモリと大きな影がゆりかごへ歩くあいだ、ほかのコワイノから守る',
   prog:()=>yamiFinalProg(),
   story:[
    [GOD,'#joy|……よう、やりとげたのう。'],
    [GOD,'この庭は、もう、夜だけの庭ではない。朝も夜も、ここに帰ってくる。']]}
);
function yamiAt(id){const qi=questIndexOf(id);return qi>=0&&S.quest>=qi}/* 依頼の会話のない目標：その目標になったら（qAt は会話を聞いたあと） */
function yamiR(){/* トモリのあかりの半径（マス）。かなしみで小さくなり、あけよい草を見守る夜・さいごの夜には、自分でおとす */
  if(!S||WD!==YAMI)return YAMILIGHT;const Y=yamiState();if(S.flags.yamiEnd)return YAMILIGHT;if(Y.ph==='meet'||Y.ph==='go'||Y.ph==='rest')return 0;
  if(!S.flags.asayake||S.flags.bloom)return YAMILIGHT;const f=Y.fl,h=hour();if(f&&f.st>=2&&(h>=20||h<6))return 0;return 1}
function yamiSitOn(){return !!(S&&WD===YAMI&&S.flags.asayake&&!S.flags.bloom&&!S.cleared)}
/* 夜のゆりかご（3×3）：庭の北、まん中から16マスほど。物ではない（見た目だけ）。上と、手前の1行には物を置けない */
function yamiCradle(){const Y=yamiState();if(Y.cr!=null)return Y.cr;if(!S.flags.irana)return -1;const t=yamiTomori(),G=bfs(t?t.x|0:CX,t?t.y|0:CY);let best=-1,bd=1e9;
  for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=CX-1+dx,y=CY-16+dy;if(x<2||y<2||x+3>=W-2||y+4>=H-2)continue;let ok=true;for(let b=0;b<4&&ok;b++)for(let a=0;a<3&&ok;a++){const j=(y+b)*W+x+a;if(!walk(j)||S.obj[j]||S.floor[j]||(S.hi&&S.hi[j]!==(S.hi[y*W+x]||0)))ok=false}if(!ok||G.dist[(y+3)*W+x+1]<0)continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=y*W+x}}
  if(best>=0){Y.cr=best;Y.crN=Y.crN||{}}return best}
function yamiCradleCells(){const c=yamiState().cr;if(c==null)return [];const L=[];for(let b=0;b<4;b++)for(let a=0;a<3;a++)L.push(c+b*W+a);return L}
function yamiCradleC(){const c=yamiState().cr;return c==null?null:{x:c%W+1.5,y:((c/W)|0)+1.5}}
function yamiNoBuild(id,x,y,quiet){const Y=yamiState(),z=szR(id,PLROTS[id]||0)||[1,1],bad=new Set(yamiCradleCells());if(Y.fl)bad.add(Y.fl.j);if(!bad.size)return false;
  for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)if(bad.has((y+b)*W+x+a)){if(!quiet)toast(Y.fl&&(y+b)*W+x+a===Y.fl.j?'あけよい草の芽があります':'夜のゆりかごの場所です','warn');return true}return false}
/* 消したあかり（つぎの朝6時にもどる） */
function yamiOffSet(){const Y=S&&S.yami;return new Set(Y&&Y.off||[])}
function yamiLightOff(j){const Y=yamiState();(Y.off||(Y.off=[])).push(j);recount();sfxAt('pick_tcloth',j%W+.5,((j/W)|0)+.5);fx.push({k:'ring',x:(j%W+.5)*TS,y:((j/W)|0)*TS+20,life:.8,col:'#3a3060'});dirty=true;save()}
function yamiNearLights(){const f=yamiState().fl;if(!f)return [];const fx0=f.j%W+.5,fy0=((f.j/W)|0)+.5;return LIGHTS.filter(j=>{const s=(BL[S.obj[j]]&&BL[S.obj[j]].sz)||[1,1];return Math.hypot(j%W+s[0]/2-fx0,((j/W)|0)+s[1]/2-fy0)<=YFLR+.5})}
function yamiOffTarget(j){/* いま、このあかりを消せるか */const Y=yamiState();if(!LIGHTS.includes(j))return false;if(Y.ph==='off')return true;return qAt('yoruhana')&&!S.flags.bloom&&Y.fl&&Y.fl.st>=2&&yamiNearLights().includes(j)}
/* すわりこむトモリ・さいごの夜の2人（decide0 のはじめ） */
function yamiStand(j,r){/* j のそばの、歩ける空いたマス（ちかい順） */let best=-1,bd=1e9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dy)continue;const x=j%W+dx,y=((j/W)|0)+dy;if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x;if(!walk(k)||S.obj[k])continue;const d=dx*dx+dy*dy+(r?Math.hypot(x+.5-r.x,y+.5-r.y)*.01:0);if(d<bd){bd=d;best=k}}return best}
function yamiFree(j,r,G,me){if(j<0||j>=W*H||!walk(j)||S.obj[j]&&S.obj[j]!=='part'&&!yamiCradleCells().includes(j))return false;if(G&&G.dist[j]<0)return false;if(!me&&j===r.avoidJ&&S.t<r.avoidU)return false;return !S.res.some(q=>q!==r&&!q.hidden&&(q.y|0)*W+(q.x|0)===j)}
function yamiFreeNear(j0,r,G){/* j0 にいちばん近い、空いていて行けるマス */let best=-1,bd=1e9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=j0%W+dx,y=((j0/W)|0)+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(!yamiFree(j,r,G,j===(r.y|0)*W+(r.x|0)))continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=j}}return best}
function yamiDecide(r,G){if(r.elem==='dark'&&tsukiDecide(r,G))return true;if(S.free||S.cleared)return false;const Y=yamiState();
  if(r.name===TOMORI&&!r.hidden){
    if(Y.ph==='off'||Y.ph==='rest'||Y.ph==='meet'&&!YSH)return startAct(r,G,'yhold',-1,{dur:30}),true;/* あかりを消すのを待つ・ゆりかごのそばでねむる影を見守る */
    const here=(r.y|0)*W+(r.x|0);
    const go=(j0)=>{if(j0===here||Math.hypot(j0%W+.5-r.x,((j0/W)|0)+.5-r.y)<1.2&&yamiFree(here,r,G,1))return startAct(r,G,'yhold',-1,{dur:5}),true;const k=yamiFreeNear(j0,r,G);if(k===here)return startAct(r,G,'yhold',-1,{dur:5}),true;if(k>=0)return startAct(r,G,'ywalk',k,{}),true;return startAct(r,G,'yhold',-1,{dur:5}),true};
    if(Y.ph==='meet'&&YSH)return go(YSH.mj);
    if(Y.ph==='go'&&Y.cr!=null)return go(Y.cr+3*W+1);
    if(yamiSitOn()&&!isNight()&&r.hunger>=250&&!(typeof hostileNow==='function'&&hostileNow(r))&&Y.yj!=null){const st=yamiStand(Y.fl?Y.fl.j:Y.yj,r);if(st>=0)return startAct(r,G,'ysit',st,{dur:60}),true}}
  if(Y.yk&&!isNight()&&r.elem===Y.yk.el&&r.id===Y.yk.id&&!r.hidden){const c=Y.cr;if(c!=null){const k=yamiStand(c+W+1,r);if(k>=0)return startAct(r,G,'ywork',k,{dur:YKWORK,el:Y.yk.el}),true}}
  return false}
ACT.ysit={start(r,a){r.face=-1;r.bubble='';const f=yamiState().fl;faceTo(r,f?f.j:yamiState().yj)},done:(r,a)=>a.t>=a.dur||!yamiSitOn()||isNight()||r.hunger<250};
ACT.yhold={start(r,a){r.bubble='';r.nap=false},done:(r,a)=>a.t>=a.dur||!['off','rest','meet','go'].includes(yamiState().ph)};
ACT.ywalk={start(r,a){r.bubble=''},done:(r,a)=>true};
ACT.ywork={start(r,a){const c=yamiState().cr;faceTo(r,c+W+1);sacredSetPose(r,{anim:YKDO[a.el].anim,duration:YKWORK*1000+1500});sfxAt('bush',r.x,r.y)},done:(r,a)=>a.t>=a.dur,end(r,a){if(a.t<a.dur)return;yamiCradleDone(r,a.el)}};
function yamiCradleDone(r,el){const Y=yamiState();if(!Y.yk||Y.yk.id!==r.id)return;Y.yk=null;(Y.crN||(Y.crN={}))[el]=1;const C=yamiCradleC();if(C){spawnFX(C.x-.5,C.y-.6,ELEM[el].col);fx.push({k:'ring',x:C.x*TS,y:C.y*TS,life:1.2,col:ELEM[el].body})}sfx('bush');
  const D=YKDO[el],L0=r.name===HIIRO&&D.hiiro?D.hiiro:D.line,m=L0.match(/^(#[^|]*\|)?(.*)$/),L=(m[1]||'')+(r.name===HIIRO?m[2]:chatTone(m[2],r));dialog([[r.name,L]],()=>{renderQuest();save()},null,r.name);memo('moon',r.name+'が、夜のゆりかごに'+D.t.replace(/む$/,'んだ').replace(/う$/,'った').replace(/す$/,'した').replace(/る$/,'た')+'');renderQuest();save()}
function yamiCradleTap(){const Y=yamiState();
  if(yamiAt('yurikago')&&!S.flags.yrk){yamiCradleTalk();return true}
  if(qAt('naoshi')&&S.qTalked&&!qDone('naoshi')){if(Y.yk){toast(YKN[Y.yk.el]+'のせいれいが、直しにむかっている');return true}
    const C=yamiCradleC(),need=YKEL.filter(el=>!(Y.crN||{})[el]);let best=null,bd=1e9;for(const r of S.res){if(r.hidden||r.coffin||!need.includes(r.elem))continue;const d=Math.hypot(r.x-C.x,r.y-C.y);if(d<bd){bd=d;best=r}}
    if(!best){toast(need.map(el=>YKN[el]).join('・')+'のせいれいがいません','warn');return true}
    if(isNight()){toast('お話は、朝になってから');return true}
    Y.yk={el:best.elem,id:best.id};best.act=null;best.path=[];toast(best.name+'が、ゆりかごへむかった');return true}
  return false}
function yamiCradleTalk(){const C=yamiCradleC();if(C)panTo(C.x*TS,C.y*TS);
  const L=[[GOD,'#think|……ここじゃ。'],
   [GOD,'これは、夜のゆりかご。闇のヌシ様が、夜ごとに、ここで闇の子らをねむらせておった。'],
   [GOD,'#sad|……いまは、からっぽじゃ。ヌシ様は、もう、おられん。'],
   [GOD,'わしが長いこと、この庭に足がむかなんだのは……ここを見るのが、つらかったからじゃ。'],
   [GOD,'#worry|ヌシ様が、どうしておらんようになったのか……それは、まだ話せん。わしにも、ゆるせんことがあってのう。'],
   [GOD,'ヌシ様がおらんようになって、闇の子らは、帰る夜をなくした。夜の仕事をしても、休む所がない。'],
   [GOD,'#sigh|朝の光にとけてしまうのは、帰る所が、どこにもないからなんじゃ。'],
   [HIIRO,'#think|……じゃあ、ヨリも。帰る所があれば、消えずにすんだってことか。'],
   [GOD,'……そうかもしれんのう。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden));
  dialog(L,()=>{S.flags.yrk=1;memo('moon','カミサマが、からっぽの夜のゆりかごのことを話してくれた');renderQuest();save()},null,GOD)}
function yamiIrana(t){panTo(t.x*TS,t.y*TS);
  const L=[[TOMORI,'#sad|……来ないで。'],
   [TOMORI,'#cry|ぼくが、朝をよんだんだ。あかりをふやして、空を明るくして……。'],
   [TOMORI,'#alarm big|朝なんて、いらない！ ヨリを消しちゃう朝なんて、ずっと来なければよかった！'],
   [HIIRO,'#sigh|……トモリ。'],
   [TOMORI,'#cry|ぼくのあかりも、いらない。……あかりなんか、なければよかった。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden));
  dialog(L,()=>{S.flags.irana=1;memo('moon','トモリが「朝なんて、いらない」と言った');yamiCradle();renderQuest();save()},null,TOMORI)}
function yamiBloom(){const Y=yamiState(),f=Y.fl,t=yamiTomori();if(!f||!t)return;Y.bl=1;panTo((f.j%W+.5)*TS,((f.j/W)|0)*TS);if(typeof hdBig==='function')hdBig();sfx('sacred');spawnFX(f.j%W,((f.j/W)|0)-.2,'#f4f0ff');
  const L=[[TOMORI,'#surprise|……ひらいた。'],
   [TOMORI,'まっ白……。くらい中で、こんなに、きれいに見えるんだ。'],
   [TOMORI,'#think|この花、朝の光で大きくなって、夜に、ひらくんだね。'],
   [TOMORI,'朝だけでも、夜だけでも、咲けなかったんだ。……朝も夜も、どっちもいるんだね。'],
   [TOMORI,'#sad|ヨリも、帰る夜があったら……朝の光の中でも、消えなかったのかな。'],
   [TOMORI,'#nod|……ぼく、影たちにも、帰る夜をつくりたい。朝も夜も、どっちもいる所にしたい。'],
   [HIIRO,'#proud|……へっ。それでこそ、トモリだ。おれも手つだうぜ。'],
   [GOD,'#joy|うむ。ならば、あのゆりかごを、直そうかの。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden));
  dialog(L,()=>{Y.bl=0;S.flags.bloom=1;f.st=3;memo('moon','ヨリのいた所で、あけよい草がひらいた。トモリが立ち上がった');const now=performance.now();JUMP.set(t,now+100);renderQuest();save()},null,TOMORI)}
/* さいごの夜 */
function yamiFinalProg(){const Y=yamiState(),t=dayNo(),h=hour();if(Y.ph==='off')return 'のこりのあかり：'+LIGHTS.length;if(Y.ph==='meet')return 'トモリが、大きな影をむかえに行っている';if(Y.ph==='go')return 'ゆりかごまで、2人を守ろう　たたかれた回数：'+(Y.hits||0)+'/'+YHITMAX;if(Y.ph==='rest')return '朝を待とう';
  if(Y.fn==null)return '';const ev=h<6?t-1:t;return Y.fn<=ev?'大きな影が来るまで：今夜':'大きな影が来るまで：あと'+(Y.fn-ev)+'日'}
function yamiFinalStart(){const Y=yamiState(),t=yamiTomori();Y.ph='off';Y.hits=0;if(t){t.nap=false;if(t.act&&t.act.type==='sleep')t.act=null;panTo(t.x*TS,t.y*TS)}
  const L=[[TOMORI,'#think|……来るね。'],[GOD,'守り神よ。村のあかりを、ひとつずつ、消してやってくれ。'],[HIIRO,'#sigh|あかりを消したら、コワイノも来やすくなる。……まかせとけ、おれが前に出る。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden));
  dialog(L,()=>{renderQuest();save()},null,TOMORI);renderQuest()}
function yamiMeetCell(t){/* 村の南：大きな影をむかえる所（トモリが歩いて行けて、コワイノも来られる所） */const G=t?bfs(t.x|0,t.y|0):null,R=typeof spawnReach==='function'?spawnReach():null;let fb=-1;for(let d=10;d<=30;d++)for(const dx of [0,-1,1,-2,2,-3,3,-5,5,-8,8]){const x=CX+dx,y=CY+d;if(x<1||y<1||x>=W-1||y>=H-2)continue;const j=y*W+x;if(!walk(j)||S.obj[j]||!walk(j+W))continue;if(G&&G.dist[j]<0)continue;if(fb<0)fb=j;if(R&&R[j+W]<0)continue;return j}return fb>=0?fb:t?(t.y|0)*W+(t.x|0):CY*W+CX}
function yamiAllOff(){const Y=yamiState(),t=yamiTomori(),c=Y.cr;Y.ph='meet';
  const mj=yamiMeetCell(t),sp=typeof spawnSpot==='function'?spawnSpot():null;YSH={x:sp?sp[0]:CX+.5,y:sp?sp[1]:H-2.5,mj,trail:[],f:1,walk:false,a:0,t0:performance.now()};
  /* ゆりかごへの道に、あけよい草が咲く（見た目だけ） */Y.road=[];if(c!=null){const ax=mj%W+.5,ay=((mj/W)|0)+.5,bx=c%W+1.5,by=((c/W)|0)+3.5,n=Math.max(2,Math.round(Math.hypot(bx-ax,by-ay)/1.6));for(let i=0;i<=n;i++){const s=i%2?.9:-.9,x=Math.round(ax+(bx-ax)*i/n+s),y=Math.round(ay+(by-ay)*i/n);const j=y*W+x;if(x>0&&y>0&&x<W&&y<H&&walk(j)&&!S.obj[j])Y.road.push([j,i])}}Y.rt=performance.now();
  if(t)panTo(t.x*TS,t.y*TS);sfx('sacred');
  dialog([[TOMORI,'ぼくのあかりも……おとすね。'],[TOMORI,'#surprise|……見て。道に、あけよい草が咲いていく。']],()=>{if(YSH)panTo(YSH.x*TS,YSH.y*TS);renderQuest();save()},null,TOMORI);renderQuest()}
function yamiFail(why){const Y=yamiState(),t=yamiTomori(),S0=S,ev=hour()<6?dayNo()-1:dayNo();Y.ph=null;Y.fn=ev+YRETRY;Y.hits=0;const sh=YSH;YSH=null;if(sh)fxSpr('dawnfade',sh.x*TS,sh.y*TS);if(t){t.act=null;t.path=[]}
  dialog([[TOMORI,why==='dawn'?'#sad|……朝に、なっちゃった。':'#scared|……っ！'],[GOD,'#worry|影が、おびえて、行ってしもうた……。'],[GOD,'また、夜があつまるのを待とう。3日もすれば、もう一度来るじゃろう。']],()=>{if(S!==S0)return;renderQuest();save()},null,TOMORI);renderQuest();save()}
function yamiSafe(r){if(r.name!==TOMORI)return false;const Y=yamiState();return !(Y.ph==='meet'||Y.ph==='go')}/* トモリは、コワイノにねらわれない・たたかれない。さいごの夜（大きな影をむかえに行く〜ゆりかごへ）だけは、ねらわれる */
function yamiHitRes(e,r){const Y=yamiState();if(r.name!==TOMORI||!(Y.ph==='meet'||Y.ph==='go'))return false;/* さいごの夜のトモリ：おなかはへらない。3回たたかれたら、やりなおし */
  r.hurt=40;Y.hits=(Y.hits||0)+1;sfxAt('bonk',r.x,r.y);if(typeof shakeScreen==='function')shakeScreen('m');addFloat(r.x,r.y-1.4,'あぶない！','#ffd2cc');renderQuest();if(Y.hits>=YHITMAX&&$('#dialog').hidden)yamiFail('hit');return true}
function yamiShadowStep(dt){const sh=YSH,Y=yamiState(),t=yamiTomori();if(!sh||!t)return;sh.a=Math.min(1,(performance.now()-sh.t0)/1500);
  if(Y.ph==='meet'){const tg=sh.mj+W,tx=tg%W+.5,ty=((tg/W)|0)+.5;if(!sh.G||sh.G.tg!==tg){sh.G=bfs(tg%W,(tg/W)|0,true);sh.G.tg=tg}
    const d=Math.hypot(tx-sh.x,ty-sh.y);if(d>.1){const G=sh.G,cx=sh.x|0,cy=sh.y|0;let nx=tx,ny=ty;const cd=G.dist[cy*W+cx];if(cd>1){let bj=-1,bv=cd;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(cy+ay)*W+cx+ax;if(G.dist[k]>=0&&G.dist[k]<bv){bv=G.dist[k];bj=k}}if(bj>=0){nx=bj%W+.5;ny=((bj/W)|0)+.5}}
      const L=Math.hypot(nx-sh.x,ny-sh.y)||1,m=Math.min(L,YSHSP*dt);sh.vx=(nx-sh.x)/L;sh.vy=(ny-sh.y)/L;sh.x+=sh.vx*m;sh.y+=sh.vy*m;sh.walk=true;if(Math.abs(sh.vx)>.3)sh.f=sh.vx>0?1:-1}else sh.walk=false;
    if(!sh.walk&&Math.hypot(t.x-sh.x,t.y-sh.y)<1.8&&!(t.path&&t.path.length)&&$('#dialog').hidden&&!sh.met){sh.met=1;panTo(t.x*TS,t.y*TS);
      dialog([[TOMORI,'……こんばんは。'],[TOMORI,'こわくないよ。ぼくのあかり、いまは消してあるから。'],[TOMORI,'#nod|きみの帰る所、あるんだ。いっしょに行こう。']],()=>{Y.ph='go';sh.trail=[[t.x,t.y]];if(t.act&&t.act.type==='ywalk')t.act=null;renderQuest();save()},null,TOMORI)}}
  else if(Y.ph==='go'){const tr=sh.trail,last=tr[tr.length-1];if(!last||Math.hypot(t.x-last[0],t.y-last[1])>.15)tr.push([t.x,t.y]);
    while(tr.length>1&&Math.hypot(tr[1][0]-t.x,tr[1][1]-t.y)>1.4)tr.shift();const p=tr[0];if(p){const L=Math.hypot(p[0]-sh.x,p[1]-sh.y);if(L>.05&&Math.hypot(t.x-sh.x,t.y-sh.y)>1.3){const m=Math.min(L,YSHSP*1.3*dt);sh.vx=(p[0]-sh.x)/L;sh.vy=(p[1]-sh.y)/L;sh.x+=sh.vx*m;sh.y+=sh.vy*m;sh.walk=true;if(Math.abs(sh.vx)>.3)sh.f=sh.vx>0?1:-1}else sh.walk=false}
    const c=Y.cr,k=c+3*W+1;if(c!=null&&(t.y|0)*W+(t.x|0)===k&&!(t.path&&t.path.length)&&$('#dialog').hidden&&!YEND)yamiArrive()}}
function yamiArrive(){const Y=yamiState(),t=yamiTomori(),C=yamiCradleC(),S0=S;YEND={t:performance.now()};if(C)panTo(C.x*TS,C.y*TS);if(typeof hdBig==='function')hdBig();
  dialog([[TOMORI,'……ついたよ。ここが、きみの帰る所。']],()=>{if(S!==S0)return;if(YSH&&C){YSH.into={x0:YSH.x,y0:YSH.y,t:performance.now()};sfx('sacred')}
    villageTimeout(()=>{if(S!==S0)return;Y.ph='rest';YSH=null;S.flags.yamiDone=1;let n=0;for(const e of S.enemies){if(e.dead||!e.spawned)continue;fxSpr('dawnfade',e.x*TS,e.y*TS);e.dead=true;e.hp=0;n++}S.enemies=S.enemies.filter(e=>!e.dead||e.spawned===false);/* のこったコワイノは、とけずに、夜のほうへかえる */
      dialog([[TOMORI,'#joy|……ねむったみたい。'],[HIIRO,'#surprise|おい……コワイノが、たたかうのをやめて、北のほうへ、しずかに帰ってくぜ。'],[GOD,'#sigh|……帰る所が、できたんじゃのう。'],[GOD,'朝まで、そっとしておいてやろう。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden)),()=>{if(S!==S0)return;YEND=null;memo('moon','さいごの夜。大きな影が、夜のゆりかごでねむった');renderQuest();save()},null,TOMORI)},2600)},null,TOMORI)}
function yamiBirthNushi(){/* 朝6時：新しい闇のヌシが生まれる */const Y=yamiState(),C=yamiCradleC(),S0=S;Y.ph='born';if(C){panTo(C.x*TS,C.y*TS);spawnFX(C.x-.5,C.y-.8,'#c8b8ff');for(let k=0;k<3;k++)villageTimeout(()=>fx.push({k:'ring',x:C.x*TS,y:C.y*TS,life:1.4,col:'#e8e0ff'}),k*300)}if(typeof hdBig==='function')hdBig();sfx('arrive');
  dialog([[TOMORI,'#surprise|……ゆりかごの中で、なにか、うごいてる。'],
   [GOD,'#joy big|……生まれおった。新しい、闇のヌシ様じゃ。'],
   [TOMORI,'#joy|ちいさいね。……あ、そばに、もうひとつ、ちいさな影がねむってる。'],
   [TOMORI,'#think|……。'],
   [TOMORI,'#joy|おやすみ。……それから、おはよう。'],
   [GOD,'#think|見てみい。お日さまが、のぼってきた。……朝も夜も、そろったのう。'],
   [GOD,'#joy|ヌシ様は、生まれたばかりじゃ。お日さまも、まだ弱っとる。……わしらで、守りそだてていこうかの。']],()=>{if(S!==S0)return;S.flags.yamiEnd=1;S.flags.yamiEndD=dayNo();Y.ph=null;Y.off=[];recount();memo('sun','夜のゆりかごで、新しい闇のヌシ様が生まれた。朝と夜が、そろった');renderQuest();save()},null,TOMORI)}
function yamiStoryTick(prevH,h,dt){if(S.free)return;const Y=yamiState();
  if(prevH<6&&h>=6){/* 朝6時 */
    if(Y.off&&Y.off.length&&Y.ph!=='rest'){Y.off=[];recount()}/* 消したあかりは、もどる */
    if(S.flags.yrk&&!Y.fl&&Y.yj!=null){const j=walk(Y.yj)&&!S.obj[Y.yj]?Y.yj:yamiStand(Y.yj);if(j>=0){Y.fl={j,st:0,d:dayNo()};recount()}}/* ヨリの消えた所に、あけよい草の芽 */
    else if(Y.fl&&Y.fl.st<2&&Y.fl.d<dayNo()){Y.fl.st++;const f=Y.fl;spawnFX(f.j%W,((f.j/W)|0)-.3,'#e8f4c0')}
    dirty=true}
  if((Y.ph==='meet'||Y.ph==='go')&&!YSH&&!YEND)Y.ph='off';/* 読みこみなおしたら、あかりを消したところから */
  if(Y.ph==='meet'||Y.ph==='go')yamiShadowStep(dt);
  {const t=yamiTomori();if(t&&yamiSitOn()&&!isNight()&&t.act&&!['ysit','sleep','eat','store','smat','sitem','flee','hide','phew'].includes(t.act.type)&&t.hunger>=250&&!t.meal&&!(typeof hostileNow==='function'&&hostileNow(t))){endAct(t);t.act=null;t.path=[]}}/* すわりこんだトモリは、仕事をしない */
  if(!$('#dialog').hidden)return;
  if(h>=6&&h<20){if(Y.ph==='off'||Y.ph==='meet'||Y.ph==='go')return yamiFail('dawn');if(Y.ph==='rest'&&!YEND)return yamiBirthNushi()}
  if(yamiAt('saigo')&&Y.fn==null)Y.fn=dayNo()+1;/* ゆりかごを直したつぎの日の夜 */
  if(S.cleared&&S.flags.tsukimi!==1&&h>=20&&h<23&&dayNo()>=(S.flags.yamiEndD||0))return tsukimiBirth();/* クリアした日の夜、ツキミが生まれる */
  if(S.flags.yamiEnd&&!S.cleared&&S.quest>=QUESTS.length&&S.qStory==null){S.cleared=true;toast('忘れられた神々の庭に、朝と夜がもどった','good');renderQuest();save()}
  if(qAt('yoruhana')&&!S.flags.bloom&&!Y.bl&&Y.fl&&Y.fl.st>=2&&h>=20&&h<23&&S.qTalked&&!yamiNearLights().length&&yamiTomori())yamiBloom();
  if(yamiAt('saigo')&&!S.flags.yamiEnd&&Y.ph==null&&Y.fn!=null){const ev=h<6?dayNo()-1:dayNo();if(Y.fn<=ev&&(h>=23||h<5))yamiFinalStart()}
  if(Y.ph==='off'&&!LIGHTS.length&&!YSH)yamiAllOff();
  if((Y.ph==='meet'||Y.ph==='go')&&(Y.hits||0)>=YHITMAX&&!YEND)yamiFail('hit')}
/* 後半の絵：夜のゆりかご・あけよい草・道のあけよい草・大きな影（どれも1ドット2点のドット絵。ゆりかごは状態ごとに1まいだけ作っておく） */
let YCRC=null;
function yamiCradleArt(){const Y=yamiState(),N=Y.crN||{},key=YKEL.map(e=>N[e]?1:0).join('')+(S.flags.yamiEnd?'n':Y.ph==='rest'||Y.ph==='born'?'r':'');if(YCRC&&YCRC.k===key)return YCRC.c;
  const w=48,h=44,c=YCRC&&YCRC.c||document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.clearRect(0,0,w,h);const d=(x,y,col)=>{g.fillStyle=col;g.fillRect(x,y,1,1)};
  const cx=24,cy=29,ox=21,oy=12,ix=16,iy=8,ok=N.earth;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=(x+.5-cx)/ox,v=(y+.5-cy)/oy,o=u*u+v*v,ui=(x+.5-cx)/ix,vi=(y+.5-cy+1)/iy,ii=ui*ui+vi*vi;
    if(o<=1&&ii>1){const top=y<cy;let col=top?(ok?'#9a96a8':'#77737f'):(ok?'#7d7990':'#605c68');if(o>.86)col=ok?'#5e5a70':'#4a4652';if(!ok&&(x*7+y*3)%23===0)col='#3e3a44';/* ひび */if(N.wood&&o<.93&&o>.8&&((x+y)%3===0))col=(x%2?'#6f9a4a':'#8a6a44');d(x,y,col)}
    else if(ii<=1){let col=N.water?'#2c3a72':'#3a3448';if(N.water&&(x*5+y*11)%29===0)col='#8fa8e8';if(!N.water&&(x*3+y*5)%13===0)col='#4c4438';d(x,y,col)}}
  if(ok)for(let x=cx-ox+2;x<=cx+ox-2;x++){const u=(x+.5-cx)/ox,yb=Math.round(cy+oy*Math.sqrt(Math.max(0,1-u*u)));for(let k=0;k<3;k++)d(x,yb+k,k?'#4e4a5e':'#6a6680')}/* 土の台 */
  for(let a=0;a<=40;a++){const t=Math.PI*(1.05+.9*a/40),x=Math.round(cx+19*Math.cos(t)),y=Math.round(cy-3+15*Math.sin(t));d(x,y,ok?'#b4b0c4':'#85818f');d(x,y+1,ok?'#8a86a0':'#68646f')}/* うしろの三日月のせもたれ */
  if(N.fire)for(const[x,y,col]of[[cx,cy,'#ff9a4a'],[cx-1,cy,'#e8703a'],[cx+1,cy+1,'#ffb070'],[cx,cy+1,'#c8582e']])d(x,y,col);
  if(N.wind)for(let a=0;a<=30;a++){const t=Math.PI*(1.1+.8*a/30),x=Math.round(cx+17*Math.cos(t)),y=Math.round(cy-6+18*Math.sin(t));if(a%2===0){g.globalAlpha=.55;d(x,y+2,'#c8b8f0');d(x,y+4,'#b0a0e0');g.globalAlpha=1}}
  if(key.endsWith('r')){for(let y=cy-4;y<=cy+3;y++)for(let x=cx-7;x<=cx+7;x++){const u=(x-cx)/7.5,v=(y-cy)/4.2;if(u*u+v*v<=1)d(x,y,'#140c22')}d(cx-3,cy-1,'#ffd84a');d(cx+2,cy-1,'#ffd84a')}/* ゆりかごでねむる大きな影（目をとじる前のひかり） */
  if(key.endsWith('n')){for(let y=cy-2;y<=cy+2;y++)for(let x=cx-3;x<=cx+3;x++){const u=(x-cx)/3.4,v=(y-cy)/2.4;if(u*u+v*v<=1)d(x,y,u*u+v*v<.35?'#e8e0ff':'#9a86d8')}}/* 新しい闇のヌシ様（生まれたて） */
  YCRC={k:key,c};return c}
function yamiFlowerDraw(px,py,st,a){const c=ctx,d=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(px+x*2,py+y*2,w*2,h*2)};c.save();c.globalAlpha=a==null?1:a;
  d(7,9,1,5,'#5f8a3e');/* くき */
  if(st>=0){d(5,12,2,1,'#7fae4e');d(8,11,2,1,'#7fae4e')}
  if(st>=1){d(4,10,2,1,'#6f9e46');d(9,9,2,1,'#6f9e46');d(7,6,1,3,'#5f8a3e')}
  if(st===2){d(6,3,3,3,'#eee8d8');d(7,2,1,1,'#ffffff');d(6,5,3,1,'#cfc8b4')}
  if(st>=3){d(4,3,7,3,'#f4f0ff');d(5,2,5,1,'#ffffff');d(5,6,5,1,'#d8d0f0');d(7,4,1,1,'#b8a8e8');d(3,4,1,1,'#e0d8f8');d(11,4,1,1,'#e0d8f8')}
  c.restore()}
function yamiDrawAdd2(add,now){if(!S||S.free)return;const Y=yamiState();
  if(Y.cr!=null){const x=Y.cr%W,y=(Y.cr/W)|0,px=x*TS,py=y*TS;add(y+2.2,2,[px,py-24,px+TS*3,py+TS*3+16],()=>{const c=yamiCradleArt();ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(c,px,py+TS*3-c.height*2+8,c.width*2,c.height*2);ctx.restore()},Y.cr+2*W+1)}
  if(Y.fl){const j=Y.fl.j,x=j%W,y=(j/W)|0,px=x*TS,py=y*TS;add(y+.5,2,[px,py-8,px+TS,py+TS],()=>yamiFlowerDraw(px,py,Y.bl?3:Y.fl.st),j)}
  if(Y.road&&Y.road.length&&Y.rt){const el=(now-Y.rt)/1000;for(const[j,i]of Y.road){const s=el-i*.25;if(s<0&&Y.ph==='meet')continue;const x=j%W,y=(j/W)|0,px=x*TS,py=y*TS;add(y+.5,2,[px,py-8,px+TS,py+TS],()=>yamiFlowerDraw(px+4,py+6,s<.4&&Y.ph==='meet'?2:3,Y.ph==='meet'?Math.min(1,s/.6):1),j)}}
  const sh=YSH;if(sh){let x=sh.x,y=sh.y,k=1,a=sh.a;if(sh.into){const C=yamiCradleC(),p=Math.min(1,(now-sh.into.t)/2400);x=sh.into.x0+(C.x-sh.into.x0)*p;y=sh.into.y0+(C.y-sh.into.y0)*p;k=1-.7*p;a*=1-.6*p}
    const px=x*TS,py=y*TS,s=.27*EN.boss2.size*2*.55*k,side=sh.walk&&Math.abs(sh.vx||0)>Math.abs(sh.vy||0)?(sh.f>0?'R':'L'):'',back=sh.walk&&!side&&(sh.vy||0)<0;
    add(y,2,[px-90,py-170,px+90,py+30],()=>{ctx.save();ctx.globalAlpha=a;drawShade(ctx,'boss2',px,py+8,s,sh.f||1,{dot:1,t:now/1000,walk:sh.walk,side,back});ctx.restore()},(y|0)*W+(x|0))}
  if(S.flags.yamiEnd&&Y.cr!=null){const x=Y.cr%W+2.6,y=((Y.cr/W)|0)+3.1,px=x*TS,py=y*TS;add(y,2,[px-24,py-40,px+24,py+12],()=>{ctx.save();ctx.globalAlpha=.85;drawShade(ctx,'basic',px,py+8,.27*1.1,-1,{dot:1,t:12.3});ctx.restore()},(y|0)*W+(x|0))}/* 新しいヌシ様のそばでねむる、小さな影（だれかは言わない） */
}
/* クリアのあと（STORY.md「さいごの章」）：新しい闇のヌシから、闇のせいれいツキミが1人生まれる（クリアした日の夜20時）。
   ツキミは夜ねむらず、ねむるせいれいのそばにすわって見守る。まわり TKWR マスでねむるせいれいは、つかれのとれる速さ TKWK 倍。つかれは朝ねむってとる。
   闇のせいれいはツキミだけ。神殿では呼べない（ELEM_KEYS に入れない）・たたかわない（sortieOK）。絵は、かりの絵（水の形を色がえ） */
const TSUKIMI='ツキミ',TKWR=3,TKWK=1.5,TKFLOOR=35;/* TKFLOOR：見守っているあいだ、つかれはここより下がらない */
ELEM.dark={name:'闇',col:'#6a5fa8',body:'#c9c0ea',can:'はたらく速さ20・移動速度20・スタミナ20・夜、まわり3マスでねむるせいれいのつかれのとれる速さ1.5倍'};
EL_BASE.dark={work:20,move:20,sta:20,cap:1};EL_GROW.dark={atk:[0,0],work:90,move:80,cap:30};EL_ATK.dark=0;
DEATHL.dark=DEATHL.wood;DEATHL2.dark=DEATHL2.wood;OFFER.dark=OFFER.light;BDGIFT.dark='よつゆのしずく';
SPC.dark={hood:'#645578',cheek:'#81738f',dark:'#40374e',eye:'#f2e1f5',hand:'#554963',line:'#40354e'};/* 3Dの絵（light_dark.py の DARK）と同じ色 */
KEYEL[TSUKIMI]='dark';
KEYVR[TSUKIMI]={key:true,tr:'',h:0,l:0,lash:true,cheek:true,spd:0,eat:1,pow:0,sta:0,iv:3,vo:1.1};
KEYHELLO[TSUKIMI]='……こんばんは。夜は、ぼくの番だよ。';
KEYBACK[TSUKIMI]=['ただいま。……夜のあいだ、ちゃんと見ているからね。','#wave|もどってこられたよ。みんな、よくねむれてた？','#joy|また、おやすみのそばにいられる。'];
function tkWatchK(r){if(WD!==YAMI||!S||!S.flags.tsukimi)return 1;for(const q of S.res)if(q!==r&&q.act&&q.act.type==='tkwatch'&&Math.hypot(q.x-r.x,q.y-r.y)<=TKWR)return TKWK;return 1}/* ツキミのそばでねむる */
function tsukiDecide(r,G){/* 闇のせいれい：夜は見守る。朝は、つかれていればねむる */
  if(S.free||WD!==YAMI)return false;
  if(!isNight()){if(r.tkNap){r.tkNap=0;if(r.energy<90&&r.hunger>=250&&!hostileNow(r)){goSleep(r,G);return true}}return false}
  if(r.hunger<250||r.meal||hostileNow(r))return false;
  const sl=S.res.filter(q=>q!==r&&!q.coffin&&q.act&&q.act.type==='sleep');const here=(r.y|0)*W+(r.x|0);
  let best=-1,bs=-1e9;for(const q of sl){const k=yamiFreeNear((q.y|0)*W+(q.x|0),r,G);if(k<0)continue;const x=k%W+.5,y=((k/W)|0)+.5;let n=0;for(const p of sl)if(Math.hypot(p.x-x,p.y-y)<=TKWR)n++;const sc=n*10-(G.dist[k]||0)*.05;if(sc>bs){bs=sc;best=k}}/* いちばん多くのせいれいを見守れる所 */
  if(best<0||best===here)return startAct(r,G,'tkwatch',-1,{dur:best<0?10:60}),true;
  return startAct(r,G,'ywalk',best,{}),true}
ACT.tkwatch={start(r,a){r.bubble='';r.nap=false;const h=roomOf((r.y|0)*W+(r.x|0));if(h&&isNight()){r.hidden=true;a.hid=1}/* 家の中では、ねむる子と同じく、かくれている */let q=null,d=1e9;for(const p of S.res)if(p!==r&&p.act&&p.act.type==='sleep'){const e=Math.hypot(p.x-r.x,p.y-r.y);if(e<d){d=e;q=p}}if(q)r.face=q.x>=r.x?1:-1},
  tick(r,a){if(r.energy<TKFLOOR)r.energy=TKFLOOR},
  done:(r,a)=>a.t>=a.dur||!isNight()||r.hunger<250||hostileNow(r),
  end(r,a){if(a.hid)r.hidden=false;if(!isNight())r.tkNap=1}};
function tsukimiBirth(){/* 新しい闇のヌシのゆりかごから、ツキミが生まれる。会話をさいごまで見てから「生まれた」にする（とちゅうでとじたら、つぎの夜にはじめから） */
  const C=yamiCradleC(),S0=S;if(!C)return;let r=S.res.find(q=>q.name===TSUKIMI);
  if(!r){const j=yamiBirthCell(C.x|0,(C.y|0)+2);if(j<0)return;r=mkRes(S,TSUKIMI,'dark',j%W+.5,((j/W)|0)+.5);r.came=dayNo();S.res.push(r);recount()}
  S.flags.tsukimi=.5;panTo(r.x*TS,r.y*TS);spawnFX(r.x-.5,r.y-.8,'#c8b8ff');for(let k=0;k<3;k++)villageTimeout(()=>fx.push({k:'ring',x:r.x*TS,y:r.y*TS,life:1.4,col:'#e8e0ff'}),k*300);sfx('arrive');if(typeof hdBig==='function')hdBig();
  const T=S.res.some(q=>q.name===TOMORI&&!q.hidden&&!q.coffin),L=[[GOD,'#surprise|……おや。ゆりかごのそばが、ほんのり光っとる。'],[TOMORI,'#surprise|だれか、いる……！'],
   [TSUKIMI,'#wave|……こんばんは。ぼく、ツキミ。いま、生まれたところ。'],[TSUKIMI,'ヌシ様がね、夜のあいだ、みんなのねむりを見ていてって。'],
   [GOD,'#joy|闇のせいれいじゃ。……ずいぶん、ひさしぶりに見たのう。'],[TOMORI,'#heart|ぼくがねむっているあいだ、そばにいてくれる？'],
   [TSUKIMI,'#nod|うん。夜は、ぼくの番。おやすみのそばに、いるよ。']].filter(x=>T||x[0]!==TOMORI);
  dialog(L,()=>{if(S!==S0)return;S.flags.tsukimi=1;memo('moonn','新しい闇のヌシ様のゆりかごから、闇のせいれいツキミが生まれた');renderQuest();save()},null,TSUKIMI)}
/* 追いはらったコワイノが、夜のほうへかえる（クリアのあと）：白く止まる → ふりむいて夜のほう（北）へ歩く → 紺にとけて、月のしるしがのこって消える */
const YHOMEMS=3200,YHOMEC='#1e2550';
function yamiHomeOn(){return !!(S&&WD===YAMI&&S.cleared&&!S.free)}
function drawHome(it,now,e,D,z,px,py,v){const a=now-it.t0;
  if(a<KO_HOLD){drawShade(ctx,e.type,px+(a<0?0:Math.sin(now/18)*1.5),py+8,.27*z,v.f,{dot:1,t:it.t0/1000+e.id*1.3,flash:a>=0,hurt:a>=0?0:null});return}
  const p=(a-KO_HOLD)/it.dur;if(p>=1)return;const cl=(x,y0,y1)=>Math.max(0,Math.min(1,(x-y0)/(y1-y0)));
  const wk=cl(p,.12,.8),yy=py+8-wk*TS*1.4,tint=cl(p,.25,.7),fade=1-cl(p,.6,.85);
  if(fade>0){const R=36*z,ox=px-R,oy=yy-R*1.7,ww=R*2,hh=R*2.2,k=dpr*cam.z,cw=Math.ceil(ww*k)+2,ch=Math.ceil(hh*k)+2;
    if(EOC.width<cw||EOC.height<ch){EOC.width=EOS.width=Math.max(EOC.width,cw);EOC.height=EOS.height=Math.max(EOC.height,ch)}
    eox.setTransform(1,0,0,1,0,0);eox.clearRect(0,0,EOC.width,EOC.height);eox.setTransform(k,0,0,k,-ox*k,-oy*k);
    drawShade(eox,e.type,px,yy,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,back:true,walk:p>=.12});/* ふりむいて、うしろ向きで歩く */
    eox.setTransform(1,0,0,1,0,0);eox.globalCompositeOperation='source-atop';eox.globalAlpha=tint*.85;eox.fillStyle=YHOMEC;eox.fillRect(0,0,cw,ch);eox.globalCompositeOperation='source-over';eox.globalAlpha=1;/* 紺にとけていく */
    ctx.save();ctx.globalAlpha=fade;ctx.drawImage(EOC,0,0,cw,ch,ox,oy,cw/k,ch/k);ctx.restore()}
  const m=cl(p,.62,.75)*(1-cl(p,.88,1));if(m>0){/* 月のしるし：ドットの三日月（2点の四角） */const P=2,cx=Math.round(px/P)*P,cy=Math.round((yy-34*z)/P)*P,rows=['..###.','.##...','##....','##....','##....','.##...','..###.'];
    ctx.save();ctx.globalAlpha=m;ctx.fillStyle='#e8e0ff';for(let i=0;i<rows.length;i++)for(let k=0;k<6;k++)if(rows[i][k]==='#')ctx.fillRect(cx-6+k*P,cy-7+i*P,P,P);ctx.restore()}}
