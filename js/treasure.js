/* ---------- 宝の地図・ふしぎなふくろ ----------
   地図の切れはし（S.mapPc）：つり・コワイノの落とし物・ふしぎなふくろから。3こで「つなげる」と宝の地図（S.tmap）。
   宝の地図を「ひらく」と、村の外の、せいれいが歩いて行ける空き地に宝の場所（S.tx：マス）がきまり、×の印が出る。せいれいが行って、ほる（tdig）。
   宝：ふしぎなふくろ1こと、家の設計図か家具1つ（霧の宝箱と同じえらび方）。
   ふしぎなふくろ（S.fukuro）：もちものの「あける」で、なにかが出る（素材・たね・食べ物・ふしぎな種・地図の切れはし・家具）。 */
const MAPN=3,TDIGT=30,TXFAR=12;/* 切れはし3こで地図1まい。ほる時間30（20分）。宝は神殿から12マスより遠く */
const TRDESC={mapPc:'3こつなげると、宝の地図になる。',tmap:'ひらくと、宝の場所に印がつく。せいれいが、ほりにいく。',fukuro:'あけると、なにかが出てくる。'};
const TRNAME={mapPc:'地図の切れはし',tmap:'宝の地図',fukuro:'ふしぎなふくろ'};
function trStow(id,n){/* 箱にしまったとき（stowItem から） */if(id==='mapPc'){S.mapPc=(S.mapPc||0)+n;(S.seenIt||(S.seenIt={}))['x:mapPc']=1;return true}if(id==='tmap'){S.tmap=(S.tmap||0)+n;(S.seenIt||(S.seenIt={}))['x:tmap']=1;return true}if(id==='fukuro'){S.fukuro=(S.fukuro||0)+n;(S.seenIt||(S.seenIt={}))['x:fukuro']=1;return true}if(/^ng[012]$/.test(id)){S[id]=(S[id]||0)+n;(S.seenIt||(S.seenIt={}))['x:'+id]=1;return true}/* 夜のたからもの（nightglow.js） */return false}
function mapJoin(){if((S.mapPc||0)<MAPN)return toast('切れはしが足りません','warn');S.mapPc-=MAPN;S.tmap=(S.tmap||0)+1;(S.seenIt||(S.seenIt={}))['x:tmap']=1;sfx('level');if(typeof juiceMapJoin==='function')juiceMapJoin();/* 3まいがくっつく */toast('宝の地図ができた','good');logEv('宝の地図をつなげた');if(sheet==='inv')renderSheet()}
function txSpot(){/* 宝の場所：村の外の、せいれいが歩いて行ける空き地（霧の中・水・段差のちがう所はのぞく） */const r0=S.res.find(q=>!q.hidden);if(!r0)return -1;const G=bfs(r0.x|0,r0.y|0),c=STATUE>=0?STATUE:CY*W+CX,L=[];
  for(let q=0;q<W*H;q++){if(G.dist[q]<0||VILL[q]||S.obj[q]||S.floor[q]||S.ground[q]||!walk(q)||(fogAt(q)))continue;const x=q%W,y=(q/W)|0;if(x<2||y<2||x>W-3||y>H-3)continue;if(Math.hypot(x-c%W,y-((c/W)|0))<TXFAR)continue;if((S.drops||[]).some(d=>d.y*W+d.x===q))continue;L.push(q)}
  return L.length?pick(L):-1}
