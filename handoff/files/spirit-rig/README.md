# せいれいの3Dモデル（ボーン入り）

作りかた：`python3 tools/art/spirit3d/export_blend.py handoff/files/spirit-rig`
（ゲームの動きの絵を写すときと同じ形 `tools/art/spirit3d/core.py` の `Spirit` を、メッシュにした物）

## ファイル
- `spirit_rig.blend`：5つの属性ぜんぶ。コレクション `common`（どの属性も同じ：体・足・うで・アーマチュア）と、属性ごとの `earth`・`water`・`fire`・`wind`・`wood`（手・頭（ずきん＋顔）・頭の上の物・しっぽ／風のはね）。はじめは土だけ見えている。
- `spirit_<属性>.glb`：属性ごとに、`common` とその属性だけ。

## ボーン（ゲームの動きの数と同じ、回す中心）
| ボーン | 親 | 回す中心 | ゲームの数 |
|---|---|---|---|
| root | なし | 足もと | — |
| body | root | 腰 (高さ11) | lean・roll・yaw |
| head | body | 首 (高さ26) | hp・hr・hy |
| leg.L / leg.R | root | また (左右8・高さ11) | legM・legP・lift |
| arm.L / arm.R | body | かた | sN/bN/tN・sF/bF/tF |
| hand.L / hand.R | arm | 手首 | kN・kF（道具） |
| tail | body | おしり | tail |
| tip_・sprout_・vine_・ember_<属性> | head | 頭の上の物の根もと | top・topz |
| wing0〜3_wind | body | はねの根もと | wing |

- 部品ごとに1本のボーンに重み1（いまのゲームの写し方と同じ、かたい部品）。
- 大きさ：1ドット＝1cm（せいれいの高さ 約0.9m）。正面は Blender の正面（−Y）。`.R` はせいれいの右（正面から見て左）。
- うでは、正面の絵と同じ角度に開いた形。
- 色は点の色（`Col`）。目・ほっぺ・まつげは入れていない（ゲームでかさねる）。
- 風のはねは、ゲームでは向きごとに置き方をかえる板なので、ここでは正面の向きの置き方。
