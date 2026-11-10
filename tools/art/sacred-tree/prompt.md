# 御神木（草原）の切り株・芽・若葉・若木・御神木の絵をたのむプロンプト

いまの絵のデザインのまま、見おろしの角度だけをゲームに合わせてかきなおしてもらう。

わたす絵は1まい：`ref/sacred_sheet.png`（`python3 tools/art/sacred-tree/sacred3d.py` で作る）。
- 上の段：左はしがお手本のキューブ、そのみぎに 切り株・芽・若葉・若木・御神木 の3Dのお手本（角度・大きさ・置く場所のお手本）
- 下の段：いまの絵（デザインのお手本）を、3Dのお手本の真下に、ゲームと同じ大きさ・同じ置き方で
- 1マス＝64ドット、黄色いわくが置く4×4マス。5つとも、根のまん中・根の下のはしは同じ所

```
Use the attached reference image as a strict guide. It is one sheet with two rows. One faint grid square = one tile = 64 pixels; each yellow frame is the object's 4x4-tile footprint.
- Top row: on the far left a view cube, then five 3D block-outs. They show the correct camera angle, size and position.
- Bottom row: the current artwork of the same five objects, directly below each block-out, from left to right: 1 stump, 2 stump with a tiny sprout, 3 stump with a seedling, 4 stump with a young tree, 5 the fully grown sacred tree. They show the design.

Task: redraw the five objects of the bottom row with exactly the same design, and change only the camera angle to match the top row. Keep everything else the same as the bottom row: the art style, pixel art look, colors, wood and bark texture, growth rings, root shapes, the sprout and leaves, the young tree's thin branches and leaf clusters, the big tree's trunk, branches, leaf clusters and the small golden light motes. Do not add or remove anything.

Camera and proportions (copy the view cube and the block-outs exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: the stump's cut top is a perfect circle, not a flattened ellipse.
- Only the front (south) side of an object is visible below its top face. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. All trunks stand upright, perfectly vertical, not tilted. No perspective, no vanishing point, no fisheye.
- Size and position follow the top row: the roots sit in exactly the same place inside the footprint in all five, so the stages line up when swapped. The stump is the same size in stages 1 to 4.

Final sizes (1 tile = 64 pixels): stages 1 to 3 about 145 x 140 pixels; stage 4 about 150 x 190 pixels; stage 5 about 370 x 395 pixels. Pixel art drawn on an exact pixel grid at these final sizes, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Output: the five objects side by side in one row in the same order, each separate with clear transparent space between them, all at the same scale.

Style: Pale, light, soft colors as in the current artwork; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no numbers, no frame. Do not draw the grid, the yellow frames, the cubes, the block-outs, or any floor from the reference.
```
