'use strict';
/* 強化のイベント（events.js）
   依頼ボードの「イベント」からひらく。ひらくのはつぎの日（at の時刻から3時間のあいだに、はじまる）。
   1つずつ（S.ev）・同じイベントは1季節に1回（S.evDone[id]=季節の番号）。パワー・食料は、ひらいたときにはらう（やめたらもどす）。
   すすみかた（S.ev.ph）：go 集まる → do する → back 帰る（遠足だけ）→ おわり。夜・コワイノが来たら、つぎの日にやりなおす（はらった物はそのまま）。
   ごほうびは、さいごまでいた子だけ（r.est：能力ごとの合計。EVCAP まで）。読みこんだら、とちゅうのイベントは、はじめからやりなおす。
   時間：dur は時計の分。せいれいの動きの時間（a.t）は、その1.5倍（DAYLEN）。
   need：いる家具（EVNEED。家具ごとに人数 cap）。sea：その季節だけ（する日の季節）。stage：その土地だけ。late：暗くなってもする（夜23時まで。コワイノは夜12時から）。
   legs：場所をじゅんにまわる（温泉めぐり）。 */
const evHere=r=>!!r&&(!r.hidden||!!r.act&&r.act.type==='sleep');/* 村にいる子（家で昼寝している子も。お墓・旅の子はのぞく） */
const EVCAP={work:12,move:12,sta:12,atk:60,cap:6};
const EVSTN={work:'はたらく速さ',move:'移動速度',sta:'スタミナ',atk:'攻撃力',cap:'持てる数'};
const EVENTS={
  taiso:{n:'朝の体そう',d:'神殿のまえに集まって、みんなで体そう。',at:6.5,dur:20,pt:20,per:0,max:0,gain:{sta:1},talk:['いち、に、さん、し！','のびのび〜！','#joy|からだが、ぽかぽか！']},
  soji:{n:'大そうじの日',d:'みんなで、村の草・落とし物・クモの巣をかたづける。',at:9,dur:60,pt:30,per:5,max:0,gain:{work:1},talk:['ぴかぴかにしよう！','#joy|すっきりしてきた！','このへん、まだ草があるよ。']},
  oni:{n:'おにごっこ',d:'広い所で、みんなでおいかけっこ。',at:13,dur:30,pt:30,per:5,max:6,gain:{move:1},talk:['まてまて〜！','#joy|つかまらないよ！','#surprise|わっ、つかまった！']},
  ensoku:{n:'遠足',d:'みんなで遠くまで歩いて、帰ってくる。',at:9,dur:30,pt:50,per:8,food:2,max:6,gain:{move:1},talk:['#joy|ここ、はじめて来た！','空が、ひろいね。','あ、なにか落ちてる！']},
  gochi:{n:'ごちそう会',d:'食卓のまわりに集まって、みんなでごちそうを食べる。',at:12,dur:30,pt:50,per:8,food:3,need:'table',gain:{sta:1},talk:['#joy|いただきます！','おいしいね！','おなか、いっぱい……。']},
  takara:{n:'たから探し',d:'箱の中の物を3つ、村にかくして、みんなでさがす。',at:13,dur:40,pt:50,per:8,max:6,gain:{move:1},gainTxt:'移動速度+1〜+2',talk:['どこかなあ……。','このへん、あやしい！','#joy|あった！']},
  yomi:{n:'よみきかせの会',d:'本棚のまえで、本を読んでもらう。',at:14,dur:30,pt:30,per:5,need:'shelf',gain:{work:1},talk:['……そして、森の木は、こたえました。','つづきが、気になる！','#joy|もう1回読んで！']},
  mizu:{n:'水あそびの日',d:'噴水のまわりで、水をかけあう。',sea:1,at:13,dur:30,pt:50,per:8,need:'fountain',gain:{sta:1},talk:['#joy|つめたーい！','えいっ！','#surprise|わっ、びしょびしょ！']},
  camp:{n:'キャンプの夜',d:'たき火のまわりで、夜までおしゃべり。',sea:1,at:19,late:1,dur:90,pt:60,per:10,wood:2,food:2,need:'campfire',gain:{sta:1,atk:3},talk:['火、あったかいね。','ぱちぱち、いってる。','夜の音って、しずかだね。']},
  cha:{n:'お茶会',d:'屋根の下で、のんびりお茶をのむ。',sea:2,at:15,dur:30,pt:50,per:8,food:1,need:'roof',gain:{sta:1},bond:5,talk:['ほっとするね。','葉っぱの色が、きれい。','#joy|また、みんなでしよう。']},
  hoshi:{n:'星見の会',d:'夜、みんなで寝ころんで星を見る。',sea:3,at:20.5,late:1,dur:60,pt:50,per:8,gain:{sta:1},fun:20,bond:5,talk:['#surprise|あ、ながれ星！','星って、いくつあるんだろう。','空が、すんでるね。']},
  onsen:{n:'温泉めぐり',d:'よみがえった3つの温泉を、みんなで足湯してまわる。',stage:1,at:10,dur:45,pt:50,per:8,need:'spring3',gain:{sta:1},legs:1,talk:['足湯、きもちいい……。','#joy|ほかほかだね！','つぎの温泉も、たのしみ。']}};
const EVORDER=['taiso','soji','oni','ensoku','takara','gochi','yomi','mizu','camp','cha','hoshi','onsen'];
const EVSEA=['春','夏','秋','冬'];
const evObjs=id=>{const L=[];for(let j=0;j<S.obj.length;j++)if(S.obj[j]===id)L.push(j);return L};
const EVNEED={table:{n:'食卓',list:()=>evTables(),cap:j=>BL[S.obj[j]].eat.cap},shelf:{n:'本棚',list:()=>evObjs('shelf1'),cap:()=>4},fountain:{n:'噴水',list:()=>evObjs('fountain'),cap:()=>6},campfire:{n:'たき火',list:()=>evObjs('campfire'),cap:()=>6},
  roof:{n:'ガゼボ・東屋',list:()=>Object.keys(S.roof||{}).map(Number),cap:()=>4},spring3:{n:'よみがえった温泉3つ',list:()=>['a','b','c'].every(springOn)?[-1]:[],cap:()=>99}};
function evCenter(j,roof){if(j<0)return null;const P=roof?rugCells(j).map(k=>[k%W,(k/W)|0]):fp(S.obj[j],j%W,(j/W)|0);let x=0,y=0;for(const[a,b]of P){x+=a+.5;y+=b+.5}return[x/P.length,y/P.length]}
const EVAT=d=>String(Math.floor(d.at))+'時'+(d.at%1?'半':'');
const seasonKey=()=>Math.floor(Math.max(0,dayNo()-1)/SEASONDAYS);/* 季節の番号（ずっとふえる） */
function evSt(r,k){return r&&r.est?(r.est[k]||0):0}/* イベントでふえた能力（rStat がたす） */
function evTables(){const L=[];for(let j=0;j<S.obj.length;j++)if(TABLES.has(S.obj[j]))L.push(j);return L}
function evMax(id){const D=EVENTS[id],all=S.res.filter(evHere).length;if(D.need){const N=EVNEED[D.need];return Math.min(all,N.list().reduce((a,j)=>a+N.cap(j),0))}return Math.min(all,D.max||all)}
function evNeedOK(id){const D=EVENTS[id];if(D.need&&!EVNEED[D.need].list().length)return EVNEED[D.need].n+'がありません';return ''}
function evWhy(id){const D=EVENTS[id];if(S.ev)return 'ほかのイベントがきまっています';if(seasonDay(dayNo()+1)===CUPDAY&&!evDoneNow(cupOf(dayNo()+1)))return 'あしたは'+EVENTS[cupOf(dayNo()+1)].n+'です';if(evDoneNow(id))return 'この季節は、もうひらきました';if(cupKind(id)&&cupFew())return 'せいれいが'+CUPMIN+'人からです';if(D.sea!=null&&seasonOf(dayNo()+1)!==D.sea)return EVSEA[D.sea]+'だけです';return evNeedOK(id)||(D.set?setLack(D):'')}
/* 大会（季節の大会・運動会）は、せいれいが CUPMIN 人からひらく */
const CUPMIN=3,cupKind=id=>!!(EVENTS[id]&&(EVENTS[id].cup||id==='undo')),cupFew=()=>S.res.filter(evHere).length<CUPMIN;
const evOn=id=>{const D=EVENTS[id];return D&&(D.stage==null||D.stage===WD)};
function evCost(id,n){const D=EVENTS[id];return{pt:D.pt+D.per*n,food:(D.food||0)*n,wood:(D.wood||0)*n,arrow:(D.arrow||0)*n,bamboo:(D.bamboo||0)*n}}
function evDoneNow(id){return(S.evDone||{})[id]===seasonKey()}
function evCostTxt(id){const D=EVENTS[id];if(D.set)return'パワー'+D.pt+'・'+setTxt(D);return'パワー'+D.pt+(D.per?'＋ひとり'+D.per:'')+(D.wood?'・ひとり木材'+D.wood:'')+(D.bamboo?'・ひとり竹'+D.bamboo:'')+(D.arrow?'・ひとり木の矢'+D.arrow+'本':'')+(D.food?'・ひとり食料'+D.food:'')}
function evGainTxt(id){const D=EVENTS[id],g=D.gain;if(D.gainTxt)return D.gainTxt;return Object.keys(g).map(k=>EVSTN[k]+'+'+g[k]).concat(D.fun?['たのしさ+'+D.fun]:[],D.bond?['なかよし+'+D.bond]:[]).join('・')}
/* ひらく：お金をはらって、つぎの日にきめる */
function evOpen(id,who){const D=EVENTS[id],c=evCost(id,who.length);if(!evOn(id))return;{const w=evWhy(id);if(w)return toast(w)}
  if(!who.length)return toast('出るせいれいがいません');if(S.pt<c.pt)return toast('パワーが足りません');{const w=setLack(D);if(w)return toast(w)}if(S.food<c.food)return toast('食料が足りません');if((S.mat.wood||0)<c.wood)return toast('木材が足りません');if((S.mat.bamboo||0)<c.bamboo)return toast('竹が足りません');if((S.inv.arrow||0)<c.arrow)return toast('木の矢が足りません');
  S.pt-=c.pt;if(c.wood)S.mat.wood-=c.wood;if(c.bamboo)S.mat.bamboo-=c.bamboo;if(c.arrow)S.inv.arrow-=c.arrow;const got=c.food?takeFood(c.food):[];S.ev={id,day:dayNo()+1,who:who.slice(),paid:{pt:c.pt,food:got,wood:c.wood,bamboo:c.bamboo,arrow:c.arrow,set:D.set?setPay(D):null},ph:null};(S.evDone||(S.evDone={}))[id]=seasonKey();
  sfx('power');toast('あしたは、'+D.n+'！','good');return true}
