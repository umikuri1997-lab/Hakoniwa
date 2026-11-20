# トリポ（Tripo）の3Dモデル

持ち主がトリポで作ったモデル（.glb）。3Dから写す家具・建物（`tools/art/furn3d`）の部品として置く。ゲームにはそのまま入れない（写したドット絵だけがゲームに入る）。

- 一覧の絵：`catalog.png`（どれも家具と同じ写し方。1マス64ドットのゲームの見え方）
- 大きさの表：`catalog.json`（`w_per_h`・`d_per_h`：もとの形の、高さに対するよこ・おくゆきの比。`tris`：三角形の数。`catalog_h`：一覧で写した高さ（マス））
- 作りなおし：`python3 tools/art/models/tripo_catalog.py`（モデルを足したら、そのファイルの `SIZE` にも足す）
- たのんだときのプロンプト：`prompts.md`（2回めの植物・自然の物、3回めの伐採場・採石場の物）

## 置き方

設計図（`furn3d/items/<id>.py`）の部品に、こう書く。

```python
P('名前','model',('tripo/oak.glb', cx, cy, z0, size, rot, tilt), on=('ground',), note='地面に置く')
```

- `cx, cy`：置く所（マス。モデルの左右・おくゆきのまん中がここに来る）
- `z0`：下のはしの高さ（マス）
- `size`：高さ（マス。たおす前のモデルの高さ）。よこ・おくゆきは、もとの比のまま（`catalog.json`）
- `rot`：上から見て、まわす角度（度）。`tilt`：よこ（東西）にたおす角度（度）
- モデルの正面（glTF の +Z）が南（手前）を向く

色は、読むときに、くらい色・色むらをへらし、あざやかにしてある（`blueprint.py` の `model_tris`）。色をかえるときは、部品に：

- `p.recol=(R,G,B)`：その色に、モデルの明るさのちがいだけをのこす（`p.recolk` 0〜1：のこす量。0でむらなし）
- `p.recol2=(さかい,色1,色2)`：明るさでさかいを分けて2色に（あさぶくろのひも・ふくろ）
- `p.olk=0.86`：輪郭線をうすく（細い物・小さな物）

使っている例：`asabukuro.py`・`kabebukuro.py`・`niguruma.py`（sack）、`shelf2.py`（jar_band・terracotta・plant）、`monstera.py`（plant の葉を1まいずつ）。

## モデルの一覧

