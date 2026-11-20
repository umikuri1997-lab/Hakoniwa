# Life: rigged animals, and the hole where people were

Living bodies share the project scale and pixel medium, not one universal body
model. `src/scale.js` owns stature: `PLAYER_H = 26 px = 1.70 m`. Each production
rig then owns measured morphology, named motion states, raster consequences, and
an explicit boundary beyond which its assumptions may not be generalized.

The deer and the wolf are production rigs. There is no human one.

## Medium laws for anything alive

These bind every body, and none of them is a proportion. They were written down
inside the retro figure's specification and are restated here because deleting
that specification nearly took them with it: each one is a measured failure that
cost a sprint to find, each applies to the deer and the wolf today, and each will
bind whatever draws a person next.

1. **The world anchor is invariant.** A contact lies on the projected ground
   plane. In front and back views a foot ahead of the body may raster BELOW the
   body's anchor row, and moving the anchor to hide that travel is prohibited:
   it buys a tidier sprite by making the body's position a lie, and every
   shadow, sort and footprint downstream reads the lie. `figure-deer.js` sets
   `sp.ay = pose.M.ground` for this reason, and both animal suites assert "the
   raster stays grounded". The merchant's load was pinned the same way and it is
   why he read as carrying weight; see `reference/merchant-load.md`.

2. **Distance owns phase; samples own pixels.** A cycle advances by resolved
   post-collision distance, never by elapsed time, so walking into a wall
   advances nothing and leaves no tracks. Asserted for the traveller in
   `test/tracks.test.mjs` and for figure NPCs in `test/life-runtime.test.mjs`.

3. **Stem width is declared, and negative space survives every later pass.** A
   limb at this scale is one or two pixels wide, and a rim, normal or shading
   pass may not widen it or fill the gap between two of them. The gap IS the
   read: at 26 px two legs a pixel apart are one leg the moment anything
   thickens them. `test/deer.test.mjs` and `test/wolf.test.mjs` both assert
   straight load-line legs with a single joint pixel.

4. **A body is connected.** No floating pixel, no detached limb. Both animal
   suites measure it as `connectedFraction === 1` over every state, direction
   and frame, which is cheap and catches a whole class of projection error.

5. **A declaration must reach pixels.** A width, hem, stance or damping field
   that no rasteriser reads is a comment with punctuation. This is the golden
   rule in `AGENTS.md`, and bodies are where it was learned: a set of arms was
   once reviewed, committed and found to be invisible because two materials
   resolved to one colour.

6. **Anything alive is rigid in the wind.** `windUV` shears a sprite's rows
   sideways when it gusts and skips any instance with a negative phase. A thing
   bends because it is a stem, so `KINDS` in `src/species.js` is the authority
   and every animal and person is rigid by name. Before that split, boars,
   herons and the traveller rocked like saplings. `test/weather.test.mjs`
   resolves one prop per atlas kind and asserts it.

### The self-validating model

A generated skeleton, tests that prove its own segment lengths, and a baseline
updated before anyone checks the result against the intended figure. Every check
passes and the figure still looks wrong, because nothing in the loop asked the
question that mattered.

Head counts, adult anthropometry, segment-mass tables, centre-of-mass checks and
generic heel/flat/toe diagrams are **comparison** material. They may not decide
production rows or gait keys unless a measured raster failure identifies the
need first. A visual judgement is the human's, which is the rule the three
deleted human rigs broke. All three were green when they shipped.

## People

Three human rigs were deleted in one commit, V1, the retro cast and the person
model, for one shared reason: each solved joints in continuous space and then
quantised into a figure 26 pixels tall, where a limb is one to two pixels wide
and one pixel of rounding is a ten percent limb-length error that changes sign
between frames. That is what the bad walk was, in all three. Every table that
draws a person now is authored as integers on the grid, and where a limb has
to travel it is a straight raster run between two integer endpoints.

