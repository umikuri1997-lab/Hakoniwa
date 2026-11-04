'use strict';
/* ---------- 火山のそうび ----------
   S.gear：持っている（だれもつけていない）そうび [{id,lv}]。lv は強化（0〜3）
   r.gear：せいれいがつけているそうび {w:武器, a:防具, c:おまもり, t:専用品}（それぞれ {id,lv}）
   矢は、いままでの矢と同じく S.inv（見張り台がうつ） */
const GSLOT={w:'武器',a:'防具',c:'おまもり',t:'専用品'},GSLOTK=['w','a','c','t'];
const ORE_COL={copper:'#e0a07a',iron:'#bcc4cc',obsidian:'#8f86a8',silver:'#e4eaf0',gold:'#f2d47a',crystal:'#f3a6ac',sulfur:'#ecdf86',bamboo:'#b3d48a',kuru:'#a8d494',chiri:'#d4bf8c',wood:'#d4a878',eda:'#c8a27c',sp:'#f4b06a'};
const GEAR_ORES=['copper','iron','obsidian','silver','gold','sulfur','crystal'];
const isGear=id=>!!(BL[id]&&BL[id].g);
const gearMain=id=>{const b=BL[id];if(b.g.sp)return 'obsidian';return Object.keys(b.mat||{})[0]||'iron'};/* 強化に使う素材（特の物は黒曜石） */
const gearCanUp=id=>{const s=BL[id].g.s;return s==='w'||s==='a'};
const GUPN=[1,2,3];/* 強化 +1・+2・+3 にいる素材の数 */const GUPPC=50;/* +3 のパワー */
function gearList(){return S.gear||(S.gear=[])}
function gearCount(id){let n=0;for(const q of gearList())if(q.id===id)n++;for(const r of S.res)for(const k of GSLOTK)if(r.gear&&r.gear[k]&&r.gear[k].id===id)n++;return n}
/* つけているそうびの効果をまとめる（そうびをかえたときだけ作りなおす） */
const GSC=new WeakMap();
function gearStat(r){if(!r||!r.gear)return GNONE;let c=GSC.get(r);if(c&&c.v===(r.gv||0))return c.s;const s=Object.assign({},GNONE,{job:{}});
  for(const k of GSLOTK){const q=r.gear[k];if(!q||!BL[q.id]||!BL[q.id].g)continue;const g=BL[q.id].g,lv=q.lv||0;
    s.atk+=(g.atk||0)+(g.s==='w'?lv:0);s.rch+=g.rch||0;if(g.hit)s.hit=Math.max(s.hit,g.hit);if(g.iv)s.iv*=g.iv;s.hun+=(g.hun||0)+(g.s==='a'?lv:0);
    for(const m of['mv','flee','rec','fun','work','xp','grow'])if(g[m])s[m]*=g[m];if(g.ns!=null)s.ns=Math.min(s.ns,g.ns);s.cap+=g.cap||0;s.light=Math.max(s.light,g.light||0);s.refl+=g.refl||0;s.wcan+=g.wcan||0;s.prng+=g.prng||0;
    for(const m of['fear','rain','tburn','fburn','nob','glow','burn','kb','slow','stun','steal','aoe','side','crop','stone','dish','pw'])if(g[m])s[m]=1;
    for(const j in g.job||{})s.job[j]=(s.job[j]||1)*g.job[j]}
  if(s.fburn)s.burn=1;GSC.set(r,{v:r.gv||0,s});return s}
