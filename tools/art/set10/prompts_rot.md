# キャビネット・本棚の右向きの絵をたのむプロンプト

回転できるようにするための、よこ向き（右向き）の絵。左向きは、ゲームで右向きの絵を反転して使う（向きは前・右・左の3つ。うしろ向きはなし）。
わたす絵は `ref/rot_<id>.png`（`python3 tools/art/set10/set10_rot.py` で作る。左からお手本のキューブ・正面の3D・右向きの3D・いまの絵。1マス128ドット、黄色いわくが置くマス）。

## 1. キャビネット・右向き（わたす絵 `ref/rot_cabinet.png`）

いまのキャビネットの絵と同じデザインで、正面を右へ向けた絵。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has four panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Second: a 3D block-out of the object in its current direction (front facing the viewer).
- Third: a 3D block-out of the SAME object turned 90 degrees so that its front faces RIGHT (east). This is the view to draw.
- Right: the current artwork of the object (front view): the design to keep.

Task: draw the object from the right panel (the current artwork) with EXACTLY the same design: the same parts, shapes, colors, materials, wood grain and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. Only the direction changes: the object is turned so that its front faces RIGHT. Copy the shape, size and position of the third panel (the turned 3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the turned 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation of the camera, NO isometric angle, NO three-quarter turn. Only the OBJECT is turned, not the camera.
- Top faces are seen fully from above with no shrinking toward the back: a square top looks like a full square, not flattened.
- Only the side of the object that faces the viewer (south) is visible below its top face. Because the object's front now faces right, the viewer sees its LEFT side panel, not its front.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. The object stands upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the turned 3D block-out (third panel).

Object: Cabinet — the same low wooden cabinet, turned so its two doors face right. From this view you see its long top board from above (it sticks out a little all around), the plain left side panel below it, and two short feet. The doors and knobs face right, so they are seen only as a thin edge with the knobs just peeking out on the right side.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-outs.
```

## 2. 本棚・右向き（わたす絵 `ref/rot_shelf1.png`）

いまの本棚の絵と同じデザインで、正面を右へ向けた絵。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has four panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Second: a 3D block-out of the object in its current direction (front facing the viewer).
- Third: a 3D block-out of the SAME object turned 90 degrees so that its front faces RIGHT (east). This is the view to draw.
- Right: the current artwork of the object (front view): the design to keep.

Task: draw the object from the right panel (the current artwork) with EXACTLY the same design: the same parts, shapes, colors, materials, wood grain and details. Do NOT redesign, do NOT add or remove parts, do NOT change the style. Only the direction changes: the object is turned so that its front faces RIGHT. Copy the shape, size and position of the third panel (the turned 3D block-out) exactly, part by part.

Camera and proportions (copy the view cube and the turned 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation of the camera, NO isometric angle, NO three-quarter turn. Only the OBJECT is turned, not the camera.
- Top faces are seen fully from above with no shrinking toward the back: a square top looks like a full square, not flattened.
- Only the side of the object that faces the viewer (south) is visible below its top face. Because the object's front now faces right, the viewer sees its LEFT side panel, not its front.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. The object stands upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the turned 3D block-out (third panel).

Object: Bookshelf — the same wooden bookcase, turned so its open front with the books faces right. From this view you see its long top board from above (it sticks out a little), the plain left side board below it, and two short feet. The books face right, so they are not visible (at most a thin edge of the shelf boards on the right).

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-outs.
```
