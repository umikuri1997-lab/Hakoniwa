---
paths:
  - "src/{scale,construct,cabin,pavilion,steading,machine}.js"
  - "test/{scale,construct,pavilion,architecture,machine,steading}.test.mjs"
---

# Scale, built form, machines

`PROJECTION.md` owns cabinet projection: world depth becomes half as many screen
rows, depths stay even. `src/scale.js` is the dimensional authority at
PLAYER_H = 26 px = 1.70 m. Derive from it, never from the window.
`docs/MACHINES.md` owns the meadow machines. Cabins stay outdoor props and doors
do not open into rooms.

Run `npm run test:scale`, `test:built-form` or `test:machine`.
