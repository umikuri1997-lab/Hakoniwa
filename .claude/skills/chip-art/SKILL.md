---
name: chip-art
description: Hakoniwa で、持ち主からもらった絵（AIで作った透過PNG・シート）を、ゲームのマップチップ（ドット絵）にするときの手順。絵が送られてきたとき、「この絵を使って」「チップにして」「絵をたのむプロンプトを作って」と言われたとき、もらった絵がうまく使えなかったときに使う。
---

# もらった絵 → マップチップ

決まりは `CLAUDE.md` の「見た目」「絵の細かさ」（透過・色はそのまま、BOX/セル平均、輪郭はうすく、つながる物の切り方、動く絵のコマ、工房の更新）。ここには書きなおさない。かならず先に読む。

## 1. 絵をおく
- もらった絵は `tools/art/<セット名>/` に置く（元の名前のまま。チップの元としてリポジトリにのこす）。

## 2. ちぢめる（`tools/art/pixdown.py`）
- 物のかこみをさがす：`python3 tools/art/pixdown.py <絵.png> <出力>`（`--box`・`--w` なしで、透過でわかれた物のかこみ `boxes` を出す。1つの物が2つにわかれたら、`--box` で書く）。
- 大きさ：1マス＝64ドット（g64）。1マスの物ははば60前後、2×2ははば118前後。たて横の比はかえない（`--w` か `--h` のどちらか、または同じ倍率 `--sc`）。
- ためし：`python3 tools/art/pixdown.py <絵.png> <出力> --box x0,y0,x1,y1 --w 118 --name <id>`
- 決まったら、設定ファイル `tools/art/<セット名>/<セット>_art.py` を作る（例 `tools/art/fog/fog_art.py`：`SRC`・`OBJS={id:{box,w|h|sc,lines}}`・`FIX`）。
  `python3 tools/art/pixdown.py --config tools/art/<セット>/<セット>_art.py <出力>`
- 出力：`<id>.png`（チップ）と `<id>_cmp.png`（もとの絵と8倍のならべ）。`_cmp.png` をかならず見る。
- 中の線（石のさかい・割れ目）がきえるときは `lines:(th,fr)` を下げる（例 `(8,.15)`）。`False` で中の線をとらない。

## 3. こわれた形をなおす（FIX）
- 小さい花・かぎ穴・目・割れ目は、平均で十字・点になりやすい。`<id>.png` の所を12倍にして、もとの絵とくらべる。
- なおし方は、設定の `FIX[id](o)` に、ドットの座標と色を書く（o は高さ×はば×RGBA の配列）。色は、まわりの絵からとる。なおしたら、もう一度12倍で見る。

## 4. チップに入れる（`tools/chips.py`）
```python
import sys; sys.path.insert(0, 'tools'); import chips
from PIL import Image
h, C = chips.load_imgs()
im = Image.open('<出力>/<id>.png').convert('RGBA')
C['<id>'] = {**C.get('<id>', {'g': 64}), 'ax': ..., 'ay': ..., 'w': im.width, 'h': im.height, 'f': [im]}
chips.pack_imgs(h, C)   # アトラスと chips.js を作りなおす（ドットまで同じかたしかめる）
```
- `ax,ay` は g64 のドットで、置くマス（左上）からのずれ。下のはしを、足もとの位置にそろえる（1マスなら 60前後、2×2なら 124前後）。
- 絵は `chipOf(id)`・`drawChip` で描く。読みこむ前のためのコードの絵はのこす。
- `tools/__pycache__` はけす。そのあと `index.html` の `E`、`APP_VER`、`node --check js/*.js`。

## 5. ゲームの中で見る
- `python3 -m http.server 8158 --directory <リポジトリ>`、Playwright（`CHROME_PATH=/opt/pw-browsers/chromium`、`NODE_PATH=$(npm root -g)`）。`tools/tests/fog.cjs` の `ltEval` の入れ方をまねて、物を置き `centerOn`・`cam.z=3` でスクリーンショット。
- ふだんの拡大（1.3〜2.3倍）でも見る。チップをかえたら、マップチップ工房も（CLAUDE.md の手順）。

## 6. 報告
- うまく使えなかった所（なにがだめだったか）と、新しいプロンプトを、毎回つける。

## プロンプトのひな形（1つで使えるように、毎回ぜんぶ書く）
```
Pixel art game sprite of <物の説明>, for a cozy top-down farming/village game.
Drawn on an exact pixel grid at its final in-game size (<はば>x<高さ> pixels, 1 tile = 64 pixels), then shown upscaled 8x with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no sub-pixel detail, no half pixels.
Camera: 3/4 top-down view like a view cube seen from the front-top (front face and top face both visible, about 45 degrees), facing the viewer, centered, whole object visible.
<まっすぐ立つ物なら> Upright, perfectly vertical, not tilted.
Pale, light, soft colors matching a gentle pastel game; no dark or heavily saturated colors.
No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black.
Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture.
Transparent background, no ground shadow, no text, no frame. <何こならべるなら> Each object separate with clear transparent space between them.
```
- つながる物（床・壁・塀・柵・道）は「1まいのタイル」ではなく、CLAUDE.md の「くりかえして使う絵」の書き方にする。
- 草原の物は洋風（和風の物を入れない）。

## 気をつけること（やってみてわかったこと）
- `FIX` の座標は、できあがりの絵のドット。大きさをかえたら、直す所の座標も書きなおす。
- ゲームで写すときは、`assetsOK&&stageReady()` をまってから。霧の中の物は `fogClear` してから。`centerOn` には世界のドット（マス×32）をわたす。
- 後かたづけ：`tools/__pycache__` のほか、`tools/art/__pycache__`・`tools/art/<set>/__pycache__` もけす。
- チップをかえたら、マップチップ工房も新しくする（CLAUDE.md の工房の決まり）。
- うしろが透明でない絵（市松もよう・灰色のかげがやきついている）は、あざやかさ（最大−最小が45以上）で物をとり、物にかこまれた小さい穴・暗い穴（くぎ・刃）だけうめる（例 `tools/art/tlb/tlb_art.py` の `clean`）。白い区切り線は、その行・列をとばしてつなぐ。
- つなぐ部品（橋のはし・まん中）は、`pixdown.make` のままだと、切った辺が外の輪郭になって、つなぎ目に線が出る。切った辺は輪郭にしない・かこみで切りとらない（同じ原点のまま）。3つならべて見る。
- 工房の `kobo` は `id.` で始まる物しかひろわないので、`id:部品` の物は id をぜんぶ書く。