function evCancel(){const E=S.ev;if(!E||E.ph)return;S.pt+=E.paid.pt;if(E.paid.set)setRefund(E.paid.set);if(E.paid.wood)S.mat.wood=(S.mat.wood||0)+E.paid.wood;if(E.paid.bamboo)S.mat.bamboo=(S.mat.bamboo||0)+E.paid.bamboo;if(E.paid.arrow)S.inv.arrow=(S.inv.arrow||0)+E.paid.arrow;for(const k of E.paid.food||[])addFood(k,1);if(S.evDone&&S.evDone[E.id]===seasonKey())delete S.evDone[E.id];S.ev=null;toast(EVENTS[E.id].n+'を、やめた')}
/* 集まる場所 */
function evSlots(G,cx,cy,n,rad,pred){const L=[];for(let y=Math.floor(cy-rad);y<=cy+rad;y++)for(let x=Math.floor(cx-rad);x<=cx+rad;x++){if(x<1||y<1||x>=W-1||y>=H-1)continue;const j=y*W+x;if(G.dist[j]<0||!walk(j)||S.obj[j]||S.ground[j]||sacredNoBuild(j))continue;if(pred&&!pred(j))continue;L.push([Math.hypot(x+.5-cx,y+.5-cy),j])}
  L.sort((a,b)=>a[0]-b[0]);const out=[];for(const[,j]of L){if(out.some(k=>Math.abs(k%W-j%W)+Math.abs(((k/W)|0)-((j/W)|0))<2))continue;out.push(j);if(out.length>=n)break}
  if(out.length<n)for(const[,j]of L){if(out.includes(j))continue;out.push(j);if(out.length>=n)break}return out}
function evTemple(){return STATUE>=0?[STATUE%W+1,((STATUE/W)|0)+3.5]:[CX+.5,CY+.5]}
function evOpenArea(G,cx,cy){/* 5×5のあいた所で、いちばん近い所（おにごっこ） */let best=null,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>40)continue;const x=j%W,y=(j/W)|0;let ok=true;for(let b=-2;b<=2&&ok;b++)for(let a=-2;a<=2;a++){const k=(y+b)*W+x+a;if(x+a<0||y+b<0||x+a>=W||y+b>=H||!walk(k)||S.obj[k]||S.ground[k]||G.dist[k]<0){ok=false;break}}if(!ok)continue;const s=Math.hypot(x-cx,y-cy);if(s<bd){bd=s;best=[x+.5,y+.5]}}return best}
function evFar(G,cx,cy){/* 遠足の行き先：神殿から12マスより遠く、歩いて18〜40の、あいた所 */const L=[];for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<18||d>40)continue;const x=j%W,y=(j/W)|0;if(Math.hypot(x-cx,y-cy)<12)continue;let ok=true;for(let b=-1;b<=1&&ok;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(!walk(k)||S.obj[k]||S.ground[k]){ok=false;break}}if(ok)L.push([x+.5,y+.5])}return L.length?L[(Math.random()*L.length)|0]:null}
/* はじめる */
const EVWAIT=90;/* 集まるのを待つ時計の分（遠くからでも歩いて来られるくらい）。こえたら、来られた子だけでする */
const EVSTOP=new Set(['evt','chat','chatwait','bathe','rest','tag','play','fish','npl']);/* イベントがはじまったら、やめて向かう（食事・睡眠・荷物・お話などは、すんでから） */
function evBusy(r){const a=r.act;return !!a&&(URGNO.includes(a.type)&&!EVSTOP.has(a.type)||a.type==='watchpost')}
const evIn=r=>!!(S&&S.ev&&S.ev.ph&&S.ev.who.includes(r.id));
function evStart(){const E=S.ev,D=EVENTS[E.id];
  if(D.bday){/* お誕生日会：そのときいるみんな（birthday.js） */E.who=S.res.filter(evHere).map(r=>r.id);const L=E.who.map(id=>S.res.find(r=>r.id===id)),c=bdayChild(E);if(!c||!bdayOK(c)||L.length<2)return bdayDrop(E,'');
    if(!bdayStart(E,L,bfs(c.x|0,c.y|0)))return bdayDrop(E,'集まる所がなくて、できなかった');E.who=E.who.filter(id=>E.slot[id]!=null);E.ph='go';E.t0=S.t;E.at={};E.got={};E.backed=[];
    for(const r of L)if(E.slot[r.id]!=null&&r.act&&!evBusy(r)){endAct(r);r.act=null;r.path=[]}musicDuck&&musicDuck(1.5);toast(D.n+'がはじまった！','good');sfx('quest');return}if(D.cup)E.who=S.res.filter(evHere).map(r=>r.id);/* 大会は、そのときいるみんな */E.who=E.who.filter(id=>S.res.some(r=>r.id===id&&evHere(r)));if(D.cup&&E.who.length<CUPMIN){S.ev=E.next||null;return}if(E.id==='undo'&&E.who.length<CUPMIN){evCancel();return}if(!E.who.length){evCancel();return}
  const L=E.who.map(id=>S.res.find(r=>r.id===id)),r0=L[0],[tx,ty]=evTemple();let cx=tx,cy=ty;const G=bfs(r0.x|0,r0.y|0);
  if(E.id==='oni'){const p=evOpenArea(G,tx,ty);if(!p)return evFail('広い所が見つからない');[cx,cy]=p}
  if(E.id==='ensoku'){const p=evFar(G,tx,ty);if(!p)return evFail('行き先が見つからない');[cx,cy]=p;E.home={};{const H=evSlots(bfs(Math.floor(tx),Math.floor(ty)),tx,ty,L.length,4);L.forEach((r,i)=>{if(H[i]!=null)E.home[r.id]=H[i]})}}
  if(E.id==='hanabi'&&S.rain)return evFail('雨なので、花火があげられない');
  E.slot={};E.c=[cx,cy];
  if(D.cup){if(!cupStart(E,L,G,tx,ty))return evFail('大会の場所が見つからない')}
  else if(E.id==='undo'){if(!undoStart(E,L,G,tx,ty))return evFail('広い所が見つからない')}
  else if(E.id==='gochi'){const S2=[];for(const t of evTables()){const c=BL[S.obj[t]].eat.cap,P=fp(S.obj[t],t%W,(t/W)|0),near=[];for(const[x,y]of P)for(const[dx,dy]of[[-1,0],[1,0],[0,1],[0,-1]]){const k=(y+dy)*W+x+dx;if(P.some(([a,b])=>a===x+dx&&b===y+dy)||near.includes(k))continue;if(G.dist[k]>=0&&walk(k)&&(!S.obj[k]||SEATS.includes(S.obj[k])))near.push(k)}S2.push(...near.slice(0,c).map(k=>[k,t]))}E.tab={};L.forEach((r,i)=>{if(S2[i]){E.slot[r.id]=S2[i][0];E.tab[r.id]=S2[i][1]}});{const t=S2[0]&&S2[0][1];if(t!=null)E.c=[t%W+1,((t/W)|0)+.5]}}
  else if(D.legs){E.legs=['a','b','c'].map(k=>HSPC[k]);E.leg=0;if(!evLegSlots(E,L,G))return evFail('温泉のそばに立つ所がない')}
  else if(D.need){const N=EVNEED[D.need],U=N.list();let i=0;for(const u of U){const c=evCenter(u,D.need==='roof');if(!c)continue;if(i===0)E.c=c;const SL=evSlots(G,c[0],c[1],Math.min(N.cap(u),L.length-i),D.need==='roof'?2:3,j=>!Object.values(E.slot).includes(j));for(const j of SL){if(i>=L.length)break;E.slot[L[i].id]=j;(E.unit||(E.unit={}))[L[i].id]=c;i++}if(i>=L.length)break}
    if(E.id==='yomi'){const rd=L.filter(r=>E.slot[r.id]!=null).sort((a,b)=>rLv(b)-rLv(a))[0];if(rd){E.reader=rd.id;const u=E.unit[rd.id],near=Object.keys(E.slot).sort((a,b)=>{const p=E.slot[a],q=E.slot[b];return Math.hypot(p%W+.5-u[0],((p/W)|0)+.5-u[1])-Math.hypot(q%W+.5-u[0],((q/W)|0)+.5-u[1])})[0];const t=E.slot[rd.id];E.slot[rd.id]=E.slot[near];E.slot[near]=t}}}
  else if(E.id!=='soji'){const SL=evSlots(G,cx,cy,L.length,E.id==='oni'?2:5);L.forEach((r,i)=>{if(SL[i]!=null)E.slot[r.id]=SL[i]})}
  if(E.id==='takara'){E.tr=[];E.find={};const C=[];for(let j=0;j<W*H;j++)if(VILL[j]&&G.dist[j]>=0&&Math.hypot(j%W+.5-cx,((j/W)|0)+.5-cy)<=10&&walk(j)&&!S.obj[j]&&!S.ground[j])C.push(j);/* かくすのは、集まる所から10マスまで */for(let i=0;i<3&&C.length;i++){const j=C.splice((Math.random()*C.length)|0,1)[0];const ks=Object.keys(MATN).filter(k=>(S.mat[k]||0)>0),k=ks.length?pick(ks):null;if(k)S.mat[k]--;E.tr.push({j,k})}}
  E.who=E.who.filter(id=>E.id==='soji'||E.slot[id]!=null);if(cupKind(E.id)&&E.who.length<CUPMIN){if(D.cup){S.ev=E.next||null;return}evCancel();return}if(!E.who.length)return evFail('集まる所がない');
  E.ph=E.id==='soji'?'do':'go';E.t0=S.t;E.at={};E.got={};E.backed=[];
  if(E.id==='soji'){for(let j=0;j<S.obj.length;j++)if(WEEDS.has(S.obj[j])&&VILL[j])(S.wreq||(S.wreq={}))[j]=1;if(S.web)for(const k in S.web)(S.webq||(S.webq={}))[k]=1}/* 村の中の草・クモの巣を、ぜんぶたのむ */
  for(const r of L)if(r.act&&!evBusy(r)){endAct(r);r.act=null;r.path=[]}/* 出る子は、すぐ向かう（食べている・運んでいる子は、すんでから） */
  musicDuck&&musicDuck(1.5);toast(D.n+'がはじまった！','good');sfx('quest')}
