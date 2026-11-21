/* 料理・もの作りの手ざわり：進みぐあいで動きをかえる・手に持つ物・動きに合わせた音と粒・できたらかかげる。
   動きの絵は spirit3d（cookprep・cookcut・cookmix・cook・cookfry・cookfan・cookgrill・cookplate・raise・craftprep・saw・craft・polish、作業台の上では wbprep・wbsaw・wbham・wbpolish）。
   音と粒は、描くときの時刻（drawSpiritDot の t）と同じ時刻で、動きの決まった所（WBEAT）をこえたときに出す（手の動きとずれない）。 */
const WORKSHOW=4;
const WBWORKZ=12.5;/* wbwork の絵は作業台の天板の上（絵の下のはしが g64 の31）。地面に置くときは、マスの奥行き0.72（g64 の56）まで下げる：(56－31)÷2 */const WBUP=5,WBBACK=14;/* 作業台のうしろに立つ向き（2）は、台のほうへ14点よせて、台ごしに手もとが天板にとどくようにする *//* 作業台は、マスの中で10ドット（g64）上に置く。作業台で作るせいれいも、同じだけ（ゲームの5点）上に立つ *//* できたらかかげる時間（せいれいの時間。1倍で約1.6秒） */
/* 料理の作り方（かまど・たき火）。調理台の料理は、ぜんぶ「まぜる」。はじめの料理は KSTYLE、ほかは料理の絵のしゅるい（COOKD の ic）と家具できめる（KSTYIC） */
const KSTYLE={soup:'pot',fishsoup:'pot',pancake:'pan',yakizakana:'pan',kabayaki:'pan',bread:'bake',yakiimo:'bake',foil:'bake',kushiyaki:'grill'};
const KSTYIC={bowl:'pot',cup:'pot',skewer:'grill',bread:'bake',cake:'pan',plate:'pan',dango:'pan',salad:'pot',sand:'pan'};
const KMAIN={pot:'cook',pan:'cookfry',bake:'cookfan',grill:'cookgrill',mix:'cookmix'};
/* 動きの名前 → [音を出す所（1回の動きの中の0〜1）, 音, 粒]。音のいちばん大きい所が、手の動きの決まった所（打つ・ひく・水にとどく）になるように、音の頭のぶん前から鳴らす（のこぎりは、ひくまん中・石をほる音は、録音の0.15秒あとが打つ音） */
const WBEAT={cookcut:[[0,'tonton']],cook:[[0,'potclk']],cookmix:[[.25,'tink']],cookstir:[[.25,'tink']],cookfry:[[.47,'fry'],[.62,'fry']],cookfan:[[.25,'fanw','embers']],cookgrill:[[0,'grill','embers']],cookplate:[[.5,'plate']],
  loomweave:[[.3,'shuttle'],[.8,'loombeat']],millgrind:[[0,'grind'],[.5,'grind']],saw:[[.37,'saw','chips'],[.87,'saw']],craft:[[0,'nail','chips']],polish:[[0,'cloth'],[.5,'cloth']],
  wbsaw:[[.37,'saw','chips'],[.87,'saw']],wbham:[[0,'nail','chips']],build:[[0,'bnail']],repair:[[0,'nail']],
  chop:[[.8,'chop','chips']],mine:[[.59,'mine1','pebbles']],draw:[[.4,'dscoop','splash'],[.56,'dlift']],/* 水くみは1回だけ：バケツが水に入る所・ひき上げる所（draw の動きは、くむ行動の進みぐあい 'ph'） */
  eat_drink:[[.32,'@eat']],eat_bread:[[.3,'@eat']],eat_fruit:[[.3,'@eat']],eat_meal:[[.3,'@eat']],/* 食べる・のむ：かじる・のむ所で、食べている物の音（@eat → eatSnd） */wbpolish:[[0,'cloth'],[.5,'cloth']],
  till:[[.85,'wtill']],sow:[[.12,'wsoil'],[.62,'wsoil']],plant:[[.12,'wsoil'],[.62,'wsoil']],harvest:[[.12,'wleaf'],[.62,'wleaf']],gather:[[.12,'wleaf'],[.62,'wleaf']],weed:[[.6,'wweed']],sweep:[[.25,'wsweep'],[.75,'wsweep']]};/* 水やり（water・tend）は、とぎれない音（pourKeep） */
