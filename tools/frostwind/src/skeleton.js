import { clamp } from './math.js';
import { PX_PER_M } from './scale.js';
import { newSprite } from './sprite.js';

/* ═══════════════════════════════════════════════════════════════════════════
   The projected skeleton. A body stated in metres, drawn by projection.

   A species module states a pose: ellipsoid parts and jointed limbs in the
   body's own frame (u forward, v to its left, z up, the origin on the ground
   under the body). This file projects it and writes the sprite channels. No
   species draws a pixel, so every view of a body is one body: cabinet
   projection (PROJECTION.md) puts a metre of depth on half a metre of screen
   rows, a far limb above the body and a near limb below it.

   Three authored views, as the atlas bakes for animals: 2 profile (heading
   screen-right, the scene mirrors for left), 0 toward the camera, 1 away.

   A pose is `{ parts, limbs, dots }`:
     part  { u, v=0, z, ru, rv, rz, mat, shade, seams?, crest? }
           an ellipsoid. `seams` are dark rows across the body axis, as
           fractions of the half-length. `crest` lights the rows above a
           fraction of the half-height.
     limb  { pts:[[u,v,z],...], mat, near, far, over? }
           a jointed line, one pixel wide. `near`/`far` are its value in front
           of and behind the body; which one is decided by where its end
           projects. Limbs lie under the parts unless `over` is set: a leg
           leaves from under a body, a neck or a feeler lies on it.
     dot   { u, v=0, z, mat, shade }   one pixel: over the parts when it is in
           front of the body, under them when it is behind.

   Owners: quadruped mammals at 20 rows and more keep src/quadruped.js and
   their body modules (measured joint chains, gait from src/gait.js). This rig
   is for bodies whose limbs are one pixel wide at PLAYER_H = 26.
   ═══════════════════════════════════════════════════════════════════════════ */

/* A limb is behind the body when its end is this far up-screen of the body
   axis. Under it, a biped's two feet head-on are level and both are near. */
const FAR_M = 0.05;

/* Body frame to screen. Screen x is world x; depth is toward the camera. */
function projectPoint(dir, canvas, u, v, z) {
  const [x, depth] = dir === 2 ? [u, -v] : dir === 0 ? [v, u] : [-v, -u];
  return { x: canvas.ax + x * PX_PER_M, y: canvas.ay + (depth * 0.5 - z) * PX_PER_M, depth };
}

function drawSkeleton(pose, canvas, dir, kind) {
  const { w: W, h: H } = canvas;
  const sp = newSprite(W, H);
  sp.ax = canvas.ax; sp.ay = canvas.ay;
  const put = (x, y, mat, shade, nx = 0, ny = -0.3) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    sp.occ[i] = mat; sp.shade[i] = clamp(shade, 0, 1); sp.ao[i] = sp.shade[i];
    sp.nx[i] = nx; sp.ny[i] = ny;
    sp.nz[i] = Math.sqrt(Math.max(0.04, 1 - nx * nx - ny * ny));
  };
  const line = (a, b, mat, shade) => {
    const x0 = Math.round(a.x), y0 = Math.round(a.y);
    const x1 = Math.round(b.x), y1 = Math.round(b.y);
    const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++)
      put(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, mat, shade);
  };
  const at = (p) => projectPoint(dir, canvas, p[0], p[1], p[2]);
  const limbs = (pose.limbs || []).map((limb) => {
    const pts = limb.pts.map(at);
    return { ...limb, pts, isFar: pts[pts.length - 1].depth < -FAR_M };
  });
  const drawLimb = (limb) => {
    for (let k = 1; k < limb.pts.length; k++)
      line(limb.pts[k - 1], limb.pts[k], limb.mat, limb.isFar ? limb.far : limb.near);
  };
  /* far before near, so a near limb crosses a far one */
  const under = limbs.filter((q) => !q.over);
  for (const limb of under) if (limb.isFar) drawLimb(limb);
  for (const limb of under) if (!limb.isFar) drawLimb(limb);
  const overFar = limbs.filter((q) => q.over && q.isFar);
  for (const limb of overFar) drawLimb(limb);

  const dots = (pose.dots || []).map((d) => ({ ...d, p: at([d.u, d.v || 0, d.z]) }));
  for (const d of dots) if (d.p.depth < 0) put(d.p.x, d.p.y, d.mat, d.shade);

  /* the parts, far part first */
  const parts = [...(pose.parts || [])].sort((a, b) =>
    at([a.u, a.v || 0, 0]).depth - at([b.u, b.v || 0, 0]).depth);
  for (const part of parts) {
    const c = at([part.u, part.v || 0, part.z]);
    const along = dir === 2 ? part.ru : part.rv;
    const across = dir === 2 ? part.rv : part.ru;
    const rx = Math.max(0.9, along * PX_PER_M);
    const ry = Math.max(0.9, Math.hypot(part.rz, across * 0.5) * PX_PER_M);
    const axis = dir === 2 ? rx : ry;
    for (let y = Math.floor(c.y - ry); y <= Math.ceil(c.y + ry); y++)
      for (let x = Math.floor(c.x - rx); x <= Math.ceil(c.x + rx); x++) {
        const ex = (x - c.x) / rx, ey = (y - c.y) / ry;
        if (ex * ex + ey * ey > 1.0) continue;
        const t = dir === 2 ? ex : ey;
        const seam = (part.seams || []).some((s) => Math.abs(t - s) < 0.5 / axis);
        const crest = part.crest && ey < part.crest.above;
        put(x, y, part.mat, seam ? part.seamShade ?? 0.2
          : crest ? part.crest.shade : part.shade, ex * 0.7, ey * 0.5 - 0.2);
      }
  }
  for (const d of dots) if (d.p.depth >= 0) put(d.p.x, d.p.y, d.mat, d.shade);
  for (const limb of limbs) if (limb.over && !limb.isFar) drawLimb(limb);
  sp.kind = kind;
  return sp;
}

/* Alternating sets: a limb's phase in a cycle of `n` frames. `set` 0 and 1
   are half a cycle apart. Returns the foot's excursion along the heading and
   its lift, as fractions of the species' step and clearance. */
function stepPhase(frame, n, set) {
  const phase = (frame / n + (set ? 0.5 : 0)) * Math.PI * 2;
  return { along: Math.cos(phase), lift: Math.max(0, -Math.sin(phase)) };
}

const frameOf = (frame, n) => ((Math.floor(frame) % n) + n) % n;

/* A pose at `k` times its stated size. A table written at one scale keeps
   the animal's proportions at another. */
function scalePose(pose, k) {
  const at = (p) => p.map((q) => q * k);
  return {
    parts: pose.parts.map((q) => ({ ...q, u: q.u * k, v: (q.v || 0) * k, z: q.z * k,
      ru: q.ru * k, rv: q.rv * k, rz: q.rz * k })),
    limbs: pose.limbs.map((q) => ({ ...q, pts: q.pts.map(at) })),
    dots: pose.dots.map((q) => ({ ...q, u: q.u * k, v: (q.v || 0) * k, z: q.z * k })),
  };
}

export { drawSkeleton, frameOf, scalePose, stepPhase };
