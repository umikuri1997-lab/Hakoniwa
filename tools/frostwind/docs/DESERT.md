# The Amber Waste, Measured

A sand sea at 24 N: a dune field, the pavement the sand blew off, one
deflation-hollow oasis, and the evaporite ring around it. Two households that
cannot both have the water. Something under the sand that cannot come out onto
the rock.

Every other world in this project has one cause that everything reads. Frostwood
has snow light, the meadow has pond optics, the swamp has one hydrology field.
This world's is **wind**, and the chain is:

```
wind bearing + friction velocity
  -> saltation flux        -> dune shape
  -> angle of repose       -> slip faces, and where you can walk
  -> the swept corridor    -> where a house may stand, and which way it faces
  -> suspended fines       -> what the storm hides
  -> fluidisable ground    -> where the worm can swim, and where it cannot
  -> abrasion              -> the veil
```

`WIND_A` already existed in `src/constants.js`. This world reads it rather than
declaring a second wind.

## 1. The dune field

A dune is asymmetric because saltation is. Grains hop up a windward face that
the flow keeps planed at about 12 degrees, fall out past the brink, and build a
lee face that steepens until it avalanches. So a transverse dune has exactly two
slopes and one of them is a material constant.

Given the two angles and a wavelength the profile is **determined**: the brink
sits where the rising and falling faces reach the same height, and the amplitude
is that height.

```
brink a = tan(repose) / (tan(repose) + tan(stoss))       = 0.760
amplitude = tan(stoss) * a * wavelength                  = 0.162 * wavelength
```

Nothing about the landform is tuned. `SURFACE[SURF.sand].repose` is the slip
face, which makes this the first reader of a law `docs/CANON.md` has carried as
available and unclaimed since sprint 3.

### The one concession, and it is uniform

A real simple dune spaces at 100-300 m; the viewport covers 32. The field is
drawn at **an eighth** in every axis at once. A single factor leaves every angle
untouched, so the slip face is still exactly at repose and only absolute size is
conceded — the same concession trees already make at 0.16-0.20x life.

The factor is a measurement rather than a taste. At a quarter, one wavelength is
612 px against a 480 px viewport: a screen holds three quarters of one windward
face and the picture reads as a gradient. At an eighth it is 306 px and a screen
holds a crest, a slip face and the next crest coming, which is what a dune field
looks like. **A landform has to repeat inside a frame to be read as a landform.**

### Nothing stands steeper than repose, and four things tried to

The law is asserted over the *composed* surface — profile, sheet cover,
corridor and sinuosity together — because a law that only holds on the term it
was derived from is not holding. Getting there cost four measured corrections:

| what | measured | why |
|---|---|---|
| crest wander varied along the wind as well as across it | 0.728 vs 0.675 | that does not move a crest, it compresses the cycle, and a compressed cycle climbs the same height in less ground |
| the corridor's flank had no taper argument | 4.7 vs 0.675 | a sand cliff seven times steeper than sand, drawn around every road in the world |
| `pathDist` divides by the trail's local slope | up to 2.5 | far from the trail its own gradient carries a term proportional to distance times curvature. The corridor is measured as a plain horizontal offset, whose gradient is bounded by `sqrt(1 + (dx/dy)^2)` and the trail caps `|dx/dy|` near 0.9 |
| an oblique crest crosses its cycle in less ground | 10% | corrected exactly, which also makes an oblique dune a *lower* dune. That is what less sand per length of crest buys |

The residual is 0.75% — 34.19 degrees against 34.00, inside the 32-34 band the
constant itself is quoted from — and it is the sinuosity correction's own
spatial gradient. Named where it is asserted rather than tuned away.

### Cover truncates, it does not scale

`min(profile, cover)` rather than `profile * cover`. Multiplied, a half-cover
dune has its own faces at half the repose slope *and* the cover's gradient on
top, so the two share one budget and both have to be softened until the erg is a
field of low mounds. Taken as a minimum, `min()` cannot be steeper than either
of the things it chooses between, and what it draws is a dune train emerging
from a flat sand sheet with the crests sliced off where the sand runs shallow.
That is what the margin of an erg looks like.

