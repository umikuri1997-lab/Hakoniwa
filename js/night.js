'use strict';

/* ---------- せいれいがやってくる ---------- */
/* 属性の力がたまると、次の朝に神殿に「！」が出て、タップで召喚できる。
   埋葬されたせいれいがいれば、そちらの復活が先（物語のせいれいが最優先） */
let KEYRES=KEYS[0];
const isKey=n=>KEYRES.includes(n)||KEYS.flat().includes(n)||Object.values(FIXK0).includes(n)||Object.values((S&&S.keyN)||{}).includes(n);/* キーキャラ（5属性の子もふくむ）は「きずな」で朝にもどる */
const SECOND=[{elem:'earth',name:MINA,ok:()=>bloomCount('bellf')>=2&&qDone('kikyo')},/* ききょうのお礼の話がすんでから */{elem:'water',name:SHIZUKU,ok:()=>!!S.flags.onsen}];/* 2人目のキーキャラが来るきっかけ */
const MAINEL=['wood','fire'];MAINEL[FREE]='wood';SECOND[FREE]={elem:'earth',name:'',ok:()=>false};
function sumElem(){
  if(S.res.length>=30)return null;let best=null,bs=0;
  for(const el of ELEM_KEYS){if(!S.flags.minaCame){const sc=SECOND[WD];if(el===sc.elem&&sc.ok()){best=el;break}continue}/* 2人目のキーキャラが先（草原：ききょう2つで土の子、火山：温泉で水のせいれい） */if(elemCount(el)>=(WD===FREE?(el==='wood'?6:3):el===MAINEL[WD]?10:5))continue;/* よべる数は、えらぶ画面（sumCands）と同じ */const n=needFor(el),v=ATTR[el];if(v>=n&&v/n>bs){bs=v/n;best=el}}
  return best}
function sumCands(){return ELEM_KEYS.map(el=>{const cap=elemCount(el)>=(WD===FREE?(el==='wood'?6:3):el===MAINEL[WD]?10:5),n=needFor(el),v=ATTR[el];return {el,v,n,cap,ok:!cap&&v>=n}})}/* 呼べる属性の候補（いまの力と目もり） */
function checkSummon(){
  if(!S||!S.feat.summon||S.summonNext||S.summon)return;const el=sumElem();if(!el)return;S.summonNext=el}
function summonMorning(){
  if(S.summon)return;
  if(S.buried&&S.buried.some(q=>!q.unb))S.summon={rev:1};
  else if(S.summonNext){S.summon={elem:S.summonNext};S.summonNext=null}
  else if(S&&S.feat.summon){const el=sumElem();if(el)S.summon={elem:el}}/* 呼べるかは、その朝にたまっている力だけで決まる（日中にためた分は次の朝） */
  if(S.summon){sfx('arrive');toast('神殿に「！」が出ている','good')}}
const sumHit=(wx,wy)=>S.summon&&STATUE>=0&&Math.hypot(wx-(STATUE%W+.5),wy-(((STATUE/W)|0)-.6))<1.6;
function doSummon(){
  const sm=S.summon;if(!sm)return;
  if(!sm.rev&&!sm.pick&&S.flags.minaCame&&(sumCands().filter(c=>c.ok).length>1||S.mebuki>0&&(S.lost||[]).some(q=>!q.unb))){openSheet('summon');return}/* 力が届いた属性がいくつかあるか、めぶきのしずくでよみがえらせられる子がいれば、えらぶ */
  S.summon=null;let r;
  const sx0=STATUE>=0?STATUE%W:CX,sy0=STATUE>=0?((STATUE/W)|0)+3:CY;let sp=null;
  for(let rr=0;rr<10&&!sp;rr++){const c=[];for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;const x=sx0+dx,y=sy0+dy;if(x<1||y<1||x>=W-1||y>=H-1)continue;const j=y*W+x;if(walk(j)&&!S.obj[j]&&!S.res.some(q=>(q.x|0)===x&&(q.y|0)===y)&&!(godHere()&&Math.hypot(x+.5-godX(),y+.5-godY())<2.2))c.push([x,y])}if(c.length)sp=pick(c)}
  if(!sp)sp=[CX,CY];
  if(sm.rev){let d;if(sm.lost){const L=S.lost,i=typeof sm.lost==='string'?L.findIndex(q=>q.name===sm.lost):0;d=L.splice(Math.max(0,i),1)[0];}else{const B=S.buried;B.sort((a,b)=>(isKey(b.name)?1:0)-(isKey(a.name)?1:0)||(a.unb?1:0)-(b.unb?1:0));d=B.shift()}
    r=mkRes(S,d.name,d.elem,sp[0]+.5,sp[1]+.5,d.like);r.vr=d.vr||r.vr;r.xp=d.xp||0;r.xpf=d.xpf||0;if(d.bst)r.bst=d.bst;if(d.sst)r.sst=d.sst;if(d.boost)r.boost=d.boost;r.back=1;r.came=d.came;r.made=d.made;r.beat=d.beat;r.reMate=d.mate||null;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='grave'&&S.dyn[j]&&!S.dyn[j].buried&&S.dyn[j].name===d.name){S.obj[j]='';delete S.dyn[j];recount()}for(const q of S.res)if(q.coffin&&q.coffin.name===d.name)q.coffin=null;/* 埋葬の前にもどってきた子のお墓は、なくなる */
    toast(r.name+'がもどってきた！','good');sevBack(r.name);reunite(r,sp)}
  else{let name;if(sm.elem===SECOND[WD].elem&&!S.flags.minaCame){name=SECOND[WD].name;S.flags.minaCame=true;S.flags.mnN=S.nights||0}/* 来た夜の数をおぼえておく（e04b） */
    else if(!WD&&FIXK0[sm.elem]&&!S.res.some(q=>q.elem===sm.elem)&&!(S.buried||[]).some(q=>q.elem===sm.elem&&isKey(q.name))&&!(S.lost||[]).some(q=>q.elem===sm.elem&&isKey(q.name)))name=FIXK0[sm.elem];/* その属性のキーキャラは、決まった子 */
    else{const used=new Set(S.res.map(q=>q.name).concat((S.buried||[]).map(q=>q.name)));do{name=NAMES[S.nameIdx%NAMES.length]+(S.nameIdx>=NAMES.length?'2':'');S.nameIdx++}while(used.has(name)||KEYS.flat().includes(name)||Object.values(FIXK0).includes(name))}
    r=mkRes(S,name,sm.elem,sp[0]+.5,sp[1]+.5);toast(ELEM[sm.elem].name+'のせいれい「'+name+'」がやってきた！','good')
    if(sm.elem==='fire'&&S.crops&&!S.crops.mugi){S.crops.mugi=S.crops.tomato=true}}/* 火のせいれいが来たら、パン・スープの作物がふえる */
  if(STATUE>=0&&S.obj[STATUE+W]==='altar'){r.x=STATUE%W+.5;r.y=((STATUE/W)|0)+1.12;sp=[STATUE%W,((STATUE/W)|0)+1]}/* 神殿のまんなか（台座の上）からあらわれる */
  r.hunger=75;r.spawnT=performance.now();if(!r.came)r.came=dayNo();if(!r.back)S.lastCame=dayNo();S.res.push(r);S.summons=(S.summons||0)+1;memo(r.back?'🌱':'🌟',r.back?r.name+'がもどってきた':r.name+'（'+ELEM[r.elem].name+'のせいれい）が村にやってきた');logEv(r.back?r.name+'がもどってきた':r.name+'（'+ELEM[r.elem].name+'のせいれい）がやってきた');NEWQ.push({id:r.id,t:performance.now()+1300});HOLD.add(r.id);/* ステータスをとじるまで、わーいのポーズで止まる */
  spawnFX(sp[0],sp[1],ELEM[r.elem].col);centerOn((sp[0]+.5)*TS,(sp[1]+.5)*TS);sfx('arrive');recount();
}