There is one raster and one cast list. `src/people.js` is the list; it says who
is a person, and every consumer resolves a name or an atlas key there rather
than importing a cast of its own. `src/body-folk.js` / `src/figure-folk.js`
paint the entire cast — the traveller in three wardrobes, the boreal residents,
the meadow residents and the swamp pair. The person rig
(`body-person.js`/`figure-person.js`) that once split the cast with it is
deleted; the merchant's authored load survives in `reference/`.

The cadence law lives once, in `body-folk.js`: step length is 0.415 of stature
(Grieve & Gear 1966), which is why a short man's boot prints fall closer
together than a tall one's.

### Proportion, measured against the raster

`reference/v1-figure.md` argues a 3.71-head figure "at this scale". The STRANDED
read in the deleted `body-person.js` draws 3.2 heads, a coat 58% of stature
wide, and legs 19%. The folk table instead measured the MOCT townsfolk raster
at its native 35 px and returned legs at 49%.

Beside a STRANDED townfolk in one frame, that figure read as a different
species. Its hem sat at mid-thigh where theirs sits near the ground, and the eye
went to the legs as the longest thing. Ten sheets in `assets/townfolk` measure
**body about 62% of stature, legs 5% to 16%, head 22% to 35%.**

`body-folk.js` carries the STRANDED read: **head 23%, body 65%, legs 11%**,
inside the measured band on all three.

### A leg is one pixel on any row, and that is what buys the wide step

The move sheet settles the other half of it. Every leg on it is a **one-pixel
column of `#151d28` or `#202e37`, two to four rows long**, dropping out of a coat
wide enough to hide where it attaches. No grey.

**One pixel is a statement about a row, and a leg may carry one joint pixel.**
"One column per leg for the whole frame" held while every wardrobe was a long
coat over two or three rows of leg, where the distinction cannot arise.
`coatCut: short` leaves the meadow traveller **seven** rows, and over seven rows
a column that never steps sideways is a post. The law is medium law 3: on any
row below the hem there are two legs, each one pixel wide, and across a frame a
leg may step once. That is the single jog `test/deer.test.mjs` and
`test/wolf.test.mjs` already allow every animal limb.
`test/folk-raster.test.mjs` measures both bounds. The per-row half is stricter,
because two columns is two columns however they are stacked.

**The two values are the garment, and that is the only way a leg is dressed.**
The run is divided by value; it is never widened. `body-folk.js` carries the
divisions from Drillis & Contini 1966: the knee is 46% of the way from hip to
floor and the malleolus 93%, so a boot starts at 93% of the drawn run and a
short stops at 40%, just above the knee. They are fractions of the RUN rather
than of stature because anatomy wants twelve rows of leg here and the cut leaves
between three and seven; the ratio is the only thing that survives that.

**Bare skin is the signal**, because this figure has no other skin. The
reference spends two pixels of it on each hand and none anywhere else, so a shin
below a short is the same surface as a hand and takes the same value, the
warmer of the two rungs, never the eye's, so the face keeps the top of the
ladder to itself. Three pixels of shin against two of hand is a budget that
reference already sets.

The version this replaced solved a hip, a knee and an ankle. Every extra pixel of
stride made that leg more diagonal until it either read as a split or broke
8-connectivity and had to be clamped back, which is why its stride was stuck at
two pixels. A stub is attached wherever it stands as long as it stands under the
garment, so **the stride ceiling moved from the leg's length to the coat's
half-width** and the clamps went with it. Measured on the sheet: feet six pixels
apart at contact on a 25-row figure. Ours are measured too, and they vary with
the coat because the coat is what bounds them: 8 px axial and 6 px in profile on
the lined boreal coat, 6 and 4 on the thin meadow and swamp jackets, which are a
column narrower in both axes. At the pass all three close to a single column.

The joint pixel does not bring that rig back. It is one integer in the pose
table, the same offset on every frame that names it, and the shin is still a
straight raster run between two integer endpoints. Nothing solves an angle.

