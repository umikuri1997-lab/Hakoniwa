import { FOLK, LEG_ANKLE, LEG_KNEE, LEG_SHORT, SHIRT_DROP, folkLandmarks,
  folkPose, folkRidePose, heightPx } from './body-folk.js';
import { fashionFor } from './culture.js';
import { clamp } from './math.js';
import { newSprite } from './sprite.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The folk raster. body-folk.js owns anatomy and contact; this file owns the
   pixel concessions.

   Every mass is one flat tier chosen against the shader's posterise ladder
   (four buckets, a fifth never survives). A continuous gradient puts a
   posterise band edge in an arbitrary place. Modelling comes from the normal:
   a run of cloth is three facets. rampStep rounds to the nearest of four
   rungs, cuts at 1/6, 1/2 and 5/6.

   Layer order per view: legs, coat, belt, sleeves, hands, head mass, cap, eyes,
   then the rim over the finished silhouette. Cloth never stores a colour:
   material 5 resolves through the instance ramp, material 6 through the accent
   ramp, material 16 through the skin ramp, and material 4 through trunk.
   ═══════════════════════════════════════════════════════════════════════════ */

const MAT_UNDER = 17;   // folkDark: the head mass, shins, boots
const MAT_COAT = 5;     // instance-ramp cloth: coat, sleeves, cap
const MAT_SIGNAL = 6;   // ramp2, which every folk row sets to folkSignal
const MAT_EDGE = 7;     // silhouette column; the shader picks the sun side
const MAT_DYE = 18;     // folkDye: the one dyed band a garment is allowed

/* The dye is two rungs (madder and weld, sources in palette.js), so a dyed
   band is one of exactly two colours at every sun angle. */
const DYE_MADDER = 0.34;
const DYE_OCHRE = 1.00;
const dyeForm = (W) => (W.dyeHue === 'ochre' ? DYE_OCHRE : DYE_MADDER);

/* The signal is the two `folkSignal` values, used for face and hands. The
   accent branch of SPRITE_FS resolves 1.00 above the ramp's midpoint and 0.34
   below it at every sun elevation, so a signal pixel is one of exactly two
   colours. `machineSignal` has the same two-rung shape. */
const SIGNAL_EYE = 1.00;    // the eye band, and the hands
const SIGNAL_FACE = 0.34;   // the rest of the face, one step warmer

/* The four tiers. Solved against the material 4/5 branch of SPRITE_FS,
   v = 0.02 + 0.92 * shade * (0.62 + 0.52 * ndl), at a mid ndl of 0.6, so each
   lands near the middle of one of the four rungs. The dominant mass takes the
   brightest rung and everything else steps down from it. */
const T0 = 0.10;   // the darkest: the belt, the far shin, boots
const T1 = 0.33;   // the head mass, the near shin, the open coat's dark front
const T2 = 0.62;   // the cap, the sleeves, the hem band, the far thigh
const T3 = 1.00;   // the coat itself, and the near thigh

/* Three facets across a run of cloth. */
const facetNx = (x, c, hw) => {
  const t = (x - c) / Math.max(1, hw);
  return t < -0.45 ? -0.70 : t > 0.45 ? 0.70 : 0;
};

/* What each row wears. Cladding only: every row and width comes from the body.
   Culture supplies shared garment structure.

   capForm must not equal the coat's T3, or the cap merges into the shoulders
   and the head loses its top edge. It sits below the coat. */
const WEAR = Object.freeze({
  traveller:      { cap:'cap',  capForm:T2, open:false, hands:true, verticalHands:true },
  meadowTraveller:{ cap:'straw',capForm:T3, open:true,  hands:true, verticalHands:true },
  swampTraveller: { cap:'straw',capForm:T3, open:true,  hands:true, verticalHands:true },
  /* Open over an under-robe. A closed unlined coat has no bulk to widen the
     chest below the shoulder and measures 7 px on 8, against the shoulder
     rule. */
  desertTraveller:{ cap:'veil', capForm:T3, open:true, hands:true, verticalHands:true },
  /* The gardener works at the water (brim); the drover crosses open ground
     (veil). */
  desertGardener: { cap:'brim', capForm:T2, open:true,  hands:true },
  desertDrover:   { cap:'veil', capForm:T2, open:false, hands:true },
  /* The digger's dome is felt; the keeper's turban is the widest head in the
     desert. Both pin their hat in IDENTITY_DRESS. */
  desertDigger:   { cap:'felt',   capForm:T1, open:false, hands:true },
  desertKeeper:   { cap:'turban', capForm:T2, open:true,  hands:true },
  wayfarer:       { cap:'hood', capForm:T2, open:false, hands:true },
  elder:          { cap:'hood', capForm:T1, open:false, hands:true },
  merchant:       { cap:'cap',  capForm:T1, open:true,  hands:true },
  woodcutter:     { cap:'wool', capForm:T2, open:false, hands:true },
  graveWatcher:   { cap:'hood', capForm:T1, open:false, hands:true },
  fruitBearer:    { cap:'wool', capForm:T2, open:true,  hands:true },
  headphones:     { cap:'earflap', capForm:T1, open:false, hands:true },
  thickDude:      { cap:'wool', capForm:T2, open:true,  hands:true },
  bookDude:       { cap:'cap',  capForm:T2, open:false, hands:true },
  axeman:         { cap:'cap',  capForm:T1, open:true,  hands:true },
  leader:         { cap:'cap',  capForm:T2, open:true,  hands:true },
  featherHat:     { cap:'brim', capForm:T2, open:false, hands:true },
  spearGuard:     { cap:'earflap', capForm:T2, open:false, hands:true },
  bearKid:        { cap:'hood', capForm:T2, open:false, hands:false },
  meadowGrower:   { cap:'brim', capForm:T2, open:true,  hands:true },
  meadowTender:   { cap:'none', capForm:T2, open:true,  hands:true },
  meadowWeaver:   { cap:'cap',  capForm:T2, open:true,  hands:true },
  swampFisher:    { cap:'hood', capForm:T1, open:false, hands:true },
  swampBoatwright:{ cap:'brim', capForm:T2, open:true,  hands:true },
  /* The Hollow. Closed coats: the roof drips. IDENTITY_DRESS pins the hats. */
  hollowTraveller:  { cap:'hood', capForm:T2, open:false, hands:true, verticalHands:true },
  hollowTender:     { cap:'peak', capForm:T2, open:false, hands:true },
  hollowLamplighter:{ cap:'peak', capForm:T1, open:false, hands:true },
  hollowCutter:     { cap:'peak', capForm:T1, open:false, hands:true },
  hollowKeeper:     { cap:'hood', capForm:T2, open:false, hands:true },
});

/* Bounded hem lifts break the ruled lower edge without moving its anchor. */
const HEM_NOTCH = Object.freeze([0.22, 0.68]);
const CLOTH_FLUTTER = Object.freeze([0, 1, 0, -1, 0, -1, 0, 1]);
const BODY_PROFILE = Object.freeze({ slim:-1, regular:0, broad:1 });
/* Two garment axes. Cut is where the hem falls; bulk is how much air is in
   it. A puffy coat is a column wider and carries a quilt line, because width
   alone reads as a fatter person. */
const COAT_CUT = Object.freeze({ short:-4, mid:0, long:2 });
const COAT_BULK = Object.freeze({ thin:-1, lined:0, puffy:1 });
const CLOTH_BAYER = Object.freeze([0, 2, 3, 1]);
const KIT_SIDE_PAD = Object.freeze({
  'hand-lantern':2,'provision-basket':3,'winter-ledger':1,'wood-axe':2,
  'gnomon-staff':3,'cutter-mallet':2,'lamp-staff':3,
});
const CUE_TOP_PAD = Object.freeze({
  feather:9,'animal-ears':8,'wood-axe':8,'gnomon-staff':10,
  'lamp-staff':10,
});
/* A hat that stands over the crown needs its rows plus the run's three-row
   crown lift. Measured: at the default 6 a turban on a 26 px body reaches
   row 0 in the flight frames. */
