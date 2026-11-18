/* 季節と記念日（season.js）
   季節：SEASONDAYS 日ごとに、春・夏・秋・冬（1日めから春。ひとめぐり20日）。見た目・セリフと、季節の効き目（下の SEAFX。あとからつく倍なので掛け算）。
     朝にかわったら知らせて、思い出帳にのこす（seasonMorning）。日の欄のはじめに季節の名前。
     画面：春は花びら・秋は落ち葉・冬は雪（雨の日は雪がたくさんで、日の欄は「雪」）。夏は、ふだんのホタル。
     色：秋はあたたかく、冬はつめたく、ほんのり（SEATINT）。粒はドットの四角（seasonDraw）。
   記念日：村に来てから ANNIV 日めの朝、その子と、なかよしがよろこぶ。その日のお話は、記念日の話（annivTopic）。 */
const SEASONDAYS=5,SEASONS=['春','夏','秋','冬'],SEATINT=['rgba(255,214,232,.05)','','rgba(255,168,92,.07)','rgba(222,238,255,.11)'];
const ANNIV=[10,30,50,100,200,365];
function seasonOf(d){return Math.floor(Math.max(0,d-1)/SEASONDAYS)%4}
function seasonNow(){return S?seasonOf(dayNo()):0}
const snowNow=()=>seasonNow()===3&&!!S.rain;
function seasonMorning(){const d=dayNo();if(d<=1||seasonOf(d)===seasonOf(d-1))return;const n=SEASONS[seasonOf(d)];memo('',n+'になった');if(seasonOf(d)!==3)S.snowm=[];/* 雪だるまは、冬がおわるととける */{const L=S.res.filter(r=>!r.hidden);if(L.length&&typeof letterQ==='function')letterQ(pick(L),'season',{s:n},LETTERSEA[seasonOf(d)])}setTimeout(()=>toast(n+'になった　'+SEAFXT[seasonOf(d)],'good'),900)}
/* 粒：画面の中の場所（0〜1）。p：ゆれ、s：速さ、c：色 */
const SEAP=Array.from({length:60},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6,s:rnd(.5,1),c:Math.random()}));
const SEACOL=[['#f7c4d6','#f3aec5','#fbe0ea'],null,['#f6a650','#ec6f45','#f5d25a','#e2884a'],['#ffffff','#f1f6ff','#e4eefb']];
function seasonN(k){return k===3?(S.rain?60:26):k===0?22:k===2?30:0}
function seasonStep(dt,now){if(!S)return;const k=seasonNow(),n=seasonN(k);if(!n)return;for(let i=0;i<n;i++){const m=SEAP[i];
  m.y+=dt*(k===3?.08:.035)*m.s*(k===3&&S.rain?1.6:1);m.x+=Math.sin(now/1400+m.p)*dt*(k===3?.006:.014)+(k===2?dt*.006:0);
  if(m.y>1.02){m.y=-.02;m.x=Math.random()}if(m.x>1.02)m.x=-.02;if(m.x<-.02)m.x=1.02}}
function seasonDraw(ctx,now,dk){if(!S)return;const k=seasonNow();
  if(SEATINT[k]){ctx.fillStyle=SEATINT[k];ctx.fillRect(0,0,VW,VH)}
  const n=seasonN(k),C=SEACOL[k];if(!n||!C)return;if(k!==3&&dk>.5)return;/* 花びら・落ち葉は、くらくなったら出さない */
  const px=1.5;for(let i=0;i<n;i++){const m=SEAP[i],x=Math.round(m.x*VW/px)*px,y=Math.round(m.y*VH/px)*px;ctx.fillStyle=C[(m.c*C.length)|0];
    if(k===3){const z=m.s>.75?3:2;ctx.fillRect(x,y,px*z,px*z)}
    else{const f=Math.sin(now/300+m.p*3)>0;/* くるくるまわる：はばが2ドットと1ドット */ctx.fillRect(x,y,px*(f?3:1),px*2)}}}
/* 記念日 */
function annivOf(r){if(!r||!r.came||r.back)return 0;const n=dayNo()-r.came;return ANNIV.includes(n)?n:0}
function annivMorning(){if(typeof MEMRUN!=='undefined'&&MEMRUN)return;for(const r of S.res){if(r.hidden)continue;const n=annivOf(r);if(!n)continue;
  memo('',r.name+'が村に来て'+n+'日');if(typeof letterQ==='function')letterQ(r,'anniv',{n},String(n));const m=bestMate(r);
  villageTimeout(()=>{if(!S.res.includes(r))return;toast(r.name+'が村に来て'+n+'日！','good');addFloat(r.x,r.y-1.4,n+'日！','#ffe7a8');JUMP.set(r,performance.now());
    if(m&&!m.hidden&&S.res.includes(m)){addFloat(m.x,m.y-1.4,'おめでとう！','#ffd2e4');JUMP.set(m,performance.now()+250)}},1600)}}
