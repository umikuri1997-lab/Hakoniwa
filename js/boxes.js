/* ---------- 箱ごとの中身 ----------
   BOX()[j]：箱（家具のマス・かべかけは壁のマス）ごとの中身 {物:数}。食べ物は 'f:'+id、素材は素材の id。
   S.boxF[j]：その箱に入れる物 {food:1, mat:1, it:{物:1}}。なにもなければ、なんでも入る。
   PIL()：箱に入りきらない物。神殿のまえに置いてある（せいれいが、あいた箱へ運ぶ）。
   S.rsv：建てる・作る・炉・コンポスター・おたきあげのために、とっておいた数（まだ箱の中にある）。
   S.mat・S.fs は「使える数」＝箱と神殿のまえの合計 − とっておいた数。
   S.mat などを、じかにふやした・へらした分は、boxSync があわせる（ふえた分はあいた箱へ、入らなければ神殿のまえへ。へった分は神殿のまえ → 箱からへらす）。 */
const BOXCAP={crate:80,taru:60,kabebukuro:55,asabukuro:65,makidana:200,shelf1:160,shelf2:200,wshelf:200,cabinet:90};/* しまえる数 */
const BOXONLY={makidana:{wood:1,eda:1}};/* その物しか入らない家具 */
const PILE=-1,fkey=k=>'f:'+k,isFK=k=>k.charCodeAt(0)===102&&k.charCodeAt(1)===58,itemKeyName=k=>isFK(k)?(FOODS[k.slice(2)]||{}).name||k:MATN[k]||k;
let BOXL=[];const RSV=()=>S.rsv||(S.rsv={}),BOX=()=>S.box||(S.box={}),PIL=()=>S.pile||(S.pile={});/* 箱のマス（recount で作る） */
function boxTypeAt(k){if(k<0||k>=W*H)return '';const a=anc(k),id=S.obj[a];if(HOME_WALLS.has(id)){const w=(S.win||{})[a];return BOXCAP[w]?w:''}return BOXCAP[id]?id:''}
function boxScan(){BOXL=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(BOXCAP[o])BOXL.push(j)}for(const k in S.win||{}){const j=+k;if(BOXCAP[S.win[k]]&&HOME_WALLS.has(S.obj[j]))BOXL.push(j)}}
const pileJ=()=>STATUE>=0?STATUE:RUINT;
const bx=j=>{if(j===PILE)return PIL();const B=BOX();return B[j]||(B[j]={})};
function boxCapAdd(){let add=0;const got=new Set();for(const I of SPOTI||[])if(I.sp.cap&&!got.has(I.sp.k)){got.add(I.sp.k);add+=I.sp.cap}return add}/* しまうスポット：おなじスポットは1こ分、ちがうスポットはたし算 */
const boxCap=j=>Math.floor((BOXCAP[boxTypeAt(j)]||0)*(1+boxCapAdd()));
function boxUsed(j){const b=BOX()[j];let n=0;if(b)for(const k in b)n+=b[k];return n}
function boxOK(j,key){/* その箱に、この物を入れてよいか */const O=BOXONLY[boxTypeAt(j)];if(O&&!O[key])return false;const F=(S.boxF||{})[j];if(!F||!(F.food||F.mat||F.it&&Object.keys(F.it).length))return true;if(isFK(key)?F.food:F.mat)return true;return !!(F.it&&F.it[key])}
function boxCat(j,food){/* その箱に、食べ物（素材）のどれかを入れてよいか（その物しか入らない家具は、数えない） */if(BOXONLY[boxTypeAt(j)])return false;const F=(S.boxF||{})[j];if(!F||!(F.food||F.mat||F.it&&Object.keys(F.it).length))return true;if(food?F.food:F.mat)return true;for(const k in F.it||{})if(isFK(k)===food)return true;return false}
const boxRoom=(j,key)=>boxOK(j,key)?Math.max(0,boxCap(j)-boxUsed(j)):0;
function boxHas(j,key){const b=j===PILE?PIL():BOX()[j];return b?b[key]||0:0}
function roomFor(food){/* 食べ物（素材）を、あといくつしまえるか */let n=0;for(const j of BOXL)if(boxCat(j,food))n+=Math.max(0,boxCap(j)-boxUsed(j));return n}
function totKey(key){let n=boxHas(PILE,key);for(const j of BOXL)n+=boxHas(j,key);return n}
const availOf=key=>isFK(key)?S.fs[key.slice(2)]||0:S.mat[key]||0;
function availAdd(key,n){if(isFK(key)){const k=key.slice(2);S.fs[k]=Math.max(0,(S.fs[k]||0)+n);syncFood()}else S.mat[key]=Math.max(0,(S.mat[key]||0)+n)}
function bput(j,key,n){if(n<=0)return;const b=bx(j);b[key]=(b[key]||0)+n}
function btake(j,key,n){const b=j===PILE?PIL():BOX()[j];if(!b||!b[key])return 0;const t=Math.min(n,b[key]);b[key]-=t;if(b[key]<=0)delete b[key];return t}
const distJ=(a,b)=>a<0||b<0?0:Math.abs(a%W-b%W)+Math.abs(((a/W)|0)-((b/W)|0));
function rsvNeed(){/* とっておく数：建てる所・依頼のまだ運んでいない素材と、炉・コンポスター・おたきあげのたのまれた分 */const R={},add=(key,n)=>{if(n>0)R[key]=(R[key]||0)+n};
  for(const k in S.dyn){if(S.obj[k]!=='site')continue;const d=S.dyn[k];if(!d||!d.mat)continue;if(d.bid==null)d.bid='s'+k;const m=needLeft(d);for(const key in m)add(key,m[key])}
  for(const o of S.orders||[]){if(!o.mat&&!o.food)continue;if(o.bid==null)o.bid='o'+o.id;const m=needLeft(o);for(const key in m)add(key,m[key])}
  for(const Q of[S.cmpQ,S.smQ])for(const j in Q||{})for(const k in Q[j])add(k,Q[j][k]);for(const k in S.otakiQ||{})add(k,S.otakiQ[k]);return R}