function evFail(why){const E=S.ev;if(EVENTS[E.id].bday)return bdayDrop(E,why+'。');E.ph=null;E.day=dayNo()+1;toast(EVENTS[E.id].n+'：'+why+'。あしたまた','warn')}
function evStop(why){const E=S.ev;if(!E||!E.ph)return;if(EVENTS[E.id].bday)return bdayDrop(E,why+'できなかった');for(const r of S.res)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}E.ph=null;E.day=dayNo()+1;toast(EVENTS[E.id].n+'は、'+why+'あしたに','warn')}
/* 1秒ごと */
function evTick(){const E=S&&S.ev;if(!E||typeof MEMRUN!=='undefined'&&MEMRUN)return;const D=EVENTS[E.id];if(!D){S.ev=null;return}const h=hour(),foe=S.enemies.some(e=>e.spawned&&!e.dead);
  if(!E.ph&&D.bday&&(dayNo()>E.day||h>=D.at+3))return bdayDrop(E,'');/* 誕生日の日だけ（ほかの日にずらさない） */
  if(!E.ph){if(dayNo()>=E.day&&h>=D.at&&h<D.at+3&&!isNight()&&!foe&&(D.late||!isDark()))evStart();return}
  if(isNight()||!D.late&&isDark())return evStop('暗くなったので、');if(foe)return evStop('コワイノが来たので、');
  const P=E.who.map(id=>S.res.find(r=>r.id===id)).filter(evHere);if(!P.length){S.ev=null;return}
  const here=r=>r.act&&r.act.type==='evt'&&r.act.stage==='do'&&!r.act.back;
  if(E.ph==='go'){for(const r of P)if(here(r))E.at[r.id]=1;const all=P.every(r=>E.at[r.id]);if(all||S.t-E.t0>EVWAIT){if(!all)for(const r of P){const j=E.slot&&E.slot[r.id];if(j!=null&&Math.hypot(j%W+.5-r.x,((j/W)|0)+.5-r.y)<=2.5)E.at[r.id]=1}/* 時間切れでも、立つ所のすぐそばまで来ている子は、来られたことにする */E.who=E.who.filter(id=>E.at[id]);if(!E.who.length)return evStop('だれも集まれなかったので、');E.ph='do';E.t0=S.t;sfx('good');for(const r of P)if(E.at[r.id])JUMP.set(r,performance.now()+Math.random()*300);if(D.bday)bdayGifts(E,P.filter(r=>E.at[r.id]))}return}
  if(D.grand)grandFx(E,P);if(E.ph==='do'&&D.cup)return cupTick(E,P);if(E.ph==='do'&&E.id==='undo')return undoTick(E,P);
  if(E.ph==='do'){if(E.id==='soji')for(const r of P)if(r.act&&['weed','pickdrop','sweep','evt'].includes(r.act.type))E.got[r.id]=1;
    if(E.id==='takara'&&E.tr.every(t=>t.got))return evEnd();
    if(E.legs&&S.t-E.t0>=D.dur/E.legs.length&&E.leg<E.legs.length-1){E.leg++;for(const r of P)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}if(!evLegSlots(E,P,bfs(P[0].x|0,P[0].y|0)))return evEnd();E.ph='go';E.t0=S.t;E.at={};return}
    if(S.t-E.t0>=(E.legs?D.dur/E.legs.length:D.dur)){if(E.id==='ensoku'){E.ph='back';E.t0=S.t;for(const r of P){if(Math.random()<.5&&matTot()+matN(r)<matCap()){addMat(r,'eda',1);/* しまう所があるときだけ */addFloat(r.x,r.y-1.5,'枝をみつけた','#fff3d6')}if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}}return}return evEnd()}return}
  if(E.ph==='back'){for(const r of P)if(r.act&&r.act.type==='evt'&&r.act.back&&r.act.stage==='do'&&!E.backed.includes(r.id))E.backed.push(r.id);if(P.every(r=>E.backed.includes(r.id))||S.t-E.t0>EVWAIT*2)evEnd()}}
