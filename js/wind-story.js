'use strict';
/* ---------- 風の章のお話の後半（観覧車のてっぺん → 雲の切れ目 → さいごの夜 → ヌシ様のつばさ）----------
   観覧車（windWheel）：直した観覧車に、はじめてだれかがのったら、場面「てっぺん」：カメラが観覧車のてっぺんへのぼり、雲の切れ目ごしに、島をささえる白いつばさ（風のヌシ様）と、つばさのかげにねむる影が見える（S.flags.windTop）。
   雲の切れ目（windCall）：観覧車の島のはしの雲の切れ目（S.wind.gap）まで風の道をとどけると、ヌシ様の声がとどく（S.flags.windCall）。
   さいごの夜（windNight）：遊具が4つとも動くようになったら、その夜（S.wind.fnD）、つばさのかげの影が目をさまして、遊具をねらってくる（おびきよせの石像と同じく、遊具を先にこわしにくる）。
     こわされた遊具は、こわれた遊具にもどる（直せる）。朝に遊具が WINDWIN こいじょうのこっていれば勝ち（S.flags.windWon）。負けたら、WINDRETRY 日あとの夜にまた。
   ヌシ様をむかえる（windEnd）：勝った朝、ヌシ様が雲の上へのぼり、遊具から風がとんで、つばさになる（S.flags.windEnd）。クリアのあとは、雲の切れ目のあたりの空をまわる。目標がぜんぶおわったらクリア。
   場面のあいだは、村の時間を止める（GIFT_ACTIVE）。カメラ・つばさ・鳥の動きは実時間。村を切りかえたら windStoryReset。
   絵（つばさ・影・雲の切れ目・ヌシ様の鳥）は、コードのドット絵（仮の絵）。 */
const NUSHI5='風のヌシ',WINDWIN=2,WINDRETRY=3,WRIDEHP=40,WFINALH=21;/* 勝ち：朝にのこった遊具の数。こわれるまでのじょうぶさ。影が来はじめる時刻 */
const WFINALWAVE=['basic','basic','basic','basic','fast','fast','basic','brute','fast','basic','brute','basic'];
const WTOP_LINES=[
  [HAYATE,'#surprise big|……カザネ、見て！ 雲の切れ目の下！'],
  [KAZANE,'#surprise|白い……つばさ？'],
  [GOD,'#worry|ヌシ様じゃ。島を、下からささえておる。'],
  [KAZANE,'#think|……そうか。風がやんだんじゃない。あの方が、風をぜんぶ使って、島を持ち上げているんだ。'],
  [HAYATE,'#scared|つばさのかげに、なにかいる……。黒い影が、ねむってる。'],
  [GOD,'#worry|あの影のそばで、ヌシ様は、うごけんのじゃろう。ひとりで、ずっと……。'],
];
const WCALL_LINES=[
  [NUSHI5,'……この風は。……カザネ、ハヤテか。'],
  [KAZANE,'#surprise|ヌシ様……！ どうして、ひとりで。'],
  [NUSHI5,'島が雲にしずみかけたとき、わたしは、風をぜんぶ、つばさにあつめた。'],
  [NUSHI5,'#worry|だが、つばさのかげで、影がねむりはじめた。わたしが動けば、影は目をさます。'],
  [NUSHI5,'だから、風を止めた。遊び場も、おまえたちの笑い声も。……すまなかった。'],
  [HAYATE,'#think|……じゃあ、ぼくたちの風で、ヌシ様を持ち上げればいいんだ。'],
  [NUSHI5,'#surprise|……おまえたちの風で？'],
  [GOD,'#joy|遊具がまわって、せいれいが笑えば、風がうまれる。ひと晩、遊び場を守りぬけば、きっととどくぞ。'],
];
const WNIGHT_LINES=[[KAZANE,'#alarm big|来た……！ 雲の下から、影がのぼってくる！'],[HAYATE,'#scared|遊具をねらってる……！ 守り神、たのむよ！']];
const WEND_LINES=[
  [NUSHI5,'#joy|……あたたかい風だ。こんなに、かるい。'],
  [HAYATE,'#joy big|ヌシ様が、雲の上に！'],
  [NUSHI5,'おまえたちの笑い声が、わたしのつばさになった。もう、ひとりでささえなくていい。'],
  [KAZANE,'#shy|……フッ。遊んでいただけ、ですけどね。'],
  [NUSHI5,'#joy|それでいい。風は、遊ぶためにふくものだ。'],
  [GOD,'#joy|空の遊び場に、風がもどったのう。'],
];
const windLines=L=>L.filter(x=>x[0]===GOD||x[0]===NUSHI5||S.res.some(r=>r.name===x[0]&&!r.hidden));/* いないせいれいの行は、はぶく */
const windRidesN=()=>{let n=0;for(const id of RIDES)n+=cnt(id);return n};
const windQ=id=>!!S&&!S.cleared&&QUESTS[S.quest]&&QUESTS[S.quest].id===id;
/* 雲の切れ目：観覧車の島の、いちばん外がわの岸から、4マス先の雲の海。そこまで、ずっと雲の海 */
function windWheelIsle(){const I=windIsles(S);for(const id of['wheel','wheelb']){const j=S.obj.indexOf(id);if(j>=0)return I.id[j]}let k=0;for(let q=1;q<=I.n;q++)if(q!==I.mid&&(!k||I.size[q]>I.size[k]))k=q;return k}
function windGap(){if(!windOn())return null;const g=S.wind.gap;if(g&&g.j>=0)return g;const I=windIsles(S),M=skyM(),k=windWheelIsle(),mx=I.cx[I.mid],my=I.cy[I.mid];let best=null,bs=-1;
  for(let j=0;j<W*H;j++){if(I.id[j]!==k||S.ground[j]!==0)continue;const x=j%W,y=(j/W)|0;for(let d=0;d<4;d++){let ok=true;for(let s=1;s<=5&&ok;s++){const nx=x+WDIR[d][0]*s,ny=y+WDIR[d][1]*s;if(nx<3||ny<3||nx>=W-3||ny>=H-3||!M[ny*W+nx])ok=false}if(!ok)continue;const sc=Math.hypot(x-mx,y-my);if(sc>bs){bs=sc;best={j:(y+WDIR[d][1]*4)*W+x+WDIR[d][0]*4,d,c:j}}}}
  S.wind.gap=best||{j:-1,d:0,c:-1};return S.wind.gap.j>=0?S.wind.gap:null}
