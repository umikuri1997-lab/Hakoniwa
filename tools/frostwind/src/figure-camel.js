import { CAMEL_CANVAS, CAMEL_STATES, camelPose } from './body-camel.js';
import { clamp, lerp } from './math.js';
import { kneeOffset, kneePx } from './quadruped.js';
import { newSprite } from './sprite.js';

/*
 * The pose owns anatomy, contact and roll. This file owns the pixel
 * concessions: limbs with a single joint break, far-side value separation, a
 * hump that is a mass over the back, and a wide pad.
 *
 * It shares no passes with figure-deer.js or figure-wolf.js. The three share
 * a solver and a contact schedule only.
 *
 * Two views, each with its own pass list. An axial camel is a column of
 * masses: chest, hump pair, neck, head, one in front of the next.
 */

const MAT_BODY = 4;
const MAT_PALE = 2;

/* The barrel is two curves, a topline and an underline. Every key is a
   fraction of a measurement: the trunk sets how far fore and aft each landmark
   sits, the chest depth how far below the back it hangs, and the withers and
   croup carry it with the gait. Fore to aft, the underline is chest, elbow
   (the deepest point), flank tuck, thigh, then the rump falling away. */
function bodyOutline(P, sw) {
  const M = P.M, d = M.chestDepth, T = M.trunk;
  const wY = P.spine.withers.y + sw, cY = P.spine.rump.y + sw;
  const fx = P.spine.withers.x, hx = P.spine.rump.x;
  const keys = [
    { x: hx - T * 0.12, top: cY + 2.4, bot: cY + d * 0.26 },
    { x: hx + T * 0.05, top: cY,       bot: cY + d * 0.74 },
    { x: hx * 0.45,     top: cY - 0.1, bot: cY + d * 0.56 },
    { x: 0,             top: (wY + cY) / 2, bot: wY + d * 0.80 },
    { x: fx - T * 0.14, top: wY + 0.2, bot: wY + d * 1.00 },
    { x: fx + T * 0.12, top: wY + 2.6, bot: wY + d * 0.70 },
  ];
  const at = (x, field) => {
    if (x <= keys[0].x) return keys[0][field];
    for (let i = 1; i < keys.length; i++) {
      if (x > keys[i].x) continue;
      const a = keys[i - 1], b = keys[i];
      return lerp(a[field], b[field], (x - a.x) / (b.x - a.x));
    }
    return keys[keys.length - 1][field];
  };
  return {
    x0: keys[0].x, x1: keys[keys.length - 1].x,
    topAt: (x) => at(x, 'top'),
    botAt: (x) => at(x, 'bot'),
  };
}

function camelContext(rnd, frame, dir, state) {
  const pose = camelPose({ frame, dir, state });
  const sp = newSprite(CAMEL_CANVAS.w, CAMEL_CANVAS.h);
  sp.ax = CAMEL_CANVAS.w >> 1;
  sp.ay = pose.M.ground;
  sp.ramp = 'camelCoat';
  /* The body takes camelCoat (palette.js). The pale mark resolves on the
     ground's own sand ramp. */
  sp.ramp2 = 'sand';
  sp.dMin = 0.55;
  sp.dMax = 1.00;
  sp.sMin = 0.10;
  sp.sMax = 0.86;
  sp.kind = 'camel';
  sp.tilt = 0;

  const put = (x, y, mat = MAT_BODY, form = 0.58, nx = 0, ny = 0) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= sp.w || y >= sp.h) return;
    const i = y * sp.w + x;
    const nn = Math.hypot(nx, ny);
    if (nn > 0.96) { nx *= 0.96 / nn; ny *= 0.96 / nn; }
    sp.occ[i] = mat;
    sp.shade[i] = clamp(form, 0, 1);
    sp.ao[i] = clamp(form, 0, 1);
    sp.nx[i] = nx;
    sp.ny[i] = ny;
    sp.nz[i] = Math.sqrt(Math.max(0.04, 1 - nx * nx - ny * ny));
  };
  const R = { rnd, frame, dir, state, pose, sp, cx: sp.ax, put,
    sway: pose.bodySway };
  R.outline = bodyOutline(pose, R.sway);
  return R;
}

/* How much darker the far side is. 0.62 is one rung on the coat ramp, which
   disappears when the two limbs cross. */
const CAMEL_FAR_SHADE = 0.45;

