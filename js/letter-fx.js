'use strict';
/* ---------- 手紙がとどく演出（見た目と音だけ。セーブしない） ----------
   朝に手紙がとどくと（letterMorning → letterPostArrive）、画面があいたときに、小鳥が手紙をくわえて飛んできて、
   おそなえ箱（なければ神殿）の前に落として帰る（LBIRD）。落ちたふうとうは、読んでいない手紙があるあいだ、光ってはねる。
   「しらべる」でふうとうをタップ・上の欄のふうとう（letag）・もちものの「手紙」で開く（letterOpen）。
   読むとき（letterRead）：はじめて読む手紙は、ふうとうがおりてきて封がひらき、便せんがのびて、文が1字ずつ出る（タップでさいごまで）。
   読んでいない手紙の数は、上の欄のふうとうと、下のバーの「もちもの」の札（dbadge）に出す（letterHud）。
   ふうとうの絵はコードのドット（ENVPX：18×12・ひらいた絵 18×17）。 */
const LBIRD_IN=1700,LBIRD_HOV=650,LBIRD_OUT=1500,LDROP=320;/* 小鳥：とんでくる・止まる・帰る・ふうとうが落ちる時間（ミリ秒） */
const LTYPE=38;/* 文が1字出る間（ミリ秒） */
let LPEND=null,LBIRD=null,LLAND=0;/* とどいて、まだ小鳥が来ていない手紙の送り主 ／ いまの小鳥 ／ ふうとうが着地した時刻 */
const ENVC={O:'#b8935e',P:'#f7ecd2',F:'#fbf3e0',L:'#d9bf8f',R:'#d9665a',D:'#b04b44',H:'#f6a496',I:'#d6bd8c',S:'#ead9b4'};
function envPix(open){/* ふうとうのドット [x,y,色] */const P=[],put=(x,y,c)=>P.push([x,y,ENVC[c]]);
  if(!open){for(let y=0;y<12;y++)for(let x=0;x<18;x++){if(x===0||x===17||y===0||y===11){put(x,y,'O');continue}
      const lx=1+Math.round((y-1)*7.5/5),rx=17-lx;if(y<=6&&(x===lx||x===rx)){put(x,y,'L');continue}if(y<6&&x>lx&&x<rx){put(x,y,'F');continue}put(x,y,y===10?'S':'P')}
    for(const[x,y]of[[8,5],[9,5],[7,6],[10,6],[7,7],[10,7],[8,8],[9,8]])put(x,y,'R');put(8,6,'H');put(9,6,'R');put(8,7,'R');put(9,7,'D');put(10,7,'D');put(9,8,'D');return P}
  for(let y=0;y<6;y++){const a=8-Math.round(y*1.6),b=9+Math.round(y*1.6);for(let x=Math.max(0,a);x<=Math.min(17,b);x++)put(x,y,x===a||x===b||y===0?'O':'F')}/* ひらいた封（上の三角） */
  for(let y=5;y<17;y++)for(let x=0;x<18;x++){if(x===0||x===17||y===16){put(x,y,'O');continue}if(y===5){put(x,y,'O');continue}
    const dx=Math.min(x-1,16-x),vy=6+Math.round(dx*5.5/7.5);if(y<vy)put(x,y,'I');else if(y===vy)put(x,y,'L');else put(x,y,y===15?'S':'P')}return P}
const ENVPX=[envPix(0),envPix(1)];
function envDraw(g,x,y,s,open){for(const[px,py,c]of ENVPX[open?1:0]){g.fillStyle=c;g.fillRect(x+px*s,y+py*s,s,s)}}
const ENVURL={};function envURL(open){/* 一覧・上の欄のアイコン（1ドット2px） */const k=open?1:0;if(ENVURL[k])return ENVURL[k];const c=document.createElement('canvas');c.width=36;c.height=34;const g=c.getContext('2d');envDraw(g,0,open?0:10,2,open);ENVURL[k]=c.toDataURL();c.width=c.height=0;return ENVURL[k]}
function letterSpot(){/* ふうとうを置く所（せかいの点）：おそなえ箱の前・なければ神殿（こわれた神殿）の前 */const j=OBOX>=0?OBOX:STATUE>=0?STATUE:RUINT;if(j<0)return null;const z=(typeof hiAt==='function'?hiAt(j):0)*LIFT;return{x:(j%W+.5)*TS,y:((j/W)|0)*TS+TS+6-z,j}}
function letterPostArrive(who){/* 朝に手紙がとどいた：小鳥がとどけにくる */LPEND=who}
function letterCanFly(){return started&&S&&!S.free&&sheet==null&&$('#dialog').hidden&&NEWRES==null&&!GIFT_ACTIVE&&!(camAnim&&camAnim.done)}
function letterBirdStart(now){const T=letterSpot();if(!T){LPEND=null;return}const vw=VW/cam.z,vh=VH/cam.z;
  LBIRD={t0:now,T,who:LPEND,fx:T.x-vw*.55,fz:vh*.5,ox:T.x+vw*.55,oz:vh*.55,drop:0};LPEND=null;
  const sx=(T.x-cam.x)*cam.z,sy=(T.y-cam.y)*cam.z;if(sx<VW*.15||sx>VW*.85||sy<VH*.2||sy>VH*.8)panTo(T.x,T.y);/* 見えないときは、おそなえ箱へカメラをよせる */
  sfxAt('cv_bird',T.x/TS,T.y/TS)}
