'use strict';
/* 水のステージの「歌のある食堂」（試作。持ち主がきめた数字。台本は MIZUBE.md の「食堂のしくみ」）。
   店：家の中に、店の看板・食卓・いす・料理の家具があると、食堂になる（shopOf）。
   お客さん：1日2回（昼・夕方）、船着き場に舟で来て、メニューの料理をたのむ。せいれいが箱から運ぶと、食べて、かいがらをはらって帰る。
   ふんいき：店の中のかざり・あかり・ラグ・植物・食堂の家具の点。★がふえると、お客さんがふえる。
   調理のうで：水のステージで料理を作るたびに、せいれいごとにふえる（r.ude）。うでで、料理のおいしさ（★1〜3）がきまる。
   歌：夕方の前に、ミオが歌の舞台で歌うと、その夕方のお客さんがふえる。
   貿易：料理をおくると、つぎの朝に、水の土地にない材料がとどく。
   お客さんは、見た目と動きだけ（セーブしない）。かいがら・メニュー・料理のおいしさ・歌の日はセーブ（S.mz） */
const SHOP={waves:[[11,14],[17,20]]/* お客さんの来る時間 */,min:2,max:4/* 1回のお客さん */,price:[3,5,8]/* おいしさ★1・2・3のかいがら */,extra:5/* メニューにない注文 */,
  fun:{deco:2,light:3,rug:3,plant:2,counter:5,menuboard:5,stage:10},star:[20,40,60,80],song:2/* 歌で、夕方のお客さん */,udeN:10/* うでが1つ上がる料理の数 */,udeMax:10,
  trade:{n:10,get:3,items:['takenoko','egg','milk','apple']},wait:90/* 料理を待つ時間（時計の60分） */,eat:20/* 食べる時間 */,xtra:.1/* メニューにない注文のわりあい */,songH:16,songDur:30};
const SHOPIDS=new Set(['shopsign','counter','menuboard','stage']);
BL.shopsign={hp:4,brk:1,fix:3,fixm:{wood:3},name:'店の看板',kind:'furn',mat:{wood:6},pc:0,time:60,maker:'water',lv:1,w:MIZU,solid:1,attr:{water:1},desc:'家の中に置くと、その家が食堂になる'};
BL.counter={hp:5,brk:1,fix:3,fixm:{wood:4},name:'カウンター',kind:'furn',mat:{wood:12},pc:0,time:80,maker:'wood',lv:1,w:MIZU,solid:1,attr:{wood:1},desc:'食堂のふんいき+5'};
BL.menuboard={hp:4,brk:1,fix:3,fixm:{wood:3},name:'メニューの板',kind:'furn',mat:{wood:6,stone:2},pc:0,time:60,maker:'water',lv:1,w:MIZU,solid:1,attr:{water:1},desc:'食堂のふんいき+5'};
BL.stage={hp:5,brk:1,fix:4,fixm:{wood:5},name:'歌の舞台',kind:'furn',mat:{wood:15,stone:5},pc:0,time:100,maker:'water',lv:1,w:MIZU,solid:1,attr:{water:2},desc:'食堂のふんいき+10。夕方の前に歌うと、その夕方のお客さん+2人'};
for(const id of SHOPIDS){STAGEONLY[id]=MIZU;RLOCK.add(id)}
CRAFT_TABS[0][1].push('shopsign','counter','menuboard','stage');
if(typeof ACT_LBL!=='undefined')Object.assign(ACT_LBL,{mzpick:'お客さんの料理をとりにいく',mzgive:'料理を運んでいる',mzsing:'歌っている'});

