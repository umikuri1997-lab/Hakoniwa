/* 守りのしくみ（ほかのタワーディフェンスから）
   高い所の見張り台：段差1だんごとに射程+HIRNG。強化の2つの道：Lv5から、とおめ（射程+1）か、はやうち（うつ間かく0.7倍）。S.dyn[j].wp にしまう（ひっこしミトン・広げるときも、いっしょにうつる）。
   合図の太鼓（drum）：まわり5マスの見張り台の、うつ間かく0.8倍（重複なし）。
   天気の夜：雨（ほのおの罠のダメージ半分・延焼なし・水の足止め1.5倍）・風の強い日（射程+1・つむじ風9マス）・あらし（射程－1）。知らせは出さない（持ち主がきめた）。
   ヨロイカゲ（armor）：矢は半分、火・どく・延焼は2倍。ヒカリカゲ（shiny）：まれに来て、村の南を横切って帰る。たおすと、やすらぎの砂かふしぎなふくろ。 */
const HIRNG=.5,WPATHLV=5,WPATH={far:{n:'とおめ',rng:1,cd:1,t:'射程+1マス'},fast:{n:'はやうち',rng:0,cd:.7,t:'うつ間かく0.7倍'}},DRUMR=5,DRUMCD=.8,SHINYP=.1;
function wpathOf(j){const d=j!=null&&S.dyn[j];return d&&WPATH[d.wp]?d.wp:null}
function wpathSet(j,k){if(!WPATH[k]||wpathOf(j))return;(S.dyn[j]||(S.dyn[j]={})).wp=k;sfx('kankan');toast(BL.watch.name+'を「'+WPATH[k].n+'」にした','good');dirty=true}
function nightWx(){if(typeof stormNow==='function'&&stormNow())return 'storm';if(S.rain)return 'rain';if(S.today==='kaze')return 'kaze';return null}/* 今夜の天気（あらしは雨もふくむ） */
const wxRain=()=>{const w=nightWx();return w==='rain'||w==='storm'};
function drumNear(j){const x=j%W+1,y=((j/W)|0)+1;return DRUMS.some(q=>S.obj[q]==='drum'&&Math.hypot(q%W+.5-x,((q/W)|0)+.5-y)<=DRUMR)}
function towerRng(j){const w=nightWx();let a=(w==='kaze'?1:w==='storm'?-1:0);if(j!=null&&S.obj[j]==='watch'){a+=(hiAt(j)||0)*HIRNG;const p=wpathOf(j);if(p)a+=WPATH[p].rng}return a}
function towerMod(j,st){const p=wpathOf(j);return Object.assign({},st,{range:Math.max(1,st.range+towerRng(j)),cd:st.cd*(p?WPATH[p].cd:1)*(drumNear(j)?DRUMCD:1),dmg:st.dmg+vetBonus(j)})}
const fireTrapDmg=()=>wxRain()?20:40,gustDist=()=>nightWx()==='kaze'?9:6,waterStunMul=()=>wxRain()?1.5:1;
/* ---------- ヨロイカゲ・ヒカリカゲ ---------- */
function armorMul(e,o){if(EN[e.type]&&EN[e.type].fireRes&&o&&o.dt==='fire')return .5;/* ホテリカゲ：火は半分 */if(!EN[e.type]||!EN[e.type].armor)return 1;const t=o&&o.dt;return t==='arrow'?.5:t==='fire'||t==='poison'||t==='burn'?2:1}
function defWave(list,alv){/* 草原：はじめてオオカゲを追いはらったあと、かげの巣1つでコカゲ+2。平均レベル7から、ヨロイカゲがまじる */if(WD!==0||S.free||!((S.bossKills||0)>0))return;{const n=nestCount();for(let i=0;i<n*NESTADD;i++)list.push('basic')}seasonFoes(list);/* 季節のコワイノ */if(alv<7)return;for(let i=0;i<list.length;i++)if(list[i]==='basic'&&i%7===6)list[i]='armor'}
function shinyAdd(){/* ヒカリカゲ：波の夜に、まれに1ぴき */if(Math.random()>=SHINYP)return 0;const hp=EN.shiny.hp;S.enemies.push({id:S.nid++,type:'shiny',x:0,y:0,hp,max:hp,delay:WAVES[1]+20,side:Math.random()<.5?'w':'e',shiny:1,spawned:false,path:[],repath:0,atk:0,stun:0,flash:0,flee:false});return 1}
function shinyTick(e){if(!e.shiny||e.flee)return false;if(e.sx0==null){e.sx0=e.x;S.flags.shinySeen=1;toast('ヒカリカゲがあらわれた！','good')}if(Math.abs(e.x-e.sx0)>5&&(e.x<1.5||e.x>W-1.5||(fogOn()&&(fogAt((e.y|0)*W+Math.min(W-1,(e.x|0)+1))||fogAt((e.y|0)*W+Math.max(0,(e.x|0)-1)))))){e.dead=true;toast('ヒカリカゲは、行ってしまった');return false}return true}
function shinyGoal(e){/* 来たのと反対のはしへ（行けるいちばん近い所） */const s=e.side==='w'?'e':'w',G=bfsE(e.x|0,e.y|0,40,e.sd||(e.sd=(Math.random()*1e9)|0));let b=-1,bd=1e9;for(let y=0;y<H;y++){const x=sideEdge(y,s);if(x<0)continue;const q=y*W+x;if(G.dist[q]<0)continue;if(G.dist[q]<bd){bd=G.dist[q];b=q}}return b}
function shinyDrop(e){if(!e.shiny)return;const id=Math.random()<.5?'sand':'fukuro';dropAt(e.x,e.y,id,1);toast('ヒカリカゲが、'+(id==='sand'?'やすらぎの砂':'ふしぎなふくろ')+'を落とした！','good')}
/* ---------- コワイノの弱点（属性） ----------
   弱点の属性で攻撃すると、ダメージ1.5倍。水（ダメージなし）は、止める時間1.5倍。見張り台は上に立つせいれい、たたかうせいれいは自分の属性（hurtEn の o.el）。 */
