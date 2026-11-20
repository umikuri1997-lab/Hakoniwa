import { bakeWorldAtlas, buildWorldAtlas } from '../src/atlas.js';
import { ACTOR } from '../src/fauna.js';
import { CAST } from '../src/people.js';
import { PALETTE, RAMP, RAMP_ID } from '../src/palette.js';
import { setLight } from '../src/sprite.js';
import { cell, Stage } from './stage.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Sprite lab.

   Every body in the cast, in every direction, state and frame, drawn through
   the real shaders at 1x/2x/4x/8x, with clips at the game's own rate.

   It draws through the shader: a JavaScript copy of rampStep can show a
   distinction the GPU does not render. lab/stage.js owns the drawing; this
   file is layout and controls and never decides a pixel's colour.

   The page keeps no list of the cast. It reads ACTOR and the baked atlas, so
   a new row in src/fauna.js appears with no edit here, and a body that failed
   to bake is a visible hole.

   People are the grid-authored folk rig: src/body-folk.js owns anatomy and
   contact, src/figure-folk.js the raster. tools/person.mjs renders sheets
   without this lab.

   No ground, shadows or snowfall. Every uniform that affects the sprite
   itself is here, at the game's defaults.
   ═══════════════════════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);
const DIRS = ['front', 'back', 'side'];

/* ── backgrounds ────────────────────────────────────────────────────────────
   Findability against snow is a design constraint, so two backgrounds come
   from the palette: the top rung of the snow ramp (the brightest ground) and
   the bottom rung of the twig ramp (a dense conifer stand, the darkest
   backdrop). The mid grey is a neutral value reference outside the palette;
   the post pass snaps it to the nearest legal colour, as the game would. */
const BGS = {
  snow: RAMP.snow[RAMP.snow.length - 1],
  trees: RAMP.twig[0],
  grey: [128, 128, 128],
};

/* ── state ───────────────────────────────────────────────────────────────── */
const stage = new Stage($('lab'));
let atlas = null;          // what buildWorldAtlas returned
let baked = null;          // its GPU atlas: two textures and a rects table
let playing = true;
let clock = 0;             // seconds. Every clip's phase is a function of it.
let zoom = 4;

/* ── synthesis ──────────────────────────────────────────────────────────────
   The whole atlas through buildWorldAtlas, the authority on how a body is
   synthesised (seed, state, height). It costs about a second because it also
   grows every tree.

   setLight(-142) first. This is the baked light: it sets which way authored
   normals lean and what goes into `shade`, and -142 is the value src/main.js
   passes as opts().light. The azimuth slider moves the shader's light, which
   is evaluated per frame and re-bakes nothing. */
function synthesise() {
  setLight(-142);
  atlas = buildWorldAtlas((+$('seed').value) >>> 0, +$('snow').value);
  baked = bakeWorldAtlas(atlas);
}

/* ── the cast ───────────────────────────────────────────────────────────────
   Read out of the built atlas. `atlas.figures` is keyed by
   stateKey(row.key, state), so the key is the atlas key. */
function castRows() {
  const rows = [];
  const nameByKey = {};
  for (const name of Object.keys(CAST)) nameByKey[CAST[name].key] = name;
  for (const akey of Object.keys(atlas.figures)) {
    const at = akey.indexOf('@');
    const base = at < 0 ? akey : akey.slice(0, at);
    const state = at < 0 ? 'walk' : akey.slice(at + 1);
    const row = CAST[nameByKey[base]];
    if (!row) continue;               // a body the table does not declare
    rows.push({ label: nameByKey[base] + (state === 'walk' ? '' : ' · ' + state),
                key: akey, state, n: atlas.figures[akey][0].length, rate: 1,
                ramp: row.ramp, sMin: row.sMin, sMax: row.sMax });
  }
  /* Animals come from ACTOR and the baked atlas.

     Cadence comes from the species clip table through `ACTOR[k].clips`: a
     rigged animal has states the engine never selects by speed. A wolf's
     canter is in the bank and no threshold reaches it, so `gait` and
     `runGait` alone show it at the wrong rate.

     Machines are skipped: their instrument is `tools/shot.mjs --machines`. */
  for (const [name, F] of Object.entries(ACTOR)) {
    if (F.figure || F.machine) continue;
    /* A rigged animal carries its clip table. An explicit one carries only
       frame counts, so its cadence is the rate the row declares for that kind
       of state. The states come from the row either way. */
    const rateFor = (state) => (state === F.restState && F.idleRate) ? F.idleRate
      : (state === F.fleeState && F.runGait) ? F.runGait : F.gait;
    const clips = F.clips || Object.fromEntries(
      Object.entries(F.states || { [F.moveState || 'walk']: 4 })
        .map(([state, n]) => [state, { n, rate: rateFor(state) }]));
    for (const [state, clip] of Object.entries(clips)) {
      const key = state === 'walk' ? name : `${name}@${state}`;
      const bank = atlas[key];
      if (!bank) continue;              // a state that failed to bake stays a hole
      rows.push({ label: `${name}${state === 'walk' ? '' : ' · ' + state}`,
                  key, state, n: Math.min(clip.n, bank[0].length), rate: clip.rate,
                  ramp: F.ramp, sMin: F.sMin, sMax: F.sMax });
    }
  }
  return rows;
}

