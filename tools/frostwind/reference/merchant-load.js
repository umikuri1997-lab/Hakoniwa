/* ═══════════════════════════════════════════════════════════════════════════
   THE MERCHANT'S LOAD — geometry only, kept after the figure purge.

   Lifted verbatim from src/merchant.js finishMerchant() before that file and
   the retro rig it drew onto were deleted. This is the one piece of the human
   cast worth carrying forward: the pack, the bedroll, the wares, the rope and
   the poles are authored pixel structure, and they read at 20 px where every
   rig that tried to solve a body did not.

   NOTHING IMPORTS THIS. It sits outside src/, and build.mjs bundles only
   src/main.js, so it cannot reach the ship artifact. It is data waiting for a
   drawing layer, and reference/merchant-load.md says what the tables alone
   cannot carry.

   Rows are SOURCE rows, offsets from `packTop`, positive downward. The
   original resolved them through RL(), which anchored to the world contact row
   rather than to the body sink. See the .md.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The four value buckets the whole load was drawn in. Four and not a gradient:
   the shader posterises, so a fifth value was a value that never survived. */
const MER_T0 = 0.14;   // the body of the load, its darkest bucket
const MER_T1 = 0.45;   // bedroll, lower lid row, strap
const MER_T2 = 0.80;   // the top lid row, the brim's sunward face
const MER_T3 = 1.00;   // reachable only by turning a pixel at the sun

/* Three men, not one man in three hats. Each takes an existing ramp; birch is
   held one rung short of its top because that rung is brighter than the snow
   he walks on and a merchant is not a light source. */
const MERCHANT_COATS = [
  { ramp: 'warm',  sMin: 0.04, sMax: 1.00 },
  { ramp: 'birch', sMin: 0.02, sMax: 0.80 },
  { ramp: 'trunk', sMin: 0.04, sMax: 1.00 },
];

/* ── THE OUTLINES ──────────────────────────────────────────────────────────
   Half-width per row, authored per row and not interpolated. The original
   comment is the load-bearing one: "pack outline is authored per row;
   interpolation erases its readable inventory masses." The bulges are the
   point. A smooth curve through these numbers is a sack, and a sack is not an
   inventory.

   PACK_SIDE is eighteen rows and widest low (12 at rows 12-13), so the load
   sits over the hips rather than the shoulders, which is what makes it read as
   weight rather than as a hump.                                              */
const PACK_SIDE  = [6, 9, 10, 11, 11, 10, 10, 10, 11, 11, 11, 11, 12, 12, 11, 10, 8, 6];
const PACK_BACK  = [3, 5, 6, 7, 8, 8, 8, 8, 7, 7, 7, 7, 6, 5, 4];
const PACK_FRONT = [2, 3, 4, 4, 4];

/* Where row 0 of the outline sits, per facing. Source rows, so negative is
   above the crown row the rig measured from. */
const PACK_TOP = { 0: -3, 1: 0, 2: -4 };

const OUTLINE = { 0: PACK_FRONT, 1: PACK_BACK, 2: PACK_SIDE };

/* ── THE FEATURES ──────────────────────────────────────────────────────────
   Every row here is an offset from packTop. The x extents are relative to the
   sprite centre line cx, on a canvas padded 12 px left, right and top.       */