### A dune is marked by a rim at its brink

Legibility floor, stated. At noon at 24 N a 34 degree slip face costs 17% of
the cosine, a third of a rung on the four-rung sand ramp. Measured with no
mark: 100% of lee and 98% of stoss pixels painted the same rung, and the erg
drew as one flat sheet. Shading the whole lee face one rung drew 73 px bands,
and review rejected them as colour noise. The mark is a rim on the lee side of
the top edge: 2 px of the next rung down, then 7 px of half checker. It covers
2% of the sand. `RIM` and `paintDesert` in `src/world/ground.js` own it,
`PROJECTION.md` states the rule, and `test/desert.test.mjs` holds the rim's
place, share and rung.

## 2. Surfaces

Three appended rows, and one borrowed pool.

| row | notes |
|---|---|
| `sand` | `repose:34`, `print:1`, `dither:1`, `speed:0.62` |
| `hamada` | varnished gravel pavement. `print:0`, `speed:1`, `dither:0` |
| `sabkha` | evaporite crust. Bright, brittle, prints |
| oasis water | reuses `SURF.pond` through the `ground` remap |

**`speed` is a cost, not a penalty.** Walking on dry sand costs roughly 1.6-2.7x
the metabolic rate of firm ground at the same speed (Lejeune, Willems & Heglund,
*J Exp Biol* 201:2071-2080, 1998), because the foot does work on the grains that
the grains do not give back. Taken at the low end. That difference is the only
reason this world's road exists: nothing worn is drawn anywhere, and the route
is legible because it is the only firm ground for a dune either side.

**Desert pavement is dark because it is stable.** The manganese-iron varnish
accretes on a clast that has lain still for a long time. That is the same fact
the settlement is sited on.

**The fourth world found the third one's ceiling.** `flag * FLAG_Q` is written
into an unsigned byte and at a quantum of 16 the swamp's boardwalk was the
fifteenth and last surface. Sand wrapped to snow and an erg came back reading as
a snowfield, silently. `FLAG_Q` is 8; the note in `src/constants.js` had
predicted the failure and named the fix in the same breath.

## 3. The oasis

One water body, and it is not a lake that happens to be in a desert. Sand holds
no surface water; what stands here stands because the wind scoured the interdune
floor down to the water table. So the sand is absent **because** the pool is
there, and `duneEnvelope` clears around it for the same reason it clears along
the road.

Written the other way round — a bowl of water fighting a dune field that did not
know about it — the world's only pool survived at one seed in three and dried
out at the other two. `test/desert.test.mjs` measures three seeds for exactly
this.

**The salt is a ring, not a disc.** Water leaves by evaporation rather than by
flowing away, so what was dissolved in it stays — but not at the waterline.
Close in, the pool keeps flushing the ground and the reeds hold a fresh fringe;
the crust forms at the *outer* limit of capillary rise, where the water arrives
and cannot leave.

**The oasis borrows the meadow's pond whole**, optics and ramp. Both are shallow
fresh water over a pale mineral bed, which is the pair of facts `pondT`
integrates; what differs is the eye's adaptation, and a second four-rung water
ladder costs four of the sixty-four entries `POST_FS` iterates in a world with
one pool in it. Declared rather than hidden.

## 4. Blown sand

`SAND` sits beside `RAIN` in `src/weather.js` on the same contract: a frozen
row, a CPU mirror for tests, one GLSL chunk shared verbatim.

- threshold friction velocity, Bagnold 1941:
  `u*t = A sqrt(((rho_s - rho)/rho) g d)`, A near 0.1 -> **0.230 m/s**
- through the law of the wall with `z0 = d/30`, that is an **8.1 m/s** wind at
  ten metres, which is where field observers put the onset of visible drift
- transport `q = C (rho/g) u*^3`. The cube is why a storm arrives suddenly:
  twice the wind is eight times the sand
- hop height goes as the square of the launch speed and time of flight as the
  square root of height, so the grain's forward speed is its own hop over its
  own time. There is no speed constant anywhere in the model

