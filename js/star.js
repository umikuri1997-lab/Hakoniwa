/* ---------- 流れ星の夜 ----------
   雨でない夜の20〜23時に、1晩に1回、30%の夜（STARP）に流れ星が空を流れる（実時間4秒、STARMS）。
   流れているあいだに星そのものをタップすると、おねがいを3つからえらぶ（S.starW）。つぎの朝6時に、おくりものがとどく（starMorning）。
   起きているひまなせいれいは、流れ星のあいだ空を見上げる（starLook、絵は qlookup）。 */
const STARP=.3,STARPT=.4/* 星見の望遠鏡があるとき */,STARMS=4000,STARH0=20,STARH1=23,STARMAT=15,STARSEED=3,STARFUN=20,STARHIT=56;
const STARWISH={yutaka:{n:'ゆたかに',d:'つぎの朝、素材が15こ'},minori:{n:'みのりを',d:'つぎの朝、たねが3こ'},genki:{n:'げんきに',d:'つぎの朝、みんなのたのしさ+20'}};
let STAR=null;/* いま流れている流れ星（実時間。セーブしない） */
function starTick(){/* 1秒に1回 */if(!S||IS_STORY_REPLAY||(typeof NOSAVE!=='undefined'&&NOSAVE))return;const d=dayNo(),h=hour(),st=S.starN||(S.starN={});
  if(st.d!==d&&h>=STARH0&&h<STARH1){st.d=d;st.at=Math.random()<(S.obj.includes('telescope')?STARPT:STARP)?STARH0+.3+Math.random()*(STARH1-STARH0-.8):-1}/* 20時に、今夜流れるか・何時かをきめる */
  if(st.at>0&&st.shown!==d&&h>=st.at&&h<STARH1&&!S.rain&&!STAR&&$('#dialog').hidden&&!sheet){st.shown=d;starStart()}}
function starStart(){const now=performance.now(),k=Math.random();STAR={t0:now,x0:.62+k*.3,y0:.06+Math.random()*.08,x1:.18+k*.25,y1:.3+Math.random()*.1,tap:false};/* 流れているあいだは、音を出さない */
  for(const r of S.res)if(starIdle(r))r.bubble='✨'}
function starIdle(r){if(!r||r.hidden)return false;const a=r.act;if(!a)return true;if(a.stage==='walk')return false;return ['idle','wander','rest','chat','chatwait','sunset','quirk','critwatch','admire','ownseat','fish','play','patrol'].includes(a.type)}
function starLook(r,now){return !!STAR&&now<STAR.t0+STARMS+1500&&starIdle(r)}
function starHit(sx,sy,now){/* 星そのもの（頭と、すぐうしろの尾）のまわり STARHIT の中か */const p=Math.min(1,(now-STAR.t0)/STARMS),q=Math.max(0,p-.08),ax=(STAR.x0+(STAR.x1-STAR.x0)*p)*VW,ay=(STAR.y0+(STAR.y1-STAR.y0)*p)*VH,bx=(STAR.x0+(STAR.x1-STAR.x0)*q)*VW,by=(STAR.y0+(STAR.y1-STAR.y0)*q)*VH,dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy,t=L2?Math.max(0,Math.min(1,((sx-ax)*dx+(sy-ay)*dy)/L2)):0;return Math.hypot(sx-(ax+dx*t),sy-(ay+dy*t))<=STARHIT}
function starTap(sx,sy){/* 流れ星そのものをタップしたときだけ、おねがい（ほかの所のタップは、ふつうのタップ） */const now=performance.now();if(!STAR||STAR.tap||now>STAR.t0+STARMS||!starHit(sx,sy,now))return false;STAR.tap=true;sfx('starkira');starWishPop();return true}
function starWishPop(){const ov=el('<div class="idea-reveal" role="dialog" aria-modal="true"></div>'),cd=el('<div class="idea-card"><h2>流れ星におねがい</h2><p class="note">ひとつえらぼう。</p><div class="mgopts"></div></div>'),bx=cd.querySelector('.mgopts');
  for(const k in STARWISH){const b=el('<button class="btn" type="button" style="width:100%;margin-top:6px"></button>');b.textContent=STARWISH[k].n+'（'+STARWISH[k].d.replace('つぎの朝、','')+'）';b.onclick=()=>{S.starW={d:dayNo(),k};sfx('quest');toast('流れ星に「'+STARWISH[k].n+'」とおねがいした','good');logEv('流れ星におねがいした');ov.remove()};bx.appendChild(b)}
  ov.appendChild(cd);document.body.appendChild(ov)}
function starMorning(){/* 朝6時：ゆうべのおねがいが、かなう */const w=S.starW;if(!w)return;S.starW=null;if(w.d!==dayNo()-1)return;const k=w.k,got=[];
  if(k==='yutaka'){const L=stg().mats,a=pick(L);let b=pick(L);if(b===a)b=L[(L.indexOf(a)+1)%L.length];const na=8,nb=STARMAT-na;S.mat[a]=(S.mat[a]||0)+na;S.mat[b]=(S.mat[b]||0)+nb;got.push(MATN[a]+'×'+na,MATN[b]+'×'+nb)}
  else if(k==='minori'){const L=Object.keys(CROPS).filter(c=>cropOn(c));const c=L.length?pick(L):null;if(c){giveItem('seed:'+c,STARSEED);got.push(CROPS[c].name+'のたね×'+STARSEED)}}
  else if(k==='genki'){for(const r of S.res)if(!r.hidden)funAdd(r,STARFUN,'star');got.push('みんなのたのしさ+'+STARFUN)}
  if(got.length){S.starG={k,got};memo('power','流れ星のおねがいが、かなった')}}/* 見せるのは starWishTick（見おわったら S.starG をけす） */
