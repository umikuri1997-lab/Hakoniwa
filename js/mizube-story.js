'use strict';
/* ---------- 水のお話の後半（台本 MIZUBE.md の5〜10）。前半の目標は mizube.js の QL[MIZU] ----------
   ぶつかる（mzfind3 のお礼の会話）：3つめの水門を見つけたら、ミオとノミがけんかして、口をきかなくなる（S.flags.mzFight。仲なおりは、おくりの水路の依頼の会話 S.flags.mzMake）。
     そのあいだは、2人のおしゃべり・いっしょに遊ぶをしない（bond.js の qrPair が mzQr を見る）。
   ため池の底（mzpond）：水の引いたため池の底の大きな岩（mzkame、S.mz.kj）は、水のヌシ様のこうら。「しらべる」でタップすると、ミオとノミがそばへ歩いて行き、そろったら話す（S.flags.mzKame・S.mz.kameD）。
   おくりの水路（mzokuri）：ヌシ様の話のつぎの日、ノミが話す。3つめの水門の前から、村の南の池まで、水路をつなぐ（mzOkuriPath）。
   キリノオオカゲ（mzkiri）：おくりの水路ができた日（17時をすぎていたら、つぎの日）の夕方に会話（S.mz.kD・S.mz.kEve）、その夜に来る（night.js の waveFor が mzKiriWave をよぶ）。
     まわり MZKFOGR マスの見張り台は、とどく所が半分（mzKiriFog）。まわり MZKICER マスの水の流れる水路は、こおって、堀にならない（S.mz.ice、朝にとける）。追いはらえなかったら、MZKRETRY 日あとの夜に、また来る。
   さいごの霧（mzsend）：夕方に3つめの水門を「しらべる」でタップすると、ミオ（いればノミも）が水門へ歩いて行き、ミオが水門をひらいて歌い、白い影がおくりの水路を下っていく（S.flags.mzSent）。
   夜明け（mzdawn）：つぎの朝、村じゅうの霧が晴れ、ため池に水がもどって、ヌシ様がうかぶ（S.flags.mzDawn）。その日の夕方、食堂でみんなで歌って、章のクリア（S.flags.mzEnd）。
   場面は wind-story.js の wsScene（村の時間を止め、カメラを動かし、会話をはさむ）。白い影とヌシ様は、コードの仮のドット絵（MZV）。 */
const NUSHI3='水のヌシ';
const MZKFOGR=5/* キリノオオカゲの霧：見張り台がとどきにくくなる、まわりのマス */,MZKICER=2/* こおる水路の、まわりのマス */,MZKRETRY=3/* 追いはらえなかったら、何日あと */,MZKEVEH=17/* 夕方の会話の時刻 */;
const MZSENDH0=16,MZSENDH1=20/* 3つめの水門へ行ける時刻（夕暮れ） */,MZWAITMAX=60/* そろうのを待つ時間（村の時間） */,MZENDH=17/* 夜明けの日の、食堂の場面の時刻 */;
EN.kirino=Object.assign({},EN.boss2,{name:'キリノオオカゲ',art:'boss2',tint:'#cfe3ec',col:'#203848',eye:'#bfefff',mzKiri:1});/* 霧をねむらせにくる大きな影。強さはヨルノオオカゲと同じ（絵は、ヨルノオオカゲの絵に色をかさねた、かりの絵） */
BOSSFX.kirino={col:'#bfefff',sub:'水が流れるのを止めて、霧をねむらせにくる、大きな「コワイノ」'};
BL.mzkame={name:'大きな岩',solid:1,natural:1};MZIDS.add('mzkame');
if(typeof ACT_LBL!=='undefined')ACT_LBL.mzwait='ミオたちと待っている';

const mzQ=id=>!!S&&!S.cleared&&QUESTS[S.quest]&&QUESTS[S.quest].id===id;
const mzHere=n=>S.res.find(r=>r.name===n&&!r.hidden);
const mzFightOn=()=>mzOn()&&!!S.flags.mzFight&&!S.flags.mzMake;
function mzQr(a,b){/* ミオとノミのけんか（qrPair から） */return mzFightOn()&&!!a&&!!b&&(a.name===MIO&&b.name===NOMI||a.name===NOMI&&b.name===MIO)}