const CAP_TOP_PAD = Object.freeze({ turban:8, felt:7, peak:8 });
/* The staff stands this many rows over the resting crown: 0.26 m, so the
   shadow's tip clears the reader's own head at every sun the world has. */
const GNOMON_OVER_CROWN = 4;

function folkContext(name, dir, frame, state, look, appearance = null) {
  const row = appearance?.row || FOLK[name];
  if (!row) throw new Error(`no such folk row: ${name}`);
  /* people.js hands dress in. A bare makeFolk(name) falls back to the same
     fashionFor, so there is one answer to what somebody wears; without it the
     figure paints on `snow`. */
  const fashion = appearance?.fashion ?? fashionFor(name);
  const W = { ...WEAR[name] };
  if (fashion) {
    if (fashion.hat !== null) W.cap = fashion.hat;
    if (fashion.capTone !== null) W.capForm = fashion.capTone === 'dark' ? T1 : T2;
    if (fashion.shoulderDrop !== null) W.shoulderDrop = fashion.shoulderDrop;
    if (fashion.hemRoundRows !== null) W.hemRoundRows = fashion.hemRoundRows;
    for (const key of ['bodyProfile','coatCut','coatBulk','scarf','sleeveWidth',
      'handShape','clothPattern','outerLayer','closure','headAccent','carriedKit',
      'legwear','shirtHem','dyePlace','dyeHue'])
      if (fashion[key] !== null) W[key] = fashion[key];
    W.planeSplit = fashion.planeSplit;
  }
  const h = heightPx(row);
  const L = folkLandmarks(h);
  /* headroom must clear the tallest crown lift in the run schedule, or the
     hop crops against the top of the canvas */
  const padTop = Math.max(6,CUE_TOP_PAD[W.headAccent]||0,
    CUE_TOP_PAD[W.carriedKit]||0,CAP_TOP_PAD[W.cap]||0);
  /* Body profile and coat bulk both widen it. Clamped because at bodyHW 5 the
     two axes together span four columns, and a nine-column coat on an 18 px
     child leaves no room for a sleeve. */
  const bodyHW = clamp(L.bodyHW + (BODY_PROFILE[W.bodyProfile] || 0)
    + (COAT_BULK[W.coatBulk] || 0), 3, L.bodyHW + 1);
  const hemRow = clamp(L.hem + (COAT_CUT[W.coatCut] ?? 0),
    L.belt + 3, L.ground - 2);
  /* a body is about two thirds as deep as it is wide: one column off the body
     half-width at this scale */
  const depthHW = Math.max(2, bodyHW - 1);
  /* The pose resolves against what this wardrobe draws in this view.
     body-folk.js authors the schedule in fractions: `coatCut` moves the hem
     (leg run 2 rows under a long coat, 7 under a short one) and `coatBulk`
     moves the width (profile foot reach 3 columns on a lined coat, 2 on a
     thin one). */
  const viewReach = Math.max(1, (dir === 2 ? depthHW : bodyHW) - 1);
  const pose = folkPose({ h, state, frame,
    legRun: L.ground - hemRow, reach: viewReach });
  const sidePad = KIT_SIDE_PAD[W.carriedKit]||0;
  const w = 2 * (bodyHW + 5 + sidePad) + 1;
  const H = h + padTop;
  const sp = newSprite(w, H);
  sp.ax = w >> 1;
  sp.ay = H - 1;
  sp.ramp = row.ramp ?? fashion?.ramp;
  sp.sMin = row.sMin;
  sp.sMax = row.sMax;
  if (row.ramp2 !== undefined) { sp.ramp2 = row.ramp2; sp.dMin = 0; sp.dMax = 1; }
  sp.kind = row.key;
  sp.tilt = 0;
  /* Where this garment ends, in sprite rows. The cut moves the hem by up to
     four rows, so checks read it here and not from the anatomy table. */
  sp.hemRow = padTop + hemRow;

  const put = (x, y, mat, form, nx = 0, ny = 0) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= H) return;
    const nn = Math.hypot(nx, ny);
    if (nn > 0.96) { nx *= 0.96 / nn; ny *= 0.96 / nn; }
    const i = y * w + x;
    sp.occ[i] = mat;
    sp.shade[i] = clamp(form, 0, 1);
    sp.ao[i] = clamp(form, 0, 1);
    sp.nx[i] = nx;
    sp.ny[i] = ny;
    sp.nz[i] = Math.sqrt(Math.max(0.04, 1 - nx * nx - ny * ny));
  };

  /* The hem stays pinned while head and torso rise by pose.lift. */
  const shift = { head: pose.lift, torso: pose.lift, hem: 0, leg: 0 };
  const Y = (r, part = 'torso') => padTop + r - shift[part];

  return { name, row, W, h, pose, L, bodyHW, depthHW, hemRow,
    sp, w, H, cx: sp.ax, padTop, put, Y, dir, look, handPoints:[] };
}

/* one flat run of cloth, three facets across */
function band(R, x0, x1, y, mat, form) {
  const a = Math.round(x0), b = Math.round(x1);
  const c = (a + b) * 0.5, hw = Math.max(1, (b - a) * 0.5);
  for (let x = a; x <= b; x++) R.put(x, y, mat, form, facetNx(x, c, hw), 0);
}

/* ── legs ─────────────────────────────────────────────────────────────────────
   A leg is a stub: one pixel wide, dark, straight down from the coat to the
   foot. Authority: the STRANDED move sheet (a 1 px column of #151d28 or
   #202e37, two to four rows long). A stub foot stands anywhere under the
   coat and stays attached. A solved hip, knee and ankle turns diagonal with
   stride until it breaks 8-connectivity.

   No later pass may widen the leg or the air between the pair (docs/LIFE.md
   law 3). The rim pass skips runs narrower than three pixels.

   Dress changes value, never width. body-folk.js owns the divisions
   (LEG_ANKLE, LEG_SHORT, LEG_KNEE). Bare shin takes the warmer signal rung.
   Each band leaves the one below it at least one row, and a leg too short
   for a trouser is a boot.

   The knee is one pixel: the thigh hangs from the hip, the shin stands on
   the foot, and the one column step between them is the joint. The shin
   stays a straight raster run (the CANON refusal to solve an angle). At the
   pass the swing lift is 1 - LEG_KNEE of the run, so only the thigh draws.

   No toe pixel: it is a third column on one leg and six across the pair,
   against a stem-width law allowing two and four.

   The knee draws in profile only: it bends fore and aft, which foreshortens
   to nothing head-on, and the diagonals place feet by side.

   KNEE_FLOOR is four rows. Below it thigh and shin are one row each and the
   step is a diagonal. Long and mid cuts leave 2 and 3 rows and keep the
   straight stub. `coatCut: short` leaves 7. */