const windGapOK=()=>{const g=windGap();return !!g&&windDirAt(g.j)>=0};
/* さいごの夜：影は遊具をねらう（village.js の LURES・night.js の lj） */
const windLureOn=o=>windOn()&&!!S.wind.fnOn&&RIDES.has(o);
function windLureOK(q,e){if(!windLureOn(S.obj[q]))return false;if(!EREACH.has(e))EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const R=EREACH.get(e),z=BL[S.obj[q]].sz||[1,1],x0=q%W,y0=(q/W)|0;
  for(let y=y0-1;y<=y0+z[1];y++)for(let x=x0-1;x<=x0+z[0];x++){if(x<0||y<0||x>=W||y>=H)continue;const k=y*W+x;if(R&&R[k]>=0)return true}return false}
function windRideBreak(j){/* 影にこわされた遊具は、こわれた遊具にもどる（もう一度直せる） */const o=S.obj[j];if(!windOn()||!RIDES.has(o))return false;const b=Object.keys(RIDEB).find(k=>RIDEB[k]===o);S.obj[j]=b;delete S.hp[j];
  for(const r of S.res)if(r.act&&r.act.obj===j)endAct(r);sfxAt('wbreak',j%W+1,(j/W)|0);if(S.ns)S.ns.broke++;toast(BL[o].name+'がこわされた！','warn');recount();dirty=true;return true}
function windSpot(){/* さいごの夜の影：雲の海のふちの、歩いて遊具まで行ける陸から（観覧車の島を先に） */const M=skyM(),I=windIsles(S),R=spawnReach(),k=windWheelIsle(),L0=[],L1=[];
  for(let j=W;j<W*H-W;j++){if(M[j]||S.ground[j]!==0||R[j]<0||solidOf(j)||windSunk(j))continue;if(![j-1,j+1,j-W,j+W].some(q=>M[q]))continue;(I.id[j]===k?L0:L1).push(j)}
  const L=L0.length?L0:L1;if(!L.length)return spawnSpot();const j=L[(Math.random()*L.length)|0];return [j%W+.5,((j/W)|0)+.5]}