const WBMO={craftprep:'wbprep',saw:'wbsaw',craft:'wbham',polish:'wbpolish'};/* 作業台の上でする、もの作りの動き */
function cookStyle(r){const a=r.act;if(!a||!r.cing)return'mix';if(a.tb)return'mix';const R=typeof recOf==='function'?recOf(r.cing.rec):null,out=R?R.out:r.cing.rec;if(KSTYLE[out])return KSTYLE[out];const D=typeof COOKDI!=='undefined'&&COOKDI[out],t=D&&D.ic&&D.ic[0];let st=KSTYIC[t]||'pot';if(st==='bake'&&S.obj[a.obj]==='campfire')st='pan';return st}/* ふしぎな料理は、なべ */
function cookP(r){const a=r.act;if(!a||a.obj==null)return 0;return Math.min(1,(a.t||0)/Math.max(1,cookTime(r,a.obj)))}
function craftOrder(r){return r.act&&r.act.type==='craft'?S.orders.find(q=>q.id===r.act.order):null}
function craftP(r){const o=craftOrder(r);return o?Math.min(1,o.prog/Math.max(1,o.need)):0}
/* いまの動き（料理・もの作りでないときは、行動の名前のまま） */
function workAnim(r){const a=r.act;if(!a)return'';
  if(a.type==='cook'){const ph=cookPh(r);if(ph==='raise')return'raise';if(ph!=='work')return'cookprep';/* 材料をならべる・できた料理を台にととのえる */const t=cookTool(r);return t==='board'?'cookcut':t==='pot'?'cook':CKSTIR.has(t)?(typeof SPM!=='undefined'&&SPM.cookstir?'cookstir':'cookmix'):'cookfan'}/* 置いた道具にあわせた動き（なべは、おたまでまぜる。フライパン・天板・網・くしは、うちわであおぐ） */
  if(a.type==='craft'){if(a.sh!=null)return'raise';const p=craftP(r),nm=p<.1?'craftprep':p<.45?'saw':p<.85?'craft':'polish',o=craftOrder(r),wb=WBMO[nm];return o&&o.cs!=null&&S.obj[o.cs]==='wbench'&&typeof SPM!=='undefined'&&SPM[wb]?wb:nm}/* 作業台では、天板の高さで手を動かす（wb*）。作業台がないときは、地面の動き */
  if(a.type==='proc'){const o=S.obj[a.obj];return o==='loom'?'loomweave':o==='mill'?'millgrind':'proc'}/* はたおり・粉ひき */
  if(a.stage==='do'&&(TAKEACT.has(a.type)||PUTACT.has(a.type))){const h=boxReach(a);if(h&&typeof SPM!=='undefined'&&SPM[h])return h}/* 箱の高さに合わせて、とる・しまう */
  return a.type}
/* 手に持つ物の絵（材料・できた料理・作った物） */
function workFood(r){const a=r.act;if(!a||a.stage!=='do')return'';
  if(a.type==='cook'&&r.cing){const ph=cookPh(r),R=recOf(r.cing.rec);if(!R)return'';if(ph==='prep')return foodEmo(Object.keys(R.need)[0]);if(ph==='raise')return FOODS[R.out]?foodEmo(R.out):'';return''}/* もりつけた料理は台の上。かかげるときに持ち上げる */
  if(a.type==='craft'&&a.sh!=null){const o=craftOrder(r)||a.made;return o?itemIc(o.type||o):''}
  return''}
/* 料理の家具の上の物（絵は tools/art/furn3d/cooktop.py、場所は cook-top-data.js の CKTOP）
   材料をならべる（prep）→ 作る（work：道具と材料）→ もりつける（plate：できた料理が家具の上）→ かかげる（raise：せいれいが持ち上げる。家具の上はなし） */