const KNEE_FLOOR = 4;
function legPass(R, footXOf, hw = null) {
  const { L, W, pose, cx } = R;
  const feet = [...pose.feet].sort((a, b) => (a.far ? 0 : 1) - (b.far ? 0 : 1));
  const top = R.Y(R.hemRow, 'hem') + 1;
  const ground = R.Y(L.ground, 'leg');
  const run = Math.max(1, ground - top + 1);
  const legwear = W.legwear || 'none';
  /* Band thicknesses, measured from the bottom: a lifted swing foot has a
     shorter column, and measured from the hem the boot slides up the shin
     every other frame. */
  const bootRows = legwear === 'none' ? run
    : Math.max(1, run - Math.round(LEG_ANKLE * run));
  const skinRows = legwear === 'shorts'
    ? Math.max(1, Math.round((LEG_ANKLE - LEG_SHORT) * run)) : 0;
  /* The stride ceiling is the garment's: a foot past the drawn hem row stands
     in the air. coatPass pulls the last two rows in by one column, so the
     reach is this view's body half-width less one. Measured: the run reaches
     +-5 and the profile coat reaches 4; unclamped, six of 330 sprites lose a
     whole leg. */
  const reach = Math.max(1, (hw === null ? R.bodyHW : hw) - 1);
  /* rows above this are thigh and hang from the hip; rows at or below it are
     shin and stand on the foot */
  const kneeRow = top + Math.round(LEG_KNEE * run);
  const jointed = run >= KNEE_FLOOR && R.dir === 2;
  /* the columns the coat's hem row must keep, so a later pass cannot cut a leg
     off the body */
  R.footCols = [];
  for (const foot of feet) {
    const x = cx + clamp(footXOf(foot) - cx, -reach, reach);
    /* the thigh steps one column back toward the body: the joint, and it stops
       a long stride hanging its whole leg off the hem's outermost column */
    const hipX = jointed ? x - Math.sign(x - cx) : x;
    R.footCols.push(hipX, x);
    const bottom = ground - foot.lift;
    const bootTop = Math.max(top, bottom - bootRows + 1);
    const skinTop = Math.max(top, bootTop - skinRows);
    /* Near and far are a rung apart in views that declare depth. `far` is
       undefined in the axial views, so both legs take the far values.

       Measured: `folkDark` has three rungs and the material 17 branch is
       v = 0.04 + 0.82*baked*(0.45 + 0.55*ndl). A leg's flat normal gives ndl
       0.72 (the bake sun's z), where T0 resolves to rung 0 and T1, T2 and T3
       to rung 1. So the separation shows on the boot band only. Widening
       `folkDark` costs palette: all three scenes sit at 63 of the 64 colours
       POST_FS iterates.

       Painted alike, the two legs repeat at f and f+4 and the profile bank
       is four frames, not eight. */
    const near = foot.far === false;
    for (let y = top; y <= bottom; y++) {
      const bare = y >= skinTop && y < bootTop;
      R.put(y < kneeRow ? hipX : x, y, bare ? MAT_SIGNAL : MAT_UNDER,
        bare ? SIGNAL_FACE
          : y >= bootTop ? (near ? T1 : T0) : (near ? T3 : T2), 0, 0);
    }
  }
}

/* Where a foot stands in a view that faces the camera.

   A planted foot holds one pixel for every frame it is down; its column
   comes from the stance alone. The swinging foot travels by its lift. Derived
   from the excursion, the standing foot slides from four pixels out to two
   and back while bearing weight.

   The reach is half the contact excursion this body resolved. Every wardrobe
   reaches 3 or 4 columns at contact and both halve to 2. */
const axialReach = (pose) => Math.max(1, Math.round(pose.stance * 0.5));
const axialFoot = (cx, L, reach) => (f) =>
  cx + f.side * (L.legStand + Math.max(0, reach - f.lift));

/* a straight raster run stepped by row between two integer endpoints */
function run(R, x0, y0, x1, y1, plot) {
  const steps = Math.max(1, Math.abs(Math.round(y1) - Math.round(y0)));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    plot(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t));
  }
}

/* ── the shoulder ──────────────────────────────────────────────────────────
   The upper body steps in and no garment may square it off. body-folk.js
   declares `shoulderHW` at 4 against a body half-width of 5. `bodyProfile` and
   `coatBulk` widen the chest only, so a broad padded coat steps in by two
   columns and a slim thin one by one. The inset takes one row per column: a
   stair on the grid (the CANON refusal of a solved slope).

   Every pass that touches a shoulder row takes its width from here. Measured
   failure: with a drop of 0 and full-chest-width mantle, wrap and reinforced
   rows, eleven of twenty-one cast rows read as a box. */
function shoulderInset(R, bodyHW) {
  const declared = bodyHW - Math.min(R.L.shoulderHW, bodyHW - 1);
  const worn = R.W.shoulderDrop ?? (R.name === 'traveller' ? 2 : 0);
  return clamp(Math.max(1, declared, worn), 1, Math.max(1, bodyHW - 2));
}

/* the torso's half-width at row y, counted from the row the shoulder starts on */
const shoulderHalf = (bodyHW, inset, y, top) =>
  Math.max(1, bodyHW - Math.max(0, inset - (y - top)));

/* ── the coat ──────────────────────────────────────────────────────────────
   Integer width steps make the shoulder, waist, skirt and hem. A bounded hem
   lift supplies the two notches. */
function coatPass(R, { skew = 0, hw = null, offsetX = 0 } = {}) {
  const { L, W, pose, cx } = R;
  const bodyHW = hw === null ? R.bodyHW : hw;
  const inset = shoulderInset(R, bodyHW);
  const top = R.Y(L.shoulder, 'torso');
  const hemY = R.Y(R.hemRow, 'hem');
  const beltY = R.Y(L.belt, 'torso');
  const flutter = pose.state === 'idle' ? 0 : CLOTH_FLUTTER[pose.frame];
  /* One coat mass. A full-width value or width break at the belt divides
     the figure into two stacked bodies. */
  for (let y = top; y <= hemY; y++) {
    const hemRound = y >= hemY - (W.hemRoundRows ?? 1) ? 1 : 0;
    const flare = W.coatCut === 'long' && y > beltY ? 1 : 0;
    const half = Math.max(1,
      shoulderHalf(bodyHW, inset, y, top) + flare - hemRound);
    /* The pitch is the taper alone. A second whole-body lean step shifts the
       coat two columns while mantle, sleeves and closure stay put, and the
       graveWatcher's profile loses its shoulder step in all eight run
       frames. */
    const lean = Math.round(skew * (1 - (y - top) / Math.max(1, hemY - top)));
    let x0 = cx - half + lean + offsetX;
    let x1 = cx + half + lean + offsetX;
    /* Motion opens one trailing edge by one pixel. The fixed edge still covers
       the planted foot. */
    if (y >= hemY - 3) {
      if (flutter < 0) x0--;
      if (flutter > 0) x1++;
    }
    /* The legs hang from the hem row, so a notch may not take a foot column,
       and a narrow hem gets no notch.

       Measured failure: the shortest row in the cast is 18 px and its profile
       hem spans three columns. Two notches take two of the three, one of them
       a leg column, and ten of that row's sprites come apart. */
    const notches = W.coatCut !== 'short' && y === hemY && (x1 - x0) >= 6
      ? HEM_NOTCH.map((t) => Math.round(x0 + t * (x1 - x0)))
        .filter((x) => !R.footCols.includes(x))
      : [];
    const c = (x0 + x1) * 0.5;
    const rowHW = Math.max(1, (x1 - x0) * 0.5);
    for (let x = x0; x <= x1; x++) {
      if (notches.includes(x)) continue;
      let form = x < cx + offsetX + (W.planeSplit || 0) ? T2 : T3;
      if (W.clothPattern === 'ordered' && y > beltY &&
          CLOTH_BAYER[(x & 1) + 2 * (y & 1)] === 3)
        form = form === T3 ? T2 : T1;
      R.put(x, y, MAT_COAT, form, facetNx(x, c, rowHW), 0);
    }
  }
  /* A padded coat is quilted with ticks: two short runs per side, inset a
     column off the edge and one tier down. Never a full-width line, which
     cuts the body in two (see the belt below). */
  if (W.coatBulk === 'puffy') {
    const rows = [top + 3, Math.max(top + 5, beltY - 1)];
    for (const y of rows) {
      if (y >= hemY - 1) continue;
      /* inset off this row's edge, so a channel inside the shoulder step
         cannot sit a column outside the coat */
      const rowHalf = shoulderHalf(bodyHW, inset, y, top);
      for (const side of [-1, 1])
        for (let k = 1; k <= 2; k++)
          R.put(cx + offsetX + side * (rowHalf - k), y, MAT_COAT, T2,
            side * 0.5, 0);
    }
  }
  /* An open coat shows a shirt: a two-pixel dark channel down the chest to
     the shirt's own hem, the last row a tier down for an edge. SHIRT_DROP in
     body-folk.js owns the drop. The shirt rides MAT_UNDER, the ramp the boots
     and the head mass use. */
  if (W.open) {
    const drop = SHIRT_DROP[W.shirtHem] ?? 0;
    const shirtY = clamp(beltY + Math.round(drop * R.h), beltY, hemY - 2);
    for (let y = top + 2; y <= shirtY; y++)
      for (const x of [cx - 1, cx]) {
        const edge = y === shirtY && drop > 0;
        R.put(x, y, drop > 0 ? MAT_UNDER : MAT_COAT,
          edge ? T0 : drop > 0 ? T2 : T1, x === cx ? 0.1 : -0.2, 0);
      }
  }
  /* No belt bar: a full-width dark strap cuts the body into two shorter
     bodies. A short dark seam under the open front closes the coat. No buckle:
     the signal ramp already spends four pixels on the face and four on the
     hands, and a bright fitting is a third focal point on a body eleven
     pixels wide. */
  if (W.open && !(SHIRT_DROP[W.shirtHem] > 0))
    for (let x = cx - 1; x <= cx; x++)
      R.put(x, beltY, MAT_UNDER, T1, facetNx(x, cx, 2), 0);
}

