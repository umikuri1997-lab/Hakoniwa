import { PLAYER_H } from './scale.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The folk body. Anatomy and contact for the slim figure. figure-folk.js owns
   the raster.

   Authority: the ten STRANDED townfolk sheets in assets/townfolk, measured at
   native resolution. `headphones` (8 x 18) is the plainest:

     rows  0.. 1   the eye band          2 px wide, one flat colour
     rows  2.. 3   the rest of the face  2 px wide, one step warmer
     rows  4..15   the body             12 rows, 8 px wide
     rows 12..13   the hands             2 px wide, the eye colour again
     rows 16..17   the legs              2 rows, 1 px each

   Across the ten: head 22-35% of stature, body about 62%, legs 5-16%.
   Proportions are the STRANDED read; the value discipline is MOCT's.
   docs/LIFE.md owns why.

   Invariant: joints are never solved in continuous space and quantised. Every
   row, width and contact here is an integer on the grid, and figure-folk.js
   draws straight raster runs between integer endpoints.
   ═══════════════════════════════════════════════════════════════════════════ */

/* One cast row. `ramp2` is the accent cloth (material 6), `folkSignal` in
   every world, so face and hands do not change with the biome. `sMin`/`sMax`
   are the rung window the biome budget test checks. `fashionFor` in culture.js
   owns the coat ramp. */
const P = (key, h, sMin = 0.05, sMax = 1.00) =>
  ({ key, h, ramp2:'folkSignal', sMin, sMax });

/* Every person in the world is on this body. Stature fractions are
   measurements. The rung window measures how much of its ladder a body
   spends: the elder's 0.80 ceiling keeps his coat off the brightest rung on
   any ramp. */
const FOLK = Object.freeze({
  /* One man, four wardrobes. people.js decides which row a scene draws. */
  traveller:      P('walk',            1.00),
  meadowTraveller:P('meadowTraveller', 1.00,        0.05, 1.00),
  swampTraveller: P('swampTraveller',  1.00,        0.04, 0.92),
  desertTraveller:P('desertTraveller', 1.00,        0.04, 1.00),

  /* the oasis and the road */
  desertGardener: P('desertGardener',  0.79,        0.05, 0.92),
  desertDrover:   P('desertDrover',    0.81,        0.04, 0.88),
  /* The gallery pair. The digger works a tunnel 1.2 m high and is the short
     one; the keeper is read from across the pool and is the tall one. */
  desertDigger:   P('desertDigger',    22/PLAYER_H, 0.05, 1.00),
  desertKeeper:   P('desertKeeper',    28/PLAYER_H, 0.05, 0.92),

  /* the boreal village */
  wayfarer:       P('wayfarer',        24/PLAYER_H, 0.05, 0.86),
  elder:          P('elder',           23/PLAYER_H, 0.06, 0.80),
  merchant:       P('merchant',        0.77,        0.04),
  woodcutter:     P('woodcutter',      0.77,        0.05, 0.86),
  graveWatcher:   P('graveWatcher',    26/PLAYER_H, 0.05, 0.88),
  fruitBearer:    P('fruitBearer',     20/PLAYER_H, 0.06, 0.90),
  headphones:     P('headphones',      21/PLAYER_H, 0.12, 0.92),
  thickDude:      P('thickDude',       22/PLAYER_H, 0.05, 0.88),
  bookDude:       P('bookDude',        20/PLAYER_H, 0.05, 0.90),
  axeman:         P('axeman',          24/PLAYER_H, 0.04, 0.88),
  leader:         P('leader',          29/PLAYER_H, 0.05, 0.96),
  featherHat:     P('featherHat',      27/PLAYER_H, 0.05, 0.90),
  spearGuard:     P('spearGuard',      27/PLAYER_H, 0.08, 0.94),
  bearKid:        P('bearKid',         18/PLAYER_H, 0.06, 0.90),

  /* the meadow steading */
  meadowGrower:   P('meadowGrower',    25/PLAYER_H, 0.05, 0.92),
  meadowTender:   P('meadowTender',    22/PLAYER_H, 0.05, 0.90),
  meadowWeaver:   P('meadowWeaver',    23/PLAYER_H, 0.05, 0.88),

  /* the swamp landing */
  swampFisher:    P('swampFisher',     0.92,        0.04, 0.90),
  swampBoatwright:P('swampBoatwright', 0.96,        0.04, 0.92),

  /* The Hollow: the traveller's cave wardrobe, and the earth folk. Sources
     give 0.6 m (docs/life/HOLLOW.md, Stature). The medium wins: 18 px
     (1.18 m) is the floor people.js clamps the cast to, where a profile hem
     spans three columns (figure-folk.js coatPass).
     Window starts at 0.20. Measured at 0.06 under the ceiling's light: 62 of
     the tender's 131 pixels resolve to the fleece's second rung, 29 RGB from
     the resting floor. At 0.20 the coat spends the upper two. */
  hollowTraveller:  P('hollowTraveller',   1.00,        0.05, 1.00),
  /* 19 px: at 18 the basket's rim sits on the belt row and the chest
     measures 8 px, then 12. */
  hollowTender:     P('hollowTender',      19/PLAYER_H, 0.20, 1.00),
  hollowLamplighter:P('hollowLamplighter', 18/PLAYER_H, 0.20, 1.00),
  hollowCutter:     P('hollowCutter',      18/PLAYER_H, 0.20, 1.00),
  hollowKeeper:     P('hollowKeeper',      18/PLAYER_H, 0.20, 1.00),
});

