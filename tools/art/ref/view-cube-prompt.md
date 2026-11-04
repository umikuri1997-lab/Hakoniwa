# 見おろしの角度をそろえるプロンプト

お手本の絵 `tools/art/ref/view-cube.png` をいっしょにわたして使う。
- うすい線のマス目：1マス
- 左：1×1×1 のキューブ
- まん中：2×1×1 のキューブ
- 右：高さ2のキューブ

`<ここに描く物>` を、描いてほしい物の説明に入れかえる。ほかの所は、どの絵でもそのまま使う。

```
Use the attached reference image as a strict guide for the camera angle and proportions. In the reference, the faint grid squares are one tile each, and the cubes show the exact game projection:
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above as plain rectangles, with no shrinking toward the back: a 1x1 top face is a perfect square, exactly one tile wide and one tile deep.
- Only the front (south) face of an object is visible below its top face. The front face is a straight rectangle facing the viewer. Left, right and back side faces are NOT visible at all.
- Height scale: one tile of real height appears as a front face 0.8 tiles tall (52 px when a tile is 64 px). The bottom edge of the front face sits exactly on the bottom edge of the object's footprint tile, and the top face is shifted up by the object's height.
- All vertical edges are perfectly vertical and all horizontal edges are perfectly horizontal. There is no perspective, no vanishing point, and no fisheye.

Draw: <ここに描く物>. Match the reference cubes exactly: the same angle, the same top-face shape, and the same front-face height ratio. The footprint is the same number of tiles as the object.

Style: Pale, light, soft colors; no dark or heavily saturated colors. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Transparent background. Do not draw the grid, the cubes, or any shadow-catching floor from the reference.
```

立つ物（ランプ・柱・家具など）には、つぎの1文も足す。

```
The object stands upright, perfectly vertical, not tilted.
```