/* ---------- 敵（「コワイノ」） ---------- */
const EN={
  basic:{pw:4,name:'コカゲ',hp:10,sp:.80,atk:25,hit:20,hitF:10,hitN:12,hitFS:5,hitNS:6,col:'#2a1d46',eye:'#ff6b8a',size:1},
  fast:{pw:3,name:'ハヤカゲ',hp:5,sp:1.6,atk:16.7,/* コカゲの足2倍・攻撃1.5倍の速さ */hit:14,hitF:7,hitN:8,hitFS:4,hitNS:4,col:'#1d3446',eye:'#7ff0ff',size:.8},
  thief:{pw:2,name:'カゲドロボウ',hp:3,sp:.88,atk:25,hit:10,hitF:5,hitN:6,hitFS:3,hitNS:3,col:'#3b2a14',eye:'#ffd35c',size:.9,thief:1},
  brute:{pw:6,rng:1.2,name:'カタカゲ',hp:10,sp:.76,atk:9,hit:28,hitF:14,hitN:17,hitFS:7,hitNS:8,col:'#3a1a1a',eye:'#ff8a3d',size:1.25,hs:1}/* 当たり判定は1マス */,
  breaker:{pw:5,name:'カベクダキ',hp:9,sp:.8,atk:6,hit:18,hitF:9,hitN:11,hitFS:5,hitNS:5,col:'#3a2a1a',eye:'#ffa04a',size:1.1,wall:3},/* 壁や柵をこわすのが得意（こわす力3倍・速い）。よけずにまっすぐこわしにくる */
  trapper:{pw:5,name:'ワナクイ',hp:8,sp:.9,atk:12,hit:16,hitF:8,hitN:10,hitFS:4,hitNS:5,col:'#2b3a1e',eye:'#c6ff6b',size:.95,trapper:1},/* 罠・見張り台を先にこわしにくる */
  boss:{pw:20,rng:2.1,name:'オオカゲ',hp:40,sp:.84,atk:7,hit:14,hitF:7,hitN:8,hitFS:4,hitNS:4,col:'#120a24',eye:'#ff3b6b',size:1.8,boss:1},
  ash:{pw:3,name:'ハイカゲ',hp:6,sp:.9,atk:20,hit:12,hitF:6,hitN:7,hitFS:3,hitNS:4,col:'#6d6a66',eye:'#ffb36b',size:.9,ash:1},/* かまど・ベンチなどを灰でよごして止める */
  rockc:{pw:8,name:'イワカゲ',hp:22,sp:.5,atk:30,hit:30,hitF:15,hitN:18,hitFS:8,hitNS:9,col:'#5a4636',eye:'#ffcf6b',size:1.3},/* おそいけど、かたい */
  hino:{pw:25,rng:2.3,name:'ヒノオオカゲ',hp:60,sp:.7,atk:6,hit:40,hitF:20,hitN:24,hitFS:10,hitNS:12,col:'#3a0c08',eye:'#ffb02e',size:2.1,boss:1,dev:1},/* 火山から下りてきて、熱の装置をねらう */
  yama:{pw:30,rng:2.4,name:'ヤマノオオカゲ',hp:60,sp:.75,atk:6,hit:20,hitF:10,hitN:12,hitFS:5,hitNS:6,col:'#2a0904',eye:'#ff6a2e',size:2.4,boss:1,vol:1},/* 火山のふもとの最後の夜に、火の山からおりてきて、温泉の熱をうばう */
  boss2:{pw:30,rng:3.4,hx:2.6,hy:.8,name:'ヨルノオオカゲ',hp:90,sp:.9,atk:4.5,hit:30,hitF:15,hitN:18,hitFS:8,hitNS:9,col:'#05030c',eye:'#ffd84a',size:4.6,boss:1},/* ヌシ様をむかえる準備ができたあとに来る */
};
function bossDays(){const w=S.bossWarn;if(w==null)return '';const t=dayNo();if(!(S.res.length>=4&&S.res.some(q=>q.elem==='fire')&&KEYS[WD].every(n=>S.res.some(r=>r.name===n))))return 'オオカゲ：なかまが4人そろうまで来ない';let d=t;if(S.res4Since!=null)d=Math.max(d,S.res4Since+3);while(!bossNight(d))d++;return d===t?'オオカゲが来るまで：今夜':'オオカゲが来るまで：あと'+(d-t)+'日'}/* クエストの進みぐあいに、オオカゲが来る日を出す */
const bossNight=d=>{const w=S&&S.bossWarn,k=S&&(S.ookDay||(S.enKills||{}).boss&&S.bossDay);if(k)return d-k>=5&&(d-k)%5===0;/* オオカゲをはじめて追いはらったあとは、5日ごと（S.ookDay：その日。前のセーブは、オオカゲをたおしていれば S.bossDay） */return w==null?d>=5&&(d-5)%3===0:d-w>=3&&(d-w-3)%2===0}/* オオカゲは「来るかも」と聞いた3日後、そのあと2日ごと（火山のふもとは5日目、そのあと3日ごと）。はじめて追いはらったら、そのあとは5日ごと */;
function waveFor(day){
  if(!S.nights)return WD===1?['basic','basic','basic']:['basic'];/* 最初の夜は1体だけ（火山のふもとは3体） */
  if(day<2)return [];
  const rn=S.res.length,story=Math.min(1,(S.quest||0)/Math.max(1,QUESTS.length)),prog=Math.pow(story,1.4)/* 進みはじめはゆっくり、後半で段階的に強くなる */,late=(S.bossDay||(S.bossKills?(S.bossDay=day):0))?1+Math.floor(prog*3):0/* オオカゲを倒したあとの追加数 */,
    n=Math.floor(rn*1.5),list=[];/* コワイノの数は、せいれいの数の1.5倍（小数点以下切りすて） *//* せいれいの数と進行度に合わせて、敵の数をゆっくり増やす（火山のふもとは、草原より2体多い） */let ntr=1+Math.floor(prog*2);/* ワナクイは罠を置いたかどうかでなく、村の進行度に合わせて出す */S.lateWave=late;
  for(let i=0;i<n;i++){let t='basic';if(prog>=.18&&i%3===1)t='thief';if(prog>=.3&&i%3===2)t='fast';if(prog>=.5&&i%4===3)t='brute';if(prog>=.42&&i%5===4&&ntr>0){t='trapper';ntr--}if(prog>=.68&&i%6===5)t='breaker';list.push(t)}/* 敵の種類も、進行に合わせて少しずつ増える */
  if(WD===1){for(let i=0;i<list.length;i++)if(list[i]==='brute')list[i]='rockc';const st=st2();/* 火山のふもと：カタカゲのかわりにイワカゲ。ハイカゲ・ヒノオオカゲはお話しだいで */
    if(S.flags.ashOn){const big=S.flags.ashNight&&!st.ashNightAt,na=big?6:Math.min(3,1+(day>>2));for(let i=0;i<na;i++)list.unshift('ash');/* 前に入れる（人数が少ない夜の上限でけずられないように） */if(big)st.ashNightAt=(S.nights||0)+1}
    if(S.flags.hinoNight&&!S.flags.hinoDown)list.unshift('hino');
    else if(S.flags.hinoDown&&bossNight(day-1)&&rn>=5)list.unshift('boss');
    return list}
  const bq=QUESTS.find(q=>q.id==='ookage'),bOK=S.cleared||!bq||qAt(bq.id);/* オオカゲのクエストが出るまでは来ない */
  if(bq&&bOK&&!S.bossKills&&S.bossWarn==null)S.bossWarn=dayNo();
  if(bossNight(day-1)||S.bossOwed){if(bOK&&rn>=4&&S.res.some(q=>q.elem==='fire')&&S.res4Since!=null&&dayNo()-S.res4Since>=3&&KEYS[WD].every(n=>S.res.some(r=>r.name===n))){/* メインの子をふくめて4人そろい、火の子が1人以上いて3日たったら、自動で来る（全滅したあとは、その状態にもどってから3日あと） */list.unshift('boss');S.bossOwed=false}else if(bOK)S.bossOwed=true}/* クエストが出る前の分はためない（クエストが出てから3日後に来る） *//* dayは次の日。5日目の夜＝day6。せいれいが3人そろうまで、オオカゲは来るのを先のばし */
  return list;
}
function waveText(list){const c={};list.forEach(t=>c[t]=(c[t]||0)+1);return Object.keys(c).map(t=>EN[t].name+(c[t]>1?'×'+c[t]:'')).join('、')}
function waveArrivalDelay(index,total,hasBoss,late=0){const spacing=Math.min(late>0?Math.max(12,35-late*2):35,(hasBoss?180:220)/Math.max(1,total-1));return index*spacing}/* 夜0時ごろから4時までに全員が到着。ボスの登場演出ぶんも見込む */
function spawnWave(list){SKIP=false;/* コワイノが来たら、早送りをやめる */
  const hasBoss=list.some(type=>EN[type].boss);list.forEach((type,k)=>{const d=EN[type];S.enemies.push({id:S.nid++,type,x:0,y:0,hp:d.hp,max:d.hp,delay:waveArrivalDelay(k,list.length,hasBoss,S.lateWave)+(d.boss?60:0),/* 強い夜も、いっせいに押し寄せない */spawned:false,path:[],repath:0,atk:0,stun:0,flash:0,flee:false})});
  S.nightHurt=0;S.nightHad=true;S.ns={n:list.length,kill:0,lost:[],hurt:0,broke:0,boss:list.includes('boss')||list.includes('boss2')||list.includes('hino')||list.includes('yama')?1:0,trial:!!S.trialOn,final:!!S.finalOn,rush:S.rushOn?S.rushN:0};S.trialOn=false;S.finalOn=false;S.rushOn=false;
  if(S.ns.rush&&!WD&&S.res.some(r=>r.name===POKO))dialog([[POKO,S.ns.rush===1?'#alarm|守り神さま、見て……！ 影が、あんなにたくさん……！ 台座を守らなきゃ！':'#think|ゆうべより、もっと多い……！ みんな、もうひと晩、がんばろう！']]);
  else if(list.includes('yama'))dialog([[HOMURA,'守り神！ 火の山が、あばれてる……！'],[HOMURA,'「ヤマノオオカゲ」だ。温泉の熱をうばいに来るよ。'],[SHIZUKU,'温泉を、朝まで守りぬきましょう……！']],null,null,LEAD());
  else if(list.includes('hino'))dialog(['火山のほうから、熱い風がふいてくる…！','「ヒノオオカゲ」が来るよ！ 熱の装置をねらってる！ みんなで追いはらって！'],null,null,LEAD());
  else if(list.filter(t=>t==='ash').length>=6)dialog(['空から、灰がふってきた…！','ハイカゲがたくさん来るよ！ かまどやベンチをまもって！'],null,null,LEAD());
  else if(list.includes('boss2'))dialog(WD===1?[[HOMURA,'守り神！ 山の上にのこってた影が、おりてくるよ…！'],[HOMURA,'今夜は「ヨルノオオカゲ」さ。みんな、気をつけな！']]:['守り神さま…！ いつもより、ずっと空気が重い…！','今夜は「ヨルノオオカゲ」が来る！ 柵をかさねて、家の中にかくれて！'],null,null,LEAD());
  else if(list.includes('boss')&&!WD&&!S.flags.bossTold&&S.res.some(r=>r.name===POKO)){S.flags.bossTold=1;dialog([[POKO,'守り神さま…！ ……この感じ。空気が、ずっしり重い。'],[POKO,'#alarm|「オオカゲ」……コワイノたちの親玉が、来るんだ。'],[POKO,'思い出すと、今でも足がすくむけど……'],[POKO,'今夜は「オオカゲ」が来る！ 柵をかさねて、家の中にかくれて！']],null,null,LEAD())}
  /* 火山では、オオカゲが来ることは知らせない（草原で話したので、くりかえさない） *//* 草原は、はじめての夜のフタバの知らせだけ。2回目からは知らせない */
}
// 出現場所：マップの南のはし（いちばん下の行）から。水・障害物・明かりの中はさける
const SPRC={n:-1,s:null,d:null};function spawnReach(){/* 村のまん中から歩いて行けるマス（コワイノは、村まで来られる所にだけ出る）。下絵が変わったら作りなおす */if(SPRC.n!==STATN||SPRC.s!==S){SPRC.n=STATN;SPRC.s=S;SPRC.d=bfsE(CX,CY,40,1).dist}return SPRC.d}
function spawnSpot(){const R=spawnReach();
  for(let tries=0;tries<300;tries++){const x=(Math.random()*W)|0,y=H-1,j=y*W+x;
    if(S.ground[j]===1||solidOf(j)||lightAt(x+.5,y+.5)||R[j]<0)continue;return [x+.5,y+.5]}
  return edgeSpot();
}
function edgeSpot(){const R=spawnReach();
  for(let tries=0;tries<300;tries++){const x=(Math.random()*W)|0,y=H-1,j=y*W+x;
    if(S.ground[j]!==1&&!solidOf(j)&&R[j]>=0)return [x+.5,y+.5]}
  for(let x=0;x<W;x++){const j=(H-1)*W+x;if(R[j]>=0)return [x+.5,H-.5]}/* 下のはしで行ける所 */
  return [CX+.5,H-.5];
}

