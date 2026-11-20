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
SECOND[YAMI]={elem:'',name:'',ok:()=>false};MAINEL[YAMI]='';
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
    [GOD,'その色は……お日さまの子じゃな。まだ、子をおくる力が、のこっとったんじゃのう。'],
    [TOMORI,'ぼく、トモリ。……きみの光、あったかいね。'],
    [GOD,'#joy|よう来てくれたのう、トモリ。この庭は、ずっと夜でな。おヌシのあかりが、たよりじゃ。']]},
  {id:'statue',text:'神殿を直してもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'「しらべる」で、こわれた神殿をタップ',story:[
    [TOMORI,'#joy|できた。……ここ、なんだか、ほっとするね。'],
    [GOD,'じゃろ〜。ここが、おヌシとわしの居場所じゃ。'],
    [GOD,'#joy|くらしの道具は、とどけておいたぞい。']],
   gives:{feat:['inv','remove','plant','craft','people','summon'],recipes:['bed','crate','wbench','torch'],items:{bed:1,wbench:1,hwall:3,fence:10,torch:3},mat:{wood:10,stone:10}}},
];
QL[YAMI]=QUESTS6;PROS[YAMI]=PROLOGUE6;INTROS[YAMI]=INTRO6;
function yamiSkyHour(h){return 0}/* 空・光・環境音の時刻：いつも真夜中（お話が進むと朝の空がもどるのは、あとのPR） */
function yamiDark(h){const mk=typeof moonOf==='function'?moonOf(h>=17?dayNo():dayNo()-1):null;return mk?MOONDK[mk]:.66}/* いつも夜の暗さ（満月・新月はほかのステージと同じ） */
function yamiLit(r){return r.elem==='light'&&!r.hidden&&!r.coffin}
function yamiLights(dmx){if(!S)return;for(const r of S.res){if(!yamiLit(r))continue;const P=YAMILIGHT*TS+16;dmx.drawImage(lightSpr(P),r.x*TS-P,r.y*TS-12-P,P*2,P*2)}}/* 暗さを、トモリのまわりだけけずる（そうびの明かり gearLights と同じ描き方） */
function yamiLightAt(x,y){if(!S)return false;for(const r of S.res)if(yamiLit(r)&&(r.x-x)**2+(r.y-y)**2<YAMILIGHT*YAMILIGHT)return true;return false}
function yamiBirthCell(tx,ty){/* 光が落ちたマスにいちばん近い、歩ける空いたマス */let best=-1,bd=1e9;for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(!walk(j)||S.obj[j])continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=j}}return best}
function yamiBirth(tx,ty){/* まもりの光が地面にとどいた：はじめの1回だけ、その光からトモリが生まれる */
  if(!S||WD!==YAMI||S.free||S.flags.tomori||!S.introSeen)return;const j=yamiBirthCell(tx,ty);if(j<0){toast('ここには、おりられないようだ');return}
  const r=mkRes(S,TOMORI,'light',j%W+.5,((j/W)|0)+.5,'swing');r.came=dayNo();S.res.push(r);S.flags.tomori=1;S.enemyOn=true;/* コワイノは、トモリが生まれたときから来る */
  burst(j,'furn');sfx('arrive');if(typeof hdBig==='function')hdBig();const now=performance.now();if(typeof JOYU!=='undefined')JOYU.set(r,now+2600);JUMP.set(r,now+200);
  recount();renderQuest();dirty=true;save()}
/* コワイノの来かた：23時〜6時は、ほかのステージと同じ大きな群れ（waveFor）。6時〜23時は、時計の1時間ごとに YAMIDAYP で、コカゲが1〜2ひき（来る時刻も数もランダム）。朝の光がないので、追いはらうまでのこる（level.js の yk） */
const YAMIDAYP=.25;
function yamiDayWave(n){/* 小さな群れを出す（夜の記録 S.ns は作りなおさない） */
  SKIP=false;const d=EN.basic;for(let k=0;k<n;k++)S.enemies.push({id:S.nid++,type:'basic',x:0,y:0,hp:d.hp,max:d.hp,delay:k*4,spawned:false,path:[],repath:0,atk:0,stun:0,flash:0,flee:false});
  if(!S.ns)S.ns={n:0,kill:0,lost:[],hurt:0,broke:0,boss:0};S.ns.n+=n;toast('コワイノが来ました','warn');dirty=true}
function yamiTick(prevH,h){if(!S||WD!==YAMI||S.free||!S.enemyOn||S.cleared)return;if(Math.floor(prevH)===Math.floor(h)||h<6||h>=23)return;if(Math.random()>=YAMIDAYP)return;yamiDayWave(Math.random()<.5?1:2)}
