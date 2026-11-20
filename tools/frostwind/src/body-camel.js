import { lerp } from './math.js';
import { metresToPx } from './scale.js';
import { LIMBS, contactSchedule, sequenceName, strikeSamples,
         symmetricStrikes } from './gait.js';
import { point, solveLimb } from './quadruped.js';

/*
 * The third rigged quadruped. It differs from the deer and the wolf in ways
 * src/gait.js already expresses:
 *
 *   1. It paces: ipsilateral limbs swing together, lag 0 on Hildebrand's
 *      diagram ('pace' in `sequenceName`). Deer and wolf walk at lag 0.25.
 *   2. It does not trot. The fast gait is a faster pace.
 *   3. Its forelimb is a column, so `bendSign` and `kick` are smaller in
 *      magnitude than in either other rig.
 *   4. It stands on a pad that spreads: two toes on a broad elastic sole.
 *
 * The species is a Bactrian: at 43 px one hump reads as a horse with a bad
 * back. docs/CANON.md records the range cost (a Central Asian animal at a
 * Saharan latitude).
 *
 * The two-bone solver, the three-segment limb and the contact schedule are
 * shared.
 */

/* Wilson & Mittermeier, Handbook of the Mammals of the World, vol. 2
 * (Hoofed Mammals), for the species ranges. `caravanBull` is the one
 * individual this raster resolves: a working adult in condition. */
const CAMEL_LIFE = Object.freeze({
  species: 'Camelus bactrianus',
  bodyLengthM: Object.freeze([2.25, 3.50]),
  /* A dromedary stands 1.80-2.10 m at the withers; this animal stands
   * 1.60-1.85 and is heavier through the barrel. */
  shoulderM: Object.freeze([1.60, 1.85]),
  skullM: Object.freeze([0.50, 0.60]),
  earM: Object.freeze([0.07, 0.11]),
  tailM: Object.freeze([0.35, 0.55]),
  massKg: Object.freeze([300, 1000]),
  /* The sole spreads to roughly 0.02 m^2 per foot under load, so a 500 kg
   * animal on four feet exerts about 60 kPa, against roughly 55 kPa for a
   * standing adult human on two. */
  soleAreaM2: 0.020,
  /* Distal over proximal. The metapodial is long like a deer's, far from the
   * wolf's 0.79. The three bone lengths are a raster prior constrained by
   * standing height, as in both other rigs. */
  provisionalBonesM: Object.freeze({
    femur: 0.430,
    metacarpus: 0.400,
    metatarsus: 0.420,
  }),
  caravanBull: Object.freeze({
    /* Nose to tail base: 0.55 m of head, about 0.9 m of neck going forward,
     * and the 1.63 m trunk. Inside the species range above. */
    bodyLengthM: 3.05,
    withersM: 1.80,
    /* The humps are fat on the spine, separate from the skeleton's topline.
     * The dip between them is the silhouette. The hind hump is the taller.
     *
     * A reference sprite at this size stands its crown 1.08x its withers
     * height. 1.23x reads as two boulders. At 1.18x the taller crown clears
     * the withers by 4.9 px and the notch sits 2.75 px under both crowns. */
    humpForeM: 2.06,
    humpHindM: 2.12,
    /* the floor of the notch, which must clear the back or there is no notch */
    saddleM: 1.88,
    /* Each hump's own span, and the distance between their crowns. A pair
     * sized for a 20 px back bunches over the shoulder on a 25 px one. */
    humpSpanM: 0.70,
    humpGapM: 0.94,
    /* The croup falls away from the withers. The reference sprite puts its
     * rump top at 0.88 of its withers height; this is 0.90. The drop is 2.8 px
     * against the taller hump's 4.9 px rise. */
    sacrumM: 1.62,
    /* deeper through the barrel than a dromedary, and a heavier coat on it */
    chestDepthM: 0.80,
    /* Breadths, for the axial views. The Bactrian carries its extra mass
     * sideways (Wilson & Mittermeier, vol. 2): the barrel is broad against its
     * height, the hump pair is narrower than the ribcage, the neck narrower,
     * the head narrowest. */
    chestBreadthM: 0.76,
    humpBreadthM: 0.54,
    neckBreadthM: 0.26,
    headBreadthM: 0.20,
    /* Poll to throat through the neck, the profile's measurement. 0.40 m is
     * six pixels, the reference sprite's share of its withers height. */
    neckDepthM: 0.40,
    /* Limb thickness with the coat on. Bare, the forearm is about 0.20 m and
       the cannon about 0.11 m; in fleece the forearm is nearer 0.26 (the
       reference sprite draws four pixels). The coat barely thickens the
       cannon, which moves only enough to round to two pixels: a one-pixel
       cannon on a twenty-nine pixel limb is a hair. */
    forearmM: 0.26,
    cannonM: 0.13,
    /* Poll to under-jaw, the depth the profile draws (not the skull's
       length). */
    headDepthM: 0.30,
    /* Track width, centre to centre. Narrow for the animal's size, because
     * the pace puts the whole body over one side in turn. The fore track is
     * the wider pair. */
    trackForeM: 0.46,
    trackHindM: 0.36,
    skullM: 0.55,
    earM: 0.09,
    tailM: 0.50,
    /* Carried lower than a dromedary's. 2.42 stands the crown at 1.34 of the
     * withers, above the reference dromedary's 1.29. 2.33 is 1.29 with the ear
     * riding the row over it. */
    alertHeadM: 2.33,
    /* Shoulder joint to hip joint, the span the barrel is drawn over (not
     * `bodyLengthM`). `bodyOutline` draws 1.24 trunks, so 1.35 m puts 25.5 px
     * of barrel under a 27.5 px withers: 0.93 of the standing height, where
     * the reference sprite spends 1.13. 1.63 m is that ratio. */
    trunkM: 1.63,
    /* The neck along its own curve. The head is placed by the chord
     * (NECK_CHORD). */
    neckM: 1.05,
  }),
});

