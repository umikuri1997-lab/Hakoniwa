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
function yamiLights(dmx){if(!S)return;for(const r of S.res){if(!yamiLit(r))continue;const P=YAMILIGHT*TS+16;dmx.drawImage(lightSpr(P),r.x*TS-P,r.y*TS-12-P,P*2,P*2)}}/* 暗さを、トモリのまわりだけけずる（そうびの明かり gearLights と同じ描き方） */
function yamiLightAt(x,y){if(!S)return false;for(const r of S.res)if(yamiLit(r)&&(r.x-x)**2+(r.y-y)**2<YAMILIGHT*YAMILIGHT)return true;return false}
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
function yamiTick(prevH,h){if(!S||WD!==YAMI)return;yamiDawnTick(prevH,h);if(S.free||!S.enemyOn||S.cleared)return;if(Math.floor(prevH)===Math.floor(h)||h<6||h>=23)return;if(Math.random()>=YAMIDAYP)return;yamiDayWave(Math.random()<.5?1:2)}

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
function yamiTap(x,y){/* 「しらべる」のタップ：ヨリ・夜の仕事のあと。うけたら true */
  if(!S||WD!==YAMI||!$('#dialog').hidden)return false;const p=yoriPos();
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
  villageTimeout(()=>{if(S!==S0||!YDAWN)return;dialog([[TOMORI,'#joy big|……見て、ヨリ！ お日さまだよ！'],[TOMORI,'あったかい……。これが、朝なんだね。']],()=>{if(S!==S0||!YDAWN)return;YDAWN.f=performance.now();SCENEHOLD=YDAWN.f+YORIFADE+1200;const p=yoriPos();if(p)fxSpr('dawnfade',p.x*TS,p.y*TS);sfx('evap');
    villageTimeout(()=>{if(S!==S0||!YDAWN)return;dialog([[TOMORI,'#surprise|……ヨリ？'],[TOMORI,'#scared big|ヨリ、からだが、すけてる……！ まって、どこ行くの！'],[HIIRO,'#alarm|トモリ、光をおとせ！ 影は、光をあびたら——'],[TOMORI,'#cry|……ヨリ……。']].filter(l=>l[0]!==HIIRO||S.res.some(r=>r.name===HIIRO&&!r.hidden)),()=>{if(S!==S0)return;S.flags.asayake=1;YDAWN=null;SCENEHOLD=0;memo('moon','はじめての朝。ヨリが、朝の光の中に消えた');renderQuest();save()},null,TOMORI)},YORIFADE+400)},null,TOMORI)},1800)}
function yamiReset(){YDAWN=null}
function yamiDrawAdd(add,now){/* ヨリと夜の仕事のあとを、ほかの物と同じ奥行きの順に描く */
  if(qAt('shigoto'))for(const m of yamiMarks()){const x=m.j%W,y=(m.j/W)|0,px=x*TS,py=y*TS;add(y+.4,2,[px,py-8,px+TS,py+TS],()=>yamiMarkDraw(m,px,py,now),m.j)}
  const p=yoriPos();if(!p||p.a<=0)return;const px=p.x*TS,py=p.y*TS;add(p.y,2,[px-24,py-60,px+24,py+15],()=>{ctx.save();ctx.globalAlpha=p.a;drawShade(ctx,'basic',px,py+8,.27*1.5,-1,{dot:1,t:now/1000});ctx.restore()},(p.y|0)*W+(p.x|0))}
function yamiMarkDraw(m,px,py,now){/* 1ドット2点のドット絵 */const c=ctx,d=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(px+x*2,py+y*2,w*2,h*2)};c.save();c.globalAlpha=m.seen?.55:1;
  if(m.k==='nedoko'){d(3,8,10,1,'#6b5038');d(2,9,12,3,'#8a6a48');d(3,12,10,1,'#6b5038');d(4,9,8,2,'#9fbf6a');d(5,10,2,1,'#7fa04e');d(9,9,2,1,'#b8d48a')}
  else if(m.k==='uzumi'){d(4,10,8,2,'#9a958e');d(5,9,6,1,'#b4afa7');d(6,8,4,1,'#c6c1b8');const f=((now/400)|0)%2;d(7,10,1,1,f?'#ff9a4a':'#e8703a');d(9,9,1,1,f?'#e8703a':'#ffb070')}
  else{d(6,4,4,9,'#8c8a86');d(5,12,6,1,'#706e6a');d(7,5,2,1,'#a8a6a2');d(7,7,2,3,'#f2d777');d(8,7,1,1,'#8c8a86');d(8,9,1,1,'#8c8a86')}
  c.restore()}