/* Invariant: an atlas key names exactly one cast row. */
const CAST_BY_KEY = Object.freeze(Object.fromEntries(
  Object.values(FOLK).map((row) => [row.key, row]),
));

/* Three states. Walk and run advance by ground distance (docs/LIFE.md:
   distance owns phase); idle is the one state a clock may own. */
const FOLK_STATES = Object.freeze({ idle: 6, walk: 8, run: 8 });
const castStates = () => FOLK_STATES;

/* Five views: 0 front, 1 away, 2 profile, 3 down diagonal, 4 away diagonal.
   Views 2 to 4 are authored facing screen-right and mirror for left, which is
   eight facings. `figureViewFromHeading` in attention.js resolves a heading
   to one of them. */
const FOLK_VIEWS = 5;

const heightPx = (row) => Math.max(4, Math.round(PLAYER_H * row.h));

/* ── the cadence law ───────────────────────────────────────────────────────
   Sets how far the world moves per frame of animation and how far apart boot
   prints fall. Source: Grieve & Gear 1966. Step length is close to 0.415 of
   stature in adult walking, so a shorter person leaves closer prints. */
const STEP_OF_STATURE = 0.415;
const stepPx = (hPx) => Math.max(2, Math.round(STEP_OF_STATURE * hPx));

/* Lateral print offset: half of bi-iliac breadth at this scale. */
const TRACK_HALF_WIDTH = 1.7;

/* Slip is per cycle. An 8-frame cycle draws two steps covering
   2 * stepPx = 22 px at the player's stature, and the ground under it moves
   27.5, so the feet slide 20% against it (GAIT_SLIP, a medium concession).
   The prints keep the true Grieve & Gear spacing.

   Speed only sets cadence, because gaitFrames counts ground, not time. The
   cycle is sized against about two steps per second at the preferred walk
   (Bohannon 1997); the traveller at 36.4 px/s (2.38 m/s) takes about 2.6.
   Runs stretch the step by the 1.45 the print spacing uses. */
const GAIT_SLIP = 1.25;
const gaitCyclePx = (hPx, state = 'walk') =>
  2 * stepPx(hPx) * GAIT_SLIP * (state === 'run' ? 1.45 : 1);
/* frames advanced for a body of stature hPx that covered d px of ground */
const gaitFrames = (d, hPx, state = 'walk') =>
  d * FOLK_STATES.walk / gaitCyclePx(hPx, state);

