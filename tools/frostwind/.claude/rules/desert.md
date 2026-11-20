---
paths:
  - "src/{desert-hamlet,desert-camp,worm,shadeguest}.js"
  - "src/world/dunes.js"
  - "test/{desert,worm,shadeguest}.test.mjs"
---

# Desert, dunes, oasis

`docs/DESERT.md` owns the physics. `src/world/dunes.js` owns the dune field and
the oasis: two slopes, one of them the angle of repose. `paintDesert` in
`src/world/ground.js` owns the drawn surface and its legibility floors.

`src/shadeguest.js` owns the shade guest: one invented law, a skeleton in
metres, three projected views.

Run `npm run test:desert`.
