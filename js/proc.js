/* ---------- 加工（粉ひき小屋・はたおり機・水車） ----------
   PROC：加工の家具ごとの、入れる物（ins）・1こ作るのに入れる数（n。物ごとにちがう数は nk）・できる物（out）・加工するせいれいの属性（el。その属性のせいれいがいなければ、だれでも）・1こ作る時間（T）・たのめる数（cap）。
   S.prQ[j]：たのまれて、箱から運ぶのを待つ物（箱のキー。たのんだときに、とっておく rsvAdd）。r.ppk：運んでいる物 {j,m}。
   S.prIn[j]：入った物。せいれいが n こずつ加工して、できた物を持って箱へしまう。
   水車（suisha）のまわり5マス（NEARSUI）の加工の家具は、せいれいがいなくても動く（S.prW[j]：進みぐあい）。できた物は S.prOut[j] にたまり、せいれいが箱へ運ぶ。 */
const GRASSKEYS=['shina','kasa','kuru','chiri','funba'];
const PROC={mill:{ins:['f:mugi'],n:2,out:'f:komugiko',el:'earth',T:45,cap:10,verb:'ひく',ask:'粉ひきをたのんだ'},/* こむぎ2こで、こむぎこ1こ。1こ30分 */
  loom:{ins:[...GRASSKEYS,'wool'],n:3,nk:{wool:2},out:'nuno',el:'wind',T:60,Tk:40,cap:10,verb:'おる',ask:'はたおりをたのんだ'}};/* 草3こか、わた毛2こで、布1こ。1こ40分。風の強い日（S.today==='kaze'）は Tk：1こ27分 */
const prT=P=>S&&S.today==='kaze'&&P.Tk?P.Tk:P.T;/* 1こ作る時間 */
const prN=(P,k)=>P.nk&&P.nk[k]||P.n;/* その物を、1こ作るのに入れる数 */
const prName=key=>itemKeyName(key);
const prOf=f=>S[f]||(S[f]={});
const suiOn=j=>{const a=anc(j),z=BL[S.obj[a]]&&BL[S.obj[a]].sz||[1,1];for(let b=0;b<z[1];b++)for(let c=0;c<z[0];c++)if(NEARSUI.has(a+b*W+c))return true;return false};/* 水車のまわり5マスにあるか（2×2は、どこかのマスが入っていれば） */
const procOK=(r,o)=>{const P=PROC[o];return !!P&&(r.elem===P.el||elemCount(P.el)===0)};/* 加工するのは、その属性のせいれい（いなければ、だれでも） */
function prCount(j){/* 入った・運ぶのを待つ・運んでいる物で、あといくつ作るか */const P=PROC[S.obj[j]];if(!P)return 0;let n=0;for(const f of['prIn','prQ']){const m=(S[f]||{})[j];if(m)for(const k in m)n+=Math.floor(m[k]/prN(P,k))}for(const r of S.res)if(r.ppk&&r.ppk.j===j)for(const k in r.ppk.m)n+=Math.floor(r.ppk.m[k]/prN(P,k));return n}
const prReady=j=>{const P=PROC[S.obj[j]],d=(S.prIn||{})[j];return P&&d?Object.keys(d).find(k=>d[k]>=prN(P,k))||null:null};
function prRefund(m){for(const k in m||{})if(m[k]>0)availAdd(k,m[k])}
function procTick(dt){/* 家具がなくなったら、運ぶまえ・入れた・できた物は箱へもどす。水車のそばは、ひとりでに加工する */
  for(const f of['prQ','prIn','prOut']){const Q=S[f];if(!Q)continue;for(const k in Q)if(!PROC[S.obj[k]]){if(f==='prQ')rsvFree(Q[k]);else prRefund(Q[k]);delete Q[k];if(S.prW)delete S.prW[k]}}
  if(!S.prIn||!NEARSUI.size)return;
  for(const k in S.prIn){const j=+k,P=PROC[S.obj[j]];if(!P||!suiOn(j))continue;const key=prReady(j);if(!key){if(S.prW)delete S.prW[j];continue}const W0=prOf('prW');W0[j]=(W0[j]||0)+dt;if(W0[j]<prT(P))continue;W0[j]-=prT(P);
    const d=S.prIn[j];d[key]-=prN(P,key);if(!d[key])delete d[key];if(!Object.keys(d).length){delete S.prIn[j];delete W0[j]}const o=prOf('prOut'),q=o[j]||(o[j]={});q[P.out]=(q[P.out]||0)+1;if(!MEMRUN)spawnFX(j%W+.5,((j/W)|0)+.8,'#cfe8ff')}}