**The scene's switch is not the intensity.** It says the world *has* sand
available to move; whether any moves comes from the wind against the threshold,
inside the shader. Below 8 m/s the bed does not move and the control draws
nothing at all. That is an off state with a cause rather than a fade.

**A sandstorm is not rain turned sideways.** Grains saltate, so nearly all the
moving mass is in the first few centimetres and the near ground is a seething
skin of short fast dashes; everything above it is the fine tail of the size
distribution in suspension, which is a haze and is drawn as one. The dash is an
**exposure**, not a hop: a three-metre hop takes half a second and a frame is a
twenty-fourth of one, so a grain draws two to five pixels.

### The haze ceiling is a law of the medium, and it wins here

Mixing every entry of this world's snap list toward the sand's lit rung, the
number of surviving distinct colours falls off a cliff between 0.50 and 0.55 —
fourteen against eight. The physics will happily ask for far more; past the
cliff the frame is a flat wash with a few grains on it rather than a world you
cannot see far into. **This world's worst weather is drawn less bad than it
is**, and the deviation is recorded.

### The mirage is refused

An inferior mirage needs a grazing ray and a horizon in frame. This projection
has neither — `W_GROUND_FS` already states from the other side that airlight
over the thirty metres a screen covers is six parts in ten thousand. Drawn
anyway it would be a screen-space effect wearing a physical name.
`test/weather.test.mjs` fails if anything in the shaders starts drawing one.

### Ripples are drawn at the floor and shaded at the sun

A ripple for this grain spaces at about 8 cm, which is 1.2 px, so the drawn
spacing is the legibility floor and the exaggeration is stated. Its **shading**
is not exaggerated to match: the ripple index puts its steepest face near 10.5
degrees, and against a sun 89 degrees up that costs 1.7% of the cosine where a
34-degree slip face costs 17%. So a ripple gets exactly a tenth of a dune's
shading and no more. At solstice noon on the tropic the surface texture of a
desert is nearly invisible, and drawing it at full strength would be drawing a
raking light this world does not have.

They are absent on slip faces, because a lee face is a fresh avalanche and
saltation is what builds a ripple.

## 5. Flora

Three plants, three answers to one shortage.

- **date palm** sits on water it did not have to find and is not drought
  tolerant in the least. It is a wetland plant that happens to live in a desert,
  which is why the oasis is the only reason it is here.
- **acacia** found water forty metres down and pays for the taproot by spending
  everything above ground on shade: the widest crown in the table on the lowest
  crown ratio in it, over a bole browsing keeps bare. The negative up-bias is
  most of the umbrella — a branch that keeps reaching upward builds a dome.
- **dune grass** does not look for water at all. It grows up through burial
  faster than the sand arrives, which is how a dune gets fixed.

That last one gives the world its own placement axis. `HABITAT` gains a `sand`
window on the dune-cover field, and the three rows are the three answers to it:
never, sometimes, always. **Where the grass takes hold, the dune stops.**

`desertCanopy` is derived. A xerophytic leaf is greyer and brighter than a mesic
one in every band — a thick waxy cuticle and a hair layer reflect rather than
absorb, which is what they are for — and it transmits less. So a desert canopy
shades harder per leaf while having almost none: `CANOPY.desert` is k 0.50 at
LAI 0.35 against the swamp's 3.10, which is why a shadow here is a hard edge
with nothing filling it.

## 6. Fauna

A fennec, a sandgrouse and a horned viper, hand-placed like the rest of
`src/animal.js`. The activity curves are honest rather than flattened to keep
something on screen:

- the **fennec** is crepuscular and the world is pinned at noon, so it is at its
  least active exactly when you are looking at it. What you find at midday is
  one lying in shade.
- the **sandgrouse** carries water to its chicks in its belly feathers and comes
  to the pool at the same hour every morning. Its knots are a timetable — the
  one animal in the project whose day is a commute.
- the **viper**'s rest state is `buried`, which is what it does all day and also
  its whole answer to being disturbed.

They are drawn dark, and that is a concession with a reason: all three are
sand-coloured because being hard to see on sand is the point of them, and at
five pixels in the sand's own rungs they would not be hard to see, they would be
absent.

