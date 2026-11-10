# 9つの物の絵を1つずつたのむプロンプト

もくじ：1. 井戸・2. シーソー・3. ガーデンアーチ・4. すべり台・5. ブランコ・6. よまわりのランタン・7. 石どうろう・8. にぐるま・9. コンポスター

9つを1まいでたのむと、デザインと角度がかわってしまったので、1つずつたのむ。どのプロンプトも、それだけで使える（共通の決まりも毎回書いてある）。
わたす絵は、それぞれ1まい：`ref/<番号>_<id>.png`（`python3 tools/art/set9/set9_3d.py` で作る）。左がお手本のキューブ、まん中が3D（角度・大きさ・置く場所）、右がいまの絵（デザイン。アーチだけは正面から見た3D）。どれも1マス＝128ドットにそろえてある。黄色いわくが置くマス。

## 1. 井戸（わたす絵 `ref/1_well.png`）

いまの井戸の絵と同じデザインで、角度だけ3Dに合わせる。

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

Object: Well — a round stone well with a small gabled wooden roof on two wooden posts, a wooden crossbar, a rope and a small wooden bucket. Pale gray stones, light warm wood. The water inside is pale soft blue.

Final size: about 64 x 104 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 2. シーソー（わたす絵 `ref/2_seesaw.png`）

いまのシーソーの絵と同じデザインで、角度だけ3Dに合わせる。台（砂の山と支点）と板を、べつべつにたのむ。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile; the board reaches beyond the tile to the left and right):
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

Object: Seesaw — a wooden seesaw on a sandy mound.
Draw it as TWO separate pieces with transparent space between them: (a) the base: the sandy mound and the wooden pivot block, WITHOUT the board; (b) the long wooden board with the two handles, perfectly horizontal, alone.

Final size: about 122 x 46 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 3. ガーデンアーチ（わたす絵 `ref/3_arch.png`）

新しいデザイン（木のパーゴラ。四すみの角柱・横ははしごのような格子・上に横木・右がわと上につるバラ）。角度と大きさは3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 1x1 tile; wider than the tile):
- Left: a view cube that shows the exact camera angle and height scale.
- Middle: a 3D block-out of the object: the correct camera angle, size and position.
- Right: a straight front view of the same 3D block-out.

Task: draw this object in a NEW design described below. Copy the camera angle, size and position from the middle panel (3D block-out) exactly. The right panel is a straight front view of the same 3D block-out.

Camera and proportions (copy the view cube and the 3D block-out exactly; this matters most):
- Straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down. NO rotation, NO isometric angle, NO three-quarter turn: the object faces the viewer squarely.
- Top faces are seen fully from above with no shrinking toward the back: a round top looks like a full circle, a square top like a full square, not flattened.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen, as in the view cube. Posts, poles and frames stand upright, perfectly vertical, not tilted. All vertical edges are perfectly vertical and all horizontal edges perfectly horizontal. No perspective, no vanishing point, no fisheye.
- The outline of the drawing must match the outline of the 3D block-out in the middle panel.

Object: Garden arch — NEW DESIGN (the right panel is a straight front view of the 3D block-out, not the current art): a rectangular wooden pergola-style garden arch of natural warm-brown wood. Four square upright posts (two in front, two at the back). Each side, between the front and back post, is a ladder-like lattice of thin horizontal and vertical wooden slats. On top, two long beams run left to right with their ends sticking out a little, and several thin crossbeams (rafters) lie across them front to back, with their ends sticking out. Climbing roses grow up the right side and along part of the top: soft green leaves and small white roses. Simple, natural and cozy.

Final size: about 113 x 141 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 4. すべり台（わたす絵 `ref/4_slide.png`）

いまのすべり台の絵と同じデザインで、角度だけ3Dに合わせる。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 2x2 tiles):
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

Object: Slide — a wooden slide: a small wooden platform with rails, wooden steps going down on the left, and a pale sandy-colored slide going down to the right.

Final size: about 166 x 109 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 5. ブランコ（わたす絵 `ref/5_swing.png`）

いまのブランコの絵と同じデザインで、角度だけ3Dに合わせる（柱のあいだは少しつめる）。わく（柱と横木）と、座席（なわつき）を、べつべつにたのむ。

下の英語の文を、そのままAIにわたす。

```
Use the attached reference image as a strict guide. It has three panels on a tile grid (one faint grid square = one tile; the yellow frame is the object's footprint, 2x1 tiles; the two posts are a little closer together than in the current artwork):
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

Object: Swing — a wooden swing: two thick upright wooden posts on gray stone bases, a top beam, and a wooden seat hanging from two ropes.
Draw it as TWO separate pieces with transparent space between them: (a) the frame: the two posts on stone bases and the top beam, WITHOUT ropes and seat; (b) the seat hanging from its two ropes (from the height of the top beam down to the seat), alone.

Final size: about 95 x 99 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 6. よまわりのランタン（わたす絵 `ref/6_yomawari.png`）

いまの絵と同じデザインで、角度だけ3Dに合わせる。あかりの消えた絵と、ついた絵（ガラスがうすい青に光る）の2つ。

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

Object: Night-watch lantern — a slim dark-blue street lamp post with a lantern on top, a crescent moon on the glass and a small yellow star on the top.
Draw it TWICE side by side: once unlit (pale glass), once lit (the glass glows with soft pale blue light). Only the glass changes; everything else is pixel-identical.

Final size: about 22 x 68 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 7. 石どうろう（わたす絵 `ref/7_toro.png`）

いまの絵と同じデザインで、角度だけ3Dに合わせる。あかりの消えた絵と、ついた絵（窓がうすいだいだい色に光る）の2つ。

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

Object: Stone lantern — a Japanese stone lantern (base, pillar, light box with a small window, square roof, round top knob), gray stone with a little moss.
Draw it TWICE side by side: once unlit, once lit (the window glows with warm pale orange light). Only the window changes; everything else is pixel-identical.

Final size: about 39 x 63 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 8. にぐるま（わたす絵 `ref/8_niguruma.png`）

いまの絵と同じデザインで、角度だけ3Dに合わせる。

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

Object: Cart — a wooden hand cart with low side boards, wooden wheels, a handle sticking out to the right, and a cloth sack in it.

Final size: about 122 x 66 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```

## 9. コンポスター（わたす絵 `ref/9_composter.png`）

いまの絵と同じデザインで、角度だけ3Dに合わせる。

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

Object: Composter — a wooden slatted box with corner posts, open on top, filled with green grass clippings.

Final size: about 55 x 90 pixels at 1 tile = 64 pixels (half the size of the reference panels). Pixel art drawn on an exact pixel grid at that final size, shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the object, no text, no frame. Draw only this object. Do not draw the grid, the yellow frame, the cube or the block-out.
```
