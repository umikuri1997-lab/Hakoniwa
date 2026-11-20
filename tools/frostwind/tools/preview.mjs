/* DETERMINISTIC THREE-WORLD PREVIEW.

   This dev-only tool uses the same browser and WebGL readback path as shot.mjs.
   The native 960x540 frame scales by two to 1920x1080 with nearest-neighbour
   sampling, so the encoded video preserves the pixel grid. */

import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const val = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const DRAFT = flag('draft');
const FPS = 30;
const SEGMENT_SECONDS = DRAFT ? 1 : 8;
const FRAMES_PER_SEGMENT = FPS * SEGMENT_SECONDS;
const INTERNAL = DRAFT ? [480, 270] : [960, 540];
const SCALE = 2;
const TOTAL_FRAMES = FRAMES_PER_SEGMENT * 3;
const WORLD_SECONDS = TOTAL_FRAMES / FPS;
const INTRO_SECONDS = DRAFT ? 1.2 : 3;
const OUTRO_SECONDS = DRAFT ? 2 : 6;
const DURATION_SECONDS = INTRO_SECONDS + WORLD_SECONDS + OUTRO_SECONDS;
const OUTPUT_FRAMES = Math.round(DURATION_SECONDS * FPS);
const PINNED_TIME = 12.5;
const SEED = Number.parseInt(val('seed', '20260727'), 10);
const HTML = resolve(ROOT, val('html', 'dist/frostwood.html'));
const defaultName = DRAFT ? 'frostwind-preview-draft.mp4' : 'frostwind-preview.mp4';
const OUT = resolve(ROOT, val('out', `artifacts/preview/${defaultName}`));
const RESOLUTION = `${INTERNAL[0]}x${INTERNAL[1]}`;
const OUTPUT = [INTERNAL[0] * SCALE, INTERNAL[1] * SCALE];

const SHOTS = Object.freeze([
  Object.freeze({
    scene: 'frostwood',
    name: 'Frostwood',
    anchor: 'village',
    travelX: 132,
    travelY: 54,
    traveller: Object.freeze({ dx: -48, dy: 28, vx: 15, vy: 3 }),
    music: resolve(ROOT, 'assets/music/veil-of-dreams.mp3'),
  }),
  Object.freeze({
    scene: 'meadow',
    name: 'Sun Meadow',
    anchor: 'village',
    travelX: 120,
    travelY: 48,
    traveller: Object.freeze({ dx: 0, dy: -64, vx: 0, vy: 16, path: true }),
    /* Optional file: assets/music/CREDITS.md. */
    music: [resolve(ROOT, 'assets/music/sunny-stroll.mp3'),
      resolve(ROOT, 'assets/music/veil-of-dreams.mp3')].find(existsSync),
  }),
  Object.freeze({
    scene: 'swamp',
    name: 'Green Swamp',
    anchor: 'swampLakehouse',
    travelX: 108,
    travelY: 42,
    traveller: Object.freeze({ dx: 0, dy: 0, vx: 0, vy: 0, stand: true }),
    music: resolve(ROOT, 'assets/music/lily-paddling-down-the-stream.mp3'),
  }),
]);

const LAUNCH_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
];

async function requireFile(path, label) {
  try {
    await access(path);
  } catch {
    throw new Error(`${label} is missing at ${path}`);
  }
}

function requireCommand(command) {
  const check = spawnSync(command, ['-version'], { stdio: 'ignore' });
  if (check.error || check.status !== 0) {
    throw new Error(`${command} is required on PATH`);
  }
}