function boxSync(){if(!S)return;S.box=S.box||{};S.pile=S.pile||{};S.rsv=S.rsv||{};
  for(const k in S.box){const j=+k;if(!boxTypeAt(j)||!BOXL.includes(j))boxSpill(j)}/* なくなった箱の中身は、その場所に落とす */
  for(const k in S.boxF||{})if(!boxTypeAt(+k))delete S.boxF[k];
  const R=rsvNeed(),keys=new Set(Object.keys(R));for(const k in S.mat)if(MATN[k])keys.add(k);for(const k in S.fs)keys.add(fkey(k));for(const k in S.rsv)keys.add(k);for(const k in PIL())keys.add(k);for(const j of BOXL)for(const k in BOX()[j]||{})keys.add(k);
  const pj=pileJ();
  for(const key of keys){let d=availOf(key)+(S.rsv[key]||0)-totKey(key);
    if(d>0){/* じかにふえた分：あいた箱（神殿に近い順）へ。入らなければ神殿のまえ */const L=BOXL.filter(j=>boxRoom(j,key)>0).sort((a,b)=>distJ(a,pj)-distJ(b,pj));for(const j of L){if(d<=0)break;const t=Math.min(d,boxRoom(j,key));bput(j,key,t);d-=t}if(d>0)bput(PILE,key,d)}
    else if(d<0){/* じかにへった分：神殿のまえ → 中身の多い箱から */d=-d;d-=btake(PILE,key,d);const L=BOXL.filter(j=>boxHas(j,key)>0).sort((a,b)=>boxHas(b,key)-boxHas(a,key));for(const j of L){if(d<=0)break;d-=btake(j,key,d)}}
    const t=totKey(key),rv=Math.min(R[key]||0,t);/* とっておく数は、いつも数えなおす（建てる所がなくなった など） */if(rv>0)S.rsv[key]=rv;else delete S.rsv[key];
    const a=t-rv;if(isFK(key))S.fs[key.slice(2)]=a;else S.mat[key]=a}
  syncFood();for(const k in S.box)if(!Object.keys(BOX()[k]).length&&!BOXL.includes(+k))delete BOX()[k]}
function boxSpill(j){/* 箱がなくなった：中身は、その場所の地面に落とす（せいれいが、ほかの箱へ運ぶ） */const b=BOX()[j];delete BOX()[j];if(!b)return;const x=j%W,y=(j/W)|0;
  for(const key in b){const n=b[key];if(!(n>0))continue;let a=Math.min(n,availOf(key));availAdd(key,-a);const r=n-a;if(r>0&&S.rsv[key])S.rsv[key]=Math.max(0,S.rsv[key]-r);
    const before=(S.drops||[]).length;dropAt(x,y,(isFK(key)?'food:'+key.slice(2):'mat:'+key),n);if(S.drops&&S.drops.length>before)S.drops[S.drops.length-1].tap=1}}
