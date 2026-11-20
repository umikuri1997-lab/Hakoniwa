/* What rigged quadrupeds share: a three-segment limb closed by two-bone
   inverse kinematics, and a foot placed under the ankle by a species-declared
   kick.

   Measured differences between the roe deer and the wolf:

     unguligrade against digitigrade. The deer stands on the tips of two
       hooves over long metapodials; the wolf stands on a paw with the
       metapodial raised and near vertical. `kick` is +1.15 hind on the deer
       against +0.42 on the wolf.
     rump against withers. The roe deer's sacrum stands above its withers at
       a measured 71.62 / 66.55; the wolf's topline runs the other way.
     the escape gait. The deer is rotary at every speed. The wolf is
       speed-dependent, so it needs two galloping clips with opposite couplet
       order (src/gait.js).

   Not shared, owned by each species body module: segment counts and ratios,
   canvas, contact excursion, spine flex, head carriage, clip cadence, and
   every raster pass. */

import { clamp } from './math.js';

const point = (x, y) => ({ x, y });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* Two bones, one target. `bendSign` picks the elbow-forward or stifle-back
   solution. An unreachable target is clamped to the limb's span, no segment
   stretches, and `reachError` reports the shortfall. */
function twoBone(root, target, l1, l2, bendSign) {
  const dx = target.x - root.x, dy = target.y - root.y;
  const raw = Math.hypot(dx, dy);
  const reach = clamp(raw, Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4);
  const ux = raw > 1e-6 ? dx / raw : 0;
  const uy = raw > 1e-6 ? dy / raw : 1;
  const c = clamp((l1*l1 + reach*reach - l2*l2) / (2*l1*reach), -1, 1);
  const a = Math.acos(c) * bendSign;
  const ca = Math.cos(a), sa = Math.sin(a);
  return {
    joint: point(root.x + (ux*ca - uy*sa)*l1, root.y + (ux*sa + uy*ca)*l1),
    target: point(root.x + ux*reach, root.y + uy*reach),
    reachError: Math.abs(raw - reach),
  };
}

/* A three-segment limb standing on a declared foot. `kick` carries the stance
   posture: how far behind or ahead of the foot the ankle sits. `side` breaks
   the tie between paired limbs before the raster decides near/far order. */
function solveLimb({ root, foot, lengths, bendSign, kick, side = 0, splay = 0.08 }) {
  const [upper, lower, distal] = lengths;
  const lateral = kick + side*splay;
  /* The ankle sits on a circle of radius `distal` about the foot. Clamped: a
     kick longer than the segment has no solution and yields NaN. */
  const span = clamp(lateral, -distal + 1e-4, distal - 1e-4);
  const ankle = point(foot.x + span,
    foot.y - Math.sqrt(Math.max(1e-6, distal*distal - span*span)));
  const solved = twoBone(root, ankle, upper, lower, bendSign);
  return {
    root,
    joint: solved.joint,
    ankle: solved.target,
    foot,
    lengths,
    reachError: solved.reachError,
    segmentError: Math.max(
      Math.abs(distance(root, solved.joint) - upper),
      Math.abs(distance(solved.joint, solved.target) - lower),
      Math.abs(distance(solved.target, foot) - distal),
    ),
  };
}

/* The knee break in pixels, a fraction of the limb. The rasters keep a
   straight load line from root to foot and spend whole pixels on the break,
   because the solver's sub-pixel zigzag is noise at this scale
   (figure-deer.js, asserted in test/deer.test.mjs). One pixel on an 11.4 px
   limb is 8.8% and reads as a joint: roe deer 3.6+3.8+4.0, wolf 4.5+4.3+2.6.
   One pixel on the camel's 27.5 px limb is 3.6%, a rounding error.
   KNEE_PER_PX gives 1 for the deer and the wolf, and 2 to a limb of 23 px or
   longer. */
const KNEE_PER_PX = 11.4;
const kneePx = (limbLen) => Math.max(1, Math.round(limbLen / KNEE_PER_PX));

/* The solved knee's signed distance from the straight load line, for a raster
   to quantise. The drawn break is the solved break rounded to the pixels the
   animal's size affords, so it moves with the gait. Positive is to the right
   of root->foot looking down the limb. */
function kneeOffset(leg) {
  const dx = leg.foot.x - leg.root.x, dy = leg.foot.y - leg.root.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return 0;
  /* perpendicular distance: the 2-D cross product of the limb axis with
     root->joint, over the axis length */
  return ((leg.joint.x - leg.root.x) * dy - (leg.joint.y - leg.root.y) * dx) / len;
}

export { KNEE_PER_PX, distance, kneeOffset, kneePx, point, solveLimb, twoBone };