function gJob(r,t){return r&&r.gear?gearStat(r).job[t]||1:1}/* 作業ごとの速さ（専用品） */
function gearOK(r,id){const g=BL[id].g;if(g.s==='w'&&r.elem!=='fire')return '武器は火のせいれいだけ';if(g.s==='t'&&g.el!==r.elem)return ELEM[g.el].name+'のせいれいだけ';if(g.s==='ar')return '矢は見張り台で使う';return ''}
function gearChanged(r){r.gv=(r.gv||0)+1;RSC.delete(r)}
function gearEquip(r,i){const L=gearList(),q=L[i];if(!q)return false;const why=gearOK(r,q.id);if(why){toast(why,'warn');return false}const k=BL[q.id].g.s;r.gear=r.gear||{};L.splice(i,1);if(r.gear[k])L.push(r.gear[k]);r.gear[k]={id:q.id,lv:q.lv||0};gearChanged(r);return true}
function gearOff(r,k){if(!r.gear||!r.gear[k])return;gearList().push(r.gear[k]);delete r.gear[k];gearChanged(r)}
function gearDropAll(r){if(!r||!r.gear)return;for(const k of GSLOTK)if(r.gear[k])gearList().push(r.gear[k]);r.gear={};gearChanged(r)}/* いなくなった子のそうびは、もちものにもどる */
function gearUpCost(q){const n=(q.lv||0)+1;return{k:gearMain(q.id),n:GUPN[n-1],pc:n===3?GUPPC:0}}
function gearUp(q){if(!q||!gearCanUp(q.id)||(q.lv||0)>=3)return false;const c=gearUpCost(q);if((S.mat[c.k]||0)<c.n){toast(MATN[c.k]+'が足りません','warn');return false}if(S.pt<c.pc){toast('パワーが足りません','warn');return false}S.mat[c.k]-=c.n;S.pt-=c.pc;if(c.pc){PTW.q=true;sfx('power')}else sfx('level');q.lv=(q.lv||0)+1;for(const r of S.res)if(r.gear)for(const k of GSLOTK)if(r.gear[k]===q)gearChanged(r);toast(BL[q.id].name+'+'+q.lv+'になった','good');return true}
const gearName=q=>BL[q.id].name+(q.lv?'+'+q.lv:'');

/* ---------- コワイノへの、とくべつな効果 ---------- */
const BURNT=3,BURND=.3,SLOWT=3,STUNT=2;/* やけど：3のあいだ、1ごとに0.3へる。おそくする：3・歩く速さ半分。気絶：10%で2止まる */
function gearSpecial(f,e,sx,sy,who){if(!e||e.dead)return;const D=EN[e.type];
  if(f.burn){e.burnU=S.t+BURNT;fxSpr('pebbles',e.x*TS,e.y*TS-10)}
  if(f.slow)e.slowU=S.t+SLOWT;
  if(f.stun&&!D.boss&&Math.random()<.1)e.stun=Math.max(e.stun||0,STUNT);
  if(f.glow)e.glowU=S.t+SLOWT;
  if(f.kb&&!D.boss){let dx=e.x-sx,dy=e.y-sy;const l=Math.hypot(dx,dy)||1;const nx=e.x+dx/l*.6,ny=e.y+dy/l*.6,q=(ny|0)*W+(nx|0);if(nx>1&&ny>1&&nx<W-1&&ny<H-1&&walk(q)&&!HOME_DOORS.has(typeAt(q))&&!GATE_IDS.has(typeAt(q))){e.x=nx;e.y=ny;e.path=[];e.repath=0}}
  if(f.steal&&who)who.hunger=Math.min(hMax(who),who.hunger+1)}
function gearEnemyTick(e,dt){if(e.burnU>S.t&&!e.dead){e.hp-=BURND*dt;if(e.hp<=0){defeat(e);return true}}return false}/* やけど：少しずつへる */
function gearGlowNear(e){if(e.glowU>S.t)return true;for(const r of S.res){if(r.hidden||!r.gear)continue;if(gearStat(r).glow&&Math.hypot(r.x-e.x,r.y-e.y)<=3)return true}return false}
/* 火のせいれいの攻撃のあと：とくべつな効果・横・まわりの敵 */
function gearStrike(r,en,dmg){const s=gearStat(r);if(!r.gear)return;gearSpecial(s,en,r.x,r.y,r);
  if(s.aoe||s.side){const R=s.aoe?1.5+s.rch:1.2;for(const e of S.enemies){if(e===en||!e.spawned||e.dead)continue;const d=s.aoe?Math.hypot(e.x-r.x,e.y-r.y):Math.hypot(e.x-en.x,e.y-en.y);if(d>R||fenceBetween(r.x,r.y,e.x,e.y))continue;e.hp-=dmg*s.hit;e.flash=6;gearSpecial(s,e,r.x,r.y,r);if(e.hp<=0)defeat(e,r.name+'が'+EN[e.type].name+'を追いはらった！',r)}}}
