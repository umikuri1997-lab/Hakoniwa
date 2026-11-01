'use strict';

/* ---------- レベル ---------- */
const LV_XP=[0,60,210,462,927,1785,3375,4800,6600,9000,12000,15750,20250,25500,31500];/* 村レベルに必要なパワーの合計。クリア後はLv15まで */
const maxLv=()=>S&&S.cleared?15:10;
function vLv(){let l=1;while(l<maxLv()&&S.totalPt>=LV_XP[l])l++;return l}
const LVXP=[0,0,25,100,225,400,625,900,1225,1600,2025,2500,3025,3600,4225,4900,5625,6400,7225,8100,9025,10000,11025,12100,13225,14400,15625,16900,18225,19600,21025,22500,24025,25600,27225,28900,30625,32400,34225,36100,38025];/* せいれいのレベル：そのレベルになるのに要る経験値（Lv1〜40） */
const HMAXL=[0,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490];const HMAXF=[0,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490,500,510,520,530,540];/* 火の子のおなかの最大（レベル1で150） *//* レベルごとの、おなかの最大 */
const XPBL=[0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19];/* レベルごとに、もらう経験値に足す数 */
const OFFERPL=[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10,11,11,11,12,12,12,13];/* せいれいのレベルごとに、おくりものにふえる数 */
const SEEDPL=[0,0,0.5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];/* せいれいのレベルごとに、たねが1こふえる確率 */
const FATKL=[0,1,1,1,2,2,2,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4];/* 火のせいれいのレベルごとの攻撃力 */
const OVENM=[1,.9,.8,.7,.6,.5,.4,.3,.2,.1,0];/* そばにある調理の家具の種類の数ごとの、料理にかかる時間の倍（0種=1・1種=0.9…） */
const rLv=r=>{const x=r.xp||0;let l=1;while(l+1<LVXP.length&&x>=LVXP[l+1])l++;return l},hMax=r=>(r.elem==='fire'?HMAXF:HMAXL)[rLv(r)];/* おなかの最大はレベル1ごとに+10 */
/* せいれいの能力。100がふつう。レベルが上がると、作業スピード・移動速度・持てる数などがふえる */
const lvF=(lv,k)=>1+k*(Math.min(lv,10)-1);
/* 10がふつう。レベルアップでふえる量は、せいれいとレベルごとにばらつく（0〜2） */
const LVUP={work:[0,0,1,1,1,2],move:[0,0,0,1,1,1]};
function lvGain(r,k,lv){let n=0;for(let l=2;l<=Math.min(lv,10);l++){const h=hash(((r.id||0)*131+l*17+(k==='work'?7:3))>>>0);n+=LVUP[k][(h*LVUP[k].length)|0]}return n}
const RSC=new WeakMap();function rMul(r,k){const lv=rLv(r);let c=RSC.get(r);if(!c||c.lv!==lv||c.vr!==r.vr||c.b!==r.boost){c={lv,vr:r.vr,b:r.boost,s:rStat(r,lv)};RSC.set(r,c)}return c.s[k]/10*(k==='work'&&r.wkB>S.t?1.15:k==='move'&&r.mvT>S.t?1.15:1)}
function ovenMul(j){if(j==null)return 1;const x0=j%W,y0=(j/W)|0;const kinds=new Set();for(let y=y0-3;y<=y0+3;y++)for(let x=x0-3;x<=x0+3;x++){if(x<0||y<0||x>=W||y>=H)continue;const o=S.obj[y*W+x];if(o&&BL[o]&&BL[o].cat==='cook')kinds.add(o)}return OVENM[Math.min(kinds.size,OVENM.length-1)]}/* 調理の家具がそばにあると、料理が早い（同じ家具は1つ分だけ。下限はなし） */
const fAtk=lv=>FATKL[lv];/* 火のせいれい：Lv1=1・Lv4=2・Lv7=3・Lv10=4 */
function rStat(r,lv){const V=r.vr||{},fire=r.elem==='fire';return{
  atk:fire?fAtk(lv)+((r.bst&&r.bst.atk)||0)+((r.sst&&r.sst.atk)||0):0,/* 攻撃できるのは火の子だけ */
  work:Math.round(10*(V.pow||1)*(EL_WORK[r.elem]||1)*(trt(r,'hataraki')?1.25:1))+lvGain(r,'work',lv),
  move:Math.round(10*(V.spd||1)*(trt(r,'hayaashi')?1.25:1)*(r.elem==='wind'?1.45:1))+lvGain(r,'move',lv),
  eat:Math.round(10*(V.eat||1)*(trt(r,'shoshoku')?.8:1)),
  sta:Math.round(10*(V.sta||1)*(EL_STA[r.elem]||1)*(trt(r,'tafu')||trt(r,'nebari')?1.33:1)),
  cap:Math.min(10,lv)+(trt(r,'chikara')?2:0)+((r.bst&&r.bst.cap)||0)+((r.sst&&r.sst.cap)||0),
  bonus:XPBL[lv]}}
