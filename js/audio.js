'use strict';


/* ---------- おと（BGM・効果音はWeb Audioで鳴らすオリジナル） ---------- */
const SND={bgm:true,sfx:true,vib:true};try{Object.assign(SND,JSON.parse(KV.getItem('hakoniwa-sound')||'{}'))}catch(e){}
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
  /* 火山のふもと：短調で、すこしひくく、ゆったり（昼）。夜はさらにゆっくり */
  dayV:{bpm:80,lead:'triangle',chords:[[45,[57,60,64]],[41,[53,57,60]],[48,[55,60,64]],[43,[55,59,62]]],
    mel:[[69,4],[72,2],[76,2],[74,4],[72,2],[69,2],[67,4],[69,2],[72,2],[74,4],[72,4],
         [76,4],[74,2],[72,2],[69,4],[72,2],[74,2],[72,2],[69,2],[67,2],[64,2],[69,6],[0,2]]},
  nightV:{bpm:58,lead:'sine',chords:[[38,[53,57,62]],[34,[50,53,58]],[41,[53,57,60]],[36,[52,55,60]]],
    mel:[[62,4],[65,2],[69,2],[67,6],[0,2],[65,4],[62,4],[64,4],[60,4],
         [62,2],[65,2],[69,2],[74,2],[72,4],[69,4],[67,4],[65,4],[62,6],[0,2]]},
  /* ヨルノオオカゲとのたたかい：短調で、はやく、ずんずん進む */
  battle:{bpm:132,lead:'square',chords:[[45,[57,60,64]],[41,[53,57,60]],[43,[55,59,62]],[40,[56,59,64]]],
    mel:[[69,2],[72,2],[76,2],[72,2],[74,2],[72,1],[71,1],[69,4],[72,2],[74,2],[76,2],[77,2],[76,2],[74,2],[72,4],
         [76,2],[79,2],[81,2],[79,2],[77,2],[76,2],[74,4],[71,2],[72,2],[74,2],[76,2],[80,2],[76,2],[71,4]]},
};
/* ヒノオオカゲの曲：火山らしい音階（フリギア）で、少し速く。たいこと、火のはぜる音（sched の hinoS） */SONGS.hino={bpm:104,lead:'triangle',chords:[[40,[52,55,59]],[41,[53,57,60]],[40,[52,55,59]],[38,[50,53,57]]],
  mel:[[64,2],[65,2],[64,2],[62,2],[64,4],[0,2],[59,2],[64,2],[65,2],[67,2],[69,2],[67,2],[65,2],[64,4],
       [71,2],[72,2],[71,2],[69,2],[67,2],[65,2],[67,2],[69,2],[67,2],[65,2],[64,2],[62,2],[64,6],[0,2]]};
