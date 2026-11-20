#!/usr/bin/env node
/* One rule set, two loaders. `.claude/rules/*.md` is the source. This writes the
   Cursor mirror, `.cursor/rules/*.mdc`: `paths:` becomes `globs:`, a rule with
   no paths becomes `alwaysApply: true`, and the description is the first
   heading. Edit the .md, then run `npm run rules`.

     node tools/sync-rules.mjs            write the mirror
     node tools/sync-rules.mjs --check    exit 1 when the mirror is stale */
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '.claude/rules', MIRROR = '.cursor/rules';

export function mirrorOf(text) {
  const front = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  const body = (front ? text.slice(front[0].length) : text).replace(/^\n+/, '');
  const paths = front ? [...front[1].matchAll(/^\s*-\s*"(.+?)"\s*$/gm)].map((m) => m[1]) : [];
  const heading = body.match(/^# (.+)$/m)?.[1];
  if (!heading) throw new Error('a rule needs a first-level heading; it is the Cursor description');
  const globs = paths.length > 1 ? `{${paths.join(',')}}` : paths[0];
  return [
    '---',
    `description: ${heading}`,
    ...(globs ? [`globs: "${globs}"`] : []),
    `alwaysApply: ${paths.length ? 'false' : 'true'}`,
    '---',
    '',
    body.replace(/\.claude\/rules\/([\w-]+)\.md/g, '.cursor/rules/$1.mdc'),
  ].join('\n');
}

export async function syncRules({ check = false, root = ROOT } = {}) {
  const stale = [];
  const names = (await readdir(join(root, SOURCE))).filter((n) => n.endsWith('.md')).map((n) => n.slice(0, -3));
  for (const name of names) {
    const want = mirrorOf(await readFile(join(root, SOURCE, `${name}.md`), 'utf8'));
    const path = join(root, MIRROR, `${name}.mdc`);
    const have = await readFile(path, 'utf8').catch(() => null);
    if (have === want) continue;
    stale.push(`${MIRROR}/${name}.mdc`);
    if (!check) await writeFile(path, want);
  }
  for (const file of await readdir(join(root, MIRROR))) {
    if (!file.endsWith('.mdc') || names.includes(file.slice(0, -4))) continue;
    stale.push(`${MIRROR}/${file} (no source)`);
    if (!check) await rm(join(root, MIRROR, file));
  }
  return stale;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const stale = await syncRules({ check });
  if (!stale.length) console.log('rules: the Cursor mirror matches .claude/rules');
  else console.log(`${check ? 'stale' : 'wrote'}:\n${stale.map((s) => `  ${s}`).join('\n')}`);
  process.exitCode = check && stale.length ? 1 : 0;
}
