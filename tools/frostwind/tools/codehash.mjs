#!/usr/bin/env node
/* Which edited files changed CODE, and which changed only comments.

   A prose pass must leave code identical. Minifying a file drops comments and
   whitespace and renames locals the same way each time, so two versions with
   equal minified text are the same program. This compares each edited .js/.mjs
   file with its version at a git ref.

     node tools/codehash.mjs                 against HEAD, every edited file
     node tools/codehash.mjs --ref main      against another ref
     node tools/codehash.mjs src/life.js …   only the named files
     node tools/codehash.mjs --strict …      exit 1 when any named file changed code

   A GLSL comment sits inside a template string, so it counts as code here. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = createRequire(join(ROOT, 'package.json'))('esbuild');
const argv = process.argv.slice(2);
const refAt = argv.indexOf('--ref');
const ref = refAt >= 0 ? argv[refAt + 1] : 'HEAD';
const strict = argv.includes('--strict');
const named = argv.filter((a, i) => !a.startsWith('--') && (refAt < 0 || i !== refAt + 1));

const git = (...args) => execFileSync('git', args, {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'],
});
const minify = (code) => esbuild.transformSync(code, {
  minify: true, loader: 'js', format: 'esm', legalComments: 'none',
}).code;

const edited = named.length ? named : [
  ...git('diff', '--name-only', ref).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter((f) => /\.m?js$/.test(f));

const report = { comments: [], code: [], added: [], deleted: [] };
for (const file of [...new Set(edited)].sort()) {
  let before = null, after = null;
  try { before = git('show', `${ref}:${file}`); } catch { /* absent at the ref */ }
  try { after = readFileSync(join(ROOT, file), 'utf8'); } catch { /* deleted */ }
  if (before === null && after === null) continue;
  if (before === null) report.added.push(file);
  else if (after === null) report.deleted.push(file);
  else if (before === after) continue;
  else (minify(before) === minify(after) ? report.comments : report.code).push(file);
}

const show = (title, files) => { if (files.length) console.log(`${title} (${files.length})\n${files.map((f) => `  ${f}`).join('\n')}`); };
show('comments only', report.comments);
show('CODE CHANGED', report.code);
show('added', report.added);
show('deleted', report.deleted);
if (!edited.length) console.log(`no edited .js or .mjs file against ${ref}`);
if (strict && (report.code.length || report.added.length || report.deleted.length)) process.exitCode = 1;