/* ── proportions ───────────────────────────────────────────────────────────
   Rows are fractions of (h - 1) so the ground lands exactly on the last row at
   any stature; widths are fractions of h.

   Named concessions to the medium, both legibility floors:

   1. The head is 5 px wide where the reference is 4. The face is a 2 px band
      and needs a dark column on each side, or the rim pass eats half of it.
   2. The body is 11 px wide, 0.42 of stature, between the reference's ~0.60
      and the MOCT read's 0.31. A 15-row torso at 9 px is a plank. */
const F = Object.freeze({
  /* The face sits low in the head with one row of mass above it and one
     below. Measured on the sheets: on `headphones` the face is the whole head,
     on `book-dude` and `bear-kid` four of six rows. Under two rows of cap it
     reads as a chin. */
  eye:       3/25,   // the eye band: one row, two pixels wide
  face:      4/25,   // the rest of the face: one row, two pixels wide
  jaw:       5/25,
  shoulder:  6/25,
  elbow:    12/25,
  wrist:    18/25,   // the hands hang at the coat edge, above the hem
  belt:     13/25,
  /* Three rows of leg. Measured on the sheets: `headphones` and `book-dude`
     show two, `thick-dude` three, `grave-watcher` none. Five rows of one-pixel
     stub read as wire stilts beside them. */
  hem:      22/25,
  knee:     23/25,
  ankle:    24/25,
  /* half-widths, fractions of stature */
  headHW:      2/26,   // head 5 px
  shoulderHW:  4/26,   // the rounded top two rows, 9 px
  bodyHW:      5/26,   // chest to hem, 11 px
  /* Where a leg stands at rest, measured out from the centre. A leg is one
     pixel, so the air between the two at rest is 2*legStand - 1 = 3 px. No
     later pass may fill that gap (docs/LIFE.md law 3). The coat bounds how far
     a foot steps out from here. */
  legStand:    2/26,
});

/* ── where a garment ends on the leg ───────────────────────────────────────
   Source: Drillis & Contini 1966, the standard segment table. Knee height is
   0.285 of stature, the lateral malleolus 0.039, and the hip joint 0.530. So
   from hip to floor the knee sits 46% of the way down and the ankle 93%.

   They are fractions of the drawn run, not of stature (the concession).
   Anatomy wants twelve rows of leg on a 26 px figure; the coat's cut leaves
   between three and seven. Only the ratio survives that compression.

   A short stops just above the knee. */
const LEG_KNEE = 0.46;
const LEG_SHORT = 0.40;
const LEG_ANKLE = 0.93;

/* ── where a shirt ends ────────────────────────────────────────────────────
   The belt row is the hip in this drawing (row 13 of 26 sits at 0.48 of
   stature above the floor, the greater trochanter; the natural waist is at
   0.60). A tee ends at the hip; an untucked shirt hangs about 0.06 of stature
   below it. Both are above the coat hem in every cut. */
const SHIRT_DROP = Object.freeze({ tucked: 0, tee: 0.02, untucked: 0.06 });

const rowOf = (f, h) => Math.round(f * (h - 1));
const hwOf = (f, h, min = 1) => Math.max(min, Math.round(f * h));

/* Landmarks for one stature, in figure space: row 0 is the resting crown and
   row h-1 is the ground. The raster adds canvas headroom on top. */
function folkLandmarks(h) {
  return {
    crown: 0,
    eye: rowOf(F.eye, h),
    face: rowOf(F.face, h),
    jaw: rowOf(F.jaw, h),
    shoulder: rowOf(F.shoulder, h),
    elbow: rowOf(F.elbow, h),
    wrist: rowOf(F.wrist, h),
    belt: rowOf(F.belt, h),
    hem: rowOf(F.hem, h),
    knee: rowOf(F.knee, h),
    ankle: rowOf(F.ankle, h),
    ground: h - 1,
    headHW: hwOf(F.headHW, h, 2),
    shoulderHW: hwOf(F.shoulderHW, h, 2),
    bodyHW: hwOf(F.bodyHW, h, 3),
    legStand: hwOf(F.legStand, h, 1),
  };
}