const WEAK={hana:'fire',hoteri:'water',ochiba:'wind',yuki:'fire',fast:'earth',brute:'wind',breaker:'water',trapper:'fire',thief:'wood',rockc:'water',armor:'water',ash:'water'},WEAKMUL=1.5;
const weakMul=(e,o)=>o&&o.el&&WEAK[e.type]===o.el?WEAKMUL:1,weakStun=(e,el)=>WEAK[e.type]===el?WEAKMUL:1;
/* ---------- ベテランの見張り台：追いはらった数（S.dyn[j].vk）で威力が少し上がる ---------- */
const VETN=[50,200,500],VETD=[2,4,6];
function vetBonus(j){const n=(S.dyn[j]&&S.dyn[j].vk)||0;let b=0;for(let i=0;i<VETN.length;i++)if(n>=VETN[i])b=VETD[i];return b}
function vetKill(j){if(j==null||S.obj[j]!=='watch')return;const d=S.dyn[j]||(S.dyn[j]={}),b0=vetBonus(j);d.vk=(d.vk||0)+1;const b1=vetBonus(j);if(b1>b0)toast(BL.watch.name+'がベテランになった（威力+'+b1+'）','good')}
/* ---------- かげの巣（草原、はじめてオオカゲを追いはらったあと） ----------
   朝に30%で、晴れた所の村の外に1つ（3つまで）。1つで、その夜のコワイノ+2。「しらべる」でタップすると、昼にせいれいがこわしにいく（S.dyn[j].nq）。こわすと、やすらぎの砂。 */
const NESTP=.3,NESTMAX=3,NESTADD=2,NESTT=30;
function nestCount(){let n=0;for(let j=0;j<W*H;j++)if(S.obj[j]==='kagenest')n++;return n}
function nestMorning(){if(WD!==0||S.free||!((S.bossKills||0)>0)||Math.random()>=NESTP)return;if(nestCount()>=NESTMAX)return;const R=spawnReach(),C=[];
  for(let j=0;j<W*H;j++){if(S.obj[j]||VILL[j]||S.ground[j]!==0||!walk(j)||R[j]<0||(fogOn()&&fogAt(j))||S.floor&&S.floor[j])continue;C.push(j)}
  if(!C.length)return;const j=C[(Math.random()*C.length)|0];S.obj[j]='kagenest';dirty=true;try{recount()}catch(e){}toast('村の外に、かげの巣ができた','warn')}
