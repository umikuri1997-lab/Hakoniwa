import { deerPose, DEER_CANVAS, DEER_STATES } from './body-deer.js';
import { clamp, lerp } from './math.js';
import { LUMEN, newSprite } from './sprite.js';

/*
 * The pose owns anatomy and contact. This file owns the pixel concessions:
 * straight one-pixel metapodials, one-pixel knee breaks, far-leg value
 * separation, enlarged velvet and the white rump patch.
 */

const MAT_BODY = 4;
const MAT_PATCH = 2;

function deerContext(rnd, frame, dir, state) {
  const pose = deerPose({ frame, dir, state });
  const sp = newSprite(DEER_CANVAS.w, DEER_CANVAS.h);
  sp.ax = DEER_CANVAS.w >> 1;
  sp.ay = pose.M.ground;
  sp.ramp = 'trunk';
  sp.sMin = 0.05;
  sp.sMax = 0.76;
  sp.kind = 'roeDeer';
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
  return { rnd, frame, dir, state, pose, sp, cx:sp.ax, put };
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
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.x-a.x), Math.abs(b.y-a.y))));
  for (let k = 0; k <= steps; k++) {
    const t = k/steps;
    stamp(R, lerp(a.x,b.x,t), lerp(a.y,b.y,t), width, form, far, mat);
  }
}

function projectLeg(R, leg) {
  const toCanvas = (p) => ({ x:R.cx+p.x, y:p.y });
  const straighten = (root,hoof,inward) => {
    root={x:Math.round(root.x),y:Math.round(root.y)};
    hoof={x:Math.round(hoof.x),y:Math.round(hoof.y)};
    const at=(t,bend)=>({
      x:Math.round(lerp(root.x,hoof.x,t))+bend,
      y:Math.round(lerp(root.y,hoof.y,t)),
    });
    return {root,joint:at(0.40,inward),ankle:at(0.72,0),hoof};
  };
  if (R.dir === 2) {
    /* The solver owns anatomy. Its sub-pixel zigzags are noise at this scale,
       so the raster keeps a straight load line and one pixel of inward knee. */
    const sideOffset=leg.near?0:-1;
    const root=toCanvas(leg.root),hoof=toCanvas(leg.hoof);
    root.x+=sideOffset;hoof.x+=sideOffset;
    return straighten(root,hoof,
      leg.kind==='hind'?1:-1);
  }
  const lateral = leg.side*(leg.kind === 'fore' ? 2.1 : 1.45);
  const project = (p) => ({
    x:R.cx + lateral + (p.x-leg.root.x)*0.16,
    y:p.y+(p.x-leg.root.x)*0.35+(leg.kind === 'hind' ? -0.20 : 0.15),
  });
  return straighten(project(leg.root),project(leg.hoof),-leg.side);
}

function legPass(R, near) {
  const legs = R.pose.legs.filter((leg) => leg.near === near);
  for (const leg of legs) {
    const P = projectLeg(R, leg);
    const far = !near;
    line(R, P.root, P.joint, 1, 0.54, far);
    line(R, P.joint, P.ankle, 1, 0.46, far);
    line(R, P.ankle, P.hoof, 1, 0.38, far);
    /* the hoof: one darker point under the leg */
    R.put(P.hoof.x, P.hoof.y, MAT_BODY, far ? 0.08 : 0.13, 0, 0);
  }
}

function profileBodyPass(R) {
  const { pose, cx } = R;
  const x0 = pose.spine.rump.x - 1.4, x1 = pose.spine.withers.x + 1.4;
  for (let x = Math.ceil(x0); x <= Math.floor(x1); x++) {
    const t = clamp((x-x0)/Math.max(1,x1-x0),0,1);
    const top = lerp(pose.spine.rump.y, pose.spine.withers.y, t);
    const round = Math.abs(t-0.5)*2;
    const depth = pose.M.coatDepth - (round > 0.84 ? 1 : 0);
    for (let y = Math.round(top); y <= Math.round(top+depth); y++) {
      const q = (y-top)/Math.max(1,depth);
      const nx = clamp((t-0.5)*1.45,-0.82,0.82);
      R.put(cx+x,y,MAT_BODY,0.66-0.13*Math.abs(q-0.45),nx,(q-0.5)*0.25);
    }
  }
}

function endBodyPass(R) {
  const front = R.dir === 0;
  const top = Math.round(front ? R.pose.spine.withers.y : R.pose.spine.rump.y);
  const depth = R.pose.M.coatDepth + 1;
  for (let y = top; y <= top+depth; y++) {
    const t = (y-top)/depth;
    const hw = front ? lerp(2.8,3.5,t) : lerp(3.5,2.8,t);
    for (let x = Math.ceil(-hw); x <= Math.floor(hw); x++) {
      const nx = clamp(x/Math.max(1,hw),-0.82,0.82);
      R.put(R.cx+x,y,MAT_BODY,0.64-0.13*Math.abs(nx),nx,(t-0.5)*0.22);
    }
  }
}

function bodyPass(R) {
  if (R.dir === 2) profileBodyPass(R);
  else endBodyPass(R);
}