/* ── sleeves and hands ─────────────────────────────────────────────────────
   The sleeve is one column inside the coat edge, one tier down, so it separates
   from the trunk and survives the rim, which eats the edge column. Below the
   hem it steps out to the coat's own edge column and hangs to the wrist. */
function armPass(R, { sides = [-1, 1], swingPx = 0, hw = null, offsetX = 0 } = {}) {
  const { L, W, cx } = R;
  const bodyHW = hw === null ? R.bodyHW : hw;
  const shoulderRow = R.Y(L.shoulder, 'torso');
  const top = shoulderRow + 1;
  const hemY = R.Y(R.hemRow, 'hem');
  /* the coat's own edge on the row the sleeve starts on. A broad chest steps in
     by more than one column, and an arm hung off the chest width begins a
     column clear of the body. */
  const armHalf = shoulderHalf(bodyHW, shoulderInset(R, bodyHW), top,
    shoulderRow);
  const bot = R.Y(L.wrist, 'hem');
  for (const side of sides) {
    /* The step-out is off this view's coat: the profile coat is a column
       narrower, and an arm placed off the front width hangs a pixel clear of
       the body in every profile frame. */
    const shoulderX = cx + offsetX
      + side * Math.min(Math.max(1, bodyHW - 1), armHalf);
    const elbowX = cx + offsetX + side * bodyHW;
    /* Invariant: a segment may not cross more columns than it has rows, or the
       run steps two columns between adjacent rows and the arm comes off the
       body. Measured: unclamped, 27 of 330 sprites lose their forearm, in the
       profile and diagonal frames where the swing is widest. */
    const reach = Math.max(0, bot - hemY - 1);
    const wristX = elbowX + clamp(Math.round(swingPx * side), -reach, reach);
    const sleeve = (x, y) => {
      const width = W.sleeveWidth || 1;
      for (let k = 0; k < width; k++)
        R.put(x - side * k, y, MAT_COAT, T2, side * 0.75, 0);
    };
    run(R, shoulderX, top, elbowX, hemY, sleeve);
    run(R, elbowX, hemY, wristX, bot, sleeve);
    R.handPoints.push({ side, x:wristX, y:bot });
    /* The hand is two pixels of the eye value (the reference budget), stacked
       down the wrist by default. */
    if (W.hands) {
      const shape = W.handShape || (W.verticalHands ? 'tall' : 'small');
      const pixels = shape === 'block' ? [[0,0],[-side,0],[0,-1],[-side,-1]]
        : shape === 'tall' ? [[0,0],[0,-1]]
          : [[0,0],[-side,0]];
      for (const [dx,dy] of pixels)
        R.put(wristX + dx, bot + dy, MAT_SIGNAL, SIGNAL_EYE, side * 0.4, 0);
    }
  }
}

/* A cape, a mantle and a reinforced edge lie on the shoulder, so each takes
   the torso's width at the row it paints. At chest width they fill the
   shoulder step and put a corner a column outside the coat. */
function outerLayerPass(R, { hw = null, offsetX = 0 } = {}) {
  const { L, W, cx } = R;
  if (!W.outerLayer) return;
  const bodyHW = hw === null ? R.bodyHW : hw;
  const top = R.Y(L.shoulder, 'torso');
  const belt = R.Y(L.belt, 'torso');
  const hem = R.Y(R.hemRow, 'hem');
  const mid = cx + offsetX;
  const inset = shoulderInset(R, bodyHW);
  const half = (y) => shoulderHalf(bodyHW, inset, y, top);
  if (W.outerLayer === 'shoulder-wrap') {
    band(R,mid-half(top+1),mid+half(top+1),top+1,MAT_COAT,T1);
    for(let k=0;k<4;k++)
      R.put(mid-half(top+2+k)+1+k,top+2+k,MAT_COAT,T1,-0.4,0);
  } else if (W.outerLayer === 'mantle') {
    band(R,mid-half(top),mid+half(top),top,MAT_COAT,T2);
    for(let y=top+1;y<=Math.min(hem,belt+4);y++){
      R.put(mid-half(y),y,MAT_COAT,T1,-0.7,0);
      R.put(mid+half(y),y,MAT_COAT,T1,0.7,0);
    }
  } else if (W.outerLayer === 'apron') {
    const apronHalf=Math.max(1,bodyHW-2);
    for(let y=belt;y<hem;y++)
      band(R,mid-apronHalf,mid+apronHalf,y,MAT_COAT,y===belt?T1:T2);
  } else if (W.outerLayer === 'reinforced') {
    for(let y=top;y<=top+3;y++){
      R.put(mid-half(y),y,MAT_COAT,T1,-0.8,0);
      R.put(mid+half(y),y,MAT_COAT,T1,0.8,0);
    }
  } else if (W.outerLayer === 'rope-coil') {
    /* The windlass rope, worn shoulder to opposite hip. One column per row: a
       diagonal does not divide the coat into two bodies the way a belt bar
       does. It rides the under-layer ramp, so it is dark on any cloth. */
    const x0=mid-half(top+1)+1, x1=mid+half(belt)-1;
    run(R,x0,top+1,x1,belt,(x,y)=>R.put(x,y,MAT_UNDER,T1,0,0));
    R.ropeEnd={x:x1,y:belt};
  }
}

function closurePass(R, { offsetX = 0 } = {}) {
  const { L, W, cx } = R;
  if (!W.closure) return;
  const x=cx+offsetX;
  const top=R.Y(L.shoulder,'torso')+3;
  const belt=R.Y(L.belt,'torso');
  if(W.closure==='seam'){
    for(let y=top;y<=belt;y+=2)R.put(x,y,MAT_UNDER,T1,0,0);
  }else if(W.closure==='tie'){
    R.put(x-1,top,MAT_UNDER,T1,-0.3,0);
    R.put(x,top+1,MAT_UNDER,T1,0,0);
    R.put(x+1,top,MAT_UNDER,T1,0.3,0);
  }else if(W.closure==='clasp'){
    R.put(x,top,MAT_UNDER,T1,0,0);
    R.put(x+1,top,MAT_UNDER,T1,0.3,0);
  }
}

const kitHand = (R) => R.handPoints.find((q) => q.side === 1) || R.handPoints[0];

function basketKit(R, hand) {
  const { L, cx } = R;
  const side = hand.side || 1;
  const x0 = hand.x + side, y0 = hand.y - 3;
  run(R, cx + side * R.bodyHW, R.Y(L.shoulder, 'torso') + 2, x0, y0,
    (x, y) => R.put(x, y, MAT_UNDER, T1, side * 0.4, 0));
  for (let y = y0; y <= hand.y + 1; y++)
    for (let k = 0; k < 5; k++) {
      const x = x0 + side * k;
      if (y === y0 || y === hand.y + 1 || k === 0 || k === 4)
        R.put(x, y, MAT_COAT, y === y0 ? T1 : T2, side * 0.5, 0);
    }
}

