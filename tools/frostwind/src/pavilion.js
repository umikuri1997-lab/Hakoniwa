import { clamp } from './math.js';
import { newSprite } from './sprite.js';
import {
  FACE, GLAZE, M, N_FRONT, N_SIDE, N_TOP, OPEN, SOLID,
  cabinetBox, groundFootprint, put, wallSlab,
} from './construct.js';
import { PLAYER_H } from './scale.js';

/* The pavilion is one rectangular outdoor volume under a tensile shell.
   Projection follows PROJECTION.md. The authored choices are the tied flap on
   the left, the right side wing, five front panels and four roof ornaments. */
const PAVILION_M = Object.freeze({
  width: 6.20,
  depth: 3.20,
  apex: 5.05,
  eave: 3.05,
  overhang: 0.42,
  pole: 0.18,
  doorHead: 1.70,
  doorWidth: 1.12,
  guyReach: 1.15,
  guySlack: 1.075,
  cordDrop: 0.24,
  knotGap: 0.34,
  yard: 0.914,
});

/* Material 6 resolves through the instance's secondary ramp. */
const ACCENT = GLAZE;

const unit = (x, y, z) => {
  const l = Math.hypot(x, y, z) || 1;
  return { x: x / l, y: y / l, z: z / l };
};
const add = (a, b) => ({ x: a.x + b.x, d: a.d + b.d, z: a.z + b.z });
const sub = (a, b) => ({ x: a.x - b.x, d: a.d - b.d, z: a.z - b.z });
const mul = (a, k) => ({ x: a.x * k, d: a.d * k, z: a.z * k });
const mix = (a, b, t) => add(a, mul(sub(b, a), t));

function cross(a, b) {
  return {
    x: a.d * b.z - a.z * b.d,
    d: a.z * b.x - a.x * b.z,
    z: a.x * b.d - a.d * b.x,
  };
}

/* Physical front, right and top normals map onto the three screen-space
   normals that construct.js and the shader already resolve. */
function panelNormal(a, b, c, hint) {
  let n = cross(sub(b, a), sub(c, a));
  if (n.x * hint.x + n.d * hint.d + n.z * hint.z < 0)
    n = { x: -n.x, d: -n.d, z: -n.z };
  const l = Math.hypot(n.x, n.d, n.z) || 1;
  n = { x: n.x / l, d: n.d / l, z: n.z / l };
  return unit(
    N_SIDE.x * n.x + N_FRONT.x * -n.d + N_TOP.x * n.z,
    N_SIDE.y * n.x + N_FRONT.y * -n.d + N_TOP.y * n.z,
    N_SIDE.z * n.x + N_FRONT.z * -n.d + N_TOP.z * n.z,
  );
}

function project(p) {
  return { x: p.x + p.d * 0.5, y: -p.z - p.d * 0.5 };
}

function boundsOf(points) {
  const q = points.map(project);
  return {
    minX: Math.floor(Math.min(...q.map((p) => p.x))),
    maxX: Math.ceil(Math.max(...q.map((p) => p.x))),
    minY: Math.floor(Math.min(...q.map((p) => p.y))),
    maxY: Math.ceil(Math.max(...q.map((p) => p.y))),
  };
}

