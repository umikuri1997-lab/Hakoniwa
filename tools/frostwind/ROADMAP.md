# Roadmap

Current state and known work only. Rationale that must not be rediscovered lives
in [docs/DECISIONS.md](docs/DECISIONS.md); scientific and craft provenance lives
in [docs/CANON.md](docs/CANON.md).

Specifications:
[ARCHITECTURE.md](ARCHITECTURE.md),
[LIFE.md](LIFE.md),
[PROJECTION.md](PROJECTION.md),
[docs/LIFE.md](docs/LIFE.md),
[PIXEL-ART.md](PIXEL-ART.md),
[docs/MEADOW.md](docs/MEADOW.md),
[docs/SWAMP.md](docs/SWAMP.md), and
[docs/DESERT.md](docs/DESERT.md).

## Active and known debt

### Model coverage

- **The worm's bounded breach is unbuilt.** It is a swell and a wake; the
  above-sand appearance the frame-height law allows is not drawn.

- **Architecture is a shared constructive layer with four vernaculars on it.**
  `src/construct.js` owns the units and the meadow house, the boreal cabin, the
  swamp pile house and the lakehouse all take their volume and their roof from
  it. Every built shell now draws its own depth, between 26% and 62% of its
  pixels; `npm run test:architecture:report` prints the table. What is still
  per-vernacular is cladding, which is the level the differences are real at.
- **Buildings generate one silhouette.** Mass variants (bay count, eave depth,
  roof rise) are the combinatorial grid `PIXEL-ART.md` section 2 describes and
  nothing generates or scores them. The Pond Court candidate-and-select pattern
  is the shape this wants.
- **Meadow built culture is incomplete.** Its life roster is the traveller,
  three residents, three unique machines, a stork and two hares. Meadow houses
  remain exterior props. The hare's flush and the stork's following are wired
  and unobserved: no capture advances time with a walker in range.
- **The gallery is a practice with no place.** The digger and the keeper
  exist and the foggara they serve is undrawn: no shaft line, no spoil rings,
  no world below.
- **The projected rig's head-on views are thin.** A stork or a hare seen along
  its axis is a column three pixels wide. The profile carries the read.
- **Two cast pairs share a silhouette.** `tools/lineup.mjs` measures meadow
  traveller and grower at 0.02 and boreal thickDude and elder at 0.04. They
  differ by cloth only.
- **Beauty search has one narrow proof.** Pond Court generates and selects
  framing candidates; species, figures, and settlements do not yet share
  a general candidate/rejection interface.
- **Animal rigging has three rigs and a measured seam.** Roe deer, Eurasian
  wolf and Bactrian camel derive three-view pixels from measured bodies.
  `src/gait.js` holds contact schedules and `src/quadruped.js` a two-bone
  solver and a three-segment limb. The camel widened nothing: it paces, it
  does not trot, its forelimb is a column, and its high point is a fat store,
  and all four live in its species module. Disagreements are recorded in
  `docs/LIFE.md` and asserted in the species tests. Boar, squirrel, alligator,
  heron and turtle remain explicit sprites. A further rig widens the shared
  module only where it also disagrees with the others. The deer still keeps a
  private copy of the two-bone solver (`src/body-deer.js`).

### Named technical debt

- Reconcile `GARMENT`'s `round(h·f)` rows with canonical
  `ROW_FROM(f,h)=round(f·(h−1))`; review the twelve moved landmarks rather than
  treating this as a mechanical refactor.
- Give the remaining non-human `ACTOR` expression rows one measured locomotion
  authority or explicitly accept their per-row slide ratios. Retro humans now
  derive phase and strikes from resolved distance; roe-deer walk and gallop
  retain their species authority; smaller explicit animals remain measured but
  unasserted.
- The boreal atlas is the largest sheet, 1024x2048, because the folk look
  banks multiply its cast. Meadow and desert bake 1024x1024, swamp 1024x512.
- `paintTemperate` in `src/world/ground.js` still draws the meadow as the
  boreal geometry remapped through `ground`. Meadow dry ground reports the
  snow traversal row for the same reason.
- `src/life.js` omits `desert` from the traveller profile's biomes while
  `src/people.js` has a desert traveller row.
- The boreal water mask reconstructs its warped field bilinearly, a second
  form of the expression in `naturalLakeAt`. One owner would move winter's
  shoreline by sub-pixel amounts.
- Keep large-module pressure visible, especially `src/scene.js` (`visible` is
  about 290 lines); split only around a stable ownership boundary, not a
  line-count target.

## Deferred deliberately

- **Authored game layer:** dialogue, quests, state, inventory, save/load, and
  audio are outside the world-compiler proof. Gear exists as dress only
  (`src/gear.js`): no pick-up, no inventory, no live rebake.
- **Autonomous human social/interest selection:** realized humans can ease
  toward any supplied world target, but greetings, conversations and choosing
  trees, machines or buildings as interests wait for a semantic behavior pass.
- **Dream world:** grounding cannot select laws for a lawless setting. Build it
  as a declared authored departure after the physical baseline.
- **Terracing:** the dune field spends the angle of repose; no current place
  requires a terraced terrain response.

## Before taking work

1. Check [docs/DECISIONS.md](docs/DECISIONS.md) for an existing decision or
   concession.
2. Identify the authority: code/test, world law, medium law, or taste.
3. Put equations and table invariants in direct tests. Measure a drawn claim,
   then look at its frame.
4. Update the relevant specification and decision row in the same change.
