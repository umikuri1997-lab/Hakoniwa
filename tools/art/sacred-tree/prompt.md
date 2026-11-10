# 御神木（草原）の切り株・芽・若葉・若木・御神木の絵をたのむプロンプト

わたす絵は1まい：`ref/sacred_sheet.png`（`python3 tools/art/sacred-tree/sacred3d.py` で作る）。
左はしがお手本のキューブ、そのみぎに 切り株・芽・若葉・若木・御神木 の3Dのお手本（1マス＝64ドット、黄色いわくが置く4×4マス）。
5つとも、根のまん中・根の下のはしは同じ所（ゲームでは切り株から御神木へ育つので、同じ位置にそろえる）。

```
Use the attached reference image as a strict guide. It is one sheet. On the far left is a view cube; to its right are five 3D block-outs on tile grids, from left to right: 1 stump, 2 stump with a tiny sprout, 3 stump with a seedling, 4 stump with a young tree, 5 the fully grown tree. One faint grid square = one tile = 64 pixels. Each yellow frame is the object's 4x4-tile footprint.

Camera and proportions (copy the view cube exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: a horizontal circle looks like a perfect circle, not a flattened ellipse.
- Only the front (south) side of an object is visible below its top face. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. All vertical edges and trunks are perfectly vertical. No perspective, no vanishing point, no fisheye.

Draw a sheet of five growth stages of a sacred tree for a cozy European-style meadow village game (pixel art), in the same order, side by side in one row, each separate with clear transparent space between them, all at the same scale. In all five, the stump and roots are drawn identically and the roots sit in exactly the same place inside the footprint, so the stages line up when swapped. Follow each block-out for size, position and shape.

The stump (the same in stages 1 to 4):
- A large old tree stump, the remains of a great sacred tree. The cut top is a perfect circle about 1.25 tiles across, seen from above, with soft concentric growth rings in pale cream wood and a thin rim of bark.
- Below the cut top, the front of the trunk is a short wall of bark about 0.6 tiles tall with gentle vertical grooves, flaring slightly at the ground.
- Thick, wide, low roots spread along the ground: longer to the left and right, shorter toward the front and back. Including roots, about 2.3 tiles wide.

The five stages:
1. The stump alone. About 145 x 130 pixels.
2. The stump with one very small light-green sprout (a short thin stem with one tiny leaf) on the right back part of the cut top, about 0.1 tiles tall. About 145 x 130 pixels.
3. The stump with a small light-green seedling at the same spot: a thin stem about 0.2 tiles tall with two small rounded leaves opening to the left and right. About 145 x 130 pixels.
4. The stump with a slender young tree growing from the same spot: a thin, perfectly vertical light-brown trunk rising about 1.9 tiles above the cut, a few thin branches, and a small rounded crown of fresh light spring-green leaf clusters about 1.5 tiles wide. About 145 x 210 pixels.
5. The fully grown sacred tree, like a huge old oak, standing where the stump was (no stump left): a thick, perfectly vertical trunk flaring at the base into strong roots in the same place as the stump's roots, longer to the left and right, shorter toward the front. About 1.7 tiles of trunk are visible below the leaves; a few thick branches rise into a big, rounded, fluffy crown of several large leaf clusters, about 5.8 tiles wide, a little wider at the bottom and rounded at the top. Fresh light spring-green leaves with soft lighter highlights on top of each cluster, and a few tiny soft golden light motes floating around the crown. About 370 x 395 pixels.

Everything stands upright, perfectly vertical, not tilted. No moss, no mushrooms, no rope, no ribbons, no lanterns, no fruit, no birds, no shrine or Japanese decorations.

Pixel art drawn on an exact pixel grid at the final sizes above (1 tile = 64 pixels), shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game: warm light wood and bark, light fresh greens; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no text, no numbers, no frame. Do not draw the grid, the yellow frames, the cubes, or any floor from the reference.
```
