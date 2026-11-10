# 御神木（草原）の切り株・芽・若葉・若木・御神木の絵をたのむプロンプト

いっしょにわたす絵：
- お手本のキューブ `tools/art/ref/view-cube.png`
- 3Dのお手本（マス目つき）：切り株 `ref/stump3d_full.png`、芽 `ref/bud3d_full.png`、若葉 `ref/leaf3d_full.png`、若木 `ref/sapling3d_full.png`、御神木 `ref/tree3d_full.png`（`sacred3d.py` で作る。1マス＝128ドット、黄色いわくが置く4×4マス）

どれも、根のまん中・根の下のはしは同じ所（ゲームでは切り株から御神木へ育つので、同じ位置にそろえる）。芽・若葉・若木は、できた切り株の絵もいっしょにわたすと、切り株がそろう。

## 切り株

```
Use the attached reference images as a strict guide. The first image is a view cube; the second image is a 3D block-out of the object on a tile grid (one faint grid square = one tile; the yellow frame is the 4x4-tile footprint).

Camera and proportions (copy the view cube exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: a horizontal circle looks like a perfect circle, not a flattened ellipse.
- Only the front (south) side of an object is visible below its top face. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. All vertical edges are perfectly vertical. No perspective, no vanishing point, no fisheye.

Draw: a large old tree stump, the remains of a great sacred tree, for a cozy European-style meadow village game (pixel art). Follow the 3D block-out for size, position and shape:
- The cut top is a perfect circle about 1.25 tiles across, seen from above, with soft concentric growth rings in pale cream wood and a thin rim of bark around the edge.
- Below the cut top, the front of the trunk shows as a short wall of bark about 0.6 tiles tall, with gentle vertical bark grooves, flaring slightly wider at the ground.
- Thick roots spread out from the base along the ground in all directions: wide and low, longer to the left and right, shorter toward the front and back. The whole stump including roots is about 2.3 tiles wide.
- The stump stands upright, perfectly vertical, not tilted.
- No moss, no mushrooms, no sprouts, no rope, no ribbons, no Japanese or shrine decorations.

Final size: 1 tile = 64 pixels, so the stump is about 145 pixels wide and 130 pixels tall. Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft warm wood colors matching a gentle pastel game; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no frame. Do not draw the grid, the yellow frame, the cubes, or any floor from the references.
```

## 芽（切り株に小さな芽）

```
Use the attached reference images as a strict guide. The first image is a view cube; the second image is a 3D block-out of the object on a tile grid (one faint grid square = one tile; the yellow frame is the 4x4-tile footprint).

Camera and proportions (copy the view cube exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: a horizontal circle looks like a perfect circle, not a flattened ellipse.
- Only the front (south) side of an object is visible below its top face. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. All vertical edges are perfectly vertical. No perspective, no vanishing point, no fisheye.

Draw: the old sacred tree stump with one tiny new sprout, for a cozy European-style meadow village game (pixel art). Follow the 3D block-out for size, position and shape:
- A very small light-green sprout (a short thin stem with one tiny leaf) pokes up from the cut top, on the right back part of the rings, about 0.1 tiles tall.
- The stump is exactly the same as the stump in the 3D block-out: a large old tree stump, the remains of a great sacred tree. The cut top is a perfect circle about 1.25 tiles across, seen from above, with soft concentric growth rings in pale cream wood and a thin rim of bark. Below it, the front of the trunk is a short wall of bark about 0.6 tiles tall with gentle vertical grooves, flaring slightly at the ground. Thick, wide, low roots spread along the ground: longer to the left and right, shorter toward the front and back. Including roots, about 2.3 tiles wide. If an image of the finished stump is attached, copy that stump exactly, pixel for pixel.
- The stump and the new growth stand upright, perfectly vertical, not tilted.
- No moss, no mushrooms, no rope, no ribbons, no Japanese or shrine decorations.

Final size: 1 tile = 64 pixels, so the whole picture is about 145 pixels wide and 130 pixels tall. Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft warm wood colors matching a gentle pastel game; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no frame. Do not draw the grid, the yellow frame, the cubes, or any floor from the references.
```

## 若葉（切り株にふた葉）