/* ---- 店 ---- */
const SHOPC={S:null,cs:null,shop:null,cust:[],seq:0,boatT:0};
function shopOf(){/* 食堂（なければ null）：{h,sign,seats,cooks,fun,stars,stage} */if(!mzOn())return null;if(SHOPC.S===S)return SHOPC.shop;SHOPC.S=S;SHOPC.shop=null;
  for(const h of HOUSES){let sign=-1,stage=-1;const tables=[],cooks=[],seen=new Set();let fun=0;
    for(const j of h.inside){const a=anc(j),o=S.obj[a];if(!o||seen.has(a))continue;seen.add(a);
      if(o==='shopsign')sign=a;if(TABLES.has(o))tables.push(a);if(COOKST.has(o))cooks.push(a);if(o==='stage')stage=a;
      if(SHOP.fun[o])fun+=SHOP.fun[o];else if(LIGHTQ.includes(o))fun+=SHOP.fun.light;else if(DECOQ.includes(o))fun+=SHOP.fun.deco;else if(BL[o]&&BL[o].kind==='plant')fun+=SHOP.fun.plant}
    for(const k in S.rug||{})if(h.inside.has(+k))fun+=SHOP.fun.rug;
    if(sign<0||!tables.length||!cooks.length)continue;
    const tcell=new Set();for(const t of tables){const sz=(BL[S.obj[t]].sz||[1,1]);for(let b=0;b<sz[1];b++)for(let a=0;a<sz[0];a++)tcell.add(t+b*W+a)}
    const seats=[];for(const j of h.inside){const o=S.obj[j];if(!SEATS.includes(o))continue;if([j-1,j+1,j-W,j+W].some(n=>tcell.has(n)))seats.push(j)}
    if(!seats.length)continue;
    SHOPC.shop={h,sign,seats,cooks,fun,stars:SHOP.star.filter(v=>fun>=v).length,stage};break}
  return SHOPC.shop}
const shopMenu=()=>S.mz.menu||(S.mz.menu=[]);
function shopKnown(){/* 作ったことのある料理 */const o=new Set();for(const k in S.cookKn||{}){const d=S.cookKn[k];if(FOODS[d]&&FOODS[d].dish&&!FOODS[d].bad)o.add(d)}return[...o]}
const shopStar=d=>(S.mz.star||{})[d]||1;
const udeLv=r=>Math.min(SHOP.udeMax,1+Math.floor((r.ude||0)/SHOP.udeN));
const udeStar=lv=>lv<=3?1:lv<=7?2:3;
function shopCooked(r,d){/* spirit-act の料理のおわり：うでと、その料理のおいしさ */if(!mzOn()||!FOODS[d]||!FOODS[d].dish)return;r.ude=(r.ude||0)+1;(S.mz.star||(S.mz.star={}))[d]=udeStar(udeLv(r));const m=shopMenu();if(!m.includes(d)&&!S.mz.menuSet)m.push(d)/* メニューをまだきめていないうちは、作った料理がメニューに入る */}

/* ---- お客さん ---- */
const SHOPNAMES=['旅のせいれい','川むこうのせいれい','ふもとのせいれい','島のせいれい'];
function shopDock(){const D=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='dock')D.push(j);if(!D.length)return -1;const d=D[(Math.random()*D.length)|0];return mzAdj(d).find(n=>walk(n)&&!S.ground[n])??-1}
function shopWave(i){const sh=shopOf();if(!sh)return;const start=shopDock();if(start<0)return;const m=shopMenu();if(!m.length)return;
  let n=SHOP.min+((Math.random()*(SHOP.max-SHOP.min+1))|0)+sh.stars+(i===1&&S.mz.songD===callDay()?SHOP.song:0);n=Math.min(n,sh.seats.length);
  const used=new Set(SHOPC.cust.map(c=>c.seat));const free0=sh.seats.filter(s=>!used.has(s));n=Math.min(n,free0.length);
  for(let k=0;k<n;k++){const seat=free0[k],known=shopKnown().filter(d=>!m.includes(d)),x=known.length&&Math.random()<SHOP.xtra;
    const want=x?known[(Math.random()*known.length)|0]:m[(Math.random()*m.length)|0],el=pick(ELEM_KEYS);
    const c=mkRes({nid:-2000-(SHOPC.seq++)},pick(SHOPNAMES),el,start%W+.5,((start/W)|0)+.5);c.id=-2000-SHOPC.seq;c.hidden=false;c.st='come';c.seat=seat;c.want=want;c.x0=x?1:0;c.delay=k*6;c.wt=0;c.path=[];c.act={type:'mzc',stage:'walk',t:0};c.home=start;
    SHOPC.cust.push(c)}
  if(n){SHOPC.boatT=performance.now();toast('お客さんが、舟で来た','good')}}