function letterBirdDraw(g,now){const B=LBIRD,t=now-B.t0,T=B.T,C=window.CHIPS;let x,z,fl=1;
  if(t<LBIRD_IN){const k=t/LBIRD_IN,e=1-Math.pow(1-k,3);x=B.fx+(T.x-B.fx)*e;z=B.fz+(30-B.fz)*e+Math.sin(k*Math.PI*3)*6*(1-k)}
  else if(t<LBIRD_IN+LBIRD_HOV){x=T.x;z=30+Math.sin((t-LBIRD_IN)/90)*2;if(!B.drop&&t>=LBIRD_IN+160){B.drop=now;sfx('tap')}}
  else if(t<LBIRD_IN+LBIRD_HOV+LBIRD_OUT){const k=(t-LBIRD_IN-LBIRD_HOV)/LBIRD_OUT,e=k*k;x=T.x+(B.ox-T.x)*e;z=30+(B.oz-30)*e}
  else{LBIRD=null;return}
  x=Math.round(x);z=Math.round(z);const y=Math.round(T.y);dotShadow(g,x,y,Math.max(2,6-z/20),1.5,Math.max(.15,.5-z/300),1);
  if(!B.drop)envDraw(g,x-4,y-z+3,.5,0);/* くわえている手紙（1ドットはゲームの1点） */
  const ch=C&&C['critbird#f'+(Math.floor(now/(fl?80:200))%2)];if(ch){const im=chipImgs(ch,'critbird')[0];if(im&&im.ok){const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=false;g.drawImage(im,x+ch.ax/2,y-z+ch.ay/2,ch.w/2,ch.h/2);g.imageSmoothingEnabled=sm}}}
const LSPK=[[-13,-15,0],[12,-19,.33],[15,-6,.66],[-15,-4,.5]];/* ふうとうのまわりのきらきら（ずれ・時刻のずれ） */
function letterGroundDraw(g,now){const T=letterSpot();if(!T)return;let dy=0;const red=typeof uiReduced==='function'&&uiReduced();
  if(LBIRD&&LBIRD.drop){const k=(now-LBIRD.drop)/LDROP;if(k<1)dy=-Math.round(22*(1-k*k));else if(!LLAND){LLAND=now;letterLanded(T)}}
  if(LLAND&&now-LLAND<700){const k=(now-LLAND)/700;dy=-Math.round(Math.abs(Math.sin(k*Math.PI*2))*7*(1-k))}/* 着地して、ぽんぽんとはねる */
  else if(!red){const p=(now%2200)/300;if(p<1)dy=-Math.round(Math.sin(p*Math.PI)*4)}/* 読むまで、ときどきはねる */
  const x=Math.round(T.x-9),y=Math.round(T.y-12)+dy;dotShadow(g,Math.round(T.x),Math.round(T.y),Math.max(4,9+dy/3),2,.45,1);
  const gl=.25+.2*Math.sin(now/260);g.fillStyle='rgba(255,246,200,'+gl+')';g.fillRect(x-2,y-2,22,16);/* ほんのり光る */envDraw(g,x,y,1,0);
  for(const[ox,oy,ph]of LSPK){const a=Math.sin(((now/900+ph)%1)*Math.PI);if(a<.15)continue;const sx=Math.round(T.x+ox),sy=Math.round(T.y-6+oy+dy*.5);g.globalAlpha=a;g.fillStyle='#fff6c8';g.fillRect(sx-1,sy-3,2,6);g.fillRect(sx-3,sy-1,6,2);g.fillStyle='#ffffff';g.fillRect(sx-1,sy-1,2,2);g.globalAlpha=1}}