```
Use the attached reference images as a strict guide. The first image is a view cube; the second image is a 3D block-out of the object on a tile grid (one faint grid square = one tile; the yellow frame is the 4x4-tile footprint).

Camera and proportions (copy the view cube exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: a horizontal circle looks like a perfect circle, not a flattened ellipse.
- Only the front (south) side of an object is visible below its top face. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. All vertical edges are perfectly vertical. No perspective, no vanishing point, no fisheye.

Draw: the old sacred tree stump with a young seedling, for a cozy European-style meadow village game (pixel art). Follow the 3D block-out for size, position and shape:
- A small light-green seedling grows from the cut top, on the right back part of the rings: a thin stem about 0.2 tiles tall with two small rounded leaves opening to the left and right.
- The stump is exactly the same as the stump in the 3D block-out: a large old tree stump, the remains of a great sacred tree. The cut top is a perfect circle about 1.25 tiles across, seen from above, with soft concentric growth rings in pale cream wood and a thin rim of bark. Below it, the front of the trunk is a short wall of bark about 0.6 tiles tall with gentle vertical grooves, flaring slightly at the ground. Thick, wide, low roots spread along the ground: longer to the left and right, shorter toward the front and back. Including roots, about 2.3 tiles wide. If an image of the finished stump is attached, copy that stump exactly, pixel for pixel.
- The stump and the new growth stand upright, perfectly vertical, not tilted.
- No moss, no mushrooms, no rope, no ribbons, no Japanese or shrine decorations.

Final size: 1 tile = 64 pixels, so the whole picture is about 145 pixels wide and 130 pixels tall. Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft warm wood colors matching a gentle pastel game; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no frame. Do not draw the grid, the yellow frame, the cubes, or any floor from the references.
```

## 若木（切り株から若木）

```
Use the attached reference images as a strict guide. The first image is a view cube; the second image is a 3D block-out of the object on a tile grid (one faint grid square = one tile; the yellow frame is the 4x4-tile footprint).

Camera and proportions (copy the view cube exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: a horizontal circle looks like a perfect circle, not a flattened ellipse.
- Only the front (south) side of an object is visible below its top face. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. All vertical edges are perfectly vertical. No perspective, no vanishing point, no fisheye.

Draw: the old sacred tree stump with a young tree growing from it, for a cozy European-style meadow village game (pixel art). Follow the 3D block-out for size, position and shape:
- A slender young tree grows from the right back part of the cut top: a thin, perfectly vertical light-brown trunk rising about 1.9 tiles above the cut, a few thin branches, and a small rounded crown of fresh light spring-green leaf clusters about 1.5 tiles wide at the top.
- The stump is exactly the same as the stump in the 3D block-out: a large old tree stump, the remains of a great sacred tree. The cut top is a perfect circle about 1.25 tiles across, seen from above, with soft concentric growth rings in pale cream wood and a thin rim of bark. Below it, the front of the trunk is a short wall of bark about 0.6 tiles tall with gentle vertical grooves, flaring slightly at the ground. Thick, wide, low roots spread along the ground: longer to the left and right, shorter toward the front and back. Including roots, about 2.3 tiles wide. If an image of the finished stump is attached, copy that stump exactly, pixel for pixel.
- The stump and the new growth stand upright, perfectly vertical, not tilted.
- No moss, no mushrooms, no rope, no ribbons, no Japanese or shrine decorations.

Final size: 1 tile = 64 pixels, so the whole picture is about 145 pixels wide and 210 pixels tall. Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft warm wood colors matching a gentle pastel game; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no frame. Do not draw the grid, the yellow frame, the cubes, or any floor from the references.
```

## 御神木

```
Use the attached reference images as a strict guide. The first image is a view cube; the second image is a 3D block-out of the object on a tile grid (one faint grid square = one tile; the yellow frame is the 4x4-tile footprint).

Camera and proportions (copy the view cube exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back.
- Only the front (south) side of an object is visible. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. The trunk is perfectly vertical. No perspective, no vanishing point, no fisheye.

Draw: a great sacred tree fully grown, for a cozy European-style meadow village game (pixel art), like a huge old oak. Follow the 3D block-out for size, position and shape:
- A thick, perfectly vertical trunk standing in the lower middle of the footprint, flaring at the base into strong roots that spread along the ground: longer to the left and right, shorter toward the front. The roots and the bottom of the trunk sit in the same place as in the reference.
- About 1.7 tiles of trunk are visible below the leaves. A few thick branches rise from the top of the trunk into the crown.
- A big, rounded, fluffy crown made of several large leaf clusters, about 5.8 tiles wide and reaching about 6 tiles above the bottom of the roots, a little wider at the bottom and rounded at the top, as in the reference.
- Fresh light spring-green leaves with soft lighter highlights on top of each cluster, and a few tiny soft golden light motes floating around the crown.
- The tree stands upright, perfectly vertical, not tilted.
- No rope, no ribbons, no shrine, no Japanese decorations, no lanterns, no fruit, no birds.

Final size: 1 tile = 64 pixels, so the tree is about 370 pixels wide and 395 pixels tall. Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game: warm light brown bark, light fresh greens; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no frame. Do not draw the grid, the yellow frame, the cubes, or any floor from the references.
```
