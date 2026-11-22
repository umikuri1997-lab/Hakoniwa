/* ---------- 家の設計図 ----------
   設計図（S.bpInv：[{k,g}]、g はくれたせいれいの id）を「どうぐ」でえらび、左上をタップして置くと、せいれいが、床 → 家具 → 壁・窓 → ドアの順に建てる（S.bp）。
   1つずつの部品は「建てる所」（S.obj='site'、S.dyn[j].bp）で、素材はせいれいが箱から運ぶ。置く所の木・岩は、せいれいが先に切る・ほる。
   できたら、家に名前がつき（S.hname：家の中のマス→名前）、住み心地+10（BPCOMF）。くれたせいれいはよろこび、その家のベッドをつかう。 */
const BPS={/* 設計図。rows の字：「.」床（fl、なければフローリング）・「W」壁（wl、なければ草原は木の壁・火山は竹の壁）・「O」窓・「D」ドア・「p」道（pa、なければあぜ道）・「F」柵（草原は板の柵・火山は御簾垣）・「G」柵のドア・「f」畑・「e」花壇のふち・「 」なにも置かない所。
   furn：[よこ,たて,id,向き]（家具・建物・花・木。2マスより大きい物は左上）。cat：house 家・garden 庭と花畑・farm 畑・play 遊び場・guard 守り。el：くれやすいせいれいの属性。rw：設計図の依頼（bpreq）のごほうびのパワー（置くパワー25まで15・45まで30・それより上50）。
   空いたマスは、ぜんぶ外（家はドアの前）までつながるようにならべる（とじこめられる所を作らない。tools/tests/blueprint.cjs でたしかめる） */
  small:{name:'ちいさなおうち',cat:'house',el:'earth',pc:20,rw:15,rows:['WWOWW','W...W','W...W','WWDWW'],furn:[[1,1,'bed'],[3,1,'stool']]},
  mono:{name:'ものおきごや',cat:'house',el:'earth',pc:20,rw:15,rows:['WWWWW','W...W','W...W','WWDWW'],furn:[[1,1,'crate'],[2,1,'taru'],[3,1,'asabukuro']]},
  hana:{name:'はなのいえ',cat:'house',el:'wood',pc:35,rw:30,rows:['WWOOWW','W....W','W....W','W....W','WWWDWW'],furn:[[1,1,'bed'],[4,1,'monstera'],[4,2,'lantern'],[3,2,'ltable'],[1,3,'monstera']]},
  futari:{name:'ふたりのいえ',cat:'house',el:'water',pc:45,rw:30,rows:['WWOWOWW','W.....W','W.....W','W.....W','WWWDWWW'],furn:[[1,1,'chair',1],[2,1,'table'],[3,1,'chair',3],[5,1,'lantern'],[1,3,'bed'],[5,3,'bed']]},
  nemuri:{name:'ねむりのいえ',cat:'house',el:'water',pc:30,rw:30,rows:['WWOWW','W...W','W...W','WWDWW'],furn:[[1,1,'bed'],[3,1,'shelf1'],[1,2,'lantern']]},
  gohan:{name:'ごはんのいえ',cat:'house',el:'fire',pc:40,rw:30,rows:['WWOOWW','W....W','W....W','W....W','WWWDWW'],furn:[[1,1,'chair',1],[2,1,'table'],[3,1,'chair',3],[4,1,'lantern'],[1,3,'bed']]},
  daidoko:{name:'だいどころのいえ',cat:'house',el:'fire',pc:35,rw:30,rows:['WWOOWW','W....W','W....W','WWDWWW'],furn:[[1,1,'cooktable'],[2,1,'sink'],[3,1,'tub'],[4,1,'taru']]},
  kamado:{name:'かまどのいえ',cat:'house',el:'fire',pc:40,rw:30,rows:['WWOOWW','W....W','W....W','W....W','WWWDWW'],furn:[[1,1,'oven'],[2,1,'tub'],[3,1,'taru'],[4,1,'crate'],[1,3,'table'],[2,3,'chair',3]]},
  kura:{name:'たくわえのくら',cat:'house',el:'earth',pc:25,rw:15,rows:['WWWWW','W...W','W...W','WWDWW'],furn:[[1,1,'crate'],[2,1,'taru'],[3,1,'taru']]},
  monoheya:{name:'ものおきのいえ',cat:'house',el:'earth',pc:30,rw:30,rows:['WWWWWW','W....W','W....W','WWDWWW'],furn:[[1,1,'crate'],[2,1,'asabukuro'],[3,1,'makidana'],[4,1,'crate']]},
  hataori:{name:'はたおりのいえ',cat:'house',el:'wind',pc:35,rw:30,rows:['WWOWW','W...W','W...W','WWDWW'],furn:[[1,1,'loom'],[3,1,'asabukuro'],[1,2,'bed'],[3,2,'lantern']]},
  hon:{name:'ほんのいえ',cat:'house',el:'water',pc:45,rw:30,rows:['WWOOWW','W....W','W....W','W....W','WWDWWW'],furn:[[1,1,'achair'],[2,1,'shelf1'],[3,1,'shelf1'],[4,1,'bed'],[3,3,'ltable'],[1,3,'lantern']]},
  kodomo:{name:'こどものいえ',cat:'house',el:'wind',pc:30,rw:30,rows:['WWOWW','W...W','W...W','WWDWW'],furn:[[1,1,'bed'],[3,1,'pouf'],[3,2,'ltable']]},
  logh:{name:'ログハウス',cat:'house',el:'wood',pc:50,rw:50,wl:'logwall',rows:['WWOWOWW','W.....W','W.....W','W.....W','WWWDWWW'],furn:[[1,1,'bed'],[2,1,'chair',1],[3,1,'table'],[4,1,'chair',3],[5,1,'bed'],[1,3,'lantern'],[5,3,'taru']]},
  shikkui:{name:'しっくいのいえ',cat:'house',el:'earth',pc:45,rw:30,wl:'plasterwall',rows:['WWOOWW','W....W','W....W','W....W','WWWDWW'],furn:[[1,1,'bed'],[2,1,'shelf1'],[4,1,'monstera'],[4,2,'ltable'],[1,3,'lantern']]},
  renga:{name:'レンガのいえ',cat:'house',el:'fire',pc:50,rw:50,wl:'brickwall',fl:'brickfloor',rows:['WWOOWW','W....W','W....W','W....W','WWDWWW'],furn:[[1,1,'oven'],[2,1,'sink'],[3,1,'tub'],[4,1,'taru'],[1,3,'lantern'],[4,3,'bed']]},
  ishi:{name:'いしのゆかのいえ',cat:'house',el:'earth',pc:40,rw:30,fl:'stonefloor',rows:['WWOWW','W...W','W...W','W...W','WWDWW'],furn:[[1,1,'bed'],[3,1,'crate'],[1,3,'stool'],[3,3,'table']]},
  hidamari:{name:'ひだまりのいえ',cat:'house',el:'wood',pc:35,rw:30,rows:['WWOOWW','W....W','W....W','WWDWWW'],furn:[[1,1,'achair'],[2,1,'ltable'],[4,1,'monstera'],[4,2,'bed']]},
  minna:{name:'みんなのいえ',cat:'house',el:'water',pc:70,rw:50,rows:['WWOWWOWW','W......W','W......W','W......W','W......W','WWDWWWWW'],furn:[[1,1,'bed'],[2,1,'bed'],[5,1,'bed'],[6,1,'bed'],[2,3,'chair',1],[3,3,'dtable'],[5,3,'chair',3],[5,4,'lantern']]},
  yozora:{name:'よぞらのいえ',cat:'house',el:'wind',pc:50,rw:50,wl:'yozorawall',dr:'yozoradoor',rows:['WWOWW','W...W','W...W','WWDWW'],furn:[[1,1,'yorubed'],[3,1,'lantern']]},
  hanabench:{name:'はなのベンチ',cat:'garden',el:'wood',pc:15,rw:15,rows:['eeee','    '],furn:[[0,0,'clover'],[1,0,'bellf'],[2,0,'salvia'],[3,0,'lily'],[1,1,'bench']]},
  funsui:{name:'ふんすいひろば',cat:'garden',el:'water',pc:40,rw:30,pa:'gravel',rows:['pppppp','pe  ep','p    p','p    p','pppppp'],furn:[[1,1,'lily'],[4,1,'bellf'],[2,1,'fountain'],[2,3,'bench']]},
  yasumiba:{name:'こかげのやすみば',cat:'garden',el:'wind',pc:25,rw:15,rows:['     ','     ','ppppp'],furn:[[0,0,'hedge'],[1,0,'hedge'],[2,0,'parasol'],[3,0,'hedge'],[4,0,'hedge'],[1,1,'bench']]},
  terrace:{name:'よるのテラス',cat:'garden',el:'fire',pc:25,rw:15,pa:'woodpath',rows:['ppppp','ppppp'],furn:[[0,0,'lamp'],[1,0,'bench'],[3,0,'lantern'],[4,0,'lamp']]},
  wanoniwa:{name:'わのにわ',cat:'garden',el:'water',pc:35,rw:30,pa:'gravel',rows:['     ','     ','ppppp'],furn:[[0,0,'toro'],[4,0,'shishiodoshi'],[1,1,'bench']]},
  takemichi:{name:'たけあかりのこみち',cat:'garden',el:'fire',pc:30,rw:30,pa:'stone',rows:[' p ',' p ',' p ',' p ',' p '],furn:[[0,0,'takeakari'],[2,0,'takeakari'],[0,2,'takeakari'],[2,2,'takeakari'],[0,4,'takeakari'],[2,4,'takeakari']]},
  ringo:{name:'りんごのにわ',cat:'garden',el:'wood',pc:30,rw:30,rows:['     ','     ','     '],furn:[[0,0,'fruit'],[2,0,'fruit'],[4,0,'fruit'],[1,2,'bench']]},
  kokage:{name:'こかげのにわ',cat:'garden',el:'wood',pc:20,rw:15,rows:['    ','    '],furn:[[0,0,'tree'],[3,0,'tree'],[1,1,'bench']]},
  kadan:{name:'かだんのにわ',cat:'garden',el:'wood',pc:30,rw:30,rows:['eeeee','eeeee','     '],furn:[[0,0,'clover'],[1,0,'salvia'],[2,0,'lily'],[3,0,'salvia'],[4,0,'clover'],[0,1,'bellf'],[1,1,'clover'],[2,1,'bellf'],[3,1,'clover'],[4,1,'bellf'],[2,2,'signpost']]},
  hatake1:{name:'ちいさなはたけ',cat:'farm',el:'wood',pc:10,rw:15,rows:['fff','fff','fff'],furn:[]},
  idohatake:{name:'いどのはたけ',cat:'farm',el:'water',pc:40,rw:30,rows:['fff','f f','fff'],furn:[[1,1,'well']]},
  kamehatake:{name:'みずがめのはたけ',cat:'farm',el:'water',pc:25,rw:15,rows:['ffff','ffff','    '],furn:[[0,2,'jar'],[3,2,'composter']]},
  komugi:{name:'こむぎのはたけ',cat:'farm',el:'earth',pc:50,rw:50,rows:['ffff','ffff','    ','    '],furn:[[1,2,'mill']]},
  sakuhatake:{name:'さくのはたけ',cat:'farm',el:'earth',pc:30,rw:30,rows:['FFFFF','FfffF','FfffF','FFGFF'],furn:[]},
  toriniwa:{name:'とりのまきば',cat:'farm',el:'wood',pc:40,rw:30,rows:['FFFFFF','F    F','F    F','F    F','FFGFFF'],furn:[[1,1,'coop'],[4,1,'tub'],[4,3,'crate']]},
  makiba:{name:'まきばのこや',cat:'farm',el:'earth',pc:70,rw:50,rows:['FFFFFFF','F     F','F     F','F     F','F     F','FFFGFFF'],furn:[[1,1,'barn'],[5,1,'makidana'],[5,3,'tub']]},
  kouen:{name:'ちかばのこうえん',cat:'play',el:'wind',pc:35,rw:30,rows:['     ','     ','     '],furn:[[0,0,'swing'],[3,0,'sandbox'],[1,2,'bench']]},
  burankoniwa:{name:'ぶらんこのにわ',cat:'play',el:'wind',pc:30,rw:30,rows:['e  e','    ','    '],furn:[[0,0,'salvia'],[3,0,'lily'],[1,0,'swing'],[1,2,'bench']]},
  doronko:{name:'どろんこひろば',cat:'play',el:'earth',pc:20,rw:15,rows:['    ','    '],furn:[[0,0,'sandbox'],[3,0,'tub'],[0,1,'stool']]},
  camp:{name:'キャンプじょう',cat:'play',el:'fire',pc:30,rw:30,pa:'gravel',rows:['     ','     ','  p  ','     ','     '],furn:[[1,0,'bench'],[2,2,'campfire'],[2,4,'bench']]},
  picnic:{name:'ピクニックのにわ',cat:'play',el:'water',pc:30,rw:30,rows:['     ','     ','     '],furn:[[0,0,'picnic'],[3,0,'table'],[4,0,'chair',3],[3,1,'parasol']]},
  matoba:{name:'まとあてば',cat:'play',el:'fire',pc:25,rw:15,rows:['     ','     ','     ','     '],furn:[[0,0,'mato'],[4,0,'mato'],[1,3,'bench']]},
  oshaberi:{name:'おしゃべりひろば',cat:'play',el:'wind',pc:25,rw:15,rows:['  p  ','  p  ','ppppp','  p  ','  p  '],furn:[[0,0,'bench'],[1,1,'signpost'],[3,4,'bench']]},
  toride:{name:'みはりのとりで',cat:'guard',el:'fire',pc:60,rw:50,rows:['FFFFFF','F    F','F    F','F    F','FFGFFF'],furn:[[2,1,'watch'],[1,1,'torch'],[4,1,'torch']]},
  togemichi:{name:'とげのみち',cat:'guard',el:'earth',pc:15,rw:15,rows:['ppppp','     '],furn:[[0,1,'spike'],[1,1,'spike'],[2,1,'spike'],[3,1,'spike'],[4,1,'spike']]},
  wananiwa:{name:'わなのにわ',cat:'guard',el:'wind',pc:20,rw:15,rows:['    '],furn:[[0,0,'sticky'],[1,0,'puddle'],[2,0,'firetrap'],[3,0,'gust']]},
  kagaribi:{name:'かがりびのみち',cat:'guard',el:'fire',pc:20,rw:15,rows:['ppppp','     '],furn:[[0,1,'lamp'],[2,1,'lamp'],[4,1,'lamp']]},
  taikoba:{name:'あいずのたいこ',cat:'guard',el:'earth',pc:20,rw:15,rows:['   '],furn:[[0,0,'torch'],[1,0,'drum'],[2,0,'torch']]},
  sakumamori:{name:'さくのまもり',cat:'guard',el:'earth',pc:20,rw:15,rows:['FFFFFGFFFFF'],furn:[]},
  /* お話の設計図（story）：御神木の調べの準備で、なかまがくれる。ふつうにはもらえない（bpNext）。切り株のそばにしか置けない（fieldBpNear） */
  nemoto:{name:'根もとのものおき',cat:'house',el:'earth',pc:20,rw:15,story:1,key:'asabukuro',rows:['WWWWW','W...W','W...W','WWDWW'],furn:[[1,1,'asabukuro'],[2,1,'asabukuro'],[3,1,'crate']]},
  takibi:{name:'たき火のひろば',cat:'garden',el:'fire',pc:20,rw:15,story:1,key:'campfire',rows:['     ','ppppp','pp pp','ppppp','     '],furn:[[2,2,'campfire'],[0,0,'stool'],[4,0,'stool'],[2,4,'stool']]},
  otoshiana:{name:'おとしあなのみち',cat:'guard',el:'earth',pc:20,rw:15,rows:['     '],furn:[[0,0,'pit'],[1,0,'spike'],[2,0,'pit'],[3,0,'spike'],[4,0,'pit']]},
};
const BPCAT={house:'家',garden:'庭',farm:'畑',play:'遊び場',guard:'守り'},BPCOMF=10,BPGIVEFUN=30,BPFISH=.02,BPCHEST=.5,BPTALK=.15,BPTALKCD=3,BPELW=3;/* つり2%・霧の宝箱50%・お話15%（3日に1回まで）。くれるせいれいと同じ属性の設計図は、えらばれやすさ3 */
const BPT={floor:8,wall:12,door:15,win:18,furn:40,path:8,farm:8,edge:8,fence:12,gate:15,plant:10};/* 1つずつの部品を建てる時間（建物は BL の time） */
const BPWM={hwall:{wood:1},bamboowall:{bamboo:1},canvaswall:{wood:1},acaciawall:{wood:1,stone:1},timberwall:{wood:1,nendo:1},canalwall:{maruishi:1,nendo:1},mosswall:{stone:1,kogi:1},moonwall:{stone:1,gekko:1},logwall:{wood:1},plasterwall:{wood:1,stone:1},brickwall:{stone:2},yozorawall:{wood:1,stone:1}};/* 壁1マスの素材 */
const BPWINM={hwall:{wood:3},bamboowall:{bamboo:1,wood:2},canvaswall:{wood:3},acaciawall:{wood:3,stone:1},timberwall:{wood:3,nendo:1},canalwall:{maruishi:2,wood:2},mosswall:{stone:2,kogi:1},moonwall:{stone:2,gekko:1},logwall:{wood:3},plasterwall:{wood:3,stone:1},brickwall:{stone:2,wood:2},yozorawall:{wood:3,stone:1}};/* 窓のある壁1マスの素材 */
const BPFM={floor:{wood:1},stonefloor:{stone:1},brickfloor:{stone:1},path:{stone:1},gravel:{stone:1},woodpath:{wood:1},stone:{stone:1},brick:{stone:1},fence:{wood:1},misugaki:{bamboo:1},ropefence:{wood:1,nabiki:1},ashifence:{ashi:1},ibara:{kagekusa:1},bedge:{wood:1},door:{wood:2},yozoradoor:{wood:2},gate:{wood:3}};/* 床・道・柵・ふち・ドア1マスの素材 */
const bpWall=()=>WD===1?'bamboowall':WD===WIND?'canvaswall':WD===MIZU?'timberwall':WD===YAMI?'mosswall':'hwall',bpWallOf=b=>b.wl||bpWall(),bpFence=()=>WD===1?'misugaki':WD===WIND?'ropefence':WD===MIZU?'ashifence':WD===YAMI?'ibara':'fence';
function bpPieceMat(t,id){/* 1つずつの部品の素材 */if(t==='farm'||t==='plant')return{};if(t==='wall')return Object.assign({},BPWM[id]||{wood:1});if(t==='win')return Object.assign({},BPWINM[id]||{wood:3});if(BPFM[id])return Object.assign({},BPFM[id]);return Object.assign({},BL[id].mat||{})}
const bpTime=(t,id)=>t==='build'?BL[id].time:BPT[t];
function bpPieces(k){/* 設計図の部品：[dx,dy,t,id,rot,phase]。段：1 床・道・畑・ふち（1行ずつ）→ 2 家具・建物・花・木 → 3 壁・窓・柵 → 4 ドア・柵のドア（さいご：それまで出入り口があいていて、中のせいれいが出られる） */const b=BPS[k],L=[],wl=bpWallOf(b);
  b.rows.forEach((row,dy)=>{for(let dx=0;dx<row.length;dx++){const c=row[dx];
    if(c==='.')L.push([dx,dy,'floor',b.fl||'floor',0,1]);else if(c==='p')L.push([dx,dy,'path',b.pa||'path',0,1]);else if(c==='f')L.push([dx,dy,'farm','farm',0,1]);else if(c==='e')L.push([dx,dy,'edge','bedge',0,1]);
    else if(c==='W')L.push([dx,dy,'wall',wl,0,3]);else if(c==='O')L.push([dx,dy,'win',wl,0,3]);else if(c==='F')L.push([dx,dy,'fence',bpFence(),0,3]);
    else if(c==='D')L.push([dx,dy,'door',b.dr||'door',0,4]);else if(c==='G')L.push([dx,dy,'gate','gate',0,4])}});
  for(const[dx,dy,id,rot]of b.furn){const t=BL[id].kind==='plant'?'plant':BL[id].kind==='build'?'build':'furn';L.push([dx,dy,t,id,rot||0,2])}return L}
