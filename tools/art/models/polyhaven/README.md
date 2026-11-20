# Poly Haven のモデル

Poly Haven（polyhaven.com）のモデル。どれも CC0（だれでも自由に使える）。3Dのお手本（`blueprint.py` の `model`、パスは `polyhaven/<名前>.glb`）でだけ使う。ゲームには入れない。

- 一覧の絵：`catalog.png`（`python3 tools/art/models/polyhaven_catalog.py` で作る。家具と同じ写し方）。
- おとし方：`python3 tools/art/models/polyhaven_fetch.py <一時フォルダ> [名前...]`。1k の glTF から、色のテクスチャだけのこした glb にする（法線・ARM はすてる）。面が2万より多い物（岩・切り株・宝箱・ろうそく立て・かご）は、テクスチャの色を点ごとの色にうつして、面を2万にへらしてある。
- ネット：`api.polyhaven.com`・`dl.polyhaven.org` を環境の許可に入れてある。User-Agent がないと 403。一覧の小さな絵（`cdn.polyhaven.com`）は、許可していない。
- 入れた物：岩（rock_moss_set_01・02 は6こ・7こ入りのセット、boulder_01、namaqualand_boulder_02）・切り株（tree_stump_01・02）・木の家具（いす・ロッキングチェア・ベンチ・ソファ・スツール・テーブル・ピクニックテーブル・キャビネット・棚・本棚・引き出し・たる・バケツ・木箱・かご・宝箱・プランター・ランタン・ろうそく立て）。
- 気をつけること：
  - Poly Haven の木・しげみは、葉が板の写真（すけるテクスチャ）なので、いまの写し方では、ばらばらの点になる。入れていない。
  - 色はテクスチャのまま（少し暗い）。トリポのような色のととのえ（`model_tris` の `tripo/`）はしていない。使うときは、設計図の `p.recol` などで色をつける。
  - いくつかのモデルは、1つのファイルに何こかならんでいる（rock_moss_set）。