const INDL=new Set(['candle','lantern','flamp']);/* 室内の灯り：家の中なら家じゅう、外なら1マス */
const LSPR=new Map();function lightSpr(R){/* 明かりの光の絵（半径 R、まん中の明るさ .9）。半径ごとに1まいだけ作っておく */let c=LSPR.get(R);if(c)return c;c=document.createElement('canvas');c.width=c.height=R*2;const g=c.getContext('2d'),gr=g.createRadialGradient(R,R,2,R,R,R);gr.addColorStop(0,'rgba(255,214,120,.9)');gr.addColorStop(1,'rgba(255,200,100,0)');g.fillStyle=gr;g.fillRect(0,0,R*2,R*2);LSPR.set(R,c);return c}
const LIGHTP={/* 夜の明かり：光のまん中（マスの左上から dx・dy ドット）と、光の半径 R */
  lamp:{dx:16,dy:3,R:100},tower:{dx:16,dy:6,R:150},yogan:{dx:32,dy:8,R:60},lighthouse:{dx:32,dy:-78,R:130},campfire:{dx:16,dy:14,R:110},
  statue:{dx:16,dy:-6,R:110},torch:{dx:16,dy:-22,R:105},candle:{dx:16,dy:10,R:45},lantern:{dx:16,dy:6,R:45},flamp:{dx:16,dy:-6,R:45},takeakari:{dx:16,dy:14,R:90},andon:{dx:16,dy:16,R:90}};
function steleF(j){const o=S.obj[j],b=o&&BL[o]&&BL[o].hp;if(!b||!STELES.length)return 1;const x=j%W,y=(j/W)|0;for(const q of STELES)if(Math.hypot(q%W-x,((q/W)|0)-y)<=5)return (BL[o].hpS||b)/b;return 1}/* 石碑：まわり5マスの壁は、じょうぶさが BL の hpS（実数で書いてある）になる */
function litNear(h,x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(h.set.has((y+dy)*W+x+dx))return true;return false}/* 家の中の灯り：家ぜんたいと、そこから1マス */
function lightMul(x,y){for(const j of LIGHTS)if(S.obj[j]==='toro'&&(j%W+.5-x)**2+(((j/W)|0)+.5-y)**2<12.25)return .75;return lightAt(x,y)?.8:1}/* 灯りの中のコワイノの速さ：石どうろう0.75倍・ふつうの灯り0.8倍 */
function lightAt(x,y){for(const j of LIGHTS){const o=S.obj[j];const lx=j%W+(o==='lighthouse'?1:.5),ly=((j/W)|0)+(o==='lighthouse'?1:.5);if(INDL.has(o)){const h=roomOf(j);if(h?litNear(h,x|0,y|0):(lx-x)**2+(ly-y)**2<2.25)return true;continue}if((lx-x)**2+(ly-y)**2<(o==='tower'?49:o==='lighthouse'?64:12.25))return true}/* 灯りの範囲（石灯籠2.5・ふつう3.5・台座7マス） */return false}
const EREACH=new WeakMap();
const ZUKAN={basic:'いちばんよく見るコワイノ。夜になると、せいれいをねらってやってくる。あたたかいものに、よってくるみたい。',fast:'足がとても速い。体は小さくて、すぐ追いはらえる。いつも、なにかをいそいで追いかけている。',thief:'畑の実った作物をぬすみにくる。見つかると、すぐにげる。じぶんでは、なにも育てられないらしい。',brute:'体がかたくて力も強い。なかなか追いはらえない。いくつもの夜をこえて、かたまったといわれる。',breaker:'壁をこわすのが大好き。まわり道をしないで、まっすぐこわしてくる。しめだされるのが、きらいなのかもしれない。',trapper:'罠や見張り台を見つけると、こわしにくる。まもるために作った物が、ごちそうらしい。',boss:'大きなコワイノ。まわりのせいれいも巻きこんで攻撃する。よく見ると、体の中で、小さなかげがいくつもうごいている。',ash:'灰をまきちらして、施設をしばらく使えなくする。もえつきた火の、のこりのような色をしている。',rockc:'岩みたいにかたい。動きはおそい。岩かげから、はなれたがらない。',yama:'火の山からおりてくる大きなコワイノ。温泉の熱をうばって、冷やしてしまう。体は、いつもつめたい。',hino:'火山からやってくる大きなコワイノ。熱の切りかえ装置をこわそうとする。熱をうばっても、すこしもあたたまらないらしい。',boss2:'夜の力をたくわえた、いちばん大きなコワイノ。この土地じゅうの夜が、ひとつにあつまったようなすがた。'};
const ZURA={/* クリア後に図鑑で読める「もとのすがた」（STORY.md「もとの闇のせいれいたち」）。おそうのは、もとのやさしさの裏返し */
  basic:'ねむる子のそばで、そっと見守っていた、小さな闇のせいれい。いまも、そばにいてあげたくて、よりそってくる。でも、影の体はつめたくて、ふれた子をひやしてしまう。',
  fast:'夜のあいだ土地をかけまわり、朝の前に夜をたたんで帰る「夜まわり」の子。みんなを早く休ませたくて、かけよってくる。いそぎすぎて、ぶつかってしまう。',
  thief:'夜のあいだ、作物や種をねむらせていた子。実った作物を、ねむらせてあげようと、だれにも見られないように、そっと持っていく。',
  brute:'夜のしずけさをまもる、大きくて、おだやかな子。にぎやかなものを、しずかにさせようとする。でも、かたまった体では、やさしくできない。',
  breaker:'家々の戸口をめぐって「おやすみ」を運んでいた子。おやすみをとどけたくて、しまっている壁や戸を、こわしてでも入ろうとする。',
  trapper:'夜のあいだ村をまもる「夜の番」の子。「守るのは、ぼくの番だから」と、罠や見張り台の守る力を、自分の中へひきとってしまう。',
  ash:'火が消えたあと、灰の中にぬくもりを朝までのこしておく子。かまどの火をのこしてあげようと灰をかぶせて、火を止めてしまう。',
  rockc:'岩かげで、ねむる生き物の寝床をまもっていた子。寝床をまもろうとして、近づくものを、だれでも追いかえそうとする。',
  boss:'さびしくなった闇のせいれいたちが、よりあつまったすがた。ひとりぼっちの子を、なかまに入れてあげたくて、まわりの子をまきこむ。',
  hino:'火山のふもとで、火が夜にねむるのを見守っていた子たちが、あつまったすがた。火をねむらせてあげようとして、熱をしずめてしまう。',
  yama:'火山のふもとで、火が夜にねむるのを見守っていた子たちの、もうひとつのすがた。温泉をねむらせてあげようとして、冷やしてしまう。',
  boss2:'闇のせいれいみんなと、闇のヌシ様がいた「夜」そのものの、なごり。この土地を、もう一度、ちゃんと休める夜にしたくて、明かりや守りを消そうとする。'};
function shakeScreen(){const v=$('#cv');v.classList.remove('shk');void v.offsetWidth;v.classList.add('shk');setTimeout(()=>v.classList.remove('shk'),600)}
const BOSSFX={boss:{col:'#ff3b6b',sub:'コワイノたちの親玉が、すがたをあらわした'},yama:{col:'#ff6a2e',sub:'火の山の熱をうばう、大きなコワイノ'},boss2:{col:'#ffd84a',sub:'夜の力をたくわえた、いちばん大きなコワイノ'}};
function bossEntrance(e){BOSSHOLD=performance.now()+5000;window.BOSSCAM=BOSSHOLD+1000;/* 画面をもどしおわるまで、はしをこえてよせられる *//* オオカゲ・ヨルノオオカゲの登場：画面がよって、ゆれて暗くなる */const B=BOSSFX[e.type];SKIP=false;/* 登場のあいだは時間を止めて、すがたを見せる */const z0=cam.z;camAnim={fz:cam.z,tz:Math.min(3,cam.z*1.5),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:e.x*TS,ty:e.y*TS-hiAt((e.y|0)*W+(e.x|0))*LIFT-16*(EN[e.type].size||1)-VH/Math.min(3,cam.z*1.5)*.16,t:0,dur:.8};/* オオカゲは画面のまん中より少し下（上に名前と説明が出る） */setTimeout(()=>{camAnim={fz:cam.z,tz:z0,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cam.x+VW/cam.z/2,ty:cam.y+VH/cam.z/2,t:0,dur:.8}},5000);/* ボスへズームアップして、少しのあいだ時間を止める。名前と説明を大きく出す */shakeScreen();dlgCue('dim');sfx('bossIn');bossTitle(EN[e.type].name,ZUKAN[e.type]||B.sub,B.col);
  for(let n=0;n<4;n++)fx.push({k:'ring',x:e.x*TS,y:e.y*TS,life:1+n*.4,col:B.col});}
