---
paths:
  - "src/{worldgen,biome,surface,sunlight,scene,basin,weather,world-clock}.js"
  - "src/world/{terrain,water,siting,placement,ground,chunk-bake}.js"
  - "test/{biome,lighting,scene,tracks,weather}.test.mjs"
---

# World, biome, water, paths

`src/worldgen.js` composes the stages in `src/world/`, in dependency order. A
stage reads earlier stages through `w` and returns its fields. `BIOMES` in
`src/biome.js` is the plan of a world: state a new world there as a row, and add
a branch to a stage only for a new model. `docs/CANON.md` owns the laws and
their citations, `docs/MEADOW.md` the meadow physics. Open either only to add or
change a law.

Run `npm run lint`, then `npm run test:biome`, `test:lighting` or `test:world`.