function nestTap(j){if(S.obj[j]!=='kagenest')return false;(S.dyn[j]||(S.dyn[j]={})).nq=1;sfx('tfoe');toast('かげの巣：せいれいがこわしにいく');return true}
function nestJob(r,G){if(isNight())return false;let has=false;for(const k in S.dyn)if(S.dyn[k]&&S.dyn[k].nq&&S.obj[+k]==='kagenest'){has=true;break}if(!has)return false;
  const nt=q=>S.obj[q]==='kagenest'&&S.dyn[q]&&S.dyn[q].nq&&free('o'+q,1);const vj=nearest(G,j=>adjOf(j,nt)>=0,9999);if(vj<0)return false;const q=adjOf(vj,nt);startAct(r,G,'nest',vj,{key:'o'+q,obj:q});return true}
function nestBreak(j){if(S.obj[j]!=='kagenest')return;S.obj[j]='';delete S.dyn[j];dirty=true;try{recount()}catch(e){}fxSpr('shadowpop',(j%W+.5)*TS,((j/W|0)+.6)*TS);dropAt(j%W+.5,((j/W)|0)+.5,'sand',1);toast('かげの巣をこわした','good')}
ACT.nest={start(r,a){if(S.obj[a.obj]!=='kagenest')return false;r.bubble='⛏';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;sfxAt('crack',r.x,r.y,1.5)}},done:(r,a)=>a.t>=NESTT||S.obj[a.obj]!=='kagenest'||isNight(),end(r,a){if(a.t>=NESTT&&S.obj[a.obj]==='kagenest'){nestBreak(a.obj);addSpiritXp(1,r)}}};
function drawNest(c,x,y,now){/* かげの巣（コードのドット絵、仮の絵）：地面のこいかげのうずと、ゆれる目 */const P=(dx,dy,w,h,col)=>{c.fillStyle=col;c.fillRect(x+dx,y+dy,w,h)};
  P(6,22,20,6,'rgba(40,20,60,.35)');P(8,14,16,12,'#3b2a52');P(10,12,12,2,'#3b2a52');P(6,18,2,6,'#3b2a52');P(24,18,2,6,'#3b2a52');P(10,16,12,8,'#2a1d46');
  const b=Math.floor(now/400)%6===0;if(!b){P(12,18,2,2,'#ff8aa6');P(18,18,2,2,'#ff8aa6')}P(9,13,2,1,'#5a4878');P(20,12,2,1,'#5a4878')}
/* ---------- オオカゲの段階 ----------
   オオカゲ：体力が半分で、1回だけほえて、そばにコカゲ2ひき・時計の10分だけ速さ1.3倍。ヨルノオオカゲ：半分でコカゲ3びき、4分の1で、いちばん近い柵を1つとびこえる。 */
const RAGET=15,RAGESP=1.3;
function bossCall(e,n){let k=0;for(let i=0;i<12&&k<n;i++){const a=i/12*Math.PI*2,x=e.x+Math.cos(a)*1.5,y=e.y+Math.sin(a)*1.5,j=(y|0)*W+(x|0);if(!walk(j))continue;const hp=EN.basic.hp;S.enemies.push({id:S.nid++,type:'basic',x:(x|0)+.5,y:(y|0)+.5,hp,max:hp,spawned:true,path:[],repath:0,atk:0,stun:0,flash:0,flee:false});if(typeof seaFoeInit==='function')seaFoeInit(S.enemies[S.enemies.length-1]);fxSpr('shock',((x|0)+.5)*TS,((y|0)+.5)*TS,'#5b3f8a');k++}if(S.ns)S.ns.n+=k;return k}
function bossPhase(e){const t=e.type;if(t!=='boss'&&t!=='boss2'||e.dead)return;
  if(!e.ph1&&e.hp<=e.max/2){e.ph1=1;sfx('night');if(typeof shakeScreen==='function')try{shakeScreen('m')}catch(_){}bossCall(e,t==='boss2'?3:2);if(t==='boss')e.rage=S.t+RAGET;toast(EN[t].name+'がほえた！','warn')}
  if(t==='boss2'&&!e.ph2&&e.hp<=e.max/4){e.ph2=1;bossLeap(e)}}
