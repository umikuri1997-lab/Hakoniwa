import { WOLF_CANVAS, WOLF_STATES, wolfPose } from './body-wolf.js';
import { clamp, lerp } from './math.js';
import { newSprite } from './sprite.js';

/*
 * The pose owns anatomy and contact. This file owns the pixel concessions:
 * one-pixel limbs with a single joint break, far-side value separation, a
 * two-row brush, and the pale throat and muzzle bar.
 *
 * It shares no passes with figure-deer.js. The two share a solver and a
 * contact schedule only.
 */

const MAT_BODY = 4;
const MAT_PALE = 2;

function wolfContext(rnd, frame, dir, state) {
  const pose = wolfPose({ frame, dir, state });
  const sp = newSprite(WOLF_CANVAS.w, WOLF_CANVAS.h);
  sp.ax = WOLF_CANVAS.w >> 1;
  sp.ay = pose.M.ground;
  sp.ramp = 'trunk';
  sp.sMin = 0.05;
  sp.sMax = 0.78;
  sp.kind = 'wolf';
  sp.tilt = 0;

  const put = (x, y, mat = MAT_BODY, form = 0.58, nx = 0, ny = 0) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= sp.w || y >= sp.h) return;
    const i = y*sp.w + x;
    const nn = Math.hypot(nx, ny);
    if (nn > 0.96) { nx *= 0.96/nn; ny *= 0.96/nn; }
    sp.occ[i] = mat;
    sp.shade[i] = clamp(form, 0, 1);
    sp.ao[i] = clamp(form, 0, 1);
    sp.nx[i] = nx;
    sp.ny[i] = ny;
    sp.nz[i] = Math.sqrt(Math.max(0.04, 1 - nx*nx - ny*ny));
  };
  return { rnd, frame, dir, state, pose, sp, cx: sp.ax, put };
}

function stamp(R, x, y, width, form, far = false, mat = MAT_BODY) {
  const n = Math.max(1, Math.round(width));
  const x0 = Math.round(x - (n - 1)*0.5);
  for (let k = 0; k < n; k++) {
    const nx = n === 1 ? 0 : lerp(-0.58, 0.58, k/(n - 1));
    R.put(x0 + k, y, mat, far ? form*0.66 : form, nx, 0);
  }
}

function line(R, a, b, width, form, far = false, mat = MAT_BODY) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))));
  for (let k = 0; k <= steps; k++) {
    const t = k/steps;
    stamp(R, lerp(a.x, b.x, t), lerp(a.y, b.y, t), width, form, far, mat);
  }
}

/* One pixel of joint break, as the deer's legs take. */
function projectLeg(R, leg) {
  const toCanvas = (p) => ({ x: R.cx + p.x, y: p.y });
  const straighten = (root, foot, inward) => {
    root = { x: Math.round(root.x), y: Math.round(root.y) };
    foot = { x: Math.round(foot.x), y: Math.round(foot.y) };
    const at = (t, bend) => ({
      x: Math.round(lerp(root.x, foot.x, t)) + bend,
      y: Math.round(lerp(root.y, foot.y, t)),
    });
    return { root, joint: at(0.42, inward), ankle: at(0.78, 0), foot };
  };
  if (R.dir === 2) {
    const sideOffset = leg.near ? 0 : -1;
    const root = toCanvas(leg.root), foot = toCanvas(leg.foot);
    root.x += sideOffset; foot.x += sideOffset;
    return straighten(root, foot, leg.kind === 'hind' ? 1 : -1);
  }
  /* Medium floor. A wolf single-tracks, but at 2.0 against 1.5 the fore and
     hind round to the same column and the away view of the walk rasters
     frames 4 and 6 identically. One whole pixel of separation survives
     rounding. */
  const lateral = leg.side*(leg.kind === 'fore' ? 2.2 : 1.2);
  const project = (p) => ({
    x: R.cx + lateral + (p.x - leg.root.x)*0.16,
    y: p.y + (p.x - leg.root.x)*0.35 + (leg.kind === 'hind' ? -0.20 : 0.15),
  });
  return straighten(project(leg.root), project(leg.foot), -leg.side);
}

function legPass(R, near) {
  for (const leg of R.pose.legs.filter((l) => l.near === near)) {
    const P = projectLeg(R, leg);
    const far = !near;
    line(R, P.root, P.joint, 1, 0.56, far);
    line(R, P.joint, P.ankle, 1, 0.48, far);
    line(R, P.ankle, P.foot, 1, 0.42, far);
    /* the paw: two pixels in profile, one elsewhere */
    R.put(P.foot.x, P.foot.y, MAT_BODY, far ? 0.10 : 0.16, 0, 0);
    if (R.dir === 2) R.put(P.foot.x + 1, P.foot.y, MAT_BODY, far ? 0.09 : 0.14, 0.3, 0);
  }
}

