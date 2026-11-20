'use strict';
/* 火山の物語の山場（kagari.js）。
   1. かえり道のあかり：村の南の入り口のあかり（kaeribi）。カガリが帰るまで、ホムラがまいばん夕方にともしにいく（ACT.vigil）。ともした夜だけ光る（kgrLit）
   2. カガリが帰ってくる：おまつりのあとの依頼（kagari）を聞いたつぎの夕方、ホムラとシズクがあかりのそばにいると、南の道から、カガリが自分で歩いて帰ってくる（kgrReturn）。
      会話をさいごまで見てから、帰ってきたことにする（S.flags.kagariCame）。とちゅうでとじたら、つぎの夕方にはじめから
   3. 幕間「影のがわ」：夜のはじめに、会話のない短い場面を3つ（kgrIvPlay）。A ハイカゲが火に灰をかぶせて消してしまう／B 入り口のあかりを遠くから見る影／C 火山のふもとに影があつまる
   4. さいごのうずみ火：ヌシ様がもどった夜、小さなハイカゲが台座の火に灰をかぶせる。こんどは消えず、あたたまって、しずかに消える（kgrEndPlay）
   場面の動き・カメラは実時間。幕間とさいごの場面のあいだは、村の時間を止める（SCENEHOLD）。絵は行燈とコワイノのチップ、火と灰はコードのドット */
const KGRH0=17.5,KGRH1=19.5;/* ホムラがあかりをともしにいく時刻 */
const KGRDUR=30;/* あかりのそばで道の先を見ている長さ（村の時間） */
const KGRIVH0=20,KGRIVH1=22.5;/* 幕間・さいごの場面の時刻（夜のはじめ） */
let KGRRUN=null,KGRIV=null;const KGRLIT={v:null,S:null};let KGRT=0;
function kgrOn(){return !!S&&WD===1&&!S.free&&!IS_STORY_REPLAY&&!MEMRUN&&!!S.st2}
function kgrQi(id){return QUESTS.findIndex(q=>q.id===id)}
function kgrLampJ(){const j=S&&S.st2&&S.st2.lamp;return j!=null&&S.obj[j]==='kaeribi'?j:-1}
function kgrLit(){return !!S&&WD===1&&!!S.st2&&(!!S.flags.kagariCame||S.st2.lampD===callDay())}
function kgrLampTxt(){return S.flags.kagariCame?'かえり道のあかり：まだ帰っていない、なかまのためのあかり':'かえり道のあかり：ホムラが、まいばん夕方にともしている'}
function kgrLampNeed(){return kgrOn()&&S.quest>=1&&(!!S.flags.kagariCame||S.quest<=kgrQi('kagari'))}
function kgrLampPlace(){/* 村の南の入り口：まん中の少し南の、空いた地面 */
  const tx=CX+2,ty=CY+8;let best=-1,bd=1e9;
  for(let y=ty-6;y<=ty+6;y++)for(let x=tx-8;x<=tx+8;x++){if(x<2||y<2||x>=W-2||y>=H-2)continue;const j=y*W+x;
    if(!walk(j)||S.obj[j]||S.floor[j]||S.ground[j]!==0||S.edge&&S.edge[j])continue;if(!walk(j-1)&&!walk(j+1))continue;/* 横に立つ所がいる */
    const d=Math.hypot(x-tx,y-ty);if(d<bd){bd=d;best=j}}
  if(best<0)return;S.obj[best]='kaeribi';S.st2.lamp=best;recount();dirty=true}
