import { clamp, lerp } from './math.js';
import { metresToPx } from './scale.js';
import { LIMBS, asymmetricStrikes, contactSchedule, strikeSamples,
         symmetricStrikes } from './gait.js';
import { point, solveLimb } from './quadruped.js';

/*
 * The second rigged quadruped: a Eurasian wolf. A digitigrade carnivore that
 * travels at a suspended trot and changes couplet order between canter and
 * sprint. It shares only the two-bone solver (src/quadruped.js) and the
 * contact schedule (src/gait.js) with the deer.
 */

/* Wilson & Mittermeier, Handbook of the Mammals of the World, vol. 1
 * (Carnivores), and Mech & Boitani, Wolves: Behavior, Ecology, and
 * Conservation (2003). Ranges are species facts. `borealMale` is the one
 * individual this raster resolves, a large northern animal in winter coat. */
const WOLF_LIFE = Object.freeze({
  species: 'Canis lupus',
  bodyLengthM: Object.freeze([1.00, 1.60]),
  shoulderM: Object.freeze([0.66, 0.81]),
  skullM: Object.freeze([0.24, 0.28]),
  earM: Object.freeze([0.09, 0.11]),
  tailM: Object.freeze([0.35, 0.50]),
  massKg: Object.freeze([32, 50]),
  /* Biancardi & Minetti: the distal/proximal limb ratio separates the gallop
   * classes, highest in rotary gallopers, lowest in speed-dependent ones. The
   * deer's metatarsus/femur is 0.947 and this animal's is 0.79. These three
   * are a raster prior constrained by standing height, as the deer's are. */
  provisionalBonesM: Object.freeze({
    femur: 0.200,
    metacarpus: 0.130,
    metatarsus: 0.158,
  }),
  borealMale: Object.freeze({
    bodyLengthM: 1.20,
    withersM: 0.76,
    /* The withers are the high point and the croup falls away, one row at
     * this scale. A roe deer's sacrum stands above its withers at a measured
     * 71.62/66.55. */
    sacrumM: 0.72,
    chestDepthM: 0.32,
    skullM: 0.26,
    earM: 0.10,
    tailM: 0.42,
    /* Crown of the ears, standing alert. A wolf carries its head barely above
     * the withers on a short thick neck; a roe deer lifts its head a clear
     * head-length above its shoulder. */
    alertHeadM: 1.05,
  }),
});

const WOLF_CANVAS = Object.freeze({ w: 31, h: 19 });
/* Travel is the trot, which is what wild canids use over distance. The sprint
 * is the chase. */
const WOLF_SPEED = Object.freeze({ walk: 30, trot: 62, canter: 88, sprint: 124 });
const WOLF_TRAVEL_PX = Object.freeze({ walk: 10, trot: 14, canter: 17, sprint: 20 });
const WOLF_SLIP = 2.40;          // the same declared concession the deer carries

/* The four footfall patterns, as points on Hildebrand's diagram. src/gait.js
 * owns the law; these are this animal's coordinates on it.
 *
 * Source for the classification: Biancardi & Minetti, J. Exp. Biol. 215:4144
 * (2012), which places most Canidae, and wolf and coyote by name, in the
 * speed-dependent class: a transverse canter that becomes a rotary sprint.
 * The roe deer in the same study is rotary at every speed, so `couplets` sits
 * on a clip and never on a species.
 *
 * The duty factors and lags are medium-authored at eight keys, as the deer's
 * are, not filmed canid timings. */
const WOLF_WALK_GAIT = Object.freeze({ samples: 8, duty: 0.75, lag: 0.25 });
/* A travelling trot carries a suspension: diagonal pairs, three of eight
 * samples planted, so two samples have no foot down at all. */
const WOLF_TROT_GAIT = Object.freeze({ samples: 8, duty: 0.375, lag: 0.5 });
const WOLF_CANTER_GAIT = Object.freeze({
  samples: 8, duty: 0.375, firstHind: 'RH', couplets: 'transverse',
  hindLag: 0.125, foreLag: 0.125, girdleGap: 0.5, offset: 0.125,
});
const WOLF_SPRINT_GAIT = Object.freeze({
  samples: 8, duty: 0.25, firstHind: 'RH', couplets: 'rotary',
  hindLag: 0.125, foreLag: 0.125, girdleGap: 0.5, offset: 0.125,
});
const WOLF_GAITS = Object.freeze({
  walk: WOLF_WALK_GAIT, trot: WOLF_TROT_GAIT,
  canter: WOLF_CANTER_GAIT, sprint: WOLF_SPRINT_GAIT,
});