function prLit(j){return S.res.some(r=>r.act&&r.act.type==='proc'&&r.act.obj===j&&r.act.stage==='do')||!!((S.prW||{})[j]>0&&suiOn(j))}/* 加工しているあいだ */
function prHand(r,m){/* できた物・運んでいた物を、せいれいが持つ（食べ物は carry、素材は cmat） */for(const key in m){const n=m[key];if(!(n>0))continue;if(isFK(key)){const k=key.slice(2);if(typeof r.carry==='number')r.carry={mugi:r.carry};r.carry=r.carry||{};r.carry[k]=(r.carry[k]||0)+n;r.carryLast=k}else{r.cmat=r.cmat||{};r.cmat[key]=(r.cmat[key]||0)+n}}}
function procWant(r){if(isNight())return false;if(r.ppk||S.prQ&&Object.keys(S.prQ).length)return true;if(S.prOut&&Object.keys(S.prOut).length&&roomN(r)>0)return true;return !!S.prIn&&Object.keys(S.prIn).some(j=>PROC[S.obj[j]]&&!suiOn(+j)&&prReady(+j)&&procOK(r,S.obj[j])&&jobFor(+j,r)&&workOK(+j))}
function procJob(r,G){if(isNight())return false;let j;const near=sj=>workStand(G,sj);/* 作業するマス（その向きの前）に立つ */
  if(r.ppk){const sj=r.ppk.j;if(!PROC[S.obj[sj]]){prHand(r,r.ppk.m);r.ppk=null;return false}j=near(sj);if(j>=0){startAct(r,G,'pput',j,{obj:sj});return true}return false}/* 運んでいる物を、先に入れる */
  if(S.prIn)for(const sj of Object.keys(S.prIn).map(Number)){const o=S.obj[sj];if(!PROC[o]||suiOn(sj)||!prReady(sj)||!procOK(r,o)||!free('pr'+sj,1)||!jobFor(sj,r))continue;j=near(sj);if(j>=0){startAct(r,G,'proc',j,{key:'pr'+sj,obj:sj});return true}}/* 加工する */
  if(S.prOut&&roomN(r)>0)for(const sj of Object.keys(S.prOut).map(Number)){if(!PROC[S.obj[sj]]||!free('po'+sj,1))continue;const out=Object.keys(S.prOut[sj]);if(!out.some(k=>putAdjAny(k)))continue;j=near(sj);if(j>=0){startAct(r,G,'pget',j,{key:'po'+sj,obj:sj});return true}}/* 水車でできた物を、箱へ運ぶ */
  const Q=S.prQ||{},sj=Object.keys(Q).map(Number).find(c=>!S.res.some(q=>q!==r&&q.act&&q.act.type==='ppick'&&q.act.sj===c));if(sj==null)return false;if(qStale(Q[sj])){delete Q[sj];return false}const sk=Object.keys(Q[sj]);j=nearest(G,q=>keysAdj(q,sk)>=0,200);if(j>=0){startAct(r,G,'ppick',j,{sj});return true}return false}
