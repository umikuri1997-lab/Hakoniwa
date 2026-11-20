/* Real frame capture

   Draws one real frame per world through the #regen path a player uses, so
   the shader is held to the laws the model proves. Colour authorities live in
   test/palette.test.mjs; resolution independence in test/scale.test.mjs. This
   file reads pixels the GPU produced. A shot costs a fresh browser page
   (roughly nineteen seconds), so the matrix is one shot per world.

   Determinism: pinned render time, a drained animation loop, and synchronous
   visible-chunk baking. Time drives tree gusts, water, precipitation and
   flicker. rAF is replaced only after its queued callback drains, which stops
   the chain without interrupting rebuild. `ensure(true)` completes the
   visible set before the pinned frame is drawn.

   The output is a colour histogram (a few hundred numbers against half a
   megabyte of bytes): which colours the frame contains and how many pixels
   each covers. Dimensions, scene id and internal resolution ride along so a
   measurement of the wrong place fails. */

import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/* SwiftShader keeps the frame independent of the hardware driver. */
const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/* Non-zero pinned time exercises animated terms instead of their t=0 identity.
   The value is authored for repeatability. */
const PINNED_TIME = 12.5;

/* One seed and one resolution, one shot per world. The seed is the canonical
   one every suite quotes. The resolution is the app's Medium option, wide
   enough to hold a settlement. Each world has its own latitude, palette, fog
   and aerial treatment. */
export const SEED = 20260727;
export const RESOLUTION = '480x270';
export const PLACES = ['outdoor', 'meadow', 'swamp', 'desert', 'hollow'];

export function shotName(seed, res, place) {
  return `${place}-${res}-${seed}`;
}

export function allShots() {
  return PLACES.map((place) => ({ seed: SEED, res: RESOLUTION, place }));
}

/* ── the page-side routine ────────────────────────────────────────────────
   Runs inside the browser. Returns a colour histogram of the drawing buffer
   plus dimensions, scene and internal-size provenance. All sequencing that
   affects pixels stays inside page.evaluate so browser task boundaries cannot
   composite or clear the drawing buffer before readback. */
