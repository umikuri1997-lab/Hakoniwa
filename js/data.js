'use strict';

/* ---------- もの ---------- */
// kind: block・plant=おそなえ/カミサマとの交換でおそなえ箱に入る / furn=依頼ボードでせいれいが作る / build=せいれいが建てる（パワー）
const BL={
  path:{name:'あぜ道',kind:'block',floor:1,lv:2,cost:1,pc:2,time:30,maker:'earth',qty:10,mat:{stone:2},attr:{earth:.25},desc:'草地のあいだを通る土の道。歩く速さ×1.25'},
  bridge:{name:'木の橋',kind:'build',lv:5,pc:2,time:40,maker:'wood',mat:{wood:4},desc:'川や池にかける木の橋。歩いてわたれる'},
  ladder_wood:{name:'オークのハシゴ',kind:'build',lv:3,pc:8,time:30,maker:'wood',mat:{wood:8},desc:'段差のがけに立てかけるハシゴ。上り下りの速さ×0.5'},
  ladder_bamboo:{name:'竹のハシゴ',kind:'build',lv:3,w:1,pc:8,time:30,maker:'wood',mat:{bamboo:8},desc:'段差のがけに立てかけるハシゴ。上り下りの速さ×0.5'},
  stairs_wood:{name:'木の階段',kind:'build',lv:8,pc:25,time:50,maker:'wood',mat:{wood:25},attr:{wood:.3},desc:'段差を上り下りできる'},
  stairs_brick:{name:'レンガの階段',kind:'build',lv:6,w:1,pc:35,time:60,maker:'fire',mat:{stone:35},attr:{fire:.5},desc:'段差を上り下りできる'},
  stairs_stone:{name:'石の階段',kind:'build',lv:4,w:1,pc:30,time:60,maker:'earth',mat:{stone:30},attr:{earth:.5},desc:'段差を上り下りできる'},
  slope_earth:{name:'土の坂',kind:'build',lv:4,pc:20,time:40,maker:'earth',mat:{stone:20},attr:{earth:.25},desc:'段差を上り下りできる'},
  woodpath:{name:'木の道',kind:'block',floor:1,cost:2,pc:4,time:40,maker:'wood',qty:10,lv:7,mat:{wood:6},attr:{wood:.75},desc:'木の板をしいた道。歩く速さ×1.55'},
  gravel:{name:'砂利道',kind:'block',floor:1,cost:1,pc:3,time:30,maker:'earth',qty:10,lv:5,mat:{stone:3},attr:{earth:.4},desc:'小石をしいた道。歩く速さ×1.4'},
  brick:{name:'レンガ道',kind:'block',floor:1,cost:3,pc:5,time:50,maker:'fire',qty:10,lv:6,w:1,mat:{stone:8},attr:{fire:.4,earth:.3},desc:'レンガをしきつめた道。歩く速さ×1.75'},
  floor:{name:'フローリング',kind:'block',floor:1,lv:4,cost:1,pc:2,time:30,maker:'wood',qty:10,mat:{wood:2},attr:{wood:.5},desc:'木目のそろった板の床。歩く速さ×1.15'},
  brickfloor:{name:'レンガ床',kind:'block',floor:1,lv:5,w:1,cost:3,pc:5,time:50,maker:'fire',qty:10,mat:{stone:3},attr:{fire:.4,earth:.3},desc:'レンガをしきつめた家の床。歩く速さ×1.15'},
  stonefloor:{name:'石の床',kind:'block',floor:1,lv:6,cost:2,pc:4,time:40,maker:'earth',qty:10,mat:{stone:3},attr:{earth:.5},desc:'石をしきつめた家の床。歩く速さ×1.15'},
  herrfloor:{name:'ヘリンボーンの床',kind:'block',floor:1,lv:1,cost:2,pc:4,time:45,maker:'wood',qty:10,mat:{wood:3},attr:{wood:.5},kwr:1,desc:'ダークチェリーの板を、山がたにしきつめた床。歩く速さ×1.15'},/* コワイノのレシピ */
  carpet:{name:'じゅうたん',kind:'block',floor:1,lv:9,cost:2,pc:3,time:35,maker:'wind',qty:10,mat:{wood:2},attr:{wind:.5},desc:'やわらかな織り模様の床。歩く速さ×1'},
  stone:{name:'石畳',kind:'block',floor:1,cost:2,pc:4,time:40,maker:'earth',qty:10,lv:4,w:1,mat:{stone:6},attr:{earth:.75},desc:'しっかりした石の床。歩く速さ×1.55'},
  farm:{name:'畑',kind:'block',cost:4,dyn:1,attr:{},desc:'置くとせいれいが耕して種をまく。水やりすると育つ。こむぎ・キャベツは2日で食料+1、いもは3日で食料+2'},
  misugaki:{name:'御簾垣',fix:2,fixm:{bamboo:1},kind:'block',cost:2,pc:4,time:60,maker:'wood',qty:10,w:1,solid:1,brk:1,hp:20,hpS:30,attr:{},mat:{bamboo:5},desc:'「コワイノ」の足止め。じょうぶさ20'},
  fence:{name:'柵',fix:2,fixm:{wood:1},kind:'block',cost:2,pc:4,time:60,maker:'wood',qty:10,solid:1,hp:20,hpS:30,attr:{},mat:{wood:5},desc:'「コワイノ」の足止め。じょうぶさ20'},
  logfence:{name:'丸太の塀',fix:3,fixm:{wood:1},kind:'block',cost:3,pc:6,time:70,maker:'wood',qty:10,lv:6,offerOnly:1,solid:1,brk:1,hp:36,hpS:54.4,attr:{},mat:{wood:7},desc:'太い丸太をすきまなくならべた塀。じょうぶさ36'},
  bedge:{name:'花壇のふち',kind:'block',cost:1,pc:2,time:20,maker:'wood',qty:10,lv:8,attr:{},mat:{wood:1},desc:'花壇をかこむ、低い丸太のふち'},
  bamboofence:{name:'竹の柵',fix:3,fixm:{bamboo:1},kind:'block',cost:3,pc:7,time:75,maker:'wood',qty:10,lv:4,offerOnly:1,solid:1,brk:1,hp:32,hpS:48.8,attr:{},mat:{bamboo:8},desc:'竹を組んだ柵。じょうぶさ32'},
  bamboowall:{name:'竹の壁',fix:3,fixm:{bamboo:1},kind:'block',cost:2,pc:6,time:60,maker:'wood',qty:10,lv:3,w:1,solid:1,hp:30,hpS:45.5,attr:{},mat:{bamboo:3},desc:'かこってドアをつけると家になる。じょうぶさ30'},
  hwall:{name:'オークの壁',fix:3,fixm:{wood:1},kind:'block',cost:2,pc:6,time:60,maker:'wood',qty:10,lv:3,solid:1,hp:30,hpS:45.5,attr:{},mat:{wood:6},desc:'かこってドアをつけると家になる。じょうぶさ30'},
  logwall:{name:'丸太の壁',fix:4,fixm:{wood:1},kind:'block',cost:3,pc:9,time:80,maker:'wood',qty:10,lv:7,solid:1,hp:50,hpS:75.5,brk:1,attr:{},mat:{wood:9},desc:'丸太を組んだ家の壁。じょうぶさ50'},
  plasterwall:{name:'しっくいの壁',fix:5,fixm:{wood:1},kind:'block',cost:4,pc:11,time:90,maker:'earth',qty:10,lv:5,solid:1,hp:48,hpS:72.2,brk:1,attr:{},mat:{wood:6,stone:3},desc:'明るいしっくい仕上げの家の壁。じょうぶさ48'},
  brickwall:{name:'レンガの壁',fix:6,fixm:{stone:1},kind:'block',cost:5,pc:13,time:100,maker:'fire',qty:10,lv:6,w:1,solid:1,hp:55,hpS:82.25,brk:1,attr:{},mat:{stone:14},desc:'レンガを積んだ家の壁。じょうぶさ55'},
  wall:{name:'石の塀',fix:6,fixm:{stone:1},kind:'block',cost:5,pc:12,time:100,maker:'earth',qty:10,lv:8,w:1,solid:1,hp:60,hpS:90,attr:{},mat:{stone:14},desc:'石を積んだ塀。じょうぶさ60'},
  clover:{sp:9,name:'シロツメクサ',item:'シロツメクサの種',kind:'plant',cost:3,attr:{wood:1},desc:'まわり3マスで、たのしさ+0.2／1時間'},
  bellf:{sp:9,name:'ききょう',item:'ききょうの種',kind:'plant',cost:3,attr:{earth:1},desc:'まわり3マスで、たのしさ+0.2／1時間'},
  salvia:{sp:9,name:'サルビア',item:'サルビアの種',kind:'plant',cost:3,attr:{fire:1},desc:'まわり3マスで、たのしさ+0.2／1時間'},
  lily:{sp:9,name:'ゆり',item:'ゆりの種',kind:'plant',cost:3,attr:{wind:1},desc:'まわり3マスで、たのしさ+0.2／1時間'},
  lotus:{sp:9,name:'ハス',item:'ハスの種',kind:'plant',cost:3,attr:{water:1},desc:'池にうかぶ花。まわり3マスで、たのしさ+0.2／1時間。まわり2マスで水浴びすると、たのしさ×1.5 / つかれ −9／1時間'},
  tree:{hp:5,brk:1,fix:1,fixm:{},name:'木',item:'木の苗',kind:'plant',cost:4,lv:3,solid:1,env:1,attr:{wood:3},desc:'まわり5マスを緑にする。まわり3マスで、たのしさ+0.4／1時間'},
  fruit:{hp:5,brk:1,fix:1,fixm:{},name:'果物の木',item:'果物の苗',kind:'plant',cost:10,lv:6,solid:1,dyn:1,env:1,attr:{wood:3,water:1},desc:'まわり5マスを緑にする。まわり3マスで、たのしさ+0.4／1時間。4日ごとに、りんごが実る。食料+2'},
/* 新しい家具（スクリプトで描く） */
  stool:{name:'木のスツール',kind:'furn',lv:1,cat:'living',f2:1,pc:1,time:60,maker:'wood',attr:{wood:1},mat:{wood:1,eda:2},mat1:{bamboo:2},desc:'小さないす。食卓のとなりで食べると、パワー+0.45。住み心地+2'},
  stable:{hp:5,brk:1,fix:2,fixm:{wood:2},dw:1,name:'まるいサイドテーブル',kind:'furn',cat:'living',f2:1,lv:4,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:3},solid:1,desc:'お花とカップをのせた小さなテーブル。住み心地+4'},
  pouf:{name:'まるクッション',kind:'furn',lv:5,cat:'living',f2:1,pc:1,time:60,maker:'wind',attr:{wind:1},mat:{wood:1,kasa:3},mat1:{wood:1,chiri:3},desc:'ころんとしたクッション。食卓のとなりで食べると、パワー+0.9。住み心地+3'},
  achair:{name:'ひじかけいす',kind:'furn',lv:9,cat:'living',f2:1,pc:5,time:100,maker:'wood',attr:{wood:1},mat:{wood:8},desc:'ゆったりすわれるいす。食卓のとなりで食べると、パワー+2.25。住み心地+5'},
  ltable:{hp:5,brk:1,fix:3,fixm:{wood:3},dw:1.5,name:'ローテーブル',kind:'furn',cat:'living',f2:1,lv:5,pc:5,time:100,maker:'wood',attr:{wood:1},mat:{wood:6},solid:1,desc:'ひくいテーブル。住み心地+5'},
  rug1:{cs:1.5,sz:[2,2],dw:1.25,name:'ひしがたラグ',kind:'furn',cat:'living',f2:1,lv:6,pc:3,time:80,maker:'wind',attr:{wind:1},mat:{shina:6},mat1:{kuru:6},desc:'床にしくラグ。住み心地+5',anim:1},
  sofa1:{hp:5,brk:1,fix:5,fixm:{wood:10},dw:2.5,offerOnly:1,name:'ひとりがけソファ',kind:'furn',cat:'living',f2:1,lv:6,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'しずみこむソファ。住み心地+6'},
  hoshirug:{cs:1.5,sz:[2,2],dw:1.25,name:'ほしぞらのラグ',kind:'furn',cat:'living',f2:1,lv:1,pc:3,time:80,maker:'wind',attr:{wind:1},mat:{wood:5},kwr:1,desc:'夜空の色のラグ。住み心地+5',anim:1},/* コワイノのレシピ */
  rug2:{offerOnly:1,cs:1.5,sz:[2,2],dw:1.75,name:'くもラグ',kind:'furn',cat:'living',f2:1,lv:7,pc:5,time:100,maker:'wind',attr:{wind:1},mat:{wood:15},desc:'くもの形のラグ。住み心地+6',anim:1},
  tub:{hp:5,brk:1,fix:2,fixm:{wood:1,funba:1},name:'水おけ',kind:'furn',cat:'cook',f2:1,lv:3,pc:3,time:80,maker:'water',attr:{water:1},mat:{wood:3},solid:1,desc:'料理をする家具のまわり3マスにあると、料理の時間-10%（重複なし）。住み心地+3'},
  cooktable:{hp:5,brk:1,fix:2,fixm:{wood:2},name:'調理台',kind:'furn',cat:'cook',lv:3,w:0,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:4},solid:1,desc:'火を使わない料理を作る台。料理をする家具のまわり3マスにあると、料理の時間-10%（重複なし）。住み心地+4'},
  sink:{hp:5,brk:1,fix:4,fixm:{stone:3},name:'流し台',kind:'furn',cat:'cook',f2:1,lv:4,pc:7,time:120,maker:'water',attr:{water:1},mat:{stone:5},solid:1,desc:'料理をする家具のまわり3マスにあると、料理の時間-10%（重複なし）。住み心地+4'},
  niguruma:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'にぐるま',kind:'furn',cat:'other',f2:1,sz:[2,1],pc:4,time:90,maker:'wood',attr:{wood:1},mat:{wood:10},solid:1,desc:'荷物をはこぶ車。まわり3マスの箱に、しまう速さ+20%（重複なし）'},
  kabedougu:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'どうぐたて',kind:'furn',cat:'other',f2:1,pc:3,time:70,maker:'wood',attr:{wood:1},mat:{wood:6,stone:2},solid:1,desc:'おのとくわを立てておく道具たて。まわり3マスの箱に、しまう速さ+20%（重複なし）'},
  kabebukuro:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'かべかけのふくろ',kind:'furn',cat:'other',f2:1,pc:3,time:70,maker:'earth',attr:{earth:1},mat:{funba:5,wood:2},solid:1,desc:'壁にかけるふくろ。食料を55までしまえる。住み心地+3'},
  taru:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'たる',kind:'furn',cat:'other',f2:1,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:8},solid:1,desc:'食料を60までしまえる。住み心地+3'},
  asabukuro:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'あさぶくろ',kind:'furn',cat:'other',f2:1,pc:3,time:70,maker:'earth',attr:{earth:1},mat:{funba:6,wood:2},solid:1,desc:'素材を65までしまえる。住み心地+3'},
  makidana:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'まき棚',kind:'furn',cat:'other',f2:1,pc:4,time:90,maker:'wood',attr:{wood:1},mat:{wood:10},solid:1,desc:'素材を130までしまえる。住み心地+3'},
  crate:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'木箱',kind:'furn',cat:'other',f2:1,lv:2,pc:3,time:80,maker:'earth',attr:{earth:1},mat:{wood:8},solid:1,desc:'食料を30・素材を30までしまえる。住み心地+3'},
  monstera:{hp:5,brk:1,fix:2,fixm:{funba:3,stone:2},name:'かんようしょくぶつ',kind:'furn',cat:'other',f2:1,lv:4,pc:4,time:80,maker:'wood',attr:{wood:1},mat:{shina:5,stone:3},mat1:{kuru:5,stone:3},solid:1,desc:'大きな葉の鉢植え。住み心地+10'},
  shelf1:{hp:5,brk:1,fix:5,fixm:{wood:10},name:'本棚',kind:'furn',cat:'other',f2:1,lv:6,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'本と植物の棚。住み心地+12。素材を160までしまえる'},
  wreath:{hp:5,brk:1,fix:2,fixm:{eda:3,funba:3},offerOnly:1,name:'リース',kind:'furn',cat:'other',f2:1,lv:6,pc:4,time:80,maker:'wood',attr:{wood:1},mat:{eda:6,shina:6},mat1:{eda:6,kuru:6},solid:1,desc:'葉と花のリース。住み心地+10'},
  curtain1:{hp:5,brk:1,fix:3,fixm:{wood:8},name:'カーテン',kind:'furn',cat:'other',f2:1,lv:10,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:10,shina:5},mat1:{wood:10,kuru:5},solid:1,desc:'窓にかけるカーテン。やわらかい光が入る。住み心地+10'},
  cabinet:{hp:5,brk:1,fix:5,fixm:{wood:10},offerOnly:1,name:'キャビネット',kind:'furn',cat:'other',f2:1,lv:7,pc:9,time:120,maker:'earth',attr:{earth:1},mat:{wood:20},solid:1,desc:'とびらつきの棚。住み心地+12。食料を90までしまえる'},
  paint2:{hp:5,brk:1,fix:3,fixm:{wood:8},name:'葉っぱの額',kind:'furn',cat:'other',f2:1,lv:7,pc:5,time:80,maker:'wood',attr:{wood:1},mat:{wood:8},solid:1,desc:'葉っぱの絵。住み心地+10'},
  shelf2:{hp:5,brk:1,fix:6,fixm:{wood:15,stone:4},offerOnly:1,name:'かざり棚',kind:'furn',cat:'other',f2:1,lv:8,pc:11,time:140,maker:'wood',attr:{wood:1},mat:{wood:30,stone:8},solid:1,desc:'小物をかざる棚。住み心地+13。素材を200までしまえる'},
  curtain2:{hp:5,brk:1,fix:3,fixm:{wood:13},offerOnly:1,name:'カーテン（緑）',kind:'furn',cat:'other',f2:1,lv:8,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:25},solid:1,desc:'森の色のカーテン。住み心地+10'},
  paint3:{hp:5,brk:1,fix:3,fixm:{wood:13},offerOnly:1,name:'花の額',kind:'furn',cat:'other',f2:1,lv:8,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:25},solid:1,desc:'花の絵。住み心地+10'},
  wshelf:{hp:5,brk:1,fix:4,fixm:{wood:10},name:'かべ棚',kind:'furn',cat:'other',f2:1,lv:8,pc:9,time:100,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'つる草をたらした棚。住み心地+12。素材を200までしまえる'},
  paint1:{hp:5,brk:1,fix:5,fixm:{wood:15},offerOnly:1,name:'風景画',kind:'furn',cat:'other',f2:1,lv:9,pc:9,time:120,maker:'water',attr:{water:1},mat:{wood:30},solid:1,desc:'草原の絵。住み心地+14'},
  bathtub:{hp:5,brk:1,fix:8,fixm:{wood:8,stone:15},offerOnly:1,name:'バスタブ',kind:'furn',cat:'other',f2:1,lv:9,pc:15,time:180,maker:'water',attr:{water:1},mat:{wood:15,stone:30},solid:1,desc:'家でもお風呂。水べでなくても、夕方ここで水浴びできる。住み心地+16'},
  candle:{hp:5,brk:1,fix:1,fixm:{wood:1},offerOnly:1,name:'ろうそく',kind:'furn',cat:'light',f2:1,lv:5,pc:1,time:60,maker:'fire',attr:{fire:1},mat:{wood:2},solid:1,desc:'あかり。住み心地+3'},
  lantern:{hp:5,brk:1,fix:2,fixm:{wood:1,can:1},name:'ランタン',kind:'furn',cat:'light',f2:1,lv:6,pc:3,time:80,maker:'fire',attr:{fire:1},mat:{wood:2,can:1},solid:1,desc:'あかり。住み心地+5'},
  flamp:{hp:5,brk:1,fix:4,fixm:{wood:2,stone:1},offerOnly:1,name:'フロアランプ',kind:'furn',cat:'light',f2:1,lv:6,pc:7,time:100,maker:'fire',attr:{fire:1},mat:{wood:3,stone:2},solid:1,desc:'あかり。住み心地+6'},
  mimamori:{name:'みまもりのぬいぐるみ',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'家の中に置くと、その家で寝たせいれいの、つかれのとれる速さ1.1倍。住み心地+6'},/* ここから、コワイノの落とし物だけで手に入る家具（絵はあとで） */
  yomawari:{name:'よまわりのランタン',kind:'furn',cat:'light',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'まわり3.5マスを照らす。住み心地+6'},
  oyasumi:{name:'おやすみのベル',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'ドアのとなりにかざるベル。住み心地+8'},
  yonaka:{name:'よなかのうたの絵',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'夜の歌の絵。住み心地+10'},
  toro:{w:1,hp:5,brk:1,fix:3,fixm:{stone:3},name:'しずけさの石どうろう',kind:'furn',cat:'light',f2:1,lv:1,pc:5,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{stone:8},sand:3,desc:'まわり3.5マスを照らす。照らした中の「コワイノ」は、攻撃と移動の速さ0.75倍（重複なし）。住み心地+6'},/* やすらぎの砂で作る */
  signpost:{hp:5,brk:1,fix:1,fixm:{wood:5},name:'道しるべ',kind:'furn',cat:'env',f2:1,lv:5,pc:1,time:60,maker:'earth',attr:{earth:1},mat:{wood:6,eda:3},solid:1,desc:'まわり3マスで、せいれいがにげる速さ×1.4（重複なし）'},
  hedge:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'生垣',kind:'furn',cat:'env',f2:1,lv:5,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:2,funba:3},solid:1,env:2,er:2,desc:'まわり2マスで、たのしさ+0.7／1時間'},
  birdbath:{hp:5,brk:1,fix:3,fixm:{stone:8},offerOnly:1,name:'水飲み鳥',kind:'furn',cat:'env',f2:1,lv:7,pc:5,time:100,maker:'water',attr:{water:1},mat:{stone:15},solid:1,env:3,desc:'まわり3マスで、たのしさ+1.1／1時間'},
  noren:{hp:5,brk:1,fix:3,fixm:{wood:4,funba:2},name:'のれん',anim:1,dsc:2,kind:'furn',cat:'env',f2:1,lv:5,pc:7,time:100,maker:'fire',attr:{fire:1},mat:{wood:8,funba:4},solid:1,env:7,er:1,desc:'温泉の入り口にかける布。まわり1マスで、たのしさ+2.5／1時間（重複なし）'},
  parasol:{hp:5,brk:1,fix:4,fixm:{wood:4,funba:2},name:'パラソル',anim:1,dsc:2,kind:'furn',cat:'env',f2:1,lv:5,pc:7,time:100,maker:'wind',attr:{wind:1},mat:{wood:8,funba:4},solid:1,env:7,er:1,desc:'まわり1マスで、たのしさ+2.5／1時間（重複なし）'},
  gazebo:{offerOnly:1,name:'ガゼボ',sz:[2,2],kind:'furn',cat:'env',lv:5,pc:8,time:120,maker:'wood',attr:{wood:2,wind:1},env:4,mat:{wood:18,stone:4},desc:'屋根のある休み場所。まわり3マスで、たのしさ+1.4／1時間'},
  azumaya:{offerOnly:1,name:'東屋',sz:[2,2],kind:'furn',cat:'env',lv:5,pc:8,time:120,maker:'earth',attr:{earth:2,fire:1},env:4,mat:{wood:18,stone:6},desc:'屋根のある休み場所。まわり3マスで、たのしさ+1.4／1時間'},
  arch:{offerOnly:1,anim:1,dsc:1.8,name:'ガーデンアーチ',kind:'furn',cat:'env',f2:1,lv:8,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:30},env:4,desc:'まわり3マスで、たのしさ+1.4／1時間'},
  slide:{name:'すべり台',sz:[2,1],kind:'furn',cat:'toy',f2:1,lv:2,pc:9,time:140,maker:'wind',attr:{wind:1},mat:{wood:8,stone:3},play:{pt:3,pw:1.35,fun:35,dur:40,cap:1,adj:1},solid:1,desc:'1人で遊べる。たのしさ +35（26.7分）。遊ぶと10%の確率で、移動速度+1'},
  sandbox:{name:'砂場',sz:[2,1],nosc:1,kind:'furn',cat:'toy',f2:1,lv:5,pc:9,time:140,maker:'earth',attr:{earth:1},mat:{wood:11,stone:11},play:{pt:3,pw:1.35,fun:40,dur:40,cap:2,adj:1},solid:1,desc:'2人まで遊べる。たのしさ +40（26.7分）。遊ぶと10%の確率で、スタミナ+1'},
  seesaw:{hp:5,brk:1,fix:6,fixm:{wood:13},name:'シーソー',kind:'furn',cat:'toy',f2:1,anim:1,dsc:2,lv:7,pc:11,time:160,maker:'wind',attr:{wind:1},mat:{wood:25},play:{pt:4,pw:1.8,fun:40,dur:40,cap:2,adj:1},solid:1,desc:'2人で遊べる。たのしさ +40（26.7分）。遊ぶと10%の確率で、はたらく速さ+1'},
  window:{name:'窓',kind:'block',cat:'other',lv:4,pc:3,time:50,maker:'wood',attr:{wood:1},mat:{wood:2},desc:'家の壁にはめる窓。住み心地+5'},
  sdoor:{name:'石の塀のドア',fix:4,fixm:{stone:3},kind:'block',anim:1,hp:60,hpS:90,cost:4,pc:8,time:60,maker:'earth',qty:1,lv:8,w:1,attr:{},mat:{stone:8},desc:'石の塀の出入り口。せいれいだけ通れる。じょうぶさ60'},
  table:{hp:5,brk:1,fix:4,fixm:{wood:4},name:'食卓',kind:'furn',pc:7,time:90,maker:'wood',solid:1,eat:{cap:2,pt:2,pw:.9},attr:{wood:2},mat:{wood:8},desc:'2人まで食べられる。食べるたびにパワー+0.9。住み心地+8'},
  stor:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'食料箱',kind:'furn',pc:3,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{wood:5},desc:'食料を50までしまえる。ここから食べる。住み心地+3'},
  mbox:{hp:5,brk:1,fix:2,fixm:{wood:2,stone:2},name:'素材箱',kind:'furn',pc:3,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{wood:3,stone:3},desc:'素材を80までしまえる。住み心地+3'},
  lumber:{hp:5,brk:1,fix:8,fixm:{wood:13,stone:4},name:'伐採場',kind:'build',mat:{wood:25,stone:8},pc:15,time:120,maker:'wood',lv:5,solid:1,attr:{wood:2},desc:'せいれいがここで働くと、13.3分ごとに木材+1'},
  quarry:{hp:5,brk:1,fix:10,fixm:{wood:8,stone:13},name:'採石場',kind:'build',mat:{wood:15,stone:25},pc:20,time:140,maker:'earth',lv:6,solid:1,attr:{earth:2},desc:'せいれいがここで働くと、13.3分ごとに石材+1'},
  oven:{hp:5,brk:1,fix:3,fixm:{wood:2,stone:4},name:'かまど',kind:'furn',anim:1,pc:5,time:160,maker:'fire',solid:1,attr:{fire:2,earth:1},mat:{wood:3,stone:8},desc:'せいれいが材料から料理を作る。住み心地+6'},
  grave:{name:'お墓',kind:'deco',attr:{},desc:''},
  gate:{name:'柵のドア',fix:2,fixm:{wood:1,funba:1},kind:'block',anim:1,hp:20,hpS:30.95,cost:2,pc:4,time:40,maker:'wood',qty:1,lv:2,attr:{},mat:{wood:3},desc:'柵の出入り口。せいれいだけ通れる。じょうぶさ20'},
  logdoor:{name:'丸太の塀のドア',fix:3,fixm:{wood:2},kind:'block',anim:1,brk:1,hp:36,hpS:54.2,cost:3,pc:6,time:60,maker:'wood',qty:1,lv:6,attr:{},mat:{wood:6},desc:'丸太の塀の出入り口。じょうぶさ36'},
  loggate:{sz:[2,1],name:'丸太の大門',fix:4,fixm:{wood:3},kind:'block',anim:1,brk:1,hp:36,hpS:54.8,cost:4,pc:12,time:90,maker:'wood',qty:1,lv:9,attr:{},mat:{wood:12},desc:'丸太の塀の大きな出入り口。じょうぶさ36'},
  stonegate:{sz:[2,1],name:'石の大門',fix:5,fixm:{stone:3},kind:'block',anim:1,brk:1,hp:60,hpS:90.75,cost:5,pc:10,time:90,maker:'earth',qty:1,lv:10,w:1,attr:{},mat:{stone:12},desc:'石柱で支える大きな柵の出入り口。じょうぶさ60'},
  yozoradoor:{name:'よぞらのドア',fix:2,fixm:{wood:1},kind:'block',anim:1,hp:20,hpS:23,cost:2,pc:5,time:40,maker:'wood',qty:1,lv:1,attr:{},mat:{wood:3},kwr:1,desc:'窓のついたダークチェリーのドア。じょうぶさ20'},/* コワイノのレシピ */
  door:{name:'ドア',fix:2,fixm:{wood:1},kind:'block',anim:1,hp:20,hpS:30,cost:2,pc:5,time:40,maker:'wood',qty:1,lv:3,attr:{},mat:{wood:2},desc:'壁にはめる出入り口。じょうぶさ20'},
  chair:{name:'いす',kind:'furn',lv:3,pc:3,time:60,maker:'wood',attr:{wood:1},mat:{wood:3},mat1:{bamboo:3},desc:'食卓のとなりで食べると、パワー+0.9。住み心地+4'},
  takebench:{name:'竹のベンチ',sz:[2,1],kind:'furn',lv:3,pc:3,time:100,maker:'wood',attr:{wood:1},mat:{bamboo:6},desc:'2人すわれる。昼につかれたら、ここで休む。つかれ −30／1時間。住み心地+5'},
  andon:{hp:5,brk:1,fix:2,fixm:{wood:1},name:'行燈',kind:'furn',cat:'light',lv:7,w:1,pc:6,time:80,maker:'fire',solid:1,anim:1,attr:{fire:1},mat:{wood:3,kasa:2},mat1:{wood:3,chiri:2},desc:'紙をはった木のあかり。まわり3.5マスを照らす。住み心地+5'},
  takeakari:{hp:5,brk:1,fix:2,fixm:{bamboo:2},name:'竹あかり',kind:'furn',cat:'light',lv:4,pc:4,time:90,maker:'fire',solid:1,anim:1,attr:{fire:1,wood:1},mat:{bamboo:4},desc:'まわり3.5マスを照らす。住み心地+5'},
  shishiodoshi:{hp:5,brk:1,fix:2,fixm:{bamboo:2,stone:1},name:'ししおどし',kind:'furn',cat:'env',lv:5,pc:6,time:110,maker:'water',solid:1,anim:1,attr:{water:1,wood:1},mat:{bamboo:5,stone:3},desc:'水でうごく竹のかざり。住み心地+6'},
  bench:{name:'ベンチ',sz:[2,1],kind:'furn',pc:3,time:100,maker:'wood',attr:{wood:1},mat:{wood:5},desc:'2人すわれる。昼につかれたら、ここで休む。つかれ −30／1時間。住み心地+5'},
  bed:{name:'ベッド',kind:'furn',pc:10,time:200,maker:'wood',sleep:{cap:1,pt:5,rate:.1},attr:{wood:2},mat:{wood:6,kasa:4},mat1:{wood:6,chiri:4},desc:'1人眠れる。つかれ −9／1時間'},
  yorubed:{name:'よぞらのベッド',kind:'furn',pc:10,time:200,maker:'wood',sleep:{cap:1,pt:5,rate:.1},attr:{wood:2},mat:{wood:8},kwr:1,desc:'夜空の色のふとんのベッド。1人眠れる。つかれ −9／1時間'},/* コワイノのレシピ（落とし物でまれに手に入る）。ふつうのベッドと同じはたらき */
  yozorawall:{name:'よぞらの壁',fix:5,fixm:{wood:1},kind:'block',cost:4,pc:11,time:90,maker:'earth',qty:10,lv:1,solid:1,hp:48,hpS:72.2,brk:1,attr:{},mat:{wood:6,stone:3},kwr:1,desc:'夜空の色の家の壁。じょうぶさ48'},
  lamp:{hp:5,brk:1,fix:3,fixm:{eda:2,stone:2},name:'かがり火',kind:'furn',pc:5,time:160,maker:'fire',solid:1,anim:1,attr:{fire:3},mat:{eda:3,stone:3},desc:'まわり3.5マスを照らす。住み心地+6'},
  campfire:{hp:5,brk:1,fix:4,fixm:{wood:2,eda:4,stone:4},name:'たき火',kind:'furn',pc:7,time:160,maker:'fire',lv:6,solid:1,anim:1,attr:{fire:4},play:{pt:3,pw:1.35,fun:25,dur:40,cap:3,adj:1},mat:{wood:3,eda:8,stone:8},desc:'3人まで遊べる。たのしさ +25（26.7分）。まわり3.5マスを照らす'},
  swing:{name:'ブランコ',sz:[2,1],kind:'furn',pc:9,time:160,maker:'wood',lv:4,play:{pt:4,pw:1.8,fun:40,dur:50,cap:1},attr:{wind:3},mat:{wood:12,shina:4},mat1:{bamboo:8,wood:4,kuru:4},desc:'1人で遊べる。たのしさ +40（33.3分）。遊ぶと10%の確率で、移動速度+1'},
  torch:{hp:5,brk:1,fix:1,fixm:{eda:2},name:'たいまつ',kind:'furn',lv:3,pc:1,time:100,maker:'fire',solid:1,anim:1,attr:{fire:2},mat:{eda:3},mat1:{bamboo:3},desc:'まわり3.5マスを照らす。住み心地+4'},
  composter:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'コンポスター',kind:'furn',cat:'other',f2:1,pc:3,time:80,maker:'wood',solid:1,attr:{wood:1},mat:{wood:10},desc:'草を入れると、1日で肥料になる。草1こで肥料1こ'},
  joro:{hp:5,brk:1,fix:2,fixm:{can:1},name:'ブリキのじょうろ',kind:'furn',cat:'other',f2:1,pc:3,time:80,maker:'water',solid:1,attr:{water:1},mat:{can:2,eda:1},desc:'空き缶でつくったじょうろ。まわり5マスの畑の水やりの速さ+10%（重複なし）。住み心地+3'},
  jar:{hp:5,brk:1,fix:2,fixm:{stone:3},name:'みずがめ',kind:'furn',lv:3,pc:3,time:120,maker:'water',solid:1,attr:{water:3},mat:{stone:5},desc:'水をためたかめ。雨の日に水がたまり、畑10マスぶんの水をくめる。住み心地+5'},
  basin:{hp:5,brk:1,fix:4,fixm:{stone:3},name:'水鉢',kind:'furn',pc:7,time:160,maker:'water',solid:1,anim:1,attr:{water:4,wood:.5},mat:{stone:5},desc:''},/* もう作れない（古いセーブ用） */
  kamizo:{hp:5,brk:1,fix:5,fixm:{stone:13},name:'カミサマの像',kind:'furn',lv:5,pc:10,time:160,maker:'earth',solid:1,attr:{earth:2},mat:{stone:25},desc:'カミサマが遊びにくる確率50%'},
  chochin:{w:1,name:'おまつりのちょうちん',kind:'furn',shopOnly:1,pc:6,solid:1,attr:{},desc:'おまつりのおみやげ。赤いちょうちん。住み心地+6'},
  furin:{w:1,name:'ふうりん',kind:'furn',shopOnly:1,pc:8,solid:1,anim:1,attr:{},desc:'カミサマのかざり。風がふくと、ちりんと鳴る。住み心地+8'},
  ema:{w:1,name:'えまかけ',kind:'furn',shopOnly:1,pc:8,solid:1,attr:{},desc:'カミサマのかざり。ねがいごとを書いた板をかける。住み心地+8'},
  komainu:{w:1,name:'こまいぬ',kind:'furn',shopOnly:1,pc:10,solid:1,attr:{},desc:'カミサマのかざり。神殿をまもる石の犬。住み心地+10'},
  kadomatsu:{w:1,name:'かどまつ',kind:'furn',shopOnly:1,pc:10,solid:1,attr:{},desc:'カミサマのかざり。竹と松のおめでたいかざり。住み心地+10'},
  rockart:{hp:5,brk:1,fix:1,fixm:{stone:3},name:'つぼ',kind:'furn',lv:2,pc:1,time:100,maker:'earth',solid:1,attr:{earth:2},mat:{stone:5},desc:'土でできたかざり。住み心地+5'},
  vane:{hp:5,brk:1,fix:4,fixm:{wood:2,stone:2},offerOnly:1,name:'風見鶏',kind:'furn',pc:7,time:160,maker:'wind',solid:1,anim:1,attr:{wind:4},mat:{wood:3,stone:3},desc:'風の向きをおしえる。まわり3マスのせいれいは移動速度×1.2（重複なし）。住み心地+4'},
  arrow:{name:'木の矢',kind:'ammo',pc:1,time:40,maker:'wood',qty:10,mat:{eda:1,stone:1},desc:'見張り台が放つ矢。1発で1本使う'},
  arrow2:{name:'かなものの矢',kind:'ammo',pc:6,time:60,maker:'wood',qty:10,mat:{eda:1,stone:1,can:1},desc:'空き缶をたたいて矢じりにした矢。見張り台の威力+1。1発で1本使う'},
  spike:{name:'とげの罠',fix:1,fixm:{wood:1},kind:'furn',lv:1,pc:1,time:100,maker:'wood',qty:5,trap:1,attr:{earth:.5},mat:{wood:2,stone:2},desc:'上にいる「コワイノ」に、10分ごとに0.5ダメージ',anim:1},
  sticky:{name:'どくの罠',fix:1,fixm:{funba:1},kind:'furn',lv:2,pc:1,time:80,maker:'wood',qty:2,trap:1,attr:{wood:.5},mat:{funba:2},food:{kinoko:1},desc:'ふんだ「コワイノ」に、1時間、10分ごとに0.5ダメージ',anim:1},
  puddle:{name:'すべる水たまり',fix:1,fixm:{stone:1},kind:'furn',lv:4,pc:1,time:80,maker:'water',qty:2,trap:1,anim:1,attr:{water:.5},mat:{stone:2},desc:'ふんだ「コワイノ」が10分止まる',anim:1},
  firetrap:{name:'ほのおの罠',fix:2,fixm:{wood:1},kind:'furn',pc:3,time:120,maker:'fire',lv:4,qty:2,trap:1,anim:1,attr:{fire:.5},mat:{wood:1,can:2},desc:'ふんだ「コワイノ」と、まわり1マスの「コワイノ」に4ダメージ。つぎに使えるまで3時間',anim:1},
  gust:{name:'つむじ風の罠',fix:2,fixm:{eda:1},kind:'furn',pc:3,time:120,maker:'wind',lv:5,qty:2,trap:1,anim:1,attr:{wind:.5},mat:{eda:2},desc:'ふんだ「コワイノ」を6マスふきとばし、1.3分止める。つぎに使えるまで2時間30分',anim:1},
  dig:{name:'けずる',kind:'build',pc:50,time:40,maker:'earth',attr:{},desc:'高いマスを1だん低くする工事。パワー50'},
  mound:{name:'もる',kind:'build',pc:50,time:40,maker:'earth',attr:{},desc:'低いマスを1だん高くする工事。パワー50'},
  watch:{name:'見張り台',fix:10,fixm:{wood:10,stone:10},kind:'build',sz:[2,2],mat:{wood:25,stone:20},pc:20,time:150,maker:'earth',lv:2,solid:1,attr:{fire:2,earth:2},desc:'夜、せいれいが上に立って、「コワイノ」に木の矢を放つ。ダメージ1／6.7分ごと／範囲6マス'},
  smelter:{name:'炉',fix:10,fixm:{stone:10},kind:'build',sz:[2,2],mat:{wood:10,stone:30},pc:20,time:150,maker:'fire',w:1,solid:1,attr:{fire:2},desc:'鉱石2こで、延べ棒1こを作る'},
  yogan:{name:'ようがん台',fix:10,fixm:{stone:15},kind:'build',sz:[2,2],mat:{wood:5,stone:40},pc:20,time:150,maker:'fire',lv:1,solid:1,attr:{fire:3},desc:'火山のふもとの守り。「コワイノ」に火の玉を飛ばす。ダメージ1（まわり0.5）／5.3分ごと／範囲5マス'},
  well:{hp:5,brk:1,fix:10,fixm:{wood:4,stone:15},name:'井戸',kind:'build',mat:{wood:8,stone:30},pc:20,time:140,maker:'water',lv:6,solid:1,attr:{water:4},desc:'いくらでも水をくめる井戸。'},
  windmill:{hp:5,brk:1,fix:13,fixm:{wood:30,stone:18},name:'風車',kind:'build',mat:{wood:60,stone:35},pc:25,time:160,maker:'wind',lv:8,solid:1,anim:1,attr:{wind:5},desc:'まわり5マスの畑の収穫+1（重複なし）'},
  bell:{name:'村の鐘',sz:[2,2],kind:'build',mat:{wood:60,stone:60},pc:120,time:240,maker:'earth',lv:12,solid:1,attr:{},desc:'朝、村のせいれいのたのしさ+15（重複なし）'},
  onsen:{name:'露天ぶろ',sz:[2,2],kind:'build',mat:{stone:40},pc:60,time:200,maker:'earth',lv:9,w:1,solid:1,attr:{},desc:'岩でかこんだ温泉。入ると、つかれ−30・たのしさ+10'},
  signw:{name:'村の木の看板',sz:[2,1],kind:'build',mat:{wood:30},pc:80,time:160,maker:'wood',lv:11,solid:1,attr:{},desc:'村の入り口の看板。属性の力+10%（重複なし）'},
  signs:{name:'村の石の看板',sz:[2,1],kind:'build',mat:{stone:30},pc:80,time:160,maker:'earth',lv:11,w:1,solid:1,attr:{},desc:'村の入り口の看板。属性の力+10%（重複なし）'},
  lighthouse:{name:'灯台',sz:[2,2],kind:'build',mat:{wood:25,stone:35},pc:35,time:180,maker:'fire',lv:7,solid:1,anim:1,attr:{fire:4},desc:'まわり8マスを照らす'},
  lurestatue:{hp:60,brk:1,fix:6,fixm:{stone:8},name:'おびきよせの石像',kind:'build',mat:{wood:10,stone:40},pc:12,time:100,maker:'earth',lv:6,w:2,solid:1,attr:{},desc:'石の像。まわり7マスの「コワイノ」は、先にこの像をこわしにくる。じょうぶさ60'},
  stele:{hp:5,brk:1,fix:18,fixm:{wood:6,stone:25},name:'ノームの石像',kind:'build',mat:{wood:12,stone:50},pc:35,time:180,maker:'earth',lv:6,solid:1,attr:{earth:4},desc:'まわり7マスの壁・柵・塀が、1.5倍じょうぶになる（重複なし）'},
  fountain:{name:'噴水',sz:[2,2],kind:'build',mat:{wood:15,stone:60},pc:45,time:200,maker:'water',lv:6,solid:1,anim:1,play:{pt:6,pw:2.7,fun:45,dur:50,cap:3,adj:1},attr:{water:6},desc:'3人まで遊べる。たのしさ +45（33.3分）。遊ぶと10%の確率で、スタミナ+1'},
  statue:{name:'神殿',kind:'build',anim:1,pc:0,time:50,maker:null,solid:1,attr:{wood:1,water:1,fire:1,earth:1,wind:1},desc:'守り神の居場所'},
  statueb:{name:'こわれた神殿',solid:1,desc:'守り神の居場所だった神殿'},/* はじめからある。「みる」でタップすると、せいれいが直す（templeRuinTap） */
  obox:{name:'おそなえ箱',solid:1,anim:1},
  board:{name:'依頼ボード',solid:1,sz:[2,1],anim:1,pc:0,time:120,maker:'earth',mat:{wood:15,stone:10},desc:'依頼を5まい貼れるように広げる。'},
  altar:{name:'カミサマの台座',solid:1,anim:1},
  site2:{name:'建てている場所',solid:1,job:1},
  part:{name:''},
  tower:{hp:100,hpS:150,brk:1,fix:20,fixm:{wood:20,stone:10},name:'守護の台座',sz:[2,2],kind:'build',pc:95,time:300,maker:null,solid:1,anim:1,attr:{wood:3,water:3,fire:3,earth:3,wind:3},desc:'守護の力をとりもどす台座。ヌシ様が帰ってくる。光の矢：ダメージ1／6.7分ごと／範囲10マス。まわり7マスを照らす'},
  rock:{name:'岩',solid:1,natural:1},vcopper:{name:'銅の鉱脈',solid:1,natural:1},viron:{name:'鉄の鉱脈',solid:1,natural:1},vobsid:{name:'黒曜石の鉱脈',solid:1,natural:1},vsilver:{name:'銀の鉱脈',solid:1,natural:1},vgold:{name:'金の鉱脈',solid:1,natural:1},/* 火山の鉱脈：ほると鉱石 */
  hotstone:{hp:5,brk:1,fix:1,fixm:{},name:'湯のわき岩',kind:'furn',pc:0,time:20,solid:1,anim:1,attr:{fire:3,water:1},desc:'水べに置くと、水があたたまって温泉になる'},
  volcano:{name:'火山',sz:[3,3],solid:1,anim:1},boulder:{name:'大岩',solid:1,natural:1},heatv:{name:'熱の切りかえ装置',solid:1,anim:1},crack:{name:'ひびわれ',anim:1},/* 火山のふもと */
  fogbox:{name:'古い宝箱',solid:1,natural:1,anim:1},nushiprint:{name:'ヌシ様のあしあと',natural:1,anim:1},fogspring:{name:'きれいな泉',sz:[2,2],solid:1,natural:1,anim:1,env:1.4,desc:'まわり3マスで、たのしさ+0.5／1時間'},/* 霧の中で見つける物（草原） */
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

  'seed:mugi':{name:'こむぎのたね',kind:'seed',desc:'2日で育つ。食料+1。パンの材料'},'seed:tomato':{name:'キャベツのたね',kind:'seed',desc:'2日で育つ。食料+1'},'seed:imo':{name:'いものたね',kind:'seed',desc:'3日で育つ。食料+2'}
};
const BLOCKS=['path','gravel','woodpath','stone','brick','floor','brickfloor','stonefloor','herrfloor','carpet','farm','fence','misugaki','logfence','bamboofence','bedge','gate','stonegate','logdoor','loggate','hwall','bamboowall','logwall','plasterwall','brickwall','yozorawall','door','yozoradoor','wall','sdoor','window'];const GATE_IDS=new Set(['gate','stonegate','logdoor','loggate']),FENCE_IDS=new Set(['fence','misugaki','logfence','bamboofence','gate','stonegate','logdoor','loggate']),HOME_WALLS=new Set(['hwall','bamboowall','logwall','plasterwall','brickwall','yozorawall','wall']),HOME_DOORS=new Set(['door','yozoradoor','sdoor']);
const TOWER_STONE={...BL.tower};
const TOWER_TREE={...BL.tower,sz:[4,4],name:'御神木',pc:0,mat:{},maker:'wood',desc:'みんなで育てた木。土地に散らばったヌシ様の力を結ぶ。まわり7マスを照らす'};
const PLANTS=['clover','bellf','salvia','lily','lotus','tree','fruit'],FLOWERS=new Set(['clover','bellf','salvia','lily','lotus']),ATTRFL=new Set(['clover','bellf','salvia','lily','lotus']),plantOK=id=>!ATTRFL.has(id)||!!S.unlocked[id]/* 属性の花はクエストで解放 */,isBud=j=>!!(S&&S.bud&&S.bud[j]>dayNo())/* 植えた日の次の朝まで、花と木は芽 */,flowerN=()=>S.obj.reduce((a,o,j)=>a+(FLOWERS.has(o)&&!isBud(j)?1:0),0),BREQ={windmill:'wind',fountain:'water',well:'water',lighthouse:'fire',stele:'earth'}/* 属性の子がいないと建てられない */;
const bloomCount=id=>S.obj.reduce((n,o,j)=>n+(o===id&&!isBud(j)?1:0),0);
const FLOWER_QUESTS=new Set(['salvia3','lotus3','lily5','clover3']);
const BEDSET=new Set(['bed','yorubed']);/* ねむれるベッド（よぞらのベッドも同じはたらき） */const KWR=['yozorawall','yozoradoor','yorubed','hoshirug','herrfloor'];const KWRKEY='hakoniwa-kwr-v1';/* コワイノのレシピは、どのステージでもおぼえたまま（ステージべつのセーブとはべつにしまう） */
function kwrSync(){if(!S)return;let g=[];try{g=JSON.parse(KV.getItem(KWRKEY)||'[]')}catch(e){}const G=new Set(g.filter(id=>KWR.includes(id)));for(const id of KWR)if((S.recipes||{})[id])G.add(id);for(const id of G){(S.recipes||(S.recipes={}))[id]=true;if(BL[id].kind==='block')(S.unlocked||(S.unlocked={}))[id]=true}try{KV.setItem(KWRKEY,JSON.stringify([...G]))}catch(e){}}/* コワイノのレシピ：落とし物でまれに手に入る */
const STAGEONLY={hwall:0,bamboowall:1,fence:0,misugaki:1,signw:0,signs:1,logfence:0,logdoor:0,loggate:0,bamboofence:1,takebench:1,takeakari:1,shishiodoshi:1};/* そのステージで作れる物（草原0・火山1）。おぼえたら、どのステージでも作れる */
const GRECKEY='hakoniwa-rec-v1',GRECKEY2='hakoniwa-rec-v2',GRECFIX='hakoniwa-rec-fix1',GNOREC=new Set(['statue','tower','yogan','watch','dig','mound']);let GREC=null;/* おぼえたレシピは、どのステージでもおぼえたまま（ステージべつのセーブとはべつにしまう）。神殿・台座・ようがん台・見張り台は、ステージのお話で決まるので入れない */
const NOMAT={0:['bamboo','kuru','chiri'],1:['shina','kasa']},matHere=(b,w)=>!Object.keys((w===1?b.mat1:b.mat0)||b.mat||{}).some(k=>(NOMAT[w]||[]).includes(k));/* そのステージで手に入らない素材を使う物は、村レベルでおぼえない（草原：竹・くるくる草・ちりちり草）。b.mat は、いまのステージの素材になるので、w のステージの素材（mat1・mat0）で見る */
function learnedIn(s,w){const out=[];for(const id in BL){const b=BL[id];if(GNOREC.has(id)||STAGEONLY[id]==null&&b.offerOnly&&b.kind==='furn')continue;/* おそなえだけの家具は、レシピにしない */
  if((s.recipes||{})[id]||(s.unlocked||{})[id])out.push(id);
  else if((b.kind==='block'||b.kind==='build'||b.kind==='plant')&&b.lv&&!QB.has(id)&&(s.lv||1)>=b.lv&&(b.w||0)<=w&&matHere(b,w)&&(STAGEONLY[id]==null?!b.offerOnly:STAGEONLY[id]===w))out.push(id)}/* 村レベルで使えるようになった物 */
  return out}