## 7. Built form

Two vernaculars, and the ground chooses between them.

### The oasis hut, `src/desert-hamlet.js`

**The wall is thick because of when it lets the heat through.** A daily
temperature wave entering a solid wall arrives late and flattened. Penetration
depth `d = sqrt(alpha P / pi)` is 12.1 cm for adobe, and the lag at depth x is
`(x/d)(P / 2 pi)`. Outdoors peaks mid-afternoon; the inner face should peak in
the middle of the night, when the door is open and the roof is being slept on.
Sized for an **eleven-hour lag** it comes out at **35 cm**, inside the 30-60 cm
earth walls are actually built at. The course is 9 cm because that is a mud
brick with its bed joint — a third of the timber course this project already
carries, so an earth wall has three times a log wall's horizontal rhythm.

**The roof is a vault because there is no timber.** A flat roof needs beams and
beams need trees, and the only tree here is worth more standing. A Nubian vault
is laid in leaning courses against an end wall so it needs no centring either,
and it carries itself in compression, which is what earth is good at.
`roofPlane` already takes an arbitrary profile, so the barrel is a sine in
`riseAt` rather than a second roof implementation.

**The windcatcher's intake is set by the storm.** A malqaf must not take in the
sand it is standing in, and nearly all the moving mass is inside the saltation
layer, whose scale height is the mean hop. The intake clears ten hops at the
strongest wind the control can ask for: **3.53 m**, and that number comes out of
`src/weather.js`. The transport model sets an architectural dimension, which is
the tightest coupling in this world.

The deflector wall is the drift model drawn: sand piles against the first thing
it meets, so the first thing it meets is deliberately not the door.

### The goat-hair tent, `src/desert-camp.js`

The meadow's pavilion answered by a different world, so it borrows that file's
tensile layer rather than writing a second one. Everything they disagree about,
they disagree about because of the ground and the air.

- **Low and wide.** A pavilion is a cone because it sheds rain and wants pitch;
  nothing here sheds rain. What this shell survives is wind, and a tensile
  structure in wind is a lever whose moment goes as the height above its
  anchors. The ridge sits at two metres against the pavilion's five.
- **The ridge sags between poles.** A pavilion hangs one apex and draws straight
  lines; this hangs a row, and cloth between two supports takes a catenary. Add
  a pole and you add a scallop, which is why a household's wealth is counted in
  poles and why the variants are counts rather than shapes.
- **The anchors are buried, not driven.** A peg holds by friction against soil
  that dry sand has none of; a deadman holds by its own overburden. A driven peg
  wants a steep pull and a buried plate wants a flat one, so the guys run out
  long and low and end in nothing you can see but the heap put back on top.
- **The weave is the drawn rhythm.** Strips about 70 cm wide sewn edge to edge,
  which is 11 px — the same role the hut's brick course plays.

### Why there are two of them

A dune migrates, so a wall standing on one is buried by the thing it is standing
on. `siteLegal` requires an earth house to be pavement over its whole footprint,
which is why the hamlet is on the corridor. A tent is the other answer to the
same fact — light, anchored in the surface rather than through it, struck and
raised again when the ground arrives — so it declares `onSand` and stands
exactly where a house may not.

Neither may stand on a slip face. That is at the angle sand stops holding at and
is the one piece of ground here that is not ground.

## 8. Two cultures, one pool

Nature constrains the site and does not dictate the culture, so the same water
gets two incompatible answers: a household that cannot move because its trees
cannot, and one that cannot stay because its herd cannot. Both are fictional
choices among many valid ones and neither is a claim about any real people.

The schedules are the argument. The gardener's day is cut in half by the sun and
she works either side of it, spending the middle behind the eleven-hour wall
that was sized for exactly that. The drover's is one long crossing that starts
before it is light. The one node they share is the gathering at the water.

**Water is measured in time.** A shared channel is allotted in turns of so many
shadow-lengths, read off a stick, because you cannot meter a flow with nothing
but the sun — and time makes a scarce thing divisible in a way volume does not.
So the use-node list gains a `shadow-stick`, and it is the only node in the
project that is a clock.