/* ---------- 1. ホムラが、夕方にあかりをともしにいく ---------- */
function kgrDue(){/* カガリが帰ってくる夕方か */return kgrOn()&&!S.flags.kagariCame&&QUESTS[S.quest]&&QUESTS[S.quest].id==='kagari'&&S.qTalked&&S.qStory==null&&callDay()>(S.flags.kgrFrom??-1)}
function goVigil(r,G){
  if(!kgrOn()||r.name!==HOMURA||S.flags.kagariCame||isNight()||enemyLive()||KGRRUN)return false;
  const h=hour();if(h<KGRH0||h>=KGRH1||S.st2.lampD===callDay()||r.hunger<400||kgrDue())return false;/* カガリが帰ってくる夕方は、場面の中でともす */
  if(typeof storyCalled==='function'&&storyCalled(r))return false;
  const L=kgrLampJ();if(L<0)return false;
  let st=nearest(G,j=>(j===L-1||j===L+1)&&walk(j)&&!S.obj[j],9999);if(st<0)st=nearest(G,j=>j===L-W&&walk(j)&&!S.obj[j],9999);if(st<0)return false;
  startAct(r,G,'vigil',st,{lamp:L,dur:KGRDUR});return !!(r.act&&r.act.type==='vigil')}
ACT.vigil={start(r,a){r.face=a.lamp%W+.5>=r.x?1:-1;r.bubble='';sacredScenePose(r,'kneelTouch',4000,{side:true,face:r.face})},
  tick(r,a){if(!a.lit&&a.t>=3){a.lit=1;S.st2.lampD=callDay();sfxAt('crackle',a.lamp%W+.5,(a.lamp/W|0)+.5);recount();KGRLIT.v=true;KGRLIT.S=S;SACRED_POSES.delete(r);sacredScenePose(r,'storyListen',600000,{front:true})}},/* ともしたら、道の先（手前）を見る */
  done:(r,a)=>a.t>=a.dur||isNight()||enemyLive(),
  end(r,a){SACRED_POSES.delete(r);if(a.lit)r.wanderRestUntil=S.t+30}};
ACT_LBL.vigil='入り口のあかりを見ている';
/* ---------- 2. カガリが帰ってくる ---------- */
function kgrProg(){if(S.flags.kagariCame)return '';if(isNight())return '朝を待とう';if(!volWho(HOMURA))return 'ホムラがもどるのを待とう';if(callDay()<=(S.flags.kgrFrom??-1)||hour()<KGRH0)return '夕方を待とう';return ''}
const KGR_MEET=[
  [KAGARI,'#surprise|……あかりだ。ほんとに、ついてる……。'],
  [HOMURA,'#surprise|……カガリ？ カガリなのかい！'],
  [KAGARI,'#surprise|ホムラねえ……？ ほんとに、ホムラねえ……？']];
const KGR_ANGER=[
  [KAGARI,'#alarm big|こないで！'],
  [KAGARI,'#danger|「すぐ追いつくから、先に行きな」って言ったじゃないか。あたしたち、山のむこうで、ずっと待ってたんだよ。'],
  [KAGARI,'#sigh|いくら待っても来ないから……ホムラねえは、もう消えちゃったんだって、みんなで泣いたんだ。'],
  [HOMURA,'#sigh|……うそだったんだよ。だれかがのこらなきゃ、「コワイノ」は、みんなを追いかけた。'],
  [HOMURA,'#think hush|ほんとのことを言ったら、あんたたちは、のこるって言っただろ。'],
  [KAGARI,'#teary|……ずるいよ。ひとりで決めて、ひとりでのこって。'],
  [SHIZUKU,'……カガリさん。ホムラさんは、まいばん、ここにあかりをともしていました。'],
  [KAGARI,'#surprise|……ゆうべ、山のむこうの丘から、この村に、小さなあかりが見えたんだ。'],
  [KAGARI,'#teary|ホムラねえの火の色だって、すぐわかった。……だから、帰ってこられた。'],
  [HOMURA,'#teary|……おかえり、カガリ。']];
const KGR_HOME=[
  [KAGARI,'#teary|……ただいま。……でも、まだ、ゆるしてないからね。'],
  [HOMURA,'#joy|……ああ。ゆっくりでいいさ。'],
  [SHIZUKU,'#joy|はじめまして。水のせいれいの、シズクです。……おかえりなさい。'],
  [KAGARI,'#surprise|……水のせいれいが、この村に？'],
  [HOMURA,'#joy|ああ。いまの村には、いろんな子がいるのさ。']];
