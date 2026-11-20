'use strict';
/* 洞窟の探検（土のステージの核。いまは、テスト用のボタンから入る1階だけ）
   ・村は止めたまま（paused）、洞窟だけを、このファイルで動かして描く。村の S はそのまま
   ・洞窟のマスは、村のマップの外（y が H より下、CVOY から）に置く。村のマスを見る共通の描き方（段差の高さなど）が、何もない所を見る
   ・パーティは、村のせいれい（S.res）そのもの。おなかは本物がへる。場所だけ、洞窟の中の物（actor）で持つ
   ・たたかいの数字は村と同じ（攻撃力・SORTIE・EN の hitF・hitN・まもりの光の GUP）。ダメージは hurtEn を通す
   ・属性の道は、5つとも、することがちがう（土 岩をおす・火 消えるたいまつをともして回る・水 2つの水門の片方・風 風車のまっすぐ先に立つ・木 葉を3まい置く）
   ・洞窟にいた時間（CV.t、村の時間 S.t と同じ単位）は、出たときに村を進める（夜20時まで）
   たしかめは tools/tests/cave.cjs */
const CVW=46,CVH=36,CVOY=H+8;
/* # 岩・. 床・S 入口の光・R 下へおりる坂・T 宝箱・o 化石のうまった石・c コカゲ・i イワカゲ
   土：b おせる岩・h くぼみ　火：t たいまつ・D 石のとびら　水：x y 水門・1 2 みぞ　風：m 風車・E 風のとびら　木：k われ目
   できごと：q ひびの床・W うすい壁・! 岩の落ちてくる所
   洞窟らしさ：~ 地底の水（歩けない）・A 石じゅん（歩けない）・g 光るきのこ・^ 坂（1だん上のとなりへ、のぼれる）
   lv は、マスごとの高さ。高い所から低い所へは、とびおりられる。低い所から高い所へは、坂からだけ
   地図は、まるい空洞とくねった道で作る（作ったあと、どのパーティでも入口から坂まで行けること・どこからでも入口か坂へもどれることを、tools/tests/cave.cjs でたしかめる） */
const CVFLOORS=[
{map:[
'##############################################',
'#####################.....####################',
'######kkkk##########.g.R...###################',
'###o.kkkkk..g########.....##.o################',
'##...kkTkk....#########.####.o######....######',
'##m..kk.kk....####..........E#####A.......####',
'##...kkkkk...........A........###.......g..###',
'###o....kk...##...~~~.......c..#...........###',
'######kkkk#####.c~~~~~..i.................^.##',
'################..........A..g###..........###',
'##################..........#####...c.c..c.###',
'#########x########.####.##########.c......####',
'#####..g#1.....#....###q############..T.######',
'####.T...1.......##..#.q######################',
'#####...#1.....#####...#######################',
'##########22222y######!.######################',
'##########.....########!.#####################',
'###########o.o##########!###########.#########',
'########..#############..########.......######',
'#####..h.....#####..........#####......t######',
'####.o.h#b....##...........c..##.t.......##.##',
'####...h......##..A...........##....c....D.T##',
'####T..h.................................##.##',
'####...h......##...c........A.###.......######',
'#####o.h....g#####..g.......#####...t...######',
'########..############.#############.#########',
'######################..######################',
'#######################..W..##################',
'#######################..#.o##################',
'#####################.....####################',
'####################.......###################',
'###################.........##################',
'####################...S...###################',
'#####################.....####################',
'##############################################',
'##############################################'],
 lv:['1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111110000000000011','1111111111111111111111111111111110000000000111','1111111111111111111111111111111110000000000111','1111111111111111111111111111111111000000001111','1111111111111111111111111111111111110000111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111'],
 theme:'roots',chest:{'4,22':{item:'doki'},'43,21':{item:'oldlantern'},'5,13':{fukuro:1,pt:20},'7,4':{mapPc:1,pt:30},'38,12':{fukuro:1,pt:50}}},
{map:[
'##############################################',
'##############################################',
'######...###########......####################',
'####.......#####....A.........################',
'####...S...................g...###############',
'####.......###..^...............##############',
'######...####.........c.......o..#############',
'##############.....A.......c....##############',
'###############.^..............###############',
'################...i.....c....################',
'####################......####################',
'#######################.######################',
'#################............#################',
'##############....~~~~~.~~.....g##############',
'##############.~~~~~~~..~~~~~.....############',
'#############~~~~~~~~~q~~~~~~~~....###########',
'############~~~~~~~~~~q..~~~~~~~...i##########',
'###########~~~~~~~~~T.hb.~~~~~~~~...##########',
'###########~~~~~~~~~~.~~..~~~~~~~..A###...####',
'############~~~~~~~~~~~~~.~~~~~~....##t....###',
'######..o.##~~~~~~~~~~~~~.~~~~~~..c.........##',
'#####m......W..~~~~~~~~~~.~~~~....###.....t.##',
'######....####..~~~~~~~~~.~~....#####.......##',
'##########......g............########......^##',
'##########E###########.###..##########t....###',
'#########T.o##########.####!.##########...####',
'############kkk##x##...#####!.##########D#####',
'##########..kkk..1.....######.!#########.#####',
'##########T.kkk..1.....#######..########.T####',
'##########..kkk..1#y.##########!.#...#########',
'############kkk###22222#########...c...#######',
'##################o...o#########.......#######',
'###################.o.##########.g..R..#######',
'##################################...#########',
'##############################################',
'##############################################'],
 lv:['1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111113331111111111133333311111111111111111111','1111333333311111333333333333331111111111111111','1111333333333333333333333333333111111111111111','1111333333311122222222222222222211111111111111','1111113331111222222222222222222221111111111111','1111111111111122222222222222222211111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111000000011','1111111111111111111111111111111111111100000111','1111111111111111111111111111111111111110001111','1111111111111111111111111111111111111111011111','1111111111111111111111111111111111111111011111','1111111111111111111111111111111111111111001111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111','1111111111111111111111111111111111111111111111'],
 theme:'lake',chest:{'20,17':{fukuro:1,pt:40},'9,25':{mapPc:1,pt:40},'41,28':{fukuro:1,pt:60},'10,28':{mapPc:1,pt:60}}}];
const CVPARTY=3,CVFOOD=6;/* つれていく人数・持っていく食べ物の数 */
const CVH0=6,CVH1=16,CVNIGHT=20;/* 出かけられる時刻（6時〜16時）・夜20時には村へもどる */
const CVWALK=2.6,CVFOE=1.5;/* 1秒に歩くマス：せいれい（移動速度20のとき）・コワイノ（EN の sp 1のとき） */
const CVSEE=4.2,CVLIGHT=4.4,CVWAKE=3.6,CVAGGRO=6;/* マス：見える・光の絵の半径・コワイノが目をさます・せいれいがねらう */
const CVSEED=2,CVLIGHTD=2.4,CVWAKED=1.2;/* 光をしぼったとき：見える・光の絵の半径・コワイノが目をさます */
const CVAMBUSH=50;/* ふいうち：ねているコワイノへのはじめの一撃にたすダメージ */
const CVHUN={walk:.4,stand:.1,work:3};/* おなかのへり（村と同じ数。コードの1分ごと） */
const CVPUSHT=2,CVSLUICET=4,CVLEAFT=3;/* 作業の時間（コードの分）：岩を1マスおす・水門をあける・葉を置く */
const CVTORCH=14;/* たいまつがともっている時間（時計の分） */
const CVLEAF=3;/* 足場の葉の数 */
const CVFLOW=250,CVGUST=12;/* 水が1マス流れるミリ秒・風が1秒に進むマス */
const CVROCKMS=1200,CVROCKCD=4000,CVROCKHUN=80,CVROCKDMG=80;/* 落ちてくる岩：かげが出てから落ちるまで・つぎまで（ミリ秒）・せいれいのへるおなか・コワイノへのダメージ */
const CVGATE={b:{el:'earth',no:'土のせいれいがいません'},t:{el:'fire',no:'火のせいれいがいません'},x:{el:'water',no:'水のせいれいがいません'},y:{el:'water',no:'水のせいれいがいません'},m:{el:'wind',no:'風のせいれいがいません'},k:{el:'wood',no:'木のせいれいがいません'}};
const CVJOBANIM={push:'mine',sluice:'water',leaf:'plant'};
/* 化石（石のかたまりから1つ。どれが出るかは、そのたびにきまる） */
const CVFOS={kai:'うずまき貝の化石',shida:'シダの葉の化石',hone:'さかなのほねの化石',kiba:'おおきなきばの化石',tsume:'つめあとの化石'},CVFOSK=Object.keys(CVFOS),CVFOSALL=100;/* 5しゅるいそろえたときのパワー */
/* 宝箱（マスの場所ごと）。家具は、はじめの1回だけ。2回めからは CVAGAIN のパワー */
const CVAGAIN=30;
const CVDARK=.8;/* 光のとどかない所の暗さ（持ち主のたのみ：ARKの洞窟のように暗く、光る物の光を目立たせる） */
const CVGLOW=1.5,CVOREGLOW=1.1,CVLURE=9;/* マス：光るきのこ・光る鉱石のあかり・見ていない所の光が見えるきょり */
const CVOREP=.06;/* 正面の見える岩のうち、光る鉱石のわりあい */
const CVDRIP=[1400,3800],CVDRIPR=6;/* しずく：つぎまでのミリ秒（みじかい・ながい）・パーティからのマス */
const CVCH=8,CVPAD=2,CVCHMAX=12;/* 下絵の区画：8×8マス・のりしろ・とっておく数（1区画 516×516 で約1MB） */
/* 化石：洞窟でひろった数は、ステージごとに数える（S.fosRec）。図鑑の「かせき」に、見つけた物だけ出す。アイコンは、コードのドット（仮の絵。石の板に、くぼんだ形） */
const CVFOSD={kai:'うずをまいた貝のあと。',shida:'こまかい葉のあと。',hone:'ほねだけになった魚のあと。',kiba:'手のひらより大きな、きばのあと。',tsume:'岩をひっかいた、3本のつめのあと。'};
const CVFOSP={kai:[[7,5],[8,5],[9,6],[10,7],[10,8],[9,9],[8,10],[7,10],[6,9],[5,8],[5,7],[6,6],[7,7],[8,7],[8,8]],
  shida:[[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[7,5],[6,4],[9,5],[10,4],[7,7],[6,6],[5,6],[9,7],[10,6],[11,6],[7,9],[6,8],[5,8],[9,9],[10,8],[11,8]],
  hone:[[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[5,6],[5,7],[5,9],[5,10],[7,6],[7,7],[7,9],[7,10],[9,6],[9,7],[9,9],[9,10],[12,7],[12,9],[13,8],[12,8],[3,6],[3,10],[4,7],[4,9]],
  kiba:[[6,4],[7,4],[8,4],[6,5],[7,5],[8,5],[9,5],[7,6],[8,6],[9,6],[8,7],[9,7],[10,7],[9,8],[10,8],[9,9],[10,9],[10,10],[10,11]],
  tsume:[[3,6],[4,7],[5,8],[6,9],[7,10],[8,11],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9],[9,3],[10,4],[11,5],[12,6],[13,7]]};
function fossilRows(k){const T=['................','....oooooooo....','..oohhhhhhhmoo..','.ohhmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ohmmmmmmmmmmdo.','.ommmmmmmmmmddo.','..oodddddddddo..','....oooooooo....','................'].map(r=>r.split(''));
  for(const[x,y]of CVFOSP[k]||[])if(T[y]&&T[y][x]&&T[y][x]!=='.')T[y][x]='o';return T.map(r=>r.join(''))}
function fossilIcon(k){return typeof pixURL==='function'?pixURL('fos:'+k,fossilRows(k),'#cdb99c'):null}
function fossilGive(k,n){if(!CVFOS[k]||!(n>0))return;const R=S.fosRec||(S.fosRec={});R[k]=(R[k]||0)+n}
function fossilZukan(d,add){const R=d.fosRec||{};for(const k of CVFOSK)if(R[k]>0)add(CVFOS[k],CVFOSD[k]+'見つけた数 '+R[k],fossilIcon(k),'i:mat:stone')}
const CVFOES={c:'basic',i:'rockc'};
let CV=null;
const caveOn=()=>!!CV;
const cvJ=(x,y)=>y*CVW+x,cvX=j=>j%CVW,cvY=j=>(j/CVW)|0;
const cvCell=e=>cvJ(e.x|0,(e.y|0)-CVOY);
const cvAdj=(j,k)=>Math.abs(cvX(j)-cvX(k))+Math.abs(cvY(j)-cvY(k))===1;
const cvNear=(j,k)=>j!==k&&Math.max(Math.abs(cvX(j)-cvX(k)),Math.abs(cvY(j)-cvY(k)))<=1;/* ななめもふくめて、となり */
const cvName=r=>typeof nickTx==='function'?nickTx(r.name):r.name;/* つけた名前（nick.js） */
const cvHour=()=>((clk()+(CV?CV.t:0))/60)%24;
const cvSeeR=()=>CV.dim?CVSEED:CVSEE;
/* 会話・ポップアップ・レベルアップの画面が出ているあいだは、洞窟も止める */
function cvHold(){return !$('#dialog').hidden||sheet!=null||!$('#rlv').hidden||!$('#lvup').hidden||!!document.querySelector('.pxpopw')||GIFT_ACTIVE||USERPAUSE}
/* 高さ：同じか低いマスへは進める。高いマスへは、坂のマスから、1だん上へだけ */
function cvStepOK(j,k){const C=CV,a=C.lv[j],b=C.lv[k];if(b<=a)return true;const o=C.ob.get(j);return b===a+1&&!!o&&o.k==='^'}
function cvWalk(j){const C=CV;if(j<0||j>=CVW*CVH||!C.g[j]||C.wt[j])return false;const o=C.ob.get(j);if(!o)return true;
  switch(o.k){case'S':case'R':case'!':case'g':case'^':return true;case'q':return !o.gone;case'h':case'k':case'D':case'E':return !!o.done;case'1':case'2':return !!o.wet;default:return false}}
/* 見とおせるか：岩と、しまったとびらは、むこうが見えない（われ目・みぞ・物のむこうは見える） */
function cvOpaque(j){const C=CV;if(!C.g[j])return true;const o=C.ob.get(j);return !!o&&(o.k==='D'||o.k==='E')&&!o.done}
function cvLos(x0,y0,x1,y1){/* マスのまん中からまん中へ。とちゅうのマスだけを見る（先のマスが岩でも、その岩は見える） */
  const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*3);for(let i=1;i<n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n,j=cvJ(x|0,y|0);if(j===cvJ(x1|0,y1|0))break;if(j!==cvJ(x0|0,y0|0)&&cvOpaque(j))return false}return true}
function cvReveal(cx,cy,R){const C=CV;for(let y=Math.max(0,Math.floor(cy-R));y<=Math.min(CVH-1,Math.ceil(cy+R));y++)for(let x=Math.max(0,Math.floor(cx-R));x<=Math.min(CVW-1,Math.ceil(cx+R));x++){const j=cvJ(x,y);if(C.seen[j]||Math.hypot(x+.5-cx,y+.5-cy)>R)continue;if(cvLos(cx,cy,x+.5,y+.5))C.seen[j]=1}}
/* 道さがし：goal(j) が true のマスまで。かえす：マスのならび（いまのマスはのぞく）。行けなければ null */
function cvBfs(sj,goal){const prev=new Int32Array(CVW*CVH).fill(-2),q=[sj];prev[sj]=-1;
  for(let h=0;h<q.length;h++){const j=q[h];if(goal(j)){const p=[];for(let k=j;k!==sj;k=prev[k])p.push(k);return p.reverse()}
    const x=cvX(j),y=cvY(j);for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=CVW||b>=CVH)continue;const k=cvJ(a,b);if(prev[k]!==-2||!cvWalk(k)||!cvStepOK(j,k))continue;prev[k]=j;q.push(k)}}return null}
function cvFace(e,dx,dy){if(Math.abs(dx)>Math.abs(dy)*1.2){e.turn=1;e.back=false;e.face=dx<0?-1:1}else{e.turn=0;e.back=dy<0}}
function cvMove(e,v){/* v：このコマに進むマスの数 */
  while(v>0&&e.path.length){const j=e.path[0],tx=cvX(j)+.5,ty=cvY(j)+.5+CVOY,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d>.001)cvFace(e,dx,dy);
    if(d<=v){e.x=tx;e.y=ty;e.path.shift();v-=d}else{e.x+=dx/d*v;e.y+=dy/d*v;v=0}}}