/* ---- 会話 ---- */
const MZL5=[[NOMI,'#alarm|ミオ。'],[NOMI,'3つめの水門は、ここだ。おまえが毎晩、歌いにきてた所だ。'],[MIO,'……。'],[NOMI,'知ってたんだろ。'],[MIO,'#cry hush|……ここをあけたら、カナデの霧が、消えちゃう。'],[NOMI,'#alarm big|村がかれていくのを、だまって見てたのか！'],[MIO,'#cry big|あなたには、わからない……！'],[MIO,'カナデは、わたしのとなりで、ずっと歌ってたの。ふたりで、ひとつの歌を。'],[MIO,'#cry|……もう、ひとりで歌うのは、いや。'],[NOMI,'#think hush|……わかるさ。だから、腹が立つんだ。']];
const MZL6=[[NOMI,'#surprise|……こいつは、岩じゃねえ。'],[MIO,'#surprise|ヌシ様……！'],[NUSHI3,'……ミオか。ノミも。……水門を、ひらいたのだな。'],[NOMI,'#alarm|なんで、こんな所で、ねむってた。'],[NUSHI3,'あの夜、大きな影が来た。この村の子らは、わたしをかばって、消えていった。'],[NUSHI3,'見おくらねばならなかった。……だが、わたしには、できなかった。'],[NUSHI3,'水を流せば、あの子らは、行ってしまう。だから、とじた。'],[NUSHI3,'……弱いヌシだ。'],[MIO,'#cry hush|……わたしと、おなじ。'],[NUSHI3,'……もう少し、ねむらせてくれ。水がめぐるまで。']];
const MZL7=[[NOMI,'ミオ。'],[MIO,'……。'],[NOMI,'この村には、おくりの水路ってのがあった。消えたやつを、夕暮れに、水にのせて見おくる。'],[NOMI,'その水路の手入れは、おれの仕事だった。'],[NOMI,'#think|水が止まって、だれも見おくれなくなって……おれは、にげた。岩場にこもって、なんにも見ないようにした。'],[NOMI,'だから、おまえに腹が立った。……おまえが、おれに見えたんだ。'],[MIO,'#cry hush|……ノミ。'],[NOMI,'いっしょに、ほるぞ。おくりの水路だ。'],[NOMI,'カナデが、さむくないように。']];
const MZL8E=[[MIO,'#alarm|霧が……こくなってる。'],[NOMI,'何か来る。でかいぞ。'],[MIO,'#think|水が流れるのを、とめにきたんだ。']];
const MZL8M=[[NOMI,'#proud|……水路は、こわれてねえ。'],[MIO,'#joy|みんな、守ってくれた。']];
const MZL9A=[[MIO,'……カナデ。'],[MIO,'わたしね、ずっと、あけたくなかった。'],[MIO,'あけたら、もう、会えない気がして。'],[MIO,'#think hush|でも、ここにいたら、カナデは、ずっと、さむいまま。']];
const MZL9B=[[MIO,'……歌うね。いつもの。']];
const MZL9C=[[MIO,'……。'],[MIO,'#cry big|……っ。'],[NOMI,'……いい歌だった。']];
const MZL10A=[[NUSHI3,'……水が、めぐっている。'],[NUSHI3,'守り神。ミオ。ノミ。……村の子らよ。'],[NUSHI3,'長いあいだ、待たせた。すまなかった。'],[NUSHI3,'あの子らを、見おくってくれて、ありがとう。'],[GOD,'#joy|聞こえるかの？　……水の音が、ここまで聞こえてきたわい。ヌシどの、おかえりなさいじゃ。'],[MIO,'#joy|……ヌシ様。']];
const MZL10B=[[MIO,'#think hush|……カナデ。']];
const MZL10C=[[MIO,'……ずっと、あけられなかった。お店の、はじめの日に、あけようって、言われてたから。'],[NOMI,'きょうが、はじめの日でいいだろ。霧が晴れたんだ。'],[MIO,'#joy|……うん。']];
const MZL10D=[[MIO,'#joy big|……ふたりの歌、みんなが、いっしょに歌ってくれた。'],[NOMI,'#shy|……うるせえ。二度とやらねえ。']];
const MZSING=[[MIO,'#hush|……ラ、ラ、ラ……。'],[NOMI,'#think hush|……あそこは。']];