const putAdjAny=key=>BOXL.some(b=>boxRoom(b,key)>0);/* どこかの箱に入るか */
Object.assign(ACT,{
  ppick:{start(r,a){if(!S.prQ||!S.prQ[a.sj])return false;a.box=keysAdj(a.stand,Object.keys(S.prQ[a.sj]));if(a.box<0)return false;faceTo(r,a.box);r.bubble='';},done:(r,a)=>a.t>=4,end(r,a){const Q=S.prQ&&S.prQ[a.sj];if(!Q)return;const m=qPick(Q,boxIdOf(a.box),Math.max(1,roomN(r)));/* 1回に持てる数まで */if(!Object.keys(Q).length)delete S.prQ[a.sj];if(Object.keys(m).length)r.ppk={j:a.sj,m}}},/* 加工する物を、箱からとる */
  pput:{start(r,a){if(!r.ppk)return false;r.bubble='';faceTo(r,a.obj)},done:(r,a)=>a.t>=4,end(r,a){const p=r.ppk;r.ppk=null;if(!p)return;if(!PROC[S.obj[p.j]]){prHand(r,p.m);return}const d=prOf('prIn'),q=d[p.j]||(d[p.j]={});for(const k in p.m)q[k]=(q[k]||0)+p.m[k];}},/* 加工の家具に入れる */
  proc:{start(r,a){const o=S.obj[a.obj],P=PROC[o];if(!P||suiOn(a.obj))return false;a.k=prReady(a.obj);if(!a.k)return false;r.bubble='';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);a.p=(a.p||0)+dt*(rMul(r,'work')+nareAdd(r,a));},done:(r,a)=>{const P=PROC[S.obj[a.obj]];return !P||a.p>=prT(P)},
    end(r,a){const P=PROC[S.obj[a.obj]];if(!P||(a.p||0)<prT(P))return;const d=(S.prIn||{})[a.obj];if(!d||(d[a.k]||0)<prN(P,a.k))return;d[a.k]-=prN(P,a.k);if(!d[a.k])delete d[a.k];if(!Object.keys(d).length)delete S.prIn[a.obj];prHand(r,{[P.out]:1});addFloat(r.x,r.y-1.6,prName(P.out)+'+1','#ffe8c0');sfxAt('good',r.x,r.y);addSpiritXp(1,r)}},/* せいれいが加工する（できた物は持って箱へ） */
  pget:{start(r,a){const m=(S.prOut||{})[a.obj];if(!m)return false;r.bubble='';faceTo(r,a.obj)},done:(r,a)=>a.t>=4,end(r,a){const m=(S.prOut||{})[a.obj];if(!m)return;let n=roomN(r);const got={};for(const k of Object.keys(m)){const t=Math.min(n,m[k]);if(t<=0)continue;got[k]=t;m[k]-=t;n-=t;if(!m[k])delete m[k]}if(!Object.keys(m).length)delete S.prOut[a.obj];prHand(r,got);}}});/* 水車でできた物を、とる */
Object.assign(ACT_LBL,{ppick:'加工する物をはこんでいる',pput:'加工する物を入れている',proc:'加工している',pget:'できた物をとっている'});
function prPop(j){/* 粉ひき小屋・はたおり機：作る数を、入れる物の種類ごとにえらぶと、せいれいが箱から運んで加工する */j=anc(j);const o=S.obj[j],P=PROC[o];if(!P)return;const V={};
  const box=el('<div id="prPop" style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div class="ks"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn jb">せいれいをきめる</button><button class="btn pri go"></button></div></div></div>');
  box.querySelector('.jb').onclick=()=>{sfx('tap');box.remove();openSheet('furn',j)};
  const has=k=>availOf(k),room=()=>Math.max(0,P.cap-prCount(j)),sum=()=>P.ins.reduce((a,k)=>a+(V[k]||0),0),can=k=>Math.floor(has(k)/prN(P,k));
  const rows=P.ins.filter(k=>can(k)>0).map(k=>{const r=el('<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:6px"><span class="nm" style="flex:1"></span><button class="btn m">－</button><b class="v" style="min-width:2.4em;text-align:center"></b><button class="btn p">＋</button></div>');r.querySelector('.m').onclick=()=>{sfx('notch');V[k]=Math.max(0,(V[k]||0)-1);upd()};r.querySelector('.p').onclick=()=>{sfx('notch');if(sum()<room()&&(V[k]||0)<can(k))V[k]=(V[k]||0)+1;upd()};box.querySelector('.ks').appendChild(r);return[k,r]});
  const upd=()=>{box.querySelector('.t').textContent=BL[o].name;const out=(S.prOut||{})[j],w=out?Object.keys(out).reduce((a,k)=>a+out[k],0):0;box.querySelector('.n').textContent=prName(P.out)+'を'+P.verb+'（'+prCount(j)+'/'+P.cap+'）'+(w?'・できた物（'+w+'）':'');for(const[k,r]of rows){r.querySelector('.nm').textContent=prName(P.out)+'（'+prName(k)+(V[k]||0)*prN(P,k)+'/'+has(k)+'）';r.querySelector('.v').textContent=V[k]||0;r.querySelector('.m').disabled=!(V[k]>0);r.querySelector('.p').disabled=sum()>=room()||(V[k]||0)>=can(k)}const g=box.querySelector('.go');g.textContent=P.verb;g.disabled=!sum()};
  box.querySelector('.x').onclick=()=>{sfx('tap');box.remove()};box.onclick=e=>{if(e.target===box)box.remove()};
  box.querySelector('.go').onclick=()=>{if(!sum())return;const Q=prOf('prQ'),q=Q[j]||(Q[j]={});for(const k of P.ins){const t=Math.min((V[k]||0)*prN(P,k),has(k));if(t>0){rsvAdd({[k]:t});q[k]=(q[k]||0)+t}}sfx('quest');toast(P.ask,'good');box.remove()};
  if(!workOK(j)){const p=el('<p class="note"></p>');p.textContent='前がふさがっています';box.querySelector('.ks').appendChild(p)}
  if(!rows.length){const p=el('<p class="note"></p>');p.textContent=prName(P.ins[0])+(P.ins.length>1?'など':'')+'が足りません';box.querySelector('.ks').appendChild(p)}
  upd();($('#app')||document.body).appendChild(box)}