const CKTB={salad:'board',sand:'board',plate:'board',bowl:'bowl',cup:'pitcher',dango:'knead',marine:'board',salad0:'board',tamasand:'board',berryjuice:'pitcher',applejuice:'pitcher',milkshake:'pitcher',berrymilk:'pitcher'},CKSTIR=new Set(['bowl','pitcher','knead']);
const CKING=new Set(['mugi','imo','tomato','berry','apple','egg','milk','fish','takenoko','kinoko','komugiko']);
function cookPh(r){const a=r.act;if(!a||!r.cing)return'';if(a.sh!=null)return'raise';const p=cookP(r);return p<.12?'prep':p<.88?'work':'plate'}
function cookTool(r){/* 家具に置く道具：調理台は料理のしゅるい、かまど・たき火は作り方（cookStyle） */const a=r.act,id=a&&S.obj[a.obj],R=r.cing&&recOf(r.cing.rec);if(!R)return'';
  if(id==='cooktable'){const D=COOKDI[R.out],t=D&&D.ic?D.ic[0]:R.out==='salad'?'salad0':R.out;return CKTB[t]||'board'}
  const st=cookStyle(r);if(id==='oven')return st==='pot'?'pot':st==='pan'?'pan':'tray';return st==='pot'?'pot':st==='grill'?'K':'net'}
function cookTopD(i){/* できた料理を置く所（世界のドット）。湯気を出す所 */if(S.obj[i]==='oven'&&rotAt(i))return null;const id=S.obj[i],v=id==='cooktable'?(rotAt(i)===3?1:rotAt(i)):0,T=typeof CKTOP!=='undefined'&&(CKTOP[id]||[])[v];if(!T||!T.D)return null;const p=T.D[0];return [(i%W)*TS+p[0]/2,((i/W)|0)*TS+p[1]/2-liftOf(i)]}
function cookAt(i){for(const r of S.res){const a=r.act;if(a&&a.type==='cook'&&a.obj===i&&a.stage==='do'&&r.cing)return r}return null}
function cookTopDraw(c,id,x,y,i,now){/* 家具の絵のあとに、上の物をかさねる */const r=cookAt(i);if(!r||!window.CHIPS||typeof CKTOP==='undefined')return;const ph=cookPh(r),R=recOf(r.cing.rec);if(!R||ph==='raise')return;
  const rot=id==='campfire'?0:rotAt(i);if(id==='oven'&&rot)return;/* かまどの道具・材料の場所は、前向きの口だけ（ほかの向きは口が見えない・横を向く） */const fl=id==='cooktable'&&rot===3,v=id==='cooktable'?(rot===3?1:rot):0,T=(CKTOP[id]||[])[v];if(!T)return;
  const put=(nm,px,py)=>{const ch=CHIPS[nm];if(ch)drawChip(c,ch,nm,x+(fl?64-px:px)/2,y+py/2,now,i)},sf=v?'>'+v:'';
  if(ph==='plate'){const p=T.D[0];put('ckdish_'+(/^fsg/.test(R.out)?'fsg':R.out),p[0],p[1]);return}
  const t=cookTool(r);if(t!=='K'){const ch=CHIPS['cktool_'+id+'_'+(t==='board'&&ph==='prep'?'boardk':t)+sf];if(ch)drawChip(c,fl?{src:ch,ax:ch.ax,ay:ch.ay,w:ch.w,h:ch.h,f:ch.f,flip:1,fw:32}:ch,'cktool',x,y,now,i)}
  const ks=Object.keys(R.need).map(k=>CKING.has(k)?k:'fish'),hold=ph==='prep'?0:-1,sl=id==='cooktable'?'L':t,P=T[sl];if(!P||!ks.length)return;const sz=sl==='L'?'L':sl==='K'?'K':'S',L=[];
  for(let q=0;q<P.length;q++){if(sl!=='K'&&(q>=ks.length||q===hold))continue;L.push([P[q],ks[q%ks.length]])}/* くしは3本（材料を順に） */
  L.sort((a,b)=>a[0][1]-b[0][1]);for(const[p,k]of L)put('ckin_'+k+'.'+sz,p[0],p[1])}