function ownLearned(d,w){/* そのステージが、自分のクエスト・村レベル・持ち物でおぼえる物（ほかのステージからもらった物はふくめない） */const s2={world:w,free:false,flags:d.flags,quest:d.quest||0,qTalked:d.qTalked,qStory:d.qStory,subDone:d.subDone,subSt:d.subSt,subSeen:d.subSeen,lv:d.lv,inv:d.inv,obj:d.obj,orders:d.orders||[],win:d.win,recipes:{},guardianIdeas:{},unlocked:{}};try{syncQuestRecipes(s2)}catch(e){}return new Set(learnedIn(s2,w))}
function savedStage(w){let d=LIVE&&LIVE[w]&&!LIVE[w].summary?LIVE[w]:null;if(!d)try{const raw=KV.getItem(SAVE_KEYS[w]);if(raw)d=JSON.parse(raw)}catch(e){}return d&&!d.free?d:null}
function grecOf(){if(!GREC){/* id → おぼえたステージ（どのステージでおぼえたか。「はじめから」で、そのステージの分だけわすれるため） */let g=null;try{g=JSON.parse(KV.getItem(GRECKEY2)||'null')}catch(e){}GREC=new Map(g&&typeof g==='object'&&!Array.isArray(g)?Object.entries(g):[]);if(GREC.delete('stairs2f'))grecSave();/* 2階への階段はなくした */
    if(!g){let a=null;try{a=JSON.parse(KV.getItem(GRECKEY)||'null')}catch(e){}const ids=new Set(Array.isArray(a)?a:[]),own=[0,1].map(w=>{const d=savedStage(w);if(d)learnedIn(d,w).forEach(id=>ids.add(id));return d?ownLearned(d,w):new Set()});
      for(const id of ids){if(!BL[id])continue;GREC.set(id,own[0].has(id)?0:own[1].has(id)?1:STAGEONLY[id]!=null?STAGEONLY[id]:(BL[id].w||0))}/* 前の形のしまい方からうつす：自分のクエスト・村レベルでおぼえるステージ、わからなければその物のステージ */
      grecSave()}
    if(!KV.getItem(GRECFIX)){/* 前は、火山で草原の素材を火山の素材と見まちがえて、草原でおぼえた物（たいまつなど）を消していた。草原のセーブから、もどす */const d=savedStage(0);if(d)for(const id of learnedIn(d,0)){const b=BL[id];if(b&&GREC.get(id)!==0&&(!b.lv||STAGEONLY[id]!=null||matHere(b,0)))GREC.set(id,0)}grecSave();try{KV.setItem(GRECFIX,'1')}catch(e){}}}return GREC}