| ファイル | なに | 向き・形 | 気をつけること |
|---|---|---|---|
| `plant.glb` | はち植え | 立つ | |
| `sack.glb` | あさぶくろ（1つ） | 立つ | 色は `recol`・`recol2` でかえて使っている |
| `sacks2.glb` | あさぶくろ（2つ） | 立つ | |
| `jar_band.glb` | 帯のあるつぼ | 立つ | |
| `terracotta.glb` | まるいつぼ | 立つ | |
| `candle.glb` | ろうそく | 立つ | 火は粒（`PFIRE`）で足す |
| `lantern.glb` | ランタン | 立つ | |
| `wateringcan.glb` | じょうろ | 立つ | |
| `veggies.glb` | やさいのやま | 立つ | よこに広い（高さの1.8倍） |
| `bathtub.glb` | バスタブ | 立つ | |
| `cutboard.glb` | やさいをのせたまな板 | ひくい | |
| `bird.glb` | 小鳥 | 立つ | とても小さく写すと形がわからない |
| `rosevine.glb` | つるばらの枝 | たて長 | 小さく写すと、ばらが灰色っぽくなる |
| `rose.glb` | 白いばら（1りん） | 花が上 | 1マス64ドットで0.1マスほどだと、花びらがくずれて見える。小さな花は、まるい部品で作るほうがよい（`arch.py`） |
| `roseleaf.glb` | ばらの葉の小枝 | ねかせた形 | |
| `oak.glb` | おおきな木 | 立つ | |
| `oak_dead.glb` | おおきな木の枯れ木 | 立つ | |
| `cedar.glb` | とんがりの木 | 立つ | |
| `maple.glb` | ゆうやけの木（秋の色） | 立つ | |
| `acacia.glb` | ひらたい木 | 立つ | |
| `appletree.glb` | りんごの木 | 立つ | |
| `berrybush.glb` | ベリーの茂み | 立つ | 実がついていない（実は部品で足す） |
| `bamboo.glb` | 竹 | 立つ | |
| `takenoko.glb` | たけのこ | 立つ | |
| `rock.glb` | 岩 | 立つ | |
| `clover.glb` | シロツメクサ | ひくい | |
| `bellflower.glb` | ききょう | 立つ | |
| `salvia.glb` | サルビア | 立つ | |
| `lily.glb` | ゆり | 立つ | |
| `lotus.glb` | ハス | 水にうく | |
| `mushrooms.glb` | きのこ3しゅるい | 立つ | |
| `grass.glb`・`grass2.glb` | 草 | 立つ | |
| `stump.glb` | 切り株（根が放射状） | 立つ | 色なし（`recol`）。根は `warp` でちぢめて使っている（`lumber.py`） |
| `stone_big.glb`・`stone_mid.glb` | 切り出した石（大・中） | 立つ | 色なし |
| `stone_round.glb` | まるい石 | 立つ | 色なし |
| `stone_slab.glb` | 平たい石 | ひくい | 色なし。よこに広い（高さの3倍） |
| `stone_chunk.glb` | 石のかけら | 立つ | 色なし |
| `pebbles2.glb`・`pebbles3a.glb`・`pebbles3b.glb`・`pebble_a〜c.glb` | 小石（2こ・3こ・1こ） | ひくい | 色なし |
| `log_lying.glb` | ねかせた丸太 | ねかせた形 | 色なし。モデルの中でななめを向いているので、向きは上から見ていちばん長い向きでしらべる（`lumber.py`） |
| `firewood.glb` | わったまき（3つ） | ねかせた形 | 色なし |
| `sprig.glb` | 葉の小枝 | 立つ | 色なし |
| `nat_tree.glb` | 草原の木（自然物のチップ tree・ntree・fruit・fruit#mi） | 立つ | 目じるしの色（幹・葉）。`tools/art/nature3d/nature_prep.py` で作る。設計図は `furn3d/items/nat_*.py` |
| `nat_deadtree.glb` | 枯れ木（deadtree） | 立つ | 同上 |
| `nat_bush.glb` | ベリーの茂み（berry） | 立つ | 同上 |
| `nat_cedar.glb`・`nat_cedar2.glb` | とんがりの木（tree~v・deadtree~v） | 立つ | 同上 |
| `nat_kinoko0〜2.glb` | きのこ（kinoko#0〜2） | 立つ | 目じるしの色（かさ・かさのうら・じく） |
| `ck_mugi.glb`・`ck_imo.glb`・`ck_sashimi.glb` | むぎのたば・いも・さかなの切り身（料理の家具の上の材料・さしみ） | ねかせた形 | 色なし。`furn3d/cooktop.py` で `recol` |
| `ck_berry.glb`・`ck_milk.glb`・`ck_salad.glb` | ブルーベリー・ミルクのびん・サラダのボウル | 立つ | 色なし。`cooktop.py` の `model2` で、高さ・場所で2つの色にぬりわける（葉・ふた・ボウル） |

植物・自然の物（`rosevine` から下）は、1つのモデルに21こ入っていたのを `tools/art/models/tripo_split.py` で切りわけた（つながっている形ごとに分け、色は UV からとって点ごとの色に）。モデルを新しくもらったときも、同じように切りわけて、ここの一覧と `catalog` を足す。

4回め（`nat_*`）は、自然物のチップ用。持ち主の色なしの FBX を `tripo_split.py`（`--faces 20000`）で切りわけ、`nature_prep.py` で部品ごとに目じるしの色をつけた（色そのものは設計図の `recol`・`decal`）。

3回め（`stump` から下）は、色のない FBX（y が上）。`tripo_split.py` は、上の向きを自分でみつけ、面の向きをそろえ、面を3000までへらす。色は設計図で `recol` する。

6回め（`ck_*`）は、料理の家具の上の材料・料理用。色のない glb を `tripo_split.py` で切りわけた（プロンプトは `prompts.md` の「6回め」）。

7回め（`gf/`）は、限定の家具25こ（`g_w_*`・`g_e_*`・`g_f_*`・`g_k_*`・`g_s_*`、設計図は `furn3d/items/g_*_t.py`）。持ち主の1つの glb（たての壁のようにならべた形）を `tripo_split.py --wall --tex --keepuv` で切りわけた（形はへらさず・分けず、UV をのこす。テクスチャの絵は `gf/tex.png` の1まい）。色は写すときに、ドットごとにテクスチャの絵からとる（設計図の `p.uvtex`、`blueprint.uvdecal`）。形も色もトリポのまま（かたむきを直すと形がくずれる。持ち主がきめた）。かげと質感はマットキャップ（`tools/art/matcap.py`、設計図の `MATCAP`）、スムーズシェードは80度（`SMANGLE`）。それぞれの家具の専用なので、`catalog` には入れない。