### Climate does not select colour

The obvious derivation — that desert clothing must be white — is wrong.
Shkolnik, Taylor, Finch & Borut, *Nature* 283:373-375 (1980), put Bedouin men in
black and in white robes in the Sinai and found **no difference in heat load**:
the dark surface absorbs more and the loose weave convects the excess away
before it reaches the skin. What climate selects here is looseness, coverage and
layer count. Colour is culture, and the physics declines to overrule it.

`FASHION_VOCAB.desert` therefore has no pale-only rule in it, and the dyed band
is licensed by a measurement rather than tolerated. Nothing bare, for the
opposite reason to the boreal row: a bare shin burns and abrades. Nothing
padded, because the whole design is a still layer of air and a quilt is that
layer filled in. Every head covered.

### The veil

A hood that also crosses the jaw, leaving one open eye row. What makes it read
at five columns is that the cloth runs unbroken from crown to shoulder where a
hood breaks at the jaw. It is for abrasion and evaporation before anything else:
blown sand strips an exposed face, and every breath through an open mouth in air
this dry is water leaving.

Three things the raster overruled, all measured:

- a 2 px sleeve gave the traveller a 7 px shoulder on an 8 px chest, so the
  robe's looseness moved to the cut and the open outer layer
- a scarf tail plus the veil's own loose end put two hanging ends on one
  shoulder
- the veil's wound end stops at the jaw rather than two rows past it

## 9. The worm

See `src/worm.js` for the body model. One invented law, one sentence:

> A body may fluidise the sand it displaces, so drag on it falls to that of a
> dense fluid rather than a granular solid.

It does not cancel mass, weight, momentum, support or contact. The consequence
that carries the world is what it **cannot** do: gravel does not fluidise, so
every piece of firm ground here is ground the worm cannot enter. That is why the
settlement stands on the pavement.

Everything else is measured. Speed is the body's own wavelength times its own
frequency times the wave efficiency near 0.5 that Maladen, Ding, Li and Goldman
measured by x-raying a sandfish through sand (*Science* 325:314-318, 2009). The
angle of repose bounds what you see: each metre of depth buys `1/tan(repose)` of
half-width while the same displaced volume spreads over it, so a shallow worm is
a narrow sharp ridge and a deep one is a broad low swell, and they are the same
animal.

**The minimum depth is derived, and it is the best thing in the model.** The
mound over the worm is ground, so its flanks obey repose; a raised cosine's
steepest slope goes as `1/w^2` and `w` grows with depth, so a worm running too
shallow would raise a mark that could not stand up. Solving that gives 0.99 m at
a 3.2 m girth. The animal cannot swim just under the surface, and nobody decided
that.

Most of the time it is not a creature at all. It is a travelling deformation of
the ground, added to the baked normal in `W_GROUND_FS` as a function of world
position and time — the same thing the snowfall is, and for the same reason:
there is no simulation anywhere in this project.

## 10. Verification

```bash
npm run test:desert          # dune profile, repose, connectivity, oasis, budgets
npm run test:desert:report   # the surface census, by seed
npm run test:worm            # the wave, the cone, the derived minimum depth
npm run test:weather         # threshold, cubic transport, haze ceiling, refusal
npm run test:biome           # ramp derivation and the snap budget
npm run test:built-form      # the hut and the tent on the shared construct layer
npm run test:culture         # the vocabulary and the two packages
npm run test:frame           # one real frame, every pixel a declared entry
```

Captures:

```bash
node tools/shot.mjs --dunes --zoom 3
node tools/shot.mjs --oasis --zoom 3
node tools/shot.mjs --hamlet --zoom 3
node tools/shot.mjs --camp --zoom 3
node tools/shot.mjs --dunes --wind 2.4 --zoom 3     # the storm
node tools/shot.mjs --worm --time 40 --zoom 3       # a crossing
```

## 10a. The camel

The third rigged quadruped, taken on because it disagrees with both of the
others in ways `src/gait.js` can already express and no rig had asked it to.

1. **It paces.** Both ipsilateral limbs swing together, which is a lag of zero
   on Hildebrand's diagram. `sequenceName` has named that coordinate since the
   module was written and nothing had ever stood there.
