# 3Dのお手本・3Dから作るドット絵にはる、フリーのテクスチャ

どれも CC0（だれでも自由に使える）。3Dの道具（`tools/art/oblique3d.py` の `render_px`）で使う。`wood049.png` は、草原のUIの木目（`tools/ui/paper_ui.py` がドットにちぢめて、`index.html` に書きこむ）にも使う。テクスチャのファイルそのものは、ゲームには入れない。

- `wood049.png`：ambientCG「Wood049」の色の絵（1K、https://ambientcg.com/view?id=Wood049 、CC0 1.0）。横むきの木目で、くりかえしてつながる。
  取ってきた所：GitHub にある写し（spatigen/espire の `Wood049_1K-PNG_Color.png`。Git LFS の中身の sha256 が ddbd14ad…bb01c と同じことをたしかめた）。ネットの制限で ambientcg.com から直接は取れなかった。ファイルの形だけ、そのままの色で PNG に書きなおした。
- `bark001.png`：ambientCG「Bark001」の色の絵（1K、https://ambientcg.com/view?id=Bark001 、CC0 1.0）。まきの皮（`blueprint.py` の `barktex`）。すじが横むきになるように90度まわしてある。
  取ってきた所：GitHub にある写し（Malcolmnixon/AliceMaze の `assets/ambientcg.com/Bark001_1K-JPG/Bark001_1K_Color.jpg`）。ネットの制限で ambientcg.com から直接は取れなかった。
- `rock030.png`：ambientCG「Rock030」の色の絵（1K、https://ambientcg.com/view?id=Rock030 、CC0 1.0）。石の家具（流し台など）の石。
  取ってきた所：GitHub にある写し（matthewm174/Godot4.3-soulslike-controller の `textures/Rock030_1K-PNG/Rock030_1K-PNG_Color.png`。べつの写し（Alexamakans/bubbelspel）の Git LFS の sha256 0c859558…a738a と同じことをたしかめた）。
- `plaster001.png`：ambientCG「Plaster001」の色の絵（1K、https://ambientcg.com/view?id=Plaster001 、CC0 1.0）。しっくいのかべ（灯台・風車の塔、部品に `p.plaster=True`）。
  取ってきた所：GitHub にある写し（spatigen/espire の `espire/data/assets/Textures/ceiling/Plaster001_1K-PNG_Color.png`。Git LFS の中身の sha256 が 77967887…49d1b00 と同じことをたしかめた）。ファイルの形だけ、そのままの色で PNG に書きなおした。
- `metal032.png`：ambientCG「Metal032」の色の絵（1K、https://ambientcg.com/view?id=Metal032 、CC0 1.0）。金属の板・鉄（灯台の屋根・枠・手すり、風車の屋根。部品に `p.mtex=True`）。
  取ってきた所：GitHub にある写し（CC-Open-Learning/DLX-paramedic-ambulance の `Assets/Easter Eggs/Metal032_1K-PNG_Color.png`。Git LFS の中身の sha256 が 74b8db4a…b39cfde と同じことをたしかめた）。ファイルの形だけ、そのままの色で PNG に書きなおした。
- `paper005.png`：ambientCG「Paper005」の色の絵（1K、https://ambientcg.com/view?id=Paper005 、CC0 1.0）。依頼の紙の柄（`tools/ui/paper_ui.py` の `ptex_rows` が、ドットにちぢめて `index.html` に書きこむ）。
  取ってきた所：GitHub にある写し（bucekpet/Dungeon-platformer の `Textures/paper/Paper005_1K-JPG_Color.jpg`。中身の sha256 は 128d5ba1…）。ネットの制限で ambientcg.com から直接は取れなかった。ファイルの形だけ、そのままの色で PNG に書きなおした。
- `fabric026.png`・`fabric026_n.png`：ambientCG「Fabric026」の色の絵とノーマルマップ（OpenGL の向き。1K、https://ambientcg.com/view?id=Fabric026 、CC0 1.0）。布の織り目（コワイノの布、`tools/art/kowaino3d/kw_tex.py`）。
  取ってきた所：GitHub にある写し（MrGoonAndWatch/Goons-House-Of-Doom-2 の `textures/cc0/Fabric026_1K-PNG_Color.png`・`_NormalGL.png`）。ネットの制限で ambientcg.com から直接は取れなかった。256×256 に色の平均（BOX）でちぢめ、ノーマルマップは 16bit を 8bit にした。
- `rock030_n.png`：ambientCG「Rock030」のノーマルマップ（OpenGL の向き、`rock030.png` と同じ物）。岩のでこぼこ（コワイノの岩、`kw_tex.py`）。
  取ってきた所：GitHub にある写し（matthewm174/Godot4.3-soulslike-controller の `textures/Rock030_1K-PNG/Rock030_1K-PNG_NormalGL.png`）。256×256 に色の平均（BOX）でちぢめ、16bit を 8bit にした。
- Metal032 のノーマルマップは、たいらで、でこぼこがない（使わない）。金属は、つやのすじ（`oblique3d` の `material('metal')`）と、金属の色のむら（`metal032.png`）で出す。
- `oldpaper.png`：Dugi「Old paper texture」（OpenGameArt、https://opengameart.org/content/old-paper-texture 、CC0 をふくむ複数のライセンスからえらべる。CC0 で使う）。しわのある古い紙。思い出帳・図鑑・ひでんのしょの紙に、うすく（`tools/ui/paper_ui.py` の `oldpaper_rows` が、ドットにちぢめて `index.html` に書きこむ）。