function windNightTick(){const t=S.wind,h=hour(),d=dayNo();
  if(t.fnOn){if(h>=6&&h<20&&d>t.fnD){t.fnOn=0;const n=windRidesN(),won=n>=WINDWIN;recount();
      if(won){S.flags.windWon=1;memo('leaf','ひと晩、遊び場を守りぬいた');toast('遊び場を守りぬいた！','good');if(typeof juiceCheer==='function')juiceCheer('quest')}
      else{t.fnD=d+WINDRETRY-1;memo('moonn','遊び場を守りきれなかった');toast('遊具を守りきれなかった……。影は、また来る','warn')}checkQuest();renderQuest()}return}
  if(!qAt('windNight')||S.flags.windWon)return;if(t.fnD!=null&&d>t.fnD)t.fnD=d;/* 来るはずの夜を、すぎてしまったら、今夜 */
  if(t.fnD==null){if(windRidesN()>=4&&h<20){t.fnD=d;toast('今夜、つばさのかげの影が目をさます','warn');renderQuest()}return}
  if(d===t.fnD&&h>=WFINALH){if(windRidesN()<4){t.fnD=d+1;return}/* 遊具がそろうまで、まつ */t.fnOn=1;recount();spawnWave(WFINALWAVE.slice());const L=windLines(WNIGHT_LINES);if(L.length&&$('#dialog').hidden)dialog(L);renderQuest()}}
function windNightProg(){if(S.flags.windWon)return '';const t=S.wind,n=windRidesN();if(t.fnOn)return '遊具 '+n+'/4';if(n<4)return '直した遊具 '+n+'/4';if(t.fnD!=null&&t.fnD>dayNo())return '影が来るまで：あと'+(t.fnD-dayNo())+'日';return '今夜、影がやってくる'}
/* ---------- 場面（村の時間を止め、カメラを動かし、会話をはさむ） ---------- */
let WSRUN=null;const WV={wing:0,wingT:0,bird:null};/* 見せている物（つばさのこさ・鳥の動き。保存しない） */
function wsScene(steps,fin){const owner=S,session=VILLAGE_SESSION,run={};WSRUN=run;GIFT_ACTIVE=true;const back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2};let i=0;
  const alive=()=>S===owner&&session===VILLAGE_SESSION,ok=()=>alive()&&WSRUN===run,end=()=>{if(WSRUN===run){WSRUN=null;GIFT_ACTIVE=false}};
  const next=()=>{if(!ok())return end();if(i>=steps.length){camAnim={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1.2,done:()=>{const a=ok();end();if(a&&fin)fin()}};return}
    const s=steps[i++];if(s.fn)s.fn();
    if(s.to){camAnim={fz:cam.z,tz:s.to[2],fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:s.to[0]*TS,ty:s.to[1]*TS,t:0,dur:s.to[3]||1.4,done:()=>setTimeout(next,s.ms||0)};return}
    if(s.dlg){const L=windLines(s.dlg);if(L.length){dialog(L,()=>setTimeout(next,300));return}}
    setTimeout(next,s.ms||0)};
  musicDuck(4000);next()}
function windStoryReset(){if(WSRUN){WSRUN=null;GIFT_ACTIVE=false}WV.wing=0;WV.bird=null}/* 村を切りかえたとき */
function windTopScene(){const j=S.obj.indexOf('wheel'),g=windGap();if(j<0||!g)return;const wx=j%W+1.5,wy=(j/W|0)-1.5,gx=g.j%W+.5+WDIR[g.d][0]*3,gy=((g.j/W)|0)+.5+WDIR[g.d][1]*3;
  wsScene([{to:[wx,wy+2,Math.max(cam.z,1.6),1.4],ms:400},{to:[wx,wy-1,Math.max(cam.z,2),1.2],ms:500,fn:()=>sfx('leaf')},
    {fn:()=>{WV.wingT=performance.now();sfx('level');if(typeof hdBig==='function')hdBig(5000)},to:[gx,gy,1,2.2],ms:1600},{dlg:WTOP_LINES}],
    ()=>{S.flags.windTop=1;memo('leaf','観覧車のてっぺんから、雲の下のつばさが見えた');checkQuest();renderQuest();save()})}