function ffmpegColor(css) {
  const channels = css.match(/\d+(?:\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`unsupported title background ${css}`);
  return `0x${channels.slice(0, 3)
    .map((channel) => Math.round(Number(channel)).toString(16).padStart(2, '0'))
    .join('')}`;
}

function startEncoder(width, height, titles) {
  const titleDuration = DRAFT ? 0.7 : 1.5;
  const titleFade = DRAFT ? 0.15 : 0.3;
  const audioFade = DRAFT ? 0.15 : 0.35;
  const args = [
    '-hide_banner',
    '-loglevel', 'warning',
    '-y',
    '-f', 'rawvideo',
    '-pixel_format', 'rgba',
    '-video_size', `${width}x${height}`,
    '-framerate', String(FPS),
    '-i', 'pipe:0',
  ];
  for (const shot of SHOTS) {
    args.push('-stream_loop', '-1', '-i', shot.music);
  }
  const titleCards = [...titles.worlds, titles.intro, titles.outro];
  for (const card of titleCards) {
    args.push('-loop', '1', '-framerate', String(FPS), '-i', card);
  }

  const filters = [
    `[0:v]vflip,scale=${OUTPUT[0]}:${OUTPUT[1]}:flags=neighbor[base]`,
  ];
  let video = 'base';
  for (let i = 0; i < SHOTS.length; i++) {
    const start = i * SEGMENT_SECONDS;
    const cardInput = 1 + SHOTS.length + i;
    const card = `title${i}`;
    const nextVideo = `video${i}`;
    filters.push(
      `[${cardInput}:v]format=rgba,` +
      `fade=t=in:st=0:d=${titleFade}:alpha=1,` +
      `fade=t=out:st=${titleDuration - titleFade}:d=${titleFade}:alpha=1,` +
      `setpts=PTS+${start}/TB[${card}]`,
    );
    filters.push(
      `[${video}][${card}]overlay=x=(W-w)/2:y=(H-h)/2:eof_action=pass:` +
      `enable='between(t,${start},${start + titleDuration})'[${nextVideo}]`,
    );
    video = nextVideo;

    const audioDuration = i === 0
      ? INTRO_SECONDS + SEGMENT_SECONDS
      : i === SHOTS.length - 1
        ? SEGMENT_SECONDS + OUTRO_SECONDS
        : SEGMENT_SECONDS;
    const fadeOutAt = audioDuration - audioFade;
    filters.push(
      `[${1 + i}:a]atrim=duration=${audioDuration},asetpts=PTS-STARTPTS,` +
      `volume=0.30,afade=t=in:st=0:d=${audioFade},` +
      `afade=t=out:st=${fadeOutAt}:d=${audioFade}[audio${i}]`,
    );
  }

  const introInput = 1 + SHOTS.length * 2;
  const outroInput = introInput + 1;
  const introFade = DRAFT ? 0.25 : 0.65;
  const outroFade = DRAFT ? 0.25 : 0.5;
  filters.push(
    `color=c=${titles.background}:s=${OUTPUT[0]}x${OUTPUT[1]}:` +
    `r=${FPS}:d=${INTRO_SECONDS}[introBackground]`,
  );
  filters.push(
    `[${introInput}:v]format=rgba,trim=duration=${INTRO_SECONDS},` +
    `fade=t=in:st=0:d=${introFade}:alpha=1,` +
    `fade=t=out:st=${INTRO_SECONDS - introFade}:d=${introFade}:alpha=1,` +
    `setpts=PTS-STARTPTS[introCard]`,
  );
  filters.push(
    `[introBackground][introCard]overlay=x=(W-w)/2:` +
    `y=(H-h)/2+18-${18 / INTRO_SECONDS}*t:shortest=1[introVideo]`,
  );
  filters.push(
    `color=c=${titles.background}:s=${OUTPUT[0]}x${OUTPUT[1]}:` +
    `r=${FPS}:d=${OUTRO_SECONDS}[outroBackground]`,
  );
  filters.push(
    `[${outroInput}:v]format=rgba,trim=duration=${OUTRO_SECONDS},` +
    `fade=t=in:st=0:d=${outroFade}:alpha=1,` +
    `fade=t=out:st=${OUTRO_SECONDS - outroFade}:d=${outroFade}:alpha=1,` +
    `setpts=PTS-STARTPTS[outroCard]`,
  );
  filters.push(
    `[outroBackground][outroCard]overlay=x=(W-w)/2:` +
    `y=(H-h)/2+12-${12 / OUTRO_SECONDS}*t:shortest=1[outroVideo]`,
  );
  filters.push(
    `[introVideo][${video}][outroVideo]concat=n=3:v=1:a=0[completeVideo]`,
  );
  filters.push(
    SHOTS.map((_, i) => `[audio${i}]`).join('') +
    `concat=n=${SHOTS.length}:v=0:a=1[audio]`,
  );

  args.push(
    '-filter_complex', filters.join(';'),
    '-map', '[completeVideo]',
    '-map', '[audio]',
    '-t', String(DURATION_SECONDS),
    '-c:v', 'libx264',
    '-preset', DRAFT ? 'veryfast' : 'medium',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    OUT,
  );
  const child = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  const state = { child, stderr: '', stdinError: null };
  child.stderr.on('data', (chunk) => {
    state.stderr = (state.stderr + chunk).slice(-16000);
  });
  child.stdin.on('error', (error) => {
    state.stdinError = error;
  });
  state.done = new Promise((resolveDone) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolveDone(result);
    };
    child.once('error', (error) => finish({ code: null, error }));
    child.once('close', (code, signal) => finish({ code, signal }));
  });
  return state;
}

