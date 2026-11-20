import { M_PER_PX, PX_PER_M } from './scale.js';
import { smoothstep } from './math.js';

/* The cross-section of a water body. A water body is drawn from its depth,
   and its depth comes from its section. Two sections, two geological claims:

   - `reposeDepth`: loose or cohesive material stands at an angle over a flat
     floor. A dug wallow, a stream bank, a pond margin.
   - `karstDepth`: limestone dissolves along joints, so a solution basin is a
     plateau with a wall around it and no graded bank. docs/CANON.md.

   A cosine bowl reaches zero slope at both centre and rim, so its shore is
   its flattest part. Measured: a bowl gives the swamp's backwaters 28 px of
   wade-depth margin in x and 42 rows in y, and the meadow's cone runs its
   four-rung ramp across 43 px. Neumann's volume development
   D_V = 3*z_mean/z_max: those lakes measure 1.16-1.27 against a cone's 1.0,
   and real lakes are flat-floored above it. */

/* SOURCE: peat and saturated organic banks stand at 30-42 degrees. The band is
   the authority; a bank with no reason to sit at either end takes the mid-band
   value. test/swamp-lakehouse.test.mjs asserts that a dissolved wall is
   outside this band. */
const PEAT_REPOSE_DEG = [30, 42];
const PEAT_REPOSE = 36 * Math.PI / 180;

/* The share of a solution basin's radius its wall occupies. At the swamp's
   backwater radii (98-116 px) this is a 23-27 px wall carrying 1.8 m, a
   gradient past 60 degrees: rock, not repose. Only its outer 28% is above
   wade depth, so the pale margin is 6-8 px. */
const KARST_WALL = 0.23;

/* One screen row is two ground pixels along the depth axis (`obliqueRows` in
   scale.js halves world depth). A shore distance in screen pixels is not a
   ground distance: converted with PX_PER_M it draws the near and far banks at
   half their angle. PROJECTION.md. */
const GROUND_PX_PER_ROW = 2;

/* Depth under a bank standing at `repose`, onto a flat floor at `floorM`.
   `runPx` is a ground distance from the waterline; negative means dry. */
function reposeDepth(runPx, floorM, repose = PEAT_REPOSE) {
  if (runPx <= 0) return 0;
  return Math.min(floorM, runPx * M_PER_PX * Math.tan(repose));
}

/* Width of that bank in ground pixels: what a channel spends on each side
   before it has any flat floor. */
function reposeRunPx(floorM, repose = PEAT_REPOSE) {
  return (floorM / Math.tan(repose)) * PX_PER_M;
}

/* The fraction of its floor depth a solution basin carries at normalised
   radius `q`: flat inside, then a wall across the last `wall` of the radius.
   Unit-free: the swamp lakehouse states its floor as a field signal and the
   biome states its floor in metres. */
function karstProfile(q, wall = KARST_WALL) {
  return 1 - smoothstep(1 - wall, 1, q);
}

function karstDepth(q, floorM, wall = KARST_WALL) {
  return floorM * karstProfile(q, wall);
}

/* Two holes that touch are one hole. The deeper of two basin metrics unions
   them as sets: a figure of eight with a notch at the waist and a hard crease
   along the seam. The ground between two hollows is a saddle.

   `basinUnion` is the standard soft minimum. It is exact outside the blend
   width: when the two metrics differ by `k` or more it returns the nearer one
   unchanged. Within `k` the two pull the ground down between them by at most
   `k/4`.

   `k` is in metric units (fractions of a radius), so the merge is the same
   fraction of a pond at any size. */
const MERGE_Q = 0.35;

function basinUnion(a, b, k = MERGE_Q) {
  const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

/* A `lobe` is the outline of every body of standing water, from a five-metre
   wallow to a compiled sinkhole. A field of ellipses stamped from one radius
   reads as stamps.

   · Two ground semi-axes and an orientation. Ground, not screen: under
     PROJECTION.md's k = ½ one screen row is two ground pixels, so a hollow
     round on the ground is a 2:1 ellipse on the screen, and `r, r` authored
     on the screen is a 1:2 slot on the ground.
   · Low-order radial harmonics, `1 + Σ aₙ·cos(nθ + φₙ)` for n = 1..3: the
     first makes one end broader, the second breaks the two-fold symmetry,
     the third gives the three-lobed plan of a hollow eroded along three
     joints. With Σ|aₙ| < 1 the radius stays positive, so the curve stays
     simple and star-shaped.
   · No trigonometry at sample time. Each harmonic is stored as the
     rectangular pair `A·cos nθ + B·sin nθ` and evaluated from the unit
     direction by the Chebyshev recurrences: this runs for every pixel of
     every chunk. */
function lobe(groundA, groundB, rot, harmonics = []) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const h = [0, 0, 0, 0, 0, 0];
  let sum = 0;
  for (let n = 0; n < harmonics.length && n < 3; n++) {
    const [amp, phase] = harmonics[n];
    h[n * 2] = amp * Math.cos(phase);
    h[n * 2 + 1] = -amp * Math.sin(phase);
    sum += Math.abs(amp);
  }
  if (sum >= 1) throw new Error(`lobe harmonics sum to ${sum}; the radius can reach zero`);
  /* the bound for a keep-out or an exclusion box: the widest this outline can
     be on each screen axis, at any orientation */
  const reach = 1 + sum;
  return {
    a: groundA, b: groundB, c, s, h,
    rx: Math.max(groundA, groundB) * reach,
    ry: Math.max(groundA, groundB) * reach / GROUND_PX_PER_ROW,
  };
}

/* `dx` is a screen-x offset from the centre and `dy` a screen-row offset.
   Returns the normalised radius: 1 on the shoreline, 0 at the centre. */
function lobeMetric(dx, dy, L) {
  const gy = dy * GROUND_PX_PER_ROW;
  const ux = (dx * L.c + gy * L.s) / L.a, uy = (gy * L.c - dx * L.s) / L.b;
  const r = Math.hypot(ux, uy);
  if (r < 1e-9) return 0;
  const c1 = ux / r, s1 = uy / r;
  const c2 = c1 * c1 - s1 * s1, s2 = 2 * c1 * s1;
  const c3 = c2 * c1 - s2 * s1, s3 = s2 * c1 + c2 * s1;
  const g = 1 + L.h[0] * c1 + L.h[1] * s1 + L.h[2] * c2 + L.h[3] * s2
            + L.h[4] * c3 + L.h[5] * s3;
  return r / g;
}

/* How far inside its shoreline a point is, in ground pixels: what a bank at
   an angle of repose needs. Radial, not perpendicular: exact for the ellipse,
   close for the harmonics. `wander` displaces the shoreline in metric units. */
function lobeRun(dx, dy, L, wander = 0) {
  const m = lobeMetric(dx, dy, L);
  if (m <= 1e-6) return Infinity;
  return (1 - m - wander) * (Math.hypot(dx, dy * GROUND_PX_PER_ROW) / m);
}

export {
  GROUND_PX_PER_ROW, KARST_WALL, MERGE_Q, PEAT_REPOSE, PEAT_REPOSE_DEG,
  basinUnion, karstDepth, karstProfile, lobe, lobeMetric, lobeRun,
  reposeDepth, reposeRunPx,
};
