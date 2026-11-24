---
paths:
  - "js/tsuchi*.js"
---
# 土のステージ

`CLAUDE.md` の決まりのつづき（この話題の作業をするときに読む）。ぶつかったら `CLAUDE.md` が先。洞窟は `cave.md`。

## 土のステージ（ひびわれた岩の谷）
- ステージ番号は2（`TSUCHI`、WORLD 3）。火山でヌシ様をむかえたら、ひらく（とじたカードを5回タップでもひらく）。お話は「ちいさなあなぐま」（`IDEAS.md`・`STORY.md`）。PRのならびと進みは `STATE.md`。
- はじめからいるのはトト（土、ねばりづよい）。2人めのキーキャラはコノハ（木）。お話に出る火のせいれいはイブキ。村は夕方16時からはじまり、はじまりの地ゆれ（`tsIntro`：カメラが巣穴へ・ゆれ・トトがころがり出る）のあとに会話。
- 地われ：北のはしから南のはしへ、谷をたてに割る1本（`tsRift`）。ground 1 で、マップのはしにつながる所が地われ（`riftM`・`riftJ`。雲の海と同じ作り・セーブには入れない）。水のふるまいは `waterJ` で見る（地われは水ではない）。歩けない・置けない・橋はかけられない。せまい自然の岩の橋（`TSBRY` の2行）が1つ。
- 谷：東・西・北のまわりは高いがけ（`tsWallK`）。川はない。北のがけのふもとに、あなぐまの巣穴（`anagura`。こわせない・うつせない）。洞窟の入口になる。
- 土の物（数は実数・`STAGEONLY` 土・作るのは土のせいれい）：日干しれんがの壁・岩をくりぬいた壁・木のいた戸・石ころの垣と、その戸（`ishidoor`。ほかのステージの「柵のドア」とはべつの物）・砂岩の塀とドア・岩のアーチの門。木はオリーブ（`~t`）、雑草はいわ草 `weed2g`・かれすすき `weed2k`、花はいわかがみ（はじめから植えられる）。素材は砂岩（谷の岩をほると、まず砂岩 `TSSAGAN`、持てる数ののこりで石材）。草原の草を使う家具は `mat2`。
- 土の自然の物の絵（3Dから。トリポ8回め `tools/art/tsuchi/tsuchi_prep.py` → `furn3d/items/nat_olive.py`・`nat_olive_dead.py`・`nat_iwakusa.py`・`nat_susuki.py`・`nat_iwakagami.py`・`nat_sandrock.py`、`iso3d.py`）：オリーブ `tree~t`・枯れたオリーブ `deadtree~t`・いわ草 `weed2g`・かれすすき `weed2k`・いわかがみ・砂岩の大岩 `rock~t`（谷の岩は `chipOf` で `rock`+`stg().sx`）。素材のアイコン（砂岩・いわ草・かれすすき）は、同じ3Dの絵から `tools/art/tsuchi/earth_mat_icons.py`。表紙は `cover3d.py`（オリーブもそのマスの大きさで写して立てる）。
- 地われ・岩の橋は、3Dのタイルセット（`tools/art/tsuchi/rift3d.py`、`tsRiftDraw`）。巣穴は `furn3d/items/anagura.py`。
- 夜のコワイノは、まだ来ない（`S.flags.calmNight`。夜のPRで地われから来る）。
- たしかめは `tools/tests/tsuchi-stage.cjs`。