async function captureTitleCards(browser, directory) {
  const page = await browser.newPage({
    viewport: { width: 960, height: 540 },
    deviceScaleFactor: 2,
  });
  const worlds = [];
  try {
    const pageUrl = new URL(pathToFileURL(HTML).href);
    pageUrl.searchParams.set('at', 'frostwood');
    await page.goto(pageUrl.href);
    await page.waitForFunction('window.__ready === true', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const modal = document.querySelector('.title-modal');
      if (!modal) throw new Error('main-menu title container is unavailable');
      const style = getComputedStyle(modal);
      const background = getComputedStyle(document.body).backgroundColor;
      const sources = {};
      for (const source of document.querySelectorAll('.world[data-scene]')) {
        sources[source.dataset.scene] = source.innerHTML;
      }
      for (const child of document.body.children) child.style.visibility = 'hidden';
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.className = '';

      const card = document.createElement('div');
      card.id = 'preview-world-title';
      Object.assign(card.style, {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        width: '360px',
        minHeight: '76px',
        padding: '14px 18px',
        background: style.backgroundColor,
        border: style.border,
        boxShadow: style.boxShadow,
        fontFamily: style.fontFamily,
        visibility: 'visible',
      });
      document.body.appendChild(card);
      window.__previewTitle = { card, sources, background };
    });

    for (const shot of SHOTS) {
      await page.evaluate((scene) => {
        const state = window.__previewTitle;
        const content = state.sources[scene];
        if (!content) throw new Error(`main menu has no ${scene} title`);
        state.card.replaceChildren();
        Object.assign(state.card.style, {
          width: '360px',
          minHeight: '76px',
          padding: '14px 18px',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          textAlign: 'left',
        });
        const row = document.createElement('div');
        row.className = 'world';
        row.dataset.scene = scene;
        row.innerHTML = content;
        Object.assign(row.style, {
          cursor: 'default',
          margin: '0',
          padding: '8px 10px',
          pointerEvents: 'none',
        });
        state.card.appendChild(row);
      }, shot.scene);
      const path = resolve(directory, `${shot.scene}.png`);
      await page.locator('#preview-world-title').screenshot({
        path,
        animations: 'disabled',
        omitBackground: true,
      });
      worlds.push(path);
    }

    await page.evaluate(() => {
      const card = window.__previewTitle.card;
      Object.assign(card.style, {
        width: '540px',
        minHeight: '250px',
        padding: '34px 38px',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
      });
      card.innerHTML = `
        <p class="title-tagline" style="margin:0 0 18px;color:rgba(255,255,255,.56)">
          The vision
        </p>
        <h1 class="title-brand">Project: Frostwind</h1>
        <p class="title-tagline" style="margin:12px 0 18px">
          A nature-grounded world compiler
        </p>
        <p style="margin:0;color:#d6e1ec;font:400 16px/1.3 'Pixelify Sans',monospace;
          letter-spacing:.1em;text-transform:uppercase">
          Real physics. Imaginary worlds.
        </p>`;
    });
    const intro = resolve(directory, 'intro.png');
    await page.locator('#preview-world-title').screenshot({
      path: intro,
      animations: 'disabled',
      omitBackground: true,
    });

    await page.evaluate(() => {
      const card = window.__previewTitle.card;
      Object.assign(card.style, {
        width: '620px',
        minHeight: '330px',
        padding: '34px 42px',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
      });
      card.innerHTML = `
        <p class="title-tagline" style="margin:0 0 16px;color:rgba(255,255,255,.56)">
          What makes Frostwind special
        </p>
        <h1 class="title-brand" style="font-size:28px">
          Meaning goes in.<br>A world comes out.
        </h1>
        <div style="width:100%;margin:24px 0 18px;border-top:1px solid
          rgba(255,255,255,.10)"></div>
        <div style="display:flex;justify-content:center;gap:22px;color:#c3ceda;
          font:400 13px/1.4 'Pixelify Sans',monospace;letter-spacing:.08em;
          text-transform:uppercase">
          <span>Physically grounded</span>
          <span>Deterministic by seed</span>
          <span>Built to be checked</span>
        </div>
        <p class="title-tagline" style="margin:24px 0 0">
          Nature · life · culture · craft
        </p>`;
    });
    const outro = resolve(directory, 'outro.png');
    await page.locator('#preview-world-title').screenshot({
      path: outro,
      animations: 'disabled',
      omitBackground: true,
    });
    const background = await page.evaluate(() => window.__previewTitle.background);
    return { worlds, intro, outro, background: ffmpegColor(background) };
  } finally {
    await page.close();
  }
}

