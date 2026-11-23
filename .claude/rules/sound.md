---
paths:
  - "js/audio.js"
  - "js/feel.js"
  - "js/work-fx.js"
  - "js/ui-fx.js"
  - "tools/sound/**"
---
# 音

`CLAUDE.md` の決まりのつづき（この話題の作業をするときに読む）。ぶつかったら `CLAUDE.md` が先。

## 見た目
- 録音の音の出はじめ・曲のビートをはかるときは librosa（`librosa.onset.onset_detect`・`librosa.beat.beat_track`。環境のセットアップで毎回入れる）。ゲームの中では動かさない。
- ffmpeg で mp3 を書き出すときは、ファイルに書く（パイプ `-` に書くと、はじめの情報が入らず、読みこむと長さがかわる）。
- 効果音は、こちらで作らない（持ち主がきめた）。音は、本物の録音・持ち主がくれた音・効果音ラボなどの、できている音からえらぶ（切る・大きさをそろえるだけ。オシレーターやノイズで音を組みたてない。作るスクリプトも足さない）。前からある作った音は、そのまま。
- UIの音は、やわらかく小さく近い音（ASMRのよう）：木をそっとたたく `knock` と、こすれる `rustle`（`audio.js`）。ボタンは、もらった音（`tap`：`SAMPLES.click`）。画面をひらく・とじる `open`・`close`、数がふえる `count`、葉・火の粉 `leaf`・`crackle`。ピーという電子音（square）を、新しいUIの音に使わない。
- UIの手ざわりの音は、本物の録音（Kenney の CC0。`tools/sound/ui_asmr.py` で、切る・低い音と高い音をけずる・大きさをそろえる）を、鳴らすたびにべつの録音・少しちがう高さで鳴らす（`playU`）：ハンコ `stamp`・木くず `dust`・なわのきしみ `creak`・板のしなり `bend`・タブ `tab`（`.ctab` をおすと、そのボタンの音のかわりに `SFXTAB`）・±の `notch`・行の `rowin`。計算で作る音は、ゲージ `glug`・ぽよん `boing`。音のさがし先：Openverse（`python3 tools/sound/openverse.py "<ことば>" --license cc0`。freesound などの録音をライセンスつきでさがせる。使う前に、もとのページでライセンスをたしかめる）。freesound は機械からのアクセスをことわる（Openverse で見つけた freesound の音も、おとせるかはまだたしかめていない）。OpenGameArt はとどく（CC0 でも、説明に as3sfxr・sfxr とある物は作った音なので、本物の声のかわりにしない）。Kenney は、アセットのページをクッキーつきで開いてから、`download-link/<data-download-id>` を同じクッキー・Referer・ブラウザの User-Agent でよび、かえってきた url を同じようにおとす。小さな生き物のかわいい声は、本物の動物の録音より、人の声で作った声（OpenGameArt「80 CC0 creature SFX」）を高くしたほうが、持ち主にえらばれた。
- 「みる」でタップした地面・床（物のない所）は、その場所の足音の録音（`footMat`：`fgrass`・`fsoil`・`fwood` など）。畑・土の音 `tsoil` も足音の土の録音（前の録音は太鼓のように聞こえた）。
- 「みる」でタップした物の音は材質で分ける（`tapSnd`・`tapMatOf`：木 `twood`・石 `tstone`・金物 `tcan`・布 `tcloth`・植物 `tgrass`・畑と地面 `tsoil`・水 `twater`・草原の御神木と切り株 `tsacred`（太い木）・神殿と台座は石。家具は `BL` の `mat`）。音は本物の録音（`ui_asmr.py` の同じ名前。水・かれ葉・スコップは OpenGameArt の CC0）を `playU` で鳴らし、読みこむ前だけ作った音。コワイノ `tfoe`・クモの巣 `tweb`・生き物 `tani`・置く場所 `tplace` も同じ。物の音が鳴ったタップでは、画面がひらく音・葉の音をかさねない。ほかの物の音がそのタップで鳴ったら、そちらだけ。たしかめは `tools/tests/tap-sound.cjs`。
- せいれいどうしのおしゃべり（`chat`・ベンチの `rest`）は、会話の声（`SAMPLES.voice`）を、話す子の声の高さで短く切って、かわりばんこに小さく鳴らす（`chatMurmur`：会話の声の `CHATK` 倍、マップの場所の音と同じく左右・遠いほど小さく。会話の画面の声が出ているあいだは鳴らさない）。たしかめは `tools/tests/chat-voice.cjs`。
- せいれいがよろこぶ音（`sfx('good')`）は、カリンバを高くしたオルゴールの「ちりりん」（`SAMPLES.joyc`）。なべの料理の音（`potclk`）は、ぐつぐつにえる音（`SAMPLES.potg`）。どちらも持ち主が5つ・4つの候補から聞いてえらんだ CC0 の録音（`tools/sound/joy_pot`、出どころは `credits.json`）。
- 収穫（`harvest`）・木の実やたけのこをとる（`gather`）は、はじめにガサゴソ（`bush`）、とりおわったら、かれ葉がこすれる本物の録音（`harvdone`、`tools/sound/harvest_done.py`。持ち主がえらんだ）。
- ひろった物の音（`itemSnd`・`itemMat`、`audio.js`）：せいれいが落とし物・たねをひろったとき（`takeDrop`・`pickseed`）と、図鑑のアイコンをタップしたとき（`zkSnd`、`add` の4つめ）は、ピロンという音ではなく、その物の材質の録音（「みる」でタップしたときと同じ `twood`・`tstone`・`tcan`・`tcloth`・`tgrass`・`tsoil`・`twater`）。素材は 木・枝・竹→木、石・鉱石→石、空き缶・延べ棒→金物、布・わた毛→布、草→植物、食べ物→植物（魚は水）。マップの場所の音は `sfxAt('pick_'+材質,x,y)`。きのこをタップは `tpuni`（ぷにっ）、ちょうの鳴き声は `cv_chou`（持ち主の羽音）。ボタンでない所のタップは `uknock`（木をそっと：`ui-fx.js` の最後。キャンバス・ボタン・onclick のある物は鳴らさない）。同じ音は 0.07 秒以内に2回鳴らない（`lastSfx`）ので、テストで続けて鳴らすときは `lastSfx` を消す。
- 作業の手もとの音（`work-fx.js` の `WBEAT`）：畑づくり `till`（くわが土にささる所、`wtill`。持ち主の音を1回ぶんずつ切った8こ `tillhit` からえらぶ）・たね・苗 `sow`・`plant`（手が土にふれる、`wsoil`）・収穫 `harvest`・`gather`（`wleaf`）・草むしり `weed`（`wweed`）・クモの巣 `sweep`（`wsweep`）も、動きの決まった所で鳴る（`draw-spirits.js` の `workBeat` をよぶ行動の一覧にも入れる）。はたおり機は録音（`shuttle`＝`shutl` すーっ・`loombeat`＝`loomk` ごとん）。水やり（`water`・`tend`）は、動き1回ごとではなく、持ち主の水の音（`pourw`、20秒）の3秒ぶん（`pourl`、`playPour`）を、おわる0.4秒まえに、2乗の和が一定になる形で重ねてつづける（`pourKeep`。1回ごとに鳴らすと、音の長さより動きの1まわりが長くて、とぎれる）。見張り台の弓は、うつとき（`bowT` を入れる所）に、ひきしぼる音（`bowdraw`、持ち主の音）。
- せいれいの足音（`footTick`、`audio.js`）：歩く3Dの動き（`walk`・`carry`）の、足がつくコマ（1まわりの1/4と3/4、1まわり 9/(2π) 回／秒）に合わせて、足もとの地面の音（`footMat`：草 `fgrass`・土と道 `fsoil`・木の床と橋 `fwood`・石 `fstone`・ラグ `fcloth`・冬の雪 `fsnow`・雨の日（あらしも）の外の草地・土・道はぬれた地面 `fwet`（家の中・橋・木と石の床や道はふつう）・浅瀬は水の音）を、とても小さく（`FOOTV`）。描くときの時刻（`now/1000+id*1.7`）と同じ時刻で、これから `FOOTLOOK` 秒のうちに足がつくなら、その時刻に予約して鳴らす（道のりで鳴らさない）。近い子から1回に2歩まで。寝ている子・止まっている子は鳴らさない。コワイノも歩きの絵の2コマごとに、ひくく・とても小さく（`EFOOTV`、大きいほどひくい）。ハシゴ（見張り台のハシゴ・ハシゴの上を動く）は、手をかけるたび（`sin(t*8)` が大きい所、π/8 秒ごと）にハシゴの音（`ladder`、`LADV`。段差のよじのぼりは鳴らさない）。録音は、草・土・木・石・雪・ぬれた地面が持ち主の録音（`tools/sound/src/foot/`、`tools/sound/footstep_rec.py` で1歩ずつ切る：足がつく所の5ms前から・声やほかの音の所はすてる・はじめ0.15秒の大きさを前の足音にそろえる）、ラグは Kenney の CC0（`ui_asmr.py`）、ハシゴは持ち主の木のきしみ（`tools/sound/owner_ladder_chou.py`：きしみ1回ぶんずつ、0.36秒まで）。たしかめは `tools/tests/footstep.cjs`・`tools/tests/new-sounds.cjs`（`footTick(now)` に時刻をわたせる）。
- すべる音（雨の水たまり・すべる水たまりの罠で、せいれい・コワイノがすべる `sfxAt('slip')`）は、持ち主がくれた効果音ラボの音から「シャッ」を2回ぶん切った物（`SAMPLES.slip`、`tools/sound/owner_slip.py`、もとは `tools/sound/src/owner_slip.mp3`）。
- 持ち主の音（弓・水やり・畑をたがやす・キラッ）は `tools/sound/owner_sfx4.py`、ハシゴ・ちょうの羽音は `tools/sound/owner_ladder_chou.py`（もとは `tools/sound/src/owner_*.mp3`。切る・大きさをそろえるだけ）。
- 設定の音のクレジット（出どころ）は、ボタンでひらくべつのポップアップ（`creditPop`・`CREDIT_TXT`）。音を足したら、ここにも書く。音量のバーは `input.vol`（彫りこんだみぞ・こげ色の中身・小さな板のつまみ。草原は木の色）。
- 音の優先順位（`audio.js`）：足音・作業の手もとの音・食べる音・水やり・箱のゴソゴソ・おしゃべり・あいさつの声・足もとの音は「うしろの音」の出口（`lowG`）へ通す（マップの場所で鳴らすときは `sfxLow`、じかにつなぐ所は `lowG||sfxG`）。大事な音（`DUCKK`：たっせい・ハンコ・なかま・コワイノに当たる・たおす・まもりの光・せいれいの攻撃・オオカゲ）が鳴ると、うしろの音と場所の音（`ambD`）を半分（`LOWDUCK`）にして、0.6秒（`LOWREL`）でもどす（`lowDuck`）。うしろの音は同時に8こまで（`LOWN`・`lowOK`）：いっぱいなら、画面のまん中に近い（`q.v` が大きい）音だけ入れかえる（もとの大きさでくらべると、小さいコワイノの足音が先に消える）。うしろの音を足したら、この出口へ通す。たしかめは `tools/tests/sound-priority.cjs`。
- 音のテストで、音を鳴らせるようにするために画面のまん中（450,350）をクリックすると、まん中の御神木の画面がひらいて村が止まる（`paused`）。クリックのあとで `closeSheet()`。うしろの音をつづけて鳴らすテストは、`LOWL.length=0` で前の音をかたづける（8こまでで、あとの音が鳴らない）。
- マップの音（`sfxAt`）は、画面の左右から聞こえ（`SFXP`）、遠いほど高い音がへる（`SFXL`）。拡大すると近く聞こえる。家の中を映す（屋根をはずした家が画面のまん中・ふだんの拡大より大きい `ambIndoor`）と、環境音がこもる（`ambF`）。