function skillPop(sym,title,lines){/* わざをおぼえたときの説明 */const overlay=el('<div class="idea-reveal" role="dialog" aria-modal="true"></div>'),card=el('<div class="idea-card"><div class="idea-symbol"></div><h2></h2><div class="skill-lines"></div></div>');card.querySelector('.idea-symbol').textContent=sym;card.querySelector('h2').textContent=title;for(const t of lines){const p=document.createElement('p');p.textContent=t;card.querySelector('.skill-lines').append(p)}const b=el('<button class="btn pri" type="button">OK</button>');b.onclick=()=>{sfx('next');overlay.remove()};card.append(b);overlay.append(card);document.body.append(overlay);sfx('level')}
function bossTitle(name,sub,col){/* オオカゲの登場：名前と説明を、画面のまん中に大きく出して、消す */const d=document.createElement('div');d.className='bossTitle';d.innerHTML='<b></b><small></small>';d.querySelector('b').textContent=name;d.querySelector('b').style.color=col;d.querySelector('small').textContent=sub;document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('on')));setTimeout(()=>d.classList.remove('on'),3600);setTimeout(()=>d.remove(),4600)}
let BOSSHOLD=0;/* ボスの登場・追いはらいの演出のあいだ、時間を止める */
function bossDefeatFX(e){const sand=e.type==='boss'||e.type==='boss2';sfx('bossKO');if(sand)sfx('crack');EVAP.push({e,t0:performance.now()+(sand?350:0),dur:sand?4200:3200,sand});/* オオカゲ・ヨルノオオカゲ：ピシッとひびが入って、上から砂になってくずれる *//* 時間を止めて、消えていく様子を見せる *//* オオカゲをたおしたとき：白く光って、ゆれて、光の輪と粒がはじける */const B=BOSSFX[e.type]||BOSSFX.boss,px=e.x*TS,py=e.y*TS;camAnim={fz:cam.z,tz:Math.min(3,cam.z*1.6),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:px,ty:py-12*(EN[e.type].size||1),t:0,dur:.8};/* ボスへズームアップ */dlgCue('flash');shakeScreen();
  for(let n=0;n<6;n++)fx.push({k:'ring',x:px,y:py,life:1+n*.3,col:n%2?'#fff3d6':B.col});
  for(let n=0;n<36;n++){const a=n/36*6.28,v=80+(n%3)*40;fx.push({k:'p',x:px,y:py-20,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,life:1.4,col:n%2?'#fff3a0':B.col,r:3.2})}
  const hold=EVAP.some(it=>it.e===e&&it.sand)?4900:3600,z0=cam.z;BOSSHOLD=performance.now()+hold;setTimeout(()=>{camAnim={fz:cam.z,tz:z0,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cam.x+VW/cam.z/2,ty:cam.y+VH/cam.z/2,t:0,dur:.8}},hold)/* 終わったら、もとの大きさにもどす */}/* 文字は出さず、時間を止めて、よって、消えていく様子だけを見せる */
function bodyWall(e,D){/* 道の先の、いちばん近い柵・壁に、体がふれているか。ふれていればその壁、なければ次のマス */for(let i=0;i<Math.min(e.path.length,6);i++){const q=anc(e.path[i]);if(!breakable(S.obj[q]))continue;const x0=q%W,y0=(q/W)|0,nx=Math.max(x0,Math.min(e.x,x0+1)),ny=Math.max(y0,Math.min(e.y,y0+1));if(((nx-e.x)/D.hx)**2+((ny-e.y)/D.hy)**2<=1)return q;break}return anc(e.path[0])}
function edgeOf(G){/* 道さがしの結果から、行けるマップのはしで、いちばん近いマス */let eb=-1,ed=1e9;for(let j=0;j<W*H;j++){const x=j%W,y=(j/W)|0;if(G.dist[j]<0||x>0&&y>0&&x<W-1&&y<H-1)continue;if(G.dist[j]<ed){ed=G.dist[j];eb=j}}return eb}
function enemyFallback(e,D){/* 行き先に行けないコワイノは、ワープせず、基地のまん中に近づける所へ歩く。それもなければ、マップのはしへ歩いて帰る */const G=bfsE(e.x|0,e.y|0,D.wall?6:40,e.sd||(e.sd=(Math.random()*1e9)|0));let best=-1,bd=1e9;if(!e.flee)for(let j=0;j<W*H;j++){if(G.dist[j]<0)continue;const d=Math.hypot(j%W+.5-CX,((j/W)|0)+.5-CY);if(d<bd){bd=d;best=j}}
  if(best>=0&&bd<Math.hypot(e.x-CX,e.y-CY)-1){e.path=pathTo(G,best);return}e.flee=true;const eb=edgeOf(G);if(eb>=0)e.path=pathTo(G,eb);else e.dead=true}