const gaitRateWolf = (state) =>
  WOLF_GAITS[state].samples * WOLF_SPEED[state]
  / (WOLF_TRAVEL_PX[state] * WOLF_SLIP);

const WOLF_CLIPS = Object.freeze({
  /* Alert, scan left, scan right, settle. */
  idle: Object.freeze({ n: 4, rate: 0.70 }),
  walk: Object.freeze({ n: WOLF_WALK_GAIT.samples, rate: gaitRateWolf('walk') }),
  trot: Object.freeze({ n: WOLF_TROT_GAIT.samples, rate: gaitRateWolf('trot') }),
  canter: Object.freeze({ n: WOLF_CANTER_GAIT.samples, rate: gaitRateWolf('canter') }),
  sprint: Object.freeze({ n: WOLF_SPRINT_GAIT.samples, rate: gaitRateWolf('sprint') }),
});
const WOLF_STATES = Object.freeze(Object.fromEntries(
  Object.entries(WOLF_CLIPS).map(([state, clip]) => [state, clip.n])));

const WALK_N = WOLF_WALK_GAIT.samples;
const WALK_STANCE = Math.round(WOLF_WALK_GAIT.duty * WALK_N);
const WOLF_WALK_STRIKE = strikeSamples(symmetricStrikes(WOLF_WALK_GAIT.lag), WALK_N);
const WOLF_TROT_STRIKE = strikeSamples(symmetricStrikes(WOLF_TROT_GAIT.lag),
  WOLF_TROT_GAIT.samples);
const TROT_STANCE = Math.round(WOLF_TROT_GAIT.duty * WOLF_TROT_GAIT.samples);

/* Strike sample and stance length per asymmetrical clip, from the gait row
 * the schedule comes from. Scanning the schedule for the first planted sample
 * is not equivalent: a stance that wraps past the last key reports sample 0
 * as its strike, which puts the canter's off fore 14 px behind the animal. */
const asymKeys = (gait) => Object.freeze({
  strike: strikeSamples(asymmetricStrikes(gait), gait.samples),
  stance: Math.round(gait.duty * gait.samples),
});
const WOLF_ASYM = Object.freeze({
  canter: asymKeys(WOLF_CANTER_GAIT),
  sprint: asymKeys(WOLF_SPRINT_GAIT),
});

const WOLF_CONTACTS = Object.freeze({
  walk: contactSchedule({ ...WOLF_WALK_GAIT,
    strikes: symmetricStrikes(WOLF_WALK_GAIT.lag) }),
  trot: contactSchedule({ ...WOLF_TROT_GAIT,
    strikes: symmetricStrikes(WOLF_TROT_GAIT.lag) }),
  canter: contactSchedule({ ...WOLF_CANTER_GAIT,
    strikes: asymmetricStrikes(WOLF_CANTER_GAIT) }),
  sprint: contactSchedule({ ...WOLF_SPRINT_GAIT,
    strikes: asymmetricStrikes(WOLF_SPRINT_GAIT) }),
});

const mod = (v, n) => ((v % n) + n) % n;

function measureWolf() {
  const L = WOLF_LIFE.borealMale;
  const bodyLength = metresToPx(L.bodyLengthM);
  const withers = metresToPx(L.withersM);
  const sacrum = metresToPx(L.sacrumM);
  const chestDepth = metresToPx(L.chestDepthM);
  const skull = metresToPx(L.skullM);
  const ear = metresToPx(L.earM);
  const tail = metresToPx(L.tailM);
  const ground = WOLF_CANVAS.h - 1;

  /* Digitigrade. The third segment is a short raised metapodial ending in a
   * paw, so the distal segment is the smallest of the three and the proximal
   * two carry the height. A raster prior constrained by the measured standing
   * height: the proximal bone lengths are not published.
   *
   * Measured constraint: a set summing to 10.8 px leaves the fore limb 0.4 px
   * of slack over its 10.4 px standing height, and the two-bone solver clamps
   * at the sprint's forward excursion. Both limbs sum to 11.4. The distal
   * fraction is 0.23 against the deer's 0.35. */
  const segments = Object.freeze({
    fore: Object.freeze([4.5, 4.3, 2.6]),
    hind: Object.freeze([4.6, 4.4, 2.4]),
  });
  return Object.freeze({
    bodyLength, withers, sacrum, chestDepth, skull, ear, tail, ground,
    /* Medium concessions. Winter guard hair gains a row on the chest and the
     * ruff, and the brush gains one so the tail does not quantise to a line. */
    silhouetteLength: bodyLength + 2,
    coatDepth: chestDepth + 1,
    brush: tail + 1,
    alertHeight: metresToPx(L.alertHeadM),
    canvas: WOLF_CANVAS,
    segments,
    /* The fore root sits higher than the hind: withers above croup. */
    roots: Object.freeze({
      hind: point(-5.0, ground - sacrum + 2.0),
      fore: point(5.4, ground - withers + 1.6),
    }),
    stance: 1.8,
  });
}