const kgrLines=L=>L.filter(l=>l[0]===KAGARI||!!volWho(l[0]));
function kgrSpawnCell(L){/* 南の道の先：あかりから歩いて6〜11マスの、あかりより南の所 */
  const G=bfs(L%W,(L/W|0)+1),lx=L%W,ly=L/W|0;let best=-1,bs=1e9;
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<6||d>11||!walk(j)||S.obj[j])continue;const y=j/W|0;if(y<ly+4)continue;const s=Math.abs(j%W-lx)*2+Math.abs(d-8);if(s<bs){bs=s;best=j}}
  return best}
function kgrTempClean(){/* 場面の外にのこった、帰ってきたことになっていないカガリ（とちゅうでとじたセーブ）をけす */if(KGRRUN||S.flags.kagariCame)return;const n=S.res.length;S.res=S.res.filter(r=>!r.kgrTemp);if(S.res.length!==n){recount();dirty=true}}
function kgrReturn(){
  const L=kgrLampJ(),h=volWho(HOMURA);if(L<0||!h)return;const sp=kgrSpawnCell(L);if(sp<0)return;
  const run=KGRRUN={S,session:VILLAGE_SESSION},ok=()=>KGRRUN===run&&S===run.S&&VILLAGE_SESSION===run.session&&!volUnsafe();
  const lx=L%W+.5,ly=(L/W|0)+.5;let k=null;
  const stop=()=>{if(KGRRUN===run)KGRRUN=null;if(S!==run.S||VILLAGE_SESSION!==run.session)return;if(k&&!S.flags.kagariCame){S.res=S.res.filter(r=>r!==k);recount()}for(const r of S.res)if(r.act&&r.act.type==='nmeet')endAct(r);sacredEndDirection(true)};
  const say=(Ls,then)=>{if(!ok())return stop();DLGTAP=performance.now();const ls=kgrLines(Ls);if(!ls.length)return then();if(dialog(ls,()=>{if(!ok())return stop();then()})===false)then()};
  const d=volDir();if(!d){KGRRUN=null;return}d.kgr=true;
  volPair(lx,ly,(hh,ss)=>{if(!ok())return stop();
    volFace(hh,lx);volPose(hh,'kneelTouch',2600);/* ひざをついて、あかりをともす */
    villageTimeout(()=>{if(!ok())return stop();S.st2.lampD=callDay();recount();sfxAt('crackle',lx,ly);
      for(const q of[hh,ss])if(q){q.face=1;volPose(q,'storyListen',600000,{front:true})}/* 道の先（手前）を見る */
      villageTimeout(()=>{if(!ok())return stop();
        k=mkRes(S,KAGARI,'fire',sp%W+.5,(sp/W|0)+.5);k.kgrTemp=1;k.came=dayNo();k.hunger=750;k.face=1;S.res.push(k);recount();
        volShot([[lx,ly],[sp%W+.5,(sp/W|0)+.5]],[hh,ss,k],2.2,1.6);quietBeat(2400);
        volWalk(k,lx,ly+2,{cap:16000},()=>{if(!ok())return stop();volFace(k,hh?hh.x:lx);volShot([[lx,ly]],[hh,ss,k],2.4,1.2);
          say(KGR_MEET,()=>{
            if(hh){volFace(hh,k.x);volPose(hh,'talkshock',1200)}JUMP.set(hh,performance.now());
            volWalk(hh,k.x,k.y-1,{close:1.2,cap:5000},()=>{if(!ok())return stop();/* かけよる */
              volFace(k,hh.x);volPose(k,'stepBack',1400);volHop(k,k.x,k.y+.7,380,()=>{/* あとずさる */
                if(!ok())return stop();if(hh)volPose(hh,'shoulderDrop',600000);
                say(KGR_ANGER,()=>{if(!ok())return stop();
                  volWalk(k,hh.x+(k.x>=hh.x?.7:-.7),hh.y,{close:.9,cap:5000},()=>{if(!ok())return stop();/* こんどは、カガリから */
                    volFace(k,hh.x);volFace(hh,k.x);volPose(k,'storyHug',600000);volPose(hh,'storyHug',600000);sfx('good');
                    villageTimeout(()=>{say(KGR_HOME,()=>kgrHome(run,k,hh,ss))},1200)})})})})})})},1800)},1700)},{dy:0,gap:1,cap:40000});}