function updEnemy(e,dt){
  const D=EN[e.type];
  if(!e.spawned){e.delay-=dt;if(e.delay<=0){[e.x,e.y]=(D.dev||D.vol)&&WD===1?volSpot():spawnSpot();e.spawned=true;(S.seenEn||(S.seenEn={}))[e.type]=1;if(e.type==='boss2'||e.type==='boss'&&!S.flags.bossIntro){if(e.type==='boss')S.flags.bossIntro=1;bossEntrance(e)}}return}/* オオカゲの登場演出は最初の1回、ヨルノオオカゲは毎回 */
  if(e.flash>0)e.flash-=dt;
  if(e.stun>0||e.rest>0||S.t-(e.busyT??-1e9)<5){e.wd=0;e.wx=null}/* 罠で足止め・壁や設備をたたいているあいだは、来なおさない */
  else if(!e.flee&&!VILL[(e.y|0)*W+(e.x|0)]){e.wd=(e.wd||0)+dt;if(e.wd>=30){if(e.wx!=null&&Math.hypot(e.x-e.wx,e.y-e.wy)<3){enemyFallback(e,D);e.repath=8;EREACH.delete(e)}e.wd=0;e.wx=e.x;e.wy=e.y}}else{e.wd=0;e.wx=null}/* 村の外で30分ほとんど進めていなかったら、べつの場所から来なおす（森でうろうろ対策） */
  if(e.stun>0){e.stun-=dt;return}if(e.rest>0){e.rest-=dt;return}
  e.slow=1;{const tj=(e.y|0)*W+(e.x|0),to=S.obj[tj];if(to&&BL[to]&&BL[to].trap){e.busyT=S.t;const cd=S.trapCd||(S.trapCd={}),rdy=!(cd[tj]>S.t);
    if(to==='spike'){e.spk=(e.spk||0)+dt;if(e.spk>=15){e.spk-=15;e.hp-=.5;e.flash=4}/* とげの罠：15分ごとに0.5ダメージ */if(e.hp<=0)return defeat(e,EN[e.type].name+'をとげの罠で追いはらった！')}
    else if(to==='sticky')e.slow=.35;
    else if(to==='puddle'&&rdy){cd[tj]=S.t+120;e.stun=D.boss?3:8;e.path=[];sfxAt('bonk',e.x,e.y);return}
    else if(to==='firetrap'&&rdy){cd[tj]=S.t+180;e.hp-=4;e.flash=8;burstAt(e.x,e.y,'furn');sfxAt('cookfire',e.x,e.y);if(e.hp<=0)return defeat(e,EN[e.type].name+'をほのおの罠で追いはらった！')}
    else if(to==='gust'&&rdy){cd[tj]=S.t+150;let dx=e.x-CX,dy=e.y-CY;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;{let bx=null,by=null;for(let k=1;k<=6;k++){const nx=e.x+dx*k,ny=e.y+dy*k,q=(ny|0)*W+(nx|0);if(!(nx>1&&ny>1&&nx<W-1&&ny<H-1)||!walk(q)||HOME_DOORS.has(typeAt(q))||GATE_IDS.has(typeAt(q)))break;bx=nx;by=ny}if(bx!=null){e.x=bx;e.y=by}}/* 壁・ドア・門の手前までしか、ふきとばさない */e.path=[];e.repath=0;e.stun=2;sfxAt('bush',e.x,e.y);return}}}
  let goal=-1,tgt=null;
  if(e.flee){e.fleeT=(e.fleeT||0)+dt;if(e.fleeT>40&&!e.path.length){e.dead=true;return}/* にげる道がどこにもないときだけ消える */if(e.x<.6||e.y<.6||e.x>W-.6||e.y>H-.6||(D.thief&&e.fleeT>12&&!VILL[(e.y|0)*W+(e.x|0)])){e.dead=true;return}}/* カゲドロボウは、にげたらすぐ消える */
  else if(D.thief){let bd=1e9,box=-1;for(const k in S.dyn){if(S.obj[k]!=='farm'||S.dyn[k].g<50)continue;const fx2=k%W+.5,fy=((k/W)|0)+.5,d=Math.hypot(fx2-e.x,fy-e.y);if(d<bd){bd=d;goal=+k;box=-1}}
    if(S.food>0)for(let k=0;k<W*H;k++){if(!storageAt(k,'food'))continue;const d=Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y)-.7;if(d<bd){const n=[k-1,k+1,k-W,k+W].find(q=>walk(q));if(n!=null){bd=d;goal=n;box=k}}}
    if(matTot()>0)for(let k=0;k<W*H;k++){if(!storageAt(k,'mat'))continue;const d=Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y)-.7;if(d<bd){const n=[k-1,k+1,k-W,k+W].find(q=>walk(q));if(n!=null){bd=d;goal=n;box=-2-k}}}
    if(goal>=0&&box<=-2&&bd<.6){let n=5,got=[];for(const m of ['wood','stone','bamboo'].sort((a,b)=>(S.mat[b]||0)-(S.mat[a]||0))){const t=Math.min(n,S.mat[m]||0);if(t){S.mat[m]-=t;n-=t;got.push(MATN[m]+t)}}S.nightHurt++;if(S.ns&&got.length)S.ns.lost.push(got.join('・'));toast('カゲドロボウに素材の収納をあらされた！（'+got.join('・')+'）','warn');sfxAt('thief',e.x,e.y);e.flee=true;e.path=[];e.repath=0}
    else if(goal>=0&&box>=0&&bd<.6){const st=takeFood(5,'any').length;S.nightHurt++;if(S.ns&&st)S.ns.lost.push('食料'+st);toast('カゲドロボウに食料の収納をあらされた！（食料-'+st+'）','warn');sfxAt('thief',e.x,e.y);e.flee=true;e.path=[];e.repath=0}
    else if(goal>=0&&box<0&&bd<.6){S.dyn[goal].g=0;S.nightHurt++;if(S.ns)S.ns.lost.push('畑の作物');toast('カゲドロボウに畑をあらされた！','warn');sfxAt('thief',e.x,e.y);e.flee=true;e.path=[];e.repath=0}}
  if(D.thief&&goal<0&&!e.flee){e.flee=true;e.path=[];e.repath=0}/* カゲドロボウは、盗むものがなければ帰る */
  if((D.ash||D.dev)&&WD===1&&S.st2&&!e.flee&&(e.ign||0)<(D.dev?3:1)){const ex=e.x|0,ey=e.y|0;let hit=-1;for(let dy=-1;dy<=1&&hit<0;dy++)for(let dx=-1;dx<=1&&hit<0;dx++){const k=(ey+dy)*W+ex+dx;if(k<0||k>=W*H)continue;const a=anc(k);if(a!=null&&FLAM.has(S.obj[a])&&!fireAt(a)&&Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y)<1.05)hit=a}if(hit>=0){ignite(hit);e.ign=(e.ign||0)+1}}/* ハイカゲ（1つ）・ヒノオオカゲ（3つ）は、ふれた木の物に火をつける */
  e.ashG=false;if((D.ash||D.dev)&&!e.flee&&WD===1&&S.st2&&!(D.ash&&S.st2.cool)){const t=S.st2;let bd=1e9,bt=-1;/* ハイカゲは設備、ヒノオオカゲは熱の装置をねらう */
    if(D.ash){for(let k=0;k<W*H;k++){if(!ASHT.has(S.obj[k])||t.ash[k]>S.t)continue;const d=Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y);if(d<bd){bd=d;bt=k}}}
    else for(const k of[D1,D2]){if(S.obj[k]!=='heatv'||t.hvb[k]||(k===D2&&!t.d2fix))continue;const d=Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y);if(d<bd){bd=d;bt=k}}
    if(bt>=0){e.ashG=true;if(bd<1.45){if(D.ash){t.ash[bt]=S.t+240;toast(BL[S.obj[bt]].name+'が、ハイカゲの灰で止まった！','warn');sfxAt('thief',e.x,e.y);e.flee=true;e.path=[];e.repath=0;return}
        e.atk+=dt;if(e.atk>=D.atk){e.atk=0;t.hvh=t.hvh||{};t.hvh[bt]=(t.hvh[bt]??8)-1;sfxAt('bonk',bt%W+.5,(bt/W)|0);if(t.hvh[bt]<=0){delete t.hvh[bt];t.hvb[bt]=1;dirty=true;sfxAt('wbreak',bt%W+.5,(bt/W)|0);toast('ヒノオオカゲに熱の装置をこわされた！','warn')}}return}
      const n=[bt-1,bt+1,bt-W,bt+W].filter(q=>walk(q)).sort((a,b)=>Math.hypot(a%W+.5-e.x,((a/W)|0)+.5-e.y)-Math.hypot(b%W+.5-e.x,((b/W)|0)+.5-e.y))[0];goal=n!=null?n:bt;if(e.tg!=='a'+bt){e.tg='a'+bt;e.repath=0}}}
  if(WD===1&&S.st2&&S.st2.cool&&(D.ash||D.vol)&&!e.flee&&!S.res.some(r=>!r.hidden&&Math.hypot(r.x-e.x,r.y-e.y)<2.5)){const t=S.st2;let bd=1e9,bj=-1,bk=null;/* 火山のふもとの最後の夜：ヤマノオオカゲとハイカゲは、すぐそばにせいれいがいなければ、あたたかい温泉のふちへ行って、熱をうばう */
    for(const k of['a','b','c']){if(!springOn(k))continue;for(const j of springEdge(k)){const d=Math.hypot(j%W+.5-e.x,((j/W)|0)+.5-e.y);if(d<bd){bd=d;bj=j;bk=k}}}
    if(bj>=0){e.ashG=true;if(bd<.9){e.busyT=S.t;e.atk+=dt;if(e.atk>=D.atk){e.atk=0;t.cool[bk]-=1;sfxAt('bonk',e.x,e.y);fx.push({k:'ring',x:e.x*TS,y:e.y*TS,life:.8,col:'#9fd8ff'});if(t.cool[bk]<=0){t.frz[bk]=1;dirty=true;sfx('evap');toast(SPN[bk]+'が冷えてしまった！','warn')}}return}
      goal=bj;if(e.tg!=='s'+bj){e.tg='s'+bj;e.repath=0}}}
  /* ねらう順番：近くのせいれい → 見張り台の上のせいれい（見張り台をこわす）→ 柵の中のせいれい → 家の中のせいれい */
  if(!D.thief&&!e.ashG&&!e.flee&&!D.dev){let nr=null,nd=reachOf(D);for(const r of S.res){if(r.hidden||onTower(r)||(r.faintGrace||0)>S.t||r.act&&r.act.type==='faint')continue;const d=Math.hypot(r.x-e.x,r.y-e.y);if(d<nd&&!fenceBetween(e.x,e.y,r.x,r.y)){nd=d;nr=r}}
    if(!nr&&e.aggro!=null&&S.t-(e.aggroT||-1e9)<10){const r=S.res.find(q=>q.id===e.aggro);if(r&&!r.hidden&&!onTower(r)&&!((r.faintGrace||0)>S.t)&&!(r.act&&r.act.type==='faint')){const d=Math.hypot(r.x-e.x,r.y-e.y);if(d<2.3&&(d<1.5||overFence(e.x,e.y,r.x,r.y))&&!fenceBetween(e.x,e.y,r.x,r.y))nr=r}}/* 柵ごしにたたいてきた火の子には、火の子と同じ距離から、やり返す（柵より先に） */
    if(nr){e.tg=nr.id;hitRes(e,nr,D);if(hsOf(D)>=2&&!e.dead){burstAt(nr.x,nr.y,'offer');for(const q of S.res){if(q===nr||q.hidden||onTower(q)||e.dead)continue;if(Math.hypot(q.x-nr.x,q.y-nr.y)<1.5&&!fenceBetween(e.x,e.y,q.x,q.y))hitRes(e,q,D)}}return}}/* 攻撃がとどく所にせいれいがいれば、柵ごしでも、柵や罠よりせいれいを先に攻撃する */
  let pre=null,twj=-1;if(!D.thief&&!D.trapper&&!e.ashG&&!e.flee){if(!EREACH.has(e))EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const RD=EREACH.get(e);let nd=1e9,fd=1e9,hd=1e9,fr=null,hr=null;
    for(const r of S.res){if(r.hidden||onTower(r))continue;const d=Math.hypot(r.x-e.x,r.y-e.y),rj=(r.y|0)*W+(r.x|0);if(RD&&RD[rj]>=0){if(d<nd){nd=d;pre=r}}else if(roomOf(rj)){if(d<hd){hd=d;hr=r}}else if(d<fd){fd=d;fr=r}}/* 歩いて行ける子 → （見張り台）→ 柵の中の子 → 家の中の子 */
    const twIn=j=>{for(let b=-1;b<=2;b++)for(let a=-1;a<=2;a++){if(a>=0&&a<=1&&b>=0&&b<=1)continue;const k=j+b*W+a;if(RD&&RD[k]>=0)return false}return true};/* 見張り台が柵・塀の中にある（まわりのマスに、こわさずに行けない） */
    const tw=inn=>{let bd=1e9,bj=-1;for(const r of S.res){if(!onTower(r)||twIn(r.act.obj)!==inn)continue;const d=Math.hypot(r.act.obj%W+1-e.x,((r.act.obj/W)|0)+1-e.y);if(d<bd){bd=d;bj=r.act.obj}}return bj};/* 見張り台の上の子は、見張り台をこわさないと攻撃できない */
    if(!pre)twj=tw(false);/* 柵の外の見張り台 → 柵の中の子 → 柵の中の見張り台 → 家の中の子 */
    if(!pre&&twj<0&&fr)pre=fr;if(!pre&&twj<0)twj=tw(true);if(!pre&&twj<0)pre=hr}
  let dj=-1;if((D.trapper||twj>=0)&&!e.flee&&!pre){/* 見張り台や罠をこわしにいくのはワナクイだけ。ほかのコワイノは、せいれいが立っている見張り台だけこわしにいく */let bd=1e9;for(const j of(D.trapper?defList():[twj])){if(!DEFS.has(S.obj[j]))continue;const z=BL[S.obj[j]].sz||[1,1],x0=j%W,y0=(j/W)|0,d=Math.hypot(Math.max(x0-e.x,0,e.x-(x0+z[0])),Math.max(y0-e.y,0,e.y-(y0+z[1])))+.5;/* 大きい設備は、いちばん近い面まで */if(d<bd){bd=d;dj=j}}
    if(dj>=0){if(bd<1.15){e.busyT=S.t;e.hitT=S.t;/* 塀・建物をこうげき中（火の子がむかえうつ） */e.atk+=dt*lightMul(e.x,e.y);/* 光の中は、攻撃の速さ0.8倍 */if(e.atk>=D.atk){e.atk=0;const o=S.obj[dj];S.hp[dj]=(S.hp[dj]??defHp(o))-(D.boss?2:D.trapper?2:1)/steleF(dj);WALLHIT.set(dj,performance.now());sfxAt('bonk',dj%W+.5,(dj/W)|0);
        if(S.hp[dj]<=0){(S.broken||(S.broken=[])).push({j:dj,id:o,L:S.hp['L'+dj],rot:rotAt(dj)});sfxAt('wbreak',dj%W+.5,(dj/W)|0);if(S.ns)S.ns.broke++;{const hb=HOUSES.find(h=>h.set.has(dj));clearObj(dj);DEFC.t=0;recount();houseBreakFlee(hb)}dirty=true;toast(BL[o].name+'がこわされた！','warn')}}return}
      {const z=BL[S.obj[dj]].sz||[1,1],x0=dj%W,y0=(dj/W)|0;if(BL[S.obj[dj]].solid){let bq=-1,bb=1e9;for(let yy=y0-1;yy<=y0+z[1];yy++)for(let xx=x0-1;xx<=x0+z[0];xx++){if((xx<x0||xx>=x0+z[0])===(yy<y0||yy>=y0+z[1]))continue;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(!walk(q))continue;const dd=Math.hypot(xx+.5-e.x,yy+.5-e.y);if(dd<bb){bb=dd;bq=q}}goal=bq>=0?bq:dj}else goal=dj}if(e.tg!=='d'+dj){e.tg='d'+dj;e.repath=0}}}/* 防衛設備をこわしてから、せいれいをねらう */
  if(dj<0&&(!(D.thief||e.ashG)||goal<0&&!e.flee)){let td=1e9,ts=1e9;if(!EREACH.has(e))EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const RD=EREACH.get(e);if(pre){tgt=pre;td=Math.hypot(pre.x-e.x,pre.y-e.y)}else for(const r of S.res){if(r.hidden||onTower(r)||(r.faintGrace||0)>S.t||r.act&&r.act.type==='faint')continue;const d=Math.hypot(r.x-e.x,r.y-e.y),sc=d+(RD&&RD[(r.y|0)*W+(r.x|0)]<0?60:0)-(r.id===e.tg?2:0);/* いまねらっている子を少し優先（ねらいがころころ変わってガタガタしない） */if(sc<ts){ts=sc;td=d;tgt=r}}
    if(!tgt&&!pre){let bd=1e9;for(const r of S.res){if(!(r.hidden&&r.act&&r.act.type==='sleep'))continue;const d=Math.hypot(r.x-e.x,r.y-e.y);if(d<bd){bd=d;td=d;tgt=r}}}/* ねらえる子がだれもいなければ、家で眠っている子をめざして、家の壁をこわしにいく（遠くでワープをくりかえさない） */
    if(tgt&&!tgt.hidden&&td<reachOf(D)&&!fenceBetween(e.x,e.y,tgt.x,tgt.y)){hitRes(e,tgt,D);if(hsOf(D)>=2&&!e.dead){const ar=1.5;burstAt(tgt.x,tgt.y,'offer');for(const q of S.res){if(q===tgt||q.hidden||onTower(q)||e.dead)continue;if(Math.hypot(q.x-tgt.x,q.y-tgt.y)<ar&&!fenceBetween(e.x,e.y,q.x,q.y))hitRes(e,q,D)}}/* 大きいコワイノは範囲攻撃：まわりの子も巻きこむ */return}
    if(tgt&&!tgt.hidden&&td<1.6&&e.type!=='boss2'&&!e.flee&&!(e.dcb>S.t)){/* ヨルノオオカゲは、近づききらずに、とどく所から攻撃する */let sp=D.sp*dt*e.slow;if(lightAt(e.x,e.y))sp*=.8;/* 光の中は、移動の速さ0.8倍 */const dx=tgt.x-e.x,dy=tgt.y-e.y,st=Math.min(sp,td);let ok=true;for(let f=.25;f<=st+.001&&ok;f+=.25){const t=Math.min(f,st),nq=(((e.y+dy/td*t)|0)*W)+((e.x+dx/td*t)|0);ok=walk(nq)&&!HOME_DOORS.has(typeAt(nq))&&!GATE_IDS.has(typeAt(nq))}{const nq=(((e.y+dy/td*st)|0)*W)+((e.x+dx/td*st)|0);ok=ok&&walk(nq)&&!HOME_DOORS.has(typeAt(nq))&&!GATE_IDS.has(typeAt(nq))}/* とちゅうのマスも調べて、柵や壁をすりぬけない */if(ok){e.x+=dx/td*st;e.y+=dy/td*st;e.path=[];return}e.dcb=S.t+4;e.repath=0}/* まっすぐ行けないときは、しばらく道どおりに進む（行ったり来たりでガタガタしない） */
    if(tgt){goal=(tgt.y|0)*W+(tgt.x|0);if(!walk(goal)){let bq=-1,bb=1e9;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const q=goal+ay*W+ax;if(!walk(q))continue;const dd=Math.hypot(q%W+.5-e.x,((q/W)|0)+.5-e.y);if(dd<bb){bb=dd;bq=q}}if(bq>=0)goal=bq}/* ベッドの上など、歩けないマスにいる子は、となりの歩けるマスをめざす */if(e.tg!==tgt.id){e.tg=tgt.id;e.repath=0}}}
  if(e.type==='boss2'&&S.ns&&S.ns.final&&!pre&&!e.flee){const tw=S.obj.indexOf('tower');if(tw>=0){goal=tw;if(e.tg!=='tw'){e.tg='tw';e.repath=0}}}/* 最後の夜のヨルノオオカゲは、守護の台座をこわしにくる（近くにせいれいがいれば、そちらが先） */
  e.repath-=dt;let force=false;{const bv=(S.broken||[]).length;if(e.bv!==bv){e.bv=bv;force=true}}/* どこかの壁がこわれたら、すぐ道を考えなおす（あいた穴から入る） */
  const onWall=e.path.length&&breakable(typeAt(e.path[0]));/* 壁をたたいているあいだは、ほかの壁がこわれるまで同じ壁をたたきつづける */
  if(force||(e.repath<=0&&!onWall)||!e.path.length){
    if(e.flee){const [fx2,fy]=edgeSpot();goal=(fy|0)*W+(fx2|0)}
    EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const G=bfsE(e.x|0,e.y|0,D.wall?6:40,e.sd||(e.sd=(Math.random()*1e9)|0));/* 1マス歩く=2として、壁をこわす時間を歩くマスにかえてくらべる */if(e.flee&&!(goal>=0&&G.dist[goal]>=0))goal=edgeOf(G);/* にげる先に行けなければ、行けるはしへ */
    e.path=goal>=0&&G.dist[goal]>=0?pathTo(G,goal):[];e.repath=8;
  }
  if(!e.path.length){e.stk=(e.stk||0)+dt;if(e.stk>20&&!e.flee){e.stk=0;enemyFallback(e,D);e.repath=8;EREACH.delete(e)}return}/* うごけないまま止まっていたら、ワープせず、行ける所へ歩く */
  const j=e.path[0];
  {const j=D.hx?bodyWall(e,D):anc(e.path[0]);/* ヨルノオオカゲは体が大きいので、体（足もとのかげの大きさ）が柵や壁にふれたところで、こわしにかかる */if(breakable(S.obj[j])){e.busyT=S.t;
    e.hitT=S.t;e.atk+=dt*lightMul(e.x,e.y);/* 光の中は、攻撃の速さ0.8倍 */if(e.atk>=D.atk){e.atk=0;S.hp[j]=(S.hp[j]??BL[S.obj[j]].hp)-(D.wall||(D.boss?2:1))/steleF(j);/* オオカゲは壁をこわす力1.5倍 */if(hsOf(D)>=2)for(const[ax,ay]of DIRS){const k=j+ay*W+ax,ko=S.obj[k];if(k===j||!breakable(ko)||Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y)>2.2)continue;S.hp[k]=(S.hp[k]??BL[ko].hp)-1/steleF(k);WALLHIT.set(k,performance.now());if(S.hp[k]<=0){(S.broken||(S.broken=[])).push({j:k,id:ko,L:S.hp['L'+k],rot:rotAt(k)});sfxAt('wbreak',k%W+.5,(k/W)|0);if(S.ns)S.ns.broke++;{const hb=HOUSES.find(h=>h.set.has(k));clearObj(k);recount();houseBreakFlee(hb)}toast(BL[ko].name+'がこわされた！','warn')}/* まわりの壁がこわれたときも、家の中の子はにげる */}/* 大きいコワイノは、となりの壁にもダメージ（範囲攻撃） */WALLHIT.set(j,performance.now());sfxAt('bonk',j%W+.5,(j/W)|0);
      if(S.hp[j]<=0){const nm=BL[S.obj[j]].name;(S.broken||(S.broken=[])).push({j,id:S.obj[j],L:S.hp['L'+j],rot:rotAt(j)});sfxAt('wbreak',j%W+.5,(j/W)|0);if(S.ns)S.ns.broke++;{const hb=HOUSES.find(h=>h.set.has(j));clearObj(j);recount();houseBreakFlee(hb)}toast(nm+'がこわされた！','warn')}}
    return}}
  if(!walk(j)){e.path=[];return}
  let sp=D.sp*dt*e.slow*(e.flee&&D.thief?1.8:1);if(!e.flee)sp*=lightMul(e.x,e.y);/* 光の中は、移動の速さ0.8倍 */if(jumpEdge((e.y|0)*W+(e.x|0),j))sp/=5;if(S.ground[j]===2)sp/=2;/* 浅瀬は2倍ゆっくり *//* 段差を飛ぶ間は5倍ゆっくり */
  const tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);
  if(d<=sp){e.x=tx;e.y=ty;e.path.shift()}else{e.x+=dx/d*sp;e.y+=dy/d*sp}e.stk=0
}
function overFence(ax,ay,bx,by){/* 柵（門もふくむ）を、はさんでいるか */const n=Math.ceil(Math.hypot(bx-ax,by-ay)*4),ia=(ay|0)*W+(ax|0),ib=(by|0)*W+(bx|0);for(let k=1;k<n;k++){const px=ax+(bx-ax)*k/n,py=ay+(by-ay)*k/n,q=(py|0)*W+(px|0);if(q===ia||q===ib)continue;if(FENCE_IDS.has(typeAt(q)))return true}return false}
function fenceBetween(ax,ay,bx,by){/* 家の壁をはさんでいたら、離れたところからは攻撃できない（柵・石の柵・石の塀は、こえて攻撃できる） */const n=Math.ceil(Math.hypot(bx-ax,by-ay)*4),ia=(ay|0)*W+(ax|0),ib=(by|0)*W+(bx|0);for(let k=1;k<n;k++){const px=ax+(bx-ax)*k/n,py=ay+(by-ay)*k/n,q=(py|0)*W+(px|0);if(q===ia||q===ib)continue;const t=typeAt(q);if(HOME_WALLS.has(t)&&t!=='wall')return true}return false}
const hsOf=D=>D.size>=1.5?2:1,reachOf=D=>D.rng||.75*hsOf(D);/* 攻撃がとどく距離：大きいコワイノ（オオカゲ・カタカゲ）は、すこし離れたところから攻撃する *//* 当たり判定は見た目ぴったりではなく、1マスか2マス */
function houseBreakFlee(h){/* 家の壁・ドアがこわされた瞬間、その家の中にいた子は、起きてすぐ逃げる（こわれた家は、もう家ではない） */if(!h)return;findHouses();for(const r of S.res){const k=(r.y|0)*W+(r.x|0);if(!h.inside.has(k)&&!h.set.has(k))continue;if(r.act&&r.act.type==='faint')continue;if(r.act)endAct(r);r.hidden=false;r.alarm=S.t;if(r.elem==='fire'&&r.hunger>=50)continue;/* 戦える火の子は、そのままたたかう */r.fleeT=S.t;const G=bfs(r.x|0,r.y|0);if(!withFlee(r,fleeHit,G)){r.fleeNow=true;r.fleeHouse=true}r.bubble='💦'}}
const onTower=r=>!!(r.act&&r.act.type==='watchpost'&&r.act.stage==='do'&&(r.act.cl||0)>=.5&&S.obj[r.act.obj]==='watch');/* 見張り台の上に立っている子（見張り台がこわれるまで攻撃されない） */
function hitRes(e,r,D){if(onTower(r))return;if(BOSSFX[e.type]){shakeScreen();fx.push({k:'ring',x:r.x*TS,y:r.y*TS,life:1.2,col:BOSSFX[e.type].col});sfxAt('bonk',r.x,r.y)}/* オオカゲの一撃は、画面がゆれて衝撃がひろがる */if(!WD&&r.elem==='fire'&&r.hunger<60&&r.name===keyName('fire')&&S.flags.guard)S.flags.fHurtG=1;/* こもれびのまもりをおぼえたあとに、火の子がたくさんたたかれた */const sh=(r.shU||0)>S.t;/* フタバの葉っぱのまもり：EN の hitFS・hitNS（まもりありの数） */if((r.faintGrace||0)>S.t||r.act&&r.act.type==='faint'){e.rest=1;return}/* 気絶している子は攻撃しない */const h0=r.hunger;sfx('hit');e.swing=performance.now();
  const lv=rLv(r);S.nightHurt++;if(S.ns)S.ns.hurt++;const fire=r.elem==='fire';
  if(r.act&&['sleep','stay','rest','idle'].includes(r.act.type)&&r.act.stage==='do')endAct(r);/* 攻撃されたら、寝ていても起きる */
  const adj=Math.hypot(e.x-r.x,e.y-r.y)<=Math.max(1.1,reachOf(D)+.05);/* せいれいの攻撃は、となりにいる相手だけ（遠くから攻撃してくる大きいコワイノには、その距離でもやり返せる） */if(fire&&adj){/* 戦えるのは火の子だけ *//* やり返しはしない（攻撃されたときの受けるダメージの軽さだけ、戦える子は今までどおり） */
    r.hunger=Math.max(0,r.hunger-(sh?D.hitFS:D.hitF));r.hurt=40;if(r.hunger<50)r.fleeNow=true;/* 体力（おなか）がへったら逃げる（オオカゲが相手でも同じ） */}
  else{r.hunger=Math.max(0,r.hunger-(sh?D.hitNS:D.hitN));r.fun=Math.max(0,r.fun-20);r.hurt=40;r.fleeNow=true;/* 戦えない子は、オオカゲが相手でも逃げる */
    if(D.boss&&Math.random()<.25){endAct(r);r.act={type:'faint',stage:'do',t:0};r.bubble='😵'}/* ボスの攻撃で気絶するのは、4回に1回くらい */}r.alarm=S.t;
  if(h0>=12&&r.hunger<3)r.hunger=3;/* 一撃では消えない */
  {const L=lightAt(e.x,e.y);e.rest=fire?(D.boss?(L?2:1.5):(L?2.667:2)):(D.boss?(L?4:3):(L?5.333:4))}/* たたいたあと、コワイノがひと休みする時間（明かりの中は長い）。やられて止まる stun とはちがい、うすくならない */e.path=[];e.repath=0;
}
const LIGHTCDL=[10,10,9.5,9,8.5,8,7.5,7,6.5,6,5.5,5,4.5,4,3.5,3];/* 守りの光のチャージ時間（秒）。村レベル1で10秒、レベルが1上がるごとに0.5秒みじかい */let LIGHTCD=0,LIGHTARM=false;/* 守りの光：アイコンをタップしてから、コワイノ・木・岩をタップする *//* のこり秒（倍速なら早くもどる） */
function guardLight(e){PTW.q=true;if(LIGHTCD>0){toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒');return}if(S.pt<1){toast('パワーが足りません');return}S.pt-=1;LIGHTCD=LIGHTCDL[S.lv]||10;
  const D=EN[e.type];e.hp-=1;e.flash=8;/* ダメージは1だけ */e.stun=D.boss?1:2.5;e.path=[];e.repath=0;
  const cx=e.x*TS,cy=e.y*TS-18;fx.push({k:'ring',x:cx,y:cy,life:1});for(let n=0;n<18;n++){const a=Math.random()*7,v=rnd(50,120);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:1,col:pick(['#fffbe0','#fff','#ffe9a0']),r:rnd(1.5,3)})}sfxAt('shoot',e.x,e.y);
  if(e.hp<=0)return defeat(e,'守り神の光で'+D.name+'を追いはらった！')}