function ledgerKit(R, hand) {
  const y0 = hand.y - 3;
  for (let y = y0; y <= hand.y; y++)
    for (let x = R.cx - 2; x <= R.cx + 2; x++)
      R.put(x, y, MAT_COAT, x === R.cx ? T1 : T2, facetNx(x, R.cx, 2), 0);
}

function axeKit(R, hand) {
  const { L } = R;
  const side = hand.side || 1;
  const x = hand.x + side;
  const top = hand.y - 6;
  const bottom = Math.min(R.Y(L.ground, 'leg') - 1, hand.y + 2);
  run(R, x, top, x, bottom, (px, py) => R.put(px, py, MAT_UNDER, T1, 0, 0));
  for (let dx = -2; dx <= 1; dx++)
    R.put(x + side * dx, top, MAT_COAT, T2, side * 0.6, 0);
  R.put(x - side, top + 1, MAT_COAT, T1, -side * 0.5, 0);
}

/* The lantern is carried: a box on a bail hanging off the hand, four rows
   tall. Its pane is the dye ramp's ochre. */
function lanternKit(R, hand) {
  const side = hand.side || 1;
  const x = hand.x + side;
  const top = hand.y + 1;
  R.put(x, hand.y, MAT_UNDER, T1, 0, 0);                     // the bail
  for (let y = top; y <= top + 3; y++)
    for (let dx = -1; dx <= 1; dx++) {
      const frame = y === top || y === top + 3 || Math.abs(dx) === 1;
      R.put(x + dx, y, frame ? MAT_UNDER : MAT_DYE,
        frame ? T1 : DYE_OCHRE, dx * 0.5, 0);
    }
}

/* The keeper's gnomon: the stick a water turn is read off, carried. One
   column from over the crown down to the hem, a column of air clear of the
   sleeve, with one ochre row for the brass ferrule the hours are scratched
   on. It stops at the hem: a third stem beside the legs breaks law 3. It
   hangs from the hand and does not ride the crown, so a walking keeper bobs
   under a still staff. */
function gnomonKit(R, hand) {
  const { L } = R;
  const side = hand.side || 1;
  const x = hand.x + 2 * side;
  const top = R.Y(L.crown, 'hem') - GNOMON_OVER_CROWN;
  const bottom = R.Y(R.hemRow, 'hem');
  run(R, x, top, x, bottom, (px, py) => R.put(px, py, MAT_COAT, T1, 0, 0));
  R.put(x, top + 2, MAT_DYE, DYE_OCHRE, 0, 0);
  /* the grip closes the air column on the wrist row only */
  R.put(hand.x + side, hand.y, MAT_SIGNAL, SIGNAL_EYE, side * 0.4, 0);
}

/* The digger's lamp hangs where the rope ends, on the coat and inside its
   silhouette: a hook, a flame, a foot. It tests the air of the gallery, so
   it burns in daylight. Hung from the hand it falls beside a bare shin and
   reads as a third leg (law 3). */
function galleryLampKit(R) {
  const at = R.ropeEnd
    || { x: R.cx + R.bodyHW - 1, y: R.Y(R.L.belt, 'torso') };
  R.put(at.x, at.y + 1, MAT_UNDER, T1, 0, 0);
  R.put(at.x, at.y + 2, MAT_DYE, DYE_OCHRE, 0, 0);
  R.put(at.x, at.y + 3, MAT_UNDER, T1, 0, 0);
}

/* The cutter's mallet hangs head down from the hand, its two-row head above
   the hem. Head up on an 18 px body it lands on the chest rows, and the
   taper measures 7 px, then 11. */
function malletKit(R, hand) {
  const x = hand.x + (hand.side || 1);
  for (let y = hand.y; y <= hand.y + 1; y++) R.put(x, y, MAT_UNDER, T1, 0, 0);
  for (let y = hand.y + 2; y <= hand.y + 3; y++)
    for (let dx = -1; dx <= 1; dx++)
      R.put(x + dx, y, MAT_COAT, y === hand.y + 2 ? T2 : T1, dx * 0.5, 0);
}

const CARRIED_KIT_PASS = Object.freeze({
  'gnomon-staff':gnomonKit,
  'gallery-lamp':galleryLampKit,
  'provision-basket':basketKit,
  'winter-ledger':ledgerKit,
  'wood-axe':axeKit,
  /* The lamp wright's lamp on a pole is the gnomon's drawing: its ochre row
     is the flame. */
  'lamp-staff':gnomonKit,
  'cutter-mallet':malletKit,
  'hand-lantern':lanternKit,
});

function carriedKitPass(R) {
  const paint = CARRIED_KIT_PASS[R.W.carriedKit];
  const hand = kitHand(R);
  if (paint && hand) paint(R, hand);
}

function scarfPass(R, { offsetX = 0 } = {}) {
  const { L, W, cx } = R;
  if (!W.scarf || W.scarf === 'none') return;
  const y = R.Y(L.shoulder, 'torso') - 1;
  band(R, cx - 2 + offsetX, cx + 2 + offsetX, y, MAT_COAT, T1);
  if (W.scarf !== 'tail') return;
  const side = (W.planeSplit || 0) > 0 ? 1 : -1;
  const x = cx + offsetX + side * 2;
  for (let k = 1; k <= 4; k++)
    R.put(x + side * (k > 2 ? 1 : 0), y + k, MAT_COAT, T1, side * 0.6, 0);
}

/* ── the head ──────────────────────────────────────────────────────────────
   A dark mass with a two-band face: the eye band on top and the rest of the
   face under it, one step warmer. Authority: the STRANDED townfolk sheets at
   15 to 30 px. No eyeballs, no mouth, no skin plane.

   Measured failures: two isolated bright eye pixels read as pinpricks beside a
   two-by-two face; a pale skin plate ringed by dark hair reads as a skull.

   The crown row and the jaw row each drop a column, on opposite sides. A
   five-column rectangle reads as a die. */
function headPass(R, { face = true, faceOff = 0, narrow = false } = {}) {
  const { L, cx } = R;
  const yTop = R.Y(L.crown, 'head');
  const yJaw = R.Y(L.jaw, 'head');
  const hx = cx + faceOff;
  /* Hair and the dark mass around the face take the same near-black rung as the
     legs. */
  for (let y = yJaw + 1; y < R.Y(L.shoulder, 'torso'); y++)
    band(R, hx - 1, hx + 1, y, MAT_UNDER, T0);
  for (let y = yTop + 2; y <= yJaw; y++) {
    const x0 = hx - L.headHW + (y === yJaw ? 1 : 0);
    const x1 = hx + L.headHW;
    band(R, x0, x1, y, MAT_UNDER, T0);
  }
  capPass(R, { faceOff });
  headAccentPass(R, { faceOff });
  if (face) facePass(R, hx, narrow);
}

/* The face: two rows, two columns each, two values of the signal ramp. The
   block sits one column right of the head's centre (the reference position):
   an even-width face cannot centre on a five-column head. */
function facePass(R, hx, narrow = false) {
  const { L, pose, look } = R;
  const dx = look === 'left' ? -1 : look === 'right' ? 1 : 0;
  const dy = look === 'up' ? -1 : 0;
  const yEye = R.Y(L.eye, 'head') + dy;
  const yFace = R.Y(L.face, 'head') + dy;
  const x0 = hx + dx;
  const x1 = narrow ? x0 : x0 + 1;   // in profile only the near half shows
  /* a blink drops the eye band to the warm value. Deleting the band reads as
     a missing head. */
  const eyeForm = pose.blink ? SIGNAL_FACE : SIGNAL_EYE;
  for (let x = x0; x <= x1; x++) {
    R.put(x, yEye, MAT_SIGNAL, eyeForm, 0, -0.2);
    R.put(x, yFace, MAT_SIGNAL, SIGNAL_FACE, 0, 0);
  }
}

