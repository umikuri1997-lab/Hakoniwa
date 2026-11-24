# せいれいのキャラクターモデル（ボーン入り）

作りかた：`python3 tools/art/spirit3d/model_blend.py handoff/files/spirit-model`

## ファイル
- `spirit_model.blend`：5つの属性ぜんぶ。はじめは土だけ見えている。
  - コレクション `common`：体（`body`、1つのメッシュ）・アーマチュア（`spirit_rig`）・下絵（`ref_front`・`ref_side`）
  - コレクション `earth`・`water`・`fire`・`wind`・`wood`：ずきん・頭の上の物・しっぽ（風ははね）・目・ほっぺ
- `spirit_<属性>.glb`：属性ごと（モディファイアは適用ずみ）。
- `ref_front.png`・`ref_side.png`：下絵（いまのゲームの土のせいれい）。

## 体（`body`）
- ボックスモデリング：胴とあたまは四角ポリゴンの輪をつみ、上と下はグリッドでふさいだ形。うでは胴の横から、足は底から押し出した。
- モディファイア：ミラー（X）→ アーマチュア → サブディビジョン（2）。どれも適用していない。メッシュは +X の半分だけ。
- マテリアル：`body`（体）・`hand_<属性>`（手。いまは土の色。属性ごとの色のマテリアルも入れてある）・`foot`（足）。

## ずきん（`hood_<属性>`）
- 輪をつんだ形で、顔の所をあけてある。ソリディファイ（厚み）とサブディビジョンがついている。
- 頭の上の物・しっぽ・はねは、チップの絵の形を板にして厚みをつけた物（ベベルつき）。

## 目・ほっぺ
- べつのメッシュ（`eye.L_<属性>` など）。`head` の骨にだけついている。

## 骨
root・hips・spine・neck・head・hood_tip・shoulder・upper_arm・forearm・hand・thigh・shin・foot（.L／.R）・tail
- 体は自動の重み（ボーンヒート）。.R の重みはミラーがつける（.R のグループは、からのまま）。
- ずきんは head と hood_tip、ほかの部品は1本の骨にだけついている。
- 1ドット＝1cm。正面は Blender の −Y。.L は Blender の +X。
