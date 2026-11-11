# ノームの石像（stele）の絵をたのむプロンプト

わたす絵は1まい：`ref/sheet.png`（`python3 tools/art/gnome/gnome3d.py` で作る）。左がお手本のキューブ、右が3D（1マス＝64ドット、黄色いわくが置く1×1マス）。
できあがりは、はば54・高さ92ドットくらい（g64）。

```
Use the attached reference image as a strict guide. It is one sheet: on the left a view cube, on the right a 3D block-out of a small garden statue on a tile grid. One faint grid square = one tile = 64 pixels; the yellow frame is the statue's 1x1-tile footprint.

Camera and proportions (copy the view cube and the block-out exactly):
- The view is a straight-on, front-facing top-down oblique view (classic top-down RPG angle). The camera looks from the south, tilted down; there is NO rotation and NO isometric angle.
- Top faces are seen fully from above with no shrinking toward the back: the square pedestal top is a full square.
- Only the front (south) side is visible below the top faces. Left, right and back sides are NOT visible.
- Height scale: one tile of real height appears 0.8 tiles tall on screen. The statue stands upright, perfectly vertical, not tilted. No perspective, no vanishing point, no fisheye.
- Size and position follow the block-out: the pedestal fills most of the tile.

Draw: a cute stone garden gnome statue, a little guardian of a cozy European-style meadow village (pixel art). Follow the block-out:
- A low square stone pedestal with softly rounded edges.
- On it stands a chubby gnome carved from pale stone, facing the viewer: a tall pointed hat, a round soft beard, a round nose, small closed smiling eyes peeking between the hat brim and the beard, a round tummy and two small feet.
- With both hands he holds a small stone shovel upright at his right side, its blade resting on the pedestal.
- Everything is the same pale warm gray stone (a statue, not painted), shaded gently so the hat, beard and body read clearly. A few tiny soft green moss spots on the pedestal are okay.
- The statue stands upright, perfectly vertical, not tilted. Friendly and cute, not spooky.

Pixel art style with a clean, regular pixel grid and crisp square pixels; no anti-aliasing. Draw it large and detailed, filling most of the image; do NOT shrink it to a small pixel size (it will be resized later). Keep the proportions of the 3D block-out exactly.

Style: Pale, light, soft colors matching a gentle pastel game; no dark or heavily saturated colors. No thick or dark outlines; if an outline is used, it is a thin 1-pixel line only slightly darker than the color next to it, never black or near-black. Clean flat colors with soft shading; no noise, no grain, no speckles, no dithering, no gritty texture. Transparent background, no ground shadow, no grass, no text, no frame. Do not draw the grid, the yellow frame, or the cubes from the reference.
```
