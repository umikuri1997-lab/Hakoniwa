/* INVARIANT: scale.js is the single authority for physical, traveller and projected dimensions. */

/* A standing traveller, in world pixels. Every other size in the project is a
   multiple of this one. */
const PLAYER_H = 26;

/* What that traveller is, in metres: the statement that lets a pixel count be
   checked against the real world. */
const HUMAN_M = 1.70;

const M_PER_PX = HUMAN_M / PLAYER_H;          // 0.0654 m
const PX_PER_M = PLAYER_H / HUMAN_M;          // 15.29 px

/* traveller-units → world pixels */
const tr = (u) => Math.round(PLAYER_H * u);

/* The same, forced even. Half of every box depth is halved again by the
   cabinet projection, and an odd depth puts an edge on a half-pixel. */
const trEven = (u) => 2 * Math.round((PLAYER_H * u) / 2);

const metresToPx = (m) => Math.round(m * PX_PER_M);
const pxToMetres = (p) => p * M_PER_PX;
const pxToTr = (p) => p / PLAYER_H;

/* The specification: what the numbers ought to be, kept apart from the code
   that produces them so the two can be compared. */

/* Every resolution the UI offers. A dimension must be correct at all of
   them. */
const SUPPORTED_RESOLUTIONS = [
  [320, 180], [426, 240], [480, 270], [640, 360], [768, 432], [960, 540],
];

const HUMAN_D_M = 0.24;

/* the metres of apparent height an object of this real height and depth has,
   under a projection that foreshortens the ground by one half */
const projectedM = ({ h, d }) => h + d / 2;

/* rows per projected metre, taken from the figure, so every drawn object is
   measured against the body */
const ROWS_PER_PROJ_M = PLAYER_H / projectedM({ h: HUMAN_M, d: HUMAN_D_M });

/* SOURCE: log course is a physical carpentry size before projection. The
   lakehouse's drawn trunks are quoted against it. */
const LOG_COURSE_M = 0.27;

/* SOURCE: circulation clearance follows Merrell et al., “Interactive Furniture
   Layout Using Interior Design Guidelines.” The lakehouse deck is the width
   two people pass on. */
const PERSON_DISK_M = 0.457;
const CORRIDOR_M = 2 * PERSON_DISK_M;

/* WHY: TILE_PX names a clearance/grid measure without introducing a tile-map authority. */
const TILE_PX = trEven(0.5);

/* measurement helpers, for the tests */

/* What a box of this depth adds to its own apparent height. The cabinet
   projection draws the top face foreshortened by one half, and those rows
   read as height on screen. The traveller is a flat elevation and gets no
   such term: hence HUMAN_D_M. */
const obliqueRows = (depthPx) => depthPx >> 1;

/* What that same depth costs a building in columns. The world's depth axis
   draws straight up the screen, so a wall that faces the camera has a side
   face zero pixels wide. A building carries its own depth axis up and to the
   right, halved on both screen axes (cabinet oblique). Equal rows and columns
   put the receding edge on a 1:1 step, never the ragged stairs PROJECTION.md
   refuses.

   docs/CANON.md names the concession: a building's ground rectangle draws as
   a parallelogram sheared this many columns right of world truth, and its
   collider follows the drawing. */
const obliqueCols = (depthPx) => depthPx >> 1;

/* INVARIANT: projected rows-per-metre compare boxes against the flat figure under cabinet projection. */
function projectedRate(spriteRows, life) {
  return spriteRows / projectedM(life);
}

export {
  PLAYER_H, HUMAN_M, HUMAN_D_M, M_PER_PX, PX_PER_M, ROWS_PER_PROJ_M,
  tr, trEven, metresToPx, pxToMetres, pxToTr,
  SUPPORTED_RESOLUTIONS, obliqueCols, obliqueRows, projectedM, projectedRate,
  LOG_COURSE_M, CORRIDOR_M, TILE_PX,
};
