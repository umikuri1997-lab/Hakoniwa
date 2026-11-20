/* ---------- 魚のしゅるい ----------
   つれる魚は、ステージ（w）・水（at：river 川＝マップのはしにつながる水、pond 池＝それいがいの水、onsen 温泉）・時間（tm：any いつでも、day 昼 6〜17時、eve 夕方 17〜20時、night 夜 20〜6時）・雨（rain：雨の日だけ、rainday：雨の日は昼も）できまる。
   魚は食べ物（FOODS、fish:1）。料理の材料の「さかな」（need の fish）は、どの魚でもよい（needR）。
   つった魚は、ステージごとに数える（S.fishRec）。図鑑の「さかな」に、つった魚だけ出す。 */
const FISHI={
 funa:{w:0,at:'pond',tm:'any'},koi:{w:0,at:'pond',tm:'day'},nijimasu:{w:0,at:'river',tm:'day'},yumasu:{w:0,at:'river',tm:'eve'},namazu:{w:0,at:'river',tm:'night',rain:'day'},dojo:{w:0,at:'pond',tm:'any',rain:'only'},
 iwana:{w:1,at:'river',tm:'any'},yamame:{w:1,at:'river',tm:'day'},ayu:{w:1,at:'river',tm:'eve'},unagi:{w:1,at:'river',tm:'night'},yuami:{w:1,at:'onsen',tm:'any'},akahara:{w:1,at:'pond',tm:'any',rain:'only'},
 hainuma:{w:1,at:'pond',tm:'any'},hinokobuna:{w:1,at:'pond',tm:'day'},sumiuo:{w:1,at:'pond',tm:'night'},
 kirimasu:{w:3,at:'river',tm:'any'},mioayu:{w:3,at:'river',tm:'day'},yunagi:{w:3,at:'river',tm:'eve'},moyabuna:{w:3,at:'pond',tm:'any'},hasugoi:{w:3,at:'pond',tm:'day'},hotarudojo:{w:3,at:'pond',tm:'night'},
 sorabuna:{w:4,at:'pond',tm:'any'},kumomasu:{w:4,at:'pond',tm:'day'},kazehire:{w:4,at:'pond',tm:'eve'},
 hoshiuo:{w:5,at:'river',tm:'any'},tsukimasu:{w:5,at:'river',tm:'night'},hikaribuna:{w:5,at:'pond',tm:'any'}};/* w：ステージ（草原0・火山1・水3・風4・闇5）。どの水にも「いつでも」の魚を1つは入れる（天気・時間で、つれる魚がいなくならないように） */
const FISHK=Object.keys(FISHI),FISHBASE={0:{pond:'funa',river:'nijimasu'},1:{pond:'hainuma',river:'iwana',onsen:'yuami'},3:{pond:'moyabuna',river:'kirimasu'},4:{pond:'sorabuna',river:'sorabuna'},5:{pond:'hikaribuna',river:'hoshiuo'}};/* 合う魚がいないときの魚：その場所の「いつでも」の魚 */
const fishSt=()=>WD!==FREE&&FISHBASE[WD]?WD:0;/* 魚のステージ（魚のないステージ・フリーモードは草原） */
const FISHAT={river:'川',pond:'池',onsen:'温泉'},FISHTM={any:'いつでも',day:'昼',eve:'夕方',night:'夜'};
const isFish=k=>!!FOODS[k]&&!!FOODS[k].fish;
const fishWhen=k=>{const f=FISHI[k];if(!f)return '';return FISHAT[f.at]+'・'+(f.rain==='only'?'雨の日':FISHTM[f.tm]+(f.rain==='day'?'・雨の日の昼':''))};
let WKM=null,WKS=null;
function waterKind(w){/* 水のマス w は、川・池・温泉のどれか（水がかわったら作りなおす） */if(w<0||S.ground[w]!==1)return 'pond';if(typeof hotW==='function'&&hotW(w))return 'onsen';
  if(WKS!==S||!WKM||WKM.n!==S.ground.length||WKM.h!==fishWaterHash()){WKS=S;WKM={n:S.ground.length,h:fishWaterHash(),k:new Uint8Array(W*H)}}
  const M=WKM.k;if(!M[w]){const comp=[],q=[w],seen=new Set([w]);let edge=false;while(q.length){const k=q.pop();comp.push(k);const x=k%W,y=(k/W)|0;if(x===0||y===0||x===W-1||y===H-1)edge=true;for(const n of[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W]){if(n<0||n>=W*H||seen.has(n)||S.ground[n]!==1)continue;seen.add(n);q.push(n)}}for(const k of comp)M[k]=edge?1:2}
  return M[w]===1?'river':'pond'}