/* 作業台の上の形（0 板の山・1 木のわく・2 布をかけた形）。素材がそろうまでは、なし（運んだ素材の山） */
function wbworkStage(o){if(!o||hasNeed(o))return -1;if(S.res.some(r=>r.act&&r.act.type==='craft'&&r.act.sh!=null&&r.act.order===o.id))return -1;/* できてかかげているあいだは、台の上の物をなくす（手に持っているので） */const p=o.prog/Math.max(1,o.need);return p<.45?0:p<.85?1:2}
/* 音と粒：描くたびに、動きの決まった所をこえたら出す */
/* 箱などから取り出す・置く：その物のほうを向き（boxFace）、しゃがんで手をのばす動き（spirit3d の store）。
   動きは行動のはじめから（boxActT：せいれいの時間 a.t。1倍で1秒＝2.5）。音は、取る・置くのあいだ、ゴソゴソ（SAMPLES.goso）を、切った所をかえながらつなげて鳴らす（boxLoop）。 */
const TAKEACT=new Set(['bfetch','fetch','cgrab','cpick','otakiget','sasaget','spick','apick','ppick','haul','cget','acol','pget']);
const PUTACT=new Set(['store','smat','sitem','ydrop','cput','aput','sput','pput']);

/* 寝ている（nap）・場面で止められている（onHold）子は、動きが進まないので、取る・置くの動きと音にしない（寝ているあいだ、ゴソゴソが鳴りつづけた） */
function boxAct(r){const a=r.act;return a&&!r.nap&&!(typeof onHold==='function'&&onHold(r))&&a.stage==='do'&&(TAKEACT.has(a.type)||PUTACT.has(a.type))?a:null}
/* 寝ている（nap）・場面で止められている（onHold）子は、動きが進まないので、取る・置くの動きと音にしない（寝ているあいだ、ゴソゴソが鳴りつづけた） */
function boxActT(r){const a=boxAct(r);return a?(a.t||0)/MIN_PER_SEC:null}
/* 取る・置く物の高さ：上から入れる物（ふちが顔の高さ）は背のびして storeh、前から入れる家具は胸の高さへ storem、地面の物（神殿のまえの山・材料置き場など）は、しゃがむ store */
const BOXHI=new Set(['crate','taru','asabukuro','kabebukuro','composter']),BOXMID=new Set(['makidana','shelf1','shelf2','wshelf','cabinet','smelter','loom','mill','coop','barn','obox']);
function boxReach(a){const t=boxTarget(a);if(t<0)return'';const id=boxTypeAt(t)||S.obj[anc(t)];return BOXHI.has(id)?'storeh':BOXMID.has(id)?'storem':''}
function boxTarget(a){return a.box!=null&&a.box>=0?a.box:a.obj!=null&&a.obj>=0?a.obj:-1}
function boxFace(r,a){/* 向く先のとなりのマスの向き（-W・-1・1・W）。なければ 0 */const t=boxTarget(a);if(t<0)return 0;const c=(r.y|0)*W+(r.x|0),at=anc(t);for(const d of[-W,-1,1,W]){const k=c+d;if(k<0||k>=W*H||Math.abs(k%W-c%W)>1)continue;if(k===t||anc(k)===at&&S.obj[k])return d}const dx=t%W-c%W,dy=(t/W|0)-(c/W|0);return Math.abs(dx)>=Math.abs(dy)?(dx<0?-1:dx>0?1:0):(dy<0?-W:W)}
/* ゴソゴソをつなげて鳴らす：描くたびに boxBeat が、その子を見たことにする。boxLoopTick が、近い子から BOXLOOPN 人ぶんだけ鳴らし、
   見えなくなった・おわった・村の時間が止まったら、すっと小さくして止める。音のファイルは1まわり（BOXLOOPL 秒）を3つならべた形。
   同じ1まわりをくりかえすと、くりかえしがすぐわかるので、録音のどこかから短く切った所（BOXGR 秒）を、高さ・大きさを少しずつかえて、
   かさねながらつなげて鳴らす（前と近い所はえらばない）。ときどき、手を止めたような小さな間（BOXGAPP）をはさむ */