function shopGoal(c){/* すわる所の、となりの歩けるマス */const s=c.seat;return [s+W,s-1,s+1,s-W].find(n=>walk(n))??-1}
function shopTick(dt){if(!mzOn())return;if(SHOPC.cs!==S){SHOPC.cust=[];SHOPC.cs=S}/* 村をかえたら、お客さんはいなくなる */
  const h=hour(),day=callDay();SHOP.waves.forEach(([a,b],i)=>{const k=day+':'+i;if(h>=a&&h<b&&S.mz.wv!==k&&!isNight()){S.mz.wv=k;shopWave(i)}});
  const sh=shopOf();
  for(const c of SHOPC.cust){if(c.delay>0){c.delay-=dt;continue}
    if(c.st==='come'||c.st==='leave'){if(!c.path.length&&!c.go){const g=c.st==='come'?shopGoal(c):c.home;const G=roadSearch(c.x|0,c.y|0);if(g<0||G.dist[g]<0){c.st='gone';continue}c.path=pathTo(G,g);c.go=1}
      let step=.36*dt;while(step>0&&c.path.length){const j=c.path[0],tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);if(dx)c.face=dx<0?-1:1;if(d<=step){c.x=tx;c.y=ty;c.path.shift();step-=d}else{c.x+=dx/d*step;c.y+=dy/d*step;step=0}}
      c.act.stage=c.path.length?'walk':'do';
      if(!c.path.length){c.go=0;if(c.st==='come'){c.x=c.seat%W+.5;c.y=((c.seat/W)|0)+.5;c.st='wait';c.wt=0;c.bubble=FOODS[c.want]?FOODS[c.want].e:''}else c.st='gone'}continue}
    if(c.st==='wait'){c.wt+=dt;if(!sh||c.wt>SHOP.wait){c.st='leave';c.bubble='';c.go=0;continue}}
    if(c.st==='eat'){c.wt+=dt;if(c.wt>=SHOP.eat){const p=SHOP.price[shopStar(c.want)-1]+(c.x0?SHOP.extra:0);S.mz.shell=(S.mz.shell||0)+p;addFloat(c.x,c.y-1,'かいがら+'+p,'#bfe9f5');sfxAt('tcan',c.x,c.y);c.st='leave';c.bubble='';c.go=0}}}
  SHOPC.cust=SHOPC.cust.filter(c=>c.st!=='gone');
  if(!isNight()&&h>=SHOP.waves[1][1]+1)for(const c of SHOPC.cust)if(c.st==='wait'){c.st='leave';c.bubble='';c.go=0}}
function shopJob(r,G){/* せいれいの仕事：料理を運ぶ・歌う */if(!mzOn()||isNight())return false;const sh=shopOf();if(!sh)return false;
  if(r.mzd){const c=SHOPC.cust.find(q=>q.id===r.mzd.c&&q.st==='wait');if(!c){r.mzd=null;return false}const st=nearest(G,k=>walk(k)&&mzAdj(c.seat).includes(k),9999);if(st<0)return false;startAct(r,G,'mzgive',st,{key:'c'+c.id,cid:c.id});return true}
  if(r.name===MIO&&sh.stage>=0&&hour()>=SHOP.songH&&hour()<SHOP.waves[1][0]&&S.mz.songD!==callDay()){const st=nearest(G,k=>walk(k)&&mzAdj(sh.stage).includes(k),9999);if(st>=0){startAct(r,G,'mzsing',st,{key:'sing',obj:sh.stage});return true}}
  for(const c of SHOPC.cust){if(c.st!=='wait'||c.taken)continue;const key='f:'+c.want;if(!availOf(key))continue;
    const st=nearest(G,k=>walk(k)&&keysAdj(k,[key])>=0,9999);if(st<0)continue;c.taken=r.id;startAct(r,G,'mzpick',st,{key:'c'+c.id,cid:c.id,d:c.want});return true}
  return false}