let AREACD=0,AREAARM=false;/* ひかりのはどう：範囲2マスに0.5ダメージ・パワー3 */
function areaBlast(cx,cy){
  const L=S.enemies.filter(e=>e.spawned&&!e.dead&&Math.hypot(e.x-cx,e.y-cy)<=2);
  if(!L.length){toast('はんいに「コワイノ」がいません');return}
  S.pt-=3;PTW.q=true;AREACD=5;const px=cx*TS,py=cy*TS;fx.push({k:'ring',x:px,y:py,life:1});
  for(let n=0;n<28;n++){const a=n/28*Math.PI*2;fx.push({k:'p',x:px+Math.cos(a)*2*TS,y:py+Math.sin(a)*2*TS,vx:Math.cos(a)*30,vy:Math.sin(a)*30-10,life:1,col:pick(['#fffbe0','#fff','#ffe9a0']),r:rnd(1.5,3)})}
  sfxAt('shoot',cx,cy);
  for(const e of L){e.hp-=.5;e.flash=8;if(e.hp<=0)defeat(e,'ひかりのはどうで'+EN[e.type].name+'を追いはらった！')}}
function defeat(e,msg){sfx('defeat');if(EN[e.type].boss&&!S.flags.bossOutro&&!(S.bossKills>0)){S.flags.bossOutro=1;bossDefeatFX(e)}/* 追いはらった演出（時間を止めて消えていく様子を見せる）は、はじめてボスを追いはらったときの1回だけ */
  if(!EVAP.some(it=>it.e===e))EVAP.push({e,t0:performance.now(),dur:1300,die:true});/* たおしたら、たおれるモーションをしてから消える */
  e.dead=true;S.kills++;const D=EN[e.type];{const K=S.enKills||(S.enKills={});K[e.type]=(K[e.type]||0)+1}if(S.ns){S.ns.kill++;if(D.boss)S.ns.boss=2;if(e.type==='boss2'){S.ns.b2=1;S.b2At={x:e.x,y:e.y}}}const n=D.pw||5;
  if(e.type==='hino')S.flags.hinoDown=true;if(D.ash&&WD===1)st2().ashKills=(st2().ashKills||0)+1;
  if(D.boss){S.bossKills=(S.bossKills||0)+1;if(!S.bossDay)S.bossDay=dayNo();if(e.type==='boss'&&!S.ookDay)S.ookDay=dayNo();logEv('オオカゲを追いはらった');memo('⚔️','オオカゲを追いはらった')}
  if(D.boss&&!S.flags.sh_boss&&!S.flags.bossShake&&!WD&&S.res.some(r=>r.name===POKO)){S.flags.bossShake=1;{const go=()=>performance.now()<BOSSHOLD?setTimeout(go,300):dialog([[POKO,'オオカゲはいなくなったのに…まだ手が震えてる…'],...(S.res.some(r=>r.name===MINA)?[[MINA,'よくがんばったねぇ。もう、だいじょうぶだよぉ。']]:[[GOD,'#nod|うむ、よう耐えたのう。もう終わったんじゃ。']])]);setTimeout(go,1200)}}/* 戦闘のあと：フタバのふるえ（かけらの話とは別）。追いはらいの演出で「進む」をおしてから */
  if(D.boss&&WD&&!S.flags.sh_boss&&!S.drops.some(d=>d.id==='shard'))dropAt(e.x,e.y,'shard');/* 草原では、最後のバトルに勝ったときだけかけらが出る *//* オオカゲが落とすかけらは1つだけ */
  if(D.boss&&Math.random()<.5)dropAt(e.x,e.y,'mebuki');/* 半分の確率で「めぶきのしずく」 */
  for(const[id,n,pr]of dropRolls(e.type))if(Math.random()<pr)dropAt(e.x,e.y,id,n);/* 落とし物は1つずつ、べつべつにくじを引く（いくつも落とすことがある） */
  S.pt+=n;S.totalPt+=n;addFloat(e.x,e.y-1,'+'+n,'#ecdcbc');/* 追いはらいは表示どおり */toast((msg||D.name+'を追いはらった！')+' パワー+'+n,'good');
}
/* おとしもの：「コワイノ」がたまに落とす。昼にせいれいが拾う */
const DROPS=[['mat:wood',3],['mat:stone',3],['sand',1]];/* sand：やすらぎの砂（コワイノの落とし物だけで手に入る） */
const DROPSEED={basic:'imo',fast:'tomato',thief:'mugi',brute:'imo',breaker:'mugi',trapper:'tomato',ash:'tomato',rockc:'imo',boss:'mugi',hino:'tomato',yama:'imo',boss2:'mugi'};/* コワイノの種類で、落とす種がちがう（まだ育てられない作物なら、いも） */
const DROPF={basic:'mimamori',fast:'yomawari',breaker:'oyasumi',boss:'yonaka'};/* コワイノの種類ごとの、落とし物だけの家具 */
function dropRolls(t){const sd=DROPSEED[t]&&cropOn(DROPSEED[t])?DROPSEED[t]:'imo',L=[['mat:wood',3,.2],['mat:stone',3,.2],['seed:'+sd,2,.2],['sand',1,.1]];if(DROPF[t])L.push([DROPF[t],1,.005]);if(KWR.some(id=>!(S.recipes||{})[id]))L.push(['recipe',1,.001]);return L}/* [物, 数, 落とす確率]：木材・石材・種20%、やすらぎの砂10%、家具0.5%、コワイノのレシピ0.1% */
function dropList(t){const sd=DROPSEED[t]&&cropOn(DROPSEED[t])?DROPSEED[t]:'imo',L=DROPS.concat([['seed:'+sd,2]]);if(DROPF[t])L.push([DROPF[t],1]);return L}
function monoDrops(n){/* ものひろいの日：村の中の、せいれいが歩いて行ける空いた所に落とす */if(!S.drops)S.drops=[];const r0=S.res.find(q=>!q.hidden),G=bfs(r0?r0.x|0:CX,r0?r0.y|0:CY),C=[];
  for(let q=0;q<W*H;q++)if(VILL[q]&&!S.obj[q]&&walk(q)&&G.dist[q]>=0&&!S.drops.some(d=>d.y*W+d.x===q))C.push(q);
  for(let i=0;i<n&&C.length;i++){const q=C.splice((Math.random()*C.length)|0,1)[0],[id,m]=pick(dropList());S.drops.push({x:q%W,y:(q/W)|0,id,n:m})}}