/* Stance sweep and swing keys. Hildebrand placed the strikes; the excursion is
 * this animal's, shorter than the deer's. */
function symmetricFoot(limb, frame, strike, samples, stance) {
  const age = mod(frame - strike[limb], samples);
  const toe = stance - 1;
  if (age < stance) {
    return {
      x: lerp(1.95, -1.95, toe === 0 ? 0 : age/toe),
      lift: 0, contact: true,
      event: age === 0 ? 'strike' : age === toe ? 'toe' : 'stance',
    };
  }
  const swing = (age - stance)/Math.max(1, samples - stance - 1);
  return {
    x: lerp(-1.10, 1.60, swing),
    lift: 1.0 + 1.4*Math.sin(Math.PI*Math.min(1, swing + 0.18)),
    contact: false, event: 'swing',
  };
}

/* The asymmetrical clips take their strike and stance from the gait row, so a
 * couplet order change moves the feet without a second table. */
function asymmetricFoot(limb, frame, samples, strike, stance, reach) {
  const age = mod(frame - strike[limb], samples);
  if (age < stance) {
    const t = stance === 1 ? 0.5 : age/(stance - 1);
    return { x: lerp(reach, -reach, t), lift: 0, contact: true,
      event: age === 0 ? 'contact' : 'stance' };
  }
  const air = samples - stance;
  const t = air <= 1 ? 0.5 : (age - stance)/(air - 1);
  return {
    x: lerp(-reach*0.85, reach*0.90, t),
    lift: 1.2 + 1.9*Math.sin(Math.PI*clamp(t, 0.05, 0.95)),
    contact: false, event: 'flight',
  };
}

function idleFoot(limb) {
  const fore = limb[1] === 'F';
  return { x: fore ? 0.30 : -0.30, lift: 0, contact: true, event: 'stance' };
}

/* Head carriage. A hunting wolf runs with its head low and level with the
 * spine. `ears` back survives the pixel grid where a head drop does not:
 * measured, a 0.22 idle drop moves the poll 0.6 px and rounds to the same
 * row, so the front view spends two of four frames on one image. */
const IDLE_HEAD = Object.freeze([
  Object.freeze({ mode: 'alert', drop: 0.00, scan:  0, ears: 0 }),
  Object.freeze({ mode: 'scan',  drop: 0.12, scan:  1, ears: 0 }),
  Object.freeze({ mode: 'ease',  drop: 0.22, scan:  0, ears: 1 }),
  Object.freeze({ mode: 'scan',  drop: 0.12, scan: -1, ears: 0 }),
]);

