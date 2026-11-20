/* THE COLOUR SNAPSHOT — what each world snaps against, in a form that says what
   moved.

   This is the cheap half of the colour gate, and it is what replaced a rendered
   frame hash over a 15-shot browser matrix. That hash cost ~4.7 minutes and
   could report one thing: something is different. It named no authority, so
   every intentional change failed it and the only available response was to
   rebaseline. This runs in milliseconds off the same pure authorities the shader
   is handed, and it reports WHICH ramp in WHICH world moved by HOW much.

   TWO RECORDS, because two different mistakes are possible and they have
   different causes:

     ramps    every ramp, rung by rung, as the bytes that reach the ramp
              texture. A ramp moving is a change in sunlight.js (the derivation)
              or palette.js (the tone curve), and it moves every pixel that
              resolves that ramp.
     scenes   the per-scene snap list — the list POST_FS runs its fixed
              64-iteration nearest-colour loop over. This is NOT a summary of
              the ramps above: because the snap takes the NEAREST entry, adding
              or removing one repaints pixels that resolve a DIFFERENT ramp. A
              world's snap list is a colour authority in its own right, which is
              why the person ramps could repaint foliage without a person in the
              frame.

   The list was recorded once per rig while `?rig=v2` carried nine ramps of its
   own. All three human rigs are deleted, there is one figure path, and the
   second record went with them. */

import { RAMP, RAMP_ORDER, bakeOutPalette, repaint } from '../src/palette.js';
import { SCENES, sceneRamps } from '../src/scene.js';
import { dEok } from '../src/sunlight.js';

const key = (c) => c.map(Math.round).join(',');

function snapshot() {
  const ramps = {};
  for (const name of RAMP_ORDER) ramps[name] = RAMP[name].map(key);
  const scenes = {};
  for (const id of Object.keys(SCENES)) {
    const out = bakeOutPalette(0, sceneRamps(id), repaint(SCENES[id].fog));
    out.tex.dispose();
    scenes[id] = { n: out.n, colours: out.list.map(key) };
  }
  return { ramps, scenes };
}

/* dE_ok, not a byte distance, because the question a reviewer has is whether a
   move is visible. Half a rung step in this palette runs about 0.045, and dEok
   takes the bytes and converts them itself. */
const perceptual = (a, b) =>
  dEok(a.split(',').map(Number), b.split(',').map(Number));

function diff(want, got) {
  const out = [];
  const wr = want.ramps || {}, gr = got.ramps || {};
  for (const name of new Set([...Object.keys(wr), ...Object.keys(gr)])) {
    const a = wr[name], b = gr[name];
    if (!a) { out.push({ what: `ramp ${name}`, why: 'is new' }); continue; }
    if (!b) { out.push({ what: `ramp ${name}`, why: 'is gone' }); continue; }
    if (a.length !== b.length) {
      out.push({ what: `ramp ${name}`, why: `${a.length} rungs -> ${b.length}` });
      continue;
    }
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i])
      out.push({ what: `ramp ${name} rung ${i}`,
        why: `[${a[i]}] -> [${b[i]}]  dE ${perceptual(a[i], b[i]).toFixed(3)}` });
  }
  const ws = want.scenes || {}, gs = got.scenes || {};
  for (const id of new Set([...Object.keys(ws), ...Object.keys(gs)])) {
    const a = ws[id], b = gs[id];
    if (!a) { out.push({ what: id, why: 'is new' }); continue; }
    if (!b) { out.push({ what: id, why: 'is gone' }); continue; }
    const A = new Set(a.colours), B = new Set(b.colours);
    const gained = b.colours.filter((c) => !A.has(c));
    const lost = a.colours.filter((c) => !B.has(c));
    if (!gained.length && !lost.length && a.n === b.n) continue;
    out.push({ what: `${id} snap list`,
      why: `${a.n} -> ${b.n} entries`
        + (gained.length ? `  gained ${gained.map((c) => `[${c}]`).join(' ')}` : '')
        + (lost.length ? `  lost ${lost.map((c) => `[${c}]`).join(' ')}` : '') });
  }
  return out;
}

export { diff, snapshot };
