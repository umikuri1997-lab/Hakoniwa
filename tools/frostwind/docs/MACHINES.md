# The meadow machines

The meadow's three machines are a dreamed species with a deliberately narrow
extension to ordinary physics. This file is their body-model document in the
same sense that `docs/LIFE.md` is for people and rigged animals: code owns the
executable numbers, tests own the measurements, and this records why the model
exists.

## The one invented law

> A field core may change the **rest curvature** of contiguous bronze.

The core supplies work by changing the shape toward which a member elastically
relaxes. It does not cancel gravity, mass, momentum, support, or contact forces.
The visible body therefore follows the ordinary elastic energy

```
E = Σ ½ kθ (θ - θ₀(core phase))² + Σ m g y
```

and a footfall excites the ordinary damped response

```
q(t) = A exp(-ζωt) sin(ωd t)
```

This is the boundary of the invention. It explains motion without hiding a
second creature or a set of invisible motors inside every joint. Everything
else is inherited from mechanics, meadow ecology, and the pixel medium.

## Shared body

Every species has five parts:

1. a red curvature-heart aperture, read as an eye;
2. a hollow bronze load path;
3. compliant dark ring joints;
4. broad contact feet;
5. an old moss mantle.

Round shells are not softness. A dome or bell encloses volume with less bending
stress than a flat plate, so the heavy parts become round while the unloaded
members remain thin. Their apparent fragility is a mass-distribution fact: a
large shell can be hollow and a narrow pipe can carry load.

`src/machine.js` stores topology and dimensions in metres. `scale.js` converts
them once:

- colossus: 5.75 m, 88 rows;
- strider: 4.18 m, 64 rows;
- pilgrim: 4.31 m, 66 rows.

The absolute size is authored. The reference sheet has no person or building;
the in-world review fixes all three as giants beside the 26-row traveller. The
colossus remains tallest at 1.38 times the strider, while the two smaller
topologies remain near peers.

## Three species

### Colossus

A broad suspended dome, two long legs, and two stabilising arms. Its body is the
largest mass and its gait moves the shell over a planted foot before the other
foot lifts. The low claws are outriggers during a stumble, not another pair of
walking legs. One three-petal meadow flower grows from the upper-right moss
edge; the back view mirrors that body-side attachment.

### Strider

A narrow mantle on long limbs. The fork above its core is a balancing member:
two light ends give the field a longer lever without adding another heavy
shell. Open negative space is its identity.

### Pilgrim

A shallow balancing disc over a segmented bell. The disc is read as a round hat
and the bell as a cape, but both remain mechanisms: the first carries rotational
inertia and the second protects the core while keeping mass low.

## The walk

The machines use eight poses rather than the human four. A cycle is:

```
double support → transfer → swing → settle →
double support → transfer → swing → settle
```

The centre of mass is solved over the support interval before a foot is allowed
to lift. The colossus and strider retain a one-row post-impact shell answer. The
pilgrim's broad feet and balancing disc quantise that answer to zero: its shell
does not bob or shake, while its fringe can still move. Random per-frame
displacement would read as an insect and would claim no physical cause.

Speed, frame rate, foot travel, and footprint spacing are read from the same
species row. They walk at 6–10 px/s, against the traveller's 62 px/s.

## Moss

Moss is material 2, the engine's deposit material, over a material-8 bronze
armature. Five upward rays locate exposed shell; a distance transform then
carries that cause inward to make a continuous pelt rather than isolated green
spots. Its depth is greater where:

- the surface can see sky;
- its normal retains water rather than shedding it;
- age has had time to close gaps.

It is excluded from the core, contact feet, and swept joint envelopes. Long,
seeded strands hang from the mantle envelope; the pilgrim also derives four
attachment points from the underside of its balancing disc. Four idle wind
phases bend only the lower half of each strand while the body remains settled.
The colour uses only the dark lower half of the meadow's derived `canopy` ramp.

## Bronze in a closed palette

The global palette is already near the 64-entry snap ceiling. A new bronze ramp
would exceed it after the Pond Court masonry addition. Bronze therefore uses
the existing warm-gold `masonry` family but gets a different **material
response**: quantised diffuse light plus a narrow metallic half-vector glint.
Stone and metal may share display colours while differing in how geometry
selects among them.

No sprite stores an RGB value. Eye and flower pixels carry signal material ids.
The palette resolves them through one authored two-colour `machineSignal` ramp:
pastel red in the ordinary state and pastel light green in the greeting state.
The eye never closes or changes shape. The colossus flower uses the same red
signal material, keeping its focal colour separate from the green moss deposit.

## Ecology

They are rare, peaceful meadow residents: one of each species, long rests, long
committed routes, no pursuit and no flee. Spawn and goals must satisfy the
generator's biome, dry-ground, slope, shore, trail, and place clearances.

A nearby traveller may receive one bounded greeting at a time. The nearest
available machine approaches without leaving its activation neighbourhood,
plants both feet, pulses its normally red eye green three times without changing
the aperture shape, and returns it to red. It then follows at its ordinary
6–10 px/s gait for a short interval before resuming the interrupted route. No
arm, shell, fork, or balancing disc waves or nods. This is an authored encounter
tradition, not dialogue, taming, recruitment, mammalian affection, or indefinite
companionship.

Their collision radius is real. The traveller and the other solid machines
cannot cross the bronze body. Contact pressure is derived from model mass and
foot area; it can exceed the sward's yield threshold even though ordinary
boots leave grass to spring back.

## What tests can claim

`test/machine.test.mjs` checks scale, material vocabulary, unit normals,
determinism, grounded views, unique poses, mass ordering, support margin, moss
exclusions, and speed/cadence coupling. It cannot prove that a shamble is
beautiful or that the silhouettes match the reference. Those remain visual
decisions, reviewed through a deterministic real-frame capture.