const BOXLOOPL=1.0337,BOXLOOPN=2,BOXLOOPV=.0675,BOXGR=[.28,.72],BOXGF=.07,BOXGAPP=.18,BOXGAP=[.08,.3],GOSOL=new Map();
function boxBeat(r,t){const a=boxAct(r);if(!a||t==null)return;let e=GOSOL.get(r);if(!e||e.a!==a){if(e)e.a=a;else{e={a,seen:0};GOSOL.set(r,e)}}e.seen=performance.now();e.x=r.x;e.y=r.y}
function boxLoopStop(e,t){if(!e.src)return;e.g.gain.cancelScheduledValues(t);e.g.gain.setTargetAtTime(0,t,.06);for(const s of e.src.gr){try{s.stop(t+.4)}catch(_){}}e.src=null}
function boxGrain(e,buf){/* 1つぶんを e.nt から鳴らし、つぎの時刻を e.nt に */const len=buf.duration,d=BOXGR[0]+Math.random()*(BOXGR[1]-BOXGR[0]),rate=.9+Math.random()*.2,lo=.05,hi=Math.max(lo,len-d-.05);
  let off=lo+Math.random()*(hi-lo);for(let k=0;k<6&&e.lo!=null&&Math.abs(off-e.lo)%BOXLOOPL<.3;k++)off=lo+Math.random()*(hi-lo);e.lo=off;/* 1まわりの中で前と近い所はさける */
  const s=AC.createBufferSource(),v=AC.createGain(),w=Math.max(e.nt,AC.currentTime),real=d/rate,pk=.65+Math.random()*.35;s.buffer=buf;s.playbackRate.value=rate;
  v.gain.setValueAtTime(0,w);v.gain.linearRampToValueAtTime(pk,w+BOXGF);v.gain.setValueAtTime(pk,w+real-BOXGF);v.gain.linearRampToValueAtTime(0,w+real);
  s.connect(v);v.connect(e.g);s.start(w,off,d);const gr=e.src.gr;gr.push(s);s.onended=()=>{const i=gr.indexOf(s);if(i>=0)gr.splice(i,1);try{v.disconnect()}catch(_){}};
  e.nt=w+real-BOXGF+(Math.random()<BOXGAPP?BOXGAP[0]+Math.random()*(BOXGAP[1]-BOXGAP[0]):0)}
function boxLoopTick(){if(!GOSOL.size)return;const now=performance.now(),ok=typeof AC!=='undefined'&&AC&&AC.state==='running'&&SND.sfx&&typeof S!=='undefined'&&S&&!(typeof paused==='function'&&paused()),buf=ok&&(SBUF.goso||[]).find(Boolean),t=typeof AC!=='undefined'&&AC?AC.currentTime:0,L=[];
  for(const[r,e]of GOSOL){const live=now-e.seen<250&&r.act===e.a&&boxAct(r),q=live&&buf?sfxPos(e.x,e.y):null;if(q)L.push([e,q]);else if(!live){boxLoopStop(e,t);GOSOL.delete(r)}/* 音を止めてから表からけす（止めずにけすと、鳴りつづける） */}
  L.sort((a,b)=>b[1].v-a[1].v);const on=new Set(L.slice(0,BOXLOOPN).map(p=>p[0]));
  for(const[r,e]of GOSOL){if(!on.has(e)&&e.src)boxLoopStop(e,t)}if(!buf)return;
  for(const[e,q]of L){if(!on.has(e))continue;if(!e.src){const g=AC.createGain(),f=AC.createBiquadFilter();g.gain.value=0;f.type='lowpass';f.Q.value=.5;let h=g;if(AC.createStereoPanner){e.p=AC.createStereoPanner();g.connect(e.p);h=e.p}else e.p=null;h.connect(f);f.connect(sfxG);Object.assign(e,{src:{gr:[]},g,f,nt:t,lo:null})}
    while(e.nt<t+.3)boxGrain(e,buf);/* 0.1秒ごとによばれるので、0.3秒先まで用意しておく */
    e.g.gain.setTargetAtTime(q.v*BOXLOOPV,t,.08);if(e.p)e.p.pan.setTargetAtTime(q.p,t,.08);e.f.frequency.setTargetAtTime(q.l,t,.08)}}
