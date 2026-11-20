# Quaternius のモデル

Quaternius（quaternius.com）のモデル。どれも CC0。3Dのお手本（`blueprint.py` の `model`、パスは `quaternius/<パック>/<名前>.glb`）でだけ使う。ゲームには入れない。
すぐ下の Houseplant_1〜8 は、前に入れた「Ultimate House Interior Pack」の観葉植物。

- おとし方：`python3 tools/art/models/quaternius_fetch.py <一時フォルダ> [パック...]`（OpenGameArt にある Quaternius のパックから。quaternius.com のダウンロードは Google ドライブ）。
- 一覧の絵：パックごとの `catalog.png`（`python3 tools/art/models/quaternius_catalog.py [パック...]`。家具と同じ写し方、いちばん長い辺をそろえて写す）。
- パック：
  - `furniture`：Furniture Pack（23こ。ベッド・本棚・いす・クローゼット・テーブル・ソファ・ランプ・はち植え・花びん）。もとの色がファイルにないので、材質の名前から、見本の絵の色をつけた（`NAMECOL`）。
  - `furniture2`：Furniture Pack Vol.2（8こ。ソファ・テーブル・いす・スツール・古いテレビ）。色はテクスチャの平均の1色だけ。
  - `food`：Ultimate Food Pack（103こ）。
  - `props`：Fantasy Props MegaKit（94こ。たる・本・びん・ろうそく・宝箱・木箱・なべ・道具など）。テクスチャの色を点ごとの色にうつしてある。
  - `survival`：Survival Pack（53こ。たき火・テント・道具など）。
- 気をつけること：モデルの正面の向き・大きさは、パックごとにちがう。使うときに `rot` と高さでそろえる。