function capPass(R, { faceOff = 0 } = {}) {
  const { L, W, cx } = R;
  const hx = cx + faceOff;
  const yTop = R.Y(L.crown, 'head');
  /* dyePass reads the head column this view chose */
  R.faceOff = faceOff;
  /* a bare head: the head mass already fills these rows */
  if (W.cap === 'none') return;
  if (W.cap === 'hood') {
    /* the hood covers the crown and drops one column past the jaw on each
       side */
    for (let y = yTop; y < yTop + 2; y++)
      band(R, hx - L.headHW, hx + L.headHW, y, MAT_COAT, W.capForm);
    for (let y = yTop + 2; y <= R.Y(L.jaw, 'head'); y++) {
      R.put(hx - L.headHW, y, MAT_COAT, W.capForm, -0.7, 0);
      R.put(hx + L.headHW, y, MAT_COAT, W.capForm, 0.7, 0);
    }
  } else if (W.cap === 'veil') {
    /* The veil (a tagelmust: one strip wound round the head and across the
       lower face) is a hood that also crosses the jaw. The one open row is the
       eye band, and the cloth runs unbroken from crown to jaw on both sides.
       The loose end hangs on one side. */
    const yEye = Math.min(R.Y(L.jaw, 'head') - 1, yTop + 2);
    for (let y = yTop; y <= R.Y(L.jaw, 'head'); y++) {
      if (y === yEye) {
        /* the eye band: cloth on the two outer columns only */
        R.put(hx - L.headHW, y, MAT_COAT, W.capForm, -0.7, 0);
        R.put(hx + L.headHW, y, MAT_COAT, W.capForm, 0.7, 0);
        continue;
      }
      band(R, hx - L.headHW, hx + L.headHW, y, MAT_COAT, W.capForm);
    }
    /* The loose end stops at the jaw (medium rule). Two rows further it
       reaches the shoulder row and puts 7 px on a shoulder drawn at 5, the
       square upper body docs/LIFE.md forbids. */
    for (let y = yTop + 3; y < R.Y(L.jaw, 'head'); y++)
      R.put(hx + L.headHW + 1, y, MAT_COAT, T2, 0.8, 0);
  } else if (W.cap === 'brim') {
    band(R, hx - L.headHW - 1, hx + L.headHW + 1, yTop + 1,
      MAT_COAT, W.capForm);
    band(R, hx - L.headHW, hx + L.headHW, yTop, MAT_COAT, W.capForm);
  } else if (W.cap === 'straw') {
    /* The straw brim goes two columns clear on each side (the oilskin brim
       goes one) under a single flat crown row. It takes the brightest rung of
       the garment ramp, unlike every other hat here: bleached straw is a pale
       disc against the dark head. */
    band(R, hx - L.headHW - 2, hx + L.headHW + 2, yTop + 1, MAT_COAT, T3);
    band(R, hx - L.headHW + 1, hx + L.headHW - 1, yTop, MAT_COAT, T2);
  } else if (W.cap === 'wool') {
    /* A knit cap stands a row above the crown, which separates it from the
       flat cap at five columns. The cuff row meets the brow, one column
       wider. */
    band(R, hx - L.headHW + 1, hx + L.headHW - 1, yTop - 1, MAT_COAT, W.capForm);
    band(R, hx - L.headHW, hx + L.headHW, yTop, MAT_COAT, W.capForm);
    band(R, hx - L.headHW, hx + L.headHW, yTop + 1, MAT_COAT, W.capForm);
  } else if (W.cap === 'felt') {
    /* A felt dome (kolah namadi): padded against a falling stone. Two rows
       stand over the crown, the upper one narrower, so the head reads tall
       and round where the knit cap reads flat. */
    band(R, hx - L.headHW + 1, hx + L.headHW - 1, yTop - 2, MAT_COAT, W.capForm);
    for (let y = yTop - 1; y <= yTop + 1; y++)
      band(R, hx - L.headHW, hx + L.headHW, y, MAT_COAT, W.capForm);
  } else if (W.cap === 'peak') {
    /* A pointed hood, AUTHORED read for the Hollow's small makers: the felt
       dome's rows under one more pixel, so it ends on one column where the
       dome is flat-topped at three. */
    R.put(hx, yTop - 3, MAT_COAT, W.capForm, 0, -0.4);
    band(R, hx - L.headHW + 1, hx + L.headHW - 1, yTop - 2, MAT_COAT, W.capForm);
    for (let y = yTop - 1; y <= yTop + 1; y++)
      band(R, hx - L.headHW, hx + L.headHW, y, MAT_COAT, W.capForm);
  } else if (W.cap === 'turban') {
    /* A wound turban: three rows a column wider than the head each side,
       under a head-wide top row. It stands three rows over the crown, a
       sixth of the keeper's stature: the brim is a flat disc on the brow and
       this is a mass above it. */
    band(R, hx - L.headHW, hx + L.headHW, yTop - 3, MAT_COAT, W.capForm);
    for (let y = yTop - 2; y <= yTop; y++)
      band(R, hx - L.headHW - 1, hx + L.headHW + 1, y, MAT_COAT, W.capForm);
    band(R, hx - L.headHW, hx + L.headHW, yTop + 1, MAT_COAT, T1);
  } else if (W.cap === 'earflap') {
    /* The four-winds cap: a crown, and two flaps that hang past the jaw with a
       column of air between each flap and the face. The hood closes that
       gap. */
    band(R, hx - L.headHW, hx + L.headHW, yTop, MAT_COAT, W.capForm);
    band(R, hx - L.headHW - 1, hx + L.headHW + 1, yTop + 1, MAT_COAT, W.capForm);
    for (let y = yTop + 2; y <= R.Y(L.jaw, 'head') + 1; y++)
      for (const side of [-1, 1])
        R.put(hx + side * (L.headHW + 1), y, MAT_COAT, W.capForm, side * 0.7, 0);
  } else {
    band(R, hx - L.headHW, hx + L.headHW - 1, yTop, MAT_COAT, W.capForm);
    band(R, hx - L.headHW, hx + L.headHW, yTop + 1, MAT_COAT, W.capForm);
  }
}

/* ── the dyed band ─────────────────────────────────────────────────────────
   The only saturated thing on a villager, four to eleven pixels. culture.js
   owns its place and dye; this owns its shape at 26 px.

   It runs last, over the finished garment, because every anchor it uses (the
   cap brow, the sleeve end, the belt row, the hem) is a row an earlier pass
   may move. Anything it would draw off the body is not drawn. */
function dyePass(R, { hw = null, offsetX = 0, sides = [-1, 1] } = {}) {
  const { L, W, cx } = R;
  if (!W.dyePlace || W.dyePlace === 'none') return;
  const bodyHW = hw === null ? R.bodyHW : hw;
  const form = dyeForm(W);
  const mid = cx + offsetX;
  if (W.dyePlace === 'hat-band') {
    if (!W.cap || W.cap === 'none') return;
    /* the brow row: every hat puts its widest row at yTop+1 */
    const y = R.Y(L.crown, 'head') + 1;
    const half = W.cap === 'hood' ? L.headHW : L.headHW - 1;
    /* the head's own column from capPass, which is not the torso's in the
       diagonal views */
    const hx = cx + (R.faceOff || 0);
    band(R, hx - half, hx + half, y, MAT_DYE, form);
  } else if (W.dyePlace === 'cuffs') {
    for (const point of R.handPoints)
      if (sides.includes(point.side))
        R.put(point.x, point.y - 2, MAT_DYE, form, point.side * 0.5, 0);
  } else if (W.dyePlace === 'sash') {
    band(R, mid - bodyHW + 1, mid + bodyHW - 1, R.Y(L.belt, 'torso'),
      MAT_DYE, form);
  } else if (W.dyePlace === 'hem-stripe') {
    const y = R.Y(R.hemRow, 'hem') - 1;
    const half = Math.max(1, bodyHW - 1);
    for (let x = mid - half; x <= mid + half; x++)
      if (!R.footCols.includes(x)) R.put(x, y, MAT_DYE, form, 0, 0);
  }
}