/* オオカゲがいる夜：ふだんの夜の曲を、少しだけ速く、ひくい心臓の音のようなベースをかさねる（sched の bossArr） */SONGS.nightB=Object.assign({},SONGS.night,{bpm:72});SONGS.nightVB=Object.assign({},SONGS.nightV,{bpm:64});
for(const k in SONGS){const g=SONGS[k];g.at=new Array(64).fill(null);let p=0;for(const[m,l]of g.mel){if(m)g.at[p%64]=[m,l];p+=l}}
const SAMPLES={"bell":["assets/g/cb9ff20140.mp3"],"pat":["assets/g/e2b825e14e.mp3"],"voice":["assets/g/fc5ad15d4b.mp3"],"paper":["assets/g/b7b70de2d3.mp3"],"night":["assets/g/982aef2204.mp3"],"chop":["assets/g/1d86cabda1.mp3","assets/g/676cf2fa6d.mp3","assets/g/a8dd704564.mp3"],"dig":["assets/g/56f3308409.mp3"],"splash":["assets/g/05adadaa1c.mp3"],"cast":["assets/g/93da972520.mp3"],"nail":["assets/g/b121a3b6b8.mp3"],"bush":["assets/g/3c69ed59fd.mp3"],"bubble":["assets/g/3dae9cab95.mp3"],"catch":["assets/g/269701117d.mp3"],"box":["assets/g/8c8eeb8b61.mp3"],"fire":["assets/g/e54c43d515.mp3"],"boil":["assets/g/55a7541497.mp3"],"rain":["assets/g/7178ec736f.mp3"],"birds":["assets/g/c0eec144c6.mp3"],"amb_morn":["assets/g/cecc7fdf2e.mp3"],"amb_spr":["assets/g/bb13746d18.mp3"],"amb_sum":["assets/g/48649f26f9.mp3"],"amb_snight":["assets/g/36b79a1b68.mp3"]};/* 季節・時間の環境音（amb_〜）は tools/sound/season_amb.py */const SBUF={};
Object.assign(SAMPLES,{"cv_bird":["assets/g/c8f27e82a0.mp3","assets/g/d5a88a07a1.mp3","assets/g/5dae17a6bb.mp3","assets/g/2853515b46.mp3"],"cv_risu":["assets/g/4c78fed31b.mp3","assets/g/9edc31c156.mp3"],"cv_nezumi":["assets/g/501d60a27f.mp3","assets/g/7af1d6b1ad.mp3"],"cv_usagi":["assets/g/448b608b82.mp3"],"cv_hari":["assets/g/59206ffa86.mp3"],"cv_mogura":["assets/g/3085bc7ee5.mp3"],"cv_frog":["assets/g/2e14f342ca.mp3","assets/g/672e9ac7f4.mp3"],"cv_bee":["assets/g/08dea7c333.mp3","assets/g/f6f6d54ef1.mp3"],"cv_bug":["assets/g/f55c26356a.mp3","assets/g/b62bdf400b.mp3"],"cv_tonbo":["assets/g/5a2cccf54c.mp3"],"cv_hotaru":["assets/g/f6cafbb03a.mp3","assets/g/45888ac778.mp3","assets/g/afa9f4627a.mp3"],"cv_snail":["assets/g/d33577f724.mp3"]});/* 小さな生き物の鳴き声（OpenGameArt の CC0 の録音、tools/sound/critter_voice.py） */
Object.assign(SAMPLES,{"mine":["assets/g/ba69ed4c76.mp3"]});Object.assign(SAMPLES,{"digSoil":["assets/g/f3b927e9d4.mp3"],"blkStone":["assets/g/f98e722ff3.mp3"]});/* ブロックをこわす音：ほる音の0.12秒まで・石をほる音の0.5秒まで（切っただけ） */
Object.assign(SAMPLES,{"tpuni":["assets/g/6b79a88272.mp3","assets/g/a9d3a9c033.mp3","assets/g/72120899ad.mp3","assets/g/6074b7cd9b.mp3","assets/g/552f80bbbc.mp3"],"loomk":["assets/g/bdeafe2c64.mp3","assets/g/c36dad1860.mp3","assets/g/5be427e58a.mp3"],"shutl":["assets/g/e3b3fdc4e1.mp3","assets/g/eb9922b92c.mp3","assets/g/4eee98ed5d.mp3"]});/* きのこ・はたおり（Kenney の CC0、tools/sound/ui_asmr.py） */
Object.assign(SAMPLES,{"bowdraw":["assets/g/31506abaf6.mp3"],"starkira":["assets/g/74849355af.mp3"],"tillhit":["assets/g/2e6fb1390c.mp3","assets/g/20fade0d21.mp3","assets/g/1fc0c732af.mp3","assets/g/520cad11ce.mp3","assets/g/0ba494ed23.mp3","assets/g/9382a53dbd.mp3","assets/g/82a4a0537b.mp3","assets/g/fa9349ce43.mp3"],"pourw":["assets/g/6412920a88.mp3"]});/* 持ち主の音：弓をひきしぼる・流れ星のキラッ・くわが土にささる（8回ぶん）・水やり（tools/sound/owner_sfx4.py） */
Object.assign(SAMPLES,{"slip":["assets/g/0f85595dd0.mp3"]});/* 効果音ラボ（持ち主がくれた音）：水たまりですべる「シャッ、シャッ」（2回ぶんを切った tools/sound/owner_slip.py） */
Object.assign(SAMPLES,{"ladder":["assets/g/71d1b47f0b.mp3","assets/g/5618fc1b14.mp3","assets/g/9eca791594.mp3","assets/g/868d642cab.mp3","assets/g/9d54b2f1d9.mp3","assets/g/fa8c7395f1.mp3","assets/g/2f07b68351.mp3","assets/g/2e518a1679.mp3","assets/g/9dba397d59.mp3","assets/g/c5a9516d85.mp3","assets/g/8ecd2b146d.mp3"],"cv_chou":["assets/g/97f36f451e.mp3","assets/g/e82ec64530.mp3","assets/g/b3796e511e.mp3"]});/* 持ち主の音：ハシゴの木のきしみ（きしみ1回ぶんずつ）・ちょうの羽音（tools/sound/owner_ladder_chou.py） */
Object.assign(SAMPLES,{"fgrass":["assets/g/e76e72a5bf.mp3","assets/g/f937ecdd86.mp3","assets/g/5565fac559.mp3","assets/g/5d5d8a4911.mp3","assets/g/79a17adc48.mp3","assets/g/234a6775ab.mp3","assets/g/4cb4389b5c.mp3"],"fsoil":["assets/g/36c529ba3d.mp3","assets/g/50021808b0.mp3","assets/g/376e7e0de5.mp3","assets/g/c1c7931242.mp3","assets/g/fb1d866378.mp3","assets/g/2da263eecb.mp3","assets/g/118cb5438c.mp3","assets/g/75c1292d54.mp3"],"fwood":["assets/g/08121bade6.mp3","assets/g/05b90bfcbf.mp3","assets/g/ae70c7f931.mp3","assets/g/e9157474af.mp3","assets/g/9f90000f11.mp3","assets/g/c40e30c91c.mp3","assets/g/5f7e079309.mp3"],"fstone":["assets/g/6fa35d1b01.mp3","assets/g/ba4664f469.mp3","assets/g/a0f2c1c2e6.mp3","assets/g/7667426112.mp3","assets/g/fcfd0d7ef9.mp3","assets/g/fca4b889f9.mp3","assets/g/435c9a588f.mp3"],"fcloth":["assets/g/61589ac538.mp3","assets/g/d6fd055650.mp3","assets/g/9b55ed379f.mp3"],"fsnow":["assets/g/4bd16a4daf.mp3","assets/g/5d4601b4b3.mp3","assets/g/f96dc8d284.mp3","assets/g/938e7207ab.mp3","assets/g/312ce216f6.mp3","assets/g/98abc74bf4.mp3","assets/g/7b011fac51.mp3"],"fwet":["assets/g/94bc2c34e1.mp3","assets/g/f32efb3157.mp3","assets/g/d2bfcb9225.mp3","assets/g/b1885232a2.mp3","assets/g/34e8464018.mp3","assets/g/41565c56cb.mp3"]});/* せいれいの足音：草・土・石・雪・雨の日のぬれた地面は、持ち主の録音（tools/sound/footstep_rec.py）。木の床・橋は Yuval「footsteps child parquet」（freesound、CC0。持ち主がえらんだ）。じゅうたん・ラグは Kenney の CC0（tools/sound/ui_asmr.py の fcloth） */
Object.assign(SAMPLES,{"dawn":["assets/g/fdcc2d2ca8.mp3"],"midnight":["assets/g/6d7f06402d.mp3"]});/* 朝6時・夜12時の切りかえの音（魔王魂の曲のはじめ20秒。朝はオーケストラ・夜はヒーリング。持ち主がえらんだ。tools/sound/maou_chime.py） */
Object.assign(SAMPLES,{"stream":["assets/g/9e6d59d464.mp3"]});/* 川・池のそばの音：本物の小川の録音（OpenGameArt「Park Ambiences」CC0。tools/sound/stream_loop.py で、鳥の声のない所をつなぎ目なく） */
Object.assign(SAMPLES,{"pond":["assets/g/f6217511b3.mp3"],"onsen":["assets/g/cb11690267.mp3"]});/* 池（凪いだ水面と遠くのカエル）・温泉（凪いだお湯に、かすかに流れこむ音）：OpenGameArt の CC0 の録音（tools/sound/water_amb.py。持ち主がききくらべてえらんだ） */
Object.assign(SAMPLES,{"ea_apple":["assets/g/0867936294.mp3","assets/g/2f79151ffa.mp3"],"ea_veg":["assets/g/155b1d8bef.mp3","assets/g/f5e6a75f15.mp3","assets/g/2d02cdc755.mp3","assets/g/0c00c20764.mp3"],"ea_cracker":["assets/g/0c566490ac.mp3","assets/g/0055bcbe08.mp3","assets/g/56f37dcbc5.mp3"],"ea_cookie":["assets/g/9e41accff4.mp3","assets/g/73d54dbf23.mp3","assets/g/cb12b64856.mp3"],"ea_toast":["assets/g/cd1dce9c00.mp3","assets/g/a89a50853d.mp3","assets/g/821b1c344b.mp3","assets/g/de9917efce.mp3","assets/g/69b146b2bd.mp3"],"ea_cereal":["assets/g/e4ddd16cb6.mp3","assets/g/c8c7163d6b.mp3","assets/g/4839d2b692.mp3","assets/g/ad081aa964.mp3"],"ea_nut":["assets/g/29d65ac120.mp3","assets/g/7647bdc663.mp3","assets/g/cabe3dceba.mp3","assets/g/3d1ccaddb9.mp3"],"ea_water":["assets/g/3db5d12b0d.mp3","assets/g/f289fc1b05.mp3"],"ea_tea":["assets/g/f952417de8.mp3","assets/g/6dbe724227.mp3"],"ea_soft":["assets/g/e1ee8da194.mp3","assets/g/04fc7784c9.mp3"]});
Object.assign(SAMPLES,{"dscoop":["assets/g/7567dbe225.mp3","assets/g/3df26569c5.mp3"],"dlift":["assets/g/5307efba0e.mp3","assets/g/17045852ae.mp3"]});/* 水をくむ（バケツが水に入る・ひき上げる）音：OpenGameArt の CC0 の録音（tools/sound/spirit_act.py） */
Object.assign(SAMPLES,{"moya": ["assets/g/3b48b35943.mp3", "assets/g/2d7c698059.mp3", "assets/g/57ccb5ca93.mp3"]});/* もやもや（たのしさが低いとき）：持ち主がくれた声を、尻上がりにしないで、ゆっくりの「もやん」1回ぶんずつにした（tools/sound/owner_moya.py） */
Object.assign(SAMPLES,{"cavedrip":["assets/g/c71f5bdd7f.mp3","assets/g/ea04850a8c.mp3","assets/g/dda10e0646.mp3","assets/g/83d7df255d.mp3","assets/g/945908278f.mp3","assets/g/cb53c608a7.mp3"],"caveamb":["assets/g/b2cdd41001.mp3"]});/* 洞窟のしずく・洞窟の空気の音：本物の録音（OpenGameArt「Dripping water loop」「Loopable Dungeon Ambience」CC0。tools/sound/cave_amb.py） */
Object.assign(SAMPLES,{"thunder":["assets/g/838e080f8c.mp3","assets/g/76dfb6bdbe.mp3"]});/* あらしのかみなり：本物の録音（OpenGameArt「Rain + Long Thunder」CC0。tools/sound/thunder.py） */
Object.assign(SAMPLES,{"rwget":["assets/g/5b40bc0a75.mp3"],"rwlevel":["assets/g/4766ca53d8.mp3"],"rwfirst":["assets/g/654e58828e.mp3"],"wdone":["assets/g/57c354d44f.mp3"]});/* うけとった・レベルアップとたっせい・はじめて置いた・作業台と料理の「できた」（おもちゃの鉄琴・qubodup の「Level Up」・チャイム・あわの録音、tools/sound/reward_rec.py。持ち主がえらんだ） */
Object.assign(SAMPLES,{"joyc":["assets/g/658e945ea5.mp3"],"potg":["assets/g/4b6de3da31.mp3"]});/* せいれいがよろこぶ音（カリンバのオルゴールの「ちりりん」）・なべがぐつぐつにえる音：持ち主がえらんだ CC0 の録音（tools/sound/joy_pot、credits.json） */Object.assign(SAMPLES,{"treefall":["assets/g/9d8376a84b.mp3"]});/* 木がたおれる音：持ち主がくれた音（tools/sound/owner_treefall.py） */Object.assign(SAMPLES,{"harvdone":["assets/g/6f531d4897.mp3"]});/* しゅうかくしおわった音：かれ葉がこすれる本物の録音（OpenGameArt qubodup CC0。tools/sound/harvest_done.py。持ち主がえらんだ） */
Object.assign(SAMPLES,{"goso":["assets/g/392c341186.mp3"]});/* 箱にしまう・取るあいだのゴソゴソ（持ち主がくれた音。tools/sound/gosogoso_loop.py で、つなぎ目なく1まわり1.0337秒を3つならべた形） */
Object.assign(SAMPLES,{"gravel":["assets/g/1367715265.mp3"],"wdon":["assets/g/6e3c4c3694.mp3"],"arrow": ["assets/g/4020d45f73.mp3"], "bush2": ["assets/g/0f9eb4e9b6.mp3"], "door": ["assets/g/02047b788c.mp3"], "kill": ["assets/g/c3aac5194a.mp3"], "munch": ["assets/g/83541e7fe0.mp3"], "nail2": ["assets/g/f10fe51343.mp3"], "pick": ["assets/g/443dd77412.mp3"], "place": ["assets/g/c75dd30fa4.mp3"], "punch": ["assets/g/5124e82f60.mp3"], "shoot": ["assets/g/8c1be13e0e.mp3"], "trickle": ["assets/g/017cf8add7.mp3"], "wallbreak": ["assets/g/43e010b66b.mp3"], "wave": ["assets/g/241549ec96.mp3"]});/* 効果音ラボ（ユーザー提供） */
Object.assign(SAMPLES,{"tonton":["assets/g/d659bed8d7.mp3","assets/g/b635eb8871.mp3","assets/g/5c204e10f1.mp3","assets/g/ba26bd4423.mp3"],"potclk":["assets/g/17e80015f2.mp3","assets/g/585623a7e1.mp3","assets/g/64ea90268e.mp3"],"tink":["assets/g/329095dca9.mp3","assets/g/d5c75b01cb.mp3","assets/g/77a6e1091e.mp3"],"plate":["assets/g/ec6e73db00.mp3","assets/g/094fbbae9e.mp3","assets/g/a35b4f6573.mp3"],"cloth":["assets/g/aee6f07e05.mp3","assets/g/8af3bc4e78.mp3","assets/g/d6540587a2.mp3","assets/g/5f2f5f0c54.mp3"]});/* 料理・もの作りの手もとの音（Kenney CC0、tools/sound/ui_asmr.py） */
Object.assign(SAMPLES,{"glight":["assets/g/449e80d89c.mp3"]});/* まもりの光：持ち主がくれた音に、こだまをかさねて余韻を長くした（tools/sound/glight_tail.py） */
Object.assign(SAMPLES,{"spike":["assets/g/5e814bb008.mp3"],"poison":["assets/g/1b43a21e56.mp3"]});/* 効果音ラボ（ユーザー提供）：とげの罠は「芝生の上を歩く」のひと足ぶん、どくの罠は「水中で息を吐く」 */
SAMPLES.shard=['assets/g/9464bc7161.mp3'];/* ヌシのかけらをはめる音（ユーザーの音） */
SAMPLES.furniturePlace=['assets/g/e33cbd97b8.mp3'];/* 家具を置く音：ユーザー提供 */
SAMPLES.matDrop=['assets/g/ef846d878d.mp3'];SAMPLES.fireatk=['assets/g/149bc0958c.mp3'];/* 火のせいれいの攻撃：ボッ（もらった音） *//* fire：焚き火のぱちぱち（もらった音。60秒のうち12秒を切り出し） */SAMPLES.firecrk=['assets/g/b20b2ff16a.mp3'];/* firecrk：焚き火のパチパチ（持ち主がくれた音。tools/sound/owner_fire.py） */SAMPLES.click=['assets/g/dc1fab61b3.mp3'];/* ボタンをおす音（もらった音） *//* 守りの光で木・岩をこわして、素材が落ちたときの音（もらった音） */
Object.assign(SAMPLES,{"stamp":["assets/g/5fb1653535.mp3","assets/g/9f56c224e9.mp3","assets/g/f1cb5ea1ff.mp3"],"dust":["assets/g/814fe2b628.mp3","assets/g/8189f95d0a.mp3","assets/g/6bfc4bd6ec.mp3","assets/g/ca1ad9eafa.mp3"],"creak":["assets/g/6c7654c715.mp3","assets/g/c82a840632.mp3"],"bend":["assets/g/b60262d9ed.mp3"],"tab":["assets/g/646421dca2.mp3","assets/g/8553ad0946.mp3"],"knockw":["assets/g/b16e923e81.mp3","assets/g/44cd883b60.mp3","assets/g/c00e91f7e0.mp3","assets/g/b4f4e74b6b.mp3","assets/g/ff0c586227.mp3"],"notch":["assets/g/e4390406ba.mp3","assets/g/0ab0818cbf.mp3","assets/g/bd4aa0ed1d.mp3"]});Object.assign(SAMPLES,{"lid":["assets/g/33c29f24b3.mp3","assets/g/eed154ca9c.mp3"]});/* 木箱のふたが開く音（Kenney の CC0、tools/sound/ui_asmr.py） *//* UIの手ざわりの本物の音（Kenney の CC0 の音を tools/sound/ui_asmr.py でととのえた物）：ハンコ・木くず・なわのきしみ・板のしなり・タブ・ことっ・± */
Object.assign(SAMPLES,{"twood":["assets/g/c4d66fe5c8.mp3","assets/g/31d3db8da0.mp3","assets/g/0a2507b504.mp3","assets/g/5428603b66.mp3","assets/g/27d96d985a.mp3"],"tstone":["assets/g/c0313b87df.mp3","assets/g/42909bf5c3.mp3","assets/g/d740607154.mp3","assets/g/fc149ecd6d.mp3","assets/g/f00873c212.mp3"],"tcan":["assets/g/e8a6d86ce5.mp3","assets/g/02f3ff1b30.mp3","assets/g/ea19526521.mp3","assets/g/90fa5e0e57.mp3","assets/g/8abd7075f2.mp3"],"tcloth":["assets/g/c2cdd95470.mp3","assets/g/ce2640c6dd.mp3","assets/g/cdb321f6cb.mp3"],"tgrass":["assets/g/4a314261fa.mp3","assets/g/16d30726b3.mp3","assets/g/fbc86f2c44.mp3","assets/g/9178e82c39.mp3","assets/g/24268c983c.mp3"],"twater":["assets/g/1856221d15.mp3","assets/g/15b3735de2.mp3","assets/g/7689d8c500.mp3","assets/g/8cb0dba7a9.mp3"],"tbell":["assets/g/13709a2edb.mp3","assets/g/2f7dccdd32.mp3","assets/g/feeb83871b.mp3"],"tfoe":["assets/g/6ccd894f39.mp3","assets/g/a11fa7e264.mp3","assets/g/0253048f7a.mp3","assets/g/6693e31f34.mp3","assets/g/2fcfb0f848.mp3"],"tweb":["assets/g/1216aa24cb.mp3","assets/g/e8430383b5.mp3"],"tani":["assets/g/f63defe2c9.mp3","assets/g/b32ac3f0b2.mp3"],"tplace":["assets/g/a9d4ab80a0.mp3","assets/g/4d2d55acb6.mp3","assets/g/f71fb79281.mp3","assets/g/56cffcde91.mp3"],"tsacred":["assets/g/b5b66ae8d4.mp3","assets/g/01dbe882fb.mp3","assets/g/501918a536.mp3","assets/g/e935b9741f.mp3"]});/* 「みる」でタップした物の音（本物の録音、tools/sound/ui_asmr.py） */
Object.assign(SAMPLES,{"page":["assets/g/853378766a.mp3","assets/g/a3901e0d93.mp3","assets/g/5e890e7bc8.mp3"]});/* 思い出帳のページをめくる音：Kenney「RPG Audio」の bookFlip（CC0。tools/sound/ui_asmr.py の page） */
Object.assign(SAMPLES,{"mpage":["assets/g/466793c686.mp3","assets/g/621c1bf73b.mp3","assets/g/33d1c2051b.mp3","assets/g/713cf89c67.mp3","assets/g/e38deebe0b.mp3","assets/g/f8cd659c4e.mp3"],"pflick":["assets/g/ec6b67851e.mp3","assets/g/8b6ebac665.mp3","assets/g/cd867ca590.mp3","assets/g/45f7fa9206.mp3"],"bkopen":["assets/g/8163c04cec.mp3","assets/g/8e49dd4b4b.mp3"],"bkclose":["assets/g/2cc9346705.mp3"],"pslide":["assets/g/adf37ba1ae.mp3"]});/* 本と巻物の音（めくる・ぱらぱら・表紙・紙のこすれ）：OpenGameArt の StarNinjas・Voltiment555・Luckius と Kenney「RPG Audio」（どれも CC0。tools/sound/ui_asmr.py） */
Object.assign(SAMPLES,{"ostamp":["assets/g/f9e82fa20b.mp3"],"owrite":["assets/g/bb496b8268.mp3"]});Object.assign(SAMPLES,{"atkE":["assets/g/1ee991d89c.mp3"],"atkW":["assets/g/bcfcba8e6f.mp3"],"atkK":["assets/g/f88cbc9949.mp3"],"atkS":["assets/g/89962c0c7f.mp3"]});/* 属性の攻撃の音（持ち主がえらんだ本物の録音、CC0。tools/sound/atk_rec.py） *//* 持ち主がくれた音：ハンコの「ぽんっ」・書く音（tools/sound/owner_stamp_write.py） */SAMPLES.epon=['assets/g/d6bdbb6f0c.mp3'];SAMPLES.kill=['assets/g/e4b242fc2e.mp3'];/* コワイノのダメージ音「ぽふっ」（クッションをたたく音：Kenney impact-sounds の impactSoft_medium_001、CC0。切って大きさをそろえた）・たおした音「さらさら」（効果音ラボの音に余韻をたした g1）。持ち主が「コワイノの音」のページできめた */SAMPLES.tsoil=SAMPLES.fsoil;/* 土・畑の音は、持ち主の足音の録音（土）から（前の録音は太鼓のように聞こえた） */SAMPLES.equip=['assets/g/b1909223de.mp3'];SAMPLES.doorClose=['assets/g/5d1a410eea.mp3'];/* ユーザー提供：衣擦れ2・ドアを閉める2 */
function loadSamples(){/* 音のファイル（assets/g/*.mp3）を読みこんで、鳴らせる形にしておく */for(const k in SAMPLES){SBUF[k]=[];SAMPLES[k].forEach((u,i)=>{fetch(u).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b,buf=>{SBUF[k][i]=buf},()=>{})).catch(()=>{})})}}
// セリフの声：キャラごとに高さを変える（カミサマは低め）
let VOICE=null,voxC=null;const BRAVET=new WeakMap();
function voiceStart(w,dur){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;{const sr=S&&S.res&&S.res.find(q=>q.name===w),vb=sr&&sr.vr&&sr.vr.vo;src.playbackRate.value=/ヌシ/.test(w||'')?.55:(w===GOD||w==='？？？')?.78:vb||(KEYVR[w]&&KEYVR[w].vo)||1.12}/* 声の高さは一人ずつちがう */
  {const t=AC.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.8*(SND.vv??1),t+.03)}/* 声の出だしは、ぷつっと大きくならないよう、少しずつ */src.connect(g);g.connect(voxC);src.start(0,Math.random()*b.duration*.5);VOICE={src,g};if(dur)VOICE.end=setTimeout(voiceStop,dur*1000)}