async function writeFrame(encoder, bytes) {
  if (encoder.stdinError) throw encoder.stdinError;
  if (encoder.child.stdin.write(bytes)) return;
  await new Promise((resolveDrain, rejectDrain) => {
    const input = encoder.child.stdin;
    const onDrain = () => {
      cleanup();
      resolveDrain();
    };
    const onError = (error) => {
      cleanup();
      rejectDrain(error);
    };
    const onClose = () => {
      cleanup();
      rejectDrain(new Error('ffmpeg closed its input before the preview finished'));
    };
    const cleanup = () => {
      input.off('drain', onDrain);
      input.off('error', onError);
      input.off('close', onClose);
    };
    input.once('drain', onDrain);
    input.once('error', onError);
    input.once('close', onClose);
  });
}

async function prepareShot(page, shot) {
  const pageUrl = new URL(pathToFileURL(HTML).href);
  pageUrl.searchParams.set('at', shot.scene);
  await page.goto(pageUrl.href);
  await page.waitForFunction('window.__ready === true', null, { timeout: 120000 });

  return page.evaluate(async (options) => {
    const $ = (id) => document.getElementById(id);
    const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

    window.__realRAF = window.__realRAF || window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = window.__realRAF;
    $('res').value = options.resolution;
    $('seed').value = String(options.seed);
    $('regen').click();
    for (let i = 0; i < 600 && $('load').style.display !== 'none'; i++) {
      await sleep(50);
    }
    if ($('load').style.display !== 'none') throw new Error('world build did not finish');

    const realRAF = window.__realRAF;
    window.requestAnimationFrame = () => 0;
    await new Promise((resolveFrame) => realRAF(resolveFrame));

    const W = window.__world;
    const S = W.scene;
    const anchor = S.gen.POI.find((point) => point.kind === options.anchor);
    if (!anchor) throw new Error(`${S.id} has no ${options.anchor} preview anchor`);
    const focus = anchor.kind === 'swampLakehouse'
      ? { x: anchor.pond.cx, y: anchor.pond.cy }
      : anchor;
    const stand = anchor.kind === 'swampLakehouse'
      ? { x: anchor.deck.x, y: anchor.deck.y }
      : anchor;

    S.px = stand.x;
    S.py = stand.y;
    S.lastPX = stand.x;
    S.lastPY = stand.y;
    S.camXf = Math.round(focus.x - W.W / 2 - options.travelX / 2);
    S.camYf = Math.round(focus.y - W.H * 0.56 - options.travelY / 2);
    S.ensure(true);

    S.lifeSession.clock.setMinute(171 * 1440 + 720);
    S.lifeRuntime.dispose();
    S.actors = S.lifeRuntime.reconcile(S.px, S.py, W.W, W.H);
    const frostPeople = [];
    if (S.id === 'frostwood') {
      let people = 0;
      S.actors = S.actors.filter((actor) => {
        if (!window.__fw.ACTOR[actor.key]?.figure) return true;
        people++;
        if (people <= 2) frostPeople.push(actor);
        return people <= 2;
      });
    }
    if (S.id === 'meadow') {
      S.actors = S.actors.filter((actor) => !window.__fw.ACTOR[actor.key]?.machine);
    }
    const movers = [];
    const dryStage = (row) => {
      const duration = options.frames / 30;
      const offsets = [];
      for (let oy = -100; oy <= 20; oy += 20) {
        for (let ox = -120; ox <= 120; ox += 20) offsets.push({ ox, oy });
      }
      offsets.sort((a, b) => Math.hypot(a.ox, a.oy) - Math.hypot(b.ox, b.oy));
      for (const offset of offsets) {
        const x = focus.x + row.dx + offset.ox;
        const y = focus.y + row.dy + offset.oy;
        let dry = true;
        for (let step = 0; step <= 12; step++) {
          const t = step / 12;
          const traversal = S.gen.traversalAt(
            x + row.vx * duration * t,
            y + row.vy * duration * t,
          );
          if (!traversal.walk || traversal.medium !== 'dry') {
            dry = false;
            break;
          }
          if (row.requireOpen && S.blocked(
            x + row.vx * duration * t,
            y + row.vy * duration * t,
          )) {
            dry = false;
            break;
          }
        }
        if (dry) return { x, y };
      }
      throw new Error(`${row.key} has no dry preview route near ${focus.x},${focus.y}`);
    };
    const addMover = (row) => {
      const F = window.__fw.ACTOR[row.key];
      if (!F) throw new Error(`preview actor ${row.key} is unavailable`);
      const speed = Math.hypot(row.vx, row.vy) || 1;
      const point = row.requireDry
        ? dryStage(row)
        : { x: focus.x + row.dx, y: focus.y + row.dy };
      const { x, y } = point;
      const actor = {
        id: `preview:${S.id}:${row.key}:${movers.length}`,
        key: row.key,
        x,
        y,
        hx: row.vx / speed,
        hy: row.vy / speed,
        gx: x + row.vx * options.frames / 30,
        gy: y + row.vy * options.frames / 30,
        ramp: F.ramp,
        ramp2: F.ramp2,
        sMin: F.sMin,
        sMax: F.sMax,
        dMin: F.dMin,
        dMax: F.dMax,
        vol: F.vol,
        rest: 0,
        dash: 99,
        flee: 0,
        gait: row.gait || 0,
        acc: 0,
        flip: row.vx < 0,
        moving: true,
        motionState: row.state || F.moveState || 'walk',
      };
      S.actors.push(actor);
      movers.push({
        actor,
        x,
        y,
        vx: row.vx,
        vy: row.vy,
        gait: actor.gait,
        rate: F.clips?.[actor.motionState]?.rate || F.gait || 4,
      });
    };
    frostPeople.forEach((actor, index) => {
      const point = dryStage({
        key: actor.key,
        dx: index === 0 ? -48 : 48,
        dy: -92,
        vx: 0,
        vy: 0,
        requireOpen: true,
      });
      actor.x = point.x;
      actor.y = point.y;
      actor.gx = point.x;
      actor.gy = point.y;
      actor.moving = false;
    });
    const staged = S.id === 'frostwood'
      ? [
          { key: 'roeDeer', dx: -190, dy: 12, vx: 48, vy: -2, gait: 0, state: 'gallop' },
          { key: 'roeDeer', dx: -92, dy: 28, vx: 44, vy: -1, gait: 2, state: 'gallop' },
          { key: 'roeDeer', dx: 18, dy: 16, vx: 50, vy: 2, gait: 5, state: 'gallop' },
          { key: 'roeDeer', dx: 176, dy: -6, vx: -42, vy: 1, gait: 1, state: 'gallop' },
        ]
      : S.id === 'meadow'
        ? [
            { key: 'colossus', dx: -150, dy: 12, vx: 7, vy: -1, gait: 0, requireDry: true },
            { key: 'strider', dx: 36, dy: 36, vx: 9, vy: 1, gait: 3, requireDry: true },
          ]
        : [
            { key: 'alligator', dx: -94, dy: 20, vx: 14, vy: 1, gait: 0, state: 'swim' },
            { key: 'heron', dx: 76, dy: 28, vx: -6, vy: 0, gait: 2, state: 'wade' },
            { key: 'turtle', dx: -24, dy: -50, vx: 5, vy: 1, gait: 1, state: 'crawl' },
          ];
    for (const row of staged) addMover(row);
    const traveller = options.traveller.stand
      ? { x: stand.x, y: stand.y }
      : options.traveller.path
      ? {
          x: S.gen.pathX(focus.y + options.traveller.dy) + options.traveller.dx,
          y: focus.y + options.traveller.dy,
        }
      : dryStage({...options.traveller, key: 'traveller'});
    S.px = traveller.x;
    S.py = traveller.y;
    S.lastPX = traveller.x;
    S.lastPY = traveller.y;
    S.dir = options.traveller.path && options.traveller.vy > 0 ? 0 : 2;
    S.faceLeft = options.traveller.vx < 0;
    S.moving = !options.traveller.stand;
    S.locomotionState = options.traveller.stand ? 'idle' : 'walk';
    S.rotorClock = null;
    W.time = options.pinnedTime;

    window.__preview = {
      W,
      S,
      startX: S.camXf,
      startY: S.camYf,
      frames: options.frames,
      travelX: options.travelX,
      travelY: options.travelY,
      pinnedTime: options.pinnedTime,
      movers,
      traveller: {
        ...traveller,
        vx: options.traveller.vx,
        vy: options.traveller.vy,
        path: options.traveller.path,
        stand: options.traveller.stand,
      },
      ui: {
        fog: +$('fog').value,
        quant: $('c-quant').checked,
        precipitation: $('c-precipitation').checked,
        wind: +$('wind').value,
        shadows: $('c-shadows').checked,
      },
    };

    const gl = W.renderer.getContext();
    return {
      scene: S.id,
      anchor: [focus.x, focus.y],
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
    };
  }, {
    anchor: shot.anchor,
    frames: FRAMES_PER_SEGMENT,
    pinnedTime: PINNED_TIME,
    resolution: RESOLUTION,
    seed: SEED,
    travelX: shot.travelX,
    travelY: shot.travelY,
    traveller: shot.traveller,
  });
}