function windCallScene(){const g=windGap();if(!g)return;const gx=g.j%W+.5+WDIR[g.d][0]*2,gy=((g.j/W)|0)+.5+WDIR[g.d][1]*2;
  wsScene([{to:[gx,gy,1.2,1.6],ms:300},{fn:()=>{WV.wingT=performance.now()-1500;WV.glowT=performance.now();sfx('level');scnAdd('ring',1400,{x:(g.j%W+.5)*TS,y:((g.j/W|0)+.5)*TS,r0:10,r1:90,col:'#e8f6ff'});if(typeof hdBig==='function')hdBig(4000)},ms:1800},{dlg:WCALL_LINES}],
    ()=>{S.flags.windCall=1;memo('leaf','雲の切れ目から、ヌシ様の声がとどいた');checkQuest();renderQuest();save()})}
function windEndScene(){const g=windGap(),I=windIsles(S),hx=I.cx[I.mid]+.5,hy=I.cy[I.mid]-6;if(!g)return;const gx=g.j%W+.5,gy=((g.j/W)|0)+.5;
  wsScene([{to:[gx,gy,1,1.4],ms:200},{fn:()=>{WV.bird={t0:performance.now(),sx:gx,sy:gy,hx,hy};sfx('level');if(typeof hdBig==='function')hdBig(9000)},ms:3200},
    {to:[hx,hy+2,.9,2.2],ms:200,fn:()=>{const t0=performance.now();for(const id of RIDES){const k=S.obj.indexOf(id);if(k<0)continue;for(let q=0;q<5;q++)scnAdd('orb',1300,{x0:(k%W+1)*TS,y0:((k/W|0)+.5)*TS,x1:hx*TS,y1:hy*TS,arc:q%2?40:-40,col:q%2?'#e8f6ff':'#fff6c8',n:1},2400+q*160)}
      setTimeout(()=>{sfx('good');for(const r of S.res)if(!r.hidden){JUMP.set(r,performance.now());if(typeof JOYU!=='undefined')JOYU.set(r,performance.now()+1800)}},4200)}},{ms:4400},{dlg:WEND_LINES}],
    ()=>{S.flags.windEnd=1;memo('leaf','風が、ヌシ様のつばさになった');checkQuest();renderQuest();save()})}
function windStoryTick(){if(!windOn()||S.free||IS_STORY_REPLAY||WSRUN)return;if(typeof MEMRUN!=='undefined'&&MEMRUN)return;windNightTick();
  if(S.flags.windEnd&&!S.cleared&&S.quest>=QUESTS.length&&S.qStory==null){S.cleared=true;S.clearDay=dayNo();toast('空の遊び場に、風がもどった','good');renderQuest();save();return}
  const h=hour();if(isNight()||h<7||h>=18||camAnim||!stageReady()||!$('#dialog').hidden||sheet!=null||S.enemies.some(e=>!e.dead))return;
  if(qNow('windWheel')&&!S.flags.windTop&&cnt('wheel')&&S.flags.rideRun&&S.flags.rideRun.wheel>=1)return windTopScene();
  if(qNow('windCall')&&!S.flags.windCall&&windGapOK())return windCallScene();
  if(windQ('windEnd')&&S.flags.windWon&&!S.flags.windEnd)return windEndScene()}
/* ---------- 絵（コードの仮のドット絵。2ドットずつ） ---------- */
function wOval(c,cx,cy,rx,ry,col){c.fillStyle=col;for(let q=-ry;q<=ry;q+=2){const w=Math.round(rx*Math.sqrt(Math.max(0,1-q*q/(ry*ry+.01)))/2)*2;if(w>0)c.fillRect(Math.round(cx/2)*2-w,Math.round((cy+q)/2)*2,w*2,2)}}
function wWing(c,x,y,side,span,lift,col,edge){/* 雲のようにふくらんだ、つばさ（玉をならべる） */for(let i=0;i<=10;i++){const t=i/10,px=x+side*(18+t*span),py=y-6-lift*t*t+Math.sin(t*3.1)*6,r=Math.max(6,26*(1-t*.7));wOval(c,px,py+3,r,r*.7,edge);wOval(c,px,py,r,r*.7,col)}
  for(let i=0;i<4;i++){const t=.55+i*.13,px=x+side*(18+t*span),py=y-6-lift*t*t+18;wOval(c,px,py,8,14,col)}}/* 風切り羽 */