setInterval(boxLoopTick,100);
const WBEATP=new WeakMap();
const POURU=new WeakMap();/* 水やり：1回3秒の音（pourl）を、おわる0.4秒まえに、つぎをかさねて、とぎれずにつづける */
function pourKeep(r){const now=performance.now(),u=POURU.get(r)||0;if(now<u-400&&u-now<=3000)return;POURU.set(r,now+3000);sfxAt('pourl',r.x,r.y)}
function workBeat(r,nm,t,p){if(nm==='water'||nm==='tend'){pourKeep(r);return}const B=WBEAT[nm],m=typeof SPM!=='undefined'&&SPM[nm];if(!B||!m||typeof m.r!=='number'&&p==null)return;const ph=typeof m.r==='number'?((t*m.r)%1+1)%1:p,/* 'ph' の動き（水くみ）は、わたされた進みぐあい p */last=WBEATP.get(r);WBEATP.set(r,{nm,ph});if(!last||last.nm!==nm||m.r==='ph'&&ph<last.ph)return;/* 'ph' の動きは、もどらない（1回だけ） */
  for(const[b,snd,fx]of B){const crossed=last.ph<=ph?(last.ph<b&&b<=ph):(b>last.ph||b<=ph);if(!crossed)continue;sfxAt(snd==='@eat'?eatSnd(r.act&&r.act.items):snd,r.x,r.y);const nat=(nm==='chop'||nm==='mine')&&r.act&&r.act.obj!=null;if(nat&&typeof natJolt==='function')natJolt(r.act.obj,(r.act.obj%W+.5)>=r.x?1:-1);/* 木・岩は、たたくたびに、たたかれた向きへゆれる。木くず・石のかけらも毎回 */if(fx&&(nat||Math.random()<.5)){const j=r.act&&r.act.type==='draw'&&r.act.src!=null?r.act.src:r.act&&r.act.type==='craft'?((craftOrder(r)||{}).cs??null):r.act&&r.act.obj!=null?r.act.obj:null,x=j!=null?(j%W+.5)*TS:r.x*TS+(r.face<0?-14:14),y=j!=null?((j/W|0)+.4)*TS:r.y*TS;fxSpr(fx,x,y)}}}
/* できあがり：1回だけ、ぽん・きらきら */
function workShowStart(r,a){a.sh=0;r.bubble='';/* 頭の上の物とかさならないように */sfxAt('workdone',r.x,r.y);fxSpr('twinkle',r.x*TS,(r.y-.9)*TS)}

/* ---------- 食べる物ごとの食べ方（動き eat_drink・eat_bread・eat_fruit・eat_meal と、かじる・のむ所の音 WBEAT） ---------- */
const EATDRINK=new Set(['milk','berryjuice','applejuice','milkshake','berrymilk','soup','fishsoup']),EATBREAD=new Set(['bread','pancake','tamasand','komugiko']),EATFRUIT=new Set(['apple','berry','donguri','ringoame','tomato','takenoko']);
const EATIC={cup:'drink',bread:'bread',cake:'bread',sand:'bread'};
function eatKind(items){const k=(items||[])[0];if(!k)return'meal';if(EATDRINK.has(k))return'drink';if(EATBREAD.has(k))return'bread';if(EATFRUIT.has(k))return'fruit';const D=typeof COOKDI!=='undefined'&&COOKDI[k],ic=D&&D.ic&&D.ic[0];return EATIC[ic]||'meal'}
/* 食べる・のむ音（SAMPLES.ea_〜、tools/sound/eat_asmr.py）：食べ物ごとに、いちばん近い録音。表にない料理は、料理の絵のしゅるい（COOKD の ic）で */
const EATSND={apple:'ea_apple',ringoame:'ea_apple',berry:'ea_apple',tomato:'ea_apple',donguri:'ea_nut',takenoko:'ea_veg',salad:'ea_veg',kinoko:'ea_soft',mugi:'ea_cereal',komugiko:'ea_cereal',kakigori:'ea_cracker',
  imo:'ea_soft',yakiimo:'ea_soft',egg:'ea_soft',pancake:'ea_soft',takoyaki:'ea_soft',yakizakana:'ea_soft',kabayaki:'ea_soft',kushiyaki:'ea_soft',foil:'ea_soft',bread:'ea_toast',tamasand:'ea_toast',
  milk:'ea_water',berryjuice:'ea_water',applejuice:'ea_water',milkshake:'ea_water',berrymilk:'ea_water',soup:'ea_tea',fishsoup:'ea_tea',wataame:'ea_cookie',yakisoba:'ea_soft',marine:'ea_soft'},
  EATSNDIC={cup:'ea_tea',bowl:'ea_soft',plate:'ea_soft',skewer:'ea_soft',bread:'ea_toast',cake:'ea_cookie',dango:'ea_cookie',salad:'ea_veg',sand:'ea_toast'};
