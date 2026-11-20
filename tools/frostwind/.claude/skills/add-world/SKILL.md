---
name: add-world
description: Add a new world (biome) to Frostwind, or extend one, as plan rows and tables. Use when the task is a new biome, a new landform, a new water model, or a new species, surface or settlement for a world.
---

# Add a world

A world is data. State it in the tables below, in this order, and run the named
check after each step. Add code only where the last section says so.

Research first. Each row needs an authority: a measured value with its source,
a derived value with its derivation, or an authored value named as authored.
Write the physics and its citations in `docs/<WORLD>.md` and the habitat dossier
in `docs/life/<WORLD>.md`.

## 1. The plan

`BIOMES` in `src/biome.js`, one row:

- `scene`, `lat`, `ring` (place kinds), `common`, `relief`, `patch`
- `water`: `warped` (threshold on a warped fbm), `basins` (cosine bowls),
  `karst` (the swamp chain) or `oasis` (one deflation pool)
- `dry`, `deep`: the traversal surfaces. `ground`: the surface remap
- `worldTrail`, `trailClear`, `bankStones`, `pavedTrail`, `stand`, `shrubPatch`
- settlement flags and `slots` (authored siting intent), `cultures`, `portals`

Portals are pairs. Add the return row to the world on the other side.

## 2. Light and colour

- `SUN` and `ALBEDO` rows and a `<world>Ramps()` in `src/sunlight.js`. A ramp is
  derived from reflectance and the world's sun, never typed as RGB.
- Register the ramps and the haze in `src/palette.js`.
- `SURFACE` rows in `src/surface.js`. Append only: the index is a persisted byte.
- `SCENES` row in `src/scene.js`: `ramps` (the snap list, 64 colours at most),
  `precipitation`, `fog`, `aer`, `reflection`. `WORLD_NAMES` row.

Check: `npm run test:palette`, `npm run test:lighting`. An intentional ramp
change moves the baseline through `npm run palette:update`.

## 3. Flora

- Species rows in `src/species.js`.
- `HABITAT` rows and `TIERS` in `src/biome.js`. A habitat row states the
  placement axis: `water` and `el`, `hydroperiod` and `depth`, or `sand`.
- `LAYERS` cell sizes for the world in `cells`, jitter in `jit`.

Check: `npm run test:biome`. Draw one species with `node tools/trees.mjs`.

## 4. Life and culture

- Profiles in `src/life.js` with the world in `biomes`.
- Cohort rows in `ROSTER` in `src/world/life-field.js`.
- Culture packages in `src/culture.js`, named in the plan's `cultures`.
- Traveller row in `src/people.js`. Music row in `src/music.js`.

Check: `npm run test:life`, `npm run test:people`.

## 5. The door in

- World menu entry and colour in `src/index.html`.
- `PLACES` in `test/capture.mjs`, so frame conformance draws the world.
- A rule in `.claude/rules/<world>.md`, then `npm run rules`.

Check: `npm run verify`, `npm run test:frame`, then look at a frame
(`frame-check` skill).

## When code is needed

A new **model** needs a stage change, a new **world** does not.

- A new water model: a stage in `src/world/`, added to `STAGES` in
  `src/worldgen.js`, and a branch in `naturalLakeAt` (`src/world/water.js`) and
  in `waterMask` (`src/world/chunk-bake.js`), keyed on `PLAN.water`.
- A new ground: a painter in `src/world/ground.js`, selected by `PLAN.water`.
  `paintTemperate` already serves any world that remaps the shared geometry
  through `ground`.
- A new built form: a module on `src/construct.js`, a footprint and slab, an
  atlas entry, and a row in `test/archcast.mjs`.

Key every branch on a plan field. `npm run lint` checks the stage wiring: a
stage reads from `w` only names that an earlier stage returns.