/* たたかれたとき：はね返し・ふれたらやけど */
function gearHurt(e,r){if(!r.gear||e.dead)return;const s=gearStat(r);if(s.refl){e.hp-=s.refl;e.flash=6}if(s.tburn)e.burnU=S.t+BURNT;if(e.hp<=0)defeat(e,r.name+'が'+EN[e.type].name+'を追いはらった！',r)}
/* ---------- 見張り台の矢 ---------- */
const AMMO=['arrow','arrow2',...GEAR_ARROWS];
const ammoG=id=>id==='arrow'?{dmg:0}:id==='arrow2'?{dmg:1}:BL[id].g;
function ammoTotal(){return AMMO.reduce((n,id)=>n+(S.inv[id]||0),0)}
function ammoPick(){let b=null,bd=-1;for(const id of AMMO){if(!(S.inv[id]>0))continue;const d=ammoG(id).dmg;if(d>bd){bd=d;b=id}}return b}/* 威力の大きい矢から使う */
/* 見張り台が1回うつ：矢の本数・つらぬき・まわり。うった数をかえす */
function towerVolley(j,x,y,st,g,shots0){const id=ammoPick();if(!id)return 0;S.inv[id]--;const a=ammoG(id),rng=st.range+(a.rng||0);const L=[];for(const e of S.enemies){if(!e.spawned||e.dead)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<rng)L.push([d,e])}if(!L.length){S.inv[id]++;return 0}L.sort((p,q)=>p[0]-q[0]);
  const n=a.n||1,dm=st.dmg+(a.dmg||0),hits=[];for(let i=0;i<n;i++)hits.push(L[i%L.length][1]);
  for(const tg of hits){const T=[tg];if(a.pierce){let b=null,bd=2.5;for(const[,e]of L){if(e===tg)continue;const v=[tg.x-x,tg.y-y],w=[e.x-x,e.y-y],t=(v[0]*w[0]+v[1]*w[1])/(Math.hypot(...v)||1);if(t<Math.hypot(...v))continue;const off=Math.abs(v[0]*w[1]-v[1]*w[0])/(Math.hypot(...v)||1);if(off<bd){bd=off;b=e}}if(b)T.push(b)}/* つらぬき：うしろの1ぴきにも */
    for(const e of T){if(e.dead)continue;e.hp-=dm;e.flash=6;gearSpecial(a,e,x,y,g);shots0.push({x1:x,y1:y-1.9,x2:e.x,y2:e.y-.3,life:1,wood:true})}
    if(a.spl)for(const e of S.enemies){if(e===tg||!e.spawned||e.dead)continue;if(Math.hypot(e.x-tg.x,e.y-tg.y)<1.5){e.hp-=dm;e.flash=6;gearSpecial(a,e,x,y,g)}}}
  for(const e of S.enemies)if(e.spawned&&!e.dead&&e.hp<=0)defeat(e);
  return a.iv||1}
/* ---------- 夜の明かり（そうび） ---------- */
function gearLightAt(x,y){if(!isNight())return false;for(const r of S.res){if(r.hidden||!r.gear)continue;const R=gearStat(r).light;if(R&&(r.x-x)**2+(r.y-y)**2<R*R)return true}return false}
function gearLights(dmx){for(const r of S.res){if(r.hidden||!r.gear)continue;const R=gearStat(r).light;if(!R)continue;const P=R*TS+16;dmx.drawImage(lightSpr(P),r.x*TS-P,r.y*TS-12-P,P*2,P*2)}}
/* ---------- 入手 ---------- */
function gearGive(id,n){if(BL[id].kind==='ammo'){S.inv[id]=(S.inv[id]||0)+(n||1)*(BL[id].qty||10);return}for(let i=0;i<(n||1);i++)gearList().push({id,lv:0})}
function gearRand(fish){const L=GEAR_IDS.filter(id=>!(fish&&BL[id].g.nf));return pick(L)}
function gearFind(r,title){const id=gearRand(title==='つりあげた！');gearGive(id,1);if(r){r.bubble='✨';addFloat(r.x,r.y-1.8,BL[id].name)}queueItemGift({[id]:1},title);return id}
function gearOffer(r){const L=GEAR_IDS.filter(id=>BL[id].g.sp);const id=pick(L);gearGive(id,1);addFloat(r.x,r.y-1.8,'レア！');toast(r.name+'が「'+BL[id].name+'」をおそなえした！','good');queueItemGift({[id]:1},'うけとった！');return true}
/* 鉱脈・岩をほったときの鉱石（火山） */
function oreNear(j){const x=j%W,y=(j/W)|0;return CRACKS.some(c=>Math.hypot(c%W-x,((c/W)|0)-y)<=10)}
function mineOre(r,j,tgt){if(VEINS[tgt]){addMat(r,VEINS[tgt],1);return true}if(WD!==1||tgt!=='rock'||!oreNear(j))return false;const q=Math.random();if(q<.03)addMat(r,'crystal',1);else if(q<.13)addMat(r,'sulfur',1);return false}/* ひびわれのそば：硫黄10%・赤い水晶3% */
/* 火山の岩の一部を、鉱脈にする（マスで決まる） */
function placeVeins(s){for(let j=0;j<W*H;j++){if(s.obj[j]!=='rock')continue;const x=j%W,y=(j/W)|0;if(Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7)continue;const h=hash(j*131+57);s.obj[j]=h<.10?'vcopper':h<.16?'viron':h<.20?'vobsid':h<.23?'vsilver':h<.24?'vgold':'rock'}}
/* はじめての鉱石で、そうびのレシピを思いつく（火山だけ） */
function gearIdea(){if(!S||S.free||WD!==1)return;const got=k=>(S.gotMat&&S.gotMat[k]>0)||(S.mat[k]||0)>0;if(!GEAR_ORES.some(got))return;S.recipes||(S.recipes={});S.guardianIdeas||(S.guardianIdeas={});const nw={};
  for(const id of GEAR_IDS){const b=BL[id];if(b.g.sp||S.recipes[id])continue;if(Object.keys(b.mat).every(k=>!GEAR_ORES.includes(k)||got(k))){S.recipes[id]=true;S.guardianIdeas[id]=true;nw[id]=1}}
  const ks=Object.keys(nw);if(ks.length){sfx('level');queueItemGift(nw,'あたらしいレシピ！',true);memo('💡','そうびのレシピ：'+ks.length+'こ')}}