/* ---- ヌシ様のこうら・おくりの水路 ---- */
function mzKameEnsure(){/* ため池の底に、ヌシ様のこうらを置く（前のセーブにも） */const M=S.mz;if(M.kj!=null&&S.obj[M.kj]==='mzkame')return;const [x0,,x1,y1]=M.pond,y=y1-2;
  for(let dx=0;dx<=x1-x0;dx++)for(const x of[CX+5+dx,CX+5-dx]){if(x<x0||x>x1)continue;const j=y*W+x;if(!S.obj[j]){S.obj[j]='mzkame';M.kj=j;return}}}
const mzInPond=j=>{const [x0,y0,x1,y1]=S.mz.pond,x=j%W,y=(j/W)|0;return x>=x0&&x<=x1&&y>=y0&&y<=y1};
function mzOkuriPath(){/* 3つめの水門の前から、村の南の池（ため池でない、低い所の水）まで、水の流れる向きにつながった水路（つながっていなければ null） */const M=S.mz,g=mzGate3();if(g<0)return null;const N=W*H,prev=new Int32Array(N).fill(-2),q=[];
  for(const n of mzAdj(g))if(M.cn[n]&&hiAt(n)<=hiAt(g)){prev[n]=-1;q.push(n)}
  for(let i=0;i<q.length;i++){const c=q[i];if(mzAdj(c).some(n=>S.ground[n]===1&&!M.cn[n]&&!mzInPond(n)&&hiAt(n)===0)){const P=[];for(let k=c;k!==-1;k=prev[k])P.push(k);return P.reverse()}
    for(const n of mzAdj(c))if(prev[n]===-2&&M.cn[n]&&hiAt(n)<=hiAt(c)){prev[n]=c;q.push(n)}}return null}
function mzOkuriProg(){if(!S.qTalked)return '';return mzOkuriPath()?'':'おくりの水路：南の池まで、まだつながっていない'}
function mzPondProg(){if(S.flags.mzKame)return '';if(mzFightOn()&&!S.mz.kq)return 'ミオとノミが、口をきかない';return mzWaitProg('kq')}
function mzWaitProg(k){if(!S.mz[k])return '';if(isNight())return '朝を待とう';const m=mzHere(MIO);if(!m)return 'ミオが村にいない';return m.act&&m.act.type==='mzwait'&&m.act.stage==='do'?'ミオが待っている':'ミオが向かっている'}

/* ---- キリノオオカゲ ---- */
function mzKiriWave(list,day){/* waveFor から：来る夜に、キリノオオカゲをまぜる */if(!mzOn()||S.free||!mzQ('mzkiri')||S.flags.mzKiriDown||S.mz.kD==null||day-1!==S.mz.kD)return list;list.unshift('kirino');return list}
const mzKiris=()=>S.enemies.filter(e=>e.type==='kirino'&&e.spawned&&!e.dead);
function mzKiriFog(j){/* 見張り台のとどく所が半分になるか */if(!mzOn())return false;const x=j%W+.5,y=((j/W)|0)+.5;return mzKiris().some(e=>Math.hypot(e.x-x,e.y-y)<=MZKFOGR)}
function mzKiriDefeat(e){if(e.type==='kirino'&&mzOn()){S.flags.mzKiriDown=1;memo('sword','キリノオオカゲを追いはらった')}}
function mzIceTick(){/* キリノオオカゲのまわりの、水の流れる水路が、こおる */const L=mzKiris();if(!L.length||!MZC.wet)return;const I=S.mz.ice||(S.mz.ice={});
  for(const e of L){const ex=e.x|0,ey=e.y|0;for(let b=-MZKICER;b<=MZKICER;b++)for(let a=-MZKICER;a<=MZKICER;a++){const x=ex+a,y=ey+b;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(MZC.wet[j]&&!I[j]){I[j]=1;dirty=true}}}}
