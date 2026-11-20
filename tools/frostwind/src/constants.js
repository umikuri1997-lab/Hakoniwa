/* World constants: the streaming grid, the atlas, the wind. Sizes of the
   machinery. Every dimension a player can see comes from scale.js. */

const CH=192;          // chunk edge, world pixels
const PAD=56;          /* Margin baked around a chunk. It exceeds every
                          influence that crosses a border: the drift tail
                          reaches 5.4x a trunk radius, up to 54 px on the
                          largest spruce. At PAD 40 a prop 40 to 54 px outside
                          a chunk is rejected and its tail stops at the shared
                          edge: a measured 25/255 step in runs of 22 to 36
                          rows. 56 is divisible by 8, which keeps the coarse
                          lattices world-aligned. */
const PADW=CH+PAD*2;
const ATLAS_S=300;     // the scale the sprite ladder is built at: a world
                       // constant, so props keep their size when the window
                       // changes
const PATHW=13;        // half-width of the trodden trail
/* The prevailing wind, as an axis. Drifts elongate along it and sastrugi ripple
   across it; the snowfield and the falling snow both answer to it.

   2.4 radians, not 0.62. At 0.62 the downwind direction is (+0.81,+0.58) and
   the cast shadows at the default sun run (+0.79,+0.62): drift tails, sastrugi
   and every shadow are parallel, and the ground reads as corduroy. */
const WIND_A=2.40, WCA=Math.cos(WIND_A), WSA=Math.sin(WIND_A);

/* How long a footprint lasts: thirty seconds. PRINT_HOLD is the share spent
   at full depth before the filling-in starts. PRINT_TICK is a redraw rate,
   not a simulation rate: the depth a print writes is one byte. */
const PRINT_LIFE=30.0;   // seconds from pressed to gone
const PRINT_HOLD=0.35;   // fraction of that at full depth
const PRINT_TICK=0.5;    // seconds between repaints

/* How deep a print of this age still presses, 1 down to 0. A pure function of
   age, kept out of the renderer so test/tracks.test.mjs measures the curve
   without a browser. */
function printStrength(age){
  if(!(age>0)) return 1;
  const t=age/PRINT_LIFE;
  if(t>=1) return 0;
  return t<PRINT_HOLD ? 1 : 1-(t-PRINT_HOLD)/(1-PRINT_HOLD);
}

/* The surface flag quantum. The chunk geometry texture's alpha byte carries a
   ground pixel's SURFACE index as `flag * FLAG_Q`, and the shader recovers it
   with floor(a*255/Q + 0.5).

   8 gives thirty-one surfaces. At 16, ids 16 to 18 pass 255 and wrap: 16*16
   is 256 is 0 is `snow`, and the desert's ground reads as boreal snow.

   The quantum has to survive one round trip. The chunk texture is
   NearestFilter (worldgen.js), so the byte arrives exact. Worst case is the
   float precision of `a`: at mediump, ten mantissa bits near 1.0 is about a
   quarter of a byte, 0.03 of a flag unit against a tolerance of 0.5.

   Every writer and reader takes the number from here. */
const FLAG_Q=8;

export { ATLAS_S, CH, FLAG_Q, PAD, PADW, PATHW, PRINT_HOLD, PRINT_LIFE, PRINT_TICK, WCA, WIND_A, WSA, printStrength };
