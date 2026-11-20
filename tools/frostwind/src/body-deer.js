import { clamp, lerp } from './math.js';
import { metresToPx } from './scale.js';
import { LIMBS, asymmetricStrikes, contactSchedule, strikeSamples,
         symmetricStrikes } from './gait.js';

/*
 * The first rigged quadruped: a roe-deer body. Continuous landmarks, contacts
 * and clips live here; raster projection lives in figure-deer.js.
 */

/* Wilson & Mittermeier, Handbook of the Mammals of the World; Janiszewski,
 * Gugołek & Hanzal, north-eastern Poland zoometrics. Ranges are species facts;
 * `northBuck` is the one individual this raster resolves. The sacrum target
 * keeps the measured 71.62 / 66.55 high-rump ratio at a northern 0.72 m
 * withers height. Winter coat adds the chest-depth allowance. */
const ROE_DEER_LIFE = Object.freeze({
  species: 'Capreolus capreolus',
  bodyLengthM: Object.freeze([1.07, 1.27]),
  shoulderM: Object.freeze([0.65, 0.84]),
  measuredBuck: Object.freeze({
    withersM: 0.6655,
    sacrumM: 0.7162,
    trunkM: 0.8321,
    chestDepthM: 0.2232,
    chestWidthM: 0.1970,
  }),
  skullM: Object.freeze([0.191, 0.212]),
  earM: Object.freeze([0.12, 0.14]),
  antlerM: Object.freeze([0.184, 0.258]),
  provisionalBonesM: Object.freeze({
    femur: 0.205,
    metacarpus: 0.1579,
    metatarsus: 0.1942,
  }),
  northBuck: Object.freeze({
    bodyLengthM: 1.18,
    withersM: 0.72,
    sacrumM: 0.72 * (0.7162 / 0.6655),
    chestDepthM: 0.245,
    skullM: 0.20,
    earM: 0.13,
    velvetM: 0.20,
  }),
});

const DEER_CANVAS = Object.freeze({ w: 27, h: 23 });
const DEER_SPEED = Object.freeze({ walk: 34, gallop: 104 });
/* Per-cycle body travel is the rig's readable excursion, not a life claim.
 * SLIP is the declared medium concession that converts it to play speed. */
const DEER_TRAVEL_PX = Object.freeze({ walk: 10, gallop: 18 });
const DEER_SLIP = 2.40;

/* The two footfall patterns, as points on Hildebrand's diagram. src/gait.js
 * owns the law; these are this animal's coordinates on it.
 *
 * Duty 0.75 with the forefoot a quarter cycle behind the ipsilateral hind is a
 * lateral-sequence single-foot walk (docs/LIFE.md). Duty 0.25 in couplets an
 * eighth apart, half a cycle between the girdles, first fore contralateral to
 * the first hind, is a rotary gallop, the classification Biancardi & Minetti
 * give the species.
 *
 * The values are the medium-authored eight-key sampling docs/LIFE.md
 * declares, not roe-deer field timings. `offset` opens the gallop clip on
 * gathered flight. */
const DEER_WALK_GAIT = Object.freeze({ samples: 8, duty: 0.75, lag: 0.25 });
const DEER_GALLOP_GAIT = Object.freeze({
  samples: 8, duty: 0.25, firstHind: 'RH', couplets: 'rotary',
  hindLag: 0.125, foreLag: 0.125, girdleGap: 0.5, offset: 0.125,
});

const gaitRateDeer = (state, speed = DEER_SPEED[state]) =>
  DEER_WALK_GAIT.samples * speed / (DEER_TRAVEL_PX[state] * DEER_SLIP);
const DEER_CLIPS = Object.freeze({
  /* One slow cycle reads as behavior: alert, lower, feed, raise. */
  idle: Object.freeze({ n: 8, rate: 0.82 }),
  walk: Object.freeze({ n: DEER_WALK_GAIT.samples, rate: gaitRateDeer('walk') }),
  gallop: Object.freeze({ n: DEER_GALLOP_GAIT.samples, rate: gaitRateDeer('gallop') }),
});
const DEER_STATES = Object.freeze(Object.fromEntries(
  Object.entries(DEER_CLIPS).map(([state, clip]) => [state, clip.n]),
));

const WALK_N = DEER_WALK_GAIT.samples;
const WALK_STANCE = Math.round(DEER_WALK_GAIT.duty * WALK_N);
const WALK_TOE = WALK_STANCE - 1;
const WALK_STRIKE = strikeSamples(symmetricStrikes(DEER_WALK_GAIT.lag), WALK_N);
/* Mirroring in deerPose supplies the other lead. */
const GALLOP_CONTACTS = contactSchedule({
  samples: DEER_GALLOP_GAIT.samples, duty: DEER_GALLOP_GAIT.duty,
  strikes: asymmetricStrikes(DEER_GALLOP_GAIT),
});