function boxMove(from,to){/* ひっこしミトン：中身と入れる物もいっしょに */if(from===to)return;if(S.box&&BOX()[from]){BOX()[to]=BOX()[from];delete BOX()[from]}if(S.boxF&&S.boxF[from]){S.boxF[to]=S.boxF[from];delete S.boxF[from]}}
/* ---- せいれいが、箱にしまう・箱から出す（箱とその数を、いっしょにかえる） ---- */
function boxIn(j,key,n){/* 箱 j にしまう。入った数をかえす */const t=Math.min(n,boxRoom(j,key));if(t<=0)return 0;bput(j,key,t);availAdd(key,t);return t}
function boxOut(j,key,n){/* 箱 j から、使える物を出す */const t=Math.min(n,boxHas(j,key),availOf(key));if(t<=0)return 0;btake(j,key,t);availAdd(key,-t);return t}
function boxOutR(j,key,n){/* 箱 j から、とっておいた物を出す（足りなければ、使える物も） */const has=boxHas(j,key),r=RSV()[key]||0,t=Math.min(n,has,r+availOf(key));if(t<=0)return 0;btake(j,key,t);const fr=Math.min(t,r);if(fr){RSV()[key]=r-fr;if(RSV()[key]<=0)delete RSV()[key]}if(t>fr)availAdd(key,-(t-fr));return t}
function rsvAdd(m,food){/* とっておく（使える数からへらす。物は箱にのこる） */for(const k in m||{}){const key=food?fkey(k):k,n=m[k];if(!(n>0))continue;const a=Math.min(n,availOf(key));availAdd(key,-a);RSV()[key]=(RSV()[key]||0)+a}}
function rsvFree(m,food){/* とっておくのをやめる（使える数にもどす） */for(const k in m||{}){const key=food?fkey(k):k,n=Math.min(m[k]||0,(RSV()||{})[key]||0);if(!(n>0))continue;RSV()[key]-=n;if(RSV()[key]<=0)delete RSV()[key];availAdd(key,n)}}
/* ---- となりの箱をさがす ---- */
function boxSide(j,k){/* マス j から箱 k をつかえるか（かべかけの物は、壁の正面＝すぐ下のマスからだけ） */const a=anc(k);return !(HOME_WALLS.has(S.obj[a])&&(S.win||{})[a])||a===j-W}
function putAdj(j,keys){/* マス j のとなりの、keys のどれかを入れられる箱（なければ -1） */return adjOf(j,k=>boxTypeAt(k)&&boxSide(j,k)&&keys.some(key=>boxRoom(anc(k),key)>0))}
function getAdj(j,keys,pile){/* マス j のとなりの、keys のどれかが入っている箱（pile：神殿のまえもさがす） */return adjOf(j,k=>{const a=anc(k);if(pile!==false&&a===pileJ()&&a>=0)return keys.some(key=>boxHas(PILE,key)>0);return boxTypeAt(k)&&boxSide(j,k)&&keys.some(key=>boxHas(a,key)>0)})}
const boxIdOf=k=>{const a=anc(k);return a===pileJ()&&!boxTypeAt(k)?PILE:a};
const FOODKEYS=()=>Object.keys(FOODS).map(fkey),foodIn=()=>Object.keys(S.fs).filter(k=>S.fs[k]>0).map(fkey);
const carryKeys=r=>Object.keys(r.carry&&typeof r.carry==='object'?r.carry:r.carry?{mugi:1}:{}).map(fkey),cmatKeys=r=>Object.keys(r.cmat||{});
const anyBox=j=>adjOf(j,k=>!!boxTypeAt(k)&&boxSide(j,k));
/* ---- 建てる・作るために、とっておいた素材を運ぶ ---- */
function needLeft(t){/* t：建てる所の S.dyn か、依頼。まだ運んでいない素材 {key:数} */const m={};const need=t.mat||{},got=t.got||{};for(const k in need){const n=need[k]-(got[k]||0)-carryFor(t,k);if(n>0)m[k]=n}const fn=t.food||{};for(const k in fn){const key=fkey(k),n=fn[k]-(got[key]||0)-carryFor(t,key);if(n>0)m[key]=n}return m}
function carryFor(t,key){let n=0;for(const r of S.res)if(r.bm&&r.bm.t===t.bid&&r.bm.m[key])n+=r.bm.m[key];return n}
const needKeys=t=>Object.keys(needLeft(t)),hasNeed=t=>needKeys(t).length>0;
function deliver(r,t){/* 運んできた素材を、建てる所・依頼にわたす */if(!r.bm||r.bm.t!==t.bid)return;const g=t.got||(t.got={});for(const k in r.bm.m)g[k]=(g[k]||0)+r.bm.m[k];r.bm=null}
function bmDrop(r){/* 運んでいた素材の行き先がなくなった：もちものの素材としてしまいにいく */if(!r.bm)return;for(const key in r.bm.m){const n=r.bm.m[key];if(isFK(key)){r.carry=r.carry&&typeof r.carry==='object'?r.carry:{};const k=key.slice(2);r.carry[k]=(r.carry[k]||0)+n}else{r.cmat=r.cmat||{};r.cmat[key]=(r.cmat[key]||0)+n}}r.bm=null}
function bmTargets(){/* 素材を運ぶのを待っている所（建てる所・依頼） */const L=[];for(let j=0;j<W*H;j++){if(S.obj[j]!=='site')continue;const d=S.dyn[j];if(!d)continue;if(d.bid==null)d.bid='s'+j;if(hasNeed(d))L.push(d)}for(const o of S.orders||[]){if(o.bid==null)o.bid='o'+o.id;if(hasNeed(o))L.push(o)}return L}
function siteNeed(j){const d=S.dyn[j];if(!d||S.obj[j]!=='site')return false;if(d.bid==null)d.bid='s'+j;return hasNeed(d)}
function gotDrop(t,j){/* 建てるのをやめた：運びこんだ素材は、その場所に落とす */const g=t.got||{};const x=j%W,y=(j/W)|0;for(const key in g){const n=g[key];if(!(n>0))continue;const before=(S.drops||[]).length;dropAt(x,y,isFK(key)?'food:'+key.slice(2):'mat:'+key,n);if(S.drops&&S.drops.length>before)S.drops[S.drops.length-1].tap=1}t.got={}}
function siteRefund(t,j){/* 建てる所・依頼をやめた：とっておいた分はもどし、運んだ分は落とす */const left={},fl={},m=needLeft(t);for(const key in m){if(isFK(key))fl[key.slice(2)]=m[key];else left[key]=m[key]}rsvFree(left);rsvFree(fl,true);for(const r of S.res)if(r.bm&&r.bm.t===t.bid)bmDrop(r);if(j!=null&&j>=0)gotDrop(t,j)}
function eatAdj(j){/* マス j のとなりの、食べ物が入っている箱（神殿のまえもふくむ） */return adjOf(j,k=>{const a=anc(k),t=boxTypeAt(k),b=t?(boxSide(j,k)?BOX()[a]:null):a>=0&&a===pileJ()?PIL():null;if(!b)return false;for(const key in b)if(b[key]>0&&isFK(key))return true;return false})}
function boxEat(j){/* 箱 j の食べ物 {id:数}（食べられる数） */const b=j===PILE?PIL():BOX()[j],o={};if(b)for(const key in b)if(isFK(key)&&b[key]>0){const k=key.slice(2),n=Math.min(b[key],S.fs[k]||0);if(n>0)o[k]=n}return o}
function keysAdj(j,keys){/* マス j のとなりの、keys のどれかが入っている箱（神殿のまえもふくむ） */return adjOf(j,k=>{const a=anc(k),t=boxTypeAt(k),b=t?(boxSide(j,k)?BOX()[a]:null):a>=0&&a===pileJ()?PIL():null;if(!b)return false;for(const key of keys)if(b[key]>0)return true;return false})}
function cgLeft(r,R){/* 料理の材料で、まだ持っていない分 {id:数} */const g=r.cgot&&r.cgot.rec===R.out?r.cgot.m:{},m={};for(const k in R.need){const n=R.need[k]-(g[k]||0);if(n>0)m[k]=n}return m}
function cgBack(r){/* 料理をやめた：持っていた材料は、箱へもどす */if(!r.cgot)return;for(const k in r.cgot.m)addFood(k,r.cgot.m[k]);r.cgot=null}
function toHand(r,m){/* 運んでいた素材の行き先がなくなった：せいれいが持ったまま、箱へしまいにいく */for(const k in m||{})if(m[k]>0){r.cmat=r.cmat||{};r.cmat[k]=(r.cmat[k]||0)+m[k]}}
function qPick(Q,j){/* たのまれた分（とっておいた素材）を、箱 j からとる。とれた分をかえし、Q からへらす */const got={};for(const k of Object.keys(Q)){const n=boxOutR(j,k,Q[k]);if(n>0){got[k]=n;Q[k]-=n;if(Q[k]<=0)delete Q[k]}}return got}
function qStale(Q){/* たのまれた素材が、もうどの箱にもない：とっておくのをやめる */if(!Q)return true;for(const k in Q)if(totKey(k)>0)return false;rsvFree(Q);return true}
function bmTarget(bid){/* 運ぶ先（建てる所の S.dyn か、依頼） */if(typeof bid!=='string')return null;if(bid[0]==='s'){const j=+bid.slice(1);return S.obj[j]==='site'&&S.dyn[j]?S.dyn[j]:null}const id=+bid.slice(1);return (S.orders||[]).find(o=>o.id===id)||null}
const bmFetching=bid=>S.res.some(q=>q.act&&q.act.type==='bfetch'&&q.act.tb===bid);
function needReady(t){/* まだ運んでいない素材が、どこかの箱（神殿のまえ）にある */for(const key of needKeys(t))if(totKey(key)>0)return true;return false}
function fetchFor(r,G,t){/* 建てる所・依頼の素材を、箱へとりにいく */const ks=needKeys(t).filter(k=>totKey(k)>0);if(!ks.length)return false;const j=nearest(G,q=>keysAdj(q,ks)>=0,9999);if(j<0)return false;startAct(r,G,'bfetch',j,{tb:t.bid});return r.act&&r.act.type==='bfetch'}
function haulWant(){/* 神殿のまえの物を、あいた箱へ運ぶ */if(isNight()||pileJ()<0||!PIL())return false;for(const k in PIL())if(PIL()[k]>0&&availOf(k)>0&&BOXL.some(j=>boxRoom(j,k)>0))return true;return false}
function haulJob(r,G){if(!haulWant()||heldN(r)>0||r.bm)return false;if(S.res.filter(q=>q!==r&&q.act&&q.act.type==='haul').length>=2)return false;const pj=pileJ(),j=nearest(G,q=>adjOf(q,k=>anc(k)===pj)>=0,300);if(j<0)return false;startAct(r,G,'haul',j,{});return r.act&&r.act.type==='haul'}
const HAULN=10;/* 神殿のまえから、1回に運ぶ数 */
function boxCapTot(){let n=0;for(const j of BOXL)n+=boxCap(j);return n}/* 村ぜんぶの、しまえる数 */
function boxMigrate(s){/* 食料箱・素材箱を木箱にまとめ、箱ごとの中身にした（box1）。1回だけ */if(!s.flags||s.flags.box1)return;s.flags.box1=1;
  for(let j=0;j<s.obj.length;j++)if(s.obj[j]==='stor'||s.obj[j]==='mbox')s.obj[j]='crate';
  const iv=s.inv||{};for(const k of['stor','mbox'])if(iv[k]){iv.crate=(iv.crate||0)+iv[k];delete iv[k]}
  if(s.recipes&&(s.recipes.stor||s.recipes.mbox))s.recipes.crate=true;
  for(const b of s.broken||[])if(b.id==='stor'||b.id==='mbox')b.id='crate';
  for(const o of s.orders||[]){if(o.type==='stor'||o.type==='mbox')o.type='crate';const b=BL[o.type];if(b&&!o.mat){o.mat=Object.assign({},b.mat||{});o.food=Object.assign({},b.food||{});const g={};for(const k in o.mat)g[k]=o.mat[k];for(const k in o.food)g[fkey(k)]=o.food[k];o.got=g}}/* 前の依頼は、もう素材をはらってある */
  for(const k in s.dyn||{}){if(s.obj[k]!=='site')continue;const d=s.dyn[k];if(d&&d.mat&&!d.got)d.got=Object.assign({},d.mat)}/* 前の建てる所も */
  for(const Q of[s.cmpQ,s.smQ])for(const j in Q||{})for(const k in Q[j])s.mat[k]=(s.mat[k]||0)+Q[j][k];for(const k in s.otakiQ||{})s.mat[k]=(s.mat[k]||0)+s.otakiQ[k];/* 前は、たのんだときにへらしていた：箱にもどして、とっておく */
  s.box={};s.pile={};s.rsv={}}
function roomKey(key){/* この物を、あといくつしまえるか */let n=0;for(const j of BOXL)n+=boxRoom(j,key);return n}
