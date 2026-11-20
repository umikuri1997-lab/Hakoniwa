import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { generateReview } from '../tools/review.mjs';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const REVIEW_DATE = new Date('2026-08-07T00:00:00.000Z');

function option(key, overrides = {}) {
  return {
    label: `Option ${key}`,
    image: `${key.toLowerCase()}.png`,
    facts: [`Projection ${key} is declared in source.`],
    reproduce: `Apply ${key}.patch and run the recorded capture.`,
    ...overrides,
  };
}

async function fixture(t, overrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'frostwind-review-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await Promise.all(['a', 'b', 'c'].map((name) =>
    writeFile(join(dir, `${name}.png`), TINY_PNG)));
  const manifest = {
    title: 'Roof <mass> & entrance',
    question: 'Which "roof" keeps the entrance readable?',
    criteria: ['Read the roof separately from the wall.'],
    options: [option('A'), option('B'), option('C')],
    ...overrides,
  };
  const manifestPath = join(dir, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { dir, manifest, manifestPath, outputDir: join(dir, 'out') };
}

test('generates one deterministic page with three embedded options', async (t) => {
  const f = await fixture(t);
  const first = await generateReview(f.manifestPath, {
    outputDir: f.outputDir,
    date: REVIEW_DATE,
  });
  const second = await generateReview(f.manifestPath, {
    outputDir: f.outputDir,
    date: REVIEW_DATE,
  });

  assert.equal(first.id, second.id);
  assert.match(first.id, /^FW-VR-20260807-[0-9A-F]{8}$/);
  const html = await readFile(first.pagePath, 'utf8');
  assert.equal((html.match(/class="option"/g) || []).length, 3);
  assert.equal((html.match(/data:image\/png;base64,/g) || []).length, 3);
  assert.match(html, /Roof &lt;mass&gt; &amp; entrance/);
  assert.doesNotMatch(html, /Roof <mass> & entrance/);
  assert.match(html, new RegExp(`${first.id} A`));
  assert.match(html, new RegExp(`${first.id} B`));
  assert.match(html, new RegExp(`${first.id} C`));

  const record = JSON.parse(await readFile(first.recordPath, 'utf8'));
  assert.equal(record.id, first.id);
  assert.deepEqual(record.options.map(({ key }) => key), ['A', 'B', 'C']);
  assert.ok(record.options.every(({ imageSha256 }) =>
    /^[0-9a-f]{64}$/.test(imageSha256)));
});

test('changes the review ID when candidate bytes change', async (t) => {
  const f = await fixture(t);
  const first = await generateReview(f.manifestPath, {
    outputDir: f.outputDir,
    date: REVIEW_DATE,
  });
  await writeFile(join(f.dir, 'b.png'), Buffer.concat([TINY_PNG, Buffer.from([1])]));
  const second = await generateReview(f.manifestPath, {
    outputDir: f.outputDir,
    date: REVIEW_DATE,
  });
  assert.notEqual(first.id, second.id);
});

test('rejects malformed option sets with useful errors', async (t) => {
  const tooFew = await fixture(t, { options: [option('A'), option('B')] });
  await assert.rejects(
    generateReview(tooFew.manifestPath, { outputDir: tooFew.outputDir }),
    /exactly three options/,
  );

  const duplicates = await fixture(t, {
    options: [option('A'), option('B', { label: 'Option A' }), option('C')],
  });
  await assert.rejects(
    generateReview(duplicates.manifestPath, { outputDir: duplicates.outputDir }),
    /labels must be unique/,
  );

  const missing = await fixture(t);
  missing.manifest.options[2].image = 'missing.png';
  await writeFile(
    missing.manifestPath,
    `${JSON.stringify(missing.manifest, null, 2)}\n`,
  );
  await assert.rejects(
    generateReview(missing.manifestPath, { outputDir: missing.outputDir }),
    /option C image is missing: missing\.png/,
  );
});
