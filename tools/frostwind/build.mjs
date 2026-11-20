/* ═══════════════════════════════════════════════════════════════════════════
   Build

   Frostwood ships as one HTML file that opens from file://, with no server
   and no network. esbuild bundles src/main.js (including three) into one
   IIFE, inlined into src/index.html in place of the
   /*__BUNDLE__*​/ marker.

   Not minified: the source comments carry measured rationale and ship with
   the file.

   ── Three targets ───────────────────────
   `node build.mjs` builds dist/frostwood.html, the hand-off file and the
   target test/capture.mjs opens. Music is inlined as data URLs: BiomeMusic
   loads tracks with fetch() (src/music.js), and fetch of a relative path from
   file:// is blocked by the opaque origin. A data: URL is not.

   `--lab` builds dist/lab.html from lab/, a dev-only page with its own entry
   and shell, so a broken lab cannot disturb the game. The default build does
   not read lab/.

   `--web` builds dist/web/ for the served deployment, from the game's entry
   and shell. The three music tracks become files beside the page, and the
   page is precompressed. Measured: base64 is ~47% of the single file, 1.98 MB
   of it already-compressed MP3 that base64 inflates 4:3. Inlined, the page
   bottoms out near 2.56 MB brotli. De-embedded it is ~590 KB, and the audio
   arrives after first paint, cached under its content hash. The PNG and the
   two fonts stay inlined (~32 KB). This target needs a server.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as esbuild from 'esbuild';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MARKER = '/*__BUNDLE__*/';

const watch = process.argv.includes('--watch');

/* Targets are a table: each has its own entry and shell and shares only this
   file's machinery. `node build.mjs` with no flag reads src/ only. To add a
   target, add a row. */
const TARGETS = {
  game : { entry: 'src/main.js',   shell: 'src/index.html',   out: 'dist/frostwood.html',
           worker: true },
  lab  : { entry: 'lab/main.js',   shell: 'lab/index.html',   out: 'dist/lab.html',
           worker: false, openByHand: true },
  web  : { entry: 'src/main.js',   shell: 'src/index.html',   out: 'dist/web/index.html',
           worker: true, externalAudio: true, precompress: true },
};
const which = Object.keys(TARGETS).find((k) => k !== 'game' && process.argv.includes(`--${k}`))
              || 'game';
const TARGET = TARGETS[which];
const ENTRY = resolve(ROOT, TARGET.entry);
const SHELL = resolve(ROOT, TARGET.shell);
const OUT = resolve(ROOT, TARGET.out);
const CHUNK_WORKER = resolve(ROOT, 'src/chunk-worker.js');

/* The shipped file opens from file://, where a module-worker URL has no second
   file to resolve. Bundle the worker into a string and let Scene make a Blob
   URL. The committed source module stays empty so Node tests keep the
   synchronous fallback. */
const workerSourcePlugin = {
  name: 'inline-chunk-worker',
  setup(build) {
    let source = '';
    build.onStart(async () => {
      const result = await esbuild.build({
        entryPoints: [CHUNK_WORKER],
        bundle: true,
        format: 'iife',
        platform: 'browser',
        target: 'es2022',
        minify: true,
        legalComments: 'none',
        write: false,
        logLevel: 'silent',
      });
      source = result.outputFiles[0].text;
    });
    build.onResolve({ filter: /chunk-worker-source\.js$/ }, () => ({
      path: 'chunk-worker-source',
      namespace: 'frostwind-worker',
    }));
    build.onLoad({ filter: /.*/, namespace: 'frostwind-worker' }, () => ({
      /* Base64 stops the outer non-minified build re-escaping the worker's
         shader strings. Literal embedding inflates 514 KB of worker code to
         more than 7 MB. */
      contents: `export default atob("${Buffer.from(source).toString('base64')}");`,
      loader: 'js',
      watchFiles: [CHUNK_WORKER],
    }));
  },
};

/* `import x from './file?optional'`: a file with no redistribution grant is
   absent from a public tree (assets/music/CREDITS.md). Present, it loads by
   its extension. Absent, it bundles as null and its reader names the
   substitute. */