function grecSave(){try{KV.setItem(GRECKEY2,JSON.stringify(Object.fromEntries(GREC)))}catch(e){}}
function grecForget(w){/* 「はじめから」：そのステージでおぼえたレシピをわすれる（ほかのステージのセーブからも消す。ほかのステージが自分でおぼえる物はのこす） */const G=grecOf(),gone=[...G].filter(([,o])=>o===w).map(([id])=>id);if(!gone.length)return;for(const id of gone)G.delete(id);
  const cut=(d,own)=>{for(const id of gone){if(own.has(id))continue;if(d.recipes)delete d.recipes[id];if(d.guardianIdeas)delete d.guardianIdeas[id];if(d.unlocked)delete d.unlocked[id]}};
  for(const w2 of[0,1]){if(w2===w)continue;const L=LIVE&&LIVE[w2]&&!LIVE[w2].summary&&!LIVE[w2].free?LIVE[w2]:null;let k=null;try{const raw=KV.getItem(SAVE_KEYS[w2]);if(raw)k=JSON.parse(raw)}catch(e){}if(k&&k.free)k=null;const base=L||k;if(!base)continue;
    const own=ownLearned(base,w2);for(const id of gone)if(own.has(id))G.set(id,w2);if(L)cut(L,own);if(k){cut(k,own);try{KV.setItem(SAVE_KEYS[w2],JSON.stringify(k))}catch(e){}}}/* 動いているデータと、しまってあるセーブの両方から消す */
  grecSave()}