function letterLanded(T){/* ふうとうが着地した：きらきら・音・知らせ */const L=(S.letters||[]).filter(l=>!l.read),n=L.length;if(!n)return;playU('tink',.3);playU('tink',.22,1.5,.12);sfx('page');
  if(typeof juiceGlowAt==='function')juiceGlowAt(T.x/TS,T.y/TS-.3);const w=LBIRD&&LBIRD.who;toast((w&&w.length>1?w.length+'通の':(w&&w[0]||L[n-1].who)+'から')+'手紙がとどいた！','good')}
function letterFxDraw(now){/* せかいの上の層で毎コマ（draw-world.js）。夜の暗さより上 */if(!S||S.free)return;if(LPEND&&!LBIRD&&letterCanFly())letterBirdStart(now);
  const un=letterUnread();if(LBIRD){letterBirdDraw(ctx,now);if(!LBIRD||LBIRD.drop)un&&letterGroundDraw(ctx,now)}else if(un&&!LPEND)letterGroundDraw(ctx,now);if(!LBIRD&&LLAND&&now-LLAND>700)LLAND=0;letterHud(now,un)}
function letterTap(sx,sy){/* 「しらべる」でふうとうをタップ */if(mode!=='look'||!S||!letterUnread()||LPEND||LBIRD&&!LBIRD.drop)return false;const T=letterSpot();if(!T)return false;const w=toWorld(sx,sy);if(Math.abs(w.x-T.x)>16||w.y<T.y-28||w.y>T.y+8)return false;sfx('tap');letterOpen();return true}
function letterOpen(){const U=(S.letters||[]).filter(l=>!l.read);if(U.length===1)return letterRead(U[0]);letterList()}
let LHUD=null,LHN=-1;function letterHud(now,n){/* 上の欄のふうとう・下のバーの数 */if(!LHUD){const row=document.querySelector('.hrow');if(!row)return;LHUD=el('<button class="htag letag" hidden aria-label="手紙"><img alt=""><span class="n"></span></button>');LHUD.querySelector('img').src=envURL(0);LHUD.onclick=e=>{e.stopPropagation();sfx('tap');letterOpen()};row.appendChild(LHUD);const di=$('#dockInv');if(di){di.style.position='relative';di.appendChild(el('<span class="dbadge" hidden></span>'))}}
  const on=n>0&&!LPEND&&!(LBIRD&&!LLAND&&!(LBIRD.drop&&now-LBIRD.drop>LDROP));if(n!==LHN||LHUD.hidden===on){LHN=n;LHUD.hidden=!on;LHUD.querySelector('.n').textContent=n>1?n:'';const b=document.querySelector('#dockInv .dbadge');if(b){b.hidden=!n;b.textContent=n}}
  if(on){const red=typeof uiReduced==='function'&&uiReduced(),p=(now%1800)/360;LHUD.querySelector('img').style.transform=!red&&p<1?'translateY('+(-Math.round(Math.sin(p*Math.PI)*3)*1.5)+'px)':''}}
function letterReset(){LPEND=null;LBIRD=null;LLAND=0}/* 村を切りかえたら、とんでいる小鳥はけす（とどいた手紙はそのまま） */
function lStep(ms,f,done){/* 実時間で k=0→1（1コマごと） */const t0=performance.now(),go=()=>{const k=Math.min(1,(performance.now()-t0)/ms);f(k);if(k<1)requestAnimationFrame(go);else if(done)done()};requestAnimationFrame(go)}
const px15=v=>Math.round(v/1.5)*1.5;/* 1.5px（1ドット）のます目 */
function letterSecret(l,fresh){/* ひみつの好み：読んだら、わかったことにする */const q=l.sec;if(!q||!fresh||l.secD)return;l.secD=1;const r=S.res.find(x=>x.id===q.id);if(r&&typeof prefKnow==='function')prefKnow(r,q.k)}
function letterPack(l){/* お礼の品のつつみ：タップでふくらんで、ゆれて、ひらくと光の柱・紙ふぶき・「うけとった」のハンコ。品は先にうけとってある */const fu=l.g.k.indexOf('furn:')===0;
  if(typeof treasureReveal!=='function'){toast(giftName(l.g)+'をうけとった','good');return}
  treasureReveal({ico:wrapIco(l.el),taps:fu?4:2,tier:fu?2:1,name:l.who+'からのつつみ',done:fu?l.who+'が作ってくれた！':'つつみの中には…',items:[{img:giftIcoOf(l.g),nm:giftName(l.g)}],beam:1,confetti:fu?1:0,stamp:'うけとった'})}