const mod = (v, n) => ((v % n) + n) % n;
const point = (x, y) => ({ x, y });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function measureDeer() {
  const L = ROE_DEER_LIFE.northBuck;
  const bodyLength = metresToPx(L.bodyLengthM);
  const withers = metresToPx(L.withersM);
  const sacrum = metresToPx(L.sacrumM);
  const chestDepth = metresToPx(L.chestDepthM);
  const skull = metresToPx(L.skullM);
  const ear = metresToPx(L.earM);
  const velvet = metresToPx(L.velvetM);
  const ground = DEER_CANVAS.h - 1;

  /* Humerus, radius and tibia are unmeasured. These segment lengths are a
   * raster prior constrained by the measured standing height and the measured
   * long metapodials. */
  const segments = Object.freeze({
    fore: Object.freeze([3.6, 3.8, 4.0]),
    hind: Object.freeze([3.5, 4.0, 4.2]),
  });
  return Object.freeze({
    bodyLength, withers, sacrum, chestDepth, skull, ear, velvet, ground,
    /* Medium concessions. The winter pelt gains one row of mass and velvet
     * gains two rows so neither disappears after palette quantisation. */
    silhouetteLength: bodyLength + 2,
    coatDepth: chestDepth + 1,
    antlerSilhouette: velvet + 2,
    alertHeight: 22,
    canvas: DEER_CANVAS,
    segments,
    roots: Object.freeze({
      hind: Object.freeze({ x: -5.5, y: ground - sacrum + 2.2 }),
      fore: Object.freeze({ x: 5.0, y: ground - withers + 1.8 }),
    }),
    stance: 2.0,
  });
}

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

function solveLeg(root, hoof, lengths, kind, side) {
  const [upper, lower, distal] = lengths;
  /* The hock is kicked back; the carpus is nearly over the hoof. The small
   * side term keeps paired limbs apart before the raster decides near/far
   * ordering. */
  const kick = kind === 'hind' ? 1.15 : -0.35;
  const lateral = kick + side*0.08;
  const ankle = point(hoof.x + lateral, hoof.y - Math.sqrt(distal*distal-lateral*lateral));
  const solved = twoBone(root, ankle, upper, lower, kind === 'hind' ? 1 : -1);
  return {
    root,
    joint: solved.joint,
    ankle: solved.target,
    hoof,
    lengths,
    reachError: solved.reachError,
    segmentError: Math.max(
      Math.abs(distance(root, solved.joint) - upper),
      Math.abs(distance(solved.joint, solved.target) - lower),
      Math.abs(distance(solved.target, hoof) - distal),
    ),
  };
}

/* The schedule is Hildebrand's; the excursion is the rig's. A planted hoof
 * sweeps 2.20 px each side of its root and the two swing keys are authored. */
function walkFoot(limb, frame) {
  const age = mod(frame - WALK_STRIKE[limb], WALK_N);
  if (age < WALK_STANCE) {
    return {
      x: lerp(2.20, -2.20, age / WALK_TOE),
      lift: 0,
      contact: true,
      event: age === 0 ? 'strike' : age === WALK_TOE ? 'toe' : 'stance',
    };
  }
  return age === WALK_STANCE
    ? { x: -0.45, lift: 2.0, contact: false, event: 'swing' }
    : { x: 1.35, lift: 1.0, contact: false, event: 'swing' };
}

const GALLOP_X = Object.freeze({
  LH: Object.freeze([ 1.6, 1.8, 2.1, 0.2,-2.7,-1.6,-0.5, 0.7]),
  LF: Object.freeze([-1.7,-1.0,-0.3, 0.8, 2.8, 2.1, 0.2,-1.0]),
  RH: Object.freeze([ 1.2, 2.2, 0.4,-1.2,-2.5,-1.1, 0.1, 0.8]),
  RF: Object.freeze([-1.4,-0.8, 0.0, 1.1, 2.5, 1.4, 2.1, 0.0]),
});
const GALLOP_LIFT = Object.freeze({
  LH: Object.freeze([2.5,1.0,0.0,0.0,2.0,2.8,2.0,1.2]),
  LF: Object.freeze([2.2,2.8,2.2,1.4,2.0,0.0,0.0,1.0]),
  RH: Object.freeze([2.2,0.0,0.0,1.0,2.0,2.7,2.2,1.2]),
  RF: Object.freeze([2.4,2.8,2.0,1.2,2.0,1.0,0.0,0.0]),
});

function gallopFoot(limb, frame) {
  const contacts = GALLOP_CONTACTS[frame];
  return {
    x: GALLOP_X[limb][frame],
    lift: GALLOP_LIFT[limb][frame],
    contact: contacts.includes(limb),
    event: contacts.includes(limb) ? 'contact' : 'flight',
  };
}