export async function captureOne(page, { seed, res, place }) {
  return page.evaluate(
    async ({ seed, res, place, pinnedTime }) => {
      const $ = (id) => document.getElementById(id);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      /* Restore genuine rAF before each rebuild; the previous shot halted it. */
      window.__realRAF = window.__realRAF || window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = window.__realRAF;

      /* Rebuild through #regen with live rAF; halt only after deferred work. */
      $('res').value = res;
      $('seed').value = String(seed);
      $('regen').click();

      /* The loading overlay is the app's completion signal on the public
         path. The bounded loop turns a stalled build into a capture error. */
      for (let i = 0; i < 600 && $('load').style.display !== 'none'; i++) await sleep(50);
      if ($('load').style.display !== 'none') throw new Error('build did not finish');

      /* Drain one queued callback, then reject future rescheduling. */
      const realRAF = window.__realRAF;
      window.requestAnimationFrame = () => 0;
      await new Promise((r) => realRAF(() => r()));

      const W = window.__world;

      W.ensure(true);

      if (place === 'meadow' || place === 'hollow') {
        /* Seat the camera on the seed-dependent common with populate()'s
           world-coordinate relation. The common's x follows the generated
           trail, so a fixed x can clip a landmark. The Hollow's common is
           its hall: two floors, the Mirror, the village and the herd. */
        const S=W.scene;
        const common=S.gen.POI.find((p)=>p.kind==='village');
        if(!common) throw new Error(`${place} has no common`);
        S.px=common.x; S.py=common.y; S.lastPX=common.x; S.lastPY=common.y;
        S.camXf=S.px-W.W/2; S.camYf=S.py-W.H*0.56;
        S.ensure(true);
      } else if (place === 'swamp') {
        const S=W.scene;
        const landing=S.gen.POI.find((p)=>p.kind==='swampSettlement');
        if(!landing) throw new Error('swamp has no settlement landing');
        S.px=landing.x;S.py=landing.y;S.lastPX=landing.x;S.lastPY=landing.y;
        S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
        S.ensure(true);
      } else if (place === 'desert') {
        /* Seated at the oasis, where all four surfaces, the water optics and
           the haze share one frame. */
        const S=W.scene;
        const pool=S.gen.oasis;
        if(!pool) throw new Error('desert has no oasis');
        S.px=pool.x;S.py=pool.y;S.lastPX=pool.x;S.lastPY=pool.y;
        S.camXf=S.px-W.W/2;S.camYf=S.py-W.H*0.56;
        S.ensure(true);
      }

      /* Loading duration is not world time. Re-seat the canonical clock and
         rematerialize semantic records so rAF count cannot move an actor. */
      {
        const S=W.scene;
        S.lifeSession.clock.setMinute(171*1440+720);
        S.lifeRuntime.dispose();
        S.actors=S.lifeRuntime.reconcile(S.px,S.py,W.W,W.H);
        S.rotorClock=null;
      }

      /* Draw with dt=0 so render preserves the pinned time. */
      W.time = pinnedTime;
      const ui = {
        fog: +$('fog').value,
        quant: $('c-quant').checked,
        precipitation: $('c-precipitation').checked,
        wind: +$('wind').value,
        shadows: $('c-shadows').checked,
      };
      /* The frame is drawn under the app's own control defaults, with no
         second settings table. */
      W.render(0, ui);

      /* Read in the draw task: without preserveDrawingBuffer, async reads black. */
      const gl = W.renderer.getContext();
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);

      /* Histogrammed in the page: a quantised frame holds at most the scene's
         snap list, normally a few dozen entries, against half a megabyte of
         bytes across the Playwright boundary. */
      const hist = new Map();
      for (let i = 0; i < buf.length; i += 4) {
        const k = `${buf[i]},${buf[i + 1]},${buf[i + 2]}`;
        hist.set(k, (hist.get(k) || 0) + 1);
      }
      const colours = [...hist.entries()].sort((a, b) => b[1] - a[1]);

      return {
        w, h,
        scene: W.scene.id,
        internal: [W.W, W.H],
        /* The warm shift the frame was drawn under. Every output palette
           entry is warmShift'd by it, so the checker needs it. */
        warmth: W.warmth,
        snapEntries: W.outPal ? W.outPal.n : 0,
        pixels: w * h,
        distinct: colours.length,
        colours: colours.slice(0, 4096),
      };
    },
    { seed, res, place, pinnedTime: PINNED_TIME }
  );
}

/* A one-colour frame means the GL read failed (black) or the world never
   built (flat fill). WebGL readback can fail without throwing. */
const isUniform = (r) => r.distinct <= 1;

export async function captureAll(htmlPath, { onShot } = {}) {
  const url = pathToFileURL(resolve(htmlPath)).href;
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const results = {};
  try {
    /* One fresh page per shot: footprint and actor state, world-time
       accumulators and streamed entity positions cannot leak between shots,
       so a frame reproduces in any order. Page and console errors are
       collected per shot. */
    for (const shot of allShots()) {
      const name = shotName(shot.seed, shot.res, shot.place);
      const page = await browser.newPage();
      const problems = [];
      page.on('pageerror', (e) => problems.push(String(e.message)));
      page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
      try {
        const pageUrl=new URL(url);
        if(shot.place!=='outdoor')
          pageUrl.searchParams.set('at',shot.place);
        await page.goto(pageUrl.href);
        await page.waitForFunction('window.__ready===true', { timeout: 120000 });
        const r = await captureOne(page, shot);

        if (isUniform(r)) throw new Error(`${name}: frame is a single flat colour — GL read or build failed`);
        if (problems.length) throw new Error(`${name}: page errors\n  ` + problems.join('\n  '));

        results[name] = r;
        if (onShot) onShot(name, r);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

/* CLI: node test/capture.mjs [html] prints the colour census of each frame.
   test/frame-conformance.mjs measures the frame against the scene's snap
   list; test/golden/palette.json snapshots the colour authorities. */
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const htmlPath = process.argv[2] || 'dist/frostwood.html';
  const results = await captureAll(htmlPath, {
    onShot: (name, r) => console.log(
      `  ${name.padEnd(24)} ${r.w}x${r.h}  ${String(r.distinct).padStart(3)} colours`
      + `  top ${r.colours.slice(0, 3).map(([c, n]) =>
        `[${c}]x${(n / r.pixels * 100).toFixed(0)}%`).join(' ')}`),
  });
  console.log(`\n${Object.keys(results).length} frames from ${htmlPath}`);
}