function headAccentPass(R, { faceOff = 0 } = {}) {
  const { L, W, cx } = R;
  if(!W.headAccent)return;
  const hx=cx+faceOff;
  const yTop=R.Y(L.crown,'head');
  if(W.headAccent==='ear-wrap'){
    band(R,hx-L.headHW,hx+L.headHW,yTop+1,MAT_COAT,T1);
    for(const side of [-1,1]){
      R.put(hx+side*(L.headHW+1),yTop+2,MAT_COAT,T2,side*0.7,0);
      R.put(hx+side*(L.headHW+1),yTop+3,MAT_COAT,T1,side*0.7,0);
    }
  }else if(W.headAccent==='animal-ears'){
    for(const side of [-1,1]){
      const x=hx+side;
      R.put(x,yTop-2,MAT_COAT,T1,side*0.5,-0.5);
      R.put(x,yTop-1,MAT_COAT,T2,side*0.6,-0.3);
      R.put(x+side,yTop-1,MAT_COAT,T1,side*0.7,-0.2);
    }
  }else if(W.headAccent==='feather'){
    const x=hx+L.headHW;
    run(R,x,yTop,x+2,yTop-4,
      (px,py)=>R.put(px,py,MAT_COAT,py===yTop?T1:T2,0.6,-0.3));
    R.put(x+1,yTop-3,MAT_COAT,T1,0.7,-0.2);
  }
}

/* ── views ─────────────────────────────────────────────────────────────── */

function paintAxial(R, front) {
  const { L, cx, pose } = R;
  /* Head-on the feet open and close: the reference move sheet puts them six
     pixels apart at contact and together at the pass. Feet held at a fixed
     column read as a bob with no steps. Each foot steps outward by its own
     excursion regardless of sign, so the pair stays symmetric and never
     crosses. */
  legPass(R, axialFoot(cx, L, axialReach(pose)));
  coatPass(R, {});
  outerLayerPass(R, {});
  armPass(R, {});
  closurePass(R, {});
  scarfPass(R);
  carriedKitPass(R);
  headPass(R, { face: front });
  dyePass(R, {});
}

function paintProfile(R) {
  const { cx, pose, depthHW } = R;
  /* in profile the feet travel along the heading, on the centre column, and the
     near leg reads a rung brighter than the far one */
  const feet = pose.feet.map((f, i) => ({ ...f, far: i === 0 }));
  R.pose = { ...pose, feet };
  legPass(R, (f) => cx + f.dx, depthHW);
  coatPass(R, { skew: pose.lean, hw: depthHW });
  outerLayerPass(R, { hw:depthHW });
  /* one arm, the near one, swinging against the near leg */
  armPass(R, { sides: [1], swingPx: Math.round(pose.swing * 2), hw: depthHW });
  closurePass(R);
  scarfPass(R);
  carriedKitPass(R);
  /* the head steps one column toward the heading and shows one eye, set back
     from the front edge: flush against it the eye and the rim fuse and the
     profile reads as eyeless */
  headPass(R, { face: true, faceOff: 1, narrow: true });
  dyePass(R, { hw: depthHW, sides: [1] });
}

function paintDiag(R, front) {
  const { L, cx, pose } = R;
  const feet = pose.feet.map((f, i) => ({ ...f, far: i === 0 }));
  R.pose = { ...pose, feet };
  /* Feet are placed as in the front view. Measured failure: adding the signed
     excursion to the side offset cancels both terms at contact; the near foot
     crosses to the far side and the pair stand two pixels apart on the frame
     where they should be widest. */
  legPass(R, axialFoot(cx, L, axialReach(pose)));
  /* The three-quarter body projects one column toward the heading from shoulder
     through hem, so the lower coat does not shear away from the head. */
  coatPass(R, { offsetX: 1 });
  outerLayerPass(R, { offsetX:1 });
  armPass(R, { swingPx: Math.round(pose.swing * 2), offsetX: 1 });
  closurePass(R, { offsetX:1 });
  scarfPass(R, { offsetX: 1 });
  carriedKitPass(R);
  headPass(R, { face: front, faceOff: 1 });
  dyePass(R, { offsetX: 1 });
}

/* ── the rim pass ──────────────────────────────────────────────────────────
   The finished silhouette hands its two edge columns to material 7 with the
   cylinder-extreme normals the shader's sign test relies on (nx +-0.90,
   nz 0.436).

   The head is not rimmed: it is five pixels wide, and converting both edge
   columns leaves one dark pixel of head mass.

   The coat's allowance is 0.40. At ao > 0.5 the rim resolves to snow rung 5
   (luminance 225) and outshines the eyes at skin rung 3 (luminance 210). At
   0.40 the edge takes the top rung of the figure's own cloth (luminance 106
   on warm). Hem and below get nothing.

   A run one or two pixels wide is a limb and is not converted: material 7's
   sun-away fallback is the near-background outline rung, which erases
   one-pixel shins and forearms. */
function rimPass(R) {
  const { sp, w, H, L } = R;
  const hemY = R.Y(R.hemRow, 'hem');
  const shoulderY = R.Y(L.shoulder, 'torso');
  const runWidth = (x, y) => {
    let a = x, b = x;
    while (a > 0 && sp.occ[y * w + a - 1]) a--;
    while (b < w - 1 && sp.occ[y * w + b + 1]) b++;
    return b - a + 1;
  };
  for (let y = shoulderY; y < H; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < w; x++) if (sp.occ[y * w + x]) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 < 0) continue;
    for (const [x, sgn] of [[x0, -1], [x1, 1]]) {
      const i = y * w + x;
      if (runWidth(x, y) < 3) continue;
      /* an authored focal point (signal, dyed band) is never converted */
      if (sp.occ[i] === MAT_SIGNAL || sp.occ[i] === MAT_DYE) continue;
      sp.occ[i] = MAT_EDGE;
      sp.nx[i] = sgn * 0.90;
      sp.ny[i] = 0;
      sp.nz[i] = Math.sqrt(1 - 0.9 * 0.9);
      sp.ao[i] = y < hemY ? 0.40 : 0;
    }
  }
}

/* One folk figure, one view, one frame. Deterministic: same arguments, same
   bytes, so the atlas can alias look variants a view cannot show. */
function makeFolk(name, dir = 0, frame = 0, state = 'walk', look = 'neutral',
  appearance = null) {
  /* looks read only where an eye is drawn */
  const lookRead = dir === 0 || dir === 2 || dir === 3;
  const R = folkContext(name, dir, frame, state, lookRead ? look : 'neutral',
    appearance);
  if (dir === 2) paintProfile(R);
  else if (dir === 3 || dir === 4) paintDiag(R, dir === 3);
  else paintAxial(R, dir === 0);
  rimPass(R);
  return R.sp;
}

/* The seat: review FW-VR-20260809-DA8305C4 option B, the high forward
   posture. Boot hang, rug width and rug drop are read off the mount. */
const RIDER_SEAT = Object.freeze({ seatRows:-1, torsoLean:1, skirtRows:6,
  tree:2 });

/* Rider-only pixels. The camel and clothes need different ramp pairs, so the
   atlas stores two sprites with one ground anchor. `seat` carries the mount's
   back and belly row per column, its shoulder and its breadth, so the cloth
   lies on the barrel and the boot stays outside the flank. */