const bpCellsOf=(id,x,y,rot)=>fp(id,x,y,rot||0).map(([a,c])=>c*W+a);/* 家具・建物のマス（2マスより大きい物も） */
function bpCost(k){const m={};for(const p of bpPieces(k)){const pm=bpPieceMat(p[2],p[3]);for(const key in pm)m[key]=(m[key]||0)+pm[key]}return m}
const bpSize=k=>({w:Math.max(...BPS[k].rows.map(r=>r.length)),h:BPS[k].rows.length});
function bpKnown(t,id){/* その部品を、いまのステージで、おぼえているか */const b=BL[id];if(!b)return false;
  if(t==='plant')return !!S.feat.plant&&lvOK(id)&&plantOK(id)&&(WD===0||id==='tree');
  if(t==='furn'||t==='build'){if(b.offerOnly&&STAGEONLY[id]==null||WIND_STAGE_TOYS.has(id)&&WD!==4)return false;if(!((b.w||0)<=WD&&(STAGEONLY[id]==null||STAGEONLY[id]===WD)||grec(id)))return false;/* あとのステージの物・ほかのステージだけの物は、そこでおぼえていなければ入れない */return t==='build'?usable(id):recipeKnown(id)&&lvOK(id)}
  if(t==='win')return !!S.unlocked.window&&!!S.unlocked[id];return !!S.unlocked[id]}