/* しらべるでタップしたときの「ほにゃ？」：短く、最後が上がる声 */
function voiceHmm(r){voiceStop();if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF.voice||[])[0];if(!b)return;const vo=(r.vr&&r.vr.vo)||1.12,t=AC.currentTime;
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.playbackRate.setValueAtTime(vo*.95,t);src.playbackRate.setValueAtTime(vo*.95,t+.16);src.playbackRate.linearRampToValueAtTime(vo*1.35,t+.36);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.7*(SND.vv??1),t+.03);g.gain.setValueAtTime(.7*(SND.vv??1),t+.3);g.gain.linearRampToValueAtTime(0,t+.42);src.connect(g);g.connect(voxC);src.start(t,Math.random()*b.duration*.5);src.stop(t+.45);VOICE={src,g}}
/* すれちがいのあいさつ（passGreet）：会話の声（SAMPLES.voice）を、その子の声の高さで、ごく短く（「やっ」と上がる）。マップの場所の音と同じく、左右・遠いほど小さく。大きさは、おしゃべりの声（CHATK）と同じくらい */
function greetVoice(r,dl){if(!AC||!SND.sfx||AC.state!=='running'||VOICE)return;const b=(SBUF.voice||[])[0];if(!b)return;const q=sfxPos(r.x,r.y);if(!q)return;const vo=(r.vr&&r.vr.vo)||(typeof KEYVR!=='undefined'&&KEYVR[r.name]&&KEYVR[r.name].vo)||1.12,t=AC.currentTime+(dl||0),d=.22;
  const src=AC.createBufferSource(),env=AC.createGain(),cp=AC.createDynamicsCompressor(),g=AC.createGain();src.buffer=b;src.playbackRate.setValueAtTime(vo*1.02,t);src.playbackRate.linearRampToValueAtTime(vo*1.3,t+d);
  env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(.8,t+.03);env.gain.setValueAtTime(.8,t+d-.06);env.gain.linearRampToValueAtTime(0,t+d);
  cp.threshold.value=-38;cp.ratio.value=12;cp.knee.value=4;cp.attack.value=.003;cp.release.value=.1;g.gain.value=.5*CHATK*q.v*(SND.vv??1);
  src.connect(env);env.connect(cp);cp.connect(g);let h=g;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;h.connect(pn);h=pn}{const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=Math.min(q.l,2600);f.Q.value=.5;h.connect(f);h=f}if(lowG&&!lowOK(q.v))return;if(lowG)lowAdd(src,g,q.v);h.connect(lowG||sfxG);
  src.start(t,Math.random()*Math.max(0,b.duration-d-.1));src.stop(t+d+.05)}
/* 鼻歌・もやもやの音（work-fx.js の drawHum・drawMoya）：音符・もやもやが出ているあいだ、画面のまん中にいちばん近い1人（見守っている子がいれば、その子）だけ、
   その子の声の高さで小さく、つぎつぎ鳴らす。会話の画面の声が出ているあいだは鳴らさない。
   鼻歌は、会話の声の母音をのばした音（SAMPLES.vowel）1本を1つの音にし（vNote）、高い音をけずって口をとじた「ん〜」にした、スキップのリズムの「るんるん」のフレーズ（humPhrase）。もやもやは録音（SAMPLES.moya） */
const MOODM=new Map(),MOODV={hum:.125,moya:.22},MOODGAP={hum:[.7,1.6],moya:[.08,.2]};let MOODP=null;/* つぎを鳴らすまでの間（秒）。もやもやは、もやん・もやんと短く。MOODP：いま鳴らしている {r,k,end} */
SAMPLES.vowel=['assets/g/14dad06147.mp3'];/* 会話の声の母音を、高さのかわらない2秒の「あー」にのばした音（tools/sound/voice_vowel.py、約580Hz） */
const VIBHZ=6;
function vNote(b,t,len,rate,v,dest,o={}){/* 1つの音：のばした声（SAMPLES.vowel）1本を、rate の高さで len 秒（o.bend：はじめ少し低くから上がる・o.dim：おわりへ小さく・o.vib：やさしいゆれ）。音の中で粒にきらないので、ゆれすぎない */
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;if(o.vib){/* o.vib：音の高さを、やさしく小さくゆらす（VIBHZ 回／秒。はじめは o.bend から上がり、ゆれは少しおくれて出る） */const N=Math.max(2,Math.ceil(len*80)),C=new Float32Array(N);for(let i=0;i<N;i++){const x=i/(N-1)*len,bd=o.bend?o.bend+(1-o.bend)*Math.min(1,x/Math.min(.08,len*.4)):1;C[i]=rate*bd*(1+o.vib*Math.min(1,x/.12)*Math.sin(6.2832*VIBHZ*x))}src.playbackRate.setValueCurveAtTime(C,t,len)}else if(o.bend){src.playbackRate.setValueAtTime(rate*o.bend,t);src.playbackRate.linearRampToValueAtTime(rate,t+Math.min(.08,len*.4))}else src.playbackRate.value=rate;
  const a=Math.min(.04,len*.25),r=Math.min(.08,len*.3);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.linearRampToValueAtTime(o.dim?v*.6:v,t+len-r);g.gain.linearRampToValueAtTime(0,t+len);src.connect(g);g.connect(dest);
  const use=len*rate+.05;src.start(t,.05+Math.random()*Math.max(0,b.duration-use-.1));src.stop(t+len+.02)}
function voiceDest(q,lp,v){/* 声の出口：大きさ・左右（マップの場所の音と同じ）・こもり */let h=AC.createGain();h.gain.value=v*q.v*(SND.vv??1);const in0=h;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;h.connect(pn);h=pn}const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=Math.min(q.l,lp);f.Q.value=.4;h.connect(f);f.connect(sfxG);return in0}
function voVo(r){return(r.vr&&r.vr.vo)||(typeof KEYVR!=='undefined'&&KEYVR[r.name]&&KEYVR[r.name].vo)||1.12}/* その子の声の高さ */
const HUMVIB=.014,HUMVIBL=.02,HUMSK=[.28,.13],HUMEND=.5;/* 鼻歌のゆれ（どの音も高さの1.4%、さいごの音は2%）。スキップのリズム：長い音・短い音（秒）を、かわりばんこに。さいごの音は HUMEND */
const HUMS=[[0,2,4,4,7,4],[2,4,7,7,9,7],[0,0,4,4,7,9],[4,7,9,7,4,7],[-3,0,2,4,2,4],[0,4,2,4,7,9,7]];/* 鼻歌のフレーズ（半音。ペンタトニックの中だけ。上がっていく明るい形が多い） */
function humPhrase(r,q,b){const P=pick(HUMS),dest=voiceDest(q,700,MOODV.hum),base=voVo(r)*.84;let t=AC.currentTime+.03;
  P.forEach((n,i)=>{const last=i===P.length-1,len=last?HUMEND:HUMSK[i&1],on=last?len:len*.86;/* はずむよう、音と音のあいだを少しあける */vNote(b,t,on+.03,base*Math.pow(2,n/12),1,dest,{dim:last,vib:last?HUMVIBL:HUMVIB,bend:i&1?0:.96});t+=len});return t}
function moodMark(r,k,now){MOODM.set(r,{k,t:now})}
function moodTick(){const now=performance.now();for(const[r,m]of MOODM)if(now-m.t>400||r.hidden)MOODM.delete(r);
  if(!AC||!SND.sfx||AC.state!=='running'||VOICE||!S||!started||(typeof paused==='function'&&paused())||(typeof SKIP!=='undefined'&&SKIP))return;
  if(MOODP&&AC.currentTime<MOODP.end)return;
  let best=null,bv=0;for(const[r,m]of MOODM){const q=sfxPos(r.x,r.y);if(!q)continue;const v=(typeof FOLLOW!=='undefined'&&FOLLOW===r)?9:q.v;if(v>bv){bv=v;best=[r,m.k,q]}}
  if(!best){MOODP=null;return}const[r,k,q]=best,L=(SBUF[k==='hum'?'vowel':k]||[]).filter(Boolean);if(!L.length)return;const g0=MOODGAP[k],gap=g0[0]+Math.random()*(g0[1]-g0[0]);
  if(k==='hum'){MOODP={r,k,end:humPhrase(r,q,L[0])+gap};return}
  const b=pick(L),t=AC.currentTime,rate=voVo(r)*.9;/* もやもやは、ゆっくりのまま */
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.playbackRate.value=rate;g.gain.value=MOODV[k]*q.v*(SND.vv??1);let h=g;src.connect(g);if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;h.connect(pn);h=pn}{const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=Math.min(q.l,3200);h.connect(f);h=f}h.connect(sfxG);
  const d=b.duration/rate;src.start(t);src.stop(t+d+.05);MOODP={r,k,end:t+d+gap}}
/* 朝の体そう（events.js の taiso）の音：体そうをしているあいだ、体そうしている子みんなの声（SAMPLES.vowel、それぞれの場所。高さはみんな同じ TAISOK）で、
   小さく、拍の頭が強く、きびきび切った、体そうの曲のようなメロディ（TAISOM：[半音,拍]、1拍 TAISOB 秒）を、くりかえし流す。
   みんなは、子ごとにきまった時間だけ、ちょっとずつずれて歌う（taisoLag：0〜TAISOLAG 秒）。近い子から TAISON 人まで。人数がふえても大きくなりすぎないよう、1人ぶんは 1/√人数。会話の画面の声が出ているあいだは鳴らさない */
const TAISOB=.5,TAISOV=.42,TAISON=6,TAISOLAG=.09,TAISOM=[[0,1],[2,1],[4,1],[5,1],[7,2],[7,2],[9,1],[7,1],[5,1],[4,1],[2,2],[null,2],[0,1],[2,1],[4,1],[5,1],[7,1],[9,1],[7,2],[5,1],[4,1],[2,1],[4,1],[0,2],[null,2]],TAISOVIB=.008,TAISOSTAC=.62;/* のびて〜・まわして〜のように、上がって下がる形をくりかえす。4拍ずつの頭は強く、ほかは TAISOWEAK。音は拍の TAISOSTAC だけ鳴らして、きびきび切る（2拍の音は少し長め）。声はやさしくゆらす TAISOVIB */const TAISOWEAK=.72;
let TAISOP=null;/* {i:つぎの音,t:その時刻} */
const TAISOK=1.12*.84;/* 体そうの曲の高さ：みんな同じ音で歌う（それぞれの声の高さで歌うと、ちがう調になって、不協和音になる） */
const TAISOJIT=.05,TAISODT=12,TAISOLP=[1700,2900];/* みんなで歌うとき、音ごとに歌いだしを0〜TAISOJIT 秒ばらつかせ（せいれいごとのずれ taisoLag にたす）、せいれいごとに高さを ±TAISODT セント（半音は100）・こもり方（TAISOLP の Hz のあいだ）を少しずつかえて、合唱のように重ねる。1人のときはそのまま */
function taisoVoice(r){const h=x=>{const v=Math.sin((r.id||0)*x)*43758.5453;return v-Math.floor(v)};return{dt:Math.pow(2,(h(78.233)*2-1)*TAISODT/1200),lp:TAISOLP[0]+h(39.425)*(TAISOLP[1]-TAISOLP[0])}}/* 子ごとにきまった、高さのずれ・こもり方（しまわない） */
function taisoLag(r){const h=Math.sin((r.id||0)*12.9898+7.1)*43758.5453;return(h-Math.floor(h))*TAISOLAG}/* 子ごとにきまったずれ（しまわない） */
function taisoWho(){const E=S&&S.ev;if(!E||E.id!=='taiso'||E.ph!=='do')return[];const L=[];for(const id of E.who){const r=S.res.find(q=>q.id===id);if(!r||r.hidden||!r.act||r.act.type!=='evt'||r.act.stage!=='do'||r.act.back)continue;const q=sfxPos(r.x,r.y);if(q)L.push([r,q])}return L.sort((a,b)=>b[1].v-a[1].v).slice(0,TAISON)}
function taisoTick(){if(!AC||!SND.sfx||AC.state!=='running'||VOICE||!S||!started||(typeof paused==='function'&&paused())||(typeof SKIP!=='undefined'&&SKIP)){TAISOP=null;return}
  const W0=taisoWho();if(!W0.length){TAISOP=null;return}const b=(SBUF.vowel||[])[0];if(!b)return;const now=AC.currentTime;if(!TAISOP||TAISOP.t<now-.3)TAISOP={i:0,t:now+.05,b:0};
  const k=1/Math.sqrt(W0.length),one=W0.length<2,V=W0.map(([r,q])=>{const c=one?{dt:1,lp:2400}:taisoVoice(r);return{lag:taisoLag(r),q,d:null,dt:c.dt,lp:c.lp}});
  while(TAISOP.t<now+.35){const[n,bt]=TAISOM[TAISOP.i],len=bt*TAISOB;if(n!=null){const acc=TAISOP.b%4===0?1:TAISOWEAK,on=bt>1?len*.8:len*TAISOSTAC;for(const v of V){v.d=v.d||voiceDest(v.q,v.lp,TAISOV*k);vNote(b,TAISOP.t+v.lag+(one?0:Math.random()*TAISOJIT),on,TAISOK*v.dt*Math.pow(2,n/12),acc,v.d,{bend:.97,vib:TAISOVIB})}}TAISOP.t+=len;TAISOP.b=(TAISOP.b+bt)%32;TAISOP.i=(TAISOP.i+1)%TAISOM.length}}
setInterval(moodTick,100);setInterval(taisoTick,100);
function voiceStop(){if(!VOICE)return;const v=VOICE;VOICE=null;clearTimeout(v.end);try{const t=AC.currentTime;v.g.gain.setTargetAtTime(0,t,.04);v.src.stop(t+.2)}catch(e){}}
/* せいれいどうしのおしゃべりの、小さな話し声：会話の声（SAMPLES.voice）を、話す子の声の高さで、短く切って鳴らす。
   声の作り（コンプレッサー）は会話の声と同じで、大きさは会話の声の CHATK。マップの場所の音と同じく、左右・遠いほど小さく・こもる（sfxPos）。
   2人で、かわりばんこに話す（ときどき同じ子がつづける）。時間は実時間（早送りでも、しゃべる速さはかわらない） */