function kgrHome(run,k,hh,ss){/* さいごまで見た：帰ってきたことにする */
  if(KGRRUN===run)KGRRUN=null;if(S!==run.S||VILLAGE_SESSION!==run.session)return;
  delete k.kgrTemp;S.flags.kagariCame=1;
  for(const q of[k,hh,ss])if(q){SACRED_POSES.delete(q);if(q.act&&q.act.type==='nmeet')endAct(q);JUMP.set(q,performance.now());JOYU.set(q,performance.now()+1800)}
  sacredEndDirection(true);toast('火のせいれい「カガリ」が、村に帰ってきた！','good');memo('heart','カガリが、村に帰ってきた');logEv('カガリが、村に帰ってきた');
  if(typeof juiceCheer==='function')juiceCheer();recount();dirty=true;checkQuest();renderQuest()}
/* ---------- 3. 幕間「影のがわ」（会話のない場面）・4. さいごのうずみ火 ---------- */
const KGRIVMS={a:12000,b:10500,c:12500,end:12500};
function kgrFreeCell(tx,ty,R,outside){let best=-1,bd=1e9;for(let y=ty-R;y<=ty+R;y++)for(let x=tx-R;x<=tx+R;x++){if(x<2||y<2||x>=W-2||y>=H-2)continue;const j=y*W+x;if(!walk(j)||S.obj[j]||S.ground[j]!==0)continue;if(outside&&VILL[j])continue;const d=Math.hypot(x-tx,y-ty);if(d<bd){bd=d;best=j}}return best}
function kgrIvWhich(){const f=S.flags.kgrIv||0,ix=id=>kgrQi(id);
  if(!(f&1)&&ix('haikage3')>=0&&(S.quest>ix('haikage3')||S.quest===ix('haikage3')&&S.qTalked))return 'a';
  if(!(f&2)&&S.flags.kagariCame&&kgrLampJ()>=0)return 'b';
  if(!(f&4)&&ix('springC')>=0&&S.quest>ix('springC')&&!S.flags.hinoDown)return 'c';
  return null}
function kgrSceneOK(){return $('#dialog').hidden&&!sacredDirection()&&!KGRRUN&&!KGRIV&&sheet==null&&performance.now()>=SCENEHOLD&&!enemyLive()&&!isNight()&&(typeof sacredPlayActive!=='function'||!sacredPlayActive())}
function kgrIvPlay(k){
  let x,y;if(k==='a'){const j=kgrFreeCell(CX+7,OFF+14,8,true);if(j<0)return false;x=j%W+.5;y=(j/W|0)+.5}
  else if(k==='b'){const L=kgrLampJ();if(L<0)return false;x=L%W+.5;y=(L/W|0)+.5}
  else if(k==='c'){x=VOLJ%W+1.5;y=(VOLJ/W|0)+5.5}
  else{const tw=S.obj.indexOf('tower');if(tw<0)return false;x=tw%W+1;y=(tw/W|0)+1}
  const ms=KGRIVMS[k],now=performance.now(),run=KGRIV={k,x,y,at:now+1300,ms,S,session:VILLAGE_SESSION};
  SCENEHOLD=now+ms+1600;sacredDirection(true);const lift=hiAt((y|0)*W+(x|0))*LIFT;
  storyShot([[x*TS-90,y*TS-80-lift],[x*TS+90,y*TS+30-lift]],{limit:2.6,seconds:1.3,full:true});quietBeat(ms+1300);
  villageTimeout(()=>{if(KGRIV!==run)return;KGRIV=null;SCENEHOLD=0;
    if(k==='end')return kgrEndTalk();
    S.flags.kgrIv=(S.flags.kgrIv||0)|{a:1,b:2,c:4}[k];S.flags.kgrIvD=callDay();sacredEndDirection(true);dirty=true},ms+1400);
  return true}
