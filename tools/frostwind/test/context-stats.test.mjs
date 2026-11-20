import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CEILING, measure, wordCount } from '../tools/context-stats.mjs';

test('context stats separate prompt rules from repository prose', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'frostwind-context-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.cursor/rules'), { recursive: true });
  await mkdir(join(root, '.claude/rules'), { recursive: true });
  await mkdir(join(root, 'docs'));
  await mkdir(join(root, 'src'));
  await mkdir(join(root, 'test'));

  const guide = '# Guide\nAlways loaded guide words.\n';
  const alwaysRule = [
    '---',
    'description: Core limit',
    'alwaysApply: true',
    '---',
    'Keep reads bounded.',
    '',
  ].join('\n');
  const routedRule = [
    '---',
    'description: Example route',
    'globs: src/example.js',
    'alwaysApply: false',
    '---',
    'Use the people authority.',
    '',
  ].join('\n');
  const docs = '# Design\nRepository prose only.\n';
  /* Claude Code loads CLAUDE.md, whatever it imports, and any .claude rule with
     no `paths:`. Without this half of the fixture, dropping claudeAlways or the
     whole .claude branch left every assertion passing. */
  const claudeMd = '@.claude/rules/always.md\n\nClaude entry point.\n';
  const claudeAlwaysRule = 'Unconditional Claude rule with a good many words in it '
    + 'so the Claude loader clearly outweighs the Cursor one here.\n';
  /* Reached only by the .claude/rules branch, never by an import, so deleting
     that branch changes these numbers. */
  const claudeUnimported = 'Unscoped Claude rule that CLAUDE.md does not import.\n';
  const claudeScopedRule = ['---', 'paths:', '  - "src/example.js"', '---',
    'Scoped Claude rule.', ''].join('\n');

  await Promise.all([
    writeFile(join(root, 'AGENTS.md'), guide),
    writeFile(join(root, '.cursor/rules/core.mdc'), alwaysRule),
    writeFile(join(root, '.cursor/rules/people.mdc'), routedRule),
    writeFile(join(root, 'docs/design.md'), docs),
    writeFile(join(root, 'CLAUDE.md'), claudeMd),
    writeFile(join(root, '.claude/rules/always.md'), claudeAlwaysRule),
    writeFile(join(root, '.claude/rules/unimported.md'), claudeUnimported),
    writeFile(join(root, '.claude/rules/scoped.md'), claudeScopedRule),
    writeFile(join(root, 'src/example.js'), '// source comment words\nexport default 1;\n'),
    writeFile(join(root, 'test/example.test.mjs'), '// test comment words\n'),
  ]);

  const stats = await measure(root);
  assert.equal(stats.prompt.cursorAlways, wordCount(guide) + wordCount(alwaysRule));
  assert.equal(
    stats.prompt.claudeAlways,
    wordCount(claudeMd) + wordCount(claudeAlwaysRule) + wordCount(claudeUnimported),
  );
  assert.equal(stats.prompt.routed, wordCount(routedRule) + wordCount(claudeScopedRule));
  assert.equal(
    stats.prompt.always,
    Math.max(stats.prompt.cursorAlways, stats.prompt.claudeAlways),
  );
  assert.equal(stats.prompt.largestRoute, wordCount(routedRule));
  /* The worst single route is what a real file pulls, per loader, then the
     larger of the two. src/example.js matches a rule under BOTH loaders, so each
     pays its own always set plus its own matching rule, and they never mix. A
     rule matching nothing costs nothing. */
  assert.equal(
    stats.prompt.maxSingleRoute,
    Math.max(
      stats.prompt.cursorAlways + wordCount(routedRule),
      stats.prompt.claudeAlways + wordCount(claudeScopedRule),
    ),
  );
  assert.ok(stats.prompt.claudeAlways > stats.prompt.cursorAlways,
    'fixture must make Claude the heavier loader, or Math.max is never exercised');
  assert.deepEqual(
    stats.prompt.alwaysFiles.map(({ path }) => path).sort(),
    [
      '.claude/rules/always.md (imported by CLAUDE.md)',
      '.claude/rules/unimported.md (unscoped rule)',
      '.cursor/rules/core.mdc',
      'AGENTS.md',
      'CLAUDE.md',
    ],
  );
  assert.deepEqual(
    stats.prompt.routedFiles.map(({ path }) => path).sort(),
    ['.claude/rules/scoped.md', '.cursor/rules/people.mdc'],
  );

  assert.equal(
    stats.markdown,
    wordCount(guide) + wordCount(docs) + wordCount(claudeMd) + wordCount(claudeAlwaysRule)
      + wordCount(claudeUnimported) + wordCount(claudeScopedRule),
  );
  assert.equal(stats.source, 3);
  assert.equal(stats.testTool, 3);
});

test('a session loads no more than the budget', async () => {
  const stats = await measure();

  assert.ok(
    stats.prompt.always <= CEILING.promptAlways,
    `always-loaded prose ${stats.prompt.always} words, ceiling ${CEILING.promptAlways}. `
      + 'Charged on every call, under both loaders, so it must stay constant as the '
      + 'repository grows. Move detail into a routed doc rather than the guide. '
      + `Cursor ${stats.prompt.cursorAlways}, Claude ${stats.prompt.claudeAlways}.`,
  );

  assert.ok(
    stats.prompt.maxSingleRoute <= CEILING.maxRoute,
    `worst single route ${stats.prompt.maxSingleRoute} words, ceiling ${CEILING.maxRoute}. `
      + `Worst file is ${stats.prompt.worstRoutePath}: always-loaded `
      + `${stats.prompt.always} plus every rule that file matches. Narrow a rule's `
      + 'paths, or move its detail into the doc it names.',
  );
});