Two more things that sheet decides:

- **A front-facing stride is foreshortened, not invisible.** Its feet open to six
  pixels at contact and close to a single column at the pass. An axial walk that
  moves only the lift is a bob with no steps in it.
- **The swing foot leaves the ground, whatever the cut left it.** The lift was
  three rows against a leg the cut makes 2 rows long under a long coat and 7
  under a short one, so it erased the leg on the covered wardrobes and shortened
  it by three of seven on the one that shows leg. It is a fraction of the drawn
  run now. At the pass the fraction is `1 - LEG_KNEE`, so what stays drawn is
  the thigh with the shin folded behind it, and the two fractions agree because
  they are the same fraction.

**The schedule is normalised and the raster resolves it.** Both halves used to
be pixel counts measured against a geometry the table never saw. `coatCut` moves
the hem and `coatBulk` moves the coat's width, so one table met three different
bodies and a clamp finished the job: the authored stance 4, 2, 0, -2, -4 is
uniform at -2 a frame, and clamped to a thin coat's reach of 2 it became
2, 2, 0, -2, -2, so the planted foot stalled, moved two, moved two, stalled. A
fraction cannot saturate. `figure-folk.js` measures the drawn leg run and this
view's reach and hands both to `folkPose`.

**The swing passes under the hip.** It used to peak at toe-off while the foot
was still behind the body, then descend as it threw forward and reach full
extension a frame before touchdown, which is a rear limb pawing. The signed
separation ran +8, +3, -2, -6, -8, crossing zero between frames, so no drawn
frame had the legs coincide and the silhouette never resolved to one leg mass.
Frames 2 and 6 are a true pass now, and `WALK_CROWN` already peaked there, so
the vault and the pass name the same instant.

**Near and far are a rung apart, and that doubles the profile bank.** Two
identical legs half a cycle apart put the same pair of columns on screen at `f`
and `f + 4`, so painting them alike made the second half of the walk a redraw of
the first: eight frames baked, four drawn. `folkDark` has three rungs and
material 17 reaches two of them at the flat normal a leg carries, so the
separation lands on the boot band and the trouser tiers round together.

MOCT was not wrong, it was answering a different question. What it got right and
what the folk raster kept is the VALUE discipline: flat masses, few tiers, hard
edges, and a maximum-contrast face. What it got wrong for this world is where the
mass goes.

Both readings disagree with the 3.71-head claim, and this is §"The failure to
avoid is a self-validating model" seen from the other side. Each table in turn
was green, internally consistent and justified. The only thing that ever moved
one was putting the drawing next to another drawing. Anthropometry may
compare; it may not decide production rows.

### The face is two pixels, and neither of them is skin

Every one of the ten sheets draws the same face: an **eye band two pixels wide**
in `#f2d3ac`, the **rest of the face two pixels wide** in `#f3a787` directly under
it, and nothing else. No eyeballs, no mouth, no skin tone. The **hands are two
pixels each and spend the eye's own value**, which is what makes a figure this
small read as holding its arms rather than as having a smudge at the hip.

An earlier folk head drew two isolated bright pixels for eyes. Beside a townfolk
they read as pinpricks: two loose pixels are noise, and a two-by-two block is a
face.

Those two colours are `folkSignal`, and it is **two rungs on purpose**. The accent
branch resolves the top rung at every sun elevation and the bottom rung at every
sun elevation, so a signal pixel is one of exactly two colours instead of sliding
between four as the light turns. `machineSignal` is the same shape for the same
reason. A focal point that changes hue is not a focal point.

### What else the folk raster is bound by