## 手ざわり・まとまり・間（ポリッシュ）
- 大きな場面（なかまが来る・オオカゲの登場・御神木が育つ）の前は、曲と環境音をしずかにして間をつくる（`musicDuck`・`quietBeat`）。
- 曲（BGM）は、オープニング（タイトル・マップえらび・プロローグ）と大会と火山のおまつりの日（`festOn`、大会のないとき `fest`）だけ。大会は、持ち主がえらんで送る曲（`tools/sound/cup_music.py`、もとの mp3 はリポジトリに入れない。動く大会は MusMus「BGM-141」で、音のクレジットに「BGM:MusMus」。のんびりした大会（つり・長めの大会）は魔王魂「fantasy05」、おまつりは魔王魂「ethnic09」）を、「3・2・1・どん！」から大会のあいだ（動く大会 `cupmove`・のんびりした大会 `cupcalm`、`CUPMOVE`）と表彰台（`cupaward`）でくりかえす（`cupMusicTick`。持ち主がきめた）。長い曲は `SAMPLES` に入れない（はじめにぜんぶ読みこむと1曲で約70MB）：`CUPSONG` に書き、鳴らすときだけ audio の要素で少しずつ読む。タイトルでは、はじめてさわったとき（どこでも）から鳴らす（ブラウザは、さわるまで音を出させない）。遊んでいるあいだは曲を鳴らさない（`sched` の `opening` のほか。持ち主がきめた）。「マップを読みこみ中…」の画面（`STLD`）だけは、読みこみ中の曲（OpenGameArt「JRPG Piano」CC0、`SAMPLES.ldmusic`・`ldMusicTick`、作り方は `tools/sound/load_music.py`）をくりかえし、おわったら1秒で消す（持ち主がえらんだ。たしかめは `tools/tests/load-music.cjs`）。ボスが出たときなどの効果音・環境音はそのまま。昼・夜・ボスの曲のデータ（`stageSong`・`SONGS`）は、のこしてある。朝6時（`SAMPLES.dawn`：魔王魂「orchestra03」）・夜12時（`SAMPLES.midnight`：魔王魂「healing11b」）に、曲のはじめ20秒をさいごを小さくして切った物（持ち主のたのみで前の2倍）（`tools/sound/maou_chime.py`。曲のファイルは魔王魂の決まりでリポジトリに入れない）を、1回だけ鳴らす（`dayChimeTick`。はいりは `CHIMEIN` 秒、おわりは `CHIMEOUT` 秒かけて、いつ消えたかわからないくらいに小さくする。ARK の日の出・日の入りのように。たしかめは `tools/tests/day-chime.cjs`）。
- iPhone は、さわったとき（touchend・click）の中で音を1つ鳴らさないと、タイマーであとから鳴らす音（曲）が出ない（効果音だけ鳴る）。pointerdown では音がひらかない。さわったときに、だまった短い音を鳴らす（`audioUnlock`）。
- 夜の環境音（虫の声）は大きさ0.5（`ambTick` の `want.night`）。
- 季節・時間の環境音（`ambTick`、効果音ラボの録音を `tools/sound/season_amb.py` で作る）：朝5時〜7時半は朝の音 `amb_morn`（どの季節も）。昼は春 `amb_spr`・夏 `amb_sum`、秋・冬は鳥の声 `birds`。夜は夏 `amb_snight`、ほかは虫の声 `night`。雨の日は雨の音だけ。
- 朝の体そう（`taiso`）のあいだは、体そうしている子みんなの声（のばした声 `SAMPLES.vowel` の `vNote`。近い子から `TAISON` 人。みんな同じ音 `TAISOK`。それぞれの声の高さ・ハモりは、持ち主がやめた。何人かのときは、子ごとに高さを ±12セント・こもり方を少しずつかえて合唱のように重ねる `taisoVoice`。まったく同じだと1人に聞こえる）で、子ごとにちょっとずつずらして（`taisoLag`。何人かのときは、音ごとにも0〜0.05秒ばらつかせる `TAISOJIT`）、小さく、体そうの曲のように（上がって下がる形のくりかえし・4拍ずつの頭を強く `TAISOWEAK`・音をきびきび切る `TAISOSTAC`・声をやさしくゆらす `TAISOVIB`。持ち主がきめた）、拍のはっきりした曲（`TAISOM`・1拍 `TAISOB`）をくりかえす（`taisoTick`。持ち主がきめた）。
- 焚き火・たいまつのそばの場所の音は、焚き火の録音（`SAMPLES.fire`、`feel.js` の `FEELRK`）。料理の火の音（`cookfire`）は、持ち主がくれたパチパチの音（`firecrk`、`tools/sound/owner_fire.py`、もとは `tools/sound/src/owner_fire.mp3`）。持ち主がきめた。
- 環境音は、朝と夕方にゆっくり入れかわり、夕方（17.5〜20時）だけ虫の声（その場でつくる音 `ambAccent`）。会話の文字の速さは話す人ごと（`speakerPace`）。

## 戦いの数字と手ざわり
- せいれいの攻撃の音（`atk_earth`・`atk_wood`・`atk_wind`・`atk_water`）は、持ち主がえらんだ本物の録音（`SAMPLES.atkE`・`atkW`・`atkK`・`atkS`、`tools/sound/atk_rec.py`。火はもらった音 `fireatk`）。
- コワイノに当たった音は「ぽふっ」（`ehit`・`SAMPLES.epon`、Kenney の録音、`hitFx` で当たって見える時刻に）。コワイノがせいれいをたたいた音も「ぽふっ」（`hitRes`）、たおした音は「さらさら」（`SAMPLES.kill`）。持ち主が「コワイノの音」のページできめた。