function dropAt(x,y,want,nn,et){if(!S.drops)S.drops=[];const x0=x|0,y0=y|0;let j=-1;const r0=S.res.find(q=>!q.hidden),G=want?bfs(r0?r0.x|0:CX,r0?r0.y|0:CY):null,reach=q=>!G||G.dist[q]>=0;/* かけら・しずくは、せいれいが行ける場所に落とす */
  for(let rr2=0;rr2<=(want?8:3)&&j<0;rr2++)for(let dy=-rr2;dy<=rr2&&j<0;dy++)for(let dx=-rr2;dx<=rr2;dx++){const xx=x0+dx,yy=y0+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(!S.obj[q]&&walk(q)&&reach(q)&&!S.drops.some(d=>d.y*W+d.x===q)){j=q;break}}
  if(j<0&&G){let bd=1e9;for(let q=0;q<W*H;q++){if(G.dist[q]<0||S.obj[q]||!walk(q)||S.drops.some(d=>d.y*W+d.x===q))continue;const d=Math.hypot(q%W-x0,((q/W)|0)-y0);if(d<bd){bd=d;j=q}}}
  if(j<0)return;const[id,n]=want?[want,nn||1]:pick(dropList(et));S.drops.push({x:j%W,y:(j/W)|0,id,n})}