function wolfPose({ state = 'idle', frame = 0, dir = 2, lead = 1 } = {}) {
  const M = measureWolf();
  const clip = WOLF_CLIPS[state] || WOLF_CLIPS.idle;
  const f = mod(frame, clip.n);
  const asym = state === 'canter' || state === 'sprint';
  const reach = state === 'sprint' ? 2.9 : 2.4;

  const bodySink = state === 'walk' ? [0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5][f]
    : state === 'trot' ? [0, 0.6, 0.2, -0.3, 0, 0.6, 0.2, -0.3][f]
    : state === 'canter' ? [-0.4, 0.35, 0.6, 0.2, -0.4, 0.35, 0.6, 0.2][f]
    : state === 'sprint' ? [-0.8, 0.4, 0.7, 0.3, -0.8, 0.35, 0.65, 0.25][f] : 0;
  /* Sagittal bending. A canid flexes its back further than a cervid at the
   * same speed. */
  const spineFlex = state === 'sprint' ? [1.3, 0.7, 0.1, -0.5, -1.3, -0.6, 0.1, 0.7][f]
    : state === 'canter' ? [0.7, 0.4, 0.0, -0.3, -0.7, -0.3, 0.0, 0.4][f] : 0;

  const headKey = state === 'idle' ? IDLE_HEAD[f % IDLE_HEAD.length]
    : { mode: 'travel', drop: asym ? 0.72 : 0.42, scan: 0, ears: asym ? 1 : 0 };

  const feet = [], legs = [];
  const A = WOLF_ASYM[state];
  for (const limb of LIMBS) {
    /* Changing lead swaps which side the schedule's leading limb falls on, so
     * only the lookup mirrors and the label stays the real limb. Mirroring the
     * label reproduces the same four contacts in a different array order, a
     * no-op (body-deer.js does that). */
    const key = asym && lead < 0
      ? (limb[0] === 'L' ? 'R' : 'L') + limb[1] : limb;
    const side = limb[0] === 'L' ? -1 : 1;
    const kind = limb[1] === 'H' ? 'hind' : 'fore';
    const foot = state === 'idle' ? idleFoot(limb)
      : asym ? asymmetricFoot(key, f, clip.n, A.strike, A.stance, reach)
      : state === 'trot'
        ? symmetricFoot(key, f, WOLF_TROT_STRIKE, WOLF_TROT_GAIT.samples, TROT_STANCE)
        : symmetricFoot(key, f, WOLF_WALK_STRIKE, WALK_N, WALK_STANCE);
    const root0 = M.roots[kind];
    const root = point(root0.x,
      root0.y + bodySink + (kind === 'hind' ? spineFlex*0.26 : -spineFlex*0.14));
    const ground = point(root0.x + foot.x, M.ground - foot.lift);
    /* Digitigrade: the paw sits almost under the ankle. */
    const leg = solveLimb({
      root, foot: ground, lengths: M.segments[kind],
      bendSign: kind === 'hind' ? 1 : -1,
      kick: kind === 'hind' ? 0.42 : -0.20, side,
    });
    feet.push({ ...foot, limb, side, kind, x: ground.x, y: ground.y });
    legs.push({ ...leg, limb, side, kind, near: side < 0, contact: foot.contact });
  }

  const contacts = feet.filter((foot) => foot.contact);
  const support = contacts.length
    ? [Math.min(...contacts.map((f2) => f2.x)), Math.max(...contacts.map((f2) => f2.x))]
    : null;
  const spine = {
    rump: point(M.roots.hind.x - 1.2, M.ground - M.sacrum + bodySink + spineFlex*0.34),
    withers: point(M.roots.fore.x + 0.3, M.ground - M.withers + bodySink - spineFlex*0.22),
  };
  const drop = headKey.drop;
  /* A short thick neck: the poll sits barely above the withers, so the ears
   * crown the animal at its declared alert height. */
  const alertPoll = point(spine.withers.x + 1.9, spine.withers.y - 1.2);
  const lowPoll = point(spine.withers.x + 3.0, spine.withers.y + 1.6);
  const neck = {
    base: point(spine.withers.x + 0.2, spine.withers.y + 0.5),
    poll: point(lerp(alertPoll.x, lowPoll.x, drop), lerp(alertPoll.y, lowPoll.y, drop)),
  };
  /* A long muzzle carried on the neck axis. */
  const muzzleOffset = point(lerp(3.5, 3.9, drop), lerp(1.0, 0.9, drop));
  const head = {
    poll: neck.poll,
    muzzle: point(neck.poll.x + muzzleOffset.x, neck.poll.y + muzzleOffset.y),
    drop, scan: headKey.scan, ears: headKey.ears,
  };
  /* Carried low at rest and streamed straight out at the sprint. */
  const tailLift = state === 'sprint' ? 0.85 : state === 'canter' ? 0.60
    : state === 'trot' ? 0.30 : 0.10;
  const tail = {
    base: point(spine.rump.x - 0.4, spine.rump.y + 0.8),
    tip: point(spine.rump.x - M.brush*0.86,
      spine.rump.y + 0.8 + M.brush*0.42 - tailLift*M.brush*0.66),
  };

  return {
    M, state, frame: f, dir, lead, feet, legs, contacts, support,
    flight: contacts.length === 0,
    bodySink, spineFlex, headMode: headKey.mode, spine, neck, head, tail,
  };
}

export {
  WOLF_CANVAS, WOLF_CANTER_GAIT, WOLF_CLIPS, WOLF_CONTACTS, WOLF_GAITS,
  WOLF_LIFE, WOLF_SLIP, WOLF_SPEED, WOLF_SPRINT_GAIT, WOLF_STATES,
  WOLF_TRAVEL_PX, WOLF_TROT_GAIT, WOLF_WALK_GAIT,
  gaitRateWolf, measureWolf, wolfPose,
};