/* ---------- 出かける前：パーティと食べ物をえらぶ ---------- */
function cavePrep(){if(!S||!started||CV)return;const h=hour();
  if(h<CVH0||h>=CVH1)return toast('洞窟へ出かけられるのは、朝6時から夕方4時までです');
  if((S.enemies||[]).some(e=>e.spawned&&!e.dead))return toast('コワイノがいるあいだは出かけられません');
  const L=S.res.filter(r=>!r.hidden&&!r.coffin&&!(r.act&&r.act.type==='faint'));if(!L.length)return toast('つれていけるせいれいがいません');
  const P=pxPop('洞窟へ出かける'),sel=[],food={},flMax=Math.min(S.cvClr||0,CVFLOORS.length-1);let fl=flMax;
  const h1=el('<small style="display:block;margin:2px 0 6px"></small>'),g1=el('<div class="grid"></div>'),h2=el('<small style="display:block;margin:10px 0 6px"></small>'),g2=el('<div class="grid"></div>'),go=el('<button class="btn pri" style="width:100%;margin-top:12px">出発する</button>'),rs=el('<button class="btn" style="margin-top:6px">食べ物をえらびなおす</button>');
  const fn=()=>Object.values(food).reduce((a,b)=>a+b,0);
  const upd=()=>{h1.textContent='つれていくせいれい（'+sel.length+'/'+CVPARTY+'）';h2.textContent='持っていく食べ物（'+fn()+'/'+CVFOOD+'）';
    g1.querySelectorAll('.slot').forEach(b=>b.classList.toggle('sel',sel.includes(b._r)));g2.querySelectorAll('.slot').forEach(b=>{b.querySelector('.ct').textContent=(food[b._k]||0)+'/'+S.fs[b._k];b.classList.toggle('sel',!!food[b._k])});
    lackOn(go,sel.length?'':'せいれいをえらんでください')};
  for(const r of L){const b=el('<button class="slot"><img alt="" style="width:40px;height:40px;image-rendering:pixelated"><span class="nm"></span><span class="nm"></span></button>');b._r=r;b.querySelector('img').src=spiritPort(r.elem,96,r.vr);
    const nm=b.querySelectorAll('.nm');nm[0].textContent=cvName(r);nm[1].textContent=ELEM[r.elem].name+'・おなか '+Math.round(r.hunger);
    b.onclick=()=>{sfx('tap');const i=sel.indexOf(r);if(i>=0)sel.splice(i,1);else if(sel.length<CVPARTY)sel.push(r);else return toast('つれていけるのは'+CVPARTY+'人までです');upd()};g1.appendChild(b)}
  const ks=Object.keys(S.fs||{}).filter(k=>S.fs[k]>0&&FOODS[k]);
  if(!ks.length)g2.appendChild(nodata('box','食べ物がないよ'));
  for(const k of ks){const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>'),im=typeof foodIc==='function'?foodIc(k):null;b._k=k;if(im)b.querySelector('img').src=im;else b.querySelector('img').remove();b.querySelector('.nm').textContent=FOODS[k].name;
    b.onclick=()=>{sfx('tap');if(fn()>=CVFOOD)return toast('食べ物は'+CVFOOD+'こまでです');if((food[k]||0)>=S.fs[k])return;food[k]=(food[k]||0)+1;upd()};g2.appendChild(b)}
  rs.onclick=()=>{sfx('tap');for(const k in food)delete food[k];upd()};
  go.onclick=()=>{if(!sel.length)return toast(go.dataset.lack);P.close();caveEnter(sel.slice(),Object.assign({},food),fl)};
  if(flMax>0){const h0=el('<small style="display:block;margin:2px 0 6px">出かける階</small>'),g0=el('<div style="display:flex;gap:6px;margin-bottom:10px"></div>');for(let i=0;i<=flMax;i++){const b=el('<button class="btn" style="flex:1;min-height:44px"></button>');b.textContent=(i+1)+'階';b.onclick=()=>{sfx('tap');fl=i;g0.querySelectorAll('button').forEach((q,n)=>q.classList.toggle('pri',n===fl))};b.classList.toggle('pri',i===fl);g0.appendChild(b)}P.body.append(h0,g0)}
  P.body.append(h1,g1,h2,g2,rs,go);upd()}

/* ---------- 入る・出る ---------- */
function caveEnter(list,food,fl){if(CV||!list.length)return false;fl=clamp(fl|0,0,CVFLOORS.length-1);const F=CVFLOORS[fl];
  const C=CV={fl,F,lv:new Uint8Array(CVW*CVH),wt:new Uint8Array(CVW*CVH),ore:new Set(),drips:[],dripT:0,ch:new Map(),clr:false,g:new Uint8Array(CVW*CVH),seen:new Uint8Array(CVW*CVH),ob:new Map(),party:[],en:[],food:food||{},loot:{mat:{},pt:0,fukuro:0,mapPc:0,fos:{},items:{}},t:0,focus:null,askHome:-1,mark:null,sel:null,sparks:[],flash:null,gust:null,dim:false,leaf:CVLEAF,sluice:'',note:{},cam0:{x:cam.x,y:cam.y,z:cam.z},all:list.slice(),hudT:0,eve:false,dk:document.createElement('canvas'),hud:null,eid:1};
  let sx=0,sy=0;
  for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++){const ch=F.map[y][x],j=cvJ(x,y);C.lv[j]=+F.lv[y][x];if(ch==='#')continue;if(ch==='W'||ch==='x'||ch==='y'){C.ob.set(j,{k:ch,done:false});continue}C.g[j]=1;if(ch==='~'){C.wt[j]=1;continue}
    if(CVFOES[ch]){const D=EN[CVFOES[ch]];C.en.push({id:C.eid++,type:CVFOES[ch],x:x+.5,y:y+.5+CVOY,hp:D.hp,max:D.hp,spawned:true,asleep:true,stun:0,atk:0,path:[],rp:0,dead:false,tg:null,cj:j})}
    else if(ch!=='.')C.ob.set(j,{k:ch,done:false,home:j});if(ch==='S'){sx=x;sy=y}}
  const cells=cvBfsRing(cvJ(sx,sy),list.length);
  list.forEach((r,i)=>{const j=cells[i]!=null?cells[i]:cvJ(sx,sy);C.party.push({r,elem:r.elem,id:r.id,x:cvX(j)+.5,y:cvY(j)+.5+CVOY,path:[],face:1,back:false,turn:0,swing:0,fback:false,fatk:0,job:null,jq:[],mv:false,chase:false,rp:0,cj:-1,hurtU:0,joyU:0,shockU:0,eatU:0,blowU:0,eatE:'',jumpT:0})});
  for(let y=0;y<CVH-1;y++)for(let x=0;x<CVW;x++){const j=cvJ(x,y);if(!C.g[j]&&!C.ob.has(j)&&C.g[j+CVW]&&!C.wt[j+CVW]&&hash((j*31+fl*977+5)>>>0)<CVOREP)C.ore.add(j)}/* 光る鉱石：正面の見える岩 */
  C.top=0;for(let j=0;j<CVW*CVH;j++)if(C.g[j]&&C.lv[j]>C.top)C.top=C.lv[j];
  cvField();cvDecoPlace();C.hud=cvHudMake();document.body.appendChild(C.hud);document.body.classList.add('cave');
  if(typeof followEnd==='function')followEnd();if(camAnim&&!camAnim.done)camAnim=null;LIGHTARM=false;if(typeof setMode==='function')setMode('look');
  cam.z=clamp(cam.z,1.4,2.2);cvCamTo(1);for(const a of C.party)cvReveal(a.x,a.y-CVOY,cvSeeR());cvHudUpd();sfx('next');toast('洞窟の'+(fl+1)+'階に入った');return true}
function cvBfsRing(tj,n){/* tj から近い順に、歩けるマスを n こ */const out=[],seen=new Set([tj]),q=[tj];for(let h=0;h<q.length&&out.length<n;h++){const j=q[h];out.push(j);for(const[dx,dy]of DIRS){const a=cvX(j)+dx,b=cvY(j)+dy;if(a<0||b<0||a>=CVW||b>=CVH)continue;const k=cvJ(a,b);if(seen.has(k)||!cvWalk(k)||!cvStepOK(k,j))continue;seen.add(k);q.push(k)}}return out}
function cvLootText(L){const t=[];for(const k in L.items)if(L.items[k])t.push(BL[k].name);for(const k in L.fos)if(L.fos[k])t.push(CVFOS[k]+' '+L.fos[k]+'こ');for(const k in L.mat)if(L.mat[k])t.push(MATN[k]+' '+L.mat[k]+'こ');if(L.fukuro)t.push('ふしぎなふくろ '+L.fukuro+'こ');if(L.mapPc)t.push('地図の切れはし '+L.mapPc+'こ');if(L.pt)t.push('パワー '+L.pt);return t}
function cvClose(C){CV=null;document.body.classList.remove('cave');if(C.hud)C.hud.remove();for(const c of[C.dk,...[...C.ch.values()].map(q=>q.c)])if(c)c.width=c.height=0;C.ch.clear();C.fld=null;C.tx=null;if(C.wflow)C.wflow.width=C.wflow.height=0;C.wflow=C.wpat=null;for(const c of Object.values(C.gls||{}))c.width=c.height=0;C.gls=null;if(C.mist)C.mist.width=C.mist.height=0;C.mist=C.mistP=C.shafts=null;for(const c of Object.values(C.crysImg||{}))if(c)c.width=c.height=0;C.crysImg=null;if(C.fogc)C.fogc.width=C.fogc.height=0;/* 作業用のキャンバスは、すぐ手ばなす */
  EVAP=[];LIGHTARM=false;if(typeof dockSync==='function')dockSync();cam.x=C.cam0.x;cam.y=C.cam0.y;cam.z=C.cam0.z;clampCam()}
function caveAbort(){if(CV)cvClose(CV)}/* 村を切りかえるとき：何もわたさずにおわる */
function caveExit(ok){const C=CV;if(!C)return;cvClose(C);const L=C.loot;
  if(ok){for(const k in L.mat)S.mat[k]=(S.mat[k]||0)+L.mat[k];if(L.pt){S.pt+=L.pt;PTW.q=true}if(L.fukuro){S.fukuro=(S.fukuro||0)+L.fukuro;(S.seenIt||(S.seenIt={}))['x:fukuro']=1}if(L.mapPc){S.mapPc=(S.mapPc||0)+L.mapPc;(S.seenIt||(S.seenIt={}))['x:mapPc']=1}
    for(const k in L.items){giveItem(k,L.items[k]);(S.flags.cvItem||(S.flags.cvItem={}))[k]=1}
    if(typeof fossilGive==='function')for(const k in L.fos)fossilGive(k,L.fos[k])}
  /* 村の時計を、洞窟にいた時間ぶん進める（夜20時まで）。つれていったせいれいは、そのあいだ何もしていない */
  const hold=C.all.filter(r=>S.res.includes(r));for(const r of hold)RHOLD.set(r,performance.now()+6e5);
  let g=C.t*DAYLEN;try{while(g>0&&!paused()&&hour()>=CVH0&&hour()<CVNIGHT){const s=Math.min(g,2);stepWorld(s);g-=s}}catch(e){if(typeof frameErr==='function')frameErr('cave',e)}
  for(const r of hold)RHOLD.delete(r);try{save()}catch(e){}
  if(!ok)return toast('洞窟から、だれももどらなかった','warn');
  sfx('arrive');const P=pxPop('洞窟からもどった'),T=cvLootText(L),R=el('<div class="recs"></div>');if(!T.length)T.push('なにもひろわなかった');for(const t of T){const d=el('<div class="st"><span></span></div>');d.firstChild.textContent=t;R.appendChild(d)}P.body.appendChild(R)}
function cvHomeAsk(){const P=pxPop('村へかえる'),T=cvLootText(CV.loot),R=el('<div class="recs"></div>'),b=el('<button class="btn pri" style="width:100%;margin-top:10px">村へかえる</button>');
  if(!T.length)T.push('まだ、なにもひろっていない');for(const t of T){const d=el('<div class="st"><span></span></div>');d.firstChild.textContent=t;R.appendChild(d)}
  b.onclick=()=>{P.close();caveExit(true)};P.body.append(R,b)}

/* ---------- ひろう・食べる ---------- */
function cvLoot(L){const T=CV.loot;for(const k in L.mat||{}){T.mat[k]=(T.mat[k]||0)+L.mat[k];toast(MATN[k]+'を'+L.mat[k]+'こひろった','good')}
  if(L.item){const got=(S.flags.cvItem||{})[L.item]||T.items[L.item];if(BL[L.item]&&!got){T.items[L.item]=1;toast(BL[L.item].name+'を見つけた','good')}else T.pt+=CVAGAIN}
  if(L.fos){T.fos[L.fos]=(T.fos[L.fos]||0)+1;toast(CVFOS[L.fos]+'を見つけた','good')}
  if(L.fukuro){T.fukuro+=L.fukuro;toast('ふしぎなふくろをひろった','good')}if(L.mapPc){T.mapPc+=L.mapPc;toast('地図の切れはしをひろった','good')}if(L.pt)T.pt+=L.pt}
function cvEatPop(a){const C=CV;if(!C||!C.party.includes(a))return;const P=pxPop(cvName(a.r)+'が食べる物'),g=el('<div class="grid"></div>');P.body.appendChild(g);
  const ks=Object.keys(C.food).filter(k=>C.food[k]>0&&S.fs[k]>0);if(!ks.length){g.appendChild(nodata('box','食べ物がないよ'));return}
  for(const k of ks){const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>'),im=typeof foodIc==='function'?foodIc(k):null;if(im)b.querySelector('img').src=im;else b.querySelector('img').remove();b.querySelector('.ct').textContent=C.food[k];b.querySelector('.nm').textContent=FOODS[k].name;
    b.onclick=()=>{P.close();cvEat(a,k)};g.appendChild(b)}}
function cvEat(a,k){const C=CV,r=a.r;if(!C||!(C.food[k]>0)||!(S.fs[k]>0))return false;C.food[k]--;availAdd('f:'+k,-1);/* 食べた分だけ、村の食べ物がへる */
  r.hunger=Math.min(hMax(r),r.hunger+FOODS[k].v*1000/fullN(r));a.eatU=performance.now()+1500;a.eatE=FOODS[k].e;a.path=[];a.mv=false;sfx('good');cvHudUpd();return true}

/* ---------- たたかい ---------- */
function cvSup(a){/* ならんで戦う力（support.js と同じ数）：3マス以内の、なかよしのなかま */let b=0;for(const q of CV.party)if(q!==a&&Math.hypot(q.x-a.x,q.y-a.y)<=SUPR)b=Math.max(b,supAtkOf(bondOf(a.r,q.r)));return b}
function cvDefeat(e,a){if(e.dead)return;e.dead=true;const D=EN[e.type],C=CV;EVAP.push({e,t0:performance.now()+HIT_LAG,dur:1300,die:true});setTimeout(()=>{if(CV===C)sfx('defeat')},HIT_LAG+KO_HOLD);
  C.loot.pt+=D.pw;if(a&&S.res.includes(a.r)){a.r.beat=(a.r.beat||0)+1;addSpiritXp(D.xp,a.r)}if(C.focus===e)C.focus=null}
function cvAttack(a,en){const r=a.r,C=CV,G=gearStat(r),lv=rLv(r),amb=en.asleep?CVAMBUSH:0;/* ふいうち */
  a.face=en.x>=a.x?1:-1;a.turn=Math.abs(en.x-a.x)>Math.abs(en.y-a.y)*.6?1:0;a.fback=en.y<a.y-.3&&Math.abs(en.y-a.y)>Math.abs(en.x-a.x)*.6;a.back=a.fback;a.swing=performance.now();a.path=[];a.chase=false;
  if(r.elem==='fire'){a.fatk=C.t+5*G.iv/rMul(r,'work');const ba=((r.bst&&r.bst.atk)||0)+((r.sst&&r.sst.atk)||0),dmg=Math.max(5,Math.round((fAtk(r,lv)+ba+G.atk+cvSup(a))*fireMul(r)))+amb;
    for(let i=0;i<G.hit;i++)hurtEn(en,i?dmg-amb:dmg,{lag:HIT_LAG+i*90,sx:a.x,sy:a.y,dt:'fire',el:'fire'});en.stun=Math.max(en.stun||0,1)}
  else{const E=SORTIE[r.elem]||SORTIE.wood;a.fatk=C.t+E.cd/rMul(r,'work');
    if(E.stop)en.stun=waterStop(r,en)*(typeof weakStun==='function'?weakStun(en,'water'):1);
    else{hurtEn(en,Math.max(1,Math.round(rMul(r,'atk')*100)+cvSup(a))+amb,{lag:HIT_LAG,sx:a.x,sy:a.y,el:r.elem});en.stun=Math.max(en.stun||0,1)}}
  if(amb&&!C.note.amb){C.note.amb=1;toast('ふいうち','good')}
  en.tg=a;en.asleep=false;setTimeout(()=>{if(CV===C){atkFX(a,en);atkSfx(a)}},HIT_LAG);if(en.hp<=0)cvDefeat(en,a)}
function cvHurtRes(a,n,sx,sy){a.r.hunger=Math.max(0,a.r.hunger-n);a.hurtU=performance.now()+3000;if(n>0)hitFx(a,n,{sx,sy,silent:1});cvHudUpd()}
function cvHit(e,a){const D=EN[e.type],r=a.r,G=gearStat(r),n=Math.max(0,Math.round((r.elem==='fire'?D.hitF:D.hitN)-G.hun));
  enAim(e,a.x,a.y);sfx('hit');e.swing=performance.now();enLunge(e,a);cvHurtRes(a,n,e.x,e.y)}
function cvDie(a){const C=CV,r=a.r;C.party=C.party.filter(q=>q!==a);
  if(STATUE>=0){r.x=STATUE%W+.5;r.y=((STATUE/W)|0)+1.5}/* 村の神殿の前で消えたのと同じ */die(r);cvHudUpd();
  if(!C.party.length)setTimeout(()=>{if(CV===C)caveExit(false)},600)}
function cvTarget(a){const C=CV;let b=null,bd=CVAGGRO;const f=C.focus;if(f&&!f.dead&&Math.hypot(f.x-a.x,f.y-a.y)<CVAGGRO+4)return f;/* タップしたコワイノは、ねていてもねらう */
  for(const e of C.en){if(e.dead||e.asleep)continue;const d=Math.hypot(e.x-a.x,e.y-a.y)+(a.elem==='water'&&e.stun>1?3:0);if(d<bd){bd=d;b=e}}return b}
/* まもりの光：村と同じ（パワー1・チャージ・威力・とめる時間・範囲は GUP）。光の落ちた所のまわりは見えるようになり、うすい壁はくずれる */
function caveLight(tx,ty){const C=CV;PTW.q=true;if(LIGHTCD>0)return toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒'),false;if(S.pt<1)return toast('パワーが足りません'),false;if(tx<0||ty<0||tx>=CVW||ty>=CVH)return false;
  S.pt-=1;LIGHTCD=lightCdMax();const R=gupOf('rng').v[gupLv('rng')],wy=ty+CVOY;fxSpr('godlight',tx*TS+16,wy*TS+26);
  setTimeout(()=>{if(CV===C)sfxAt('glight',tx,wy)},GLHIT);setTimeout(()=>{if(CV===C){skillFx('light');cvLightHit(tx,ty,R)}},GLFX);return true}
