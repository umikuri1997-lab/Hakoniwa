/* The gait diagram: which feet are down, on which sample.

   Source: Milton Hildebrand, "Symmetrical gaits of horses", Science
   150:701-708 (1965), and "Analysis of asymmetrical gaits", Journal of
   Mammalogy 58:131-156 (1977). Two numbers place every symmetrical quadruped
   gait: the duty factor, the fraction of a cycle a foot is planted, and the
   lag by which a forefoot strike follows the ipsilateral hindfoot's.
   Asymmetrical gaits add three: the lag inside each couplet, and the gap
   between the girdles.

   Authority: Hildebrand owns the contact schedule only. Where a foot sits
   along the body, how high it lifts, how the spine flexes and how fast the
   clip plays stay in the species body module. The classification is the
   input, and the contact and strike tables are derived from it. */

/* Hind and fore, left and right. Every caller reads this order. */
const LIMBS = Object.freeze(['LH', 'LF', 'RH', 'RF']);

const mod1 = (v) => ((v % 1) + 1) % 1;
const near = (a, b) => Math.abs(a - b) < 1e-9;

/* Symmetrical: the two feet of one girdle are half a cycle apart, so a single
   lag places both forefeet once the hindfeet are fixed. */
function symmetricStrikes(lag) {
  return Object.freeze({
    LH: 0, LF: mod1(lag),
    RH: 0.5, RF: mod1(0.5 + lag),
  });
}

/* Hildebrand's names for positions on the lag axis. A name is derived from
   the number and is never an input. */
function sequenceName(lag) {
  const d = mod1(lag);
  if (near(d, 0)) return 'pace';
  if (near(d, 0.5)) return 'trot';
  return d < 0.5 ? 'lateral-sequence' : 'diagonal-sequence';
}

/* Evenly spaced footfalls, so one foot swings at a time. */
const isSingleFoot = (lag) => near(mod1(lag), 0.25) || near(mod1(lag), 0.75);

/* Asymmetrical: the feet of a girdle land as a couplet, so each couplet
   carries its own lag and the two girdles carry a gap.

   Rotary puts the first forefoot on the side opposite the first hind, so the
   four footfalls travel around the body. Transverse keeps the same side order
   in both girdles. A cervid gallop is rotary and must not become a canid
   default.

   `offset` is the phase the first hind lands at. It picks the sample the clip
   opens on: a presentation choice, not a gait fact. */
function asymmetricStrikes({ firstHind = 'RH', hindLag, foreLag, girdleGap,
                             couplets = 'rotary', offset = 0 }) {
  const side = firstHind[0];
  const other = side === 'R' ? 'L' : 'R';
  const secondHind = other + 'H';
  const firstFore = (couplets === 'rotary' ? other : side) + 'F';
  const secondFore = firstFore === 'LF' ? 'RF' : 'LF';
  return Object.freeze({
    [firstHind]: mod1(offset),
    [secondHind]: mod1(offset + hindLag),
    [firstFore]: mod1(offset + girdleGap),
    [secondFore]: mod1(offset + girdleGap + foreLag),
  });
}

/* Which limbs are planted at each sampled phase. A foot is down for `duty` of
   a cycle from its strike. */
function contactSchedule({ samples, duty, strikes }) {
  const out = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples, down = [];
    for (const limb of LIMBS)
      if (mod1(t - strikes[limb]) < duty - 1e-9) down.push(limb);
    out.push(Object.freeze(down));
  }
  return Object.freeze(out);
}

/* Strike phases as sample indices, for a rig that indexes its keys by frame.
   Throws when a strike does not land on a sample; never rounds. */
function strikeSamples(strikes, samples) {
  const out = {};
  for (const limb of LIMBS) {
    const exact = strikes[limb] * samples;
    const index = Math.round(exact);
    if (!near(exact, index))
      throw new Error(`${limb} strikes at phase ${strikes[limb]}, which is `
        + `sample ${exact.toFixed(4)} of ${samples} and not a whole key`);
    out[limb] = index % samples;
  }
  return Object.freeze(out);
}

/* Support count per sample. Only an asymmetrical gait may reach zero, and
   that sample is flight. */
const supportCount = (schedule) => Object.freeze(schedule.map((c) => c.length));

export {
  LIMBS, asymmetricStrikes, contactSchedule, isSingleFoot, sequenceName,
  strikeSamples, supportCount, symmetricStrikes,
};