function stamp(R, x, y, width, form, far = false, mat = MAT_BODY) {
  const n = Math.max(1, Math.round(width));
  const x0 = Math.round(x - (n - 1) * 0.5);
  for (let k = 0; k < n; k++)
    R.put(x0 + k, y, mat, far ? form * CAMEL_FAR_SHADE : form, 0, 0);
}
function line(R, a, b, width, form, far = false, mat = MAT_BODY) {
  const steps = Math.max(1,
    Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    stamp(R, lerp(a.x, b.x, t), lerp(a.y, b.y, t), width, form, far, mat);
  }
}
/* A quadratic through one control point, sampled dense enough that a 2 px
   stroke leaves no diagonal gaps. Used for the neck. */
function curve(R, a, c, b, w0, w1, form, mat = MAT_BODY) {
  const steps = Math.max(4, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps, u = 1 - t;
    stamp(R, u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      lerp(w0, w1, t), form, false, mat);
  }
}

/* Measured: the largest |kneeOffset| this rig produces across idle, walk and
   pace, on either girdle. The drawn break is the solved break scaled against
   this. Re-measure after any change to the chain, the swing keys or the sink
   tables. */
const CAMEL_KNEE_SPAN = 9.25;

/* The knee is the solved knee, rounded to what the size affords. Take the
   solved joint's distance off the load line, scale it against the rig's
   widest bend, and clamp into the budget, never to zero. The break moves
   between 1 and 2 px across the cycle and its sign is the girdle's bend
   direction.

   A constant break does not animate: the joint angle never changes. The
   budget is a fraction of limb length. Deer and wolf spend 1 px on an 11.4 px
   limb (8.8%); `kneePx` in quadruped.js owns that law and gives this 27.5 px
   limb 2 px. */
function projectLeg(R, leg) {
  const budget = kneePx(leg.lengths.reduce((a, b) => a + b, 0));
  const off = kneeOffset(leg);
  const sign = off < 0 ? -1 : 1;
  const bend = sign * Math.max(1, Math.min(budget,
    Math.round(Math.abs(off) / CAMEL_KNEE_SPAN * budget)));

  /* Rounded once. Rounding root and foot and then the lerp between them
     quantises the joint twice, and it jitters a pixel between frames. */
  const straighten = (root, foot, bend) => {
    const at = (t, dx) => ({
      x: Math.round(lerp(root.x, foot.x, t) + dx),
      y: Math.round(lerp(root.y, foot.y, t)),
    });
    return {
      root: { x: Math.round(root.x), y: Math.round(root.y) },
      joint: at(0.46, bend),
      ankle: at(0.80, bend * 0.35),
      foot: { x: Math.round(foot.x), y: Math.round(foot.y) },
      /* the drawn break and the straight line it is taken off, published for
         the drawn-leg test: the rounded endpoints cannot rebuild them */
      bend,
      axisX: at(0.46, 0).x,
    };
  };

  /* the root rides the body's sway; the planted foot does not */
  const toCanvas = (p, rides) => ({ x: R.cx + p.x, y: p.y + (rides ? R.sway : 0) });
  if (R.dir === 2) {
    /* Two columns of parallax for the far pair. A pace puts the two sides in
       antiphase: twice a cycle the near pair at mid-stance and the far pair at
       mid-swing share one fore-aft position, and value alone hides the far
       limb. PROJECTION.md: a profile's lateral position decides painter order
       and may not move a planted sole off the shared ground line, so the
       separation is spent in columns and value, never in rows. */
    const sideOffset = leg.near ? 0 : -2;
    const root = toCanvas(leg.root, true), foot = toCanvas(leg.foot, false);
    root.x += sideOffset; foot.x += sideOffset;
    return straighten(root, foot, bend);
  }
  /* Head on and from behind. The lateral offset is the measured half-track.

     The fore-aft excursion does not become rows. The deer's branch adds 0.35
     of a row per pixel of step; on this animal's 8 px step that puts a
     swinging foot two and a half rows below the ground anchor, off the canvas.
     What is left of a foreshortened step is a little lateral spread and the
     pose's lift. The girdle nudge stays: the hind pair is the far pair in the
     front view. */
  const M = R.pose.M;
  const lateral = leg.side * (leg.kind === 'fore' ? M.trackFore : M.trackHind);
  const project = (p, rides) => ({
    x: R.cx + lateral + (p.x - leg.root.x) * 0.16,
    y: p.y + (leg.kind === 'hind' ? -0.20 : 0.15) + (rides ? R.sway : 0),
  });
  /* The solved joint's offset is a fore-aft quantity. Spent in x head on it
     puts the carpus two columns to one side of a limb three and a half columns
     off the midline, and the four legs cross. The axial break is one pixel
     away from the midline. */
  return straighten(project(leg.root, true), project(leg.foot, false), leg.side);
}