/* Measured. Rows: at 41 the alert head lands on row 0 and the ear off the
 * canvas; the crown at 2.55 m is 39 px and the sprite needs the row above.
 * Columns: the muzzle needs 34 columns of body space on the pace's suspension
 * frame (body highest, nod most extended), so the anchor needs 35 either side.
 * `cropSprite` trims every frame into the atlas, so the margin costs nothing.
 *
 * Measure this on a canvas that is already big enough. `put` drops a pixel
 * outside the sprite silently, so a clipping frame reports the clip and every
 * answer comes back one column inside whatever was set. */
const CAMEL_CANVAS = Object.freeze({ w: 71, h: 43 });
/* It paces at both speeds. */
const CAMEL_SPEED = Object.freeze({ walk: 26, pace: 62 });

/* The limb chain: a prior constrained by the standing height it fills, with
 * slack to stride on. The step length derives from it. The distal fraction is
 * 0.28.
 *
 * Measured, fore chain over a 25.6 px root:
 *   27.5 px  93% extended, 6.8 px of travel, 99.6% chain use at the pace
 *   29.1 px  9.8 px of travel, 0.77 strides a second at the walk
 *   30.4 px  84% extended, 12.3 px of travel, 0.55 strides a second
 *
 * The hip sits under the sacrum at 1.62 m. The hind chain stands 81%
 * extended and leaves 1.6 px over the longest stride the fore chain sets. A
 * chain 1/0.93 as long stands 76% extended, a camel sitting down. */
const CAMEL_SEGMENTS = Object.freeze({
  fore: Object.freeze([11.39, 10.50, 8.52]),
  hind: Object.freeze([10.88, 9.77, 7.38]),
});

/* How far a foot can go: a right triangle on the worst frame, the pace's
 * strike (body highest, rolled fully onto that side, foot at full forward
 * excursion). At the standing height the solver clamps by 0.39 px on the
 * right fore at pace frame 4.
 *
 * The triangle is the proximal pair against a rise shortened by the distal:
 * in `solveLimb` the ankle rides one distal segment above the planted foot.
 * All three segments against the ground overstate the reach by 2.5 px, 20%
 * of the stride. */
const CAMEL_FORE_PROXIMAL = CAMEL_SEGMENTS.fore[0] + CAMEL_SEGMENTS.fore[1];
const CAMEL_FORE_DISTAL = CAMEL_SEGMENTS.fore[2];
const CAMEL_STAND_PX = 25.6;
const CAMEL_ROLL_ROOT = 0.35;    // how much of the roll reaches the limb root
/* How far the barrel's centre travels sideways at full roll, in world depth
 * pixels. A 0.80 m deep body rocking onto one flank moves its centre a few
 * centimetres; 2.0 px is that at 15.3 px/m, and the cabinet halves it to one
 * row on screen. */