function evEnd(){const E=S.ev,D=EVENTS[E.id];if(E.tr)for(const t of E.tr)if(!t.got&&t.k)S.mat[t.k]=(S.mat[t.k]||0)+1;/* 見つからなかった物は、箱にもどす */const P=E.who.map(id=>S.res.find(r=>r.id===id)).filter(r=>evHere(r)&&(E.id!=='soji'||E.got[r.id])&&(E.id!=='ensoku'||E.backed.includes(r.id)||E.at[r.id]));
  const R=D.cup?cupRanks(E,P):null;S.ev=E.next||null;E.ph=null;for(const r of S.res)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}
  if(D.bday)bdayEnd(E,P);
  if(D.bond)for(let i=0;i<P.length;i++)for(let k=i+1;k<P.length;k++)bondAdd(P[i],P[k],D.bond);
  P.forEach((r,i)=>{const T=r.est||(r.est={}),up=[],G2=E.id==='takara'?{move:((E.find||{})[r.id]||0)>=3?2:1}:D.cup?{[D.stat]:D.rank[cupPlace(E,R,r.id)]}:E.id==='undo'&&E.team[r.id]===(E.win[0]>=E.win[1]?0:1)?{work:2,move:2,sta:2,atk:10}:D.gain;if(D.fun)r.fun=Math.min(100,r.fun+D.fun);for(const k in G2){const v=Math.min(EVCAP[k],(T[k]||0)+G2[k]),d=v-(T[k]||0);T[k]=v;if(d>0)up.push(EVSTN[k]+'+'+d)}r.estV=(r.estV||0)+1;
    if(E.id==='gochi'||E.id==='shukaku'||E.id==='utage')r.hunger=hMax(r);if(E.id==='utage')r.energy=100;r.fun=Math.min(100,r.fun+10);
    villageTimeout(()=>{if(!S.res.includes(r))return;JUMP.set(r,performance.now());addFloat(r.x,r.y-1.6,up.length?up.join('・'):'たのしかった！','#ffe7a8')},300+i*350)});
  if(D.cup){const nm=id=>(S.res.find(q=>q.id===id)||{}).name||'',top=[0,1,2].map(i=>P.filter(r=>cupPlace(E,R,r.id)===i).map(r=>r.name).join('・')).map((n,i)=>n?(i+1)+'位 '+n:'').filter(Boolean);memo('',D.n+'：'+top.join('　'));toast(D.n+'　'+top.join('　'),'good');sfx('level');
    P.filter(r=>cupPlace(E,R,r.id)===0).forEach(r=>villageTimeout(()=>{if(S.res.includes(r))JOYU.set(r,performance.now()+4000)},200));return}
  if(D.bday)return toast(D.n+'がおわった！','good'),sfx('good');
  memo('',D.n+'をした');toast(D.n+'がおわった！'+(P.length?'　'+evGainTxt(E.id):''),'good');sfx('good')}
/* 出る子の行動（spirit-act の decide0 からよぶ） */
function evStand(r,G,j){/* 立つ所に行けない・10分止まっていた所（avoidJ）なら、そばの空いた所 */if(j>=0&&G.dist[j]>=0&&!(j===r.avoidJ&&S.t<r.avoidU))return j;const x0=j%W,y0=(j/W)|0;return nearest(G,k=>k!==r.avoidJ&&Math.abs(k%W-x0)<=3&&Math.abs(((k/W)|0)-y0)<=3&&walk(k)&&!S.obj[k]&&!S.ground[k],200)}
function evAct(r,G){const E=S&&S.ev;if(!E||!E.ph||isNight()||r.hidden||!E.who.includes(r.id))return false;
  if(E.ph==='back'){if(E.backed.includes(r.id))return false;const j=E.home&&E.home[r.id];if(j==null){E.backed.push(r.id);return false}const k=evStand(r,G,j);if(k<0){E.backed.push(r.id);return false}startAct(r,G,'evt',k,{back:1});return true}
  if(E.id==='soji'){if(tryJob(r,G,'weed')||tryJob(r,G,'drop'))return true;{const j=webReqFor(r);if(j>=0){const st=nearest(G,k=>k===j+W||k===j-1||k===j+1,200);if(st>=0){startAct(r,G,'sweep',st,{key:'b'+j,obj:j});return true}}}
    const k=nearest(G,j=>VILL[j]&&walk(j)&&!S.obj[j]&&!S.ground[j]&&Math.random()<.05,30);startAct(r,G,'evt',k>=0?k:(r.y|0)*W+(r.x|0),{sweep:1,dur:15});return true}
  if(E.id==='takara'&&E.ph==='do'){const left=E.tr.filter(t=>!t.got);let k=-1;if(left.length&&Math.random()<.5){const t=pick(left);k=nearest(G,j=>Math.abs(j%W-t.j%W)<=1&&Math.abs(((j/W)|0)-((t.j/W)|0))<=1&&walk(j),60)}if(k<0)k=nearest(G,j=>VILL[j]&&walk(j)&&!S.obj[j]&&!S.ground[j]&&Math.hypot(j%W+.5-E.c[0],((j/W)|0)+.5-E.c[1])<=10&&Math.random()<.04,40);startAct(r,G,'evt',k>=0?k:(r.y|0)*W+(r.x|0),{seek:1});return true}
  const j=E.slot&&E.slot[r.id];if(j==null)return false;const k=evStand(r,G,j);if(k<0)return false;startAct(r,G,'evt',k,{});return true}