function bossLeap(e){/* いちばん近い柵・塀を1つとびこえる（むこうがわが歩ける所だけ） */let best=null,bd=1e9;const x0=e.x|0,y0=e.y|0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const j=(y0+dy)*W+x0+dx;if(j<0||j>=W*H||!breakable(typeAt(j)))continue;const d=Math.hypot(dx,dy);if(d>=bd||d<.5)continue;const ux=Math.sign(dx),uy=Math.sign(dy),k=j+uy*W+ux;if(!walk(k))continue;bd=d;best=k}
  if(best==null)return;e.x=best%W+.5;e.y=((best/W)|0)+.5;e.path=[];e.repath=0;sfxAt('bonk',e.x,e.y);fxSpr('shock',e.x*TS,e.y*TS,'#120a24');toast(EN[e.type].name+'が柵をとびこえた！','warn')}
const rageMul=e=>e.rage>S.t?RAGESP:1;
/* ---------- 葉のかべ（守り神のわざ。むらのちからの木でパワー300でおぼえる S.flags.leafSkill） ----------
   夜、地面をなぞると、葉のかべ（leafwall、せいれいは通れる・コワイノはこわして通る、じょうぶさ30）が生える。パワー5。のこる時間・つかえない時間は時計の時間（GUP の leaf）。 */
const LEAFLEARN=300,LEAFPT=5;let LEAFARM=false,LEAFDRAG=null,LEAFT=0;
const leafLv=()=>gupLv('leaf'),leafG=()=>gupOf('leaf');
function leafOK(){return !!(S.flags&&S.flags.leafSkill)}
function leafLeft(){return Math.max(0,(S.flags.leafCd||0)-S.t)}
function leafLearn(){if(leafOK())return;if(S.pt<LEAFLEARN){toast(lackPt(LEAFLEARN),'warn');return}S.pt-=LEAFLEARN;PTW.q=true;sfx('power');S.flags.leafSkill=1;if(S.skillSet&&S.skillSet.length<3&&!S.skillSet.includes('leaf'))S.skillSet.push('leaf');toast('守り神が「葉のかべ」をおぼえた！','good');save()}
function leafCellOK(j){return j>=0&&j<W*H&&!S.obj[j]&&walk(j)&&S.ground[j]===0&&!(S.drops||[]).some(d=>d.y*W+d.x===j)}
function leafAdd(j){const L=LEAFDRAG;if(!L)return;const max=leafG().len[leafLv()];if(L.length>=max||L.includes(j))return;if(L.length){const p=L[L.length-1];if(Math.abs(p%W-j%W)+Math.abs(((p/W)|0)-((j/W)|0))!==1)return}if(!leafCellOK(j))return;L.push(j)}
function leafPlace(cells){LEAFARM=false;if(!cells||!cells.length)return;if(!isNight())return toast('葉のかべは、夜だけ');if(leafLeft()>0)return toast('葉のかべは、まだ使えない');if(S.pt<LEAFPT)return toast(lackPt(LEAFPT),'warn');
  S.pt-=LEAFPT;PTW.q=true;const g=leafG(),n=leafLv(),until=S.t+g.dur[n];for(const j of cells){if(!leafCellOK(j))continue;S.obj[j]='leafwall';S.hp[j]=BL.leafwall.hp;(S.dyn[j]||(S.dyn[j]={})).lw=until;burstAt(j%W+.5,((j/W)|0)+.5,'furn');{const k=cells.indexOf(j),fx0=(j%W+.5)*TS,fy0=(((j/W)|0)+.5)*TS;villageTimeout(()=>fxSpr('leafsprout',fx0,fy0),k*60)}/* 葉がはじけて生える（なぞった順に） */}skillFx('leaf');S.flags.leafCd=S.t+g.cd[n];sfx('bush');dirty=true;try{recount()}catch(e){}for(const e of S.enemies)e.repath=0}