function headBasis(pose){
  const dx=pose.head.muzzle.x-pose.neck.poll.x;
  const dy=pose.head.muzzle.y-pose.neck.poll.y;
  const n=Math.max(1e-6,Math.hypot(dx,dy));
  const along={x:dx/n,y:dy/n};
  return {along,up:{x:along.y,y:-along.x}};
}

function neckAndHeadPass(R) {
  const { pose, cx, dir } = R;
  if (dir === 2) {
    const base = {x:cx+pose.neck.base.x,y:pose.neck.base.y};
    const poll = {x:cx+pose.neck.poll.x,y:pose.neck.poll.y};
    const muzzle = {x:cx+pose.head.muzzle.x,y:pose.head.muzzle.y};
    const {along,up}=headBasis(pose);
    line(R,base,poll,3,0.62,false);
    /* a solid three-row wedge, so eye and muzzle are pixels of a face */
    line(R,poll,muzzle,3,0.59,false);
    const brow={x:lerp(poll.x,muzzle.x,0.42),y:lerp(poll.y,muzzle.y,0.42)};
    R.put(brow.x+up.x,brow.y+up.y,MAT_BODY,0.08,0.12,-0.28); // eye, not a hole
    R.put(brow.x-up.x,brow.y-up.y,MAT_BODY,0.52,0.08,0.20); // cheek
    R.put(muzzle.x,muzzle.y,MAT_BODY,0.10,0.72,0);
    R.put(muzzle.x+along.x,muzzle.y+along.y,MAT_BODY,0.08,0.78,0);
    const earBase={x:poll.x-along.x*0.35,y:poll.y-along.y*0.35};
    const listen=pose.head.listen;
    line(R,earBase,
      {x:earBase.x+up.x*2.4-along.x*(0.5+listen*0.4),
       y:earBase.y+up.y*2.4-along.y*(0.5+listen*0.4)},1,0.74,false);
    line(R,{x:earBase.x-along.x,y:earBase.y-along.y},
      {x:earBase.x+up.x*1.8+along.x*(1.0-listen*0.3),
       y:earBase.y+up.y*1.8+along.y*(1.0-listen*0.3)},1,0.68,false);
    return;
  }

  const front = dir === 0;
  const baseY = front ? pose.spine.withers.y+1 : pose.spine.rump.y+1;
  const pollY = pose.neck.poll.y;
  const neckHalf = 1;
  for (let y = Math.round(Math.min(baseY,pollY)); y <= Math.round(Math.max(baseY,pollY)); y++) {
    const q=(y-Math.min(baseY,pollY))/Math.max(1,Math.abs(baseY-pollY));
    for(let x=-neckHalf;x<=neckHalf;x++)R.put(cx+x,y,MAT_BODY,0.58-0.06*Math.abs(x),x*0.35,q*0.12);
  }
  const headY=Math.round(pollY);
  for(let y=0;y<=2;y++){
    const half=y<2?2:1;
    for(let x=-half;x<=half;x++)
      R.put(cx+x,headY+y,MAT_BODY,0.62-0.07*Math.abs(x),x*0.34,(y-1)*0.10);
  }
  if(front){
    R.put(cx-1,headY+1,MAT_BODY,0.10,-0.25,-0.12);
    R.put(cx+1,headY+1,MAT_BODY,0.10, 0.25,-0.12);
    R.put(cx,headY+3,MAT_BODY,0.08,0,0);                   // complete dark muzzle
    R.put(cx-2-pose.head.listen,headY-1,MAT_BODY,0.72,-0.55,0);
    R.put(cx+2+Math.max(0,-pose.head.listen),headY-1,MAT_BODY,0.72, 0.55,0);
    if(pose.head.listen)
      R.put(cx-pose.head.listen*4,headY-2,MAT_BODY,0.74,-pose.head.listen*0.60,0);
  }else{
    R.put(cx-2-pose.head.listen,headY,MAT_BODY,0.64,-0.55,0);
    R.put(cx+2+Math.max(0,-pose.head.listen),headY,MAT_BODY,0.64, 0.55,0);
    if(pose.head.listen)
      R.put(cx-pose.head.listen*3,headY-1,MAT_BODY,0.68,-pose.head.listen*0.55,0);
  }
}

