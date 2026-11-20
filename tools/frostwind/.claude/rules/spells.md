---
paths:
  - "src/spell.js"
  - "src/matter.js"
  - "test/spell.test.mjs"
---

# Spells

`src/spell.js` owns the spell table, the mark rows and every field function.
`src/matter.js` owns the measured laws a medium runs: fuel beds, crown
classes, fire spread, flame length, snow clumps. One invented law
(`docs/CANON.md`, bounded impulse). A spell is a `SPELLS` row.

- A mark is the only state. A plant, a pond or a print asks the marks about
  its own position. Never tag an object.
- A spell brings no colour: the ground's ramp, `trunk` for char, the coat ramp
  and `folkSignal` for light, the water's ramp for steam.
- A ground mark is a one-rung rim. `markRung` owns it.
- A surface burns through its `fuel` and `heat` columns, a plant through
  `PLANT_FUEL`. A new kind needs a row.
- What a mark draws in the air is a function of the mark and the clock
  (`flameTongues`, `squallFall`). Pool only what has a flight.
- `Scene.cast` is the world's side. The shaders take radii from `markUniforms`.

Run `npm run test:spell`. Look with `node tools/shot.mjs --cast <ids>
--cast-gap <s> --cast-age <s> --face x,y --wind <control>`.
