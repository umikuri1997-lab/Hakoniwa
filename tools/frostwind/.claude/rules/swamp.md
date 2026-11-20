---
paths:
  - "src/{swamp-lakehouse,swamp-settlement,pond-court,ruins}.js"
  - "src/world/swamp-water.js"
  - "test/{swamp,swamp-lakehouse,pond-court}.test.mjs"
---

# Swamp, compiled places, hydrology

`docs/SWAMP.md` owns the hydrology and the architecture.
`src/world/swamp-water.js` owns the karst chain, reaches and wallows. A place
owns its own hydrology override and footprint, and is constructed BEFORE
anything that reads the field it changes.

Run `npm run test:swamp`.
