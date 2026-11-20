---
name: add-character
description: Add a person, an animal, a fictional creature or a wearable item to a Frostwind world, as table rows. Use when the task is a new resident, a new species or monster, a new hat, garment or carried kit, or gear for the traveller.
---

# Add a character

A character is a reason, then rows, then pixels the compiler derives. State it
in this order and run the named check after each step.

## 0. The cause, before any row

Write four facts first. A character missing one of them is a costume.

- **Why here.** The world condition it answers: a resource, a practice, a
  shortage. Use a `RESOURCE_GUILDS` field or a `PRACTICES` row.
- **One real authority.** A measured body, artefact or practice, with its
  source. Sizes are metres through `src/scale.js`.
- **One invented law at most**, stated with its boundary: what it changes and
  what stays ordinary. `src/worm.js` and `src/shadeguest.js` are the shape.
- **The read.** One silhouette fact and one colour fact nobody else in that
  world has. `node tools/lineup.mjs <biome>` measures both.

Look at the line-up before you design: the new body stands in that sheet.

## 1. A person

- `FOLK` row in `src/body-folk.js`: atlas key, stature, rung window.
- `WEAR` row in `src/figure-folk.js`. A new hat, outer layer or carried kit is
  a branch in `capPass`, `outerLayerPass` or `CARRIED_KIT_PASS`, with its pads
  (`CAP_TOP_PAD`, `CUE_TOP_PAD`, `KIT_SIDE_PAD`).
- `src/culture.js`: `RESIDENTS` row (home, practices, project, schedule),
  the package's `residents`, a `PRACTICES` and `PROJECTS` row if the work is
  new, `PROJECT_ACTIONS`, a threshold node in `compileUseNodes`, and
  `IDENTITY_DRESS` for every pinned field. Pin `ramp` to a ramp the scene
  declares. A pin outside `FASHION_VOCAB` needs its reason in the comment.
- `LIFE` profile in `src/life.js`, `ACTOR` row in `src/fauna.js`.

Check: `npm run test:people`, `npm run test:cast`, then
`node tools/person.mjs <name>` and `node tools/lineup.mjs <biome>`.

## 2. An animal or a creature

- A body with one-pixel limbs: a pose table in metres on `src/skeleton.js`.
  The module states parts, limbs and dots per state and exports a `SPEC`
  with its `brief` (cause, authority, read; law and boundary if invented) and
  its `size` in metres. `src/lampsnail.js` is the shortest. Add the spec to
  `RIGGED` in `src/bestiary.js`: the atlas bakes it and every rig law in
  `test/skeleton.test.mjs` applies. It draws no pixel.
- Look at every frame: `node tools/creature.mjs <kind>`. A planted leg is
  straight; a body at rest touches its ground row; no frame pops.
- A mammal at 20 rows or more: a quadruped rig (`.claude/rules/animals.md`).
- State names are behaviour: a state named after an action (`orient`,
  `greet`) is drawn when that action runs.
- `ACTOR` row in `src/fauna.js`. A hand-placed animal also takes an `ANIMALS`
  row in `src/atlas.js`; a rigged one does not.
- `LIFE` profile, `RESOURCE_GUILDS.supports`, cohort row in `ROSTER`
  (`src/world/life-field.js`).
- A fictional body: `PROVENANCE.fictional` for identity and behaviour, a row in
  `docs/CANON.md`, the refused claims in `nonClaims`.
- A companion that follows: a `companion` row on the actor
  (`GUEST_COMPANION`), every distance derived or named as authored.

- A place the body belongs to (a nest, a den) is a built prop: a slot in
  `BIOMES`, a footprint, an atlas row, a placement branch, a row in
  `test/archcast.mjs`, then `npm run arch:update`. `makeNestPole` is the shape.

- Fear distances come from the risk law in `src/behavior.js`:
  `1.14 * (1 - distance / sight)`. State the distance in the comment.

Check: `npm run test:rig` (the laws and the live encounters),
`npm run test:life`, `npm run test:<world>`, `node tools/lineup.mjs <biome>`.

## 3. An item

- `ITEMS` row in `src/gear.js`: slot, maker culture, the dress fields it sets,
  its reason. A new value is a raster branch first (step 1).

Check: `npm run test:gear`, then
`node tools/person.mjs <traveller> --wear <ids>` and
`node tools/shot.mjs --scene <world> --wear <ids>`.

## 4. The record

- Dossier entry in `docs/life/<WORLD>.md`: what is claimed and what is refused.
- `docs/DECISIONS.md` only when a law changes.

Check: `npm test`, `npm run build`, one frame at the body's anchor
(`frame-check` skill). Read the frame.