function cvLightHit(tx,ty,R){const C=CV,G=gupOf('stun'),gs=gupLv('stun'),pw=gupOf('pow').v[gupLv('pow')],now=performance.now();let broke=false;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=CVW||y>=CVH)continue;const j=cvJ(x,y),o=C.ob.get(j);
    if(o&&o.k==='W'){C.ob.delete(j);C.g[j]=1;broke=true;cvSpark(x+.5,y+.5,'#d9c7a8',18)}/* うすい壁 */
    if(!dx&&!dy||!C.g[j])continue;const d=Math.max(Math.abs(dx),Math.abs(dy));if(d<R&&(dx+dy)&1)continue;setTimeout(()=>{if(CV===C)fxSpr('glspark',x*TS+16,(y+CVOY)*TS+16+GLSPY)},d*GLSTEP)}
  if(broke){cvDirty();sfx('crack');toast('うすい壁がくずれた','good')}
  for(const e of C.en){if(e.dead||Math.max(Math.abs((e.x|0)-tx),Math.abs((e.y|0)-CVOY-ty))>R)continue;hurtEn(e,pw,{flash:8,k:'light',skill:1,sx:tx+.5,sy:ty+CVOY+.5});e.stun=G.v[gs];e.asleep=false;e.path=[];if(e.hp<=0)cvDefeat(e,null)}
  C.flash={x:tx+.5,y:ty+.5,t0:now};if(C.g[cvJ(tx,ty)])cvReveal(tx+.5,ty+.5,R+2.5);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=tx+dx,y=ty+dy;if(x>=0&&y>=0&&x<CVW&&y<CVH)C.seen[cvJ(x,y)]=1}
  for(const a of C.party)if(Math.max(Math.abs(a.x-tx-.5),Math.abs(a.y-CVOY-ty-.5))-R<=GLSHOCKR){a.shockU=now+GLSHOCKT;a.jumpT=now}}

/* ---------- 属性の道 ---------- */
/* 土：岩をおせる向き。かえす：[{t:岩の行き先,s:立つマス}] */
function cvPushDirs(j){const C=CV,a=C.party.find(q=>q.elem==='earth'),out=[];if(!a)return out;
  for(const[dx,dy]of DIRS){const x=cvX(j),y=cvY(j),t=cvJ(x+dx,y+dy),s=cvJ(x-dx,y-dy);if(!C.g[t]||C.wt[t]||C.lv[t]!==C.lv[j]||C.lv[s]!==C.lv[j]||!cvWalk(s))continue;const o=C.ob.get(t);if(o&&!(o.k==='h'&&!o.done)&&!(o.k==='!'))continue;if(!cvBfs(cvCell(a),q=>q===s))continue;out.push({t,s})}return out}
function cvRockReset(){const C=CV;let n=0;for(const[j,o]of[...C.ob])if(o.k==='b'&&o.home!==j&&!C.ob.has(o.home)&&!C.party.some(a=>cvCell(a)===o.home)){C.ob.delete(j);C.ob.set(o.home,o);o.slide=null;n++}C.sel=null;if(n)sfx('tstone');cvHudUpd();return n}
/* 火：たいまつがぜんぶともったら、石のとびらがひらく（ひらいたまま） */
function cvTorchCheck(){const C=CV;let all=true,any=false;for(const o of C.ob.values())if(o.k==='t'){any=true;if(!(o.until>C.t))all=false}if(!any||!all)return false;let n=0;for(const[j,o]of C.ob)if(o.k==='D'&&!o.done){o.done=true;n++;cvSpark(cvX(j)+.5,cvY(j)+.5,'#ffb36b',16)}
  if(n){sfx('good');toast('石のとびらがひらいた','good');for(const q of C.party){q.joyU=performance.now()+1400;cvReveal(q.x,q.y-CVOY,cvSeeR())}}return n>0}
/* 水：あけた水門から、みぞを1マスずつ流れる */
function cvFlow(j,o){const C=CV,dg=o.k==='x'?'1':'2',now=performance.now();C.sluice=o.k;o.done=true;const q=[],seen=new Set();
  for(const[k,d]of C.ob)if(d.k===dg&&cvAdj(k,j)){q.push([k,1]);seen.add(k)}
  for(let h=0;h<q.length;h++){const[k,n]=q[h];C.ob.get(k).wetAt=now+n*CVFLOW;for(const[dx,dy]of DIRS){const m=cvJ(cvX(k)+dx,cvY(k)+dy),d=C.ob.get(m);if(d&&d.k===dg&&!seen.has(m)){seen.add(m);q.push([m,n+1])}}}
  sfx('good');toast('水がながれだした','good')}
/* 風：立った所から風車へ、まっすぐとどくか。かえす：風の進むマスの数と、とどいたか */
function cvGustLine(sj,mj){const sx=cvX(sj),sy=cvY(sj),mx=cvX(mj),my=cvY(mj);if(sx!==mx&&sy!==my||sj===mj)return null;const dx=Math.sign(mx-sx),dy=Math.sign(my-sy);let n=0;
  for(let x=sx+dx,y=sy+dy;;x+=dx,y+=dy){n++;const j=cvJ(x,y);if(j===mj)return{dx,dy,n,hit:true};if(x<0||y<0||x>=CVW||y>=CVH||cvOpaque(j))return{dx,dy,n,hit:false}}}
function cvGustEnd(){const C=CV,G=C.gust;C.gust=null;if(!G.hit)return toast('風がとどかなかった');const m=C.ob.get(G.mj);if(!m||m.done)return;m.done=true;let n=0;for(const[j,o]of C.ob)if(o.k==='E'&&!o.done){o.done=true;n++;cvSpark(cvX(j)+.5,cvY(j)+.5,'#cfeee0',16)}
  sfx('good');toast('風車がまわって、とびらがひらいた','good');for(const q of C.party)q.joyU=performance.now()+1400}

/* ---------- 指示：歩く・物を使う ---------- */
function cvGo(tj,skip){const C=CV,L=C.party.filter(a=>a!==skip),ring=cvBfsRing(tj,L.length+(skip?1:0)).filter(j=>!skip||!skip.path.length||j!==skip.path[skip.path.length-1]);
  L.forEach((a,i)=>{const dj=ring[i]!=null?ring[i]:tj,p=cvBfs(cvCell(a),j=>j===dj);a.job=null;a.jq=[];a.chase=false;if(p){a.path=p;a.mv=true}})}
const cvObjTap=o=>!!o&&(o.k==='b'||o.k==='t'||o.k==='x'||o.k==='y'||o.k==='o'||o.k==='S'||o.k==='R'||(o.k==='m'||o.k==='k'||o.k==='T')&&!o.done);
function cvJobGo(a,job,goal){const p=cvBfs(cvCell(a),goal);if(!p){toast('そこへ行けません');return false}a.job=job;a.jq=[];a.path=p;a.mv=false;a.chase=false;cvGo(p.length?p[p.length-1]:cvCell(a),a);sfx('tap');return true}
function cvUse(j,o){const C=CV;C.focus=null;C.askHome=-1;C.sel=null;
  if(CVGATE[o.k]){const D=CVGATE[o.k],a=C.party.find(q=>q.elem===D.el);if(!a)return toast(D.no);
    if(o.k==='b'){if(!cvPushDirs(j).length)return toast('この岩は、どの向きにもおせません');C.sel={k:'b',j};sfx('tap');cvHudUpd();return}
    if(o.k==='m'){C.sel={k:'m',j};sfx('tap');return toast('風のせいれいを立たせる所をタップ')}
    if(o.k==='t'){const job={k:'torch',j};if(a.job&&a.job.k==='torch'){a.jq.push(job);sfx('tap');return}/* ともす順に、つづけてたのめる */const p=cvBfs(cvCell(a),q=>cvAdj(q,j));if(!p)return toast('そこへ行けません');a.job=job;a.jq=[];a.path=p;a.mv=false;a.chase=false;sfx('tap');return}
    if(o.k==='x'||o.k==='y'){if(C.sluice)return toast('水は、もうながれてしまった');return cvJobGo(a,{k:'sluice',j,t:0},q=>cvNear(q,j))}
    if(o.k==='k'){if(C.leaf<=0)return toast('足場の葉がもうありません');return cvJobGo(a,{k:'leaf',j,t:0},q=>cvAdj(q,j))}}
  if(o.k==='S'||o.k==='R'){if(C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6))return cvHomeAsk();cvGo(j);C.askHome=j;sfx('tap');return}
  let ba=null,bp=null;for(const a of C.party){const p=cvBfs(cvCell(a),q=>cvAdj(q,j));if(p&&(!bp||p.length<bp.length)){bp=p;ba=a}}if(!ba)return toast('そこへ行けません');
  ba.job={k:o.k==='o'?'pick':'chest',j,t:0};ba.jq=[];ba.path=bp;ba.mv=false;ba.chase=false;cvGo(bp.length?bp[bp.length-1]:cvCell(ba),ba);sfx('tap')}
function caveTap(sx,sy){const C=CV;if(!C||cvHold())return;const w=toWorld(sx,sy),wx=w.x/TS,wy=w.y/TS,x=Math.floor(wx),y=Math.floor(wy)-CVOY,in0=x>=0&&y>=0&&x<CVW&&y<CVH;
  if(LIGHTARM){caveLight(x,y);return}
  if(C.sel&&in0){const sel=C.sel,tj=cvJ(x,y);C.sel=null;
    if(sel.k==='b'){const d=cvPushDirs(sel.j).find(q=>q.t===tj),a=C.party.find(q=>q.elem==='earth');if(d&&a){const p=cvBfs(cvCell(a),q=>q===d.s);if(p){a.job={k:'push',j:sel.j,to:d.t,s:d.s,t:0};a.jq=[];a.path=p;a.mv=false;a.chase=false;C.sel=sel;sfx('tap')}return}if(tj===sel.j){cvHudUpd();return}}
    if(sel.k==='m'){const a=C.party.find(q=>q.elem==='wind');if(a&&C.seen[tj]&&cvWalk(tj)){const p=cvBfs(cvCell(a),q=>q===tj);if(!p)return toast('そこへ行けません');a.job={k:'blow',j:sel.j,at:tj,t:0};a.jq=[];a.path=p;a.mv=false;a.chase=false;C.mark={x:x+.5,y:y+.5,t0:performance.now()};sfx('tap');return}}
    cvHudUpd()}
  {let be=null,bd=1e9;for(const e of C.en){if(e.dead||!C.seen[cvCell(e)])continue;const z=EN[e.type].size,d=Math.hypot(e.x-wx,e.y-.6*z-wy);if(d<.9*Math.max(1,z)&&d<bd){bd=d;be=e}}
    if(be){C.focus=be;C.askHome=-1;for(const a of C.party){a.mv=false;a.job=null;a.jq=[];a.rp=0}C.mark={x:be.x,y:be.y-CVOY,t0:performance.now(),foe:1};sfx('tap');return}}
  if(!in0)return;let j=cvJ(x,y),o=C.ob.get(j);
  if(!cvObjTap(o)&&y+1<CVH&&wy-(y+CVOY)>.45){const o2=C.ob.get(j+CVW);if(cvObjTap(o2)&&o2.k!=='S'&&o2.k!=='R'&&o2.k!=='k'){o=o2;j+=CVW}}/* 物の絵は上へはみ出すので、すぐ上のマスの下半分でも、その物 */
  if(cvObjTap(o)&&C.seen[j])return cvUse(j,o);
  let tj=j;if(!C.seen[tj]||!cvWalk(tj)){tj=-1;let bd=1e9;for(let k=0;k<CVW*CVH;k++)if(C.seen[k]&&cvWalk(k)){const d=Math.hypot(cvX(k)-x,cvY(k)-y);if(d<bd){bd=d;tj=k}}}/* 見えている歩けるマスのうち、いちばん近い所 */
  if(tj<0)return;C.focus=null;C.askHome=-1;cvGo(tj);C.mark={x:cvX(tj)+.5,y:cvY(tj)+.5,t0:performance.now()};sfx('tap')}

/* ---------- 1コマ ---------- */
function cvJobTick(a,cdt,now){const C=CV,J=a.job,o=C.ob.get(J.j),cj=cvCell(a),end=()=>{a.job=null};if(!o)return end();
  if(J.k==='push'){if(o.k!=='b')return end();if(cj!==J.s){const p=cvBfs(cj,q=>q===J.s);if(!p)return end();a.path=p;return}
    cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;if(J.t<CVPUSHT)return;
    const t=C.ob.get(J.to);if(t&&!(t.k==='h'&&!t.done)&&t.k!=='!'||C.party.some(q=>cvCell(q)===J.to)||C.en.some(e=>!e.dead&&cvCell(e)===J.to)){toast('岩がうごかない');return end()}
    C.ob.delete(J.j);sfxAt('pick_stone',a.x,a.y);
    if(t&&t.k==='h'){t.done=true;C.sel=null;sfx('good');toast('岩がくぼみにはまった','good');cvSpark(cvX(J.to)+.5,cvY(J.to)+.5,'#d9c7a8',16);a.joyU=now+1400;a.jumpT=now;for(const q of C.party)cvReveal(q.x,q.y-CVOY,cvSeeR())}
    else{C.ob.set(J.to,o);o.slide={from:J.j,t0:now};if(C.sel&&C.sel.k==='b'&&C.sel.j===J.j)C.sel.j=J.to}
    cvHudUpd();return end()}
  if(J.k==='blow'){if(cj!==J.at){const p=cvBfs(cj,q=>q===J.at);if(!p)return end();a.path=p;return}const L=cvGustLine(cj,J.j);if(!L){toast('風車がまっすぐ先にありません');return end()}
    cvFace(a,L.dx,L.dy);a.blowU=now+700;C.gust={x:cvX(cj)+.5,y:cvY(cj)+.5,dx:L.dx,dy:L.dy,n:L.n,hit:L.hit,mj:J.j,t0:now};sfxAt('atk_wind',a.x,a.y);return end()}
  if(!cvObjTap(o))return end();
  const near=J.k==='sluice'?cvNear(cj,J.j):cvAdj(cj,J.j);if(!near){const p=cvBfs(cj,q=>J.k==='sluice'?cvNear(q,J.j):cvAdj(q,J.j));if(!p)return end();a.path=p;return}
  cvFace(a,cvX(J.j)-cvX(cj),cvY(J.j)-cvY(cj));
  if(J.k==='pick'){C.ob.delete(J.j);cvLoot({fos:CVFOSK[(Math.random()*CVFOSK.length)|0]});sfxAt('pick_stone',a.x,a.y);cvSpark(cvX(J.j)+.5,cvY(J.j)+.5,'#d9c7a8',10);return end()}
  if(J.k==='chest'){o.done=true;cvLoot(C.F.chest[cvX(J.j)+','+cvY(J.j)]||{});sfx('quest');cvSpark(cvX(J.j)+.5,cvY(J.j)+.4,'#ffe58a',14);a.joyU=now+1400;a.jumpT=now;return end()}
  if(J.k==='torch'){o.until=C.t+CVTORCH;sfxAt('atk_fire',a.x,a.y);cvSpark(cvX(J.j)+.5,cvY(J.j)+.2,'#ffb36b',8);cvTorchCheck();return end()}
  J.t+=cdt*rMul(a.r,'work');a.r.hunger-=CVHUN.work*cdt;
  if(J.k==='sluice'){if(J.t<CVSLUICET)return;if(!C.sluice)cvFlow(J.j,o);a.joyU=now+1000;return end()}
  if(J.k==='leaf'){if(J.t<CVLEAFT)return;if(C.leaf>0&&!o.done){o.done=true;C.leaf--;sfx('good');cvSpark(cvX(J.j)+.5,cvY(J.j)+.5,'#8fd07a',10);cvHudUpd()}return end()}
  end()}
function cvStep(e,now,isRes){/* マスをうつったとき：ひびの床はくずれ、岩の落ちてくる所は、かげが出る */const C=CV,cj=cvCell(e);if(cj===e.cj)return false;const old=C.ob.get(e.cj),o=C.ob.get(cj);
  if(isRes&&old&&old.k==='q'&&!old.gone){old.gone=true;sfx('crack');cvSpark(cvX(e.cj)+.5,cvY(e.cj)+.5,'#8f7e68',14);if(!C.note.q){C.note.q=1;toast('ひびの床がくずれた','warn')}}
  if(o&&o.k==='!'&&!o.fall&&now>(o.cd||0)){o.fall=now+CVROCKMS;if(!C.note.rock){C.note.rock=1;toast('天井から岩が落ちてくる','warn')}}
  if(e.cj>=0&&C.lv[cj]<C.lv[e.cj]){e.jumpT=now;if(isRes)cvSnd('fstone',.3)}/* とびおりた */else if(isRes&&e===C.party[0])cvSnd('fstone',.1);/* 足音：岩の床 */
  e.cj=cj;return true}
function cvRocks(now){const C=CV;for(const[j,o]of C.ob){if(o.k==='!'&&o.fall&&now>=o.fall){o.fall=0;o.cd=now+CVROCKCD;o.hitT=now;const x=cvX(j)+.5,y=cvY(j)+.5+CVOY;sfx('crack');cvSpark(x,y-CVOY,'#85776a',16);
      for(const a of C.party.slice())if(Math.hypot(a.x-x,a.y-y)<.75){cvHurtRes(a,CVROCKHUN,x,y-1);a.shockU=now+900}
      for(const e of C.en)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<.75){hurtEn(e,CVROCKDMG,{sx:x,sy:y-1});e.asleep=false;if(e.hp<=0)cvDefeat(e,null)}}
    if((o.k==='1'||o.k==='2')&&o.wetAt&&!o.wet&&now>=o.wetAt){o.wet=true;cvSpark(cvX(j)+.5,cvY(j)+.5,'#9fd8ff',6)}}
  if(C.gust&&(now-C.gust.t0)/1000*CVGUST>=C.gust.n)cvGustEnd()}