function leafTick(){/* のこる時間がすぎた葉のかべを消す。こわされた葉のかべは、直す一覧に入れない */if(S.broken&&S.broken.some(b=>b.id==='leafwall'))S.broken=S.broken.filter(b=>b.id!=='leafwall');let ch=false;for(const k in S.dyn){const d=S.dyn[k];if(!d||d.lw==null)continue;const j=+k;if(S.obj[j]!=='leafwall'){delete d.lw;continue}if(S.t>=d.lw||!isNight()){S.obj[j]='';delete S.dyn[j];delete S.hp[j];fxSpr('twinkle',(j%W+.5)*TS,((j/W|0)+.5)*TS);ch=true}}if(ch){dirty=true;try{recount()}catch(e){}}}
function drawLeafWall(c,x,y,i,now){/* 葉のかべ（コードのドット絵、仮の絵）：こんもりした葉のかたまり */const P=(dx,dy,w,h,col)=>{c.fillStyle=col;c.fillRect(x+dx,y+dy,w,h)};P(4,26,24,4,'rgba(30,60,20,.3)');P(4,10,24,18,'#4f8f3a');P(6,6,20,6,'#5fa646');P(8,4,6,2,'#6fb854');P(18,4,6,2,'#6fb854');P(6,12,4,4,'#7cc25e');P(16,8,4,4,'#7cc25e');P(22,16,4,4,'#7cc25e');P(10,20,4,4,'#3f7a2e');P(20,22,4,4,'#3f7a2e')}
function drawLeafPrev(){if(!LEAFDRAG||!LEAFDRAG.length)return;ctx.save();ctx.globalAlpha=.55;for(const j of LEAFDRAG){ctx.fillStyle='#7cc25e';ctx.fillRect((j%W)*TS+2,((j/W)|0)*TS+2,TS-4,TS-4)}ctx.restore()}
/* ---------- わざの枠（3つまで）：S.skillSet。まもりの光もはずせる ---------- */
const SKILLS=[['light','まもりの光',()=>true,'glight'],['area','こもれびのまもり',()=>!!(S.flags&&S.flags.areaSkill),'shield'],['leaf','葉のかべ',leafOK,'lwall']],SKILLMAX=3;/* 4つめはアイコン（PXI。むらのちからの木の点と同じ） */
function skillSetOf(){const have=SKILLS.filter(s=>s[2]()).map(s=>s[0]);if(!S.skillSet)return have.slice(0,SKILLMAX);return S.skillSet.filter(k=>have.includes(k))}
const skillOn=k=>skillSetOf().includes(k);
function skillToggle(k){let L=skillSetOf().slice();if(L.includes(k))L=L.filter(x=>x!==k);else{if(L.length>=SKILLMAX)return toast('わざは3つまで');L.push(k)}S.skillSet=L;sfx('tap')}
function skillSec(body){const sec=el('<div class="sec"><h3>わざの枠</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');const on=skillSetOf();
  for(const[k,n,ok,ic]of SKILLS){if(!ok())continue;const r=el('<button class="row" style="text-align:left;width:100%">'+pxi(ic,'skic')+'<div class="tx"><b></b><small></small></div></button>');ckSet(r.querySelector('b'),(on.includes(k)?'✓ ':'')+n);r.querySelector('small').textContent=on.includes(k)?'セットしている':'セットしていない';r.onclick=()=>{skillToggle(k);renderSheet()};rw.appendChild(r)}
  body.appendChild(sec)}