const grec=id=>!!S&&!S.free&&grecOf().get(id)<WD;/* 前のステージでおぼえたか */
function recSync(){if(!S||S.free)return;const G=grecOf();let add=false;for(const[id,o2]of[...G]){const b=BL[id];if(b&&b.lv&&STAGEONLY[id]==null&&!matHere(b,o2)){G.delete(id);add=true;if(o2===WD){if(S.recipes)delete S.recipes[id];if(S.unlocked)delete S.unlocked[id];if(S.guardianIdeas)delete S.guardianIdeas[id]}}}/* 前に、手に入らない素材の物をおぼえていたら、わすれる（草原の竹のハシゴ） */for(const id of learnedIn(S,WD))if(!G.has(id)){G.set(id,WD);add=true}for(const[id,o]of G){const b=BL[id];if(!b||!(o<WD))continue;/* 使えるのは、前のステージでおぼえた物だけ（いまのステージ・この先のステージでおぼえた物は使えない） */if(b.kind==='block'||b.kind==='plant')(S.unlocked||(S.unlocked={}))[id]=true;else{(S.recipes||(S.recipes={}))[id]=true;(S.guardianIdeas||(S.guardianIdeas={}))[id]=true}}if(add||!KV.getItem(GRECKEY2))grecSave()}/* このステージでおぼえた物を足して（おぼえたステージもしまう）、ほかのステージでおぼえた物をもらう */
const CRAFTB=['floor','brickfloor','stonefloor','herrfloor','carpet','path','gravel','woodpath','stone','brick','hwall','bamboowall','logwall','plasterwall','brickwall','yozorawall','door','yozoradoor','fence','misugaki','bedge','logfence','bamboofence','gate','stonegate','logdoor','loggate','wall','sdoor','window','yozorawin'];
const CRAFT_TABS=[["家具", ["table", "chair", "stool", "stable", "pouf", "achair", "ltable", "rug1", "rug2", "hoshirug", "bed", "yorubed", "sofa1", "monstera", "wreath", "curtain1", "curtain2", "paint1", "paint2", "paint3", "bathtub"]], ["収納", ["stor", "mbox", "crate", "taru", "asabukuro", "makidana", "niguruma", "kabebukuro", "kabedougu", "shelf1", "wshelf", "cabinet", "shelf2"]], ["遊び", ["swing", "slide", "sandbox", "seesaw", "campfire"]], ["庭", ["bench", "takebench", "shishiodoshi", "hedge", "birdbath", "parasol", "noren", "arch", "kamizo", "jar", "joro", "composter", "rockart", "signpost", "vane"]], ["あかり", ["torch", "takeakari", "andon", "candle", "lantern", "flamp", "toro", "lamp"]], ["ごはん", ["oven", "cooktable", "tub", "sink"]], ["ワナ", ["arrow", "arrow2", "gar01", "gar02", "gar03", "gar04", "gar05", "gar06", "gar07", "gar08", "gar09", "gar10", "gar11", "gar12", "gar13", "gar14", "gar15", "gar16", "gar17", "gar18", "gar19", "gar20", "gar21", "gar22", "gar23", "gar24", "gar25", "gar26", "spike", "puddle", "sticky", "firetrap", "gust"]], ["そうび", ["gw01", "gw02", "gw03", "gw04", "gw05", "gw06", "gw07", "gw08", "gw09", "gw10", "gw11", "gw12", "gw13", "gw14", "gw15", "gw16", "gw17", "gw18", "gw19", "gw20", "gw21", "gw22", "gw23", "gw24", "gw25", "gw26", "gw27", "gw28", "gw29", "gw30", "gw31", "gw32", "gw33", "gw34", "gw35", "gw36", "ga01", "ga02", "ga03", "ga04", "ga05", "ga06", "ga07", "ga08", "ga09", "ga10", "ga11", "ga12", "ga13", "ga14", "ga15", "ga16", "ga17", "ga18", "ga19", "ga20", "ga21", "ga22", "ga23", "ga24", "ga25", "ga26", "gc01", "gc02", "gc03", "gc04", "gc05", "gc06", "gc07", "gc08", "gc09", "gc10", "gc11", "gc12", "gc13", "gc14", "gt01", "gt02", "gt03", "gt04", "gt05", "gt06", "gt07", "gt08", "gt09", "gt10", "gt11", "gt12", "gt13", "gt14", "gt15"]], ["家づくり", ["floor", "brickfloor", "stonefloor", "herrfloor", "carpet", "hwall", "bamboowall", "logwall", "plasterwall", "brickwall", "yozorawall", "door", "yozoradoor", "window"]], ["道・囲い", ["path", "gravel", "woodpath", "stone", "brick", "fence", "misugaki", "logfence", "bamboofence", "bedge", "gate", "stonegate", "logdoor", "loggate", "wall", "sdoor"]], ["クエスト", ["board"]]];let craftTags=[],craftQ='',craftCan=false;/* 依頼ボードでえらんでいるタグ（ぜんぶ合う物を出す）・さがす名前・いま作れる物だけ *//* 依頼ボードでえらんでいるタグ・さがす名前・しぼりこみを開いているか */
const craftInTag=id=>{if(!craftTags.length)return true;const t=tagsOf(id);return craftTags.every(g=>t.includes(g))};
const GIFTF=['furin','ema','kadomatsu','komainu','chochin','mimamori','yomawari','oyasumi','yonaka'];/* 交換・おみやげ・コワイノの落とし物でもらう家具 */
function furnitureGroups(ids){const wanted=new Set(ids);return CRAFT_TABS.map(([name,items])=>[name,items.filter(id=>wanted.has(id))]).filter(([,items])=>items.length)}
const FURN=['composter','cooktable','joro','kabedougu','kabebukuro','niguruma','taru','asabukuro','makidana','hoshirug','yorubed','toro','table','chair','stor','mbox','oven','bed','bench','takebench','takeakari','andon','shishiodoshi','campfire','swing','torch','jar','rockart','vane','spike','puddle','sticky','stool','stable','pouf','achair','ltable','rug1','sofa1','rug2','tub','sink','crate','monstera','shelf1','wreath','curtain1','cabinet','paint2','shelf2','curtain2','paint3','wshelf','paint1','bathtub','candle','lantern','flamp','signpost','hedge','birdbath','parasol','arch','slide','sandbox','seesaw','kamizo','noren','gazebo','azumaya'];// 属性の罠（sticky/firetrap/gust）は次のステージから