function cvActor(a,cdt,mv,now){const C=CV,r=a.r;if(a.eatU>now)return;
  if(cvStep(a,now,true))cvReveal(a.x,a.y-CVOY,cvSeeR());const cj=a.cj;
  if(a.path.length&&!cvWalk(a.path[0])){const d=a.path[a.path.length-1],p=cvBfs(cj,q=>q===d);a.path=p||[];if(!p)a.mv=false}/* 道がふさがった（くずれた床など）：まわり道をさがす */
  if(!a.job&&a.jq.length&&!a.path.length){const J=a.jq.shift(),p=cvBfs(cj,q=>cvAdj(q,J.j));if(p){a.job=J;a.path=p}}
  if(a.path.length){if(a.chase){const en=cvTarget(a),E=SORTIE[a.elem]||SORTIE.wood;if(!en)a.path=[];else if(Math.hypot(en.x-a.x,en.y-a.y)<=Math.min(E.rng,1.5)&&cvLos(a.x,a.y-CVOY,en.x,en.y-CVOY))a.path=[]}/* ねらうコワイノにとどいたら、そこで止まる */
    cvMove(a,mv*CVWALK*rMul(r,'move'));r.hunger-=CVHUN.walk*cdt;if(!a.path.length){a.mv=false;a.chase=false}}
  else{r.hunger-=CVHUN.stand*cdt;
    if(a.job)cvJobTick(a,cdt,now);
    else{const en=cvTarget(a);if(en){const E=a.elem==='fire'?SORTIE.wood:SORTIE[a.elem]||SORTIE.wood,d=Math.hypot(en.x-a.x,en.y-a.y);
      if(d<=E.rng&&cvLos(a.x,a.y-CVOY,en.x,en.y-CVOY)){if(C.t>=a.fatk&&!(E.stop&&en.stun>1))cvAttack(a,en)}
      else if((a.rp-=mv)<=0){a.rp=.4;const ej=cvCell(en),p=cvBfs(cj,q=>cvAdj(q,ej)||q===ej);if(p&&p.length){if(p[p.length-1]===ej)p.pop();a.path=p;a.chase=true}}}}}
  if(r.hunger<=0){r.hunger=0;cvDie(a)}}
function cvFoe(e,cdt,mv,now){const C=CV;if(e.dead)return;const D=EN[e.type];cvStep(e,now,false);
  if(e.asleep){const R=C.dim?CVWAKED:CVWAKE;if(C.seen[cvCell(e)])for(const a of C.party)if(Math.hypot(a.x-e.x,a.y-e.y)<=R&&cvLos(e.x,e.y-CVOY,a.x,a.y-CVOY)){e.asleep=false;e.wakeT=now;break}return}
  if(e.stun>0){e.stun-=cdt;return}
  let tg=e.tg&&C.party.includes(e.tg)?e.tg:null,bd=1e9;if(!tg)for(const a of C.party){const d=Math.hypot(a.x-e.x,a.y-e.y);if(d<bd){bd=d;tg=a}}if(!tg)return;
  const d=Math.hypot(tg.x-e.x,tg.y-e.y);
  if(d<=Math.max(1.15,(D.rng||0))&&cvLos(e.x,e.y-CVOY,tg.x,tg.y-CVOY)){e.path=[];e.nx=-1;enAim(e,tg.x,tg.y);e.atk+=cdt;if(e.atk>=D.atk){e.atk=0;cvHit(e,tg)}return}
  if((e.rp-=mv)<=0||!e.path.length){e.rp=.5;const tj=cvCell(tg),p=cvBfs(cvCell(e),q=>q===tj);if(p){p.pop();e.path=p}else{e.path=[];e.tg=null}}
  /* コワイノどうしは、同じマスに入らない（せまい道では1ぴきずつ）。2秒まっても空かなければ進む */
  if(e.path.length){const nx=e.path[0];if((e.wait||0)<2&&C.en.some(q=>q!==e&&!q.dead&&(cvCell(q)===nx||q.nx===nx))){e.wait=(e.wait||0)+mv;e.nx=-1;return}e.wait=0;e.nx=nx}else e.nx=-1;
  cvMove(e,mv*CVFOE*D.sp)}
function caveFrame(rdt,now){const C=CV;if(!C||cvHold())return;const sp=S.speed||1,cdt=rdt*MIN_PER_SEC*sp,mv=rdt*sp;C.t+=cdt/DAYLEN;LIGHTCD=Math.max(0,LIGHTCD-rdt*sp);
  for(const a of C.party.slice()){cvActor(a,cdt,mv,now);if(CV!==C)return}
  for(const e of C.en)cvFoe(e,cdt,mv,now);cvRocks(now);if(CV!==C)return;
  if(C.en.some(e=>e.dead))C.en=C.en.filter(e=>!e.dead);
  if(C.askHome>=0&&C.party.every(a=>!a.path.length)){const j=C.askHome;C.askHome=-1;if(C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6))cvHomeAsk()}
  const h=cvHour();if(!C.eve&&h>=17){C.eve=true;toast('外は夕方です','warn')}if(h>=CVNIGHT||h<CVH0){toast('夜になるので、村へもどります','warn');return caveExit(true)}
  if((C.hudT+=rdt)>.3){C.hudT=0;cvClearCheck();cvHudUpd()}
  cvDripTick(now)}
/* 下へおりる坂まで来たら、その階はクリア。つぎの階がひらく（S.cvClr：ひらいた階の数。出かけるときに、ひらいた階からえらぶ） */
function cvClearCheck(){const C=CV;if(C.clr)return;for(const[j,o]of C.ob)if(o.k==='R'&&C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6)){C.clr=true;const first=(S.cvClr||0)<C.fl+1;S.cvClr=Math.max(S.cvClr||0,C.fl+1);
    if(first){sfx('quest');for(const a of C.party){a.joyU=performance.now()+1600;a.jumpT=performance.now()}toast(C.fl+1<CVFLOORS.length?'下へおりる坂を見つけた。つぎは'+(C.fl+2)+'階から出かけられます':'下へおりる坂を見つけた。この先は、岩でふさがっている','good')}return}}
function cvSnd(k,v){if(typeof AC!=='undefined'&&AC&&AC.state==='running'&&SND.sfx)playU(k,v)}
/* しずく：天井から、見えている床・水に落ちる（見た目と音だけ） */
function cvDripTick(now){const C=CV;if(now<C.dripT)return;C.dripT=now+CVDRIP[0]+Math.random()*(CVDRIP[1]-CVDRIP[0]);if(!C.party.length)return;const a=C.party[(Math.random()*C.party.length)|0];
  for(let n=0;n<8;n++){const x=Math.floor(a.x+(Math.random()*2-1)*CVDRIPR),y=Math.floor(a.y-CVOY+(Math.random()*2-1)*CVDRIPR);if(x<0||y<0||x>=CVW||y>=CVH)continue;const j=cvJ(x,y);if(!C.seen[j]||!C.g[j]||C.ob.has(j)||(n<5&&!C.wt[j]))continue;/* 水の上を先にさがす */
    C.drips.push({x:x+.3+Math.random()*.4,y:y+.3+Math.random()*.4,t0:now,w:!!C.wt[j],s:0});return}}

/* ---------- 画面の部品（パーティの札・時刻・光をしぼる・かえる） ---------- */
function cvHudMake(){const C=CV,h=el('<div id="caveHud" style="position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 132px);z-index:20;display:flex;flex-direction:column;gap:5px;align-items:flex-start"></div>');
  const tm=el('<div class="cvtm" style="background:var(--panel);color:var(--ink);font-size:10px;padding:3px 8px"></div>');h.appendChild(tm);
  for(const a of C.party){const b=el('<button class="cvc" style="display:flex;align-items:center;gap:6px;background:var(--panel);color:var(--ink);padding:4px 8px 4px 4px;font-size:10px;min-width:124px;min-height:44px;text-align:left"><span class="fc" style="width:36px;height:34px;display:block;flex:none;overflow:hidden"></span><span style="display:flex;flex-direction:column;gap:3px;flex:1"><span class="nm"></span><span style="display:block;width:70px;height:5px;background:#e8dcc0"><i style="display:block;height:100%;width:0;background:#7ee08a"></i></span><span class="hn"></span></span></button>');
    const fc=typeof spiritCanvas==='function'?spiritCanvas(a.r,72,68,92,'smile'):null;if(fc){fc.style.cssText='width:36px;height:34px;image-rendering:pixelated';b.querySelector('.fc').appendChild(fc)}
    b.querySelector('.nm').textContent=cvName(a.r);b._a=a;b.onclick=()=>{sfx('tap');cvEatPop(a)};h.appendChild(b)}
  const dm=el('<button class="btn cvdim" style="font-size:10px;min-height:44px"></button>');dm.onclick=()=>{const C2=CV;if(!C2)return;sfx('tap');C2.dim=!C2.dim;if(!C2.dim)for(const a of C2.party)cvReveal(a.x,a.y-CVOY,cvSeeR());cvHudUpd()};h.appendChild(dm);
  const rk=el('<button class="btn cvrock" style="font-size:10px;min-height:44px" hidden>岩をもどす</button>');rk.onclick=()=>{if(CV&&!cvRockReset())toast('もどす岩がありません')};h.appendChild(rk);
  const hm=el('<button class="btn cvhome" style="font-size:10px;min-height:44px">村へかえる</button>');hm.onclick=()=>{const C2=CV;if(!C2)return;if(hm.dataset.lack)return toast(hm.dataset.lack);sfx('tap');cvHomeAsk()};h.appendChild(hm);return h}
function cvNearHome(){const C=CV;for(const[j,o]of C.ob)if((o.k==='S'||o.k==='R')&&C.party.some(a=>Math.hypot(a.x-cvX(j)-.5,a.y-CVOY-cvY(j)-.5)<1.6))return true;return false}
function cvHudUpd(){const C=CV;if(!C||!C.hud)return;const h=cvHour(),fn=Object.keys(C.food).reduce((n,k)=>n+Math.min(C.food[k],S.fs[k]||0),0);
  C.hud.querySelector('.cvtm').textContent=(C.fl+1)+'階　'+Math.floor(h)+':'+String(Math.floor(h%1*60)).padStart(2,'0')+'　食べ物 '+fn+(C.party.some(a=>a.elem==='wood')?'　足場の葉 '+C.leaf:'');
  C.hud.querySelectorAll('.cvc').forEach(b=>{const a=b._a,alive=C.party.includes(a),m=hMax(a.r),v=alive?clamp(a.r.hunger/m,0,1):0,i=b.querySelector('i');i.style.width=Math.round(v*100)+'%';i.style.background=v>.5?'#7ee08a':v>.25?'#e0a43a':'#ff6b6b';b.querySelector('.hn').textContent=alive?'おなか '+Math.max(0,Math.round(a.r.hunger))+'/'+m:'いない';b.style.opacity=alive?'1':'.5';b.disabled=!alive});
  C.hud.querySelector('.cvdim').textContent=C.dim?'光をひろげる':'光をしぼる';C.hud.querySelector('.cvrock').hidden=!(C.sel&&C.sel.k==='b');
  lackOn(C.hud.querySelector('.cvhome'),cvNearHome()?'':'入口の光か、下へおりる坂のそばでかえれます')}

/* ---------- 絵 ----------
   下絵（岩・床・水・がけ）は、8×8マスの区画ごとに、1マス64ドットで作っておく（cvChunk。見えている区画だけ、CVCHMAX まで。使わない区画から手ばなす）。
   絵はチップ（cave:〜、3Dから写した絵）。チップがまだない物は、コードのドット（仮の絵） */
const cvChipOf=id=>window.CHIPS&&window.CHIPS[id]||null;
let CVMISS=false;/* チップはあるが、まだ読みこみ中だった */
function cvChip(g,id,x,y,now){const ch=cvChipOf(id);if(!ch)return false;if(!drawChip(g,ch,id,x,y,now)){CVMISS=true;return false}return true}
/* 洞窟の形：マスの地図をなめらかにぼかした「場」（1マス8点）。ここから1ドットずつ、岩・床・水・穴・高さをきめるので、ふちに直角が出ない。
   F 岩でない（0〜1）・Wt 水・Pt 穴・Lv 高さ。どれもしきい値0.5（高さは四捨五入）。ふちのうねりは CVWOB。歩ける所は、マスのまま */
const CVFR=8,CVSIG=.36,CVWOB=.13;
function cvErf(x){const t=1/(1+.3275911*Math.abs(x)),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return x<0?-y:y}
function cvNoise(u,v,k){const f=(a,b)=>hash(((a*73856093)^(b*19349663)^(k*83492791))>>>0),i=Math.floor(u),j=Math.floor(v),s=u-i,t=v-j,S=s*s*(3-2*s),T=t*t*(3-2*t),a=f(i,j),b=f(i+1,j),c=f(i,j+1),d=f(i+1,j+1);return a+(b-a)*S+(c-a)*T+(a-b-c+d)*S*T}
function cvField(){const C=CV,R=CVFR,W2=CVW*R,H2=CVH*R,F=new Float32Array(W2*H2),Ms=new Float32Array(W2*H2),Wt=new Float32Array(W2*H2),Pt=new Float32Array(W2*H2),Lv=new Float32Array(W2*H2),PIT='kh12';
  const wt=s=>{const u=(s+.5)/R,i0=Math.floor(u)-2,w=[];for(let i=i0;i<=i0+4;i++)w.push([i,(cvErf((i+1-u)/(CVSIG*Math.SQRT2))-cvErf((i-u)/(CVSIG*Math.SQRT2)))/2]);return w},WX=[],WY=[];
  for(let s=0;s<W2;s++)WX.push(wt(s));for(let s=0;s<H2;s++)WY.push(wt(s));
  const pit=j=>{const o=C.ob.get(j);return !!o&&PIT.includes(o.k)};
  for(let sy=0;sy<H2;sy++)for(let sx=0;sx<W2;sx++){let f=0,w=0,p=0,ln=0,ld=0;
    for(const[j0,wy]of WY[sy]){if(j0<0||j0>=CVH)continue;for(const[i0,wx]of WX[sx]){if(i0<0||i0>=CVW)continue;const j=cvJ(i0,j0),k=wx*wy;if(!C.g[j])continue;f+=k;if(C.wt[j])w+=k;else if(pit(j))p+=k;ln+=k*C.lv[j];ld+=k}}
    const u=(sx+.5)/R,v=(sy+.5)/R,n=(cvNoise(u*1.3,v*1.3,1)-.5)+.5*(cvNoise(u*3.1,v*3.1,2)-.5),q=sy*W2+sx;
    F[q]=f+n*CVWOB*2;Wt[q]=f>0?w/f+n*CVWOB*2:0;Pt[q]=f>0?p/f+n*CVWOB:0;Lv[q]=ld>0?ln/ld+n*.5:0;Ms[q]=cvMossV(u,v)+n*.06}
  C.fld={F,Wt,Pt,Lv,Ms,W2,H2};C.tx=null}
/* コケ（持ち主のたのみ：植物の生えている所の地面はコケ）：大きくゆるやかなノイズで、コケの広がりをきめる。植物は、コケの上に生える */
function cvMossV(u,v){const M=cvTheme().moss||0;if(!M)return 0;return cvNoise(u*.32,v*.32,7)*.75+cvNoise(u*.9,v*.9,8)*.25+M-1+.62}/* M：コケの多さ（ノイズが 1-M より大きい所がコケ） */
const cvMossAt=(x,y)=>cvTheme().moss&&cvMossV(x+.5,y+.5)>.62;
function cvDirty(){const C=CV;for(const q of C.ch.values())q.c.width=q.c.height=0;C.ch.clear();cvField()}
/* 絵のチップを、ドットで読めるようにする（1回だけ）。読みこみ中なら null */
/* 階の色と、外がわ（持ち主がきめた：階ごとにかえる）。絵は「こさの番号」0〜5だけ（tools/art/cave/cave_tex.py）で、ここの6色にぬりかえる。
   岩のかたまりの中は、どの階もまっ暗な空洞（持ち主がきめた）。台のふちからは、柱のがけが空洞へたれる。
   out：'rock' 空洞の南のふちに、柱の岩が立ってかこむ・'void' 道は高い台の上で、まわりは底の見えない空洞
   deco：壁ぎわのかざり（数は、壁ぎわのマスにおく見こみ）roots 天井からたれる根・moss こけ・shroom 光るきのこ・crys 光る水晶（crys の色のならびから）・bone 白い骨
   rock 岩・floor 床（暗い→明るい）・water 水（水べのあわ・明るい・なか・深い・底の光の網目）・void 穴 */
const CVTHEMES={
  roots:{name:'ねっこの坑道',out:'rock',deco:{roots:.55,moss:.3,shroom:.12,plant:.3,plants:[0,1,2,3,6,8,9,11,12,14,16,17,19],vine:.45,gmoss:.12,big:.1},glow:'#7ff0c8',moss:.55,mossc:['#1c2e1a','#2c4a28','#3a5e30','#4a7238','#5c8a44','#7aa858'],crys:null,rock:['#2a1f1a','#463428','#5e4634','#76593f','#8f6e4d','#a8865e'],floor:['#4a3c31','#7a6550','#816b55','#87715a','#8e775f','#a38c72'],water:['#c8f7e0','#7fe0c4','#3fb39a','#23806f','#a9f5dc'],void:'#160f0c'},
  crystal:{name:'水晶のほらあな',out:'void',wall:'crys',deco:{crys:.32,shroom:.05,plant:.16,plants:[3,5,7,10,13,15,17,19],vine:.3,gmoss:.1,big:.06},glow:'#b49cff',moss:.4,mossc:['#1a2236','#24384a','#2e4c5a','#3a6068','#4c7a7a','#6a9a94'],crys:[['#3a2a6a','#6a4cc0','#9a7ef0','#c4b0ff','#e8deff','#ffffff'],['#1e4a6a','#2f8ac0','#5cc6f0','#9ce6ff','#d6f6ff','#ffffff']],rock:['#1f1830','#3a2c55','#4d3b70','#62508a','#7a68a3','#968abf'],floor:['#3a3152','#655986','#6a5e8c','#6f6391','#756997','#8c80ad'],water:['#e0d8ff','#9fd4f7','#5a9fe0','#3a64b8','#c8e8ff'],void:'#110c1b'},
  lake:{name:'地底のみずうみ',out:'void',deco:{crys:.14,shroom:.14,plant:.24,plants:[5,6,7,10,13,14,17,1,2],vine:.4,gmoss:.14,big:.08},glow:'#7fe8ff',moss:.5,mossc:['#14242a','#1e3a3c','#28504c','#34645a','#447c6a','#62987e'],crys:[['#1a4a5a','#2a8aa0','#4ccad6','#8ef0f0','#d0fff8','#ffffff']],rock:['#141c2c','#243650','#2f4664','#3c5878','#4d6c8c','#6684a3'],floor:['#2a3646','#516378','#56687d','#5b6d82','#617388','#7a8ca0'],water:['#d6fff8','#7ff0e6','#33c1c8','#1a8a9e','#b6fff4'],void:'#0a0f17'},
  fossil:{name:'化石の大ひろま',out:'rock',deco:{bone:.2,crys:.08,plant:.14,plants:[4,18,0,12,9,16],vine:.2,gmoss:.08,big:.14},glow:'#ffc870',moss:.32,mossc:['#2a2a18','#3e4024','#52552e','#666a38','#7c8244','#9aa05a'],crys:[['#5a2a0a','#a85a14','#e0901e','#f6c050','#ffe6a0','#ffffff']],rock:['#30241c','#5c4636','#765b45','#907256','#a98a69','#c4a683'],floor:['#504034','#8a745d','#917a62','#978067','#9e866c','#b49c80'],water:['#e8f6d8','#9fe0c4','#54b39c','#2f7f75','#c6f5e0'],void:'#140e0a'}};