function eatSnd(items){const k=(items||[])[0];if(!k)return'ea_soft';if(EATSND[k])return EATSND[k];if(FOODS[k]&&FOODS[k].fish)return'ea_soft';const D=typeof COOKDI!=='undefined'&&COOKDI[k],ic=D&&D.ic&&D.ic[0];return EATSNDIC[ic]||'ea_soft'}
function eatAnim(r){const a=r.act;return typeof SPM!=='undefined'&&a&&a.type==='eat'&&SPM['eat_'+eatKind(a.items)]?'eat_'+eatKind(a.items):'eat'}
/* ---------- その場でのよろこび・がっかり・ふしぎ（つりの結果・なでたあと・できあがり）：正面を向いて、その動きと顔 ---------- */
const REACTU=new WeakMap(),PETU=new WeakMap();
const REACTA={joy:'talkjoy',sad:'talksad',think:'talktilt'},REACTM={joy:'joy',sad:'sad',think:''};
function spReact(r,k,ms){/* k：joy・sad・think。ms のあいだ（1倍の速さで）、手をとめて正面を向く。とめるのは村の時間（r.reactT。実時間の RHOLD だと、早送り・自動のテストで止まりつづける） */const now=performance.now();REACTU.set(r,{k,u:now+ms});r.reactT=S.t+ms/1000*MIN_PER_SEC;if(k==='joy'){JOYU.set(r,now+ms);JUMP.set(r,now)}if(k==='think')r.bubble='❓'}
function spReactNow(r,now){const e=REACTU.get(r);return e&&e.u>now&&(r.reactT||0)>S.t?e.k:''}
function spPetNow(r,now){return (PETU.get(r)||0)>now}
/* なでる手（守り神の手）：頭の上で、左右にゆっくり行き来する。ドットの四角（1ドット＝ゲームの1.5点）。手の色はやわらかい光の色 */
function spFrontNow(r,now){return spPetNow(r,now)||!!spReactNow(r,now)}
/* いまの動きの名前を、その子のようすで、さしかえる（drawRes0）：床で寝る・なでられる・つりの結果など・食べる物ごとの食べ方・生き物をなでる */
function spAnimFix(r,now,flSl,front,an){if(typeof SPM==='undefined')return an;if(flSl)return'sleepcurl';if(front&&spPetNow(r,now)&&SPM.petted)return'petted';const k=front&&spReactNow(r,now);if(k&&SPM[REACTA[k]])return REACTA[k];
  if(an==='eat')return eatAnim(r);if((an==='apet'||an==='apetq')&&SPM.anipat)return'anipat';return an}
