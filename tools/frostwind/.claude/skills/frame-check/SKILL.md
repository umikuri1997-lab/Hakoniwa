---
name: frame-check
description: Capture, measure and compare rendered Frostwind frames. Use after any change to drawn output (shaders, ground painters, sprites, ramps, placement), to verify it and to produce before and after evidence.
---

# Check a frame

A change to drawn output is unverified until its frame has been seen. Tests hold
laws; a frame shows what the laws did not name.

## Capture

Build first: `npm run build`. Then one deterministic frame (seed, time and
camera are pinned):

```bash
node tools/shot.mjs --scene meadow --res 480x270 --zoom 2 --out /tmp/after.png
node tools/shot.mjs --scene desert --at -480,480 --time 12.5 --out /tmp/erg.png
```

`--scene frostwood|meadow|swamp|desert`. Named views: `--common`, `--pavilion`,
`--settlement`, `--lakehouse`, `--oasis`, `--hamlet`, `--camp`, `--dunes`,
`--creatures`, `--machines`. `--at x,y` walks the camera to a world position.
`--time` pins the clock, `--wind 0` stills the sway. The tool prints the number
of distinct colours; a sudden fall often means a pass failed to compile.

## Before and after

Keep the old bundle and shoot both builds with the same flags:

```bash
git stash && npm run build && cp dist/frostwood.html /tmp/before.html && git stash pop
npm run build
node tools/shot.mjs --html /tmp/before.html <flags> --out /tmp/before.png
node tools/shot.mjs <flags> --out /tmp/after.png
```

A refactor that claims no visual change must produce byte-identical PNGs:
`cmp /tmp/before.png /tmp/after.png`.

## Measure, then look

1. State the expected change as a number: which surface, which rung, how many
   pixels. Measure it from the baked chunk or the sprite channels in a test.
2. Read both PNGs. Compare the named shape first, then scan the rest of the
   frame for what moved without a reason.
3. Motion needs two frames: shoot two `--time` values and count the pixels that
   differ.
4. Run `npm run test:frame`: every pixel must be an entry its world declared.

Report the measured number and what the frame shows. Keep the image pair for the
user when the change alters the look on purpose
(`.claude/rules/pixel-review-gate.md`).
