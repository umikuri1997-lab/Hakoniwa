# キャビネット・本棚の3つの向きを1まいでたのむプロンプト

前・右・左の3つの向きを、1まいの絵にならべてかいてもらう（3つの絵の大きさ・色がそろう）。1つの物ごとに、わたす絵1まいと、下の英語の文1つ。
わたす絵は `ref/views3_<id>.png`（`python3 tools/art/set10/set10_rot.py views3` で作る。左からお手本のキューブ・3Dの前・右向き・左向き・いまの絵。1マス128ドット、黄色いわくが置くマス）。
できあがりのドット数はたのまない（大きくかいてもらい、こちらで色の平均でちぢめる）。

## 1. キャビネット・前・右・左（わたす絵 `ref/views3_cabinet.png`）

いまのキャビネットの絵と同じデザインで、前・右向き・左向きの3つを、左からならべて1まいにかいてもらう。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has five panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Panels 1, 2 and 3: 3D block-outs of the SAME object in three directions: 1 = front faces the viewer, 2 = turned so its front faces RIGHT, 3 = turned so its front faces LEFT.
- Right: the current artwork of the object (front view): the design to keep.

Task: draw the object THREE times in one image, side by side in this order from left to right: (1) front view, (2) front facing right, (3) front facing left. Use EXACTLY the same design as the current artwork for all three: the same parts, shapes, colors, materials, wood grain and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. All three views are the same object at the same scale, with the same height, the same bottom line and the same colors. Copy the shape and proportions of each 3D block-out (panels 1, 2, 3) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-outs exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation of the camera, NO isometric angle, NO three-quarter turn. Only the OBJECT is turned in views 2 and 3, never the camera.
- Top faces are seen fully from above with no shrinking toward the back: a square top looks like a full square, not flattened.
- Only the side of the object that faces the viewer (south) is visible below its top face. In view 2 (front facing right) the viewer sees the object's LEFT side panel; in view 3 (front facing left) the viewer sees its RIGHT side panel. View 3 is the mirror image of view 2.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. The object stands upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of each drawing must match the outline of its 3D block-out.

Object: Cabinet — a low wooden cabinet with two doors on the front, each door with a recessed panel, two small round knobs in the middle, a top board that sticks out a little all around, and four short feet. In views 2 and 3 the doors face sideways, so they are seen only as a thin edge with the knobs just peeking out; the visible side is a plain side panel under the long top board.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw them large and detailed, filling most of the image; do NOT shrink them to a small pixel size (they will be resized later).

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no numbers, no frame. Leave clear transparent space between the three views so they do not touch. Do not draw the grid, the yellow frames, the cube or the block-outs.
```

## 2. 本棚・前・右・左（わたす絵 `ref/views3_shelf1.png`）

いまの本棚の絵と同じデザインで、前・右向き・左向きの3つを、左からならべて1まいにかいてもらう。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has five panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Panels 1, 2 and 3: 3D block-outs of the SAME object in three directions: 1 = front faces the viewer, 2 = turned so its front faces RIGHT, 3 = turned so its front faces LEFT.
- Right: the current artwork of the object (front view): the design to keep.

Task: draw the object THREE times in one image, side by side in this order from left to right: (1) front view, (2) front facing right, (3) front facing left. Use EXACTLY the same design as the current artwork for all three: the same parts, shapes, colors, materials, wood grain and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. All three views are the same object at the same scale, with the same height, the same bottom line and the same colors. Copy the shape and proportions of each 3D block-out (panels 1, 2, 3) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-outs exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation of the camera, NO isometric angle, NO three-quarter turn. Only the OBJECT is turned in views 2 and 3, never the camera.
- Top faces are seen fully from above with no shrinking toward the back: a square top looks like a full square, not flattened.
- Only the side of the object that faces the viewer (south) is visible below its top face. In view 2 (front facing right) the viewer sees the object's LEFT side panel; in view 3 (front facing left) the viewer sees its RIGHT side panel. View 3 is the mirror image of view 2.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. The object stands upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of each drawing must match the outline of its 3D block-out.

Object: Bookshelf — a wooden bookcase with two side boards, a back panel, a top board that sticks out a little, two inner shelves and four short feet, with three rows of upright books in soft pastel colors (dusty blue, sage green, pale rose, cream). In views 2 and 3 the open front with the books faces sideways, so the books are not visible; the visible side is the plain side board under the long top board.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw them large and detailed, filling most of the image; do NOT shrink them to a small pixel size (they will be resized later).

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no numbers, no frame. Leave clear transparent space between the three views so they do not touch. Do not draw the grid, the yellow frames, the cube or the block-outs.
```