function makeMountedFolk(name, dir = 2, frame = 0, state = 'walk',
  look = 'neutral', seat = { x:0, y:-30, roll:0 }, appearance = null) {
  const source = makeFolk(name, dir, 0, 'idle', look, appearance);
  const row = appearance?.row || FOLK[name];
  const h = heightPx(row);
  const L = folkLandmarks(h);
  const padTop = source.ay - (h - 1);
  const beltY = padTop + L.belt;
  const hemY = source.hemRow;
  const cfg = RIDER_SEAT;
  const sp = newSprite(47, 58);
  sp.ax = 23; sp.ay = 57;
  for (const key of ['ramp','ramp2','dMin','dMax','sMin','sMax','kind','tilt'])
    if (source[key] !== undefined) sp[key] = source[key];
  const seatX = Math.round(sp.ax + seat.x);
  const seatY = Math.round(sp.ay + seat.y + cfg.seatRows);
  /* the mount's rows in this sprite's space. A seat with no barrel (the
     default argument) falls back to a barrel inferred from the saddle. */
  const sample = (field, dx) => {
    const arr = seat[field];
    if (!arr || !arr.length) return null;
    const i = Math.round(dx) - seat.x0;
    return sp.ay + arr[Math.max(0, Math.min(arr.length - 1, i))];
  };
  const backAt = (dx) => sample('back', dx) ?? seatY + 3;
  const bellyAt = (dx) => sample('belly', dx) ?? seatY + 12;
  /* the figure's own leg, split at the knee: the same 12 rows standing or
     folded over a barrel */
  const legLen = L.ground - L.belt;
  const thigh = Math.round(legLen * 0.48);
  const shin = legLen - thigh;
  const kneeAhead = Math.max(3,
    Math.min(thigh, (seat.shoulderX ?? thigh) - 2));
  const flankHalf = Math.max(3, Math.round((seat.breadth ?? 10) * 0.45));
  const pose = folkRidePose({
    dir, seatX, seatY, roll:seat.roll,
    torsoLean:cfg.torsoLean, thigh, shin, kneeAhead, flankHalf,
    maxDrop:Math.max(4, bellyAt(dir === 2 ? kneeAhead : 0) - seatY - 2),
  });
  /* What the mount hides. The rider is the later sprite at the same anchor,
     so unmasked an axial camel's head and humps show through the rider's
     chest. The mask is the mount's silhouette top per column; at or below it
     the rider paints nothing. Profile has no mask. */
  const hidden = (x,y) => {
    if(!seat.mask)return false;
    const i=Math.round(x)-sp.ax-seat.maskX0;
    if(i<0||i>=seat.mask.length)return false;
    const top=seat.mask[i];
    return top!==null&&top!==undefined&&y>=sp.ay+top;
  };
  const putMount = (x,y,mat,form,nx=0,ny=0) => {
    x=Math.round(x);y=Math.round(y);
    if(x<0||y<0||x>=sp.w||y>=sp.h||hidden(x,y))return;
    const i=y*sp.w+x;
    sp.occ[i]=mat;sp.shade[i]=form;sp.ao[i]=form;
    sp.nx[i]=nx;sp.ny[i]=ny;sp.nz[i]=Math.sqrt(Math.max(0.04,1-nx*nx-ny*ny));
  };
  /* The rug follows the mount's back line per column and hangs down the
     flank. Hung from the saddle point (the notch between the humps) it starts
     four rows above the back and drapes over both hump crowns. It is laid
     before the rider so the skirt sits on one cloth. Its span is the barrel's
     length in profile and its breadth head on. */
  const rugHalf = dir === 2
    ? Math.round((seat.humpGap ?? 12) / 2) + 2
    : Math.round((seat.breadth ?? 12) / 2) + 1;
  const rugTop = (dx) => (dir === 2 ? backAt(dx) : backAt(0)) + 1;
  const rugDrop = Math.max(3,
    Math.round((bellyAt(0) - backAt(0)) * 0.62));
  for(let dx=-rugHalf;dx<=rugHalf;dx++){
    const edge=Math.abs(dx)>rugHalf-2?1:0;
    const top=rugTop(dx);
    for(let k=0;k<rugDrop-edge;k++)
      putMount(seatX+dx,top+k,MAT_DYE,k===0?T2:T1,0,k===0?-0.5:0);
  }
  /* the fringe, every other column */
  for(let dx=-rugHalf+2;dx<=rugHalf-2;dx+=2)
    putMount(seatX+dx,rugTop(dx)+rugDrop,MAT_DYE,T1);
  /* The tree bridges the humps: cantle and pommel bear on the pair and the
     seat spans the dip, filling the notch from the back line up to the
     crowns. Two rows of seat and the bearing under it raise the rider onto
     the back line. */
  const seatHalf=dir===2?Math.max(2,Math.round((seat.humpGap ?? 12)*0.28))
    :Math.max(3,Math.round((seat.breadth ?? 12)*0.42));
  const notchY=sp.ay+(seat.notchY ?? seat.y);
  for(let dx=-seatHalf;dx<=seatHalf;dx++)
    putMount(seatX+dx,seatY-1,MAT_UNDER,T0,0,-0.5);
  for(let dx=-seatHalf+1;dx<=seatHalf+1;dx++)
    putMount(seatX+dx,seatY,MAT_UNDER,T0);
  for(let y=seatY+1;y<=notchY;y++)
    for(let dx=-seatHalf+2;dx<=seatHalf;dx++)
      putMount(seatX+dx,y,MAT_UNDER,T1);
  const frontX=seatX+seatHalf+1;
  for(let row=1;row<=cfg.tree;row++)
    putMount(frontX,seatY-row,MAT_UNDER,T0,0,-0.4);
  const channels = ['occ','shade','horiz','rad','nx','ny','nz','ao','noSnow'];
  const copyPixel = (sx, sy, tx, ty) => {
    tx=Math.round(tx);ty=Math.round(ty);
    if(tx<0||ty<0||tx>=sp.w||ty>=sp.h||hidden(tx,ty))return;
    const si=sy*source.w+sx,di=ty*sp.w+tx;
    if(!source.occ[si])return;
    for(const ch of channels)if(source[ch])sp[ch][di]=source[ch][si];
  };
  for(let sy=0;sy<=hemY;sy++)for(let sx=0;sx<source.w;sx++){
    if(!source.occ[sy*source.w+sx])continue;
    const below=Math.max(0,sy-beltY);
    const ty=sy<=beltY
      ?seatY+(sy-beltY)
      :seatY+Math.round(below/Math.max(1,hemY-beltY)*cfg.skirtRows);
    copyPixel(sx,sy,pose.torsoX+(sx-source.ax),ty);
  }
  /* Cantle and pommel stay outside the pelvis after the rider is laid in. */
  const backX=seatX-seatHalf;
  for(let row=0;row<=cfg.tree;row++){
    putMount(backX,seatY-row,MAT_UNDER,T0,0,-0.4);
    putMount(frontX,seatY-row,MAT_UNDER,T0,0,-0.4);
  }
  const putLeg = (x,y,far) => {
    x=Math.round(x);y=Math.round(y);
    if(x<0||y<0||x>=sp.w||y>=sp.h||hidden(x,y))return;
    const i=y*sp.w+x;
    sp.occ[i]=MAT_UNDER;sp.shade[i]=far?0.04:T0;sp.ao[i]=far?0.08:T0;
    sp.nx[i]=0;sp.ny[i]=0;sp.nz[i]=1;
  };
  const legLine = (a,b,far) => {
    const n=Math.max(1,Math.abs(b.x-a.x),Math.abs(b.y-a.y));
    for(let i=0;i<=n;i++){
      const t=i/n;
      putLeg(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,far);
    }
  };
  /* the thigh is the thicker segment, which puts the knee in the corner */
  for(const leg of pose.legs){
    legLine(leg.hip,leg.knee,leg.far);
    legLine({x:leg.hip.x,y:leg.hip.y+1},{x:leg.knee.x,y:leg.knee.y+1},leg.far);
    legLine(leg.knee,leg.boot,leg.far);
    putLeg(leg.boot.x+(dir===2?1:Math.sign(leg.boot.x-seatX)),leg.boot.y,leg.far);
  }
  Object.defineProperty(sp,'rideSeat',{
    value:{x:seatX,y:seatY,source:seat,state,frame,
      legDrop:pose.legs[1].boot.y-seatY,rugDrop,rugHalf,
      kneeX:pose.legs[1].knee.x,
      bootX:pose.legs[1].boot.x,bootY:pose.legs[1].boot.y,
      backY:backAt(0),bellyY:bellyAt(0)},
    enumerable:false,
  });
  return sp;
}

export {
  MAT_DYE, RIDER_SEAT, T0, T1, T2, T3, WEAR, makeFolk, makeMountedFolk,
};