const LOAD = {
  /* Head-on the load is mostly hidden, so it is allowed past each shoulder by
     exactly two pixels at |dx| 3..5 over rows 7..12 (measured from the row
     origin, not packTop). More than that and the man walking at you is a man
     wearing a wardrobe. */
  shoulderBleed: { rows: [7, 12], dx: [3, 5], dxWithPose: [3, 5], dxNoPose: [5, 5] },

  /* The lid: two rows, the upper one a bucket brighter, so the load has a top
     rather than a flat edge. Only pixels already inked are re-inked, which is
     how the lid follows the outline instead of overrunning it. */
  lid: { rows: [0, 1], values: [MER_T2, MER_T1], xSpan: [-13, 9] },

  /* Three pixels of settled snow on the sunward end of the lid only. A white
     bar across the whole of it is a second hat. */
  lidSnow: { row: 0, count: 3, fromLeftEdge: true, value: 0.68 },

  /* The bedroll, on the two rows the outline already stands proud of, plus one
     strap round the middle at row 9. ONE row of each, a single bucket up: two
     rows of the light bucket across the full width is a plank, and a plank
     lying on a box is a shelf, not a bundle.

     Walking away, the top three rows of the load are under the brim, so the
     bedroll drops to the first row clear of it. */
  bedroll: { row: (dir) => (dir === 1 ? 5 : 3), values: [MER_T1, MER_T0], xSpan: [-13, 9] },
  strap:   { row: 9, value: MER_T1, xSpan: [-13, 9] },

  /* ── the wares ───────────────────────────────────────────────────────────
     Four by four, drawn as an accent ring with a 2x2 light centre: sixteen
     accent pixels, and with the two pole beads they are the only saturated
     thing on him. A merchant's wares glinting is what a scarce saturated
     colour is for.

     Head-on there are none, and that is not an omission: his wares are on his
     BACK, so the one facing that cannot show them is the one facing you. */
  wares: {
    0: [],
    1: [{ x: -6, row: 5, s: 0.95 }, { x: 2, row: 9, s: 0.42 }],
    2: [{ x: -10, row: -1, s: 0.95 }, { x: -11, row: 7, s: 0.42 }],
  },

  /* ── the rope ────────────────────────────────────────────────────────────
     Two strands with a gap between them, so the loop has a HOLE in it: the one
     break in an otherwise solid silhouette. Drawn in the snow material, the
     only ramp in this palette that goes lighter than the ground. */
  rope: {
    0: null,
    1: { x: -6, row: 10, w: 2, h: 5 },
    2: { x: -10, row: 11, w: 2, h: 5 },
  },

  /* ── the poles ───────────────────────────────────────────────────────────
     Two of them, thin, curving up out of the load, each ending in one bright
     bead. They are the reason he reads as a merchant from across the frame:
     nothing else in this world carries anything above its own head.

     The step counts differ only because the load tops out at a different row
     in each facing; the TIP lands at row -10 in all three, so he is exactly as
     tall walking at you as walking away. Walking away the load rides UNDER the
     brim, so the poles are picked up just clear of it rather than at the
     load's own top, or they would be drawn straight down the middle of the
     hat.

     `lean` is applied per step as lean*0.2 for the first half of the climb and
     lean*0.8 for the second, so the pole leaves the load near-vertical and
     splays only near the tip. A constant lean draws a straight diagonal, which
     reads as a spear rather than as something lashed on and flexing. */
  poles: {
    0: [{ x: -3, fromPackTop: 0, steps: 8,  lean: -0.7, bead: 0.95 },
        { x:  3, fromPackTop: 1, steps: 5,  lean:  0.6, bead: 0.55 }],
    1: [{ x: -3, absRow: 0,      steps: 11, lean: -0.45, bead: 0.95 },
        { x:  3, absRow: 1,      steps: 8,  lean:  0.45, bead: 0.55 }],
    2: [{ x: -6, fromPackTop: 0, steps: 7,  lean:  0.8, bead: 0.95 },
        { x: -10, fromPackTop: 1, steps: 4, lean: -0.7, bead: 0.55 }],
  },

  /* Profile draws the load's right edge at cx-3 rather than cx+e: seen from
     the side the pack is behind him, so it must not cross his own front line. */
  profileRightEdge: -3,
};

/* ── THE BRIM ──────────────────────────────────────────────────────────────
   Not the load, but the other half of why he reads. Two rows, because one row
   fifteen pixels wide is a rod, and a rod pointing forward out of a dark block
   is a gun barrel, which is what one row drew. Asymmetric: 4 back / 7 front in
   profile, 7/7 otherwise. Every fourth pixel beyond |x|>=4 drops a row, which
   is the brim's underside catching light.

   The brim tracked the BODY (R), not the world (RL). See the .md. */
const BRIM = {
  backSpan: (prof) => (prof ? 4 : 7),
  frontSpan: 7,
  crown: { rows: [1, 0], xSpan: [-2, 2], values: [MER_T1, MER_T0] },
  rows: [
    { row: 2, value: MER_T2, sunwardValue: MER_T3 },
    { row: 3, value: MER_T1 },
    { row: 4, value: MER_T0, onlyBeyond: 4, everyOther: true },
  ],
  snowPixel: { row: 2, atBackEdge: true, value: 0.72 },
};

/* The face, under the brim. Drawn in the SNOW material for the same reason the
   squirrel's plume is: it is the only ramp in this palette that goes lighter
   than the ground, and a pale patch is only a face if it is paler than
   everything round it. Four pixels head-on, three in profile, none from
   behind. */
const FACE = {
  0: [{ dx: -1, row: 4, v: 0.62 }, { dx: 0, row: 4, v: 0.66 },
      { dx: 1, row: 4, v: 0.62 }, { dx: 0, row: 5, v: 0.58 }],
  1: [],
  2: [{ dx: 1, row: 4, v: 0.66 }, { dx: 2, row: 4, v: 0.60 },
      { dx: 1, row: 5, v: 0.58 }],
};

export {
  BRIM, FACE, LOAD, MERCHANT_COATS, MER_T0, MER_T1, MER_T2, MER_T3,
  OUTLINE, PACK_BACK, PACK_FRONT, PACK_SIDE, PACK_TOP,
};