/* The pad: three pixels of sole, the drawn version of the ground-pressure
   measurement in body-camel.js. Floored: rounding 1.6 up puts a seven-pixel
   splat under an animal whose sole is 2.4 px across. */
function padPass(R, P, far) {
  const half = Math.floor(R.pose.M.padHalf);
  for (let k = -half; k <= half; k++)
    R.put(P.foot.x + k, P.foot.y, MAT_BODY,
      far ? 0.12 : (k === 0 ? 0.22 : 0.16), k * 0.3, 0);
}

/* The near legs are drawn after the barrel, so they stop where the barrel
   starts or they paint a stripe up the animal's side. One row of overlap keeps
   the join solid. */
function legPass(R, near) {
  const O = R.outline;
  const floorAt = near && R.dir === 2
    ? (x) => O.botAt(x - R.cx) - 1
    : null;
  const clipped = (a, b, width, form, far) => {
    if (!floorAt) { line(R, a, b, width, form, far); return; }
    const steps = Math.max(1,
      Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t);
      if (y < floorAt(x)) continue;
      stamp(R, x, y, width, form, far);
    }
  };
  /* Forearm above the carpus, cannon below it, both measured in
     `CAMEL_LIFE`. */
  const M = R.pose.M;
  for (const leg of R.pose.legs.filter((l) => l.near === near)) {
    const P = projectLeg(R, leg);
    const far = !near;
    clipped(P.root, P.joint, M.forearm, 0.54, far);
    clipped(P.joint, P.ankle, M.forearm - 1, 0.46, far);
    clipped(P.ankle, P.foot, M.cannon, 0.40, far);
    padPass(R, P, far);
  }
}

/* The humps are a mass on the back. Each is its own arc raised off the back
   line, and the saddle between them comes from the pose. */
function humpPass(R) {
  const M = R.pose.M, P = R.pose, O = R.outline, sw = R.sway;
  const backAt = (x) => O.topAt(x - R.cx);
  /* One outline over three arcs: the height above the spine is the largest of
     the three at every column. Drawn separately, each arc tapers to the back
     line and the profile measures crown, notch, plateau, notch, crown. */
  const span = Math.max(2, Math.round(M.humpSpan * 0.5));
  const hindX = R.cx + P.humpHind.x, foreX = R.cx + P.humpFore.x;
  const saddleX = R.cx + P.humpSaddle.x;
  const humpHindY = P.humpHind.y + sw, humpForeY = P.humpFore.y + sw;
  const humpSaddleY = P.humpSaddle.y + sw;
  /* the saddle arc spans the whole gap */
  const saddleSpan = Math.max(2, Math.round(M.humpGap * 0.62));
  const arc = (x, cx, half, crownY) => {
    const u = (x - cx) / half;
    if (Math.abs(u) > 1) return 0;
    return (1 - u * u) * (backAt(x) - crownY);
  };
  const x0 = Math.round(Math.min(hindX, saddleX - saddleSpan) - span);
  const x1 = Math.round(Math.max(foreX, saddleX + saddleSpan) + span);
  for (let x = x0; x <= x1; x++) {
    const rise = Math.round(Math.max(
      arc(x, hindX, span, humpHindY),
      arc(x, foreX, span, humpForeY),
      arc(x, saddleX, saddleSpan, humpSaddleY)));
    if (rise <= 0) continue;
    const back = Math.round(backAt(x));
    const top = back - rise;
    for (let y = top; y <= back; y++)
      R.put(x, y, MAT_BODY, y === top ? 0.82 : lerp(0.70, 0.56, (y - top) / rise),
        0, y === top ? -0.6 : 0);
  }
}

