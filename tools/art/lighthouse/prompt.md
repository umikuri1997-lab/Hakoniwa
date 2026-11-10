# 灯台の絵をたのむプロンプト

わたす絵は1まい：`ref/sheet.png`（`python3 tools/art/lighthouse/lighthouse3d.py` で作る）。左がお手本のキューブ、右が設計図（`ref/plan.png`）どおりに組んだ3D（1マス＝64ドット、黄色いわくが置く2×2マス）。
できあがりは、はば128・高さ342ドット（g64）。灯室のガラスは、あかりのついた色でたのむ（光の筋はあとでゲームで足す）。

```
Use the attached reference image as a strict guide. It is one sheet: on the left a view cube, on the right a 3D block-out of a lighthouse on a tile grid. One faint grid square = one tile = 64 pixels; the yellow frame is the lighthouse's 2x2-tile footprint.

Camera and proportions (copy the view cube and the block-out exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: round floors and roofs look like full circles, not flattened ellipses.
- Only the front (south) side of the building is visible below its top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. The tower stands upright, perfectly vertical, not tilted; every vertical line is perfectly vertical. No perspective, no vanishing point, no fisheye.
- Size and position follow the block-out exactly: the round stone base fills the 2x2 footprint, and the whole lighthouse is 128 pixels wide and about 342 pixels tall.

Draw: a charming European-style stone lighthouse for a cozy meadow village game (pixel art), built like a real lighthouse, part by part from the bottom up, exactly as in the block-out:
1. Foundation: a low round plinth of pale gray stone blocks, 2 tiles across. In front of the door, two stone steps are cut into the plinth.
2. Tower: a round tower of white plaster that tapers gently toward the top, standing on the plinth.
3. Entrance: an arched wooden door at the bottom front of the tower, framed by pale gray stones.
4. Three small arched windows with stone frames, set at different heights and slightly different angles, following the spiral staircase inside. The window glass is pale soft blue-gray.
5. Corbels: a ring of small stone brackets at the top of the tower, stepping outward to hold up the gallery.
6. Gallery: a round stone balcony floor that sticks out beyond the tower, with a thin iron railing of slim posts and two horizontal rails (top rail and middle rail), in pale blue-gray.
7. Watch room: a short round white room on the gallery floor, with a small arched wooden door opening onto the gallery.
8. Lantern room: on the watch room, a low stone sill and then an octagonal glass lantern with red-orange frames (vertical mullions and one horizontal bar). The glass glows with warm pale yellow light, and a lens is softly visible inside.
9. Roof: a red-orange, slightly domed cone roof over the lantern, with a small round ventilator ball on top and a thin lightning rod above it.

Pixel art drawn on an exact pixel grid at the final size (128 x 342 pixels), shown upscaled with nearest-neighbor so every pixel is a crisp square; no anti-aliasing, no half pixels. No light beams, no rays, no glow outside the glass.

Style: Pale, light, soft colors matching a gentle pastel game: warm white plaster, pale gray stone, soft red-orange roof, light wood door, pale yellow glowing glass; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass, no water, no rocks, no text, no frame. Do not draw the grid, the yellow frame, or the cubes from the reference.
```
