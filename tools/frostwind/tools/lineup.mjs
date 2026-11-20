/* ═══════════════════════════════════════════════════════════════════════════
   THE ROSTER LINE-UP. Every body one world bakes, at one scale, on that
   world's own ground, beside its traveller.

   A new body is judged here before it is judged alone: a figure that reads
   on a dark card can vanish on its own sand, and two rows that differ in a
   table can bake to one silhouette. No build and no browser: the roster comes
   from the authorities atlas.js bakes from (LIFE, ACTOR, CAST, ANIMALS), the
   colour from tools/resolve.mjs under the world's own noon sun.

     node tools/lineup.mjs desert              -> /tmp/frostwind-lineup/desert.png
     node tools/lineup.mjs desert --report     the measured table only
     node tools/lineup.mjs                     all four worlds

   The sheet: one column per body, the traveller first. Top band is the dry
   ground, bottom band the worn route. Each band shows the front view over the
   profile. The white bar is one metre.

   test/cast.test.mjs holds the number this prints: the least silhouette
   distance between two people of one world who wear the same cloth.
   ═══════════════════════════════════════════════════════════════════════════ */

import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ANIMALS } from '../src/atlas.js';
import { BIOMES } from '../src/biome.js';
import { ACTOR } from '../src/fauna.js';
import { LIFE, morphologiesIn } from '../src/life.js';
import { RAMP } from '../src/palette.js';
import { CAST, paintPerson, travellerFor } from '../src/people.js';
import { RNG } from '../src/rng.js';
import { PX_PER_M, pxToMetres } from '../src/scale.js';
import { SUN } from '../src/sunlight.js';
import { SURF, SURFACE } from '../src/surface.js';
import { resolveColour, upscale, writePng } from './resolve.mjs';

/* The sun a world's bodies are lit by in a sheet. The frame's light keeps the
   bake azimuth and takes the world's own altitude, so a desert body is lit
   from overhead and a boreal one from the side. */
function sunOf(biome) {
  /* a sunless world states its light whole */
  const fixed = SUN[biome].dir;
  const alt = fixed ? fixed.el * Math.PI / 180 : SUN[biome].alt;
  const az = fixed ? fixed.az * Math.PI / 180 : Math.atan2(-0.42, -0.55);
  return { x: Math.cos(alt) * Math.cos(az), y: Math.cos(alt) * Math.sin(az),
    z: Math.sin(alt) };
}

/* What the draw instance of an actor row supplies to the resolver. */
const instOf = (actor = {}) => ({ ramp: actor.ramp, ramp2: actor.ramp2,
  sMin: actor.sMin, sMax: actor.sMax, dMin: actor.dMin, dMax: actor.dMax, vol: actor.vol });

/* Every body of one world: name, kind, and a painter for (view, state). */
function rosterOf(biome) {
  if (!BIOMES[biome]) throw new Error(`unknown biome '${biome}'`);
  const out = [];
  const person = (name) => ({
    name, kind: 'person', profile: LIFE[name] || LIFE.traveller,
    inst: {},
    paint: (dir, state = 'idle', frame = 0) => paintPerson(name, dir, frame, state),
    rest: 'idle',
  });
  out.push(person(travellerFor(biome)));
  for (const morph of morphologiesIn(biome)) {
    const actor = ACTOR[morph];
    if (!actor) continue;
    if (actor.figure) {
      const name = Object.keys(CAST).find((q) => CAST[q].key === actor.key);
      if (name && !out.some((q) => q.name === name)) out.push(person(name));
      continue;
    }
    const bake = ANIMALS[morph];
    if (!bake) continue;
    const rest = actor.restState && bake.states[actor.restState]
      ? actor.restState : Object.keys(bake.states)[0];
    out.push({
      name: morph, kind: 'animal', profile: LIFE[morph], rest,
      move: actor.moveState && bake.states[actor.moveState] ? actor.moveState : rest,
      inst: instOf(actor),
      /* the atlas bakes three animal views: 0 toward, 1 away, 2 profile */
      paint: (dir, state = rest, frame = 0) =>
        bake.make(new RNG(20260727 ^ bake.seed), frame, Math.min(dir, 2), state),
    });
  }
  return out;
}

/* The ground a world stands its bodies on: the dry surface and the worn
   route, each at the rung its lit open field paints. */
