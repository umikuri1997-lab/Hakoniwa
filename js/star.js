/* ---------- 流れ星の夜 ----------
   雨でない夜の20〜23時に、1晩に1回、30%の夜（STARP）に流れ星が空を流れる（実時間4秒、STARMS）。
   流れているあいだに星そのものをタップすると、おねがいを3つからえらぶ（S.starW）。つぎの朝6時に、おくりものがとどく（starMorning）。
   起きているひまなせいれいは、流れ星のあいだ空を見上げる（starLook、絵は qlookup）。 */
const STARP=.3,STARPT=.4/* 星見の望遠鏡があるとき */,STARMS=4000,STARH0=20,STARH1=23,STARMAT=15,STARSEED=3,STARFUN=20,STARHIT=56;
const STARWISH={yutaka:{n:'ゆたかに',d:'つぎの朝、素材が15こ'},minori:{n:'みのりを',d:'つぎの朝、たねが3こ'},genki:{n:'げんきに',d:'つぎの朝、みんなのたのしさ+20'}};
let STAR=null;/* いま流れている流れ星（実時間。セーブしない） */
function starTick(){/* 1秒に1回 */if(!S||S.free||IS_STORY_REPLAY||(typeof NOSAVE!=='undefined'&&NOSAVE))return;const d=dayNo(),h=hour(),st=S.starN||(S.starN={});
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
  if(k==='yutaka'){const L=WD===1?['wood','stone','bamboo','kuru','chiri']:['wood','stone','shina','kasa','eda'],a=pick(L);let b=pick(L);if(b===a)b=L[(L.indexOf(a)+1)%L.length];const na=8,nb=STARMAT-na;S.mat[a]=(S.mat[a]||0)+na;S.mat[b]=(S.mat[b]||0)+nb;got.push(MATN[a]+'×'+na,MATN[b]+'×'+nb)}
  else if(k==='minori'){const L=Object.keys(CROPS).filter(c=>cropOn(c));const c=L.length?pick(L):null;if(c){giveItem('seed:'+c,STARSEED);got.push(CROPS[c].name+'のたね×'+STARSEED)}}
  else if(k==='genki'){for(const r of S.res)if(!r.hidden)r.fun=Math.min(100,r.fun+STARFUN);got.push('みんなのたのしさ+'+STARFUN)}
  if(got.length){toast('流れ星のおねがいが、かなった：'+got.join('・'),'good');memo('power','流れ星のおねがいが、かなった')}}
function drawStar(now){/* 空を流れる星（3点のドットの段々と、うすれる尾） */if(!STAR)return;const p=(now-STAR.t0)/STARMS;if(p>=1.4){STAR=null;return}if(p>=1)return;const e=p<.15?p/.15:1,u=3;
  const hx=(STAR.x0+(STAR.x1-STAR.x0)*p)*VW,hy=(STAR.y0+(STAR.y1-STAR.y0)*p)*VH,dx=(STAR.x0-STAR.x1)*VW,dy=(STAR.y0-STAR.y1)*VH,L=Math.hypot(dx,dy)||1;
  for(let i=18;i>=0;i--){const q=i*u*1.6,x=Math.round((hx+dx/L*q)/u)*u,y=Math.round((hy+dy/L*q)/u)*u,a=(1-i/19)*e*(p>.85?(1-p)/.15:1);ctx.fillStyle='rgba(255,246,214,'+(a*.85).toFixed(3)+')';ctx.fillRect(x,y,u,u)}
  const a=e*(p>.85?(1-p)/.15:1),x=Math.round(hx/u)*u,y=Math.round(hy/u)*u;ctx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';ctx.fillRect(x-u,y,u*3,u);ctx.fillRect(x,y-u,u,u*3)}