const cvTheme=()=>CVTHEMES[CV.F.theme]||CVTHEMES.roots;
const cvRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
/* 絵のチップを、こさの番号で読めるようにする（1回だけ）。読みこみ中なら null */
function cvTexData(){const C=CV;if(C.tx)return C.tx;const T={};for(const k of['cols','ccols','ground','moss','caus']){const id='cave:'+k,ch=cvChipOf(id);if(!ch)continue;const im=chipImgs(ch,id)[0];if(!im.ok)return null;
    const d=im.getContext('2d').getImageData(0,0,im.width,im.height).data,L=new Int8Array(im.width*im.height);for(let i=0;i<L.length;i++)L[i]=d[i*4+3]?Math.min(5,Math.round(d[i*4]/50)):-1;
    let top=im.height;for(let y=0;y<im.height&&top===im.height;y++)for(let x=0;x<im.width;x++)if(L[y*im.width+x]>=0){top=y;break}
    T[k]={w:im.width,h:im.height,L,top}}
  {const ch=cvChipOf('tex:water');if(ch){const im=chipImgs(ch,'water')[0];if(!im.ok)return null;/* 水の模様：村と同じ水のテクスチャ（tex:water）の明るさを、3だん（0・1・2）にする */
    const d=im.getContext('2d').getImageData(0,0,im.width,im.height).data,n=im.width*im.height,Y=new Float32Array(n);for(let i=0;i<n;i++)Y[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;
    const so=Float32Array.from(Y).sort(),q1=so[(n*.3)|0],q2=so[(n*.8)|0],L=new Int8Array(n);for(let i=0;i<n;i++)L[i]=Y[i]<q1?0:Y[i]<q2?1:2;T.water={w:im.width,h:im.height,L,top:0}}}
  return C.tx=T}
const CVCLIFFH=28,CVHANG=72,CVREFL=44;/* CVREFL：水のうつりこみの長さ（1マス64ドット） *//* 床のがけの正面の高さ・台のふちからたれる柱のがけの長さ（1マス64ドット） */
function cvChunk(cx,cy,now){const C=CV,key=cx+cy*64;let q=C.ch.get(key);if(q&&!(q.tmp&&now-q.t0>300)){q.u=now;return q.c}
  if(!q&&C.ch.size>=CVCHMAX){let ok=-1,ou=1e18;for(const[k,v]of C.ch)if(v.u<ou){ou=v.u;ok=k}const old=C.ch.get(ok);old.c.width=old.c.height=0;C.ch.delete(ok)}
  const c=q?q.c:document.createElement('canvas'),N=CVCH*64+CVPAD*2;c.width=c.height=N;const g=c.getContext('2d');
  const T=cvTexData();CVMISS=!T;const wp=cvPaintPx(g,cx*CVCH*64-CVPAD,cy*CVCH*64-CVPAD,N,T||{});
  g.imageSmoothingEnabled=false;g.setTransform(2,0,0,2,CVPAD-cx*CVCH*64,CVPAD-cy*CVCH*64);
  for(let y=cy*CVCH-1;y<=cy*CVCH+CVCH;y++)for(let x=cx*CVCH-1;x<=cx*CVCH+CVCH;x++)cvPaintCell(g,x,y);
  C.ch.set(key,{c,u:now,t0:now,tmp:CVMISS,wp});return c}
/* 1ドットずつ：x0,y0 は1マス64ドットの世界の点。色は、その階の6色だけ（ドット絵の色の数）。かげも、色を1だん・2だんさげるだけ（なめらかにしない） */
function cvPaintPx(g,x0,y0,N,T){const C=CV,Fd=C.fld,TH=cvTheme(),CW=TH.wall==='crys'&&T.ccols,TC=CW?T.ccols:T.cols,WK=(CW?TH.crys[0]:TH.rock).map(cvRGB),RK=TH.rock.map(cvRGB),FL=TH.floor.map(cvRGB),WA=TH.water.map(cvRGB),VO=cvRGB(TH.void),rockOut=TH.out==='rock',
    FH=TC?TC.h:60,PADB=Math.max(FH,CVHANG),PADT=CVHANG,H2=N+PADB+PADT,cls=new Int8Array(N*H2),lev=new Int8Array(N*H2),fv=new Float32Array(N*H2),wv=new Float32Array(N*H2);
  const smp=(A,px,py)=>{const Q=64/CVFR;let u=px/Q-.5,v=py/Q-.5;u=Math.max(0,Math.min(Fd.W2-1.001,u));v=Math.max(0,Math.min(Fd.H2-1.001,v));const i=Math.floor(u),j=Math.floor(v),s=u-i,t=v-j,q=j*Fd.W2+i;return A[q]*(1-s)*(1-t)+A[q+1]*s*(1-t)+A[q+Fd.W2]*(1-s)*t+A[q+Fd.W2+1]*s*t};
  for(let y=0;y<H2;y++)for(let x=0;x<N;x++){const px=x0+x,py=y0+y-PADT,k=y*N+x;if(px<0||py<0||px>=CVW*64||py>=CVH*64){cls[k]=0;continue}
    const f=smp(Fd.F,px,py);fv[k]=f;if(f<.5){cls[k]=0;continue}const w=smp(Fd.Wt,px,py);wv[k]=w;if(w>=.5){cls[k]=2;continue}
    const p=smp(Fd.Pt,px,py);if(p>=.5){cls[k]=3;continue}cls[k]=1;lev[k]=Math.round(smp(Fd.Lv,px,py))}
  /* 坂（持ち主のたのみで、すじの絵をやめた）：岩の段の絵（cave:steps）のうしろの、がけの正面・かげを消す所 */
  const SL=[];for(const[j,o]of C.ob){if(o.k!=='^')continue;const x=cvX(j),y=cvY(j),L=C.lv[j],IN=(a,b)=>a>=0&&b>=0&&a<CVW&&b<CVH,d=[[0,-1],[-1,0],[1,0],[0,1]].find(([a,b])=>IN(x+a,y+b)&&C.g[cvJ(x+a,y+b)]&&C.lv[cvJ(x+a,y+b)]===L+1)||[0,-1];
    const bx=x*64+32+d[0]*32,by=y*64+32+d[1]*32;if(bx<x0-140||bx>x0+N+140||by<y0-140||by>y0+N+140)continue;SL.push({bx,by,dx:d[0],dy:d[1],a0:-44,a1:d[1]<0?CVCLIFFH+12:30})}
  const slopeAt=(px,py)=>{for(const q of SL){const rx=px-q.bx,ry=py-q.by,a=rx*q.dx+ry*q.dy,ls=-rx*q.dy+ry*q.dx,l=Math.abs(ls),am=(q.a0+q.a1)/2,ha=(q.a1-q.a0)/2,t=(a-am)/ha;if(t<=-1||t>=1)continue;
      const w=19+2*Math.sin(a*.21+q.bx),e=w*Math.pow(1-Math.pow(Math.abs(t),4),.25);if(l<e)return{u:(a-q.a0)/(q.a1-q.a0),edge:e-l,side:(ls<0)===(q.dx+q.dy<0)}}return null};
  const lv=(t,u,v)=>{if(!t)return -1;const X=((u%t.w)+t.w)%t.w,Y=t.w===t.h?((v%t.h)+t.h)%t.h:v;if(Y<0||Y>=t.h)return -1;return t.L[Y*t.w+X]};/* こさの番号。正方形の絵は上下もくりかえす */
  const WR=[WA[3],WA[2],WA[1],WA[0],WA[4]],WM=new Uint8Array(N*N),MO=TH.mossc&&Fd.Ms?TH.mossc.map(cvRGB):null;/* 水の色を、くらい順に（深い・なか・あさい・明るい・ふち） */
  const im=g.createImageData(N,N),D=im.data,put=(o,c)=>{D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255},cl=(a,i)=>a[Math.max(0,Math.min(a.length-1,i))],rcA=new Int16Array(H2),ccA=new Int16Array(H2),upw=new Int32Array(N).fill(9999);
  for(let x=0;x<N;x++){const px=x0+x;
    /* 下から上へ：rc 下の床からの行（岩の正面）・cc 下の低い床からの行（床のがけ） */
    let rc=9999,cc=9999,cl0=-1;
    for(let y=H2-1;y>=0;y--){const k=y*N+x,c0=cls[k],cb=y+1<H2?cls[k+N]:c0;
      if(c0===0)rc=cb!==0?0:Math.min(9999,rc+1);else rc=9999;
      if(c0===1){if(y+1<H2&&cls[k+N]===1&&lev[k+N]<lev[k]){cc=0;cl0=lev[k]}else if(lev[k]===cl0)cc=Math.min(9999,cc+1);else cc=9999}else cc=9999;rcA[y]=rc;ccA[y]=cc}
    /* 上から下へ：hc 上の床からの行（台のふちからたれるがけ）・sh 上の岩・高い床からの行（かげ） */
    let hc=9999,sh=9999;/* upw：この列で、上の岸から何ドット水がつづいたか */
    for(let y=0;y<H2;y++){const k=y*N+x,c0=cls[k],ca=y>0?cls[k-N]:c0;
      if(c0===0)hc=ca!==0?0:Math.min(9999,hc+1);else hc=9999;upw[x]=c0===2?(ca===2?upw[x]+1:0):9999;
      if(c0===0||(y>0&&c0===1&&ca===1&&lev[k-N]>lev[k]))sh=0;else sh=Math.min(9999,sh+1);
      const oy=y-PADT;if(oy<0||oy>=N)continue;const py=y0+oy,o=(oy*N+x)*4;
      if(c0===0){
        /* 岩のかたまりの中は、まっ暗な空洞（持ち主がきめた）。大岩でかこむ階は、空洞の南のふちに柱の岩が立つ */
        const r=rcA[y],lc=rockOut&&r<FH?lv(TC,px,FH-1-r):-1;if(lc>=0){put(o,WK[lc]);continue}
        {let l=-1;if(hc<CVHANG&&TC){l=lv(TC,px,TC.top+hc);if(l>0)l=Math.max(1,l-Math.floor(hc/22))}/* 台のふちからたれる柱のがけ：下ほど暗く、暗い穴へとける */
          put(o,l>=1?WK[l]:l===0?WK[0]:rockOut&&hc<CVHANG?WK[1]:VO)}/* 大岩でかこむ階：柱の頭と頭のあいだのすきまは、まっ黒にせず、くらい岩の色（持ち主：黒い筋に見える） */
        continue}
      if(c0===2){/* 水（持ち主のたのみで、網目をやめた）：水べは明るいふち。なかは、村と同じ水のテクスチャの3だん＋深さで、くらい色から明るい色のならび（WR）。
           北の岸から下へ CVREFL ドットは、岸の上の岩・がけのうつりこみ（床はうつさない）：上下さかさに、行ごとに1ドットずつゆらいで、水の色で、1行おきに切れる（水面のゆれ） */
        const w=wv[k],edge=(y>0&&cls[k-N]!==2)||(x>0&&cls[k-1]!==2)||(x<N-1&&cls[k+1]!==2)||(y+1<H2&&cls[k+N]!==2);WM[oy*N+x]=1;
        if(edge){put(o,WR[4]);continue}if(w<.56){put(o,WR[3]);continue}
        const tv=T.water?lv(T.water,px+((py>>3)&1),py):1,dep=w>.86?0:w>.7?1:2;let ix=Math.max(0,Math.min(3,dep+tv-1));
        const u=upw[x];if(u<CVREFL&&(u%4)!==3){const sy=oy-2*u-1+((Math.sin((py+u)*.9)*1.4)|0),sx=x+(((py>>1)&1)?1:-1);/* うつりこみ */
          if(sy>=0&&sx>=0&&sx<N&&cls[(sy+PADT)*N+sx]===0){const q=(sy*N+sx)*4;if(D[q+3]){const Lm=(D[q]*.3+D[q+1]*.59+D[q+2]*.11)/255;ix=Lm>.62?3:Lm>.42?2:Lm>.22?1:0;if(u>CVREFL*.6)ix=Math.min(3,ix+1)}}}
        put(o,WR[ix]);continue}
      if(c0===3){let up=0;for(let d=1;d<=14&&y-d>=0;d++){if(cls[k-d*N]!==3){up=d;break}}put(o,up?RK[1]:VO);continue}
      if(SL.length){const sp=slopeAt(px,py);if(sp){let l=lv(T.ground,px,py);if(l<0)l=3;put(o,l===0?FL[0]:FL[l]);continue}}/* 岩の段の絵（cvPaintCell）のうしろ：がけの正面とかげを消して、ふつうの床 */
      const c=ccA[y];let l=c<CVCLIFFH&&TC?lv(TC,px,TC.h-1-c):-1;
      if(l>=0){put(o,WK[l]);continue}/* 床のがけ（水晶のほらあなは、水晶のかべ） */
      l=lv(T.ground,px,py);if(l<0)l=3;
      if(MO){const m=smp(Fd.Ms,px,py);if(m>.62){let dk=fv[k]<.62?2:fv[k]<.75?1:0;if(dk){for(let d=1;d<=8&&y+d<H2;d++)if(cls[k+N*d]===0){dk=0;break}}if(sh<6)dk=Math.max(dk,2);else if(sh<14)dk=Math.max(dk,1);if(m<.66)dk++;/* コケ：ふちは1だん暗い。地面のもようの明るさで、コケの6色 */
        const lm=T.moss?lv(T.moss,px,py):l,ml=Math.max(0,Math.min(5,lm-dk));/* コケのテクスチャ（cave:moss）のこさ */put(o,MO[ml]);continue}}
      let dk=fv[k]<.62?2:fv[k]<.75?1:0;if(dk){for(let d=1;d<=8&&y+d<H2;d++)if(cls[k+N*d]===0){dk=0;break}}/* 下にかべがある所は、かべぎわのかげをつけない（かべの上のふちに黒い帯が出る。持ち主） */if(sh<6)dk=Math.max(dk,2);else if(sh<14)dk=Math.max(dk,1);/* かげは、色を1だん・2だんさげる */
      if(!rockOut&&ca===0)l=5;/* 台の上のふちは明るく */
      put(o,l===0?FL[0]:cl(FL,l-dk))}}
  g.putImageData(im,0,0);
  /* 水のうつりこみの形（せかいの点）：水のドットを1行ずつ。4行に1行はあけて、水面のゆれで切れて見せる */
  let P=null,PF=null;for(let oy=0;oy<N;oy+=2){const gy=(y0+oy)/2,gap=(Math.floor(gy)&3)===3;let x=0;while(x<N){if(!WM[oy*N+x]){x+=2;continue}const xs=x;while(x<N&&WM[oy*N+x])x+=2;if(!PF){P=new Path2D();PF=new Path2D()}PF.rect((x0+xs)/2,gy+CVOY*TS,(x-xs)/2,1);if(!gap)P.rect((x0+xs)/2,gy+CVOY*TS,(x-xs)/2,1)}}
  return P?{P,PF}:null}/* P：うつりこみ（4行に1行あけた）・PF：水ぜんぶ（流れる模様） */
/* 壁ぎわのかざり（見た目だけ）：北が岩の床のマス（壁のすぐ前）に、階ごとのかざりを、マスの番号できめて置く。光る物は、まわりを照らす */
function cvDecoPlace(){const C=CV,TH=cvTheme(),D=TH.deco||{},L=[];
  const open=(x,y)=>y<CVH&&x>=0&&x<CVW&&C.g[cvJ(x,y)]&&!C.wt[cvJ(x,y)]&&!C.ob.has(cvJ(x,y));/* 大きなかざりは、道をふさいで見えないよう、広い所（下へ2マス床がつづく）のかべぎわだけ（持ち主のたのみ） */
  for(let y=1;y<CVH;y++)for(let x=0;x<CVW;x++){const j=cvJ(x,y);if(!C.g[j]||C.wt[j]||C.ob.has(j)||C.g[j-CVW])continue;const h=n=>hash(((j*41+n*997+C.fl*7919)>>>0)),room=open(x,y+1)&&open(x,y+2)&&open(x,y+3)&&x>0&&x<CVW-1&&!C.g[cvJ(x-1,y-1)]&&!C.g[cvJ(x+1,y-1)];/* 上の左右もかべ（道の入り口のよこには置かない） */
    if(room&&D.crys&&TH.crys&&h(1)<D.crys)L.push({j,k:'crys',v:(h(2)*TH.crys.length)|0,m:h(10)<.3?0:h(11)<.5?1:2,flip:h(3)<.5,dx:Math.round((h(4)-.5)*12)});
    else if(room&&D.shroom&&h(5)<D.shroom)L.push({j,k:'shroom',v:(h(17)*4)|0,flip:h(18)<.5,dx:Math.round((h(6)-.5)*12)});/* きのこ：4つの生え方（cave:kinoko#0〜3）から */
    else if(D.bone&&h(7)<D.bone)L.push({j,k:'bone',v:(h(8)*3)|0,dx:Math.round((h(9)-.5)*10)});
    const used=L.length&&L[L.length-1].j===j;/* 同じマスには1つだけ */
    if(used);else if(D.vine&&h(12)<D.vine)L.push({j,k:'vine',n:1+((h(13)*3)|0),dx:0});/* 光るつた：岩の正面から、たれる */
    else if(room&&D.big&&h(14)<D.big)L.push({j,k:'big',flip:h(15)<.5,dx:Math.round((h(16)-.5)*10)})}/* 大きな石じゅん */
  const RS=[...C.ob].filter(([,o])=>o.k==='R').map(([j])=>j),nearR=(x,y)=>RS.some(r=>Math.abs(cvX(r)-x)<=1&&cvY(r)-y>=0&&cvY(r)-y<=2);/* 下へおりる入り口の絵の上には、植物を置かない */
  if(D.plant)for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++){const j=cvJ(x,y);if(!C.g[j]||C.wt[j]||C.ob.has(j)||nearR(x,y)||L.some(d=>d.j===j))continue;const h=n=>hash(((j*53+n*911+C.fl*6151)>>>0));/* 植物：床のどこにでも（持ち主のたのみ） */
    const ms=cvMossAt(x,y);if(TH.moss&&!ms&&h(9)>.15)continue;/* 植物は、ほとんどコケの上。コケの上は、1マスに3本まで（持ち主のたのみで、こく） */
    let any=false;for(let q=0;q<(ms?3:1);q++){const hq=n=>h(n+q*20);if(hq(1)<D.plant*(ms?2.4:1)){any=true;const sx=ms?[-9,9,0][q]:0,sy=ms?[-6,-6,8][q]:0;L.push({j,k:'plant',v:D.plants[(hq(2)*D.plants.length)|0],flip:hq(3)<.5,dx:sx+Math.round((hq(4)-.5)*8),dy:sy+Math.round((hq(5)-.5)*6)})}}
    if(!any&&D.gmoss&&h(6)<D.gmoss*(ms?1.5:1))L.push({j,k:'gmoss',dx:Math.round((h(7)-.5)*10),dy:Math.round((h(8)-.5)*10)})}/* 光るこけ */
  C.deco=L;C.shafts=null;if(C.mist)C.mist.width=C.mist.height=0;C.mist=C.mistP=null;for(const c of Object.values(C.crysImg||{}))if(c)c.width=c.height=0;C.crysImg=null;if(C.wflow)C.wflow.width=C.wflow.height=0;C.wflow=C.wpat=null}