- **One man, three wardrobes, and the world picks.** `people.js` holds the only
  map from biome to cast row: `traveller` in Frostwood, `meadowTraveller`,
  `swampTraveller`. It was three lookups that all agreed the meadow gets the
  boreal row, so the hero crossed an open field in clear sun in a lined winter
  coat. Frostwood is a long lined coat over trousers with a tucked shirt and
  nothing bare but his face and hands; Sun Meadow is a short open jacket, an
  untucked shirt, shorts and a straw brim wider than his shoulders; Green Swamp
  is loose and open above and covered below, because standing water is insects
  and sawgrass. `test/folk-contract.test.mjs` asserts the three never bake the same
  pixels in any view or frame.
- **Colour, and the loud part is small.** A garment's mass is the fleece it was
  cut from, so it rides `folkWool`, `folkUmber` or `folkOat`: undyed wool at
  Oklab chroma 0.026 to 0.086, every rung darker than the snowfield it stands
  on. Dye was traded north and cost money, so it appears as a BAND, a hat brow,
  a cuff, a sash, a hem stripe, on `folkDye`, two rungs of madder and weld at
  chroma 0.151, on material 18. `folkCoat` is the one dyed MASS and it belongs
  to the traveller. Four saturated coats stood here once and the picture had no
  hero in it; a person is allowed to be louder than the world, and a village is
  not. `src/culture.js` decides who wears what and `src/palette.js` carries the
  sources.
- **A ladder here may be lifted but not widened.** The collision gate in
  `test/biome.test.mjs` derives its tolerance from the median rung step across
  every ramp, and three pre-existing derived pairs sit two hundred-thousandths
  under it, so the ceiling on any new ramp is a step of 0.094 dE_ok whatever the
  rung count. That turned out to be the right instrument anyway: a figure reads
  brighter because its floor came up off the near-black, not because its span
  grew. The reasoning is recorded beside the ramps in `src/palette.js`.
- **The dominant mass takes the brightest rung.** A coat painted mid-ramp spends
  the top of its own ladder on nothing; everything else steps down from the coat.
- **The signal is the brightest thing on the body**, and `test/folk-colour.test.mjs`
  asserts it. That is what caps the rim allowance at 0.40: at 0.5 the shader
  resolves an edge to snow rung 5 and the outline becomes the focal point.
- **`reference/merchant-load.md`**, the merchant's pack, and the one trick that
  made it read as carried weight: the load was pinned to the world contact row
  while the body rose and fell underneath it.
- **`src/attention.js`**, aim, look transitions and preparation anticipation, on
  the Flash & Hogan minimum-jerk trajectory. The look banks give it pixels to
  move in the three views that draw an eye.
- **`ALBEDO.skin/hair/boot`** in `src/sunlight.js`, measured reflectances with a
  citation, still unread.

## Rigged animals: European roe deer

`src/body-deer.js` is the physical and kinematic authority for the first rigged
animal. `src/figure-deer.js` is its raster projection. This is a deer-specific
proof, not a generic quadruped API.

### Subject

The world animal is one adult male European roe deer (*Capreolus capreolus*;
Finnish *metsäkauris*) in winter coat. The requested silhouette is a
January–February buck: the old antlers have been cast and the next compact set
is growing in velvet. Roe antlers are close-set and usually carry no more than
three points per side; they are not a red-deer rack.

The supplied poster establishes the useful block language, long uninterrupted
legs, a compact barrel, strong negative space and a rectilinear crown. It is
not the biological authority. Its oversized rack and spotted body would
describe neither an adult roe buck nor a winter coat.

### Measured body and raster consequence

All pixels descend from `PLAYER_H = 26 px = 1.70 m`.

| Character | Published value | Production resolution |
|---|---:|---:|
| nose to rump | 1.07–1.27 m | 18 px model / 20 px winter silhouette |
| withers | 0.65–0.84 m | 11 px |
| sacrum / withers | 71.62 / 66.55 cm in the regional sample | 12 / 11 px |
| chest depth | 22.32 cm before winter-coat allowance | 4 px model / 5 px pelt |
| skull length | 19.1–21.2 cm | 3 px |
| ear length | 12–14 cm | 2 px |
| antler beam | 18.4–25.8 cm, hard-antler range | 3 px model / 5 px readable velvet |