const bpCanGet=k=>bpPieces(k).every(p=>bpKnown(p[2],p[3]));/* 中の物を、ぜんぶおぼえている設計図だけ、もらえる */
const bpIcon=k=>{const b=BPS[k];if(b.cat==='house')return iconURL(bpWallOf(b));const f=b.furn.find(q=>BL[q[2]].kind!=='plant')||b.furn[0];return iconURL(f?f[2]:b.rows.join('').includes('f')?'farm':bpFence())};
const BPNAT=new Set(['ntree','deadtree','bamboo','rock','boulder']);/* 置く所にあれば、せいれいが切る・ほる */
const bpSoft=o=>WEEDS.has(o)||o==='kinoko'||o==='takenoko';/* 置くときに、そのままなくなる */
function bpCheck(k,x,y){/* 置けるか：[ok, わけ] */const {w,h}=bpSize(k);if(x<0||y<0||x+w>W||y+h>H)return[false,'ここには置けません'];const h0=hiAt(y*W+x);
  for(let b=0;b<h;b++)for(let a=0;a<w;a++){const j=(y+b)*W+x+a,o=S.obj[j];
    if(S.ground[j]===1||S.ground[j]===2)return[false,'水の上には置けません'];if(fogAt(j))return[false,'霧の中には置けません'];if(hiAt(j)!==h0)return[false,'段差のある所には置けません'];
    if(STUMPB.has(j)||j===GODJ||sacredNoBuild(j,bpWall()))return[false,'ここには置けません'];
    if(S.floor[j]||S.rug&&S.rug[j]!=null||S.edge&&S.edge[j]||S.roof&&S.roof[j])return[false,'床や物のある所には置けません'];
    if(o&&!BPNAT.has(o)&&!bpSoft(o)&&!VEINS[o])return[false,'物のある所には置けません'];
    if(S.bp&&S.bp.some(e=>e.cells.includes(j)))return[false,'ほかの設計図とかさなっています']}
  if(BPS[k].story&&typeof fieldBpNear==='function'&&!fieldBpNear(k,x,y))return[false,'切り株のそばに置こう'];
  for(const[dx,dy,id]of BPS[k].furn)if(id==='watch'&&watchNear(x+dx,y+dy))return[false,'見張り台は、5マスはなさないと置けません'];
  return[true,'']}