/* ---------- 見張り台のねらう順（S.dyn[j].to：near・hp・fast・vill） ---------- */
const TORDER=[['near','近い','いちばん近い「コワイノ」'],['hp','強い','体力がいちばん多い「コワイノ」'],['fast','速い','足がいちばん速い「コワイノ」'],['vill','村に近い','村のまん中にいちばん近い「コワイノ」']];
const torderOf=j=>(j!=null&&S.dyn[j]&&S.dyn[j].to)||'near';
function torderKey(j,e,d){const k=torderOf(j);return k==='hp'?-e.hp:k==='fast'?-EN[e.type].sp:k==='vill'?Math.hypot(e.x-CX,e.y-CY):d}
function torderSet(j,k){(S.dyn[j]||(S.dyn[j]={})).to=k;sfx('tap')}
function torderSec(body,j){const sec=el('<div class="sec"><h3>ねらう順</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows'),cur=torderOf(j);for(const[k,n,t]of TORDER){const r=el('<button class="row" style="text-align:left;width:100%"><div class="tx"><b></b><small></small></div></button>');ckSet(r.querySelector('b'),(cur===k?'✓ ':'')+n);r.querySelector('small').textContent=t;r.onclick=()=>{torderSet(j,k);renderSheet()};rw.appendChild(r)}body.appendChild(sec)}
/* ---------- 落とし穴の罠（pit）：ふんだコワイノは、その夜はもう出てこない（大きいコワイノはのぞく）。1回でつかいおわって穴（S.dyn[j].pu）。昼に土のせいれいが、時計の20分でほりなおす ---------- */
const PITT=30;
function pitStep(e,tj){const d=S.dyn[tj]||(S.dyn[tj]={});if(d.pu||EN[e.type].boss)return false;d.pu=1;sfxAt('wbreak',e.x,e.y);fxSpr('rockbreak',(tj%W+.5)*TS,((tj/W|0)+.6)*TS);defeat(e,EN[e.type].name+'が落とし穴に落ちた！');dirty=true;return true}
function pitJob(r,G){if(isNight()||r.elem!=='earth')return false;const nt=q=>S.obj[q]==='pit'&&S.dyn[q]&&S.dyn[q].pu&&free('o'+q,1);const vj=nearest(G,j=>adjOf(j,nt)>=0,9999);if(vj<0)return false;const q=adjOf(vj,nt);startAct(r,G,'pitfix',vj,{key:'o'+q,obj:q});return true}
ACT.pitfix={start(r,a){if(S.obj[a.obj]!=='pit')return false;r.bubble='⛏';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;sfxAt('crack',r.x,r.y)}},done:(r,a)=>a.t>=PITT||S.obj[a.obj]!=='pit'||isNight(),end(r,a){if(a.t>=PITT&&S.obj[a.obj]==='pit'){const d=S.dyn[a.obj];if(d)delete d.pu;dirty=true;addSpiritXp(1,r)}}};
function drawPit(c,x,y,i){/* 落とし穴（コードのドット絵、仮の絵）：ふたの葉っぱ／あいた穴 */const P=(dx,dy,w,h,col)=>{c.fillStyle=col;c.fillRect(x+dx,y+dy,w,h)};const pu=i!=null&&S.dyn[i]&&S.dyn[i].pu;
  if(pu){P(6,14,20,12,'#3a2a1c');P(8,16,16,8,'#24180f');P(6,12,20,2,'#6b4f33')}else{P(6,16,20,10,'#8a6a44');P(8,14,6,4,'#6fae4f');P(16,18,6,4,'#5f9a3e');P(12,22,8,3,'#7cc25e');P(22,15,3,3,'#6fae4f')}}
/* ---------- 季節のコワイノ（草原、はじめてオオカゲを追いはらったあと、夜に1〜2ひき） ---------- */
const SEASONEN=['hana','hoteri','ochiba','yuki'];
function seasonFoes(list){const t=SEASONEN[seasonNow()];if(!t)return;const n=1+(dayNo()%2);for(let i=0;i<n;i++)list.push(t)}
/* ---------- 守りつづけた夜：けがもこわされた物もない夜がつづくと、はたらく速さ+（S.streak） ---------- */
const STREAKN=[3,7,14],STREAKW=[1,2,3];
function streakWork(){const n=(S&&S.streak)||0;let b=0;for(let i=0;i<STREAKN.length;i++)if(n>=STREAKN[i])b=STREAKW[i];return b}
function streakMorning(){if(!S.ns||!(S.ns.n>0))return;if(!S.nightHurt&&!S.ns.broke){const b0=streakWork();S.streak=(S.streak||0)+1;const b1=streakWork();if(b1>b0)toast('守りつづけて'+S.streak+'晩：はたらく速さ+'+b1,'good')}else S.streak=0}