function bodyPass(R) {
  const O = R.outline, M = R.pose.M;
  for (let x = Math.round(O.x0); x <= Math.round(O.x1); x++) {
    const top = Math.round(O.topAt(x)), bot = Math.round(O.botAt(x));
    const depth = Math.max(1, bot - top);
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / depth;
      /* the back row and the belly row carry the only normals */
      R.put(R.cx + x, y, MAT_BODY,
        y === top ? 0.76 : y === bot ? 0.24 : lerp(0.66, 0.32, t),
        0, y === top ? -0.55 : y === bot ? 0.45 : 0);
    }
  }
  /* The tail swings on an arc off the croup. `tailLift` (body module) says
     how far it is off its hanging line; the length is the measurement, so the
     tip travels along a circle. Drawn behind the rump: inside it, a tail is a
     stripe on the animal. */
  const tailX = R.cx + O.x0;
  const tailTop = { x: tailX, y: O.topAt(O.x0) + 1 };
  const swing = R.pose.tailLift * 1.05;
  const len = M.tail * 0.62;
  const tip = { x: tailX - 1 - len * Math.sin(swing),
    y: tailTop.y + len * Math.cos(swing) };
  /* the root is thicker than the tuft, which keeps a swung tail attached */
  line(R, tailTop, { x: lerp(tailTop.x, tip.x, 0.45),
    y: lerp(tailTop.y, tip.y, 0.45) }, 2, 0.38);
  line(R, { x: lerp(tailTop.x, tip.x, 0.40),
    y: lerp(tailTop.y, tip.y, 0.40) }, tip, 1, 0.30);
}

/* The neck and head, drawn from the pose's three neck points and crown. */
function neckAndHeadPass(R) {
  const P = R.pose, M = P.M;
  const base = { x: R.cx + P.neckBase.x, y: P.neckBase.y + R.sway };
  const bend = { x: R.cx + P.neckBend.x, y: P.neckBend.y + R.sway };
  const poll = { x: R.cx + P.neckPoll.x, y: P.neckPoll.y + R.sway };
  const head = { x: R.cx + P.head.x, y: P.head.y + R.sway };
  /* Width is `neckDepthM` (poll to throat), tapering to the poll. */
  curve(R, base, bend, poll,
    Math.max(3, M.neckDepth), Math.max(3, M.neckDepth * 0.80), 0.60);
  /* The head is a long level block on top of the neck, overhanging forward by
     the whole measured skull and back over the cheek by the mandible, with air
     under the jaw. Merged into a diagonal neck the two read as one tapering
     rope. The depth is `headDepthM`, poll to under-jaw, tapering to the
     muzzle. */
  const skull = Math.max(5, Math.round(M.skull));
  const deepAt = Math.max(3, M.headDepth);
  /* The cheek covers the neck's back edge and no more. A longer one centres
     the head over the neck. */
  const jaw = Math.max(2, Math.round(M.neckDepth * 0.5));
  /* 0.12 is one pixel of muzzle fall over the whole head. 0.46 is five and
     points the animal at the ground. */
  const TILT = 0.12;
  /* Rounded once. Rounding `head.y + tilt` inside the fill puts a one-column
     step in the middle of a flat crown line. */
  const crown = Math.round(head.y);
  /* Top and bottom are each quantised on their own and each is monotonic, so
     the block closes. A depth measured off a tilting top leaves a hole in the
     jaw where the two roundings cross. */
  for (let k = -jaw; k <= skull; k++) {
    const t = Math.max(0, k) / skull;
    const top = crown + (k < 0 ? 1 : Math.round(t * skull * TILT));
    /* The underside is flat under the jaw and rises only at the muzzle. A
       taper taken from the poll pinches the block to two pixels where it meets
       the neck. */
    const bot = crown + deepAt - 1
      - (k < 0 ? Math.round(-k * 0.35)
        : Math.round(Math.max(0, t - 0.45) / 0.55 * 2));
    const deep = Math.max(1, bot - top + 1);
    for (let j = 0; j < deep; j++)
      R.put(head.x + k, top + j, MAT_BODY,
        j === 0 ? (k === skull ? 0.30 : 0.58) : j === deep - 1 ? 0.32 : 0.46,
        0.35, j === 0 ? -0.35 : 0.35);
  }
  /* the ear, over the poll */
  R.put(poll.x - 1, head.y - 1, MAT_BODY, 0.46, -0.3, -0.4);
  /* The one pale mark, two pixels on the muzzle. A one-pixel line of sand
     ramp down the neck's front edge reads as a wire laid along the animal. */
  R.put(head.x + skull - 1, crown + Math.round(skull * TILT) + 1,
    MAT_PALE, 0.70, 0.4, 0);
  R.put(head.x + skull, crown + Math.round(skull * TILT) + 1,
    MAT_PALE, 0.66, 0.4, 0.2);
}