function groundsOf(biome) {
  const plan = BIOMES[biome];
  const remap = (s) => plan.ground?.[s] ?? s;
  const rung = (name) => {
    const ramp = RAMP[name];
    return ramp[Math.max(0, ramp.length - 2)];
  };
  const dry = SURFACE[remap(plan.dry)], route = SURFACE[remap(SURF.trail)];
  return [{ name: dry.name, colour: rung(dry.ramp) },
    { name: route.name, colour: rung(route.ramp) }];
}

/* The occupied box, pixel count and centre of mass of a sprite. */
function extent(sp) {
  let x0 = sp.w, x1 = -1, y0 = sp.h, y1 = -1, n = 0, sx = 0, sy = 0;
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
    if (!sp.occ[y * sp.w + x]) continue;
    n++; sx += x; sy += y;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, n, x0, x1, y0, y1, cx: sx / n, cy: sy / n };
}

/* Silhouette distance of two sprites with their anchors on one pixel:
   1 - intersection over union of the occupied masks. 0 is one shape. */
function silhouetteDistance(a, b) {
  let inter = 0, union = 0;
  const x0 = Math.min(-a.ax, -b.ax), x1 = Math.max(a.w - a.ax, b.w - b.ax);
  const y0 = Math.min(-a.ay, -b.ay), y1 = Math.max(a.h - a.ay, b.h - b.ay);
  const at = (sp, x, y) => {
    const sx = x + sp.ax, sy = y + sp.ay;
    return sx >= 0 && sy >= 0 && sx < sp.w && sy < sp.h && sp.occ[sy * sp.w + sx] ? 1 : 0;
  };
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = at(a, x, y), q = at(b, x, y);
    inter += p & q; union += p | q;
  }
  return union ? 1 - inter / union : 0;
}

/* What one body measures: its drawn box in pixels and metres, the share of
   its pixels on each resolved colour, and its least luminance step from each
   ground. */
function measure(body, biome) {
  const sun = sunOf(biome), grounds = groundsOf(biome);
  const front = body.paint(0, body.rest, 0), side = body.paint(2, body.rest, 0);
  const box = extent(side), fbox = extent(front);
  const colours = new Map();
  for (let i = 0; i < front.occ.length; i++) {
    if (!front.occ[i]) continue;
    const key = resolveColour(front, i, sun, body.inst).join(',');
    colours.set(key, (colours.get(key) || 0) + 1);
  }
  /* the body's dominant colour is what must leave the ground */
  const mass = [...colours.entries()].sort((a, b) => b[1] - a[1])[0][0]
    .split(',').map(Number);
  /* RGB distance, not luminance: the traveller's orange and the sand are ten
     luminance apart and nobody loses him. */
  const steps = grounds.map((g) =>
    Math.hypot(...mass.map((v, k) => v - g.colour[k])));
  /* The share of its pixels that stand 30 or more from a ground, on the worse
     of the two grounds. A body whose legs are the ground's colour still
     reads if its mass is not. */
  const clear = Math.min(...grounds.map((g) => {
    let far = 0, all = 0;
    for (const [key, n] of colours) {
      all += n;
      if (Math.hypot(...key.split(',').map((v, k) => v - g.colour[k])) >= 30) far += n;
    }
    return far / all;
  }));
  return {
    clear,
    name: body.name, kind: body.kind,
    hPx: box.h, lenPx: box.w, widthPx: fbox.w,
    hM: pxToMetres(box.h), lenM: pxToMetres(box.w),
    pixels: fbox.n, colours: colours.size, mass, groundStep: Math.min(...steps),
  };
}

/* The least-different pair of people in one world, front and profile, and the
   full table. A pair is as distinct as its more distinct view. */
function castDistances(biome) {
  const people = rosterOf(biome).filter((q) => q.kind === 'person');
  const sprites = people.map((q) => [q.paint(0), q.paint(2)]);
  const pairs = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const d = Math.max(silhouetteDistance(sprites[i][0], sprites[j][0]),
      silhouetteDistance(sprites[i][1], sprites[j][1]));
    pairs.push({ a: people[i].name, b: people[j].name, distance: d,
      sameRamp: sprites[i][0].ramp === sprites[j][0].ramp });
  }
  pairs.sort((p, q) => p.distance - q.distance);
  return pairs;
}