function askBp(i,x,y){const it=(S.bpInv||[])[i];if(!it)return;const k=it.k,[ok,why]=bpCheck(k,x,y),pc=BPS[k].pc,m=bpCost(k);
  pending={kind:'bp',i,k,x,y,ok};$('#confirmTxt').textContent=ok?BPS[k].name+'をここに建てる？（'+SP(pc)+'・'+matTxt(m)+'）':why;
  lackOn($('#cYes'),ok?(S.pt<pc?lackPt(pc):!matOK(m)?lackMat(m):''):'').disabled=!ok;yesLbl('おく');($('#cRot').hidden=true,$('#confirm').hidden=false);dirty=true}
function bpPlace(i,x,y){const it=(S.bpInv||[])[i];if(!it)return;const k=it.k,[ok,why]=bpCheck(k,x,y);if(!ok)return toast(why);const pc=BPS[k].pc,m=bpCost(k);
  if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(m))return toast('素材が足りません（'+matTxt(m)+'）');
  S.pt-=pc;S.bpInv.splice(i,1);const {w,h}=bpSize(k),cells=[];for(let b=0;b<h;b++)for(let a=0;a<w;a++){const j=(y+b)*W+x+a;cells.push(j);if(bpSoft(S.obj[j])){S.obj[j]='';delete S.dyn[j]}}
  const e={id:(S.bpId=(S.bpId||0)+1),k,x,y,g:it.g==null?null:it.g,req:it.req?1:0,cells,ps:bpPieces(k).map(([dx,dy,t,id,rot,ph])=>({j:(y+dy)*W+x+dx,t,id,rot,ph,s:0}))};
  (S.bp||(S.bp=[])).push(e);toast('せいれいが'+BPS[k].name+'を建てにきてくれる','good');sfx('power');bpAdvance(e);recount();dirty=true;renderPalette()}