function pavilionGeometry() {
  const box = cabinetBox({
    wM: PAVILION_M.width,
    dM: PAVILION_M.depth,
    hM: PAVILION_M.eave,
  });
  const half = (box.w - 1) * 0.5;
  const eave = M(PAVILION_M.eave);
  const apexZ = M(PAVILION_M.apex);
  const over = M(PAVILION_M.overhang);
  const guy = M(PAVILION_M.guyReach);
  const apexD = Math.round(box.d * 0.54);
  /* Offset x cancels the pavilion depth shear at the apex, so the high point
     remains over the front elevation's centre. */
  const apex = { x: -apexD * 0.5, d: apexD, z: apexZ };
  const frontX = [-half - over, -half * 0.48, 0, half * 0.48, half + over];
  /* a bounded hem lift, in metres */
  const hemLiftM = [0.04, 0.10, 0.02, 0.10, 0.04];
  const frontHem = frontX.map((x, i) => ({ x, d: 0, z: eave + M(hemLiftM[i]) }));
  const frontTop = [];
  for (let i = 0; i < frontHem.length - 1; i++) {
    frontTop.push(frontHem[i]);
    const sag = mix(frontHem[i], frontHem[i + 1], 0.5);
    sag.z -= [3, 5, 4, 3][i];
    sag.x += [-1, 2, -2, 1][i];
    frontTop.push(sag);
  }
  frontTop.push(frontHem.at(-1));
  const wallWave = [-2, 4, -3, 5, 0, -5, 3, -4, 2];
  const wallBillow = [0, 2, 4, 3, 5, 3, 4, 2, 0];
  const wallLift = [1, -1, 1, 0, 2, -1, 1, 0, 1];
  const frontMid = frontTop.map((p, i) => ({
    x: clamp(p.x * 0.92 + wallWave[i], -half - over, half + over),
    d: -wallBillow[i],
    z: Math.round(eave * 0.46) + wallLift[i],
  }));
  const baseLift = [0, 3, 0, 2, 1, 2, 0, 3, 0];
  const frontBase = frontTop.map((p, i) => ({
    x: i === 0 ? -half : i === frontTop.length - 1 ? half
      : clamp(p.x * 0.84 + wallWave[i] * 0.35, -half, half),
    d: 0,
    z: baseLift[i],
  }));
  const roofWave = [-3, 2, -4, 3, 0, -3, 4, -2, 3];
  const roofSag = [2, 5, 3, 6, 4, 6, 3, 5, 2];
  const innerWave = [1, -2, 2, -3, 0, 3, -2, 2, -1];
  const innerSag = [1, 3, 2, 4, 2, 4, 2, 3, 1];
  const frontRoofInner = frontTop.map((p, i) => {
    const q = mix(apex, p, 0.29);
    q.x += innerWave[i];
    q.d += i % 2 ? -1 : 2;
    q.z -= innerSag[i];
    return q;
  });
  const frontRoof = frontTop.map((p, i) => {
    const q = mix(apex, p, 0.63);
    q.x += roofWave[i];
    q.d += i % 2 ? 2 : -1;
    q.z -= roofSag[i];
    return q;
  });
  const backHem = [
    { x: -half - over, d: box.d, z: eave - 1 },
    { x: 0, d: box.d, z: eave + 1 },
    { x: half + over, d: box.d, z: eave },
  ];
  const rightHem = [
    frontHem[4],
    { x: half + over, d: box.d * 0.5, z: eave + 2 },
    backHem[2],
  ];
  const rightBase = [
    frontBase.at(-1),
    { x: half, d: box.d * 0.5, z: 0 },
    { x: half, d: box.d, z: 0 },
  ];
  const rightMid = [
    frontMid.at(-1),
    { x: half + over * 0.58, d: box.d * 0.47,
      z: Math.round(eave * 0.43) + 3 },
    { x: half + over * 0.20, d: box.d,
      z: Math.round(eave * 0.46) - 1 },
  ];
  const poleX = [-half * 0.48, half * 0.48];
  const frontPoles = poleX.map((x, i) => ({
    foot: { x: x * 0.84, d: 0, z: 0 },
    head: { x, d: 0, z: frontHem[i ? 3 : 1].z + 2 },
  }));
  const backPoles = [
    { foot: { x: -half, d: box.d, z: 0 }, head: backHem[0] },
    { foot: { x: half, d: box.d, z: 0 }, head: backHem[2] },
  ];
  const stakes = [
    { x: -half - over - guy, d: 0, z: 0 },
    { x: half + over + guy, d: 0, z: 0 },
    { x: half + over + guy * 0.55, d: box.d, z: 0 },
  ];
  const doorHead = Math.max(PLAYER_H, M(PAVILION_M.doorHead));
  const doorHalf = Math.max(4, M(PAVILION_M.doorWidth) >> 1);
  const control = [
    apex, ...frontHem, ...frontTop, ...frontRoofInner, ...frontRoof,
    ...frontMid, ...frontBase, ...backHem, ...rightHem, ...rightMid, ...rightBase,
    ...frontPoles.flatMap((p) => [p.foot, p.head]),
    ...backPoles.flatMap((p) => [p.foot, p.head]), ...stakes,
  ];
  const B = boundsOf(control);
  const pad = 4;
  const shift = { x: pad - B.minX, y: pad - B.minY };
  const W = B.maxX - B.minX + pad * 2 + 1;
  const H = B.maxY - B.minY + pad * 2 + 1;
  return {
    box, half, eave, over, guy, apex, frontHem, frontTop, frontRoofInner,
    frontRoof, frontMid, frontBase, backHem, rightHem, rightMid, rightBase,
    frontPoles, backPoles, stakes, doorHead, doorHalf,
    shift, W, H, anchor: { x: shift.x, y: shift.y },
  };
}