/* ── the sheet ─────────────────────────────────────────────────────────── */
const SCALE = 6, GAP = 4, PAD = 3;

function sheet(biome) {
  const bodies = rosterOf(biome), sun = sunOf(biome), grounds = groundsOf(biome);
  /* front at rest, profile at rest, profile moving (a person walks) */
  const cells = bodies.map((body) => ({ body, views: [body.paint(0, body.rest, 0),
    body.paint(2, body.rest, 0), body.paint(2, body.move || 'walk', 0)] }));
  const cellW = Math.max(...cells.flatMap((c) => c.views.map((sp) => sp.w))) + GAP;
  const rowH = cells[0].views.map((_, v) =>
    Math.max(...cells.map((c) => c.views[v].h)) + PAD);
  const bandH = rowH.reduce((a, b) => a + b, 0) + GAP;
  const W = cellW * cells.length + GAP, H = bandH * grounds.length;
  const img = Buffer.alloc(W * H * 4);
  grounds.forEach((g, band) => {
    for (let y = band * bandH; y < (band + 1) * bandH; y++) for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      img[p] = g.colour[0]; img[p + 1] = g.colour[1]; img[p + 2] = g.colour[2]; img[p + 3] = 255;
    }
    let top = band * bandH + GAP;
    for (let v = 0; v < rowH.length; v++) {
      cells.forEach(({ body, views }, c) => {
        const sp = views[v];
        /* anchors share a column and a row, so sizes compare */
        const ox = GAP + c * cellW + (cellW >> 1) - sp.ax;
        const oy = top + rowH[v] - PAD - 1 - Math.max(...cells.map((q) => q.views[v].h - 1 - q.views[v].ay)) - sp.ay;
        for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
          const i = y * sp.w + x;
          if (!sp.occ[i]) continue;
          const px = x + ox, py = y + oy;
          if (px < 0 || py < 0 || px >= W || py >= H) continue;
          const [r, g2, b] = resolveColour(sp, i, sun, body.inst);
          const p = (py * W + px) * 4;
          img[p] = r; img[p + 1] = g2; img[p + 2] = b;
        }
      });
      top += rowH[v];
    }
    /* one metre */
    const bar = Math.round(PX_PER_M);
    for (let x = 0; x < bar; x++) {
      const p = (((band + 1) * bandH - 2) * W + GAP + x) * 4;
      img[p] = img[p + 1] = img[p + 2] = 255;
    }
  });
  return { ...upscale(img, W, H, SCALE), bodies };
}

function report(biome) {
  const rows = rosterOf(biome).map((b) => measure(b, biome));
  console.log(`\n${biome}: ${rows.length} bodies on ${groundsOf(biome).map((g) => g.name).join(' and ')}`);
  console.log('  name               kind    h px  len px   h m   len m  colours  ground step');
  for (const r of rows)
    console.log(`  ${r.name.padEnd(18)} ${r.kind.padEnd(7)} ${String(r.hPx).padStart(4)}  ${
      String(r.lenPx).padStart(6)}  ${r.hM.toFixed(2).padStart(5)}  ${r.lenM.toFixed(2).padStart(5)}  ${
      String(r.colours).padStart(7)}  ${r.groundStep.toFixed(0).padStart(11)}`);
  const pairs = castDistances(biome);
  if (pairs.length)
    console.log(`  closest people: ${pairs.slice(0, 3).map((p) =>
      `${p.a}/${p.b} ${p.distance.toFixed(2)}${p.sameRamp ? ' same ramp' : ''}`).join(', ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2);
  const biomes = args.filter((a) => !a.startsWith('--'));
  const dir = '/tmp/frostwind-lineup';
  mkdirSync(dir, { recursive: true });
  for (const biome of biomes.length ? biomes : Object.keys(BIOMES)) {
    report(biome);
    if (args.includes('--report')) continue;
    const { rgba, w, h, bodies } = sheet(biome);
    writePng(`${dir}/${biome}.png`, rgba, w, h);
    console.log(`  ${dir}/${biome}.png  ${w}x${h}  left to right: ${bodies.map((b) => b.name).join(', ')}`);
  }
}

export { castDistances, extent, groundsOf, instOf, measure, rosterOf, sunOf };