function mapOpen(){if(!(S.tmap>0))return;if(S.tx!=null)return toast('もう宝の場所が出ています','warn');const j=txSpot();if(j<0)return toast('いまは、宝の場所がわかりません','warn');S.tmap--;S.tx=j;sfx('quest');toast('宝の場所に、印がついた','good');logEv('宝の地図をひらいた');closeSheet();if(typeof panTo==='function')panTo((j%W+.5)*TS,((j/W)+.5)*TS);dirty=true}
function txValid(){if(S.tx==null)return false;const j=S.tx;if(j<0||j>=W*H||S.ground[j]||(fogAt(j))){S.tx=null;return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])){const k=txSpot();S.tx=k<0?null:k;return S.tx!=null}return true}/* 印の所に物が置かれたら、べつの空き地へうつす */
function txJob(r,G){/* 宝の場所へ行って、ほる（畑の世話のあと、木・石より先） */if(isNight()||!txValid()||!free('tx',1))return false;const j=S.tx,st=nearest(G,k=>k===j||adjOf(k,q=>q===j)>=0&&walk(k),9999);if(st<0)return false;startAct(r,G,'tdig',st,{key:'tx',obj:j});return true}
ACT.tdig={start(r,a){if(S.tx!==a.obj)return false;r.bubble='';if(a.stand!==a.obj)r.face=(a.obj%W+.5)<r.x?-1:1},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('dig',r.x,r.y);spawnFX(a.obj%W+.5,((a.obj/W)|0)+.7,'#c9a77a');const p=Math.min(1,a.t/TDIGT);if(p>.3)spawnFX(a.obj%W+.5,((a.obj/W)|0)+.5,p>.7?'#ffe58a':'#fff3c8')}}/* ほるほど、地面から光がもれる */,done:(r,a)=>a.t>=TDIGT||S.tx!==a.obj,
  end(r,a){if(S.tx!==a.obj||a.t<TDIGT)return;S.tx=null;if(typeof vrecAdd==='function')vrecAdd('treasure');burst(a.obj,'furn','furnPlace');if(typeof juiceGlowAt==='function')juiceGlowAt(a.obj%W+.5,((a.obj/W)|0)+.6,2);/* 光の柱と、とびだす光 */sfx('seed');addSpiritXp(1,r);
    const got=['ふしぎなふくろ'];if(!(itemBoxOK()&&addItem(r,'fukuro',1)))dropAt(r.x,r.y,'fukuro',1);
    if(typeof bpNext==='function'&&bpNext()&&Math.random()<.3){bpGiveNext(null);got.push('設計図')}else{const L=FURN.filter(id=>giftPoolOK(id));if(L.length){const id=pick(L);got.push(BL[id].name);if(!(itemBoxOK()&&addItem(r,id,1)))dropAt(r.x,r.y,id,1)}}
    toast(r.name+'が宝をほりあてた：'+got.join('・'),'good');addFloat(r.x,r.y-1.8,'宝！','#ffe08a');logEv('宝をほりあてた');recount();dirty=true}};
ACT_LBL.tdig='宝をほっている';
/* ふしぎなふくろ：あけると出てくる物（[確率, 物]） */
function fukuroRoll(){const q=Math.random();
  if(q<.4){const L=WD===1?['wood','stone','bamboo','kuru','chiri']:WD===WIND?['wood','stone','nabiki','houki','kumowata']:WD===MIZU?['wood','stone','ashi','gama','maruishi']:WD===YAMI?['wood','stone','yotsuyu','kagekusa','kogi']:['wood','stone','shina','kasa','eda'],a=pick(L);let b=pick(L);if(b===a)b=L[(L.indexOf(a)+1)%L.length];return[['mat:'+a,8],['mat:'+b,5]]}
  if(q<.65){const L=Object.keys(CROPS).filter(k=>cropOn(k));return L.length?[['seed:'+pick(L),3]]:[['mat:wood',8]]}
  if(q<.8)return[['food:'+(WD===1?'takenoko':'apple'),5]];
  if(q<.9)return[['mseed',1]];
  if(q<.97)return[['mapPc',1]];
  const L=FURN.filter(id=>giftPoolOK(id));return L.length?[[pick(L),1]]:[['mapPc',1]]}