function mzKiriProg(){const M=S.mz,d=dayNo();if(S.flags.mzKiriDown)return '';if(M.kD==null||M.kD>d)return M.kD!=null?'キリノオオカゲが来るまで：あと'+(M.kD-d)+'日':'';return '今夜、キリノオオカゲがやってくる'}

/* ---- そばへ歩いて、待つ（ため池の底・3つめの水門） ---- */
function mzWaitAt(k){const M=S.mz;if(k==='kq')return M.kj;const g=mzGate3();return g}
function mzStoryDecide(r,G){/* mzDecide から */const M=S.mz,k=M.kq&&mzQ('mzpond')?'kq':M.sq&&mzQ('mzsend')?'sq':null;if(!k||WSRUN||isNight()||enemyLive())return false;if(r.name!==MIO&&r.name!==NOMI)return false;if(r.hunger<250||r.meal||r.carry||r.bm)return false;
  const j0=mzWaitAt(k);if(j0==null||j0<0)return false;const t=r.name===NOMI&&k==='sq'?Math.min(W*H-1,j0+3*W):j0,here=(r.y|0)*W+(r.x|0),c=yamiFreeNear(t,r,G);if(c<0)return false;/* ノミは、少しはなれて立つ */
  if(c===here)return startAct(r,G,'mzwait',-1,{dur:MZWAITMAX,k,fj:j0}),true;return startAct(r,G,'ywalk',c,{}),true}
ACT.mzwait={start(r,a){r.bubble='';r.nap=false;a.h0=r.hunger;a.f0=r.fun;a.e0=r.energy;r.face=(a.fj%W)+.5>=r.x?1:-1},tick(r,a){r.hunger=Math.max(r.hunger,a.h0);r.fun=Math.max(r.fun,a.f0);r.energy=Math.max(r.energy,a.e0)},done:(r,a)=>a.t>=a.dur||isNight()||!S.mz[a.k]||!!WSRUN};
const mzWaiting=(n,k)=>{const r=mzHere(n);return !!(r&&r.act&&r.act.type==='mzwait'&&r.act.k===k&&r.act.stage==='do')};
function mzReady(k){/* ミオが待っていて、ノミも待っている（いないか、MZWAITMAX 待っても来なければ、ミオだけで） */if(!mzWaiting(MIO,k))return false;if(!mzHere(NOMI)||mzWaiting(NOMI,k))return true;const m=mzHere(MIO);return m.act.t>=MZWAITMAX*.8}
function mzWaitEnd(){for(const r of S.res)if(r.act&&r.act.type==='mzwait')endAct(r)}
function mzKameTap(j){if(j!==S.mz.kj)return false;if(S.ground[j]===1&&!S.flags.mzDawn){toast('水の底に、なにかがしずんでいる');return true}
  if(S.flags.mzKame){toast(S.flags.mzDawn?'水のヌシ様が、こうらの上のハスを見ている':'水のヌシ様が、ねむっている');return true}
  if(!mzQ('mzpond')){toast('ため池の底の、大きな岩');return true}if(isNight())return toast('朝を待とう'),true;if(!mzHere(MIO))return toast('ミオが村にいません'),true;
  S.mz.kq=1;toast('ミオとノミが、岩のそばへ向かう');renderQuest();return true}
function mzSendTap(j){/* 3つめの水門：ミオといっしょにひらく（mzTap から） */if(j!==mzGate3()||S.flags.mzSent)return false;
  if(!mzQ('mzsend')){if(S.flags.mzFight)toast('ミオといっしょに来よう');else return false;return true}
  const h=hour();if(h<MZSENDH0||h>=MZSENDH1)return toast('夕方に来よう'),true;if(!mzHere(MIO))return toast('ミオが村にいません'),true;S.mz.sq=1;toast('ミオが、水門へ向かう');renderQuest();return true}

/* ---- 場面 ---- */
const MZV={kame:0,rise:0,kan:null};/* 見た目だけ（保存しない） */
function mzSceneKame(){const j=S.mz.kj,x=j%W+.5,y=((j/W)|0)+.5;
  wsScene([{to:[x,y-.5,1.6,1.4],ms:300},{fn:()=>{MZV.kame=performance.now();sfx('wave')},ms:1400},{to:[x,y-.5,1,2.4],ms:300},{dlg:MZL6}],
    ()=>{S.flags.mzKame=1;S.mz.kameD=dayNo();S.mz.kq=0;mzWaitEnd();memo('spirit','ため池の底で、水のヌシ様に会った');checkQuest();renderQuest();save()})}
