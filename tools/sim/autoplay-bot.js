/* 自動プレイ（草原）：はじめから、メインクエストを順に進める。ブラウザの中で動く（tools/sim/autoplay.cjs が読みこむ）。
   - 会話・知らせをとじる、話しかける、なかまを呼ぶ、クエストごとの物を置く、守りの光をあてる。
   - 守り神の出番（ミニゲーム）は、成功あつかいで進める（sacredPlayWin）。
   - 遊び方：木箱は家の中・南から柵でかこむ（柵のドアは南のまん中）・箱が8わりうまったら使わない素材をおたきあげ・木箱をふやす・受けたサブクエストをこなす（B.SUB）・矢は見張り台1台に20本・呼べたらすぐ呼ぶ・属性の力をためる（B.attrTick）。
   - BOT_OPTS：supply（パワー・食べ物・花のたねを補給し、やられないようにする。物語の進行だけをたしかめるとき）・light（守りの光を使う）・speed（倍速）。
   - 記録：BOT.log（クエスト・レベル・人数）・BOT.days（1日ごとの数字）・BOT.nights（夜の結果）。
   注意：この中で H という名前を使うので、マップの高さ H は使えない（S.obj.length を使う）。 */
(()=>{
const B=window.BOT={log:[],days:[],nights:[],q:-1,H:{},st:{},on:true,opts:Object.assign({supply:false,light:true,speed:20},window.BOT_OPTS||{})};
B.lg=m=>{B.log.push('D'+dayNo()+' '+hour().toFixed(1)+'h '+m)};
const vis=id=>{const e=document.querySelector(id);return e&&!e.hidden&&e.offsetParent!==null};
B.sites=id=>{let n=0;for(const j in S.dyn){const d=S.dyn[j];if(d&&d.build===id&&S.obj[j]==='site')n++}return n};
B.have=id=>cnt(id)+B.sites(id);
B.spot=(id,nx,ny,ok)=>{for(let r=0;r<30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=nx+dx,y=ny+dy;if(x<1||y<1||x>=W-1||y>=H-1)continue;if(ok&&!ok(x,y))continue;if(typeof WORKF!=='undefined'&&WORKF.has(id)){/* 作業する向きがきまっている家具：前（作業するマス）があく向きで置く */for(const ro of[0,2,1,3]){PLROTS[id]=ro;if(canPlace(id,x,y,false)&&workCells(y*W+x,id,ro).some(k=>walk(k)))return [x,y]}PLROTS[id]=0;continue}if(canPlace(id,x,y,false))return [x,y]}return null};
B.put=(id,nx,ny,ok)=>{const p=B.spot(id,nx,ny,ok);if(!p)return false;const a=B.have(id),i0=inv(id);place(id,p[0],p[1]);return B.have(id)>a||inv(id)<i0};
B.ordered=id=>S.orders.some(o=>o.type===id);
B.ensure=(id,n,nx,ny,ok)=>{if(B.have(id)>=n)return true;const b=BL[id];if(!b)return false;
  if(b.kind==='furn'||b.kind==='block'&&!S.unlocked[id]){if(inv(id)>0){B.put(id,nx,ny,ok)}else if(!B.ordered(id)&&recipeKnown(id)){orderFurn(id)}return false}
  B.put(id,nx,ny,ok);return B.have(id)>=n};
B.ui=()=>{
  for(const P of[typeof ROUTEPOP!=='undefined'&&ROUTEPOP,typeof LVPOP!=='undefined'&&LVPOP]){const b=P&&P.querySelector('.btn');if(b){b.click();return true}}/* お話の道・レシピをえらぶ：はじめの物 */
  const b=[...document.querySelectorAll('.idea-reveal button')].find(b=>!b.disabled);if(b){b.click();return true}if(document.querySelector('.idea-reveal'))return true;
  for(const id of ['#lvup','#rlv']){const e=document.querySelector(id);if(e&&!e.hidden){const bs=[...e.querySelectorAll('button')].filter(b=>!b.classList.contains('lvic'));if(bs.length){bs[bs.length-1].click();return true}}}
  {const y=document.querySelector('.askyn .btn.pri');if(y){y._held=1;y.click();y._held=0;return true}}/* 材料をわたすクエストの「もらってもいい？」は「わたす」 */
  if(vis('#dialog')){const bs=[...document.querySelectorAll('#dlgBtns button')].filter(b=>b.offsetParent!==null);try{DLGA.n=DLGA.full.length;DLGA.readReady=0;DLGA.holdUntil=0}catch(e){}if(bs.length)bs[0].click();return true}
  if(typeof sheet!=='undefined'&&sheet==='summon'){const b=[...document.querySelectorAll('#sheetBody button')].find(b=>b.id!=='sheetX'&&!b.disabled&&b.offsetParent!==null&&!/もどる|とじる|やめる/.test(b.textContent));if(b){b.click();return true}}/* 「だれを呼ぶ？」は、はじめの子をえらぶ（とじると、「！」が出たままになる） */
  if(typeof sheet!=='undefined'&&sheet!=null){closeSheet();return true}
  return false};
B.talk=()=>{ if(isNight())return;
  if(TALKW){if(TALKW===GOD){if(mainStoryBubbleReady())startTalk()}else{const tr=S.res.find(r=>r.name===TALKW&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(tr&&mainStoryBubbleReady(tr))startTalk()}return}
  for(const n in SEVW){const r=S.res.find(r=>r.name===n&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(r){sevTalk(SEVW[n]);return}}
  for(const n in SUBW){if(n===GOD){if(godHere()){subTalk(SUBW[n]);return}continue}const r=S.res.find(r=>r.name===n&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(r){subTalk(SUBW[n]);return}}
  if(S.summon){try{doSummon()}catch(e){B.lg('summon err '+e.message)}}
};
B.light=()=>{ if(!B.opts.light||!S.enemies.length||LIGHTCD>0||S.pt<20)return;let best=null,bd=1e9;for(const e of S.enemies){if(e.dead)continue;let d=1e9;for(const r of S.res)d=Math.min(d,Math.hypot(e.x-r.x,e.y-r.y));if(d<bd){bd=d;best=e}}if(best&&bd<12){B.lt=(B.lt||0)+1;guardLight(best)}};

/* 南がわから少しずつ柵でかこむ（x41〜63・y42〜60。南のまん中は柵のドア） */
B.ring=(()=>{const X0=41,X1=63,Y0=42,Y1=60,MX=52,L=[];for(let d=0;d<=Math.max(MX-X0,X1-MX);d++){if(MX-d>=X0)L.push([MX-d,Y1]);if(d&&MX+d<=X1)L.push([MX+d,Y1])}
  for(let y=Y1-1;y>=Y0;y--){L.push([X0,y]);L.push([X1,y])}for(let x=X0+1;x<X1;x++)L.push([x,Y0]);return L})();
B.fenceTick=()=>{if(isNight()||cnt('site')>=3)return;
  for(const [x,y] of B.ring){const j=y*W+x,o=S.obj[j],want=(x===52&&y===60)?'gate':'fence';if(o===want||o==='site')continue;if(o&&o!=='part'&&!(BL[o]&&BL[o].weed))continue;/* 物がある所は、あとで */
    if(inv(want)<1){if(!B.ordered(want)&&recipeKnown(want)&&S.orders.length<boardMax()){orderFurn(want);if(B.ordered(want))B.lg('ORDER '+want)}continue}const a=B.sites(want);try{place(want,x,y)}catch(e){}if(B.sites(want)>a||S.obj[j]===want)B.lg('FENCE '+want+' '+x+','+y);return}};

/* 素材の箱：箱がいっぱいに近いとき、使わない素材をおたきあげ・木箱をふやす */
B.usedMats=()=>{const u={wood:99,stone:99};const q=QUESTS[S.quest];for(const id in BL){const b=BL[id];if(!b||!b.mat)continue;let ok=false;try{ok=(recipeKnown(id)||learnedIn(S,WD).includes(id))&&(!b.lv||S.lv>=b.lv)}catch(e){}if(!ok)continue;for(const k in b.mat)u[k]=Math.max(u[k]||0,b.mat[k])}
  if(q&&FIELD_PREP&&FIELD_PREP[q.id])for(const id of (FIELD_PREP[q.id].build||{}).ids||[])for(const k in (BL[id]||{}).mat||{})u[k]=Math.max(u[k]||0,BL[id].mat[k]*2);return u};/* 素材ごとに、のこす数：知っている物で、いちばん多く使う数（ないものは0） */
B.boxTick=()=>{if(isNight())return;const cap=boxSlotTot(),tot=(()=>{let n=0;for(const k of BOXL)n+=slotUsed(k);return n})();/* わく：使っている数・ぜんぶ */if(!cap||tot<cap*.6)return;const tight=tot>=cap*.8&&(S.mat.wood||0)<8;
  if(!B.uc||B.ucD!==dayNo()){B.uc=B.usedMats();B.ucD=dayNo()}const Q=S.otakiQ||(S.otakiQ={});B.qneed={};{const q=QUESTS[S.quest];if(q&&FIELD_PREP&&FIELD_PREP[q.id])for(const id of (FIELD_PREP[q.id].build||{}).ids||[])Object.assign(B.qneed,(BL[id]||{}).mat||{})}
  for(const k in MATTRADE){const n=S.mat[k]||0,tr=MATTRADE[k],keep=tight?((k==='wood'||k==='stone')?99:(B.qneed&&B.qneed[k])||0):Math.max(5,B.uc[k]||0);if(tot<cap*.8)continue;if(n<keep+tr||Q[k])continue;const v=Math.floor((n-keep)/tr)*tr;if(v>0){rsvAdd({[k]:v});Q[k]=v;B.lg('OTAKI '+k+' '+v)}}
  const want=BOXL.length+1;if(B.have('crate')<want&&!B.ordered('crate')&&inv('crate')<1){if(recipeKnown('crate')&&(S.mat.wood||0)>=8){orderFurn('crate');if(B.ordered('crate'))B.lg('ORDER crate')}}
  if(inv('crate')>0){const inRing=(x,y)=>x>41&&x<63&&y>42&&y<60;if(B.put('crate',49,50,crateIn)||B.put('crate',52,56,inRing))B.lg('PUT crate')}};
/* サブクエスト：受けたものを、ぜんぶクリアしにいく */
B.subTick=()=>{if(isNight())return;const st=S.subSt||{},done=S.subDone||{};
  for(const q of SUBQ){if(done[q.k]||st[q.k]!==2)continue;let ok=false;try{ok=q.ok&&q.ok()}catch(e){}if(ok)continue;const f=B.SUB[q.k];if(f){try{f(q)}catch(e){B.lg('sub err '+q.k+' '+e.message)}}else if(!B.subMiss||!B.subMiss[q.k]){(B.subMiss=B.subMiss||{})[q.k]=1;B.lg('SUB NOHANDLER '+q.k)}}};
B.SUB={
  oracle:()=>{S.oracle='wood';S.flags.oracleSet=true;checkQuest();try{openSheet('menu')}catch(e){}closeSheet()},
  lighttry:()=>{if(LIGHTCD>0||S.pt<20)return;let best=-1,bd=1e9;S.obj.forEach((o,j)=>{if(o!=='deadtree'&&o!=='tree'&&o!=='rock')return;if(o==='tree'&&!(BL[o]&&BL[o].natural))return;const d=Math.hypot(j%W-52,((j/W)|0)-52);if(d<bd){bd=d;best=j}});if(best>=0){try{natLight(best)}catch(e){B.lg('natLight err '+e.message)}}},
  seedwait_gate:()=>{},/* 南の柵のドアで、そろう */
  table1:()=>{B.ensure('table',1,47,49,inHouse)},
  chair2:()=>{const t=S.obj.indexOf('table');if(t<0)return;const tx=t%W,ty=(t/W)|0,near=(x,y)=>Math.abs(x-tx)<=1&&Math.abs(y-ty)<=1;B.ensure('chair',2,tx,ty,near)},
  farm10:()=>{B.ensure('farm',10,44,56)},
  deco3:()=>{const n=CN(DECOQ);if(n>=3)return;for(const id of DECOQ){if(inv(id)>0){B.put(id,58,47);return}}const c=DECOQ.find(id=>recipeKnown(id)&&lvOK(id));if(c&&!S.orders.some(o=>DECOQ.includes(o.type)))orderFurn(c)},
  tree5:()=>{if(cnt('sprout')<10&&inv('tree')>0){B.plantAll('tree',60,46);return}if(S.feat.shop&&godHere()&&S.pt>60&&inv('tree')<1){try{const p=shopPrice('tree',1);if(p>0&&S.pt>p+20){S.pt-=p;S.inv.tree=(S.inv.tree||0)+1}}catch(e){}}},
  compost:()=>{B.ensure('composter',1,46,57)},
  room:()=>{const L=['chair','table','shelf1','rug','candle','pot','cabinet','lamp'].filter(id=>BL[id]&&recipeKnown(id)&&lvOK(id));for(const id of L){if(inv(id)>0){B.put(id,50,50,inHouse);return}}const c=L.find(id=>!B.ordered(id));if(c&&S.orders.length<2)orderFurn(c)},
};

B.inRing=(x,y)=>x>41&&x<63&&y>42&&y<60;
B.furnN=(id,n,x,y,ok)=>{if(cnt(id)>=n)return;if(inv(id)>0){B.put(id,x,y,ok||B.inRing);return}if(!B.ordered(id)&&recipeKnown(id)&&lvOK(id)&&S.orders.length<boardMax())orderFurn(id)};
B.anyOf=(L,n,x,y,ok)=>{if(CN(L)>=n)return;for(const id of L)if(inv(id)>0){B.put(id,x,y,ok||B.inRing);return}if(S.orders.some(o=>L.includes(o.type)))return;const c=L.find(id=>recipeKnown(id)&&lvOK(id));if(c&&S.orders.length<boardMax())orderFurn(c)};
B.flower=(id,x,y)=>{if(inv(id)>0&&cnt('sprout')<10){B.plantAll(id,x,y);return}if(S.feat.shop&&godHere()&&inv(id)<1){try{const p=shopPrice(id,1);if(p>0&&S.pt>p+30){S.pt-=p;S.inv[id]=(S.inv[id]||0)+1}}catch(e){}}};
Object.assign(B.SUB,{
  salvia3:()=>B.flower('salvia',46,46),lotus3:()=>B.flower('lotus',60,56),lily5:()=>B.flower('lily',44,47),clover3:()=>B.flower('clover',45,58),
  watch2:()=>{if(cnt('watch')+B.sites('watch')<2)B.put('watch',47,62,(x,y)=>y>=61&&y<=64&&!watchNear(y*W+x))},lv_watch2:()=>{},lv_toy2:()=>{},seedwait_food:()=>{},food40:()=>{},bossfood:()=>{},
  bed3:()=>{if(houseBedCount()+inv('bed')<3){if(!B.ordered('bed'))orderFurn('bed')}else if(inv('bed')>0)B.put('bed',47,50,inHouse)},
  light3:()=>B.anyOf(LIGHTQ,3,53,52),houselight:()=>B.anyOf(LIGHTQ.filter(id=>INDL.has(id)),1,48,49,inHouse),
  sticky1:()=>B.furnN('sticky',2,52,62,(x,y)=>y>=61&&y<=64),puddle1:()=>B.furnN('puddle',2,50,62,(x,y)=>y>=61&&y<=64),
  toy2:()=>B.furnN('sandbox',1,57,47),swing1:()=>B.furnN('swing',1,57,45),stor2:()=>B.furnN('taru',1,49,48,inHouse),mbox2:()=>B.furnN('makidana',1,52,56),
  stele1:()=>B.furnN('stele',1,45,45),fountain1:()=>B.furnN('fountain',1,58,53),lighthouse1:()=>B.furnN('lighthouse',1,44,50),lumber1:()=>B.furnN('lumber',1,46,52),quarry1:()=>B.furnN('quarry',1,58,58),
  drum1:()=>B.furnN('drum',1,49,62,(x,y)=>y>=61&&y<=64),pit1:()=>B.furnN('pit',1,55,64,(x,y)=>y>=63&&y<=66),nebari1:()=>B.flower('nebari',47,64),hotaru1:()=>B.flower('hotaru',57,64),
  arrow2:()=>{if(!B.ordered('arrow2')&&recipeKnown('arrow2'))orderFurn('arrow2')},
  talk1:()=>{const r=S.res.find(r=>!(r.act&&r.act.type==='sleep'));if(r&&!document.querySelector('#dialog:not([hidden])'))try{talkTo(r)}catch(e){}},
  festdeco:q=>B.anyOf(DECOQ,CN(DECOQ)+1,58,47),festlight:q=>B.anyOf(LIGHTQ,CN(LIGHTQ)+1,53,52),
});

/* 属性の力をためて、なかまをふやす：呼べる属性のうち、いちばん力が足りる見こみのある属性の物（花・家具）を置く */
B.attrTick=()=>{if(isNight()||S.summon||S.res.length>=30)return;let c=null;try{c=sumCands().filter(x=>!x.cap&&x.v<x.n).sort((a,b)=>b.v/b.n-a.v/a.n)[0]}catch(e){}if(!c)return;const el=c.el;
  const ids=Object.keys(BL).filter(id=>{const b=BL[id];return b&&b.attr&&b.attr[el]>0&&!b.offerOnly&&!b.trap&&!(BEDSET.has(id)&&houseBedCount()<1)});/* 家にまだベッドがなければ、ベッドは家の中へ（H.bed） */
  for(const id of ids)if(BL[id].kind==='plant'&&inv(id)>0&&cnt('sprout')<10){B.plantAll(id,50,46);return}/* 持っている花・苗を植える */
  if(S.feat.shop&&godHere()){for(const id of ids){if(BL[id].kind!=='plant')continue;try{const p=shopPrice(id,1);if(p>0&&S.pt>p+40){S.pt-=p;S.inv[id]=(S.inv[id]||0)+1;return}}catch(e){}}}
  if(S.orders.length>=boardMax()||(S.subSt||{}).table1===2&&!cnt('table')&&!B.ordered('table'))return;/* 食卓のサブクエストのあいだは、木材をとっておく */const f=ids.filter(id=>BL[id].kind==='furn'&&recipeKnown(id)&&lvOK(id)&&!B.ordered(id)).sort((a,b)=>(BL[b].attr[el]||0)-(BL[a].attr[el]||0))[0];
  if(f){if(inv(f)>0){B.put(f,56,48,B.inRing);return}if(Object.entries(BL[f].mat||{}).every(([k,v])=>(S.mat[k]||0)>=v+5))orderFurn(f)}else for(const id of ids)if(inv(id)>0&&BL[id].kind==='furn'){B.put(id,56,48,B.inRing);return}};
B.tick=()=>{ if(!B.on||!S)return; try{
  if(B.ui())return;
  if(S.summon&&!isNight()&&!document.querySelector('#dialog:not([hidden])')&&Date.now()-(B.sumT||0)>3000){B.sumT=Date.now();try{doSummon();B.lg('SUMMON try')}catch(e){B.lg('summon err '+e.message)}return}/* 呼べるようになったら、すぐ呼ぶ */
  if(S.lv>=2)B.fenceTick();B.boxTick();B.subTick();B.attrTick();
  if(S.quest!==B.q){B.lg('QUEST '+S.quest+' '+(QUESTS[S.quest]?QUESTS[S.quest].id:'-')+' lv'+S.lv+' res'+S.res.length+' tp'+Math.floor(S.totalPt)+' food'+S.food);B.q=S.quest}
  if(S.lv!==B.lv){B.lg('LV '+S.lv+' tp'+Math.floor(S.totalPt));B.lv=S.lv}
  if(S.res.length!==B.rn){B.lg('RES '+S.res.map(r=>r.name+':'+r.elem[0]+(r.lv||'')).join(','));B.rn=S.res.length}
  if(S.cleared&&!B.cl){B.cl=1;B.lg('CLEARED')}
  const d=dayNo();if(d!==B.d0&&hour()>=12&&hour()<13){B.d0=d;const n=S.res.length||1;B.days.push([d,S.lv,Math.floor(S.totalPt),Math.floor(S.pt),S.food,S.res.length,JSON.stringify(S.deaths||0).length>3?Object.values(S.deaths).reduce((a,b)=>a+(+b||0),0):(S.deaths||0),Math.round(S.res.reduce((a,r)=>a+r.fun,0)/n),Math.round(S.res.reduce((a,r)=>a+r.hunger/hMax(r)*100,0)/n),QUESTS[S.quest]?QUESTS[S.quest].id:'-',cnt('farm'),S.nights,B.lt||0,GRASSN])}
  if(S.ns&&S.ns!==B.ns0){B.ns0=S.ns;B.nights.push([d,JSON.stringify(S.ns)])}
  if(B.opts.supply)for(const r of S.res){const m=hMax(r)*.6;if(r.hunger<m)r.hunger=m}
  B.light();B.talk();
  const now=performance.now();if(now-(B.ht||0)<1200)return;B.ht=now;
  const q=QUESTS[S.quest];if(q&&B.H[q.id])B.H[q.id](q);
  B.H._all();
}catch(e){B.lg('BOT ERR '+e.message+' '+(e.stack||'').split('\n')[1])}};
const H=B.H,inHouse=(x,y)=>x>=46&&x<=49&&y>=48&&y<=50,crateIn=(x,y)=>y===50&&x>=46&&x<=49/* 木箱は、家のいちばん下の列だけ（ドアの内がわ・家の中の通り道をふさがない。ふさぐと、せいれいが箱へ行けなくなる） */,SR=()=>{const j=S.sacredRoot;return [j%W,(j/W)|0]};
B.plantAll=(id,nx,ny)=>{let n=0;while(inv(id)>0&&cnt('sprout')<10&&n++<10){if(!B.put(id,nx||58,ny||58))break}};
B.sow=k=>{let n=0;for(let j=0;j<S.obj.length;j++){if(S.obj[j]!=='farm')continue;const d=S.dyn[j];if(!d||d.crop)continue;if(cseed(k)<1)break;place('seed:'+k,j%W,(j/W)|0);n++}return n};
H.statue=()=>{if(RUINT>=0&&S.obj[RUINT]==='statueb')templeRuinTap(RUINT);else B.ensure('statue',1,54,57)};/* こわれた神殿を「しらべる」でタップ */H.stor=()=>B.ensure('crate',1,49,50,crateIn);H.mbox=()=>{};
H.wbench=()=>B.ensure('wbench',1,48,50,(x,y)=>crateIn(x,y)&&benchBoxes(y*W+x).length>0);/* 作業台は、木箱のとなり */
H.wall=()=>{for(const k of starterGapCells(S))if(!S.obj[k])place('hwall',k%W,(k/W)|0)};/* 家のすきまは、ゲームの starterGapCells（置く場所をべた書きしない） */
B.weave=n=>{/* はたおり機で、布を n こまで（はたおり機がなければ、置く・たのむ） */if(B.have('loom')<1){if(inv('loom')>0)B.put('loom',56,52);else if(!B.ordered('loom')&&recipeKnown('loom'))orderFurn('loom');return}const j=S.obj.indexOf('loom');if(j<0||(S.mat.nuno||0)+prCount(j)>=n)return;for(const k of GRASSKEYS){const c=Math.min(Math.floor((S.mat[k]||0)/3),n-(S.mat.nuno||0)-prCount(j),PROC.loom.cap-prCount(j));if(c>0){const Q=(S.prQ||(S.prQ={}))[j]||(S.prQ[j]={});rsvAdd({[k]:c*3});Q[k]=(Q[k]||0)+c*3;return}}};
H.bed=()=>{if(houseBedCount()+inv('bed')+B.sites('bed')<1&&!B.ordered('bed'))B.weave(1);B.ensure('bed',1,47,48,inHouse)};
H.path=()=>{if(pathMade()<5)B.put('path',58,60)};
H.fence4=()=>B.ensure('fence',4,54,76);
H.watch1=()=>{B.ensure('watch',1,56,70);B.ensure('spike',2,54,72)};/* 切り株のまわり（調べの物を置く所）は、あけておく */
H.kikyo=()=>B.plantAll('bellf');H.farm6=()=>{B.ensure('farm',6,44,56)};H.imoseed=()=>B.sow('imo');
const field=prep=>q=>{const [sx,sy]=SR(),st=B.st;
  if(typeof SPLAY!=='undefined'&&SPLAY){if(!st.pw||performance.now()-st.pw>4000){st.pw=performance.now();sacredPlayWin()}return}
  /* 調べの準備の物：依頼のあとに、切り株のそばへ置いた物だけが数に入る（前からある物では進まない）。足りないあいだは、持っていれば置き、なければたのむ・建てる */
  {const bp=FIELD_PREP[q.id]&&FIELD_PREP[q.id].bp;if(bp){/* 設計図の準備：もらった設計図を、切り株のそばに置く */if(S.qTalked&&!fieldBuildOK(q.id)&&!(S.bp||[]).some(e=>e.k===bp)){const i=(S.bpInv||[]).findIndex(it=>it.k===bp);if(i>=0)for(let b=-10;b<=10&&(S.bpInv||[]).some(it=>it.k===bp);b++)for(let a=-10;a<=10;a++){const x=sx+a,y=sy+b;if(bpCheck(bp,x,y)[0]){bpPlace(i,x,y);break}}}prep=null}}
  if(prep&&S.qTalked&&!fieldBuildOK(q.id)&&!B.sites(prep)){const near=(x,y)=>fieldDistance(y*W+x,S.sacredRoot)<=FIELD_NEAR_R-1,k=BL[prep].kind;
    if(k==='build')B.put(prep,sx+2,sy+6,near);else if(inv(prep)>0)B.put(prep,sx+2,sy+6,near);else if(!B.ordered(prep)&&recipeKnown(prep))orderFurn(prep)}
  if(!isNight()&&S.qTalked){try{fieldStoryTap(sx+1,sy+1)}catch(e){B.lg('fieldTap err '+e.message)}}};
H.earthListen=field('asabukuro');H.fireRoot=field('campfire');H.waterFilm=field('well');H.windEcho=field('windmill');H.tower=field('bench');
H.warmMeal=()=>{if(warmTableJ()>=0)return;const [sx,sy]=SR(),near=(x,y)=>fieldDistance(y*W+x,S.sacredRoot)<=FIELD_NEAR_R-1;if(inv('table')>0)B.put('table',sx+2,sy+6,near);else if(!B.ordered('table'))orderFurn('table')};/* 切り株のそばに食卓。フタバはそこで食べる */
H.aoFish=()=>{if(S.obj.some(o=>o==='lotus'))return;if(B.opts.supply&&!(S.inv.lotus>0))S.inv.lotus=1;B.plantAll('lotus')};/* ハスのそばの水あび：ハスがなければ池に植える（補給のときは種をわたす。水あびは夕方に、せいれいがする） */
H.kite=()=>{if((S.mat.shina||0)<4){let c=0;S.wreq=S.wreq||{};for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='weed0g'&&!S.wreq[j]&&Math.hypot(j%W-54,(j/W|0)-54)<24&&!(S.fog&&fogAt(j))){S.wreq[j]=1;if(++c>=4)break}}}};/* たこの材料：しなやかな草（枝はいつもひろう） */
H.fire=()=>{if(elemCount('fire')<1&&B.have('watch')<2)B.ensure('watch',2,52,70)};
H.wind=()=>{B.ensure('swing',2,58,54)};
H.kagemark=()=>{if(S.flags.kgMark!=null&&!S.flags.kgLook&&!isNight()){const j=S.flags.kgMark;if(typeof j==='number'){setMode('look');centerOn((j%W+.5)*TS,((j/W|0)+.5)*TS);onTap(VW/2,VH/2)}}};
H.nushi=()=>{if(!isNight()&&S.qTalked&&(S.shards||[]).length&&!B.st.nt||performance.now()-(B.st.nt||0)>8000){B.st.nt=performance.now();const [sx,sy]=SR();setMode('look');centerOn((sx+1.5)*TS,(sy+1.5)*TS);try{onTap(VW/2,VH/2)}catch(e){}}};
H._all=()=>{
  if(S.flags.tapAsk&&!S.flags.tapped&&sheet==null){S.flags.tapPend=true;openSheet('res',S.res[0].id)}
  if(S.quest<7)return;const n=S.res.length;
  for(const id in S.inv){const b=BL[id];if(b&&b.kind==='plant'&&S.inv[id]>0)B.plantAll(id,56+(dayNo()%5)*3,46+(dayNo()%7)*3)}
  if(S.quest>13)for(const k of ['imo','mugi','tomato','cabbage'])if(CROPS[k])B.sow(k);
  if((S.mat.eda||0)<12){let c=0;for(const d of S.drops){if(d.id==='mat:eda'&&!d.tap&&Math.hypot(d.x-54,d.y-54)<22&&!(S.fog&&fogAt(d.y*W+d.x))){d.tap=1;if(++c>=6)break}}}
  if((S.mat.kasa||0)<8){let c=0;S.wreq=S.wreq||{};for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='weed0k'&&!S.wreq[j]&&Math.hypot(j%W-54,(j/W|0)-54)<24&&!(S.fog&&fogAt(j))){S.wreq[j]=1;if(++c>=4)break}}}
  if(houseBedCount()+inv('bed')<n){if(!B.ordered('bed')){B.weave(1);orderFurn('bed')}}
  if(inv('bed')>0)(B.put('bed',47,48,inHouse)||B.put('bed',60,49));
  if(S.quest>8){for(const [id,k] of [['chair',2],['bench',2],['swing',1],['campfire',1],['sandbox',1]])if(recipeKnown(id)&&lvOK(id)&&B.have(id)<k&&S.pt>50)B.ensure(id,k,60,50)}
  if(S.enemyOn&&S.quest>10){
    if((S.inv.arrow||0)<20*Math.max(1,cnt('watch'))&&!B.ordered('arrow')&&recipeKnown('arrow')&&(S.mat.eda||0)>=1&&(S.mat.stone||0)>=1)orderFurn('arrow');/* 見張り台1台につき20本 */
    const wn=Math.min(3,elemCount('wood'));if(B.have('watch')<wn&&S.pt>80)B.ensure('watch',wn,50+B.have('watch')*4,70);
    for(const [id,k] of [['spike',4],['sticky',3],['puddle',3]])if(recipeKnown(id)&&lvOK(id)&&B.have(id)<k&&S.pt>60)B.ensure(id,k,48+((B.have(id)*3)%12),74);
    if(S.pt>120&&B.have('fence')<16)B.ensure('fence',16,46+B.have('fence'),76,(x,y)=>y===76);
  }
  if(S.feat.shop&&godHere()&&S.pt>80&&cnt('farm')+inv('farm')<Math.min(30,4+n*3)){const p=shopPrice('farm',1);S.pt-=p;S.farmBuy=(S.farmBuy||0)+1;S.unlocked.farm=true;S.inv.farm=(S.inv.farm||0)+1}
  if(inv('farm')>0)B.put('farm',44,56);
  if(S.feat.shop&&godHere()&&S.pt>60){for(const k of ['imo','mugi'])if(BL['seed:'+k]&&cseed(k)<3&&S.unlocked['seed:'+k]!==false){try{const p=shopPrice('seed:'+k,2);if(p>0&&p<20){S.pt-=p;S.cseed[k]=cseed(k)+2}}catch(e){}}}
};

B.tapTree=()=>{const [sx,sy]=SR();setMode('look');centerOn((sx+1.5)*TS,(sy+1.5)*TS);try{onTap(VW/2,VH/2)}catch(e){B.lg('tapTree err '+e.message)}};
H.nushi=()=>{if(isNight()||!S.qTalked)return;if(performance.now()-(B.st.nt||0)<6000)return;B.st.nt=performance.now();B.tapTree()};
H.lv5=()=>{};H.omoi=()=>{};H.kiri=()=>{};/* 霧のむこうの影：あらしのつぎの朝に、ひとりで場面がはじまる（kiri.js） */H.wood6=()=>{};
const all0=H._all;
H._all=()=>{all0();
  if(B.opts.supply){
  /* 補給（進行のたしかめ用）：パワー・食べ物・やられない */
  if(S.pt<400)S.pt=400;for(const k of ['wood','stone'])if((S.mat[k]||0)<60)S.mat[k]=60;for(const k of ['eda','kasa','shina','funba'])if((S.mat[k]||0)<12)S.mat[k]=12;if((S.fs.imo||0)<30){S.fs.imo=40;S.food=Object.values(S.fs).reduce((a,b)=>a+b,0)}
  for(const r of S.res){if(r.hunger<350)r.hunger=350}
  const q=QUESTS[S.quest];if(q&&q.steps&&q.steps.some(s=>/^lv\d/.test(s.id))&&S.lv<10){S.totalPt+=25}
  if(q&&q.id==='lv2')S.totalPt+=10;
  if(S.quest>=questIndexOf('tower')||S.cleared){
    for(const id of ['clover','bellf','lily','salvia','tree'])if((S.inv[id]||0)<6){S.unlocked[id]=true;S.inv[id]=(S.inv[id]||0)+6}
    /* みどりをひろげる：晴れた所の、まだみどりでないマスをえらんで植える（みどりの中にばかり植えると、ひろがらない） */
    B.pc=((B.pc||0)+1)%997;let cx=54,cy=54;for(let i=0;i<60;i++){const x=20+((B.pc*37+i*53)%68),y=20+((B.pc*61+i*29)%68),j=y*W+x;if(!(S.fog&&fogAt(j))&&!REV.has(j)&&!S.obj[j]){cx=x;cy=y;break}}
    for(const id of ['tree','clover','bellf','lily','salvia']){if(cnt('sprout')>=10)break;if(inv(id)>0)B.put(id,cx,cy,(x,y)=>!(S.fog&&fogAt(y*W+x)))}
  }
  /* 物語の進行だけを見るとき：みどり・花・なかよしは、時間をかけずにそろえる（その先のお話が進むかを見るため） */
  if(q&&(q.id==='lv5'||q.id==='wood6')&&S.qTalked){let n=0;for(let i=0;i<400&&n<8;i++){const x=20+((B.pc*37+i*53)%68),y=20+((B.pc*61+i*29)%68),j=y*W+x;if(!(S.fog&&fogAt(j))&&!REV.has(j)&&!S.obj[j]&&!S.floor[j]&&walk(j)&&S.ground[j]!==1){S.obj[j]='clover';n++}}if(n)recount()}
  if(q&&q.id==='lv5'&&S.qTalked&&!isNight()&&q.check()===false){const f=printList().find(f=>!printTraced(f.j));if(f){if(S.fog&&S.fog[f.a])fogClear(f.a,true);if(!S.fogReq.includes(f.j)&&!S.res.some(r=>r.act&&r.act.type==='foglook'))S.fogReq.push(f.j)}}/* 足あと：霧を晴らして、フタバに見にいってもらう */
  if(q&&q.id==='omoi'&&S.qTalked&&omoiWait()&&!OMOI_RUN&&!isNight()&&$('#dialog').hidden)sacredTreeTap(S.obj.indexOf('tower'));/* なかよしの2人を、御神木へ */
  if(q&&q.id==='wood6'&&S.qTalked)for(const d of S.drops||[])if(d.ws)d.tap=1;/* きょうだいのたね：ひろいにいってもらう */
  if(q&&q.id==='wood6'&&S.qTalked&&wflCells().length<WFL_N&&S.sacredRoot!=null){const j=S.sacredRoot,R=FIELD_NEAR_R;for(let b=-R;b<sacredSpan()+R&&wflCells().length<WFL_N;b++)for(let a=-R;a<sacredSpan()+R&&wflCells().length<WFL_N;a++){const k=j+b*W+a;if(k>=0&&k<W*H&&!S.obj[k]&&!S.floor[k]&&walk(k)&&S.ground[k]===0)S.obj[k]=wflKind()}recount()}/* えらんだ花を、御神木のそばに */
  if(q&&q.id==='omoi'&&S.qTalked&&omoiN()+(S.flags.omoiW||[]).length<3){const R=S.res.filter(r=>!r.hidden);for(let i=0;i<R.length;i++)for(let k=i+1;k<R.length;k++)if(bondOf(R[i],R[k])<30){bondAdd(R[i],R[k],6);i=R.length;break}}
  for(const e of S.enemies)if(e.type==='boss2'&&e.hp>300)e.hp=300;
  }
  if(S.cleared&&!B.cl2){B.cl2=1;B.lg('CLEARED flags '+Object.keys(S.flags).filter(k=>/reun|final|sacred/i.test(k)).join(','))}
};
TESTM=true;S.speed=B.opts.speed;B.iv=setInterval(()=>B.tick(),200);return 'bot2 ok'})()
