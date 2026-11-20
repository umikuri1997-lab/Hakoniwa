# V1, the figure that read best

Kept because it was the best of the three, and deleted anyway because keeping a
rig alive as a comparison is how three of them accumulated. The tables are here.
The code is in Git history at `89bb41e:src/body.js` and `89bb41e:src/figure.js`.

Pixel dumps for all three facings, walk and idle, materials and values, are in
[v1-figure.txt](v1-figure.txt). A real GPU frame is at
[captures/v1-cast.png](captures/v1-cast.png), and the retro cast it was replaced
by is at [captures/retro-cast.png](captures/retro-cast.png). Open both. V1 reads
as solid stylized masses; retro reads as sticks.

## Why it worked

`HEADS = 3.71`. A real adult is about 7.5 heads. V1 was drawn at less than four,
which is not a mistake and not a chibi convention either: at `PLAYER_H = 26 px`
a 7.5-head figure gets 3.5 px of head, and a head that small cannot carry a
brim, a hood or a facing. V1 spent the pixels where the silhouette lives.

Everything below inherits from that one decision. The `STYLE_HW` multipliers
below are all greater than one, which is the same statement made twice: the
figure was deliberately wider than anthropometry says, because at four pixels
across the shoulders the anatomically correct width is indistinguishable from a
line.

That is the whole lesson, and it is why the later rigs failed. V1 was authored
in the target grid and then justified against measurement. Retro and the person
model were derived from measurement and then quantised into the grid, where a
one-pixel rounding error is a ten percent limb-length error that changes sign
between frames.

## The silhouette profile

Half-width per unit of height, the way an artist blocks a character out. The
pinch at 0.27-0.30 is the neck: without it head and shoulders fuse into one mass
and no amount of detail below will rescue it.

```js
const WALK_PROFILE = [
  [0.000, 0.042], [0.045, 0.094], [0.090, 0.122], [0.225, 0.122],
  [0.258, 0.078], [0.298, 0.056],
  [0.330, 0.204], [0.420, 0.198], [0.600, 0.198], [0.730, 0.226], [0.780, 0.216],
];
```

Read downward from the crown. Head reaches 0.122 half-width, neck pinches to
0.056, shoulders jump to 0.204, the coat flares back out to 0.226 at the hem.
The shoulder is 3.6x the neck. That ratio is the figure.

Profile depth is authored independently, because narrowing the front silhouette
is not a valid side view:

```js
const PROFILE_DEPTH = [
  [0.000, 1.00], [0.045, 1.02], [0.090, 1.05], [0.225, 1.05],  // a head is deeper than broad
  [0.258, 0.98], [0.298, 1.00],                                // the neck is round
  [0.330, 0.62], [0.420, 0.66], [0.600, 0.70],                 // chest depth vs shoulder breadth
  [0.730, 0.90], [0.780, 0.90],                                // the coat flares, round in plan
];
```

Seen edge-on a body is a different shape, not a narrower one. Without this the
side view is the front view and the character never appears to turn; with a
single scalar it turns into a barrel.

`WALK_END = 0.720` is where the coat ends and the legs begin.

## The landmark ladder

Fractions of stature, measured upward from the ground. `ROW_FROM` was the sole
fraction-to-raster-row conversion in the entire rig, which is the invariant
worth carrying forward regardless of what replaces the figure:

```js
const ROW_FROM = (f, hPx) => Math.round(f * (hPx - 1));
```

```js
const LIFE = {
  ground: 0.000, ankle: 0.039, knee: 0.285, hip: 0.530, waist: 0.600,
  chest: 0.720, shoulder: 0.818, neck: 0.855, chin: 0.870,
  brow: 0.945, crown: 1.000,
};
const LIFE_ARM = { elbow: 0.630, wrist: 0.485, hand: 0.378 };
```

Radiale is the elbow, stylion the wrist, dactylion the fingertip, so the whole
limb is 0.44 of stature and the elbow sits at 43% of it. That is what makes an
arm bend where an arm bends rather than in the middle of itself.

Anthropometric half-widths, and the style multipliers applied on top of them.
Biacromial breadth is 0.245 of stature, head breadth 0.129, waist 0.150:

```js
const LIFE_HW = {
  ground: 0.030, ankle: 0.030, knee: 0.045, hip: 0.095, waist: 0.075,
  chest: 0.105, shoulder: 0.122, neck: 0.045, chin: 0.058, brow: 0.065, crown: 0.052,
};
const STYLE_HW = {
  ground: 1.40, ankle: 1.40, knee: 1.55, hip: 1.30, waist: 1.45,
  chest: 1.55, shoulder: 1.67, neck: 1.25, chin: 1.75, brow: 1.88, crown: 1.85,
};
const LEG_STYLE = 1.30;   // knee and ankle again, on top of the above
```

The brow at 1.88 and the chin at 1.75 are the largest departures. The face was
widened harder than anything else, because a face is the feature that stops
reading first.

## The gait