const TERRA=new Set(['dig','mound']);/* だんさスコップの工事 */
const BUILDS=['statue','watch','bridge','ladder_wood','ladder_bamboo','slope_earth','stairs_wood','stairs_stone','stairs_brick','yogan','smelter','lumber','well','quarry','windmill','fountain','lighthouse','bell','onsen','signw','signs','stele','lurestatue','tower'];
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
  [GOD,'おヌシは、生まれたばかりの小さな守り神なんじゃ。ほっほ、まだ目がしょぼしょぼしとるのう。'],
  [GOD,'さっそくで、すまんがのう。おヌシに、行ってほしい土地があるんじゃ。'],
  [GOD,'行く前に、その土地のことを、ちょっとだけ話しておこうかの。'],
  [GOD,'#danger|そこはむかし、せいれいたちがにぎやかに暮らす、ゆたかな草原じゃった。ヌシ様も見守っておってな。わしも、よう遊びに行ったもんじゃ。'],
  [GOD,'#alarm|じゃが、ある晩、「コワイノ」の大群がおしよせてのう。自然の力のバランスがくずれてしもうて、土地はボロボロ。せいれいは散り散り、ヌシ様も、すがたが見えなくなってしもうた。'],
  [GOD,'#worry|……わしが気づいたときには、もうおそかったんじゃ。あの子らには、さみしい思いをさせてしもうた。'],
  [GOD,'そこで、おヌシにおねがいじゃ。'],
  [GOD,'「せいれいたちの力を集めて、この土地に守護の力を取り戻しておくれ」'],
  [GOD,'#joy|おヌシなら、きっとできる。わしには、ちゃんとわかっとるぞい。'],
  [GOD,'#wave|では、さっそく行こうかの！'],
];
const INTRO=[
  [GOD,'ほい到着〜。ここがその草原じゃ。'],
  [GOD,'#worry|……ずいぶん、あれてしもうたのう。むかしは、一面の花畑じゃったのに。'],
  [POKO,'#think|……また、あのゆめ……。みんなと、花畑で……。'],
  [POKO,'#surprise|……あれ？ カミサマ！？',0,'wake'],
  [POKO,'そっちの、ふわふわ光ってるのは……だれ？'],
  [GOD,'この土地を守りに来てくれた「守り神」じゃよ。'],
  [POKO,'まもりがみ……さま？ ぼく、フタバ！ 木のせいれいだよ。ここでずっと暮らしてたんだ！'],
  [POKO,'#surprise|えへへ、急にお客さんが来るなんて、びっくりしちゃった。'],
  [POKO,'#joy|守り神さまと会えてうれしいな！'],
  [GOD,'#joy|ほっほ、ひとりで、よう待っとったのう。えらいぞ、フタバ。'],
  [GOD,'この土地に守護の力を取り戻すには、おヌシの力を集める場所がいる。'],
  [GOD,'#think|……おや。あそこに、古い神殿がのこっとるのう。'],
  [POKO,'#think|うん……。ぼくが気づいたときには、もう、くずれてたんだ。'],
  [GOD,'#joy|あれを直せば、わしの居場所にもなる。せいれいたちに、直してもらおうのう。'],
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
function KS(L){const o=[];let gv=false;for(let[w,t,...rest]of L){if(w[0]==='@'){o.push([w,t,...rest]);continue}let n=w;if(w.length===1){try{n=sevName(w)}catch(e){n=null}}if(n){if(t&&typeof t==='object'){const q=S&&S.res.find(x=>x.name===n);t=q&&elemKey(q)==='fireB'?t.B:t.A}if(n===GOD&&!gv&&typeof t==='string'){gv=true;if(!t.includes('聞こえるかの？')){const m=/^(#[^|]*\|)?([\s\S]*)$/.exec(t);t=(m[1]||'')+GVOICE()+m[2]}}/* カミサマが遠くにいるときは、はじめの行だけ「聞こえるかの？」 */o.push([n,t,...rest])}}return o}/* キーキャラの名前を入れたセリフ */
function pathMade(){const n=S.floor.filter(f=>f==='path').length;if(S.flags.path0==null)S.flags.path0=n;return Math.max(0,n-S.flags.path0)}/* クエストを受けてから、しいたあぜ道の数 */
/* 御神木の調べ。parts：その話でつづけて調べる段階（FIELD_STORIES のキー）。1つの依頼の中で、じゅんに最後まで調べる */
function companionFieldQuest(id,text,how,elem,intro,outro,parts=[id]){return {id,text,how,field:true,fieldParts:parts,check:()=>parts.every(fieldStoryDone),prog:()=>fieldQuestProgress(parts),talk:{get who(){return elem==='earth'?MINA:keyName(elem)},when:()=>true,get learn(){return typeof FIELD_PREP!=='undefined'?parts.flatMap(p=>FIELD_PREP[p]?.learn||[]):[]},get lines(){return KS(intro)}},get story(){return KS(outro)},...(parts.includes('windEcho')?{gives:{flag:'nushiAlive'}}:{})}}
/* まとめた目標：steps（小さな目標）がぜんぶできたらクリア。どれからしてもよい。parts：クエストの番号を、もとの小さな目標の名前でもさがせるように（qAt・qDone・qNow） */
function stepQuest(o){const st=o.steps;o.parts=[...(o.alias||[]),...st.map(s=>s.id)];o.check=()=>st.every(s=>s.check());
  o.prog=()=>{const n=st.filter(s=>s.check()).length,s=st.find(s=>!s.check()),p=s&&s.prog?s.prog():'';return 'できた '+n+'/'+st.length+(p?'　'+p:'')};
  Object.defineProperty(o,'how',{get(){const s=S&&S.qTalked&&st.find(s=>!s.check())||st[0];return s.how||''}});return o}
const questStep=q=>q&&q.steps?(q.steps.find(s=>!s.check())||q.steps[q.steps.length-1]).id:q&&q.id;/* いまの小さな目標（案内の指など） */
/* えらぶ場面：水のせいれいを村へあんないする子（えらんだ子と、なかよしになる） */
function choiceGuide(){const W=keyName('water'),opt=(t,v,L)=>({t,v,lines:KS([...L,['M','#joy|よろしくおねがいします。']])});return {key:'guide',who:POKO,q:'ねえ、'+W+'に村をあんないするの、だれがいいかな？',
  pick:v=>{const w=S.res.find(r=>r.name===W),g=S.res.find(r=>r.name===v);if(!w||!g)return;bondSet(g,w,BOND_TALK);tourStart(g,w)},
  opts:[opt(POKO,POKO,[[POKO,'#joy|まかせて！ 池の音がよく聞こえる所、おしえてあげる！']]),opt(MINA,MINA,[[MINA,'ぼくでいいのぉ？ ゆっくり歩こうねぇ。']]),opt(keyName('fire'),keyName('fire'),[['H','しょうがねえな。ついてきな。']])]}}
const QUESTS1=[
  {id:'statue',text:'神殿を直してもらおう',how:'「みる」で、こわれた神殿をタップ',check:()=>cnt('statue')>=1,by:GOD,story:[
    [POKO,'なおったー！ ぴかぴかの神殿！'],
    [GOD,'#joy|りっぱに直ったのう。ここが、おヌシとわしの、いばしょじゃ。'],
    [POKO,'ぼく、ときどきおそなえ箱におそなえものを入れるね。守り神さま、自由に使ってね！'],
    [GOD,'#joy|ありがとうのう。それから、せいれいのようすも、ときどき見てやっておくれ。'],[GOD,'#worry|おなかがすききってしまうと、消えてしまうこともある。……そうならんよう、見守ってやっておくれ。']],gives:{feat:['inv'],flag:'tapAsk'}},
  {id:'stor',text:'食料箱を置こう',how:'「おく」→「食料箱」をえらんで置く',check:()=>cnt('stor')>=1,
   talk:{who:POKO,when:()=>!S.flags.tapAsk||!!S.flags.tapped,wait:'せいれいをタップして、ようすを見てみよう',/* ステータスを見てから、次のお話 */lines:[
    [POKO,'守り神さま、見て見て！ ベリーいっぱい集めたよ！ すごいでしょ！'],
    [POKO,'#surprise|……あれ？ あっ！ 虫さん！ たべちゃったの！？'],
    [POKO,'#think|こんどは、どこかにしまっておかなきゃ……。'],
    ['@idea'],[GOD,'#think|ほっほ、おヌシ。食べ物をしまう箱を思いついたんじゃな。'],
    [GOD,'その形どおりの「食料箱」を、おそなえ箱に入れておいたぞい。これで、フタバのベリーも虫さんにとられんのう。']],gives:{items:{stor:1}}},
   story:[
    [POKO,'#joy|ありがとう、守り神さま！ つんでおいたベリー、入れておくね！'],
    [POKO,'おなかがすいたら、ここから出して食べるね。'],
    [GOD,'#nod|うむ、いい場所に置けたのう。']],pre:{food:{berry:10}},gives:{feat:['remove','plant']}},
  {id:'mbox',text:'素材箱を置こう',how:'「おく」→「素材箱」をえらんで置く',check:()=>cnt('mbox')>=1,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、見て見て！ この木の枝、くるんってなってるの。'],
    [GOD,'ほほう。いい形じゃのう。'],
    [POKO,'#joy|えへへ。こういうの見つけると、つい拾っちゃうんだ。石も、まるいのとか、すべすべのとか。'],
    [POKO,'#think|…でも、しまうとこがなくて。そこらに置いとくと、どれがどれだか、わかんなくなっちゃう。'],
    ['@idea'],[GOD,'#nod|なるほどのう……木や石をまとめてしまえる箱があれば、散らからずにすむのう。「素材箱」と呼ぶのがよさそうじゃ。'],
    [GOD,'ほれ、その形の箱を、おそなえ箱にそっと入れておいたぞい。これで、フタバの拾いものも、迷子にならんのう。']],gives:{items:{mbox:1}}},
   story:[
    [POKO,'#surprise|わあ、ぴったり！ 集めてた木と石、ぜんぶ入れとくね。'],
    [POKO,'#nod|…あ、くるんってした枝は、ぼくのたからものだから、入れないけどね。'],
    [GOD,'#joy|ほっほ、たからものは、だいじにせんとのう。'],[GOD,'せいれいたちは、困っていることや、やってみたいことを話してくれる。どんな形でかなえるかは、おヌシのひらめき次第じゃ。']],
   get gives(){return S&&S.flags.qmMbox?{}:{mat:{wood:10,stone:10},msg:'フタバが集めていた木材10・石材10を素材箱に入れた'}}},/* qmMbox：古いセーブで、もうもらっている */
  {id:'table',text:'食卓をたのもう',how:'神殿の依頼ボードをタップ →「家具」→「食卓」をはる。できたら「おく」で置く',check:()=>cnt('table')>=1,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、ベリーを置くと、土がついちゃうんだ。食べるたびに、ふうってするの、たいへんで……。'],
    [POKO,'#think|大きな葉っぱにのせたら、土はつかないかな。でも、風で飛んじゃいそう……。'],
    ['@idea'],[GOD,'#think|……ふむ。食べ物をのせる台か。「食卓」と呼ぼうかの。'],
    [GOD,'食卓は、せいれいたちの手で形にしてもらうんじゃ。作るのに使う木材は、わしが渡しておくぞい。'],
    [POKO,'#joy|その上なら、土がつかないの？ わあ、やってみたい！']],gives:{feat:['craft'],mat:{wood:8}}},
   story:[
    [POKO,'#joy|これが、食卓なんだ！ ベリーに土がつかないね。えへへ、おいしい！'],
    [GOD,'#think|うむ。おヌシの思いつきが、ちゃんと形になったのう。']]},
  {id:'wall',text:'家の壁を直そう',how:'「おく」→「オークの壁」をえらんで、家の壁のすきまをふさぐ',check:()=>HOUSES.length>=1,
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'しまう場所もできたのう。…そろそろ、夜のことも話しておかんとな。'],
    [GOD,'#alarm|この土地には、夜になると「コワイノ」が来るんじゃ。家の中にいればおそわれん。じゃが、壁にすきまがあると、こわして入ろうとするんじゃ。'],
    [POKO,'#scared|「コワイノ」……。夜は、あの穴のあいた家にかくれてたんだ。'],
    [GOD,'#worry|あの家、壁がこわれたままなんじゃ。あれでは、夜が心配じゃのう。'],
    [GOD,'じょうぶなオークの壁を、おそなえ箱に用意しておいたぞい。すきまをふさいで、フタバが安心して眠れる家にしてやっておくれ。']],gives:{feat:['people'],items:{hwall:3}}},
   story:[
    [POKO,'#scared|前に、夜に壁をこわされたことがあったんだ。'],[POKO,'#joy|でも、もうすきまはないね。壁があると、なんだかほっとする！']]},
  {id:'bed',text:'家にベッドを置こう',how:'「おく」→「ベッド」をえらんで、壁で囲まれた家の中に置く。夜は、守りの光のアイコンをタップしてから「コワイノ」をタップすると、光をあてておどかせる',check:()=>houseBedCount()>=1,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#think|草の上はごつごつするし、ゆっくり休めなくて……。休める場所があったらいいな。'],
    ['@idea'],[GOD,'#think|そうか……。安心して休める寝床もいるのう。ふかふかの寝床を「ベッド」と呼ぼうかの。'],
    [GOD,'ほれ、ふかふかの寝床じゃ。おそなえ箱に入れておいたぞい。今夜は、草の上より、ずっとよう眠れるはずじゃ。']],gives:{items:{bed:1}}},
   story:[
    [POKO,'#surprise|わあ、草の上よりふかふか！ これがベッドなんだね。'],
    [GOD,'#alarm|それでのう…今夜も「コワイノ」が来るぞい。'],
    [GOD,'#think|今夜は、まだ小さな影じゃろう。'],
    [GOD,'#alarm|「コワイノ」は、おヌシの光がにがてなんじゃ。いざというときは、フタバを守ってやっておくれ。'],
    [POKO,'#scared|……夜は、やっぱりこわいな。でも、この家と守り神さまの光があるなら、少し安心かも。']],gives:{enemy:true}},
  {id:'path',text:'道をつくろう',how:'「おく」→「あぜ道」をえらんで、5マスしく',check:()=>pathMade()>=5,prog:()=>'あぜ道 '+Math.min(5,pathMade())+'/5',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#think|守り神さま、村の中を行ったり来たりすると、地面がでこぼこで、つまずいちゃうんだ。'],
    [GOD,'ふむ。道があれば、みなも行き来しやすくなるのう。'],
    [GOD,'ほれ、土をふみかためた道じゃ。よく通る所に、しいてやっておくれ。']],gives:{items:{path:5}}},
   story:[
    [POKO,'#surprise|わあ、歩きやすい！ 足が、すいすい進むよ。'],
    [POKO,'#joy|もう、つまずかないね。走っていきたくなっちゃう！']]},
  {id:'lv2',text:'村レベルを2にしよう',check:()=>S.lv>=2,how:'せいれいが満足してパワーがたまると、村レベルが上がる。村レベルが上がると、作れる物がふえる。夜は、守りの光のアイコンをタップしてから「コワイノ」をタップすると、パワー1で光をあてておどかせる',prog:()=>'いま 村レベル'+S.lv,
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'守り神さま、ここで楽しく暮らすと、村も育っていくんだって！'],
    [GOD,'#nod|うむ。みなが笑って暮らす村は、しぜんと育っていくもんじゃ。'],
    [GOD,'#joy|フタバが楽しそうにしとると、わしもうれしいぞい。']]},
   story:[
    [POKO,'#joy|やったー！ 村が、ひとまわり育ったみたい！ 最初の一歩、って感じがするね。'],
    [GOD,'#nod|うむうむ。みなの笑い声が、村を育てたんじゃのう。'],
    [POKO,'#joy|えへへ。村がもっと育ったら、夜も、こわくなくなるかなあ。']]},
  {id:'fence4',text:'柵を4つ置こう',how:"「おく」→「柵」をえらんで4つ置く。「コワイノ」は、まっすぐ歩いて近づいてくる。来る道をふさぐように置くと、遠まわりさせられる",check:()=>['fence','misugaki','logfence','bamboofence'].reduce((n,id)=>n+cnt(id),0)>=4,prog:()=>'柵 '+Math.min(4,['fence','misugaki','logfence','bamboofence'].reduce((n,id)=>n+cnt(id),0))+'/4',
   talk:{who:POKO,when:()=>(S.nights||0)>=1&&S.lastMorning>S.lastNight,wait:'夜をこして、朝をむかえよう',lines:[
    [POKO,'#sigh alarm|……ねえ、「コワイノ」が来たときの音、まだ耳に残ってるの。'],[POKO,'壁をがりがりってひっかく音……。聞こえるたび、胸がどきどきしたよ。'],
    [POKO,'前なら、音がするたび隠れてた。でも今日は、守り神さまがいる。'],
    [POKO,'ぼくもがんばる！ でも、どうしたらいいのかな……。'],[POKO,'#alarm|家の壁で家を守れたみたいに、「コワイノ」の通り道もふさげたらいいのかな……。'],[GOD,'#nod|うむ。ちいさな柵でも、みなの前に立ってくれれば、心強いもんじゃ。'],[POKO,'#joy|そっか……！ ぼくのかわりに、柵が前に立ってくれるんだね。'],
    [GOD,'#nod|柵を、おそなえ箱に用意しておいたぞい。フタバの「守りたい」って気もち、わしにも手伝わせておくれ。']],gives:{items:{fence:10}}},
   story:[
    [GOD,'よしよし、いい感じじゃ。'],
    [POKO,'これで、ちょっと安心だね！']]},
  {id:'watch1',text:'見張り台ととげの罠を置こう',how:"「おく」→「見張り台」を1つと「とげの罠」を2つ置く",check:()=>cnt('watch')>=1&&cnt('spike')>=2,prog:()=>'見張り台 '+Math.min(1,cnt('watch'))+'/1・とげの罠 '+Math.min(2,cnt('spike'))+'/2',
    talk:{who:GOD,when:()=>true,lines:[
    [POKO,'#alarm|守り神さま、柵を置いたけど……「コワイノ」は、柵があってもあきらめないんじゃないかな。'],
    [POKO,'入れなくて困っても、そのまま帰ってくれる気がしないんだ。'],
    [GOD,'#nod|うむ。柵は足止めにはなるが、追いはらえるわけではないんじゃ。時間をかせぐだけじゃからのう。'],
    [POKO,'じゃあ、足止めしてるあいだに、なんとかしないとだめだね。'],
    [GOD,'そこで見張り台じゃ。高いところから早めに見つけて、木の矢で追いはらえる。今回はわしのおごりじゃ。'],
    [GOD,'見張り台は、夜の持ち場じゃ。火のせいれいのほかのせいれいが上にのぼって、木の矢を放ってくれるぞい。'],
    [GOD,'#alarm|とげの罠と木の矢も、そろえておいたぞい。これで、フタバがふるえて夜をすごすことも、へるじゃろう。'],
    [POKO,'柵で足止めして、罠と見張り台で追いはらうんだね！ やってみる！'],['@idea']],gives:{watchNow:true,items:{spike:10,arrow:20},flags:['watchLearned']}},
   story:[
    [GOD,'#nod|うむ。これで夜も、ずいぶん心強くなったのう。'],
    [GOD,'見張り台の木の矢と、とげの罠で、少しずつ弱らせる。みなで守る村じゃな。'],
    [POKO,'これで、少しは安心できるね。'],[POKO,'#danger|守ってくれて、ありがとう、守り神さま！']]},
  {id:'kikyo',text:'ききょうを植えて、土の力をためよう',how:"「おく」→「ききょうの種」を植える。ききょうが咲いて土の力がたまると、なかまを呼べる",check:()=>bloomCount('bellf')>=2,prog:()=>'咲いたききょう '+Math.min(2,bloomCount('bellf'))+'/2',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#cry|ねえカミサマ…ぼく、ひとりだとちょっとさみしいな。'],
    [GOD,'#worry|……そうじゃのう。ずっとひとりで、よう待っとったものな。'],
    [GOD,'#think|つぎに来てもらうなら、土のせいれいがよかろう。土をなでるのが好きな子らでな。フタバの、よい相棒になってくれそうじゃ。'],
    [GOD,'ほれ、ききょうの種じゃ。青い花がきれいに咲いたら、土のせいれいも、きっと気づいてくれるじゃろう。']],gives:{feat:['summon'],items:{bellf:5}}},
   story:[
    [POKO,'ききょう、きれいだね！ 土の力が満ちたみたい！'],
    [GOD,'#nod|うむ、これで土のせいれいが来てくれるぞい。'],[POKO,'なかま、どんな子かなあ。どきどきする！']]},
  {id:'summon',text:'神殿の「！」でなかまを呼ぼう',how:"神殿の上に「！」が出たら、「みる」で神殿をタップ",check:()=>!!S.flags.minaCame&&NEWRES==null&&!NEWQ.length,
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'#nod|力は満ちたのう……。朝になれば、呼ぶしるしが出るはずじゃ。'],
    [POKO,'#joy|ぼく、はじめに、なんて言おうかな。']],gives:{flag:'sumTold'}},
   by:MINA,story:[
    [MINA,'#surprise wave|ふわぁ…。はじめまして、ノドカだよぉ。よろしくねぇ。'],
    [POKO,'#wave|わーい、なかまだ！ よろしくね、ノドカ！'],
    [MINA,'畑を耕すのと、柵を直すのが得意なんだぁ。のんびりやるねぇ。'],[MINA,'#joy|呼んでくれて、ありがとうねぇ、守り神さま。']]},
  {id:'farm6',text:'畑を6つにしよう',how:"「おく」→「畑」をえらび、合計6つにする",check:()=>cnt('farm')>=6,prog:()=>'畑 '+Math.min(6,cnt('farm'))+'/6',
   talk:{who:GOD,when:()=>true,lines:[
    [GOD,'ノドカが来てくれて、にぎやかになったのう。畑を、おそなえ箱に用意しておいたぞい。ノドカの手で、ふかふかの土にしてもらうとよい。']],gives:{items:{farm:2}}},
   story:[
    [POKO,'ふかふかの畑だ！'],
    [MINA,'耕すのは、ぼくにまかせてねぇ。'],
    [GOD,'いい畑になったのう〜。']]},
  {id:'imoseed',text:'畑にたねをまこう',how:"「おく」でいものたねをえらび、たねがない別々の畑に2こまく",check:()=>imoSeedQuestPlots().length>=2,prog:()=>'いものたね '+Math.min(2,imoSeedQuestPlots().length)+'/2',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'ノドカが耕してくれた畑、まだなにも植わってないね。'],
    [MINA,'畑はねぇ、耕しただけじゃ、なにも育たないんだよぉ。'],
    [MINA,'おいものたね、持ってきたよぉ。まいてみようかぁ。'],
    [POKO,'いもは、いっぺんにたくさんとれるんだよ！']],gives:{items:{'seed:imo':2}}},
   story:[
    [POKO,'#joy|たねをまいてくれて、ありがとう！ 水やりと世話は、ぼくにまかせて！'],
    [MINA,'大きくなるの、たのしみだねぇ。']]},
  companionFieldQuest("earthListen","切り株の下で","古い切り株のそばにあさぶくろを置いたら、切り株をタップ。ノドカと根元の土を確かめる。よけた土をふくろに入れながら、フタバと根の様子を確かめよう","earth",[["F","ノドカ？　どうしたの？"],["N","毎日、畑の土をさわってたらねぇ……ここだけ、土の中に、ほんの少しだけぬくもりが残ってるのに気づいたんだぁ。"],["F","ぬくもり？"],["N","うん。まわりの土は、みんな冷えてるのに。"],["F","#think|……この木……"],["N","知ってる木なのぉ？"],["F","#think|……大きな木だったんだ。"],["N","土の下、見てみようかぁ。よけた土を入れておく、ふくろがあるといいねぇ。あとで、ちゃんと戻せるように。"]],[["F","#think|……あれ？　この傷、ヌシ様の角のあとだ。"],["N","……この傷かぁ。"],["F","ここに頭をくっつけて、お昼寝してたんだ。ぼくが上に乗っても、ぜんぜん起きなくって。"],["F","#think|……また、葉っぱ、生えるかな。"],["N","根は、まだ残ってるよぉ。"],["N","冷えないように、土を戻しておこうねぇ。",0,"stree:cover"],["F","うん。ぼくも、手伝う。"]],['earthListen']),
  /* どのクエストも：吹き出し→会話でクエストを受ける→たっせい→吹き出し→お礼とごほうび */
  {id:'fire',text:'火のせいれいをむかえよう',check:()=>elemCount('fire')>=1&&NEWRES==null,how:'見張り台やサルビアを置いて火の力をためる。満ちた次の朝、神殿の「！」からなかまを呼ぶ',prog:()=>'火の力 '+Math.floor(ATTR.fire)+'/'+needFor('fire'),
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#think|ねえノドカ、あの切り株の根っこ、まだ、あったかいかな。'],
    [MINA,'土をかぶせても、ぬくもりが、少しずつ小さくなってるんだよぉ。'],
    [POKO,'#worry|あたためてあげられたらいいのに……。'],
    [MINA,'火のせいれいなら、ぬくもりを分けてあげられるかもしれないねぇ。夜は、「コワイノ」から村を守ってくれるんだってぇ。'],
    [POKO,'火の力をためて、火のせいれいをむかえよう！']]},
   get story(){return KS([['H','#joy|おう、来てやったぜ！ 今夜からは、おれも村を守る。'],[POKO,'あったかいせいれいが来てくれた！ あのね、あとで見てほしい木があるの。'],['H','木？ ……いいぜ。そんな顔されちゃ、あとで見てやるよ。']])}},
  companionFieldQuest("fireRoot","燃やさない火","切り株のそばにたき火を置いたら、切り株をタップ。火のせいれいが温めた石を根の周りに置く。ノドカと土を整えて、根元の変化を見届けよう","fire",[["F","ここ、あっためられる？"],["H","木を？"],["F","根っこのぬくもりが、少しずつ小さくなってるの。"],["H","……燃やしていい木じゃ、なさそうだな。"],["F","うん。だいじな木。"],["H","なら、根から少しはなして、小さなたき火をするぞ。そこで石を温めて、根のまわりに置くんだ。"]],[["F","ずっと、そばにいなくてもいいの？"],["H","村の見回りもあるからな。おれがいないあいだも、冷えにくくしてやろう。"],["F","待って。前に来たときも、ここにあった？",0,"stree:bud"],["N","……芽だねぇ。"],["F","#joy|芽！",0,"stree:gaze"],["H","見張ってても、急にはでかくならねえぞ。"],["F","でも、見てたい。"],["H","……じゃあ、ちょっとだけな。",0,"stree:sit"]],['fireRoot']),
  /* 芽が出たあと：芽のそばからはなれないフタバに、火のせいれいがベイクドポテトを焼く（warmIns1）。かまどは、まだ思いついていなければ、ここで思いつく */
  stepQuest({id:'warmMeal',text:'あたたかいごはん',
   steps:[{id:'warmYaki',t:'火のせいれいに、ベイクドポテトを焼いてもらう',check:()=>!!S.flags.warmYaki,get how(){return cnt('oven')?'かまどをタップして、ベイクドポテトをえらぶ':'依頼ボードの「ごはん」でかまどをはって置き、かまどをタップして、ベイクドポテトをえらぶ'}}],
   talk:{get who(){return keyName('fire')},when:()=>true,get learn(){return (S.guardianIdeas||{}).oven||(S.recipes||{}).oven?[]:['oven']},get lines(){const L=[['H','#think|フタバのやつ、朝から晩まで、あの芽のそばにいるな。'],['N','ごはんのことも、わすれてるみたいだよぉ。'],['H','しょうがねえな。あったかいもんでも、食わせてやるか。'],['H','いもを火で焼けば、ほくほくになる。焼くのは、おれにまかせな。']];
    if(!(S.guardianIdeas||{}).oven&&!(S.recipes||{}).oven)L.push(['H','#think|けど、火にそのまま入れたら、まっ黒こげだ。守り神、なにか思いつかねえか？'],['@idea'],['H','#joy|へえ、この中で焼くのか。これなら、こがさずにすむな！']);return KS(L)}},
   get story(){return KS([['H','ほらよ、焼きたてだ。',0,'give:H>F'],['F','#joy|あったかい！ ほくほくだね。'],['F','#think|芽のそばにいると、ごはんのこと、わすれちゃうんだ。'],['H','芽を見るのはいいけどな。おまえが元気じゃなきゃ、芽もしんぱいするぞ。'],['N','あしたからは、ごはんを食べてから、みんなで見に行こうねぇ。'],['F','#joy|うん！']])}}),
  stepQuest({id:'water',text:'水のせいれいをむかえよう',
   steps:[{id:'lv3',t:'村レベルを3にする',check:()=>S.lv>=3,prog:()=>'いま 村レベル'+S.lv,how:'せいれいが満足してパワーがたまると、村レベルが上がる'},
    {id:'water',t:'水のせいれいをむかえる',check:()=>elemCount('water')>=1&&NEWRES==null,prog:()=>'水の力 '+Math.floor(ATTR.water)+'/'+needFor('water'),how:'ハスを植えて水の力をため、朝に神殿の「！」から呼ぶ'}],
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'切り株の芽、毎日見に行って、お水もあげてるんだ。'],
    [POKO,'#think|でも、ちゃんと飲めてるのか、わからなくて……。'],
    [MINA,'水のことなら、水のせいれいがくわしいよぉ。畑の水やりも、得意なんだってぇ。'],
    [MINA,'#nod|みんながここで楽しく暮らして、村が育って、水の力もたまったら、来てくれるかもねぇ。']]},
   get story(){return KS([['M','はじめまして。水やりや、水をくむ仕事なら、わたしにまかせてください。'],[POKO,'水のせいれいが来てくれた！ 畑がうるおうね！ これで、切り株の芽にも、ちゃんと水がとどくかな。'],['H','へぇ、水のせいれいか。悪くない村になってきたじゃねえか。'],['@choice',choiceGuide()]])},gives:{flag:'wellR'}}),
  companionFieldQuest("waterFilm","根まで届く水","切り株のそばにみずがめを置いたら、切り株をタップ。水の流れを確かめる。ノドカと水のせいれいに根まで通してもらい、若葉が開くのを、そばで見守る","water",[["M","フタバさん。その水は、どちらへ？"],["F","あの木に。芽が出たんだよ！"],["M","……根のところまで、届いていないようです。"],["F","こんなに、持ってきたのに？"],["M","ええ。でも、どこで止まっているか、わかりました。"],["M","木のそばに、みずがめを置きましょう。一度にかけずに、少しずつ流して確かめたいのです。"]],[["F","じゃあ、一緒に見ててくれる？"],["M","はい。",0,"stree:sit"],["F","……あ。",0,"stree:leaf"],["F","一枚だけだ。"],["M","一枚目、ですね。"],["F","#teary|うん。一枚目。"]],['waterFilm']),
  /* 根まで届く水のあと：水のせいれいが、村へのお礼に、つった魚を火のせいれいに焼いてもらい、みんなにふるまう（aoIns1） */
  stepQuest({id:'aoFish',text:'みんなで焼き魚',
   steps:[{id:'aoCatch',t:'魚を3びきつる',check:()=>(S.flags.aoFishN||0)>=3,prog:()=>'魚 '+Math.min(3,S.flags.aoFishN||0)+'/3',how:'池や川のそばで、せいれいがつりをする'},
    {id:'aoGrill',t:'火のせいれいに、焼き魚を作ってもらう',check:()=>!!S.flags.aoGrill,get how(){return cnt('oven')?'かまどをタップして、焼き魚をえらぶ':'依頼ボードの「ごはん」でかまどをはって置き、かまどをタップして、焼き魚をえらぶ'}}],
   talk:{get who(){return keyName('water')},when:()=>true,get lines(){return KS([['M','この村に来てから、みなさんに、たくさん助けてもらいました。'],['M','#think|なにか、お礼ができないでしょうか……。'],['F','お礼なんて、いいのに。'],['M','池で、お魚をつってきます。ホノさんに焼いてもらって、みんなで食べたいんです。'],['H','#joy|おう、焼くのはまかせな！']])}},
   get story(){return KS([['M','#joy|焼きたてです。どうぞ、フタバさん。',0,'give:M>F'],['F','#joy|いいにおい！ アオがつったお魚？'],['M','はい。……みなさんと同じものを食べられるのが、うれしいんです。'],['N','おいしいねぇ。水のにおいが、ちょっとするよぉ。'],['H','へへっ。焼きかげんも、ばっちりだろ？'],['M','#joy|ええ。この村に来て、よかったです。']])}}),
  stepQuest({id:'kagemark',text:'大きなかげのあとを調べよう',alias:['baseUp'],
   steps:[{id:'kagemark',t:'大きなかげのあとを見つける',check:()=>{if(S.flags.kgDay==null)S.flags.kgDay=dayNo();if(S.flags.kgMark==null&&dayNo()>S.flags.kgDay||S.flags.kgMark!=null&&!S.flags.kgLook&&!kgOpen(S.flags.kgMark))kgPlace();/* あとから草・茂みなどが生えて、かくれたら、空いた所へうつす */return !!S.flags.kgLook},/* 話を聞いたつぎの日から、村の南に大きなかげのあとが出る */prog:()=>S.flags.kgMark==null?'あしたの朝に':'村の南のはしにある',how:'「みる」で、村の南に出た、大きなかげのあとをタップする'},
    {id:'tale',t:'夕方、フタバの話を聞く',check:()=>{if(!S.flags.kgLook)return false;if(S.flags.taleDay==null){S.flags.taleDay=dayNo();S.flags.taleLate=hour()>=18}return (dayNo()>S.flags.taleDay||S.flags.taleLate===false)&&hour()>=18&&!isNight()},/* あとを見つけたあとの、さいしょの18時（18時より前に見つけたらその日、あとならあしたの18時） */how:'18時になると、フタバが話しはじめる'}],
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'さいきん、夜になると、村の外のほうで、ずしん…ずしん…って音がするんだ。'],
    [MINA,'土も、なんだかそわそわしてるよぉ。なにかが、近くを歩きまわってるのかもねぇ。'],
    [POKO,'#alarm|明るくなったら、村のまわりを見てまわろうね。']]},
   story:[
    [MINA,'あの足あと、大きかったねぇ。「コワイノ」がとおったあとに、にてるけど、あんなに大きいのは、はじめて見たよぉ。'],
    [POKO,'#sigh|ぼく、あのつめたさ、知ってる気がするんだ。……ずっとむかし、ぼくがまだ、小さな芽だったころのお話。'],
    [POKO,'ここには、ぼくと同じ、草や木のせいれいがたくさんいたんだ。'],
    [POKO,'#sigh|ある夜、あの足あとみたいな、つめたくて大きなかげが来た。みんなが、ぼくの前に立って……それで、朝になったら、だれもいなかった。'],
    [POKO,'みんなの顔、もう、はっきり思い出せないんだ。でも、ノドカといると、なんだか、なつかしい気がするの。'],
    [MINA,'ふしぎだねぇ。ぼくも、ここの土は、はじめてじゃない気がするよぉ。'],
    [POKO,'#nod|今度は、ぼくが、みんなを守るばん。'],
    ['@choice',{key:'futabaBrave',who:POKO,q:'#worry|……ぼく、つよくなれるかな。',opts:[
     {t:'なれるよ',v:'strong',lines:[[POKO,'#joy|……うん。ありがとう、守り神さま。']]},
     {t:'いっしょに守ろう',v:'together',lines:[[POKO,'#nod|……うん。いっしょなら、こわくない。']]}]}]]}),
  stepQuest({id:'ookage',text:'オオカゲから村を守ろう',
   steps:[{id:'lv4',t:'村レベルを4にする',check:()=>S.lv>=4,prog:()=>'いま 村レベル'+S.lv,how:'せいれいが満足してパワーがたまると、村レベルが上がる'},
    {id:'yoru10',t:'「コワイノ」を10体追いはらう',check:()=>killsSince()>=10,prog:()=>'コワイノ '+Math.min(10,killsSince())+'/10',how:'夜に来る「コワイノ」を、あわせて10体追いはらう'},
    {id:'ookage',t:'オオカゲを追いはらう',check:()=>(S.bossKills||0)>=1,prog:()=>bossDays(),how:'柵・見張り台・罠を整え、夜に来るオオカゲを追いはらう'}],
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'#alarm|守り神さま、夜の「コワイノ」を見てたらね…森の奥に、ひときわ大きな黒い影がいたんだ。あの足あとの、かげだよ。きっと。'],
    [MINA,'#alarm|それは「オオカゲ」だねぇ。「コワイノ」が、たくさんあつまってできた影だって、言われてるよぉ。'],
    [MINA,'#alarm|土の音を聞くとねぇ……もうすぐ、来そうだよぉ。'],
    [MINA,'#nod|みんなで、そなえておこうねぇ。']]},
   get story(){return [
    [POKO,S.flags.choice?.futabaBrave==='strong'?'#joy|追いはらえた……！ ぼく、ちょっとだけ、つよくなれたかな。':S.flags.choice?.futabaBrave==='together'?'#joy|追いはらえた……！ みんないっしょだったから、こわくなかったよ。':'追いはらえた……！ みんなで、ちゃんと夜をこえられたね！'],
    [MINA,'おつかれさまだねぇ。オオカゲは、ヌシ様がいなくなったことと、なにか関係があるのかもしれないねぇ。'],
    [POKO,'#think|ヌシ様、どこへ行っちゃったのかな……。'],
    [MINA,'土に残ったお話ではねぇ、ヌシ様は力をうばわれて、姿を保てなくなったんだってぇ。'],[MINA,'でも、ヌシ様の力は、まだ土のどこかに残ってる気がするよぉ。'],
    [POKO,'#think|……その力、どこにあるのかな。'],[MINA,'わからないねぇ。でも、あの切り株の根っこみたいに、どこかで静かに待ってるのかもしれないよぉ。']]}}),
  /* オオカゲを追いはらったあと：フタバが「こもれびのまもり」をおぼえて、夜に火のせいれいを守る（前はピンクの会話 e06・e06d） */
  stepQuest({id:'guardLearn',text:'こもれびのまもり',
   steps:[{id:'guardUse',t:'夜、フタバがこもれびのまもりで火のせいれいを守る',check:()=>!!S.flags.guardUsed,how:'夜、「コワイノ」にねらわれている火のせいれいを、フタバがはなれた所から葉っぱで守る'}],
   talk:{who:POKO,when:()=>true,get lines(){const e=SEV1.find(x=>x.k===(S.flags.hDied?'e06d':'e06'));return e?sevLines(e.L)||[]:[]},
    gives:{run(){S.flags.guard=true;memo('🍃','フタバが「こもれびのまもり」をおぼえた');skillPop('leaf','フタバが「こもれびのまもり」をおぼえた！',['夜、「コワイノ」にねらわれている火のせいれいを、はなれた所から葉っぱで1人守る。','守られたせいれいは、40分のあいだ、「コワイノ」から受けるダメージ0.5倍。','つかったあとは、75分たつと、また守れる。'])}}},
   get story(){return KS([['H','ゆうべは、助かったぜ。葉っぱが、ふわっとかかってさ。'],['F','#surprise|ほんと！？ ……ちゃんと、とどいてたんだ。'],['H','ああ。おまえも、いっしょに村を守ってたんだな。'],['F','#joy|うん！ これからも、いっしょに守ろうね。']])}}),
  {id:'wind',text:'風のせいれいをむかえよう',how:"「おく」→「ゆりの種」を植えたり、ブランコを置いたりして風の力をため、朝に神殿の「！」から呼ぶ",check:()=>elemCount('wind')>=1&&NEWRES==null,prog:()=>'風の力 '+Math.floor(ATTR.wind)+'/'+needFor('wind'),
   talk:{who:POKO,when:()=>true,learn:['swing'],lines:[
    [POKO,'#think|切り株の葉っぱ、まだ一枚だけなんだ。風がふくと、ちょっとだけゆれるの。'],
    [MINA,'風のせいれいはねぇ、そよ風みたいな、やさしい風も使えるんだよぉ。遊ぶのが大好きで、遠くに落ちてるふしぎな種も、ひろってきてくれるんだぁ。'],
    [MINA,'あの葉っぱにも、いい風を運んでくれるかもしれないねぇ。風の力をためれば、来てくれるはずだよぉ。'],
    [POKO,'#think|風のせいれいって、遊ぶのが好きなんだよね。ふわっとゆれる遊び道具があったら、よろこんでくれるかな？ 守り神さま、なにか思いつく？'],['@idea']]},
   get story(){return KS([['K','フッ…風に呼ばれて来てみれば、ずいぶん素朴な村だね。'],[POKO,'風のせいれいが来た！ これで5つの属性がそろったね！'],['K','フッ…素朴なのも、悪くない。ぼくの風で、もっと華やかにしてあげよう。'],[POKO,'#think|……そうだ。あの切り株の若葉にも、やさしい風をとどけてくれるかな。']])}},
  companionFieldQuest("windEcho","葉ずれの向こう","切り株のそばに風車を建てたら、切り株をタップ。風のせいれいと若葉の音を聞く。集まった仲間と世話をして、フタバの声を届けよう。返事を最後まで聞く","wind",[["K","ずいぶん大事にされているね。この木は。"],["F","みんなで、お世話してるんだ。"],["K","……根元へ、風を通してみてもいいかな。"],["F","葉っぱ、飛んでいかない？"],["K","そんな乱暴な風は、使わないさ。"],["K","木のそばに、風車を建ててもいいかな。羽が回れば、風の強さが目で見える。強すぎたら、すぐわかるよ。"]],[["F","#teary|……生きてる。"],["F","ヌシ様、生きてるんだ。"],["F","ぼくが、ひとりじゃないって……。"],["N","聞いてくれたねぇ。",0,"stree:touch"],["F","守り神さま。"],["F","ヌシ様を、もとの姿に戻してあげたい。"],["F","また、この木の下で……みんなで会いたい。"]],['windEcho']),
  /* 葉ずれの向こうのあと：風のせいれいが、たこをあげて、空から村をながめる（kiteIns1）。霧のむこうの足あとに気づき、かけらさがしへつながる */
  stepQuest({id:'kite',text:'空からのながめ',
   steps:[{id:'kiteMat',t:'たこの材料をあつめる',check:()=>(S.mat.eda||0)>=3&&(S.mat.shina||0)>=4,prog:()=>'枝 '+Math.min(3,S.mat.eda||0)+'/3　しなやかな草 '+Math.min(4,S.mat.shina||0)+'/4',how:'枝と、しなやかな草を素材箱にためる'}],
   talk:{get who(){return keyName('wind')},when:()=>true,get lines(){return KS([['K','フッ……この村の空は、いい風がふくね。'],['K','#think|ずっと高い所から、村をながめてみたいんだ。たこをあげたら、きっと見えるさ。'],['F','たこ？ ぼくも見たい！'],['K','枝と、しなやかな草があれば、作れるよ。'],['N','あつまったら、みんなで見ようねぇ。']])}},
   get story(){return KS([['K','#joy|さあ、いくよ。風に、のせて……！',0,'kite:K'],['F','#surprise|わあ……！ あんなに高く！'],['K','フッ…見えるよ。御神木も、畑も、みんなの家も。'],['K','#think|……霧のむこうに、光る点がならんでいる。だれかが歩いた、あとみたいだ。'],['N','#surprise|それ、ヌシ様の足あとかもしれないねぇ……！'],['F','#joy|見にいきたい！ フウ、ありがとう！']])},
   pay:{eda:3,shina:4}}),/* たこの材料は、クリアのときにつかう */
  Object.assign(companionFieldQuest('tower','この木を、御神木に育てよう','切り株のそばにベンチを置いたら、切り株をタップ。フタバたちと御神木を育てよう','wood',[
    ['G','……よう、声を届けたのう。'],['F','でも、すぐ聞こえなくなっちゃった。'],['G','声を返すだけでも、力が要ったのじゃろう。'],['F','どうしたら、戻ってこられる？'],['G','ヌシの力は、3つのかけらになって、この土地に散らばっておる。それを、もう一度つないでやるのじゃ。この木は、土地の奥まで根を伸ばしておる。'],['G','じゃが、この木はまだ細い。ヌシの力を受け止めるには、この木も、土地も、育たねばならん。'],['G','おヌシらが育てるなら、わしも手を貸そう。'],['F','じゃあ、木のそばにベンチを置こうよ。みんなで、木を見ていられるように。']
  ],[['F','枝が、伸びた……！'],['N','根の先も、さっきより遠くへ届いてるよぉ。'],['M','水の流れも、木のほうへ向いています。'],['F','大きくなったら、みんなで休もうね。']]),{check:()=>cnt('tower')>=1,gives:{shrine:true}}),
  stepQuest({id:'lv5',text:'ヌシ様のかけらをさがそう',
   steps:[{id:'green375',/* id はセーブの読みかえのため、前のまま（前は、みどりのマス） */t:'ヌシ様の足あとを3つたどる',check:()=>{printEnsure();return printN()>=PRINT_N},prog:()=>{const w=printWhy();return '足あと '+printN()+'/'+PRINT_N+(w?'　'+w:'')},how:'「みる」でヌシ様の足あとをタップして、フタバに見にいってもらう。霧は、となりの晴れた土地を緑にすると晴れる'}],
   talk:{who:POKO,when:()=>true,get lines(){const seen=(S.fogF||[]).some(f=>f.t==='print'&&f.done);return [
    [POKO,S.flags.nushiAlive?'ヌシ様は、生きてた。ぼくたちの声を聞いてくれたんだ。今度は、ぼくたちがヌシ様の力を取り戻したい！':'ヌシ様の力は、かけらの中に残ってるんだね。ぼくたちで、もう一度つなぎたい！'],
    [MINA,'あの木も、御神木に育ったねぇ。……土がねぇ、かけらが3つそろうのを、まってるみたいなんだぁ。'],
    [POKO,seen?'#think|……そうだ。霧の中で見つけた、ヌシ様の足あと。':'#think|ヌシ様はね、毎朝、草原を歩いてまわってたんだ。足あとが、まだどこかに残ってるかも。'],
    [POKO,'ヌシ様が歩いた道を、たどってみたいな。どこかで、かけらが待ってる気がするんだ。'],
    [GOD,'#nod|うむ。ヌシが歩いた道には、ヌシの力が、いまも残っておるはずじゃ。わしも、いっしょに見守るぞい。']]}},
   get story(){return [
    [POKO,'#surprise|足あとの光の中に……かけらがあった！'],
    [MINA,'#surprise|えぇっ……！ ほんとだねぇ。'],
    [MINA,'「育てる力」のかけらだねぇ。ヌシ様が歩いた道を、みんなで緑にしたから、こたえてくれたんだよぉ。'],
    ...KS([['H','#joy|かけらだ！ 御神木も、なんだかうれしそうだな。'],['M','のこりは、あとふたつですね。'],['K','フッ…風も、かけらの光にさそわれているようだね。']]).filter(l=>S.res.some(r=>r.name===l[0]))];},gives:{shard:'land'}}),
  stepQuest({id:'omoi',text:'なかよしの想い',
   steps:[{id:'omoi',t:'あたらしい「なかよし」3組の想いを、御神木へとどける',check:()=>omoiN()>=3,prog:()=>{const q=(S.flags.omoiW||[]).length;return 'とどいた想い '+Math.min(3,omoiN())+'/3'+(q?'　御神木に会いにいきたい2人がいる':'')},how:'せいれいどうしが、いっしょに遊んだり、おしゃべりしたり、同じ食卓で食べたりすると、なかよしになる。なかよしになった2人がいたら、御神木をタップする'}],
   talk:{who:MINA,when:()=>true,get lines(){return [
    [MINA,'#think|ねぇ、フタバ。のこりのかけらのことなんだけどねぇ……。'],
    [MINA,'土がねぇ、「想う力」のかけらも、この草原のどこかで、ねむってるって言ってる気がするんだぁ。'],
    [POKO,'#think|想う力……？ だれかのことを、想う力？'],
    [MINA,'うん。ヌシ様はねぇ、草原の子たちがなかよく暮らしてるのを見るのが、いちばん好きだったんだってぇ。'],
    [POKO,'#joy|そっか！ じゃあ、みんながもっと、なかよしになったら……かけらも、こたえてくれるかな！'],
    ...KS([['H','へっ、なかよくなるのは、まかせとけ。'],['M','#joy|いっしょに過ごす時間を、ふやしましょう。'],['K','フッ…ぼくと仲良くなりたい子は、たくさんいるだろうね。']]).filter(l=>S.res.some(r=>r.name===l[0])),
    [MINA,'#nod|御神木も、きっと見てるよぉ。']]}},
   get story(){return [
    [POKO,'#surprise|見て！ 御神木の根もとが、ぽうっと光ってる……！',0,'glow'],
    [MINA,'#surprise|かけらだよぉ……！ 「想う力」のかけらだねぇ。'],
    [MINA,'みんなが、だれかを想う気持ちに、ヌシ様の力がこたえてくれたんだねぇ。'],
    [POKO,'#joy|ぼくたち、もっとなかよしになれたんだね！'],
    ...KS([['H','#joy|へへっ、なんだか、てれくさいな。'],['M','のこりは、あとひとつですね。'],['K','フッ…想いの光か。悪くないね。']]).filter(l=>S.res.some(r=>r.name===l[0]))];},gives:{shard:'key'}}),
  stepQuest({id:'wood6',text:'木のなかまと花畑',
   steps:[{id:'wood6',t:'木のせいれいを5人にする',check:()=>elemCount('wood')>=5&&NEWRES==null,prog:()=>'木のせいれい '+Math.min(5,elemCount('wood'))+'/5',how:'花や木を植えて木の力をため、朝に神殿の「！」から呼ぶ。合計5人をむかえる'},
    {id:'flower50',/* id はセーブの読みかえのため、前のまま（前は、花を50こ） */get t(){return '御神木のそばに、'+wflName()+'を5本咲かせる'},check:()=>wflN()>=WFL_N,prog:()=>wflName()+' '+wflN()+'/'+WFL_N,get how(){return '「おく」で'+wflName()+'の種を、御神木のそばに置く'}},
    {id:'flTend',t:'木のせいれい5人に、花の世話をしてもらう',check:()=>wflTN()>=WFL_TEND,prog:()=>'花の世話 '+wflTN()+'/'+WFL_TEND+(wflN()<WFL_N?'　'+wflName()+'が咲くのを待っている':''),get how(){return '御神木のそばの'+wflName()+'が咲くのを待とう'}}],
   talk:{who:MINA,when:()=>true,learn:['campfire'],lines:[
    [MINA,'御神木、大きくなってきたねぇ。ヌシ様は、この草原のせいれいを生んだんだってぇ。木のなかまがふえたら、御神木のお世話も、みんなでたっぷりできるねぇ。'],
    [POKO,'守り神さま、ひとつ、おねがいしてもいい？ ヌシ様がいたころ、御神木のまわりは、花でいっぱいだったんだ。ヌシ様が帰ってきたとき、さいしょに、その花を見てほしいんだ。'],
    [POKO,'木のなかまといっしょに、御神木のそばに花畑をつくって、みんなでお世話したいな！'],
    ['@choice',{key:'nushiFlower',who:POKO,q:'#think|ヌシ様に、さいしょに見てほしい花……どれがいいかな？',pick:v=>{S.unlocked[v]=true;/* えらんだ花は、カミサマのお店でも買える */const it={[v]:5};for(const[id,n]of Object.entries(it))giveItem(id,n);queueItemGift(it)},opts:[
     {t:'ききょう',v:'bellf',lines:[[POKO,'#joy|ききょう！ ノドカを呼んでくれた花だね！']]},
     {t:'ゆり',v:'lily',lines:[[POKO,'#joy|ゆり！ 白くて、ヌシ様の毛なみみたいだね！']]},
     {t:'シロツメクサ',v:'clover',lines:[[POKO,'#joy|シロツメクサ！ ヌシ様のそばで、よく四つ葉をさがしたんだ！']]}]}],
    [MINA,'#joy|花が咲いたら、木のなかまで、お世話してあげてねぇ。']]},
   get story(){return [[POKO,'#surprise|わあ…御神木のまわりが、'+wflName()+'でいっぱいだ！ 木のなかまも、こんなにふえたね！ ありがとう、守り神さま！'],[POKO,'#joy|みんなでお世話したから、こんなにきれいに咲いたんだね。'],[MINA,'にぎやかだねぇ。これで、御神木のお世話も、たっぷりできるねぇ。'],...KS([['M','#joy|花のあいだを、水がすうっと流れていきます。'],['K','フッ…花のかおりが、風にのって村じゅうに広がっているよ。'],['H','夜は、おれが花畑も見まわっとくぜ。']]).filter(l=>S.res.some(r=>r.name===l[0])),[POKO,'ヌシ様、見てくれるかな。……会いたいな。']]}}),
  {id:'nushi',get text(){return grassEndingGoal().text},check:()=>!!S.cleared,prog:()=>grassEndingGoal().progress,get how(){return grassEndingGoal().how},
   talk:{who:POKO,when:()=>true,get lines(){return [
    [POKO,'かけらも、あと少しだね。ヌシ様をむかえる準備、もうすぐかな。'],
    [MINA,'#think|御神木にヌシ様の力があつまってくるとねぇ、影たちは、その力にひきよせられて、やってくるんだってぇ。'],
    [MINA,'さいごまで守りぬいたら……ヌシ様の力が、こたえてくれる気がするよぉ。'],
    [POKO,'#joy|よーし、みんなで守りぬこう！']]}},
   story:null},
];
/* まとめる前（PR 1100ごろまで）の草原の目標の名前とならび。古いセーブの番号を読みかえるときだけ使う */
const QUESTS1_V1=['statue','stor','mbox','table','wall','bed','path','lv2','fence4','watch1','kikyo','summon','earthListen','earthRoot','farm6','imoseed','trade','oracle','fire','fireRoot','fireTrace','lv3','water','waterFilm','waterLeaf','baseUp','lv4','kagemark','tale','yoru10','ookage','wind','windEcho','windVoices','lv5','tower','green375','wood6','flower50','nushi'];
/* 交換・おつげの目標をサブクエストへうつす前（tutSub1）の草原の目標のならび。古いセーブの番号を読みかえるときだけ使う */
/* 畑の目標を、切り株の下で（earthListen）より先にした（farmFirst1）前の草原の目標のならび。古いセーブの番号を読みかえるときだけ使う */
const QUESTS1_V4=["statue","stor","mbox","table","wall","bed","path","lv2","fence4","watch1","kikyo","summon","earthListen","farm6","imoseed","fire","fireRoot","water","waterFilm","kagemark","ookage","wind","windEcho","tower","lv5","wood6","nushi"];
let QV3=null;const QUESTS1_V3=()=>QV3||(QV3=QUESTS1_V4.flatMap(id=>id==='imoseed'?['imoseed','trade','oracle']:[id])),v3Ix=id=>QUESTS1_V3().indexOf(id);
/* カミサマの旅立ちの会話。交換のサブクエストのお礼か、火のせいれいをむかえたあと（godFarewellTick）の、どちらか1回 */
const GOD_FAREWELL=()=>[[GOD,'さて、教えることはだいたい教えたかの！ わしは、ほかの土地も見まわらねばならんのじゃ。ほかの土地にも、こまっとる子らがおるでな。'],
    [POKO,'#surprise|えっ、もう行っちゃうの？'],[POKO,'#think|……あ、ううん。ぼくたちだけでも、だいじょうぶ……だよね？'],[GOD,'#nod|ほっほ。フタバには、もう守り神も、なかまもおるじゃろ。'],[GOD,'#worry|……さみしくなったら、空を見上げるんじゃ。わしは、いつでも見とるからの。'],[MINA,'だいじょうぶだよぉ、フタバ。'],[POKO,'#think|……うん。そうだよね！'],
    [GOD,'#think|……それにな、この草原には、まだヌシの気配が、かすかに残っとる。この土地を、だいじにしてやっておくれ。'],[GOD,'ときどき、ようすを見に来るぞい。ではな〜！'],[POKO,'#joy|いろいろ教えてくれて、ありがとう、カミサマ！ またね！']];