2. **It does not trot.** Its fast gait is a faster pace, so its clip list has no
   diagonal gait in it at all. The model states that by what is absent.
3. **Its forelimb is a column.** The carpus rides high and the chain runs nearly
   vertical, so the solver's bend is nearly out of work and both `bendSign` and
   `kick` are smaller in magnitude than in either other rig.
4. **Its high point is not a topline.** A deer's sacrum stands above its withers
   and a wolf's withers are its high point; this animal's skeleton is nearly
   level and what stands above it is a fat store sitting on the spine. Two
   toplines, for the first time.

### The species changed, and the deviation moved

This shipped as a dromedary, *Camelus dromedarius*, which is the camel that
belongs at 24 N. A viewer reported that it did not read as a camel. At a 43 px
canvas one hump is a swaybacked horse, and the shape a viewer recognises has two.

So the rig is a **Bactrian**, *Camelus bactrianus*, and the anatomy is honest:
two humps with a real saddle between them, a shoulder 1.60-1.85 m instead of
1.80-2.10, a deeper barrel, and the winter coat's throat mane and foreleg
feathering. What that costs is **range, not anatomy**. The Bactrian is a Central
Asian animal of cold deserts and this is a Saharan latitude. The domestic
Bactrian is the caravan animal of the Asian desert roads, which is what makes it
defensible beside a culture built on caravans, and it is still a stretch. The
row is in `docs/CANON.md`.

The notch is asserted twice, on the pose and on the pixels. The first raster
drew each hump on its own arc and then the saddle, and the measured profile came
back crown, notch, plateau, notch, crown: three bumps, because each arc tapered
to the back line before the next began. The pose was right and the drawing was
wrong, which is why `test/camel.test.mjs` now reads the drawn silhouette.

A pace stands on a **line** down one flank rather than on a triangle, so the
body rolls onto the other side. That is the only lateral term in the project,
and the deer and the wolf must not gain one.

The foot is the measurement that leaves the body module: a sole spreading to
about 0.02 m^2 puts a 500 kg animal at roughly 60 kPa, against about 55 for a
standing adult on two feet. **The same ground pressure on a far larger animal**
is the whole of why a camel crosses sand a person wades through, and it is the
one place this rig's anatomy touches the terrain model rather than only its own
silhouette.

`src/gait.js` and `src/quadruped.js` did not widen. The rig needed the `pace`
branch that already existed and nothing else.

## 10b. Riding

The traveller arrives on foot and mounts a herd camel by walking up to it and
pressing space. The offer is a circle around the animal: its declared breadth
(`ACTOR.camel.solidRadius`) plus one arm, stated in metres and converted by
`src/scale.js`. Screen rows are foreshortened by half, so the row difference is
scaled back up before the circle is tested, the same correction collision makes.

Mounting is a loan rather than a spawn. `LifeRuntime.detach` hands the scene the
actor object itself and records the member id, so streaming cannot build a
second body for an animal that is under the traveller; `attach` puts the same
body back with its heading, gait phase and life record intact. The camel keeps
the ground the pair stood on and the traveller steps down beside it.

The white ring around what is within reach is the one deliberately off-palette
mark in the picture. It is written in `POST_FS` after the palette snap because
a white that goes through the snap comes out as the nearest legal rung, and the
desert has no white to snap to. It is UI over the frame rather than a material
in it, and it exists only while the traveller is standing next to something.

Everything downstream already asked one question. `camelMounted()` selects the
camel's speed pair, its collision breadth, its pad prints and the two-sprite
draw, and it now reads the mount state instead of the scene id.

## 11. What this world does not have

- **A breach.** The worm is a swell and a wake; the bounded above-sand
  appearance the frame-height law allows is not drawn.
- **Its own music.** `MUSIC_TRACKS.desert` borrows Frostwood's and says so in
  the data; `test/music.test.mjs` asserts that at most one world may.
- **Night.** Not represented in the compiler, so the nocturnal fauna that would
  be the obvious picks here are left out rather than drawn awake at noon.