const CHATK=.3,CHATGAP=.35,CHATVT=new WeakMap();let CHATLAST=0;
function chatMurmur(r,p){if(!p||!AC||!SND.sfx||AC.state!=='running'||VOICE||(typeof SKIP!=='undefined'&&SKIP))return;const now=performance.now()/1000,st=CHATVT.get(r)||{n:0,who:0};if(now<st.n)return;CHATVT.set(r,st);
  const b=(SBUF.voice||[])[0];if(!b)return;const q=sfxPos((r.x+p.x)/2,(r.y+p.y)/2);if(!q){st.n=now+1;return}if(now-CHATLAST<CHATGAP)return;CHATLAST=now;
  const sp=st.who?p:r;if(Math.random()<.75)st.who=1-st.who;const vo=(sp.vr&&sp.vr.vo)||(KEYVR[sp.name]&&KEYVR[sp.name].vo)||1.12,dur=.35+Math.random()*.6,t=AC.currentTime;
  const src=AC.createBufferSource(),env=AC.createGain(),cp=AC.createDynamicsCompressor(),g=AC.createGain();src.buffer=b;
  src.playbackRate.setValueAtTime(vo,t);for(let x=t;x<t+dur;){x+=.08+Math.random()*.08;src.playbackRate.linearRampToValueAtTime(vo*(.92+Math.random()*.18),x)}/* ひと言ずつ、少し上がり下がり */
  env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(.8,t+.04);env.gain.setValueAtTime(.8,t+dur-.08);env.gain.linearRampToValueAtTime(0,t+dur);
  cp.threshold.value=-38;cp.ratio.value=12;cp.knee.value=4;cp.attack.value=.003;cp.release.value=.1;g.gain.value=.5*CHATK*q.v*(SND.vv??1);
  src.connect(env);env.connect(cp);cp.connect(g);let h=g;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;h.connect(pn);h=pn}{const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=Math.min(q.l,2600);f.Q.value=.5;h.connect(f);h=f}if(lowG&&!lowOK(q.v))return;if(lowG)lowAdd(src,g,q.v);h.connect(lowG||sfxG);
  src.start(t,Math.random()*Math.max(0,b.duration-dur-.1));src.stop(t+dur+.05);st.n=now+dur+.15+Math.random()*.5}
function playSeg(k,vol,dur){if(!AC||!SND.sfx||AC.state!=='running')return false;const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const b=pick(L),src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime;src.buffer=b;const v=vol*(SFXO?1:SFXV);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.15);g.gain.setValueAtTime(v,t+dur-.3);g.gain.linearRampToValueAtTime(0,t+dur);src.connect(g);g.connect(SFXO||sfxG);src.start(t,Math.random()*Math.max(0,b.duration-dur));src.stop(t+dur+.05);return true}
function playPour(vol){/* 水やり：持ち主の水の音（20秒）のどこかを3秒。はじめ・おわりの0.4秒は、2つの音の大きさの2乗の和が一定になる形で重ねる（pourKeep が、おわる0.4秒まえに、つぎを鳴らす） */if(!AC||!SND.sfx||AC.state!=='running')return false;const L=(SBUF.pourw||[]).filter(Boolean);if(!L.length)return false;const b=L[0],D=3,X=.4,src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime,v=vol*(SFXO?1:SFXV),n=121,C=new Float32Array(n);src.buffer=b;for(let i=0;i<n;i++){const x=i/(n-1)*D;C[i]=(x<X?Math.sin(x/X*Math.PI/2):x>D-X?Math.cos((x-D+X)/X*Math.PI/2):1)*v}/* はいり・おわりを1本の曲線にする（曲線のはしに、べつの予定をおくと、Safari で「Events are overlapping」になる） */g.gain.setValueCurveAtTime(C,t,D);const k=AC.createGain();/* 止めるときに小さくする所（曲線とはべつの所） */src.connect(g);g.connect(k);k.connect(SFXO||sfxG);src.start(t,Math.random()*Math.max(0,b.duration-D));src.stop(t+D+.05);POURLAST={src,k};return true}
let POURLAST=null;/* さいごに鳴らした水やりの音（pourKeep が、その子の音として持つ） */
function pourCut(p){if(!p||!AC)return;try{p.k.gain.setTargetAtTime(0,AC.currentTime,.06);p.src.stop(AC.currentTime+.4)}catch(_){}}
let WAVE=null;/* 水浴びの音は1つだけ。水浴びが終わったら止める */
function playWave(vol){if(WAVE||!AC)return;const L=(SBUF.wave||[]).filter(Boolean);if(!L.length)return;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);g.gain.value=vol*SFXV;src.connect(g);g.connect(sfxG);const w={src,g};src.onended=()=>{if(WAVE===w)WAVE=null};WAVE=w;src.start()}
function stopWave(){if(!WAVE)return;const{src,g}=WAVE;WAVE=null;try{g.gain.setTargetAtTime(0,AC.currentTime,.12);src.stop(AC.currentTime+.5)}catch(e){}}
function bellRing(x,y){/* 村の鐘：教会の鐘の音を、間をあけて3回。少しずつ小さく、あとの2回は少しだけ低く。遠くても小さく聞こえる */if(!AC||!SND.sfx)return;const L=(SBUF.bell||[]).filter(Boolean);if(!L.length)return;const vw=VW/cam.z,vh=VH/cam.z,d=Math.hypot(x*TS-(cam.x+vw/2),y*TS-(cam.y+vh/2)),v=Math.max(.35,1-d/(Math.max(vw,vh)*1.5));
  [[0,1,1],[1.5,.97,.8],[3,.995,.65]].forEach(([t,rt,g0])=>{const src=AC.createBufferSource(),g=AC.createGain();src.buffer=L[0];src.playbackRate.value=rt;g.gain.value=1.6*g0*v;src.connect(g);g.connect(sfxG);src.start(AC.currentTime+t)})}
/* nail2 の録音は4回打つ音。1回ふるあいだに1回だけ鳴らすので、どれか1つの打つ音だけを切って鳴らす（打つ所の時刻、秒） */
const NAILHIT=[0,.308,.617,.930],NAILLEN=.28;
function playHit(k,vol){const L=(SBUF[k]||[]).filter(Boolean);if(!L.length||!AC)return false;const b=pick(L),src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime,o=pick(NAILHIT);src.buffer=b;src.playbackRate.value=.92+Math.random()*.16;const v=vol*(SFXO?1:SFXV);g.gain.setValueAtTime(v,t);g.gain.setValueAtTime(v,t+NAILLEN-.06);g.gain.linearRampToValueAtTime(0,t+NAILLEN);src.connect(g);g.connect(SFXO||sfxG);src.start(t,Math.min(o,Math.max(0,b.duration-NAILLEN)),NAILLEN);return true}
let RMRT=1;/* こわす音の高さ（spirit-act.js の burst が、つづけてこわすほど下げる） */
function playS(k,vol,dl,rt,ex){const L=(SBUF[k]||[]).filter(Boolean);if(!L.length)return false;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=pick(L);src.playbackRate.value=(rt||1)*(ex?1:.92+Math.random()*.16);/* ex：高さをゆらさない（動きと時刻を合わせる音） */g.gain.value=vol*(SFXO?1:SFXV);if(SFXBUS&&SFXBUS===lowG){if(!lowOK(SFXV))return true;lowAdd(src,g,SFXV)}src.connect(g);g.connect(SFXO||sfxBus());src.start(AC.currentTime+(dl||0));return true}
/* UIの本物の音：鳴らすたびに、ちがう録音（3〜5しゅるい）と、少しちがう高さ・大きさ（同じ音のくりかえしは機械っぽく聞こえる） */
function playU(k,vol,rt,dl){return playS(k,vol*(.85+Math.random()*.3),dl,rt||1)}
let AUNLK=0;function audioUnlock(){/* iPhone は、さわったとき（touchend・click）の中で音を1つ鳴らさないと、あとから鳴らす音（タイトルの曲など）が出ない。だまった短い音を1回鳴らしてひらく */if(!AC||AUNLK&&AC.state==='running')return;try{const s=AC.createBufferSource();s.buffer=AC.createBuffer(1,1,22050);s.connect(AC.destination);s.start(0);AUNLK=1}catch(e){}}
function audioInit(){
  if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume().catch(()=>{})}catch(e){return}
  const comp=ACOMP=AC.createDynamicsCompressor();comp.connect(AC.destination);
  bgmG=AC.createGain();bgmG.gain.value=gainB();bgmF=AC.createGain();bgmF.gain.value=1;bgmG.connect(bgmF);bgmF.connect(comp);
  sfxG=AC.createGain();sfxG.gain.value=gainS();sfxG.connect(comp);lowG=AC.createGain();lowG.connect(sfxG);/* うしろの音（足音・作業・食べる・おしゃべり）の出口。大事な音のあいだ下げる（lowDuck） */
  {/* 洞窟のこだま：効果音を、おくれてくりかえす（洞窟の中だけ CAVEW をあげる） */const d=AC.createDelay(1),fb=AC.createGain(),lp=AC.createBiquadFilter();d.delayTime.value=CAVEECHO[0];fb.gain.value=CAVEECHO[1];lp.type='lowpass';lp.frequency.value=1800;CAVEW=AC.createGain();CAVEW.gain.value=0;sfxG.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(CAVEW);CAVEW.connect(comp)}
  voxC=AC.createDynamicsCompressor();voxC.threshold.value=-38;voxC.ratio.value=12;voxC.knee.value=4;voxC.attack.value=.003;voxC.release.value=.1;{const vg=AC.createGain();vg.gain.value=.5;voxC.connect(vg);vg.connect(sfxG)}/* 声の大きさ（コンプレッサーのあとで、半分に） *//* 声は、大きいところをおさえて、音の大きさをそろえる（声の音の中に、ほかより大きい所があるため） */
  noiseBuf=AC.createBuffer(1,AC.sampleRate*.3,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  nextT=AC.currentTime+.15;setInterval(sched,60);setInterval(ambTick,500);loadSamples();
}
function tone(m,t,dur,type,vol,out,f2){
  const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(typeof m==='number'&&m<200?mf(m):m,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);
}
/* やわらかい手ざわりの音（ASMRのような、小さく近い音）：木をそっとたたく「コトッ」（knock）と、紙・葉がこすれる「さらっ」（rustle） */
function knock(f,t,vol,out,dec){dec=dec||.09;const o=AC.createOscillator(),g=AC.createGain(),lp=AC.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f,t+.012);lp.type='lowpass';lp.frequency.value=f*3;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(lp);lp.connect(g);g.connect(out);o.start(t);o.stop(t+dec+.02)}
function rustle(t,dur,vol,out,f0,f1,q){const s=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();s.buffer=noiseBuf;s.loop=true;bp.type='bandpass';bp.Q.value=q||.8;bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(f1||f0,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.03,dur*.35));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(bp);bp.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
function noise(t,dur,vol,out,hp){const s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=noiseBuf;fl.type='highpass';fl.frequency.value=hp||6000;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
function bossNear(e){if(!e.spawned||e.dead)return false;if(!e.nearV&&typeof VILL!=='undefined'&&VILL&&VILL[(e.y|0)*W+(e.x|0)])e.nearV=1;return !!e.nearV}/* オオカゲの曲は、村の中（置いた物のまわり3マス）に一度入ってから。出たり入ったりで曲をかえない */
const stageSong=()=>S&&S.enemies&&S.enemies.some(e=>e.type==='boss2'&&e.spawned&&!e.dead)?'battle':S&&S.enemies&&S.enemies.some(e=>e.type==='hino'&&bossNear(e))?'hino'/* ヒノオオカゲは専用の曲 */:S&&S.enemies&&S.enemies.some(e=>(e.type==='boss'||e.type==='yama')&&bossNear(e))?(typeof WD!=='undefined'&&WD===KAZAN?'nightVB':'nightB')/* オオカゲがいるあいだは、夜の曲のアレンジ */:(isDark()?'night':'day')+(typeof WD!=='undefined'&&WD===KAZAN?'V':'');/* ヨルノオオカゲがいるあいだは、たたかいの曲 *//* ステージごとに曲をかえる（火山は dayV・nightV） */
function stageMusic(){
  curSong=wantSong=stageSong();step=0;bgmSw=0;
  if(!AC)return;
  bgmG.disconnect();bgmG=AC.createGain();bgmG.gain.value=gainB();bgmG.connect(bgmF);
  bgmF.gain.cancelScheduledValues(AC.currentTime);bgmF.gain.setValueAtTime(1,AC.currentTime);
  nextT=AC.currentTime+.01;sched();
}
let PROLD=0;/* プロローグのあとの「マップを読みこみ中…%」のあいだ：曲を鳴らさない（持ち主がきめた） */
function sched(){
  if(!AC||AC.state!=='running')return;
  if(nextT<AC.currentTime)nextT=AC.currentTime+.05;
  // 昼夜の曲は、フェードアウト→切り替え→フェードインでつなぐ
  {const now=AC.currentTime;if(wantSong!==curSong&&!bgmSw){bgmSw=now+2.4;bgmF.gain.cancelScheduledValues(now);bgmF.gain.setValueAtTime(bgmF.gain.value,now);bgmF.gain.linearRampToValueAtTime(0,now+2.2)}
   else if(bgmSw&&now>=bgmSw){bgmSw=0;curSong=wantSong;step=0;nextT=now+.05;bgmF.gain.cancelScheduledValues(now);bgmF.gain.setValueAtTime(0,now);bgmF.gain.linearRampToValueAtTime(1,now+3)}}
  while(nextT<AC.currentTime+.3){
    if(curSong!=='opening'||PROLD){nextT+=60/SONGS[curSong].bpm/2;step=(step+1)%64;continue}/* 曲はオープニング（タイトル・マップえらび・プロローグ）だけ。プロローグのあとの読みこみ中は鳴らさない。遊んでいるあいだは曲なし（効果音・環境音はそのまま） */
    const g=SONGS[curSong],e=60/g.bpm/2,t=nextT,bar=(step/8)|0,ch=g.chords[bar%4],night=curSong.indexOf('night')===0,bossArr=night&&curSong.slice(-1)==='B',opening=curSong==='opening',battle=curSong==='battle',hinoS=curSong==='hino';
    const n=g.at[step];if(n)tone(n[0],t,n[1]*e*.95,g.lead,battle?.045:opening?.16:night?.09:.075,bgmG);
    if(hinoS){if(n)tone(n[0]-12,t,n[1]*e*.9,'sawtooth',.018,bgmG);/* メロディに、ひくいざらついた音をかさねる */if(step%4===0)tone(ch[0],t,e*3.6,'triangle',.14,bgmG);if(step%8===0)for(const c of ch[1])tone(c,t,e*7.6,'sine',.03,bgmG);if(step%8===0||step%8===3||step%8===5)tone(45,t,.22,'sine',step%8===0?.2:.13,bgmG,36);/* たいこ：ドン・ドドン */if(step%8===6)noise(t,.06,.04,bgmG,1500);if(step%2===1&&Math.random()<.5)noise(t,.02,.012+Math.random()*.012,bgmG,4000);/* 火のはぜる音 */nextT+=e;step=(step+1)%64;continue}
    if(battle){if(step%2===0)tone(ch[0]+(step%4===2?12:0),t,e*1.7,'triangle',.15,bgmG);if(step%8===0)for(const c of ch[1])tone(c,t,e*7.5,'sawtooth',.012,bgmG);if(step%4===0)tone(45,t,.14,'sine',.16,bgmG,40);if(step%4===2)noise(t,.09,.05,bgmG,1800);else if(step%2===1)noise(t,.03,.025,bgmG);nextT+=e;step=(step+1)%64;continue}/* たたかい：ベースを8分できざみ、たいこ *//* マップ画面の曲（opening）：サインだけだとスマホのスピーカーで聞こえないので、三角波でほかの曲と同じくらいの大きさに */
    if(step%8===0)tone(ch[0],t,e*(opening?6:night?7.5:3.6),'triangle',opening?.22:.13,bgmG);
    if(!night&&step%8===4)tone(ch[0]+7,t,e*3.4,'triangle',opening?.2:.1,bgmG);
    if(opening){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.2,'sine',.06,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+24,t,e*1.8,'triangle',.05,bgmG)}
    else if(night){if(step%8===0)for(const c of ch[1])tone(c,t,e*7.8,'sine',.025,bgmG);if(step%4===2)tone(ch[1][(step>>2)%3]+12,t,e*1.6,'sine',.02,bgmG)}
    if(bossArr&&(step%8===0||step%8===1))tone(ch[0]-12,t,e*.9,'triangle',step%8===0?.16:.11,bgmG,(mf(ch[0]-12))*.8);/* オオカゲ：どくん、どくん（ひくいベースを2つ） */
    else{tone(ch[1][step%3]+12,t,e*.55,'square',opening?.024:.012,bgmG);if(step%2===1)noise(t,.03,opening?.05:.025,bgmG)}
    nextT+=e;step=(step+1)%64;
  }
}
/* 大きな場面の前の「間」：曲と環境音をしずかにして（ms ミリ秒）、少しまってから音 k を鳴らす */
let DUCKT=0;
function musicDuck(ms){if(!AC||AC.state!=='running')return;const t=AC.currentTime,end=t+ms/1000;DUCKT=Math.max(DUCKT,end);for(const g of[bgmG,ambG])if(g){const v=g===ambG?.09:gainB();g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(v*.2,t+.35);g.gain.setValueAtTime(v*.2,DUCKT);g.gain.linearRampToValueAtTime(v,DUCKT+1.2)}}
function quietBeat(ms,k){musicDuck(ms);if(k)setTimeout(()=>sfx(k),380)}
let ambG=null;const AMB={};
/* 夕方の虫の声：短い高い音を2回ずつ（のこした音の素材はつかわず、その場でつくる）。夕方（17.5〜20時）だけ、ときどき */
let AMBNEXT=0;
function ambAccent(on,h){if(!on||!ambG||!(h>=17.5&&h<20))return;const t=AC.currentTime;if(t<AMBNEXT||DUCKT>t)return;AMBNEXT=t+2.5+Math.random()*4;const f=3800+Math.random()*900;for(let i=0;i<2+(Math.random()*2|0);i++){tone(f,t+i*.11,.06,'sine',.02,ambG,f*.97)}}
let ambF=null,AMBIN=false;
/* 家の中を映しているか：画面のまん中のマスが、屋根をはずした家の中（ふだんの拡大より、ちぢめていないとき） */
function ambIndoor(){if(!S||!started||typeof HOUSES==='undefined'||!HOUSES.length||typeof cam==='undefined')return false;const vw=VW/cam.z,vh=VH/cam.z,cx=((cam.x+vw/2)/TS)|0,cy=((cam.y+vh/2)/TS)|0;if(cx<0||cy<0||cx>=W||cy>=H)return false;
  if(cam.z<homeZ()*.95)return false;const h=HOUSES.find(q=>q.set.has(cy*W+cx));return !!h&&roofAOf(h)<.5}