/* ---------- もやもや（たのしさが低いとき）・鼻歌（ごきげんなとき） ---------- */
/* もやもや：たのしさが低いあいだ、ずっと。大きさのちがう、むらさきの うずまき（ドットの絵、1ドット＝ゲームの1.5点）が、頭のまわりに、まばらに わいて、くるくるまわりながら上へうかんで、きえる（どうぶつの森の、しょんぼりの雲のように） */
const MOYAS=[['.ooo.','o...o','o.o.o','o..o.','.oo..'],['..ooo..','.o...o.','o..o..o','o.o.o.o','o.o..o.','.o.....','..oooo.'],['..ooooo..','.o.....o.','o..ooo..o','o.o...o.o','o.o.o.o.o','o.o..oo.o','o..o....o','.o..oooo.','..o......']];
const MOYAN=5,MOYAL=4200,MOYACOL=['#9a82c6','#8a6bb8','#7a5ca8'];/* 同時にうかぶ数・1つがきえるまで（ミリ秒）・小さい・中・大きいの色 */
function moyaHash(a,b){let h=(a*73856093^b*19349663)>>>0;h=Math.imul(h^h>>>13,1274126177)>>>0;return(h>>>8)/16777216}
function drawMoya(c,px,top,now,id){const g=1.5;c.save();
  for(let i=0;i<MOYAN;i++){const tt=now+id*977+i*MOYAL/MOYAN,n=Math.floor(tt/MOYAL),k=(tt%MOYAL)/MOYAL,h1=moyaHash(id*31+i,n),h2=moyaHash(n,id*17+i*5),sz=h1<.4?0:h1<.8?1:2,P=MOYAS[sz];
    const x0=Math.round((px+(h2-.5)*26+Math.sin(k*5+i)*2-P[0].length*g/2)/g)*g,y0=Math.round((top+8-(h1*.6+.4)*6-k*14-P.length*g/2)/g)*g,fl=Math.floor(tt/(480+sz*220))%2;
    c.globalAlpha=k<.15?k/.15:k>.75?(1-k)/.25:1;c.fillStyle=MOYACOL[sz];
    P.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[fl?row.length-1-x:x]==='o')c.fillRect(x0+x*g,y0+y*g,g,g)})}
  c.restore()}
/* 鼻歌：たのしさが FUNF いじょうのあいだ、ずっと。音符のドットが、つぎつぎ ふわっと上へ */
const HUMGAP=700,HUML=1600;
const NOTE=['..oo','..oo','..o.','..o.','ooo.','ooo.','.o..'];
function humTick(r){/* drawRes0 から：ごきげんで、こわがっていない子 */return r.fun>=FUNF&&!hostileNow(r)}
/* 鼻歌・もやもやは、たまに：MOODCHK ミリ秒ごとに、たのしさの量に合わせた確率で、MOODDUR ミリ秒だけ出す（ごきげんなほど・しょんぼりなほど、よく出る） */
const MOODCHK=7000,MOODDUR=4500,MOODP0=.1,MOODP1=.5,MOODB=new WeakMap();
function moodChance(r,k){if(k==='hum')return MOODP0+MOODP1*Math.max(0,Math.min(1,(r.fun-FUNF)/(100-FUNF)));const L=FUNLOWV[r.elem]||30;return MOODP0+MOODP1*Math.max(0,Math.min(1,(L-r.fun)/L))}
function moodOn(r,k,now){let b=MOODB.get(r);if(!b||b.k!==k){b={k,u:0,n:now+Math.random()*MOODCHK};MOODB.set(r,b)}if(now<b.u)return true;if(now>=b.n){b.n=now+MOODCHK;if(Math.random()<moodChance(r,k)){b.u=now+MOODDUR;b.t0=now;return true}}return false}
function drawHum(c,px,top,now,r){const g=1.5,tt=now+r.id*613;c.save();for(let j=0;j<3;j++){const n=Math.floor(tt/HUMGAP)-j,k=(tt-n*HUMGAP)/HUML;if(k<0||k>1)continue;const i=((n%2)+2)%2,ox=(moyaHash(r.id,n)-.5)*8;
  const x0=Math.round((px+8+ox+Math.sin(k*6+n)*3)/g)*g,y0=Math.round((top-k*16)/g)*g;c.globalAlpha=k<.1?k/.1:k<.8?1:(1-k)/.2;c.fillStyle=i?'#e98fb0':'#7aa6e0';
  NOTE.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='o')c.fillRect(x0+x*g,y0+y*g,g,g)})}c.restore()}