function takeDrop(d,r){let nm;
  if(d.id==='recipe'){const L=KWR.filter(id=>!(S.recipes||{})[id]);if(!L.length){S.sand=(S.sand||0)+1;return}const id=pick(L);(S.recipes||(S.recipes={}))[id]=true;if(BL[id].kind==='block')(S.unlocked||(S.unlocked={}))[id]=true;kwrSync();sfx('level');queueItemGift({[id]:1},'あたらしいレシピ！',true);memo('📜',BL[id].name+'のレシピをひろった');renderPalette();return}/* コワイノのレシピ（まれ） */
  if(d.id==='sand'){S.sand=(S.sand||0)+d.n;if(!(S.recipes||(S.recipes={})).toro){S.recipes.toro=true;memo('🏮','しずけさの石どうろうが作れるようになった');queueItemGift({toro:1},'あたらしいレシピ！',true)}/* やすらぎの砂をはじめてひろったら、石どうろうのレシピ（知らせを出す） */sfx('seed');toast((r?r.name+'が':'')+'「やすらぎの砂」をひろった（'+S.sand+'）','good');return}/* コワイノの落とし物だけで手に入る、とくべつな素材 */
  if(d.id==='mebuki'){S.mebuki=(S.mebuki||0)+1;sfx('level');toast((r?r.name+'が':'')+'「めぶきのしずく」をひろった！','good');logEv('めぶきのしずくをひろった');
    if(!S.flags.mebukiTold&&WD===0){const sp=S.res.find(q=>KEYRES.includes(q.name))||r;if(sp)talkOnce('mebukiTold',MEBUKIL[elemKey(sp)].map(t=>[sp.name,t]))}return}
  if(d.id==='shard'){S.flags.sh_boss=true;S.shards=Math.min(3,(S.shards||0)+1);memo('💎','ヌシのかけらをひろった（'+S.shards+'/3）');sfx('level');toast((r?r.name+'が':'')+'「ヌシのかけら」をひろった！（'+S.shards+'/3）','good');logEv('ヌシのかけらをひろった');checkQuest();return}
  if(r&&(d.id.startsWith('food:')||d.id.startsWith('mat:'))){const food=d.id.startsWith('food:'),k=d.id.slice(food?5:4),n=Math.min(d.n,roomN(r));if(n>0){if(food)addCarry(r,k,n);else addMat(r,k,n)}if(n<d.n)S.drops.push(Object.assign({},d,{n:d.n-n}));/* せいれいがひろった食べ物・素材は、頭の上につんで、箱へはこぶ。持ちきれない分は地面にのこす */if(n>0&&!d.lt)toast(r.name+'がおとしものをひろった：'+(food?FOODS[k].name:MATN[k])+'×'+n,'good');return}
  if(d.id.startsWith('food:')){const k=d.id.slice(5),add=Math.max(0,Math.min(d.n,foodCap()-S.food));if(add)addFood(k,add);if(add<d.n)S.drops.push(Object.assign({},d,{n:d.n-add}));/* 食料箱に入りきらない分は、そのまま地面にのこる */nm=FOODS[k].name+(add?'×'+add:'（食料箱がいっぱい）')}
  else if(d.id.startsWith('mat:')){const k=d.id.slice(4),add=Math.max(0,Math.min(d.n,matCap()-matTot()));S.mat[k]=(S.mat[k]||0)+add;if(!S.gotMat)S.gotMat={};S.gotMat[k]=(S.gotMat[k]||0)+add;nm=MATN[k]+(add?'×'+add:'（素材箱がいっぱい）');bambooIdea()}
  else{giveItem(d.id,d.n);nm=(d.id.startsWith('seed:')?CROPS[d.id.slice(5)].name+'のたね':BL[d.id].item||BL[d.id].name)+'×'+d.n;if(BL[d.id]&&BL[d.id].kind==='furn')queueItemGift({[d.id]:d.n},'ひろった！')}/* 家具は、大きく知らせる */
  if(!d.lt)toast((r?r.name+'が':'')+'おとしものをひろった：'+nm,'good')}/* 守りの光で落とした素材は、だまってひろう */
const watchUp=()=>Object.keys(S.hp).some(k=>k[0]==='L'&&S.hp[k]>=2&&S.obj[+k.slice(1)]==='watch');/* Lv2以上の見張り台がある */
const WUP=[null,{pc:30,mat:{wood:30,stone:35}},{pc:100,mat:{wood:45,stone:75},sand:5}],YUP=[null,{pc:30,mat:{wood:30,stone:35}},{pc:60,mat:{wood:45,stone:75},sand:5}];/* sand：やすらぎの砂（Lv3への強化だけ） *//* 見張り台・ようがん台の強化 */const WATCH=[null,{dmg:1,range:6,cd:10},{dmg:2,range:6.5,cd:10},{dmg:3,range:7,cd:10}];/* cd：攻撃の間かく（分） */
const YOGAN=[null,{dmg:1,range:5,cd:8,splash:1.5,sdmg:.5},{dmg:2,range:5.5,cd:8,splash:1.5,sdmg:1},{dmg:3,range:6,cd:8,splash:1.5,sdmg:1.5}];/* ようがん台（火山のふもと）：火の玉。当たったまわりにもダメージ */
const enemyLive=()=>!!S&&S.enemies.some(e=>e.spawned&&!e.dead);
const watchGuard=j=>S.res.some(q=>!q.hidden&&q.act&&q.act.type==='watchpost'&&q.act.stage==='do'&&(q.act.cl||0)>=1&&q.act.obj===j);/* 見張り台に木のせいれいが立っているか */
function updTowers(dt){
  if(!S.enemies.length)return;
  for(const j of TOWERS){const o=S.obj[j];if(o!=='watch'&&o!=='yogan'&&o!=='tower')continue;
    S.hp['w'+j]=(S.hp['w'+j]||0)-dt;if(S.hp['w'+j]>0)continue;
    const st=o==='tower'?{dmg:1,range:10,cd:10}:(o==='yogan'?YOGAN:WATCH)[S.hp['L'+j]||1];if(o==='watch'&&!watchGuard(j)){S.hp['w'+j]=1;if(S.ns&&!S.ns.noGuard&&S.enemies.some(e=>e.spawned&&!e.dead)&&!S.res.some(q=>q.act&&q.act.type==='watchpost'&&q.act.obj===j)){S.ns.noGuard=1;toast('見張り台に木のせいれいがいません','warn')}continue}/* 見張り台は、木のせいれいが立っているときだけうつ */if(o==='watch'&&inv('arrow')<1){S.hp['w'+j]=1;if(!S.flags.noArrow&&S.enemies.some(e=>e.spawned&&!e.dead)){S.flags.noArrow=1;toast('見張り台の木の矢がありません','warn')}continue}/* 見張り台は、木の矢がないとうてない */
    const z0=BL[o].sz||[1,1],x=j%W+z0[0]/2,y=((j/W)|0)+z0[1]/2;
    let tg=null,bd=st.range;for(const e of S.enemies){if(!e.spawned||e.dead)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;tg=e}}
    if(tg){if(o==='watch'){S.inv.arrow=inv('arrow')-1;S.flags.noArrow=0;const g=S.res.find(q=>q.act&&q.act.type==='watchpost'&&q.act.stage==='do'&&q.act.obj===j);if(g){g.bowT=performance.now();g.face=tg.x<g.x?-1:1}}/* 見張り台の子が弓をうつ */S.hp['w'+j]=st.cd;tg.hp-=st.dmg;tg.flash=6;sfxAt('shoot',x,y);shots.push({x1:x,y1:y-(o==='tower'?1.4:o==='watch'?1.9:.6),/* 見張り台は、上に立つ子の手から */x2:tg.x,y2:tg.y-.3,life:1,fire:o==='yogan',wood:o==='watch'});
      if(st.splash)for(const e of S.enemies){if(e===tg||!e.spawned||e.dead)continue;if(Math.hypot(e.x-tg.x,e.y-tg.y)<st.splash){e.hp-=st.sdmg;e.flash=6;if(e.hp<=0)defeat(e)}}/* 火の玉は、まわりにもダメージ */
      if(tg.hp<=0&&!tg.dead)defeat(tg)}}
  S.enemies=S.enemies.filter(e=>!e.dead);
}