let ACOMP=null;/* 曲をまとめる出口（コンプレッサー） */
/* 大会とおまつりの曲（持ち主がえらぶ。tools/sound/cup_music.py で CUPSONG の cupmove・cupcalm・cupaward・fest に入れる）。大会のないときは、火山のおまつりの日（festOn）に fest：
   「3・2・1・どん！」から大会のあいだ（S.ev の ph 'do'）は、動く大会 CUPMOVE か、のんびりした大会の曲。表彰台（CUPV.aw）のあいだは表彰の曲。曲がないときは鳴らさない。
   長い曲なので SAMPLES に入れない（はじめにぜんぶ読みこむと、1曲で約70MB）。鳴らすときだけ audio の要素で少しずつ読む */
const CUPSONG={cupmove:'assets/g/5252fa6dbd.mp3',cupcalm:'assets/g/45a38042f4.mp3',fest:'assets/g/54eb1df6f2.mp3'};/* 動く大会：MusMus「BGM-141」（BGM:MusMus）・のんびりした大会（つり・長めの大会）：魔王魂「fantasy05」・火山のおまつりの日（festOn）：魔王魂「ethnic09」 */
const CUPMV=.13,CUPMFADE=1.2,CUPMOVE=new Set(['cup0','cup1','cup3','cup5','cup7']);let CUPM=null;
function cupMusicWant(){if(!S||!started||!SND.bgm||typeof CUPV==='undefined')return '';if(CUPV.aw&&CUPSONG.cupaward)return 'cupaward';if(typeof EVV!=='undefined'&&EVV.song&&EVV.id&&(EVV.end||S.ev&&S.ev.id===EVV.id&&S.ev.ph&&S.ev.ph!=='go')&&CUPSONG[EVV.song])return EVV.song;/* イベントのあいだと、おわりのしめ（ev-show.js）は、大会の曲 */const E=S.ev;if(!E||E.ph!=='do'||!EVENTS[E.id]||!EVENTS[E.id].cup)return typeof festOn==='function'&&festOn()&&CUPSONG.fest?'fest':'';const k=CUPMOVE.has(E.id)?'cupmove':'cupcalm';return CUPSONG[k]?k:''}
function cupMusicTick(){const k=cupMusicWant(),now=AC.currentTime;if(CUPM&&CUPM.k===k)return;
  if(CUPM){const{el,g,src}=CUPM;CUPM=null;g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(g.gain.value,now);g.gain.linearRampToValueAtTime(0,now+CUPMFADE);setTimeout(()=>{try{el.pause();src.disconnect();el.removeAttribute('src');el.load()}catch(e){}},CUPMFADE*1000+60)}
  if(!k)return;const el=new Audio(CUPSONG[k]);el.loop=true;el.preload='auto';const src=AC.createMediaElementSource(el),g=AC.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(CUPMV*(SND.bv??1),now+.6);src.connect(g);g.connect(ACOMP||AC.destination);el.play().catch(()=>{});CUPM={k,el,src,g}}
let CAVEW=null;const CAVEECHO=[.21,.34,.5],CAVEAMBV=.9;/* 洞窟のこだま：おくれ（秒）・くりかえしの大きさ・こだまの大きさ／洞窟の空気の音の大きさ */
function ambTick(){if(!AC||AC.state!=='running')return;cupMusicTick();if(!ambG){ambG=AC.createGain();ambG.gain.value=.09;ambF=AC.createBiquadFilter();ambF.type='lowpass';ambF.frequency.value=18000;ambF.Q.value=.4;ambG.connect(ambF);ambD=AC.createGain();ambF.connect(ambD);ambD.connect(AC.destination)}
  {const inn=ambIndoor();if(inn!==AMBIN){AMBIN=inn;ambF.frequency.setTargetAtTime(inn?700:18000,AC.currentTime,inn?.25:.4)}}/* 家の中を映すと、外の雨・鳥・虫の音が、壁ごしにやわらかくこもる */
  const want={birds:0,rain:0,night:0,amb_morn:0,amb_spr:0,amb_sum:0,amb_snight:0,caveamb:0};let h=12,on=false;const cave=typeof caveOn==='function'&&caveOn();if(CAVEW)CAVEW.gain.setTargetAtTime(cave?CAVEECHO[2]:0,AC.currentTime,.2);
  if(cave){if(SND.sfx)want.caveamb=CAVEAMBV}/* 洞窟の中：村の環境音は止めて、洞窟の空気の音だけ */else if(S&&started&&SND.sfx&&$('#title').hidden&&$('#maps').hidden){on=true;h=skyHour();if(S.rain)want.rain=.45;else{/* 朝と夕方は、ゆっくり入れかわる */const cl=v=>Math.max(0,Math.min(1,v)),se=typeof seasonNow==='function'?seasonNow():0;
    /* 昼：朝（5時〜7時半）は朝の音、そのあとは季節の音（春・夏はもらった音、秋・冬は鳥の声）。夜：夏はもらった夏の夜の音、ほかは虫の声（大きさ0.5） */
    const day=h<5||h>=18.5?0:h<6.5?cl((h-5)/1.5):h<17?1:cl((18.5-h)/1.5),mo=h<7?1:h<8?8-h:0,nt=h>=17.5?cl((h-17.5)/1.5)*.5:h<5.5?cl((5.5-h)/1)*.5:0;
    want.amb_morn=day*mo;want[se===0?'amb_spr':se===1?'amb_sum':'birds']=day*(1-mo);want[se===1?'amb_snight':'night']=nt}}
  ambAccent(on&&!S.rain&&!(typeof paused!=='undefined'&&paused),h);
  for(const k in want){let a=AMB[k];if(!a){if(!want[k])continue;const b=(SBUF[k]||[])[0];if(!b)continue;const src=AC.createBufferSource(),g=AC.createGain();src.buffer=b;src.loop=true;src.loopStart=.06;src.loopEnd=b.duration-.06;g.gain.value=0;src.connect(g);g.connect(ambG);src.start();a=AMB[k]={src,g}}a.g.gain.setTargetAtTime(want[k],AC.currentTime,.8)}}
const lastSfx={};
/* 音の優先順位：大事な音（DUCKK：たっせい・ハンコ・たたかい）が鳴ったら、うしろの音（lowG）と場所の音（ambD）を LOWDUCK の大きさにして、LOWREL 秒かけてもどす。
   うしろの音は、同時に LOWN こまで。いっぱいなら、いちばん小さい（画面のまん中から遠い）音より大きいときだけ、それを止めて鳴らす */