function profileBodyPass(R) {
  const { pose, cx } = R;
  const x0 = pose.spine.rump.x - 1.2, x1 = pose.spine.withers.x + 1.2;
  for (let x = Math.ceil(x0); x <= Math.floor(x1); x++) {
    const t = clamp((x - x0)/Math.max(1, x1 - x0), 0, 1);
    const top = lerp(pose.spine.rump.y, pose.spine.withers.y, t);
    const round = Math.abs(t - 0.5)*2;
    /* The chest is deepest just behind the shoulder. */
    const depth = pose.M.coatDepth - (round > 0.86 ? 1 : 0) + (t > 0.62 && t < 0.9 ? 1 : 0);
    for (let y = Math.round(top); y <= Math.round(top + depth); y++) {
      const q = (y - top)/Math.max(1, depth);
      const nx = clamp((t - 0.5)*1.40, -0.82, 0.82);
      R.put(cx + x, y, MAT_BODY, 0.68 - 0.14*Math.abs(q - 0.42), nx, (q - 0.5)*0.25);
    }
  }
  /* A pale belly line: the wolf's countershading. */
  for (let x = Math.ceil(x0) + 2; x <= Math.floor(x1) - 3; x++) {
    const t = clamp((x - x0)/Math.max(1, x1 - x0), 0, 1);
    const top = lerp(pose.spine.rump.y, pose.spine.withers.y, t);
    const depth = pose.M.coatDepth + (t > 0.62 && t < 0.9 ? 1 : 0);
    R.put(cx + x, Math.round(top + depth), MAT_PALE, 0.74, 0, 0.30);
  }
}

function endBodyPass(R) {
  const front = R.dir === 0;
  const top = Math.round(front ? R.pose.spine.withers.y : R.pose.spine.rump.y);
  const depth = R.pose.M.coatDepth + 1;
  for (let y = top; y <= top + depth; y++) {
    const t = (y - top)/depth;
    const hw = front ? lerp(2.6, 3.2, t) : lerp(3.0, 2.4, t);
    for (let x = Math.ceil(-hw); x <= Math.floor(hw); x++) {
      const nx = clamp(x/Math.max(1, hw), -0.82, 0.82);
      R.put(R.cx + x, y, MAT_BODY, 0.66 - 0.13*Math.abs(nx), nx, (t - 0.5)*0.22);
    }
  }
  if (front) R.put(R.cx, top + depth, MAT_PALE, 0.72, 0, 0.28);
}

const bodyPass = (R) => (R.dir === 2 ? profileBodyPass(R) : endBodyPass(R));

function headBasis(pose) {
  const dx = pose.head.muzzle.x - pose.neck.poll.x;
  const dy = pose.head.muzzle.y - pose.neck.poll.y;
  const n = Math.max(1e-6, Math.hypot(dx, dy));
  const along = { x: dx/n, y: dy/n };
  return { along, up: { x: along.y, y: -along.x } };
}