/* ── gait ──────────────────────────────────────────────────────────────────
   The ground row never moves, and the crown range is exactly two rows.

   Stance is five of eight frames, duty 0.625, so double support is two of
   eight frames. Foot B runs the same schedule four frames behind.

   The schedule is normalised. `x` is a fraction of the excursion the drawn
   garment allows, positive toward the heading; `lift` is a fraction of the
   drawn leg run. `coatCut` and `coatBulk` move the hem and the coat width per
   wardrobe, so a pixel table meets three different bodies.

   Measured failure with pixel counts. A 3-row lift against a leg of 2 rows
   under a long coat, 3 under a mid one and 7 under `coatCut: short` erases
   the leg on two wardrobes. An excursion of +-4 against a profile reach of 3
   (lined coat) or 2 (thin) saturates the clamp: the uniform stance
   4, 2, 0, -2, -4 becomes 2, 2, 0, -2, -2 and the planted foot stalls and
   skates.

   The swing passes under the hip. Measured failure: peak lift on the frame
   after push-off, with the foot still behind the body, reads as a gallop, and
   the signed separation +8, +3, -2, -6, -8 crosses zero between frames, so no
   drawn frame has the legs coincide. Frames 2 and 6 are the pass: the swing
   foot is under the hip, the feet are within a column, and the lift peaks.
   WALK_CROWN peaks on the same frames.

   The pass lift is the shin: 1 - LEG_KNEE of the run, so what stays drawn is
   the thigh. That is three rows above the knee on the seven-row meadow leg
   and one on the two-row boreal leg.

   Boot prints keep the true Grieve & Gear spacing (gaitCyclePx above). */
const WALK_FOOT = Object.freeze([
  { x:  1,    lift: 0 },            // contact, double support, feet at their widest
  { x:  0.5,  lift: 0 },            // load
  { x:  0,    lift: 0 },            // mid stance, the body vaults over this foot
  { x: -0.5,  lift: 0 },            // terminal stance
  { x: -1,    lift: 0 },            // push off, double support
  { x: -0.5,  lift: 0.30 },         // early swing, the knee picking up
  { x:  0,    lift: 1 - LEG_KNEE }, // the pass: under the hip, shin folded away
  { x:  0.75, lift: 0.18 },         // reach, shin down, about to land
]);
/* Contact, down, pass, up. The crown is lowest one frame after contact, while
   the leading knee absorbs the landing, and peaks at the pass on frames 2 and
   6. The hem is pinned, so a crown row is a row of stretch in the coat, never
   a row of travel. */
const WALK_CROWN = Object.freeze([1, 0, 2, 1, 1, 0, 2, 1]);

/* ── the run has its own schedule ──────────────────────────────────────────
   Measured failure: sampling the walk at twice the phase, `(f * 2) % 8`, reads
   only the even frames. The run bank then holds two poses for two frames
   each; in profile the drawn separation alternates 4, 2, 4, 2 on the meadow
   and swamp and 6, 0, 6, 0 on the boreal traveller, and reads as a gallop.

   A run has flight. Stance is three frames of eight, duty 0.375, and the
   half-cycle offset leaves two frames with neither foot down: support runs
   1, 1, 1, 0, 1, 1, 1, 0, with no double support.

   The knee folds harder than in a walk (0.75 of the run against the walk's
   1 - LEG_KNEE). The crown is lowest at mid stance and peaks in flight. */