const CAMEL_ROLL_PX = 2.0;
/* The highest the limb root is carried: the pace's suspension
 * (CAMEL_SINK.pace, -1.0) plus a full roll onto the far side. */
const CAMEL_MAX_LIFT = 1.0 + 1.0 * CAMEL_ROLL_ROOT;
const CAMEL_HIGH_PX = CAMEL_STAND_PX + CAMEL_MAX_LIFT;
const CAMEL_ANKLE_RISE = CAMEL_HIGH_PX - CAMEL_FORE_DISTAL;
const CAMEL_MAX_REACH = Math.sqrt(
  CAMEL_FORE_PROXIMAL * CAMEL_FORE_PROXIMAL - CAMEL_ANKLE_RISE * CAMEL_ANKLE_RISE);
/* How far it goes, which sets the cadence. Ground covered per cycle is
 * TRAVEL x SLIP and the travel is twice the reach. Measured: at 0.60 of the
 * limb's room the walk takes 0.77 cycles a second and the legs flicker. A
 * walking camel is near 0.55 strides a second and a pacing one near 1.25.
 *
 * test/camel.test.mjs asserts a zero reach error on every frame of every
 * gait; the worst frame is the pace's strike. */
const CAMEL_REACH = Object.freeze({
  walk: CAMEL_MAX_REACH * 0.84,
  pace: CAMEL_MAX_REACH * 0.88,
});

/* The travel is the drawn stance sweep, so the declared slip is the real
 * slip: ground covered per cycle is exactly `TRAVEL * SLIP`. Measured
 * failure: a declared travel of 14 and 24 over a drawn sweep of 5.2 and 6.8
 * slips the walk 6.46x and the pace 8.47x against a SLIP of 2.40. The
 * machines slip 2.9x. */
const CAMEL_TRAVEL_PX = Object.freeze({
  walk: 2 * CAMEL_REACH.walk,
  pace: 2 * CAMEL_REACH.pace,
});
const CAMEL_SLIP = 2.40;         // the same declared concession both rigs carry

/* The two footfall patterns, as points on Hildebrand's diagram.
 *
 * lag 0 is the pace: the forefoot strikes with the ipsilateral hind, so the
 * animal is supported on one side and then the other. Duty 0.55 at the walk
 * leaves two of eight samples with a single side down; duty 0.375 at speed
 * leaves a suspension, the ricochetal pace.
 *
 * A pace's support polygon is a line down one side of the body, which is why
 * a paced walk rolls. */
const CAMEL_WALK_GAIT = Object.freeze({ samples: 8, duty: 0.55, lag: 0 });
const CAMEL_PACE_GAIT = Object.freeze({ samples: 8, duty: 0.375, lag: 0 });
const CAMEL_GAITS = Object.freeze({ walk: CAMEL_WALK_GAIT, pace: CAMEL_PACE_GAIT });

const gaitRateCamel = (state) =>
  CAMEL_GAITS[state].samples * CAMEL_SPEED[state]
  / (CAMEL_TRAVEL_PX[state] * CAMEL_SLIP);

const CAMEL_CLIPS = Object.freeze({
  /* Chew, lift, scan, settle. */
  idle: Object.freeze({ n: 4, rate: 0.55 }),
  walk: Object.freeze({ n: CAMEL_WALK_GAIT.samples, rate: gaitRateCamel('walk') }),
  pace: Object.freeze({ n: CAMEL_PACE_GAIT.samples, rate: gaitRateCamel('pace') }),
});
const CAMEL_STATES = Object.freeze(Object.fromEntries(
  Object.entries(CAMEL_CLIPS).map(([state, clip]) => [state, clip.n])));