const COMPANION_QUESTS=new Set(['earthListen','earthRoot','fireRoot','fireTrace','waterFilm','waterLeaf','windEcho','windVoices']);
const COMPANION_REPLACEMENTS={fireSupplies:'fireRoot',fireLights:'fireTrace',waterFields:'waterFilm',waterFlowers:'waterLeaf',windRoad:'windEcho',windGather:'windVoices'};
const V1_LEARN={wind:['swing'],flower50:['campfire']};
function companionQuestList(state){/* そのセーブの番号がさす、目標のならび（古いセーブは、名前だけのならび） */
  if((state.world||0)!==0||state.free)return QUESTS1;if(state.flags?.qmerge1)return state.flags.tutSub1?QUESTS1:QUESTS1_V3().map(id=>QUESTS1.find(q=>q.id===id)||{id,talk:{learn:[]}});
  let ids=QUESTS1_V1;
  if(!state.flags?.fieldStoryV2){if(!state.flags?.companionStory)ids=ids.filter(id=>!COMPANION_QUESTS.has(id));else{const prior=Object.fromEntries(Object.entries(COMPANION_REPLACEMENTS).map(([a,b])=>[b,a]));ids=ids.filter(id=>!['earthListen','earthRoot'].includes(id)).map(id=>prior[id]||id)}}
  return ids.map(id=>({id,talk:{learn:V1_LEARN[id]||[]}}));
}
function migrateCompanionStory(state){
  if(state.flags.fieldStoryV2)return;
  if(!state.free&&(state.world||0)===0){
    const old=companionQuestList(state),map=i=>i>=old.length?QUESTS1_V1.length:QUESTS1_V1.indexOf(COMPANION_REPLACEMENTS[old[i]?.id]||old[i]?.id);
    state.quest=map(state.quest||0);if(state.qStory!=null)state.qStory=map(state.qStory);
    if(state.qStory==null&&COMPANION_QUESTS.has(QUESTS1_V1[state.quest]))state.qTalked=false;
  }
  state.flags.companionStory=1;state.flags.fieldStoryV2=1;
}
/* 小さな目標をまとめた（qmerge1）：古いセーブの番号（QUESTS1_V1）を、まとめた目標の番号へ。とちゅうの小さな目標は、まとめた目標の中の「できた」になる */
const QM_GROUP={earthRoot:'earthListen',fireTrace:'fireRoot',lv3:'water',waterLeaf:'waterFilm',baseUp:'kagemark',tale:'kagemark',lv4:'ookage',yoru10:'ookage',windVoices:'windEcho',green375:'lv5',flower50:'wood6'};
const QM_OWNER={water:'water',kagemark:'kagemark',ookage:'ookage',lv5:'lv5',wood6:'wood6'};/* まとめた目標の会話は、もとのどの目標の会話か（そこより前の目標にいたら、会話を聞きなおす） */
const QM_TALK={flower50:{recipes:['campfire']}};/* 会話を聞かずに進む小さな目標で、もとの会話でもらえた物 */
function migrateQuestMerge(state){
  if(state.flags.qmerge1)return;
  if(!state.free&&(state.world||0)===0){
    const V=QUESTS1_V1,ni=id=>v3Ix(QM_GROUP[id]||id),last=id=>{const g=QM_GROUP[id]||id;return !V.some((v,k)=>k>V.indexOf(id)&&(QM_GROUP[v]||v)===g)};
    const oq=state.quest||0,os=state.qStory,id=V[oq],give=g=>{for(const k in g.items||{}){(state.unlocked||(state.unlocked={}))[k]=true;const inv=state.inv||(state.inv={});if(k.startsWith('seed:')){const c=k.slice(5);(state.cseed||(state.cseed={}))[c]=(state.cseed[c]||0)+g.items[k]}else inv[k]=(inv[k]||0)+g.items[k]}for(const f of g.feat||[])(state.feat||(state.feat={}))[f]=true;for(const k in g.mat||{})state.mat[k]=(state.mat[k]||0)+g.mat[k];for(const f of g.flags||[])state.flags[f]=true;if(g.flag)state.flags[g.flag]=true;for(const r of g.recipes||[])(state.recipes||(state.recipes={}))[r]=true};
    if(id==null)state.quest=QUESTS1_V3().length;
    else{
      const g=QM_GROUP[id]||id,owner=QM_OWNER[g]||g,members=V.filter(v=>(QM_GROUP[v]||v)===g),at=members.indexOf(id),oi=members.indexOf(owner);
      state.quest=id==='lv5'?v3Ix('tower'):ni(id);/* 御神木の話を、かけらさがしの前にした */
      if(id!=='lv5'&&(at>oi||at===oi&&state.qTalked)){/* まとめた会話は、もう聞いた。聞いていない小さな目標の会話でもらえた物をわたす */
        for(const m of members.slice(at>oi&&!state.qTalked?at:at+1))if(QM_TALK[m])give(QM_TALK[m]);
        state.qTalked=true;
      }else state.qTalked=false;
      if(id==='lv4'){state.quest=v3Ix('kagemark');state.qTalked=false}/* 古いならびの「村レベル4」は、かげのあとより前：かげのあとの話から（村レベル4は、オオカゲの目標の中でかぞえる） */
    }
    if(os!=null){const sid=V[os];state.qStory=sid!=null&&last(sid)?ni(sid):null;if(state.qStory!=null&&state.quest<=state.qStory)state.quest=state.qStory+1;}/* まとめた目標のとちゅうのお礼の話は、まとめた目標のお礼にふくめる */
  }
  state.flags.qmerge1=1;state.flags.qsplit1=1;state.flags.earthMerge1=1;/* はじめの目標は、もとの1つずつのならびへ、そのまま読みかえた */
}
/* はじめ（カミサマが旅立つまで）の目標を、また1つずつにもどした（qsplit1）。まとめていた目標の名前と、中の目標 */
const QS_SPLIT={kurashi:['stor','mbox','table'],ie:['wall','bed','path'],mamori:['lv2','fence4','watch1'],kikyo:['kikyo','summon'],hatake:['farm6','imoseed'],trade:['trade','oracle']};
function questsV2(){/* まとめていたころの草原の目標のならび */const o=[];for(const id of QUESTS1_V3()){const g=Object.keys(QS_SPLIT).find(k=>QS_SPLIT[k].includes(id));if(!g)o.push(id);else if(QS_SPLIT[g][0]===id)o.push(g)}return o}
const qsIx=id=>QUESTS1.findIndex(q=>q.id===id);
function migrateQuestSplit(state){
  if(state.flags.qsplit1)return;state.flags.qsplit1=1;state.flags.earthMerge1=1;
  if(state.free||(state.world||0)!==0)return;
  const V=questsV2(),id=V[state.quest||0],sid=state.qStory!=null?V[state.qStory]:null;
  if(state.qStory!=null){const m=QS_SPLIT[sid];if(m){state.flags.qsplitStory=sid;state.qStory=v3Ix(m[m.length-1])}else state.qStory=sid!=null?v3Ix(sid):null}/* まとめた目標のお礼を待っていた：中の目標のお礼へ（読みこんだあと questSplitResolve でわたす） */
  if(id==null)state.quest=QUESTS1_V3().length;
  else{const m=QS_SPLIT[id];state.quest=v3Ix(m?m[0]:id);if(m&&state.qTalked)state.flags.qsplitPend=id}/* まとめた会話を聞いた：中の目標の会話はとばし、できている目標は、とばす */
}
/* 切り株の下で（earthListen）と傷つけないように（earthRoot）を、1つの依頼にまとめた（earthMerge1）。分けていたころの番号を、名前で読みかえる（1回だけ） */
function migrateEarthMerge(state){
  if(state.flags.earthMerge1)return;state.flags.earthMerge1=1;
  if(state.free||(state.world||0)!==0)return;
  const V=QUESTS1_V3().flatMap(id=>id==='earthListen'?['earthListen','earthRoot']:[id]),ix=id=>v3Ix(id==='earthRoot'?'earthListen':id),e=v3Ix('earthListen');
  const id=V[state.quest||0],sid=state.qStory!=null?V[state.qStory]:null;
  state.quest=id==null?QUESTS1_V3().length:ix(id);if(id==='earthRoot')state.qTalked=true;/* あとの調べの依頼の会話は、まとめた依頼の会話（もう聞いた）にふくめる */
  if(sid==='earthListen'){state.qStory=null;state.quest=e;state.qTalked=true}/* まえの調べのお礼の会話はなくした：まとめた依頼のつづき（あとの調べ）へ */
  else if(sid!=null)state.qStory=ix(sid);
  if(state.flags.qsplitPend==='earthListen')delete state.flags.qsplitPend;if(state.flags.qsplitStory==='earthListen')delete state.flags.qsplitStory;
}
/* 交換・おつげの目標を、メインからサブクエストへうつした（tutSub1）。古いセーブの番号（QUESTS1_V3）を名前で読みかえ、とちゅうなら、サブクエストのつづきにする（1回だけ） */
function migrateTutSub(state){
  if(state.flags.tutSub1)return;state.flags.tutSub1=1;
  if(state.free||(state.world||0)!==0)return;
  const V=QUESTS1_V3(),F=state.flags,St=state.subSt||(state.subSt={}),D=state.subDone||(state.subDone={}),Sn=state.subSeen||(state.subSeen={}),ix=id=>QUESTS1_V4.indexOf(id);/* 畑を先にする前のならび（このあと migrateFarmFirst で読みかえる） */
  const id=V[state.quest||0],sid=state.qStory!=null?V[state.qStory]:null,tutor=['trade','oracle'];
  const set=(k,v)=>{St[k]=v;Sn[k]=1;if(v===3)(state.subArrived||(state.subArrived={}))[k]=true;if(v===4)D[k]=1};
  for(const k of tutor){const i=V.indexOf(k);if((state.quest||0)>i&&sid!==k)set(k,4)}/* もうおわった：二度と出さない */
  if(F.qsplitStory==='trade'){delete F.qsplitStory;set('trade',3);set('oracle',3)}/* まとめていたころのお礼を待っていた */
  else if(sid==='trade'||sid==='oracle')set(sid,3);/* お礼の会話を待っていた：サブクエストの報告待ち */
  if(F.qsplitPend==='trade'){delete F.qsplitPend;if(id==='trade')set('trade',2);set('oracle',2)}/* まとめた会話は聞いた */
  else if((id==='trade'||id==='oracle')&&state.qTalked)set(id,2);/* 受けたところ：サブクエストのつづき */
  if(id==null)state.quest=QUESTS1_V4.length;
  else if(tutor.includes(id)){state.quest=ix('fire');state.qTalked=false}
  else state.quest=ix(id);
  state.qStory=sid==null||tutor.includes(sid)?null:ix(sid);
}
/* 畑の目標（farm6・imoseed）を、切り株の下で（earthListen）より先にした（farmFirst1）。古いセーブの番号（QUESTS1_V4）を名前で読みかえる（1回だけ） */
function migrateFarmFirst(state){
  if(state.flags.farmFirst1)return;state.flags.farmFirst1=1;
  if(state.free||(state.world||0)!==0)return;
  const V=QUESTS1_V4,ix=id=>QUESTS1.findIndex(q=>q.id===id),id=V[state.quest||0],sid=state.qStory!=null?V[state.qStory]:null;
  state.quest=id==null?QUESTS1.length:ix(id);state.qStory=sid==null?null:ix(sid);
  if(id==='earthListen'){
    if(!state.qTalked)state.quest=ix('farm6');/* まだ受けていない：先に畑の目標から */
    else{/* 調べのとちゅう：そのままつづける。とばした畑の目標の会話でもらえた物をわたす */
      const inv=state.inv||(state.inv={}),un=state.unlocked||(state.unlocked={}),cs=state.cseed||(state.cseed={});
      for(const q of ['farm6','imoseed'].map(k=>QUESTS1[ix(k)])){const g=(q.talk&&q.talk.gives&&q.talk.gives.items)||{};for(const k in g){un[k]=true;if(k.startsWith('seed:')){const c=k.slice(5);cs[c]=(cs[c]||0)+g[k]}else inv[k]=(inv[k]||0)+g[k]}}
    }
  }else if(id==='farm6'||id==='imoseed')(state.flags.qPassed||(state.flags.qPassed={})).earthListen=1;/* 切り株の下では、もうした：そこへ来たら、とばす */
}
/* 「あたたかいごはん」（warmMeal）を、燃やさない火（fireRoot）のあとに足した（warmIns1）。pre：読みこんだときに、もう今のならび（farmFirst1）の番号だったセーブ。なかよしの想いの読みかえより先にする */
/* 「こもれびのまもり」（guardLearn）・「みんなで焼き魚」（aoFish）・「空からのながめ」（kite）を足した（story3ins1）。pre：読みこんだときに、もう今のならび（farmFirst1）の番号だったセーブ。番号は名前で読みかえる（なかよしの想いの読みかえのあとに） */
const STORY3_NEW=['guardLearn','aoFish','kite'];
function migrateStory3Ins(state,pre){
  if(state.flags.story3ins1)return;state.flags.story3ins1=1;
  if(state.free||(state.world||0)!==0)return;
  if(pre){const old=QUESTS1.map(q=>q.id).filter(id=>!STORY3_NEW.includes(id)),to=i=>i==null?null:i>=old.length?QUESTS1.length:qsIx(old[i]);state.quest=to(state.quest||0);state.qStory=to(state.qStory)}
  for(const id of STORY3_NEW){const w=qsIx(id);if(state.qStory===w-1&&(state.quest||0)===w+1){state.quest=w;state.qTalked=false}}/* 前の目標のお礼を待っていた：お礼のあと、足した目標へ */
  const g=qsIx('guardLearn');if((state.quest||0)===g&&state.flags.guard){state.quest=g+1;state.qTalked=false}/* もうピンクの会話でおぼえていたら、とばす */
}
function migrateWarmIns(state,pre){
  if(state.flags.warmIns1)return;state.flags.warmIns1=1;
  if(state.free||(state.world||0)!==0)return;
  const w=qsIx('warmMeal');
  if(pre){if((state.quest||0)>=w)state.quest=(state.quest||0)+1;if(state.qStory!=null&&state.qStory>=w)state.qStory++}
  if(state.qStory===w-1&&(state.quest||0)>w){state.quest=w;state.qTalked=false}/* 燃やさない火のお礼を待っていた：お礼のあと「あたたかいごはん」へ */
}
/* 「なかよしの想い」（omoi）を、かけらさがし（lv5）のあとに足した（omoiIns1）。pre：読みこんだときに、もう今のならび（farmFirst1）の番号だったセーブ */
function migrateOmoiIns(state,pre){
  if(state.flags.omoiIns1)return;state.flags.omoiIns1=1;
  if(state.free||(state.world||0)!==0)return;
  const o=qsIx('omoi');
  if(pre){if((state.quest||0)>=o)state.quest=(state.quest||0)+1;if(state.qStory!=null&&state.qStory>=o)state.qStory++}
  if(state.qStory===o-1&&(state.quest||0)>o)state.quest=o;/* かけらさがしのお礼を待っていた：お礼のあと「なかよしの想い」へ */
}
/* まとめた目標のとちゅうから読みこんだとき：できている目標をとばして、はじめのできていない目標へ。まとめた会話でもらった物は、もう一度わたさない */
function questSplitResolve(){
  const F=S.flags;if(WD!==0||S.free)return;
  const pv=i=>{const q=QUESTS1[i];if(q.pre&&!F['pre0_'+i]){F['pre0_'+i]=true;questGives(q,q.pre)}const g=q.gives||{};questGives(q,Object.assign({},g,{msg:null}));inspireQuest(q,'clear')};
  const gl=i=>!!(QUESTS1[i].gives||{}).godLeave;
  if(F.qsplitStory){const m=QS_SPLIT[F.qsplitStory].map(qsIx);delete F.qsplitStory;const t=m.find(gl)??m[m.length-1];for(const i of m)if(i!==t)pv(i);S.qStory=t}
  if(F.qsplitPend){const m=QS_SPLIT[F.qsplitPend].map(qsIx);
    while(m.includes(S.quest)){
      S.qTalked=true;const i=S.quest,q=QUESTS1[i];let ok=false;try{ok=!!q.check()}catch(e){}
      if(!ok||i===m[m.length-1]||S.qStory!=null)break;
      S.quest++;if(gl(i)){S.qStory=i;S.qTalked=true;break}pv(i);
    }
    if(!m.includes(S.quest))delete F.qsplitPend;else S.qTalked=true;
  }
}