/* Sub-label: the ramp and the sprite size as baked, read from the atlas. The
   declared height differs: trimSprite crops it, the bob makes two frames a row
   shorter, and a held item pads the canvas upward. */
function noteOf(row) {
  const r = baked.rects[row.key + ':0:0'];
  return row.ramp + ' · ' + (r ? r.w + '×' + r.h : 'not baked') + ' px';
}

/* The frame at the game's own rate. A clip is a function of the clock, never
   an accumulator. The game's walk accumulates only so it stops with the feet. */
function frameOf(row) {
  if (!playing) return 0;
  return Math.floor(clock*row.rate)%row.n;
}

/* ── layout ─────────────────────────────────────────────────────────────────
   One canvas, one draw, labels as DOM on top: text drawn into the canvas at
   1x is unreadable.

   Header gaps are world pixels sized so gap*zoom is about 22 screen pixels.
   Rows sit a whole number of world pixels apart at every zoom, so no figure
   position is fractional. */
function layout() {
  const rows = castRows();
  const maxFrames=Math.max(1,...rows.map((row)=>row.n));
  let cw = 8, ch = 8;
  for (const row of rows) for (let d = 0; d < 3; d++) for (let f = 0; f < row.n; f++) {
    const r = baked.rects[row.key + ':' + d + ':' + f];
    if (r) { cw = Math.max(cw, r.w); ch = Math.max(ch, r.h); }
  }
  cw += 3; ch += 3;

  const GAP = Math.max(2, Math.ceil(22 / zoom));
  const blocks = [
    { title: 'IN MOTION — ' + DIRS.join(' · ') + (playing ? '' : '   (paused)'),
      cols: 3, mode: 'motion', rows, headers: false },
    { title: 'EVERY DIRECTION × EVERY FRAME', cols: 3*maxFrames, mode: 'all', rows,
      headers: true },
  ];

  let y = 0;
  const labels = [], cells = [];
  for (const b of blocks) {
    labels.push({ cls: 'title', x: 0, y, w: 3*maxFrames*cw, text: b.title });
    y += GAP;
    if (b.headers) {
      for (let d = 0; d < 3; d++)
        labels.push({ cls: 'hdr dir', x: d*maxFrames*cw, y: y - GAP*0.55, w:maxFrames*cw,
                      text: DIRS[d] });
      for (let c = 0; c < 3*maxFrames; c++)
        labels.push({ cls: 'hdr', x: c * cw, y: y - GAP * 0.12, w: cw,
                      text: 'f' + (c%maxFrames) });
    }
    for (const row of b.rows) {
      labels.push({ cls: 'row', x: -1, y: y + ch * 0.34,
                    text: row.label + (b.mode === 'motion' ? ' ▶' : ''),
                    sub: noteOf(row) });
      for (let i = 0; i < b.cols; i++) {
        const d = b.cols === 3 ? i : Math.floor(i/maxFrames);
        const f = b.cols === 3 ? frameOf(row) : i%maxFrames;
        /* A short clip leaves the rest of its group's columns empty. */
        if (f >= row.n) continue;
        const r = baked.rects[row.key + ':' + d + ':' + f];
        if (!r) continue;
        /* Anchor: mid-cell, one row off the bottom. A sprite's (ax,ay) puts
           the feet on that line. */
        cells.push(cell(i * cw + (cw >> 1), y + ch - 2, r,
                        RAMP_ID[row.ramp], row.sMin, row.sMax, false));
      }
      y += ch;
    }
    y += 2;
  }
  return { W:3*maxFrames*cw, H:y, cw, ch, labels, cells, rows };
}