let lowG=null,ambD=null,SFXBUS=null;const LOWN=8,LOWDUCK=.5,LOWHOLD=.1,LOWREL=.6,LOWL=[];
const DUCKK=new Set(['quest','level','shard','arrive','ostamp','stamp','ehit','hit','defeat','glight','bossIn','bossKO','atk_fire','atk_earth','atk_wood','atk_wind','atk_water']);
function sfxBus(){return SFXBUS||sfxG}
function lowDuck(){if(!AC)return;const t=AC.currentTime;for(const n of[lowG,ambD]){if(!n)continue;const g=n.gain,v=Math.min(1,g.value);g.cancelScheduledValues(t);g.setValueAtTime(v,t);g.linearRampToValueAtTime(LOWDUCK,t+.03);g.setValueAtTime(LOWDUCK,t+.03+LOWHOLD);g.linearRampToValueAtTime(1,t+.03+LOWHOLD+LOWREL)}}
function lowOK(v){if(LOWL.length<LOWN)return true;let m=0;for(let i=1;i<LOWL.length;i++)if(LOWL[i].v<LOWL[m].v)m=i;if(LOWL[m].v>=v)return false;const e=LOWL.splice(m,1)[0];try{e.g.gain.setTargetAtTime(0,AC.currentTime,.02);e.src.stop(AC.currentTime+.08)}catch(_){}return true}
function lowAdd(src,g,v){const e={src,g,v};LOWL.push(e);src.addEventListener('ended',()=>{const i=LOWL.indexOf(e);if(i>=0)LOWL.splice(i,1)})}
function sfxLow(k,x,y,m){SFXBUS=lowG;try{sfxAt(k,x,y,m)}finally{SFXBUS=null}}/* うしろの音として、マップの場所で鳴らす */
let SFXV=1,SFXP=0,SFXL=0,SFXO=null,SFXR=1,SFXTAB=0,SFXTABD=0;/* SFXP：左右（-1左〜1右）・SFXL：空気でこもる高さ（Hz、0はそのまま）・SFXR：音の高さ */
/* マップの音の出口：大きさ → 左右 → 遠いほど高い音がへる（空気の中で、遠くの音はこもって聞こえる） */
function sfxOut(){let n=AC.createGain(),h=n;n.gain.value=SFXV;if(SFXP&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=SFXP;h.connect(p);h=p}if(SFXL){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=SFXL;f.Q.value=.5;h.connect(f);h=f}h.connect(sfxBus());return n}
let TAPOBJ=0,TAPMAT=0;const TAPK=new Set(['tpuni','twood','tgrass','tcan','tstone','tfoe','tweb','tani','tbell','tplace','tcloth','tsoil','twater','tsacred','fgrass','fsoil','fwood','fstone','fcloth','fsnow','fwet']);
function sfx(k){
  if(k==='quest')k='level';/* たっせいも、村レベルアップと同じ録音（同時に鳴ったら1回だけ） */
  if(VBG)return;/* 洞窟にいるあいだの村の音は鳴らさない */
  if(k==='open'||k==='crit'||TAPK.has(k))TAPOBJ=performance.now();if(TAPK.has(k))TAPMAT=TAPOBJ;else if(k==='open'&&(TAPOBJ-TAPMAT<120||typeof TAPPEND!=='undefined'&&TAPPEND&&TAPOBJ-TAPPEND<120))return;/* 「みる」で物の音が鳴ったタップは、画面がひらく音をかさねない *//* 地図の物にさわった音が鳴ったら、葉・火の粉の音は出さない（tapFx） */
  if(!AC||!SND.sfx)return;if(AC.state!=='running'){/* iPhone などは、さわってすぐは音がまだ止まっている（resume があとで終わる）。ボタンの音は、うごきだしてから鳴らす（マップの場所の音はすてる） */if(AC.state==='suspended'&&SFXV===1&&!SFXP&&!SFXL&&!SFXTAB){const t0=performance.now();AC.resume().then(()=>{if(performance.now()-t0<600&&AC.state==='running')sfx(k)}).catch(()=>{})}return}const now=AC.currentTime;if(lastSfx[k]&&now-lastSfx[k]<.07)return;lastSfx[k]=now;
  if(DUCKK.has(k)&&!SFXBUS)lowDuck();const t=now+.01,o=SFXV!==1||SFXP||SFXL?sfxOut():sfxBus(),seq=(ns,gap,type,v,d)=>ns.forEach((m,i)=>tone(m,t+i*gap,d||gap*1.6,type,v,o));
  SFXO=o===sfxG?null:o;if(SFXTAB&&(k==='tap'||k==='next')){SFXTABD=1;if(SFXTAB===2)return;k='tab'}/* タブをおしたときのボタンの音は、めくる音に */
  if(k==='cavedrip'){playU('cavedrip',.45);return}/* 洞窟のしずく */
  if(k.startsWith('cv_')){playU(k,.3);return}/* 小さな生き物の鳴き声 */
  if(k.startsWith('brk_')){const m=k.slice(4);if(m==='tstone'){playU('blkStone',1,.85);return}playU(m,.9,.85);playU(m==='tsoil'?'digSoil':'dig',.8);return}/* ブロックをこわしおえた：そのブロックの材質の音を大きく、低めに＋ほる音（石は石をほる音だけ。土のほる音は、うしろのキーンを切った録音。持ち主がえらんだ） */
  if(k.startsWith('put_')){playU(k.slice(4),.7,1.05);return}/* ブロックをつんだ */
  if(k.startsWith('fudedig')){const m=k.split(':')[1];if(m==='tstone'){playU('blkStone',.68);return}if(m)playU(m,.6,.95);playU(m==='tsoil'?'digSoil':'dig',.35,1.15);return}/* ブロックをこわしているあいだ：そのブロックの材質の音（マイクラのように、たたくたび） */
  if(k.startsWith('pick_')){const m=k.slice(5);playU(m,PICKV[m]||.3);return}/* ひろった物の音：その物の材質の録音（tapMatOf と同じ録音。ピロンという音ではない） */if(k.startsWith('ea_')){playU(k,EATV);return}/* 食べる・のむ音：とても小さく（ASMRのように近く小さく） */
  switch(k){
  case'block':if(playS('wdon',.5))break;tone(260,t,.07,'square',.05,o,520);tone(83,t+.05,.07,'triangle',.06,o);break;
  case'plant':playU('tsoil',.3,1.05);playU('tgrass',.22,1.1,.06);break;/* 植えた：土をそっとかぶせて、葉がこすれる（本物の録音） */
  case'equip':playS('equip',.8);break;
  case'furn':seq([72,76,79,84],.06,'triangle',.07);break;
  case'furnPlace':if(playS('furniturePlace',.72))break;seq([72,76,79,84],.06,'triangle',.07);break;
  case'matDrop':if(playS('matDrop',.8))break;tone(520,t,.06,'triangle',.06,o,260);break;
  case'power':seq([79,84,88,91],.055,'sine',.07);tone(1568,t+.24,.35,'triangle',.03,o,2093);break;/* パワーをカミサマにわたした：きらっとした音 */
  case'tap':if(playS('click',.6))break;tone(1300,t,.03,'square',.07,o);tone(1950,t+.025,.03,'triangle',.05,o);break;/* ボタン：もらった音（click） */
  case'twood':if(playU('twood',.42))break;{const r=.93+Math.random()*.14;knock(640*r,t,.07,o,.07);knock(980*r,t+.018,.025,o,.04)}break;/* 地図の物をタップ（ボタンの音とはべつ）。枝・木の物・宝箱：こつっ */
  case'tgrass':if(playU('tgrass',.34))break;{const r=.92+Math.random()*.16;rustle(t,.08,.05,o,2600*r,1800*r,.9);rustle(t+.035,.06,.03,o,3400*r,2400*r,.9)}break;/* 草・きのこ：かさっ */
  case'tcan':if(playU('tcan',.26))break;{const r=.95+Math.random()*.1;knock(1700*r,t,.05,o,.03);tone(3200*r,t,.09,'sine',.02,o,3050*r)}break;/* 空き缶：かちっ */
  case'tstone':if(playU('tstone',.4))break;{const r=.94+Math.random()*.12;knock(900*r,t,.08,o,.04);knock(1500*r,t+.004,.03,o,.025);noise(t,.02,.015,o,3000)}break;/* 鉱脈・石：こんっ */
  case'tfoe':if(playU('tfoe',.42,.85))break;{const r=.92+Math.random()*.16;knock(160*r,t,.09,o,.12);rustle(t,.1,.03,o,500,300,.7)}break;/* コワイノ・かげの巣：ぽふっ */
  case'tweb':if(playU('tweb',.22,1.25))break;rustle(t,.12,.025,o,5200,4200,1.5);rustle(t+.04,.08,.015,o,6000,5000,1.5);break;/* クモの巣：さらっ */
  case'tani':if(playU('tani',.34,1.45))break;{const r=.93+Math.random()*.14;tone(380*r,t,.12,'sine',.05,o,620*r)}break;/* 生き物：ぽよっ */
  case'tsacred':if(playU('tsacred',.4))break;knock(300,t,.12,o,.12);break;/* 御神木・切り株：太い木をたたく音 */
  case'tbell':if(playU('tbell',.16,1.5))break;{const r=.97+Math.random()*.06;knock(880*r,t,.06,o,.22);knock(1320*r,t+.07,.04,o,.18)}break;/* ヌシ様・お客さん・屋台：ころん */
  case'tcloth':if(playU('tcloth',.44,.95))break;{const r=.92+Math.random()*.16;rustle(t,.11,.05,o,900*r,600*r,.7);knock(180*r,t+.02,.05,o,.05)}break;/* 布の物：ふさっ */
  case'fgrass':case'fsoil':case'fwood':case'fstone':case'fcloth':case'fsnow':case'fwet':if(playU(k,.5))break;/* 地面をタップ：その地面の足音の録音 */
  case'tsoil':if(playU('tsoil',.38))break;{const r=.92+Math.random()*.16;rustle(t,.07,.06,o,700*r,400*r,1.1);rustle(t+.03,.05,.03,o,1600*r,1100*r,1.3);knock(120*r,t,.05,o,.06)}break;/* 畑・地面：ざくっ */
  case'twater':if(playU('twater',.3))break;{const r=.92+Math.random()*.16;tone(520*r,t,.09,'sine',.045,o,1100*r);tone(900*r,t+.05,.05,'sine',.02,o,1700*r);rustle(t,.06,.02,o,3000,2200,.9)}break;/* 水：ちゃぽっ */
  case'tplace':if(playU('tplace',.36))break;{const r=.93+Math.random()*.14;knock(300*r,t,.09,o,.1);rustle(t,.05,.02,o,900,500,.7)}break;/* 置く場所・ひっこしミトン：とんっ */
  case'next':{const r=.96+Math.random()*.08;knock(470*r,t,.09,o,.08);rustle(t+.01,.07,.025,o,3600,2600,.6)}break;/* 会話の「つぎへ」：コトッと、紙をめくる音 */
  case'open':rustle(t,.15,.06,o,900,2600,.7);knock(340,t+.11,.06,o,.1);break;/* 画面をひらく：さらっ…コトッ */
  case'close':rustle(t,.12,.05,o,2400,800,.7);knock(270,t+.08,.06,o,.1);break;/* 画面をとじる */
  case'xyl':{/* 一覧をなでる：木の歯車の「カラッ」。歯がはじかれる短い音と、木の胴の小さな鳴り。高さは毎回すこしだけかえる */
    const q=.94+Math.random()*.12,s=AC.createBufferSource(),bp=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;bp.type='bandpass';bp.frequency.value=2300*q;bp.Q.value=6;g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.0001,t+.018);s.connect(bp);bp.connect(g);g.connect(o);s.start(t);s.stop(t+.04);
    const pt=(fr,d,v,ty)=>{const s=AC.createOscillator(),g=AC.createGain();s.type=ty;s.frequency.setValueAtTime(fr,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.001);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(g);g.connect(o);s.start(t);s.stop(t+d+.02)};
    pt(1250*q,.03,.036,'triangle');pt(2900*q,.012,.015,'sine')}break;
  case'pin':rustle(t,.05,.05,o,1200,600,.7);knock(300,t+.03,.06,o,.08);knock(1500,t+.16,.03,o,.03);break;/* 紙をぺたっ、ピンをぷすっ */
  case'crit':{const r=.94+Math.random()*.12;rustle(t,.08,.03,o,2600*r,4200*r,.7);knock(900*r,t+.05,.03,o,.04)}break;/* 小さな生き物をタップ：かさっ、と小さく */
  case'tile':{const r=.94+Math.random()*.12;knock(520*r,t,.045,o,.06)}break;/* 板が1まいずつ置かれる：とん、とん */
  case'flip':rustle(t,.06,.035,o,1800,3400,.8);knock(380,t+.07,.05,o,.07);break;/* 札を裏返す：ぱたっ */
  case'sizzle':rustle(t,.32,.07,o,5200,2400,1.2);rustle(t+.02,.22,.04,o,1800,900,.8);knock(210,t,.07,o,.12);break;/* 焼き印：じゅっ */
  case'leaf':rustle(t,.09,.04,o,2800,2200,.9);rustle(t+.05,.08,.028,o,3600,2600,.9);break;/* 葉が舞う：さわさわ */
  case'crackle':for(let i=0;i<3;i++)rustle(t+i*.025+Math.random()*.015,.012,.06,o,4500,4500,2);break;/* 火の粉：パチパチ */
  /* せいれいの攻撃：属性ごと。当たる音（arrow）に、属性の音をかさねる */
  case'atk_fire':if(playS('fireatk',.45))break;noise(t,.2,.15,o,300);break;/* ボッ（もらった音） */
  case'atk_earth':playU('atkE',0.5);break;/* 持ち主がえらんだ本物の録音 */
  case'atk_wood':playU('atkW',0.5);break;/* 持ち主がえらんだ本物の録音 */
  case'atk_wind':playU('atkK',0.5);break;/* 持ち主がえらんだ本物の録音 */
  case'atk_water':playU('atkS',0.45);break;/* 持ち主がえらんだ本物の録音 */
  case'next':tone(88,t,.04,'triangle',.05,o);break;
  case'good':if(!playS('joyc',.14))seq([84,88],.07,'sine',.03);break;/* よろこぶ音：オルゴールのちりりん（読みこむ前だけ、前の作った音） */
  case'warn':seq([62,57],.14,'square',.035,.22);break;
  case'level':if(playS('rwlevel',.137))break;seq([67,72,76,79],.09,'triangle',.058,.16);break;/* たっせい・村レベルアップ・あたらしいレシピ など：qubodup の「Level Up」の録音（持ち主がえらんだ。キラリン系の -35 LUFS。読みこむ前だけ、前の作った音） */
  case'gift':if(playS('rwget',.098))break;if(!playS('joyc',.14))seq([84,88],.07,'sine',.03);break;/* うけとった：おもちゃの鉄琴の「ちん・ちーん」 */
  case'firstput':if(playS('rwfirst',.136))break;tone(2093,t,.5,'sine',.03,o);break;/* はじめて置いた家具：チャイムの「きらーん」 */
  case'bossIn':noise(t,1.6,.16,o,60);tone(110,t,1.6,'sawtooth',.06,o,40);tone(55,t,2.2,'sine',.12,o,35);[45,46,51].forEach((m,i)=>tone(m,t+.25+i*.02,2.4,'triangle',.05,o));break;/* オオカゲの登場：ひくい地ひびきと、にごった和音 */
  case'shard':if(playS('shard',.8))break;seq([67,72,76,79],.09,'triangle',.08,.16);break;/* かけらをはめる */
case'bossKO':noise(t,.5,.3,o,200);tone(70,t,1.4,'sine',.2,o,30);tone(900,t,.35,'square',.05,o,120);noise(t+.12,.9,.08,o,3000);[72,79,84,88,91,96].forEach((m,i)=>tone(m,t+.35+i*.08,1.4,'triangle',.06,o));[96,103,108].forEach((m,i)=>tone(m,t+.9+i*.06,1.2,'sine',.04,o));break;/* オオカゲへのさいごの一撃：ドーンとひびいて、光の音がかけあがる */
  case'hit':if(playS('arrow',.6))break;noise(t,.08,.15,o,800);tone(220,t,.12,'square',.05,o,70);break;
  case'ehit':playU('epon',.5);break;/* コワイノに当たった：ぽふっ */
  case'defeat':if(playS('kill',.5))break;tone(400,t,.18,'triangle',.08,o,1300);noise(t+.05,.12,.04,o,4000);break;
  case'offer':seq([88,91,96],.05,'sine',.05);break;
  case'hanabi':noise(t,.5,.1,o,400);tone(62,t,.35,'sine',.18,o);break;/* 花火の音 */
  case'arrive':seq([79,84,88,91,96],.08,'sine',.046,.2);break;
  case'zap':if(playS('shoot',.45))break;tone(1500,t,.07,'sawtooth',.015,o,500);break;
  case'seed':seq([84,91,96,100],.05,'triangle',.05);break;
  case'pat':if(playS('pat',.8))break;noise(t,.08,.05,o,2500);break;
  case'sow':playU('dust',.12,.9);playU('tgrass',.18,1.2,.05);break;/* たねをまく：小さなつぶが落ちて、葉がこすれる（本物の録音） */
  case'till':playU('tillhit',.4);break;/* 畑がたがやされた：くわが土にささる音（持ち主の音） */
  case'wtill':playU('tillhit',.4);break;/* たがやす動きの、くわが土にささる所（WBEAT） */
  case'wsoil':playU('tsoil',.16,1.2);break;/* 土に手をふれる：たね・苗（WBEAT） */
  case'wleaf':playU('tgrass',.18,1.05);break;/* 葉・実をとる手もと（WBEAT） */
  case'wweed':playU('tgrass',.32,.85);break;/* 草をひっぱってぬく（WBEAT） */
  case'wsweep':playU('tweb',.2,.9);break;/* クモの巣をはらう（WBEAT） */
  case'pourl':playPour(1);break;/* 水やり：持ち主の水の音を、3秒ずつ、つなぎ目をかさねてつづける（pourKeep） */
  case'tpuni':playU('tpuni',.38,1.2);break;/* きのこ：ぷにっ（やわらかい物をおす録音を、高く） */
  case'bowdraw':playU('bowdraw',.3);break;/* 弓をひきしぼる（持ち主の音） */
  case'uknock':playU('knockw',.12,.85);break;/* ボタンでない所のタップ：木をそっとたたく */
  case'starkira':playU('starkira',.078);break;/* 流れ星をタップ：キラッ（持ち主の音） */
  case'slip':if(playU('slip',.4))break;noise(t,.07,.1,o,600);break;/* 水たまりですべる（読みこむ前だけ作った音） */
  case'dscoop':playU('dscoop',.42);break;/* 水くみ：バケツが水に入る */
  case'dlift':playU('dlift',.32);break;/* 水くみ：ひき上げる */
  case'harvdone':playS('harvdone',.5);break;
  case'treefall':playS('treefall',.8,0,1,1);break;/* 木がたおれる：ミシミシ → ドン（持ち主の音。ドンの時刻に、たおれる絵を合わせるので、高さをゆらさない） *//* とりおわったとき（ガサゴソ bush のあと） */
  case'harvest':if(playS('bush2',.45))break;seq([72,79,84,91],.05,'triangle',.06);break;
  case'water':if(playS('splash',.32))break;{const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;sr.loop=true;bp.type='bandpass';bp.frequency.setValueAtTime(3200,t);bp.frequency.linearRampToValueAtTime(2200,t+.7);bp.Q.value=.8;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.1);g.gain.setValueAtTime(.06,t+.45);g.gain.linearRampToValueAtTime(0,t+.75);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t);sr.stop(t+.8);
    for(let n=0;n<4;n++){const d=t+.12+n*.13+Math.random()*.05;tone(1400+Math.random()*600,d,.05,'sine',.012,o,2600)}break}
  case'chop':playHit('nail2',.3);break;/* 木を切る音＝釘を打つ音 */
  case'tonton':playU('tonton',.38);break;/* 包丁でまな板 */
  case'potclk':if(!playS('potg',.35))playU('potclk',.22);break;/* なべがぐつぐつにえる音（持ち主がえらんだ） */
  case'tink':playU('tink',.2);break;/* あわだて器がボウルに */
  case'plate':playU('plate',.32);break;/* お皿にもりつける */
  case'cloth':playU('cloth',.3);break;/* ぬのでみがく */
  case'fry':rustle(t,.42,.055,o,5600,3200,1.1);rustle(t+.03,.3,.03,o,2300,1600,.8);break;/* フライパン：じゅっ */
  case'grill':rustle(t,.3,.035,o,4200,2600,1);break;/* くしやき：ちりちり */
  case'fanw':rustle(t,.07,.045,o,900,500,1.2);break;/* うちわ：ぱた */
  case'shuttle':if(playU('shutl',.22))break;rustle(t,.16,.035,o,2200,3400,1.6);break;/* はたおり：ひがよこへすべる、すーっ（本物の録音） */
  case'loombeat':if(playU('loomk',.3))break;{const r=.94+Math.random()*.12;knock(420*r,t,.08,o,.08);knock(700*r,t+.015,.03,o,.05)}break;/* はたおり：おさをごとん（本物の録音） */
  case'grind':{const r=.93+Math.random()*.14;rustle(t,.32,.05,o,260*r,420*r,1.2);knock(110*r,t,.03,o,.12)}break;/* 粉ひき：石うすが、ごりごり */
  case'saw':rustle(t,.2,.07,o,1500,2600,2.4);knock(160,t+.02,.03,o,.06);break;/* のこぎり：ごりっ */
  case'workdone':if(playS('wdone',.35))break;knock(420,t,.1,o,.07);break;/* 作業台・料理の「できた」：あわがはじける「ぽん」（el_boss の録音。持ち主がえらんだ。読みこむ前だけ作った音） */
  case'cook':if(playS('boil',.35))break;noise(t,.35,.025,o,3000);tone(180,t,.08,'triangle',.03,o,140);break;
  case'crack':if(playS('mine',.25))break;playS('place',.25);break;case'rm':if(playS('gravel',.6,0,RMRT))break;noise(t,.18,.09,o,900);break;
  case'nail':playHit('nail2',.28);break;
  case'mine1':playS('mine',.375);break;/* 石をほる（前の crack の1.5倍） */
  case'dpour':playSeg('trickle',.4,.5);break;/* 水くみ：バケツを水に入れる音（1回ずつ） */
  case'bnail':playHit('nail2',.42);break;
  case'kankan':for(let i=0;i<3;i++)playS('nail2',.42,i*.22);break;/* 強化したとき：カンカンカン *//* 建てているときの音（ふつうの1.5倍） */
  case'evap':noise(t,1.4,.05,o,2500);seq([67,64,60],.18,'sine',.03,.4);break;
  case'bush':playS('bush',.35);break;
  case'sacred':{/* 御神木の場面：葉をわたる風（やわらかくふくらんで消える）と、高くすんだ鈴の音 */const sr=AC.createBufferSource(),g=AC.createGain(),bp=AC.createBiquadFilter();sr.buffer=noiseBuf;sr.loop=true;bp.type='bandpass';bp.Q.value=.7;bp.frequency.setValueAtTime(900,t);bp.frequency.linearRampToValueAtTime(1800,t+.6);bp.frequency.linearRampToValueAtTime(1100,t+1.4);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.45);g.gain.linearRampToValueAtTime(0,t+1.5);sr.connect(bp);bp.connect(g);g.connect(o);sr.start(t);sr.stop(t+1.55);
    [88,95,100].forEach((m,i)=>tone(m,t+.18+i*.16,1.2,'sine',.022,o));break}
  case'chime':{/* 御神木の場面の小さな音（ひづめのあと・守り神の出番）：やさしい鈴ひとつ */const m=[91,95,98,100][Math.random()*4|0];tone(m,t,.6,'sine',.03,o);tone(m+12,t,.25,'sine',.008,o);break}
  case'cast':playS('cast',.35);break;
  case'catch':playS('catch',.35);break;
  case'bubble':playS('bubble',.35);break;
  case'box':playS('box',.8);break;
  case'put':playU('knockw',.4125,.9);break;/* 箱などに置く：ことっ */
  case'take':playU('cloth',.375,1.05);break;/* 箱などから取る：ごそっ */
  case'lid':playU('lid',.675,1.1);break;/* 木箱のふたが開く：ぎぃ */
  case'cookfire':playSeg('firecrk',.6,2.5);break;/* 焚き火・かまど：パチパチだけ（長い音のどこかを2.5秒） */
  case'door':playS('door',.25);break;
  case'doorClose':playS('doorClose',.25);break;
  case'wave':playWave(.2);break;
  case'wbreak':playS('wallbreak',.5);break;
  case'pour':playSeg('trickle',.4,1.8);break;
  case'shoot':playS('shoot',.5);break;
  case'glight':playS('glight',.45);break;
  case'clap':for(let i=0;i<6;i++){const d=t+i*.13+Math.random()*.03;noise(d,.04,.12,o,2200+Math.random()*900);noise(d+.05,.03,.08,o,1800)}break;
  case'post':if(playS('paper',1.35))break;noise(t,.06,.45,o,2500);tone(520,t+.04,.07,'triangle',.45,o);tone(880,t+.1,.08,'square',.21,o);break;
  case'repair':tone(600,t,.05,'square',.04,o);tone(600,t+.12,.05,'square',.04,o);tone(88,t+.24,.12,'triangle',.05,o);break;
  case'spike':if(playS('spike',.5))break;noise(t,.05,.06,o,2600);break;/* とげの罠でダメージ */
  case'poison':if(playS('poison',.1125))break;noise(t,.2,.0125,o,500);break;/* どくの罠：ふんだとき・ダメージ */
  case'bonk':if(playS('punch',.45))break;noise(t,.07,.1,o,600);tone(140,t,.1,'square',.05,o,90);break;
  case'fishbite':playU('twater',.36,.8+Math.random()*.3);break;/* 魚がかかって、水がバシャバシャ（水の録音） */
  case'owrite':break;/* 書く音は writeLoop で、書いているあいだだけ鳴らす */
  case'ostamp':if(playU('ostamp',.55))break;/* ハンコ：持ち主の「ぽんっ」 */
  case'stamp':if(!playU('stamp',.5,.95))knock(150,t,.12,o,.14);rustle(t+.005,.05,.012,o,1800,900,.7);break;/* ハンコ：紙ごしの、ぽむっ */
  case'dust':playU('dust',.07,1.15+Math.random()*.25);break;/* 木くずが、さらさらこぼれる */
  case'creak':playU('creak',.06,1.2);break;
  case'bkkoe':playU('voice',.22,.55+Math.random()*.15);break;/* 洞窟の声のこだま：だれかの声を、ひくく小さく（会話の声の録音） */
  case'bklure':playU(Math.random()<.5?'cv_usagi':'cv_risu',.35);break;/* 洞窟のえさ：かわいい生き物の声でよぶ *//* つるしたなわが、きゅ… */
  case'bend':playU('bend',.04+.08*SFXR,.85+SFXR*.15);break;/* 板がしなって、ぎぃ（SFXR：しなりの大きさ 0〜1） */
  case'page':if(!playU('page',.34,1))rustle(t,.12,.05,o,3400,2200,.6);break;/* 思い出帳のページをめくる：ぺらっ（本物の録音） */
  case'count':playU('tab',.3,1.05);break;/* 上の数がふえた：タブの「ぱたっ」の録音（持ち主がえらんだ。読みこむ前は鳴らさない） */
  case'tab':if(!playU('tab',.3,1.05))rustle(t,.06,.03,o,3600,2400,.6);playU('knockw',.12,1.35,.025);break;/* タブ：ぱたっとめくって、ことっ */
  case'notch':if(!playU('notch',.32,SFXR))knock(1600*SFXR,t,.04,o,.02);break;/* ±：かちっ（ねじを回す音） */
  case'rowin':playU('knockw',.07,SFXR);break;/* 一覧の行が、ことっと置かれる */
  case'glug':for(let i=0;i<2;i++){const d=i*.13,f=260+Math.random()*60;tone(f,t+d,.07,'sine',.035,o,f*2.1)}break;/* ゲージがたまる：とくとく（水があわになってのぼる音） */
  case'boing':{const f=200*SFXR;tone(f,t,.22,'sine',.045,o,f*1.6);tone(f*2,t+.01,.12,'sine',.012,o,f*3)}playU('knockw',.06,.8);break;/* 長くおしたボタンをはなした：ぽよん（長くおすほど高い） */
  case'thief':seq([76,79,76,79],.06,'square',.03);break;
  case'eat':if(playS('munch',.45))break;[0,.14,.28].forEach(d=>{noise(t+d,.06,.03,o,1800);tone(240+Math.random()*60,t+d,.06,'triangle',.05,o,150)});tone(84,t+.42,.12,'sine',.05,o);tone(88,t+.5,.16,'sine',.05,o);break;
  case'poof':noise(t,.3,.08,o,2500);seq([84,91],.08,'sine',.05);break;
  case'night':seq([57,53,50],.25,'sine',.08,.5);break;
  case'morning':seq([72,79,84],.12,'triangle',.06,.3);break;
  }
}
/* ひろった物・図鑑でタップした物の音：その物の材質ごとの録音（「みる」でタップしたときと同じ録音。大きさは同じ）。
   id は 'mat:<素材>'・'food:<食べ物>'・家具の id など。草・きのこ・食べ物は植物（tgrass）、魚は水、わた毛・布は布、石・鉱石は石、空き缶・延べ棒は金物、木・枝・竹は木 */