function idleFoot(limb) {
  const fore = limb[1] === 'F';
  return { x: fore ? 0.25 : -0.25, lift: 0, contact: true, event: 'stance' };
}

function deerPose({ state = 'idle', frame = 0, dir = 2, lead = 1 } = {}) {
  const M = measureDeer();
  const clip = DEER_CLIPS[state] || DEER_CLIPS.idle;
  const f = mod(frame, clip.n);
  const gallop = state === 'gallop';
  const walk = state === 'walk';
  const bodySink = walk ? [0,0.55,0,0.55,0,0.55,0,0.55][f]
    : gallop ? [0,-0.65,0,0.45,-0.7,-0.25,0,0.35][f] : 0;
  const spineFlex = gallop ? [1.0,0.6,0.2,-0.2,-1.0,-0.5,0.0,0.5][f] : 0;
  const idleHead = [
    {mode:'alert', drop:0.00, listen: 0, chew: 0},
    {mode:'listen',drop:0.00, listen: 1, chew: 0},
    {mode:'lower', drop:0.35, listen: 0, chew: 0},
    {mode:'lower', drop:0.72, listen: 0, chew: 0},
    {mode:'browse',drop:1.00, listen: 0, chew:-1},
    {mode:'browse',drop:1.00, listen:-1, chew: 1},
    {mode:'raise', drop:0.65, listen: 0, chew: 0},
    {mode:'raise', drop:0.25, listen: 0, chew: 0},
  ];
  const headKey = state === 'idle'
    ? idleHead[f]
    : {mode:'travel',drop:0,listen:0,chew:0};
  const headMode = headKey.mode;
  const feet = [];
  const legs = [];

  for (let i = 0; i < LIMBS.length; i++) {
    let limb = LIMBS[i];
    if (gallop && lead < 0) {
      limb = limb[0] === 'L' ? `R${limb[1]}` : `L${limb[1]}`;
    }
    const side = limb[0] === 'L' ? -1 : 1;
    const kind = limb[1] === 'H' ? 'hind' : 'fore';
    const foot = walk ? walkFoot(limb, f) : gallop ? gallopFoot(limb, f) : idleFoot(limb);
    const root0 = M.roots[kind];
    const root = point(root0.x, root0.y + bodySink + (kind === 'hind' ? spineFlex*0.22 : -spineFlex*0.12));
    const hoof = point(root0.x + foot.x, M.ground - foot.lift);
    const leg = solveLeg(root, hoof, M.segments[kind], kind, side);
    feet.push({ ...foot, limb, side, kind, x: hoof.x, y: hoof.y });
    legs.push({ ...leg, limb, side, kind, near: side < 0, contact:foot.contact });
  }

  const contacts = feet.filter((foot) => foot.contact);
  const support = contacts.length
    ? [Math.min(...contacts.map((foot) => foot.x)), Math.max(...contacts.map((foot) => foot.x))]
    : null;
  const spine = {
    rump: point(M.roots.hind.x - 1.0, M.ground - M.sacrum + bodySink + spineFlex*0.30),
    withers: point(M.roots.fore.x + 0.2, M.ground - M.withers + bodySink - spineFlex*0.20),
  };
  const drop = headKey.drop;
  const alertPoll = point(spine.withers.x + 2.1, spine.withers.y - 4.3);
  const browsePoll = point(spine.withers.x + 3.4, spine.withers.y + 6.0);
  const neck = {
    base: point(spine.withers.x + 0.2, spine.withers.y + 0.6),
    poll: point(lerp(alertPoll.x,browsePoll.x,drop),lerp(alertPoll.y,browsePoll.y,drop)),
  };
  const muzzleOffset = point(lerp(3.6,3.1,drop),lerp(0.8,1.6,drop));
  const head = {
    poll: neck.poll,
    muzzle: point(neck.poll.x+muzzleOffset.x,neck.poll.y+muzzleOffset.y+headKey.chew*0.18),
    drop,
    listen: headKey.listen,
    chew: headKey.chew,
  };

  return {
    M, state, frame: f, dir, lead, feet, legs, contacts, support,
    flight: contacts.length === 0,
    bodySink, spineFlex, headMode, spine, neck, head,
  };
}

export {
  DEER_CANVAS, DEER_CLIPS, DEER_GALLOP_GAIT, DEER_SLIP, DEER_SPEED, DEER_STATES,
  DEER_TRAVEL_PX, DEER_WALK_GAIT, GALLOP_CONTACTS, LIMBS, ROE_DEER_LIFE,
  WALK_STRIKE, deerPose, gaitRateDeer, measureDeer,
};