async function captureFrame(page, frame) {
  return page.evaluate(({ frame, fps }) => {
    const preview = window.__preview;
    if (!preview) throw new Error('preview state is unavailable');
    const {
      W, S, startX, startY, frames, travelX, travelY, pinnedTime, movers, traveller, ui,
    } = preview;
    const t = frames <= 1 ? 1 : frame / (frames - 1);
    const eased = t * t * (3 - 2 * t);
    const seconds = frame / fps;
    S.camXf = startX + Math.round(travelX * eased);
    S.camYf = startY + Math.round(travelY * eased);
    for (const mover of movers) {
      mover.actor.x = mover.x + mover.vx * seconds;
      mover.actor.y = mover.y + mover.vy * seconds;
      mover.actor.gait = mover.gait + mover.rate * seconds;
    }
    const nextPY = traveller.y + traveller.vy * seconds;
    const nextPX = traveller.path
      ? S.gen.pathX(nextPY) + traveller.vx * seconds
      : traveller.x + traveller.vx * seconds;
    S.advanceTravellerLocomotion(nextPX - S.px, nextPY - S.py, 1 / fps);
    S.px = nextPX;
    S.py = nextPY;
    S.updateTravellerAttention(1 / fps);
    W.time = pinnedTime + seconds;
    S.ensure(true);
    W.render(1 / fps, ui);

    const gl = W.renderer.getContext();
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let uniform = true;
    for (let i = 4; i < pixels.length; i += 4) {
      if (pixels[i] !== pixels[0] ||
          pixels[i + 1] !== pixels[1] ||
          pixels[i + 2] !== pixels[2]) {
        uniform = false;
        break;
      }
    }

    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < pixels.length; i += chunk) {
      binary += String.fromCharCode(...pixels.subarray(i, i + chunk));
    }
    return { width, height, uniform, rgba: btoa(binary) };
  }, { frame, fps: FPS });
}

