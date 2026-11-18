/* 季節と記念日（season.js）
   季節：SEASONDAYS 日ごとに、春・夏・秋・冬（1日めから春。ひとめぐり20日）。見た目とセリフだけで、数字はかえない。
     朝にかわったら知らせて、思い出帳にのこす（seasonMorning）。日の欄のはじめに季節の名前。
     画面：春は花びら・秋は落ち葉・冬は雪（雨の日は雪がたくさんで、日の欄は「雪」）。夏は、ふだんのホタル。
     色：秋はあたたかく、冬はつめたく、ほんのり（SEATINT）。粒はドットの四角（seasonDraw）。
   記念日：村に来てから ANNIV 日めの朝、その子と、なかよしがよろこぶ。その日のお話は、記念日の話（annivTopic）。 */
const SEASONDAYS=5,SEASONS=['春','夏','秋','冬'],SEATINT=['rgba(255,214,232,.05)','','rgba(255,168,92,.07)','rgba(222,238,255,.11)'];
const ANNIV=[10,30,50,100,200,365];
function seasonOf(d){return Math.floor(Math.max(0,d-1)/SEASONDAYS)%4}
function seasonNow(){return S?seasonOf(dayNo()):0}
const snowNow=()=>seasonNow()===3&&!!S.rain;
function seasonMorning(){const d=dayNo();if(d<=1||seasonOf(d)===seasonOf(d-1))return;const n=SEASONS[seasonOf(d)];memo('',n+'になった');{const L=S.res.filter(r=>!r.hidden);if(L.length&&typeof letterQ==='function')letterQ(pick(L),'season',{s:n},LETTERSEA[seasonOf(d)])}setTimeout(()=>toast(n+'になった','good'),900)}
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