function windBird(c,x,y,flap,al){/* 風のヌシ様：雲のつばさの白い大きな鳥（上から見た形） */c.save();c.globalAlpha=al;const lift=flap*40,W0='#f4fbfd',E='#a5d2e8',S0='#cfe6f0';
  wWing(c,x,y,-1,150,lift,W0,E);wWing(c,x,y,1,150,lift,W0,E);
  for(let i=0;i<5;i++)wOval(c,x-44-i*8,y+(i-2)*7,14,6,i%2?S0:W0);/* 尾 */
  wOval(c,x,y+3,42,22,E);wOval(c,x,y,42,22,W0);wOval(c,x-6,y+8,30,10,S0);
  wOval(c,x+44,y-10,16,15,E);wOval(c,x+44,y-12,15,14,W0);c.fillStyle='#f2c46a';c.fillRect(Math.round(x+58),Math.round(y-14),10,4);c.fillRect(Math.round(x+66),Math.round(y-12),4,2);c.fillStyle='#3d4a5c';c.fillRect(Math.round(x+48),Math.round(y-18),4,4);
  c.restore()}
function windWingUnder(c,x,y,al,now){/* 雲の下のつばさと、つばさのかげでねむる影 */c.save();c.globalAlpha=al*.75;wWing(c,x,y,1,260,-20,'#f4fbfd','#bcdcec');wWing(c,x+40,y+40,1,200,-10,'#e6f4fa','#bcdcec');c.globalAlpha=al*.6;
  for(let i=0;i<5;i++){const sx=x+60+i*44,sy=y+60+((i*13)%3)*10,b=Math.sin(now/700+i)*2;wOval(c,sx,sy+b,14,10,'#4a4060');c.fillStyle='#e8e0f8';c.fillRect(Math.round(sx-6),Math.round(sy-2+b),4,2);c.fillRect(Math.round(sx+2),Math.round(sy-2+b),4,2)}c.restore()}
function drawWindNushi(c,now){if(!windOn()||S.free)return;const g=S.wind.gap;
  if(g&&g.j>=0&&(S.flags.windTop||WV.wingT)&&!S.flags.windEnd){/* 雲の切れ目：雲がうすくわれて、下の空が見える */const x=(g.j%W+.5)*TS,y=((g.j/W|0)+.5)*TS;wOval(c,x,y,40,24,'#a5d2e8');wOval(c,x,y,32,18,'#7fb4d6');
    for(let q=0;q<6;q++){const a=now/1600+q*1.047;wOval(c,x+Math.cos(a)*44,y+Math.sin(a)*26,10,6,'#f4fbfd')}
    if(WV.glowT&&now-WV.glowT<6000||S.flags.windCall){c.save();c.globalAlpha=.35+.15*Math.sin(now/400);wOval(c,x,y,24,14,'#fff6c8');c.restore()}}
  if(g&&g.j>=0&&(S.flags.windTop||WV.wingT)&&!S.flags.windWon&&!WV.bird){const a=WV.wingT?Math.min(1,(now-WV.wingT)/1500):1,k=S.flags.windTop||WSRUN?a:0;if(k>0){const x=(g.j%W+.5+WDIR[g.d][0]*3)*TS-100,y=((g.j/W|0)+.5+WDIR[g.d][1]*3)*TS-20;windWingUnder(c,x,y,k*(WSRUN?1:.45),now)}}
  const b=WV.bird;if(b||S.flags.windEnd){/* ヌシ様：雲の切れ目からのぼって、遊び場の上へ。クリアのあとは、ゆっくり空をまわる */let x,y,al=1;const fl=Math.sin(now/260)*.5+.5;
    if(b&&!S.flags.windEnd){const t=(now-b.t0)/1000;if(t<3){const p=t/3;x=b.sx*TS;y=b.sy*TS+80-p*160;al=Math.min(1,p*1.6)}else{const p=Math.min(1,(t-3)/2.4),e=p*p*(3-2*p);x=(b.sx+(b.hx-b.sx)*e)*TS;y=(b.sy-5+(b.hy-b.sy+5)*e)*TS-80*(1-e)+Math.sin(now/900)*6}}
    else{if(!g||g.j<0)return;const a=now/9000;x=(g.j%W+.5+WDIR[g.d][0]*4+Math.cos(a)*7)*TS;y=((g.j/W|0)+.5+WDIR[g.d][1]*4+Math.sin(a)*4)*TS;al=.85}/* クリアのあとは、雲の切れ目のあたりの空を、ゆっくりまわる */
    windBird(c,x,y,fl,al)}}