The chosen individual is a large northern buck at 0.72 m withers. Its sacrum
preserves the measured high-rump ratio. The requested stylization keeps those
landmarks but spends one extra row on the winter pelt, two on readable velvet,
and one pixel at each end of the silhouette. Alert crown-to-ground occupancy is
22 rows on a fixed 27×23 canvas. Those additions are medium concessions, not
larger life measurements.

The winter identity is a grey-brown `trunk`-ramp mass, a solid forehead-cheek-
muzzle cluster, almost absent tail, visible close-set three-point velvet antlers,
and a kidney-shaped white rump patch. The patch uses the light material only
where the coat is actually white; there are no decorative adult spots.

The published bone measurements are incomplete. Femur 20.5 cm, metacarpus
15.79 cm and metatarsus 19.42 cm support the visibly long distal limb. Exact
humerus, radius and tibia ratios in `body-deer.js` are therefore labelled a
raster prior. Tests assert that the chosen three-segment lengths remain fixed;
the code does not claim those missing lengths were measured.

### Locomotion

Both footfall patterns are points on Hildebrand's gait diagram, and
[src/gait.js](../src/gait.js) is the law. A pattern is declared as a duty factor
and one or three lags; the strike table and the per-sample contact schedule are
derived from it. Hildebrand owns which feet are down and nothing else: hoof
excursion, lift, spine flex and clip cadence stay in `body-deer.js`.

The eight-key walk is a conservative lateral-sequence single-foot gait:

`LH → LF → RH → RF`

Duty 0.75, forefoot a quarter cycle behind the ipsilateral hind. Each hoof
stands for six of eight samples. One limb swings at a time, every sample has
three supports, and there is no flight phase. The sequence name and the
single-foot spacing are consequences of the lag rather than a label beside it.

Roe deer are classified as rotary gallopers by filmed footfall sequences. The
right-lead escape cycle is:

`RH → LH → LF → RF`

Duty 0.25, couplet lags an eighth of a cycle, half a cycle between the girdles,
and the first forefoot contralateral to the first hind, which is what rotary
means. The eight-key raster spends one sample on gathered flight and one on
extended flight. Hind contacts precede fore contacts; same-girdle overlap is
retained. The two flight samples and their duty factor are pixel-medium choices,
not published roe-deer timings, and the deer's coordinates on the diagram were
measured off this rig rather than from field data.

Walk and gallop own separate body-travel distances and frame rates, but both
derive through one declared `DEER_SLIP`. World speed and clip cadence therefore
cannot drift independently. The slip itself is a playability concession.

### World behavior

`LIFE.roeDeer` is the boreal-only semantic authority; `ACTOR.roeDeer` contains
only raster expression and nearby locomotion compatibility. One stable buck
browses in committed legs, orients before a declared fear response, leaves
cloven-hoof marks, and changes to the rotary gallop when fleeing. Walk pixels
use straight load lines with only a one-pixel inward knee break. The current
cohort composition and action dwell are authored constraints, not population
or zoological estimates.

Winter roe deer may be solitary or join fluid small groups, and strongly local
snow and feeding conditions affect cover use. This narrow proof declares one
solitary buck and does not claim herd dynamics, population density, or
snow-depth energetics. See [the semantic authority](../LIFE.md) and
[boreal dossier](life/BOREAL.md).

### Generalization boundary

The reusable seam is:

`life dimensions → continuous landmarks and contacts → named clips → raster passes`

Two segments of it are now extracted, and both waited for a second species.
[src/gait.js](../src/gait.js) owns the contact schedule, which a published law
already decided. [src/quadruped.js](../src/quadruped.js) owns the two-bone
solver and the three-segment limb that stands on a declared foot. Everything
else in the chain is still species-local.

Boar, squirrel, alligator, heron and turtle remain explicit sprites.

## Rigged animals: Eurasian wolf

