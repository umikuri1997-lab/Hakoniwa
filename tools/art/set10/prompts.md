# 9つの物の絵をたのむプロンプト（ベンチ・キャビネット・かざり棚・本棚・木箱・食料箱・素材箱・かべ棚・とげの罠）

いまの絵のデザインのまま、見おろしの角度だけをゲームに合わせてかきなおしてもらう。1つの物ごとに、わたす絵1まいと、下の英語の文1つでたのむ。
わたす絵は `ref/<番号>_<id>.png`（`python3 tools/art/set10/set10_3d.py` で作る。左からお手本のキューブ・3D・いまの絵。1マス128ドット、黄色いわくが置くマス）。3Dは設計図（`ref/bp_<番号>_<id>.png`、部品の表は `set10_parts.py`）どおりに組んだ物。小物は、フリーの3Dモデル（CC0。`tools/art/models`：観葉植物は Quaternius、本・びん・やさい・くだものは Kenney）を置いた。

## 1. ベンチ（わたす絵 `ref/1_bench.png`）

いまのベンチの絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 2x1 tiles):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Bench — a simple wooden bench with no backrest: one thick wooden seat board with softly rounded edges, on four short legs. Warm light wood.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 2. キャビネット（わたす絵 `ref/2_cabinet.png`）

いまのキャビネットの絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Cabinet — a low wooden cabinet with two doors on the front, each door with a recessed panel, two small round knobs in the middle, a top board that sticks out a little all around, and four short feet.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 3. かざり棚（わたす絵 `ref/3_shelf2.png`）

いまのかざり棚の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Display shelf — an open wooden shelf with four corner posts and four shelf boards, no back panel. On the shelves: a cream clay vase and a small potted green plant on top, a green plant and a pale blue bottle on the middle shelves, a small clay pot and a stack of books at the bottom.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 4. 本棚（わたす絵 `ref/4_shelf1.png`）

いまの本棚の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Bookshelf — a wooden bookcase with two side boards, a back panel, a top board that sticks out a little, two inner shelves and four short feet. Three rows of upright books in soft pastel colors (dusty blue, sage green, pale rose, cream).

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 5. 木箱（わたす絵 `ref/5_crate.png`）

いまの木箱の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Wooden crate — a closed box of light wooden planks with a plank lid on top. The front has a frame with an X-shaped brace; thicker corner posts at the front corners.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 6. 食料箱（わたす絵 `ref/6_stor.png`）

いまの食料箱の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Food crate — the same wooden crate with an X-shaped brace on the front, but with no lid: it is open on top and heaped with vegetables and fruit (carrots with green leaves, a green cabbage, red apples).

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 7. 素材箱（わたす絵 `ref/7_mbox.png`）

いまの素材箱の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Material crate — the same wooden crate with an X-shaped brace on the front, with no lid: it is open on top and filled with building materials: a few short wooden logs with round cut ends showing their tree rings on the left, and pale gray stones on the right.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 8. かべ棚（わたす絵 `ref/8_wshelf.png`）

いまのかべ棚の絵と同じデザインで、角度だけ3Dに合わせる。3Dの灰色の壁はお手本のためだけで、かかない。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile (hung on the front of a house wall)):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Wall shelf — one small wooden shelf board fixed to the front of a house wall with two wooden brackets under it. On the shelf, a small potted plant whose ivy vines hang down over the front edge. IMPORTANT: the gray wall in the block-out is only a guide: do NOT draw the wall, draw only the shelf, brackets, pot and ivy.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 9. とげの罠（わたす絵 `ref/9_spike.png`）

いまのとげの罠の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: the current artwork of the object: the design to keep.

Task: redraw the object in the right panel (the current artwork) with EXACTLY the same design: the same parts, the same shapes, the same colors, the same materials and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. The ONLY change is the camera angle and proportions: copy them from the middle panel (3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Spike trap — a low wooden base board on the ground with four sharpened wooden stakes standing in a row; the stake tips are pale, freshly cut wood. The stakes stand upright, perfectly vertical, not tilted.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```