const RSTN=[['work','作業スピード'],['move','移動速度'],['cap','持てる数'],['atk','攻撃力']];
// 満腹に必要な食料の数：Lv1〜4で1つ、4レベルごとに+1、火のせいれいは+1
const fullN=r=>1+Math.floor((rLv(r)-1)/4)+(r.elem==='fire'?1:0);/* レベルが上がっても、食べる量はゆるやかにしかふえない */
let LVQ=null;
function lvShow(l,bonus,opens){
  const o=$('#lvup');o.querySelector('.n').textContent=l;{const pw=o.querySelector('.pw'),a=LIGHTCDL[l-1]||10,b=LIGHTCDL[l]||10;pw.hidden=!(b<a);pw.textContent='まもりの光のチャージ '+a+'秒 → '+b+'秒'}/* 村レベルで、まもりの光のチャージがみじかくなったら書く */
  const u=o.querySelector('.op');u.innerHTML='';u.hidden=!opens.length;
  const od=o.querySelector('.opd');od.hidden=true;
  if(opens.length){u.appendChild(el('<small>あたらしく使える</small>'));for(const id of [...new Set(opens)]){const b=el('<button class="lvic"><img alt=""><span></span></button>');b.querySelector('img').src=iconURL(id);b.querySelector('span').textContent=iname(id);b.onclick=e=>{e.stopPropagation();sfx('tap');u.querySelectorAll('.lvic').forEach(x=>x.classList.toggle('on',x===b));od.hidden=false;od.innerHTML='<b></b><p></p>';od.querySelector('b').textContent=iname(id);od.querySelector('p').textContent=withAttr(id,(BL[id]&&BL[id].desc)||'')};u.appendChild(b)}}/* 解放されたものはアイコン。タップで説明 */
  o.hidden=false;o.classList.remove('on');void o.offsetWidth;o.classList.add('on');
  
  for(const r of S.res){if(r.hidden)continue;const t=performance.now();r.bubble='✨';r.shine=t;JOYU.set(r,t+3200);RHOLD.set(r,t+3200);JUMP.set(r,t);for(const d of[1000,2000])setTimeout(()=>{if(S.res.includes(r))JUMP.set(r,performance.now())},d);burst((r.y|0)*W+(r.x|0),'plant','none')}/* キラキラ・笑顔・こっちを向いて、何度かジャンプ */
  startClap();/* タップするまで、こっちを向いて拍手 */
  if(STATUE>=0)for(let n=0;n<3;n++)setTimeout(()=>burst(STATUE,'furn','none'),n*260);
}
const LEVELUP_ITEMS=new Set(['bridge','path','woodpath','ladder_wood','ladder_bamboo','slope_earth','stairs_wood','stairs_stone','stairs_brick','gate','hwall','door','logfence','bamboofence','floor','brickfloor','stonefloor','window','plasterwall','gravel','wall','sdoor','logwall','brick','brickwall','carpet','curtain1','stone','stonegate','logdoor','loggate','kamizo']);
const levelUpItemsAt=n=>Object.keys(BL).filter(id=>LEVELUP_ITEMS.has(id)&&BL[id].lv===n&&!BL[id].offerOnly&&(BL[id].w||0)<=WD);
const visibleLevelRewardsAt=n=>levelUpItemsAt(n).filter(id=>BL[id].kind!=='furn'||!S.free);/* フリーモードは、家具のレシピを村レベルでおぼえない */
function checkLevel(){
  const l=vLv();if(S.lv>l)return;/* 必要なパワーをふやしても、いまの村レベルは下げない */const old=S.lv||1,priorUnlocks={...(S.unlocked||{})},priorRecipes={...(S.recipes||{})};
  for(let n=2;n<=l;n++)for(const id of visibleLevelRewardsAt(n)){if(BL[id].kind==='block')S.unlocked[id]=true;else if(BL[id].kind==='furn'&&!S.free){S.recipes||(S.recipes={});S.recipes[id]=true}}
  if(l>=2)S.unlocked.path=true;
  if(old<13&&l>=13)setTimeout(()=>toast('家の屋根の色を、えらべるようになりました','good'),1500);/* 屋根の色（家をタップしてえらぶ） */
  if(l>=4&&!S.free){S.unlocked.window=true;S.recipes||(S.recipes={});S.guardianIdeas||(S.guardianIdeas={});S.recipes.window=true;S.guardianIdeas.window=true}
  if(l>old){sfx('level');const allOpen=[];let allBonus=0;for(let n=old+1;n<=l;n++){const bonus=0;const opens=visibleLevelRewardsAt(n).filter(id=>BL[id].kind==='block'?!priorUnlocks[id]:!priorRecipes[id]);allOpen.push(...opens);allBonus+=bonus}
    S.lv=l;memo('🏡','村レベル'+l+'になった');renderPalette();if(sheet){if(LVQ){LVQ[1]+=allBonus;LVQ[2].push(...allOpen);LVQ[0]=l}else LVQ=[l,allBonus,allOpen]}else lvShow(l,allBonus,allOpen);
  }else S.lv=l;
}