/* The Bactrian's winter fleece: a mane down the throat, feathering on the
   upper foreleg and a crown tuft. One or two pixels each, all on the
   silhouette edge. */
function coatPass(R) {
  const P = R.pose, O = R.outline;
  const base = { x: R.cx + P.neckBase.x, y: P.neckBase.y + R.sway };
  const bend = { x: R.cx + P.neckBend.x, y: P.neckBend.y + R.sway };
  /* The mane hangs off the throat, the neck's forward edge. The four samples
     ride base to `neckBend`; sampled base to head, the hair draws inside the
     animal. */
  const n = 4;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const x = Math.round(lerp(base.x, bend.x, t)) + 1;
    const y = Math.round(lerp(base.y, bend.y, t));
    const drop = i === 2 || i === 3 ? 2 : 1;
    for (let k = 0; k < drop; k++) R.put(x, y + k, MAT_BODY, 0.30, 0.3, 0.3);
  }
  /* the shoulder feathering, where the near foreleg leaves the chest */
  const foreLeg = P.legs.find((l) => l.kind === 'fore' && l.near);
  if (foreLeg) {
    const rx = Math.round(R.cx + foreLeg.root.x);
    const ry = Math.round(O.botAt(foreLeg.root.x));
    for (let k = 0; k < 3; k++)
      R.put(rx - 1, ry - 1 + k, MAT_BODY, 0.34 - k * 0.04, -0.4, 0.2);
  }
  /* and the crown tuft between the ears, which a dromedary does not carry */
  R.put(Math.round(R.cx + P.neckPoll.x) + 1, Math.round(P.head.y + R.sway) - 1,
    MAT_BODY, 0.36, 0, -0.5);
}

/* The contact row says which side is carrying: a pace stands on a line down
   one side, so the shade is two marks on one side and nothing on the other.
   Taken from the drawn foot, because the axial views place the foot where the
   pose's fore-aft coordinate does not describe.

   It is the only shadow the legs get on dark ground. Measured on the Amber
   Waste's black pavement: a leg's cast shadow is one to three pixels wide,
   W_GROUND_FS averages coverage over a 3x3 tap and quantises it to thirds, so
   it arrives as sh = 1/3 and darkens the ground by 0.15 of a ramp. `hamada`
   has three rungs half a ramp apart, so 0.15 moves nothing and the animal
   reads as floating.

   This mark is drawn in the sprite, so it is not quantised coverage. It
   resolves on the coat's darkest rung at luminance 38, against 52 and 84 for
   the pavement's two lit rungs. It is an occlusion mark: within a pad's width
   of the foot, longer on the side away from the light, and it never
   overwrites the pad. */
const CAMEL_CONTACT_SUN = 1;

function contactShadePass(R) {
  const half = Math.floor(R.pose.M.padHalf);
  for (const leg of R.pose.legs) {
    if (!leg.contact) continue;
    const P = projectLeg(R, leg);
    const near = leg.near || R.dir !== 2;
    for (let k = -half - 1; k <= half + 1 + CAMEL_CONTACT_SUN; k++) {
      if (Math.abs(k) <= half) continue;      // the pad keeps its own pixels
      const out = Math.abs(k) - half;
      R.put(P.foot.x + k, P.foot.y, MAT_BODY,
        (out > 1 ? 0.10 : 0.06) * (near ? 1 : 1.4), 0, 0);
    }
  }
}

/* ── HEAD ON AND FROM BEHIND ────────────────────────────────────────────────
   An axial camel is a stack of masses seen end on. The two views differ in
   what occludes what. Toward the camera the neck stands in front of the humps
   and carries the head and the pale muzzle. Going away, the hind hump is the
   near mass and hides the neck; the tail is on this side. */
/* One mass of the stack. Each is a different measured width from the one
   above it: head, hump pair, barrel. */
function axialMass(R, topY, botY, halfAt, shadeAt) {
  const y0 = Math.round(topY), y1 = Math.round(botY);
  for (let y = y0; y <= y1; y++) {
    const t = (y - topY) / Math.max(1, botY - topY);
    const w = halfAt(t);
    const x0 = Math.round(R.cx - w), x1 = Math.round(R.cx + w);
    for (let x = x0; x <= x1; x++) {
      const u = (x - R.cx) / Math.max(1, w);
      /* an axial mass is shaded across its width */
      R.put(x, y, MAT_BODY,
        (y === y0 ? shadeAt(t) + 0.12 : shadeAt(t)) * (1 - 0.20 * Math.abs(u)),
        u * 0.80, y === y0 ? -0.45 : 0);
    }
  }
}