const screen = (G, p) => {
  const q = project(p);
  return { x: q.x + G.shift.x, y: q.y + G.shift.y };
};
const pavilionScreenPoint = (p) => screen(pavilionGeometry(), p);

function triangle(sp, G, a, b, c, material, value, hint) {
  const A = screen(G, a), B = screen(G, b), C = screen(G, c);
  const minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
  const maxX = Math.min(sp.w - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
  const minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
  const maxY = Math.min(sp.h - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
  const area = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
  if (Math.abs(area) < 0.01) return;
  const N = panelNormal(a, b, c, hint);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const ab = (B.x - A.x) * (py - A.y) - (B.y - A.y) * (px - A.x);
    const bc = (C.x - B.x) * (py - B.y) - (C.y - B.y) * (px - B.x);
    const ca = (A.x - C.x) * (py - C.y) - (A.y - C.y) * (px - C.x);
    if (area > 0 ? ab >= -0.01 && bc >= -0.01 && ca >= -0.01
      : ab <= 0.01 && bc <= 0.01 && ca <= 0.01)
      put(sp, x, y, material, value, 1, N);
  }
}

function quad(sp, G, a, b, c, d, material, value, hint) {
  triangle(sp, G, a, b, c, material, value, hint);
  triangle(sp, G, a, c, d, material, value, hint);
}

/* Integer Bresenham: exact endpoints, no fractional typed-array rows. */
function stroke(sp, a, b, material, value, thick = 1, N = N_FRONT) {
  let x0 = Math.round(a.x), y0 = Math.round(a.y);
  const x1 = Math.round(b.x), y1 = Math.round(b.y);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  const r = Math.max(0, thick - 1);
  for (;;) {
    for (let q = -r; q <= r; q++) {
      put(sp, x0 + q, y0, material, value, 1, N);
      if (q) put(sp, x0, y0 + q, material, value, 1, N);
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

/* The radius is the vernacular's; it defaults to this file's pole. */
function pole(sp, G, member, value, N = N_FRONT, radius = PAVILION_M.pole) {
  const a = screen(G, member.foot), b = screen(G, member.head);
  const r = Math.max(1, M(radius) >> 1);
  const y0 = Math.round(Math.min(a.y, b.y)), y1 = Math.round(Math.max(a.y, b.y));
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const cx = Math.round(b.x + (a.x - b.x) * t);
    for (let q = -r; q <= r; q++) {
      const u = q / Math.max(1, r);
      const C = unit(N.x + u * 0.72, N.y, Math.max(0.22, N.z * Math.sqrt(1 - u * u)));
      put(sp, cx + q, y, SOLID, value - u * 0.16, 1, C);
    }
  }
  return { a, b, r };
}

/* Solve the equal-height catenary from span and declared rope length. */
function catenaryA(span, length) {
  const half = span * 0.5;
  let lo = Math.max(0.20, span * 0.02), hi = Math.max(1, span * 20);
  for (let i = 0; i < 40; i++) {
    const a = (lo + hi) * 0.5;
    const L = 2 * a * Math.sinh(half / a);
    if (L > length) lo = a; else hi = a;
  }
  return (lo + hi) * 0.5;
}

function catenary(sp, a, b, material, value, lengthFactor = PAVILION_M.guySlack) {
  const span = Math.max(2, Math.abs(b.x - a.x));
  const length = Math.max(span + 0.1, span * lengthFactor);
  const A = catenaryA(span, length);
  const mid = (a.x + b.x) * 0.5;
  const edge = Math.cosh(span * 0.5 / A);
  const n = Math.ceil(span);
  let prev = a;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t;
    const lineY = a.y + (b.y - a.y) * t;
    const y = lineY + A * (edge - Math.cosh((x - mid) / A));
    const p = { x, y };
    stroke(sp, prev, p, material, value, 1);
    prev = p;
  }
}

function drawOpening(sp, G) {
  const base = screen(G, { x: 0, d: 0, z: 0 });
  const topY = base.y - G.doorHead;
  for (let y = Math.round(topY); y <= Math.round(base.y); y++) {
    const t = clamp((y - topY) / Math.max(1, G.doorHead), 0, 1);
    const half = Math.max(1, Math.round(G.doorHalf * Math.pow(t, 1.18)));
    const drift = Math.round(-2 * t);
    const cx = Math.round(base.x) + drift;
    for (let q = -half; q <= half; q++)
      put(sp, cx + q, y, SOLID, 0.055, 1, N_FRONT);
    /* The jambs are folded cloth; their width follows the slit. */
    const fold = Math.max(1, Math.round(Math.sin(Math.PI * t) * 3));
    for (let q = 1; q <= fold; q++) {
      put(sp, cx - half - q, y, SOLID, 0.42 + q * 0.05, 1, N_FRONT);
      put(sp, cx + half + q, y, SOLID, 0.68 - q * 0.06, 1, N_FRONT);
    }
    if (Math.abs(t - 0.54) < 0.035) {
      put(sp, cx + half + fold + 1, y, ACCENT, 0.94, 1, N_FRONT);
      put(sp, cx + half + fold + 2, y + 1, ACCENT, 0.78, 1, N_FRONT);
    }
  }
}

function tassel(sp, x, y, material = ACCENT) {
  put(sp, x, y, material, 0.92, 1, N_FRONT);
  stroke(sp, { x, y: y + 1 }, { x: x - 1, y: y + 4 },
    material, 0.72, 1);
  stroke(sp, { x, y: y + 1 }, { x: x + 1, y: y + 4 },
    material, 0.72, 1);
}

function makePavilion(rnd, variant = 0) {
  const G = pavilionGeometry();
  const sp = newSprite(G.W, G.H);
  sp.ax = G.anchor.x; sp.ay = G.anchor.y;
  sp.ramp = 'pavilionCloth'; sp.ramp2 = 'pavilionTrim';
  sp.sMin = 0.06; sp.sMax = 1.00; sp.kind = 'pavilion'; sp.tilt = 0;

  /* Rear structure is darker and wins only where the cloth leaves it visible. */
  for (const p of G.backPoles) pole(sp, G, p, 0.28, N_SIDE);
  stroke(sp, screen(G, G.backPoles[1].head), screen(G, G.stakes[2]), ACCENT, 0.58);

  /* The right return and front curtains taper toward their ground contacts. */
  for (let i = 0; i < G.rightHem.length - 1; i++) {
    quad(sp, G, G.rightHem[i], G.rightHem[i + 1], G.rightMid[i + 1],
      G.rightMid[i], SOLID, FACE.side + 0.08 + i * 0.04, { x: 1, d: 0, z: 0 });
    quad(sp, G, G.rightMid[i], G.rightMid[i + 1], G.rightBase[i + 1],
      G.rightBase[i], SOLID, FACE.side + i * 0.03, { x: 1, d: 0, z: 0 });
  }
  for (let i = 0; i < G.frontTop.length - 1; i++) {
    const panel = i >> 1;
    const upper = [0.56, 0.70, 0.62, 0.76][panel];
    const lower = [0.48, 0.64, 0.54, 0.68][panel];
    quad(sp, G, G.frontTop[i], G.frontTop[i + 1], G.frontMid[i + 1],
      G.frontMid[i], SOLID, upper + (i % 2 ? 0.04 : -0.03),
      { x: 0, d: -1, z: 0 });
    quad(sp, G, G.frontMid[i], G.frontMid[i + 1], G.frontBase[i + 1],
      G.frontBase[i], SOLID, lower + (i % 2 ? -0.03 : 0.04),
      { x: 0, d: -1, z: 0 });
  }
  stroke(sp, screen(G, G.frontHem.at(-1)), screen(G, G.rightMid[0]),
    SOLID, 0.24, 2, N_SIDE);
  stroke(sp, screen(G, G.rightMid[0]), screen(G, G.rightBase[0]),
    SOLID, 0.20, 2, N_SIDE);

  /* Far roof first, then return, then the front radial fan. */
  const backInner=G.backHem.map((p,i)=>{
    const q=mix(G.apex,p,0.30);q.x+=[2,-3,2][i];q.z-=[1,4,2][i];return q;
  });
  const backRoof=G.backHem.map((p,i)=>{
    const q=mix(G.apex,p,0.68);q.x+=[-5,4,-3][i];q.z-=[3,7,3][i];return q;
  });
  for(let i=0;i<backRoof.length-1;i++){
    triangle(sp,G,G.apex,backInner[i],backInner[i+1],SOLID,0.70-i*0.05,
      {x:0,d:0,z:1});
    quad(sp,G,backInner[i],backInner[i+1],backRoof[i+1],backRoof[i],
      SOLID,0.64-i*0.04,{x:0,d:0,z:1});
    quad(sp,G,backRoof[i],backRoof[i+1],G.backHem[i+1],G.backHem[i],
      SOLID,0.56-i*0.04,{x:0,d:0,z:1});
  }
  const rightInner=G.rightHem.map((p,i)=>{
    const q=mix(G.apex,p,0.31);q.x+=[1,-3,2][i];q.z-=[2,5,1][i];return q;
  });
  const rightRoof=G.rightHem.map((p,i)=>{
    const q=mix(G.apex,p,0.66);q.x+=[-4,5,-2][i];q.z-=[3,7,4][i];return q;
  });
  for(let i=0;i<rightRoof.length-1;i++){
    triangle(sp,G,G.apex,rightInner[i],rightInner[i+1],SOLID,0.62+i*0.04,
      {x:0.4,d:0,z:1});
    quad(sp,G,rightInner[i],rightInner[i+1],rightRoof[i+1],rightRoof[i],
      SOLID,0.56+i*0.04,{x:0.4,d:0,z:1});
    quad(sp,G,rightRoof[i],rightRoof[i+1],G.rightHem[i+1],G.rightHem[i],
      SOLID,0.46+i*0.05,{x:0.4,d:0,z:1});
  }
  for (let i = 0; i < G.frontRoof.length - 1; i++) {
    const panel = i >> 1;
    triangle(sp, G, G.apex, G.frontRoofInner[i], G.frontRoofInner[i + 1],
      SOLID, [0.78, 0.94, 0.86, 0.72][panel] + (i % 2 ? 0.02 : -0.04),
      { x: 0, d: -0.25, z: 1 });
    quad(sp, G, G.frontRoofInner[i], G.frontRoofInner[i + 1],
      G.frontRoof[i + 1], G.frontRoof[i], SOLID,
      [0.74, 0.90, 0.82, 0.68][panel] + (i % 2 ? -0.03 : 0.04),
      { x: 0, d: -0.25, z: 1 });
    quad(sp, G, G.frontRoof[i], G.frontRoof[i + 1], G.frontTop[i + 1],
      G.frontTop[i], SOLID, [0.70, 0.88, 0.80, 0.64][panel]
        + (i % 2 ? -0.04 : 0.03), { x: 0, d: -0.25, z: 1 });
  }

  /* The asymmetric wing is a tied outer cloth panel. */
  const wingTop = G.frontHem[4];
  const wingMid = { x: G.stakes[1].x - G.guy * 0.18, d: 0,
    z: Math.round(G.eave * 0.52) };
  const wingFoot = { x: G.stakes[1].x - 2, d: 0, z: 1 };
  triangle(sp, G, wingTop, wingMid, wingFoot, ACCENT, 0.62, { x: 0, d: -1, z: 0 });

  drawOpening(sp, G);

  const poles = G.frontPoles.map((p) => pole(sp, G, p, 0.68));
  for (const p of poles) {
    for (let y = Math.round(p.a.y) - 5; y > p.b.y + 3; y -= 9) {
      const t = (y - p.b.y) / Math.max(1, p.a.y - p.b.y);
      const cx = Math.round(p.b.x + (p.a.x - p.b.x) * t);
      stroke(sp, { x: cx - p.r, y }, { x: cx + p.r, y: y + 1 }, ACCENT, 0.82);
    }
  }

  /* Taut guys follow structural attachment points. */
  stroke(sp, screen(G, G.frontHem[0]), screen(G, G.stakes[0]), ACCENT, 0.86);
  stroke(sp, screen(G, G.frontHem[4]), screen(G, G.stakes[1]), ACCENT, 0.78);
  for (const s of G.stakes) {
    const p = screen(G, s);
    stroke(sp, { x: p.x, y: p.y - 4 }, { x: p.x, y: p.y + 1 }, SOLID, 0.44, 1);
  }

  /* Panel piping is generated from the panel boundaries. */
  const apex = screen(G, G.apex);
  for (let i = 0; i < G.frontHem.length; i++) {
    const inner = screen(G, G.frontRoofInner[i * 2]);
    const bend = screen(G, G.frontRoof[i * 2]);
    stroke(sp, apex, inner, OPEN, 0.88, 1, N_TOP);
    stroke(sp, inner, bend, OPEN, 0.84, 1, N_TOP);
    stroke(sp, bend, screen(G, G.frontHem[i]), OPEN, 0.82, 1, N_TOP);
  }
  for (let i = 0; i < G.frontTop.length - 1; i++)
    stroke(sp, screen(G, G.frontTop[i]), screen(G, G.frontTop[i + 1]),
      ACCENT, i % 2 ? 0.94 : 0.80);
  for (let i = 2; i < G.frontMid.length - 2; i += 2)
    stroke(sp, screen(G, G.frontTop[i]), screen(G, G.frontMid[i]), OPEN, 0.44);

  /* The front garland is a physical cord between the two support heads. */
  const left = screen(G, G.frontPoles[0].head);
  const right = screen(G, G.frontPoles[1].head);
  catenary(sp, { x: left.x, y: left.y + M(PAVILION_M.cordDrop) },
    { x: right.x, y: right.y + M(PAVILION_M.cordDrop) }, ACCENT, 0.96);
  const knots = Math.max(3, Math.round((right.x - left.x) / Math.max(2, M(PAVILION_M.knotGap))));
  for (let i = 1; i < knots; i++) {
    const t = i / knots;
    const x = Math.round(left.x + (right.x - left.x) * t);
    const sag = Math.round(M(PAVILION_M.cordDrop) * (1 + 2.1 * 4 * t * (1 - t)));
    tassel(sp, x, Math.round(left.y) + sag);
  }

  return sp;
}

function pavilionSlab() {
  const G = pavilionGeometry();
  const frontLeft = screen(G, { x: -(G.box.w - 1) * 0.5, d: 0, z: 0 });
  return wallSlab(G.box, frontLeft.x, G.anchor.x);
}

function pavilionFootprint() {
  const G = pavilionGeometry();
  const f = groundFootprint(G.box, G.guy + G.over);
  return { hx: f.hx, back: f.back, front: M(0.55), yard: M(PAVILION_M.yard) };
}

function pavilionDoorDX() {
  return -2;
}

function pavilionDoorHW() {
  return pavilionGeometry().doorHalf;
}

/* The tensile operations (second export group) are shared with
   src/desert-camp.js. They read one field of a geometry object, `shift`, so a
   vernacular supplies its own control cage. A third tensile vernacular moves
   them to their own module. */
export {
  PAVILION_M, makePavilion, pavilionDoorDX, pavilionDoorHW, pavilionFootprint,
  pavilionGeometry, pavilionScreenPoint, pavilionSlab,
  boundsOf, catenary, panelNormal, pole, project, quad, screen,
  stroke, triangle, unit,
};