function neckAndHeadPass(R) {
  const { pose, cx, dir } = R;
  if (dir === 2) {
    const base = { x: cx + pose.neck.base.x, y: pose.neck.base.y };
    const poll = { x: cx + pose.neck.poll.x, y: pose.neck.poll.y };
    const muzzle = { x: cx + pose.head.muzzle.x, y: pose.head.muzzle.y };
    const { along, up } = headBasis(pose);
    /* A four-row ruff carries into a three-row skull. */
    line(R, base, poll, 4, 0.64, false);
    line(R, poll, muzzle, 3, 0.60, false);
    const brow = { x: lerp(poll.x, muzzle.x, 0.38), y: lerp(poll.y, muzzle.y, 0.38) };
    R.put(brow.x + up.x, brow.y + up.y, MAT_BODY, 0.09, 0.14, -0.28);   // eye
    R.put(brow.x - up.x, brow.y - up.y, MAT_PALE, 0.70, 0.08, 0.20);    // cheek bar
    /* The muzzle's last pixel is the darkest thing on the head. */
    R.put(muzzle.x, muzzle.y, MAT_BODY, 0.12, 0.72, 0);
    R.put(muzzle.x + along.x, muzzle.y + along.y, MAT_BODY, 0.07, 0.80, 0);
    R.put(muzzle.x - up.x*0.9, muzzle.y - up.y*0.9, MAT_PALE, 0.76, 0.3, 0.2);
    /* Short erect triangular ears. Laid back they rake toward the neck and
       lose a row. */
    const back = pose.head.ears ? 1 : 0;
    const rise = back ? 1.1 : 1.8;
    const rake = back ? 1.3 : 0.2;
    /* In profile a turned head reads as the far ear sliding out from behind
       the near one. Without it the profile spends two idle keys on one
       image. */
    const part = (pose.head.scan || 0)*0.9;
    const earBase = { x: poll.x - along.x*0.9, y: poll.y - along.y*0.9 };
    line(R, earBase, { x: earBase.x + up.x*rise - along.x*rake,
      y: earBase.y + up.y*rise - along.y*rake }, 1, 0.72, false);
    const farBase = { x: earBase.x - along.x*(1.1 + part),
      y: earBase.y - along.y*(1.1 + part) };
    line(R, farBase,
      { x: farBase.x + up.x*(rise - 0.3) - along.x*rake,
        y: farBase.y + up.y*(rise - 0.3) - along.y*rake }, 1, 0.66, false);
    return;
  }
  const front = dir === 0;
  const baseY = front ? pose.spine.withers.y + 1 : pose.spine.rump.y + 1;
  const pollY = pose.neck.poll.y;
  for (let y = Math.round(Math.min(baseY, pollY)); y <= Math.round(Math.max(baseY, pollY)); y++) {
    const q = (y - Math.min(baseY, pollY))/Math.max(1, Math.abs(baseY - pollY));
    for (let x = -1; x <= 1; x++)
      R.put(cx + x, y, MAT_BODY, 0.60 - 0.06*Math.abs(x), x*0.35, q*0.12);
  }
  const headY = Math.round(pollY);
  const scan = pose.head.scan || 0;
  /* From behind, a turned head reads only as the skull swinging off the
     spine. Without it the away view spends three of four idle keys on one
     image. */
  const swing = front ? 0 : scan;
  for (let y = 0; y <= 2; y++) {
    const half = y < 2 ? 2 : 1;
    for (let x = -half; x <= half; x++)
      R.put(cx + swing + x, headY + y, MAT_BODY,
        0.64 - 0.07*Math.abs(x), x*0.34, (y - 1)*0.10);
  }
  /* Laid back, the ears sit against the skull a row lower, which keeps the
     four idle keys distinct. */
  const earY = headY - (pose.head.ears ? 0 : 1);
  if (front) {
    R.put(cx - 1, headY + 1, MAT_BODY, 0.10, -0.25, -0.12);
    R.put(cx + 1, headY + 1, MAT_BODY, 0.10, 0.25, -0.12);
    R.put(cx, headY + 2, MAT_PALE, 0.72, 0, 0.20);
    R.put(cx - 2 - Math.max(0, scan), earY, MAT_BODY, 0.70, -0.55, 0);
    R.put(cx + 2 + Math.max(0, -scan), earY, MAT_BODY, 0.70, 0.55, 0);
  } else {
    /* Erect, the tips clear the skull block by a pixel each side. Laid back
       they sit inside its outline a row lower. Both inside the block leaves
       only a shade difference, and frames are compared on materials. */
    const spread = pose.head.ears ? 2 : 3;
    const y = headY + (pose.head.ears ? 1 : 0);
    R.put(cx + swing - spread, y, MAT_BODY, 0.62, -0.55, 0);
    R.put(cx + swing + spread, y, MAT_BODY, 0.62, 0.55, 0);
  }
}

/* The brush, a third of the body length. Two rows wide, because one row of
   dither in a quantised ramp reads as a wire. */
function tailPass(R) {
  const { pose, cx, dir } = R;
  if (dir === 2) {
    const base = { x: cx + pose.tail.base.x, y: pose.tail.base.y };
    const tip = { x: cx + pose.tail.tip.x, y: pose.tail.tip.y };
    const mid = { x: lerp(base.x, tip.x, 0.45), y: lerp(base.y, tip.y, 0.45) - 0.8 };
    line(R, base, mid, 2, 0.60, false);
    line(R, mid, tip, 2, 0.52, false);
    R.put(tip.x, tip.y, MAT_BODY, 0.20, -0.4, 0.2);
    return;
  }
  if (dir === 0) return;                       // hidden behind the body from the front
  const y = Math.round(pose.spine.rump.y + 1);
  for (let k = 0; k < 3; k++)
    R.put(cx, y + k, MAT_BODY, 0.58 - 0.10*k, 0, 0.18);
}

function contactShadePass(R) {
  for (const foot of R.pose.feet) {
    if (!foot.contact) continue;
    const leg = R.pose.legs.find((v) => v.limb === foot.limb);
    const p = projectLeg(R, leg).foot;
    const i = Math.round(p.y)*R.sp.w + Math.round(p.x);
    if (i >= 0 && i < R.sp.occ.length && R.sp.occ[i]) R.sp.shade[i] = 0.06;
  }
}

const WOLF_PASSES = [
  (R) => legPass(R, false),
  tailPass,
  bodyPass,
  neckAndHeadPass,
  (R) => legPass(R, true),
  contactShadePass,
];

function makeWolf(rnd, frame = 0, dir = 2, state = 'trot') {
  if (!WOLF_STATES[state]) state = 'trot';
  const R = wolfContext(rnd, frame, dir, state);
  for (const pass of WOLF_PASSES) pass(R);
  Object.defineProperty(R.sp, 'poseWolf', { value: R.pose, enumerable: false });
  return R.sp;
}

export { makeWolf, projectLeg };
