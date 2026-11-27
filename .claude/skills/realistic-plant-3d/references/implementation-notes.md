# 同梱コードの使用方法・検査状況

`python -m pip install numpy trimesh matplotlib` （必要な場合、許可された環境で）

`python scripts/demo_shapes.py output` で技術見本のGLBとPNGを生成。`python scripts/check_samples.py` で同梱見本の再読み込み、法線、テーパーチューブ、面積ゼロ面などの検査。見本は植物の完成モデルではなく、葉と枝の構造部品。

`plant_geometry.py` は汎用形状生成の土台。`leaf()` の輪郭関数、鋸歯、ねじれ、横断面、非対称を対象植物に合わせて変更する。葉柄・葉脈・本葉の付き方は別途設計する。`tube()` は平行移動フレームによる曲線形状、テーパー、断面のうねり。親子枝の継ぎ目は別途処理する。`azimuths()` の対生は十字対生の例であり、全対生種の節間回転を固定するものではない。`export_glb()` はZ-upからY-upに変換する。

検査実績：同梱技術見本をPythonで生成し、GLB再読み込み（46メッシュ、19,836三角形）、有限座標・非ゼロ面積、平面葉の法線、管の閉鎖性・巻き方向・正体積を確認。BlenderやClaude環境での実行、植物学的な最終品質、GLBの各ゲームエンジンでの互換性は未検証。

## V3 追加コード
`python scripts/flower_geometry.py` により曲面部品の GLB を生成。numpy 2.3.5 / trimesh 4.11.1 で実行し、24メッシュ、33,408三角形、有限座標・正面積・再読み込みを検査済み。Blender・Claude上での実行、レンダーでの外観比較、種別完成株の品質は未検証。見本を完成品として使用しない。