/* 水晶の絵を、その階の色にぬりかえた絵（色ごとに1まい。入るときに作って、出るときに手ばなす） */
/* こさの番号の絵（3Dで写した水晶・岩の段）を、階の色のならびでぬりかえる（1回だけ。C.crysImg にためて、洞窟を出るとき手ばなす） */
function cvToneImg(id,R,key){const C=CV;if(!C.crysImg)C.crysImg={};if(C.crysImg[key])return C.crysImg[key];const ch=cvChipOf(id);if(!ch)return null;const im=chipImgs(ch,id)[0];if(!im.ok)return null;
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height),Q=R.map(cvRGB);
  for(let i=0;i<d.data.length;i+=4){if(!d.data[i+3])continue;const l=Math.min(5,Math.round(d.data[i]/50)),q=Q[l];d.data[i]=q[0];d.data[i+1]=q[1];d.data[i+2]=q[2]}g.putImageData(d,0,0);c.ax=ch.ax;c.ay=ch.ay;return C.crysImg[key]=c}
const cvCrysImg=(v,m)=>cvToneImg('cave:crys#'+m,cvTheme().crys[v],'c'+v+'_'+m);/* m：水晶の形（0 小さい1本・1と2 かたまり） */
function cvDrawDeco(d,now){const C=CV,ox=cvX(d.j)*TS+d.dx,oy=(cvY(d.j)+CVOY)*TS,t=now/1000+d.j;
  if(d.k==='crys'){const c=cvCrysImg(d.v,d.m);if(c){ctx.save();if(d.flip){ctx.translate(2*ox+TS,0);ctx.scale(-1,1)}ctx.drawImage(c,ox+c.ax/2,oy+c.ay/2-4,c.width/2,c.height/2);ctx.restore()}
    const p=(t*.6)%2.6;if(p<.6){const s=Math.sin(p/.6*Math.PI),q=cvTheme().crys[d.v][5];ctx.globalAlpha=s;const sx=ox+4+((d.j*7)%24),sy=oy-8+((d.j*3)%18);P4(q,sx,sy,1,1);if(s>.6){P4(q,sx-1,sy,3,1);P4(q,sx,sy-1,1,3)}ctx.globalAlpha=1}return}/* きらっ */
  if(d.k==='shroom'){if(d.flip){ctx.save();ctx.translate(2*ox+TS,0);ctx.scale(-1,1)}cvChip(ctx,'cave:kinoko#'+d.v,ox,oy,now);if(d.flip)ctx.restore();const p=(t*.35)%1;ctx.globalAlpha=Math.sin(p*Math.PI)*.8;P4('#b6fff0',ox+14+Math.round(Math.sin(t*2)*4),oy-6-Math.floor(p*20),1,1);P4('#b6fff0',ox+4+Math.round(Math.cos(t*1.7)*3),oy+2-Math.floor(((p+.5)%1)*14),1,1);ctx.globalAlpha=1;return}
  if(d.k==='bone')cvChip(ctx,'cave:bone#'+d.v,ox,oy,now);
  if(d.k==='big'){if(d.flip){ctx.save();ctx.translate(2*ox+TS,0);ctx.scale(-1,1)}cvChip(ctx,'cave:bigstal',ox,oy,now);if(d.flip)ctx.restore();return}
  if(d.k==='vine'){const G=cvTheme().glow;for(let v=0;v<d.n;v++){const hs=n=>hash(((d.j*29+v*313+n*57)>>>0)),L=16+((hs(1)*20)|0);let x=ox+4+((hs(2)*24)|0);const y0=oy-26;/* 光るつた：岩の正面の上からたれる。くき・葉・光る実 */
      for(let i=0;i<L;i++){const sw=Math.round(Math.sin(t*1.3+v+i*.25)*(i/L)*1.5);P4('#1f4a44',x+sw,y0+i,1,1);if(i%5===2){P4('#3f8f6a',x+sw+1,y0+i,2,1);P4('#3f8f6a',x+sw-2,y0+i+1,2,1)}if(i%7===5)P4(G,x+sw,y0+i,1,1);if(hs(10+i)<.12)x+=hs(20+i)<.5?-1:1}
      const sw=Math.round(Math.sin(t*1.3+v+1)*1.5);P4(G,x+sw-1,y0+L,3,2);P4('#ffffff',x+sw,y0+L,1,1)}return}
  if(d.k==='gmoss'){const G=cvTheme().glow,hs=n=>hash(((d.j*31+n*97)>>>0)),cx=ox+16,cy=oy+20+(d.dy||0);/* 光るこけ：床の上の、ふちのでこぼこな、ひくいかたまりと光るつぶ */
    for(let i=0;i<14;i++){const a=hs(i)*6.283,r=hs(i+40)*7;P4(i%3?'#2f6a52':'#3f8f6a',cx+Math.cos(a)*r*1.4-1,cy+Math.sin(a)*r*.6,3,2)}
    for(let i=0;i<6;i++){const a=hs(i+80)*6.283,r=hs(i+90)*6,tw=.5+.5*Math.sin(t*2+i*1.7);ctx.globalAlpha=.5+.5*tw;P4(G,cx+Math.cos(a)*r*1.5,cy+Math.sin(a)*r*.55-1,1,1);ctx.globalAlpha=1}return}
  if(d.k==='plant'){const y=oy+(d.dy||0);if(d.flip){ctx.save();ctx.translate(2*ox+TS,0);ctx.scale(-1,1)}cvChip(ctx,'cave:plant#'+d.v,ox,y,now);if(d.flip)ctx.restore()}}/* ほね：3Dから写した絵（tools/art/furn3d/items/cave_bone0〜2） */
/* 区画の上にかさねる、マスごとの物：光る鉱石・つらら石（岩の正面）・小石・坂のすじ */
function cvPaintCell(g,x,y){const C=CV,ox=x*TS,oy=y*TS,IN=(a,b)=>a>=0&&b>=0&&a<CVW&&b<CVH,W0=(a,b)=>!IN(a,b)||!C.g[cvJ(a,b)],LV=(a,b)=>IN(a,b)?C.lv[cvJ(a,b)]:0,
    h=n=>hash(((y*CVW+x)*7+n*131+977)>>>0),F=(c,a,b,w,hh)=>{g.fillStyle=c;g.fillRect(ox+a,oy+b,w,hh)};if(!IN(x,y))return;const j=cvJ(x,y);
  if(W0(x,y)){if(W0(x,y+1)||C.wt[j+CVW]||cvTheme().out!=='rock')return;/* つらら石・光る鉱石は、大岩でかこむ階の岩の正面だけ */
    {const D=cvTheme().deco||{};if(D.roots&&h(120)<D.roots){/* 天井からたれる根：岩の正面の上から、まがりながら下へ。ところどころ小さな葉 */const n=1+((h(121)*2)|0);for(let r=0;r<n;r++){let px=4+((h(122+r)*22)|0),py=-12;const L=22+((h(130+r)*18)|0);for(let i=0;i<L;i++){const w=i<L*.6?2:1;F(i%6===5?'#7a5634':'#9a7046',px,py+i,w,1);if(w>1)F('#c0905a',px,py+i,1,1);if(h(140+r*31+i)<.16)px+=h(150+r+i)<.5?-1:1;if(i>8&&h(160+r*17+i)<.14){F('#4f8a30',px+w,py+i,3,2);F('#86c25a',px+w,py+i,2,1)}}F('#9a7046',px,py+L,1,2)}}
      if(D.moss&&h(170)<D.moss){const px=2+((h(171)*20)|0);F('#4f7f34',px,26,8,2);F('#6faa48',px+1,25,5,1);F('#86c25a',px+2,24,2,1)}}/* こけ：岩の正面の下 */
    if(C.ore.has(j)&&!cvChip(g,'cave:ore',ox,oy)){F('#3f8f8a',9,14,4,5);F('#7fe0d2',10,15,2,2);F('#3f8f8a',19,19,5,4);F('#7fe0d2',20,20,2,2);F('#7fe0d2',15,24,2,2)}
    if(h(110)<.3&&!cvChip(g,'cave:stalac#'+(h(111)<.5?0:1),ox,oy+4)){const px=5+((h(112)*18)|0);F('#5a4d43',px,7,5,6);F('#5a4d43',px+1,13,3,4);F('#5a4d43',px+2,17,1,3)}
    return}
  if(C.wt[j])return;const o=C.ob.get(j);
  if(o&&o.k==='^'){const c=cvToneImg('cave:steps',cvTheme().rock,'steps');if(c)g.drawImage(c,ox+c.ax/2,oy+c.ay/2,c.width/2,c.height/2);else CVMISS=true;return}/* 坂：がけに切りこんだ自然の岩の段（3Dから写した絵、tools/art/furn3d/items/cave_steps.py） */
  if(h(90)<.16&&!o){const px=4+((h(91)*20)|0),py=8+((h(92)*16)|0);F('#6f6152',px,py+1,5,3);F('#6f6152',px+1,py,3,1);F('#a39581',px+1,py+1,2,1);if(h(93)<.5){F('#6f6152',px+7,py+3,3,2);F('#a39581',px+7,py+3,1,1)}}/* くずれた小石 */
}
function cvSpark(x,y,col,n){const C=CV,t0=performance.now();for(let i=0;i<n;i++){const an=i/n*6.283+Math.random()*.6,v=.8+Math.random()*1.6;C.sparks.push({x,y,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.6-1.2,t0,col})}}
const P4=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
function cvRockArt(ox,oy){P4('rgba(40,25,10,.2)',ox+4,oy+27,24,3);P4('#5e5246',ox+4,oy+8,24,20);P4('#5e5246',ox+7,oy+5,18,26);P4('#85776a',ox+6,oy+7,20,18);P4('#85776a',ox+8,oy+5,16,3);P4('#a3957f',ox+9,oy+8,9,2);P4('#a3957f',ox+8,oy+10,3,4);P4('#6f6253',ox+17,oy+17,6,2);P4('#6f6253',ox+11,oy+21,4,1)}
const CVOBJCHIP={o:'cave:fos',A:'cave:stalag',D:'cave:door',E:'cave:doorw'};
function cvDrawObj(j,o,now){const C=CV,ox=cvX(j)*TS,oy=(cvY(j)+CVOY)*TS,k=o.k,hs=n=>hash((j*13+n*71+5)>>>0);
  if(CVOBJCHIP[k]&&!((k==='D'||k==='E')&&o.done)){const id=CVOBJCHIP[k]+(k==='A'?'#'+(hs(3)<.5?0:1):'');if(cvChip(ctx,id,ox,oy,now))return}
  if(k==='g'){const p=.5+.5*Math.sin(now/700+j);if(!cvChip(ctx,'cave:kinoko#2',ox,oy,now)){/* 光るきのこのマス（歩ける）：ひくい小さなきのこ */P4('#2f6f6a',ox+8,oy+20,3,6);P4('#2f6f6a',ox+18,oy+17,3,8);P4('#2f6f6a',ox+13,oy+23,2,4);P4('#58c9b8',ox+5,oy+16,9,5);P4('#58c9b8',ox+15,oy+13,9,5);P4('#58c9b8',ox+11,oy+21,6,3);P4('#b6fff0',ox+7,oy+17,3,1);P4('#b6fff0',ox+17,oy+14,3,1)}
    ctx.globalAlpha=.35+.4*p;P4('#b6fff0',ox+6+hs(1)*18,oy+8-p*5,1,1);P4('#b6fff0',ox+10+hs(2)*12,oy+11-p*3,1,1);ctx.globalAlpha=1;return}
  if(k==='A'){P4('rgba(20,14,10,.3)',ox+7,oy+26,18,3);P4('#5a4d43',ox+9,oy+14,14,14);P4('#5a4d43',ox+11,oy+6,10,10);P4('#5a4d43',ox+13,oy,6,8);P4('#7a6a5c',ox+10,oy+15,6,12);P4('#7a6a5c',ox+12,oy+7,4,9);P4('#7a6a5c',ox+14,oy+1,2,7);P4('#9b8b78',ox+11,oy+16,2,8);P4('#9b8b78',ox+13,oy+8,1,6);return}
  if(k==='R'){const c=cvToneImg('cave:down',cvTheme().rock,'down');if(c){ctx.drawImage(c,ox+c.ax/2,oy+c.ay/2,c.width/2,c.height/2);const t=now/1000;for(let i=0;i<3;i++){const p=(t*.4+i*.33)%1;ctx.globalAlpha=(1-p)*.8;P4('#fff3c4',ox+11+hs(i)*10,oy-2-p*16,1,1)}ctx.globalAlpha=1;return}/* 下へおりる所：岩山の暗い入り口へ下る岩の段（3Dから写した絵、cave_down.py） */
    P4('#1d1713',ox+2,oy+4,28,24);P4('#40352c',ox+2,oy+4,28,3);for(let i=0;i<4;i++){P4('#75655a',ox+5+i*2,oy+9+i*5,22-i*4,3);P4('#8a7968',ox+5+i*2,oy+9+i*5,22-i*4,1)}
    const t=now/1000;for(let i=0;i<4;i++){const p=(t*.4+i*.25)%1;ctx.globalAlpha=1-p;P4('#fff3c4',ox+8+hs(i)*16,oy+14-p*22,2,2)}ctx.globalAlpha=1;return}
  if(k==='^')return;
  if(k==='S'){const t=now/1000;for(let i=0;i<12;i++){const an=i/12*6.283+t*.6;P4(i%2?'#fff3c4':'#ffe08a',ox+16+Math.cos(an)*11-1,oy+18+Math.sin(an)*5-1,2,2)}
    for(let i=0;i<5;i++){const p=(t*.5+i*.2)%1;ctx.globalAlpha=1-p;P4('#fff3c4',ox+8+hs(i)*16,oy+16-p*26,2,2)}ctx.globalAlpha=1;return}
  if(k==='o'){P4('#6f6253',ox+6,oy+18,10,7);P4('#8d7f6d',ox+7,oy+17,8,2);P4('#a3957f',ox+8,oy+18,3,1);P4('#6f6253',ox+15,oy+14,11,10);P4('#8d7f6d',ox+16,oy+13,9,3);P4('#a3957f',ox+17,oy+14,4,1);P4('#5e5246',ox+11,oy+22,9,4);P4('#8d7f6d',ox+12,oy+21,7,2);
    P4('#efe6d2',ox+18,oy+17,5,1);P4('#efe6d2',ox+17,oy+18,2,3);P4('#efe6d2',ox+19,oy+20,3,1);P4('#efe6d2',ox+21,oy+18,1,2);return}/* 白いうずまきが、のぞいている */
  if(k==='T'){if(cvChip(ctx,o.done?'cave:chest#o':'cave:chest',ox,oy,now)){if(!o.done&&Math.sin(now/300+j)>.6){P4('#fff3c4',ox+24,oy+5,2,2);P4('#fff3c4',ox+4,oy+10,1,1)}return}P4('rgba(40,25,10,.2)',ox+5,oy+26,22,3);P4('#7a4f2a',ox+6,oy+14,20,13);P4('#96673a',ox+6,oy+14,20,2);P4('#5f3c1f',ox+6,oy+25,20,2);
    if(o.done){P4('#3a2616',ox+7,oy+10,18,5);P4('#96673a',ox+6,oy+4,20,6);P4('#b48246',ox+6,oy+4,20,2);P4('#5f3c1f',ox+6,oy+9,20,1)}
    else{P4('#96673a',ox+6,oy+8,20,7);P4('#b48246',ox+6,oy+8,20,2);P4('#5f3c1f',ox+6,oy+14,20,1);P4('#e8c45a',ox+14,oy+12,4,5);P4('#fff0b0',ox+15,oy+13,1,1);const tw=Math.sin(now/300+j)>.6;if(tw){P4('#fff3c4',ox+24,oy+5,2,2);P4('#fff3c4',ox+4,oy+10,1,1)}}return}
  if(k==='b'){let dx=0,dy=0;if(o.slide){const t=(now-o.slide.t0)/220;if(t>=1)o.slide=null;else{dx=(cvX(o.slide.from)-cvX(j))*TS*(1-t);dy=(cvY(o.slide.from)-cvY(j))*TS*(1-t)}}if(!cvChip(ctx,'cave:boulder',Math.round(ox+dx),Math.round(oy+dy),now))cvRockArt(ox+dx,oy+dy);return}
  if(k==='h'){if(o.done){if(cvChip(ctx,'cave:boulder~in',ox,oy,now))return;P4('#5e5246',ox+2,oy+4,28,26);P4('#85776a',ox+3,oy+5,26,22);P4('#a3957f',ox+6,oy+7,10,2);P4('#6f6253',ox+15,oy+17,8,2)}return}
  if(k==='t'){const lit=o.until>C.t;if(cvChip(ctx,'cave:torch',ox,oy,now)){if(lit){const f=((now/120)|0)%2;P4('#ff8a3d',ox+12,oy-3+f,8,7-f);P4('#ffb36b',ox+13,oy-2+f,6,5-f);P4('#fff0b0',ox+15,oy,2,3);P4('#ff8a3d',ox+15,oy-6+f*2,2,3);const v=clamp((o.until-C.t)/CVTORCH,0,1);P4('rgba(0,0,0,.5)',ox+7,oy-12,18,4);P4(v>.35?'#ffb36b':'#ff6b6b',ox+8,oy-11,Math.max(1,Math.round(16*v)),2)}return}P4('rgba(40,25,10,.2)',ox+9,oy+27,14,3);P4('#6f6253',ox+11,oy+24,10,5);P4('#8d7f6d',ox+11,oy+24,10,1);P4('#7a4f2a',ox+14,oy+10,4,15);P4('#96673a',ox+14,oy+10,1,15);P4('#5e5246',ox+12,oy+8,8,3);
    if(lit){const f=((now/120)|0)%2;P4('#ff8a3d',ox+12,oy+1+f,8,7-f);P4('#ffb36b',ox+13,oy+2+f,6,5-f);P4('#fff0b0',ox+15,oy+4,2,3);P4('#ff8a3d',ox+15,oy-2+f*2,2,3);
      const v=clamp((o.until-C.t)/CVTORCH,0,1);P4('rgba(0,0,0,.5)',ox+7,oy-7,18,4);P4(v>.35?'#ffb36b':'#ff6b6b',ox+8,oy-6,Math.max(1,Math.round(16*v)),2)}return}
  if(k==='D'||k==='E'){if(o.done)return;const E=k==='E';P4(E?'#5f7a6c':'#6f6253',ox,oy-8,TS,40);P4(E?'#7d9a8a':'#8d7f6d',ox+2,oy-6,TS-4,34);P4(E?'#5f7a6c':'#6f6253',ox+15,oy-6,2,34);P4(E?'#a9c8b6':'#a3957f',ox+3,oy-5,10,1);P4(E?'#a9c8b6':'#a3957f',ox+18,oy-5,10,1);P4('#4a3d32',ox,oy+30,TS,2);
    if(E){P4('#e6f4ec',ox+7,oy+8,5,1);P4('#e6f4ec',ox+11,oy+9,2,3);P4('#e6f4ec',ox+8,oy+12,4,1);P4('#e6f4ec',ox+20,oy+14,5,1);P4('#e6f4ec',ox+24,oy+15,2,3)}/* 風のしるし */else{P4('#ff8a3d',ox+8,oy+10,3,4);P4('#ffb36b',ox+9,oy+11,1,2);P4('#ff8a3d',ox+21,oy+10,3,4);P4('#ffb36b',ox+22,oy+11,1,2)}return}
  if(k==='x'||k==='y'){if(cvChip(ctx,o.done?'cave:sluice#o':'cave:sluice',ox,oy,now))return;const fy=k==='x'?oy+12:oy+4;P4('#5f3c1f',ox+6,fy,20,16);P4('#96673a',ox+8,fy+2,16,12);P4('#7a4f2a',ox+15,fy+2,2,12);P4('#b48246',ox+8,fy+2,16,1);
    if(o.done){P4('#3a2616',ox+8,fy+6,16,8);P4('#7cc0e8',ox+10,fy+8,12,8);P4('#bfe3f5',ox+12,fy+9,3,6)}else if(!C.sluice&&Math.sin(now/400+j)>.5)P4('#bfe3f5',ox+15,fy+15,2,2);return}
  if(k==='1'||k==='2'){if(!o.wet)return;P4('#5fa9d6',ox,oy+3,TS,TS-3);P4('#7cc0e8',ox,oy+5,TS,TS-9);const s=(((now/400)|0)+j)%4;P4('#bfe3f5',ox+4+s*5,oy+10,6,1);P4('#bfe3f5',ox+16-s*3,oy+22,5,1);
    P4('#7a4f2a',ox+3,oy+12,26,10);P4('#96673a',ox+3,oy+12,26,3);P4('#5f3c1f',ox+3,oy+20,26,2);P4('#b48246',ox+6,oy+13,8,1);return}/* うかんだ丸太 */
  if(k==='m'){P4('rgba(40,25,10,.2)',ox+10,oy+27,12,3);P4('#7a4f2a',ox+14,oy+6,4,22);P4('#96673a',ox+14,oy+6,1,22);const cx=ox+16,cy=oy+4,an=o.done?now/160:.5;
    for(let b=0;b<4;b++){const a=an+b*1.5708;for(let d=3;d<=12;d+=2)P4(d<8?'#e6f4ec':'#a9c8b6',cx+Math.cos(a)*d-1,cy+Math.sin(a)*d-1,3,3)}P4('#5f3c1f',cx-2,cy-2,4,4);return}
  if(k==='k'){if(!o.done)return;if(cvChip(ctx,'cave:leaf',ox,oy,now))return;P4('#4f8a3a',ox+3,oy+6,26,22);P4('#4f8a3a',ox+6,oy+4,20,26);P4('#6fae52',ox+5,oy+7,22,18);P4('#8fd07a',ox+7,oy+8,10,3);P4('#4f8a3a',ox+15,oy+8,2,18);P4('#4f8a3a',ox+8,oy+16,16,1);return}
  if(k==='q'){if(o.gone){P4('#2a211a',ox,oy,TS,TS);P4('#4a3d32',ox,oy,TS,8);P4('#3a2f26',ox,oy+8,TS,2);return}for(let r=0;r<10;r++){const xx=ox+6+r*2+((hs(r)*4)|0),yy=oy+3+r*3;P4('#5e5246',xx,yy,2,3);if(r%3===1)P4('#5e5246',xx+2,yy+1,5,1)}P4('#5e5246',ox+20,oy+9,6,1);P4('#5e5246',ox+5,oy+22,5,1);return}
  if(k==='W'){for(let r=0;r<9;r++){const xx=ox+8+r*2-((hs(r)*3)|0),yy=oy+2+r*3;P4('#8a7865',xx,yy,2,3);if(r%3===0)P4('#8a7865',xx+2,yy+1,6,1)}P4('#8a7865',ox+19,oy+12,7,1);P4('#3a2f26',ox+14,oy+13,2,5);return}
  if(k==='!'){const t=(now/700+hs(1)*5)%3;if(t<1){ctx.globalAlpha=1-t;P4('#85776a',ox+6+hs(2)*18,oy-14+t*40,2,2);ctx.globalAlpha=1}/* ぱらぱら落ちる小石 */
    if(o.fall){const p=clamp(1-(o.fall-now)/CVROCKMS,0,1),w=6+p*18;ctx.globalAlpha=.15+p*.3;P4('#1a1511',ox+16-w/2,oy+18-w*.2,w,w*.4);ctx.globalAlpha=1;if(p>.75)cvRockArt(ox,oy-(1-p)*4*160)}
    else if(o.hitT&&now-o.hitT<400){ctx.globalAlpha=1-(now-o.hitT)/400;cvRockArt(ox,oy);ctx.globalAlpha=1}}}