const RUN_FOOT = Object.freeze([
  { x:  1,    lift: 0    },   // contact
  { x:  0,    lift: 0    },   // mid stance, the deepest compression
  { x: -1,    lift: 0    },   // push off
  { x: -0.5,  lift: 0.55 },   // flight, the trailing foot folding up
  { x:  0,    lift: 0.75 },   // the pass, knee at its tightest
  { x:  0.5,  lift: 0.50 },   // swinging through
  { x:  0.85, lift: 0.28 },   // reaching
  { x:  1,    lift: 0.14 },   // flight, the leading foot about to land
]);
const RUN_CROWN = Object.freeze([1, 0, 2, 3, 1, 0, 2, 3]);

/* The run does not lean: `pose.lean` is 0 for every state. Measured failure:
   a lean is at most one column, `Math.round` turns it into a hard step at the
   middle of the coat, and only coatPass moves. `bookDude`'s profile jumps
   7 px to 10 px in one row and the graveWatcher loses its shoulder step. A
   pitch needs every upper-body pass to take the same offset. */
const RUN_LEAN = Object.freeze([0, 0, 0, 0, 0, 0, 0, 0]);

/* Where the feet stand, walking or not. Idle is the walk's contact frame with
   the motion taken out, so stopping does not snap the legs from eight pixels
   apart to four. A fraction like the rest of the schedule; `pose.stance`
   carries what it resolves to for this body, and the axial views size their
   foreshortened half-stride off it. */
const STANCE = WALK_FOOT[0].x;

/* Idle: the feet hold the ground row and the torso breathes, one row of rise
   held for a beat. Frame 4 is the blink. */
const IDLE_BREATH = Object.freeze([0, 0, 1, 1, 1, 0]);
const IDLE_BLINK  = 4;

/* One pose. All rows are figure space (0 = resting crown).

   `lift` is how far the head, the torso and the top of the coat rise. The hem
   and the legs do not move. Measured failure: a hem lift trailing the crown by
   one frame becomes the leg's top; the visible leg runs 4, 3, 4, 5, 4, 3, 4, 5
   rows and its upper end slides out of phase with the body.

   `legRun` is the rows of leg the garment leaves and `reach` is the columns
   this view's coat allows a foot to step out. The raster measures both and
   hands them in. The defaults are the bare anatomy. */
function folkPose({ h, state = 'walk', frame = 0,
  legRun = null, reach = null } = {}) {
  const L = folkLandmarks(h);
  const n = FOLK_STATES[state] || 1;
  const f = ((Math.floor(frame) % n) + n) % n;
  const run = Math.max(1, legRun ?? (L.ground - L.hem));
  const span = Math.max(1, reach ?? (L.bodyHW - 1));
  /* Symmetric rounding. Math.round breaks ties toward +Infinity: at a reach
     of 3 it sends +0.5 to 2 and -0.5 to -1, and the figure drifts on the
     spot. */
  const sdx = (v) => Math.sign(v) * Math.round(Math.abs(v) * span);
  /* a nonzero lift must not round to zero on a short run */
  const slift = (v) => (v ? Math.max(1, Math.round(v * run)) : 0);
  const stance = sdx(STANCE);

  if (state === 'idle') {
    return {
      L, state, frame: f, run, span, stance,
      lift: IDLE_BREATH[f],
      blink: f === IDLE_BLINK,
      lean: 0,
      feet: [
        { side: -1, dx: -stance, lift: 0, down: true },
        { side: 1, dx: stance, lift: 0, down: true },
      ],
      swing: 0,
    };
  }

  const half = n >> 1;
  const table = state === 'run' ? RUN_FOOT : WALK_FOOT;
  const a = table[f], b = table[(f + half) % n];
  const bodyFoot = table[(f + half) % n];
  return {
    L, state, frame: f, run, span, stance,
    lift: (state === 'run' ? RUN_CROWN : WALK_CROWN)[f],
    blink: false,
    lean: state === 'run' ? RUN_LEAN[f] : 0,
    feet: [
      { side: -1, dx: sdx(a.x), lift: slift(a.lift), down: a.lift === 0 },
      { side: 1, dx: sdx(b.x), lift: slift(b.lift), down: b.lift === 0 },
    ],
    /* arm swing follows the opposite foot; `x` is already -1..1 */
    swing: bodyFoot.x,
  };
}

