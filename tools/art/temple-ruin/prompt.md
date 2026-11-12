# 神殿の絵をたのむプロンプト（こわれる前・こわれた神殿の2つ）

はじめからある、こわれた神殿（`statueb`）と、せいれいが直したあとの神殿（`statue`）を、同じ角度・同じ大きさで1回にたのむ。
わたす絵は1まい：`sheet.png`（`python3 tools/art/temple-ruin/ruin3d.py` で作る）。左から、お手本のキューブ・こわれる前の神殿の3D・こわれた神殿の3D（角度・大きさ・置く場所のお手本）・いまの神殿の絵（デザイン・色・タッチのお手本）。黄色いわくが神殿のマス（像のマス）。
もらったら：3Dのお手本と同じはば・同じ下のはしにそろえて、こわれた神殿は `python3 tools/art/temple-ruin/ruin_chip.py <もらった絵>` でチップにする（いまは3Dの絵をそのままチップにしている）。こわれる前の神殿は、いまの `statue` のチップとさしかえる。

```
Use the attached reference image as a strict guide. It is one sheet with four panels. 1st panel: a view cube. 2nd panel: a 3D block-out of the temple when it is whole. 3rd panel: a 3D block-out of the same temple when it is old and partly collapsed. The two block-outs show the exact camera angle, size, position and parts. 4th panel: the current artwork of the whole temple; it shows the design, materials, colors and painting style, but NOT the camera angle. The faint grid squares are one tile each, and the yellow frame is the tile the temple stands on (the middle of the temple).

Draw TWO images of the same temple, side by side on one transparent sheet, at exactly the same scale and the same position on the ground, with clear transparent space between them:
(A) the whole temple, matching the 2nd panel (block-out of the whole temple) for angle and proportions;
(B) the ruined temple, matching the 3rd panel (block-out of the ruined temple) for angle, proportions and damage.
Both must line up perfectly: every part that is not broken (the steps, the left column, the left wall, the left half of the roof, the altar stand) is in exactly the same place and the same size in (A) and (B).

Camera and proportions (copy the view cube and the block-outs exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above as plain rectangles, with no shrinking toward the back: a 1x1 top face is a perfect square, exactly one tile wide and one tile deep. The round column tops and the round altar stand look like full circles.
- Only the front (south) face of an object is visible below its top face. The front face is a straight rectangle facing the viewer. Left, right and back side faces are NOT visible at all.
- Height scale: one tile of real height appears as a front face 0.8 tiles tall. The bottom edge of the front face sits exactly on the bottom edge of the object's footprint, and the top face is shifted up by the object's height.
- All vertical edges are perfectly vertical and all horizontal edges are perfectly horizontal. There is no perspective, no vanishing point, and no fisheye.
- The width, depth, height and position of every part follow the block-outs. The temple is about 2.7 tiles wide.
- The columns and walls stand upright, perfectly vertical, not tilted.

(A) The whole temple: the same design as the current artwork (4th panel): white stone steps, two white columns with gold rings in front, a gabled white stone roof with gold stars (one on the top, one on the front triangle), blue banners with gold stars hanging on both sides, and a glowing pale blue crystal floating above a round stone altar stand inside. A little moss and small vines on the steps. Only the camera angle and proportions change to match the 2nd panel.

(B) The ruined temple: the same temple, but old, abandoned and partly collapsed, exactly as in the 3rd panel:
- The gable roof: the left half of the roof still stands; the right half has caved in and fallen, so you can look down into the temple on the right. Only a small jagged piece of the right roof is left near the ridge at the back. The front triangle (pediment) is broken off on its right side with a jagged edge. The gold stars on the roof are gone.
- The right part of the stone beam above the columns has fallen; the beam ends with a broken edge.
- The left front column stands. The right front column is broken at about half its height: a short broken stump stands on its base, and the upper part of that column (with its dull gold ring) lies on its side on the upper step.
- The right side wall is broken off low with a jagged top.
- The crystal on the round altar stand is broken: only a small, dull, grey-blue shard is left. It does not glow. No sparkles, no light.
- The left banner hangs torn and short and faded. The right banner has fallen and lies on the upper step.
- Broken stone pieces and small rubble lie on the steps. Thin cracks run through the steps, walls and beam.
- Some moss and small green vines on the steps, the column bases and the walls.
- The stone is a little dusty and dull, the gold is faded, the blue is faded, but everything stays light and soft (the same bright, gentle palette as the current artwork).

Style: Same painting style as the current artwork. Pale, light, soft colors; no dark or heavily saturated colors. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Draw both large and detailed, filling most of the image. Transparent background, no ground shadow, no grass or ground under the temples, no text, no frame. Do not draw the grid, the yellow frame, the cubes or the block-outs from the reference.
```
