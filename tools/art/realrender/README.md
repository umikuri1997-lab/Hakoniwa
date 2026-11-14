# リアルなレンダリング（たしかめ用）

3Dの物（furn3d の設計図）を、ドット絵やトゥーンにせず、ふつうの3Dの写し方（光・かげ・物が落とすかげ）で見るための道具。ゲームには入れない。

1. `python3 tools/art/realrender/export.py <出力.glb> [--skel]`：木（`tools/art/furn3d/items/tree.py`）の三角形と色（もようの色もふくむ）を glb に書く（`--skel` は骨格だけ）。
2. このフォルダで `npm install three@0.160.0` をして、`python3 -m http.server 8766` でひらき、`node shot.cjs` で `tree.glb`・`skel.glb` を写す（three.js、太陽の光・空の光・やわらかいかげ）。