function kgrEndGather(){/* さいごのうずみ火：起きている、ホムラ・カガリ・シズクが、台座の前へ歩いてから */
  const tw=S.obj.indexOf('tower');if(tw<0)return;const x=tw%W,y=tw/W|0,run=KGRRUN={S,session:VILLAGE_SESSION},ok=()=>KGRRUN===run&&S===run.S&&VILLAGE_SESSION===run.session;
  const cast=[HOMURA,KAGARI,SHIZUKU].map(volWho).filter(r=>r&&!(r.act&&r.act.type==='sleep'));const d=sacredDirection(true);d.kgr=true;
  let n=0;const one=()=>{if(++n<cast.length)return;if(!ok())return;KGRRUN=null;for(const r of cast){r.face=r.x<x+1?1:-1;sacredScenePose(r,'storyListen',600000,{side:true,face:r.face})}if(!kgrIvPlay('end'))sacredEndDirection(true)};
  if(!cast.length)return one(),void(n=0);cast.forEach((r,i)=>volWalk(r,x+i*.9-.2,y+2.5,{cap:12000},one));
  storyShot([[(x+1)*TS-80,y*TS-40],[(x+1)*TS+80,(y+3)*TS]],{limit:2.4,seconds:1.2})}
function kgrEndTalk(){/* さいごのうずみ火：見おえてから、そばのせいれいのひとこと */
  S.flags.kgrEnd=1;dirty=true;memo('moonn','台座の火が、灰の下で、朝までねむった');
  const L=[[HOMURA,'#think hush|……そうか。あんたは、火の番だったんだね。'],[KAGARI,'#teary|……あったかそうだった。'],[SHIZUKU,'#joy|火が、灰の下で、朝までねむっています。'],[HOMURA,'#joy|おやすみ。……また、あしたの夜もおいで。']].filter(l=>!!volWho(l[0]));
  const end=()=>{for(const r of S.res)if(r.act&&r.act.type==='nmeet')endAct(r);sacredEndDirection(true)};if(!L.length||dialog(L,end)===false)end()}
function kgrIvReset(){KGRIV=null;KGRRUN=null}/* 村を切りかえたとき（resetVillageTransient から） */
/* ---------- 毎コマ（stepWorld） ---------- */
function kgrTick(){if(!kgrOn())return;const now=performance.now();if(now-KGRT<1000)return;KGRT=now;
  if(KGRIV&&(KGRIV.S!==S||KGRIV.session!==VILLAGE_SESSION))KGRIV=null;if(KGRRUN&&(KGRRUN.S!==S||KGRRUN.session!==VILLAGE_SESSION))KGRRUN=null;
  kgrTempClean();
  if(kgrLampNeed()&&kgrLampJ()<0)kgrLampPlace();
  {const lit=kgrLit();if(KGRLIT.S!==S){KGRLIT.S=S;KGRLIT.v=lit}else if(lit!==KGRLIT.v){KGRLIT.v=lit;recount()}}/* ともした・朝になった：夜の光の一覧を作りなおす */
  if(!kgrSceneOK())return;const h=hour();
  if(kgrDue()&&h>=KGRH0&&h<KGRH1){const ho=volWho(HOMURA);if(ho&&!(ho.act&&ho.act.type==='sleep')&&ho.hunger>=300)kgrReturn();return}
  if(h<KGRIVH0||h>=KGRIVH1)return;
  if(S.cleared&&!S.flags.kgrEnd&&S.obj.includes('tower')){kgrEndGather();return}
  if(S.cleared||S.flags.kgrIvD===callDay()||S.finalNight)return;/* 1晩に1つ。山の影の夜は出さない */
  const k=kgrIvWhich();if(k)kgrIvPlay(k)}
