'use strict';

/* ---------- もの ---------- */
// kind: block・plant=おそなえ/カミサマとの交換でおそなえ箱に入る / furn=依頼ボードでせいれいが作る / build=せいれいが建てる（パワー）
const BL={
  path:{name:'あぜ道',kind:'block',floor:1,lv:2,cost:1,pc:2,time:30,maker:'earth',qty:10,mat:{stone:2},attr:{earth:.25},desc:'草地のあいだを通る土の道。歩く速さ×1.25'},
  bridge:{name:'木の橋',kind:'build',lv:5,pc:2,time:40,maker:'wood',mat:{wood:4},desc:'川や池にかける木の橋。歩いてわたれる'},
  ladder_wood:{name:'オークのハシゴ',kind:'build',lv:3,pc:20,time:30,maker:'wood',mat:{wood:20},desc:'段差のがけに立てかけるハシゴ。上り下りの速さ×0.5'},
  ladder_bamboo:{name:'竹のハシゴ',kind:'build',lv:3,w:1,pc:20,time:30,maker:'wood',mat:{bamboo:20},desc:'段差のがけに立てかけるハシゴ。上り下りの速さ×0.5'},
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
  fence:{name:'柵',fix:2,fixm:{wood:1,funba:1},kind:'block',cost:2,pc:4,time:60,maker:'wood',qty:10,solid:1,hp:20,hpS:23,attr:{},mat:{wood:2},desc:'「コワイノ」の足止め。じょうぶさ20'},
  logfence:{name:'丸太の塀',fix:3,fixm:{wood:2},kind:'block',cost:3,pc:6,time:70,maker:'wood',qty:10,lv:6,offerOnly:1,solid:1,brk:1,hp:36,hpS:41,attr:{},mat:{wood:4},desc:'太い丸太をすきまなくならべた塀。じょうぶさ36'},
  bedge:{name:'花壇のふち',kind:'block',cost:1,pc:2,time:20,maker:'wood',qty:10,lv:8,attr:{},mat:{wood:1},desc:'花壇をかこむ、低い丸太のふち'},
  bamboofence:{name:'竹の柵',fix:3,fixm:{bamboo:3},kind:'block',cost:3,pc:7,time:75,maker:'wood',qty:10,lv:4,offerOnly:1,solid:1,brk:1,hp:32,hpS:36,attr:{},mat:{bamboo:5},desc:'竹を組んだ柵。じょうぶさ32'},
  hwall:{name:'オークの壁',fix:3,fixm:{wood:2},kind:'block',cost:2,pc:6,time:60,maker:'wood',qty:10,lv:3,solid:1,hp:30,hpS:34,attr:{},mat:{wood:3},desc:'かこってドアをつけると家になる。じょうぶさ30'},
  logwall:{name:'丸太の壁',fix:4,fixm:{wood:5},kind:'block',cost:3,pc:9,time:80,maker:'wood',qty:10,lv:7,solid:1,hp:50,hpS:57,brk:1,attr:{},mat:{wood:9},desc:'丸太を組んだ家の壁。じょうぶさ50'},
  plasterwall:{name:'しっくいの壁',fix:5,fixm:{wood:3,stone:2},kind:'block',cost:4,pc:11,time:90,maker:'earth',qty:10,lv:5,solid:1,hp:48,hpS:55,brk:1,attr:{},mat:{wood:6,stone:3},desc:'明るいしっくい仕上げの家の壁。じょうぶさ48'},
  brickwall:{name:'レンガの壁',fix:6,fixm:{stone:7},kind:'block',cost:5,pc:13,time:100,maker:'fire',qty:10,lv:6,w:1,solid:1,hp:55,hpS:63,brk:1,attr:{},mat:{stone:14},desc:'レンガを積んだ家の壁。じょうぶさ55'},
  wall:{name:'石の塀',fix:6,fixm:{stone:5},kind:'block',cost:5,pc:12,time:100,maker:'earth',qty:10,lv:8,w:1,solid:1,hp:60,hpS:68,attr:{},mat:{stone:9},desc:'石を積んだ塀。じょうぶさ60'},
  clover:{sp:9,name:'シロツメクサ',item:'シロツメクサの種',kind:'plant',cost:3,attr:{wood:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  bellf:{sp:9,name:'ききょう',item:'ききょうの種',kind:'plant',cost:3,attr:{earth:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  salvia:{sp:9,name:'サルビア',item:'サルビアの種',kind:'plant',cost:3,attr:{fire:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  lily:{sp:9,name:'ゆり',item:'ゆりの種',kind:'plant',cost:3,attr:{wind:1},desc:'まわり1マスの畑の収穫+1（重複なし）'},
  lotus:{sp:9,name:'ハス',item:'ハスの種',kind:'plant',cost:3,attr:{water:1},desc:'池にうかぶ花。まわり2マスで水浴びすると、たのしさ×1.5 / つかれ −9／1時間'},
  tree:{hp:5,brk:1,fix:1,fixm:{},name:'木',item:'木の苗',kind:'plant',cost:4,lv:3,solid:1,env:1,attr:{wood:3},desc:'まわり3マスを緑にする。まわり3マスで、たのしさ+0.4／1時間'},
  fruit:{hp:5,brk:1,fix:1,fixm:{},name:'果物の木',item:'果物の苗',kind:'plant',cost:10,lv:6,solid:1,dyn:1,env:1,attr:{wood:3,water:1},desc:'まわり3マスを緑にする。まわり3マスで、たのしさ+0.4／1時間。4日ごとに、りんごが実る。食料+2'},
/* 新しい家具（スクリプトで描く） */
  stool:{name:'木のスツール',kind:'furn',lv:1,cat:'living',f2:1,pc:1,time:60,maker:'wood',attr:{wood:1},mat:{wood:2},mat1:{bamboo:2},desc:'小さないす。食卓のとなりで食べると、パワー+0.45。住み心地+2'},
  stable:{hp:5,brk:1,fix:2,fixm:{wood:2},dw:1,name:'まるいサイドテーブル',kind:'furn',cat:'living',f2:1,lv:4,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:3},solid:1,desc:'お花とカップをのせた小さなテーブル。住み心地+4'},
  pouf:{name:'まるクッション',kind:'furn',lv:5,cat:'living',f2:1,pc:1,time:60,maker:'wind',attr:{wind:1},mat:{wood:1,kasa:3},mat1:{wood:1,chiri:3},desc:'ころんとしたクッション。食卓のとなりで食べると、パワー+1.35。住み心地+3'},
  achair:{name:'ひじかけいす',kind:'furn',lv:9,cat:'living',f2:1,pc:5,time:100,maker:'wood',attr:{wood:1},mat:{wood:10},desc:'ゆったりすわれるいす。食卓のとなりで食べると、パワー+2.25。住み心地+5'},
  ltable:{hp:5,brk:1,fix:3,fixm:{wood:3},dw:1.5,name:'ローテーブル',kind:'furn',cat:'living',f2:1,lv:5,pc:5,time:100,maker:'wood',attr:{wood:1},mat:{wood:6},solid:1,desc:'ひくいテーブル。住み心地+5'},
  rug1:{cs:1.5,sz:[2,2],dw:1.25,name:'ひしがたラグ',kind:'furn',cat:'living',f2:1,lv:6,pc:3,time:80,maker:'wind',attr:{wind:1},mat:{wood:5},desc:'床にしくラグ。住み心地+5',anim:1},
  sofa1:{hp:5,brk:1,fix:5,fixm:{wood:10},dw:2.5,offerOnly:1,name:'ひとりがけソファ',kind:'furn',cat:'living',f2:1,lv:6,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'しずみこむソファ。住み心地+6'},
  hoshirug:{cs:1.5,sz:[2,2],dw:1.25,name:'ほしぞらのラグ',kind:'furn',cat:'living',f2:1,lv:1,pc:3,time:80,maker:'wind',attr:{wind:1},mat:{wood:5},kwr:1,desc:'夜空の色のラグ。住み心地+5',anim:1},/* コワイノのレシピ */
  rug2:{offerOnly:1,cs:1.5,sz:[2,2],dw:1.75,name:'くもラグ',kind:'furn',cat:'living',f2:1,lv:7,pc:5,time:100,maker:'wind',attr:{wind:1},mat:{wood:15},desc:'くもの形のラグ。住み心地+6',anim:1},
  tub:{hp:5,brk:1,fix:2,fixm:{wood:1,funba:1},name:'水おけ',kind:'furn',cat:'cook',f2:1,lv:3,pc:3,time:80,maker:'water',attr:{water:1},mat:{wood:3},solid:1,desc:'かまどのまわり3マスにあると、料理の時間-10%。住み心地+3'},
  sink:{hp:5,brk:1,fix:4,fixm:{stone:3},name:'流し台',kind:'furn',cat:'cook',f2:1,lv:4,pc:7,time:120,maker:'water',attr:{water:1},mat:{stone:5},solid:1,desc:'かまどのまわり3マスにあると、料理の時間-10%。住み心地+4'},
  niguruma:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'にぐるま',kind:'furn',cat:'other',f2:1,sz:[2,1],pc:4,time:90,maker:'wood',attr:{wood:1},mat:{wood:10},solid:1,desc:'荷物をはこぶ車。まわり3マスの箱に、しまう速さ+20%（重複なし）'},
  kabedougu:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'どうぐたて',kind:'furn',cat:'other',f2:1,pc:3,time:70,maker:'wood',attr:{wood:1},mat:{wood:6,stone:2},solid:1,desc:'おのとくわを立てておく道具たて。住み心地+3'},
  kabebukuro:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'かべかけのふくろ',kind:'furn',cat:'other',f2:1,pc:3,time:70,maker:'earth',attr:{earth:1},mat:{funba:5,wood:2},solid:1,desc:'壁にかけるふくろ。食料を20までしまえる。住み心地+3'},
  taru:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'たる',kind:'furn',cat:'other',f2:1,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:8},solid:1,desc:'食料を30までしまえる。住み心地+3'},
  asabukuro:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'あさぶくろ',kind:'furn',cat:'other',f2:1,pc:3,time:70,maker:'earth',attr:{earth:1},mat:{funba:6,wood:2},solid:1,desc:'素材を30までしまえる。住み心地+3'},
  makidana:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'まき棚',kind:'furn',cat:'other',f2:1,pc:4,time:90,maker:'wood',attr:{wood:1},mat:{wood:10},solid:1,desc:'素材を30までしまえる。住み心地+3'},
  crate:{hp:5,brk:1,fix:2,fixm:{wood:4},name:'木箱',kind:'furn',cat:'other',f2:1,lv:2,pc:3,time:80,maker:'earth',attr:{earth:1},mat:{wood:8},solid:1,desc:'食料を30・素材を30までしまえる。住み心地+6'},
  monstera:{hp:5,brk:1,fix:2,fixm:{funba:3,stone:2},name:'かんようしょくぶつ',kind:'furn',cat:'other',f2:1,lv:4,pc:4,time:80,maker:'wood',attr:{wood:1},mat:{shina:5,stone:3},mat1:{kuru:5,stone:3},solid:1,desc:'大きな葉の鉢植え。住み心地+10'},
  shelf1:{hp:5,brk:1,fix:5,fixm:{wood:10},name:'本棚',kind:'furn',cat:'other',f2:1,lv:6,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'本と植物の棚。住み心地+12。木材・石材を合わせて50までしまえる'},
  wreath:{hp:5,brk:1,fix:2,fixm:{eda:3,funba:3},offerOnly:1,name:'リース',kind:'furn',cat:'other',f2:1,lv:6,pc:4,time:80,maker:'wood',attr:{wood:1},mat:{eda:6,shina:6},mat1:{eda:6,kuru:6},solid:1,desc:'葉と花のリース。住み心地+10'},
  curtain1:{hp:5,brk:1,fix:3,fixm:{wood:8},name:'カーテン',kind:'furn',cat:'other',f2:1,lv:10,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:10,kasa:5},mat1:{wood:10,chiri:5},solid:1,desc:'窓にかけるカーテン。やわらかい光が入る。住み心地+10'},
  cabinet:{hp:5,brk:1,fix:5,fixm:{wood:10},offerOnly:1,name:'キャビネット',kind:'furn',cat:'other',f2:1,lv:7,pc:9,time:120,maker:'earth',attr:{earth:1},mat:{wood:20},solid:1,desc:'とびらつきの棚。住み心地+12。食料を30までしまえる'},
  paint2:{hp:5,brk:1,fix:3,fixm:{wood:8},name:'葉っぱの額',kind:'furn',cat:'other',f2:1,lv:7,pc:5,time:80,maker:'wood',attr:{wood:1},mat:{wood:15},solid:1,desc:'葉っぱの絵。住み心地+10'},
  shelf2:{hp:5,brk:1,fix:6,fixm:{wood:15,stone:4},offerOnly:1,name:'かざり棚',kind:'furn',cat:'other',f2:1,lv:8,pc:11,time:140,maker:'wood',attr:{wood:1},mat:{wood:30,stone:8},solid:1,desc:'小物をかざる棚。住み心地+13。木材・石材を合わせて50までしまえる'},
  curtain2:{hp:5,brk:1,fix:3,fixm:{wood:13},offerOnly:1,name:'カーテン（緑）',kind:'furn',cat:'other',f2:1,lv:8,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:25},solid:1,desc:'森の色のカーテン。住み心地+10'},
  paint3:{hp:5,brk:1,fix:3,fixm:{wood:13},offerOnly:1,name:'花の額',kind:'furn',cat:'other',f2:1,lv:8,pc:5,time:80,maker:'wind',attr:{wind:1},mat:{wood:25},solid:1,desc:'花の絵。住み心地+10'},
  wshelf:{hp:5,brk:1,fix:4,fixm:{wood:10},name:'かべ棚',kind:'furn',cat:'other',f2:1,lv:8,pc:7,time:100,maker:'wood',attr:{wood:1},mat:{wood:20},solid:1,desc:'つる草をたらした棚。住み心地+12。木材・石材を合わせて50までしまえる'},
  paint1:{hp:5,brk:1,fix:5,fixm:{wood:15},offerOnly:1,name:'風景画',kind:'furn',cat:'other',f2:1,lv:9,pc:9,time:120,maker:'water',attr:{water:1},mat:{wood:30},solid:1,desc:'草原の絵。住み心地+14'},
  bathtub:{hp:5,brk:1,fix:8,fixm:{wood:8,stone:15},offerOnly:1,name:'バスタブ',kind:'furn',cat:'other',f2:1,lv:9,pc:15,time:180,maker:'water',attr:{water:1},mat:{wood:15,stone:30},solid:1,desc:'家でもお風呂。水べでなくても、夕方ここで水浴びできる。住み心地+16'},
  candle:{hp:5,brk:1,fix:1,fixm:{wood:1},offerOnly:1,name:'ろうそく',kind:'furn',cat:'light',f2:1,lv:5,pc:1,time:60,maker:'fire',attr:{fire:1},mat:{wood:2},solid:1,desc:'あかり。住み心地+3'},
  lantern:{hp:5,brk:1,fix:2,fixm:{wood:1,can:1},name:'ランタン',kind:'furn',cat:'light',f2:1,lv:6,pc:3,time:80,maker:'fire',attr:{fire:1},mat:{wood:2,can:2},solid:1,desc:'あかり。住み心地+5'},
  flamp:{hp:5,brk:1,fix:4,fixm:{wood:2,stone:1},offerOnly:1,name:'フロアランプ',kind:'furn',cat:'light',f2:1,lv:6,pc:7,time:100,maker:'fire',attr:{fire:1},mat:{wood:3,stone:2},solid:1,desc:'あかり。住み心地+6'},
  mimamori:{name:'みまもりのぬいぐるみ',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'家の中に置くと、その家で寝た子の、つかれのとれる速さ1.1倍。住み心地+6'},/* ここから、コワイノの落とし物だけで手に入る家具（絵はあとで） */
  yomawari:{name:'よまわりのランタン',kind:'furn',cat:'light',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'まわり3.5マスを照らす。住み心地+6'},
  oyasumi:{name:'おやすみのベル',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'ドアのとなりにかざるベル。住み心地+8'},
  yonaka:{name:'よなかのうたの絵',kind:'furn',cat:'other',f2:1,dropOnly:1,pc:0,solid:1,attr:{},desc:'夜の歌の絵。住み心地+10'},
  toro:{hp:5,brk:1,fix:3,fixm:{stone:3},name:'しずけさの石どうろう',kind:'furn',cat:'light',f2:1,lv:1,pc:5,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{stone:8},sand:3,desc:'まわり3.5マスを照らす。照らした中のコワイノは、攻撃と移動の速さ0.75倍。住み心地+6'},/* やすらぎの砂で作る */
  signpost:{hp:5,brk:1,fix:1,fixm:{wood:5},name:'道しるべ',kind:'furn',cat:'env',f2:1,lv:5,pc:1,time:60,maker:'earth',attr:{earth:1},mat:{wood:9},solid:1,desc:'まわり3マスで、せいれいがにげる速さ×1.4'},
  hedge:{hp:5,brk:1,fix:2,fixm:{funba:3},name:'生垣',kind:'furn',cat:'env',f2:1,lv:5,pc:3,time:80,maker:'wood',attr:{wood:1},mat:{wood:2,funba:5},solid:1,env:2,er:2,desc:'まわり2マスで、たのしさ+0.7／1時間'},
  birdbath:{hp:5,brk:1,fix:3,fixm:{stone:8},offerOnly:1,name:'水飲み鳥',kind:'furn',cat:'env',f2:1,lv:7,pc:5,time:100,maker:'water',attr:{water:1},mat:{stone:15},solid:1,env:3,desc:'まわり3マスで、たのしさ+1.1／1時間'},
  noren:{hp:5,brk:1,fix:3,fixm:{wood:4,funba:2},name:'のれん',anim:1,dsc:2,kind:'furn',cat:'env',f2:1,lv:5,pc:7,time:100,maker:'fire',attr:{fire:1},mat:{wood:8,funba:4},solid:1,env:7,er:1,desc:'温泉の入り口にかける布。まわり1マスで、たのしさ+2.5／1時間'},
  parasol:{hp:5,brk:1,fix:4,fixm:{wood:4,funba:2},name:'パラソル',anim:1,dsc:2,kind:'furn',cat:'env',f2:1,lv:5,pc:7,time:100,maker:'wind',attr:{wind:1},mat:{wood:8,funba:4},solid:1,env:7,er:1,desc:'まわり1マスで、たのしさ+2.5／1時間（重複なし）'},
  gazebo:{name:'ガゼボ',sz:[2,2],kind:'furn',cat:'env',lv:5,pc:8,time:120,maker:'wood',attr:{wood:2,wind:1},mat:{wood:18,stone:4},desc:'屋根のある休み場所。下に、いす・テーブル・ベンチ・ラグ・花を置ける'},
  azumaya:{name:'東屋',sz:[2,2],kind:'furn',cat:'env',lv:5,pc:8,time:120,maker:'earth',attr:{earth:2,fire:1},mat:{wood:18,stone:6},desc:'屋根のある休み場所。下に、いす・テーブル・ベンチ・ラグ・花を置ける'},
  arch:{offerOnly:1,anim:1,dsc:1.8,name:'ガーデンアーチ',kind:'furn',cat:'env',f2:1,lv:8,pc:9,time:120,maker:'wood',attr:{wood:1},mat:{wood:30},env:4,desc:'まわり3マスで、たのしさ+1.4／1時間'},
  slide:{name:'すべり台',sz:[2,2],kind:'furn',cat:'toy',f2:1,lv:2,pc:9,time:140,maker:'wind',attr:{wind:1},mat:{wood:8,stone:3},play:{pt:3,pw:1.35,fun:35,dur:40,cap:1,adj:1},solid:1,desc:'1人で遊べる。たのしさ +35（40分）。遊ぶと10%の確率で、移動速度+1'},
  sandbox:{name:'砂場',sz:[2,1],nosc:1,kind:'furn',cat:'toy',f2:1,lv:5,pc:9,time:140,maker:'earth',attr:{earth:1},mat:{wood:11,stone:11},play:{pt:3,pw:1.35,fun:30,dur:45,cap:2,adj:1},solid:1,desc:'2人まで遊べる。たのしさ +30（45分）。遊ぶと10%の確率で、スタミナ+1'},
  seesaw:{hp:5,brk:1,fix:6,fixm:{wood:13},name:'シーソー',kind:'furn',cat:'toy',f2:1,anim:1,dsc:2,lv:7,pc:11,time:160,maker:'wind',attr:{wind:1},mat:{wood:25},play:{pt:4,pw:1.8,fun:40,dur:40,cap:2,adj:1},solid:1,desc:'2人で遊べる。たのしさ +40（40分）。遊ぶと10%の確率で、作業スピード+1'},
  window:{name:'窓',kind:'block',cat:'other',lv:4,pc:3,time:50,maker:'wood',attr:{wood:1},mat:{wood:2},desc:'家の壁にはめる窓。住み心地+5'},
  sdoor:{name:'石の塀のドア',fix:4,fixm:{stone:3},kind:'block',anim:1,hp:40,hpS:45,cost:4,pc:8,time:60,maker:'earth',qty:1,lv:8,w:1,attr:{},mat:{stone:6},desc:'石の塀の出入り口。せいれいだけ通れる。じょうぶさ40'},
  table:{hp:5,brk:1,fix:4,fixm:{wood:4},name:'食卓',kind:'furn',pc:7,time:90,maker:'wood',solid:1,eat:{cap:2,pt:2,pw:.9},attr:{wood:2},mat:{wood:8},desc:'2人まで食べられる。食べるたびにパワー+0.9。住み心地+8'},
  stor:{hp:5,brk:1,fix:2,fixm:{wood:3},name:'食料箱',kind:'furn',pc:3,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{wood:5},desc:'食料を30までしまえる。ここから食べる。住み心地+3'},
  mbox:{hp:5,brk:1,fix:2,fixm:{wood:2,stone:2},name:'素材箱',kind:'furn',pc:3,time:120,maker:'earth',solid:1,attr:{earth:1},mat:{wood:3,stone:3},desc:'木材・石材を50までしまえる。住み心地+3'},
  lumber:{hp:5,brk:1,fix:8,fixm:{wood:13,stone:4},name:'伐採場',kind:'build',mat:{wood:25,stone:8},pc:15,time:120,maker:'wood',lv:5,solid:1,attr:{wood:2},desc:'せいれいがここで働くと、20分ごとに木材+1'},
  quarry:{hp:5,brk:1,fix:10,fixm:{wood:8,stone:13},name:'採石場',kind:'build',mat:{wood:15,stone:25},pc:20,time:140,maker:'earth',lv:7,solid:1,attr:{earth:2},desc:'せいれいがここで働くと、20分ごとに石材+1'},
  oven:{hp:5,brk:1,fix:3,fixm:{wood:2,stone:4},name:'かまど',kind:'furn',anim:1,pc:5,time:160,maker:'fire',solid:1,attr:{fire:2,earth:1},mat:{wood:3,stone:8},desc:'せいれいが材料から料理を作る。住み心地+6'},
  grave:{name:'お墓',kind:'deco',attr:{},desc:''},
  gate:{name:'柵のドア',fix:2,fixm:{wood:1,funba:1},kind:'block',anim:1,hp:13,hpS:14,cost:2,pc:4,time:40,maker:'wood',qty:1,lv:2,attr:{},mat:{wood:2},desc:'柵の出入り口。せいれいだけ通れる。じょうぶさ13'},
  archedgate:{name:'アーチ門',fix:4,fixm:{wood:3},kind:'block',anim:1,brk:1,hp:22,hpS:25,cost:4,pc:8,time:70,maker:'wood',qty:1,lv:7,attr:{},mat:{wood:4,shina:3},mat1:{wood:4,kuru:3},desc:'かざりのついた柵の出入り口。じょうぶさ22'},
  logdoor:{name:'丸太の塀のドア',fix:3,fixm:{wood:2},kind:'block',anim:1,brk:1,hp:28,hpS:32,cost:3,pc:6,time:60,maker:'wood',qty:1,lv:6,attr:{},mat:{wood:5},desc:'丸太の塀の出入り口。じょうぶさ28'},
  loggate:{sz:[2,1],name:'丸太の大門',fix:4,fixm:{wood:3},kind:'block',anim:1,brk:1,hp:32,hpS:36,cost:4,pc:12,time:90,maker:'wood',qty:1,lv:9,attr:{},mat:{wood:10},desc:'丸太の塀の大きな出入り口。じょうぶさ32'},
  stonegate:{sz:[2,1],name:'石の大門',fix:5,fixm:{stone:3},kind:'block',anim:1,brk:1,hp:45,hpS:51,cost:5,pc:10,time:90,maker:'earth',qty:1,lv:10,w:1,attr:{},mat:{stone:10},desc:'石柱で支える大きな柵の出入り口。じょうぶさ45'},
  yozoradoor:{name:'よぞらのドア',fix:2,fixm:{wood:1},kind:'block',anim:1,hp:20,hpS:23,cost:2,pc:5,time:40,maker:'wood',qty:1,lv:1,attr:{},mat:{wood:3},kwr:1,desc:'窓のついたダークチェリーのドア。じょうぶさ20'},/* コワイノのレシピ */
  door:{name:'ドア',fix:2,fixm:{wood:1},kind:'block',anim:1,hp:20,hpS:23,cost:2,pc:5,time:40,maker:'wood',qty:1,lv:3,attr:{},mat:{wood:2},desc:'壁にはめる出入り口。じょうぶさ20'},
  chair:{name:'いす',kind:'furn',lv:3,pc:3,time:60,maker:'wood',attr:{wood:1},mat:{wood:3},mat1:{bamboo:3},desc:'食卓のとなりで食べると、パワー+0.9。住み心地+4'},
  takebench:{name:'竹のベンチ',sz:[2,1],kind:'furn',lv:3,pc:3,time:100,maker:'wood',attr:{wood:1},mat:{bamboo:6},desc:'2人すわれる。昼につかれたら、ここで休む。つかれ −20／1時間。住み心地+5'},
  andon:{hp:5,brk:1,fix:2,fixm:{wood:1},name:'行燈',kind:'furn',cat:'light',lv:7,w:1,pc:6,time:80,maker:'fire',solid:1,anim:1,attr:{fire:1},mat:{wood:3,kasa:2},mat1:{wood:3,chiri:2},desc:'紙をはった木のあかり。まわり3.5マスを照らす。住み心地+5'},
  takeakari:{hp:5,brk:1,fix:2,fixm:{bamboo:2},name:'竹あかり',kind:'furn',cat:'light',lv:4,pc:4,time:90,maker:'fire',solid:1,anim:1,attr:{fire:1,wood:1},mat:{bamboo:4},desc:'まわり3.5マスを照らす。住み心地+5'},
  shishiodoshi:{hp:5,brk:1,fix:2,fixm:{bamboo:2,stone:1},name:'ししおどし',kind:'furn',cat:'env',lv:5,pc:6,time:110,maker:'water',solid:1,anim:1,attr:{water:1,wood:1},mat:{bamboo:5,stone:3},desc:'水でうごく竹のかざり。住み心地+6'},
  bench:{name:'ベンチ',sz:[2,1],kind:'furn',pc:3,time:100,maker:'wood',attr:{wood:1},mat:{wood:5},desc:'2人すわれる。昼につかれたら、ここで休む。つかれ −20／1時間。住み心地+5'},
  bed:{name:'ベッド',kind:'furn',pc:10,time:200,maker:'wood',sleep:{cap:1,pt:5,rate:.2},attr:{wood:2},mat:{wood:6,kasa:4},mat1:{wood:6,chiri:4},desc:'1人眠れる。つかれ −12／1時間'},
  yorubed:{name:'よぞらのベッド',kind:'furn',pc:10,time:200,maker:'wood',sleep:{cap:1,pt:5,rate:.2},attr:{wood:2},mat:{wood:8},kwr:1,desc:'夜空の色のふとんのベッド。1人眠れる。つかれ −12／1時間'},/* コワイノのレシピ（落とし物でまれに手に入る）。ふつうのベッドと同じはたらき */
  yozorawall:{name:'よぞらの壁',fix:5,fixm:{wood:3,stone:2},kind:'block',cost:4,pc:11,time:90,maker:'earth',qty:10,lv:1,solid:1,hp:48,hpS:55,brk:1,attr:{},mat:{wood:6,stone:3},kwr:1,desc:'夜空の色の家の壁。じょうぶさ48'},
  lamp:{hp:5,brk:1,fix:3,fixm:{eda:2,stone:2},name:'かがり火',kind:'furn',pc:5,time:160,maker:'fire',solid:1,anim:1,attr:{fire:3},mat:{eda:3,stone:3},desc:'まわり3.5マスを照らす。住み心地+6'},
  campfire:{hp:5,brk:1,fix:4,fixm:{wood:2,eda:4,stone:4},name:'たき火',kind:'furn',pc:7,time:160,maker:'fire',lv:6,solid:1,anim:1,attr:{fire:4},play:{pt:3,pw:1.35,fun:25,dur:40,cap:3,adj:1},mat:{wood:3,eda:8,stone:8},desc:'3人まで遊べる。たのしさ +25（40分）。まわり3.5マスを照らす'},
  swing:{name:'ブランコ',sz:[2,1],kind:'furn',pc:9,time:160,maker:'wood',lv:4,play:{pt:4,pw:1.8,fun:40,dur:50,cap:1},attr:{wind:3},mat:{wood:12},mat1:{bamboo:8,wood:4},desc:'1人で遊べる。たのしさ +40（50分）。遊ぶと10%の確率で、移動速度+1'},
  torch:{hp:5,brk:1,fix:1,fixm:{eda:2},name:'たいまつ',kind:'furn',lv:3,pc:1,time:100,maker:'fire',solid:1,anim:1,attr:{fire:2},mat:{eda:3},mat1:{bamboo:3},desc:'まわり3.5マスを照らす。住み心地+4'},
  jar:{hp:5,brk:1,fix:2,fixm:{stone:3},name:'みずがめ',kind:'furn',lv:3,pc:3,time:120,maker:'water',solid:1,attr:{water:3},mat:{stone:5},desc:'水をためたかめ。まわり1マスの畑は水やりなしで育つ。住み心地+5'},
  basin:{hp:5,brk:1,fix:4,fixm:{stone:3},name:'水鉢',kind:'furn',pc:7,time:160,maker:'water',solid:1,anim:1,attr:{water:4,wood:.5},mat:{stone:5},desc:''},/* もう作れない（古いセーブ用） */
  kamizo:{hp:5,brk:1,fix:5,fixm:{stone:13},name:'カミサマの像',kind:'furn',lv:5,pc:10,time:160,maker:'earth',solid:1,attr:{earth:2},mat:{stone:25},desc:'カミサマが遊びにくる確率50%'},
  chochin:{name:'おまつりのちょうちん',kind:'furn',shopOnly:1,pc:6,solid:1,attr:{},desc:'おまつりのおみやげ。赤いちょうちん。住み心地+6'},
  furin:{name:'ふうりん',kind:'furn',shopOnly:1,pc:8,solid:1,anim:1,attr:{},desc:'カミサマのかざり。風がふくと、ちりんと鳴る。住み心地+8'},
  ema:{name:'えまかけ',kind:'furn',shopOnly:1,pc:8,solid:1,attr:{},desc:'カミサマのかざり。ねがいごとを書いた板をかける。住み心地+8'},
  komainu:{name:'こまいぬ',kind:'furn',shopOnly:1,pc:10,solid:1,attr:{},desc:'カミサマのかざり。神殿をまもる石の犬。住み心地+10'},
  kadomatsu:{name:'かどまつ',kind:'furn',shopOnly:1,pc:10,solid:1,attr:{},desc:'カミサマのかざり。竹と松のおめでたいかざり。住み心地+10'},
  rockart:{hp:5,brk:1,fix:1,fixm:{stone:3},name:'つぼ',kind:'furn',lv:2,pc:1,time:100,maker:'earth',solid:1,attr:{earth:2},mat:{stone:5},desc:'土でできたかざり。住み心地+5'},
  vane:{hp:5,brk:1,fix:4,fixm:{wood:2,stone:2},offerOnly:1,name:'風見鶏',kind:'furn',pc:7,time:160,maker:'wind',solid:1,anim:1,attr:{wind:4},mat:{wood:3,stone:3},desc:'風の向きをおしえる。まわり3マスのせいれいは移動速度×1.2（重複なし）。住み心地+4'},
  arrow:{name:'木の矢',kind:'ammo',pc:1,time:40,maker:'wood',qty:10,mat:{wood:1,stone:1},desc:'見張り台が放つ矢。1発で1本使う'},
  spike:{name:'とげの罠',fix:1,fixm:{wood:1,stone:1},kind:'furn',lv:1,pc:1,time:100,maker:'wood',qty:2,trap:1,attr:{earth:.5},mat:{wood:2,stone:2},desc:'上にいる「コワイノ」に、15分ごとに0.5ダメージ',anim:1},
  sticky:{name:'ねばねば草',fix:1,fixm:{funba:1},kind:'furn',lv:2,pc:1,time:80,maker:'wood',qty:2,trap:1,attr:{wood:.5},mat:{funba:2,kinoko:1},desc:'上にいる「コワイノ」の速さが35%になる',anim:1},
  puddle:{name:'すべる水たまり',fix:1,fixm:{stone:1},kind:'furn',lv:4,pc:1,time:80,maker:'water',qty:2,trap:1,anim:1,attr:{water:.5},mat:{stone:2},desc:'ふんだ「コワイノ」が8分止まる。つぎに使えるまで2時間',anim:1},
  firetrap:{name:'ほのおの罠',fix:2,fixm:{wood:1,stone:1},kind:'furn',pc:3,time:120,maker:'fire',lv:4,qty:2,trap:1,anim:1,attr:{fire:.5},mat:{wood:1,can:2},desc:'ふんだ「コワイノ」に4ダメージ。つぎに使えるまで3時間',anim:1},
  gust:{name:'つむじ風の罠',fix:2,fixm:{eda:1},kind:'furn',pc:3,time:120,maker:'wind',lv:5,qty:2,trap:1,anim:1,attr:{wind:.5},mat:{eda:2},desc:'ふんだ「コワイノ」を6マスふきとばし、2分止める。つぎに使えるまで2時間30分',anim:1},
  dig:{name:'けずる',kind:'build',pc:10,time:40,maker:'earth',attr:{},desc:'高いマスを1だん低くする工事。パワー10'},
  mound:{name:'もる',kind:'build',pc:10,time:40,maker:'earth',attr:{},desc:'低いマスを1だん高くする工事。パワー10'},
  watch:{name:'見張り台',fix:10,fixm:{wood:10,stone:10},kind:'build',sz:[2,2],mat:{wood:25,stone:20},pc:20,time:150,maker:'earth',lv:2,solid:1,attr:{fire:2,earth:2},desc:'「コワイノ」に木の矢を放つ。ダメージ1／10分ごと／範囲6マス'},
  yogan:{name:'ようがん台',fix:10,fixm:{stone:15},kind:'build',sz:[2,2],mat:{wood:5,stone:40},pc:20,time:150,maker:'fire',lv:1,solid:1,attr:{fire:3},desc:'火山のふもとの守り。「コワイノ」に火の玉を飛ばす。ダメージ1（まわり0.5）／8分ごと／範囲5マス'},
  well:{hp:5,brk:1,fix:10,fixm:{wood:4,stone:15},name:'井戸',kind:'build',mat:{wood:8,stone:30},pc:20,time:140,maker:'water',lv:6,solid:1,attr:{water:4},desc:'まわり3マスの畑は水やりなしで育つ'},
  windmill:{hp:5,brk:1,fix:13,fixm:{wood:30,stone:18},name:'風車',kind:'build',mat:{wood:60,stone:35},pc:25,time:160,maker:'wind',lv:8,solid:1,anim:1,attr:{wind:5},desc:'まわり5マスの畑の収穫+1'},
  bell:{name:'村の鐘',sz:[2,2],kind:'build',mat:{wood:60,stone:60},pc:120,time:240,maker:'earth',lv:12,solid:1,attr:{},desc:'朝、村のせいれいのたのしさ+5（重複なし）'},
  onsen:{name:'露天ぶろ',sz:[2,2],kind:'build',mat:{stone:40},pc:60,time:200,maker:'earth',lv:9,w:1,solid:1,attr:{},desc:'岩でかこんだ温泉。入ると、つかれ−30・たのしさ+10'},
  signw:{name:'村の木の看板',sz:[2,1],kind:'build',mat:{wood:30},pc:80,time:160,maker:'wood',lv:11,solid:1,attr:{},desc:'村の入り口の看板。属性の力+10%（重複なし）'},
  signs:{name:'村の石の看板',sz:[2,1],kind:'build',mat:{stone:30},pc:80,time:160,maker:'earth',lv:11,w:1,solid:1,attr:{},desc:'村の入り口の看板。属性の力+10%（重複なし）'},
  shinboku:{name:'ご神木',sz:[2,2],kind:'build',mat:{wood:40},pc:160,time:300,maker:'wood',lv:14,solid:1,attr:{wood:3},desc:'村の守りの大きな木。まわり3マスで、つかれのとれる速さ+10%'},
  lighthouse:{name:'灯台',sz:[2,2],kind:'build',mat:{wood:25,stone:35},pc:35,time:180,maker:'fire',lv:7,solid:1,anim:1,attr:{fire:4},desc:'まわり8マスを照らす'},
  stele:{hp:5,brk:1,fix:18,fixm:{wood:6,stone:25},name:'石碑',kind:'build',mat:{wood:12,stone:50},pc:35,time:180,maker:'earth',lv:6,solid:1,attr:{earth:4},desc:'まわり5マスの壁が、1.15倍じょうぶになる'},
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

  'seed:mugi':{name:'こむぎのたね',kind:'seed',desc:'2日で育つ。食料+1。パンの材料'},'seed:tomato':{name:'キャベツのたね',kind:'seed',desc:'2日で育つ。食料+1'},'seed:imo':{name:'いものたね',kind:'seed',desc:'3日で育つ。食料+2'}
};
const BLOCKS=['path','gravel','woodpath','stone','brick','floor','brickfloor','stonefloor','herrfloor','carpet','farm','fence','bedge','gate','archedgate','stonegate','logdoor','loggate','hwall','logwall','plasterwall','brickwall','yozorawall','door','yozoradoor','wall','sdoor','window'];const GATE_IDS=new Set(['gate','archedgate','stonegate','logdoor','loggate']),FENCE_IDS=new Set(['fence','logfence','bamboofence','gate','archedgate','stonegate','logdoor','loggate']),HOME_WALLS=new Set(['hwall','logwall','plasterwall','brickwall','yozorawall','wall']),HOME_DOORS=new Set(['door','yozoradoor','sdoor']);
const PLANTS=['clover','bellf','salvia','lily','lotus','tree','fruit'],FLOWERS=new Set(['clover','bellf','salvia','lily','lotus']),ATTRFL=new Set(['clover','bellf','salvia','lily','lotus']),plantOK=id=>!ATTRFL.has(id)||!!S.unlocked[id]/* 属性の花はクエストで解放 */,isBud=j=>!!(S&&S.bud&&S.bud[j]>dayNo())/* 植えた日の次の朝まで、花と木は芽 */,flowerN=()=>S.obj.reduce((a,o,j)=>a+(FLOWERS.has(o)&&!isBud(j)?1:0),0),BREQ={windmill:'wind',fountain:'water',well:'water',lighthouse:'fire',stele:'earth'}/* 属性の子がいないと建てられない */;
const bloomCount=id=>S.obj.reduce((n,o,j)=>n+(o===id&&!isBud(j)?1:0),0);
const FLOWER_QUESTS=new Set(['salvia3','lotus3','lily5','clover3']);
const BEDSET=new Set(['bed','yorubed']);/* ねむれるベッド（よぞらのベッドも同じはたらき） */const KWR=['yozorawall','yozoradoor','yorubed','hoshirug','herrfloor'];const KWRKEY='hakoniwa-kwr-v1';/* コワイノのレシピは、どのステージでもおぼえたまま（ステージべつのセーブとはべつにしまう） */
function kwrSync(){if(!S)return;let g=[];try{g=JSON.parse(KV.getItem(KWRKEY)||'[]')}catch(e){}const G=new Set(g.filter(id=>KWR.includes(id)));for(const id of KWR)if((S.recipes||{})[id])G.add(id);for(const id of G){(S.recipes||(S.recipes={}))[id]=true;if(BL[id].kind==='block')(S.unlocked||(S.unlocked={}))[id]=true}try{KV.setItem(KWRKEY,JSON.stringify([...G]))}catch(e){}}/* コワイノのレシピ：落とし物でまれに手に入る */
const STAGEONLY={signw:0,signs:1,logfence:0,logdoor:0,loggate:0,gazebo:0,bamboofence:1,takebench:1,takeakari:1,shishiodoshi:1,azumaya:1};/* そのステージで作れる物（草原0・火山1）。おぼえたら、どのステージでも作れる */
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
const CRAFTB=['floor','brickfloor','stonefloor','herrfloor','carpet','path','gravel','woodpath','stone','brick','hwall','logwall','plasterwall','brickwall','yozorawall','door','yozoradoor','fence','bedge','logfence','bamboofence','gate','archedgate','stonegate','logdoor','loggate','wall','sdoor','window','yozorawin'];
const CRAFT_TABS=[["家具", ["table", "chair", "stool", "stable", "pouf", "achair", "ltable", "rug1", "rug2", "hoshirug", "bed", "yorubed", "sofa1", "monstera", "wreath", "curtain1", "curtain2", "paint1", "paint2", "paint3", "bathtub"]], ["収納", ["stor", "mbox", "crate", "taru", "asabukuro", "makidana", "niguruma", "kabebukuro", "kabedougu", "shelf1", "wshelf", "cabinet", "shelf2"]], ["遊び", ["swing", "slide", "sandbox", "seesaw", "campfire"]], ["庭", ["bench", "takebench", "shishiodoshi", "hedge", "birdbath", "parasol", "noren", "arch", "kamizo", "jar", "rockart", "signpost", "vane"]], ["あかり", ["torch", "takeakari", "andon", "candle", "lantern", "flamp", "toro"]], ["ごはん", ["oven", "tub", "sink"]], ["ワナ", ["arrow", "spike", "puddle"]], ["家づくり", ["floor", "brickfloor", "stonefloor", "herrfloor", "carpet", "hwall", "logwall", "plasterwall", "brickwall", "yozorawall", "door", "yozoradoor", "window"]], ["道・囲い", ["path", "gravel", "woodpath", "stone", "brick", "fence", "logfence", "bamboofence", "bedge", "gate", "archedgate", "stonegate", "logdoor", "loggate", "wall", "sdoor"]]];let craftTab=0;
const craftTabFor=id=>CRAFT_TABS.findIndex(([,ids])=>ids.includes(id));
const GIFTF=['furin','ema','kadomatsu','komainu','chochin','mimamori','yomawari','oyasumi','yonaka'];/* 交換・おみやげ・コワイノの落とし物でもらう家具 */
function furnitureGroups(ids){const wanted=new Set(ids);return CRAFT_TABS.map(([name,items])=>[name,items.filter(id=>wanted.has(id))]).filter(([,items])=>items.length)}
const FURN=['kabedougu','kabebukuro','niguruma','taru','asabukuro','makidana','hoshirug','yorubed','toro','table','chair','stor','mbox','oven','bed','bench','takebench','takeakari','andon','shishiodoshi','campfire','swing','torch','jar','rockart','vane','spike','puddle','stool','stable','pouf','achair','ltable','rug1','sofa1','rug2','tub','sink','crate','monstera','shelf1','wreath','curtain1','cabinet','paint2','shelf2','curtain2','paint3','wshelf','paint1','bathtub','candle','lantern','flamp','signpost','hedge','birdbath','parasol','arch','slide','sandbox','seesaw','kamizo','noren'];// 属性の罠（sticky/firetrap/gust）は次のステージから