const bpNatLeft=e=>e.cells.filter(j=>BPNAT.has(S.obj[j])||VEINS[S.obj[j]]);
function bpAdvance(e){/* つぎの段の部品を「建てる所」にする */if(bpNatLeft(e).length)return;const left=e.ps.filter(p=>p.s<2);if(!left.length)return bpComplete(e);const ph=Math.min(...left.map(p=>p.ph));
  const row=ph===1?Math.min(...left.filter(p=>p.ph===1).map(p=>(p.j/W)|0)):null;/* 床は1行ずつ（建てる所がかたまると、まん中へ行けない・とじこめられる） */
  for(const p of left){if(p.ph!==ph||p.s!==0||row!=null&&((p.j/W)|0)!==row)continue;const j=p.j,big=p.t==='furn'||p.t==='build',cs=big?bpCellsOf(p.id,j%W,(j/W)|0,p.rot):[j];
    for(const c of cs)if(bpSoft(S.obj[c])){S.obj[c]='';delete S.dyn[c]}if(cs.some(c=>S.obj[c]))continue;/* だれかが置いた物があれば、どけるまで待つ */
    if(S.res.some(r=>!r.hidden&&cs.includes((r.y|0)*W+(r.x|0))))continue;/* せいれいが立っているマスには、まだ作らない（とじこめない） */
    S.obj[j]='site';S.dyn[j]={build:p.id,p:0,need:bpTime(p.t,p.id),mat:bpPieceMat(p.t,p.id),got:{},bp:e.id};for(const c of cs)if(c!==j){S.obj[c]='site2';S.ref[c]=j}p.s=1}}
function bpFinish(j,r){/* finishBuild から：設計図の部品ができた */const d=S.dyn[j],e=(S.bp||[]).find(q=>q.id===d.bp),p=e&&e.ps.find(q=>q.j===j&&q.s===1);delete S.dyn[j];S.obj[j]='';
  if(!e||!p){recount();return}
  for(const k in S.ref)if(S.ref[k]===j&&S.obj[k]==='site2'){S.obj[k]='';delete S.ref[k]}
  if(p.t==='floor'||p.t==='path')S.floor[j]=p.id;else if(p.t==='edge')(S.edge||(S.edge={}))[j]=p.id;
  else if(p.t==='plant'){S.obj[j]=p.id;if(BL[p.id].dyn)S.dyn[j]={g:0};(S.bud||(S.bud={}))[j]=callDay()+1;noteQuestPlacement(p.id,j);plantSparkle(j,p.id)}/* 花・木は芽から */
  else if(p.t==='furn'||p.t==='build'){if(p.rot)(S.rot||(S.rot={}))[j]=p.rot;S.obj[j]=p.id;setParts(p.id,j,'part');if(BL[p.id].hp)S.hp[j]=BL[p.id].hp;if(BL[p.id].dyn)S.dyn[j]={g:0};noteQuestPlacement(p.id,j)}
  else{setBlock(p.id,j);if(p.t==='win')(S.win||(S.win={}))[j]=1}
  p.s=2;if(r){addSpiritXp(1,r);r.made=(r.made||0)+1}if(p.t!=='plant')burst(j,p.t==='furn'||p.t==='build'?'furn':'block');recount();bpAdvance(e);dirty=true}
