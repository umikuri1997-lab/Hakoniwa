import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { lintFiles, lintStages } from '../tools/lint.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

/* AUTHORITY: tools/lint.mjs. A moved block that leaves a dangling name fails
   here, in a second, before any world is built. */
test('no undefined name and no unused binding in src or lab', () => {
  const files = ['src', 'lab'].flatMap(walk).filter((f) => /\.m?js$/.test(f));
  assert.ok(files.length > 60, `only ${files.length} files found`);
  const findings = lintFiles(files);
  assert.deepEqual(findings, [], `\n${findings.join('\n')}\n`);
});

test('every world stage reads only what an earlier stage returns', () => {
  const findings = lintStages();
  assert.deepEqual(findings, [], `\n${findings.join('\n')}\nRun: npm run lint:fix`);
});