/* ---------- 世界の時間 ---------- */
// 重なりよけ：作業中・止まっている子は動かさず、歩いている子のほうがよける
function sepRes(dt){// 移動中は重なってOK、止まって作業している子どうしは重ならない
  const L=S.res.filter(r=>!r.hidden&&!(r.act&&(r.act.type==='tag'||r.act.stage==='walk'))&&!(r.path&&r.path.length)),R=.55;
  const wt=r=>r.ghost>0?0:!r.act||r.act.stage==='walk'?(r.path&&r.path.length?1:.7):r.act.stand>=0?0:.5;
  for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const p=L[a],q=L[b];let dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d>=R)continue;
    let wp=wt(p),wq=wt(q);if((wp===0)!==(wq===0))continue;if(wp+wq<=0){if(d>.35)continue;wp=wq=.5}
    if(d<1e-4){const an=(p.id*7+q.id*13)%6.28;dx=Math.cos(an);dy=Math.sin(an);d=0}else{dx/=d;dy/=d}
    const m=Math.min(R-d,.6*dt+.03);
    const mv=(r,sx,sy)=>{const nx=r.x+sx,ny=r.y+sy;if(walk((ny|0)*W+(nx|0))){r.x=nx;r.y=ny}};
    if(p.ghost>0||q.ghost>0)continue;
    const side=(r,sx,sy,k)=>{if(r.path&&r.path.length){const j=r.path[0],hx=j%W+.5-r.x,hy=((j/W)|0)+.5-r.y,hl=Math.hypot(hx,hy)||1,ux=hx/hl,uy=hy/hl;
        const dot=sx*ux+sy*uy;if(dot<0){sx-=dot*ux;sy-=dot*uy;const pl=Math.hypot(sx,sy);if(pl<1e-3){sx=-uy;sy=ux}else{sx/=pl;sy/=pl}}}
      mv(r,sx*k,sy*k)};
    side(p,-dx,-dy,m*wp/(wp+wq));side(q,dx,dy,m*wq/(wp+wq))}}