function annivTopic(r){const n=annivOf(r);if(!n)return null;const m=bestMate(r);
  return{u:1,L:pick([['#joy|きょうでね、この村に来て'+n+'日なんだ！','あっというまだったなあ。'],['この村に来てから、'+n+'日たったんだって。','#joy|これからも、ずっとここにいたいな。'],m?['この村に来て、'+n+'日。',m.name+'に会えて、ほんとうによかったよ。']:['#joy|'+n+'日も、この村ですごしたんだね。','守り神さまのおかげだよ。']])}}
/* 季節のお話（smallTalk に入る） */
const TALKSEA=[
  [['春の風って、あまいにおいがするね。','花が、あちこちで目をさましてるよ。'],['#joy|あったかくなってきたね！','おひさまの下で、ねころびたいな。']],
  [['あついねえ……。','水べにいると、ほっとするよ。'],['夏の夜は、ひかる虫がとんでるね。','#joy|ずっと見ていられるよ。']],
  [['葉っぱの色が、かわってきたね。','赤に黄色に、きれいだなあ。'],['秋って、なんだかおなかがすくんだ。','#joy|おいしい物が、いっぱいだもんね。']],
  [['#sigh|さむいね……。','みんなで、くっついていたいな。'],['冬の朝は、空気がきらきらしてるんだ。','息が、白くなるよ。']]];
/* ---------- 季節の効き目（SEAFX）：いつもの数（能力・へり方）は実数のまま、季節の分は、あとからかける倍（掛け算）。
   能力＝はたらく速さ・移動速度・スタミナ。春：木のせいれい1.2倍。夏：火・水のせいれい1.2倍、みんなのつかれのへり1.2倍。秋：土のせいれい1.2倍。
   冬：移動速度0.8倍・おなかのへり1.2倍（火のせいれいと、あたたかい物 WARMOBJ・温泉の水・火のせいれいのまわり3マスにいる子はかわらない seaWarm）、風のせいれい1.2倍、
   コワイノの体力・攻撃・速さ0.8倍（冬の夜に出てきたコワイノ。出てきたときにきめる seaFoeInit・e.wz）。画面の能力は「20→24」（seaTxt）。 ---------- */
const SEAUP=1.2,SEAEL=[['wood'],['fire','water'],['earth'],['wind']],SEATIRED=1.2,SEACOLD=.8,SEAHUN=1.2,SEAFOE=.8,SEAWARMR=3;
const WARMOBJ=new Set(['campfire','oven','torch','onsen','hotstone','smelter','yogan']);
const SEAFXT=['木のせいれいの能力1.2倍','火・水のせいれいの能力1.2倍・つかれのへり1.2倍','土のせいれいの能力1.2倍','移動速度0.8倍・おなかのへり1.2倍・風のせいれいの能力1.2倍・「コワイノ」の能力0.8倍'];
const SEAWC=new WeakMap();
function seaWarm(r){/* 冬の寒さがとどかない子：火のせいれい・あたたかい料理を食べた子（r.warmT）・あたたかい物や火のせいれいのまわり3マス（マスがかわるか、時計の数分ごとに調べなおす） */if(!r||r.elem==='fire'||r.warmT>S.t)return true;const j=(r.y|0)*W+(r.x|0);let c=SEAWC.get(r);if(c&&c.j===j&&Math.abs(S.t-c.t)<5)return c.v;
  const x0=j%W,y0=(j/W)|0;let v=false;for(let y=y0-SEAWARMR;y<=y0+SEAWARMR&&!v;y++)for(let x=x0-SEAWARMR;x<=x0+SEAWARMR;x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x;if(WARMOBJ.has(typeAt(k))||WD===1&&S.ground[k]===1&&typeof hotW==='function'&&hotW(k)){v=true;break}}
  if(!v)v=S.res.some(q=>q!==r&&!q.hidden&&q.elem==='fire'&&Math.max(Math.abs(q.x-r.x),Math.abs(q.y-r.y))<=SEAWARMR);SEAWC.set(r,{j,t:S.t,v});return v}