function mzSceneSend(){const g=mzGate3(),gx=g%W+.5,gy=((g/W)|0)+.5,P=mzOkuriPath()||[];
  wsScene([{to:[gx,gy+.5,1.6,1.4],ms:200},{fn:()=>{MZV.kan={t0:performance.now(),ph:'stand',P}},ms:1200},{dlg:MZL9A},
    {fn:()=>{const m=mzHere(MIO);if(m){m.face=gx>=m.x?1:-1;JUMP.set(m,performance.now())}if(S.obj[g]==='mzgateb')mzGateOpen(g,m||null)},ms:1800},{dlg:MZL9B},
    {fn:()=>{MZV.kan.ph='go';MZV.kan.t1=performance.now();if(typeof musicDuck==='function')musicDuck(7000);sfx('wave')},ms:7000},{dlg:MZL9C}],
    ()=>{MZV.kan=null;S.flags.mzSent=1;S.mz.sentD=dayNo();S.mz.sq=0;mzWaitEnd();memo('lotus','カナデを、おくりの水路で見おくった');checkQuest();renderQuest();save()})}
function mzSceneDawn(){const M=S.mz,[x0,y0,x1,y1]=M.pond,cx=(x0+x1)/2+.5,cy=(y0+y1)/2+.5,g=mzGate3();
  wsScene([{fn:()=>{M.clr.fill(1);mzRefresh();MZC.mist=null;mzRefresh();if(typeof hdBig==='function')hdBig(8000)},ms:400},{to:[cx,cy,.9,2.2],ms:300},
    {fn:()=>{M.full=1;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)S.ground[y*W+x]=1;M.v++;recount();dirty=true;MZV.rise=performance.now();sfx('level')},ms:3200},{dlg:MZL10A},
    {fn:()=>{const f=mzFlowerSpot(g);if(f>=0){S.obj[f]='lily';recount();if(typeof plantSparkle==='function')plantSparkle(f,'lily');M.fj=f}}},{to:[mzX(g),mzY(g),1.6,1.6],ms:500},{dlg:MZL10B}],
    ()=>{S.flags.mzDawn=1;M.dawnD=dayNo();memo('lotus','村じゅうの霧が晴れて、水がめぐった');checkQuest();renderQuest();save()})}
const mzX=j=>j%W+.5,mzY=j=>((j/W)|0)+.5;
function mzFlowerSpot(g){if(g<0)return -1;for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=g%W+dx,y=((g/W)|0)+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(!S.obj[j]&&!S.floor[j]&&S.ground[j]===0&&!S.mz.cn[j]&&walk(j))return j}return -1}
function mzSceneEnd(){const sh=typeof shopOf==='function'?shopOf():null,m=mzHere(MIO),j=sh&&sh.sign>=0?sh.sign:m?(m.y|0)*W+(m.x|0):S.mz.kj;
  wsScene([{to:[mzX(j),mzY(j),1.4,1.6],ms:300},{dlg:MZL10C},{fn:()=>{const now=performance.now();for(const r of S.res)if(!r.hidden){JUMP.set(r,now+((Math.random()*600)|0));if(typeof JOYU!=='undefined')JOYU.set(r,now+3200)}sfx('good');if(typeof juiceCheer==='function')juiceCheer('quest')},ms:3400},{dlg:MZL10D}],
    ()=>{S.flags.mzEnd=1;memo('music','食堂で、ふたりの歌を、みんなで歌った');checkQuest();renderQuest();save()})}
function mzSceneSing(){const g=mzGate3();wsScene([{to:[mzX(g),mzY(g)+1,1.2,1.6],ms:600},{dlg:MZSING}],()=>{S.flags.mzSing=1;save()})}
function mzSceneKiriEve(){S.mz.kEve=dayNo();const L=windLines(MZL8E);if(L.length)dialog(L,null,null,MIO);renderQuest()}