const BPDONE={/* できたときの、くれたせいれいのひとこと（同じ物をつづけない pickFresh） */
  house:[[['#joy|わあ……！ ずっと、こんな家にすんでみたかったんだ。'],['#joy|守り神さま、ほんとうに、ありがとう！ 今夜から、ここでねむるね。']],[['#joy|えがいたとおりの家だ……！'],['#joy|守り神さま、ありがとう！ 大切にすむね。']],[['#joy|できた……！ 中に入ってみてもいい？'],['#joy|守り神さま、ありがとう。ここが、おうちになるんだね。']]],
  garden:[[['#joy|わあ……！ えがいたとおりの庭だ。'],['#joy|守り神さま、ありがとう！ ここで、のんびりしたいな。']],[['#joy|すてき……！ ずっと、ながめていたくなるね。'],['#joy|守り神さま、ありがとう！']],[['#joy|できた！ ここに来ると、ほっとするね。'],['#joy|守り神さま、ありがとう。みんなにも見せてあげよう。']]],
  farm:[[['#joy|できた！ これで、おいしいものが、たくさん育てられるね。'],['#joy|守り神さま、ありがとう！']],[['#joy|わあ……！ ここに、なにを育てようかな。'],['#joy|守り神さま、ありがとう！ たいせつに世話するね。']],[['#joy|えがいたとおりだ……！'],['#joy|守り神さま、ありがとう。みのるのが、たのしみだね。']]],
  play:[[['#joy|できた！ みんなで、ここで遊ぼうよ！'],['#joy|守り神さま、ありがとう！']],[['#joy|わあ……！ はやく遊んでみたいな。'],['#joy|守り神さま、ありがとう！ みんなを、よんでくるね。']],[['#joy|えがいたとおりの遊び場だ……！'],['#joy|守り神さま、ありがとう。たくさん遊ぶね。']]],
  guard:[[['#joy|できた……！ これで、夜も、みんなを守れるね。'],['#joy|守り神さま、ありがとう！']],[['#joy|これなら、あの影が来ても、こわくないね。'],['#joy|守り神さま、ありがとう！']],[['#joy|えがいたとおりだ……！ たのもしいね。'],['#joy|守り神さま、ありがとう。いっしょに、村を守ろうね。']]]};
const bpHouseN=()=>S.bpHouse!=null?S.bpHouse:(S.bpDone||0);/* 建てた家の数（家でない設計図がなかったころのセーブは、bpDone が家の数） */
function bpComplete(e){S.bp=S.bp.filter(q=>q!==e);const b=BPS[e.k],cat=b.cat||'house';recount();
  const inner=e.ps.find(p=>p.t==='floor'),h=cat==='house'&&inner&&HOUSES.find(q=>q.inside.has(inner.j));
  if(S.bpHouse==null)S.bpHouse=S.bpDone||0;if(h){(S.hname||(S.hname={}))[inner.j]=b.name;S.bpHouse++}S.bpDone=(S.bpDone||0)+1;
  toast(b.name+'ができた！','good');if(typeof memo==='function')memo(b.name+'ができた');
  const r=e.g!=null?S.res.find(q=>q.id===e.g&&!q.hidden):null;
  if(e.req&&S.bpReq&&S.bpReq.k===e.k)S.bpReq.done=1;/* 設計図の依頼：お礼の会話は、サブクエストの報告で */
  if(r){funAdd(r,BPGIVEFUN,'bp');if(h){const bed=e.ps.find(p=>p.t==='furn'&&BEDSET.has(p.id));if(bed)(S.bedOwn||(S.bedOwn={}))[bed.j]=r.id}/* くれたせいれいが、その家のベッドをつかう */
    if(!e.req)dialog(pickFresh('bpdone:'+cat,BPDONE[cat]).map(l=>[r.name,l[0]]))}
  if(typeof fieldBpDone==='function')fieldBpDone(e);/* 御神木の調べの準備の設計図 */
  checkQuest()}
function bpCancel(e){/* 建てている部品をやめた：設計図ごとやめる（できた部品はのこす。1つもできていなければ、設計図とパワーはもどる） */for(const p of e.ps)if(p.s===1&&S.obj[p.j]==='site'&&S.dyn[p.j]&&S.dyn[p.j].bp===e.id){siteRefund(S.dyn[p.j],p.j);clearObj(p.j)}
  S.bp=S.bp.filter(q=>q!==e);const none=e.ps.every(p=>p.s<2);/* まだ1つもできていない：設計図もパワーももどして、置きなおせる */
  if(none){S.pt+=BPS[e.k].pc;(S.bpInv||(S.bpInv=[])).push(e.req?{k:e.k,g:e.g,req:1}:{k:e.k,g:e.g})}else if(e.req)(S.bpInv||(S.bpInv=[])).push({k:e.k,g:e.g,req:1});/* 設計図の依頼の物は、設計図がもどる（もどらないと、依頼がおわらない） */
  toast(BPS[e.k].name+'を建てるのをやめた'+(none||e.req?'。設計図は、もどった':''));recount()}
const bpOfSite=j=>{const d=S.dyn[j];return d&&d.bp!=null?(S.bp||[]).find(q=>q.id===d.bp)||null:null};
function bpTick(){/* 1秒ごと：木・岩をかたづけおわったら、つぎの段へ。だれかがどけた物のあとも */for(const e of (S.bp||[]).slice()){if(e.ps.some(p=>p.s===1))continue;bpAdvance(e)}}
function bpJob(r,G,dry){/* 置く所の木・岩を、切る・ほる */if(isNight()||!S.bp||!S.bp.length)return false;
  if(roomN(r)<1){if(!r.cmat||!S.bp.some(e=>bpNatLeft(e).length)||matCap()<=0)return false;if(dry)return true;const ks=cmatKeys(r),j=nearest(G,j=>putAdj(j,ks)>=0,200);if(j>=0){startAct(r,G,'smat',j);return true}return false}/* 手がいっぱいなら、先に箱へしまってから、また切りにいく */
  for(const e of S.bp)for(const q of bpNatLeft(e)){const o=S.obj[q],k=o==='rock'||o==='boulder'||VEINS[o]?'mine':'chop';if(!free('o'+q,1))continue;if(dry)return true;
    const j=nearest(G,s=>adjOf(s,c=>c===q)>=0,200);if(j>=0){startAct(r,G,k,j,{key:'o'+q,obj:q});return true}}return false}
