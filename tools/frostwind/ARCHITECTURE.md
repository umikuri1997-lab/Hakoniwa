# Architecture

Frostwind computes fields and structured sprite channels; palette indices reach
pixels only at the end.

| Stage | Responsibility | Primary modules |
|---|---|---|
| **1. World model** | Analytic elevation, water depth, hydroperiod, slope, trail, place, life-site, resource and affordance fields. Equal coordinates and seed return equal answers. | `worldgen.js`, `world/*.js`, `biome.js`, `surface.js`, `basin.js` |
| **2. Sprite synthesis** | Growth and build grammars write material, normal, occlusion and thickness buffers; neighbourhood passes add deposit, bark, AO and trim. | `sprite.js`, `species.js`, `figure-*.js`, `machine.js`, `construct.js` and the vernaculars |
| **3. Placement** | Streamable jittered-grid sampling gated by affordance, plus deterministic cohort, resident, use-node and authored-place plans. | `world/placement.js`, `world/siting.js`, `culture.js`, `scene.js` |
| **4. Composite** | Ordered render targets, instanced screen-space quads, painter order, projected shadows, contacts and water reflection. | `render.js`, `scene.js`, `shaders/` |
| **5. Quantise** | Bayer dither and nearest-entry snap to the resident scene palette. | `shaders/sprite.js`, `palette.js` |

## Sprite invariant

**A sprite never stores a colour.** It stores a material id, per-pixel surface
normal, ambient occlusion, and thickness. Draw time resolves

```
rampStep(rampId, posterise(lighting × occlusion))
```

against a palette texture. Consequences:

- content cannot emit an off-palette hex;
- normals let one synthesized form respond to changing light;
- time, warmth, and biome can rebake ramps without redrawing assets;
- tests can inspect geometry/material channels independently of the rendered
  colour.

Authored value and geometric normal must not both describe the same form. A
drum that carries both draws as a gradient painted across a rectangle; round
forms carry varying normals and flat occlusion.

## The world model is a pipeline of stages

`makeWorldGen(seed, opt)` in `worldgen.js` runs the stages in `src/world/` in
dependency order. Each stage is a factory `make<Stage>(w)`: it reads earlier
stages through `w` and returns its fields. A stage may only ask a field that
already exists, and `npm run lint` checks that wiring.

| Stage | Owns |
|---|---|
| `terrain.js` | the plan, noise fields, trail, rim, place ring, base relief |
| `dunes.js` | the oasis and the dune field: two slopes, one at repose |
| `swamp-water.js` | the karst chain, reaches, wallows, the mooring pool |
| `water.js` | the lake field, compiled wet places, hydrology, traversal |
| `siting.js` | cabins, portals, steading slots, keep-out, arrival |
| `life-field.js` | life sites and patches, the cohort roster, life plans |
| `placement.js` | habitat affordance and the prop list of a chunk |
| `ground.js` | one ground painter per water model, bank stones, portal discs |
| `chunk-bake.js` | the water mask and the frame both passes share |

The order encodes real constraints. A compiled place changes the hydrology
field, so it is constructed before anything that reads that field: the pond
court and the lakehouse precede the settlement, the portals precede the
steading.

### A world is a plan

`BIOMES` in `biome.js` states each world as data: scene id, latitude, water
model (`warped`, `basins`, `karst`, `oasis`), traversal surfaces, ground remap,
place ring, settlement slots, cultures and portals. `ROSTER` in
`world/life-field.js` states the wild cohorts. Stages branch on plan fields,
never on the biome name, so a second desert or a second wetland is a row.

Four worlds exist. `SCENES` in `scene.js` names `frostwood`, `meadow`, `swamp`
and `desert`; each points to a `BIOMES` row and declares its output ramps, haze,
aerial treatment, precipitation and reflection window. Latitude belongs to the
biome: 62° N boreal, 38° N meadow, 28° N swamp, 24° N desert. Output palettes
are scene-local selections from the shared ramp vocabulary.

Worlds are reached by explicit portal rows, avoiding short spatial seams between
incompatible suns and world laws. A crossing row carries
`{id, returnId, axis, off, sign, span}`; `Scene.crossed` is the only
crossing-sense implementation.

The renderer receives surface flags and scene reflection parameters; it never
branches on the biome. `Scene.visible` intersects each mirrored caster rectangle
with the resident geometry flags before filling the reflection batch, so dry
ground does not pay to draw reflections.

## Frame, world, place

| Owner | Owns |
|---|---|
| `render.js` | **the frame:** render targets, materials, batches, internal resolution, and current GPU bindings |
| `scene.js` | **the resident world:** generator, atlas, chunks, realized actors, tracks, traveller, places, portals, palette request, and visibility |

A `Scene` holds a renderer reference and asks for frame dimensions. It does not
cache another copy of width or height.

Exactly one bake context is resident: `sprite.js` has `LIGHT`, the sun under
which the current atlas was baked. That global is valid under exclusivity and
ambiguous with two resident worlds. A portal crossing disposes the old scene
and rebuilds the target.

Cabins, steadings, and swamp houses are exterior world props only. Doors do not
open into rooms.

### Streaming

Runtime chunk compilation is off the animation thread in every world.
`chunk-worker.js` owns a second deterministic world generator and transfers raw
geometry, water and column buffers back to `Scene`; only `Scene` creates the GPU
texture and resolves atlas rectangles. `ensure(true)` remains synchronous for
initial build, resize and deterministic capture. The worker is bundled into a
Blob source so the one-file `file://` handoff remains intact.

### Atlas