Four frames. Each limb phase is `[?, ?, footX, kneeY, lift]`; `kneeY` is
measured within the drawn leg, not total stature, and `KNEE_BAND = [0.33, 0.50]`
bounded it.

```js
const KNEE_MIDSTANCE = [0,  0, -1, 0.42,  0];
const KNEE_TOEOFF    = [0, -1, -3, 0.42,  0];
const KNEE_MIDSWING  = [0,  2,  1, 0.34,  0];
const KNEE_STRIKE    = [0,  2,  3, 0.42,  0];

const GAIT_SIDE = [
  [KNEE_MIDSTANCE, KNEE_MIDSWING ],
  [KNEE_TOEOFF,    KNEE_STRIKE   ],
  [KNEE_MIDSWING,  KNEE_MIDSTANCE],
  [KNEE_STRIKE,    KNEE_TOEOFF   ],
];
```

Total drawn stride is 6 px of foot travel, from -3 at toe-off to +3 at strike.
At `PLAYER_H = 26` that is the entire budget a walk cycle had to work with.

Face-on, gait changes limb depth and length, never lateral position:

```js
const FACE_PLANT = [0, 0, 0, 0.42,  0];   // weight on it, straight, on the ground
const FACE_RISE  = [0, 0, 0, 0.38, -1];   // leaving the ground, or landing on it
const FACE_LIFT  = [0, 0, 0, 0.34, -2];   // clear of it, knee up, shin hanging

const GAIT_FACE = [
  [FACE_PLANT, FACE_LIFT ],
  [FACE_PLANT, FACE_RISE ],
  [FACE_LIFT,  FACE_PLANT],
  [FACE_RISE,  FACE_PLANT],
];
```

A foot goes up and then comes down, so the lift peaks on the frames the body is
up on (0 and 2) and is half a pixel from landing on the ones it is down on. Read
one leg down the first column: plant, plant, high, low, plant.

```js
const GAIT_HEM = [0.5, 1, -0.5, -1];
```

The hem leads the legs and lags them again. Frames 0 and 2 are both passing
poses, and if they are byte-identical the cycle is really two frames wearing
four frames' clothing.

Arms, by half-cycle offset rather than authored twice:

```js
const ARM_LEAD   = [0,  1,  2, 0.44, -1];  // reaching, elbow bent, hand a row up
const ARM_PASS_B = [0,  0,  1, 0.44,  0];  // hanging, travelling back, still ahead
const ARM_TRAIL  = [0, -1, -2, 0.44,  0];  // extended behind, near-straight
const ARM_PASS_F = [0,  0, -1, 0.44,  0];  // hanging, travelling forward, still behind
const ARM_PHASE  = [ARM_LEAD, ARM_PASS_B, ARM_TRAIL, ARM_PASS_F];
const GAIT_ARM   = GAIT_SIDE.map((_, i) => [ARM_PHASE[i], ARM_PHASE[(i + 2) % 4]]);
```

## Cadence

```js
const STRIDE_PX = 6;              // max footX - min footX, derived from GAIT_SIDE
const SLIP      = 2.952;
const SPEED     = { walk: 62, run: 104 };   // px/s
const gaitRate  = (speedPx) => 2 * speedPx / (STRIDE_PX * SLIP);
```

Two steps to a cycle, four frames to a cycle, so the accumulator ticks once per
frame. `SLIP` is the fudge that made the feet appear to grip the ground: drawn
stride is 6 px but the world displacement per cycle is 6 * 2.952 ≈ 17.7 px. A
figure whose feet exactly match its world speed at this scale looks like it is
mincing, because the drawn stride is quantised to a grid the world position is
not.

That constant is the honest record of where the medium won. It is also the first
thing to re-derive rather than copy, because it was tuned against a 6 px stride
and means nothing away from one.

## The garment ladder

Twenty-one authored fractions, all warped through the same landmark ladder so a
figure with different proportions puts its pack where its back is:

```js
const GARMENT = {
  hoodTop: 0.085, rimTop: 0.090, faceTopF: 0.118, faceTopP: 0.128, faceBotP: 0.215,
  faceBotF: 0.220, hoodAperture: 0.255, brimTop: 0.262, leatherScan: 0.300,
  brimBot: 0.312, scarfTop: 0.340, packTop: 0.345, snowBot: 0.400, scarfBot: 0.430,
  packLid: 0.445, strapTop: 0.455, strapBot: 0.545, packBot: 0.585, beltY: 0.615,
  rimBot: 0.800, scarfRoot: 0.380,
};
```

Spans, which answer "how many pixels" rather than "which row" and were kept
apart for that reason:

```js
const SPAN = {
  canvasW: 0.60,    // sprite width before the |1 odd-ing and the 4 px margin
  legW: 0.115,      // thigh width
  legOff: 0.082,    // half the gap between the two legs, face-on
  faceHW: 0.54,     // the face aperture, as a fraction of the profile half-width
  scarfTail: 0.52,  // how far the tail walks, in rows
};
```