const SHOPCUT=new Set(['bathe','wander','idle','quirk','critwatch','sunset','rainjoy','admire','ownseat','chat','rest','stretch']);/* お客さんのために、やめてよい事 */
function shopCut(r){if(!mzOn()||isNight()||!r.act||!SHOPCUT.has(r.act.type)||r.hunger<350||(r.shk>S.t))return false;r.shk=S.t+2;return SHOPC.cust.some(c=>c.st==='wait'&&!c.taken&&availOf('f:'+c.want)>0)}
ACT.mzpick={start(r,a){r.bubble=''},done:(r,a)=>a.t>=4,end(r,a){const c=SHOPC.cust.find(q=>q.id===a.cid);const j=(r.y|0)*W+(r.x|0),b=keysAdj(j,['f:'+a.d]);if(c&&b>=0&&boxOut(b,'f:'+a.d,1)){r.mzd={c:a.cid,d:a.d};r.bubble=FOODS[a.d].e}else if(c)c.taken=0}};
ACT.mzgive={start(r,a){const c=SHOPC.cust.find(q=>q.id===a.cid);if(!c||!r.mzd)return false;r.face=(c.x<r.x)?-1:1},done:(r,a)=>a.t>=3,end(r,a){const c=SHOPC.cust.find(q=>q.id===a.cid);if(c&&c.st==='wait'&&r.mzd){c.st='eat';c.wt=0;S.mz.served=(S.mz.served||0)+1;c.bubble='';JUMP.set(c,performance.now());addFloat(c.x,c.y-1.2,FOODS[r.mzd.d].name,'#ffd38a')}else if(r.mzd)availAdd('f:'+r.mzd.d,1);r.mzd=null;r.bubble=''}};
ACT.mzsing={start(r,a){r.bubble='🎵';r.face=1},tick(r,a,dt){funAdd(r,dt*.05,'play')},done:(r,a)=>a.t>=SHOP.songDur,end(r,a){if(a.t>=SHOP.songDur){S.mz.songD=callDay();S.mz.sung=(S.mz.sung||0)+1;toast('ミオの歌が、川にひびいた','good')}r.bubble=''}};
function shopRows(add,now){if(!mzOn())return;for(const c of SHOPC.cust){if(c.delay>0)continue;add(c.y+.03,2,[c.x*TS-30,c.y*TS-70,c.x*TS+30,c.y*TS+15],()=>drawRes(c,now),(c.y|0)*W+(c.x|0))}
  if(performance.now()-SHOPC.boatT<8000){const d=S.obj.indexOf('dock');if(d>=0){const w=mzAdj(d).find(n=>mzWater(n));if(w!=null)add(((w/W)|0)+.02,-1,null,()=>mzBoatDraw((w%W+.5)*TS,(((w/W)|0)+.5)*TS-hiAt(w)*LIFT,0),-1)}}}

/* ---- 貿易・朝 ---- */
function shopMorning(){if(!mzOn())return;const t=S.mz.strade;if(!t)return;const id=SHOP.trade.items[t.i%SHOP.trade.items.length];addFood(id,SHOP.trade.get);toast('貿易の舟が、'+FOODS[id].name+'を'+SHOP.trade.get+'こ とどけてくれた','good');S.mz.strade=null}
function shopSend(){/* 料理をおくる（つぎの朝に、材料がとどく） */if(S.mz.strade)return false;if(shopDishTotal()<SHOP.trade.n){toast('料理が足りません');return false}let left=SHOP.trade.n;for(const k in S.fs){if(left<=0)break;if(!FOODS[k]||!FOODS[k].dish)continue;const t=Math.min(left,S.fs[k]);S.fs[k]-=t;left-=t}syncFood();S.mz.strade={i:S.mz.trN=(S.mz.trN||0)+1};sfx('twater');toast('貿易の舟が出た','good');return true}
function shopDishTotal(){let n=0;for(const k in S.fs||{})if(FOODS[k]&&FOODS[k].dish)n+=S.fs[k];return n}

