(()=>{
'use strict';
/* Web版：同じ端末・ブラウザに保存。書き込み失敗を利用者に伝える。 */
const KV=(()=>{
  const memory=Object.create(null);let available=false,lastSaved=0;
  try{localStorage.setItem('__hakoniwa_test','1');localStorage.removeItem('__hakoniwa_test');available=true}catch(e){}
  return {
    getItem(k){if(Object.hasOwn(memory,k))return memory[k];try{return localStorage.getItem(k)}catch(e){return null}},
    setItem(k,v){v=String(v);memory[k]=v;try{localStorage.setItem(k,v);available=true;if(/^hakoniwa-(w\d|free-v)/.test(k))lastSaved=Date.now();return true}catch(e){available=false;return false}},
    removeItem(k){delete memory[k];try{localStorage.removeItem(k);return true}catch(e){available=false;return false}},
    push(){},onCloud(){},ready:()=>true,status:()=>({available,lastSaved})
  };
})();
const W=108,H=108,TS=32,CX=54,CY=54,OW=72,OFF=18;/* マップは108×108マス。まん中の72×72（OFF=18マス内がわ）が、前からの土地。コワイノ・種などは、この中から来る */
const SP=n=>'パワー'+n;
let VILL=new Uint8Array(0);/* 村（家・置いた物のまわり3マス）。夜ににげる・見まわる所。recount で作る */
const MIN_PER_SEC=2.5;         // 1倍速: 1秒 = ゲーム内2.5分
const FREE=6;/* フリーモードのステージ番号 */
const SAVE_KEYS=['hakoniwa-w1-v8','hakoniwa-w2-v1'];SAVE_KEYS[FREE]='hakoniwa-free-v1';/* ステージごとに別のセーブ */
let WD=0;/* いまのステージ */
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];let TESTM=(()=>{try{return localStorage.getItem('hk-test')==='1'}catch(_){return false}})();
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
function hash(i){i=(i^61)^(i>>>16);i=i+(i<<3);i=i^(i>>>4);i=Math.imul(i,0x27d4eb2d);i=i^(i>>>15);return (i>>>0)/4294967296}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- 属性 ---------- */
const ELEM={
  wood:{name:'木',col:'#5fbf4f',body:'#8fdc7a',can:'畑の収穫+1・畑の世話・花を植える・木の家具づくり'},
  water:{name:'水',col:'#3f9ee8',body:'#7cc7ff',can:'作業の速さ1.3倍・スタミナ0.7倍・水やり・つり・水の家具づくり'},
  fire:{name:'火',col:'#ff6a3d',body:'#ff9f5a',can:'「コワイノ」に立ち向かう・夜の見回り・料理・火の家具づくり'},
  earth:{name:'土',col:'#b8863b',body:'#e6c07a',can:'作業の速さ0.75倍・スタミナ1.45倍・畑を耕す・柵を直す・土の家具づくり'},
  wind:{name:'風',col:'#3fc0a0',body:'#c9f2e6',can:'歩く速さ1.45倍・たのしさ60より下で遊びに行く（ほかの子は30）・風の家具づくり'},
};
const ELEM_KEYS=Object.keys(ELEM);

/* ---------- もの ---------- */
// kind: block・plant=おそなえ/カミサマとの交換でおそなえ箱に入る / furn=依頼ボードでせいれいが作る / build=せいれいが建てる（パワー）
const BL={
  path:{name:'あぜ道',kind:'block',floor:1,lv:2,cost:1,pc:2,time:30,maker:'earth',qty:10,mat:{stone:2},attr:{earth:.25},desc:'草地のあいだを通る土の道。歩く速さ×1.25'},
  bridge:{name:'木の橋',kind:'build',lv:5,pc:2,time:40,maker:'wood',mat:{wood:4},desc:'川や池の上にかける。せいれいが建てる。歩いてわたれる'},
  ladder_wood:{name:'オークのハシゴ',kind:'build',lv:3,pc:2,time:30,maker:'wood',mat:{wood:2},desc:'段差のがけに立てかける。せいれいが建てる。上り下りできる（歩く速さ×0.5）'},
  ladder_bamboo:{name:'竹のハシゴ',kind:'build',lv:3,w:1,pc:2,time:30,maker:'wood',mat:{bamboo:2},desc:'段差のがけに立てかける。せいれいが建てる。上り下りできる（歩く速さ×0.5）'},
  stairs_wood:{name:'木の階段',kind:'build',lv:8,pc:3,time:50,maker:'wood',mat:{wood:3},attr:{wood:.3},desc:'段差の下に置く。せいれいが建てる。段差を飛ばずに上り下りできる（1マス歩く時間。飛ぶと3倍）'},
  stairs_brick:{name:'レンガの階段',kind:'build',lv:6,w:1,pc:5,time:60,maker:'fire',mat:{stone:6},attr:{fire:.5},desc:'段差の下に置く。せいれいが建てる。段差を飛ばずに上り下りできる（1マス歩く時間。飛ぶと3倍）'},
  stairs_stone:{name:'石の階段',kind:'build',lv:4,w:1,pc:4,time:60,maker:'earth',mat:{stone:5},attr:{earth:.5},desc:'段差の下に置く。せいれいが建てる。段差を飛ばずに上り下りできる（1マス歩く時間。飛ぶと3倍）'},
  slope_earth:{name:'土の坂',kind:'build',lv:4,pc:3,time:40,maker:'earth',mat:{stone:3},attr:{earth:.25},desc:'段差の下に置く。せいれいが建てる。段差を飛ばずに上り下りできる（1マス歩く時間。飛ぶと3倍）'},
  woodpath:{name:'木の道',kind:'block',floor:1,cost:2,pc:4,time:40,maker:'wood',qty:10,lv:7,mat:{wood:6},attr:{wood:.75},desc:'木の板をしいた道。歩く速さ×1.55'},
  gravel:{name:'砂利道',kind:'block',floor:1,cost:1,pc:3,time:30,maker:'earth',qty:10,lv:5,mat:{stone:3},attr:{earth:.4},desc:'小石をしいた道。歩く速さ×1.4'},
  brick:{name:'レンガ道',kind:'block',floor:1,cost:3,pc:5,time:50,maker:'fire',qty:10,lv:6,w:1,mat:{stone:8},attr:{fire:.4,earth:.3},desc:'レンガをしきつめた道。歩く速さ×1.75'},
  floor:{name:'フローリング',kind:'block',floor:1,lv:4,cost:1,pc:2,time:30,maker:'wood',qty:10,mat:{wood:2},attr:{wood:.5},desc:'木目のそろった板の床。歩く速さ×1.15'},
  brickfloor:{name:'レンガ床',kind:'block',floor:1,lv:8,cost:3,pc:5,time:50,maker:'fire',qty:10,mat:{stone:3},attr:{fire:.4,earth:.3},desc:'レンガをしきつめた家の床。歩く速さ×1.15'},
  stonefloor:{name:'石の床',kind:'block',floor:1,lv:6,cost:2,pc:4,time:40,maker:'earth',qty:10,mat:{stone:3},attr:{earth:.5},desc:'石をしきつめた家の床。歩く速さ×1.15'},
  herrfloor:{name:'ヘリンボーンの床',kind:'block',floor:1,lv:1,cost:2,pc:4,time:45,maker:'wood',qty:10,mat:{wood:3},attr:{wood:.5},kwr:1,desc:'ダークチェリーの板を、山がたにしきつめた床。歩く速さ×1.15'},/* コワイノのレシピ */
  carpet:{name:'じゅうたん',kind:'block',floor:1,lv:9,cost:2,pc:3,time:35,maker:'wind',qty:10,mat:{wood:2},attr:{wind:.5},desc:'やわらかな織り模様の床。歩く速さ×1'},
  stone:{name:'石畳',kind:'block',floor:1,cost:2,pc:4,time:40,maker:'earth',qty:10,lv:4,w:1,mat:{stone:6},attr:{earth:.75},desc:'しっかりした石の床。歩く速さ×1.55'},
  farm:{name:'畑',kind:'block',cost:4,dyn:1,attr:{},desc:'置くとせいれいが耕して種をまく。水やりすると育つ。こむぎ・キャベツは2日で食料+1、いもは3日で食料+2'},
  fence:{name:'柵',fix:2,fixm:{wood:1,funba:1},kind:'block',cost:2,pc:4,time:60,maker:'wood',qty:10,solid:1,hp:20,hpS:23,attr:{},mat:{wood:2},desc:'「コワイノ」の足止め（じょうぶさ20）'},
  logfence:{name:'丸太の柵',fix:3,fixm:{wood:2},kind:'block',cost:3,pc:6,time:70,maker:'wood',qty:10,lv:3,offerOnly:1,solid:1,brk:1,hp:28,hpS:32,attr:{},mat:{wood:3},desc:'太い丸太を組んだ柵（じょうぶさ28）'},
  bamboofence:{name:'竹の柵',fix:3,fixm:{bamboo:3},kind:'block',cost:3,pc:7,time:75,maker:'wood',qty:10,lv:4,offerOnly:1,solid:1,brk:1,hp:32,hpS:36,attr:{},mat:{bamboo:5},desc:'竹を組んだ柵（じょうぶさ32）'},
  hwall:{name:'オークの壁',fix:3,fixm:{wood:2},kind:'block',cost:2,pc:6,time:60,maker:'wood',qty:10,lv:3,solid:1,hp:30,hpS:34,attr:{},mat:{wood:3},desc:'かこってドアをつけると家になる（じょうぶさ30）'},
  logwall:{name:'丸太の壁',fix:4,fixm:{wood:5},kind:'block',cost:3,pc:9,time:80,maker:'wood',qty:10,lv:7,solid:1,hp:40,hpS:46,brk:1,attr:{},mat:{wood:9},desc:'丸太を組んだ家の壁（じょうぶさ40）'},
  plasterwall:{name:'しっくいの壁',fix:5,fixm:{wood:3,stone:2},kind:'block',cost:4,pc:11,time:90,maker:'earth',qty:10,lv:5,solid:1,hp:48,hpS:55,brk:1,attr:{},mat:{wood:6,stone:3},desc:'明るいしっくい仕上げの家の壁（じょうぶさ48）'},
  brickwall:{name:'レンガの壁',fix:6,fixm:{stone:7},kind:'block',cost:5,pc:13,time:100,maker:'fire',qty:10,lv:8,solid:1,hp:55,hpS:63,brk:1,attr:{},mat:{stone:14},desc:'レンガを積んだ家の壁（じょうぶさ55）'},
  wall:{name:'石の塀',fix:6,fixm:{stone:5},kind:'block',cost:5,pc:12,time:100,maker:'earth',qty:10,lv:6,w:1,solid:1,hp:45,hpS:51,attr:{},mat:{stone:9},desc:'石を積んだ塀。家の壁にはならない（じょうぶさ45）'},
  clover:{sp:9,name:'シロツメクサ',item:'シロツメクサの種',kind:'plant',cost:3,attr:{wood:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  bellf:{sp:9,name:'ききょう',item:'ききょうの種',kind:'plant',cost:3,attr:{earth:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  salvia:{sp:9,name:'サルビア',item:'サルビアの種',kind:'plant',cost:3,attr:{fire:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  lily:{sp:9,name:'ゆり',item:'ゆりの種',kind:'plant',cost:3,attr:{wind:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  lotus:{sp:9,name:'ハス',item:'ハスの種',kind:'plant',cost:3,attr:{water:1},desc:'池の上にだけ植えられる。まわり2マスで水浴びすると、たのしさ×1.5 / つかれ −9／1時間'},
  tree:{hp:5,brk:1,fix:1,fixm:{},name:'木',item:'木の苗',kind:'plant',cost:4,lv:3,solid:1,env:1,attr:{wood:3},desc:'まわり3マスを緑にする。まわり3マスで、たのしさ+0.4／1時間'},
  fruit:{hp:5,brk:1,fix:1,fixm:{},name:'果物の木',item:'果物の苗',kind:'plant',cost:10,lv:6,solid:1,dyn:1,env:1,attr:{wood:3,water:1},desc:'まわり3マスを緑にする。まわり3マスで、たのしさ+0.4／1時間。4日ごとに、りんごが実る（収穫すると食料+2）'},
/* 新しい家具（スクリプトで描く） */
  stool:{name:'木のスツール',kind:'furn',lv:1,cat:'living',f2:1,pc:1,time:60,maker:'wood',attr:{wood:1},mat:{wood:2},mat1:{bamboo:2},desc:'小さないす。食卓の隣に置くと、ここで食べたときにパワー+0.45。住み心地+2'},
  stable:{hp:5,brk:1,fix:2,fixm:{wood:2},dw:1,name:'まるいサイドテーブル',kind:'furn',cat:'living',f2:1,lv:4,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:3},solid:1,desc:'お花とカップをのせた小さなテーブル。住み心地+4'},
  pouf:{name:'まるクッション',kind:'furn',lv:5,cat:'living',f2:1,pc:1,time:60,maker:'wind',attr:{wind:1},mat:{wood:1,kasa:3},mat1:{wood:1,chiri:3},desc:'ころんとしたクッション。食卓のとなりに置く。ここで食べると、パワー+1.35。住み心地+3'},
  achair:{name:'ひじかけいす',kind:'furn',lv:9,cat:'living',f2:1,pc:5,time:100,maker:'wood',attr:{wood:1},mat:{wood:10},desc:'ゆったりすわれるいす。食卓の隣に置くと、ここで食べたときにパワー+2.25。住み心地+5'},
  ltable:{hp:5,brk:1,fix:3,fixm:{wood:3},dw:1.5,name:'ローテーブル',kind:'furn',cat:'living',f2:1,lv:5,pc:5,time:100,maker:'wood',attr:{wood:1},mat:{wood:6},solid:1,desc:'ひくいテーブル。住み心地+5'},
  rug1:{cs:1.5,sz:[2,2],dw:1.25,name:'ひしがたラグ',kind:'furn',cat:'living',f2:1,lv:6,pc:3,time:80,maker:'wind',attr:{wind:1},mat:{wood:5},desc:'床にしくラグ。住み心地+5',anim:1},
  sofa1:{hp:5,brk:1,fix:5,fixm:{wood:10},dw:2.5,offerOnly:1,name:'ひとりがけソファ',kind:'furn',cat:'living',f2:1,lv:6,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'しずみこむソファ。住み心地+6'},
  hoshirug:{cs:1.5,sz:[2,2],dw:1.25,name:'ほしぞらのラグ',kind:'furn',cat:'living',f2:1,lv:1,pc:3,time:80,maker:'wind',attr:{wind:1},mat:{wood:5},kwr:1,desc:'夜空の色のラグ。住み心地+5',anim:1},/* コワイノのレシピ */
  rug2:{offerOnly:1,cs:1.5,sz:[2,2],dw:1.75,name:'くもラグ',kind:'furn',cat:'living',f2:1,lv:7,pc:5,time:100,maker:'wind',attr:{wind:1},mat:{wood:15},desc:'くもの形のラグ。住み心地+6',anim:1},
  tub:{hp:5,brk:1,fix:2,fixm:{wood:1,funba:1},name:'水おけ',kind:'furn',cat:'cook',f2:1,lv:3,pc:3,time:80,maker:'water',attr:{water:1},mat:{wood:3},solid:1,desc:'調理：かまどのそば（3マス）にあると、料理の時間-10%。住み心地+3'},
  sink:{hp:5,brk:1,fix:4,fixm:{stone:3},name:'流し台',kind:'furn',cat:'cook',f2:1,lv:4,pc:7,time:120,maker:'water',attr:{water:1},mat:{stone:5},solid:1,desc:'調理：かまどのそば（3マス）にあると、料理の時間-10%。住み心地+4'},
  crate:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'木箱',kind:'furn',cat:'other',f2:1,lv:2,pc:3,time:80,maker:'earth',attr:{earth:1},mat:{wood:8},solid:1,desc:'食料を30・素材を30までしまえる。住み心地+6'},
  monstera:{hp:5,brk:1,fix:2,fixm:{funba:3,stone:2},name:'かんようしょくぶつ',kind:'furn',cat:'other',f2:1,lv:4,pc:4,time:80,maker:'wood',attr:{wood:1},mat:{shina:5,stone:3},mat1:{kuru:5,stone:3},solid:1,desc:'大きな葉の鉢植え。住み心地+10'},
  shelf1:{hp:5,brk:1,fix:5,fixm:{wood:10},name:'本棚',kind:'furn',cat:'other',f2:1,lv:6,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'本と植物の棚。住み心地+12。木材・石材を合わせて50までしまえる'},
  wreath:{hp:5,brk:1,fix:2,fixm:{eda:3,funba:3},offerOnly:1,name:'リース',kind:'furn',cat:'other',f2:1,lv:6,pc:4,time:80,maker:'wood',attr:{wood:1},mat:{eda:6,shina:6},mat1:{eda:6,kuru:6},solid:1,desc:'葉と花のリース。住み心地+10'},
  curtain1:{hp:5,brk:1,fix:3,fixm:{wood:8},name:'カーテン',kind:'furn',cat:'other',f2:1,lv:9,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:10,kasa:5},mat1:{wood:10,chiri:5},solid:1,desc:'家の上がわの壁の窓にかける。やわらかい光が入る。住み心地+10'},
  cabinet:{hp:5,brk:1,fix:5,fixm:{wood:10},offerOnly:1,name:'キャビネット',kind:'furn',cat:'other',f2:1,lv:7,pc:9,time:120,maker:'earth',attr:{earth:1},mat:{wood:20},solid:1,desc:'とびらつきの棚。住み心地+12。食料を30までしまえる'},
  paint2:{hp:5,brk:1,fix:3,fixm:{wood:8},name:'葉っぱの額',kind:'furn',cat:'other',f2:1,lv:7,pc:5,time:80,maker:'wood',attr:{wood:1},mat:{wood:15},solid:1,desc:'葉っぱの絵。横向きの家の壁にかける。住み心地+10'},
  shelf2:{hp:5,brk:1,fix:6,fixm:{wood:15,stone:4},offerOnly:1,name:'かざり棚',kind:'furn',cat:'other',f2:1,lv:8,pc:11,time:140,maker:'wood',attr:{wood:1},mat:{wood:30,stone:8},solid:1,desc:'小物をかざる棚。住み心地+13。木材・石材を合わせて50までしまえる'},
  curtain2:{hp:5,brk:1,fix:3,fixm:{wood:13},offerOnly:1,name:'カーテン（緑）',kind:'furn',cat:'other',f2:1,lv:8,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:25},solid:1,desc:'森の色のカーテン。家の上がわの壁の窓にかける。住み心地+10'},
  paint3:{hp:5,brk:1,fix:3,fixm:{wood:13},offerOnly:1,name:'花の額',kind:'furn',cat:'other',f2:1,lv:8,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:25},solid:1,desc:'花の絵。横向きの家の壁にかける。住み心地+10'},
  wshelf:{hp:5,brk:1,fix:4,fixm:{wood:10},name:'かべ棚',kind:'furn',cat:'other',f2:1,lv:8,pc:7,time:100,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'横向きの家の壁にかける。つる草をたらした棚。住み心地+12。木材・石材を合わせて50までしまえる'},
  paint1:{hp:5,brk:1,fix:5,fixm:{wood:15},offerOnly:1,name:'風景画',kind:'furn',cat:'other',f2:1,lv:9,pc:9,time:120,maker:'water',attr:{water:1},mat:{wood:30},solid:1,desc:'草原の絵。横向きの家の壁にかける。住み心地+14'},
  bathtub:{hp:5,brk:1,fix:8,fixm:{wood:8,stone:15},offerOnly:1,name:'バスタブ',kind:'furn',cat:'other',f2:1,lv:9,pc:15,time:180,maker:'water',attr:{water:1},mat:{wood:15,stone:30},solid:1,desc:'家でもお風呂。夕方、ここで水浴びできる。住み心地+16'},
  candle:{hp:5,brk:1,fix:1,fixm:{wood:1},offerOnly:1,name:'ろうそく',kind:'furn',cat:'light',f2:1,lv:5,pc:1,time:60,maker:'fire',attr:{fire:1},mat:{wood:2},solid:1,desc:'あかり。住み心地+3'},
  lantern:{hp:5,brk:1,fix:2,fixm:{wood:1,can:1},name:'ランタン',kind:'furn',cat:'light',f2:1,lv:6,pc:3,time:80,maker:'fire',attr:{fire:1},mat:{wood:2,can:2},solid:1,desc:'あかり。住み心地+5'},
  flamp:{hp:5,brk:1,fix:4,fixm:{wood:2,stone:1},offerOnly:1,name:'フロアランプ',kind:'furn',cat:'light',f2:1,lv:6,pc:7,time:100,maker:'fire',attr:{fire:1},mat:{wood:3,stone:2},solid:1,desc:'あかり。住み心地+6'},
  mimamori:{name:'みまもりのぬいぐるみ',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'家の中に置くと、その家で寝た子の、つかれのとれる速さ1.1倍。住み心地+6'},/* ここから、コワイノの落とし物だけで手に入る家具（絵はあとで） */
  yomawari:{name:'よまわりのランタン',kind:'furn',cat:'light',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'まわり3.5マスを照らす。住み心地+6'},
  oyasumi:{name:'おやすみのベル',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'ドアのとなりにかざるベル。住み心地+8'},
  yonaka:{name:'よなかのうたの絵',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'夜の歌の絵。横向きの家の壁にかける。住み心地+10'},
  toro:{hp:5,brk:1,fix:3,fixm:{stone:3},name:'しずけさの石どうろう',kind:'furn',cat:'light',f2:1,lv:1,pc:5,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{stone:8},sand:3,desc:'まわり3.5マスを照らす。照らした中のコワイノは、攻撃と移動の速さ0.75倍（ふつうの灯りは0.8倍）。住み心地+6'},/* やすらぎの砂で作る */
  signpost:{hp:5,brk:1,fix:1,fixm:{wood:5},name:'道しるべ',kind:'furn',cat:'env',f2:1,lv:5,pc:1,time:60,maker:'earth',attr:{earth:1},mat:{wood:9},solid:1,desc:'まわり3マスで、せいれいがにげる速さ×1.4'},
  hedge:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'生垣',kind:'furn',cat:'env',f2:1,lv:5,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:2,funba:5},solid:1,env:2,er:2,desc:'まわり2マスで、たのしさ+0.7／1時間'},
  birdbath:{hp:5,brk:1,fix:3,fixm:{stone:8},offerOnly:1,name:'水飲み鳥',kind:'furn',cat:'env',f2:1,lv:7,pc:5,time:100,maker:'water',attr:{water:1},mat:{stone:15},solid:1,env:3,desc:'まわり3マスで、たのしさ+1.1／1時間'},
  noren:{hp:5,brk:1,fix:3,fixm:{wood:4,funba:2},name:'のれん',anim:1,dsc:2,kind:'furn',cat:'env',f2:1,lv:5,pc:7,time:100,maker:'fire',attr:{fire:1},mat:{wood:8,funba:4},solid:1,env:7,er:1,desc:'温泉の入り口にかける布。まわり1マスで、たのしさ+2.5／1時間'},
  parasol:{hp:5,brk:1,fix:4,fixm:{wood:4,funba:2},name:'パラソル',anim:1,dsc:2,kind:'furn',cat:'env',f2:1,lv:5,pc:7,time:100,maker:'wind',attr:{wind:1},mat:{wood:8,funba:4},solid:1,env:7,er:1,desc:'まわり1マスで、たのしさ+2.5／1時間（ほかのパラソルとかさならない）'},
  gazebo:{name:'ガゼボ',sz:[2,2],kind:'furn',cat:'env',lv:5,pc:8,time:120,maker:'wood',attr:{wood:2,wind:1},mat:{wood:18,stone:4},desc:'屋根のある休み場所。下に、いす・テーブル・ベンチ・ラグ・花を置ける'},
  azumaya:{name:'東屋',sz:[2,2],kind:'furn',cat:'env',lv:5,pc:8,time:120,maker:'earth',attr:{earth:2,fire:1},mat:{wood:18,stone:6},desc:'屋根のある休み場所。下に、いす・テーブル・ベンチ・ラグ・花を置ける'},
  arch:{offerOnly:1,anim:1,dsc:1.8,name:'ガーデンアーチ',kind:'furn',cat:'env',f2:1,lv:8,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:30},env:4,desc:'まわり3マスで、たのしさ+1.4／1時間'},
  slide:{name:'すべり台',sz:[2,2],kind:'furn',cat:'toy',f2:1,lv:2,pc:9,time:140,maker:'wind',attr:{wind:1},mat:{wood:8,stone:3},play:{pt:3,pw:1.35,fun:35,dur:40,cap:1,adj:1},solid:1,desc:'1人で遊べる。たのしさ +35（40分）。遊ぶと10%の確率で、移動速度+1'},
  sandbox:{name:'砂場',sz:[2,1],nosc:1,kind:'furn',cat:'toy',f2:1,lv:5,pc:9,time:140,maker:'earth',attr:{earth:1},mat:{wood:11,stone:11},play:{pt:3,pw:1.35,fun:30,dur:45,cap:2,adj:1},solid:1,desc:'2人まで遊べる。たのしさ +30（45分）。遊ぶと10%の確率で、スタミナ+1'},
  seesaw:{hp:5,brk:1,fix:6,fixm:{wood:13},name:'シーソー',kind:'furn',cat:'toy',f2:1,anim:1,dsc:2,lv:7,pc:11,time:160,maker:'wind',attr:{wind:1},mat:{wood:25},play:{pt:4,pw:1.8,fun:40,dur:40,cap:2,adj:1},solid:1,desc:'2人で遊べる。たのしさ +40（40分）。遊ぶと10%の確率で、作業スピード+1'},
  window:{name:'窓',kind:'block',cat:'other',lv:4,pc:3,time:50,maker:'wood',attr:{wood:1},mat:{wood:2},desc:'横向きの家の壁にはめる。住み心地+5（1つの家で2つまで。3つ目からは+2.5）'},
  sdoor:{name:'石の塀のドア',fix:4,fixm:{stone:3},kind:'block',anim:1,hp:30,hpS:34,cost:4,pc:8,time:60,maker:'earth',qty:1,lv:6,w:1,attr:{},mat:{stone:6},desc:'石の塀の出入り口。せいれいだけ通れる（じょうぶさ30）'},
  table:{hp:5,brk:1,fix:4,fixm:{wood:4},name:'食卓',kind:'furn',pc:7,time:90,maker:'wood',solid:1,eat:{cap:2,pt:2,pw:.9},attr:{wood:2},mat:{wood:8},desc:'2人まで食べられる。食べるたびにパワー+0.9。住み心地+8'},
  stor:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'食料箱',kind:'furn',pc:3,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{wood:5},desc:'食料を30までしまえる。ここから食べる。住み心地+3'},
  mbox:{hp:5,brk:1,fix:2,fixm:{wood:2,stone:2},name:'素材箱',kind:'furn',pc:3,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{wood:3,stone:3},desc:'木材・石材を50までしまえる。住み心地+3'},
  lumber:{hp:5,brk:1,fix:8,fixm:{wood:13,stone:4},name:'伐採場',kind:'build',mat:{wood:25,stone:8},pc:15,time:120,maker:'wood',lv:5,solid:1,attr:{wood:2},desc:'せいれいがここで働くと、20分ごとに木材+1'},
  quarry:{hp:5,brk:1,fix:10,fixm:{wood:8,stone:13},name:'採石場',kind:'build',mat:{wood:15,stone:25},pc:20,time:140,maker:'earth',lv:7,solid:1,attr:{earth:2},desc:'せいれいがここで働くと、20分ごとに石材+1'},
  oven:{hp:5,brk:1,fix:3,fixm:{wood:2,stone:4},name:'かまど',kind:'furn',anim:1,pc:5,time:160,maker:'fire',solid:1,attr:{fire:2,earth:1},mat:{wood:3,stone:8},desc:'せいれいが材料から料理を作る。住み心地+6'},
  grave:{name:'お墓',kind:'deco',attr:{},desc:''},
  gate:{name:'柵のドア',fix:2,fixm:{wood:1,funba:1},kind:'block',anim:1,hp:13,hpS:14,cost:2,pc:4,time:40,maker:'wood',qty:1,lv:2,attr:{},mat:{wood:2},desc:'柵の出入り口。せいれいだけ通れる（じょうぶさ13）'},
  archedgate:{name:'アーチ門',fix:4,fixm:{wood:3},kind:'block',anim:1,brk:1,hp:22,hpS:25,cost:4,pc:8,time:70,maker:'wood',qty:1,lv:7,attr:{},mat:{wood:4,shina:3},mat1:{wood:4,kuru:3},desc:'かざりのついた柵の出入り口（じょうぶさ22）'},
  stonegate:{sz:[2,1],name:'石の大門',fix:5,fixm:{stone:3},kind:'block',anim:1,brk:1,hp:35,hpS:40,cost:5,pc:10,time:90,maker:'earth',qty:1,lv:10,attr:{},mat:{stone:5},desc:'石柱で支える大きな柵の出入り口（じょうぶさ35）'},
  yozoradoor:{name:'よぞらのドア',fix:2,fixm:{wood:1},kind:'block',anim:1,hp:20,hpS:23,cost:2,pc:5,time:40,maker:'wood',qty:1,lv:1,attr:{},mat:{wood:3},kwr:1,desc:'窓のついたダークチェリーのドア（じょうぶさ20）'},/* コワイノのレシピ */
  door:{name:'ドア',fix:2,fixm:{wood:1},kind:'block',anim:1,hp:20,hpS:23,cost:2,pc:5,time:40,maker:'wood',qty:1,lv:3,attr:{},mat:{wood:2},desc:'壁にはめる出入り口（じょうぶさ20）'},
  chair:{name:'いす',kind:'furn',lv:3,pc:3,time:60,maker:'wood',attr:{wood:1},mat:{wood:3},mat1:{bamboo:3},desc:'食卓のとなりに置く。ここで食べると、パワー+0.9。住み心地+4'},
  takebench:{name:'竹のベンチ',sz:[2,1],kind:'furn',lv:3,pc:3,time:100,maker:'wood',attr:{wood:1},mat:{bamboo:6},desc:'2人すわれる。昼につかれたら、ここで休む（つかれ −20／1時間）。住み心地+5'},
  takeakari:{hp:5,brk:1,fix:2,fixm:{bamboo:2},name:'竹あかり',kind:'furn',cat:'light',lv:4,pc:4,time:90,maker:'fire',solid:1,anim:1,attr:{fire:1,wood:1},mat:{bamboo:4},desc:'まわり3.5マスを照らす。住み心地+5'},
  shishiodoshi:{hp:5,brk:1,fix:2,fixm:{bamboo:2,stone:1},name:'ししおどし',kind:'furn',cat:'env',lv:5,pc:6,time:110,maker:'water',solid:1,anim:1,attr:{water:1,wood:1},mat:{bamboo:5,stone:3},desc:'水でうごく竹のかざり。住み心地+6'},
  bench:{name:'ベンチ',sz:[2,1],kind:'furn',pc:3,time:100,maker:'wood',attr:{wood:1},mat:{wood:5},desc:'2人すわれる。昼につかれたら、ここで休む（つかれ −20／1時間）。住み心地+5'},
  bed:{name:'ベッド',kind:'furn',pc:10,time:200,maker:'wood',sleep:{cap:1,pt:5,rate:.2},attr:{wood:2},mat:{wood:6,kasa:4},mat1:{wood:6,chiri:4},desc:'1人眠れる。つかれ −12／1時間。家の住み心地で0.6〜3.3倍'},
  yorubed:{name:'よぞらのベッド',kind:'furn',pc:10,time:200,maker:'wood',sleep:{cap:1,pt:5,rate:.2},attr:{wood:2},mat:{wood:8},kwr:1,desc:'夜空の色のふとんのベッド。1人眠れる。つかれ −12／1時間。家の住み心地で0.6〜3.3倍'},/* コワイノのレシピ（落とし物でまれに手に入る）。ふつうのベッドと同じはたらき */
  yozorawall:{name:'よぞらの壁',fix:5,fixm:{wood:3,stone:2},kind:'block',cost:4,pc:11,time:90,maker:'earth',qty:10,lv:1,solid:1,hp:48,hpS:55,brk:1,attr:{},mat:{wood:6,stone:3},kwr:1,desc:'夜空の色の家の壁（じょうぶさ48）'},
  lamp:{hp:5,brk:1,fix:3,fixm:{eda:2,stone:2},name:'かがり火',kind:'furn',pc:5,time:160,maker:'fire',solid:1,anim:1,attr:{fire:3},mat:{eda:3,stone:3},desc:'まわり3.5マスを照らす。住み心地+6'},
  campfire:{hp:5,brk:1,fix:4,fixm:{wood:2,eda:4,stone:4},name:'たき火',kind:'furn',pc:7,time:160,maker:'fire',lv:6,solid:1,anim:1,attr:{fire:4},play:{pt:3,pw:1.35,fun:25,dur:40,cap:3,adj:1},mat:{wood:3,eda:8,stone:8},desc:'3人まで遊べる。たのしさ +25（40分）。まわり3.5マスも照らす。'},
  swing:{name:'ブランコ',sz:[2,1],kind:'furn',pc:9,time:160,maker:'wood',lv:4,play:{pt:4,pw:1.8,fun:40,dur:50,cap:1},attr:{wind:3},mat:{wood:12},mat1:{bamboo:8,wood:4},desc:'1人で遊べる。たのしさ +40（50分）。遊ぶと10%の確率で、移動速度+1'},
  torch:{hp:5,brk:1,fix:1,fixm:{eda:2},name:'たいまつ',kind:'furn',lv:3,pc:1,time:100,maker:'fire',solid:1,anim:1,attr:{fire:2},mat:{eda:3},mat1:{bamboo:3},desc:'まわり3.5マスを照らす。住み心地+4'},
  jar:{hp:5,brk:1,fix:2,fixm:{stone:3},name:'みずがめ',kind:'furn',lv:3,pc:3,time:120,maker:'water',solid:1,attr:{water:3},mat:{stone:5},desc:'水をためたかめ。まわり1マスの畑は水やりなしで育つ。住み心地+5'},
  basin:{hp:5,brk:1,fix:4,fixm:{stone:3},name:'水鉢',kind:'furn',pc:7,time:160,maker:'water',solid:1,anim:1,attr:{water:4,wood:.5},mat:{stone:5},desc:''},/* もう作れない（古いセーブ用） */
  kamizo:{hp:5,brk:1,fix:5,fixm:{stone:13},name:'カミサマの像',kind:'furn',lv:5,pc:10,time:160,maker:'earth',solid:1,attr:{earth:2},mat:{stone:25},desc:'カミサマが遊びにくる確率が2倍（25%→50%）'},
  chochin:{name:'おまつりのちょうちん',kind:'furn',shopOnly:1,pc:6,solid:1,attr:{},desc:'おまつりのおみやげ。赤いちょうちん。住み心地+6'},
  furin:{name:'ふうりん',kind:'furn',shopOnly:1,pc:8,solid:1,anim:1,attr:{},desc:'カミサマのかざり。風がふくと、ちりんと鳴る。住み心地+8'},
  ema:{name:'えまかけ',kind:'furn',shopOnly:1,pc:8,solid:1,attr:{},desc:'カミサマのかざり。ねがいごとを書いた板をかける。住み心地+8'},
  komainu:{name:'こまいぬ',kind:'furn',shopOnly:1,pc:10,solid:1,attr:{},desc:'カミサマのかざり。神殿をまもる石の犬。住み心地+10'},
  kadomatsu:{name:'かどまつ',kind:'furn',shopOnly:1,pc:10,solid:1,attr:{},desc:'カミサマのかざり。竹と松のおめでたいかざり。住み心地+10'},
  rockart:{hp:5,brk:1,fix:1,fixm:{stone:3},name:'つぼ',kind:'furn',lv:2,pc:1,time:100,maker:'earth',solid:1,attr:{earth:2},mat:{stone:5},desc:'土でできたかざり。住み心地+5'},
  vane:{hp:5,brk:1,fix:4,fixm:{wood:2,stone:2},offerOnly:1,name:'風見鶏',kind:'furn',pc:7,time:160,maker:'wind',solid:1,anim:1,attr:{wind:4},mat:{wood:3,stone:3},desc:'風の向きをおしえる。まわり3マスのせいれいは移動速度×1.2（道しるべとは重ならない）。住み心地+4'},
  spike:{name:'とげの罠',fix:1,fixm:{wood:1,stone:1},kind:'furn',lv:1,pc:1,time:100,maker:'wood',qty:2,trap:1,attr:{earth:.5},mat:{wood:2,stone:2},desc:'上にいる「コワイノ」に、15分ごとに0.5ダメージ',anim:1},
  sticky:{name:'ねばねば草',fix:1,fixm:{funba:1},kind:'furn',lv:2,pc:1,time:80,maker:'wood',qty:2,trap:1,attr:{wood:.5},mat:{funba:2,kinoko:1},desc:'上にいる「コワイノ」の速さが35%になる',anim:1},
  puddle:{name:'すべる水たまり',fix:1,fixm:{stone:1},kind:'furn',lv:4,pc:1,time:80,maker:'water',qty:2,trap:1,anim:1,attr:{water:.5},mat:{stone:2},desc:'ふんだ「コワイノ」が8分止まる（オオカゲは3分）。つぎに使えるまで2時間',anim:1},
  firetrap:{name:'ほのおの罠',fix:2,fixm:{wood:1,stone:1},kind:'furn',pc:3,time:120,maker:'fire',lv:4,qty:2,trap:1,anim:1,attr:{fire:.5},mat:{wood:1,can:2},desc:'ふんだ「コワイノ」に4ダメージ。つぎに使えるまで3時間',anim:1},
  gust:{name:'つむじ風の罠',fix:2,fixm:{eda:1},kind:'furn',pc:3,time:120,maker:'wind',lv:5,qty:2,trap:1,anim:1,attr:{wind:.5},mat:{eda:2},desc:'ふんだ「コワイノ」を6マスふきとばし、2分止める。つぎに使えるまで2時間30分',anim:1},
  dig:{name:'けずる',kind:'build',pc:10,time:40,maker:'earth',attr:{},desc:'高いマスを1だん低くする工事（パワー10）'},
  mound:{name:'もる',kind:'build',pc:10,time:40,maker:'earth',attr:{},desc:'低いマスを1だん高くする工事（パワー10）'},
  watch:{name:'見張り台',fix:10,fixm:{wood:10,stone:10},kind:'build',sz:[2,2],mat:{wood:25,stone:20},pc:20,time:150,maker:'earth',lv:2,solid:1,attr:{fire:2,earth:2},desc:'「コワイノ」に光の矢を放つ。Lv1：ダメージ1／10分ごと／範囲6マス（Lv3：ダメージ3／10分ごと／範囲7マス）'},
  yogan:{name:'ようがん台',fix:10,fixm:{stone:15},kind:'build',sz:[2,2],mat:{wood:5,stone:40},pc:20,time:150,maker:'fire',lv:1,solid:1,attr:{fire:3},desc:'火山のふもとの守り。「コワイノ」に火の玉を飛ばし、当たったまわり1.5マスにもダメージ。Lv1：ダメージ1（まわり0.5）／8分ごと／範囲5マス（Lv3：ダメージ3（まわり1.5）／8分ごと／範囲6マス）'},
  well:{hp:5,brk:1,fix:10,fixm:{wood:4,stone:15},name:'井戸',kind:'build',mat:{wood:8,stone:30},pc:20,time:140,maker:'water',lv:6,solid:1,attr:{water:4},desc:'まわり3マスの畑は水やりなしで育つ'},
  windmill:{hp:5,brk:1,fix:13,fixm:{wood:30,stone:18},name:'風車',kind:'build',mat:{wood:60,stone:35},pc:25,time:160,maker:'wind',lv:8,solid:1,anim:1,attr:{wind:5},desc:'まわり5マスの畑の収穫+1'},
  lighthouse:{name:'灯台',sz:[2,2],kind:'build',mat:{wood:25,stone:35},pc:35,time:180,maker:'fire',lv:7,solid:1,anim:1,attr:{fire:4},desc:'まわり8マスを照らす。'},
  stele:{hp:5,brk:1,fix:18,fixm:{wood:6,stone:25},name:'石碑',kind:'build',mat:{wood:12,stone:50},pc:35,time:180,maker:'earth',lv:6,solid:1,attr:{earth:4},desc:'まわり5マスの壁が、1.15倍じょうぶになる（小数点以下は切りすて）'},
  fountain:{name:'噴水',sz:[2,2],kind:'build',mat:{wood:15,stone:60},pc:45,time:200,maker:'water',lv:6,solid:1,anim:1,play:{pt:6,pw:2.7,fun:45,dur:50,cap:3,adj:1},attr:{water:6},desc:'3人まで遊べる。たのしさ +45（50分）。遊ぶと10%の確率で、スタミナ+1'},
  statue:{name:'神殿',kind:'build',anim:1,pc:0,time:50,maker:null,solid:1,attr:{wood:1,water:1,fire:1,earth:1,wind:1},desc:'守り神の居場所。女神像・おそなえ箱・依頼ボード・カミサマの台座がある'},
  obox:{name:'おそなえ箱',solid:1,anim:1},
  board:{name:'依頼ボード',solid:1,anim:1},
  altar:{name:'カミサマの台座',solid:1,anim:1},
  site2:{name:'建てている場所',solid:1,job:1},
  part:{name:''},
  tower:{hp:100,hpS:114,brk:1,fix:20,fixm:{wood:20,stone:10},name:'守護の台座',sz:[2,2],kind:'build',pc:95,time:300,maker:null,solid:1,anim:1,attr:{wood:3,water:3,fire:3,earth:3,wind:3},desc:'守護の力をとりもどす台座。ヌシ様が帰ってくる。光の矢：ダメージ1／10分ごと／範囲10マス。まわり7マスを照らす'},
  rock:{name:'岩',solid:1,natural:1},
  hotstone:{hp:5,brk:1,fix:1,fixm:{},name:'ほのお石',kind:'furn',pc:0,time:20,solid:1,anim:1,attr:{fire:3,water:1},desc:'水べに置くと、水があたたまって温泉になる'},
  volcano:{name:'火山',sz:[3,3],solid:1,anim:1},boulder:{name:'大岩',solid:1,natural:1},heatv:{name:'熱の切りかえ装置',solid:1,anim:1},crack:{name:'ひびわれ',anim:1},/* 火山のふもと */
  deadtree:{name:'枯れ木',solid:1,natural:1},
  ntree:{name:'森の木',solid:1,natural:1},
  berry:{name:'ベリーの茂み',solid:1,natural:1,dyn:1},
  bamboo:{name:'竹',solid:1,natural:1},
  takenoko:{name:'たけのこ',natural:1,dyn:1},
  weed0g:{name:'しなやかな草',natural:1,weed:'shina'},weed0k:{name:'かさかさ草',natural:1,weed:'kasa'},/* 草原の雑草（よみがえった土地・荒れた土地） */
  weed1g:{name:'くるくる草',natural:1,weed:'kuru'},weed1k:{name:'ちりちり草',natural:1,weed:'chiri'},/* 火山の雑草 */
  weedc:{name:'ふんばり草',natural:1,weed:'funba'},/* どの土地にも生える雑草（オヒシバ） */
  kinoko:{name:'きのこ',natural:1,weed:'kinoko'},
  plot:{name:'耕す前の畑',job:1,dyn:1},
  sprout:{name:'植える場所',job:1,dyn:1},
  site:{name:'建てている場所',job:1,dyn:1,solid:1},

  'seed:mugi':{name:'こむぎのたね',kind:'seed',desc:'2日で育つ。パンの材料。畑をタップしてまく'},'seed:tomato':{name:'キャベツのたね',kind:'seed',desc:'2日で育つ。畑をタップしてまく'},'seed:imo':{name:'いものたね',kind:'seed',desc:'3日で育つ。たくさんとれる。畑をタップしてまく'}
};
const BLOCKS=['path','gravel','woodpath','stone','brick','floor','brickfloor','stonefloor','herrfloor','carpet','farm','fence','gate','archedgate','stonegate','hwall','logwall','plasterwall','brickwall','yozorawall','door','yozoradoor','wall','sdoor','window'];const GATE_IDS=new Set(['gate','archedgate','stonegate']),FENCE_IDS=new Set(['fence','logfence','bamboofence','gate','archedgate','stonegate']),HOME_WALLS=new Set(['hwall','logwall','plasterwall','brickwall','yozorawall','wall']),HOME_DOORS=new Set(['door','yozoradoor','sdoor']);
const PLANTS=['clover','bellf','salvia','lily','lotus','tree','fruit'],FLOWERS=new Set(['clover','bellf','salvia','lily','lotus']),ATTRFL=new Set(['clover','bellf','salvia','lily','lotus']),plantOK=id=>!ATTRFL.has(id)||!!S.unlocked[id]/* 属性の花はクエストで解放 */,isBud=j=>!!(S&&S.bud&&S.bud[j]>dayNo())/* 植えた日の次の朝まで、花と木は芽 */,flowerN=()=>S.obj.reduce((a,o,j)=>a+(FLOWERS.has(o)&&!isBud(j)?1:0),0),BREQ={windmill:'wind',fountain:'water',well:'water',lighthouse:'fire',stele:'earth'}/* 属性の子がいないと建てられない */;
const bloomCount=id=>S.obj.reduce((n,o,j)=>n+(o===id&&!isBud(j)?1:0),0);
const FLOWER_QUESTS=new Set(['salvia3','lotus3','lily5','clover3']);
const BEDSET=new Set(['bed','yorubed']);/* ねむれるベッド（よぞらのベッドも同じはたらき） */const KWR=['yozorawall','yozoradoor','yorubed','hoshirug','herrfloor'];const KWRKEY='hakoniwa-kwr-v1';/* コワイノのレシピは、どのステージでもおぼえたまま（ステージべつのセーブとはべつにしまう） */
function kwrSync(){if(!S)return;let g=[];try{g=JSON.parse(KV.getItem(KWRKEY)||'[]')}catch(e){}const G=new Set(g.filter(id=>KWR.includes(id)));for(const id of KWR)if((S.recipes||{})[id])G.add(id);for(const id of G){(S.recipes||(S.recipes={}))[id]=true;if(BL[id].kind==='block')(S.unlocked||(S.unlocked={}))[id]=true}try{KV.setItem(KWRKEY,JSON.stringify([...G]))}catch(e){}}/* コワイノのレシピ：落とし物でまれに手に入る */
const STAGEONLY={logfence:0,gazebo:0,bamboofence:1,takebench:1,takeakari:1,shishiodoshi:1,azumaya:1};/* そのステージで作れる物（草原0・火山1）。おぼえたら、どのステージでも作れる */
const GRECKEY='hakoniwa-rec-v1',GRECKEY2='hakoniwa-rec-v2',GNOREC=new Set(['statue','tower','yogan','watch','dig','mound']);let GREC=null;/* おぼえたレシピは、どのステージでもおぼえたまま（ステージべつのセーブとはべつにしまう）。神殿・台座・ようがん台・見張り台は、ステージのお話で決まるので入れない */
const NOMAT={0:['bamboo','kuru','chiri'],1:['shina','kasa']},matHere=(b,w)=>!Object.keys((w===1&&b.mat1)||b.mat||{}).some(k=>(NOMAT[w]||[]).includes(k));/* そのステージで手に入らない素材を使う物は、村レベルでおぼえない（草原：竹・くるくる草・ちりちり草） */
function learnedIn(s,w){const out=[];for(const id in BL){const b=BL[id];if(GNOREC.has(id)||STAGEONLY[id]==null&&b.offerOnly&&b.kind==='furn')continue;/* おそなえだけの家具は、レシピにしない */
  if((s.recipes||{})[id]||(s.unlocked||{})[id])out.push(id);
  else if((b.kind==='block'||b.kind==='build'||b.kind==='plant')&&b.lv&&!QB.has(id)&&(s.lv||1)>=b.lv&&(b.w||0)<=w&&matHere(b,w)&&(STAGEONLY[id]==null?!b.offerOnly:STAGEONLY[id]===w))out.push(id)}/* 村レベルで使えるようになった物 */
  return out}
function ownLearned(d,w){/* そのステージが、自分のクエスト・村レベル・持ち物でおぼえる物（ほかのステージからもらった物はふくめない） */const s2={world:w,free:false,quest:d.quest||0,qTalked:d.qTalked,qStory:d.qStory,subDone:d.subDone,subSt:d.subSt,subSeen:d.subSeen,lv:d.lv,inv:d.inv,obj:d.obj,orders:d.orders||[],win:d.win,recipes:{},guardianIdeas:{},unlocked:{}};try{syncQuestRecipes(s2)}catch(e){}return new Set(learnedIn(s2,w))}
function savedStage(w){let d=LIVE&&LIVE[w]&&!LIVE[w].summary?LIVE[w]:null;if(!d)try{const raw=KV.getItem(SAVE_KEYS[w]);if(raw)d=JSON.parse(raw)}catch(e){}return d&&!d.free?d:null}
function grecOf(){if(!GREC){/* id → おぼえたステージ（どのステージでおぼえたか。「はじめから」で、そのステージの分だけわすれるため） */let g=null;try{g=JSON.parse(KV.getItem(GRECKEY2)||'null')}catch(e){}GREC=new Map(g&&typeof g==='object'&&!Array.isArray(g)?Object.entries(g):[]);
    if(!g){let a=null;try{a=JSON.parse(KV.getItem(GRECKEY)||'null')}catch(e){}const ids=new Set(Array.isArray(a)?a:[]),own=[0,1].map(w=>{const d=savedStage(w);if(d)learnedIn(d,w).forEach(id=>ids.add(id));return d?ownLearned(d,w):new Set()});
      for(const id of ids){if(!BL[id])continue;GREC.set(id,own[0].has(id)?0:own[1].has(id)?1:STAGEONLY[id]!=null?STAGEONLY[id]:(BL[id].w||0))}/* 前の形のしまい方からうつす：自分のクエスト・村レベルでおぼえるステージ、わからなければその物のステージ */
      grecSave()}}return GREC}
function grecSave(){try{KV.setItem(GRECKEY2,JSON.stringify(Object.fromEntries(GREC)))}catch(e){}}
function grecForget(w){/* 「はじめから」：そのステージでおぼえたレシピをわすれる（ほかのステージのセーブからも消す。ほかのステージが自分でおぼえる物はのこす） */const G=grecOf(),gone=[...G].filter(([,o])=>o===w).map(([id])=>id);if(!gone.length)return;for(const id of gone)G.delete(id);
  const cut=(d,own)=>{for(const id of gone){if(own.has(id))continue;if(d.recipes)delete d.recipes[id];if(d.guardianIdeas)delete d.guardianIdeas[id];if(d.unlocked)delete d.unlocked[id]}};
  for(const w2 of[0,1]){if(w2===w)continue;const L=LIVE&&LIVE[w2]&&!LIVE[w2].summary&&!LIVE[w2].free?LIVE[w2]:null;let k=null;try{const raw=KV.getItem(SAVE_KEYS[w2]);if(raw)k=JSON.parse(raw)}catch(e){}if(k&&k.free)k=null;const base=L||k;if(!base)continue;
    const own=ownLearned(base,w2);for(const id of gone)if(own.has(id))G.set(id,w2);if(L)cut(L,own);if(k){cut(k,own);try{KV.setItem(SAVE_KEYS[w2],JSON.stringify(k))}catch(e){}}}/* 動いているデータと、しまってあるセーブの両方から消す */
  grecSave()}
const grec=id=>!!S&&!S.free&&grecOf().get(id)<WD;/* 前のステージでおぼえたか */
function recSync(){if(!S||S.free)return;const G=grecOf();let add=false;for(const[id,o2]of[...G]){const b=BL[id];if(b&&b.lv&&STAGEONLY[id]==null&&!matHere(b,o2)){G.delete(id);add=true;if(o2===WD){if(S.recipes)delete S.recipes[id];if(S.unlocked)delete S.unlocked[id];if(S.guardianIdeas)delete S.guardianIdeas[id]}}}/* 前に、手に入らない素材の物をおぼえていたら、わすれる（草原の竹のハシゴ） */for(const id of learnedIn(S,WD))if(!G.has(id)){G.set(id,WD);add=true}for(const[id,o]of G){const b=BL[id];if(!b||!(o<WD))continue;/* 使えるのは、前のステージでおぼえた物だけ（いまのステージ・この先のステージでおぼえた物は使えない） */if(b.kind==='block'||b.kind==='plant')(S.unlocked||(S.unlocked={}))[id]=true;else{(S.recipes||(S.recipes={}))[id]=true;(S.guardianIdeas||(S.guardianIdeas={}))[id]=true}}if(add||!KV.getItem(GRECKEY2))grecSave()}/* このステージでおぼえた物を足して（おぼえたステージもしまう）、ほかのステージでおぼえた物をもらう */
const CRAFTB=['floor','brickfloor','stonefloor','herrfloor','carpet','path','gravel','woodpath','stone','brick','hwall','logwall','plasterwall','brickwall','yozorawall','door','yozoradoor','fence','logfence','bamboofence','gate','archedgate','stonegate','wall','sdoor','window','yozorawin'];
const CRAFT_TABS=[["家具", ["table", "chair", "stool", "stable", "pouf", "achair", "ltable", "rug1", "rug2", "hoshirug", "bed", "yorubed", "sofa1", "monstera", "wreath", "curtain1", "curtain2", "paint1", "paint2", "paint3", "bathtub"]], ["収納", ["stor", "mbox", "crate", "shelf1", "wshelf", "cabinet", "shelf2"]], ["遊び", ["swing", "slide", "sandbox", "seesaw", "campfire"]], ["庭", ["bench", "takebench", "shishiodoshi", "hedge", "birdbath", "parasol", "noren", "arch", "kamizo", "jar", "rockart", "signpost", "vane"]], ["あかり", ["torch", "takeakari", "candle", "lantern", "flamp", "toro"]], ["ごはん", ["oven", "tub", "sink"]], ["ワナ", ["spike", "puddle"]], ["家づくり", ["floor", "brickfloor", "stonefloor", "herrfloor", "carpet", "hwall", "logwall", "plasterwall", "brickwall", "yozorawall", "door", "yozoradoor", "window"]], ["道・囲い", ["path", "gravel", "woodpath", "stone", "brick", "fence", "logfence", "bamboofence", "gate", "archedgate", "stonegate", "wall", "sdoor"]]];let craftTab=0;
const craftTabFor=id=>CRAFT_TABS.findIndex(([,ids])=>ids.includes(id));
const GIFTF=['furin','ema','kadomatsu','komainu','chochin','mimamori','yomawari','oyasumi','yonaka'];/* 交換・おみやげ・コワイノの落とし物でもらう家具 */
function furnitureGroups(ids){const wanted=new Set(ids);return CRAFT_TABS.map(([name,items])=>[name,items.filter(id=>wanted.has(id))]).filter(([,items])=>items.length)}
const FURN=['hoshirug','yorubed','toro','table','chair','stor','mbox','oven','bed','bench','takebench','takeakari','shishiodoshi','campfire','swing','torch','jar','rockart','vane','spike','puddle','stool','stable','pouf','achair','ltable','rug1','sofa1','rug2','tub','sink','crate','monstera','shelf1','wreath','curtain1','cabinet','paint2','shelf2','curtain2','paint3','wshelf','paint1','bathtub','candle','lantern','flamp','signpost','hedge','birdbath','parasol','arch','slide','sandbox','seesaw','kamizo','noren'];// 属性の罠（sticky/firetrap/gust）は次のステージから

const TERRA=new Set(['dig','mound']);/* だんさスコップの工事 */
const BUILDS=['statue','watch','bridge','ladder_wood','ladder_bamboo','slope_earth','stairs_wood','stairs_stone','stairs_brick','yogan','lumber','well','quarry','windmill','fountain','lighthouse','stele','tower'];
const STAMPS={
  fields:{name:'畑セット',cells:[[0,0,'farm'],[1,0,'farm'],[2,0,'farm'],[0,1,'farm'],[1,1,'farm'],[2,1,'farm']]},
  ring:{name:'柵の囲い',cells:(()=>{const c=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(x===0||y===0||x===4||y===4)c.push([x,y,'fence']);return c})()},
  plaza:{name:'石の広場',cells:(()=>{const c=[];for(let y=0;y<3;y++)for(let x=0;x<3;x++)c.push([x,y,'stone']);return c})()},
  road:{name:'あぜ道セット',cells:[[0,0,'path'],[1,0,'path'],[2,0,'path'],[3,0,'path'],[4,0,'path']]},
};
const NAMES=['フタバ','ノドカ','ハル','ソラ','モモ','リク','ユズ','コタ','ナギ','ルル','チャコ','テト','ピピ','ノア','キキ','マル','シズ','ホノ','フウ','アオ','ヒナ','トト','ララ','ムウ','サク','ネネ','ポポ','ミミ','タロ','ニコ'];
const LIKES={swing:'ブランコ',fountain:'噴水',fish:'つり',chat:'おしゃべり',campfire:'たき火'};
const LIKE_KEYS=Object.keys(LIKES);

/* ---------- ストーリー ---------- */
const GOD='カミサマ',POKO='フタバ';
const MINA='ノドカ';
const HOMURA='ホムラ',SHIZUKU='シズク';
const KEYS=[[POKO,MINA],[HOMURA,SHIZUKU]];KEYS[FREE]=[];const FIXK0={fire:'ホノ',water:'アオ',wind:'フウ'};/* ステージ1の火・水・風のキーキャラ（名前も見た目も固定） *//* ステージごとのキーキャラ（1人目・2人目） */
const KEYEL={[POKO]:'wood',[MINA]:'earth',[HOMURA]:'fire',[SHIZUKU]:'water'};
const LEAD=()=>KEYS[WD][0]||(WD===FREE?FA():GOD);
const PROLOGUE=[
  ['？？？','#wave|…おーい、聞こえとるかの？ そうそう、おヌシじゃ。'],
  [GOD,'#wave|わしはカミサマじゃ。よろしくのう〜。'],
  [GOD,'おヌシは、生まれたばかりの小さな守り神なんじゃ。さっそくじゃが、行ってほしい土地があってのう。'],
  [GOD,'行く前に、その土地のことを、ちょっとだけ話しておこうかの。'],
  [GOD,'#danger|そこはむかし、せいれいたちがにぎやかに暮らす、ゆたかな草原じゃった。ヌシ様も見守っておってな。'],
  [GOD,'#alarm|じゃが、ある晩、「コワイノ」の大群がおしよせてのう。自然の力のバランスがくずれてしもうて、土地はボロボロ。せいれいは散り散り、ヌシ様もどこかへ行ってしもうた。'],
  [GOD,'そこで、おヌシにおねがいじゃ。'],
  [GOD,'「せいれいたちの力を集めて、この土地に守護の力を取り戻しておくれ」'],
  [GOD,'#wave|…というわけで！ よろしくたのむぞい〜。では、さっそく行こうかの！'],
];
const INTRO=[
  [GOD,'ほい到着〜。ここがその草原じゃ。'],
  [POKO,'あっ！ 守り神さまだ！'],
  [POKO,'ぼく、フタバ！ 木のせいれいだよ。ここでずっと暮らしてたんだ！'],
  [POKO,'#surprise|えへへ、急にお客さんが来るなんて、びっくりしちゃった。'],
  [POKO,'#joy|守り神さまと会えてうれしいな！'],
  [GOD,'この土地に守護の力を取り戻すには、おヌシの力を集める場所がいる。わしの居場所にもなる、小さな神殿を建てよう。'],
  [GOD,'じゃがのう、生まれたばかりのおヌシの守護の力がとどくのは、まだこのまわりだけなんじゃ。'],
  [GOD,'#alarm|力のとどかん所は、土地があれたままでのう。ものを建てても、すぐにくずれてしまう。夜の「コワイノ」も、そっちのほうからやってくるんじゃ。'],
  [GOD,'村が育ったら、わしもまた手を貸してやるぞい。'],
  [GOD,'建てる場所は、力のとどく所なら、おヌシが好きにえらんでよいぞ。建てるのは、せいれいたちがやってくれるぞい。'],
];
let TESTSPD=false;try{TESTSPD=KV.getItem('hakoniwa-test')==='1'}catch(e){}
const GLASS_IC='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="2.5" rx="1" fill="#a0703f"/><rect x="5" y="19.5" width="14" height="2.5" rx="1" fill="#a0703f"/><path d="M7 4.5c0 5 10 5.5 10 7.5s-10 2.5-10 7.5h10c0-5-10-5.5-10-7.5s10-2.5 10-7.5z" fill="#dff1f7" stroke="#7a5233" stroke-width=".8"/><path d="M9 18.5c1-2 5-2 6 0z" fill="#e8c27a"/></svg>');
const glassUnlocked=()=>!!S;/* スピードアップ：はじめから使える */
const hasGlass=()=>TESTSPD||(glassUnlocked()&&(S.glassT||0)>0);/* 使える時間がのこっているあいだだけ。はじめの10分は無料、あとは広告を見ると10分ふえる */
const fmtT=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function glassUI(){const e=$('#spdN');if(!e)return;const t=TESTSPD||TESTM?'':(S.speed>1&&S.glassT>0?' '+fmtT(S.glassT):S.glassT>0?'':' 広告');const v='×'+S.speed+t;if(e.textContent!==v)e.textContent=v}
function adPrompt(){if($('#adBox'))return;const d=document.createElement('div');d.id='adBox';d.style.cssText='position:fixed;inset:0;z-index:70;background:rgba(5,15,14,.72);display:flex;align-items:center;justify-content:center;padding:24px';
  d.innerHTML='<div class="pxcard" style="background:var(--panel);color:var(--ink);border-radius:16px;padding:20px;max-width:320px;width:100%;text-align:center;font-weight:700;line-height:1.7"><div>広告を見ると、10分間<br>ゲームの速さを2倍にできるよ</div><div id="adMsg" style="margin:10px 0;font-weight:400;min-height:1.7em"></div><div style="display:flex;gap:8px;justify-content:center"><button class="btn pri" id="adGo">広告を見る</button><button class="btn" id="adNo">やめる</button></div></div>';
  document.body.appendChild(d);const close=()=>d.remove();$('#adNo').onclick=close;
  $('#adGo').onclick=()=>{$('#adGo').disabled=true;$('#adNo').disabled=true;let n=5;const m=$('#adMsg');m.textContent='広告 '+n;const iv=setInterval(()=>{n--;if(n>0){m.textContent='広告 '+n;return}clearInterval(iv);S.glassT=Math.min(1800,(S.glassT||0)+600);sfx('level');toast('スピードアップが10分使えるようになった','good');close();applyFeats()},1000)}}/* 広告を見たらスピードアップ10分（いまは広告のかわりの5秒の画面） */
const GOD_SHOP=['いらっしゃ〜い。なにがほしいかの？','おっ、来たのう。今日はなにと交換する？','パワーたまっとるか？ ゆっくり見ていくがよい。','どれも自慢の品じゃよ。たぶん。','ほれ、えらべえらべ。まけんがの。'],GOD_BUY=['まいど〜！ だいじに使うんじゃぞ。','いい買い物をしたのう〜。','それをえらぶか？ わかっとるのう。','ありがとさん〜。パワーはだいじにあずかっとくぞい。','また来るんじゃよ。…おっと、来とるのはわしのほうか。'],GOD_POOR=['パワーが足りんのう〜。せいれいたちにがんばってもらうんじゃ。','ツケはなしじゃぞ〜。'];let shopSay='';
const GOD_IDLE=['草、生えてきたのう〜。','むかしはのう…はて、なんの話じゃったか。','パワー？ ためればなんとかなるわい！','ねむ…。','夜は「コワイノ」に気をつけるんじゃぞ。たぶん来るからの。','「コワイノ」は、ほんとうに悪いやつなんかのう…。','おやつ持っとらんか？','属性がたまるとせいれいが来るぞい。…たしか。'];
function KS(L){const o=[];for(let[w,t]of L){let n=w;if(w.length===1){try{n=sevName(w)}catch(e){n=null}}if(n){if(t&&typeof t==='object'){const q=S&&S.res.find(x=>x.name===n);t=q&&elemKey(q)==='fireB'?t.B:t.A}o.push([n,t])}}return o}/* キーキャラの名前を入れたセリフ */
function pathMade(){const n=S.floor.filter(f=>f==='path').length;if(S.flags.path0==null)S.flags.path0=n;return Math.max(0,n-S.flags.path0)}/* クエストを受けてから、しいたあぜ道の数 */
const QUESTS1=[
  {id:'statue',text:'神殿を建ててもらおう',how:"下の「おく」→「神殿」をえらび、空いた場所（4マス）をタップ",check:()=>cnt('statue')>=1,by:GOD,story:[
    [POKO,'できたー！ りっぱな神殿！'],
    [GOD,'真ん中が女神像、左がおそなえ箱、右が依頼ボードじゃよ。'],
    [POKO,'ぼく、ときどきおそなえ箱におそなえものを入れるね。守り神さま、自由に使ってね！'],
    [GOD,'#joy|ありがとうのう。それから、せいれいのようすも、ときどき見てやっておくれ。'],[GOD,'せいれいのようすをよく見ると、おなかやたのしさがわかるんじゃ。おなかがゼロになると消えてしまうからの。'],[GOD,'ためしに、いまフタバのようすを見てみい。']],gives:{feat:['inv'],flag:'tapAsk'}},
  {id:'stor',text:'食料箱を置こう',how:"フタバと話して食料箱を受けとる。「おく」→「食料箱」をえらんで置く",check:()=>cnt('stor')>=1,
   talk:{who:POKO,when:()=>!S.flags.tapAsk||!!S.flags.tapped,wait:'せいれいをタップして、ようすを見てみよう',/* ステータスを見てから、次のお話 */lines:[
    [POKO,'守り神さま、見て見て！ ベリーいっぱい集めたよ！ すごいでしょ！'],
    [POKO,'#think|……あれ？ おかしいな。さっきまでここに……'],
    [POKO,'#surprise|あっ！ 虫さん！ たべちゃったの！？'],
    [POKO,'#joy|えへへ……こんどは、どこかにしまっておかなきゃ。'],
    ['@idea'],[GOD,'#think|ほっほ、おヌシ。食べ物をしまう箱を思いついたんじゃな。'],
    [GOD,'その形どおりの「食料箱」を1つ、おそなえ箱に入れておいたぞい。'],[GOD,'好きな場所に置いてみい。']],gives:{items:{stor:1}}},
   story:[
    [POKO,'#joy|ありがとう、守り神さま！ つんでおいたベリー、入れておくね！'],
    [POKO,'おなかがすいたら、ここから出して食べるね。'],
    [GOD,'#nod|うむ、いい場所に置けたのう。'],
    [GOD,'もし置く場所をまちがえても、おそなえ箱にもどせるから、安心せい。'],
    [POKO,'#joy|うん！ じゃあ、さっそくひとつ食べちゃおうっと。']],pre:{food:{berry:10}},gives:{feat:['remove','plant']}},
  {id:'mbox',text:'素材箱を置こう',how:"フタバと話して素材箱を受けとる。「おく」→「素材箱」をえらんで置く。置きなおしたいときは「こわす」でおそなえ箱にもどせる",check:()=>cnt('mbox')>=1,gives:{mat:{wood:10,stone:10},msg:'フタバが集めていた木材10・石材10を素材箱に入れた'},/* ごほうびは、クエストをクリアしたときに */
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、見て見て！ この木の枝、くるんってなってるの。'],
    [GOD,'ほほう。いい形じゃのう。'],
    [POKO,'#joy|えへへ。こういうの見つけると、つい拾っちゃうんだ。石も、まるいのとか、すべすべのとか。'],
    [POKO,'…でも、拾ったはいいけど、しまうとこがないんだよね。そこらに置いとくと、どれがどれだか、わかんなくなっちゃう。'],
     ['@idea'],[GOD,'#nod|なるほどのう……木や石をまとめてしまえる箱があれば、散らからずにすむのう。「素材箱」と呼ぶのがよさそうじゃ。'],
    [GOD,'その形で用意して、おそなえ箱に入れておいたぞい。好きな場所に置いてみい。']],gives:{items:{mbox:1}}},
   story:[
    [POKO,'#surprise|わあ、ぴったり！ 集めてた木と石、ぜんぶ入れとくね。'],
    [GOD,'ずいぶん集めとったんじゃのう。'],
    [POKO,'#nod|うん！ …あ、くるんってした枝は、ぼくのたからものだから、入れないけどね。'],
    [GOD,'#think|これからは、おヌシの思いつきを、素材箱の木や石で形にしていけるぞい。'],
    [GOD,'せいれいたちは、困っていることや、やってみたいことを話してくれる。どんな形でかなえるかは、おヌシのひらめき次第じゃ。'],[POKO,'#joy|守り神さま、素材箱、ありがとう！']]},
  {id:'table',text:'食卓をたのもう',check:()=>cnt('table')>=1,how:'神殿の依頼ボードをタップ →「家具」→「食卓」をはる。できたら「おく」で置く',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、ベリーを置くと、土がついちゃうんだ。食べるたびに、ふうってするの、たいへんで……。'],
    [POKO,'大きな葉っぱにのせたら、土はつかないかな。でも、風で飛んじゃいそう……。'],
    [GOD,'葉っぱごと飛ばされてしまうか……。土がつかず、風にも飛ばされぬ置き場所があればよいのう。'],
    ['@idea'],[GOD,'#think|それは……。おヌシ、その形を思いついたんじゃな。'],
    [GOD,'#think|……ふむ。食べ物をのせる台か。「食卓」と呼ぼうかの。'],
    [GOD,'その形を、神殿の右の依頼ボードに描いてはってみい。せいれいたちにも伝わるぞい。'],
    [GOD,'手のあいたせいれいが、その絵を見ながら作るんじゃ。できたらおそなえ箱に入るから、好きな場所に置くんじゃよ。'],[GOD,'たのむときは、パワーを使うぞい。パワーは、せいれいが満足してくれると、もらえるんじゃ。'],[POKO,'#surprise|その上なら、土がつかないの？ わあ、やってみたい！'],[GOD,'#nod|うむ。作るのに使う木材は、わしが渡しておくぞい。']],gives:{feat:['craft'],mat:{wood:8}}},
   story:[
    [POKO,'#joy|これが、食卓なんだ！ ベリーに土がつかないね。えへへ、おいしい！'],
    [GOD,'#think|うむ。おヌシの思いつきが、ちゃんと形になったのう。'],
    [GOD,'#think|これからも、よい形を思いついたら依頼ボードにはるんじゃ。せいれいたちが手伝ってくれるぞい。'],
    [POKO,'#joy|守り神さまのつぎの思いつき、なにかな。たのしみ！']]},
  {id:'wall',text:'家の壁を直そう',how:"「おく」→「オークの壁」をえらんで、家の壁のすきまをふさぐ",check:()=>HOUSES.length>=1,
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'しまう場所もできたのう。…そろそろ、夜のことも話しておかんとな。'],[GOD,'#alarm|この土地には、夜になると「コワイノ」が来るんじゃ。'],
    [POKO,'#scared|コワイノ……。夜は、あの穴のあいた家にかくれたり、にげまわったりしてるんだ。'],
    [GOD,'うむ。じゃが、これからは守り神がついておるぞ。'],
    [GOD,'#alarm|コワイノは、せいれいや食べ物をねらって来る。'],
    [GOD,'#scared|家の中にいればおそわれん。じゃが、壁にすきまがあると、こわして入ろうとするんじゃ。'],
    [GOD,'#scared|あそこの家、壁がこわれたままなんじゃ。オークの壁を3つ入れといたから、すきまをふさいでみい。']],gives:{feat:['people'],items:{hwall:3}}},
   story:[
    [POKO,'#scared|前に、夜に壁をこわされたことがあったんだ。'],[POKO,'でも、もうすきまはないね。壁があると、なんだかほっとする！']]},
  {id:'bed',text:'家にベッドを置こう',how:"「おく」→「ベッド」をえらんで、壁で囲まれた家の中に置く",check:()=>houseBedCount()>=1,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'草の上はごつごつするし、ゆっくり休める場所があったらいいな。'],
    ['@idea'],[GOD,'#think|そうか……。安心して休める寝床もいるのう。おヌシ、何か思いついたようじゃな。'],
    [GOD,'ふかふかの寝床を「ベッド」と呼ぼうかの。家の中に置いてみい。']],gives:{items:{bed:1}}},
   story:[
    [POKO,'#surprise|わあ、草の上よりふかふか！ これがベッドなんだね。すぐ眠れちゃいそう……。'],
    [GOD,'これで、夜は家で安心して眠れるのう。'],
    [GOD,'#alarm|それで…今夜も「コワイノ」が来るぞ。夜12時ごろに現れて、朝には消えるんじゃ。'],
    [GOD,'この夜は、たぶん1体だけじゃ。家の中で眠っておれば、だいじょうぶ。'],
    [GOD,'#alarm|おヌシも手伝えるぞ。「コワイノ」に守り神の光をあてて、おどかせるんじゃ。使うたびにパワーを1つ使うから、ためておくんじゃ。'],
    [POKO,'#scared|……夜は、やっぱりこわいな。でも、この家と守り神さまの光があるなら、少し安心かも。']],gives:{enemy:true}},
  {id:'path',text:'道をつくろう',how:"「おく」→「あぜ道」をえらんで、家と神殿のあいだに5マスしく",check:()=>pathMade()>=5,prog:()=>'あぜ道 '+Math.min(5,pathMade())+'/5',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、家と神殿のあいだ、草がぼうぼうで歩きにくいんだ。'],
    [GOD,'ふむ。道があれば、みなも行き来しやすくなるのう。'],
    [GOD,'あぜ道を5つ入れといたぞい。家と神殿のあいだに、しいてみい。']],gives:{items:{path:5}}},
   story:[
    [POKO,'#surprise|わあ、歩きやすい！ 足が、すいすい進むよ。'],
    [GOD,'道の上は、せいれいたちも速く歩けるんじゃ。'],
    [POKO,'#joy|どうりで！ 神殿まで、走っていきたくなっちゃう！']]},
  {id:'lv2',text:'村レベルを2にしよう',check:()=>S.lv>=2,how:'せいれいが満足してパワーがたまると、村レベルが上がる。夜は、守りの光のアイコンをタップしてから「コワイノ」をタップすると、パワー1で光をあてておどかせる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、ここで楽しく暮らすと、村も育っていくんだって！'],
    [GOD,'#nod|うむ。せいれいたちが満足して、パワーがたまるほど、村は育っていくんじゃ。'],
    [GOD,'村が育つと、道や家づくりに使えるものも少しずつ増えていくぞい。']]},
   story:[
    [POKO,'#joy|やったー！ 村が、ひとまわり育ったみたい！ 最初の一歩、って感じがするね。'],
    [GOD,'#nod|うむうむ。新しく使える物もふえたぞい。'],
    [POKO,'#joy|ほんと？ どんな物だろう。わくわくするね！']]},
  {id:'fence4',text:'柵を4つ置こう',how:"「おく」→「柵」をえらんで4つ置く",check:()=>['fence','logfence','bamboofence'].reduce((n,id)=>n+cnt(id),0)>=4,
   talk:{who:POKO,when:()=>(S.nights||0)>=1&&S.lastMorning>S.lastNight,wait:'夜をこして、朝をむかえよう',lines:[
    [POKO,'#sigh alarm|……ねえ、コワイノが来たときの音、まだ耳に残ってるの。'],[POKO,'壁をがりがりってひっかく音……。聞こえるたび、胸がどきどきしたよ。'],
    [POKO,'前なら、音がするたび隠れてた。でも今日は、守り神さまがいる。'],
    [POKO,'ぼくもがんばる！ でも、どうしたらいいのかな……。'],[POKO,'#alarm|家の壁で家を守れたみたいに、コワイノの通り道もふさげたらいいのかな……。'],[GOD,'#alarm|「コワイノ」は、まっすぐ歩いて近づいてくるんじゃ。道をふさげば、遠まわりさせられるぞい。'],[POKO,'#alarm|そっか、通り道をふさぐんだね！ ぜんぶ囲まないで、コワイノが来る道に柵をおけばいいんだね！'],
    [GOD,'#alarm|柵を入れといたぞい。「コワイノ」が通りそうなとこに置いて、家に近づけんようにするんじゃ。']],gives:{items:{fence:10}}},
   story:[
    [GOD,'よしよし、いい感じじゃ。'],
    [POKO,'これで、ちょっと安心だね！']]},
  {id:'watch1',text:'見張り台ととげの罠を置こう',how:"「おく」→「見張り台」を1つと「とげの罠」を2つ置く",check:()=>cnt('watch')>=1&&cnt('spike')>=2,prog:()=>'見張り台 '+Math.min(1,cnt('watch'))+'/1・とげの罠 '+Math.min(2,cnt('spike'))+'/2',
    talk:{who:GOD,when:()=>true,lines:[
    [POKO,'#alarm|守り神さま、柵を置いたけど……「コワイノ」は、柵があってもあきらめないんじゃないかな。'],
    [POKO,'入れなくて困っても、そのまま帰ってくれる気がしないんだ。'],
    [GOD,'#nod|うむ。柵は足止めにはなるが、追いはらえるわけではないんじゃ。時間をかせぐだけじゃからのう。'],
    [POKO,'じゃあ、足止めしてるあいだに、なんとかしないとだめだね。'],
    [GOD,'そこで見張り台じゃ。高いところから早めに見つけて、光の矢で追いはらえる。今回はわしのおごりじゃ。'],
    [GOD,'#alarm|とげの罠も10こ入れといたぞい。柵で遠まわりしてきた「コワイノ」の通り道に置いてみい。ふんだら、ダメージじゃ。'],
    [POKO,'柵で足止めして、罠と見張り台で追いはらうんだね！ やってみる！'],['@idea']],gives:{watchNow:true,items:{spike:10},flags:['watchLearned']}},
   story:[
    [GOD,'#alarm|見張り台は光の矢で「コワイノ」を追いはらうんじゃ。とげの罠は、ふんだ「コワイノ」にダメージじゃよ。'],
    [POKO,'これで、少しは安心できるね。'],[POKO,'#danger|守ってくれて、ありがとう、守り神さま！']]},
  {id:'kikyo',text:'ききょうを植えて、土の力をためよう',how:"「おく」→「ききょうの種」を植える。土の力が満ちると、次の朝になかまを呼べる",check:()=>bloomCount('bellf')>=2,prog:()=>'咲いたききょう '+Math.min(2,bloomCount('bellf'))+'/2',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#cry|ねえカミサマ…ぼく、ひとりだとちょっとさみしいな。'],
    [GOD,'お、なかまがほしいかの？ せいれいはな、その属性の力がたまった土地にやってくるんじゃ。'],
    [GOD,'つぎに来てもらうなら、土のせいれいがよかろう。畑を耕したり柵を直したりは、土のせいれいにしかできんのじゃ。'],
    [GOD,'土の力をためる「ききょう」の種を入れといたぞい。植えてみい。']],gives:{feat:['summon'],items:{bellf:5}}},
   story:[
    [POKO,'ききょう、きれいだね！ 土の力が満ちたみたい！'],
    [GOD,'#nod|うむ、これで土のせいれいが来てくれるぞい。'],[POKO,'なかま、どんな子かなあ。どきどきする！']]},
  {id:'summon',text:'朝になったら、神殿の「！」でなかまを呼ぼう',how:"朝、神殿の上に「！」が出たら、「みる」で神殿をタップ",check:()=>!!S.flags.minaCame&&NEWRES==null&&!NEWQ.length,
   talk:{who:GOD,when:()=>nextOK(),lines:[
    [GOD,'力が満ちた次の朝、神殿で、なかまを呼べるぞい。'],
    [POKO,'あしたの朝がたのしみ！']],gives:{flag:'sumTold'}},
   by:MINA,story:[
    [MINA,'#surprise wave|ふわぁ…。はじめまして、ノドカだよぉ。よろしくねぇ。'],
    [POKO,'#wave|わーい、なかまだ！ よろしくね、ノドカ！'],
    [MINA,'畑を耕すのと、柵を直すのが得意なんだぁ。のんびりやるねぇ。'],[MINA,'#joy|呼んでくれて、ありがとうねぇ、守り神さま。']]},
  {id:'farm6',text:'畑を6つにしよう',how:"「おく」→「畑」をえらび、合計6つにする。土のせいれいが耕すのを待とう",check:()=>cnt('farm')>=6,
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'これで畑が作れるのう。畑を2つ、おそなえ箱に入れといたぞい。置けば土のせいれいが耕してくれるんじゃ。']],gives:{items:{farm:2}}},
   story:[
    [POKO,'ふかふかの畑だ！'],
    [MINA,'耕すのは、ぼくにまかせてねぇ。'],
    [GOD,'いい畑になったのう〜。']]},
  {id:'imoseed',text:'畑にたねをまこう',how:"「おく」でいものたねをえらび、たねがない別々の畑に2こまく",check:()=>imoSeedQuestPlots().length>=2,prog:()=>'いものたね '+Math.min(2,imoSeedQuestPlots().length)+'/2',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'ノドカが耕してくれた畑、まだなにも植わってないね。'],
    [MINA,'畑はねぇ、耕しただけじゃ、なにも育たないんだよぉ。'],
    [MINA,'いものたねを2こ、別々の畑にまいてねぇ。'],
    [POKO,'いもは、いっぺんにたくさんとれるんだよ！']],gives:{items:{'seed:imo':2}}},
   story:[
    [POKO,'#joy|たねをまいてくれて、ありがとう！ 水やりと世話は、ぼくにまかせて！'],
    [MINA,'大きくなるの、たのしみだねぇ。']]},
  {id:'trade',text:'カミサマと交換してみよう',how:"カミサマをタップし、何かと交換してから「交換をおわる」をタップ",check:()=>!!S.flags.tradedSeen,/* 交換して、お店をとじたら（closeSheet） */
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'これから、いろいろ必要なものが出てくるじゃろ。'],[GOD,'言うてくれたら、おヌシのパワーと交換してやろう。道や囲いのもと、種、便利な道具もあるぞい。'],
    [GOD,'わしに声をかけてみい〜。']],gives:{feat:['shop']}},
   story:[
    [GOD,'まいど〜！ ほっほっ。'],
    [GOD,'さて、教えることはだいたい教えたかの！ わしは、ほかの土地も見まわらねばならんのじゃ。'],
    [POKO,'#surprise|えっ、もう行っちゃうの？'],[POKO,'#think|……あ、ううん。ぼくたちだけでも、だいじょうぶ……だよね？'],[GOD,'#nod|ほっほ。フタバには、もう守り神もノドカもおるじゃろ。'],[MINA,'だいじょうぶだよぉ、フタバ。'],[POKO,'#think|……うん。そうだよね！'],
    [GOD,'わからんことは「ひでんのしょ」に書いておいたぞい。わしの知恵が、ぜ〜んぶつまっとるからの。'],
    [GOD,'ときどき遊びに来るぞい。そのときまた交換しようの。ではな〜！'],[POKO,'#joy|いろいろ教えてくれて、ありがとう、カミサマ！ またね！']],gives:{godLeave:true}},
  /* どのクエストも：吹き出し→会話でクエストを受ける→たっせい→吹き出し→お礼とごほうび */
  {id:'oracle',text:'おつげを出してみよう',check:()=>!!S.flags.oracleSeen,/* おつげを出して、画面をとじたら（closeSheet） */how:'メニューの「おつげ」で、きょういちにちの方針をえらぶ。わからないことは、メニューの「ひでんのしょ」で見られる',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'ねえ、守り神さま。みんな、言われなくても自分で動いてくれるけど……'],
    [POKO,'「今日は、これをやってほしいな」って、お願いもできるんだよ。'],
    [MINA,'それを「おつげ」って言うんだよぉ。守り神さまが、きょういちにちの方針を決めてくれるんだぁ。'],
    [MINA,'たとえば「木をあつめる」にしたら、手があいた子は、木を先にあつめてくれるよぉ。朝になったら、また元にもどるからねぇ。'],
    [POKO,'やってみよう！ 守り神さま、おつげを出してみて！']]},
   story:[
    [POKO,'#surprise|わあ、みんなの動きが変わった！'],
    [MINA,'おつげは、あくまでお願いだよぉ。みんなの得意なことや、体の調子もあるからねぇ。'],
    [POKO,'足りないものがあるときに使うと、よさそうだね！']]},
  {id:'fire',text:'火のせいれいをむかえよう',check:()=>elemCount('fire')>=1&&NEWRES==null,how:'見張り台やサルビアを置いて火の力をためる。満ちた次の朝、神殿の「！」からなかまを呼ぶ',prog:()=>'火の力 '+Math.floor(ATTR.fire)+'/'+needFor('fire'),
   talk:{who:POKO,when:()=>nextOK(),lines:[
    [POKO,'#alarm|ねえノドカ、「コワイノ」に立ち向かえるせいれいがいたら、心強いよね。'],
    [MINA,'#danger|火のせいれいなら、「コワイノ」とたたかえるらしいよぉ。'],
    [POKO,'火の力をためて、火のせいれいをむかえよう！']]},
   get story(){return KS([['H',{A:'#joy|おや、来てやったよ！ 今夜からは、あたいも村を守る。',B:'#joy|おう、来てやったぜ！ 今夜からは、おれも村を守る。'}],[POKO,'あったかいせいれいが来てくれた！'],['H',{A:'#alarm|「コワイノ」なんざ、あたいが追いはらってやるよ。',B:'#alarm|「コワイノ」なんざ、おれが追いはらってやるよ。'}],[MINA,'これで夜も、ちょっと心強いねぇ。']])}},
  {id:'lv3',text:'村レベルを3にしよう',check:()=>S.lv>=3,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'火のなかまが来て、夜も心強くなったね！ 村も、もっとにぎやかになるかな？'],
    [MINA,'#nod|うん。食べたり休んだり、みんながここで暮らしていくうちに、村も育っていくんだよぉ。']]},
   get story(){return KS([
    [POKO,'3になった！ ぼく、はじめのころより、ずいぶん楽しく暮らせてる気がするよ。'],
    ['H',{A:'へぇ、悪くない村になってきたじゃないか。夜の見はりも、まかせときな。',B:'へぇ、悪くない村になってきたじゃねえか。夜の見はりも、まかせときな。'}]])}},
  {id:'water',text:'水のせいれいをむかえよう',how:"ハスを植えて水の力をため、朝に神殿の「！」から呼ぶ",check:()=>elemCount('water')>=1&&NEWRES==null,prog:()=>'水の力 '+Math.floor(ATTR.water)+'/'+needFor('water'),
   talk:{who:POKO,when:()=>nextOK(),lines:[
    [POKO,'畑がふえて、水やりがたいへんになってきたね…。'],
    [MINA,'水やりは、水のせいれいが得意なんだよぉ。'],
    [MINA,'水の力をためたら、水のせいれいが来てくれるかもねぇ。']]},
   get story(){return KS([['M','はじめまして。水やりや、水をくむ仕事なら、わたしにまかせてください。'],[POKO,'水のせいれいが来てくれた！ 畑がうるおうね！'],['M','畑の配置を見なおせば、より効率よく水を行きわたらせられそうです。'],[MINA,keyName('water')+'がいれば、井戸のまわりの畑も、もっと元気になるねぇ。']])},gives:{flag:'wellR'}},
  {id:'baseUp',skip:1,text:'基地を広げよう',check:()=>true,how:'',prog:()=>'',/* 敷地はなくなった。古いセーブのクエスト番号がずれないよう、のこして、とばす */
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、ここ、なんだかせまくなってきたね。'],
    [MINA,'せいれいが増えたからねぇ。置ける場所も、そろそろいっぱいだよぉ。'],
    [POKO,'もっと広くできないの？'],
    [MINA,'カミサマにたのめば、守り神さまの力がとどく所を、広げてもらえるはずだよぉ。'],
    [POKO,'カミサマが来たときに、お願いしてみよう！'],
    [POKO,'カミサマがまた遊びに来たら、広くなった村を見てもらいたいね！'],['@idea']]},
   story:[
    [POKO,'#surprise|わあ…！ ひろくなった！'],
    [MINA,'これでまた、いろんなものが置けるねぇ。'],
    [MINA,'広げたぶん、夜に守る場所も増えるからねぇ。柵と見張り台も、忘れずにねぇ。'],
    [POKO,'#nod|うん！ 守る場所が広がったんだね。']]},
  {id:'lv4',text:'村レベルを4にしよう',check:()=>S.lv>=4,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'なかまもふえてきたし、みんながのんびり暮らせたらいいね！'],
    [MINA,'水のなかまも増えたしねぇ。村を整えながら、もうひとまわり育てていこうねぇ。']]},
   story:[
    [POKO,'#danger|村が、また育った！ 道を歩く足音まで、にぎやかになってきたよ。'],
    [MINA,'#danger|うん。この調子で、みんなの暮らしを守っていこうねぇ。']]},
  {id:'ookage',text:'オオカゲを追いはらおう',how:"柵・見張り台・罠を整え、夜に来るオオカゲを追いはらう。オオカゲは、このクエストが出た3日後の夜に来る（なかまが4人そろって3日たち、火の子がいるとき）。",check:()=>(S.bossKills||0)>=1,prog:()=>bossDays(),
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#alarm|守り神さま、夜のコワイノを見てたらね…森の奥に、ひときわ大きな黒い影がいたんだ。'],
    [POKO,'あの影……ぼく、むかし見たことがある。'],
    [MINA,'#alarm|それは「オオカゲ」だねぇ。コワイノたちの親玉って、むかしから言われてるよぉ。'],
    [POKO,'あれが、また、ここに来るかもしれないの…？'],
    [MINA,'#alarm|土の音を聞くとねぇ……3日くらいあとの夜に、来そうだよぉ。'],
    [MINA,'#danger|だから、柵をかさねて、見張り台をきたえておこうねぇ。家の中にいれば、攻撃されないよぉ。']]},
   story:[
    [POKO,'追いはらえた……！'],
    [MINA,'おつかれさまだねぇ。オオカゲは、ヌシ様がいなくなったことと、なにか関係があるのかもしれないねぇ。'],
    [POKO,'ヌシ様……？'],
    [MINA,'むかしから、この土地に伝わるお話なんだけどねぇ。ヌシ様がいなくなったとき、その力は3つのかけらになって、ちらばったんだってぇ。'],
    [POKO,'#sigh|ノドカ、どうしてそんなこと知ってるの？'],
    [MINA,'ぼくは土のせいれいだからねぇ。土はね、この土地のできごとを、ずーっと覚えてるんだよぉ。'],
    [MINA,'ときどき、足の下から、むかしのお話が聞こえてくるんだぁ。ぼくは、それを聞いてるだけだよぉ。'],
    [POKO,'へえ…！ 土って、すごいんだね。'],
    [POKO,'じゃあ、かけらを集めたら、ヌシ様がもどってくるかも！'],
    [MINA,'3つそろえて台座にそなえたら、ヌシ様の形にもどれるはずだよぉ。'],[POKO,'かけらは、どこにあるのかな……。'],[MINA,'わからないねぇ。でも、きっとどこかで待ってるよぉ。'],[MINA,'5つの属性のなかまがそろったら、そなえる台座を建てようねぇ。']]},
  {id:'wind',text:'風のせいれいをむかえよう',how:"「おく」→「ゆりの種」を植えたり、ブランコを置いたりして風の力をため、朝に神殿の「！」から呼ぶ",check:()=>elemCount('wind')>=1&&NEWRES==null,prog:()=>'風の力 '+Math.floor(ATTR.wind)+'/'+needFor('wind'),
   talk:{who:POKO,when:()=>nextOK(),learn:['swing'],lines:[
    [POKO,'オオカゲを追いはらえて、ほっとしたよ。'],
    [MINA,'つぎは風のせいれいかなぁ。風みたいに、ぴゅーっと村をかけまわる子たちなんだよぉ。'],
    [MINA,'遊ぶのが大好きでねぇ。遠くに落ちてるふしぎな種も、見つけてひろってきてくれるんだぁ。'],
    [MINA,'風の力をためれば、来てくれるはずだねぇ。'],
    [POKO,'#think|風に乗って、ふわっと浮かべたら、たのしそう！ 守り神さまなら、なにか思いつくかな？'],['@idea']]},
   get story(){return KS([['K','フッ…風に呼ばれて来てみれば、ずいぶん素朴な村だね。'],[POKO,'風のせいれいが来た！ これで5つの属性がそろったね！'],['K','いいさ。ぼくの風で、この村をもっと華やかにしてあげよう。'],[MINA,'にぎやかになったねぇ。']])}},
  {id:'lv5',text:'村レベルを5にしよう',check:()=>S.lv>=5,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'オオカゲを追いはらえて、風のなかまも来たね！ みんな、ここで楽しく暮らせるといいな。'],
    [GOD,'#nod|うむ。5つの属性がそろった村じゃ。みなの暮らしを見守りながら、村をもっと育てていこうかの。']]},
   story:[
    [POKO,'ついに、ここまで村が育ったんだね……！'],
    [POKO,'#think|……あれ？ 神殿のそばが、ぽうっと光ってる……！'],
    [MINA,'「想う力」のかけらだねぇ。村のみんなが満足して、想いが集まったから、こたえてくれたんだよぉ。'],
    [POKO,'#joy|みんなの想いが、形になったんだね……！']],gives:{shard:'key'}},
  {id:'tower',text:'守護の台座を建ててもらおう',how:"木材100・石材50を集めて、「おく」→「守護の台座」で置く",check:()=>cnt('tower')>=1,prog:()=>'木材 '+Math.min(100,S.mat.wood||0)+'/100・石材 '+Math.min(50,S.mat.stone||0)+'/50',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'ねえノドカ、ヌシ様をおむかえする「守護の台座」、そろそろ建てられないかな？'],
    [MINA,'台座はねぇ、5つの属性のせいれいがそろって、木と石がたくさんあれば、建てられるよぉ。'],
    [MINA,'台座を建てるのに、なにが足りないか、いっしょに確かめようねぇ。'],
    [MINA,'建てたら、かけらが手に入るたびに、台座にはめていこうねぇ。'],
    [POKO,'よーし、みんなでそろえよう！']],gives:{shrine:true}},
   story:null},
  {id:'green375',text:'みどりのマスを375にしよう',how:"花や木を植え、いろいろ置いて、荒れた土地を緑にする",check:()=>GRASSN>=375,prog:()=>'いま'+GRASSN,
   talk:{who:MINA,when:()=>true,lines:[
    [MINA,'台座もできたねぇ。あとは、ヌシのかけらを3つそなえたら、ヌシ様をおむかえできるらしいよぉ。'],
    [POKO,'ヌシ様に会えるんだね！ ほかには、なにがいるの？'],
    [MINA,'ヌシ様がもどってこられるように、土地をもっと緑にしないとねぇ。'],[MINA,'まずは、村のまわりを緑でいっぱいにしたいねぇ。そのあとは、もっと広く。']]},
   story:[[POKO,'緑がいっぱい！ 歩くだけで気持ちいいね！'],[POKO,'#think|……わっ！？ 地面が、光った！'],[MINA,'えぇっ……！ 草のあいだから、なにか出てきたよぉ。'],[POKO,'#surprise|これ……ヌシのかけら！？'],[MINA,'「育てる力」のかけらだねぇ。みんなで土地を育てたから、こたえてくれたんだよぉ。'],[POKO,'#joy|みんなで植えた草や花が、こたえてくれたんだね！']],gives:{shard:'land'}},
  {id:'wood6',text:'木のせいれいを6人にしよう',how:"花や木を植えて木の力をため、朝に神殿の「！」から呼ぶ。合計6人をむかえる",check:()=>elemCount('wood')>=6&&NEWRES==null,prog:()=>'いま'+elemCount('wood')+'人',
   talk:{who:POKO,when:()=>true,learn:[],lines:[
    [MINA,'ヌシ様は、木のせいれいを生んだんだってぇ。'],
     [MINA,'木のせいれいの子どもたちがにぎやかだと、ヌシ様も帰り道がわかるかもねぇ。木のなかまを6人にしたいねぇ。'],
    [POKO,'木や花を植えて、木の力をためよう！']]},
   story:[[POKO,'木のなかま、6人になった！'],[MINA,'にぎやかだねぇ。']]},
  {id:'flower50',text:'フタバのおねがい：花を50こさかせよう',how:"「おく」で花の種を置いて、花を50こにする",check:()=>flowerN()>=50,prog:()=>'花 '+Math.min(50,flowerN())+'/50',
   talk:{who:POKO,when:()=>true,learn:['campfire'],lines:[
    [POKO,'守り神さま、ひとつ、おねがいしてもいい？'],
    [POKO,'ヌシ様がいたころ、この草原は花でいっぱいだったんだ。ぼく、ちゃんとおぼえてるよ。ヌシ様が帰ってきたとき、さいしょに見てほしいんだ。'],
    [POKO,'花を50こ、さかせたいな！'],
    [MINA,'#think|花が咲いたら、みんなで見に行こうねぇ。夜も花のそばであったかく過ごせたら、ゆっくり見ていられそうだよぉ。守り神さま、いい考えはないかなぁ。'],['@idea']]},
   story:[[POKO,'#surprise|わあ…花畑だ！ ありがとう、守り神さま！'],[POKO,'ヌシ様、見てくれるかな。……会いたいな。'],[MINA,'きっと見てくれるよぉ。フタバのきもち、花からも伝わってくるもんねぇ。']]},
  {id:'nushi',text:'ヌシ様をむかえよう',check:()=>!!S.cleared,prog:()=>'かけら '+Math.min(3,S.setSh||0)+'/3・じょうけん '+clearConds().filter(c=>c[1]).length+'/'+clearConds().length,how:'台座をタップすると、足りないものが見られる。ぜんぶそろうと、影の群れがおしよせる夜が2回つづき、3回目の夜にヨルノオオカゲが来る',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'かけらも、あと少しだね。ヌシ様をむかえる準備、もうすぐかな。'],
    [MINA,'#think|台座にヌシ様の力があつまってくるとねぇ、影たちは、その力にひきよせられて、やってくるんだってぇ。'],
    [MINA,'ヌシ様の力は、あったかいからねぇ。……きっと、何晩も、たくさんの影がおしよせてくるよぉ。'],
    [MINA,'さいごまで守りぬいたら、3つめのかけらがあらわれるはずだよぉ。台座にはめて、ヌシ様をむかえようねぇ。'],
    [POKO,'よーし、みんなで守りぬこう！']]},
   story:null},
];


/* ---------- ステージ2：火山のふもとの村 ---------- */
const PROLOGUE2=[
  [GOD,'さて、次の土地じゃな。'],
  [GOD,'ここは火の山のふもとの村。むかしは、あちこちから温泉がわく、あったかい村じゃった。'],
  [GOD,'じゃが、火のヌシ様が力をうばわれて、地面の熱が冷えきってしもうた。温泉も、いまではただの冷たい水たまりじゃ。'],
  [GOD,'新しい土地じゃから、守り神の力も、また一からじゃな。力がとどくのは、はじめはせまい所だけじゃ。'],
  [GOD,'では、行こうかの。'],
];
const INTRO2=[
  [GOD,'ほい到着〜。ここが火山のふもとの村じゃ。'],
  [HOMURA,'…ん？ あんたが、うわさの守り神かい？'],
  [HOMURA,'あたいはホムラ、火のせいれいさ。この村にのこってるのは、もうあたいひとりだよ。'],
  [HOMURA,'#wave|寒くてかなわないけど…ま、よろしく頼むよ。'],
  [GOD,'まずは神殿じゃな。草原と同じように、置いてみい。'],
];
const QUESTS2=[
  {id:'statue',text:'神殿を建ててもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'下の「おく」→「神殿」をえらび、空いた場所をタップ',story:[
    [HOMURA,'へえ、なかなかいい神殿じゃないか。'],
    [GOD,'じゃろ〜。女神像もおそなえ箱も依頼ボードも、草原といっしょじゃよ。'],
    [GOD,'#danger|食料箱は古い家の中に、素材箱は村の北西に置いといたぞい。コワイノは南から来るからの。かまどやベッド、柵や罠も、おそなえ箱に入れといたからの。'],[HOMURA,'ありがとよ、守り神。']],
   gives:{feat:['inv','remove','plant','craft','people'],flag:'lv_oven',recipes:['oven','bed','stor','mbox'],flags:['yoganLearned'],items:{oven:1,bed:1,hwall:3,fence:10,spike:10},mat:{wood:10,stone:10},enemy:true}},
  {id:'coldSpring',text:'冷たい温泉を調べよう',check:()=>!!S.flags.sprLook,how:'「みる」で、村の水たまりをタップする',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'…なあ守り神。この村、むかしは湯気がもくもく上がってたんだよ。'],
    [HOMURA,'それが、いつのまにか消えちまってさ。そこらの水たまり、みんな温泉だったんだ。'],
    [GOD,'ふむふむ。では、まずは水たまりを見てみようかの。']]},
   story:[
    [HOMURA,'…やっぱり冷たいね。地面の熱が、ぜんぜんとどいてない。'],
    [HOMURA,'この村には、温泉が3つあったんだ。入口の温泉、西の温泉、それと村の奥の温泉さ。'],
    [GOD,'3つとも、よみがえらせたいのう。'],[HOMURA,'いっしょに調べてくれて、ありがとよ。']]},
  {id:'food3',text:'ホムラのおねがい：食料を3つためよう',check:()=>S.food>=3,prog:()=>'食料 '+Math.min(3,S.food)+'/3',how:'せいれいが木の実や畑でとってきた食べ物が、食料箱にたまる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉をなおすのは、ひと仕事だよ。その前に、腹ごしらえだね。'],
    [HOMURA,'あたいからのおねがいさ。食料を3つ、ためておいておくれ。腹いっぱいになったら、あたいもひと働きするよ。']]},
   story:[[HOMURA,'よし、これで村の準備はばっちりだね。ありがとよ、守り神。']],gives:{flag:'hReq'}},
  {id:'springA',text:'温泉をよみがえらせよう',check:()=>S.obj.some((o,j)=>o==='hotstone'&&adjOf(j,k=>S.ground[k]===1&&sprMap()[k]==='a')>=0),how:'「おく」→「ほのお石」をえらんで、入口の温泉（村の南東の温泉）の水べに置く',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'まずは、いちばん近い入口の温泉からだね。'],
    [GOD,'ほのお石を入れといたぞい。入口の温泉の水べに置いて、ホムラの火の力をこめてみい。'],
    [HOMURA,'よし、やってみようじゃないか。']],gives:{items:{hotstone:1}}},
   story:[
    [HOMURA,'…湯気だ！ あったかい湯気が、のぼってきたよ！'],[HOMURA,'#joy|守り神、ありがとよ！ ほんとにありがとう！'],
    [GOD,'夕方は、ここでひとっぷろ浴びるとよいぞ。つかれもとれるし、たのしさもふえるからの。'],
    [GOD,'それに…お湯から、水の力も満ちてきたようじゃな。'],
    [HOMURA,'…ん？ 湯気の中に、なにか光ってる。これ…火のヌシ様のかけらじゃないか！'],
    [GOD,'では、わしはほかの土地を見まわってくるぞい。ときどき遊びに来るからの。わからんことは「ひでんのしょ」を見るんじゃ。ではな〜！']],
   gives:{flag:'onsen',feat:['summon','shop'],shard:'land',godLeave:true}},
  {id:'summon',text:'なかまをむかえよう',check:()=>!!S.flags.minaCame&&NEWRES==null&&!NEWQ.length,how:'朝、神殿の上に「！」が出たら、「みる」で神殿をタップ',
   talk:{who:HOMURA,when:()=>nextOK(),lines:[
    [HOMURA,'お湯から、水の力が満ちてきたね。だれか来てくれるかもしれないよ。'],
    [HOMURA,'なかまか…。にぎやかになるのは、悪くないね。']],gives:{flag:'sumTold'}},
   by:SHIZUKU,story:[
    [SHIZUKU,'はじめまして。水のせいれい、シズクと申します。'],
    [HOMURA,'#wave|へえ、水のせいれいかい。あたいはホムラ。よろしく頼むよ。'],
    [SHIZUKU,'温泉の湯の加減は、おまかせください。…のこりの温泉も、よみがえらせたいですね。'],[SHIZUKU,'#joy|呼んでくださって、ありがとうございます。']]},
  {id:'rockCanal',text:'水路をふさぐ大岩をどかそう',check:()=>st2().bw.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+st2().bw.filter(j=>S.obj[j]!=='boulder').length+'/'+st2().bw.length,how:'西の温泉のそばの大岩は、せいれいが石をほりにいって、くだいてくれる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉を調べてきました。'],
    [SHIZUKU,'温泉に水をはこぶ水路が、大きな岩でふさがれています。'],
    [HOMURA,'岩なら、まかせときな。みんなでくだいてやろうじゃないか。']]},
   story:[[SHIZUKU,'水路に、水がもどりました。'],[SHIZUKU,'でも、まだ冷たいままです。熱が、とどいていないのですね。'],[SHIZUKU,'#joy|大岩をどかしてくださって、ありがとうございます。']]},
  {id:'shizukuRest',text:'シズクのおねがい：温泉のそばに休憩所を作ろう',check:()=>nearSp('bench')&&nearSp('tub'),prog:()=>'ベンチ '+(nearSp('bench')?1:0)+'/1・水おけ '+(nearSp('tub')?1:0)+'/1',how:'依頼ボードで「ベンチ」と「水おけ」をはって、あたたかい温泉のそば（4マス以内）に置く',
   talk:{who:SHIZUKU,when:()=>true,learn:['bench','tub'],lines:[
    [SHIZUKU,'わたしからも、ひとつおねがいがあります。'],
    [SHIZUKU,'温泉から上がると、足を休めたくなります。それに、からだに残ったお湯を、もう少し流せたら……。守り神さま、何かよい方法はありませんか。'],
    [HOMURA,'#think|湯上がりに、ぼんやりできる場所か。いいね。守り神なら、面白いことを考えてくれそうだ。'],['@idea']],gives:{flags:['lv_tub','lv_bench']}},
   story:[[SHIZUKU,'#joy|ありがとうございます。湯上がりのひととき、たいせつにしますね。']],gives:{flag:'sReq'}},
  {id:'lv3',text:'村レベルを3にしよう',check:()=>S.lv>=3,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉がひとつもどっただけで、村の空気がちがうね。'],
    [SHIZUKU,'みなさんが、ここで楽しく暮らしてくだされば、村も育っていきます。'],
    [HOMURA,'よし、もっとにぎやかな温泉郷にしてやろうじゃないか。']]},
   story:[[HOMURA,'村が、ひとまわり大きくなった気がするよ。'],[SHIZUKU,'新しく作れるものも、ふえたようです。']]},
  {id:'haikage3',text:'ハイカゲを3体追いはらおう',check:()=>(st2().ashKills||0)>=3,prog:()=>'ハイカゲ '+Math.min(3,st2().ashKills||0)+'/3',how:'夜に来る灰色の「ハイカゲ」を追いはらう。かまどやベンチを灰でよごして、しばらく使えなくする',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'…守り神。これから夜になると、火山のほうから「ハイカゲ」ってやつも来るよ。'],
    [SHIZUKU,'灰をまきちらして、かまどやベンチを使えなくしてしまうのです。'],
    [HOMURA,'来たら3体追いはらって、こらしめてやろうじゃないか。']],gives:{flag:'ashOn'}},
   story:[[HOMURA,'ふん、これでしばらくは、おとなしくなるだろ。'],[SHIZUKU,'灰でよごれた設備も、しばらくすれば元にもどりますよ。'],[HOMURA,'追いはらってくれて、ありがとよ、守り神。']]},
  {id:'heatPath',text:'ひびわれた熱の道を直そう',check:()=>CRACKS.every(j=>S.obj[j]!=='crack'),prog:()=>'ひびわれ '+CRACKS.filter(j=>S.obj[j]!=='crack').length+'/5',how:'村の北、火山のふもとの「ひびわれ」を「みる」でタップ。石材2で直せる',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。温泉の熱は、火山から地面の下の「熱の道」を通って、とどいていたのです。'],
    [SHIZUKU,'村の北の地面に、ひびわれがあります。そこから熱がもれているようです。'],
    [HOMURA,'石でふさいじまえばいいんだね。']]},
   story:[[HOMURA,'よし、ふさがった！ 熱の道が、つながったよ。'],[SHIZUKU,'あとは、熱をどこへ流すか、ですね。'],[HOMURA,'直してくれて、ありがとよ！']]},
  {id:'springB',text:'熱の装置を左にむけて、西の温泉をよみがえらせよう',check:()=>!!st2().sp.b,how:'火山のふもとの「熱の装置」をタップして、向きを左にかえる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'火山のふもとに、熱の流れを切りかえる装置があるんだ。'],
    [HOMURA,'左にむければ、西の温泉に熱がとどくはずさ。']]},
   story:[[HOMURA,'西の温泉にも、湯気が上がった！'],[SHIZUKU,'すばらしいです。…残るは、奥の温泉ですね。'],[SHIZUKU,'#joy|ありがとうございます、守り神さま。']]},
  {id:'fire3',text:'火のせいれいを3人にしよう',check:()=>elemCount('fire')>=3&&NEWRES==null,how:'ようがん台を置いて火の力をためる。満ちた次の朝、神殿の「！」からなかまを呼ぶ',prog:()=>'火のせいれい '+Math.min(3,elemCount('fire'))+'/3・火の力 '+Math.floor(ATTR.fire)+'/'+needFor('fire'),
   talk:{who:HOMURA,when:()=>nextOK(),lines:[
    [HOMURA,'#think|……なあ、守り神。むかし、この村には、火のせいれいがたくさんいたんだ。'],
    [HOMURA,'#danger|温泉が冷えて、コワイノのうろつく寒い夜がつづいてさ……でも、あたいら火のせいれいは、からだが強いからね。消えずに、ちりぢりに逃げのびたんだ。'],
    [HOMURA,'あたいだけは、この村をはなれられなくて、ひとりでのこったのさ。'],
    [SHIZUKU,'では、みなさん、どこかで元気にしているのですね。西の温泉にも、湯気がもどりました。ぬくもりが伝われば、きっと帰ってきます。'],
    [HOMURA,'#think|……そうだね。火の力をためて、なかまをむかえようじゃないか。']]},
   story:[[HOMURA,'#think|……おかえり。待ってたよ。'],[HOMURA,'ほらね。みんな、ちゃんと生きてたんだ。温泉がもどれば、帰ってくるのさ。'],[SHIZUKU,'にぎやかになりましたね。'],[HOMURA,'ありがとよ、守り神。']]},
  {id:'fest',text:'おまつりをひらこう',check:()=>S.festAtQ==='fest'&&festOn(),prog:()=>S.festDay!=null&&S.festDay>dayNo()?'あしたはおまつり':'',how:'カミサマと交換の「とくべつな交換」で「おまつり」をえらぶ。つぎの日の朝に、おまつりがはじまる',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'#joy|なかまが帰ってきて、村もにぎやかになったねえ。'],
    [HOMURA,'#think|むかしはね、なかまがそろうと、みんなで屋台を出して、おまつりをしたもんさ。'],
    [SHIZUKU,'おまつり……すてきですね。温泉のまわりに、ちょうちんをともして。'],
    [HOMURA,'よし、決まりだ！ 守り神、カミサマにたのんで、おまつりをひらいておくれよ。']]},
   story:[[HOMURA,'#joy|これこれ！ やっぱり、おまつりはいいねえ！'],[SHIZUKU,'#joy|みなさん、いいお顔をしています。'],[HOMURA,'ありがとよ、守り神。また、いつでもひらこうじゃないか。']]},
  {id:'ashiyu',text:'西の温泉に、あし湯をつくろう',check:()=>spNear(['bench','takebench'],'b')>=2&&spNear(FLOWERS2,'b')>=3,prog:()=>'ベンチ '+Math.min(2,spNear(['bench','takebench'],'b'))+'/2・花 '+Math.min(3,spNear(FLOWERS2,'b'))+'/3',how:'西の温泉のそば（4マス以内）に、ベンチを2つと、花を3つ置く（花はさいてから数える）。花を植えるのは、木のせいれい',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'守り神さま。西の温泉は、湯がやわらかくて、足をつけるのにちょうどよいのです。'],
    [HOMURA,'足だけつかって、のんびりおしゃべり……いいね。すわる所と、花でもあれば最高さ。'],
    [SHIZUKU,'あし湯ができたら、みなさんも、きっと遊びに来ますね。'],
    [GOD,'花のたねを3つ、おそなえ箱に入れといたぞい。']],gives:{items:{clover:3}}},
   story:[[SHIZUKU,'あし湯ができました……！ 足だけでも、ぽかぽかします。'],[HOMURA,'花を見ながら、のんびりおしゃべり。いいもんだね。'],[SHIZUKU,'#joy|ありがとうございます、守り神さま。']]},
  {id:'volcano',text:'火山を調べよう',check:()=>!!S.flags.volLook,how:'「みる」で、北の火山をタップする',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の温泉に熱をとどけるには、奥の装置を使うはずです。'],
    [SHIZUKU,'その前に、火山を調べてみませんか。熱の流れが、どうなっているか…。']]},
   story:[[HOMURA,'火山の熱は、ちゃんと生きてるね。'],[SHIZUKU,'でも…山の上から、いやな気配がします。'],[HOMURA,'それと、奥の装置のまわり、大岩だらけだったよ。'],[HOMURA,'いっしょに来てくれて、ありがとよ。']]},
  {id:'rockDeep',text:'奥の装置のまわりの大岩をどかそう',check:()=>BVOL.every(j=>S.obj[j]!=='boulder'),prog:()=>'大岩 '+BVOL.filter(j=>S.obj[j]!=='boulder').length+'/4',how:'大岩は、せいれいが石をほりにいって、くだいてくれる',
   talk:{who:HOMURA,when:()=>true,lines:[[HOMURA,'奥の装置にたどりつくには、まわりの大岩をどかさないとね。'],[HOMURA,'みんな、たのんだよ！']]},
   story:[[HOMURA,'よし、道がひらけた！'],[SHIZUKU,'#scared|…装置が、こわれていますね。'],[HOMURA,'ありがとよ、守り神。']]},
  {id:'springC',text:'奥の装置を直して、奥の温泉に熱をとどけよう',check:()=>!!st2().sp.c,how:'奥の装置をタップして直す（石材8・木材5・ヌシのかけら1つ。かけらは装置にはめるので、なくなる）。手前の装置を右、奥の装置を左にむける',
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'奥の装置を直すには、石材と木材、それに…ヌシ様のかけらの力がいります。'],
    [HOMURA,'入口の温泉で見つけた、あのかけらだね。'],
    [SHIZUKU,'直したら、手前の装置を右に、奥の装置を左にむけてください。熱が、奥の温泉まで流れるはずです。']]},
   story:[[SHIZUKU,'かけらが、装置に熱を通してくれました……！'],[HOMURA,'#surprise|…奥の温泉にも、湯気だ！ 3つ、ぜんぶよみがえったよ！'],[SHIZUKU,'#joy|守り神さま、ありがとうございます。温泉が3つ、よみがえりました。'],[SHIZUKU,'…守り神さま。空が、灰色にくもってきました。'],[HOMURA,'今夜は、ハイカゲがわんさか来そうだね…！']],gives:{flag:'ashNight'}},
  {id:'ashNight',text:'灰の降る夜をのりこえよう',check:()=>{const t=st2();return !!t.ashNightAt&&S.nights>=t.ashNightAt&&!isNight()},how:'今夜はハイカゲがたくさん来る。かまどやベンチをまもろう',
   story:[[HOMURA,'…ふう、なんとかのりこえたね。'],[SHIZUKU,'#danger|守ってくださって、ありがとうございます。'],[SHIZUKU,'灰は、火山からふってきていました。山の上に、なにかがいるのです。'],[HOMURA,'次の夜、きっとそいつが下りてくる。むかえうってやろうじゃないか！']],gives:{flag:'hinoNight'}},
  {id:'hinoookage',text:'ヒノオオカゲを追いはらおう',check:()=>!!S.flags.hinoDown,how:'夜、火山から下りてくる「ヒノオオカゲ」を追いはらう。熱の装置をねらってくる',
   story:[[HOMURA,'#joy|やった…！ 火山の上の、いやな気配が消えたよ。'],[HOMURA,'ありがとよ、守り神！ あんたのおかげさ。'],[SHIZUKU,'ヒノオオカゲが、ヌシ様の熱をうばっていたのですね。'],[SHIZUKU,'落としたかけらは、朝にせいれいが拾ってくれますよ。'],[SHIZUKU,'そのかけらを守護の台座にはめれば、ヌシ様の力になるはずです。'],[HOMURA,'#nod|よし。ヌシ様のために、あとひとふんばりだね！']]},
  {id:'inn',text:'温泉宿をつくろう',check:()=>HOUSES.some(h=>[...h.inside].filter(j=>BEDSET.has(S.obj[j])).length>=2&&[...h.inside].some(j=>nearHot(j,6))),how:'あたたかい温泉のそば（6マス以内）に、家の壁とドアで家をつくり、中にベッドを2つ置く。ベッドを作るのは、木のせいれい',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'ヒノオオカゲもいなくなって、やっと落ちついたね。'],
    [SHIZUKU,'#joy|湯上がりに、そのままゆっくり泊まれる場所があると、うれしいですね。'],
    [HOMURA,'温泉のそばに、宿をつくろうじゃないか。壁でかこって、ベッドを2つ。あたいらで、もてなすのさ。']]},
   story:[[HOMURA,'温泉宿のできあがりだ！'],[SHIZUKU,'湯上がりに、ここでぐっすり休めますね。'],[HOMURA,'ありがとよ、守り神。今夜は、あたいも泊まってみようかな。']]},
  {id:'lv5',text:'村レベルを5にしよう',check:()=>S.lv>=5,how:'せいれいが満足してパワーがたまると、村レベルが上がる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:SHIZUKU,when:()=>true,lines:[
    [SHIZUKU,'温泉郷らしくなってきましたね。'],
    [HOMURA,'あと少しさ。みんなが楽しく暮らせば、ヌシ様をむかえる力もたまる。']]},
   story:[[HOMURA,'村が、また大きく育ったね！'],[SHIZUKU,'ヌシ様をむかえる準備も、ととのってきました。']]},
  {id:'tower',text:'守護の台座を建ててもらおう',check:()=>cnt('tower')>=1,prog:()=>'じょうけん '+clearConds().filter(c=>c[1]).length+'/'+clearConds().length,how:'「おく」→「守護の台座」をえらぶと、足りない条件が見られる。ぜんぶそろったら置いて、建ててもらう',
   talk:{who:HOMURA,when:()=>true,lines:[
    [HOMURA,'温泉郷も、だいぶ元にもどってきたね。'],
    [SHIZUKU,'台座を建てるのに、なにが足りないか、いっしょに確かめましょう。'],
    [SHIZUKU,'#think|……ただ、台座が光ると、山の上にのこった影が気づくかもしれません。'],
    [HOMURA,'そのときは、みんなでむかえうつまでさ。'],
    [SHIZUKU,'それと、温泉の入り口に、のれんをかけたいですね。湯けむりの里らしくなりますよ。'],
    [HOMURA,'よし、仕上げだよ！'],['@idea']],learn:['noren'],gives:{shrine:true}},
   story:null},
];;
const QL=[QUESTS1,QUESTS2],PROS=[PROLOGUE,PROLOGUE2],INTROS=[INTRO,INTRO2];
/* ---------- フリーモード（ステージ1クリアで解放）：自然の力が弱く、せいれいはゆっくり増える。災いはほとんどない ---------- */
const FA=()=>(S&&S.fk||[])[0]||GOD,FB=()=>(S&&S.fk||[])[1]||GOD;
const PROF=[
  [GOD,'おお、いいところを見つけたのう！'],
  [GOD,'ここは自然の力が弱くて、せいれいがなかなか生まれん土地なんじゃ。'],
  [GOD,'そのかわり、災いもほとんど起きん。'],
  [GOD,'つまり、のんびり暮らすにはぴったりというわけじゃな！'],
  [GOD,'まあ、最初はちと寂しいかもしれんが……。'],
  [GOD,'せっかくじゃ！ ここにおヌシだけの村をつくってみんか？'],
  [GOD,'わしも楽しみにしとるぞ！']];
function INTROFL(){return [[FA(),'#surprise|わあ、守り神さまだ！ ぼく、'+FA()+'！ この土地で、ひっそり暮らしてたんだ！'],[FB(),'#surprise|ふわぁ…。'+FB()+'#joy|だよぉ。ふたりきりだったから、うれしいねぇ。'],[GOD,'この土地にも、おヌシの力を集める場所がいるのう。わしの居場所にもなる神殿を建てよう。建てる場所は、おヌシが好きにえらんでよいぞ。']]}
const TOYS4=['swing','sandbox'];
const QUESTSF=[
  {id:'statue',text:'神殿を建ててもらおう',check:()=>cnt('statue')>=1,by:GOD,how:'下の「おく」→「神殿」をえらび、空いた場所をタップ',story:[
    [GOD,'#think|思いついた形は、依頼ボードに描いて伝えるんじゃ。せいれいが手を貸してくれるぞい。力がたまれば、なかまも呼べるからの。'],[GOD,'わしはここで、交換でもしながら見とるからの。']]},
  {id:'ep1',text:'第1話 はじめての居場所：家とベッド2つ',check:()=>HOUSES.length>=1&&houseBedCount()>=2,/* ベッドは家の中に2つ */prog:()=>'家 '+Math.min(1,HOUSES.length)+'/1・ベッド '+Math.min(2,houseBedCount())+'/2',how:'家の壁のすきまをオークの壁でふさぎ、依頼ボードでベッドをたのんで家の中に置く',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえねえ、あそこの家、まだ中がからっぽなの。'],[FB(),'草の上で寝るとねぇ、朝には背中がひんやりしてるんだよぉ。'],[FA(),'ここで、あったかく眠れるようになるかな？ 守り神さま、お願い！'],['@idea']]}},
   get story(){return [[FA(),'#joy|できた！ ぼくたちの家だ！'],[FB(),'ふたりきりのころは、雨の日、木の下でくっついて雨宿りしてたねぇ。'],[FA(),'#nod|うん！ これからは、屋根があるね！'],[FB(),'ここ、日なたがぽかぽかで、お気に入りの場所になりそうだねぇ。']]}},
  {id:'ep2',text:'第2話 みんなの好きなもの：花10・食卓・遊び道具',check:()=>flowerN()>=10&&cnt('table')>=1&&CN(TOYS4)>=1,prog:()=>'花 '+Math.min(10,flowerN())+'/10・食卓 '+Math.min(1,cnt('table'))+'/1・遊び道具 '+Math.min(1,CN(TOYS4))+'/1',how:'花の種を植え、依頼ボードの「家具」で食卓、「遊び」で砂場かブランコをたのむ',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、好きなもの言いっこしよ！ ぼくは、花！'],[FB(),'ぼくは、みんなでごはんを食べるのが好きだねぇ。'],[FA(),'あと、遊ぶのも！ ぜんぶそろったら、きっと毎日たのしいよ！'],['@idea']]}},
   get story(){return [[FA(),'花も、食卓も、遊び道具もある！ 好きなものだらけ！'],[FA(),'ねえ'+FB()+'、ふたりのころ、いっしょに見つけた花、おぼえてる？'],[FB(),'おぼえてるよぉ。あれが、この村のさいしょの花だったねぇ。']]}},
  {id:'ep3',text:'第3話 遠くからのお客さん：せいれいを4人に',check:()=>S.res.length>=4,prog:()=>'せいれい '+Math.min(4,S.res.length)+'/4',how:'花や家具で属性の力をため、朝に神殿の「！」から呼ぶ。この土地では、力がたまるのがゆっくり',
   talk:{who:GOD,when:()=>true,lines:[[GOD,'この村も、ちょっとずつにぎやかになってきたのう。'],[GOD,'なかまが4人になったら、遠くからお客さんが来るかもしれんぞ？ ほっほっ。']]},
   get story(){const ids=['hedge'].filter(id=>recipeKnown(id)),gift=ids.length?'草原で見つけたかざりを、おみやげに持ってきたよ！ よかったら使ってね！':'シロツメクサの種を、おみやげに持ってきたよ！ よかったら植えてね！';return [[POKO,'#wave|こんにちはー！ ぼく、はじまりの草原から来たフタバ！'],[POKO,'#surprise|守り神さまの新しい村、見に来ちゃった！ わあ、すてきなところだね！'],[FA(),'#surprise|わあ、お客さんだ！ いらっしゃい！'],[POKO,'草原にはね、花がいっぱいの広場があるんだ！ '+gift],[GOD,'遠くの友だちが訪ねてくる村は、いい村になってきた証拠じゃよ。']]},get gives(){const items={};for(const[id,n]of[['hedge',3]])if(recipeKnown(id))items[id]=n;if(!Object.keys(items).length)items.clover=5;return{items}}},
  {id:'ep4',text:'第4話 ここが好き！：噴水の広場',check:()=>cnt('fountain')>=1,prog:()=>'噴水 '+Math.min(1,cnt('fountain'))+'/1',how:'「おく」から噴水をえらび、みんなで眺められる場所に建てる',
   talk:{get who(){return FB()},when:()=>true,get lines(){return [[FB(),'みんなで、のんびりできる広場があったらいいねぇ。'],[FA(),'#joy|水がきらきらして、みんなで眺められたらうれしいな！'],['@idea']]}},
   get story(){return [[FA(),'ここ、だーいすき！'],[FB(),'水の音を聞きながら、みんなでのんびりできるねぇ。'],[FA(),'#nod|うん！ ここで、ゆっくりしていこう！'],[FB(),'この広場、大切な場所になりそうだねぇ。']]}},
  {id:'ep5',text:'最終話 みんなのふるさと：たき火とせいれい6人',check:()=>cnt('campfire')>=1&&S.res.length>=6,prog:()=>'たき火 '+Math.min(1,cnt('campfire'))+'/1・せいれい '+Math.min(6,S.res.length)+'/6',how:'火のせいれいに、たき火を作ってもらう。なかまを6人に',
   talk:{get who(){return FA()},when:()=>true,get lines(){return [[FA(),'ねえ、村のお祭りしようよ！'],[FB(),'夜もあったかいところで、みんなで踊れたら、楽しいだろうねぇ。'],[GOD,'#nod|うむ！ なかまが6人そろったら、盛大にやるとしようかの！'],['@idea']]}},
   get story(){return [[GOD,'おお、にぎやかじゃのう！ ほれ、もっと踊らんか！'],[FA(),'#think|……ねえ'+FB()+'。ふたりだけだったころ、おぼえてる？'],[FB(),'#cry|おぼえてるよぉ。しずかで、ちょっとさみしくて……でも、きみがいたから、へいきだったねぇ。'],[FA(),'いまは、こんなにいっぱい！ 守り神さまが来てくれたからだね。'],[FB(),'ここが、みんなの帰る場所になったんだねぇ。'],[FA(),'ここが、ぼくたちのふるさとだね！'],[GOD,'物語はひと区切りじゃが、村づくりはまだまだこれからじゃぞ！']]},gives:{fest:true}},
];
function freeFest(){for(const r of S.res){r.fun=100;spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))}startClap();setTimeout(endClap,3200);S.cleared=true;S.clearDay=dayNo();memo('🎉','村のお祭りをひらいた');logEv('村のお祭りをひらいた');toast('物語はひと区切り！ 村づくりはつづくよ','good')}
function freeSetup(s){const used=new Set(['フタバ','ノドカ']);const nm=()=>{let n;do{n=NAMES[s.nameIdx%NAMES.length];s.nameIdx++}while(used.has(n));used.add(n);return n};
  const a=nm(),b=nm();s.res=[mkRes(s,a,'wood',CX+.5,CY-1.5,'swing'),mkRes(s,b,'earth',CX+1.5,CY-1.5,'chat')];s.fk=[a,b];s.keyN={wood:a,earth:b};
  s.flags.minaCame=true;s.flags.sumTold=true;s.flags.tapped=true;s.free=1;
  Object.assign(s.feat,{inv:true,craft:true,remove:true,plant:true,people:true,shop:true,summon:true});
  s.fs={berry:12};s.food=12;s.mat={wood:20,stone:20};s.pt=40;
  for(let j=0;j<W*H;j++)if(s.obj[j]==='deadtree')s.obj[j]=Math.random()<.5?'ntree':'';
  for(let d=3;d<=5;d++){const j=(CY-2)*W+CX-d;s.obj[j]='hwall';s.floor[j]='';s.hp[j]=BL.hwall.hp}/* 家はこわれていない */
  putNear(s,'stor',CX+3,CY+1);putNear(s,'mbox',CX+5,CY+1);
  for(const k of ['tree','bellf','salvia','lily','lotus','clover'])if(BL[k]){s.unlocked[k]=true}
  s.inv=Object.assign(s.inv||{},{bellf:3,salvia:3,lily:3,lotus:3,clover:9});
  let c2=false;try{const t=KV.getItem(SAVE_KEYS[1]);c2=!!(t&&JSON.parse(t).cleared)}catch(e){}if(c2){s.inv.hotstone=(s.inv.hotstone||0)+2;s.flags.giftV=1}/* 火山の村をクリアしていたら、ほのお石もとどく */syncQuestRecipes(s)}
QL[FREE]=QUESTSF;PROS[FREE]=PROF;INTROS[FREE]=[];

let QUESTS=QUESTS1;
function setWorld(w){WD=w||0;QUESTS=QL[WD];KEYRES=KEYS[WD];soupFilter()}
function soupFilter(){RECIPES=WD===0?ALLRECIPES.filter(R=>R.out!=='soup'):ALLRECIPES}/* キャベツスープはステージ2から（ステージごとに、使うレシピのリストをえらぶ） */
// 守護の台座を建てるための条件
const TOWER_MAT=()=>WD===1?{wood:150,stone:75}:{wood:100,stone:50};/* 台座を建てるときに使う木材・石材 */
function towerConds(){if(WD===1)return clearConds();const tm=TOWER_MAT();return [
  ['5つの属性のせいれいがそろう（いま'+ELEM_KEYS.filter(k=>elemCount(k)>=1).length+'/5）',ELEM_KEYS.every(k=>elemCount(k)>=1)],
  ['素材箱に'+(tm.wood+tm.stone)+'こ入る（いま'+matCap()+'こ）',matCap()>=tm.wood+tm.stone],/* 素材箱が小さいと、台座の素材がためられない */
  ['木材'+tm.wood+'・石材'+tm.stone+'（いま'+(S.mat.wood||0)+'・'+(S.mat.stone||0)+'）',(S.mat.wood||0)>=tm.wood&&(S.mat.stone||0)>=tm.stone]]}
const shLeft=()=>Math.max(0,(S.shards||0)-(S.usedSh||0));/* 火山のふもと：まだ使っていないかけらの数（装置と台座にはめると減る） */
const towerReady=()=>towerConds().every(c=>c[1]);
function clearConds(){if(WD===1){const tm=TOWER_MAT(),n=springDone(),fac=['bench','tub','noren'].filter(nearSp).length;return [
  ['温泉3か所をよみがえらせる（いま'+n+'）',n>=3],
  ['ヒノオオカゲを追いはらい、奥の装置を直す',!!S.flags.hinoDown&&!!(S.st2&&S.st2.d2fix)],
  ['温泉のそばに、ベンチ・水おけ・のれん（いま'+fac+'/3）',fac>=3],
  ['ホムラとシズクのおねがい',!!S.flags.hReq&&!!S.flags.sReq],
  ['台座にはめるヌシのかけら（いま'+shLeft()+'つ）',shLeft()>=1],
  ['素材箱に'+(tm.wood+tm.stone)+'こ入る（いま'+matCap()+'こ）',matCap()>=tm.wood+tm.stone],/* 素材箱が小さいと、台座の素材がためられない */
  ['木材'+tm.wood+'・石材'+tm.stone+'（いま'+(S.mat.wood||0)+'・'+(S.mat.stone||0)+'）',(S.mat.wood||0)>=tm.wood&&(S.mat.stone||0)>=tm.stone]]}
  const tm=TOWER_MAT(),[el,need,pw]=WD===1?['fire',6,750]:['wood',6,3000],nm=ELEM[el].name;return [
  [nm+'のせいれい'+need+'人（いま'+elemCount(el)+'人）',elemCount(el)>=need],
  ['守護の台座を建てる',cnt('tower')>=1],
  ['台座にヌシのかけらを2つはめる（いま'+Math.min(2,S.setSh||0)+'つ）',(S.setSh||0)>=2],
  ['みどりのマス'+GRASS_GOAL+'（いま'+GRASSN+'）',GRASSN>=GRASS_GOAL],
  ['せいれいパワーを'+pw+'集める（いま'+Math.floor(S.totalPt)+'）',S.totalPt>=pw]]}
const clearReady=()=>clearConds().every(c=>c[1]);
function finalCheck(){if(WD||!S||S.cleared||S.finalNight||S.finalOn||!S.enemyOn||S.flags.finalWon)return;/* 勝ったあとは、もう来ない */if(S.finalLost!=null&&dayNo()-S.finalLost<3)return;if(S.res.length<5)return;if(!S.res.some(r=>r.name===POKO))return;/* フタバがいるときだけ *//* ヨルノオオカゲに負けたら3日あける。せいれいが5人以上になってから */if(cnt('tower')>=1&&clearReady()){
  if(S.finalDay==null){if(isNight())return;S.finalDay=dayNo()+3;S.finalHint=3;memo('🌑','夜の空気が、すこし重くなってきた');talkOnce('finalAnn'+S.finalDay,sevLines([['F','#think|……ねえ。なんだか、夜の風がつめたくなってきた気がする。'],['N','台座の力に、なにかが気づいたのかもしれないねぇ……。',1]]),0);return}/* 予告：すぐには来ない。3日後の夜に来る */
  const left=S.finalDay-dayNo();if(left>0){if(left<S.finalHint&&!isNight()){S.finalHint=left;toast(left===2?'遠くの森が、いつもより静かだ……':'夜になると、影がざわめいている気がする……','warn')}return}/* 日ごとに、少しずつにおわせる */
  S.finalNight=true;const rn=S.rushN||0;if(!rn)memo('🌑','台座の力に、影たちがひきよせられてきた');setTimeout(()=>toast(rn===0?'台座にあつまった力に、影たちがひきよせられている……。今夜、群れがやってくる':rn===1?'影の群れは、まだあきらめていない……。今夜も来る':'今夜は、もっと大きな影の気配がする……','warn'),900)}}/* 予告から3日後の夜から：影の群れの夜が2回、3回目の夜にヨルノオオカゲ（負けたあとは、ヨルノオオカゲの夜だけ） */

/* ---------- 状態 ---------- */
let S=null;
const resv=new Map();
let STATUE=-1,OBOX=-1,BOARD=-1,counts={},LIGHTS=[],LITP=[],STELES=[],TOWERS=[],NEARFLOWER=new Set(),NEARWELL=new Set(),NEARMILL=new Set(),NEARVANE=new Set(),NEARSIGN=new Set(),NEARPARA=new Set(),SPOTJ=new Map(),SPOTM=new Map(),SPOTI=[],RUGC=new Map(),RFC=new Map(),ENVG=null,REV=new Set(),ATTR={},BASEPCT=0,GRASSN=0;const GRASS_GOAL=2500;
function newState(w){w=w||0;
  const s={v:8,mig:9,flags:{berryHalf:1,berryHalf2:1,land2:1,land3:1,land4:1},placed:{},feat:{build:true},inv:{},orders:[],enemyOn:false,nights:0,godGone:false,godShown:false,nushi:null,
    lv:1,bossKills:0,nightHurt:0,nightHad:false,wave:null,lastWarn:0,
    ref:{},ground:new Array(W*H).fill(0),floor:new Array(W*H).fill(''),obj:new Array(W*H).fill(''),dyn:{},hp:{},
    res:[],enemies:[],pt:25,totalPt:0,food:0,fs:{},cseed:{imo:4},crops:{imo:true},mat:{wood:0,stone:0},regrow:[],t:w===0?15*60:12*60,/* 草原は15時からはじまる */speed:1,
    unlocked:{floor:true,farm:true,fence:true,hwall:true},bulk:false,stamps:false,quest:0,cleared:false,rain:false,seeds:[],nameIdx:2,introSeen:false,lastMorning:1,lastNight:0,subDone:{},drops:[],shards:0,gotMat:{wood:0,stone:0},recipes:{},buried:[],nid:1,kills:0,deaths:0};
  s.world=w;genWorld(s,w);
  if(w===1)s.res.push(mkRes(s,HOMURA,'fire',CX+.5,CY-1.5,'campfire'));else s.res.push(mkRes(s,'フタバ','wood',CX+.5,CY-1.5,'swing'));
  if(w===FREE)freeSetup(s);
  return s;
}
function putNear(s,id,cx,cy){for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const k=(cy+dy)*W+cx+dx;if(!s.obj[k]&&s.ground[k]!==1&&!s.floor[k]){s.obj[k]=id;return}}}
function ensureStor(s){for(const id in BL){const b=BL[id];if(b&&(b.offerOnly||b.shopOnly)&&b.kind==='furn'){if(s.recipes)delete s.recipes[id];if(s.guardianIdeas)delete s.guardianIdeas[id]}}/* おそなえされる家具は、レシピとして出さない（セーブからも消す） */
  {const nm=new Set();for(let j=0;j<s.obj.length;j++)if(s.obj[j]==='grave'&&s.dyn&&s.dyn[j]&&!s.dyn[j].buried)nm.add(s.dyn[j].name);for(const r of s.res||[])if(r.coffin)nm.add(r.coffin.name);if(!s.wipe)for(const L of[s.buried||[],s.lost||[]])for(const q of L)if(nm.has(q.name))q.unb=true}/* まだ埋葬されていない子は、よみがえらせない */
  for(const k in s.hp||{})if(/^\d+$/.test(k)&&typeof s.hp[k]==='number')s.hp[k]=Math.ceil(s.hp[k]);/* 耐久は整数 */
  if(!s.lost)s.lost=[];syncQuestRecipes(s)}

/* 特性：ひとりにひとつ。キーキャラは決まっている */
const TRK=el=>Object.keys(TRAITS).filter(k=>k!=='kizuna'&&k!=='tane'&&k!=='nebari'&&(k!=='ryouri'||el==='fire'));/* たねはこびは風の子だけ（mkRes）。料理じょうずは火の子だけ（料理をするのは火の子） */const TRAITS={hayaashi:['はやあし','歩く速さ1.25倍'],hataraki:['はたらきもの','作業の速さ1.25倍'],shukaku:['しゅうかく上手','畑や木の実の収穫+1'],kikori:['木こり','木を切ると、木材+1'],ishiku:['石工','石をほると、石材+1'],chikara:['力もち','持てる数+2'],shoshoku:['小食','おなかのへる速さ0.8倍'],tafu:['タフ','つかれる速さ0.75倍'],nebari:['ねばりづよい','つかれる速さ0.75倍・つかれのとれる速さ2倍'],kizuna:['めぐり','消えても、次の朝にもどってくる'],/* ねばりづよい・めぐりは、キーキャラだけ（TRK でのぞく）。ねばりづよいは、章のはじめからいる子 */genki:['元気いっぱい','たのしさのへる速さ0.6倍'],ryouri:['料理じょうず','料理にかかる時間0.7倍'],tane:['たねはこび','外のふしぎな種を拾いに行く（風のせいれいはみんな）']};
const EL_WORK={water:1.3,earth:.75},EL_STA={water:.7,earth:1.45};/* 属性ごとの作業スピード・スタミナ */
const trt=(r,k)=>!!(r&&r.vr&&r.vr.tr===k),recK=r=>trt(r,'nebari')?2:1;/* recK：つかれのとれる速さ（ねばりづよい子は2倍） */
/* せいれいごとのばらつき：色(h色相・l明るさ)、まつ毛・ほっぺ、足の速さ・食べる量・力 */
const KEYVR={'フタバ':{key:true,tr:'nebari',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.18},'ノドカ':{key:true,tr:'tafu',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.02},'ホムラ':{key:true,tr:'nebari',pk:'fireA',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.08},'シズク':{key:true,tr:'hataraki',h:0,l:0,lash:false,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.12},'ホノ':{key:true,tr:'',pk:'fireB',h:-6,l:.04,lash:false,cheek:false,spd:1,eat:1,pow:1,sta:1,vo:.95},'アオ':{key:true,tr:'shoshoku',h:8,l:0,lash:true,cheek:false,spd:1,eat:1,pow:1,sta:1,vo:1.12},'フウ':{key:true,tr:'hayaashi',h:0,l:-.03,lash:true,cheek:true,spd:1,eat:1,pow:1,sta:1,vo:1.05}};
function mkVar(name,el){if(KEYVR[name])return Object.assign({},KEYVR[name]);const R=()=>Math.random()*2-1;const sg=Math.random()<.5?-1:1;return{h:Math.round(sg*(12+Math.random()*33)),l:Math.round(R()*14)/100,lash:Math.random()<.4,cheek:Math.random()<.5,spd:Math.round((1+R()*.2)*100)/100,eat:Math.round((1+R()*.2)*100)/100,pow:Math.round((1+R()*.25)*100)/100,sta:Math.round((1+R()*.2)*100)/100,vo:Math.round((1.12+R()*.16)*100)/100,tr:pick(TRK(el))}}
function mkRes(s,name,elem,x,y,like){
  return {id:s.nid++,xp:0,xpf:0,name,elem,color:ELEM[elem].body,x,y,hunger:80,energy:85,fun:70,like:like||pick(LIKE_KEYS.filter(k=>(k!=='slide'||WD===4)&&(NIGATE[elem]||{})[k]==null)),act:null,path:[],starve:0,bubble:'',face:1,hidden:false,hurt:0,vr:mkVar(name,elem)};
}

function genWorld(s,w){
  const R=mulberry(w===1?20261102:w===FREE?20261022:20261018),V=w===1;/* V：火山のふもと */
  const pond=(cx,cy,rx,ry)=>{const a=R()*6.28,b=R()*6.28,e=R()*6.28;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,th=Math.atan2(dy,dx),lim=1+.2*Math.sin(2*th+a)+.13*Math.sin(3*th+b)+.07*Math.sin(5*th+e);if(Math.hypot(dx,dy)<lim)s.ground[y*W+x]=1}};
  if(V){pond(OFF+12,OFF+58,3.4,2.4);pond(OFF+60,OFF+14,2.8,2);pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(HSPC.b[0],HSPC.b[1],2.4,1.7);pond(HSPC.c[0],HSPC.c[1],2.2,1.6)}/* 温泉（はじめは冷えている） */
  else{pond(OFF+8,OFF+10,5,3.6);pond(OFF+11.5,OFF+12.5,3,2.2);pond(OFF+62,OFF+60,6,3.6);pond(OFF+58.5,OFF+58,2.6,2);pond(OFF+60,OFF+8,3,2.4);pond(CX+4.8,CY+4.8,2.4,1.7);pond(CX+6.4,CY+3.7,1.3,1);pond(CX+3.6,CY+6.6,1.2,.9);pond(10,30,4,3);pond(96,70,4.5,3);pond(40,98,3.5,2.6);pond(80,6,3,2.2)}/* 外がわにも池 */
  for(let pass=0;pass<2;pass++){const g=s.ground.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x,n=(g[j-1]===1)+(g[j+1]===1)+(g[j-W]===1)+(g[j+W]===1);if(g[j]===1&&n<=1)s.ground[j]=0;else if(g[j]!==1&&n>=3)s.ground[j]=1}}
  for(let y=CY+12;y<H;y++)s.floor[y*W+CX]='path';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x;if(s.ground[i]===1)continue;
    const dx=Math.max(Math.abs(x+.5-CX)-8,0),dy=Math.max(Math.abs(y+.5-CY)-8,0),out=Math.max(dx,dy);
    if(x===CX&&y>=CY+11)continue;
    const ox=x-OFF,oy=y-OFF,forest=V?(ox<14&&oy<16):(ox>54&&oy<24)||(ox<16&&oy>48);/* 森は、前からの土地の角から、外がわへつづく */
    const r=R();
    if(out<1.2){ // 基地の中：枯れ木と岩がちらばる
      const core=Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7;
      if(!core&&r<(V?.03:.05))s.obj[i]='deadtree';else if(!core&&r<(V?.09:.08))s.obj[i]='rock';else if(V&&!core&&r<.12)s.obj[i]='bamboo';/* 火山：基地の中にも竹が少し */
      continue}
    if(forest){if(r<.38)s.obj[i]=V&&r>=.19?'bamboo':w===FREE?'ntree':'deadtree';/* 火山の森は、枯れ木と竹が半分ずつ *//* 敷地の外の木は、みんな枯れている（フリーモードはべつ） */else if(r<.42)s.obj[i]='rock';else if(r<.435){s.obj[i]='berry';s.dyn[i]={g:100}}}/* ベリーの茂みは、前の4分の1 */
    else if(V){if(r<.05)s.obj[i]='deadtree';else if(r<.13)s.obj[i]='rock';else if(r<.1375){s.obj[i]='berry';s.dyn[i]={g:100}}else if(r>=.16&&r<.17)s.obj[i]='deadtree';else if(r<.19)s.obj[i]='bamboo'}/* 火山のふもとは岩が多い。竹も少し */
    else{if(r<.07)s.obj[i]='deadtree';else if(r<.1)s.obj[i]='rock';else if(r<.1075){s.obj[i]='berry';s.dyn[i]={g:100}}else if(r>=.13&&r<.15)s.obj[i]=w===FREE?'ntree':'deadtree'}
  }
  for(let y=CY-8;y<CY+12;y++)s.floor[y*W+CX]='path';
  if(!V&&w!==FREE){let best=-1,bd=1e9;for(let y=CY-6;y<=CY+6;y++)for(let x=CX-6;x<=CX+6;x++){const j=y*W+x;if(s.ground[j]===1||s.obj[j]||s.floor[j]||x===CX)continue;if([j-1,j+1,j-W,j+W].some(k=>s.ground[k]===1))continue;const d=Math.hypot(x+.5-(CX-3),y+.5-(CY+3));if(d<bd){bd=d;best=j}}if(best>=0)s.obj[best]='ntree'}/* 草原の拠点に、森の木が1本だけ（ほかの木は、みんな枯れている） */
  if(V){/* 火山のふもと：南西に古い家（下の壁がくずれている）、北東に2×2の畑、砂利の道が十字に通る */
    const x0=CX-9,x1=CX-4,y0=CY+3,y1=CY+7;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const j=y*W+x;s.obj[j]='';s.ground[j]=0;const edge=x===x0||x===x1||y===y0||y===y1;if(!edge){s.floor[j]='floor';continue}if(y===y1&&x>=x0+1&&x<=x0+3){s.floor[j]='';continue}/* はじめは壁がこわれている（クエストで直す） */const door=x===x1&&y===CY+5;s.obj[j]=door?'door':'hwall';s.floor[j]=door?'gravel':'';if(!door)s.hp[j]=BL.hwall.hp}
    for(let x=x1+1;x<CX;x++){const j=(CY+5)*W+x;s.obj[j]='';s.floor[j]='gravel'}/* 家の戸口から、砂利の道へ */
    for(let x=CX-7;x<=CX+8;x++)if(!s.obj[(CY+1)*W+x])s.floor[(CY+1)*W+x]='gravel';for(let y=CY+2;y<CY+12;y++)s.floor[y*W+CX]='gravel';
    for(let y=CY-5;y<=CY-4;y++)for(let x=CX+3;x<=CX+4;x++){const j=y*W+x;s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}}/* 最初の畑は4つ（2×2）。作物は、はじめはいもだけ */
  else{const hx=dx=>CX+dx;
  for(let d=3;d<=6;d++)for(let y=CY-5;y<CY-2;y++)s.floor[y*W+hx(-d)]='floor';
  for(let d=1;d<=2;d++)s.floor[(CY-4)*W+hx(-d)]='path';
  for(let y=CY-6;y<=CY-2;y++)for(let d=2;d<=7;d++){if(d>2&&d<7&&y>CY-6&&y<CY-2)continue;const x=hx(-d),j=y*W+x;if(y===CY-2&&d>=3&&d<=5)continue;/* はじめは壁がこわれている（クエストで直す） */s.obj[j]=(d===2&&y===CY-4)?'door':'hwall';s.floor[j]=s.obj[j]==='door'?'path':'';if(s.obj[j]==='hwall')s.hp[j]=BL.hwall.hp}
  for(let d=1;d<=4;d++){const j=(CY-4)*W+hx(d);s.obj[j]='farm';s.floor[j]='';s.dyn[j]={g:50,wet:0,crop:'imo'}}/* 最初の畑は4つ。家の道をはさんだ向かいに横1列。作物は、はじめはいもだけ */
  }
  if(V){const put=id=>{let best=-1,bd=1e9;for(let y=CY-7;y<CY;y++)for(let x=CX-6;x<CX;x++){const j=y*W+x;if(s.ground[j]===1||s.obj[j]||s.floor[j])continue;if([j-1,j+1,j-W,j+W,j-W-1,j-W+1,j+W-1,j+W+1].some(k=>s.ground[k]===1||s.obj[k]==='stor'||s.obj[k]==='mbox'))continue;const d=Math.hypot(x+.5-(CX-3),y+.5-(CY-3.5));if(d<bd){bd=d;best=j}}if(best>=0)s.obj[best]=id};{const j=(CY+4)*W+CX-8;s.obj[j]='stor';s.floor[j]='floor'}put('mbox');for(let y=CY-13;y<CY-8;y++){const j=y*W+CX;if(!s.obj[j]&&s.ground[j]!==1)s.floor[j]='path'}st2Place(s)}/* 火山のふもと：食料箱は古い家の中、素材箱は村の北西に（コワイノは南から来るので） */
  genLand(s,w)/* 川と段差（いちばん最後：ほかの物をおいたあと） */
}

/* ---------- 火山のふもと（ステージ2）：温泉3か所・火山・熱の道 ---------- */
const HSPC={a:[CX+4.8,CY+4.8],b:[CX-8.5,CY-8],c:[CX+.5,CY-15]},SPN={a:'入口の温泉',b:'西の温泉',c:'奥の温泉'};
const VOLJ=(OFF+1)*W+(CX-1),D1=(OFF+9)*W+(CX-4),D2=(CY-18)*W+(CX+5),CRACKS=[-2,-1,0,1,2].map(d=>(OFF+9)*W+CX+d),BVOL=[D2-1,D2+1,D2-W,D2+W];
const ASHT=new Set(['oven','bench','takebench','tub','sink','campfire','hotstone']);
const NATK=['rock','deadtree','ntree','berry','bamboo','takenoko'];
const festOn=()=>!!S&&WD===1&&S.festDay!=null&&(S.festDay===dayNo()||S.festDay===dayNo()-1&&hour()<6);/* おまつり：その日の朝6時まで */
function festStart(){S.festN=(S.festN||0)+1;/* おまつりをひらいた回数 */const L=WD===1?[[HOMURA,'おまつりかい！ ちょうちんの火、いい色だねえ。'],[SHIZUKU,'みなさんで、おどりましょう。ごちそうもありますよ。'],[HOMURA,'たまには、こういう日もいいもんさ。']]:[[POKO,'#surprise|わあ、おまつりだ！ ちょうちんが、いっぱい！'],[MINA,'みんなで、おどろうねぇ。ごちそうもあるよぉ。'],[POKO,'ヌシ様にも、この景色を見せてあげたいな。']];talkOnce('fest1',L.filter(l=>S.res.some(r=>r.name===l[0])))}/* はじめてのおまつりの会話 */
function festBegin(){S.festAtQ=QUESTS[S.quest]&&QUESTS[S.quest].id;/* どのクエストのときにひらいたか（前にひらいたおまつりは、クエストの数に入れない） */for(const r of S.res){r.fun=100;r.energy=100;spawnFX(r.x-.5,r.y-.6,'#ffd84a')}sfx('level');toast('おまつりがはじまった！ 屋台がならんでいる','good');festStart()}/* おまつりの朝：せいれいの半分が、屋台の店番をする */
function festGift(){if(S.festDay==null||S.festDay>=dayNo()||S.festGot===S.festDay)return;S.festGot=S.festDay;const fl=['salvia','lotus','lily','clover','bellf'].filter(id=>S.unlocked[id]);/* おまつりのおみやげ：はじめはちょうちん。あとは、ちょうちんか、おぼえた花のたね5つ */
  if(!S.flags.festGift1||!fl.length||Math.random()<.4){S.flags.festGift1=1;giveItem('chochin',1);toast('おまつりのおみやげ：おまつりのちょうちん','good')}else{const id=pick(fl);giveItem(id,5);toast('おまつりのおみやげ：'+BL[id].name+'のたね5つ','good')}renderPalette()}
const FESTC={k:null,L:[]};function festPoles(){const r=12,k=WD+':'+r;if(FESTC.k!==k){FESTC.k=k;const L=[],a=CX-r-1,b=CX+r,c=CY-r-1,d=CY+r,n=b-a,m=Math.ceil(n/4);for(let i=0;i<=m;i++){const t=Math.round(i*n/m);L.push([a+t,c],[a+t,d]);if(i>0&&i<m)L.push([a,c+t],[b,c+t])}FESTC.L=L.filter(([x,y])=>x>=0&&y>=0&&x<W&&y<H)}return FESTC.L}/* おまつりのちょうちんの柱：神殿のまわり24×24マスの1マス外を、4マスくらいずつ（かどにも1本） */
function drawFestPole(x,y,now){if(!FESTA.ok)return;const h=hour(),on=h>=18||h<6,f=FESTA.F[on?'pole_on':'pole_off'],x0=x*TS+16-7,y0=y*TS+30-f[3];shadow(ctx,x*TS+16,y*TS+29,6,2);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(FESTA.img,f[0],f[1],f[2],f[3],x0,y0,f[2],f[3]);ctx.imageSmoothingEnabled=sm;
  if(on){const lx=x0+17,ly=y0+20,g=ctx.createRadialGradient(lx,ly,1,lx,ly,14);g.addColorStop(0,'rgba(255,190,110,.35)');g.addColorStop(1,'rgba(255,190,110,0)');ctx.fillStyle=g;ctx.fillRect(lx-14,ly-14,28,28)}}/* 夕方からちょうちんがともる */
const STALLM={wood:{nm:'りんごあめ',e:'🍭',col:'#d8452f',L:[['f','ringoame',15]]},fire:{nm:'たこ焼き・焼きそば',e:'🐙',col:'#e07a2a',L:[['f','takoyaki',20],['f','yakisoba',20]]},water:{nm:'かき氷',e:'🍧',col:'#4a8fd8',L:[['f','kakigori',15],['mebuki',400]]},earth:{nm:'ポテト',e:'🍠',col:'#9a6a3a',L:[['f','yakiimo',15]]},wind:{nm:'わたあめ・わなげ',e:'🍬',col:'#3aa88a',L:[['f','wataame',15],['chochin',60]]}};/* せいれいの屋台：店番の子の属性で、売る物がかわる。['f',食べ物,パワー]は5つ。木材・石材は売らない */
const STALLSAY=['いらっしゃい！','どれにする？','できたてだよ！','おまつりだから、とくべつだよ！'];
function festStalls(){if(!festOn()||STATUE<0||hour()<7)return [];const sh=Math.min(4,Math.floor((hour()-7)/3)),k=dayNo()+':'+sh;if(S.fst&&S.fst.k===k)return S.fst.L;/* 3時間ごとに店番が交代 */
  const R=S.res.filter(r=>!r.hidden),n=Math.floor(R.length/2),r0=12,y=CY-r0-1,P=[];
  for(let d=0;P.length<n&&d<=r0;d+=3)for(const x of d?[CX-d,CX+d]:[CX]){if(P.length>=n||x-1<CX-r0||x+1>CX+r0-1)continue;if([x-1,x,x+1].every(q=>walk(y*W+q)&&!S.obj[y*W+q])&&walk((y+1)*W+x))P.push(x)}/* 屋台は、ちょうちんの柱の上がわの列に、まんなかから3マスずつならべる */
  const C=R.map(r=>({r,n:(r.fkD===dayNo()?r.fkN||0:0)+Math.random()*.5})).sort((a,b)=>a.n-b.n),K=[],el=new Set();for(const c of C)if(K.length<P.length&&!el.has(c.r.elem)){el.add(c.r.elem);K.push(c.r)}for(const c of C)if(K.length<P.length&&!K.includes(c.r))K.push(c.r);/* まだ店番をしていない子から。属性はなるべくばらばらに */
  for(const r of K){if(r.fkD!==dayNo()){r.fkD=dayNo();r.fkN=0}r.fkN++}
  S.fst={k,L:K.map((r,i)=>({x:P[i],y,id:r.id,el:r.elem}))};return S.fst.L}
function festSpot(G,f,maxD){const L=[];for(let k=0;k<W*H;k++){const d=G.dist[k];if(d<0||d>maxD||!walk(k)||S.obj[k]||roomOf(k)||(TAKEN&&TAKEN.has(k))||!f(k))continue;L.push(k)}return L.length?pick(L):-1}/* 条件にあうマスから、ランダムに1つ */
function festAct(r,G){if(STATUE<0)return false;const h=hour(),ib=k=>VILL[k];
  if(h>=20&&h<21){const j=festSpot(G,ib,12);if(j>=0){startAct(r,G,'hanabi',j);return true}return false}/* 夜8時から9時は、花火を見る */
  if(h<7||h>=22)return false;if(r.fyD!==dayNo()){r.fyD=dayNo();r.fyN=0}
  {const t=festStalls().find(t=>t.id===r.id);if(t){startAct(r,G,'shopkeep',(t.el==='wind'?t.y+1:t.y)*W+t.x,{sk:S.fst.k});return true}}/* 店番の子は、自分の屋台へ（わたあめの屋台は、屋台の前） */
  const x=Math.random();
  if(x<.3){const cx=STATUE%W+.5,cy=((STATUE/W)|0)+3.5;const j=nearest(G,k=>{const d=Math.hypot(k%W+.5-cx,((k/W)|0)+.5-cy);return d>=1.6&&d<=2.8&&walk(k)&&!S.obj[k]},80);if(j>=0){startAct(r,G,'bon',j,{cx,cy});return true}}/* 神殿の前で、おどりの輪 */
  if(x<.5&&(r.fyN||0)<3){const L=festStalls().filter(t=>{const q=S.res.find(o=>o.id===t.id);return q&&q.act&&q.act.type==='shopkeep'&&q.act.stage==='do'});if(L.length){const t=pick(L),j=nearest(G,k=>((k/W)|0)===t.y+1&&Math.abs(k%W-t.x)<=1&&!(t.el==='wind'&&k%W===t.x)&&walk(k)&&free('yt'+k,1),80);if(j>=0){startAct(r,G,'yatai',j,{key:'yt'+j,sx:t.x});return true}}}/* 店番のいる屋台（1日3回まで） */
  if(x<.72&&trySocial(r,G))return true;/* おまつりのおしゃべり */
  const j=festSpot(G,k=>ib(k)&&Math.hypot(k%W+.5-r.x,((k/W)|0)+.5-r.y)>=4,30);if(j>=0){startAct(r,G,'fwalk',j);if(r.fsnack&&Math.random()<.6)r.bubble=r.fsnack;return true}/* 村の中を、ぶらぶら見てまわる */
  return false}
for(const id in STAGEONLY)Object.defineProperty(BL[id],'offerOnly',{get:()=>WD!==STAGEONLY[id]&&!grec(id),configurable:true});/* ステージの物は、そのステージで作れる。ほかのステージでは、おぼえるまではおそなえだけ */for(const id in BL){const b=BL[id];if(b.mat1){const m0=b.mat;Object.defineProperty(b,'mat',{get:()=>WD===1?b.mat1:m0,configurable:true})}}/* mat1：火山での素材（実数で書いてある） */
const FLAM=new Set(Object.keys(BL).filter(id=>id!=='hwall'&&id!=='door'&&id!=='yozoradoor'&&(()=>{const b=BL[id],m=b.mat||{};return (b.kind==='furn'||b.kind==='block'||b.kind==='build')&&(m.wood>0||m.bamboo>0)&&!m.stone&&!b.natural&&id!=='torch'&&id!=='candle'})()));/* 火山のふもとで燃える物：木材だけで作る家具・柵・壁など（たいまつ・ろうそくは、もともと火がついている物なのでのぞく） */
const burnHp=o=>BL[o].hp||10,fireAt=j=>WD===1&&!!S.st2&&!!S.st2.fire&&S.st2.fire[j]!=null;/* じょうぶさのない家具は、燃えるときだけ10とする */
function ignite(j){if(WD!==1||!S.st2)return;const o=S.obj[j];if(!FLAM.has(o))return;const F=S.st2.fire||(S.st2.fire={});if(F[j]!=null)return;F[j]=S.t;toast(BL[o].name+'が燃えている！','warn');sfxAt('cookfire',j%W+.5,(j/W)|0)}
function fireTick(dt){if(WD!==1||!S.st2||!S.st2.fire)return;const F=S.st2.fire;for(const k in F){const j=+k,o=S.obj[j];if(!FLAM.has(o)){delete F[k];continue}S.hp[j]=(S.hp[j]??burnHp(o))-dt/15;/* 燃えているあいだ、15分ごとにじょうぶさが1へる */
  if(S.hp[j]<=0){(S.broken||(S.broken=[])).push({j,id:o,L:S.hp['L'+j],rot:rotAt(j)});delete F[k];sfxAt('wbreak',j%W+.5,(j/W)|0);clearObj(j);recount();dirty=true;toast(BL[o].name+'が燃えてこわれた','warn')}}}
function sparkTick(){if(WD!==1||!S.st2||isNight()||elemCount('water')<1||Math.random()>=.05)return;/* 火の粉：昼のあいだ、1時間に5%（水の子が来てから） */const L=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(FLAM.has(o)&&!fireAt(j)&&VILL[j]&&!HOUSES.some(h=>h.inside.has(j)))L.push(j)}if(!L.length)return;const j=L[(Math.random()*L.length)|0];
  for(let n=0;n<10;n++)fx.push({k:'p',x:(j%W+.5)*TS+rnd(-6,6),y:((j/W)|0)*TS-40-n*6,vx:rnd(-15,15),vy:rnd(60,110),life:.6,col:pick(['#ffb02e','#ff7a3d','#fff1a8']),r:rnd(1.5,2.5)});ignite(j)}/* 家の中の物には、火の粉はとどかない */
function goDouse(r,G){if(WD!==1||!S.st2||!S.st2.fire||isNight())return false;const ks=Object.keys(S.st2.fire).map(Number).filter(j=>free('fire'+j,1));if(!ks.length)return false;const hit=k=>ks.includes(anc(k));const j=nearest(G,q=>adjOf(q,hit)>=0,150);if(j<0)return false;const t=anc(adjOf(j,hit));startAct(r,G,'douse',j,{key:'fire'+t,obj:t,run:true});return true}/* 水の子は、昼のあいだ、燃えている物を消しにいく */
function drawFire1(j,now){{const o=S.obj[j];if(!o)return;const z=szAt(o,j)||[1,1],x=(j%W)*TS,y=((j/W)|0)*TS,n=z[0]*2,b=y+TS*z[1]-8;
  for(let m=0;m<n;m++){const fx=Math.round(x+6+m*(TS*z[0]-12)/Math.max(1,n-1)),h=Math.round(9+Math.sin(now/110+m*1.7+j)*3+(m%2?2:0));ctx.fillStyle='#d8431c';ctx.fillRect(fx-3,b-h,6,h);ctx.fillStyle='#ff9a2e';ctx.fillRect(fx-2,b-h+3,4,h-3);ctx.fillStyle='#fff1a8';ctx.fillRect(fx-1,b-Math.round(h*.45),2,Math.round(h*.45))}
  const sm=(now/1400+j*.37)%1;ctx.fillStyle='rgba(90,80,78,'+(.45*(1-sm))+')';ctx.fillRect(Math.round(x+TS*z[0]/2-3+Math.sin(now/500+j)*3),Math.round(b-16-sm*22),6,6)}}/* 燃えている物：ドットのほのおと、けむり（物を描いたすぐあとに重ねる） */
const burnt=q=>{const o=S.obj[q];return FLAM.has(o)&&!breakable(o)&&!DEFS.has(o)&&S.hp[q]!=null&&!fireAt(q)};/* 燃えて、じょうぶさがへった家具 */
function st2(){return S.st2||(S.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw:[]})}
const ashed=j=>WD===1&&!!S.st2&&S.st2.ash[j]>S.t;
function springOn(k){if(WD!==1||!k)return false;if(S.st2&&S.st2.frz&&S.st2.frz[k])return false;/* 最後の夜に冷やされた温泉 */if(k==='a')return !!S.flags.onsen;const t=S.st2;if(!t||!t.sp[k])return false;if(t.hvb[D1])return false;if(k==='c'&&t.hvb[D2])return false;return true}
const SPEDGE=new Map();function springEdge(k){const M=sprMap();let c=SPEDGE.get(M);if(!c){c={};SPEDGE.clear();SPEDGE.set(M,c)}if(!c[k]){const L=[];for(let j=0;j<W*H;j++){if(M[j]!==k)continue;for(const q of[j-1,j+1,j-W,j+W])if(q>=0&&q<W*H&&walk(q)&&!L.includes(q))L.push(q)}c[k]=L}return c[k]}/* 温泉のふち（歩けるマス） */
const springN=()=>['a','b','c'].filter(springOn).length;
const springDone=()=>(S.flags.onsen?1:0)+(S.st2&&S.st2.sp.b?1:0)+(S.st2&&S.st2.sp.c?1:0);
let SPRM=null,SPRS=null;
function sprMap(){if(SPRS===S&&SPRM)return SPRM;SPRS=S;SPRM=new Array(W*H).fill('');const seen=new Uint8Array(W*H);
  for(let j=0;j<W*H;j++){if(S.ground[j]!==1||seen[j])continue;const comp=[],q=[j];seen[j]=1;
    while(q.length){const k=q.pop();comp.push(k);const x=k%W;for(const n of[x>0?k-1:-1,x<W-1?k+1:-1,k-W,k+W]){if(n<0||n>=W*H||seen[n]||S.ground[n]!==1)continue;seen[n]=1;q.push(n)}}
    let best='',bd=4;for(const key in HSPC){const[cx,cy]=HSPC[key];for(const k of comp){const d=Math.hypot(k%W+.5-cx,((k/W)|0)+.5-cy);if(d<bd){bd=d;best=key}}}
    if(best)for(const k of comp)SPRM[k]=best}
  return SPRM}
const hotW=j=>WD===1&&S.ground[j]===1&&springOn(sprMap()[j]);
function nearHot(j,r){const x=j%W,y=(j/W)|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(hotW(yy*W+xx))return true}return false}
const nearSp=id=>S.obj.some((o,j)=>(id==='bench'?BENCHES.has(o):o===id)&&nearHot(j,4));/* ベンチは竹のベンチもふくむ *//* 温泉のそば（4マス以内） */
const FLOWERS2=['clover','bellf','salvia','lily','lotus'];
function spNear(ids,k){if(!springOn(k))return 0;const M=sprMap();let n=0;for(let j=0;j<W*H;j++){if(!ids.includes(S.obj[j])||isBud(j))continue;/* 花は、さいてから数える */const x=j%W,y=(j/W)|0;let ok=false;for(let dy=-4;dy<=4&&!ok;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(S.ground[q]===1&&M[q]===k){ok=true;break}}if(ok)n++}return n}/* その温泉のそば（4マス以内）にある数 */
function st2Place(s){
  const stash=j=>{const o=s.obj[j];if(o&&o!=='part'&&BL[o]&&BL[o].kind&&!BL[o].natural)s.inv[o]=(s.inv[o]||0)+1;if(o)for(const k in s.ref)if(s.ref[k]===j){s.obj[k]='';delete s.ref[k]}if(s.obj[j]==='part'){const a=s.ref[j];if(a!=null&&s.obj[a])stash(a)}s.obj[j]='';delete s.dyn[j];delete s.ref[j];s.ground[j]=0};
  for(let y=OFF;y<=OFF+6;y++)for(let x=CX-3;x<=CX+3;x++)stash(y*W+x);
  s.obj[VOLJ]='volcano';for(let b=0;b<3;b++)for(let a=0;a<3;a++){const q=VOLJ+b*W+a;if(q!==VOLJ){s.obj[q]='part';s.ref[q]=VOLJ}}
  for(const j of[D1,D2,...CRACKS,...BVOL])stash(j);
  s.obj[D1]=s.obj[D2]='heatv';CRACKS.forEach(j=>s.obj[j]='crack');BVOL.forEach(j=>s.obj[j]='boulder');
  const c=[];for(let y=CY-12;y<=CY-4;y++)for(let x=CX-13;x<=CX-3;x++){const j=y*W+x;if(s.ground[j]===1||s.floor[j])continue;if(s.obj[j]&&!NATK.includes(s.obj[j]))continue;if(![j-1,j+1,j-W,j+W].some(k=>s.ground[k]===1))continue;c.push([Math.hypot(x+.5-(CX-5.5),y+.5-(CY-8)),j])}
  c.sort((a,b)=>a[0]-b[0]);const bw=c.slice(0,3).map(q=>q[1]);bw.forEach(j=>{s.obj[j]='boulder';delete s.dyn[j]});/* 西の温泉の水路をふさぐ大岩 */
  s.st2={sp:{a:0,b:0,c:0},d1:1,d2:1,d2fix:0,hvb:{},ash:{},ashKills:0,bw}}
function springFX(k){const[cx,cy]=HSPC[k];sfx('level');toast(SPN[k]+'に、あたたかい湯がもどった！','good');logEv(SPN[k]+'がよみがえった');memo('♨️',SPN[k]+'がよみがえった');
  fx.push({k:'ring',x:cx*TS,y:cy*TS,life:1});for(let n=0;n<24;n++){const a=Math.random()*7,v=rnd(40,110);fx.push({k:'p',x:cx*TS,y:cy*TS,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,life:1,col:pick(['#fff','#bff3ec','#ffe9a0']),r:rnd(2,3.5)})}}
function st2Tick(){if(WD!==1||!S.st2)return;const t=S.st2;
  if(!t.sp.b&&t.d1===0&&t.bw.every(j=>S.obj[j]!=='boulder')&&!t.hvb[D1]){t.sp.b=1;dirty=true;springFX('b');checkQuest()}
  if(!t.sp.c&&t.d1===1&&t.d2fix&&t.d2===0&&CRACKS.every(j=>S.obj[j]!=='crack')&&!t.hvb[D1]&&!t.hvb[D2]){t.sp.c=1;dirty=true;springFX('c');checkQuest()}
  for(const k in t.ash)if(t.ash[k]<=S.t||!S.obj[k])delete t.ash[k]}
function volSpot(){for(let r=0;r<8;r++)for(let k=0;k<30;k++){const x=CX+Math.round((Math.random()*2-1)*(r+1)),y=OFF+6+Math.round(Math.random()*(r+1)),j=y*W+x;if(x>0&&y>0&&x<W&&y<H&&walk(j))return [x+.5,y+.5]}return spawnSpot()}
function heatLines(){const t=S.st2,ok=k=>!t.hvb[k],L=[],h1=ok(D1),cr=CRACKS.every(j=>S.obj[j]!=='crack'),h2=h1&&t.d1===1&&cr&&t.d2fix&&ok(D2);
  L.push({p:[[CX+.5,OFF+4.4],[CX+.5,OFF+7],[CX-3.5,OFF+7],[CX-3.5,OFF+9.5]],on:true});
  L.push({p:[[CX-3.5,OFF+9.5],[HSPC.b[0],OFF+9.5],[HSPC.b[0],HSPC.b[1]-1.6]],on:h1&&t.d1===0});
  L.push({p:[[CX-3.5,OFF+9.5],[CX+5.5,OFF+9.5],[CX+5.5,CY-17.5]],on:h1&&t.d1===1,leak:!cr});
  L.push({p:[[CX+5.5,CY-17.5],[CX+1.5,CY-17.5],[CX+1.5,HSPC.c[1]-1.4]],on:h2&&t.d2===0});
  L.push({p:[[CX+5.5,CY-17.5],[CX+8.5,CY-17.5]],on:h2&&t.d2===1,smoke:1});return L}
function drawHeat(now){if(WD!==1||!S.st2)return;const c=ctx;c.save();c.lineCap='round';c.lineJoin='round';
  for(const l of heatLines()){c.beginPath();l.p.forEach((q,i)=>i?c.lineTo(q[0]*TS,q[1]*TS):c.moveTo(q[0]*TS,q[1]*TS));c.setLineDash([]);c.strokeStyle='rgba(60,45,38,.35)';c.lineWidth=9;c.stroke();c.strokeStyle='#8f7b6c';c.lineWidth=5;c.stroke();
    if(l.on){c.strokeStyle='rgba(255,140,60,.95)';c.lineWidth=3.2;c.setLineDash([7,9]);c.lineDashOffset=-now/40;c.stroke();c.setLineDash([]);
      if(l.smoke||l.leak){const e=l.smoke?l.p[l.p.length-1]:[CX+.5,OFF+9.5];for(let k=0;k<3;k++){const ph=((now/1800+k/3)%1);c.fillStyle='rgba(120,110,105,'+(.45*(1-ph))+')';c.beginPath();c.arc(e[0]*TS+Math.sin(now/600+k)*4,e[1]*TS-8-ph*30,5+ph*9,0,7);c.fill()}}}}
  c.restore()}

/* ---------- ヘルパー ---------- */
const clk=()=>S.t-(S.hold||0);/* 時計の時刻 */
const hour=()=>(clk()/60)%24;
const dayNo=()=>Math.floor(clk()/1440)+1;
const nextOK=()=>dayNo()>=(S.lastCame??Math.max(0,...S.res.map(r=>r.came||0)))+2;/* つぎのなかまをむかえるクエストは、前の子が来た日の、2日後から */
const nightLock=()=>S&&S.enemyOn&&isNight();/* 夜（コワイノの時間）は、建てることも解体もできない */
const isNight=()=>{const h=hour();return h>=23||h<6},isDark=()=>{const h=hour();return h>=21||h<6};/* せいれいが寝るのは23時 */
function foeAt(e,r){/* コワイノ e が、せいれい r の3マス以内か、r のいる家の中にいる */if(r.hidden||r.coffin)return false;if(Math.max(Math.abs(e.x-r.x),Math.abs(e.y-r.y))<=3)return true;const h=roomOf((r.y|0)*W+(r.x|0));return !!h&&h.set.has((e.y|0)*W+(e.x|0))}
function nearRes(e){return S.res.some(r=>foeAt(e,r))}/* だれかの3マス以内・だれかのいる家に来たコワイノ */
const anc=j=>{if(S.obj[j]==='part'||(S.obj[j]==='site2'&&S.ref[j]!=null))return S.ref[j];if(S.obj[j]==='site2')for(const k of[j-1,j+1,j-W])if(S.obj[k]==='site')return k;return j};/* 古いセーブの神殿の足場にも対応 */
const typeAt=j=>S.obj[anc(j)];

const solidOf=j=>{const o=typeAt(j);return !!(o&&BL[o]&&BL[o].solid)};
const FRONTS=new Set(['chair','achair','sofa1','bench']);/* 正面のある家具（置くときに矢印を出す） */const ROTS={chair:4,achair:4,sofa1:4,bench:4,bed:2,yorubed:2,sandbox:2,ltable:2,bathtub:2,slide:1,seesaw:1,swing:1,signpost:1,vane:1,oven:1,stairs_wood:5,stairs_stone:5,stairs_brick:5,slope_earth:5};/* 向きをかえられる家具。4：前・右・後ろ・左　2：横・縦　1：左右反転だけ */
const BEDHX=26,BEDHY=-1,BEDVY=8.5,BEDHS=.85;/* 横のベッド：寝る子の足もと（x,y）。たてのベッド：寝る子の足もとのy。BEDHS：横向きで寝るときの、せいれいの横はば。ふとんは重ねない（ベッドの上に寝る子をかく） */
const ROTN=id=>ROTS[id]===5?5:ROTS[id]===4?4:ROTS[id]?2:1,ROTL={5:['じどう','手前へ','右へ','左へ','奥へ'],4:['前','右','後ろ','左'],2:['横','縦'],1:['そのまま','反転']};/* 5：階段の下りる向き（S.rot は 1手前 2右 3左 4奥、0は自動） */
let PLROTS={};/* 置くときにえらんでいる向き（家具ごと） */
const rotAt=j=>(S&&S.rot&&S.rot[j])||0;
const szR=(id,rot)=>{const z=BL[id]&&BL[id].sz;if(!z)return null;return (ROTS[id]===2&&rot===1||ROTS[id]===4&&rot%2===1)?[z[1],z[0]]:z};/* 向きをかえると、たて・よこが入れかわる */
const szAt=(id,j)=>szR(id,j==null?0:(S.obj[j]===id||S.obj[j]==='site'?rotAt(j):(PLROTS[id]||0)));
const fp=(id,x,y,rot)=>{const z=rot!=null?szR(id,rot):szAt(id,y*W+x);if(!z)return [[x,y]];const c=[];for(let b=0;b<z[1];b++)for(let a=0;a<z[0];a++)c.push([x+a,y+b]);return c};
function walk(j){if(j<0||j>=W*H||S.ground[j]===1&&S.obj[j]!=='bridge')return false;return !solidOf(j)}/* 橋の上は歩ける。浅瀬（ground 2）は歩ける（ゆっくり） */
const wetJ=j=>S.ground[j]===1&&S.obj[j]!=='bridge';/* 歩けない水 */
const LIFT=26;/* 段差1だんの高さ（ドット）。高いマスの上の物は、これだけ上に描く */
function hiAt(j){return S.hi?S.hi[j]|0:0}
const SLOPES=new Set(['slope_earth']),STAIRS=new Set(['stairs_wood','stairs_stone','stairs_brick',...SLOPES]),/* 土は坂だけ、木・石・レンガは階段だけ */SDIR=[[0,1],[1,0],[0,-1],[-1,0]];/* 階段の向き：0下 1右 2上 3左（低いほう） */
const SROT=[-1,0,1,3,2];/* 置くときにえらんだ向き（S.rot）→ 下りる向き */
function stairOK(j,d){/* j に、d の向きに下りる階段を置けるか：j のうしろが高いマス。j と、その先のマスは、低い地面（水でない） */const x=j%W,y=(j/W)|0,bx=x-SDIR[d][0],by=y-SDIR[d][1],ox=x+SDIR[d][0],oy=y+SDIR[d][1];if(bx<0||by<0||bx>=W||by>=H||ox<0||oy<0||ox>=W||oy>=H)return false;const o=oy*W+ox;const h=hiAt(j);return hiAt(by*W+bx)===h+1&&(d===0||hiAt(o)===h&&S.ground[o]!==1)}/* うしろが、ちょうど1だん高い *//* 手前向きは1マス（がけの正面を1マスと数える）、ほかは2マス */
function stairDir(j){/* 階段は、段差の下（低い地面）に置く1×2。高いマスのほうから、はなれる向きに下りる。えらんだ向きがなければ、下・右・左・上の順にえらぶ */const v=(S.rot||{})[j];if(v)return SROT[v];for(const d of[0,1,3,2])if(stairOK(j,d))return d;return -1}
function stairOf(k){/* k が階段のマスなら、階段の本体（高いほうのはしのマス）。ちがえば -1 */if(k<0||k>=W*H||!S)return -1;const o=S.obj[k];if(STAIRS.has(o))return k;if(o==='part'){const a=S.ref[k];if(a!=null&&STAIRS.has(S.obj[a]))return a}return -1}
const stairOut=(j,d)=>j+SDIR[d][1]*W+SDIR[d][0],stairTop=(j,d)=>j-SDIR[d][1]*W-SDIR[d][0];/* 階段は1×2：本体のマスと、その先の低いほうのマス。本体のうしろが、のぼった先の高いマス */
function stairLink(a,b){/* bが階段の本体で、aがそのうしろの高いマス（のぼった先） */if(!STAIRS.has(S.obj[b]))return false;const d=stairDir(b);return d>=0&&stairTop(b,d)===a}

let CLV=1;/* いま絵を作っている段（1〜3）。がけの絵の関数は、この段より高いか同じマスを「高いマス」とみる */
let TOPF=null;function topAt(j){return TOPF?TOPF(j):hiAt(j)>=CLV}/* TOPF：段差の部品を作るあいだだけ、まわりのマスの高さをまねる *//* 「上の面がある」（CLV の段で） */
const HMAX=3;/* 段差は3だんまで */
function cliff2(a,b){return Math.abs(hiAt(a)-hiAt(b))>1}/* 2だん以上ちがう所は、とびこえられない */
const LADDERS=new Set(['ladder_wood','ladder_bamboo']);/* ハシゴ：段差の下の低い地面に置く1マス。うしろ（手前・左右）のマスが、ちょうど1だん高い。上り下りは歩く速さ×0.5 */
function ladderDir(j){/* ハシゴの向き（0：うしろが上のマス、1：左、3：右）。置いたときの向き S.rot、なければ自動 */const v=(S.rot||{})[j];if(v!=null&&LADDERS.has(S.obj[j]))return v;const h=hiAt(j),x=j%W;for(const d of[0,1,3]){const t=j-SDIR[d][1]*W-SDIR[d][0];if(t<0||t>=W*H||Math.abs(t%W-x)>1)continue;if(hiAt(t)===h+1&&S.ground[t]!==1)return d}return -1}
const ladderTop=(j,d)=>j-SDIR[d][1]*W-SDIR[d][0];
function ladderLink(a,b){/* b がハシゴで、a がその上のマス */if(!LADDERS.has(S.obj[b]))return false;const d=ladderDir(b);return d>=0&&ladderTop(b,d)===a}
const onLadder=(a,b)=>LADDERS.has(S.obj[a])||LADDERS.has(S.obj[b]);/* ハシゴを通る1歩 */
function jumpEdge(a,b){return hiAt(a)!==hiAt(b)&&!stairLink(a,b)&&!stairLink(b,a)&&!ladderLink(a,b)&&!ladderLink(b,a)}/* 段差を飛ぶ所（階段で上り下りする所はちがう） */
function zAt(x,y){/* その場所の高さ（ドット）。階段の上は、高いほうのはしから低いほうへ少しずつ下がる */const c=(y|0)*W+(x|0);if(S&&LADDERS.has(S.obj[c])){const d=ladderDir(c),ax=c%W,ay=(c/W)|0,t=d===0?y-ay:d===1?x-ax:ax+1-x;return hiAt(c)*LIFT+(d<0?0:LIFT*Math.max(0,Math.min(1,1-t)))}/* ハシゴの上：うしろの高いマスへ近いほど高い */const a=stairOf(c);if(a<0)return hiAt(c)*LIFT;const d=stairDir(a);if(d<0)return hiAt(c)*LIFT;const ax=a%W,ay=(a/W)|0,t=d===0?2*(y-ay):d===1?x-ax:d===2?ay+1-y:ax+1-x;return LIFT*hiAt(a)+LIFT*Math.max(0,Math.min(1,1-t/2))}/* 2マスで下がる（手前向きは1マス） */
const HI_OK=new Set(['deadtree','rock','berry','bamboo','tree','ntree','fruit']);/* 段差を作ってよい物（自然の物） */
const LANDSEED=w=>w===1?20261102:w===FREE?20261022:20261018;
function landMade(s,j){const o=s.obj[j];return !!s.floor[j]||o==='part'||!!o&&!!BL[o]&&!BL[o].natural&&!WEEDS.has(o)}/* 人の作った物（床・道・家具・建物）がある */
function genRiver(s,w,o){/* 川：草原（とフリー）は北のはしから南のはしへ、火山は西のはしから東のはしへ（南がわを横切る）。村のまん中から26〜30マスはなれて、くねくね流れる。支流が1本。浅瀬（ground 2）は、本流に3か所・支流に1か所。o.ns：火山でも南北（前の川のマスをしらべるとき）。o.dry：マスをしらべるだけ */
  o=o||{};const R=mulberry(LANDSEED(w)+333),tr=w===1&&!o.ns,side0=R()<.5?-1:1,side=tr?1:side0,base=CX+side*(26+R()*4),p1=R()*6.28,p2=R()*6.28,p3=R()*6.28,riv=new Uint8Array(W*H);
  const J=(u,v)=>tr?u*W+v:v*W+u;/* u：川をよこぎる向き、v：川の流れる向き（火山は、たてとよこを入れかえる） */
  const set=(u,v)=>{if(u<0||v<0||u>=W||v>=H)return;const j=J(u,v);if(landMade(s,j)||!o.dry&&s.ground[j]===1&&!riv[j])return;riv[j]=1};/* しらべるだけのときは、いま水のマスもかぞえる（前の川は、もう水なので） */
  const xc=v=>base+5*Math.sin(v*.09+p1)+2.5*Math.sin(v*.23+p2);
  for(let v=0;v<H;v++){const c=xc(v),wd=2.3+.9*Math.sin(v*.13+p3),a=Math.round(c-wd/2),b=Math.round(c+wd/2);for(let u=a;u<b;u++)set(u,v);const c2=xc(v+1);for(let u=Math.min(Math.round(c2-wd/2),a);u<Math.max(Math.round(c2+wd/2),b);u++)if(Math.abs(u+.5-(c+c2)/2)<wd/2+.6)set(u,v)}/* となりの行とつながるように、あいだもうめる */
  const yt=Math.round(CY+(R()<.5?-1:1)*(14+R()*14)),p4=R()*6.28,ex=side<0?0:W-1,mx=Math.round(xc(yt));/* 支流：外がわのはしから、本流へ */
  for(let u=Math.min(ex,mx);u<=Math.max(ex,mx);u++){const c=yt+3*Math.sin(u*.15+p4);for(let v=Math.round(c-1);v<Math.round(c+1);v++)set(u,v);const c2=yt+3*Math.sin((u+1)*.15+p4);if(Math.abs(c2-c)>.6)set(u,Math.round((c+c2)/2))}
  if(o.dry)return riv;
  for(let j=0;j<W*H;j++)if(riv[j]){const ob=s.obj[j];if(ob){s.obj[j]='';delete s.dyn[j];delete s.hp[j];delete s.hp['n'+j]}s.ground[j]=1}
  const ford=v=>{for(let u=0;u<W;u++){const j=J(u,v);if(riv[j]&&Math.abs(u-xc(v))<4)s.ground[j]=2}};
  for(const v of[Math.round(CY-26+R()*8),Math.round(CY-3+R()*6),Math.round(CY+20+R()*8)]){ford(v);ford(v+1)}
  {const fu=Math.round((ex+mx)/2);for(let v=0;v<H;v++){const j=J(fu,v);if(riv[j])s.ground[j]=2;const k=J(fu+(side<0?1:-1),v);if(riv[k])s.ground[k]=2}}
  return riv}
function genHeights(s,w){/* 段差：なめらかなノイズから、0〜3だんの台地。村のまん中（13マス）は平ら。外へいくほど高い。水・浅瀬のまわり・床・人の作った物の所には作らない。となりとの差は1だんまで（段々の台地） */
  const R=mulberry(LANDSEED(w)+77),h=new Array(W*H).fill(0);
  const ok=j=>{const x=j%W,y=(j/W)|0;if(x<2||y<2||x>=W-2||y>=H-2)return false;if(Math.max(Math.abs(x+.5-CX),Math.abs(y+.5-CY))<13)return false;if(s.floor[j])return false;const o=s.obj[j];if(o&&!HI_OK.has(o))return false;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(s.ground[j+b*W+a])return false;if(w===1&&Math.abs(x+.5-CX)<9&&y<OFF+16)return false;/* 火山：北の火口のまわりは平ら */return true};
  const oct=sc=>{const gw=Math.ceil(W/sc)+2,gh=Math.ceil(H/sc)+2,g=new Float32Array(gw*gh);for(let k=0;k<g.length;k++)g[k]=R();const sm=t=>t*t*(3-2*t);
    return (x,y)=>{const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=sm(fx-ix),ty=sm(fy-iy),v=(a,b)=>g[(iy+b)*gw+ix+a];return (v(0,0)*(1-tx)+v(1,0)*tx)*(1-ty)+(v(0,1)*(1-tx)+v(1,1)*tx)*ty}};
  const V=w===1,n1=oct(V?17:30),n2=oct(V?8:13),n3=oct(V?4:6),T=V?[.50,.58,.66]:[.53,.65,.79];/* 草原：大きくゆるやかな丘（3だんは少ない）。火山：こまかく、けわしい */
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x,c=Math.max(Math.abs(x+.5-CX),Math.abs(y+.5-CY)),f=Math.min(1,Math.max(0,(c-13)/14)),nf=Math.min(1,Math.max(0,(CY+10-y)/50));let v=(.6*n1(x,y)+.3*n2(x,y)+.1*n3(x,y))*(.55+.45*f)+.12*f;if(V)v+=.2*nf-.08*(1-nf);/* 火山：北（火口がわ）へいくほど高い山 */
    h[j]=v>T[2]?3:v>T[1]?2:v>T[0]?1:0}
  for(let pass=0;pass<2;pass++)for(let lv=1;lv<=HMAX;lv++){const g=h.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&g[j+b*W+a]>=lv)n++;if(g[j]>=lv&&n<=2)h[j]=Math.min(h[j],lv-1);else if(g[j]<lv&&n>=6)h[j]=Math.max(h[j],lv)}}/* まわり8マスの多いほうにそろえて、ふちをまるく */
  for(let j=0;j<W*H;j++)if(h[j]&&!ok(j))h[j]=0;
  const fix=()=>{for(let it=0;it<6;it++){let ch=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=y*W+x;let m=h[j];for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const xx=x+a,yy=y+b;if(xx<0||yy<0||xx>=W||yy>=H)continue;m=Math.min(m,h[yy*W+xx])}if(h[j]>m+1){h[j]=m+1;ch=1}}if(!ch)break}};/* 2マス以内との差は1だんまで（段と段のあいだの平らな所は2マス以上。がけが2だんつづけて見えないように） */
  fix();
  for(let pass=0;pass<3;pass++)for(let lv=HMAX;lv>=1;lv--){const g=h.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x,n=(g[j-1]>=lv)+(g[j+1]>=lv)+(g[j-W]>=lv)+(g[j+W]>=lv);if(g[j]>=lv&&n<2)h[j]=lv-1;else if(g[j]===lv-1&&n>=3&&ok(j))h[j]=lv}}/* ほそい所はけす、くぼみはうめる */
  fix();
  s.hi=h}
function genLand(s,w){genRiver(s,w);genHeights(s,w)}/* 地形：川（と浅瀬）、そのあと段差 */
const cnt=id=>counts[id]||0;
const FOODS={mugi:{name:'こむぎ',v:1,e:'🌾'},imo:{name:'いも',v:1,e:'🥔'},tomato:{name:'キャベツ',v:1,e:'🥬'},berry:{name:'ベリー',v:1,e:'🫐',fx:'たのしさ+8'},apple:{name:'りんご',v:1,e:'🍎',fx:'たのしさ+8'},fish:{name:'さかな',v:1,e:'🐟'},takenoko:{name:'たけのこ',v:1,e:'🎍'},
  bread:{name:'パン',v:2,pt:3,pw:1.35,dish:1,e:'🍞',fx:'おなかのへる速さ×0.6'},soup:{name:'キャベツスープ',v:2,pt:3,pw:1.35,dish:1,e:'🍲',fx:'つかれ−25'},yakiimo:{name:'ベイクドポテト',v:1,pt:2,pw:.9,dish:1,e:'🍠',fx:'3時間、作業スピード×1.15'},yakizakana:{name:'焼き魚',v:1,pt:4,pw:1.8,dish:1,e:'🐠',fx:''},yakiberry:{name:'焼きベリー',v:2,pt:2,pw:.9,dish:1,e:'🍮',fx:'たのしさ+15'},yakiapple:{name:'焼きりんご',v:1,pt:2,pw:.9,dish:1,e:'🥧',fx:'3時間、移動速度×1.15'},salad:{name:'サラダ',v:2,pt:2,pw:.9,dish:1,e:'🥗',fx:'つかれ−10・たのしさ+10'},
  yakisoba:{name:'焼きそば',v:2,pt:3,pw:1.35,dish:1,fest:1,e:'🍝',fx:'つかれ−20・たのしさ+10'},takoyaki:{name:'たこ焼き',v:2,pt:3,pw:1.35,dish:1,fest:1,e:'🐙',fx:'たのしさ+25'},ringoame:{name:'りんごあめ',v:1,pt:2,pw:.9,dish:1,fest:1,e:'🍭',fx:'たのしさ+20'},kakigori:{name:'かき氷',v:1,pt:2,pw:.9,dish:1,fest:1,e:'🍧',fx:'つかれ−15・たのしさ+10'},wataame:{name:'わたあめ',v:1,pt:2,pw:.9,dish:1,fest:1,e:'🍬',fx:'たのしさ+25'}};/* fest：おまつりの日だけ、お店で交換できる（料理では作れない） */

const RAWFL={mugi:'ぷっくり実ったこむぎ。',imo:'ころんとしたおいも。',tomato:'みずみずしいキャベツ。',berry:'あまずっぱいベリー。',apple:'まっかなりんご。',fish:'とれたてのさかな。'};
const RAWD=k=>{const f=FOODS[k];return (RAWFL[k]||f.name+'。')+'/効果:お腹'+f.v+(f.pw?'、パワー+'+f.pw:'')+(f.fx?'、'+f.fx.replace(/、/g,''):'')};/* 料理していない食べ物の説明（料理の説明と同じ形） */
const DISHFL={yakisoba:'ソースのにおいの焼きそば。',takoyaki:'まるくてあつあつのたこ焼き。',ringoame:'つやつやのりんごあめ。',kakigori:'しゃりしゃりのかき氷。',wataame:'ふわふわのわたあめ。',yakiimo:'ほくほくのおいも。',bread:'こんがり焼けたパン。',soup:'からだがあたたまるスープ。',yakizakana:'こうばしい焼き魚。',yakiberry:'あまずっぱい焼きベリー。',yakiapple:'とろっと甘い焼きりんご。',salad:'しゃきしゃきのサラダ。'};
const needTxt=R=>Object.keys(R.need).map(k=>FOODS[k].name+(R.need[k]>1?'×'+R.need[k]:'')).join('・');/* 材料は1つなら数をつけない */
const DISHD=R=>{const F=FOODS[R.out];return (DISHFL[R.out]||F.name+'。')+'/材料:'+needTxt(R)+'/時間:'+R.time+'分/効果:お腹'+F.v+'、パワー+'+F.pw+(F.fx?'、'+F.fx.replace(/、/g,''):'')};/* ハテナに出す料理の説明 */
const DISHES=['bread','soup','yakiimo','yakizakana'],favDish=r=>{const ds=WD===0?DISHES.filter(d=>d!=='soup'):DISHES;return ds[[...r.name].reduce((a,c)=>a+c.charCodeAt(0),0)%ds.length]};/* すきな料理は名前できまる */
function imoSeedQuestPlots(){if(!S.imoSeedQuestPlots){S.imoSeedQuestPlots=[];for(let j=0;j<S.obj.length;j++){const d=S.dyn[j];if(S.obj[j]==='farm'&&d&&d.crop==='imo'&&(d.paid||d.sown===true))S.imoSeedQuestPlots.push(j)}}return S.imoSeedQuestPlots}
const farmsBare=()=>{let n=0;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].crop===null)n++;return n};/* たねをえらんでいない畑の数 */
const cropK=d=>d.crop===undefined?'mugi':d.crop;/* 作物。null はまだえらんでいない（前からの畑はこむぎ） */
const cropOn=k=>!!S.crops[k];/* 使える作物 */
const CROPS={mugi:{name:'こむぎ',days:2,yield:1,desc:'2日で育つ。パンの材料'},tomato:{name:'キャベツ',days:2,yield:1,desc:'2日で育つ'},imo:{name:'いも',days:3,yield:2,desc:'3日で育つ。1つの畑で2こ'}};
/* たねは、おそなえ箱からえらんで畑にまく */
const ALLRECIPES=[{out:'soup',need:{tomato:1,imo:1},time:153,timeR:107.1},{out:'bread',need:{mugi:2},time:120,timeR:84},{out:'yakizakana',need:{fish:1},time:60,timeR:42},{out:'yakiimo',need:{imo:1},time:50,timeR:35},{out:'yakiberry',need:{berry:2},time:60,timeR:42},{out:'yakiapple',need:{apple:1},time:60,timeR:42},{out:'salad',need:{tomato:2},time:90,timeR:63}];/* time：料理にかかる時間（分）。timeR：料理がとくいな子の時間 */
const repairTime=a=>a.re?30:20;/* 修理にかかる時間（分）：建て直しは30、ふつうの修理は20（ゲームの処理と、ゲージの表示で同じものを使う） */
function cookTime(r,ov){const R=RECIPES.find(x=>x.out===(r.cing&&r.cing.rec))||{time:30,timeR:21};return (trt(r,'ryouri')?R.timeR:R.time)*ovenMul(ov)/(ov!=null?1+.1*spotN(ov,'kitchen','pan'):1)}/* キッチン：料理の速さ+10% *//* 料理にかかる時間（ゲームの処理と、ゲージの表示で同じものを使う） *//* 料理でふくれるおなか（v）は、FOODS に実数で書く（使った材料の合計と同じ） */let RECIPES=ALLRECIPES;soupFilter();/* time：料理にかかる時間（レシピごと） */
function syncFood(){let n=0;for(const k in S.fs)n+=S.fs[k]||0;S.food=n}
function addFood(k,n){S.fs[k]=(S.fs[k]||0)+n;syncFood()}
function takeFood(n,pref){let got=[];const keys=Object.keys(S.fs).filter(k=>S.fs[k]>0);if(pref==='raw')keys.sort((a,b)=>(FOODS[a].v-FOODS[b].v));else keys.sort((a,b)=>FOODS[b].v-FOODS[a].v||Math.random()-.5);
  for(const k of keys){while(n>0&&S.fs[k]>0){S.fs[k]--;n--;got.push(k)}if(n<=0)break}syncFood();return got}
const carryN=r=>!r.carry?0:typeof r.carry==='number'?r.carry:Object.values(r.carry).reduce((a,b)=>a+b,0);
const capOf=r=>rStat(r,rLv(r)).cap,matN=r=>r.cmat?Object.values(r.cmat).reduce((a,b)=>a+b,0):0,heldN=r=>carryN(r)+matN(r),roomN=r=>r.coffin?0:Math.max(0,capOf(r)-heldN(r));// 持てる数はレベルと同じ（Lv1は1こ）
function addCarry(r,k,n){if(typeof r.carry==='number')r.carry={mugi:r.carry};n=Math.min(n,roomN(r));if(n<=0)return;r.carry=r.carry||{};r.carry[k]=(r.carry[k]||0)+n;r.carryLast=k}/* アイコンは、最後に持ったもの */
function addMat(r,k,n){n=Math.min(n,roomN(r));if(n<=0)return;r.cmat=r.cmat||{};r.cmat[k]=(r.cmat[k]||0)+n}
function hYield(j,def){const o=S.obj[j],d=S.dyn[j];const cr=o==='farm'?CROPS[(d&&d.crop)||'mugi']:null;return (cr?cr.yield:def)+(NEARMILL.has(j)?1:0)+(NEARFLOWER.has(j)?1:0)}
// STORAGE: placed shelves share the village stock; wall attachments count only on standing walls.
const STORAGE={stor:{food:30},mbox:{mat:50},crate:{food:30,mat:30},shelf1:{mat:50},shelf2:{mat:50},wshelf:{mat:50},cabinet:{food:30}};/* しまえる数（食料・素材） */
function storageAt(j,type){const id=S.obj[j],wall=HOME_WALLS.has(id)&&(S.win||{})[j],b=STORAGE[wall]||STORAGE[id];return !!(b&&b[type])}
function storageCapacity(type){let n=0;for(const id in STORAGE){const c=STORAGE[id][type];if(c)n+=cnt(id)*c}for(const j in S.win||{}){const c=(STORAGE[S.win[j]]||{})[type];if(HOME_WALLS.has(S.obj[j])&&c)n+=c}return n}
const foodCap=()=>storageCapacity('food'),matCap=()=>storageCapacity('mat'),matTot=()=>Object.keys(MATN).reduce((a,k)=>a+(S.mat[k]||0),0);
let OTAKI_SEL={};/* そうこで、おたきあげにえらんでいる数 */
const MATTRADE={shina:5,kasa:5,kuru:5,chiri:5,funba:5,wood:3,stone:3,bamboo:3,eda:3,kinoko:2,can:2};/* おたきあげ：素材をパワー1にかえるのに要る数（よく手に入る物ほど多い） */
const MATN={wood:'木材',stone:'石材',bamboo:'竹',shina:'しなやかな草',kasa:'かさかさ草',kuru:'くるくる草',chiri:'ちりちり草',funba:'ふんばり草',eda:'枝',kinoko:'きのこ',can:'空き缶'},WEEDS=new Set(['weed0g','weed0k','weed1g','weed1k','weedc','kinoko']),bambooOn=()=>WD===1||(S.mat.bamboo||0)>0;/* 竹は火山の素材。ほかのステージでは、持っているときだけ出す */const matTxt=m=>Object.keys(m||{}).map(k=>MATN[k]+m[k]).join('・');/* 素材は文字ではなくアイコンで */const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);const matHTML=m=>Object.keys(m||{}).map(k=>'<span class="mic"><img src="'+(ICONS[k]||'')+'" alt="'+MATN[k]+'">'+m[k]+'</span>').join('');const matOK=m=>Object.keys(m||{}).every(k=>(S.mat[k]||0)>=m[k]);const matNeedHTML=m=>Object.keys(m||{}).map(k=>{const h=S.mat[k]||0,ok=h>=m[k];return '<span class="mneed" style="margin-right:6px;'+(ok?'':'color:#c0392b;font-weight:700')+'">'+MATN[k]+'（'+h+'/'+m[k]+'）</span>'}).join('');/* 依頼ボードの作るリスト：素材が足りるか（持っている数/いる数） */
const watchQ=()=>!!(S.qTalked&&QUESTS[S.quest]&&QUESTS[S.quest].id==='watch1'&&!cnt('watch')&&!S.obj.some((o,j)=>o==='site'&&S.dyn[j]&&S.dyn[j].build==='watch'));
const QB=new Set(['lumber','quarry','stele','fountain','lighthouse','windmill']),/* クエストでおぼえるまで建てられない建物（村レベルだけでは、使えない） */lvOK=id=>BL[id].kind==='furn'||(QB.has(id)?(!!(S.recipes||{})[id]||cnt(id)>0):id==='yogan'?(WD===1&&!!S.flags.yoganLearned):id==='watch'?(!!S.flags.watchLearned||watchQ()):S.lv>=(BL[id].lv||1)&&(BL[id].w||0)<=WD)||!!S.flags['lv_'+id]||grec(id);/* w：このステージから（それより前のステージでは、おぼえていないと作れない） */
const breakable=o=>o==='fence'||o==='wall'||o==='hwall'||o==='door'||o==='yozoradoor'||o==='gate'||o==='sdoor'||!!(o&&BL[o]&&BL[o].brk);

function godFix(j){/* 守り神の修理：タップして、パワーと素材を使ってすぐ直す（せいれいが直すとただ） */const o=S.obj[j],b=o?null:brokenCover(j),id=b?b.id:o,c=id&&BL[id]&&BL[id].fix;if(!c)return false;if(o==='tower'&&(S.shards||0)>(S.setSh||0))return false;/* かけらをはめるのが先 */
  if(!b&&!(breakable(o)&&(S.hp[j]??BL[o].hp)<BL[o].hp||DEFS.has(o)&&S.hp[j]!=null))return false;
  const m=BL[id].fixm||{};askYesNo(BL[id].name,(b?'建てなおす':'直す')+'？（'+SP(c)+'・'+matTxt(m)+'）',()=>{if(isNight())return toast('夜のあいだは、直せません');if(S.pt<c)return toast('パワーが足りません');if(!matOK(m))return toast('素材が足りません');
    if(b){const a={re:b.id,obj:b.j};if(!repairFree(a)||fp(b.id,b.j%W,(b.j/W)|0,b.rot||0).some(([x,y])=>S.obj[y*W+x]))return toast('じゃまな物があって、建てなおせません');S.obj[b.j]=b.id;setRot(b.j,b.rot);setParts(b.id,b.j,'part');delete S.hp[b.j];if(BL[b.id].dyn)S.dyn[b.j]={g:0};if(b.L)S.hp['L'+b.j]=b.L;S.broken=S.broken.filter(q=>q.j!==b.j);recount();burst(b.j,'block')}
    else{if(S.obj[j]!==o)return;if(DEFS.has(o))delete S.hp[j];else S.hp[j]=BL[o].hp}
    S.pt-=c;for(const k in m)S.mat[k]-=m[k];dirty=true;sfx('repair');toast(BL[id].name+'を直した','good')},()=>{});return true}
/* 防衛設備：「コワイノ」はまずこれをこわしにくる */
const DEFS=new Set(['watch','yogan','spike','puddle','sticky','firetrap','gust']),DEFHP={watch:30,yogan:30,spike:5},defHp=o=>DEFHP[o]||4;
let DEFC={t:0,l:[]};function defList(){const now=performance.now();if(now-DEFC.t>1000){DEFC.l=[];for(let j=0;j<W*H;j++)if(DEFS.has(S.obj[j]))DEFC.l.push(j);DEFC.t=now}return DEFC.l}
const brokenAt=q=>(S.broken||[]).find(b=>b.j===q);
const brokenRot=q=>{const b=brokenAt(q);return b&&b.rot||0},setRot=(j,v)=>{if(v)(S.rot||(S.rot={}))[j]=v;else if(S.rot)delete S.rot[j]};/* こわれた物の向き：建てなおすときに、もとの向きにもどす */
const repairFree=a=>fp(a.re,a.obj%W,(a.obj/W)|0,brokenRot(a.obj)).every(([cx,cy])=>{const k=cy*W+cx;return !S.obj[k]&&!S.res.some(q=>(q.y|0)*W+(q.x|0)===k)&&!S.enemies.some(e=>e.spawned&&!e.dead&&(e.y|0)*W+(e.x|0)===k)});
const brokenCover=q=>(S.broken||[]).find(b=>!S.obj[b.j]&&fp(b.id,b.j%W,(b.j/W)|0,b.rot||0).some(([x,y])=>y*W+x===q));/* 大きい物は、4マスのどこでも、こわれたあとの場所として扱う */
const canRebuild=q=>{const b=brokenAt(q);if(!b||!free('o'+q,1))return false;return fp(b.id,q%W,(q/W)|0,b.rot||0).every(([x,y])=>{const k=y*W+x;return !S.obj[k]&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===k)&&!S.enemies.some(e=>e.spawned&&(e.y|0)*W+(e.x|0)===k)})};
const BAN=new Map(),free=(k,cap)=>(resv.get(k)||0)<cap&&!(BAN.get(k)>(S?S.t:0));/* 行きつけない目的地は、しばらく選ばない */
const reserve=k=>resv.set(k,(resv.get(k)||0)+1);
const release=k=>{const v=(resv.get(k)||0)-1;if(v<=0)resv.delete(k);else resv.set(k,v)};
function nearLotus(r){const x0=r.x|0,y0=r.y|0;for(let y=y0-2;y<=y0+2;y++)for(let x=x0-2;x<=x0+2;x++){if(x<0||y<0||x>=W||y>=H)continue;if(S.obj[y*W+x]==='lotus')return true}return false}
const SEATS=['chair','stool','achair','bench','takebench','pouf','sofa1'],BENCHES=new Set(['bench','takebench']);/* BENCHES：休けい（rest）ができるベンチ */function fSpot(j){const t=typeAt(j);return !!t&&SEATS.includes(t)&&spotW(j)>=0}/* 水のすぐとなり（上下左右）の椅子＝釣りスポット（椅子にすわって釣る） */
/* スポット：組み合わせて置くと、効果が少し上がる（物どうしがまわり3マス以内）。main のまわりに need がそろうとできる */
const SPOTS=[
  {k:'dining',n:'ダイニング',main:o=>o==='table',need:[[o=>SEATS.includes(o),2]],how:'食卓と、いす2つ',eff:'ここで食べたときのパワー+10%'},
  {k:'fishspot',n:'つりスポット',main:(o,j)=>SEATS.includes(o)&&spotW(j)>=0,need:[[o=>o==='parasol',1]],how:'水べのいすと、パラソル',eff:'魚がつれる確率+5%'},
  {k:'park',n:'ちかばの公園',main:o=>o==='swing',need:[[o=>o==='sandbox',1]],how:'ブランコと、砂場',eff:'ここで遊ぶと、たのしさ+10%'},
  {k:'park2',n:'たのしい公園',main:o=>o==='swing',need:[[o=>o==='sandbox',1],[o=>o==='seesaw',1]],how:'ブランコと、砂場と、シーソー',eff:'ここで遊ぶと、たのしさ+10%'},
  {k:'kitchen',n:'キッチン',main:o=>o==='oven',need:[[o=>o==='sink',1],[o=>o==='tub',1]],how:'かまどと、流し台と、水おけ',eff:'料理の速さ+10%'},
  {k:'yasumi',n:'やすみば',main:o=>BENCHES.has(o),need:[[o=>o==='parasol',1]],how:'ベンチと、パラソル',eff:'ベンチで休むと、つかれのとれ方+10%'},
  {k:'camp',n:'キャンプ場',main:o=>o==='campfire',need:[[o=>BENCHES.has(o),2]],how:'たき火と、ベンチ2つ',eff:'たき火で遊ぶと、たのしさ+10%'},
  {k:'funsui',n:'ふんすいひろば',main:o=>o==='fountain',need:[[o=>BENCHES.has(o),1],[(o,q)=>FLOWERS.has(o)&&!isBud(q),2]],how:'噴水と、ベンチと、花2つ',eff:'噴水で遊ぶと、たのしさ+10%'},
  {k:'shinshitsu',n:'しんしつ',main:o=>BEDSET.has(o),need:[[o=>o==='shelf1'||o==='shelf2',1]],how:'ベッドと、本棚（かざり棚でも）',eff:'眠るときの、つかれのとれ方+10%'},
  {k:'ofuro',n:'おふろば',main:o=>o==='bathtub',need:[[o=>o==='tub',1]],how:'バスタブと、水おけ',eff:'おふろのたのしさ+10%'},
  {k:'hana',n:'花のベンチ',main:o=>BENCHES.has(o),need:[[(o,q)=>FLOWERS.has(o)&&!isBud(q),3]],how:'ベンチと、花3つ',eff:'ベンチで休むと、たのしさ+10%'},
  {k:'wa',n:'和の庭',main:o=>BENCHES.has(o),need:[[o=>o==='shishiodoshi',1],[o=>o==='toro',1]],how:'ベンチと、ししおどしと、石どうろう',eff:'ベンチで休むと、つかれのとれ方+10%'},
  {k:'chaya',n:'茶屋',main:o=>o==='takebench',need:[[o=>o==='noren',1],[o=>o==='takeakari',1]],how:'竹のベンチと、のれんと、竹あかり',eff:'ベンチで休むと、たのしさ+10%'},
  {k:'monooki',n:'ものおき',main:o=>o==='mbox',need:[[o=>o==='crate',1]],how:'素材箱と、木箱',eff:'素材をしまう速さ+10%'},
  {k:'buranko',n:'ぶらんこの庭',main:o=>o==='swing',need:[[o=>BENCHES.has(o),1],[(o,q)=>FLOWERS.has(o)&&!isBud(q),2]],how:'ブランコと、ベンチと、花2つ',eff:'ブランコで遊ぶと、たのしさ+10%'},
  {k:'doronko',n:'どろんこひろば',main:o=>o==='sandbox',need:[[o=>o==='tub',1]],how:'砂場と、水おけ',eff:'砂場で遊ぶと、たのしさ+10%'},
  {k:'mori',n:'もりのゆうぐ',main:o=>o==='swing',need:[[(o,q)=>(o==='tree'||o==='fruit')&&!isBud(q)||o==='ntree',2]],how:'ブランコと、木2本（果物の木でも）',eff:'ブランコで遊ぶと、たのしさ+10%'},
  {k:'shokuryo',n:'食料庫',main:o=>o==='stor',need:[[o=>o==='crate',1]],how:'食料箱と、木箱',eff:'食料をしまう速さ+10%'},
  {k:'pan',n:'パンやさん',main:o=>o==='oven',need:[[o=>o==='stor',1],[o=>o==='stable',1]],how:'かまどと、食料箱と、まるいサイドテーブル',eff:'料理の速さ+10%'},
  {k:'party',n:'ガーデンパーティー',main:o=>o==='table',need:[[o=>SEATS.includes(o),1],[o=>o==='parasol',1]],how:'食卓と、いすと、パラソル',eff:'ここで食べたときのパワー+10%'},
  {k:'yoruzuri',n:'よるづり場',main:(o,j)=>SEATS.includes(o)&&spotW(j)>=0,need:[[o=>o==='toro',1]],how:'水べのいすと、石どうろう',eff:'魚がつれる確率+5%'},
  {k:'kotori',n:'小鳥の庭',main:o=>BENCHES.has(o),need:[[o=>o==='birdbath',1],[o=>o==='hedge',1]],how:'ベンチと、水飲み鳥と、生垣',eff:'ベンチで休むと、たのしさ+10%'},
  {k:'terrace',n:'よるのテラス',main:o=>BENCHES.has(o),need:[[o=>o==='lantern',1],[o=>o==='lamp',1]],how:'ベンチと、ランタンと、かがり火',eff:'ベンチで休むと、つかれのとれ方+10%'},
  {k:'oshaberi',n:'おしゃべりひろば',main:o=>o==='signpost',need:[[o=>BENCHES.has(o),2]],how:'道しるべと、ベンチ2つ',eff:'まわり3マスでおしゃべりすると、たのしさ+10%'},
  {k:'hatake',n:'はたけの水場',main:o=>o==='well',need:[[o=>o==='farm',3]],how:'井戸と、畑3つ',eff:'まわり3マスの畑の、たねまき・収穫の速さ+10%'},
  {k:'kikori',n:'きこり小屋',main:o=>o==='lumber',need:[[o=>o==='crate',1]],how:'伐採場と、木箱',eff:'まわり3マスの木を切る速さ+10%'},
  {k:'ishikiri',n:'いしきり小屋',main:o=>o==='quarry',need:[[o=>o==='crate',1]],how:'採石場と、木箱',eff:'まわり3マスの岩をほる速さ+10%'},
  {k:'takeyabu',n:'竹やぶの小道',main:o=>o==='takeakari',need:[[o=>o==='bamboo',3]],how:'竹あかりと、竹3本',eff:'まわり3マスの竹を切る速さ+10%'},
  {k:'shosai',n:'しょさい',main:o=>o==='achair',need:[[o=>o==='shelf1',1],[o=>o==='flamp',1]],how:'ひじかけいすと、本棚と、フロアランプ',eff:'その家の住み心地+5%'},
  {k:'living',n:'リビング',main:o=>o==='sofa1',need:[[o=>o==='ltable',1],[o=>o==='monstera',1]],how:'ひとりがけソファと、ローテーブルと、かんようしょくぶつ',eff:'その家の住み心地+5%'}];
const spotNear=(j,k)=>{if(j==null||j<0)return false;const x0=j%W,y0=(j/W)|0;for(let y=Math.max(0,y0-3);y<=Math.min(H-1,y0+3);y++)for(let x=Math.max(0,x0-3);x<=Math.min(W-1,x0+3);x++){const t=SPOTM.get(y*W+x);if(t&&t.has(k))return true}return false};/* そのマスのまわり3マスに、スポットのもとの物（伐採場・井戸・道しるべなど）があるか */
const spotN=(j,...ks)=>ks.reduce((n,k)=>n+(spotHas(j,k)?1:0),0);/* おなじスポットは重ならない（いくつできても1こ分）。ちがうスポットは、たし算で重なる */
const spotHas=(j,k)=>{const t=SPOTJ.get(anc(j));return !!t&&t.has(k)};
let SPOTPREV=null;const SPOTFX=[];/* できたスポットのかこみ {x0,y0,x1,y1,t0} */
function spotCells(I){const L=[I.j,...I.found.flat()],out=[];for(const q of L){const a=anc(q),o=S.obj[a];if(!o){out.push(q);continue}for(const[x,y]of fp(o,a%W,(a/W)|0))out.push(y*W+x)}return out}/* スポットになった物のマス（大きい物は、その大きさぶん） */
function spotFx(I){const C=spotCells(I);let x0=W,y0=H,x1=0,y1=0;for(const q of C){const x=q%W,y=(q/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}SPOTFX.push({x0,y0,x1,y1,t0:performance.now(),h:hiAt(I.j)});if(SPOTFX.length>6)SPOTFX.shift();dirty=true}
function drawSpotFx(now){for(let i=SPOTFX.length-1;i>=0;i--){const f=SPOTFX[i],e=(now-f.t0)/4000;if(e>=1){SPOTFX.splice(i,1);continue}const a=e<.1?e/.1:e>.75?(1-e)/.25:1,z=f.h*LIFT,x=f.x0*TS-3,y=f.y0*TS-3-z,w=(f.x1-f.x0+1)*TS+6,h=(f.y1-f.y0+1)*TS+6;
    ctx.save();ctx.globalAlpha=a;ctx.setLineDash([5,4]);ctx.lineDashOffset=-now/60;ctx.lineWidth=2;ctx.strokeStyle='rgba(255,246,190,.95)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,6):ctx.rect(x,y,w,h);ctx.stroke();ctx.strokeStyle='rgba(200,150,40,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect?ctx.roundRect(x+1.5,y+1.5,w-3,h-3,5):ctx.rect(x+1.5,y+1.5,w-3,h-3);ctx.stroke();ctx.setLineDash([]);/* 点線のかこみ（ゆっくりまわる） */
    const n=Math.min(14,4+Math.round((f.x1-f.x0+1)*(f.y1-f.y0+1)*.8));for(let k=0;k<n;k++){const px=x+6+hash(k*31+f.x0*7+f.y0)*(w-12),py=y+6+hash(k*17+f.y1*5+f.x1)*(h-12),tw=Math.sin(now/170+k*1.9);if(tw>0)star4(ctx,px,py,(2+hash(k*13)*2.5)*tw)}ctx.restore()}}/* 中でキラキラ */
function calcSpots(){SPOTJ=new Map();SPOTM=new Map();SPOTI=[];const add=(j,k)=>{let t=SPOTJ.get(j);if(!t)SPOTJ.set(j,t=new Set());t.add(k)};
  for(let j=0;j<W*H;j++){const o=S.obj[j];if(!o||o==='part')continue;for(const sp of SPOTS){if(!sp.main(o,j))continue;const x0=j%W,y0=(j/W)|0,found=sp.need.map(()=>[]);
    for(let y=Math.max(0,y0-3);y<=Math.min(H-1,y0+3);y++)for(let x=Math.max(0,x0-3);x<=Math.min(W-1,x0+3);x++){const q=y*W+x,t=S.obj[q];if(q===j||!t||t==='part')continue;sp.need.forEach((nd,i)=>{if(nd[0](t,q))found[i].push(q)})}
    if(sp.need.every((nd,i)=>found[i].length>=nd[1])){add(j,sp.k);for(const L of found)for(const q of L)add(q,sp.k);{let t=SPOTM.get(j);if(!t)SPOTM.set(j,t=new Set());t.add(sp.k)}SPOTI.push({sp,j,found})}/* SPOTM：スポットのもとの物（まわり3マスで効くスポットは、ここからはかる）。SPOTI：できたスポットの一覧 */}}
  {const cur=new Set(SPOTI.map(I=>I.sp.k+':'+I.j));if(SPOTPREV&&SPOTPREV.s===S)for(const I of SPOTI)if(!SPOTPREV.k.has(I.sp.k+':'+I.j))spotFx(I);SPOTPREV={s:S,k:cur}}/* 新しくできたスポットは、点線でかこんでキラキラ（読みこんだときはしない） */
  const seen=S.spotSeen||(S.spotSeen={});for(const sp of SPOTS){if(seen[sp.k])continue;let on=false;for(const t of SPOTJ.values())if(t.has(sp.k)){on=true;break}if(on){seen[sp.k]=1;toast('「'+sp.n+'」ができた','good')}}}/* はじめてできたときだけ知らせる */
const TOYS=new Set(['swing','seesaw','sandbox','slide']);/* 平らな物のうち、毎コマかく物（ラグ・罠など）は、BL に anim:1 と書く */
const win64=i=>!!(S&&S.win&&typeof S.win[i]==='string'&&window.CHIPS&&window.CHIPS[S.win[i]]&&window.CHIPS[S.win[i]].g===64);/* 1マス64ドットの絵をかけた壁・ドアも、画面の大きさでかく */
function toyR(r){const a=r.act;return a&&a.type==='play'&&a.stage==='do'&&TOYS.has(a.what)&&a.obj!=null&&S.obj[a.obj]===a.what?a:null}
function toyUsers(j){return S.res.filter(q=>{const a=toyR(q);return a&&a.obj===j}).sort((p,q)=>p.id-q.id)}
function swAng(j,now){return Math.sin(now/1000*2.6+j)}/* -1〜1：手前に来ると下に大きく、奥に行くと上に小さく */
function ssAng(j,now){return Math.sin(now/1000*1.8+j)*(toyUsers(j).length?.28:.12)}
/* 遊具で遊ぶ子の位置（足もと）。おもちゃの絵に合わせて動く */
function toyPose(r,now){const p=toyPose0(r,now);if(!p)return p;const a=toyR(r),j=a.obj,t=ROTS[a.what],rv=rotAt(j);if(t===1&&rv){const fw=((szR(a.what,0)||[1,1])[0])*TS,X=(j%W)*TS;p.x=2*X+fw-p.x;r.face=-r.face}return p}/* 左右反転した遊具では、遊ぶ位置も反転 */
function toyPose0(r,now){const a=toyR(r);if(!a)return null;const j=a.obj,X=(j%W)*TS,Y=((j/W)|0)*TS,us=toyUsers(j),k=Math.max(0,us.indexOf(r)),T=now/1000;
  if(a.what==='swing'){const d=swAng(j,now);r.face=1;return{x:X+32,y:Y+29+d*9,z:Y/TS+1.05}}/* 座面（chips.js の swing の部品）の下に足。ゆれると、座面といっしょに前後する */
  if(a.what==='seesaw'){const sg=us.length>1?(k?1:-1):(r.x<X+16?-1:1)*(TS/TS),an=ssAng(j,now),X0=X+16,Y0=Y+7;r.face=-sg;return{x:X0+Math.cos(an)*sg*22+Math.sin(an)*5,y:Y0+Math.sin(an)*sg*22-Math.cos(an)*5+5,z:Y/TS+1.05}}
  if(a.what==='sandbox'){const o=[-15,15,0][k%3];if(rotAt(j)===1){r.face=k%2?-1:1;return{x:X+16+(k===2?0:(k?6:-6)),y:Y+32+o+8-Math.abs(Math.sin(T*5+k))*1.5,z:Y/TS+1.05+(o+16)/TS}}/* 縦の砂場では、たてにならぶ */const cx=X+32;r.face=o>0?-1:1;return{x:cx+o,y:Y+26-Math.abs(Math.sin(T*5+k))*1.5,z:Y/TS+1.05}}
  if(a.what==='slide'){const p=(T*.45+k*.5)%1;let x,y,f=1;
    if(p<.35){const q=p/.35;x=X+2+q*12.5;y=Y+54.25-q*35;f=1}/* 左の階段をのぼる（chips.js の slide の絵に合わせる） */
    else if(p<.42){x=X+14.5+(p-.35)/.07*22.5;y=Y+19.25}/* 上の台をわたる */
    else if(p<.7){const q=(p-.42)/.28,u=1-q;x=u*u*(X+38.25)+2*u*q*(X+54.5)+q*q*(X+67);y=u*u*(Y+21.75)+2*u*q*(Y+41.75)+q*q*(Y+51.75)}/* すべる */
    else{const q=(p-.7)/.3;x=X+67-q*65;y=Y+56.75+Math.sin(q*Math.PI)*2.5;f=-1}/* 階段の下へもどる */
    r.face=f;return{x,y,z:Y/TS+2.05}}
  return null}
function spotW(i){const w=sideW(i);if(w>=0)return w;const y=i/W|0;if(y>0&&S.ground[i-W]===1)return i-W;if(y+1<H&&S.ground[i+W]===1)return i+W;return -1}/* 椅子のすぐとなり（上下左右）の水マス（なければ-1） */
function fishW(j){return fSpot(j)?spotW(j):sideW(j)}/* 釣るときに見る水マス（釣りスポットは上下も） */
function sideW(j){const x=j%W;if(x+1<W&&S.ground[j+1]===1)return j+1;if(x>0&&S.ground[j-1]===1)return j-1;return -1}/* 左右どちらかが水 */
function adjOf(j,fn){const x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(fn(k))return k}return -1}
const elemCount=el=>S.res.filter(r=>r.elem===el).length;
const NEEDT=[8,20,36,56,80,108,140,176,216,260,308],NEEDF=[13,32,58,90,128,173,224,282,346,416,493],needFor=el=>{const T=WD===FREE?NEEDF:NEEDT;return T[Math.min(T.length-1,elemCount(el))]};/* なかまを呼ぶのに必要な力（いる人数ごと）。フリーモードは自然の力が弱いので多め */
function revRadius(o){const b=BL[o];if(!b)return 0;if(o==='tower')return 7;if(o==='statue')return 4;if(o==='farm')return 2;if(b.kind==='block')return 1;if(b.kind==='plant')return 3;if(b.kind==='furn')return 2;if(b.kind==='build')return 3;if(o==='ntree'||o==='berry'||o==='bamboo'||o==='takenoko')return 1;return 0}
/* 属性の力の表示（例：属性 木+1・土+2） */
function attrTxt(id){const b=BL[id];if(!b||!b.attr||b.kind==='block')return'';const a=Object.entries(b.attr).filter(e=>e[1]>0);return a.length?'属性 '+a.map(([k,v])=>ELEM[k].name+'+'+(+v.toFixed(2))).join('・'):''}
const withAttr=(id,t)=>{const a=attrTxt(id);return a?(t?t+'　':'')+'【'+a+'】':t||''};
function recount(){if(S.broken)S.broken=S.broken.filter(b=>!S.obj[b.j]);calcSpots();/* こわれた物の場所に、なにか置いたら、こわれた物のリストからはずす */
  for(const key in S.win||{}){const j=+key,wall=k=>HOME_WALLS.has(S.obj[k])||HOME_DOORS.has(S.obj[k]);if(S.win[j]==='wreath'&&HOME_DOORS.has(S.obj[j])&&(wall(j-W)||wall(j+W))&&!(wall(j-1)||wall(j+1))){S.inv.wreath=(S.inv.wreath||0)+1;delete S.win[j];toast('たてのドアのリースを、持ち物にもどしました')}}/* たてのドアにはリースをかけられない。まわりの壁が変わってたてになったら、知らせてもどす */
  STATUE=-1;OBOX=-1;BOARD=-1;counts={};LIGHTS=[];LITP=[];STELES=[];TOWERS=[];NEARFLOWER=new Set();NEARWELL=new Set();NEARMILL=new Set();NEARVANE=new Set();NEARSIGN=new Set();NEARPARA=new Set();RUGC=new Map();for(const k in S.rug||{})for(const c of rugCells(+k))RUGC.set(c,+k);RFC=new Map();for(const k in S.roof||{})for(const c of rugCells(+k))RFC.set(c,+k);/* 屋根の下のマス→屋根の左上 *//* ラグがしいてあるマス→ラグの左上 */ENVG=new Float32Array(W*H);REV=new Set();ATTR={};ELEM_KEYS.forEach(k=>ATTR[k]=0);
  const around=(j,r,set)=>{const x=j%W,y=(j/W)|0,h=set===REV?hiAt(j):-1;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+1)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&!(h>=0&&hiAt(ny*W+nx)!==h))set.add(ny*W+nx)}};/* 緑の広がり（REV）は、段差をこえない */
  const addA=a=>{if(a)for(const k in a)ATTR[k]+=a[k]};
  let baseN=0,revN=0;
  for(const k in S.rug||{}){const o=S.rug[k];counts[o]=(counts[o]||0)+1;if(BL[o])addA(BL[o].attr)}/* ラグ（床の上の層）も数える */
  for(const k in S.roof||{}){const o=S.roof[k];counts[o]=(counts[o]||0)+1;if(BL[o])addA(BL[o].attr)}/* ガゼボ・東屋（屋根の層）も数える */
  for(let j=0;j<W*H;j++){const o=S.obj[j],f=S.floor[j],x=j%W,y=(j/W)|0;
    if(f){around(j,1,REV)}/* 床・道・壁などのブロックは、属性の力をためない */
    
    if(!o||o==='part')continue;counts[o]=(counts[o]||0)+1;
    if(o==='statue')STATUE=j;if(o==='obox')OBOX=j;if(o==='board')BOARD=j;
    if(o==='stele')STELES.push(j);
    if(o==='lamp'||o==='lighthouse'||o==='tower'||o==='campfire'||o==='statue'||o==='torch'||o==='candle'||o==='lantern'||o==='flamp'||o==='yomawari'||o==='toro'||o==='takeakari')LIGHTS.push(j);
    if(LIGHTP[o])LITP.push(j);/* 夜に光をかく明かりの一覧 */
    if(o==='watch'||o==='yogan'||o==='tower')TOWERS.push(j);
    if(FLOWERS.has(o)&&o!=='lotus'&&!isBud(j))around(j,1,NEARFLOWER);/* 花：まわり1マス・かさならない */
    if(o==='well')around(j,3,NEARWELL);
    if(o==='windmill')around(j,5,NEARMILL);
    if(o==='jar')around(j,1,NEARWELL);/* みずがめ：まわり1マスの畑は水やりいらず */if(o==='vane')around(j,3,NEARVANE);if(o==='signpost')around(j,3,NEARSIGN);/* 風見鶏：まわり3マスは足が速い */
    const tbud=(o==='tree'||o==='fruit')&&isBud(j);/* 木も花と同じ。芽のあいだは、効果なし */
    if(o==='parasol')around(j,1,NEARPARA);/* パラソル：まわり1マス・かさならない */else if(!tbud&&BL[o]&&BL[o].env){const er=BL[o].er||3;for(let dy=-er;dy<=er;dy++)for(let dx=-er;dx<=er;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)ENVG[ny*W+nx]+=BL[o].env}}/* にわの家具：まわりの環境 */
    if(BL[o]&&BL[o].kind!=='block'&&(!FLOWERS.has(o)||!isBud(j))&&!tbud)addA(BL[o].attr);
    const rr=revRadius(o);if(rr&&!tbud)around(j,rr,REV);
  }
  {/* 村：家・置いた物（自然の物・雑草・きのこはのぞく）・ラグ・屋根のまわり3マス */const m=new Uint8Array(W*H),v=new Uint8Array(W*H);for(let j=0;j<W*H;j++){const o=S.obj[j];if(o&&(o==='part'||BL[o]&&!BL[o].natural&&!WEEDS.has(o)))m[j]=1}for(const k in S.rug||{})m[+k]=1;for(const k in S.roof||{})m[+k]=1;
    const t=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let f=0;for(let d=-3;d<=3&&!f;d++){const q=x+d;if(q>=0&&q<W&&m[y*W+q])f=1}t[y*W+x]=f}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let f=0;for(let d=-3;d<=3&&!f;d++){const q=y+d;if(q>=0&&q<H&&t[q*W+x])f=1}v[y*W+x]=f}VILL=v;
    for(let j=0;j<W*H;j++)if(v[j]&&S.ground[j]===1)ATTR.water+=.3}/* 水の力は、村の中の池・川だけ（1マス0.3） */
  for(const k of NEARPARA)ENVG[k]+=7;/* パラソルがいくつ重なっても、1つぶん（BL.parasol.env） */
  if(WD===FREE)for(let j=0;j<W*H;j++)REV.add(j);/* フリーモードの土地は荒れていない */
  {const st=WD===1?1:0,g='weed'+st+'g',k='weed'+st+'k';for(let j=0;j<W*H;j++){const o=S.obj[j];if(o===k&&REV.has(j))S.obj[j]=g;else if((o===g||o==='weedc')&&!REV.has(j))S.obj[j]=k}}/* 雑草は土地に合わせる：よみがえった土地（緑）は緑の草、荒れた土地は枯れた草（あとから緑になった所の枯れた草も、緑の草に） */
  for(let j=0;j<W*H;j++){if(S.ground[j]===1)continue;baseN++;if(REV.has(j))revN++}
  /* 属性値は、せいれいの依頼が出る前から基地にある対象物も含めて数える。依頼開始時の基準化・差し引きはしない。 */
  BASEPCT=Math.round(revN/Math.max(1,baseN)*100);GRASSN=revN;// マップぜんぶの、みどりのマス
  dirty=true;
}

// せいれいは道（道・石だたみ）を優先して歩く：道は1マス2、ほかは3の重みで最短を探す
const FSPD={path:1.25,floor:1.15,brickfloor:1.15,stonefloor:1.15,herrfloor:1.15,carpet:1,gravel:1.4,woodpath:1.55,stone:1.55,brick:1.75},FCOST={path:4,floor:5,brickfloor:5,stonefloor:5,herrfloor:5,carpet:6,gravel:4,woodpath:3,stone:3,brick:3};// 道の速さと、道えらびの重み（ふつうは6）
function bfs(sx,sy,enemy){if(!enemy)return roadSearch(sx,sy);return bfs0(sx,sy,enemy)}
function roadSearch(sx,sy,block){
  const N=W*H,dist=new Int16Array(N).fill(-1),prev=new Int32Array(N).fill(-1),cost=new Int32Array(N).fill(-1),B=[];
  const s=clamp(sy,0,H-1)*W+clamp(sx,0,W-1);cost[s]=0;dist[s]=0;B[0]=[s];
  for(let c=0;c<B.length;c++){const L=B[c];if(!L)continue;for(const i of L){if(cost[i]!==c)continue;const x=i%W,y=(i/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(!walk(j)&&!(S.ground[i]===1&&S.ground[j]===1&&!solidOf(j))||block&&block.has(j)||cliff2(i,j))continue;/* 水の中にいるときは、水の中も歩ける */
      const fl=S.floor[j],nc=c+(FCOST[fl]||6)*(jumpEdge(i,j)?5:1)*(S.ground[j]===2?2:1)*(onLadder(i,j)?2:1);/* せいれいは、段差をよじのぼると5倍の手間（階段・坂をえらびやすい） *//* 段差を飛ぶのは、歩くより3倍の手間 */if(cost[j]>=0&&cost[j]<=nc)continue;
      cost[j]=nc;dist[j]=dist[i]+1;prev[j]=i;(B[nc]||(B[nc]=[])).push(j)}}}
  return {dist,prev};
}
function bfs0(sx,sy,enemy){
  const dist=new Int16Array(W*H).fill(-1),prev=new Int32Array(W*H).fill(-1),q=new Int32Array(W*H);
  let h=0,t=0;const s=clamp(sy,0,H-1)*W+clamp(sx,0,W-1);dist[s]=0;q[t++]=s;
  while(h<t){const i=q[h++],x=i%W,y=(i/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(dist[j]>=0)continue;
      if(wetJ(j)||cliff2(i,j))continue;if((solidOf(j)||HOME_DOORS.has(typeAt(j))||GATE_IDS.has(typeAt(j)))&&(enemy===2||!breakable(typeAt(j))))continue;
      dist[j]=dist[i]+1;prev[j]=i;q[t++]=j}}
  return {dist,prev};
}
/* コワイノの道さがし：まわり道と、壁をこわす手間をくらべる（うすい壁・弱い壁ほどねらわれる）。sdで1体ずつ道が少しちがう */
function bfsE(sx,sy,wk,sd){
  const N=W*H,dist=new Int16Array(N).fill(-1),prev=new Int32Array(N).fill(-1),cost=new Int32Array(N).fill(-1),B=[];
  const s=clamp(sy,0,H-1)*W+clamp(sx,0,W-1);cost[s]=0;dist[s]=0;B[0]=[s];
  for(let c=0;c<B.length;c++){const L=B[c];if(!L)continue;for(const i of L){if(cost[i]!==c)continue;const x=i%W,y=(i/W)|0;
    for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(wetJ(j)||cliff2(i,j))continue;
      let add=2+((Math.imul(j^sd,2654435761)>>>29)&1);const o=typeAt(j);
      if(jumpEdge(i,j))add*=3;/* 段差を飛ぶのは3倍 */if(S.ground[j]===2)add*=2;/* 浅瀬は2倍 */if(solidOf(j)||HOME_DOORS.has(o)||GATE_IDS.has(o)){if(!breakable(o))continue;add+=wk}/* 壁はどれも同じ手間（守りの薄い所をねらうことはしない） */
      const nc=c+add;if(cost[j]>=0&&cost[j]<=nc)continue;cost[j]=nc;dist[j]=dist[i]+1;prev[j]=i;(B[nc]||(B[nc]=[])).push(j)}}}
  return {dist,prev};
}
function pathTo(G,j){const p=[];while(j>=0&&G.dist[j]>0){p.push(j);j=G.prev[j]}return p.reverse()}
// ほかの子がいる・向かっているマスは避けて、空いている別のマスから作業する（空きがなければ同じマスも使う）
let TAKEN=null;
let WEEDNEAR=0;function wreqList(){/* 「みる」でタップした草・きのこ（のこっている物だけ） */const q=S.wreq;if(!q)return [];const L=[];for(const k in q){if(WEEDS.has(S.obj[+k]))L.push(+k);else delete q[k]}return L}
function nearest(G,pred,maxD=60){let best=-1,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>=bd||d>maxD)continue;if(TAKEN&&TAKEN.has(j))continue;if(pred(j)){best=j;bd=d}}
  return best}
function nearestVia(G,G2,pred,maxD=60){let best=-1,bd=1e9;for(let j=0;j<W*H;j++){const d=G.dist[j],d2=G2.dist[j];if(d<0||d2<0||d>maxD||d+d2>=bd)continue;if(TAKEN&&TAKEN.has(j))continue;if(pred(j)){best=j;bd=d+d2}}
  return best}/* よりみち：いまの場所 → ここ → G2 のはじまりまで、いちばん近くなるマス（料理の材料をとる箱など） */

/* ---------- 演出 ---------- */
/* 作業する物の方を向く（木・岩） */
function faceTo(r,j){if(j==null||j<0)return;const ox=j%W+.5,oy=((j/W)|0)+.5;if(Math.abs(ox-r.x)>.15)r.face=ox>=r.x?1:-1;r.faceObj=j}
const floats=[],shots=[],fx=[],pops=new Map(),RLVQ=[];
function addFloat(x,y,text,color){if(floats.length>40)floats.shift();floats.push({x,y,text,color:color||'#ecdcbc',life:1})}
/* 作業：経験値だけ（パワーは、遊ぶ・食べる・たのしいときだけ）。成長を少しゆっくりにし、端数は保存する */
function addSpiritXp(n,r){if(!n||!r||r.xp==null)return;const before=rLv(r),scaled=(n+XPBL[before])*.8+(r.xpf||0),whole=Math.floor(scaled+1e-9);r.xpf=Math.round((scaled-whole)*1000)/1000;r.xp+=whole;const after=rLv(r);if(after>before){addFloat(r.x,r.y-1.8,'Lv'+after+'!','#9ff0ff');RLVQ.push({id:r.id,from:before,to:after})}}

const DINEPT=[1,1,2,2,3,3,4];/* 家の中の食卓で食べたときの経験値：ダイニング家具の数（0〜6）ごと */
const HOUSEPW=[.45,.45,.9,.9,1.35,1.35,1.8];/* 家の中の食卓で食べたときのパワー（[ダイニング家具の数]） */
const LVPW=[0,0,0,.45,.45,.9,.9,1.35,1.35,1.8,1.8,2.25,2.25,2.7,2.7,3.15,3.15,3.6,3.6,4.05,4.05];/* せいれいのレベルで足されるパワー（[レベル]） */
function addPt(pw,r,xp){if(!pw&&!xp)return;/* pw：もらえるパワー、xp：せいれいの経験値（どちらも実数） */
  if(r&&r.xp!=null){addSpiritXp(xp,r);pw+=LVPW[Math.min(LVPW.length-1,rLv(r))]}/* レベルアップは、ゲームを止めて知らせる */
  S.ptFrac=(S.ptFrac||0)+pw;let n=Math.floor(S.ptFrac+1e-9);S.ptFrac=Math.max(0,S.ptFrac-n);if(!n)return;/* パワーは小数のまま足していき、1たまるごとにふえる */
  S.pt+=n;S.totalPt+=n;if(r)addFloat(r.x,r.y-1,'+'+n,'#ecdcbc')}
function burst(j,kind,snd){
  const cx=(j%W)*TS+16,cy=((j/W)|0)*TS+18;
  const cols=kind==='block'?['#e2cd98','#b4925e','#fff6dc']:kind==='plant'?['#8fe07a','#ffd35c','#ff9cc0','#fff']:['#ffe27a','#fff','#9ff0ff','#ffb35c'];
  fx.push({k:'ring',x:cx,y:cy,life:1});
  for(let n=0;n<16;n++){const a=Math.random()*Math.PI*2,s=rnd(40,110);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:1,col:pick(cols),r:rnd(1.5,3)})}
  if(kind!=='block')for(let n=0;n<6;n++){const a=Math.random()*Math.PI*2,s=rnd(20,60);fx.push({k:'star',x:cx,y:cy-8,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:1.2,col:'#fff7c0'})}
  pops.set(j,performance.now());sfxAt(snd||kind,(j%W)+.5,(j/W)|0);
}
function plantMound(c,x,y,i){const k=i==null?0:hash(i*13+5);const w=7.5+k*2,h=2.8+k*.8;c.fillStyle='rgba(54,38,24,.22)';c.beginPath();c.ellipse(x+16,y+29,w+1,h*.72,0,0,7);c.fill();c.fillStyle='#a9784f';c.beginPath();c.ellipse(x+16,y+27.5,w,h,0,Math.PI,0);c.ellipse(x+16,y+27.5,w,h*.48,0,0,Math.PI);c.fill();c.fillStyle='rgba(225,177,125,.5)';c.beginPath();c.ellipse(x+15,y+26.3,w*.58,h*.38,-.08,Math.PI,0);c.fill()}
function plantSparkle(j,id){const FK={clover:'fl_clover',bellf:'fl_bell',salvia:'fl_salvia',lily:'fl_lily',lotus:'fl_lotus'},key=FK[id]||'tree',a=ART[key],w=FLOWERS.has(id)?26:30,h=a&&a.ok?w*a.h/a.w:w,cx=(j%W)*TS+16,cy=((j/W)|0)*TS+30-h*.65;for(let n=0;n<3;n++)fx.push({k:'star',x:cx+(n-1)*8,y:cy+(n%2?3:-2),vx:(n-1)*3,vy:-rnd(5,10),life:rnd(.55,.75),col:n===1?'#fff9d8':'#dfffba'});sfxAt('sow',(j%W)+.5,(j/W)|0)}
/* ---------- 効果範囲の表示 ---------- */
// おく画面ではまわりに効く物の範囲を出す。みる画面ではタップした物の範囲をしばらく出す
const RANGE_COL={flower:'255,150,190',well:'90,170,240',windmill:'90,210,180',light:'255,190,90',watch:'255,110,110',env:'150,205,110',vane:'150,170,255',sign:'255,170,120'};
function rangeOf(o,j){if(o==='lotus')return{k:'flower',cells:2,sq:1};/* ハス：まわり2マスの四角（nearLotus） */if(FLOWERS.has(o))return{k:'flower',cells:1};if(o==='well')return{k:'well',cells:3};if(o==='windmill')return{k:'windmill',cells:5};if(o==='jar')return{k:'well',cells:1};if(o==='vane')return{k:'vane',cells:3};if(o==='signpost')return{k:'sign',cells:3};if(BL[o]&&BL[o].env)return{k:'env',cells:BL[o].er||3,sq:1};
  if(INDL.has(o)){const h=j!=null&&roomOf(j);if(!h)return{k:'light',r:1.5};let m=1;for(const k of h.set)m=Math.max(m,Math.hypot(k%W-j%W,((k/W)|0)-((j/W)|0)));return{k:'light',r:m+1.5}}
  if(o==='lamp'||o==='campfire'||o==='torch'||o==='yomawari'||o==='toro'||o==='takeakari')return{k:'light',r:3.5};if(o==='lighthouse')return{k:'light',r:8};if(o==='stele')return{k:'sign',cells:5};if(o==='tower')return{k:'light',r:7};
  if(o==='watch'||o==='yogan'){const st=(o==='yogan'?YOGAN:WATCH)[(j!=null&&S.hp['L'+j])||1];return{k:'watch',r:st.range}}return null}
let SHOWR=null,MANC='あそびかた';
function drawRangeOne(o,j,x,y,strong){const R=rangeOf(o,j);if(!R)return;const col=RANGE_COL[R.k],z=BL[o].sz||[1,1],cx=(x+z[0]/2)*TS,cy=(y+z[1]/2)*TS;
  ctx.save();if(R.cells){const set=new Set(),r=R.cells;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(!R.sq&&dx*dx+dy*dy>r*r+1)continue;set.add((dx+8)*32+(dy+8))}
    ctx.fillStyle='rgba('+col+','+(strong?.28:.14)+')';for(const k of set){const dx=((k/32)|0)-8,dy=k%32-8;ctx.fillRect((x+dx)*TS,(y+dy)*TS,TS,TS)}
    ctx.strokeStyle='rgba('+col+','+(strong?.95:.6)+')';ctx.lineWidth=strong?2:1.5;ctx.beginPath();
    for(const k of set){const dx=((k/32)|0)-8,dy=k%32-8,px=(x+dx)*TS,py=(y+dy)*TS,has=(a,b)=>set.has((dx+a+8)*32+(dy+b+8));
      if(!has(0,-1)){ctx.moveTo(px,py);ctx.lineTo(px+TS,py)}if(!has(0,1)){ctx.moveTo(px,py+TS);ctx.lineTo(px+TS,py+TS)}if(!has(-1,0)){ctx.moveTo(px,py);ctx.lineTo(px,py+TS)}if(!has(1,0)){ctx.moveTo(px+TS,py);ctx.lineTo(px+TS,py+TS)}}ctx.stroke()}
  else{ctx.fillStyle='rgba('+col+','+(strong?.22:.1)+')';ctx.beginPath();ctx.arc(cx,cy,R.r*TS,0,7);ctx.fill();ctx.strokeStyle='rgba('+col+','+(strong?.95:.55)+')';ctx.lineWidth=strong?2:1.5;ctx.setLineDash([6,5]);ctx.stroke();ctx.setLineDash([])}
  ctx.restore()}
function drawRanges(now){
  if(mode==='build'){const x0=Math.floor(cam.x/TS)-7,y0=Math.floor(cam.y/TS)-7,x1=Math.ceil((cam.x+VW/cam.z)/TS)+7,y1=Math.ceil((cam.y+VH/cam.z)/TS)+7;
    const U={};// 同じ種類のマス範囲はまとめて1つの形にする
    for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const j=y*W+x,o=S.obj[j];if(!o)continue;const R=rangeOf(o,j);if(!R||R.k==='watch')continue;// 射程は「みる」でタップしたときだけ
      if(R.cells){const st=U[R.k]||(U[R.k]=new Set()),r=R.cells;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(!R.sq&&dx*dx+dy*dy>r*r+1)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)st.add(ny*W+nx)}}else drawRangeOne(o,j,x,y,false)}
    for(const k in U){const set=U[k],col=RANGE_COL[k];ctx.save();ctx.fillStyle='rgba('+col+',.14)';for(const j of set)ctx.fillRect((j%W)*TS,((j/W)|0)*TS,TS,TS);
      ctx.strokeStyle='rgba('+col+',.7)';ctx.lineWidth=1.5;ctx.beginPath();for(const j of set){const px=(j%W)*TS,py=((j/W)|0)*TS;
        if(!set.has(j-W)){ctx.moveTo(px,py);ctx.lineTo(px+TS,py)}if(!set.has(j+W)){ctx.moveTo(px,py+TS);ctx.lineTo(px+TS,py+TS)}if(!set.has(j-1)){ctx.moveTo(px,py);ctx.lineTo(px,py+TS)}if(!set.has(j+1)){ctx.moveTo(px+TS,py);ctx.lineTo(px+TS,py+TS)}}ctx.stroke();ctx.restore()}
    if(pending&&pending.kind==='one'&&rangeOf(pending.id)&&pending.id!=='watch')drawRangeOne(pending.id,null,pending.x,pending.y,true);
    if(pending&&pending.kind==='plant'&&FLOWERS.has(pending.id))for(const c of pending.cells)drawRangeOne(pending.id,null,c[0],c[1],true)}
  else if(SHOWR){if(now>SHOWR.until||S.obj[SHOWR.j]!==SHOWR.o)SHOWR=null;else drawRangeOne(SHOWR.o,SHOWR.j,SHOWR.j%W,(SHOWR.j/W)|0,true)}}
function burstAt(x,y,kind){burst((y|0)*W+(x|0),kind)}
function spawnFX(x,y,col){const cx=x*TS+16,cy=y*TS+20;
  fx.push({k:'pillar',x:cx,y:cy,vx:0,vy:0,life:1.6,col});
  for(let n=0;n<3;n++)fx.push({k:'ring',x:cx,y:cy,life:1+n*.35,col});
  for(let n=0;n<40;n++){const a=Math.random()*Math.PI*2,s=rnd(50,170);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-140,life:1.3,col:pick([col,col,'#fff','#fff7c0']),r:rnd(2,4)})}
  for(let n=0;n<14;n++){const a=Math.random()*Math.PI*2,s=rnd(30,90);fx.push({k:'star',x:cx,y:cy-20,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:1.6,col:pick(['#fff7c0',col,'#fff'])})}
  dirty=true}

/* ---------- せいれいの行動 ---------- */
function occTiles(r){const bl=new Set();for(const q of S.res)if(q!==r&&!q.hidden&&!(q.act&&q.act.stage==='walk'&&q.path&&q.path.length))bl.add((q.y|0)*W+(q.x|0));return bl}
// 止まっている子のマスを避けた道を選ぶ（なければふつうの道）
let FLEEBL=null;/* 逃げるとき、「コワイノ」のそばを通らないための通れないマス */
function avoidPath(r,G,goal){const bl=occTiles(r);if(FLEEBL)for(const k of FLEEBL)bl.add(k);bl.delete(goal);bl.delete((r.y|0)*W+(r.x|0));if(!bl.size)return pathTo(G,goal);
  const G2=roadSearch(r.x|0,r.y|0,bl);return G2.dist[goal]>=0?pathTo(G2,goal):pathTo(G,goal)}
const benchSpot=G=>nearest(G,j=>(BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j))&&free('o'+j,1),40);
const KEEPC=new Set(['store','smat','eat','fetch','flee','faint','shiver','step','chatwait','questjoy','pickdrop','pickseed']),FOODJOB=new Set(['harvest','gather','fish']),MATJOB=new Set(['chop','mine','weed']);/* 持ったままでいい行動・食べ物をあつめる作業・素材をあつめる作業 */
function startAct(r,G,type,stand,o){
  if(stand>=0&&stand===r.avoidJ&&S.t<r.avoidU&&type!=='idle')return startAct(r,G,'idle',-1,{dur:15});/* 10分止まったままだった行き先は、しばらくえらばない */
  if(!KEEPC.has(type)&&G&&!(o&&(o.run||o.hunt!=null))&&!r.coffin){let k=-1;if(matN(r)>0&&!MATJOB.has(type)&&matTot()<matCap()){k=nearest(G,j=>adjOf(j,q=>storageAt(q,'mat'))>=0,200);if(k>=0){type='smat';stand=k;o=null}}if(k<0&&carryN(r)>0&&!FOODJOB.has(type)&&S.food<foodCap()){k=nearest(G,j=>adjOf(j,q=>storageAt(q,'food'))>=0,200);if(k>=0){type='store';stand=k;o=null}}}/* べつの行動にうつる前に、持っている物を箱へしまう（同じ物をあつめる作業のつづきと、にげる・たたかう・食べるときはそのまま） */
  if(type==='idle'&&stand<0&&G&&!isNight()&&(r.restCD||0)<=S.t){const bj=benchSpot(G);if(bj>=0){type='rest';stand=bj;o={key:'o'+bj,obj:anc(bj),seat:bj,dur:Math.max(30,(o&&o.dur)||15)}}}/* ひとやすみは、あいているベンチがあればベンチで */
  r.bubble='';/* 前の行動の吹き出し（💤など）を残さない */
  r.act=Object.assign({type,stand,t:0,stage:'walk'},o||{});
  if(r.act.key)reserve(r.act.key);
  r.path=stand>=0?avoidPath(r,G,stand):[];
  if(stand>=0&&G&&G.dist[stand]<0||!r.path.length&&stand>=0&&stand!==(r.y|0)*W+(r.x|0)&&Math.abs(stand%W+.5-r.x)+Math.abs(((stand/W)|0)+.5-r.y)>1.6){noPass(r);endAct(r);r.act={type:'idle',stage:'do',t:0,dur:8};return}/* 行きたい場所に通れない */
  if(!r.path.length)beginDo(r);
}
function noPass(r){if(r.act){if(r.act.key)BAN.set(r.act.key,S.t+60);if(r.act.stand>=0){r.routeAvoid=r.routeAvoid||{};r.routeAvoid[r.act.stand]=S.t+60}}r.visitRetryAt=S.t+10;if((r.npT||0)>S.t)return;r.npT=S.t+90;addFloat(r.x,r.y-1.6,'通れないよ…','#ffd0c0')}
const workOn=j=>j!=null&&!!S&&S.res.some(r=>r.act&&r.act.stage==='do'&&r.act.obj===j&&WORKP[r.act.type]&&WORKP[r.act.type](r,r.act)!=null);/* せいれいが作業中のマス：そのマスの育ちぐあいのバーは出さない（足もとの作業のバーと二重にしない） */
const WORKP={/* 作業の進み具合（0〜1）。足もとの進捗バーに出す（建てる・直す・料理は、その場所のバーだけ出す） */
chop:(r,a)=>a.camp?a.t/20:null,mine:(r,a)=>a.camp?a.t/20:null,/* 木・岩は、その木・岩の上の「のこり」のバーだけ（足もとのバーと二重にしない） */
tend:(r,a)=>a.t/20,water:(r,a)=>a.t/(r.elem==='water'?8:16),sow:(r,a)=>a.t/10,harvest:(r,a)=>a.t/12,gather:(r,a)=>a.t/15,offer:(r,a)=>a.t/10,pickseed:(r,a)=>a.t/8,fish:(r,a)=>a.t/50,
till:(r,a)=>{const d=S.dyn[a.obj];return Math.max(a.t/45,d&&d.p!=null?d.p/30:0)},
plant:(r,a)=>{const d=S.dyn[a.obj];return Math.max(a.t/40,d&&d.p!=null?d.p/20:0)}};
const RESUME=new Set(['chop','mine','repair','water','tend','sow','harvest']);/* とちゅうでやめても、つぎは続きからする作業（建てる・家具づくり・耕す・植える・料理は、もとから続きから） */
function beginDo(r){const a=r.act;a.stage='do';a.t=0;a.e0=r.energy;if(RESUME.has(a.type)&&a.obj!=null){const k='w'+a.type+a.obj;if(S.hp[k]!=null){a.t=S.hp[k];delete S.hp[k]}}const f=ACT[a.type].start;if(f&&f(r,a)===false){endAct(r);r.act={type:'idle',stage:'do',t:0,dur:8}}}
function endAct(r){if(r.act){{const a=r.act;if(a.stage==='do'&&!a.fin&&a.t>0&&RESUME.has(a.type)&&a.obj!=null)S.hp['w'+a.type+a.obj]=a.t}/* とちゅうでやめた作業は、どこまでやったかおぼえておく */if(r.act.type==='sevreact')sevInterrupted(r,r.act);if(r.act.type==='questjoy'){settleQuestVisit(r,r.act);if(r.act.joyUntil!=null&&JOYU.get(r)===r.act.joyUntil)JOYU.delete(r)}if(r.act.key)release(r.act.key);if(r.act.type==='bathe'){if(r.act.stage==='do')r.bathD=dayNo();/* 水に入ったあとでやめたら、その日はもう水浴びしない（入ったり出たりをくりかえさない） */if(!S.res.some(q=>q!==r&&q.act&&q.act.type==='bathe'&&q.act.stage==='do'))stopWave()}/* 水浴びをとちゅうでやめたら、ワープせず、水の中からは歩いて出る（rescueStuck） */if(r.act.order){const o=S.orders.find(q=>q.id===r.act.order);if(o&&o.worker===r.id)o.worker=null}}r.act=null;r.path=[];r.hidden=false;r.bubble=''}

function plantFin(r,a){/* 芽が育ちきったら、花や木にする */const d=S.dyn[a.obj];if(S.obj[a.obj]==='sprout'&&d&&d.p>=20){const id=d.plant;S.obj[a.obj]=id;if(BL[id].dyn)S.dyn[a.obj]={g:0};else delete S.dyn[a.obj];if(PLANTS.includes(id)){(S.bud||(S.bud={}))[a.obj]=dayNo()+1}noteQuestPlacement(id,a.obj);recount();if(PLANTS.includes(id))plantSparkle(a.obj,id);else burst(a.obj,'plant','sow');addSpiritXp(2,r);checkQuest()}}
const work=(r,dt)=>{r.energy=Math.max(0,r.energy-.22*dt*(r.fun<30?1.7:r.fun<60?1.3:1)/((r.vr&&r.vr.sta)||1)/(EL_STA[r.elem]||1)*(trt(r,'tafu')||trt(r,'nebari')?.75:1))};/* はたらくと疲れる。たのしさが低いと疲れやすい */
const fast=(r,el)=>r.elem===el?2:1;

const ACT={
  eat:{start(r,a){if(!r.meal)return false;const m=typeof r.meal==='number'?{u:r.meal,pt:0,pw:0,e:'🍙'}:r.meal;r.meal=null;sfxAt('eat',r.x,r.y);a.to=Math.min(hMax(r),r.hunger+m.u*100/fullN(r));{const seat=!!a.pt;a.pt=(a.pt||0)+(seat?m.pt:Math.floor(m.pt/2));a.pw=(a.pw||0)+(seat?(m.pw||0):(m.pw||0)/2)}/* 席がないと、料理のぶんは半分 */a.e=m.e;a.items=m.items;r.bubble=m.e;if(a.tdir===-1||a.tdir===1)r.face=a.tdir;if(a.tdir!=null){const h=roomOf((r.y|0)*W+(r.x|0));if(h){let n=0;for(const j of h.inside){const o=S.obj[j];if(o&&BL[o]&&BL[o].cat==='living')n+=BL[o].dw||1}for(const o of rugsIn(h.inside))n+=BL[o].dw||1;a.pt=(a.pt||0)+DINEPT[Math.min(6,n)];a.pw=(a.pw||0)+HOUSEPW[Math.min(6,n)]}}/* 家の中の食卓：ダイニング家具が多いほど、パワーが多い */},tick(r,a,dt){r.hunger=Math.min(a.to,r.hunger+2.6*dt);if(a.tdir!=null){a.bt=(a.bt||0)+dt;if(a.bt>5){a.bt=0;const m=S.res.some(q=>q!==r&&q.act&&q.act.type==='eat'&&q.act.stage==='do'&&q.act.tdir!=null&&Math.hypot(q.x-r.x,q.y-r.y)<3.5);r.bubble=m?pick(['😊',a.e||'🍙','😋','🎵']):(a.e||'🍙');if(m){r.fun=Math.min(100,r.fun+1);if(!a.mc){const q=S.res.find(q=>q!==r&&q.act&&q.act.type==='eat'&&q.act.stage==='do'&&q.act.tdir!=null&&Math.hypot(q.x-r.x,q.y-r.y)<3.5);if(q&&!q.act.mc){a.mc=q.act.mc=1;mate(r,q)}}}}}},done:(r,a)=>r.hunger>=a.to-.01||a.t>=60,end(r,a){const it=a.items||[];if(it.includes('berry')||it.includes('apple'))r.fun=Math.min(100,r.fun+8);if(it.includes('yakiberry'))r.fun=Math.min(100,r.fun+15);if(it.includes('yakiimo'))r.wkB=S.t+180;/* wkT は、歩いてもすすまない時間（べつの物） */if(it.includes('yakiapple'))r.mvT=S.t+180;if(it.includes('bread'))r.full=S.t+300;if(it.includes('soup'))r.energy=Math.min(100,r.energy+25);if(it.includes('salad')){r.energy=Math.min(100,r.energy+10);r.fun=Math.min(100,r.fun+10)}if(it.includes('yakisoba')){r.energy=Math.min(100,r.energy+20);r.fun=Math.min(100,r.fun+10)}if(it.includes('takoyaki'))r.fun=Math.min(100,r.fun+25);if(it.includes('ringoame'))r.fun=Math.min(100,r.fun+20);if(it.includes('kakigori')){r.energy=Math.min(100,r.energy+15);r.fun=Math.min(100,r.fun+10)}if(it.includes('wataame'))r.fun=Math.min(100,r.fun+25);if(it.includes(favDish(r))){a.pt=(a.pt||0)+2;a.pw=(a.pw||0)+.9;addFloat(r.x,r.y-1.6,'だいすきな味！','#ffd38a')}addPt(a.pw,r,a.pt);if(a.snack){r.bubble='😊';r.fun=Math.min(100,r.fun+10);r.shine=performance.now()}}},/* 料理ごとの効果 */
  forage:{start(r,a){const d=S.dyn[a.obj];if(!d||d.g<100)return false;d.g=0;a.e=S.obj[a.obj]==='fruit'?'🍎':'🫐';r.bubble=a.e;sfxAt('bush',r.x,r.y)},tick(r,a,dt){if(a.t>=3.5)r.hunger=Math.min(hMax(r),r.hunger+1.3*dt)}/* むしる(2秒)→手に持つ(1.5秒)→食べる */,done:(r,a)=>a.t>=27,end(r){addPt(.45,r,1)}},
  sleep:{start(r,a){r.bubble='💤';if(a.house||isNight()&&a.obj!=null&&roomOf(a.obj))r.hidden=true;/* 夜、家のベッドで寝ている子は、かくれている（コワイノにねらわれない） */a.night=isNight();{const h=a.stand>=0?roomOf(a.obj!=null?a.obj:a.stand):null;a.cf=(h?.6+comfyFor(h,r)/100*.9:1)*(h&&[...h.inside].some(j=>S.obj[j]==='mimamori')?1.1:1)}/* みまもりのぬいぐるみのある家：1.1倍 *//* 家の住み心地で、つかれのとれる速さが変わる（0→0.6倍、100→1.5倍、300→3.3倍） */},tick(r,a,dt){if(a.ground&&!isNight()&&((a.bchk=(a.bchk||0)+dt)>2)){a.bchk=0;let bj=-1;for(let j=0;j<W*H&&bj<0;j++)if((BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j))&&free('o'+j,1))bj=j;if(bj>=0){endAct(r);return}}/* 昼に地面で休んでいる子は、ベンチがあいたら、そっちにすわりなおす */const cap=a.ground?50:100;if(r.energy<cap)r.energy=Math.min(cap,r.energy+a.rate*(a.night?1:2)*(a.cf||1)*mateK(r,'sleep')*recK(r)*(a.obj!=null&&spotHas(a.obj,'shinshitsu')?1.1:1)*dt)}/* しんしつ：+10% */,
    done:(r,a)=>hungry(r)&&a.t>5||r.hunger<18||(a.night?!isNight():r.energy>=(a.ground?50:90)),end(r,a){}/* 寝るだけでは、パワーも経験値もふえない */},/* 起きたときのパワーも住み心地で変わる */
  bury:{start(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]!=='grave'||!d||d.buried||r.coffin||heldN(r))return false},done:(r,a)=>a.t>=2,end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='grave'&&d&&!d.buried){r.coffin={name:d.name};S.obj[a.obj]='';delete S.dyn[a.obj];recount()}}},/* お墓から棺を持ちあげる（ほかのものは持たない） */
  reunion:{start(r,a){r.bubble='💕';JOYU.set(r,performance.now()+4000);const q=S.res.find(x=>x.id===a.who);if(q){r.face=q.x>=r.x?1:-1;q.bubble='💕';JOYU.set(q,performance.now()+4000)}addFloat(r.x,r.y-1.2,'💕','#fff')},done:(r,a)=>a.t>=6},/* もどってきたなかよしに会えてよろこぶ */
  otakiget:{start(r){if(!S.otakiQ||!Object.keys(S.otakiQ).length)return false;r.bubble='📦';sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4,end(r){r.otaki=S.otakiQ;S.otakiQ={};r.bubble='🔥'}},/* おたきあげ：素材箱から、たのまれた素材をとる */
  otaki:{start(r){if(!r.otaki||STATUE<0)return false;r.bubble='🔥';sfxAt('cookfire',r.x,r.y)},tick(r,a,dt){a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;const x=STATUE%W+.5,y=((STATUE/W)|0)+.2;for(let n=0;n<6;n++){const an=Math.random()*7,v=rnd(20,50);fx.push({k:'p',x:x*TS,y:y*TS,vx:Math.cos(an)*v*.4,vy:-v,life:1,col:pick(['#ffd38a','#ff9f5a','#fff3c4']),r:rnd(1.5,3)})}}},done:(r,a)=>a.t>=10,end(r){let p=0;for(const k in r.otaki||{})p+=Math.floor(r.otaki[k]/(MATTRADE[k]||5));r.otaki=null;S.pt+=p;burst(STATUE,'furn');sfx('level');toast('おたきあげ：パワー+'+p,'good');addSpiritXp(1,r)}},/* 神殿で、おたきあげ */
  pray:{start(r){if(!r.coffin)return false},done:(r,a)=>a.t>=12,end(r){finishBurial(r)}},/* 神殿でおいのりして、埋葬する */
  rest:{start(r,a){if(!BENCHES.has(S.obj[a.obj]))return false;r.bubble='☕'},tick(r,a,dt){if(a.partner!=null&&!S.res.some(x=>x.id===a.partner&&x.act&&x.act.type==='rest'&&x.act.obj===a.obj)){a.topic=null;a.partner=null;a.sub=0;a.ended=1;r.bubble='☕'}/* 片方が休けいを終えたら、おしゃべりもおわり */r.energy=Math.min(100,r.energy+dt/3*mateK(r,'rest')*recK(r)*(1+.1*spotN(a.obj,'yasumi','wa','terrace')));/* やすみば・和の庭：+10% */r.fun=Math.min(100,r.fun+.08*dt*(1+.1*spotN(a.obj,'hana','chaya','kotori')));/* 花のベンチ・茶屋：+10% */
    if(a.topic==null){const q=a.ended||(r.chatCD||0)>S.t?null:S.res.find(x=>x!==r&&(x.chatCD||0)<=S.t&&x.act&&x.act.type==='rest'&&x.act.stage==='do'&&x.act.obj===a.obj&&x.act.topic==null);if(q){const t=chatTopic(r,q);a.topic=t;a.partner=q.id;q.act.topic=t;q.act.partner=r.id;q.act.sub=1;r.bubble=q.bubble='💬';mate(r,q);for(const x of[r,q])addPt(.45+(x.like==='chat'?.9:0)+(S.today==='oshaberi'?.9:0),x,1+(x.like==='chat'?2:0)+(S.today==='oshaberi'?2:0))}}/* ベンチに2人すわったら、おしゃべり */
    else{a.bt=(a.bt||0)+dt;if(a.bt>4){a.bt=0;r.bubble=pick(['💬','💬','😊','🎵','😆'])}r.fun=Math.min(100,r.fun+.3*dt)}},done:(r,a)=>(r.energy>=100&&a.t>=15)||a.t>=(a.dur||90)||isNight()||!BENCHES.has(S.obj[a.obj]),end(r,a){r.restCD=S.t+90;if(a&&a.t>=10)addPt(.45,r,1)}},/* ベンチでひと休み：すぐ終わったときはポイントなし。しばらくは、またベンチにはすわらない */
  play:{start(r,a){r.bubble={flower:'🌼',fountain:'💦',campfire:'🔥'}[a.what]||'🎵';if(a.obj!=null&&!a.pk){a.pk=1;a.fun*=1+.1*spotN(a.obj,'park','park2')+(a.what==='campfire'?.1*spotN(a.obj,'camp'):0)+(a.what==='fountain'?.1*spotN(a.obj,'funsui'):0)+(a.what==='swing'?.1*spotN(a.obj,'buranko','mori'):0)+(a.what==='sandbox'?.1*spotN(a.obj,'doronko'):0)}/* 公園：たのしさ+10%・+20%、キャンプ場・ふんすいひろば：+10% */if(a.nig){r.bubble='😣';if(Math.random()<.5)addFloat(r.x,r.y-1.2,'ちょっと、にがて…','#fff3d6')}},/* にがてなおもちゃ */tick(r,a,dt){r.fun=Math.min(100,r.fun+a.fun/a.dur*dt)}/* おもちゃは、お話よりたのしさがたまりやすい */,done:(r,a)=>a.t>=a.dur,end(r,a){addPt(a.pw+(r.like===a.what?.9:0),r,a.pt+(r.like===a.what?2:0));train(r,a.what);if(a.what!=='flower')r.lastToy={j:a.obj,t:S.t}}},/* 遊んだ遊び家具は覚えておき、しばらくは行かない */
  bathe:{start(r,a){const w=a.tub!=null?(typeAt(a.tub)==='bathtub'?a.tub:-1):adjOf(a.stand,k=>S.ground[k]===1);if(w<0)return false;r.face=w%W+.5>=r.x?1:-1;r.bubble='💦';sfxAt('wave',r.x,r.y);a.sx=r.x;a.sy=r.y;a.wx=w%W+.5;a.wy=((w/W)|0)+.5;a.in=0;a.hot=a.tub!=null?false:hotW(w)},tick(r,a,dt){/* 水の中まで入って、出てくる */a.in=Math.max(0,Math.min(1,a.t/3,(30-a.t)/3));const mv=a.tub!=null?1:.8;r.x=a.sx+(a.wx-a.sx)*a.in*mv;r.y=a.sy+(a.wy-a.sy)*a.in*mv;const hot=!!a.hot,m=S.res.find(q=>q!==r&&q.act&&q.act.type==='bathe'&&Math.hypot(q.x-r.x,q.y-r.y)<3.5);if(m){r.face=m.x>=r.x?1:-1;r.bubble=Math.floor(a.t/1.5)%2?'🎵':'💦'}else r.bubble=a.tub!=null?(Math.floor(a.t/3)%2?'♨️':'🎵'):'💦';/* ほかの子がいたら、いっしょに水かけっこ */const lo=nearLotus(r);r.fun=Math.min(100,r.fun+(hot?.45:.3)*(m?1.5:1)*(lo?1.5:1)*(hot&&r.elem==='fire'?1.3:1)*(a.tub!=null&&spotHas(a.tub,'ofuro')?1.1:1)*dt);/* おふろば：+10% */if(hot&&r.elem==='fire'&&Math.floor(a.t/2)%3===0)r.bubble='♨️';/* 火の子は温泉が大好き */if(lo)r.energy=Math.min(100,r.energy+.15*recK(r)*dt);/* ハスの近くの水浴びは、たのしい */if(hot)r.energy=Math.min(100,r.energy+.35*recK(r)*dt);/* 温泉は、つかれもとれる */a.h=(a.h||0)+dt;if(a.h>=4.5){a.h=0;sfxAt('wave',r.x,r.y)}},done:(r,a)=>a.t>=30,end(r,a){r.bathD=dayNo();r.bubble='✨';r.shine=performance.now();addPt(.45,r,1);if(a&&a.hot)r.afterBath=S.t+90}},
  fish:{start(r,a){const w=fishW(a.stand);if(w>=0)r.face=w%W+.5>=r.x?1:-1;/* 釣竿は水のほうへ */r.bubble='🎣';sfxAt('cast',r.x,r.y)},tick(r,a,dt){r.fun=Math.min(100,r.fun+.5*dt)},done:(r,a)=>a.t>=50,end(r,a){const w=r.elem==='water';addPt(1.35+(r.like==='fish'?.9:0),r,3+(r.like==='fish'?2:0));if(Math.random()<(w?.7:.35)+(a&&a.spot?.25:0)+(a?.05*spotN(a.stand,'fishspot','yoruzuri'):0)){/* つりスポット：+5% */addCarry(r,'fish',1);S.fishN=(S.fishN||0)+1;kurashi('fish',['🐟','はじめて魚がつれた']);r.bubble='🐟';sfxAt('catch',r.x,r.y)}else fishLoot(r)}},
  chat:{start(r,a){const p=S.res.find(q=>q.id===a.partner);if(!p||!p.act||p.act.type!=='chatwait'||p.act.partner!==r.id||(r.chatCD||0)>S.t||(p.chatCD||0)>S.t)return false;mate(r,p);
      if(a.tag){const cx=Math.round((r.x+p.x)/2-.5),cy=Math.round((r.y+p.y)/2-.5);let ok=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!walk((cy+dy)*W+cx+dx))ok=false;
        if(ok){r.act={type:'tag',stage:'do',t:0,cx:cx+.5,cy:cy+.5,ph:0,partner:p.id,key:a.key};endAct(p);p.act={type:'tag',stage:'do',t:0,cx:cx+.5,cy:cy+.5,ph:Math.PI,partner:r.id};r.bubble='😆';p.bubble='😆';return}}
      r.face=p.x>=r.x?1:-1;p.face=-r.face;a.topic=chatTopic(r,p);/* 最近した話は、しばらく出ない */endAct(p);p.act={type:'chat',stage:'do',t:0,partner:r.id,topic:a.topic,sub:1};r.bubble='💬';p.bubble='💬'},
    tick(r,a,dt){r.fun=Math.min(100,r.fun+.4*dt*(spotNear((r.y|0)*W+(r.x|0),'oshaberi')?1.1:1));/* おしゃべりひろば：+10% */if(!a.waved&&a.t>14&&CHATS[a.topic]&&CHATS[a.topic].wave){a.waved=1;const p=S.res.find(q=>q.id===a.partner);r.waveU=S.t+4;if(p)p.waveU=S.t+4}/* 「手、ふっとこうか」のあと、手をふる */a.bt=(a.bt||0)+dt;if(a.bt>4){a.bt=0;r.bubble=pick(['💬','💬','😊','🎵','😆'])}}/* おしゃべり中は「…」の吹き出しが中心 */,done:(r,a)=>a.t>=25,end(r){r.chatCD=S.t+150;{const p=S.res.find(q=>q.id===r.act.partner);if(p)p.chatCD=S.t+150}/* おしゃべりのあとは、しばらく間をあける */addPt(.45+(r.like==='chat'?.9:0)+(S.today==='oshaberi'?.9:0),r,1+(r.like==='chat'?2:0)+(S.today==='oshaberi'?2:0))}},
  store:{start(r){if(!carryN(r))return false;r.bubble='📦'},done:(r,a)=>a.t>=4/([-1,1,-W,W].some(o=>spotHas((r.y|0)*W+(r.x|0)+o,'shokuryo'))?1.1:1),/* 食料庫：しまう速さ+10% */end(r){sfxAt('box',r.x,r.y);if(typeof r.carry==='number')r.carry={mugi:r.carry};let room=Math.max(0,foodCap()-S.food),txt=[];r.toStor=0;for(const k in r.carry){const dish=RECIPES.some(R=>R.out===k),n=dish?r.carry[k]:Math.min(r.carry[k],room);room=Math.max(0,room-n);if(n){addFood(k,n);txt.push(FOODS[k].name+'+'+n)}if(r.carry[k]>n)dropAt(r.x,r.y,'food:'+k,r.carry[k]-n)}/* 入りきらない分は、足もとに置く */r.carry=null;addFloat(r.x,r.y-1.4,txt.length?txt.join(' '):'いっぱい',txt.length?'#bdf5c4':'#ffd2cc');if(sheet==='food')renderSheet()}},
  weed:{start(r,a){if(!WEEDS.has(S.obj[a.obj]))return false;a.w=S.obj[a.obj];faceTo(r,a.obj);r.bubble=a.w==='kinoko'?'🍄':'🌿'},tick(r,a,dt){work(r,dt)},done:(r,a)=>a.t>=5||S.obj[a.obj]!==a.w,end(r,a){if(S.obj[a.obj]===a.w&&a.t>=5){S.obj[a.obj]='';addMat(r,BL[a.w].weed,1);addSpiritXp(1,r)}}},/* 雑草・きのこをむしる（素材箱へはこぶ） */
  smat:{start(r){if(!r.cmat)return false;r.bubble='📦'},done:(r,a)=>a.t>=4/([-1,1,-W,W].some(o=>spotHas((r.y|0)*W+(r.x|0)+o,'monooki'))?1.1:1),/* ものおき：しまう速さ+10% */end(r){sfxAt('box',r.x,r.y);const m=r.cmat;r.cmat=null;let room=Math.max(0,matCap()-matTot()),txt=[];for(const k in m){const n=Math.min(m[k],room);room-=n;S.mat[k]=(S.mat[k]||0)+n;if(!S.gotMat)S.gotMat={};S.gotMat[k]=(S.gotMat[k]||0)+n;if(n)txt.push(MATN[k]+'+'+n);if(m[k]>n)dropAt(r.x,r.y,'mat:'+k,m[k]-n)}/* 入りきらない分は、足もとに置く */bambooIdea();addFloat(r.x,r.y-1.4,txt.length?txt.join(' '):'いっぱい',txt.length?'#e8d3a8':'#ffd2cc');if(sheet==='craft')renderSheet()}},
  cgrab:{start(r,a){const R=RECIPES.find(x=>x.out===a.rec);if(!R||!Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]))return false;for(const k in R.need)S.fs[k]-=R.need[k];syncFood();r.cing={rec:a.rec,ov:a.ov};r.bubble=FOODS[Object.keys(R.need)[0]].e;sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4},
  cook:{start(r,a){if(!r.cing||S.obj[a.obj]!=='oven')return false;r.bubble='🔥';const ox=a.obj%W+.5;r.face=ox>=r.x?1:-1;a.t=r.cing.prog||0;/* 中断しても、続きから */sfxAt('cookfire',r.x,r.y)},tick(r,a,dt){work(r,dt);if(r.cing)r.cing.prog=a.t;a.h=(a.h||0)+dt;if(a.h>=6){a.h=0;sfxAt('cook',r.x,r.y)}if(a.t>4)r.bubble='🍳'},done:(r,a)=>a.t>=cookTime(r,a.obj),end(r,a){const k=r.cing.rec;r.cing=null;if(typeof r.carry==='number')r.carry={mugi:r.carry};r.carry=r.carry||{};r.carry[k]=(r.carry[k]||0)+1;r.toStor=1;/* できた料理は、すぐ食料箱へ */S.flags.cooked=true;S.cookN=(S.cookN||0)+1;kurashi('cook:'+k,['🍳','はじめて'+FOODS[k].name+'ができた']);r.bubble=FOODS[k].e;addFloat(a.obj%W+.5,((a.obj/W)|0)-.6,FOODS[k].name+'ができた','#ffd38a');sfxAt('harvest',r.x,r.y);addSpiritXp(1,r)}},
  chop:{start(r,a){if(!S.obj[a.obj])return false;a.tgt=S.obj[a.obj];r.bubble='🪓';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);natWork(a,dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;sfxAt('chop',r.x,r.y)}},done:(r,a)=>(a.camp?a.t>=20:natDone(a))||S.obj[a.obj]!==a.tgt,end(r,a){if(S.obj[a.obj]!==a.tgt)return;/* 木が先になくなったら、そこで終わり */if(!a.camp)delete S.hp['lp'+a.obj];addMat(r,a.tgt==='bamboo'?'bamboo':'wood',1+(trt(r,'kikori')?1:0));if(!a.camp)useNat(a.obj);addSpiritXp(1,r)}},
  mine:{start(r,a){if(!S.obj[a.obj])return false;a.tgt=S.obj[a.obj];r.bubble='⛏';faceTo(r,a.obj)},tick(r,a,dt){work(r,dt);natWork(a,dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;sfxAt('crack',r.x,r.y,1.5)/* 採掘の音は1.5倍 */}},done:(r,a)=>(a.camp?a.t>=20:natDone(a))||S.obj[a.obj]!==a.tgt,end(r,a){if(S.obj[a.obj]!==a.tgt)return;if(!a.camp)delete S.hp['lp'+a.obj];addMat(r,'stone',1+(trt(r,'ishiku')?1:0));if(!a.camp)useNat(a.obj);addSpiritXp(1,r)}},
  fetch:{start(r){if(S.food<=0)return false;r.bubble='📦';sfxAt('box',r.x,r.y)},done:(r,a)=>a.t>=4,end(r){let need=Math.max(0,(hMax(r)-r.hunger)*fullN(r)/100),units=0,pt=0,pw=0,items=[];
    const keys=Object.keys(S.fs).filter(k=>S.fs[k]>0).sort((a,b)=>FOODS[b].v-FOODS[a].v);for(const k of keys){while(need>0&&S.fs[k]>0){S.fs[k]--;need-=FOODS[k].v;units+=FOODS[k].v;pt+=FOODS[k].pt||0;pw+=FOODS[k].pw||0;items.push(k)}if(need<=0)break}
    syncFood();if(units)r.meal={u:units,pt,pw,e:FOODS[items[0]].e,items};if(sheet==='food')renderSheet()}},
  npl:{start(r,a){if(!S.nushi||!S.cleared)return false;r.bubble='💚';r.face=S.nushi.x>=r.x?1:-1;if(!S.flags.nplayed){S.flags.nplayed=1;memo('🦌',r.name+'がヌシ様と遊んだ');logEv(r.name+'がヌシ様と遊んだ')}},tick(r,a,dt){r.fun=Math.min(100,r.fun+1.6*dt);a.bt=(a.bt||0)+dt;if(a.bt>3){a.bt=0;r.bubble=pick(['💚','😆','🎵'])}a.jt=(a.jt||0)+dt;if(a.jt>2.5&&S.nushi){a.jt=0;JUMP.set(r,performance.now());S.nushi.hop=performance.now()}},done:(r,a)=>a.t>=40||!S.nushi/* ぴょんぴょんはねて、ヌシ様もいっしょにはねる */,end(r){addPt(1.35,r,3)}},/* クリア後、ヌシ様のところへ遊びに行く */
  chatwait:{done:(r,a)=>{const p=S.res.find(q=>q.id===a.partner);return a.t>=40||!p||!p.act||p.act.type!=='chat'||p.act.partner!==r.id}},
  tag:{tick(r,a,dt){const ang=a.ph+a.t*.35,nx=a.cx+Math.cos(ang)*1.1,ny=a.cy+Math.sin(ang)*.8;r.face=nx>=r.x?1:-1;if(walk((ny|0)*W+(nx|0))){r.x=nx;r.y=ny}/* 通れないマスには入らない */r.fun=Math.min(100,r.fun+.6*dt)},
    done:(r,a)=>a.t>=30,end(r,a){addPt(.9,r,2)}},
  tend:{start(r,a){const d=S.dyn[a.obj];if(!d||S.obj[a.obj]!=='farm')return false;r.bubble='🌱';sfxAt('pour',r.x,r.y)},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=8){a.h=0;sfxAt('pour',r.x,r.y)}},done:(r,a)=>a.t>=20,end(r,a){const d=S.dyn[a.obj];if(d&&S.obj[a.obj]==='farm'){d.wet=100}addSpiritXp(1,r)}},
  water:{start(r,a){if(S.obj[a.obj]!=='farm')return false;r.bubble='💧';sfxAt('pour',r.x,r.y)},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=8){a.h=0;sfxAt('pour',r.x,r.y)}},/* 水をあげている間もちょろちょろ */done:(r,a)=>a.t>=(r.elem==='water'?8:16),end(r,a){const d=S.dyn[a.obj];if(d&&S.obj[a.obj]==='farm'){d.wet=100}addSpiritXp(1,r)}},
  till:{start(r,a){if(S.obj[a.obj]!=='plot')return false;r.bubble='⛏'},tick(r,a,dt){const d=S.dyn[a.obj];if(d)d.p+=dt*fast(r,'earth');work(r,dt)},
    done:(r,a)=>a.t>=45||S.obj[a.obj]!=='plot'||S.dyn[a.obj].p>=30,end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='plot'&&d&&d.p>=30){S.obj[a.obj]='farm';S.dyn[a.obj]={g:0,wet:0,crop:null,sown:false}/* 耕しただけでは、たねは決まらない */;noteQuestPlacement('farm',a.obj);recount();burst(a.obj,'plant','till');addSpiritXp(2,r);checkQuest()}}},
  sow:{start(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]!=='farm'||!d||d.sown!==false||cseed(cropK(d))<1&&!d.paid)return false;r.bubble='🌰';sfxAt('bush',r.x,r.y)},tick(r,a,dt){work(r,dt);if(spotNear(a.obj,'hatake'))a.t+=dt*.1},/* はたけの水場：+10% */
    done:(r,a)=>a.t>=10||S.obj[a.obj]!=='farm',end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='farm'&&d&&a.t>=10&&sowFarm(d)){burst(a.obj,'plant','sow');addSpiritXp(1,r);checkQuest()}}},
  plant:{start(r,a){if(a.back)return;/* 植えおわって、岸にもどってきた */if(S.obj[a.obj]!=='sprout')return false;if(a.wade&&a.wade.length&&!a.waded){a.waded=1;r.path=a.wade.slice();a.stage='walk';return}/* 池のまんなかは、水に入って植えにいく */r.bubble='🌱';sfxAt('bush',r.x,r.y)},tick(r,a,dt){const d=S.dyn[a.obj];if(d)d.p+=dt*fast(r,'wood');work(r,dt)},
    done:(r,a)=>{if(a.back)return true;const f=a.t>=40||S.obj[a.obj]!=='sprout'||S.dyn[a.obj].p>=20;if(f&&a.wade&&a.wade.length){plantFin(r,a);a.back=1;r.path=a.wade.slice().reverse().slice(1).concat([a.stand]);a.stage='walk';r.bubble='';return false}/* 水の中で植えたら、来た道をとおって岸へもどる */return f},end(r,a){if(!a.back)plantFin(r,a)}},
  build:{start(r,a){if(S.obj[a.obj]!=='site')return false;r.bubble='🔨'},tick(r,a,dt){const d=S.dyn[a.obj];if(d)d.p+=dt*(r.elem==='earth'?(BL[d.build]&&BL[d.build].maker==='earth'?2:1.3):1);work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('bnail',r.x,r.y)}},/* 土のせいれいは建てるのが速い（土の建物は×2、ほかは×1.3） */
    done:(r,a)=>a.t>=60||S.obj[a.obj]!=='site'||S.dyn[a.obj].p>=S.dyn[a.obj].need,end(r,a){const d=S.dyn[a.obj];if(S.obj[a.obj]==='site'&&d&&d.p>=d.need)finishBuild(a.obj,r);else addSpiritXp(1,r)}},
  craft:{start(r,a){if(!S.orders.find(q=>q.id===a.order))return false;r.face=1;r.bubble=''},tick(r,a,dt){const o=S.orders.find(q=>q.id===a.order);if(o)o.prog+=dt*(r.elem===BL[o.type].maker?2:1);work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('nail',r.x,r.y)}},
    done:(r,a)=>{const o=S.orders.find(q=>q.id===a.order);return a.t>=60||!o||o.prog>=o.need},end(r,a){const o=S.orders.find(q=>q.id===a.order);if(o&&o.prog>=o.need)finishCraft(o,r);else addSpiritXp(1,r)}},
  dance:{start(r,a){r.bubble='🎵'},tick(r,a,dt){r.fun=Math.min(100,r.fun+.5*dt);a.h=(a.h||0)+dt;if(a.h>=1.2){a.h=0;JUMP.set(r,performance.now());r.face=-(r.face||1);r.bubble=pick(['🎵','🎶','🍡','😆'])}},done:(r,a)=>a.t>=40||!festOn()||isNight()||hour()>=20,end(r,a){}},/* おまつりのおどり（ごちそうも食べる） */
  bon:{start(r,a){r.bubble='🎵';a.ph=Math.atan2(r.y-a.cy,r.x-a.cx);a.rad=Math.max(1.6,Math.hypot(r.x-a.cx,r.y-a.cy));a.dur=20+Math.random()*15},tick(r,a,dt){const ang=a.ph+a.t*.22,tx=a.cx+Math.cos(ang)*a.rad,ty=a.cy+Math.sin(ang)*a.rad,dx=tx-r.x,dy=ty-r.y,L=Math.hypot(dx,dy),m=Math.min(L,1.5*dt);if(L>0){const nx=r.x+dx/L*m,ny=r.y+dy/L*m,k=(ny|0)*W+(nx|0);if(walk(k)&&!S.obj[k]){r.face=dx>=0?1:-1;r.x=nx;r.y=ny}}/* 輪にそって、ゆっくり回る（通れないマスでは止まる） */r.fun=Math.min(100,r.fun+.5*dt);a.h=(a.h||0)+dt;if(a.h>=1.5){a.h=0;JUMP.set(r,performance.now());r.bubble=pick(['🎵','🎶','😆','✨'])}},done:(r,a)=>a.t>=a.dur||!festOn()||isNight()||hour()>=22},/* おまつりのおどりの輪 */
  nmeet:{start(r,a){r.bubble='✨'},done:()=>!NUSHI_RUN},/* ヌシ様をむかえるとき、台座のまわりに集まる */
  shopkeep:{start(r,a){r.face=1;r.bubble=STALLM[r.elem].e},tick(r,a,dt){r.fun=Math.min(100,r.fun+.3*dt);a.h=(a.h||0)+dt;if(a.h>=2.5){a.h=0;r.bubble=pick([STALLM[r.elem].e,'😊','🎵','🏮'])}},done:(r,a)=>!festOn()||isNight()||hour()>=22||!S.fst||S.fst.k!==a.sk},/* おまつりの屋台の店番 */
  yatai:{start(r,a){r.bubble='🏮';r.face=1},done:(r,a)=>a.t>=4,end(r,a){const t=(S.fst&&S.fst.L||[]).find(t=>t.x===a.sx);if(!t)return;const M=STALLM[t.el],kp=S.res.find(o=>o.id===t.id);r.fyN=(r.fyN||0)+1;JUMP.set(r,performance.now());sfxAt('offer',r.x,r.y);addPt(.9,r,2);/* 屋台をまわると、パワーも少し */
    if(kp){JUMP.set(kp,performance.now());addFloat(kp.x,kp.y-1.3,'ありがとう！','#fff3d6')}
    if(t.el==='wind'&&Math.random()<.5){const ok=Math.random()<.35;r.fun=Math.min(100,r.fun+(ok?20:8));r.bubble=ok?'🎯':'😣';addFloat(r.x,r.y-1.2,ok?'わなげ、あたり！':'わなげ、おしい…',ok?'#ffd38a':'#fff3d6');return}/* 風の屋台は、わなげも */
    const f=FOODS[M.L[0][1]];r.hunger=Math.min(hMax(r),r.hunger+20);r.fun=Math.min(100,r.fun+10);r.bubble=f.e;r.fsnack=f.e}},/* 屋台の食べ物：おなか+20・たのしさ+10（食料箱はへらない） */
  fwalk:{start(r,a){a.dur=5+Math.random()*6;r.bubble=r.fsnack&&Math.random()<.5?r.fsnack:pick(['🏮','✨','😊','🎵'])},done:(r,a)=>a.t>=a.dur,end(r){r.fsnack=null}},/* おまつりを見てまわる */
  hanabi:{start(r){r.bubble='🎆';r.face=Math.random()<.5?1:-1},tick(r,a,dt){r.fun=Math.min(100,r.fun+.4*dt);a.h=(a.h||0)+dt;if(a.h>=2){a.h=0;r.bubble=pick(['🎆','🎇','✨','😆']);if(Math.random()<.15)addFloat(r.x,r.y-1.3,pick(['たまやー！','きれい…！','わあ…！']),'#fff3d6')}},done:(r,a)=>hour()>=21||!festOn()||isNight()},/* 花火を見る */
  douse:{start(r,a){if(!fireAt(a.obj))return false;r.bubble='💧';sfxAt('pour',r.x,r.y)},tick(r,a,dt){work(r,dt)},done:(r,a)=>a.t>=10||!fireAt(a.obj)||isNight(),end(r,a){if(a.t>=10&&fireAt(a.obj)){delete S.st2.fire[a.obj];sfxAt('pour',r.x,r.y);addSpiritXp(1,r)}}},/* 水をかけて、火を消す */
  repair:{start(r,a){const b=!S.obj[a.obj]?brokenAt(a.obj):null;if(!b&&!breakable(S.obj[a.obj])&&!DEFS.has(S.obj[a.obj])&&!burnt(a.obj))return false;a.re=b?b.id:null;r.bubble='🔨'},tick(r,a,dt){work(r,dt);a.h=(a.h||0)+dt;if(a.h>=3){a.h=0;sfxAt('nail',r.x,r.y)}},done:(r,a)=>a.t>=repairTime(a)&&(!a.re||a.t>=60||repairFree(a)),/* 建て直す場所にだれかが立っているあいだは、終わらずに待つ（さいごまで空かなければ、素材をもどしてやめる） */end(r,a){if(a.re){const cells=fp(a.re,a.obj%W,(a.obj/W)|0,brokenRot(a.obj)).map(([cx,cy])=>cy*W+cx);if(!repairFree(a)){addFloat(r.x,r.y-1.2,'人がいて直せなかった','#ffd2cc')}else if(cells.every(k=>!S.obj[k])){S.obj[a.obj]=a.re;setRot(a.obj,brokenRot(a.obj));setParts(a.re,a.obj,'part');delete S.hp[a.obj];if(BL[a.re].dyn)S.dyn[a.obj]={g:0};{const bk=brokenAt(a.obj);if(bk&&bk.L)S.hp['L'+a.obj]=bk.L}/* 強化レベルは、建てなおしてももとにもどす */S.broken=S.broken.filter(b=>b.j!==a.obj);recount();dirty=true;burst(a.obj,'block');sfxAt('repair',r.x,r.y)}}else{const o=S.obj[a.obj];if(breakable(o)){S.hp[a.obj]=BL[o].hp;sfxAt('repair',r.x,r.y)}else if(DEFS.has(o)||burnt(a.obj)){delete S.hp[a.obj];sfxAt('repair',r.x,r.y)}}addSpiritXp(1,r)}},
  harvest:{start(r,a){const d=S.dyn[a.obj];if(!d||d.g<100)return false;r.bubble='🧺';sfxAt('bush',r.x,r.y)},tick(r,a,dt){work(r,dt);if(S.obj[a.obj]==='farm'&&spotNear(a.obj,'hatake'))a.t+=dt*.1},/* はたけの水場：+10% */done:(r,a)=>a.t>=12,end(r,a){const d=S.dyn[a.obj];if(!d)return;d.g=0;const fk=S.obj[a.obj]==='farm'?(cropK(d)):S.obj[a.obj]==='fruit'?'apple':'berry';if(S.obj[a.obj]==='farm'){if(Math.random()<.75){S.cseed[fk]=cseed(fk)+1;addFloat(r.x,r.y-1.2,CROPS[fk].name+'のたね+1','#e8d38a')}/* たねがとれるのは75% */d.sown=false;d.crop=null}/* 収穫したら、また植えないと育たない */const cr=CROPS[fk]||{yield:a.food||3},food=((fk==='berry'||fk==='apple')?2:cr.yield+(NEARMILL.has(a.obj)?1:0)+(NEARFLOWER.has(a.obj)?1:0))+(trt(r,'shukaku')?1:0)+(r.elem==='wood'&&S.obj[a.obj]==='farm'?1:0)+(S.today==='hosaku'?1:0);{const rm=roomN(r);addCarry(r,fk,Math.min(food,rm));if(food>rm)dropAt(r.x,r.y,'food:'+fk,food-rm)}/* 持ちきれない分は、足もとに置いて、あとでひろう */kurashi('hv:'+fk,['🧺','はじめて'+FOODS[fk].name+'を収穫した']);sfxAt('harvest',r.x,r.y);addSpiritXp(1,r)}},
  gather:{start(r,a){const d=S.dyn[a.obj];if(!d||d.g<100)return false;a.tk=S.obj[a.obj]==='takenoko';if(!a.tk)d.g=0;r.bubble='🧺';sfxAt('bush',r.x,r.y)},tick(r,a,dt){work(r,dt)},done:(r,a)=>a.t>=15,end(r,a){if(a.tk&&S.obj[a.obj]!=='takenoko')return;/* たけのこは、とると、なくなる */const fk=a.tk?'takenoko':'berry';if(a.tk){clearObj(a.obj);recount()}{const rm=roomN(r);addCarry(r,fk,Math.min(2,rm));if(2>rm)dropAt(r.x,r.y,'food:'+fk,2-rm)}/* 持ちきれない分は、足もとに置いて、あとでひろう */}},
  offer:{start(r,a){if(OBOX<0)return false;r.bubble='🎁'},done:(r,a)=>a.t>=10,end(r,a){r.offT=S.t;r.offDay=dayNo();r.fun=60;{const oo=FURN.filter(id=>BL[id]&&BL[id].offerOnly&&BL[id].maker===r.elem&&(!WIND_STAGE_TOYS.has(id)||WD===4));/* 風の村の遊具は、ほかのステージでは出さない */if(oo.length&&Math.random()<.06){/* おそなえでしか手に入らない家具 */const id=pick(oo);giveItem(id,1);addFloat(r.x,r.y-1.8,'レア！');toast(r.name+'が「'+BL[id].name+'」をおそなえした！（レア）','good');addSpiritXp(1,r);return}const fs=FURN.filter(id=>BL[id]&&BL[id].maker===r.elem&&!BL[id].trap&&!BL[id].offerOnly&&lvOK(id));if(fs.length&&Math.random()<.06){/* まれに家具（レア） */const id=pick(fs);giveItem(id,1);addFloat(r.x,r.y-1.8,'レア！');toast(r.name+'が「'+BL[id].name+'」をおそなえした！','good');addSpiritXp(1,r);return}}const g=offerFor(r);if(!g)return;giveItem(g[0],g[1]);addSpiritXp(1,r);
    const sx=OBOX%W,sy=(OBOX/W)|0;addFloat(sx+.5,sy-.8,'おそなえ '+iname(g[0])+'×'+g[1],'#ecdcbc');burst(OBOX,'block');sfx('offer');renderPalette();if(sheet==='inv')renderSheet()}},
  pickdrop:{start(r,a){const i=(S.drops||[]).findIndex(q=>q.y*W+q.x===a.obj);if(i<0)return false;takeDrop(S.drops.splice(i,1)[0],r);r.bubble='✨'},done:(r,a)=>a.t>=3},
  pickseed:{start(r,a){const i=S.seeds.findIndex(q=>q.y*W+q.x===a.obj);if(i<0)return false;S.seeds.splice(i,1);r.bubble='✨'},done:(r,a)=>a.t>=8,end(r){S.mseed=(S.mseed||0)+1;S.mseedGot=(S.mseedGot||0)+1;addFloat(r.x,r.y-1.6,'ふしぎな種+1','#d8f5c0');toast(r.name+'がふしぎな種をひろった','good')}},
  patrol:{done:()=>true},/* 見回りは、止まらずに歩きつづける（吹き出しなし） */
  faint:{done:(r,a)=>a.t>=30,end(r){r.fleeNow=true;r.faintGrace=S.t+40}/* 目をまわし終えたら、しばらくは攻撃されない（にげる間に、またすぐ気絶してしまわないように） */},
  flee:{start(r,a){r.bubble='💦'},/* 家へにげこんだ子も、消さずに家の中にいる（屋根の下） */done:(r,a)=>a.t>=(a.house&&!(S.food>0)?40:4),end(r,a){if(a.food)r.wantEat=1/* 食べ物のところへ逃げたら、そこで食べる。家へにげこんだときも、食料があれば、すぐ食べにいく */}},
  step:{done:()=>true},/* かべ・柵・水の中から、歩いて外へ出る */
  wander:{start(r,a){a.dur=rnd(10,30)},done:(r,a)=>a.t>=a.dur,end(r){r.wanderRestUntil=S.t+45}},
  idle:{start(r){r.bubble='☕'},done:(r,a)=>a.t>=a.dur},/* ひとやすみ中は、休けいの吹き出し */
  // ベッドがない子は、家の中で起きたまま夜をすごす
  stay:{start(r){r.bubble="🏠"},done:(r,a)=>hungry(r)&&a.t>5||r.hunger<18||!isNight()},
  shiver:{start(r){r.bubble='😨'},done:(r,a)=>r.hunger<50||!hostileNow(r)||r.hunger<hMax(r)*.5&&S.food>0&&!(r.eatTry>S.t),end(r){if(!hostileNow(r)&&r.hunger>=30)r.phewNext=true}},/* コワイノがいなくなったら、「ふぅ」とひと息ついてから寝る */
  phew:{start(r,a){r.bubble='';a.dl=PHEWDL[r.elem]||0},tick(r,a){r.bubble='';if(a.reactAt==null&&a.t>=a.dl){a.reactAt=performance.now();a.reactMotion='phew'}},done:(r,a)=>a.t>=a.dl+2},/* ふぅ：吹き出しは出さない。属性ごとに、すこしずつずらす *//* おなかが半分より少なくなったら、ふるえるのをやめて、安全に行ける食料箱へ食べにいく *//* たたかえない子は、コワイノがいるあいだ、家の中でふるえている */
};
const ACT_LBL={phew:'ほっとしている',shopkeep:'屋台の店番をしている',dance:'おどっている',bon:'おどりの輪でおどっている',yatai:'屋台にいる',fwalk:'おまつりを見てまわっている',hanabi:'花火を見ている',step:'あるいている',shiver:'こわくて、ふるえている',reunion:'なかよしに会いにいく',bury:'お墓へむかう',pray:'神殿でおいのり',sevreact:'気づいたものを見にいく',questjoy:'よろこんでいる',stay:'起きてすごしている',sow:'種をまいている',faint:'目をまわしている',eat:'ごはん中',forage:'ベリーを食べている',sleep:'おやすみ中',play:'遊んでいる',fish:'つりをしている',chat:'おしゃべり中',cook:'料理中',chop:'木を切っている',mine:'石をほっている',smat:'素材をしまう',store:'食料をしまう',fetch:'食料をとりに',chatwait:'待ちあわせ',npl:'ヌシ様と遊んでいる',tag:'おいかけっこ',tend:'畑の世話',water:'水やり',till:'畑を耕している',plant:'植えている',build:'建てている',craft:'家具づくり',harvest:'収穫中',gather:'食べ物あつめ',repair:'修理',otakiget:'おたきあげの素材をとりに',otaki:'おたきあげ',rest:'ベンチで休んでいる',bathe:'おふろに入っている',weed:'草むしり',douse:'火を消している',cgrab:'料理の材料をとりに',nmeet:'ヌシ様をむかえる',pickseed:'種ひろい',pickdrop:'おとしものひろい',offer:'おそなえ中',flee:'にげている',patrol:'見回り',wander:'おさんぽ',idle:'ひとやすみ'};

function decide(r){TAKEN=new Set();for(const q of S.res){if(q===r||q.hidden)continue;if(q.act&&q.act.stand>=0)TAKEN.add(q.act.stand);if(!q.act||q.act.stage!=='walk')TAKEN.add((q.y|0)*W+(q.x|0))}
  for(const [j,t]of Object.entries(r.routeAvoid||{})){if(t>S.t)TAKEN.add(+j);else delete r.routeAvoid[j]}
  try{const x=decide0(r);if(!r.act&&r.elem==='fire'&&!r.hidden&&r.hunger>=20)huntNear(r);return x}finally{TAKEN=null}}
function springThreat(r){if(WD!==1||!S.st2||!S.st2.cool)return null;let best=null,bd=1e9;for(const e of S.enemies){if(!e.spawned||e.dead||e.flee)continue;const D=EN[e.type];if(!D.ash&&!D.vol)continue;const d=Math.hypot(e.x-r.x,e.y-r.y)-(String(e.tg).startsWith('s')?20:0);if(d<bd){bd=d;best=e}}return best}/* 火山のふもとの最後の夜：温泉を冷やしにくる敵（いま冷やしている敵を先に） */
function huntSpot(G,en,maxD,r){if(r&&(Math.hypot(r.x-en.x,r.y-en.y)<=1.45||Math.hypot(r.x-en.x,r.y-en.y)<=2.25&&overFence(r.x,r.y,en.x,en.y))&&!fenceBetween(r.x,r.y,en.x,en.y))return (r.y|0)*W+(r.x|0);/* もう攻撃がとどいているなら、動かない（柵の内側から出ない） *//* 攻撃できる場所（1.4マス以内で、壁をはさまない）のうち、いちばん近く。柵の内側からとどくなら、外へは出ない */const fo=fenceOut();let j=-1,bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||(maxD&&G.dist[k]>maxD)||!walk(k))continue;const cx=k%W+.5,cy=((k/W)|0)+.5,h=Math.hypot(cx-en.x,cy-en.y),ok=(h<=1.4||h<=2.2&&overFence(cx,cy,en.x,en.y))&&!fenceBetween(cx,cy,en.x,en.y),d=ok?G.dist[k]*.02+(fo[k]?6:0):50+Math.abs(h-1.3)+G.dist[k]*.02;if(d<bd){bd=d;j=k}}return j}
function pickFoe(r,L){/* いちばん近いコワイノをねらう。前にねらった子が、それより3マス以内の近さなら、そのままねらう（同じくらいの距離の2ひきで、まよって止まらないように） */let en=null,bd=1e9;for(const e of L){const d=Math.hypot(e.x-r.x,e.y-r.y);if(d<bd){bd=d;en=e}}const pv=r.foeId!=null&&L.find(e=>e.id===r.foeId);if(pv&&Math.hypot(pv.x-r.x,pv.y-r.y)<=bd+3)en=pv;r.foeId=en?en.id:null;return en}
function huntNear(r){/* 火のせいれいが、近くにコワイノがいるのに何もしないときは、たたかいに行く */const en=pickFoe(r,S.enemies.filter(e=>e.spawned&&!e.dead&&Math.hypot(e.x-r.x,e.y-r.y)<10));if(!en)return false;const G=bfs(r.x|0,r.y|0);const j=huntSpot(G,en,60,r);if(j<0)return false;startAct(r,G,'patrol',j,{hunt:S.t});return true}
// 家の中：壁とドアで外から閉じられたマス。壁が壊れると外とつながって中ではなくなる
function insideSet(){const out=new Uint8Array(W*H),q=[];const open=j=>!HOME_DOORS.has(S.obj[j])&&walk(j);
  for(let x=0;x<W;x++)for(const y of[0,H-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}
  for(let y=0;y<H;y++)for(const x of[0,W-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}
  while(q.length){const j=q.pop(),x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!out[k]&&open(k)){out[k]=1;q.push(k)}}}
  return out}
let FOUT=null,FOUTT=-1;function fenceOut(){/* 柵（門もふくむ）と壁で外から閉じられていないマス。ここに入っていないマスが「柵の内側」 */const t=Math.floor(S.t);if(FOUT&&FOUTT===t)return FOUT;const out=new Uint8Array(W*H),q=[];const open=j=>walk(j)&&!GATE_IDS.has(typeAt(j))&&!HOME_DOORS.has(S.obj[j]);
  for(let x=0;x<W;x++)for(const y of[0,H-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}for(let y=0;y<H;y++)for(const x of[0,W-1]){const j=y*W+x;if(open(j)&&!out[j]){out[j]=1;q.push(j)}}
  while(q.length){const j=q.pop(),x=j%W,y=(j/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!out[k]&&open(k)){out[k]=1;q.push(k)}}}
  FOUT=out;FOUTT=t;return out}
function graveCheck(){if(isNight()||STATUE<0||!cnt('grave')||S.graveDay===dayNo())return;const gs=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='grave'&&S.dyn[j]&&!S.dyn[j].buried)gs.push(j);if(!gs.length)return;
  let G=null;for(const r of S.res){if(r.hidden)continue;const g=bfs(r.x|0,r.y|0);if(nearest(g,j=>adjOf(j,k=>k===STATUE||k===STATUE+W)>=0,300)>=0){G=g;break}}if(!G)return;/* 神殿まで行ける子から見て */
  if(gs.some(j=>nearest(G,k=>adjOf(k,q=>q===j)>=0,300)<0)){S.graveDay=dayNo();toast('お墓まで行けません','warn')}}/* とどかない所にあるお墓は、動かさずに知らせる（1日1回） */
function trapCheck(){if(isNight()||!S.obj.some((o,j)=>storageAt(j,'food')))return;for(const r of S.res){if(r.hidden||!isKey(r.name)||r.trapDay===dayNo())continue;const G=bfs(r.x|0,r.y|0);if(nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,400)<0){r.trapDay=dayNo();toast(r.name+'がとじこめられています','warn')}}}/* 物語の子が、かこまれて食料箱へ行けないときは知らせる（1日1回） */
function hideIn(r,G){if(S.food>0&&S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<7)&&(goEatSafe(r)||goEatSafe(r,true)))return true;/* 食料があれば、かくれずに、すぐ食料箱へ食べにいく（安全な箱がなければ、コワイノのすぐそばを通らずに行ける箱へ） */if(!HOUSES.length||!S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<7))return false;const hs=new Set();for(const h of HOUSES)for(const q of h.inside)hs.add(q);const k=nearest(G,j=>hs.has(j)&&walk(j)&&!HOME_DOORS.has(S.obj[j]),60);if(k<0)return false;startAct(r,G,'flee',k,{house:true,food:1,run:true});return true}/* 火の子は、おなかがへってコワイノがそばにいたら、まず家の中へにげこんで、それから食べにいく */
function fleeHit(r,G){
  if(r.elem==='fire'&&r.hunger<50&&hideIn(r,G))return true;
  if(r.hunger<50&&S.food>0){const sj=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,60);if(sj>=0){r.refill=S.t+60;startAct(r,G,'fetch',sj,{run:true});return true}}/* おなかがすいていたら、にげながら食料箱でごはんをとる */
  if(r.elem==='fire'&&S.food>0&&r.hunger<hMax(r)-8){const sj=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,60);if(sj>=0){r.refill=S.t+60;startAct(r,G,'flee',sj,{food:1});return true}}/* 火の子は、おなかがすいていて食料があるときだけ、食料箱へ逃げる（食べられないのに箱の前でにげ続けない） */
  if(isNight()&&r.elem!=='fire'){const out=insideSet(),bj=nearest(G,j=>BEDSET.has(S.obj[j])&&!out[j]&&free('o'+j,1)&&bedFor(j,r),200);if(bj>=0){const b=BL.bed.sleep;startAct(r,G,'sleep',bj,{key:'o'+bj,obj:bj,rate:b.rate,pt:b.pt,run:true});return true}}
  const ens=S.enemies.filter(e=>e.spawned&&!e.dead),fr=r.elem==='fire'?null:S.res.find(q=>q!==r&&q.elem==='fire'&&!q.hidden);/* 「コワイノ」からはなれる。火のせいれいがいれば、そのそばへ */
  const fo=fenceOut();let best=-1,bs=-1e9;for(let j=0;j<W*H;j++){const d=G.dist[j],ins=!fo[j];if(!(d>=3&&d<=(ins?30:14))||!VILL[j])continue;/* にげるのは村（家・物のまわり）だけ */const x=j%W+.5,y=((j/W)|0)+.5;let me=99;for(const e of ens)me=Math.min(me,Math.hypot(x-e.x,y-e.y));if(me<2)continue;const sc=(fr?Math.min(me,6)-Math.hypot(x-fr.x,y-fr.y)*.8-d*.05:me-d*.15)+(ins?10:0);if(sc>bs){bs=sc;best=j}}/* 柵の内側へ、すすんで逃げる */
  if(best>=0){startAct(r,G,'flee',best);return true}return false}
function fleeGraph(r){const bl=new Set();for(const e of S.enemies){if(!e.spawned||e.dead)continue;const ex=e.x|0,ey=e.y|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=ex+dx,ny=ey+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)bl.add(ny*W+nx)}}bl.delete((r.y|0)*W+(r.x|0));const G=roadSearch(r.x|0,r.y|0,bl);G.bl=bl;return G}/* 「コワイノ」のすぐそばを通らずに逃げられる道 */
function withFlee(r,fn,G){const Gf=fleeGraph(r);let ok=false;FLEEBL=Gf.bl;try{ok=fn(r,Gf)}finally{FLEEBL=null}return ok||fn(r,G)}
function fleeAlarm(r,G){
  if(r.elem==='fire'&&r.hunger<50&&hideIn(r,G))return true;
  if(r.elem==='fire'){if(S.food>0){if(r.hunger<hMax(r)-8){const sj=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,60);if(sj>=0){r.refill=S.t+60;startAct(r,G,'flee',sj,{food:1});return true}}}else{const f=ripeAdj(['berry','fruit']),fj=nearest(G,j=>f(j)>=0,60);if(fj>=0){const k=f(fj);startAct(r,G,'forage',fj,{key:'o'+k,obj:k});return true}const bj=nearest(G,j=>adjOf(j,k=>S.obj[k]==='berry'||S.obj[k]==='fruit')>=0,60);if(bj>=0){startAct(r,G,'flee',bj,{food:1});return true}}}/* 火の子は、おなかがすいていて食料があるときだけ食料箱へ逃げる。食べ物がなければ、ベリーの茂みや果物の木へ逃げて、実を食べる */
  const en=S.enemies.find(e=>e.spawned&&!e.flee);if(!en)return false;const fo=fenceOut();let best=-1,bs=-1e9;for(let j=0;j<W*H;j++){const d=G.dist[j],ins=!fo[j];if(d<2||d>(ins?30:12)||!VILL[j])continue;/* にげるのは村（家・物のまわり）だけ */const sc=Math.hypot(j%W+.5-en.x,((j/W)|0)+.5-en.y)-d*.2+(ins?10:0);if(sc>bs){bs=sc;best=j}}/* 柵の内側へ、すすんで逃げる */
  if(best>=0){startAct(r,G,'flee',best);return true}return false}
const foeNear=r=>S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<7);/* すぐそば（7マス）にコワイノがいる */
const PHEWDL={wood:0,water:.4,earth:.8,fire:1.2,wind:1.6};/* ふぅのリアクションを始めるまでの時間（秒） */
function decide0(r){
  const tx=r.x|0,ty=r.y|0,G=bfs(tx,ty),here=ty*W+tx;
  if(r.phewNext){r.phewNext=false;if(!hostileNow(r))return startAct(r,G,'phew',-1)}/* コワイノがいなくなったら、その場で「ふぅ」 */
  if(r.cing&&isNight()){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null}/* 夜は料理ができないので、持っている材料は食料箱にもどす */
  if(r.wantEat){r.wantEat=0;if(r.hunger<hMax(r)-8&&!r.meal&&goEat(r,G))return}
  if(r.refill&&r.hunger<hMax(r)-1&&S.food>0&&!r.meal&&goEat(r,G))return;/* マックスまで食べてから、たたかいにもどる */
  if(r.meal&&S.enemies.some(e=>e.spawned&&!e.dead))return startAct(r,G,'eat',-1,{pt:0,pw:0});/* コワイノがいるときは、とってきたごはんを、その場で食べる */
  if(r.elem!=='fire'&&r.hunger<hMax(r)*.5&&S.food>0&&!(r.eatTry>S.t)&&S.enemies.some(e=>e.spawned&&!e.dead)){if(goEatSafe(r))return;r.eatTry=S.t+10}/* コワイノがいても、おなかが半分より少なければ、ふるえたり逃げたりするより先に、安全に行ける食料箱へ食べにいく（行けなければ10分ごとにためす） */
  if(!isWatch(r)&&hostileNow(r)&&r.hunger>=50&&!r.coffin&&goShiver(r,G))return;/* たたかえない子は、コワイノがいるあいだ、家でふるえる *//* 食べ物のところへ逃げてきたら、ちゃんと食べる */
  // 夜に家の中にいるせいれいは、おなかがすいても外へは出ない（見張り番の火のせいれいはべつ）
  if(isNight()&&!(isWatch(r)&&S.enemyOn&&r.hunger>=50)&&!(r.hunger<50&&S.food>0)&&!(r.hunger<hMax(r)*.5&&S.food>0)&&!HOME_DOORS.has(S.obj[here])){const out=insideSet();if(!out[here])for(let j=0;j<W*H;j++)if(out[j]||HOME_DOORS.has(S.obj[j]))G.dist[j]=-1}
  if(r.meal)return goMeal(r,G);
  if(r.hunger<50&&!(r.noEatU>S.t)){if(!foeNear(r))return goEat(r,G);if(goEatSafe(r))return;r.noEatU=S.t+10}/* そばにコワイノがいても、安全に行ける食料箱（家の中か、コワイノから4マス以上はなれた所）なら食べにいく *//* ごはんは、なによりも先（すぐそばにコワイノがいるときは、逃げるのが先）。基地から遠いときは早めに帰る */
  if(r.alarm!=null&&S.t-r.alarm<120&&r.hunger>=10&&!r.meal&&!(r.elem==='fire'&&r.hunger>=50)&&S.enemies.some(e=>e.spawned&&!e.flee&&Math.hypot(e.x-r.x,e.y-r.y)<10)){if(withFlee(r,fleeAlarm,G))return}
  if(isNight()&&r.hunger<hMax(r)*.5&&S.food>0){if(!S.enemies.some(e=>e.spawned&&!e.dead&&Math.hypot(e.x-r.x,e.y-r.y)<7))return goEat(r,G);if(goEatSafe(r))return}/* 夜も、おなかが半分になったら食べにいく（見回りの子もふくめて） */
  if(r.elem==='fire'&&r.hunger>=50&&!r.refill&&!r.coffin){{const st=springThreat(r);if(st){const j=huntSpot(G,st,60,r);if(j>=0)return startAct(r,G,'patrol',j,{hunt:S.t})}}/* 最後の夜は、温泉を守りに行く */const en=pickFoe(r,S.enemies.filter(e=>e.spawned&&!e.dead&&nearRes(e)));/* 「コワイノ」が拠点に近づいたら、たたかいに行く（おなか＝体力が少ないときは行かない）。おなかいっぱいになったら、ほかのことより先に、すぐ行く */
    if(en){const j=huntSpot(G,en,60,r);/* 敵と同じマスではなく、ひとます離れて */if(j>=0)return startAct(r,G,'patrol',j,{hunt:S.t})}}/* となりに行けなくても、いちばん近くまで行く。見回りの中断でぐるぐるしないよう hunt をつける */
  if(!isNight()&&hour()>=22&&r.dinD!==dayNo()&&r.hunger<hMax(r)-10&&S.food>0&&!foeNear(r)){r.dinD=dayNo();r.refill=S.t+60;if(goEat(r,G))return}/* 夜ごはんは22時。食卓のいすにすわって、おなかいっぱい食べる（夜中に食べに出ないように） */
  if((r.coffin||cnt('grave'))&&goBurial(r,G))return;
  if(r.cing&&!isNight()){const ov=q=>S.obj[q]==='oven'&&free('o'+q,1);let j=nearest(G,j=>adjOf(j,q=>q===r.cing.ov&&ov(q))>=0,90);if(j<0)j=nearest(G,j=>adjOf(j,ov)>=0,90);
    if(j>=0){const q=adjOf(j,k=>k===r.cing.ov&&ov(k))>=0?r.cing.ov:adjOf(j,ov);r.cing.ov=q;const st=ovenStand(G,q);return startAct(r,G,'cook',st>=0?st:j,{key:'o'+q,obj:q})}
    if(!cnt('oven')){const R=RECIPES.find(x=>x.out===r.cing.rec);for(const k in R.need)addFood(k,R.need[k]);r.cing=null}}
  if(r.toStor){if(carryN(r)>0&&foodCap()>0)return goStore(r,G);r.toStor=0}
  {const h=hour();if(!isNight()&&r.hunger>=40&&h>=18+hash((r.id||0)*13+5)*.4&&r.bathD!==dayNo()&&goBathe(r,G))return}/* 夜（23時〜）は水浴びを始めない（始めても、すぐやめさせられるので）。おなかがすいているときは、ごはんが先 */
  if(r.elem==='water'&&!isNight()&&r.hunger>=40&&r.bathW!==dayNo()&&hour()>=10+hash((r.id||0)*7+dayNo())*6){const bd=r.bathD;r.bathW=dayNo();if(goBathe(r,G))return;r.bathD=bd}/* 水のせいれいは、昼間にも水あそびをする */
  if(WD===1&&!isNight()&&r.hunger>=40&&springN()&&r.energy<35&&!((r.bathCD||0)>S.t)){r.bathCD=S.t+240;const bd=r.bathD;if(goBathe(r,G))return;r.bathD=bd}/* 温泉の村：つかれたら温泉へ */
  if(r.afterBath>S.t&&!isNight()&&(r.restCD||0)<=S.t){r.afterBath=0;const isB=j=>(BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j));const bj=nearest(G,j=>isB(j)&&free('o'+j,1),40);if(bj>=0)return startAct(r,G,'rest',bj,{key:'o'+bj,obj:anc(bj),seat:bj})}/* 湯上がりは、ベンチでひと休み *//* 水浴びは18時。せいれいごとに少しずつずれる */
  if(r.elem==='water'&&r.hunger>=25&&!isNight()&&goDouse(r,G))return;/* 水の子は、燃えている物があれば、まず消しにいく */
   if(heldN(r)>0&&r.elem==='earth'&&r.hunger>=55&&!isNight()&&tryJob(r,G,'repair'))return;/* 土のせいれいは、ついでの収穫・木切りより修理が先 */
  if(heldN(r)>0){if(heldN(r)<capOf(r)&&!isNight()&&r.hunger>=30&&!r.highFirst){const cm=r.cmat||{},gm=(cm.stone||0)>0?['mine']:(cm.wood||0)>0||(cm.bamboo||0)>0?['chop']:[];for(const k of['drop','harvest',...gm,'gather'])if(tryJob(r,G,k))return}/* 落ちている素材・食べ物も、持てる数までまとめてひろってから運ぶ */
    if(carryN(r)>0&&foodCap()>0)return goStore(r,G)}
  if(r.cmat&&matCap()>0)return goStoreMat(r,G);
  else if(isNight()&&isWatch(r)){// 火のせいれい（と、まもりをおぼえたフタバ）は寝ないで見回り
    if(r.elem==='fire'&&r.hunger<50&&hideIn(r,G))return;/* おなかが50より少ないときは、たたかわずに家へにげる */
    {const e=r.elem!=='fire'?null:pickFoe(r,S.enemies.filter(e=>e.spawned&&!e.dead&&nearRes(e)));if(e){const t=huntSpot(G,e,60,r);/* 届かない所にいても、いちばん近くまで行く */if(t>=0)return startAct(r,G,'patrol',t,{hunt:S.t})}}/* 拠点にコワイノが入ったら、まっすぐたたかいに行く */
    if(r.name===POKO){const hk=keyName('fire'),fs=S.res.filter(t=>t!==r&&!t.hidden&&t.elem==='fire'),tg=fs.find(t=>t.name===hk)||fs[0];if(tg&&Math.hypot(tg.x-r.x,tg.y-r.y)>1.5){let q=-1,bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||G.dist[k]>40||!walk(k))continue;const d=Math.hypot(k%W+.5-tg.x,((k/W)|0)+.5-tg.y)+G.dist[k]*.02;if(d<bd){bd=d;q=k}}if(q>=0)return startAct(r,G,'patrol',q)}}/* フタバは、火の子のそばについて回る */
    const ib=j=>VILL[j];let j=nearest(G,j=>walk(j)&&!roomOf(j)&&ib(j)&&Math.random()<.04,8);if(j<0)j=nearest(G,j=>walk(j)&&!roomOf(j)&&ib(j),80);/* 家の中にいたら、まず外へ出る */if(j>=0)return startAct(r,G,'patrol',j);/* 夜は家の外を見回る */return startAct(r,G,'wander',(r.y|0)*W+(r.x|0))}
  if(r.energy<25||isNight())return goSleep(r,G,S.enemies.some(e=>e.spawned));
  if(r.hunger<55&&!foeNear(r))return goEat(r,G);
  if(festOn()&&!isNight()&&r.energy>=30&&!foeNear(r)&&festAct(r,G))return;/* おまつりの日は、朝7時から夜10時まで、おどる・屋台・おしゃべり・見てまわる。夜8時から9時は花火 */
  if(!isNight()&&r.fun>=99&&tryJob(r,G,'offer'))return;
  // 楽しさが低いときは、仕事より先に遊びにいく
  if(!isNight()&&r.fun<(r.elem==='wind'?60:30)&&goPlay(r,G,true))return;/* 風の子はよく遊ぶ */
  if(!isNight()&&Math.random()<.05&&goPlay(r,G,true)){if(r.act)r.act.rand=1;return}/* たのしさがへっていなくても、ときどき（5%）遊ぶ */
  if(goWork(r,G,true))return;
  if(!isNight()&&r.fun<80&&Math.random()<(S.today==='oshaberi'?.75:.45)&&trySocial(r,G))return;
  return goPlay(r,G);
}
const ripeAdj=types=>j=>adjOf(j,k=>types.includes(S.obj[k])&&S.dyn[k]&&S.dyn[k].g>=100&&free('o'+k,1));
const SEATPT={stool:1,chair:2,pouf:3,achair:5},SEATPW={stool:.45,chair:.9,pouf:1.35,achair:2.25};/* SEATPT：経験値、SEATPW：パワー *//* いすの効果：スツール＜椅子＜クッション＜クッションチェア＜ひじかけいす（×0.45がパワー） */
function goMeal(r,G){
  if(r.hunger<15||isNight())return startAct(r,G,'eat',-1,{pt:0,pw:0});
  let best=-1,bs=1e9,tdir=0;
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>40||!free('seat'+j,1))continue;
    const td=[-1,1,-W,W].find(o=>typeAt(j+o)==='table');if(td==null)continue;const sc=d-(SEATPT[S.obj[j]]||0)*10;if(sc<bs){bs=sc;best=j;tdir=td}}
  if(best>=0)return startAct(r,G,'eat',best,{key:'seat'+best,tdir,pt:BL.table.eat.pt+(SEATPT[S.obj[best]]||0),pw:(BL.table.eat.pw+(SEATPW[S.obj[best]]||0))*(1+.1*spotN(best+tdir,'dining','party'))});/* ダイニング・ガーデンパーティー：パワー+10% */
  return startAct(r,G,'eat',-1,{pt:0,pw:0});
}
function fishLoot(r){/* つり：魚でないときは、空き缶・枝・レシピ・レアな家具 */const q=Math.random();sfxAt('catch',r.x,r.y);
  if(q<.07){const oo=FURN.filter(id=>BL[id]&&BL[id].offerOnly&&(!WIND_STAGE_TOYS.has(id)||WD===4));if(oo.length){const id=pick(oo);giveItem(id,1);r.bubble='✨';addFloat(r.x,r.y-1.8,'レア！');toast(r.name+'が「'+BL[id].name+'」をつりあげた！（レア）','good');return}}
  if(q<.15){r.bubble='📜';takeDrop({id:'recipe',n:1},r);return}
  const k=q<.6?'can':'eda';r.bubble=k==='can'?'🥫':'🪵';if(roomN(r)>0)addMat(r,k,1);else dropAt(r.x,r.y,'mat:'+k,1)}
function weedMorning(first){/* first：ステージのはじめ（雑草100本・枝15本） *//* 毎朝：雑草30本（マップ全体。よみがえった土地は緑の草、荒れた土地は枯れた草）・きのこ（ときどき、木のそば）・枝（落とし物） */
  const st=WD===1?1:0,ok=k=>S.ground[k]===0&&!S.obj[k]&&!S.floor[k]&&!RFC.has(k)&&!RUGC.has(k);let n=S.obj.reduce((a,o)=>a+(WEEDS.has(o)?1:0),0),add=0;
  {const RV=[...REV];let f=0;for(let t=0;t<2000&&RV.length&&f<(first?10:3)&&n<200;t++){const k=RV[(Math.random()*RV.length)|0];if(!ok(k))continue;S.obj[k]='weedc';f++;add++;n++}}/* ふんばり草：毎朝3本（ステージのはじめは10本）、よみがえった土地に */
  for(let t=0;t<3000&&add<(first?100:30)&&n<200;t++){const k=(Math.random()*W*H)|0;if(!ok(k))continue;S.obj[k]='weed'+st+(REV.has(k)?'g':'k');add++;n++}/* のこりは、よみがえった土地は緑の草、荒れた土地は枯れた草 */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='weedc'&&!REV.has(j))S.obj[j]='weed'+st+'k';/* 荒れた土地のふんばり草は、枯れた草にする *//* 毎朝30本、マップにのこる雑草は200本まで */
  if(Math.random()<.5&&S.obj.reduce((a,o)=>a+(o==='kinoko'?1:0),0)<10){const T=[];S.obj.forEach((o,j)=>{if(o==='ntree'||o==='tree'||o==='deadtree'||o==='bamboo')T.push(j)});for(let t=0;t<30&&T.length;t++){const j=pick(T),c=[j-1,j+1,j-W,j+W].filter(ok);if(c.length){S.obj[pick(c)]='kinoko';break}}}/* きのこ：半分の日に1本（10本まで） */
  const ne=(S.drops||[]).filter(d=>d.id==='mat:eda').length;for(let i=0;i<(first?15:4)&&ne+i<15;i++){const x=(Math.random()*W)|0,y=(Math.random()*H)|0;if(ok(y*W+x))dropAt(x,y,'mat:eda',1)}/* 枝：毎日4本の落とし物（地面にのこるのは15本まで） */
}
function takenokoMorning(){/* 火山：竹のとなりに、たけのこが生える（1本の竹ごとに8%・マップに12本まで）。とらずに3日たつと竹になる */let n=0,ch=false;const bam=[];for(let j=0;j<W*H;j++){const o=S.obj[j];if(o==='takenoko'){const d=S.dyn[j]||(S.dyn[j]={g:100,age:0});d.age=(d.age||0)+1;if(d.age>=3){S.obj[j]='bamboo';delete S.dyn[j];ch=true}else n++}else if(o==='bamboo')bam.push(j)}
  for(const j of bam){if(n>=12)break;if(Math.random()>=.08)continue;const x=j%W,c=[j-1,j+1,j-W,j+W].filter(k=>k>=0&&k<W*H&&Math.abs(k%W-x)<=1&&!S.obj[k]&&!S.floor[k]&&S.ground[k]===0&&!RFC.has(k)&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===k));if(!c.length)continue;const k=pick(c);S.obj[k]='takenoko';S.dyn[k]={g:100,age:0};n++;ch=true}
  if(ch)recount()}
function bambooMig(){/* 竹のなかった火山のセーブ：森の枯れ木の半分を竹に、基地のまわりに竹を6本 */S.flags=S.flags||{};if(WD!==1||S.flags.bambooV)return;S.flags.bambooV=1;if(S.obj.some((o,j)=>o==='bamboo'&&j%W>=OFF&&j%W<OFF+OW&&j/W>=OFF&&j/W<OFF+OW))return;/* 広げた外がわの竹は数えない */
  for(let j=0;j<W*H;j++){if(S.obj[j]!=='deadtree')continue;const ox=j%W-OFF,oy=((j/W)|0)-OFF;if(ox>=0&&oy>=0&&ox<14&&oy<16&&Math.random()<.5)S.obj[j]='bamboo'}
  let m=0;for(let t=0;t<600&&m<6;t++){const x=CX-12+((Math.random()*24)|0),y=CY-12+((Math.random()*24)|0),j=y*W+x;if(Math.abs(x+.5-CX)<7&&Math.abs(y+.5-CY)<7)continue;if(S.obj[j]||S.floor[j]||S.ground[j]!==0)continue;S.obj[j]='bamboo';m++}}
function bambooIdea(){/* はじめて竹を手に入れたら、竹の家具を思いつく */if(WD!==1||S.free||!((S.mat.bamboo||0)>0)||(S.guardianIdeas||{}).takebench)return;const ids=['takebench','takeakari','shishiodoshi'];S.recipes||(S.recipes={});S.guardianIdeas||(S.guardianIdeas={});ids.forEach(id=>{S.recipes[id]=true;S.guardianIdeas[id]=true});const t='あたらしいかたち：'+ids.map(id=>BL[id].name).join('・');toast(t,'good');memo('💡',t)}
function useNat(j){const o=S.obj[j];if(!o)return;const n=(S.hp['n'+j]||0)+1;if(n<(o==='boulder'?4:10)){S.hp['n'+j]=n;return}
  delete S.hp['n'+j];const x=j%W,y=(j/W)|0;if(o==='boulder'){clearObj(j);burst(j,'block');recount();checkQuest();return}if(!VILL[j])(S.regrow||(S.regrow=[])).push({j,id:o,day:dayNo()+3})/* 3日後の朝に生えなおす */;clearObj(j);burst(j,'block');recount()}
function ovenStand(G,q){let b=-1,bd=1e9;for(const[k,pen]of[[q-1,0],[q+1,0],[q+W,2],[q-W,40]]){const d=G.dist[k];if(d<0||!walk(k))continue;if(d+pen<bd){bd=d+pen;b=k}}return b}
function goStoreMat(r,G){const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'mat'))>=0,200);if(j>=0)return startAct(r,G,'smat',j);return startAct(r,G,'idle',-1,{dur:15})}
function goStore(r,G){const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,90);if(j>=0)return startAct(r,G,'store',j);return startAct(r,G,'idle',-1,{dur:15})}
function goEatSafe(r,any){/* コワイノのすぐそばを通らずに行けて、家の中・柵や壁でかこまれた所（コワイノが中にいない）・コワイノから4マス以上はなれた所の食料箱へ、走って食べにいく */if(!(S.food>0))return false;const Gf=fleeGraph(r),fo=fenceOut(),al=S.enemies.filter(e=>e.spawned&&!e.dead),encl=al.every(e=>fo[(e.y|0)*W+(e.x|0)]),safe=j=>!!roomOf(j)||(encl&&!fo[j])||!al.some(e=>Math.hypot(e.x-(j%W+.5),e.y-(((j/W)|0)+.5))<4);
  const j=nearest(Gf,j=>(any||safe(j))&&adjOf(j,k=>storageAt(k,'food'))>=0,200);if(j<0)return false;r.refill=S.t+60;startAct(r,Gf,'fetch',j,{run:true});return !!r.act}
const hungry=r=>r.hunger<50&&S.food>0&&!(r.noEatU>S.t);/* おなかが50より少なく、食べにいける（どんなときも、食べにいく） */
function goEat(r,G){if(r.cmat&&matCap()>0&&r.hunger>=50&&!isNight()&&!hostileNow(r)&&!foeNear(r))return goStoreMat(r,G);/* ごはんに行く前に、持っている素材をしまう（おなか50より少なければ、そのまま食べにいく） */
  if(S.food>0){
    const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'food'))>=0,200);
    if(j>=0){startAct(r,G,'fetch',j);return r.act&&r.act.type==='fetch'}
  }
  const f=ripeAdj(['berry','fruit']);const j=nearest(G,j=>f(j)>=0);
  if(j>=0){const k=f(j);startAct(r,G,'forage',j,{key:'o'+k,obj:k,run:S.food<=0});return r.act&&r.act.type==='forage'}/* 食料がゼロなら、茂みへは走る */
  r.bubble='😣';r.noEatU=S.t+20;goWander(r,G);return false;/* 食べにいけたら true。食べにいけないときは、20分は「おなか50で食べにいく」を休む（毎コマやめてはえらびなおすのをふせぐ） */
}
const fireMul=r=>(r.energy<10?.5:r.energy<25?.7:1)*(r.fun<20?.8:1);/* 火のせいれいは、つかれても楽しさが減ってもたたかう。そのぶん、こうげきが弱くなる（つかれ×0.7・楽しさ低下×0.8） */
const nightClear=()=>!!S.nightHad&&!S.nushi&&S.enemies.every(e=>e.dead);/* 今夜のコワイノを倒し切った */
const isWatch=r=>(r.elem==='fire'||r.name===POKO&&!WD&&!!S.flags.guard)&&!nightClear()/* コワイノをぜんぶ倒したら、火の子もフタバも寝る */;/* 夜の見回りをする子（フタバは、こもれびのまもりをおぼえたら） */
const hostileNow=r=>S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&foeAt(e,r));/* コワイノが、自分の3マス以内か、自分のいる家に来たときだけ、こわがる */
function goShiver(r,G){/* 家の中（なければ、いまの場所）で、ふるえる */let k=-1;if(HOUSES.length){const hs=new Set();for(const h of HOUSES)for(const q of h.inside)hs.add(q);k=nearest(G,j=>hs.has(j)&&walk(j)&&!HOME_DOORS.has(S.obj[j]),200)}if(k<0)return withFlee(r,fleeAlarm,G);/* 家がなければ、逃げつづける */startAct(r,G,'shiver',k,{run:true});return true}
function goSleep(r,G,run){
  if(!isNight()){const isB=j=>(BENCHES.has(S.obj[j])||(S.obj[j]==='part'&&BENCHES.has(S.obj[S.ref[j]])))&&!ashed(anc(j));const bj=nearest(G,j=>isB(j)&&free('o'+j,1),200);if(bj>=0)return startAct(r,G,'rest',bj,{key:'o'+bj,obj:anc(bj),seat:bj});if(cnt('bench')+cnt('takebench'))return startAct(r,G,'idle',-1,{dur:15})}/* 昼につかれたら、ベンチでひと休み（2人すわれる）。ベンチがあるのにうまっていたら、その場でひとやすみ。ベッドで眠るのは、夜と、ベンチがないときだけ */
  {const mb=myBed(r);if(mb>=0&&free('o'+mb,1)){const k=nearest(G,j=>j===mb,200);if(k>=0){const b=BL.bed.sleep;return startAct(r,G,'sleep',k,{key:'o'+k,obj:k,rate:b.rate,pt:b.pt,run:run&&!!isNight()})}}}/* じぶんのベッドがあれば、そこで眠る */
  const bedOK=j=>(BEDSET.has(S.obj[j])&&free('o'+j,1)&&bedFor(j,r));
  let j=nearest(G,j=>{if(!bedOK(j))return false;const h=roomOf(j);return !h||roomSleepN(h)<houseCap(h)},200);/* きゅうくつな家はなるべくさける */
  if(j<0)j=nearest(G,bedOK,200);
  if(j>=0){const b=BL[S.obj[j]].sleep;return startAct(r,G,'sleep',j,{key:'o'+j,obj:j,rate:b.rate,pt:b.pt,run:run&&!!isNight()})}
  if(isNight()&&HOUSES.length){// ベッドがない：家の中にいてもいいが、寝られない（家がなければ床で寝る）
    const hs=new Set();for(const h of HOUSES)for(const k of h.set)hs.add(k);
    const k=hs.size?nearest(G,j=>hs.has(j)&&walk(j)&&!HOME_DOORS.has(S.obj[j]),200):-1;
    return startAct(r,G,'stay',k,{run:run&&k>=0})}
  return startAct(r,G,'sleep',-1,{rate:.12,pt:1,ground:true});
}
function mate(a,b){const A=a.mates||(a.mates={}),B=b.mates||(b.mates={});A[b.id]=(A[b.id]||0)+1;B[a.id]=(B[a.id]||0)+1;if(A[b.id]===6){for(const x of[a,b])addFloat(x.x,x.y-1.4,'なかよし！');/* なかよしになったら、頭の上に「なかよし！」だけ */memo('🤝',a.name+'と'+b.name+'がなかよしになった');logEv(a.name+'と'+b.name+'がなかよしになった')}}/* いっしょに遊んだり食べたりした回数 */
const mateK=(r,ty)=>S.res.some(q=>q!==r&&((r.mates||{})[q.id]||0)>=6&&q.act&&q.act.type===ty&&q.act.stage==='do'&&Math.abs(q.x-r.x)+Math.abs(q.y-r.y)<5)?1.2:1;/* なかよしといっしょに寝る・休むと回復1.2倍 */
const bestMate=r=>{let b=null,n=5;for(const k in r.mates||{}){const q=S.res.find(x=>x.id===+k);if(q&&r.mates[k]>n){n=r.mates[k];b=q}}return b};
function socialBest(r,G){let best=null,bs=-1e9;
  for(const o of S.res){if(o===r||o.hidden)continue;const oj=(o.y|0)*W+(o.x|0),dd=G.dist[oj];
    if((r.chatCD||0)<S.t&&(o.chatCD||0)<S.t&&dd>=0&&dd<=16&&(!o.act||o.act.type==='wander'||o.act.type==='idle'||(o.act.stage==='walk'&&['chop','mine','play','fish'].includes(o.act.type)))&&o.hunger>35&&o.energy>25&&!o.carry&&!o.cmat&&!o.meal){
      const st=nearest(G,j=>[1,-1,W,-W].includes(j-oj)&&walk(j),14);if(st<0)continue;
      const tag=!isNight()&&r.energy>50&&o.energy>50&&Math.random()<.45;
      const s=8+(r.like==='chat'?6:0)-dd*.3+Math.random()*3;if(s>bs){bs=s;best={type:'chat',stand:st,o:{partner:o.id,tag}}}}}
  return best?{s:bs,b:best}:null}
function treePlanted(){let n=cnt('tree')+cnt('fruit');for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='sprout'&&S.dyn[j]&&(S.dyn[j].plant==='tree'||S.dyn[j].plant==='fruit'))n++}return n}/* 木・果樹（苗もふくむ）。花の芽はかぞえない */
const kcOK=(c,r,p)=>!WD&&sevName(c.kc[0])===r.name&&(c.kc[1]==='*'?!isKey(p.name):sevName(c.kc[1])===p.name);
const kGuard=()=>!!(S.flags||{}).guard,kE09=()=>!!(S.sev||{}).e09,kSh=()=>(S.bossKills||0)>=1,kE18=()=>!!(S.sev||{}).e18,kClr=()=>!!S.cleared;
/* せいれいどうしのおしゃべり。0が話しかけた子、1が相手。「みる」でタップすると読める。「コワイノ」のお話は、はっきりは言わず、聞いていると正体が少しずつわかる（STORY.md） */
const CHATS=[/* kc：キーキャラどうし（話しかける子, 相手）、el：その属性の子だけ、mate：なかよしだけ、ok：出る条件。セーブに番号が入るので、順番を変えない */
 Object.assign([[0,'ねえ、さっき柵のむこうで、なにか光ってなかった？'],[1,'見た見た！ きらきらってしてた。'],[0,'なんだろう…。さわったら、いいことあるのかな。']],{ok:()=>['fence','logfence','bamboofence','wall'].some(id=>cnt(id)>0)}),
 [[0,'きらきらしてるのって、風にはこばれてくるんだって。'],[1,'へえ。じゃあ、風の強い日は、いっぱい来るのかな。'],[0,'かもね。こんど、さがしてみよっと。']],
 Object.assign([[0,'外のきらきら、ひろったことある？'],[1,'あるよ。ちいさな種みたいだった。'],[0,'種？ 植えたら、なにが生えるの？'],[1,'うーん…植えるっていうより、食べると力がわいてくる感じ？']],{ok:()=>(S.mseedGot||0)>0||(S.mseed||0)>0}),
 [[0,'守り神さまなら、遠くのきらきらにも、手がとどくのかな。'],[1,'とどきそう！ ぼくらは歩いていかないとだけど。']],
 [[0,'#alarm|ねえ、コワイノって、どこから来るのかな。'],[1,'わかんない。でも朝になると、じゅわって消えちゃうよね。'],[0,'消えて…どこに行くんだろう。'],[1,'#think|……どこにも、行けないのかもね。']],
 Object.assign([[0,'むかしは、闇のヌシ様っていうヌシ様が、いたんだって。'],[1,'闇の？ 草原のヌシ様とはちがうの？'],[0,'わかんない。おばあちゃんせいれいが、そう言ってた気がする。'],[1,'ふうん…。会ってみたいね。']],{ok:()=>WD!==0&&WD!==FREE}),
 Object.assign([[0,'この土地、前はもっと緑だったのかな。'],[1,'たぶんね。土をさわると、なんだか、なつかしい感じがするもん。'],[0,'わかる。おぼえてないのに、知ってる感じ。']],{key:1}),
 [[0,'#cry|コワイノって、こわいけど…なんか、さみしそうじゃない？'],[1,'え、そう？'],[0,'#nod|うん。こっちに来たいだけ、みたいな。'],[1,'#think|……そう言われると、そんな気もしてきた。']],
 Object.assign([[0,'力って、使ったらなくなるの？'],[1,'#surprise|なくならないよ。土にかえって、また木になるんだって。'],[0,'じゃあ、かえれなかった力は？'],[1,'え…どうなるんだろう。']],{ok:()=>WD!==0&&WD!==FREE}),
 [[0,'カミサマって、ずっとひとりなのかな。'],[1,'ひとりじゃないよ。ぼくたちがいるもん。'],[0,'そうだけど…たまに、とおくを見てるときがあるよね。'],[1,'だれかを、待ってるのかもね。']],
 [[0,'遠くの土地にも、せいれいっているのかな。'],[1,'いるよ、きっと。水の村とか、火の山とか。'],[0,'そこも、ここみたいに、しずかになっちゃってるのかな。'],[1,'#think|……いつか、見に行けたらいいね。']],
 [[0,'#scared|夜って、ほんとうはこわいものじゃなかったんだって。'],[1,'えー、うそだぁ。'],[0,'ほんとほんと。むかしは、夜はやすむための時間だったって。'],[1,'#alarm|いまも、やすむ時間だよ。コワイノがいなければね。']],
 Object.assign([[0,'#teary|ヌシ様って、どうしていなくなっちゃったんだろう。'],[1,'土地の力が弱くなったから、って聞いたよ。'],[0,'じゃあ、わたしたちががんばったら…。'],[1,'#nod|うん。きっと、もどってきてくれる。']],{ok:()=>!S.cleared}),
 Object.assign([[0,'ヌシ様って、近くで見ると、すごく大きいね。'],[1,'つののところに、小鳥がとまってたよ。'],[0,'ヌシ様、じっとしてあげてたね。']],{ok:()=>!WD&&!!S.cleared&&!!S.nushi}),
 [[0,'#sigh|星って、なんで夜にしか見えないの？'],[1,'昼もあるんだよ。お日さまがまぶしくて、見えないだけ。'],[0,'じゃあ、見えないだけで、そこにいるものって、ほかにもあるのかな。'],[1,'#think|……あるのかもね。']],
 [[0,'ねえねえ、今日の空、見た？'],[1,'見た見た！ 雲が、おさかなの形してたね。'],[0,'#surprise|えっ、ぼうしの形じゃなかった？'],[1,'…見る場所で、ちがうのかもね。']],
 [[0,'きのうの夜ね、ゆめを見たの。'],[1,'どんなゆめ？'],[0,'大きなベリーに、ころころ追いかけられるゆめ。'],[1,'#scared|こわいような、おいしそうなような…。']],
 [[0,'このへん、ちょっとずつ、にぎやかになってきたね。'],[1,'#nod|うん。朝おきるのが、たのしみになったよ。']],
 [[0,'さっき、ちょうちょがとまったんだ。頭の上に。'],[1,'いいなあ。お花とまちがえたのかな？'],[0,'#joy|えへへ、そうかも。']],
 [[0,'ねえ、まばたき、がまんしてみて。'],[1,'…………。'],[0,'…………。'],[1,'#surprise|あっ、いま、した！ ずるい！']],
 Object.assign([[0,'守り神さまって、いつもなにしてるのかな。'],[1,'空の上から、見ててくれてるんだって。'],[0,'じゃあ、いまも見てるかも？'],[1,'…手、ふっとこうか。']],{wave:1}),
 [[0,'かくれんぼ、したことある？'],[1,'あるよ。でも、すぐ見つかっちゃう。'],[0,'#sigh|どうして？'],[1,'見つけてほしくて、つい顔だしちゃうの。']],
 [[0,'石って、ひとつずつ、もようがちがうんだよ。'],[1,'へえ。じゃあ、石にも名前つけられるね。'],[0,'このまえ拾ったのは「まるお」にした。']],
 [[0,'雨の音、好き？'],[1,'好き。ぽつぽつって、だれかが歌ってるみたい。']],
 [[0,'ね、どっちが早く歩けるか、きょうそうしない？'],[1,'いいよ。…あ、でも、いま休みたい気分。'],[0,'じゃあ、また今度ね。']],
 [[0,'ねえ、すきなことば、ある？'],[1,'「いただきます」！ そのあと、ごはんだから。'],[0,'#think|それ、ことばが好きなんじゃなくて…。']],
 [[0,'あのね、ひみつ教えてあげる。'],[1,'なになに？'],[0,'…やっぱり、あしたにする。'],[1,'えー！ 気になるよ！']],
 [[0,'葉っぱのにおいって、いいよね。'],[1,'わかる。朝の、しめった葉っぱが、いちばん好き。']],
 [[0,'さっき、カエルさんにあいさつされた。'],[1,'なんて言ってた？'],[0,'「ケロ」って。'],[1,'…ふつうのあいさつだね。']],
 [[0,'ねえ、しってる？ 雲って、のれないんだって。'],[1,'#surprise|えっ、ずっと、のってみたかったのに。'],[0,'でも、見てるだけでも、ふわふわした気分になるよ。']],
 [[0,'きょう、なにがいちばんたのしかった？'],[1,'うーん…いま、こうしてしゃべってること！'],[0,'#joy|…えへへ。ぼくも。']],
 [[0,'ほっぺ、なにかついてるよ。'],[1,'#surprise|えっ、どこどこ？'],[0,'…うそ。なんにもついてない。'],[1,'もー！']],
 [[0,'いちばん好きな食べもの、なに？'],[1,'ぜんぶ！ …って言ったら、ずるい？'],[0,'ずるくないよ。ぼくも、ぜんぶ。']],
 [[0,'#sigh|夕やけって、どうしてオレンジなのかな。'],[1,'お日さまが、ねむくなって顔が赤くなるからだよ。'],[0,'#surprise|そうなの！？'],[1,'…たぶん。']],
 [[0,'ねえ、しりとりしよう。りんご！'],[1,'ごはん！'],[0,'…あっ。'],[1,'おわっちゃったね。']],
 [[0,'このまえ、お星さまに、おねがいしたんだ。'],[1,'なんて？'],[0,'ないしょ。でも、もうちょっとで、かないそう。']],
 [[0,'ねえ、ありさんの行列、見た？'],[1,'見た！ ずーっと、つづいてた。'],[0,'どこまで行くのか、ついていったら、日がくれちゃった。']],
 [[0,'あしたも、晴れるかなあ。'],[1,'晴れたら、いっしょにおさんぽしよう。'],[0,'雨だったら？'],[1,'雨でも、おさんぽしよう。']],
 [[0,'ねむいとき、どうやって起きてる？'],[1,'ほっぺを、むにーってするの。'],[0,'…それ、ちょっとかわいいね。']],
 Object.assign([[0,'さいきん、みんなの家がふえてきたね。'],[1,'#joy|うん。夜も、あかりがいっぱいで、うれしい。']],{ok:()=>HOUSES.length>=2&&LIGHTS.length>=2}),
 [[0,'#sigh|てんとう虫って、なんで、てんてんがあるの？'],[1,'おしゃれだからだよ。'],[0,'そっかあ。ぼくも、てんてん、ほしいな。']],
 [[0,'ねえ、ないしょの場所、見つけたんだ。'],[1,'どこ？ どこ？'],[0,'こんど、つれてってあげる。ふたりだけのひみつね。']],
 [[0,'おなかがなると、ちょっと、はずかしいよね。'],[1,'さっき、ぐうって鳴ったの、聞こえた？'],[0,'…なんにも聞こえなかったよ。'],[1,'やさしい…。']],
 [[0,'もし、空をとべたら、どこに行きたい？'],[1,'雲の上で、おひるねしたい！'],[0,'いいね。ぼくは、お日さまに、あいさつしに行く。']],
 [[0,'目をつぶって、音だけ聞いてみて。'],[1,'…鳥のこえ、葉っぱの音、それから…'],[0,'それから？'],[1,'#joy|きみの、いきの音。ちかいよ。']],
 [[0,'夜になると、お花もねむるのかな。'],[1,'ねむるよ。ちゃんと、おやすみって言ってあげなきゃ。']],
 [[0,'ねえ、手、つないでみる？'],[1,'…ちょっと、てれるね。'],[0,'じゃあ、小指だけ。']],
 Object.assign([[0,'ねえ、すべり台って、何回すべってもあきないね。'],[1,'わかる！ 上るのはちょっと大変だけど。'],[0,'それも、たのしいのうちだよ。']],{ok:()=>cnt('slide')>0}),
 [[0,'どんぐりって、ぼうしをかぶってるよね。'],[1,'ほんとだ。とったら、どうなるの？'],[0,'つるつるの頭が出てくるよ。'],[1,'…ちょっと、さむそう。']],
 [[0,'ねえ、ねごとって、言ったことある？'],[1,'ないよ。…たぶん。'],[0,'きのう、「もう、たべられない」って言ってたよ。'],[1,'#surprise|えっ！？']],
 [[0,'しってる？ 星って、ずっと遠くで光ってるんだって。'],[1,'じゃあ、いま見えてる光は、むかしの光？'],[0,'そうかも。…なんか、ふしぎだね。']],
 [[0,'さっき、しゃっくりが、とまらなくなったの。'],[1,'いまは？'],[0,'…ひっく。'],[1,'まだだね。']],
 Object.assign([[0,'すなばで、お城をつくったよ。'],[1,'見たい見たい！'],[0,'…風で、ちょっとくずれちゃったけど。']],{ok:()=>cnt('sandbox')>0}),
 [[0,'ここに来てから、いろんな色を見たよ。'],[1,'どの色がいちばん好き？'],[0,'みんなが笑ってるときの色。']],
 [[0,'しっぽ、ほしいなあ。'],[1,'#sigh|なんで？'],[0,'#joy|うれしいとき、ふりたいから。']],
 [[0,'ねえ、すきな場所、おしえあいっこしない？'],[1,'いいよ。わたしは、井戸のそば。ひんやりしてるの。'],[0,'ぼくは、神殿の前。カミサマの声が、ちかいから。']],
 [[0,'きのう、葉っぱの舟をうかべたよ。'],[1,'どこまで行った？'],[0,'池のまんなかで、くるくるまわってた。']],
 [[0,'あくび、うつった？'],[1,'#surprise|ふわぁ…うつった。'],[0,'ふふ、作戦成功。']],
 [[0,'#sigh hop|おいしいって、どうしてうれしいんだろう。'],[1,'#joy|おなかが、ありがとうって言ってるのかも。']],
 [[0,'ねえ、じぶんの名前、好き？'],[1,'うん。よばれると、うれしくなる。'],[0,'ぼくも。だから、いっぱい、よんでね。'],[1,'#joy|うん、何回でもよぶよ。']],
 Object.assign([[0,'シーソー、またいっしょにのろうね。'],[1,'#nod|うん。こんどは、ぼくが上の番！']],{ok:()=>cnt('seesaw')>0}),
 [[0,'ひとりでいるのも好きだけど…'],[1,'#nod|うん。'],[0,'みんなといるのは、もっと好き。']],
 [[0,'このまえ、虹のはしっこをさがしたんだ。'],[1,'見つかった？'],[0,'ううん。でも、歩くのがたのしかった。']],
 Object.assign([[0,'ねえ、となりにいると、なんだか安心する。'],[1,'わたしも。ずっと前から知ってたみたい。']],{mate:1}),
 Object.assign([[0,'こんど、いっしょに星を見に行こうよ。'],[1,'#nod|うん！ ふたりだけで、ね。']],{mate:1}),
 Object.assign([[0,'#joy|きのうのごはん、半分こしてくれて、ありがとう。'],[1,'#joy|いいの。いっしょに食べると、おいしいもん。']],{mate:1}),
 Object.assign([[0,'#teary|もし、ぼくが消えちゃったら…'],[1,'そんなこと言わないで。…でも、そしたら、ずっと待ってる。'],[0,'…うん。ぜったい、もどってくるね。']],{mate:1}),
 Object.assign([[0,'ねえ、ないしょの合図、決めない？'],[1,'いいね！ 手を、ぎゅっぎゅって、2回。'],[0,'それ、ぼくたちだけの合図ね。']],{mate:1}),
 Object.assign([[0,'つかれたら、いつでも言ってね。'],[1,'じゃあ、いま、ちょっとだけ、もたれていい？'],[0,'…どうぞ。']],{mate:1}),
 Object.assign([[0,'はじめて会った日のこと、おぼえてる？'],[1,'おぼえてるよ。すっごく、もじもじしてたね。'],[0,'それは、きみもでしょ。']],{mate:1}),
 Object.assign([[0,'あしたも、いっしょにはたらこうね。'],[1,'#nod|うん。きみといると、時間がはやいんだ。']],{mate:1}),
 [[0,'さっき、水たまりに、とびこんじゃった。'],[1,'#surprise|えー！ どろんこだよ。'],[0,'#joy|うん。でも、ぱしゃって、いい音がした。']],
 [[0,'きのうの夕方、ほたるを見たよ。'],[1,'どこで？'],[0,'池のそば。ちいさな星が、おりてきたみたいだった。'],[1,'#joy|こんど、いっしょに見に行こう。']],
 [[0,'#sigh|ねえ、くしゃみって、なんで出るのかな。'],[1,'はなが、くすぐったいからだよ。'],[0,'だれが、くすぐってるの？'],[1,'…かぜさん？']],
 [[0,'あしたの朝ごはん、なにかなあ。'],[1,'まだ今日の夜ごはんも、食べてないよ。'],[0,'#think|楽しみは、さきに考えたほうがいいんだよ。']],
 [[0,'ひとりで歩いてたら、かげがついてきたの。'],[1,'それ、じぶんのかげだよ。'],[0,'わかってるけど、なかよくなれそうだった。']],
 [[0,'ねえ、おひるねするなら、どこがいい？'],[1,'木かげ！ 風がすずしいの。'],[0,'いいね。こんど、となりで寝てもいい？'],[1,'いびき、かかないならね。']],
 [[0,'カミサマって、なにを食べてるのかな。'],[1,'おそなえもの、じゃない？'],[0,'じゃあ、こんどベリーをいっぱい入れておこう。']],
 [[0,'さっき、ころんじゃった。'],[1,'だいじょうぶ？ いたくない？'],[0,'#nod|うん。でも、草がふかふかで、ちょっと気持ちよかった。']],
 [[0,'ねえ、ないしょの話、していい？'],[1,'いいよ。だれにも言わない。'],[0,'#scared|…ほんとは、虫がちょっとだけ、こわいの。'],[1,'わたしも。ないしょね。']],
 [[0,'星って、いくつあるのかな。'],[1,'かぞえてみたけど、とちゅうで寝ちゃった。'],[0,'じゃあ、今夜はふたりで、はんぶんずつかぞえよう。']],
 [[0,'今日、なにかいいことあった？'],[1,'まるい石を見つけたよ。ほら。'],[0,'#surprise|わあ、つるつる！'],[1,'あげる。今日いちばんのいいこと、おすそわけ。']],
 [[0,'ねえ、おうた、うたえる？'],[1,'ちょっとだけなら。らら〜♪'],[0,'じょうず！ ぼくも、らら〜♪'],[1,'…ふたりだと、もっとじょうずに聞こえるね。']],
 [[0,'みんなで、ピクニックしたいな。'],[1,'いいね！ おべんとう、なににする？'],[0,'もちろん、焼きいも！']],
 [[0,'さいきん、ちょっとだけ、力もちになった気がする。'],[1,'ほんと？ うで、見せて。'],[0,'…見た目は、かわってないけど。']],
 [[0,'ねえ、きょう、なんかいわらった？'],[1,'かぞえてないよ。'],[0,'ぼくは、もう十回。…あ、いまので十一回。']],
 [[0,'もし、ひとつだけねがいがかなうなら？'],[1,'うーん…毎日、ベリーが食べたい。'],[0,'それ、もうかなってない？'],[1,'…ほんとだ！']],
 [[0,'おはなし、きいて。きのう、へんなゆめを見たの。'],[1,'またベリーのゆめ？'],[0,'ちがう。こんどは、きのこが、おどってた。'],[1,'…それは見たいかも。']],
 [[0,'ここに来るまえ、どこにいたか、おぼえてる？'],[1,'うーん…あったかくて、しずかなところ。'],[0,'ぼくも。ふしぎだね。']],
 [[0,'ねえ、おにごっこしよう！'],[1,'いいよ。じゃあ、きみがおに！'],[0,'#surprise|えっ、もう決まってるの！？']],
 [[0,'けさ、くものすに、つゆがついてたよ。'],[1,'きらきらしてた？'],[0,'#nod|うん。ちいさな玉が、いっぱいならんでた。'],[1,'クモさん、朝から、いいもの作るね。']],
 [[0,'ねえ、あっちの花、色がかわってたよ。'],[1,'ほんと？ きのうは白かったのに。'],[0,'#think|お花も、きがえるのかな。']],
 [[0,'#joy|あのね、ありがとうって、言いたかったの。'],[1,'え、なにが？'],[0,'いつも、いっしょにいてくれて。'],[1,'…こちらこそ。']],
 [[0,'#surprise|ねえ、はっぱで、ふえって、ふけるんだって。'],[1,'ぴーって？ やってみて！'],[0,'…ぷすー。'],[1,'あはは、こんど、れんしゅうしよう。']],
 Object.assign([[0,'おふろって、いいよね。'],[1,'あったかくて、とけちゃいそう。'],[0,'とけたら、こまるね。'],[1,'じゃあ、ちょっとだけ、とける。']],{ok:()=>cnt('hotstone')>0||cnt('bathtub')>0||WD===1&&springN()>0}),
 [[0,'さっき、カミサマが、ひとりでわらってたよ。'],[1,'なにが、おかしかったのかな。'],[0,'わかんない。でも、こっちまで、わらっちゃった。']],
 [[0,'ねえ、ぼくたちって、大きくなるのかな。'],[1,'こころは、もう大きくなってるよ。'],[0,'…かっこいいこと言うね。']],
 Object.assign([[0,'あ、いいにおい。だれか、なにか作ってる？'],[1,'かまどのほうから、するね。'],[0,'ちょっと、見に行ってみよう。'],[1,'つまみぐいは、だめだよ。']],{ok:()=>cnt('oven')>0}),
 [[0,'おちば、いっぱいあつめたんだ。'],[1,'なにに使うの？'],[0,'ふかふかのベッド。…でも、風が、ぜんぶもっていっちゃった。'],[1,'こんどは、石でおさえよう。']],
 [[0,'まいにち、おなじ道をあるいてても、あきないね。'],[1,'きのうと、ちょっとずつちがうもん。'],[0,'#nod|うん。きょうは、お花がひとつ、ふえてた。']],
 [[0,'さむい日は、くっついてると、あったかいね。'],[1,'…ちょっと、きゅうくつだけどね。'],[0,'それも、あったかいのうち。']],
 [[0,'ねえ、わすれものしたこと、ある？'],[1,'あるある。なにを、わすれたかも、わすれた。'],[0,'…それ、いちばん、こまるやつだ。']],
 [[0,'この村、もっとすてきになるかな。'],[1,'なるよ。みんなで、そだててるもん。'],[0,'#nod|うん。ずっと、ここにいたいな。']],
 Object.assign([[0,'お花のつぼみ、あしたひらきそう。'],[1,'わかるの？'],[0,'#nod|うん。もうすぐだよって、言ってた。']],{el:'wood'}),
 Object.assign([[0,'木のぼり、とくいなんだ。'],[1,'おりるのは？'],[0,'…それは、れんしゅうちゅう。']],{el:'wood'}),
 Object.assign([[0,'草むらで、ねころぶとね、空がひろく見えるよ。'],[1,'いっしょに、ねころんでみる？'],[0,'#nod|うん。せーの！']],{el:'wood'}),
 Object.assign([[0,'葉っぱのうらって、ちょっとだけ、ひんやりしてるんだよ。'],[1,'さわってみたい！'],[0,'こんど、いちばんいい葉っぱ、教えてあげる。']],{el:'wood'}),
 Object.assign([[0,'きのう植えた苗、ちょっとのびてた。'],[1,'見てたの？'],[0,'#nod|うん。ずっと。']],{el:'wood',ok:()=>treePlanted()>0}),
 Object.assign([[0,'木ってね、しずかにおしゃべりしてるんだって。'],[1,'なんて言ってるの？'],[0,'「お水、まだかなあ」って。']],{el:'wood'}),
 Object.assign([[0,'しずくって、まるくて、かわいいよね。'],[1,'#sigh|なんで、まるくなるのかな。'],[0,'ぎゅって、みんなで、だきあってるからだよ。']],{el:'water'}),
 Object.assign([[0,'池の水、きょうは、すきとおってたよ。'],[1,'そこまで見えた？'],[0,'#nod|うん。さかなが、手をふってた。']],{el:'water'}),
 Object.assign([[0,'つりって、待ってる時間が、いちばん好き。'],[1,'つれなくても？'],[0,'つれなくても。水の音を聞いてるだけで、しあわせ。']],{el:'water'}),
 Object.assign([[0,'水たまりに、空がうつってたよ。'],[1,'空が、下にもあるみたいだね。'],[0,'そう。とびこんだら、空をおよげそう。']],{el:'water'}),
 Object.assign([[0,'さかなって、ねむるとき目をあけてるんだよ。'],[1,'#surprise|えっ、まぶしくないのかな。'],[0,'水の中は、やさしい光だから。']],{el:'water'}),
 Object.assign([[0,'雨がふると、なんだか元気になっちゃう。'],[1,'わたしは、ちょっとねむくなるよ。'],[0,'じゃあ、雨の日は、わたしががんばるね。']],{el:'water'}),
 Object.assign([[0,'ほっぺ、さわってみる？ あったかいよ。'],[1,'ほんとだ、ぽかぽか！'],[0,'さむくなったら、いつでも言ってね。']],{el:'fire'}),
 Object.assign([[0,'夕やけって、ぼくのなかまみたいな色だよね。'],[1,'じゃあ、毎日あいさつしなきゃね。'],[0,'#nod|うん。また、あしたって。']],{el:'fire'}),
 Object.assign([[0,'料理するとき、火かげんが大事なんだ。'],[1,'つよいほうが、早くできない？'],[0,'こげちゃうよ。やさしく、じっくりがいいの。']],{el:'fire'}),
 Object.assign([[0,'#scared|夜になっても、こわくないよ。'],[1,'#sigh|どうして？'],[0,'ぼくが、ちゃんと明るくしてるから。']],{el:'fire'}),
 Object.assign([[0,'たき火の音って、ぱちぱち、拍手みたいだよね。'],[1,'だれに拍手してるの？'],[0,'がんばった、みんなにだよ。']],{el:'fire'}),
 Object.assign([[0,'ねえ、ほのおの色って、ひとつじゃないんだよ。'],[1,'赤じゃないの？'],[0,'まんなかは、青いときもあるんだ。ちょっとだけ、ひみつの色。']],{el:'fire'}),
 Object.assign([[0,'土をさわってると、おちつくんだぁ。'],[1,'手、どろどろだよ。'],[0,'それが、いいんだよぉ。']],{el:'earth'}),
 Object.assign([[0,'みみずさんって、えらいんだよ。'],[1,'#sigh|どうして？'],[0,'土を、ふかふかにしてくれるから。ぼくの先生。']],{el:'earth'}),
 Object.assign([[0,'山って、ゆっくり、大きくなるんだって。'],[1,'どのくらい、ゆっくり？'],[0,'ぼくたちが、なんかい、おひるねしても、気づかないくらい。']],{el:'earth'}),
 Object.assign([[0,'土のにおい、かいだことある？'],[1,'雨のあとの、あのにおい？'],[0,'そう。あれ、ぼくのいちばん好きなにおい。']],{el:'earth'}),
 Object.assign([[0,'石をかさねるとね、ちょっとだけ、お城みたいになる。'],[1,'こんど、いっしょにつくろう！'],[0,'くずれても、おこらないでね。']],{el:'earth'}),
 Object.assign([[0,'地面の下には、ねむってる種がいっぱいあるんだ。'],[1,'いつ起きるの？'],[0,'#shocked|ここがもっと、あたたかくなったら。']],{el:'earth'}),
 Object.assign([[0,'風にのって、すこしだけ、うかんだことあるよ。'],[1,'#surprise|ほんと！？ どのくらい？'],[0,'…葉っぱ一まいぶん。'],[1,'それでも、すごい！']],{el:'wind'}),
 Object.assign([[0,'はやく走ると、せかいが、びゅーんってなるんだ。'],[1,'#scared|こわくない？'],[0,'たのしいよ。こんど、手をつないで走ろう。']],{el:'wind'}),
 Object.assign([[0,'たかいところって、好き？'],[1,'#scared|ちょっと、こわいかな。'],[0,'#scared|じゃあ、こんど、いっしょにのぼろう。ふたりなら、こわくないよ。']],{el:'wind'}),
 Object.assign([[0,'さっき、雲においついたよ。'],[1,'ほんとに？ どうだった？'],[0,'ふわふわで、ちょっとしめってた。']],{el:'wind'}),
 Object.assign([[0,'風にのると、遠くのにおいがするんだ。'],[1,'どんなにおい？'],[0,'まだ知らない、どこかのお花のにおい。']],{el:'wind'}),
 Object.assign([[0,'たんぽぽのわたげ、どこまでとぶと思う？'],[1,'となりの村くらい？'],[0,'もっと。空のはしっこまで。']],{el:'wind'}),
 Object.assign([[0,'ずっとむかしは、夜も、こんなに暗くなかったんだって。'],[1,'#alarm|じゃあ、「コワイノ」も？'],[0,'…そのころは、いなかったみたい。']],{ok:()=>!S.cleared&&(S.nights||0)>=1}),
 Object.assign([[0,'#alarm|ハヤカゲって、いつも、すごくいそいでるよね。'],[1,'うん。ぶつかられて、ころんじゃった。'],[0,'…朝までに、どこかへ行かなきゃいけない、みたいだったね。']],{ok:()=>((S.enKills||{}).fast||0)>=1}),
 Object.assign([[0,'#alarm|夜、家の壁を「コワイノ」がたたいてた。'],[1,'#scared|こわかったね。'],[0,'#nod|うん。でも、「入れて」って言ってるみたいにも、聞こえたんだ。']],{ok:()=>(S.nights||0)>=1&&HOUSES.length>0}),
 Object.assign([[0,'オオカゲを、ちかくで見ちゃった。'],[1,'#scared|こわくなかった？'],[0,'#scared|こわかった。でも、体の中で、小さいかげが、いっぱいうごいてたんだ。'],[1,'…なんだか、さむそうだったね。']],{ok:()=>(S.bossKills||0)>=1}),
 Object.assign([[0,'畑の作物、またカゲドロボウにとられちゃった。'],[1,'じぶんで植えればいいのにね。'],[0,'…かげには、育てられないのかも。']],{ok:()=>!!(S.seenEn||{}).thief}),
 Object.assign([[0,'#joy|ワナクイって、罠をおいしそうに食べるよね。'],[1,'#joy|まもるために作った物って、おいしいのかな。'],[0,'…みんなの「まもりたい」が、つまってるからかも。']],{ok:()=>!!(S.seenEn||{}).trapper}),
 Object.assign([[0,'ハイカゲが通ったあと、かまどがつめたくなってた。'],[1,'あったかいのが、ほしいのかな。'],[0,'…灰になっても、まだ、さがしてるんだね。']],{ok:()=>!!(S.seenEn||{}).ash}),
 Object.assign([[0,'ヨルノオオカゲって、どこから来たんだろう。'],[1,'夜が、いっぱいあつまったみたいだったね。'],[0,'…オオカゲより、ずっと、ずっとたくさん。']],{ok:()=>!!(S.seenEn||{}).boss2}),
 Object.assign([[0,'#alarm|さっき、「コワイノ」と目があったの。'],[1,'#scared|こわかった？'],[0,'…ううん。なんだか、ぼくらの目と、にてた。']],{ok:()=>(S.bossKills||0)>=1}),
 Object.assign([[0,'ねえ、闇のせいれいって、知ってる？'],[1,'ううん。そんな子、いるの？'],[0,'むかしは、いたんだって。夜をまもる、やさしい子たち。'],[1,'…いまは、どこにいるんだろう。']],{ok:()=>(S.bossKills||0)>=2}),
 Object.assign([[0,'闇のせいれいはね、闇のヌシ様がいなくなった夜に、帰る場所をなくしたんだって。'],[1,'帰る場所をなくすと、どうなるの？'],[0,'…かげだけになって、あったかいところを、さがしまわるんだって。'],[1,'それって…。']],{ok:()=>(S.bossKills||0)>=3}),
 Object.assign([[0,'#alarm|「コワイノ」を追いはらうとき、ちょっとだけ、胸がいたくなるんだ。'],[1,'…うん。もう、もどれないんだよね。'],[0,'だから、せめて朝まで、しずかにねむってほしいな。']],{ok:()=>!!S.cleared}),
 Object.assign([[0,'闇のヌシ様が夜をまもってたなら、昼は、だれがまもってたんだろう。'],[1,'…光のヌシ様？'],[0,'そのヌシ様も、いまは見かけないね。']],{ok:()=>(S.bossKills||0)>=3}),
 Object.assign([[0,'光のヌシ様って、いまも、どこかにいるのかな。'],[1,'いるよ、きっと。お日さま、毎朝ちゃんとのぼるもん。'],[0,'…そうだといいな。']],{ok:()=>!!S.cleared}),
 Object.assign([[0,'お日さまって、むかしより、ちょっとだけ小さいんだって。'],[1,'ほんと？ だれに聞いたの？'],[0,'#sigh|土のせいれいが、そう言ってた。…なんでだろうね。']],{ok:()=>!!S.cleared}),
 Object.assign([[0,'#sigh|夕やけって、どうして、あんなにきれいなのかな。'],[1,'…だれかが、さいごまで、いっしょうけんめい光ってるみたいだね。']],{ok:()=>!!S.cleared}),
 Object.assign([[0,'#think|このいす、だれが最初に考えたのかな。'],[1,'ずっとむかしから、あるかたちなんだって。'],[0,'すわるひとのこと、よく知ってたんだね。']],{ok:()=>(S.nights||0)>=2}),
 Object.assign([[0,'道をつくってたら、土の下から、四角い石が出てきたよ。'],[1,'きれいにならんでたね。…むかし、だれかが、しいたのかな。']],{ok:()=>(S.nights||0)>=4}),
 Object.assign([[0,'#danger|畑のつくりかた、だれにおそわったの？'],[1,'土の中に、むかしのうねのあとがあったんだ。まねしただけだよ。']],{ok:()=>(S.nights||0)>=6}),
 Object.assign([[0,'あの古い家、とびらの取っ手が、すごく高いところにあったよ。'],[1,'わたしたちより、ずっと大きなだれかが、住んでたのかもね。']],{ok:()=>WD===1}),
 Object.assign([[0,'ねえ、「にんげん」って知ってる？'],[1,'…カミサマが、むかしの話をするときに、言ってたような。'],[0,'どこに行っちゃったんだろうね。'],[1,'わからない。…カミサマ、そのことは、あんまり話したがらないんだ。']],{ok:()=>!!S.cleared}),
 Object.assign([[0,'#joy|ノドカ、さっきのごはん、おいしかったね！'],[1,'#think|そうだねぇ。もう次のごはんのこと、考えてる顔してるよぉ。'],[0,'#surprise|えっ、ばれてる！']],{kc:['F','N']}),
 Object.assign([[0,'ノドカ、ここ、ひなたでぽかぽかだよ！'],[1,'ほんとだねぇ。ここで寝たら、気持ちよさそう。'],[0,'ねちゃだめ！ 畑を見に行くんでしょ！'],[1,'そうだったぁ。']],{kc:['F','N']}),
 Object.assign([[0,'@Hの手、ぽかぽかだね！'],[1,'おう。ふれてみるか？ やけどすんなよ。'],[0,'ぬくぬく！ 寒い日は、そばにいてもいい？'],[1,'ああ、好きにしな。']],{kc:['F','H']}),
 Object.assign([[0,'ぼく、きのう水やり、ちゃんとできたよ！'],[1,'ええ、見ていました。こぼしたのは、半分だけでしたね。'],[0,'#surprise|半分！？ 半分は、こぼしたの！？'],[1,'#think|……上達しています。']],{kc:['F','M']}),
 Object.assign([[0,'@K、風ってどんな音？'],[1,'フッ……耳をすませてごらん。ほら、ささやいている。'],[0,'#think|……ほんとだ！ 「ねむいなあ」って言ってる！'],[1,'#think|……それは、きみのおなかの音だよ。']],{kc:['F','K']}),
 Object.assign([[0,'ぼくね、花の冠を作るの、とくいなんだ。'],[1,'すごい！ 見てみたい。'],[0,'じゃあ、あとでいっしょに作ろう！']],{kc:['F','*']}),
 Object.assign([[0,'#scared|こわいときは、ぼくのうしろにかくれていいからね。'],[1,'フタバ、たのもしい。'],[0,'#scared|えへへ。ぼくも、まだちょっとこわいけどね。']],{kc:['F','*'],ok:kGuard}),
 Object.assign([[0,'きょうは元気？ おなかすいてない？'],[1,'ちょっとすいてるかも。'],[0,'じゃあ、ぼくのベリー、はんぶんこしよう！']],{kc:['F','*']}),
 Object.assign([[0,'#cry|ぼくにはね、きょうだいがいたんだ。'],[1,'そうなんだ。どんな子たち？'],[0,'みんな、ぼくよりおっきくて、やさしかった。……いつか、また会えるといいな。'],[1,'会えるよ、きっと。']],{kc:['F','*'],ok:kE09}),
 Object.assign([[0,'ヌシ様が帰ってきたら、いっしょにあいさつしよう！'],[1,'#nod|うん！ なんて言うの？'],[0,'#joy|「おかえりなさい」！ ぼく、もう百回れんしゅうしたんだ。']],{kc:['F','*'],ok:()=>kSh()&&!S.cleared}),
 Object.assign([[0,'#joy|ヌシ様に「おかえりなさい」って、ちゃんと言えたよ。'],[1,'れんしゅう、してたもんね。'],[0,'#joy|えへへ。百一回目が、ほんばんだったんだ。']],{kc:['F','*'],ok:kClr}),
 Object.assign([[0,'きのう、ヌシ様といっしょに、草原をおさんぽしたんだ！'],[1,'いいなあ！'],[0,'ヌシ様が歩くと、草が「さわさわ」って、あいさつするんだよ。']],{kc:['F','*'],ok:kClr}),
 Object.assign([[0,'フタバ、ごはん、ちゃんと食べたぁ？'],[1,'食べたよ！ ノドカこそ、畑ばっかりじゃだめだよ！'],[0,'あはは、ばれてるねぇ。']],{kc:['N','F']}),
 Object.assign([[0,'フタバの寝顔、かわいいよぉ。'],[1,'#surprise|えっ、見てたの！？'],[0,'ふふ、ひみつだよぉ。']],{kc:['N','F']}),
 Object.assign([[0,'@H、さっきの雨のとき、どこにいたのぉ？'],[1,'……屋根の下だ。雨は、にがてなんだよ。'],[0,'ふふ、ぼくは、ずぶぬれで、たのしかったよぉ。'],[1,'#think|……おまえは、平和でいいな。']],{kc:['N','H']}),
 Object.assign([[0,'@M、畑の土の水分、どうかなぁ。'],[1,'少し乾いていますね。夕方に、水を足しましょう。'],[0,'さすがだねぇ。たすかるよぉ。']],{kc:['N','M']}),
 Object.assign([[0,'@Kは、いつもおしゃれだねぇ。'],[1,'フッ……身だしなみは、風のたしなみさ。'],[0,'ぼくのほっぺ、どろがついてたら教えてねぇ。'],[1,'#think|……ついているよ、いま。'],[0,'あれぇ？']],{kc:['N','K']}),
 Object.assign([[0,'畑の土は、ふかふかが一番だよぉ。'],[1,'さわってもいい？'],[0,'いいよぉ。ほら、あったかいでしょぉ。']],{kc:['N','*']}),
 Object.assign([[0,'のんびりしてるって、よく言われるんだぁ。'],[1,'でも、ノドカの畑、いつもきれいだよ。'],[0,'#joy|ふふ、ありがとうねぇ。']],{kc:['N','*']}),
 Object.assign([[0,'#scared|ねぇ、夜はこわくないかなぁ？'],[1,'#scared|ちょっと、こわい……。'],[0,'だいじょうぶだよぉ。ぼくがとなりにいるからねぇ。']],{kc:['N','*']}),
 Object.assign([[0,'ヌシ様にねぇ、畑のやさい、食べてもらったんだぁ。'],[1,'なんて言ってた？'],[0,'#joy|「なつかしい味だ」って。……うれしくて、ちょっと泣いちゃったぁ。']],{kc:['N','*'],ok:kClr}),
 Object.assign([[0,'むかしから、この土地には、たくさんの子がいたんだってぇ。'],[1,'そうなの？'],[0,'土が、そう教えてくれるんだぁ。……またにぎやかになるといいねぇ。']],{kc:['N','*']}),
 Object.assign([[0,'フタバ、さいきん、たのもしくなったねぇ。'],[1,'#surprise|えっ、ほんと！？'],[0,'#joy|ほんとだよぉ。ぼくも、うれしいんだぁ。']],{kc:['N','F'],ok:kGuard}),
 Object.assign([[0,'おい、チビ。その頭の葉っぱで、ちゃんと前、見えてんのか。'],[1,'見えてるもん！ …わっ。'],[0,'ははっ。言ったそばから、つまずいてやがる。']],{kc:['H','F']}),
 Object.assign([[0,'おまえの葉っぱ、あったけえな。'],[1,'#surprise|えっ、そう？'],[0,'ああ。……悪くねえ。']],{kc:['H','F'],ok:kGuard}),
 Object.assign([[0,'のんびりしすぎだぜ、ノドカ。'],[1,'そうかなぁ。'],[0,'#think|……まあ、そのぐらいのほうが、村は落ちつくか。']],{kc:['H','N']}),
 Object.assign([[0,'#think|おい@M、おまえは考えすぎだ。'],[1,'#think|あなたは、考えなさすぎです。'],[0,'ははっ、ちげえねえ。'],[1,'#think|……ふふ。']],{kc:['H','M']}),
 Object.assign([[0,'@K、そのキザなしゃべり、疲れねえか？'],[1,'フッ……これが、ぼくの自然体さ。'],[0,'そうかよ。……まあ、きらいじゃねえ。']],{kc:['H','K']}),
 Object.assign([[0,'夜はおれにまかせとけ。ぐっすり寝ろ。'],[1,'#joy|うん。ありがとう。'],[0,'礼なんかいらねえよ。']],{kc:['H','*']}),
 Object.assign([[0,'おまえ、ひざ、すりむいてるじゃねえか。'],[1,'ころんじゃった。'],[0,'泣かなかったのか。……えらいな。']],{kc:['H','*']}),
 Object.assign([[0,'強くなりたいか？'],[1,'#nod|うん！'],[0,'ならまず、よく食って、よく寝ろ。それが一番だ。']],{kc:['H','*']}),
 Object.assign([[0,'火は、使い方しだいだ。あたためもすりゃ、焼きもする。'],[1,'むずかしいね。'],[0,'おまえも、いつか分かるさ。']],{kc:['H','*']}),
 Object.assign([[0,'#think|……なあ、フタバ。ひとりで抱えこむなよ。'],[1,'#surprise|えっ？'],[0,'つらいときは言え。おれは、ここにいる。']],{kc:['H','F'],ok:kE09}),
 Object.assign([[0,'フタバさん、水を運ぶときは、両手でゆっくりですよ。'],[1,'わかった！ ……あっ、こぼれた！'],[0,'#think|……今日も、順調ですね。']],{kc:['M','F']}),
 Object.assign([[0,'ノドカさんの畑は、水はけがとてもいいですね。'],[1,'土をふかふかにしてるからねぇ。'],[0,'参考になります。メモしておきます。']],{kc:['M','N']}),
 Object.assign([[0,'@Hさんは、いつも元気ですね。'],[1,'おうよ。おまえは、いつも冷静だな。'],[0,'ええ。……ですが、あなたの熱さには、ときどき助けられています。']],{kc:['M','H']}),
 Object.assign([[0,'@Kさん、空気がしめってきました。雨になりそうです。'],[1,'フッ……風もそう言っているよ。'],[0,'では、ほしたものは、早めに取りこみましょう。']],{kc:['M','K']}),
 Object.assign([[0,'水は、形を持ちません。入れものによって、姿が変わります。'],[1,'わたしたちみたいだね。'],[0,'#think|……いい表現ですね。']],{kc:['M','*']}),
 Object.assign([[0,'体調はいかがですか。顔色が少し白いです。'],[1,'ちょっと、ねむいかも。'],[0,'水をどうぞ。そして、早めにお休みください。']],{kc:['M','*']}),
 Object.assign([[0,'今朝の井戸の水位は、昨日より、指二本ぶん低いです。'],[1,'そんなこと、わかるの？'],[0,'毎朝、はかっていますから。']],{kc:['M','*']}),
 Object.assign([[0,'雨の日の水の音には、きまりがあります。'],[1,'きまり？'],[0,'ひとつぶごとに、わずかに音がちがうのです。……聞いてみますか。']],{kc:['M','*']}),
 Object.assign([[0,'フタバさん。先日、いっしょに水をくばった件ですが。'],[1,'ぜんぶの畑に水が行きわたらなかったやつ？'],[0,'ええ。あれから、畑の様子を、毎日見るようにしました。']],{kc:['M','F'],ok:kE18}),
 Object.assign([[0,'ノドカさん、数字で測れないものも、大事ですね。'],[1,'そうだねぇ。'],[0,'最近、それを学んでいます。']],{kc:['M','N'],ok:kE18}),
 Object.assign([[0,'フタバ、きみの笑い声は、よく風にのって聞こえてくるよ。'],[1,'#surprise|えっ、そんなに大きい？'],[0,'フッ……村じゅうに、元気をくばっているのさ。']],{kc:['K','F']}),
 Object.assign([[0,'ノドカ。きみのそばは、風が静かでいい。'],[1,'そうかなぁ。ぼくは、ただのんびりしてるだけだよぉ。'],[0,'それが、なによりのぜいたくさ。']],{kc:['K','N']}),
 Object.assign([[0,'@H。きみの炎は、風が吹くと、いっそう美しい。'],[1,'おだてても、何も出ねえぞ。'],[0,'フッ……事実を言っただけさ。']],{kc:['K','H']}),
 Object.assign([[0,'@M。きみの頭の中は、いつも整っているね。'],[1,'@Kさんの髪も、いつも整っていますね。'],[0,'フッ……これは、風まかせさ。']],{kc:['K','M']}),
 Object.assign([[0,'ぼくが来たとき、この村は少し素朴だと思ったよ。'],[1,'そうなの？'],[0,'でも、今は……悪くない。いや、すてきだ。']],{kc:['K','*']}),
 Object.assign([[0,'ぼくの髪がみだれていたら、それは、よくはたらいた、しるしさ。'],[1,'いまは、みだれてるよ？'],[0,'#think|……フッ。きょうは、がんばったのさ。']],{kc:['K','*']}),
 Object.assign([[0,'今日の風は、ミントの香りがするよ。'],[1,'すんすん……わかんない。'],[0,'フッ……そのうち、わかるようになるさ。']],{kc:['K','*']}),
 Object.assign([[0,'遠くの風の便りによるとね、どこかで、だれかが歌っているらしい。'],[1,'どんな歌？'],[0,'それは、風が教えてくれなかった。……残念だ。']],{kc:['K','*']}),
 Object.assign([[0,'フタバ。あまり遠くへ行くなよ。風が心配する。'],[1,'風が？'],[0,'#think|……いや、ぼくが、かな。'],[1,'#joy|えへへ、ありがとう！']],{kc:['K','F']}),
 Object.assign([[0,'ノドカ。きみと話すと、風の速さが、ゆっくりになる。'],[1,'それは、いいことなのかなぁ。'],[0,'ああ。とても。']],{kc:['K','N']}),/* ここから下は、おまつりの日だけの話（fest）。セーブに番号が入るので、うしろに足していく */
 Object.assign([[0,'#joy|ねえ、屋台、ぜんぶ見た？'],[1,'まだ！ どの屋台も、いいにおいがする。'],[0,'#joy|店番の子も、すごくたのしそうだったね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'りんごあめって、どこから食べればいいの？'],[1,'てっぺんから、かじるんだよ。'],[0,'#surprise|かたい！ はが、とれちゃいそう！'],[1,'…ぺろぺろするのが、いいかもね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'たこ焼き、あつあつだった！'],[1,'ふーふーした？'],[0,'#cry|しないで食べちゃった…。'],[1,'…お水、もってくるね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'焼きそばのにおいって、遠くまでとどくね。'],[1,'うん。においで、屋台の場所がわかっちゃう。'],[0,'#joy|はなが、道あんないしてくれるんだね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'ちょうちんの色、あったかいね。'],[1,'うん。見てるだけで、ほっとする。'],[0,'#nod|ずっと消えないでほしいな。']],{fest:1,ok:festOn}),
 Object.assign([[0,'おどりの輪に入るの、ちょっとはずかしい…。'],[1,'だいじょうぶ。前の子のまねをすればいいよ。'],[0,'#joy|…あ、たのしいかも！']],{fest:1,ok:festOn}),
 Object.assign([[0,'#joy|おどってたら、足がかってに動くの！'],[1,'わかる。音がなくても、おどれちゃうね。'],[0,'こころの中で、どん、どん、って鳴ってるんだよ。']],{fest:1,ok:festOn}),
 Object.assign([[0,'わなげ、やった？'],[1,'やった！ 三回とも、はずれた。'],[0,'#think|一回だけ、あたったよ。'],[1,'#surprise|すごい！ コツおしえて！']],{fest:1,ok:festOn}),
 Object.assign([[0,'おまつりの日は、いつもの村が、ぜんぜんちがって見えるね。'],[1,'うん。同じ道なのに、わくわくする。']],{fest:1,ok:festOn}),
 Object.assign([[0,'あしたも、おまつりならいいのに。'],[1,'まいにちだと、とくべつじゃなくなっちゃうよ。'],[0,'#think|…そっか。とくべつだから、たのしいんだね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'ねえ、なにを食べるか、まだきめられないの。'],[1,'ぜんぶ食べたら？'],[0,'#surprise|おなか、はれつしちゃうよ！']],{fest:1,ok:festOn}),
 Object.assign([[0,'店番の子、屋台のうらで、つまみぐいしてたよ。'],[1,'#surprise|えっ、ほんと？'],[0,'ないしょね。見なかったことにしよう。']],{fest:1,ok:festOn}),
 Object.assign([[0,'#joy|ねえ、みんなの顔、いつもより、にこにこしてる。'],[1,'きみもだよ。ずっと、わらってる。']],{fest:1,ok:festOn}),
 Object.assign([[0,'はぐれないように、手、つないでいこう。'],[1,'村の中だから、はぐれないよ？'],[0,'…いいの。つなぎたいの。'],[1,'#joy|…うん。']],{fest:1,ok:festOn}),
 Object.assign([[0,'りんごあめ、半分こしよう。'],[1,'どうやって、わるの？'],[0,'#think|……かわりばんこに、かじろっか。']],{fest:1,ok:festOn}),
 Object.assign([[0,'おまつりの日って、夕方になるのが、ちょっとさみしいね。'],[1,'でも、夜はちょうちんがきれいだよ。'],[0,'#nod|そうだね。夜もたのしみ。']],{fest:1,ok:festOn}),
 Object.assign([[0,'おどりの輪で、三回ぐるぐるしたら、目がまわった。'],[1,'#joy|ふらふらしてたの、見えてたよ。']],{fest:1,ok:festOn}),
 Object.assign([[0,'ねえ、おまつりのにおいって、なんのにおいだと思う？'],[1,'焼きそばと…ちょうちんと…みんなの、うれしいにおい？'],[0,'#joy|それだ！']],{fest:1,ok:festOn}),
 Object.assign([[0,'屋台のかき氷、つめたくて、頭がキーンってした。'],[1,'#joy|わかる！ でも、もう一回食べたくなるよね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'わなげの景品、なにがあった？'],[1,'小さな木の笛。ぴーって鳴るの。'],[0,'#surprise|ほしい！ もう一回ちょうせんしてくる！']],{fest:1,ok:festOn}),
 Object.assign([[0,'おどりって、だれが考えたのかな。'],[1,'ずっとむかしの、だれかだよ。きっと、みんなでたのしくなりたかったんだね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'ねえ、きょうは、はたらかなくていいの？'],[1,'おまつりだもん。カミサマも、いっぱい遊べって言ってたよ。'],[0,'#joy|やったー！']],{fest:1,ok:festOn}),
 Object.assign([[0,'#think|おまつりの夜も、コワイノは来るのかな。'],[1,'来たら、いっしょにおどってもらおうか。'],[0,'…それ、ちょっといいかも。']],{fest:1,ok:festOn}),
 Object.assign([[0,'ちょうちんの下に立つと、顔が赤く見えるね。'],[1,'#joy|きみも、りんごあめみたいな色になってる。']],{fest:1,ok:festOn}),
 Object.assign([[0,'たこ焼きって、たこが入ってるの？'],[1,'入ってるよ。'],[0,'#surprise|たこって、どこにいるの？'],[1,'…うみ、っていう、すごく大きな水たまりにいるんだって。']],{fest:1,ok:festOn}),
 Object.assign([[0,'焼きそばのソース、ほっぺについてるよ。'],[1,'#surprise|えっ、どこ！？'],[0,'…りょうほう。']],{fest:1,ok:festOn}),
 Object.assign([[0,'おまつりがおわったら、さみしくなるのかな。'],[1,'さみしくなったら、また、おまつりしよう。'],[0,'#nod|うん。やくそく。']],{fest:1,ok:festOn}),
 Object.assign([[0,'おどってたら、あんまり話したことない子とも、なかよくなれた！'],[1,'おどりの輪って、ふしぎだね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'きょうは、ちょっとだけ、夜ふかししてもいい日？'],[1,'ちょっとだけね。花火が、おわるまで。'],[0,'#joy|花火！ たのしみ！']],{fest:1,ok:festOn}),
 Object.assign([[0,'#joy|屋台で、おまけしてもらっちゃった！'],[1,'いいなあ。なにを？'],[0,'たこ焼き、ひとつぶんだけ。店番の子、やさしいね。']],{fest:1,ok:festOn}),
 Object.assign([[0,'#surprise|見て！ 空に、お花がさいた！'],[1,'花火だよ。どーんって、音がおなかにひびくね。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'たまやー！'],[1,'それ、なんて意味？'],[0,'#think|…わかんない。でも、言いたくなるの。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'花火って、すぐ消えちゃうね。'],[1,'うん。だから、ちゃんと見ておこうね。'],[0,'#nod|まばたき、がまんする。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'いまの花火、ハートの形じゃなかった？'],[1,'#surprise|え、見のがした！'],[0,'つぎは、いっしょに見よう。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'#scared|花火の音、ちょっとこわいけど…'],[1,'こわかったら、耳ふさいでていいよ。'],[0,'#joy|ううん、見たいから、がんばる。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'花火の色、ぜんぶ、ちがうね。'],[1,'あかいのは火の子の色、みどりのは草の色かな。'],[0,'#joy|じゃあ、みんなの色が、空にさいてるんだ。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'#sigh|花火がおわったら、おまつりもおわり？'],[1,'まだ、ちょうちんがあるよ。'],[0,'じゃあ、もうちょっとだけ、ここにいよう。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'カミサマも、どこかで、花火見てるかな。'],[1,'きっと、空を見上げてるよ。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'花火のけむりで、星がかくれちゃったね。'],[1,'あしたになれば、また見えるよ。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'またこんども、となりで花火見ようね。'],[1,'#nod|うん。いちばん見えるところ、とっておくね。']],{fest:1,ok:()=>festOn()&&hour()>=20}),
 Object.assign([[0,'店番って、たのしいね！'],[1,'お客さんが来ると、うれしくなるよね。'],[0,'#joy|「おいしい」って言われると、もっとうれしい！']],{fest:1,ok:festOn}),
 Object.assign([[0,'つぎの店番、だれだっけ？'],[1,'#think|……あ、こっちの番だ！ いってくるね！']],{fest:1,ok:festOn})];
/* せいれい同士のおしゃべり：話す子の属性に合わせて、口調をととのえる（話の中身は変えない） */
function chatTone(tx,r,i){if(!r)return tx;const k=elemKey(r),pr=r.elem==='fire'?(k==='fireB'?'おれ':r.name===HOMURA?'あたい':'あたし'):r.elem==='water'?'わたし':'ぼく';
  if(tx.replace(LOOKRX,'').length>60)return tx;let t=tx.replace(/ぼく|わたし/g,pr);if(r.elem==='fire'&&pr!=='あたい')t=t.replace(/あたい/g,pr);/* 「あたい」はホムラだけ */
  const ends=(m)=>{for(const[a,b]of m)t=t.split(a).join(b)};
  const rx=(m)=>{for(const[a,b]of m)t=t.replace(a,b)};
  if(r.elem==='earth'){ends([['よ。','よぉ。'],['よ！','よぉ！'],['かな。','かなぁ。'],['かな？','かなぁ？'],['くない？','くないのぉ？'],['てない？','てないのぉ？'],['じゃない？','じゃないのぉ？'],['できない？','できないのぉ？']]);rx([[/ね([。！])/g,'ねぇ$1']])}/* 「しない？」（さそい）は「しないのぉ？」にしない */
  else if(r.elem==='water'){t=t.replace(/わたしら/g,'わたしたち');ends([['だよ。','ですよ。'],['だよ！','ですよ。'],['だね。','ですね。'],['だね！','ですね。'],['のかな。','のでしょうか。'],['のかな？','のでしょうか？'],['るかな。','るでしょうか。'],['わかる！ ','わかります。'],['わかる！','わかります。'],['すごい！ ','すごいですね。'],['すごい！','すごいですね。'],['ある？','ありますか？']])}/* 「こわいかな」「音かな」など、じぶんのことの「かな」はそのまま */
  else if(r.elem==='wind'){ends([['んだよ。','のさ。'],['んだよ！','のさ！'],['からだよ。','からさ。'],['いいよ。','いいさ。'],['いいよ！','いいさ！'],['ないよ。','ないさ。'],['すごい！','見事だね！'],['ほんと？','ほう？']]);rx([[/([^さ])だよ([。！])/g,'$1さ$2'],[/([^て])るよ。/g,'$1るさ。']])}/* 「さ」は、言いきる文だけ（「〜たよ」「〜しようよ」「気になるよ！」「〜てるよ」はそのまま） */
  else if(r.elem==='fire'){const com=[['えへへ','へへっ'],['ふふ、','へっ、'],['あはは','はは'],['もー！','ったく！'],['わあ、','おっ、'],['ねえねえ','なあなあ'],['ねえ、','なあ、'],['えー！','えぇ！'],['ふうん','ふーん'],['ありがとう。','ありがとな。'],['ありがとう！','ありがとな！'],['ごめん','わりぃ'],['しようよ','しようぜ'],['ちゃった','ちまった'],['でしょ','だろ'],['じゃない？','じゃないか？'],['わかる！','わかるさ！'],['すごい！','やるじゃないか！']];
    ends(com);if(k==='fireB'){if(/なに|なん|だれ|いつ|どう|どこ/.test(t))ends([['るの？','るんだ？'],['たの？','たんだ？'],['うの？','うんだ？']]);ends([['くるね。','くるからな。'],['するね。','するぜ。'],['言うね。','言うじゃねえか。']])}/* 「〜するな」が「するな（だめ）」に聞こえないように */
    if(k==='fireB')ends([['じゃないか？','じゃねえか？'],['わかるさ！','わかるぜ！'],['やるじゃないか！','やるな！'],['かなあ。','かな。'],['かなぁ。','かな。'],['よね','よな'],['ね。','な。'],['ね！','な！'],['ね？','な？'],['だよ。','だぜ。'],['だよ！','だぜ！'],['もん。','からな。'],['の？','のか？'],['あたいたち','おれたち']]);
    else ends([['だもん。','だからさ。'],['もん。','からさ。'],['の？','のかい？'],['あたいたち','あたいら']])}
  {const fl={earth:'うーんとねぇ…',water:'そうですね……',wind:'そうだね……',fire:k==='fireB'?'そうだな、':'まあ、'}[r.elem];if(fl)t=t.replace(/^うーん…/,fl)}/* 口ぐせは属性ごとに */
  if(r.elem==='wind'&&i%3===1&&t.length>=14&&!/^(フッ|そう|えっ|ええ|うん|あ|わ|へえ|ほう|ねえ|好き|いい|見た|…|#)/.test(t)&&!/[！？…]|ちゃ|ないで|の。$/.test(t)&&/[。]$/.test(t))t='フッ…'+t;/* 気どった「フッ…」は、おちついた文だけ（気もちのタグ・！・？・…・あまえた言いかたの文にはつけない） */
  return t}
function chatTopic(r,p){const L=[],mt=((r.mates||{})[p.id]||0)>=6;CHATS.forEach((c,i)=>{if((!c.el||c.el===r.elem)&&(!c.ok||c.ok())&&(!c.key||isKey(r.name)&&isKey(p.name))&&(!c.mate||mt)&&(!c.kc||kcOK(c,r,p)))L.push(i)});/* なかよし同士だと、なかよしの話もまざる *//* 話しかけた子の属性のお話もまざる */
  if(festOn()){const F=L.filter(i=>CHATS[i].fest);if(F.length)L.splice(0,L.length,...F)}/* おまつりの日は、おまつりの話だけ */
  const R=S.chatRec||(S.chatRec=[]),last=i=>R.lastIndexOf(i),lo=Math.min(...L.map(last));let C=L.filter(i=>last(i)===lo);/* だれとだれの会話でも、まだしていない話（なければ、いちばん前にした話）からえらぶ。ひととおりするまで、同じ話はしない */
  if(C.some(i=>CHATS[i].kc)&&Math.random()<.4)C=C.filter(i=>CHATS[i].kc);/* キーキャラの話は、まだしていなければ4割で選ばれる */
  const t=C[Math.floor(Math.random()*C.length)];for(let o;(o=R.indexOf(t))>=0;)R.splice(o,1);R.push(t);return t}
/* 「手、ふっとこうか」：このあと手をふる */
function trySocial(r,G){const sb=socialBest(r,G);if(!sb)return false;const best=sb.b;const o=S.res.find(q=>q.id===best.o.partner);if(!o)return false;endAct(o);o.act={type:'chatwait',stage:'do',t:0,partner:r.id};o.bubble='👋';startAct(r,G,'chat',best.stand,best.o);return true}
const NIGATE={fire:{fountain:30},wood:{campfire:17},water:{campfire:17},earth:{swing:27},wind:{sandbox:20}};/* 属性ごとの、すこしにがてなおもちゃ：ほかより少しえらばれにくい。数字は、遊んだときのたのしさ（ふつうは BL の play.fun） */
const FAVTOY={earth:['sandbox'],wood:['swing'],water:['fountain'],fire:['campfire'],wind:['slide','seesaw']};/* 属性ごとに、よく遊ぶおもちゃ（ほかの子より選ばれやすい） */
function goPlay(r,G,strict){
  let best=null,bs=-1e9;
  for(let j=0;j<W*H;j++){const d=G.dist[j];if(d<0||d>45)continue;const o=S.obj[j];
    if(o==='swing'&&free('o'+j,BL[o].play.cap)&&!toyTired(r,j)){/* 花では遊ばない */const p=BL[o].play;const ng=(NIGATE[r.elem]||{})[o],s=p.pt*3+(r.like===o?6:0)+((FAVTOY[r.elem]||[]).includes(o)?7:0)-(ng!=null?6:0)-d*.3+Math.random()*2;if(s>bs){bs=s;best={type:'play',stand:j,o:{key:'o'+j,obj:j,what:o,fun:ng!=null?ng:p.fun,dur:p.dur,pt:p.pt,pw:p.pw,nig:ng!=null}}}}
    const fk0=adjOf(j,k=>{const t=typeAt(k),p=t&&BL[t]&&BL[t].play;return !!(p&&p.adj&&free('o'+anc(k),p.cap)&&!toyTired(r,anc(k)))}),fk=fk0>=0?anc(fk0):-1;
    if(fk>=0){const w=S.obj[fk],p=BL[w].play;const ng=(NIGATE[r.elem]||{})[w],s=p.pt*3+(r.like===w?6:0)+((FAVTOY[r.elem]||[]).includes(w)?7:0)-(ng!=null?6:0)-d*.3+Math.random()*2;if(s>bs){bs=s;best={type:'play',stand:j,o:{key:'o'+fk,obj:fk,what:w,fun:ng!=null?ng:p.fun,dur:p.dur,pt:p.pt,pw:p.pw,nig:ng!=null}}}}
    if(canJob(r,'fish')&&roomN(r)>0&&S.ground[j]!==1&&fishW(j)>=0&&free('f'+j,1)){const sp=fSpot(j),s=9+(sp?12:0)+(r.like==='fish'?6:0)+(r.elem==='water'?9:0)-d*.3+Math.random()*2;if(s>bs){bs=s;best={type:'fish',stand:j,o:{key:'f'+j,spot:sp}}}}
  }
  {const sb=socialBest(r,G);if(sb&&sb.s>bs){bs=sb.s;best=sb.b}}
  if(!best)return strict?false:goWander(r,G);
  if(best.type==='chat'){const o=S.res.find(q=>q.id===best.o.partner);if(o){endAct(o);o.act={type:'chatwait',stage:'do',t:0,partner:r.id};o.bubble='👋'}}
  startAct(r,G,best.type,best.stand,best.o);return true
}
const SPEC={wood:['plant','tend'],water:['water'],fire:['cook'],earth:['repair','till'],wind:['drop','weed','seed']};/* 風の子は、落ちている物・きのこ・雑草・枝を先にひろう *//* 属性ごとの得意な仕事：建てる・家具づくりのつぎに、ほかの仕事より先にする */
/* 得意な仕事は、その属性の子だけ。建てるのはみんなできる */
const OWN={plant:'wood',tend:'wood',water:'water',fish:'water',till:'earth',repair:'earth',cook:'fire',seed:'wind'};
function ownOK(r,el){return !el||r.elem===el}
function canJob(r,k){if(k==='seed')return r.elem==='wind';/* 外にふしぎな種があれば、風の子はみんな拾いに行く */return ownOK(r,OWN[k])}
const makerOf=id=>WD===1&&(id==='bench'||id==='noren')||id==='stor'||id==='mbox'?null:BL[id].maker;/* 箱は、だれでも作れる *//* 火山のふもと：温泉のクエストに使うベンチ・のれんは、だれでも作れる */
function craftOK(r,o){return ownOK(r,makerOf(o.type))}
function tryJob(r,G,k){
  if(!canJob(r,k))return false;
  let j;
  switch(k){
  case'repair':{if(isNight())return false;const dmg=q=>(breakable(S.obj[q])&&(S.hp[q]??BL[S.obj[q]].hp)<BL[S.obj[q]].hp||DEFS.has(S.obj[q])&&S.hp[q]!=null||burnt(q)||(bk=>!!bk&&canRebuild(bk.j)&&free('o'+bk.j,1))(brokenCover(q)))&&free('o'+(brokenCover(q)?brokenCover(q).j:q),1);j=nearest(G,j=>!brokenCover(j)&&adjOf(j,dmg)>=0);/* こわれた場所の中ではなく、外から直す */if(j>=0){const q0=adjOf(j,dmg),bk=brokenCover(q0),q=bk?bk.j:q0;startAct(r,G,'repair',j,{key:'o'+q,obj:q});return true}return false}
  case'till':j=nearest(G,j=>S.obj[j]==='plot'&&free('o'+j,1));if(j>=0){startAct(r,G,'till',j,{key:'o'+j,obj:j});return true}return false;
  case'sow':j=nearest(G,j=>S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].sown===false&&(S.dyn[j].paid||cseed(cropK(S.dyn[j]))>0)&&free('o'+j,1));if(j>=0){startAct(r,G,'sow',j,{key:'o'+j,obj:j});return true}return false;
  case'plant':{j=nearest(G,j=>S.obj[j]==='sprout'&&free('o'+j,1));if(j>=0){startAct(r,G,'plant',j,{key:'o'+j,obj:j});return true}const wq=q=>S.obj[q]==='sprout'&&S.ground[q]===1&&free('o'+q,1);j=nearest(G,j=>adjOf(j,wq)>=0);if(j>=0){const q=adjOf(j,wq);startAct(r,G,'plant',j,{key:'o'+q,obj:q});return true}
    for(let q=0;q<W*H;q++){if(!wq(q))continue;const prev=new Int32Array(W*H).fill(-2),Q=[q];prev[q]=-1;let w=-1,sh=-1;/* 岸からとどかないハス：水の中を歩いて植える */
      for(let h=0;h<Q.length&&w<0;h++){const i=Q[h],x=i%W,y=(i/W)|0;for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(S.ground[k]!==1&&walk(k)&&G.dist[k]>=0&&i!==q){w=i;sh=k;break}if(S.ground[k]===1&&!solidOf(k)&&prev[k]===-2){prev[k]=i;Q.push(k)}}}
      if(w<0)continue;const p=[];for(let k=w;k>=0&&k!==q;k=prev[k])p.push(k);startAct(r,G,'plant',sh,{key:'o'+q,obj:q,wade:p});return true}
    return false}/* ハスは岸から植える */
  case'build':{const st=q=>{const a=anc(q);return S.obj[a]==='site'&&free('o'+a,2)};j=nearest(G,j=>adjOf(j,st)>=0);if(j>=0){const q=anc(adjOf(j,st));startAct(r,G,'build',j,{key:'o'+q,obj:q});return true}return false}
  case'water':j=nearest(G,j=>S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].sown!==false&&S.dyn[j].wet<=0&&S.dyn[j].g<100&&!NEARWELL.has(j)&&free('w'+j,1));if(j>=0){startAct(r,G,'water',j,{key:'w'+j,obj:j});return true}return false;
  case'tend':j=nearest(G,j=>S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].sown!==false&&S.dyn[j].g<100&&S.dyn[j].wet<=0&&!NEARWELL.has(j)&&free('w'+j,1));if(j>=0){startAct(r,G,'tend',j,{key:'w'+j,obj:j});return true}return false;
  case'craft':{const o=S.orders.find(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q));if(!o)return false;o.worker=r.id;const sp=craftSpot(G);startAct(r,G,'craft',sp>=0?sp:nearTile(G,BOARD),sp>=0?{order:o.id,key:'cs'+sp}:{order:o.id});return true}
  case'chop':case'mine':{if(k==='mine'&&WD===1&&!isNight()){const bq=q=>S.obj[q]==='boulder'&&free('o'+q,1);const bj=nearest(G,j=>adjOf(j,bq)>=0,90);if(bj>=0){const q=adjOf(bj,bq);startAct(r,G,'mine',bj,{key:'o'+q,obj:q});return true}}/* 大岩を先にくだく */
    if(isNight()||!(matCap()>0)||roomN(r)<1||matTot()+matN(r)>=matCap())return false;/* 素材箱に1つでも空きがあれば集めにいく（ぴったり満杯までためられる） */const camp=k==='chop'?'lumber':'quarry',nat=k==='chop'?(WD===1?((S.mat.bamboo||0)<(S.mat.wood||0)?[['bamboo'],['ntree','deadtree']]:[['ntree','deadtree'],['bamboo']]):[['ntree','deadtree']]):[['rock']];/* 火山：木材と竹の、すくないほうを先に切る */
    const cp=q=>typeAt(q)===camp&&free('o'+anc(q),2);j=nearest(G,j=>adjOf(j,cp)>=0,60);if(j>=0){const q=anc(adjOf(j,cp));startAct(r,G,k,j,{key:'o'+q,obj:q,camp:true});return true}
    for(const ns of nat){const nt=q=>ns.includes(S.obj[q])&&free('o'+q,1);j=nearest(G,j=>adjOf(j,nt)>=0,40);if(j>=0){const q=adjOf(j,nt);startAct(r,G,k,j,{key:'o'+q,obj:q});return true}}return false}
  case'cook':{if(!cnt('oven')||!(foodCap()>0)||isNight())return false;const rs=RECIPES.filter(R=>Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]));if(!rs.length)return false;
    if(!S.ovenSet)S.ovenSet={};const ok=q=>{const o=S.ovenSet[q];return o&&rs.some(R=>R.out===o)};/* かまどで、守り神さまがえらんだ料理だけ作る */
    const ov=q=>S.obj[q]==='oven'&&ok(q)&&!ashed(q)&&free('o'+q,1)&&!S.res.some(x=>x.cing&&x.cing.ov===q);j=nearest(G,j=>adjOf(j,ov)>=0,80);if(j<0)return false;const q=adjOf(j,ov),R=RECIPES.find(x=>x.out===S.ovenSet[q]);
    const sj=nearestVia(G,bfs(j%W,(j/W)|0),j=>adjOf(j,k=>storageAt(k,'food'))>=0,80);if(sj<0)return false;/* 材料は、かまどまでの道のりがいちばん短くなる食料箱からとる */
    startAct(r,G,'cgrab',sj,{rec:R.out,ov:q});return true}
  case'harvest':{if(!(foodCap()>0&&S.food<foodCap()))return false;const fRoom=foodCap()-S.food-carryN(r);j=nearest(G,j=>{if(S.obj[j]!=='farm'||!S.dyn[j]||S.dyn[j].g<100||!free('o'+j,1)||roomN(r)<1)return false;const c=CROPS[cropK(S.dyn[j])];return fRoom>=(c?c.yield:2)+(NEARMILL.has(j)?1:0)+(NEARFLOWER.has(j)?1:0)+(trt(r,'shukaku')?1:0)+(S.today==='hosaku'?1:0)+(r.elem==='wood'?1:0)});/* 食料箱に入りきらないときは収穫しない（持っている物を捨てない）。木の子は+1ぶんも見る */if(j>=0){startAct(r,G,'harvest',j,{key:'o'+j,obj:j,food:1});return true}
    const fr=ripeAdj(['fruit']);j=roomN(r)>=1&&fRoom>=2?nearest(G,j=>fr(j)>=0):-1;if(j>=0){const q=fr(j);startAct(r,G,'harvest',j,{key:'o'+q,obj:q,food:1});return true}return false}
  case'offer':{if(OBOX<0||isNight()||r.fun<99||r.offDay===dayNo())return false;/* おそなえは1人1日1回まで *//* たのしさが満タンになったら、おそなえする */j=nearTile(G,OBOX);if(j>=0){startAct(r,G,'offer',j);return true}return false}
  case'gather':{if(S.food>=(r.elem==='earth'?25:12)||isNight()||roomN(r)<1)return false;const bb=ripeAdj(['berry','takenoko']);j=nearest(G,j=>bb(j)>=0);if(j>=0){const q=bb(j);startAct(r,G,'gather',j,{key:'o'+q,obj:q});return true}return false}
  case'drop':if(!(S.drops&&S.drops.length)||isNight())return false;const noF=!S.res.some(x=>x.name===POKO&&!x.hidden);j=nearest(G,j=>S.drops.some(q=>q.y*W+q.x===j&&(q.id==='shard'||q.lt||q.tap||Math.hypot(q.x+.5-r.x,q.y+.5-r.y)<=(r.elem==='wind'?10:5))/* 落ちている物は、まわり5マス（風の子は10マス）に来て見つけたときにひろう（ヌシのかけらと、守り神の光でこわした物はべつ：どこでも、木を切る・石をほるより先にひろいに行く） */&&(q.id!=='shard'||r.name===POKO||noF)&&!(q.id.startsWith('food:')&&foodCap()-S.food<=0)&&!(q.id.startsWith('mat:')&&matCap()-matTot()<=0)&&!((q.id.startsWith('food:')||q.id.startsWith('mat:'))&&roomN(r)<1))&&free('d'+j,1),S.drops.some(q=>q.tap||q.lt)?9999:90);/* 食料箱がいっぱいのときは、食料のおとしものはひろわない */if(j>=0){startAct(r,G,'pickdrop',j,{key:'d'+j,obj:j});return true}return false;
  case'otaki':{if(isNight()||STATUE<0)return false;if(r.otaki){j=nearest(G,j=>adjOf(j,k=>k===STATUE||k===STATUE+W)>=0,300);if(j>=0){startAct(r,G,'otaki',j,{});return true}return false}
    if(!S.otakiQ||!Object.keys(S.otakiQ).length||S.res.some(q=>q!==r&&q.act&&q.act.type==='otakiget'))return false;j=nearest(G,j=>adjOf(j,k=>storageAt(k,'mat'))>=0,200);if(j>=0){startAct(r,G,'otakiget',j,{});return true}return false}/* おたきあげ：素材箱から素材をとって、神殿へ */
  case'weed':{if(isNight()||matTot()+matN(r)>=matCap()||roomN(r)<1)return false;{const RQ=wreqList();j=RQ.length?nearest(G,j=>RQ.includes(j)&&free('o'+j,1),9999):-1}if(j<0)j=nearest(G,j=>WEEDS.has(S.obj[j])&&free('o'+j,1),WEEDNEAR||(r.elem==='wind'?120:60));/* 「みる」でタップした草は、遠くてもさきに */if(j>=0){startAct(r,G,'weed',j,{key:'o'+j,obj:j});return true}return false}
      case'seed':if(!S.seeds.length||isNight())return false;j=nearest(G,j=>S.seeds.some(q=>q.y*W+q.x===j)&&free('s'+j,1),90);if(j>=0){startAct(r,G,'pickseed',j,{key:'s'+j,obj:j});return true}return false;
  }
  return false;
}
const JOBCAT=[['build','repair'],['craft'],['drop','harvest','water','tend','till','sow','plant'],['cook','chop','mine','seed','offer','gather','weed']];
const ALLJOB=['harvest','sow','offer','gather'],FARMJ=['harvest','water','tend','till','sow'];/* 畑の世話 */
const IDLE_ACTS=['fish','play','wander','idle'];
// 種まき・植える・依頼・建築があるか（いつもの作業を中断してでも向かう仕事）
function hasHighWork(r){
  if(!isNight()&&!(r.act&&(r.act.type==='pickdrop'||FARMJ.includes(r.act.type)))&&((S.drops||[]).some(q=>(q.lt||q.tap)&&free('d'+(q.y*W+q.x),1))||!(r.act&&r.act.type==='weed')&&wreqList().some(k=>free('o'+k,1)))&&matCap()-matTot()>0)return true;/* 「みる」でタップした草・落とし物も同じ *//* 守り神がこわした物があれば、いまの作業をやめてひろいに行く（畑の世話をしているときは、やめない） */
  if(S.food<6&&foodCap()>0&&!(r.act&&(r.act.type==='gather'||r.act.type==='harvest'))){const bb=ripeAdj(['berry']);if(S.obj.some((o,j)=>(o==='farm'&&S.dyn[j]&&S.dyn[j].g>=100&&free('o'+j,1))||((o==='berry'||o==='takenoko')&&S.dyn[j]&&S.dyn[j].g>=100&&free('o'+j,1))))return true}
  if(canJob(r,'build')&&S.obj.some((o,j)=>o==='site'&&free('o'+j,2)))return true;
  if(!isNight()&&canJob(r,'repair')&&S.obj.some((o,q)=>o&&BL[o]&&(breakable(o)&&(S.hp[q]??BL[o].hp)<BL[o].hp||DEFS.has(o)&&S.hp[q]!=null||burnt(q))&&free('o'+q,1)||!o&&canRebuild(q)))return true;/* こわれた所があれば、木を切るより先に直す */
  if(S.orders.some(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q)))return true;
  for(const k in S.dyn){const j=+k,o=S.obj[j],d=S.dyn[k];
    if(o==='farm'&&d&&d.sown===false&&(d.paid||cseed(cropK(d))>0)&&free('o'+j,1))return true;
    if(o==='sprout'&&canJob(r,'plant')&&free('o'+j,1))return true}
  return false}
const ROUTINE=['chop','mine','gather'];
const URGNO=['phew','sevreact','questjoy','nmeet','step','shiver','reunion','bury','pray','build','craft','repair','eat','sleep','flee','faint','cook','store','smat','fetch','cgrab','chat','chatwait','npl','tag','offer','pickdrop','pickseed','bathe','rest'];/* 水浴びやベンチの休けいは、とちゅうでやめない */
function hasUrgent(r){/* 建てる場所か、だれも受けていない依頼があるか */
  if(canJob(r,'build')&&S.obj.some((o,j)=>o==='site'&&free('o'+j,2)))return true;
  return S.orders.some(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q))}
function hasWork(r){
  if(!isNight()&&STATUE>=0&&(r.otaki||S.otakiQ&&Object.keys(S.otakiQ).length))return true;
  if(!isNight()&&S.drops&&S.drops.length&&S.drops.some(q=>(q.id==='shard'||Math.hypot(q.x+.5-r.x,q.y+.5-r.y)<=(r.elem==='wind'?10:5))&&(q.id!=='shard'||r.name===POKO||!S.res.some(x=>x.name===POKO&&!x.hidden))&&walk(q.y*W+q.x)&&free('d'+(q.y*W+q.x),1)))return true;
  if(canJob(r,'build')&&S.obj.some((o,j)=>o==='site'&&free('o'+j,2)))return true;
  if(S.orders.some(q=>(!q.worker||!S.res.some(x=>x.id===q.worker))&&craftOK(r,q)))return true;
  const room=foodCap()>0&&S.food<foodCap();
  for(const k in S.dyn){const j=+k,o=S.obj[j],d=S.dyn[k];if(o==='farm'&&d){if(room&&d.g>=100&&free('o'+j,1))return true;if(d.sown===false&&(d.paid||cseed(cropK(d))>0)&&free('o'+j,1))return true;if(d.sown!==false&&d.wet<=0&&d.g<100&&!NEARWELL.has(j)&&free('w'+j,1)&&(canJob(r,'water')||canJob(r,'tend')))return true}
    if((o==='plot'&&canJob(r,'till')||o==='sprout'&&canJob(r,'plant'))&&free('o'+j,1))return true}
  return false}
/* おつげ：守り神さまからの、きょういちにちの指示 */
const toyTired=(r,j)=>!!(r.lastToy&&r.lastToy.j===j&&S.t-r.lastToy.t<240);/* 同じ遊び家具には4時間行かない */
const ORACLE={play:{name:'いっぱいあそぶ',e:'🎈',jobs:[],water:1},wood:{name:'木をあつめる',e:'🪵',jobs:['chop']},stone:{name:'石をあつめる',e:'🪨',jobs:['mine']},food:{name:'食料をあつめる',e:'🍎',jobs:['harvest','gather','fish']}};
const oracleOK=k=>!ORACLE[k].water||!!(S&&S.flags&&S.flags.oracleWater);/* はじめにえらべるおつげは、木・石・食料だけ。ほかは水のステージでおぼえる（S.flags.oracleWater） */
function goWork(r,G,nw){
  // 木材と石材は、少ないほうから集める（どちらかが得意なら両方やる）
  const mo=(S.mat.stone||0)<=(S.mat.wood||0)?['mine','chop']:['chop','mine'];let gd=false;
  // おつげがあれば、それを先にする
  if(S.oracle==='play'&&r.fun<98&&goPlay(r,G,true))return true;
  // 食料がゼロなら、まず食べ物を集める
  if(S.food<6&&foodCap()>0)for(const k of['harvest','gather'])if(tryJob(r,G,k))return true;/* 食料が6より少なくなったら、ほかの仕事より先に食べ物をあつめる */
  // 花や木の苗は、空腹などの急ぎの用事を除いて、ほかの仕事より先に植える
  if(tryJob(r,G,'plant'))return true;
  if(tryJob(r,G,'otaki'))return true;
  if((S.drops||[]).some(q=>q.lt||q.tap)||wreqList().length){for(const k of FARMJ)if(tryJob(r,G,k))return true;if(tryJob(r,G,'drop'))return true;if(wreqList().length&&tryJob(r,G,'weed'))return true}/* 「みる」でタップした草・きのこ・落とし物も、ここでとりにいく *//* 守り神の光でこわした物（落ちた木材・石材）は、おつげ・木を切る・石をほるより先にひろう。畑の世話よりはあと */
  if(S.oracle&&ORACLE[S.oracle])for(const k of ORACLE[S.oracle].jobs)if(tryJob(r,G,k))return true;
  // 建てる・家具づくりがいちばん先。そのつぎに得意な仕事をする
  for(const k of['build','craft',...(SPEC[r.elem]||[])])if(tryJob(r,G,k))return true;
  for(const cat of JOBCAT)for(const k of cat){
    if(k==='chop'||k==='mine'){if(gd)continue;gd=true;if(Math.random()<.35){WEEDNEAR=15;const ok=tryJob(r,G,'weed');WEEDNEAR=0;if(ok)return true}/* 木を切る・石をほるかわりに、35%で、15マス以内の雑草・きのこをむしる */for(const m of mo)if(tryJob(r,G,m))return true;continue}
    if(tryJob(r,G,k))return true}
  if(nw)return false;goWander(r,G);return true;
}
/* 依頼ボードの作業場所：ボードの手前（下の列）にならぶ。ボードより手前なので、のこぎりがボードにかくれない */
function craftSpot(G){if(BOARD<0)return -1;for(const d of[2*W+1,2*W+2,W+2,3*W+1,3*W+2,2*W+3,W+3,3*W]){const j=BOARD+d;/* 依頼ボードのすぐ前はあけて、少しはなれて作業する */if(j<0||j>=W*H||G.dist[j]<0||!walk(j)||S.obj[j]&&!(BL[S.obj[j]]&&BL[S.obj[j]].floor)||!free('cs'+j,1))continue;return j}/* きまった場所がふさがっていたら、ボードから1マスはなれたまわり（2〜4マス）で、いちばん近い場所 */let best=-1,bd=1e9;const bx=BOARD%W,by=(BOARD/W)|0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const m=Math.max(Math.abs(dx),Math.abs(dy));if(m<2)continue;const x=bx+dx,y=by+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(G.dist[j]<0||!walk(j)||S.obj[j]&&!(BL[S.obj[j]]&&BL[S.obj[j]].floor)||!free('cs'+j,1))continue;const d=G.dist[j]+m*.5;if(d<bd){bd=d;best=j}}return best}
function nearTile(G,t){return t<0?-1:nearest(G,j=>adjOf(j,k=>k===t)>=0,80)}
const OFFER={/* [もの,数,レベル] 属性とレベルで中身がかわる。レベルが3上がるごとに数+1 */wood:[['tree',1,1],['seed:*',2,1],['floor',2,1],['clover',2,3],['fruit',1,6]],water:[['farm',1,1],['path',2,1],['seed:*',2,1],['lily',1,3],['lotus',1,5]],earth:[['path',3,1],['stone',2,1],['seed:*',2,1],['gravel',3,3],['brick',2,5],['wall',2,7]],fire:[['path',2,1],['stone',1,1],['brick',2,3],['bellf',1,4],['wall',2,6]],wind:[['tree',1,1],['path',2,1],['salvia',1,3],['fence',3,4],['gate',1,6]]};
function offerFor(r){const lv=rLv(r),opts=OFFER[r.elem].filter(o=>lv>=o[2]&&(o[0].startsWith('seed:')?cnt('farm')>0:BL[o[0]].kind==='plant'?S.feat.plant&&plantOK(o[0]):S.unlocked[o[0]]));if(!opts.length)return null;const hi=opts.filter(o=>o[2]>1),o=(hi.length&&Math.random()<.5?pick(hi):pick(opts)).slice(0,2);o[1]+=o[0]==='seed:*'?(Math.random()<SEEDPL[lv]?1:0)-1:OFFERPL[lv];/* たねは1こ。その子のレベルが1上がるごとに、+1こになる確率が50%ずつ上がる（Lv3で必ず+1） *//* レベルが高いほど、上の段のものが出やすい */if(o[0]==='seed:*'){/* たねは、持っている数が少ない作物を優先 */const ks=Object.keys(CROPS).filter(cropOn),mn=Math.min(...ks.map(cseed)),c=ks.filter(k=>cseed(k)===mn);o[0]='seed:'+pick(c)}return o}
/* おもちゃで遊ぶと、そのおもちゃのステータスがのびる */
const TRAIN={slide:['spd','移動速度'],seesaw:['pow','作業スピード'],sandbox:['sta','スタミナ'],swing:['spd','移動速度'],campfire:['pow','作業スピード'],fountain:['sta','スタミナ']};
function train(r,what){const t=TRAIN[what];if(!t||!r.vr)return;const v=r.vr[t[0]]||1;if(v>=1.6||Math.random()>=.1)return;r.vr[t[0]]=Math.round(Math.min(1.6,v+.1)*100)/100;RSC.delete(r);addFloat(r.x,r.y-1.6,t[1]+'+1','#9fe8ff')}/* 遊ぶと、たまに能力が1ふえる */
function goBathe(r,G){const hs=WD===1&&springN()>0;if(r.elem==='fire'&&!hs){r.bathD=dayNo();return false}/* 火の子は温泉でしか水浴びしない */const tubOf=j=>adjOf(j,k=>typeAt(k)==='bathtub'&&free('b'+anc(k),1)),ok=j=>S.ground[j]!==1&&!S.obj[j]&&(adjOf(j,k=>hs?hotW(k):S.ground[k]===1)>=0&&free('b'+j,1)||r.elem!=='fire'&&tubOf(j)>=0),ms=S.res.filter(q=>q!==r&&q.act&&q.act.type==='bathe'&&q.act.stand!=null);let j=ms.length?nearest(G,j=>ok(j)&&ms.some(q=>Math.abs(j%W-q.act.stand%W)+Math.abs(((j/W)|0)-((q.act.stand/W)|0))<=3),70):-1;/* だれかが水浴びしていたら、そのそばへ */if(j<0)j=nearest(G,ok,70);if(j<0){r.bathD=dayNo();return false}const tk=adjOf(j,k=>hs?hotW(k):S.ground[k]===1)>=0&&free('b'+j,1)?-1:tubOf(j);if(tk>=0){const ta=anc(tk);startAct(r,G,'bathe',j,{key:'b'+ta,stand:j,tub:ta});return true}/* 水べがなくても、バスタブがあれば、そこで水浴び */startAct(r,G,'bathe',j,{key:'b'+j,stand:j});return true}
function goWander(r,G){
  if(r.cmat&&matCap()>0){const j=nearest(G,j=>adjOf(j,k=>storageAt(k,'mat'))>=0,200);if(j>=0)return startAct(r,G,'smat',j);return startAct(r,G,'idle',-1,{dur:15})}/* 荷物を持ったままお散歩しない（先に素材箱へ） */
  if(carryN(r)>0&&foodCap()>0)return goStore(r,G);
  const fw=isWatch(r)&&S.enemyOn;if(isNight()&&!fw)return goSleep(r,G,S.enemies.some(e=>e.spawned));/* 夜はお散歩しないで休む */
  if((r.wanderRestUntil||0)>S.t)return startAct(r,G,'idle',-1,{dur:Math.min(20,r.wanderRestUntil-S.t)});
  const c=[];for(let j=0;j<W*H;j++){const d=G.dist[j];if(d>=2&&d<=7&&walk(j)&&!(TAKEN&&TAKEN.has(j))&&!((r.routeAvoid||{})[j]>S.t)){const x=j%W,y=(j/W)|0;if(isNight()&&!VILL[j])continue;c.push(j)}}
  if(!c.length)return startAct(r,G,'idle',-1,{dur:15});
  startAct(r,G,'wander',pick(c));
}
function moveR(r,dt){
  let step=.36*dt*rMul(r,'move')*(r.act&&['questjoy','sevreact','reunion'].includes(r.act.type)&&r.act.stage==='walk'?1.5:1)/* クエストで置いた物へ駆け寄る間だけ、1.5倍 */*Math.max(NEARVANE.has((r.y|0)*W+(r.x|0))?1.2:1,NEARSIGN.has((r.y|0)*W+(r.x|0))&&r.act&&r.act.type==='flee'?1.4:1)*/* 風見鶏と道しるべは重ならない（大きいほう） */(r.energy<5?.5:1)*(r.act&&(r.act.type==='flee'||r.act.run)?1.9:1)*(r.hunger<20&&r.act&&(r.act.type==='eat'||r.act.type==='fetch'||r.act.type==='forage')?1.6:1)/* おなかがへりすぎたら、急いで食べに行く */*(FSPD[S.floor[(r.y|0)*W+(r.x|0)]]||1);r.walkT=(r.walkT||0)+dt;
  if(r.path.length>1&&r.path[0]!==r.reroute){const n0=r.path[0];if(S.res.some(q=>q!==r&&!q.hidden&&(q.y|0)*W+(q.x|0)===n0&&!(q.act&&q.act.stage==='walk'&&q.path&&q.path.length))){r.reroute=n0;const g=r.path[r.path.length-1],G0=roadSearch(r.x|0,r.y|0),np=avoidPath(r,G0,g);if(np.length&&np.length<=r.path.length+4)r.path=np}}/* 遠まわりになるなら、よけずにそのまま進む（進んでは戻るのを防ぐ。進めなければ下の「つまり」で処理） */
  if(r.path.length){const cj=(r.y|0)*W+(r.x|0),n0=r.path[0];if(n0!==cj&&Math.abs(n0%W-cj%W)+Math.abs(((n0/W)|0)-((cj/W)|0))>1){/* 次のマスがとなりでない（古い道・押されてずれた）ときは、いまの場所から道を引きなおす。壁をすりぬけない */
    const g=r.path[r.path.length-1],G0=roadSearch(r.x|0,r.y|0);r.path=G0.dist[g]>=0?avoidPath(r,G0,g):[];if(!r.path.length&&g!==cj){noPass(r);endAct(r);return}}}
  while(step>0&&r.path.length){const j=r.path[0];if(!walk(j)&&!(S.ground[j]===1&&!solidOf(j)&&(S.ground[(r.y|0)*W+(r.x|0)]===1||r.act&&r.act.wade))){const goal=r.path[r.path.length-1],G=roadSearch(r.x|0,r.y|0);if(G.dist[goal]>=0&&walk(goal)){r.path=avoidPath(r,G,goal);if(r.path.length)return}noPass(r);endAct(r);return}
    const tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-r.x,dy=ty-r.y,d=Math.hypot(dx,dy),jf=(jumpEdge((r.y|0)*W+(r.x|0),j)?9:1)*(S.ground[j]===2?2:1)*(onLadder((r.y|0)*W+(r.x|0),j)?2:1);/* ハシゴは歩く速さ×0.5 *//* 段差をよじのぼる・おりる間（マスのさかいまで）は9倍ゆっくり＝1マスで5倍の時間 *//* 浅瀬は2倍ゆっくり *//* 段差を飛ぶ間（マスのさかいまで）は5倍ゆっくり＝1マスで3倍の時間 */
    if(dx)r.face=dx<0?-1:1;
    if(d*jf<=step){r.x=tx;r.y=ty;r.path.shift();step-=d*jf}else{r.x+=dx/d*step/jf;r.y+=dy/d*step/jf;step=0}}
  // ぶつかって進めないときは、止まっている子のマスを避けた道を探して回り込む。道がなければ少しの間すりぬける
  if(r.path.length){const g=r.path[r.path.length-1],n0=r.path[0],dd=Math.hypot(n0%W+.5-r.x,((n0/W)|0)+.5-r.y);
    const prog=r.lastN!==r.path.length||r.lastX==null||dd<r.lastX-.06*dt;
    if(prog){r.stk=0;r.lastN=r.path.length;r.lastX=dd}else r.stk=(r.stk||0)+dt;
    if(r.stk>2.5){r.stk=0;r.lastX=null;const bl=new Set();for(const q of S.res)if(q!==r&&!q.hidden&&!(q.act&&q.act.stage==='walk'&&q.path&&q.path.length))bl.add((q.y|0)*W+(q.x|0));bl.delete(g);bl.delete((r.y|0)*W+(r.x|0));
      const G2=roadSearch(r.x|0,r.y|0,bl);if(G2.dist[g]>=0&&!r.ghost&&G2.dist[g]<=r.path.length+6)r.path=pathTo(G2,g);else r.ghost=8}}
  else{r.stk=0;r.lastX=null;r.lastN=null}
  if(r.ghost>0)r.ghost-=dt;
  if(r.act&&r.act.stage==='walk'&&r.path.length){/* 長いあいだ1マスも近づけないときは、あきらめる */
    if(r.wkA!==r.act){r.wkA=r.act;r.wkMin=r.path.length;r.wkT=0}else if(r.path.length<r.wkMin){r.wkMin=r.path.length;r.wkT=0}else r.wkT+=dt;
    if(r.wkT>30&&r.act.type!=='nmeet'){if(r.act.key)BAN.set(r.act.key,S.t+180);noPass(r);endAct(r);r.path=[];r.act={type:'idle',stage:'do',t:0,dur:8};r.wkA=null;return}}
  if(!r.path.length&&r.act)beginDo(r);
}
const NIGHT_OK=['phew','step','sleep','stay','shiver','eat','fetch','store','smat','flee','patrol','faint','forage','questjoy','pray','reunion']/* お墓へはこぶ（pray）は夜もつづける：やめると毎コマやりなおしになって動けない */;
const WORKT=new Set(['till','sow','plant','build','craft','water','tend','repair','harvest','gather','chop','mine','cook']);
function rescueStuck(r){if(r.hidden)return;const cj=(r.y|0)*W+(r.x|0),o=S.obj[cj];if(!(HOME_WALLS.has(o)||(FENCE_IDS.has(o)&&!GATE_IDS.has(o))||S.ground[cj]===1&&!(r.act&&(r.act.type==='bathe'||r.act.type==='plant'&&r.act.wade))))return;/* 水浴び・池のまんなかのハス植えは、水に入ってよい */if(r.act&&r.act.type==='step'||(r.stepT||0)>S.t)return;r.stepT=S.t+5;/* 壁や柵・水の中にいたら、いちばん近い歩ける場所へ歩いて出る（5分ごとにさがす） */const G=bfs(cj%W,(cj/W)|0),k=nearest(G,j=>j!==cj&&walk(j)&&!S.obj[j],12);if(k>=0){endAct(r);startAct(r,G,'step',k,{run:true})}}
function updRes(r,dt){rescueStuck(r);if((RHOLD.get(r)||0)>performance.now())return;/* 喜んでいる・話したあとの少しの間は、手をとめる */if(r._pe!=null&&r.energy>r._pe+1e-6)r.eUp=S.t;r._pe=r.energy;/* 元気が回復しているか */
  if(HOLD.has(r.id)){if(r.act)endAct(r);r.act=null;return}
  if(r.hidden||r.act&&r.act.stage==='do'||Math.hypot(r.x-(r.stX??r.x),r.y-(r.stY??r.y))>.3){r.stX=r.x;r.stY=r.y;r.stT=S.t}else if(S.t-(r.stT??S.t)>=10&&!(r.act&&r.act.type==='nmeet')){if(r.act&&r.act.stand>=0){r.avoidJ=r.act.stand;r.avoidU=S.t+120}r.stX=r.x;r.stY=r.y;r.stT=S.t;if(r.act)endAct(r)}/* 動いてもいない・作業もしていないまま10分たったら、いまの行動をやめて、べつの行動をえらぶ */
  const sleeping=r.act&&r.act.type==='sleep'&&r.act.stage==='do';
  const mv=r.act&&(r.act.stage==='walk'||r.act.type==='tag');const lazy=!r.act||r.act.type==='idle'||r.act.type==='wander'||r.act.type==='stay';const wk=r.act&&r.act.stage==='do'&&WORKT.has(r.act.type);/* おなかは、作業するとへる。つかれているほどへりやすい */r.hunger-=(sleeping?.003:wk?.3:mv?.04:.02)*(lazy?.5:1)*(r.energy<10?2:r.energy<30?1.5:1)*dt*(trt(r,'shoshoku')?.8:1)*(r.full>S.t?.6:1);
  if(!sleeping)r.fun-=.07*dt*(trt(r,'genki')?.6:1);
  if(!sleeping&&NEARFLOWER.has((r.y|0)*W+(r.x|0)))r.fun=Math.min(100,r.fun+.05*dt);
  {const ev=ENVG?Math.min(12,ENVG[(r.y|0)*W+(r.x|0)]):0;if(ev>0&&!sleeping){r.fun=Math.min(100,r.fun+ev*.006*dt);if(r.act&&r.act.stage==='do'&&(r.act.type==='idle'||r.act.type==='rest'))r.energy=Math.min(100,r.energy+ev*.006*recK(r)*dt)}}/* まわりの環境がいいと、休けい・たのしさが上がる */
  // 家の中で寝ている子は、壁が壊れて「コワイノ」が入ってこない限り起きない
  if(sleeping&&r.elem==='fire'&&r.energy>30&&S.enemies.some(e=>e.spawned&&Math.hypot(e.x-r.x,e.y-r.y)<8)){const out=insideSet(),me=(r.y|0)*W+(r.x|0);
    if(out[me]||S.enemies.some(e=>e.spawned&&!out[(e.y|0)*W+(e.x|0)])){endAct(r);r.bubble='🔥'}}
  r.fun=Math.max(0,r.fun);
  if(sleeping&&isWatch(r)&&isNight()&&S.enemyOn&&(r.hunger<hMax(r)*.5?S.food>0:true)){endAct(r);addFloat(r.x,r.y-1.4,'見張りの時間','#ffd38a')}/* 家の中で寝ている子もふくめて、見張りの番なら起きる */
  if(r.elem==='fire'&&!r.hidden&&!sleeping&&!(r.act&&(r.act.type==='flee'||r.act.type==='faint'))&&!((r.fatk||0)>S.t)){const lv=rLv(r);let en=null,bd=2.3;for(const e of S.enemies){if(!e.spawned||e.dead)continue;const d=Math.hypot(e.x-r.x,e.y-r.y);if(d<bd&&(d<1.5||overFence(r.x,r.y,e.x,e.y))&&!fenceBetween(r.x,r.y,e.x,e.y)){bd=d;en=e}}
    if(en){r.fatk=S.t+5;const ba=((r.bst&&r.bst.atk)||0)+((r.sst&&r.sst.atk)||0),dmg=Math.max(.5,(fAtk(lv)+ba)*fireMul(r));en.hp-=dmg;en.flash=6;en.stun=Math.max(en.stun||0,1);en.aggro=r.id;en.aggroT=S.t;/* たたかれたコワイノは、その子をねらう */r.face=en.x>=r.x?1:-1;r.swing=performance.now();atkFX(r,en);sfxAt('hit',r.x,r.y);if(en.hp<=0){r.beat=(r.beat||0)+1;defeat(en,r.name+'が'+EN[en.type].name+'を追いはらった！')}}}/* 火のせいれいは、となりのコワイノに自分から攻撃する */
  if(r.act&&!isNight()&&!URGNO.includes(r.act.type)&&!heldN(r)&&!r.meal&&!r.cing&&r.hunger>=35&&r.energy>=25&&!(r.uchk>S.t)){r.uchk=S.t+2;if(hasUrgent(r)){// 建物や依頼は、いまの作業をやめてでも向かう
    const old=r.act,op=r.path,ob=r.bubble;endAct(r);const G=bfs(r.x|0,r.y|0);if(!(tryJob(r,G,'build')||tryJob(r,G,'craft'))){r.act=old;r.path=op;r.bubble=ob;if(old.key)reserve(old.key)}}}
  if(r.elem==='fire'&&r.act&&r.act.type==='patrol'&&isNight()&&S.enemyOn&&(r.act.hunt!=null?S.t-r.act.hunt>3:S.enemies.some(e=>e.spawned&&!e.dead&&nearRes(e))))endAct(r);/* 見回り中でも、拠点＋3マスにコワイノが来たらすぐ向かう */
  if(r.elem==='fire'&&r.act&&!['step','patrol','eat','fetch','flee','faint','forage','bury'].includes(r.act.type)&&r.hunger>=50&&!r.refill&&!r.coffin&&!r.meal&&S.enemies.some(e=>e.spawned&&!e.dead&&nearRes(e)))endAct(r);/* 火の子は、ほかのことをしていても、拠点＋3マスにコワイノが来たら、やめてたたかいに行く */
  if(r.act&&r.act.type==='wander'&&isNight()&&!(isWatch(r)&&S.enemyOn)){endAct(r)}/* 夜になったら、お散歩をやめて帰る */
  if(r.act&&IDLE_ACTS.includes(r.act.type)&&!isNight()&&r.hunger>=55&&!(r.fun<(S.oracle==='play'?98:r.elem==='wind'?60:30)&&r.act.type!=='wander'&&r.act.type!=='idle')&&!r.act.rand/* 遊ぶきまり（decide0・おつげ）と同じ数で、遊びをやめない */){r.wchk=(r.wchk||0)+dt;if(r.wchk>=3){r.wchk=0;if(hasWork(r)){// 実際に仕事を始められたときだけ遊びをやめる（できないなら続ける）
    const old=r.act,op=r.path,ob=r.bubble;endAct(r);if(!goWork(r,bfs(r.x|0,r.y|0),true)){r.act=old;r.path=op;r.bubble=ob;if(old.key)reserve(old.key)}}}}
  else if(r.act&&ROUTINE.includes(r.act.type)&&!isNight()&&!r.cing&&!(r.noInt>S.t)){r.wchk=(r.wchk||0)+dt;if(r.wchk>=3){r.wchk=0;if(hasHighWork(r)){const was=r.act.type;endAct(r);r.highFirst=true;decide(r);r.highFirst=false;if(r.act&&r.act.type===was)r.noInt=S.t+60}}}
  if(r.hurt>0)r.hurt-=dt;
  if(!S.enemyOn&&r.hunger<40)r.hunger=40;/* チュートリアル中は、おなかで消えない */
  if(r.hunger<10&&!r.hw10&&S.enemyOn){r.hw10=1;toast(r.name+'のおなかが、もうすぐからっぽ！','warn')}else if(r.hunger>=25)r.hw10=0;
  if(r.hunger<=0){r.hunger=0;return die(r)}
  if(r.act&&hungry(r)&&!['step','eat','fetch','forage','flee','faint','smat','store'].includes(r.act.type))endAct(r);/* おなかが50より少なくなったら、なにをしていても（ねていても・たたかっていても）、やめて食べにいく */
  if(r.act&&r.act.type==='repair'&&r.hunger<=50&&S.food>0&&!isNight()){endAct(r);goEat(r,bfs(r.x|0,r.y|0));return}
  if(r.cing&&r.hunger<=25&&S.food<=0){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null;if(r.act&&r.act.type==='cook')endAct(r);if(r.bubble==='🔥'||r.bubble==='🍳')r.bubble=null}/* 料理中におなかがすいたら、材料をもどして食べにいく */
  if(r.act&&r.hunger<=(r.act.type==='cook'?25:50)&&S.food>0&&!isNight()&&WORKT.has(r.act.type)){endAct(r)}/* おなかが50いかになったら、作業をやめて食べにいく */
  if(r.refill&&(r.refill<=S.t||r.hunger>=hMax(r)-1||S.food<=0))r.refill=0;/* にげて食べに来たときは、マックスまで食べる */
  if(r.elem==='fire'&&r.hunger>=50&&!r.refill){r.fleeNow=false;if(r.act&&r.act.type==='flee')endAct(r)}
  {const hj=(r.y|0)*W+(r.x|0);if((r.meal||r.act&&r.act.type==='eat'&&r.act.stage==='do')&&!r.hidden&&S.enemies.some(e=>e.spawned&&!e.dead)&&(!fenceOut()[hj]||HOUSES.some(h=>h.inside.has(hj)))){r.fleeNow=false;if(!(r.act&&r.act.type==='eat')){endAct(r);startAct(r,bfs(r.x|0,r.y|0),'eat',-1,{pt:0,pw:0});return}}}/* ごはんを持っていて（食べている途中も）、柵や家の壁の中にいるなら、コワイノが近くにいても、にげずにその場で食べる */
  if(r.fleeNow&&!r.hidden&&!(r.act&&(r.act.type==='flee'||r.act.run))){r.fleeNow=false;
    const fh=r.fleeHouse;r.fleeHouse=false;const en=S.enemies.find(e=>e.spawned&&Math.hypot(e.x-r.x,e.y-r.y)<(fh?12:6));/* 家の壁がこわされたときは、少しはなれたコワイノからも逃げる */
    if(en){r.fleeT=S.t;endAct(r);const G=bfs(r.x|0,r.y|0);if(withFlee(r,fleeHit,G))return}}
  if(r.act&&!isWatch(r)&&hostileNow(r)&&r.hunger>=30&&!['shiver','eat','fetch','flee','faint','forage','pray','bury','reunion','sevreact','step'].includes(r.act.type)&&!r.coffin)endAct(r);/* 寝ている子も、コワイノが基地に入ってきたら起きて、家でふるえる *//* たたかえない子は、コワイノがいるあいだ、家でふるえる */
  if(r.act&&isNight()&&!NIGHT_OK.includes(r.act.type))endAct(r)
  if(r.act&&r.act.type==='sevreact'&&(r.hunger<30||hungry(r)||r.energy<10||!SEV_ENCOUNTERS.get(S)||!sevEncounterSafe(SEV_ENCOUNTERS.get(S))))endAct(r);
  if(r.act&&r.act.type==='questjoy'&&(r.hunger<30||hungry(r)||!questVisitSafe(r,r.act.obj)))endAct(r);
  if(tryQuestVisit(r))return;
  if(!r.act){decide(r);return}
  const a=r.act;
  if(a.stage==='walk'){moveR(r,dt);return}
  const wdt=WORKT.has(a.type)&&a.type!=='cook'?dt*rMul(r,'work'):dt;/* 料理は、力に関係なく、説明どおりの時間 *//* 力があるほど作業が速い */
  a.t+=wdt;const A=ACT[a.type];
  if(A.tick)A.tick(r,a,wdt);
  if(A.done(r,a)){a.fin=1;if(A.end)A.end(r,a);endAct(r)}
}
function reunite(r,sp){/* もどってきた子の、もとのなかよしは、神殿へかけつけてよろこぶ */const m=r.reMate&&S.res.find(q=>q.name===r.reMate&&!q.hidden&&q!==r);r.reMate=null;if(!m||isNight()&&!m.act)return;const G=bfs(m.x|0,m.y|0),st=nearest(G,j=>Math.abs(j%W-sp[0])+Math.abs(((j/W)|0)-sp[1])===1&&walk(j),300);if(st<0)return;endAct(m);startAct(m,G,'reunion',st,{who:r.id})}
function finishBurial(r){const nm=r.coffin&&r.coffin.name;r.coffin=null;if(!nm)return;for(const L of[S.buried||[],S.lost||[]])for(const q of L)if(q.name===nm)delete q.unb;/* 埋葬してから、よみがえらせられる */S.pt+=1;S.totalPt+=1;toast(r.name+'が'+nm+'をおみおくりした。'+((S.buried||[]).some(q=>q.name===nm)?'次の朝、神殿で呼びもどせる':'パワー+1'),'good');logEv(r.name+'が'+nm+'をおみおくりした')}
function goBurial(r,G){/* 消えてしまった子のお墓へ行き、棺を神殿へはこぶ。なかよしがいれば、その子がする */
  if(r.coffin){if(STATUE>=0){const st=nearest(G,j=>adjOf(j,k=>k===STATUE||k===STATUE+W)>=0,300);if(st>=0){startAct(r,G,'pray',st,{});return true}}finishBurial(r);return false}
  if(!cnt('grave')||isNight()||r.hunger<25||heldN(r)||r.meal||r.cing)return false;
  const ok=j=>{if(S.obj[j]!=='grave')return false;const d=S.dyn[j];if(!d||d.buried||!free('bury'+j,1))return false;if(d.mate&&d.mate!==r.name&&S.res.some(q=>q.name===d.mate&&!q.hidden)&&S.t-(d.t0||0)<240)return false;return true};
  const gs=[];for(let j=0;j<W*H;j++)if(S.obj[j]==='grave'&&ok(j))gs.push(j);if(!gs.length)return false;
  const st=nearest(G,k=>adjOf(k,q=>gs.includes(q))>=0,200);if(st<0)return false;const g=adjOf(st,q=>gs.includes(q));startAct(r,G,'bury',st,{key:'bury'+g,obj:g});return true}
function die(r){if(r.otaki){const Q=S.otakiQ||(S.otakiQ={});for(const k in r.otaki)Q[k]=(Q[k]||0)+r.otaki[k];r.otaki=null}/* 持っていたおたきあげの素材は、まちにもどす */
  endAct(r);const dm=bestMate(r),dmN=dm?dm.name:null;{const t0=(r.y|0)*W+(r.x|0);let gj=-1;for(let rad=0;rad<4&&gj<0;rad++)for(let dy=-rad;dy<=rad&&gj<0;dy++)for(let dx=-rad;dx<=rad;dx++){const k=t0+dy*W+dx;if(k>=0&&k<W*H&&!S.obj[k]&&S.ground[k]!==1){gj=k;break}}
    if(gj>=0){S.obj[gj]='grave';S.dyn[gj]={name:r.name,buried:false,mate:dmN,t0:S.t};recount()}}S.res=S.res.filter(q=>q!==r);S.deaths++;for(const q of S.res)if(Math.hypot(q.x-r.x,q.y-r.y)<14)q.cryU=S.t+90;/* 近くのせいれいは、しばらく泣く */logEv(r.name+'が消えてしまった');
  if(!S.buried)S.buried=[];if(isKey(r.name)&&r.elem==='fire'&&!S.flags.guard&&S.ns&&S.ns.boss&&isNight())S.flags.hDied=1;/* こもれびのまもりをおぼえる前に、オオカゲの夜に火の子がいなくなった */if(isKey(r.name))S.buried.push({name:r.name,elem:r.elem,vr:r.vr,xp:r.xp||0,xpf:r.xpf||0,like:r.like,came:r.came,made:r.made,beat:r.beat,bst:r.bst,sst:r.sst,boost:r.boost,mate:dmN,unb:true});else{if(!S.lost)S.lost=[];S.lost.push({name:r.name,elem:r.elem,vr:r.vr,xp:r.xp||0,xpf:r.xpf||0,like:r.like,came:r.came,made:r.made,beat:r.beat,bst:r.bst,sst:r.sst,boost:r.boost,mate:dmN,unb:true})}/* 埋葬されるまでは、よみがえらせない（unb） *//* キーキャラは特性「きずな」でレベルそのまま。ふつうのせいれいは「めぶきのしずく」がないともどらない *//* もどってくるのはキーキャラだけ *//* 次の朝の召喚で、いちばんにもどってくる */
  addFloat(r.x,r.y-1,'👻','#fff');
  toast(r.name+'が消えてしまった…','warn');
  {const DT=S.res.length?deathTalk(r):null;if(DT&&DT.length)talkOnce('dt'+Math.round(S.t*60),DT);/* とちゅうでとじたら、つづきからでもう一度 */else{const key=isKey(r.name),fk=key?'deathTold':'death2Told';if(!S.flags[fk]&&S.res.length){const sp=S.res.find(q=>KEYRES.includes(q.name))||S.res[0],n=r.name;
    talkOnce(fk,(key?DEATHL:DEATHL2)[elemKey(sp)](n).map(t=>[sp.name,t]))}}}/* 話す子の性格で説明する */
  if(!S.res.length){S.wipe=true;S.wipeGift=WD===0?(lvOK('logfence')?'logfence':'fence'):(lvOK('wall')?'wall':'fence');giveItem(S.wipeGift,10);/* おくりものは、先にわたしておく（会話のとちゅうでとじても、なくならない） */for(const L of[S.buried||[],S.lost||[]])for(const q of L)delete q.unb}/* 全滅：埋葬する子がいないので、埋葬の前でも、次の朝から呼びもどせるようにする（お墓はそのまま） */
  if(!S.res.length)setTimeout(()=>STATUE<0?gameOver():dialog([[GOD,'みんな、消えてしもうた…。'],[GOD,'じゃが、だいじょうぶじゃ。朝になれば、この土地に深くなじんだ子から、神殿で呼びもどせるぞい。'],[GOD,'#alarm|人数が少ないうちは、「コワイノ」も少なめじゃ。オオカゲも、なかまがそろうまでは来んはずじゃ。'],[GOD,'それと…これを使うがよい。'+BL[S.wipeGift||'fence'].name+'を10こ、やろう。']],()=>toast(BL[S.wipeGift||'fence'].name+'を10こもらった','good')),800);/* 石の塀を覚えていたら、石の塀 */
}

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
function bossDays(){const w=S.bossWarn;if(w==null)return '';const t=dayNo();if(!(S.res.length>=4&&S.res.some(q=>q.elem==='fire')&&KEYS[WD].every(n=>S.res.some(r=>r.name===n))))return 'オオカゲ：なかまが4人そろうまで来ない';let d=t;if(S.res4Since!=null)d=Math.max(d,S.res4Since+3);while(!bossNight(d))d++;return d===t?'オオカゲ：今夜来るかも':'オオカゲ：'+(d-t)+'日後の夜に来るかも'}/* クエストの進みぐあいに、オオカゲが来る日を出す */
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
  statue:{dx:16,dy:-6,R:110},torch:{dx:16,dy:-12,R:105},candle:{dx:16,dy:10,R:45},lantern:{dx:16,dy:6,R:45},flamp:{dx:16,dy:-6,R:45},takeakari:{dx:16,dy:14,R:90}};
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
function bossEntrance(e){/* オオカゲ・ヨルノオオカゲの登場：画面がよって、ゆれて暗くなる */const B=BOSSFX[e.type];SKIP=false;/* 登場のあいだは時間を止めて、すがたを見せる */const z0=cam.z;camAnim={fz:cam.z,tz:Math.min(3,cam.z*1.5),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:e.x*TS,ty:e.y*TS-12*(EN[e.type].size||1),t:0,dur:.8};BOSSHOLD=performance.now()+5000;setTimeout(()=>{camAnim={fz:cam.z,tz:z0,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:cam.x+VW/cam.z/2,ty:cam.y+VH/cam.z/2,t:0,dur:.8}},5000);/* ボスへズームアップして、少しのあいだ時間を止める。名前と説明を大きく出す */shakeScreen();dlgCue('dim');sfx('bossIn');bossTitle(EN[e.type].name,ZUKAN[e.type]||B.sub,B.col);
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
  /* ねらう順番：近くのせいれい → 家（壁の中）のせいれい → 罠・見張り台 → そのほかのせいれい */
  if(!D.thief&&!e.ashG&&!e.flee&&!D.dev){let nr=null,nd=reachOf(D);for(const r of S.res){if(r.hidden||(r.faintGrace||0)>S.t||r.act&&r.act.type==='faint')continue;const d=Math.hypot(r.x-e.x,r.y-e.y);if(d<nd&&!fenceBetween(e.x,e.y,r.x,r.y)){nd=d;nr=r}}
    if(!nr&&e.aggro!=null&&S.t-(e.aggroT||-1e9)<10){const r=S.res.find(q=>q.id===e.aggro);if(r&&!r.hidden&&!((r.faintGrace||0)>S.t)&&!(r.act&&r.act.type==='faint')){const d=Math.hypot(r.x-e.x,r.y-e.y);if(d<2.3&&(d<1.5||overFence(e.x,e.y,r.x,r.y))&&!fenceBetween(e.x,e.y,r.x,r.y))nr=r}}/* 柵ごしにたたいてきた火の子には、火の子と同じ距離から、やり返す（柵より先に） */
    if(nr){e.tg=nr.id;hitRes(e,nr,D);if(hsOf(D)>=2&&!e.dead){burstAt(nr.x,nr.y,'offer');for(const q of S.res){if(q===nr||q.hidden||e.dead)continue;if(Math.hypot(q.x-nr.x,q.y-nr.y)<1.5&&!fenceBetween(e.x,e.y,q.x,q.y))hitRes(e,q,D)}}return}}/* 攻撃がとどく所にせいれいがいれば、柵ごしでも、柵や罠よりせいれいを先に攻撃する */
  let pre=null;if(!D.thief&&!D.trapper&&!e.ashG&&!e.flee){if(!EREACH.has(e))EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const RD=EREACH.get(e);let nd=5,hd=12,hr=null;/* 家の中の子をねらうのは、12マス以内の敵だけ */
    for(const r of S.res){if(r.hidden)continue;const d=Math.hypot(r.x-e.x,r.y-e.y),rj=(r.y|0)*W+(r.x|0);if(RD&&RD[rj]>=0&&d<nd){nd=d;pre=r}else if(roomOf(rj)&&d<hd){hd=d;hr=r}}if(!pre)pre=hr}
  let dj=-1;if(D.trapper&&!e.flee&&!pre){/* 見張り台や罠をこわしにいくのはワナクイだけ。ほかのコワイノは、壁や柵の中にいてもせいれいをねらう */let bd=1e9;for(const j of defList()){if(!DEFS.has(S.obj[j]))continue;const z=BL[S.obj[j]].sz||[1,1],x0=j%W,y0=(j/W)|0,d=Math.hypot(Math.max(x0-e.x,0,e.x-(x0+z[0])),Math.max(y0-e.y,0,e.y-(y0+z[1])))+.5;/* 大きい設備は、いちばん近い面まで */if(d<bd){bd=d;dj=j}}
    if(dj>=0){if(bd<1.15){e.busyT=S.t;e.atk+=dt*lightMul(e.x,e.y);/* 光の中は、攻撃の速さ0.8倍 */if(e.atk>=D.atk){e.atk=0;const o=S.obj[dj];S.hp[dj]=(S.hp[dj]??defHp(o))-(D.boss?2:D.trapper?2:1)/steleF(dj);WALLHIT.set(dj,performance.now());sfxAt('bonk',dj%W+.5,(dj/W)|0);
        if(S.hp[dj]<=0){(S.broken||(S.broken=[])).push({j:dj,id:o,L:S.hp['L'+dj],rot:rotAt(dj)});sfxAt('wbreak',dj%W+.5,(dj/W)|0);if(S.ns)S.ns.broke++;{const hb=HOUSES.find(h=>h.set.has(dj));clearObj(dj);DEFC.t=0;recount();houseBreakFlee(hb)}dirty=true;toast(BL[o].name+'がこわされた！','warn')}}return}
      {const z=BL[S.obj[dj]].sz||[1,1],x0=dj%W,y0=(dj/W)|0;if(BL[S.obj[dj]].solid){let bq=-1,bb=1e9;for(let yy=y0-1;yy<=y0+z[1];yy++)for(let xx=x0-1;xx<=x0+z[0];xx++){if((xx<x0||xx>=x0+z[0])===(yy<y0||yy>=y0+z[1]))continue;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(!walk(q))continue;const dd=Math.hypot(xx+.5-e.x,yy+.5-e.y);if(dd<bb){bb=dd;bq=q}}goal=bq>=0?bq:dj}else goal=dj}if(e.tg!=='d'+dj){e.tg='d'+dj;e.repath=0}}}/* 防衛設備をこわしてから、せいれいをねらう */
  if(dj<0&&(!(D.thief||e.ashG)||goal<0&&!e.flee)){let td=1e9,ts=1e9;if(!EREACH.has(e))EREACH.set(e,bfs(e.x|0,e.y|0,2).dist);const RD=EREACH.get(e);if(pre){tgt=pre;td=Math.hypot(pre.x-e.x,pre.y-e.y)}else for(const r of S.res){if(r.hidden||(r.faintGrace||0)>S.t||r.act&&r.act.type==='faint')continue;const d=Math.hypot(r.x-e.x,r.y-e.y),sc=d+(RD&&RD[(r.y|0)*W+(r.x|0)]<0?60:0)-(r.id===e.tg?2:0);/* いまねらっている子を少し優先（ねらいがころころ変わってガタガタしない） */if(sc<ts){ts=sc;td=d;tgt=r}}
    if(!tgt&&!pre){let bd=1e9;for(const r of S.res){if(!(r.hidden&&r.act&&r.act.type==='sleep'))continue;const d=Math.hypot(r.x-e.x,r.y-e.y);if(d<bd){bd=d;td=d;tgt=r}}}/* ねらえる子がだれもいなければ、家で眠っている子をめざして、家の壁をこわしにいく（遠くでワープをくりかえさない） */
    if(tgt&&!tgt.hidden&&td<reachOf(D)&&!fenceBetween(e.x,e.y,tgt.x,tgt.y)){hitRes(e,tgt,D);if(hsOf(D)>=2&&!e.dead){const ar=1.5;burstAt(tgt.x,tgt.y,'offer');for(const q of S.res){if(q===tgt||q.hidden||e.dead)continue;if(Math.hypot(q.x-tgt.x,q.y-tgt.y)<ar&&!fenceBetween(e.x,e.y,q.x,q.y))hitRes(e,q,D)}}/* 大きいコワイノは範囲攻撃：まわりの子も巻きこむ */return}
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
    e.atk+=dt*lightMul(e.x,e.y);/* 光の中は、攻撃の速さ0.8倍 */if(e.atk>=D.atk){e.atk=0;S.hp[j]=(S.hp[j]??BL[S.obj[j]].hp)-(D.wall||(D.boss?2:1))/steleF(j);/* オオカゲは壁をこわす力1.5倍 */if(hsOf(D)>=2)for(const[ax,ay]of DIRS){const k=j+ay*W+ax,ko=S.obj[k];if(k===j||!breakable(ko)||Math.hypot(k%W+.5-e.x,((k/W)|0)+.5-e.y)>2.2)continue;S.hp[k]=(S.hp[k]??BL[ko].hp)-1/steleF(k);WALLHIT.set(k,performance.now());if(S.hp[k]<=0){(S.broken||(S.broken=[])).push({j:k,id:ko,L:S.hp['L'+k],rot:rotAt(k)});sfxAt('wbreak',k%W+.5,(k/W)|0);if(S.ns)S.ns.broke++;{const hb=HOUSES.find(h=>h.set.has(k));clearObj(k);recount();houseBreakFlee(hb)}toast(BL[ko].name+'がこわされた！','warn')}/* まわりの壁がこわれたときも、家の中の子はにげる */}/* 大きいコワイノは、となりの壁にもダメージ（範囲攻撃） */WALLHIT.set(j,performance.now());sfxAt('bonk',j%W+.5,(j/W)|0);
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
function hitRes(e,r,D){if(BOSSFX[e.type]){shakeScreen();fx.push({k:'ring',x:r.x*TS,y:r.y*TS,life:1.2,col:BOSSFX[e.type].col});sfxAt('bonk',r.x,r.y)}/* オオカゲの一撃は、画面がゆれて衝撃がひろがる */if(!WD&&r.elem==='fire'&&r.hunger<60&&r.name===keyName('fire')&&S.flags.guard)S.flags.fHurtG=1;/* こもれびのまもりをおぼえたあとに、火の子がたくさんたたかれた */const sh=(r.shU||0)>S.t;/* フタバの葉っぱのまもり：EN の hitFS・hitNS（まもりありの数） */if((r.faintGrace||0)>S.t||r.act&&r.act.type==='faint'){e.rest=1;return}/* 気絶している子は攻撃しない */const h0=r.hunger;sfx('hit');e.swing=performance.now();
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
function guardLight(e){if(LIGHTCD>0){toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒');return}if(S.pt<1){toast('パワーが足りません');return}S.pt-=1;LIGHTCD=LIGHTCDL[S.lv]||10;
  const D=EN[e.type];e.hp-=1;e.flash=8;/* ダメージは1だけ */e.stun=D.boss?1:2.5;e.path=[];e.repath=0;
  const cx=e.x*TS,cy=e.y*TS-18;fx.push({k:'ring',x:cx,y:cy,life:1});for(let n=0;n<18;n++){const a=Math.random()*7,v=rnd(50,120);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:1,col:pick(['#fffbe0','#fff','#ffe9a0']),r:rnd(1.5,3)})}sfxAt('shoot',e.x,e.y);
  if(e.hp<=0)return defeat(e,'守り神の光で'+D.name+'を追いはらった！')}
let AREACD=0,AREAARM=false;/* ひかりのはどう：範囲2マスに0.5ダメージ・パワー3 */
function areaBlast(cx,cy){
  const L=S.enemies.filter(e=>e.spawned&&!e.dead&&Math.hypot(e.x-cx,e.y-cy)<=2);
  if(!L.length){toast('はんいに「コワイノ」がいません');return}
  S.pt-=3;AREACD=5;const px=cx*TS,py=cy*TS;fx.push({k:'ring',x:px,y:py,life:1});
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
function dropRolls(t){const sd=DROPSEED[t]&&cropOn(DROPSEED[t])?DROPSEED[t]:'imo',L=[['mat:wood',3,.2],['mat:stone',3,.2],['seed:'+sd,2,.2],['sand',1,.1]];if(DROPF[t])L.push([DROPF[t],1,.02]);if(KWR.some(id=>!(S.recipes||{})[id]))L.push(['recipe',1,.01]);return L}/* [物, 数, 落とす確率]：木材・石材・種20%、やすらぎの砂10%、家具2%、コワイノのレシピ1% */
function dropList(t){const sd=DROPSEED[t]&&cropOn(DROPSEED[t])?DROPSEED[t]:'imo',L=DROPS.concat([['seed:'+sd,2]]);if(DROPF[t])L.push([DROPF[t],1]);return L}
function dropAt(x,y,want,nn,et){if(!S.drops)S.drops=[];const x0=x|0,y0=y|0;let j=-1;const r0=S.res.find(q=>!q.hidden),G=want?bfs(r0?r0.x|0:CX,r0?r0.y|0:CY):null,reach=q=>!G||G.dist[q]>=0;/* かけら・しずくは、せいれいが行ける場所に落とす */
  for(let rr2=0;rr2<=(want?8:3)&&j<0;rr2++)for(let dy=-rr2;dy<=rr2&&j<0;dy++)for(let dx=-rr2;dx<=rr2;dx++){const xx=x0+dx,yy=y0+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(!S.obj[q]&&walk(q)&&reach(q)&&!S.drops.some(d=>d.y*W+d.x===q)){j=q;break}}
  if(j<0&&G){let bd=1e9;for(let q=0;q<W*H;q++){if(G.dist[q]<0||S.obj[q]||!walk(q)||S.drops.some(d=>d.y*W+d.x===q))continue;const d=Math.hypot(q%W-x0,((q/W)|0)-y0);if(d<bd){bd=d;j=q}}}
  if(j<0)return;const[id,n]=want?[want,nn||1]:pick(dropList(et));S.drops.push({x:j%W,y:(j/W)|0,id,n})}
function takeDrop(d,r){let nm;
  if(d.id==='recipe'){const L=KWR.filter(id=>!(S.recipes||{})[id]);if(!L.length){S.sand=(S.sand||0)+1;return}const id=pick(L);(S.recipes||(S.recipes={}))[id]=true;if(BL[id].kind==='block')(S.unlocked||(S.unlocked={}))[id]=true;kwrSync();sfx('level');toast((r?r.name+'が':'')+'コワイノのレシピをひろった：'+BL[id].name,'good');memo('📜',BL[id].name+'のレシピをひろった');renderPalette();return}/* コワイノのレシピ（まれ） */
  if(d.id==='sand'){S.sand=(S.sand||0)+d.n;if(!(S.recipes||(S.recipes={})).toro){S.recipes.toro=true;memo('🏮','しずけさの石どうろうが作れるようになった')}sfx('seed');toast((r?r.name+'が':'')+'「やすらぎの砂」をひろった（'+S.sand+'）','good');return}/* コワイノの落とし物だけで手に入る、とくべつな素材 */
  if(d.id==='mebuki'){S.mebuki=(S.mebuki||0)+1;sfx('level');toast((r?r.name+'が':'')+'「めぶきのしずく」をひろった！','good');logEv('めぶきのしずくをひろった');
    if(!S.flags.mebukiTold&&WD===0){const sp=S.res.find(q=>KEYRES.includes(q.name))||r;if(sp)talkOnce('mebukiTold',MEBUKIL[elemKey(sp)].map(t=>[sp.name,t]))}return}
  if(d.id==='shard'){S.flags.sh_boss=true;S.shards=Math.min(3,(S.shards||0)+1);memo('💎','ヌシのかけらをひろった（'+S.shards+'/3）');sfx('level');toast((r?r.name+'が':'')+'「ヌシのかけら」をひろった！（'+S.shards+'/3）','good');logEv('ヌシのかけらをひろった');checkQuest();return}
  if(r&&(d.id.startsWith('food:')||d.id.startsWith('mat:'))){const food=d.id.startsWith('food:'),k=d.id.slice(food?5:4),n=Math.min(d.n,roomN(r));if(n>0){if(food)addCarry(r,k,n);else addMat(r,k,n)}if(n<d.n)S.drops.push(Object.assign({},d,{n:d.n-n}));/* せいれいがひろった食べ物・素材は、頭の上につんで、箱へはこぶ。持ちきれない分は地面にのこす */if(n>0&&!d.lt)toast(r.name+'がおとしものをひろった：'+(food?FOODS[k].name:MATN[k])+'×'+n,'good');return}
  if(d.id.startsWith('food:')){const k=d.id.slice(5),add=Math.max(0,Math.min(d.n,foodCap()-S.food));if(add)addFood(k,add);if(add<d.n)S.drops.push(Object.assign({},d,{n:d.n-add}));/* 食料箱に入りきらない分は、そのまま地面にのこる */nm=FOODS[k].name+(add?'×'+add:'（食料箱がいっぱい）')}
  else if(d.id.startsWith('mat:')){const k=d.id.slice(4),add=Math.max(0,Math.min(d.n,matCap()-matTot()));S.mat[k]=(S.mat[k]||0)+add;if(!S.gotMat)S.gotMat={};S.gotMat[k]=(S.gotMat[k]||0)+add;nm=MATN[k]+(add?'×'+add:'（素材箱がいっぱい）');bambooIdea()}
  else{giveItem(d.id,d.n);nm=(d.id.startsWith('seed:')?CROPS[d.id.slice(5)].name+'のたね':BL[d.id].item||BL[d.id].name)+'×'+d.n}
  if(!d.lt)toast((r?r.name+'が':'')+'おとしものをひろった：'+nm,'good')}/* 守りの光で落とした素材は、だまってひろう */
const watchUp=()=>Object.keys(S.hp).some(k=>k[0]==='L'&&S.hp[k]>=2&&S.obj[+k.slice(1)]==='watch');/* Lv2以上の見張り台がある */
const WUP=[null,{pc:30,mat:{wood:30,stone:35}},{pc:100,mat:{wood:45,stone:75},sand:5}],YUP=[null,{pc:30,mat:{wood:30,stone:35}},{pc:60,mat:{wood:45,stone:75},sand:5}];/* sand：やすらぎの砂（Lv3への強化だけ） *//* 見張り台・ようがん台の強化 */const WATCH=[null,{dmg:1,range:6,cd:10},{dmg:2,range:6.5,cd:10},{dmg:3,range:7,cd:10}];/* cd：攻撃の間かく（分） */
const YOGAN=[null,{dmg:1,range:5,cd:8,splash:1.5,sdmg:.5},{dmg:2,range:5.5,cd:8,splash:1.5,sdmg:1},{dmg:3,range:6,cd:8,splash:1.5,sdmg:1.5}];/* ようがん台（火山のふもと）：火の玉。当たったまわりにもダメージ */
function updTowers(dt){
  if(!S.enemies.length)return;
  for(const j of TOWERS){const o=S.obj[j];if(o!=='watch'&&o!=='yogan'&&o!=='tower')continue;
    S.hp['w'+j]=(S.hp['w'+j]||0)-dt;if(S.hp['w'+j]>0)continue;
    const st=o==='tower'?{dmg:1,range:10,cd:10}:(o==='yogan'?YOGAN:WATCH)[S.hp['L'+j]||1];
    const z0=BL[o].sz||[1,1],x=j%W+z0[0]/2,y=((j/W)|0)+z0[1]/2;
    let tg=null,bd=st.range;for(const e of S.enemies){if(!e.spawned||e.dead)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;tg=e}}
    if(tg){S.hp['w'+j]=st.cd;tg.hp-=st.dmg;tg.flash=6;sfxAt('shoot',x,y);shots.push({x1:x,y1:y-(o==='tower'?1.4:.6),x2:tg.x,y2:tg.y-.3,life:1,fire:o==='yogan'});
      if(st.splash)for(const e of S.enemies){if(e===tg||!e.spawned||e.dead)continue;if(Math.hypot(e.x-tg.x,e.y-tg.y)<st.splash){e.hp-=st.sdmg;e.flash=6;if(e.hp<=0)defeat(e)}}/* 火の玉は、まわりにもダメージ */
      if(tg.hp<=0&&!tg.dead)defeat(tg)}}
  S.enemies=S.enemies.filter(e=>!e.dead);
}

/* ---------- レベル ---------- */
const LV_XP=[0,60,210,462,927,1785,3375,4800,6600,9000,12000,15750,20250,25500,31500];/* 村レベルに必要なパワーの合計。クリア後はLv15まで */
const maxLv=()=>S&&S.cleared?15:10;
function vLv(){let l=1;while(l<maxLv()&&S.totalPt>=LV_XP[l])l++;return l}
const LVXP=[0,0,25,100,225,400,625,900,1225,1600,2025,2500,3025,3600,4225,4900,5625,6400,7225,8100,9025,10000,11025,12100,13225,14400,15625,16900,18225,19600,21025,22500,24025,25600,27225,28900,30625,32400,34225,36100,38025];/* せいれいのレベル：そのレベルになるのに要る経験値（Lv1〜40） */
const HMAXL=[0,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490];/* レベルごとの、おなかの最大 */
const XPBL=[0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19];/* レベルごとに、もらう経験値に足す数 */
const OFFERPL=[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10,11,11,11,12,12,12,13];/* せいれいのレベルごとに、おくりものにふえる数 */
const SEEDPL=[0,0,0.5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];/* せいれいのレベルごとに、たねが1こふえる確率 */
const FATKL=[0,1,1,1,2,2,2,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4];/* 火のせいれいのレベルごとの攻撃力 */
const OVENM=[1,.9,.8,.7,.6,.5,.4,.3,.2,.1,0];/* そばにある調理の家具の種類の数ごとの、料理にかかる時間の倍（0種=1・1種=0.9…） */
const rLv=r=>{const x=r.xp||0;let l=1;while(l+1<LVXP.length&&x>=LVXP[l+1])l++;return l},hMax=r=>HMAXL[rLv(r)];/* おなかの最大はレベル1ごとに+10 */
/* せいれいの能力。100がふつう。レベルが上がると、作業スピード・移動速度・持てる数などがふえる */
const lvF=(lv,k)=>1+k*(Math.min(lv,10)-1);
/* 10がふつう。レベルアップでふえる量は、せいれいとレベルごとにばらつく（0〜2） */
const LVUP={work:[0,0,1,1,1,2],move:[0,0,0,1,1,1]};
function lvGain(r,k,lv){let n=0;for(let l=2;l<=Math.min(lv,10);l++){const h=hash(((r.id||0)*131+l*17+(k==='work'?7:3))>>>0);n+=LVUP[k][(h*LVUP[k].length)|0]}return n}
const RSC=new WeakMap();function rMul(r,k){const lv=rLv(r);let c=RSC.get(r);if(!c||c.lv!==lv||c.vr!==r.vr||c.b!==r.boost){c={lv,vr:r.vr,b:r.boost,s:rStat(r,lv)};RSC.set(r,c)}return c.s[k]/10*(k==='work'&&r.wkB>S.t?1.15:k==='move'&&r.mvT>S.t?1.15:1)}
function ovenMul(j){if(j==null)return 1;const x0=j%W,y0=(j/W)|0;const kinds=new Set();for(let y=y0-3;y<=y0+3;y++)for(let x=x0-3;x<=x0+3;x++){if(x<0||y<0||x>=W||y>=H)continue;const o=S.obj[y*W+x];if(o&&BL[o]&&BL[o].cat==='cook')kinds.add(o)}return OVENM[Math.min(kinds.size,OVENM.length-1)]}/* 調理の家具がそばにあると、料理が早い（同じ家具は1つ分だけ。下限はなし） */
const fAtk=lv=>FATKL[lv];/* 火のせいれい：Lv1=1・Lv4=2・Lv7=3・Lv10=4 */
function rStat(r,lv){const V=r.vr||{},fire=r.elem==='fire';return{
  atk:fire?fAtk(lv)+((r.bst&&r.bst.atk)||0)+((r.sst&&r.sst.atk)||0):0,/* 攻撃できるのは火の子だけ */
  work:Math.round(10*(V.pow||1)*(EL_WORK[r.elem]||1)*(trt(r,'hataraki')?1.25:1))+lvGain(r,'work',lv),
  move:Math.round(10*(V.spd||1)*(trt(r,'hayaashi')?1.25:1)*(r.elem==='wind'?1.45:1))+lvGain(r,'move',lv),
  eat:Math.round(10*(V.eat||1)*(trt(r,'shoshoku')?.8:1)),
  sta:Math.round(10*(V.sta||1)*(EL_STA[r.elem]||1)*(trt(r,'tafu')||trt(r,'nebari')?1.33:1)),
  cap:Math.min(10,lv)+(trt(r,'chikara')?2:0)+((r.bst&&r.bst.cap)||0)+((r.sst&&r.sst.cap)||0),
  bonus:XPBL[lv]}}
const RSTN=[['work','作業スピード'],['move','移動速度'],['cap','持てる数'],['atk','攻撃力']];
// 満腹に必要な食料の数：Lv1〜4で1つ、4レベルごとに+1、火のせいれいは+1
const fullN=r=>1+Math.floor((rLv(r)-1)/4)+(r.elem==='fire'?1:0);/* レベルが上がっても、食べる量はゆるやかにしかふえない */
let LVQ=null;
function lvShow(l,bonus,opens){
  const o=$('#lvup');o.querySelector('.n').textContent=l;{const pw=o.querySelector('.pw'),a=LIGHTCDL[l-1]||10,b=LIGHTCDL[l]||10;pw.hidden=!(b<a);pw.textContent='まもりの光のチャージ '+a+'秒 → '+b+'秒'}/* 村レベルで、まもりの光のチャージがみじかくなったら書く */
  const u=o.querySelector('.op');u.innerHTML='';u.hidden=!opens.length;
  const od=o.querySelector('.opd');od.hidden=true;
  if(opens.length){u.appendChild(el('<small>あたらしく使える（タップで説明）</small>'));for(const id of [...new Set(opens)]){const b=el('<button class="lvic"><img alt=""><span></span></button>');b.querySelector('img').src=iconURL(id);b.querySelector('span').textContent=iname(id);b.onclick=e=>{e.stopPropagation();sfx('tap');u.querySelectorAll('.lvic').forEach(x=>x.classList.toggle('on',x===b));od.hidden=false;od.innerHTML='<b></b><p></p>';od.querySelector('b').textContent=iname(id);od.querySelector('p').textContent=withAttr(id,(BL[id]&&BL[id].desc)||'')};u.appendChild(b)}}/* 解放されたものはアイコン。タップで説明 */
  o.hidden=false;o.classList.remove('on');void o.offsetWidth;o.classList.add('on');
  
  for(const r of S.res){if(r.hidden)continue;const t=performance.now();r.bubble='✨';r.shine=t;JOYU.set(r,t+3200);RHOLD.set(r,t+3200);JUMP.set(r,t);for(const d of[1000,2000])setTimeout(()=>{if(S.res.includes(r))JUMP.set(r,performance.now())},d);burst((r.y|0)*W+(r.x|0),'plant','none')}/* キラキラ・笑顔・こっちを向いて、何度かジャンプ */
  startClap();/* タップするまで、こっちを向いて拍手 */
  if(STATUE>=0)for(let n=0;n<3;n++)setTimeout(()=>burst(STATUE,'furn','none'),n*260);
}
const LEVELUP_ITEMS=new Set(['bridge','path','woodpath','ladder_wood','ladder_bamboo','slope_earth','stairs_wood','stairs_stone','stairs_brick','gate','hwall','door','logfence','bamboofence','floor','brickfloor','stonefloor','window','plasterwall','gravel','wall','sdoor','logwall','brick','brickwall','carpet','curtain1','stone','stonegate']);
const levelUpItemsAt=n=>Object.keys(BL).filter(id=>LEVELUP_ITEMS.has(id)&&BL[id].lv===n&&!BL[id].offerOnly&&(BL[id].w||0)<=WD);
const visibleLevelRewardsAt=n=>levelUpItemsAt(n).filter(id=>id!=='curtain1'||!S.free);
function checkLevel(){
  const l=vLv();if(S.lv>l)return;/* 必要なパワーをふやしても、いまの村レベルは下げない */const old=S.lv||1,priorUnlocks={...(S.unlocked||{})},priorRecipes={...(S.recipes||{})};
  for(let n=2;n<=l;n++)for(const id of visibleLevelRewardsAt(n)){if(BL[id].kind==='block')S.unlocked[id]=true;else if(id==='curtain1'&&!S.free){S.recipes||(S.recipes={});S.recipes[id]=true}}
  if(l>=2)S.unlocked.path=true;
  if(l>=4&&!S.free){S.unlocked.window=true;S.recipes||(S.recipes={});S.guardianIdeas||(S.guardianIdeas={});S.recipes.window=true;S.guardianIdeas.window=true}
  if(l>old){sfx('level');const allOpen=[];let allBonus=0;for(let n=old+1;n<=l;n++){const bonus=0;const opens=visibleLevelRewardsAt(n).filter(id=>BL[id].kind==='block'?!priorUnlocks[id]:!priorRecipes[id]);allOpen.push(...opens);allBonus+=bonus}
    S.lv=l;memo('🏡','村レベル'+l+'になった');renderPalette();if(sheet){if(LVQ){LVQ[1]+=allBonus;LVQ[2].push(...allOpen);LVQ[0]=l}else LVQ=[l,allBonus,allOpen]}else lvShow(l,allBonus,allOpen);
  }else S.lv=l;
}

/* ---------- 世界の時間 ---------- */
// 重なりよけ：作業中・止まっている子は動かさず、歩いている子のほうがよける
function sepRes(dt){// 移動中は重なってOK、止まって作業している子どうしは重ならない
  const L=S.res.filter(r=>!r.hidden&&!(r.act&&(r.act.type==='tag'||r.act.stage==='walk'))&&!(r.path&&r.path.length)),R=.55;
  const wt=r=>r.ghost>0?0:!r.act||r.act.stage==='walk'?(r.path&&r.path.length?1:.7):r.act.stand>=0?0:.5;
  for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const p=L[a],q=L[b];let dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d>=R)continue;
    let wp=wt(p),wq=wt(q);if((wp===0)!==(wq===0))continue;if(wp+wq<=0){if(d>.35)continue;wp=wq=.5}
    if(d<1e-4){const an=(p.id*7+q.id*13)%6.28;dx=Math.cos(an);dy=Math.sin(an);d=0}else{dx/=d;dy/=d}
    const m=Math.min(R-d,.6*dt+.03);
    const mv=(r,sx,sy)=>{const nx=r.x+sx,ny=r.y+sy;if(walk((ny|0)*W+(nx|0))){r.x=nx;r.y=ny}};
    if(p.ghost>0||q.ghost>0)continue;
    const side=(r,sx,sy,k)=>{if(r.path&&r.path.length){const j=r.path[0],hx=j%W+.5-r.x,hy=((j/W)|0)+.5-r.y,hl=Math.hypot(hx,hy)||1,ux=hx/hl,uy=hy/hl;
        const dot=sx*ux+sy*uy;if(dot<0){sx-=dot*ux;sy-=dot*uy;const pl=Math.hypot(sx,sy);if(pl<1e-3){sx=-uy;sy=ux}else{sx/=pl;sy/=pl}}}
      mv(r,sx*k,sy*k)};
    side(p,-dx,-dy,m*wp/(wp+wq));side(q,dx,dy,m*wq/(wp+wq))}}
const DAYLEN=1.5;/* 1日の長さ：せいれいが動く時間の1.5倍で、時計が1分すすむ */
function stepWorld(dt){if((SUBT+=dt)>1){SUBT=0;checkSub();checkSev();guardTick()}
  st2Tick();fireTick(dt/DAYLEN);
  const prevH=hour(),t0=S.t;let nt=S.t+dt/DAYLEN;// 時計：夜も昼と同じ速さ（1日は1.5倍の長さ）
  if(!S.enemyOn){const c=clk(),cap=Math.floor(c/1440)*1440+18*60,nc=c+(nt-S.t);if(nc>cap)S.hold=(S.hold||0)+Math.min(nt-S.t,nc-cap)}/* チュートリアルで夜がはじまるまで、時計（朝・昼・夜）は18時で止めておく。せいれいの動きにつかう時間（S.t）は進める */S.t=nt;const h=hour();
  for(const k in S.dyn){const o=S.obj[k],d=S.dyn[k];if(!o)continue;
    if(o==='farm'){if((S.rain||NEARWELL.has(+k))&&d.g<100)d.wet=100}}/* 雨・井戸のそば：たねをまく前の畑も、ぬれる *//* ベリー・りんごの実は、朝6時に1日ぶんずつ育つ（morning） */
  for(const r of S.res.slice())updRes(r,dt);
  sepRes(dt);
  for(const e of S.enemies)updEnemy(e,dt);
  updTowers(dt);
  if(S.nushi)updNushi(dt);
  if(prevH<6&&h>=6&&S.nightHad){S.nightHad=false;const left=S.enemies.length;{const t0=performance.now();for(const e of S.enemies)if(e.spawned&&!e.dead)EVAP.push({e,t0:t0+Math.random()*500})}if(left)sfx('evap');S.enemies=[];
    if(S.ns&&!S.nightHurt){const rw=Math.min(10,3+Math.floor((S.nights||0)/2));S.ns.rw=rw;if(!S.flags.safeMemo){S.flags.safeMemo=1;memo('🌙','はじめて夜をぶじに守りきった')}S.pt+=rw;S.totalPt+=rw;for(const r of S.res)r.fun=Math.min(100,r.fun+10)}/* けがも被害もない夜は、ごほうび（パワーと、みんなのたのしさ） */
    if(S.ns&&S.ns.final&&!S.cleared&&WD===1){const t=st2(),ok=springN()>=2;t.frz={};t.cool=null;S.finalNight=false;if(ok){S.flags.nushiDue=1;setTimeout(()=>{if(!S.cleared)nushiReturns()},1800)}else{S.finalLost=dayNo();S.finalRetry=dayNo()+3;memo('🌋','温泉を守りきれなかった');setTimeout(()=>toast('火の山は、まだあばれている…','warn'),1500)}}/* 火山のふもと：朝に、あたたかい温泉が2つ以上のこっていれば勝ち。冷えた温泉は、朝にもどる */
    else if(S.ns&&S.ns.final&&!S.cleared&&!(S.ns.b2&&S.obj.includes('tower'))){S.finalNight=false;S.finalLost=dayNo();if(WD)S.finalRetry=dayNo()+3;else{S.finalDay=dayNo()+3;S.finalHint=3}memo('🌑','ヨルノオオカゲを追いはらえなかった');setTimeout(()=>toast('ヨルノオオカゲは、まだどこかにいる…','warn'),1500)}/* ヨルノオオカゲを追いはらえなかったか、台座をこわされたら負け。3日あとにまた来る */else if(S.ns&&S.ns.final&&!S.cleared){S.finalNight=false;if(WD){S.flags.nushiDue=1;setTimeout(()=>{if(!S.cleared)nushiReturns()},1800)}/* 火山のふもとには、フタバはいない */else if(!S.flags.finalWon){S.flags.finalWon=1;const b=S.b2At||{x:CX+.5,y:CY+.5};dropAt(b.x,b.y,'shard');memo('💎','ヨルノオオカゲが消えたところに、光るものがのこっていた');setTimeout(()=>toast('ヨルノオオカゲが消えたところに、なにかが光っている……','good'),1500)}/* かけらは、ヨルノオオカゲが消えた場所に落ちる。フタバがひろう */}/* 最後の夜をこえたら、かけらが出て、台座にはめるとヌシ様がもどる */if(S.ns&&S.ns.trial){const ok=S.ns.kill>=S.ns.n;S.ns.trialOK=ok;if(ok){S.trials=(S.trials||0)+1;S.pt+=60;S.totalPt+=60;S.mebuki=(S.mebuki||0)+1;memo('🏆','「コワイノ」の試練をのりこえた')}}
    if(S.ns){S.ns.left=left;if(!sheet)openSheet('night');else toast(S.nightHurt?'朝日がのぼって、「コワイノ」は'+(left?'消えていった':'いなくなった'):'夜をぶじに守りきった！','good')}
    else if(!S.nightHurt)toast('夜をぶじに守りきった！','good');else toast('朝日がのぼって、「コワイノ」は'+(left?'消えていった':'いなくなった'))}
  if((prevH|0)!==(h|0)&&h>=7&&h<23){trapCheck();graveCheck();sparkTick();festGift()}/* 1時間に1回、とじこめられた子がいないか見る */
  if(prevH<6&&h>=6&&S.lastMorning!==dayNo()){S.lastMorning=dayNo();morning();if(WD===1&&S.finalRetry!=null&&dayNo()>=S.finalRetry&&!S.cleared){S.finalRetry=null;S.finalNight=true}}/* 火山のふもと：負けたら3日あとの夜にまた来る *//* 1日のリセットは朝6時にまとめて */
  if(prevH<7&&h>=7&&S.festDay===dayNo())festBegin();
  if(prevH<8&&h>=8&&S.godGone&&!S.cleared&&!S.godVisit&&dayNo()>=(S.godNextVisitDay||1)&&Math.random()<(cnt('kamizo')?.5:.25)){S.godVisit=true;S.godNextVisitDay=dayNo()+2;/* 来た翌日は休み。像があれば来訪率は50% */sfx('arrive');toast('カミサマが遊びにきた！','good')}
  if(prevH<6&&h>=6&&S.godVisit&&!festOn()){S.godVisit=false;S.godNextVisitDay=Math.max(S.godNextVisitDay||0,dayNo()+2);toast('カミサマは帰っていった')}/* おまつりの日に来ていたカミサマは、おまつりがおわる朝6時に帰る */
  if(prevH<18&&h>=18&&S.godVisit&&!festOn()){S.godVisit=false;S.godNextVisitDay=Math.max(S.godNextVisitDay||0,dayNo()+2);toast('カミサマは帰っていった')}
  if(prevH<20&&h>=20&&S.enemyOn&&S.lastWarn!==dayNo()){S.lastWarn=dayNo();S.wave=waveFor(dayNo()+1);if(S.wipe&&S.res.length>=5)S.wipe=false;if(S.finalNight&&!S.cleared&&WD===1){S.finalNight=false;S.finalOn=true;const t=st2();t.cool={a:40,b:40,c:40};t.frz={};S.wave=['yama','ash','ash','ash','ash','rockc','rockc'].concat(S.wave.filter(t=>!EN[t].boss));/* 人数が少ない夜の上限でけずられるのは、あとのふつうの敵から */toast('今夜、火の山の影がおしよせてくる','warn')}/* 火山のふもとの最後の夜：温泉を朝まで守る */
    else if(S.finalNight&&!S.cleared&&!S.flags.finalWon&&!WD&&(S.rushN||0)<2&&S.res.some(r=>r.name===POKO)){S.finalNight=false;S.rushN=(S.rushN||0)+1;S.rushOn=true;S.wave=(S.rushN===1?['boss','brute','brute','breaker','fast','fast']:['boss','brute','brute','brute','breaker','breaker','trapper','fast','fast']).concat(S.wave.filter(t=>!EN[t].boss));toast(S.rushN===1?'今夜、影の群れが台座をめざしてやってくる！':'ゆうべより大きな群れが来る……！','warn')}/* 最後の夜の前の2晩は、強い影がたくさんおしよせる */
    else if(S.finalNight&&!S.cleared&&!S.flags.finalWon&&(WD||S.res.some(r=>r.name===POKO))){S.finalNight=false;S.finalDay=null;S.finalOn=true;/* 予告の日をけして、夜のあいだにもう一度始まらないようにする *//* フタバがいない夜は、ヨルノオオカゲは来ない */S.wave=['boss2','boss'].concat(S.wave.filter(t=>t!=='boss'&&t!=='boss2'),['brute','brute','fast','fast','breaker']);}else if(S.trial){S.trialOn=true;S.trial=false;S.wave=['boss'].concat(S.wave.filter(t=>t!=='boss'),['brute','brute','fast','fast'])}else if(S.today==='odayaka'){const bo=S.wave.filter(t=>t==='boss'),ot=S.wave.filter(t=>t!=='boss');S.wave=bo.concat(ot.slice(0,Math.ceil(ot.length/2)))}/* 「コワイノ」の予告はしない */}
  if(prevH<3&&h>=3)for(const H of HOUSES){const L=S.res.filter(x=>x.act&&(x.act.type==='sleep'||x.act.type==='stay')&&H.set.has((x.y|0)*W+(x.x|0)));if(houseComfort(H).over)for(const x of L){x.energy=Math.min(x.energy,60);x.fun=Math.max(0,x.fun-15);x.crowd=dayNo()}else if(L.length){const C=houseComfort(H);for(const x of L){const c=comfyFor(H,x,C);if(c>=180){x.fun=Math.min(100,x.fun+10);x.comfy=dayNo()}else if(c<90)x.fun=Math.max(0,x.fun-5)}}}/* 住み心地がいいと、ぐっすり眠れる *//* 家につめこむと、きゅうくつで眠れない */
  if(prevH>h&&S.enemyOn&&S.wave&&S.lastNight!==dayNo()-1){S.lastNight=dayNo()-1;/* 「コワイノ」は夜12時に来る（前の日の夜としてかぞえる） */S.nights++;let w=S.wave;S.wave=null;const rn=S.res.length;if(!S.rushOn)w=w.filter(t=>EN[t].boss&&!S.wipe).concat(w.filter(t=>!EN[t].boss).slice(0,Math.floor(rn*1.5)));/* ふつうのコワイノは、せいれいの数の1.5倍（小数点以下切りすて）まで *//* せいれいが少ない夜は、コワイノの数に上限：1人1体・2人2体・3人3体・4人4体・5人6体・6人7体（火山のふもとは1人3体・2人4体・3人5体・4人6体・5人8体・6人9体）（全滅のあと5人そろうまでは、オオカゲも来ない） */if(w.length)spawnWave(w)}
  if(S.seedDay!==dayNo()&&h>=6){S.seedDay=dayNo();const n=Math.random()<.5?1:0,b=S.t-S.t%1440;S.seeds=[];S.seedPlan=Array.from({length:n},()=>b+360+Math.random()*720).sort((x,y)=>x-y)}/* ふしぎな種は1日1こまで（50%）。ひろわなかったら、あしたには消える */
  if(S.seedPlan&&S.seedPlan.length&&S.t>=S.seedPlan[0]){S.seedPlan.shift();spawnSeed()}
  /* 守り神の光で木や岩から素材を落とせる話（10分ごとに、話せるか見る） */if(S.finds)delete S.finds;/* 前の「ひろいもの」は、もう使わない */
  if(prevH<3&&h>=3&&S.today==='hoshi')for(const r of S.res)if(r.act&&r.act.type==='sleep')r.fun=Math.min(100,r.fun+15);
}
const FREEG=[{k:'g900',t:'みどりのマスを900に',now:()=>GRASSN,ok:()=>GRASSN>=900,rw:30},{k:'r15',t:'せいれいを15人に',now:()=>S.res.length,ok:()=>S.res.length>=15,rw:30},{k:'fl30',t:'花を30こさかせる',now:()=>flowerN(),ok:()=>flowerN()>=30,rw:40},
  {k:'h3',t:'家を3けん',now:()=>HOUSES.length,ok:()=>HOUSES.length>=3,rw:30},{k:'m3',t:'なかよしを3組',now:()=>{let n=0;for(const r of S.res)if(bestMate(r))n++;return Math.floor(n/2)},ok:()=>{let n=0;for(const r of S.res)if(bestMate(r))n++;return n>=6},rw:30},
  {k:'b5',t:'オオカゲを5回追いはらう',now:()=>S.bossKills||0,ok:()=>(S.bossKills||0)>=5,rw:50},{k:'lv5',t:'Lv5のせいれいを5人',now:()=>S.res.filter(r=>rLv(r)>=5).length,ok:()=>S.res.filter(r=>rLv(r)>=5).length>=5,rw:40},
  {k:'vlv15',t:'村レベルを15に',now:()=>S.lv,ok:()=>S.lv>=15,rw:100},{k:'h5',t:'家を5けん',now:()=>HOUSES.length,ok:()=>HOUSES.length>=5,rw:60},{k:'fl80',t:'花を80こさかせる',now:()=>flowerN(),ok:()=>flowerN()>=80,rw:60},
  {k:'k300',t:'コワイノを300体追いはらう',now:()=>S.kills||0,ok:()=>(S.kills||0)>=300,rw:80},{k:'tr3',t:'「コワイノ」の試練を3回のりこえる',now:()=>S.trials||0,ok:()=>(S.trials||0)>=3,rw:60},{k:'p20k',t:'パワーを合計20000ためる',now:()=>S.totalPt||0,ok:()=>(S.totalPt||0)>=20000,rw:150}];/* クリア後のじゆうな目標（長い目標） */
const AFTERQ=[/* クリア後の新しいクエスト：カミサマからのおねがい。ひとつずつ出る。数は、うけたときからふえた分（d）。w：その土地だけ */
  {k:'aq1',w:1,t:'お祝いのおまつりをひらこう',how:'カミサマと交換の「とくべつな交換」で「おまつり」をえらぶ。このクエストをうけたあとに、ひらいた回数で数える',now:()=>S.festN||0,d:1,rw:30,
   L:[[GOD,'#joy|ヌシ様が帰ってきたお祝いを、まだしとらんかったのう。'],[GOD,'みんなで、にぎやかにおまつりをせんか？ わしも、たのしみにしとるぞい。']],X:[[GOD,'#joy|ほっほ、いいおまつりじゃったのう！ みんな、いい顔をしとったわい。']]},
  {k:'aq2',t:'家を、あと2けんふやそう',how:'家の壁とドアで、家をつくる',now:()=>HOUSES.length,d:2,rw:50,
   L:[[GOD,'なかまがふえても、みんなが安心してねむれるように、家をふやしてやらんか？']],X:[[GOD,'#nod|うむ。どの家からも、ねいきが聞こえてきそうじゃ。']]},
  {k:'aq3',t:'せいれいを、あと3人ふやそう',how:'属性の力をため、朝に神殿の「！」からなかまを呼ぶ',now:()=>S.res.length,d:3,rw:50,
   L:[[GOD,'この土地が元気になったら、新しいせいれいも、きっと来たがるはずじゃ。'],[GOD,'力をためて、なかまを呼んでやるんじゃぞ。']],X:[[GOD,'#joy|にぎやかになったのう！ わしも、声をかけるのがたいへんじゃ。']]},
  {k:'aq4',t:'村レベルを、あと2上げよう',how:'せいれいが満足してパワーがたまると、村レベルが上がる（いちばん上は15）',now:()=>S.lv,d:2,max:15,rw:60,
   L:[[GOD,'村が育つほど、せいれいたちも、のびのびくらせる。もっと、すみやすい村にしてみんか？']],X:[[GOD,'#joy|りっぱな村になったのう。ヌシ様も、きっとよろこんどるぞい。']]},
  {k:'aq5',t:'木材と石材を、合わせて200あつめよう',how:'せいれいが木を切り、石をほって、素材箱にためる',now:()=>((S.gotMat||{}).wood||0)+((S.gotMat||{}).stone||0),d:200,rw:40,
   L:[[GOD,'#think|……そうじゃ。いつか大きな物を作るとき、たくわえがあると心強いのう。']],X:[[GOD,'#nod|これだけあれば、なにを作るにもこまらんわい。']]}];
const aqGoal=q=>q.max!=null?Math.min(q.max,(S.aqB??q.now())+q.d):(S.aqB??q.now())+q.d;/* うけたときの数＋d（いちばん上があれば、そこまで） */
const aqProg=q=>'いま '+Math.max(0,q.now()-(S.aqB??q.now()))+' / '+Math.max(0,aqGoal(q)-(S.aqB??q.now()));
const DAILYG=[/* クリア後の「きょうの目標」：毎朝2つ。b＝その朝からふえた数で数える。s＝いまの数で数える */
  {k:'pt',t:'パワーを40ためる',b:()=>S.totalPt||0,n:40,rw:15},{k:'wood',t:'木材を20あつめる',b:()=>(S.gotMat||{}).wood||0,n:20,rw:15},{k:'stone',t:'石材を15あつめる',b:()=>(S.gotMat||{}).stone||0,n:15,rw:15},
  {k:'kill',t:'コワイノを5体追いはらう',b:()=>S.kills||0,n:5,rw:20},{k:'cook',t:'料理を3つ作る',b:()=>S.cookN||0,n:3,rw:15},
  {k:'food',t:'食料箱に食べ物を30こ入れる',s:()=>S.food,n:30,rw:15},{k:'fun',t:'みんなのたのしさを70より上にする',s:()=>S.res.length&&S.res.every(r=>r.fun>70)?1:0,n:1,rw:15}];
function dailyNow(g,d){return g.b?g.b()-(d.b0[g.k]||0):g.s()}
function dailySet(){const day=dayNo(),i=(day*2)%DAILYG.length,L=[DAILYG[i],DAILYG[(i+1)%DAILYG.length]];S.daily={d:day,k:L.map(g=>g.k),b0:Object.fromEntries(L.filter(g=>g.b).map(g=>[g.k,g.b()])),done:{}}}/* 毎朝、きょうの目標を2つ出す */
function dailyCheck(){const d=S.daily;if(!d)return;for(const k of d.k){const g=DAILYG.find(x=>x.k===k);if(g&&!d.done[k]&&dailyNow(g,d)>=g.n){d.done[k]=1;S.pt+=g.rw;S.totalPt+=g.rw;toast('きょうの目標たっせい：'+g.t+'（パワー+'+g.rw+'）','good')}}}
function afterTick(){/* クリア後：新しいクエスト・きょうの目標・長い目標（昼だけ） */if(isNight()||!$('#dialog').hidden||NEWRES!=null)return;if(!S.daily||S.daily.d!==dayNo())dailySet();dailyCheck();checkFree();
  const i=S.aq||0,q=AFTERQ[i];if(!q)return;if(q.w!=null&&q.w!==WD){S.aq=i+1;return}/* その土地のクエストではない */if(S.aqOn!==i){S.aqOn=-1;let once=0;dialog(q.L,()=>{if(once++)return;S.aqOn=i;S.aqB=q.now();sfx('quest');toast('クエスト：'+q.t,'good');renderQuest()});return}
  if(S.aqB==null)S.aqB=q.now();/* 前のセーブ：いまから数える */if(q.now()>=aqGoal(q)){let once=0;dialog(q.X,()=>{if(once++)return;S.aq=i+1;S.aqB=null;S.pt+=q.rw;S.totalPt+=q.rw;toast('ごほうび：パワー+'+q.rw,'good');memo('🎯',q.t);renderQuest()})}}
const TRAPS=['spike','sticky','puddle','firetrap','gust'],CN=a=>a.reduce((n,k)=>n+cnt(k),0),FOODN=()=>Object.values(S.fs||{}).reduce((n,v)=>n+v,0);
const outCnt=ids=>{const ins=new Set(HOUSES.flatMap(h=>[...h.inside]));let n=0;S.obj.forEach((o,j)=>{if(ids.has(o)&&!ins.has(j))n++});return n};/* 家の外にある数 */
function houseBedCount(){const cells=new Set(HOUSES.flatMap(h=>[...h.inside]));return [...cells].filter(j=>BEDSET.has(S.obj[j])).length}
function diningSeatCount(){return S.obj.reduce((n,o,j)=>n+(SEATS.includes(o)&&[-1,1,-W,W].some(d=>{const k=j+d;return k>=0&&k<W*H&&Math.abs(k%W-j%W)+Math.abs((k/W|0)-(j/W|0))===1&&S.obj[k]==='table'})),0)}
const waitingBellflowers=()=>WD===0&&qAt('kikyo')&&cnt('bellf')>0&&bloomCount('bellf')<2&&!S.flags.minaCame;
const yoganUp=()=>Object.keys(S.hp).some(k=>k[0]==='L'&&S.hp[k]>=2&&S.obj[+k.slice(1)]==='yogan');/* ようがん台を強化した */
const houseFood=()=>HOUSES.some(h=>[...h.inside].some(j=>storageAt(j,'food')));/* 家の中に食べ物の箱がある */
const SUBQ=[/* サブクエスト：メインと別に、いつでもできるおねがい。at=出てくる条件 */
  {k:'seedwait_gate',w:0,g:'wood',t:'柵に出入り口をつくろう',how:'柵の途中を「こわす」で1マス戻し、依頼ボードの「道・囲い」で柵のドアをはる。できたら空いた場所に置く',L:[['K','ききょうがさくまで、もうすこしかかりそう。そのあいだに、村をひと回りしてこようっと。'],['K','#think|……あれ？ この柵、ぐるっと遠回りしないと、むこうに出られないや。'],['K','通るときだけ開くところがあったら、すぐ行き来できるのにな。']],X:[['K','ぱたん、って開いた！ こっちからも出られるね。'],['K','#joy|守り神さま、ありがとう！']],at:()=>waitingBellflowers(),ok:()=>cnt('gate')>=1,n:1,now:()=>cnt('gate'),rw:5},
  {k:'seedwait_food',w:0,g:'wood',t:'朝のごはんを10こ用意しよう',how:'フタバがベリーの茂みから実を集め、食料箱へ運ぶのを手伝おう。食料箱の食べ物を10こ以上にする',L:[['K','なかまが来てくれたら……いっしょにごはん、食べたいな。'],['K','食料箱に、少し多めに入れておこうよ。ぼく、ベリーを集めてくる！']],X:[['K','これだけあれば、新しい子のぶんもあるね。'],['K','#joy|どんな子かなあ。……えへへ、たのしみ！']],at:()=>waitingBellflowers(),ok:()=>FOODN()>=10,n:10,now:()=>Math.min(10,FOODN()),rw:5},

  {k:'lighttry',w:0,g:'wood',t:'守り神の光で木や岩をこわそう',how:'守りの光のボタンをおしてから、木か岩をタップ。何回かあてると、木材・石材が1こ落ちる（1回パワー1）',L:[['K','#think|ねえ、守り神さま。木材や石材、もっとたくさんあったらいいのにね。'],['K','#surprise|……そうだ！ 守り神さまの光、木や岩にもあてられないかな？'],['K','#joy|光があたったら、木ぎれや石ころが、ころんって落ちてくるかも。そしたら、ぼくたちがひろって、箱にしまうよ！']],X:[['K','#surprise|ほんとに、ころんって落ちてきた！'],['K','#joy|ひろって、箱にしまっておくね。守り神さま、ありがとう！']],at:()=>(S.nights||0)>=1&&!isNight(),ok:()=>!!S.flags.lightBroke,rw:5},/* はじめての夜をこえたら、フタバが守りの光を木や岩にあててみてとたのむ */
  {k:'benchbreak',w:0,g:'wood',t:'外にベンチを置こう',how:'依頼ボードの「庭」でベンチをはり、できたら外に置く。昼の休けいやおしゃべりでパワーがもらえる',L:[['K','歩きまわってたら、足がくたくたになっちゃった。'],['K','外でも、ちょこんと座ってひと休みできたらいいな。'],['@idea']],X:[['K','ここなら、足をのばして休めるね。ふう……。'],['K','#joy|守り神さま、ありがとう！']],learn:['bench'],at:()=>qAt('lv2')||qAt('wall')&&!isNight()&&(hour()>=18||S.res.some(r=>r.name===POKO&&r.energy<50)),/* フタバのつかれがたまったら（げんき50より下）、おそくても夕方18時に出てくる（1日目は、ベッドの前に18時で時計が止まる） */ok:()=>outCnt(BENCHES)>=1,n:1,now:()=>outCnt(BENCHES),rw:5},
  {k:'salvia3',how:'「おく」→「サルビアの種」を置く。せいれいに植えてもらい、花が咲くのを待とう',g:'earth',L:[['K','火の力をためるなら、赤いサルビアがいいよぉ。'],['K','種、あげるねぇ。5本植えたら、きっとぽかぽかだよぉ。']],X:[['K','まっかなサルビアが5本も増えたねぇ。火の力、たまってきたよぉ。'],['K','#joy|サルビアを咲かせてくれて、ありがとうねぇ。火のなかまも、きっとよろこぶよぉ。']],w:0,t:'サルビアを5本植えよう',ln:'赤いサルビアは、火の力をためてくれるよぉ。種、あげるねぇ',at:()=>qAt('fire'),give:{salvia:5},base:()=>cnt('salvia'),ok:()=>bloomCount('salvia')-((S.subB||{}).salvia3||0)>=5,n:5,now:()=>Math.max(0,bloomCount('salvia')-((S.subB||{}).salvia3||0)),rw:10},
  /* lv_〇〇：村レベル待ち。建物は村レベルを案内する。家具（toy2・jar2・parasol）は、むかしのセーブの報告待ちのためだけに残す */
  {k:'lv_watch2',how:'せいれいがくらしていると、村レベルが上がる',w:0,g:'wood',L:[["K","お願いしたいことがあるんだけど、まだ村がちいさいみたい！"],["K","村がもっと育ったら、おねがいするね！"]],X:[["K","#joy|村、大きくなったね！ やったね、ありがとう！"]],t:'村レベルを2にしよう',at:()=>(qAt('fire'))&&(S.lv<2||(S.subSt||{}).lv_watch2>=2),ok:()=>S.lv>=2,n:2,rw:3,now:()=>S.lv},
 {k:'watch2',how:'「おく」→「見張り台」を置き、合計2つにしよう。せいれいが建てるのを待とう',g:'wood',L:[["K", "あの光が飛んでいくところ、見てると安心するね！"], ["K", "でも、向こうのはしは、ちょっと暗いままなんだ。あっちも守れたらいいなあ。"],['@idea']],X:[['K','見張り台が2つになった！ これで夜も、ちょっと安心だね！'],['K','#joy|あっちへ行く道がすぐわかる目印もあるとうれしいね。'],['K','#joy|見張り台をもうひとつ建ててくれて、ありがとう！ 夜も、ぼくたち安心だね！']],w:0,t:'見張り台を2つにしよう',ln:"向こうのはしも、安心して過ごせたらいいな",at:()=>(qAt('fire'))&&S.lv>=2,ok:()=>cnt('watch')>=2,n:2,now:()=>cnt('watch'),rw:15},
  {k:'watchup',how:'見張り台をタップして「強化する」をえらぶ。パワーと素材を使う',g:'wood',L:[['K','オオカゲって、どのくらい強いのかな……。'],['K','見張り台の光の矢が、もっと強くなったら、安心して眠れるのになあ。']],X:[['K','見張り台が、ぴかっと強くなった！'],['K','#joy|これなら、オオカゲが来ても、きっとだいじょうぶ。守り神さま、ありがとう！']],w:0,t:'見張り台を強くしよう',ln:'見張り台の光の矢、もっと強くならないかな',at:()=>qAt('ookage')&&!watchUp(),ok:()=>watchUp(),n:1,now:()=>watchUp()?1:0,rw:15},
  {k:'stor2',how:'神殿の依頼ボードをタップ →「収納」→「食料箱」をはる。できたら「おく」で置く',g:'wood',w:0,L:[['K','土地が広くなったね！ ごはんをしまう場所も、もっとほしいな。'],['K','食料箱をもう1つ、ふやせないかな？']],X:[['K','食料箱が2つ！ 食べものがいっぱい入るね！'],['K','#joy|守り神さま、ありがとう！']],t:'食料箱を2つにしよう',ln:'食料箱がもう1つあると安心だな',at:()=>qAt('baseUp'),ok:()=>cnt('stor')>=2,n:2,now:()=>cnt('stor'),rw:15},
  {k:'mbox2',how:'神殿の依頼ボードをタップ →「収納」→「素材箱」をはる。できたら「おく」で置く',g:'earth',w:0,L:[['K','木材も石材も、ふえてきたねぇ。'],['K','素材箱がもう1つあったら、あふれずにすむよぉ。']],X:[['K','素材箱が2つだぁ。ぜんぶしまえて、すっきりだねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'素材箱を2つにしよう',ln:'素材箱がもう1つほしいねぇ',at:()=>elemCount('water')>=1,ok:()=>cnt('mbox')>=2,n:2,now:()=>cnt('mbox'),rw:15},
  {k:'housefood',w:0,how:'神殿の依頼ボードをタップ →「収納」→「食料箱」をはる。できたら「おく」で家の中に置く',g:'earth',L:[['K','#alarm|夜、「コワイノ」からにげてるときにねぇ、おなかがすいて、外の食料箱まで走っちゃう子がいるんだよぉ。'],['K','家の中に食料箱があったら、外に出なくても食べられるのにねぇ。']],X:[['K','これで、夜におなかがすいても、家の中で食べられるねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'家の中に食料箱を置こう',ln:'夜も、家の中でごはんが食べられたらいいねぇ',at:()=>HOUSES.length>0&&S.res.length>=3&&!houseFood(),ok:()=>houseFood(),n:1,now:()=>houseFood()?1:0,rw:15},
  {k:'oldhouse',w:1,how:'「おく」→「オークの壁」をえらんで、南西の古い家のこわれた壁（下の3か所）に置く',g:'fire',L:[['K','南西の古い家、壁がくずれてるだろ？'],['K','あそこ、直してやりたいんだ。手を貸しておくれよ。']],X:[['K','#joy|よし、これで家になった！'],['K','ありがとよ、守り神。']],t:'古い家の壁を直そう',ln:'古い家を直せば、夜も安心なんだけどね',at:()=>!!S.enemyOn&&!HOUSES.length,ok:()=>HOUSES.length>0,n:1,now:()=>HOUSES.length?1:0,rw:10},
  {k:'yogan1',w:1,how:'「おく」→「ようがん台」を置く。せいれいが建てるのを待とう（石40・木5がいる）',g:'fire',L:[['K','ゆうべは、あぶなかったね。'],['K','#alarm|火山の石で「ようがん台」を作れば、火の玉で「コワイノ」を追いはらえるんだ。'],['K','石をあつめて、建ててみないかい？']],X:[['K','#joy|ようがん台ができた！ これで夜も、こっちから戦えるね。'],['K','ありがとよ、守り神。']],t:'ようがん台を置こう',ln:'ようがん台があれば、夜も戦えるんだけどね',at:()=>(S.nights||0)>=1&&!!S.flags.yoganLearned&&cnt('yogan')<1,ok:()=>cnt('yogan')>=1,n:1,now:()=>cnt('yogan'),rw:15},
  {k:'bossfood',w:0,how:'せいれいが木の実や畑でとってきた食べ物が、食料箱にたまる。おつげの「食料をあつめる」も使える',g:'earth',L:[['K','オオカゲが来る夜は、きっと長くなるよぉ。'],['K','おなかがすいても困らないように、食べ物をたっぷりためておこうねぇ。']],X:[['K','これだけあれば、長い夜でも安心だねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'食べ物を30こためよう',ln:'長い夜にそなえて、食べ物をためておきたいねぇ',at:()=>qAt('ookage'),ok:()=>FOODN()>=30,n:30,now:()=>FOODN(),rw:10},
  {k:'twbox0',w:0,how:'神殿の依頼ボードをタップ →「収納」→「素材箱」などをはる。素材箱1つに50こ入る',g:'earth',L:[['K','台座の木と石を、ぜんぶしまっておけるかなぁ。'],['K','素材箱を、もう少しふやしておこうねぇ。']],X:[['K','これで、台座の素材もぜんぶしまえるねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'素材箱に150こ入るようにしよう',ln:'台座の素材を、しまっておく場所がほしいねぇ',at:()=>qAt('tower')&&matCap()<150,ok:()=>matCap()>=150,n:150,now:()=>matCap(),rw:10},
  {k:'twwood0',w:0,how:'せいれいが木をきって、木材をあつめる。おつげの「木をあつめる」や、伐採場でもふえる',g:'wood',L:[['K','台座って、すごく大きいんだって！'],['K','木材が100こいるんだ。みんなで、いっぱいあつめよう！']],X:[['K','木材が100こたまった！ 台座、建てられそうだね！'],['K','#joy|守り神さま、ありがとう！']],t:'木材を100こためよう',ln:'台座のために、木材をいっぱいあつめたいな',at:()=>false,/* 台座のときは、伐採場・採石場のおねがいを出す（前のセーブで受けたぶんだけ残す） */ok:()=>(S.mat.wood||0)>=100,n:100,now:()=>S.mat.wood||0,rw:10},
  {k:'twstone0',w:0,how:'せいれいが岩をほって、石材をあつめる。おつげの「石をあつめる」や、採石場でもふえる',g:'earth',L:[['K','台座の土台には、石材が50こいるんだよぉ。'],['K','岩をほって、少しずつためていこうねぇ。']],X:[['K','石材が50こ、そろったねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'石材を50こためよう',ln:'台座の土台にする石材を、ためておきたいねぇ',at:()=>false,ok:()=>(S.mat.stone||0)>=50,n:50,now:()=>S.mat.stone||0,rw:10},
  {k:'festdeco',w:0,how:'神殿の依頼ボードをタップ →「庭」→生垣などをはる。できたら「おく」で置く',g:'wood',L:[['K','ヌシ様をむかえる日まで、あと少しだね！'],['K','おまつりみたいに、村をかざりたいな！ かざりを、あと5つ置けないかな？']],X:[['K','村が、おまつりみたいになった！ ヌシ様、よろこんでくれるかな。'],['K','#joy|守り神さま、ありがとう！']],t:'おまつりのかざりをあと5つ置こう',ln:'ヌシ様をむかえる前に、村をかざりたいな',at:()=>!!S.finalDay&&!S.cleared,ok:()=>CN(['hedge','birdbath','parasol','arch','signpost','monstera'])-((S.subB||{}).festdeco||0)>=5,n:5,now:()=>Math.max(0,CN(['hedge','birdbath','parasol','arch','signpost','monstera'])-((S.subB||{}).festdeco||0)),base:()=>CN(['hedge','birdbath','parasol','arch','signpost','monstera']),rw:20},
  {k:'festlight',w:0,how:'神殿の依頼ボードをタップ →「あかり」→たいまつやランタンなどをはる。できたら「おく」で置く',g:'fire',L:[['K','ヌシ様が来る道、明るくしておきたいね。'],['K','#nod|あかりを、あと5つふやそうじゃないか。']],X:[['K','よし、村じゅうが明るくなった！ これならヌシ様も、まよわないね。'],['K','ありがとよ、守り神。']],t:'あかりをあと5つ置こう',ln:'ヌシ様が来る道を、明るくしておきたいね',at:()=>!!S.finalDay&&!S.cleared,ok:()=>CN(['torch','lamp','campfire','lantern','candle'])-((S.subB||{}).festlight||0)>=5,n:5,now:()=>Math.max(0,CN(['torch','lamp','campfire','lantern','candle'])-((S.subB||{}).festlight||0)),base:()=>CN(['torch','lamp','campfire','lantern','candle']),rw:20},
  {k:'bedall',w:0,how:'神殿の依頼ボードをタップ →「家具」→「ベッド」をはる。できたら「おく」で家の中に置く。家が足りなければ、家もふやそう',g:'earth',L:[['K','なかまが、どんどんふえてきたねぇ。'],['K','新しく来た子も、家のベッドで眠れるようにしてあげたいねぇ。']],X:[['K','みんなの分のベッドが、そろったねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'みんなのベッドを用意しよう',ln:'新しく来た子にも、ベッドを用意してあげたいねぇ',at:()=>S.res.length>=5&&!!(S.subDone||{}).bed3&&houseBedCount()<S.res.length,ok:()=>houseBedCount()>=S.res.length,get n(){return S?S.res.length:1},now:()=>houseBedCount(),rw:15},
  {k:'benchwood',w:1,how:'ベンチを置くと、木の力がたまる。たまった次の朝、神殿の「！」で木のせいれいを呼べる',g:'water',L:[['K','花を植えるのは、木のせいれいの役目なのです。'],['K','ベンチを置いて、みなさんがくつろぐと、木の力がたまるそうですよ。']],X:[['K','木の力が、たまりましたね。'],['K','#joy|守り神さま、ありがとうございます。']],t:'ベンチを置いて、木の力をためよう',ln:'木のせいれいに来てもらえたら、花が植えられるのですが',at:()=>qAt('ashiyu')&&elemCount('wood')<1&&(ATTR.wood||0)<needFor('wood'),ok:()=>elemCount('wood')>=1||(ATTR.wood||0)>=needFor('wood'),get n(){return S?needFor('wood'):1},now:()=>Math.floor(ATTR.wood||0),rw:10},
  {k:'yoganup',w:1,how:'ようがん台をタップして「強化する」をえらぶ。パワーと素材を使う',g:'fire',L:[['K','火山の上の、いやな気配……きっと大物が来るよ。'],['K','ようがん台を、もっと強くしておきたいね。']],X:[['K','ようがん台の火の玉、ひとまわり大きくなった！'],['K','これなら、大物が来ても、やりあえるよ。ありがとよ、守り神。']],t:'ようがん台を強くしよう',ln:'ようがん台を、もっと強くしておきたいね',at:()=>qAt('hinoookage')&&!yoganUp(),ok:()=>yoganUp(),n:1,now:()=>yoganUp()?1:0,rw:15},
  {k:'fbench2',w:1,how:'神殿の依頼ボードをタップ →「庭」→「ベンチ」をはる。できたら「おく」で外に置く',g:'fire',L:[['K','はたらきづめだと、くたびれちまうよ。'],['K','外にベンチがあったら、ひと休みできるんだけどね。2つあると、ならんでおしゃべりもできるさ。']],X:[['K','ふう、いい座りごこちだ。休むと、また力がわいてくるね。'],['K','ありがとよ、守り神。']],t:'外にベンチを2つ置こう',ln:'外でひと休みできる所がほしいね',at:()=>qAt('lv3'),ok:()=>outCnt(BENCHES)>=2,n:2,now:()=>outCnt(BENCHES),rw:10},
  {k:'fbed2',w:1,how:'神殿の依頼ボードをタップ →「家具」→「ベッド」をはる。できたら「おく」で家の中に置く',g:'water',L:[['K','夜は、まだ冷えますね。'],['K','#shocked|家の中に、ベッドがもう1つあれば、ふたりともあたたかく眠れるのですが。']],X:[['K','ふかふかです……。これで、ぐっすり眠れますね。'],['K','#joy|守り神さま、ありがとうございます。']],t:'家のベッドを2つにしよう',ln:'家の中で、あたたかく眠れたらいいのですが',at:()=>qAt('lv3')&&HOUSES.length>0,ok:()=>houseBedCount()>=2,n:2,now:()=>houseBedCount(),rw:10},
  {k:'twbox1',w:1,how:'神殿の依頼ボードをタップ →「収納」→「素材箱」などをはる。素材箱1つに50こ入る',g:'water',L:[['K','台座には、木材と石材がたくさんいるそうです。'],['K','ぜんぶしまえるように、素材箱をふやしておきましょう。']],X:[['K','これで、台座の素材もしまえますね。'],['K','#joy|守り神さま、ありがとうございます。']],t:'素材箱に225こ入るようにしよう',ln:'台座の素材を、しまっておく場所がほしいですね',at:()=>qAt('tower')&&matCap()<225,ok:()=>matCap()>=225,n:225,now:()=>matCap(),rw:10},
  {k:'twmat1',w:1,how:'せいれいが木をきったり、岩をほったりしてあつめる。カゲドロボウに盗まれないように、素材箱は村のおくに',g:'fire',L:[['K','台座には、木材150と石材75がいるんだってさ。'],['K','夜のカゲドロボウに盗まれないよう、気をつけてためていこうじゃないか。']],X:[['K','木材も石材も、そろったね！'],['K','ありがとよ、守り神。']],t:'木材150・石材75をためよう',ln:'台座の木材と石材を、ためておきたいね',at:()=>qAt('tower')&&((S.mat.wood||0)<150||(S.mat.stone||0)<75),ok:()=>(S.mat.wood||0)>=150&&(S.mat.stone||0)>=75,n:225,now:()=>Math.min(150,S.mat.wood||0)+Math.min(75,S.mat.stone||0),rw:15},
  {k:'chair2',how:'神殿の依頼ボードをタップ →「家具」→いすやスツールをはる。できたら「おく」で食卓の隣に置く',g:'wood',L:[["K", "#joy|食べ物に土がつかなくなったの、うれしいな！ でも、立ったまま食べてると足がつかれちゃう。"], ["K", "ごはんを食べるとき、ぼくも座れたらいいなあ。"],['@idea']],X:[["K", "#surprise|わあ、これなら座って食べられるね！"], ["K", "足もらくちん。ゆっくり食べようっと。"], ['K','#joy|いすを置いてくれて、ありがとう！ これで、ゆっくり座って食べられるね！']],t:'いすを2つ置こう',ln:"ごはんを食べるとき、ぼくも座れたらいいな",at:()=>cnt('table')>=1,ok:()=>diningSeatCount()>=2,n:2,now:()=>diningSeatCount(),rw:10},
  {k:'bed3',how:'神殿の依頼ボードをタップ →「家具」→「ベッド」をはる。できたら「おく」で家の中に置く',g:'earth',L:[["K", "なかまが3人になって、にぎやかだねぇ。"], ["K", "#think|……でもねぇ、まだ地面で寝ている子がいるんだよぉ。朝、背中が冷たそうでねぇ。"], ["K", "守り神さま、みんながあったかく眠れるように、してあげられないかなぁ。"],['@idea']],X:[["K", "ふかふかが、みんなの分あるねぇ。これなら、冷たくないよぉ。"], ['K','#joy|ベッドをそろえてくれて、ありがとうねぇ。みんな、ぐっすり眠れるよぉ。']],w:0,t:'ベッドを3つにしよう',ln:"地面で寝ている子が、あったかく眠れたらいいねぇ",at:()=>S.res.length>=3&&houseBedCount()<3,learn:['bed'],ok:()=>houseBedCount()>=3,n:3,now:()=>houseBedCount(),rw:15},
  {k:'light3',how:'神殿の依頼ボードをタップ →「あかり」→たいまつやかがり火をはる。できたら「おく」で置く。たき火も数に入る',g:'fire',L:[["K", "夜の村、まっくらじゃないか。足もとが見えなくて、落ち着かないよ。"], ['K',{h:'守り神、あたいの火、もっと遠くまで届けられないかい？',a:'守り神、あたしの火、もっと遠くまで届けられないかい？'}],['@idea']],X:[['K','よし、明るくなった！ これで夜も、ちっとはマシだね。'],['K','灯りを置いてくれて、ありがとよ。これで夜の見張りが、ずっとラクになるよ。']],t:'たいまつ・かがり火・たき火を3つ置こう',ln:'夜の村、もうちょっと明るいといいね',at:()=>elemCount('fire')>=1,ok:()=>CN(['torch','lamp','campfire'])>=3,n:3,now:()=>CN(['torch','lamp','campfire']),rw:15},
  {k:'houselight',how:'神殿の依頼ボードをタップ →「あかり」→「ランタン」をはる。できたら「おく」で家の中に置く',g:'fire',L:[["K", "なあ守り神、外が明るくなったら、今度は家の中が暗く感じるね。"], ["K", "夜に、だれかがつまずいたら、かわいそうだろ。"], ["K", "中でも足もとが見えるように、できないかな。"],['@idea']],X:[['K','おっ、あったかい灯りだね。……これで夜も、安心して眠れるよ。'],['K','家ん中に灯りをつけてくれて、ありがとよ。もう夜でも、つまずかないね。']],w:0,t:'家の中にあかりを置こう',ln:'家の中も、もう少し明るくしてやりたいね',at:()=>!!(S.subDone||{}).light3&&HOUSES.length>=1,ok:()=>HOUSES.some(h=>[...h.inside].some(j=>['candle','lantern','flamp'].includes(S.obj[j]))),n:1,now:()=>Math.min(1,HOUSES.reduce((n,h)=>n+[...h.inside].filter(j=>['candle','lantern','flamp'].includes(S.obj[j])).length,0)),rw:15},
  {k:'boost1',how:'画面の下の「せいれい」をタップ → 強化したい子をえらぶ → 上の「強化」タブをタップ → 「パワーをそそぐ」をタップ。パワーを使って、ランダムな能力が1つ上がる',g:'earth',L:[['K','ねえ守り神さま、せいれいはね、パワーをそそいでもらうと、ちょっとだけ強くなれるんだよぉ。'],['K','だれか1人でいいから、そそいであげてねぇ。']],X:[['K','#surprise|わぁ、元気になったみたいだねぇ。'],['K','これからも、ときどきそそいであげてねぇ。'],['K','#joy|パワーをそそいでくれて、ありがとうねぇ。からだが、ぽかぽかするよぉ。']],w:0,t:'せいれいにパワーをそそごう',ln:'せいれいに、パワーをそそいでみてほしいなぁ',at:()=>S.res.some(r=>r.elem==='fire'&&r.name===keyName('fire')),ok:()=>S.res.some(r=>(r.boost||0)>=1),n:1,now:()=>S.res.some(r=>(r.boost||0)>=1)?1:0,rw:10},
  {k:'oven',how:'神殿の依頼ボードをタップ →「ごはん」→「かまど」をはる。置いたら「みる」でかまどをタップして、作る料理をえらぶ',g:'fire',L:[['K',{h:'おい守り神、あたいの火、ただ燃やしとくのはもったいないだろ？',a:'おい守り神、あたしの火、ただ燃やしとくのはもったいないだろ？'}], ["K", "食べ物をあっためたら、うまくなりそうなんだ。でも、そのまま火に近づけると、真っ黒になっちまってさ。"], ["K", "#think|あんた、なにか思いつかないかい？"],['@idea']],X:[["K", "#think|へえ、この中に火を入れるのかい。あんた、よく考えたね！"], ['K',{h:'焼けた匂い、たまらないだろ？ あたいも、うまくできたよ。',a:'焼けた匂い、たまらないだろ？ あたしも、うまくできたよ。'}], ['K','かまどを作ってくれて、ありがとよ。あったかいメシ、たのしみにしてな！']],w:0,t:'かまどで料理してもらおう',ln:'火を使って、あったかいごはんを作れないかなぁ',at:()=>elemCount('fire')>=1,learn:['oven'],ok:()=>!!S.flags.cooked,rw:15},
  {k:'board',how:'木材15・石材10を集める。画面の上の「目標」をタップ →「進行中」のこのおねがいの「わたす」をタップ',g:'earth',L:[["K", "依頼ボード、紙が重なって、下の絵が見えないねぇ……。"], ["K", "もっとたくさん、見えるようにできないかなぁ。"], ["K", "#think|守り神さまが形を考えてくれたら、ぼくも手伝うよぉ。"],['@idea']],X:[['K','板をつぎたしたよぉ。これで、もっとたくさん貼れるねぇ。'],['K','#joy|依頼ボードを広げてくれて、ありがとうねぇ。これで、たくさんお願いできるよぉ。']],w:0,t:'依頼ボードを広げよう',ln:"紙が重なって、下の絵が見えないねぇ",at:()=>elemCount('fire')>=1,pay:{wood:15,stone:10},ok:()=>!!S.flags.board5,rw:3},
  {k:'lotus3',how:'「おく」→「ハスの種」を池の上に置く。せいれいに植えてもらい、花が咲くのを待とう',g:'earth',L:[['K','水の力をためるなら、池にハスを咲かせるといいよぉ。'],['K','ハスの種、少しあげるねぇ。']],X:[['K','#joy|ハスが咲いたねぇ。池が、うれしそうだよぉ。'],['K','#joy|ハスを咲かせてくれて、ありがとうねぇ。池が、きれいになったよぉ。']],w:0,t:'ハスを5つ咲かせよう',ln:'池にハスを咲かせたら、水の力がたまるよぉ。種、あげるねぇ',at:()=>qAt('water'),give:{lotus:5},ok:()=>bloomCount('lotus')>=5,n:5,now:()=>bloomCount('lotus'),rw:10},
  {k:'lily5',how:'「おく」→「ゆりの種」を置く。せいれいに植えてもらい、花が咲くのを待とう',g:'earth',L:[['K','風の力をためるなら、ゆりがいいねぇ。'],['K','ゆりの種、あげるよぉ。5つ咲いたら、いい風がふくかもねぇ。']],X:[['K','ゆりの香りが、風にのってるねぇ。'],['K','#joy|ゆりを咲かせてくれて、ありがとうねぇ。いい香りで、ほっとするよぉ。']],w:0,t:'ゆりを5つ咲かせよう',ln:'ゆりを咲かせれば、風の力がたまるはずだねぇ。種、あげるよぉ',at:()=>qAt('wind'),give:{lily:5},ok:()=>bloomCount('lily')>=5,n:5,now:()=>bloomCount('lily'),rw:10},
  {k:'swing1',how:'神殿の依頼ボードをタップ →「遊び」→ブランコをはる。できたら「おく」で外に置く。風の力もたまる',g:'wood',L:[['K','ねえ、ゆらゆら揺れるブランコ、つくってみない？'],['K','風を受けて揺れるから、風の力もたまるんだって！'],['@idea']],X:[['K','#joy|ブランコ、できた！ 風がきもちいいね！'],['K','#joy|守り神さま、ありがとう！']],w:0,t:'ブランコを置こう',ln:'ブランコをつくったら、風の力がたまるんだって！',at:()=>qAt('wind'),learn:['swing'],ok:()=>CN(['swing'])>=1,n:1,now:()=>CN(['swing']),rw:10},
  {k:'lumber1',how:'「おく」→「伐採場」を置く（木25・石8）。せいれいが建てるのを待とう。ここで働くと木材がふえる',g:'wood',L:[['K','木材、ちょっとずつ足りなくなってきたね。'],['K','#cry|木を切るたびに、森がさみしくなっちゃう……。木を切らなくても、木材がもらえる場所があったらいいのにな。'],['@idea']],X:[['K','#joy|伐採場ができた！ ここで働けば、木をへらさずに木材がもらえるんだね。'],['K','#joy|守り神さま、ありがとう！']],learn:['lumber'],w:0,t:'伐採場を建てよう',ln:'木を切らなくても、木材がふえたらいいな',at:()=>S.lv>=5,ok:()=>cnt('lumber')>=1,n:1,now:()=>cnt('lumber'),rw:10},
  {k:'quarry1',how:'「おく」→「採石場」を置く（木15・石25）。せいれいが建てるのを待とう。ここで働くと石材がふえる',g:'earth',L:[['K','石も、だいぶ使っちゃったねぇ。'],['K','岩をくだくのも大変だよぉ。石をもらえる場所を、つくれないかなぁ。'],['@idea']],X:[['K','採石場ができたねぇ。ここなら、岩をへらさずに石がもらえるよぉ。'],['K','#joy|守り神さま、ありがとうねぇ。']],learn:['quarry'],w:0,t:'採石場を建てよう',ln:'石も、もっと楽に集めたいなぁ',at:()=>S.lv>=7||qAt('tower'),ok:()=>cnt('quarry')>=1,n:1,now:()=>cnt('quarry'),rw:10},
  {k:'stele1',how:'「おく」→「石碑」を置く（木12・石50）。土のせいれいが建てるのを待とう。まわりの壁がじょうぶになる',g:'earth',L:[['K','#danger|コワイノに壁をたたかれると、いつもひやひやするよぉ。'],['K','壁を、もっとじょうぶにできる物があったら安心だねぇ。'],['@idea']],X:[['K','石碑が立ったねぇ。まわりの壁が、前よりしっかりしてるよぉ。'],['K','#joy|守り神さま、ありがとうねぇ。']],learn:['stele'],w:0,t:'石碑を建てよう',ln:'壁をもっとじょうぶにしたいなぁ',at:()=>S.lv>=6&&elemCount('earth')>=1,ok:()=>cnt('stele')>=1,n:1,now:()=>cnt('stele'),rw:12},
  {k:'fountain1',how:'「おく」→「噴水」を置く（木15・石60）。水のせいれいが建てるのを待とう。3人まで遊べる',g:'water',L:[['K','みんなが遊べる場所が、もっとほしいですね。'],['K','水が空に向かってふき出す、広場の真ん中のような……そんな場所は、どうでしょう。'],['@idea']],X:[['K','噴水ができました。水がきらきらして、きれいですね。'],['K','#joy|守り神さま、ありがとうございます。']],learn:['fountain'],w:0,t:'噴水を建てよう',ln:'みんなで遊べる広場がほしいです',at:()=>S.lv>=6&&elemCount('water')>=1,ok:()=>cnt('fountain')>=1,n:1,now:()=>cnt('fountain'),rw:12},
  {k:'lighthouse1',how:'「おく」→「灯台」を置く（木25・石35）。火のせいれいが建てるのを待とう。遠くまで照らす',g:'fire',L:[['K','夜の見回り、まだ暗いところがあって不安なんだ。'],['K','もっと遠くまで照らせる、でっかい灯りがあれば、いいんだけどね。'],['@idea']],X:[['K','おお、灯台だ！ これなら遠くまでよく見える。'],['K','ありがとよ、守り神。']],learn:['lighthouse'],w:0,t:'灯台を建てよう',ln:'もっと遠くまで照らせたらいいな',at:()=>S.lv>=7&&elemCount('fire')>=1,ok:()=>cnt('lighthouse')>=1,n:1,now:()=>cnt('lighthouse'),rw:12},
  {k:'lv_wmill',how:'せいれいがくらしていると、村レベルが上がる',w:0,g:'wood',L:[["K","お願いしたいことがあるんだけど、まだ村がちいさいみたい！"],["K","村がもっと育ったら、おねがいするね！"]],X:[["K","#joy|村、大きくなったね！ やったね、ありがとう！"]],t:'村レベルを8にしよう',at:()=>(elemCount('wind')>=1)&&(S.lv<8||(S.subSt||{}).lv_wmill>=2),ok:()=>S.lv>=8,n:8,rw:10,now:()=>S.lv},
 {k:'wmill',how:'「おく」→「風車」を置く（木60・石35）。せいれいが建てるのを待とう',learn:['windmill'],g:'wood',L:[["K", "ねえ、風って見えないけど、葉っぱをくるくる回すでしょ。"], ["K", "あの力、もっと大きなものを回せたりするのかな？ 守り神さま、見てみたいな！"],['@idea']],X:[['K','風車がまわってる！ 見てるだけで、たのしいね！'],['K','#joy|風車を建ててくれて、ありがとう！ くるくる回るの、ずっと見ていられるよ！']],w:0,t:'風車を建てよう',ln:"風がものを回すところ、もっと見てみたいな",at:()=>(S.lv>=8&&elemCount('wind')>=1)&&S.lv>=8,ok:()=>cnt('windmill')>=1,n:1,now:()=>cnt('windmill'),rw:10},
  {k:'clover3',how:'「おく」→「シロツメクサの種」を置く。せいれいに植えてもらい、花が咲くのを待とう',g:'wood',L:[['K','ねえ見て、シロツメクサの種を見つけたよ！'],['K','木の力がたまるんだって。5つ咲かせてみよう！']],X:[['K','シロツメクサ、かわいい！ 四つ葉、さがしてみようっと！'],['K','#joy|シロツメクサを咲かせてくれて、ありがとう！ こんど、花かんむり作ってあげるね！']],w:0,t:'シロツメクサを5つ咲かせよう',ln:'シロツメクサの種、見つけたよ！ 木の力がたまるんだって！',at:()=>qAt('wood6'),give:{clover:5},ok:()=>bloomCount('clover')>=5,n:5,now:()=>bloomCount('clover'),rw:10},
  {k:'lv_toy2',how:'せいれいがくらしていると、村レベルが上がる',g:'fire',L:[["K","たのみたいモンがあるんだけどさ、この村にはまだ早いみたいだよ。"],["K","村がもっと育ったら、また話すよ。"]],X:[["K","村、でっかくなったね。やるねえ！"]],t:'村レベルを2にしよう',at:()=>(S.res.some(r=>r.elem==='fire'&&r.name===keyName('fire')))&&((S.subSt||{}).lv_toy2===3),ok:()=>S.lv>=2,n:2,rw:3,now:()=>S.lv},
 {k:'toy2',how:'神殿の依頼ボードをタップ →「遊び」→砂場をはる。できたら「おく」で置く',g:'fire',L:[["K", "なあ、守り神。ここ、走りまわれる場所はあるけど、ちょっと物足りなくないか？"], ["K", "砂の山をつくったり、穴をほったり……そういう遊び場があったら、みんな喜ぶと思うんだ。"], ["K", "守り神、どんな形を思い浮かべる？"],['@idea']],X:[['K','おお、砂場だ！ さっそく山をつくろうじゃないか！'],['K','砂場を置いてくれて、ありがとよ。みんなで山をつくって遊ぶよ！']],t:'砂場を置こう',ln:'みんなで遊べる場所がほしいな！',at:()=>S.res.some(r=>r.elem==='fire'&&r.name===keyName('fire')),learn:['sandbox'],ok:()=>CN(['sandbox'])>=1,n:1,now:()=>CN(['sandbox']),rw:15},
  {k:'toy3',w:4,how:'神殿の依頼ボードをタップ →「遊び」→シーソーをはる。できたら「おく」で置く',g:'wind',L:[["K", "フッ……風は、ゆれるものに宿るのだよ。"], ["K", "板の両はしに乗って、ギッコン、バッタン……そんな遊び道具があれば、きっと風も楽しい。"], ["K", "守り神、きみなら、どんな形を思い浮かべる？"],['@idea']],X:[['K','見たまえ、風がシーソーを動かしている。…美しいね。'],['K','#joy|…ありがとう、守り神。']],t:'シーソーを置こう',ln:'ギッコン、バッタン、遊びたいな！',at:()=>elemCount('wind')>=1,learn:['seesaw'],ok:()=>CN(['seesaw'])>=1,n:1,now:()=>CN(['seesaw']),rw:15},
  {k:'deco3',how:'神殿の依頼ボードをタップ →「庭」→生垣などをはる。できたら「おく」で置く。かんようしょくぶつも数に入る',g:'wood',L:[["K", "ねえ、村をもっとかわいくしたいな！"], ["K", "#joy|花とか、小鳥とか、好きなものを見ながら歩けたら、うれしいなあ。"], ["K", "守り神さま、どんなふうになるかな？"],['@idea']],X:[['K','#joy|村をかざってくれて、ありがとう！ どこを見ても、かわいくて、うれしくなっちゃう！']],t:'かざりを3つ置こう',ln:"花や小鳥をながめながら歩けたらいいな",at:()=>S.lv>=2,ok:()=>CN(['hedge','birdbath','parasol','arch','signpost','monstera'])>=3,n:3,now:()=>CN(['hedge','birdbath','parasol','arch','signpost','monstera']),rw:15},
  {k:'tree5',how:'「おく」→「木の苗」を置く。せいれいが植えるのを待とう\n木の苗は、カミサマと交換するか、せいれいが拾っておそなえ箱に入れてくれるのを待とう',g:'wood',L:[['K','おひるねするとき、木かげがあったらいいなあ。'],['K','木を5本植えたら、すずしい木かげができるよね！']],X:[['K','木かげ、すずしい〜。ここでおひるねしようっと！'],['K','#joy|木を植えてくれて、ありがとう！ 大きくなったら、いっしょにおひるねしようね！']],t:'木を5本植えよう',ln:'木かげで、おひるねしたいな',at:()=>S.lv>=3,ok:()=>bloomCount('tree')+bloomCount('fruit')>=5,n:5,now:()=>bloomCount('tree')+bloomCount('fruit'),rw:15},
  {k:'farm10',how:'「おく」→「畑」を置く。土のせいれいが耕すのを待とう',g:'earth',L:[['K','なかまがふえて、ごはんもたくさんいるねぇ。'],['K','畑が10こあったら、ごはんにこまらないよぉ。']],X:[['K','畑がいっぱいだねぇ。耕すの、がんばるよぉ。'],['K','#joy|畑をふやしてくれて、ありがとうねぇ。収穫の日が、いまから楽しみだよぉ。']],w:0,t:'畑を10にしよう',ln:'畑がもっとあると、ごはんにこまらないねぇ',at:()=>cnt('farm')>=6,ok:()=>cnt('farm')>=10,n:10,now:()=>cnt('farm'),rw:15},
  {k:'food40',how:'畑で作物を育てて収穫してもらう。ベリーの茂みからも集まる。食料箱1つには30こまでしか入らない',g:'wood',L:[['K','ねえ、食料箱って、どのくらい入るのかな？'],['K','40こくらい、ためてみたい！ そしたら、なにがあってもへっちゃらだよ！']],X:[['K','食料箱がいっぱい！ 見てるだけで、おなかいっぱいになりそう！'],['K','#joy|食べ物をいっぱいためてくれて、ありがとう！ これで、おなかがすいても安心だね！']],t:'食べ物を40こためよう',ln:'食料箱をいっぱいにしたいな！',at:()=>foodCap()>0&&S.res.length>=3,ok:()=>FOODN()>=40,n:40,now:()=>FOODN(),rw:15},
  {k:'house2',how:'家の壁で囲って、ドアをつけると家になる',g:'earth',L:[['K','なかまがふえて、家がちょっときゅうくつだねぇ…。'],['K','もう1けん、家があるといいなぁ。']],X:[['K','新しい家だぁ。のびのび眠れるねぇ。'],['K','ものをしまえる場所や、お湯につかってゆっくりできる場所もあったらいいねぇ。'],['K','#joy|新しい家を建ててくれて、ありがとうねぇ。みんな、ゆっくり休めるよぉ。']],t:'家を2けんにしよう',ln:'なかまがふえて、家がきゅうくつだねぇ',at:()=>qAt('baseUp')&&S.res.length>=4&&elemCount('fire')>=1,ok:()=>HOUSES.length>=2,n:2,now:()=>HOUSES.length,rw:20},
  {k:'room',how:'神殿の依頼ボードをタップ →「家具」から本棚・ラグ・かざり物など、好きなものをはる。できたら「おく」で家の中に置く。ちがう種類を5つ（同じ物は1つと数える。カーテンや壁にかけるものは数に入らない）',g:'wind',L:[["K", "家の中が、どうにも味気ないね。"], ["K", "本棚でも、ラグでも、ぼくの好きなもので、おへやをかざれたら……。"], ["K", "#think|守り神、きみの考える形を、見せてくれないか。"],['@idea']],X:[['K','#nod|うん、悪くない。ぼくにふさわしい、品のあるおへやだ。'],['K','部屋を整えてくれて、感謝するよ。ここなら、気持ちよく過ごせそうだ。']],t:'家の中に家具やかざりを5種類置こう',ln:'家の中を、すてきにかざりたいな',at:()=>HOUSES.length>=1&&S.lv>=3,ok:()=>inHouseFurn()>=5,n:5,now:()=>inHouseFurn(),rw:15},
  {k:'paint',how:'神殿の依頼ボードをタップ →「家具」→絵（額）をはる。できたら「おく」で家の横向きの家の壁にかける',g:'water',L:[["K", "#cry|家の壁を見ていると、少しさみしく感じます。"], ["K", "きれいな景色を、ここに残しておけたら……。季節が変わっても、見られるように。"], ["K", "守り神さま、そんなことはできるでしょうか。"],['@idea']],X:[["K", "壁に、景色が……！ こんなふうに残せるのですね。"], ["K", "#think|見ていると、考えごとがはかどります。"], ['K','#joy|絵をかざってくださって、ありがとうございます。壁が、ぐっと明るくなりました。']],t:'壁に絵をかざろう',ln:"きれいな景色を、壁に残しておけたら……",at:()=>S.lv>=7,ok:()=>Object.values(S.win||{}).some(v=>v==='paint1'||v==='paint2'||v==='paint3'),rw:15},
  {k:'trap4',how:'神殿の依頼ボードをタップ →「ワナ」→とげの罠などをはる。できたら「おく」で「コワイノ」が通りそうな所に置く',g:'fire',L:[["K", "#danger|守ってばっかりじゃ、つまらないね。"], ["K", "#danger|近づいてくる「コワイノ」を、途中でびっくりさせてやりたいよ。"], ["K", "守り神、もう少し手を打てないかい？"],['@idea']],X:[['K','いいねえ、罠だらけだ！ 来るなら来いってんだ！'],['K','#alarm|罠をふやしてくれて、ありがとよ。これで「コワイノ」も、手出しできないね。']],t:'罠をあと4つ置こう',at:()=>elemCount('fire')>=1&&S.enemyOn&&(WD===1||(S.bossKills||0)>=1||qAt('ookage')),ok:()=>CN(TRAPS)-((S.subB||{}).trap4||0)>=4,n:4,now:()=>Math.max(0,CN(TRAPS)-((S.subB||{}).trap4||0)),base:()=>CN(TRAPS),rw:15},
  {k:'lv_jar2',how:'せいれいがくらしていると、村レベルが上がる',w:0,g:'water',L:[["K","お願いしたいものがあるのですが、この村にはまだ早いようです。"],["K","村がもっと育ったら、あらためてお願いしますね。"]],X:[["K","#joy|村が育ちましたね。ありがとうございます。"]],t:'村レベルを3にしよう',at:()=>(elemCount('water')>=1)&&((S.subSt||{}).lv_jar2===3),ok:()=>S.lv>=3,n:3,rw:4,now:()=>S.lv},
 {k:'jar2',how:'神殿の依頼ボードをタップ →「庭」→「みずがめ」をはる。できたら「おく」で畑のそばに置く',w:0,g:'water',L:[["K", "畑まで水を運んでいると、すぐ土が乾いてしまうのです。"], ["K", "そばに水を残しておけたら、少しずつ染みこませられそうなのですが……。"], ["K", "#think|守り神さま、何かよい形を思いつきませんか。"],['@idea']],X:[["K", "この形なら、水をためておけるのですね。"], ['K','#joy|みずがめを置いてくださって、ありがとうございます。畑の水やりが、はかどります。']],t:'みずがめを2つ置こう',at:()=>elemCount('water')>=1,ok:()=>cnt('jar')>=2,n:2,now:()=>cnt('jar'),rw:15},
  {k:'fish5',how:'池や水べがあると、せいれいがつりをする。水のせいれいはよくつれる。池のそばにいすを置くとつりスポットになり、つりやすくなる',g:'water',L:[["K", "池のさかな、何びきいるか、数えてみたいんです。"], ["K", "守り神さま、せいれいたちに、さかなをつってもらえませんか？ まずは5ひき。記録しておきますから。"], ["K", "#joy|水べでじっと待つのは、少し足がつかれますね。ゆっくり待てる場所も、あればうれしいのですが。"]],X:[['K','5ひき、たしかに。…記録によると、まだまだいそうですね。'],['K','#joy|せいれいたちがつってくれたおかげで、いい観察になりました。ありがとうございます。']],t:'せいれいたちにさかなを5ひきつってもらおう',at:()=>elemCount('water')>=1,ok:()=>(S.fishN||0)-((S.subB||{}).fish5||0)>=5,n:5,now:()=>Math.max(0,(S.fishN||0)-((S.subB||{}).fish5||0)),base:()=>S.fishN||0,rw:15},
  {k:'lv_parasol',how:'せいれいがくらしていると、村レベルが上がる',g:'wind',L:[["K","フッ…頼みたいものがあるんだが、この村にはまだ早いらしい。"],["K","村がもっと育ったら、また声をかけるよ。"]],X:[["K","#joy|村も育ったな。悪くない。ありがとう。"]],t:'村レベルを5にしよう',at:()=>(elemCount('wind')>=1)&&((S.subSt||{}).lv_parasol===3),ok:()=>S.lv>=5,n:5,rw:7,now:()=>S.lv},
 {k:'parasol',how:'神殿の依頼ボードをタップ →「庭」→「パラソル」をはる。できたら「おく」で置く',g:'wind',L:[["K", "フッ……日なたは好きだが、ずっといると、さすがに暑いね。"], ["K", "風を感じながら、日ざしだけ避けられたら、優雅に過ごせそうだ。"], ["K", "守り神、きみに任せてみてもいいかな。"],['@idea']],X:[['K','いい日かげだ。ここでお茶でもいかがかな？'],['K','#joy|パラソルを置いてくれて、ありがとう。おかげで、優雅な午後が過ごせそうだ。']],t:'パラソルを置こう',at:()=>elemCount('wind')>=1,ok:()=>cnt('parasol')>=1,n:1,now:()=>cnt('parasol'),rw:15},
  {k:'fence20',how:'神殿の依頼ボードをタップ →「道・囲い」→「柵」をはる。できたら「おく」で、村のまわりに置く',g:'fire',w:0,L:[['K','村が大きくなったぶん、守る場所もふえたね。'],['K','まわりは、まだがら空きじゃないか。'],['K','#alarm|柵をずらっと並べて、「コワイノ」の足を止めてやろうじゃないか。']],X:[['K','いいじゃないか、これならそう簡単には入ってこれないよ！'],['K','ありがとよ、守り神。']],t:'柵を20こ並べよう',ln:'村のまわりが、がら空きだね',at:()=>qAt('baseUp')&&S.enemyOn,ok:()=>CN(['fence','logfence','bamboofence'])>=20,n:20,now:()=>CN(['fence','logfence','bamboofence']),rw:20},
  {k:'house3',how:'家の壁で囲んで、ドアをつけると家になる',g:'earth',w:0,L:[['K','村がにぎやかになってきたから、もう1けん、家を建てたいねぇ。'],['K','みんなで、ゆったり暮らせるようにしたいよぉ。']],X:[['K','3けんめの家だぁ。村らしくなってきたねぇ。'],['K','#joy|守り神さま、ありがとうねぇ。']],t:'家を3けんにしよう',ln:'もう1けん、家がほしいねぇ',at:()=>S.lv>=4&&!!(S.subDone||{}).house2,ok:()=>HOUSES.length>=3,n:3,now:()=>HOUSES.length,rw:25},
  {k:'fruit1',how:'「おく」で果物の苗を置く。せいれいが植えるのを待とう。育つまで少しかかる',g:'wood',w:0,give:{fruit:1},L:[['K','#joy|広い土地に、おいしい実のなる木があったらいいな。'],['K','りんごの木、植えてみたい！']],X:[['K','#surprise|わあ、りんごの木だ！ 実がなるの、たのしみだね！'],['K','#joy|守り神さま、ありがとう！']],t:'果物の木を育てよう',ln:'実のなる木があったらうれしいな',at:()=>qAt('baseUp')&&S.lv>=6,ok:()=>bloomCount('fruit')>=1,n:1,now:()=>bloomCount('fruit'),rw:15},
];

const FIREB={/* 火のキーキャラが、あにきのとき */
  light3:{L:[['K','#alarm|夜の村、まっくらじゃねえか。これじゃ「コワイノ」にやりたい放題されるぜ。'],['K','#think|おれの火を、もっと遠くまで届けられねえかな。おまえ、いい考えはねえか？'],['@idea']],X:[['K','よし、明るくなった！ これで夜も、ちっとはマシだな。'],['K','灯り、ありがとな。これで夜の見張りが、ずっとラクになるぜ。']]},
  oven:{L:[['K','おい守り神、おれの火、ただ燃やしとくのはもったいねえだろ？'],['K','食べ物をあっためたいんだけどよ、そのまま火に近づけると、焦げちまうんだ。'],['K','#think|おまえなら、なにか思いつかねえか？'],['@idea']],X:[['K','へえ、この形なら火をいかせるんだな。おまえも、なかなかやるじゃねえか！'],['K','ほれ、食ってみろよ。おれも、うまく焼けたぜ！'],['K','かまど、ありがとな。あったかいメシ、たのしみにしてろよ！']]},
  trap4:{L:[['K','#danger|守ってばっかりじゃ、つまらねえな。'],['K','近づいてくるやつを、途中でぎゃふんと言わせたいぜ。おまえ、まだ手はあるよな？'],['@idea']],X:[['K','いいねえ、罠だらけだ！ 来るなら来やがれ！'],['K','#alarm|罠、ありがとな。これで「コワイノ」も、手出しできねえだろ！']]},
  houselight:{L:[['K','なあ守り神、外が明るくなったら、今度は家の中が暗く感じるな。'],['K','夜に、だれかがつまずいたら、かわいそうだろ。'],['K','中でも足もとが見えるように、できねえかな。'],['@idea']],X:[['K','おっ、あったけえ灯りだな。……これで夜も、安心して眠れるぜ。'],['K','ありがとよ、守り神。']]},
  lighthouse1:{L:[['K','夜の見回り、まだ暗いところがあって不安なんだ。'],['K','もっと遠くまで照らせる、でっかい灯りがあれば、いいんだがな。'],['@idea']],X:[['K','おお、灯台だ！ これなら遠くまでよく見えるぜ。'],['K','ありがとよ、守り神。']]},
  toy2:{L:[['K','なあ、守り神。ここ、走りまわれる場所はあるけど、ちょっと物足りなくねえか？'],['K','砂の山をつくったり、穴をほったり……そういう遊び場があったら、みんな喜ぶと思うぜ。'],['K','守り神、どんな形を思い浮かべる？'],['@idea']],X:[['K','おお、砂場だ！ さっそく山をつくろうぜ！'],['K','ありがとな、守り神。']]},
  fence20:{L:[['K','村が大きくなったぶん、守る場所もふえたな。'],['K','まわりは、まだがら空きじゃねえか。'],['K','#alarm|柵をずらっと並べて、「コワイノ」の足を止めてやろうぜ。']],X:[['K','いいじゃねえか、これならそう簡単には入ってこれねえぜ！'],['K','ありがとよ、守り神。']]}};/* ホノ（あにき）は、いつも「おれ」。あたいは、ホムラ（あねご）だけ */
function inHouseFurn(){const k=new Set();for(let j=0;j<S.obj.length;j++){const o=S.obj[j];if(!o||!BL[o]||BL[o].kind!=='furn'||BL[o].trap)continue;if(HOUSES.some(h=>h.set&&h.set.has(j)))k.add(o)}for(const h of HOUSES)if(h.set)for(const o of rugsIn(h.set))k.add(o);return k.size}/* 家の中にある家具・かざりの種類の数 */
function qAt(id){const qi=QUESTS.findIndex(q=>q.id===id);if(qi<0)return false;return (S.quest>qi||S.quest===qi&&!!S.qTalked)}/* そのメインクエストを受けたあと */
function qDone(id){const index=QUESTS.findIndex(q=>q.id===id);if(index<0)return false;if(S.qStory===index)return false;return S.quest>index}
const SUB_MAIN_AFTER={chair2:'table',farm10:'farm6',light3:'fire',oven:'fire'};
function subOfferReady(q){if(S.qStory!=null||QUEST_CLEAR_WAIT)return false;return WD!==0||!SUB_MAIN_AFTER[q.k]||qDone(SUB_MAIN_AFTER[q.k])}
const LEVEL_HELP={2:['benchbreak','chair2'],3:['oven','bed3'],4:['jar2','farm10'],5:['toy2','deco3'],8:['room','paint','parasol']};
function levelHelpKeys(){const out=[];for(const n in LEVEL_HELP){const main=qAt('lv'+n),side=SUBQ.some(q=>q.k.startsWith('lv_')&&q.n===+n&&(S.subSt||{})[q.k]>=2);if(main||side)out.push(...LEVEL_HELP[n])}return out}
function subList(){const help=levelHelpKeys();if(waitingBellflowers())help.unshift('seedwait_gate','seedwait_food');return SUBQ.filter(q=>q.w==null||q.w===WD).sort((a,b)=>(help.includes(a.k)?0:1)-(help.includes(b.k)?0:1))}
let SUBW={};/* サブクエストで話したそうにしている子（名前→k） */
const KEYEL0={wood:POKO,earth:MINA};
function keyName(el){const N=S.keyN||(S.keyN={});/* 5属性のキーキャラ：決まった子か、その属性で最初に来た子 */
  if(N[el]&&(S.res.some(r=>r.name===N[el])||(S.buried||[]).some(r=>r.name===N[el])))return N[el];
  let nm=null;if(!WD&&(KEYEL0[el]||FIXK0[el]))nm=KEYEL0[el]||FIXK0[el];else{for(const k in KEYEL)if(KEYEL[k]===el&&KEYS[WD]&&KEYS[WD].includes(k))nm=k}
  if(!nm){const r=S.res.filter(r=>r.elem===el).sort((a,b)=>a.id-b.id)[0];nm=r?r.name:null}
  if(nm&&S.res.some(r=>r.name===nm))N[el]=nm;return nm}
function subWho(q){return keyName(q.g)}
function checkSub(){const D=S.subDone||(S.subDone={}),Sn=S.subSeen||(S.subSeen={}),St=S.subSt||(S.subSt={});S.subB||(S.subB={});SUBW={};const SL=subList();/* 1回だけ作って使いまわす */
  const busy={};
  for(const q of SL){if(D[q.k])continue;if(St[q.k]===1&&!subOfferReady(q))delete St[q.k];if(Sn[q.k]&&!St[q.k])St[q.k]=2;
    if(St[q.k]===3&&FLOWER_QUESTS.has(q.k)&&!q.ok()){St[q.k]=2;delete (S.subArrived||{})[q.k];delete SUB_CLEAR_WAIT[q.k]}
    if(St[q.k]===3&&!isNight()&&!(S.subArrived||{})[q.k]&&!SUB_CLEAR_WAIT[q.k]){const visit=queueQuestVisit(q,subWho(q));if(visit){St[q.k]=2;SUB_CLEAR_WAIT[q.k]=Object.assign({done:false},visit)}}/* 前からの人：もう受けている */
    if(St[q.k]===2&&q.k==='oven'){const partKey=(S.world||0)+':sub:oven:placed';if((S.questPartSeen||{})[partKey]){if(q.ok()){St[q.k]=3;(S.subArrived||(S.subArrived={}))[q.k]=true;sfx('quest');toast('サブクエストたっせい：'+q.t,'good')}}else if(cnt('oven')&&!q.ok()&&!S.res.some(r=>r.act&&r.act.partKey===partKey||(QUEST_VISITS.get(r)||[]).some(v=>v.partKey===partKey)))queueQuestVisit(q,subWho(q),['oven'],partKey)}
    if(St[q.k]===2&&q.ok()&&!isNight()){let wait=SUB_CLEAR_WAIT[q.k];if(wait&&!wait.done&&(S.obj[wait.obj]!==wait.id||!S.res.includes(wait.r))){delete SUB_CLEAR_WAIT[q.k];wait=null}
      if(wait&&wait.done){delete SUB_CLEAR_WAIT[q.k];St[q.k]=3;sfx('quest');toast('サブクエストたっせい：'+q.t,'good')}
      else if(!wait){const visit=queueQuestVisit(q,subWho(q));if(visit)SUB_CLEAR_WAIT[q.k]=Object.assign({done:false},visit);else{St[q.k]=3;sfx('quest');toast('サブクエストたっせい：'+q.t,'good')}}}
    if(St[q.k])busy[q.g]=busy[q.g]&&!(St[q.k]===3&&St[busy[q.g].k]!==3)?busy[q.g]:q}/* 終わったクエストの報告を先に出す */
  /* サブクエストは一つずつ提示。会話のあいだを村の時間で2時間あける */
  const spaced=!isNight()&&(S.subTalkAt==null||S.t-S.subTalkAt>=120);/* 新しいサブクエストは、昼だけ */
  if(spaced&&!Object.values(busy).some(q=>St[q.k]===1||St[q.k]===3)&&SL.filter(q=>!D[q.k]&&St[q.k]===2).length<6)for(const q of SL){/* 前のおねがいが終わっていなくても、条件がそろえば出す（受けているのは6つまで） */if(D[q.k]||St[q.k])continue;const w=keyName(q.g);if(!w||!q.at()||!subOfferReady(q))continue;St[q.k]=1;busy[q.g]=q;break}
  if(spaced&&waitingBellflowers()&&!SL.some(q=>St[q.k]===1||St[q.k]===3)&&SL.filter(q=>St[q.k]===2).length<3){const next=SL.find(q=>q.k.startsWith('seedwait_')&&!D[q.k]&&!St[q.k]&&q.at());if(next&&subOfferReady(next))St[next.k]=1}
  const summonHelp=WD===0&&S.qStory==null&&S.qTalked?({fire:'salvia3',water:'lotus3',wind:'lily5'}[QUESTS[S.quest]?.id]||''):'',supportKeys=summonHelp?(summonHelp==='salvia3'?['salvia3','watch2']:summonHelp==='lily5'?['lily5','swing1']:[summonHelp]):[];
  for(const k of supportKeys){if(D[k]||St[k])continue;const q=SL.find(q=>q.k===k);if(!q||!q.at()||!subOfferReady(q)||!keyName(q.g))continue;if(!isNight()&&(k===summonHelp||spaced)){St[k]=1;break}}
  const visiting=!!QUEST_CLEAR_WAIT&&!QUEST_CLEAR_WAIT.done||Object.values(SUB_CLEAR_WAIT).some(w=>w&&!w.done)||S.res.some(r=>(QUEST_VISITS.get(r)||[]).length||r.act&&r.act.type==='questjoy'&&r.act.joyAt==null);/* クエストのものを見にいく途中は、新しい話の黄色い吹き出しは出さない（着いて喜び始めてから） */
  const requests=visiting?[]:SL.filter(q=>St[q.k]===1&&!isNight()&&(spaced||summonHelp&&q.k===summonHelp));
  const pending=requests.filter(q=>supportKeys.includes(q.k)).concat(SL.filter(q=>St[q.k]===3),requests.filter(q=>!supportKeys.includes(q.k)));
  for(const q of pending){const w=St[q.k]===3?questReplyWho(q):subWho(q);if(w&&spkOK(w)&&w!==TALKW){SUBW[w]=q.k;break}}}
function subTalk(k){const q=SUBQ.find(q=>q.k===k),St=S.subSt,D=S.subDone;if(!q||!$('#dialog').hidden||St[k]===1&&!subOfferReady(q))return;S.subTalkAt=S.t;const w=subWho(q)||POKO,L=(St[k]===1?q.L:q.X)||[[w,q.t]];
  const rw=S.res.find(z=>z.name===w),FB2=q.g==='fire'&&rw&&elemKey(rw)==='fireB'&&FIREB[k];let once=0;dialog(ideaDialogue(q,(FB2?(St[k]===1?FB2.L:FB2.X):L).map(x=>[x[0]==='K'?w:x[0],x[1]&&typeof x[1]==='object'?(w===HOMURA?x[1].h:x[1].a):x[1]]),/* {h,a}：ホムラ（あたい）と、ほかの火の子（あたし） */St[k]===1?'accept':'clear'),()=>{if(once++)return;
    if(St[k]===1){St[k]=2;Sn0(k);if(q.base)S.subB[k]=q.base();for(const id of q.learn||[])S.recipes[id]=true;inspireQuest(q);for(const x in q.give||{}){S.unlocked[x]=true;giveItem(x,q.give[x])}queueItemGift(q.give);sfx('quest');toast('サブクエスト：'+q.t,'good');renderPalette()}
    else if(St[k]===3){St[k]=4;D[k]=1;inspireQuest(q,'clear');if(q.rw){S.pt+=q.rw;S.totalPt+=q.rw;toast('ごほうび：パワー+'+q.rw,'good')}memo('📌','サブクエスト「'+q.t+'」をたっせい');logEv('サブクエスト「'+q.t+'」をたっせい')}
    checkSub()},null)}
function Sn0(k){(S.subSeen||(S.subSeen={}))[k]=1}
/* ---------- ステージ1の物語イベント（フタバと5属性のキーキャラ） ----------
   F=フタバ N=ノドカ H=火の子 M=水の子 K=風の子（その属性で最初に来た子） G=カミサマ U=草原のヌシ
   いない子のセリフ（3つめに1）はとばす。need の子がいないと出ない */
const NUSHI1='草原のヌシ';
function sevName(t){return t==='F'?POKO:t==='N'?MINA:t==='H'?keyName('fire'):t==='M'?keyName('water'):t==='K'?keyName('wind'):t==='G'?GOD:t==='U'?NUSHI1:t}
function sevAllHere(e){return (e.L||[]).every(x=>typeof x[2]==='string'||sevHere(x[0]))}/* ピンクの会話：話す子がみんな村にいるときだけ（「Nがいるときだけ」の行はのぞく） */
function sevHere(t){if(t==='G'||t==='U')return true;const n=sevName(t);return !!n&&S.res.some(r=>r.name===n)}
function sevLines(L,dead){const out=[];for(const x of L){const t=x[0],dp=x[2];if(dp==='1st'&&S.flags&&S.flags.kizunaTold)continue;/* '1st'=最初にもどった子の会話だけ */if(typeof dp==='string'&&dp!=='1st'&&(dp[0]==='!'?sevHere(dp.slice(1)):!sevHere(dp)))continue;/* 3つめが'N'なら「Nがいるときだけ」、'!N'なら「Nがいないときだけ」 */if(!sevHere(t)){if(dp)continue;return null}const n=sevName(t);let s=x[1];
  if(typeof s==='object'){const r=S.res.find(q=>q.name===n);s=r&&elemKey(r)==='fireB'?s.B:s.A}out.push([n,s.split('$').join(dead||'').replace(/@([HMK])/g,(m,c)=>sevName(c)),typeof x[3]==='string'?x[3]:0])}return out}
/* 属性のシンボルの建物のそばで、その属性のキーキャラが過ごしているとき */
const SYMB={fire:'lighthouse',water:'fountain',wind:'windmill',earth:'stele'};
function natNear(el,f){const q=S.res.find(x=>x.name===keyName(el));if(!q||q.hidden||(q.act&&['flee','faint','sleep'].includes(q.act.type)))return false;return f(q)}/* その属性のキーキャラが、条件 f をみたす所にいるか */
function tileNear(q,r,f){const x0=q.x|0,y0=q.y|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(x>=0&&y>=0&&x<W&&y<H&&f(y*W+x))return true}return false}
function symNear(el){const id=SYMB[el];if(!id||!cnt(id))return false;const q=S.res.find(x=>x.name===keyName(el));if(!q||q.hidden||(q.act&&['flee','faint','sleep'].includes(q.act.type)))return false;for(let j=0;j<S.obj.length;j++)if(S.obj[j]===id&&Math.hypot((j%W+.5)-q.x,((j/W)|0)+.5-q.y)<=3)return true;return false}
function atFarm(r){if(!r||r.hidden||r.act&&['flee','faint','sleep'].includes(r.act.type))return false;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&Math.hypot((j%W+.5)-r.x,((j/W)|0)+.5-r.y)<=1.35)return true;return false}
const SEV1=[
 {k:'e04',at:()=>!!S.flags.minaCame&&cnt('table')>=1,L:[['F','ノドカ！ いっしょにごはん食べよ！'],['N','いいよぉ。なにを食べようかねぇ。'],['F','#surprise|えっとね、ベリー！ ……あれ、どこにしまったっけ？'],['N','ふふ。食料箱の中だよぉ。'],['F','#joy|そうだった！ えへへ、ふたりだと楽しいね！']]},
 {k:'e04b',at:()=>!!S.flags.minaCame&&S.flags.mnN!=null&&(S.nights||0)>S.flags.mnN&&S.lastMorning>S.lastNight,L:[['F','ノドカ、おはよう！'],['F','ノドカが来てからね、ぐっすり眠れるようになったんだ。'],['N','そうなのぉ？'],['F','となりにだれかいるって、こんなに安心するんだね。'],['N','ふふ。ぼくも、ぐっすりだったよぉ。']]},
 {k:'e05',at:()=>!!(S.subDone||{}).bed3,L:[['F','#joy|こんなになかまがふえたよ！ ぼく、うれしいな！'],['F','#sigh alarm|……でも、また「コワイノ」が来たら、どうしよう。'],['N','#think|みんなで考えたらいいよぉ。ひとりじゃないんだからねぇ。'],['F','そうだね！ ぼくだって、だれかを守れるようになりたい！']]},
 {k:'e06',at:()=>sevHere('H')&&S.enemyOn&&(S.bossKills||0)>=1&&!S.flags.guard&&!S.flags.hDied,/* こもれびのまもりは、最初のオオカゲを追いはらったあと、火の子を心配する流れで */L:[['F','#surprise|@H……オオカゲとたたかって、だいじょうぶだった！？'],['H',{A:'へっちゃらさ。これくらいで、へこたれるあたいじゃないよ。',B:'へっちゃらだ。これくらいで、へこたれるおれじゃねえ。'}],['F','#think|……あの大きな影を思い出すと、まだ手がふるえるんだ。'],['H',{A:'#scared|あんた、あの影のあいだ、家でずっとふるえてたもんな。……こわくて、あたりまえさ。',B:'#scared|おまえ、あの影のあいだ、家でずっとふるえてたもんな。……こわくて、あたりめえだ。'}],['F','#scared|……ぼく、なんにもできなかった。むかしね、ぼくのきょうだいは、前に出て、ぼくを守ってくれたのに。'],['H',{A:'あたいらが前に出られるのは、あんたたちが家で待っててくれるからさ。村のちびたちを守りたいのは、あんたも同じだろ？',B:'おれたちが前に出られるのは、おまえらが家で待っててくれるからだ。村のちびたちを守りたいのは、おまえも同じだろ？'}],['F','#think|……うん。ぼくも、守りたい！'],['F','ぼくは@Hみたいに強くないけど……葉っぱで守ることならできるかも！'],['F','ほらっ！ こもれびの、まもり！ ……わっ、葉っぱが顔にくっついた！',0,'guarddemo'],['H',{A:'#think|……ぷっ。まったく、しょうがない子だね。……ありがとよ。いっしょに守ろう。',B:'#think|……ははっ。しょうがねえやつだな。……ありがとな。いっしょに守ろうぜ。'}]],
  go:()=>{S.flags.guard=true;memo('🍃','フタバが「こもれびのまもり」をおぼえた');skillPop('🍃','フタバが「こもれびのまもり」をおぼえた！',['夜、コワイノにねらわれている火の子のそばへ行って、葉っぱで1人を守る。','守られた子は、40分のあいだ、コワイノから受けるダメージが小さくなる。','つかったあとは、75分たつと、また守れる。'])}},
 {k:'e06d',at:()=>sevHere('H')&&S.enemyOn&&(S.bossKills||0)>=1&&!S.flags.guard&&!!S.flags.hDied,/* 火の子がオオカゲの夜にいなくなっていたら、よみがえってから */L:[['F','@H……！ もどってきてくれたんだね……！'],['F','#scared|オオカゲの夜に、@Hがいなくなっちゃって……ぼく、ずっと、こわかった。'],['H',{A:'#think|……心配かけたね。もう、だいじょうぶさ。',B:'#think|……心配かけたな。もう、だいじょうぶだ。'}],['F','#scared|ぼく、家でふるえてるだけで、なんにもできなかった。むかしね、ぼくのきょうだいも、前に出て、ぼくを守ってくれたのに。'],['H',{A:'あたいらが前に出られるのは、あんたたちが家で待っててくれるからさ。村のちびたちを守りたいのは、あんたも同じだろ？',B:'おれたちが前に出られるのは、おまえらが家で待っててくれるからだ。村のちびたちを守りたいのは、おまえも同じだろ？'}],['F','#think|……うん。もう、だれにもいなくなってほしくない。ぼくも、守りたい！'],['F','ぼくは@Hみたいに強くないけど……葉っぱで守ることならできるかも！'],['F','ほらっ！ こもれびの、まもり！ ……わっ、葉っぱが顔にくっついた！',0,'guarddemo'],['H',{A:'#think|……ぷっ。まったく、しょうがない子だね。……ありがとよ。いっしょに守ろう。',B:'#think|……ははっ。しょうがねえやつだな。……ありがとな。いっしょに守ろうぜ。'}]],
  go:()=>{S.flags.guard=true;memo('🍃','フタバが「こもれびのまもり」をおぼえた');skillPop('🍃','フタバが「こもれびのまもり」をおぼえた！',['夜、コワイノにねらわれている火の子のそばへ行って、葉っぱで1人を守る。','守られた子は、40分のあいだ、コワイノから受けるダメージが小さくなる。','つかったあとは、75分たつと、また守れる。'])}},
 {k:'e07',at:()=>sevHere('M'),L:[['F','ねえねえ、@M！ 畑、見てくれた？'],['M','この村には、水が必要な場所がたくさんありますね。'],['F','ぼくね、いっぺんに水を運ぼうとして、ぜんぶこぼしたことがあるんだ！'],['N','#surprise|あれは、びっくりしたねぇ。',1],['M','#think|……一度に運ぶ量を、半分にしてみましょう。そのほうが、結果的に早いですよ。'],['F','#joy|えへへ……今日はこぼさないよ！']]},
 {k:'e08',night:1,at:()=>{const f=S.res.find(r=>r.name===POKO);return !!f&&S.enemies.some(e=>!e.dead&&((e.type==='boss'||e.type==='boss2'))&&Math.hypot(e.x-f.x,e.y-f.y)<12)&&!(S.ns&&S.ns.final)},L:[['F','#think|……あの感じ。まえの夜と、おんなじ……！',0,'dim'],['F','あれが、オオカゲ……。'],['F','#ponder|あの夜も、あの影がいた……。'],['F','#scared|あの夜……きょうだいたちは、ぼくを守ってくれたのに……！'],['F','#scared|もう、だれにもこわい思いをさせないで！'],['F','#danger|……こわい。でも、ここは、ぼくたちの草原なんだ。'],['F','#worry|守り神さま、みんなを……おねがい！']]},
 {k:'e09',vis:['フタバがひろったかけらが、あたたかく光った。その光にふれると、まぶたの裏に、むかしの草原がうかんだ。','花でいっぱいの草原。大きな白い鹿のうしろで、小さな子たちが笑っている。','……夜。だれかの手が、いちばん小さな子を、そっと奥へおしこんだ。','「ここにいて。ぜったい、出てきちゃだめだよ」'],at:()=>!!S.flags.finalWon&&!!S.flags.sh_boss&&!!S.flags.areaSkill&&S.qStory==null,L:[['F','この光……やっぱり、ヌシ様の力だ……。'],['N','「守る力」のかけらだねぇ。これで、3つそろったよぉ。',1],['F','#alarm|むかし、「コワイノ」がいっぱい来た夜があったんだ。'],['F','#cry|ぼく、末っ子だったから……きょうだいが、いちばん奥にかくしてくれて。'],['F','#danger|ヌシ様も、さいごまで、ぼくを守ってくれたんだ。'],['F','でも、あのときはヌシ様の力までなくなっちゃって……消えた子が、もどってこられるかも、わからなかった。'],['F','#teary|みんな、だいじょうぶかな。ぼく、ずっと会いたかったんだ。'],['F','#think|……台座に、はめてみよう！ 守り神さま！']]},
 {k:'e17',at:()=>elemCount('wood')>=6&&S.qStory==null,L:[['F','なかまが、こんなにふえた！'],['F','みんなでくっついてた、あのころみたい……。'],['F','#cry|むかしのきょうだいとは、ちがう子たちだけど……ここにも、きょうだいができたみたいで、うれしいな。'],['N','#cry|フタバのきょうだいが、ふえたねぇ。',1],['F','#cry|えへへ。……むかしのきょうだいたちも、きっとよろこんでくれるよね。']]},
 {k:'e18',at:()=>sevHere('M')&&!!(S.sev||{}).e07&&cnt('farm')>=6,L:[['M','畑がふえてきたので、水まきの順番を計算してみました。……ですが、どう回っても、ぜんぶの畑に水が行きわたりません。'],['F','えー！ それなら、ぼくも手伝うよ！ いっしょに水くばろ！'],['M','#think|……計算より、人の手のほうが確実なこともあるのですね。'],['F','そうそう！ みんなでやれば、へっちゃらだよ！'],['M','#joy|はい。……ありがとうございます。']]},
 {k:'e20',at:()=>cnt('tree')+cnt('fruit')>=1&&S.qStory==null&&sevHere('F'),L:[['F','見て見て！ 木が植わってる！ まだちっちゃいね。'],['N','大きくなるまで、時間がかかるよぉ。',1],['F','#cry|むかし、きょうだいと大きな木の下で遊んだんだ。かくれんぼして、ぼくはいつもすぐ見つかっちゃって。'],['F','#think|……この木も、あの木みたいに、おっきくなるといいな。']]},
 {k:'e21',at:()=>flowerN()>=5&&S.qStory==null&&sevHere('F'),L:[['F','花が咲くと、ヌシ様がいたころの景色がもどってくるみたい。'],['F','ここは、いつも花の冠を作ってた場所なんだ。'],['N','上手に作れるのぉ？',1],['F','もちろん！ ほら、ノドカにもあげる！','N'],['N','#joy|ふふ、ありがとうねぇ。',1]]},
 {k:'e22',at:()=>cnt('swing')>=1&&sevHere('F'),L:[['F','ブランコ、できたー！'],['F','ノドカ、押して押して！','N'],['N','いくよぉ、せーの。',1],['F','#surprise|わあーっ！ たかーい！'],['N','フタバ、ほどほどにねぇ。',1],['F','もう一回！ もう一回！']]},
 {k:'e23',at:()=>atFarm(S.res.find(r=>r.name===sevName('N')))&&cnt('farm')>=6&&!!(S.sev||{}).e04b,L:[['F','ノドカ、ずっと畑にいるよ。ごはん、食べた？'],['N','あれぇ……もうこんな時間かぁ。畑が気になって、つい。'],['F','もう！ ぼくがお弁当もっていくから、ちょっと休もう！'],['N','#joy|ふふ、ありがとうねぇ。……フタバがいてくれて、助かるよぉ。']]},
 {k:'e10',at:()=>sevHere('K'),L:[['K','フッ…村の外まで、風がずっと続いているね。'],['F','#surprise|えっ、外まで見えるの！？ すごーい！'],['F','#think|……でも、あんまり遠くへ行っちゃだめだよ。迷子になっちゃうから。'],['K','おや。それは、きみのことじゃないのかな？'],['F','#joy|えへへ……このまえ迷ったの、見られてた？'],['K','#sigh|風はなんでも知っているのさ。…安心したまえ、ぼくの胸にしまっておくよ。']]},
 {k:'p1',at:()=>!!S.flags.minaCame&&S.quest>=12,L:[['N','フタバは、ずっとひとりでここにいたのぉ？'],['F','#worry|……うん。でもね、まえは、きょうだいがいっぱいいたんだ。'],['F','ぼくがいちばん下で、みんなでくっついて寝てたの。にぎやかだったなあ。'],['N','そっかぁ。……いまは、どこにいるのかなぁ。'],['F','#think|……わかんない。でも、いつか会えるって思ってる！'],['N','#nod|うん。それまで、ぼくがとなりにいるよぉ。']]},
 {k:'e12f',at:()=>!!S.flags.fHurtG&&!!S.flags.guard&&!(S.sev||{}).e12n&&sevHere('H'),/* こもれびのまもりをおぼえたあと、べつの夜に。e06（まもりをおぼえる話）とは、ちがう話 */L:[['F','#surprise|@H、ゆうべ、いっぱいたたかれてたよね……！ 葉っぱ、ちゃんと届いた？'],['H',{A:'#sigh|ああ、届いたよ。……あんたの葉っぱのおかげで、ちょっとだけ痛くなかった。',B:'#sigh|ああ、届いたぜ。……おまえの葉っぱのおかげで、ちょっとだけ痛くなかった。'}],['F','#think|ちょっとだけ……。もっと早く、もっとたくさん守れるようになるからね！'],['H',{A:'#think|……ふん。じゃあ、たよりにしてるよ。',B:'#think|……へっ。じゃあ、たよりにしてるぜ。'}],['F','#think|……でも、むりはしないでね。ほんとうに心配したんだから。'],['H',{A:'#think|……ばか。そんな顔するんじゃないよ。……ありがと。',B:'#think|……ばか。そんな顔すんな。……ありがとな。'}]]},
 {k:'e13m',at:()=>sevHere('M')&&(S.bossKills||0)>=1&&qDone('ookage')&&!!(S.sev||{}).e07,L:[['M','守り神さま、オオカゲが消えた場所を調べてみました。地面に、ふしぎな光が少しだけ残っていました。'],['M','そこに置いた花は、いつもより長く咲いていて……光の色も、見る角度で変わるんです。'],['F','#sigh|ふしぎ！ どうして？'],['M','#think|オオカゲが消えたときに出てきた「ヌシのかけら」と、同じ光です。……オオカゲは、ヌシ様の力を、体の中にとじこめていたのかもしれません。'],['M','ノドカさんの話では、ヌシ様の力は3つのかけらになったそうですね。言い伝えでは、「守る力」「育てる力」「想う力」の3つ。','N'],['M','言い伝えでは、ヌシ様の力は「守る力」「育てる力」「想う力」の3つのかけらになったそうです。','!N'],['N','3つそろったら、ヌシ様の形にもどれるんだよねぇ。',1],['M','ええ。のこりのかけらも、きっとどこかで、見つけてもらうのを待っています。']]},
 {k:'r1',at:()=>!!(S.sev||{}).e04&&sevHere('N')&&S.qStory==null,L:[['F','ノドカ。……なんだか、なつかしい匂いがするね。'],['N','そうかなぁ。ぼくからは、土の匂いしかしないと思うよぉ。'],['F','ううん、ちがう。草の匂い。ずっとむかしに、すぐそばで、かいでた匂い！'],['N','#think|……ふしぎだねぇ。ぼくも、フタバのとなりだと、なんだか、ねむくなるくらい安心するんだぁ。']]},
 {k:'r2',at:()=>sevHere('H')&&natNear('fire',q=>hour()>=9&&hour()<16&&!S.rain&&!roomOf((q.y|0)*W+(q.x|0)))&&S.qStory==null,L:[['H',{A:'#think|……なあ、フタバ。この草原のお日さまの下にいるとさ、背中がやけに落ち着くんだ。葉っぱをひろげて、お日さまをあびてたみたいな気がしてさ。',B:'#think|……なあ、フタバ。この草原のお日さまの下にいるとな、背中がやけに落ち着くんだ。葉っぱをひろげて、お日さまをあびてたみたいな気がしてな。'}],['F','#surprise|えっ、@Hが葉っぱ？ 火の子なのに！'],['H',{A:'ふん……おかしいよな。草なんて、あたいがさわったら、もえちまうのにさ。',B:'ふん……おかしいよな。草なんて、おれがさわったら、もえちまうのによ。'}],['F','#think|……ぼくのきょうだいにもね、お日さまの下で、背中をぽかぽかさせるのが、いちばん好きな子がいたんだ。']]},
 {k:'r3',at:()=>sevHere('M')&&natNear('water',q=>tileNear(q,2,j=>S.ground[j]===1))&&S.qStory==null,L:[['M','#think|……不思議なんです。この池の水の音を聞いていると、前にも、ここで聞いていた気がして。'],['F','#surprise|えっ、来たことあるの？'],['M','いえ。この土地に来たのは、初めてのはずです。……ですが、池のそばで、根っこから水をすっていたような気がするんです。'],['M','#think|……計算では、ありえません。'],['F','#think|……ぼくのきょうだいにもね、池のそばで、ずっと水の音を聞いてる子がいたよ。']]},
 {k:'r4',at:()=>sevHere('K')&&natNear('wind',q=>!isNight()&&!S.rain&&!roomOf((q.y|0)*W+(q.x|0)))&&S.qStory==null,L:[['K','フッ…おかしなものだね。この草原をわたる風を、ぼくは、下から見上げていた気がするんだ。草の葉っぱの上からね。'],['F','風の子なのに？'],['K','#sigh|ああ。風をおこすほうじゃなくて、風に、ゆらされるほうだった気がするのさ。'],['F','#think|……ぼくのきょうだいにもね、風がふくたびに、いちばん高くまで背をのばす子がいたよ。'],['K','フッ…それは、いい趣味だ。']]},
 {k:'r5',at:()=>sevHere('N')&&natNear('earth',q=>tileNear(q,3,j=>S.obj[j]==='rock'))&&S.qStory==null,L:[['N','#think|……フタバ。この岩のそばにいるとねぇ、ずっと前から、ここに根をはってたみたいな気分になるんだよぉ。'],['F','ノドカは土の子でしょ？ 根っこなんて、ないよ。'],['N','そうなんだけどねぇ。……ふしぎだねぇ。'],['F','#think|……岩のかげで、いつもひなたぼっこしてた、ぼくのきょうだいもいたなあ。']]},
 {k:'r2j',at:()=>sevHere('H')&&symNear('fire')&&S.qStory==null,L:[['H',{A:'#joy|見なよ、フタバ。灯台の光、村のはしっこまでとどいてる！',B:'#joy|見ろよ、フタバ。灯台の光、村のはしっこまでとどいてるぜ！'}],['F','#joy|ほんとだ！ 夜でも、みちがよく見えるね。'],['H',{A:'これなら、夜の見まわりも、こわくないさ。',B:'これなら、夜の見まわりも、こわくねえな。'}]]},
 {k:'r3j',at:()=>sevHere('M')&&symNear('water')&&S.qStory==null,L:[['M','#joy|フタバさん、見てください。噴水の水が、お日さまできらきらしています。'],['F','#joy|ほんとだ！ 虹も見えるよ！'],['M','みなさんが水しぶきで遊んでいると、わたしもうれしくなります。']]},
 {k:'r4j',at:()=>sevHere('K')&&symNear('wind')&&S.qStory==null,L:[['K','#joy|フッ…いい音だね。風車が、風といっしょに歌っているよ。'],['F','#joy|くるくる、くるくる！ 見てると、目がまわりそう！'],['K','風の通る道ができると、村じゅうが、すこし軽くなるのさ。']]},
 {k:'r5j',at:()=>sevHere('N')&&symNear('earth')&&S.qStory==null,L:[['N','#joy|フタバ、この石碑、どっしりしてて、いいねぇ。'],['F','うん！ そばにいると、なんだか安心する！'],['N','壁も、まえよりしっかりしたよぉ。みんなを守ってくれてるんだねぇ。']]},
 {k:'e14k',at:()=>sevHere('K')&&!!(S.sev||{}).e10&&(S.bossKills||0)>=2,L:[['K','#worry|……風が、熱を失っている。'],['F','え？'],['K','遠くの火の山から吹いてくる風が、冷たいんだ。あそこにも、困っている子たちがいるのかもしれないね。'],['F','#think|……ここみたいに？'],['K','フッ…いつか、だれかが助けに行くさ。たとえば、守り神とかね。']]},
 {k:'e11',at:()=>qAt('nushi'),L:[['F','#think|……ヌシ様、ほんとうに帰ってきてくれるかな。'],['N','ここまでできたんだよぉ。あと少しだねぇ。',1],['H',{A:'#sigh|夜はあたいにまかせな。最後まで村を守りぬくよ。',B:'#sigh|夜はおれにまかせろ。最後まで村を守りぬくぜ。'},1],['M','準備は進んでいます。できることを、ひとつずつ続けましょう。',1],['K','この場所なら、遠くからでも光が見えるはずさ。',1],['F','#think|……うん！ ぼくも、みんなといっしょにやる！'],['F','守り神さま！ ヌシ様を迎えに行こう！']]},
 {k:'e16',at:()=>(S.finalNight||S.finalOn)&&!S.cleared,L:[['F','台座から、あったかい力を感じる…！'],['N','#alarm|ヌシ様の力が、あつまってるんだねぇ。……影たちも、この力にひきよせられてくるよぉ。',1],['N','#think|……フタバ。はじめて会ったころより、ずっと頼もしくなったねぇ。',1],['F','#surprise|えっ、ほんと！？ えへへ……ありがとう、ノドカ！','N'],['H',{A:'来るなら来な。今夜でぜんぶ終わらせてやるよ。',B:'来るなら来い。今夜でぜんぶ終わらせてやるぜ。'},1],['F','#think|……うん。夜をこえたら、ヌシ様に会えるんだ！']]},
 {k:'e15',night:1,at:()=>!!(S.ns&&S.ns.final)&&S.enemies.some(e=>e.type==='boss2'&&e.spawned&&!e.dead)&&sevHere('F'),L:[['F','#think|……来た。あの、大きな影……！',0,'shake'],['F','あの夜も、こんな大きな影だった。'],['F','#cry|きょうだいたちが前に出て……ぼくは、奥でふるえてるだけだった。'],['F','#think|……っ！',0,'dash'],['H',{A:'くっ……数が多すぎる……！',B:'くそっ……数が多すぎる……！'},1],['N','フタバ、あぶないよぉ！',1],['F','#think|……ううん。もう、ふるえてるだけじゃない！'],['F','#danger|むかしは、みんなに守ってもらったけど……'],['F','今度は、ぼくが守る番だ！',0,'flash'],['F','#alarm|守り神さまも、おねがい！ 光で、「コワイノ」をおどかして！']],
  go:()=>{S.flags.finF=1;S.flags.guard=true;toast('フタバが、近くのみんなを葉っぱで守る！','good')}},
 {k:'e16g',vis:['ヨルノオオカゲが消えた朝。守護の台座が、ひときわ強くまたたいた。','光はゆっくりほどけて、守り神の手のひらへ、流れこんでくる。','草原の花々が、いっせいに顔をあげた。木々の葉が、さざ波のように鳴る。','この土地のすべてが、守り神に、力をかしてくれている。'],at:()=>!WD&&!!S.flags.finalWon&&!isNight()&&S.qStory==null&&!S.cleared&&!(S.flags&&S.flags.areaSkill),L:[['F','わっ……！ 守り神さまの手が、光ってる！'],['N','この土地みんなの力が、守り神さまに集まってるんだねぇ。',1],['H',{A:'へえ……こいつは頼もしいじゃないか。',B:'へえ……こいつは頼もしいじゃねえか。'},1],['G','おヌシ、それは「ひかりのはどう」じゃ。'],['G','#alarm|夜に光をはなつと、そのまわりで「コワイノ」に光がはじけるんじゃ。ただし、パワーを3つ使うぞい。'],['F','#joy|すごい……！ これで、また夜が来ても、みんなを守れるね！',0,'flash']],
  go:()=>{S.flags.areaSkill=true;toast('守り神が「ひかりのはどう」をおぼえた！','good');memo('✨','守り神が「ひかりのはどう」をおぼえた')}},/* 草原：ヨルノオオカゲをたおした朝に、守り神が目ざめる */
 {k:'e16v',vis:['守護の台座の光が、夜を前に、ひときわ強くまたたいた。','光はゆっくりほどけて、守り神の手のひらへ、流れこんでくる。','草原の花々が、いっせいに顔をあげた。木々の葉が、さざ波のように鳴る。','この土地のすべてが、守り神に、力をかしてくれている。'],at:()=>WD===1&&(S.finalNight||S.finalOn)&&!S.cleared&&!(S.flags&&S.flags.areaSkill),L:[['F','わっ……！ 守り神さまの手が、光ってる！'],['N','この土地みんなの力が、集まってるんだねぇ。',1],['H',{A:'へえ……こいつは頼もしいじゃないか。',B:'へえ……こいつは頼もしいじゃねえか。'},1],['G','おヌシ、それは「ひかりのはどう」じゃ。'],['G','#alarm|光をはなったところのまわりで、「コワイノ」に光がはじけるんじゃ。ただし、パワーを3つ使うぞい。'],['F','すごい……！ ぼくたちも、いっしょにがんばる！'],['F','今夜、みんなで守りきろう！',0,'flash']],
  go:()=>{S.flags.areaSkill=true;toast('守り神が「ひかりのはどう」をおぼえた！','good');memo('✨','守り神が「ひかりのはどう」をおぼえた')}},
 /* 消えた子がもどったとき（S.sevQ に入る） */
 {k:'b_N',q:1,L:[['N','#surprise|ふわぁ……ただいまぁ。'],['F','ノドカ！！'],['F','#think|……もう！ すっごく、心配したんだから！'],['N','#joy|ごめんねぇ。待っててくれて、ありがとう。'],['F','#think|……ほんとに、帰ってきた。'],['F','むかしは、ヌシ様の力までなくなっちゃって……もう会えないかもしれないって、思ってたんだ。','1st'],['F','#joy|おかえり！ こんどは、いっしょにごはん食べようね！']]},
 {k:'b_H',q:1,L:[['F','#joy|おかえり！ もう、ひとりでむちゃしないでよ！'],['F','むかしは、ヌシ様の力がなくなって、もう会えない子がいたんだ。……だから、ほんとによかった。','1st'],['H',{A:'#think|……ああ。今度は、いっしょに守ろう。',B:'#think|……おう。今度は、いっしょに守ろうぜ。'}],['F','#nod|うん！ ぼくも、もっとがんばる！']]},
 {k:'b_F',q:1,L:[['F','ただいま……！ ……あれ、ぼく、どれくらいいなかったの？'],['N','#joy|おかえりぃ。待ってたよぉ。',1],['F','消えてるあいだのことは、なんにも覚えてないんだ。ずっと、ねむってたみたい。'],['F','#worry|……むかしの、きょうだいたちも、こんなふうに、いなくなっちゃったのかな。','1st'],['F','#think|……うん。もう一回、みんなとがんばる！']]},
 {k:'ret',q:1,L:[['F','#think|……あっ！ 守り神さま！？'],['F','ほんとに帰ってきてくれたんだ！'],['F','#joy|えへへ……また会えた！'],['F','#danger|見て見て！ ぼくたち、ここを守ってたんだよ！']]},
];
function sevBusy(){return !started||!$('#dialog').hidden||sheet!=null||NEWRES!=null||NEWQ.length||!$('#lvup').hidden||!$('#rlv').hidden||ASKING}
const SEVRUN=new Set();/* いま再生中の会話（セーブしない） */
function checkSev(){if(WD||!S){SEVW={};return}if(!sevBusy())sevBub();if(S.cleared&&!(S.sevQ||[]).length)return;const D=S.sev||(S.sev={});if(sevBusy()||(S.sevQuietUntil||0)>S.t)return;
  const Q=S.sevQ||(S.sevQ=[]);while(Q.length){const k=Q[0],e=SEV1.find(x=>x.k===k);const L=e&&sevLines(e.L);if(!L){Q.shift();continue}return dialog(L,()=>{D[k]=1;const i=Q.indexOf(k);if(i>=0)Q.splice(i,1);if(/^b_/.test(k))S.flags.kizunaTold=1})}/* 会話を最後まで見てから「見た」にする（途中でゲームをとじたら、はじめから） */
  const h=hour(),day=h>=6&&h<21;
  for(const e of SEV1){if(e.q||D[e.k]||(S.sevMiss||{})[e.k]||SEVRUN.has(e.k)||(S.sevP||[]).includes(e.k))continue;if(!e.night&&!day)continue;if(!e.at())continue;const L=sevLines(e.L);if(!L)continue;
    if(e.k==='e08'||e.k==='e15'||e.k==='e09'||e.k==='e16g'||e.k==='e16v'){SEVRUN.add(e.k);const f=S.res.find(r=>r.name===POKO);if(f)centerOn(f.x*TS,f.y*TS);const run=()=>dialog(L,()=>{D[e.k]=1;SEVRUN.delete(e.k);if(e.go)e.go()});return e.vis?visionFX(e.vis,run):run()}/* ムービー・会話は、最後まで見てから「見た」にする（途中でゲームをとじたら、はじめから） */
    if(!sevAllHere(e))continue;(S.sevP||(S.sevP=[])).push(e.k)}/* ふつうの条件会話は、吹き出しをタップしてから。「見た」にするのは、最後まで見てから */
  sevBub()}
/* 話したそうな子：S.sevP にたまった条件会話を、先頭のセリフの子の吹き出しにする */
let SEVW={};
/* ピンクの条件会話：対象のそばへ集まり、到着してからリアクションと吹き出し。 */
const SEV_OBJECTS={e04:['table'],e07:['farm'],e18:['farm'],e20:['tree','fruit'],e21:['clover','bellf','salvia','lily','lotus'],e22:['swing'],e11:['tower'],e16:['tower'],r5:['rock'],r2j:['lighthouse'],r3j:['fountain'],r4j:['windmill'],r5j:['stele']};/* 「前にも知っている気がする」話（r2〜r5）は、自然の物（お日さま・池・風・岩）のそば。守り神がひらめいた建物では、よろこぶ話（r2j〜r5j） */
const SEV_CHARACTERS={e04b:'N',e05:'N',e06:'H',e06d:'H',e17:'F',e23:'N',e10:'K',p1:'F',e12f:'H',e13m:'M',r1:'N',e14k:'K'};
const SEV_HAPPY=new Set(['e04','e05','e17','e20','e21','e22','e16']);
const SEV_ENCOUNTERS=new WeakMap(),SEV_RETRY=new WeakMap();
function sevActors(L){return [...new Set(L.map(l=>l[0]).filter(n=>n&&n!==GOD&&n!==NUSHI1))].map(n=>S.res.find(r=>r.name===n)).filter(Boolean)}
function sevAvailable(r){return !r.hidden&&r.hunger>=30&&!hungry(r)&&r.energy>=10&&!onHold(r)&&!HOLD.has(r.id)&&!(r.spawnT&&performance.now()-r.spawnT<1300)&&!(r.act&&['eat','fetch','forage','flee','faint','sleep','questjoy','store','bathe'].includes(r.act.type))&&!(r.toStor&&carryN(r)>0)&&!(r.act&&r.act.stage==='walk'&&!['wander','idle','sevreact'].includes(r.act.type)&&r.path&&r.path.length>8)&&!r.cing/* 荷物をしまう・作業に向かう道のり・料理の途中は、ピンクの会話に呼ばない（着くまぎわなら、いい） */}
function sevTargetAlive(t){return t.obj!=null?S.obj[t.obj]===t.id:S.res.some(r=>r.name===t.who&&!r.hidden)}
function sevClose(r,t){const dx=Math.max(t.x-r.x,0,r.x-(t.x+t.w)),dy=Math.max(t.y-r.y,0,r.y-(t.y+t.h));return Math.hypot(dx,dy)<=1.05}
function sevTargets(e,actors){const ids=SEV_OBJECTS[e.k],lead=actors[0];if(ids){const found=[],recent=QUEST_PLACEMENTS.get(S);for(let j=0;j<S.obj.length;j++){const id=S.obj[j];if(!ids.includes(id))continue;if(e.k==='e21'&&isBud(j))continue;const b=BL[id],z=b&&szAt(id,j)||[1,1],last=recent&&recent.get(j);found.push({obj:j,id,x:j%W,y:(j/W)|0,w:z[0],h:z[1],score:(last&&last.id===id?last.n*100000:0)-Math.hypot(j%W+.5-lead.x,(j/W|0)+.5-lead.y)})}return found.sort((a,b)=>b.score-a.score)}
  const n=SEV_CHARACTERS[e.k]&&sevName(SEV_CHARACTERS[e.k]),anchor=actors.find(r=>r.name===n)||actors[1]||lead;return anchor?[{who:anchor.name,x:anchor.x|0,y:anchor.y|0,w:1,h:1}]:[];
}
function sevCancel(enc,skip,retry=true){if(!enc||SEV_ENCOUNTERS.get(S)!==enc)return;SEV_ENCOUNTERS.delete(S);if(retry){let m=SEV_RETRY.get(S);if(!m){m={};SEV_RETRY.set(S,m)}m[enc.k]=S.t+60}/* やめたら、60分はさそいなおさない */for(const r of enc.actors)if(r!==skip&&r.act&&r.act.type==='sevreact'&&r.act.sevKey===enc.k)endAct(r);SEVW={}}
function sevMissed(enc){const e=SEV1.find(x=>x.k===enc.k);if(!(e&&e.go))(S.sevMiss||(S.sevMiss={}))[enc.k]=1;/* 話がすすむ大事な会話（まもりをおぼえる など）は、また出す */const P=S.sevP||[],i=P.indexOf(enc.k);if(i>=0)P.splice(i,1);sevCancel(enc,null,!(e&&e.go))}
function sevInterrupted(r,a){if(a.reactUntil!=null&&JOYU.get(r)===a.reactUntil)JOYU.delete(r);const enc=SEV_ENCOUNTERS.get(S);if(enc&&enc.k===a.sevKey&&!enc.ready)sevCancel(enc,r)}
function sevEncounterSafe(enc,pre){return !isNight()&&sevTargetAlive(enc.target)&&enc.actors.every(r=>S.res.includes(r)&&(pre?sevAvailable(r)&&r.hunger>=40&&r.energy>=25&&!carryN(r)&&!r.cmat&&!r.meal:sevStay(r,enc))&&questVisitSafe(r,enc.target.y*W+enc.target.x))}/* pre：さそうとき（おなか・元気に余ゆうがあって、荷物を持っていない子だけ）。さそったあとは、おなか・元気が切れたときだけやめる */
function sevStay(r,enc){return !r.hidden&&r.hunger>=30&&!hungry(r)&&r.energy>=10&&!onHold(r)&&!HOLD.has(r.id)&&!!r.act&&r.act.type==='sevreact'&&r.act.sevKey===enc.k}
function sevPlans(actors,target){const used=new Set(),plans=[];for(const r of [...actors].sort((a,b)=>(b.name===target.who)-(a.name===target.who))){const G=bfs(r.x|0,r.y|0),occupied=occTiles(r);let stand=-1,best=Infinity;for(let yy=Math.max(0,target.y-1);yy<=Math.min(H-1,target.y+target.h);yy++)for(let xx=Math.max(0,target.x-1);xx<=Math.min(W-1,target.x+target.w);xx++){const inside=xx>=target.x&&xx<target.x+target.w&&yy>=target.y&&yy<target.y+target.h;if(inside&&r.name!==target.who)continue;const j=yy*W+xx;if(G.dist[j]<0||!walk(j)||used.has(j)||occupied.has(j))continue;const score=G.dist[j]*10+(yy<target.y?0.1:0);if(score<best){stand=j;best=score}}if(stand<0)return null;used.add(stand);plans.push({r,G,stand})}return plans}
function sevBegin(e,L){const actors=sevActors(L);if(!actors.length||actors.some(r=>!sevAvailable(r)))return false;for(const target of sevTargets(e,actors).slice(0,16)){const enc={k:e.k,actors,target,speaker:actors[0],L,ready:false,started:S.t};if(!sevEncounterSafe(enc,true))continue;const plans=sevPlans(actors,target);if(!plans)continue;for(const {r}of plans)endAct(r);SEV_ENCOUNTERS.set(S,enc);for(const {r,G,stand}of plans){startAct(r,G,'sevreact',stand,{sevKey:e.k});if(SEV_ENCOUNTERS.get(S)!==enc)return false}return true}return false}
function sevReactReady(enc){if(enc.ready||!sevEncounterSafe(enc))return;if(!enc.actors.every(r=>r.act&&r.act.type==='sevreact'&&r.act.sevKey===enc.k&&r.act.stage==='do'&&sevClose(r,enc.target)))return;enc.ready=true;enc.readyT=S.t;const now=performance.now();for(const r of enc.actors){const a=r.act,line=enc.L.find(l=>l[0]===r.name)||[],lk=lineLook(line[1]||'');a.reactMotion=lk.motion==='none'?(SEV_HAPPY.has(enc.k)?'joy':'nod'):lk.motion;a.reactAt=now;a.reactUntil=now+2400;const look=enc.target.who===r.name?enc.actors.find(q=>q!==r):null;r.face=(look?look.x:enc.target.x+enc.target.w/2)>=r.x?1:-1;if(a.reactMotion==='joy'){JOYU.set(r,a.reactUntil);JUMP.set(r,now);r.shine=now;r.bubble='😊'}else r.bubble=a.reactMotion==='shock'?'！':a.reactMotion==='think'?'💭':a.reactMotion==='sad'?'…':'♪'}if(enc.actors.some(r=>r.act.reactMotion==='joy'))sfxAt('good',enc.speaker.x,enc.speaker.y);SEVW[enc.speaker.name]=enc.k}
ACT.sevreact={start(r,a){const enc=SEV_ENCOUNTERS.get(S);if(!enc||enc.k!==a.sevKey||!sevClose(r,enc.target))return false;sevReactReady(enc)},tick(r,a){const enc=SEV_ENCOUNTERS.get(S);if(!enc||enc.k!==a.sevKey)return;if(enc.ready&&S.t-enc.readyT>30){sevMissed(enc);return}/* そろってから30分、話しかけられなかったら、この会話はもう出ない */if(!sevEncounterSafe(enc)||!enc.ready&&S.t-enc.started>30){sevCancel(enc);return}/* 30分たってもそろわないときは、やめる */sevReactReady(enc);if(a.reactMotion==='joy'&&!a.secondHop&&performance.now()-a.reactAt>=900){a.secondHop=true;JUMP.set(r,performance.now())}},done:(r,a)=>{const enc=SEV_ENCOUNTERS.get(S);return !enc||enc.k!==a.sevKey}};/* リアクションのあとも、話しかけられるまでその場で待つ */

/* 掛け合い会話は、話す子たちが近くにいるときだけ吹き出しを出す */
function sevNear(L){const ps=[...new Set(L.map(l=>l[0]).filter(n=>n&&n!==GOD&&n!==NUSHI1))].map(n=>S.res.find(r=>r.name===n)).filter(Boolean);for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(Math.hypot(ps[i].x-ps[j].x,ps[i].y-ps[j].y)>6)return false;return true}
function sevQuestBusy(){return !!QUEST_CLEAR_WAIT||Object.values(SUB_CLEAR_WAIT).some(w=>w&&!w.done)||Object.values(SUBW).some(k=>S.subSt&&S.subSt[k]===3)}
function sevBub(){SEVW={};if(!S)return;const P=S.sevP||[];for(let i=P.length-1;i>=0;i--)if(!SEV1.some(e=>e.k===P[i]))P.splice(i,1);
  {const D=S.sev||(S.sev={});for(let i=P.length-1;i>=0;i--){const k=P[i],e=SEV1.find(x=>x.k===k);let ok=true;try{ok=!e.at||!!e.at()}catch(_){}if(ok)continue;/* きっかけの条件（畑にいる・近くにいる など）がなくなったら、ピンクを引っこめる。またそろったら、出しなおす */const enc=SEV_ENCOUNTERS.get(S);if(enc&&enc.k===k)sevCancel(enc,null,false);P.splice(i,1);delete D[k]}}
  let enc=SEV_ENCOUNTERS.get(S);if(enc&&(!P.includes(enc.k)||!sevTargetAlive(enc.target))){sevCancel(enc);enc=null}
  if(sevBusy()||sevQuestBusy()||S.qStory!=null||isNight()||S.sevTalkAt!=null&&S.t-S.sevTalkAt<180)return;
  if(enc){if(!sevEncounterSafe(enc)){sevCancel(enc);return}if(enc.ready){if(sevNear(enc.L)&&enc.actors.every(r=>sevClose(r,enc.target)))SEVW[enc.speaker.name]=enc.k;else sevCancel(enc)}return}
  const retry=SEV_RETRY.get(S)||{};for(const k of P){if(retry[k]>S.t)continue;const e=SEV1.find(x=>x.k===k),L=sevLines(e.L);if(!L||!sevAllHere(e))continue;if(sevBegin(e,L))return;retry[k]=S.t+5}SEV_RETRY.set(S,retry)}
function pauseAfterPink(lines){S.sevTalkAt=S.t;S.sevQuietUntil=S.t+180;for(const [name]of lines){const r=S.res.find(r=>r.name===name);if(r)r.chatCD=Math.max(r.chatCD||0,S.sevQuietUntil)}}
function sevTalk(k){if(!$('#dialog').hidden)return;const enc=SEV_ENCOUNTERS.get(S);if(!enc||enc.k!==k||!enc.ready||SEVW[enc.speaker.name]!==k)return;const P=S.sevP||[],i=P.indexOf(k),e=SEV1.find(x=>x.k===k);if(i<0||!e)return;const L=sevLines(e.L);if(!L)return;P.splice(i,1);S.sevTalkAt=S.t;const actors=enc.actors.filter(r=>!r.hidden);if(actors.length){const tx=actors.reduce((v,r)=>v+r.x,0)/actors.length*TS,ty=(actors.reduce((v,r)=>v+r.y,0)/actors.length-.7)*TS;camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx,ty,t:0,dur:.6}}sevCancel(enc,null,false);sevBub();pauseAfterPink(L);for(const r of actors)r.chatCD=Math.max(r.chatCD||0,S.sevQuietUntil);/* ピンクの会話のあいだ、ふつうの会話は始めない */
  const run=()=>dialog(L,()=>{(S.sev||(S.sev={}))[k]=1;pauseAfterPink(L);if(e.go)e.go()});e.vis?visionFX(e.vis,run):run()}/* 最後まで見てから「見た」にする（途中でゲームをとじたら、はじめから） */
/* 消えたときの会話。null ならいつもの説明 */
const GVOICE=()=>godHere()?'':'……聞こえるかの？ 遠くから、声だけ届けておるぞい。';
const HOWK=n=>[[GOD,GVOICE()+'次の朝、神殿で、'+n+'を呼びもどせるぞい。']];
function deathTalk(r){if(WD)return null;const F=S.flags,n=r.name,tell=k=>{const t=!F.deathTold;F.deathTold=true;return t?[[GOD,'この土地に深くなじんだせいれいは、消えても土地とのつながりが残る。それをたどって、また帰ってこられるんじゃ。']].concat(HOWK(n)):[]};
  if(n===POKO&&!F.lostF){const L=sevLines([['N','#worry|……フタバ、いなくなっちゃったねぇ。',1],['N','フタバは、この土地にすっかりなじんでるからねぇ。消えても、土や草とのつながりが残ってるんだぁ。それをたどって、帰ってこられるよぉ。',1],['N','ぼくがいるからねぇ。フタバが帰ってくるまで、いっしょに村を守ろうねぇ。',1],['H',{A:'#sigh|あの子、最後までだれかを守ろうとしてたよ。',B:'#sigh|あいつ、最後までだれかを守ろうとしてたぜ。'},1],['M','神殿に力を集めましょう。また会えるはずです。',1],['K','帰ってきたら、ちゃんと迎えてあげよう。',1]]);if(!L)return null;F.lostF=1;F.deathTold=true;return L.concat(HOWK(n))}
  if(!sevHere('F'))return null;
  if(n===MINA&&!F.lostN){F.lostN=1;F.deathTold=true;return sevLines([['F','#think|……ノドカ？ ねえ、ノドカ！'],['F','#think|……いつもみたいに、「だいじょうぶだよぉ」って言ってよ……。'],['F','#think|……やだよ。ぼく、またひとりになるの……？'],['G',GVOICE()+'フタバ。ノドカは、この土地に深くなじんでおる。土地とのつながりをたどって、神殿から帰ってこられるんじゃ。'],['G','次の朝、神殿で、ノドカを呼びもどせるぞい。'],['F','#think|……ほんと？ じゃあ、ぼく……明日まで待ってる。']])}
  if(n===keyName('fire')&&F.guard&&!F.lostH){F.lostH=1;return sevLines([['F','#think|……うそ。$が……。'],['F','さっきまで、ぼくの前で、あんなに強く戦ってたのに……。'],['F','#sigh|ぼく、守るって言ったのに……！'],['F','葉っぱのまもり、もっと早く使えてたら……。'],['N','フタバがいっしょに守ろうとしたことは、なくならないよぉ。',1],['G',GVOICE()+'フタバ。そやつの勇気は、ちゃんと皆に届いておるぞい。','!N'],['F','#scared|……ううん、泣いてばかりじゃだめだ。$は、ぼくたちを守ってくれたんだもん。'],['F','#think|……うん。帰ってきたら、ちゃんと「おかえり」って言うんだ。']],n).concat(tell())}
  if(isKey(n)&&n!==MINA&&n!==POKO&&!F['lostK'+r.elem]){F['lostK'+r.elem]=1;return sevLines([['F','#worry|……$！？ ……いなくなっちゃったの？'],['F','いっしょに、もっといろんなことしたかったのに……。'],['F','#joy|まだ、ありがとうも言えてないよ……。'],['N','$も、フタバのこと、大事に思ってたよぉ。',1],['G',GVOICE()+'フタバ。神殿の力で、$はまた帰ってこられる。それまでは、みんなで村を守るんじゃ。','!N'],['F','#danger|……うん。帰ってくるまで、村を守ってるからね。']],n).concat(tell())}
  if(!isKey(n)&&!F.lostA){F.lostA=1;const L=sevLines([['F','#worry|……え？ $が、いなくなっちゃった……？'],['F','さっきまで、いっしょにいたのに……。'],['F','ぼく、もっとちゃんと見ててあげればよかった……。',0,'dim']],n);
    L.push(sevHere('N')?[MINA,'#think|……ふつうの子はねぇ、消えると、自然にかえるんだよぉ。同じ姿では、もう戻ってこられないんだぁ。']:[GOD,'#think|……ふつうのせいれいは、消えると自然にかえる。同じ姿では、もう戻ってこられんのじゃ。']);
    L.push([POKO,'#think|……そっか。'],sevHere('N')?[MINA,'#surprise|かえった子は、この土地の風や土になって、ずっとそばにいてくれるよぉ。']:[GOD,'#cry|かえった子は、この土地の風や土になって、そばにおる。……さみしいのう。'],[POKO,'ぼく、'+n+'のこと、忘れないよ。']);
    if(!F.death2Told){F.death2Told=true;L.push([GOD,GVOICE()+'オオカゲが落とす「めぶきのしずく」があれば、べつじゃがの。'])}
    L.push([POKO,'#think|……みんな、ちゃんとごはんを食べて、休もうね。']);return L}
  return null}
function sevBack(n){if(WD||!S.flags)return;const Q=S.sevQ||(S.sevQ=[]),F=S.flags;if(n===POKO&&F.nushiWait&&!S.cleared){F.nushiWait=0;F.nushiDue=1;setTimeout(()=>{if(!S.cleared)nushiReturns()},7000)}/* フタバがもどってから、ヌシ様がくる */
  if(n===MINA&&F.lostN&&!F.backN){F.backN=1;Q.push('b_N')}else if(n===POKO&&F.lostF&&!F.backF){F.backF=1;Q.push('b_F')}else if(n===keyName('fire')&&F.lostH&&!F.backH){F.backH=1;Q.push('b_H')}}
/* フタバの「こもれびのまもり」：近くで「コワイノ」にねらわれている火の子を、葉っぱで守る（受けるダメージ半分） */
function atkFX(r,en){fx.push({k:'slash',x:en.x*TS,y:en.y*TS-6,d:en.x>=r.x?1:-1,life:1});for(let n=0;n<8;n++){const a=Math.random()*6.28;fx.push({k:'p',x:en.x*TS,y:en.y*TS-6,vx:Math.cos(a)*70,vy:Math.sin(a)*70-20,life:.7,col:n%2?'#fff3a0':'#ffb347',r:3})}}/* 攻撃：弧をえがく斬撃と火花 */
function leafFX(t){for(let n=0;n<14;n++){const a=n/14*6.28;fx.push({k:'p',x:t.x*TS+Math.cos(a)*10,y:t.y*TS+Math.sin(a)*5,vx:Math.cos(a)*40,vy:Math.sin(a)*20-30,life:1,col:n%2?'#8fdc6a':'#c8f5a0',r:2.6})}}
const faceTo2=(f,t)=>{f.face=t.x>=f.x?1:-1};
function guardTick(){const fin=!WD&&!!(S.ns&&S.ns.final)&&isNight();if(WD||!(S.flags.guard||fin)||!S.enemies.length)return;const f=S.res.find(r=>r.name===POKO);if(!f||(f.act&&f.act.type==='faint')||f.hunger<25)return;
  if(f.gw){if(S.t<f.gw.t)return;const t=f.gw.tg;f.gw=null;if(S.res.includes(t)&&!t.hidden&&Math.hypot(t.x-f.x,t.y-f.y)<=(fin?3.6:2.6)&&(t.shU||0)<=S.t){t.shU=S.t+40;if(fin)f.shU=S.t+40;f.gcd=S.t+75;leafFX(t);leafFX(f);/* ふだんは、守るのは火の子1人だけ */if(fin)for(const u of S.res){if(u===t||u===f||u.hidden||Math.hypot(u.x-f.x,u.y-f.y)>3)continue;u.shU=S.t+40;leafFX(u)}/* 最後の夜：フタバのまわり3マスの子をまとめて守る */addFloat(f.x,f.y-1,'こもれびのまもり！','#5fbf3f');sfx('bush');if(fin&&!S.flags.finF){S.flags.finF=1;S.flags.guard=true;}/* セリフは、ヨルノオオカゲが来たときのお話（e15）で言う */}return}/* 近くまで来て、ひとふりしてから発動 */
  if((f.gcd||0)>S.t)return;
  let best=null;const hk=keyName('fire');for(const t of S.res){if(t===f||(t.elem!=='fire'&&!fin)||(t.shU||0)>S.t||Math.hypot(t.x-f.x,t.y-f.y)>(fin?3:2))continue;if(!S.enemies.some(e=>!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<2.6))continue;const p=t.name===hk?0:1;if(!best||p<best[0])best=[p,t]}
  if(!best)return;f.gw={t:S.t+.8,tg:best[1]};JUMP.set(f,performance.now());faceTo2(f,best[1])}/* 最後の夜：フタバがみんなを守る */
function drawLeaf(r,now){const px=r.x*TS,py=r.y*TS;ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle='rgba(130,215,100,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,py+6,14,6,0,0,7);ctx.stroke();
  for(let i=0;i<5;i++){const a=now/450+i*1.2566,lx=px+Math.cos(a)*15,ly=py-4+Math.sin(a)*7;ctx.fillStyle=i%2?'#7ccf5a':'#a8e67f';ctx.beginPath();ctx.ellipse(lx,ly,3.6,1.9,a,0,7);ctx.fill()}ctx.restore()}
/* 次のステージへ、はじめて出発するとき：フタバとのお見送り */
function departOK(){if(LIVE[0]&&LIVE[0].summary&&LIVE[0].cleared)loadStage(0);let d=false;try{d=KV.getItem('hakoniwa-dep1')==='1'}catch(e){}return !d&&LIVE[0]&&LIVE[0].cleared&&LIVE[0].res.some(r=>r.name===POKO)}
function depart(go){$('#maps').hidden=true;continueGame(LIVE[0]);const f=S.res.find(r=>r.name===POKO);if(f)centerOn(f.x*TS,f.y*TS);
  const gv=S.godVisit;S.godVisit=true;/* 見送りには、カミサマも村に来ている */
  const A=sevLines([['G','さあ、次は火山のふもとの村じゃ。そろそろ行くぞい。'],['F','#think|……もう、行っちゃうんだね。'],['F','#think|……ほんとはね、行かないでって、言いたい。'],['F','#scared|あの夜、みんながぼくをかくしてくれたから、ぼくは生きてる。だから、だれかがいなくなるのが、こわくて……。'],['U','フタバ。守り神は、いなくなるのではない。ほかの土地を助けに行くのだ。'],['F','#think|……うん。あの夜のぼくみたいな子が、待ってるかもしれないんだ。'],['F','ぼく、もうかくれてるだけじゃないよ。みんなのことは、ぼくが守るから！'],['F','#think|……いってらっしゃい！ ちゃんと、ここで待ってるから！ でも、たまには帰ってきてね。ぜったいだよ？'],['G','#nod|うむ……。鼻の奥がつーんとしたわい。行ってくるぞい。'],
    ['N','ここは、ぼくたちにまかせてねぇ。',1],['H',{A:'安心して行ってきな。夜はあたいらが守るよ。',B:'安心して行ってこい。夜はおれたちが守るぜ。'},1],['M','次の村のせいれいたちも、元気になりますように。',1],['K','フッ……最初は、なんとも素朴な村だと思ったけれど。',1],['K','今では、世界でいちばん心地よい風が吹く場所かもしれないね。きみの旅路に、いい風が吹きますように。',1],['U','この草原は、わたしたちが見守ろう。'],
    ['F','#think|……いっちゃったね。'],['N','#worry|……さみしいねぇ。',1],['F','#think|……うん。すっごく。'],['F','#think|……でも、ぼく、ここをきれいにして待ってるんだ。'],['F','#surprise|帰ってきたら、びっくりさせちゃうんだから……！']]);
  setTimeout(()=>dialog(A,()=>{try{KV.setItem('hakoniwa-dep1','1')}catch(e){}S.flags.ret1=1;S.godVisit=gv;save();setTimeout(go,1600)},'出発する'),700)}
/* ふしぎな種：せいれいにあげると、能力のどれかが上がる（パワーの強化とは別） */
const UPK=[['atk','攻撃力'],['pow','作業スピード'],['spd','移動速度'],['sta','スタミナ'],['cap','持てる数']];
function giveSeed(r){if((S.mseed||0)<1)return;const T=r.sst||(r.sst={}),L=UPK.filter(([k])=>(T[k]||0)<6&&(k!=='atk'||r.elem==='fire'));/* 攻撃力は火の子だけ */if(!L.length)return toast(r.name+'は、これ以上ふしぎな種で強くならない');
  S.mseed--;const[k,nm]=pick(L),n=T[k]||0,inc=Math.min(Math.random()<.75?1:2,6-n);T[k]=n+inc;
  if(k==='pow'||k==='spd'||k==='sta')r.vr[k]=Math.round(((r.vr[k]||1)+.1*inc)*100)/100;
  RSC.delete(r);addFloat(r.x,r.y-1.6,nm+'+'+inc,'#9fe8ff');upFx(r,nm,'+'+inc,inc>1);if(!S.mseed)sheetArg=null;renderSheet()}
/* 強化の演出：せいれいが喜んで、光とキラキラ */
const JOYU=new WeakMap(),RHOLD=new WeakMap(),DLGN=new Set();/* HOLD：話している・喜んでいる間は作業を止める */
const onHold=r=>(RHOLD.get(r)||0)>performance.now()||DLGN.has(r.name)&&!document.getElementById('dialog').hidden;/* 画面だけの時間（セーブしない） */

/* 会話はせいれいの願い、図案はプレイヤーである守り神のひらめき。 */
const QUEST_INSPIRATIONS={"stor": ["stor"], "mbox": ["mbox"], "table": ["table"], "baseUp": ["kamizo"], "bed": ["bed"], "watch1": ["watch", "spike"], "wind": ["swing"], "wood6": [], "flower50": ["campfire"], "shizukuRest": ["bench", "tub"], "ep1": ["bed"], "ep2": ["table", "swing", "sandbox"], "ep4": ["fountain"], "ep5": ["campfire"], "chair2": ["chair"], "bed3": ["bed"], "light3": ["torch"], "houselight": ["lantern"], "oven": ["oven"], "board": ["board"], "watch2": ["watch"], "wmill": ["windmill"], "toy2": ["sandbox"], "toy3": ["seesaw"], "swing1": ["swing"], "deco3": ["hedge"], "room": ["shelf1", "rug1", "curtain1"], "paint": ["paint2"], "trap4": ["spike"], "jar2": ["jar"], "parasol": ["parasol"]};
const QUEST_INSPIRATIONS_CLEAR={"mbox": ["crate"], "chair2": ["stool"], "wood6": [], "flower50": [], "shizukuRest": ["sink"], "ep1": ["crate", "rug1"], "ep2": [], "ep4": ["parasol"], "ep5": [], "bed3": ["rug1"], "light3": [], "houselight": [], "oven": ["sink"], "board": ["shelf1"], "watch2": ["signpost"], "toy2": [], "deco3": ["hedge"], "house2": [], "room": [], "paint": [], "jar2": ["tub"], "fish5": ["bench"], "parasol": []};
function questRecipeIds(q,phase='accept'){return [...new Set(phase==='clear'?(QUEST_INSPIRATIONS_CLEAR[q.k||q.id]||[]):[...(QUEST_INSPIRATIONS[q.k||q.id]||[]),...(q.learn||[]),...(q.talk&&q.talk.learn||[])])].filter(id=>!!BL[id]&&!(BL[id].offerOnly&&BL[id].kind==='furn'))}
function ideaDialogue(q,lines,phase='accept'){const ids=questRecipeIds(q,phase).filter(id=>!(S.guardianIdeas||{})[id]&&(!S.free||BL[id].kind!=='furn')),out=[];let put=false;for(const x of lines){if(x[0]==='@idea'){if(ids.length)out.push(['@idea',ids]);put=true}else out.push(x.slice())}if(!put&&ids.length)out.push(['@idea',ids]);return out}/* セリフの表の ['@idea'] の場所で、思いついた形を見せる（印がなければ、さいごに） */
function showGuardianIdea(ids,done){voiceStop();const overlay=document.createElement('div');overlay.className='idea-reveal';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','あたらしいかたち');const rays=document.createElement('div');rays.className='idea-rays';overlay.appendChild(rays);for(let k=0;k<18;k++){const star=document.createElement('span');star.className='idea-spark';star.textContent=k%3?'✦':'✧';const a=k*Math.PI*2/18;star.style.setProperty('--sx',Math.cos(a)*(120+k%4*45)+'px');star.style.setProperty('--sy',Math.sin(a)*(150+k%4*50)+'px');star.style.animationDelay=k%4*.08+'s';overlay.appendChild(star)}const card=document.createElement('div');card.className='idea-card';const symbol=document.createElement('div');symbol.className='idea-symbol';symbol.textContent='💡';const heading=document.createElement('h2');heading.textContent='あたらしいかたち';const list=document.createElement('div');list.className='idea-items';for(const id of ids){const item=document.createElement('div');item.className='idea-item';const img=document.createElement('img');img.src=iconURL(id);img.alt='';const name=document.createElement('span');name.textContent=BL[id].name;item.append(img,name);list.appendChild(item)}const button=document.createElement('button');button.type='button';button.className='btn pri';button.textContent='つづける';button.disabled=true;card.append(symbol,heading,list,button);overlay.appendChild(card);document.body.appendChild(overlay);sfx('level');let ended=false;const prior=document.activeElement;setTimeout(()=>{if(!overlay.isConnected)return;button.disabled=false;button.focus({preventScroll:true})},1300);button.onclick=()=>{if(ended||button.disabled)return;ended=true;overlay.remove();if(prior&&prior.isConnected)prior.focus({preventScroll:true});done()}}
function inspireQuest(q,phase='accept'){const ids=questRecipeIds(q,phase).filter(id=>!S.free||BL[id].kind!=='furn');if(!ids.length)return;
  const known=S.guardianIdeas||(S.guardianIdeas={});S.recipes||(S.recipes={});const fresh=ids.filter(id=>!known[id]);ids.forEach(id=>{known[id]=true;S.recipes[id]=true});if(!fresh.length)return;
  const text='あたらしいかたち：'+fresh.map(id=>BL[id].name).join('・');toast(text,'good');memo('💡',text);
}
function otherModeFurnitureRecipes(){const known=new Set();for(const w of[0,1]){let d=LIVE&&LIVE[w];if(!d)try{const raw=KV.getItem(SAVE_KEYS[w]);if(raw)d=JSON.parse(raw)}catch(e){}if(!d||d.free)continue;syncQuestRecipes(d);for(const id of FURN)if((d.recipes||{})[id])known.add(id);if((d.recipes||{}).window)known.add('window')}return known}
function syncQuestRecipes(s){const shared=s.free?otherModeFurnitureRecipes():null,learn=(q,phase)=>{for(const id of questRecipeIds(q,phase)){if(s.free&&BL[id].kind==='furn')continue;(s.recipes||(s.recipes={}))[id]=true;(s.guardianIdeas||(s.guardianIdeas={}))[id]=true}};
  for(const id of FURN)if(!BL[id].offerOnly&&((s.inv||{})[id]||(s.obj||[]).includes(id)||(s.orders||[]).some(o=>o.type===id)||Object.values(s.win||{}).includes(id)))(s.recipes||(s.recipes={}))[id]=true;/* 旧セーブの所持・設置済み家具は既知の形として維持 */
  if((s.inv||{}).window||(s.obj||[]).includes('window')||(s.orders||[]).some(o=>o.type==='window')||Object.values(s.win||{}).includes('window'))(s.recipes||(s.recipes={})).window=true;
  const list=QL[s.world||0]||[];list.forEach((q,i)=>{const done=i<s.quest&&s.qStory!==i,accepted=i<s.quest||i===s.quest&&s.qTalked;if(accepted)learn(q,'accept');if(done)learn(q,'clear')});
  for(const q of SUBQ){if(q.w!=null&&q.w!==(s.world||0))continue;const done=(s.subDone||{})[q.k];if(done||(s.subSt||{})[q.k]>=2||(s.subSeen||{})[q.k])learn(q,'accept');if(done)learn(q,'clear')}
  if(!s.free&&(s.lv||1)>=4){s.unlocked||(s.unlocked={});s.unlocked.window=true;(s.recipes||(s.recipes={})).window=true;(s.guardianIdeas||(s.guardianIdeas={})).window=true}
  if(s.free){if(shared.has('window')){(s.recipes||(s.recipes={})).window=true;(s.unlocked||(s.unlocked={})).window=true}else{delete(s.recipes||{}).window;delete(s.unlocked||{}).window}
    for(const id of FURN){if(shared.has(id)){(s.recipes||(s.recipes={}))[id]=true;(s.guardianIdeas||(s.guardianIdeas={}))[id]=true}else{delete(s.recipes||{})[id];delete(s.guardianIdeas||{})[id]}}}
}
/* クエスト達成の喜び：経路で対象のそばへ行く。会話や進行は自動で開かない。 */
const QUEST_VISIT_MAIN={"inn": ["bed"], "ashiyu": ["bench"], "statue": ["statue"], "stor": ["stor"], "mbox": ["mbox"], "table": ["table"], "wall": ["hwall", "door"], "path": ["path"], "bed": ["bed"], "fence4": ["fence", "logfence", "bamboofence", "wall"], "watch1": ["watch", "spike"], "kikyo": ["bellf"], "farm6": ["farm"], "imoseed": ["farm"], "tower": ["tower"], "flower50": ["clover", "bellf", "salvia", "lily", "lotus"], "springA": ["hotstone"], "shizukuRest": ["bench", "tub"], "ep1": ["hwall", "door", "bed"], "ep2": ["clover", "bellf", "salvia", "lily", "lotus", "table", "swing", "sandbox"], "ep4": ["fountain"], "ep5": ["campfire"]};
const QUEST_VISIT_SUB={"housefood": ["stor"], "fbench2": ["bench", "takebench"], "fbed2": ["bed", "yorubed"], "bedall": ["bed", "yorubed"], "yogan1": ["yogan"], "festdeco": ["hedge", "birdbath", "parasol", "arch", "signpost", "monstera"], "festlight": ["torch", "lamp", "campfire", "lantern", "candle"], "fence20": ["fence", "logfence", "bamboofence"], "lumber1": ["lumber"], "quarry1": ["quarry"], "stele1": ["stele"], "fountain1": ["fountain"], "lighthouse1": ["lighthouse"], "fruit1": ["fruit"], "stor2": ["stor"], "mbox2": ["mbox"], "seedwait_gate": ["gate"], "benchbreak": ["bench", "takebench"], "chair2": ["chair", "stool", "achair", "bench", "pouf", "sofa1"], "bed3": ["bed", "yorubed"], "light3": ["torch", "lamp", "campfire"], "houselight": ["candle", "lantern", "flamp"], "oven": ["oven"], "salvia3": ["salvia"], "watch2": ["watch"], "lotus3": ["lotus"], "lily5": ["lily"], "wmill": ["windmill"], "clover3": ["clover"], "toy2": ["sandbox"], "toy3": ["seesaw"], "swing1": ["swing"], "deco3": ["hedge", "birdbath", "parasol", "arch", "signpost", "monstera"], "tree5": ["tree", "fruit"], "farm10": ["farm"], "house2": ["hwall", "door"], "room": ["@furniture"], "paint": ["@painting"], "trap4": ["spike", "sticky", "puddle", "firetrap", "gust"], "jar2": ["jar"], "parasol": ["parasol"]};
const QUEST_PLACEMENTS=new WeakMap(),QUEST_VISITS=new WeakMap();let questPlaceSerial=0,QUEST_CLEAR_WAIT=null,SUB_CLEAR_WAIT={};const questGuideBlocked=()=>!!QUEST_CLEAR_WAIT||Object.keys(SUB_CLEAR_WAIT).some(k=>!!SUB_CLEAR_WAIT[k])||Object.keys(SUBW).length>0;const questGuideBlockedNow=()=>!!QUEST_CLEAR_WAIT;const questGuideAccepted=()=>{const q=S&&QUESTS[S.quest];return !!q&&!S.cleared&&S.qStory==null&&(!q.talk||S.qTalked)};
const QUEST_PARTS={
  'watch1':[[['watch'],()=>cnt('watch')>=1],[['spike'],()=>(S.placed.spike||0)>=2]],
  'shizukuRest':[[['bench'],()=>nearSp('bench')],[['tub'],()=>nearSp('tub')]],
  'ep1':[[['hwall','door'],()=>HOUSES.length>=1],[['bed'],()=>cnt('bed')>=2]],
  'ep2':[[['clover','bellf','salvia','lily','lotus'],()=>flowerN()>=10],[['table'],()=>cnt('table')>=1],[['swing','sandbox'],()=>CN(TOYS4)>=1]],
  'ep5':[[['campfire'],()=>cnt('campfire')>=1]]
};
function checkQuestParts(q){const parts=QUEST_PARTS[q.id];if(!parts)return;for(let i=0;i<parts.length;i++){const [ids,ready]=parts[i],partKey=(S.world||0)+':'+q.text+':'+i;if((S.questPartSeen||{})[partKey]||!ready())continue;
  if(S.res.some(r=>r.act&&r.act.partKey===partKey||(QUEST_VISITS.get(r)||[]).some(v=>v.partKey===partKey)))continue;
  queueQuestVisit(q,storyWho(q),ids,partKey);
}}
function questReplyWho(q){if(!q.k)return storyWho(q);const who=subWho(q);return firstSpk((q.X||[]).map(line=>[line[0]==='K'?who:line[0],line[1]]),who)}
function noteQuestPlacement(id,j){let m=QUEST_PLACEMENTS.get(S);if(!m){m=new Map();QUEST_PLACEMENTS.set(S,m)}m.set(j,{id,n:++questPlaceSerial})}
function qvHas(j,id){return S.obj[j]===id||S.floor[j]===id}/* 見にくる物が、置いた物か、しいた床（あぜ道など）か */
function questVisitTarget(q,ids,j){if(ids.includes(S.floor[j]))return true;const o=S.obj[j];if(!o||o==='part'||!BL[o])return false;
  if(!ids.includes(o)&&!(ids.includes('@furniture')&&BL[o].kind==='furn')&&!(ids.includes('@painting')&&['paint1','paint2','paint3'].includes((S.win||{})[j])))return false;
  if(PLANTS.includes(o)&&isBud(j))return false;/* 花も木も、育ってから見にいく */
  if(q.id==='imoseed')return imoSeedQuestPlots().includes(j);
  if(q.k==='bed3'||q.k==='houselight'||q.k==='room'||q.id==='bed')return HOUSES.some(h=>h.inside.has(j));
  if(q.id==='shizukuRest')return nearHot(j,4);
  if(q.k==='chair2')return [-1,1,-W,W].some(d=>{const k=j+d;return k>=0&&k<W*H&&Math.abs(k%W-j%W)+Math.abs((k/W|0)-(j/W|0))===1&&S.obj[k]==='table'});
  return true;
}
function queueQuestVisit(q,who,partIds,partKey){const ids=partIds||(q.k?QUEST_VISIT_SUB[q.k]:QUEST_VISIT_MAIN[q.id]);if(!ids)return null;
  const r=S.res.find(r=>r.name===who)||S.res.find(r=>r.name===(q.talk&&q.talk.who))||S.res.find(r=>(q.story||[]).some(line=>line[0]===r.name))||S.res.find(r=>!r.hidden)||S.res[0];if(!r)return;
  const recent=QUEST_PLACEMENTS.get(S);let target=-1,best=-Infinity;
  for(let j=0;j<S.obj.length;j++){if(!questVisitTarget(q,ids,j))continue;const last=recent&&recent.get(j),score=(last&&qvHas(j,last.id)?last.n*100000:0)-Math.hypot(j%W+.5-r.x,(j/W|0)+.5-r.y);if(score>best){best=score;target=j}}
  if(target<0)return null;
  // メインの訪問は、未完了のサブの訪問より先に行う。中断したサブは後で再開する。
  if(!q.k&&!partKey&&r.act&&r.act.type==='questjoy'&&r.act.obj!==target)endAct(r);
  const id=ids.includes(S.floor[target])&&!ids.includes(S.obj[target])?S.floor[target]:S.obj[target],list=(QUEST_VISITS.get(r)||[]).filter(v=>v.obj!==target||v.id!==id);
  if(q.k||partKey)list.push({obj:target,id,partKey});else list.unshift({obj:target,id});QUEST_VISITS.set(r,list.slice(0,4));return{r,obj:target,id};
}
function settleQuestVisit(r,a){const waits=[];if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.r===r&&QUEST_CLEAR_WAIT.obj===a.obj)waits.push(QUEST_CLEAR_WAIT);for(const k in SUB_CLEAR_WAIT){const w=SUB_CLEAR_WAIT[k];if(w&&w.r===r&&w.obj===a.obj)waits.push(w)}if(a.partKey&&a.joyAt==null&&qvHas(a.obj,a.targetId)){const list=QUEST_VISITS.get(r)||[];if(!list.some(v=>v.partKey===a.partKey))list.push({obj:a.obj,id:a.targetId,partKey:a.partKey});QUEST_VISITS.set(r,list)}if(!waits.length)return;const arrived=a.joyUntil!=null&&performance.now()>=a.joyUntil&&qvHas(a.obj,a.targetId);
  for(const w of waits){if(arrived){w.done=true;if(w===QUEST_CLEAR_WAIT&&S.qStory===w.quest)QUEST_CLEAR_WAIT=null;continue}if(qvHas(a.obj,a.targetId)){const list=QUEST_VISITS.get(r)||[];if(!list.some(v=>v.obj===a.obj&&v.id===a.targetId))list.unshift({obj:a.obj,id:a.targetId});QUEST_VISITS.set(r,list)}else if(w===QUEST_CLEAR_WAIT)QUEST_CLEAR_WAIT=null;else for(const k in SUB_CLEAR_WAIT)if(SUB_CLEAR_WAIT[k]===w)delete SUB_CLEAR_WAIT[k]}}
function questVisitSafe(r,j){return !S.enemies.some(e=>e.spawned&&!e.dead&&!e.flee&&(Math.hypot(e.x-r.x,e.y-r.y)<8||Math.hypot(e.x-(j%W+.5),e.y-((j/W|0)+.5))<8))}
function questVisitStand(r,G,j){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0,occupied=occTiles(r);let stand=-1,best=Infinity;
  for(let yy=Math.max(0,y-1);yy<=Math.min(H-1,y+z[1]);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(W-1,x+z[0]);xx++){
    if(xx>=x&&xx<x+z[0]&&yy>=y&&yy<y+z[1])continue;
    const k=yy*W+xx,d=G.dist[k];if(d<0||!walk(k)||occupied.has(k))continue;const score=d*10-Math.min(1,yy-y)*.1;if(score<best){best=score;stand=k}}
  return stand;
}
function questVisitReached(r,j){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0,dx=Math.max(x-r.x,0,r.x-(x+z[0])),dy=Math.max(y-r.y,0,r.y-(y+z[1]));return Math.hypot(dx,dy)<=1.05}
function questVisitOpen(G,j){const b=BL[S.obj[j]],z=b&&szAt(S.obj[j],j)||[1,1],x=j%W,y=(j/W)|0;for(let yy=Math.max(0,y-1);yy<=Math.min(H-1,y+z[1]);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(W-1,x+z[0]);xx++){const k=yy*W+xx;if(G.dist[k]>=0&&walk(k))return true}return false}/* まわりに、歩いて行けるマスがあるか */
function tryQuestVisit(r){const list=QUEST_VISITS.get(r);if(!list||!list.length||r.act&&r.act.type==='questjoy')return false;
  const v=list[0];if(!qvHas(v.obj,v.id)){list.shift();return false}
  if(r.hunger<30||hungry(r)||(r.visitRetryAt||0)>S.t||onHold(r)||HOLD.has(r.id)||!questVisitSafe(r,v.obj))return false;
  if(r.act&&['eat','fetch','flee','faint'].includes(r.act.type))return false;/* おなかがすいているとき以外は、ねむくても、すぐ見にいく */
  const G=bfs(r.x|0,r.y|0),stand=questVisitStand(r,G,v.obj);if(stand<0){if(!questVisitOpen(G,v.obj)){r.visitRetryAt=S.t+10;if(!v.told){v.told=1;toast(r.name+'が'+(BL[v.id]?BL[v.id].name:'')+'まで行けません','warn')}}return false}list.shift();/* 見にいけないときは、見たことにせず、知らせて、行けるようになるまで待つ */
  endAct(r);startAct(r,G,'questjoy',stand,{obj:v.obj,targetId:v.id,partKey:v.partKey});return true;
}
ACT.questjoy={start(r,a){if(!qvHas(a.obj,a.targetId)||!questVisitReached(r,a.obj))return false;const now=performance.now();a.joyAt=now;a.joyUntil=now+2400;if(a.partKey)(S.questPartSeen||(S.questPartSeen={}))[a.partKey]=true;JOYU.set(r,a.joyUntil);JUMP.set(r,now);r.shine=now;r.bubble='😊';r.face=a.obj%W+.5>=r.x?1:-1;sfxAt('good',r.x,r.y);
  const main=QUEST_CLEAR_WAIT;if(main&&main.r===r&&main.obj===a.obj&&!main.prompted){main.prompted=true;const q=QUESTS[main.quest];if(q&&q.story&&S.quest===main.quest){PAYOK=false;if(q.pay)for(const k in q.pay)S.mat[k]=Math.max(0,(S.mat[k]||0)-q.pay[k]);S.qTalked=false;S.qStory=main.quest;sfx('quest');logEv('目標「'+q.text+'」をたっせい');TALKW=questReplyWho(q);QUESTCLEARW=TALKW;if(/^lv\d/.test(q.id))focusQuestSpeaker(TALKW);renderQuest();renderPalette()}}
  for(const k in SUB_CLEAR_WAIT){const w=SUB_CLEAR_WAIT[k];if(!w||w.r!==r||w.obj!==a.obj||w.prompted)continue;const q=SUBQ.find(x=>x.k===k);if(!q)continue;w.prompted=true;(S.subArrived||(S.subArrived={}))[k]=true;S.subSt[k]=3;const reply=questReplyWho(q);if(reply)SUBW[reply]=k}
},
  tick(r,a){if(!a.secondHop&&performance.now()-a.joyAt>=900){a.secondHop=true;JUMP.set(r,performance.now())}},
  done:(r,a)=>!qvHas(a.obj,a.targetId)||performance.now()>=a.joyUntil,
  end(r,a){if(JOYU.get(r)===a.joyUntil)JOYU.delete(r)}};
function upFx(r,nm,txt,big){const now=performance.now();JOYU.set(r,now+2600);RHOLD.set(r,now+2600);r.bubble='😆';r.shine=now;JUMP.set(r,now);setTimeout(()=>{if(S.res.includes(r))JUMP.set(r,performance.now())},900);
  fx.push({k:'ring',x:r.x*TS,y:(r.y-.5)*TS,life:1});for(let n=0;n<(big?36:22);n++){const a=Math.random()*7;fx.push({k:'p',x:r.x*TS,y:(r.y-.6)*TS,vx:Math.cos(a)*(60+Math.random()*60),vy:Math.sin(a)*70-60,life:1,col:pick(['#fff3a0','#9fe8ff','#ffc6ec','#fff']),r:2.5})}
  sfx('level');if(big)setTimeout(()=>sfx('good'),350);
  const o=$('#upfx');o.querySelector('.upt').style.backgroundImage='url('+spiritPort(r.elem,120,r.vr)+')';o.querySelector('.utt').textContent=r.name+'の'+nm;const u=o.querySelector('.unn');u.textContent=txt+(big?'！！':'！');u.classList.toggle('big',!!big);
  o.querySelectorAll('i').forEach(e=>e.remove());for(let n=0;n<(big?18:12);n++){const e=document.createElement('i'),a=n/(big?18:12)*6.28,d=110+Math.random()*60;e.textContent=pick(['✨','⭐','💫','✨']);e.style.setProperty('--dx',Math.cos(a)*d+'px');e.style.setProperty('--dy',Math.sin(a)*d+'px');e.style.animationDelay=(Math.random()*.25)+'s';o.appendChild(e)}
  o.hidden=false;const rays=o.querySelector('.rays');rays.style.animation='none';void rays.offsetWidth;rays.style.animation='';clearTimeout(upFx.t);const end=()=>{o.hidden=true};upFx.t=setTimeout(end,1800);o.onclick=()=>{clearTimeout(upFx.t);end()}}
function howBtn(r,how){if(!how)return;const b=el('<button class="btn" style="min-width:34px;padding:4px 0;border-radius:50%">？</button>');b.onclick=()=>{const o=el('<div style="position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:16px 18px;max-width:340px;width:100%;animation:sup .18s ease-out"><b style="display:block;margin-bottom:8px"></b><p style="margin:0 0 14px;white-space:pre-line;line-height:1.7;font-size:14px"></p><button class="btn" style="width:100%">とじる</button></div></div>');o.querySelector('b').textContent='やりかた';o.querySelector('p').textContent=how;o.onclick=e=>{if(e.target===o||e.target.tagName==='BUTTON')o.remove()};$('#upfx').parentNode.appendChild(o);sfx('tap')};r.appendChild(b)}/* やりかたは「？」でポップアップ */
function subSec(body,main){const D=S.subDone||{},St=S.subSt||{},L=subList().filter(q=>St[q.k]>=2),on=L.filter(q=>!D[q.k]).sort((a,b)=>(St[b.k]===3)-(St[a.k]===3)),dn=L.filter(q=>D[q.k]);
  const sec=(h)=>{const f=el('<div class="sec"><h3></h3><div class="rows"></div></div>');f.querySelector('h3').textContent=h;body.appendChild(f);return f.querySelector('.rows')};
  {const rw=sec('進行中');let n=0;
    if(main&&!S.cleared&&S.quest<QUESTS.length){const q=QUESTS[S.quest];if(S.qStory==null&&!(q.talk&&!S.qTalked)){const r=rowEl('メイン：'+q.text,q.prog?q.prog():'');howBtn(r,q.how);rw.appendChild(r);n++}}/* 受けるまでは見せない */
    for(const q of on){const r=rowEl('サブ：'+q.t,St[q.k]===3?'たっせい！ '+subWho(q)+'に話しかけよう':(q.n?'いま '+Math.min(q.n,q.now())+' / '+q.n:'')+(q.rw?(q.n?' / ':'')+'ごほうび パワー+'+q.rw:''));howBtn(r,q.how);
      if(q.pay){const b=el('<button class="btn pri" style="flex:none;padding:6px 12px">わたす</button>'),en=St[q.k]===2&&!q.ok()&&Object.keys(q.pay).every(k=>(S.mat[k]||0)>=q.pay[k]);const nt=Object.keys(q.pay).map(k=>MATN[k]+' '+Math.min(S.mat[k]||0,999)+'/'+q.pay[k]).join('　');const sm=r.querySelector('small');if(sm)sm.textContent=(sm.textContent?sm.textContent+'　':'')+'いまの素材：'+nt;b.disabled=!en;b.onclick=()=>{if(St[q.k]!==2||q.ok()||!Object.keys(q.pay).every(k=>(S.mat[k]||0)>=q.pay[k]))return;for(const k in q.pay)S.mat[k]-=q.pay[k];S.flags.board5=true;checkSub();renderSheet()};r.appendChild(b)}
      rw.appendChild(r);n++}
    if(!n)rw.appendChild(rowEl('いまは、なし',''))}
  const md=main?QUESTS.slice(0,Math.min(S.quest,QUESTS.length)).map(q=>'メイン：'+q.text).reverse():[];
  if(md.length||dn.length){const rw=sec('達成済み');for(const t of [...dn.slice().reverse().map(q=>'サブ：'+q.t),...md]){const r=rowEl('✓ '+t,'');r.classList.add('done');rw.appendChild(r)}}}
function checkFree(){if(!S.cleared)return;const D=S.freeDone||(S.freeDone={});for(const g of FREEG)if(!D[g.k]&&g.ok()){D[g.k]=1;S.pt+=g.rw;S.totalPt+=g.rw;toast('目標たっせい：'+g.t+'（パワー+'+g.rw+'）','good');memo('🎯',g.t)}}
const DAYEV={hosaku:['🌾','豊作の日','収穫がひとつ多い'],oshaberi:['💬','おしゃべりの日','おしゃべりがはずむ。おしゃべり1回のパワー+0.9'],odayaka:['🌙','おだやかな夜','今夜の「コワイノ」が半分（オオカゲはそのまま）'],kaze:['🍃','風の強い日','ふしぎな種が2倍落ちてくる'],kami:['⛩️','カミサマの訪問日','カミサマが遊びにくる'],hoshi:['✨','星空の夜','3時に寝ている子のたのしさ+15'],mono:['🎁','ものひろいの日','村のあちこちに落とし物がある']};
function morning(){sfx('morning');if(S.cleared&&S.daily)dailyCheck();/* 夜のうちのたっせいも、朝にかぞえる */S.oracle=null;finalCheck();if(S.bud){let nb=0;for(const j in S.bud)if(S.bud[j]<=dayNo()){delete S.bud[j];nb++}if(nb){recount();dirty=true}}S.res.filter(r=>r.comfy===dayNo()).forEach(r=>addFloat(r.x,r.y-1.4,'ぐっすり！','#d8f5c0'));{const L=S.res.filter(r=>r.crowd===dayNo());if(L.length){L.forEach(r=>{r.bubble='😣';addFloat(r.x,r.y-1.4,'きゅうくつだった…','#ffd2cc')});toast('家がきゅうくつで、よく眠れなかったせいれいがいる','warn')}}
  if(S.regrow&&S.regrow.length){let ch=false;S.regrow=S.regrow.filter(g=>{if(g.day!=null?dayNo()<g.day:S.t<g.t)return true;if(!S.obj[g.j]&&!S.floor[g.j]&&!S.res.some(r=>(r.y|0)*W+(r.x|0)===g.j)){S.obj[g.j]=g.id;ch=true;return false}return true});if(ch)recount()}
  for(const k in S.dyn){const o=S.obj[k],d=S.dyn[k];if((o==='berry'||o==='fruit')&&d&&d.g<100){d.g=Math.min(100,d.g+25);continue}/* ベリー・りんごは4日（朝ごとに25） */if(o!=='farm')continue;if(d.sown===false){d.wet=0;continue}if(d.wet>0&&d.g<100)d.g=Math.min(100,d.g+100/((CROPS[d.crop]||CROPS.mugi).days));d.wet=0}
  if(WD===1)takenokoMorning();weedMorning();
  S.rain=Math.random()<.22;
  S.today=null;if(S.enemyOn&&dayNo()>=3&&Math.random()<.4){const ks=Object.keys(DAYEV).filter(k=>k!=='kami');const k=pick(ks),E=DAYEV[k];S.today=k;/* 日替わりのできごと */
    setTimeout(()=>toast('きょうは「'+E[1]+'」：'+E[2],'good'),1200);memo(E[0],'きょうは「'+E[1]+'」');
    if(k==='kami'){S.godVisit=true;S.godNextVisitDay=dayNo()+2;}
    if(k==='mono')for(let i=0;i<4;i++)dropAt(CX-10+Math.random()*20,CY-10+Math.random()*20)}
  if(S.rain)toast('今日は雨');
  {const d=dayNo(),ev={6:[[MINA,'#alarm|村が大きくなってきたねぇ。…でも、夜の「コワイノ」も、前より多い気がするよぉ。'],[POKO,'#nod|にぎやかになるほど、よってくるのかな…。']],
}[d];
   if(ev&&S.enemyOn&&!S.flags['day'+d]){const L=ev.filter(l=>S.res.some(r=>r.name===l[0]));if(L.length)talkOnce('day'+d,L)}/* さいごまで見てから「見た」に */}
  checkFree();
  summonMorning();
}
const LIGHTNAT={ntree:'wood',deadtree:'wood',tree:'wood',rock:'stone',bamboo:'bamboo'},NATG={ntree:30,deadtree:30,tree:30,rock:35,bamboo:30},LIGHTHIT={ntree:10,deadtree:10,tree:10,rock:12,bamboo:10},/* NATG：木・岩のゲージ（せいれいが切る・ほる秒数）。LIGHTHIT：守りの光1回でへる分。せいれいの作業と守りの光は、同じゲージをへらす */NATHIT=new Map(),DROPFX=new WeakMap();/* DROPFX：木・岩から落ちた素材が、とんで地面にころがるまでの動き（セーブしない） *//* 守り神の光をあてられる木・岩と、落ちる素材 */
const hudIc=id=>{const b=$('#'+id),im=b&&b.previousElementSibling;return im&&im.tagName==='IMG'?im:null};/* 画面の上の木材・石材のアイコン */
function natWork(a,dt){if(a.camp||!NATG[S.obj[a.obj]])return;const o=S.obj[a.obj],k='lp'+a.obj;S.hp[k]=(S.hp[k]||0)+dt*(spotNear(a.obj,o==='rock'?'ishikiri':o==='bamboo'?'takeyabu':'kikori')?1.1:1);/* きこり小屋・いしきり小屋・竹やぶの小道：+10% */NATHIT.set(a.obj,performance.now())}/* せいれいが木を切る・岩をほると、守りの光と同じゲージがへる */
const natDone=a=>(S.hp['lp'+a.obj]||0)>=(NATG[S.obj[a.obj]]||30);
function natLight(j){const o=S.obj[j],k=LIGHTNAT[o];if(LIGHTCD>0){toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒');return}if(S.pt<1){toast('パワーが足りません');return}S.pt-=1;LIGHTCD=LIGHTCDL[S.lv]||10;/* 1回パワー1。コワイノと同じ待ち時間 */
  const x=j%W,y=(j/W)|0,n=(S.hp['lp'+j]||0)+LIGHTHIT[o],cx=x*TS+16,cy=y*TS+8;delete S.hp['lt'+j];fx.push({k:'ring',x:cx,y:cy,life:1});for(let m=0;m<12;m++){const a=Math.random()*7,v=rnd(40,100);fx.push({k:'p',x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:1,col:pick(['#fffbe0','#fff','#ffe9a0']),r:rnd(1.5,3)})}sfxAt('shoot',x,y);
  NATHIT.set(j,performance.now());if(n<NATG[o]){S.hp['lp'+j]=n;return}/* ゲージがなくなると、木材・石材が1こ落ちる。のこりは、たいきゅうバーで見せる */
  delete S.hp['lp'+j];useNat(j);S.flags.lightBroke=1;/* サブクエスト「守り神の光で木や岩をこわそう」 */const n0=(S.drops||[]).length;dropAt(x,y,'mat:'+k,1);if(S.drops&&S.drops.length>n0){sfxAt('matDrop',x,y);const d=S.drops[S.drops.length-1];d.lt=1;DROPFX.set(d,{sx:x*TS+16,sy:y*TS+4,t0:performance.now()})}}/* 何も言わずに、木材・石材のアイコンを落とす *//* 落ちた物は、せいれいがひろう。木や岩は、せいれいが切ったときと同じようにへる */
/* 守り神の光は、はじめから木や岩にも使える。フタバの「やってみて」は、はじめての夜のあとのサブクエスト（lighttry） */
function spawnSeed(){
  for(let t=0;t<40;t++){const x=OFF+((Math.random()*OW)|0),y=OFF+((Math.random()*OW)|0),j=y*W+x;/* 前からの土地の中に落ちる */
    if(!VILL[j]&&!S.ground[j]&&!S.obj[j]){S.seeds.push({x,y});return}}
}

/* ---------- 置く・こわす ---------- */
let undoStack=[];
const inv=id=>id.startsWith('seed:')?cseed(id.slice(5)):S.inv[id]||0;
const iname=id=>id.startsWith('seed:')?CROPS[id.slice(5)].name+'のたね':BL[id].item||BL[id].name;
const cseed=k=>(S.cseed||(S.cseed={}))[k]||0;
function sowFarm(d){if(d.sown!==false)return true;if(d.paid){d.paid=false;d.sown=true;d.g=0;dirty=true;return true}const k=cropK(d);if(cseed(k)>0){S.cseed[k]--;d.sown=true;d.g=0;dirty=true;return true}return false}
function giveItem(id,n){if(id.startsWith('seed:')){const k=id.slice(5);S.cseed[k]=cseed(k)+n;return}S.inv[id]=inv(id)+n}
const WIND_STAGE_TOYS=new Set(['slide','seesaw']);
function usable(id){const b=BL[id];if(WIND_STAGE_TOYS.has(id)&&WD!==4)return false;
  if(b.kind==='block')return !!S.unlocked[id]||inv(id)>0;
  if(b.kind==='furn')return inv(id)>0;
  if(b.kind==='plant')return !!S.feat.plant;
  if(b.kind==='seed')return true;
  if(b.kind==='build'){if(id==='statue')return !cnt('statue')&&!statueSite();return STATUE>=0&&lvOK(id)&&(id!=='tower'||!!S.flags.shrine&&!cnt('tower')&&!statueSite('tower'))/* 守護の台座は1つだけ */&&(id!=='well'||wellOK())&&(!BREQ[id]||elemCount(BREQ[id])>0)}
  return false}
/* 井戸は「水のせいれいをむかえよう」のあとに思いつく */
function wellOK(){const qi=QUESTS.findIndex(q=>q.id==='water');return qi<0||!!S.flags.wellR||S.quest>qi+1||(S.quest===qi+1&&S.qStory==null)}
function statueSite(id='statue'){for(const k in S.dyn)if(S.obj[k]==='site'&&S.dyn[k].build===id)return true;return false}/* 建てている途中の物があるか */
const BADC={k:'',t:0,L:[]};
const RUGS=new Set(['rug1','rug2','hoshirug']);/* ラグは、床の上の層（S.rug：左上のマス→ラグ）。たて2・よこ2マス。上に家具を置ける */
const rugCells=a=>[a,a+1,a+W,a+W+1];
const CANOPY=new Set(['gazebo','azumaya']),LOWROOF=new Set(['chair','stool','achair','pouf','sofa1','bench','takebench','table','stable','ltable','clover','bellf','salvia','lily']);/* ガゼボ・東屋は、物の上にかぶせる層（S.roof：左上のマス→id）。たて2・よこ2マス。下に置けるのは、ひくい物だけ（ラグはべつの層なので、いつでも） */
function canRoof(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x+1>=W||y+1>=H)return false;{const h0=hiAt(y*W+x);if(hiAt(y*W+x+1)!==h0||hiAt(y*W+W+x)!==h0||hiAt(y*W+W+x+1)!==h0)return no('段差をまたいでは置けません')}
  if(x<0||y<0||x>=W-1||y>=H-1)return no('ここには置けません');for(const c of rugCells(y*W+x)){if(S.ground[c]===1)return no('水の上には置けません');if(RFC.has(c))return no('ここにはもう屋根があります');const o=S.obj[c],a=o==='part'?S.obj[S.ref[c]]:o;if(a&&!LOWROOF.has(a)&&!WEEDS.has(a))return no('下には、ひくい物だけ置けます')}return true}
const rugsIn=set=>{const L=[];for(const k in S.rug||{})if(rugCells(+k).some(c=>set.has(c)))L.push(S.rug[k]);return L};/* 家の中（どこか1マスでも）にあるラグ */
function canRug(x,y,quiet){const no=t=>{if(!quiet)toast(t);return false};if(x<0||y<0||x+1>=W||y+1>=H)return false;
  if(x<0||y<0||x>=W-1||y>=H-1)return no('ここには置けません');for(const c of rugCells(y*W+x)){if(S.ground[c]===1)return no('水の上には置けません');if(RUGC.has(c))return no('ここにはもうラグがあります');const o=S.obj[c],a=o==='part'?S.obj[S.ref[c]]:o;if(a&&!WEEDS.has(a)&&!(BL[a]&&BL[a].kind==='furn'&&!BL[a].trap&&!WALLD.has(a)))return no('ここにはもう何かあります')}return true}/* 家具の下にもしける */
function canPlace(id,x,y,quiet){
  if(RUGS.has(id))return canRug(x,y,quiet);
  if(CANOPY.has(id))return canRoof(x,y,quiet);
  if(id==='statue'&&!(canPlace('fence',x-1,y,quiet)&&canPlace('fence',x+1,y,quiet)&&canPlace('fence',x,y+1,quiet)))return false;
  if(BL[id].sz){const F=fp(id,x,y);for(const[a,b]of F)if(!canPlace1(id,a,b,quiet))return false;if(F.some(([a,b])=>hiAt(b*W+a)!==hiAt(F[0][1]*W+F[0][0]))){if(!quiet)toast('段差をまたいでは置けません');return false}return true}
  return canPlace1(id,x,y,quiet);
}
function canPlace1(id,x,y,quiet){
  if(x<0||y<0||x>=W||y>=H)return false;
  if(WALLD.has(id)){const j=y*W+x,iw=k=>HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k)),wreath=id==='wreath',target=HOME_WALLS.has(S.obj[j])&&S.obj[j]!=='wall'||wreath&&HOME_DOORS.has(S.obj[j]);/* 石の塀にはかけられない */if(!target||wreath&&HOME_DOORS.has(S.obj[j])&&(iw(j-W)||iw(j+W))&&!(iw(j-1)||iw(j+1))||!wreath&&(iw(j-W)||iw(j+W))||(S.win&&S.win[j]&&!((id==='curtain1'||id==='curtain2')&&S.win[j]===1))||((id==='curtain1'||id==='curtain2')&&!(S.win&&S.win[j]===1&&HOUSES.some(h=>h.set.has(j)&&h.inside.has(j+W)&&!h.inside.has(j-W))))){if(!quiet)toast((id==='curtain1'||id==='curtain2')?'カーテンは、家の上がわの窓にだけかけられます':wreath?'リースは、壁か横向きのドアにだけかけられます':BL[id].name+'は、横向きの家の壁にだけかけられます');return false}return true}/* 窓は壁にはめる */
  const j=y*W+x;if(id==='lotus'){if(S.ground[j]!==1){if(!quiet)toast('ハスは池の上にだけ植えられます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(id==='bridge'){if(S.ground[j]!==1){if(!quiet)toast('橋は水の上にだけかけられます');return false}if(S.obj[j]){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(S.ground[j]===1){if(!quiet)toast('水の上には置けません');return false}
  if(S.ground[j]===2){if(!quiet)toast('浅瀬には置けません');return false}
  if(TERRA.has(id)){const k=id==='dig';if(k?!hiAt(j):hiAt(j)>=HMAX){if(!quiet)toast(k?'高いマスだけ、けずれます':'これより高くは、もれません');return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])||S.floor[j]){if(!quiet)toast('なにもない所だけです');return false}if([j-1,j+1,j-W,j+W].some(n=>STAIRS.has(S.obj[n])&&stairTop(n,stairDir(n))===j)){if(!quiet)toast(k?'階段のうしろは、けずれません':'階段のうしろは、もれません');return false}return true}/* だんさスコップ：けずる・もる */
  if(LADDERS.has(id)){if(ladderDir(j)<0){if(!quiet)toast('ハシゴは、がけの下の、うしろか左右が1だん高い所に置けます');return false}if(S.obj[j]&&!WEEDS.has(S.obj[j])){if(!quiet)toast('ここにはもう何かあります');return false}return true}
  if(STAIRS.has(id)){const d=PLROTS[id]?SROT[PLROTS[id]]:stairDir(j);if(d<0||!stairOK(j,d)){if(!quiet)toast(PLROTS[id]?ROTL[5][PLROTS[id]]+'には置けません（うしろが段差で、2マスあいている所）':'段差の下に、2マスあいている所に置けます');return false}if(d){const o=stairOut(j,d);if(S.obj[o]&&!WEEDS.has(S.obj[o])||o<0||o>=W*H){if(!quiet)toast('階段は2マスいります');return false}}}/* 階段は、段差の下の低い地面に1×2 */
  if(BL[id].floor)return S.floor[j]!==id&&!(S.obj[j]&&BL[S.obj[j]].job);
  if(S.obj[j]&&!WEEDS.has(S.obj[j])){if(!quiet)toast('ここにはもう何かあります');return false}/* 雑草の上には、そのまま置ける（置いた物が上書きする） */
  if(RFC.has(j)&&!LOWROOF.has(id)){if(!quiet)toast('屋根の下には、ひくい物だけ置けます');return false}
  if(RUGC.has(j)&&BL[id].kind!=='furn'){if(!quiet)toast('ラグの上には、家具だけ置けます');return false}/* ラグの上には家具を置ける */
  {const b=BL[id];if(b&&(b.solid||HOME_WALLS.has(id)||(FENCE_IDS.has(id)&&!GATE_IDS.has(id)))&&(S.res.some(r=>!r.hidden&&(r.y|0)*W+(r.x|0)===j)||S.enemies.some(e=>e.spawned&&!e.dead&&(e.y|0)*W+(e.x|0)===j))){if(!quiet)toast('せいれいか「コワイノ」がいるので、置けません');return false}}/* 立っている子がいる場所には、通れなくなる物は置けない */
  return true;
}
function bridgeSpan(x,y){/* (x,y) の水から、よこ・たてに水がつづくぶんをしらべて、両はしが歩ける岸のほう（短いほう）のマス。10マスまで */const wt=(a,b)=>a>=0&&b>=0&&a<W&&b<H&&S.ground[b*W+a]===1&&!S.obj[b*W+a],land=(a,b)=>a>=0&&b>=0&&a<W&&b<H&&S.ground[b*W+a]!==1&&walk(b*W+a);let best=null;
  for(const[dx,dy]of[[1,0],[0,1]]){let a=x,b=y;while(wt(a-dx,b-dy)){a-=dx;b-=dy}let c=x,d=y;while(wt(c+dx,d+dy)){c+=dx;d+=dy}if(!land(a-dx,b-dy)||!land(c+dx,d+dy))continue;const L=[];for(let p=a,q=b;;p+=dx,q+=dy){L.push(q*W+p);if(p===c&&q===d)break}if(L.length<=10&&(!best||L.length<best.length))best=L}return best}
function setBlock(id,j){
  if(BL[id].floor){S.floor[j]=id;return}
  if(id==='farm'){S.obj[j]='plot';S.dyn[j]={p:0};return}
  S.obj[j]=id;if(BL[id].dyn)S.dyn[j]={g:0};if(BL[id].hp)S.hp[j]=BL[id].hp;
  if(STAIRS.has(id)){const d=stairDir(j);if(d>=0){(S.rot||(S.rot={}))[j]=SROT.indexOf(d);if(d){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}return}/* 階段は1×2：向きをきめて、低いほうのマスもつかう */
  setParts(id,j,'part');
}
function swingWide(){/* ブランコが2マスはばになった：前のセーブのブランコは、右か左のあいたマスへひろげる。どちらもふさがっていたら、おそなえ箱にもどす */let back=0;const ok=k=>k>=0&&k<W*H&&!S.obj[k]&&S.ground[k]!==1;
  for(let j=0;j<S.obj.length;j++){if(S.obj[j]!=='swing')continue;const x=j%W;if(x<W-1&&ok(j+1)){S.obj[j+1]='part';S.ref[j+1]=j}else if(x>0&&ok(j-1)){S.obj[j-1]='swing';S.obj[j]='part';S.ref[j]=j-1;if(S.rot&&S.rot[j]!=null){S.rot[j-1]=S.rot[j];delete S.rot[j]}}else{clearObj(j);giveItem('swing',1);back++}}
  if(back)setTimeout(()=>toast('ブランコが2マスはばになったので、ひろげられないブランコを'+back+'つ、おそなえ箱にもどしました'),1500)}
function setParts(id,j,kind){const x=j%W,y=(j/W)|0;for(const[a,b]of fp(id,x,y)){const k=b*W+a;if(k===j)continue;S.obj[k]=kind;S.ref[k]=j}}
function place(id,x,y){
  const b=BL[id];
  if(WALLD.has(id)){if(!usable(id)||inv(id)<=0)return toast(BL[id].name+'が足りません','warn');if(!canPlace(id,x,y))return;const j=y*W+x;S.inv[id]--;/* カーテンは、上がわの壁の窓にかける。窓はそのまま（S.win がカーテンなら、その下に窓がある） */(S.win||(S.win={}))[j]=id==='window'?1:id;noteQuestPlacement(HOME_DOORS.has(S.obj[j])?'door':'hwall',j);burst(j,'furn');recount();dirty=true;renderPalette();return}
  if(b.kind==='seed'){const k=id.slice(5),j=y*W+x,d=S.dyn[j];if(S.obj[j]!=='farm'||!d)return toast('たねは、畑にしかまけません');
    if(d.crop&&d.sown!==false)return toast('もう'+CROPS[d.crop].name+'が植えてある');if(cseed(k)<1)return toast('たねがありません');
    if(d.paid&&d.crop)S.cseed[d.crop]=cseed(d.crop)+1;S.cseed[k]--;d.paid=true;/* たねは、えらんだときに減る */d.crop=k;d.sown=false;if(k==='imo'&&QUESTS[S.quest]?.id==='imoseed'&&S.qTalked){const plots=imoSeedQuestPlots();if(!plots.includes(j))plots.push(j)}noteQuestPlacement('farm',j);burst(j,'plant','pat');toast(CROPS[k].name+'のたねをまいた');checkQuest();renderPalette();return}/* せいれいが、たねをまく */
  if(id==='tower'&&!towerReady())return openSheet('clear');/* 条件がそろうまで、台座は建てられない */
  if(!usable(id)){if(b.kind==='furn'){toast(b.name+'が足りません','warn')}/* 足りないときは、知らせるだけ（画面は開かない） */else toast('まだつかえません');return}
  if(!canPlace(id,x,y))return;
  if(id==='bridge'){/* 橋：タップした水のマスから、向こう岸まで、まっすぐかける（よこ・たての短いほう）。パワー・素材は、マスの数ぶん */
    const L=bridgeSpan(x,y);if(!L)return toast('向こう岸が見つかりません');const n=L.length,pc=b.pc*n,bm={};for(const k in b.mat)bm[k]=b.mat[k]*n;
    if(S.pt<pc)return toast('パワーが足りません（'+SP(pc)+'）');if(!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');
    S.pt-=pc;for(const k in bm)S.mat[k]-=bm[k];for(const q of L){S.obj[q]='site';S.dyn[q]={build:'bridge',p:0,need:b.time,mat:b.mat}}undoStack.push({j:L[0],id,pc,mat:bm,span:L});
    toast('せいれいが'+b.name+'を'+n+'マスかけにきてくれる');S.placed[id]=(S.placed[id]||0)+1;recount();burst(L[0],'furn');renderPalette();checkQuest();return}
  const j=y*W+x;
  if(b.kind==='plant'||b.kind==='build'){
    if(b.kind==='plant'&&inv(id)<=0){toast(iname(id)+'がおそなえ箱にありません');return}
    const free=id==='watch'&&watchQ(),pc=free?0:b.pc,bm=id==='tower'?TOWER_MAT():free?null:b.mat;/* 台座は木材・石材を使う（取り消すともどる） *//* 建物はパワーと素材を使う */
    if(b.kind==='build'&&S.pt<pc)return toast('パワーが足りません（'+SP(b.pc)+'）');
    if(b.kind==='build'&&!matOK(bm))return toast('素材が足りません（'+matTxt(bm)+'）');
    if(b.kind==='plant'&&cnt('sprout')>=10)return toast('植える予定がいっぱいです');
    if(b.kind==='build'&&!TERRA.has(id)&&cnt('site')>=3)return toast('建てる予定がいっぱいです');
    if(b.kind==='plant'){S.inv[id]--;S.obj[j]='sprout';S.dyn[j]={plant:id,p:0,userMound:true};undoStack.push({j,id,seed:1})}
    else{S.pt-=pc;for(const k in bm||{})S.mat[k]-=bm[k];S.obj[j]='site';S.dyn[j]={build:id,p:0,need:b.time,mat:bm||undefined};undoStack.push({j,id,pc,mat:bm});
      if(LADDERS.has(id))(S.rot||(S.rot={}))[j]=ladderDir(j);/* ハシゴの向き */
      else if(STAIRS.has(id)){const v=PLROTS[id]||0,d=v?SROT[v]:stairDir(j);(S.rot||(S.rot={}))[j]=SROT.indexOf(d);if(d){const o=stairOut(j,d);S.obj[o]='site2';S.ref[o]=j}}/* 階段：向きをきめて、低いほうのマスも足場に */
      else if(id==='statue'){for(const k of[j-1,j+1,j+W]){S.obj[k]='site2';S.ref[k]=j}}else setParts(id,j,'site2')}/* 足場のどのマスからでも、まわりから作業できる */
    toast(b.kind==='plant'?'せいれいが植えにきてくれる':'せいれいが'+b.name+'を建てにきてくれる');
  }else{
    if(inv(id)<=0){toast(b.name+'が足りません','warn');return}/* 足りないときは、知らせるだけ（おそなえ箱は開かない） */
    const prevFloor=b.floor?S.floor[j]:'';undoStack.push({j,prevFloor,id});
    if(ROTS[id]){const R=S.rot||(S.rot={}),v=PLROTS[id]||0;if(v)R[j]=v;else delete R[j]}/* 置くときにえらんだ向き（大きさの計算より先に） */
    S.inv[id]--;if(prevFloor)giveItem(prevFloor,1);
    if(CANOPY.has(id)||RUGS.has(id))for(const c of rugCells(j))if(WEEDS.has(S.obj[c]))S.obj[c]='';/* ラグ・屋根の下の雑草は、なくなる */
    if(CANOPY.has(id)){(S.roof||(S.roof={}))[j]=id;/* S.rot は下にある物の向き：けさない */undoStack[undoStack.length-1].roof=1}
    else if(RUGS.has(id)){(S.rug||(S.rug={}))[j]=id;const RR=S.rugRot||(S.rugRot={});if(PLROTS[id])RR[j]=PLROTS[id];else delete RR[j];undoStack[undoStack.length-1].rug=1}/* ラグは床の上の層にしく */
    else setBlock(id,j)
  }
  if(undoStack.length>30)undoStack.shift();
  S.placed[id]=(S.placed[id]||0)+1;recount();if(S.obj[j]===id||S.floor[j]===id||RUGS.has(id)&&S.rug&&S.rug[j]===id||CANOPY.has(id)&&S.roof&&S.roof[j]===id)noteQuestPlacement(id,j);burst(j,b.kind==='block'?'block':b.kind==='plant'?'plant':'furn',b.kind==='furn'?'furnPlace':b.kind==='plant'?'pat':null);if(SEATS.includes(id)&&spotW(j)>=0)addFloat(j%W+.5,(j/W|0)-.3,'つりスポット！');renderPalette();checkQuest();
  if(id==='door'||id==='yozoradoor'){const w=houseWhy(j);if(w)setTimeout(()=>toast(w,'warn'),400);else if(HOUSES.some(h=>h.set.has(j)))setTimeout(()=>toast('家ができた！','good'),400)}/* ドアを置いたら、家になったかを知らせる */
}
function undo(){
  const u=undoStack.pop();if(!u)return toast('もどせるものがありません');
  const o=S.obj[u.j];
  if(u.seed){if(o==='sprout'){clearObj(u.j);giveItem(u.id,1)}else return toast('もう手をつけているので、もどせません')}
  else if(u.span){if(!u.span.every(q=>S.obj[q]==='site'&&!((S.dyn[q]||{}).p>0)))return toast('もう手をつけているので、もどせません');for(const q of u.span)clearObj(q);S.pt+=u.pc;for(const k in u.mat||{})S.mat[k]=(S.mat[k]||0)+u.mat[k]}/* 橋はまとめてもどす */
  else if(u.pc!=null){if(o==='site'){if(u.id==='statue')return toast('神殿はもどせません');clearObj(u.j);S.pt+=u.pc;for(const k in u.mat||{})S.mat[k]=(S.mat[k]||0)+u.mat[k]}else return toast('もう手をつけているので、もどせません')}
  else if(BL[u.id].floor){if(S.floor[u.j]!==u.id)return toast('もうもどせません');/* とりのぞいたあとの床は、もどさない（ふえてしまう） */S.floor[u.j]=u.prevFloor;if(u.prevFloor)S.inv[u.prevFloor]=Math.max(0,inv(u.prevFloor)-1);giveItem(u.id,1)}
  else if(u.roof){if(!(S.roof&&S.roof[u.j]===u.id))return toast('もうもどせません');delete S.roof[u.j];giveItem(u.id,1)}/* ガゼボ・東屋 */
  else if(u.rug){if(!(S.rug&&S.rug[u.j]===u.id))return toast('もうもどせません');delete S.rug[u.j];if(S.rugRot)delete S.rugRot[u.j];giveItem(u.id,1)}/* ラグ */
  else{if(o!==u.id&&!(u.id==='farm'&&o==='plot'))return toast('もうもどせません');clearObj(u.j);giveItem(u.id,1)}
  if(S.placed&&S.placed[u.id]>0)S.placed[u.id]--;/* もどした分は、置いた数からひく */
  recount();renderPalette();
}
function dropChair2(){/* なくしたクッションチェア：置いてある物・持ち物・依頼は、いすにかえる。レシピからはけす */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='chair2')S.obj[j]='chair';
  if(S.inv&&S.inv.chair2){S.inv.chair=(S.inv.chair||0)+S.inv.chair2;delete S.inv.chair2}
  for(const o of S.orders||[])if(o.type==='chair2')o.type='chair';
  if(S.recipes)delete S.recipes.chair2;if(S.guardianIdeas)delete S.guardianIdeas.chair2}
function dropBirdhouse(){/* なくした巣箱：置いてある物・持ち物・依頼は、生垣にかえる。レシピからはけす */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='birdhouse')S.obj[j]='hedge';
  if(S.inv&&S.inv.birdhouse){S.inv.hedge=(S.inv.hedge||0)+S.inv.birdhouse;delete S.inv.birdhouse}
  for(const o of S.orders||[])if(o.type==='birdhouse')o.type='hedge';
  if(S.recipes)delete S.recipes.birdhouse;if(S.guardianIdeas)delete S.guardianIdeas.birdhouse}
function dropNtree(){/* まん中から28マスより外の森の木は、枯れ木にする（生えなおす木も）。フリーモードはべつ */if(WD===FREE)return;const far=j=>Math.max(Math.abs(j%W+.5-CX),Math.abs(((j/W)|0)+.5-CY))>28;for(let j=0;j<W*H;j++)if(S.obj[j]==='ntree'&&far(j))S.obj[j]='deadtree';for(const g of S.regrow||[])if(g.id==='ntree'&&far(g.j))g.id='deadtree'}
function dropFlower(){/* なくした花だん：置いてある物・持ち物・依頼は、シロツメクサにかえる。レシピ・しるしからはけす */
  for(let j=0;j<W*H;j++)if(S.obj[j]==='flower')S.obj[j]='clover';
  if(S.inv&&S.inv.flower){S.inv.clover=(S.inv.clover||0)+S.inv.flower;delete S.inv.flower}
  for(const o of S.orders||[])if(o.type==='flower')o.type='clover';
  if(S.recipes)delete S.recipes.flower;if(S.guardianIdeas)delete S.guardianIdeas.flower;if(S.unlocked&&S.unlocked.flower){delete S.unlocked.flower;S.unlocked.clover=true}}
function fixBeds(){/* 2マスだったころのベッド：のこりのマス（part）をあける（下のラグは、ラグの層にのこる） */
  for(const k in S.ref){const j=S.ref[k];if(S.obj[k]==='part'&&BEDSET.has(S.obj[j])){S.obj[k]='';delete S.ref[k]}}}
function rugsBig(){/* ラグがたて2・よこ2マスになった：前のラグ（1マス・家具の下の分も）を、そのマスをふくむ2×2にひろげる。ひろげられないラグは、おそなえ箱にもどす */
  const old=[];for(let j=0;j<W*H;j++)if(RUGS.has(S.obj[j])){old.push([j,S.obj[j],(S.rot||{})[j]||0]);S.obj[j]='';if(S.rot)delete S.rot[j]}
  for(const k in S.rug||{})old.push([+k,S.rug[k],(S.rugRot||{})[k]||0]);S.rug={};S.rugRot={};RUGC=new Map();let back=0;
  for(const[j,id,rt]of old){const x=j%W,y=(j/W)|0,a=[[x,y],[x-1,y],[x,y-1],[x-1,y-1]].find(([ax,ay])=>canRug(ax,ay,true));if(!a){giveItem(id,1);back++;continue}const k=a[1]*W+a[0];S.rug[k]=id;if(rt)S.rugRot[k]=rt;for(const c of rugCells(k))RUGC.set(c,k)}
  if(back)setTimeout(()=>toast('ラグが大きくなったので、しけないラグを'+back+'つ、おそなえ箱にもどしました'),1500)}
function clearObj(j){j=anc(j);const o=S.obj[j];if(S.bedOwn)delete S.bedOwn[j];/* ベッドをどけたら、だれのベッドかも消す */const tl=o&&BL[o]&&BL[o].sz?fp(o,j%W,(j/W)|0).map(([a,b])=>b*W+a):[j];delete S.hp['L'+j];if(S.win&&S.win[j]){const p=S.win[j],wid='window';giveItem(p===1?wid:p,1);if(p==='curtain1'||p==='curtain2')giveItem(wid,1);delete S.win[j]}/* カーテンの下の窓ももどす */if(S.rot)delete S.rot[j];for(const k in S.ref)if(S.ref[k]===j){S.obj[k]='';delete S.ref[k]}S.obj[j]='';delete S.dyn[j];delete S.hp[j];delete S.hp['L'+j];
  for(const r of S.res)if(r.act&&r.act.obj===j)endAct(r);return o}
let MOVESRC=null;/* ひっこしミトン：えらんだ物 {k:'obj'|'rug'|'roof',j} */
const NOMOVE=new Set(['statue','obox','board','altar','tower','site','site2']);/* 神殿まわり・建てている物は、うつせない */
function moveTarget(j){if(S.rug&&RUGC.has(j)&&!(S.obj[j]&&S.obj[j]!=='part'&&!WEEDS.has(S.obj[j])))return {k:'rug',j:RUGC.get(j)};const a=anc(j),o=S.obj[a];
  if(o&&BL[o]&&(BL[o].kind==='furn'||BL[o].kind==='build')&&!BL[o].natural&&!NOMOVE.has(o))return {k:'obj',j:a};if(RFC.has(j))return {k:'roof',j:RFC.get(j)};return null}
function moveName(m){return BL[m.k==='rug'?S.rug[m.j]:m.k==='roof'?S.roof[m.j]:S.obj[m.j]].name}
function writeObj(id,j,v){/* うつした物を書きこむ（向き・状態・じょうぶさもそのまま） */if(v.rot!=null)(S.rot||(S.rot={}))[j]=v.rot;S.obj[j]=id;if(STAIRS.has(id)){const d=stairDir(j);if(d>0){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}else setParts(id,j,'part');if(v.dyn)S.dyn[j]=v.dyn;if(v.hp!=null)S.hp[j]=v.hp;if(v.hpL!=null)S.hp['L'+j]=v.hpL;if(v.own!=null)(S.bedOwn||(S.bedOwn={}))[j]=v.own;if(v.cd!=null)(S.trapCd||(S.trapCd={}))[j]=v.cd}
function moveTap(tx,ty){const j=ty*W+tx;
  if(!MOVESRC){const m=moveTarget(j);if(!m)return toast('うつしたい家具・建物をタップ');if(m.k==='obj'&&fireAt(m.j))return toast('燃えているあいだは、うつせません');MOVESRC=m;sfx('tap');toast(moveName(m)+'を、どこへうつす？');dirty=true;renderPalette();return}
  const m=MOVESRC;if(m.j===j||m.k==='obj'&&anc(j)===m.j){MOVESRC=null;dirty=true;renderPalette();return toast('やめました')}/* 同じ物をタップしたら、やめる */
  if(m.k==='rug'||m.k==='roof'){const L=m.k==='rug'?S.rug:S.roof,id=L[m.j],rr=m.k==='rug'&&S.rugRot?S.rugRot[m.j]:null;delete L[m.j];if(rr!=null)delete S.rugRot[m.j];recount();
    if(!(m.k==='rug'?canRug(tx,ty,false):canRoof(tx,ty,false))){L[m.j]=id;if(rr!=null)S.rugRot[m.j]=rr;recount();return}
    L[j]=id;if(rr!=null)S.rugRot[j]=rr;for(const c of rugCells(j))if(WEEDS.has(S.obj[c]))S.obj[c]=''}
  else{const a=m.j,id=S.obj[a],cells=fp(id,a%W,(a/W)|0).map(([x,y])=>y*W+x),v={rot:S.rot?S.rot[a]:null,dyn:S.dyn[a],hp:S.hp[a],hpL:S.hp['L'+a],own:S.bedOwn?S.bedOwn[a]:null,cd:S.trapCd?S.trapCd[a]:null};
    if(STAIRS.has(id)){const d=stairDir(a);if(d>0)cells.push(stairOut(a,d))}
    for(const c of cells){if(c!==a&&S.obj[c]!=='part')continue;S.obj[c]='';delete S.ref[c]}if(S.rot)delete S.rot[a];delete S.dyn[a];delete S.hp[a];delete S.hp['L'+a];if(S.bedOwn)delete S.bedOwn[a];if(S.trapCd)delete S.trapCd[a];
    const pr=PLROTS[id];PLROTS[id]=v.rot||0;let ok=false;try{ok=canPlace(id,tx,ty,false)}finally{if(pr==null)delete PLROTS[id];else PLROTS[id]=pr}
    if(!ok){writeObj(id,a,v);return}
    for(const r of S.res)if(r.act&&(r.act.obj===a||cells.includes(r.act.obj)))endAct(r);
    for(const b of S.broken||[])if(b.j===a)b.j=j;
    writeObj(id,j,v)}
  MOVESRC=null;recount();dirty=true;burst(j,'furn','furnPlace');renderPalette();checkQuest()}
function removeAt(x,y){const tx0=x,ty0=y;
  const j=anc(y*W+x),o=S.obj[j];x=j%W;y=(j/W)|0;
  if(S.win&&S.win[j]){const id=S.win[j]===1?'window':S.win[j];if(id==='curtain1'||id==='curtain2')S.win[j]=1;else delete S.win[j];giveItem(id,1);/* カーテンをはずすと、窓がのこる */toast(BL[id].name+'をおそなえ箱にもどした');burst(j,'furn','rm');recount();renderPalette();return}
  if(o){const b=BL[o];if(o==='tower')return toast('守護の台座はこわせません');if(o==='volcano'||o==='heatv'||o==='crack'||o==='boulder')return toast(b.name+'はこわせません');if(o==='statue'||o==='obox'||o==='board'||o==='altar'||o==='site2')return toast('神殿はこわせません');if((o==='stor'||o==='mbox')&&cnt(o)<=1)return toast(BL[o].name+'は1つ以上必要です');
    if(o==='site'){const d=S.dyn[j];if(d.build==='statue')return toast('神殿はこわせません');const bm=d.mat||{};clearObj(j);for(const k in bm)S.mat[k]=(S.mat[k]||0)+bm[k];toast('建てるのをやめた')}/* 素材はもどる・パワーはもどらない */
    else if(o==='sprout'){const d=S.dyn[j];clearObj(j);giveItem(d.plant,1);toast('植えるのをやめた')}
    else{clearObj(j);
      if(b.natural){toast(b.name+'をかたづけた')}
      else if(FLOWERS.has(o)||o==='tree'||o==='fruit'){giveItem(o,1);toast(iname(o)+'をもらった')}/* 花・木をこわすと、種・苗がもどる */
      else if(o==='plot'||o==='farm'){giveItem('farm',1);toast('畑をおそなえ箱にもどした')}
      else if(b.kind==='block'||b.kind==='furn'){giveItem(o,1);toast(b.name+'をおそなえ箱にもどした')}
      else if(b.kind==='build'&&b.mat){const fr=S.freeB&&S.freeB[j];if(fr)delete S.freeB[j];else for(const k in b.mat)S.mat[k]=(S.mat[k]||0)+b.mat[k];toast(b.name+'をこわした')}/* ただで建てたもの（クエストの見張り台）は、素材がもどらない *//* 建物：素材はもどる・パワーはもどらない */
      else toast(b.name+'をとりのぞいた')}
    burst(j,'block','rm');recount();renderPalette();return}
  {const c=ty0*W+tx0;if(RFC.has(c)){const a=RFC.get(c),id=S.roof[a];delete S.roof[a];giveItem(id,1);toast(BL[id].name+'をおそなえ箱にもどした');burst(a,'furn','rm');recount();renderPalette();return}}/* 下に物がなければ、ガゼボ・東屋をはずす（ラグより先） */
  {const c=ty0*W+tx0;if(RUGC.has(c)){const a=RUGC.get(c),id=S.rug[a];delete S.rug[a];if(S.rugRot)delete S.rugRot[a];giveItem(id,1);toast(BL[id].name+'をおそなえ箱にもどした');burst(a,'furn','rm');recount();renderPalette();return}}/* 上に物がなければ、ラグをはずす */
  if(S.floor[j]){const f=S.floor[j];S.floor[j]='';giveItem(f,1);burst(j,'block','rm');recount();renderPalette()}
}
function finishBuild(j,r){
  if(TERRA.has(S.dyn[j]&&S.dyn[j].build)){const up=S.dyn[j].build==='mound';delete S.dyn[j];S.obj[j]='';S.hi[j]=up?Math.min(HMAX,(S.hi[j]|0)+1):Math.max(0,(S.hi[j]|0)-1);recount();dirty=true;burst(j,'block');if(r)addSpiritXp(2,r);return}/* けずる・もる：段差の高さをかえる */
  const d=S.dyn[j],id=d.build;if(!d.mat&&BL[id].mat&&id!=='tower')(S.freeB||(S.freeB={}))[j]=1;/* ただで建てた（素材を使わなかった） */delete S.dyn[j];S.obj[j]=id;noteQuestPlacement(id,j);setParts(id,j,'part');if(STAIRS.has(id)){const d=stairDir(j);if(d>0){const o=stairOut(j,d);S.obj[o]='part';S.ref[o]=j}}/* 階段：低いほうのマス */if(BL[id].hp)S.hp[j]=BL[id].hp;if(BL[id].dyn)S.dyn[j]={g:0};
  recount();burst(j,'furn');if(r){addSpiritXp(4,r);r.made=(r.made||0)+1}kurashi('b:'+id,['🏠','はじめて'+BL[id].name+'が建った']);toast(BL[id].name+'が建った！','good');checkQuest();
  if(id==='statue'){S.obj[j-1]='obox';S.obj[j+1]='board';S.obj[j+W]='altar';recount();burst(j-1,'furn');burst(j+1,'furn')}
  if(id==='tower'&&!S.cleared){if(WD===1){if(shLeft()>=1)S.usedSh=(S.usedSh||0)+1;/* かけらを台座にはめる */S.finalNight=true;memo('🌑','守護の台座が建った。最後の夜がくる');setTimeout(()=>toast('守護の台座が光りはじめた…！ 今夜、オオカゲたちがおしよせてくる','warn'),900)}else{memo('🏛','守護の台座が建った');setTimeout(()=>toast('守護の台座が建った','good'),900)}finalCheck()}/* ヌシ様の前に、きびしい最後の夜 */
}
function finishCraft(o,r){
  S.orders=S.orders.filter(q=>q!==o);S.unlocked[o.type]=true;giveItem(o.type,BL[o.type].qty||1);addSpiritXp(3,r);if(r)r.made=(r.made||0)+1;kurashi('f:'+o.type,['🪑','はじめて'+BL[o.type].name+'を作った']);burstAt(r.x,r.y,'furn');
  toast(r.name+'が'+BL[o.type].name+'を作って、おそなえ箱に入れた！','good');renderPalette();if(sheet==='craft')renderSheet();
}
function rectCells(a,b){const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);const c=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)c.push([x,y]);return c}
let pending=null;
const STAMPC10={farm:32,fence:16,stone:16,path:8};/* スタンプで足りない分を買うときの値段（1こあたり、パワーの10倍の数：畑3.2・柵1.6・石1.6・あぜ道0.8） */
function stampCost(need){let c10=0;const parts=[];for(const id in need){const short=Math.max(0,need[id]-inv(id));c10+=short?short*(STAMPC10[id]==null?Infinity:STAMPC10[id]):0;/* 足りない分だけ、1こあたりの値段で買う（足りていれば0） */if(short)parts.push(BL[id].name+short+'こ')}return {cost:Math.ceil(c10/10),parts}}
function shortCost(need){let cost=0;const parts=[];for(const id in need){const short=Math.max(0,need[id]-inv(id));cost+=short*(BL[id].qty?Infinity:BL[id].cost);if(short)parts.push(BL[id].name+short+'こ')}return {cost,parts}}
function askBulk(id,cells){if(WALLD.has(id))return toast(BL[id].name+'は、ハケではぬれません');/* 窓・カーテンは、壁に1つずつかける */
  const ok=cells.filter(([x,y])=>canPlace(id,x,y,true));
  if(!ok.length){toast('置ける場所がありません');return}
  const b=BL[id];
  if(b.kind==='plant'){const n=Math.min(ok.length,inv(id),Math.max(0,10-cnt('sprout')));if(!inv(id))return toast(iname(id)+'がおそなえ箱にありません');if(!n)return toast('植える予定がいっぱいです');/* 植える予定は10か所まで（1つずつ置くときと同じ） */ok.length=n;pending={kind:'plant',id,cells:ok};$('#confirmTxt').textContent=iname(id)+'を'+n+'か所に植えてもらう';$('#cYes').disabled=false}
  else{const s=shortCost({[id]:ok.length});if(b.qty){const n=Math.min(ok.length,inv(id));if(!n)return toast(b.name+'が足りません','warn');ok.length=n;s.cost=0;s.parts=[]}
    pending={kind:'bulk',id,cells:ok,cost:s.cost,need:{[id]:ok.length}};$('#confirmTxt').textContent=b.name+' '+ok.length+'マス'+(s.parts.length?'（足りない'+s.parts.join('・')+'は'+SP(s.cost)+'で）':'（おそなえ箱から）');$('#cYes').disabled=S.pt<s.cost}
  ($('#cRot').hidden=true,$('#confirm').hidden=false);
}
function askStamp(sid,x,y){
  const st=STAMPS[sid];const lock=st.cells.map(c=>c[2]).filter(id=>!S.unlocked[id]);
  if(lock.length)return toast(BL[lock[0]].name+'が足りません','warn');
  for(const[dx,dy,id]of st.cells)if(!canPlace(id,x+dx,y+dy,true)||(!BL[id].floor&&S.obj[(y+dy)*W+x+dx]&&!WEEDS.has(S.obj[(y+dy)*W+x+dx])))return toast('ここには置けません');
  const need={};for(const c of st.cells)need[c[2]]=(need[c[2]]||0)+1;
  const s=stampCost(need);if(!isFinite(s.cost))return toast(s.parts.join('・')+'足りません','warn');
  pending={kind:'stamp',sid,x,y,cost:s.cost,need};
  $('#confirmTxt').textContent=st.name+(s.parts.length?'（足りない分は'+SP(s.cost)+'で）':'（おそなえ箱から）');$('#cYes').disabled=S.pt<s.cost;($('#cRot').hidden=true,$('#confirm').hidden=false);
}
const SWAPG=[['fence','logfence','bamboofence','wall'],['hwall','logwall','plasterwall','brickwall','yozorawall'],['path','gravel','woodpath','stone','brick'],['floor','brickfloor','stonefloor','herrfloor','carpet']],SWAPTHRU=[new Set(['gate','archedgate','stonegate','sdoor']),new Set(['door','yozoradoor']),new Set(),new Set()],SWAPNO=['柵や塀ではありません','家の壁ではありません','道ではありません','床ではありません'];/* つけかえトンカチ：柵・塀／家の壁／道／床のなかま。ドア・門はとおりぬけて、その先もつけかえる。道・床は S.floor */
const swapT=(id,k)=>BL[id].floor?S.floor[k]:S.obj[k];
function askSwap(id,x,y){const gi=SWAPG.findIndex(g=>g.includes(id)),G=SWAPG[gi],T=SWAPTHRU[gi],j0=y*W+x;
  if(!G.includes(swapT(id,j0)))return toast(SWAPNO[gi]);
  const seen=new Set([j0]),q=[j0],cells=[];while(q.length){const j=q.pop();const tj=swapT(id,j);if(tj!==id&&G.includes(tj))cells.push(j);const x0=j%W;for(const k of [x0>0?j-1:-1,x0<W-1?j+1:-1,j-W,j+W]){if(k<0||k>=W*H||seen.has(k))continue;const o=swapT(id,k);if(G.includes(o)||T.has(o)){seen.add(k);q.push(k)}}}
  if(!cells.length)return toast('もう'+BL[id].name+'です');
  if(inv(id)<cells.length)return toast(BL[id].name+'が足りません（'+cells.length+'こいる）','warn');
  pending={kind:'swap',id,cells};$('#confirmTxt').textContent='つながっている'+cells.length+'マスを'+BL[id].name+'にかえる（はずした物は、おそなえ箱にもどる）';$('#cYes').disabled=false;($('#cRot').hidden=true,$('#confirm').hidden=false)}
function confirmOne(){const p=pending;if(!p||p.kind!=='one')return;const rb=$('#cRot'),rt=ROTS[p.id];rb.hidden=!rt;const lb=rt?'（'+ROTL[rt][PLROTS[p.id]||0]+'）':'';$('#confirmTxt').textContent=p.ok?BL[p.id].name+lb+'をここに置く？':'ここには置けません'+lb;$('#cYes').disabled=!p.ok}
function rotPending(){const p=pending;if(!p||p.kind!=='one'||!ROTS[p.id])return;PLROTS[p.id]=((PLROTS[p.id]||0)+1)%ROTN(p.id);p.ok=canPlace(p.id,p.x,p.y,true);sfx('tap');confirmOne();dirty=true}/* ↻：置く前に向きをかえる */
function confirmYes(){
  if(pending&&nightLock()){pending=null;$('#confirm').hidden=true;selRect=null;return toast('夜のあいだは、置くことも、こわすこともできません')}
  if(!pending)return;const p=pending;pending=null;$('#confirm').hidden=true;selRect=null;
  if(p.kind==='one'){place(p.id,p.x,p.y);return}
  if(p.kind==='plant'){if(inv(p.id)<p.cells.length)return toast(iname(p.id)+'が足りません');S.inv[p.id]-=p.cells.length;for(const[x,y]of p.cells){const j=y*W+x;S.obj[j]='sprout';S.dyn[j]={plant:p.id,p:0,userMound:true}}
    p.cells.forEach(([x,y],i)=>{if(i<12)burstAt(x,y,'plant')});recount();toast('せいれいたちが植えにきてくれる','good');return}
  if(p.kind==='swap'){const G=SWAPG.find(g=>g.includes(p.id)),fl=!!BL[p.id].floor,L=p.cells.filter(j=>G.includes(swapT(p.id,j))&&swapT(p.id,j)!==p.id);if(inv(p.id)<L.length)return toast(BL[p.id].name+'が足りません');
    for(const j of L){giveItem(swapT(p.id,j),1);S.inv[p.id]--;if(fl)S.floor[j]=p.id;else{S.obj[j]=p.id;S.hp[j]=BL[p.id].hp}}/* 窓・カーテンは、そのまま家の壁にのこる */S.placed[p.id]=(S.placed[p.id]||0)+L.length;
    L.forEach((j,i)=>{if(i<14)burstAt(j%W,(j/W)|0,'block')});undoStack=[];recount();renderPalette();checkQuest();dirty=true;toast('つけかえた！','good');return}
  if(S.pt<p.cost)return toast('パワーが足りません');
  S.pt-=p.cost;for(const id in p.need)S.inv[id]=Math.max(0,inv(id)-p.need[id]);
  const put=(id,j)=>{if(BL[id].floor&&S.floor[j])giveItem(S.floor[j],1);setBlock(id,j)};
  const cells=[];
  if(p.kind==='bulk'){for(const[x,y]of p.cells){put(p.id,y*W+x);cells.push([x,y]);if(BL[p.id].kind==='furn'||BL[p.id].floor)noteQuestPlacement(p.id,y*W+x)}S.placed[p.id]=(S.placed[p.id]||0)+p.cells.length}
  else for(const[dx,dy,id]of STAMPS[p.sid].cells){put(id,(p.y+dy)*W+p.x+dx);cells.push([p.x+dx,p.y+dy])}
  cells.forEach(([x,y],i)=>{if(i<14)burstAt(x,y,'block')});
  undoStack=[];recount();renderPalette();checkQuest();toast('ぬりおわった！','good');
}

/* ---------- 家具の注文 ---------- */
const RLOCK=new Set(['lumber','quarry','stele','fountain','lighthouse','windmill','bed','campfire','oven','swing','lamp','bench','chair','stool']);/* 会話でひらめくまで作れない家具 */
function recipeKnown(id,s=S){const b=BL[id];if(b&&b.kwr)return !!(s.recipes||{})[id];return !!b&&(!WIND_STAGE_TOYS.has(id)||WD===4)&&(id!=='noren'||WD>=1||grec(id))/* のれんは火山のふもとから */&&(id!=='window'||!!(s.unlocked||{}).window)&&(!(b.kind==='furn'||RLOCK.has(id)||b.offerOnly)||!!(s.recipes||{})[id])}

const MANUAL=[['せいれいのようす',[['おなか','へると元気がなくなり、0になると消えてしまう。食料箱のごはんを食べる。料理はおなかがたくさんふくれる。'],['たのしさ','遊ぶ・おしゃべり・水浴びでふえる。おもちゃで遊ぶといちばんふえる。満タンになると、おそなえ箱におそなえをしてくれる。低いと疲れやすくなる。'],['つかれ','はたらくとたまる。たまると昼でもひと休みする。夜はベッドや家で眠ってなおす。'],['住み心地','家をタップすると見られる。家具・床がふえると上がる。つぼなどのかざりは、家の中か、家のそば（かざりごとに決まった範囲。つぼは1マス）にあれば入る。そのせいれいの好きな家具は、その家具のぶんのポイントが2倍になる。'],['住み心地の効果','高いほど、眠ったときのつかれのとれ方が速くなる（0.6〜3.3倍）。住み心地は最大300まで上がる。180以上でぐっすり眠れて、朝にたのしさ+10。90未満だと、たのしさ-5。'],['ベッドの数','家の中の広さ4マスにつき、ベッド1つがおすすめ。それより多く置くと、きゅうくつで住み心地が大きく下がり、元気とたのしさも下がる。']]],['ステータス',[['作業スピード','仕事の速さ。たき火で遊ぶとのびる。'],['移動速度','歩く速さ。ブランコで遊ぶとのびる。道の上はもっと速い。'],['スタミナ','疲れにくさ。噴水で遊ぶとのびる。'],['持てる数','一度に運べる数。'],['攻撃力','「コワイノ」とたたかう力。火のせいれいがいちばん強い。']]],['属性と得意なこと',[['木','畑の収穫+1・畑の世話・花や木を植える・木の家具づくり'],['水','作業の速さ1.3倍・スタミナ0.7倍・水やり・つり・水の家具づくり'],['火','「コワイノ」とたたかう・夜の見回り・料理・火の家具づくり'],['土','作業の速さ0.75倍・スタミナ1.45倍・畑を耕す・柵を直す・土の家具づくり'],['風','歩く速さ1.45倍・たのしさ60より下で遊びに行く（ほかの子は30）・ふしぎな種を拾う・風の家具づくり'],['みんな','建てる・収穫・種まき・木や石を集める・おそなえ']]],['家具の種類',[['【ダイニング家具】','いす・ソファ・ローテーブル・ラグ・ひくい棚など。食卓のある家（ダイニング）の中に置くと、その家の食卓で食べたときにもらえるパワーがふえる。たくさん置くほどふえて、いちばん多くて+3。ソファやひくい棚は、1つでも大きくふえる。家の中の食卓で食べるだけでも+1。食卓をタップすると、いまどれだけふえるか見られる。'],['【料理家具】','水おけ・流し台など。かまどのまわり3マスにあると、料理が早くなる（料理家具の種類1つにつき10%）。かまどをタップすると、いまの料理の速さが見られる。'],['【あかり】','たいまつ・ランタン・ろうそくなど。夜の見回りや、家の中を明るくするのに使う。ろうそく・ランタン・フロアランプは、家の中に置くとその家ぜんたいを照らす（家の外では1.5マス）。'],['【庭の家具】','生垣はまわり2マス、水飲み鳥・ガーデンアーチは3マスと範囲が広いかわりに、効果は小さめ。パラソルは、まわり1マスだけだが、効果が大きい。どれも、たのしさがふえる（休けい中は、つかれもとれる）。'],['【あそび道具】','ブランコ・シーソー・すべり台など。遊ぶと、たのしさがいちばんふえる。'],['【かべ・かざり】','絵・カーテン・窓・かざり棚など。住み心地が上がる。絵は横向きの家の壁に、カーテンは家の上がわの壁の窓にかける。'],['おそなえでしか手に入らない家具','依頼ボードでは作れない家具もある。せいれいが、ごくまれにおそなえしてくれる（その子の属性の家具だけ）。']]],['くらし',[['床','家の中の床のわりあいに応じて、住み心地が最大+45（床100%のとき）。床は歩く速さも上がる。'],['水浴び','夕方、水べか、バスタブで水浴びをする。できないと、たのしさが下がる。'],['あかり','家の中か、すぐそばに灯り（たいまつ・ランタン・ろうそくなど）があると、住み心地がいい。'],['畑とたね','おそなえ箱や「おく」でたねをえらんで、畑をタップしてまく。収穫したら、また植える。耕しただけでは、なにも育たない。はじめはいもだけ。火のせいれいが来ると、こむぎとキャベツもつくれる。'],['ベッド','ベッドをタップすると、そこで眠るせいれいをきめられる。家をタップしても、中のベッドをえらべる。'],['かまど','「みる」でかまどをタップして、作る料理をえらぶ。料理ごとに時間がちがう。']]],['守り神のちから',[['おつげ','メニューから、きょういちにちの指示を出せる（木をあつめる・食料をあつめる など）。'],['依頼ボード','家具や罠をたのむ。手のあいたせいれいが作ってくれる。'],['なかまを呼ぶ','属性の力がたまった次の朝、神殿の「！」をタップ。']]],['夜と「コワイノ」',[['「コワイノ」','夜12時ごろ、南からやってくる。せいれいをねらってくる。柵や壁の中にいても、こわして入ってくる。見張り台や罠をこわしにくるのはワナクイだけ。オオカゲを追いはらうほど、数も強さもふえる。'],['まもりの光','守りの光のアイコンをタップしてから「コワイノ」をタップすると、パワー1を使い、光でおどかしてダメージ1をあたえる。木や岩にあてると、ゲージがへり、なくなると木材・石材が1こ落ちる（光だけなら3回）。せいれいが木を切る・岩をほる作業でも、同じゲージがへる。村レベル1で10秒ごとに使える。村レベルが1上がるごとに0.5秒みじかくなる（村レベル15で3秒）。'],['直す','こわれた柵・壁・見張り台・罠は、昼に土のせいれいが素材を使って直す。'],['火事（火山のふもと）','木でできた家具・柵・壁は、ハイカゲ・ヒノオオカゲにふれたり、昼に火の粉がとんできたりすると燃える。燃えているあいだ、15分ごとにじょうぶさが1へり、0になるとこわれる。昼なら、水のせいれいが消しにいく。家の中の物には、火の粉はとどかない。'],['朝まで休む','「コワイノ」をぜんぶ追いはらった夜や、せいれいがみんな消えてしまった夜は、上の「朝まで休む」で朝までとばせる。'],['そなえ','柵・壁・見張り台・罠でまもる。家の中にいるせいれいは攻撃されない。でも、「コワイノ」は家の壁をこわそうとする。'],['おとしもの','「コワイノ」を追いはらうと、たまにおとしものをする。朝になると、せいれいが拾ってくれる。'],['やすらぎの砂','「コワイノ」のおとしものだけで手に入る、とくべつな素材。見張り台・ようがん台をLv3に強化するとき、5ついる。'],['ヌシのかけら','3つ集めて台座にはめると、ヌシ様がもどってくる。手に入れかたは土地ごとにちがう。'],['めぶきのしずく','オオカゲを追いはらうと、半分くらいの確率で落とす。せいれいのリストの「消えてしまったせいれい」から使うと、そのせいれいがもどってくる（Lv1から）。'],['おみおくり','消えた子のお墓は、なかま（なかよしがいればその子）が神殿へはこび、おいのりして、おみおくりする。'],['お墓','この土地に深くなじんだ「めぐりの子」は、土地とのつながりをたどり、次の朝、神殿の「！」から、レベルそのままで戻ってこられる。ほかの子は、消えると自然にかえり、同じ姿では戻れない。「めぶきのしずく」があれば別（Lv1から）。']]]];
const boardMax=()=>S.flags.board5?5:3;
/* 依頼をやめる：パワーと素材はもどる。作っていた子は手をとめる */
function cancelOrder(oid){const k=S.orders.findIndex(q=>q.id===oid);if(k<0)return;const o=S.orders[k],b=BL[o.type];S.orders.splice(k,1);
  S.pt+=b.pc;for(const m in b.mat||{})S.mat[m]=(S.mat[m]||0)+b.mat[m];if(b.sand)S.sand=(S.sand||0)+b.sand;
  for(const r of S.res)if(r.act&&r.act.type==='craft'&&r.act.order===oid){endAct(r);r.act=null;r.path=[]}
  toast(b.name+'の依頼をやめた');sfx('post');renderSheet()}
const ORDER_LOCK={'stor':'stor','mbox':'mbox'};
const orderLock=()=>{const q=QUESTS[S.quest];return !S.cleared&&q&&ORDER_LOCK[q.id]||null};/* このクエストのあいだは、そのものしかたのめない（ほかをたのむと、材料がなくなって進めなくなる） */
function orderFurn(id){if(!recipeKnown(id))return;if(!lvOK(id))return toast('村Lv'+BL[id].lv+'から作れます');{const L=orderLock();if(L&&id!==L)return toast('いまは「'+BL[L].name+'」だけたのめます')}
  const b=BL[id];if(BOARD<0)return toast('神殿がありません');if(S.orders.length>=boardMax())return toast('依頼ボードがいっぱいです（'+boardMax()+'まい）');if(S.pt<b.pc)return toast('パワーが足りません');if(!matOK(b.mat))return toast('素材が足りません（'+matTxt(b.mat)+'）');if(b.sand&&(S.sand||0)<b.sand)return toast('やすらぎの砂が足りません（'+b.sand+'）');
  S.pt-=b.pc;for(const k in b.mat||{})S.mat[k]-=b.mat[k];if(b.sand)S.sand-=b.sand;S.orders.push({id:S.nid++,type:id,prog:0,need:b.time,worker:null});toast(b.name+'の依頼をはった');sfx('post');renderSheet();
}

/* ---------- 目標 ---------- */
/* 物語のせいれい（フタバ・ノドカ）がいないあいだは、そのクエストは進まない */
function qNeed(q){const n=new Set();if(q.talk){n.add(q.talk.who);q.talk.lines.forEach(l=>KEYRES.includes(l[0])&&n.add(l[0]))}(q.story||[]).forEach(l=>KEYRES.includes(l[0])&&n.add(l[0]));return[...n].filter(x=>KEYRES.includes(x))}
const qMissing=q=>qNeed(q).filter(n=>!S.res.some(r=>r.name===n)&&(S.buried||[]).some(b=>b.name===n));
let TALKW=null,QUESTCLEARW=null;/* 話したそうにしているせいれい／クエスト達成後のお礼 */
function resetQuestPrompts(){if(S)sevCancel(SEV_ENCOUNTERS.get(S),null,false);SEVW={};TALKW=null;QUESTCLEARW=null;SUBW={};QUEST_CLEAR_WAIT=null;SUB_CLEAR_WAIT={};PAYOK=false;ASKING=false}
function focusQuestSpeaker(w){if(!w||VW<100||VH<100)return;const r=S.res.find(q=>q.name===w&&!q.hidden);if(!r)return;const x=r.x*TS,y=(r.y-1.3)*TS,vw=VW/cam.z,vh=VH/cam.z;if(x<cam.x+48||x>cam.x+vw-48||y<cam.y+80||y>cam.y+vh-120)centerOn(r.x*TS,(r.y-1)*TS)}
/* きろく：できごとを日づけつきで残す */
function memo(e,t){if(!S)return;(S.memo||(S.memo=[])).push([dayNo(),e,t]);if(S.memo.length>200)S.memo.shift()}/* 思い出帳 */
function kurashi(key,mt){if(!S)return;const K=S.kb||(S.kb={done:{}});if(K.done[key])return;K.done[key]=1;if(mt)memo(mt[0],mt[1]);}/* 暮らしボーナスはなし（思い出帳のメモだけ） */
function logEv(t){if(!S.log)S.log=[];S.log.push([dayNo(),t]);if(S.log.length>300)S.log.shift()}
function checkQuest(){
  if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.quest!==S.quest)QUEST_CLEAR_WAIT=null;
  TALKW=null;if(S.qStory==null)QUESTCLEARW=null;finalCheck();
  if(NEWRES!=null||NEWQ.length)return;
  if(S.cleared){if(WD!==FREE)afterTick();return}
  if(S.quest>=QUESTS.length)return;
  const q=QUESTS[S.quest];
  if(q.skip&&S.qStory==null){/* ステージ2：草原で説明したことは、お話なしでとばす（もらえる物はもらう） */for(const id of [...questRecipeIds(q),...questRecipeIds(q,'clear')])if(BL[id]&&(!S.free||BL[id].kind!=='furn'))S.recipes[id]=true;if(q.talk){for(const id of q.talk.learn||[])S.recipes[id]=true;questGives(q,Object.assign({},q.talk.gives||{},{watchNow:false}))}if(q.pre)questGives(q,q.pre);questGives(q,Object.assign({},q.gives||{},{watchNow:false}));S.quest++;S.qTalked=false;return checkQuest()}
  if(!$('#dialog').hidden)return;
  if(S.qStory!=null){TALKW=storyWho(QUESTS[S.qStory]);QUESTCLEARW=TALKW;renderQuest();return}/* クエストのあとのお話は、💬をタップしてから */
  if(qMissing(q).length){renderQuest();return}
  if(q.talk&&!S.qTalked){if(q.talk.when()&&!isNight())TALKW=firstSpk(q.talk.lines,q.talk.who);renderQuest();return}/* 新しいクエストの声かけは、昼だけ */
  const complete=q.check();if(!complete)checkQuestParts(q);
  if(complete){
    if(isNight()){renderQuest();return}/* クリアの話・お礼は、昼だけ */
    if(q.pay&&!PAYOK){if(!ASKING&&sheet==null&&(S.payNo==null||S.t-S.payNo>60)){ASKING=true;const who=(q.talk&&q.talk.who)||POKO;
      askYesNo(who,matTxt(q.pay)+'、もらってもいい？',()=>{ASKING=false;PAYOK=true;checkQuest()},()=>{ASKING=false;S.payNo=S.t;renderQuest()})}renderQuest();return}/* 材料を使うクエストは、きいてから */
    let wait=QUEST_CLEAR_WAIT;
    if(wait&&wait.quest!==S.quest){QUEST_CLEAR_WAIT=wait=null}
    if(wait&&!wait.done){if(!qvHas(wait.obj,wait.id)||!S.res.includes(wait.r))QUEST_CLEAR_WAIT=wait=null;else{renderQuest();return}}/* 見にくる子が消えたら、べつの子で見にくるのを入れなおす */
    if(wait&&wait.done)QUEST_CLEAR_WAIT=null;
    if(!wait){const visit=queueQuestVisit(q,storyWho(q));if(visit){QUEST_CLEAR_WAIT=Object.assign({quest:S.quest,done:false},visit);renderQuest();return}}
    PAYOK=false;
    if(q.pay)for(const k in q.pay)S.mat[k]=Math.max(0,(S.mat[k]||0)-q.pay[k]);/* 材料を使うクエスト */
    S.quest++;S.qTalked=false;sfx('quest');logEv('目標「'+q.text+'」をたっせい');
    if(q.story){S.qStory=S.quest-1;TALKW=storyWho(q);QUESTCLEARW=TALKW;if(/^lv\d/.test(q.id))focusQuestSpeaker(TALKW);renderQuest();renderPalette();/* お礼は吹き出しをタップしてから。自動では会話を開かない */return}
    const after=questGives(q);inspireQuest(q,'clear');if(after)after();
    renderQuest();renderPalette();
  }else renderQuest();
}
let ASKING=false,PAYOK=false,SUBT=0;
/* はい／いいえ をきく（話す人の顔つき） */
function askYesNo(who,text,yes,no){const o=document.createElement('div');o.className='askyn';o.innerHTML='<div class="ak"><b></b><p></p><div class="ab"><button class="btn">あとで</button><button class="btn pri">はい</button></div></div>';o.querySelector('b').textContent=who;o.querySelector('p').textContent=text;
  const [bn,by]=o.querySelectorAll('button');by.onclick=()=>{sfx('next');o.remove();yes()};bn.onclick=()=>{sfx('tap');o.remove();no()};document.body.appendChild(o);sfx('next')}
/* クエストのごほうび・解放。お話のあとに行う。続けてすることがあれば関数を返す */
const ITEM_GIFTS=[];let GIFT_ACTIVE=false;
function queueItemGift(items){const entries=Object.entries(items||{}).filter(([id,n])=>BL[id]&&n>0);if(entries.length)ITEM_GIFTS.push({state:S,items:entries})}
function showItemGift(){while(ITEM_GIFTS.length&&ITEM_GIFTS[0].state!==S)ITEM_GIFTS.shift();if(!ITEM_GIFTS.length||GIFT_ACTIVE)return;
  const items=new Map();while(ITEM_GIFTS.length&&ITEM_GIFTS[0].state===S)for(const[id,n]of ITEM_GIFTS.shift().items)items.set(id,(items.get(id)||0)+n);
  GIFT_ACTIVE=true;const overlay=el('<div class="idea-reveal gift-reveal" role="dialog" aria-modal="true" aria-label="うけとったもの"></div>'),card=el('<div class="idea-card"><div class="idea-symbol">🎁</div><h2>うけとった！</h2><div class="idea-items"></div></div>');
  for(const[id,n]of items){const item=el('<div class="idea-item"></div>'),img=document.createElement('img'),name=document.createElement('span');img.src=iconURL(id);img.alt='';name.textContent=iname(id)+' ×'+n;item.append(img,name);card.querySelector('.idea-items').append(item)}
  const button=el('<button class="btn pri" type="button">うけとる</button>');button.disabled=true;card.append(button);overlay.append(card);document.body.append(overlay);sfx('good');const prior=document.activeElement;
  setTimeout(()=>{if(overlay.isConnected){button.disabled=false;button.focus({preventScroll:true})}},650);button.onclick=()=>{if(button.disabled)return;overlay.remove();GIFT_ACTIVE=false;if(prior&&prior.isConnected)prior.focus({preventScroll:true})};
}
function questGives(q,g){g=g||q.gives||{};
    (g.feat||[]).forEach(f=>S.feat[f]=true);for(const k in (g.food||{}))addFood(k,g.food[k]);for(const k in (g.mat||{}))S.mat[k]=(S.mat[k]||0)+g.mat[k];for(const k in (g.items||{})){S.unlocked[k]=true;giveItem(k,g.items[k])}queueItemGift(g.items);
    if(g.flags)g.flags.forEach(f=>S.flags[f]=true);if(g.recipes)g.recipes.forEach(id=>S.recipes[id]=true);if(g.shard)giveShard(g.shard);if(g.enemy)S.enemyOn=true;if(g.shrine)S.flags.shrine=true;if(g.flag){S.flags[g.flag]=true;if(g.flag==='onsen')dirty=true}
    if(g.godLeave){S.godGone=true;const GX=godX(),GY=godY();fx.push({k:'ring',x:GX*TS,y:GY*TS,life:1});for(let n=0;n<20;n++){const a=Math.random()*7;fx.push({k:'p',x:GX*TS,y:GY*TS,vx:Math.cos(a)*90,vy:Math.sin(a)*90-40,life:1,col:'#fff',r:3})}sfx('poof')}
    if(g.fest)freeFest();if(g.msg)toast(g.msg,'good');applyFeats();
    const hadW=g.watchNow&&(cnt('watch')>0||S.obj.some((o,j)=>o==='site'&&S.dyn[j]&&S.dyn[j].build==='watch'));// 先に建てていたら、その分のパワーを返す（おごり）
    const after=g.watchNow?(hadW?()=>{S.pt+=BL.watch.pc;for(const k in BL.watch.mat)S.mat[k]=(S.mat[k]||0)+BL.watch.mat[k];toast('見張り台の分のパワーと素材をカミサマが返してくれた','good');checkQuest()}:()=>{setMode('build');sel='watch';renderPalette();toast('見張り台を置く場所をタップ')}):null;
    return after}
/* ヌシのかけら：オオカゲ・土地の復興・キーキャラのおねがい、それぞれ1つずつ */
function giveShard(src){if(S.flags['sh_'+src])return;S.flags['sh_'+src]=true;S.shards=Math.min(3,(S.shards||0)+1);sfx('level');toast('「ヌシのかけら」を手に入れた！（'+S.shards+'/3）','good');logEv('ヌシのかけらを手に入れた');memo('💎','ヌシのかけらを手に入れた（'+S.shards+'/3）')}
/* 吹き出しは、最初に話す人から出す */
function spkOK(w){return w===GOD?godHere():!!w&&S.res.some(r=>r.name===w&&!r.hidden)}
function firstSpk(lines,fb){const w=lines&&lines[0]&&lines[0][0];return spkOK(w)?w:fb}
function storyWho(q){if(q.story&&spkOK(q.story[0]&&q.story[0][0]))return q.story[0][0];{const w=q.by||(q.talk&&q.talk.who);if(w===GOD?godHere():w&&S.res.some(r=>r.name===w&&!r.hidden))return w}/* お礼は、クエストをくれた子から */
  for(const[w]of q.story||[]){if(w===GOD){if(godHere())return GOD;continue}if(S.res.some(r=>r.name===w&&!r.hidden))return w}
  if(godHere())return GOD;const r=S.res.find(r=>!r.hidden);return r?r.name:null}
/* 水色の吹き出しのせいれいをタップ → 会話 → クエストがはじまる（会話の中でレシピを思いつくことも） */
function startTalk(){if(!$('#dialog').hidden)return;
  if(S.qStory!=null){const sq=QUESTS[S.qStory];TALKW=null;QUESTCLEARW=null;S.flags.talked1=true;
    if(sq.pre&&!S.flags['pre'+WD+'_'+S.qStory]){S.flags['pre'+WD+'_'+S.qStory]=true;questGives(sq,sq.pre);if(sheet==='food')renderSheet()}/* お礼の会話がはじまったら、すぐわたす（ベリーなど） */
    let once=0;return dialog(ideaDialogue(sq,sq.story,'clear'),()=>{if(once++||S.qStory!==QUESTS.indexOf(sq))return;/* 2回よばれても1回だけ */if(QUEST_CLEAR_WAIT&&QUEST_CLEAR_WAIT.quest===S.qStory)QUEST_CLEAR_WAIT=null;if(S.quest<=S.qStory)S.quest=S.qStory+1;/* 設置クエストは、お礼を聞き終えてから次の目標へ */S.qStory=null;const after=questGives(sq);inspireQuest(sq,'clear');{const rw=sq.reward??5;if(rw){S.pt+=rw;S.totalPt+=rw;toast('ごほうび：パワー+'+rw,'good')}}renderQuest();renderPalette();if(after)after();else checkQuest()},null)}
  const q=QUESTS[S.quest];if(!q||!q.talk)return;TALKW=null;QUESTCLEARW=null;S.flags.talked1=true;
  let once=0;dialog(ideaDialogue(q,q.talk.lines),()=>{if(once++||QUESTS[S.quest]!==q)return;/* 2回よばれても1回だけ */S.qTalked=true;recount();
    for(const id of q.talk.learn||[])S.recipes[id]=true;
    const after=q.talk.gives?questGives(q,q.talk.gives):null;inspireQuest(q);/* クエストに使う物は、会話のあとでわたす */
    sfx('quest');renderQuest();renderPalette();if(after)after();else checkQuest()},null)}
function renderQuest(){const q=QUESTS[Math.min(S.quest,QUESTS.length-1)];let pr='',t=S.cleared?(WD===FREE?'村づくりは、つづく…':'世界クリア！'):q.text;
  if(S.cleared&&WD!==FREE){const a=AFTERQ[S.aq||0],dd=S.daily,dn=dd?dd.k.filter(k=>dd.done[k]).length:0;if(a&&S.aqOn===(S.aq||0)){t=a.t;pr=aqProg(a)}else t=dd?'きょうの目標 '+dn+'/'+dd.k.length:'世界クリア！'}/* クリア後は、新しいクエストか、きょうの目標を出す */
  if(!S.cleared){const ms=qMissing(q);
    if(ms.length)t=ms.join('と')+'がもどるまで、お話は進まない';
    else if(S.qStory!=null||q.talk&&!S.qTalked)t=TALKW?TALKW+'が話したそうにしている':S.qStory==null&&q.talk.wait||'いまは、村をそだてよう';/* なにをすればいいか書く */
    else if(q.prog)pr=q.prog()}
  const qt=$('#questTxt');if(qt.dataset.k!==t+'|'+pr){qt.dataset.k=t+'|'+pr;qt.textContent='';const m=document.createElement('span'),g=document.createElement('span');m.className='qm';g.className='qp';m.textContent=t;g.textContent=pr;qt.append(m,g)}/* 進み具合は2行目に */
  const h=$('#questHow');if(!h.hidden&&h.dataset.q==S.quest)return;h.dataset.q=S.quest;h.hidden=true;h.innerHTML='<b>やりかた</b>';h.appendChild(document.createTextNode(q.how||''))}
const NUSHI_T=[
  {pre:['台座に、3つのかけらがそろった。'],open:[[POKO,'#joy|やったぁ……！ みんなのおかげで、ここまで来たんだ……！'],[MINA,'みんなぁ、台座に力をそそいでねぇ。']],scene:['#shocked|あたたかい風がふいて、荒れていた土地に、花がいっせいに咲きはじめた。','草原の奥から、風がふきぬけた。','葉がうずをまき、光がさす。そのなかに、みどりのつのをいただく白い大鹿が立っていた。'],name:'草原のヌシ',
   nushi:['#think|……ずいぶん長く、るすにしてしまったな。'],world:[['U','#joy|守り神よ、せいれいたちよ。かけらを取りもどしてくれて、ありがとう。'],['U','#danger|わたしは草原のヌシ。木のせいれいたちを生み、この地を見守ってきた者だ。'],['U','#think|……むかしは、昼と夜にも、それを見守るヌシがいたのだがな。'],['U','#danger|……おまえが、わたしのかわりに、この地の子らを見守ってくれていたのだな。']],
   next:[['U','#think|……守り神よ。もう、その役目は返してもらおう。この地は、わたしが見守る。おまえは、ほかの土地へ行ってよいのだ。'],['U','かけらにのこった記憶が教えてくれる。ほかの土地でも、ヌシは力を失い、自然の力がくずれたままだ。'],['U','まずは、火の山のふもと。地面の熱が冷えきって、温泉もこおりかけている。']],/* 次の土地の話は、フタバとの再会のあと */
   after:[[GOD,'#joy wave|おーい！ 遠くから見とったぞい〜。ようやったのう！'],[GOD,'#worry|……うむうむ！ わしは泣いとらんぞ。目に花びらが入っただけじゃ！'],[GOD,'ヌシ様の話、聞いたかの？ 次は「火山のふもとの村」じゃ。出発は、おヌシの好きなときでよいぞ。']],reu:[['F','ヌシ様……！ ヌシ様ぁっ！！'],['U','#think|……フタバ。待たせてしまったな。'],['F','#teary|ぼく、ずっと……ずっと待ってたんだよ……！'],['U','かけらを通して、おまえたちのがんばりは、ずっと感じていた。'],['U','あの夜、いちばん奥でふるえていたおまえが、今度はみんなを守ったのだな。'],['U','#worry|……おまえを、ひとりにしてしまった。すまなかった。'],['F','#think|……ううん。今は、ひとりじゃないよ！ 見て！ こんなに、なかまができたんだ！'],['F','#joy|……えへへ。おかえりなさいっ！'],['U','#think|……この草原の花。おまえが、咲かせてくれたのだな。いちばんに見られて、うれしいぞ。'],['F','#worry|……ヌシ様。きょうだいたちは……？'],['U','#think|……わたしにも、まだわからない。すまないな。'],['F','めぶきのしずくでも、だめなの……？'],['U','しずくは、消えたばかりの子を呼びもどすもの。ずっとむかしの子には、とどかぬのだ。'],['U','#surprise|ただ……自然にかえった子らは、この土地の風や土になる。新しい子らが、ここをなつかしく思うのは、そのせいかもしれぬ。'],['U','それに、あの子たちは、おまえを守りたくて前に出た。……おまえが今を生きていることを、きっとよろこんでいる。'],['F','#worry|……うん。ぼく、もう泣かないよ。'],['F','#cry|きょうだいたちがくれた明日を、ここで、みんなといっしょに歩いていく！'],['N','よかったねぇ、フタバ。',1],['H',{A:'みんなで守りきったね。やるじゃないか。',B:'みんなで守りきったな。やるじゃねえか。'},1],['M','この土地に、力がもどってきましたね。',1],['K','#joy|フッ…風まで、うれしそうだ。',1]],toast:'ステージクリア！ 守護の台座をタップすると「火山のふもとの村」へ行ける',last:'草原にもどる'},
  {open:[[HOMURA,'夜をこえたよ…！'],[SHIZUKU,'みなさん、力をそそいでください。']],scene:['#shocked|あたたかい湯気が村をつつみ、冷えきっていた地面に、ぬくもりがもどってきた。','火の山のほうから、大きな赤いけものが、おりてきた。'],
   nushi:['#think|……ふう。ようやく、体があたたまってきた。','守り神よ、せいれいたちよ。この地の熱を取りもどしてくれて、礼を言う。','わたしは、火のせいれいたちを生み、この火の山の熱を見守る者。草原のヌシとは、むかしからの知り合いだ。','#think|……あの影たちは、わたしの熱をうばっても、すこしもあたたまれなかったようだ。','かけらの記憶によれば、次は霧につつまれた水べの村。水の流れが止まり、霧がはれないままだという。'],
   after:[[GOD,'おつかれさん〜！ 見とったぞい。'],[GOD,'次は「霧のみずべの村」じゃ。…まだ道が通じておらんのじゃ。準備ができたら知らせるぞい。'],[HOMURA,'あたいたちは、この村と温泉をまもるよ。また入りにおいで！'],[SHIZUKU,'お気をつけて。…ときどき、温泉にいらしてくださいね。']],toast:'ステージクリア！ 「霧のみずべの村」は、ただいま準備中',last:'村にもどる'}];
let NUSHI_RUN=false;
function gatherAt(TX,TY,then){/* せいれいみんなが、台座のまわりへ歩いて集まる（瞬間移動はしない）。そろうか、10秒たったら、つぎへ */
  const spot={};const go=()=>{const used=new Set(Object.values(spot));for(const r of S.res){if(r.hidden||r.act&&r.act.type==='nmeet')continue;const G=bfs(r.x|0,r.y|0);let b=spot[r.id]??-1;if(b<0){let bd=1e9;for(let k=0;k<W*H;k++){if(G.dist[k]<0||used.has(k)||!walk(k)||S.obj[k]||roomOf(k))continue;const ky=(k/W)|0,d=Math.hypot(k%W+.5-TX,ky+.5-TY);if(d<1.6||d>5)continue;const sc=d+(ky<TY+1?3:0)+G.dist[k]*.02;/* 家の外の、台座の前がわ（見えるところ）に */if(sc<bd){bd=sc;b=k}}}if(b<0)continue;spot[r.id]=b;used.add(b);if(r.cing){const R=RECIPES.find(x=>x.out===r.cing.rec);if(R)for(const k in R.need)addFood(k,R.need[k]);r.cing=null}/* 料理のとちゅうなら、材料は箱にもどす */endAct(r);startAct(r,G,'nmeet',b,{run:true})}};
  const t0=performance.now();let last=0;const chk=()=>{const n=performance.now();if(n-last>1500){last=n;go()}if(S.res.every(r=>r.hidden||r.act&&r.act.type==='nmeet'&&r.act.stage==='do')||n-t0>10000)return then();setTimeout(chk,250)};setTimeout(chk,300)}
function nushiReturns(){if(NUSHI_RUN||S.cleared)return;NUSHI_RUN=true;S.flags.nushiDue=1;/* ヌシ様が帰ってくる場面。「クリア」にするのは、場面を最後まで見てから（途中でとじたら、はじめから） */
  checkQuest();renderQuest();const T=NUSHI_T[WD];
  const tw=S.obj.indexOf('tower'),TX=tw>=0?tw%W+1:CX+.5,TY=tw>=0?((tw/W)|0)+1:CY;
  centerOn(TX*TS,(TY-1)*TS);
  const openF=L=>{const o=L.filter(l=>l[0]===GOD||S.res.some(r=>r.name===l[0]));return o.length?o:[[GOD,'朝じゃな。…さあ、台座に力をそそぐんじゃ。']]};
  const runOpen=()=>dialog(openF(T.open),()=>gatherAt(TX,TY,()=>{
    // せいれいたちが、台座のまわりに集まってから、ひとりずつ力をそそぐ
    S.res.forEach((r,i)=>setTimeout(()=>{r.face=TX>=r.x?1:-1;JUMP.set(r,performance.now());spawnFX(r.x-.5,r.y-.6,ELEM[r.elem].col);sfx('furn')},i*260));
    const t0=S.res.length*260+500;
    setTimeout(()=>{spawnFX(TX-.5,TY-.2,'#fff3a0');for(let k=0;k<3;k++)setTimeout(()=>fx.push({k:'ring',x:TX*TS,y:TY*TS,life:1.4,col:'#fff6c8'}),k*300);sfx('level');flashScreen()},t0);
    // 光がひろがって、荒れた土地に花が咲いていく
    setTimeout(()=>{let n=0;const L=[];for(let t=0;t<4000&&L.length<60;t++){const x=(Math.random()*W)|0,y=(Math.random()*H)|0,k=y*W+x;if(Math.max(Math.abs(x+.5-TX),Math.abs(y+.5-TY))>14||S.obj[k]||S.floor[k]||S.ground[k]===1||L.includes(k)||S.res.some(r=>(r.x|0)===x&&(r.y|0)===y))continue;L.push(k)}
      L.sort((a,b)=>Math.hypot(a%W-TX,(a/W|0)-TY)-Math.hypot(b%W-TX,(b/W|0)-TY));L.forEach((k,i)=>setTimeout(()=>{if(S.obj[k])return;S.obj[k]='clover';burst(k,'plant');if(i%6===0)sfx('bush');if(i===L.length-1)recount();dirty=true},i*45))},t0+700);
    setTimeout(()=>dialog(T.scene,()=>{
      // ヌシ様が台座の上にあらわれる
      S.nushi={x:TX,y:TY+.95,t:6,app:0,dir:1,face:1,path:[]};
      spawnFX(TX-.5,TY-.6,'#c8ffd0');sfx('arrive');flashScreen();
      setTimeout(()=>dialog(T.nushi,()=>{
        startClap();for(const r of S.res)r.bubble='👏';for(let k=0;k<8;k++)setTimeout(()=>{const r=pick(S.res);if(r)spawnFX(r.x-.5,r.y-.6,pick(['#ffd84a','#ff9cc0','#9ff0ff','#b8ff9a']))},k*350);setTimeout(endClap,3200);/* みんなで拍手 */
        dialog((T.world&&sevLines(T.world)||[]).concat(T.reu&&sevLines(T.reu)||[],T.next&&sevLines(T.next)||[],T.after),()=>{
          S.cleared=true;delete S.flags.nushiDue;NUSHI_RUN=false;renderQuest();toast(T.toast,'good');
          S.clearDay=dayNo();S.score=calcScore();setTimeout(()=>dialog(['#think|……この土地も、元に戻ったのう'],()=>openSheet('score'),T.last,GOD),1200);
        });
      },null,T.name||'ヌシ様'),3200);
    },null,''),t0+3600);
  }));
  T.pre?dialog(T.pre,runOpen,null,''):runOpen();
}
function calcScore(){const d=S.clearDay||dayNo(),parts=[['クリアした日',d+'日目',d<=26?4000:d<=30?3200:d<=34?2600:d<=39?2000:d<=44?1500:d<=54?1000:500],['せいれい',S.res.length+'人',S.res.length*100],['消えてしまったせいれい',(S.deaths||0)+'人',-Math.min(1000,(S.deaths||0)*50)]];
 const tot=Math.max(0,parts.reduce((a,p)=>a+p[2],0)),rank=tot>=5000?'S':tot>=4000?'A':tot>=2500?'B':'C'/* ふつうはB。はやく・消さずにクリアでS */;return{tot,rank,parts}}/* クリアスコア：早いほど・せいれいが多いほど・消えたせいれいが少ないほど高い。夜の数・パワーなど、長く遊ぶほどふえるものは入れない。クリアした日：26日目まで4000・30日目まで3200・34日目まで2600・39日目まで2000・44日目まで1500・54日目まで1000・それより後500。せいれい：1人100てん。消えたせいれい：1人50てん引く（引くのは1000まで）。S 5000・A 4000・B 2500 */
function visionFX(lines,after){const d=document.createElement('div');d.style.cssText='position:absolute;inset:0;background:#0b0f0a;opacity:0;pointer-events:none;z-index:25;transition:opacity .9s ease';$('#app').appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity='.55'}));setTimeout(()=>dialog(lines,()=>{d.style.opacity='0';setTimeout(()=>{d.remove();after&&after()},900)},null,''),1000)}/* かけらにふれたとき、画面が暗くなって記憶がうかぶ（会話の枠は暗くしない・暗さは控えめ） */
function flashScreen(){const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:#fff;opacity:.85;pointer-events:none;z-index:60;transition:opacity 1.4s ease-out';document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity='0'}));setTimeout(()=>d.remove(),1600)}/* 白くひかる */
const NTALK=[[/* 草原のヌシ：守り神に話す（ひとつずつ、順番に） */
  '#think|……風が、やわらかくなったな。この土地が、息をふきかえしている。',
  '守り神よ。子らの笑い声は、どんな花より、この地を明るくする。',
  'わたしの角に、ときどき小鳥がとまる。……じっとしているのは、なかなかむずかしい。',
  '#think|フタバは、ずいぶんたくましくなった。……わたしがいないあいだに。',
  '#think|夕やけを見ると、思い出すことがある。さいごまで光ろうとする者のことを。',
  '花が咲くたび、この地のどこかで、新しい命がめざめる。……おまえのおかげだ。',
  'むかし、ここには、もっと多くの子らがいた。……いまも、風のなかに、その声がまざっている気がする。',
  '#joy|子らは、わたしの足あとに、花の種をうえてまわっている。……ありがたいが、少しくすぐったい。',
  '#think|昼と夜は、ふたつでひとつ。どちらかが欠けると、もう一方も、すこしずつ弱っていく。',
  '雨の日は、葉がよろこぶ。わたしも、すこしだけ、背がのびた気がする。',
  '守り神よ。おまえは、つかれないのか。……ふむ。神というのも、たいへんだな。',
  '#think|この台座には、子らの「守りたい」が、たくさんしみこんでいる。……あたたかいな。',
  'ほかの土地のヌシたちも、きっと、だれかを待っている。……守り神よ、急ぐことはない。'],[/* 火のヌシ */
  '#think|……ふう。湯気のにおいがすると、落ちつく。',
  '火は、あたためもすれば、焼きもする。……ホムラは、それをよく知っている子だ。',
  '温泉に子らがつかっているのを見るのが好きだ。……わたしも入りたいが、湯がわいてしまう。',
  '#think|草原のヌシは、元気にしているだろうか。あいつは、むかしから心配性でな。',
  '#think|あの影たちは、熱をほしがっていた。……あたためてやれる日が、いつか来るといいのだが。',
  '火の山のおくで、また熱がめぐりはじめた。おまえたちのおかげだ。',
  'シズクは、湯の温度を毎朝はかっている。……わたしより、くわしいかもしれん。',
  '#joy|子らのおまつりは、にぎやかでいい。わたしの若いころを思いだす。']];
const NTALKN=['#think|夜は、静かに見守るときだ。……影たちも、本当は、休める場所がほしいのだろう。','#think|……夜の風は、つめたいな。子らは、よく眠れているだろうか。'];/* 夜に話しかけたとき */
const NPLAY=[[/* 草原：遊びにきた子と、ヌシ様の会話（0：遊びにきた子、U：ヌシ様） */
  [[0,'ヌシ様、せなかに乗ってもいい？'],['U','#think|……すこしだけだぞ。角には、さわるでない。'],[0,'#joy|わあ、たかーい！']],
  [[0,'ヌシ様の角の花、いいにおいがする！'],['U','花の季節には、もっと咲く。そのときは、また見においで。']],
  [[0,'ヌシ様って、なにを食べるの？'],['U','#think|朝つゆと、日の光だ。……それと、ときどき、子らがくれるベリーもな。']],
  [[0,'ヌシ様、かくれんぼしよう！'],['U','わたしは、どこにかくれても、角が見えてしまうのだが。'],[0,'#joy|あはは、ほんとだ！']],
  [[0,'ヌシ様がいないあいだ、さみしかった？'],['U','#think|……ああ。かけらのなかで、ずっと、子らの声を聞いていた。']],
  [[0,'ねえヌシ様、草原は、むかしもこんなだった？'],['U','もっと花が多かった。……だが、いまの草原も、わたしは好きだ。']],
  [[0,'ヌシ様の足あとに、花が咲いてる！'],['U','#joy|ふふ。おまえたちが、うえてくれたのだろう？']],
  [[0,'ヌシ様、夜はこわくないの？'],['U','#think|夜は、休むための時間だ。……こわいものでは、なかったはずなのだがな。']],
  [[0,'ヌシ様、なでてもいい？'],['U','#think|……かまわん。……そこだ。耳のうしろが、すこしかゆい。']],
  [[0,'ヌシ様の背中、あったかいね。'],['U','日なたに長くいたからな。おまえも、すこし休んでいけ。']]],[/* 火のヌシ */
  [[0,'ヌシ様、温泉、ちょうどいい熱さだよ！'],['U','#joy|そうか。……子らがよろこぶ湯は、いい湯だ。']],
  [[0,'ヌシ様のたてがみ、あったかい！'],['U','やけどせんようにな。……ふう、くすぐったい。']],
  [[0,'ヌシ様、火の山って、どんなところ？'],['U','#think|熱い風がふく。……だが、夜には、星がよく見える。']],
  [[0,'ヌシ様、いっしょに火の粉を見よう！'],['U','うむ。ぱちぱちと、よく笑う火だ。']],
  [[0,'ヌシ様が帰ってきて、村があったかくなったね。'],['U','わたしではない。……おまえたちが、あたためてくれたのだ。']],
  [[0,'ヌシ様、おまつりの屋台、いっしょにまわろう！'],['U','#think|わたしが行くと、屋台がこげてしまうかもしれん。……遠くから見ているよ。']]]];
function nushiTalk(){const n=S.nushi,nm=WD===1?'火のヌシ':NUSHI1,k=WD===1?1:0;
  const r=n.pl&&S.res.find(q=>q.id===n.pl.id);if(r&&r.act&&r.act.type==='npl'&&r.act.stage==='do'){const P=NPLAY[k],L=P[(S.npc=(S.npc||0)+1)%P.length];return dialog(L.map(([w,t])=>w==='U'?[nm,t]:[r.name,chatTone(t,r)]))}/* 遊びにきた子がいれば、その子とヌシ様の会話 */
  if(isNight())return dialog([[nm,pick(NTALKN)]]);
  const T=NTALK[k];dialog([[nm,T[(S.ntk=(S.ntk||0)+1)%T.length]]])}/* 守り神に、ひとことずつ話す（順番にまわる） */
function updNushi(dt){const n=S.nushi;if(n.app==null)n.app=1;if(n.app<1){n.app=Math.min(1,n.app+dt/5);n.mv=0;return}/* 台座の上で、すこしずつ姿をあらわす */
  if(n.pl){const r=S.res.find(q=>q.id===n.pl.id);n.pl.t+=dt;if(r&&n.pl.t>90&&r.act&&r.act.type==='npl'&&r.act.stage!=='do')endAct(r);
    if(!r||!r.act||(r.act.type!=='npl'&&n.pl.t>3)){n.pl=null;n.pt=rnd(30,90)}else{n.mv=0;n.path=[];{const dx=r.x-n.x,dy=r.y-n.y;if(Math.abs(dx)<.8&&dy>0)n.dir=1;else{n.dir=0;n.face=dx<0?-1:1}}/* 遊びにくる子のほうを向く（前にいれば正面、横にいれば横向き） */if(r.act.type==='npl'&&r.act.stage==='do'){n.fx=(n.fx||0)+dt;if(n.fx>3){n.fx=0;spawnFX(n.x-.5,n.y-1.1,'#ffb8d8')}}return}}
  if(n.pt==null)n.pt=rnd(20,60);n.pt-=dt;
  if(n.pt<=0&&S.cleared&&!isNight()){/* クリア後、ときどき、精霊が遊びにくる（なにもしていない子・おもちゃで遊んでいる子から） */n.pt=20;const c=S.res.filter(r=>!r.hidden&&(!r.act||['wander','idle','play'].includes(r.act.type))&&r.hunger>30&&r.energy>25&&Math.abs(r.x-n.x)+Math.abs(r.y-n.y)<30);
    if(c.length){const r=pick(c),G=bfs(r.x|0,r.y|0),nj=(n.y|0)*W+(n.x|0),F=(j,ok)=>{const dx=j%W-(n.x|0),dy=(j/W|0)-(n.y|0);return ok(dx,dy)&&walk(j)},st0=nearest(G,j=>F(j,(dx,dy)=>dy===1&&Math.abs(dx)<=1),40),st=st0>=0?st0:nearest(G,j=>F(j,(dx,dy)=>dy===0&&Math.abs(dx)>=2&&Math.abs(dx)<=3||dy===2&&Math.abs(dx)<=1),40);/* ヌシ様の前（下）か、横に少しはなれたところ。うしろに立つと、ヌシ様にかくれて見えない */if(st>=0){endAct(r);startAct(r,G,'npl',st,{});n.pl={id:r.id,t:0};n.path=[];return}}}
  if(!n.path)n.path=[];
  if(!n.path.length){n.mv=0;n.t-=dt;if(n.t>0)return;n.t=rnd(30,90);
    let sx=n.x|0,sy=n.y|0;if(!walk(sy*W+sx)){const c=[];for(let y=sy-2;y<=sy+3;y++)for(let x=sx-2;x<=sx+2;x++){const j=y*W+x;if(x>=0&&y>=0&&x<W&&y<H&&walk(j))c.push(j)}c.sort((a,b)=>Math.hypot(a%W+.5-n.x,(a/W|0)+.5-n.y)-Math.hypot(b%W+.5-n.x,(b/W|0)+.5-n.y));if(!c.length)return;n.path=[c[0]];return}/* 台座からおりる */
    const HB=new Set();for(const h of HOUSES){for(const k of h.set)HB.add(k);for(const k of h.inside)HB.add(k)}const G=HB.has(sy*W+sx)?bfs(sx,sy):roadSearch(sx,sy,HB),r=10;for(let k=0;k<40;k++){const x=(CX+rnd(-r,r))|0,y=(CY+rnd(-r,r))|0,j=y*W+x;if(G.dist[j]>0&&G.dist[j]<40&&!HB.has(j)){n.path=pathTo(G,j);break}}return}/* 道をとおって歩く（壁や水はとおらない。家の中には入らない） */
  const j=n.path[0],tx=j%W+.5,ty=((j/W)|0)+.5,dx=tx-n.x,dy=ty-n.y,d=Math.hypot(dx,dy),s=.12*dt;
  if(!walk(j)&&d>1.2||d>.9&&HOUSES.some(h=>h.inside.has(j)||h.set.has(j))&&!HOUSES.some(h=>h.inside.has((n.y|0)*W+(n.x|0)))){n.path=[];return}/* とちゅうで家ができたら、入らずに止まる */
  if(d<=s){n.x=tx;n.y=ty;n.path.shift()}else{n.x+=dx/d*s;n.y+=dy/d*s}
  if(Math.abs(dx)>Math.abs(dy)*1.1){n.face=dx<0?-1:1;n.dir=0}else n.dir=dy<0?-1:1;n.mv=1}

/* ---------- 保存 ---------- */
let NOSAVE=false;/* 読みこみ直後は、いまの状態で上書きしない */
function save(){if(NOSAVE||!S||!S.introSeen)return false;recSync();try{const d=Object.assign({},S,{savedAt:Date.now(),res:S.res.map(r=>{const c=Object.assign({},r);c.act=null;c.path=[];c.hidden=false;return c}),orders:S.orders.map(o=>Object.assign({},o,{worker:null}))});return KV.setItem(SAVE_KEYS[S.world||0],JSON.stringify(d))}catch(e){return false}}
/* 72×72マスのセーブを、108×108マスに広げる（いまの村は、まん中にそのままのこす。外がわは、新しい土地） */
function expandMap(d){const O=OFF,mi=j=>(((j/OW)|0)+O)*W+(j%OW)+O,inner=j=>{const x=j%W,y=(j/W)|0;return x>=O&&x<O+OW&&y>=O&&y<O+OW};
  const t={ground:new Array(W*H).fill(0),floor:new Array(W*H).fill(''),obj:new Array(W*H).fill(''),dyn:{},ref:{},hp:{},rot:{},regrow:[],flags:{},res:[],world:d.world||0};genWorld(t,d.world||0);
  const G=t.ground.map((v,j)=>inner(j)?0:v),F=t.floor.map((v,j)=>inner(j)?'':v),Ob=t.obj.map((v,j)=>inner(j)?'':v),Dy={},Rf={};
  for(const k in t.dyn)if(!inner(+k))Dy[k]=t.dyn[k];for(const k in t.ref)if(!inner(+k))Rf[k]=t.ref[k];
  for(let j=0;j<OW*OW;j++){const n=mi(j);G[n]=d.ground[j];F[n]=d.floor[j];Ob[n]=d.obj[j]}
  d.hi=(t.hi||[]).map((v,j)=>inner(j)?0:v);/* 段差：まわりの新しい土地だけ */
  const mk=o=>{const r={};for(const k in o||{}){const m=/^([A-Za-z]*)(\d+)$/.exec(k);r[m?m[1]+mi(+m[2]):k]=o[k]}return r};/* マスの番号がキーのもの（「L12」などの頭の文字はそのまま） */
  d.ground=G;d.floor=F;d.obj=Ob;d.dyn=Object.assign(Dy,mk(d.dyn));
  const rf=mk(d.ref);for(const k in rf)rf[k]=mi(rf[k]);d.ref=Object.assign(Rf,rf);
  for(const f of['hp','rot','win','rug','rugRot','roof','bud','ovenSet','bedOwn','freeB','trapCd','wreq'])if(d[f])d[f]=mk(d[f]);
  if(d.st2)for(const f of['fire','frz','ash','hvb'])if(d.st2[f])d.st2[f]=mk(d.st2[f]);if(d.st2&&Array.isArray(d.st2.bw))d.st2.bw=d.st2.bw.map(mi);
  if(d.imoSeedQuestPlots)d.imoSeedQuestPlots=d.imoSeedQuestPlots.map(mi);
  for(const L of[d.regrow,d.broken])for(const q of L||[])q.j=mi(q.j);
  for(const L of[d.drops,d.seeds,d.finds])for(const q of L||[]){q.x+=O;q.y+=O}
  for(const q of[d.nushi,d.b2At])if(q){q.x+=O;q.y+=O;if(q.path)q.path=[]}
  for(const e of d.enemies||[]){e.x+=O;e.y+=O;e.path=[]}
  for(const r of d.res||[]){r.x+=O;r.y+=O;if(r.stX!=null)r.stX+=O;if(r.stY!=null)r.stY+=O;r.act=null;r.path=[];delete r.avoidJ;delete r.faceObj;delete r.lastToy;if(r.cing&&r.cing.ov!=null)r.cing.ov=mi(r.cing.ov)}/* 歩いている途中・作業の途中は、やりなおし */
  delete d.fst}
function load(w){try{const t=KV.getItem(SAVE_KEYS[w||0]);if(!t)return null;const d=JSON.parse(t);if(d&&d.v===8){if(d.ground&&d.ground.length===OW*OW)expandMap(d);if((d.mig||0)<1){const fx=v=>{if(!v)return;if(v.key){v.lash=false;v.cheek=true}};/* キーキャラは、まつげなし・ほっぺあり */(d.res||[]).concat(d.buried||[],d.lost||[]).forEach(r=>{if(r.like==='flower')r.like='chat'});(d.res||[]).forEach(r=>{fx(r.vr);if(r.name==='ノドカ'&&r.vr)r.vr.lash=false});(d.buried||[]).forEach(r=>fx(r.vr));(d.lost||[]).forEach(r=>fx(r.vr))}/* 古いセーブを直すのは、1回だけ（mig） */return d}}catch(e){}return null}

/* ---------- 描画 ---------- */
const cv=$('#cv'),ctx=cv.getContext('2d');
let dpr=1,VW=0,VH=0;const cam={x:0,y:0,z:1};let camAnim=null;
const GCS=16,GPX=GCS*TS,GFULL=64,GBUD=8;/* 地面の下絵の区画：16×16マス（512ドット）。くわしい区画は、ステージを開くときにぜんぶ作って、すてない（64こまで。マップは7×7＝49こ）。半分の細かさの区画（ちぢめたとき用、1こ約0.25MB）は、ぜんぶとっておく。区画を作る時間は1コマ8ミリ秒まで（少なくとも1こ） */
const GRD={s:null,c:new Map(),bt:0,any:false,pre:null,busy:false};/* key → {f:くわしい絵, l:半分の絵, u:さいごに使ったコマ, st:作りなおすしるし} */
function gq(cx,cy){const k=cy*64+cx;let q=GRD.c.get(k);if(!q){q={f:null,l:null,u:0,st:false};GRD.c.set(k,q)}return q}
function gbuild(cx,cy,q){/* 区画 (cx,cy) のくわしい絵を作る（まわり4マス・下へ6マスもいっしょに描いて、区画の中だけをのこす：となりのマスからはみ出す平らな物・水のふち・草のふち）。半分の細かさの絵も、ここから作る */const t0=performance.now(),X0=cx*GCS,Y0=cy*GCS,X1=Math.min(W,X0+GCS)-1,Y1=Math.min(H,Y0+GCS)-1,w=(X1-X0+1)*TS,h=(Y1-Y0+1)*TS;
  const c=q.f||document.createElement('canvas');if(c.width!==w||c.height!==h){c.width=w;c.height=h}const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(1,0,0,1,-X0*TS,-Y0*TS);drawStaticArea(g,Math.max(0,X0-4),Math.max(0,Y0-4),Math.min(W-1,X1+4),Math.min(H-1,Y1+6));g.setTransform(1,0,0,1,0,0);
  const l=q.l||document.createElement('canvas');l.width=Math.ceil(w/2);l.height=Math.ceil(h/2);const gl=l.getContext('2d');gl.imageSmoothingEnabled=true;gl.imageSmoothingQuality='high';gl.drawImage(c,0,0,l.width,l.height);
  q.f=c;q.l=l;q.st=false;q.u=RFN;GRD.bt+=performance.now()-t0;
  let n=0;for(const v of GRD.c.values())if(v.f)n++;if(n>GFULL){const L=[...GRD.c.values()].filter(v=>v.f&&v.u<RFN-1).sort((a,b)=>a.u-b.u);for(const v of L){if(n<=GFULL)break;v.f.width=v.f.height=0;v.f=null;n--}}/* くわしい区画が多すぎたら、しばらく使っていない区画からすてる（半分の絵はのこす） */}
function stagePreload(){/* マップ全体：地面の区画（くわしい絵と半分の絵）・水面の区画・段差の部品を、ぜんぶ作る */if(dirty)rebuildStatic(STATICFULL);if(GRD.s!==S)gclear();for(let cy=0;cy<=(H-1)>>4;cy++)for(let cx=0;cx<=(W-1)>>4;cx++){const q=gq(cx,cy);if(!q.f||q.st)gbuild(cx,cy,q)}GRD.any=true;
  if(WD!==1&&waterChipsOK())for(let cy=0;cy<=(H-1)>>4;cy++)for(let cx=0;cx<=(W-1)>>4;cx++)waterChunk(cx,cy);if(S.hi&&cliffChipsOK()){CPRE=S;cliffPreload()}GRD.pre=S}
function stageLoading(on){/* 「マップを読みこみ中…」（作るあいだ、画面をおおう） */let d=document.getElementById('stageLd');if(!d){d=document.createElement('div');d.id='stageLd';d.textContent='マップを読みこみ中…';d.style.cssText='position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.55);color:#fff3d6;font-size:16px';document.body.appendChild(d)}d.hidden=!on;return d}
function gget(cx,cy){/* 区画のくわしい絵（なければ・古ければ、すぐ作る） */if(GRD.s!==S)gclear();const q=gq(cx,cy);if(!q.f||q.st)gbuild(cx,cy,q);q.u=RFN;return q.f}
function gclear(){for(const v of GRD.c.values()){if(v.f)v.f.width=v.f.height=0;if(v.l)v.l.width=v.l.height=0}GRD.c.clear();GRD.s=S;GRD.any=false}
function gblit(c,sx,sy,sw,sh,dx,dy,dw,dh,lod){/* 地面の下絵の (sx,sy,sw,sh) を、c の (dx,dy,dw,dh) へ描く（区画をまたいでもよい）。lod：半分の細かさの絵を使う */const kx=dw/sw,ky=dh/sh;
  for(let cy=Math.max(0,Math.floor(sy/GPX));cy<=Math.min((H-1)>>4,Math.floor((sy+sh-.001)/GPX));cy++)for(let cx=Math.max(0,Math.floor(sx/GPX));cx<=Math.min((W-1)>>4,Math.floor((sx+sw-.001)/GPX));cx++){
    const ox=cx*GPX,oy=cy*GPX,a=Math.max(sx,ox),b=Math.max(sy,oy),a2=Math.min(sx+sw,ox+GPX,W*TS),b2=Math.min(sy+sh,oy+GPX,H*TS);if(a2<=a||b2<=b)continue;
    const q=GRD.s===S&&GRD.c.get(cy*64+cx);if(!q)continue;let im=lod?q.l:(q.f||q.l),s=im===q.l?.5:1;if(!im)continue;q.u=RFN;/* できていない区画はとばす（つぎのコマ以降に、見えている区画から作る）。くわしい絵をすてた区画は、半分の絵で */
    c.drawImage(im,(a-ox)*s,(b-oy)*s,(a2-a)*s,(b2-b)*s,dx+(a-sx)*kx,dy+(b-sy)*ky,(a2-a)*kx,(b2-b)*ky)}}
let dirty=true,STATICFULL=false,ICON=false,VIG=null;
function artLoaded(){for(const q in iconCache)delete iconCache[q];STATICFULL=true;dirty=true}/* 絵が読みこまれたら、次に描くときに1回だけ地面を全部描きなおす */

function rr(c,x,y,w,h,r){c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);c.fill()}
function drawSeedShape(c,x,y,k){c.save();c.translate(x,y);c.scale(k,k);c.rotate(-.35);c.fillStyle='#7a4a24';c.beginPath();c.moveTo(0,-7);c.bezierCurveTo(5.5,-4,5.5,4,0,7);c.bezierCurveTo(-5.5,4,-5.5,-4,0,-7);c.fill();c.fillStyle='#b07a44';c.beginPath();c.moveTo(0,-5.5);c.bezierCurveTo(3.6,-3,3.6,3.5,0,5.6);c.bezierCurveTo(-1.6,3,-1.6,-3,0,-5.5);c.fill();c.strokeStyle='#5c341a';c.lineWidth=.8;c.beginPath();c.moveTo(0,-6);c.lineTo(0,6);c.stroke();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(1.8,-2.5,.9,2,.2,0,7);c.fill();c.restore()}/* 種の形 */
let SEEDICO=null;const seedIco=()=>{if(SEEDICO)return SEEDICO;const cv=document.createElement('canvas');cv.width=cv.height=48;const g=cv.getContext('2d');g.fillStyle='rgba(255,236,140,.45)';g.beginPath();g.arc(24,24,17,0,7);g.fill();drawSeedShape(g,24,24,2.4);return SEEDICO=cv.toDataURL()};
function circ(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill()}
function drawWeed(c,id,x,y){/* 雑草・きのこ（仮の絵）。草原：しなやかな草（エノコログサ）・かさかさ草（かれたエノコログサ）。火山：くるくる草（ゼンマイ）・ちりちり草（かれたゼンマイ） */
  const h=k=>hash(((x*7+y*13)|0)+k*131),dry=id.endsWith('k');
  {const C=window.CHIPS,v=(h(7)*3)|0,ch=C&&(C[id+'#'+v]||C[id]);if(ch&&drawChip(c,ch,id,x,y,0))return}/* もらった絵（きのこ・ふんばり草は3しゅるいから、場所でえらぶ） */
  if(id==='kinoko'){shadow(c,x+16,y+27,7,2);c.fillStyle='#efe2c8';c.fillRect(x+14,y+19,4,8);c.fillStyle='#d8876a';c.beginPath();c.ellipse(x+16,y+19,7,4.5,0,Math.PI,0);c.fill();c.fillStyle='#f6e9d6';c.beginPath();c.arc(x+13.5,y+16.5,1.1,0,7);c.arc(x+18.5,y+17,1,0,7);c.fill();return}
  if(id==='weedc'){shadow(c,x+16,y+27,8,2);/* ふんばり草（オヒシバ）：ひくく広がる葉と、指のようにひらいた穂 */c.strokeStyle='#5f9a3e';c.lineWidth=1.3;for(let k=0;k<5;k++){const a=Math.PI*(.15+k*.175),L=7+h(k)*3;c.beginPath();c.moveTo(x+16,y+27);c.quadraticCurveTo(x+16+Math.cos(a+Math.PI)*L*.5,y+25,x+16-Math.cos(a)*L,y+27-Math.sin(a)*2.5);c.stroke()}
    for(let k=0;k<2;k++){const bx=x+13+k*6,top=y+14+h(k+3)*2;c.strokeStyle='#6aa34a';c.beginPath();c.moveTo(bx,y+27);c.lineTo(bx,top);c.stroke();c.strokeStyle='#8cc566';c.lineWidth=1.1;for(let f=0;f<4;f++){const a=-Math.PI/2+(f-1.5)*.42;c.beginPath();c.moveTo(bx,top);c.lineTo(bx+Math.cos(a)*5,top+Math.sin(a)*5+1.5);c.stroke()}c.lineWidth=1.3}return}
  shadow(c,x+16,y+27,7,2);const G=dry?['#c9ad78','#b39462','#dcc392']:['#7fb85a','#6aa34a','#a8d97c'];
  if(id.startsWith('weed0')){for(let k=0;k<5;k++){const bx=x+11+k*2.5,lean=(h(k)-.5)*5;c.strokeStyle=G[k%2];c.lineWidth=1.2;c.beginPath();c.moveTo(bx,y+27);c.quadraticCurveTo(bx+lean*.3,y+21,bx+lean,y+15+h(k+5)*4);c.stroke()}
    for(let k=0;k<2;k++){const tx=x+13+k*6+(h(k+9)-.5)*2,ty=y+12+h(k+3)*3;c.fillStyle=G[2];c.beginPath();c.ellipse(tx,ty,1.8,4.2,(k?.35:-.35),0,7);c.fill()}return}/* 穂のある細い草 */
  for(let k=0;k<3;k++){const bx=x+11+k*5,top=y+13+h(k)*4;c.strokeStyle=G[k%2];c.lineWidth=1.5;c.beginPath();c.moveTo(bx,y+27);c.lineTo(bx,top+3);c.stroke();c.beginPath();c.arc(bx+1.6,top+3,1.8,Math.PI,Math.PI*2.6);c.stroke();c.fillStyle=G[2];for(let v=0;v<3;v++){c.beginPath();c.ellipse(bx+(v%2?2.4:-2.4),y+24-v*3,1.6,.9,0,0,7);c.fill()}}}/* うずまきの芽のある草 */
function drawMatIc(c,k,cx,cy,sz){/* 素材のアイコン（仮の絵）：草（5しゅるい）・枝・きのこ・空き缶 */const s=sz/24;c.save();c.translate(cx,cy);c.scale(s,s);
  if(k==='shina'||k==='kasa'||k==='funba'){const G=k==='kasa'?['#c9ad78','#a98a58']:k==='funba'?['#6aa04c','#4d8636']:['#7fb85a','#5e9a3e'];for(let i=0;i<5;i++){c.strokeStyle=G[i%2];c.lineWidth=2;c.beginPath();c.moveTo(-6+i*3,9);c.quadraticCurveTo(-5+i*3,0,-8+i*4,-9+(i%2)*3);c.stroke()}if(k==='shina'){c.fillStyle='#d9e6a6';c.beginPath();c.ellipse(-7,-8,1.8,3.2,-.4,0,7);c.ellipse(4,-8,1.8,3.2,.3,0,7);c.fill()}c.fillStyle=G[1];c.fillRect(-8,6,16,3)}
  else if(k==='kuru'||k==='chiri'){const G=k==='chiri'?['#b9925f','#987247']:['#7fb85a','#5e9a3e'];c.lineWidth=2;for(let i=0;i<3;i++){const x=-6+i*6;c.strokeStyle=G[i%2];c.beginPath();c.moveTo(x,9);c.lineTo(x,-3);c.arc(x+2.5,-3,2.5,Math.PI,Math.PI*2.6);c.stroke()}c.fillStyle=G[1];c.fillRect(-8,6,16,3)}
  else if(k==='eda'){c.strokeStyle='#8a6038';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-9,8);c.lineTo(9,-7);c.moveTo(1,1);c.lineTo(4,8);c.stroke();c.fillStyle='#86b45a';c.beginPath();c.ellipse(6,-8,3,1.6,-.5,0,7);c.fill()}
  else if(k==='kinoko'){c.fillStyle='#efe2c8';c.fillRect(-2.5,-1,5,9);c.fillStyle='#d8876a';c.beginPath();c.ellipse(0,-1,9,6,0,Math.PI,0);c.fill();c.fillStyle='#f6e9d6';c.beginPath();c.arc(-3,-4,1.4,0,7);c.arc(3,-4.5,1.3,0,7);c.fill()}
  else if(k==='can'){c.fillStyle='#b9c0c8';c.fillRect(-6,-8,12,16);c.fillStyle='#d9dee3';c.fillRect(-6,-8,12,2.5);c.fillStyle='#e7a07a';c.fillRect(-6,-2,12,5);c.fillStyle='#8f969e';c.fillRect(-6,6,12,2)}
  c.restore()}
function shadow(c,x,y,w,h){c.fillStyle='rgba(30,20,10,.22)';c.beginPath();c.ellipse(x,y,w,h,0,0,7);c.fill()}
function drawBarren(c,i,x,y){
  const h=hash(i);
  c.fillStyle=WD===1?'#a39280':'#b3a37c';c.fillRect(x,y,TS,TS);/* 火山のふもとは灰まじりの土 */
  c.fillStyle='rgba(90,70,40,.18)';c.fillRect(x+hash(i*3)*26,y+hash(i*5)*26,4,3);
  c.fillStyle='rgba(255,245,220,.18)';c.fillRect(x+hash(i*7)*28,y+hash(i*11)*28,3,2);
  if(h<.22){c.strokeStyle='rgba(80,60,35,.35)';c.lineWidth=1;c.beginPath();const sx=x+4+h*40,sy=y+6+hash(i*13)*16;c.moveTo(sx,sy);c.lineTo(sx+5,sy+4);c.lineTo(sx+3,sy+9);c.moveTo(sx+5,sy+4);c.lineTo(sx+10,sy+3);c.stroke()}
  if(h>.9){c.fillStyle='#8a7d62';c.beginPath();c.ellipse(x+20,y+22,3,2,0,0,7);c.fill()}
}
function drawGrass(c,i,x,y){
  const h=hash(i);
  // マスごとの角丸や別々のグラデーションをやめ、世界全体で色をつなぐ。
  const g=c.createLinearGradient(0,0,W*TS,H*TS);g.addColorStop(0,'#a9ce7b');g.addColorStop(.48,'#9fc571');g.addColorStop(1,'#91b966');c.fillStyle=g;c.fillRect(x,y,TS,TS);
  // 草地にやわらかな色むらと、葉の重なりを足す
  if(h<.62){const a=x+5+hash(i*11)*20,b=y+6+hash(i*13)*20,rad=4+hash(i*17)*4;c.fillStyle=h<.24?'rgba(122,170,83,.12)':'rgba(226,231,151,.13)';c.beginPath();c.ellipse(a,b,rad,2.5+hash(i*19)*2,-.35,0,7);c.fill()}
  if(hash(i*7)<.68){const a=x+7+hash(i*11)*17,b=y+8+hash(i*13)*16;c.fillStyle=hash(i*31)<.5?'#8cb262':'#91b568';c.beginPath();c.ellipse(a,b,1.5,3.2,-.45,0,7);c.ellipse(a+2.8,b-.5,1.5,3.1,.45,0,7);c.ellipse(a+1.4,b-2,1.2,3.5,0,0,7);c.fill();c.strokeStyle='rgba(224,239,171,.36)';c.lineWidth=.65;c.beginPath();c.moveTo(a+1.4,b+1);c.lineTo(a+1.4,b-4);c.stroke()}
  if(h<.09){circ(c,x+8+hash(i*23)*16,y+8+hash(i*29)*16,1.5,h<.035?'#fff3f7':'#ffe27a')}
}
function grassBoundaryEdges(i){if(!REV.has(i)||S.ground[i]===1)return [];const gx=i%W,gy=(i/W)|0;return [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]].filter(([dx,dy])=>gx+dx>=0&&gy+dy>=0&&gx+dx<W&&gy+dy<H&&!REV.has(i+dy*W+dx)&&S.ground[i+dy*W+dx]!==1&&hiAt(i+dy*W+dx)===hiAt(i))}/* 高さのちがうとなりには、草のふちをのばさない（がけの上と下で、草地がまざらない） */
function grassBoundaryCorners(i){
  const gx=i%W,gy=(i/W)|0,hi0=hiAt(i),at=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.ground[y*W+x]!==1&&(hiAt(y*W+x)!==hi0?REV.has(i):REV.has(y*W+x)),corners=[/* 高さのちがうマスは、自分と同じとみなす */
    {cells:[[gx-1,gy-1],[gx,gy-1],[gx-1,gy],[gx,gy]],x:gx*TS,y:gy*TS},
    {cells:[[gx,gy-1],[gx+1,gy-1],[gx,gy],[gx+1,gy]],x:(gx+1)*TS,y:gy*TS},
    {cells:[[gx,gy],[gx+1,gy],[gx,gy+1],[gx+1,gy+1]],x:(gx+1)*TS,y:(gy+1)*TS},
    {cells:[[gx-1,gy],[gx,gy],[gx-1,gy+1],[gx,gy+1]],x:gx*TS,y:(gy+1)*TS}
  ],out=[];
  for(const q of corners){if(q.cells.some(([x,y])=>x<0||y<0||x>=W||y>=H||S.ground[y*W+x]===1))continue;/* 水のマスがまじる角には、草とあれ地の角の絵をおかない（水のそばに土の丸い穴ができるので） */const mask=q.cells.map(([x,y])=>at(x,y)),n=mask.filter(Boolean).length,diagonal=n===2&&mask[0]===mask[3]&&mask[1]===mask[2];if((n!==1&&n!==3&&!diagonal)||!mask.includes(true))continue;const owner=Math.min(...q.cells.filter((_,k)=>mask[k]).map(([x,y])=>y*W+x));if(owner===i)out.push([q.x,q.y])}
  return out
}
function drawGrassBoundary(c,i,x,y){for(const [dx,dy,side] of grassBoundaryEdges(i)){c.save();c.translate(x+(side===1||side===2?TS:0),y+(side>=2?TS:0));c.rotate(side*Math.PI/2);const gx=i%W,gy=(i/W)|0,axis=side===0||side===2?0:1,line=axis?gx+(side===1?1:0):gy+(side===2?1:0),seed=i*137+side*29,world=p=>(axis?gy*TS+p:gx*TS+p),noise=p=>{const z=world(p)/16,a=Math.floor(z),f=z-a,t=f*f*(3-2*f),key=line*7919+axis*104729;return(hash(key+a*374761393)*2-1)*(1-t)+(hash(key+(a+1)*374761393)*2-1)*t},wave=p=>noise(p)*2.6+Math.sin(world(p)*.1+line*1.7)*.55+Math.sin(world(p)*.25+line*2.3)*.2,barren=WD===1?'#a39280':'#b3a37c';c.fillStyle=barren;c.beginPath();c.moveTo(3,-17);c.lineTo(TS-3,-17);c.quadraticCurveTo(TS+1,-10,TS-3,wave(TS-3));for(let p=TS-3;p>=3;p-=2)c.lineTo(p,wave(p));c.quadraticCurveTo(-1,-10,3,-17);c.closePath();c.fill();for(let k=0;k<20;k++){const v=hash(seed*31+k*71),pos=k*1.7-1+hash(seed+k*37)*1.8,depth=2+v*4.3;c.fillStyle=k%4?'#9dc26e':'#8cb262';c.beginPath();c.ellipse(pos,wave(pos)+.6,2+hash(seed+k*17)*1.6,depth*.7,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(pos-1.7,wave(pos));c.quadraticCurveTo(pos-1.7,wave(pos)+depth*.6,pos+(v-.5)*3,wave(pos)+depth+1.5);c.quadraticCurveTo(pos+1.9,wave(pos)+depth*.4,pos+1.7,wave(pos));c.closePath();c.fill()}c.restore()}const radius=4.5;c.fillStyle=WD===1?'#a39280':'#b3a37c';for(const [cx,cy] of grassBoundaryCorners(i)){c.beginPath();c.arc(x+cx-i%W*TS,y+cy-((i/W)|0)*TS,radius,0,Math.PI*2);c.fill()}}
function drawWaterAll(c,X0=0,Y0=0,X1=W-1,Y1=H-1){
  const isW0=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.ground[y*W+x]>=1,h=TS/2;/* 浅瀬も水として描く（石は毎コマ上に描く） */let isW=isW0;
  const blob=(r)=>{c.beginPath();for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isW(x,y))continue;const cx=x*TS+h,cy=y*TS+h;
      const rr=r+hash(y*W+x)*3.5-.5,rb=r-1;c.moveTo(cx+rr,cy);c.arc(cx,cy,rr,0,7);
      if(isW(x+1,y))c.rect(cx,cy-rb,TS,rb*2);if(isW(x,y+1))c.rect(cx-rb,cy,rb*2,TS);
      if(isW(x+1,y)&&isW(x,y+1)&&isW(x+1,y+1))c.rect(cx,cy,TS,TS)}c.fill();
    c.beginPath();for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const n=isW(x,y)+isW(x+1,y)+isW(x,y+1)+isW(x+1,y+1);if(n!==3)continue;const px=(x+1)*TS,py=(y+1)*TS;c.moveTo(px+r*.9,py);c.arc(px,py,r*.9,0,7)}
    c.fill()};
  const VW2=WD===1;
  if(waterChipsOK()){/* ドット絵：マスの角ごとに、まわり4マスの水のあるなし（16通り）で形をえらぶ */
    const C=window.CHIPS,dc=(k,x,y)=>{const ch=C[k];if(ch)drawChip(c,ch,'water',x,y,0)};
    const corners=(f,k,d=dc)=>{for(let y=Y0;y<=Y1+1;y++)for(let x=X0;x<=X1+1;x++){const b=(f(x-1,y-1)?1:0)|(f(x,y-1)?2:0)|(f(x-1,y)?4:0)|(f(x,y)?8:0);if(b)d(k+':'+b,x*TS,y*TS)}};
    /* 水のふちに、となりの地面をうつす処理はしない（水の下は草地の絵） */

    if(!VW2){const t=document.createElement('canvas'),BAND=12,pti=chipImgs(C['tex:water'],'water')[0];for(let b0=Y0;b0<=Y1;b0+=BAND){const b1=Math.min(Y1,b0+BAND-1);t.width=(X1-X0+1)*TS;t.height=(b1-b0+1)*TS;const tc=t.getContext('2d');tc.setTransform(1,0,0,1,-X0*TS,-b0*TS);const dm=(k,x,y)=>{const ch=C[k];if(ch)drawChip(tc,ch,'water',x,y,0)};for(let y=b0;y<=b1+1;y++)for(let x=X0;x<=X1+1;x++){const b=(isW0(x-1,y-1)?1:0)|(isW0(x,y-1)?2:0)|(isW0(x-1,y)?4:0)|(isW0(x,y)?8:0);if(b)dm('waterm:'+b,x*TS,y*TS)}tc.globalCompositeOperation='source-in';tc.fillStyle=tc.createPattern(pti,'repeat');tc.fillRect(X0*TS,b0*TS,(X1-X0+1)*TS,(b1-b0+1)*TS);c.drawImage(t,X0*TS,b0*TS)}t.width=t.height=0}/* 水面：水の形（waterm）の中だけに、128×128の水のテクスチャをしきつめる */
    corners(isW0,VW2?'waterr':'water');
    if(VW2&&S.st2){const M=sprMap();corners((x,y)=>isW0(x,y)&&springOn(M[y*W+x]),'waterh')}/* よみがえった温泉だけ、乳白色の湯 */
    if(VW2)for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(!isW0(x,y))continue;const i=y*W+x,x0=isW0(x-1,y)?2:12,x1=isW0(x+1,y)?18:8,y0=isW0(x,y-1)?4:14,y1=isW0(x,y+1)?28:18;dc('wave#'+((hash(i*5+2)*4)|0),x*TS+x0+hash(i)*Math.max(0,x1-x0)|0,y*TS+y0+hash(i*3)*Math.max(0,y1-y0)|0)}/* さざなみ（水のふちは水の内がわにあるので、ふちにかからない所に） */
    return}
  c.fillStyle=VW2?'#bdb3a2':'#9fc470';blob(h+8);
  c.fillStyle=VW2?'#a69b88':'#86ad5f';blob(h+5);
  c.fillStyle=VW2?'#7d9fb0':'#4fa6dd';blob(h+3);
  c.fillStyle='rgba(255,255,255,.28)';blob(h+3-1.5);c.fillStyle=VW2?'#8fb0bf':'#5db4ea';blob(h+1);
  if(VW2&&S.st2){const M=sprMap();isW=(x,y)=>isW0(x,y)&&springOn(M[y*W+x]);c.fillStyle='#7fcfcf';blob(h+3);c.fillStyle='rgba(255,255,255,.28)';blob(h+1.5);c.fillStyle='#9fe0dc';blob(h+1);isW=isW0}/* よみがえった温泉だけ、乳白色の湯 */
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isW(x,y))continue;const i=y*W+x,px=x*TS,py=y*TS;c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1.3;c.beginPath();const wx=px+6+hash(i)*10,wy=py+10+hash(i*3)*12;c.moveTo(wx,wy);c.quadraticCurveTo(wx+3,wy-2.5,wx+6,wy);c.quadraticCurveTo(wx+9,wy+2.5,wx+12,wy);c.stroke()}
}
const CSPR={"mugi2":{"w":73,"h":80,"src":"assets/g/19488f6512.webp"},"imo2":{"w":89,"h":80,"src":"assets/g/ac0f2df624.webp"},"mugi1":{"w":40,"h":36,"src":"assets/g/96c4019f1f.webp"},"imo1":{"w":51,"h":36,"src":"assets/g/fed730d1aa.webp"},"mugi":{"w":80,"h":90,"src":"assets/g/9fd1173dcf.webp"},"tomato":{"w":84,"h":76,"src":"assets/g/c905ee98dd.webp"},"imo":{"w":98,"h":90,"src":"assets/g/ec2d14bb42.webp"},"sprout":{"w":42,"h":40,"src":"assets/g/0d994d8d66.webp"}};
for(const k in CSPR){const g=CSPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1};g.img.src=g.src}
function drawCrop(c,k,x,y,g,big){const s=Math.min(1,g/100),st=g>=100?3:s>=.6?2:s>0?1:0;
  if(big){const rp=CSPR[k]||CSPR.mugi;if(st===3&&rp.ok){const h=30,w=h*rp.w/rp.h;c.drawImage(rp.img,x+16-w/2,y+27-h,w,h);return}{const sp=CSPR[(CSPR[k+'1']?k:'mugi')+st];if(st&&st<3&&sp&&sp.ok){const h=st===1?13:27,w=h*sp.w/sp.h;c.drawImage(sp.img,x+16-w/2,y+(st===1?20:27)-h,w,h);return}}if(st&&st<3){const z=st===1?.75:1.25,bx=x+16,by=y+19;c.save();c.translate(bx,by);c.scale(z,z);c.fillStyle='#6fae4f';rr(c,-1.1,-9,2.2,9.5,1.1);c.fillStyle='#86c463';c.beginPath();c.ellipse(-5,-10,5.4,3.4,-.45,0,7);c.fill();c.beginPath();c.ellipse(5,-10.5,5.4,3.4,.45,0,7);c.fill();c.fillStyle='#9fd47c';c.beginPath();c.ellipse(-5.6,-11,2.6,1.3,-.45,0,7);c.fill();c.beginPath();c.ellipse(4.4,-11.5,2.6,1.3,.45,0,7);c.fill();c.restore();return}}const pts=big?[[16,18]]:[[8,10],[16,10],[24,10],[8,19],[16,19],[24,19],[8,28],[16,28],[24,28]];
  for(const[mx,my]of pts){const px=x+mx,py=y+my,sc=big?2.2:1;
    if(st===1){c.fillStyle='#7fd06a';c.fillRect(px-.5*sc,py-2.5*sc,1*sc,2.5*sc);c.beginPath();c.ellipse(px-1.4*sc,py-2.8*sc,1.4*sc,.8*sc,-.5,0,7);c.ellipse(px+1.4*sc,py-2.8*sc,1.4*sc,.8*sc,.5,0,7);c.fill();continue}
    if(k==='mugi'){if(st===2){c.fillStyle='#5fb34a';c.fillRect(px-1.6*sc,py-6*sc,1*sc,6*sc);c.fillRect(px+.6*sc,py-7*sc,1*sc,7*sc);c.fillRect(px-.4*sc,py-5*sc,1*sc,5*sc)}
      else{c.fillStyle='#b8923a';c.fillRect(px-.5*sc,py-7*sc,1*sc,7*sc);c.fillStyle='#f2cf5a';c.fillRect(px-1.5*sc,py-10*sc,3*sc,4.5*sc);c.fillStyle='#ffe58a';c.fillRect(px-.8*sc,py-9.5*sc,1*sc,2*sc);c.fillStyle='#d9ae3a';c.fillRect(px+1.5*sc,py-9*sc,.6*sc,3*sc)}}
    else if(k==='tomato'){c.fillStyle='#3f8a35';c.fillRect(px-.6*sc,py-6*sc,1.2*sc,6*sc);circ(c,px-2*sc,py-5*sc,1.9*sc,'#58b548');circ(c,px+2*sc,py-6*sc,1.9*sc,'#58b548');circ(c,px,py-7.5*sc,1.7*sc,'#6cc75a');
      if(st===2){circ(c,px+1.6*sc,py-2.4*sc,1.3*sc,'#a6d86a')}else{circ(c,px+1.6*sc,py-2*sc,2.4*sc,'#e8463a');circ(c,px-1.8*sc,py-1.4*sc,1.9*sc,'#f05a40');circ(c,px+1*sc,py-2.8*sc,.7*sc,'#ffc0b0')}}
    else{if(st===3){c.fillStyle='#9a5a32';c.beginPath();c.ellipse(px,py,3.2*sc,2*sc,0,0,7);c.fill();c.fillStyle='#c27a48';c.beginPath();c.ellipse(px-.6*sc,py-.4*sc,1.4*sc,.7*sc,0,0,7);c.fill()}
      const r=st===2?1.9:2.3;circ(c,px-1.8*sc,py-3*sc,r*sc,st===3?'#4f9a40':'#5aa84a');circ(c,px+1.8*sc,py-3.6*sc,r*sc,st===3?'#62b252':'#6cbf55');circ(c,px,py-5*sc,(r-.3)*sc,'#78cc62')}}}
// 壁・ドアのマスのふちに、となりの床をのばして描く
const ROADF=new Set(['path','gravel','woodpath','stone','brick']);
const shU=(c,i,iso)=>c._shU!=null?c._shU:!iso&&HOME_WALLS.has(S.obj[i-W]);/* 床の上はしの「壁の下のかげ」を描くか（壁の下にのばす床は、となりの床マスに合わせる） */
function wallMarg(c,i,x,y){const isW=k=>HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k));const door=HOME_DOORS.has(S.obj[i]);
  {const fl=k=>S.floor[k]&&!ROADF.has(S.floor[k])&&!isW(k);/* 道（砂利・石など）は家の床とみなさない */
      const fr=door&&(isW(i-1)||isW(i+1)),dirs=door?[[-1,0,0,16,32],[1,16,0,16,32],[-W,0,0,32,fr?30:16],[W,0,fr?30:16,32,fr?2:16]].filter(d=>fl(i+d[0])):/* ドアの下は、家の中がわだけ床。外がわは外の地面のまま。正面のあるドア（よこの壁のドア）は、上の床をしきいの上の面の下まで（y+30）のばす（開いたときに外の地面が見えないように）。下の床は、しきいの下（y+30〜）だけ（上の壁のドアを開くと、外の地面だけが見える） */[[-1,0,0,16,32],[1,16,0,16,32],[-W,0,0,32,16],[W,0,16,32,16],[-W-1,0,0,16,16],[-W+1,16,0,16,16],[W-1,0,16,16,16],[W+1,16,16,16,16]].filter(d=>fl(i+d[0]));
      for(const sh of [false,true]){const D=dirs.filter(d=>HOME_WALLS.has(typeAt(i+d[0]-W))===sh);if(!D.length)continue;c.save();c.beginPath();for(const d of D)c.rect(x+d[1],y+d[2],d[3],d[4]);c.clip();c._shU=sh;drawFloor(c,S.floor[i+D[0][0]],x,y,i,true);c._shU=null;c.restore()}}/* となりの床マスの上が壁なら、床と同じ「壁の下のかげ」も、壁の下までつなげる */
}
// 道は、同じ種類どうしだけつながる（ちがう種類の道は、べつの道としてふちをかく）。マップのはし・水とはつながらない
function roadLinks(i,iso){const gx=i%W,gy=(i/W)|0,me=S.floor[i],wl=me==='path'||me==='gravel',has=(x,y)=>!iso&&x>=0&&y>=0&&x<W&&y<H&&(S.ground[y*W+x]!==1&&ROADF.has(me)&&(S.floor[y*W+x]===me||slopeFrom(y*W+x)===i||slopeExit(y*W+x)===i&&S.floor[slopeFrom(y*W+x)]===me));return {L:has(gx-1,gy),R:has(gx+1,gy),U:has(gx,gy-1),D:has(gx,gy+1)}}
function slopeExit(k){/* k が坂の低いほうのはしのマスなら、坂をおりた先のマス。ちがえば -1（おりた先の道も、坂へつづける） */const a=stairOf(k);if(a<0||!SLOPES.has(S.obj[a]))return -1;const d=stairDir(a);if(d<0)return -1;const lo=d===0?a:stairOut(a,d);return k===lo?lo+SDIR[d][1]*W+SDIR[d][0]:-1}
function slopeFrom(k){/* k が坂（のマス）なら、その坂をのぼった先の高いマス。ちがえば -1（のぼった先の道は、坂へつづける） */const a=stairOf(k);if(a<0||!SLOPES.has(S.obj[a]))return -1;const d=stairDir(a);return d<0?-1:stairTop(a,d)}
function roadCorners(i,iso){const gx=i%W,gy=(i/W)|0,q=roadLinks(i,iso),has=(dx,dy)=>!iso&&gx+dx>=0&&gy+dy>=0&&gx+dx<W&&gy+dy<H&&S.ground[i+dy*W+dx]!==1&&S.floor[i+dy*W+dx]===S.floor[i];return [q.L&&q.U&&!has(-1,-1),q.R&&q.U&&!has(1,-1),q.R&&q.D&&!has(1,1),q.L&&q.D&&!has(-1,1)]}
function roadInnerEdges(c,id,x,y,i,iso){if(id==='path'||id==='gravel'||id==='woodpath')return;const colors={path:['#bb925e','#d4b07a'],gravel:['#938775','#c2b7a1'],stone:['#817d73','#c0bdb4'],brick:['#956353','#d8a784']},p=colors[id],corners=roadCorners(i,iso);for(let k=0;k<4;k++){if(!corners[k])continue;c.save();c.translate(x+(k===1||k===2?TS:0),y+(k>=2?TS:0));c.rotate(k*Math.PI/2);const band=(outer,inner)=>{c.beginPath();c.arc(0,0,outer,0,Math.PI/2);c.lineTo(0,inner);c.arc(0,0,inner,Math.PI/2,0,true);c.closePath();c.fill()};c.fillStyle=p[0];band(9,0);c.fillStyle=p[1];band(8,2);c.restore()}}
function roadMaterialEdge(c,id,x,y,q){
  // Soil stays a continuous earthen rim; other surfaces use matching edging pieces.
  if(id==='path'||id==='gravel'||id==='woodpath')return;
  const palette=id==='brick'?['#cc9a78','#d8a784','#efcba6','#ab8065']:id==='stone'?['#aaa79f','#c0bdb4','#e5e1d7','#858278']:['#aba08a','#c2b7a1','#e0d6c2','#8d826e'];
  const piece=(bx,by,w,h,k)=>{c.fillStyle=palette[k%2];if(id==='gravel'){c.beginPath();c.ellipse(bx+w/2,by+h/2,w/2,h/2,0,0,Math.PI*2);c.fill();c.fillStyle=palette[2];c.beginPath();c.ellipse(bx+w*.42,by+h*.35,w*.23,h*.15,0,0,Math.PI*2);c.fill()}else{rr(c,bx,by,w,h,id==='stone'?1.8:1);c.fillStyle=palette[2];c.fillRect(bx+.6,by+.5,w-1.2,1);c.fillStyle=palette[3];c.fillRect(bx+.6,by+h-1,w-1.2,.7)}};
  const step=16;for(let k=0;k<TS/step;k++){const p=k*step+.2,len=step-.4;if(!q.U)piece(x+p,y+2,len,6.5,k);if(!q.D)piece(x+p,y+TS-8.5,len,6.5,k);const top=Math.max(p,q.U?0:9),bottom=Math.min(p+len,q.D?TS:TS-9);if(bottom-top>1){if(!q.L)piece(x+2,y+top,6.5,bottom-top,k);if(!q.R)piece(x+TS-8.5,y+top,6.5,bottom-top,k)}}
}

function roadTerrain(k,iso){if(iso||REV.has(k))return {grass:true,base:'#9dc26e',shade:'#8cb262'};return {grass:false,base:WD===1?'#a39280':'#b3a37c',shade:WD===1?'#938270':'#a39470'}}
function roadGrassEdge(c,id,x,y,i,q,iso){if(id!=='path'&&id!=='gravel'&&id!=='woodpath')return;const gx=i%W,gy=(i/W)|0,terrain=(dx,dy)=>{if(!iso&&(gx+dx<0||gy+dy<0||gx+dx>=W||gy+dy>=H))return null;const j=i+dy*W+dx;return !iso&&(S.ground[j]===1||S.floor[j])?null:roadTerrain(j,iso)};
  const fringe=(px,py,a,seed,t)=>{c.save();c.translate(px,py);c.rotate(a);for(let k=0;k<20;k++){const v=hash(seed*31+k*71),pos=k*1.7-1+hash(seed+k*37)*1.8,depth=2+v*4.3;c.fillStyle=t.base;c.beginPath();c.ellipse(pos,.6,2+hash(seed+k*17)*1.6,depth*.7,0,0,Math.PI*2);c.fill();if(t.grass){c.fillStyle=k%4?t.base:t.shade;c.beginPath();c.moveTo(pos-1.7,0);c.quadraticCurveTo(pos-1.7,depth*.6,pos+(v-.5)*3,depth+1.5);c.quadraticCurveTo(pos+1.9,depth*.4,pos+1.7,0);c.closePath();c.fill()}else if(v>.65){c.fillStyle=t.shade;c.beginPath();c.ellipse(pos,1+v*2,.7+v,.5+v*.4,v,0,Math.PI*2);c.fill()}}c.restore()};
  for(const [open,dx,dy,px,py,a] of [[!q.U,0,-1,x,y+2,0],[!q.D,0,1,x+TS,y+TS-2,Math.PI],[!q.L,-1,0,x+2,y+TS,-Math.PI/2],[!q.R,1,0,x+TS-2,y,Math.PI/2]]){const t=open&&terrain(dx,dy);if(t)fringe(px,py,a,i*97+(dx+2)*11+dy*7,t)}
  roadCorners(i,iso).forEach((v,k)=>{if(!v)return;const dx=k===0||k===3?-1:1,dy=k<2?-1:1,t=terrain(dx,dy);if(!t)return;c.save();c.translate(x+(dx>0?TS:0),y+(dy>0?TS:0));c.rotate(k*Math.PI/2);for(let n=0;n<9;n++){const a=n*Math.PI/16,r=2+hash(i+n*41)*2.5;c.fillStyle=t.base;c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r,2,2.5,a,0,Math.PI*2);c.fill()}c.restore()})
}

function roadShape(c,x,y,q){const l=x+(q.L?0:2),r=x+TS-(q.R?0:2),t=y+(q.U?0:2),b=y+TS-(q.D?0:2),tl=!q.L&&!q.U?6:0,tr=!q.R&&!q.U?6:0,br=!q.R&&!q.D?6:0,bl=!q.L&&!q.D?6:0;c.beginPath();c.moveTo(l+tl,t);c.lineTo(r-tr,t);c.quadraticCurveTo(r,t,r,t+tr);c.lineTo(r,b-br);c.quadraticCurveTo(r,b,r-br,b);c.lineTo(l+bl,b);c.quadraticCurveTo(l,b,l,b-bl);c.lineTo(l,t+tl);c.quadraticCurveTo(l,t,l+tl,t);c.closePath()}
function drawFloorChip(c,id0,x,y,i,iso){const C=window.CHIPS;if(!C)return false;const gx=i%W,gy=(i/W)|0,flat=id0==='brickfloor'||id0==='stonefloor',id=flat?(id0==='brickfloor'?'brick':'stone'):id0;
  const base=id==='carpet'?C.carpet:C[(id==='woodpath'?'floor':id0==='stonefloor'?'stonefloor':id)/* 木の道：絵ができるまでは、フローリングの絵。石の床は、石畳とはべつの絵 */+'#'+(id==='path'||id==='gravel'?((hash(i*13+5)*4)|0):id0==='stonefloor'?(gx%4)+(gy%4)*4:(gx%2)+(gy%2)*2)];/* 石の床は4×4マスでつながる絵 */if(!base||!chipImgs(base,id)[0].ok)return false;/* 床のもよう：土・砂利は4しゅるい、石・レンガ・板は2×2マスでつながる絵 */
  const road=!flat&&ROADF.has(id),q=road?roadLinks(i,iso):null,edged=id==='stone'||id==='brick';if(road){c.save();if(!edged){roadShape(c,x,y,q);c.clip()}}/* 石畳・レンガ道は1マスぴったりのはば（へりはマスのふちまで）。あぜ道・砂利道は、ふちを少しまるく */
  drawChip(c,base,id,x,y,0,i);
  if(id==='carpet'&&c._shU==null){const same=k=>!iso&&S.floor[k]==='carpet';/* 壁の下にのばすじゅうたん（wallMarg）には、ふちを描かない */for(const[s,k]of[['U',i-W],['D',i+W],['L',i-1],['R',i+1]])if(!same(k)&&C['carpet:'+s])drawChip(c,C['carpet:'+s],id,x,y,0,i)}/* じゅうたんのふち */
  if(road){const cn=roadCorners(i,iso);
    if(id==='stone'||id==='brick'){const m=(q.L?1:0)|(q.R?2:0)|(q.U?4:0)|(q.D?8:0);if(m<15&&C[id+':'+m])drawChip(c,C[id+':'+m],id,x,y,0,i);cn.forEach((v,k)=>{if(v&&C[id+':c'+k])drawChip(c,C[id+':c'+k],id,x,y,0,i)})}/* 道のふちの石・内がわの角 */
    else{const tr=(dx,dy)=>{const j=i+dy*W+dx;if(!iso&&(gx+dx<0||gy+dy<0||gx+dx>=W||gy+dy>=H))return null;if(!iso&&(S.ground[j]===1||S.floor[j]||hiAt(j)!==hiAt(i)))return null;/* 高さのちがうマスの地面は、道のふちに出さない */const t=roadTerrain(j,iso);return t.grass?'g':WD===1?'r':'d'};
      for(const[s,open,dx,dy]of[['U',!q.U,0,-1],['D',!q.D,0,1],['L',!q.L,-1,0],['R',!q.R,1,0]]){const t=open&&tr(dx,dy);if(t&&C['fringe'+t+':'+s])drawChip(c,C['fringe'+t+':'+s],id,x,y,0,i)}
      cn.forEach((v,k)=>{if(!v)return;const t=tr(k===0||k===3?-1:1,k<2?-1:1);if(t&&C['fringe'+t+':c'+k])drawChip(c,C['fringe'+t+':c'+k],id,x,y,0,i)})}/* 草・地面とのさかい */
    c.restore()}
  if(shU(c,i,iso)&&!road&&id!=='floor'){c.fillStyle='rgba(60,30,10,.2)';c.fillRect(x,y,TS,4)}/* 壁の下のかげ */
  return true}
function drawFloor(c,id,x,y,i,iso){
  if(!c._chip&&drawFloorChip(c,id,x,y,i,iso))return;/* ドット絵があれば、それを使う */
  const n=k=>!iso&&!!S.floor[k],gx=i%W,gy=(i/W)|0;
  const flat=id==='brickfloor'||id==='stonefloor';if(flat)id=id==='brickfloor'?'brick':'stone';/* 家の床は、道と同じ絵で、道のふち・つなぎはなし */
  const road=!flat&&ROADF.has(id),links=road?roadLinks(i,iso):null;if(road){c.save();roadShape(c,x,y,links);c.clip()}/* 縁の外には、床の絵をはみ出させない */
  if(id==='path'){c.fillStyle='#e6c48c';c.fillRect(x,y,TS,TS);
    c.fillStyle='#d4b07a';c.beginPath();c.ellipse(x+9+hash(i)*12,y+11+hash(i+5)*6,4.5,2.6,0,0,7);c.fill();c.beginPath();c.ellipse(x+20,y+21+hash(i+3)*5,3.5,2.2,0,0,7);c.fill();c.fillStyle='rgba(255,250,235,.45)';c.beginPath();c.ellipse(x+14+hash(i+7)*8,y+16,2.5,1.4,0,0,7);c.fill()}
  else if(id==='floor'){const fw=k=>!iso&&(HOME_WALLS.has(typeAt(k))||HOME_DOORS.has(typeAt(k)))&&!S.floor[k],same=k=>n(k)&&S.floor[k]===id||fw(k),L=same(i-1),R2=same(i+1),U=same(i-W),D=same(i+W);/* 板目は座標に合わせて並べ、隣の床へ連続させる */
    c.save();c.beginPath();c.rect(x,y,TS,TS);c.clip();c.fillStyle='#805536';c.fillRect(x,y,TS,TS);
    const gx0=gx*TS,gy0=gy*TS,rh=TS/3;
    for(let row=0;row<3;row++){const gyLine=gy0+row*rh,rowId=Math.floor(gyLine/rh),off=(rowId%2)*TS,first=Math.floor((gx0-off)/(TS*2))*(TS*2)+off;
      for(let bx=first;bx<gx0+TS;bx+=TS*2){const l=x+Math.max(0,bx-gx0),r=x+Math.min(TS,bx+TS*2-gx0);if(r<=l)continue;const py=y+row*rh+1,h=rh-2;
        c.fillStyle='#bd8756';rr(c,l,py,r-l,h,1.4);c.fillStyle=row%2?'#d8a36d':'#d3a06c';rr(c,l+.7,py+.6,r-l-1.4,h-1.2,1.1);
        c.fillStyle='rgba(255,235,196,.42)';c.fillRect(l+1,py+1,r-l-2,.8);c.fillStyle='rgba(105,62,34,.22)';c.fillRect(l+1,py+h-1,r-l-2,.8);
        const grain=x+((hash(rowId*31+Math.floor(bx/TS))*Math.max(3,r-l-8))|0)+4;c.fillStyle='rgba(138,83,47,.22)';rr(c,grain,py+h*.55,Math.min(8,r-l-6),.8,.4);
      }}
    if(!iso){c.fillStyle='#8b603e';if(!L)c.fillRect(x,y,1.4,TS);if(!R2)c.fillRect(x+TS-1.4,y,1.4,TS);if(!U)c.fillRect(x,y,TS,1.2);if(!D)c.fillRect(x,y+TS-1.2,TS,1.2)}c.restore();if(shU(c,i,iso)){c.fillStyle='rgba(60,30,10,.22)';c.fillRect(x,y,TS,5)}}
  else if(id==='herrfloor'){const b=4,r=4,P=2*r*b,wp=i!=null&&!ICON,gx0=wp?gx*TS:0,gy0=wp?gy*TS:0;/* 壁の下へのばす床（iso）も、同じ世界の座標でつなげる *//* ヘリンボーン：よこ板（4×1）とたて板（1×4）を、ななめの階段にならべる。世界の座標でならべて、となりの床とつなげる */
    c.save();c.beginPath();c.rect(x,y,TS,TS);c.clip();c.fillStyle='#321f14';c.fillRect(x,y,TS,TS);
    const pl=(px,py,w,h,k)=>{const l=x+px-gx0,t=y+py-gy0;if(l>x+TS||t>y+TS||l+w<x||t+h<y)return;c.fillStyle=['#4a2a1a','#522d1d','#5a321f'][(hash(k)*3)|0];c.fillRect(l,t,w-1,h-1);c.fillStyle='rgba(134,85,47,.4)';if(w>h)c.fillRect(l,t,w-1,1);else c.fillRect(l,t,1,h-1)};/* すきま・つやは1ドットの線（地面の下絵と、壁ぎわの毎コマの絵で、見た目がそろうように） */
    for(let n=Math.floor(gy0/b)-r-1;n*b<=gy0+TS;n++)for(let m=Math.floor((gx0-n*b-r*b)/P);n*b+m*P<=gx0+TS;m++){const ox=n*b+m*P,k=n*7919+m*104729;pl(ox,n*b,r*b,b,k);pl(ox,n*b+b,b,r*b,k+1)}
    c.restore();if(shU(c,i,iso)){c.fillStyle='rgba(30,15,8,.25)';c.fillRect(x,y,TS,5)}}
  else if(id==='carpet'){const same=k=>!iso&&S.floor[k]==='carpet',L=same(i-1),R2=same(i+1),U=same(i-W),D=same(i+W);c.fillStyle='#8b4543';c.fillRect(x,y,TS,TS);c.fillStyle='#a95753';rr(c,x+1,y+1,TS-2,TS-2,3);c.fillStyle='#dfb77d';if(!U)c.fillRect(x+2,y+2,TS-4,1.6);if(!D)c.fillRect(x+2,y+TS-3.6,TS-4,1.6);if(!L)c.fillRect(x+2,y+2,1.6,TS-4);if(!R2)c.fillRect(x+TS-3.6,y+2,1.6,TS-4);
    c.save();c.beginPath();c.rect(x+3,y+3,TS-6,TS-6);c.clip();c.strokeStyle='rgba(247,208,148,.25)';c.lineWidth=.7;for(let k=0;k<7;k++){const px=x+5+k*4;c.beginPath();c.moveTo(px,y+4);c.lineTo(px+2,y+TS-4);c.stroke()}c.strokeStyle='rgba(107,45,48,.24)';for(let k=0;k<7;k++){const py=y+5+k*4;c.beginPath();c.moveTo(x+4,py);c.lineTo(x+TS-4,py+1);c.stroke()}c.restore();
    c.fillStyle='#f0d29e';c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,r=k%2?3.2:6;c.lineTo(x+16+Math.cos(a)*r,y+16+Math.sin(a)*r)}c.closePath();c.fill();circ(c,x+16,y+16,1.5,'#8a4947');if(shU(c,i,iso)){c.fillStyle='rgba(60,30,10,.2)';c.fillRect(x,y,TS,4)}}
  else if(id==='gravel'){c.fillStyle='#b9ad97';c.fillRect(x,y,TS,TS);
    for(let k=0;k<14;k++){const px=x+3+hash(i*7+k)*26,py=y+3+hash(i*11+k*3)*26,r=1+hash(i+k*5)*1.6;c.fillStyle=k%3?'#d8cfbe':'#9c917c';c.beginPath();c.ellipse(px,py,r*1.3,r,0,0,7);c.fill()}}
  else if(id==='brick'){c.fillStyle='#a66e5a';c.fillRect(x,y,TS,TS);for(let row=0;row<4;row++){const off=row%2?8:0;for(let k=-1;k<3;k++){const bx=x+k*16+off,w=15;const l=Math.max(x,bx+.5),r2=Math.min(x+TS,bx+w);if(r2<=l)continue;c.fillStyle=(row+k+((i*3)%2))%3?'#cb8164':'#c17760';c.fillRect(l,y+row*8+.5,r2-l,7);c.fillStyle='rgba(255,220,190,.25)';c.fillRect(l,y+row*8+.5,r2-l,1.2)}}}
  else if(id==='stone'){c.fillStyle='#a8a59d';c.fillRect(x,y,TS,TS);const t=(a,b,w,h2,k)=>{c.fillStyle=k?'#d6d3cc':'#cbc8c0';rr(c,x+a,y+b,w,h2,3);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+a+2,y+b+1.5,w-4,1.5);c.fillStyle='rgba(90,85,78,.22)';c.fillRect(x+a+1.5,y+b+h2-2,w-3,1.5)};
    if(hash(i)<.5){t(1,1,17,13,1);t(19,1,12,9,0);t(19,11,12,10,1);t(1,15,10,16,0);t(12,15,6,16,1);t(19,22,12,9,0)}else{t(1,1,11,11,0);t(13,1,18,9,1);t(1,13,16,9,1);t(18,11,13,11,0);t(1,23,13,8,0);t(15,23,16,8,1)}}
  {const key={floor:'floor-wood-render',stone:'floor-stone-render',brick:'floor-brick-render'}[id],art=key&&HOUSEART[key];if(art&&art.complete&&art.naturalWidth){const sample=32,cols=art.naturalWidth/sample,rows=art.naturalHeight/sample;c.drawImage(art,(gx%cols)*sample,(gy%rows)*sample,sample,sample,x,y,TS,TS)}}
  if(flat&&shU(c,i,iso)){c.fillStyle='rgba(60,30,10,.2)';c.fillRect(x,y,TS,4)}
  if(road){roadMaterialEdge(c,id,x,y,links);roadInnerEdges(c,id,x,y,i,iso);roadGrassEdge(c,id,x,y,i,links,iso);c.restore()}/* 道のふち：土・砂利は草との境、レンガ・石畳はふちどりの石 */

}
function blob(c,col,pts){c.fillStyle=col;c.beginPath();const n=pts.length;for(let k=0;k<n;k++){const a=pts[k],b=pts[(k+1)%n],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;if(k===0)c.moveTo(mx,my);else c.quadraticCurveTo(a[0],a[1],mx,my)}const a=pts[0],b=pts[1];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);c.fill()}
function tuft(c,x,y,s,col){c.fillStyle=col||'#8cc26a';for(const[dx,h,r]of[[-3,7,-.35],[0,9,0],[3,6,.4]]){c.save();c.translate(x+dx*s,y);c.rotate(r);c.beginPath();c.moveTo(-1.6*s,0);c.quadraticCurveTo(-1.4*s,-h*s*.6,0,-h*s);c.quadraticCurveTo(1.4*s,-h*s*.6,1.6*s,0);c.fill();c.restore()}}
function crate(c,x,y){c.fillStyle='#a8703f';rr(c,x+3,y+15,26,14,3);c.fillStyle='#c98f5c';rr(c,x+5,y+16,22,12,2);c.fillStyle='#b57d4b';c.fillRect(x+5,y+21,22,1.6);c.fillStyle='#d9a46e';c.fillRect(x+5,y+16,22,2);c.fillStyle='#9a6638';rr(c,x+3,y+14,4,15,1.5);rr(c,x+25,y+14,4,15,1.5);c.fillStyle='#b88050';rr(c,x+3,y+14,26,3,1.5)}
const TCR='#efe7d8',TCD='#d9cdb8',TCS='#c7b9a0',TGO='#d8a943',TBL='#5b8fd6',TBL2='#8fbaf0';
function tBase(c,x,y){c.fillStyle=TCS;rr(c,x-1,y+21,TS+2,10,3);c.fillStyle=TCD;rr(c,x-1,y+19,TS+2,7,3);c.fillStyle=TCR;rr(c,x,y+18,TS,4,2)}
function tStar(c,cx,cy,r){c.fillStyle=TGO;c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,rr2=k%2?r*.38:r;c.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2)}c.closePath();c.fill();circ(c,cx,cy,r*.22,TBL)}
function tBanner(c,x,y,h,now){const w=Math.sin((now||0)/600+x)*1;c.fillStyle='#8a5a33';c.fillRect(x-.8,y-2,1.6,h+10);circ(c,x,y-3,1.6,TGO);c.fillStyle=TBL;c.beginPath();c.moveTo(x+1,y);c.lineTo(x+8,y+w*.3);c.lineTo(x+8+w*.5,y+h);c.lineTo(x+4.5,y+h-3);c.lineTo(x+1,y+h);c.closePath();c.fill();c.fillStyle=TGO;c.fillRect(x+3.6,y+h*.4-1.6,1.6,3.2);c.fillRect(x+2.8,y+h*.4-.8,3.2,1.6)}
// 見た目だけ1.5倍にするもの（当たり判定・置けるマスはそのまま）
const ART={"fl_salvia": {"w": 91, "h": 96, "src": "assets/g/106ba40c68.webp"}, "fl_lily": {"w": 106, "h": 96, "src": "assets/g/103f17950d.webp"}, "fl_clover": {"w": 91, "h": 96, "src": "assets/g/c8b2295da8.webp"}, "fl_lotus": {"w": 150, "h": 96, "src": "assets/g/5d30b7be2f.webp"}, "fl_bell": {"w": 116, "h": 96, "src": "assets/g/8618f36cec.webp"}, "tree": {"w": 140, "h": 140, "src": "assets/g/88a858c5e3.webp"}, "bush": {"w": 146, "h": 96, "src": "assets/g/7e209f4d1b.webp"}, "dead": {"w": 138, "h": 140, "src": "assets/g/8c9a3ef253.webp"}, "rock": {"w": 122, "h": 96, "src": "assets/g/9c4f9195d8.webp"}, "bag": {"w": 87, "h": 96, "src": "assets/g/5e18541b57.webp"}};/* ユーザー提供の花・木・岩・茂み・たね袋 */
for(const k in ART){const a=ART[k];a.img=new Image();a.img.onload=()=>{a.ok=true;artLoaded()};a.img.src=a.src}
const BIG2=new Set(['windmill','statue']);/* 見張り台は2×2マスにぴったりの大きさ（拡大しない） */// 見た目2倍
const TREES=new Set(['tree','ntree','fruit','deadtree']);// 木はさらに1.5倍
const SPR_OBJ=new Set(['lumber','quarry','well','puddle','spike','firetrap','gust']);
const BIG=new Set(['table','clover','bellf','salvia','lily','lotus','tree','fruit','rock','deadtree','ntree','berry','grave','stor','mbox','oven','lamp','campfire','swing','torch','vane','kamizo','lighthouse','chair','achair','stool']);const BIGK={oven:1.2,campfire:1.2,kamizo:2,lighthouse:2,table:1.125,chair:1.125,achair:.75,stool:.75};/* 大きさの判定はそのままで、見た目だけ：いすは1.125倍、ほかの椅子とスツールは0.75倍 *//* 食卓・椅子・つぼ・石のオブジェは1マスぴったり。かまど・たき火は少しだけ大きく */// 罠は1マスぴったりなので大きくしない
/* 新しい家具（スクリプトで描く）。マスの左上が (x,y)、足もとは y+30 */
const F2C={wd:'#c08a58',wdD:'#8a5a36',wdL:'#dcae7c',ol:'#6e4a2e',cr:'#f7eedb',crD:'#e3d3b2',gr:'#8cc06a',grD:'#5e9a4a',pk:'#f2b5b5',bl:'#a8c8e6',st:'#c9c3b8',stD:'#9d968b'};
function f2rr(c,x,y,w,h,r,f,s){c.beginPath();c.roundRect(x,y,w,h,r);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=1;c.stroke()}}
function f2leaf(c,x,y,rx,ry,a,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fill()}
function f2pot(c,x,y,w){f2rr(c,x-w/2,y-w*.75,w,w*.75,2,'#c98a5a',F2C.ol);c.fillStyle='#b5764a';c.fillRect(x-w/2,y-w*.75,w,2)}
function f2flower(c,x,y,col){for(let a=0;a<5;a++)circ(c,x+Math.cos(a*1.26)*1.6,y+Math.sin(a*1.26)*1.6,1.3,col);circ(c,x,y,.9,'#ffd35c')}
/* 生垣の絵：お手本を切って、まわりのつながり方（左右上下）ごとに16マスぶん並べた画像 */
function spOK(k){const m=HOUSEART[k];return m&&m.complete&&m.naturalWidth>0}
function spTile(c,k,m,x,y,ICON,dn,fi,vo){if(dn==null)dn=m&8;if(fi==null)fi=m;const im=HOUSEART[k];if(ICON){c.drawImage(im,m*120,0,120,144,x+5,y-1,22,33);return}
  /* 高さは0.8倍で、どのマスも同じ大きさ・同じ位置にかく（ふちの高さがそろう）。下につながるマスは、下のマスとのすきまを、絵の下のはしをのばしてうめる */
  if(dn){c.drawImage(im,m*120,0,120,96,x-.2,y-2.8,32.4,32.6);return}/* 下につながるマスは、上のふちの位置はそのままで、下のマスまで絵をのばす */c.drawImage(im,m*120,0,120,96,x-.2,y-2.8,32.4,25.8);c.drawImage(im,fi*120,96,120,48,x-.2,y+23,32.4,12.8)}
const inHouseL=(i,ICON)=>!ICON&&i!=null&&!!roomOf(i);/* 家の中の灯りは、灯りそのもののぼんやりした光をかかない（家ぜんたいが光る） */
function drawF2(c,id,x,y,i,now){const C=F2C,cx=x+16,T=(now||0)/1000;
  const sh=(w,h)=>{if(!c._onWall)shadow(c,cx,y+29,w,h||3)};
  switch(id){
  case'stool':sh(8);c.fillStyle=C.wdD;for(const dx of[-6,0,6])c.fillRect(cx+dx-1,y+17,2.4,12);f2rr(c,cx-9,y+13,18,6,3,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-7,y+14,10,1.5);break;
  case'achair':case'sofa1':{const body=id==='sofa1'?C.cr:'#f3ead6';sh(12);c.fillStyle=C.wdD;c.fillRect(cx-10,y+25,3,4);c.fillRect(cx+7,y+25,3,4);
    f2rr(c,cx-11,y+4,22,17,6,body,C.crD);f2rr(c,cx-13,y+12,6,14,3,body,C.crD);f2rr(c,cx+7,y+12,6,14,3,body,C.crD);f2rr(c,cx-8,y+17,16,9,3,'#fffaf0',C.crD);
    if(id==='sofa1'){c.save();c.translate(cx-2,y+12);c.rotate(-.25);f2rr(c,-5,-4,10,8,2.5,'#9fb4be','#7f949e');c.restore()}else f2rr(c,cx-5,y+8,10,7,3,'#fffaf0');break}
  case'pouf':sh(10);c.fillStyle=C.cr;c.beginPath();c.ellipse(cx,y+22,10,7,0,0,7);c.fill();c.strokeStyle=C.crD;c.stroke();c.fillStyle='#fffaf0';c.beginPath();c.ellipse(cx,y+18,9,4.5,0,0,7);c.fill();c.strokeStyle=C.crD;for(const a of[-.6,0,.6]){c.beginPath();c.moveTo(cx,y+18);c.lineTo(cx+Math.sin(a)*9,y+27);c.stroke()}circ(c,cx,y+18,1.4,C.crD);break;
  case'stable':sh(9);c.fillStyle=C.wdD;c.fillRect(cx-1.5,y+16,3,12);c.beginPath();c.ellipse(cx,y+28,6,2,0,0,7);c.fill();c.fillStyle=C.wd;c.beginPath();c.ellipse(cx,y+15,11,5.5,0,0,7);c.fill();c.strokeStyle=C.ol;c.stroke();c.fillStyle=C.wdL;c.beginPath();c.ellipse(cx,y+14,8,3.5,0,0,7);c.fill();
    f2rr(c,cx-6,y+8,4,5,1,'#e9f2f6','#9bb');f2flower(c,cx-4,y+6,'#fff');f2rr(c,cx+2,y+10,5,4,1,'#fff','#999');break;
  case'ltable':sh(13);c.fillStyle=C.wdD;for(const dx of[-12,10])c.fillRect(cx+dx,y+19,2.5,9);f2rr(c,cx-14,y+12,28,8,2,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-12,y+13,24,2);c.fillStyle=C.cr;c.fillRect(cx-5,y+12,10,8);c.fillStyle=C.crD;c.fillRect(cx-5,y+16,10,.8);
    c.save();c.translate(cx+7,y+14.5);c.rotate(.3);f2rr(c,-3.5,-2.5,7,5,1,'#7d6a5c');c.restore();f2pot(c,cx-9,y+15,5);f2leaf(c,cx-9,y+8,2.5,1.5,-.5,C.gr);f2leaf(c,cx-8,y+9,2.5,1.4,.6,C.grD);break;
  case'sideb':sh(13);f2rr(c,cx-14,y+11,28,18,2,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-14,y+11,28,2.5);c.strokeStyle=C.wdD;c.strokeRect(cx-12,y+15,11,11);c.strokeRect(cx+1,y+15,11,11);circ(c,cx-3,y+21,1,C.ol);circ(c,cx+3,y+21,1,C.ol);
    f2pot(c,cx-8,y+11,6);f2leaf(c,cx-10,y+4,3,1.6,-.6,C.gr);f2leaf(c,cx-6,y+4,3,1.6,.6,C.grD);f2leaf(c,cx-8,y+2,2,3,0,C.gr);f2rr(c,cx+3,y+3,7,8,1,'#f4ead2',C.wdD);f2leaf(c,cx+6.5,y+7,1.5,2.5,0,C.grD);break;
  case'rug1':f2rr(c,x+2,y+11,28,18,2,C.cr,C.crD);c.strokeStyle='#e8cfa4';c.lineWidth=1;for(const dx of[-8,0,8]){c.beginPath();c.moveTo(cx+dx-4,y+20);c.lineTo(cx+dx,y+15);c.lineTo(cx+dx+4,y+20);c.lineTo(cx+dx,y+25);c.closePath();c.stroke()}c.strokeStyle=C.crD;for(let k=0;k<7;k++){c.beginPath();c.moveTo(x+4+k*4,y+29);c.lineTo(x+4+k*4,y+31);c.stroke()}break;
  case'hoshirug':{f2rr(c,x+2,y+11,28,18,2,'#2a3168','#1d2350');c.fillStyle='#fff3b8';for(const[dx,dy]of[[6,15],[13,22],[20,14],[25,24],[9,25],[17,18]])c.fillRect(x+dx,y+dy,1.5,1.5);circ(c,x+24,y+16,2,'#fff3b8');circ(c,x+25,y+15.4,1.7,'#2a3168');break}/* ほしぞらのラグ（仮の絵） */
  case'rug2':c.fillStyle=C.cr;for(const[dx,dy,r]of[[-8,0,7],[0,-3,8],[8,0,7],[-4,4,7],[4,4,7]]){c.beginPath();c.arc(cx+dx,y+21+dy,r,0,7);c.fill()}c.strokeStyle=C.crD;c.beginPath();c.ellipse(cx,y+21,13,7,0,0,7);c.stroke();break;
  case'shelf1':case'shelf2':{sh(11);f2rr(c,cx-10,y+1,20,28,2,C.wd,C.ol);c.fillStyle=C.wdD;for(const sy of[9,17,25])c.fillRect(cx-10,y+sy,20,1.5);
    if(id==='shelf1'){const bk=['#c96a5a','#6b8fb5','#d9b45a','#7fae6a','#a07ac0'];for(let r=0;r<3;r++)for(let k=0;k<5;k++){c.fillStyle=bk[(k+r*2)%5];c.fillRect(cx-8+k*3.2,y+3+r*8,2.6,6-(k%2))}f2leaf(c,cx+6,y+1,4,2,.4,C.gr);f2leaf(c,cx+8,y+5,2,4,.2,C.grD);f2leaf(c,cx+9,y+10,1.6,3,.1,C.gr)}
    else{f2pot(c,cx-3,y+8,6);f2leaf(c,cx-5,y+1,3,1.6,-.6,C.gr);f2leaf(c,cx-1,y+1,3,1.6,.6,C.grD);f2rr(c,cx-7,y+11,6,5,1,'#e9e2d2','#999');f2rr(c,cx+1,y+12,6,4,1,'#cfe0ea','#899');c.fillStyle='#7aa0c0';c.fillRect(cx-7,y+20,3,4);c.fillStyle='#d9b45a';c.fillRect(cx-3.5,y+19,3,5);f2pot(c,cx+4,y+24,5);f2leaf(c,cx+4,y+17,2,3,0,C.gr)}break}
  case'wshelf':sh(9,2);if(!c._onWall){c.fillStyle=C.wdD;c.fillRect(cx-1,y+10,2,19)}else{c.fillStyle=C.wdD;c.fillRect(cx-9,y+11,2,4);c.fillRect(cx+7,y+11,2,4)}/* 壁にかけたときは、支えの金具だけ */f2rr(c,cx-11,y+8,22,3.5,1,C.wd,C.ol);f2pot(c,cx+5,y+8,6);for(let k=0;k<4;k++){f2leaf(c,cx+7+Math.sin(T+k)*.5,y+10+k*4,2.2,1.4,.8,k%2?C.gr:C.grD)}f2rr(c,cx-8,y+2,6,6,1,'#f4ead2',C.wdD);break;
  case'cabinet':sh(11);f2rr(c,cx-11,y+9,22,20,2,C.wd,C.ol);c.fillStyle=C.wdL;c.fillRect(cx-11,y+9,22,2.5);c.strokeStyle=C.wdD;c.strokeRect(cx-9,y+13,8.5,13);c.strokeRect(cx+.5,y+13,8.5,13);circ(c,cx-2,y+20,1,C.ol);circ(c,cx+2,y+20,1,C.ol);f2pot(c,cx-5,y+9,5);f2leaf(c,cx-5,y+3,2,3,0,C.gr);f2rr(c,cx+1,y+2,7,7,1,'#f4ead2',C.wdD);f2leaf(c,cx+4.5,y+5.5,1.4,2.2,0,C.grD);break;
  case'crate':sh(11);f2rr(c,cx-11,y+10,22,19,1,C.wd,C.ol);c.strokeStyle=C.wdD;c.lineWidth=2;c.beginPath();c.moveTo(cx-10,y+11);c.lineTo(cx+10,y+28);c.moveTo(cx+10,y+11);c.lineTo(cx-10,y+28);c.stroke();c.lineWidth=1;c.strokeRect(cx-11,y+10,22,19);c.fillStyle=C.wdL;c.fillRect(cx-11,y+10,22,2);break;
  case'monstera':sh(9);f2pot(c,cx,y+29,11);for(const[dx,dy,a,col]of[[-6,-2,-.7,C.grD],[6,-3,.7,C.gr],[0,-8,0,C.gr],[-4,-11,-.3,C.grD],[5,-10,.4,C.grD]]){f2leaf(c,cx+dx,y+18+dy,6,4,a,col);c.strokeStyle='rgba(255,255,255,.5)';c.beginPath();c.moveTo(cx+dx-3,y+18+dy);c.lineTo(cx+dx+3,y+18+dy);c.stroke()}break;
  case'curtain1':case'curtain2':{const cl=id==='curtain1'?'#fbf4e4':'#7fae66',cd=id==='curtain1'?'#e6d9bd':'#55823f';sh(12,2);c.fillStyle=C.wdD;c.fillRect(cx-14,y+3,28,2.5);circ(c,cx-14,y+4.2,2,C.wdD);circ(c,cx+14,y+4.2,2,C.wdD);
    for(const sg of[-1,1]){c.fillStyle=cl;c.beginPath();c.moveTo(cx+sg*13,y+5);c.lineTo(cx+sg*2,y+5);c.quadraticCurveTo(cx+sg*7,y+16,cx+sg*9,y+29);c.lineTo(cx+sg*13,y+29);c.closePath();c.fill();c.strokeStyle=cd;c.stroke();c.beginPath();c.moveTo(cx+sg*10,y+6);c.lineTo(cx+sg*11,y+28);c.stroke();c.fillStyle=cd;c.fillRect(cx+sg*11-2,y+17,4,2)}break}
  case'mimamori':{/* みまもりのぬいぐるみ（仮の絵）：夜色のくま */const by=y+16;c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,y+29,8,2.5,0,0,7);c.fill();circ(c,cx-5,by-2,3,'#3d3f6e');circ(c,cx+5,by-2,3,'#3d3f6e');f2rr(c,cx-7,by+4,14,11,5,'#4a4c80',C.ol);circ(c,cx,by+3,6.5,'#4a4c80');circ(c,cx-2.3,by+2.5,1,'#fff6d8');circ(c,cx+2.3,by+2.5,1,'#fff6d8');circ(c,cx+6,by-6,1.6,'#ffe58a');break}
  case'yomawari':{/* よまわりのランタン（仮の絵）：青白い光 */const T2=Math.sin(T*2+(i||0))*.5+.5;c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,y+29,6,2,0,0,7);c.fill();c.fillStyle='#4a3a5a';c.fillRect(cx-1,y+12,2,17);f2rr(c,cx-6,y+2,12,12,2,'#2f2a48',C.ol);c.fillStyle='rgba(190,215,255,'+(.7+T2*.3)+')';c.fillRect(cx-4,y+4,8,8);c.fillStyle='#2f2a48';c.fillRect(cx-7,y+1,14,2);break}
  case'oyasumi':{/* おやすみのベル（仮の絵） */c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx,y+29,7,2,0,0,7);c.fill();c.fillStyle='#6b4524';c.fillRect(cx-1,y+8,2,21);c.fillRect(cx-6,y+7,12,2);c.fillStyle='#e8c25a';c.beginPath();c.moveTo(cx-5,y+20);c.quadraticCurveTo(cx-5,y+10,cx,y+10);c.quadraticCurveTo(cx+5,y+10,cx+5,y+20);c.closePath();c.fill();c.strokeStyle=C.ol;c.lineWidth=1;c.stroke();circ(c,cx,y+21,1.5,'#b8892e');break}
  case'yonaka':{/* よなかのうたの絵（仮の絵）：夜空の額 */const w=15,h=18,fx=cx-w/2,fy=y+(c._onWall?8:4);f2rr(c,fx,fy,w,h,1,C.wd,C.ol);c.fillStyle='#1d2350';c.fillRect(fx+2.5,fy+2.5,w-5,h-5);circ(c,fx+w-6,fy+6,2.2,'#fff3b8');c.fillStyle='#fff';for(const[dx,dy]of[[4,5],[6,10],[9,13],[4,13]])c.fillRect(fx+dx,fy+dy,1,1);break}
  case'toro':{/* しずけさの石どうろう（仮の絵） */const T2=Math.sin(T*1.5+(i||0))*.5+.5;c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(cx,y+29,8,2.5,0,0,7);c.fill();f2rr(c,cx-6,y+24,12,5,1,'#9a9a96',C.ol);f2rr(c,cx-2.5,y+15,5,9,1,'#a8a8a3',C.ol);f2rr(c,cx-6,y+8,12,8,1,'#b4b4ae',C.ol);c.fillStyle='rgba(255,220,140,'+(.65+T2*.35)+')';c.fillRect(cx-3,y+10,6,4);c.fillStyle='#8f8f8a';c.beginPath();c.moveTo(cx-9,y+8);c.lineTo(cx,y+2);c.lineTo(cx+9,y+8);c.closePath();c.fill();break}
  case'paint1':case'paint2':case'paint3':{const big=id==='paint1',w=big?22:15,h=big?16:18;/* 額は壁にかける物なので、脚はつけない */
    const fx=cx-w/2,fy=y+(c._onWall?(big?9:8):(big?6:4));/* 壁にかけたときは、台なしで壁の面に */f2rr(c,fx,fy,w,h,1,C.wd,C.ol);c.fillStyle=big?'#cfe6f2':'#f5ecd6';c.fillRect(fx+2.5,fy+2.5,w-5,h-5);
    if(big){c.fillStyle='#8cc06a';c.beginPath();c.moveTo(fx+2.5,fy+h-2.5);c.quadraticCurveTo(fx+8,fy+6,fx+13,fy+h-6);c.quadraticCurveTo(fx+16,fy+8,fx+w-2.5,fy+h-5);c.lineTo(fx+w-2.5,fy+h-2.5);c.fill();circ(c,fx+w-6,fy+5.5,1.8,'#fff7c0')}
    else if(id==='paint2'){c.strokeStyle=C.grD;c.beginPath();c.moveTo(cx,fy+h-4);c.lineTo(cx,fy+4);c.stroke();for(let k=0;k<3;k++){f2leaf(c,cx-2.5,fy+6+k*3.5,2.4,1.2,-.5,C.gr);f2leaf(c,cx+2.5,fy+6+k*3.5,2.4,1.2,.5,C.grD)}}
    else{c.fillStyle='#a9c98f';c.fillRect(fx+2.5,fy+2.5,w-5,h-5);f2flower(c,cx-2,fy+7,'#fff');f2flower(c,cx+2.5,fy+11,'#fff');f2leaf(c,cx,fy+13,2,1,0,C.grD)}break}
  case'wreath':for(let k=0;k<12;k++){const a=k/12*6.283;f2leaf(c,cx+Math.cos(a)*7,y+12+Math.sin(a)*7,3,1.8,a+1.57,k%2?C.gr:C.grD)}for(const a of[.6,2.2,3.8,5.2])f2flower(c,cx+Math.cos(a)*7,y+12+Math.sin(a)*7,a<3?'#fff':C.pk);c.fillStyle='#e07b6a';c.beginPath();c.moveTo(cx,y+5);c.lineTo(cx-3,y+2);c.lineTo(cx-3,y+7);c.closePath();c.moveTo(cx,y+5);c.lineTo(cx+3,y+2);c.lineTo(cx+3,y+7);c.closePath();c.fill();break;
  case'bathtub':sh(14);c.fillStyle=C.wdD;c.fillRect(cx-11,y+25,3,4);c.fillRect(cx+8,y+25,3,4);f2rr(c,cx-14,y+11,28,16,8,'#fbfbf7','#c9c4b6');c.fillStyle='#8fcbea';c.beginPath();c.ellipse(cx,y+15,11,3.5,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.ellipse(cx-4,y+14.5,4,1,0,0,7);c.fill();c.fillStyle=C.st;c.fillRect(cx+10,y+6,2,7);c.fillRect(cx+7,y+6,5,2);break;
  case'lantern':{sh(6);const fl=.75+.25*Math.sin(T*6+i);c.fillStyle='#5b4636';f2rr(c,cx-6,y+25,12,4,1,'#5b4636');if(!inHouseL(i,ICON)){c.globalAlpha=.35*fl;circ(c,cx,y+18,10,'#ffd27a');c.globalAlpha=1}f2rr(c,cx-5,y+12,10,13,2,'#ffe7a8','#5b4636');circ(c,cx,y+19,2.6*fl,'#ff9d3a');c.fillStyle='#5b4636';c.beginPath();c.moveTo(cx-7,y+12);c.lineTo(cx,y+7);c.lineTo(cx+7,y+12);c.fill();c.strokeStyle='#5b4636';c.lineWidth=1.4;c.beginPath();c.arc(cx,y+6,2.5,Math.PI,0);c.stroke();c.lineWidth=1;break}
  case'candle':{sh(6);const fl=Math.sin(T*9+i)*.6;f2rr(c,cx-6,y+25,12,4,2,C.wd,C.ol);c.fillStyle=C.wdD;c.fillRect(cx-1.5,y+18,3,8);f2rr(c,cx-4,y+16,8,3,1,C.wd,C.ol);f2rr(c,cx-2.5,y+8,5,9,1,'#fff6e0','#e0d2b0');if(!inHouseL(i,ICON)){c.globalAlpha=.3;circ(c,cx,y+5,6,'#ffd27a');c.globalAlpha=1}c.fillStyle='#ffb347';c.beginPath();c.ellipse(cx+fl*.3,y+5,1.8,3.2,0,0,7);c.fill();circ(c,cx,y+6,1,'#fff3c0');break}
  case'flamp':sh(7);c.fillStyle=C.wdD;c.beginPath();c.ellipse(cx,y+28,6,2,0,0,7);c.fill();c.fillRect(cx-1,y+9,2,19);if(!inHouseL(i,ICON)){c.globalAlpha=.3;circ(c,cx,y+8,9,'#ffe7a8');c.globalAlpha=1}c.fillStyle=C.cr;c.beginPath();c.moveTo(cx-5,y+2);c.lineTo(cx+5,y+2);c.lineTo(cx+8,y+11);c.lineTo(cx-8,y+11);c.closePath();c.fill();c.strokeStyle=C.crD;c.stroke();break;
  case'sink':sh(13);f2rr(c,cx-13,y+12,26,17,2,'#cfc9be',C.stD);c.fillStyle='#b9b2a6';c.fillRect(cx-13,y+12,26,3);f2rr(c,cx-8,y+15,16,7,2,'#8f897f');c.fillStyle='#a9d4ea';c.fillRect(cx-7,y+18,14,3);c.strokeStyle=C.stD;c.strokeRect(cx-10,y+23,20,5);c.fillStyle='#9d968b';c.fillRect(cx-1,y+5,2.5,9);c.fillRect(cx-1,y+5,7,2.2);circ(c,cx+6,y+7,1.2,'#9d968b');break;
  case'tub':sh(10);f2rr(c,cx-10,y+11,20,18,4,C.wd,C.ol);c.fillStyle='#8f97a0';c.fillRect(cx-10,y+14,20,2);c.fillRect(cx-10,y+24,20,2);c.fillStyle='#9fd0ea';c.beginPath();c.ellipse(cx,y+12,9,3,0,0,7);c.fill();c.strokeStyle=C.ol;c.beginPath();c.ellipse(cx,y+12,10,3.5,0,0,7);c.stroke();break;
  case'hedge':{/* 生垣：まるくこんもりした明るい葉のかたまりと、下の茶色い土 */const hu=!ICON&&i!=null&&typeAt(i-W)==='hedge',hd=!ICON&&i!=null&&typeAt(i+W)==='hedge',hl=!ICON&&i!=null&&i%W>0&&typeAt(i-1)==='hedge',hr=!ICON&&i!=null&&i%W<W-1&&typeAt(i+1)==='hedge',h=i||0;
    if(spOK('hedge-atlas')){{const rD=hr&&typeAt(i+1+W)==='hedge',lD=hl&&typeAt(i-1+W)==='hedge',m=(hl?1:0)|(hr?2:0)|(hu?4:0)|(hd?8:0);spTile(c,'hedge-atlas',m,x,y,ICON,null,rD&&lD?18:rD?16:lD?17:m,!hl&&!hr)}break}
    const x0=hl?x-2:x+3.6,x1=hr?x+34:x+28.4,y0=hu?y-4:y+4.6,y1=hd?y+36:y+25.6;
    if(!hd)sh(15);
    if(!hd){const bl=hl?x-1:x+2.5,br=hr?x+33:x+29.5;c.fillStyle='#a07548';rr(c,bl-.6,y+24.2,br-bl+1.2,7,3);c.fillStyle='#b98c5c';rr(c,bl,y+24.2,br-bl,6,2.6)}/* 下の土 */
    const rad=[(hu||hl)?0:6,(hu||hr)?0:6,(hd||hr)?0:6,(hd||hl)?0:6],sc=[],sp=5.0;
    if(!hu)for(let cx=x0+2.5;cx<x1-1.5;cx+=sp)sc.push([cx+(hash(h*3+((cx-x0)|0))-.5)*1.2,y0,3.2+hash(h+cx)*.9]);if(!hd)for(let cx=x0+2.5;cx<x1-1.5;cx+=sp)sc.push([cx+(hash(h*5+((cx-x0)|0))-.5)*1.2,y1,3.2+hash(h+cx*2)*.9]);if(!hl)for(let cy=y0+3;cy<y1-2;cy+=sp)sc.push([x0,cy,3.2+hash(h+cy)*.9]);if(!hr)for(let cy=y0+3;cy<y1-2;cy+=sp)sc.push([x1,cy,3.2+hash(h+cy*3)*.9]);
    const hull=new Path2D();hull.roundRect(x0,y0,x1-x0,y1-y0,rad);for(const[cx,cy,r]of sc){hull.moveTo(cx+r,cy);hull.arc(cx,cy,r,0,7)}
    c.save();c.fillStyle='#4c9231';c.fill(hull);c.save();c.beginPath();c.rect(hl?x:x-6,hu?y:y-8,(hr?x+TS:x+TS+6)-(hl?x:x-6),(hd?y+TS:y+TS+8)-(hu?y:y-8));c.clip();c.strokeStyle='#4c9231';c.lineWidth=1.6;c.stroke(hull);c.restore();/* ふちどり（つながる側には引かない） */
    c.fillStyle='#8ccb48';c.fill(hull);c.clip(hull);
    if(!hu){const g1=c.createLinearGradient(0,y0,0,y0+13);g1.addColorStop(0,'rgba(215,248,105,.6)');g1.addColorStop(1,'rgba(215,248,105,0)');c.fillStyle=g1;c.fillRect(x0-4,y0-4,x1-x0+8,17)}/* 上は明るい黄緑 */
    if(!hd){const g2=c.createLinearGradient(0,y1-14,0,y1);g2.addColorStop(0,'rgba(35,120,55,0)');g2.addColorStop(1,'rgba(35,120,55,.5)');c.fillStyle=g2;c.fillRect(x0-4,y1-14,x1-x0+8,18)}/* 下は濃い緑 */
    const nb=(hu||hd)?7:6;for(let k=0;k<nb;k++){const px=x0+4+hash(h*7+k)*(x1-x0-8),py=y0+4+hash(h*9+k+4)*(y1-y0-8),rx=(k%3===0?4:3)+hash(k+h)*1.2,ry=(k%3===0?2.8:2.2)+hash(k*2+h)*.7,an=hash(k+h*2)*1.2-.3;c.fillStyle='#5aa63a';c.beginPath();c.ellipse(px,py,rx+.6,ry+.6,an,0,7);c.fill();c.fillStyle=py<(y0+y1)/2?'#bfe85e':'#9fd652';c.beginPath();c.ellipse(px,py,rx,ry,an,0,7);c.fill()}/* ふちどりのある明るい葉っぱ */
    c.restore();break}
  case'birdbath':sh(8);f2rr(c,cx-6,y+25,12,4,1,C.st,C.stD);f2rr(c,cx-2.5,y+15,5,11,1,C.st,C.stD);c.fillStyle=C.st;c.beginPath();c.ellipse(cx,y+14,11,4.5,0,0,7);c.fill();c.strokeStyle=C.stD;c.stroke();c.fillStyle='#9fd0ea';c.beginPath();c.ellipse(cx,y+13.5,8.5,2.8,0,0,7);c.fill();
    {const hop=Math.max(0,Math.sin(T*2.2+i))*1.5;c.fillStyle='#c8955f';c.beginPath();c.ellipse(cx+8,y+8-hop,3.2,2.4,0,0,7);c.fill();circ(c,cx+10,y+6-hop,1.8,'#c8955f');c.fillStyle='#f4e6cc';c.beginPath();c.ellipse(cx+8,y+9-hop,2,1.2,0,0,7);c.fill();c.fillStyle='#e8a33a';c.fillRect(cx+11.5,y+5.6-hop,1.8,.9)}break;
  case'parasol':sh(13);c.fillStyle=C.wdD;c.fillRect(cx-1,y+6,2,23);c.beginPath();c.ellipse(cx,y+28,4,1.4,0,0,7);c.fill();
    c.fillStyle=C.cr;c.beginPath();c.moveTo(cx-15,y+11);c.quadraticCurveTo(cx,y-4,cx+15,y+11);c.closePath();c.fill();c.strokeStyle=C.crD;c.stroke();c.beginPath();for(const dx of[-8,0,8]){c.moveTo(cx,y+2);c.lineTo(cx+dx,y+11)}c.stroke();break;
  case'noren':{sh(12);c.fillStyle='#7a4f30';c.fillRect(cx-13,y+3,2.5,26);c.fillRect(cx+10.5,y+3,2.5,26);c.fillRect(cx-14,y+2,28,2.5);/* 柱と横木 */
    const sw=ICON?0:Math.sin((now||0)/700+(i||0))*.8;for(let k=0;k<3;k++){const px=cx-10.5+k*7.2;c.fillStyle=k===1?'#2f4f86':'#3a5d99';c.beginPath();c.moveTo(px,y+4.5);c.lineTo(px+6.6,y+4.5);c.lineTo(px+6.6+sw,y+18);c.lineTo(px+sw,y+18);c.closePath();c.fill()}/* 3まいの布 */
    {const mx=cx+sw*.5;c.strokeStyle='#f4ead8';c.lineWidth=1.3;c.beginPath();c.ellipse(mx,y+13.2,5,2.6,0,.15,Math.PI-.15);c.stroke();c.beginPath();for(const dx of[-2.6,0,2.6]){c.moveTo(mx+dx,y+13);c.quadraticCurveTo(mx+dx-1.4,y+10.5,mx+dx,y+9);c.quadraticCurveTo(mx+dx+1.4,y+7.5,mx+dx,y+6)}c.stroke();c.lineWidth=1}/* 湯のしるし（♨） */
    c.strokeStyle='rgba(255,255,255,.55)';c.beginPath();for(const dx of[-6,6]){c.moveTo(cx+dx,y-1);c.quadraticCurveTo(cx+dx+2,y-4,cx+dx,y-7)}c.stroke();break}/* のれん（火山のふもと） */
  case'arch':{for(const sg of[-1,1]){c.fillStyle=C.wdD;c.fillRect(cx+sg*11-1.5,y+8,3,21);}c.lineWidth=5;c.strokeStyle=C.grD;c.beginPath();c.moveTo(cx-11,y+29);c.lineTo(cx-11,y+10);c.quadraticCurveTo(cx,y-6,cx+11,y+10);c.lineTo(cx+11,y+29);c.stroke();c.lineWidth=1;
    for(let k=0;k<14;k++){const t=k/13,px=t<.3?cx-11:t>.7?cx+11:cx-11+(t-.3)/.4*22,py=t<.3?y+29-t/.3*19:t>.7?y+10+(t-.7)/.3*19:y+10-Math.sin((t-.3)/.4*Math.PI)*8;f2leaf(c,px+(k%2?2:-2),py,3,2,k,k%2?C.gr:C.grD);if(k%3===0)f2flower(c,px,py-1,k%2?C.pk:'#fff')}break}
  case'signpost':sh(6);c.fillStyle=C.wdD;c.fillRect(cx-1.5,y+5,3,24);for(const[dy,sg]of[[7,1],[15,-1]]){c.fillStyle=C.wd;c.beginPath();c.moveTo(cx-sg*7,y+dy);c.lineTo(cx+sg*8,y+dy);c.lineTo(cx+sg*11,y+dy+2.5);c.lineTo(cx+sg*8,y+dy+5);c.lineTo(cx-sg*7,y+dy+5);c.closePath();c.fill();c.strokeStyle=C.ol;c.stroke()}break;
  case'slide':sh(14);c.fillStyle=C.wdD;for(const dx of[-12,-4])c.fillRect(cx+dx,y+8,2.5,21);f2rr(c,cx-13,y+7,11,4,1,C.wd,C.ol);c.fillStyle=C.wd;for(let k=0;k<4;k++)c.fillRect(cx-11,y+13+k*4,6,1.5);
    c.fillStyle='#e88a7a';c.beginPath();c.moveTo(cx-3,y+8);c.lineTo(cx+2,y+8);c.quadraticCurveTo(cx+8,y+22,cx+15,y+27);c.lineTo(cx+15,y+30);c.lineTo(cx+10,y+30);c.quadraticCurveTo(cx+3,y+24,cx-3,y+12);c.closePath();c.fill();c.strokeStyle='#c56a5c';c.stroke();break;
  case'sandbox':{const k=ICON?1:2,sx=cx;/* 2×1マスいっぱいに描く */c.save();c.translate(sx,y);c.scale(k,1);c.translate(-sx,-y);shadow(c,sx,y+29,15,3);f2rr(c,sx-15,y+8,30,21,2,C.wd,C.ol);c.fillStyle='#f1dca8';c.fillRect(sx-13,y+11,26,15);c.fillStyle='#e6c98a';c.beginPath();c.moveTo(sx-4,y+24);c.quadraticCurveTo(sx,y+13,sx+5,y+24);c.fill();c.restore();c.strokeStyle='#4f86b5';c.lineWidth=1.6;c.beginPath();c.moveTo(sx+12,y+15);c.lineTo(sx+16,y+22);c.stroke();c.lineWidth=1;c.fillStyle='#4f86b5';c.beginPath();c.ellipse(sx+16.5,y+23,2,1.4,.6,0,7);c.fill();break}
  case'seesaw':{const a=c._neutral?0:i!=null&&S&&!ICON?ssAng(i,now||0):Math.sin(T*1.6)*.12;if(c._part!=='part'){sh(14);c.fillStyle='#8f97a0';c.beginPath();c.moveTo(cx-4,y+28);c.lineTo(cx,y+20);c.lineTo(cx+4,y+28);c.closePath();c.fill()}if(c._part!=='base'){c.save();c.translate(cx,y+20);c.rotate(a);f2rr(c,-15,-2.5,30,4.5,1.5,C.wd,C.ol);c.fillStyle='#5f8fc0';for(const sg of[-1,1]){c.fillRect(sg*10-1,-8,2,6);c.fillRect(sg*10-3,-8,6,1.6)}c.restore()}break}/* _part：ドット絵を作るとき、台（base）と板（part）を分けて描く */
  }}
/* 窓：横の木の壁にはめる */
function wallArt(c,p,x,y,i,now){const ch=chipOf(p);if(!(ch&&drawChip(c,ch,p,x,y,now,i)))drawF2(c,p,x,y,i,now)}/* 壁にかけた物：ドット絵があればそれを、なければ線でかく */
const WALLD=new Set(['yonaka','window','paint1','paint2','paint3','curtain1','curtain2','wshelf','wreath']);/* 壁・リースをかけるもの */
function winCovered(qx,qy){for(let dy=1;dy<=3;dy++)for(let dx=-1;dx<=1;dx++){const X=qx+dx,Y=qy+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const o=S.obj[Y*W+X];if(o&&!FLAT.has(o)&&!HOME_WALLS.has(o)&&!HOME_DOORS.has(o)&&!FENCE_IDS.has(o)&&BL[o]&&BL[o].kind!=='plant')return true}return false}
function drawWin(c,i,x,y){const C=window.CHIPS,wk='window',wt=i!=null&&!ICON&&S&&S.obj[i],wc=C&&((wt&&C[wt+'.'+wk])||C[wk]);if(wc&&drawChip(c,wc,wk,x,y,0,i))return;/* 窓のわくの木は、窓をつけた壁の色の絵（<壁>.window） *//* 窓のチップ（大きさはチップそのもの。ゲームの中では拡大しない） */c.save();c.translate(x+16,y+3);c.scale(1.125,1.125);c.translate(-x-16,-y-9);drawWin0(c,i,x,y);c.restore()}
function drawWin0(c,i,x,y){const wa=HOUSEART&&HOUSEART['wall-window'];if(wa&&wa.complete&&wa.naturalWidth){c.drawImage(wa,x+5,y+9,22,19.3);return}/* 窓は、壁のまん中に小さめに */c.fillStyle='rgba(68,43,28,.28)';rr(c,x+5,y+10,22,16,2.5);c.fillStyle='#70482e';rr(c,x+6,y+8,20,16,2.5);c.fillStyle='#d3a06c';rr(c,x+7.5,y+9.5,17,12.5,1.4);c.fillStyle='#a9d7e8';rr(c,x+9,y+11,14,9.5,1);c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.moveTo(x+10,y+12);c.lineTo(x+15,y+12);c.lineTo(x+11,y+17);c.lineTo(x+9.5,y+17);c.closePath();c.fill();c.fillStyle='#795033';rr(c,x+15.5,y+10.5,1.6,10.5,.7);rr(c,x+8.5,y+15.4,15,1.5,.7);c.fillStyle='#d8aa71';rr(c,x+5,y+21,22,3,1.4);c.fillStyle='#f0d3a3';rr(c,x+6,y+21,20,1,0.5)}

// 送ってもらった家づくりパーツ画像から切り出した質感を、壁・扉・窓に使用。
const HOUSEART={};for(const k of ['wall-log','post-log','wall-plaster','post-plaster','wall-brick','post-brick','gate-stone-left','gate-stone-right','post-stone','wall-door','wall-window','wall-wood','floor-wood','floor-brick','floor-stone','floor-wood-render','floor-brick-render','floor-stone-render','hedge-atlas','wall-window-lit']){const im=new Image();im.src='assets/'+k+'.png?v=102';im.onload=()=>artLoaded();HOUSEART[k]=im}

/* 苔の石垣は横面・縦面・柱を別々に継ぐ。画像全体を回転・反転しない。 */
function drawMossGate(c,x,y,i,ver,op){
  const p=HOUSEART['post-stone'],a=HOUSEART['gate-stone-left'],b=HOUSEART['gate-stone-right'];
  if(!p||!p.complete||!p.naturalWidth||!a||!a.complete||!a.naturalWidth||!b||!b.complete||!b.naturalWidth)return false;
  c.save();c.beginPath();c.rect(x,y,32,32);c.clip();const w=10*(1-op*.91);
  if(!ver){c.drawImage(a,x+6,y+5,w,25);c.drawImage(b,x+26-w,y+5,w,25);c.drawImage(p,x-2,y-2,8,33);c.drawImage(p,x+26,y-2,8,33)}
  else{c.drawImage(p,x+8,y-3,16,13);c.drawImage(p,x+8,y+24,16,13);const h=7*(1-op*.91);c.drawImage(a,x+8,y+10,16,h);c.drawImage(b,x+8,y+24-h,16,h)}/* たてむきも、両はしの柱のあいだにとびら */
  c.restore();return true;
}

const WALLMAT={plasterwall:'plaster',logwall:'log',brickwall:'brick',yozorawall:'night'};
function wallBand(c,mat,a,b,x,y,i){/* 壁の正面（1マスの高さ：y〜y+28が板、その下が巾木）。世界の座標で模様をつなぐので、マスのさかいめに継ぎ目が出ない */
  if(b<=a)return;const gx=(i!=null&&!ICON?(i%W)*TS:0)-x,FH=28.4;
  if(!c._noSh){c.fillStyle='rgba(0,0,0,.18)';c.fillRect(a,y+TS,b-a,2)}c.save();c.beginPath();c.rect(a,y,b-a,FH);c.clip();
  if(mat==='night'&&window.CHIPS&&CHIPS['yozorawall:band']&&(()=>{const ch=CHIPS['yozorawall:band'],ims=chipImgs(ch,'yozorawall:band'),im=ims[0];if(!im||!im.ok)return false;const pw=ch.w*FH/ch.h;let wx=Math.floor((a+gx)/pw)*pw;for(;wx<b+gx;wx+=pw)c.drawImage(im,wx-gx,y,pw,FH);return true})()){}/* よぞらの壁：もらった絵の帯をならべる */
  else if(mat==='night'){c.fillStyle='#283063';c.fillRect(a,y,b-a,FH);c.fillStyle='#1e2550';c.fillRect(a,y+FH-3,b-a,3);for(let n=Math.floor((a+gx)/7)-1;n*7<b+gx;n++){const k=hash(n*13+7);if(k<.5)continue;c.fillStyle=k>.85?'#fff3b8':'rgba(220,230,255,.8)';c.fillRect(n*7+hash(n*5)*5-gx,y+3+hash(n*29)*20,k>.85?1.6:1,k>.85?1.6:1)}}/* よぞらの壁（仮の絵）：夜空の色に星 */
  else if(mat==='plaster'){c.fillStyle='#efdfc1';c.fillRect(a,y,b-a,FH);c.fillStyle='rgba(120,84,50,.16)';c.fillRect(a,y,b-a,1.6);c.fillStyle='#f8edd4';c.fillRect(a,y+1.6,b-a,1.6);c.fillStyle='#d7c3a0';c.fillRect(a,y+FH-3,b-a,3);
    for(let n=Math.floor((a+gx)/8)-1;n*8<b+gx;n++){const k=hash(n*17+5);if(k<.45)continue;c.fillStyle=k>.75?'rgba(198,173,137,.28)':'rgba(255,250,232,.6)';c.beginPath();c.ellipse(n*8+hash(n*3)*6-gx,y+6+hash(n*31)*16,1.2+hash(n+7)*.8,.7,0,0,7);c.fill()}}
  else if(mat==='wood'){const art=HOUSEART['wall-wood'];if(art&&art.complete&&art.naturalWidth){const k=art.naturalHeight/FH,sw=art.naturalWidth-8,pw=sw/k;let wx=Math.floor((a+gx)/pw)*pw;for(;wx<b+gx;wx+=pw)c.drawImage(art,4,0,sw,art.naturalHeight,wx-gx,y,pw,FH)}else{c.fillStyle='#c6905f';c.fillRect(a,y,b-a,FH)}}
  else if(mat==='log'){const rh=FH/6;c.fillStyle='#a87650';c.fillRect(a,y,b-a,FH);for(let r=0;r<6;r++){const yy=y+r*rh;c.fillStyle='#c6905f';c.fillRect(a,yy+.6,b-a,rh-1.2);c.fillStyle='#e2ad7e';c.fillRect(a,yy+.6,b-a,.8);c.fillStyle='rgba(120,76,46,.35)';c.fillRect(a,yy+rh-1,b-a,.6);
      for(let n=Math.floor((a+gx)/13)-1;n*13<b+gx;n++)if(hash(n*7+r*13+3)>.55){c.fillStyle='rgba(150,98,62,.7)';c.fillRect(n*13+2+hash(n*3+r)*6-gx,yy+rh/2-.4,3.2,.9)}}}
  else{const rh=FH/6;c.fillStyle='#eccaad';c.fillRect(a,y,b-a,FH);for(let r=0;r<6;r++){const yy=y+r*rh+.5,off=r%2?6:0;for(let n=Math.floor((a+gx-off)/12)-1;n*12+off<b+gx;n++){const bx=n*12+off-gx;c.fillStyle=hash(n*5+r*11)>.7?'#ae6b56':'#b8725b';c.fillRect(bx+.5,yy,11,rh-1);c.fillStyle='rgba(255,205,170,.35)';c.fillRect(bx+1,yy+.3,10,.6);c.fillStyle='rgba(90,40,28,.25)';c.fillRect(bx+.5,yy+rh-1.6,11,.6)}}}
  c.restore();const nt=mat==='night';c.fillStyle=nt?'#522d1d':'#8a5e3c';c.fillRect(a,y+FH,b-a,TS-FH);c.fillStyle=nt?'#86552f':'#a8784e';c.fillRect(a,y+FH,b-a,.9);/* 巾木：よぞらの壁は、よぞらのベッドと同じ木の色 */c.fillStyle='rgba(0,0,0,.2)';c.fillRect(a,y+TS-.8,b-a,.8)}
function wallFront(c,id,x,y,i){/* 家の壁の正面：断面と形は部品の絵（drawConn）。正面は、もらった絵（正面 id:ext を世界の座標でならべる・柱 id:post）をかさねる。よぞらの壁は、家の中から見える正面だけ夜空の帯と巾木。木の壁の正面と同じ所（角は、はしまで） */
  if(i==null||ICON)return;const C=window.CHIPS,E=C&&C[id+':ext'],P=C&&C[id+':post'],ei=E&&chipImgs(E,id)[0],pi=P&&chipImgs(P,id)[0];
  const inn=id==='yozorawall'&&HOUSES.some(h=>h.inside.has(i+W)||h.inside.has(i+W-1)||h.inside.has(i+W+1));
  const isW=k=>{const t=typeAt(k);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))},L=isW(i-1),R=isW(i+1),U=isW(i-W),D=isW(i+W),hasH=L||R||!(U||D);
  const gx=(i%W)*TS-x,eh=E?E.h/2:TS,ey=y+(E?E.ay/2:0),ext=(a,b,cb)=>{if(!ei||!ei.ok)return;const pw=E.w*eh/E.h;c.save();c.beginPath();c.rect(a,ey,b-a,(cb||ey+eh)-ey);c.clip();for(let wx=Math.floor((a+gx)/pw)*pw;wx<b+gx;wx+=pw)c.drawImage(ei,wx-gx,ey,pw,eh);c.restore()};/* 外から見える正面：絵（てっぺんから正面の下まで。y−9〜y+32）を世界の座標でならべる */
  const post=()=>{if(pi&&pi.ok)c.drawImage(pi,x+P.ax/2,y+P.ay/2,P.w/2,P.h/2)};/* 柱の正面 */
  const o=.5,f=(a,b)=>{if(inn){ext(a,b,y);wallBand(c,'night',a,b,x,y,i)}else ext(a,b)};/* 家の中から見える正面：てっぺんだけ絵、その下は夜空の帯 */c._noSh=1;
  if(hasH){if(!D){if(L&&R)f(x-o,x+TS+o);else{post();if(L)f(x-o,x+5);if(R)f(x+27,x+TS+o)}}/* 上にしきりの壁がつながっていても、正面は柱を立てずにつなげる（しきりは正面から見えない） */else{if(L)f(x-o,x+5);if(R)f(x+27,x+TS+o)}}else if(!D)post();
  c._noSh=0}/* となりの壁に0.5だけ重ねて描く（拡大したとき、マスのさかいめにすきまの線が出ないように） */
function stoneFront(c,x,y,i){/* 石の塀（石垣）の正面：もらった絵（正面 wall:ext を世界の座標でならべる・柱 wall:post）を、部品の絵にかさねる */
  if(i==null||ICON)return;const C=window.CHIPS,E=C&&C['wall:ext'],P=C&&C['wall:post'],ei=E&&chipImgs(E,'wall')[0],pi=P&&chipImgs(P,'wall')[0];if(!ei||!ei.ok)return;
  const f=k=>{const o=typeAt(k);return o==='wall'||o==='stonegate'},sd=k=>typeAt(k)==='sdoor',L=f(i-1),R=f(i+1),U=f(i-W),D=f(i+W),dl=sd(i-1),dr=sd(i+1),hasH=L||R||dl||dr||!(U||D);if(!hasH)return;
  const gx=(i%W)*TS-x,eh=E.h/2,ey=y+E.ay/2,pw=E.w*eh/E.h,o=.5,ext=(a,b)=>{c.save();c.beginPath();c.rect(a,ey,b-a,eh);c.clip();for(let wx=Math.floor((a+gx)/pw)*pw;wx<b+gx;wx+=pw)c.drawImage(ei,wx-gx,ey,pw,eh);c.restore()};
  const post=cx=>{if(pi&&pi.ok)c.drawImage(pi,cx-P.w/4,y+P.ay/2,P.w/2,P.h/2)};
  if((L||dl)&&(R||dr)&&!U&&!D)ext(x-o,x+TS+o);else{if(L||dl)ext(x-o,x+16);if(R||dr)ext(x+16,x+TS+o)}
  const V=U||D;if(dl&&!V)post(x+P.w/4);if(dr&&!V)post(x+TS-P.w/4);if(V||!dl&&!dr&&!(L&&R))post(x+16);/* 石の塀のドアのとなりは、塀をドアのふちまでのばして、柱をドアにつける（角の柱があるマスは、角の柱からドアまで塀でつなぐ） */
  if(D){if(L||R||dl||dr){const a=x+16-P.w/4,b=x+16+P.w/4;c.save();c.beginPath();c.rect(a,y+12,b-a,ey+eh-y-12);c.clip();ext(a,b);c.restore()}/* 角の柱は、かさの下に横の塀の正面をのばす（もらった絵の角と同じ） */const V=C['wall:vtop'];if(V)drawChip(c,V,'wall',x,y,0,i)}}/* 下へ塀がつづく柱は、柱の正面の上に、たての塀の上面をかさねる（柱のかさの下から） */
const SEC={a:null,b:null,cache:new Map()};
function drawSection(c,ox,oy,rs){/* 断面（壁・柱のてっぺん）：形のまわりだけ少し濃く、内がわは少し薄く。つながる側へはみ出した分で、マスのさかいめにも線が出ない。形ごとに1回だけ絵にして使いまわす */
  const W0=TS+16,H0=TS+40,X=ox-8,Y=oy-8,key=rs.map(r=>r.map((v,k)=>Math.round((v-(k%2?oy:ox))*100)).join(',')).join('|');let sp=SEC.cache.get(key);
  if(!sp){if(!SEC.a){SEC.a=document.createElement('canvas');SEC.b=document.createElement('canvas');SEC.a.width=SEC.b.width=W0;SEC.a.height=SEC.b.height=H0}
    const m=SEC.a.getContext('2d'),t=SEC.b.getContext('2d');m.clearRect(0,0,W0,H0);m.fillStyle='#000';for(const r of rs)m.fillRect(r[0]-ox+8,r[1]-oy+8,r[2]-r[0],r[3]-r[1]);
    sp=document.createElement('canvas');sp.width=W0;sp.height=H0;const o=sp.getContext('2d');
    const put=(col,erode)=>{t.globalCompositeOperation='source-over';t.clearRect(0,0,W0,H0);t.drawImage(SEC.a,0,0);if(erode){t.globalCompositeOperation='destination-in';for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])t.drawImage(SEC.a,dx,dy)}t.globalCompositeOperation='source-in';t.fillStyle=col;t.fillRect(0,0,W0,H0);t.globalCompositeOperation='source-over';o.save();o.beginPath();for(const r of rs)o.rect(r[4]-ox+8,r[5]-oy+8,r[6]-r[4],r[7]-r[5]);o.clip();o.drawImage(SEC.b,0,0);o.restore()};
    put('#7f5c3d',false);put('#a77f5a',true);SEC.cache.set(key,sp)}
  c.drawImage(sp,X,Y)}
/* ドット絵（chips.js）：ある物は、プログラムの絵のかわりにこれを使う。1ドット＝ゲームの1（ぼかさない） */
function chipOf(id,i,rot,sf=''){const C=window.CHIPS;if(!C)return null;const L=(id==='watch'||id==='yogan')&&i!=null&&S&&S.hp?(S.hp['L'+i]||1):1;let ch=C[(L>1?id+'@'+L:id)+sf]||C[id+sf]||null;
  const t=ROTS[id];if(!t||t===5)return ch;const r=rot!=null?rot:i==null||!S?0:RUGS.has(id)&&S.rug&&S.rug[i]===id&&S.obj[i]!==id?((S.rugRot||{})[i]||0):S.obj[i]===id?rotAt(i):0;if(!r)return ch;
  let fl=false;if(t===1)fl=true;else if(C[id+'>'+r+sf])ch=C[id+'>'+r+sf];else if(t===4&&r===3&&C[id+'>1'+sf]){ch=C[id+'>1'+sf];fl=true}else if(sf)return null;/* sf='.front'：せいれいの手前に重ねる絵 */
  if(!ch||!fl)return ch;const fw=((szR(id,r)||[1,1])[0])*32;return ch._fl&&ch._fl.fw===fw?ch._fl:(ch._fl={src:ch,ax:ch.ax,ay:ch.ay,w:ch.w,h:ch.h,f:ch.f,flip:1,fw})}/* 向きのある家具は「id>向き」の絵。左向きは右向きの反転。左右反転だけの物は、もとの絵を反転 */
const CHA={};function chipPage(n){/* マップチップのアトラス（大きな絵）。1まいごとに1回だけ読みこむ */let a=CHA[n];if(!a){a=CHA[n]={im:new Image(),ok:false,q:[]};a.im.onload=()=>{a.ok=true;const q=a.q;a.q=[];for(const f of q)f();dirty=true};a.im.src=(window.CHIPA||[])[n]}return a}
function atlasFrame(r,id){/* アトラスの (x,y,w,h) を、1まいの絵（キャンバス）に切り出す。読みこむまでは ok=0 */const[n,x,y,w,h]=r,c=document.createElement('canvas');c.width=w;c.height=h;c.ok=0;const a=chipPage(n),done=()=>{c.getContext('2d').drawImage(a.im,x,y,w,h,0,0,w,h);c.ok=1;try{delete iconCache[id]}catch(e){}};if(a.ok)done();else a.q.push(done);return c}
function chipImgs(ch,id){if(!ch._im)ch._im=ch.f.map(r=>atlasFrame(r,id));return ch._im}
const PARTMV={/* 動く部品の動き：rot＝回る角度、sx・sy＝のびちぢみ（どれも支点のまわり） */
  swing:(i,now)=>{if(ICON)return{sx:1,sy:.5};/* アイコンでは、つなを短くして座面を見やすく */const d=i!=null&&S&&toyUsers(i).length?swAng(i,now):0;return{sx:1+d*.12,sy:1+d*.3}},
  seesaw:(i,now)=>({rot:!ICON&&i!=null&&S?ssAng(i,now||0):0}),
  windmill:(i,now)=>({rot:ICON?0:(now||performance.now())/1000*.9}),
  vane:(i,now)=>({sx:ICON?1:Math.cos(Math.sin((now||performance.now())/1300+(i||0))*.6)})};
function partImg(p,id){if(!p._im)p._im=atlasFrame(p.f[0],id);return p._im}
function drawChip(c,ch,id,x,y,now,i){const src=ch.src||ch,g64=src.g===64,ims=chipImgs(src,id),n=ims.length,im=ims[n>1?Math.floor((now||performance.now())/180)%n:0];if(!im.ok)return false;const sm=c.imageSmoothingEnabled,sv=ch.flip||src.parts;c.imageSmoothingEnabled=false;if(sv)c.save();if(ch.flip){c.translate(2*x+ch.fw,0);c.scale(-1,1)}/* 反転は、マスのはばの中で */
  if(g64)c.drawImage(im,x+src.ax/2,y+src.ay/2,src.w/2,src.h/2);else c.drawImage(im,x+src.ax,y+src.ay);/* 1マス64ドットの絵（g:64）は、半分の大きさでかく */
  if(src.parts){const mv=PARTMV[id]?PARTMV[id](i,now):{};for(const p of src.parts){const pm=partImg(p,id);if(!pm.ok)continue;const q=g64?.5:1,px=x+p.px*q,py=y+p.py*q;c.save();c.translate(px,py);if(mv.rot)c.rotate(mv.rot);if(mv.sx!=null||mv.sy!=null)c.scale(mv.sx??1,mv.sy??1);c.translate(-px,-py);c.drawImage(pm,x+p.ax*q,y+p.ay*q,p.w*q,p.h*q);c.restore()}}/* 動く部品は、支点のまわりで動かして重ねる */
  if(sv)c.restore();c.imageSmoothingEnabled=sm;return true}
if(window.CHIPS)for(const k in window.CHIPS){const ch=window.CHIPS[k],id=k.split(/[@>:]/)[0];chipImgs(ch,id);for(const p of ch.parts||[])partImg(p,id)}/* 動く部品（ブランコの座面など）も *//* はじめに読みこんでおく */
const CONN={fence:'f',logfence:'f',bamboofence:'f',wall:'w',hwall:'h',logwall:'h',plasterwall:'h',brickwall:'h',yozorawall:'h'},CONNR={'fence':'HV','logfence':'HV','bamboofence':'VH','wall':'HV','hwall':'HV','logwall':'HV','plasterwall':'HV','brickwall':'HV'};/* つながる物：横の部品（H0 柱・HL・HR・HLR 横板）と縦の部品（VU・VD・VUD 縦板）を、となりのつながりで組み合わせる。CONNR：角で横と縦を重ねる順 */
function connMask(id,i){if(ICON)return 3;/* アイコンは、左右につながった形で見せる */if(i==null||!S)return 0;const t=CONN[id];let f;if(t==='f')f=k=>FENCE_IDS.has(typeAt(k));else if(t==='w')f=k=>{const o=typeAt(k);return o==='wall'||o==='stonegate'};else f=(k,v)=>{const o=typeAt(k);return o!=='wall'&&o!=='sdoor'&&(HOME_WALLS.has(o)||!v&&HOME_DOORS.has(o))};/* 上下のドア（たて置きのドア）とはつながらない：ドアの上下の壁には、はしの柱を立てる */return (f(i-1)?1:0)|(f(i+1)?2:0)|(f(i-W,1)?4:0)|(f(i+W,1)?8:0)}/* 石の塀は、石の塀のドアのとなりでは終わる */
const FRAIL={fence:9.9,logfence:13.5,bamboofence:15.5};/* 柵の上の横木のてっぺん（マスの上から。たての帯をここから柱にかぶせる） */
function drawConn(c,id,x,y,i,now){const C=window.CHIPS;if(!C)return false;const inn=!ICON&&i!=null&&HOME_WALLS.has(id)&&HOUSES.some(h=>h.inside.has(i+W)||h.inside.has(i+W-1)||h.inside.has(i+W+1)),K=k=>(inn&&C[k+'~in'])||C[k]/* 下かななめ下が家の中なら、かげのうすい絵（家の角も） */,m=connMask(id,i),hm=m&3,vm=m&12,H=K(id+':'+['H0','HL','HR','HLR'][hm]),V=vm?K(id+':'+{4:'VU',8:'VD',12:'VUD'}[vm]):null;if(!H||vm&&!V)return false;
  if(id==='wall'&&!vm&&!ICON){const dl=!(hm&1)&&typeAt(i-1)==='sdoor',dr=!(hm&2)&&typeAt(i+1)==='sdoor';if(dl||dr){const H2=C['wall:'+['H0','HL','HR','HLR'][hm|(dl?1:0)|(dr?2:0)]];if(!H2||!drawChip(c,H2,id,x,y,now,i))return false;return true}}/* となりが石の塀のドア：塀はマスのはしまでのばす（ドアにつける柱は stoneFront でかく） */
  if(vm&4&&CONN[id]==='f'&&!ICON&&!(connMask(id,i-W)&4)){/* たての柵：上のマスがはしの柱なら、横木は柱の前を通るので、帯を柱の上の横木のてっぺん（FRAIL）から柱にかぶせて、そこに区切り線 */const V4=C[id+':'+(vm===12?'VUD':'VU')],t=y-32+FRAIL[id];const ok=hm?(drawChip(c,H,id,x,y,now,i),drawChip(c,V4,id,x,y,now,i)):drawChip(c,V4,id,x,y,now,i);if(ok){c.save();c.beginPath();c.rect(x-64,t,192,y-t);c.clip();const Vs=C[id+':VUD']||V4;drawChip(c,Vs,id,x,y-32,now,i);c.restore();c.fillStyle='rgba(70,45,25,.55)';c.fillRect(x+Vs.ax/2,t,Vs.w/2,1)}return ok}
  if(!vm)return drawChip(c,H,id,x,y,now,i);if(hm&&C[id+':m'+m])return drawChip(c,K(id+':m'+m),id,x,y,now,i);/* 角・つなぎ目の絵があれば、部品を重ねずにそれを使う */if(!hm)return drawChip(c,V,id,x,y,now,i);const r=CONNR[id]||'HV';
  if(r==='VH'){if(!drawChip(c,V,id,x,y,now,i))return false;return drawChip(c,H,id,x,y,now,i)}
  if(!drawChip(c,H,id,x,y,now,i))return false;if(r==='Hclip'){c.save();c.beginPath();if(vm&4)c.rect(x-64,y-64,192,66);if(vm&8)c.rect(x-64,y+26,192,96);c.clip();drawChip(c,V,id,x,y,now,i);c.restore();return true}return drawChip(c,V,id,x,y,now,i)}
function berryOn(c,x,y){const bi=emoImg('🫐');if(!bi)return;for(const[cx,cy]of[[7,13.5],[25,19.5]]){const iw=14,ih=iw*bi.height/bi.width;c.drawImage(bi,x+cx-iw/2,y+cy-ih/2,iw,ih)}}/* 実ったベリーの茂み：運ぶときと同じベリーの絵を2つ、前の青い実と同じ位置・大きさ（はば14）にのせる */
const PCH=new Set(['tree','ntree','fruit','deadtree','berry','clover','bellf','salvia','lily','lotus','statue','volcano','hedge']);/* 植物などは、ようすで絵をえらぶ */
function plantChip(id,i,g){const C=window.CHIPS;if(!C)return null;if(!ICON&&i!=null&&S&&PLANTS.includes(id)&&isBud(i))return C.bud||null;/* 芽 */
  if(id==='fruit'&&g>=100)return C[id+'#mi']||null;/* 実った絵（ベリーは、茂みの上に、運ぶときと同じベリーをのせる） */
  if(id==='hedge'){if(ICON||i==null||!S)return C.hedge||null;const t=k=>typeAt(k)==='hedge',hl=i%W>0&&t(i-1),hr=i%W<W-1&&t(i+1),m=(hl?1:0)|(hr?2:0)|(t(i-W)?4:0)|(t(i+W)?8:0);if(m&8)return C['hedge:'+m]||null;
    const rD=hr&&t(i+1+W),lD=hl&&t(i-1+W),fi=rD&&lD?18:rD?16:lD?17:m;return C['hedge:'+m+(fi!==m?'/'+fi:'')]||null}/* 生け垣は、となりとのつながりの形で */
  return C[id]||null}
function drawFarmChip(c,x,y,i,g,now){const C=window.CHIPS;if(!C)return false;if(ICON||i==null||!S){const ch=C.farm;return !!ch&&drawChip(c,ch,'farm',x,y,now,i)}
  const n=k=>S.obj[k]==='farm',gx=i%W,gy=(i/W)|0,m=(gx>0&&n(i-1)?1:0)|(gx<W-1&&n(i+1)?2:0)|(gy>0&&n(i-W)?4:0)|(gy<H-1&&n(i+W)?8:0),d=S.dyn[i],wet=!!d&&d.wet>0,base=C[(wet?'farmw:':'farm:')+m];
  if(!base||!chipImgs(base,'farm')[0].ok)return false;drawChip(c,base,'farm',x,y,now,i);/* 畑の土：となりの畑とのつながり・ぬれているか */
  const ov=k=>{const ch=(wet&&C[k+'w'])||C[k];if(ch)drawChip(c,ch,'farm',x,y,now,i)};/* ぬれている畑は、土がぬれた絵（<k>w） */
  if(d&&d.crop&&d.sown===false)ov(wet?'farm.moundw':'farm.mound');/* たねをえらんだ畑は、土がこんもり */
  if(d&&d.sown!==false&&!(g>0))ov('farm.sprout');/* 植え付けたら、土のもりあがりに小さい芽（育ちはじめたら作物の絵だけ） */
  if(g>0){const k=(d&&d.crop)||'mugi',st=g>=100?3:g>=60?2:1;ov(C['crop:'+k+st]?'crop:'+k+st:'crop:mugi'+st)}/* 作物：育ちぐあい3だん（土のもりあがりごと） */
  if(d&&d.sown!==false){if(g<100&&!workOn(i)){c.fillStyle='rgba(30,20,10,.45)';rr(c,x+4,y+TS-5,TS-8,4,2);c.fillStyle='#8fe06a';if(g>0)rr(c,x+4,y+TS-5,(TS-8)*g/100,4,2)}
    else{const tw=Math.sin((now||0)/300+i)*.5+.5;c.fillStyle='rgba(255,245,170,'+(.5+tw*.5)+')';const sx=x+TS-6,sy=y+5,r=2+tw*1.5;c.fillRect(sx-r,sy-.6,r*2,1.2);c.fillRect(sx-.6,sy-r,1.2,r*2)}}/* 育つまでのバーと、とれごろのきらきら */
  return true}
const DOORCH=new Set(['door','yozoradoor','gate','archedgate','stonegate','sdoor']);/* ドア・門は、開きぐあいで絵をえらぶ */
function drawDoorChip(c,id,x,y,i,now){const C=window.CHIPS;if(!C)return false;
  if(ICON||i==null||!S){const ch=C[id];return !!ch&&drawChip(c,ch,id,x,y,now,i)}
  const pick=(o,op)=>C[id+'#'+o+Math.min(3,Math.round(op*3))],ok=o=>{const ch=C[id+'#'+o+'0'];return !!ch&&chipImgs(ch,id)[0].ok};
  if(id==='door'||id==='yozoradoor'){const isW=k=>{const t=typeAt(k);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))},L=isW(i-1),R=isW(i+1),U=isW(i-W),D=isW(i+W),hasV=U||D,hasH=L||R||!hasV;
    const wt=(hasH?[i-1,i+1,i-W,i+W]:[i-W,i+W,i-1,i+1]).map(typeAt).find(t=>t!=='wall'&&HOME_WALLS.has(t));/* 断面の色は、となりの壁に合わせる：よこ置きは左→右、たて置きは上→下 */
    if(c._doorBack){if(!hasH)return true;const m=(L?1:0)|(R?2:0)|(U?4:0)|(D?8:0),ch=(wt&&C[wt+'.'+id+':'+m])||C[id+':'+m];return !!ch&&drawChip(c,ch,id,x,y,now,i)}/* ドアの上の断面（静的な層） */
    const o=hasH?'h':'v';if(!ok(o))return false;const op=hasH?doorOp(i,x,y,.9,2.1):doorOp(i,x,y,2.1,.9),n=Math.min(3,Math.round(op*3));const sx=o==='h'&&HOUSES.some(h=>h.inside.has(i+W))?'~in':'';return drawChip(c,(wt&&(C[wt+'.'+id+'#'+o+n+sx]||C[wt+'.'+id+'#'+o+n]))||C[id+'#'+o+n+sx]||pick(o,op),id,x,y,now,i)}/* ドアの枠（よこ置き）・たて置きの断面も、となりの壁ごとの絵 */
  if(id==='stonegate'){const wide=S.obj[i]!==id||(S.obj[i+1]==='part'&&S.ref[i+1]===i);if(!wide||!ok('h'))return false;return drawChip(c,pick('h',doorOp(i,x+16,y,1.8,2.1)),id,x,y,now,i)}/* 石の大門は2マスはば */
  const isF=k=>{const t=typeAt(k);return FENCE_IDS.has(t)||t==='wall'||t==='sdoor'},ver=!(isF(i-1)||isF(i+1))&&(isF(i-W)||isF(i+W)),o=ver?'v':'h';if(!ok(o))return false;
  return drawChip(c,pick(o,doorOp(i,x,y,ver?2.1:.9,ver?.9:2.1)),id,x,y,now,i)}
function drawRoofItem(c,id,x,y){/* ガゼボ・東屋：2×2マス（左上が x,y）。絵（チップ）があれば、それを使う（うしろの柱 <id>:back は、べつの段でかく） */const ch=window.CHIPS&&CHIPS[id];if(ch&&drawChip(c,ch,id,x,y,0))return;
  const gz=id==='gazebo',P=gz?['#f4efe6','#d9d0c2']:['#8a5e3c','#6b4528'],R=gz?['#9cc7a3','#7fae88','#c9e3cc']:['#7d8590','#646b75','#a3abb5'];
  const post=(px,top,bot)=>{c.fillStyle=P[1];c.fillRect(px-2.5,top,5,bot-top);c.fillStyle=P[0];c.fillRect(px-2.5,top,3,bot-top)};
  post(x+8,y+4,y+34);post(x+56,y+4,y+34);/* おくの柱 */
  c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x+4,y+60,56,3);/* かげ */
  post(x+8,y+10,y+62);post(x+56,y+10,y+62);/* 手前の柱 */
  c.fillStyle=gz?'#efe7da':'#7a5232';c.fillRect(x+4,y+8,56,4);/* はり */
  c.fillStyle=R[1];c.beginPath();c.moveTo(x-2,y+10);c.lineTo(x+66,y+10);c.lineTo(x+52,y-14);c.lineTo(x+12,y-14);c.closePath();c.fill();/* 屋根（手前の面） */
  c.fillStyle=R[0];c.beginPath();c.moveTo(x+12,y-14);c.lineTo(x+52,y-14);c.lineTo(x+40,y-30);c.lineTo(x+24,y-30);c.closePath();c.fill();/* 屋根（上の面） */
  c.fillStyle=R[2];c.fillRect(x-2,y+8,68,2);c.fillRect(x+12,y-15,40,1.5);
  if(gz){c.fillStyle='#efe7da';c.fillRect(x+30,y-38,4,9);c.beginPath();c.arc(x+32,y-39,3,0,7);c.fill()}else{c.fillStyle=R[1];c.fillRect(x+22,y-33,20,4)}}
function drawObj(c,id,x,y,i,g,now){
  if(STAIRS.has(id)){if(ICON||i==null)drawStair(c,id,x,y,0,y+3,y+29);else drawStairObj(c,i);return}/* 階段は、段差といっしょに cliffStrip で描く（ここはアイコンだけ） */
  if(CANOPY.has(id)){if(ICON||i==null){const ch=window.CHIPS&&CHIPS[id],bk=window.CHIPS&&CHIPS[id+':back'];if(bk)drawChip(c,bk,id,x,y,0,i);if(ch&&drawChip(c,ch,id,x,y,0,i))return;c.save();c.translate(x+3,y+11);c.scale(.4,.4);drawRoofItem(c,id,0,0);c.restore()}else drawRoofItem(c,id,x,y);return}/* ガゼボ・東屋（アイコンは小さく） */
  if(id==='yorubed'&&!chipOf('yorubed',i)){drawObj(c,'bed',x,y,i,g,now);const v=i!=null&&S&&S.rot&&S.rot[i]%2===1;c.save();c.globalAlpha=.55;c.fillStyle='#2a3168';if(v)c.fillRect(x+6,y+8,20,-30<0?20:20);else c.fillRect(x+12,y+4,16,22);c.globalAlpha=1;c.fillStyle='#fff3b8';for(let n=0;n<4;n++)c.fillRect(x+(v?8:14)+hash((i||0)+n)*12,y+(v?10:6)+hash((i||0)*3+n)*16,1.5,1.5);c.restore();return}/* よぞらのベッド（仮の絵）：ふつうのベッドに夜空色のふとん */
  if(!c._chip&&id==='farm'&&drawFarmChip(c,x,y,i,g,now))return;/* 畑のドット絵 */
  if(!c._chip&&DOORCH.has(id)&&!(S&&S.win&&i!=null&&S.win[i]&&!c._win)&&drawDoorChip(c,id,x,y,i,now))return;/* ドア・門のドット絵（リースのあるドアは、リースの前にドアだけ） */
  if(CONN[id]&&!c._chip&&!(HOME_WALLS.has(id)&&S&&S.win&&S.win[i]&&!c._win)){const gL=CONN[id]==='f'&&!ICON&&i!=null&&typeAt(i-1)==='gate';if(gL){c.save();c.beginPath();c.rect(x+2.2,y-64,96,160);c.clip()}/* 左が柵のドア：ドアの右の柱（このマスの左はし2.4ドット。すきまが出ないよう2.2から描く）にかぶる板を描かない（横木は柱のふちから） */const ok=drawConn(c,id,x,y,i,now);if(gL)c.restore();if(ok){if(id==='wall')stoneFront(c,x,y,i);else if(HOME_WALLS.has(id)&&window.CHIPS[id+':ext'])wallFront(c,id,x,y,i);return}}/* つながる物は部品で（窓のある壁は、窓の前に壁だけ）。家の壁は、先に、となりの床を壁のふちまでのばす */
  if(!c._chip&&PCH.has(id)){const ch=plantChip(id,i,g);if(ch&&drawChip(c,ch,id,x,y,now,i)){if(id==='berry'&&g>=100)berryOn(c,x,y);if(id==='statue'&&i!=null&&!ICON)for(const q of[i-1,i+1])if(S.obj[q]==='obox'||S.obj[q]==='board')drawObj(c,S.obj[q],x+(q-i)*TS,y,q,0,now);/* 女神像の横の箱・ボードを手前に */return}}
  if(!c._chip&&!c._win&&!SEATS.includes(id)&&!PCH.has(id)&&!DOORCH.has(id)&&id!=='farm'){const ch=chipOf(id,i);if(ch&&drawChip(c,ch,id,x,y,now,i))return}/* ドット絵があれば、それを使う（いすは、つりざおをかいてから下で） */
  if(BL[id]&&BL[id].cs&&!ICON&&!c._cs){const k=BL[id].cs;c.save();c.translate(x+16,y+20);c.scale(k,k);c.translate(-x-16,-y-20);c._cs=1;drawObj(c,id,x,y,i,g,now);c._cs=0;c.restore();return}/* ラグは、絵だけ大きく（判定はそのまま） */
  if(!ICON&&i!=null&&S&&PLANTS.includes(id)&&isBud(i)){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+16,y+27,7,2.5,0,0,7);c.fill();c.fillStyle='#6fbf5a';c.fillRect(x+15,y+17,2,10);c.beginPath();c.ellipse(x+11,y+18,5,2.6,-.5,0,7);c.ellipse(x+21,y+18,5,2.6,.5,0,7);c.fill();return}/* 芽 */
  /* 向きをかえた家具は左右反転 */
  if(!ICON&&i!=null&&now!=null&&S&&SEATS.includes(id)){const w=spotW(i);if(w>=0&&!S.res.some(r=>r.act&&r.act.type==='fish'&&r.act.stage!=='walk'&&fishW(r.act.stand)===w)){/* 釣りスポットのうきと釣りざお（釣り中はかくす） */const px=x+(w%W-i%W)*TS+16,py=y+((w/W|0)-(i/W|0))*TS+17,bb=Math.sin(now/450+i)*1.2,vt=w%W===i%W,dx=Math.sign(px-(x+16))||1,dn=vt&&py>y,bx=vt?x+25:x+16+dx*10,by=vt?(dn?y+14:y+12):y+28,tx=vt?px+(dn?9:6):px-dx*4,ty=vt?py-(dn?8:14):py-20;/* 上下の水は竿をたてにのばす */c.save();c.lineCap='round';c.strokeStyle='#6b4a2b';c.lineWidth=2.2;c.beginPath();c.moveTo(bx,by);c.lineTo(tx,ty);c.stroke();c.strokeStyle='#a87a4a';c.lineWidth=1;c.beginPath();c.moveTo(bx+dx*.5,by-1);c.lineTo(tx,ty);c.stroke();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(px,ty+4,px,py+bb-5);c.stroke();c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1;c.beginPath();c.ellipse(px,py+3,7+Math.sin(now/600)*1.5,2.5,0,0,7);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(px,py+bb,3.2,0,7);c.fill();c.fillStyle='#e0533d';c.beginPath();c.arc(px,py+bb,3.2,Math.PI,0);c.fill();c.fillRect(px-.6,py+bb-6,1.2,3);c.restore()}}
  if(!c._chip&&SEATS.includes(id)){const ch=chipOf(id,i);if(ch&&drawChip(c,ch,id,x,y,now,i))return}
  if((HOME_WALLS.has(id)||HOME_DOORS.has(id)&&S&&S.win&&S.win[i]==='wreath')&&!ICON&&!c._win&&S&&S.win&&S.win[i]){c._win=1;drawObj(c,id,x,y,i,g,now);c._win=0;c.save();c.translate(0,-1.5);if(S.win[i]===1)drawWin(c,i,x,y);else{const p=S.win[i];c._onWall=1;try{if(p==='curtain1'||p==='curtain2'){drawWin(c,i,x,y);const ch=chipOf(p);c.save();if(ch){if(!drawChip(c,ch,p,x,y,now,i)){c.translate(x+16,y-3);c.scale(1.35,.7);drawF2(c,p,-16,-3,i,now)}}else{c.translate(x+16,y+3);c.scale(1.07,.7);drawF2(c,p,-16,-3,i,now)}c.restore()}/* カーテンのチップを、窓の上に重ねる（大きさはチップそのもの） */else if(p==='wshelf'){c.save();c.translate(0,4);wallArt(c,p,x,y,i,now);c.restore()}else if(p==='wreath'&&HOME_DOORS.has(id)){const up=HOME_WALLS.has(S.obj[i-W])||HOME_DOORS.has(S.obj[i-W]),dn=HOME_WALLS.has(S.obj[i+W])||HOME_DOORS.has(S.obj[i+W]),lf=HOME_WALLS.has(S.obj[i-1])||HOME_DOORS.has(S.obj[i-1]),rt=HOME_WALLS.has(S.obj[i+1])||HOME_DOORS.has(S.obj[i+1]),vertical=(up||dn)&&!(lf||rt),op=DOOROP.get(i)||0;c.save();if(vertical){c.translate(x+16,y+3.5);c.rotate(op*Math.PI*.45);c.translate(-x-16,-y-3.5)}else{c.translate(x+7,y);c.scale(1-op*.78,1);c.translate(-x-7,-y)}wallArt(c,p,x,y,i,now);c.restore()}else wallArt(c,p,x,y,i,now)}finally{c._onWall=0}}c.restore();return}/* 壁にかけた絵・カーテン（窓つき）・かべ棚・ドアのリース */
  if(BL[id]&&BL[id].f2){const z=BL[id].sz;if(BL[id].dsc&&!ICON&&!c._sc){const k=BL[id].dsc;c.save();c.translate(x+16,y+31);c.scale(k,k);c._sc=1;drawF2(c,id,-16,-31,i,now);c._sc=0;c.restore();return}/* 絵だけ大きく（判定はそのまま） */if(z&&BL[id].nosc&&!ICON)return drawF2(c,id,x+16*(z[0]-1),y+32*(z[1]-1),i,now);/* マスは広いけど絵はそのまま */if(z&&!ICON&&!c._sc){c.save();c.translate(x,y);c.scale(z[0],z[1]);drawF2(c,id,0,0,i,now);c.restore();return}return drawF2(c,id,x,y,i,now)}/* 大きい家具は、マスに合わせて絵も大きく */
  if(id==='stonegate'&&!ICON&&!c._sc){
    const wide=S.obj[i]!==id||(S.obj[i+1]==='part'&&S.ref[i+1]===i),ver=!wide&&(HOME_WALLS.has(typeAt(i-W))||HOME_WALLS.has(typeAt(i+W)));
    const nw=wide?2:1,op=doorOp(i,x+(nw-1)*16,y,nw*.9,2.1);
    c.save();c.translate(x,y);c.scale(nw,1);const drawn=drawMossGate(c,0,0,i,ver,op);c.restore();if(drawn)return
  }
  if(id==='window'){drawObj(c,'hwall',x,y,i,g,now);c.save();c.translate(0,-1.5);drawWin(c,i,x,y);c.restore();return}
  if((BIG.has(id)||BIG2.has(id))&&!ICON&&!c._big){const z=BL[id].sz||[1,1],ax=x+16*z[0],ay=y+31*z[1],k=BIG2.has(id)?2:TREES.has(id)?2.25:(id==='stor'||id==='mbox')?32/26:(BIGK[id]||1.5);/* 箱は幅1マスぴったり */c.save();c.translate(ax,ay);c.scale(k,k);c.translate(-ax,-ay);c._big=1;drawObj(c,id,x+(id==='watch'||id==='yogan'?16:0),y+(id==='watch'||id==='yogan'?31:0),i,g,now);c._big=0;/* 見張り台は2×2マスのまんなかに、今までと同じ大きさで */c.restore();if(id==='statue'&&i!=null)for(const q of[i-1,i+1])if(S.obj[q]==='obox'||S.obj[q]==='board')drawObj(c,S.obj[q],x+(q-i)*TS,y,q,0,now);/* 大きな女神像の横の箱・ボードを手前に */return}
  {const FK={clover:'fl_clover',bellf:'fl_bell',salvia:'fl_salvia',lily:'fl_lily',lotus:'fl_lotus'},key=FK[id]?FK[id]:id==='tree'||id==='ntree'||id==='fruit'?'tree':id==='deadtree'?'dead':id==='rock'?'rock':id==='berry'?'bush':null,a=key&&ART[key];
   if(a&&a.ok){const w=FLOWERS.has(id)?26:id==='rock'?27:id==='deadtree'?22.5:30,h=w*a.h/a.w;if(!FLOWERS.has(id))shadow(c,x+16,y+28.5,w*.4,w*.1);/* 花は影（鉢のように見える）なし */c.drawImage(a.img,x+16-w/2,y+30-h,w,h);
     if(id==='berry'&&g>=100){const bi=emoImg('🫐');for(const[dx,dy]of[[-6,-6],[6,-2]]){if(bi){const ih=11,iw=ih*bi.width/bi.height;c.drawImage(bi,x+16+dx-iw/2,y+24+dy-ih/2,iw,ih)}else{circ(c,x+16+dx,y+24+dy,2.6,'#5b6fd1')}}}/* 実ったら、ベリーのアイコンを2つ */
     if(id==='fruit'&&g>=100){const ai=emoImg('🍎');for(const[dx,dy]of[[-6,9],[6,12],[0,3]]){if(ai){const ih=8,iw=ih*ai.width/ai.height;c.drawImage(ai,x+16+dx-iw/2,y+dy-ih/2,iw,ih)}else circ(c,x+16+dx,y+dy,2.4,'#e0453a')}}/* 果物の木：実がないときはふつうの木。実ったら、りんごのアイコン */
     return}}
  // 罠・伐採場・採石場は絵を使う（罠は使ったあと少しうすくなる）
  if(id==='windmill'&&PSPR.wmBody.ok&&PSPR.wmSail.ok){// 本体の上で羽がまわる（画像の座標系 → 1単位=k px）
    const k=.0548,bx=x+16,by=y+31,T=ICON||c._neutral?0:(now||0)/1000;if(c._part!=='part'){shadow(c,bx,by-2,12,3);c.drawImage(PSPR.wmBody.img,bx+(170-346)*k,by+(150-735)*k,360*k,595*k)}
    if(c._part!=='base'){c.save();c.translate(bx+(343-346)*k,by+(300-735)*k);c.rotate(T*.9);c.drawImage(PSPR.wmSail.img,-312*k,-312*k,624*k,624*k);c.restore()}return}
  if(SPR_OBJ.has(id)&&PSPR[id]&&PSPR[id].ok){const g=PSPR[id],T=now||0,trap=BL[id].trap,rd=!trap||ICON||!(S&&S.trapCd&&S.trapCd[i]>S.t);
    const w=trap?TS:id==='well'?42:48,h=w*g.h/g.w,bob=(id==='firetrap'||id==='gust')&&rd&&!ICON?1+Math.sin(T/180+i)*.04:1;
    shadow(c,x+16,y+28,w*.42,2.4);c.save();if(!rd)c.globalAlpha=.45;c.translate(x+16,y+(trap?32:31));c.scale(1,bob);c.drawImage(g.img,-w/2,-h,w,h);c.restore();return}
  const sz=BL[id]&&BL[id].sz;if(sz&&!ICON&&!c._sc&&id!=='bench'&&id!=='takebench'&&id!=='bed'&&id!=='yorubed'&&id!=='volcano'){/* ベンチ・ベッドは絵がもともと2マスぶん */c.save();c.translate(x,y);c.scale(sz[0],sz[1]);c._sc=1;drawObj(c,id,0,0,i,g,now);c._sc=0;c.restore();return}
  const h=hash(i);
  switch(id){
  case'ntree':case'tree':shadow(c,x+16,y+28,12,4);c.fillStyle='#7a5132';c.fillRect(x+13,y+15,6,14);c.fillStyle='#5f3e25';c.fillRect(x+13,y+15,2,14);
    circ(c,x+16,y+11,13,'#2f7a3d');circ(c,x+10,y+13,8,'#2a6c36');circ(c,x+21,y+7,8,'#3f9a4c');circ(c,x+12,y+5,6,'#4cad58');circ(c,x+10,y+3,2.5,'#7fd36b');break;
  case'deadtree':{c.fillStyle='#e0c49a';c.beginPath();c.ellipse(x+16,y+28,12,3.5,0,0,7);c.fill();c.strokeStyle='#9a6a48';c.lineCap='round';
    c.fillStyle='#9a6a48';c.beginPath();c.moveTo(x+10,y+29);c.quadraticCurveTo(x+14,y+22,x+14,y+12);c.lineTo(x+18,y+12);c.quadraticCurveTo(x+18,y+22,x+23,y+29);c.fill();
    c.lineWidth=3;c.beginPath();c.moveTo(x+15,y+14);c.quadraticCurveTo(x+12,y+9,x+7,y+8);c.moveTo(x+16,y+13);c.lineTo(x+16,y+3);c.moveTo(x+17,y+15);c.quadraticCurveTo(x+21,y+10,x+26,y+9);c.stroke();
    c.lineWidth=2;c.beginPath();c.moveTo(x+16,y+5);c.lineTo(x+13,y+1);c.moveTo(x+16,y+6);c.lineTo(x+19,y+2);c.moveTo(x+8,y+8);c.lineTo(x+5,y+11);c.moveTo(x+24,y+9);c.lineTo(x+27,y+5);c.stroke();c.lineCap='butt';
    c.fillStyle='#6e4a30';c.beginPath();c.ellipse(x+17,y+20,1.6,2.6,0,0,7);c.fill();c.fillStyle='#b8865c';c.beginPath();c.ellipse(x+9,y+28,2.5,1.5,0,0,7);c.fill();break}
  case'hotstone':{shadow(c,x+16,y+27,12,3);blob(c,'#7a4a3a',[[x+5,y+27],[x+6,y+16],[x+13,y+9],[x+21,y+10],[x+27,y+17],[x+27,y+27]]);blob(c,'#a0563f',[[x+7,y+19],[x+13,y+10],[x+20,y+11],[x+17,y+17],[x+10,y+22]]);
    const gl=ICON?.8:.55+Math.sin(performance.now()/400+i)*.25;c.fillStyle='rgba(255,140,60,'+gl+')';c.beginPath();c.moveTo(x+12,y+24);c.lineTo(x+15,y+17);c.lineTo(x+14,y+13);c.lineTo(x+18,y+19);c.lineTo(x+21,y+24);c.fill();c.fillStyle='rgba(255,220,120,'+gl+')';c.fillRect(x+15,y+19,3,4);break}
  case'volcano':{const cx=x+48,by=y+94,T=(now||0)/1000;shadow(c,cx,by-2,60,8);
    c.fillStyle='#6f5a4f';c.beginPath();c.moveTo(x-22,by);c.quadraticCurveTo(x+8,y+42,cx-15,y+4);c.lineTo(cx+15,y+4);c.quadraticCurveTo(x+88,y+42,x+118,by);c.closePath();c.fill();
    c.fillStyle='#8a7062';c.beginPath();c.moveTo(x-10,by);c.quadraticCurveTo(x+16,y+46,cx-13,y+7);c.lineTo(cx-3,y+7);c.quadraticCurveTo(cx-12,y+52,cx-6,by);c.closePath();c.fill();
    c.fillStyle='#5a463d';for(const[dx,dy,r]of[[-30,70,5],[22,58,4],[34,80,6],[-12,40,3]]){c.beginPath();c.ellipse(cx+dx,y+dy,r*1.4,r*.7,0,0,7);c.fill()}
    c.fillStyle='#3f302b';c.beginPath();c.ellipse(cx,y+5,16,5,0,0,7);c.fill();
    const gl=.6+.4*Math.sin(T*2);c.fillStyle='rgba(255,'+((110+50*gl)|0)+',40,.95)';c.beginPath();c.ellipse(cx,y+5,11*(.8+.2*gl),3,0,0,7);c.fill();
    c.strokeStyle='rgba(255,'+((100+60*gl)|0)+',40,.85)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(cx+5,y+8);c.quadraticCurveTo(cx+11,y+28,cx+7,y+44);c.moveTo(cx-6,y+8);c.quadraticCurveTo(cx-12,y+22,cx-19,y+32);c.stroke();
    for(let k=0;k<4;k++){const ph=(T*.3+k/4)%1;c.fillStyle='rgba(105,96,94,'+(.5*(1-ph))+')';c.beginPath();c.arc(cx+Math.sin(T+k*2)*6+ph*16,y-2-ph*64,8+ph*16,0,7);c.fill()}
    break}
  case'boulder':{shadow(c,x+16,y+28,15,4);blob(c,'#76685f',[[x+1,y+28],[x+2,y+12],[x+10,y+3],[x+23,y+4],[x+31,y+13],[x+31,y+28]]);blob(c,'#958579',[[x+4,y+16],[x+11,y+5],[x+22,y+6],[x+18,y+14],[x+8,y+20]]);
    c.strokeStyle='#54483f';c.lineWidth=1.5;c.beginPath();c.moveTo(x+14,y+12);c.lineTo(x+18,y+20);c.lineTo(x+15,y+26);c.moveTo(x+18,y+20);c.lineTo(x+24,y+22);c.stroke();break}
  case'heatv':{const t=S&&S.st2,br=!t||(i===D2&&!t.d2fix)||!!(t.hvb&&t.hvb[i]),dir=t?(i===D1?t.d1:t.d2):1,T=(now||0)/1000;shadow(c,x+16,y+28,13,3.5);
    c.fillStyle='#665850';rr(c,x+3,y+17,26,12,3);c.fillStyle='#8a7b70';rr(c,x+5,y+13,22,8,3);
    c.fillStyle=br?'#4d4542':'#3b3330';c.beginPath();c.arc(x+16,y+12,8.5,0,7);c.fill();
    if(br){c.strokeStyle='#cbbcab';c.lineWidth=2;c.beginPath();c.moveTo(x+10,y+7);c.lineTo(x+15,y+13);c.lineTo(x+12,y+18);c.moveTo(x+21,y+6);c.lineTo(x+18,y+12);c.stroke()}
    else{const g=.6+.4*Math.sin(T*3);c.fillStyle='rgba(255,'+((120+50*g)|0)+',50,1)';c.beginPath();c.arc(x+16,y+12,5.5,0,7);c.fill();c.fillStyle='#fff3c0';c.save();c.translate(x+16,y+12);c.scale(dir===0?-1:1,1);c.beginPath();c.moveTo(4.5,0);c.lineTo(-2,-3.6);c.lineTo(-2,3.6);c.closePath();c.fill();c.restore()}
    break}
  case'crack':{const T=(now||0)/1000,g=.5+.5*Math.sin(T*2+(i||0));c.lineCap='round';c.strokeStyle='#3b2c26';c.lineWidth=4;c.beginPath();c.moveTo(x+3,y+9);c.lineTo(x+12,y+15);c.lineTo(x+9,y+22);c.lineTo(x+20,y+27);c.moveTo(x+12,y+15);c.lineTo(x+26,y+10);c.stroke();c.strokeStyle='rgba(255,'+((100+60*g)|0)+',40,.9)';c.lineWidth=1.6;c.stroke();break}
  case'rock':shadow(c,x+16,y+27,13,3);blob(c,'#b9ad9f',[[x+4,y+27],[x+5,y+15],[x+12,y+7],[x+21,y+8],[x+26,y+16],[x+27,y+27]]);blob(c,'#d3c9bd',[[x+6,y+18],[x+12,y+8],[x+20,y+9],[x+17,y+15],[x+9,y+21]]);
    blob(c,'#c5baae',[[x+19,y+29],[x+19,y+22],[x+24,y+19],[x+30,y+22],[x+30,y+29]]);blob(c,'#d9d0c5',[[x+20,y+23],[x+24,y+20],[x+28,y+22],[x+24,y+24]]);tuft(c,x+4,y+29,.7);tuft(c,x+29,y+30,.55);break;
  case'berry':{shadow(c,x+16,y+28,13,3);const B='#6ea84e',D='#5a9441',L='#8cc26a';
    for(const[dx,dy,r,col]of[[-9,-5,6,D],[9,-5,6,D],[-6,-11,7,B],[6,-11,7,B],[0,-15,7,L],[-10,0,6,B],[10,0,6,B],[0,-4,10,B]])circ(c,x+16+dx,y+24+dy,r,col);
    tuft(c,x+5,y+29,.6,D);tuft(c,x+27,y+29,.6,D);
    if(g>=100)for(const[dx,dy]of[[-6,-12],[5,-8],[-3,-2],[8,-15]]){circ(c,x+16+dx,y+24+dy,3,'#5b6fd1');c.fillStyle='#3f50a8';c.fillRect(x+15+dx,y+21.6+dy,2,1.2)}break}
  case'logwall':case'plasterwall':case'brickwall':case'yozorawall':{/* 丸太・しっくい・レンガ・よぞらの壁も、木の壁と同じ形（柱・断面・巾木・つなぎめなし）で、正面の帯だけ材質を変える */if(id==='yozorawall'&&!(i!=null&&!ICON&&HOUSES.some(h=>h.inside.has(i+W)||h.inside.has(i+W-1)||h.inside.has(i+W+1)))){drawObj(c,'hwall',x,y,i,g,now);break}/* よぞらの壁：家の外がわから見える面は、木の壁と同じ。家の角の壁も、中から見える面は夜空の色にして、はしまでつなげる */c._mat=id==='logwall'?'log':id==='plasterwall'?'plaster':id==='yozorawall'?'night':'brick';{const ck=c._chip;if(id==='yozorawall')c._chip=1;/* 家の中から見える面だけ夜空の色（木の壁のドット絵は使わない） */drawObj(c,'hwall',x,y,i,g,now);c._chip=ck}c._mat=0;break}
  case'door':case'hwall':{/* 壁：正面は1マスの高さ（y〜y+32）、断面（てっぺん）はその上（y-9〜y）にブラウン1色 */
    const door=id==='door';if(ICON&&door){const art=HOUSEART&&HOUSEART['wall-door'];if(art&&art.complete&&art.naturalWidth){c.drawImage(art,x+2,y+1,28,30);break}}
    if(ICON){c.save();c.translate(x+16,y+32);c.scale(.75,.75);c.translate(-x-16,-y-32)}
    const isW=k=>{const t=typeAt(k);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))};/* 家の壁・ドアは、柵や石の塀とはつながらない */const L=!ICON&&isW(i-1),R=!ICON&&isW(i+1),U=!ICON&&isW(i-W),D=!ICON&&isW(i+W);
    const MAT=c._mat||'wood',WT='#9a7350',T=9,hasV=U||D,hasH=L||R||!hasV,hx0=L||ICON?x:x+5,hx1=R||ICON?x+TS:x+27;
    const top=()=>{const rs=[];if(hasH)rs.push([hx0-(L?2:0),y-T,hx1+(R?2:0),y,hx0,y-T,hx1,y]);if(hasV)rs.push([x+5,y-T-(U?2:0),x+27,y-T+(D?TS+2:T),x+5,y-T,x+27,y-T+(D?TS:T)]);drawSection(c,x,y-T,rs)};/* 断面：エリア全体をひとつにつなげた輪郭（たて・よこのくぎりなし） */
    const front=(a,b)=>wallBand(c,MAT,a,b,x,y,i);
    const side=(a,b)=>{/* 柱・縦の壁のはしの正面：たて板 */c.fillStyle='rgba(0,0,0,.18)';c.fillRect(a,y+TS,b-a,2);c.fillStyle='#8a5e3c';c.fillRect(a,y,b-a,TS);c.fillStyle='#a8784e';for(const lx of[a+5,a+11,a+17])if(lx<b-2)c.fillRect(lx,y,1,TS);c.fillStyle='#b88550';c.fillRect(a,y,1.5,TS);c.fillRect(b-1.5,y,1.5,TS)};/* 柱には巾木をつけない */
    if(c._doorBack){if(door&&hasH)top();break}/* ドアの断面は、となりの壁と同じ下絵(静的な層)に描く */
    if(door&&hasV&&!hasH){let op=0;if(!ICON)op=doorOp(i,x,y,2.1,.9);/* 縦の壁のドア：断面のまま。戸口に断面の輪郭線を出し、戸板は線1本（開くと内がわへ回る） */
      drawSection(c,x,y-T,[[x+5,y-T-2,x+27,y-T+3,x+5,y-T,x+27,y-T+3],[x+5,y+TS-T-3,x+27,y+TS-T+2,x+5,y+TS-T-3,x+27,y+TS-T]]);
      {const Ln=TS-6,an=op*Math.PI*.45;c.save();c.translate(x+16,y-T+3);c.rotate(an);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-1,1,5,Ln);c.fillStyle='#8a5a33';c.fillRect(-2,0,4,Ln);c.fillStyle='#b88550';c.fillRect(-2,0,1.3,Ln);c.restore()}if(ICON)c.restore();break}
    if(door&&hasH){/* 正面のドア：1マスぴったり。絵の左はし（ちょうつがい）と右はし（取っ手）はそのまま、まん中の板だけのばす */const art=HOUSEART&&HOUSEART['wall-door'];let op=0;if(!ICON)op=doorOp(i,x,y,.9,2.1);
      c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x,y+TS,TS,2);c.fillStyle='#8a5e3c';c.fillRect(x,y,TS,TS);c.fillStyle='#a8784e';c.fillRect(x,y,TS,1);c.fillStyle='#4f3527';c.fillRect(x+2,y+2,TS-4,TS-2);
      if(art&&art.complete&&art.naturalWidth){const dw=TS-4,dy=y+2,dh=TS-2;c.save();c.translate(x+2,0);c.scale(1-op*.78,1);c.drawImage(art,19,18,26,149,0,dy,5,dh);c.drawImage(art,45,18,40,149,5,dy,dw-13,dh);c.drawImage(art,85,18,28,149,dw-8,dy,8,dh);c.restore()}
      else{c.fillStyle='#b77a49';c.fillRect(x+2,y+2,(TS-4)*(1-op*.78),TS-2)}
      if(ICON){top();c.restore()}break}
    if(ICON)front(x,x+TS);/* アイコンは、柱ではなく壁の正面を見せる */
    else if(hasH){if(!D){if(L&&R&&!U)front(x,x+TS);else{side(x+5,x+27);if(L)front(x,x+5);if(R)front(x+27,x+TS)}}else{if(L)front(x,x+5);if(R)front(x+27,x+TS)}}
    else if(!D)side(x+5,x+27);
    top();if(ICON)c.restore();break}
  case'sdoor':{const isF=k=>{const t=typeAt(k);return t==='wall'||t==='sdoor'||FENCE_IDS.has(t)};/* 木の柵・大門のとなりでも、たて置きは一本線（家の壁とはつながらない） */const L=!ICON&&isF(i-1),R=!ICON&&isF(i+1),U=!ICON&&isF(i-W),D=!ICON&&isF(i+W);const ver=!(L||R)&&(U||D);
    let op=0;if(!ICON)op=doorOp(i,x,y,ver?2.1:.9,ver?.9:2.1);if(ver&&!ICON){const an=op*Math.PI*.45;c.save();c.translate(x+16,y);c.rotate(an);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-1,1,5,TS);c.fillStyle='#8a5a33';c.fillRect(-2,0,4,TS);c.fillStyle='#b88550';c.fillRect(-2,0,1.3,TS);c.restore();break}/* たて置きは、家のドアと同じ一本線 */shadow(c,x+16,y+29,16,3);const stc='#c3bfb6',sto='#9a978f';
    if(!ver){c.fillStyle=sto;rr(c,x,y+3,7,26,2);rr(c,x+25,y+3,7,26,2);c.fillStyle=stc;rr(c,x+1,y+4,5,24,2);rr(c,x+26,y+4,5,24,2);const pw=18*(1-op*.82);c.fillStyle='#9a6a40';c.fillRect(x+7,y+8,pw,20);c.fillStyle='#b9824f';for(let k=0;k<3;k++)c.fillRect(x+7+k*pw/3+.5,y+8,pw/3-1,20);c.fillStyle='#6e4c32';c.fillRect(x+7,y+13,pw,1.5);c.fillRect(x+7,y+22,pw,1.5)}
    else{c.fillStyle=sto;rr(c,x+2,y-2,28,8,2);rr(c,x+2,y+25,28,7,2);const ph=18*(1-op*.82);c.fillStyle='#9a6a40';c.fillRect(x+9,y+6,14,ph);c.fillStyle='#6e4c32';c.fillRect(x+9,y+6+ph/2,14,1.5)}break}
  case'gate':case'archedgate':case'stonegate':{const isF=k=>{const t=typeAt(k);return FENCE_IDS.has(t)||t==='wall'||t==='sdoor'};/* 柵・石の塀どうしはつながる。家の壁とはつながらない */const L=!ICON&&isF(i-1),R=!ICON&&isF(i+1),U=!ICON&&isF(i-W),D=!ICON&&isF(i+W);const ver=!(L||R)&&(U||D);
    let op=0;if(!ICON)op=doorOp(i,x,y,ver?2.1:.9,ver?.9:2.1);
    if(id==='stonegate'&&drawMossGate(c,x,y,i,ver,op))break;shadow(c,x+16,y+28,12,3);const P=id==='stonegate'?'#77756f':id==='archedgate'?'#704b32':'#a0703f',PC=id==='stonegate'?'#c3bfb6':id==='archedgate'?'#d8b275':'#d6a874',RL=id==='stonegate'?'#9a978f':id==='archedgate'?'#9b7049':'#c08a55',SL=id==='stonegate'?'#c3bfb6':id==='archedgate'?'#c99153':'#cf9c66';
    if(!ver){const pw=18*(1-op*.82);c.fillStyle=RL;c.fillRect(x+7,y+12,pw,4);c.fillRect(x+7,y+20,pw,4);c.fillStyle=SL;for(let k=0;k<3;k++)c.fillRect(x+7+pw*(k+.5)/3-1.5,y+10,3,16);
      c.fillStyle=P;c.fillRect(x+1,y+7,6,21);c.fillRect(x+25,y+7,6,21);c.fillStyle=PC;c.fillRect(x+1,y+7,6,3);c.fillRect(x+25,y+7,6,3)}
    else{const ph=18*(1-op*.82);c.fillStyle=RL;c.fillRect(x+12,y+7,3,ph);c.fillRect(x+17,y+7,3,ph);c.fillStyle=SL;for(let k=0;k<3;k++)c.fillRect(x+11,y+7+ph*(k+.5)/3-1.5,10,3);
      c.fillStyle=P;c.fillRect(x+12,y,8,7);c.fillRect(x+12,y+25,8,7);c.fillStyle=PC;c.fillRect(x+12,y,8,3);c.fillRect(x+12,y+25,8,3)}break}
  case'fence':case'logfence':case'bamboofence':case'wall':{const W2=id==='wall';const isF=k=>W2?(typeAt(k)==='wall'||typeAt(k)==='sdoor'||typeAt(k)==='stonegate'):FENCE_IDS.has(typeAt(k));const L=!ICON&&isF(i-1)&&!(W2&&typeAt(i-1)==='sdoor'),R=!ICON&&isF(i+1)&&!(W2&&typeAt(i+1)==='sdoor'),U=!ICON&&isF(i-W)&&!(W2&&typeAt(i-W)==='sdoor'),D=!ICON&&isF(i+W)&&!(W2&&typeAt(i+W)==='sdoor');/* 石の塀のドアの横では、塀はそこで終わって端の柱が立つ */
    if(W2)break;/* 石の塀（石垣）は部品の絵（drawConn・stoneFront）だけで描く */
    shadow(c,x+16,y+28,12,3);
    const sdL=!ICON&&!W2&&typeAt(i-1)==='sdoor',sdR=!ICON&&!W2&&typeAt(i+1)==='sdoor';/* 石の塀のドアのとなり：柵はドアのふちまでのびて、端の柱がドアにぴったりつく */
    if((sdL||sdR)&&(id==='logfence'||id==='fence')){const lg=id==='logfence';for(const px of[sdL?x:-1,sdR?x+24:-1]){if(px<0)continue;const rx=px<x+12?x+4:x+16;c.fillStyle=lg?'#85552f':'#c08a55';if(lg){rr(c,rx,y+11,12,6,2);rr(c,rx,y+20,12,6,2)}else{c.fillRect(rx,y+12,12,4);c.fillRect(rx,y+20,12,4)}c.fillStyle=lg?'#85552f':'#a0703f';c.fillRect(px,y+8,8,20);c.fillStyle=lg?'#c88c52':'#d6a874';c.fillRect(px,y+8,8,3)}}
    if(id==='logfence'){c.fillStyle='#85552f';if(L||R||!(U||D)){const x0=L?x:x+8,x1=R?x+TS:x+24;rr(c,x0,y+11,x1-x0,6,3);rr(c,x0,y+20,x1-x0,6,3)}if(U||D){rr(c,x+12,U?y:y+15,8,(U?17:0)+(D?17:0)+1,3)}c.fillStyle='#c88c52';c.fillRect(x+12,y+12,8,1.5);c.fillRect(x+12,y+21,8,1.5);break}
    if(id==='bamboofence'){c.fillStyle='#628044';for(const px of [x+5,x+13,x+21,x+29]){c.fillRect(px-1,y+7,2,22);c.fillStyle='#9fbd69';c.fillRect(px-.4,y+8,0.8,19);c.fillStyle='#628044'}c.fillStyle='#91aa5e';if(L||R||!(U||D)){const x0=L?x:x+3,x1=R?x+TS:x+29;c.fillRect(x0,y+11,x1-x0,3);c.fillRect(x0,y+21,x1-x0,3)}break}
    c.fillStyle='#c08a55';const hor=L||R||!(U||D);
    if(hor){c.fillRect(L?x:x+12,y+12,(L?16:4)+(R?16:4),4);c.fillRect(L?x:x+12,y+20,(L?16:4)+(R?16:4),4)}
    if(U||D)c.fillRect(x+13,U?y:y+14,6,(U?14:0)+(D?18:4));
    c.fillStyle='#a0703f';c.fillRect(x+12,y+8,8,20);c.fillStyle='#d6a874';c.fillRect(x+12,y+8,8,3);break}
  case'bed':if(BEDSPR.ok){shadow(c,x+16,y+30,13,3);{const bh=32*BEDSPR.h/BEDSPR.w;c.drawImage(BEDSPR.img,x,y+32-bh,32,bh)}break}/* 幅はぴったり1マス */shadow(c,x+16,y+30,13,3);c.fillStyle='#c07a48';rr(c,x+5,y+1,22,8,3);c.fillStyle='#d08a55';rr(c,x+4,y,4,10,2);rr(c,x+24,y,4,10,2);rr(c,x+8,y+1.5,16,4,2);
    c.fillStyle='#f3ead8';rr(c,x+6,y+6,20,20,3);c.fillStyle='#fbf5e8';rr(c,x+10,y+6,12,6,3);c.fillStyle='#e6dcc6';c.fillRect(x+11,y+11,10,1);
    c.fillStyle='#e4dccd';rr(c,x+5.5,y+13,21,15,3);c.fillStyle='#fbf8f1';rr(c,x+6,y+13,20,14,3);c.fillStyle='#ffffff';rr(c,x+5.5,y+13,21,4,2);c.fillStyle='#ddd4c3';c.fillRect(x+6,y+17,20,1);c.fillStyle='rgba(0,0,0,.06)';c.fillRect(x+9,y+20,8,1.2);c.fillRect(x+16,y+23,7,1.2);
    c.fillStyle='#c07a48';rr(c,x+5,y+24,22,6,2);c.fillStyle='#d08a55';rr(c,x+3,y+22,5,9,2);rr(c,x+24,y+22,5,9,2);c.fillStyle='#a8683c';c.fillRect(x+8,y+27,16,1);break;
  case'plot':{if(!chipOK('plot#0')||!drawChip(c,CHIPS['plot#'+((hash((i||0)*11+1)*4)|0)],'plot',x,y,0)){c.fillStyle='#8b6a45';rr(c,x+2,y+2,TS-4,TS-4,4);c.fillStyle='#7a5a38';for(let k=0;k<5;k++)c.fillRect(x+5+hash(i+k)*20,y+5+hash(i*3+k)*20,4,3)}/* 土はドット絵（もようちがい4つ） */
    c.strokeStyle='rgba(255,240,180,.7)';c.setLineDash([3,3]);c.lineWidth=1.5;c.strokeRect(x+3,y+3,TS-6,TS-6);c.setLineDash([]);
    if(g!=null&&g>0){c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+4,y+TS-6,TS-8,3);c.fillStyle='#ecdcbc';c.fillRect(x+4,y+TS-6,(TS-8)*Math.min(1,g/30),3)}break}
  case'farm':{const n=k=>!ICON&&S.obj[k]==='farm',gx=i%W,gy=(i/W)|0;
    const L=gx>0&&n(i-1),R=gx<W-1&&n(i+1),U=gy>0&&n(i-W),D=gy<H-1&&n(i+W);const wet=ICON?60:(S.dyn[i]?S.dyn[i].wet:0);
    c.fillStyle=wet>0?'#80553a':'#9a6a48';const fx=x+(L?0:2),fy=y+(U?0:2),fw=TS-(L?0:2)-(R?0:2),fh=TS-(U?0:2)-(D?0:2);rr(c,fx,fy,fw,fh,L&&R&&U&&D?0:5);
    if(!L)for(let k=0;k<3;k++)circ(c,x+3,y+6+k*10,3,c.fillStyle);if(!R)for(let k=0;k<3;k++)circ(c,x+29,y+6+k*10,3,c.fillStyle);
    c.fillStyle=wet>0?'#6b4630':'#835a3c';c.beginPath();c.ellipse(x+16,y+18,8,4.6,0,0,7);c.fill()
    if(wet>0){c.fillStyle='rgba(170,215,255,.3)';c.fillRect(x+6,y+4,6,1.5);c.fillRect(x+18,y+22,5,1.5)}
    if(!ICON&&S.dyn[i]&&S.dyn[i].crop&&S.dyn[i].sown===false){c.fillStyle='rgba(40,25,10,.3)';c.beginPath();c.ellipse(x+16,y+21,10,4.5,0,0,7);c.fill();c.fillStyle=wet>0?'#8a5c3e':'#a87650';c.beginPath();c.ellipse(x+16,y+18,10,6.5,0,Math.PI,0);c.ellipse(x+16,y+18,10,3,0,0,Math.PI);c.fill();c.fillStyle=wet>0?'rgba(190,140,100,.45)':'rgba(220,170,120,.5)';c.beginPath();c.ellipse(x+14,y+14.5,5,2,-.15,0,7);c.fill()/* たねをえらんだ畑は、土がこんもり */}
    if(!ICON&&S.dyn[i]&&S.dyn[i].sown!==false&&g<20){c.strokeStyle='#5fbf4f';c.lineWidth=1.6;c.beginPath();c.moveTo(x+16,y+19);c.lineTo(x+16,y+14.5);c.stroke();circ(c,x+14,y+14.5,2.2,'#7fd36b');circ(c,x+18,y+14,2.2,'#7fd36b')}/* 植え付けたら、小さい芽 */
    if(g>0)drawCrop(c,ICON?'imo':(S.dyn[i]&&S.dyn[i].crop)||'mugi',x,y,g,true);
    if(!ICON&&S.dyn[i]&&S.dyn[i].sown!==false){if(g<100&&!workOn(i)){c.fillStyle='rgba(30,20,10,.45)';rr(c,x+4,y+TS-5,TS-8,4,2);c.fillStyle='#8fe06a';if(g>0)rr(c,x+4,y+TS-5,(TS-8)*g/100,4,2)}
      else{const tw=Math.sin((now||0)/300+i)*.5+.5;c.fillStyle='rgba(255,245,170,'+(.5+tw*.5)+')';const sx=x+TS-6,sy=y+5,r=2+tw*1.5;c.fillRect(sx-r,sy-.6,r*2,1.2);c.fillRect(sx-.6,sy-r,1.2,r*2)}}
    break}
  case'sprout':{if(!ICON&&S&&i!=null&&S.ground[i]!==1&&S.dyn[i]&&S.dyn[i].userMound){const bob=Math.sin((now||0)/600+i)*.6;if(chipOK('mound#0')&&chipOK('seed#s')){drawChip(c,CHIPS['mound#'+Math.min(2,(hash(i*13+5)*3)|0)],'mound',x+16,y+28,0);drawChip(c,CHIPS['seed#s'],'seed',x+16,y+23+Math.round(bob),0);break}plantMound(c,x,y,i);drawSeedShape(c,x+16,y+23+bob,.48);break}if(S&&i!=null&&S.ground[i]===1&&!ICON){const b=Math.sin((now||0)/600+i)*1.5;if(chipOK('seedring')&&chipOK('seed')){drawChip(c,CHIPS.seedring,'seed',x+16,y+21,0);drawChip(c,CHIPS.seed,'seed',x+16,y+17+Math.round(b),0);break}c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(x+16,y+21,9,3,0,0,7);c.fill();drawSeedShape(c,x+16,y+17+b,1);break}/* 池に植える予定：種がぷかぷか */if(chipOK('sprout#plan'))drawChip(c,CHIPS['sprout#plan'],'sprout',x+16,y+22,0);else{c.fillStyle='rgba(120,90,50,.6)';c.beginPath();c.ellipse(x+16,y+22,9,5,0,0,7);c.fill();c.strokeStyle='#5fbf4f';c.lineWidth=2;c.beginPath();c.moveTo(x+16,y+21);c.lineTo(x+16,y+14);c.stroke();circ(c,x+13,y+14,3,'#7fd36b');circ(c,x+19,y+13,3,'#7fd36b')}
    c.strokeStyle='rgba(255,240,180,.8)';c.setLineDash([3,3]);c.lineWidth=1.5;c.strokeRect(x+3,y+3,TS-6,TS-6);c.setLineDash([]);break}
  case'site':{const d=ICON?null:S.dyn[i],sp=d&&siteSpan(d.build);
    if(sp&&SPR.site.ok){/* 建物の大きさに合わせた足場（見た目だけ。マスの判定は変えない） */const L=x+sp.x0*TS-2,Wd=sp.w*TS+4,Hd=Wd*91/104*sp.hf,B=y+sp.rows*TS;
      shadow(c,L+Wd/2,B-3,Wd/2-2,4);{const si=siteImg(Wd,Hd,i);if(si)c.drawImage(si,Math.round(L),Math.round(B-si.height));else c.drawImage(SPR.site.img,L,B-Hd,Wd,Hd)}
      const p=Math.min(1,d.p/d.need),bw=Math.min(Wd-8,64),bx=L+(Wd-bw)/2,by=B-Hd-10;c.fillStyle='rgba(0,0,0,.5)';rr(c,bx-1,by,bw+2,6,3);c.fillStyle='#ecdcbc';rr(c,bx,by+1,bw*p,4,2);break}
    if(SPR.site.ok){shadow(c,x+16,y+29,14,3);{const si=ICON?null:siteImg(34,30,i||0);if(si)c.drawImage(si,x-1,y+1);else c.drawImage(SPR.site.img,x-1,y+1,34,30)}if(d){const p=Math.min(1,d.p/d.need);c.fillStyle='rgba(0,0,0,.5)';rr(c,x+2,y-8,28,6,3);c.fillStyle='#ecdcbc';rr(c,x+3,y-7,26*p,4,2)}break}shadow(c,x+16,y+29,14,3);c.fillStyle='#c9a46a';c.fillRect(x+3,y+20,26,8);c.strokeStyle='#8a5a33';c.lineWidth=2.5;c.beginPath();c.moveTo(x+5,y+28);c.lineTo(x+5,y);c.moveTo(x+27,y+28);c.lineTo(x+27,y);c.moveTo(x+5,y+4);c.lineTo(x+27,y+4);c.moveTo(x+5,y+14);c.lineTo(x+27,y+14);c.moveTo(x+5,y+4);c.lineTo(x+27,y+14);c.stroke();
    if(d){const p=Math.min(1,d.p/d.need);c.fillStyle='rgba(0,0,0,.5)';rr(c,x+2,y-8,28,6,3);c.fillStyle='#ecdcbc';rr(c,x+3,y-7,26*p,4,2)}break}
  case'table':shadow(c,x+16,y+27,14,3.5);c.fillStyle='#a8703f';for(const lx of[6,23.5])rr(c,x+lx,y+16,3,12,1.5);c.fillStyle='#8f5f35';for(const lx of[10,19.5])rr(c,x+lx,y+16,2.6,9,1.3);
    c.fillStyle='#b57d4b';rr(c,x+2,y+12,28,6,3);c.fillStyle='#cf9561';rr(c,x+2,y+8,28,7,3.5);c.fillStyle='#dba872';c.fillRect(x+6,y+10,9,1);c.fillRect(x+17,y+12,8,1);break;
  case'stor':{shadow(c,x+16,y+29,14,3);circ(c,x+10,y+11,5,'#7ab35a');circ(c,x+22,y+9,5,'#8cc26a');circ(c,x+16,y+8,4,'#7ab35a');
    circ(c,x+11,y+14,5,'#e8604f');c.fillStyle='#7a4a2a';c.fillRect(x+10.5,y+7.5,1.2,3);circ(c,x+9.5,y+12.5,1.3,'rgba(255,255,255,.35)');
    c.fillStyle='#f2b24f';c.beginPath();c.ellipse(x+17,y+13,4,5,.3,0,7);c.fill();circ(c,x+22,y+14,4.4,'#f6efe2');circ(c,x+21,y+13,1.2,'#fff');crate(c,x,y);break}
  case'oven':{const on=ICON||S.res.some(q=>q.act&&q.act.type==='cook'&&q.act.stage==='do'&&q.act.obj===i),T=now||0;
    c.fillStyle='rgba(225,200,170,.6)';c.beginPath();c.ellipse(x+16,y+29,15,3.5,0,0,7);c.fill();
    c.fillStyle='#c4bbb0';c.beginPath();c.moveTo(x+2,y+28);c.quadraticCurveTo(x+1,y+6,x+16,y+5);c.quadraticCurveTo(x+31,y+6,x+30,y+28);c.closePath();c.fill();
    c.fillStyle='#d3cbc1';for(const[sx,sy,w,h]of[[4,10,9,5],[14,7,8,5],[22,10,7,5],[3,17,6,5],[24,17,6,5]])rr(c,x+sx,y+sy,w,h,2.4);
    blob(c,'#b3a99d',[[x+1,y+29],[x+1,y+22],[x+6,y+20],[x+10,y+23],[x+10,y+29]]);blob(c,'#b3a99d',[[x+22,y+29],[x+22,y+23],[x+27,y+20],[x+31,y+22],[x+31,y+29]]);
    c.fillStyle='#6e4a30';c.beginPath();c.moveTo(x+9,y+28);c.lineTo(x+9,y+20);c.quadraticCurveTo(x+16,y+11,x+23,y+20);c.lineTo(x+23,y+28);c.fill();
    c.fillStyle='#8a5a33';c.fillRect(x+10,y+26,12,2);c.fillStyle='#6b6762';rr(c,x+11,y+2,10,4,2);c.fillStyle='#57534f';rr(c,x+12,y+1,8,2,1);
    if(!on){c.fillStyle='rgba(255,120,40,.4)';c.fillRect(x+13,y+25,2,1.5);c.fillRect(x+17,y+25,2,1.5);break}
    const fl=ICON?1:.75+Math.sin(T/90+i)*.25;c.fillStyle='rgba(240,104,64,'+fl+')';c.beginPath();c.moveTo(x+11.5,y+26);c.quadraticCurveTo(x+11,y+19,x+16,y+15+Math.sin(T/80)*1);c.quadraticCurveTo(x+21,y+19,x+20.5,y+26);c.fill();
    c.fillStyle='rgba(255,196,90,'+fl+')';c.beginPath();c.moveTo(x+13.5,y+26);c.quadraticCurveTo(x+13.5,y+21,x+16,y+19);c.quadraticCurveTo(x+18.5,y+21,x+18.5,y+26);c.fill();
    c.fillStyle='rgba(255,160,80,.16)';c.beginPath();c.ellipse(x+16,y+30,15,4,0,0,7);c.fill();
    if(!ICON)for(let k=0;k<3;k++){const ph=((T/1600+k/3)%1);circ(c,x+16+Math.sin(ph*5+k)*3+ph*4,y-ph*16,2.2+ph*3.2,'rgba(240,232,215,'+(.75*(1-ph))+')')}break}
  case'mbox':{shadow(c,x+16,y+29,14,3);
    c.save();c.translate(x+12,y+11);c.rotate(-.35);c.fillStyle='#a8703f';rr(c,-8,-3,16,6,3);c.restore();circ(c,x+5.5,y+13.5,3.2,'#e8c08a');circ(c,x+5.5,y+13.5,1.6,'#d4a46a');
    c.fillStyle='#a8703f';rr(c,x+5,y+10,13,6,3);circ(c,x+6,y+13,3.2,'#ecc896');circ(c,x+6,y+13,1.5,'#d4a46a');
    blob(c,'#a9a39b',[[x+16,y+17],[x+17,y+10],[x+22,y+8],[x+25,y+12],[x+25,y+17]]);blob(c,'#8e8a84',[[x+22,y+16],[x+23,y+8],[x+28,y+7],[x+29,y+16]]);
    c.fillStyle='#7ab35a';c.beginPath();c.ellipse(x+26,y+6,1.8,4,.4,0,7);c.fill();crate(c,x,y);break}
  case'lumber':{shadow(c,x+16,y+29,15,3);c.fillStyle='#8a5a33';for(let k=0;k<3;k++){rr(c,x+3,y+18+k*-5,20,5,2.5)}c.fillStyle='#c99460';for(let k=0;k<3;k++)circ(c,x+5,y+20.5+k*-5,2.2,'#d6a36a');
    c.fillStyle='#6d4424';rr(c,x+21,y+20,9,8,2);c.fillStyle='#b07c50';c.fillRect(x+21,y+20,9,2);c.fillStyle='#6d4424';c.save();c.translate(x+26,y+20);c.rotate(-.5);c.fillRect(-1,-12,2,12);c.fillStyle='#a3a6ae';c.fillRect(-1,-13,6,4);c.restore();break}
  case'quarry':{shadow(c,x+16,y+29,15,3);circ(c,x+10,y+22,7,'#7d8088');circ(c,x+20,y+23,6,'#8d9098');circ(c,x+15,y+16,6,'#a3a6ae');circ(c,x+13,y+14,2,'#d4d5da');
    c.save();c.translate(x+24,y+14);c.rotate(.6);c.fillStyle='#6d4424';c.fillRect(-1,-2,2,14);c.strokeStyle='#5b5f68';c.lineWidth=2.5;c.beginPath();c.arc(0,4,8,Math.PI*1.15,Math.PI*1.85);c.stroke();c.restore();break}
  case'grave':{if(!ICON&&S.dyn[i]&&!S.dyn[i].buried){c.fillStyle='#6b4a2c';c.beginPath();c.ellipse(x+16,y+22,11,6,0,0,7);c.fill();c.fillStyle='#8a6644';c.beginPath();c.ellipse(x+16,y+20,9,4.5,0,0,7);c.fill();c.fillStyle='#8a5a33';c.fillRect(x+15,y+6,2.5,14);c.fillRect(x+11,y+9,10,2.5);break}shadow(c,x+16,y+28,11,3);c.fillStyle='#8d9098';c.beginPath();c.moveTo(x+8,y+27);c.lineTo(x+8,y+12);c.arc(x+16,y+12,8,Math.PI,0);c.lineTo(x+24,y+27);c.fill();c.fillStyle='#b3b6bd';c.beginPath();c.moveTo(x+9.5,y+26);c.lineTo(x+9.5,y+12);c.arc(x+16,y+12,6.5,Math.PI,0);c.lineTo(x+22.5,y+26);c.fill();
    c.fillStyle='#7d8088';c.fillRect(x+15,y+9,2,9);c.fillRect(x+12,y+12,8,2);c.fillStyle='#6b6e75';c.fillRect(x+6,y+26,20,3);circ(c,x+7,y+25,2.2,'#ff9cc0');circ(c,x+25,y+25,2.2,'#ffd35c');circ(c,x+7,y+25,.8,'#fff');circ(c,x+25,y+25,.8,'#fff');break}
  case'chair':{const tb=k=>!ICON&&typeAt(k)==='table',up=tb(i-W),lf=tb(i-1),rt=tb(i+1);shadow(c,x+16,y+28,9,2.5);
    const back=()=>{if(lf||rt){const bx=lf?x+21:x+7;c.fillStyle='#a8703f';rr(c,bx+1,y+12,2.5,12,1.2);c.fillStyle='#cf9561';rr(c,bx,y+3,5,13,2.5)}else if(up){c.fillStyle='#cf9561';rr(c,x+8,y+20,16,6,3)}else{c.fillStyle='#a8703f';rr(c,x+10,y+8,2.6,11,1.3);rr(c,x+19.5,y+8,2.6,11,1.3);c.fillStyle='#cf9561';rr(c,x+8,y+2,16,9,4);c.fillStyle='#dba872';c.fillRect(x+11,y+4,9,1.2)}};
    if(!up)back();c.fillStyle='#a8703f';rr(c,x+9,y+19,2.8,9,1.4);rr(c,x+20.2,y+19,2.8,9,1.4);c.fillStyle='#8f5f35';rr(c,x+12,y+19,2.4,6,1.2);rr(c,x+17.6,y+19,2.4,6,1.2);
    c.fillStyle='#b57d4b';rr(c,x+8,y+17,16,4,2);c.fillStyle='#cf9561';rr(c,x+8,y+14,16,5,2.5);if(up)back();break}
  case'lamp':{const T=now||0,f=Math.sin(T/110+(i||0))*.12;shadow(c,x+16,y+29,8,2.5);/* 篝火：木の三脚に鉄のかご、上で火がゆれる */
    {const g=c.createRadialGradient(x+16,y+4,1,x+16,y+4,14);g.addColorStop(0,'rgba(255,200,90,.45)');g.addColorStop(1,'rgba(255,160,60,0)');c.fillStyle=g;c.fillRect(x,y-10,32,28)}
    c.strokeStyle='#6e4a2c';c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(x+11,y+13);c.lineTo(x+7,y+29);c.moveTo(x+21,y+13);c.lineTo(x+25,y+29);c.moveTo(x+16,y+13);c.lineTo(x+16,y+28);c.stroke();c.strokeStyle='#8a6038';c.lineWidth=1.4;c.beginPath();c.moveTo(x+9,y+22);c.lineTo(x+23,y+22);c.stroke();c.lineCap='butt';
    c.fillStyle='#3e3a3a';c.beginPath();c.moveTo(x+7,y+8);c.lineTo(x+25,y+8);c.lineTo(x+22,y+15);c.lineTo(x+10,y+15);c.closePath();c.fill();c.fillStyle='#5a5452';c.fillRect(x+7,y+8,18,2);c.fillStyle='#2a2626';for(let k=0;k<3;k++)c.fillRect(x+11+k*4,y+10,1.2,5);
    const fl=(cx,h,w,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(cx-w,y+8);c.quadraticCurveTo(cx-w,y+8-h*.5,cx,y+8-h);c.quadraticCurveTo(cx+w,y+8-h*.5,cx+w,y+8);c.closePath();c.fill()};
    fl(x+16,13*(1+f),6,'#ff8a3d');fl(x+12,8*(1-f),3.5,'#ff6a2a');fl(x+20,9*(1+f*.8),3.5,'#ff6a2a');fl(x+16,8*(1-f*.5),3.5,'#ffd35c');fl(x+16,4,1.8,'#fff4c0');break}
  case'campfire':{const T=now||0;c.fillStyle='#7d5238';c.save();c.translate(x+16,y+22);c.rotate(.35);rr(c,-9,-2,18,4,2);c.rotate(-.7);rr(c,-9,-2,18,4,2);c.restore();
    for(let k=0;k<7;k++){const a=k/7*6.283+.3;const rx=x+16+Math.cos(a)*10,ry=y+22+Math.sin(a)*5;c.fillStyle=k%2?'#b3a99d':'#c4bbb0';c.beginPath();c.ellipse(rx,ry,4,3,0,0,7);c.fill()}
    const f=Math.sin(T/90+i)*1.5;c.fillStyle='#ef7b4a';c.beginPath();c.moveTo(x+10,y+21);c.quadraticCurveTo(x+9,y+12,x+13,y+9+f*.4);c.quadraticCurveTo(x+14,y+13,x+15,y+12);c.quadraticCurveTo(x+16,y+5,x+19,y+3-f);c.quadraticCurveTo(x+18,y+10,x+21,y+11);c.quadraticCurveTo(x+24,y+15,x+22,y+21);c.closePath();c.fill();
    c.fillStyle='#f9c55a';c.beginPath();c.moveTo(x+13,y+21);c.quadraticCurveTo(x+12,y+16,x+15,y+13+f*.3);c.quadraticCurveTo(x+16,y+16,x+17,y+15);c.quadraticCurveTo(x+20,y+17,x+19,y+21);c.closePath();c.fill();
    if(!ICON)for(let k=0;k<2;k++){const ph=((T/1700+k/2)%1);circ(c,x+18+Math.sin(ph*5)*3+ph*3,y+2-ph*14,1.8+ph*3,'rgba(240,232,215,'+(.7*(1-ph))+')')}break}
  case'yogan':{shadow(c,x+16,y+29,16,3.5);const L=(!ICON&&i!=null&&S&&S.hp&&S.hp['L'+i])||1,T=(now||0)/1000;
    blob(c,'#5a4038',[[x-1,y+29],[x+3,y+14],[x+9,y+5],[x+23,y+5],[x+29,y+14],[x+33,y+29]]);blob(c,'#74574c',[[x+2,y+27],[x+6,y+15],[x+11,y+8],[x+16,y+8],[x+12,y+16],[x+8,y+27]]);/* 岩の山 */
    c.fillStyle='#3a2a26';c.beginPath();c.ellipse(x+16,y+6,8,3,0,0,7);c.fill();const gl=ICON?.9:.7+Math.sin(T*3+(i||0))*.2;c.fillStyle='rgba(255,120,40,'+gl+')';c.beginPath();c.ellipse(x+16,y+6,6.5,2.2,0,0,7);c.fill();c.fillStyle='rgba(255,220,110,'+gl+')';c.beginPath();c.ellipse(x+16,y+5.6,3.5,1.1,0,0,7);c.fill();/* 火口のようがん */
    c.strokeStyle='rgba(255,130,50,'+(gl*.8)+')';c.lineWidth=1.6;c.beginPath();c.moveTo(x+13,y+8);c.lineTo(x+11,y+15);c.lineTo(x+12,y+21);c.moveTo(x+20,y+8);c.lineTo(x+22,y+14);c.stroke();c.lineWidth=1;/* ようがんのすじ */
    if(L>=2){c.fillStyle='#8a6a5c';for(const [a,b] of[[x+1,y+24],[x+27,y+23]]){c.beginPath();c.ellipse(a+2,b+2,3.5,2.5,0,0,7);c.fill()}}
    if(L>=3){c.fillStyle='#ffd84a';star4(c,x+16,y-3,3.5)}
    if(!ICON){for(let k=0;k<2;k++){const ph=((T*.5+k*.5+(i||0)*.13)%1);c.fillStyle='rgba(120,110,105,'+(.45*(1-ph))+')';c.beginPath();c.arc(x+15+k*3+Math.sin(ph*4)*2,y+2-ph*14,1.5+ph*3,0,7);c.fill()}}/* けむり */
    break}/* ようがん台（火山のふもと） */
  case'watch':{shadow(c,x+16,y+29,14,3);c.fillStyle='rgba(225,200,160,.7)';c.beginPath();c.ellipse(x+16,y+28,14,3.5,0,0,7);c.fill();
    c.strokeStyle='#a8703f';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x+7,y+28);c.lineTo(x+9,y-2);c.moveTo(x+25,y+28);c.lineTo(x+23,y-2);c.stroke();
    c.lineWidth=2;c.beginPath();c.moveTo(x+8,y+24);c.lineTo(x+23,y+6);c.moveTo(x+24,y+24);c.lineTo(x+9,y+6);c.stroke();
    c.strokeStyle='#b8824f';c.lineWidth=1.6;c.beginPath();c.moveTo(x+26,y+28);c.lineTo(x+28,y+2);c.moveTo(x+30,y+28);c.lineTo(x+31.5,y+2);for(let k=0;k<5;k++){const yy=y+25-k*5.5;c.moveTo(x+26.2,yy);c.lineTo(x+30.3,yy)}c.stroke();c.lineCap='butt';
    c.fillStyle='#c98f5c';rr(c,x+4,y-4,24,7,2);c.fillStyle='#d9a46e';c.fillRect(x+4,y-4,24,2);c.fillStyle='#a8703f';c.fillRect(x+4,y+1,24,1.5);
    c.fillStyle='#a8703f';c.fillRect(x+7,y-14,2.5,11);c.fillRect(x+22.5,y-14,2.5,11);
    c.fillStyle='#d0694a';c.beginPath();c.moveTo(x+1,y-12);c.lineTo(x+16,y-23);c.lineTo(x+31,y-12);c.lineTo(x+29,y-10);c.lineTo(x+3,y-10);c.closePath();c.fill();c.fillStyle='#e07e5c';c.beginPath();c.moveTo(x+4,y-12.5);c.lineTo(x+16,y-21);c.lineTo(x+18,y-19.5);c.lineTo(x+7,y-12);c.closePath();c.fill();
    {const L=(!ICON&&i!=null&&S&&S.hp&&S.hp['L'+i])||1;/* 強化すると見た目が変わる：Lv2は旗、Lv3は金のかざりと星 */if(L>=2){c.fillStyle='#8a5a33';c.fillRect(x+15.4,y-34,1.5,12);c.fillStyle=L>=3?'#ffd84a':'#7fb4e8';c.beginPath();c.moveTo(x+16.9,y-34);c.lineTo(x+26,y-30.5);c.lineTo(x+16.9,y-27);c.closePath();c.fill()}
      if(L>=3){c.fillStyle='#ffd84a';c.fillRect(x+2.5,y-10.6,27,1.8);c.fillRect(x+4,y-3.6,24,1.2);star4(c,x+16,y-37,4.5)}}
    tuft(c,x+3,y+28,.6,'#7ab35a');break}
  case'torch':{const T=now||0;if(PSPR.torch&&PSPR.torch.ok){const g=PSPR.torch,h=40,w=h*g.w/g.h,fy=y+30-h*.78,fl=1+Math.sin(T/120+i)*.08;shadow(c,x+16,y+29,5,2);const gg=c.createRadialGradient(x+16,fy,1,x+16,fy,14*fl);gg.addColorStop(0,'rgba(255,200,90,.5)');gg.addColorStop(1,'rgba(255,200,90,0)');c.fillStyle=gg;c.fillRect(x+1,fy-15,30,30);c.drawImage(g.img,x+16-w/2,y+30-h,w,h);break}shadow(c,x+16,y+29,5,2);c.fillStyle='#8a5a33';c.fillRect(x+14,y+8,4,21);c.fillStyle='#6d4424';c.fillRect(x+12,y+6,8,4);
    const f=Math.sin(T/120+i)*1.5;const gg=c.createRadialGradient(x+16,y+3,1,x+16,y+3,12);gg.addColorStop(0,'rgba(255,200,90,.55)');gg.addColorStop(1,'rgba(255,200,90,0)');c.fillStyle=gg;c.fillRect(x+3,y-9,26,24);
    c.fillStyle='#ff8a3d';c.beginPath();c.moveTo(x+11,y+6);c.quadraticCurveTo(x+16+f,y-10,x+21,y+6);c.closePath();c.fill();c.fillStyle='#ffd35c';c.beginPath();c.moveTo(x+13.5,y+6);c.quadraticCurveTo(x+16+f*.6,y-3,x+18.5,y+6);c.closePath();c.fill();break}
  case'jar':shadow(c,x+16,y+29,9,3);c.fillStyle='#b5764a';c.beginPath();c.ellipse(x+16,y+19,10,10,0,0,7);c.fill();c.fillStyle='#c98a5a';c.beginPath();c.ellipse(x+14,y+17,6,6,0,0,7);c.fill();
    c.fillStyle='#9a6038';rr(c,x+10,y+5,12,5,2);c.fillStyle='#4f9fe0';c.beginPath();c.ellipse(x+16,y+7,5,1.6,0,0,7);c.fill();c.fillStyle='#8a5530';c.fillRect(x+7,y+20,18,1.5);break;
  case'basin':{const T=now||0;shadow(c,x+16,y+29,13,3);c.fillStyle='#9a978f';c.beginPath();c.ellipse(x+16,y+20,14,8,0,0,7);c.fill();c.fillStyle='#c3bfb6';c.beginPath();c.ellipse(x+16,y+18,14,7,0,0,7);c.fill();
    c.fillStyle='#4f9fe0';c.beginPath();c.ellipse(x+16,y+18,10.5,4.6,0,0,7);c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;const r2=(T/400+i)%1;c.beginPath();c.ellipse(x+16,y+18,3+r2*7,1.3+r2*3,0,0,7);c.stroke();
    c.fillStyle='#5a9441';c.beginPath();c.ellipse(x+9,y+17,3,1.6,.3,0,7);c.fill();break}
  case'bench':drawBench(c,x,y,false);break;
  case'kamizo':{/* カミサマの像：石の台に、石色のカミサマ */const pw=c._big?16:22;/* 2倍表示のとき台座は1マス幅 */shadow(c,x+16,y+29,pw/2+1,3.5);
    c.fillStyle='#8f8a82';rr(c,x+16-pw/2,y+22,pw,8,2);c.fillStyle='#b3ada3';rr(c,x+17-pw/2,y+21,pw-2,3,1.5);
    const G2=SPR.god;if(G2.ok){if(!G2.stone){const cv=document.createElement('canvas');cv.width=G2.img.naturalWidth;cv.height=G2.img.naturalHeight;const q=cv.getContext('2d');q.drawImage(G2.img,0,0);try{const d=q.getImageData(0,0,cv.width,cv.height),a=d.data;for(let i=0;i<a.length;i+=4){const l=(a[i]*.3+a[i+1]*.55+a[i+2]*.15)*.62+70;a[i]=l;a[i+1]=l*.98;a[i+2]=l*.93}q.putImageData(d,0,0)}catch(e){}G2.stone=cv}const h=24,w=h*G2.w/G2.h;c.drawImage(G2.stone,x+16-w/2,y+22-h,w,h)}
    else{circ(c,x+16,y+15,6,'#b3ada3');circ(c,x+16,y+8,4.5,'#c4beb4')}
    break}
  case'chochin':{/* おまつりのちょうちん：木の台から、赤いちょうちんをつるす */shadow(c,x+16,y+29,9,2.5);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    F(11,6,3,23,'#7a4f30');F(12,6,1,23,'#a8703f');F(10,26,7,3,'#5e3c24');F(11,5,12,2,'#7a4f30');F(20,7,1,3,'#3a2a20');
    F(17,10,8,2,'#3a2a20');F(16,12,10,10,'#d8452f');F(17,11,8,12,'#d8452f');F(17,14,8,1,'#a8321f');F(17,17,8,1,'#a8321f');F(17,20,8,1,'#a8321f');F(18,12,2,9,'#f08a6a');F(17,22,8,2,'#3a2a20');F(20,24,1,3,'#f9c55a');break}
  case'furin':{/* ふうりん：木のわくに、ガラスのすずと、ゆれる短冊 */shadow(c,x+16,y+29,9,2.5);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};const sw=ICON?0:Math.round(Math.sin((now||0)/380+(i||0))*2);
    F(8,6,3,23,'#7a4f30');F(21,6,3,23,'#7a4f30');F(7,4,18,3,'#5e3c24');F(9,28,14,2,'#5e3c24');F(15,7,1,3,'#3a2a20');
    F(12,10,8,6,'#9fd0ea');F(13,9,6,1,'#9fd0ea');F(13,11,2,3,'#e6f4fb');F(12,15,8,1,'#5e93b8');F(15,16,1,3,'#3a2a20');F(15+sw,19,3,7,'#f4ead8');F(15+sw,19,3,1,'#ef7b4a');break}
  case'ema':{/* えまかけ：屋根のある台に、ねがいごとの板 */shadow(c,x+16,y+29,12,2.5);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    F(5,9,3,20,'#7a4f30');F(24,9,3,20,'#7a4f30');F(3,6,26,3,'#5e3c24');F(2,8,28,2,'#3a2a20');F(6,14,20,2,'#a8703f');
    for(const[a,b]of[[7,16],[12,17],[17,16],[22,17],[9,22],[15,22],[20,22]]){F(a,b,4,4,'#d9a46e');F(a,b,4,1,'#f0c890');F(a+1,b-1,2,1,'#c4392e')}break}
  case'komainu':{/* こまいぬ：石の台にすわる、まもりの犬 */shadow(c,x+16,y+29,11,3);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    F(6,23,20,6,'#8f8a84');F(6,23,20,1,'#b3ada3');F(7,28,18,1,'#6f6a64');
    F(10,13,12,10,'#b9b3aa');F(9,8,10,8,'#c4beb4');F(18,10,5,4,'#b9b3aa');F(8,7,4,4,'#9b958c');F(16,7,4,3,'#9b958c');F(11,16,4,5,'#9b958c');F(20,18,3,5,'#a59f96');
    F(12,10,2,2,'#2b2b33');F(21,12,2,1,'#6f6a64');F(10,22,4,1,'#8f8a84');F(18,22,4,1,'#8f8a84');F(22,13,3,3,'#9b958c');break}
  case'bamboo':{/* 竹（仮の絵）：3本の竹と葉 */shadow(c,x+16,y+28,11,3);for(const[sx,top,col]of[[9,-14,'#7fb069'],[23,-8,'#76a862'],[16,-22,'#8fc078']]){c.fillStyle=col;c.fillRect(x+sx-2,y+top,4,29-top);c.fillStyle='#b5d99c';c.fillRect(x+sx-1.5,y+top,1,29-top);c.fillStyle='#5e8f4c';for(let ny=top+7;ny<27;ny+=8)c.fillRect(x+sx-2.5,y+ny,5,1.2)}c.fillStyle='#9fcf7f';for(const[lx,ly,a]of[[12,-18,-.6],[20,-24,.6],[27,-10,.5],[5,-12,-.5],[19,-14,.4]]){c.beginPath();c.ellipse(x+lx,y+ly,5,1.8,a,0,7);c.fill()}break}
  case'weed0g':case'weed0k':case'weed1g':case'weed1k':case'weedc':case'kinoko':drawWeed(c,id,x,y);break;
    case'takenoko':{/* たけのこ（仮の絵） */shadow(c,x+16,y+28,6,2);c.fillStyle='#c99c60';c.beginPath();c.moveTo(x+10.5,y+28);c.lineTo(x+16,y+13);c.lineTo(x+21.5,y+28);c.closePath();c.fill();c.fillStyle='#a87b47';c.beginPath();c.moveTo(x+10.5,y+28);c.lineTo(x+16,y+19);c.lineTo(x+13.5,y+28);c.closePath();c.fill();c.fillStyle='#e4c58f';c.beginPath();c.moveTo(x+21.5,y+28);c.lineTo(x+16,y+20);c.lineTo(x+18.5,y+28);c.closePath();c.fill();c.fillStyle='#9cc56f';c.beginPath();c.moveTo(x+14.5,y+16);c.lineTo(x+16,y+11);c.lineTo(x+17.5,y+16);c.closePath();c.fill();break}
  case'takebench':{/* 竹のベンチ（仮の絵）：横2マス */const w2=ICON?32:64,k=w2/64;shadow(c,x+w2/2,y+28,26*k,3);c.fillStyle='#6f9a52';for(const lx of[8,56])c.fillRect(x+lx*k-2,y+17,4,11);for(const[yy,col]of[[11,'#86b467'],[15.5,'#7aa95c'],[20,'#86b467']]){c.fillStyle=col;c.fillRect(x+3*k,y+yy,58*k,4);c.fillStyle='#b8dc9c';c.fillRect(x+3*k,y+yy,58*k,1);c.fillStyle='#5e8a45';for(const nx of[20,44])c.fillRect(x+nx*k,y+yy,1.2,4)}break}
  case'takeakari':{/* 竹あかり（仮の絵） */const T2=(now||0)/1000;shadow(c,x+16,y+28,6,2);c.fillStyle='#7fae62';c.fillRect(x+12,y+5,8,23);c.fillStyle='#a9d08a';c.fillRect(x+13,y+5,2,23);c.fillStyle='#5f8c47';c.fillRect(x+11.5,y+15,9,1.4);c.fillStyle='#e6f2d8';c.beginPath();c.ellipse(x+16,y+5,4,1.5,0,0,7);c.fill();const fl=.75+.25*Math.sin(T2*6+(i||0));c.fillStyle='rgba(255,214,120,'+fl+')';for(const[hx,hy]of[[16,9],[14,19],[18,21],[16,25]])c.fillRect(x+hx-.9,y+hy-.9,1.8,1.8);break}
  case'shishiodoshi':{/* ししおどし（仮の絵）：水がたまると竹がかたむく。支柱はまっすぐ */const T2=(now||0)/1000;shadow(c,x+16,y+28,12,3);c.fillStyle='#a8a8a2';c.beginPath();c.ellipse(x+21,y+25,8,3.5,0,0,7);c.fill();c.fillStyle='#a9d6ee';c.beginPath();c.ellipse(x+21,y+24.6,5.5,2,0,0,7);c.fill();c.fillStyle='#6f9a52';c.fillRect(x+7,y+11,3,17);c.fillStyle='#7fae62';c.fillRect(x+24,y+5,3,12);c.fillRect(x+18,y+5,9,3);const tl=(Math.sin(T2*.8+(i||0))>.9)?.35:-.22;c.save();c.translate(x+8.5,y+13);c.rotate(tl);c.fillStyle='#86b467';c.fillRect(-3,-2.5,15,5);c.fillStyle='#b5d99c';c.fillRect(-3,-2.5,15,1.2);c.restore();break}
  case'kadomatsu':{/* かどまつ：竹と松のかざり */shadow(c,x+16,y+29,10,3);const F=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(x+a,y+b,w,h)};
    for(const[a,b]of[[11,5],[15,2],[19,8]]){F(a,b,4,20,'#5b8f3a');F(a,b,1,20,'#7fb24f');F(a,b,4,2,'#c8e0a0');F(a,b+9,4,1,'#3f6b2a')}
    for(const[a,b]of[[7,17],[22,16],[9,13],[21,12]]){F(a,b,4,3,'#2f6b3a');F(a+1,b-1,2,1,'#3f8a4a')}
    F(8,21,16,8,'#c9a46a');F(8,21,16,1,'#e0c08a');F(8,24,16,1,'#6b4524');F(8,27,16,1,'#6b4524');F(14,24,4,4,'#c4392e');break}
  case'rockart':{/* つぼ：素焼きのつぼ */shadow(c,x+16,y+29,10,3);
    c.fillStyle='#b8643e';c.beginPath();c.moveTo(x+12,y+7);c.quadraticCurveTo(x+12,y+11,x+8,y+14);c.quadraticCurveTo(x+3,y+20,x+8,y+27);c.quadraticCurveTo(x+16,y+31,x+24,y+27);c.quadraticCurveTo(x+29,y+20,x+24,y+14);c.quadraticCurveTo(x+20,y+11,x+20,y+7);c.closePath();c.fill();
    c.fillStyle='#d27a4e';rr(c,x+10.5,y+4.5,11,3.5,1.5);c.fillStyle='#5a2e1a';c.fillRect(x+12.5,y+5.4,7,1.4);
    c.strokeStyle='#f0c9a0';c.lineWidth=1.3;c.beginPath();c.moveTo(x+7,y+18);c.quadraticCurveTo(x+16,y+21,x+25,y+18);c.stroke();
    c.beginPath();for(let k=0;k<5;k++){const xx=x+9+k*3.5;c.moveTo(xx,y+22);c.lineTo(xx+1.75,y+24.2);c.lineTo(xx+3.5,y+22)}c.stroke();
    c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.ellipse(x+11,y+19,1.6,4.5,-.3,0,7);c.fill();break}
  case'chime':{const T=now||0,sw=Math.sin(T/500+i)*.25;shadow(c,x+16,y+29,5,2);c.fillStyle='#8a5a33';c.fillRect(x+15,y+4,3,25);c.fillRect(x+9,y+4,14,3);
    c.save();c.translate(x+12,y+7);c.rotate(sw);c.strokeStyle='#ddd';c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.lineTo(0,4);c.stroke();c.fillStyle='rgba(180,225,255,.9)';c.beginPath();c.arc(0,8,4,Math.PI,0);c.lineTo(4,9);c.lineTo(-4,9);c.fill();c.fillStyle='#ff6a6a';c.fillRect(-1,9,2,6);c.fillStyle='#fff';c.fillRect(-2.5,14,5,4);c.restore();break}
  case'vane':{const T=now||0,a=c._neutral?0:Math.sin(T/1300+i)*.6;if(c._part!=='part'){shadow(c,x+16,y+29,6,2);c.fillStyle='#6d4424';c.fillRect(x+15,y+2,2.4,27);c.fillStyle='#8a8f98';c.fillRect(x+10,y+12,12,1.4);c.fillRect(x+15.5,y+7,1.4,10)}
    if(c._part!=='base'){c.save();c.translate(x+16,y+2);c.scale(Math.cos(a),1);c.fillStyle='#e0a43a';c.beginPath();c.moveTo(-9,0);c.lineTo(-3,-6);c.lineTo(4,-7);c.lineTo(8,-3);c.lineTo(4,1);c.closePath();c.fill();c.fillStyle='#e86a6a';c.fillRect(3,-9,3,3);c.fillStyle='#2b2b2b';c.fillRect(4,-5,1.5,1.5);c.restore()}break}
  case'spike':shadow(c,x+16,y+26,12,2);c.fillStyle='#7a6a55';rr(c,x+4,y+20,24,7,2);c.fillStyle='#cfd3d8';for(let k=0;k<4;k++){const sx=x+6+k*6;c.beginPath();c.moveTo(sx,y+21);c.lineTo(sx+2.5,y+12);c.lineTo(sx+5,y+21);c.closePath();c.fill()}
    c.fillStyle='rgba(0,0,0,.15)';for(let k=0;k<4;k++)c.fillRect(x+8.5+k*6,y+13,1,8);break;
  case'sticky':for(const[dx,dy,r]of[[-6,4,6],[5,2,7],[0,8,6]]){c.fillStyle='rgba(120,190,70,.75)';c.beginPath();c.ellipse(x+16+dx,y+18+dy,r,r*.55,0,0,7);c.fill()}
    c.strokeStyle='#4f8a39';c.lineWidth=1.5;for(const dx of[-7,0,7]){c.beginPath();c.moveTo(x+16+dx,y+24);c.quadraticCurveTo(x+16+dx-3,y+14,x+16+dx+1,y+9);c.stroke()}c.fillStyle='rgba(255,255,255,.5)';circ(c,x+12,y+19,1.3,'rgba(255,255,255,.6)');circ(c,x+20,y+23,1,'rgba(255,255,255,.6)');break;
  case'puddle':{const T=now||0,rd=!(S.trapCd&&S.trapCd[i]>S.t)||ICON;c.fillStyle=rd?'rgba(90,170,235,.8)':'rgba(90,170,235,.35)';c.beginPath();c.ellipse(x+16,y+20,13,7,0,0,7);c.fill();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1;const r2=(T/700+i*.3)%1;c.beginPath();c.ellipse(x+16,y+20,3+r2*9,1.5+r2*4.5,0,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.fillRect(x+9,y+17,5,1.3);break}
  case'firetrap':{const T=now||0,rd=!(S.trapCd&&S.trapCd[i]>S.t)||ICON;shadow(c,x+16,y+26,12,2);c.fillStyle='#6b6f78';rr(c,x+4,y+16,24,11,3);c.fillStyle='#3a3f48';for(let k=0;k<3;k++)rr(c,x+7+k*7,y+19,5,5,1.5);
    if(rd){c.fillStyle='rgba(255,120,50,'+(.5+Math.sin(T/200+i)*.3)+')';for(let k=0;k<3;k++)circ(c,x+9.5+k*7,y+21.5,1.6,'rgba(255,150,60,.9)')}break}
  case'gust':{const T=now||0,rd=!(S.trapCd&&S.trapCd[i]>S.t)||ICON;c.fillStyle='rgba(63,192,160,.25)';c.beginPath();c.ellipse(x+16,y+21,13,6,0,0,7);c.fill();
    c.strokeStyle=rd?'rgba(63,192,160,.95)':'rgba(63,192,160,.4)';c.lineWidth=1.6;const a0=(rd?T/250:0)+i;for(let k=0;k<3;k++){c.beginPath();c.ellipse(x+16,y+21-k*4,10-k*2.5,4-k*.8,0,a0+k,a0+k+4.2);c.stroke()}break}
  case'swing':x+=16;/* 2マスのまん中 */if(PSPR.swing&&PSPR.swing.ok){if(c._part!=='part')shadow(c,x+16,y+29,15,3);const g=PSPR.swing,w=38,h=w*g.h/g.w;if(c._part||!ICON&&i!=null&&now!=null&&toyUsers(i).length){const s0=w/80,L0=x+16-w/2,T0=y+30-h,d=c._neutral?0:swAng(i,now),sk=1+d*.12,sy=T0+48*s0+d*6;/* わくはそのまま、つなと座面だけゆらす */if(c._part!=='part'){c.save();c.beginPath();c.rect(L0,T0,w,h);c.rect(L0+60*s0,T0+8*s0,-40*s0,48*s0);c.clip('evenodd');c.drawImage(g.img,L0,T0,w,h);c.restore()}if(c._part==='base')break;const hw=19*s0*sk;c.strokeStyle='#d8c08e';c.lineWidth=1;c.beginPath();c.moveTo(L0+25.5*s0,T0+6*s0);c.lineTo(x+16-hw+4.5*s0,sy-3*s0);c.moveTo(L0+53.5*s0,T0+6*s0);c.lineTo(x+16+hw-4.5*s0,sy-3*s0);c.stroke();c.drawImage(g.img,21,43,38,11,x+16-hw,sy-5*s0*sk,hw*2,11*s0*sk)}else c.drawImage(g.img,x+16-w/2,y+30-h,w,h);break}/* 乗っているとゆれる */shadow(c,x+16,y+29,13,3);c.strokeStyle='#6d4424';c.lineWidth=3;c.beginPath();c.moveTo(x+4,y+29);c.lineTo(x+8,y-6);c.lineTo(x+12,y+29);c.moveTo(x+20,y+29);c.lineTo(x+24,y-6);c.lineTo(x+28,y+29);c.moveTo(x+8,y-6);c.lineTo(x+24,y-6);c.stroke();c.strokeStyle='#ddd';c.lineWidth=1;c.beginPath();c.moveTo(x+12,y-6);c.lineTo(x+12,y+16);c.moveTo(x+20,y-6);c.lineTo(x+20,y+16);c.stroke();c.fillStyle='#e86a6a';c.fillRect(x+10,y+16,12,3);break;
  case'fruit':{shadow(c,x+16,y+29,12,3.5);c.fillStyle='#9a6a48';c.beginPath();c.moveTo(x+11,y+29);c.quadraticCurveTo(x+14,y+24,x+14,y+16);c.lineTo(x+18,y+16);c.quadraticCurveTo(x+18,y+24,x+21,y+29);c.fill();
    for(const[dx,dy,r,col]of[[-8,1,7.5,'#5a9441'],[8,1,7.5,'#5a9441'],[-5,-7,8,'#6ea84e'],[5,-7,8,'#6ea84e'],[0,-11,8,'#86bf63'],[0,-1,9,'#78b257'],[-3,-10,3.5,'#9fd07c']])circ(c,x+16+dx,y+13+dy,r,col);
    tuft(c,x+7,y+30,.6,'#7ab35a');tuft(c,x+25,y+30,.6,'#7ab35a');
    if(g>=100)for(const[dx,dy]of[[-6,-1],[5,-6],[7,3]]){const fx2=x+16+dx,fy=y+13+dy;circ(c,fx2,fy,3.6,'#e8604f');c.fillStyle='#7a4a2a';c.fillRect(fx2-.5,fy-5,1.1,2.4);circ(c,fx2-1.2,fy-1.2,1,'rgba(255,255,255,.4)')}break}
  case'ladder_wood':case'ladder_bamboo':{/* ハシゴ（コードの絵）：オークは木の色、竹はうすい緑で節つき。正面は、がけに立てかけて、上のマスのふちまで。横向きは、ななめに */const bb=id==='ladder_bamboo',RC=bb?'#b8c26a':'#c08f58',RD=bb?'#8e9c44':'#8a5f35',RL=bb?'#dde39a':'#dcae72',d=i!=null&&S&&!ICON?ladderDir(i):0;
    const rail=(x1,y1,x2,y2)=>{c.lineCap='round';c.strokeStyle=RD;c.lineWidth=3.2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=RC;c.lineWidth=2.2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=RL;c.lineWidth=.7;c.beginPath();c.moveTo(x1-.5,y1);c.lineTo(x2-.5,y2);c.stroke()};
    const rung=(x1,y1,x2,y2)=>{c.strokeStyle=RD;c.lineWidth=2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=bb?'#cfd683':'#cf9f66';c.lineWidth=1.1;c.beginPath();c.moveTo(x1,y1-.3);c.lineTo(x2,y2-.3);c.stroke()};
    const lad=(x1,x2,top,bot)=>{for(let yy=bot-4;yy>top+2;yy-=5)rung(x1+.5,yy,x2-.5,yy);rail(x1,top,x1,bot);rail(x2,top,x2,bot);if(bb)for(const xx of[x1,x2])for(let yy=bot-7;yy>top+1;yy-=10){c.fillStyle=RD;c.fillRect(xx-1.6,yy,3.2,1)}};/* まっすぐ立てたハシゴ（竹は節つき） */
    if(d<=0||ICON){const top=ICON?y+2:y-LIFT-1,bot=ICON?y+TS-3:y+2;if(!ICON){c.fillStyle='rgba(40,30,20,.16)';c.fillRect(x+10,top+2,15,bot-top-2)}/* がけにおちるかげ */lad(x+9,x+23,top,bot)}/* 正面：がけの正面だけ（下のマスにはみ出さない） */
    else{const x0=d===1?x+.5:x+TS-4.5,ya=y+8,yb=y+24;/* 横向き：がけのよこに立てかけたハシゴを真上から見た形。ほぼ一本の線（はばの向きに、がけのふちにそって）。両はしがレールの頭 */
      c.fillStyle='rgba(40,30,20,.18)';c.fillRect(d===1?x0+4:x0-1.5,ya+1,1.5,yb-ya);/* かげ */
      c.fillStyle=RD;c.fillRect(x0,ya,4,yb-ya);c.fillStyle=RC;c.fillRect(x0+.6,ya+.6,2.8,yb-ya-1.2);c.fillStyle=RL;c.fillRect(x0+.6,ya+.6,1,yb-ya-1.2);/* いちばん上の段（上から見ると、この線だけ見える） */
      for(const yy of[ya,yb-4]){c.fillStyle=RD;c.fillRect(x0-.5,yy,5,4);c.fillStyle=RC;c.fillRect(x0+.2,yy+.6,3.6,2.8);c.fillStyle=RL;c.fillRect(x0+.2,yy+.6,3.6,.8)}}/* レールの頭 */
    break}
  case'bridge':{/* 木の橋（仮の絵）：わたる向きに板をならべ、両がわに手すり */const wt=k=>k>=0&&k<W*H&&S.ground[k]===1&&S.obj[k]!=='bridge',hz=i==null||!S?true:(wt(i-W)||wt(i+W))&&!(wt(i-1)&&wt(i+1))||!(wt(i-W)||wt(i+W))&&!(wt(i-1)||wt(i+1));const D='#8a5f35',M='#b98a55',L='#d2a46c';
    c.fillStyle='rgba(20,40,60,.22)';if(hz)c.fillRect(x,y+24,TS,4);else c.fillRect(x+24,y,4,TS);
    if(hz){c.fillStyle=M;c.fillRect(x,y+7,TS,17);c.fillStyle=D;for(let k=0;k<=TS;k+=5)c.fillRect(x+k,y+7,.8,17);c.fillStyle=L;c.fillRect(x,y+7,TS,1.2);c.fillStyle=D;c.fillRect(x,y+4,TS,2.4);c.fillRect(x,y+23,TS,2.4)}
    else{c.fillStyle=M;c.fillRect(x+7,y,17,TS);c.fillStyle=D;for(let k=0;k<=TS;k+=5)c.fillRect(x+7,y+k,17,.8);c.fillStyle=L;c.fillRect(x+7,y,1.2,TS);c.fillStyle=D;c.fillRect(x+4,y,2.4,TS);c.fillRect(x+23,y,2.4,TS)}
    break}
  case'well':shadow(c,x+16,y+29,13,3);c.fillStyle='#7d8088';rr(c,x+5,y+14,22,15,4);c.fillStyle='#a3a6ae';rr(c,x+5,y+12,22,6,3);c.fillStyle='#3a8cc4';c.fillRect(x+8,y+13,16,3);c.fillStyle='#6d4424';c.fillRect(x+6,y-4,3,18);c.fillRect(x+23,y-4,3,18);c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+2,y-2);c.lineTo(x+16,y-10);c.lineTo(x+30,y-2);c.fill();c.strokeStyle='#ddd';c.lineWidth=1;c.beginPath();c.moveTo(x+16,y-2);c.lineTo(x+16,y+9);c.stroke();c.fillStyle='#8a5a33';c.fillRect(x+13,y+8,6,4);break;
  case'windmill':{if(c._part!=='part'){shadow(c,x+16,y+29,12,3);c.fillStyle='#f1e2c4';c.beginPath();c.moveTo(x+8,y+29);c.lineTo(x+12,y-4);c.lineTo(x+20,y-4);c.lineTo(x+24,y+29);c.fill();c.fillStyle='#8a5a33';c.fillRect(x+13,y+19,6,10);c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+10,y-3);c.lineTo(x+16,y-11);c.lineTo(x+22,y-3);c.fill()}
    const a=c._neutral?0:(now||0)/900;if(c._part!=='base'){c.save();c.translate(x+16,y-4);c.rotate(a);c.fillStyle='#fff';for(let k=0;k<4;k++){c.rotate(Math.PI/2);c.fillRect(-2,2,4,15);c.fillStyle='#e9e2d0';c.fillRect(-2,8,4,2);c.fillStyle='#fff'}c.restore();circ(c,x+16,y-4,2.4,'#6d4424')}break}

  case'lighthouse':{const T=now||0;shadow(c,x+16,y+29,12,3);c.fillStyle='#eadfc8';c.beginPath();c.moveTo(x+8,y+29);c.lineTo(x+12,y+2);c.lineTo(x+20,y+2);c.lineTo(x+24,y+29);c.fill();c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+9.4,y+20);c.lineTo(x+10.6,y+13);c.lineTo(x+21.4,y+13);c.lineTo(x+22.6,y+20);c.fill();c.fillStyle='#8a5a33';rr(c,x+13,y+22,6,7,2);
    c.fillStyle='#3a3f4a';c.fillRect(x+10,y-3,12,6);const f=.65+.35*Math.sin(T/260);c.fillStyle='rgba(255,215,110,'+f+')';c.fillRect(x+12,y-2,8,4);c.fillStyle='#c4523f';c.beginPath();c.moveTo(x+9,y-3);c.lineTo(x+16,y-11);c.lineTo(x+23,y-3);c.fill();
    c.fillStyle='rgba(255,225,140,'+(.18*f)+')';circ(c,x+16,y,9,c.fillStyle);break}
  case'stele':{shadow(c,x+16,y+30,15,3);c.fillStyle='#8d9098';c.beginPath();c.moveTo(x,y+31);c.lineTo(x+1,y-4);c.quadraticCurveTo(x+16,y-16,x+31,y-4);c.lineTo(x+32,y+31);c.fill();c.fillStyle='#a8abb3';c.beginPath();c.moveTo(x+4,y+29);c.lineTo(x+5,y-2);c.quadraticCurveTo(x+10,y-9,x+17,y-10);c.lineTo(x+12,y+29);c.fill();
    c.strokeStyle='#5d616b';c.lineWidth=1.8;c.beginPath();c.moveTo(x+16,y+1);c.lineTo(x+16,y+18);c.moveTo(x+9,y+7);c.lineTo(x+23,y+7);c.moveTo(x+11,y+13);c.lineTo(x+21,y+13);c.stroke();
    c.fillStyle='#6ea84e';rr(c,x,y+25,9,6,3);rr(c,x+22,y+27,10,4,2);tuft(c,x+14,y+31,.6,'#7ab35a');break}
  case'fountain':{const t=(now||0)/1000;shadow(c,x+16,y+28,15,3.5);
    for(const[dx,dy]of[[-12,-2],[12,-2]])circ(c,x+16+dx,y+17+dy,4,'#5a9441');
    c.fillStyle='#b8ada0';c.beginPath();c.ellipse(x+16,y+22,14,7,0,0,7);c.fill();c.fillStyle='#cdc3b6';c.beginPath();c.ellipse(x+16,y+20,14,6.5,0,0,7);c.fill();
    c.fillStyle='#7fbde6';c.beginPath();c.ellipse(x+16,y+20,10.5,4.2,0,0,7);c.fill();c.fillStyle='#a6d4f2';c.beginPath();c.ellipse(x+14,y+19,6,2,0,0,7);c.fill();
    for(let k=0;k<8;k++){const a=k/8*6.283;c.fillStyle=k%2?'#c4b9ab':'#d6ccbf';c.beginPath();c.ellipse(x+16+Math.cos(a)*12.5,y+21+Math.sin(a)*5.6,3.4,2.4,0,0,7);c.fill()}
    c.fillStyle='#b8ada0';rr(c,x+13,y+8,6,12,2);c.fillStyle='#cdc3b6';c.beginPath();c.ellipse(x+16,y+8,7,2.6,0,0,7);c.fill();c.fillStyle='#7fbde6';c.beginPath();c.ellipse(x+16,y+7.6,5,1.6,0,0,7);c.fill();
    circ(c,x+16,y+4,2.6,'#c4b9ab');circ(c,x+15.3,y+3.4,1,'#ddd4c8');
    c.strokeStyle='rgba(168,214,245,.85)';c.lineWidth=1.4;for(const sx of[-1,1]){c.beginPath();c.moveTo(x+16+sx*5,y+8);c.quadraticCurveTo(x+16+sx*8,y+9,x+16+sx*8,y+18);c.stroke()}
    for(let k=0;k<4;k++){const ph=(t*1.6+k/4)%1,sx=k%2?1:-1;circ(c,x+16+sx*(8+ph*2),y+18-ph*1.5,.9+ph*.5,'rgba(255,255,255,'+(1-ph)+')')}break}
  case'statue':{tBase(c,x,y);const T=now||0;
    c.fillStyle=TCD;rr(c,x-6,y+12,TS+12,9,4);c.fillStyle=TCR;rr(c,x-5,y+11,TS+10,5,3);c.fillStyle='rgba(91,143,214,.35)';c.beginPath();c.ellipse(x+16,y+14,9,2.6,0,0,7);c.fill();
    for(const px of[x,x+26]){c.fillStyle=TCR;rr(c,px,y-10,6,22,2);c.fillStyle=TCD;c.fillRect(px+4,y-10,2,22);c.fillStyle=TBL;c.fillRect(px-.5,y-11,7,2.5);c.fillRect(px-.5,y+9,7,2);c.fillStyle=TGO;c.fillRect(px-.5,y-12.5,7,1.5)}
    c.fillStyle=TCD;c.beginPath();c.moveTo(x-4,y-12);c.lineTo(x+16,y-27);c.lineTo(x+36,y-12);c.closePath();c.fill();c.fillStyle=TCR;c.beginPath();c.moveTo(x-1,y-13);c.lineTo(x+16,y-25);c.lineTo(x+33,y-13);c.closePath();c.fill();
    c.fillStyle=TCS;c.fillRect(x-4,y-13,40,3);c.fillStyle=TBL;c.fillRect(x-4,y-11,40,1.5);tStar(c,x+16,y-18,4.5);
    const fy=Math.sin(T/700)*1.5,gl=.55+Math.sin(T/450)*.2;const gg=c.createRadialGradient(x+16,y+2+fy,1,x+16,y+2+fy,13);gg.addColorStop(0,'rgba(140,200,255,'+gl+')');gg.addColorStop(1,'rgba(140,200,255,0)');c.fillStyle=gg;c.fillRect(x+3,y-11,26,26);
    c.fillStyle=TBL2;c.beginPath();c.moveTo(x+16,y-8+fy);c.lineTo(x+21,y+1+fy);c.lineTo(x+16,y+10+fy);c.lineTo(x+11,y+1+fy);c.closePath();c.fill();c.fillStyle='#e6f2ff';c.beginPath();c.moveTo(x+16,y-6+fy);c.lineTo(x+18,y+1+fy);c.lineTo(x+16,y+7+fy);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.75)';c.fillRect(x+15.4,y-12+fy+Math.sin(T/300)*1,1.2,1.2);break}
  case'obox':{tBase(c,x,y);shadow(c,x+16,y+25,14,3);
    c.fillStyle=TCD;rr(c,x+3,y+4,26,20,3);c.fillStyle=TCR;rr(c,x+3,y+2,26,6,3);c.fillStyle='#6e4a30';rr(c,x+7,y+3,18,4,1.5);c.fillStyle=TGO;c.fillRect(x+7,y+3,18,1);
    for(const px of[x+3,x+25]){c.fillStyle='#e6dccb';rr(c,px,y+8,4,15,1.5);c.fillStyle=TBL;c.fillRect(px,y+9,4,1.6);c.fillStyle=TGO;c.fillRect(px,y+21,4,2)}
    tStar(c,x+16,y+15,5);c.fillStyle=TCS;c.fillRect(x+3,y+22,26,2);break}
  case'altar':{c.fillStyle=TCS;rr(c,x-2,y+1,TS+4,TS-2,6);c.fillStyle=TCR;rr(c,x-1,y,TS+2,TS-6,6);c.fillStyle=TCD;rr(c,x+1,y+TS-9,TS-2,4,2);
    const tw=now?Math.sin(now/500)*.5+.5:.6;c.fillStyle='rgba(91,143,214,'+(.25+tw*.2)+')';c.beginPath();c.ellipse(x+16,y+12,11,6,0,0,7);c.fill();c.strokeStyle=TGO;c.lineWidth=1.2;c.beginPath();c.ellipse(x+16,y+12,11,6,0,0,7);c.stroke();
    c.fillStyle='rgba(143,186,240,'+(.6+tw*.3)+')';c.beginPath();c.ellipse(x+16,y+12,5,2.6,0,0,7);c.fill();
    for(let k=0;k<4;k++){const an=k*Math.PI/2+(now||0)/1400;circ(c,x+16+Math.cos(an)*11,y+12+Math.sin(an)*6,1.1,'#bfe0ff')}break}
  case'board':{tBase(c,x,y);shadow(c,x+16,y+26,13,3);
    c.fillStyle='#6e4a30';c.fillRect(x+5,y-6,4,32);c.fillRect(x+25,y-6,4,32);circ(c,x+7,y-8,2.4,TGO);circ(c,x+27,y-8,2.4,TGO);
    c.fillStyle='#7d5238';c.beginPath();c.moveTo(x+3,y+16);c.lineTo(x+3,y-3);c.quadraticCurveTo(x+17,y-10,x+31,y-3);c.lineTo(x+31,y+16);c.closePath();c.fill();
    c.fillStyle='#b98a5e';rr(c,x+6,y-1,23,15,1.5);c.fillStyle='#a57a50';c.fillRect(x+6,y+5,23,1);
    circ(c,x+17,y-6,5,'#2f4f86');tStar(c,x+17,y-6,4);
    const n=ICON?3:S.orders.length;const px=[[7,1],[14,2],[21,1]];for(let k=0;k<Math.min(3,n);k++){const[a,b]=px[k];c.fillStyle='#f6ecd6';rr(c,x+a,y+b,6,9,1);c.fillStyle='#d4c3a2';c.fillRect(x+a+1,y+b+3,4,.8);c.fillRect(x+a+1,y+b+5,3,.8);circ(c,x+a+3,y+b+.5,.9,'#8a5a33')}
    tBanner(c,x+31,y-4,12,now);break}
  case'site2':{if(!ICON){/* 大きな足場は本体（site）がまとめて描くので、ここは足もとの資材だけ */c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.ellipse(x+16,y+27,12,3,0,0,7);c.fill();
      c.fillStyle='#b98a58';c.fillRect(x+7,y+21,18,3);c.fillStyle='#a87a4a';c.fillRect(x+9,y+18,16,3);c.fillStyle='#9a9a94';circ(c,x+24,y+24,3,'#a8a8a0');break}
    if(SPR.site.ok){shadow(c,x+16,y+29,14,3);if(i%2){c.save();c.translate(x+16,0);c.scale(-1,1);c.drawImage(SPR.site.img,-17,y+1,34,30);c.restore()}else c.drawImage(SPR.site.img,x-1,y+1,34,30);break}shadow(c,x+16,y+29,14,3);c.fillStyle='#c9a46a';c.fillRect(x+3,y+20,26,8);c.strokeStyle='#8a5a33';c.lineWidth=2.5;c.beginPath();c.moveTo(x+5,y+28);c.lineTo(x+5,y+6);c.moveTo(x+27,y+28);c.lineTo(x+27,y+6);c.moveTo(x+5,y+10);c.lineTo(x+27,y+10);c.stroke();break}
  case'tower':{shadow(c,x+16,y+29,16,4);c.fillStyle='#9ea4ad';rr(c,x+2,y+20,28,9,3);c.fillStyle='#b8bcc4';rr(c,x+4,y+18,24,5,2);c.fillStyle='#c4523f';c.fillRect(x+7,y-8,4,28);c.fillRect(x+21,y-8,4,28);c.fillRect(x+3,y-12,26,4);c.fillRect(x+5,y-4,22,3);c.fillStyle='#8a2f22';c.fillRect(x+1,y-14,30,3);
    const p=(now||0)/600;const gl=c.createRadialGradient(x+16,y+6,1,x+16,y+6,12);gl.addColorStop(0,'rgba(255,250,200,.95)');gl.addColorStop(1,'rgba(255,220,120,0)');c.fillStyle=gl;c.fillRect(x+2,y-8,28,28);circ(c,x+16,y+6+Math.sin(p)*1.5,4,'#fffbe0');break}
  }
}
/* ---------- 家と屋根 ---------- */
const houseRes=h=>S.res.filter(r=>h.set.has((r.y|0)*W+(r.x|0)));
const COMFMAX=300;// 住み心地の上限
// 住み心地（0〜300）：ベッド・家具・床・人数で決まる。高いとよく眠れて、低いとたのしさが下がる
const COMFR={rockart:1,jar:1,torch:1,clover:1,bellf:1,salvia:1,lily:1,lotus:1,lamp:2,vane:2};/* 家の外でも住み心地に入る範囲（マス） */
const COMFY={takebench:5,takeakari:5,shishiodoshi:6,hoshirug:5,mimamori:6,yomawari:6,oyasumi:8,yonaka:10,toro:6,stool:2,stable:4,pouf:3,achair:5,ltable:5,rug1:5,sofa1:6,rug2:6,tub:3,sink:4,crate:6,monstera:10,shelf1:12,wreath:10,curtain1:10,cabinet:12,paint2:10,shelf2:13,curtain2:10,paint3:10,wshelf:12,paint1:14,bathtub:16,candle:3,lantern:5,flamp:6,window:5,bed:10,table:8,chair:4,oven:6,lamp:6,torch:4,bench:5,jar:5,rockart:5,chochin:6,furin:8,ema:8,komainu:10,kadomatsu:10,vane:4,clover:4,bellf:4,salvia:4,lily:4,lotus:4,stor:3,mbox:3};
function houseComfort(h){let bed=0,furn=0,fl=0,n=0;const seen=new Set();
  const kc={};for(const j of h.inside){n++;if(S.floor[j])fl++;const o=S.obj[j];if(!o)continue;if(BEDSET.has(o)){bed++;continue}/* ベッド（よぞらのベッドも）は数だけ */if(!COMFY[o])continue;{kc[o]=(kc[o]||0)+1;furn+=COMFY[o]*(kc[o]>2?.5:1);seen.add(o)}}/* 同じ家具は2つまで。3つ目からは半分 */
  for(const o of rugsIn(h.inside)){if(!COMFY[o])continue;kc[o]=(kc[o]||0)+1;furn+=COMFY[o]*(kc[o]>2?.5:1);seen.add(o)}/* ラグ（家の中に1マスでもかかっていれば） */
  {const M=2;for(let y=h.y0-M;y<=h.y1+M;y++)for(let x=h.x0-M;x<=h.x1+M;x++){if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(h.set.has(j))continue;const o=S.obj[j],rg=COMFR[o];if(!rg||!COMFY[o])continue;const d=Math.max(h.x0-x,x-h.x1,h.y0-y,y-h.y1,0);if(d>rg)continue;kc[o]=(kc[o]||0)+1;furn+=COMFY[o]*(kc[o]>2?.5:1);seen.add(o)}}/* かざりは、家のそば（ものごとの範囲）にあっても住み心地に入る */
  {let wn=0;for(const j of h.set)if(S.win&&(S.win[j]===1||S.win[j]==='curtain1'||S.win[j]==='curtain2'))wn++;/* カーテンの下にも窓がある */if(wn){furn+=COMFY.window*Math.min(wn,2)+COMFY.window*.5*Math.max(0,wn-2);seen.add('window')}}/* 窓 */
  for(const j of h.set){const p=S.win&&S.win[j];if(p&&p!==1&&COMFY[p]){kc[p]=(kc[p]||0)+1;furn+=COMFY[p]*(kc[p]>2?.5:1);seen.add(p)}}/* 壁にかけた絵 */
  const cap=houseCap(h),over=Math.max(0,bed-cap);/* きゅうくつかどうかは、ベッドの数で決まる */
  let lit=false;for(let y=h.y0-1;y<=h.y1+1&&!lit;y++)for(let x=h.x0-1;x<=h.x1+1;x++){if(x<0||y<0||x>=W||y>=H)continue;if(LIGHTF.has(S.obj[y*W+x])){lit=true;break}}/* 家の中か、すぐそばに灯り */
  let rs=0;for(const k of['shosai','living'])if(SPOTI.some(t=>t.sp.k===k&&h.inside.has(t.j)&&t.sp.need.every((nd,i)=>t.found[i].filter(q=>h.inside.has(q)).length>=nd[1])))rs++;/* そろった物が、ぜんぶその家の中にあるときだけ *//* しょさい・リビング：住み心地+5% */
  const v=Math.round(Math.max(0,Math.min(COMFMAX,(15+Math.min(210,furn)+(n?fl/n:0)*45-over*105-(lit?0:60))*(1+.05*rs))));/* 上限は300 */
  return{v,bed,cap,lit,kinds:seen.size,floorPct:n?Math.round(fl/n*100):0,over}}



const LIGHTF=new Set(['torch','lamp','lantern','candle','flamp','yomawari','toro','takeakari']);/* 灯りになる家具 */
// すきな家具：その家具が家にあると、そのせいれいにとっての住み心地が上がる（名前から決まる）
const LIKEF=['rockart','jar','vane','bench','table','torch','candle','lantern','sofa1','achair','rug1','monstera','shelf1','paint1','curtain1','birdbath','parasol','stool','pouf'];
/* 新しいせいれいが来たときのひとこと。性格：木=げんき・土=のんびり・火=らんぼう（あねご／あにき）・水=知的・風=キザ・高貴 */
const HELLO={wood:["#wave|やっほー！ $だよ！ よろしくね！", "#wave|わーい、緑のにおいがする！ $だよ、よろしく！", "はじめまして、$だよ！ いっぱい植えるね！", "来たよー！ $っていうんだ。なにしてあそぶ？", "$、ただいま到着！ 今日からここのせいれいだよ！", "#surprise|わあ、ひろーい！ $だよ、走りまわってもいい？", "#wave|こんにちは！ $だよ。お花、いっぱい咲かせようね！", "$だよ！ 元気だけは、だれにも負けないよ！", "#wave|ねえねえ、ここが新しいおうち？ $だよ、よろしくね！", "$参上！ 木も花も、ぼくにおまかせ！"],
 earth:["#surprise wave|ふわぁ…。$だよぉ。よろしくねぇ。", "ここ、土があったかいねぇ。$だよぉ、のんびりいこうねぇ。", "#wave|あわてない、あわてない…。$だよぉ、よろしくねぇ。", "$だよぉ。…ちょっとお昼寝してから、はたらくねぇ。", "いい土のにおいだねぇ。$っていうんだぁ。", "ゆっくり来たら、おそくなっちゃったぁ。$だよぉ。", "$だよぉ。畑のことなら、まかせてねぇ。", "ふぅ…ついたぁ。$だよぉ。ここ、落ち着くねぇ。", "#wave|おひさまがきもちいいねぇ。$だよぉ、よろしくねぇ。", "$だよぉ。みんなで、のんびりやろうねぇ。"],
 fireA:["#alarm|あたしは$！ 「コワイノ」なんざ、ぶっとばしてやるよ！", "へえ、いい村じゃないか。$だよ、夜はあたしにまかせときな！", "$だ！ ぐずぐずしてると、置いてくよ！", "$だよ。あたしが来たからには、もう安心しな！", "ちょいと、寒いねここは。$だ、あっためてやるよ！", "$さ。弱いせいれいをいじめるやつは、あたしがゆるさないよ！", "#wave|あんたが守り神かい？ $だ、よろしく頼むよ！", "$だ！ ケンカも料理も、あたしにまかせな！", "#alarm|ふん、「コワイノ」が出るって？ $が相手してやるよ！", "$だよ。めんどうはまとめて見てやるから、ついてきな！"],
 fireB:["#alarm|おう、$だ！ 「コワイノ」が出たら、おれがぶっとばしてやる！", "#wave|へっ、おれが来たからには安心しな！ $だ、よろしくな！", "$だ！ ケンカなら、いつでも買ってやるぜ！", "$だ。夜の見回りは、おれにまかせとけ！", "#wave|おう、守り神！ $だ、よろしく頼むぜ！", "$さまのお出ましだ！ さっさと仕事をよこしな！", "へっ、しけた村だな。$が、もりあげてやるよ！", "$だ！ 弱っちいやつは、おれがまもってやる！", "#alarm|「コワイノ」？ 上等だ。$が全部たいらげてやる！", "$だ！ 腹がへったら、おれがなんか焼いてやるよ！"],
 water:["はじめまして、$です。この土地の水の流れ、興味深いですね。", "$です。水やりの効率なら、わたしにおまかせください。", "#nod wave|なるほど、ここが…。$です。よろしくおねがいします。", "$と申します。まずは、この土地の水場を調べさせてください。", "#wave|こんにちは、$です。畑の水分量が、少し気になりますね。", "$です。計算どおりなら、ここはもっと豊かになりますよ。", "#sigh|はじめまして。$です。知りたいことがあれば、なんでもどうぞ。", "$です。水は、命の源ですからね。大切に使いましょう。", "#wave|ふむ、空気が乾いていますね。$です、よろしくおねがいします。", "$です。この村の記録、あとで読ませてもらえますか？"],
 wind:["お初にお目にかかります、守り神さま。風の$と申します。", "やあ、いい風が吹いているね。$だ。以後、お見知りおきを。", "風にさそわれて参りました。$です。この村に、さわやかな風をとどけましょう。", "ごきげんよう。$と申します。どうぞよしなに。", "$です。遠い空から、まいりました。", "この丘を渡る風は、なかなか上品ですね。$と申します。", "#joy|ようこそ、ではなく…お招きありがとう、かな。$だよ。", "$です。ふしぎな種を見つけたら、真っ先にお届けしましょう。", "#wave|風のうわさで、ここを知りました。$です、よろしく。", "$と申します。この村の空、わたしが守りましょう。"]};
const BACKL={wood:["#joy|ふっかつ！ また会えてうれしいよ！", "わーい、もどってこられた！ またいっぱい遊ぼうね！", "#joy|守り神さまが呼んでくれたんだね！ ありがとう！", "もどってきたよ！ やっぱりここが大好き！", "また会えたね！ 今度は気をつけるよ！"],earth:["#surprise|ふわぁ…ながーいお昼寝してたみたいだねぇ。", "#joy|また呼んでくれたんだぁ。ありがとうねぇ。", "#wave|もどってこられたよぉ。のんびり、またよろしくねぇ。", "ん…ここは…。あぁ、みんなのところだねぇ。", "#joy|またみんなに会えて、うれしいなぁ。"],fireA:["ふん、あたしがこれくらいでくたばるもんかい！", "呼んでくれて、ありがとよ。借りは返すよ！", "#danger|もどったよ！ さあ、やられた分をとりかえすよ！", "また会えたね。今度は、だれにも負けないよ！", "ちょいと休んでただけさ。さあ、はたらくよ！"],fireB:["へっ、おれがこれくらいでくたばるかよ！", "呼んでくれて、ありがとな。この借りは返すぜ！", "#danger|もどったぜ！ やられた分、きっちりとりかえす！", "ちょっと休んでただけだ。さあ、暴れるぞ！", "また会えたな。今度こそ、負けねえ！"],water:["#joy|もどってこられたようですね。呼んでくださって、ありがとうございます。", "前回の反省は、しっかり活かします。", "#wave|ふむ…意識がもどりました。またよろしくおねがいします。", "#joy|また、みなさんと過ごせるのですね。うれしいです。", "消えていたあいだのこと、あとで教えてくださいね。"],wind:["風はまた、この村に吹きますよ。", "お呼びいただき、光栄です。ふたたびお仕えしましょう。", "ふたたび、この空を飛べるとは。感謝いたします。", "#wave|少し遠回りをしてしまいました。また、よろしくたのみます。", "風は消えません。ふたたび参上いたしました。"]};
const KEYHELLO={'ノドカ':'#surprise|ふわぁ…。よく寝たぁ。ここが新しいおうちかなぁ。','ホノ':'#wave|ホノだ！ へっ、思ったより、あったけえ村じゃねえか。よろしくな！','アオ':'アオと申します。……この土地の水の流れ、さっそく調べさせてください。','フウ':'フウだよ。……フッ、ここは風の通りが、なかなか悪くないね。','シズク':'…はじめまして。シズクと申します。温泉の湯気に、水の力を感じたものですから。'};
const DEATHL2={wood:n=>[n+'が…！','…ふつうのせいれいは、このままじゃもどってこないんだって。オオカゲが落とす「めぶきのしずく」があれば、べつだけど…。','#danger|おなかをすかせないように、「コワイノ」からも守ってあげなきゃ…。'],
 earth:n=>[n+'#teary|が…消えちゃったねぇ…。','…ふつうのせいれいは、このままだと、もどってこないんだよぉ。オオカゲが落とす「めぶきのしずく」があれば、よみがえれるかもねぇ。','みんなのこと、もっと大事にしようねぇ…。'],
 fireA:n=>[n+'#danger|！ …ちくしょう、やられちまったか。','消えたせいれいは、このままじゃもどってこない。オオカゲが落とす「めぶきのしずく」でもなけりゃね。','…二度とこんな思いはさせないよ。守りをかためな。'],
 fireB:n=>[n+'#danger|！ …くそっ、やられちまったか。','消えたやつは、このままじゃもどってこねえ。オオカゲが落とす「めぶきのしずく」があれば、話はべつだ。','…二度とこんな思いはさせねえ。守りをかためようぜ。'],
 water:n=>[n+'が…消えてしまいました。','残念ですが、このままでは、もどってきません。オオカゲが落とす「めぶきのしずく」があれば、よみがえらせられます。','食料と守りを、見なおしておきましょう。'],
 wind:n=>[n+'が…風に消えてしまった。','フッ…このままでは、もどってこない。オオカゲが落とす「めぶきのしずく」があれば、あるいは…。','…この悲しみは、もうくりかえさないさ。']};
const MEBUKIL={wood:['それ、「めぶきのしずく」だ！ オオカゲがためこんでた、いのちの力なんだって。','#teary|これを使うと、消えちゃったせいれいがもどってきてくれるんだ！'],
 earth:['それ、「めぶきのしずく」だねぇ。オオカゲがためこんでた、いのちの力なんだってぇ。','#teary|これを使うと、消えちゃったせいれいがもどってきてくれるんだよぉ。'],
 fireA:['そいつは「めぶきのしずく」だね。オオカゲがためこんでた、いのちの力さ。','こいつを使えば、消えたせいれいがもどってくるよ。大事にしな。'],
 fireB:['そいつは「めぶきのしずく」だな。オオカゲがためこんでた、いのちの力だ。','こいつを使えば、消えたせいれいがもどってくるぜ。'],
 water:['それは「めぶきのしずく」です。オオカゲがためこんでいた、いのちの力ですね。','これを使えば、消えたせいれいがもどってきてくれます。'],
 wind:['フッ…それは「めぶきのしずく」。オオカゲがためこんでいた、いのちの力さ。','これを使えば、消えたせいれいが、もどってくるよ。']};
const DEATHL={wood:n=>[n+'が…！','…でも、だいじょうぶ。','次の朝、神殿で、'+n+'を呼びもどせるんだ。','新しいなかまより先に、'+n+'がもどってくるからね。'],
 earth:n=>[n+'#teary|が…消えちゃったねぇ…。','…でも、だいじょうぶだよぉ。','次の朝、神殿で、'+n+'を呼びもどせるんだぁ。','新しいなかまより先に、'+n+'がもどってくるよぉ。'],
 fireA:n=>[n+'#danger|！ …ちくしょう、やられちまったか。','しょげてる場合じゃないよ。','次の朝、神殿で、'+n+'を呼びもどせるよ。','新しいなかまより先に、'+n+'がもどってくる。待ってな。'],
 fireB:n=>[n+'#danger|！ …くそっ、やられちまったか。','しょげてる場合じゃねえ。','次の朝、神殿で、'+n+'を呼びもどせるぜ。','新しいなかまより先に、'+n+'がもどってくる。待ってろよ。'],
 water:n=>[n+'が…消えてしまいました。','落ち着いてください。','次の朝、神殿で、'+n+'を呼びもどせます。','新しいなかまより先に、'+n+'がもどってくるはずです。'],
 wind:n=>[n+'が…風に消えてしまいました。','どうか、お気をおとさずに。','次の朝、神殿で、'+n+'を呼びもどせますよ。','新しいなかまより先に、'+n+'がもどってまいります。']};
function elemKey(r){if(KEYVR[r.name]&&KEYVR[r.name].pk)return KEYVR[r.name].pk;let h=0;for(const ch of r.name)h=(h*17+ch.charCodeAt(0))>>>0;return r.elem==='fire'?(WD===0?'fireB':h%2?'fireA':'fireB'):r.elem}/* 火のせいれいは名前で、あねご／あにき */
function sayLine(r){const L=[],fav=FOODS[favDish(r)],m=bestMate(r);
  if(r.coffin||r.act&&(r.act.type==='bury'||r.act.type==='pray'))return 'さみしいなぁ…';/* お墓へ向かう・埋葬するあいだ、タップしたときのひとこと */
  if(r.hunger<30)return 'おなかすいた…';if(r.energy<25)return 'ねむたいなぁ…';
  if(isNight()&&S.enemies.some(e=>e.spawned&&!e.dead))return r.elem==='fire'?'「コワイノ」なんて、こわくない！':'「コワイノ」、こわいね…';
  if(cnt('stor')&&S.food<3)return '食料箱が、もうすぐからっぽだよ';
  if((r.cryU||0)>S.t)return 'さみしいなぁ…';
  if(S.today)L.push({hosaku:'きょうは畑がにぎやか！',oshaberi:'きょうは、おしゃべりしたい気分！',odayaka:'今夜は静かになりそう',kaze:'風がつよいね！ 種がとんでくるよ',kami:'カミサマが来てるよ！',hoshi:'今夜は星がきれいなんだって',mono:'落とし物、さがしにいこう！'}[S.today]);
  if(S.ns&&S.ns.rw&&hour()<12)L.push('ゆうべは、ぶじでよかった！');
  if(!HOUSES.length)L.push('みんなの家、ほしいなぁ');
  if(GRASSN>=450)L.push('みどりがいっぱいで、うれしいな');else if(GRASSN<60)L.push('もっと草花がふえるといいな');
  if(m)L.push(m.name+'とあそぶの、たのしい！');
  if((S.fs[favDish(r)]||0)>0)L.push('食料箱に'+fav.name+'がある！ たのしみ');else L.push(fav.name+'が食べたいなぁ');
  if(r.fun>=80)L.push('ここでのくらし、たのしいよ');
  L.push(LIKES[r.like]+'がすき！');
  return L[(Math.floor(S.t/30)+r.id)%L.length]}/* 村のようすで、ひとことが変わる */
function helloLine(r){const k=elemKey(r);
  if(r.back)return pick(BACKL[k]);if(KEYHELLO[r.name])return KEYHELLO[r.name];return pick(HELLO[k]).replace('$',r.name)}
const likeF=r=>{if(r.lf&&BL[r.lf])return r.lf;let h=2166136261;for(const ch of r.name+(r.id||0))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;h^=h>>>13;h=Math.imul(h,2246822507)>>>0;h^=h>>>16;r.lf=LIKEF[(h>>>0)%LIKEF.length];return r.lf};/* 好きな家具：ひとりずつちらばる（一度決まったら変わらない） */
const hasLikeF=(h,r)=>{const f=likeF(r);for(const j of h.inside)if(S.obj[j]===f)return true;if(S.win)for(const j of h.set)if(S.win[j]===f)return true;/* 壁にかける物（絵・カーテン） */return RUGS.has(f)&&rugsIn(h.inside).includes(f)};
const likeExtra=(h,r)=>{const f=likeF(r),pt=COMFY[f]||0;if(!pt)return 0;let n=0,t=0;for(const j of h.inside)if(S.obj[j]===f){n++;t+=pt*(n>2?.5:1)}if(RUGS.has(f))for(const o of rugsIn(h.inside))if(o===f){n++;t+=pt*(n>2?.5:1)}if(S.win)for(const j of h.set)if(S.win[j]===f){n++;t+=pt*(n>2?.5:1)}/* 壁にかけた絵・カーテン */return t};/* 好きな家具は、その家具のぶんの住み心地ポイントが2倍 */
const comfyFor=(h,r,C)=>Math.min(COMFMAX,(C||houseComfort(h)).v+likeExtra(h,r));
const comfyStars=v=>'★'.repeat(Math.min(5,Math.max(1,Math.ceil(v/(60)))))+'☆'.repeat(5-Math.min(5,Math.max(1,Math.ceil(v/(60)))));
/* 家の広さで、ちょうどいい人数が決まる（中のマス4つで1人） */
const bedOwner=j=>{const id=(S.bedOwn||{})[j];return id!=null&&BEDSET.has(S.obj[j])?S.res.find(q=>q.id===id)||null:null},myBed=r=>{const B=S.bedOwn||{};for(const k in B)if(B[k]===r.id&&BEDSET.has(S.obj[k]))return +k;return -1},bedFor=(j,r)=>{const o=bedOwner(j);return !o||o===r};/* ベッドの持ち主（いない子のは、だれでも使える） */
const houseCap=h=>Math.max(1,Math.floor(h.inside.size/4))/* 床のマス数の1/4（壁はふくめない）。はじめの家で3人 */,roomOf=j=>HOUSES.find(h=>h.set.has(j)),roomSleepN=h=>S.res.filter(x=>x.act&&(x.act.type==='sleep'||x.act.type==='stay')&&x.act.stand>=0&&h.set.has(x.act.obj!=null?x.act.obj:x.act.stand)).length;
// 屋根がすけて中をのぞいているときは、家の中のせいれいも外と同じに見せる
const peekH=r=>HOUSES.some(h=>h.set.has((r.y|0)*W+(r.x|0))&&roofAOf(h)<.5);
// 木の壁・石垣・ドアだけで囲まれ、ドアがついた場所を家とみなす
let HOUSES=[];
function houseWhy(j0){const isB=j=>{const t=typeAt(j);return t!=='wall'&&t!=='sdoor'&&(HOME_WALLS.has(t)||HOME_DOORS.has(t))};if(!isB(j0))return null;/* 石の塀・石の塀のドアは、家の壁ではない */findHouses();if(HOUSES.some(h=>h.set.has(j0)))return null;
  const comp=new Set([j0]),q=[j0];while(q.length&&comp.size<600){const j=q.pop(),x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(k>=0&&k<W*H&&!comp.has(k)&&isB(k)){comp.add(k);q.push(k)}}}
  if(![...comp].some(j=>HOME_DOORS.has(S.obj[j])))return 'まだ家になっていません。ドアがありません';
  if([...comp].some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const t=typeAt((y+b)*W+x+a);if(t==='wall'||t==='sdoor'||FENCE_IDS.has(t))return true}return false}))return 'まだ家になっていません。かべにすきまがあるか、石の塀や柵がまざっています';
  return 'まだ家になっていません。かべにすきまがあるか、中が広すぎます（中は160マスまで）'}/* 家にならない理由 */
const GLOWM=60,GLOWC=new Map();/* 家の光の絵（家の形をぼかしたもの）。家の形ごとに1回だけ作る */
function houseGlow(h){const key=[...h.set].join(',');let g=GLOWC.get(key);if(g)return g;if(GLOWC.size>40)GLOWC.clear();
  const w=(h.x1-h.x0+1)*TS+GLOWM*2,hh=(h.y1-h.y0+1)*TS+GLOWM*2,D=w+hh;g=document.createElement('canvas');g.width=w;g.height=hh;const c=g.getContext('2d');
  c.beginPath();for(const q of h.set)c.rect((q%W-h.x0)*TS+GLOWM-D,(((q/W)|0)-h.y0)*TS+GLOWM,TS,TS);c.fillStyle='#000';c.shadowColor='rgb(255,205,110)';c.shadowBlur=36;c.shadowOffsetX=D;c.fill();/* canvas には「ぼかす」命令がないので、形は絵の外にかいて、ぼけた影だけを絵の中に出す */
  GLOWC.set(key,g);return g}
function findHouses(){const isB=j=>HOME_WALLS.has(typeAt(j))||HOME_DOORS.has(typeAt(j));const seen=new Uint8Array(W*H),out=[],brk=new Set();for(const b of S.broken||[])if(!S.obj[b.j]&&(HOME_WALLS.has(b.id)||HOME_DOORS.has(b.id)))brk.add(b.j);
  for(let d=0;d<W*H;d++){if(!HOME_DOORS.has(S.obj[d]))continue;const dx0=d%W,dy0=(d/W)|0;
    for(const[ox,oy]of DIRS){const sx=dx0+ox,sy=dy0+oy;if(sx<0||sy<0||sx>=W||sy>=H)continue;const s=sy*W+sx;if(seen[s]||isB(s))continue;
      const cells=[],q=[s];let ok=true;seen[s]=1;
      while(q.length){const j=q.pop();cells.push(j);if(cells.length>160){ok=false;break}const x=j%W,y=(j/W)|0;if(x===0||y===0||x===W-1||y===H-1){ok=false;break}
        for(const[a,b]of DIRS){const k=(y+b)*W+x+a;if(!seen[k]&&!isB(k)){seen[k]=1;q.push(k)}}}
      if(!ok)continue;if(brk.size&&cells.some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(brk.has((y+b)*W+x+a))return true;return false}))continue;/* 壁がこわれたままの所は、家ではない（なおすまで。となりの家の外壁まで屋根がかからない） */
      {const cs=new Set(cells);if(cells.some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(!cs.has(k)&&!isB(k))return true}return false}))continue}/* 角（ななめ）に1マスでもすきまがあれば、家ではない */
      const set=new Set(cells);
      for(const j of cells){const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(isB(k))set.add(k)}}
      {const cs=new Set(cells);if(cells.some(j=>{const x=j%W,y=(j/W)|0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=(y+b)*W+x+a;if(cs.has(k))continue;const t=typeAt(k);if(t==='wall'||t==='sdoor'||FENCE_IDS.has(t))return true}return false}))continue}/* 石の塀（と石のドア）が混ざっていたら、家にならない。家は、壁とドアだけで囲む */
      let x0=W,y0=H,x1=0,y1=0;for(const j of set){const x=j%W,y=(j/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
      let ib=0;for(const j of cells)ib=Math.max(ib,(j/W)|0);/* ib：家の中のいちばん下の行 */
      out.push({set,inside:new Set(cells),x0,y0,x1,y1,ib})}}
  HOUSES=out}
// 屋根：上から見た切妻屋根。いちばん下の列は正面の壁（窓つき）。拡大すると消えて中が見える
/* 屋根は、ズームでは変えない。「みる」では屋根あり、置く・こわすときだけ外して中を見せる */
/* 屋根は家ごと。家をタップすると屋根が消えて中が見える。家の外をタップすると、もどる */
const OPENH=new Set(),ROOFS=new Map(),hKey=h=>h.x0+','+h.y0;
function roofAOf(h){const k=hKey(h);let v=ROOFS.get(k);if(!v){v={a:OPENH.has(k)?0:1};ROOFS.set(k,v)}return v.a}/* 描くときは読むだけ。すけぐあいは stepLooks で進める */
function roofCache(h,sc){/* 屋根の絵は、家ごとに1回だけ描いて使い回す（形がかわるまで） */
  let minx=W,maxx=0,miny=H,maxy=0;for(const j of h.set){const x=j%W,y=(j/W)|0;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y)}
  const ox=minx*TS-3,oy=miny*TS-16,w=(maxx-minx+1)*TS+6,hh=(maxy-miny+1)*TS+26;
  const cv=document.createElement('canvas');cv.width=Math.ceil(w*sc);cv.height=Math.ceil(hh*sc);const c=cv.getContext('2d');c.setTransform(sc,0,0,sc,-ox*sc,-oy*sc);
  {const A=1;
    const top=new Map(),bot=new Map();for(const j of h.set){const x=j%W,y=(j/W)|0;if(!top.has(x)||top.get(x)>y)top.set(x,y);if(!bot.has(x)||bot.get(x)<y)bot.set(x,y)}
    let tx=-1,ty=H;const ys=Math.min(...top.values()),ye=Math.max(...bot.values()),nR=ye-ys+1;const rY=nR<=3?ys*TS+3:nR<=6?(ye-3)*TS+TS/2:(ys+Math.floor((nR-1)/2)-1)*TS+TS/2;/* 棟：3マス以下は一番上の端、6マス以下は下から4マス目、それより大きいと中心のひとつ上 */
    for(const[x,y0]of top){const y1=bot.get(x),px=x*TS,lx=top.has(x-1)?px-.6:px+1,rx=top.has(x+1)?px+TS+.6:px+TS-1,/* となりの列と少し重ねて、すき間の線を出さない */t=y0*TS-11,b=y1*TS+1;if(y0<ty||(y0===ty&&x>tx)){ty=y0;tx=x}

      // 赤茶の瓦。横の列ごとに半分ずらした四角い瓦
      const KW=WD===1;/* 火山のふもとは、黒い瓦。丸がわらを、たてにならべる */
      c.fillStyle=KW?'#2b2c32':'#a06058';c.fillRect(lx,t,rx-lx,b-t);
      c.save();c.beginPath();c.rect(lx,t,rx-lx,b-t);c.clip();
      if(KW){const CW=8,RH=9;for(let col=Math.floor(lx/CW)-1;col*CW<rx+CW;col++){const xx=col*CW;c.fillStyle='#3d3f48';c.fillRect(xx+1,t,CW-3,b-t);c.fillStyle='rgba(175,182,200,.3)';c.fillRect(xx+1.6,t,1.2,b-t);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(xx+CW-2.2,t,1.2,b-t)}
        for(let row=Math.floor(t/RH);row*RH<b+RH;row++){const yy=row*RH;c.fillStyle='rgba(0,0,0,.45)';c.fillRect(lx,yy+RH-1.2,rx-lx,1.2);for(let col=Math.floor(lx/CW)-1;col*CW<rx+CW;col++){c.fillStyle='rgba(210,215,230,.22)';c.fillRect(col*CW+1.6,yy+.8,CW-4.4,1)}}}
      else{const RH=11,SW=14;for(let row=Math.floor(t/RH)-1;row<=Math.ceil(b/RH);row++){const yy=row*RH,off=row%2?SW/2:0;
        for(let k=-1;k<4;k++){const col=Math.floor((px-off)/SW)+k,xx=col*SW+off;c.fillStyle=(hash(col*97+row*13)<.5)?'#a86858':'#9c5e52';c.fillRect(xx+.6,yy+.6,SW-1.2,RH-1.6);c.fillStyle='rgba(205,140,120,.4)';c.fillRect(xx+1.5,yy+1.2,SW-3,1.4);c.fillStyle='rgba(110,55,45,.35)';c.fillRect(xx+SW-1.4,yy+1,1,RH-2.5)}
        c.fillStyle='#7f463e';c.fillRect(lx,yy+RH-1,rx-lx,1.2)}}
      if(rY>t+6&&rY<b-6){c.fillStyle='rgba(60,20,15,.2)';c.fillRect(lx,rY,rx-lx,b-rY);c.fillStyle='rgba(255,225,205,.08)';c.fillRect(lx,t,rx-lx,rY-t);/* 棟より手前の面は少し暗く */}
      c.restore();c.fillStyle=KW?'#1d1e23':'#6e3a30';c.fillRect(lx,b-3,rx-lx,3);c.fillStyle='rgba(0,0,0,.16)';c.fillRect(lx,b,rx-lx,3);/* のき */
      if(rY>t+6&&rY<b-6){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(lx,rY+5,rx-lx,3);c.fillStyle=KW?'#22232a':'#6e3830';c.fillRect(lx,rY-5,rx-lx,10);c.fillStyle=KW?'#5a5d68':'#b06c5e';c.fillRect(lx,rY-5,rx-lx,3);for(let q=Math.floor(lx/9);q*9<rx;q++){const qx=q*9;if(qx>=lx&&qx<rx-1){c.fillStyle='rgba(50,20,15,.55)';c.fillRect(qx,rY-5,1.2,10)}}/* 棟がわら */}
      
      if(!top.has(x-1)){c.fillStyle=(KW?'rgba(15,15,20,.6)':'rgba(110,55,45,.55)');c.fillRect(lx,t,1.5,b-t)}if(!top.has(x+1)){c.fillStyle=(KW?'rgba(15,15,20,.6)':'rgba(110,55,45,.55)');c.fillRect(rx-1.5,t,1.5,b-t)}
      {c.fillStyle='rgba(255,220,200,.18)';c.fillRect(lx,t,rx-lx,1.5)}}
    let chim=null;if(tx>=0){const xr=Math.max(...top.keys()),ccx=top.has(xr-1)?xr-1:xr,yb=bot.get(ccx),ccy=yb-1>top.get(ccx)?yb-1:yb,cx=ccx*TS+TS-10,cy=ccy*TS+8;/* 屋根の右下から、1マスずつ内がわ */chim={cx,cy}}
    return{cv,ox,oy,sc,chim}}}
function drawRoofs(c,now,hs,eo){if(!HOUSES.length)return;c.save();
  for(const h of (hs||HOUSES)){const A=roofAOf(h);if(A<=0)continue;const sc=Math.max(1,Math.ceil(dpr*cam.z));if(!h._rc||h._rc.sc<sc)h._rc=roofCache(h,sc);const R=h._rc;c.globalAlpha=A;c.drawImage(R.cv,R.ox,R.oy,R.cv.width/R.sc,R.cv.height/R.sc);
    if(!R.chim||eo)continue;const cx=R.chim.cx,cy=R.chim.cy;
    c.fillStyle='#8f8f8f';c.fillRect(cx-7,cy-10,14,18);
    for(let r=0;r<3;r++)for(let k=0;k<2;k++){c.fillStyle=(r+k)%2?'#b8b8b8':'#acacac';c.fillRect(cx-6+k*6.5+(r%2?-2:0),cy-9+r*5.6,6,4.8)}
    c.fillStyle='#9c9c9c';c.fillRect(cx-8.5,cy-14,17,5);c.fillStyle='#3a3a3a';c.fillRect(cx-5,cy-13,10,2.5);
    {const t=now/1000;for(let k=0;k<3;k++){const p=(t*.4+k/3)%1;c.fillStyle='rgba(240,240,240,'+(.5*(1-p)*A)+')';c.beginPath();c.arc(cx+Math.sin(p*6+k)*3,cy-16-p*18,3+p*4,0,7);c.fill()}}}
  c.restore()}
const GCH=['tex:grass','tex:dry','ground#0','groundr#0','gedge:0#0','gedger:0#0','gcorner','gcornerr'];
const WCH=[];for(const k of['water','waterr','waterh'])for(let b=1;b<16;b++)WCH.push(k+':'+b);for(let i=0;i<4;i++)WCH.push('wave#'+i);for(let b=1;b<16;b++)WCH.push('waterm:'+b);WCH.push('tex:water');
function waterChipsOK(){const C=window.CHIPS;return !!C&&WCH.every(k=>C[k]&&chipImgs(C[k],'water')[0].ok)}/* 水のドット絵が読みこめたら使う */
function groundChipsOK(){const C=window.CHIPS;return !!C&&GCH.every(k=>C[k]&&chipImgs(C[k],'ground')[0].ok)}/* 地面のドット絵が読みこめたら使う */
function drawGroundChips(sc,X0,Y0,X1,Y1){const inR=i=>{const x=i%W,y=(i/W)|0;return x>=X0&&x<=X1&&y>=Y0&&y<=Y1};const C=window.CHIPS,r=WD===1?'r':'',dc=(k,x,y,i)=>{const ch=C[k];if(ch)drawChip(sc,ch,'ground',x,y,0,i)};
  if(WD===0){const dt=chipImgs(C['tex:dry'],'ground')[0];for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const px=x*TS,py=y*TS;sc.drawImage(dt,px%288,py%288,TS,TS,px,py,TS,TS)}}/* 草原のあれ地：288×288のテクスチャを、マップの位置どおりにしきつめる */
  else for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;dc('ground'+r+'#'+((hash(i*7+1)*8)|0),x*TS,y*TS,i)}/* 火山のあれ地：8しゅるい */
  const gt=chipImgs(C['tex:grass'],'ground')[0];for(const i of REV){if(!inR(i))continue;const x=i%W*TS,y=((i/W)|0)*TS;sc.drawImage(gt,x%96,y%96,TS,TS,x,y,TS,TS)}
  {/* 水のマスの下（水のふちのすきまに見える所）：となりの陸の地面（草地・乾いた地面）を、そのマスのがわの半マスに、同じもようでしきつめる（鏡うつしはしない）。ななめだけ陸なら、その角の4分の1 */
    const land=k=>S.ground[k]===0,dpt0=WD===0?chipImgs(C['tex:dry'],'ground')[0]:null,put=(n,rx,ry,rw,rh)=>{if(REV.has(n))sc.drawImage(gt,rx%96,ry%96,rw,rh,rx,ry,rw,rh);else if(dpt0)sc.drawImage(dpt0,rx%288,ry%288,rw,rh,rx,ry,rw,rh);else{sc.save();sc.beginPath();sc.rect(rx,ry,rw,rh);sc.clip();dc('ground'+r+'#'+((hash(n*7+1)*8)|0),Math.floor(rx/TS)*TS,Math.floor(ry/TS)*TS,n);sc.restore()}},h2=TS/2;
    for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(S.ground[i]<1)continue;const px=x*TS,py=y*TS;/* 水のマスそのものが緑のマスでも、草はしかない（はしに見える所は、となりの陸の地面） */
      const L=x>0&&land(i-1),R=x<W-1&&land(i+1),U=y>0&&land(i-W),D=y<H-1&&land(i+W);
      if(L)put(i-1,px,py,h2,TS);if(R)put(i+1,px+h2,py,h2,TS);if(U)put(i-W,px,py,TS,h2);if(D)put(i+W,px,py+h2,TS,h2);
      if(!L&&!U&&x>0&&y>0&&land(i-W-1))put(i-W-1,px,py,h2,h2);if(!R&&!U&&x<W-1&&y>0&&land(i-W+1))put(i-W+1,px+h2,py,h2,h2);if(!L&&!D&&x>0&&y<H-1&&land(i+W-1))put(i+W-1,px,py+h2,h2,h2);if(!R&&!D&&x<W-1&&y<H-1&&land(i+W+1))put(i+W+1,px+h2,py+h2,h2,h2)}}
  {/* 草とあれ地のさかい：あぜ道のふちと同じ。あれ地のマスの、草地がわのふちに、草のふちの絵（fringeg）をかさねる（となりの草地からはみ出す草）。ななめだけ草地の角には、角の絵 */
    const G=k=>REV.has(k)&&S.ground[k]!==1/* 水のマスからは草をはみ出させない */,open=k=>!REV.has(k)&&S.ground[k]!==1;
    for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(!open(i))continue;const hi0=hiAt(i),g=(dx,dy)=>x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&G(i+dy*W+dx)&&hiAt(i+dy*W+dx)===hi0,/* 高さのちがう草地からは、はみ出さない */u=g(0,-1),d=g(0,1),l=g(-1,0),r=g(1,0),px=x*TS,py=y*TS;
      if(!(u||d||l||r||g(-1,-1)||g(1,-1)||g(1,1)||g(-1,1)))continue;const sh=(dx,dy)=>x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&hiAt(i+dy*W+dx)===hi0,m=4;sc.save();sc.beginPath();sc.rect(px-(sh(-1,0)?m:0),py-(sh(0,-1)?m:0),TS+(sh(-1,0)?m:0)+(sh(1,0)?m:0),TS+(sh(0,-1)?m:0)+(sh(0,1)?m:0));sc.clip();/* 草のふちの絵はマスの外へ少しはみ出すので、高さのちがうとなりのマスには出さない */
      if(u)dc('fringeg:U',px,py,i);if(d)dc('fringeg:D',px,py,i);if(l)dc('fringeg:L',px,py,i);if(r)dc('fringeg:R',px,py,i);
      if(!u&&!l&&g(-1,-1))dc('fringeg:c0',px,py,i);if(!u&&!r&&g(1,-1))dc('fringeg:c1',px,py,i);if(!d&&!r&&g(1,1))dc('fringeg:c2',px,py,i);if(!d&&!l&&g(-1,1))dc('fringeg:c3',px,py,i);sc.restore()}}}/* 草とあれ地のさかい */
function drawRug(c,id,x,y,i){const ch=chipOf(id,i);if(ch&&drawChip(c,ch,id,x,y,0,i))return;/* ドット絵のラグは、2×2マスの絵なので、そのままの大きさで */c.save();c.translate(x+32,y+32);c.scale(1.4,1.4);c.translate(-16,-20);drawObj(c,id,0,0,i);c.restore()}/* ラグ：2×2マスのまんなかに、2マスはばの大きさで */
function drawRugsLive(x0,y0,x1,y1){for(const k in S.rug||{}){const j=+k,x=j%W,y=(j/W)|0;if(x+2<x0||y+2<y0||x>x1||y>y1)continue;drawRug(ctx,S.rug[k],x*TS,y*TS,j);for(const q of rugCells(j)){const o=S.obj[q];if(o&&o!=='part'&&BL[o]&&FLAT.has(o)&&!(BL[o].dyn||BL[o].anim||TREES.has(o)))drawObj(ctx,o,(q%W)*TS,((q/W)|0)*TS,q)}}}/* ラグは毎コマ、画面の細かさで描く（地面の下絵は1マス32ドットなので、64ドットの絵があらくなる）。ラグの上の平らな物も、ラグのあとに */
function drawStaticArea(sc,X0,Y0,X1,Y1){/* 地面・床・水・動かない物を、マス(X0,Y0)〜(X1,Y1)のはんいだけ描く */const inR=i=>{const x=i%W,y=(i/W)|0;return x>=X0&&x<=X1&&y>=Y0&&y<=Y1};
  if(groundChipsOK())drawGroundChips(sc,X0,Y0,X1,Y1);else{
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;drawBarren(sc,i,x*TS,y*TS)}
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(REV.has(i))drawGrass(sc,i,x*TS,y*TS)}
  for(const i of REV)if(inR(i))drawGrassBoundary(sc,i,i%W*TS,((i/W)|0)*TS)}
  // 色むら：マス単位ではなく、なめらかにぼかした明暗を重ねる
  {let nc=NOISEC;if(!nc||nc.width!==W||nc.height!==H){nc=NOISEC=document.createElement('canvas');nc.width=W;nc.height=H;const nx=nc.getContext('2d'),im=nx.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0,n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const xx=x+a,yy=y+b;if(xx<0||yy<0||xx>=W||yy>=H)continue;v+=hash((yy*W+xx)*31+7);n++}v=v/n-.5;
      const k=(y*W+x)*4;if(v>0){im.data[k]=255;im.data[k+1]=250;im.data[k+2]=220}else{im.data[k]=40;im.data[k+1]=55;im.data[k+2]=20}im.data[k+3]=Math.min(255,Math.abs(v)*2*70)}
    nx.putImageData(im,0,0)}sc.save();sc.imageSmoothingEnabled=true;sc.imageSmoothingQuality='high';sc.drawImage(nc,-TS/2,-TS/2,(W+1)*TS,(H+1)*TS);sc.restore()}
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x;if(S.ground[i]!==1&&S.floor[i]&&!((HOME_WALLS.has(S.obj[i])||HOME_DOORS.has(S.obj[i]))&&!ROADF.has(S.floor[i])))drawFloor(sc,S.floor[i],x*TS,y*TS,i);/* 壁の下の床は、家の中がわだけ（wallMargで描く） */if(HOME_DOORS.has(S.obj[i])||HOME_WALLS.has(S.obj[i]))wallMarg(sc,i,x*TS,y*TS)}/* 壁・ドアの下の床（家の中がわ）も、地面の下絵に描く（毎コマ描くと、下絵とのさかいめに線が出る） */
  drawWaterAll(sc,X0,Y0,X1,Y1);
  // 固定物も、アニメーションする物と同じ足元の奥行きで並べる。
  const fixed=[];
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x,o=S.obj[i];if(!o||o==='part'||!BL[o]||BL[o].dyn||BL[o].anim||TREES.has(o)||!(FLAT.has(o)||BL[o].floor)||FLAT.has(o)&&RUGC.has(i))continue;/* 地面にやきつけるのは、平らな物だけ（ラグの上の物は、ラグといっしょに毎コマ）。立っている物は毎コマ、足もとの順に描く */fixed.push({i,o,k:objectDepth(o,i),t:BL[o].kind==='block'?0:1})}
  fixed.sort((a,b)=>a.k-b.k||a.t-b.t||a.i-b.i);
  for(const {i,o}of fixed)drawObj(sc,o,(i%W)*TS,((i/W)|0)*TS,i);
}
let SSIG=null,SSIG_S=null,SSIG_G='',NOISEC=null;
function staticSig(){/* マスごとに、地面の絵にかかわる中身を文字にしておく（前とくらべて、変わったマスだけ描き直すため） */const hs=new Set();for(const h of HOUSES)for(const j of h.set)hs.add(j);const M=WD===1&&S.st2?sprMap():null,sg=new Array(W*H);
  for(let i=0;i<W*H;i++){const o=S.obj[i],st=o&&BL[o]&&!(BL[o].dyn||BL[o].anim||TREES.has(o));sg[i]=o+'|'+(S.ref[i]??'')+'|'+S.ground[i]+'|'+(S.floor[i]||'')+'|'+(REV.has(i)?1:0)+(hs.has(i)?1:0)+(ashed(i)?1:0)+(M&&S.ground[i]===1&&springOn(M[i])?1:0)+(S.trapCd&&S.trapCd[i]>S.t?1:0)+'|'+(st&&S.dyn[i]?JSON.stringify(S.dyn[i]):'')+'|'+((S.win||{})[i]||'')+'|'+((S.rot||{})[i]||'')+'|'+(RUGC.has(i)?RUGC.get(i)+S.rug[RUGC.get(i)]+((S.rugRot||{})[RUGC.get(i)]||''):'')+'|'+(S.hp['L'+i]||'')}
  return sg}
let STATN=0,STDIRTY=null;/* STDIRTY：下絵の一部だけ描きなおしたときの行の範囲（段差の絵は、そこだけ作りなおす） */function rebuildStatic(full){STATN++;STDIRTY=null;findHouses();
  const g=[WD,CX,CY,W,H,groundChipsOK(),waterChipsOK()].join(),sg=staticSig();
  if(!full&&SSIG&&SSIG_S===S&&SSIG_G===g){/* 変わったマスのまわりだけ描き直す */
    let R=[];for(let i=0;i<W*H;i++)if(sg[i]!==SSIG[i]){const x=i%W,y=(i/W)|0;R.push([Math.max(0,x-3),Math.max(0,y-6),Math.min(W-1,x+3),Math.min(H-1,y+1)])}/* 背の高い物は上へ6マスまで、横へ3マスまで絵がはみ出す */
    SSIG=sg;
    for(let m=true;m;){m=false;for(let a=0;a<R.length&&!m;a++)for(let b=a+1;b<R.length;b++){const p=R[a],q=R[b];if(p[0]<=q[2]+1&&q[0]<=p[2]+1&&p[1]<=q[3]+1&&q[1]<=p[3]+1){R[a]=[Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[2],q[2]),Math.max(p[3],q[3])];R.splice(b,1);m=true;break}}}/* かさなる四角は1つにまとめる */
    let area=0;for(const r of R)area+=(r[2]-r[0]+1)*(r[3]-r[1]+1);
    if(area<W*H*.4){STDIRTY=R.map(r=>[r[0],r[1],r[2],r[3]]);waterDirty(R);for(const r of R){
        for(let cy=Math.max(0,(r[1]-1)>>4);cy<=Math.min((H-1)>>4,(r[3]+1)>>4);cy++)for(let cx=Math.max(0,(r[0]-1)>>4);cx<=Math.min((W-1)>>4,(r[2]+1)>>4);cx++){const q=GRD.c.get(cy*64+cx);if(q)q.st=true}}/* 変わった所にかかる区画に、作りなおすしるし（作りなおすまでは前の絵） */
      dirty=false;return}}
  SSIG=sg;SSIG_S=S;SSIG_G=g;gclear();waterDirty(null);dirty=false;STATICFULL=false;
}
const iconCache={};
let ICONTMP=null;
function iconURL(id){/* アイコンは、大きなキャンバスに2倍の細かさで描いてから、絵のある範囲だけを切り出して、144×144にきちんと入れる（全体がうつる） */
  if(typeof id==='string'&&id.startsWith('seed:'))return seedIcon(id.slice(5));
  if(iconCache[id])return iconCache[id];
  const N=576,T=ICONTMP||(ICONTMP=document.createElement('canvas'));T.width=T.height=N;const t=T.getContext('2d');t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,N,N);t.setTransform(2,0,0,2,0,0);/* 2倍の細かさで描く（1マス64ドットの絵が、そのままの細かさで入る） */
  ICON=true;try{if(BL[id].floor)drawFloor(t,id,96,160,7,true);else drawObj(t,id,96,160,7,(id==='berry'||id==='fruit')?100:id==='farm'?60:0,1)}finally{ICON=false}
  const d=t.getImageData(0,0,N,N).data;let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const c=document.createElement('canvas');c.width=144;c.height=144;
  if(x1>=0){const g=c.getContext('2d'),bw=x1-x0+1,bh=y1-y0+1,sc=Math.min(132/bw,132/bh,2),dw=bw*sc,dh=bh*sc;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(T,x0,y0,bw,bh,(144-dw)/2,(144-dh)/2,dw,dh)}/* 144×144（画面では72にちぢめて出すので、細かい画面でもくっきり）。のばす・ちぢめるときは、なめらかに（がたがたにしない）。小さい物は2倍まで */
  const u=c.toDataURL();c.width=c.height=0;return iconCache[id]=u;
}
function toolIcon(k){
  const key='tool_'+k;if(iconCache[key])return iconCache[key];
  const c=document.createElement('canvas');c.width=72;c.height=72;const g=c.getContext('2d');
  if(k==='glass'){g.fillStyle='#8a5a33';g.fillRect(16,8,40,6);g.fillRect(16,58,40,6);g.fillStyle='#6d4424';g.fillRect(20,14,4,44);g.fillRect(48,14,4,44);
    g.fillStyle='rgba(200,235,255,.55)';g.beginPath();g.moveTo(24,14);g.lineTo(48,14);g.quadraticCurveTo(48,30,37,36);g.quadraticCurveTo(48,42,48,58);g.lineTo(24,58);g.quadraticCurveTo(24,42,35,36);g.quadraticCurveTo(24,30,24,14);g.fill();
    g.fillStyle='#ffcf4a';g.beginPath();g.moveTo(28,22);g.lineTo(44,22);g.lineTo(36,34);g.fill();g.beginPath();g.moveTo(36,40);g.lineTo(45,56);g.lineTo(27,56);g.fill();g.fillRect(35.5,34,1.5,8)}
  else if(k==='scoop'||k==='dig'||k==='mound'){/* だんさスコップ・けずる・もる */if(k!=='scoop'){g.fillStyle='#8cc35c';g.fillRect(12,k==='dig'?30:20,48,8);g.fillStyle='#b08a5e';g.fillRect(12,k==='dig'?38:28,48,k==='dig'?20:30);g.fillStyle='#fff6df';g.beginPath();if(k==='dig'){g.moveTo(36,26);g.lineTo(24,10);g.lineTo(48,10)}else{g.moveTo(36,4);g.lineTo(24,18);g.lineTo(48,18)}g.fill()}else{g.save();g.translate(36,36);g.rotate(.6);g.fillStyle='#b07c50';rr(g,-3,-32,6,34,3);g.fillStyle='#9aa3ad';g.beginPath();g.moveTo(-11,2);g.lineTo(11,2);g.lineTo(9,22);g.quadraticCurveTo(0,30,-9,22);g.closePath();g.fill();g.restore()}}
  else if(k==='hake'){g.save();g.translate(36,36);g.rotate(-.7);g.fillStyle='#b07c50';rr(g,-5,-30,10,30,4);g.fillStyle='#8a5a33';g.fillRect(-5,-30,3,30);
    g.fillStyle='#c4c8cf';g.fillRect(-12,0,24,7);g.fillStyle='#e9d6a8';g.fillRect(-12,7,24,16);g.fillStyle='#d4bc86';for(let i=0;i<6;i++)g.fillRect(-11+i*4,9,1.5,14);
    g.fillStyle='#86d68f';g.fillRect(-12,19,24,6);g.restore()}
  else if(k==='mover'){/* ひっこしミトン：やわらかい手ぶくろと、うつす矢印 */g.fillStyle='rgba(0,0,0,.15)';g.beginPath();g.ellipse(34,62,20,5,0,0,7);g.fill();g.fillStyle='#e9b86a';rr(g,18,20,30,36,12);rr(g,10,30,14,12,6);g.fillStyle='#f6d79a';rr(g,22,22,10,26,5);g.fillStyle='#c98a3e';g.fillRect(18,50,30,6);g.fillStyle='#86d68f';g.beginPath();g.moveTo(50,14);g.lineTo(64,22);g.lineTo(50,30);g.fill();g.fillRect(40,19,11,6)}
  else if(k==='swap'){g.save();g.translate(36,38);g.rotate(-.6);g.fillStyle='#b07c50';rr(g,-4,-6,8,34,3);g.fillStyle='#8a5a33';g.fillRect(-4,-6,3,34);g.fillStyle='#8d9098';rr(g,-16,-20,32,14,3);g.fillStyle='#c4c8cf';g.fillRect(-16,-20,32,4);g.restore();/* つけかえトンカチ：木の柄に鉄の頭 */g.fillStyle='#86d68f';g.beginPath();g.moveTo(50,48);g.lineTo(62,56);g.lineTo(50,64);g.fill();g.fillRect(40,53,11,6)}
  else{g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(36,60,24,6,0,0,7);g.fill();g.fillStyle='#b8452f';rr(g,14,40,44,16,4);g.fillStyle='#d9644a';g.fillRect(14,40,44,4);
    g.fillStyle='#8a5a33';g.fillRect(31,22,10,18);circ(g,36,18,10,'#b07c50');circ(g,33,15,3,'#d9a873');g.fillStyle='#86d68f';g.fillRect(18,56,8,4);g.fillRect(30,56,8,4);g.fillRect(42,56,8,4)}
  return iconCache[key]=c.toDataURL();
}
function stampIcon(sid){
  const k='st_'+sid;if(iconCache[k])return iconCache[k];
  const st=STAMPS[sid];const mx=Math.max(...st.cells.map(c=>c[0]))+1,my=Math.max(...st.cells.map(c=>c[1]))+1;
  const c=document.createElement('canvas');c.width=72;c.height=72;const g=c.getContext('2d');const s=64/(Math.max(mx,my)*TS);
  g.translate(4+(64-mx*TS*s)/2,4+(64-my*TS*s)/2);g.scale(s,s);ICON=true;
  for(const[x,y,id]of st.cells){if(BL[id].floor)drawFloor(g,id,x*TS,y*TS,x+y,true);else drawObj(g,id,x*TS,y*TS,x*5+y,60,1)}
  ICON=false;return iconCache[k]=c.toDataURL();
}

function darkness(){const h=hour();if(h>=7&&h<17)return 0;if(h>=17&&h<20.5)return (h-17)/3.5*.58;if(h>=20.5||h<4.5)return .58;return .58*(1-(h-4.5)/2.5)}
const rain=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),s:rnd(.6,1)}));
const motes=Array.from({length:26},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6,s:rnd(.4,1)}));
let selRect=null;

function drawMark(el,px,by,now){
  const c=ctx;
  if(el==='wood'){c.strokeStyle='#3f8a3d';c.lineWidth=1.5;c.beginPath();c.moveTo(px,by-9);c.lineTo(px,by-13);c.stroke();
    c.fillStyle='#5fbf4f';c.beginPath();c.ellipse(px-3,by-14,3.5,2,-.5,0,7);c.fill();c.beginPath();c.ellipse(px+3,by-14,3.5,2,.5,0,7);c.fill()}
  else if(el==='water'){c.fillStyle='#3f9ee8';c.beginPath();c.moveTo(px,by-19);c.quadraticCurveTo(px+4,by-13,px,by-10);c.quadraticCurveTo(px-4,by-13,px,by-19);c.fill();circ(c,px-1,by-13,1,'#dff2ff')}
  else if(el==='fire'){const f=Math.sin(now/120);c.fillStyle='#ff6a3d';c.beginPath();c.moveTo(px-4,by-9);c.quadraticCurveTo(px-4,by-15,px+f,by-19);c.quadraticCurveTo(px+4,by-15,px+4,by-9);c.fill();circ(c,px,by-11,2,'#ffd35c')}
  else if(el==='earth'){c.fillStyle='#9a6f30';c.beginPath();c.ellipse(px,by-11,5,3,0,0,7);c.fill();c.fillStyle='#d9b06a';c.fillRect(px-2,by-13,3,1.5)}
  else if(el==='wind'){c.strokeStyle='#3fc0a0';c.lineWidth=1.8;c.beginPath();c.arc(px,by-13,3.5,Math.PI*.2+now/400,Math.PI*1.7+now/400);c.stroke()}
}
/* ---------- 精霊の絵 ---------- */
const SPC={
  earth:{hood:'#8f6a50',cheek:'#c6b1a0',dark:'#6f4f3a',eye:'#5e3d2a',hand:'#e3c3a3',line:'#ead6bd',leaf:'#5e8f43'},
  water:{hood:'#78c3fb',cheek:'#badef5',dark:'#4fa6e8',eye:'#1d4f7c',hand:'#f3dfc6',line:'#ecd9c0'},
  fire:{hood:'#e8604f',cheek:'#f2ac9f',dark:'#c94a3c',eye:'#8f3a22',hand:'#ffc887',line:'#f0d4ae'},
  wind:{hood:'#a6cc8a',cheek:'#d2e2bc',dark:'#86b46a',eye:'#456a2a',hand:'#c8e2b4',line:'#c2dcaa',tend:'#e8cdb0'},
  wood:{hood:'#6fae4c',cheek:'#b6d39e',dark:'#4f8a35',eye:'#3f5e26',hand:'#d6e8c2',line:'#e2d6bc',vein:'#9fd27e'},
};
const CREAM='#fdf8ef';
// 見た目の微調整用の数値（デザイン調整ツールで作った値をここに入れる）
const KEYTUNE={head:1.13,faceW:24.5,faceH:21,faceY:2,eyeY:1,eyeGap:11,eyeW:2.8,eyeH:4.6,cheekS:1,cheekA:.42,bodyW:1,bodyH:1,armL:1,armW:.88,hand:1,tail:1.04,line:2.4,sEye:3,sCheek:-16,sFaceX:9.5,sFaceW:8,sHead:.95,sHoodX:4.5,sMouth:3};/* キーキャラ（フタバ・ノドカ）の見た目 */
const BASETUNE={head:1.13,faceW:24.5,faceH:21,faceY:2,eyeY:1,eyeGap:11,eyeW:2.8,eyeH:4.6,cheekS:1,cheekA:.42,bodyW:1,bodyH:1,armL:1,armW:.88,hand:1,tail:1.04,line:2.4,sEye:3,sCheek:-16,sFaceX:9.5,sFaceW:8,sHead:.95,sHoodX:4.5,sMouth:3};
// 足元(0,0)基準・高さ約100単位。右向きで描いてfで反転。o:{t,back,turn(0正面〜1真横),walk,work,sleep,blink,lean}
const PSPR={"wmBody":{"src": "assets/g/67ccde7704.webp"},"wmSail":{"src": "assets/g/a6e83e73cf.webp"},"well":{"w": 192, "h": 168, "src": "assets/g/4076e7cf97.webp"},"lumber":{"w": 96, "h": 95, "src": "assets/g/1cf99a0e22.webp"},"quarry":{"w": 96, "h": 90, "src": "assets/g/def842f310.webp"},"puddle":{"w": 96, "h": 58, "src": "assets/g/7d236e5659.webp"},"spike":{"w": 96, "h": 73, "src": "assets/g/f6d36cad57.webp"},"firetrap":{"w": 96, "h": 95, "src": "assets/g/c7a01d832d.webp"},"gust":{"w": 96, "h": 94, "src": "assets/g/c3f6e5b647.webp"},"torch":{"w": 34, "h": 96, "src": "assets/g/377580bdc3.webp"},"can":{"w":80,"h":44,"src":"assets/g/a152791e98.webp"},"hammer":{"w":80,"h":48,"src":"assets/g/c4e04e0342.webp"},"axe":{"w":80,"h":48,"src":"assets/g/f28741502b.webp"},"saw":{"w":80,"h":32,"src":"assets/g/678b62430a.webp"},"pick":{"w":80,"h":72,"src":"assets/g/6c33c2cfb4.webp"},"hoe":{"w":80,"h":36,"src":"assets/g/39079f38b3.webp"},"swing":{"w":80,"h":63,"src":"assets/g/cbdd29487c.webp"}};
for(const k in PSPR){const g=PSPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1;dirty=true;if(typeof iconCache!=="undefined"){delete iconCache[k];if(k.startsWith("wm"))delete iconCache.windmill}};g.img.src=g.src}
// 顔・手のアイコン（絵文字のかわりに使う）
const EMOS={"muscle": "assets/g/5554bd7111.webp", "one": "assets/g/88db2f2e48.webp", "point": "assets/g/00ac3e5a20.webp", "palm": "assets/g/ebf1b027f0.webp", "thumb": "assets/g/8f7bd1849e.webp", "laugh": "assets/g/9a40ea6fe9.webp", "shock": "assets/g/824f985b69.webp", "bang": "assets/g/3b6a37fa64.webp", "q": "assets/g/b78fb718c4.webp", "cry": "assets/g/3367f045df.webp"};
const EMO_OF={'💪':'muscle','👆':'one','☝️':'one','👉':'point','✋':'palm','👋':'palm','👍':'thumb','😆':'laugh','😊':'laugh','😱':'shock','😵':'shock','❗':'bang','‼️':'bang','❓':'q','😭':'shock','😩':'shock','😣':'shock'};
const EMOI={};for(const k in EMOS){const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=EMOS[k];EMOI[k]=im}
document.querySelectorAll('img.emo').forEach(e=>{e.src=EMOS[EMO_OF[e.dataset.emo]]});
let ROCKI=null;const rockImg=()=>{if(!ROCKI){const c=document.createElement('canvas');c.width=60;c.height=52;const g=c.getContext('2d');g.scale(2,2);g.translate(-2.5,-5);const x=0,y=0;
  blob(g,'#b9ad9f',[[x+4,y+27],[x+5,y+15],[x+12,y+7],[x+21,y+8],[x+26,y+16],[x+27,y+27]]);blob(g,'#d3c9bd',[[x+6,y+18],[x+12,y+8],[x+20,y+9],[x+17,y+15],[x+9,y+21]]);blob(g,'#c5baae',[[x+19,y+29],[x+19,y+22],[x+24,y+19],[x+30,y+22],[x+30,y+29]]);blob(g,'#d9d0c5',[[x+20,y+23],[x+24,y+20],[x+28,y+22],[x+24,y+24]]);ROCKI=c}return ROCKI};/* 石は絵文字ではなく、マップの石と同じ絵 */
/* 食べ物・素材のアイコン（いただいた絵を切りぬいたもの） */
const ICONS={bamboo:'assets/g/1675ff02af.webp',takenoko:'assets/g/ff79aa3650.webp',yakisoba:'assets/g/11c3354584.webp',takoyaki:'assets/g/896abbdd21.webp',ringoame:'assets/g/81d8416232.webp',"berry": "assets/g/02a387993f.webp", "apple": "assets/g/4def88f772.webp", "fish": "assets/g/5abe67cf54.webp", "mugi": "assets/g/f341bb15ca.webp", "yakizakana": "assets/g/d5490ee70a.webp", "bread": "assets/g/44418dc796.webp", "wood": "assets/g/32dc1abbf4.webp", "stone": "assets/g/c9decf831c.webp","yakiimo": "assets/g/7362585a89.webp", "soup": "assets/g/8e1f8b863a.webp", "yakiberry": "assets/g/66e34ef9f6.webp", "yakiapple": "assets/g/9a25149269.webp","potato": "assets/g/12bb46830f.webp","f_smile": "assets/g/27ad3fc163.webp", "f_angry": "assets/g/5f6e4b8e20.webp", "f_cry": "assets/g/50191c34fc.webp", "f_laugh": "assets/g/4639c8a46b.webp", "f_sleep": "assets/g/b4cd35c3fa.webp","m_support": "assets/g/8a489fd5b4.webp", "m_goal": "assets/g/2e7239e58d.webp", "m_manual": "assets/g/48c642512e.webp", "m_oracle": "assets/g/e296fc09a6.webp", "m_chat": "assets/g/b495abb0e1.webp", "m_maps": "assets/g/728271789e.webp", "m_settings": "assets/g/63c2d28666.webp", "m_record": "assets/g/24756785e1.webp", "m_box": "assets/g/281aef7121.webp", "fire": "assets/g/ea2c3266d1.webp", "pan": "assets/g/f758a535d1.webp",kakigori:'assets/g/bfb5ea466b.webp',wataame:'assets/g/2921901dec.webp',yakiimo:'assets/g/906db226be.webp'};for(const k of['shina','kasa','kuru','chiri','funba','eda','kinoko','can']){const cv=document.createElement('canvas');cv.width=cv.height=48;drawMatIc(cv.getContext('2d'),k,24,24,44);ICONS[k]=cv.toDataURL();const ck={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc#0',kinoko:'kinoko#0',eda:'drop:eda',can:'drop:can'}[k];if(window.CHIPS&&CHIPS[ck]){const c=chipImgs(CHIPS[ck],ck)[0],set=()=>{ICONS[k]=c.toDataURL();try{delete iconCache[k]}catch(e){}};if(c.ok)set();else chipPage(CHIPS[ck].f[0][0]).q.push(set)}}/* もらった絵があれば、それを素材のアイコンに *//* あたらしい素材のアイコン（仮の絵） */
/* やきいも・スープ（ユーザー画像）、焼きベリー・焼きりんご */
/* 表情アイコン（いただいた絵） */
/* メニューと吹き出しのアイコン */
const EMO_IC={'🎋':'bamboo','🎍':'takenoko','🍧':'kakigori','🍬':'wataame','🍝':'yakisoba','🐙':'takoyaki','🍭':'ringoame','😊':'f_smile','😌':'f_smile','😆':'f_laugh','😠':'f_angry','😤':'f_angry','💤':'f_sleep','😴':'f_sleep','🌾':'mugi','🫐':'berry','🍎':'apple','🐟':'fish','🐠':'yakizakana','🍞':'bread','🍠':'yakiimo','🍮':'yakiberry','🥧':'yakiapple','🍲':'soup','🪵':'wood','🪨':'stone','🔥':'fire','🍳':'pan','📦':'m_box','💬':'m_chat','🥔':'potato','☕':'m_support'};
const ICI={};for(const k in ICONS){const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=ICONS[k];ICI[k]=im}
const icURL=t=>EMO_IC[t]?ICONS[EMO_IC[t]]:null;
const OBJIC=new Map();/* 'obj:<id>'：その物の絵のアイコン */const emoImg=t=>{if(typeof t==='string'&&t.startsWith('obj:')){let im=OBJIC.get(t);if(!im){const u=iconURL(t.slice(4));if(!u)return null;im=new Image();im.src=u;OBJIC.set(t,im)}return im.complete&&im.naturalWidth?im:null}const ic=EMO_IC[t];if(ic&&ICI[ic].ok)return ICI[ic];if(t==='🪨')return rockImg();const k=EMO_OF[t];if(k&&EMOI[k].ok)return EMOI[k];const e=typeof EIMGI==='undefined'?null:EIMGI[nfe(t)];return e&&e.ok?e:null};
const EIMG={"🥬": "assets/g/5060956a16.webp","🌱": "assets/g/ddb81b127a.webp", "🌼": "assets/g/0ed6b4aade.webp", "🍇": "assets/g/8e281cad26.webp", "🍙": "assets/g/b6579368c3.webp", "🎁": "assets/g/3b401b133d.webp", "🎈": "assets/g/5425865b42.webp", "🎣": "assets/g/dfb64cc0a7.webp", "🎵": "assets/g/55ef8edddb.webp", "👏": "assets/g/be7b7ab2f2.webp", "💚": "assets/g/5b43ce83e8.webp", "💦": "assets/g/6915a2afb8.webp", "💧": "assets/g/62e219622c.webp", "🔨": "assets/g/d16cde1f6d.webp", "🧺": "assets/g/2958eee0a3.webp", "🪓": "assets/g/aeb012eedf.webp", "⛏": "assets/g/e9f2ed80d0.webp", "✨": "assets/g/72f109c9a6.webp", "🏠": "assets/g/85c1f2f80d.webp", "🎉": "assets/g/766f579af3.webp", "♨": "assets/g/d36dfb2330.webp", "🤝": "assets/g/aef0a1bcc3.webp", "⚔": "assets/g/350754662b.webp", "💎": "assets/g/f37efc10fd.webp", "🏡": "assets/g/2e7280b902.webp", "🌙": "assets/g/85ca409800.webp", "🌑": "assets/g/528f694f20.webp", "🏆": "assets/g/5b656fb4a5.webp", "📌": "assets/g/04c7ab4501.webp", "🍃": "assets/g/1eb15e6975.webp", "🌟": "assets/g/adfec7ff83.webp", "🎯": "assets/g/6b1cb0d850.webp", "🪑": "assets/g/2e65a41c7d.webp", "⬆": "assets/g/3b473890f6.webp", "☀": "assets/g/df54e16892.webp", "☔": "assets/g/431750b5a8.webp", "★": "assets/g/0c3128f3de.webp", "☆": "assets/g/f442887829.webp", "♥": "assets/g/ce24a2a5c7.webp", "♪": "assets/g/92f4a76d1d.webp", "✓": "assets/g/301536d4a0.webp", "⚙": "assets/g/05c75a8ddf.webp", "⛩": "assets/g/fc15f6a949.webp", "📔": "assets/g/b5ad2cfa77.webp", "📜": "assets/g/6b126952c1.webp", "📺": "assets/g/5220592373.webp", "🔒": "assets/g/46046e6402.webp", "🧭": "assets/g/3b0b9bbe3e.webp", "🦌": "assets/g/b284f951ef.webp", "⭐": "assets/g/e239d430f8.webp", "💫": "assets/g/9fcb4f768d.webp", "👻": "assets/g/e415a63d84.webp", "🍅": "assets/g/bdf6d4891c.webp", "😋": "assets/g/4d4933be73.webp", "🌰": "assets/g/ddb81b127a.webp"};/* 絵文字のかわりに使う絵（いただいたもの） */

const EIMGI={};for(const k in EIMG){const im=new Image();im.onload=()=>{im.ok=1;dirty=true};im.src=EIMG[k];EIMGI[k]=im}
const nfe=t=>t.replace(/️/g,'').replace('🎵','♪');/* 音符はぜんぶ黒い音符 */
const emoSrc=t=>{t=nfe(t);return EIMG[t]||(EMO_IC[t]&&ICONS[EMO_IC[t]])||(EMO_OF[t]&&EMOS[EMO_OF[t]])||(EMO_OF[t+'️']&&EMOS[EMO_OF[t+'️']])||null};
{const L=[...new Set(Object.keys(EIMG).concat(Object.keys(EMO_IC),Object.keys(EMO_OF)).map(nfe))].sort((a,b)=>b.length-a.length);
 const RX=new RegExp('('+L.join('|')+')️?','g'),SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','CANVAS','INPUT']);
 const conv=n=>{if(n.nodeType===3){const t=n.nodeValue;if(!t||t.length>400)return;RX.lastIndex=0;if(!RX.test(t))return;RX.lastIndex=0;const f=document.createDocumentFragment();let i=0,m;while((m=RX.exec(t))){const src=emoSrc(m[1]);if(!src)continue;if(m.index>i)f.appendChild(document.createTextNode(t.slice(i,m.index)));const im=document.createElement('img');im.className='emi';im.alt='';im.src=src;f.appendChild(im);i=m.index+m[0].length}if(i===0)return;if(i<t.length)f.appendChild(document.createTextNode(t.slice(i)));n.parentNode&&n.parentNode.replaceChild(f,n)}
  else if(n.nodeType===1){if(SKIP.has(n.tagName))return;for(const c of [...n.childNodes])conv(c)}};
 const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')conv(m.target);else for(const n of m.addedNodes)conv(n)}});
 mo.observe(document.body,{childList:true,subtree:true,characterData:true});conv(document.body)}/* 画面の文字に出てくる絵文字は、ぜんぶ絵にさしかえる */
const hex2hsl=h=>{const n=parseInt(h.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S2=0;if(mx!==mn){const d=mx-mn;S2=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S2,l]};
const hsl2hex=(H,S2,l)=>{const k=n=>(n+H/30)%12,a=S2*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return'#'+[f(0),f(8),f(4)].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')};
const SPCV={};function spcVar(el,v){const B=SPC[el]||SPC.wood;if(!v||(!v.h&&!v.l))return B;const k=el+v.h+'_'+v.l;if(SPCV[k])return SPCV[k];const o={};for(const q in B){if(q==='line'||q==='hand'){o[q]=B[q];continue}const[H,S2,l]=hex2hsl(B[q]);o[q]=hsl2hex((H+v.h+360)%360,S2,Math.max(.08,Math.min(.92,l+v.l)))}return SPCV[k]=o}
let HOODB=[4,-.05];
let EATSIDE=-.1;
function spPose(o,t,tr,back){/* せいれいの動きの計算：腕の角度・かたむき・道具など（描き方とは別） */
  const br=o.sleep?Math.sin(t*1.6)*.035:Math.sin(t*2.6)*.022;
  const st=o.walk?Math.sin(t*9):0,arm=o.carry?0:o.work?Math.sin(t*12)*.6:o.walk?st*.35:Math.sin(t*1.7)*.08;
  // 作業ごとの動き：aN=手前の腕、aF=奥の腕（負で上がる）
  const A=o.anim||'',cyc=(sp)=>(t*sp)%1;let aN=null,aF=null,prop='',lean2=0,sq=0,frontArm=false,bothF=false;
  if(A==='climb'){aN=-2.5+Math.sin(t*8)*.4;aF=-2.5-Math.sin(t*8)*.4;lean2=-.05;sq=Math.abs(Math.sin(t*8))*.02;frontArm=bothF=true}/* 段差をよじのぼる：両手を上にのばして、こうごに動かす */
  else if(A==='punch'){const p=Math.min(1,o.pp||0),v=p<.55?-1.95*(p/.55):-1.95+2.4*((p-.55)/.45);aN=aF=v;lean2=p<.55?-.04:.07;frontArm=bothF=true}/* 攻撃：両手を振り上げて、ぽかっと振り下ろす */
  else if(A==='pray'){aN=aF=-2.4+Math.sin(t*1.4)*.03;lean2=.07+Math.sin(t*1.4)*.015;frontArm=bothF=true}/* おいのり：胸の前で手を合わせて、少しうつむく */
  else if(A==='pluck'){aN=-1.95+Math.sin(t*9)*.28;aF=.15;lean2=.03;frontArm=true}/* ベリーをむしる：片手を上げて、ひっぱる */
  else if(A==='hold'){aN=aF=-.85+Math.sin(t*3)*.03;frontArm=bothF=true}/* 手に持つ */
  else if(A==='eat'){aN=aF=(tr?EATSIDE:-2.45)+Math.sin(t*7)*.06;frontArm=bothF=true}/* 横向きは、両手を前にのばして、食べ物を持つ */
  else if(A==='chop'||A==='mine'||A==='till'){const p=cyc(1.4),v=p<.72?-2.3*(p/.72):-2.3+2.9*((p-.72)/.28);aN=v;aF=v;prop=A==='chop'?'axe':A==='mine'?'pick':'hoe';lean2=p<.72?-.06*(p/.72):-.06+.2*((p-.72)/.28);frontArm=true}
  else if(A==='build'||A==='repair'||A==='craft'){const p=cyc(2.6),v=p<.6?-1.3*(p/.6):-1.3+1.7*((p-.6)/.4);aN=v;aF=.2;prop='hammer';lean2=p>.6?.06:0;frontArm=true}
  else if(A==='water'||A==='tend'){aN=-.55+Math.sin(t*2)*.08;aF=.25;prop='can';lean2=.05;frontArm=true}
  else if(A==='cook'){aN=-.5+Math.sin(t*5)*.22;aF=.15;prop='ladle';frontArm=true}
  else if(A==='talk'){aN=-.6+Math.sin(t*4.7)*.4;aF=-.15+Math.sin(t*3.3)*.2;lean2=Math.sin(t*2.4)*.025;frontArm=true}
  else if(A==='talkjoy'){aN=-1.35+Math.sin(t*7)*.38;aF=-1.25-Math.sin(t*7)*.32;sq=Math.sin(t*7)*.025;frontArm=bothF=true}
  else if(A==='talkshock'){aN=aF=-1.7+Math.sin(t*8)*.12;lean2=-.075;sq=.04;frontArm=bothF=true}
  else if(A==='talkthink'){aN=-2.05+Math.sin(t*2)*.06;aF=.15;lean2=-.06;frontArm=true}
  else if(A==='talksad'){aN=.18+Math.sin(t*2)*.08;aF=.18;lean2=.07;sq=.025;frontArm=bothF=true}
  else if(A==='wave'){aN=-2.55+Math.sin(t*9)*.35;frontArm=true}/* 手をふる */
  else if(A==='clap'){const c=Math.sin(t*16);aN=-1.05+c*.32;aF=-1.05+c*.32;frontArm=bothF=true}
  else if(A==='tubbath'){aN=.5+Math.sin(t*1.3)*.1;aF=.5-Math.sin(t*1.3)*.1;lean2=Math.sin(t*1.1)*.05;sq=.02+Math.sin(t*1.8)*.012}/* バスタブ：ゆったりつかる */
  else if(A==='bathe'){const p=cyc(1.2),v=p<.45?.5-3.4*(p/.45):-2.9+3.4*((p-.45)/.55);aN=aF=v;frontArm=bothF=true;sq=.04+Math.sin(t*7.5)*.02;prop='splash'}
  else if(A==='fish'){aN=-.95+Math.sin(t*1.4)*.05;aF=-.15;prop='rod';frontArm=true}
  else if(A==='weed'){const p=cyc(1.1),pull=p<.6?p/.6:1-(p-.6)/.4;sq=.12-pull*.06;aN=aF=.75-pull*.35;lean2=.14-pull*.3;frontArm=bothF=true}/* 雑草：しゃがんで両手でつかみ、うしろへひっぱって抜く */
  else if(A==='plant'||A==='sow'||A==='harvest'||A==='gather'||A==='forage'||A==='pickseed'||A==='pickdrop'){sq=.09+Math.sin(t*5)*.025;aN=.6+Math.sin(t*6)*.35;aF=.6-Math.sin(t*6)*.35;lean2=.1;frontArm=bothF=true}
  else if(A==='store'||A==='smat'||A==='fetch'||A==='cgrab'){sq=.05;aN=.4+Math.sin(t*5)*.2;aF=aN;frontArm=bothF=true}
  else if(A==='offer'){aN=aF=-1.5+Math.sin(t*3)*.1;frontArm=bothF=true}
  else if(A==='play'){aN=aF=-1.7+Math.sin(t*7)*.35;frontArm=bothF=true}
  else if(A==='chat'||A==='chatwait'){aN=-.7+Math.sin(t*5)*.45}
  if(o.banzai){aN=aF=-1+Math.sin(t*4)*.07;frontArm=bothF=true}/* わーい */
  if(o.carry&&!back){frontArm=bothF=true}
  if(tr>.5)bothF=false;
  return {br,st,arm,A,aN,aF,prop,lean2,sq,frontArm,bothF}}
function spProp(c,prop,sx,a,t,o){/* せいれいが手に持つ道具 */c.save();c.translate(sx*15,0);if(prop!=='food'&&prop!=='splash'){const g=sx*(.35+a);c.translate(Math.sin(g)*6,Math.cos(g)*6)}/* 道具は、手より下（画面の下へ6）で持つ */if(prop!=='food')c.scale(1.5,1.5);
    if(prop==='splash'){for(let k=0;k<5;k++){const ph=(t*1.2+k*.2)%1,dx=sx*(-4+k*2.2)+Math.sin(k*2.1)*2,dy=-8-ph*16+ph*ph*30;c.globalAlpha=Math.max(0,1-ph);c.fillStyle=k%2?'#d6f2ff':'#6fc0ff';c.beginPath();c.arc(dx*1.4,dy,2.6-ph,0,7);c.fill()}c.globalAlpha=1;c.restore();return}/* 水しぶき */
    const TPL={hammer:[-5,.5,26],axe:[-5,.68,30],pick:[-5,.5,30],saw:[-6,.4,32],hoe:[-5,.8,32]}[prop];
    if(TPL&&PSPR[prop]&&PSPR[prop].ok){const g=PSPR[prop],h=TPL[2]*g.h/g.w;c.save();c.scale(sx,prop==='axe'||prop==='hoe'?-1:1);/* 斧・くわの刃は、ふりおろす向き（下）に */c.drawImage(g.img,TPL[0],-h*TPL[1],TPL[2],h);c.restore()}
    else if(prop==='axe'||prop==='pick'||prop==='hoe'||prop==='hammer'||prop==='saw'){
      if(prop==='saw'){c.fillStyle='#b9bfc6';c.beginPath();c.moveTo(sx*2,-4);c.lineTo(sx*30,-3);c.lineTo(sx*30,5);c.lineTo(sx*2,6);c.closePath();c.fill();c.fillStyle='#8a5a33';rr(c,sx>0?-4:-4,-5,8,12,3)}
      else{const L=prop==='hammer'?16:24;c.strokeStyle='#b5764a';c.lineWidth=4.5;c.beginPath();c.moveTo(-sx*3,0);c.lineTo(sx*L,0);c.stroke();c.fillStyle='#a8a29a';
        if(prop==='axe'){c.beginPath();c.moveTo(sx*(L-7),-2);c.quadraticCurveTo(sx*(L-6),-16,sx*(L+5),-17);c.quadraticCurveTo(sx*(L+6),-8,sx*(L+3),2);c.closePath();c.fill();c.fillStyle='#e6e1d8';c.beginPath();c.moveTo(sx*(L+5),-17);c.quadraticCurveTo(sx*(L+7),-8,sx*(L+3),2);c.lineTo(sx*(L+1),1);c.quadraticCurveTo(sx*(L+4),-8,sx*(L+2.5),-16);c.closePath();c.fill();c.fillStyle='#7d5238';rr(c,sx>0?L-4:-L-1,-4,5,8,1.5)}
        else if(prop==='pick'){c.fillStyle='#a8a29a';c.beginPath();c.moveTo(sx*(L-1),-1);c.quadraticCurveTo(sx*(L-10),-14,sx*(L-20),-15);c.quadraticCurveTo(sx*(L-6),-17,sx*(L+2),-5);c.quadraticCurveTo(sx*(L+7),5,sx*(L+4),17);c.quadraticCurveTo(sx*(L+1),5,sx*(L-1),-1);c.closePath();c.fill();c.fillStyle='#7d5238';rr(c,sx>0?L-3:-L-2,-4,5,8,1.5)}
        else if(prop==='hoe'){c.fillStyle='#a7adb5';c.beginPath();c.moveTo(sx*L,-2);c.lineTo(sx*(L+2),-2);c.lineTo(sx*(L+2),12);c.lineTo(sx*(L-6),12);c.closePath();c.fill()}
        else{c.fillStyle='#8f949b';rr(c,sx>0?L-2:-L-5,-7,7,14,2)}}}
    else{c.rotate(-sx*(.35+a));
      if(prop==='food'&&o.food){const ei=emoImg(o.food);if(ei){const ih=44,iw=ih*ei.width/ei.height;c.drawImage(ei,-iw/2,-4-ih/2,iw,ih)}else{c.font='44px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(o.food,0,-4);c.textAlign='start';c.textBaseline='alphabetic'}}
      else if(prop==='can'&&PSPR.can.ok){const g=PSPR.can,h=30*g.h/g.w;c.scale(sx,1);c.drawImage(g.img,-12.6,-9.7,30,h);
        for(let k=0;k<3;k++){const ph=(t*1.8+k/3)%1;c.fillStyle='rgba(120,190,255,'+(1-ph)+')';c.beginPath();c.ellipse(18+ph*3,-6+ph*24,1.8,2.6,0,0,7);c.fill()}}
      else if(prop==='can'){c.fillStyle='#8fb4c8';rr(c,-9,-8,18,14,4);c.fillStyle='#a9c8d9';rr(c,-9,-8,18,4,2);c.strokeStyle='#8fb4c8';c.lineWidth=3.5;c.beginPath();c.moveTo(8,-2);c.lineTo(20,-10);c.stroke();
        for(let k=0;k<3;k++){const ph=(t*1.8+k/3)%1;c.fillStyle='rgba(120,190,255,'+(1-ph)+')';c.beginPath();c.ellipse(21+ph*3,-8+ph*26,1.8,2.6,0,0,7);c.fill()}}
      else if(prop==='ladle'){c.strokeStyle='#9a6a48';c.lineWidth=3;c.beginPath();c.moveTo(0,-6);c.lineTo(6,14);c.stroke();c.fillStyle='#8f949b';c.beginPath();c.ellipse(7,16,5,3,0,0,7);c.fill()}
      else if(prop==='rod'){c.strokeStyle='#9a6a48';c.lineWidth=3;c.beginPath();c.moveTo(-4,4);c.lineTo(30,-34);c.stroke();const bb=Math.sin(t*3)*3;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.2;c.beginPath();c.moveTo(30,-34);c.lineTo(38,14+bb);c.stroke();c.fillStyle='#e8604f';c.beginPath();c.arc(38,14+bb,3,0,7);c.fill()}}
    c.restore()}
// せいれいのドット絵：パーツ（頭・体・うで・手・しっぽ・表情）を、spPoseの動きで組み立てる。体・うで・手・表情は全属性で共通の絵を、色だけかえて使う
const SPDOT={},SPDOK={};
function spDot(key,el,vr){/* 絵の色を、その子の色にかえる（もとの色：共通の絵は木、ほかはその属性） */
  const ch=window.CHIPS&&CHIPS[key];if(!ch)return null;const im=chipImgs(ch,key)[0];if(!im.ok)return null;
  const se=key.startsWith('sp:')?'wood':el,k=key+'|'+el+'|'+(vr&&vr.h||0)+'_'+(vr&&vr.l||0);if(SPDOT[k])return SPDOT[k];
  const A=SPC[se],B=spcVar(el,vr);if(A===B)return SPDOT[k]=im;
  const cv=document.createElement('canvas');cv.width=ch.w;cv.height=ch.h;const g=cv.getContext('2d');g.drawImage(im,0,0);
  const d=g.getImageData(0,0,ch.w,ch.h),p=d.data,M={};for(const r in A)if(B[r])M[A[r].toLowerCase()]=B[r];
  for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const h='#'+((1<<24)|(p[i]<<16)|(p[i+1]<<8)|p[i+2]).toString(16).slice(1),to=M[h];if(to){p[i]=parseInt(to.slice(1,3),16);p[i+1]=parseInt(to.slice(3,5),16);p[i+2]=parseInt(to.slice(5,7),16)}}
  g.putImageData(d,0,0);return SPDOT[k]=cv}
function spDotReady(el){if(SPDOK[el])return true;if(!window.CHIPS)return false;
  for(const k in CHIPS)if((k.startsWith('sp:')||k.startsWith('sp_'+el+':'))&&!chipImgs(CHIPS[k],k)[0].ok)return false;return SPDOK[el]=true}
function drawSpiritDot(c,el,x,y,s,f,o){
  if(!spDotReady(el))return false;
  const TUNE=o.vr&&o.vr.key?KEYTUNE:BASETUNE,vr=o.vr,t=o.t||0,back=!!o.back,tr=(o.turn||0)>.5?1:0,D=1/.87;/* せいれいの絵は、ゲームの1ドットを2×2に分けた細かさ */
  let {br,st,arm,A,aN,aF,prop,lean2,sq,frontArm,bothF}=spPose(o,t,tr,back);
  const spr=(key,X,Y)=>{const ch=CHIPS[key],im=spDot(key,el,vr);if(im)c.drawImage(im,(X||0)+ch.ax*D,(Y||0)+ch.ay*D,ch.w*D,ch.h*D)};
  const E0='sp_'+el+':',S=tr?'S':'';
  // いきをする・しゃがむ・かたむくは、絵を回さずに、頭とうでをドット単位でずらす（ドットがくずれないように）
  const L=(o.lean||0)+lean2,hDy=-Math.round((br-sq)*44)*D,aDy=-Math.round((br-sq)*20)*D,hDx=Math.round(L*52)*D,aDx=Math.round(L*22)*D;
  c.save();c.translate(x,y);c.scale(s*f,s);
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  const tail=(tx,ty,rot)=>{c.save();c.translate(tx,ty);c.rotate((rot||0)+Math.sin(t*3)*.18);spr(E0+'tail');c.restore()};
  const wings=bk=>{if(o.bed)return;const fl=Math.sin(t*(o.walk?10:3.2))*.12,W=[[-16,-60,44,-2.5-fl],[16,-60,44,-.64+fl],[-18,-40,38,2.75+fl],[18,-40,38,.39-fl]];
    const lf=(w,k)=>{c.save();c.translate(w[0],w[1]);c.rotate(w[3]);if(w[2]!==44)c.scale(w[2]/44,w[2]/44);spr(E0+k);c.restore()};
    for(const w of W)lf(w,'leaf');if(bk){c.globalAlpha=.25;lf(W[0],'leafW');lf(W[1],'leafW');c.globalAlpha=1}};/* うしろ向きは、上のはねを少し白っぽく */
  if(el==='wind'&&!back){c.save();c.translate(-tr*9+hDx,hDy);c.scale(1-tr*.3,1);wings();c.restore()}
  if(!back&&el!=='wind'&&tr)tail(-18,-16,-.85);
  const armD=(sx,a)=>{c.save();c.translate(sx*14*TUNE.bodyW*(1-tr*.9)+(back?-1:1)*tr*2,-26*TUNE.bodyH+aDy);c.translate(aDx,0);c.rotate(sx*(.35+a));
    c.save();c.scale(sx,1);spr('sp:arm'+S);c.restore();if(prop&&sx===-farA&&!back)spProp(c,prop,sx,a,t,o);c.save();c.scale(sx,1);spr('sp:hand');c.restore();c.restore()};
  const farA=back?1:-1,aA0=sx=>o.carry?-1.85+Math.sin(t*9)*.08:tr?1.22+(o.walk?st*.6:Math.sin(t*1.7)*.05):(back?1:-1)*sx*arm+(back?0:.35),aA=sx=>sx===-farA?(aN!=null?aN:aA0(sx)):(aF!=null&&!o.carry?aF:aA0(sx));
  if(!bothF&&!tr)armD(farA,aA(farA));if(!tr&&!frontArm)armD(-farA,aA(-farA));
  {const ws=o.walk?st:0,up=v=>-Math.max(0,v)*3*D;/* 足：もとの体の下の部分を切り分けた絵。体より先にかいて、上のはしは体の下にもぐらせる（つけねに線を出さない）。止まっているときは、もとの形と同じ。歩くときは交互に上げる（横向きは前後にもふる） */
    if(tr){if(o.sit){spr('sp:rumpS');c.save();c.translate(4*D,-6*D);c.rotate(-Math.PI/2);c.scale(.8,1.3);c.translate(.5*D,8*D);spr('sp:footS');c.restore()}/* 横向きにすわる：まるいおしり（sp:rumpS）をかいて、足をつけねを中心に90度回して前へのばす */
      else{spr('sp:footS',-ws*3*D,up(ws));spr('sp:footS',ws*3*D,up(-ws))}}
    else{spr('sp:footL',0,up(ws));spr('sp:footR',0,up(-ws))}}
  spr('sp:body'+S+'0');
  if(tr&&!frontArm)armD(-farA,aA(-farA));
  if(back&&el!=='wind')tail(-tr*12,-17);
  // 頭と顔（食べるときは、うなずく）
  const nod=A==='eat'?Math.round(Math.max(0,Math.sin(t*7))*2.8)*D:0;c.save();c.translate(hDx,hDy+nod);
  // 頭巾だけ属性ごと。顔の丸は共通（風の子は頭巾のかわりに、まるい頭とつる）。小さく動く所（頭巾の先・芽・火の玉・つる）は別のパーツ
  const H=TUNE.head,hs=tr&&!back?'S':'',hp=(lx,ly)=>[(hs?-TUNE.sHoodX+lx*TUNE.sHead:lx)*H,-30*TUNE.bodyH+H*(ly+36)],/* 頭の中の位置→体の位置 */
    rot=(k,lx,ly,a)=>{const[px,py]=hp(lx,ly);c.save();c.translate(px,py);c.rotate(a);c.translate(-px,-py);spr(k);c.restore()},dd=v=>Math.round(v*H*.87)*D;
  if(el==='wind'){const[px,py]=[(back?1:-1)*tr*4*H,-30*TUNE.bodyH+H*(-79+36)];c.save();c.translate(px,py);c.rotate(Math.sin(t*2)*.15);c.translate(-px,-py);spr(E0+'vine'+hs);c.restore()}
  spr(E0+'hood'+hs);
  if(el==='wood'||el==='fire'){const v=dd(Math.sin(t*(el==='fire'?7:2.2))*(el==='fire'?2.5:1.4));spr(E0+'tip'+hs,v,0)}/* 頭巾の先が左右にゆれる */
  if(el==='water'){const v=dd(Math.sin(t*2.2)*1.4);if(v<0)spr(E0+'tip'+hs);spr(E0+'tip'+hs,0,v)}/* 水の子は上下（上がるときは、すきまがあかないように元の位置にも描く） */
  if(el==='fire')spr(E0+'ember'+hs,0,dd(Math.sin(t*3)*2.5));/* 火の玉がふわふわ */
  if(el==='earth')rot(E0+'sprout'+hs,1,-88,Math.sin(t*2.4)*.18);/* 芽がゆれる */
  if(el==='wind'&&back){c.save();c.translate(0,-30*TUNE.bodyH);c.scale(TUNE.head,TUNE.head);c.translate(0,36);c.scale(1-tr*.3,1);wings(1);c.restore()}/* うしろ向きのはねは、頭といっしょに */
  if(!back){if(el!=='wind')spr('sp:head'+S);if(el==='fire'&&!tr)spr(E0+'bang');
    const md=o.sleep?'':o.mood==='cry'?'teary':o.mood||'',fy=el==='wind'?-3*D:0;
    const fm=o.sleep||(o.blink&&!md)?'shut':md==='smile'||md==='joy'||md==='eat'?'hap':['teary','tear','shock','strain','sad','brave'].includes(md)?md:'n';
    if(vr&&vr.cheek)spr('sp:cheek'+S,0,fy);
    spr('sp:face'+S+'#'+fm,0,fy);
    if(vr&&vr.lash&&fm!=='strain')spr('sp:lash'+S+'#'+fm,0,fy)}/* まつげは、表情ごとの目に合わせた絵 */
  c.restore();
  if(bothF)armD(farA,aA(farA));if(frontArm)armD(-farA,aA(-farA));
  if((A==='eat'||A==='hold')&&o.food&&!back){const ei=emoImg(o.food),yy=A==='hold'?-17:-27+Math.sin(t*7)*.8,xx=tr?25:0;/* 横向きのときは、食べ物を顔の前に（体の大きさ0.435で、およそ11ドット前） */if(ei){const ih=40,iw=ih*ei.width/ei.height;c.drawImage(ei,xx-iw/2,yy-ih/2,iw,ih)}else{c.font='40px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(o.food,xx,yy);c.textAlign='start';c.textBaseline='alphabetic'}}
  if(A==='eat'&&tr&&o.food&&!back)armD(-farA,aA(-farA));/* 横向きで食べるときは、手前の手を食べ物の上にかさねて、持っている形に */
  c.imageSmoothingEnabled=sm;c.restore();return true}
function drawSpirit(c,el,x,y,s,f,o){
  if(o.dot&&drawSpiritDot(c,el,x,y,s,f,o))return;
  const TUNE=o.vr&&o.vr.key?KEYTUNE:BASETUNE;
  const P=spcVar(el,o.vr),t=o.t||0,back=!!o.back,tr=o.turn||0;
  let {br,st,arm,A,aN,aF,prop,lean2,sq,frontArm,bothF}=spPose(o,t,tr,back);
  c.save();c.translate(x,y);c.scale(s*f*(1-br*.6+sq*.35),s*(1+br-sq));if(o.lean)c.rotate(o.lean);if(lean2)c.rotate(lean2);
  c.lineJoin='round';c.lineCap='round';
  const E=(cx,cy,rx,ry,rot,fill,stroke,lw)=>{c.beginPath();c.ellipse(cx,cy,rx,ry,rot||0,0,7);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2.4;c.stroke()}};
  const leaf=(cx,cy,len,w,rot,col)=>{c.save();c.translate(cx,cy);c.rotate(rot);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.35,-w,len,0);c.quadraticCurveTo(len*.55,w*.9,0,0);c.fill();c.restore()};
  // しっぽ（前向きは横、うしろ向きは真ん中）
  const tail=(tx,ty,sc,rot)=>{c.save();c.translate(tx,ty);sc*=TUNE.tail;c.scale(sc,sc);c.rotate((rot||0)+Math.sin(t*3)*.18);
    if(el==='earth'){c.fillStyle=P.hood;c.beginPath();c.moveTo(-9,-11);c.lineTo(6,-12);c.lineTo(11,-2);c.lineTo(8,9);c.lineTo(-6,11);c.lineTo(-11,1);c.closePath();c.fill()}
    else if(el==='water'){const w=Math.sin(t*4)*1.5;c.fillStyle=P.hood;c.beginPath();c.moveTo(0+w,-16);c.quadraticCurveTo(11,0,7,7);c.quadraticCurveTo(0,14,-7,7);c.quadraticCurveTo(-11,0,0+w,-16);c.fill()}
    else if(el==='fire'){const w=Math.sin(t*11)*2.5;c.fillStyle=P.hood;c.beginPath();c.moveTo(w,-17);c.quadraticCurveTo(-2,-6,8,-2);c.quadraticCurveTo(12,8,2,11);c.quadraticCurveTo(-11,9,-9,0);c.quadraticCurveTo(-7,-8,w,-17);c.fill()}
    else if(el==='wood'){c.fillStyle=P.hood;c.beginPath();c.moveTo(0,-15);c.quadraticCurveTo(12,-4,0,12);c.quadraticCurveTo(-12,-4,0,-15);c.fill();c.strokeStyle=P.vein;c.lineWidth=1.8;c.beginPath();c.moveTo(0,-11);c.lineTo(0,9);c.stroke()}
    c.restore()};
  // 葉っぱの羽（木）
  const wings=front=>{if(o.bed)return;/* ベッドではねをたたむ（ふとんからはみ出さない） */const fl=Math.sin(t*(o.walk?10:3.2))*.12;
    leaf(-16,-60,44,19,-2.5-fl,P.hood);leaf(16,-60,44,19,-.64+fl,P.hood);
    leaf(-18,-40,38,16,2.75+fl,P.hood);leaf(18,-40,38,16,.39-fl,P.hood);
    if(!front){c.globalAlpha=.25;leaf(-16,-60,44,19,-2.5-fl,'#fff');leaf(16,-60,44,19,-.64+fl,'#fff');c.globalAlpha=1}};
  if(el==='wind'&&!back){c.save();c.translate(-tr*9,0);c.scale(1-tr*.3,1);wings(true);c.restore()}
  if(!back&&el!=='wind'&&tr>0)tail(-13-tr*5,-16,1,-.85*tr);/* 正面からはしっぽは見えない *//* 横向きは、ななめにして体のうしろに刺す（体より先に描く） */
  // 腕
  const drawProp=(sx,a)=>spProp(c,prop,sx,a,t,o);
  const armD=(sx,a)=>{c.save();c.translate(sx*14*TUNE.bodyW*(1-tr*.9)+(back?-1:1)*tr*2,-26*TUNE.bodyH);c.rotate(sx*(.35+a));E(sx*9*TUNE.armL,0,10*TUNE.armL,6*TUNE.armW*(tr>.5?1.5:1),0,CREAM,P.line,TUNE.line*.92);if(prop&&sx===-farA&&!back)drawProp(sx,a);E(sx*15*TUNE.armL,0,5*TUNE.hand,5.2*TUNE.hand,0,P.hand);c.restore()};
  const farA=back?1:-1,aA0=sx=>o.carry?-1.85+Math.sin(t*9)*.08:tr>.5?1.22+(o.walk?st*.6:Math.sin(t*1.7)*.05):(back?1:-1)*sx*arm+(back?0:.35)/* 正面は腕を少し下ろす */,/* 横向きは、腕を体の真横にさげて前後にふる */aA=sx=>sx===-farA?(aN!=null?aN:aA0(sx)):(aF!=null&&!o.carry?aF:aA0(sx));if(!bothF&&tr<=.5)armD(farA,aA(farA));if(tr<=.5&&!frontArm)armD(-farA,aA(-farA));
  // からだと足
  c.save();c.scale((1-tr*.18)*TUNE.bodyW,TUNE.bodyH);const sh=o.walk?st*4*tr:0;
  const l1=o.walk?Math.max(0,st)*4*(1-tr*.5):0,l2=o.walk?Math.max(0,-st)*4*(1-tr*.5):0;
  c.fillStyle=CREAM;c.strokeStyle=P.line;c.lineWidth=TUNE.line;c.beginPath();
  if(tr>.5){const sw=o.walk?st*5:0,lf=o.walk?Math.abs(st)*2.5:0;/* 横向きは足を1本だけ見せる */
    c.moveTo(-15,-32);c.quadraticCurveTo(-19,-18,-10+sw,-8-lf);c.quadraticCurveTo(-8+sw,0-lf,-1+sw,0-lf);c.quadraticCurveTo(6+sw,0-lf,9+sw,-8-lf);c.quadraticCurveTo(19,-18,15,-32);c.closePath();c.fill();c.stroke()}
  else{
  c.moveTo(-15,-32);c.quadraticCurveTo(-19,-18,-17-sh,-8-l1);c.quadraticCurveTo(-14-sh,0-l1,-8-sh,0-l1);c.quadraticCurveTo(-3-sh,0-l1,-1,-8);c.lineTo(1,-8);
  c.quadraticCurveTo(3+sh,0-l2,8+sh,0-l2);c.quadraticCurveTo(14+sh,0-l2,17+sh,-9-l2);c.quadraticCurveTo(19,-18,15,-32);c.closePath();c.fill();c.stroke()}c.restore();
  if(tr>.5&&!frontArm)armD(-farA,aA(-farA));
  if(back&&el!=='wind')tail(-tr*12,-17,1.05-tr*.15);
  // 頭
  const nod=A==='eat'?Math.max(0,Math.sin(t*7))*3.2:0;c.save();c.translate(0,-30*TUNE.bodyH+nod);c.rotate(nod*.012);c.scale(TUNE.head,TUNE.head);c.translate(0,36);
  const hx=0,hy=-55;
  if(el==='wind'){
    // つる
    const sw=Math.sin(t*2)*.15;c.save();c.translate((back?1:-1)*tr*4,hy-24);c.rotate(sw);c.strokeStyle=P.tend;c.lineWidth=3;c.beginPath();c.moveTo(0,4);c.quadraticCurveTo(-2,-8,6,-12);c.arc(6,-18,6,Math.PI*.5,Math.PI*2.2);c.stroke();c.restore();
    E(hx,hy,25,22,0,CREAM,P.line,2.6);
    if(back){c.save();c.translate(-tr*9,0);c.scale(1-tr*.3,1);wings(false);c.restore()}
  }else{
    const sw=Math.sin(t*(el==='fire'?7:2.2))*(el==='fire'?2.5:1.4);
    c.save();if(tr>0&&!back){c.translate(-tr*TUNE.sHoodX,0);c.scale(1-tr*(1-TUNE.sHead),1)}/* 横向きは頭巾を少しうしろへ。顔より前に出ないように */
    c.fillStyle=P.hood;c.beginPath();
    if(el==='earth'){c.moveTo(-36,-36);c.quadraticCurveTo(-42,-46,-30,-56);c.quadraticCurveTo(-26,-80,-6,-82);c.quadraticCurveTo(14,-84,22,-70);c.quadraticCurveTo(30,-56,36,-52);c.quadraticCurveTo(44,-44,34,-34);c.quadraticCurveTo(0,-26,-36,-36)}
    else if(el==='water'){c.moveTo(-28,-36);c.quadraticCurveTo(-38,-50,-28,-66);c.quadraticCurveTo(-14,-80,0,-94+sw);c.quadraticCurveTo(10,-108,22,-100+sw);c.quadraticCurveTo(28,-94,22,-92);c.quadraticCurveTo(16,-94,15,-86);c.quadraticCurveTo(18,-76,26,-64);c.quadraticCurveTo(36,-48,26,-36);c.quadraticCurveTo(0,-28,-28,-36)}
    else if(el==='fire'){c.moveTo(-28,-36);c.quadraticCurveTo(-38,-54,-24,-68);c.quadraticCurveTo(-12,-78,-6,-88);c.quadraticCurveTo(0,-100,12+sw,-102);c.quadraticCurveTo(4,-92,10,-82);c.quadraticCurveTo(28,-70,30,-56);c.quadraticCurveTo(34,-44,26,-36);c.quadraticCurveTo(0,-28,-28,-36)}
    else{c.moveTo(-30,-36);c.quadraticCurveTo(-42,-56,-26,-74);c.quadraticCurveTo(-12,-90,6+sw,-104);c.quadraticCurveTo(26,-88,30,-66);c.quadraticCurveTo(38,-48,28,-36);c.quadraticCurveTo(0,-28,-30,-36)}
    c.fill();
    if(el==='wood'){c.strokeStyle=P.vein;c.lineWidth=2.4;c.beginPath();c.moveTo(4+sw*.6,-98);c.quadraticCurveTo(2,-86,0,-76);c.moveTo(1,-86);c.lineTo(-10,-78);c.moveTo(2,-88);c.lineTo(12,-80);c.stroke();c.strokeStyle=P.dark;c.lineWidth=3;c.beginPath();c.moveTo(6+sw,-104);c.quadraticCurveTo(10,-112,16,-112);c.stroke()}
    if(el==='fire'){const dy=Math.sin(t*3)*2.5;c.save();c.translate(24,-112+dy);c.fillStyle=P.hood;c.beginPath();c.moveTo(2,-9);c.quadraticCurveTo(8,0,5,4);c.quadraticCurveTo(0,8,-4,3);c.quadraticCurveTo(-6,-3,2,-9);c.fill();c.restore()}
    if(el==='earth'){const ls=Math.sin(t*2.4)*.18;c.strokeStyle=P.leaf;c.lineWidth=2.6;c.beginPath();c.moveTo(0,-80);c.lineTo(1,-88);c.stroke();leaf(1,-88,20,9,-2.6+ls,P.leaf);leaf(1,-88,30,12,-.55+ls,P.leaf)}
    c.restore();
    if(!back){E(hx+tr*TUNE.sFaceX,hy+TUNE.faceY,TUNE.faceW-tr*TUNE.sFaceW,TUNE.faceH,0,CREAM);/* 横顔は奥行きを短く */
      if(el==='fire'&&tr<.5){c.save();c.translate(tr*9,0);c.fillStyle=P.hood;c.beginPath();c.moveTo(-6,-76);c.quadraticCurveTo(8,-66,4,-50);c.quadraticCurveTo(10,-60,12,-74);c.fill();c.restore()}}
  }
  // 顔
  if(!back){const ey=(el==='wind'?-53:-50)+TUNE.eyeY,xn=TUNE.eyeGap+tr*TUNE.sEye,xf=-TUNE.eyeGap+tr*14,/* 横顔の目は少し奥 */sf=1,showF=tr<.85;
    const md=o.sleep?'':o.mood==='cry'?'teary':o.mood||'',my=ey+9,mx=(xn+xf)/2+tr*TUNE.sMouth;c.strokeStyle=P.eye;c.fillStyle=P.eye;c.lineWidth=2.1;
    const eyeL=(x,w,k)=>{c.beginPath();if(k==='happy'){c.moveTo(x-3*w,ey+1.5);c.quadraticCurveTo(x,ey-3.5,x+3*w,ey+1.5)}else{c.moveTo(x-3*w,ey);c.quadraticCurveTo(x,ey+2.5,x+3*w,ey)}c.stroke()};
    if(o.vr&&o.vr.cheek){const ck=P.cheek;/* ほっぺは、頭巾の色をうすくした色 */E(xn+5+tr*TUNE.sCheek,ey+8-tr*2,4.2*TUNE.cheekS*(1-tr*.25),2.6*TUNE.cheekS,0,ck);if(showF)E(xf-5*sf,ey+8,4.2*TUNE.cheekS*sf,2.6*TUNE.cheekS,0,ck)}/* ほっぺ（目より下のレイヤー） */
    if(o.sleep||(o.blink&&!md))[[xn,1],showF&&[xf,sf]].forEach(e=>e&&eyeL(e[0],e[1]));
    else if(md==='smile'||md==='joy'||md==='eat')[[xn,1],showF&&[xf,sf]].forEach(e=>e&&eyeL(e[0],e[1],'happy'));
    else if(md==='teary'||md==='tear'){/* うるうる・片目の涙：目を開いたまま潤ませる */
      const watery=(x,w)=>{c.save();c.globalAlpha=.7;c.strokeStyle='#8fd3ff';c.lineWidth=1.8;c.beginPath();c.ellipse(x,ey+1.5,TUNE.eyeW*w*.88,TUNE.eyeH*.72,0,0,Math.PI*2);c.stroke();c.globalAlpha=.88;c.fillStyle='#b5e7ff';c.beginPath();c.ellipse(x+TUNE.eyeW*w*.55,ey+TUNE.eyeH*.65,1.4,2,0,0,7);c.fill();c.restore()};
      E(xn,ey+1,TUNE.eyeW,TUNE.eyeH*.92,0,P.eye);if(showF)E(xf,ey+1,TUNE.eyeW*sf,TUNE.eyeH*.92,0,P.eye);
      if(md==='tear'){watery(xn,1)}else{watery(xn,1);if(showF)watery(xf,sf)}
    }
    else if(md==='shock'){E(xn,ey,TUNE.eyeW*1.14,TUNE.eyeH*1.13,0,P.eye);if(showF)E(xf,ey,TUNE.eyeW*1.14*sf,TUNE.eyeH*1.13,0,P.eye)}
    else if(md==='strain'){c.lineWidth=2.3;const ch=(x,d)=>{c.beginPath();c.moveTo(x-3*d,ey-3.5);c.lineTo(x+3*d,ey);c.lineTo(x-3*d,ey+3.5);c.stroke()};if(showF){ch(Math.min(xn,xf),1);ch(Math.max(xn,xf),-1)}else ch(xn,1)}
    else{const eh=md==='sad'?TUNE.eyeH*.78:TUNE.eyeH;E(xn,ey+(md==='sad'?1:0),TUNE.eyeW,eh,0,P.eye);if(showF)E(xf,ey+(md==='sad'?1:0),TUNE.eyeW*sf,eh,0,P.eye)}
    if(md==='sad'){c.lineWidth=2;c.beginPath();c.moveTo(xn-5,ey-10);c.lineTo(xn+3,ey-8);c.stroke()}/* 悲しいときの眉は片側だけ */
    if(o.vr&&o.vr.lash&&md!=='strain'){/* まつ毛：目の外がわに1本。目の形に合わせて付け根をかえる */
      const shut=o.sleep||(o.blink&&!md),hap=!shut&&(md==='smile'||md==='joy'||md==='eat'),k=md==='shock'?1.14:1,sy=md==='sad'?1:0,eh=(md==='sad'?.78:1)*TUNE.eyeH*k;
      const lash=(x,d)=>{let bx,by;if(shut){bx=x+3*d;by=ey}else if(hap){bx=x+3*d;by=ey+1.5}else{bx=x+TUNE.eyeW*k*.8*d;by=ey+sy-eh*.6}
        c.moveTo(bx,by);c.quadraticCurveTo(bx+1.8*d,by-.6,bx+3*d,by-2.4)};
      c.strokeStyle=P.eye;c.lineWidth=1.5;c.beginPath();lash(xn,1);if(showF)lash(xf,-1);c.stroke()}
}
  c.restore();if(bothF)armD(farA,aA(farA));if(frontArm)armD(-farA,aA(-farA));if((A==='eat'||A==='hold')&&o.food&&!back){const ei=emoImg(o.food),yy=A==='hold'?-17:-27+Math.sin(t*7)*.8;if(ei){const ih=40,iw=ih*ei.width/ei.height;c.drawImage(ei,-iw/2,yy-ih/2,iw,ih)}else{c.font='40px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#000';c.fillText(o.food,0,yy);c.textAlign='start';c.textBaseline='alphabetic'}}c.restore();
}
const portCache={};
function spiritPort(el,sz,vr){const k=el+sz+(vr?JSON.stringify(vr):'');if(portCache[k])return portCache[k];const cv=document.createElement('canvas');cv.width=cv.height=sz;const g=cv.getContext('2d');drawSpirit(g,el,sz/2,sz*.97,sz/124,1,{t:0,vr});return portCache[k]=cv.toDataURL()}
const WALLHIT=new Map(),JUMP=new WeakMap(),DOOROP=new Map(),SPV=new WeakMap();
/* ドアの開き：せいれいが近づいたら、通る前に開く（開きはじめにガチャ） */
function doorOp(i,x,y,ax,ay){let d=DOOROP.get(i);if(!d){d={op:0};DOOROP.set(i,d)}d.cx=x/TS+.5;d.cy=y/TS+.5;d.ax=ax;d.ay=ay;return d.op}/* 描くときは読むだけ。開け閉めは stepLooks で進める（ax・ay：せいれいが近いとみなす はんい） */
/* レベルアップ：みんながこっちを向いて拍手する */
/* レベルアップの画面が出ているあいだ、せいれいはこっちを向いて拍手する。タップでおわり */
let CLAPT=-1e9,CLAPON=false,CLAPS=0;function startClap(){CLAPT=performance.now();CLAPON=true;CLAPS=CLAPT}
function endClap(){CLAPON=false;CLAPT=-1e9;if(S)for(const r of S.res)if(r.bubble==='👏')r.bubble=''}
const LVSLOT=[[-21,-30],[21,-18],[-23,-11],[23,-38],[-28,-46],[28,-6]];
function lvCharm(c,el,x,y,t){c.save();c.translate(x,y);c.rotate(Math.sin(t*1.3)*.25);
  if(el==='wood'){c.fillStyle='#5fbf4f';c.beginPath();c.moveTo(0,-5.5);c.quadraticCurveTo(5,-1,0,5.5);c.quadraticCurveTo(-5,-1,0,-5.5);c.fill();c.strokeStyle='#3f8f37';c.lineWidth=1;c.beginPath();c.moveTo(0,-4);c.lineTo(0,4.5);c.stroke()}/* 葉っぱ */
  else if(el==='earth'){c.fillStyle='#a99a86';c.beginPath();c.moveTo(-4.5,1.5);c.lineTo(-3,-3);c.lineTo(1.5,-4.2);c.lineTo(4.6,-1);c.lineTo(3.6,3.4);c.lineTo(-1.5,4.2);c.closePath();c.fill();c.fillStyle='#cbbfae';c.beginPath();c.ellipse(-.8,-1.4,1.8,1.1,-.4,0,7);c.fill()}/* 小石 */
  else if(el==='water'){c.fillStyle='#5fb4f0';c.beginPath();c.moveTo(0,-5.5);c.quadraticCurveTo(4.5,0,3.6,2.4);c.arc(0,2.4,3.6,0,Math.PI);c.quadraticCurveTo(-4.5,0,0,-5.5);c.fill();c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(-1.2,1.6,1,1.5,0,0,7);c.fill()}/* しずく */
  else if(el==='fire'){const f=1+Math.sin(t*9)*.08;c.scale(1,f);c.fillStyle='#ff7a3d';c.beginPath();c.moveTo(0,-6);c.quadraticCurveTo(4.5,-1,3.4,2.4);c.arc(0,2.4,3.4,0,Math.PI);c.quadraticCurveTo(-4,-1,0,-6);c.fill();c.fillStyle='#ffd25a';c.beginPath();c.moveTo(0,-1.5);c.quadraticCurveTo(2.2,1.5,0,4.2);c.quadraticCurveTo(-2.2,1.5,0,-1.5);c.fill()}/* ひのこ */
  else{c.rotate(.6);c.fillStyle='#9fe8d2';c.beginPath();c.moveTo(0,-6.5);c.quadraticCurveTo(4,-1,.6,5.5);c.quadraticCurveTo(-3.6,-1,0,-6.5);c.fill();c.strokeStyle='#3fae8e';c.lineWidth=1;c.lineCap='round';c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(.6,0,.4,7);c.stroke()}/* 風の羽根 */
  c.restore()}
function carryIcon(r){
  if(r.coffin)return r.act&&r.act.type==='pray'&&r.act.stage==='do'?'':'⚰️';/* おいのりのあいだは、棺はおろしている */
  if(r.act&&r.act.stage==='do'&&r.act.type==='cook')return null;
  if(r.carry&&carryN(r)>0){if(typeof r.carry==='number')return FOODS.mugi.e;const k=r.carryLast&&r.carry[r.carryLast]>0?r.carryLast:Object.keys(r.carry).find(k=>r.carry[k]>0);return FOODS[k]?FOODS[k].e:'🧺'}
  if(r.cmat)return r.cmat.wood?'🪵':'🪨';
  if(r.meal)return typeof r.meal==='number'?'🍙':(r.meal.e||'🍙');
  if(r.cing&&!isNight()){const R=RECIPES.find(x=>x.out===r.cing.rec);return R?FOODS[Object.keys(R.need)[0]].e:'🧺'}/* 夜は料理ができないので、材料を持っている絵は出さない */
  return null}
let COFFIN=null;function coffinBmp(){/* 棺の絵文字を一度だけ描いて、見えている部分だけ切り出す（機種で絵文字の位置がちがっても、まんなかに置ける） */if(COFFIN)return COFFIN.w?COFFIN:null;const N=288,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.font='117px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('⚰️',N/2,N/2);let d;try{d=x.getImageData(0,0,N,N).data}catch(e){return null}let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let i=0;i<N;i++)if(d[(y*N+i)*4+3]>20){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0){COFFIN={};return null}const w=x1-x0+1,h=y1-y0+1,o=document.createElement('canvas');o.width=w;o.height=h;o.getContext('2d').drawImage(c,x0,y0,w,h,0,0,w,h);COFFIN={c:o,w:w/3,h:h/3};return COFFIN}/* 3倍の大きさで描いて、くっきりさせる（表示は39pxぶん） */
function carryIcons(r){/* 持っているものを、そのまま1つずつ並べる（上に積むほど新しい） */
  const em=k=>FOODS[k]?FOODS[k].e:'🧺',out=[];
  if(r.coffin)return['⚰️'];/* 棺を持っているときは、それだけ */
  if(r.act&&r.act.stage==='do'&&r.act.type==='cook')return out;
  if(typeof r.carry==='number')for(let i=0;i<r.carry;i++)out.push(FOODS.mugi.e);
  else if(r.carry){const ks=Object.keys(r.carry).filter(k=>r.carry[k]>0);if(r.carryLast&&ks.includes(r.carryLast)){ks.splice(ks.indexOf(r.carryLast),1);ks.push(r.carryLast)}for(const k of ks)for(let i=0;i<r.carry[k];i++)out.push(em(k))}
  if(r.cmat){for(let i=0;i<(r.cmat.wood||0);i++)out.push('🪵');for(let i=0;i<(r.cmat.stone||0);i++)out.push('🪨');for(let i=0;i<(r.cmat.bamboo||0);i++)out.push('🎋');for(const[k,e]of[['shina','obj:weed0g'],['kasa','obj:weed0k'],['kuru','obj:weed1g'],['chiri','obj:weed1k'],['funba','obj:weedc'],['eda','🥢'],['kinoko','obj:kinoko'],['can','🥫']])/* 草・きのこは、その物の絵（小麦などの絵文字にしない） */for(let i=0;i<(r.cmat[k]||0);i++)out.push(e)}
  if(r.meal){if(r.meal.items&&r.meal.items.length)for(const k of r.meal.items)out.push(em(k));else for(let i=0,n=Math.ceil(typeof r.meal==='number'?r.meal:r.meal.u||1);i<n;i++)out.push(typeof r.meal==='number'?'🍙':(r.meal.e||'🍙'))}
  if(!out.length&&r.cing&&!isNight()){const R=RECIPES.find(x=>x.out===r.cing.rec);out.push(R?em(Object.keys(R.need)[0]):'🧺')}
  return out}
const NOFACE={'😊':'🎵','😌':'🎵','😆':'✨','😋':'🍴','😣':'💦','😩':'💤','😴':'💤','😭':'💧','😢':'💧','😨':'💦','😱':'❗','😵':'💫','😠':'💢','😤':'💢'};/* 吹き出しに顔の絵文字は出さない（かわりの絵） */
let BUBQ=null;
function objBelow(r){const j=r.faceObj;if(j==null||j<0)return false;return ((j/W)|0)+.5>r.y+.3&&Math.abs(j%W+.5-r.x)<.6}/* 下にある木・岩は正面のまま */
function drawRes(r,now){
  if(r.spawnT){const e=now-r.spawnT;if(e<450)return;if(e<1300){const k=e<900?(e-450)/450:1,sq=e<900?1:1+Math.sin((e-900)/400*Math.PI)*.18,px=r.x*TS,py=r.y*TS+9,rise=(1-k)*14;
    ctx.save();ctx.translate(px,py-rise);ctx.scale(k*(2-sq),k*sq);ctx.translate(-px,-py);drawRes0(r,now);ctx.restore();return}}
  const yk=r.act&&r.act.type==='shopkeep'&&r.act.stage==='do'&&r.elem!=='wind';if(yk){ctx.save();ctx.translate(0,-20)}/* 屋台の中の店番の子は、20点上に（屋台の台のうしろから見える） */
  drawRes0(r,now);if((r.shU||0)>S.t)drawLeaf(r,now);if(yk)ctx.restore()}
// ベンチ。front=true のときは、すわった子の前に来る座面のふちと脚だけ
function drawBench(c,x,y,front){/* ベンチは横2マス */
  const L=64;
  if(!front){shadow(c,x+L/2,y+30,L/2-2,3);c.fillStyle='#8a5a33';c.fillRect(x+4,y+5,3,17);c.fillRect(x+L-7,y+5,3,17);
    c.fillStyle='#b9824f';rr(c,x+2,y+6,L-4,4.5,2);rr(c,x+2,y+12,L-4,4,2);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x+4,y+6.6,L-8,1.2);
    c.fillStyle='#c9935f';rr(c,x+1,y+18,L-2,4,2)}
  c.fillStyle='#a8733f';rr(c,x+1,y+21,L-2,4,1.5);c.fillStyle='#8a5a33';c.fillRect(x+4,y+24,3.2,7);c.fillRect(x+L/2-1.6,y+24,3.2,7);c.fillRect(x+L-7.2,y+24,3.2,7);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x+1,y+24,L-2,1)}
const SHINE=[[-22,-46,12],[21,-58,13],[-8,-74,8],[25,-30,10],[-27,-22,8],[11,-10,7]];
function star4(c,x,y,r){c.save();c.translate(x,y);c.fillStyle='rgba(255,240,170,.35)';c.beginPath();c.arc(0,0,r*.7,0,7);c.fill();c.fillStyle='#fffbe0';c.strokeStyle='#f2c94c';c.lineWidth=1.2;c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r*.18,-r*.18,r,0);c.quadraticCurveTo(r*.18,r*.18,0,r);c.quadraticCurveTo(-r*.18,r*.18,-r,0);c.quadraticCurveTo(-r*.18,-r*.18,0,-r);c.fill();c.stroke();c.fillStyle='#ffd84a';c.beginPath();c.arc(0,0,r*.22,0,7);c.fill();c.restore()}
function rDepth(r){return r.y}
const forageAnim=r=>{const t=r.act.t||0;return t<2?'pluck':t<3.5?'hold':'eat'};
function drawRes0(r,now){
  if(r.hidden&&!peekH(r))return;
  const sleeping=r.act&&r.act.type==='sleep'&&r.act.stage==='do',bedJ=sleeping&&r.act.obj!=null&&BEDSET.has(S.obj[r.act.obj])&&BEDSPR.ok?r.act.obj:-1,benchJ=r.act&&r.act.type==='rest'&&r.act.stage==='do'&&BENCHES.has(S.obj[r.act.obj])?(r.act.seat??r.act.obj):-1;/* ベンチではすわって見える *//* ベッドで眠るときは、まくらに頭をのせて、ふとんをかける */
  const bedH=bedJ>=0&&rotAt(bedJ)===1;/* 横に置いたベッド */const benchR=benchJ>=0?rotAt(r.act.obj):0,benchV=benchJ>=0&&benchR%2===1,benchD=benchR===3?-1:1;/* ベンチは、置いたときの向き（前・右・後ろ・左）にすわる */let sj=bedJ>=0?bedJ:benchJ,px=bedH?(bedJ%W)*TS+BEDHX:sj>=0?(sj%W+.5)*TS:r.x*TS,py=bedH?((bedJ/W)|0)*TS+BEDHY:bedJ>=0?((bedJ/W)|0)*TS+BEDVY:benchJ>=0?(((benchJ/W)|0)+.5)*TS+1:r.y*TS;const talking=DLGA.who===r.name&&!(DLGEL||(DLGEL=$('#dialog'))).hidden,walking=!talking&&r.act&&(r.act.stage==='walk'&&r.path.length>0||r.act.type==='tag');/* 話しているときはこっちを向く */
  const working=!onHold(r)&&r.act&&r.act.stage==='do'&&['till','sow','plant','build','craft','water','tend','repair','harvest','gather','chop','mine','cook'].includes(r.act.type);
  if(!SPV.has(r))SPV.set(r,{x:r.x,y:r.y,back:false,turn:0,bl:now+2000+Math.random()*3000});const v=SPV.get(r),dx=r.x-v.x,dy=r.y-v.y;
  if(!walking){v.back=false;v.turn=r.act&&r.act.stage==='do'&&(r.act.type==='chop'||r.act.type==='mine')&&!objBelow(r)||benchV?1:0}/* 木・岩は横向きで、そちらを向いて切る */else if(Math.abs(dx)+Math.abs(dy)>.002){const ax=Math.abs(dx),ay=Math.abs(dy);v.turn=ax>ay*1.2?1:0;v.back=!v.turn&&dy<0}{const cj=(r.y|0)*W+(r.x|0),n=r.path&&r.path.length?r.path[0]:-1;if(n>=0&&n===cj-W&&(jumpEdge(cj,n)&&hiAt(n)>hiAt(cj)||ladderLink(n,cj))||LADDERS.has(S.obj[cj])&&ladderDir(cj)===0&&n>=0){v.back=true;v.turn=0}}/* 正面のがけをよじのぼるときは、うしろ向き */v.x=r.x;v.y=r.y;
  v.side=false;{const sj=(r.y|0)*W+(r.x|0),so=S.obj[sj];if(!walking&&r.act&&r.act.stage==='do'&&so&&ROTS[so]===4&&SEATS.includes(so)){const ro=rotAt(sj);v.back=ro===2;v.turn=ro===1||ro===3?1:0;if(v.turn)r.face=ro===1?1:-1;v.side=!!v.turn}if(!walking&&benchJ>=0)v.back=benchR===2}/* ベンチで「後ろ」向きなら、せなかが見える *//* いすにすわっている子は、いすの向きにすわる（うしろ向きのいすなら、うしろ向き） */
  const at=r.act&&r.act.type,ad=r.act&&r.act.stage==='do',jt=JUMP.get(r),held=HOLD.has(r.id),jumping=held||jt!=null&&now-jt<1000;
  const reacting=(at==='sevreact'||at==='phew')&&ad&&r.act.reactAt!=null,rm=reacting?r.act.reactMotion:'',rp=reacting?dialoguePose(rm,now-r.act.reactAt):null;if(rp){const k=rm==='phew'?1:.4;px+=rp.x*k;py+=rp.y*k}
  const brave=now-(BRAVET.get(r)||-1e9)<1500;/* 勇ましい顔は、行動の切りかわりや、たたかれた時に、ちらちら消えないよう、1.5秒つづける */
  const mood=reacting?({joy:'joy',shock:'shock',sad:'teary',think:'sad',nod:'smile',phew:'smile'}[rm]||'smile'):((r.cryU||0)>S.t&&at!=='sleep'||r.coffin||at==='bury'||at==='pray'||at==='shiver')?'teary':/* 棺をはこぶ・埋葬するときは、うるうる顔 */r.hunger<20?'sad':(JOYU.get(r)||0)>now?'joy':(ad&&['chop','mine','till','build','repair','weed'].includes(at))?'strain'/* 雑草をぬくときも >< の顔 */:jumping?'joy':at==='flee'?'strain':brave?'brave'/* たたかいに行く・たたいているときは、勇ましい顔 */:r.hurt>25?'strain':(at==='eat'&&ad)?'eat':(ad&&['play','chat','chatwait','npl','fish','tag','rest','bathe','bon','yatai','fwalk','hanabi','dance','shopkeep'].includes(at))||at==='tag'?'smile':'';
  const bob=(walking?Math.abs(Math.sin(now/110+r.id))*2.5:0)+(()=>{const jt=JUMP.get(r),d=jt==null?-1:now-jt;return d>=0&&d<1000?Math.abs(Math.sin(d/130))*9*(1-d/1000):0})();
  {const sw=Math.max(r.swing||0,r.swingT||0),sd=now-sw;if(sw&&sd>=0&&sd<280)px+=(r.face<0?-1:1)*Math.sin(sd/280*Math.PI)*8}/* 攻撃のとき、前にとびだす */
  if(at==='shiver'&&ad)px+=Math.sin(now/26+r.id*3)*1.4;/* ふるえる */
  const tubB=at==='bathe'&&ad&&r.act.tub!=null&&r.act.in>0,wade=at==='bathe'&&ad&&r.act.in>0?r.act.in:0;/* 水浴び：水の中では下半分がかくれる */
  {const tp=toyPose(r,now);if(tp){px=tp.x;py=tp.y-9}}/* 遊具の上で遊ぶ */if(sj<0&&!wade&&!toyR(r))shadow(ctx,px,py+8,12,3.6);
  const lvR=rLv(r);
  const tt=now/1000+r.id*1.7,fy=py+9-bob;
  if(at==='craft'&&ad){const o=S.orders.find(q=>q.id===r.act.order),mx=px+(r.face<0?-1:1)*15,my=py+11;/* 材料（板）を、せいれいの前に置く。のこぎりが板の上にくるよう、せいれいより先に描く */
    shadow(ctx,mx,my+1,12,2.6);ctx.fillStyle='#8a5a33';ctx.fillRect(mx-9,my-6,2.4,7);ctx.fillRect(mx+6.6,my-6,2.4,7);
    ctx.fillStyle='#c9935f';rr(ctx,mx-12,my-9,24,4.5,1.5);ctx.fillStyle='#b9824f';rr(ctx,mx-11,my-13,20,4,1.5);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(mx-10,my-12.6,17,1);
    if(o&&o.type&&BL[o.type].mat&&BL[o.type].mat.stone){circ(ctx,mx+9,my-10,3.4,'#a3a6ae');circ(ctx,mx+8,my-11,1.4,'#d4d5da')}}
  ctx.save();// 発熱対策：ぼかし影はなし
  if(bedH){ctx.translate(px,fy);ctx.rotate(-Math.PI/2);ctx.scale(BEDHS,1);ctx.translate(-px,-fy)}/* 横のベッドでは、頭をまくら（左）にして横になる */
  if(wade){ctx.beginPath();ctx.rect(px-40,fy-90,80,tubB?Math.max(0,fy+(((r.act.tub/W)|0)*TS+17-fy)*wade-(fy-90)):90-wade*11);ctx.clip()}
  const ci0=carryIcon(r),an=r.act&&r.act.stage==='do'&&!sleeping&&!onHold(r)?(r.act.type==='bathe'&&r.act.tub!=null?'tubbath':r.act.type):'';const joy=(JOYU.get(r)||0)>now&&!sleeping,clap=(CLAPON||now-CLAPT<3200||joy)&&!sleeping,wv=!clap&&!sleeping&&(r.waveU||0)>S.t,facePlayer=!$('#dialog').hidden&&DLGN.has(r.name)&&!clap&&!sleeping;/* 会話中は話し手がこちらを向く */const pk=(()=>{const sw=Math.max(r.swing||0,r.swingT||0),sd=now-sw;return sw&&sd>=0&&sd<420&&!clap&&!sleeping?sd/420:null})();drawSpirit(ctx,r.elem,px,fy,.435,clap?1:benchV&&!facePlayer?benchD:r.face<0?-1:1,{dot:1,t:tt,vr:r.vr,banzai:held,pp:pk,anim:CLIMB.has(r)?'climb':pk!=null?'punch':clap?'clap':wv?'wave':reacting?({shock:'talkshock',think:'talkthink',sad:'talksad',nod:'talk'}[rm]||(an==='forage'?forageAnim(r):an)):(an==='forage'?forageAnim(r):an),food:(an==='eat'||an==='forage'&&r.act.t>=2)&&!clap?(r.act.e||'🍙'):'',/* ベリーを直接とって食べるときも、手に持って食べる */carry:!!ci0&&!clap&&an!=='pray',back:clap||wv||facePlayer?false:v.back,turn:clap||wv||facePlayer?0:v.turn,mood,walk:walking,work:working,sleep:sleeping,bed:bedJ>=0,sit:(benchV||v.side)&&!facePlayer/* 横に置いたいす・ベンチは、横向きにすわる */,blink:now>v.bl,lean:rp?rp.angle:sleeping?Math.sin(tt*.8)*.06:0});ctx.restore();{const sj2=(r.y|0)*W+(r.x|0),o2=S.obj[sj2];if(o2&&SEATS.includes(o2)&&r.act&&r.act.stage==='do'&&!walking){const f=chipOf(o2,sj2,null,'.front');if(f)drawChip(ctx,f,o2,(sj2%W)*TS,((sj2/W)|0)*TS,now,sj2)}}/* いすにすわる子の手前に、いすの「.front」（後ろ向きのいすの背もたれなど）を重ねる */
  if(lvR>=5&&!sleeping&&!wade){const n=Math.min(6,Math.floor(lvR/5));for(let i=0;i<n;i++){const SL=LVSLOT[i],bx=px+SL[0]+Math.cos(now/900+i*2.1+r.id)*1.5,by=fy+SL[1]+Math.sin(now/700+i*1.7+r.id)*2.6;lvCharm(ctx,r.elem,bx,by,now/1000+i+r.id)}}/* Lv5ごとに1つ、属性の小物がまわりにふわふわ浮かぶ（顔や体にはかさねない） */
  if(r.shine&&now>=r.shine&&now-r.shine<3500&&!wade){const e=(now-r.shine)/3500;for(let i=0;i<6;i++){const SP=SHINE[i],tw=Math.sin(now/160+i*1.9),k=Math.max(0,(.55+.45*tw)*(e>.75?(1-e)/.25:1));if(k>0)star4(ctx,px+SP[0],fy+SP[1]-e*8,SP[2]*k)}}/* 水浴びのあと：キラキラ */
  if(tubB){const wl=((r.act.tub/W)|0)*TS+17;ctx.fillStyle='rgba(255,255,255,.85)';for(let k=0;k<5;k++){const bx=px-9+k*4.5+Math.sin(now/700+k*1.7)*1.2,ph=(now/1400+k*.23+r.id)%1;ctx.globalAlpha=.55+.4*Math.sin(now/500+k);ctx.beginPath();ctx.arc(bx,wl+.5-Math.sin(ph*Math.PI)*.8,1.7+((k*7)%3)*.45,0,7);ctx.fill()}ctx.globalAlpha=1}/* 湯ぶねのあわ */
  else if(wade){const wl=fy-wade*11,rp=(now/900+r.id)%1;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(px,wl,11+rp*6,3+rp*1.5,0,0,7);ctx.globalAlpha=1-rp*.8;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(px,wl,10,2.6,0,0,7);ctx.stroke()}/* 水面の波紋 */
  /* ベンチは1つの物として、すわった子の後ろにまとめて描く */
  let by=fy-27;
  const ci=carryIcon(r);
  const over=()=>{
  if(ci){const cb=walking?Math.abs(Math.sin(now/110+r.id))*1.2:0;ctx.font='26px sans-serif';ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';{let cl=carryIcons(r);if(!cl.length)cl=[ci];if(!cl[0])cl=[];const hn=cl.length;/* 持っている数だけ、そのまま積む */if(cl[0]==='⚰️'){const cb0=coffinBmp(),cy=fy-(r.elem==='wood'?34:29)-cb+10;if(cb0)ctx.drawImage(cb0.c,px-cb0.w/2,cy-cb0.h,cb0.w,cb0.h);cl=[]}/* 棺は、いつもの1.5倍の大きさ（39px）で、頭の上に乗せる（木の子は葉っぱの上） */for(let i=0;i<cl.length;i++){const e1=cl[i],ei=emoImg(e1),ox=(i%2?3:-3)*(hn>1?1:0),oy=-i*7;if(ei){const k=30/Math.max(ei.width,ei.height),iw=ei.width*k,ih=ei.height*k;ctx.drawImage(ei,px-iw/2+ox,fy-47-cb-ih/2+oy+(hn-1)*3+(e1==='⚰️'?7:0),iw,ih)}else if(!String(e1).startsWith('obj:'))ctx.fillText(e1,px+ox,fy-47-cb+oy+(hn-1)*3)}}/* たくさん持つときは、アイコンを重ねる */ctx.textAlign='start';ctx.textBaseline='alphabetic'}
  const gx=bedH?px-10:px,gy=bedH?py+20:py+11;/* 横のベッドで寝ているときは、横になった体の下のまん中に出す */
  if(!(r.hurt>0)&&S.t-(r.eUp||-9)<3&&r.energy<99.5){const v=r.energy/100,bx=gx-12,byy=gy;ctx.fillStyle='rgba(0,0,0,.45)';rr(ctx,bx,byy,24,5,2.5);ctx.fillStyle='#7ed99a';rr(ctx,bx+1,byy+1,Math.max(2,22*v),3,1.5);const ph=(now/600)%1;ctx.globalAlpha=1-ph;ctx.fillStyle='#7ed99a';ctx.font='9px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.fillText('+',gx+15,byy+4-ph*8);ctx.globalAlpha=1}/* 元気が回復中：みどりのバー */
  if(r.hurt>0){const v=r.hunger/hMax(r),a=Math.min(1,r.hurt/8);ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.6)';rr(ctx,gx-12,gy,24,5,2.5);ctx.fillStyle=v>.5?'#7ee08a':v>.25?'#ecdcbc':'#ff6b6b';rr(ctx,gx-11,gy+1,Math.max(2,22*v),3,1.5);ctx.globalAlpha=1}
  if(at==='craft'&&ad){const o=S.orders.find(q=>q.id===r.act.order);if(o){const f=Math.min(1,o.prog/o.need),bx=px-16,byy=py+(r.hurt>0?19:12);ctx.fillStyle='rgba(150,115,75,.5)';rr(ctx,bx-1.5,byy-1.5,35,8,4);ctx.fillStyle='#e8dcc0';rr(ctx,bx,byy,32,5,2.5);ctx.fillStyle='#e0a43a';rr(ctx,bx,byy,Math.max(2.5,32*f),5,2.5)}}/* 依頼の作業の進み具合は足もと。吹き出しは上に出す */
  if(r.act&&r.act.stage==='do'&&WORKP[r.act.type]&&WORKP[r.act.type](r,r.act)!=null){const f=Math.max(0,Math.min(1,WORKP[r.act.type](r,r.act)||0)),bx=px-16,byy=py+(r.hurt>0?19:12);ctx.fillStyle='rgba(150,115,75,.5)';rr(ctx,bx-1.5,byy-1.5,35,8,4);ctx.fillStyle='#e8dcc0';rr(ctx,bx,byy,32,5,2.5);ctx.fillStyle='#e0a43a';rr(ctx,bx,byy,Math.max(2.5,32*f),5,2.5)}/* 木を切る・石を掘る・畑・建てる・料理など、作業の進み具合 */
  const zzz=r.act&&r.act.type==='sleep';/* 寝ているあいだは、話しかけの吹き出しを出さない */
  if(!zzz&&QUESTCLEARW===r.name&&!isNight()){talkBub(px,by,now,'#ffd56b');return}
  if(r.act&&(r.act.type==='eat'||r.act.type==='forage')&&r.act.stage==='do'&&!zzz){const p=Math.max(0,Math.min(1,r.hunger/hMax(r))),gx=px-12,gy=py+11,g=()=>{ctx.fillStyle='rgba(0,0,0,.5)';rr(ctx,gx,gy,24,6,3);ctx.fillStyle=p>=.999?'#8fd36a':'#ffc766';rr(ctx,gx+1,gy+1,Math.max(2,22*p),4,2)};if(BUBQ)BUBQ.push(g);else g()}/* ごはん中の、お腹ゲージの回復 */
  if(!zzz&&TALKW===r.name){talkBub(px,by,now);return}
  if(!zzz&&SEVW[r.name]){talkBub(px,by,now,'#ffb3d1');return}
  if(!zzz&&SUBW[r.name]){talkBub(px,by,now,'#ffd56b');return}/* サブクエスト：黄色の吹き出し *//* 話したそうにしている：水色の吹き出し */
  if(CLAPON)return;/* 拍手中は吹き出しを出さない */
  const warn=r.hunger<20;
  if(!ci&&(r.bubble||warn)){const t=NOFACE[warn&&!r.bubble?'🍙':r.bubble]||(warn&&!r.bubble?'🍙':r.bubble);/* 顔の絵文字は使わない */
    {const a=r.act;if(a&&a.stage==='do'&&(a.type==='mine'||a.type==='chop')&&NATHIT.has(a.obj)&&Math.abs((a.obj%W+.5)*TS-px)<TS+20){const yb=natBarY(a.obj);if(by-45<yb+7&&by-15>yb-2)by=yb+12}}/* 木・岩ののこりのバーと重なるときは、ふきだしをバーの上へ */
    ctx.font='16px sans-serif';const bw=Math.max(27,Math.ceil(ctx.measureText(t).width)+9);/* 吹き出しは1.5倍 */
    ctx.fillStyle=warn?'#ffd2cc':'#fff';rr(ctx,px-bw/2,by-45,bw,24,9);ctx.beginPath();ctx.moveTo(px-4.5,by-21.5);ctx.lineTo(px,by-15);ctx.lineTo(px+4.5,by-21.5);ctx.fill();
    if(t==='💬'){for(let d=-1;d<=1;d++)circ(ctx,px+d*6.5,by-33,2.3,'#7a7064')}/* おしゃべりは点々だけ */
    else if(t==='🪓'&&PSPR.axe&&PSPR.axe.ok){const g=PSPR.axe.img,ih=17,iw=ih*g.width/g.height;ctx.save();ctx.translate(px,by-33);ctx.rotate(-Math.PI/4);ctx.drawImage(g,-iw/2,-ih/2,iw,ih);ctx.restore()}else{const ei=emoImg(t);if(ei){const ih=19.5,iw=ih*ei.width/ei.height;ctx.drawImage(ei,px-iw/2,by-33-ih/2,iw,ih)}else{ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#000';ctx.fillText(t,px,by-33);ctx.textAlign='start';ctx.textBaseline='alphabetic'}}}};
  if(r.act&&r.act.type==='repair'&&r.act.stage==='do'&&r.act.obj!=null){const a=r.act,p=Math.min(1,(a.t||0)/repairTime(a)),gx=(a.obj%W)*TS+2,gy=((a.obj/W)|0)*TS-8,g=()=>{ctx.fillStyle='rgba(0,0,0,.5)';rr(ctx,gx,gy,28,6,3);ctx.fillStyle='#ecdcbc';rr(ctx,gx+1,gy+1,26*p,4,2)};if(BUBQ)BUBQ.push(g);else g()}/* 修理の進みぐあい */
  if(r.act&&r.act.type==='cook'&&r.act.stage==='do'&&r.act.obj!=null&&r.cing){const a=r.act,tot=cookTime(r,a.obj),p=Math.min(1,(a.t||0)/Math.max(1,tot)),gx=(a.obj%W)*TS+2,gy=((a.obj/W)|0)*TS-12,g=()=>{ctx.fillStyle='rgba(0,0,0,.5)';rr(ctx,gx,gy,28,6,3);ctx.fillStyle='#ffd38a';rr(ctx,gx+1,gy+1,26*p,4,2)};if(BUBQ)BUBQ.push(g);else g()}/* 料理の進みぐあい */
  if(BUBQ)BUBQ.push(over);else over();
}
let GODP=[-.82,-.6];const godX=()=>STATUE>=0?STATUE%W+.5+GODP[0]:CX+.5,godY=()=>STATUE>=0?((STATUE/W)|0)+(S.obj[STATUE+W]==='altar'?GODP[1]:1.9):CY-6.4;/* カミサマは神殿の左の柱の前（おそなえ箱のうしろ）に立つ */
const godHere=()=>S.godShown&&(!S.godGone||S.godVisit);
function talkBub(px,by,now,col){const bw=30,bb=by-Math.abs(Math.sin(now/260))*3;ctx.fillStyle=col||'#9fdcff';rr(ctx,px-bw/2,bb-48,bw,27,10);ctx.beginPath();ctx.moveTo(px-5,bb-21.5);ctx.lineTo(px,bb-14);ctx.lineTo(px+5,bb-21.5);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect?ctx.roundRect(px-bw/2,bb-48,bw,27,10):ctx.rect(px-bw/2,bb-48,bw,27);ctx.stroke();
    for(let d=-1;d<=1;d++)circ(ctx,px+d*7,bb-34.5,2.6,'#1f5f86');}
const HB={t:0,rk:[],ps:[],fl:[]};
function drawHanabi(now){const dt=Math.min(.05,Math.max(0,(now-(HB.t||now))/1000));HB.t=now;const h=hour();
  if(festOn()&&h>=20&&h<21&&!sheet&&Math.random()<dt*1.1){const C=['#ff6b6b','#ffd84a','#7fe8ff','#9cff7a','#ff8cc0','#c9a2ff'];HB.rk.push({x:VW*(.15+Math.random()*.7),y:VH*.62,ty:VH*(.2+Math.random()*.2),col:pick(C),col2:pick(C)})}/* 夜8時から9時は、空に花火 */
  if(!HB.rk.length&&!HB.ps.length&&!HB.fl.length)return;ctx.globalCompositeOperation='lighter';
  for(const k of HB.rk){k.y-=220*dt;ctx.fillStyle='rgba(255,230,180,.8)';ctx.fillRect(k.x-1,k.y,2,6);if(k.y<=k.ty){k.done=1;HB.fl.push({x:k.x,y:k.y,life:.3,col:k.col});for(let i=0;i<48;i++){const a=i/48*6.283,v=95+Math.random()*25;HB.ps.push({x:k.x,y:k.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.8,col:k.col})}for(let i=0;i<20;i++){const a=i/20*6.283+.15,v=50;HB.ps.push({x:k.x,y:k.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.4,col:k.col2})}sfx('hanabi')}}/* 外がわの輪と、内がわの輪（べつの色） */
  for(const f of HB.fl){f.life-=dt;const R=70*(1-f.life/.3)+20,g=ctx.createRadialGradient(f.x,f.y,1,f.x,f.y,R);g.addColorStop(0,'rgba(255,250,230,'+(f.life*1.6)+')');g.addColorStop(1,'rgba(255,250,230,0)');ctx.fillStyle=g;ctx.fillRect(f.x-R,f.y-R,R*2,R*2)}HB.fl=HB.fl.filter(f=>f.life>0);/* ひらいた瞬間の光 */
  HB.rk=HB.rk.filter(k=>!k.done);
  ctx.lineCap='round';for(const q of HB.ps){q.life-=dt;const ox=q.x,oy=q.y;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=30*dt;q.vx*=.985;q.vy*=.985;ctx.globalAlpha=Math.max(0,Math.min(1,q.life));ctx.strokeStyle=q.col;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(ox-q.vx*.06,oy-q.vy*.06);ctx.lineTo(q.x,q.y);ctx.stroke()}/* 光の粒は、すこし尾をひく */
  HB.ps=HB.ps.filter(q=>q.life>0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
const FESTA={F:{"st_wood":[0,0,94,92,0],"st_fire":[96,0,94,93,0],"st_water":[192,0,94,92,0],"st_earth":[288,0,94,94,0],"st_wind":[384,0,94,94,0],"pole_on":[480,0,27,52,0],"pole_off":[0,96,27,52,0]},img:new Image(),ok:false};FESTA.img.onload=()=>{FESTA.ok=true;dirty=true};FESTA.img.src='assets/g/c8a18330c4.webp';/* おまつりの屋台とちょうちんの柱（いただいた絵）。[x,y,幅,高さ,台のはし]：台のはしより下は、店番の前にかく */
function drawYatai(px,py,front,now,st){const f=FESTA.F['st_'+st.el];if(!FESTA.ok||!f)return;const[sx,sy,w,h]=f,sp=st.el==='wind'?h:0,x0=Math.round(px-w/2),y0=Math.round(py+28-h);/* わたあめの屋台は、店番の子が前に立つので、ぜんぶうしろにかく。ほかの屋台は、ぜんぶ店番の子の前にかく（うしろの板はない） */
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;if(front){if(h>sp)ctx.drawImage(FESTA.img,sx,sy+sp,w,h-sp,x0,y0+sp,w,h-sp)}else ctx.drawImage(FESTA.img,sx,sy,w,sp,x0,y0,w,sp);ctx.imageSmoothingEnabled=sm}/* front=0は店番のうしろ、1は前 */
function drawGod(now){
  if(!godHere())return;const GX=godX(),GY=godY(),px=GX*TS,py=GY*TS+Math.sin(now/700)*3;
  shadow(ctx,px,GY*TS+16,14,4);
  if(QUESTCLEARW===GOD){const f=()=>talkBub(px,py-28,now,'#ffd56b');if(BUBQ)BUBQ.push(f);else f()}
  else if(TALKW===GOD){const f=()=>talkBub(px,py-28,now);if(BUBQ)BUBQ.push(f);else f()}
  else if(S.feat.shop){ctx.fillStyle='rgba(31,59,58,.9)';rr(ctx,px-17,py-58,34,13,6);ctx.fillStyle='#ecdcbc';ctx.font='9px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.fillText('こうかん',px,py-48.5);ctx.textAlign='start'}
  const g=ctx.createRadialGradient(px,py-12,4,px,py-12,36);g.addColorStop(0,'rgba(255,250,210,.4)');g.addColorStop(1,'rgba(255,250,210,0)');ctx.fillStyle=g;ctx.fillRect(px-36,py-48,72,72);
  const G2=SPR.god,GC=window.CHIPS&&CHIPS.god,GI=GC&&chipImgs(GC,'god')[0];if(GI&&GI.ok){const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;ctx.drawImage(GI,Math.round(px*2)/2+GC.ax/2,Math.round((py+16)*2)/2+GC.ay/2,GC.w/2,GC.h/2);ctx.imageSmoothingEnabled=sm}/* ドット絵（1ドットを2×2に分けた細かさ） */else if(G2.ok){const h=58,w=h*G2.w/G2.h;ctx.drawImage(G2.img,px-w/2,py+16-h,w,h)}else{
  circ(ctx,px-10,py+6,7,'#fff');circ(ctx,px+10,py+6,7,'#fff');circ(ctx,px,py+4,9,'#fff');circ(ctx,px-4,py+9,6,'#eef4ff');circ(ctx,px+5,py+9,6,'#eef4ff');
  circ(ctx,px,py-7,8,'#f6d6b0');
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(px-7,py-5);ctx.quadraticCurveTo(px,py+8,px+7,py-5);ctx.quadraticCurveTo(px,py-1,px-7,py-5);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(px-6,py-11,3,2,-.4,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(px+6,py-11,3,2,.4,0,7);ctx.fill();
  ctx.fillStyle='#2b2b33';ctx.fillRect(px-4,py-9,3,1.3);ctx.fillRect(px+1,py-9,3,1.3);
  ctx.strokeStyle='#ffd85c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(px,py-17,6,2,0,0,7);ctx.stroke();}
}
const NSPR={top:{w:232,h:301,src:'assets/g/852a3ab4c0.webp'},L0:{w:30,h:99,src:'assets/g/4d02effd21.webp'},L3:{w:37,h:100,src:'assets/g/92a36730df.webp'},L5:{w:39,h:100,src:'assets/g/a728176f3b.webp'}};/* 草原のヌシ：いただいたデザインの絵（からだ＋脚4本） */
for(const k in NSPR){const g=NSPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1;if(k!=='top'){const cv=document.createElement('canvas');cv.width=g.w;cv.height=g.h;const c=cv.getContext('2d');c.filter='brightness(.9)';c.drawImage(g.img,0,0);g.dark=cv}};g.img.src=g.src}
const NSHEET={f:[[0,0,84,146,1,0,0],[86,0,84,150,1,0,0],[172,0,124,151,1,0,0],[298,0,94,146,1,0,1],[394,0,92,145,1,0,1],[488,0,92,144,1,0,0],[0,153,90,146,1,0,1],[92,153,92,149,1,0,3],[186,153,92,146,1,-1,0],[280,153,92,151,1,0,1],[374,153,90,150,1,-1,0],[466,153,92,155,1,0,3],[0,310,90,150,1,-1,0],[92,310,92,150,1,0,0],[186,310,96,150,1,0,0],[284,310,132,149,1,-3,-1],[418,310,132,151,1,-3,1],[0,463,132,149,1,-3,-1],[134,463,132,149,1,-3,-1],[268,463,132,152,1,-3,2],[402,463,132,153,1,-3,3]],img:new Image(),ok:false};NSHEET.img.onload=()=>{NSHEET.ok=true;dirty=true};NSHEET.img.src='assets/g/5cc61920e6.webp';/* 草原のヌシ様の絵：[x,y,はば,高さ,大きさ]。0〜2：正面・うしろ・横の立ち姿、3〜8：正面を歩く、9〜14：うしろを歩く、15〜20：横を歩く */
const NSHEET2={f:[[0,0,98,157,1,0,1],[100,0,98,163,1,1,1],[200,0,198,151,1,1,0],[400,0,126,155,1,0,0],[0,165,128,155,1,1,0],[130,165,132,154,1,1,-1],[264,165,124,159,1,-2,-2],[390,165,128,155,1,1,0],[0,326,126,155,1,1,1],[128,326,94,164,1,0,0],[224,326,104,163,1,1,0],[330,326,100,163,1,-2,-1],[432,326,106,164,1,1,0],[540,326,100,163,1,-1,-1],[0,492,108,163,1,1,0],[110,492,178,151,1,-1,0],[290,492,180,150,1,-1,0],[0,657,184,150,1,1,0],[186,657,180,150,1,-2,0],[368,657,188,151,1,2,0],[0,810,212,151,1,13,1]],img:new Image(),ok:false};NSHEET2.img.onload=()=>{NSHEET2.ok=true;dirty=true};NSHEET2.img.src='assets/g/c5892fedf5.webp';/* 火のヌシの絵（ならびは草原のヌシと同じ） */
function drawNushi(now){
  const n=S.nushi;if(!n)return;const FIRE=WD!==0,SH=FIRE?NSHEET2:NSHEET;if(FIRE&&!SH.ok)return drawNushiOld(now);/* 火のヌシ */
  const T=NSPR.top;if(!FIRE&&!T.ok)return;
  const px=n.x*TS,py=n.y*TS,f=n.face||1,mv=n.mv||0,K=.5,ph=now/150,st=Math.sin(ph)*mv*.3,bob=mv?Math.abs(Math.sin(ph))*-1.6:Math.sin(now/600)*.8;ctx.save();ctx.globalAlpha=n.app==null?1:n.app;
  const g=ctx.createRadialGradient(px,py-60,8,px,py-60,100);g.addColorStop(0,FIRE?'rgba(255,200,140,.32)':'rgba(190,255,200,.32)');g.addColorStop(1,FIRE?'rgba(255,200,140,0)':'rgba(190,255,200,0)');ctx.fillStyle=g;ctx.fillRect(px-100,py-160,200,200);
  shadow(ctx,px,py+3,34,7);
  if(SH.ok){const fi=(n.dir>0?0:n.dir<0?1:2),F=SH.f[mv?3+fi*6+Math.floor(now/150)%6:fi];/* 0正面・1うしろ・2横（左向き）。歩くときは6コマ */
    const[sx,sy,sw,sh,sc]=F,dw=sw*sc,dh=sh*sc;ctx.save();ctx.imageSmoothingEnabled=false;const hp=n.hop&&now-n.hop<450?Math.sin(Math.PI*(now-n.hop)/450)*7:0;/* 遊びにきた子といっしょに、ぴょんとはねる */ctx.translate(Math.round(px),Math.round(py+4+(mv?0:bob)-hp));/* ドット絵（1ドット＝ゲームの1点）。ドットがくずれないように、整数の位置にかく */if(!n.dir&&f>0)ctx.scale(-1,1);/* 絵は左向き。右を向くときは反転 */ctx.drawImage(SH.img,sx,sy,sw,sh,-dw/2+(F[5]||0)*sc,-dh+(F[6]||0)*sc,dw,dh)/* 6・7番めは、からだの位置をそろえるずらし（ドット） */;ctx.restore()}
  else if(n.dir){drawNushiFB(ctx,px,py+4+bob,n.dir<0,now,mv)}else{
  ctx.save();ctx.translate(px,py+4+bob);ctx.scale(-f*K,K);ctx.translate(-117,-301);/* 絵は左向き。f=1で右を向く */
  /* 脚は、からだより先にかく（つけ根はからだにかくれる）。奥の脚は少し暗く */
  const LG=[['L5',154,201,1,1],['L3',77,203,1,-1],['L5',164,201,0,-1],['L0',68,203,0,1]];
  for(const[k,x,y,dk,sg]of LG){const L=NSPR[k];if(!L.ok)continue;ctx.save();ctx.translate(x+15.2,y+13.5);ctx.rotate(st*sg);ctx.drawImage(dk&&L.dark?L.dark:L.img,-15.2,-13.5,L.w,L.h);ctx.restore()}
  ctx.drawImage(T.img,0,0,T.w,T.h);
  ctx.restore()}
  // まう葉と光
  for(let i=0;i<7;i++){const t=now/1800+i*.9,r=36+(i%3)*10,x=px+Math.cos(t)*r,y=py-66+Math.sin(t*1.3)*24-(i%2)*14;ctx.globalAlpha=.5+.35*Math.sin(t*2);
    if(FIRE){circ(ctx,x,y,i%2?2.2:1.6,i%2?'#ffb35a':'#fff0c8')}else if(i%2){ctx.fillStyle='#7fe39a';ctx.beginPath();ctx.ellipse(x,y,3.5,1.6,t*2,0,7);ctx.fill()}else{circ(ctx,x,y,1.8,'#eaffd8')}}/* 火のヌシのまわりは、火の粉 */
  ctx.globalAlpha=1;ctx.restore();
}
/* ヌシ様の正面・うしろ姿（横向きの絵にあわせて、スクリプトで描く） */
function drawNushiFB(c,px,py,back,now,mv){
  const CR='#fdf8ec',OL='#e2d9c3',GR='#7ccf86',GD='#4fae63',PK='#f7a8bf',ph=now/150,lg=k=>mv?Math.max(0,Math.sin(ph+k*Math.PI))*-4:0;
  const leaf=(x,y,rx,ry,a,col)=>{c.fillStyle=col||GR;c.beginPath();c.ellipse(x,y,rx,ry,a,0,7);c.fill()};
  const legC=(x,y0,h,w,col)=>{c.fillStyle=col;c.strokeStyle=OL;c.lineWidth=1;c.beginPath();c.roundRect(x-w/2,y0,w,h,w/2);c.fill();c.stroke()};
  const antl=(sg)=>{c.strokeStyle=GD;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(sg*5,-96);c.quadraticCurveTo(sg*14,-112,sg*22,-128);c.moveTo(sg*12,-108);c.lineTo(sg*26,-112);c.moveTo(sg*17,-118);c.lineTo(sg*12,-132);c.stroke();
    leaf(sg*22,-131,4,7,sg*.4);leaf(sg*28,-113,6,3.5,sg*-.3);leaf(sg*11,-135,3.5,6,sg*-.3);leaf(sg*19,-122,5,3,sg*.6,GD);circ(c,sg*25,-120,2.6,PK)};
  const head=()=>{antl(-1);antl(1);
    for(const sg of[-1,1]){c.save();c.translate(sg*14,-91);c.rotate(sg*-.35);c.fillStyle=CR;c.strokeStyle=OL;c.beginPath();c.moveTo(-sg*3,-3);c.quadraticCurveTo(sg*6,-5,sg*10,0);c.quadraticCurveTo(sg*6,4,-sg*3,3);c.fill();c.stroke();if(!back){c.fillStyle=PK;c.beginPath();c.moveTo(-sg*1,-1.5);c.quadraticCurveTo(sg*5,-2.5,sg*7.5,0);c.quadraticCurveTo(sg*5,2,-sg*1,1.5);c.fill()}c.restore()}
    c.fillStyle=CR;c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.ellipse(0,-86,12,13,0,0,7);c.fill();c.stroke();
    leaf(-6,-98,6,3,-.3);leaf(5,-99,6,3,.3);leaf(0,-101,4,3,0,GD);/* つのの根もとの葉 */
    if(!back){c.fillStyle='#fffdf6';c.beginPath();c.ellipse(0,-77,7,6,0,0,7);c.fill();circ(c,0,-74.5,2.2,'#3a3a3a');
      c.fillStyle='#2f6a43';for(const sg of[-1,1]){c.beginPath();c.ellipse(sg*5.5,-87,2.2,2.8,0,0,7);c.fill()}}};
  const mane=()=>{for(let i=0;i<5;i++){const y=-70+i*5;leaf(-8+i*.5,y,6,3.2,-.5,i%2?GD:GR);leaf(8-i*.5,y,6,3.2,.5,i%2?GR:GD)}};
  c.save();c.translate(px,py-2);
  if(!back){
    legC(-12,-26+lg(1),26,5,'#f1ead8');legC(12,-26+lg(0),26,5,'#f1ead8');/* うしろ脚 */
    c.fillStyle=CR;c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.ellipse(0,-36,18,15,0,0,7);c.fill();c.stroke();leaf(-12,-32,3,5.5,.3);leaf(13,-38,3,5,-.3);
    legC(-7,-24+lg(0),24,5.5,CR);legC(7,-24+lg(1),24,5.5,CR);/* 前脚 */
    c.fillStyle=CR;c.beginPath();c.moveTo(-8,-46);c.lineTo(-6,-80);c.lineTo(6,-80);c.lineTo(8,-46);c.fill();mane();head();
  }else{
    head();c.fillStyle=CR;c.beginPath();c.moveTo(-8,-46);c.lineTo(-6,-80);c.lineTo(6,-80);c.lineTo(8,-46);c.fill();mane();
    legC(-7,-24+lg(0),24,5,'#f1ead8');legC(7,-24+lg(1),24,5,'#f1ead8');/* 前脚（奥） */
    c.fillStyle=CR;c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.ellipse(0,-36,18,15,0,0,7);c.fill();c.stroke();
    c.strokeStyle=GR;c.lineWidth=2;c.beginPath();c.moveTo(0,-50);c.quadraticCurveTo(-6,-40,0,-32);c.quadraticCurveTo(6,-26,0,-22);c.stroke();/* せなかのつる */
    legC(-12,-24+lg(1),24,5.5,CR);legC(12,-24+lg(0),24,5.5,CR);/* うしろ脚（手前） */
    leaf(-4,-30,5,7,-.4,GR);leaf(4,-30,5,7,.4,GD);leaf(0,-34,4,6,0,GR);/* しっぽの葉 */
  }
  c.restore()}

function drawNushiOld(now){
  const n=S.nushi;if(!n)return;const px=n.x*TS,py=n.y*TS,f=n.face||1,b=Math.sin(now/500)*1.5;
  const g=ctx.createRadialGradient(px,py-16,6,px,py-16,60);g.addColorStop(0,'rgba(220,255,220,.35)');g.addColorStop(1,'rgba(220,255,220,0)');ctx.fillStyle=g;ctx.fillRect(px-60,py-76,120,120);
  shadow(ctx,px,py+6,26,6);
  ctx.save();ctx.translate(px,py);ctx.scale(f,1);
  ctx.strokeStyle='#e9efe6';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-14,-8);ctx.lineTo(-15,4);ctx.moveTo(-6,-8);ctx.lineTo(-5,4);ctx.moveTo(8,-8);ctx.lineTo(9,4);ctx.moveTo(15,-8);ctx.lineTo(16,4);ctx.stroke();
  ctx.fillStyle='#f4f8f0';ctx.beginPath();ctx.ellipse(0,-14+b,22,11,0,0,7);ctx.fill();
  ctx.fillStyle='#dfe8dc';ctx.beginPath();ctx.ellipse(-2,-9+b,18,5,0,0,7);ctx.fill();
  ctx.fillStyle='#f4f8f0';ctx.beginPath();ctx.moveTo(14,-20+b);ctx.lineTo(22,-34+b);ctx.lineTo(28,-30+b);ctx.lineTo(22,-16+b);ctx.fill();
  circ(ctx,26,-34+b,7,'#f4f8f0');ctx.fillStyle='#2b2b33';ctx.fillRect(27,-36+b,2,2);
  ctx.strokeStyle='#9ff0b0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,-40+b);ctx.lineTo(20,-52+b);ctx.lineTo(14,-56+b);ctx.moveTo(21,-48+b);ctx.lineTo(26,-55+b);ctx.moveTo(28,-40+b);ctx.lineTo(34,-50+b);ctx.lineTo(40,-52+b);ctx.moveTo(33,-47+b);ctx.lineTo(32,-56+b);ctx.stroke();
  ctx.lineCap='butt';ctx.restore();
}
/* ---------- 「コワイノ」の絵 ---------- */
// 足元(0,0)基準・高さ約100単位。o:{t,back,walk,flash}
const KGS={basic_f:{w:100,h:167,arms:[[-1, 30.0, 119.8, 13], [1, 68.0, 120.5, 14]],src:'assets/g/eb6bcf47cf.webp'},
basic_b:{w:99,h:168,arms:[[-1, 28.0, 120.5, 14], [1, 68.0, 120.5, 14]],src:'assets/g/aedd528ff2.webp'},
fast_f:{w:139,h:169,arms:[],src:'assets/g/b4bf6cc5ec.webp'},
fast_b:{w:137,h:168,arms:[],src:'assets/g/3efce8d30c.webp'},
thief_f:{w:144,h:166,arms:[[-1, 35.0, 114.2, 17]],src:'assets/g/a26c29eafd.webp'},
thief_b:{w:117,h:165,arms:[[-1, 32.0, 115.0, 18]],src:'assets/g/611848f979.webp'},
brute_f:{w:139,h:161,arms:[[-1, 48.0, 114.8, 13], [1, 86.0, 115.2, 13]],src:'assets/g/4a39f03f83.webp'},
brute_b:{w:138,h:159,arms:[[-1, 47.0, 112.5, 12], [1, 87.0, 113.0, 12]],src:'assets/g/a312cdf470.webp'},
boss_f:{w:266,h:201,arms:[],src:'assets/g/1c122dcb9e.webp'},
boss_b:{w:220,h:200,arms:[],src:'assets/g/9ed430b84b.webp'}};
// イラストを切り抜いた絵。腕だけ消してあり、下ろした腕をコードで描いて動かす
const BEDSPR={w:160,h:163,src:'assets/g/88c626b7df.webp'};BEDSPR.img=new Image();BEDSPR.img.onload=()=>{BEDSPR.ok=1;if(typeof iconCache!=='undefined')delete iconCache.bed;if(typeof rebuildStatic==='function'&&S)rebuildStatic(true)};BEDSPR.img.src=BEDSPR.src;
const SPR={god:{w:72,h:150,src:'assets/g/c48b773300.webp'},site:{w:104,h:91,src:'assets/g/e757fabc49.webp'}};
for(const k in SPR){const g=SPR[k];g.img=new Image();g.img.onload=()=>{g.ok=1;if(k==='site')artLoaded()};g.img.src=g.src}
for(const k in KGS){const g=KGS[k];g.img=new Image();g.img.onload=()=>{const cv=document.createElement('canvas');cv.width=g.w;cv.height=g.h;const x=cv.getContext('2d');x.drawImage(g.img,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='#f4eefa';x.fillRect(0,0,g.w,g.h);g.white=cv;g.ok=1};g.img.src=g.src}
// 攻撃：ためは短く、最後にすばやくふりかぶって叩きつける
function atkLift(p){if(p<=0)return 0;if(p<.84)return Math.sin(p*40)*.04;if(p<.95)return (p-.84)/.11*2.7;if(p<.985)return 2.7-(p-.95)/.035*3.1;return -.4}
function atkLean(p){return p>=.95&&p<1?.12:p>.84?-.08*(p-.84)/.11:0}
const KGH={basic:100,fast:100,thief:100,brute:100,boss:118};
// コワイノのドット絵：モーション（待機・歩き・攻撃・やられ）ごとのコマを切りかえる。コマはたてにならべた1まいの絵（n＝コマ数）。大きさは種類ごとの絵（どれも1ドット＝1）
const KGDOT={},KGDOK={};
function kgDot(key,white){const ch=CHIPS[key],im=chipImgs(ch,key)[0];if(!white)return im;const k=key+'|w';if(KGDOT[k])return KGDOT[k];
  const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const g=cv.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#f4eefa';g.fillRect(0,0,cv.width,cv.height);return KGDOT[k]=cv}/* ひかったときは白いかげ */
function drawShadeDot(c,ty,x,y,s,f,o){
  const K='kg_'+ty+':';if(!window.CHIPS||!CHIPS[K+'idle'])return false;
  if(!KGDOK[ty]){for(const k in CHIPS)if(k.startsWith(K)&&!chipImgs(CHIPS[k],k)[0].ok)return false;KGDOK[ty]=1}
  const t=o.t||0,B=o.back?'B':'',p=o.atk||0,sc=s/(.27*EN[ty].size*2);
  // どのモーションの、何コマ目か
  let mo='idle',fi=Math.floor(t*1.6);
  if(o.die!=null){mo='hurt';fi=o.die}/* たおされたとき：やられの3コマ目（たおれる）まで */else if(o.hurt!=null){mo='hurt';fi=o.hurt<.5?0:1}/* 攻撃をうけただけのときは、いたがる2コマだけ（たおれない） */
  else if(o.walk){mo='walk';fi=Math.floor(t*6)}
  else if(p>=.84){mo='atk';const n=(CHIPS[K+'atk'+B]||CHIPS[K+'atk']).n||3;fi=p<.95?0:Math.min(n-1,1+Math.floor((p-.95)/.05*(n-1)))}/* ふりかぶる → ふりおろす → もどる */
  const key=mo==='hurt'||!CHIPS[K+mo+B]?K+mo:K+mo+B,ch=CHIPS[key];fi=mo==='hurt'?Math.min(fi,ch.n-1):fi%(ch.n||1);
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=sc<.9;/* 図鑑などで小さく描くときだけ、なめらかに縮める */
  c.save();c.translate(x,y);c.scale(sc*f,sc);c.drawImage(kgDot(key,!!o.flash),0,fi*ch.h,ch.w,ch.h,ch.ax,ch.ay,ch.w,ch.h);c.restore();
  c.imageSmoothingEnabled=sm;return true}
function drawShade(c,ty,x,y,s,f,o){const ty0=ty;
  if(o.dot&&drawShadeDot(c,ty,x,y,s,f,o))return;
  if(ty==='trapper'||ty==='rockc')ty='brute';else if(ty==='ash'||ty==='breaker')ty='basic';else if(ty==='hino'||ty==='yama')ty='boss';/* ワナクイは、カタカゲに似たとげとげの形（小さめ） */
  const g=KGS[ty+(o.back?'_b':'_f')];if(!g||!g.ok)return drawShadeV(c,ty,x,y,s,f,o);
  const t=o.t||0,BD=o.flash?'#f4eefa':'#3e383e',u=(KGH[ty]||100)/g.h;
  const st=o.walk?Math.sin(t*10):0,bob=o.walk?Math.abs(st)*3:Math.sin(t*3)*1.5,sq=o.walk?Math.abs(st)*.04:Math.sin(t*3)*.015;
  const p=o.atk||0,lift=atkLift(p);
  c.save();c.translate(x,y);c.scale(s*f,s);c.lineCap='round';
  c.rotate(o.walk?st*.06:atkLean(p));c.scale(1+sq,1-sq);c.translate(0,-bob);
  for(const[side,rx,ry,th]of g.arms){
    const ang=o.flash?-.25:1.0+(o.walk?side*st*.45:Math.sin(t*2.2+side)*.08)-lift,T=Math.max(2.6,th*u*.5),L=20;
    c.save();c.translate((rx-g.w/2)*u,(ry-g.h)*u);c.scale(side,1);c.rotate(ang);
    c.strokeStyle=BD;c.lineWidth=T*2;c.beginPath();c.moveTo(-2,0);c.lineTo(L*.75,0);c.stroke();
    c.fillStyle=BD;c.beginPath();c.ellipse(L*.8,0,T*1.45,T*1.2,0,0,7);c.fill();c.restore()}
  // 腕は体のうしろから出す
  c.drawImage(o.flash?g.white:g.img,-g.w/2*u,-g.h*u,g.w*u,g.h*u);
  if((ty0==='breaker'||ty0==='trapper')&&!o.flash){/* 見た目で区別：カベクダキはハンマー、ワナクイは罠のあご */
    const hx=g.w*u*.5,hy=-g.h*u*.8;c.save();c.translate(hx,hy);c.rotate(-.5+Math.sin(t*3)*.08);c.scale(1.7,1.7);
    if(ty0==='breaker'){c.fillStyle='#8a5a34';c.fillRect(-2.5,-4,5,30);c.fillStyle='#9aa0a8';c.fillRect(-11,-14,22,12);c.fillStyle='#c9ced4';c.fillRect(-11,-14,22,3.5);c.strokeStyle='#3e383e';c.lineWidth=2;c.strokeRect(-11,-14,22,12)}
    else{c.fillStyle='#b9b3ad';c.strokeStyle='#3e383e';c.lineWidth=2;c.beginPath();c.arc(0,0,12,Math.PI,0);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*4.4-2,0);c.lineTo(k*4.4,-5);c.lineTo(k*4.4+2,0);c.fill()}c.fillStyle='#d94a4a';c.beginPath();c.arc(0,-13,3,0,7);c.fill()}
    c.restore()}
  c.restore();
}
function drawShadeV(c,ty,x,y,s,f,o){
  const t=o.t||0,back=!!o.back,BD=o.flash?'#f4eefa':'#3f3842',EY='#b7a3d8',CR='#a993c6',SK='#d8b48a';
  const st=o.walk?Math.sin(t*10):0,bob=o.walk?Math.abs(Math.sin(t*10))*2:Math.sin(t*3)*1.5,fl=Math.sin(t*(ty==='fast'?16:6))*.25;
  const p=o.atk||0,lift=atkLift(p);
  c.save();c.translate(x,y);c.scale(s*f,s);c.lineJoin='round';c.lineCap='round';
  const E=(cx,cy,rx,ry,rot,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(cx,cy,rx,ry,rot||0,0,7);c.fill()};
  const P=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill()};
  const legs=(w,ry)=>{const l1=Math.max(0,st)*4,l2=Math.max(0,-st)*4;E(-w,-6-l1,5.5,ry||7,0,BD);E(w,-6-l2,5.5,ry||7,0,BD)};
  const torso=(w,top)=>{c.fillStyle=BD;c.beginPath();c.moveTo(-w+3,top);c.quadraticCurveTo(-w-2,top+12,-w+1,-8);c.quadraticCurveTo(0,-1,w-1,-8);c.quadraticCurveTo(w+2,top+12,w-3,top);c.closePath();c.fill()};
  // 腕：ふだんは下ろして、歩くと前後にふる。攻撃のときはふりあげて叩きつける
  const armAng=sx=>o.flash?-.25:1.15+(o.walk?sx*Math.sin(t*10)*.45:Math.sin(t*2.2+sx)*.08)-lift;
  const arm=(sx,y0,x0,len,th,fix)=>{c.save();c.translate(sx*x0,y0);c.scale(sx,1);c.rotate(fix??armAng(sx));c.strokeStyle=BD;c.lineWidth=th*2;c.beginPath();c.moveTo(0,0);c.lineTo(len*.75,0);c.stroke();E(len*.8,0,th*1.5,th*1.25,0,BD);c.restore()};
  const arms=(y0,x0,len,th)=>{arm(-1,y0,x0,len,th);arm(1,y0,x0,len,th)};
  const eyes=(ex,ey,rx,ry,angry)=>{if(back)return;if(angry){for(const sx of[-1,1]){c.fillStyle=EY;c.beginPath();c.moveTo(sx*(ex-rx),ey-ry*.2);c.quadraticCurveTo(sx*ex,ey+ry*1.1,sx*(ex+rx),ey-ry*.9);c.quadraticCurveTo(sx*ex,ey-ry*.2,sx*(ex-rx),ey-ry*.2);c.fill()}}else{E(-ex,ey,rx,ry,0,EY);E(ex,ey,rx,ry,0,EY)}};
  const wing=(sx,wx,wy,sz)=>{c.save();c.translate(sx*wx,wy);c.scale(sx*sz,sz);c.rotate(-fl);c.fillStyle=BD;c.beginPath();c.moveTo(0,-6);c.quadraticCurveTo(14,-14,24,-10);c.quadraticCurveTo(22,-2,26,4);c.quadraticCurveTo(19,1,16,8);c.quadraticCurveTo(11,3,6,8);c.quadraticCurveTo(4,2,0,4);c.closePath();c.fill();c.restore()};
  c.translate(0,-bob);
  if(ty==='basic'){
    legs(6);torso(10,-30);arms(-27,8,18,3.2);
    c.fillStyle=BD;c.beginPath();c.moveTo(-25,-50);c.quadraticCurveTo(-26,-72,-8,-78);c.quadraticCurveTo(0,-81,2,-86);c.quadraticCurveTo(8,-80,12,-77);c.quadraticCurveTo(27,-70,25,-48);c.quadraticCurveTo(23,-29,0,-28);c.quadraticCurveTo(-23,-29,-25,-50);c.fill();
    const cw=Math.sin(t*2.5)*.2;c.save();c.translate(2,-86);c.rotate(cw);c.strokeStyle=BD;c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-3,-8,2,-12);c.arc(6,-12,4,Math.PI,Math.PI*2.6);c.stroke();c.restore();
    eyes(10.5,-41,2.6,5.6,false);
  }else if(ty==='fast'){
    legs(6);wing(-1,8,-20,.9);wing(1,8,-20,.9);torso(10,-30);arms(-28,9,19,3.1);
    E(0,-52,23,22,0,BD);
    for(const sx of[-1,1]){c.fillStyle=BD;c.beginPath();c.moveTo(sx*7,-70);c.quadraticCurveTo(sx*24,-74,sx*15,-97);c.quadraticCurveTo(sx*33,-84,sx*22,-62);c.closePath();c.fill()}
    eyes(8.5,-44,2.4,5,false);
  }else if(ty==='thief'){
    legs(6);torso(11,-30);
    const sk=()=>{c.save();c.translate(back?-21:23,-20+(o.walk?Math.abs(st)*-2:0));c.rotate(Math.sin(t*4)*.08);E(0,0,14,13,0,SK);c.fillStyle='#c49a6c';c.beginPath();c.ellipse(-3,-12,6,3,-.3,0,7);c.fill();c.restore()};
    if(back){sk();arm(-1,-27,8,17,3.2,.55);arm(1,-27,8,17,3.2)}else{arm(-1,-27,8,17,3.2)}
    c.fillStyle=BD;c.beginPath();c.moveTo(-24,-34);c.quadraticCurveTo(-30,-64,-6,-82);c.quadraticCurveTo(8,-92,18,-88);c.quadraticCurveTo(11,-83,15,-76);c.quadraticCurveTo(28,-60,24,-34);c.quadraticCurveTo(0,-26,-24,-34);c.fill();
    if(!back){E(0,-50,17,13,0,'#2c262f');eyes(8,-50,5.5,4,true);c.strokeStyle='#5c4a3a';c.lineWidth=2;c.beginPath();c.moveTo(-10,-34);c.quadraticCurveTo(0,-30,10,-34);c.stroke();sk();arm(1,-27,8,17,3.2,.55)}
  }else if(ty==='brute'){
    legs(8);torso(14,-30);arms(-30,18,18,3.8);
    const N=11,pts=[];for(let k=0;k<N*2;k++){const a=-Math.PI/2+k/(N*2)*Math.PI*2,r=k%2?26:34+(k===0?6:0);pts.push([Math.cos(a)*r,-54+Math.sin(a)*r*.95])}P(pts,BD);
    for(const[cx,cy,rot,h]of[[-24,-74,-.5,14],[22,-78,.45,16],[-34,-56,-1.1,10],[32,-58,1.1,11]]){c.save();c.translate(cx,cy);c.rotate(rot);P([[-4,4],[-3,-h*.6],[0,-h],[3,-h*.6],[4,4]],CR);c.restore()}
    eyes(11,-37,2.7,5.2,false);
  }else if(ty==='boss'){
    legs(14,8);
    wing(-1,28,-44,1.5);wing(1,28,-44,1.5);
    arms(-30,30,18,5);
    E(0,-46,40,36,0,BD);
    for(const sx of[-1,1]){c.fillStyle=BD;c.beginPath();c.moveTo(sx*18,-76);c.quadraticCurveTo(sx*30,-88,sx*24,-100);c.quadraticCurveTo(sx*38,-94,sx*30,-74);c.closePath();c.fill();
      c.fillStyle=CR;c.globalAlpha=.7;c.beginPath();c.moveTo(sx*34,-82);c.quadraticCurveTo(sx*42,-92,sx*38,-100);c.quadraticCurveTo(sx*46,-90,sx*38,-78);c.closePath();c.fill();c.globalAlpha=1}
    P([[-12,-80],[-10,-90],[-5,-84],[0,-96],[5,-84],[10,-90],[12,-80]],BD);
    if(!back){const op=.75+Math.sin(t*1.3)*.25;c.fillStyle=EY;c.beginPath();c.moveTo(0,-77);c.quadraticCurveTo(10,-62,0,-47);c.quadraticCurveTo(-10,-62,0,-77);c.fill();E(0,-62,2.4*op,8*op,0,BD);
      eyes(17.5,-39,6.5,5,true)}
  }else if(ty==='boss2'){/* ヨルノオオカゲ：この土地の夜が、ひとつにあつまったもの。体の中に星がまたたき、ひたいに三日月 */
    const NB=o.flash?BD:'#272143',NI=o.flash?BD:'#342c58',MO='#ffe08a';
    for(const sx of[-1,1]){c.save();c.translate(sx*30,-26);c.scale(sx,1);c.rotate(armAng(sx));c.strokeStyle=NB;c.lineWidth=9.2;c.beginPath();c.moveTo(0,0);c.lineTo(16.5,0);c.stroke();E(17.6,0,6.9,5.8,0,NB);c.restore()}
    c.fillStyle=NB;c.beginPath();c.moveTo(-34,-4);c.quadraticCurveTo(-40,-34,-28,-52);c.quadraticCurveTo(-14,-68,0,-68);c.quadraticCurveTo(14,-68,28,-52);c.quadraticCurveTo(40,-34,34,-4);
    for(let k=0;k<4;k++){const x0=34-k*17,w=Math.sin(t*2+k*1.3)*1.5;c.quadraticCurveTo(x0-8.5+w,6,x0-17,-4)}/* すそは、夜の霧のようにゆれる */c.closePath();c.fill();
    for(const sx of[-1,1]){c.fillStyle=NB;c.beginPath();c.moveTo(sx*14,-64);c.quadraticCurveTo(sx*30,-80,sx*22,-92);c.quadraticCurveTo(sx*38,-82,sx*28,-58);c.closePath();c.fill()}/* 三日月のような角 */
    c.fillStyle=NI;c.beginPath();c.ellipse(0,-30,24,22,0,0,7);c.fill();/* 夜空の奥 */
    if(!o.flash)for(const[sx2,sy2,r]of[[-16,-44,2.2],[14,-48,1.6],[-24,-22,1.6],[20,-20,2.2],[-6,-14,1.4],[8,-36,1.2],[0,-54,1.4]]){const tw=.4+.6*Math.abs(Math.sin(t*1.7+sx2*.3+sy2*.11));c.globalAlpha=tw;c.fillStyle=MO;c.beginPath();c.moveTo(sx2,sy2-r*2);c.lineTo(sx2+r*.6,sy2-r*.6);c.lineTo(sx2+r*2,sy2);c.lineTo(sx2+r*.6,sy2+r*.6);c.lineTo(sx2,sy2+r*2);c.lineTo(sx2-r*.6,sy2+r*.6);c.lineTo(sx2-r*2,sy2);c.lineTo(sx2-r*.6,sy2-r*.6);c.closePath();c.fill()}c.globalAlpha=1;/* またたく星 */
    if(!back){if(!o.flash){c.fillStyle=MO;c.beginPath();c.arc(0,-56,7,0,7);c.fill();c.fillStyle=NB;c.beginPath();c.arc(3.5,-58,6,0,7);c.fill()}/* ひたいの三日月 */
      eyes(12,-32,6.5,5.5,true)}
  }else{E(0,-40,24,22,0,BD);eyes(8,-42,3.6,6,false)}
  c.restore();
}
const EV=new WeakMap();let EVAP=[];/* 朝日で消える「コワイノ」：じゅわっと蒸発させる */
function drawEvap(it,now){const e=it.e,D=EN[e.type],z=D.size*2,px=e.x*TS,py=e.y*TS,p=Math.max(0,(now-it.t0)/(it.dur||1800)),v=EV.get(e)||{f:1};
  if(it.sand)return drawSand(it,now,e,D,z,px,py,v);
  if(it.die){/* たおれるモーション（やられの3コマ）→ たおれたまま、うすくなって消える */ctx.save();ctx.globalAlpha=p<.6?1:Math.max(0,1-(p-.6)/.4);drawShade(ctx,e.type,px,py+8,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,die:p<.12?0:p<.24?1:2,flash:p<.12});ctx.restore();return}
  if(p<.75){ctx.save();ctx.globalAlpha=Math.max(0,1-p/.75)*.9;ctx.translate(px,py+8);ctx.scale(1+p*.35,1-p*.55);ctx.translate(-px,-py-8);drawShade(ctx,e.type,px,py+8-p*10,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,flash:Math.sin(now/40)>0});ctx.restore()}
  for(let i=0;i<9;i++){const q=p*1.2-i*.06;if(q<0||q>1)continue;const sx=px+Math.sin(i*2.3+e.id)*14*z+Math.sin(now/300+i)*4,sy=py-6*z-q*48*z,r=(4+q*9)*z;ctx.globalAlpha=(1-q)*.55;ctx.fillStyle='#f4f0ff';ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill()}ctx.globalAlpha=1}
function drawSand(it,now,e,D,z,px,py,v){/* 砂になって消える：ひびが走る → 上から砂になってくずれ、足もとに砂山がのこって消える */
  const raw=(now-it.t0)/it.dur,p=Math.max(0,raw),Hh=34*D.size,Ww=14*D.size,top=py-Hh,SC=['#e8cf98','#d9b77a','#c9a35f','#b88d4f'];
  if(p<1){const c=p<.15?0:Math.min(1,(p-.15)/.75),cut=top+c*(Hh+14);
    const R=36*z,ox=px-R,oy=py+8-R*1.7,ww=R*2,hh=R*2.2,k=dpr*cam.z,cw=Math.ceil(ww*k)+2,ch=Math.ceil(hh*k)+2;/* 体だけを別の画面に描いて、砂の色をかさねる */
    if(EOC.width<cw||EOC.height<ch){EOC.width=EOS.width=Math.max(EOC.width,cw);EOC.height=EOS.height=Math.max(EOC.height,ch)}
    eox.setTransform(1,0,0,1,0,0);eox.clearRect(0,0,EOC.width,EOC.height);eox.setTransform(k,0,0,k,-ox*k,-oy*k);
    drawShade(eox,e.type,px+(raw<0?Math.sin(now/22)*3:0),py+8,.27*z,v.f,{dot:1,t:it.t0/1000+e.id*1.3,flash:false});/* ピシッ：一瞬ふるえる */
    eox.setTransform(1,0,0,1,0,0);eox.globalCompositeOperation='source-atop';eox.globalAlpha=Math.min(.8,c*1.3);eox.fillStyle='#c9a35f';eox.fillRect(0,0,cw,ch);eox.globalCompositeOperation='source-over';eox.globalAlpha=1;/* 体が砂の色にかわっていく */
    ctx.save();ctx.beginPath();ctx.rect(ox,cut,ww,hh);ctx.clip();ctx.drawImage(EOC,0,0,cw,ch,ox,oy,cw/k,ch/k);ctx.restore();
    if(raw<.25){ctx.save();ctx.globalAlpha=Math.min(1,(.25-raw)*6);ctx.strokeStyle='#fffbe8';ctx.lineWidth=2.2;for(let n2=0;n2<5;n2++){let x=px+(n2-2)*Ww*.35,y=top+Hh*.2;ctx.beginPath();ctx.moveTo(x,y);for(let n=0;n<5;n++){x+=Math.sin(e.id*7+n2*13+n*5)*Ww*.2;y+=Hh*.14;ctx.lineTo(x,y)}ctx.stroke()}ctx.restore()}/* ひびの線 */
    if(c>0&&c<1&&!PAUSE_FX())for(let n=0;n<3;n++)fx.push({k:'p',x:px+(Math.random()-.5)*Ww*1.8,y:cut+Math.random()*8,vx:(Math.random()-.5)*40,vy:-30+Math.random()*30,life:1.1,col:SC[(Math.random()*4)|0],r:2+Math.random()*2.5})}/* くずれたところから、砂がこぼれる */
  const m=Math.min(1,Math.max(0,(p-.2)/.6)),fade=p<1?1:Math.max(0,1-(raw-1)/.15);if(m>0&&fade>0){ctx.save();ctx.globalAlpha=fade;ctx.fillStyle='#c9a35f';ctx.beginPath();ctx.ellipse(px,py+10,Ww*1.2*m,Hh*.1*m+2,0,0,7);ctx.fill();ctx.fillStyle='#e0c487';ctx.beginPath();ctx.ellipse(px,py+7,Ww*.8*m,Hh*.06*m+1,0,0,7);ctx.fill();ctx.restore()}/* 足もとの砂山 */
  ctx.globalAlpha=1}
const PAUSE_FX=()=>started&&sheet!=null;
const GLW=document.createElement('canvas'),glx=GLW.getContext('2d');let GLWN=0;
const EOC=document.createElement('canvas'),EOS=document.createElement('canvas'),eox=EOC.getContext('2d'),eos=EOS.getContext('2d');
function enemyHidden(e,x0,y0,x1,y1){const ex=e.x|0,ey=e.y|0;
  for(let dy=0;dy<=4;dy++)for(let dx=-3;dx<=3;dx++){const x=ex+dx,y=ey+dy;if(x<0||y<0||x>=W||y>=H)continue;const a=anc(y*W+x),o=S.obj[a];if(!o||o==='part'||FLAT.has(o)||!BL[o])continue;
    const ay=(a/W)|0;if(ay<ey&&!(BL[o].sz&&ay+szAt(o,a)[1]-1>=ey))continue;const b=objBox(o,a);if(b[0]<x1&&b[2]>x0&&b[1]<y1&&b[3]>y0&&(ay>ey||dy>0||TREES.has(o)||BIG2.has(o)||BL[o].kind==='build'))return true}
  for(const h of HOUSES)if(h.set.has(ey*W+ex)||h.set.has((ey+1)*W+ex))return true;return false}
function drawEnemy(e,now){
  if(!e.spawned)return;const D=EN[e.type],z=D.size*2,px=e.x*TS,py=e.y*TS;
  if(!EV.has(e))EV.set(e,{x:e.x,y:e.y,back:false,f:1,mv:0});const v=EV.get(e),dx=e.x-v.x,dy=e.y-v.y;
  if(Math.abs(dx)+Math.abs(dy)>.001){v.mv=now;if(Math.abs(dx)>.0005)v.f=dx<0?-1:1;v.back=dy<0&&-dy>Math.abs(dx)*.6}v.x=e.x;v.y=e.y;
  shadow(ctx,px,py+8,9*z,2.6*z);
  {/* 白いふちどり：いったん別の画面に描いて、白いシルエットを少しずらして重ねる */
   const R=36*z,ox=px-R,oy=py+8-R*1.7,ww=R*2,hh=R*2.2,k=dpr*cam.z,cw=Math.ceil(ww*k)+2,ch=Math.ceil(hh*k)+2;
   if(EOC.width<cw||EOC.height<ch){EOC.width=EOS.width=Math.max(EOC.width,cw);EOC.height=EOS.height=Math.max(EOC.height,ch)}
   eox.setTransform(1,0,0,1,0,0);eox.clearRect(0,0,cw,ch);eox.setTransform(k,0,0,k,-ox*k,-oy*k);
   drawShade(eox,e.type,px,py+8,.27*z,v.f,{dot:1,t:now/1000+e.id*1.3,back:v.back,walk:now-v.mv<200,flash:false,hurt:e.flash>0?Math.max(0,1-e.flash/6):null,atk:now-(e.swing||-1e9)<300?.95+(now-e.swing)/300*.045:now-v.mv<200?0:(e.atk||0)/D.atk});
   eos.globalCompositeOperation='copy';eos.drawImage(EOC,0,0);eos.globalCompositeOperation='source-in';eos.fillStyle='#fff';eos.fillRect(0,0,cw,ch);eos.globalCompositeOperation='source-over';
   const sw=cw/k,sh=ch/k,o=1.3;ctx.globalAlpha=e.stun>0?.5:.95;
   const OFF=[[o,0],[-o,0],[0,o],[0,-o],[o*.7,o*.7],[-o*.7,o*.7],[o*.7,-o*.7],[-o*.7,-o*.7]];for(const[dx,dy]of OFF)ctx.drawImage(EOS,0,0,cw,ch,ox+dx,oy+dy,sw,sh);
   /* 夜は暗くなってふちが見えにくいので、物にかくれていなければ、暗さの上からもう一度ふちを光らせる */
   if(darkness()>0&&!enemyHidden(e,ox,oy,ox+ww,py+8)){if(GLW.width!==cv.width||GLW.height!==cv.height){GLW.width=cv.width;GLW.height=cv.height}if(!GLWN){glx.setTransform(1,0,0,1,0,0);glx.clearRect(0,0,GLW.width,GLW.height)}GLWN++;
     glx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);for(const[dx,dy]of OFF)glx.drawImage(EOS,0,0,cw,ch,ox+dx,oy+dy,sw,sh);glx.globalCompositeOperation='destination-out';glx.drawImage(EOC,0,0,cw,ch,ox,oy,sw,sh);glx.globalCompositeOperation='source-over'}
   ctx.globalAlpha=e.stun>0?.55:1;ctx.drawImage(EOC,0,0,cw,ch,ox,oy,sw,sh);ctx.globalAlpha=1}
  const bw=Math.max(14,e.max*2.2)*Math.min(z,1.3),bx=px-bw/2,byy=py+8-27*z-6;
  const bar=()=>{let by=byy;for(const[j]of WALLHIT){const wx=(j%W)*TS,wy=((j/W)|0)*TS;if(bx<wx+TS&&bx+bw>wx&&by+3>wy-18&&by-1<wy){by=Math.min(by,wy-22)}}/* 柵などの体力ゲージと重なるときは、その上に出す */ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx-1,by-1,bw+2,4);ctx.fillStyle='#ff6b8a';ctx.fillRect(bx,by,bw*Math.max(0,e.hp)/e.max,2)};if(BUBQ)BUBQ.push(bar);else bar();/* 体力ゲージは物にかくれないよう最後に */
}
// 物の見た目のおおよその範囲（描き直し・重なり判定用、少し大きめ）
// 建てている足場の見た目の広さ（マス）。x0:左はし, w:はば, rows:足もとまでの行数, hf:高さの倍率
// 足場・畑の区画・芽のドット絵。足場は大きさがいろいろなので、柱・横木・ななめ木・れんが・砂山のパーツを組み立てて、1まいの絵にしておく
const SITEK=['site:post','site:cap','site:beam','site:beamL','site:beamR','site:brace','site:brick','site:walltop','site:sand','site:post2','site:cap2','site:beam2','site:beamL2','site:beamR2','site:brace2','site:sand2'],SITEC={};
const chipOK=k=>{const C=window.CHIPS;return !!(C&&C[k]&&chipImgs(C[k],k)[0].ok)};
function siteImg(Wd,Hd,seed){Wd=Math.round(Wd);Hd=Math.round(Hd);if(!SITEK.every(chipOK))return null;const key=Wd+'x'+Hd+'_'+(seed%5);if(SITEC[key])return SITEC[key];
  const cv=document.createElement('canvas');cv.width=Wd;cv.height=Hd;const g=cv.getContext('2d'),C=CHIPS,im=k=>chipImgs(C[k],k)[0],put=(k,x,y)=>g.drawImage(im(k),Math.round(x+C[k].ax),Math.round(y+C[k].ay)),B=Hd;
  // 作りかけの壁：右へいくほど低い、だんだんの形
  const x0=Math.round(Wd*.1),x1=Math.round(Wd*.9),n=Math.max(1,Math.ceil((x1-x0)/6));g.save();g.beginPath();const tops=[];
  for(let k=0;k<n;k++){const t=n>1?k/(n-1):0,h=Math.floor((Hd*(.9-.42*t)+hash(seed*7+k)*5)/6)*6;tops.push(B-h);g.rect(x0+k*6,B-h,6,h)}g.clip();
  for(let y=B-6,r=0;y>-6;y-=6,r++)for(let x=x0-12+(r%2?6:0);x<x1;x+=12)put('site:brick',x,y);g.restore();
  for(let k=0;k<n;k++)for(let x=0;x<6&&x0+k*6+x<x1;x+=6)put('site:walltop',x0+k*6,tops[k]);
  const Z=Wd>=80?'2':'',PW=Z?9:6,BW=Z?7:5;/* 大きい足場は、太い柱と横木 */
  // 柱
  const posts=[[Math.round(Wd*.12)-(Z?4:3),Hd],[Math.round(Wd*.8),Math.round(Hd*.88)]];if(Wd>90)posts.push([Math.round(Wd*.48),Math.round(Hd*.78)]);
  for(const[px,ph]of posts){for(let y=B-8;y>B-ph;y-=8)put('site:post'+Z,px,y);put('site:cap'+Z,px,B-ph)}
  // ななめ木
  {const ax=posts[0][0]+(Z?4:3),ay=B-Math.round(Hd*.5),bx=Math.round(Wd*.56),by=B-3,len=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let s=0;s<=len;s++)put('site:brace'+Z,ax+(bx-ax)*s/len,ay+(by-ay)*s/len)}
  // 横木（柱より手前）
  for(const yy of[B-Math.round(Hd*.62),B-Math.round(Hd*.22)]){const E2=Z?3:2;put('site:beamL'+Z,0,yy);for(let x=E2;x<Wd-E2;x+=8)put('site:beam'+Z,Math.min(x,Wd-E2-8),yy);put('site:beamR'+Z,Wd-E2,yy)}
  for(const[px]of posts)put('site:sand'+Z,px+(Z?4:3),B);
  return SITEC[key]=cv}
function siteSpan(id){const b=BL[id];if(!b)return null;if(id==='statue')return{x0:-1,w:3,rows:1,hf:1.25};if(BIG2.has(id))return{x0:-.5,w:2,rows:1,hf:1.4};if(b.sz)return{x0:0,w:b.sz[0],rows:b.sz[1],hf:1};if(b.kind==='build')return{x0:-.2,w:1.4,rows:1,hf:1.1};return null}
function objBox(o,j){if(STAIRS.has(o)){const x=(j%W)*TS,y=((j/W)|0)*TS;return[x-TS-4,y-TS-30,x+2*TS+4,y+2*TS+4]}/* 階段は1×2で、どの向きにものびる */if(o==='site'&&S.dyn[j]){const sp=siteSpan(S.dyn[j].build);if(sp){const x=j%W,y=(j/W)|0,L=x*TS+sp.x0*TS-4,Wd=sp.w*TS+8,B=(y+sp.rows)*TS+3;return[L,B-Wd*91/104*sp.hf-20,L+Wd,B]}}
const x=j%W,y=(j/W)|0,b=BL[o],z=szAt(o,j)||[1,1],k=BIG2.has(o)?2:TREES.has(o)?2.25:(o==='stor'||o==='mbox')?1.25:BIG.has(o)?(BIGK[o]||1.5):1,tall=BIG2.has(o)||TREES.has(o)||b.kind==='build';
  const cx=x*TS+16*z[0],by=(y+z[1])*TS+3,hw=Math.max(16*z[0]*k,tall?28:16)+6,ht=tall?150:b.kind==='block'?44:48*k*z[1]+8;return[cx-hw,by-ht,cx+hw,by]}
const FLAT=new Set(['rug1','rug2','hoshirug','farm','plot','sprout','spike','puddle','sticky','firetrap','gust','crack']);/* 地面に近い物：その上に立つせいれいより下に描く */
function objectDepth(o,j){const y=(j/W)|0;if(FLAT.has(o)||LADDERS.has(o))return y+.02;if(o==='bridge')return y+.01;/* 橋は、上を歩く子より下 */if(STAIRS.has(o))return (stairDir(j)===2?y-1:y)+.02;/* 階段は、いちばん上の行のはじめ（上に立つせいれいより下） */if(HOME_DOORS.has(o)&&HOUSES.some(h=>h.set.has(j)))return y+.3;/* 家のドアは、屋根より下の層 */
  const b=o==='site'&&S.dyn[j]&&BL[S.dyn[j].build]||BL[o];
  return y+(b&&b.sz?(o==='site'?b.sz[1]:szAt(o,j)[1]):1)+(o==='obox'?.01:0);
}

const FORDS={s:null,n:-1,glow:null,st:new Map()};/* 浅瀬の絵：砂の光（どのマスも同じ1まい）と、マスごとの小石の絵（1回だけ作っておく） */
function fordStones(j){/* マス j の小石の絵（2倍の細かさ） */let c=FORDS.st.get(j);if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(2,2);const n=4+((hash(j*3)*3)|0);
  for(let k=0;k<n;k++){const sx=4+hash(j*11+k)*24,sy=4+hash(j*17+k)*24,r=1.2+hash(j*23+k)*2.2;g.fillStyle='rgba(60,80,80,.18)';g.beginPath();g.ellipse(sx+.4,sy+.8,r,r*.7,0,0,7);g.fill();g.fillStyle=k%3?'#b4ab98':'#a39a88';g.beginPath();g.ellipse(sx,sy,r,r*.7,0,0,7);g.fill();g.fillStyle='rgba(255,252,240,.35)';g.beginPath();g.ellipse(sx-.4,sy-.4,r*.5,r*.28,0,0,7);g.fill()}/* 小さな石（大きさ・色がばらばら） */
  FORDS.st.set(j,c);return c}
function drawFords(x0,y0,x1,y1){/* 浅瀬（仮の絵）：水の底の砂がすけて見える（ふちはぼかして、となりの浅瀬とつながる）・小さな石・ゆっくり流れるさざなみ */const now=performance.now();
  if(FORDS.s!==S||FORDS.n!==STATN){FORDS.s=S;FORDS.n=STATN;for(const c of FORDS.st.values())c.width=c.height=0;FORDS.st.clear()}/* 下絵が変わったら（浅瀬が変わったかもしれない）作りなおす */
  if(!FORDS.glow){const c=FORDS.glow=document.createElement('canvas');c.width=c.height=88;const g=c.getContext('2d'),gr=g.createRadialGradient(44,44,6,44,44,44);gr.addColorStop(0,'rgba(226,214,170,.55)');gr.addColorStop(.6,'rgba(214,204,160,.32)');gr.addColorStop(1,'rgba(214,204,160,0)');g.fillStyle=gr;g.fillRect(0,0,88,88)}
  for(let y=Math.max(0,y0-1);y<Math.min(H,y1+1);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){if(S.ground[y*W+x]!==2)continue;ctx.drawImage(FORDS.glow,x*TS-6,y*TS-6,44,44)}
  for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const j=y*W+x;if(S.ground[j]!==2)continue;const px=x*TS,py=y*TS;ctx.drawImage(fordStones(j),px,py,TS,TS);
    ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=.8;for(let k=0;k<2;k++){const ph=((now/2600+hash(j*29+k))%1),sx=px+6+hash(j*31+k)*20,sy=py+8+k*12+ph*4;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.beginPath();ctx.moveTo(sx-4,sy);ctx.quadraticCurveTo(sx,sy-1.6,sx+4,sy);ctx.stroke()}ctx.globalAlpha=1}}/* 石のあいだを流れるさざなみ（動くので毎コマ） */
const WCK={s:null,c:new Map(),pt:null};/* 水面の区画（16×16マス）：水ぎわの陸の地面と水のふちの絵（上にかさねる）と、水の模様をぬる所の形。区画の地面が変わったときだけ作りなおす */
function waterDirty(R){if(!R){for(const q of WCK.c.values())if(q&&q.o)q.o.width=q.o.height=0;WCK.c.clear();return}for(const r of R)for(let cy=Math.max(0,(r[1]-1)>>4);cy<=Math.min((H-1)>>4,(r[3]+1)>>4);cy++)for(let cx=Math.max(0,(r[0]-1)>>4);cx<=Math.min((W-1)>>4,(r[2]+1)>>4);cx++){const k=cy*64+cx,q=WCK.c.get(k);if(q&&q.o)q.o.width=q.o.height=0;WCK.c.delete(k)}}/* 下絵がかわった所の区画を作りなおす（R がなければ、ぜんぶ） */
function waterChunk(cx,cy){const k=cy*64+cx;if(WCK.c.has(k))return WCK.c.get(k);{const g0=GRD.c.get(k);if(GRD.s!==S||!g0||!g0.f||g0.st)return null}/* 地面の区画（くわしい絵）ができてから作る */const C=window.CHIPS,X0=cx*16,Y0=cy*16,X1=Math.min(W,X0+16),Y1=Math.min(H,Y0+16),isW=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&S.ground[y*W+x]>=1,near=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(isW(x+dx,y+dy))return true;return false};
  const P=new Path2D();let any=false;for(let y=Y0;y<Y1;y++){let x=X0;while(x<X1){if(!near(x,y)){x++;continue}let e=x;while(e+1<X1&&near(e+1,y))e++;P.rect(x*TS,y*TS,(e-x+1)*TS,TS);any=true;x=e+1}}/* 水の模様をぬる所：水のマスと、そのまわり1マス */
  if(!any){WCK.c.set(k,null);return null}
  const w=(X1-X0)*TS,h=(Y1-Y0)*TS,put=(c,ch,x,y)=>{const src=ch.src||ch,i=chipImgs(src,'water')[0];if(!i.ok)return false;if(src.g===64)c.drawImage(i,x+src.ax/2,y+src.ay/2,src.w/2,src.h/2);else c.drawImage(i,x+src.ax,y+src.ay);return true};
  const m=TMPC();m.width=w;m.height=h;const gm=m.getContext('2d');gm.translate(-X0*TS,-Y0*TS);const o=document.createElement('canvas');o.width=w;o.height=h;const g=o.getContext('2d');
  for(let y=Y0-1;y<=Y1+1;y++)for(let x=X0-1;x<=X1+1;x++){const b=(isW(x-1,y-1)?1:0)|(isW(x,y-1)?2:0)|(isW(x-1,y)?4:0)|(isW(x,y)?8:0);if(!b)continue;const ch=C['waterm:'+b];if(ch)put(gm,ch,x*TS,y*TS)}
  g.drawImage(gq(cx,cy).f,0,0);g.globalCompositeOperation='destination-out';g.drawImage(m,0,0);g.globalCompositeOperation='source-over';g.translate(-X0*TS,-Y0*TS);/* 陸の地面（下絵）のうち、水でない所（区画ぜんぶ。水の模様をぬった所のふちの、うすい線もかくれる） */
  for(let y=Y0-1;y<=Y1+1;y++)for(let x=X0-1;x<=X1+1;x++){const b=(isW(x-1,y-1)?1:0)|(isW(x,y-1)?2:0)|(isW(x-1,y)?4:0)|(isW(x,y)?8:0);if(!b)continue;const ce=C['water:'+b];if(ce)put(g,ce,x*TS,y*TS)}/* 水のふち */
  m.width=m.height=0;const q={o,P};WCK.c.set(k,q);return q}
function waterShimmer(now,x0,y0,x1,y1){/* 水面（ふつうのタイルのやり方）：水の模様（tex:water）を、水のマスとまわり1マスに、世界の座標でしきつめてぬる（ゆっくりスクロール）。その上に、区画ごとに作っておいた「水ぎわの陸の地面と水のふち」の絵をかさねる */
  if(WD===1||!waterChipsOK())return;const C=window.CHIPS,im=chipImgs(C['tex:water'],'water')[0];if(!im.ok)return;
  if(WCK.s!==S){waterDirty(null);WCK.s=S;WCK.pt=null}
  const t=now/1000,sx=Math.floor(t*4)%128,sy=Math.floor(t*2)%128;/* 1秒に よこ4・たて2ドット（テクスチャの1ドットずつ動かす） */
  const qs=[];for(let cy=Math.max(0,(y0-1)>>4);cy<=Math.min((H-1)>>4,(y1+1)>>4);cy++)for(let cx=Math.max(0,(x0-1)>>4);cx<=Math.min((W-1)>>4,(x1+1)>>4);cx++){const q=waterChunk(cx,cy);if(q)qs.push([cx,cy,q])}
  if(!qs.length)return;
  const P=new Path2D();for(const[,,q]of qs)P.addPath(q.P);/* 見えている区画の形を1つにして、1回でぬる（区画のさかいに線が出ないように） */
  const pt=WCK.pt||(WCK.pt=ctx.createPattern(im,'repeat'));pt.setTransform(new DOMMatrix().translate(sx,sy));ctx.fillStyle=pt;ctx.fill(P);
  const kz=dpr*cam.z,SX=v=>cam.x+Math.round((v-cam.x)*kz)/kz,SY=v=>cam.y+Math.round((v-cam.y)*kz)/kz;
  for(const[cx,cy,q]of qs){const a=SX(cx*16*TS),b=SY(cy*16*TS);ctx.drawImage(q.o,a,b,SX(cx*16*TS+q.o.width)-a,SY(cy*16*TS+q.o.height)-b)}}/* 区画の絵は、画面のドットのさかいに合わせておく */
function sideClip(i,f){/* 低いマスの物が、となりの高いマスの上へはみ出さないように：となりのマスが高ければ、そのマスの高い面（上の面のてっぺんより下）には描かない */const x=i%W,y=(i/W)|0,h=hiAt(i),L=x>0&&hiAt(i-1)>h?hiAt(i-1):0,R=x<W-1&&hiAt(i+1)>h?hiAt(i+1):0;if(!L&&!R){f();return}
  ctx.save();ctx.beginPath();ctx.rect(x*TS-200,y*TS-400,TS+400,600);if(L)ctx.rect(x*TS-200,y*TS-L*LIFT,200,TS+L*LIFT+200);if(R)ctx.rect((x+1)*TS,y*TS-R*LIFT,200,TS+R*LIFT+200);ctx.clip('evenodd');f();ctx.restore()}
function liftDraw(z,f){if(!z){f();return}ctx.save();ctx.translate(0,-z);f();ctx.restore()}
const CLIMB=new Set();/* いま段差をよじのぼっている・おりているせいれい（uLift で入れる） */
function uLift(o){if(o&&o.elem){CLIMB.delete(o);if(S&&LADDERS.has(S.obj[(o.y|0)*W+(o.x|0)])&&o.path&&o.path.length)CLIMB.add(o)}/* ハシゴの上を動いている子も、よじのぼる動き *//* 段差の上にいる子・コワイノは、LIFT だけ上に。段差を飛んでいる間は、高さを少しずつかえて、ぴょんと弧をえがく */
  if(!S.hi||!o)return 0;const cj=(o.y|0)*W+(o.x|0),n=o.path&&o.path.length?o.path[0]:-1;
  if(n>=0&&n!==cj||n>=0){const nx=n%W+.5,ny=((n/W)|0)+.5,ddx=nx-o.x,ddy=ny-o.y,d=Math.hypot(ddx,ddy);if(d>.001&&d<1.01){const sx=Math.abs(ddx)>=Math.abs(ddy)?Math.sign(ddx):0,sy=sx?0:Math.sign(ddy),a=n-sy*W-sx,ha=hiAt(a),hn=hiAt(n);if(jumpEdge(a,n)){const t=1-d;if(o.elem){CLIMB.add(o);return LIFT*(ha+(hn-ha)*t)+Math.abs(Math.sin(t*Math.PI*4))*1.5}/* せいれいは、よじのぼる・おりる（少しずつ高さをかえ、1歩ごとに小さくゆれる） */return LIFT*(ha+(hn-ha)*t)+Math.sin(Math.PI*t)*10}}}
  return zAt(o.x,o.y)}
const STPAL={slope_earth:['#c19466','#8f6642','#6e4c30'],stairs_wood:['#dcae72','#a9784b','#86593a'],stairs_brick:['#dba48c','#b8735c','#935a47'],stairs_stone:['#d3cdc2','#a59d91','#837b70']};
function drawStair(c,id,px,py,d,top,bot){/* 階段のアイコン（仮の絵）：手前へ下りる5だん */
  const P=STPAL[id]||STPAL.slope_earth,br=id.endsWith('_brick'),n=5,h=(bot-top)/n,x0=px+3,w=TS-6;
  if(SLOPES.has(id)){c.fillStyle=P[1];c.beginPath();c.moveTo(x0,bot);c.lineTo(x0+w,bot);c.lineTo(x0+w,top+4);c.closePath();c.fill();c.fillStyle=P[0];c.beginPath();c.moveTo(x0,bot);c.lineTo(x0+w,top+4);c.lineTo(x0+w,top);c.lineTo(x0,bot-4);c.closePath();c.fill();return}/* 坂のアイコン */
  for(let k=0;k<n;k++){const y=top+k*h;c.fillStyle=P[0];c.fillRect(x0,y,w,h*.5+.5);c.fillStyle=P[1];c.fillRect(x0,y+h*.5,w,h*.5+.5);if(br){c.fillStyle='rgba(235,220,205,.55)';const bw=w/4,o=k%2?bw/2:0;for(let xx=x0+o;xx<x0+w;xx+=bw)c.fillRect(xx,y+h*.5,.6,h*.5)}}}
const SN=6;/* 階段の段の数（どの向きも同じ） */
const SLTEX=new Map();function slopeTex(a,d){/* 坂の面のもようは、のぼった先の高いマスの地面と同じ（草地・あれ地・あぜ道・砂利道など）。ふちのない、その地面の絵をくりかえす */
  const t=stairTop(a,d),f=S.floor[t]||'',g=REV.has(t);let e=SLTEX.get(a);if(e&&e.t===t&&e.f===f&&e.g===g&&e.w===WD)return e.p;const C=window.CHIPS||{},mk=(ch,id)=>{if(!ch)return null;const cv=document.createElement('canvas');cv.width=cv.height=TS;drawChip(cv.getContext('2d'),ch,id,0,0,0);return cv};
  let src=f?mk(C[(f==='woodpath'?'floor':f==='brickfloor'?'brick':f==='stonefloor'?'stonefloor':f)+'#0'],f):g?(C['tex:grass']&&chipImgs(C['tex:grass'],'ground')[0]):WD===1?mk(C['groundr#0'],'ground'):(C['tex:dry']&&chipImgs(C['tex:dry'],'ground')[0]);
  if(!src||src.ok===false)return null;e={t,f,g,w:WD,p:document.createElement('canvas').getContext('2d').createPattern(src,'repeat')};SLTEX.set(a,e);return e.p}
function cliffEdgeOver(c,k,sd){/* 高いマス k の、sd がわ（0左・1右）のはし：横の岩と、がけの正面の丸いはし（段差の部品と同じ描き方） */
  const C=window.CHIPS||{},fd=(key,x,y)=>{const ch=C[key];if(ch)drawChip(c,ch,'cliff',x,y,0)},px=(k%W)*TS,py=((k/W)|0)*TS,U=hiAt(k-W)>=CLV,D=hiAt(k+W)>=CLV,L=topAt(k-1),R=topAt(k+1),cl=(x,y,w,h,f)=>{c.save();c.beginPath();c.rect(x,y,w,h);c.clip();f();c.restore()};
  cl(sd?px+TS-3:px-8,py-LIFT+(U?0:5),11,TS,()=>fd('cliff:side'+(sd?'R':'L')+(REV.has(k)?'':'~d'),px,py));
  if(!D){cl(sd?px+TS-8:px-8,py+TS-LIFT-8,16,LIFT+10,()=>fd('cliff:'+(!L&&!R?'faceLR':sd?'faceR':'faceL'),px,py))}}
const FEATHC=new Map();function slopeFeather(c,a,d){/* 坂をのぼった先：上の面の絵（下絵を LIFT 上にずらした絵）を、さかいの外6ドットから坂の上へ10ドットまで（鏡うつしで）のばして、坂の上でうすくしていく。上の面のふちの線はかくれ、さかいはなめらか。坂の面の明るさのちがいで、終わりはわかる */
  const ax=(a%W)*TS,ay=((a/W)|0)*TS,I=6,O=10,v=d===0||d===2,K=2;
  const x=d===1?ax-I:d===3?ax+TS-O:ax,y=d===0?ay-LIFT-I:d===2?ay+TS-LIFT-O:ay-LIFT,w=v?TS:I+O,h=v?I+O:TS,key=STATN+':'+d;
  let e=FEATHC.get(a);if(!e||e.k!==key){const cv=document.createElement('canvas');cv.width=w*K;cv.height=h*K;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(K,0,0,K,-x*K,-y*K);
    if(d===0){gblit(g,ax,ay-I,TS,I,ax,ay-LIFT-I,TS,I);g.save();g.translate(0,2*(ay-LIFT));g.scale(1,-1);gblit(g,ax,ay-O,TS,O,ax,ay-LIFT-O,TS,O);g.restore()}/* 上の面のはしを、さかいで鏡うつしにして、坂の上へのばす */
    else if(d===2){gblit(g,ax,ay+TS,TS,I,ax,ay+TS-LIFT,TS,I);g.save();g.translate(0,2*(ay+TS-LIFT));g.scale(1,-1);gblit(g,ax,ay+TS,TS,O,ax,ay+TS-LIFT,TS,O);g.restore()}
    else if(d===1){gblit(g,ax-I,ay,I,TS,ax-I,ay-LIFT,I,TS);g.save();g.translate(2*ax,0);g.scale(-1,1);gblit(g,ax-O,ay,O,TS,ax-O,ay-LIFT,O,TS);g.restore()}
    else{gblit(g,ax+TS,ay,I,TS,ax+TS,ay-LIFT,I,TS);g.save();g.translate(2*(ax+TS),0);g.scale(-1,1);gblit(g,ax+TS,ay,O,TS,ax+TS,ay-LIFT,O,TS);g.restore()}
    g.fillStyle='rgba(255,250,225,.10)';g.fillRect(x,y,w,h);/* 上の面と同じく少し明るく */
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';const W2=w*K,H2=h*K,L=I+O,gr=d===0?g.createLinearGradient(0,0,0,H2):d===2?g.createLinearGradient(0,H2,0,0):d===1?g.createLinearGradient(0,0,W2,0):g.createLinearGradient(W2,0,0,0);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop((I+2)/L,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W2,H2);e={k:key,cv};FEATHC.set(a,e)}
  c.save();if(!v){/* 横向き：坂の上は、ななめの面の中だけ */const xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,gy=ay+TS;c.beginPath();c.moveTo(xi,ay-LIFT);c.lineTo(xo,ay);c.lineTo(xo,gy);c.lineTo(xi,gy-LIFT);c.closePath();c.rect(d===1?ax-I:ax+TS,ay-LIFT,I,TS);c.clip('nonzero')}
  c.drawImage(e.cv,x,y,w,h);c.restore()}
function slopeCliff(c,x0,y,len){/* がけの正面の岩の絵を、よこにならべる（坂の横の三角） */const ch=(window.CHIPS||{})['cliff:face'];if(!ch)return;for(let x=x0;x<x0+len;x+=TS)drawChip(c,ch,'cliff',x,y,0)}
function drawStairObj(c,a){/* 階段は、置いた地面の高さ（hiAt）だけ上に描く。のぼった先は、その1だん上（CLV） */const L0=hiAt(a),cv=CLV;c.save();c.translate(0,-L0*LIFT);CLV=L0+1;try{drawStairObj0(c,a)}finally{CLV=cv;c.restore()}}
function drawStairObj0(c,a){/* 階段（仮の絵）：段差の下の低い地面に置く。手前向きは1マス（がけの正面とあわせて2マスぶんに見える）、ほかは1×2。高いほうのはしの高さ LIFT から地面まで6だん（段の高さ LIFT/7） */
  const id=S.obj[a],d=stairDir(a);if(d<0)return;const P=STPAL[id]||STPAL.slope_earth,br=id.endsWith('_brick'),Dn=(d===0?TS:2*TS)/SN,z=n=>n>=SN?0:LIFT*(SN-n)/(SN+1),MO='rgba(235,220,205,.55)',ax=(a%W)*TS,ay=((a/W)|0)*TS;
  const mo=(x,y,w,h)=>{c.fillStyle=MO;c.fillRect(x,y,w,h)};
  const vjoin=(x,y,w,h,off)=>{for(let xx=Math.floor((x-off)/16)*16+off;xx<x+w;xx+=16)if(xx>x+.5)mo(xx,y,.6,h)};/* たての目地（世界の座標で16ドットごと：レンガ1こ16×8） */
  const wd=id==='stairs_wood',stn=id==='stairs_stone',hz=k=>hash(a*977+k*131);
  const sfree=ks=>ks.every(k=>{if(k<0)return false;const t=typeAt(k);return !(hiAt(k)>=CLV||HOME_WALLS.has(t)||HOME_DOORS.has(t)||FENCE_IDS.has(t))}),o2=d===2?stairOut(a,d):-1,sTop=d===0?ay-LIFT:ay-TS,sBot=d===0?ay+TS:ay+TS-LIFT;
  const vnat=SLOPES.has(id)&&(d===0||d===2)&&!['stone','brick'].includes(S.floor[stairTop(a,d)]||''),sL=vnat&&sfree(d===0?[a-1]:[a-1,o2-1]),sR=vnat&&sfree(d===0?[a+1]:[a+1,o2+1]);/* たて向きの坂（土・草地）：両わきは、がけの上の面のように、少しでこぼこのふち（外へ1〜2ドット） */
  const sje=(y,sd)=>{const k=Math.floor(y/3),f=y/3-k,h0=hz(9000+k*2+sd),h1=hz(9000+(k+1)*2+sd);return .8+(h0+(h1-h0)*f)*1.4},eX=(y,sd)=>sd?ax+TS+(sR?sje(y,1):0):ax-(sL?sje(y,0):0);
  const sPath=()=>{c.beginPath();c.moveTo(eX(sTop,0),sTop);for(let y=sTop;y<=sBot;y++)c.lineTo(eX(y,0),y);for(let y=sBot;y>=sTop;y--)c.lineTo(eX(y,1),y);c.closePath()};
  const txp=rot=>{const k=wd?'tex:planks':'tex:granite',ch=(window.CHIPS||{})[k];if(!ch)return null;const im=chipImgs(ch,k)[0];if(!im||!im.ok)return null;const p=c.createPattern(im,'repeat'),m=new DOMMatrix();if(rot)m.rotateSelf(90);m.scaleSelf(.5,.5);p.setTransform(m);return p};/* もらったテクスチャ（木は板、石はみかげ石）を、1マス64ドットの細かさでしきつめる。木は、段にそって板がならぶ向き */
  const tex=(x,y,w,h,rot,dk)=>{const p=txp(rot);if(!p)return false;c.fillStyle=p;c.fillRect(x,y,w,h);if(dk){c.fillStyle=dk;c.fillRect(x,y,w,h)}return true};
  const DK=wd?'rgba(70,42,20,.3)':'rgba(40,40,44,.24)';/* 段の手前の面・側板は、上の面より暗く */
  const riser=(x,y,w,h,n)=>{c.fillStyle=P[1];c.fillRect(x,y,w,h);if(br)vjoin(x,y,w,h,n%2?8:0);else if(wd||stn)tex(x,y,w,h,1,DK)};/* 段の手前の面（レンガは、上の段と同じならび） */
  const face=(x,y,w,h,gy)=>{c.fillStyle=P[1];c.fillRect(x,y,w,h);if(wd||stn)tex(x,y,w,h,1,DK);if(!br)return;for(let k=0;gy-8*k>y;k++){const yb=gy-8*k,yt=Math.max(y,yb-8);if(k)mo(x,yb,w,.6);vjoin(x,yt,w,yb-yt,k%2?8:0)}};/* 横の側面（地面から8ドットずつ積む） */
  const tread=(x,y,w,h,n,dark,vert)=>{c.fillStyle=P[0];c.fillRect(x,y,w,h);if(wd||stn)tex(x,y,w,h,!vert,null);if(!br)return;if(vert){for(let yy=y+(n%2?8:0);yy<y+h;yy+=16)if(yy>y+.5)mo(x,yy,w,.6)}else vjoin(x,y,w,h,n%2?8:0)};/* 段の上の面：1段に1列（レンガは、段ごとに半分ずらす） */
  const SH1='rgba(50,36,24,.5)',SH2='rgba(60,45,30,0)',HI='rgba(255,252,238,.6)';/* 段のふち：手前のふちに明るい線1ドット、段の奥に濃いかげ1ドット *//* 段のさかい：1ドットのかげと、その外がわにもう1ドットうすいかげ */
  const lat=d===0?[[a-1,a-1+W],[a+1,a+1+W]]:d===2?[[a-1,a-1-W],[a+1,a+1-W]]:null;c.save();
  {const tj=stairTop(a,d);if(tj!=null&&tj>=0&&hiAt(tj)>=CLV){const Q=new Path2D(),E=new Path2D();Q.rect(ax-3*TS,ay-3*TS,7*TS,7*TS);cliffTop(Q,E,(tj/W)|0,tj%W);c.clip(Q,'evenodd')}}/* のぼった先の高いマスの上の面（でこぼこのふち）には、階段をかぶせない */
  if(SLOPES.has(id)){/* 坂：段のない、ひとつづきの面（素材のもようは、下りる向きに6つ） */const mat=id.slice(6),X0=d===1?ax:d===3?ax-TS:ax,len=d===0?TS:2*TS,poly=pts=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const q of pts)c.lineTo(q[0],q[1]);c.closePath()};
    const surf=(x,y,w,h,along)=>{c.save();c.translate(0,-LIFT);c.fillStyle=slopeTex(a,d)||P[0];c.fillRect(x,y+LIFT,w,h);c.restore();/* もようは、のぼった先の上の面と同じ位置（上の面は下絵を LIFT 上にずらして描く） */const hi=d===0||d===1,L0=along?w:h,g=c.createLinearGradient(along?(hi?x:x+w):0,along?0:(hi?y:y+h),along?(hi?x+w:x):0,along?0:(hi?y+h:y));g.addColorStop(0,'rgba(60,45,30,0)');g.addColorStop(Math.min(1,14/L0),'rgba(60,45,30,.10)');g.addColorStop(1,'rgba(60,45,30,.16)');/* のぼった先からなめらかに少し暗く（坂の終わりがわかる） */c.fillStyle=g;c.fillRect(x,y,w,h);if(mat==='earth')return;
      const N=mat==='stone'?3:6,L='rgba(60,45,30,.18)';for(let k=1;k<N;k++){c.fillStyle=br?MO:L;if(along)c.fillRect(x+w*k/N,y,.7,h);else c.fillRect(x,y+h*k/N,w,.7)}/* 下りる向きに、板・石・レンガの列 */
      if(mat!=='wood')for(let k=0;k<N;k++){const off=k%2?8:0;if(along){for(let yy=Math.floor((y-off)/16)*16+off;yy<y+h;yy+=16)if(yy>y)mo(x+w*k/N,yy,w/N,.6)}else vjoin(x,y+h*k/N,w,h/N,off)}};/* 石・レンガの目地 */
    if(vnat){c.save();sPath();c.clip();surf(ax-3,sTop,TS+6,sBot-sTop,0);c.restore()}
    else if(d===0){surf(ax,ay-LIFT,TS,TS+LIFT,0)}
    else if(d===2){surf(ax,ay-TS,TS,2*TS-LIFT,0)}
    else{const xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,gy=ay+TS;c.save();poly([[xi,ay-LIFT],[xo,ay],[xo,gy],[xi,gy-LIFT]]);c.clip();surf(X0,ay-LIFT,len,TS+LIFT,1);c.restore();c.save();poly([[xi,gy-LIFT],[xo,gy],[xi,gy]]);c.clip();slopeCliff(c,X0,gy-TS,len);c.restore()}}/* 横向き：上の面と、手前の三角の側面（がけの岩の絵） */
  else if(d===0){/* 手前へ下りる：段の上の面と、手前の面 */riser(ax,ay-LIFT,TS,LIFT-z(0)+.5,1);for(let n=0;n<SN;n++){const ya=ay+n*Dn,yb=ya+Dn;tread(ax,ya-z(n),TS,Dn+.5,n,0,0);if(!SLOPES.has(id)){c.fillStyle=SH1;c.fillRect(ax,ya-z(n),TS,1);c.fillStyle=HI;c.fillRect(ax,yb-z(n)-1,TS,1)}riser(ax,yb-z(n),TS,z(n)-z(n+1)+.5,n)}}
  else if(d===2){/* 奥へ下りる：手前の段ほど高い。向こうの段から描いて、手前の段でかくす */const Y1=ay+TS;for(let n=SN-1;n>=0;n--){const yb=Y1-n*Dn,ya=yb-Dn;const t0=ya-z(n);tread(ax,t0,TS,Dn+.5,n,1,0);if(n<SN-1){c.fillStyle=SH1;c.fillRect(ax,t0-1,TS,1)}c.fillStyle=HI;c.fillRect(ax,t0,TS,1)}}/* 段のさかい：手前の段のふちの上（おくの段）に、かげ2ドット */
  else{/* 横へ下りる：おくの側板（うしろなので先に）→ 段の上の面・段の正面（けこみ）→ 手前の側板 */const X0=d===1?ax:ax-TS,o=stairOut(a,d),xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,zb=f=>LIFT*(1-f)+(SLOPES.has(id)?2:5)/* 階段の側板は、段より5ドット上まで（坂は2） */;let bkN=0;
    if([a-W,o-W].every(k=>{const t=typeAt(k);return !(hiAt(k)>=CLV||HOME_WALLS.has(t)||HOME_DOORS.has(t)||FENCE_IDS.has(t))})){c.beginPath();c.moveTo(xi,ay-zb(0));c.lineTo(xo,ay-zb(1));c.lineTo(xo,ay+TS);c.lineTo(xi,ay+TS);c.closePath();c.fillStyle=P[1];c.fill();c.beginPath();c.moveTo(xi,ay-zb(0));c.lineTo(xo,ay-zb(1));c.lineTo(xo,ay+3-zb(1));c.lineTo(xi,ay+3-zb(0));c.closePath();c.fillStyle=P[0];c.fill();c.beginPath();c.moveTo(xi,ay+3-zb(0));c.lineTo(xo,ay+3-zb(1));c.lineTo(xo,ay+4-zb(1));c.lineTo(xi,ay+4-zb(0));c.closePath();c.fillStyle='rgba(60,45,30,.18)';c.fill();bkN=1}/* 上の面と側面のさかいに、うすいかげ1ドット *//* おくの側板（上の面と、手前に向いた面）：段より奥なので、段の前に描く（段のぎざぎざが見える） */
    for(let n=0;n<SN;n++){const x=d===1?X0+n*Dn:X0+2*TS-(n+1)*Dn,zz=z(n),gy=ay+TS;tread(x,ay-zz,Dn+.5,TS,n,1,1);face(x,gy-zz,Dn+.5,zz,gy);if(bkN){c.fillStyle=SH1;c.fillRect(x,ay-zz,Dn+.5,1);c.fillStyle=SH2;c.fillRect(x,ay-zz+1,Dn+.5,1)}/* おくの側板に接するふちのかげ */
      if(n){const RW=3,rx=d===1?x:x+Dn-RW,sx=d===1?x+RW:x+Dn-RW-1,dx=d===1?1:-1;c.fillStyle=P[1];c.fillRect(rx,ay-zz,RW,TS);if(br){c.fillStyle=MO;for(let yy=ay-zz+8;yy<ay-zz+TS;yy+=8)c.fillRect(rx,yy,RW,.6)}c.fillStyle=SH1;c.fillRect(sx,ay-zz,1,TS);c.fillStyle=SH2;c.fillRect(sx+dx,ay-zz,1,TS);c.fillStyle=HI;c.fillRect(d===1?x-1:x+Dn,ay-z(n-1),1,TS)}}}/* 段のさかい：高い段の正面（けこみ、3ドット）・そのとなりにかげ2ドット・高い段のふちを明るく */
  {const o=d?stairOut(a,d):-1,cl=k=>{const t=typeAt(k);return hiAt(k)>=CLV||HOME_WALLS.has(t)||HOME_DOORS.has(t)||FENCE_IDS.has(t)},free=ks=>ks.every(k=>k>=0&&!cl(k)),BW=3;
  if(SLOPES.has(id)){/* 坂の横：板ではなく、がけの横の岩（横に壁・柵・がけがないがわだけ。段差にうまった坂は、横ががけなので描かない） */const tj=stairTop(a,d),dz=REV.has(tj)?'':'~d',C=window.CHIPS||{},wedge=(pts,k,x,ys)=>{const ch=C[k];if(!ch)return;c.save();c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const q of pts)c.lineTo(q[0],q[1]);c.closePath();c.clip();if(vnat){const sd=k.includes('sideR')?1:0,xo=sd?ax+TS+12:ax-12;c.beginPath();c.moveTo(xo,sTop);for(let y=sTop;y<=sBot;y++)c.lineTo(eX(y,sd),y);c.lineTo(xo,sBot);c.closePath();c.clip()}/* でこぼこのふちの外がわだけに岩 */for(const y of ys)drawChip(c,ch,'cliff',x,y,0);c.restore()};
    if(d===0||d===2){const yt=d===0?ay-LIFT:ay+TS-LIFT,yb=d===0?ay+TS:ay-TS,ys=d===0?[ay-TS+LIFT,ay,ay+TS]:[ay-TS,ay,ay+TS],fl=d===0?[a-1]:[a-1,o-1],fr=d===0?[a+1]:[a+1,o+1];
      if(free(fl))wedge([[ax-3,yt],[ax+.5,yt],[ax+.5,yb]],'cliff:sideL'+dz,ax,ys);
      if(free(fr))wedge([[ax+TS+3,yt],[ax+TS-.5,yt],[ax+TS-.5,yb]],'cliff:sideR'+dz,ax,ys)}
    {/* 坂の面のふち：がけの上の面と同じ（ふちの帯・内がわのかげ・草地ははみ出す草）。ふちのある道（石畳・レンガ道）は、道と同じへり */
      const f=S.floor[tj]||'',rd=f==='stone'||f==='brick'?f:'',gr=!f&&REV.has(tj),lat=d===1||d===3,xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,k=lat?LIFT/(xo-xi):0;
      const x0=lat?Math.min(xi,xo):ax,x1=lat?Math.max(xi,xo):ax+TS,y0=d===0?ay-LIFT:d===2?ay-TS:ay-LIFT,y1=d===0?ay+TS:d===2?ay+TS-LIFT:ay+TS-LIFT;/* 坂の面（横向きは、ななめの面をまっすぐにのばした形で） */
      const sideF=lat?[free([a-W,o-W]),free([a+W,o+W])]:d===0?[free([a-1]),free([a+1])]:[free([a-1,o-1]),free([a+1,o+1])];
      c.save();if(lat)c.transform(1,k,0,1,0,-k*xi);c.beginPath();if(vnat)sPath();else c.rect(x0,y0,x1-x0,y1-y0);c.clip();
      if(rd){const ch=C[rd+(lat?':3':':12')];if(ch){c.save();c.beginPath();c.rect(x0,y0,x1-x0,y1-y0);c.clip();if(lat)for(let x=x0-TS;x<x1+TS;x+=TS)drawChip(c,ch,rd,x,y0,0);else for(let y=y0-TS;y<y1;y+=TS)drawChip(c,ch,rd,x0,y,0);c.restore()}}/* へりは、道と同じ位置のまま、外の2ドットを切る（道も、つながっていないがわは2ドット内がわで切ってある） *//* へりの石・レンガ（よこ向きは上下、たて向きは左右） */
      else{const col=gr?'rgba(92,134,58,.5)':'rgba(110,78,46,.26)',B=2.2,ed=lat?[[x0,y0,x1-x0,B,0,1],[x0,y1-B,x1-x0,B,0,-1]]:[[x0,y0,B,y1-y0,1,0],[x1-B,y0,B,y1-y0,-1,0]];
        if(vnat){for(let y=y0;y<y1;y++)for(const sd of[0,1]){if(!sideF[sd])continue;const e=eX(y+.5,sd),dir=sd?-1:1;c.fillStyle=col;c.fillRect(sd?e-B:e,y,B,1);for(let q=0;q<3;q++){c.fillStyle='rgba(45,35,20,'+(.12-q*.04)+')';c.fillRect(sd?e-B-1-q:e+B+q,y,1,1)}}}/* でこぼこのふちにそって、帯とかげ */else ed.forEach(([x,y,w,h,dx,dy],n)=>{if(!sideF[n])return;c.fillStyle=col;c.fillRect(x,y,w,h);const g=dx?c.createLinearGradient(dx>0?x+B:x,0,dx>0?x+B+3:x-3,0):c.createLinearGradient(0,dy>0?y+B:y,0,dy>0?y+B+3:y-3);g.addColorStop(0,'rgba(45,35,20,.14)');g.addColorStop(1,'rgba(45,35,20,0)');c.fillStyle=g;if(dx)c.fillRect(dx>0?x+B:x-3,y,3,h);else c.fillRect(x,dy>0?y+B:y-3,w,3)})}/* 内がわのかげは3ドットでぼかす */
      c.restore();
      if(gr&&!rd){c.save();if(lat)c.transform(1,k,0,1,0,-k*xi);const hz=n=>hash(a*977+n*131),bl=(x,yy,dx,dy,n)=>{const len=1+hz(n)*1.6,w=.9+hz(n+90)*.8;c.fillStyle=CGR[(hz(n+7)*CGR.length)|0];c.beginPath();c.moveTo(x-dy*w,yy-dx*w);c.lineTo(x+dy*w,yy+dx*w);c.lineTo(x+dx*len,yy+dy*len);c.closePath();c.fill()};
        if(lat){if(sideF[0])for(let v=.8;v<x1-x0;v+=1.3)bl(x0+v,y0+.6,0,-1,(v*10)|0);if(sideF[1])for(let v=.8;v<x1-x0;v+=1.3)bl(x0+v,y1-.6,0,1,((v*10)|0)+1000)}
        else{if(sideF[0])for(let v=.8;v<y1-y0;v+=1.3)bl((vnat?eX(y0+v,0):x0)+.6,y0+v,-1,0,((v*10)|0)+2000);if(sideF[1])for(let v=.8;v<y1-y0;v+=1.3)bl((vnat?eX(y0+v,1):x1)-.6,y0+v,1,0,((v*10)|0)+3000)}c.restore()}/* 草地は、ふちから外へ短い草 */
    }}
  else{
    const band=(x,y0,y1)=>{c.fillStyle=P[1];c.fillRect(x,y0,BW,y1-y0);c.fillStyle='rgba(255,250,235,.3)';c.fillRect(x,y0,1,y1-y0);const ins=x<ax+TS/2?1:-1,ix=ins>0?x+BW:x-1;c.fillStyle=SH1;c.fillRect(ix,y0,1,y1-y0);c.fillStyle=SH2;c.fillRect(ix+ins,y0,1,y1-y0)};/* 側板と、板に接する面（段・坂）のかげ2ドット */
    if(d===0){if(free([a-1]))band(ax,ay-LIFT-2,ay+TS);if(free([a+1]))band(ax+TS-BW,ay-LIFT-2,ay+TS)}
    else if(d===2){if(free([a-1,o-1]))band(ax,ay-TS-2,ay+TS-LIFT);if(free([a+1,o+1]))band(ax+TS-BW,ay-TS-2,ay+TS-LIFT)}
    else{const xi=d===1?ax:ax+TS,xo=d===1?ax+2*TS:ax-TS,zb=f=>LIFT*(1-f)+(SLOPES.has(id)?2:5)/* 階段の側板は、段より5ドット上まで（坂は2） */,poly=pts=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const q of pts)c.lineTo(q[0],q[1]);c.closePath()};
      if(SLOPES.has(id)&&free([a-W,o-W])){poly([[xi,ay-zb(0)],[xo,ay-zb(1)],[xo,ay+BW-zb(1)],[xi,ay+BW-zb(0)]]);c.fillStyle=P[1];c.fill()}/* 階段のおくの側板は、段の前に描いてある */
      if(free([a+W,o+W])){const gy=ay+TS;for(const[k,col]of[[1,SH1],[2,SH2]]){poly([[xi,gy-BW-zb(0)-k],[xo,gy-BW-zb(1)-k],[xo,gy-BW-zb(1)-k+1],[xi,gy-BW-zb(0)-k+1]]);c.fillStyle=col;c.fill()}/* 手前の側板に接する面のかげ2ドット */c.save();poly([[xi,gy-zb(0)],[xo,gy-zb(1)],[xo,gy],[xi,gy]]);c.clip();face(Math.min(xi,xo),gy-LIFT-6,2*TS,LIFT+6,gy);c.restore();poly([[xi,gy-BW-zb(0)],[xo,gy-BW-zb(1)],[xo,gy-zb(1)],[xi,gy-zb(0)]]);c.fillStyle=P[0];c.fill()}}}}/* 側板：段にそわない、まっすぐななめの板 */
  c.restore();if(SLOPES.has(id))slopeFeather(c,a,d);if(lat){for(const k of lat[0])if(hiAt(k)>=CLV)cliffEdgeOver(c,k,1);for(const k of lat[1])if(hiAt(k)>=CLV)cliffEdgeOver(c,k,0)}}/* 左右ががけなら、階段を描いたあとに、がけの横のはし（横の岩・丸いはし）をもう一度上に描く（切りとらない） */
const CLC={n:-1,s:null,rows:null};
function cliffRuns(){if(CLC.n===STATN&&CLC.s===S&&CLC.rows)return CLC.rows;/* 行ごと・段ごとの、つづいた高いマスのかたまり（高さが変わったときだけ作りなおす） */
  const hs=S.hi?Array.from(S.hi,v=>v|0).join(''):'';CLC.n=STATN;STDIRTY=null;if(CLC.rows&&CLC.s===S&&CLC.hs===hs)return CLC.rows;CLC.s=S;CLC.hs=hs;const rows=new Map();
  for(let y=0;y<H;y++)for(let lv=1;lv<=HMAX;lv++){let x=0;while(x<W){if(hiAt(y*W+x)<lv){x++;continue}let e=x;while(e+1<W&&hiAt(y*W+e+1)>=lv)e++;if(!rows.has(y))rows.set(y,[]);rows.get(y).push({x0:x,x1:e,lv});x=e+1}}/* 低い段から順に（高い段は、あとで上に描く） */
  return CLC.rows=rows}
function cliffTop(P,E,y,k,ext){ext=ext||.6;/* 高いマスの上の面の形：ふち（となりが低い向き）は少しでこぼこ、外がわの角は丸く。P：面（ぬる形）、E：ふちの線 */
  const j=y*W+k,px=k*TS,x1=px+TS,y0=y*TS-LIFT,y1=y0+TS,r=5,nz=(a,b)=>(hash(a*131+b*7919+17)-.5)*2;
  const U=!(y>0&&topAt(j-W)),D=!(y<H-1&&topAt(j+W)),L=!(k>0&&topAt(j-1)),R=!(k<W-1&&topAt(j+1));
  const yN=x=>U?y0+.3+nz(x,y*2)*.5:y0-ext,yS=x=>D?y1+1.6+nz(x,y*2+1)*.8:y1+ext,xW=v=>L?px-2+nz(k*2,v)*.4:px-ext,xE=v=>R?x1+2+nz(k*2+1,v)*.4:x1+ext;/* 横のふちは、マスのさかいより少しだけ外（横の岩とのあいだに、下の地面が見えないように） *//* ふちは、マスのさかい（横の岩は、その外にはみ出す） */
  const TL=U&&L,TR=U&&R,BR=false,BL=false,st=[];/* 手前の角は丸めない（下のがけの正面の丸いはしにつづく） */for(let v=0;v<=TS;v+=4)st.push(v);
  const N=st.filter(v=>v>=(TL?r:0)&&v<=TS-(TR?r:0)).map(v=>[px+v,yN(px+v)]),Ea=st.filter(v=>v>=(TR?r:0)&&v<=TS-(BR?r:0)).map(v=>[xE(y0+v),y0+v]),
    So=st.filter(v=>v>=(BL?r:0)&&v<=TS-(BR?r:0)).reverse().map(v=>[px+v,yS(px+v)]),Wd=st.filter(v=>v>=(TL?r:0)&&v<=TS-(BL?r:0)).reverse().map(v=>[xW(y0+v),y0+v]);
  const side=[[N,U,TR,[xE(y0),yN(x1)]],[Ea,R,BR,[xE(y1),yS(x1)]],[So,D,BL,[xW(y1),yS(px)]],[Wd,L,TL,[xW(y0),yN(px)]]];
  P.moveTo(N[0][0],N[0][1]);
  const inner=[!U&&!R&&!(y>0&&k<W-1&&topAt(j-W+1))?[x1,y0]:null,!R&&!D&&!(y<H-1&&k<W-1&&topAt(j+W+1))?[x1,y1]:null,!D&&!L&&!(y<H-1&&k>0&&topAt(j+W-1))?[px,y1]:null,!L&&!U&&!(y>0&&k>0&&topAt(j-W-1))?[px,y0]:null];/* 入隅（となり2つは高く、ななめが低い角）は、外へのばさず、角でまっすぐ折る（となりのマスのふちの帯をけずらないように） */
  side.forEach(([pts,ex,rc,cp],n)=>{for(const p of pts)P.lineTo(p[0],p[1]);const nx=side[(n+1)%4][0][0];if(inner[n])P.lineTo(inner[n][0],inner[n][1]);if(rc)P.quadraticCurveTo(cp[0],cp[1],nx[0],nx[1]);else P.lineTo(nx[0],nx[1]);
    if(ex){E.moveTo(pts[0][0],pts[0][1]);for(const p of pts)E.lineTo(p[0],p[1]);if(rc)E.quadraticCurveTo(cp[0],cp[1],nx[0],nx[1])}});
  P.closePath()}
const CGR=['#567935','#5f8240','#6a8f45','#76994b','#4f6f30'];/* 草のはみ出し：もらった段差の絵のふちの草の明るさの差を、ゲームの草の色にあてた色 */
function cliffRim(g,P,y,k,grass){/* 上の面のふちの帯（もらった段差の絵と同じ：ふちに こい色の帯、内がわは四角いでこぼこ）。草地はこい緑、地面はこい土色 */
  const j=y*W+k,px=k*TS,x1=px+TS,y0=y*TS-LIFT,y1=y0+TS,U=!(y>0&&topAt(j-W)),D=!(y<H-1&&topAt(j+W)),L=!(k>0&&topAt(j-1)),R=!(k<W-1&&topAt(j+1)),hz=n=>hash(j*613+n*97),b=2.2;
  g.save();g.clip(P);g.fillStyle=grass?'rgba(92,134,58,.5)':'rgba(110,78,46,.26)';
  if(U){g.fillRect(px,y0-1,TS,b+1);for(let x=px;x<x1;x+=2.6)if(hz(x)<.55)g.fillRect(x,y0+b,1.8,.8+hz(x+9)*1.3)}
  if(L){g.fillRect(px-1,y0,b+1,TS+2);for(let v=y0;v<y1;v+=2.6)if(hz(v)<.55)g.fillRect(px+b,v,.8+hz(v+9)*1.3,1.8)}
  if(R){g.fillRect(x1-b,y0,b+1,TS+2);for(let v=y0;v<y1;v+=2.6)if(hz(v+500)<.55){const w=.8+hz(v+509)*1.3;g.fillRect(x1-b-w,v,w,1.8)}}
  if(D){g.fillRect(px,y1-1.2,TS,4);for(let x=px;x<x1;x+=2.6)if(hz(x+900)<.55){const h=.8+hz(x+909)*1.3;g.fillRect(x,y1-1.2-h,1.8,h)}}
  g.restore()}
function cliffGrass(g,y,k){/* 草のはみ出し：となりが低い向きのふちに、短い草の葉を外向きに。正面の上は、がけに少したれる */
  const j=y*W+k,px=k*TS,y0=y*TS-LIFT,y1=y0+TS,U=!(y>0&&topAt(j-W)),D=!(y<H-1&&topAt(j+W)),L=!(k>0&&topAt(j-1)),R=!(k<W-1&&topAt(j+1)),hz=n=>hash(j*977+n*131);
  const blade=(x,yy,dx,dy,n)=>{const sh=dy>0,len=sh?2.6+hz(n)*3.4:1+hz(n)*1.6,lean=(hz(n+50)-.5)*(sh?2.6:1.2),w=.9+hz(n+90)*.8;/* 手前は長くたれる・ほかは短く */g.fillStyle=CGR[(hz(n+7)*CGR.length)|0];g.beginPath();g.moveTo(x-dy*w,yy-dx*w);g.lineTo(x+dy*w,yy+dx*w);g.lineTo(x+dx*len+dy*lean,yy+dy*len+dx*lean);g.closePath();g.fill()};
  for(let v=.8;v<TS;v+=1.3){const n=(v*10)|0;
    if(U&&!(L&&v<5)&&!(R&&v>TS-5))blade(px+v,y0+1.2,0,-1,n);
    if(D&&!(L&&v<5)&&!(R&&v>TS-5))blade(px+v,y1+.8,0,1,n+1000);
    if(L&&!(U&&v<5)&&!(D&&v>TS-5))blade(px+.6,y0+v,-1,0,n+2000);
    if(R&&!(U&&v<5)&&!(D&&v>TS-5))blade(px+TS-.6,y0+v,1,0,n+3000)}}
let RFN=0;
const DOTT={};function dotPat(g,K){/* 段差のふちの帯の点々（104ドットごとにくりかえすもよう。1まいだけ作っておく） */let e=DOTT[K];if(!e){const N=40,T=N*2.6;e=DOTT[K]=document.createElement('canvas');e.width=e.height=Math.round(T*K);const c=e.getContext('2d');c.scale(K,K);c.fillStyle='#000';for(let i=0;i<N;i++)for(let j=0;j<N;j++){const q=hash(i*131+j*7919+3);if(q<.5)c.fillRect(i*2.6,j*2.6,1.8,.8+q*2.6)}}const p=g.createPattern(e,'repeat');if(p.setTransform)p.setTransform(new DOMMatrix().scale(1/K));return p}
function softOf(m,b){/* ぼかし（軽い作り方）：小さくして、なめらかに大きくもどす。b：ちぢめる倍率 */const t=TMPC();t.width=Math.max(1,Math.ceil(m.width/b));t.height=Math.max(1,Math.ceil(m.height/b));const c=t.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(m,0,0,t.width,t.height);return t}
const TMPL=[],TMPC=()=>{const c=document.createElement('canvas');TMPL.push(c);return c};/* 作業用のキャンバス：使いおわったら、すぐ手ばなす（iPhone は、キャンバスのメモリの上限が小さく、こえるとページが落ちる） */
function cliffPart0(y,Rn,K,k0,ext,lowC){/* 段差の部品（1マスぶん）の絵を作る：まわりのマスをまねた小さな場所で、そのマスの行のかたまり（両どなり）を描き、まん中のマスの所だけを使う。A：がけ（横の岩・正面）とそのかげ（上の面より下）。B：上の面のふちの帯・かげ・明るさ・はみ出す草（上の面より上）。上の面の地面そのものは、毎コマ、地面の下絵からずらして描く */
  const x0=Rn.x0,x1=Rn.x1,w=(x1-x0+1)*TS,ox=x0*TS-8,top=y*TS-LIFT-6,h=CPH,cv=TMPC();cv.width=(w+16)*K;cv.height=h*K;
  let g=cv.getContext('2d'),T0=[K,0,0,K,-ox*K,-top*K];g.setTransform(...T0);const C=window.CHIPS||{},dc=(k,px,py)=>{const ch=C[k];if(ch)drawChip(g,ch,'cliff',px,py,0)};
  const fc=TMPC();fc.width=cv.width;fc.height=cv.height;const f=fc.getContext('2d');f.setTransform(...T0);let miss=false;const fd=(k,px,py)=>{const ch=C[k];if(ch&&!drawChip(f,ch,'cliff',px,py,0))miss=true};/* がけ（階段・横の岩・正面）は、いったん別のキャンバスに描いて、その形でかげを作る。絵がまだ読みこみ中なら miss */
  for(let k=x0;k<=x1;k++){const j=y*W+k,L=k>0&&topAt(j-1),R=k<W-1&&topAt(j+1),D=y<H-1&&topAt(j+W),px=k*TS,py=y*TS;
    {const U=y>0&&topAt(j-W);if(!L||!R){f.save();f.beginPath();f.rect(px-8,py-LIFT+(U?0:5),TS+16,TS);f.clip();{const dz=REV.has(j)?'':'~d';if(!L)fd('cliff:sideL'+dz,px,py);if(!R)fd('cliff:sideR'+dz,px,py)}/* 上が乾いた地面なら、ふちに草のない横の岩 */f.restore()}/* 横の岩（マスの外へはみ出す。上の角の丸みより下から） */}
    if(!D){const fk='cliff:'+(!L&&!R?'faceLR':!L?'faceL':!R?'faceR':'face');if(ext)fd(fk,px,py+8);/* 下にもう1だんがけがつづくときは、岩を下へのばして、すきまをうめる */fd(fk,px,py)}}
  {const sc=TMPC();sc.width=fc.width;sc.height=fc.height;const c=sc.getContext('2d');c.drawImage(fc,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#000';c.fillRect(0,0,sc.width,sc.height);g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=.3;g.imageSmoothingEnabled=true;g.drawImage(softOf(sc,Math.round(4*K)),0,3*K,sc.width,sc.height);g.restore()}/* がけのかげ：がけの形を、下へ3ドットずらしてぼかす（filter の blur は重いので、小さくして大きくもどす softOf） */
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(fc,0,0);g.restore();


  const A=g;const bc=TMPC();bc.width=cv.width;bc.height=cv.height;g=bc.getContext('2d');g.setTransform(...T0);
  const P=new Path2D(),E=new Path2D();for(let k=x0;k<=x1;k++)cliffTop(P,E,y,k);
  {const px=k0*TS,y0=y*TS-LIFT,j0=y*W+k0,oL=!topAt(j0-1),oR=!topAt(j0+1),oD=!topAt(j0+W);g.save();g.beginPath();g.rect(px-(oL?2:0),y0,TS+(oL?2:0)+(oR?2:0),TS+(oD?2:0));g.clip();const q=TMPC();q.width=cv.width;q.height=cv.height;const c=q.getContext('2d');c.setTransform(...T0);c.fillStyle=lowC;c.fillRect(px-2,y0,TS+4,TS+2);c.globalCompositeOperation='destination-out';c.fill(P);g.setTransform(1,0,0,1,0,0);g.drawImage(q,0,0);g.restore()}
  {const px=k0*TS,y0=y*TS-LIFT,j0=y*W+k0;g.save();g.clip(P);g.fillStyle=lowC;if(!topAt(j0-1))g.fillRect(px-3,y0,3,TS);if(!topAt(j0+1))g.fillRect(px+TS,y0,3,TS);if(!topAt(j0+W))g.fillRect(px-3,y0+TS,TS+6,3);g.restore()}/* ふちのはみ出し（上の面の形の、マスの外の所）は、上の面の地面の色でぬる（毎コマ、はしの1ドットをのばして描かなくてよいように） *//* 上の面の外（丸い角・でこぼこの外）は、下の低い地面の色（上の面の地面は四角く描くので、そこをかくす） */
  {/* ふちの帯とかげは、上の面ぜんたいの形から作る（マスごとに描くと、角・内がわの角で形がずれる） */
    const mk=f2=>{const m=TMPC();m.width=cv.width;m.height=cv.height;const c=m.getContext('2d');c.setTransform(...T0);f2(c);c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';return m},er=(m,r)=>{const e=TMPC();e.width=m.width;e.height=m.height;const c=e.getContext('2d');c.drawImage(m,0,0);c.globalCompositeOperation='destination-in';for(let a=0;a<8;a++)c.drawImage(m,Math.round(Math.cos(a*Math.PI/4)*r),Math.round(Math.sin(a*Math.PI/4)*r));return e};
    const Pm=new Path2D(),Em=new Path2D();for(let k=x0;k<=x1;k++)cliffTop(Pm,Em,y,k,9);/* つながっている向きは、外へ大きくのばす（そこに帯ができないように） */
    const M=mk(c=>{c.fillStyle='#000';c.fill(Pm);});
    const E1=er(M,2.2*K),E2=er(M,3.8*K);
    const B=mk(c=>{c.fillStyle=dotPat(c,K);for(let k=x0;k<=x1;k++){if(!REV.has(y*W+k))continue;/* 乾いた地面のふちには、点々を出さない */const a=k===x0?ox:k*TS,b=k===x1?ox+w+16:(k+1)*TS;c.fillRect(a,top,b-a,h)}});/* 帯の内がわの、四角いでこぼこ（草地だけ）。点々は、前もって作ったもよう（世界の座標でしきつめる） */
    const band=mk(c=>{});{const c=band.getContext('2d');c.drawImage(E1,0,0);c.globalCompositeOperation='destination-out';c.drawImage(E2,0,0);c.globalCompositeOperation='destination-in';c.drawImage(B,0,0)}
    const col=mk(c=>{for(let k=x0;k<=x1;k++){c.fillStyle=REV.has(y*W+k)?'rgba(92,134,58,.5)':'rgba(110,78,46,.26)';c.fillRect(k*TS-(k===x0?8:0),top,TS+(k===x0?8:0)+(k===x1?8:0),h)}});
    const rim=mk(c=>{});{const c=rim.getContext('2d');c.drawImage(M,0,0);c.globalCompositeOperation='destination-out';c.drawImage(E1,0,0);c.globalCompositeOperation='source-over';c.drawImage(band,0,0);c.globalCompositeOperation='source-in';c.drawImage(col,0,0)}
    const sh=mk(c=>{});{const c=sh.getContext('2d');c.drawImage(M,0,0);c.globalCompositeOperation='source-in';c.fillStyle='rgba(45,35,20,.16)';c.fillRect(0,0,sh.width,sh.height);c.globalCompositeOperation='destination-out';c.drawImage(softOf(E1,Math.round(4.8*K)),0,0,E1.width,E1.height)}
    g.save();g.clip(P);g.setTransform(1,0,0,1,0,0);g.drawImage(sh,0,0);g.drawImage(rim,0,0);g.restore()}/* ふちに向かって少し暗くなる丸み（ぼかし）と、ふちの帯 */
  if(Rn.gb)for(let k=x0;k<=x1;k++)cliffGrass(g,y,k);/* もっと高いマスの草は、この段のふちには出さない（上の段の草が、がけのとちゅうにたれないように） *//* 上が草地なら、ふちから草がはみ出す（手前は、がけにたれる） */
  return {a:cv,b:bc,miss}}
let CPRE=null;const cliffChipsOK=()=>{const C=window.CHIPS||{};return ['cliff:face','cliff:faceL','cliff:faceR','cliff:faceLR','cliff:sideL','cliff:sideR'].every(k=>!C[k]||chipImgs(C[k],'cliff')[0].ok)};/* 段差の部品を先に作るのは、がけの絵が読みこまれてから */
const CPH=TS+LIFT+22,CPART=new Map();/* 段差の部品の絵（1マスぶん）。組み合わせと細かさ（大きく見るとき2倍・ちぢめたとき1倍）ごとに、はじめて使うときに1回だけ作って、とっておく（作りなおさない） */
let GLOD=false,CLOW=null;function cliffLowC(g){/* 地面の色のならし（草地・乾いた地面）：上の面の丸い角の外・ふちのはみ出しにぬる。地面の下絵から1回だけはかる */if(!CLOW||CLOW.s!==S){CLOW={s:S,c:{}};const t=document.createElement('canvas');t.width=t.height=1;const c=t.getContext('2d',{willReadFrequently:true});for(const gg of [1,0]){let r=0,gr=0,b=0,n=0;for(let i=0;i<4000&&n<40;i++){const j=(Math.random()*W*H)|0;if(S.ground[j]!==0||S.floor[j]||S.obj[j]||hiAt(j)||REV.has(j)!==!!gg)continue;const q=GRD.c.get((((j/W)|0)>>4)*64+((j%W)>>4));if(!q||!q.l)continue;/* できている区画（半分の絵）だけから */c.clearRect(0,0,1,1);gblit(c,(j%W)*TS,((j/W)|0)*TS,TS,TS,0,0,1,1,true);const d=c.getImageData(0,0,1,1).data;r+=d[0];gr+=d[1];b+=d[2];n++}CLOW.c[gg]=n?`rgb(${r/n|0},${gr/n|0},${b/n|0})`:(gg?'#8fb15a':'#b3a37c')}t.width=t.height=0}return CLOW.c[g?1:0]}
function cliffKey(k,y,lv){/* マスの段差の部品の組み合わせ：上下左右（低い＝ふちがある）・ななめ（となりの高いマスのつながり）・下へもう1だん・草地・草のはみ出し・2しゅるいのばらつき */const j=y*W+k,h=(dx,dy)=>{const x=k+dx,yy=y+dy;return x>=0&&yy>=0&&x<W&&yy<H&&hiAt(yy*W+x)>=lv};
  const oU=!h(0,-1),oD=!h(0,1),oL=!h(-1,0),oR=!h(1,0),tl=!oL&&h(-1,-1),tr=!oR&&h(1,-1),bl=!oL&&h(-1,1),br=!oR&&h(1,1),ext=oD&&lv>1&&y<H-1&&hiAt(j+W)<lv-1,g=REV.has(j),gb=g&&hiAt(j)===lv;
  return (oU?1:0)|(oD?2:0)|(oL?4:0)|(oR?8:0)|(tl?16:0)|(tr?32:0)|(bl?64:0)|(br?128:0)|(ext?256:0)|(g?512:0)|(gb?1024:0)|((hash(j*7+3)*2|0)<<11)}
const ATL={p:[],x:0,y:0,h:0};/* 段差の部品のアトラス：1024×1024 の大きな絵に、部品をならべて入れる（小さな絵をたくさん持たない。描くときは、大きな絵の一部を描く） */
function atlasPut(w,h){let P=ATL.p[ATL.p.length-1];if(P&&ATL.x+w>1024){ATL.x=0;ATL.y+=ATL.h+1;ATL.h=0}if(!P||ATL.y+h>1024){const c=document.createElement('canvas');c.width=c.height=1024;P={c,g:c.getContext('2d')};ATL.p.push(P);ATL.x=ATL.y=ATL.h=0}const r={c:P.c,g:P.g,x:ATL.x,y:ATL.y};ATL.x+=w+1;ATL.h=Math.max(ATL.h,h);return r}
function atlasClear(){for(const P of ATL.p)P.c.width=P.c.height=0;ATL.p=[];ATL.x=ATL.y=ATL.h=0}
function cliffPart(key,K){if(CPART.s!==S){CPART.clear();atlasClear();CPART.s=S}/* ステージ（セーブ）がかわったら、部品を作りなおす（地面の色がちがう） */const ck=key*4+K;let P=CPART.get(ck);if(P&&!(P.miss&&performance.now()-P.t>300))return P;/* 絵が読みこみ中で作れなかった部品は、0.3秒ごとに作りなおす */
  const oU=key&1,oD=key&2,oL=key&4,oR=key&8,bit=(n)=>!!(key&n),k0=20,y0=20+((key>>11)&1)*3,cv=CLV,R0=REV;
  const hi=(dx,dy)=>{if(!dx&&!dy)return true;const sx=dx<0?-1:dx>0?1:0;if(dy===0)return sx<0?!oL:!oR;if(dy===-1)return sx===0?!oU:sx<0?bit(16):bit(32);if(dy===1)return sx===0?!oD:sx<0?bit(64):bit(128);return false};/* 2マス先は、となりと同じとみる */
  TOPF=j=>hi(j%W-k0,((j/W)|0)-y0);REV={has:()=>!!(key&512)};CLV=1;
  try{const r=cliffPart0(y0,{x0:oL?k0:k0-1,x1:oR?k0:k0+1,gb:!!(key&1024)},K,k0,!!(key&256),cliffLowC(key&512)),sx=((oL?k0:k0-1)*TS-8),cx=(k0*TS-8-sx)*K,w=(TS+16)*K,h=CPH*K;
    const cut=src=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,cx,0,w,h,0,0,w,h);const d=g.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy}c.width=c.height=0;if(x1<0)return null;const bw=x1-x0+1,bh=y1-y0+1,A=atlasPut(bw,bh);A.g.drawImage(src,cx+x0,y0,bw,bh,A.x,A.y,bw,bh);return {c:A.c,sx:A.x,sy:A.y,x:x0/K,y:y0/K,w:bw/K,h:bh/K}};/* 描いてある所だけに切りつめて、アトラス（大きな絵）に入れる */P={a:cut(r.a),b:cut(r.b),miss:r.miss}}/* 何も描かれていない部品は null（描かない） */
  finally{TOPF=null;REV=R0;CLV=cv;for(const c of TMPL)c.width=c.height=0;TMPL.length=0}
  P.t=performance.now();CPART.set(ck,P);return P}
function cliffPreload(){/* ステージを開くとき：このマップで使う段差の部品を、まとめて作っておく（はじめて見る所で止まらないように） */const RW=cliffRuns(),keys=new Set();for(const[y,L]of RW)for(const R of L)for(let k=R.x0;k<=R.x1;k++)keys.add(cliffKey(k,y,R.lv));for(const K of [2,1])for(const k of keys)cliffPart(k,K)}
function cliffRow(y,R,top){/* 1つのかたまり（行・段）の段差を描く：かげ・がけ（部品A）→ 上の面の地面（地面の下絵をずらす）→ ふち（部品B）。top：うしろが低い所の、上はしだけ（うしろの物の足もとをかくす） */
  const lv=R.lv,dy=(lv-1)*LIFT,oy=y*TS-LIFT-6-dy,keys=[],kz=dpr*cam.z,SX=v=>cam.x+Math.round((v-cam.x)*kz)/kz,SY=v=>cam.y+Math.round((v-cam.y)*kz)/kz,DI=(im,sx,sy,sw,sh,x,y2,w,h)=>{const a=SX(x),b=SY(y2);ctx.drawImage(im,sx,sy,sw,sh,a,b,SX(x+w)-a,SY(y2+h)-b)};/* 部品は、画面のドットのさかいに合わせておく（マスのさかいめに、うすい線やすきまが出ないように） */for(let k=R.x0;k<=R.x1;k++)keys.push(cliffKey(k,y,lv));
  const hh=top?LIFT+6:CPH,ok=k=>!top||!(y>0&&hiAt((y-1)*W+k)>=lv);
  if(!top){const m=i=>(keys[i]&2)&&!(keys[i]&256);let i=0;while(i<keys.length){if(!m(i)){i++;continue}let e=i;while(e+1<keys.length&&m(e+1))e++;const px=(R.x0+i)*TS,w=(e-i+1)*TS,py=y*TS;ctx.save();ctx.translate(0,2*(py+TS)-dy);ctx.scale(1,-1);gblit(ctx,px-6,py+TS,w+12,8,px-6,py+TS,w+12,8,GLOD);ctx.restore();i=e+1}}/* がけの下はしのすきまには、すぐ下の低い地面（下絵を上下に鏡うつし。つづいた所はまとめて1回） */
  const PK=kz>1.5?2:1,part=(L)=>{for(let i=0;i<keys.length;i++){const kk=keys[i],k=R.x0+i;if(!(kk&15)&&L==='a')continue;if(!ok(k))continue;const q=cliffPart(kk,PK)[L];if(!q)continue;const a=Math.max(q.x,(kk&4)?0:8),b=Math.min(q.x+q.w,(kk&8)?TS+16:TS+8),y2=Math.min(q.y+q.h,hh);if(b<=a||y2<=q.y)continue;DI(q.c,q.sx+(a-q.x)*PK,q.sy,(b-a)*PK,(y2-q.y)*PK,k*TS-8+a,oy+q.y,b-a,y2-q.y)}};
  part('a');
  {let k=R.x0;while(k<=R.x1){if(!ok(k)){k++;continue}let e=k;while(e+1<=R.x1&&ok(e+1))e++;const w=(e-k+1)*TS;{const a=SX(k*TS),b=SY(y*TS-lv*LIFT);gblit(ctx,k*TS,y*TS,w,top?LIFT:TS,a,b,SX(k*TS+w)-a,SY(y*TS-lv*LIFT+(top?LIFT:TS))-b,GLOD)}{ctx.fillStyle='rgba(255,250,225,.10)';const a=SX(k*TS),b=SY(y*TS-lv*LIFT);ctx.fillRect(a,b,SX(k*TS+w)-a,SY(y*TS-lv*LIFT+(top?LIFT:TS))-b)}k=e+1}}/* 上の面の地面：地面の下絵を、そのまま上へずらす。高い所は少し明るく */
  part('b')}
const natBarY=j=>((j/W)|0)*TS-(S.obj[j]==='rock'?7:30)-hiAt(j)*LIFT;/* 木・岩の上の、のこりのバーの上はし */
function render(now){RFN++;
  if(dirty)rebuildStatic(STATICFULL);
  if(GRD.pre!==S&&!GRD.busy&&groundChipsOK()&&(WD===1||waterChipsOK())&&cliffChipsOK()){GRD.busy=true;const ld=stageLoading(true),me=S;setTimeout(()=>{try{if(S===me)stagePreload()}finally{GRD.busy=false;stageLoading(false)}},40)}/* ステージを開いたら、マップ全体を先に作っておく（ゲーム中に作らない） */
  if(S.hi&&CPRE!==S&&cliffChipsOK()){CPRE=S;cliffPreload()}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#8f8262';ctx.fillRect(0,0,cv.width,cv.height);
  const k=dpr*cam.z;
  ctx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);
  {GLOD=k<1.2;GRD.bt=0;if(GRD.s!==S)gclear();const fresh=!GRD.any;let built=0;/* 地面の下絵：見えている区画をならべる（ちぢめたときは半分の細かさ）。区画を作るのは1コマ GBUD ミリ秒まで（少なくとも1こ。はじめのコマは、見えている分をぜんぶ） */
    const SXg=v=>cam.x+Math.round((v-cam.x)*k)/k,SYg=v=>cam.y+Math.round((v-cam.y)*k)/k,cx0=Math.max(0,Math.floor(cam.x/GPX)),cy0=Math.max(0,Math.floor(cam.y/GPX)),cx1=Math.min((W-1)>>4,Math.floor((cam.x+VW/cam.z)/GPX)),cy1=Math.min((H-1)>>4,Math.floor((cam.y+VH/cam.z)/GPX));
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const q=gq(cx,cy),need=GLOD?(!q.l||q.st):(!q.f||q.st);if(need&&(fresh||built===0||GRD.bt<GBUD)){gbuild(cx,cy,q);built++}q.u=RFN;const im=GLOD?q.l:(q.f||q.l);if(!im)continue;/* まだ作っていない区画は、地面の色のまま（つぎのコマで作る） */
      const ox=cx*GPX,oy=cy*GPX,w=Math.min(GPX,W*TS-ox),h=Math.min(GPX,H*TS-oy),a=SXg(ox),b=SYg(oy);ctx.drawImage(im,a,b,SXg(ox+w)-a,SYg(oy+h)-b)}GRD.any=true}/* 区画は、画面のドットのさかいに合わせておく（さかいめに線が出ないように） */
  const x0=Math.max(0,Math.floor(cam.x/TS)-1),y0=Math.max(0,Math.floor(cam.y/TS)-2),x1=Math.min(W,Math.ceil((cam.x+VW/cam.z)/TS)+1),y1=Math.min(H,Math.ceil((cam.y+VH/cam.z)/TS)+2);
  waterShimmer(now,x0,y0,x1,y1);drawFords(x0,y0,x1,y1);drawRugsLive(x0,y0,x1,y1);
  for(const[j,t0]of pops){const a=1-(now-t0)/350;if(a<=0){pops.delete(j);continue}ctx.fillStyle='rgba(255,255,240,'+a*.6+')';const s=4*(1-a);rr(ctx,(j%W)*TS-s,((j/W)|0)*TS-s,TS+s*2,TS+s*2,6)}
  for(const d of S.drops||[]){const dz=hiAt(d.y*W+d.x)*LIFT,cx=d.x*TS+16,cy=d.y*TS+19-dz,tw=Math.sin(now/260+d.x*1.7)*.5+.5;
    if(d.id==='mat:eda'||d.id==='mat:can'){const ch=window.CHIPS&&CHIPS['drop:'+d.id.slice(4)];if(ch&&drawChip(ctx,ch,d.id,d.x*TS,d.y*TS-dz,0))continue;ctx.fillStyle='rgba(40,25,10,.18)';ctx.beginPath();ctx.ellipse(cx,cy+8,7,2.2,0,0,7);ctx.fill();drawMatIc(ctx,d.id.slice(4),cx,cy+2,18);continue}/* 枝・空き缶の落とし物 */
    if(d.id==='mebuki'){const fy=cy-4+Math.sin(now/380)*2;/* めぶきのしずく：若葉をのせた緑のしずく */
      ctx.fillStyle='rgba(40,25,10,.18)';ctx.beginPath();ctx.ellipse(cx,cy+8,6,2.2,0,0,7);ctx.fill();
      ctx.fillStyle='rgba(170,255,190,'+(.2+tw*.2)+')';ctx.beginPath();ctx.arc(cx,fy,12+tw*3,0,7);ctx.fill();
      ctx.fillStyle='#5fd88a';ctx.beginPath();ctx.moveTo(cx,fy-10);ctx.quadraticCurveTo(cx+8,fy+1,cx+6,fy+5);ctx.arc(cx,fy+4,6,0,Math.PI);ctx.quadraticCurveTo(cx-8,fy+1,cx,fy-10);ctx.fill();
      ctx.fillStyle='#d9ffe4';ctx.beginPath();ctx.ellipse(cx-2,fy+2,1.8,3,.3,0,7);ctx.fill();
      ctx.fillStyle='#3fa35a';ctx.beginPath();ctx.ellipse(cx+3,fy-10,4,1.8,-.6,0,7);ctx.fill();continue}
    if(d.id==='shard'){const fy=cy-4+Math.sin(now/400)*2;/* ヌシのかけら：ういている光る石 */
      ctx.fillStyle='rgba(40,25,10,.18)';ctx.beginPath();ctx.ellipse(cx,cy+8,7,2.5,0,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,240,170,'+(.18+tw*.2)+')';ctx.beginPath();ctx.arc(cx,fy,13+tw*3,0,7);ctx.fill();
      ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.moveTo(cx,fy-11);ctx.lineTo(cx+7,fy-1);ctx.lineTo(cx,fy+10);ctx.lineTo(cx-7,fy-1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff8d8';ctx.beginPath();ctx.moveTo(cx,fy-11);ctx.lineTo(cx+3,fy-1);ctx.lineTo(cx,fy+10);ctx.lineTo(cx-2,fy-1);ctx.closePath();ctx.fill();continue}
    if(d.lt){const mk=d.id.slice(4),im=mk==='bamboo'&&ICI.bamboo&&ICI.bamboo.ok?ICI.bamboo:emoImg(mk==='stone'?'🪨':mk==='bamboo'?'🎋':'🪵')||hudIc('matN'),ih=20;/* 落ちた物のアイコン：木材・石材・竹（素材箱のアイコンにしない） */let ix=cx,iy=cy,sh=1,rot=0;const fx0=DROPFX.get(d);if(fx0){const e=(now-fx0.t0)/700;if(e>=1)DROPFX.delete(d);else{/* とびだして弧をえがき、地面で小さくはねる */const f=Math.min(1,e/.7),hop=e<.7?Math.sin(f*Math.PI)*26:Math.sin((e-.7)/.3*Math.PI)*5;ix=fx0.sx+(cx-fx0.sx)*f;iy=fx0.sy+(cy-fx0.sy)*f-hop;sh=.5+.5*f;rot=(1-f)*Math.PI*1.5}}
      ctx.fillStyle='rgba(40,25,10,'+(.18*sh)+')';ctx.beginPath();ctx.ellipse(ix,cy+6,9*sh,2.7*sh,0,0,7);ctx.fill();if(im&&im.complete&&im.naturalWidth){const iw=ih*im.naturalWidth/im.naturalHeight;if(rot){ctx.save();ctx.translate(ix,iy-1);ctx.rotate(rot);ctx.drawImage(im,Math.round(-iw/2),Math.round(-ih/2),iw,ih);ctx.restore()}else ctx.drawImage(im,Math.round(ix-iw/2),Math.round(iy-ih/2-1),iw,ih)}continue}/* 守りの光で落とした木材・石材：上の木材・石材と同じアイコン */
    if(d.id==='sand'){const ch=window.CHIPS&&CHIPS.sand;if(ch&&drawChip(ctx,ch,'sand',d.x*TS,d.y*TS,now))continue}/* やすらぎの砂：もらった絵 */
    /* 小さなふくろ */
    ctx.fillStyle='rgba(40,25,10,.22)';ctx.beginPath();ctx.ellipse(cx,cy+8,9,3,0,0,7);ctx.fill();
    ctx.fillStyle='#b5854e';ctx.beginPath();ctx.ellipse(cx,cy+1,8.5,7.5,0,0,7);ctx.fill();ctx.fillStyle='#c99a60';ctx.beginPath();ctx.ellipse(cx-2.5,cy-1,3.5,3,0,0,7);ctx.fill();
    ctx.fillStyle='#a07240';rr(ctx,cx-4,cy-10,8,5,2);ctx.fillStyle='#6b4524';ctx.fillRect(cx-5,cy-6,10,2);
    ctx.fillStyle='rgba(255,245,170,'+(.4+tw*.6)+')';const sx=cx+7,sy=cy-10,sr=2+tw*2.5;ctx.beginPath();for(let a=0;a<8;a++){const r2=a%2?sr*.35:sr,an=a*Math.PI/4;ctx.lineTo(sx+Math.cos(an)*r2,sy+Math.sin(an)*r2)}ctx.fill()}
  for(const s of S.seeds){const tw=Math.sin(now/250+s.x)*.5+.5;ctx.fillStyle='rgba(255,240,150,'+(.5+tw*.5)+')';const cx=s.x*TS+16,cy=s.y*TS+16-hiAt(s.y*W+s.x)*LIFT;ctx.beginPath();for(let a=0;a<8;a++){const r2=a%2?3:9+tw*2,an=a*Math.PI/4+now/900;ctx.lineTo(cx+Math.cos(an)*r2,cy+Math.sin(an)*r2)}ctx.fill();circ(ctx,cx,cy,3,'#fff')}
  drawHeat(now);drawRanges(now);
  if(mode==='build'&&sel&&BL[sel]&&!selRect&&!pending){const k=sel+'|'+S.placed[sel]+'|'+x0+','+y0+','+x1+','+y1;if(BADC.k!==k||now-BADC.t>600){BADC.k=k;BADC.t=now;BADC.L=[];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(!canPlace(sel,x,y,true))BADC.L.push(y*W+x)}/* 画面に見えている所だけ */
    ctx.fillStyle='rgba(255,90,90,.16)';for(const j of BADC.L)ctx.fillRect((j%W)*TS,((j/W)|0)*TS,TS,TS)}/* 置くものをえらんでいるときは、置けないマスをうすい赤で */
  if(mode==='bulk'&&selStamp==='move'&&MOVESRC){const m=MOVESRC,o=m.k==='obj'?S.obj[m.j]:null,L=o?fp(o,m.j%W,(m.j/W)|0).map(([x,y])=>y*W+x):rugCells(m.j);ctx.save();ctx.fillStyle='rgba(255,220,90,.32)';ctx.strokeStyle='rgba(255,200,60,.9)';ctx.lineWidth=2;for(const j of L){const z=hiAt(j)*LIFT;ctx.fillRect((j%W)*TS,((j/W)|0)*TS-z,TS,TS);ctx.strokeRect((j%W)*TS+1,((j/W)|0)*TS-z+1,TS-2,TS-2)}ctx.restore()}/* ひっこしミトンでえらんだ物を、黄色でしめす */
  if(selRect){const P=pending&&(pending.kind==='bulk'||pending.kind==='plant')?new Set(pending.cells.map(([x,y])=>y*W+x)):null;/* 「おく」を待っているときは、ほんとうにぬるマスだけを黄色に */for(const[x,y]of rectCells(selRect.a,selRect.b)){ctx.fillStyle=(P?P.has(y*W+x):canPlace(sel,x,y,true))?'rgba(255,220,90,.35)':'rgba(255,90,90,.3)';ctx.fillRect(x*TS,y*TS,TS,TS)}}
  if(pending&&pending.kind==='one'){const z=szR(pending.id,PLROTS[pending.id]||0)||[1,1],px=pending.x*TS,py=pending.y*TS;ctx.fillStyle=pending.ok?'rgba(255,220,90,.3)':'rgba(255,90,90,.35)';const TP=pending.id==='statue'?[[-1,0,'obox'],[0,0,'statue'],[1,0,'board'],[0,1,'altar']]:[[0,0,pending.id]];if(TP.length>1)for(const[dx,dy]of TP)ctx.fillRect(px+dx*TS,py+dy*TS,TS,TS);else ctx.fillRect(px,py,z[0]*TS,z[1]*TS);
    ctx.strokeStyle=pending.ok?'rgba(255,230,120,.95)':'rgba(255,110,110,.95)';ctx.lineWidth=2;ctx.setLineDash([5,4]);if(TP.length>1)for(const[dx,dy]of TP)ctx.strokeRect(px+dx*TS+1,py+dy*TS+1,TS-2,TS-2);else ctx.strokeRect(px+1,py+1,z[0]*TS-2,z[1]*TS-2);ctx.setLineDash([])}
  if(pending&&pending.kind==='stamp'){for(const[dx,dy]of STAMPS[pending.sid].cells){ctx.fillStyle='rgba(255,220,90,.4)';ctx.fillRect((pending.x+dx)*TS,(pending.y+dy)*TS,TS,TS)}}
  if(pending&&pending.kind==='swap'){ctx.fillStyle='rgba(255,220,90,.4)';for(const j of pending.cells)ctx.fillRect((j%W)*TS,((j/W)|0)*TS,TS,TS)}/* つけかえる所 */
  if(S.broken)for(const b of S.broken){if(S.obj[b.j])continue;const bx=(b.j%W)*TS,by=((b.j/W)|0)*TS,bz=(BL[b.id]&&BL[b.id].sz)||[1,1];ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(255,230,180,.55)';ctx.lineWidth=2;ctx.strokeRect(bx+3,by+3,bz[0]*TS-6,bz[1]*TS-6);ctx.restore()}/* こわれた見張り台は、4マスぶんの枠 */
  const vis=o=>o.x>x0-2&&o.x<x1+2&&o.y>y0-1&&o.y<y1+3;// 画面外は描かない
  // ---- 奥行きの順に描く（足もとのY座標が小さい＝奥から）----
  // せいれい・敵・置いてある物・屋根を、ぜんぶ足もとの順に描く
  const D=[];BUBQ=[];const bubs=BUBQ;
  const add=(k,t,box,draw,own)=>D.push({k,t,box,draw,own});
  for(const r of S.res)if(vis(r)){const px=r.x*TS,fy=r.y*TS,onB=r.act&&r.act.type==='rest'&&r.act.stage==='do'&&BENCHES.has(S.obj[r.act.obj]),onAl=STATUE>=0&&(r.y|0)*W+(r.x|0)===STATUE+W;/* ベンチにすわっている子は、ベンチの背もたれより手前（縦のベンチは2マスめより手前）。神殿の台座の上にいる子は、台座より手前 */const rj=(r.y|0)*W+(r.x|0),inJ=BEDSET.has(typeAt(rj))?anc(rj):r.act&&r.act.stage==='do'?(r.act.type==='sleep'&&BEDSET.has(S.obj[r.act.obj])?r.act.obj:r.act.type==='bathe'&&r.act.tub!=null?r.act.tub:-1):-1,inO=inJ>=0?S.obj[anc(inJ)]:null;/* ベッドの上にいる子（寝る子も、歩いている子も）・バスタブに入る子は、その家具より手前 */const inDr=HOME_DOORS.has(typeAt((r.y|0)*W+(r.x|0)))||GATE_IDS.has(typeAt((r.y|0)*W+(r.x|0)))||SEATS.includes(typeAt((r.y|0)*W+(r.x|0)));/* いすにすわる子も、いすより手前 *//* ドアのマスを通る子は、ドアより手前 */add(toyR(r)?toyPose(r,now).z:inO&&BL[inO]?objectDepth(inO,anc(inJ))+.02:onB?((r.act.obj/W)|0)+(rotAt(r.act.obj)%2===1?2.05:1.05):onAl?((STATUE/W)|0)+2.03:inDr?(r.y|0)+1.02:rDepth(r),2,[px-22,fy-64,px+22,fy+13],()=>liftDraw(uLift(r),()=>drawRes(r,now)),(r.y|0)*W+(r.x|0))}
  if(EVAP.length){EVAP=EVAP.filter(it=>now-it.t0<(it.dur||1800)+600);for(const it of EVAP){const e=it.e,z=EN[e.type].size||1,px=e.x*TS,fy=e.y*TS;add(e.y,2,[px-30*z,fy-110*z,px+30*z,fy+15],()=>liftDraw(uLift(it.e),()=>drawEvap(it,now)),(e.y|0)*W+(e.x|0))}}
  for(const e of S.enemies)if(vis(e)&&!(e.dead&&EVAP.some(it=>it.e===e))){/* 消えていく途中のコワイノは、消える演出だけを描く */const s=EN[e.type].size||1,px=e.x*TS,fy=e.y*TS;add(e.y,2,[px-24*s,fy-56*s-10,px+24*s,fy+15],()=>liftDraw(uLift(e),()=>drawEnemy(e,now)),(e.y|0)*W+(e.x|0))}
  if(godHere()){const GX=godX(),GY=godY(),px=GX*TS,py=GY*TS,onA=STATUE>=0&&S.obj[STATUE+W]==='altar',gk=onA?((STATUE/W)|0)+1.02:GY+.5,gt=onA?1.5:2;add(gk,gt,/* 神殿の柱とおそなえ箱より手前 */[px-36,py-64,px+36,py+24],()=>drawGod(now),(GY|0)*W+(GX|0));}
  if(festOn())for(const st of festStalls()){const px=(st.x+.5)*TS,py=(st.y+.5)*TS-4;if(!vis({x:st.x+.5,y:st.y+.5}))continue;add(st.y+.3,2,[px-48,py-100,px+48,py+26],()=>drawYatai(px,py,0,now,st),-1);add(st.y+.75,2,[px-48,py-100,px+48,py+26],()=>drawYatai(px,py,1,now,st),-1)}/* せいれいの屋台（屋根は店番のうしろ、台は前） */
  if(S.nushi){const n=S.nushi,px=n.x*TS,py=n.y*TS;add(n.y+.2,2,[px-100,py-150,px+100,py+20],()=>drawNushi(now),-1)}
  for(let y=Math.max(0,y0-2);y<Math.min(H,y1+4);y++)for(let x=Math.max(0,x0-4);x<x1;x++){const i=y*W+x,o=S.obj[i];if(!o||o==='part'||!BL[o]||S.ground[i]===1&&o!=='lotus'&&o!=='sprout'&&o!=='bridge'||(FLAT.has(o)||BL[o].floor)&&!(BL[o].dyn||BL[o].anim||TREES.has(o)))continue;/* 立っている物は、動く物も動かない物も、毎コマ足もとの順に描く */
    if(o==='door'||o==='yozoradoor')add((i/W|0)+.01,0,null,()=>{ctx._doorBack=1;drawObj(ctx,o,x*TS,y*TS-hiAt(i)*LIFT,i);ctx._doorBack=0},i);/* ドアの奥の面 */
    add(objectDepth(o,i),BL[o].kind==='block'?0:1,null,()=>sideClip(i,()=>drawObj(ctx,o,x*TS,y*TS-hiAt(i)*LIFT,i,S.dyn[i]?(S.dyn[i].g!=null?S.dyn[i].g:S.dyn[i].p):0,now)),i)}
  for(const k in S.roof||{}){const j=+k,x=j%W,y=(j/W)|0,id=S.roof[k];if(!vis({x:x+1,y:y+1}))continue;add(y+2.001,3,[x*TS-8,y*TS-44,x*TS+72,y*TS+70],()=>drawRoofItem(ctx,id,x*TS,y*TS-hiAt(j)*LIFT),j);{const bk=window.CHIPS&&CHIPS[id+':back'];if(bk)add(y,0,[x*TS-8,y*TS-44,x*TS+72,y*TS+70],()=>drawChip(ctx,bk,id,x*TS,y*TS-hiAt(j)*LIFT,0),j)}}/* うしろの柱は、その行のはじめ（せいれいや家具より下） *//* ガゼボ・東屋：家の屋根と同じ（2マスめの行のすぐ後）。下に置いた物より上 */
  if(WD===1&&S.st2&&S.st2.fire)for(const k in S.st2.fire){const j=+k,o=S.obj[j];if(!o||!BL[o])continue;add(objectDepth(o,j)+.005,1,objBox(o,j),()=>drawFire1(j,now),j)}/* 燃えている物のほのおは、その物のすぐ手前に */
  if(festOn()){const SL=festStalls();for(const[x,y]of festPoles()){const j=y*W+x;if(S.obj[j]||S.ground[j]===1||!vis({x:x+.5,y:y+.5})||SL.some(t=>t.y===y&&Math.abs(t.x-x)<=2))continue;add(y+1,1,[x*TS,y*TS-24,x*TS+TS+8,y*TS+TS],()=>drawFestPole(x,y,now),-1)}}/* おまつりのちょうちん（木や岩・水の上、屋台のところには立てない） */
  for(const h of HOUSES){const bot=h.y1,ib=h.ib;if(bot<y0-1||h.y0>y1+1||h.x1<x0-1||h.x0>x1+1)continue;
    add(bot+1.001,3,/* 屋根は、その家の壁（手前の壁もふくむ）のすぐ後に描く。家の前にいる物は屋根より手前 */[h.x0*TS-6,h.y0*TS-40,(h.x1+1)*TS+6,(ib+1)*TS+12],()=>liftDraw((()=>{const L=[...h.set],h0=hiAt(L[0]);return L.every(j=>hiAt(j)===h0)?h0*LIFT:0})(),()=>drawRoofs(ctx,now,[h])),-1)}/* 屋根は家ごとにひとまとまり。その家の壁は屋根の上に描き直さない *//* 屋根は、横の壁より後・手前の壁より先に描く */
  if(S.hi){const RW=cliffRuns();for(let y=Math.max(0,y0-1);y<Math.min(H,y1+2);y++){const L=RW.get(y);if(!L)continue;const vs=[];for(const R of L)if(R.x1>=x0-1&&R.x0<=x1)vs.push({x0:Math.max(R.x0,x0-1),x1:Math.min(R.x1,x1),lv:R.lv});if(!vs.length)continue;/* 見えている所だけ */
    add(y-1+.0005,-1,null,()=>{for(const R of vs)cliffRow(y,R,false)},-1);/* ひとつ上の行の物より先：段差の上の物のかげが、手前の行の上の面にかくれないように */
    add(y+.001,-1,null,()=>{for(const R of vs)cliffRow(y,R,true)},-1)}}/* うしろが低い所だけ、上の面の上はしをもう1回描いて、うしろの物の足もとをかくす *//* 段差：行ごとに、その行の物より先（ひとつ上の行の物より後） */
  D.sort((a,b)=>a.k-b.k||a.t-b.t);
  for(const it of D)it.draw();
  // 置く前のプレビューは、家の壁や屋根より手前に描く
  if(pending&&pending.kind==='one'){const px=pending.x*TS,py=pending.y*TS,TP=pending.id==='statue'?[[-1,0,'obox'],[0,0,'statue'],[1,0,'board'],[0,1,'altar']]:[[0,0,pending.id]];ctx.save();ctx.globalAlpha=.6+Math.sin(now/250)*.15;const rch=ROTS[pending.id]&&PLROTS[pending.id]&&chipOf(pending.id,null,PLROTS[pending.id]);if(rch)drawChip(ctx,rch,pending.id,px,py,now);/* 向きをかえられる物は、えらんだ向きの絵だけを見せる（元の向きの絵は出さない） */else for(const[dx,dy,id2]of TP)drawObj(ctx,id2,px+dx*TS,py+dy*TS,pending.y*W+pending.x+dx+dy*W,100,now);ctx.restore()}
  if(pending&&pending.kind==='one'&&FRONTS.has(pending.id)){/* すわる家具は、置くときに正面（すわった子が向く方）を矢印で出す */
    const id=pending.id,rot=PLROTS[id]||0,z=szR(id,rot)||[1,1],w=z[0]*TS,h=z[1]*TS;
    const d=[[0,1],[1,0],[0,-1],[-1,0]][rot];
    const bob=Math.sin(now/220)*2,cx=pending.x*TS+w/2+d[0]*(w/2+9+bob),cy=pending.y*TS+h/2+d[1]*(h/2+9+bob);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(d[1],d[0]));ctx.fillStyle='#ffe066';ctx.strokeStyle='#7a5a1c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-5,-8);ctx.lineTo(-5,8);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore()}
  if(S.summon&&STATUE>=0){const qx=(STATUE%W+.5)*TS,qy=((STATUE/W)|0)*TS-58+Math.sin(now/220)*4;bubs.push(()=>{ctx.fillStyle='rgba(255,236,120,.35)';ctx.beginPath();ctx.arc(qx,qy,19+Math.sin(now/300)*2,0,7);ctx.fill();circ(ctx,qx,qy,14,'#ffd84a');ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(qx,qy,14,0,7);ctx.stroke();ctx.fillStyle='#7a4a10';ctx.font='20px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('！',qx,qy+1);ctx.textAlign='start';ctx.textBaseline='alphabetic'})}/* 召喚できる合図 */
  
  BUBQ=null;for(const f of bubs)f();
  for(const[j,ht]of NATHIT){if(now-ht>4000||!LIGHTNAT[S.obj[j]]){NATHIT.delete(j);continue}const v=Math.max(0,1-(S.hp['lp'+j]||0)/NATG[S.obj[j]]),a=Math.min(1,(4000-(now-ht))/600),bx=(j%W)*TS+3,byy=natBarY(j);/* 守りの光をあてた木・岩・せいれいが切っている木・ほっている岩の、のこりのバー（高いマスでは持ち上げる） */
    ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.6)';rr(ctx,bx-1,byy-1,TS-4,7,3);ctx.fillStyle='#ffe58a';rr(ctx,bx,byy,Math.max(2,(TS-6)*v),5,2.5);ctx.globalAlpha=1}
  for(const[j,ht]of WALLHIT){const o=S.obj[j];if(now-ht>4000||!o||!BL[o]||!(BL[o].hp||DEFS.has(o))){WALLHIT.delete(j);continue}const mx=BL[o].hp||defHp(o),hp=Math.max(0,S.hp[j]??mx),v=hp/mx,a=Math.min(1,(4000-(now-ht))/600);
    const bx=(j%W)*TS+3,byy=((j/W)|0)*TS-7;ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.6)';rr(ctx,bx-1,byy-1,TS-4,7,3);ctx.fillStyle=v>.5?'#7ee08a':v>.25?'#ecdcbc':'#ff6b6b';rr(ctx,bx,byy,Math.max(2,(TS-6)*v),5,2.5);
    ctx.font='8px \"PixelMplus10\",\"Hikomi\",\"Hiragino Maru Gothic ProN\",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(Math.floor(hp)+'/'+mx,bx+TS/2-3,byy-2);ctx.textAlign='start';ctx.globalAlpha=1}
  if(WD===1&&S.st2)for(const k in S.st2.ash){const ax=(k%W)*TS,ay=((k/W)|0)*TS;ctx.fillStyle='rgba(95,90,86,.6)';for(let n=0;n<5;n++){ctx.beginPath();ctx.arc(ax+6+hash(k*3+n)*20,ay+6+hash(k*5+n)*18,3.5+hash(+k+n)*3,0,7);ctx.fill()}}/* 灰でよごれた設備 */
  if(WD===1&&S.st2)for(let y=Math.max(0,y0-1);y<Math.min(H,y1+2);y++)for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++){const i=y*W+x;if(S.ground[i]!==1||hash(i*7)>.45||!hotW(i))continue;const ph=((now/2600+hash(i*3))%1),sx=(i%W)*TS+8+hash(i*5)*16+Math.sin(now/700+i)*3,sy=((i/W)|0)*TS+14-ph*26;/* 温泉の湯気 */
    ctx.fillStyle='rgba(255,255,255,'+(.5*(1-ph))+')';ctx.beginPath();ctx.arc(sx,sy,5+ph*7,0,7);ctx.fill()}
  drawSpotFx(now);/* スポットのかこみ・キラキラは、物より上に */
  for(const f of fx){ctx.globalAlpha=Math.max(0,Math.min(1,f.life));
    if(f.k==='pillar'){const k=Math.min(1,f.life),w=26*k+6,h=150;const g=ctx.createLinearGradient(0,f.y-h,0,f.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,f.col+'99');g.addColorStop(1,'#ffffffee');ctx.fillStyle=g;ctx.fillRect(f.x-w/2,f.y-h,w,h+4);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(f.x-w/6,f.y-h,w/3,h+4);
      const gg=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,46);gg.addColorStop(0,'rgba(255,255,255,.9)');gg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gg;ctx.fillRect(f.x-46,f.y-46,92,92)}
    else if(f.k==='ring'){ctx.strokeStyle=f.col||'rgba(255,250,220,.9)';ctx.lineWidth=2.5*f.life;ctx.beginPath();{const rr=Math.max(0,1-f.life)*(f.col?56:30)+6;ctx.ellipse(f.x,f.y+6,rr,rr*.5,0,0,7)};ctx.stroke()}
    else if(f.k==='slash'){const p=1-f.life;ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.d,1);ctx.lineCap='round';const e=-1.4+2.8*Math.min(1,p*3.2);ctx.strokeStyle='rgba(255,170,60,.9)';ctx.lineWidth=9*f.life+2;ctx.beginPath();ctx.arc(-6,0,20,-1.4,e);ctx.stroke();ctx.strokeStyle='#fffbe0';ctx.lineWidth=4*f.life+1;ctx.beginPath();ctx.arc(-6,0,20,-1.4,e);ctx.stroke();ctx.fillStyle='rgba(255,240,170,'+f.life+')';ctx.beginPath();for(let a=0;a<8;a++){const r2=(a%2?4:11)*(.6+p),an=a*Math.PI/4;ctx.lineTo(14+Math.cos(an)*r2,Math.sin(an)*r2)}ctx.fill();ctx.restore()}
    else if(f.k==='p'){ctx.fillStyle=f.col;ctx.fillRect(f.x-f.r/2,f.y-f.r/2,f.r,f.r)}
    else{ctx.fillStyle=f.col;ctx.beginPath();for(let a=0;a<8;a++){const r2=a%2?1.2:3.5,an=a*Math.PI/4;ctx.lineTo(f.x+Math.cos(an)*r2,f.y+Math.sin(an)*r2)}ctx.fill()}}
  ctx.globalAlpha=1;
  ctx.strokeStyle='#fff6b0';ctx.lineWidth=2;
  /* 見張り台の光の矢：塔から敵へ飛んで、当たると光がはじける */
  for(const s of shots){const p=1-s.life,h=Math.min(1,p*2.4),tl=Math.max(0,h-.35),X=v=>(s.x1+(s.x2-s.x1)*v)*TS,Y=v=>(s.y1+(s.y2-s.y1)*v)*TS-Math.sin(v*Math.PI)*14;
    ctx.save();ctx.lineCap='round';if(s.fire&&h<1){ctx.fillStyle='rgba(255,120,40,.5)';ctx.beginPath();ctx.arc(X(h),Y(h),7,0,7);ctx.fill();ctx.fillStyle='#ffcf6a';ctx.beginPath();ctx.arc(X(h),Y(h),4,0,7);ctx.fill()}/* ようがん台の火の玉 */
    else if(h<1){ctx.strokeStyle='rgba(255,236,150,.55)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(X(tl),Y(tl));ctx.lineTo(X(h),Y(h));ctx.stroke();ctx.strokeStyle='#fffbe0';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(X(h),Y(h),4,0,7);ctx.fill()}
    else{const q=(p-1/2.4)/(1-1/2.4);ctx.globalAlpha=1-q;ctx.strokeStyle='#fff3b0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x2*TS,s.y2*TS,6+q*18,0,7);ctx.stroke();ctx.fillStyle='rgba(255,250,210,.7)';ctx.beginPath();ctx.arc(s.x2*TS,s.y2*TS,9*(1-q),0,7);ctx.fill()}ctx.restore()}ctx.globalAlpha=1;
  ctx.font='11px "PixelMplus10","Hikomi",sans-serif';ctx.textAlign='center';
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life*2);const yy=(f.y-(1-f.life)*1.2)*TS;ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='rgba(176,138,100,.9)';{const fi=emoImg(f.text);if(fi){const ih=20,iw=ih*fi.width/fi.height;ctx.drawImage(fi,f.x*TS-iw/2,yy-ih+4,iw,ih)}else{ctx.strokeText(f.text,f.x*TS,yy);ctx.fillStyle='#fff3d6';ctx.fillText(f.text,f.x*TS,yy)}}}/* 文字はぜんぶクリーム色 *//* 文字のふちどりはうすい茶色 */
  ctx.globalAlpha=1;ctx.textAlign='start';
  const dk=darkness();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(dk>0){ctx.fillStyle=(!WD&&S.ns&&(S.ns.final||S.ns.rush)&&!S.cleared?'rgba(46,10,52,':'rgba(14,20,58,')+dk+')';ctx.fillRect(0,0,VW,VH);
    ctx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);ctx.globalCompositeOperation='lighten';/* 光が重なっても、いちばん明るい光より明るくならない */
    ctx.globalAlpha=dk;for(const j of LITP){const o=S.obj[j],L=LIGHTP[o];if(!L)continue;const x=j%W,y=(j/W)|0;if(x<x0-5||x>=x1+5||y<y0-5||y>=y1+5)continue;/* 画面の外5マスの明かりも、光がとどくので描く */if(INDL.has(o)&&roomOf(j))continue;/* 家の中の灯りは、灯りそのものは光らせず、家ぜんたいを光らせる（下） *//* 明かりの出る物は、夜にまわりを明るく：光の絵（半径ごとに1まい作っておく）をおく */
      const R=L.R;ctx.drawImage(lightSpr(R),x*TS+L.dx-R,y*TS+L.dy-R,R*2,R*2)}ctx.globalAlpha=1;
    const litH=new Set();for(const j of LIGHTS){if(INDL.has(S.obj[j])){const h=roomOf(j);if(h)litH.add(h)}}/* 灯りのある家 */
    {const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=true;ctx.globalAlpha=dk*.75;for(const h of litH)ctx.drawImage(houseGlow(h),h.x0*TS-GLOWM,h.y0*TS-GLOWM);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=sm}/* 灯りのある家は、家ぜんたいを同じ明るさで照らす（ふちはぼかす） */
    ctx.globalCompositeOperation='source-over';
    {const wl=HOUSEART['wall-window-lit'];if(wl&&wl.complete&&wl.naturalWidth&&isDark()){ctx.globalAlpha=1;for(const h of litH)for(const q of h.set){if(((q/W)|0)===h.y0)continue;/* 上がわの壁の窓は、昼も夜も同じ色 */if(!S.win||S.win[q]!==1||!(HOME_WALLS.has(S.obj[q])||S.obj[q]==='window'))continue;const qx=q%W,qy=(q/W)|0;if(qx<x0-1||qx>x1||qy<y0-1||qy>y1)continue;if(winCovered(qx,qy))continue;/* 手前に背の高い物があれば、窓の光はかさねない */{const lk='window:lit',lc=window.CHIPS&&CHIPS[lk];if(!(lc&&drawChip(ctx,lc,lk,qx*TS,qy*TS-1.5,0,q)))ctx.drawImage(wl,qx*TS+3.625,qy*TS+1.5,24.75,21.7125)}}/* 明かりの絵もチップの大きさのまま */ctx.globalAlpha=1}}/* 夜（21時〜6時）だけ、灯りのある家の窓ガラスは中が明るい色に（暗さの上にかく） */
    ctx.setTransform(dpr,0,0,dpr,0,0)}
  if(GLWN){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=Math.min(1,dk*1.5);ctx.globalCompositeOperation='lighter';ctx.drawImage(GLW,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.setTransform(dpr,0,0,dpr,0,0);GLWN=0}
  // 空気の粒（昼は花粉、夜はホタル）
  for(const m of motes){const x=m.x*VW,y=m.y*VH;if(dk>.3){const a=(Math.sin(now/400+m.p)*.5+.5)*.8;ctx.globalCompositeOperation='lighter';circ(ctx,x,y,2.2*m.s,'rgba(200,255,140,'+a+')');circ(ctx,x,y,6*m.s,'rgba(200,255,140,'+a*.15+')');ctx.globalCompositeOperation='source-over'}else{circ(ctx,x,y,1.4*m.s,'rgba(255,250,220,'+(.35+.2*Math.sin(now/600+m.p))+')')}}
  drawHanabi(now);
  if(S.rain){ctx.strokeStyle='rgba(200,225,255,.45)';ctx.lineWidth=1;ctx.beginPath();for(const d of rain){const x=d.x*VW,y=d.y*VH;ctx.moveTo(x,y);ctx.lineTo(x-3,y+10*d.s)}ctx.stroke()}
  if(!VIG||VIG.w!==VW||VIG.h!==VH){const c2=document.createElement('canvas');c2.width=VW;c2.height=VH;const g2=c2.getContext('2d');const vg=g2.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.45,VW/2,VH/2,Math.max(VW,VH)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(10,20,15,.28)');g2.fillStyle=vg;g2.fillRect(0,0,VW,VH);VIG={c:c2,w:VW,h:VH}}
  ctx.drawImage(VIG.c,0,0);
}

/* ---------- カメラ・入力 ---------- */
function minZ(){return Math.max(.3,Math.min(VW/(W*TS),VH/(H*TS)))}
function clampCam(){
  cam.z=clamp(cam.z,minZ(),3);
  const vw=VW/cam.z,vh=VH/cam.z;
  cam.x=vw>=W*TS?(W*TS-vw)/2:clamp(cam.x,-40,W*TS-vw+40);
  cam.y=vh>=H*TS?(H*TS-vh)/2:clamp(cam.y,-80,H*TS-vh+120);
}
function resize(){dpr=Math.min(window.devicePixelRatio||1,1.25);/* 発熱対策で解像度をおさえる */VW=innerWidth;VH=innerHeight;cv.width=VW*dpr|0;cv.height=VH*dpr|0;cv.style.width=VW+'px';cv.style.height=VH+'px';clampCam()}
function panTo(wx,wy){camAnim={fz:cam.z,tz:cam.z,fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:wx,ty:wy,t:0,dur:.6}}/* 話しかけた子を、画面の中央へ */
function centerOn(wx,wy){cam.x=wx-VW/cam.z/2;cam.y=wy-VH/cam.z/2;clampCam()}
const homeZ=()=>Math.max(minZ(),Math.min(2.2,VW/(13*TS)));
const toWorld=(sx,sy)=>({x:cam.x+sx/cam.z,y:cam.y+sy/cam.z});

let mode='look',sel='farm',selStamp=null;
const ptrs=new Map();let gest=null;
cv.addEventListener('pointerdown',e=>{
  if(!started)return;camAnim=null;
  cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1)gest={type:'maybe',sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y};
  else if(ptrs.size===2){const[p,q]=[...ptrs.values()];gest={type:'pinch',d:Math.hypot(p.x-q.x,p.y-q.y),z:cam.z,mid:toWorld((p.x+q.x)/2,(p.y+q.y)/2)};if(selRect&&!pending)selRect=null}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!gest)return;
  if(gest.type==='pinch'&&ptrs.size>=2){const[p,q]=[...ptrs.values()];const d=Math.hypot(p.x-q.x,p.y-q.y);cam.z=clamp(gest.z*d/gest.d,minZ(),3);const mx=(p.x+q.x)/2,my=(p.y+q.y)/2;cam.x=gest.mid.x-mx/cam.z;cam.y=gest.mid.y-my/cam.z;clampCam();return}
  const dx=e.clientX-gest.sx,dy=e.clientY-gest.sy;
  if(gest.type==='maybe'&&Math.hypot(dx,dy)>8){
    const k=BL[sel]&&BL[sel].kind;
    if(mode==='bulk'&&!selStamp&&S.bulk&&(k==='block'&&S.unlocked[sel]||k==='plant'&&usable(sel)||sel==='spike'&&usable(sel))){const w=toWorld(gest.sx,gest.sy);gest.type='rect';gest.a={x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)};$('#confirm').hidden=true;pending=null}
    else gest.type='pan'}
  if(gest.type==='pan'){cam.x=gest.cx-dx/cam.z;cam.y=gest.cy-dy/cam.z;clampCam()}
  if(gest.type==='rect'){const w=toWorld(e.clientX,e.clientY);selRect={a:gest.a,b:{x:Math.floor(w.x/TS),y:Math.floor(w.y/TS)}}}
});
function endPtr(e){
  if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(gest&&gest.type==='maybe'&&e.type==='pointerup')onTap(e.clientX,e.clientY);
  else if(gest&&gest.type==='rect'&&selRect)askBulk(sel,rectCells(selRect.a,selRect.b));
  if(ptrs.size===1){const p=[...ptrs.values()][0];gest={type:'pan',sx:p.x,sy:p.y,cx:cam.x,cy:cam.y}}else if(!ptrs.size)gest=null;
}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();if(!started)return;const w=toWorld(e.clientX,e.clientY);cam.z=clamp(cam.z*(e.deltaY<0?1.12:.89),minZ(),3);cam.x=w.x-e.clientX/cam.z;cam.y=w.y-e.clientY/cam.z;clampCam()},{passive:false});

function onTap(sx,sy){DLGTAP=performance.now();/* タップで始める会話は、またずにすぐ出す */
  const w=toWorld(sx,sy),tx=Math.floor(w.x/TS),ty=Math.floor(w.y/TS);
  if(AREAARM){AREAARM=false;return areaBlast(w.x/TS,w.y/TS)}/* ひかりのはどう：タップした場所のまわり */
  if(LIGHTARM){LIGHTARM=false;const en=S.enemies.find(e=>e.spawned&&Math.hypot(e.x-w.x/TS,e.y-w.y/TS)<.8);if(en)return guardLight(en);const tj=ty*W+tx;if(tx>=0&&ty>=0&&tx<W&&ty<H&&LIGHTNAT[S.obj[tj]]&&!isBud(tj))return natLight(tj)}/* 守りの光：アイコンのあとにタップした「コワイノ」・木・岩にあてる */
  const si=S.seeds.findIndex(s=>s.x===tx&&s.y===ty);
  if(tx>=0&&ty>=0&&tx<W&&ty<H){const hh=HOUSES.find(h=>h.set.has(ty*W+tx));/* 開けた屋根は、壁をタップするまでそのまま */
    if(hh&&mode!=='look'&&!OPENH.has(hKey(hh))){OPENH.add(hKey(hh));dirty=true;return}}/* 置く・こわすときも、まず家をタップして中を見る */
  if(si>=0){sfx('seed');S.seeds.splice(si,1);S.mseed=(S.mseed||0)+1;S.mseedGot=(S.mseedGot||0)+1;addFloat(tx+.5,ty,'ふしぎな種+1','#d8f5c0');burstAt(tx,ty,'plant');toast('ふしぎな種をひろった','good');return}
  if(mode==='look'){
    const en=S.enemies.find(e=>e.spawned&&Math.hypot(e.x-w.x/TS,e.y-w.y/TS)<.8);
    if(en)return;/* 「コワイノ」に守りの光をあてるのは、アイコンをえらんでから */
    {const st=festStalls().find(t=>Math.abs(w.x/TS-(t.x+.5))<1.3&&w.y/TS>t.y-2.6&&w.y/TS<t.y+1);if(st){sfx('tap');openSheet('stall',st.x);return}}/* 屋台をタップすると、その屋台の品物 */
    if(godHere()&&Math.hypot(w.x/TS-godX(),w.y/TS-godY())<1.1){if(TALKW===GOD)return startTalk();if(S.feat.shop){const ln=pick(S.pt<2?GOD_POOR:GOD_SHOP);return dialog([[GOD,ln]],()=>{openSheet('shop');shopSay=ln;renderSheet()},'交換する')}toast('カミサマ「'+pick(GOD_IDLE)+'」');return}
    if(S.nushi&&Math.hypot(w.x/TS-S.nushi.x,w.y/TS-(S.nushi.y-.6))<1.4){sfx('tap');return nushiTalk()}/* ヌシ様と話す */
    if(S.cleared){const tw=S.obj.indexOf('tower');if(tw>=0&&Math.hypot(w.x/TS-(tw%W+1),w.y/TS-((tw/W|0)+.6))<1.4)return openSheet('travel')}/* クリア後は、台座から次の土地へ */
    if(sumHit(w.x/TS,w.y/TS))return doSummon();
    if(TALKW===GOD&&godHere()&&Math.hypot(w.x/TS-godX(),w.y/TS-(godY()-1.6))<1.2)return startTalk();
    if(TALKW){const tr=S.res.find(r=>r.name===TALKW&&!r.hidden&&!(r.act&&r.act.type==='sleep'));if(tr&&Math.hypot(tr.x-w.x/TS,(tr.y-1)-w.y/TS)<1.4){panTo(tr.x*TS,(tr.y-.7)*TS);return startTalk()}}
    {const tr=S.res.find(r=>SEVW[r.name]&&!r.hidden&&!(r.act&&r.act.type==='sleep')&&Math.hypot(r.x-w.x/TS,(r.y-1)-w.y/TS)<1.4);if(tr)return sevTalk(SEVW[tr.name])}
    {const tr=S.res.find(r=>SUBW[r.name]&&!r.hidden&&!(r.act&&r.act.type==='sleep')&&Math.hypot(r.x-w.x/TS,(r.y-1)-w.y/TS)<1.4);if(tr){panTo(tr.x*TS,(tr.y-.7)*TS);return subTalk(SUBW[tr.name])}}
    let best=null,bd=1.1;for(const r of S.res){if(r.hidden&&!peekH(r))continue;const d=Math.hypot(r.x-w.x/TS,(r.y-.5)-w.y/TS);if(d<bd){bd=d;best=r}}
    if(best&&best.act&&(best.act.type==='chat'||best.act.type==='rest')&&best.act.stage==='do'&&best.act.topic!=null&&best.act.seen!==best.act.topic){const p=S.res.find(q=>q.id===best.act.partner);if(p){const A=best.act.sub?p:best,B=best.act.sub?best:p;const C=CHATS[best.act.topic];for(const q of [A,B])if(q.act&&q.act.topic===best.act.topic)q.act.seen=best.act.topic;/* 一度見たおしゃべりは、もう一度タップしても出さない（ようすを出す） */return dialog(C.map((l,i)=>{const sp=l[0]?B:A;return [sp.name,((C.el&&!l[0])?l[1]:chatTone(l[1],sp,i)).replace(/@([HMK])/g,(m,c)=>sevName(c))]}),C.wave?()=>{A.waveU=B.waveU=S.t+4}:null)}}/* おしゃべり中の子をタップすると、会話が見られる */
    if(best){if(!S.flags.tapped&&S.flags.tapAsk){S.flags.tapPend=true}voiceHmm(best);return openSheet('res',best.id)}// ステータスを見て閉じたら、会話に進む
    if(tx<0||ty<0||tx>=W||ty>=H)return;
    {const j=anc(ty*W+tx);if(!isNight()&&godFix(S.obj[j]?j:ty*W+tx))return}/* こわれかけ・こわれた物は、守り神がパワーで直せる */
    {const hi=HOUSES.findIndex(h=>h.set.has(ty*W+tx));if(hi>=0){const hk=hKey(HOUSES[hi]);if(!OPENH.has(hk)){OPENH.add(hk);dirty=true;return}/* 1回目のタップで屋根を外す */const o0=S.obj[anc(ty*W+tx)];if(HOME_WALLS.has(o0)||HOME_DOORS.has(o0)){OPENH.delete(hk);dirty=true;return}/* 壁をタップすると屋根がもどる */if(!o0)return openSheet('house',hi)}}// 中が見えているときは、家具やせいれいもタップできる
    const j=anc(ty*W+tx),o=S.obj[j];
    if(WD===1&&S.st2){const g=ty*W+tx;
      if(S.ground[g]===1&&!o){const k=sprMap()[g];if(k){if(!S.flags.sprLook){S.flags.sprLook=true;checkQuest()}return toast(SPN[k]+'：'+(springOn(k)?'あたたかい湯がわいている':S.st2.sp[k]?'装置がこわれて、湯が冷めている':'冷たい水…熱がとどいていない'))}}
      if(o==='volcano'){if(!S.flags.volLook){S.flags.volLook=true;checkQuest()}return toast('火山：ふもとから、熱の道が村へのびている')}
      if(o==='heatv')return openSheet('heatv',j);
      if(o==='boulder')return toast('大岩：のこり '+Math.max(0,4-(S.hp['n'+j]||0))+'/4');
      if(o==='crack'){if((S.mat.stone||0)<2)return toast('ひびわれ：石材2で直せる（いま石材'+(S.mat.stone||0)+'）');S.mat.stone-=2;clearObj(j);S.floor[j]='path';burst(j,'block');sfx('level');recount();dirty=true;toast('ひびわれを直した（石材-2）','good');return checkQuest()}}
    {const g=ty*W+tx,dp=(S.drops||[]).find(q=>q.y*W+q.x===g&&q.id!=='shard');if(WEEDS.has(o)||dp){if((WEEDS.has(o)||dp.id.startsWith('mat:'))&&matCap()-matTot()<=0)return toast('素材箱に入りません');if(dp&&dp.id.startsWith('food:')&&foodCap()-S.food<=0)return toast('食料箱に入りません');let nm;if(WEEDS.has(o)){(S.wreq||(S.wreq={}))[j]=1;nm=BL[o].name}else{dp.tap=1;nm=dp.id.startsWith('mat:')?(MATN[dp.id.slice(4)]||'おとしもの'):'おとしもの'}sfx('tap');return toast(nm+'：せいれいがとりにいく'+(isNight()?'（朝になったら）':''))}}/* 草・きのこ・枝などの落とし物は、タップすると、せいれいがとりにいく */
    if(HOME_WALLS.has(o)||HOME_DOORS.has(o)){const w=houseWhy(j);if(w)toast(w)}/* 家にならないかべ・ドアをタップすると、理由を出す */
    if(o&&rangeOf(o,j))SHOWR={j,o,until:performance.now()+4000};
    if(o==='farm')return openSheet('farm',j);
    if(BEDSET.has(o))return openSheet('bed',j);
    if(o==='stor')return openSheet('food');
    if(o==='oven')return openSheet('oven',j);
    if(o==='plot')return toast('耕す前の畑：せいれいが耕しにくる');
    if(o==='sprout')return toast(BL[S.dyn[j].plant].name+'を植える場所：せいれいが植えにくる');
    if(o==='site'){const d=S.dyn[j];return toast(BL[d.build].name+'を建設中：'+Math.floor(d.p/d.need*100)+'%')}
    if(o==='berry'||o==='fruit'){const g=(S.dyn[j]||{g:0}).g;return toast(BL[o].name+'：'+(g>=100?'実がなっている':'実がなるまで あと'+Math.max(1,Math.ceil((100-g)/25))+'日'))}/* タップで見るだけ（セーブの中身はかえない） */
    const fw=o&&(FENCE_IDS.has(o)||HOME_WALLS.has(o)||HOME_DOORS.has(o));/* 柵・塀・家の壁・ドア・門は、短い知らせのまま */
    if(fw&&breakable(o)&&BL[o].brk)return toast(BL[o].name+'：'+withAttr(o,BL[o].desc||'')+'（じょうぶさ '+Math.floor(S.hp[j]??BL[o].hp)+'/'+BL[o].hp+'）');
    if(fw&&breakable(o))return toast(BL[o].name+'：じょうぶさ '+Math.floor(S.hp[j]??BL[o].hp)+'/'+BL[o].hp);
    if(o==='rock'||o==='deadtree'||o==='ntree'||o==='bamboo')return toast(BL[o].name+'：のこり '+Math.max(0,10-(S.hp['n'+j]||0))+'/10');
    if(o==='takenoko')return toast('たけのこ：あと '+Math.max(1,3-((S.dyn[j]||{}).age||0))+'日で竹になる');
    if(o==='watch'||o==='yogan')return openSheet('watch',j);
    if(o==='obox')return S.feat.inv?openSheet('inv'):toast('おそなえ箱');
    if(o==='grave'){const d=S.dyn[j]||{};if(!d.buried)return toast((d.name||'せいれい')+'のお墓。なかまが神殿へはこんで、おみおくりしてくれる');/* 守り神は埋葬できない */return toast((d.name||'せいれい')+'のお墓')}
    if(o==='tower'&&!WD&&!S.cleared){const av=(S.shards||0)-(S.setSh||0);if(av>0&&(S.setSh||0)>=2){const NM=['木のせいれい','守護の台座','ヌシのかけら','みどりのマス','せいれいパワー'],miss=clearConds().findIndex(c=>!c[1]);if(miss>=0)return toast(NM[miss]+'が足りません','warn')}/* 3つ目をはめるときも、5つの条件がそろっているか見る */if(av>0){S.setSh=(S.setSh||0)+1;sfx('shard');burst(j,'furn','none');toast('台座に、ヌシのかけらをはめた（'+S.setSh+'/3）','good');logEv('かけらを台座にはめた');if(S.setSh>=3)setTimeout(shards3,900);checkQuest();return}return openSheet('clear')}
    if(o==='board')return S.feat.craft?openSheet('craft'):toast('依頼ボード。もう少ししたら使えるようになる');
    if(o==='statue')return toast('女神像。守り神の居場所');
    if(o==='altar')return toast('カミサマの台座。カミサマはここに現れる');
    if(o&&BL[o].kind==='furn'&&!BL[o].trap&&!fw)return openSheet('furn',j);/* 家具：説明と、向きをかえる */
    if(!o&&RUGC.has(ty*W+tx))return openSheet('furn',RUGC.get(ty*W+tx));/* ラグ */
    if(o&&fw)return toast(BL[o].name+'：'+withAttr(o,BL[o].desc||''));
    if(o)return openSheet('furn',j);/* 噴水・建物・植物・ワナなども、下から説明を出す */
    if(S.ground[j]===1)return toast('池。そばでつりができる');
    return toast(REV.has(j)?'よみがえった土地':'荒れた土地。まわりに何か置くと、よみがえる');
  }
  if((mode==='build'||mode==='remove'||mode==='bulk')&&nightLock())return toast('夜のあいだは、置くことも、こわすこともできません');
  if(mode==='build'){if(BL[sel]&&['furn','build','deco'].includes(BL[sel].kind)&&!BL[sel].trap){/* ワナは柵と同じで、タップするたびにそのまま置く */if(!usable(sel))return place(sel,tx,ty);const ok=canPlace(sel,tx,ty,true);pending={kind:'one',id:sel,x:tx,y:ty,ok};confirmOne();($('#cRot').hidden=!(pending&&pending.kind==='one'&&ROTS[pending.id]),$('#confirm').hidden=false);sfx('tap');return}return place(sel,tx,ty)}
  if(mode==='remove')return removeAt(tx,ty);
  if(mode==='bulk'){if(selStamp==='move')return moveTap(tx,ty);if(selStamp)return selStamp.startsWith('swap:')?askSwap(selStamp.slice(5),tx,ty):askStamp(selStamp,tx,ty);if(!S.bulk)return toast('下から道具をえらんでください');return toast('ハケで、なぞった範囲をぬれます')}
}


/* ---------- おと（BGM・効果音はWeb Audioで鳴らすオリジナル） ---------- */
const SND={bgm:true,sfx:true};try{Object.assign(SND,JSON.parse(KV.getItem('hakoniwa-sound')||'{}'))}catch(e){}
const saveSnd=()=>{try{KV.setItem('hakoniwa-sound',JSON.stringify(SND))}catch(e){}};
let bgmF=null,bgmSw=0,AC=null,bgmG=null,sfxG=null,noiseBuf=null,curSong='day',wantSong='day',nextT=0,step=0;
const mf=m=>440*Math.pow(2,(m-69)/12);
// [音, 長さ(8分音符)]。0は休み
const SONGS={
  opening:{bpm:78,lead:'triangle',chords:[[48,[60,64,67]],[43,[55,59,62]],[45,[57,60,64]],[41,[53,57,60]]],
    mel:[[72,4],[76,4],[79,4],[84,4],[83,4],[79,4],[76,4],[74,4],[72,4],[76,4],[81,4],[79,4],[76,4],[74,4],[72,8]]},
  day:{bpm:92,lead:'triangle',chords:[[48,[60,64,67]],[45,[57,60,64]],[41,[53,57,60]],[43,[55,59,62]]],
    mel:[[76,2],[79,2],[81,2],[79,2],[76,2],[74,1],[72,1],[74,4],[72,2],[74,2],[76,2],[81,2],[79,6],[0,2],
         [76,2],[79,2],[84,2],[81,2],[79,2],[76,2],[74,2],[76,2],[72,2],[69,2],[72,2],[74,2],[72,6],[0,2]]},
  night:{bpm:66,lead:'sine',chords:[[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[43,[55,59,62]]],
    mel:[[69,4],[72,2],[76,2],[74,6],[0,2],[72,2],[74,2],[76,4],[74,4],[71,4],
         [69,2],[72,2],[76,2],[81,2],[79,4],[76,4],[74,4],[71,4],[69,6],[0,2]]},
};
for(const k in SONGS){const g=SONGS[k];g.at=new Array(64).fill(null);let p=0;for(const[m,l]of g.mel){if(m)g.at[p%64]=[m,l];p+=l}}
const SAMPLES={"pat":["assets/g/e2b825e14e.mp3"],"voice":["assets/g/fc5ad15d4b.mp3"],"paper":["assets/g/b7b70de2d3.mp3"],"night":["assets/g/b8fa05062a.mp3"],"chop":["assets/g/1d86cabda1.mp3","assets/g/676cf2fa6d.mp3","assets/g/a8dd704564.mp3"],"dig":["assets/g/56f3308409.mp3"],"splash":["assets/g/05adadaa1c.mp3"],"cast":["assets/g/93da972520.mp3"],"nail":["assets/g/b121a3b6b8.mp3"],"bush":["assets/g/3c69ed59fd.mp3"],"bubble":["assets/g/3dae9cab95.mp3"],"catch":["assets/g/269701117d.mp3"],"box":["assets/g/8c8eeb8b61.mp3"],"fire":["assets/g/e8ad50e6e8.mp3"],"boil":["assets/g/55a7541497.mp3"],"rain":["assets/g/7178ec736f.mp3"],"birds":["assets/g/c0eec144c6.mp3"]};const SBUF={};
Object.assign(SAMPLES,{"mine":["assets/g/ba69ed4c76.mp3"]});
Object.assign(SAMPLES,{"gravel":["assets/g/1367715265.mp3"],"wdon":["assets/g/6e3c4c3694.mp3"],"arrow": ["assets/g/4020d45f73.mp3"], "bush2": ["assets/g/0f9eb4e9b6.mp3"], "door": ["assets/g/02047b788c.mp3"], "kill": ["assets/g/c3aac5194a.mp3"], "munch": ["assets/g/83541e7fe0.mp3"], "nail2": ["assets/g/f10fe51343.mp3"], "pick": ["assets/g/443dd77412.mp3"], "place": ["assets/g/c75dd30fa4.mp3"], "punch": ["assets/g/5124e82f60.mp3"], "shoot": ["assets/g/8c1be13e0e.mp3"], "trickle": ["assets/g/017cf8add7.mp3"], "wallbreak": ["assets/g/43e010b66b.mp3"], "wave": ["assets/g/241549ec96.mp3"]});/* 効果音ラボ（ユーザー提供） */
SAMPLES.shard=['assets/g/9464bc7161.mp3'];/* ヌシのかけらをはめる音（ユーザーの音） */
SAMPLES.furniturePlace=['assets/g/e33cbd97b8.mp3'];/* 家具を置く音：ユーザー提供 */
SAMPLES.matDrop=['assets/g/ef846d878d.mp3'];/* 守りの光で木・岩をこわして、素材が落ちたときの音（もらった音） */
function loadSamples(){/* 音のファイル（assets/g/*.mp3）を読みこんで、鳴らせる形にしておく */for(const k in SAMPLES){SBUF[k]=[];SAMPLES[k].forEach((u,i)=>{fetch(u).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b,buf=>{SBUF[k][i]=buf},()=>{})).catch(()=>{})})}}
// セリフの声：キャラごとに高さを変える（カミサマは低め）
let VOICE=null,voxC=null;const BRAVET=new WeakMap();
function voiceStart(w,dur){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;{const sr=S&&S.res&&S.res.find(q=>q.name===w),vb=sr&&sr.vr&&sr.vr.vo;src.playbackRate.value=/ヌシ/.test(w||'')?.55:(w===GOD||w==='？？？')?.78:vb||(KEYVR[w]&&KEYVR[w].vo)||1.12}/* 声の高さは一人ずつちがう */
  {const t=AC.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.8*(SND.vv??1),t+.03)}/* 声の出だしは、ぷつっと大きくならないよう、少しずつ */src.connect(g);g.connect(voxC);src.start(0,Math.random()*b.duration*.5);VOICE={src,g};if(dur)VOICE.end=setTimeout(voiceStop,dur*1000)}
/* みるでタップしたときの「ほにゃ？」：短く、最後が上がる声 */
function voiceHmm(r){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;const vo=(r.vr&&r.vr.vo)||1.12,t=AC.currentTime;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.playbackRate.setValueAtTime(vo*.95,t);src.playbackRate.setValueAtTime(vo*.95,t+.16);src.playbackRate.linearRampToValueAtTime(vo*1.35,t+.36);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.7*(SND.vv??1),t+.03);g.gain.setValueAtTime(.7*(SND.vv??1),t+.3);g.gain.linearRampToValueAtTime(0,t+.42);src.connect(g);g.connect(voxC);src.start(t,Math.random()*b.duration*.5);src.stop(t+.45);VOICE={src,g}}
function voiceStop(){if(!VOICE)return;const v=VOICE;VOICE=null;clearTimeout(v.end);try{const t=AC.currentTime;v.g.gain.setTargetAtTime(0,t,.04);v.src.stop(t+.2)}catch(e){}}
function playSeg(k,vol,dur){if(!AC||!SND.sfx||AC.state!=='running')return false;const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const b=pick(L),src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime;src.buffer=b;const v=vol*SFXV;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.15);g.gain.setValueAtTime(v,t+dur-.3);g.gain.linearRampToValueAtTime(0,t+dur);src.connect(g);g.connect(sfxG);src.start(t,Math.random()*Math.max(0,b.duration-dur));src.stop(t+dur+.05);return true}
let WAVE=null;/* 水浴びの音は1つだけ。水浴びが終わったら止める */
function playWave(vol){if(WAVE||!AC)return;const L=(SBUF.wave||[]).filter(Boolean);if(!L.length)return;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);g.gain.value=vol*SFXV;src.connect(g);g.connect(sfxG);const w={src,g};src.onended=()=>{if(WAVE===w)WAVE=null};WAVE=w;src.start()}
function stopWave(){if(!WAVE)return;const{src,g}=WAVE;WAVE=null;try{g.gain.setTargetAtTime(0,AC.currentTime,.12);src.stop(AC.currentTime+.5)}catch(e){}}
function playS(k,vol,dl){const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);src.playbackRate.value=.92+Math.random()*.16;g.gain.value=vol*SFXV;src.connect(g);g.connect(sfxG);src.start(AC.currentTime+(dl||0));return true}
function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume().catch(()=>{})}catch(e){return}
  const comp=AC.createDynamicsCompressor();comp.connect(AC.destination);
  bgmG=AC.createGain();bgmG.gain.value=gainB();bgmF=AC.createGain();bgmF.gain.value=1;bgmG.connect(bgmF);bgmF.connect(comp);
  sfxG=AC.createGain();sfxG.gain.value=gainS();sfxG.connect(comp);
  voxC=AC.createDynamicsCompressor();voxC.threshold.value=-38;voxC.ratio.value=12;voxC.knee.value=4;voxC.attack.value=.003;voxC.release.value=.1;voxC.connect(sfxG);/* 声は、大きいところをおさえて、音の大きさをそろえる（声の音の中に、ほかより大きい所があるため） */
  noiseBuf=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  nextT=AC.currentTime+.15;setInterval(sched,60);setInterval(ambTick,500);loadSamples();
}
function tone(m,t,dur,type,vol,out,f2){
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(typeof m==='number'&&m<200?mf(m):m,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);
}
function noise(t,dur,vol,out,hp){const s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=noiseBuf;fl.type='highpass';fl.frequency.value=hp||6000;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
function stageMusic(){
  curSong=wantSong=isDark()?'night':'day';step=0;bgmSw=0;
  if(!AC)return;
  bgmG.disconnect();bgmG=AC.createGain();bgmG.gain.value=gainB();bgmG.connect(bgmF);
  bgmF.gain.cancelScheduledValues(AC.currentTime);bgmF.gain.setValueAtTime(1,AC.currentTime);
  nextT=AC.currentTime+.01;sched();
}
function sched(){
  if(!AC||AC.state!=='running')return;
  if(nextT<AC.currentTime)nextT=AC.currentTime+.05;
  // 昼夜の曲は、フェードアウト→切り替え→フェードインでつなぐ
  {const now=AC.currentTime;if(wantSong!==curSong&&!bgmSw){bgmSw=now+2.4;bgmF.gain.cancelScheduledValues(now);bgmF.gain.setValueAtTime(bgmF.gain.value,now);bgmF.gain.linearRampToValueAtTime(0,now+2.2)}
   else if(bgmSw&&now>=bgmSw){bgmSw=0;curSong=wantSong;step=0;nextT=now+.05;bgmF.gain.cancelScheduledValues(now);bgmF.gain.setValueAtTime(0,now);bgmF.gain.linearRampToValueAtTime(1,now+3)}}
  while(nextT<AC.currentTime+.3){
    const g=SONGS[curSong],e=60/g.bpm/2,t=nextT,bar=(step/8)|0,ch=g.chords[bar%4],night=curSong==='night',opening=curSong==='opening';
    const n=g.at[step];if(n)tone(n[0],t,n[1]*e*.95,g.lead,opening?.08:night?.09:.075,bgmG);/* マップ画面の曲（opening）：サインだけだとスマホのスピーカーで聞こえないので、三角波でほかの曲と同じくらいの大きさに */
    if(step%8===0)tone(ch[0],t,e*(opening?6:night?7.5:3.6),'triangle',opening?.11:.13,bgmG);
    if(!night&&step%8===4)tone(ch[0]+7,t,e*3.4,'triangle',.1,bgmG);
    if(opening){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.2,'sine',.03,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+24,t,e*1.8,'triangle',.025,bgmG)}
    else if(night){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.8,'sine',.025,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+12,t,e*1.6,'sine',.02,bgmG)}
    else{tone(ch[1][step%3]+12,t,e*.55,'square',.012,bgmG);if(step%2===1)noise(t,.03,.025,bgmG)}
    nextT+=e;step=(step+1)%64;
  }
}
let ambG=null;const AMB={};
function ambTick(){if(!AC||AC.state!=='running')return;if(!ambG){ambG=AC.createGain();ambG.gain.value=.12;ambG.connect(AC.destination)}
  const want={birds:0,rain:0,night:0};if(S&&started&&SND.sfx&&$('#title').hidden&&$('#maps').hidden){const h=hour();if(S.rain)want.rain=.45;else if(h>=5.5&&h<18)want.birds=1;else if(h>=19||h<5)want.night=1}
  for(const k in want){let a=AMB[k];if(!a){if(!want[k])continue;const b=(SBUF[k]||[])[0];if(!b)continue;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;src.loopStart=.06;src.loopEnd=b.duration-.06;g.gain.value=0;src.connect(g);g.connect(ambG);src.start();a=AMB[k]={src,g}}a.g.gain.setTargetAtTime(want[k],AC.currentTime,.8)}}
const lastSfx={};
let SFXV=1;
function sfx(k){
  if(!AC||!SND.sfx||AC.state!=='running')return;const now=AC.currentTime;if(lastSfx[k]&&now-lastSfx[k]<.07)return;lastSfx[k]=now;
  const t=now+.01,o=SFXV!==1?(()=>{const g=AC.createGain();g.gain.value=SFXV;g.connect(sfxG);return g})():sfxG,seq=(ns,gap,type,v,d)=>ns.forEach((m,i)=>tone(m,t+i*gap,d||gap*1.6,type,v,o));
  switch(k){
  case'block':if(playS('wdon',.5))break;tone(260,t,.07,'square',.05,o,520);tone(83,t+.05,.07,'triangle',.06,o);break;
  case'plant':tone(500,t,.1,'triangle',.08,o,950);tone(88,t+.08,.1,'sine',.06,o);break;
  case'furn':seq([72,76,79,84],.06,'triangle',.07);break;
  case'furnPlace':if(playS('furniturePlace',.72))break;seq([72,76,79,84],.06,'triangle',.07);break;
  case'matDrop':if(playS('matDrop',.8))break;tone(520,t,.06,'triangle',.06,o,260);break;
  case'tap':tone(1300,t,.03,'square',.1,o);tone(1950,t+.025,.03,'triangle',.08,o);break;
  case'next':tone(88,t,.04,'triangle',.05,o);break;
  case'good':seq([84,88],.07,'sine',.06);break;
  case'warn':seq([62,57],.14,'square',.035,.22);break;
  case'quest':seq([72,76,79,84,79,84],.09,'triangle',.08,.16);break;
  case'level':seq([67,72,76,79],.09,'triangle',.08,.16);[72,76,79,84].forEach(m=>tone(m,t+.4,1.1,'sine',.035,o));[96,100,103,108].forEach((m,i)=>tone(m,t+.7+i*.05,.25,'triangle',.025,o));break;
  case'bossIn':noise(t,1.6,.16,o,60);tone(110,t,1.6,'sawtooth',.06,o,40);tone(55,t,2.2,'sine',.12,o,35);[45,46,51].forEach((m,i)=>tone(m,t+.25+i*.02,2.4,'triangle',.05,o));break;/* オオカゲの登場：ひくい地ひびきと、にごった和音 */
  case'shard':if(playS('shard',.8))break;seq([67,72,76,79],.09,'triangle',.08,.16);break;/* かけらをはめる */
case'bossKO':noise(t,.5,.3,o,200);tone(70,t,1.4,'sine',.2,o,30);tone(900,t,.35,'square',.05,o,120);noise(t+.12,.9,.08,o,3000);[72,79,84,88,91,96].forEach((m,i)=>tone(m,t+.35+i*.08,1.4,'triangle',.06,o));[96,103,108].forEach((m,i)=>tone(m,t+.9+i*.06,1.2,'sine',.04,o));break;/* オオカゲへのさいごの一撃：ドーンとひびいて、光の音がかけあがる */
  case'hit':if(playS('arrow',.6))break;noise(t,.08,.15,o,800);tone(220,t,.12,'square',.05,o,70);break;
  case'defeat':if(playS('kill',.5))break;tone(400,t,.18,'triangle',.08,o,1300);noise(t+.05,.12,.04,o,4000);break;
  case'offer':seq([88,91,96],.05,'sine',.05);break;
  case'hanabi':noise(t,.5,.1,o,400);tone(62,t,.35,'sine',.18,o);break;/* 花火の音 */
  case'arrive':seq([79,84,88,91,96],.08,'sine',.06,.2);break;
  case'zap':if(playS('shoot',.45))break;tone(1500,t,.07,'sawtooth',.015,o,500);break;
  case'seed':seq([84,91,96,100],.05,'triangle',.05);break;
  case'pat':if(playS('pat',.8))break;noise(t,.08,.05,o,2500);break;
  case'sow':noise(t,.12,.05,o,4000);seq([79,84,88],.06,'triangle',.05);break;
  case'till':noise(t,.08,.12,o,400);noise(t+.14,.08,.12,o,400);tone(110,t,.08,'triangle',.06,o);break;
  case'harvest':if(playS('bush2',.45))break;seq([72,79,84,91],.05,'triangle',.06);break;
  case'water':if(playS('splash',.32))break;{const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;sr.loop=true;bp.type='bandpass';bp.frequency.setValueAtTime(3200,t);bp.frequency.linearRampToValueAtTime(2200,t+.7);bp.Q.value=.8;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.1);g.gain.setValueAtTime(.06,t+.45);g.gain.linearRampToValueAtTime(0,t+.75);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t);sr.stop(t+.8);
    for(let n=0;n<4;n++){const d=t+.12+n*.13+Math.random()*.05;tone(1400+Math.random()*600,d,.05,'sine',.012,o,2600)}break}
  case'chop':playS('nail2',.3);break;/* 木を切る音＝釘を打つ音 */
  case'cook':if(playS('boil',.35))break;noise(t,.35,.025,o,3000);tone(180,t,.08,'triangle',.03,o,140);break;
  case'crack':if(playS('mine',.25))break;playS('place',.25);break;case'rm':if(playS('gravel',.6))break;noise(t,.18,.09,o,900);break;
  case'nail':playS('nail2',.28);break;
  case'bnail':playS('nail2',.42);break;
  case'kankan':for(let i=0;i<3;i++)playS('nail2',.42,i*.22);break;/* 強化したとき：カンカンカン *//* 建てているときの音（ふつうの1.5倍） */
  case'evap':noise(t,1.4,.05,o,2500);seq([67,64,60],.18,'sine',.03,.4);break;
  case'bush':playS('bush',.35);break;
  case'cast':playS('cast',.35);break;
  case'catch':playS('catch',.35);break;
  case'bubble':playS('bubble',.35);break;
  case'box':playS('box',.8);break;
  case'cookfire':playS('fire',.35);break;
  case'door':playS('door',.25);break;
  case'wave':playWave(.2);break;
  case'wbreak':playS('wallbreak',.5);break;
  case'pour':playSeg('trickle',.4,1.8);break;
  case'shoot':playS('shoot',.5);break;
  case'clap':for(let i=0;i<6;i++){const d=t+i*.13+Math.random()*.03;noise(d,.04,.12,o,2200+Math.random()*900);noise(d+.05,.03,.08,o,1800)}break;
  case'post':if(playS('paper',1.35))break;noise(t,.06,.45,o,2500);tone(520,t+.04,.07,'triangle',.45,o);tone(880,t+.1,.08,'square',.21,o);break;
  case'repair':tone(600,t,.05,'square',.04,o);tone(600,t+.12,.05,'square',.04,o);tone(88,t+.24,.12,'triangle',.05,o);break;
  case'bonk':if(playS('punch',.45))break;noise(t,.07,.1,o,600);tone(140,t,.1,'square',.05,o,90);break;
  case'thief':seq([76,79,76,79],.06,'square',.03);break;
  case'eat':if(playS('munch',.45))break;[0,.14,.28].forEach(d=>{noise(t+d,.06,.03,o,1800);tone(240+Math.random()*60,t+d,.06,'triangle',.05,o,150)});tone(84,t+.42,.12,'sine',.05,o);tone(88,t+.5,.16,'sine',.05,o);break;
  case'poof':noise(t,.3,.08,o,2500);seq([84,91],.08,'sine',.05);break;
  case'night':seq([57,53,50],.25,'sine',.08,.5);break;
  case'morning':seq([72,79,84],.12,'triangle',.06,.3);break;
  }
}
// 画面の中心から遠いほど小さく鳴らす
const SFXGAP={chop:1.3,pour:2.5,crack:1.3},SFXLAST={};/* 同じ音が重ならないように */
function sfxAt(k,x,y,m=1){if(!S)return;if(SFXGAP[k]){const n=performance.now()/1000;if(n-(SFXLAST[k]||0)<SFXGAP[k])return;SFXLAST[k]=n}const vw=VW/cam.z,vh=VH/cam.z,d=Math.hypot(x*TS-(cam.x+vw/2),y*TS-(cam.y+vh/2)),R=Math.max(vw,vh)*.8,v=Math.pow(Math.max(0,1-d/R),1.5);if(v<.04)return;SFXV=v*m;try{sfx(k)}finally{SFXV=1}}
const gainB=()=>SND.bgm?.55*(SND.bv??1):0,gainS=()=>SND.sfx?.15*(SND.sv??1):0;/* 音楽・効果音の音量（0〜1） */
function setSnd(k,v){SND[k]=v;saveSnd();if(AC){bgmG.gain.setTargetAtTime(gainB(),AC.currentTime,.1);sfxG.gain.setTargetAtTime(gainS(),AC.currentTime,.1)}}

/* ---------- UI ---------- */
function toast(msg,kind){if(kind==='good')sfx('good');else if(kind==='warn')sfx('warn');const t=document.createElement('div');t.className='toast'+(kind?' '+kind:'');t.textContent=msg;const box=$('#toasts');box.appendChild(t);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>t.remove(),2800)}
const FEATS={inv:'#dockInv',build:'[data-mode="build"]',remove:'[data-mode="remove"]',craft:'[data-sheet="craft"]',people:'[data-sheet="people"]'};
function applyFeats(){
  if(S.glassT==null&&glassUnlocked())S.glassT=600;/* はじめの10分は無料 */$('#speedBtn').hidden=!(glassUnlocked()||TESTSPD||TESTM);if(!(hasGlass()||TESTM))S.speed=1;if(!TESTM&&S.speed>2)S.speed=1;glassUI();
  for(const k in FEATS)document.querySelector(k==='inv'?FEATS[k]:'#dock '+FEATS[k]).hidden=!S.feat[k]||k==='craft';/* 依頼は依頼ボードから。おそなえ箱は下のバーにも出す */
  document.querySelector('#dock [data-mode="bulk"]').hidden=true;/* 道具は「おく」の中からえらぶ（下のバーには出さない） *//* おそなえ箱のボタン */
  const n=[...document.querySelectorAll('#dock button')].filter(b=>!b.hidden).length;
  $('#dock').style.gridTemplateColumns='repeat('+n+',1fr)';
}
let palOpen=false;/* 「おく」をおすと、アイテム欄が大きくひらく。えらぶと小さくなる */
function setMode(m){
  mode=m;palOpen=m==='build'||m==='bulk';pending=null;selRect=null;$('#confirm').hidden=true;
  if(S&&STATUE<0&&m==='build'&&usable('statue'))sel='statue';else if(sel==='statue'&&STATUE>=0)sel='farm';
  document.querySelectorAll('#dock [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===(m==='bulk'?'build':m)));/* 道具を使っているあいだは「おく」を光らせる */
  $('#palette').hidden=!(m==='build'||m==='bulk');renderPalette();
}
function chip(img,name,cost,cls,onClick,mat){
  const b=document.createElement('button');b.className='chip '+cls;
  b.innerHTML='<img alt=""><span class="nm"></span><span class="cs"></span>';
  b.querySelector('img').src=img;b.querySelector('.nm').textContent=name;const cs=b.querySelector('.cs');cs.textContent=cost;b.onclick=onClick;
  if(mat&&Object.keys(mat).length){const m=document.createElement('span');m.className='mt'+(matOK(mat)?'':' ng');m.innerHTML=matHTML(mat);b.appendChild(m)}/* 建物に使う素材 */
  return b;
}
function lbl(box,t){const s=document.createElement('span');s.className='pallbl';s.textContent=t;box.appendChild(s)}

function updItemInfo(){const ii=$('#itemInfo');if(!(mode==='build'||mode==='bulk')||!S){ii.hidden=true;return}
  let nm='',ds='';if(mode==='bulk'&&selStamp==='move'){nm='ひっこしミトン';ds=MOVESRC?moveName(MOVESRC)+'を、うつしたい所をタップ（同じ物をタップでやめる）':'うつしたい家具・建物をタップ'}else if(mode==='bulk'&&selStamp){if(selStamp.startsWith('swap:')){nm=BL[selStamp.slice(5)].name+'につけかえ';ds='つけかえたい物をタップ'}else{nm=STAMPS[selStamp].name;ds='置きたい場所の左上をタップ'}}
  else if(sel&&BL[sel]){const b=BL[sel];nm=iname(sel);const bm=sel==='tower'?TOWER_MAT():b.mat;ds=(b.kind==='build'?(b.pc?SP(b.pc)+(bm?' '+matHTML(bm):''):''):'所持：'+inv(sel));const hp=withAttr(sel,b.desc||'');if(hp)ds+=' <button class="qbtn" id="iiQ">?</button>';}else ds=esc(ds);
  ii.hidden=!nm;$('#iiName').textContent=nm;$('#iiDesc').innerHTML=ds;const q=$('#iiQ');if(q)q.onclick=e=>{e.stopPropagation();sfx('tap');helpPop(nm,withAttr(sel,BL[sel].desc||''))}}
function renderPalette(){
  if(!S)return;updItemInfo();const box=$('#palItems');box.innerHTML='';
  $('#undoBtn').hidden=mode!=='build';
  const pickItem=id=>()=>{sfx('tap');sel=id;if(pending&&pending.kind==='one'){pending=null;$('#confirm').hidden=true}selStamp=null;renderPalette();const b=BL[id];
    if(mode==='bulk'){if(!S.bulk)return toast('下から道具をえらんでください');toast('ハケで、なぞった範囲をぬれます');palOpen=false;renderPalette();return}
    if(b.kind==='furn'&&!inv(id))toast(b.name+'が足りません','warn');
    else if(b.kind==='block'&&!inv(id))toast(b.name+'がありません');
    else if(b.kind==='plant')toast(inv(id)?'置いた場所にせいれいが植えてくれる':iname(id)+'がありません');
    else if(b.kind==='seed')toast(inv(id)?'たねをまきたい畑をタップ':iname(id)+'がありません');
    else if(b.kind==='build')toast(id==='statue'?'好きな場所をタップ。せいれいが神殿を建ててくれる（4マス）':'置いた場所にせいれいが建ててくれる');
    if(b.kind==='build'||inv(id)>0){palOpen=false;renderPalette()}};
  $('#palette').classList.toggle('open',palOpen);
  if(!palOpen&&mode==='bulk'){/* ハケ・スタンプ・つけかえも、えらんだら小さくして、マップを見えるように */
    if(selStamp==='move')box.appendChild(chip(toolIcon('mover'),'ひっこしミトン',MOVESRC?moveName(MOVESRC):'うつす','sel',()=>{}));
    else if(selStamp)box.appendChild(chip(selStamp.startsWith('swap:')?iconURL(selStamp.slice(5)):stampIcon(selStamp),selStamp.startsWith('swap:')?BL[selStamp.slice(5)].name:STAMPS[selStamp].name,selStamp.startsWith('swap:')?'×'+inv(selStamp.slice(5)):'スタンプ','sel',()=>{}));
    else if(sel&&BL[sel])box.appendChild(chip(iconURL(sel),iname(sel),'×'+inv(sel),'sel',()=>{}));
    const mb=document.createElement('button');mb.className='chip more';mb.id='palMore';mb.textContent='ほかをえらぶ';mb.onclick=()=>{sfx('tap');palOpen=true;renderPalette()};box.appendChild(mb);return}
  if(!palOpen&&mode==='build'){/* えらんだ物だけを小さく出す */
    if(sel&&BL[sel]){const id=sel,b=BL[id];box.appendChild(chip(iconURL(id),iname(id),b.kind==='build'?(id==='statue'||(id==='watch'&&watchQ())?'むりょう':SP(b.pc)):'×'+inv(id),'sel',()=>{}))}
    const mb=document.createElement('button');mb.className='chip more';mb.id='palMore';mb.textContent='ほかをえらぶ';mb.onclick=()=>{sfx('tap');palOpen=true;renderPalette()};box.appendChild(mb);return}
  if(mode==='bulk'){
    if(S.bulk){lbl(box,'ハケ');box.appendChild(chip(toolIcon('hake'),'ひろびろハケ','下からえらぶ','wide',()=>toast('ぬりたいブロックや種をえらんで、指でなぞろう')))}/* もらった道具だけ出す */
    if(S.mover){lbl(box,'ひっこし');box.appendChild(chip(toolIcon('mover'),'ひっこしミトン','うつす','wide'+(selStamp==='move'?' sel':''),()=>{selStamp='move';MOVESRC=null;palOpen=false;renderPalette();toast('うつしたい家具・建物をタップ')}))}/* ひっこしミトン：家具・建物を、すぐべつの場所へ */
    if(S.stamps){lbl(box,'スタンプ');for(const sid in STAMPS)box.appendChild(chip(stampIcon(sid),STAMPS[sid].name,'スタンプ','wide'+(selStamp===sid?' sel':''),()=>{selStamp=sid;palOpen=false;renderPalette();toast('置きたい場所の左上をタップ')}))}
    if(S.swap){lbl(box,'つけかえ');for(const id of SWAPG.flat().filter(id=>S.unlocked[id])){const k='swap:'+id;box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),selStamp===k?'sel':'',()=>{selStamp=k;palOpen=false;renderPalette();toast('つけかえたい物をタップ')}))}}/* つけかえトンカチ：つながっている柵・塀・家の壁・道・床を、えらんだ種類にまとめてかえる */
    if(!S.bulk)return/* ハケがなければ、ぬるブロック・種は出さない */
  }
  if(mode==='build'&&(S.bulk||S.stamps||S.swap||S.mover)){lbl(box,'どうぐ');/* 道具は「おく」の中でえらぶ */
    if(S.mover)box.appendChild(chip(toolIcon('mover'),'ひっこしミトン','うつす','wide',()=>{sfx('tap');setMode('bulk');selStamp='move';MOVESRC=null;palOpen=false;renderPalette();toast('うつしたい家具・建物をタップ')}));
    if(S.bulk)box.appendChild(chip(toolIcon('hake'),'ひろびろハケ','まとめてぬる','wide',()=>{sfx('tap');setMode('bulk');selStamp=null;toast('ぬりたいブロックや種をえらんで、指でなぞろう')}));
    if(S.stamps)box.appendChild(chip(toolIcon('stamp'),'かたどりスタンプ','スタンプ','wide',()=>{sfx('tap');setMode('bulk');selStamp=null}));
    if(S.swap)box.appendChild(chip(toolIcon('swap'),'つけかえトンカチ','つけかえ','wide',()=>{sfx('tap');setMode('bulk');selStamp=null}))}
  const blocks=STATUE<0?[]:BLOCKS.filter(id=>inv(id)>0&&!(mode==='bulk'&&WALLD.has(id)));
  if(mode==='bulk'&&STATUE>=0&&inv('spike')>0)blocks.push('spike');/* とげの罠も、なぞってまとめて置ける */
  if(blocks.length){lbl(box,'ブロック');for(const id of blocks){const n=inv(id);box.appendChild(chip(iconURL(id),BL[id].name,'×'+n,(n?'':'zero')+(sel===id&&!selStamp?' sel':''),pickItem(id)))}}
  if(mode==='build'){
    for(const [name,ids]of furnitureGroups(FURN.filter(id=>inv(id)>0))){lbl(box,name);for(const id of ids)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}
    {const g=GIFTF.filter(id=>inv(id)>0);if(g.length){lbl(box,'かざり・おみやげ');for(const id of g)box.appendChild(chip(iconURL(id),BL[id].name,'×'+inv(id),sel===id?'sel':'',pickItem(id)))}}/* カミサマのかざり・おまつりのちょうちん（依頼ボードでは作らない物） */
  }
  const plants=S.feat.plant?PLANTS.filter(id=>inv(id)>0):[];
  if(plants.length){lbl(box,'うえる');for(const id of plants)box.appendChild(chip(iconURL(id),iname(id),'×'+inv(id),(inv(id)?'':'zero')+(sel===id&&!selStamp?' sel':''),pickItem(id)))}
  if(mode==='build'&&cnt('farm')){const sd=Object.keys(CROPS).filter(k=>cropOn(k)&&cseed(k)>0);if(sd.length){lbl(box,'たね');for(const k of sd){const id='seed:'+k,n=cseed(k);box.appendChild(chip(iconURL(id),iname(id),'×'+n,(n?'':'zero')+(sel===id?' sel':''),pickItem(id)))}}}
  if(mode==='build'){
    const bLock=id=>STATUE>=0&&BREQ[id]&&lvOK(id)&&!elemCount(BREQ[id]),builds=BUILDS.filter(id=>usable(id)||bLock(id));/* 属性の子がいなくても、ならべて見せる */
    if(builds.length){lbl(box,'建てる');for(const id of builds)box.appendChild(chip(iconURL(id),BL[id].name,id==='statue'||(id==='watch'&&watchQ())?'むりょう':SP(BL[id].pc),(sel===id?'sel':'')+(bLock(id)?' zero':''),bLock(id)?()=>toast(ELEM[BREQ[id]].name+'のせいれいがいると建てられます'):pickItem(id),id==='tower'?TOWER_MAT():(id==='watch'&&watchQ())?null:BL[id].mat))}
    if(S.dig){lbl(box,'だんさ');for(const id of['dig','mound'])box.appendChild(chip(toolIcon(id),BL[id].name,SP(BL[id].pc),sel===id?'sel':'',pickItem(id)))}/* だんさスコップ：けずる・もるを、せいれいにたのむ（建てるのと同じ） */
  }
}
function gaugeHTML(r){
  const g=(l,v,c)=>`<span>${l}</span><div class="bar"><i style="width:${clamp(v,0,100)|0}%;background:${c}"></i></div>`;
  return `<div class="gauges">${g('おなか '+Math.round(r.hunger)+'/'+hMax(r),r.hunger/hMax(r)*100,r.hunger<25?'var(--danger)':'#ffb35c')}${g('たのしさ',r.fun,'var(--pink)')}${g(S.t-(r.eUp||-9)<3?'つかれ（回復中）':'つかれ',100-r.energy,S.t-(r.eUp||-9)<3?'#7ed99a':r.energy<25?'var(--danger)':'#c9a7ff')}</div>`;
}
let sheet=null,sheetArg=null;
function attrPop(k){
  const src={};const add=(name,v)=>{const r=src[name]||(src[name]={n:0,v:0});r.n++;r.v+=v};
  for(let j=0;j<W*H;j++){if(k==='water'&&S.ground[j]===1&&VILL[j])add('池・水べ（1マス0.3）',.3);const id=S.obj[j],b=BL[id];if(!b||b.kind==='block'||(FLOWERS.has(id)||id==='tree'||id==='fruit')&&isBud(j))continue;if((b.attr||{})[k]>0)add(b.name,b.attr[k])}
  const ov=el('<div style="position:absolute;inset:0;z-index:30;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:24px"></div>');
  const card=el('<div class="sec pxcard" style="background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:14px;width:100%;max-width:340px;max-height:70%;overflow:auto"></div>');
  const h=document.createElement('h3');h.textContent=ELEM[k].name+'の力：'+Number(ATTR[k].toFixed(1))+' / '+needFor(k);card.appendChild(h);
  for(const[name,r]of Object.entries(src))card.appendChild(rowEl(name+' ×'+r.n,'+'+Number(r.v.toFixed(1))));
  if(!Object.keys(src).length)card.appendChild(el('<p class="note">まだありません</p>'));
  card.appendChild(el('<p class="note">マップにあるものを集計（池・川は、家・物のまわり3マスだけ）。花と木は育ってから加算されます。</p>'));
  ov.appendChild(card);ov.onclick=()=>ov.remove();$('#app').appendChild(ov)}/* 属性の内訳ポップアップ */
function otakiPop(k){/* もちもの：素材をタップしたときのメニュー（おたきあげ）。数をえらんでたのむと、せいれいが素材箱から神殿へもっていく */const tr=MATTRADE[k]||5;let v=0;const o=el('<div style="position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(30,24,16,.45);padding:24px"><div class="pxcard" style="background:var(--panel);padding:16px 18px;max-width:320px;width:100%;color:var(--ink)"><b class="t" style="display:block;font-size:16px;margin-bottom:4px"></b><p class="note n" style="margin:0 0 10px"></p><div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:12px"><button class="btn m">−</button><b class="v" style="min-width:3em;text-align:center;font-size:16px"></b><button class="btn p">＋</button></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn x">とじる</button><button class="btn pri go"></button></div></div></div>');
  const upd=()=>{const n=S.mat[k]||0,mx=Math.floor(n/tr)*tr;v=Math.max(0,Math.min(v,mx));o.querySelector('.t').textContent=MATN[k]+' '+n+'こ';o.querySelector('.n').textContent='おたきあげ：'+tr+'こでパワー1';o.querySelector('.v').textContent=v;o.querySelector('.m').disabled=v<=0;o.querySelector('.p').disabled=v+tr>mx;const g=o.querySelector('.go');g.textContent='おたきあげ（パワー+'+v/tr+'）';g.disabled=!v};
  o.querySelector('.m').onclick=()=>{sfx('tap');v-=tr;upd()};o.querySelector('.p').onclick=()=>{sfx('tap');v+=tr;upd()};o.querySelector('.x').onclick=()=>{sfx('tap');o.remove()};o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('.go').onclick=()=>{if(!v||(S.mat[k]||0)<v)return;sfx('quest');S.mat[k]-=v;const Q=S.otakiQ||(S.otakiQ={});Q[k]=(Q[k]||0)+v;toast('おたきあげをたのんだ','good');o.remove();if(sheet==='inv')renderSheet()};
  v=(S.mat[k]||0)>=tr?tr:0;upd();document.body.appendChild(o)}
function openSheet(k,arg){if(NEWRES!=null&&!(k==='res'&&arg===NEWRES))unhold();if(k==='shop')shopSay=pick(S.pt<2?GOD_POOR:GOD_SHOP);sheet=k;sheetArg=arg;$('#sheetWrap').hidden=false;renderSheet()}
let resTab=0,tapPend=false,DLG_KEEP=false,NEWQ=[],NEWRES=null,HOLD=new Set();// 新しいせいれいが来たら、ステータスを見せてから進める
function unhold(){if(NEWRES!=null){HOLD.delete(NEWRES);const r=S&&S.res.find(x=>x.id===NEWRES);if(r)JUMP.set(r,performance.now())}NEWRES=null}
function closeSheet(){if(S&&S.flags){if(sheet==='shop'&&S.flags.traded)S.flags.tradedSeen=1;if(sheet==='menu'&&S.flags.oracleSet)S.flags.oracleSeen=1}/* おつげをえらんだあと、メニューをとじたら（もどってからとじても） */sheet=null;unhold();$('#sheetWrap').hidden=true;if(LVQ){const q=LVQ;LVQ=null;setTimeout(()=>{if(sheet)LVQ=q;else lvShow(...q)},250)}if(S&&S.flags.tapPend&&!S.flags.tapped&&!(S.pendTalk&&S.pendTalk.tapped)){talkOnce('tapped',[[GOD,'そうそう、そんな感じじゃ。おなかやたのしさが減っておったら、気にかけてやっておくれ。'],[POKO,'#joy|えへへ、見られちゃった。']],250);setTimeout(checkQuest,400)}}
function el(html){const d=document.createElement('div');d.innerHTML=html.trim();return d.firstElementChild}
/* たね：たね袋の絵＋作物の小さな絵 */
function seedIcon(k){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const a=ART.bag;if(a&&a.ok){const h=56,w=h*a.w/a.h;g.drawImage(a.img,(64-w)/2-4,4,w,h)}g.save();g.translate(30,26);g.scale(1.1,1.1);drawCrop(g,k,0,0,100,true);g.restore();return c.toDataURL()}
function cropIcon(k){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(2,2);drawCrop(g,k,0,0,100,true);return c.toDataURL()}
/* 説明は❓をおしたときだけ出す */
function helpify(r,text){if(!r||!text)return r;const tx=r.querySelector('.tx');if(!tx)return r;const q=document.createElement('button');q.className='qbtn';q.textContent='?';q.setAttribute('aria-label','説明');const nm=tx.querySelector('b').textContent;q.onclick=e=>{e.stopPropagation();sfx('tap');helpPop(nm,text)};tx.querySelector('b').appendChild(q);return r}
const GENRE_TAB={'家具':'家具','収納':'収納','遊び':'あそび道具','庭':'庭の家具','あかり':'あかり','ごはん':'料理家具','ワナ':'ワナ','家づくり':'家づくり','道・囲い':'道・囲い'};
function genreOf(id){const b=BL[id];if(!b)return'';if(b.cat==='living')return'ダイニング家具';if(b.cat==='cook')return'料理家具';for(const[t,ids]of CRAFT_TABS)if(ids.includes(id))return GENRE_TAB[t]||t;return''}/* アイテムのジャンル（名前のとなりに出す） */
const nameG=id=>{const g=genreOf(id);return BL[id].name+(g?'　【'+g+'】':'')};
const CAT_TAG={living:'リビング',cook:'キッチン',toy:'遊び',light:'あかり',env:'ガーデン'},TAB_TAG={'家具':'家具','収納':'収納','遊び':'遊び','庭':'ガーデン','あかり':'あかり','ごはん':'キッチン','ワナ':'ワナ','家づくり':'家づくり','道・囲い':'道・囲い'};
const TAGMAP={stool:'リビング,キッチン',chair:'リビング,キッチン',achair:'リビング',pouf:'リビング',stable:'リビング',ltable:'リビング',table:'リビング,キッチン',sofa1:'リビング',rug1:'リビング,寝室',rug2:'リビング,寝室',bed:'寝室',
tub:'キッチン,お風呂',sink:'キッチン',oven:'キッチン',bathtub:'お風呂',hotstone:'お風呂,ガーデン',crate:'収納',stor:'収納',mbox:'収納',shelf1:'収納,リビング',shelf2:'収納,かざり',cabinet:'収納,リビング',wshelf:'収納,かざり',
monstera:'かざり,リビング',wreath:'かざり,リビング',curtain1:'かざり,リビング,寝室',curtain2:'かざり,リビング,寝室',paint1:'かざり,リビング',paint2:'かざり,リビング',paint3:'かざり,リビング',
candle:'あかり,リビング',lantern:'あかり,リビング',flamp:'あかり,リビング',lamp:'あかり,ガーデン',torch:'あかり,ガーデン',
signpost:'ガーデン',hedge:'ガーデン',birdbath:'ガーデン,かざり',arch:'ガーデン,かざり',parasol:'ガーデン,遊び',noren:'ガーデン,かざり',bench:'ガーデン,リビング',jar:'ガーデン,キッチン',kamizo:'ガーデン',rockart:'ガーデン,かざり',chochin:'かざり',furin:'かざり',ema:'かざり',komainu:'かざり,ガーデン',kadomatsu:'かざり,ガーデン',vane:'ガーデン,かざり',basin:'ガーデン',
slide:'遊び,ガーデン',sandbox:'遊び,ガーデン',seesaw:'遊び,ガーデン',swing:'遊び,ガーデン',campfire:'遊び,あかり',fountain:'遊び,ガーデン',
spike:'ワナ',puddle:'ワナ',sticky:'ワナ',firetrap:'ワナ',gust:'ワナ',watch:'防衛',tower:'防衛',lighthouse:'あかり,防衛',stele:'防衛',well:'水まわり,ガーデン',windmill:'作業,ガーデン',lumber:'作業',quarry:'作業',statue:'神殿'};/* ジャンルのタグ（複数あるものは、すべて書く） */
function tagsOf(id){const b=BL[id];if(!b)return[];if(TAGMAP[id])return TAGMAP[id].split(',');const t=[];if(CAT_TAG[b.cat])t.push(CAT_TAG[b.cat]);for(const[n,ids]of CRAFT_TABS)if(ids.includes(id)){const g=TAB_TAG[n]||n;if(!t.includes(g)&&!(g==='家具'&&t.length))t.push(g)}if(b.play&&!t.includes('遊び'))t.push('遊び');if(!t.length&&b.kind==='furn')t.push('家具');return t}/* 説明に出す、ジャンルのタグ */
function tagsEl(id){const tg=tagsOf(id);if(!tg.length)return null;const d=document.createElement('div');d.className='tags';for(const g of tg){const sp=document.createElement('span');sp.className='tag';sp.textContent=g;d.appendChild(sp)}return d}
function helpPop(t,text){const o=$('#helpPop');let tg=[];{const id=Object.keys(BL).find(k=>BL[k].name===t);if(id)tg=tagsOf(id)}{const bx=o.querySelector('.tags');if(bx){bx.innerHTML='';for(const g of tg){const sp=document.createElement('span');sp.className='tag';sp.textContent=g;bx.appendChild(sp)}bx.hidden=!tg.length}}o.querySelector('b').textContent=t;o.querySelector('p').textContent=text;o.hidden=false}
function lostSec(body){if(!(S.lost||[]).some(q=>!q.unb)||!(S.mebuki>0))return;const ls=el('<div class="sec"><h3>消えてしまったせいれい（めぶきのしずく '+S.mebuki+'こ）</h3><div class="rows"></div></div>');/* めぶきのしずくで、よみがえらせる（「せいれい」と「だれを呼ぶ？」の両方から） */
  for(const q of S.lost.filter(q=>!q.unb)){const row=rowEl(q.name,ELEM[q.elem].name+'のせいれい',spiritPort(q.elem,96,q.vr));const bt=el('<button class="btn pri">よみがえらせる</button>');bt.onclick=()=>{if(!(S.mebuki>0))return;S.mebuki--;closeSheet();{const pv=S.summon;S.summon={rev:1,lost:q.name};doSummon();S.summon=pv}sfx('level')};row.appendChild(bt);ls.querySelector('.rows').appendChild(row)}
  body.appendChild(ls)}
function rowEl(title,desc,img,html){const r=el(`<div class="row">${img?'<img alt="">':''}<div class="tx"><b></b><small></small></div></div>`);if(img)r.querySelector('img').src=img;r.querySelector('b').textContent=title;if(html)r.querySelector('small').innerHTML=html+esc(desc||'');else r.querySelector('small').textContent=desc||'';return r}
/* カミサマの値段：花は高め、畑・果物の苗は買うごとに上がる（果物の苗は10から、1本ごとに+2） */
function shopPrice(id,k){let t=0;for(let i=0;i<k;i++){if(id==='farm')t+=4+Math.floor(((S.farmBuy||0)+i)/3);/* 畑は3こ買うごとに1ポイント上がる */else if(id==='fruit')t+=10+2*((S.fruitBuy||0)+i);else if(FLOWERS.has(id))t+=BL[id].sp;/* 花の種の値段は、表の sp */else t+=BL[id].cost}return t}
function renderSheet(){
  if(!sheet)return;const body=$('#sheetBody');body.innerHTML='';const T=$('#sheetTitle');
  if(sheet==='shop'){
    T.textContent='カミサマと交換';
    {const sb=el('<div class="godSay"><b>カミサマ</b><span></span></div>');sb.querySelector('span').textContent='「'+shopSay+'」';body.appendChild(sb)}
    body.appendChild(el('<p class="note">カミサマの持ち物と、パワーを交換します。</p>'));
    if(S.flags.traded&&QUESTS[S.quest]&&QUESTS[S.quest].id==='trade'){const eb=el('<button class="btn" id="shopEnd" style="width:100%;margin-bottom:8px">交換をおわる</button>');eb.onclick=()=>{sfx('next');closeSheet();checkQuest()};body.appendChild(eb)}// チュートリアル：買いおわったら帰る
    const sec=(t)=>{const d=el('<div class="sec"><h3></h3><div class="rows"></div></div>');d.querySelector('h3').textContent=t;body.appendChild(d);return d.querySelector('.rows')};
    const trade=()=>{shopSay=pick(GOD_BUY);S.flags.traded=true;sfx('furn');checkQuest();renderSheet();renderPalette()};
    const row=(rows,title,desc,img,done)=>{const r=rowEl(title,desc,img);if(done)r.classList.add('done');const bx=el('<div style="display:flex;flex-direction:column;gap:4px;flex:none"></div>');r.appendChild(bx);rows.appendChild(r);return bx};
    const btn=(bx,label,dis,fn,pri)=>{const b=el('<button class="btn'+(pri?' pri':'')+'"></button>');b.textContent=label;b.disabled=!!dis;if(fn)b.onclick=fn;bx.appendChild(b)};
    const r1=sec('ブロック・種・苗');
    for(const id of BLOCKS.filter(i=>S.unlocked[i]&&!BL[i].qty&&i!=='window').concat(S.feat.plant?PLANTS.filter(id=>lvOK(id)&&plantOK(id)):[])){const b=BL[id];
      const bx=row(r1,iname(id),'所持：'+inv(id),iconURL(id));helpify(bx.parentNode,withAttr(id,b.desc||''));
      for(const k of [1,5]){const c=shopPrice(id,k);btn(bx,'×'+k+'　'+SP(c),S.pt<c,()=>{S.pt-=c;if(id==='farm')S.farmBuy=(S.farmBuy||0)+k;if(id==='fruit')S.fruitBuy=(S.fruitBuy||0)+k;giveItem(id,k);trade()},k===1)}}
    if(cnt('farm')||inv('farm')){const rs=sec('作物のたね');for(const k in CROPS){if(!cropOn(k))continue;const c=CROPS[k];const bx=row(rs,c.name+'のたね','所持：'+cseed(k)+'・'+c.desc,seedIcon(k));for(const n of [1,5]){const cst=2*n;btn(bx,'×'+n+'　'+SP(cst),S.pt<cst,()=>{S.pt-=cst;giveItem('seed:'+k,n);trade()},n===1)}}}
    const r2=sec('新しいブロック');
    for(const id of BLOCKS){const b=BL[id];if(!b.unlock)continue;
      const bx=row(r2,b.name,'',iconURL(id),S.unlocked[id]);helpify(bx.parentNode,withAttr(id,b.desc));
      if(S.unlocked[id])btn(bx,'もらった',true);else if(!lvOK(id))btn(bx,'村Lv'+b.lv,true);else btn(bx,SP(b.unlock),S.pt<b.unlock,()=>{S.pt-=b.unlock;S.unlocked[id]=true;giveItem(id,2);toast(b.name+'をもらった！ おそなえ箱に2こ入った','good');trade()},1)}
    {const TL=WD===0?[['mover','ひっこしミトン','家具・建物をタップして、うつしたい所をタップすると、すぐそこへうつる','mover']]:WD===1?[['bulk','ひろびろハケ','指でなぞった範囲を、ブロックでまとめてぬれる。種もまとめて植えてもらえる','hake'],['swap','つけかえトンカチ','つながっている柵・塀・家の壁・道・床を、まとめてべつの種類にかえる。はずした物は、おそなえ箱にもどる','swap']]:[];/* 道具は土地ごと（草原：ひっこしミトン・だんさスコップ、火山：ひろびろハケ・つけかえトンカチ）。もらった道具は、ほかの土地でも使える */
      if(TL.length){const r3=sec('道具');for(const T of TL){const bx=row(r3,T[1],T[2],toolIcon(T[3]),S[T[0]]);if(S[T[0]])btn(bx,'もらった',true);else btn(bx,SP(3000),S.pt<3000,()=>{S.pt-=3000;S[T[0]]=true;applyFeats();toast(T[1]+'をもらった！「どうぐ」から使える','good');trade()},1)}
        if(WD===0){const b2=row(r3,'だんさスコップ','段差をけずる・もる工事を、せいれいにたのめる（1マスでパワー10）',toolIcon('scoop'),S.dig);if(S.dig)btn(b2,'もらった',true);else btn(b2,SP(1000),S.pt<1000,()=>{S.pt-=1000;S.dig=true;applyFeats();toast('だんさスコップをもらった！「おく」から使える','good');trade()},1)}}}/* だんさスコップは草原のカミサマから（ほかの土地でも使える） */
    if(WD===0&&(S.bossKills||0)>=1){const r5=sec('とくべつな交換'),bx=row(r5,'めぶきのしずく','消えてしまったせいれいを、よみがえらせる（所持：'+(S.mebuki||0)+'）',null);btn(bx,SP(400),S.pt<400,()=>{S.pt-=400;S.mebuki=(S.mebuki||0)+1;toast('めぶきのしずくをもらった','good');trade()},1)}/* 草原には、おまつりがない。しずくはカミサマから */
    if(WD===1&&(qAt('fest')||S.cleared)){const r5=sec('とくべつな交換');/* 火山のふもと：「おまつりをひらこう」のあとから、いつでもおまつり。めぶきのしずく・ごちそうは、おまつりの日に、せいれいの屋台で */
      {const done=S.festDay!=null&&S.festDay>=dayNo(),bx=row(r5,'おまつり','つぎの日が、おまつりになる',null,done);btn(bx,done?(S.festDay>dayNo()?'あしたはおまつり':'きょうはおまつり'):SP(200),done||S.pt<200,()=>{S.pt-=200;S.festDay=dayNo()+1;sfx('good');toast('あしたは、おまつり！','good');trade()},1)}/* たのんだつぎの日の朝7時に、おまつりがはじまる */
      }
    if(S.lv>=5||(S.bossKills||0)>=1||S.flags.hinoDown){const r6=sec('カミサマのかざり（日によってかわる）');const DECO=[['furin',120],['ema',150],['kadomatsu',180],['komainu',200]],d=dayNo();
      for(const[id,c]of[DECO[d%4],DECO[(d+1)%4]]){const bx=row(r6,BL[id].name,BL[id].desc+'（持っている数：'+(inv(id)||0)+'）',iconURL(id));btn(bx,SP(c),S.pt<c,()=>{S.pt-=c;giveItem(id,1);toast(BL[id].name+'をもらった','good');trade()},1)}
      }/* 終盤のパワーの使い道 */
  }else if(sheet==='inv'){
    T.textContent='もちもの';
    {/* 素材と食べ物も、ここで見られる */const MEMO={wood:'🪵',stone:'🪨',eda:'🥢',can:'🥫'},MOBJ={shina:'weed0g',kasa:'weed0k',kuru:'weed1g',chiri:'weed1k',funba:'weedc',kinoko:'kinoko'},mic=k=>ICONS[k]||(MOBJ[k]&&BL[MOBJ[k]]?iconURL(MOBJ[k]):null);
      const sec=(title,items,empty)=>{const g=el('<div class="grid"></div>'),hd=el('<b style="grid-column:1/-1;margin-top:4px"></b>');hd.textContent=title;g.appendChild(hd);if(!items.length){const p=el('<p class="note" style="grid-column:1/-1"></p>');p.textContent=empty;g.appendChild(p)}for(const[img,emo,nm,ct,tap]of items){const b=el(tap?'<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>':'<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');if(tap)b.onclick=()=>{sfx('tap');tap()};if(img)b.querySelector('img').src=img;else b.querySelector('img').replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',textContent:emo||'・'}));b.querySelector('.nm').textContent=nm;b.querySelector('.ct').textContent=ct;g.appendChild(b)}body.appendChild(g)};
      sec('素材（'+matTot()+'/'+matCap()+'）',Object.keys(MATN).filter(k=>(S.mat[k]||0)>0).map(k=>[mic(k),MEMO[k]||'🌿',MATN[k],S.mat[k],()=>otakiPop(k)]),'素材は、ありません');/* 素材をタップすると、おたきあげのメニュー */
      {const q=S.otakiQ||{},L=[];const add=o=>{for(const k in o)if(o[k])L.push(MATN[k]+o[k])};add(q);S.res.forEach(r=>r.otaki&&add(r.otaki));if(L.length){const p=el('<p class="note"></p>');p.textContent='おたきあげまち：'+L.join('・');body.appendChild(p)}}
      sec('食べ物（'+S.food+'/'+foodCap()+'）',Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0).map(k=>[ICONS[k]||null,FOODS[k].e,FOODS[k].name,S.fs[k]]),'食べ物は、ありません')}
    const grid=el('<div class="grid"></div>');grid.appendChild(Object.assign(el('<b style="grid-column:1/-1;margin-top:10px"></b>'),{textContent:'おそなえ箱'}));
    const groups=[['ブロック',BLOCKS.filter(id=>inv(id)>0)],['うえる',PLANTS.filter(id=>inv(id)>0)],...furnitureGroups(FURN.filter(id=>inv(id)>0))];
    const ids=groups.flatMap(([,items])=>items);
    for(const [name,ids]of groups){if(!ids.length)continue;const heading=el('<b style="grid-column:1/-1;margin-top:8px"></b>');heading.textContent=name;grid.appendChild(heading);for(const id of ids){
      const b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>');
      b.querySelector('img').src=iconURL(id);b.querySelector('.nm').textContent=iname(id);b.querySelector('.ct').textContent=inv(id);
      if(!inv(id))b.classList.add('zero');if(sheetArg===id)b.classList.add('sel');
      b.onclick=()=>{sheetArg=id;renderSheet()};grid.appendChild(b)}}
    for(const k of Object.keys(CROPS).filter(k=>cropOn(k)&&cseed(k)>0)){const sid='seed:'+k,b=el('<button class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></button>');/* たねも、ほかのアイテムと同じくアイコンで */
      b.querySelector('img').src=seedIcon(k);b.querySelector('.nm').textContent=CROPS[k].name+'のたね';b.querySelector('.ct').textContent=cseed(k);if(!cseed(k))b.classList.add('zero');if(sheetArg===sid)b.classList.add('sel');b.onclick=()=>{sheetArg=sid;renderSheet()};grid.appendChild(b)}
    if((S.mseed||0)>0){const b=el('<button class="slot"><span class="ct"></span><img src="'+seedIco()+'" style="width:40px;height:40px;display:block;margin:0 auto"><span class="nm">ふしぎな種</span></button>');b.querySelector('.ct').textContent=S.mseed;if(sheetArg==='mseed')b.classList.add('sel');b.onclick=()=>{sheetArg='mseed';renderSheet()};grid.appendChild(b)}
    body.appendChild(grid);
    if(sheetArg==='mseed'&&(S.mseed||0)>0){const d=el('<div class="sec"><h3></h3><p class="story">せいれいにあげると、能力のどれかが+1（25%で+2）上がる。それぞれ+6まで。</p><div class="rows"></div></div>');d.querySelector('h3').textContent='ふしぎな種・所持：'+S.mseed;
      for(const r of S.res){const row=rowEl(r.name,ELEM[r.elem].name+'のせいれい'),bt=el('<button class="btn pri">あげる</button>');row.appendChild(bt);bt.onclick=()=>giveSeed(r);d.querySelector('.rows').appendChild(row)}body.appendChild(d)}
    if(typeof sheetArg==='string'&&sheetArg.startsWith('seed:')&&CROPS[sheetArg.slice(5)]){const c=CROPS[sheetArg.slice(5)],d=el('<div class="sec"><h3></h3><p class="story"></p></div>');d.querySelector('h3').textContent=c.name+'のたね・所持：'+cseed(sheetArg.slice(5));d.querySelector('.story').textContent=c.desc;const ub=el('<button class="btn pri" style="margin-top:10px">畑にまく</button>');ub.disabled=cseed(sheetArg.slice(5))<1;const sid=sheetArg;ub.onclick=()=>{sel=sid;selStamp=null;closeSheet();setMode('build');$('#palette').hidden=true;toast('たねをまきたい畑をタップ')};/* 置くウィンドウは開かずに、そのまま畑をタップ */d.appendChild(ub);body.appendChild(d);return}
    const id=ids.includes(sheetArg)?sheetArg:null;
    if(id){const b=BL[id];
      const d=el('<div class="sec"><h3></h3><p class="story"></p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"></div></div>');
      d.querySelector('h3').textContent=iname(id)+'・所持：'+inv(id);d.querySelector('.story').textContent=b.desc||'';
      const use=el('<button class="btn pri">これを置く</button>');use.disabled=!inv(id);use.onclick=()=>{sel=id;selStamp=null;closeSheet();setMode('build')};d.lastElementChild.appendChild(use);
      body.appendChild(d)}
  }else if(sheet==='craft'){
    T.textContent='依頼ボード';
    body.appendChild(el('<p class="note">'+(orderLock()?'いまは「'+BL[orderLock()].name+'」だけたのめます。':'できたものはおそなえ箱に入ります。')+'</p>'));
    const bd=el('<div class="board"></div>');
    for(let n=0;n<boardMax();n++){const o=S.orders[n];
      if(!o){bd.appendChild(el('<div class="paper empty">あき</div>'));continue}
      const w=S.res.find(r=>r.id===o.worker);const p=el(`<div class="paper" style="--r:${[-2,1.5,-1,1,-1.5][n]}deg"><img alt=""><b></b><small></small><div class="bar"><i></i></div></div>`);
      p.querySelector('img').src=iconURL(o.type);p.querySelector('b').textContent=BL[o.type].name+'をつくって';p.querySelector('small').textContent=w?w.name+'が作っています':makerOf(o.type)?ELEM[BL[o.type].maker].name+'のせいれいを待っています':'作り手を待っています';
      {const cx=el('<button class="cx" aria-label="やめる">×</button>');cx.onclick=e=>{e.stopPropagation();cancelOrder(o.id)};p.appendChild(cx)}/* 依頼をやめる */
      const bi=p.querySelector('.bar i');bi.style.width=Math.min(100,o.prog/o.need*100)+'%';bi.style.background='#e0a43a';bd.appendChild(p)}
    body.appendChild(bd);
    const s2=el('<div class="sec"><h3>依頼を書く</h3><div class="ctabs"></div><div class="rows"></div></div>');
    CRAFT_TABS.forEach(([nm],i)=>{const t=el('<button class="ctab'+(i===craftTab?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{craftTab=i;renderSheet()};s2.querySelector('.ctabs').appendChild(t)});
    for(const id of CRAFT_TABS[craftTab][1]){const b=BL[id];
      if(!recipeKnown(id)||!lvOK(id)&&!S.recipes[id])continue;/* 思いついていない・レベル不足は出さない */
      /* レシピをまだ知らない */
      const r=helpify(rowEl(b.name+(b.qty?'×'+b.qty:'')+'　所持：'+inv(id),'',iconURL(id),b.mat?matNeedHTML(b.mat)+(b.sand?'やすらぎの砂'+b.sand+' ':'')+' ':''),withAttr(id,b.desc));
      if(makerOf(id)){const has=elemCount(b.maker)>0,mk=el('<span class="pxpill" style="display:inline-flex;align-items:center;vertical-align:middle;margin-right:4px;border-radius:9px;padding:0 5px 0 1px;font-size:10px;line-height:16px;color:#fff"><img alt="" style="width:16px;height:16px;margin:0"><b style="font-weight:700"></b></span>');mk.classList.add(has?'pm-'+b.maker:'pm-none');/* 色は、わくの絵（index.html の .pxpill.pm-〇〇） */mk.querySelector('img').src=spiritPort(b.maker,48);if(!has)mk.querySelector('img').style.filter='grayscale(1) opacity(.7)';mk.querySelector('b').textContent=ELEM[b.maker].name+(has?'':'・いない');r.querySelector('small').prepend(mk)}/* 作るせいれいの属性：アイコンで短く */
      const bt=el('<button class="btn pri"></button>');
      if(!lvOK(id)){bt.textContent='村Lv'+b.lv;bt.disabled=true;r.classList.add('done')}else{bt.textContent='はる　'+SP(b.pc);bt.disabled=S.pt<b.pc||S.orders.length>=boardMax()||!matOK(b.mat)||!!(orderLock()&&orderLock()!==id);bt.onclick=()=>orderFurn(id)}
      r.appendChild(bt);s2.querySelector('.rows').appendChild(r)}
    if(!s2.querySelector('.rows').children.length)s2.querySelector('.rows').appendChild(el('<div class="empty" style="padding:8px;opacity:.7">まだ作れるものがない</div>'));
    body.appendChild(s2);
    if(S.feat.inv){const ib=el('<button class="btn">もちものを見る</button>');ib.onclick=()=>openSheet('inv');body.appendChild(ib)}
  }else if(sheet==='vill'){
    T.textContent='村のようす';
    /* 項目ごとにまとめる：レベル／目標の進みぐあい／たくわえ／きょう */
    const L=S.lv,a=LV_XP[L-1],b=L>=maxLv()?a:LV_XP[L]??a,ic=q=>{const n=document.querySelector('.hud '+q);return n?n.cloneNode(true).outerHTML:''},bar=(v,c)=>'<div class="vlBar"><i style="width:'+clamp(v,0,1)*100+'%;background:'+c+'"></i></div>';
    const V=el('<div class="vl"></div>');
    V.appendChild(el('<div class="vlHero"><div class="vlLv">'+ic('.lvb svg')+'<small>村レベル</small><b>'+L+'</b></div><div class="vlHw">'+(b>a?bar((S.totalPt-a)/(b-a),'#7ee08a')+'<small>つぎのレベルまで　あと '+Math.max(0,Math.ceil(b-S.totalPt))+'</small>':bar(1,'#7ee08a')+'<small>さいこうレベル</small>')+'</div></div>'));
    const sh=Math.min(3,S.shards||0);
    V.appendChild(el('<div class="vlSec"><h4>目標</h4><div class="vlRow"><span>みどりのマス</span><b>'+GRASSN+'<small> / '+GRASS_GOAL+'</small></b></div>'+bar(GRASSN/GRASS_GOAL,'#8fd16a')+'<div class="vlRow"><span>ヌシのかけら</span><b class="vlSh">'+[0,1,2].map(k=>'<i class="'+(k<sh?'on':'')+'"></i>').join('')+'</b></div></div>'));
    const tile=(icon,lb,v,sub,br)=>'<div class="vlT"><div class="hd">'+icon+'<span>'+lb+'</span></div><div class="v">'+v+'</div>'+(br||'')+(sub?'<small>'+sub+'</small>':'')+'</div>';
    const fc=foodCap(),mc=matCap();
    V.appendChild(el('<div class="vlGrid">'+tile(ic('.stk[title="食料"] svg'),'食料',S.food+'<small> / '+fc+'</small>','',bar(fc?S.food/fc:0,'#f3d27a'))+tile('','木材・石材',(()=>{const im=[...document.querySelectorAll('.hud .stk[title="木材・石材"] .ic')].map(n=>{const c=n.cloneNode(true);c.classList.add('vlMi');return c.outerHTML});return (im[0]||'')+(S.mat.wood||0)+'<span style="display:inline-block;width:10px"></span>'+(im[1]||'')+(S.mat.stone||0)+(bambooOn()?'<span style="display:inline-block;width:10px"></span>'+(im[2]||'')+(S.mat.bamboo||0):'')})(),'素材箱 '+matTot()+' / '+mc,bar(mc?matTot()/mc:0,'#c9a27a'))+tile(ic('.stat[title="パワー"] img'),'パワー',S.pt,'ためた合計 '+Math.floor(S.totalPt))+tile(ic('.stat[title="せいれい"] svg'),'せいれい',S.res.length+'<small> 人</small>','')+'</div>'));
    V.appendChild(el('<div class="vlDay"><span>きょう</span><b>'+(S.today?DAYEV[S.today][0]+' '+DAYEV[S.today][1]:(S.rain?'☔ 雨':'ふつうの日'))+'</b></div>'));
    body.appendChild(V);
  }else if(sheet==='attrdetail'){
    T.textContent='属性の内訳';
    const sources={};for(const k of ELEM_KEYS)sources[k]={};
    const add=(k,name,v)=>{const a=sources[k];if(!a)return;const r=a[name]||(a[name]={n:0,v:0});r.n++;r.v+=v};
    for(let j=0;j<W*H;j++){if(S.ground[j]===1&&VILL[j])add('water','池・水べ（1マス0.3）',.3);const id=S.obj[j],b=BL[id];if(!b||b.kind==='block'||FLOWERS.has(id)&&isBud(j))continue;for(const k in b.attr||{})if(b.attr[k]>0)add(k,b.name,b.attr[k])}
    body.appendChild(el('<p class="note">マップにあるものを集計（池・川は、家・物のまわり3マスだけ）。花は咲いてから加算されます。</p>'));
    for(const k of ELEM_KEYS){const sec=el('<div class="sec"></div>');const h=document.createElement('h3');h.textContent=ELEM[k].name+'の力：'+Number(ATTR[k].toFixed(1));sec.appendChild(h);for(const [name,r]of Object.entries(sources[k]))sec.appendChild(rowEl(name+' ×'+r.n,'+'+Number(r.v.toFixed(1))));if(!Object.keys(sources[k]).length)sec.appendChild(el('<p class="note">まだありません</p>'));body.appendChild(sec)}
  }else if(sheet==='stock'){/* そうこ：いま、なにがいくつあるか */
    T.textContent='そうこ';
    const box=(title,n,cap,items,empty)=>{const sec=el('<div class="sec stockSec"><div class="stockHead"><h3></h3><span class="stockN"></span></div><div class="gauge stockBar"><i></i></div><div class="grid"></div></div>');sec.querySelector('h3').textContent=title;sec.querySelector('.stockN').textContent=cap>0?n+' / '+cap:'箱がありません';sec.querySelector('.stockBar i').style.width=(cap>0?Math.min(100,n/cap*100):0)+'%';const g=sec.querySelector('.grid');
      if(!items.length){const p=el('<p class="note" style="grid-column:1/-1"></p>');p.textContent=empty;g.appendChild(p)}
      for(const[img,emo,nm,ct]of items){const b=el('<div class="slot"><span class="ct"></span><img alt=""><span class="nm"></span></div>');if(img)b.querySelector('img').src=img;else{const im=b.querySelector('img');im.replaceWith(Object.assign(document.createElement('span'),{className:'stockEmo',textContent:emo}))}b.querySelector('.nm').textContent=nm;b.querySelector('.ct').textContent=ct;g.appendChild(b)}body.appendChild(sec)};
    const fk=Object.keys(FOODS).filter(k=>(S.fs[k]||0)>0),raw=fk.filter(k=>!FOODS[k].dish),dish=fk.filter(k=>FOODS[k].dish),fi=k=>[ICONS[k]||null,FOODS[k].e,FOODS[k].name,S.fs[k]];
    box('食料箱',S.food,foodCap(),[...raw.map(fi),...dish.map(fi)],'食べ物は、ありません');
    const mk=Object.keys(S.mat).filter(k=>(S.mat[k]||0)>0&&MATN[k]);box('素材箱',matTot(),matCap(),mk.map(k=>[ICONS[k]||null,'',MATN[k],S.mat[k]]),'素材は、ありません');
    if(S.sand){const p=el('<p class="note"></p>');p.textContent='やすらぎの砂：'+S.sand+'（コワイノの落とし物。素材箱には入らない）';body.appendChild(p)}
    const hold=S.res.filter(r=>heldN(r)>0);if(hold.length){const p=el('<p class="note"></p>');p.textContent='せいれいが運んでいるとちゅう：'+hold.map(r=>r.name+'（'+[...Object.entries(r.carry&&typeof r.carry==='object'?r.carry:{}).map(([k,n])=>FOODS[k].name+n),...Object.entries(r.cmat||{}).map(([k,n])=>MATN[k]+n)].join('・')+'）').join('、');body.appendChild(p)}
  }else if(sheet==='people'){
    T.textContent='せいれい '+S.res.length+'人';
    const a=el('<div class="sec"><h3>この土地の属性（満ちた次の朝、神殿の「！」からなかまを呼べる）</h3><div class="attr"></div></div>');const g=a.querySelector('.attr');
    for(const k of ELEM_KEYS){const v=ATTR[k],n=needFor(k),p=Math.min(100,v/n*100);
      g.insertAdjacentHTML('beforeend',`<span class="el" style="background:${ELEM[k].col}">${ELEM[k].name}</span><div class="bar"><i style="width:${p|0}%;background:${ELEM[k].col}"></i></div><small>${Math.floor(v)}/${n}</small>`);
      for(const c of[...g.children].slice(-3)){c.style.cursor='pointer';c.onclick=()=>{sfx('tap');attrPop(k)}}}/* 属性をタップすると、内訳のポップアップ */
    body.appendChild(a);
    body.appendChild(el('<p class="note">属性をタップすると内訳が見られます。目もりに届いた次の朝、神殿の「！」から呼べます。いくつか届いていれば、呼ぶ属性をえらべます。池・植物・家具・建物から属性の力が集まります。</p>'));
    const rows=el('<div class="rows"></div>');
    for(const r of S.res){const row=el(`<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>`);
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中');
      row.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));row.onclick=()=>{closeSheet();setMode('look');centerOn(r.x*TS,r.y*TS)};rows.appendChild(row)}
    body.appendChild(rows);
    lostSec(body);
  }else if(sheet==='grave'){
    const j=sheetArg,d=S.dyn[j]||{},nm=d.name||'せいれい';T.textContent=nm+'のお墓';
    body.appendChild(el('<p class="story">'+nm+'は、なかまが神殿へはこんで、おみおくりしてくれます。<br>よみがえらせられるのは、おみおくりのあとです。</p>'));
  }else if(sheet==='house'){
    const h=HOUSES[sheetArg],L=h?houseRes(h):[];if(!h)return closeSheet();
    {const cap=houseCap(h),C=houseComfort(h);T.textContent='おうち';
     const cs=el('<div class="sec"><h3>住み心地</h3><p class="comfy"><span class="stars"></span><b></b></p><div class="recs"></div><p class="note" style="margin-top:8px"></p></div>');
     cs.querySelector('.stars').textContent=comfyStars(C.v);cs.querySelector('b').textContent=C.v+' / '+COMFMAX;
     for(const[a,b]of[['ベッド',C.bed+' / '+cap+'こ'],['家具・かざり',C.kinds+'しゅるい'],['床',C.floorPct+'%'],['いまの人数',L.length+'人']]){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;cs.querySelector('.recs').appendChild(d)}
     cs.querySelector('.note').textContent=C.over?'ベッドが多すぎて、きゅうくつ！ 住み心地が大きく下がる':'つかれのとれる速さ・起きたときのパワー：'+(.6+C.v/100*.9).toFixed(1)+'倍'+(C.v>=180?'・ぐっすり眠れて、朝にたのしさ+10':C.v<90?'・たのしさ-5':'');/* 効果は数字で */
     body.appendChild(cs)}
    {const bs=[...h.inside].filter(j=>BEDSET.has(S.obj[j]));if(bs.length){const sec=el('<div class="sec"><h3>ベッド</h3><div class="rows"></div></div>');bs.forEach((j,k)=>{const o=bedOwner(j),row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');row.querySelector('.dot').style.cssText=o?'background:#f6f1e6 url('+spiritPort(o.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[o.elem].col:'background:#efe6d2';row.querySelector('b').textContent='ベッド'+(k+1);row.querySelector('small').textContent=o?o.name+'のベッド':'だれでも使える';row.onclick=()=>openSheet('bed',j);sec.querySelector('.rows').appendChild(row)});body.appendChild(sec)}}
    if(!L.length)body.appendChild(el('<p class="story">いまは、だれもいない</p>'));
    const rows=el('<div class="rows"></div>');
    for(const r of L){const row=el(`<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>`);
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中')+'・好きな家具：'+BL[likeF(r)].name+(hasLikeF(h,r)?' ♥あり'+(COMFY[likeF(r)]?'（その家具のポイント2倍）':''):'');
      row.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));row.onclick=()=>openSheet('res',r.id);rows.appendChild(row)}
    body.appendChild(rows);
  }else if(sheet==='clear'){T.textContent='守護の台座';
    const rows=el('<div class="rows"></div>');for(const[t,ok]of(WD||cnt('tower')>=1?clearConds():towerConds())){const r=el('<div class="row"><div class="tx"><b></b></div></div>');r.querySelector('b').textContent=(ok?'✓ ':'・')+t;if(ok)r.classList.add('done');rows.appendChild(r)}body.appendChild(rows);
  }else if(sheet==='bed'){const j=sheetArg;if(!BEDSET.has(S.obj[j]))return closeSheet();/* よぞらのベッドも */
    const o=bedOwner(j);T.textContent='ベッド';

    const rows=el('<div class="rows"></div>'),set=id=>{const B=S.bedOwn||(S.bedOwn={});for(const k in B)if(B[k]===id)delete B[k];if(id==null)delete B[j];else B[j]=id;sfx('next');renderSheet()};
    {const row=el('<button class="row" style="text-align:left;width:100%"><span class="dot" style="background:#efe6d2"></span><div class="tx"><b></b><small></small></div></button>');row.querySelector('b').textContent=(o?'':'✓ ')+'だれでも';row.querySelector('small').textContent='あいていれば、だれでも眠れる';row.onclick=()=>set(null);rows.appendChild(row)}
    for(const r of S.res){const mb=myBed(r),row=el('<button class="row" style="text-align:left;width:100%"><span class="dot"></span><div class="tx"><b></b><small></small></div></button>');
      row.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
      row.querySelector('b').textContent=(o===r?'✓ ':'')+r.name+'  Lv'+rLv(r);row.querySelector('small').textContent=ELEM[r.elem].name+'のせいれい・'+(mb===j?'このベッド':mb>=0?'ほかのベッドがある':'ベッドなし');
      row.onclick=()=>set(r.id);rows.appendChild(row)}
    body.appendChild(rows);
  }else if(sheet==='res'){
    const r=S.res.find(q=>q.id===sheetArg);if(!r)return closeSheet();
    const isNew=sheetArg===NEWRES;T.textContent=isNew&&r.back?r.name+'がもどってきた！  Lv'+rLv(r):(isNew?'あたらしいなかま！ ':'')+r.name+'  Lv'+rLv(r);
    const box=el(`<div class="row"><span class="dot"></span><div class="tx"><b></b><small></small></div></div>`);
    box.querySelector('.dot').style.cssText='background:#f6f1e6 url('+spiritPort(r.elem,96,r.vr)+') center/86% no-repeat;box-shadow:inset 0 0 0 2px '+ELEM[r.elem].col;
    box.querySelector('b').textContent=ELEM[r.elem].name+'のせいれい・'+(r.act?ACT_LBL[r.act.type]||'':'考え中');
    box.querySelector('small').textContent=r.hunger<20?'おなか：危険！':r.hunger<50?'おなか：少なめ':'';
    box.querySelector('.tx').insertAdjacentHTML('beforeend',gaugeHTML(r));body.appendChild(box);
    if(!isNew){const sy=el('<p class="story" style="margin:6px 0 2px"></p>');sy.textContent='「'+sayLine(r)+'」';body.appendChild(sy)}
    {const lv=rLv(r);
     const tb=el('<div class="ctabs"></div>');['ステータス','プロフィール','強化'].forEach((nm,i)=>{const t=el('<button class="ctab'+(i===resTab?' on':'')+'"></button>');t.textContent=nm;t.onclick=()=>{resTab=i;sfx('next');renderSheet()};tb.appendChild(t)});body.appendChild(tb);/* ステータスと、得意・好きなものは別のタブ */
     if(resTab===2){const sec=el('<div class="sec"></div>'),cost=15+10*(r.boost||0),B=r.bst||(r.bst={}),ST=[['atk','攻撃力'],['pow','作業スピード'],['spd','移動速度'],['sta','スタミナ'],['cap','持てる数']].filter(([k])=>k!=='atk'||r.elem==='fire');/* 攻撃力は火の子だけ */
       for(const[k,nm]of ST){const n=B[k]||0;const row=el('<div class="row" style="align-items:center"><div class="tx"><b></b><small></small></div></div>');row.querySelector('b').textContent=nm+'  +'+n+(n>=6?'（最大）':'');sec.appendChild(row)}
       const left=ST.filter(([k])=>(B[k]||0)<6),bw=el('<div class="row" style="justify-content:center"><button class="btn pri"></button></div>'),b=bw.querySelector('button');
       b.textContent=left.length?'パワーをそそぐ（'+SP(cost)+'）':'ぜんぶ最大';b.disabled=!left.length||S.pt<cost;
       b.onclick=()=>{if(S.pt<cost)return toast('パワーが足りません（'+SP(cost)+'）');const L=ST.filter(([k])=>(B[k]||0)<6);if(!L.length)return;S.pt-=cost;const[k,nm]=L[(Math.random()*L.length)|0],n=B[k]||0,inc=Math.min(Math.random()<.75?1:2,6-n);B[k]=n+inc;/* どこが上がるかはランダム */
         if(k==='pow'||k==='spd'||k==='sta')r.vr[k]=Math.round(((r.vr[k]||1)+.1*inc)*100)/100;
         r.boost=(r.boost||0)+1;RSC.delete(r);addFloat(r.x,r.y-1.6,nm+'+'+inc,'#9fe8ff');upFx(r,nm,'+'+inc,inc>1);renderSheet()};
       bw.style.gap='8px';bw.style.flexWrap='wrap';sec.appendChild(bw);
       {const sb=el('<button class="btn"></button>'),sn=S.mseed||0;sb.textContent='ふしぎな種をあげる（'+sn+'こ）';sb.disabled=sn<1;sb.onclick=()=>giveSeed(r);bw.appendChild(sb)}/* ふしぎな種も、パワーのとなりからあげられる */
       body.appendChild(sec)}/* パワーで、せいれいを強化 */
     else if(resTab===1){const pf=el('<div class="sec"><div class="stats"></div></div>'),pg=pf.querySelector('.stats');
       for(const[k,v]of[['得意なこと',ELEM[r.elem].can],['好きな遊び',LIKES[r.like]],['にがてな遊び',Object.keys(NIGATE[r.elem]||{}).map(k=>BL[k].name).join('・')||'とくにない'],['好きな家具',BL[likeF(r)].name],['好きな料理',FOODS[favDish(r)].name],['なかよし',(bestMate(r)||{}).name||'まだいない'],['村に来た日',r.came?r.came+'日目':'はじめから'],['作ったもの',(r.made||0)+'こ'],['追いはらった「コワイノ」',(r.beat||0)+'体'],['ベッド',myBed(r)>=0?'じぶんのベッドがある':'きまっていない']]){const d=el('<div class="stat" style="display:block"><span style="display:block"></span><b style="display:block;text-align:left;margin-top:2px"></b></div>');d.firstChild.textContent=k;d.lastChild.textContent=v;pg.appendChild(d)}
       body.appendChild(pf)}
     else{
     const st=el('<div class="sec"><div class="stats"></div></div>'),g=st.querySelector('.stats');
     for(const tk of[(r.vr||{}).tr,isKey(r.name)?'kizuna':null]){const T2=TRAITS[tk];if(T2){const d=el('<div class="stat" style="display:block"><span style="display:block">特性</span><b style="display:block;text-align:left;margin-top:2px"></b><small style="display:block;color:var(--sub,#888);margin-top:2px"></small></div>');d.querySelector('b').textContent=T2[0];d.querySelector('small').textContent=T2[1];g.appendChild(d)}}/* キーキャラは「きずな」も持つ */
     const Z=rStat(r,lv);for(const[k,v]of[['攻撃力',Z.atk?String(Z.atk):'なし'],['作業スピード',String(Math.floor(Z.work))],['移動速度',String(Math.floor(Z.move))],['スタミナ',String(Math.floor(Z.sta))],['持てる数',heldN(r)+' / '+Z.cap]])g.appendChild(el('<div class="stat"><span>'+k+'</span><b>'+v+'</b></div>'));
     body.appendChild(st)}}
    if(isNew){const nb=el('<button class="btn pri">つぎへ</button>');nb.onclick=()=>{sfx('next');closeSheet();dialog([[r.name,helloLine(r)]],()=>checkQuest())};/* 来た子が、ひとことあいさつ */body.appendChild(nb);return}
    const b=el('<button class="btn pri">おやつをあげる（食料1）</button>');b.disabled=S.food<1;b.onclick=()=>{const it=takeFood(1,'raw')[0];endAct(r);r.meal={u:.3*fullN(r),pt:1,e:FOODS[it]?FOODS[it].e:'🍙',items:[it]};startAct(r,null,'eat',-1,{snack:1});addFloat(r.x,r.y-1.6,'わーい！','#ffd38a');sfx('eat');closeSheet()}/* おやつ：よろこんで、その場で食べる */;body.appendChild(b);
  }else if(sheet==='night'){const N=S.ns;if(!N)return closeSheet();T.textContent=N.trial?(N.trialOK?'試練をのりこえた！':'試練の夜'):N.rw?'夜をぶじに守りきった！':'ゆうべの守り';
    const g=el('<div class="stats"></div>');
    for(const[k,v]of[['来た「コワイノ」',N.n+'体'],['追いはらった',N.kill+'体'],['おそわれたせいれい',N.hurt?N.hurt+'回':'なし'],['こわされた柵・設備',N.broke?N.broke+'こ':'なし'],['ぬすまれたもの',N.lost.length?N.lost.join('、'):'なし']].concat(N.rw?[['ごほうび','パワー+'+N.rw+'・みんなのたのしさ+10']]:[]).concat(N.trialOK?[['試練のごほうび','パワー+60・めぶきのしずく']]:[]))g.appendChild(el('<div class="stat"><span>'+k+'</span><b>'+v+'</b></div>'));
    body.appendChild(g);
    if(N.boss===1&&!N.trial)body.appendChild(el('<p class="note">オオカゲは、追いはらえないまま朝になった。</p>'));
  }else if(sheet==='summon'){T.textContent='だれを呼ぶ？';
    body.appendChild(el('<p class="note">力が目もりに届いている属性から、ひとり呼べます。のこりは、つぎの朝にまた呼べます。</p>'));
    const rows=el('<div class="rows"></div>');
    for(const c of sumCands()){const row=rowEl(ELEM[c.el].name+'のせいれい',c.cap?'もう村にいっぱいいる':'属性の力 '+Math.floor(c.v)+' / '+c.n+(c.ok?'':'（まだ足りない）'),spiritPort(c.el,96));if(!c.ok)row.style.opacity=.55;
      const bt=el('<button class="btn pri">呼ぶ</button>');bt.disabled=!c.ok||!S.summon;bt.onclick=()=>{if(!S.summon)return;S.summon={elem:c.el,pick:1};closeSheet();doSummon()};row.appendChild(bt);rows.appendChild(row)}
    body.appendChild(rows);
    lostSec(body);/* しずくを持っていたら、ここからもよみがえらせられる */
  }else if(sheet==='enemy'){const e=S.enemies.find(q=>q.id===sheetArg);if(!e||e.dead){closeSheet();return}const D=EN[e.type];
    T.textContent=D.name;
    const FEAT={yama:'火山のふもとの最後の夜に来る。温泉を冷やす',boss2:'ヌシ様をむかえる準備ができたあと、オオカゲのかわりに来る。とても強い',basic:'せいれいをおそう',fast:'足が速い',thief:'食料や素材をぬすむ',brute:'体力が多い',boss:WD?'5日目の夜、そのあと3日ごとに来る。追いはらうと「ヌシのかけら」があらわれ、そのあとは5日ごとに来る。当たると目をまわす':'クエストが出てから3日目の夜、そのあと2日ごとに来る。一度追いはらうと、そのあとは5日ごと。とても強い。当たると目をまわす'};
    const st=el('<div class="sec"><h3>ステータス</h3><div class="stats"></div></div>'),g=st.querySelector('.stats');
    for(const[k,v]of[['体力',Math.max(0,Math.ceil(e.hp))+' / '+e.max],['移動速度','×'+D.sp],['壁への攻撃',D.atk+'秒ごとに1'],['せいれいへの攻撃','おなか −'+D.hitN],['特徴',FEAT[e.type]||'']])g.appendChild(el('<div class="stat"><span style="white-space:nowrap">'+k+'</span><b>'+v+'</b></div>'));
    body.appendChild(st);
  }else if(sheet==='farm'){const j=sheetArg,d=S.dyn[j];if(!d||S.obj[j]!=='farm'){closeSheet();return}
    const cr=CROPS[cropK(d)];T.textContent=cr?'畑：'+cr.name:'畑';
    body.appendChild(el('<p class="story">'+(!cr?'まだ、なにも植えていない':d.sown===false?(d.paid||cseed(cropK(d))>0?'種まきを待っている':'たねがなくて植えられない'):d.g>=100?'収穫できる':'収穫まであと'+Math.ceil((100-d.g)/(100/cr.days)-.01)+'日・きょうの水やり'+(d.wet>0?'ずみ':'まだ'))+'</p>'));
    if(cr){const n=cr.yield+(NEARMILL.has(j)?1:0)+(NEARFLOWER.has(j)?1:0)+(S.today==='hosaku'?1:0);const yr=el('<div class="sec"><div class="stats"><div class="stat"><span>収穫できる数</span><b></b></div></div></div>');yr.querySelector('b').textContent=n+'こ'+(S.res.some(q=>!q.hidden&&q.elem==='wood')?'（木のせいれいがとると+1）':'');body.appendChild(yr)}/* いま収穫すると、いくつとれるか */
    if(!cr){const b2=el('<button class="btn pri">おそなえ箱からたねをえらぶ</button>');b2.onclick=()=>{sfx('tap');openSheet('inv',Object.keys(CROPS).filter(cropOn).map(k=>'seed:'+k).find(id=>inv(id)>0)||'seed:imo')};body.appendChild(b2)}
  }else if(sheet==='food'){T.textContent='食料箱';
    body.appendChild(el('<p class="story">'+S.food+'/'+foodCap()+'</p>'));
    const g=el('<div class="rows"></div>');for(const k in FOODS){const n=S.fs[k]||0;if(!n)continue;const f=FOODS[k];const rc=RECIPES.find(R=>R.out===k),r=helpify(rowEl((icURL(f.e)?'':f.e+' ')+f.name+'　×'+n,(f.dish?'料理・':'')+'おなか'+f.v+(f.pw?'・パワー+'+f.pw:'')+(f.fx?'・'+f.fx:''),icURL(f.e)),rc?DISHD(rc):RAWD(k));g.appendChild(r)}body.appendChild(g);
  }else if(sheet==='oven'){
    const j=sheetArg;if(S.obj[j]!=='oven')return closeSheet();if(!S.ovenSet)S.ovenSet={};const cur=S.ovenSet[j];T.textContent='かまど';
    body.appendChild(el('<p class="story">作る料理をえらぶと、火のせいれいが食料箱の材料で作ってくれる。</p>'));
    {const m=ovenMul(j),pc=Math.round((1-m)*100);body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('料理の速さ（いま）',pc>0?'料理の時間 -'+pc+'%（まわり3マスの料理家具）':'ふつう（水おけ・流し台など料理家具をまわり3マスに置くと、早くなる）'))}/* かまど：いまの料理の速さ */
    const rows=el('<div class="rows"></div>');
    for(const R of RECIPES){const F=FOODS[R.out],need=needTxt(R),has=Object.keys(R.need).every(k=>(S.fs[k]||0)>=R.need[k]);
      const r=helpify(rowEl((icURL(F.e)?'':F.e+' ')+F.name+(cur===R.out?'（作っている）':''),'材料：'+need+' / 時間：'+R.time+'分'+(F.fx?' / 効果：'+F.fx:'')+(has?'':'・材料が足りない'),icURL(F.e)),DISHD(R));
      const b=el('<button class="btn"></button>');b.textContent=cur===R.out?'やめる':'これを作る';if(cur===R.out)b.classList.add('pri');
      b.onclick=()=>{if(cur===R.out)delete S.ovenSet[j];else S.ovenSet[j]=R.out;sfx('tap');renderSheet()};r.appendChild(b);if(!has&&cur!==R.out){r.style.filter='grayscale(1)';r.style.opacity='.55'}/* 材料が足りない料理はグレー */rows.appendChild(r)}
    body.appendChild(rows);
  }else if(sheet==='manual'){
    T.textContent='ひでんのしょ';
    {const bk=el('<button class="btn back">‹ メニュー</button>');bk.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(bk)}
    body.appendChild(el(`<div class="sec"><h3>あそびかた</h3><p class="story">あなたはこの土地の新しい<b>守り神</b>。せいれいをふやして土地をよみがえらせ、<b>守護の台座</b>を建てて<b>ヌシ様</b>をむかえましょう。<br>せいれいが食べたり眠ったり遊んだりすると<b>せいれいパワー</b>がたまります。<br>せいれいのおそなえは<b>おそなえ箱</b>に入ります。家具は<b>依頼ボード</b>でたのみます。カミサマが来たら<b>交換</b>ができます。<br>夜は<b>「コワイノ」</b>に気をつけて。<br>1本指でドラッグ：移動／2本指：ズーム。</p></div>`));/* あそびかたも、ひでんのしょにまとめる */
    {const CAT=[['あそびかた',[]],['せいれい',['せいれいのようす','ステータス','属性と得意なこと']],['くらし・家具',['家具の種類','くらし']],['守り神',['守り神のちから']],['夜と戦い',['夜と「コワイノ」']]];
      if(!CAT.some(c=>c[0]===MANC))MANC='あそびかた';
      const bar=el('<div class="mtabs" style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0"></div>');for(const c of CAT){const b=el('<button class="btn"></button>');b.textContent=c[0];if(c[0]===MANC)b.classList.add('pri');b.onclick=()=>{sfx('tap');MANC=c[0];openSheet('manual')};bar.appendChild(b)}
      body.insertBefore(bar,body.children[1]);
      const how=body.querySelector('.story').parentNode;how.hidden=MANC!=='あそびかた';
      const cur=CAT.find(c=>c[0]===MANC);
      for(const[t,items]of MANUAL){if(!cur[1].includes(t))continue;const sec=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sec.querySelector('h3').textContent=t;for(const[a,b]of items)sec.querySelector('.rows').appendChild(rowEl(a,b));body.appendChild(sec)}
      if(cur[0]==='くらし・家具'){const sec=el('<div class="sec"><h3>スポット</h3><div class="rows"></div></div>');const on=new Set();for(const t of SPOTJ.values())for(const k of t)on.add(k);for(const sp of SPOTS)sec.querySelector('.rows').appendChild(rowEl(sp.n+(on.has(sp.k)?'（村にある）':''),sp.how+'を、まわり3マスに置く。'+sp.eff));body.appendChild(sec)}}/* スポットの一覧 */
    {const b=el('<button class="btn">もどる</button>');b.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(b)}
  }else if(sheet==='furn'){const j=sheetArg,o=S.obj[j]||(S.rug||{})[j];if(!o||!BL[o])return closeSheet();T.textContent=BL[o].name;{const te=tagsEl(o);if(te)body.appendChild(te)}
    body.appendChild(rowEl(BL[o].name,withAttr(o,BL[o].desc||''),iconURL(o)));
    if(BL[o].hp&&S.obj[j]===o)body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('じょうぶさ',Math.floor(S.hp[j]??BL[o].hp)+' / '+BL[o].hp));/* 建物などのじょうぶさ */
    {const R=rangeOf(o,j);if(R&&!BL[o].env&&!BENCHES.has(o))body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('効果のはんい','まわり'+(R.cells||R.r)+'マス（「みる」でタップすると、色で出る）'))}
    if(SEATS.includes(o)&&spotW(j)>=0)body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('つりができるいす','池のそばのいす。せいれいが、ここにすわってつりをする。ふつうの水べより、魚がつれやすい（水のせいれいは、さらによくつれる）'));/* 池のそばの椅子＝釣りスポット */
    {const t=SPOTJ.get(j);if(t){for(const I of SPOTI)if(t.has(I.sp.k)&&spotCells(I).includes(j))spotFx(I)}/* 家具をタップしたときも、そのスポットを点線でかこむ */if(t)for(const sp of SPOTS){if(!t.has(sp.k))continue;body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('スポット：'+sp.n,sp.eff))}}/* スポット */
    if(o==='table'){const h=roomOf(j);let n=0;if(h)for(const q of h.inside){const oo=S.obj[q];if(oo&&BL[oo]&&BL[oo].cat==='living')n+=BL[oo].dw||1}if(h)for(const oo of rugsIn(h.inside))n+=BL[oo].dw||1;const bon=h?DINEPT[Math.min(6,n)]:0;
      body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('ここで食べたときのパワー（いま）',h?'+'+bon+'（家の中の食卓 +1・ダイニング家具で +'+(DINEPT[Math.min(6,n)]-1)+(n/2<3?'。ダイニング家具をふやすと、まだふえる':'。いちばん多い')+'）':'家の外なので、ふえない（家の中に置くと +1、ダイニング家具でさらに +3 まで）'))}/* 食卓：いまのパワーのボーナス */
    if(BENCHES.has(o)){const ev=ENVG?Math.min(12,Math.max(ENVG[j]||0,ENVG[j+1]||0)):0;/* ベンチ：まわりのかざりで上がった回復 */
      body.appendChild(el('<div class="rows"></div>')).appendChild(rowEl('すわって休むと（1時間あたり）','つかれ −'+(Math.round((20+ev*.36)*10)/10)+' / たのしさ +'+(Math.round((4.8+ev*.36)*10)/10)+(ev>0?'':'（生垣・パラソルなどをまわりに置くと上がる）')))}

  }else if(sheet==='score'){const sc=S.score||calcScore();T.textContent='クリアスコア';
    body.appendChild(el('<div style="text-align:center;margin:6px 0 10px"><div style="font-size:44px;font-weight:900;color:#e0a43a;line-height:1">'+sc.rank+'</div><div style="font-size:24px;font-weight:800;margin-top:4px">'+sc.tot+' てん</div></div>'));
    const g=el('<div class="rows"></div>');for(const[a,b,c]of sc.parts)g.appendChild(rowEl(a+'：'+b,(c>=0?'+':'')+c+' てん'));body.appendChild(g);
    const b=el('<button class="btn pri" style="width:100%;margin-top:10px">とじる</button>');b.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(b);
  }else if(sheet==='heatv'){const j=sheetArg,t=st2();T.textContent=j===D1?'手前の熱の装置':'奥の熱の装置';
    const P=tx=>{body.appendChild(el('<p class="story"></p>')).textContent=tx};
    const dir=j===D1?t.d1:t.d2;
    if(j===D2&&!t.d2fix){const clr=BVOL.every(q=>S.obj[q]!=='boulder'),ok=clr&&(S.mat.stone||0)>=8&&(S.mat.wood||0)>=5&&shLeft()>=1;
      P('こわれて止まっている。直すには、石材8・木材5と、ヌシのかけら1つがいる。'+(clr?'':'まわりの大岩をどかさないと、近づけない。')+(shLeft()?'':'（ヌシのかけらをまだ持っていない）'));
      const b=el('<button class="btn pri">直す</button>');b.disabled=!ok;b.onclick=()=>{S.mat.stone-=8;S.mat.wood-=5;S.usedSh=(S.usedSh||0)+1;t.d2fix=1;sfx('shard');burst(j,'block');toast('かけらが熱を通した！ 奥の装置が動きだした','good');dirty=true;closeSheet();checkQuest()};body.appendChild(b)}
    else if(t.hvb[j]){P('ヒノオオカゲにこわされて、止まっている。石材3で直せる。（温泉は、直せばまたあたたかくなる）');const b=el('<button class="btn pri">直す（石材3）</button>');b.disabled=(S.mat.stone||0)<3;b.onclick=()=>{S.mat.stone-=3;delete t.hvb[j];dirty=true;sfx('level');burst(j,'block');toast('装置を直した','good');dirty=true;closeSheet()};body.appendChild(b)}
    else{P(j===D1?'火山の熱を、左（西の温泉）と右（奥の装置）のどちらに流すか切りかえる。':'熱を、左（奥の温泉）と右（けむり穴）のどちらに流すか切りかえる。');
      P('いまは「'+(dir===0?'左':'右')+'」に流している。');
      const b=el('<button class="btn pri">向きをかえる</button>');b.onclick=()=>{if(j===D1)t.d1=1-t.d1;else t.d2=1-t.d2;sfx('tap');renderSheet();checkQuest()};body.appendChild(b)}
    const c2=el('<button class="btn">とじる</button>');c2.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(c2);
  }else if(sheet==='stall'){const st=festStalls().find(t=>t.x===sheetArg);if(!st)return closeSheet();const M=STALLM[st.el],kp=S.res.find(r=>r.id===st.id);T.textContent=M.nm+'の屋台';
    {const sb=el('<div class="godSay"><b></b><span></span></div>');sb.querySelector('b').textContent=kp?kp.name:'';sb.querySelector('span').textContent='「'+(kp?chatTone(pick(STALLSAY),kp):pick(STALLSAY))+'」';body.appendChild(sb)}
    body.appendChild(el('<p class="note">店番の子と、パワーで交換します。</p>'));const rows=el('<div class="rows"></div>');body.appendChild(rows);
    const add=(title,desc,img,label,dis,fn)=>{const r=rowEl(title,desc,img),b=el('<button class="btn pri"></button>');b.textContent=label;b.disabled=!!dis;b.onclick=()=>{fn();sfx('furn');renderSheet();renderPalette()};r.appendChild(b);rows.appendChild(r)};
    for(const it of M.L){const c=it[it.length-1];
      if(it[0]==='f'){const f=FOODS[it[1]],room=foodCap()-S.food;add(f.e+' '+f.name+'×5',f.fx||'',null,room<5?'食料箱がいっぱい':SP(c),room<5||S.pt<c,()=>{S.pt-=c;addFood(it[1],5);toast(f.name+'を5つもらった','good')})}
      else if(it[0]==='m'){const nm=MATN[it[1]],room=matCap()-matTot();add(nm+'×10','素材箱に入る（いま'+(S.mat[it[1]]||0)+'）',null,room<10?'素材箱がいっぱい':SP(c),room<10||S.pt<c,()=>{S.pt-=c;S.mat[it[1]]=(S.mat[it[1]]||0)+10;S.gotMat&&(S.gotMat[it[1]]=(S.gotMat[it[1]]||0)+10);toast(nm+'を10こもらった','good')})}
      else if(it[0]==='mebuki'){if(!((S.bossKills||0)>=1||S.flags.hinoDown))continue;add('めぶきのしずく','消えてしまったせいれいを、よみがえらせる（所持：'+(S.mebuki||0)+'）',null,SP(c),S.pt<c,()=>{S.pt-=c;S.mebuki=(S.mebuki||0)+1;toast('めぶきのしずくをもらった','good')})}
      else if(it[0]==='chochin')add(BL.chochin.name,BL.chochin.desc+'（持っている数：'+(inv('chochin')||0)+'）',iconURL('chochin'),SP(c),S.pt<c,()=>{S.pt-=c;giveItem('chochin',1);toast(BL.chochin.name+'をもらった','good')})}
  }else if(sheet==='travel'){T.textContent='守護の台座';
    const nx=WORLDS[WD+1];body.appendChild(el('<p class="story"></p>')).textContent='台座から、ほかの土地へ行ける。'+(nx?'つぎは「'+nx.name+'」。':'');
    const b=el('<button class="btn pri">マップをひらく</button>');b.onclick=()=>{sfx('tap');save();closeSheet();showMaps()};body.appendChild(b);
    const c=el('<button class="btn">やめる</button>');c.onclick=()=>{sfx('tap');closeSheet()};body.appendChild(c);
  }else if(sheet==='watch'){
    const j=sheetArg,o=S.obj[j];if(o!=='watch'&&o!=='yogan')return closeSheet();
    const yg=o==='yogan',TB=yg?YOGAN:WATCH,L=S.hp['L'+j]||1,st=TB[L];T.textContent=BL[o].name;
    body.appendChild(el(`<p class="story">Lv${L}：威力 ${st.dmg}${yg?'（まわり '+st.sdmg+'）':''}・射程 ${st.range}マス・${st.cd}分ごとに${yg?'火の玉':'光の矢'}を放つ</p>`));
    const U=(yg?YUP:WUP)[L];if(U){const n=TB[L+1];body.appendChild(el(`<p class="note">強化するとLv${L+1}：威力 ${n.dmg}${yg?'（まわり '+n.sdmg+'）':''}・射程 ${n.range}マス・${n.cd}分ごと<br>${SP(U.pc)}・${matTxt(U.mat)}${U.sand?'・やすらぎの砂'+U.sand:''}</p>`));
      const b=el('<button class="btn pri">強化する</button>');b.onclick=()=>{if(S.pt<U.pc)return toast('パワーが足りません（'+SP(U.pc)+'）');if(!matOK(U.mat))return toast('素材が足りません（'+matTxt(U.mat)+'）');if(U.sand&&(S.sand||0)<U.sand)return toast('やすらぎの砂が足りません（'+U.sand+'）');S.pt-=U.pc;for(const k in U.mat)S.mat[k]-=U.mat[k];if(U.sand)S.sand-=U.sand;S.hp['L'+j]=L+1;dirty=true;try{rebuildStatic()}catch(e){}sfx('kankan');burst(j,'block','offer');toast(BL[o].name+'をLv'+(L+1)+'に強化した','good');renderSheet()};body.appendChild(b)}
    else body.appendChild(el('<p class="note">これ以上は強化できない</p>'));
  }else if(sheet==='menu'){
    T.textContent=WORLDS[WD].name;
    const MI=[['oracle','🍃','おつげ'],['manual','📜','ひでんのしょ'],['goal','🎯','目標'],['record','📔','思い出帳'],['maps','🧭','マップ選択'],['zukan','👻','コワイノ図鑑'],['settings','⚙️','設定'],['support','☕','応援する']];
    const sub=MI.find(m=>m[0]===sheetArg);
    if(!sub){/* メニューはアイコンを並べるだけ。タップで中身を開く */
      body.appendChild(el(`<p class="story">みどりのマス <b>${GRASSN}</b>・村レベル ${S.lv}・せいれい ${S.res.length}人</p>`));
      const g=el('<div class="mgrid"></div>');
      for(const[k,ic,nm]of MI){const b=el('<button class="mtile"><span class="mi"></span><span class="mn"></span></button>');if(ICONS['m_'+k])b.querySelector('.mi').innerHTML='<img alt="" src="'+ICONS['m_'+k]+'">';else b.querySelector('.mi').textContent=ic;b.querySelector('.mn').textContent=nm;b.dataset.menu=k;
        b.onclick=()=>{sfx('tap');if(k==='manual')return openSheet('manual');if(k==='maps'){save();closeSheet();return showMaps()}openSheet('menu',k)};g.appendChild(b)}
      body.appendChild(g);return}
    T.textContent=sub[2];
    {const bk=el('<button class="btn back">‹ メニュー</button>');bk.onclick=()=>{sfx('tap');openSheet('menu')};body.appendChild(bk)}
    if(sheetArg==='oracle'){
      {const sec=el('<div class="sec"><h3>おつげ（きょういちにち）</h3><div class="rows"></div></div>'),rw=sec.querySelector('.rows');
       for(const k of [null,...Object.keys(ORACLE).filter(oracleOK)]){const O=k?ORACLE[k]:{name:'じゆうにすごす',e:'🍃'},on=(S.oracle||null)===k;const b=el('<button class="btn"></button>');b.dataset.oracle=k||'';b.textContent=O.e+' '+O.name+(on?'（いま）':'');if(on)b.classList.add('pri');
         b.onclick=()=>{S.oracle=k;if(k){S.flags.oracleSet=true;checkQuest()}sfx('quest');toast(k?'おつげ：'+O.name:'おつげをやめた','good');for(const r of S.res)if(!r.hidden&&r.act&&r.act.stage==='do'&&IDLE_ACTS.includes(r.act.type))endAct(r);renderSheet()};rw.appendChild(b)}
       body.appendChild(sec)}
    }else if(sheetArg==='goal'&&S.cleared){
      body.appendChild(el('<p class="note">この土地は守られた。ここからは、クエストや目標で村をそだてよう。たっせいすると、パワーがもらえます（夜のあいだは、朝にもらえます）。</p>'));
      if(WD!==FREE){const a=AFTERQ[S.aq||0],qs=el('<div class="sec"><h3>クエスト</h3><div class="rows"></div></div>');
        if(!a)qs.querySelector('.rows').appendChild(rowEl('✓ ぜんぶたっせい','カミサマからのおねがいは、ぜんぶかなえた'));
        else if(S.aqOn===(S.aq||0))qs.querySelector('.rows').appendChild(rowEl('・'+a.t,aqProg(a)+'　ごほうび パワー+'+a.rw+'。'+a.how));
        else qs.querySelector('.rows').appendChild(rowEl('・つぎのクエスト','昼になると、カミサマからおねがいがある'));
        body.appendChild(qs);
        const d=S.daily,ds=el('<div class="sec"><h3>きょうの目標（毎朝かわる）</h3><div class="rows"></div></div>');
        if(d)for(const k of d.k){const g=DAILYG.find(x=>x.k===k),ok=!!d.done[k],r=rowEl((ok?'✓ ':'・')+g.t,ok?'たっせい':'いま '+Math.min(g.n,dailyNow(g,d))+' / '+g.n+'　ごほうび パワー+'+g.rw);if(ok)r.classList.add('done');ds.querySelector('.rows').appendChild(r)}
        else ds.querySelector('.rows').appendChild(rowEl('・あしたの朝から','毎朝、2つの目標が出る'));
        body.appendChild(ds)}
      const f=el('<div class="sec"><h3>長い目標</h3><div class="rows"></div></div>');for(const g of [...FREEG.filter(g=>!(S.freeDone||{})[g.k]),...FREEG.filter(g=>(S.freeDone||{})[g.k])]){const ok=!!(S.freeDone||{})[g.k],r=rowEl((ok?'✓ ':'・')+g.t,ok?'たっせい':'いま '+g.now()+'　ごほうび パワー+'+g.rw);if(ok)r.classList.add('done');f.querySelector('.rows').appendChild(r)}body.appendChild(f);
      const tr=el('<div class="sec"><h3>「コワイノ」の試練</h3><p class="note">ふだんより多く、強い「コワイノ」と、オオカゲがいっしょにやってくる夜。ぜんぶ追いはらうと、パワー+60と「めぶきのしずく」。</p></div>');
      const b=el('<button class="btn pri" style="width:100%"></button>');b.textContent=S.trial?'今夜、試練の夜がくる':'今夜、試練をうける';b.disabled=!!S.trial||isNight();b.onclick=()=>{S.trial=true;sfx('night');toast('今夜は「コワイノの試練」','warn');renderSheet()};tr.appendChild(b);
      tr.appendChild(el('<p class="note">のりこえた試練：'+(S.trials||0)+'回</p>'));body.appendChild(tr);subSec(body);/* クリア後は、新しい目標を上に。サブクエストは下に */
    }else if(sheetArg==='goal'){subSec(body,true);
    }else if(sheetArg==='zukan'){
      const seen=S.seenEn||{},K=S.enKills||{},ks=Object.keys(EN).filter(k=>ZUKAN[k]);
      body.appendChild(el(`<p class="story">会ったコワイノ ${ks.filter(k=>seen[k]).length} / ${ks.length}</p>`));
      for(const k of ks){const D=EN[k],ok=seen[k],row=el('<div class="zk"><canvas width="144" height="144"></canvas><div class="zt"><b></b><p></p><small></small></div></div>');
        const c=row.querySelector('canvas').getContext('2d');c.scale(2,2);if(!ok)c.globalAlpha=.18;try{drawShade(c,k,36,64,(k==='boss'||k==='hino'||k==='yama'||k==='boss2'?.46:.56),1,{t:0,dot:1})}catch(_){}
        row.querySelector('b').textContent=ok?D.name:'？？？';row.querySelector('p').textContent=ok?ZUKAN[k]:'まだ会ったことがない';
        row.querySelector('small').textContent=ok?'体力 '+D.hp+'・はやさ '+D.sp+'・追いはらった '+(K[k]||0)+'回':'';if(ok&&S.cleared&&ZURA[k]){const u=el('<p class="note"></p>');u.textContent='もとのすがた：'+ZURA[k];row.querySelector('.zt').appendChild(u)}/* クリア後は、もとの闇のせいれいのすがたが読める */body.appendChild(row)}
    }else if(sheetArg==='record'){
      const st=el('<div class="sec"><h3>これまで</h3><div class="recs"></div></div>'),rw=st.querySelector('.recs');
      for(const[a,b]of[['すごした日',dayNo()+'日'],...(S.score?[['クリアスコア',S.score.rank+'（'+S.score.tot+'てん）']]:[]),['のりこえた夜',(S.nights||0)+'回'],['いまのせいれい',S.res.length+'人'],['よんだせいれい',(S.summons||0)+'人'],['消えてしまったせいれい',(S.deaths||0)+'人'],
        ['追いはらった「コワイノ」',(S.kills||0)+'体'],['オオカゲ',(S.bossKills||0)+'回'],['ヌシのかけら',(S.shards||0)+'つ'],['めぶきのしずく',(S.mebuki||0)+'こ'],['ためたせいれいパワー',Math.floor(S.totalPt||0)+''],['みどりのマス',GRASSN+'マス'],['村レベル','Lv'+S.lv],['たっせいした目標',S.quest+'こ']]){const d=el('<div class="st"><span></span><b></b></div>');d.firstChild.textContent=a;d.lastChild.textContent=b;rw.appendChild(d)}
      body.appendChild(st);
      /* 思い出帳ときろくをひとつに：日ごとのできごと */
      const E=[];(S.memo||[]).forEach(([d,e,t],i)=>E.push([d,i,e+' '+t]));(S.log||[]).forEach(([d,t],i)=>E.push([d,1e4+i,t]));E.sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
      if(!E.length)body.appendChild(el('<p class="note">はじめての出来事が、ここにのこります。</p>'));
      let cur=null,rows=null;for(const[d,,t]of E){if(d!==cur){cur=d;const sc=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sc.querySelector('h3').textContent=d+'日め';rows=sc.querySelector('.rows');body.appendChild(sc)}rows.appendChild(rowEl(t,''))}
    }else if(sheetArg==='talks'){
      const H=(S.dlog||[]).slice().reverse();if(!H.length)body.appendChild(el('<p class="note">まだありません</p>'));
      const rows=el('<div class="rows"></div>');for(const[w,t]of H){const r=el('<div class="row"><div class="tx"><b></b><small style="white-space:normal"></small></div></div>');r.querySelector('b').textContent=w||'';r.querySelector('small').textContent=t;rows.appendChild(r)}body.appendChild(rows);
    }else if(sheetArg==='memo'){
      const M=(S.memo||[]).slice().reverse();if(!M.length)body.appendChild(el('<p class="note">はじめての出来事が、ここにのこります。</p>'));
      let cur=null,rows=null;for(const[d,e,t]of M){if(d!==cur){cur=d;const sc=el('<div class="sec"><h3></h3><div class="rows"></div></div>');sc.querySelector('h3').textContent=d+'日め';rows=sc.querySelector('.rows');body.appendChild(sc)}rows.appendChild(rowEl(e+' '+t,''))}
    }else if(sheetArg==='support'){/* 広告とコーヒー（まだ準備中） */
      {const sec=el('<div class="sec"><div style="display:flex;flex-direction:column;gap:8px"></div></div>');for(const t of['📺 広告をみる','☕ 作者にコーヒーをおごる']){const b=el('<button class="btn"></button>');b.textContent=t;b.onclick=()=>toast('準備中です');sec.firstChild.appendChild(b)}body.appendChild(sec)}
    }else if(sheetArg==='settings'){
      {const t=el('<div class="sec"><h3>テスト用</h3></div>'),b=el('<button class="btn"></button>');b.textContent='5倍速：'+(TESTM?'オン':'オフ');b.onclick=()=>{TESTM=!TESTM;try{localStorage.setItem('hk-test',TESTM?'1':'')}catch(_){}if(!TESTM&&S.speed>3)S.speed=1;renderSheet();applyFeats()};t.appendChild(b);body.appendChild(t)}/* テストのときだけ5倍速 */
      const so=el('<div class="sec"><h3>おと</h3><div style="display:flex;gap:8px;flex-wrap:wrap"></div></div>');
      for(const[k,l]of[['bgm','音楽'],['sfx','効果音']]){const b=el('<button class="btn"></button>');b.textContent=l+'：'+(SND[k]?'オン':'オフ');b.onclick=()=>{audioInit();setSnd(k,!SND[k]);renderSheet()};so.lastElementChild.appendChild(b)}
      body.appendChild(so);
      {const vs=el('<div class="sec"><h3>音量</h3></div>');for(const[k,l]of[['bv','音楽'],['sv','効果音'],['vv','せいれいの声']]){const row=el('<label style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="width:7em;flex:none"></span><input type="range" min="0" max="100" step="5" style="flex:1"><b style="width:3em;text-align:right"></b></label>');row.querySelector('span').textContent=l;const ip=row.querySelector('input'),bv=row.querySelector('b');ip.value=Math.round((SND[k]??1)*100);bv.textContent=ip.value;ip.addEventListener('input',()=>{bv.textContent=ip.value;audioInit();setSnd(k,ip.value/100)});vs.appendChild(row)}body.appendChild(vs)}
      body.appendChild(el('<p class="note">効果音：効果音ラボ／夜の環境音：音人／木を切る音：minetest_game より（Sheyvan, CC0）</p>'));
      {const ts=el('<div class="sec"><h3>テスト用</h3></div>');const b=el('<button class="btn"></button>');b.textContent='倍速（砂時計なし）：'+(TESTSPD?'オン':'オフ');b.onclick=()=>{TESTSPD=!TESTSPD;try{KV.setItem('hakoniwa-test',TESTSPD?'1':'0')}catch(e){}applyFeats();renderSheet()};ts.appendChild(b);body.appendChild(ts)}
      const rs=el('<div class="sec"><h3>データ</h3></div>');const rb=el('<button class="btn">最初からやりなおす</button>');
      rb.onclick=()=>{if(rb.dataset.ok){closeSheet();newGame(WD)}/* いまのステージだけをやりなおす */else{rb.dataset.ok=1;rb.textContent='本当にやりなおす（もう一度タップ）';rb.style.borderColor='var(--danger)'}};rs.appendChild(rb);body.appendChild(rs);
      {const section=el('<div class="sec"><h3>セーブ</h3><p class="note"></p></div>');
        const status=section.querySelector('p');
        const update=()=>{const st=KV.status();status.textContent=st.available?''+(st.lastSaved?' 最終保存：'+new Date(st.lastSaved).toLocaleTimeString('ja-JP'):''):'このブラウザに保存できません。下の「書き出す」でセーブファイルを保存してください。';};
        const button=el('<button class="btn pri">今すぐセーブ</button>');button.onclick=()=>{const ok=save();update();toast(ok?'セーブしました':'このブラウザには保存できません',ok?'good':undefined)};
        update();section.appendChild(button);body.appendChild(section)}
      /* セーブの書き出し・読みこみ（ブラウザのデータが消えたときのそなえ） */
      {const sv=el('<div class="sec"><h3>セーブの書き出し</h3><p class="note">ファイルにして保存できます。別の端末でも「読みこむ」で続きから遊べます。読みこむと、ファイルに含まれる土地のセーブを上書きします。ブラウザのデータを消す前に書き出してください。</p></div>');
        const ex=el('<button class="btn">書き出す</button>'),im=el('<button class="btn">読みこむ</button>'),fi=el('<input type="file" accept=".json,application/json" hidden>');
        ex.onclick=async()=>{save();const d={app:'hakoniwa',v:1,at:Date.now(),saves:{}};try{for(const k of SAVE_KEYS.filter(Boolean)){const t=KV.getItem(k);if(t)d.saves[k]=t}}catch(e){}
          for(let w=0;w<LIVE.length;w++)if(LIVE[w]&&!d.saves[SAVE_KEYS[w]]&&LIVE[w].introSeen)d.saves[SAVE_KEYS[w]]=JSON.stringify(LIVE[w]);
          const txt=JSON.stringify(d),dt=new Date(),nm='hakoniwa-save-'+dt.getFullYear()+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0')+'.json';
          let dl=null;try{dl=window.claude&&await window.claude.use('downloads')}catch(e){}
          if(dl){try{await dl.save({filename:nm,data:new Blob([txt],{type:'application/json'})});toast('セーブを書き出した','good')}catch(e){if(e&&e.code!=='declined')toast('書き出せませんでした')}return}
          try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=nm;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000);toast('セーブを書き出した','good')}catch(e){toast('書き出せませんでした')}};
        im.onclick=()=>fi.click();
        fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;if(f.size>20*1024*1024){toast('ファイルが大きすぎます');fi.value='';return}const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d||d.app!=='hakoniwa'||d.v!==1||!d.saves||typeof d.saves!=='object'||Array.isArray(d.saves))throw 0;
            const entries=Object.entries(d.saves).filter(([k])=>SAVE_KEYS.includes(k));if(!entries.length)throw 0;
            for(const [k,value] of entries){if(typeof value!=='string')throw 0;const g=JSON.parse(value);if(!g||g.v!==8||(g.world||0)!==SAVE_KEYS.indexOf(k)||!g.introSeen||!Array.isArray(g.res)||!Array.isArray(g.orders)||!Array.isArray(g.ground)||(g.ground.length!==W*H&&g.ground.length!==OW*OW)||!Array.isArray(g.obj)||(g.obj.length!==W*H&&g.obj.length!==OW*OW)||!g.flags)throw 0}
            const before=entries.map(([k])=>[k,KV.getItem(k)]);NOSAVE=true;
            if(!entries.every(([k,value])=>KV.setItem(k,value))){for(const [k,value]of before){if(value===null)KV.removeItem(k);else KV.setItem(k,value)}NOSAVE=false;toast('ブラウザに保存できないため読みこめません');return}
            toast('読みこみました。はじめからひらきなおします','good');setTimeout(()=>location.reload(),900)}catch(e){toast('このファイルは読みこめません')}};rd.readAsText(f)};
        ex.style.marginBottom='8px';sv.appendChild(ex);sv.appendChild(im);sv.appendChild(fi);body.appendChild(sv)}
    }
  }
}
const DLGQ=[];let DLGGAP=0,DLGTAP=-1e9,DLGCUR='';const DLGWAIT=3000;/* 会話がおわってから、つぎのべつの会話を出すまでの間（ミリ秒） */
function dlgGap(){DLGGAP=performance.now()+DLGWAIT;setTimeout(dlgNext,DLGWAIT+20)}
function dlgNext(){const d=$('#dialog');if(!d.hidden||!DLGQ.length)return;const w=DLGGAP-performance.now();if(w>0){setTimeout(dlgNext,w+20);return}{const q=DLGQ.shift();dialog(q[0],q[1],q[2],q[3])}}
/* 会話の演出：shake=画面がゆれる／flash=白く光る／dim=少し暗くなる／beat=ひと呼吸おく */
function dashDemo(){/* フタバが、ヨルノオオカゲのほうへ飛び出す（会話中は世界が止まるので、ここで動かす） */const f=S.res.find(r=>r.name===POKO),e=S.enemies.find(q=>q.type==='boss2'&&q.spawned&&!q.dead);if(!f||!e||(f.dashAt!=null&&performance.now()-f.dashAt<30000))return;f.dashAt=performance.now();
  const dx=e.x-f.x,dy=e.y-f.y,d=Math.hypot(dx,dy)||1,len=Math.min(4,Math.max(0,d-3)),sx=f.x,sy=f.y;let tx=sx+dx/d*len,ty=sy+dy/d*len;
  if(!walk((ty|0)*W+(tx|0))){tx=sx;ty=sy}f.face=dx>=0?1:-1;f.path=[];JUMP.set(f,performance.now());sfx('hit');
  const t0=performance.now(),step=now=>{const p=Math.min(1,(now-t0)/450),k=1-Math.pow(1-p,3);f.x=sx+(tx-sx)*k;f.y=sy+(ty-sy)*k;if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function dlgCue(c){if(!c)return;if(c==='dash'){dashDemo();return}if(c==='guarddemo'){const f=S.res.find(r=>r.name===POKO);if(f)leafFX(f);sfx('plant');return}/* おぼえる場面では、フタバのまわりに葉っぱが舞うだけ（守りはかけない） */if(c==='shake'){const v=$('#cv');v.classList.remove('shk');void v.offsetWidth;v.classList.add('shk');sfx('hit');setTimeout(()=>v.classList.remove('shk'),600)}else if(c==='flash'||c==='dim'){const d=document.createElement('div');const fl=c==='flash';d.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:19;opacity:0;background:'+(fl?'#fff':'#0b0f0a')+';transition:opacity '+(fl?.12:.7)+'s ease';document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity=fl?'.75':'.4'}));setTimeout(()=>{d.style.transition='opacity '+(fl?.7:1.2)+'s ease';d.style.opacity='0';setTimeout(()=>d.remove(),1300)},fl?160:1400)}}
function dialoguePause(ch,previous){return ch==='…'?(previous==='…'?90:340):/[。！？!?]/.test(ch)?220:ch==='、'?100:0}
function dialogueSpiritAnim(motion,talking,elapsed,hold,wave,reduced){if(reduced)return '';if(elapsed<950&&wave)return 'wave';if(!talking&&elapsed>=hold)return '';return ({joy:'talkjoy',shock:'talkshock',think:'talkthink',sad:'talksad'})[motion]||(talking?'talk':'')}
function dialoguePose(motion,elapsed){const durations={joy:950,shock:720,nod:650,think:1050,sad:950,phew:1400},d=durations[motion]||1,p=Math.max(0,Math.min(1,elapsed/d)),fade=Math.sin(p*Math.PI);if(p>=1)return {x:0,y:0,angle:0};if(motion==='joy')return {x:0,y:-Math.abs(Math.sin(p*Math.PI*2))*17,angle:Math.sin(p*Math.PI*4)*.045};if(motion==='shock')return {x:Math.sin(p*Math.PI*5)*4*(1-p),y:-fade*10,angle:-fade*.06};if(motion==='nod')return {x:0,y:Math.sin(p*Math.PI*2)*6,angle:Math.sin(p*Math.PI*2)*.045};if(motion==='phew')return p<.35?{x:0,y:-Math.sin(p/.35*Math.PI/2)*3,angle:0}:{x:0,y:-3+Math.sin((p-.35)/.65*Math.PI/2)*7*(1-(p-.35)/.65*.6),angle:0};/* ふぅ：すこし息をすって、肩をおとす */return {x:0,y:fade*(motion==='sad'?5:0),angle:fade*(motion==='sad'?.08:-.1)}}
let GODVOICE_T=0;/* 遠くからの声のあいさつを、さいごに出した時刻 */
function dialog(lines,after,lastLabel,who){
  const d=$('#dialog'),key=JSON.stringify(lines);if(!d.hidden&&key===DLGCUR||DLGQ.some(q=>q[4]===key))return;/* 同じ会話を、かさねて出さない（何回かタップしても1回だけ） */
  if(!d.hidden||performance.now()<DLGGAP&&performance.now()-DLGTAP>400){DLGQ.push([lines,after,lastLabel,who,key]);return}/* 会話がおわってすぐの、べつの会話は、少しまってから（タップで始めた会話はすぐ） */DLGCUR=key;
  if(S&&!godHere()){/* 遠くからの声：「聞こえるかの？ 遠くから、声だけ届けておるぞい。」は、1つの会話で1回だけ。つづけて開く別の会話（90秒いない）でも出さない */const PRE='……聞こえるかの？ 遠くから、声だけ届けておるぞい。',reP=/……聞こえるかの？ 遠くから、声だけ届けておるぞい。/g;lines=lines.map(ln=>Array.isArray(ln)?ln.slice():ln);let first=true;const recent=performance.now()-GODVOICE_T<90000;for(const ln of lines){if(!Array.isArray(ln)||ln[0]!==GOD||typeof ln[1]!=='string')continue;ln[1]=ln[1].replace(reP,'');if(first){first=false;if(!recent){ln[1]=PRE+ln[1];GODVOICE_T=performance.now()}}}}
  if(sheet&&!DLG_KEEP)closeSheet();d.classList.toggle('dtop',DLG_KEEP);requestAnimationFrame(fitTopDlg);
  let i=0;d.hidden=false;DLGN.clear();for(const ln of lines)if(Array.isArray(ln)&&ln[0])DLGN.add(ln[0]);if(who)DLGN.add(who);
  const show=()=>{const ln=lines[i];if(Array.isArray(ln)&&ln[0]==='@idea'){const panel=d.querySelector('.dlg');panel.style.visibility='hidden';return showGuardianIdea(ln[1],()=>{panel.style.visibility='';i++;if(i<lines.length)show();else{voiceStop();d.hidden=true;DLG_KEEP=false;d.classList.remove('dtop');fitTopDlg();if(after)after();if(d.hidden)dlgGap()}})}const w=Array.isArray(ln)?ln[0]:(who==null?LEAD():who);$('#dlgWho').textContent=w;$('#dlgWhoBox').hidden=w==='';
    const sp=$('.dlg .orb');const rw=S&&S.res.find(q=>q.name===w),spe=rw?rw.elem:KEYEL[w]||null;DLGA.vr=rw?rw.vr:null;sp.style.background=spe?'#f6f1e6 url('+spiritPort(spe,96,DLGA.vr)+') center/86% no-repeat':'';sp.style.boxShadow=spe?'inset 0 0 0 2px '+ELEM[spe].col:'';sp.style.animation=spe?'none':'';sp.style.width=sp.style.height=spe?'32px':'';sp.style.borderRadius='50%';
    const p=$('#dlgText'),lk=lineLook(Array.isArray(ln)?ln[1]:ln),tx=lk.text;p.textContent='';dlgSpeak(w,spe,tx,lk);if(S){const H=S.dlog||(S.dlog=[]),last=H[H.length-1];if(!last||last[1]!==tx)H.push([w,tx]);if(H.length>120)H.splice(0,H.length-120)}const cue=Array.isArray(ln)&&typeof ln[2]==='string'?ln[2]:'';dlgCue(cue);const bt=$('#dlgBtns');bt.innerHTML='';const b=document.createElement('button');b.className='btn pri';const hold=Math.max(lk.hold,cue==='flash'||cue==='shake'?700:0);/* 光る・ゆれる場面は、すこし待つ */DLGA.motion=lk.motion;DLGA.holdUntil=DLGA.lineT+hold;DLGA.charAt=DLGA.lineT+lk.lead;DLGA.readReady=Infinity;if(hold){b.disabled=true;setTimeout(()=>{if(b.isConnected)b.disabled=false},hold)}b.textContent=i<lines.length-1?'つぎへ':(lastLabel||'とじる');b.onclick=()=>{const now=performance.now();if(now<DLGA.holdUntil)return;if(DLGA.n<DLGA.full.length){DLGA.n=DLGA.full.length;dlgSet(DLGA.full,DLGA.n);DLGA.readReady=now+200;voiceStop();return}if(now<DLGA.readReady)return;sfx('next');i++;if(i<lines.length)show();else{voiceStop();d.hidden=true;DLG_KEEP=false;d.classList.remove('dtop');fitTopDlg();if(after)after();if(d.hidden)dlgGap()}};bt.appendChild(b)};
  show();
}
// 会話のアニメーション：話し手の大きな絵、1文字ずつの文字送り、表情
let DLGEL=null;const DLGA={who:'',el:null,full:'',n:0,mood:'smile',lineT:0,enterT:0,raf:0,last:0};
const LOOKS={/* セリフの見た目。セリフの文の中に「#joy|」のように書く（空白で区切って重ねられる）。face＝顔、motion＝動き、hold＝「つぎへ」を押せるまで、lead＝文字が出はじめるまで（どちらもミリ秒）、wave＝はじめに手をふる */
  happy:{face:'joy'},sigh:{face:'sad'},shocked:{face:'shock'},teary:{face:'teary'},tear:{face:'tear'},
  hop:{motion:'joy',hold:950,lead:120},ponder:{motion:'think',hold:1050,lead:380},jolt:{motion:'shock',hold:720,lead:170},alarm:{motion:'shock',hold:850,lead:220},nod:{motion:'nod',hold:650,lead:150},droop:{motion:'sad',hold:950,lead:280},wave:{wave:true},
  joy:{face:'joy',motion:'joy',hold:950,lead:120},think:{face:'sad',motion:'think',hold:1050,lead:380},surprise:{face:'shock',motion:'shock',hold:720,lead:170},danger:{face:'shock',motion:'shock',hold:850,lead:220},
  scared:{face:'teary',motion:'shock',hold:850,lead:220},cry:{face:'teary',motion:'sad',hold:950,lead:280},worry:{face:'teary',motion:'think',hold:1050,lead:380}};
const LOOKRX=/#([a-z ]+)\|/;
function lineLook(tx){const m=LOOKRX.exec(tx),o={face:'smile',motion:'none',hold:0,lead:0,wave:false,text:m?tx.replace(m[0],''):tx};if(m)for(const w of m[1].split(' '))Object.assign(o,LOOKS[w]);return o}/* セリフの印を読んで、印をのぞいた文といっしょに返す */
/* 文字送り中も、あとの文字は見えないまま場所をとっておく（枠が最初から全文の大きさになる） */
function dlgSet(full,n){const p=$('#dlgText');if(p.childNodes.length!==2||p.firstChild.nodeType!==1){p.textContent='';const a=document.createElement('span'),b=document.createElement('span');b.style.visibility='hidden';p.append(a,b)}p.firstChild.textContent=full.slice(0,n);p.lastChild.textContent=full.slice(n)}
function dlgSpeak(w,el,tx,lk){const now=performance.now();if(w!==DLGA.who){DLGA.enterT=now}DLGA.who=w;DLGA.el=el;DLGA.full=tx;DLGA.n=0;dlgSet(tx,0);DLGA.mood=lk.face;DLGA.wave=lk.wave;DLGA.lineT=now;DLGA.last=now;DLGA.charAt=now;DLGA.readReady=Infinity;voiceStart(w,tx.length/38+.1);
  const cv=$('#dlgPort');cv.hidden=!(el||w===GOD);
  if(S&&el){const r=S.res.find(q=>q.name===w);if(r&&!r.hidden){JUMP.set(r,now)}}/* 「…」の吹き出しは、せいれいどうしのおしゃべりだけ */
  if(!DLGA.raf)DLGA.raf=requestAnimationFrame(dlgLoop)}
// 上に出したセリフとステータスが重ならないよう、シートの高さをセリフの下までにする
function fitTopDlg(){const d=$('#dialog'),sh=document.querySelector('#sheetWrap .sheet');if(!sh)return;if(d.hidden||!d.classList.contains('dtop')){sh.style.maxHeight='';return}
  const ar=$('#app').getBoundingClientRect(),br=d.querySelector('.dlg').getBoundingClientRect();sh.style.maxHeight=Math.max(160,ar.bottom-br.bottom-8)+'px'}
function dlgLoop(now){if($('#dialog').hidden){DLGA.raf=0;return}if(DLG_KEEP)fitTopDlg();DLGA.raf=requestAnimationFrame(dlgLoop);
  const dt=Math.min(.1,(now-DLGA.last)/1000);DLGA.last=now;
  if(DLGA.n<DLGA.full.length){let changed=false;while(DLGA.n<DLGA.full.length&&now>=DLGA.charAt){const previous=DLGA.full[DLGA.n-1],ch=DLGA.full[DLGA.n++];DLGA.charAt+=1000/38+dialoguePause(ch,previous);changed=true}if(changed)dlgSet(DLGA.full,DLGA.n);if(DLGA.n>=DLGA.full.length)DLGA.readReady=now+200}
  const cv=$('#dlgPort');if(cv.hidden)return;const c=cv.getContext('2d');c.clearRect(0,0,240,240);
  const t=now/1000,ent=Math.min(1,(now-DLGA.enterT)/260),ee=1-Math.pow(1-ent,3),talking=DLGA.n<DLGA.full.length;
  const pose=dialoguePose(DLGA.motion,now-DLGA.lineT),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,hop=reduced?0:pose.y;
  const shake=reduced?0:pose.x,bob=Math.sin(t*2.4)*3+(talking?Math.abs(Math.sin(t*14))*-3:0);
  c.save();c.globalAlpha=ee;c.translate((1-ee)*-70+shake,0);if(!reduced){c.translate(120,190);c.rotate(pose.angle);c.translate(-120,-190)}
  if(DLGA.who===GOD){const g=SPR.god;if(g&&g.ok){const h=200,w=h*g.w/g.h;c.translate(120,232+hop+bob);c.rotate(Math.sin(t*1.6)*.04+(talking?Math.sin(t*9)*.02:0));c.drawImage(g.img,-w/2,-h,w,h)}}
  else if(DLGA.el){const md=talking?(Math.floor(now/110)%2?DLGA.mood:(DLGA.mood==='smile'?'joy':DLGA.mood==='joy'?'smile':DLGA.mood)):DLGA.mood;
    c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(120,203,44*(1-Math.min(.3,-hop/60)),8,0,0,7);c.fill();
    drawSpirit(c,DLGA.el,120,200+hop+bob,1.5,1,{t,vr:DLGA.vr,mood:md,blink:(t%3.4)<.13,anim:dialogueSpiritAnim(DLGA.motion,talking,now-DLGA.lineT,DLGA.holdUntil-DLGA.lineT,DLGA.wave,reduced),walk:false,work:false,lean:DLGA.mood==='sad'||DLGA.mood==='teary'||DLGA.mood==='tear'?.12:0})}
  c.restore()}
function shards3(){/* かけらが3つそろった会話。さいごまで見てから、ヌシ様が帰ってくる（とちゅうでとじたら、つづきからでもう一度） */if(!S||S.cleared)return;dialog((L=>L&&L.length?L:[[GOD,GVOICE()+'かけらが3つそろったのう。……ヌシ様が、帰ってくるぞい。']])(sevLines([['F','台座が、光ってる……！',1],['N','3つともはまったねぇ。……ヌシ様が、帰ってくるよぉ。',1]])),()=>{if(S.cleared)return;if(S.res.some(q=>q.name===POKO)){S.flags.nushiDue=1;nushiReturns()}else{S.flags.nushiWait=1;toast('フタバが帰ってきたら、ヌシ様がすがたをあらわす','warn')}})}
function gameOver(){dialog(['せいれいたちが、みんな消えてしもうた…。土地もしずかになってしもうたのう。','もう一度、この土地に村をつくってみようかの。こんどは畑と食料を多めにな。'],()=>newGame(WD),'やりなおす',GOD)}/* いまのステージを、はじめから */

let hudT=0;
let PDOWN=false,craftSig='';addEventListener('pointerdown',()=>{PDOWN=true},true);for(const ev of['pointerup','pointercancel'])addEventListener(ev,()=>{setTimeout(()=>{PDOWN=false},60)},true);
let SKIP=false,ALI=-1;/* 「コワイノ」をぜんぶ追いはらった夜は、朝までとばせる */

const canSkip=()=>!SKIP&&isNight()&&S.enemyOn&&(!S.res.length||S.nightHad&&!S.enemies.length&&(S.cleared||!S.nushi));/* クリア後も、その夜のコワイノをぜんぶ追いはらってから *//* 全員いなくなったときも、朝までとばせる */
function updHUD(){
  if(S){const was=S.res4Since,tell=S.bossWarn!=null&&!S.cleared&&!S.bossKills;/* オオカゲを追いはらったあとは、言わない *//* オオカゲの来る時期を、せいれいが減ったとき・もどったときに伝える */
    const hasFire=S.res.some(q=>q.elem==='fire');/* 火の子が1人もいないときも、オオカゲは来ない */
    if(S.res.length<4||!hasFire){S.res4Since=null;if(was!=null&&tell&&S.enemyOn&&$('#dialog').hidden)dialog(S.res.length<4?[[GOD,'なかまが減ってしもうたのう…。'],[GOD,'もう少しなかまが増えて、村がおちつくまでは、オオカゲも来ぬはずじゃ。それまでに、なかまを集めて備えるのじゃぞ。']]:[[GOD,'火のせいれいが、いなくなってしもうたのう…。'],[GOD,'オオカゲとたたかえる火の子がもどるまでは、オオカゲも来ぬはずじゃ。火の子をむかえて、備えるのじゃぞ。']])}/* 火の子だけがいなくなったときは、なかまが減ったとは言わない */
    else if(was==null){S.res4Since=dayNo();if(tell&&S.enemyOn&&S.lastRes4!=null&&$('#dialog').hidden)dialog([[GOD,'なかまが、また増えてきたのう。'],[GOD,'村がおちついてきたころ、オオカゲがまた来るかもしれん。柵と見張り台を、しっかり整えておくんじゃ。']])}
    S.lastRes4=S.res.length>=4&&hasFire?1:S.lastRes4}
  {const sb=$('#skipBtn'),v=canSkip();if(sb.hidden===v)sb.hidden=!v}
  const h=hour(),m=Math.floor(clk()%60);
  $('#dayLbl').textContent=(S.rain?'☔雨':'☀晴れ')+(S.today?'・'+DAYEV[S.today][1]:'');/* 何日目は出さない（きろくで見る） */
  {const tx=String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(m/10)*10).padStart(2,'0'),el=$('#timeLbl');if(el.dataset.t!==tx){el.dataset.t=tx;el.innerHTML=[...tx].map(ch=>ch===':'?'<i class="c">:</i>':'<i>'+ch+'</i>').join('')}}/* 数字を1文字ずつ同じはばのわくに入れ、時刻で表示がずれないようにする */
  {const gs=$('#guardStatus'),night=true;/* 守りの光は、昼も夜も（昼は木や岩に） */gs.hidden=!night;if(LIGHTARM&&(LIGHTCD>0||S.pt<1))LIGHTARM=false;gs.classList.toggle('armed',LIGHTARM);if(night){const gc=gs.querySelector('.gc');let p=1;if(LIGHTCD>0)p=1-LIGHTCD/(LIGHTCDL[S.lv]||10);else if(S.pt<1)p=0;gc.style.setProperty('--gp',(p*360)+'deg')}}
  {const ab=$('#areaBtn'),on=!!(S.flags&&S.flags.areaSkill)&&isNight();ab.hidden=!on;if(on){let p=1;if(AREACD>0)p=1-AREACD/5;else if(S.pt<3)p=0;if(AREAARM&&(AREACD>0||S.pt<3))AREAARM=false;ab.querySelector('.gc').style.setProperty('--gp',(p*360)+'deg');ab.classList.toggle('armed',AREAARM)}else AREAARM=false}
  const L=S.lv,a=LV_XP[L-1],b=L>=maxLv()?a:LV_XP[L]??a;$('#lvLbl').textContent=L;$('#xpBar').style.width=(b>a?clamp((S.totalPt-a)/(b-a),0,1)*100:100)+'%';$('#xpTxt').textContent=b>a?Math.floor(S.totalPt-a)+' / '+(b-a):'MAX';
  $('#pt').textContent=S.pt;$('#food').textContent=S.food;$('#woodN').textContent=S.mat.wood||0;$('#matN').textContent=matTot();{const mi=$('#matIc');if(mi&&!mi.dataset.ok){const u=iconURL('mbox');if(u){mi.src=u;mi.dataset.ok=1}}}/* 素材は種類が多いので、上には総量だけ */$('#stoneN').textContent=S.mat.stone||0;{const bn=$('#bambooN'),bi=$('#bambooIc'),on=bambooOn();if(bn){bn.textContent=S.mat.bamboo||0;bn.hidden=!on;bi.hidden=!on;if(!bi.src)bi.src=ICONS.bamboo}}{const fc=foodCap(),mc=matCap(),fb=$('#foodBar'),mb=$('#matBar');fb.style.width=(fc?Math.min(100,S.food/fc*100):0)+'%';fb.style.background=fc&&S.food>=fc?'#d9a441':'';mb.style.width=(mc?Math.min(100,matTot()/mc*100):0)+'%';mb.style.background=mc&&matTot()>=mc?'#d9a441':'#c9a46a'}$('#resN').textContent=S.res.length;if(!$('#resIc').src)$('#resIc').src=spiritPort('wood',48,null);$('#revLbl').textContent='みどり '+GRASSN;
  const hungry=S.res.filter(r=>r.hunger<20).length,en=S.enemies.filter(e=>e.spawned).length;
  const al=$('#alert');const msg=[];if(en)msg.push('「コワイノ」 '+en+'体');if(hungry)msg.push('おなかがすいたせいれい '+hungry+'人');if(S.food===0&&S.enemyOn)msg.push(cnt('stor')?'食料ゼロ':'食料箱がありません');/* 足りない理由もいっしょに出す */
  al.hidden=!msg.length;al.textContent=msg.join('・');
  if(PDOWN){}/* 押している最中に作りなおすと、タップが消えてしまう */
  else if(sheet==='craft'){const sig=S.orders.map(o=>o.id+':'+o.worker).join(',')+'|'+CRAFT_TABS[craftTab][1].map(id=>(S.pt>=BL[id].pc?1:0)+''+(matOK(BL[id].mat)?1:0)+inv(id)+(lvOK(id)?1:0)).join('')+'|'+(S.mat.wood||0)+','+(S.mat.stone||0)+','+(S.mat.bamboo||0)+'|'+craftTab+'|'+S.lv+'|'+Object.keys(S.recipes).length;
    if(sig!==craftSig){craftSig=sig;renderSheet()}else document.querySelectorAll('#sheetBody .paper .bar i').forEach((b,n)=>{const o=S.orders[n];if(o)b.style.width=Math.min(100,o.prog/o.need*100)+'%'})}/* 依頼ボードは、変わったときだけ作りなおす */
  else if(sheet==='people'||sheet==='res'||sheet==='house')renderSheet();
  else if(sheet==='stock'){const sig=Object.entries(S.fs).join()+'|'+Object.entries(S.mat).join()+'|'+foodCap()+','+matCap();if(sig!==STOCKSIG){STOCKSIG=sig;renderSheet()}}/* 数が変わったときだけ、そうこを描きなおす */
}

/* ---------- はじまり ---------- */
let started=false,titleDrift=0,STOCKSIG='';
function showUI(on){$('#topUI').hidden=!on;$('#botUI').hidden=!on}
/* 引き継ぎ：便利な道具（ひろびろハケ・かたどりスタンプ・つけかえトンカチ・ひっこしミトン）だけは、ほかの土地でもらっていれば使える */
function syncTools(s){for(const L of LIVE)if(L&&L!==s){if(L.bulk)s.bulk=true;if(L.stamps)s.stamps=true;if(L.swap)s.swap=true;if(L.dig)s.dig=true;if(L.mover)s.mover=true;if(L.areaSkill||L.flags&&L.flags.areaSkill)(s.flags||(s.flags={})).areaSkill=true}}/* 「ひかりのはどう」も、草原でおぼえたら、ほかのステージで使える */
function newGame(w){w=w||0;if(sheet!=null)closeSheet();recSync();if(w!==FREE)grecForget(w);/* はじめから：このステージでおぼえたレシピはわすれる（会話でまた思いつく） */setWorld(w);resetQuestPrompts();DLGQ.length=0;DLGGAP=0;try{KV.removeItem(SAVE_KEYS[w])}catch(e){}resv.clear();BAN.clear();S=newState(w);LIVE[w]=S;syncTools(S);dirty=true;recount();kwrSync();recSync();weedMorning(true);/* はじめから雑草100本・枝15本がある */undoStack=[];renderQuest();applyFeats();setMode('look');$('#title').hidden=true;startPrologue()}
function startPrologue(){
  showUI(false);started=false;let i=0;const pro=$('#pro');pro.style.transition='none';pro.hidden=false;pro.style.opacity='1';void pro.offsetWidth;pro.style.transition='';/* フェードせずに、すぐまっくらにする（前のデータの画面が一瞬見えないように） */
  cam.z=minZ();centerOn(CX*TS,CY*TS);
  const show=()=>{const p=$('#proText');const PR=PROS[WD];const tx=lineLook(PR[i][1]).text;/* 「#wave|」などの印は出さない */$('#proWho').textContent=PR[i][0];p.textContent=tx;p.style.animation='none';void p.offsetWidth;p.style.animation='';voiceStart(PR[i][0],tx.length/30+.1)};
  const end=()=>{voiceStop();pro.onclick=null;try{render(performance.now())}catch(e){}/* うすくなる前に、新しい村をかいておく（前のデータの画面が一瞬見えないように） */pro.style.opacity='0';setTimeout(()=>{pro.hidden=true;arrive()},800)};
  pro.onclick=e=>{if(e.target.id==='proSkip')return;i++;if(i<PROS[WD].length)show();else end()};
  $('#proSkip').onclick=end;show();
}
function recipeTalk(){const L=[[GOD,'そうそう。依頼ボードに描く形はの、その土地のせいれいに伝えるものなんじゃ。'],[GOD,'ここの子らは、べつのヌシ様の子じゃから、前の土地で伝えた形は知らん。思いついた形を、また描いて教えてやっておくれ。']];if(KWR.some(id=>(S.recipes||{})[id]))L.push([GOD,'#think|じゃが、コワイノが落としていった形は、夜の形じゃ。夜は、どの土地の上にもひとつきり。じゃから、ここの夜の子らにも、もう伝わっておるぞい。']);return L}/* 新しい土地では、レシピをおぼえなおす。そのわけ（コワイノのレシピは、夜の形なので、どの土地でもおぼえたまま） */
function arrive(){
  stageMusic();
  /* はじめての村へ降りるカメラズームは残す。タイトルの背景描画とは別の演出。 */
  camAnim={fz:cam.z,tz:homeZ(),fx:cam.x+VW/cam.z/2,fy:cam.y+VH/cam.z/2,tx:CX*TS,ty:(CY-3)*TS,t:0,dur:2.2,done:()=>{
    S.godShown=true;burst(Math.floor(godY())*W+Math.floor(godX()),'furn');sfx('poof');
    setTimeout(()=>{started=true;showUI(true);dialog((WD===FREE?INTROFL():INTROS[WD]).concat(WD===1?recipeTalk():[]),()=>{S.introSeen=true;save()})/* さいごまで見てから「見た」に */},500)}};
}
function talkOnce(key,lines,delay){/* 1回だけの会話：最後まで見てから「見た」にする。とちゅうでとじたら、次に開いたときにもう一度 */if(!S||S.flags[key]||!lines||!lines.length)return;const P=S.pendTalk||(S.pendTalk={});P[key]=lines;setTimeout(()=>{if(!S||S.flags[key])return;dialog(P[key]||lines,()=>{S.flags[key]=1;if(S.pendTalk)delete S.pendTalk[key]})},delay||900)}
function replayTalks(){if(!S||!S.pendTalk)return;for(const k in S.pendTalk){if(S.flags[k]){delete S.pendTalk[k];continue}talkOnce(k,S.pendTalk[k],1500)}}
function continueGame(saved){if(saved&&saved.summary)saved=loadStage(saved.world);if(!saved)return;recSync();/* いまのステージでおぼえた物を、先にしまう */setWorld(saved.world||0);S=saved;LIVE[WD]=S;ensureStor(S);S.flags=S.flags||{};if(S.flags.lightTold&&!(S.subDone||{}).lighttry)(S.subDone||(S.subDone={})).lighttry=true;/* 前のセーブ：守りの光の話をもう聞いていたら、サブクエストは出さない */if(!S.free&&!S.flags.rec3){S.flags.rec3=1;const own=ownLearned(S,WD);for(const[id,o]of grecOf())if(o>WD&&!own.has(id)){delete(S.recipes||{})[id];delete(S.guardianIdeas||{})[id];delete(S.unlocked||{})[id]}}/* 前のセーブ：この先のステージでおぼえたレシピを、もっていたら消す */if(!S.flags.land2){S.flags.land2=1;S.flags.land3=1;S.flags.land4=1;genLand(S,WD);/* はじめて作るときは、いまの作り方なので、あとの作りなおしはいらない *//* 地形を作りなおす（川・浅瀬・0〜3だんの段差）。人の作った物の所は、そのまま */S.drops=(S.drops||[]).filter(d=>!S.ground[d.y*W+d.x]);S.seeds=(S.seeds||[]).filter(d=>!S.ground[d.y*W+d.x]);S.regrow=(S.regrow||[]).filter(g=>!S.ground[g.j])}else if(!S.hi)genHeights(S,WD);if(!S.flags.land3){S.flags.land3=1;genHeights(S,WD)}if(!S.flags.land4){S.flags.land4=1;/* ステージごとの地形にする：火山は前の南北の川を地面にもどして、東西の川を流す。段差も作りなおす */if(WD===1){const old=genRiver(S,1,{ns:true,dry:true});let back=0;for(let j=0;j<W*H;j++){if(!old[j]||!S.ground[j])continue;if(S.obj[j]==='bridge'){S.obj[j]='';S.pt+=BL.bridge.pc;for(const k in BL.bridge.mat)S.mat[k]=(S.mat[k]||0)+BL.bridge.mat[k];back++}S.ground[j]=0}genRiver(S,1);if(back)setTimeout(()=>toast('川がかわったので、橋を'+back+'つ、パワーと素材にもどしました'),1500)}genHeights(S,WD);S.drops=(S.drops||[]).filter(d=>!S.ground[d.y*W+d.x]);S.seeds=(S.seeds||[]).filter(d=>!S.ground[d.y*W+d.x]);S.regrow=(S.regrow||[]).filter(g=>!S.ground[g.j])}/* 段の高さだけ作りなおす（段と段のあいだを2マス以上に）。川はそのまま */bambooMig();{for(let j=0;j<S.floor.length;j++)if(S.floor[j]==='hoshifloor')S.floor[j]='stonefloor';if(S.inv&&S.inv.hoshifloor){S.inv.stonefloor=(S.inv.stonefloor||0)+S.inv.hoshifloor;delete S.inv.hoshifloor}if(S.recipes)delete S.recipes.hoshifloor;if(S.unlocked)delete S.unlocked.hoshifloor;for(const o of S.orders||[])if(o.type==='hoshifloor'){S.pt+=4;S.mat.stone=(S.mat.stone||0)+3}/* 依頼中だった分は、パワー4・石材3をもどす */S.orders=(S.orders||[]).filter(o=>o.type!=='hoshifloor')}/* ほしくずの床はなくした：置いた床は石の床に */{delete S.ywin;if(S.inv&&S.inv.yozorawin){S.inv.window=(S.inv.window||0)+S.inv.yozorawin;delete S.inv.yozorawin}if(S.recipes)delete S.recipes.yozorawin;if(S.unlocked)delete S.unlocked.yozorawin;for(const o of S.orders||[])if(o.type==='yozorawin'){S.pt+=3;S.mat.wood=(S.mat.wood||0)+3}/* 依頼中だった分は、パワー3・木材3をもどす */S.orders=(S.orders||[]).filter(o=>o.type!=='yozorawin')}/* よぞらの窓はなくした：置いてあった窓は、ふつうの窓に */{for(let j=0;j<S.obj.length;j++){if(S.obj[j]==='stairs_log')S.obj[j]='stairs_wood';if(S.dyn[j]&&S.dyn[j].build==='stairs_log')S.dyn[j].build='stairs_wood'}if(S.inv&&S.inv.stairs_log){S.inv.stairs_wood=(S.inv.stairs_wood||0)+S.inv.stairs_log;delete S.inv.stairs_log}if(S.recipes)delete S.recipes.stairs_log;if(S.unlocked)delete S.unlocked.stairs_log;for(const o of S.orders||[])if(o.type==='stairs_log'){S.pt+=4;S.mat.wood=(S.mat.wood||0)+5}S.orders=(S.orders||[]).filter(o=>o.type!=='stairs_log')}/* 丸太の階段はなくした：置いてあった分・持っていた分は木の階段に、依頼中の分はパワー4・木材5をもどす */{for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='stonefence')S.obj[j]='wall';if(S.inv&&S.inv.stonefence){S.inv.wall=(S.inv.wall||0)+S.inv.stonefence;delete S.inv.stonefence}if(S.recipes)delete S.recipes.stonefence;if(S.unlocked)delete S.unlocked.stonefence;for(const o of S.orders||[])if(o.type==='stonefence'){S.pt+=9;S.mat.stone=(S.mat.stone||0)+6}/* 依頼中だった分は、パワー9・石材6をもどす */S.orders=(S.orders||[]).filter(o=>o.type!=='stonefence')}/* 石の柵はなくした：置いてあった石の柵は、石の塀に */{const MV={stairs_earth:'slope_earth',slope_wood:'stairs_wood',slope_stone:'stairs_stone',slope_brick:'stairs_brick'};for(let j=0;j<S.obj.length;j++){if(MV[S.obj[j]])S.obj[j]=MV[S.obj[j]];const d=S.dyn[j];if(d&&MV[d.build])d.build=MV[d.build]}for(const id in MV){if(S.recipes)delete S.recipes[id];if(S.unlocked)delete S.unlocked[id]}}/* 土は坂だけ、木・石・レンガは階段だけ：なくした物は、同じ素材のほうにかえる */{let back=0;for(let j=0;j<S.obj.length;j++){const id=S.obj[j];if(!STAIRS.has(id))continue;{const d=stairDir(j);if(d>=0&&stairOK(j,d))continue}S.pt+=BL[id].pc;for(const k in BL[id].mat||{})S.mat[k]=(S.mat[k]||0)+BL[id].mat[k];clearObj(j);back++}if(back)setTimeout(()=>toast('置けない所の階段を'+back+'つ、パワーと素材にもどしました'),1500)}/* 前の、段差の上に切りこんだ階段（なまえのかえを先にしてから） */for(const k in S.ref){const a=S.ref[k];if(STAIRS.has(S.obj[a])&&stairDir(a)===0&&S.obj[k]==='part'){S.obj[k]='';delete S.ref[k]}}/* 手前向きの階段は1マスになった */for(const id of STAIRS){const n=(S.inv||{})[id]||0;if(n){S.pt+=n*BL[id].pc;delete S.inv[id]}for(const o of S.orders||[])if(o.type===id){S.pt+=BL[id].pc;for(const k in BL[id].mat)S.mat[k]=(S.mat[k]||0)+BL[id].mat[k]}S.orders=(S.orders||[]).filter(o=>o.type!==id);if(S.recipes)delete S.recipes[id]}/* 階段は建物になった：持っていた階段・依頼中の階段は、パワー（と素材）にもどす */{const MV={kusa:WD===1?'kuru':'shina',kare:WD===1?'chiri':'kasa'},mv=o=>{if(!o)return;for(const k in MV)if(o[k]!=null){o[MV[k]]=(o[MV[k]]||0)+o[k];delete o[k]}};mv(S.mat);mv(S.gotMat);for(const r of S.res)mv(r.cmat)}/* 草・かれ草は、草の名前ごとの素材になった */kwrSync();recSync();for(const r of S.res){delete r.swing;delete r.swingT}/* たたいた時刻（画面の時計）は、読みこみなおしたら使えない */if((S.mig||0)<1){fixBeds();dropChair2();dropBirdhouse();dropFlower();dropNtree();if(((S.subSt||{}).watch2||0)>=4){S.recipes=S.recipes||{};S.guardianIdeas=S.guardianIdeas||{};S.recipes.signpost=true;S.guardianIdeas.signpost=true}/* 見張り台を2つにしたあと（フタバの「道がわかる目印」）で、道しるべをおぼえる */S.mig=1}if(S.mig<2){if(S.flags.traded)S.flags.tradedSeen=1;if(S.flags.oracleSet)S.flags.oracleSeen=1;if(S.flags.minaCame&&S.flags.mnN==null)S.flags.mnN=S.nights||0;S.mig=2}if(S.mig<3){swingWide();S.mig=3}if(S.mig<4){recount();rugsBig();S.mig=4}if(S.mig<5){for(const r of [...S.res,...(S.lost||[]),...(S.buried||[])])if(r.vr&&r.vr.tr==='ryouri'&&r.elem!=='fire')r.vr.tr=pick(TRK(r.elem));S.mig=5}if(S.mig<6){const N=new Set([19,25,36,44,48,49,51,55,59,71,72,85,89,90,91,98,99,120,127,134,168,174,177,183,202]);S.chatRec=(S.chatRec||[]).filter(i=>!N.has(i));S.mig=6}if(S.mig<7){for(const r of [...S.res,...(S.lost||[]),...(S.buried||[])])if((NIGATE[r.elem]||{})[r.like]!=null)r.like=pick(LIKE_KEYS.filter(k=>(k!=='slide'||WD===4)&&(NIGATE[r.elem]||{})[k]==null));S.mig=7}if(S.mig<8&&S.mig>=7){if(WD===1){const fi=QUESTS.findIndex(q=>q.id==='fest');if(fi>=0&&S.quest>=fi){S.quest++;if(S.qStory!=null&&S.qStory>=fi)S.qStory++}}S.mig=8}if(S.mig<9){for(const r of [...S.res,...(S.lost||[]),...(S.buried||[])])if(r.vr&&KEYVR[r.name]&&KEYVR[r.name].tr==='nebari')r.vr.tr='nebari';S.mig=9}/* 章のはじめからいる子（フタバ・ホムラ）の特技を、ねばりづよいに *//* 火山のふもとに「おまつりをひらこう」を足したので、それより先のクエストの番号をずらす *//* 好きな遊びが、にがてなおもちゃだった子は、えらびなおす *//* 似ていた会話を、べつの会話にさしかえた：さしかえた会話は、まだしていない話にもどす *//* 料理じょうずは火の子だけ：ほかの子は、べつの特技に *//* 古いセーブを直すのは、1回だけ */setTimeout(replayTalks,2500);/* とちゅうでとじた会話を、もう一度 */if(S.flags&&S.flags.nushiDue&&!S.cleared)setTimeout(()=>{if(!S.cleared)nushiReturns()},3000);else if(!S.cleared&&(S.setSh||0)>=3&&S.flags&&!S.flags.nushiWait)setTimeout(shards3,3000);/* かけら3つの会話を、とちゅうでとじていたら、もう一度 *//* ヌシ様が帰ってくる場面を、とちゅうでとじていたら、はじめから */syncTools(S);dirty=true;closeSheet();{const F=S.flags||(S.flags={});for(const f of ['berryHalf','berryHalf2'])if(!F[f]){F[f]=1;let n=0;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='berry'&&(n++)%2){S.obj[j]='';delete S.dyn[j]}}}/* ベリーの茂みを、半分にした（前からのセーブも1回だけ） */undoStack=[];resv.clear();BAN.clear();/* ほかのステージの「もどす」・予約・しばらく行かない場所は使わない */S.res.forEach(r=>{r.act=null;r.path=[];r.hidden=false});S.orders.forEach(o=>o.worker=null);recount();renderQuest();applyFeats();setMode('look');glassUI();
  cam.z=homeZ();centerOn(CX*TS,CY*TS);$('#title').hidden=true;$('#maps').hidden=true;started=true;stageMusic();showUI(true);if(!WD&&S.flags&&S.flags.ret1===1){S.flags.ret1=2;(S.sevQ||(S.sevQ=[])).push('ret')}}


/* ---------- マップ選択 ---------- */
const LIVE=[null,null];
function stageInfo(w){
  const live=LIVE[w];if(live&&!live.summary)return live;
  const raw=KV.getItem(SAVE_KEYS[w]);if(!raw)return null;
  // 旧セーブもマップ配列をJSON展開せず、選択画面に必要な項目だけ拾う。
  const flag=k=>new RegExp('"'+k+'"\\s*:\\s*true').test(raw);
  const lv=raw.match(/"lv"\s*:\s*(\d+)/);
  return {summary:true,world:w,introSeen:flag('introSeen'),cleared:flag('cleared'),bulk:flag('bulk'),stamps:flag('stamps'),swap:flag('swap'),dig:flag('dig'),areaSkill:flag('areaSkill'),lv:lv?+lv[1]:1,res:[]};
}
function loadStage(w){if(LIVE[w]&&!LIVE[w].summary)return LIVE[w];return LIVE[w]=load(w)}
function refreshStageInfo(){for(const w of[0,1,FREE])if(!LIVE[w]||LIVE[w].summary)LIVE[w]=stageInfo(w)}
/* ステージごとのセーブ */
/* ステージは属性の数だけ（木・火・水・土・風）と、さいごの庭 */
function freeCard(list){if(!(LIVE[0]&&LIVE[0].cleared))return;let told=false;try{told=KV.getItem('hakoniwa-freeTold')==='1'}catch(e){}if(!told){try{KV.setItem('hakoniwa-freeTold','1')}catch(e){}setTimeout(()=>toast('フリーモードが解放されました！','good'),400)}
  const L=LIVE[FREE],k=FREE,card=el(`<div class="wcard open"><canvas width="760" height="280"></canvas><div class="wb"><span class="wn">FREE MODE</span><h3>フリーモード</h3><p></p><div class="wbtns"></div></div></div>`);
  card.querySelector('p').textContent=L&&L.introSeen?(L.summary?'':'せいれい '+L.res.length+'人・')+'村レベル '+L.lv+(L.cleared?'・お祭りをひらいた！':''):'自然の力が弱く、災いもほとんどない、しずかな土地。のんびり、自分だけの村をつくろう。';
  const bt=card.querySelector('.wbtns');
  if(L&&L.introSeen){const c=el('<button class="btn pri">つづきから</button>');c.onclick=()=>{sfx('tap');$('#maps').hidden=true;continueGame(L)};bt.appendChild(c);
    const n=el('<button class="btn">はじめから</button>');n.onclick=()=>{if(n.dataset.ok){$('#maps').hidden=true;newGame(k)}else{n.dataset.ok=1;n.textContent='データを消してはじめる（もう一度タップ）';n.style.borderColor='var(--danger)'}};bt.appendChild(n)}
  else{const n=el('<button class="btn pri">あそぶ</button>');n.onclick=()=>{sfx('tap');$('#maps').hidden=true;newGame(k)};bt.appendChild(n)}
  list.appendChild(card);thumb(card.querySelector('canvas'),k,true)}
const WORLDS=[
  {name:'はじまりの草原',sub:'WORLD 1・木',el:'wood',desc:'自然の力がくずれて荒れた草原。せいれいたちと村をつくり、守護の力をとりもどそう。'},
  {name:'火山のふもとの村',sub:'WORLD 2・火',el:'fire',desc:'地面の熱が冷えきった、火の山のふもとの村。こおりかけた温泉に、ぬくもりをとりもどそう。'},
  {name:'霧のみずべの村',sub:'WORLD 3・水',el:'water',desc:'霧がはれず、水の流れが止まった村。'},
  {name:'ひびわれた岩の谷',sub:'WORLD 4・土',el:'earth',desc:'大地がひびわれ、くずれかけた谷の村。'},
  {name:'風のやんだ空の村',sub:'WORLD 5・風',el:'wind',desc:'風が止まり、しずみかけた浮き島の村。'},
  {name:'忘れられた神々の庭',sub:'WORLD 6',el:null,desc:'5つの力が生まれた場所。'},
];WORLDS[FREE]={name:'フリーモード',sub:'FREE',el:null,desc:''};
function thumb(cv2,k,open,hide){
  const c=cv2.getContext('2d');const w=cv2.width,h=cv2.height;
  if(hide){c.fillStyle='#1c1c26';c.fillRect(0,0,w,h);const li=emoImg('🔒');if(li){const ih=64,iw=ih*li.width/li.height;c.drawImage(li,w/2-iw/2,h/2-ih/2,iw,ih)}return}/* まだひらいていないステージは、絵も見せない */
  if(S&&k===(S.world||0)&&(LIVE[k]===S||!LIVE[k])){if(dirty)rebuildStatic(STATICFULL);const r=20,sw=r*2*TS,sh=sw*h/w;gblit(c,(CX-r)*TS,CY*TS-sh/2,sw,sh,0,0,w,h,true);return}
  const g=c.createLinearGradient(0,0,0,h);const GC={6:['#8cc46e','#2f5a2a'],2:['#4f7d8f','#1e3440'],3:['#7a5a3f','#2f2117'],4:['#9ec3e0','#3d5a78'],5:['#3a2a4a','#16101f']};if(k===1){g.addColorStop(0,'#8a4a35');g.addColorStop(1,'#3a201a')}else{const q=GC[k]||['#2a2a3a','#16161f'];g.addColorStop(0,q[0]);g.addColorStop(1,q[1])}
  c.fillStyle=g;c.fillRect(0,0,w,h);
  if(k===1){c.fillStyle='#5a3328';c.beginPath();c.moveTo(w*.18,h*.62);c.lineTo(w*.42,h*.16);c.lineTo(w*.58,h*.16);c.lineTo(w*.82,h*.62);c.closePath();c.fill();c.fillStyle='#ff7a3d';c.fillRect(w*.44,h*.16,w*.12,6);c.fillStyle='#7fd0e0';for(let i=0;i<3;i++){c.beginPath();c.ellipse(w*(.22+i*.28),h*(.78+(i%2)*.08),60,18,0,0,7);c.fill()}c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<9;i++){c.beginPath();c.arc(w*(.18+(i%3)*.28)+(i>>2)*6,h*(.7-(i/3|0)*.08),10+(i%3)*3,0,7);c.fill()}}
  else{c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<30;i++)c.fillRect((i*97)%w,(i*53)%h,2,2)}
  if(open)return;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,w,h);{const li=emoImg('🔒');if(li){const ih=48,iw=ih*li.width/li.height;c.drawImage(li,w/2-iw/2,h/2-ih/2,iw,ih)}}
}
const APP_VER='869';/* バージョン：PRを出すたびに、そのPRの番号に書きかえる */
function showMaps(){$('#mVer').textContent='バージョン '+APP_VER;
  refreshStageInfo();
  $('#title').hidden=true;$('#maps').hidden=false;showUI(false);started=false;
  const list=$('#mList');list.innerHTML='';freeCard(list);
  WORLDS.forEach((wd,k)=>{if(k===FREE)return;
    if(k)list.appendChild(el('<div class="wlink"></div>'));
    let w2o=false;try{w2o=KV.getItem('hakoniwa-w2open')==='1'}catch(e){}
    const L=LIVE[k]||null,open=k===0||(k===1&&!!((LIVE[0]&&LIVE[0].cleared)||L||w2o));
    const card=el(`<div class="wcard${open?' open':' lock'}"><canvas width="760" height="280"></canvas><div class="wb"><span class="wn"></span><h3></h3><p></p><div class="wbtns"></div></div></div>`);
    const hide=!open&&!(k===2&&LIVE[1]&&LIVE[1].cleared);/* まだひらいていないステージは、名前も絵も見せない */
    card.querySelector('.wn').textContent=hide?'🔒 WORLD '+(k+1):wd.sub;card.querySelector('h3').textContent=hide?'？？？':wd.name;
    let info=wd.desc;
    if(k<=1&&L&&L.introSeen)info=(L.summary?'':'せいれい '+L.res.length+'人・')+'村レベル '+L.lv+(L.cleared?'・ヌシ様が帰ってきた！':'');
    else if(k===1&&!open)info='はじまりの草原でヌシ様をむかえると、ひらきます。';
    if(k===2)info=LIVE[1]&&LIVE[1].cleared?'道がひらいた！ …けれど、まだ準備中。':'まえの土地でヌシ様をむかえると、ひらきます。';
    if(k>=3)info=k===5?'？？？':'まえの土地でヌシ様をむかえると、ひらきます。';
    card.querySelector('p').textContent=info;
    const bt=card.querySelector('.wbtns');
    if(k<=1&&open){
      if(L&&L.introSeen){const c=el('<button class="btn pri">つづきから</button>');c.onclick=()=>{sfx('tap');const go=()=>{$('#maps').hidden=true;continueGame(L)};if(k===1&&departOK())depart(go);else go()};bt.appendChild(c);
        const n=el('<button class="btn">はじめから</button>');n.onclick=()=>{if(n.dataset.ok){$('#maps').hidden=true;newGame(k)}else{n.dataset.ok=1;n.textContent='データを消してはじめる（もう一度タップ）';n.style.borderColor='var(--danger)'}};bt.appendChild(n)}
      else{const n=el('<button class="btn pri">あそぶ</button>');n.onclick=()=>{sfx('tap');const go=()=>{$('#maps').hidden=true;newGame(k)};if(k===1&&departOK())depart(go);else go()};bt.appendChild(n)}
    }
    if(k===1&&!open){let n=0;card.onclick=()=>{if(++n>=5){try{KV.setItem('hakoniwa-w2open','1')}catch(e){}sfx('arrive');showMaps()}}}/* 確認用：とじたWORLD 2を5回タップでひらく */
    list.appendChild(card);thumb(card.querySelector('canvas'),k,open,hide);
  });
  $('#mSnd').textContent=SND.bgm||SND.sfx?'♪ おと オン':'♪ おと オフ';
}
const dayNoOf=s=>Math.floor((s.t-(s.hold||0))/1440)+1;
$('#mSnd').onclick=()=>{const on=!(SND.bgm||SND.sfx);setSnd('bgm',on);setSnd('sfx',on);showMaps()};
$('#mBack').onclick=()=>{$('#maps').hidden=true;$('#title').hidden=false};
$('#tStart').onclick=()=>{audioInit();curSong=wantSong='opening';step=0;nextT=AC?AC.currentTime+.15:0;sfx('furn');const t0=Date.now(),go=()=>{if(KV.ready()||Date.now()-t0>5000)showMaps();else setTimeout(go,150)};if(!KV.ready())toast('セーブを読みこみ中…');go()};/* クラウドのセーブを待ってから、土地をえらぶ */
window.__ldDone=1;clearInterval(window.__ldT);$('#tLoad').hidden=true;if(window.__ldWant&&window.__ldWant())$('#tStart').onclick()/* 読みこみ中に「はじめる」をおしていたら、そのまま進む */

/* ---------- ループ ---------- */
let last=performance.now(),frameT=0,tutT=0,saveT=0,questT=0,running=true;
const paused=()=>performance.now()<BOSSHOLD||GIFT_ACTIVE||!started||sheet!=null||!$('#dialog').hidden||!$('#lvup').hidden||!$('#rlv').hidden||NEWRES!=null||!$('#idle').hidden;
/* 寝落ち対策：2分さわらないと、時間を止める */
let lastIn=performance.now();
for(const ev of['pointerdown','keydown','wheel'])addEventListener(ev,()=>{lastIn=performance.now();const d=$('#idle');if(!d.hidden){d.hidden=true;last=performance.now()}},true);
let tutCache={k:'',t:0,v:null};
function orderTut(id){if(sheet){if(sheet!=='craft'||inv(id)>0||S.orders.some(o=>o.type===id))return{kind:'close'};const tab=craftTabFor(id);return craftTab===tab?{kind:'row'}:{kind:'tab',tab}}if(inv(id)>0)return{kind:'place'};if(S.orders.some(o=>o.type===id))return null;if(mode!=='look')return{kind:'look'};return BOARD>=0?{kind:'board'}:null}
function tutView(){/* 画面のうち、上のバーと下のパネルにかくれていない所 */const ar=$('#app').getBoundingClientRect(),q=$('#questChip').getBoundingClientRect();let b=$('#botUI').getBoundingClientRect().top;const ii=$('#itemInfo');if(!ii.hidden){const t=ii.getBoundingClientRect().top;if(t>0)b=Math.min(b,t)}return[30,q.bottom-ar.top+50,VW-30,b-ar.top-100]}
function tutSpot(id){const sz=BL[id].sz||[1,1],V=tutView(),vc=[Math.floor((cam.x+(V[0]+(V[2]-V[0])*.72)/cam.z)/TS-sz[0]/2+.5),Math.floor((cam.y+(V[1]+(V[3]-V[1])*.66)/cam.z)/TS-sz[1]/2+.5)];/* 画面の右下のマス（まん中だとじゃまなので） */
  const k=S.quest+':'+id+':'+vc;if(tutCache.k===k&&performance.now()-tutCache.t<1500)return tutCache.v;let v=null;
  const inV=(x,y)=>{const sx=((x+sz[0]/2)*TS-cam.x)*cam.z,sy=((y+sz[1]/2)*TS-cam.y)*cam.z;return sx>=V[0]&&sx<=V[2]&&sy>=V[1]&&sy<=V[3]};
  const nf=!BL[id].floor,bare=(x,y)=>fp(id,x,y).every(([a,c])=>!S.floor[c*W+a]);/* 道や床の上はなるべくさける */
  const gap=id!=='hwall'&&!HOUSES.length;/* 家の壁のすきまには、ほかの物を案内しない */
  const near=(c0,need)=>{for(const f of nf?[1,0]:[0])for(let r=0;r<14;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=c0[0]+dx,y=c0[1]+dy;if((!need||inV(x,y))&&canPlace(id,x,y,true)&&(!f||bare(x,y))&&!(gap&&fp(id,x,y).some(([a,c])=>c===CY-2&&a>=CX-5&&a<=CX-3)))return[x,y]}return null};
  if(id==='hotstone'){let bd=1e9;for(let j=0;j<W*H;j++){const x=j%W,y=(j/W)|0;if(S.ground[j]===1||S.obj[j]||adjOf(j,k=>S.ground[k]===1)<0||!canPlace(id,x,y,true))continue;const d=Math.hypot(x-CX,y-CY);if(d<bd){bd=d;v=[x,y]}}}/* 温泉の水べを指す */
  else if(id==='bed'&&HOUSES.length){for(const j of HOUSES[0].inside){const x=j%W,y=(j/W)|0;if(!S.obj[j]&&canPlace(id,x,y,true)){v=[x,y];break}}if(!v)v=near(vc,true)}/* ベッドは家の中を指す */
  else if(id==='hwall'&&QUESTS[S.quest]&&QUESTS[S.quest].id==='wall'){for(let d=3;d<=6;d++){const x=WD===1?CX+d:CX-d,y=CY-2;if(!S.obj[y*W+x]&&canPlace(id,x,y,true)){v=[x,y];break}}if(!v)v=near([WD===1?CX+3:CX-4,CY-2],false)}/* 家のすきまを指す */
  else v=near(vc,true)||near(id==='statue'?[CX,CY-8]:[CX+2,CY+2],false);/* 指は画面の右下。置けないときは、いちばん近い置ける所 */
  const pk=S.quest+':'+id;if(v&&!inV(v[0],v[1])&&tutCache.pan!==pk){tutCache.pan=pk;const s=V[1]+V[3]-VH;centerOn((v[0]+sz[0]/2)*TS,(v[1]+sz[1]/2)*TS-s/2/cam.z)}/* 見えない所なら、一度だけそこへカメラを寄せる（クエストと物ごとに1回。画面を動かしたあとに、もう一度引きもどさない） */
  tutCache={k,t:performance.now(),v,pan:tutCache.pan};return v}
function palArrows(){const b=$('#palItems');if(!b)return;const m=b.scrollWidth-b.clientWidth;$('#palL').hidden=!(m>4&&b.scrollLeft>4);$('#palR').hidden=!(m>4&&b.scrollLeft<m-4)}
function updTut(){
  const hand=$('#tutHand');const hide=()=>{hand.hidden=true};
  if(!S||GIFT_ACTIVE||!$('#dialog').hidden||!$('#lvup').hidden||!$('#rlv').hidden||!$('#title').hidden||!$('#maps').hidden||!$('#pro').hidden||S.cleared||questGuideBlockedNow())return hide();
  const q=QUESTS[S.quest];if(!q)return hide();const qt=q.id;
  let el=null,wp=null,lbl='ここをタップ',swipe=0;
  const placeHint=id=>{
    if(sheet)return;
    if(pending&&pending.kind==='one'){el=$('#cYes');lbl='「置く」をタップ';return}
    if(mode!=='build'){el=document.querySelector('#dock [data-mode="build"]');lbl='「おく」をタップ';return}
    if(sel!==id||palOpen){if(!palOpen){el=$('#palMore');lbl='「ほかをえらぶ」をタップ';return}const nm=BL[id].kind==='plant'?iname(id):BL[id].name;el=[...document.querySelectorAll('#palItems .chip')].find(c=>c.querySelector('.nm').textContent===nm);lbl=nm+'をえらぶ';
      if(el){const pr=$('#palItems').getBoundingClientRect(),cr=el.getBoundingClientRect();if(cr.top<pr.top-2||cr.bottom>pr.bottom+2)el.scrollIntoView({block:'nearest'})}return}
    const sp=tutSpot(id);if(sp){const z=BL[id].sz||[1,1];wp=[(sp[0]+z[0]/2)*TS,(sp[1]+z[1]/2)*TS];const hh=HOUSES.find(h=>h.set.has(sp[1]*W+sp[0]));lbl=hh&&!OPENH.has(hKey(hh))?'家をタップして中を見る':'置きたい場所をタップ'}};
  const lookAt=(p,l)=>{if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else{wp=p;lbl=l}};
  if(WD===0&&TALKW&&(!S.flags.talked1||!S.godGone)&&!questGuideAccepted()&&!sheet){if(TALKW===GOD&&godHere())lookAt([godX()*TS,(godY()-2)*TS],'タップして話を聞こう');else{const r=S.res.find(q=>q.name===TALKW&&!q.hidden);if(r)lookAt([r.x*TS,(r.y-1.3)*TS],'タップして話を聞こう')}}
  else if(S.qStory!=null){}/* お話を聞く前は、クエストの案内を出さない */
  else if(WD===0&&S.summon&&STATUE>=0&&!sheet&&(S.summons||0)<2)lookAt([(STATUE%W+.5)*TS,((STATUE/W)|0)*TS-58],'「！」をタップ');
  else if(S.flags.tapAsk&&!S.flags.tapped&&$('#dialog').hidden){if(sheet==='res'){el=$('#sheetX');lbl='見たら、とじる'}else if(!sheet){if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else{const r=S.res.find(q=>!q.hidden);if(r){wp=[r.x*TS,(r.y-.5)*TS];lbl='せいれいをタップ'}}}}/* 神殿のあと：せいれいをタップしてステータスを見る */
  else if(q.talk&&!S.qTalked){}/* 会話の前は、クエストの案内を出さない */
  else if(qt==='statue'){if(WD===0&&STATUE<0&&!S.obj.includes('site'))placeHint('statue')}/* 操作の案内は1章だけ */
  else if(qt==='springA'){if(inv('hotstone')>0)placeHint('hotstone')}
  else if(qt==='table'){const g=orderTut('table');if(g&&g.kind==='place')placeHint('table');else if(g&&g.kind==='close'){el=$('#sheetX');lbl='依頼ボードをとじる'}else if(g&&g.kind==='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else if(g&&g.kind==='board'){wp=[(BOARD%W+.5)*TS,((BOARD/W)|0)*TS+8];lbl='依頼ボードをタップ'}else if(g&&g.kind==='tab'){el=document.querySelectorAll('.ctab')[g.tab];lbl='「家具」をタップ'}else if(g&&g.kind==='row'){const row=[...document.querySelectorAll('#sheetBody .row')].find(r=>r.textContent.includes(BL.table.name));el=row&&row.querySelector('button');lbl=el&&el.disabled?'パワーや素材が集まるまで待とう':'食卓の「はる」をタップ'}}
  else if((qt==='stor'||qt==='mbox')&&sheet==='craft'&&S.orders.some(o=>o.type===(qt==='stor'?'stor':'mbox'))&&inv(qt==='stor'?'stor':'mbox')<=0){el=$('#sheetX');lbl='とじる'}/* はったあと：画面をとじて、できあがりを待つ */
  else if(qt==='farm6'){if(inv('farm')>0)placeHint('farm')}
  else if(qt==='imoseed'){if(imoSeedQuestPlots().length>=2)return hide();if(sheet){el=$('#sheetX');lbl='とじる'}else if(mode!=='build'){el=document.querySelector('#dock [data-mode="build"]');lbl='「おく」をタップ'}
    else if(!(sel==='seed:imo'&&cseed('imo')>0)){const c=[...document.querySelectorAll('#palItems .chip')].find(b=>b.textContent.includes(CROPS.imo.name+'のたね')&&!b.classList.contains('zero'));if(c){el=c;lbl='たねをえらぶ'}else{el=$('#palMore');lbl='ほかをえらぶ'}}
    else{let fj=-1;for(let j=0;j<S.obj.length;j++)if(S.obj[j]==='farm'&&S.dyn[j]&&S.dyn[j].crop===null&&!imoSeedQuestPlots().includes(j)){fj=j;break}if(fj>=0){wp=[(fj%W+.5)*TS,((fj/W)|0)*TS+16];lbl='畑をタップ'}}}/* たねは「おく」からえらんで、畑をタップ */
  else if(qt==='oracle'){
    if(S.flags.oracleSet){if(sheet){el=$('#sheetX');lbl='とじて、話を聞こう'}}
    else if(sheet==='menu'&&sheetArg==='oracle'){el=document.querySelector('#sheetBody [data-oracle="food"]');lbl='好きな方針をえらぶ'}
    else if(sheet==='menu'&&!sheetArg){el=document.querySelector('#sheetBody [data-menu="oracle"]');lbl='「おつげ」をタップ'}
    else if(sheet==='menu'){el=document.querySelector('#sheetBody .back');lbl='メニューにもどる'}
    else if(sheet){el=$('#sheetX');lbl='とじてメニューをひらこう'}
    else{el=document.querySelector('#dock [data-sheet="menu"]');lbl='「メニュー」をタップ'}
  }
  else if(qt==='stor'||qt==='mbox'){const bid=qt==='stor'?'stor':'mbox',tb=craftTabFor(bid),tn=CRAFT_TABS[tb][0],bn=BL[bid].name;
    if(inv(bid)>0)placeHint(bid);
    else if(!S.orders.some(o=>o.type===bid)){
      if(sheet==='craft'){if(craftTab!==tb){el=document.querySelectorAll('.ctab')[tb];lbl='「'+tn+'」をタップ'}else{const row=[...document.querySelectorAll('#sheetBody .row')].find(r=>r.textContent.includes(bn));el=row&&row.querySelector('button');lbl=el&&el.disabled?'木材が集まるまで待とう':'「はる」をタップ'}}
      else if(!sheet){if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else if(BOARD>=0){wp=[(BOARD%W+.5)*TS,((BOARD/W)|0)*TS+8];lbl='依頼ボードをタップ'}}}}
  else if(qt==='fence4'){if(inv('fence')>0)placeHint('fence')}
  else if(qt==='wall'){if(inv('hwall')>0)placeHint('hwall')}
  else if(qt==='bed'){if(inv('bed')>0)placeHint('bed')}
  else if(qt==='watch1'){if(watchQ())placeHint('watch');else if(inv('spike')>0&&(S.placed.spike||0)<2)placeHint('spike')}
  else if(qt==='trade'){if(sheet==='shop'){if(S.flags.traded){el=$('#shopEnd');lbl='交換がおわったら「交換をおわる」'}else{el=[...document.querySelectorAll('#sheetBody .btn.pri')].find(b=>!b.disabled);lbl='交換してみよう'}}else if(!sheet&&godHere()){if(mode!=='look'){el=document.querySelector('#dock [data-mode="look"]');lbl='「みる」をタップ'}else{wp=[godX()*TS,(godY()-.2)*TS];lbl='カミサマをタップ'}}}
  let x,y;
  if(el){const r=el.getBoundingClientRect(),ar=$('#app').getBoundingClientRect();if(!r.width)return hide();x=r.left-ar.left+r.width/2;y=r.top-ar.top+r.height/2}
  else if(wp){const ar=$('#app').getBoundingClientRect(),cr=cv.getBoundingClientRect();x=cr.left-ar.left+(wp[0]-cam.x)*cam.z*(cr.width/VW);y=cr.top-ar.top+(wp[1]-cam.y)*cam.z*(cr.height/VH);if(x<0||y<0||x>ar.width||y>ar.height)return hide()}
  else return hide();
  hand.hidden=false;hand.style.transform='translate('+x+'px,'+y+'px)';hand.classList.toggle('up',y<120);hand.classList.toggle('down',!swipe&&y>innerHeight-110);// 画面の下のほうは指を上から向ける
  hand.classList.toggle('swipe',!!swipe);hand.classList.toggle('rev',swipe<0);hand.querySelector('.lbl').textContent=lbl;{const L=hand.querySelector('.lbl');L.style.marginLeft='0px';const lr=L.getBoundingClientRect();let sh=0;if(lr.right>innerWidth-8)sh=innerWidth-8-lr.right;else if(lr.left<8)sh=8-lr.left;L.style.marginLeft=sh+'px'}// ラベルが画面からはみ出さないように
}
function frameErr(w,e){/* 1コマで失敗しても、表示（HUD）の更新や次のコマは止めない。原因をたどれるよう、メッセージをのこす */const m=w+': '+(e&&e.message)+' @'+((e&&e.stack||'').split('\n')[1]||'').replace(/^.*[\/\\]/,'').slice(-60);window.__frameErr=m;if(frameErr.last!==m){frameErr.last=m;console.error(m);try{toast('エラー '+m)}catch(x){}}}
function stepLooks(now,rdt){/* 見た目だけの動き（ドアの開け閉め・屋根のすけぐあい・まばたき・勇ましい顔・あらわれる演出）を、1コマに1回進める */
  const kd=1-Math.pow(.7,rdt*30);for(const[i,d]of DOOROP){if(!S.obj[i]){DOOROP.delete(i);continue}const near=S.res.some(r=>!r.hidden&&((r.y|0)*W+(r.x|0)===i||r.path&&r.path.length&&r.act&&r.act.stage==='walk'&&(r.path[0]===i||r.path[1]===i)&&Math.abs(r.x-d.cx)<d.ax+1&&Math.abs(r.y-d.cy)<d.ay+1));if(near&&d.op<.03)sfxAt('door',d.cx,d.cy);d.op+=((near?1:0)-d.op)*kd}/* ドアを通る子がいるときだけ開く：ドアのマスにいる子か、歩いていて、つぎの2マスのうちにドアを通る子（近くで休んだり遊んだりしているだけでは開かない）。開きはじめにガチャ */
  const dt=Math.min(.1,rdt);for(const[k,v]of ROOFS){const tg=OPENH.has(k)?0:1;v.a+=Math.sign(tg-v.a)*Math.min(Math.abs(tg-v.a),dt*5)}
  for(const r of S.res){
    if(r.spawnT&&now-r.spawnT>=1300){r.spawnT=0;JUMP.set(r,now)}
    if(isWatch(r)&&(r.act&&r.act.type==='patrol'&&r.act.hunt!=null||now-(r.swing||-1e9)<900&&now>=(r.swing||0)))BRAVET.set(r,now);/* 勇ましい顔は、ちらちら消えないよう、1.5秒つづける */
    const v=SPV.get(r);if(v&&now>v.bl+140)v.bl=now+2500+Math.random()*3500}}
function frame(now){
  if(!running)return;requestAnimationFrame(frame);
  const menuOpen=!$('#title').hidden||!$('#maps').hidden;
  if(!S){last=now;return}
  if(now-frameT<(menuOpen?125:31))return;frameT=now;/* タイトルは静止画なので8コマ/秒。ゲーム中は30コマ/秒 */
  if(now-tutT>120){tutT=now;try{palArrows();updTut()}catch(e){}}
  const rdt=Math.min(.25,(now-last)/1000);last=now;
  const PZ=started&&sheet!=null,prdt=PZ?0:rdt;/* メニューを開いているあいだは、アニメーションも止める */
  if(camAnim){camAnim.t+=rdt;const p=Math.min(1,camAnim.t/camAnim.dur),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;cam.z=camAnim.fz+(camAnim.tz-camAnim.fz)*e;centerOn(camAnim.fx+(camAnim.tx-camAnim.fx)*e,camAnim.fy+(camAnim.ty-camAnim.fy)*e);if(p>=1){const d=camAnim.done;camAnim=null;if(d)d()}}
  if(started&&!window.__noIdle&&now-lastIn>120000&&$('#idle').hidden&&$('#title').hidden&&$('#maps').hidden){$('#idle').hidden=false;try{save()}catch(e){}}
  if(SKIP&&!(isNight()&&S.enemyOn))SKIP=false;/* 朝になったら、ふつうの速さにもどす */
  if(started&&!menuOpen&&$('#pro').hidden&&sheet==null&&NEWRES==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden)showItemGift();
  if(!paused()){if(S.speed>1&&!TESTSPD&&!TESTM){S.glassT=Math.max(0,(S.glassT||0)-rdt);if(S.glassT<=0)S.speed=1}glassUI();LIGHTCD=Math.max(0,LIGHTCD-rdt*S.speed*(SKIP?40:1));AREACD=Math.max(0,AREACD-rdt*S.speed*(SKIP?40:1));let g=rdt*MIN_PER_SEC*S.speed*(SKIP?40:1);while(g>0){const s=Math.min(g,2);try{stepWorld(s)}catch(e){frameErr('step',e);break}g-=s;if(performance.now()<BOSSHOLD)break}/* オオカゲの登場・撃破で止めたら、残りは進めない */}
  for(const f of floats)f.life-=prdt*.7;while(floats.length&&floats[0].life<=0)floats.shift();
  for(const s of shots)s.life-=prdt*1.4;while(shots.length&&shots[0].life<=0)shots.shift();
  for(const f of fx){f.life-=prdt*(f.k==='ring'?(f.col?1.3:2.2):f.k==='pillar'?.9:f.k==='slash'?3:1.4);if(f.k!=='ring'&&f.k!=='pillar'&&!PZ){f.x+=f.vx*rdt;f.y+=f.vy*rdt;f.vy+=(f.k==='p'?260:40)*rdt;f.vx*=.96}}
  for(let i=fx.length-1;i>=0;i--)if(fx[i].life<=0)fx.splice(i,1);
  for(const m of motes){m.y-=prdt*.012*m.s;m.x+=Math.sin(now/2000+m.p)*prdt*.004;if(m.y<0){m.y=1;m.x=Math.random()}}
  if(S.rain)for(const d of rain){d.y+=prdt*1.2*d.s;if(d.y>1){d.y=0;d.x=Math.random()}}
  stepLooks(now,rdt);
  if(!PZ&&!menuOpen&&$('#pro').hidden){try{render(now)}catch(e){frameErr('render',e)}}/* タイトル・導入会話・メニュー中は、背景ワールドを描かない */
  if(AC)wantSong=(!$('#title').hidden||!$('#maps').hidden||!$('#pro').hidden)?'opening':(isDark()?'night':'day');
  if(started){hudT+=rdt;if(hudT>.3){hudT=0;updHUD()}
    if(!GIFT_ACTIVE&&RLVQ.length&&sheet==null&&NEWRES==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden)rlvShow(RLVQ.shift());
    if(!GIFT_ACTIVE&&NEWQ.length&&NEWRES==null&&$('#dialog').hidden&&$('#lvup').hidden&&$('#rlv').hidden&&performance.now()>=NEWQ[0].t){const q=NEWQ.shift();if(S.res.some(x=>x.id===q.id)){NEWRES=q.id;resTab=0;sfx('next');openSheet('res',q.id)}else HOLD.delete(q.id)}
    questT+=rdt;if(questT>1&&!GIFT_ACTIVE){questT=0;checkLevel();checkQuest()}
    saveT+=rdt;if(saveT>10){saveT=0;save()}}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;save();KV.push(true);if(AC)AC.suspend()}else{if(AC)AC.resume();if(!running){running=true;last=performance.now();requestAnimationFrame(frame)}}});
addEventListener('pagehide',()=>{save();KV.push(true)});
addEventListener('resize',resize);
/* 一度画面をとじて戻ると音が止まったままになる（iOS）→ 次のタッチで鳴らしなおす */
for(const ev of ['pointerdown','touchend','click'])document.addEventListener(ev,()=>{if(AC&&AC.state!=='running'&&!document.hidden)AC.resume().catch(()=>{})},true);addEventListener('focus',()=>{if(AC&&AC.state!=='running')AC.resume().catch(()=>{})});

$('#alert').addEventListener('click',()=>{const L=S.enemies.filter(e=>e.spawned&&!e.dead);if(!L.length)return;ALI=(ALI+1)%L.length;const e=L[ALI];centerOn(e.x*TS,e.y*TS);sfx('tap')});/* 「コワイノ ○体」をタップすると、その場所へ */
$('#guardStatus').addEventListener('click',e=>{e.stopPropagation();if(!S||!started)return;if(LIGHTCD>0)return toast('まもりの光は、あと'+Math.ceil(LIGHTCD/(S.speed||1))+'秒');if(S.pt<1)return toast('パワーが足りません');sfx('tap');LIGHTARM=!LIGHTARM;AREAARM=false;if(LIGHTARM)toast('光をあてる物をタップ')});
$('#areaBtn').addEventListener('click',e=>{e.stopPropagation();if(AREACD>0)return toast('ひかりのはどうは、あと'+Math.ceil(AREACD/(S.speed||1))+'秒');if(S.pt<3)return toast('パワーが足りません');sfx('tap');AREAARM=!AREAARM;LIGHTARM=false;if(AREAARM)toast('光をはなつ場所をタップ（まわり2マス）')});
$('#skipBtn').addEventListener('click',()=>{if(!canSkip())return;sfx('tap');SKIP=true;$('#skipBtn').hidden=true;toast('朝まで休もう…','good')});
let RLVR=null;
function rlvShow(q){const r=S.res.find(x=>x.id===q.id);if(!r)return;RLVR=r;const o=$('#rlv'),a=rStat(r,q.from),b=rStat(r,q.to);
  const pt=o.querySelector('.rpt');pt.style.backgroundImage='url('+spiritPort(r.elem,96,r.vr)+')';pt.style.boxShadow='inset 0 0 0 3px '+ELEM[r.elem].col;
  o.querySelector('.rtt').innerHTML='';o.querySelector('.rtt').append(r.name+' が ',Object.assign(document.createElement('b'),{textContent:'Lv'+q.to}),' になった！');
  const g=o.querySelector('.rrows');g.innerHTML='';for(const[k,n]of RSTN){const f=v=>k==='bonus'?'+'+v:k==='atk'&&!v?'なし':String(v);const up=b[k]!==a[k];const x=document.createElement('span'),y=document.createElement('span');x.textContent=n;y.textContent=up?f(a[k])+' → '+f(b[k]):f(b[k]);if(up)y.className='up';g.append(x,y)}
  if(q.to===3||q.to===5||q.to===10)memo('⬆️',r.name+'がLv'+q.to+'になった');o.hidden=false;sfx('quest')}
$('#rlvOk').addEventListener('click',e=>{e.stopPropagation();sfx('tap');$('#rlv').hidden=true;const r=RLVR;RLVR=null;if(r&&S.res.includes(r)){const t=performance.now();JOYU.set(r,t+2600);RHOLD.set(r,t+2600);JUMP.set(r,t);r.bubble='😆'}});/* レベルアップしたら、手をとめて喜ぶ */
for(const id of['#foodStk','#matStk']){const e=$(id);const go=ev=>{if(ev)ev.stopPropagation();if(!started||!S)return;sfx('tap');openSheet('inv')};e.addEventListener('click',go);e.addEventListener('keydown',k=>{if(k.key==='Enter'||k.key===' ')go()})}/* 食料・素材の数をタップすると、そうこが見られる */
$('#lvOk').addEventListener('click',e=>{e.stopPropagation();sfx('tap');$('#lvup').hidden=true;endClap()});
document.querySelector('.hud').addEventListener('click',()=>{if(!S)return;sfx('tap');openSheet('vill')});/* HUD をタップすると村のようす */
$('#dock').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sfx('tap');if(b.dataset.mode)setMode(b.dataset.mode);else if(b.dataset.sheet)openSheet(b.dataset.sheet)});
$('#sheetX').onclick=closeSheet;$('#scrim').onclick=closeSheet;
$('#questChip').onclick=()=>openSheet('menu','goal');/* 目標の一覧を直接ひらく */
$('#speedBtn').onclick=()=>{if(!(hasGlass()||TESTM)){if(glassUnlocked())adPrompt();return}sfx('tap');S.speed=S.speed===1?2:S.speed===2&&TESTM?3:S.speed===3&&TESTM?5:1;/* 広告でできるのは2倍まで */glassUI()};
$('#helpPop').onclick=()=>{sfx('tap');$('#helpPop').hidden=true};$('#undoBtn').onclick=undo;$('#palL').onclick=()=>$('#palItems').scrollBy({left:-$('#palItems').clientWidth*.7,behavior:'smooth'});$('#palR').onclick=()=>$('#palItems').scrollBy({left:$('#palItems').clientWidth*.7,behavior:'smooth'});$('#palItems').addEventListener('scroll',palArrows,{passive:true});
$('#cYes').onclick=confirmYes;$('#cRot').onclick=e=>{e.stopPropagation();rotPending()};$('#cNo').onclick=()=>{pending=null;selRect=null;$('#confirm').hidden=true};

/* ---------- 起動 ---------- */
resize();
showUI(false);$('#app').classList.add('ready');
KV.onCloud(()=>{if(started)return;if(!$('#maps').hidden)showMaps()});
requestAnimationFrame(frame);
window.__game={get doSummon(){return doSummon},get pinkPrompts(){return {...SEVW}},checkSev,sevTalk,get RECIPES(){return RECIPES},subTalk,walk,hour,nushiReturns,centerOn,rebuild(){rebuildStatic(true)},get cam(){return cam},get avoidPath(){return avoidPath},get bfs(){return bfs},get moveR(){return moveR},get sepRes(){return sepRes},get pathTo(){return pathTo},dialog,get drawObj(){return drawObj},get drawFloor(){return drawFloor},get drawShade(){return drawShade},set ICON(v){ICON=v},openSheet,get S(){return S},stepWorld,place,spawnWave,waveFor,checkLevel,checkQuest,newGame,orderFurn,recount,get ATTR(){return ATTR},get BASEPCT(){return BASEPCT}};
})();
