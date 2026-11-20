---
paths:
  - "src/{gait,quadruped,body-deer,figure-deer,body-wolf,figure-wolf,body-camel,figure-camel,animal,fauna,skeleton,bestiary,stork,hare,skimmer,lampsnail,olm,driftlantern,carbuncle}.js"
  - "test/{gait,deer,wolf,camel,skeleton}.test.mjs"
---

# Rigged animals

- `src/gait.js` owns contact schedules.
- `src/quadruped.js` owns the two-bone solver and three-segment limb.
- Each species owns excursion, lift, topline, foot, head carriage, tail and
  cadence. Deer, wolf and camel keep their differences, and their tests enforce
  them.
- A shared module widens only when another rig requires the same behaviour. The
  camel is the third rig and widened nothing.
- Human bodies use their grid-authored body modules.
- `docs/LIFE.md` owns production morphology.
- `src/skeleton.js` owns the projected skeleton: a pose in metres, three
  views by cabinet projection. A body with one-pixel limbs is a pose table on
  it and a row in `RIGGED` (`src/bestiary.js`), which the atlas bakes from.
  `test/skeleton.test.mjs` holds every row to the rig's laws.
- A planted leg is one straight run. A joint is drawn on the limb in swing.
  An arthropod's raised knee is its outline and stays.

Run `npm run test:gait` for shared schedules, `test:deer`, `test:wolf` or
`test:camel` for one species, `test:rig` for the projected skeleton.
`node tools/creature.mjs <kind>` draws every frame of one rigged body.