function seaMul(r,k){/* 能力 k（work・move・sta）にかける季節の倍 */if(!S||!r)return 1;const s=seasonNow();let m=SEAEL[s].includes(r.elem)?SEAUP:1;if(s===3&&k==='move'&&!seaWarm(r))m*=SEACOLD;return m}
function seaFood(k){/* 冬はあたたかい料理・夏はつめたい料理を、箱から先にとる */const ef=S&&FOODS[k]&&FOODS[k].ef;if(!ef)return 0;const s=seasonNow();return s===3&&ef.warm||s===1&&ef.cool?1:0}
function seaTired(r){return S&&seasonNow()===1&&!(r&&r.coolT>S.t)?SEATIRED:1}/* 夏：つかれのへり（つめたい料理を食べた子 r.coolT はかわらない） */
function seaHun(r){return S&&seasonNow()===3&&!seaWarm(r)?SEAHUN:1}/* 冬：おなかのへり */
function seaFoeInit(e){/* 冬の夜に出てきたコワイノは、体力・攻撃・速さ0.8倍 */if(!e||e.wz!=null)return;e.wz=S&&seasonNow()===3?1:0;if(e.wz){e.hp=Math.max(1,Math.round(e.hp*SEAFOE));e.max=Math.max(1,Math.round((e.max||e.hp)*SEAFOE))}}
const seaFoeK=e=>e&&e.wz?SEAFOE:1;
function seaTxt(r,k,v){/* せいれいの画面：季節でかわった数は「20→24」 */const n=Math.floor(v),m=Math.max(1,Math.round(n*seaMul(r,k)));return m===n?String(n):n+'→'+m}
/* ---------- 雪だるま（冬だけ）：ひまなせいれいが、外の空いた所で作る（goSnowman・ACT.snowman）。見た目だけ（S.snowm：[{j,g}]、g はできぐあい 0〜3）。
   できたら、たのしさ+SNOWFUN。春になったらとける（seasonMorning）。絵は tools/art/snowman/snowman_art.py ---------- */
const SNOWSPR={src:"assets/g/1804161ad7.webp",w:48,h:64,n:4,ax:24,ay:58};
const SNOWP=.25,SNOWFUN=5,SNOWDUR=30,SNOWMAX=8,SNOWCD=720;
try{SNOWSPR.img=new Image();SNOWSPR.img.onload=()=>{SNOWSPR.ok=1;dirty=true};SNOWSPR.img.src=SNOWSPR.src}catch(e){}
const snowFree=j=>j>=0&&j<W*H&&walk(j)&&!S.obj[j]&&!S.floor[j]&&!S.ground[j]&&!roomOf(j)&&!(TAKEN&&TAKEN.has(j));
function goSnowman(r,G){if(!S||seasonNow()!==3||isNight()||r.snowT>S.t||Math.random()>=SNOWP)return false;const L=S.snowm||(S.snowm=[]);if(L.length>=SNOWMAX)return false;
  const near=j=>L.some(q=>Math.abs(q.j%W-j%W)<=2&&Math.abs(((q.j/W)|0)-((j/W)|0))<=2);
  const st=nearest(G,j=>snowFree(j)&&j%W<W-1&&snowFree(j+1)&&!near(j+1),14);if(st<0)return false;r.snowT=S.t+SNOWCD;startAct(r,G,'snowman',st,{tg:st+1,dur:SNOWDUR});return true}
ACT.snowman={start(r,a){if(seasonNow()!==3||S.obj[a.tg])return false;r.face=1;const L=S.snowm||(S.snowm=[]);if(!L.some(q=>q.j===a.tg))L.push({j:a.tg,g:0})},
  tick(r,a){const m=(S.snowm||[]).find(q=>q.j===a.tg);if(m)m.g=Math.max(m.g,Math.min(2,Math.floor(a.t/(a.dur/3))));r.bubble=a.t>=a.dur-6?'✨':''},
  done:(r,a)=>a.t>=a.dur,end(r,a){const m=(S.snowm||[]).find(q=>q.j===a.tg);if(m)m.g=3;if(typeof juiceSnowman==='function')juiceSnowman(a.tg,r);/* ぽんとはねる */funAdd(r,SNOWFUN,'solo');JUMP.set(r,performance.now());r.wanderRestUntil=S.t+45}};
ACT_LBL.snowman='雪だるまを作っている';IDLE_ACTS.push('snowman');
function snowDraw(add,vis,ctx){/* 奥行きの順に、ほかの物といっしょに描く */if(!S||!S.snowm||!S.snowm.length||seasonNow()!==3||!SNOWSPR.ok)return;const Z=SNOWSPR;
  for(const m of S.snowm){const j=m.j;if(S.obj[j]||S.floor[j])continue;const o={x:j%W+.5,y:((j/W)|0)+.8};if(!vis(o))continue;const px=o.x*TS,fy=o.y*TS-(S.hi?hiAt(j)*LIFT:0)-(typeof snowHop==='function'?snowHop(j):0),g=Math.max(0,Math.min(Z.n-1,m.g|0));
    add(o.y,2,[px-12,fy-30,px+12,fy+4],()=>{const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(Z.img,g*Z.w,0,Z.w,Z.h,px-Z.ax/2,fy-Z.ay/2,Z.w/2,Z.h/2);ctx.imageSmoothingEnabled=sm},j)}}