const CAMEL_STRIKE = Object.freeze({
  walk: strikeSamples(symmetricStrikes(CAMEL_WALK_GAIT.lag), CAMEL_WALK_GAIT.samples),
  pace: strikeSamples(symmetricStrikes(CAMEL_PACE_GAIT.lag), CAMEL_PACE_GAIT.samples),
});
const CAMEL_STANCE = Object.freeze({
  walk: Math.round(CAMEL_WALK_GAIT.duty * CAMEL_WALK_GAIT.samples),
  pace: Math.round(CAMEL_PACE_GAIT.duty * CAMEL_PACE_GAIT.samples),
});
const CAMEL_CONTACTS = Object.freeze({
  walk: contactSchedule({ ...CAMEL_WALK_GAIT,
    strikes: symmetricStrikes(CAMEL_WALK_GAIT.lag) }),
  pace: contactSchedule({ ...CAMEL_PACE_GAIT,
    strikes: symmetricStrikes(CAMEL_PACE_GAIT.lag) }),
});
/* The classification is the input and the tables derive from it (the
 * src/gait.js rule). Asserted in test/camel.test.mjs. */
const CAMEL_SEQUENCE = sequenceName(CAMEL_WALK_GAIT.lag);

const mod = (v, n) => ((v % n) + n) % n;

function measureCamel() {
  const L = CAMEL_LIFE.caravanBull;
  const bodyLength = metresToPx(L.bodyLengthM);
  const withers = metresToPx(L.withersM);
  const sacrum = metresToPx(L.sacrumM);
  const humpFore = metresToPx(L.humpForeM);
  const humpHind = metresToPx(L.humpHindM);
  const saddle = metresToPx(L.saddleM);
  /* `hump` is the crown of the taller one: the animal's height. */
  const hump = Math.max(humpFore, humpHind);
  const humpSpan = metresToPx(L.humpSpanM);
  const humpGap = metresToPx(L.humpGapM);
  const chestDepth = metresToPx(L.chestDepthM);
  const chestBreadth = metresToPx(L.chestBreadthM);
  const humpBreadth = metresToPx(L.humpBreadthM);
  const neckBreadth = metresToPx(L.neckBreadthM);
  const headBreadth = metresToPx(L.headBreadthM);
  const headDepth = metresToPx(L.headDepthM);
  const neckDepth = metresToPx(L.neckDepthM);
  const forearm = Math.max(2, metresToPx(L.forearmM));
  const cannon = Math.max(2, metresToPx(L.cannonM));
  const skull = metresToPx(L.skullM);
  const ear = metresToPx(L.earM);
  const tail = metresToPx(L.tailM);
  const trunk = metresToPx(L.trunkM);
  const neck = metresToPx(L.neckM);
  const ground = CAMEL_CANVAS.h - 1;

  /* The fore chain runs nearly vertical, so the solver's bend is small. The
   * distal fraction is 0.28, between the wolf's digitigrade 0.23 and the
   * deer's unguligrade 0.35: a long metapodial that ends on a pad.
   *
   * Measured constraint: a set summing to 28.2 leaves the fore chain 0.4 px
   * of slack over its standing height, and the pace's strike frame needs
   * sqrt(28.3^2 + 3.4^2) = 28.5. test/camel.test.mjs reports a reach error of
   * 0.73 px on the left fore. */
  const segments = CAMEL_SEGMENTS;
  return Object.freeze({
    bodyLength, withers, sacrum, hump, humpFore, humpHind, saddle,
    humpSpan, humpGap, chestDepth, skull, ear, tail, trunk, neck,
    chestBreadth, humpBreadth, neckBreadth, headBreadth, headDepth, neckDepth,
    forearm, cannon,
    ground,
    /* Medium concessions, named apart from the measurements. */
    silhouetteLength: bodyLength + 2,
    coatDepth: chestDepth + 1,
    alertHeight: metresToPx(L.alertHeadM),
    canvas: CAMEL_CANVAS,
    segments,
    /* the pad, in drawn pixels */
    padHalf: 1.6,
    /* half the centre-to-centre track: an axial view's limb offset and a
       profile view's near/far separation */
    trackFore: metresToPx(L.trackForeM) * 0.5,
    trackHind: metresToPx(L.trackHindM) * 0.5,
    /* The joints sit inside the body: the shoulder a little over two pixels
       under the withers and the hip the same under the croup. The pair splits
       the trunk measurement. */
    roots: Object.freeze({
      hind: point(-trunk / 2, ground - sacrum + 2.2),
      fore: point(trunk / 2, ground - withers + 2.4),
    }),
    stance: 2.2,
  });
}

/* The foot must clear its own pad. The drawn sole is 2 * padHalf = 3.2 px
 * across, and a smaller gap under it does not read as air at native scale. A
 * pacing limb takes that floor and no more. */