const PICKV={twood:.42,tgrass:.34,tcan:.26,tstone:.4,tcloth:.44,tsoil:.38,twater:.3,tsacred:.4};
const PICKGRASS=new Set(['shina','kasa','kuru','chiri','funba','nabiki','houki','ashi','gama','iwakusa','susuki','yotsuyu','kagekusa']),PICKSTONE=new Set(['stone','maruishi','sagan','gekko','nendo','copper','iron','obsidian','silver','gold','sulfur','crystal']);
function itemMat(id){if(typeof id!=='string')return'twood';
  if(id.startsWith('mat:')||typeof MATN!=='undefined'&&MATN[id]&&!BL[id]){const k=id.startsWith('mat:')?id.slice(4):id;return PICKGRASS.has(k)?'tgrass':PICKSTONE.has(k)?'tstone':k==='can'||/^i(copper|iron|silver|gold)$/.test(k)?'tcan':k==='nuno'||k==='wool'?'tcloth':'twood'}
  if(id.startsWith('food:')||typeof FOODS!=='undefined'&&FOODS[id]&&!BL[id]){const k=id.startsWith('food:')?id.slice(5):id,f=FOODS[k];return f&&f.fish?'twater':'tgrass'}
  if(id.startsWith('seed:')||id==='sand'||id==='hai')return'tsoil';if(id==='mapPc'||id==='fukuro')return'tcloth';if(/^ng[012]$/.test(id))return'tstone';
  const m=typeof tapMatOf==='function'?tapMatOf(id):null;return m||'twood'}