`buildWorldAtlas` takes a biome and bakes that world's cast only. Three
authorities decide the roster and none of them is a list kept in `atlas.js`:
`BIOMES` says which built forms a plan raises, `growsIn` says which species root
there, and `LIFE` says which bodies live there. `ACTOR.key` resolves a body to
its drawn row. Passing no biome bakes everything, which is what the lab
inspector wants. `BAKE_TUNING` in `atlas.js` states the values the world atlas
grows trees at and restores the growth defaults after a bake.

Measured at seed 20260727: boreal 1024x2048, meadow 1024x1024, swamp 1024x512,
desert 1024x1024. A missing sprite draws nothing and every colour law still
passes, so `test/scene.test.mjs` compares the baked keys against the three
authorities directly.

## One weather

`constants.js` states one wind axis. Drifts elongate along it, ripples cross it,
precipitation falls along it, and `weather.js` advects gusts down it: a stem
takes its gust phase from its downwind position, so sway crosses a stand as a
front at the mean flow (Taylor 1938). Rain rings, ground splashes, leaf hits and
blown sand are functions of world position and time, with no particle state.

## First-order life

Life is a semantic layer over the world pipeline. The renderer and the camera
know nothing about it:

```
life.js + culture.js ──▶ world/life-field.js: patches, sites, stable plans
                                   │
                                   ▼
                         life-session.js
                    clock, records, events, memory,
                    disturbances, traces, snapshots
                                   │
                                   ▼
               behavior.js ──▶ life-runtime.js ──▶ scene.js
                     partial decisions       realized bodies
```

`LifeSession` survives scene disposal and stores semantic state and meaningful
deviations only. Static habitat fields regenerate from seed. Off-screen cost is
proportional to due events; nearby cost is capped by realized actors,
observations, and eligible candidates. Routes reconstruct position analytically
from the canonical clock.

`fauna.js` is the `ACTOR` raster-expression table. Habitat, counts, identity,
sociality, fear, schedules, and culture belong to the life authorities.
`render.js` owns the one cross-scene `LifeSession` reference and never branches
on life profile, culture, biome, place, or action.

## Import order

```
palette.js ──▶ shaders/*       GLSL templates interpolate ramp ids and limits
scale.js ──▶ body-*.js ──▶ figure-*.js ──▶ atlas.js
gait.js, quadruped.js ──▶ body-wolf.js, body-camel.js
scale.js ──▶ body-folk.js ──▶ figure-folk.js ──▶ people.js ──▶ fauna.js, atlas.js
attention.js ──▶ life-runtime.js ──▶ scene.js
biome.js ──▶ world/*.js ──▶ worldgen.js ──▶ scene.js, chunk-worker.js
life.js + culture.js ──▶ world/life-field.js, life-session.js
render.js ──▶ scene.js          one-way module edge; object references point back
main.js                          last; the only module touching the DOM
```

The object graph may contain a renderer↔scene reference while the module graph
remains acyclic.

### People

One body, one raster, one cast list. Every table that draws a person is authored
as integers on the grid: joints solved in continuous space and quantised into a
figure 26 pixels tall give a ten percent limb-length error that changes sign
between frames.

`body-folk.js` owns integer rows, widths and contacts, walk and run contact
schedules, and the cadence law (step length at 0.415 of stature, Grieve & Gear
1966). `figure-folk.js` owns the raster: flat value tiers modelled by normals,
layered garments, five authored views and the idle/walk/run state banks.
`culture.js` owns dress; `people.js` is the one seam every consumer resolves a
person through. `attention.js` is pure transition math: `life-runtime.js` owns
transient NPC attention and `scene.js` the traveller's.

### Other morphologies

`gait.js` owns contact schedules and `quadruped.js` the two-bone limb solver.
Deer, wolf and camel each own their measured dimensions, clip timing and
phasing in a `body-*.js`, and project to integer views in a `figure-*.js`.
Smaller fauna are hand-placed at their own pixel budgets in `animal.js`.
`machine.js` is a parallel morphology path: its species rows own topology,
dimensions, mass terms, oscillator parameters and material synthesis.

## Built form

`construct.js` owns the constructive units every built form draws with: the
cabinet volume and its three faces, the course wall, the roof plane and its
eave, the recessed opening, and the bay rhythm. It knows metres, material ids
and normals, and nothing about biome, siting or culture. Each vernacular keeps
its own cladding and metre table.

A built sprite carries its form in `ao`, never in `shade`: the atlas packs
thickness into channel b for materials 1, 3, 9 and 12, so a value written to
`shade` never reaches the GPU.

Pond Court is the proof of
`fields → affordance → cultural plan → candidates → selection → pixels`.

## Verification authority

1. `npm run lint` owns names and stage wiring: no undefined name, no unused
   binding, no stage reading a field that does not exist yet.
2. Direct model tests own equations, dimensions, tables, and structural
   invariants.
3. Cheap authority snapshots own colour and figure stability, and they report
   what moved: `test/palette.test.mjs` over every ramp and snap list,
   `test/architecture.test.mjs` over every built shell, the folk raster laws
   in `test/folk-raster.test.mjs`. All run without a browser.
4. One real frame per world owns the claim that the shader agrees with the
   model. `test/frame-conformance.mjs` asserts palette conformance, scene
   identity, and target size against GPU output.
5. A seen frame decides drawn output. A metric does not prove beauty, and a
   claim about how a form reads is checked by a measurement and then by eye.
   Baselines move only through their own `*:update` script.

When prose and a measured test disagree, the test is the authority and the prose
changes.