const CAMEL_SWING_LIFT = 3.2;

/* Stance sweep and swing keys. Hildebrand placed the strikes; the excursion is
 * this animal's.
 *
 * The swing is the stance run backwards, anchored on the stance endpoints and
 * divided by the intervals between toe-off and the next strike. Measured
 * failure with independent swing keys (swing begins at -0.60 reach): the foot
 * jumps 2.8 px forward at toe-off while 1.4 px off the ground, ends 1.0 px
 * short of the next strike, and swings slower than it plants. */
function pacedFoot(limb, frame, strike, samples, stance, reach) {
  const age = mod(frame - strike[limb], samples);
  /* Retraction ends at the toe-off moment, one whole interval past the last
   * planted frame, so the foot still moves backwards on the frame it lifts
   * on. Ending at the last contact frame reverses the foot on the ground.
   *
   * The denominator is `stance`, not `stance - 1`: the contact phase owns
   * `stance` of the cycle's `samples` intervals, the duty the contact schedule
   * is built from. */
  if (age < stance) {
    return {
      x: lerp(reach, -reach, age / stance),
      lift: 0, contact: true,
      event: age === 0 ? 'strike' : age === stance - 1 ? 'toe' : 'stance',
    };
  }
  const swing = (age - stance) / (samples - stance);
  /* protraction starts from a stop and arrives at one */
  const ease = swing * swing * (3 - 2 * swing);
  /* The foot is off the ground on the first airborne frame, so the arc is not
   * a sine of the swing itself (sin(0) is zero). Toe-off is half an interval
   * before that frame and the strike half an interval after the last one; `u`
   * is the swing on that wider window. The 0.65 power fattens the arc: a
   * plain sine spends its clearance in one middle frame and drags at both
   * ends. */
  const h = 0.5 / (samples - stance);
  const u = (swing + h) / (1 + 2 * h);
  return {
    x: lerp(-reach, reach, ease),
    lift: CAMEL_SWING_LIFT * Math.sin(Math.PI * u) ** 0.65,
    contact: false, event: 'swing',
  };
}

function idleFoot(limb) {
  const fore = limb[1] === 'F';
  return { x: fore ? 0.5 : -0.5, lift: 0, contact: true, event: 'stand' };
}

/* The tail swings clear of the hocks each time they pass under it, twice per
 * cycle on an eight-sample clip: the left pair at strike 0 and the right pair
 * at strike 4. Same shape at both speeds; the pace swings harder. A small
 * negative is the counter-swing past the hanging line. */
const CAMEL_TAIL = Object.freeze({
  walk: Object.freeze([0, 0.42, 0.78, 0.30, -0.12, 0.42, 0.78, 0.30]),
  pace: Object.freeze([-0.15, 0.55, 1.00, 0.42, -0.15, 0.55, 1.00, 0.42]),
});

/* How far the barrel rises and falls, and when. Positive is down.
 *
 * The walk is an inverted pendulum: lowest at the strikes (samples 0 and 4,
 * `CAMEL_STRIKE`) and highest at mid-stance. The pace is a running gait:
 * highest in the air (samples 3 and 7) and lowest at mid-stance.
 *
 * Both amplitudes are a named concession. A walking camel's withers move a
 * few centimetres, a third of a pixel. 1.8 px at the walk is 12 cm and 2.4 px
 * peak-to-peak at the pace is 16 cm. Measured: at 1.2 the drawn back spends
 * five frames of eight on one row; 1.8 puts the three keys on three rows. */
const CAMEL_SINK = Object.freeze({
  walk: Object.freeze([1.8, 0.9, 0, 0.9, 1.8, 0.9, 0, 0.9]),
  pace: Object.freeze([0.8, 1.4, 0.7, -1.0, 0.8, 1.4, 0.7, -1.0]),
});

/* The head answers the body late: the head's table is the body's table read
 * two samples on, so the nod cannot drift out of step with the gait. Two of
 * eight is a quarter cycle, the phase of a pendulum on a driven root. 1.5 is
 * the authored overshoot. */
const CAMEL_HEAD_LAG = 2;
const CAMEL_HEAD_GAIN = 1.5;
/* A compliant neck smooths what it follows. Copying the pace table's
 * suspension spike two samples late draws a head that jerks between frames.
 * Three taps at 1:2:1 is the narrowest low pass an eight-sample table has
 * room for. */