function evLegSlots(E,L,G){const c=E.legs[E.leg];E.c=c;const SL=evSlots(G,c[0],c[1],L.length,4);E.slot={};L.forEach((r,i)=>{if(SL[i]!=null)E.slot[r.id]=SL[i]});return SL.length>0}
function evSeekEnd(r){const E=S.ev;if(!E||!E.tr)return;const t=E.tr.find(t=>!t.got&&Math.abs(t.j%W+.5-r.x)<=1.6&&Math.abs(((t.j/W)|0)+.5-r.y)<=1.6);if(!t)return;t.got=1;E.find[r.id]=(E.find[r.id]||0)+1;if(t.k)addMat(r,t.k,1);JUMP.set(r,performance.now());spawnFX(t.j%W+.5,((t.j/W)|0)+.5,'#ffe08a');addFloat(r.x,r.y-1.6,(t.k?MATN[t.k]+'を':'たからを')+'みつけた！','#ffe7a8');sfx('good')}
const evDish=E=>{const f=(E.paid&&E.paid.food)||[];const k=f.length?pick(f):'apple';return(FOODS[k]||FOODS.apple).e};
ACT.evt={start(r,a){const E=S.ev;r.bubble='';if(!E)return false;a.ev=E.id;if(E.id==='gochi'&&E.tab&&E.tab[r.id]!=null){const c=(r.y|0)*W+(r.x|0),t=E.tab[r.id];for(const d of[-W,-1,1,W])if(anc(c+d)===t||c+d===t){a.tdir=d;break}a.e=evDish(E)}else if(E.id==='cha'||E.id==='utage'||E.id==='pikunikku')a.e=evDish(E);else if(E.id==='shukaku')a.e=FOODS[pick(EVCROP)].e;
    if(E.id==='cup1'&&E.pairs){const p=E.pairs.find(q=>q.includes(r.id));if(p){r.face=p[0]===r.id?1:-1;return}}if(E.id==='cup0'||E.id==='cup3'||E.id==='undo'&&UNDOSEG[E.seg]==='race'){r.face=1;return}if(E.id==='undo'&&UNDOSEG[E.seg]==='tug'){r.face=E.team[r.id]?-1:1;return}
    if(a.tdir==null&&!a.back&&!a.seek){const u=E.id==='yomi'&&E.reader!=null&&E.reader!==r.id?(()=>{const q=S.res.find(o=>o.id===E.reader);return q?[q.x,q.y]:null})():(E.unit&&E.unit[r.id])||E.c;if(u&&Math.abs(u[0]-r.x)>.2)r.face=u[0]<r.x?-1:1}},
  tick(r,a,dt){const E=S.ev;if(!E||a.back||a.sweep)return;if(E.ph!=='do'){a.h=0;return}if(E.id==='hana')r.crown=callDay();/* 花まつり：花かんむりをつけて（つぎの朝6時まで） */r.fun=Math.min(100,r.fun+.2*dt);a.h=(a.h||0)+dt;
    if(E.id==='oni')evOniMove(r,a,dt);if(EVENTS[E.id].cup)cupMove(r,a,dt);if(E.id==='undo')undoMove(r,a,dt);
    if(a.h>=9){a.h=0;if(Math.random()<.35){const L=EVENTS[E.id].talk;addFloat(r.x,r.y-1.5,pickFresh('ev:'+E.id,L).replace(/^#[a-z]+\|/,''),'#fff3d6')}if(E.id!=='gochi'&&E.id!=='oni'&&!EVENTS[E.id].cup&&Math.random()<.4)JUMP.set(r,performance.now())}},
  done(r,a){const E=S.ev;if(!E||!E.ph)return true;if(a.seek)return a.t>=6||E.ph!=='do';if(E.id==='takara')return E.ph!=='go';/* たから探し：そろったら、さがしに歩きだす */if(a.sweep)return a.t>=(a.dur||15)||E.ph!=='do';if(a.back)return a.t>=6;return E.ph==='back'},
  end(r,a){if(a.seek&&a.stage==='do'&&a.t>=6)evSeekEnd(r)}};
function evAnim(r){const a=r.act,E=S&&S.ev;if(!a||!E)return 'talk';if(a.sweep)return 'sweep';if(a.back)return 'wave';if(E.ph!=='do')return 'talk';
  const cy=(L,n)=>L[Math.floor(a.t/n)%L.length];
  if(E.id==='undo'){const sg=UNDOSEG[E.seg];return sg==='race'?(E.order.includes(r.id)?'talkjoy':'chase'):sg==='tug'?'pluck':cy(['qrain','punch'],3)}
  if(E.id==='matoate')return cy(['bow','bowidle'],4);if(E.id==='pikunikku')return cy(['eat','sunset','talkjoy'],8);if(E.id==='taikokai')return cy(['punch','qspin','punch'],4);if(E.id==='ocha')return cy(['talkthink','talk'],8);if(E.id==='hokomairi')return 'pray';
  if(E.id==='hana')return cy(['dance','qspin','dance','talkjoy'],6);/* 花かんむりをつけて、おどる */if(E.id==='lantern')return cy(['qlookup','qrain'],8);if(E.id==='bday')return E.bd===r.id?cy(['talkjoy','dance','talkjoy'],6):cy(['clap','talkjoy','clap'],5);if(E.id==='hanabi')return cy(['qlookup','sunset','qlookup','talkjoy'],7);if(E.id==='shukaku'||E.id==='utage')return cy(['eat','talkjoy'],8);if(E.id==='himatsuri')return cy(['qwarm','qspin','punch'],5);
  if(E.id==='cup0')return E.order.includes(r.id)?'talkjoy':'chase';if(E.id==='cup1')return E.pairs&&E.pairs.some(p=>p.includes(r.id))?cy(['punch','shield'],2):'clap';if(E.id==='cup2')return 'craft';if(E.id==='cup3')return a.dir<0?'chase':'carry';
  if(E.id==='taiso')return cy(['qstretch','qspin','qrain','qstretch'],9);if(E.id==='oni')return 'chase';if(E.id==='gochi')return 'eat';if(E.id==='ensoku')return cy(['point','qlookup','talkjoy'],12);
  if(a.seek)return cy(['qpeek','point'],3);if(E.id==='yomi')return E.reader===r.id?'talk':cy(['sunset','sunset','talkjoy'],10);if(E.id==='mizu')return cy(['play_fountain','qrain','qspin'],8);
  if(E.id==='camp')return cy(['sunset','sunset','qwarm'],10);if(E.id==='cha')return cy(['eat','talkjoy','eat'],9);if(E.id==='hoshi')return cy(['sunset','qlookup','sunset'],12);if(E.id==='onsen')return 'sunset';return 'talkjoy'}
function evOniMove(r,a,dt){/* おにごっこ：おに（いちばんはじめの子から、時計の6分ごとに交代）はいちばん近い子を追い、ほかの子は、おにからにげる。広場（まん中から2.4マス）の中だけ */const E=S.ev,[cx,cy]=E.c,P=E.who.map(id=>S.res.find(q=>q.id===id)).filter(q=>q&&q.act&&q.act.type==='evt'&&q.act.stage==='do');if(P.length<2)return;
  const oni=P[Math.floor((S.t-E.t0)/9)%P.length];let tx,ty;if(r===oni){const t=P.filter(q=>q!==r).sort((p,q)=>Math.hypot(p.x-r.x,p.y-r.y)-Math.hypot(q.x-r.x,q.y-r.y))[0];tx=t.x;ty=t.y}else{const dx=r.x-oni.x,dy=r.y-oni.y,L=Math.hypot(dx,dy)||1;tx=r.x+dx/L*2;ty=r.y+dy/L*2;const ang=Math.atan2(ty-cy,tx-cx)+.6;if(Math.hypot(tx-cx,ty-cy)>2.4){tx=cx+Math.cos(ang)*2.2;ty=cy+Math.sin(ang)*2.2}}
  const dx=tx-r.x,dy=ty-r.y,L=Math.hypot(dx,dy);if(L<.05)return;const m=Math.min(L,dt*.9*rMul(r,'move')),nx=r.x+dx/L*m,ny=r.y+dy/L*m,k=(ny|0)*W+(nx|0);if(Math.hypot(nx-cx,ny-cy)<=2.5&&walk(k)&&!S.obj[k]){r.face=dx>=0?1:-1;r.x=nx;r.y=ny}}
function evLoadFix(){if(S&&S.ev&&S.ev.ph){S.ev.ph=null}}/* とちゅうのイベントは、はじめから */
/* 画面：依頼ボードの「イベント」 */
function evSheet(body){$('#sheetTitle').textContent='イベント';
  {const bk=el('<button class="btn back" aria-label="依頼ボードにもどる">'+pxi('next','prev')+'もどる</button>');bk.onclick=()=>{sfx('tap');openSheet('craft')};$('#sheetTitle').before(bk)}
  const E=S.ev;if(E){const D=EVENTS[E.id],n=el('<div class="sec"><h3>きまっているイベント</h3><div class="rows"></div></div>'),r=rowEl(D.n,(E.ph?'いま、しているよ':E.day>dayNo()?'あした　'+EVAT(D):'きょう　'+EVAT(D))+'・'+E.who.length+'人',null);if(!E.ph){const b=el('<button class="btn">やめる</button>');b.onclick=()=>{sfx('tap');evCancel();renderSheet()};r.appendChild(b)}n.querySelector('.rows').appendChild(r);body.appendChild(n)}
  {const d0=dayNo();let d=d0;while(seasonDay(d)!==CUPDAY||d===d0&&(evDoneNow(cupOf(d))||hour()>=EVENTS[cupOf(d)].at+3))d++;const id=cupOf(d),D=EVENTS[id],c=el('<div class="sec"><h3>季節の大会</h3><div class="rows"></div></div>');
    c.querySelector('.rows').appendChild(rowEl(D.n,(d===d0?'きょう':d===d0+1?'あした':'あと'+(d-d0)+'日')+'　'+EVAT(D)+'から・'+(cupFew()?'せいれいが'+CUPMIN+'人から':'みんなが出る'),null,'<b style="font-weight:400">'+esc(D.gainTxt)+'</b><br>'));body.appendChild(c)}
  const s=el('<div class="sec"><h3>ひらけるイベント</h3><div class="rows"></div></div>');let rows=s.querySelector('.rows'),rows2=null;body.appendChild(s);
  for(const id of EVORDER.filter(k=>!EVENTS[k].grand).concat(['@g'],EVORDER.filter(k=>EVENTS[k].grand))){if(id==='@g'){const h=el('<div class="sec"><h3>豪華なイベント</h3><div class="rows"></div></div>');body.appendChild(h);rows2=h.querySelector('.rows');continue}if(!evOn(id))continue;const D=EVENTS[id],r=rowEl(D.n,D.d,null,'<b style="font-weight:400">'+esc(evGainTxt(id))+'</b><br>'+esc((D.sea!=null?EVSEA[D.sea]+'だけ・':'')+(D.need?EVNEED[D.need].n+'・':'')+EVAT(D)+'から・'+evCostTxt(id))+'<br>'),b=el('<button class="btn pri">ひらく</button>');
    const why=evWhy(id);if(evDoneNow(id))r.classList.add('done');lackOn(b,why);b.onclick=()=>{if(why)return;sfx('tap');evPop(id)};r.appendChild(b);(rows2||rows).appendChild(r)}}
function evPop(id){/* 出る子をえらぶ */const D=EVENTS[id],mx=evMax(id),L=S.res.filter(evHere),pick0=new Set(L.slice(0,mx).map(r=>r.id));
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:340px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:15px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 8px"></p><div class="ks" style="display:flex;flex-wrap:wrap;gap:6px"></div><p class="note c" style="margin:10px 0 0"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn x">とじる</button><button class="btn pri go">ひらく</button></div></div></div>');
  o.querySelector('.t').textContent=D.n;o.querySelector('.n').textContent=evGainTxt(id)+'（'+mx+'人まで）';
  const bs=L.map(r=>{const b=el('<button class="btn"></button>');b.textContent=r.name;b.onclick=()=>{sfx('notch');if(pick0.has(r.id))pick0.delete(r.id);else if(pick0.size<mx)pick0.add(r.id);upd()};o.querySelector('.ks').appendChild(b);return[r,b]});
  const upd=()=>{for(const[r,b]of bs)b.classList.toggle('pri',pick0.has(r.id));const c=evCost(id,pick0.size);o.querySelector('.c').textContent=pick0.size+'人・パワー（'+Math.floor(S.pt)+'/'+c.pt+'）'+(c.wood?'・木材（'+(S.mat.wood||0)+'/'+c.wood+'）':'')+(c.food?'・食料（'+S.food+'/'+c.food+'）':'')+(D.set?'・'+setTxt(D):'');lackOn(o.querySelector('.go'),!pick0.size?'出るせいれいがいません':cupKind(id)&&pick0.size<CUPMIN?'せいれいが'+CUPMIN+'人からです':lackPt(c.pt)||lackMat('wood',c.wood)||lackMat('bamboo',c.bamboo)||((S.inv.arrow||0)<c.arrow?'木の矢が足りません':'')||(S.food<c.food?'食料が足りません':''))};
  o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('.go').onclick=()=>{const c=evCost(id,pick0.size);if(!pick0.size||cupKind(id)&&pick0.size<CUPMIN||S.pt<c.pt||S.food<c.food||(S.mat.wood||0)<c.wood||(S.mat.bamboo||0)<c.bamboo||(S.inv.arrow||0)<c.arrow)return;if(evOpen(id,[...pick0])){o.remove();renderSheet()}};upd();document.body.appendChild(o)}
/* 季節の大会（cup0〜3）：その季節の5日め（seasonDay 5）の朝に、みんなが出る大会をきめる（パワー・材料いらない、ひらく画面には出ない）。
   4日めの朝に知らせ、4日めにはほかのイベントを5日めにひらけない。順位（E.rank：1位から）で、上がる数（D.rank：1位・2位・3位・出ただけ）。
   春 かけっこ（コースを走る、移動速度でかわる）・夏 すもう（勝ちぬき、攻撃力でかわる）・秋 ものづくり（はたらく速さでかわる）・冬 荷はこびリレー（持てる数と移動速度でかわる）。 */
Object.assign(EVENTS,{
  cup0:{n:'かけっこ大会',cup:1,sea:0,at:10,dur:20,stat:'move',rank:[4,3,2,1],pt:0,per:0,gain:{move:4},gainTxt:'移動速度　1位+4・2位+3・3位+2・出ただけ+1',talk:['よーい、どん！','#joy|まけないよ！','はあ、はあ……。']},
  cup1:{n:'すもう大会',cup:1,sea:1,at:10,dur:40,stat:'atk',rank:[20,15,10,5],pt:0,per:0,gain:{atk:20},gainTxt:'攻撃力　1位+20・2位+15・3位+10・出ただけ+5',talk:['はっけよい！','#joy|のこった、のこった！','おもいっきり、いくよ！']},
  cup2:{n:'ものづくり大会',cup:1,sea:2,at:10,dur:30,stat:'work',rank:[4,3,2,1],pt:0,per:0,gain:{work:4},gainTxt:'はたらく速さ　1位+4・2位+3・3位+2・出ただけ+1',talk:['とんとん、とんとん。','#joy|いいのができそう！','もうすこし……！']},
  cup3:{n:'荷はこびリレー',cup:1,sea:3,at:10,dur:30,stat:'cap',rank:[2,1,1,0],pt:0,per:0,gain:{cap:2},gainTxt:'持てる数　1位+2・2位+1・3位+1',talk:['よいしょ、よいしょ！','#joy|まだまだ、はこべるよ！','つぎ、おねがい！']}});
const seasonDay=d=>((d-1)%SEASONDAYS)+1,CUPDAY=5,cupOf=d=>'cup'+seasonOf(d);
function evMorning(){if(!S||S.free&&false)return;const d=dayNo();
  if(seasonDay(d)===CUPDAY-1&&!cupFew())villageTimeout(()=>toast('あしたは、'+EVENTS[cupOf(d+1)].n+'！','good'),2400);
  if(seasonDay(d)!==CUPDAY)return;const id=cupOf(d);if(evDoneNow(id)||cupFew())return;
  if(S.ev){if(S.ev.ph)return;S.ev.day=Math.max(S.ev.day,d+1)}/* きまっていたイベントは、つぎの日に */
  const keep=S.ev;S.ev={id,day:d,who:S.res.filter(evHere).map(r=>r.id),paid:{pt:0,food:[]},ph:null,cup:1,next:keep||null};(S.evDone||(S.evDone={}))[id]=seasonKey();
  villageTimeout(()=>toast('きょうは、'+EVENTS[id].n+'！','good'),2600)}
/* 大会の場所：まっすぐのコース（よこ L マス × たて n 行。かけっこ・リレー）／ひろば（すもう・ものづくり） */
function evTrack(G,cx,cy,n,L){let best=null,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>50)continue;const x=j%W,y=(j/W)|0;if(x+L>=W||y+n>=H)continue;const h0=hiAt(j);let ok=true;for(let b=0;b<n&&ok;b++)for(let a=0;a<L;a++){const k=(y+b)*W+x+a;if(!walk(k)||S.obj[k]||S.ground[k]||hiAt(k)!==h0||G.dist[k]<0||sacredNoBuild(k)){ok=false;break}}if(!ok)continue;const s=Math.hypot(x+L/2-cx,y+n/2-cy);if(s<bd){bd=s;best={x,y}}}return best}
function cupStart(E,L,G,tx,ty){const D=EVENTS[E.id];E.sc={};E.order=[];
  if(E.id==='cup0'||E.id==='cup3'){const n=Math.min(L.length,8),len=E.id==='cup0'?10:7;let t=evTrack(G,tx,ty,n,len),m=n;if(!t){for(m=n-1;m>=2&&!t;m--)t=evTrack(G,tx,ty,m,len);m++}if(!t)return false;E.tk={x:t.x,y:t.y,n:m,len};
    L.forEach((r,i)=>{E.slot[r.id]=(t.y+i%m)*W+t.x;E.lane=E.lane||{};E.lane[r.id]=i%m});E.c=[t.x+len/2,t.y+m/2];return true}
  const p=evOpenArea(G,tx,ty);if(!p)return false;E.c=p;
  if(E.id==='cup1'){E.bk=L.map(r=>r.id).sort(()=>Math.random()-.5);E.rd=0;E.loss=[];return cupRound(E,G)}
  const SL=evSlots(G,p[0],p[1],L.length,4);L.forEach((r,i)=>{if(SL[i]!=null)E.slot[r.id]=SL[i]});return SL.length>0}
function cupRound(E,G){/* すもう：のこっている子を2人ずつ、ひろばのまん中で向かいあわせる（ひとりあまれば、そのまま勝ちあがり） */const[cx,cy]=E.c,live=E.bk;E.pairs=[];E.slot={};for(let i=0;i+1<live.length;i+=2)E.pairs.push([live[i],live[i+1]]);
  const P=E.pairs.length;E.pairs.forEach(([a,b],i)=>{const y=Math.floor(cy)-Math.floor(P/2)+i,x=Math.floor(cx);E.slot[a]=y*W+x-1;E.slot[b]=y*W+x});
  const watch=E.who.filter(id=>!E.pairs.some(p=>p.includes(id))),WS=evSlots(G,cx,cy+2.5,watch.length,4,j=>!Object.values(E.slot).includes(j));watch.forEach((id,i)=>{if(WS[i]!=null)E.slot[id]=WS[i]});return true}
function cupBout(E,P){/* 勝ち負け：攻撃力+0〜30（水のせいれいも勝てる） */const S2=id=>{const r=P.find(q=>q.id===id);return r?rStat(r,rLv(r)).atk+Math.random()*30:0};const win=[];for(const[a,b]of E.pairs){const wa=S2(a)>=S2(b);win.push(wa?a:b);E.loss.push({id:wa?b:a,rd:E.rd})}
  const rest=E.bk.filter(id=>!E.pairs.some(p=>p.includes(id)));E.bk=win.concat(rest);E.rd++;
  for(const p of E.pairs){const w=P.find(q=>q.id===win[E.pairs.indexOf(p)]);if(w){JUMP.set(w,performance.now());addFloat(w.x,w.y-1.6,'かった！','#ffe7a8')}}}
function cupRanks(E,P){/* 1位から順の id。のこりは「出ただけ」 */
  if(E.id==='cup1'){const champ=E.bk[0],R=[champ];const L=E.loss.slice().sort((a,b)=>b.rd-a.rd);for(const l of L)R.push(l.id);return R}
  if(E.id==='cup0'){const fin=E.order.slice(),rest=P.filter(r=>!fin.includes(r.id)).sort((a,b)=>b.x-a.x).map(r=>r.id);return fin.concat(rest)}
  return P.slice().sort((a,b)=>(E.sc[b.id]||0)-(E.sc[a.id]||0)).map(r=>r.id)}
function cupPlace(E,R,id){/* 0:1位 1:2位 2:3位 3:出ただけ。すもうは、じゅんけっしょうで負けた2人とも3位 */const i=R.indexOf(id);if(i<0)return 3;if(E.id==='cup1'&&i>0){const l=E.loss.find(q=>q.id===id),top=E.loss.length?Math.max(...E.loss.map(q=>q.rd)):0;if(!l)return 3;return l.rd===top?1:l.rd===top-1?2:3}return Math.min(3,i)}
function cupTick(E,P,dt){const D=EVENTS[E.id];/* 1秒ごと：すもうの勝負・おわり */
  if(E.id==='cup1'){if(S.t-E.t0>=12){cupBout(E,P);for(const r of P)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}if(E.bk.length<=1)return evEnd();cupRound(E,bfs(P[0].x|0,P[0].y|0));E.ph='go';E.t0=S.t;E.at={}}return}
  if(E.id==='cup0'&&P.every(r=>E.order.includes(r.id)))return evEnd();
  if(S.t-E.t0>=D.dur)return evEnd()}
function cupMove(r,a,dt){const E=S.ev;/* 毎コマ：走る・はこぶ・作る */
  if(E.id==='cup0'){if(E.order.includes(r.id))return;const end=E.tk.x+E.tk.len-.5,v=dt*.55*rMul(r,'move')*(.85+.3*Math.random());r.face=1;r.x=Math.min(end,r.x+v);if(r.x>=end){E.order.push(r.id);addFloat(r.x,r.y-1.5,E.order.length+'着！','#ffe7a8');JUMP.set(r,performance.now())}return}
  if(E.id==='cup3'){const x0=E.tk.x+.5,x1=E.tk.x+E.tk.len-.5;if(a.dir==null)a.dir=1;const v=dt*.45*rMul(r,'move');r.face=a.dir;r.x+=a.dir*v;if(a.dir>0&&r.x>=x1){r.x=x1;a.dir=-1;E.sc[r.id]=(E.sc[r.id]||0)+capOf(r);addFloat(r.x,r.y-1.5,'+'+capOf(r),'#ffe7a8')}else if(a.dir<0&&r.x<=x0){r.x=x0;a.dir=1}return}
  if(E.id==='cup2'){E.sc[r.id]=(E.sc[r.id]||0)+dt*rMul(r,'work')*(.8+.4*Math.random())}}
/* しごとの称号：同じ仕事を TITLEN 回すると称号。その仕事のはたらく速さ+2（gJob が、はたらく速さに2をたした速さにする）。r.jc：仕事ごとの回数、r.ttl：もっている称号 */
const TITLEN=100,TITLEUP=2;
const TITLES={kikori:{n:'きこりの名人',d:'木を切るとき、はたらく速さ+2',jobs:['chop']},ishi:{n:'石ほりの名人',d:'石をほるとき、はたらく速さ+2',jobs:['mine']},
  hata:{n:'畑の名人',d:'畑の仕事のとき、はたらく速さ+2',jobs:['till','sow','plant','water','tend','harvest','fert']},ryori:{n:'料理の名人',d:'料理のとき、はたらく速さ+2',jobs:['cook']},
  daiku:{n:'大工の名人',d:'建てる・作る・直すとき、はたらく速さ+2',jobs:['build','craft','repair']},tsuri:{n:'つりの名人',d:'つりのとき、はたらく速さ+2',jobs:['fish']}};
const TJOB={};for(const k in TITLES)for(const j of TITLES[k].jobs)TJOB[j]=k;/* 仕事 → 称号（さがす表） */
function titleNote(r,a){const k=TJOB[a&&a.type];if(!k||!r||IS_STORY_REPLAY||a.stage!=='do')return;const C=r.jc||(r.jc={});C[k]=(C[k]||0)+1;if(C[k]<TITLEN||(r.ttl||{})[k])return;
  (r.ttl||(r.ttl={}))[k]=1;const T=TITLES[k];memo('',r.name+'が「'+T.n+'」になった');villageTimeout(()=>{if(!S.res.includes(r))return;toast(r.name+'が「'+T.n+'」になった！','good');JOYU.set(r,performance.now()+3000);addFloat(r.x,r.y-1.6,T.n,'#ffe7a8');sfx('level')},400)}
function titleMul(r,t){const k=TJOB[t];if(!k||!r||!r.ttl||!r.ttl[k])return 1;const w=rStat(r,rLv(r)).work;return(w+TITLEUP)/w}/* その仕事は、はたらく速さに2をたした速さ */
function titleSec(r,g){for(const k in TITLES){if(!(r.ttl||{})[k])continue;const T=TITLES[k],d=el('<div class="stat" style="display:block"><span style="display:block">称号</span><b style="display:block;text-align:left;margin-top:2px"></b><small style="display:block;color:var(--sub,#888);margin-top:2px"></small></div>');d.querySelector('b').textContent=T.n;d.querySelector('small').textContent=T.d;g.appendChild(d)}}
/* 豪華なイベント（grand）：1季節に1回、みんなが出る。かかる物は人数によらず決まった数（D.set：食料・木材・竹・草・花・作物）。 */
const EVGRASS=()=>WD===1?'kuru':'shina';
Object.assign(EVENTS,{
  undo:{n:'村の運動会',grand:1,d:'かけっこ・つなひき・玉入れを、赤と白の組にわかれてする。',sea:2,at:9,dur:90,pt:300,per:0,set:{food:40},gain:{work:1,move:1,sta:1,atk:5},gainTxt:'はたらく速さ・移動速度・スタミナ+1・攻撃力+5（かった組は、はたらく速さ・移動速度・スタミナ+2・攻撃力+10）',talk:['#joy|がんばれー！','赤組、ファイト！','白組も、まけないよ！']},
  hana:{n:'花まつり',grand:1,stage:0,d:'花のアーチの下で、花かんむりをつけておどる。',sea:0,at:10,dur:60,pt:200,per:0,set:{flower:10},need:'flower30',gain:{sta:2},fun:40,talk:['#joy|花かんむり、にあう？','いいにおい……。','春って、すてきだね。']},
  lantern:{n:'ランタンとばしの夜',grand:1,d:'夜空に、みんなでランタンをとばす。',sea:3,at:20,late:1,dur:60,pt:250,per:0,set:{wood:30,grass:20},gain:{work:2},bond:10,talk:['ねがいごと、なににする？','#joy|とんでった！','空が、あかるくなったね。']},
  shukaku:{n:'しゅうかく祭',grand:1,d:'畑のみのりを集めて、みんなで大ごちそう。',sea:2,at:11,dur:60,pt:200,per:0,set:{crop:30},need:'farm10',gain:{cap:1,sta:1},talk:['#joy|ことしも、いっぱいとれたね！','おいしい！','畑さん、ありがとう。']},
  himatsuri:{n:'火まつり',grand:1,stage:1,d:'たき火とかがり火のまわりで、たいこにあわせておどる。',sea:1,at:19,late:1,dur:90,pt:300,per:0,set:{wood:40,bamboo:20},need:'fire4',gain:{atk:10},talk:['どん、どん！','#joy|火が、たかくあがった！','からだが、あつくなってきた！']},
  utage:{n:'温泉宿の大うたげ',grand:1,stage:1,d:'温泉であたたまって、食卓をかこんで大うたげ。',sea:3,at:15,dur:90,pt:250,per:0,set:{food:50},need:'utage',gain:{sta:2},talk:['#joy|かんぱーい！','ごちそうが、いっぱい！','ほかほかで、しあわせ……。']}});
Object.assign(EVENTS,{hanabi:{n:'花火の夜',grand:1,stage:0,d:'たき火から花火をあげて、みんなで夜空を見上げる。',sea:1,at:20,late:1,dur:60,pt:300,per:0,set:{eda:20,can:10},need:'hanabi',gain:{atk:5,sta:1},fun:30,talk:['#surprise|わあっ、ひらいた！','#joy|いまの、大きかったね！','どーん、って、おなかにひびく。','つぎは、なに色かな。']}});
EVORDER.push('undo','hana','lantern','shukaku','himatsuri','utage','hanabi');
Object.assign(EVNEED,{flower30:{n:'花30本',list:()=>{const L=[];for(let j=0;j<S.obj.length;j++)if(FLOWERS.has(S.obj[j]))L.push(j);return L.length>=30?L:[]},cap:()=>99},
  farm10:{n:'畑10マス',list:()=>{const L=[];for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'||S.obj[j]==='plot')L.push(j);return L.length>=10?L:[]},cap:()=>99},
  fire4:{n:'たき火・かがり火3つ',list:()=>{const c=evObjs('campfire'),l=evObjs('lamp');return c.length&&l.length>=3?c.slice(0,1):[]},cap:()=>99},
  hanabi:{n:'たき火',list:()=>evObjs('campfire').filter(j=>!campOut(j)).slice(0,1),cap:()=>99},
  utage:{n:'よみがえった温泉3つ・食卓2つ',list:()=>['a','b','c'].every(springOn)&&evTables().length>=2?evTables():[],cap:()=>99}});
const SETN={eda:'枝',can:'空き缶',food:'食料',wood:'木材',bamboo:'竹',grass:'草',flower:'花の種',crop:'作物'},EVCROP=['mugi','imo','tomato'];
function setHave(k){if(k==='food')return S.food;if(k==='grass')return S.mat[EVGRASS()]||0;if(k==='flower')return[...FLOWERS].reduce((a,id)=>a+inv(id),0);if(k==='crop')return EVCROP.reduce((a,c)=>a+(S.fs[c]||0),0);return S.mat[k]||0}
function setName(k){return k==='grass'?MATN[EVGRASS()]:k==='flower'?'花の種':SETN[k]}
function setLack(D){for(const k in D.set||{})if(setHave(k)<D.set[k])return setName(k)+'が足りません';return ''}
function setPay(D){const P={};for(const k in D.set||{}){let n=D.set[k];if(k==='food'){P.food=takeFood(n);continue}if(k==='grass'){const g=EVGRASS();S.mat[g]-=n;P[g]=n;continue}
  if(k==='flower'||k==='crop'){const L=k==='flower'?[...FLOWERS]:EVCROP,out={};for(const id of L){const have=k==='flower'?inv(id):(S.fs[id]||0),t=Math.min(have,n);if(t<=0)continue;if(k==='flower')S.inv[id]-=t;else S.fs[id]-=t;out[id]=t;n-=t;if(n<=0)break}if(k==='crop')syncFood();P[k]=out;continue}S.mat[k]-=n;P[k]=n}return P}
function setRefund(P){for(const k in P||{}){if(k==='food'){for(const f of P.food)addFood(f,1);continue}if(k==='flower'){for(const id in P.flower)S.inv[id]=(S.inv[id]||0)+P.flower[id];continue}if(k==='crop'){for(const id in P.crop)addFood(id,P.crop[id]);continue}S.mat[k]=(S.mat[k]||0)+P[k]}}
function setTxt(D){return Object.keys(D.set||{}).map(k=>setName(k)+D.set[k]).join('・')}
/* 運動会：3つの競技（かけっこ → つなひき → 玉入れ）。組ごとに勝ち数。かけっこは cup0 と同じコース */
const UNDOSEG=['race','tug','ball'],UNDON={race:'かけっこ',tug:'つなひき',ball:'玉入れ'};
function undoStart(E,L,G,tx,ty){E.team={};L.forEach((r,i)=>E.team[r.id]=i%2);E.seg=0;E.win=[0,0];E.c=evOpenArea(G,tx,ty);if(!E.c)return false;return undoSlots(E,L,G)}
function undoSlots(E,L,G){E.slot={};E.order=[];E.sc=[0,0];const sg=UNDOSEG[E.seg],[cx,cy]=E.c;
  if(sg==='race'){const n=Math.min(L.length,8);let t=evTrack(G,cx,cy,n,10);if(!t)t=evTrack(G,cx,cy,Math.min(n,4),10);if(!t)return false;E.tk={x:t.x,y:t.y,n:Math.min(n,4),len:10};L.forEach((r,i)=>{E.slot[r.id]=(t.y+i%E.tk.n)*W+t.x});return true}
  if(sg==='tug'){/* 赤は左、白は右に1列。まん中に綱 */const y=Math.floor(cy);const red=L.filter(r=>E.team[r.id]===0),wh=L.filter(r=>E.team[r.id]===1);red.forEach((r,i)=>E.slot[r.id]=y*W+Math.floor(cx)-1-i);wh.forEach((r,i)=>E.slot[r.id]=y*W+Math.floor(cx)+1+i);
    for(const id in E.slot){const j=E.slot[id];if(!walk(j)||S.obj[j]||G.dist[j]<0){const k=evSlots(G,cx,cy,1,4,q=>!Object.values(E.slot).includes(q))[0];if(k!=null)E.slot[id]=k}}return true}
  const SL=evSlots(G,cx,cy,L.length,3);L.forEach((r,i)=>{if(SL[i]!=null)E.slot[r.id]=SL[i]});return SL.length>0}
function undoTick(E,P){const sg=UNDOSEG[E.seg],seg=30;
  if(sg==='race'&&!P.every(r=>E.order.includes(r.id))&&S.t-E.t0<seg)return;if(sg!=='race'&&S.t-E.t0<seg)return;
  let w;if(sg==='race'){const pt=[0,0];E.order.forEach((id,i)=>pt[E.team[id]]+=P.length-i);w=pt[0]>=pt[1]?0:1}else{for(const r of P){const st=rStat(r,rLv(r));E.sc[E.team[r.id]]+=(sg==='tug'?st.atk+st.cap*5+Math.random()*40:st.work+Math.random()*8)}w=E.sc[0]>=E.sc[1]?0:1}
  E.win[w]++;toast(UNDON[sg]+'は、'+(w?'白組':'赤組')+'のかち！','good');sfx('good');for(const r of P)if(E.team[r.id]===w)JUMP.set(r,performance.now()+Math.random()*300);
  if(E.seg>=UNDOSEG.length-1)return evEnd();E.seg++;for(const r of P)if(r.act&&r.act.type==='evt'){endAct(r);r.act=null;r.path=[]}if(!undoSlots(E,P,bfs(P[0].x|0,P[0].y|0)))return evEnd();E.ph='go';E.t0=S.t;E.at={}}
function undoMove(r,a,dt){const E=S.ev;if(UNDOSEG[E.seg]!=='race'||E.order.includes(r.id))return;const end=E.tk.x+E.tk.len-.5;r.face=1;r.x=Math.min(end,r.x+dt*.55*rMul(r,'move')*(.85+.3*Math.random()));if(r.x>=end){E.order.push(r.id);addFloat(r.x,r.y-1.5,E.order.length+'着！','#ffe7a8')}}
function grandFx(E,P){/* 1秒ごとの見せ場：花びら・火の粉・ランタンの光（小さなエフェクト） */if(E.ph!=='do')return;if(E.id==='hanabi')return hanabiFx(E);const n=E.id==='himatsuri'?'embers':E.id==='hana'||E.id==='lantern'?'twinkle':null;if(!n||Math.random()<.5)return;const r=pick(P);if(!r)return;
  if(E.id==='lantern'){for(let k=0;k<3;k++)villageTimeout(()=>fxSpr(n,r.x*TS,(r.y-1.2-k*1.1)*TS),k*300)}else fxSpr(n,(r.x+(Math.random()-.5)*2)*TS,(r.y-.4)*TS)}
const HANABIC=['#ff8a9a','#8ac8ff','#ffd86a','#c49cff','#9ef0b0','#ffb070'];
function hanabiFx(E){/* 花火の夜：たき火（E.c）の上の空に、色のちがう花火を1秒に0〜2発。見るせいれいは上を向く */const[x,y]=E.c||evTemple();const n=Math.random()<.35?2:Math.random()<.75?1:0;const one=()=>fxSpr('hanabi',(x+(Math.random()-.5)*7)*TS,(y-2.5-Math.random()*2)*TS,pick(HANABIC));if(n)one();if(n>1)villageTimeout(one,450)}
/* 家具でひらくイベント（新しい家具：弓の的・ピクニックシート・たいこ・茶道具の台・ほこら） */
Object.assign(EVENTS,{
  matoate:{n:'的あて',d:'弓の的のまえで、木の矢で的をねらう。',at:14,dur:30,pt:30,per:5,arrow:5,need:'mato',gain:{atk:5},talk:['ねらって……えいっ！','#joy|まんなか、あたった！','#surprise|あっ、それた！']},
  pikunikku:{n:'ピクニック',d:'シートをひろげて、花のそばでおべんとう。',sea:0,stage:0,at:12,dur:40,pt:50,per:8,food:2,need:'picnic',gain:{sta:1},fun:20,talk:['#joy|おべんとう、おいしい！','風が、きもちいいね。','ねころびたくなっちゃう。']},
  taikokai:{n:'たいこの会',d:'たいこをたたいて、みんなでおどる。',stage:1,at:16,dur:30,pt:50,per:8,bamboo:1,need:'taiko',gain:{atk:5},talk:['どん、どん、どん！','#joy|からだが、はずむ！','もっと、つよく！']},
  ocha:{n:'お茶のけいこ',d:'茶道具の台のまえで、しずかにお茶をたてる。',stage:1,at:14,dur:30,pt:50,per:8,food:1,need:'chadogu',gain:{work:1},talk:['しゃか、しゃか……。','いい香り。','こころが、おちつくね。']},
  hokomairi:{n:'ほこらまいり',d:'朝、みんなでほこらにおまいりする。',stage:1,at:6.5,dur:20,pt:30,per:5,need:'hokora',gain:{sta:1},talk:['きょうも、いい日になりますように。','……。','#joy|なんだか、げんきが出てきた。']}});
EVORDER.splice(EVORDER.indexOf('undo'),0,'matoate','pikunikku','taikokai','ocha','hokomairi');
Object.assign(EVNEED,{mato:{n:'弓の的',list:()=>evObjs('mato'),cap:()=>3},picnic:{n:'ピクニックシート',list:()=>evObjs('picnic'),cap:()=>6},taiko:{n:'たいこ',list:()=>evObjs('taiko'),cap:()=>6},chadogu:{n:'茶道具の台',list:()=>evObjs('chadogu'),cap:()=>4},hokora:{n:'ほこら',list:()=>evObjs('hokora'),cap:()=>99}});