/* ---- 店の画面 ---- */
function shopPop(){const P=pxPop('食堂'),B=P.body;
  const draw=()=>{B.innerHTML='';const sh=shopOf(),p=t=>{const e=el('<p class="note" style="margin:0 0 6px;font-size:15px"></p>');e.textContent=t;B.appendChild(e)},head=t=>{const h=el('<b style="display:block;font-size:15px;margin:10px 0 5px"></b>');h.textContent=t;B.appendChild(h)},row=()=>B.appendChild(el('<div style="display:flex;flex-wrap:wrap;gap:5px"></div>'));
    p('かいがら（'+(S.mz.shell||0)+'）');
    if(!sh){p('店の看板・食卓・いす・料理の家具を、同じ家の中に置くと、食堂になります');return}
    p('ふんいき（'+sh.fun+'）　★'+sh.stars+'　席（'+sh.seats.length+'）');
    if(S.obj.indexOf('dock')<0)p('船着き場がありません');
    head('メニュー');const K=shopKnown(),m=shopMenu();if(!K.length)p('作ったことのある料理がありません');
    const r0=row();for(const d of K){const on=m.includes(d),b=el('<button class="btn'+(on?' pri':'')+'" type="button"></button>');b.textContent=FOODS[d].name+'（★'+shopStar(d)+'）';b.onclick=()=>{sfx('tap');S.mz.menuSet=1;const i=m.indexOf(d);if(i>=0)m.splice(i,1);else m.push(d);draw()};r0.appendChild(b)}
    head('調理のうで');for(const r of S.res.filter(q=>!q.hidden))p(r.name+'　うで Lv'+udeLv(r)+'（料理 ★'+udeStar(udeLv(r))+'）');
    head('貿易');p('料理を'+SHOP.trade.n+'こおくると、つぎの朝に、この土地にない材料が'+SHOP.trade.get+'ことどく');
    const b=el('<button class="btn" type="button"></button>');b.textContent=S.mz.strade?'つぎの朝にとどく':'料理をおくる';b.onclick=()=>{if(shopSend())draw()};B.appendChild(b)};
  draw()}

/* ---- 絵（コードで描く仮のドット絵） ---- */
function shopDrawObj(c,id,x,y){const P=(col,a,b,w,h)=>mzPx(c,col,x+a,y+b,w,h);
  if(id==='shopsign'){P('#8a6238',14,10,4,22);P('#c49a66',4,4,24,12);P('#d9b684',4,4,24,2);P('#6fbfe0',8,8,6,4);P('#f29a72',18,8,6,4);return}
  if(id==='counter'){P('#8a6238',2,14,28,18);P('#a67c4c',2,14,28,4);P('#c49a66',0,10,32,6);P('#d9b684',0,10,32,2);P('#e9dcc0',10,6,6,4);return}
  if(id==='menuboard'){P('#8a6238',8,24,4,8);P('#8a6238',20,24,4,8);P('#3f5a4a',4,4,24,20);P('#c49a66',4,4,24,2);for(let k=0;k<4;k++)P('#e9dcc0',8,9+k*4,10+(k%2)*6,2);return}
  if(id==='stage'){P('#8a6238',0,20,32,12);P('#c49a66',0,16,32,6);P('#d9b684',0,16,32,2);P('#e8734a',4,0,4,16);P('#e8734a',24,0,4,16);P('#f29a72',4,0,24,4);P('#fff0b0',14,8,4,4);return}}