/* ---- 毎秒 ---- */
let MZST=0;
function mzStoryTick(dt){if(!mzOn()||S.free||IS_STORY_REPLAY)return;if((MZST+=dt)<1)return;MZST=0;if(typeof MEMRUN!=='undefined'&&MEMRUN)return;mzIceTick();if(WSRUN)return;mzKameEnsure();
  const M=S.mz,h=hour(),d=dayNo();
  if(S.flags.mzEnd&&!S.cleared&&S.quest>=QUESTS.length&&S.qStory==null){S.cleared=true;S.clearDay=dayNo();toast('霧のみずべの村に、水がめぐった','good');renderQuest();save();return}
  if(mzQ('mzkiri')&&!S.flags.mzKiriDown){if(M.kD==null){M.kD=h<MZKEVEH?d:d+1;renderQuest()}else if(d>M.kD&&h>=6&&h<23){M.kD=d+MZKRETRY-1;M.kEve=null;toast('キリノオオカゲは、また来る','warn');renderQuest()}}
  if(!stageReady()||camAnim||!$('#dialog').hidden||sheet!=null)return;
  if(mzQ('mzkiri')&&!S.flags.mzKiriDown&&d===M.kD&&h>=MZKEVEH&&h<23&&M.kEve!==d&&(mzHere(MIO)||mzHere(NOMI)))return mzSceneKiriEve();
  if(mzQ('mzfind3')&&!S.flags.mzSing&&h>=21&&h<23&&!enemyLive()&&mzHere(NOMI)&&mzHere(MIO))return mzSceneSing();
  if(enemyLive())return;
  if(mzQ('mzpond')&&M.kq&&!S.flags.mzKame&&mzReady('kq'))return mzSceneKame();
  if(mzQ('mzsend')&&M.sq&&mzReady('sq'))return mzSceneSend();
  if(mzQ('mzdawn')&&!S.flags.mzDawn&&M.sentD!=null&&d>M.sentD&&h>=6&&h<12)return mzSceneDawn();
  if(mzQ('mzdawn')&&S.flags.mzDawn&&!S.flags.mzEnd&&h>=MZENDH&&h<22)return mzSceneEnd()}
function mzStoryMorning(){if(mzOn())S.mz.ice={}}/* こおった水路は、朝にとける */
function mzDawnProg(){if(S.flags.mzDawn)return '夕方を待とう';return '朝を待とう'}
function mzStoryMig(){/* 前のならびで「つづき」（mzNext）まで来ていたセーブ：3つめの水門を見つけたお礼の会話から、もう一度 */if(WD!==MIZU||!S.mz||S.flags.mzq3)return;S.flags.mzq3=1;const i=questIndexOf('mzfind3');if(S.quest===i+1&&!S.flags.mzFight){S.quest=i;S.qTalked=true;S.qStory=null}}

