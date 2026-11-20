import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandBraces, routeMatchers } from '../tools/context-stats.mjs';
import { syncRules } from '../tools/sync-rules.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage', 'artifacts',
  'screenshots', 'review', 'test-results', 'playwright-report', 'worktrees']);

/* Duplicates predating this check. A new passage never inherits an old one's allowance. */
const KNOWN_REPEATS = {
  'docs/CANON.md': new Set([
    'a joint law of the world and law of the medium result',
    'in src swamp lakehouse js asserted in test swamp lakehouse test mjs',
  ]),
};
const GRAM = 12;

async function markdownFiles(dir = ROOT, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await markdownFiles(full, out);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdc')) {
      out.push(full);
    }
  }
  return out;
}

const rel = (full) => full.slice(ROOT.length + 1).split('\\').join('/');

function repeatedGrams(text) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  const seen = new Map();
  for (let i = 0; i + GRAM <= words.length; i++) {
    const key = words.slice(i, i + GRAM).join(' ');
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1);
}

/* MEASURED FAILURE: a bulk re-wrap assigning blocks back by slice, over
   boundaries computed from the pre-edit lines, shifted every write after the
   first block that grew. It duplicated 353 passages in docs/SWAMP.md and passed
   the link check, the suite and the word count. This reads the words. */
test('no markdown passage is duplicated', async () => {
  for (const full of await markdownFiles()) {
    const path = rel(full);
    const repeats = repeatedGrams(await readFile(full, 'utf8'));
    const allowed = KNOWN_REPEATS[path] ?? new Set();
    const unexpected = repeats.filter(([passage]) => !allowed.has(passage));
    assert.ok(
      unexpected.length === 0,
      `${path}: ${unexpected.length} new repeated ${GRAM}-word passages.\n`
        + unexpected.slice(0, 3).map(([g]) => `  "${g}"`).join('\n')
        + '\nRewrite the passage by hand. Do not reflow prose with a script.',
    );
  }
});

test('every markdown heading is followed by a blank line', async () => {
  for (const full of await markdownFiles()) {
    const lines = (await readFile(full, 'utf8')).split('\n');
    let fenced = false;
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].trimStart().startsWith('```')) { fenced = !fenced; continue; }
      /* A shell comment inside a fence is not a heading, and ATX requires the
         space: `#tag` is text. */
      if (fenced || !/^#{1,6} /.test(lines[i])) continue;
      assert.equal(lines[i + 1].trim(), '',
        `${rel(full)}:${i + 1} heading runs straight into text: ${lines[i]}`);
    }
  }
});

test('every relative markdown link resolves', async () => {
  for (const full of await markdownFiles()) {
    const text = await readFile(full, 'utf8');
    const inline = [...text.matchAll(/\]\(\s*(?!https?:|#|mailto:)([^)\s]+)(?:\s+"[^"]*")?\s*\)/g)]
      .map((m) => m[1]);
    /* Reference definitions never contain `](`, so the inline pattern is blind
       to them. */
    const reference = [...text.matchAll(/^\[[^\]]+\]:\s*(?!https?:|#|mailto:)(\S+)/gm)]
      .map((m) => m[1]);
    for (const raw of [...inline, ...reference]) {
      const target = raw.split('#')[0];
      if (!target) continue;
      const resolved = resolve(dirname(full), target);
      await assert.doesNotReject(
        () => readdir(dirname(resolved)).then((names) => {
          assert.ok(names.includes(resolved.split(/[\\/]/).pop()),
            `${rel(full)} links to missing ${target}`);
        }),
      );
    }
  }
});

/* MEASURED FAILURE: six generated .mdc rules shipped without their closing
   `---`, so the frontmatter never parsed, the globs never resolved, and Cursor
   would have ignored every one. Nothing else noticed: the words still counted,
   the suite still passed. */
test('every rule declares a scope that resolves', async () => {
  const dirs = [['.cursor/rules', '.mdc', /^globs:\s*"?(.+?)"?\s*$/m],
                ['.claude/rules', '.md', null]];
  const repo = await markdownFiles();
  const sources = [];
  const scopes = new Map();
  for (const dir of ['src', 'src/shaders', 'src/world', 'test', 'tools']) {
    for (const name of await readdir(join(ROOT, dir))) sources.push(`${dir}/${name}`);
  }
  const candidates = [...sources, ...repo.map((f) => rel(f)), 'build.mjs'];

  for (const [dir, ext, globRe] of dirs) {
    for (const name of await readdir(join(ROOT, dir))) {
      if (!name.endsWith(ext)) continue;
      const path = `${dir}/${name}`;
      const text = await readFile(join(ROOT, path), 'utf8');
      const parsed = text.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1];
      /* A .claude rule may omit frontmatter entirely, which Claude Code loads
         unconditionally. A .mdc that opens `---` and never closes it is inert. */
      assert.ok(parsed !== undefined || (ext === '.md' && !text.startsWith('---')),
        `${path}: frontmatter does not parse. A missing closing --- makes the rule inert.`);
      const front = parsed ?? '';

      const patterns = globRe
        ? (front.match(globRe)?.[1] ? [front.match(globRe)[1]] : [])
        : [...front.matchAll(/^\s*-\s*"(.+?)"\s*$/gm)].map((m) => m[1]);
      const scoped = patterns.length > 0;
      const always = /^alwaysApply:\s*true\s*$/m.test(front) || (ext === '.md' && !/^paths:/m.test(front));
      assert.ok(scoped || always,
        `${path}: neither path-scoped nor always-applied, so nothing ever loads it.`);
      const key = name.slice(0, -ext.length);
      const loaders = scopes.get(key) ?? {};
      loaders[dir.startsWith('.cursor') ? 'cursor' : 'claude'] = always
        ? ['<always>']
        : patterns.flatMap(expandBraces).sort();
      scopes.set(key, loaders);

      /* Every expansion must resolve, not just one. A live name in a brace
         group otherwise hides a typo in its siblings. */
      for (const pattern of patterns) {
        for (const branch of expandBraces(pattern)) {
          const [matcher] = routeMatchers([branch]);
          assert.ok(candidates.some((c) => matcher.test(c)),
            `${path}: "${pattern}" expands to "${branch}", matching no file. Dead route.`);
        }
      }
    }
  }

  for (const [name, loaders] of scopes) {
    assert.ok(loaders.cursor && loaders.claude,
      `${name}: rule exists for only one loader.`);
    assert.deepEqual(loaders.cursor, loaders.claude,
      `${name}: Cursor and Claude scopes differ.`);
  }
});

/* AUTHORITY: .claude/rules/*.md. tools/sync-rules.mjs writes the Cursor mirror,
   so a rule edited in one loader cannot drift from the other. */
test('the Cursor rule mirror matches its source', async () => {
  const stale = await syncRules({ check: true });
  assert.deepEqual(stale, [],
    `stale mirror: ${stale.join(', ')}. Edit .claude/rules/*.md, then run npm run rules.`);
});
