# 3Dのお手本に置く、フリーの3Dモデル

どれも CC0（だれでも自由に使える）。3Dのお手本（`blueprint.py` の `model`）でだけ使う。ゲームには入れない。

- `kenney/furniture`：Kenney「Furniture Kit」（www.kenney.nl、CC0）。はち植え（plantSmall1〜3・pottedPlant）・本（books）。
- `kenney/food`：Kenney「Food Kit」（www.kenney.nl、CC0）。にんじん・キャベツ・りんご・トマト・びん・かぼちゃ。
- `kenney/nature`：Kenney「Nature Kit」（www.kenney.nl、CC0。`License.txt`）。はち（pot_small・pot_large）。

取ってきた所：GitHub にある Kenney のキットの写し（ネットの制限で kenney.nl から直接は取れなかった）。
- `quaternius`：Quaternius「Ultimate House Interior Pack」（quaternius.com、CC0）の観葉植物（Houseplant_1〜8、OBJ と MTL）。はちの灰色は、3Dで読むときにやきものの色にかえる（`blueprint.py` の `POTCOL`）。
- `kenney/nature` の丸太（log・log_large・log_stack）・石（stone_small・rock_small）も Nature Kit。モデルが材質の色だけを持つときは、その色を使う（`blueprint.py` の `model_tris`）。