function cvDrawActor(a,now){const C=CV,r=a.r,eat=a.eatU>now,walking=a.path.length>0&&!eat,sd=now-a.swing;let px=a.x*TS,py=a.y*TS;
  if(a.swing&&sd>=0&&sd<400)px+=(a.face<0?-1:1)*atkLunge(sd);px+=hitOff(a,now,1)[0];
  const jd=now-(a.jumpT||-1e9),hop=jd>=0&&jd<1000?Math.abs(Math.sin(jd/130))*9*(1-jd/1000):0,fy=py+9-(walking?Math.abs(Math.sin(now/110+a.id))*2.5:0)-hop;
  shadow(ctx,px,py+8,12,3.6);
  const pk=a.swing&&sd>=0&&sd<420?sd/420:null,J=a.job&&!walking?a.job:null,job=J&&CVJOBANIM[J.k]&&(J.k==='push'?cvCell(a)===J.s:true)?CVJOBANIM[J.k]:a.blowU>now?'point':'',joy=a.joyU>now,fight=C.en.some(e=>!e.dead&&!e.asleep&&Math.hypot(e.x-a.x,e.y-a.y)<CVAGGRO);
  drawSpirit(ctx,r.elem,px,fy,.435,a.face<0?-1:1,{dot:1,t:now/1000+a.id*1.7,vr:r.vr,pp:pk,anim:pk!=null?'punch':eat?'eat':joy?'clap':job,food:eat?a.eatE:'',walk:walking,work:!!job,back:joy||eat?false:a.back,turn:joy||eat?0:a.turn,mood:a.shockU>now?'shock':joy||eat?'joy':r.hunger<HUNGRYF?'hungry':fight?'brave':'',blink:(now/1000+a.id*1.3)%3.4<.13});
  if(a.hurtU>now){const m=hMax(r),v=clamp(r.hunger/m,0,1);P4('rgba(0,0,0,.6)',px-12,py+11,24,5);P4(v>.5?'#7ee08a':v>.25?'#ecdcbc':'#ff6b6b',px-11,py+12,Math.max(2,Math.round(22*v)),3)}
  if(J&&J.t>0){const T=J.k==='push'?CVPUSHT:J.k==='sluice'?CVSLUICET:CVLEAFT,f=clamp(J.t/T,0,1);P4('rgba(150,115,75,.6)',px-17,py+17,34,7);P4('#e8dcc0',px-16,py+18,32,5);P4('#e0a43a',px-16,py+18,Math.max(2,Math.round(32*f)),5)}}
const cvLureOn=j=>{const x=cvX(j)+.5,y=cvY(j)+.5+CVOY;return CV.party.some(a=>Math.hypot(a.x-x,a.y-y)<=CVLURE)};
/* 洞窟の空気（持ち主のたのみ：ARKの洞窟のように）。見た目だけ・セーブしない。
   霧：ドットの霧の絵（2ドットのます・3だんのこさ）を1まい作って、2まいを、ちがう速さでゆっくり流す（暗さの下：光のとどく所だけ見える）。
   光のすじ：天井のすきまから、ななめにさしこむ光（2ドットの段々のふち）。胞子：光る物のまわりから、光るつぶがゆっくりのぼる（暗さの上） */
function cvMistImg(){const C=CV;if(C.mist)return C.mist;const n=96,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),d=g.createImageData(n,n),q=cvRGB(cvTheme().glow);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=2*Math.PI/n;let v=0;for(let k=1;k<=3;k++)v+=Math.sin(x*a*k+k*1.7+Math.sin(y*a*2+k))*Math.cos(y*a*k+k*.9)/k;const l=v>.55?2:v>.15?1:0;if(!l)continue;const i=(y*n+x)*4;d.data[i]=200+q[0]*.2;d.data[i+1]=210+q[1]*.15;d.data[i+2]=230;d.data[i+3]=l===2?44:22}
  g.putImageData(d,0,0);C.mist=c;C.mistP=ctx.createPattern(c,'repeat');return c}
function cvMistDraw(now){const C=CV;cvMistImg();const t=now/1000;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle=C.mistP;
  for(const[sp,sc,al]of[[3,2,.4],[-2,3,.28]]){const ox=Math.floor(t*sp)%(96*sc),oy=Math.floor(t*sp*.3)%(96*sc);ctx.save();ctx.globalAlpha=al;ctx.translate(ox,oy);ctx.scale(sc,sc);ctx.fillRect((cam.x-ox)/sc-96,(cam.y-oy)/sc-96,VW/cam.z/sc+192,VH/cam.z/sc+192);ctx.restore()}ctx.restore()}
function cvShafts(){const C=CV;if(C.shafts)return C.shafts;const L=[];for(let y=1;y<CVH;y++)for(let x=0;x<CVW;x++){const j=cvJ(x,y);if(!C.g[j]||C.wt[j]||C.g[j-CVW])continue;if(hash(((j*71+C.fl*313)>>>0))<.03)L.push(j)}return C.shafts=L}
function cvAirDraw(now){const C=CV,TH=cvTheme(),t=now/1000,G=TH.glow;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const j of cvShafts()){if(!C.seen[j])continue;const x=cvX(j)*TS+16,y=(cvY(j)+CVOY)*TS+24,H=5*TS,w=10+(hash(j*7)*8|0),p=.5+.5*Math.sin(t*.4+j);/* 光のすじ：下の床から、左上へ */
    for(let r=0;r<H;r+=2){const f=r/H,xx=Math.round((x-r*.55)/2)*2,ww=Math.round(w*(1+f*.6)/2)*2;ctx.globalAlpha=(.07+.04*p)*(1-f)*(r<12?r/12:1);P4('#fff6dc',xx-ww/2,y-r,ww,2)}
    ctx.globalAlpha=.18+.1*p;P4('#fff6dc',x-w/2,y-1,w,2)}
  const x0=Math.floor(cam.x/TS),x1=Math.ceil((cam.x+VW/cam.z)/TS),y0=Math.floor(cam.y/TS)-CVOY,y1=Math.ceil((cam.y+VH/cam.z)/TS)-CVOY;
  for(let y=Math.max(0,y0);y<=Math.min(CVH-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(CVW-1,x1);x++){const j=cvJ(x,y);if(!C.seen[j]||!C.g[j])continue;const h=hash(((j*97+11)>>>0));if(h>.22)continue;
    for(let i=0;i<2;i++){const hh=hash(((j*131+i*17)>>>0)),per=6+hh*5,ph=((t+hh*per)/per)%1,px=x*TS+4+hh*24+Math.sin(t*.8+hh*9)*4,py=(y+CVOY)*TS+28-ph*44;/* 胞子：ゆっくりのぼって、きえる */
      ctx.globalAlpha=Math.sin(ph*Math.PI)*.8;P4(i?G:'#ffffff',Math.round(px),Math.round(py),1,1)}}
  ctx.restore()}
/* 光る物（持ち主のたのみ）：水晶・光るきのこ・光る花は、暗さの上に、もう1回うすく描いて（暗い所でも光って見える）、まわりに色のついた光をかさねる（ゆっくり明るさがゆれる） */
const CVGLOWP=new Set([2,3,6,7,14,15,17,19]);/* 光る植物の番号（cave:plant#） */
const cvGlows=d=>d.k==='crys'||d.k==='shroom'||d.k==='vine'||d.k==='gmoss'||(d.k==='plant'&&CVGLOWP.has(d.v));
function cvGlowSpr(col){const C=CV;if(!C.gls)C.gls={};let c=C.gls[col];if(c)return c;c=C.gls[col]=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),q=cvRGB(col),G=g.createRadialGradient(32,32,0,32,32,32);
  G.addColorStop(0,'rgba('+q+',.9)');G.addColorStop(.35,'rgba('+q+',.35)');G.addColorStop(1,'rgba('+q+',0)');g.fillStyle=G;g.fillRect(0,0,64,64);return c}
function cvGlowDraw(now){const C=CV,TH=cvTheme(),SH='#8ef0e0',FLW='#c89cff';const GA=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'globalAlpha');
  for(const d of C.deco||[]){if(!C.seen[d.j]||!cvGlows(d))continue;const p=.5+.5*Math.sin(now/900+d.j*1.7),col=d.k==='crys'?TH.crys[d.v][3]:d.k==='shroom'?SH:d.k==='plant'&&(d.v===3||d.v===15)?FLW:TH.glow,cx=cvX(d.j)*TS+d.dx+16,cy=(cvY(d.j)+CVOY)*TS+(d.dy||0)+(d.k==='crys'?2:d.k==='vine'?-8:8);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=d.k==='shroom'?.28+.14*p:.16+.12*p;const r=d.k==='crys'?56:d.k==='shroom'?46:d.k==='gmoss'?26:34;ctx.imageSmoothingEnabled=true;ctx.drawImage(cvGlowSpr(col),cx-r,cy-r,r*2,r*2);ctx.restore();ctx.imageSmoothingEnabled=false;
    ctx.save();const k=.35+.25*p;Object.defineProperty(ctx,'globalAlpha',{configurable:true,get(){return GA.get.call(this)/k},set(v){GA.set.call(this,v*k)}});ctx.globalAlpha=1;try{cvDrawDeco(d,now)}finally{delete ctx.globalAlpha;ctx.restore()}}
  for(const[j,o]of C.ob){if(o.k!=='g'||!C.seen[j])continue;const p=.5+.5*Math.sin(now/900+j*1.3),cx=cvX(j)*TS+16,cy=(cvY(j)+CVOY)*TS+4;/* 光るきのこのマス（物）も、同じように光る */
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.28+.14*p;ctx.imageSmoothingEnabled=true;ctx.drawImage(cvGlowSpr(SH),cx-46,cy-46,92,92);ctx.restore();ctx.imageSmoothingEnabled=false;
    ctx.save();const k=.35+.25*p;Object.defineProperty(ctx,'globalAlpha',{configurable:true,get(){return GA.get.call(this)/k},set(v){GA.set.call(this,v*k)}});ctx.globalAlpha=1;try{cvDrawObj(j,o,now)}finally{delete ctx.globalAlpha;ctx.restore()}}}
