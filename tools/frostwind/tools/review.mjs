import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OPTION_KEYS = Object.freeze(['A', 'B', 'C']);
const MIME = Object.freeze({
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
});

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireTextList(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array of strings`);
  }
  return value.map((item, index) => requireText(item, `${field}[${index}]`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function dateStamp(date) {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
    throw new Error('date must be a valid Date');
  }
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function canonicalManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('manifest must be a JSON object');
  }
  if (!Array.isArray(manifest.options) || manifest.options.length !== 3) {
    throw new Error('manifest.options must contain exactly three options');
  }

  const title = requireText(manifest.title, 'manifest.title');
  const question = requireText(manifest.question, 'manifest.question');
  const criteria = requireTextList(manifest.criteria, 'manifest.criteria');
  const options = manifest.options.map((option, index) => {
    if (!option || typeof option !== 'object' || Array.isArray(option)) {
      throw new Error(`manifest.options[${index}] must be an object`);
    }
    return {
      key: OPTION_KEYS[index],
      label: requireText(option.label, `manifest.options[${index}].label`),
      image: requireText(option.image, `manifest.options[${index}].image`),
      facts: requireTextList(option.facts, `manifest.options[${index}].facts`),
      reproduce: requireText(
        option.reproduce,
        `manifest.options[${index}].reproduce`,
      ),
    };
  });

  const labels = options.map((option) => option.label);
  if (new Set(labels).size !== labels.length) {
    throw new Error('manifest option labels must be unique');
  }
  return { title, question, criteria, options };
}

async function loadOptions(manifestPath, manifest) {
  const base = dirname(manifestPath);
  return Promise.all(manifest.options.map(async (option) => {
    const imagePath = resolve(base, option.image);
    const mime = MIME[extname(imagePath).toLowerCase()];
    if (!mime) {
      throw new Error(`option ${option.key} image must be PNG, JPEG, GIF, or WebP`);
    }
    let bytes;
    try {
      bytes = await readFile(imagePath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`option ${option.key} image is missing: ${option.image}`);
      }
      throw error;
    }
    return {
      ...option,
      imagePath,
      bytes,
      mime,
      dataUrl: `data:${mime};base64,${bytes.toString('base64')}`,
    };
  }));
}

function reviewHash(manifest, options) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(manifest));
  for (const option of options) {
    hash.update('\0');
    hash.update(option.bytes);
  }
  return hash.digest('hex').slice(0, 8).toUpperCase();
}

function pageHtml(id, manifest, options) {
  const cards = options.map((option) => `
      <article class="option" aria-labelledby="option-${option.key}">
        <h2 id="option-${option.key}"><span>${option.key}</span>${escapeHtml(option.label)}</h2>
        <div class="image-frame">
          <img src="${option.dataUrl}" alt="Candidate ${option.key}: ${escapeHtml(option.label)}">
        </div>
        <h3>Implementation facts</h3>
        ${list(option.facts)}
        <details>
          <summary>Reproduction details</summary>
          <code>${escapeHtml(option.reproduce)}</code>
        </details>
      </article>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(id)} | ${escapeHtml(manifest.title)}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #111318; color: #f3f4f6; }
    main { width: min(1600px, 100%); margin: auto; padding: 32px; }
    header { display: grid; gap: 12px; margin-bottom: 28px; }
    .review-id { width: fit-content; padding: 6px 10px; border: 1px solid #4b5563; border-radius: 6px; font: 700 14px ui-monospace, monospace; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: clamp(24px, 3vw, 42px); }
    .question { max-width: 80ch; color: #d1d5db; font-size: 18px; }
    .criteria { padding: 18px; border: 1px solid #374151; border-radius: 10px; background: #191c23; }
    .criteria h2 { font-size: 15px; }
    ul { margin: 10px 0 0; padding-left: 22px; color: #d1d5db; }
    .options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .option { min-width: 0; padding: 16px; border: 1px solid #374151; border-radius: 12px; background: #191c23; }
    .option h2 { display: flex; align-items: center; gap: 10px; font-size: 19px; }
    .option h2 span { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; background: #f3f4f6; color: #111318; }
    .image-frame { display: grid; min-height: 220px; margin: 16px 0; place-items: center; overflow: auto; background: #0a0b0e; border: 1px solid #2d333d; }
    img { display: block; max-width: 100%; image-rendering: pixelated; image-rendering: crisp-edges; }
    h3 { font-size: 14px; }
    details { margin-top: 14px; color: #9ca3af; }
    details code { display: block; margin-top: 8px; overflow-wrap: anywhere; white-space: pre-wrap; }
    footer { margin-top: 26px; padding: 18px; border: 1px solid #4b5563; border-radius: 10px; text-align: center; }
    footer code { font-size: 16px; }
    @media (max-width: 900px) { .options { grid-template-columns: 1fr; } main { padding: 18px; } }
  </style>
</head>
<body>
  <main data-review-id="${escapeHtml(id)}">
    <header>
      <div class="review-id">Review ${escapeHtml(id)}</div>
      <h1>${escapeHtml(manifest.title)}</h1>
      <p class="question">${escapeHtml(manifest.question)}</p>
      <section class="criteria">
        <h2>What to judge</h2>
        ${list(manifest.criteria)}
      </section>
    </header>
    <section class="options" aria-label="Review options">${cards}
    </section>
    <footer>
      Reply in chat with <code>${escapeHtml(id)} A</code>,
      <code>${escapeHtml(id)} B</code>, or
      <code>${escapeHtml(id)} C</code>.
    </footer>
  </main>
</body>
</html>
`;
}

export async function generateReview(manifestFile, {
  outputDir = resolve(ROOT, 'review'),
  date = new Date(),
} = {}) {
  const manifestPath = resolve(manifestFile);
  let parsed;
  try {
    parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`manifest is missing: ${manifestFile}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`manifest is invalid JSON: ${error.message}`);
    }
    throw error;
  }

  const manifest = canonicalManifest(parsed);
  const options = await loadOptions(manifestPath, manifest);
  const id = `FW-VR-${dateStamp(date)}-${reviewHash(manifest, options)}`;
  const out = resolve(outputDir);
  const pagePath = resolve(out, `${id}.html`);
  const recordPath = resolve(out, `${id}.json`);
  const record = {
    id,
    ...manifest,
    options: manifest.options.map((option, index) => ({
      ...option,
      imageSha256: createHash('sha256').update(options[index].bytes).digest('hex'),
    })),
  };

  await mkdir(out, { recursive: true });
  await Promise.all([
    writeFile(pagePath, pageHtml(id, manifest, options), 'utf8'),
    writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8'),
  ]);
  return { id, pagePath, pageUrl: pathToFileURL(pagePath).href, recordPath };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const manifestFile = process.argv[2];
  if (!manifestFile || process.argv.length > 3) {
    console.error('usage: node tools/review.mjs <manifest.json>');
    process.exitCode = 1;
  } else {
    try {
      const result = await generateReview(manifestFile);
      console.log(`Review ID: ${result.id}`);
      console.log(`Page: ${result.pageUrl}`);
      console.log(`Reply: ${result.id} A|B|C`);
    } catch (error) {
      console.error(`review: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