/* Strike events are frame boundaries where a swinging foot first reaches the
   ground. The pose table owns the timing and the local contact point, so a
   world mark agrees with the drawn foot. */
function folkStrikes(fromFrame, toFrame, {
  h, state = 'walk', legRun = null, reach = null,
} = {}) {
  if (state === 'idle' || toFrame <= fromFrame) return [];
  const out = [];
  for (let frame = Math.floor(fromFrame) + 1; frame <= Math.floor(toFrame); frame++) {
    const pose = folkPose({ h, state, frame, legRun, reach });
    const before = folkPose({ h, state, frame:frame - 1, legRun, reach });
    for (let i = 0; i < pose.feet.length; i++) {
      const foot = pose.feet[i];
      if (foot.down && !before.feet[i].down)
        out.push({ ...foot, event:'strike', frame,
          at:(frame - fromFrame) / (toFrame - fromFrame) });
    }
  }
  return out;
}

/* A rider is anchored at the pelvis. The mount supplies the saddle point, the
   roll and its flank; this body supplies the integer seated chain.

   A seated leg is two segments with a knee in the corner: the thigh runs
   forward along the mount's back and the shin drops down its flank, each the
   figure's own leg split at the knee. One diagonal stick from the pelvis
   passes through the animal.

   `maxDrop` is where the mount's belly is. The chain stops at the flank
   whatever the figure's stature. */
function folkRidePose({ dir = 2, seatX = 0, seatY = 0, roll = 0,
  torsoLean = 0, thigh = 6, shin = 6, kneeAhead = 6, flankHalf = 5,
  maxDrop = 12 } = {}) {
  const axial = dir !== 2;
  const torsoX = seatX + (axial ? Math.round(-roll) : torsoLean);
  const drop = (y) => Math.min(seatY + maxDrop, y);
  if (axial) {
    /* one leg on each flank, and the far one is the flank the roll lifts */
    const kneeY = seatY + Math.max(2, Math.round(thigh * 0.45));
    const bootY = drop(kneeY + shin);
    return { seatX, seatY, torsoX, legs: [
      { far:true, hip:{ x:seatX - 1, y:seatY + 1 },
        knee:{ x:seatX - flankHalf, y:kneeY },
        boot:{ x:seatX - flankHalf, y:bootY } },
      { far:false, hip:{ x:seatX + 1, y:seatY + 1 },
        knee:{ x:seatX + flankHalf, y:kneeY },
        boot:{ x:seatX + flankHalf, y:bootY } },
    ] };
  }
  /* The shin goes forward. A seat on top of the back line is higher than the
     figure's leg is long, so a vertical shin ends in the air above the
     flank. */
  const kneeY = seatY + Math.max(1, Math.round(thigh * 0.38));
  const bootY = drop(kneeY + Math.round(shin * 0.86));
  const kneeX = seatX + kneeAhead;
  return { seatX, seatY, torsoX, legs: [
    { far:true, hip:{ x:seatX, y:seatY + 1 },
      knee:{ x:kneeX - 1, y:kneeY - 1 }, boot:{ x:kneeX + 1, y:bootY - 1 } },
    { far:false, hip:{ x:seatX + 1, y:seatY + 1 },
      knee:{ x:kneeX, y:kneeY }, boot:{ x:kneeX + 2, y:bootY } },
  ] };
}

export {
  F, FOLK, CAST_BY_KEY, FOLK_STATES, FOLK_VIEWS, GAIT_SLIP,
  LEG_ANKLE, LEG_KNEE, LEG_SHORT, SHIRT_DROP, STANCE,
  STEP_OF_STATURE, TRACK_HALF_WIDTH,
  castStates, folkLandmarks, folkPose, folkRidePose, folkStrikes,
  gaitCyclePx, gaitFrames, heightPx, stepPx,
};