function antlerPass(R) {
  const { pose, cx, dir } = R;
  if (dir === 2) {
    const {along,up}=headBasis(pose);
    const poll={x:cx+pose.neck.poll.x,y:pose.neck.poll.y};
    const base={x:poll.x-along.x*0.55+up.x*0.20,y:poll.y-along.y*0.55+up.y*0.20};
    const mid={x:base.x+up.x*2.4-along.x*0.35,y:base.y+up.y*2.4-along.y*0.35};
    const tip={x:base.x+up.x*5.5-along.x*0.85,y:base.y+up.y*5.5-along.y*0.85};
    /* The far beam supplies velvet thickness; the near beam carries the two
       forward tines of a compact three-point roe rack. */
    line(R,{x:base.x-1,y:base.y},{x:tip.x-1,y:tip.y},1,0.48,true);
    line(R,base,mid,2,0.70,false);
    line(R,mid,tip,1,0.76,false);
    const tine1={x:mid.x+along.x*1.8+up.x*0.35,y:mid.y+along.y*1.8+up.y*0.35};
    const upper={x:lerp(mid.x,tip.x,0.58),y:lerp(mid.y,tip.y,0.58)};
    const tine2={x:upper.x+along.x*1.5+up.x*0.30,y:upper.y+along.y*1.5+up.y*0.30};
    line(R,mid,tine1,1,0.74,false);
    line(R,upper,tine2,1,0.78,false);
    return;
  }
  const y = Math.round(pose.neck.poll.y)-1;
  for(const side of [-1,1]){
    const base={x:cx+side,y:y+1};
    const mid={x:cx+side*2,y:y-2};
    const tip={x:cx+side*2,y:y-pose.M.antlerSilhouette};
    line(R,base,mid,1,0.70,false);
    line(R,mid,tip,1,0.76,false);
    line(R,mid,{x:cx+side*4,y:y-3},1,0.74,false);
    line(R,{x:tip.x,y:tip.y+2},{x:cx+side*3,y:tip.y+1},1,0.78,false);
  }
}

function rumpPatchPass(R) {
  if (R.dir === 0) return;
  if (R.dir === 2) {
    const x=Math.round(R.cx+R.pose.spine.rump.x);
    const y=Math.round(R.pose.spine.rump.y+1);
    R.put(x,y,MAT_PATCH,0.88,-0.35,-0.10);
    R.put(x-1,y+1,MAT_PATCH,0.82,-0.45,0.10);
    R.put(x,y+1,MAT_PATCH,0.90,0.20,0.10);
    R.put(x-1,y+2,MAT_PATCH,0.84,-0.30,0.18);
    R.put(x,y+2,MAT_PATCH,0.88,0.18,0.18);
    return;
  }
  const y=Math.round(R.pose.spine.rump.y+1);
  for(const [dx,dy] of [[-2,0],[-1,0],[0,0],[1,0],[2,0],[-1,1],[0,1],[1,1],[0,2]])
    R.put(R.cx+dx,y+dy,MAT_PATCH,0.88,dx*0.18,dy*0.10);
}

function contactShadePass(R) {
  for(const foot of R.pose.feet){
    if(!foot.contact)continue;
    const leg=R.pose.legs.find((v)=>v.limb===foot.limb);
    const p=projectLeg(R,leg).hoof;
    const i=Math.round(p.y)*R.sp.w+Math.round(p.x);
    if(i>=0&&i<R.sp.occ.length&&R.sp.occ[i])R.sp.shade[i]=0.06;
  }
}

const DEER_PASSES = [
  (R)=>legPass(R,false),
  bodyPass,
  rumpPatchPass,
  neckAndHeadPass,
  antlerPass,
  (R)=>legPass(R,true),
  contactShadePass,
];

function makeRoeDeer(rnd, frame = 0, dir = 2, state = 'walk') {
  if (!DEER_STATES[state]) state = 'walk';
  const R = deerContext(rnd, frame, dir, state);
  for (const pass of DEER_PASSES) pass(R);
  Object.defineProperty(R.sp,'poseDeer',{value:R.pose,enumerable:false});
  return R.sp;
}

/* The pale deer (LIFE.paleDeer): the roe deer's rig, two concessions. Coat
   is material 16, the `skin` ramp: a human surface, so it takes the reduced
   aerial treatment a face takes. Measured failure: as material 1 on that
   ramp the top rung leaves the snap as folkSignal (243,167,135). PALE lifts
   the deer's mid tier (0.58 to 0.66) to the ramp's top rung and leaves far
   legs and belly on the second: 78 of 131 coat pixels in profile, 14 of 80
   head-on. Rack is crystal: LUMEN on ramp2, each beam at its own tier,
   unlit. No rump patch: it is a deposit on ramp2. */
const MAT_COAT = 16;
const PALE = 1.4;

function makePaleDeer(rnd, frame = 0, dir = 2, state = 'walk') {
  if (!DEER_STATES[state]) state = 'walk';
  const R = deerContext(rnd, frame, dir, state);
  const { sp, put } = R;
  for (const pass of DEER_PASSES) {
    if (pass === rumpPatchPass) continue;
    R.put = pass === antlerPass ? (x, y, mat, form) => put(x, y, LUMEN, form) : put;
    pass(R);
  }
  for (let i = 0; i < sp.occ.length; i++) {
    if (sp.occ[i] !== MAT_BODY) continue;
    sp.occ[i] = MAT_COAT;
    sp.shade[i] = clamp(sp.shade[i]*PALE, 0, 1);
  }
  sp.ramp = 'skin'; sp.ramp2 = 'amethyst'; sp.kind = 'paleDeer';
  Object.defineProperty(sp,'poseDeer',{value:R.pose,enumerable:false});
  return sp;
}

export { makePaleDeer, makeRoeDeer, projectLeg };