/* ---- 絵（コードの仮のドット絵。1ドットは2） ---- */
function mzOval(c,cx,cy,rx,ry,col){c.fillStyle=col;for(let q=-ry;q<=ry;q+=2){const w=Math.round(rx*Math.sqrt(Math.max(0,1-q*q/(ry*ry+.01)))/2)*2;if(w>0)c.fillRect(Math.round(cx/2)*2-w,Math.round((cy+q)/2)*2,w*2,2)}}
function mzKameDraw(c,x,y,i,now){/* ヌシ様のこうら（マス i の、まん中の下が足もと）。水の中では、うすく見える */const cx=x+16,cy=y+18,M=S.mz,wet=S.ground[i]===1&&!S.flags.mzDawn,rise=MZV.rise?Math.min(1,(now-MZV.rise)/2600):S.flags.mzDawn?1:0,lift=Math.round(rise*6/2)*2;
  c.save();if(wet)c.globalAlpha=.4;
  if(S.flags.mzKame||MZV.kame){const k=MZV.kame?Math.min(1,(now-MZV.kame)/1200):1;c.globalAlpha*=k;mzOval(c,cx+30,cy-lift+2,10,7,'#6f8f73');mzOval(c,cx+30,cy-lift,9,6,'#8fb08f');c.fillStyle='#2f3a33';c.fillRect(cx+32,cy-lift-2,2,2);c.globalAlpha=wet?.4:1}/* 顔 */
  mzOval(c,cx,cy-lift+4,40,18,'#5d6b5c');mzOval(c,cx,cy-lift,38,16,'#8a9484');mzOval(c,cx-4,cy-lift-4,30,10,'#a4ad9c');
  for(const [a,b] of[[-18,-2],[0,-6],[18,-2],[-8,6],[10,6]]){c.fillStyle='#737d6e';c.fillRect(cx+a-6,cy-lift+b,12,2);c.fillRect(cx+a-2,cy-lift+b-4,4,2)}
  if(S.flags.mzDawn){const o=Math.sin(now/700)*2;mzOval(c,cx-2,cy-lift-12,10,4,'#5f9a58');for(const [a,b] of[[-6,-18],[0,-22],[6,-18],[-3,-15],[3,-15]])mzOval(c,cx-2+a,cy-lift+b+o,4,4,'#f2a7c3');mzOval(c,cx-2,cy-lift-18+o,2,2,'#fff0a8')}
  else{c.fillStyle='#8c7a55';c.fillRect(cx-4,cy-lift-14,2,10);c.fillRect(cx-8,cy-lift-16,10,2);c.fillStyle='#a8956a';c.fillRect(cx+4,cy-lift-10,6,2)}/* かれたハス */
  c.restore()}
function mzKanadePos(now){const K=MZV.kan,g=mzGate3();if(g<0)return null;let x=mzX(g),y=mzY(g)+1,al=.5+Math.sin(now/600)*.08;
  if(K&&K.ph==='go'){const P=K.P||[],t=(now-K.t1)/1000,n=Math.min(P.length,20);if(n){const p=Math.min(n-1,t*3),i=Math.floor(p),f=p-i,a=P[i],b=P[Math.min(n-1,i+1)];x=mzX(a)*(1-f)+mzX(b)*f;y=mzY(a)*(1-f)+mzY(b)*f}al*=Math.max(0,1-Math.max(0,t-4)/2.4)}
  else if(K)al=Math.min(.6,(now-K.t0)/1500*.6);return {x,y,al}}
function mzKanadeOn(){if(!mzOn()||S.free||S.flags.mzSent)return false;if(MZV.kan)return true;const h=hour();return !!S.flags.mzFight&&(h>=17||h<6)}
function mzKanadeDraw(c,now){const p=mzKanadePos(now);if(!p||p.al<=0)return;const X=p.x*TS,Y=p.y*TS;c.save();c.globalAlpha=p.al;/* 白い影（カナデ）：ずきんの形 */
  mzOval(c,X,Y-8,12,14,'#f4f8fb');mzOval(c,X,Y-24,10,10,'#ffffff');c.fillStyle='#ffffff';c.fillRect(Math.round(X/2)*2-2,Math.round((Y-38)/2)*2,4,6);c.fillStyle='#c9dde6';c.fillRect(Math.round(X/2)*2-6,Math.round((Y-24)/2)*2,2,2);c.fillRect(Math.round(X/2)*2+4,Math.round((Y-24)/2)*2,2,2);
  if(MZV.kan&&MZV.kan.ph==='go')for(let k=0;k<6;k++){const t=(now/1000+k*.37)%1.6,a=(k*1.7)%6.28;c.globalAlpha=p.al*(1-t/1.6);c.fillStyle=k%2?'#ffd7e6':'#fff6c8';c.fillRect(Math.round((X+Math.cos(a)*18)/2)*2,Math.round((Y-10-t*24)/2)*2,4,4)}/* 花びらのような光 */
  c.restore()}
function mzKiriMistDraw(c,now){/* キリノオオカゲのまわりの霧 */for(const e of mzKiris()){const X=e.x*TS,Y=e.y*TS;c.save();for(let k=0;k<14;k++){const a=k*.45+now/4000,r=(MZKFOGR-1.5+Math.sin(now/900+k)*.8)*TS*(k%2?.6:1);c.globalAlpha=.22;mzOval(c,X+Math.cos(a)*r,Y+Math.sin(a)*r*.6,46,20,'#e6eef2')}c.restore()}}