/* 毎朝：金のメダル */
function gearMorning(){for(const r of S.res)if(r.gear&&gearStat(r).pw){S.pt+=1;S.totalPt=(S.totalPt||0)+1}}
/* ---------- ドット絵（16×16 のマス目、1マス9ドット＝144） ---------- */
const GPIX={
 w:['............ooo.','...........ohho.','..........ohmo..','.........ohmo...','........ohmo....','.......ohmo.....','......ohmo......','..oo.ohmo.......','..ommhmo........','...omdo.........','...owdmo........','..owwo.oo.......','.owwo...........','owwo............','owo.............','oo..............'],
 ar:['..........oooo..','..........ohmo..','...........ohmo.','..........ohmmo.','.........owo.oo.','........owo.....','.......owo......','......owo.......','.....owo........','....owo.........','.oooo...........','.ohho...........','..oho...........','..o.o...........','................','................'],
 a:['................','..ooo......ooo..','.ohhmo....ohmmo.','.ohmmmooooommmo.','..ommhhhhhhmmo..','..omhmmmmmmmmo..','..omhmmmmmmmmo..','..omhmmmmmmmdo..','..ommmmmmmmmdo..','..ommmmmmmmmdo..','..ommmmmmmmddo..','...ommmmmmmdo...','...ommmmmmddo...','....oddddddo....','.....oooooo.....','................'],
 c:['......oooo......','.....o....o.....','....o......o....','....o......o....','.....o....o.....','......oooo......','.....ohhmmo.....','....ohhmmmmo....','....ohmmmmmo....','....ommmmmdo....','....ommmmddo....','.....odddo......','......ooo.......','................','................','................'],
 t:['................','.....oooooo.....','....ohhhmmmo....','....ohmmmmmo....','.....oommoo.....','.......om.......','......owwo......','......owwo......','......owwo......','......owwo......','......owwo......','......owwo......','......owwo......','.......oo.......','................','................'],
 ore:['................','................','................','......oooo......','....oohhmmoo....','...ohhmmmmmmo...','..ohmmmmmmmmmo..','..ommmmhmmmmdo..','..ommmmmmmmddo..','...ommmmmmddo...','....oodddddo....','......oooo......','................','................','................','................']};
function shade(h,k){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1):v*k)));return 'rgb('+f(r)+','+f(g)+','+f(b)+')'}
function pixDraw(c,rows,col,x,y,u){const P={o:shade(col,.72),m:col,h:shade(col,1.45),d:shade(col,.86),w:'#c99a68'};for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){const ch=rows[j][i];if(ch==='.')continue;c.fillStyle=ch==='w'&&col===ORE_COL.wood?'#a97c50':P[ch];c.fillRect(x+i*u,y+j*u,u,u)}}
const GICON={};
function gearColor(id){const b=BL[id];if(b.g.sp)return ORE_COL.sp;const k=Object.keys(b.mat).find(k=>GEAR_ORES.includes(k))||Object.keys(b.mat)[0];return ORE_COL[k]||ORE_COL.iron}
function pixURL(key,rows,col){if(GICON[key])return GICON[key];const c=document.createElement('canvas');c.width=c.height=144;const g=c.getContext('2d');g.imageSmoothingEnabled=false;pixDraw(g,rows,col,0,0,9);const u=c.toDataURL();c.width=c.height=0;return GICON[key]=u}
const gearIcon=id=>pixURL(id,GPIX[BL[id].g.s],gearColor(id));
/* 鉱脈の絵：岩に、鉱石の色の粒（ドット） */
const VSPK=[[9,14],[16,12],[13,19],[20,18],[7,21],[17,23]];
function drawVein(c,id,x,y,i){drawObj(c,'rock',x,y,i);const col=ORE_COL[VEINS[id]],X=Math.round(x),Y=Math.round(y);for(const[a,b]of VSPK){c.fillStyle=shade(col,.72);c.fillRect(X+a-1,Y+b-1,4,4);c.fillStyle=col;c.fillRect(X+a,Y+b,2,2)}}
for(const k of GEAR_ORES){ICONS[k]=pixURL('ore:'+k,GPIX.ore,ORE_COL[k]);const im=new Image();im.onload=()=>{im.ok=1};im.src=ICONS[k];ICI[k]=im}/* 鉱石の素材アイコン */

