# 3Dのお手本に置く、フリーの3Dモデル

どれも CC0（だれでも自由に使える）。3Dのお手本（`blueprint.py` の `model`）でだけ使う。ゲームには入れない。

- `kenney/furniture`：Kenney「Furniture Kit」（www.kenney.nl、CC0）。はち植え（plantSmall1〜3・pottedPlant）・本（books）。
- `kenney/food`：Kenney「Food Kit」（www.kenney.nl、CC0）。にんじん・キャベツ・りんご・トマト・びん・かぼちゃ。
- `kenney/nature`：Kenney「Nature Kit」（www.kenney.nl、CC0。`License.txt`）。はち（pot_small・pot_large）。

取ってきた所：GitHub にある Kenney のキットの写し（ネットの制限で kenney.nl から直接は取れなかった）。
- `quaternius`：Quaternius「Ultimate House Interior Pack」（quaternius.com、CC0）の観葉植物（Houseplant_1〜8、OBJ と MTL）。はちの灰色は、3Dで読むときにやきものの色にかえる（`blueprint.py` の `POTCOL`）。
- `kenney/nature` の丸太（log・log_large・log_stack）・石（stone_small・rock_small）も Nature Kit。モデルが材質の色だけを持つときは、その色を使う（`blueprint.py` の `model_tris`）。
- `tripo`：くわしくは `tripo/README.md`（一覧の絵 `catalog.png`・置き方・気をつけること）。持ち主がトリポ（Tripo）で作った小物のモデル（1つのモデルに入っていたのを、1つずつに切りわけた。色は点ごと）。はち植え（plant）・あさぶくろ（sack・sacks2）・つぼ（jar_band・terracotta）・ろうそく（candle）・ランタン（lantern）・じょうろ（wateringcan）・やさい（veggies）・バスタブ（bathtub）・やさいをのせたまな板（cutboard）・小鳥（bird：水飲み鳥のモデルから、鳥だけをとりだした）。
- `tripo`（2回め）：持ち主がトリポで作った植物・自然の物（プロンプトは `tripo/prompts.md`）。1つのモデルに21こ入っていたのを `tools/art/models/tripo_split.py` で切りわけ、名前をつけた：つるばら（rosevine）・白いばら（rose）・ばらの葉の小枝（roseleaf）・オーク（oak）・オークの枯れ木（oak_dead）・杉（cedar）・メープル（maple）・アカシア（acacia）・りんごの木（appletree）・ベリーの茂み（berrybush。実はついていない）・竹（bamboo）・たけのこ（takenoko）・岩（rock）・シロツメクサ（clover）・ききょう（bellflower）・サルビア（salvia）・ゆり（lily）・ハス（lotus）・きのこ3しゅるい（mushrooms）・草（grass・grass2）。