function fishWaterHash(){let h=0,c=0;for(let j=0;j<S.ground.length;j++)if(S.ground[j]===1){h=(h*31+j)|0;c++}return c+':'+h}
function fishTime(){const h=hour();return h>=6&&h<17?'day':h>=17&&h<20?'eve':'night'}
function fishOK(k,at,tm,rain){const f=FISHI[k];if(f.at!==at)return false;if(f.rain==='only')return rain;if(f.tm==='any')return true;if(f.tm===tm)return true;return f.rain==='day'&&rain&&tm==='day'}
function fishPick(stand){/* その場所・いまの時間・天気でつれる魚 */const w=typeof fishW==='function'?fishW(stand):-1,at=waterKind(w),tm=fishTime(),rain=!!S.rain,st=fishSt();
  const L=FISHK.filter(k=>(WD===FREE?FISHI[k].w<=WT():FISHI[k].w===st)&&fishOK(k,at,tm,rain));/* フリーモード：クリアした土地の魚 */if(L.length)return pick(L);const b=FISHBASE[st];return b[at]||b.river}
function fishGot(k){/* つった魚を数える（図鑑） */const R=S.fishRec||(S.fishRec={});R[k]=(R[k]||0)+1;(S.seenIt||(S.seenIt={}))['f:'+k]=1}
function needR(R,r){/* 料理の材料（「さかな」は、どの魚でもよい）：持っている魚・とりかけの魚があれば、その魚。なければ、いちばん多い魚 */if(!R||!R.need||!R.need.fish)return R?R.need:{};const o={};for(const k in R.need)if(k!=='fish')o[k]=R.need[k];
  let sp=null;const held=r&&r.cing&&r.cing.rec===R.key&&r.cing.nd?r.cing.nd:r&&r.cgot&&r.cgot.rec===R.key?r.cgot.m:null;if(held)for(const k in held)if((k==='fish'||isFish(k))&&held[k]>0){sp=k;break}
  if(!sp){let bn=0;for(const k of ['fish',...FISHK]){const n=(S.fs[k]||0)-(SPFISH.has(k)?1e4:0);if((S.fs[k]||0)>0&&(sp==null||n>bn)){bn=n;sp=k}}}/* とくべつな魚は、ほかの魚がないときだけ */
  o[sp||'fish']=R.need.fish;return o}
/* 絵：もらった絵をちぢめたドット絵（tools/art/fishfood/fishfood_art.py）。ICONS（js/draw-spirits.js）にある。 */
const FISHPIX=['................','................','................','................','.........oo.....','.......oohho....','..o..oohhhhhoo..','..oooommmmmmmho.','..ommmmmmmmmoho.','..oooddmmmmmmmo.','..o..oodddddoo..','.......oodddo...','.........oo.....','................','................','................'],
 FISHCOL={hainuma:'#b4b0a8',hinokobuna:'#e8956c',sumiuo:'#8c8ca0',kirimasu:'#b8cce0',mioayu:'#a8d4c4',yunagi:'#e8b890',moyabuna:'#c4c8d4',hasugoi:'#f0b4c4',hotarudojo:'#c8d490',sorabuna:'#a8c8f0',kumomasu:'#e4e8f0',kazehire:'#a8e0d0',hoshiuo:'#c0b4e8',tsukimasu:'#e8dca0',hikaribuna:'#f0e8b8'};
for(const k in FISHCOL){if(ICONS[k])continue;ICONS[k]=pixURL('fish:'+k,FISHPIX,FISHCOL[k]);const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS[k];ICI[k]=im}/* もらう前の、かりの絵（コードのドット）。絵をもらったら ICONS に入れる */
function fishZukan(d,add){/* 図鑑の「さかな」：つった魚だけ */const R=d.fishRec||{};for(const k of FISHK){if(!(R[k]>0))continue;const F=FOODS[k];add(F.name,fishWhen(k)+'・おなか'+F.v+(F.fx?'・'+F.fx:'')+'・つった数 '+R[k],ICONS[k]||null,'i:food:'+k)}}