function axialBodyPass(R) {
  const P = R.pose, M = P.M, sw = R.sway;
  const front = R.dir === 0;
  const topY = (front ? P.spine.withers.y : P.spine.rump.y) + sw;
  const botY = topY + M.chestDepth * (front ? 1.00 : 0.84);
  const half = M.chestBreadth * 0.5;
  axialMass(R, topY, botY,
    (t) => half * (0.76 + 0.24 * Math.sin(Math.PI * Math.min(1, t * 1.25))),
    (t) => lerp(0.66, 0.26, t));
  if (!front) {
    /* The tail marks the away view. It hangs past the barrel's underline to
       break the outline and ends between the hocks. End on, a swung tail
       foreshortens: it covers fewer rows. */
    const swing = Math.cos(P.tailLift * 1.05);
    const tip = Math.round(botY) + Math.round(M.tail * 0.34 * swing);
    for (let y = Math.round(topY) + 2; y <= tip; y++)
      R.put(R.cx + 1, y, MAT_BODY, y > botY ? 0.30 : 0.22, 0.2, 0.2);
  }
}

function axialHumpPass(R) {
  const P = R.pose, M = P.M, sw = R.sway;
  const front = R.dir === 0;
  const backY = (front ? P.spine.withers.y : P.spine.rump.y) + sw + 1;
  /* the far hump first, then the near one over it. Edge on, one crown stands
     a row above the other and a little wider. */
  const pairs = front
    ? [[P.humpHind.y + sw, 0.58, 0.62], [P.humpFore.y + sw, 0.50, 0.74]]
    : [[P.humpFore.y + sw, 0.58, 0.62], [P.humpHind.y + sw, 0.50, 0.74]];
  for (const [crownY, breadth, shade] of pairs)
    axialMass(R, crownY, backY,
      (t) => M.humpBreadth * breadth * (0.54 + 0.46 * Math.sqrt(Math.max(0, t))),
      () => shade);
}

function axialNeckAndHeadPass(R) {
  const P = R.pose, M = P.M, sw = R.sway;
  const front = R.dir === 0;
  const headY = Math.round(P.head.y + sw);
  const hw = Math.max(1, Math.floor(M.headBreadth * 0.5));
  /* The neck stands in front of the humps. From behind, the near hump hides
     the column up to its crown. */
  if (front) {
    const baseY = P.spine.withers.y + sw + 2;
    const top = headY + 4;
    axialMass(R, top, baseY,
      (t) => M.neckBreadth * 0.5 * (0.70 + 0.60 * t),
      (t) => lerp(0.62, 0.50, t));
  } else {
    /* The neck runs from the skull to the hump it disappears behind. Without
       it the head floats two rows over the back. */
    axialMass(R, headY + 2, P.humpHind.y + sw + 1,
      () => M.neckBreadth * 0.5 * 0.70, () => 0.44);
  }
  /* the skull */
  const headBot = headY + (front ? 3 : 2);
  for (let y = headY; y <= headBot; y++)
    for (let x = R.cx - hw; x <= R.cx + hw; x++)
      R.put(x, y, MAT_BODY, y === headY ? 0.62 : front ? 0.54 : 0.42,
        (x - R.cx) * 0.4, y === headY ? -0.4 : 0);
  /* the ears, one either side of the poll */
  R.put(R.cx - hw - 1, headY, MAT_BODY, 0.44, -0.5, -0.3);
  R.put(R.cx + hw + 1, headY, MAT_BODY, 0.44, 0.5, -0.3);
  if (front) {
    /* the muzzle, below the skull and narrower, with the profile's pale
       mark */
    R.put(R.cx, headY + 4, MAT_PALE, 0.68, 0, 0.3);
    R.put(R.cx + 1, headY + 4, MAT_BODY, 0.34, 0.3, 0.2);
  }
}

/* Axial depth order: head on, the hind pair stands behind the fore pair and
   is drawn first and darker; going away, the two swap. */