/* おねがいがかなう演出：村の時間を止め、カメラが神殿（なければおそなえ箱）へ → 空から星の光がおりて、はじける（キラッ）→ 素材・たねは上の数へとぶ／たのしさは、みんながよろこぶ → 大きな知らせ → カメラがもどる。演出は実時間 */
let STARG=null;
function starWishTick(){if(!S||!S.starG||STARG||GIFT_ACTIVE||camAnim||IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN||typeof stageReady==='function'&&!stageReady())return;starWishShow()}
function starWishShow(){const G=S.starG,owner=S,session=VILLAGE_SESSION,ok=()=>S===owner&&session===VILLAGE_SESSION;GIFT_ACTIVE=true;STARG={};
  const j=STATUE>=0?STATUE:OBOX,back={z:cam.z,x:cam.x+VW/cam.z/2,y:cam.y+VH/cam.z/2},tx=j>=0?(j%W+.5)*TS:back.x,ty=j>=0?((j/W|0)+.2)*TS:back.y;
  const finish=()=>{if(!STARG)return;STARG=null;GIFT_ACTIVE=false};
  musicDuck(3200);
  camAnim=STARG.cam={fz:cam.z,tz:Math.min(2.2,Math.max(cam.z,1.6)),fx:back.x,fy:back.y,tx,ty,t:0,dur:1.1,done:()=>{if(!ok())return finish();
    const T0=performance.now(),x=tx,y=ty-6,top=y-VH/cam.z*.55;sfx('starkira');
    scnAdd('orb',900,{x0:x+40,y0:top,x1:x,y1:y,arc:-14,col:'#fff6c8',n:5});scnAdd('glow',900,{x,y:top+30,r:14,col:'#fff6c8'},0);
    later(()=>{if(!ok()||!STARG)return finish();sfx('good');scnAdd('glow',1600,{x,y,r:30,col:'#fff6c8'});scnAdd('ring',900,{x,y:y+8,r0:6,r1:34,col:'#fff0a8'});scnAdd('ring',900,{x,y:y+8,r0:6,r1:46,col:'#cfe4ff'},260);
      for(let i=0;i<8;i++)scnAdd('orb',700,{x0:x,y0:y,x1:x+Math.cos(i*.785)*30,y1:y-6+Math.sin(i*.785)*16,arc:8,col:i%2?'#cfe4ff':'#fff0a8',n:1},60+i*40);
      if(typeof juiceGlowAt==='function'&&j>=0)juiceGlowAt(j%W+.5,(j/W|0)+.5,2);
      if(G.k==='genki'){for(const r of S.res)if(!r.hidden&&!(r.act&&r.act.type==='sleep')){JOYU.set(r,performance.now()+2600);JUMP.set(r,performance.now())}}
      else if(typeof juiceFly==='function')later(()=>{if(ok())juiceFly(x/TS,y/TS,'mat',3)},300);
      later(()=>{if(!ok()||!STARG)return finish();const ov=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="流れ星のおねがいが、かなった"></div>'),card=el('<div class="idea-card"><h2>おねがいが、かなった！</h2><p class="note"></p></div>');
        card.querySelector('.note').textContent=G.got.join('・');const b=el('<button class="btn pri" type="button">とじる</button>');b.disabled=true;card.append(b);ov.append(card);document.body.append(ov);sfx('level');if(typeof juiceCheer==='function')juiceCheer();setTimeout(()=>{if(ov.isConnected)b.disabled=false},800);
        b.onclick=()=>{if(b.disabled)return;sfx('tap');ov.remove();if(!ok())return finish();delete S.starG;camAnim=STARG.cam={fz:cam.z,tz:back.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:back.x,ty:back.y,t:0,dur:1.1,done:finish}}},1300)},850)}}}
function starWishReset(){if(!STARG)return;if(STARG.cam&&camAnim===STARG.cam)camAnim=null;STARG=null;GIFT_ACTIVE=false;document.querySelectorAll('.gift-reveal').forEach(e=>{if(e.getAttribute('aria-label')==='流れ星のおねがいが、かなった')e.remove()})}/* 村を切りかえたとき */
function drawStar(now){/* 空を流れる星（3点のドットの段々と、うすれる尾） */if(!STAR)return;const p=(now-STAR.t0)/STARMS;if(p>=1.4){STAR=null;return}if(p>=1)return;const e=p<.15?p/.15:1,u=3;
  const hx=(STAR.x0+(STAR.x1-STAR.x0)*p)*VW,hy=(STAR.y0+(STAR.y1-STAR.y0)*p)*VH,dx=(STAR.x0-STAR.x1)*VW,dy=(STAR.y0-STAR.y1)*VH,L=Math.hypot(dx,dy)||1;
  for(let i=18;i>=0;i--){const q=i*u*1.6,x=Math.round((hx+dx/L*q)/u)*u,y=Math.round((hy+dy/L*q)/u)*u,a=(1-i/19)*e*(p>.85?(1-p)/.15:1);ctx.fillStyle='rgba(255,246,214,'+(a*.85).toFixed(3)+')';ctx.fillRect(x,y,u,u)}
  const a=e*(p>.85?(1-p)/.15:1),x=Math.round(hx/u)*u,y=Math.round(hy/u)*u;ctx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';ctx.fillRect(x-u,y,u*3,u);ctx.fillRect(x,y-u,u,u*3)}