await requireFile(HTML, 'built Frostwind HTML');
for (const shot of SHOTS) await requireFile(shot.music, `${shot.name} preview music`);
requireCommand('ffmpeg');
await mkdir(dirname(OUT), { recursive: true });

let browser = null;
let encoder = null;
let titleDirectory = null;
let complete = false;
let captured = 0;

try {
  browser = await chromium.launch({ args: LAUNCH_ARGS });
  titleDirectory = await mkdtemp(resolve(dirname(OUT), '.preview-titles-'));
  const titles = await captureTitleCards(browser, titleDirectory);

  for (const shot of SHOTS) {
    const page = await browser.newPage();
    const problems = [];
    page.on('pageerror', (error) => problems.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(message.text());
    });

    try {
      const setup = await prepareShot(page, shot);
      if (setup.scene !== shot.scene) {
        throw new Error(`requested ${shot.scene}, received ${setup.scene}`);
      }
      if (setup.width !== INTERNAL[0] || setup.height !== INTERNAL[1]) {
        throw new Error(
          `${shot.name} rendered ${setup.width}x${setup.height}, expected ${RESOLUTION}`,
        );
      }
      if (!encoder) encoder = startEncoder(setup.width, setup.height, titles);

      console.log(
        `${shot.name}: ${FRAMES_PER_SEGMENT} frames from ${setup.anchor[0]},${setup.anchor[1]}`,
      );
      for (let frame = 0; frame < FRAMES_PER_SEGMENT; frame++) {
        const result = await captureFrame(page, frame);
        if (result.width !== setup.width || result.height !== setup.height) {
          throw new Error(`${shot.name} changed drawing-buffer dimensions during capture`);
        }
        if (result.uniform) {
          throw new Error(`${shot.name} frame ${frame + 1} is a single flat colour`);
        }
        await writeFrame(encoder, Buffer.from(result.rgba, 'base64'));
        captured++;
        if ((frame + 1) % FPS === 0) {
          console.log(`${shot.name}: ${frame + 1}/${FRAMES_PER_SEGMENT}`);
        }
      }
      if (problems.length) {
        throw new Error(`${shot.name} browser errors:\n${problems.join('\n')}`);
      }
    } finally {
      await page.close();
    }
  }

  if (!encoder) throw new Error('no preview frames were captured');
  if (captured !== TOTAL_FRAMES) {
    throw new Error(`captured ${captured} frames, expected ${TOTAL_FRAMES}`);
  }
  encoder.child.stdin.end();
  const result = await encoder.done;
  if (result.error || result.code !== 0) {
    const reason = result.error?.message || `exit ${result.code}${result.signal ? ` (${result.signal})` : ''}`;
    throw new Error(`ffmpeg failed with ${reason}\n${encoder.stderr}`.trim());
  }
  complete = true;
  console.log(
    `${OUT}  ${OUTPUT[0]}x${OUTPUT[1]}  ${FPS} fps  ${DURATION_SECONDS}s  ` +
    `${captured} world frames  ${OUTPUT_FRAMES} output frames`,
  );
} finally {
  if (browser) await browser.close();
  if (titleDirectory) await rm(titleDirectory, { recursive: true, force: true });
  if (!complete) {
    if (encoder && encoder.child.exitCode === null) {
      encoder.child.stdin.destroy();
      encoder.child.kill('SIGTERM');
      await encoder.done;
    }
    await rm(OUT, { force: true });
  }
}