const optionalAssetPlugin = {
  name: 'optional-asset',
  setup(build) {
    build.onResolve({ filter: /\?optional$/ }, (args) => {
      const path = resolve(args.resolveDir, args.path.replace(/\?optional$/, ''));
      return existsSync(path) ? { path } : { path, namespace: 'absent-asset' };
    });
    build.onLoad({ filter: /.*/, namespace: 'absent-asset' },
      () => ({ contents: 'export default null;', loader: 'js' }));
  },
};

/* The entry bundle is the one JS output. With the `file` loader the result
   also carries the audio, which goes to disk untouched. */
const isEntryBundle = (f) => f.path.endsWith('.js');

async function emit(files) {
  const shell = await readFile(SHELL, 'utf8');
  if (!shell.includes(MARKER)) throw new Error(`${TARGET.shell} has no ${MARKER} marker`);

  const entry = files.find(isEntryBundle) || (files.length === 1 ? files[0] : null);
  if (!entry) throw new Error('esbuild produced no JS bundle');

  /* A literal </script> in the bundle would close the tag early. */
  const safe = entry.text.replaceAll('</script>', '<\\/script>');
  const html = shell.replace(MARKER, safe);

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, html);

  for (const file of files) {
    if (file === entry) continue;
    const dest = resolve(dirname(OUT), file.path.slice(dirname(entry.path).length + 1));
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.contents);
  }

  /* Precompressed once at build time at the highest level: per-request
     compression forces a cheap level. nginx:alpine has no brotli module, and
     the Fly proxy's brotli leaves 374 KB against brotli -11 on the same
     bytes. */
  if (TARGET.precompress) {
    const raw = Buffer.from(html);
    await writeFile(`${OUT}.br`, brotliCompressSync(raw, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
      },
    }));
    await writeFile(`${OUT}.gz`, gzipSync(raw, { level: 9 }));
  }

  return { bytes: html.length, files };
}

const options = {
  entryPoints: [ENTRY],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: false,
  legalComments: 'inline',
  /* The game is one hand-offable file: imported music is a data URL inside
     the bundle. Only --web externalises, and only .mp3. */
  loader: {
    '.mp3'  : TARGET.externalAudio ? 'file' : 'dataurl',
    '.wav'  : 'dataurl',
    '.png'  : 'dataurl',
    '.woff2': 'dataurl',
  },
  write: false,
  logLevel: 'info',
  plugins: [optionalAssetPlugin, ...(TARGET.worker ? [workerSourcePlugin] : [])],
  /* `file` emits real files, so esbuild needs an outdir and a URL. Absolute:
     the page is served from the root and the inlined bundle has no path of
     its own. */
  ...(TARGET.externalAudio ? {
    outdir: dirname(OUT),
    assetNames: 'audio/[name]-[hash]',
    publicPath: '/',
  } : {}),
};

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [...options.plugins, {
      name: 'inline-into-shell',
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length) return;
          const { bytes } = await emit(result.outputFiles);
          console.log(`  ${TARGET.out}  ${(bytes / 1024).toFixed(0)} KB`);
        });
      },
    }],
  });
  await ctx.watch();
  console.log(`watching ${dirname(TARGET.entry)}/ …`);
} else {
  const result = await esbuild.build(options);
  const { bytes, files } = await emit(result.outputFiles);
  console.log(`  ${TARGET.out}  ${(bytes / 1024).toFixed(0)} KB`);

  /* A visitor pays the compressed page plus what it fetches, so the build
     prints both. */
  if (TARGET.precompress) {
    const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
    const aside = files.filter((f) => !isEntryBundle(f));
    const asideBytes = aside.reduce((n, f) => n + f.contents.length, 0);
    console.log(`  ${TARGET.out}.br  ${kb((await readFile(`${OUT}.br`)).length)}  ← first load`);
    console.log(`  ${aside.length} file(s) beside it  ${kb(asideBytes)}  fetched on demand`);
  }

  /* The lab is opened by hand from file://, so the build prints the path. */
  if (TARGET.openByHand) console.log(`\n  open it:  ${OUT}\n`);
}