function axialLegPass(R) {
  const behind = R.dir === 0 ? 'hind' : 'fore';
  const order = [...R.pose.legs].sort((a, b) =>
    (a.kind === behind ? 0 : 1) - (b.kind === behind ? 0 : 1));
  const M = R.pose.M;
  for (const leg of order) {
    const P = projectLeg(R, leg);
    const far = leg.kind === behind;
    line(R, P.root, P.joint, M.forearm, 0.54, far);
    line(R, P.joint, P.ankle, M.forearm - 1, 0.46, far);
    line(R, P.ankle, P.foot, M.cannon, 0.40, far);
    padPass(R, P, far);
  }
}

const CAMEL_PASSES = Object.freeze({
  profile: Object.freeze([
    (R) => legPass(R, false),
    bodyPass,
    humpPass,
    neckAndHeadPass,
    coatPass,
    (R) => legPass(R, true),
    contactShadePass,
  ]),
  /* every leg first and the barrel over all four: head on, no limb is in
     front of the body */
  axial: Object.freeze([
    axialLegPass,
    axialHumpPass,
    axialBodyPass,
    axialNeckAndHeadPass,
    contactShadePass,
  ]),
});

function makeCamel(rnd, frame = 0, dir = 2, state = 'walk') {
  if (!CAMEL_STATES[state]) state = 'walk';
  const R = camelContext(rnd, frame, dir, state);
  for (const pass of (dir === 2 ? CAMEL_PASSES.profile : CAMEL_PASSES.axial))
    pass(R);
  Object.defineProperty(R.sp, 'poseCamel', { value: R.pose, enumerable: false });
  return R.sp;
}

/* What the mount gives its rider. Everything is local to the ground anchor,
   so a separately shaded rider shares the camel's world position and keeps
   its own palette ramps. The rows are the drawn silhouette's rows, sampled
   per column, so the cloth follows a back that rolls. */
function camelRiderSeat(frame = 0, dir = 2, state = 'walk') {
  const pose = camelPose({ frame, dir, state });
  const M = pose.M, g = M.ground, sw = pose.bodySway;
  const O = bodyOutline(pose, sw);
  const x0 = Math.ceil(O.x0), x1 = Math.floor(O.x1);
  const back = [], belly = [];
  for (let x = x0; x <= x1; x++) {
    back.push(Math.round(O.topAt(x)) - g);
    belly.push(Math.round(O.botAt(x)) - g);
  }
  return {
    x: pose.humpSaddle.x,
    /* The seat is the taller crown's row. A Bactrian saddle is a frame that
       bridges the pair, level with the crowns. A rider placed on the saddle
       point sits in the notch with a hump either side of the knees. */
    y: Math.min(pose.humpFore.y, pose.humpHind.y) + sw - g,
    /* the notch the tree bears on */
    notchY: pose.humpSaddle.y + sw - g,
    roll: pose.roll,
    dir,
    /* the barrel, column by column, without the humps */
    x0, back, belly,
    /* the joints the seated leg is placed against */
    shoulderX: Math.round(M.roots.fore.x),
    hipX: Math.round(M.roots.hind.x),
    /* the two spans an axial rider needs */
    breadth: M.chestBreadth,
    humpGap: M.humpGap,
    /* What the mount hides, axial views only. Head on, the neck stands in
       front of the rider's chest and the hump pair in front of the lap. The
       mask is the drawn silhouette's top row per column, taken from the
       raster. */
    mask: dir === 2 ? null : silhouetteTop(makeCamel(null, frame, dir, state)),
    maskX0: -(CAMEL_CANVAS.w >> 1),
  };
}

/* The top of each column's mass, local to the ground anchor and indexed from
   the sprite's anchor column. Three rows of run make a mass: an ear is one
   pixel with air under it, and a mask taken off it hides the rider for the
   four rows below the ear. */
function silhouetteTop(sp) {
  const solid = (x, y) => {
    for (let k = 0; k < 3; k++)
      if (!sp.occ[Math.min(sp.h - 1, y + k) * sp.w + x]) return false;
    return true;
  };
  const out = [];
  for (let x = 0; x < sp.w; x++) {
    let top = null;
    for (let y = 0; y < sp.h && top === null; y++)
      if (solid(x, y)) top = y - sp.ay;
    out.push(top);
  }
  return out;
}

export {
  CAMEL_KNEE_SPAN, bodyOutline, camelRiderSeat, makeCamel,
  projectLeg,
};