function fukuroOpen(){if(!(S.fukuro>0))return;S.fukuro--;const got=fukuroRoll(),items=[],gifts={};sfx('seed');let tier=0;/* 中身は、さきにわたす（とちゅうでとじても、なくならない） */
  const mic=k=>{try{return ICONS[k]||''}catch(e){return''}},fic=k=>{try{return typeof foodIc==='function'?foodIc(k):''}catch(e){return''}};
  for(const[id,n]of got){if(id.startsWith('mat:')){const k=id.slice(4);S.mat[k]=(S.mat[k]||0)+n;items.push({img:mic(k),nm:MATN[k]+'×'+n})}else if(id.startsWith('food:')){const k=id.slice(5);addFood(k,n);items.push({img:fic(k),nm:FOODS[k].name+'×'+n})}else if(id==='mseed'){S.mseed=(S.mseed||0)+n;tier=Math.max(tier,1);items.push({img:seedIco(),nm:'ふしぎな種×'+n})}else if(id==='mapPc'){trStow('mapPc',n);tier=Math.max(tier,1);items.push({img:trIco('mapPc'),nm:'地図の切れはし×'+n})}else if(id.startsWith('seed:')){giveItem(id,n);items.push({img:iconURL(id),nm:CROPS[id.slice(5)].name+'のたね×'+n})}else{giveItem(id,n);gifts[id]=n;tier=2;items.push({img:iconURL(id),nm:BL[id].name})}}
  logEv('ふしぎなふくろをあけた');if(sheet==='inv')renderSheet();
  treasureReveal({ico:trIco('fukuro'),taps:FUKUROTAPS[tier],tier,name:'ふしぎなふくろ',done:'ふくろから出てきた',items,rays:1,beam:1,confetti:1,stamp:tier>=1?'あたり':null,after:()=>{if(Object.keys(gifts).length)queueItemGift(gifts,'ふくろから！');if(sheet==='inv')renderSheet()}})}
const FUKUROTAPS=[2,4,6];/* あけるまでのタップの回数：素材・たね・食べ物／ふしぎな種・地図の切れはし／家具・そうび */
/* ---- 絵 ---- */
const TRPIX={
 mapPc:['................','................','...oooooooo.....','...ohhhhhhmo....','...ohmmmmmmdo...','...ohmmdmmmmo...','...ommmmmmmdo...','...ommmdmmmdo...','...ommmmmmmmo...','...ommdmmmmdo...','...ommmmmmmo....','...oddddddo.....','....oooooo......','................','................','................'],
 tmap:['................','..oooooooooooo..','..ohhhhhhhhhmo..','..ohmmmmmmmmdo..','..ohmmwmmmmmdo..','..ommmmwmmmmdo..','..ommmmmwmmmdo..','..ommmmmmwmmdo..','..ommmmmwmwmdo..','..ommmmmmwmmdo..','..ommmmmwmwmdo..','..ommmmmmmmmdo..','..odddddddddddo.','..oooooooooooo..','................','................'],
 fukuro:['................','.......ww.......','......owwo......','.....ohmmdo.....','......omdo......','.....ohhmmo.....','....ohhmmmmo....','...ohmmmmmmdo...','...ohmmmmmmdo...','..ohmmmmmmmmdo..','..ommmmmmmmmdo..','..ommmmmmmmddo..','...ommmmmmddo...','....oddddddo....','.....oooooo.....','................']};
const TRCOL={mapPc:'#ecdcb4',tmap:'#ecdcb4',fukuro:'#c9a6e0'};
const trIco=k=>ICONS[k]||pixURL('tr:'+k,TRPIX[k],TRCOL[k]);/* もらった絵（tools/art/icons32）があれば、それ */
for(const k in TRPIX){if(ICONS[k])continue;ICONS[k]=trIco(k);const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS[k];ICI[k]=im}
function drawTreasure(now){/* 宝の場所の×の印（2点のドット） */if(S.tx==null)return;const j=S.tx,x=(j%W)*TS,y=((j/W)|0)*TS-hiAt(j)*LIFT,b=Math.sin(now/300)*.5+.5;
  ctx.fillStyle='rgba(120,80,40,.25)';ctx.fillRect(x+8,y+20,16,6);ctx.fillStyle='rgba(196,72,52,'+(.75+b*.25)+')';for(let i=0;i<6;i++){ctx.fillRect(x+10+i*2,y+11+i*2,2,2);ctx.fillRect(x+20-i*2,y+11+i*2,2,2)}}
