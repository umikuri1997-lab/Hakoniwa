# Frostwind agent guide

## Identity and rule

Frostwind is a **nature-grounded world compiler for pixel art**: encode what a thing is, then derive its pixels. The golden rule is **nothing is drawn that can be derived; nothing is chosen that can be measured; nothing is claimed that cannot be checked.** Reality and the pixel medium are both authorities. When they conflict the medium wins explicitly, with the legibility floor or authored choice named.

LLMs write tables, distributions, constraints, and tests, never individual pixels. A literal is acceptable only when its authority and scope are stated. A table that no drawing code reads is only a comment with punctuation.

Reuse before you add. This repository keeps one authority per dimension, so the cheapest correct change is usually an edit to the owner.

### Cheap verification

The golden rule is checked by **authority + closest test**. Re-proving the CANON register in chat is waste.

1. Identify the one executable authority (`src/scale.js`, `src/sunlight.js`, `src/weather.js`, a world stage, a place owner, …).
2. Edit that surface. Update `docs/DECISIONS.md` / `docs/CANON.md` only when the **law** changes.
3. Run `npm run lint`, then the closest `npm run test:<area>`. Prefer checkable consequences over pasting algebra into the conversation.

A claim in a comment is a claim to check. "Reads as hills at a glance" held for months while 100% of lee and 98% of stoss dune pixels painted one rung. Measure it, then hold it with a test.

## Pipeline and ownership

1. **World model:** `src/worldgen.js` composes the stages in `src/world/`: terrain, dunes, swamp water, water, siting, life field. `BIOMES` in `src/biome.js` is each world's plan.
2. **Sprite synthesis:** materials, normals, occlusion, and thickness in `src/sprite.js` and `src/species.js`. A sprite never stores a colour.
3. **Placement:** affordance-gated placement in `src/world/placement.js`; streaming and the draw list in `src/scene.js`.
4. **Composite:** ordered GPU passes, batches, targets, shadows, and reflections in `src/render.js` and `src/shaders/`.
5. **Quantise:** Bayer dither and the scene-locked palette snap in `src/shaders/sprite.js`.

A new world is a `BIOMES` row, a `SCENES` row, surface rows, ramps, habitat rows and a roster. A world stage takes a branch only for a new model (a new kind of water, a new landform), keyed on the plan and never on the biome name.

`render.js` owns **the frame**: targets, GPU state, batches, and internal resolution. `scene.js` owns **the world**: generator, atlas, chunks, entities, traveller, places, and visibility. Do not put biome, doorway, chunk, entity, or place branches into the renderer.

Scenes are exclusive: one resident bake context. `src/sprite.js` has bake-time `LIGHT`, so keeping two scenes resident without removing that global is a bug. Cabins, steadings and swamp houses are outdoor props. Doors do not open into rooms.

## Authorities

- `src/scale.js` is the dimensional authority: `PLAYER_H = 26 px = 1.70 m`. Derive object dimensions from it; never from the window.
- `PROJECTION.md` states cabinet projection. World depth becomes half as many screen rows; depths stay even.
- `src/palette.js` and `src/sunlight.js` own ramps and light-derived colour. Assets carry material/ramp ids, never RGB or hex.
- `src/weather.js` owns rain, blown sand and gusts. One wind axis (`src/constants.js`) drives drifts, ripples, precipitation and sway.
- `LIFE.md` owns semantic life and culture; `src/life.js`, `src/culture.js`, `src/life-session.js`, `src/behavior.js`, and `src/life-runtime.js` are its executable authorities. Simulate reasons and consequences everywhere, bodies only near the traveller.
- `docs/LIFE.md` owns production morphology. Its medium laws bind every living body. Species tests own species measurements.
- `src/people.js` owns the human cast and raster selection. Body and figure modules own integer anatomy and drawing. `src/culture.js` owns dress.
- Preserve module direction and one-way ownership. Never introduce a second copy of a dimension, scene state, palette list or landmark.

## Route by task

Routing is path-scoped, so a rule loads only when you touch a matching file. One
rule per authority cluster: world, swamp, desert, life, morphology, projection,
people, animals, built-form, frame-palette, spells, build. Each names its
owning spec and its closest test.

`.claude/rules/*.md` is the source. `npm run rules` writes the Cursor mirror,
`.cursor/rules/*.mdc`, and `npm run test:prose` fails when the mirror is stale.

Open a spec because a rule sent you there. `docs/CANON.md` and
`docs/DECISIONS.md` are for changing a law, not for reading around one.

**Which LIFE / MEADOW file:** `LIFE.md` = semantic life/culture contract;
`docs/LIFE.md` = production morphology (rigged animals); `docs/MEADOW.md`,
`docs/SWAMP.md` and `docs/DESERT.md` = one world's physics each;
`docs/life/*.md` = habitat dossiers. Do not cross-generalize.

## Writing

Plain and short. The reader is a working engineer who wants the fact.

- **No em-dashes.** Use a comma, a full stop, or parentheses.
- **No defining by negation.** "X is not a Y, it is a Z" becomes "X is a Z".
  Contrast between two real things is fine.
- **No throat-clearing.** Delete a sentence that announces the next one.
- **No closing summary.**

A comment carries an authority, an invariant, a unit conversion or a measured
failure. Delete comments that restate the code or record edit history.

Commit messages stay imperative and name the change, in the voice already in the
log: "Replace the frame hash with a colour gate that says what moved".

### Prose is budgeted

`npm run test:context` fails when always-loaded prose or the worst single-file
route grows past `CEILING` in `tools/context-stats.mjs`. An always-loaded word
costs every task; a `docs/` word costs one route. Deletion beats compression.
`.claude/rules/caveman.md` carries the method.

Messages to the user are the exception. `.claude/rules/reporting-language.md`
sets ASD-STE100, which keeps the articles that repository prose drops.

## Work and verification

Preserve uncommitted work. Inspect diffs before editing, change only the requested surface, and never “clean up” another author’s changes.

`.claude/rules/cost-control.md` carries the working method: what to read, how to
delegate, the verification ladder, and when to look at a frame.

**A check names an authority and says what moved.** Prefer a cheap derived measurement with a diagnostic failure over byte identity. Snapshot the authority, report the changed ramp, world or form, and keep regeneration outside the test.

Frame conformance is the expensive tier. One frame per world, for GPU-path laws rather than value changes structural tests already cover.

Visual tools are narrow: `tools/shot.mjs` for a frame, `tools/houses.mjs` for built form, `tools/trees.mjs` for trees, `tools/person.mjs` for a person. Subjective pixel-art decisions follow `.claude/rules/pixel-review-gate.md`.
