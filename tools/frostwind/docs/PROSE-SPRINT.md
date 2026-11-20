# Prose sprint

A work list, not a specification. Delete this file when the lists below are
empty. `tools/context-stats.mjs` excludes it from the budget.

## State

| | Words | Baseline | Paid |
|---|---:|---:|---|
| Always-loaded | 1,699 | 1,768 | Every call. Ceiling 2,080 |
| Worst single route | 2,322 | 2,271 | The heaviest one file pulls. Ceiling 2,330 |
| Source comments | 47,045 | 88,049 | When a file is read |
| Test and tool comments | 16,999 | 24,835 | When a file is read |
| Markdown | 61,577 | 59,256 | When a doc is opened |
| Total maintained prose | 125,621 | 172,140 | Target band 70,200 to 82,900 |

Every source, test and tool file has had one pass. Each pass left the code
identical, proved by `npm run codehash`. Shader comments sit inside template
strings and are not counted above; `src/shaders/world.js` and
`src/shaders/sprite.js` lost 509 comment lines.

The two gated numbers are constants and must not grow with the repository. Total
prose is reported, never gated: a word in `docs/CANON.md` costs nothing until
something opens it.

## Method

`.claude/rules/caveman.md` owns the method. Read the file, rewrite by hand with
exact-match edits, never reflow prose with a script. A bulk re-wrap once
duplicated 353 passages in `docs/SWAMP.md` and passed every check;
`test/prose-integrity.test.mjs` guards that.

Keep an authority, an invariant, a unit conversion or a measured failure. A
measured failure is not history: keep the numbers, drop the tense.

Some tests match source text. Before rewording a distinctive phrase, grep
`test/` for it.

## Remaining: markdown

Not yet passed. `docs/CANON.md` and `docs/DECISIONS.md` stay out of scope: they
are the provenance register, opened only for a law change.

| File | Words |
|---|---:|
| `docs/SWAMP.md` | 7,313 |
| `docs/DESERT.md` | 4,868 |
| `docs/LIFE.md` | 4,308 |
| `docs/MEADOW.md` | 3,985 |
| `PIXEL-ART.md` | 3,539 |
| `README.md` | 2,963 |
| `ARCHITECTURE.md` | 1,733 |
| `PROJECTION.md` | 1,672 |
| `VISION.md` | 1,535 |
| `docs/MACHINES.md` | 1,072 |
| `LIFE.md` | 1,014 |
| `ROADMAP.md` | 739 |
| `docs/life/DESERT.md` | 566 |
| `docs/life/BOREAL.md` | 419 |
| `docs/life/SWAMP.md` | 366 |
| `docs/life/HUMANS.md` | 314 |
| `docs/life/MEADOW.md` | 279 |

## Remaining: source files above 1,000 comment words

A second pass has less to take. What remains is mostly citations, equations and
measured numbers.

| File | Words |
|---|---:|
| `src/scene.js` | 3,168 |
| `src/figure-folk.js` | 3,160 |
| `src/body-camel.js` | 2,541 |
| `src/swamp-lakehouse.js` | 2,471 |
| `src/species.js` | 2,102 |
| `src/body-folk.js` | 1,975 |
| `src/sunlight.js` | 1,830 |
| `src/figure-camel.js` | 1,806 |
| `src/culture.js` | 1,504 |
| `src/world/ground.js` | 1,346 |
| `src/steading.js` | 1,297 |
| `src/construct.js` | 1,249 |
| `src/world/dunes.js` | 1,231 |
| `src/sprite.js` | 1,204 |

## Remaining: test and tool files above 700 comment words

| File | Words |
|---|---:|
| `test/biome.test.mjs` | 2,595 |
| `test/swamp.test.mjs` | 1,474 |
| `test/camel.test.mjs` | 1,249 |
| `test/swamp-lakehouse.test.mjs` | 1,077 |
| `test/desert.test.mjs` | 1,036 |
| `test/steading.test.mjs` | 830 |
