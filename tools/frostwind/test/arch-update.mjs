/* Rewrite test/golden/architecture.json from the current source.

   Deliberately not something the test can do. Run it when you have looked at
   what moved — `node tools/houses.mjs <kind> <variant> --faces` — and decided
   it is correct. */

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshot } from './archcast.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(ROOT, 'test/golden/architecture.json');
const snap = snapshot();

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(snap, null, 1) + '\n');

for (const [key, m] of Object.entries(snap))
  console.log(`  ${key.padEnd(14)} ${m.dims.padStart(8)}  front ${String(m.faces.front).padStart(5)}`
    + `  top ${String(m.faces.top).padStart(5)}  side ${String(m.faces.side).padStart(5)}`);
console.log(`wrote ${Object.keys(snap).length} built shells to ${out.replace(ROOT + '/', '')}`);