const bpHouseName=h=>{if(!S.hname)return null;for(const k in S.hname)if(h.inside.has(+k))return S.hname[k];return null};
function bpGive(k,g){(S.bpInv||(S.bpInv=[])).push({k,g:g==null?null:g});toast('設計図「'+BPS[k].name+'」をもらった','good');bpGotPop(S.bpInv.length-1)}
/* もらったときのカード：「見る」で、そのままプレビューへ（設計図のありかを知らせる） */
function bpGotPop(i,it,s0,v0){if(IS_STORY_REPLAY||typeof MEMRUN!=='undefined'&&MEMRUN)return;it=it||(S.bpInv||[])[i];s0=s0||S;v0=v0==null?VILLAGE_SESSION:v0;if(!it||S!==s0||VILLAGE_SESSION!==v0||!(S.bpInv||[]).includes(it))return;
  if(!$('#dialog').hidden||DLGQ.length||document.querySelector('.pxcard')||!$('#lvup').hidden||typeof GIFT_ACTIVE!=='undefined'&&GIFT_ACTIVE){setTimeout(()=>bpGotPop(i,it,s0,v0),1000);return}/* 会話・ほかのカード・場面のあいだは、まつ */const k=it.k;
  const o=el('<div class="bpgot" style="position:fixed;inset:0;z-index:44;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="font-size:15px;display:block;margin-bottom:6px">設計図をもらった！</b><div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><img alt="" style="width:48px;height:48px;image-rendering:pixelated"><div><b class="nm" style="display:block"></b><p class="note n" style="margin:0"></p></div></div><p class="note" style="margin:0 0 10px">「おく」の「設計図」と、「もちもの」に入っています。</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn x">とじる</button><button class="btn pri go">見る</button></div></div></div>');
  o.querySelector('img').src=bpIcon(k);o.querySelector('.nm').textContent=BPS[k].name;o.querySelector('.n').textContent=BPCAT[BPS[k].cat]+'の設計図';
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};
  o.querySelector('.go').onclick=()=>{sfx('tap');close();const j=(S.bpInv||[]).indexOf(it);if(j>=0)bpPop(j)};document.body.appendChild(o)}
const bpOpen=()=>!!(S.subDone||{}).bphome||!!S.flags.bpOpen;/* 設計図は、土のせいれいのサブクエスト（bphome）をおえてから出る。火山などは、草原でおえていれば（syncTools） */
function bpNext(cat,el,force){/* まだ持っていない・建てていない設計図から1つ（cat：しゅるい、el：くれるせいれいの属性。同じ属性の物がえらばれやすい。force：bphome のとき） */if(!force&&!bpOpen())return null;const have=new Set([...(S.bpInv||[]).map(q=>q.k),...(S.bp||[]).map(q=>q.k),...Object.keys(S.bpGot||{})]);
  const L=Object.keys(BPS).filter(k=>!BPS[k].story&&!have.has(k)&&(!cat||BPS[k].cat===cat)&&bpCanGet(k));if(!L.length)return null;const wt=k=>el&&BPS[k].el===el?BPELW:1;let n=Math.random()*L.reduce((a,k)=>a+wt(k),0);for(const k of L)if((n-=wt(k))<0)return k;return L[L.length-1]}
function bpGiveK(k,g){(S.bpGot||(S.bpGot={}))[k]=1;bpGive(k,g);return k}
function bpGiveNext(g,cat,force){const r=g!=null?S.res.find(q=>q.id===g):null,k=bpNext(cat,r&&r.elem,force);return k?bpGiveK(k,g):null}
/* ---------- 絵：置く前のわく・建てる前の部品のうすい形 ---------- */
function bpGhostDraw(ctx,now){now=now||performance.now();const L=[];if(pending&&pending.kind==='bp'){const {w,h}=bpSize(pending.k);L.push([pending.k,pending.x,pending.y,pending.ok,null])}
  for(const e of S.bp||[])L.push([e.k,e.x,e.y,true,e]);if(!L.length)return;ctx.save();
  for(const[k,x,y,ok,e]of L){const ps=bpPieces(k);for(const[dx,dy,t,id,rot,ph]of ps){if(e){const p=e.ps.find(q=>q.j===(y+dy)*W+x+dx&&q.t===t);if(!p||p.s>0)continue}
      for(const c of t==='furn'||t==='build'?bpCellsOf(id,x+dx,y+dy,rot):[(y+dy)*W+x+dx]){const px=(c%W)*TS,py=((c/W)|0)*TS-liftOf(c);ctx.fillStyle=!ok?'rgba(255,110,110,.30)':t==='floor'?'rgba(255,236,170,.22)':t==='furn'?'rgba(170,220,255,.32)':'rgba(255,214,140,.40)';ctx.fillRect(px+1,py+1,TS-2,TS-2);
      ctx.strokeStyle=!ok?'rgba(255,110,110,.9)':'rgba(255,230,120,.85)';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.strokeRect(px+1.5,py+1.5,TS-3,TS-3);ctx.setLineDash([])}
      if(ok&&(t==='furn'||t==='build'||t==='plant')&&BL[id]){const j0=(y+dy)*W+x+dx,px=(j0%W)*TS,py=((j0/W)|0)*TS-liftOf(j0),rch=ROTS[id]&&rot&&chipOf(id,null,rot);ctx.save();ctx.globalAlpha=.4;if(rch)drawChip(ctx,rch,id,px,py,now);else drawObj(ctx,id,px,py,null,100,now);ctx.restore()}/* 家具・建物・花は、できあがりの絵もうすく */}}
  ctx.restore()}
const BPTALKL={house:'こんな家に、すんでみたいなって',garden:'こんな庭があったら、すてきだなって',farm:'こんな畑があったら、いいなって',play:'こんな遊び場があったら、みんなで遊べるなって',guard:'こんなふうに守れたら、夜もこわくないなって'};
function bpTalkGift(r){/* お話のあと：ときどき、えがいた設計図をくれる */if(Math.random()>=BPTALK)return;const d=callDay();if(S.bpTalkD!=null&&d-S.bpTalkD<BPTALKCD)return;const k=bpNext(null,r.elem);if(!k)return;S.bpTalkD=d;const id=r.id;
  dialog([[r.name,'#think|ねえ、守り神さま……'+BPTALKL[BPS[k].cat]+'、ずっと考えてたんだ。'],[r.name,'#joy|えがいてみたんだ。よかったら、もらって！']],()=>{const q=S.res.find(x=>x.id===id);if(!(S.bpInv||[]).some(z=>z.k===k)&&!(S.bpGot||{})[k])bpGiveK(k,q?q.id:null)})}