function letterRead(l){/* 手紙を読む（便せんの紙）。はじめて読む手紙は、ふうとうがひらいてから */const fresh=!l.read,red=typeof uiReduced==='function'&&uiReduced(),anim=fresh&&!red;
  const o=el('<div class="letov"><div class="letcol"><div class="letpaper"><span class="lband"></span><p class="lh"></p><div class="lb"></div><p class="lw"></p><p class="lg"></p><button class="btn pri x">とじる</button></div><canvas class="letenv" width="18" height="17"></canvas></div></div>');
  const pa=o.querySelector('.letpaper'),cv=o.querySelector('.letenv'),g=cv.getContext('2d'),b=o.querySelector('.lb'),gp=o.querySelector('.lg');
  pa.style.setProperty('--lc',ELEM[l.el]?ELEM[l.el].col:'#d9a66b');o.querySelector('.lh').textContent='守り神さまへ';o.querySelector('.lw').textContent=l.who+'より';gp.hidden=true;
  const P=l.tx.map(s=>{const p=el('<p></p>');p.dataset.t=s;b.appendChild(p);return p});
  const env=op=>{g.clearRect(0,0,18,17);envDraw(g,0,op?0:5,1,op)};env(0);
  let typing=null,shown=false,gave=!!l.got;
  const giftNow=()=>{if(shown)return;shown=true;letterSecret(l,fresh);if(!l.g)return;gp.hidden=false;gp.textContent=(gave&&!fresh?'入っていた：':'いっしょに入っていた：')+giftName(l.g);if(fresh)setTimeout(()=>letterPack(l),420)};/* はじめて読んだ手紙のお礼の品は、つつみをあける（letterPack） */
  const allText=()=>{for(const p of P)p.textContent=p.dataset.t;typing=null;giftNow()};
  const type=()=>{let i=0,c=0;const N=P.map(p=>p.dataset.t.length),sum=N.reduce((a,v)=>a+v,0),t0=performance.now();typing=1;const go=()=>{if(!typing)return;const n=Math.min(sum,Math.floor((performance.now()-t0)/LTYPE));let r=n;for(let k=0;k<P.length;k++){P[k].textContent=P[k].dataset.t.slice(0,Math.max(0,Math.min(N[k],r)));r-=N[k]}if(n>=sum)return allText();requestAnimationFrame(go)};go()};
  if(fresh&&l.g&&!l.got){l.got=1;giftGive(l.g)}/* お礼の品は、ひらいたときにうけとる（とちゅうでとじても、なくならない） */
  const close=()=>{if(typing)allText();letterSecret(l,fresh);l.read=1;o.remove();if(sheet==='inv'||sheet==='menu')renderSheet()};
  o.querySelector('.x').onclick=e=>{e.stopPropagation();sfx('tap');close()};o.onclick=e=>{if(typing){allText();return}if(e.target===o&&!anim)close()};
  document.body.appendChild(o);
  if(!anim){cv.remove();for(const p of P)p.textContent=p.dataset.t;gave=!!l.g;shown=false;giftNow();sfx('open');return}
  /* ふうとうがおりてくる → 封がひらく → 便せんがのびる → ふうとうが下へきえる → 文 */
  const H=pa.offsetHeight;pa.style.height='0px';pa.style.visibility='hidden';cv.style.transform='translateY(-120px)';o.style.background='rgba(40,30,15,0)';playU('pslide',.4);
  lStep(420,k=>{const e=1-Math.pow(1-k,3),bk=k<.8?0:Math.sin((k-.8)/.2*Math.PI)*6;cv.style.transform='translateY('+px15(-120*(1-e)-bk)+'px)';o.style.background='rgba(40,30,15,'+(.35*k).toFixed(2)+')'},()=>{
    setTimeout(()=>{env(1);sfx('page');playU('tink',.22,1.3);
      setTimeout(()=>{pa.style.visibility='';lStep(520,k=>{const e=1-Math.pow(1-k,2);pa.style.height=px15(H*e)+'px'},()=>{pa.style.height='';playU('mpage',.3);
        lStep(300,k=>{cv.style.transform='translateY('+px15(40*k)+'px)';cv.style.opacity=k<.66?1:k<.9?.5:0},()=>{cv.remove();type()})})},260)},280)})}