/* 水のうつりこみ（持ち主のたのみ）：水べのそばの物・かざり・せいれい・コワイノを、足もとで上下さかさにして、水の形（区画ごとの wp）の中だけに、うすく描く。
   水の形は4行に1行あけてあるので、水面のゆれで切れた、うつりこみに見える */
/* 水の模様が、ゆっくり流れる：村の水のテクスチャの明るい所だけを、水の明るい色で、ずらしながらかさねる（下絵の模様とずれて、ゆらいで見える） */
function cvWaterFlow(now){const C=CV,T=C.tx;if(!T||!T.water)return;const P=new Path2D();let any=false;for(const q of C.ch.values())if(q.wp){P.addPath(q.wp.PF);any=true}if(!any)return;
  if(!C.wflow){const W=T.water,c=document.createElement('canvas');c.width=W.w;c.height=W.h;const g=c.getContext('2d'),d=g.createImageData(W.w,W.h),q=cvRGB(cvTheme().water[4]);
    for(let i=0;i<W.L.length;i++)if(W.L[i]===2){d.data[i*4]=q[0];d.data[i*4+1]=q[1];d.data[i*4+2]=q[2];d.data[i*4+3]=255}g.putImageData(d,0,0);C.wflow=c;C.wpat=ctx.createPattern(c,'repeat')}
  const t=now/1000,ox=Math.floor(t*3)%128,oy=Math.floor(t*1.5)%128;ctx.save();ctx.clip(P);ctx.globalAlpha=.14;ctx.translate(ox/2,oy/2);ctx.scale(.5,.5);ctx.fillStyle=C.wpat;
  ctx.fillRect((cam.x-ox/2)*2-256,(cam.y-oy/2)*2-256,VW/cam.z*2+512,VH/cam.z*2+512);ctx.restore()}
function cvReflect(now){const C=CV,P=new Path2D();let any=false;for(const q of C.ch.values())if(q.wp){P.addPath(q.wp.P);any=true}if(!any)return;
  const nearW=(x,y)=>{for(let d=0;d<=3;d++){const yy=Math.floor(y)+d;if(yy>=0&&yy<CVH&&x>=0&&x<CVW&&C.wt[cvJ(x,yy)])return true}return false},L=[];
  for(const d of C.deco||[])if(C.seen[d.j]&&nearW(cvX(d.j),cvY(d.j)))L.push([(cvY(d.j)+CVOY+1)*TS-2,()=>cvDrawDeco(d,now)]);
  for(const[j,o]of C.ob)if(C.seen[j]&&'AtTDEbgo'.includes(o.k)&&nearW(cvX(j),cvY(j)))L.push([(cvY(j)+CVOY+1)*TS-2,()=>cvDrawObj(j,o,now)]);
  for(const a of C.party)if(nearW(Math.floor(a.x),a.y-CVOY))L.push([a.y*TS+9,()=>cvDrawActor(a,now)]);
  for(const e of C.en)if(!e.dead&&C.seen[cvCell(e)]&&nearW(Math.floor(e.x),e.y-CVOY))L.push([e.y*TS+6,()=>drawEnemy(e,now)]);
  if(!L.length)return;const GA=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'globalAlpha');ctx.save();ctx.clip(P);
  Object.defineProperty(ctx,'globalAlpha',{configurable:true,get(){return GA.get.call(this)/CVREFA},set(v){GA.set.call(this,v*CVREFA)}});ctx.globalAlpha=1;/* 描く物が globalAlpha=1 にもどしても、うすいまま */
  try{for(const[by,f]of L){ctx.save();ctx.translate(0,2*by+Math.round(Math.sin(now/500+by)));ctx.scale(1,-1);f();ctx.restore()}}
  finally{delete ctx.globalAlpha;ctx.restore()}}
const CVREFA=.42;/* うつりこみのこさ */
/* 水面のうごき・しずく（毎コマ。見えている水のマスだけ） */
function cvWaterDraw(now){const C=CV,TH=cvTheme(),x0=Math.max(0,Math.floor(cam.x/TS)),x1=Math.min(CVW-1,Math.ceil((cam.x+VW/cam.z)/TS)),y0=Math.max(0,Math.floor(cam.y/TS)-CVOY),y1=Math.min(CVH-1,Math.ceil((cam.y+VH/cam.z)/TS)-CVOY),t=now/1000,hi=TH.water[4],fo=TH.water[0];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const j=cvJ(x,y);if(!C.wt[j]||!C.seen[j])continue;const ox=x*TS,oy=(y+CVOY)*TS,a=hash((j*17+3)>>>0),b=hash((j*29+11)>>>0);
    /* 水面をゆっくり流れる光のすじ（2点ずつ動く） */{const p=(t*.15+a)%1;ctx.globalAlpha=.6*Math.sin(p*Math.PI);P4(hi,ox+2+Math.floor((b*18+p*8)/2)*2,oy+8+Math.floor(a*14/2)*2,6,1);ctx.globalAlpha=1}
    /* きらめき：十字の光が、ときどき光ってきえる */{const p=(t*.45+a*7)%3;if(p<1){const s=p<.5?p*2:2-p*2,cx=ox+4+Math.floor(b*22),cy=oy+4+Math.floor(a*22);ctx.globalAlpha=s;P4(fo,cx,cy,1,1);if(s>.5){P4(fo,cx-1,cy,3,1);P4(fo,cx,cy-1,1,3)}if(s>.85){P4(hi,cx-2,cy,5,1);P4(hi,cx,cy-2,1,5);P4(fo,cx,cy,1,1)}ctx.globalAlpha=1}}
    /* 光のつぶ：水面からゆっくりのぼって、きえる */if(a<.35){const p=(t*.18+b)%1,cx=ox+6+Math.floor(a*50)%20+Math.round(Math.sin(t*1.3+b*9)*2),cy=oy+16-Math.floor(p*30);ctx.globalAlpha=Math.sin(p*Math.PI)*.9;P4(hi,cx,cy,1,1);if(p>.2&&p<.7)P4(fo,cx,cy-1,1,1);ctx.globalAlpha=1}}
  C.drips=C.drips.filter(d=>now-d.t0<1100);for(const d of C.drips){const u=now-d.t0,px=d.x*TS,py=(d.y+CVOY)*TS;
    if(u<320){P4('#bfe3f5',px,py-(1-u/320)*(1-u/320)*70-2,1,3);continue}if(!d.s){d.s=1;if(typeof sfxAt==='function')sfxAt('cavedrip',d.x,d.y+CVOY)}
    const q=(u-320)/780;ctx.globalAlpha=(1-q)*.8;if(d.w){const r=2+q*9;for(let i=0;i<10;i++){const an=i/10*6.283;P4(fo,px+Math.cos(an)*r,py+Math.sin(an)*r*.45,1,1)}}else{P4('#bfe3f5',px-2-q*3,py-q*4,1,1);P4('#bfe3f5',px+2+q*3,py-q*4,1,1);P4('#6f8f9e',px-1,py,3,1)}ctx.globalAlpha=1}}
function cvCamTo(k){const C=CV;if(!C||!C.party.length)return;let x=0,y=0;for(const a of C.party){x+=a.x;y+=a.y}x=x/C.party.length*TS;y=(y/C.party.length-.6)*TS;const tx=x-VW/cam.z/2,ty=y-VH/cam.z/2;cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k}
function caveClamp(){cam.z=clamp(cam.z,1.2,3)}/* 洞窟のあいだは、カメラはパーティを追う（clampCam のかわり） */
function caveRender(now){const C=CV;if(!C)return;cvCamTo(.12);const k=dpr*cam.z;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1a1511';ctx.fillRect(0,0,cv.width,cv.height);const CX=Math.round(cam.x*k),CY=Math.round(cam.y*k);ctx.setTransform(k,0,0,k,-CX,-CY);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  {const vx0=cam.x/TS,vx1=(cam.x+VW/cam.z)/TS,vy0=cam.y/TS-CVOY,vy1=(cam.y+VH/cam.z)/TS-CVOY,n=CVCH*TS,p=CVPAD/2;
    for(let cy=Math.max(0,Math.floor(vy0/CVCH));cy<=Math.min(Math.ceil(CVH/CVCH)-1,Math.floor(vy1/CVCH));cy++)for(let cx=Math.max(0,Math.floor(vx0/CVCH));cx<=Math.min(Math.ceil(CVW/CVCH)-1,Math.floor(vx1/CVCH));cx++)ctx.drawImage(cvChunk(cx,cy,now),cx*n-p,(cy*CVCH+CVOY)*TS-p,n+p*2,n+p*2)}
  cvWaterFlow(now);cvWaterDraw(now);cvReflect(now);
  /* 物・せいれい・コワイノを、足もとの順に（地面の物は先に） */
  const L=[],FL='SRkh12q!^';for(const[j,o]of C.ob){if(!C.seen[j]&&!(o.k==='g'&&cvLureOn(j)))continue;L.push([FL.includes(o.k)&&!(o.k==='!'&&o.fall)?-1:cvY(j)+CVOY+.9,()=>cvDrawObj(j,o,now)])}
  for(const d of C.deco||[])if(C.seen[d.j])L.push([cvY(d.j)+CVOY+.2+(d.dy||0)/TS,()=>cvDrawDeco(d,now)]);
  for(const a of C.party)L.push([a.y,()=>cvDrawActor(a,now)]);
  for(const e of C.en){if(e.dead||!C.seen[cvCell(e)])continue;L.push([e.y,()=>{if(e.asleep){const s=e.stun;e.stun=1;drawEnemy(e,now);e.stun=s;const z=EN[e.type].size,t=(now/900)%1;ctx.globalAlpha=1-t;P4('#e8e0f4',e.x*TS+8,e.y*TS-30*z-t*8,4,1);P4('#e8e0f4',e.x*TS+10,e.y*TS-29*z-t*8,2,1);P4('#e8e0f4',e.x*TS+8,e.y*TS-28*z-t*8,4,1);ctx.globalAlpha=1}else drawEnemy(e,now)}])}
  L.sort((p,q)=>p[0]-q[0]);for(const d of L)d[1]();
  EVAP=EVAP.filter(it=>now-it.t0<(it.dur||1800)+600+(it.die?KO_HOLD:0));for(const it of EVAP)drawEvap(it,now);
  /* 岩をおせる向き */
  if(C.sel&&C.sel.k==='b'){const sj=C.sel.j,p=Math.sin(now/180)*2;for(const d of cvPushDirs(sj)){const dx=cvX(d.t)-cvX(sj),dy=cvY(d.t)-cvY(sj),cx=cvX(d.t)*TS+16+dx*p,cy=(cvY(d.t)+CVOY)*TS+16+dy*p;for(let i=0;i<5;i++){const w=(4-i)*2+2;if(dx)P4(i%2?'#ffe08a':'#fff3c4',cx-dx*6+dx*i*3-1,cy-w/2,3,w);else P4(i%2?'#ffe08a':'#fff3c4',cx-w/2,cy-dy*6+dy*i*3-1,w,3)}}
    const bx=cvX(sj)*TS,by=(cvY(sj)+CVOY)*TS;for(let i=0;i<4;i++){P4('#fff3c4',bx+i*10,by,5,1);P4('#fff3c4',bx+i*10,by+31,5,1);P4('#fff3c4',bx,by+i*10,1,5);P4('#fff3c4',bx+31,by+i*10,1,5)}}
  if(C.sel&&C.sel.k==='m'){const bx=cvX(C.sel.j)*TS,by=(cvY(C.sel.j)+CVOY)*TS;for(let i=0;i<4;i++){P4('#e6f4ec',bx+i*10,by-8,5,1);P4('#e6f4ec',bx+i*10,by+31,5,1);P4('#e6f4ec',bx,by-8+i*10,1,5);P4('#e6f4ec',bx+31,by-8+i*10,1,5)}}
  /* 風 */
  if(C.gust){const G=C.gust,d=Math.min(G.n,(now-G.t0)/1000*CVGUST);for(let i=0;i<6;i++){const q=d-i*.35;if(q<0)continue;const wob=Math.sin(now/60+i*2)*4;P4(i%2?'#e6f4ec':'#a9c8b6',(G.x+G.dx*q)*TS+(G.dy?wob:0)-2,(G.y+CVOY+G.dy*q)*TS+(G.dx?wob:0)-6,G.dx?7:2,G.dx?2:7)}}
  /* 光のつぶ（ひらいた・あけたとき） */
  C.sparks=C.sparks.filter(s=>now-s.t0<700);for(const s of C.sparks){const t=(now-s.t0)/1000;ctx.globalAlpha=1-t/.7;P4(s.col,(s.x+s.vx*t)*TS-1,(s.y+CVOY+s.vy*t+2.2*t*t)*TS-1,2,2)}ctx.globalAlpha=1;
  cvMistDraw(now);
  /* 暗さ：光のとどく所だけ明るい。まだ見ていない所は、まっくら */
  {const D=C.dk;if(D.width!==cv.width||D.height!==cv.height){D.width=cv.width;D.height=cv.height}const g=D.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,D.width,D.height);g.fillStyle='rgba(4,7,16,'+CVDARK+')';g.fillRect(0,0,D.width,D.height);
    g.globalCompositeOperation='destination-out';const LS=lightSpr(150),sx=x=>x*TS*k-CX,sy=y=>y*TS*k-CY,cut=(x,y,R)=>{const r=R*TS*k;g.drawImage(LS,sx(x)-r,sy(y)-r,r*2,r*2)},LR=(C.dim?CVLIGHTD:CVLIGHT)*(1+.03*Math.sin(now/900)+.015*Math.sin(now/370));/* 光は、ゆっくりゆらぐ */
    for(const a of C.party){cut(a.x,a.y-.4,LR);cut(a.x,a.y-.4,LR*.6)}
    for(const[j,o]of C.ob){if(!C.seen[j])continue;if(o.k==='S'||o.k==='R')cut(cvX(j)+.5,cvY(j)+CVOY+.5,2.2);else if(o.k==='t'&&o.until>C.t)cut(cvX(j)+.5,cvY(j)+CVOY+.2,3+.12*Math.sin(now/130+j))
      else if(o.k==='g'){g.globalAlpha=.75+.2*Math.sin(now/700+j);cut(cvX(j)+.5,cvY(j)+CVOY+.6,CVGLOW);g.globalAlpha=1}}
    for(let j=0;j<CVW*CVH;j++)if(C.wt[j]&&C.seen[j]&&(cvX(j)+cvY(j))%2===0){g.globalAlpha=.5+.08*Math.sin(now/1300+j);cut(cvX(j)+.5,cvY(j)+CVOY+.5,1.9);g.globalAlpha=1}/* 地底の水は、まわりを照らす（ゆっくり明るさがゆれる） */
    for(const d of C.deco||[])if(C.seen[d.j]&&(d.k==='crys'||d.k==='shroom')){/* 暗さをけずるのは、大きな光る物だけ（つた・こけ・草は、色の光だけ。まわりは暗いまま） */g.globalAlpha=.7+.15*Math.sin(now/900+d.j);cut(cvX(d.j)+.5,cvY(d.j)+CVOY+.3,d.k==='crys'?2.2:d.k==='shroom'?1.8:1.3);g.globalAlpha=1}
    for(const j of cvShafts())if(C.seen[j]){g.globalAlpha=.25;cut(cvX(j)+.2,cvY(j)+CVOY+.2,1.2);g.globalAlpha=1}/* 光のすじの下は、少し明るい */
    for(const j of C.ore)if(C.seen[j+CVW]){g.globalAlpha=.6+.15*Math.sin(now/900+j);cut(cvX(j)+.5,cvY(j)+CVOY+.7,CVOREGLOW);g.globalAlpha=1}
    if(C.flash){const t=(now-C.flash.t0)/900;if(t>=1)C.flash=null;else{g.globalAlpha=1-t;cut(C.flash.x,C.flash.y+CVOY,5);g.globalAlpha=1}}
    g.globalCompositeOperation='source-over';/* まだ見ていない所：マスごとの丸（半径 .74 マス）をかさねた形を、なめらかにのばしてぬる（四角い角を出さない） */
    {const Z=8,n=C.seen.reduce((a,b)=>a+b,0);let fc=C.fogc;if(!fc){fc=C.fogc=document.createElement('canvas');fc.width=CVW*Z;fc.height=CVH*Z;fc.n=-1}
      if(fc.n!==n){fc.n=n;const q=fc.getContext('2d');q.clearRect(0,0,fc.width,fc.height);q.fillStyle='#1a1511';for(let y=0;y<CVH;y++)for(let x=0;x<CVW;x++)if(!C.seen[cvJ(x,y)]){q.beginPath();q.arc((x+.5)*Z,(y+.5)*Z,.74*Z,0,6.284);q.fill()}}
      g.imageSmoothingEnabled=true;g.drawImage(fc,sx(0),sy(CVOY),CVW*TS*k,CVH*TS*k);g.imageSmoothingEnabled=false}
    /* まだ見ていない所でも、近くの光るきのこ・鉱石は、ぼんやり見える */
    g.globalCompositeOperation='destination-out';g.globalAlpha=.7;for(const[j,o]of C.ob)if(o.k==='g'&&!C.seen[j]&&cvLureOn(j))cut(cvX(j)+.5,cvY(j)+CVOY+.6,.8);for(const j of C.ore)if(!C.seen[j+CVW]&&cvLureOn(j))cut(cvX(j)+.5,cvY(j)+CVOY+.7,.6);g.globalAlpha=1;g.globalCompositeOperation='source-over';
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(D,0,0);ctx.restore()}
  cvGlowDraw(now);cvAirDraw(now);
  drawTopFx();drawBattleFx(now);
  if(C.mark){const t=(now-C.mark.t0)/450;if(t>=1)C.mark=null;else{ctx.globalAlpha=1-t;const cx=C.mark.x*TS,cy=(C.mark.y+CVOY)*TS+(C.mark.foe?0:4),r=6+t*8,col=C.mark.foe?'#ff9aa8':'#fff3c4';for(let i=0;i<8;i++){const an=i/8*6.283;P4(col,cx+Math.cos(an)*r-1,cy+Math.sin(an)*r*.5-1,2,2)}ctx.globalAlpha=1}}
  ctx.imageSmoothingEnabled=sm}