function itemSnd(id,x,y){const m=itemMat(id);if(x==null)return sfx('pick_'+m);sfxAt('pick_'+m,x,y)}/* x,y があれば、マップの場所の音（左右・遠いほど小さい） */
// 画面の中心から遠いほど小さく鳴らす
const EATV=.08;/* 食べる・のむ音の大きさ（とても小さく） */
const SFXGAP={ea_:1.6,chop:.3,mine1:.3,cookfire:2,pour:2.5,crack:1.3,spike:.4,poison:.6},SFXLAST={};/* 同じ音が重ならないように */
/* せいれいの足音（ひかえめ）：歩く動きの、足がつくコマに合わせて、足もとの地面の音（footMat）を、とても小さく鳴らす。
   歩く3Dの動き（walk・carry）のコマは、歩いた道のりで進む（draw-spirits.js の spWalkD・WALKPT）。足がつくのは動きの 1/4 と 3/4（かたあしずつ）。描いた道のり（WLKD）と、いまの歩く速さから、
   これからの FOOTLOOK 秒のうちに足がつくなら、その時刻に鳴らす（描いた絵の足とずれない）。虫を見る（critwatch）は時計の動きなので、時計で。画面の近くの子だけ・1回（0.1秒）に FOOTN 歩まで・近い子から。
   コワイノも、同じように歩きの絵（6コマ／秒）の2コマごとに、とても小さく・ひくく鳴らす（EFOOTV）。ハシゴをのぼる子は、手をかけるたび（π/8 秒ごと）にハシゴの音。
   足音の録音は持ち主の録音（tools/sound/footstep_rec.py）。雨の日の外の草地・土・道は、ぬれた地面の音（fwet）。
   村の時間が止まっている・会話・早送りのときは鳴らさない */
const FOOTRATEC=11/(2*Math.PI),FOOTLOOK=.12,FOOTV=.07,EFOOTV=.05,FOOTN=2,EFOOTN=2,FOOTP=new WeakMap(),EFOOTP=new WeakMap(),LADV=.1;
function footMat(x,y){const j=(y|0)*W+(x|0);if(j<0||j>=W*H)return null;const o=S.obj[j];if(o==='bridge')return'fwood';if(typeof RUGC!=='undefined'&&RUGC.has(j))return'fcloth';if(S.ground[j]===2)return'twater';
  const out=!(typeof roomOf==='function'&&roomOf(j)),snow=out&&typeof snowCover==='function'&&snowCover()>.4&&!(typeof feelMelt==='function'&&feelMelt(j)),wet=out&&S.rain&&!(typeof snowNow==='function'&&snowNow())&&!snow;/* つもった雪の上は、雪の音 *//* 雨の日（あらしもふくむ）の外の草地・土・道は、ぬれた地面の音（家の中・橋・木と石の床や道は、ふつうの音） */
  const f=S.floor[j];if(f&&f!=='path'&&BL[f]&&typeof tapMatOf==='function'){const k=tapMatOf(f);return k==='twood'?'fwood':k==='tstone'?'fstone':k==='tcloth'?'fcloth':wet?'fwet':'fsoil'}if(f)return wet?'fwet':'fsoil';
  if(o==='farm'||o==='part'&&S.obj[S.ref[j]]==='farm')return wet?'fwet':'fsoil';/* 畑の上は土 */
  if(snow)return'fsnow';return wet?'fwet':typeof REV!=='undefined'&&REV.has(j)?'fgrass':'fsoil'}
/* 日記を書くあいだ：持ち主の書く音（10秒、SAMPLES.owrite）をくりかえし、おわったら、ゆっくり小さくして止める */
let WRITEL=null;const WRITEV=.4;
function writeLoop(on){if(!on){if(WRITEL&&AC){const t=AC.currentTime;WRITEL.g.gain.setTargetAtTime(0,t,.12);try{WRITEL.s.stop(t+.6)}catch(_){}}WRITEL=null;return}
  if(WRITEL||!AC||!SND.sfx||AC.state!=='running')return;const B=(SBUF.owrite||[]).filter(Boolean)[0];if(!B)return;const s=AC.createBufferSource(),g=AC.createGain();s.buffer=B;s.loop=true;g.gain.value=0;g.gain.setTargetAtTime(WRITEV,AC.currentTime,.05);s.connect(g);g.connect(sfxG);s.start(0,Math.random()*B.duration*.5);WRITEL={s,g}}
function footSoft(k,q,vol,rate,delay,lp){/* 小さな足音を1つ、delay 秒あとに（左右・遠いほどこもる） */
  const B=(SBUF[k]||[]).filter(Boolean);if(!B.length)return;const t=AC.currentTime,s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();s.buffer=pick(B);s.playbackRate.value=rate*(.92+Math.random()*.16);
  g.gain.value=vol*q.v*(.8+Math.random()*.4);if(lowG){if(!lowOK(q.v))return;lowAdd(s,g,q.v)}/* くらべるのは、画面のまん中からの近さ（q.v）。もとから小さい音（コワイノの足音）を先にけさない */f.type='lowpass';f.frequency.value=Math.min(lp||q.l,q.l);let h=g;if(AC.createStereoPanner){const pn=AC.createStereoPanner();pn.pan.value=q.p;g.connect(pn);h=pn}h.connect(f);f.connect(lowG||sfxG);s.connect(g);s.start(t+Math.max(0,delay))}
function ladderNow(r){/* ハシゴをのぼりおりしている（見張り台のハシゴ・ハシゴの上を動く）。段差のよじのぼりは入れない */
  if(r.act&&r.act.type==='watchpost'&&r.act.stage==='do'&&(r.act.cl||0)<1)return true;const j=(r.y|0)*W+(r.x|0);return typeof LADDERS!=='undefined'&&LADDERS.has(S.obj[j])&&r.path&&r.path.length>0}
function footTick(now0){if(!AC||!SND.sfx||AC.state!=='running'||!S||!started||(typeof paused==='function'&&paused())||VOICE||(typeof SKIP!=='undefined'&&SKIP))return;
  const now=now0==null?performance.now():now0,tS=now/1000,L=[];
  for(const r of S.res){if(r.hidden){FOOTP.delete(r);continue}let p=FOOTP.get(r);if(!p){FOOTP.set(r,{x:r.x,y:r.y,n:-1e9});continue}const d=Math.hypot(r.x-p.x,r.y-p.y);p.x=r.x;p.y=r.y;
    if(r.act&&r.act.stage==='do'&&r.act.type==='sleep')continue;
    const ladder=ladderNow(r),watchClimb=r.act?.type==='watchpost'&&r.act.stage==='do';
    if(ladder&&(watchClimb||d>=.003)){/* ハシゴ：手をかけるたび（sin(t×8) がいちばん大きい所）に、こつっ */
      const u=(tS+r.id*1.7)*8/Math.PI-.5,n=Math.ceil(u-1e-9),dl=(n-u)*Math.PI/8;if(n>(p.l||-1e9)&&dl<=FOOTLOOK){p.l=n;const q=sfxPos(r.x,r.y);if(q)L.push([r,q,dl,'ladder'])}continue}
    if(d>2||d<.003||typeof CLIMB!=='undefined'&&CLIMB.has(r))continue;/* ワープ・止まっている子は鳴らさない */
    let n,dl;const pt=p.t;p.t=now;
    if(r.act&&r.act.type==='critwatch'){const u=(tS+r.id*1.7)*FOOTRATEC;n=Math.ceil(u*2-.5-1e-9);dl=((n+.5)/2-u)/FOOTRATEC}
    else{const m=typeof WLKD!=='undefined'&&WLKD.get(r);if(!m||!pt||now<=pt)continue;const v=d/((now-pt)/1000)*WALKPT*2,u=m.d*WALKPT*2-.5;/* v：1秒に何歩・u：描いた絵の歩（整数の所で足がつく） */n=Math.ceil(u-1e-9);dl=(n-u)/v}/* 足がつくのは、動きの 1/4 と 3/4 */
    if(n>p.n&&dl<=FOOTLOOK){p.n=n;const q=sfxPos(r.x,r.y);if(q)L.push([r,q,dl,'foot'])}}
  if(L.length){L.sort((a,b)=>b[1].v-a[1].v);for(const[r,q,dl,kd]of L.slice(0,FOOTN)){if(kd==='ladder'){footSoft('ladder',q,LADV,1,dl);continue}const k=footMat(r.x,r.y);footSoft(k,q,FOOTV*(k==='twater'?.6:1),k==='twater'?1.3:1.15,dl)}}/* 小さな体なので、少し高く */
  if(S.enemies&&S.enemies.length){const E=[];for(const e of S.enemies){if(!(e.hp>0)){EFOOTP.delete(e);continue}const p=EFOOTP.get(e);if(!p){EFOOTP.set(e,{x:e.x,y:e.y,n:-1e9});continue}const d=Math.hypot(e.x-p.x,e.y-p.y);p.x=e.x;p.y=e.y;if(d>2||d<.003)continue;
      const u=(tS+e.id*1.3)*3,n=Math.ceil(u-1e-9),dl=(n-u)/3;/* 歩きの絵は6コマ／秒。2コマごとに1歩 */if(n>p.n&&dl<=FOOTLOOK){p.n=n;const q=sfxPos(e.x,e.y);if(q)E.push([e,q,dl])}}
    E.sort((a,b)=>b[1].v-a[1].v);for(const[e,q,dl]of E.slice(0,EFOOTN)){const k=footMat(e.x,e.y),D=typeof EN!=='undefined'&&EN[e.type];footSoft(k,q,EFOOTV*(k==='twater'?.6:1),(k==='twater'?1.1:.85)/Math.pow(Math.max(1,D&&D.size||1),.35),dl)}}}/* コワイノ：ひくく（大きいほどひくく）、とても小さく */
setInterval(footTick,100);
/* 朝6時・夜12時の音（dayChimeTick）：時計がその時刻をこえたら1回だけ鳴らす（ARK の日の出・日の入りのように）。遊んでいるあいだの曲ではなく、短い音だけ。
   村を切りかえた・読みこんだときは、こえたことにしない（CHIMEH を今の時刻にそろえる）。思い出の場面では鳴らさない */
const CHIMEV=.21,CHIMEIN=5,CHIMEOUT=15;let CHIMEH=null,CHIMES=null;
function dayChimeTick(){if(!S||!started){CHIMEH=null;return}const h=hour();if(CHIMES!==S||CHIMEH==null||typeof IS_STORY_REPLAY!=='undefined'&&IS_STORY_REPLAY){CHIMES=S;CHIMEH=h;return}
  const p=CHIMEH;CHIMEH=h;const cross=x=>p<x&&h>=x&&h-p<3;let k=cross(6)?'dawn':p>h&&p-h>12&&p>=21?'midnight':'';if(!k)return;/* 24時をこえたら、夜12時 */
  if(!AC||!SND.sfx||AC.state!=='running')return;const b=(SBUF[k]||[]).find(Boolean);if(!b)return;
  const src=AC.createBufferSource(),g=AC.createGain(),t=AC.currentTime;
  const D=b.duration,fadeIn=Math.min(CHIMEIN,D/4),fadeOut=Math.min(CHIMEOUT,D-fadeIn),N=Math.max(64,Math.ceil(D*30)),C=new Float32Array(N);
  for(let i=0;i<N;i++){const x=i/(N-1)*D;C[i]=x<fadeIn?CHIMEV*(x/fadeIn)**2:x>D-fadeOut?CHIMEV*Math.pow(Math.max(0,(D-x)/fadeOut),4):CHIMEV}/* はいりは、ゆっくり。おわりは、長く、だんだん小さくなって、いつ消えたかわからないくらいに。1本の曲線にする（曲線のはしに、べつの予定をおくと、Safari でエラー） */
  src.buffer=b;
  g.gain.setValueCurveAtTime(C,t,D);
  src.connect(g);g.connect(sfxG);src.start(t)}/* 和音なので、高さはゆらさない */
setInterval(dayChimeTick,200);
function sfxPos(x,y){/* マップの場所の音の大きさ・左右・こもり（{v,p,l}）。聞こえないほど遠ければ null */const vw=VW/cam.z,vh=VH/cam.z,q=w2s(x*TS,y*TS),qx=(q.x-VW/2)/cam.z,qy=(q.y-VH/2)/cam.z,d=Math.hypot(qx,qy),R=Math.max(vw,vh)*.8/* 画面の上の道のり（クォータービューも） */,v=Math.pow(Math.max(0,1-d/R),1.5);if(v<.04)return null;
  const zr=Math.max(.6,Math.min(1.4,cam.z/(typeof homeZ==='function'?homeZ():cam.z))),dx=qx/(vw/2);/* 拡大すると近くで聞こえる（少し大きく、高い音までくっきり） */
  return{v:v*(.85+.15*zr),p:Math.max(-.75,Math.min(.75,dx*.75)),l:Math.min(18000,1100*Math.pow(15,v)*zr)}}/* 画面の左の音は左から。遠いほどこもる */
function sfxAt(k,x,y,m=1){if(!S||VBG)return;{const g=k.startsWith('ea_')?'ea_':k;/* 食べる音は、だれが食べていても、まとめて EATGAP 秒に1回（何人も食べていると、ずっと口の音になる） */if(SFXGAP[g]){const n=performance.now()/1000;if(n-(SFXLAST[g]||0)<SFXGAP[g])return;SFXLAST[g]=n}}const q=sfxPos(x,y);if(!q)return;
  SFXV=q.v*m;SFXP=q.p;SFXL=q.l;
  try{sfx(k)}finally{SFXV=1;SFXP=0;SFXL=0;SFXO=null}}
const gainB=()=>SND.bgm?.1085*(SND.bv??1):0,gainS=()=>SND.sfx?.15*(SND.sv??1):0;/* 音楽・効果音の音量（0〜1） */
function setSnd(k,v){SND[k]=v;saveSnd();if(AC){bgmG.gain.setTargetAtTime(gainB(),AC.currentTime,.1);sfxG.gain.setTargetAtTime(gainS(),AC.currentTime,.1)}}
