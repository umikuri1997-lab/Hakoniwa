# 風のステージの家の壁（帆布の壁・アカシアの板壁）の絵をたのむプロンプト

竹の壁（`tools/art/bamboowall`）と同じ部品をたのむ：横の壁（上の面と正面の、長くつづく帯）・柱（上の切り口と正面）・たての壁を上から見た帯。
どれも、ふちも枠もない、くりかえしてつながる帯にしてもらい、こちらで、くりかえしの間かくをさがして1マスぶん切りとる。
1つずつ、それだけで使えるように、共通のこと（見え方・色・輪郭・ノイズなし・背景）を、どちらにも書いてある。
お手本のキューブ（`tools/art/ref/view-cube.png`）を、いっしょにわたす（壁は高さがあるので）。

---

## 帆布の壁（`canvaswall`）

```
Use the attached reference image as a strict guide for the camera angle and proportions. In the reference, the faint grid squares are one tile each, and the cubes show the exact game projection:
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above as plain rectangles, with no shrinking toward the back.
- Only the front (south) face of an object is visible below its top face. Left, right and back side faces are NOT visible at all.
- Height scale: one tile of real height appears as a front face 0.8 tiles tall.
- All vertical edges are perfectly vertical and all horizontal edges are perfectly horizontal. There is no perspective, no vanishing point, and no fisheye.

Draw parts of a house wall for a cozy farming game set on breezy floating sky islands, like a cheerful amusement-park tent: soft canvas cloth with wide vertical stripes in pale coral pink and cream white, stretched tight inside a thin white-painted wooden frame, with a white wooden beam along the top edge and a thin white wooden baseboard along the bottom. Draw three separate parts on one image, with wide empty space between them:
1. A long straight wall strip running left to right, at least five tiles long: the narrow top face of the wall (about 0.3 tiles deep, the white top beam seen from above) and, directly below it, the front face (about 0.9 tiles tall). The stripes are all the same width and evenly spaced, and the pattern repeats regularly along the whole strip with no frame, no posts, no corners and no ends; both the left and right edges simply cut off the continuous wall.
2. One corner post standing alone: a square white-painted wooden post about 0.4 tiles wide, slightly taller than the wall, with its flat square top face seen from above and its front face below, upright, perfectly vertical, not tilted.
3. The same wall running from top to bottom of the picture (from the back toward the viewer), seen only from directly above as a long vertical strip about 0.3 tiles wide and at least four tiles long: the white top beam with a thin line of the striped canvas showing along it, repeating regularly, with no ends.
Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture, no wrinkles, no fine lines or scratches. Pale, light, soft colors; no dark or heavily saturated colors, no black. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows on the ground, no ground, no grass, no props, no doors, no windows, no text, no labels, no numbers.
```

---

## アカシアの板壁（`acaciawall`）

```
Use the attached reference image as a strict guide for the camera angle and proportions. In the reference, the faint grid squares are one tile each, and the cubes show the exact game projection:
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above as plain rectangles, with no shrinking toward the back.
- Only the front (south) face of an object is visible below its top face. Left, right and back side faces are NOT visible at all.
- Height scale: one tile of real height appears as a front face 0.8 tiles tall.
- All vertical edges are perfectly vertical and all horizontal edges are perfectly horizontal. There is no perspective, no vanishing point, and no fisheye.

Draw parts of a sturdy wooden house wall for a cozy farming game set on breezy floating sky islands: wide horizontal boards of warm light honey-colored acacia wood, overlapping slightly like clapboard siding, with a pale sky-blue painted top trim board and a pale sky-blue baseboard. Draw three separate parts on one image, with wide empty space between them:
1. A long straight wall strip running left to right, at least five tiles long: the narrow top face of the wall (about 0.3 tiles deep, the blue top trim seen from above) and, directly below it, the front face (about 0.9 tiles tall). All boards are the same height, evenly spaced, with board joints in a regular repeating pattern along the whole strip, and no frame, no posts, no corners and no ends; both the left and right edges simply cut off the continuous wall.
2. One corner post standing alone: a square post of the same honey acacia wood about 0.4 tiles wide, slightly taller than the wall, with a small pale sky-blue cap, its flat square top face seen from above and its front face below, upright, perfectly vertical, not tilted.
3. The same wall running from top to bottom of the picture (from the back toward the viewer), seen only from directly above as a long vertical strip about 0.3 tiles wide and at least four tiles long: the blue top trim with a thin line of the wood showing along it, repeating regularly, with no ends.
Clean flat colors with soft shading and only a few smooth wood grain lines; no noise, no grain texture, no speckles, no dithering, no gritty texture, no knots, no fine lines or scratches. Pale, light, soft colors; no dark or heavily saturated colors, no black. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Plain pure white background, no shadows on the ground, no ground, no grass, no props, no doors, no windows, no text, no labels, no numbers.
```
