# First-order life authority

Frostwind compiles reasons and consequences everywhere, but bodies only where
they can be observed. A life record is not a spawn request. It is a stable
identity or cohort with an anchor, current commitment, bounded needs, social
form, observations, memory, route progress, and a next semantic event.

This file owns the life-system contract. [docs/LIFE.md](docs/LIFE.md) continues
to own people and rigged-animal morphology (including deer and the retro figure).
[docs/MACHINES.md](docs/MACHINES.md) owns dream-machine rasters.

## Ownership

- `src/life.js` owns schema-checked profiles, identity precision, provenance,
  resources, conditions, activity, social forms, drives, responses, traces,
  expression support, and explicit non-claims.
- `src/culture.js` owns authored meanings, practices, residents, schedules,
  households, work groups, typed ties, obligations, projects, and use nodes.
- `src/world/life-field.js` owns stable life patches/sites and measurable conditions,
  resources, risks, disturbance consequences, and compiled life plans.
- `src/life-session.js` owns the cross-scene clock, semantic records, event
  queue, memory, shared place state, deviations, persistent evidence/legacies,
  disturbance ledger, and snapshots.
- `src/behavior.js` owns pure partial observation and committed action choice.
  `src/life-runtime.js` owns scene activation and nearby realization.
- `src/scene.js` owns realized bodies. `src/render.js` receives ordinary draw
  instances and has no life, culture, species, or place branches.

Morphology keys are references. Life data may not copy dimensions, cadence,
palette ramps, materials, or pixels.

## Claim classes

Every profile groups claims under one of six provenance classes:

1. **measured**, a checkable observation or published measurement;
2. **derived**, arithmetic from an encoded measured or authored authority;
3. **inferred transfer**, a bounded application of evidence to this world;
4. **authored gameplay**, a deliberate world or interaction choice;
5. **medium constraint**, a pixel-expression limit or concession;
6. **fictional law**, an invented law with an explicit boundary.

Taxonomic precision cannot exceed raster or research evidence. Roe deer, wild
boar, red squirrel, and American alligator are exact taxa. The current wader is
a large ardeid guild and the turtle a large basking emydid guild. Machines are
fictional species governed by the curvature-heart law, not mammals with metal
bodies. Generic plants are resource or structural guilds unless the plant
authority identifies a taxon.

## Executable profile contract

Every current profile declares:

- identity class and exact taxon, guild, person, or fictional species;
- provenance for identity, habitat, sociality, behavior, and expression;
- biomes, conditions, resource links, risks, spatial scales, circular daily
  activity, and seasonal modes;
- cohort composition or authored human social form;
- ordered drives and a bounded semantic action vocabulary;
- sight, sound, scent, medium, familiar-anchor, and remembered-observation
  limits where those channels are executable;
- fear and aggression as separate enter/clear contracts;
- disturbance responses, traces, raster expressions, and non-claims.

No declared field is valid without a reader. `validateLifeCatalog` and
`LIFE_FIELD_READERS` make that wiring checkable.

## Ecological compilation

The world exposes two stable grids:

- a **life patch** for succession, connectivity, occupancy inputs, typed
  disturbance state, derived traffic risk, and home/cohort anchors;
- a **life site** for browse, cones, rooting, cover, quiet, shallow prey, bask
  structures, refugia, firm substrate, work, and gathering.

Conditions, resources, and risks remain separate. Habitat selection is
relative to reachable alternatives. The current compiler exposes:

`potential encounter = occupancy input × activity × detectability`

Typed human traffic may shift a declared activity term before connectivity or
suitability reaches zero; this is a temporal response, not instant absence.
The current runtime does not sample this encounter value to create or suppress
bodies: it realizes the stable planned individual when the traveller reaches
that individual's position. Time-of-day therefore changes the ecological
diagnostic, not visual presence, until an explicit observation policy is added.

Suitability is not occupancy, and the input is not a latent occupancy estimate.
An active encounter is not population. A local refuge influence is not a
biological home range. No universal carrying capacity or generic animal count
is part of the contract.

A resource-web relation must affect placement, action choice, disturbance
response, trace generation, or diagnostics. Static fields are regenerated from
seed; the session stores only identities and meaningful deviations.

## Continuity, behavior, and culture

Keyed decisions depend on world seed, stable identity, decision index, and
purpose. Camera path, viewport, frame rate, chunk order, and actor iteration may
not change semantic outcomes.

Off-screen life advances through due events. Nearby bodies are reconstructed
from the same identity, company, commitment, route, appearance, and recent
consequences. Detailed perception and movement have fixed budgets. The
traveller remains player-directed; the scheduler never writes player movement.
One unscheduled traveller record carries identity across the boreal, meadow,
and swamp appearance keys.

Current commitments continue until a declared interrupt. Safety responses,
coupled duties, scheduled work, resource phases, projects, and fallback
rest/observation/travel are resolved in that order. Perception is partial and
channel-specific. Residents remember witnessed facts, never presumed player
intent.

Nearby gait marks are transient raster consequences. Realized human phase
advances from post-collision displacement, and realized attention eases toward
the current commitment or observation target; both are reconstructed body
state, not semantic memory. Project evidence, disturbance legacies, compacted
routes, and changed use-node state enter the session chronicle; runtime
activation state, gaze transitions and per-frame foot samples do not.

A human hope is one concrete unfinished project with visible milestones. A
relationship is a typed tie with obligations and recognition. It is never an
opaque emotion score. Environment constrains valid culture packages, but does
not choose their meanings.

## Explicit non-goals

The first complete pass does not simulate births, deaths, genetics, population
equations, combat, damage, continuous off-screen movement, omniscient
perception, opaque personality/emotion values, or storage UI. Reproduction,
care, and dispersal may constrain seasonal group rows without becoming a
population model.

Snapshots are versioned and serializable, but persistence to disk is outside
this authority. Routine events collapse; open commitments and salient
person/place events remain bounded.

## Dossiers and verification

- [Boreal life](docs/life/BOREAL.md)
- [Swamp life](docs/life/SWAMP.md)
- [Meadow and dream life](docs/life/MEADOW.md)
- [Human life and culture](docs/life/HUMANS.md)

The semantic suites prove schema coverage, determinism, field separation,
stable plans, time-jump equivalence, bounded work, culture authorship,
disturbance succession, and behavior hysteresis. Existing morphology, biome,
scene, attention, track, lighting, build, and visual gates remain authoritative
for their surfaces.