/* ---- アイコン（16×16のドット絵。gear.js の pixURL・pixDraw）。布は3Dから写した絵（tools/art/nuno3d、ICONS） ---- */
const PRPIX={
 komugiko:['................','................','......oooo......','.....owwwwo.....','......omdo......','.....ohmmmo.....','....ohhmmmmo....','...ohmmmmmmdo...','...ohmmmmmmdo...','...ommmmmmmdo...','...ommmmmmddo...','...ommmmmdddo...','....oddddddo....','.....oooooo.....','................','................'],
 dango:['.......ww.......','......oooo......','.....ohhmmo.....','.....ommmdo.....','......oddo......','......oooo......','.....ohhmmo.....','.....ommmdo.....','......oddo......','......oooo......','.....ohhmmo.....','.....ommmdo.....','......oddo......','.......ww.......','.......ww.......','................'],
 tamasand:['................','................','.......ww.......','......whhw......','.....whhhhw.....','....whhhhhhw....','...whhhhhhhhw...','..wwwwwwwwwwww..','..ommmmmmmmmmo..','..oddddddddddo..','..wwwwwwwwwwww..','..whhhhhhhhhhw..','..wwwwwwwwwwww..','................','................','................'],
 milkshake:['................','..........w.....','.........w......','.....hhhwhh.....','....hhhhhhhh....','....oooooooo....','....ommmmmho....','....ommmmmho....','.....ommmho.....','.....ommmho.....','.....ommmho.....','......omho......','......oddo......','.....oddddo.....','.....oooooo.....','................'],
 berrymilk:['................','.......oo.......','......oddo......','.....hhddhh.....','....hhhhhhhh....','....oooooooo....','....ommmmmho....','....ommmmmho....','.....ommmho.....','.....ommmho.....','.....ommmho.....','......omho......','......oddo......','.....oddddo.....','.....oooooo.....','................'],
 pancake:['................','................','................','.......hh.......','......hhhh......','...wwwwwwwwww...','..ohhhhhhhhhho..','..ommmmmmmmmmo..','..oddddddddddo..','..ohhhhhhhhhho..','..ommmmmmmmmmo..','..oddddddddddo..','..ohhhhhhhhhho..','..ommmmmmmmmmo..','...oddddddddo...','................']};
const PRCOL={komugiko:'#efe6d4',dango:'#f2d2c8',tamasand:'#f2dc8c',milkshake:'#f4e6c4',berrymilk:'#f0c6d6',pancake:'#e8bc78'};
for(const k in PRPIX){ICONS[k]=pixURL('pr:'+k,PRPIX[k],PRCOL[k]);const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS[k];ICI[k]=im}
EMO_IC['🥣']='komugiko';EMO_IC['🍡']='dango';EMO_IC['🥪']='tamasand';EMO_IC['🥛']='milkshake';EMO_IC['🍓']='berrymilk';EMO_IC['🥞']='pancake';/* 食べ物の字（FOODS の e）は、アイコンのキーとしてだけ使う */