/* ---------- 設計図の依頼（サブクエスト bpreq）：bphome のあと、朝に5%、せいれいが設計図をわたして「建ててほしい」とたのむ。建てたらクリア、ごほうびは設計図の rw ---------- */
const BPREQP=.05;
function bpMorning(){if(!bpOpen())return;const D=S.subDone||(S.subDone={}),St=S.subSt||(S.subSt={});
  if(S.bpReq&&D.bpreq){S.bpReq=null;delete D.bpreq;delete St.bpreq;if(S.subSeen)delete S.subSeen.bpreq;return}/* おえた依頼は、つぎの朝にかたづける（また出るように） */
  if(S.bpReq||Math.random()>=BPREQP)return;const L=S.res.filter(r=>!r.hidden);if(!L.length)return;const r=pick(L),k=bpNext(null,r.elem);if(!k)return;S.bpReq={k,who:r.name}}
const bpReqQ=()=>S&&S.bpReq&&BPS[S.bpReq.k];
SUBQ.push({k:'bpreq',
  get g(){const n=S&&S.bpReq&&S.bpReq.who,r=n&&S.res.find(q=>q.name===n);return r?r.elem:'earth'},get who(){return S&&S.bpReq?S.bpReq.who:''},
  get t(){const b=bpReqQ();return b?'「'+b.name+'」を建てよう':'設計図をたのまれた'},
  get how(){const b=bpReqQ();return '「おく」の「設計図」で「'+(b?b.name:'')+'」をえらび、建てたい場所の左上をタップ'},
  get L(){const b=bpReqQ(),c=b?b.cat:'house';return [['K','#think|ねえ、守り神さま……'+BPTALKL[c]+'、ずっと考えてたんだ。'],['K','#joy|えがいてみたんだ。いっしょに建ててくれる？']]},
  X:()=>{const b=bpReqQ();return pickFresh('bpdone:'+(b?b.cat:'house'),BPDONE[b?b.cat:'house']).map(l=>['K',l[0]])},
  get rw(){const b=bpReqQ();return b?b.rw:0},
  at:()=>!!S.bpReq&&!S.bpReq.done&&S.res.some(r=>!r.hidden&&r.name===S.bpReq.who),ok:()=>!!(S.bpReq&&S.bpReq.done),n:1,now:()=>S.bpReq&&S.bpReq.done?1:0,
  onAccept(){const q=S.bpReq;if(!q||(S.bpInv||[]).some(z=>z.k===q.k&&z.req))return;const r=S.res.find(x=>x.name===q.who);(S.bpGot||(S.bpGot={}))[q.k]=1;(S.bpInv||(S.bpInv=[])).push({k:q.k,g:r?r.id:null,req:1});toast('設計図「'+BPS[q.k].name+'」をもらった','good')}});
/* ---------- 設計図のプレビュー：「どうぐ」で設計図をえらぶと、できあがりの絵・むずかしさ・パワー・素材を出す ---------- */
const BPDIFF={15:'かんたん',30:'ふつう',50:'むずかしい'};
function bpPreview(k,cv){const b=BPS[k],{w,h}=bpSize(k),cs=Math.max(12,Math.min(32,Math.floor(264/Math.max(w,h)))),c=cv.getContext('2d');cv.width=w*cs;cv.height=h*cs;cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';
  const L=[];for(const p of bpPieces(k)){const[dx,dy,t,id,rot]=p;let a=1,bh=1;if(t==='furn'||t==='build'){const z=szR(id,rot||0)||[1,1];a=z[0];bh=z[1]}L.push({x:dx,y:dy,w:a,h:bh,id:t==='win'?'window':t==='farm'?'farm':id,t})}
  const ord={floor:0,path:0,farm:0,edge:1,wall:2,win:2,fence:2,door:3,gate:3,plant:4,furn:5,build:5},img={};
  const draw=()=>{c.imageSmoothingEnabled=true;c.fillStyle='#a9cf86';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='rgba(60,90,40,.18)';for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((x+y)&1)c.fillRect(x*cs,y*cs,cs,cs);
    for(const q of L.slice().sort((a,b)=>ord[a.t]-ord[b.t])){const im=img[q.id];if(q.t==='floor'||q.t==='path'||q.t==='wall'||q.t==='win'||q.t==='door'){c.fillStyle=q.t==='floor'?'#e3c79a':q.t==='path'?'#d9c39a':'#9c7650';c.fillRect(q.x*cs,q.y*cs,cs,cs)}if(im&&im.complete&&im.naturalWidth)c.drawImage(im,q.x*cs,q.y*cs,q.w*cs,q.h*cs)}};
  for(const q of L)if(!img[q.id]){const u=iconURL(q.id);if(!u)continue;const im=new Image();im.onload=draw;im.src=u;img[q.id]=im}draw()}
function bpPop(i){const it=(S.bpInv||[])[i];if(!it)return;document.querySelectorAll('.bpgot').forEach(q=>q.remove());/* もらったときのカードは、しまう */const k=it.k,b=BPS[k],m=bpCost(k);
  const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(40,30,15,.35);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink);max-height:86vh;overflow:auto"><b class="t" style="font-size:15px;display:block;margin-bottom:4px"></b><p class="note n" style="margin:0 0 8px"></p><div style="display:flex;justify-content:center;margin-bottom:8px"><canvas class="pv" style="image-rendering:pixelated"></canvas></div><p class="note c" style="margin:0 0 10px"></p><div class="bt" style="display:flex;gap:8px;justify-content:flex-end"><button class="btn x">とじる</button><button class="btn pri go">置く場所をえらぶ</button></div></div></div>');
  o.querySelector('.t').textContent=b.name;o.querySelector('.n').textContent=BPCAT[b.cat]+'の設計図・むずかしさ：'+BPDIFF[b.rw];o.querySelector('.c').textContent='パワー'+b.pc+'・'+matTxt(m);bpPreview(k,o.querySelector('.pv'));
  const close=()=>o.remove();o.querySelector('.x').onclick=()=>{sfx('tap');close()};o.onclick=e=>{if(e.target===o)close()};
  o.querySelector('.go').onclick=()=>{sfx('tap');close();if(sheet)closeSheet();if(mode!=='bulk')setMode('bulk');selStamp='bp:'+i;palOpen=false;renderPalette();toast('建てたい場所の左上をタップ')};document.body.appendChild(o)}/* もちもの・もらったときのカードからも、置く場所をえらべる */