/* ── the label layer ─────────────────────────────────────────────────────── */
const GUTTER = 128;
function drawLabels(L) {
  const el = $('labels');
  el.innerHTML = '';
  for (const l of L.labels) {
    const d = document.createElement('div');
    d.className = 'lbl ' + l.cls;
    if (l.cls === 'row') {
      d.style.left = '0px'; d.style.width = (GUTTER - 8) + 'px';
      d.style.top = (l.y * zoom) + 'px';
      d.innerHTML = l.text + (l.sub ? '<span class="sub">' + l.sub + '</span>' : '');
    } else {
      d.style.left = (GUTTER + l.x * zoom) + 'px';
      d.style.top = (l.y * zoom) + 'px';
      if (l.w) d.style.width = (l.w * zoom) + 'px';
      d.textContent = l.text;
    }
    el.appendChild(d);
  }
}

/* ── the loop ───────────────────────────────────────────────────────────── */
let last = performance.now();
let L = null;
function relayout() {
  L = layout();
  stage.setFrame(L.W, L.H);
  const cv = $('lab');
  cv.style.width = (L.W * zoom) + 'px';
  cv.style.height = (L.H * zoom) + 'px';
  cv.style.left = GUTTER + 'px';
  const fr = $('frame');
  fr.style.width = (GUTTER + L.W * zoom) + 'px';
  fr.style.height = (L.H * zoom) + 'px';
  drawLabels(L);
  dirty = true;
  $('stat').textContent =
    `${L.rows.length} rows · ${L.W}×${L.H} px at ${zoom}x · cell ${L.cw}×${L.ch} · ` +
    `${L.cells.length} instances · atlas ${baked.W}×${baked.H} · ` +
    `${PALETTE.length} colours locked`;
}

/* A paused page draws nothing. The post pass compares every pixel against
   every palette entry, the whole frame budget under software GL (headless, CI,
   a remote box). `dirty` is set by any input event and by relayout. */
let dirty = true;
addEventListener('input', () => { dirty = true; }, true);
addEventListener('change', () => { dirty = true; }, true);

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (playing) {
    clock += dt;
    /* Only the motion cells move; re-placing all cells is a few hundred
       integer additions. */
    L = layout();
  }
  if (playing || dirty) {
    dirty = false;
    stage.setLight(+$('az').value, +$('el').value, +$('warm').value);
    stage.draw([{ baked, cells: L.cells }],
               { time: clock, wind: $('c-wind').checked ? 1 : 0, bg: BGS[bgKey()] });
  }
  requestAnimationFrame(loop);
}
function bgKey() { return document.querySelector('input[name=bg]:checked').value; }

/* ── controls ───────────────────────────────────────────────────────────── */
function boom(where, e) {
  $('err').style.display = 'block';
  $('err').textContent = where + ': ' + (e && e.stack || e);
}
/* Re-synthesis blocks the thread for a second, so the message paints first. */
function rebuild(msgEl, then) {
  if (msgEl) msgEl.textContent = 're-synthesising the whole atlas …';
  requestAnimationFrame(() => setTimeout(() => {
    try {
      if (then) then();
      synthesise();
      relayout();
      if (msgEl) msgEl.textContent = 'rebuilt · ' + L.rows.length + ' rows in the cast';
    } catch (e) { if (msgEl) msgEl.textContent = String(e.message || e); else boom('rebuild', e); }
  }, 20));
}
$('zoom').addEventListener('change', () => { zoom = +$('zoom').value; relayout(); });
$('play').addEventListener('click', () => {
  playing = !playing;
  $('play').textContent = playing ? '⏸ pause' : '▶ play';
  relayout();
});
$('regen').addEventListener('click', () => rebuild($('terr')));
$('regen-cast').addEventListener('click', () => rebuild($('terr')));
for (const id of ['az', 'el', 'warm'])
  $(id).addEventListener('input', () => { $('v-' + id).textContent = $(id).value; });

/* ── boot ───────────────────────────────────────────────────────────────── */
try {
  synthesise();
  relayout();
  requestAnimationFrame(loop);
  /* Console surface, like src/main.js's __fw: the clock and each row's frame
     for a test or a devtools prompt. */
  window.__lab = { stage, get baked() { return baked; }, get atlas() { return atlas; },
                   get clock() { return clock; }, get playing() { return playing; },
                   frames: () => layout().rows.map((r) => r.label + ':' + frameOf(r)).join(' | '),
                   CAST, layout, castRows };
  window.__ready = true;
} catch (e) { boom('startup', e); throw e; }