const TERRA=new Set(['dig','mound']);/* だんさスコップの工事 */
const BUILDS=['statue','watch','bridge','ladder_wood','ladder_bamboo','slope_earth','stairs_wood','stairs_stone','stairs_brick','yogan','lumber','well','quarry','windmill','fountain','lighthouse','bell','shinboku','onsen','signw','signs','stele','tower'];
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
  {id:'statue',text:'神殿を建ててもらおう',how:"下の「おく」→「神殿」をえらび、空いた場所をタップ",check:()=>cnt('statue')>=1,by:GOD,story:[
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
    [GOD,'そこで見張り台じゃ。高いところから早めに見つけて、木の矢で追いはらえる。今回はわしのおごりじゃ。'],
    [GOD,'#alarm|とげの罠も10こ、木の矢も20本入れといたぞい。柵で遠まわりしてきた「コワイノ」の通り道に置いてみい。ふんだら、ダメージじゃ。'],
    [POKO,'柵で足止めして、罠と見張り台で追いはらうんだね！ やってみる！'],['@idea']],gives:{watchNow:true,items:{spike:10,arrow:20},flags:['watchLearned']}},
   story:[
    [GOD,'#alarm|見張り台は木の矢で「コワイノ」を追いはらうんじゃ。とげの罠は、ふんだ「コワイノ」にダメージじゃよ。'],
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
  {id:'ookage',text:'オオカゲを追いはらおう',how:"柵・見張り台・罠を整え、夜に来るオオカゲを追いはらう",check:()=>(S.bossKills||0)>=1,prog:()=>bossDays(),
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
  {id:'nushi',text:'ヌシ様をむかえよう',check:()=>!!S.cleared,prog:()=>'かけら '+Math.min(3,S.setSh||0)+'/3・じょうけん '+clearConds().filter(c=>c[1]).length+'/'+clearConds().length,how:'台座をタップすると、足りないものが見られる',
   talk:{who:POKO,when:()=>true,lines:[
    [POKO,'かけらも、あと少しだね。ヌシ様をむかえる準備、もうすぐかな。'],
    [MINA,'#think|台座にヌシ様の力があつまってくるとねぇ、影たちは、その力にひきよせられて、やってくるんだってぇ。'],
    [MINA,'ヌシ様の力は、あったかいからねぇ。……きっと、何晩も、たくさんの影がおしよせてくるよぉ。'],
    [MINA,'さいごまで守りぬいたら、3つめのかけらがあらわれるはずだよぉ。台座にはめて、ヌシ様をむかえようねぇ。'],
    [POKO,'よーし、みんなで守りぬこう！']]},
   story:null},
];
