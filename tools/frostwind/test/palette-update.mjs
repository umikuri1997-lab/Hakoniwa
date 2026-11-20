/* Rewrite test/golden/palette.json from the current source.

   Deliberately not something the test can do. Run it when you have read what
   moved — the failure names every ramp and every world's snap list, with the
   move in dE_ok — and decided it is correct. */

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snapshot } from './palettecast.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(ROOT, 'test/golden/palette.json');
const snap = snapshot();

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(snap, null, 1) + '\n');
for (const id of Object.keys(snap.scenes))
  console.log(`  ${id.padEnd(10)} ${snap.scenes[id].n}/64 entries`);
console.log(`wrote ${Object.keys(snap.ramps).length} ramps and `
  + `${Object.keys(snap.scenes).length} scenes to ${out.replace(ROOT + '/', '')}`);