const DAYLEN=1.5;/* 1日の長さ：せいれいが動く時間の1.5倍で、時計が1分すすむ */
function stepWorld(dt){if((SUBT+=dt)>1){SUBT=0;checkSub();checkSev();guardTick()}
  st2Tick();fireTick(dt/DAYLEN);
  const prevH=hour(),t0=S.t;let nt=S.t+dt/DAYLEN;// 時計：夜も昼と同じ速さ（1日は1.5倍の長さ）
  if(!S.enemyOn){const c=clk(),cap=Math.floor(c/1440)*1440+18*60,nc=c+(nt-S.t);if(nc>cap)S.hold=(S.hold||0)+Math.min(nt-S.t,nc-cap)}/* チュートリアルで夜がはじまるまで、時計（朝・昼・夜）は18時で止めておく。せいれいの動きにつかう時間（S.t）は進める */S.t=nt;const h=hour();
  for(const k in S.dyn){const o=S.obj[k],d=S.dyn[k];if(!o)continue;
    if(o==='farm'){if((S.rain||NEARWELL.has(+k))&&d.g<100)d.wet=100}}/* 雨・井戸のそば：たねをまく前の畑も、ぬれる *//* ベリー・りんごの実は、朝6時に1日ぶんずつ育つ（morning） */
  for(const r of S.res.slice())updRes(r,dt);
  sepRes(dt);
  for(const e of S.enemies)updEnemy(e,dt);
  updTowers(dt);
  if(S.nushi)updNushi(dt);
  if(prevH<6&&h>=6&&S.nightHad){S.nightHad=false;const left=S.enemies.length;{const t0=performance.now();for(const e of S.enemies)if(e.spawned&&!e.dead)EVAP.push({e,t0:t0+Math.random()*500})}if(left)sfx('evap');S.enemies=[];
    if(S.ns&&!S.nightHurt){const rw=Math.min(10,3+Math.floor((S.nights||0)/2));S.ns.rw=rw;if(!S.flags.safeMemo){S.flags.safeMemo=1;memo('🌙','はじめて夜をぶじに守りきった')}S.pt+=rw;S.totalPt+=rw;for(const r of S.res)r.fun=Math.min(100,r.fun+10)}/* けがも被害もない夜は、ごほうび（パワーと、みんなのたのしさ） */
    if(S.ns&&S.ns.final&&!S.cleared&&WD===1){const t=st2(),ok=springN()>=2;t.frz={};t.cool=null;S.finalNight=false;if(ok){S.flags.nushiDue=1;setTimeout(()=>{if(!S.cleared)nushiReturns()},1800)}else{S.finalLost=dayNo();S.finalRetry=dayNo()+3;memo('🌋','温泉を守りきれなかった');setTimeout(()=>toast('火の山は、まだあばれている…','warn'),1500)}}/* 火山のふもと：朝に、あたたかい温泉が2つ以上のこっていれば勝ち。冷えた温泉は、朝にもどる */
    else if(S.ns&&S.ns.final&&!S.cleared&&!(S.ns.b2&&S.obj.includes('tower'))){S.finalNight=false;S.finalLost=dayNo();if(WD)S.finalRetry=dayNo()+3;else{S.finalDay=dayNo()+3;S.finalHint=3}memo('🌑','ヨルノオオカゲを追いはらえなかった');setTimeout(()=>toast('ヨルノオオカゲは、まだどこかにいる…','warn'),1500)}/* ヨルノオオカゲを追いはらえなかったか、台座をこわされたら負け。3日あとにまた来る */else if(S.ns&&S.ns.final&&!S.cleared){S.finalNight=false;if(WD){S.flags.nushiDue=1;setTimeout(()=>{if(!S.cleared)nushiReturns()},1800)}/* 火山のふもとには、フタバはいない */else if(!S.flags.finalWon){S.flags.finalWon=1;const b=S.b2At||{x:CX+.5,y:CY+.5};dropAt(b.x,b.y,'shard');memo('💎','ヨルノオオカゲが消えたところに、光るものがのこっていた');setTimeout(()=>toast('ヨルノオオカゲが消えたところに、なにかが光っている……','good'),1500)}/* かけらは、ヨルノオオカゲが消えた場所に落ちる。フタバがひろう */}/* 最後の夜をこえたら、かけらが出て、台座にはめるとヌシ様がもどる */if(S.ns&&S.ns.trial){const ok=S.ns.kill>=S.ns.n;S.ns.trialOK=ok;if(ok){S.trials=(S.trials||0)+1;S.pt+=60;S.totalPt+=60;S.mebuki=(S.mebuki||0)+1;memo('🏆','「コワイノ」の試練をのりこえた')}}
    if(S.ns){S.ns.left=left;if(!sheet)openSheet('night');else toast(S.nightHurt?'朝日がのぼって、「コワイノ」は'+(left?'消えていった':'いなくなった'):'夜をぶじに守りきった！','good')}
    else if(!S.nightHurt)toast('夜をぶじに守りきった！','good');else toast('朝日がのぼって、「コワイノ」は'+(left?'消えていった':'いなくなった'))}
  if((prevH|0)!==(h|0)&&h>=7&&h<23){trapCheck();graveCheck();sparkTick();festGift()}/* 1時間に1回、とじこめられた子がいないか見る */
  if(prevH<6&&h>=6&&S.lastMorning!==dayNo()){S.lastMorning=dayNo();morning();if(WD===1&&S.finalRetry!=null&&dayNo()>=S.finalRetry&&!S.cleared){S.finalRetry=null;S.finalNight=true}}/* 火山のふもと：負けたら3日あとの夜にまた来る *//* 1日のリセットは朝6時にまとめて */
  if(prevH<7&&h>=7&&S.festDay===dayNo())festBegin();
  if(prevH<8&&h>=8&&S.godGone&&!S.cleared&&!S.godVisit&&dayNo()>=(S.godNextVisitDay||1)&&Math.random()<(cnt('kamizo')?.5:.25)){S.godVisit=true;S.godNextVisitDay=dayNo()+2;/* 来た翌日は休み。像があれば来訪率は50% */sfx('arrive');toast('カミサマが遊びにきた！','good')}
  if(prevH<6&&h>=6&&S.godVisit&&!festOn()){S.godVisit=false;S.godNextVisitDay=Math.max(S.godNextVisitDay||0,dayNo()+2);toast('カミサマは帰っていった')}/* おまつりの日に来ていたカミサマは、おまつりがおわる朝6時に帰る */
  if(prevH<18&&h>=18&&S.godVisit&&!festOn()){S.godVisit=false;S.godNextVisitDay=Math.max(S.godNextVisitDay||0,dayNo()+2);toast('カミサマは帰っていった')}
  if(prevH<20&&h>=20&&S.enemyOn&&S.lastWarn!==dayNo()){S.lastWarn=dayNo();S.wave=waveFor(dayNo()+1);if(S.wipe&&S.res.length>=5)S.wipe=false;if(S.finalNight&&!S.cleared&&WD===1){S.finalNight=false;S.finalOn=true;const t=st2();t.cool={a:40,b:40,c:40};t.frz={};S.wave=['yama','ash','ash','ash','ash','rockc','rockc'].concat(S.wave.filter(t=>!EN[t].boss));/* 人数が少ない夜の上限でけずられるのは、あとのふつうの敵から */toast('今夜、火の山の影がおしよせてくる','warn')}/* 火山のふもとの最後の夜：温泉を朝まで守る */
    else if(S.finalNight&&!S.cleared&&!S.flags.finalWon&&!WD&&(S.rushN||0)<2&&S.res.some(r=>r.name===POKO)){S.finalNight=false;S.rushN=(S.rushN||0)+1;S.rushOn=true;S.wave=(S.rushN===1?['boss','brute','brute','breaker','fast','fast']:['boss','brute','brute','brute','breaker','breaker','trapper','fast','fast']).concat(S.wave.filter(t=>!EN[t].boss));toast(S.rushN===1?'今夜、影の群れが台座をめざしてやってくる！':'ゆうべより大きな群れが来る……！','warn')}/* 最後の夜の前の2晩は、強い影がたくさんおしよせる */
    else if(S.finalNight&&!S.cleared&&!S.flags.finalWon&&(WD||S.res.some(r=>r.name===POKO))){S.finalNight=false;S.finalDay=null;S.finalOn=true;/* 予告の日をけして、夜のあいだにもう一度始まらないようにする *//* フタバがいない夜は、ヨルノオオカゲは来ない */S.wave=['boss2','boss'].concat(S.wave.filter(t=>t!=='boss'&&t!=='boss2'),['brute','brute','fast','fast','breaker']);}else if(S.trial){S.trialOn=true;S.trial=false;S.wave=['boss'].concat(S.wave.filter(t=>t!=='boss'),['brute','brute','fast','fast'])}else if(S.today==='odayaka'){const bo=S.wave.filter(t=>t==='boss'),ot=S.wave.filter(t=>t!=='boss');S.wave=bo.concat(ot.slice(0,Math.ceil(ot.length/2)))}/* 「コワイノ」の予告はしない */}
  if(prevH<3&&h>=3)for(const H of HOUSES){const L=S.res.filter(x=>x.act&&(x.act.type==='sleep'||x.act.type==='stay')&&H.set.has((x.y|0)*W+(x.x|0)));if(houseComfort(H).over)for(const x of L){x.energy=Math.min(x.energy,60);x.fun=Math.max(0,x.fun-15);x.crowd=dayNo()}else if(L.length){const C=houseComfort(H);for(const x of L){const c=comfyFor(H,x,C);if(c>=180){x.fun=Math.min(100,x.fun+10);x.comfy=dayNo()}else if(c<90)x.fun=Math.max(0,x.fun-5)}}}/* 住み心地がいいと、ぐっすり眠れる *//* 家につめこむと、きゅうくつで眠れない */
  if(prevH>h&&S.enemyOn&&S.wave&&S.lastNight!==dayNo()-1){S.lastNight=dayNo()-1;/* 「コワイノ」は夜12時に来る（前の日の夜としてかぞえる） */S.nights++;let w=S.wave;S.wave=null;const rn=S.res.length;if(!S.rushOn)w=w.filter(t=>EN[t].boss&&!S.wipe).concat(w.filter(t=>!EN[t].boss).slice(0,Math.floor(rn*1.5)));/* ふつうのコワイノは、せいれいの数の1.5倍（小数点以下切りすて）まで *//* せいれいが少ない夜は、コワイノの数に上限：1人1体・2人2体・3人3体・4人4体・5人6体・6人7体（火山のふもとは1人3体・2人4体・3人5体・4人6体・5人8体・6人9体）（全滅のあと5人そろうまでは、オオカゲも来ない） */if(w.length)spawnWave(w)}
  if(S.seedDay!==dayNo()&&h>=6){S.seedDay=dayNo();const n=Math.random()<.5?1:0,b=S.t-S.t%1440;S.seeds=[];S.seedPlan=Array.from({length:n},()=>b+360+Math.random()*720).sort((x,y)=>x-y)}/* ふしぎな種は1日1こまで（50%）。ひろわなかったら、あしたには消える */
  if(S.seedPlan&&S.seedPlan.length&&S.t>=S.seedPlan[0]){S.seedPlan.shift();spawnSeed()}
  /* 守り神の光で木や岩から素材を落とせる話（10分ごとに、話せるか見る） */if(S.finds)delete S.finds;/* 前の「ひろいもの」は、もう使わない */
  if(prevH<3&&h>=3&&S.today==='hoshi')for(const r of S.res)if(r.act&&r.act.type==='sleep')r.fun=Math.min(100,r.fun+15);
}
