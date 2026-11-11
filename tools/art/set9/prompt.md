# 9つの物の絵をたのむプロンプト（1まいでたのむ形。デザインと角度がずれたので、いまは `prompts.md` の1つずつの物を使う）（井戸・シーソー・ガーデンアーチ・すべり台・ブランコ・よまわりのランタン・石どうろう・にぐるま・コンポスター）

いまの絵のデザインのまま、見おろしの角度だけをゲームに合わせてかきなおしてもらう。ガーデンアーチだけは新しいデザイン（木のパーゴラ。持ち主の写真のような形）で、シートの右のパネルは、いまの絵のかわりに正面から見た3D。ブランコは柱のあいだを少しつめた。
わたす絵は1まい：`ref/sheet.png`（`python3 tools/art/set9/set9_3d.py` で作る）。左上がお手本のキューブ。9つの物ごとに、左が3D（角度・大きさ・置く場所のお手本）、右がいまの絵（デザインのお手本）。1マス＝64ドット、黄色いわくが置くマス。
シーソーの板・ブランコの座席はゲームで動かすので、べつの部品でたのむ。石どうろう・よまわりのランタンは、あかりの消えた絵と、ついた絵の2つ。
石どうろうは和風の物（火山の物）。すべり台・シーソーは風のステージの遊具（`WIND_STAGE_TOYS`）。ほかは草原から使う洋風の物。

```
Use the attached reference image as a strict guide. It is one sheet. Top left: a view cube. Below it are nine objects, numbered 1 to 9. For each object there are two panels on a tile grid: the LEFT panel is a 3D block-out that shows the correct camera angle, size and position; the RIGHT panel is the current artwork that shows the design. One faint grid square = one tile = 64 pixels. The yellow frame is the object's footprint.

Task: redraw all nine objects with the same design as the current artwork (right panels), except the garden arch (number 3), which has a new design: the same parts, colors, materials, details and style. Change only the camera angle and proportions to match the 3D block-outs (left panels). Do not add or remove parts.

Camera and proportions (copy the view cube and the block-outs exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: round tops (the well's stone rim) look like full circles, square tops look like full squares, not flattened.
- Only the front (south) side of an object is visible below its top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. Posts, poles, lanterns and frames stand upright, perfectly vertical, not tilted. No perspective, no vanishing point, no fisheye.
- Size and position inside the footprint follow the block-out.

The objects:
1. Well (1x1 tile): round stone well with a small gabled wooden roof on two posts, a crossbar, a rope and a wooden bucket. The water inside is pale soft blue.
2. Seesaw (1x1 tile, the board reaches beyond the tile to the left and right): draw it as TWO separate parts: (a) the base with the sandy mound and the wooden pivot block, without the board; (b) the long wooden board with the two handles, perfectly horizontal, alone.
3. Garden arch (1x1 tile, wider than the tile). NEW DESIGN, not the current artwork: for this object only, the right panel is a straight front view of the 3D block-out instead of the current art. A rectangular wooden pergola-style arch made of natural warm-brown wood: four square upright posts (two in front, two at the back); each side between the front and back post is a ladder-like lattice of thin horizontal and vertical wooden slats; on top, two long beams run left to right with ends sticking out a little, and several thin crossbeams (rafters) lie across them, front to back, with their ends sticking out. Climbing roses grow up the right side and along part of the top: soft green leaves and small white roses. Simple, natural and cozy.
4. Slide (2x2 tiles): a wooden slide: a small platform with rails, wooden steps going down on the left, and a pale sandy slide going down to the right.
5. Swing (2x1 tiles, the posts a little closer together than in the current artwork): draw it as TWO separate parts: (a) the frame: two thick upright wooden posts on stone bases and the top beam, without ropes and seat; (b) the seat hanging from two ropes (from the top beam down to the seat), alone.
6. Night-watch lantern (1x1 tile): a slim dark street lamp post with a lantern on top, a crescent moon on the glass and a small star on the top. Draw it TWICE: once unlit (pale glass), once lit (the glass glows with soft pale blue light). Only the glass changes; everything else is pixel-identical.
7. Stone lantern (1x1 tile): a Japanese stone lantern (base, pillar, light box with a small window, square roof, round top knob), with a little moss. Draw it TWICE: once unlit, once lit (the window glows with warm pale orange light). Only the window changes; everything else is pixel-identical.
8. Cart (2x1 tiles): a wooden hand cart with low side boards, wooden wheels, a handle sticking out to the right, and a cloth sack in it.
9. Composter (1x1 tile): a wooden slatted box with corner posts, open on top, filled with green grass clippings.

Output: all the pieces on one transparent sheet, in the same order, each piece separate with clear transparent space between them, all at the same scale (1 tile = 64 pixels). Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game, as in the current artwork; no dark or heavily saturated colors; glass is pale and light. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass under the objects, no text, no numbers, no frame. Do not draw the grid, the yellow frames, the cubes or the block-outs from the reference.
```