/* ---------- 絵：場面の影・火・灰（ゲームの点。2点のドットの四角） ---------- */
function kgrDot(x,y,w,h,col,a=1){if(a<=0)return;ctx.globalAlpha=Math.min(1,a);ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function kgrFire(X,Y,f,T){/* 小さなたき火：まき2本と、ゆれる火（f：火の強さ 0〜1） */
  kgrDot(X-8,Y-2,16,2,'#7a4a2a');kgrDot(X-6,Y-4,12,2,'#5e3820');
  if(f<=0)return;const n=Math.round(6*f);for(let i=0;i<n;i++){const ph=(T*1.4+i/n)%1,ox=((i*5)%9)-4,hh=(2+((i*3)%3))*f;kgrDot(X+ox,Y-6-ph*12*f,2,2,ph<.4?'#fff0b0':ph<.7?'#ffb347':'#ff7a3a',(1-ph)*f+.15)}
  kgrDot(X-3,Y-7,6,3,'#ffcf6a',.8*f);kgrDot(X-1,Y-10,2,3,'#fff3c4',.8*f)}
function kgrAsh(X,Y,T,t0,t1,n=10){/* 灰がふりかかる：T が t0〜t1 のあいだ、上からおちる灰の粒 */if(T<t0||T>t1+1)return;for(let i=0;i<n;i++){const s=t0+(i/n)*(t1-t0),q=(T-s)/1;if(q<0||q>1)continue;kgrDot(X-6+((i*7)%12),Y-22+q*18,2,2,i%2?'#9a958f':'#c8c3bc',1-q*.3)}}
function kgrMound(X,Y,a,glow,T){/* 灰の山（glow：灰の下の火の明るさ） */kgrDot(X-8,Y-4,16,3,'#8e8983',a);kgrDot(X-6,Y-6,12,2,'#a7a29b',a);kgrDot(X-3,Y-8,6,2,'#bdb8b1',a);
  if(glow>0){const p=.55+.35*Math.sin(T*2.4);kgrDot(X-5,Y-5,2,1,'#ff9a4a',glow*p*a);kgrDot(X+2,Y-6,2,1,'#ffb35a',glow*p*a);kgrDot(X-1,Y-4,2,1,'#ffd27a',glow*(1-p*.4)*a)}}
function kgrShade(ty,X,Y,sc,o,a=1,warm=0){if(a<=0)return;ctx.save();ctx.globalAlpha=a;drawShade(ctx,ty,X,Y,.27*(EN[ty]?EN[ty].size:.9)*2*sc,o.f||1,{dot:1,t:o.t||0,walk:!!o.walk,side:o.side||'',back:!!o.back});
  if(warm>0&&window.CHIPS&&typeof kgTint==='function'){/* あたたまって、ほんのり火の色に */const K='kg_'+ty+':idle',ch=CHIPS[K];if(ch){const s=.27*(EN[ty]?EN[ty].size:.9)*2*sc,fi=Math.floor((o.t||0)*1.6)%(ch.n||1);ctx.globalAlpha=a*warm*.55;ctx.translate(X,Y);ctx.scale(s,s);ctx.drawImage(kgTint(K,'#ffb35a'),0,fi*ch.h,ch.w,ch.h,ch.ax,ch.ay,ch.w,ch.h)}}
  ctx.restore()}
const kgrEase=q=>q<=0?0:q>=1?1:q*q*(3-2*q);
function kgrIvDraw(now){const e=KGRIV;if(!e||e.S!==S)return;const T=(now-e.at)/1000;if(T<0)return;const lift=hiAt((e.y|0)*W+(e.x|0))*LIFT,X=e.x*TS,Y=e.y*TS-lift+10,out=T>e.ms/1000-1.4?Math.max(0,(e.ms/1000-T)/1.4):1;
  if(e.k==='a'){/* ハイカゲが、火を朝までのこそうとして灰をかぶせ、消してしまう。手をかざしても、つめたいまま */
    const f=T<5?1:T<7.5?1-(T-5)/2.5:0;kgrFire(X,Y,f,T);if(f<=0&&T<11)for(let i=0;i<3;i++){const q=((T-7.5)*.5+i/3)%1;kgrDot(X-2+i*2,Y-8-q*16,2,2,'#b9b4ae',(1-q)*.6)}/* けむり */
    kgrAsh(X,Y,T,5,7.2);const wk=T>=1.5&&T<4.5,sx=X-70+56*kgrEase((T-1.5)/3);
    kgrShade('ash',sx+(T>8.5?Math.sin(T*40)*1:0),Y,1,{t:T,walk:wk,side:wk?'R':'',f:1},Math.min(1,(T-1)*2)*out)}
  else if(e.k==='b'){/* 入り口のあかりを、遠くから見る影：ひとりが光の近くまで来て、もどっていく */
    const P=[[-26,74],[0,86],[28,76]];for(let i=0;i<3;i++){let ox=P[i][0],oy=P[i][1],wk=false,back=true;
      if(i===1){if(T>=1.5&&T<4){oy-=30*kgrEase((T-1.5)/2.5);wk=true}else if(T>=4&&T<5.5)oy-=30;else if(T>=5.5&&T<7){oy-=30*(1-kgrEase((T-5.5)/1.5));wk=true;back=false}}
      const sh=T>7?Math.sin(T*36+i)*1:0;kgrShade('basic',X+ox+sh,Y+oy,1,{t:T+i,walk:wk,back},Math.min(1,(T-.5)*1.5)*out)}}
  else if(e.k==='c'){/* 火山のふもとに、影があつまって、ひとつになる */
    const n=5,mg=T<5?0:T<9?(T-5)/4:1;for(let i=0;i<n;i++){const an=i/n*Math.PI*2+.4,r0=80,rr=r0*(1-kgrEase((T-1)/4))+10;kgrShade('ash',X+Math.cos(an)*rr,Y+Math.sin(an)*rr*.5,.8,{t:T+i,walk:T>1&&T<5},Math.min(1,T*1.5)*(1-mg)*out)}
    if(mg>0)kgrShade('ash',X+(T>9?Math.sin(T*30):0),Y,1.9,{t:T},mg*.85*out);
    if(T>6)for(let i=0;i<14;i++){const q=((T-6)*.25+i/14)%1;kgrDot(X-90+((i*53)%180),Y-110+q*130,2,2,'#bcb7b0',.55*(1-q)*out)}}/* 灰がふりはじめる */
  else if(e.k==='end'){/* 台座の火に、そっと灰をかぶせる。こんどは消えず、朝まであたたかい */
    const AX=X,AY=Y-50,wk=T>=1&&T<4.5,sx=X+72-48*kgrEase((T-1)/3.5);
    const cov=T<4.5?0:Math.min(1,(T-4.5)/2.5);kgrAsh(AX,AY+6,T,4.5,6.8,12);if(cov>0)kgrMound(AX,AY+6,cov,cov,T);
    const warm=T<7?0:Math.min(1,(T-7)/2.5),fade=T<10?1:Math.max(0,1-(T-10)/1.6);
    kgrShade('ash',sx,Y+14,.9,{t:T,walk:wk,side:wk?'L':''},Math.min(1,(T-.6)*2)*fade*out,warm);
    if(T>=10)for(let i=0;i<10;i++){const q=Math.min(1,(T-10)/1.8),ox=((i*37)%31)-15;kgrDot(sx+ox*(.4+q),Y-6-q*(26+i*3),2,2,i%2?'#ffcf6a':'#ffb347',(1-q)*.9)}}/* あたたまって、火の粉のようにほどける */
  ctx.globalAlpha=1}
function kgrAdd(add,now){if(!KGRIV||KGRIV.S!==S)return;add(KGRIV.y+.9,1,null,()=>{ctx.save();kgrIvDraw(now);ctx.restore()},-1)}
function kgrLights(g,now){/* 場面の火・灰の下の火の明かり（夜の暗さをけずる） */const e=KGRIV;if(!e||e.S!==S)return;const T=(now-e.at)/1000,lift=hiAt((e.y|0)*W+(e.x|0))*LIFT,X=e.x*TS,Y=e.y*TS-lift+10;let R=0,yy=Y-6;
  if(e.k==='a')R=T<5?70:T<7.5?70*(1-(T-5)/2.5):0;else if(e.k==='end'){R=T<4.5?60:40+6*Math.sin(T*2.4);yy=Y-44}
  if(R>2)g.drawImage(lightSpr(70),X-R,yy-R,R*2,R*2)}