/* ---------- 画面：せいれいの「そうび」タブ ---------- */
function gearUpBtn(q,after){const b=el('<button class="btn"></button>');if(!gearCanUp(q.id)||(q.lv||0)>=3){b.textContent=(q.lv||0)>=3?'+3':'強化なし';b.disabled=true;return b}const c=gearUpCost(q);b.textContent='強化 '+MATN[c.k]+c.n+(c.pc?'・'+SP(c.pc):'');b.disabled=(S.mat[c.k]||0)<c.n||S.pt<c.pc;b.onclick=e=>{e.stopPropagation();if(gearUp(q))after()};return b}
function gearRow(q,sub){const r=rowEl(gearName(q),'',gearIcon(q.id));r.querySelector('small').textContent=sub||BL[q.id].desc;r.style.alignItems='center';return r}
function gearSheet(body,r){const sec=el('<div class="sec"></div>');
  for(const k of GSLOTK){if(k==='w'&&r.elem!=='fire')continue;const q=r.gear&&r.gear[k];const h=el('<b style="display:block;margin-top:6px"></b>');h.textContent=GSLOT[k];sec.appendChild(h);
    if(q){const row=gearRow(q);const ob=el('<button class="btn">はずす</button>');ob.onclick=()=>{sfx('tap');gearOff(r,k);renderSheet()};row.appendChild(gearUpBtn(q,renderSheet));row.appendChild(ob);sec.appendChild(row)}
    else{const p=el('<p class="note" style="margin:2px 0"></p>');p.textContent='なし';sec.appendChild(p)}
    gearList().forEach((g2,i)=>{if(BL[g2.id].g.s!==k||gearOK(r,g2.id))return;const row=gearRow(g2),b=el('<button class="btn pri">つける</button>');b.onclick=()=>{sfx('tap');gearEquip(r,i);renderSheet()};row.appendChild(b);sec.appendChild(row)})}
  if(!gearList().length&&!GSLOTK.some(k=>r.gear&&r.gear[k])){const p=el('<p class="note"></p>');p.textContent='そうびは、ありません';sec.appendChild(p)}
  body.appendChild(sec)}
/* 依頼ボードの「そうび」：わくごとに見出し。さいごに強化 */
function gearBoardHead(id,prev){const s=BL[id].g&&BL[id].g.s;if(!s||s==='ar'||(prev&&BL[prev].g&&BL[prev].g.s===s))return null;const h=el('<b style="display:block;margin:6px 0 2px"></b>');h.textContent=GSLOT[s];return h}
function gearBoardUp(box){const L=[];for(const q of gearList())if(gearCanUp(q.id))L.push([q,'']);for(const r of S.res)for(const k of['w','a'])if(r.gear&&r.gear[k])L.push([r.gear[k],r.name]);if(!L.length)return;const h=el('<b style="display:block;margin:8px 0 2px"></b>');h.textContent='強化';box.appendChild(h);for(const[q,who]of L){const row=gearRow(q,who?who+'がつけている':BL[q.id].desc);row.appendChild(gearUpBtn(q,renderSheet));box.appendChild(row)}}
/* もちもの：そうび */
function gearInv(body){const L=gearList();if(!L.length)return;const g=el('<div class="grid"></div>'),hd=el('<b style="grid-column:1/-1;margin-top:8px"></b>');hd.textContent='そうび';g.appendChild(hd);for(const q of L){const b=el('<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');b.querySelector('img').src=gearIcon(q.id);b.querySelector('.nm').textContent=gearName(q);b.querySelector('.ct').textContent=GSLOT[BL[q.id].g.s];g.appendChild(b)}body.appendChild(g)}