[src/body-wolf.js](../src/body-wolf.js) and
[src/figure-wolf.js](../src/figure-wolf.js) are the second rigged animal, and
they exist to answer the generalization question rather than to enlarge the
cast. Sources are Wilson & Mittermeier vol. 1 and Mech & Boitani (2003) for the
body, and Biancardi & Minetti for the gait class.

The subject is one large northern male in winter coat: 1.20 m nose to rump,
0.76 m withers, 0.42 m tail, crown of the ears at 1.05 m standing alert.

### What the second rig measured

| | roe deer | wolf |
|---|---:|---:|
| nose to rump | 18 px | 18 px |
| sacrum minus withers | +1 px | −1 px |
| distal share of the fore limb | 0.35 | 0.23 |
| metatarsus / femur | 0.95 | 0.79 |
| galloping clips | 1 | 2 |

**Size is not the difference.** The two animals are the same length in pixels,
which is why a shared body model would have looked plausible and why silhouette
and gait carry the whole read.

**The topline runs the other way.** A roe deer's sacrum stands above its
withers; a wolf's withers are the high point. One row, and it is most of what
separates the two silhouettes.

**Unguligrade against digitigrade** is a distal fraction of the limb, 0.35
against 0.23, and it agrees with the independently sourced metatarsus/femur
ratio. Biancardi & Minetti found that same ratio separates the gallop classes.

**The escape gait is a clip property, not a species property.** The roe deer is
a rotary galloper at every speed. Most Canidae, and wolf and coyote by name, are
**speed-dependent**: a transverse canter that becomes a rotary sprint. So
`couplets` sits on a gait row in `gait.js` and never on a species, and the wolf
carries two galloping clips where the deer carries one. Travel is a suspended
trot, which is what wild canids use over distance.

### Non-claims

Predation, pack structure, territory and prey response are **not** modelled.
`LIFE.roeDeer` is unchanged: nothing here makes a deer afraid of a wolf. That is
a semantic pass with its own evidence, not a side effect of drawing a second
quadruped.

### Acceptance

[test/wolf.test.mjs](../test/wolf.test.mjs) covers measurement, chain closure,
schedule agreement, the transverse/rotary split, lead mirroring, cadence, and
the usual raster gate. Its last test is the experiment: it measures the deer and
the wolf against each other and fails if the two stop disagreeing, because a
shared module that quietly merged their postures would pass everything above it.

### Sources

- Wilson & Mittermeier, *Handbook of the Mammals of the World*, vol. 2,
  “Western Roe Deer.”
- Sempéré, Sokolov & Danilkin, “Capreolus capreolus,” *Mammalian Species* 538
  ([doi](https://doi.org/10.2307/3504309)).
- Janiszewski, Gugołek & Hanzal, “Zoometric characteristics of the European roe
  deer hunter-harvested in north-eastern Poland”
  ([paper](https://czasopisma.up.lublin.pl/jasbb/article/download/3948/2655/11942)).
- Biancardi & Minetti, “Biomechanical determinants of transverse and rotary
  gallop in cursorial mammals,” *Journal of Experimental Biology*
  ([doi](https://doi.org/10.1242/jeb.073031)).
- Kierdorf et al., “Structure of pedicle and hard antler bone in the European
  roe deer” ([doi](https://doi.org/10.1111/joa.12091)).
- Short & Mann, “The sexual cycle of a seasonally breeding mammal, the
  roebuck” ([doi](https://doi.org/10.1530/jrf.0.0120337)).
- Helle, “Food composition and feeding habits of the roe deer in winter in
  central Finland” ([doi](https://doi.org/10.4098/at.arch.80-36)).

## Retired human specifications

`git show 89bb41e:docs/LIFE.md` holds the retro figure specification and
`89bb41e:docs/PEOPLE.md` the person model. Do not restore either for
comparison. Three rigs accumulated here because each was kept alive to compare
the next one against.
