/* ---------- せいれいの手紙 ----------
   なかよしになったとき（mate）・村に来た記念日（anniv）・こまりごとがなおったとき（thx）に、せいれいが手紙を書く（letterQ → S.letterQ）。
   つぎの朝6時に、おそなえ箱に手紙がとどく（letterMorning → S.letters）。もちものの「手紙」で読む。読んだ手紙は、思い出帳の「手紙」で何度でも読める。
   文はその子の言いかた（chatTone）。同じ子が同じ文をくりかえさない（pickFresh）。 */
const LETTERT={
 mate:[['きょう、{m}と、なかよしになったよ。','いっしょにいると、なんだか、ほっとするんだ。','これからも、ふたりで村をにぎやかにするね。'],
  ['{m}って、すごくやさしいんだ。','ぼくがこまっていると、すぐに気づいてくれる。','守り神さまにも、知ってほしくて書いたよ。'],
  ['{m}と、たくさん話したよ。','わらうところが、ぼくとそっくりなんだ。','あしたも、いっしょに遊べるといいな。']],
 anniv:[['この村に来て、{n}日になったよ。','はじめは、なにもかもが、ふしぎだった。','いまは、ここがぼくの家だよ。ありがとう。'],
  ['{n}日、あっというまだったなあ。','守り神さまが見ていてくれるから、がんばれたよ。','これからも、よろしくね。'],
  ['村に来て{n}日の、記念の手紙だよ。','すきな場所も、すきななかまも、ふえたんだ。','ずっと、ここでくらしたいな。']],
 thx:[['こまっていたこと、なおしてくれて、ありがとう。','守り神さまは、ちゃんと見ていてくれるんだね。','ぼくも、もっとがんばるよ。'],
  ['ねえ、気づいてくれたんだね。','すごく、うれしかったよ。','おかえしに、きょうも、いっぱいはたらくね。'],
  ['あのね、ずっと言えなかったことがあったんだ。','でも、もう、だいじょうぶ。ありがとう。','守り神さまのおかげだよ。']]};
const LETTERK={mate:'なかよしのこと',anniv:'記念日',thx:'ありがとう'};
function letterQ(r,k,v){/* 手紙を書く（つぎの朝にとどく） */if(!r||!S||S.free||IS_STORY_REPLAY||(typeof MEMRUN!=='undefined'&&MEMRUN)||(typeof NOSAVE!=='undefined'&&NOSAVE)||!LETTERT[k])return;const Q=S.letterQ||(S.letterQ=[]);if(Q.some(q=>q.id===r.id&&q.k===k))return;
  const L=LETTERT[k],i=L.indexOf(pickFresh('lt:'+r.id+':'+k,L)),tx=L[i<0?0:i].map(s=>chatTone(s.replace('{m}',k==='mate'?v:'').replace('{n}',k==='anniv'?v:''),r));Q.push({id:r.id,who:r.name,el:r.elem,k,d:dayNo(),tx})}
function letterMorning(){/* 朝6時：きのう書いた手紙がとどく */const Q=S.letterQ;if(!Q||!Q.length)return;const L=S.letters||(S.letters=[]),got=[];for(const q of Q){if(q.d>=dayNo())continue;L.push({who:q.who,el:q.el,k:q.k,d:dayNo(),tx:q.tx,read:0});got.push(q.who)}S.letterQ=Q.filter(q=>q.d>=dayNo());
  if(L.length>60)L.splice(0,L.length-60);if(got.length){toast((got.length>1?got.length+'通の':got[0]+'から')+'手紙がとどいた','good');sfx('offer');if(sheet==='inv')renderSheet()}}
const letterUnread=()=>(S.letters||[]).filter(l=>!l.read).length;
const LETTERPX=['................','................','................','.oooooooooooooo.','.ohhhhhhhhhhhhd.','.odhhhhhhhhhhdd.','.omdhhhhhhhhdmd.','.ommdhhhhhhdmmd.','.ommmddhhddmmmd.','.ommmmmddmmmmmd.','.ommmmmmmmmmmmd.','.ommmmmmmmmmmmd.','.oddddddddddddo.','.oooooooooooooo.','................','................'];
function letterIco(){return pixURL('letter',LETTERPX,'#f0e2c4')}/* 手紙（ふうとう）のドット絵 */
function letterRead(l){/* 手紙を読む（紙の画面） */const o=el('<div style="position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:#fbf5e6;padding:18px 20px;max-width:320px;width:100%;color:var(--ink)"><p class="note h" style="margin:0 0 10px"></p><div class="b" style="line-height:1.9"></div><p class="w" style="text-align:right;margin:12px 0 14px"></p><button class="btn pri x" style="width:100%">とじる</button></div></div>');
  o.querySelector('.h').textContent='守り神さまへ';const b=o.querySelector('.b');for(const s of l.tx){const p=el('<p style="margin:0"></p>');p.textContent=s;b.appendChild(p)}o.querySelector('.w').textContent=l.who+'より';
  const close=()=>{l.read=1;o.remove();if(sheet==='inv'||sheet==='menu')renderSheet()};o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};document.body.appendChild(o);sfx('open')}
function letterList(){/* もちものの手紙：読んでいない手紙を先に */const L=(S.letters||[]).slice().reverse().sort((a,b)=>a.read-b.read);if(L.length===1)return letterRead(L[0]);
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink);max-height:80vh;overflow:auto"><b style="display:block;font-size:16px;margin-bottom:8px">手紙</b><div class="rows"></div><button class="btn x" style="width:100%;margin-top:10px">とじる</button></div></div>'),rw=o.querySelector('.rows');
  for(const l of L){const r=rowEl(l.who+'から'+(l.read?'':'（あたらしい）'),l.d+'日め・'+LETTERK[l.k],letterIco());r.style.cursor='pointer';r.onclick=()=>{sfx('tap');o.remove();letterRead(l)};rw.appendChild(r)}
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
function letterSec(body){/* 思い出帳：読んだ手紙 */const L=(S.letters||[]).filter(l=>l.read);if(!L.length)return;const sec=el('<div class="sec"><h3>手紙</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
  for(const l of L.slice().reverse()){const r=rowEl(l.who+'から',l.d+'日め・'+LETTERK[l.k],letterIco());r.style.cursor='pointer';r.onclick=()=>{sfx('tap');letterRead(l)};rw.appendChild(r)}body.appendChild(sec)}