const headRideAt = (table, a, n) =>
  (table[mod(a - 1, n)] + 2 * table[mod(a, n)] + table[mod(a + 1, n)]) / 4;
/* The neck is a lever: the crown reaches forward as it falls and draws back
 * as it lifts. */
const CAMEL_HEAD_SURGE = 0.9;

/* Straight line over arc length. `neckM` is the neck along its curve; the
 * poll is placed by the chord between the chest and the crown, and an S
 * spends a quarter of its length on the sweep. */
const NECK_CHORD = 0.76;

const IDLE_HEAD = Object.freeze([
  Object.freeze({ mode: 'chew', drop: 0.2, scan: 0 }),
  Object.freeze({ mode: 'lift', drop: -0.4, scan: 0 }),
  Object.freeze({ mode: 'scan', drop: -0.2, scan: 1 }),
  Object.freeze({ mode: 'settle', drop: 0.4, scan: 0 }),
]);

function camelPose({ state = 'idle', frame = 0, dir = 2 } = {}) {
  const M = measureCamel();
  const clip = CAMEL_CLIPS[state] || CAMEL_CLIPS.idle;
  const f = mod(frame, clip.n);
  const paced = state === 'walk' || state === 'pace';
  const reach = CAMEL_REACH[state] || CAMEL_REACH.walk;

  /* The roll. Both feet on one side leave the ground together, so the body
   * leans onto the other. The deer and the wolf must not gain a lateral
   * term. */
  const roll = !paced ? 0
    : [1, 0.7, 0, -0.7, -1, -0.7, 0, 0.7][f] * (state === 'pace' ? 1.0 : 0.6);
  const bodySink = (CAMEL_SINK[state] || [])[f] || 0;
  /* Almost no sagittal flex: a pace is a lateral gait. A fraction of the
   * wolf's canter. */
  const spineFlex = paced ? [0.2, 0.1, 0, -0.1, -0.2, -0.1, 0, 0.1][f] : 0;

  const headKey = state === 'idle' ? IDLE_HEAD[f % IDLE_HEAD.length]
    : { mode: 'travel', drop: state === 'pace' ? 0.30 : 0.10, scan: 0 };

  const feet = [], legs = [];
  const strike = CAMEL_STRIKE[state] || CAMEL_STRIKE.walk;
  const stance = CAMEL_STANCE[state] || CAMEL_STANCE.walk;
  for (const limb of LIMBS) {
    const side = limb[0] === 'L' ? -1 : 1;
    const kind = limb[1] === 'H' ? 'hind' : 'fore';
    const foot = paced
      ? pacedFoot(limb, f, strike, clip.n, stance, reach)
      : idleFoot(limb);
    const root0 = M.roots[kind];
    const root = point(root0.x,
      root0.y + bodySink + roll * side * 0.35
      + (kind === 'hind' ? spineFlex * 0.20 : -spineFlex * 0.12));
    const ground = point(root0.x + foot.x, M.ground - foot.lift);
    /* The seam with the other two rigs. The fore chain is nearly a column:
     * the bend is a third of the wolf's and the kick is small in both
     * girdles. */
    const leg = solveLimb({
      root, foot: ground, lengths: M.segments[kind],
      bendSign: kind === 'hind' ? 1 : -1,
      kick: kind === 'hind' ? 0.30 : -0.07, side,
    });
    feet.push({ ...foot, limb, side, kind, x: ground.x, y: ground.y });
    legs.push({ ...leg, limb, side, kind, near: side < 0, contact: foot.contact });
  }

  const contacts = feet.filter((foot) => foot.contact);
  const support = contacts.length
    ? [Math.min(...contacts.map((q) => q.x)), Math.max(...contacts.map((q) => q.x))]
    : null;
  /* which side is carrying (0 when both or neither) */
  const carrying = contacts.length
    ? (contacts.every((q) => q.side === contacts[0].side) ? contacts[0].side : 0)
    : 0;

  /* The weight transfer. A pace stands on a line down one flank, so the body
   * moves onto that flank. A lateral displacement is a depth displacement, and
   * PROJECTION.md maps depth to screen rows at k = 1/2, so a body that shifts
   * `bodyDepth` sideways draws half that far down the screen in profile. */
  const bodyDepth = roll * CAMEL_ROLL_PX;
  const bodySway = bodyDepth * 0.5;

  /* The body must stay over its feet. `support` is the fore-aft extent of
   * what is on the ground, plus the pad either side. Negative means the animal
   * is falling over. Null when nothing is down: the ricochetal pace has a
   * suspension (two of eight samples carry no contact, asserted in
   * test/camel.test.mjs). */
  const supportMargin = support
    ? Math.min(0 - support[0] + M.padHalf, support[1] - 0 + M.padHalf)
    : null;

  /* The topline is withers and croup. The joints sit two and a half pixels
   * lower, inside the mass. */
  const spine = {
    withers: point(M.roots.fore.x, M.ground - M.withers + bodySink
      - spineFlex * 0.12),
    rump: point(M.roots.hind.x, M.ground - M.sacrum + bodySink
      + spineFlex * 0.20),
  };
  /* fore is +x and hind is -x, so the pair straddles the barrel's midpoint */
  const humpMid = (M.roots.hind.x + M.roots.fore.x) / 2;
  /* The neck goes out before it goes up. It leaves the chest low near the
   * brisket, sweeps forward, then turns up, and the head cantilevers forward
   * off the top: an S. Three points, with the quadratic's control forward and
   * low. One chord from withers to crown draws a diagonal rope. The pose owns
   * the shape and the raster strokes it. */
  const neckBase = point(M.roots.fore.x + 2.0, spine.withers.y + 8.0);
  /* The crown height is the measurement and the poll hangs one head-depth
   * under it. */
  const headRide = paced
    ? headRideAt(CAMEL_SINK[state], f + CAMEL_HEAD_LAG, clip.n) * CAMEL_HEAD_GAIN
    : bodySink;
  const headY = M.ground - M.alertHeight + headRide + headKey.drop * 2.0;
  const surge = paced ? headRide * CAMEL_HEAD_SURGE : 0;
  /* The column's forward run is what the chord has left once the rise from
   * the chest is paid: a right triangle. It is spent on the poll, which keeps
   * the column vertical. */
  const rise = Math.max(0, neckBase.y - (headY + M.headDepth));
  const chord = M.neck * NECK_CHORD;
  const run = Math.sqrt(Math.max(1, chord * chord - rise * rise));
  const neckPoll = point(neckBase.x + run + surge, headY + M.headDepth);
  /* the throat's forward corner: the control is ahead of the poll and level
     with the lower third of the column */
  const neckBend = point(neckPoll.x + M.neckDepth * 0.30,
    lerp(neckBase.y, neckPoll.y, 0.30));
  /* `head` is the crown, over the poll */
  const head = point(neckPoll.x, headY);

  return Object.freeze({
    M, state, frame: f, dir, feet, legs, contacts: contacts.length,
    support, carrying, supportMargin, bodySink, spineFlex, roll,
    bodyDepth, bodySway,
    flight: contacts.length === 0,
    /* how far the tail is swung off its hanging line, 0 hanging and 1 clear of
       the hocks. The raster owns the arc; this owns when it happens. */
    tailLift: (CAMEL_TAIL[state] || [])[f] || 0,
    headMode: headKey.mode, headScan: headKey.scan, headRide,
    spine, neckBase, neckBend, neckPoll, head,
    /* The two crowns and the notch, riding the body. Placed about the
     * barrel's midpoint and separated by humpGap: the fore hump over the
     * withers, the hind over the loins. The saddle is its own point, because
     * interpolating between two crowns draws one long hump. */
    humpFore: point(humpMid + M.humpGap / 2, M.ground - M.humpFore + bodySink),
    humpHind: point(humpMid - M.humpGap / 2, M.ground - M.humpHind + bodySink),
    humpSaddle: point(humpMid, M.ground - M.saddle + bodySink),
  });
}

export {
  CAMEL_CANVAS, CAMEL_CLIPS, CAMEL_CONTACTS, CAMEL_GAITS, CAMEL_LIFE,
  CAMEL_PACE_GAIT, CAMEL_SEQUENCE, CAMEL_SLIP, CAMEL_SPEED, CAMEL_STANCE,
  CAMEL_STATES, CAMEL_STRIKE, CAMEL_TRAVEL_PX, CAMEL_WALK_GAIT,
  camelPose, gaitRateCamel, measureCamel,
};
