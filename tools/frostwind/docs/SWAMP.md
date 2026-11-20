# Green Swamp

The third world is a **28° N warm freshwater cypress–tupelo forested swamp**.
It is not a marsh (herbaceous), bog (ombrotrophic peat), mangrove (saline
coast), jungle, sewer, or generic green water level.

## What makes it a swamp

EPA's operational distinction is woody wetland vegetation: trees and shrubs
rooted in soils saturated through the growing season, with standing water for
part of the year. Water is not decoration over ordinary ground. Its frequency,
duration, depth and flow create hydric soil and select the plant community.

The executable authority is `hydrologyAt(wx, wy)`:

- `depth` separates damp hummock, flooded floor, wadeable reach and basin;
- `hydroperiod` records how persistently a cell is inundated;
- `flow` gives the channel tendency;
- `hummock` and `hollow` expose small elevation differences.

This scene is a late wet-season land-water mosaic, not a continuous flood.
Stable hummocks occupy most of the traversable field; a chain of walled
solution backwaters, the short wadeable reaches that link them, the shallow
flooded forest between them and alligator refugia carry the visible water.
Hydroperiod remains in the model because saturated ground can shape the
community without every pixel becoming open water. Representative Big Cypress
cypress domes and strands are flooded about 250–300 days per year; their
deepest centres can remain wet all year. That range motivates the
persistent-water end of the field, not its areal coverage and not a claim that
this fictional site is Big Cypress.

Sources:

- [US EPA, Classification and Types of Wetlands](https://www.epa.gov/wetlands/classification-and-types-wetlands)
- [US EPA, What is a Wetland?](https://www.epa.gov/wetlands/what-wetland)
- [NPS, Big Cypress growth and hydroperiod](https://www.nps.gov/articles/000/bicy_nrca_2025.htm)
- [Flora of North America, *Ficus aurea*](http://efloras.org/florataxon.aspx?flora_id=1&taxon_id=233500647)
- [University of Florida IFAS, *Ficus aurea*](https://plant-directory.ifas.ufl.edu/plant-directory/ficus-aurea/)

## Habitat consequences

Centimetres of micro-elevation change months of inundation. The picture
therefore alternates dry hummocks, saturated peat, shallow flooded forest,
open reach and permanent refuge rather than one water mask.

| Band | Community and use |
|---|---|
| stable hummock | pile-house sites, repair work, buttonbush and strangler fig |
| seasonal flooded floor | bald cypress, sedge, full-speed shallow travel |
| shallow light | pickerelweed, heron foraging, turtle movement |
| persistent deeper water | water tupelo, alligator travel, open reflection |
| planted waterline | swamp rose on the margin — a plant with a silhouette, not a painted band |

### Three water bodies, three cross-sections

Water takes three separate statements, in `src/basin.js` and `swampSections`.
`docs/CANON.md` holds the cone failure that produced them.

| Body | Cross-section | Why |
|---|---|---|
| backwater | `karstProfile` — flat floor at 1.80 m, wall across 0.23 of the radius | limestone dissolves along joints; a solution basin has walls, not banks. This is the lakehouse's own profile, called by both |
| reach | `reposeDepth` at 36° peat repose over a **graded bed** — pool floor at each mouth, 0.30 m at the sill | a channel between two pools is a long profile, not a trench of constant depth |
| alligator hole | `reposeDepth` at 1.60 m, plus its trail to the nearest water | a hole wallowed in peat is not dissolved rock, and it has never been the deep body — the flooded forest around it is what makes it refuge |

Backwaters measure `D_V` 2.10-2.36 with a 6-8 px shore-to-deep margin
(**Hutchinson 1957**, **Neumann 1959**, see `docs/CANON.md`). The swamp's
shallow water is the **flooded forest**, which is where a strand swamp holds it.

The walls cross the whole depth range inside a quarter of a radius, and the
hydrology field samples on an 8 px lattice. So the analytic basins and the
channel evaluate at **full resolution** in both the water mask and the depth
read, while the fbm terms stay on the lattice. Otherwise every pond outline
facets into 8 px steps.

Basin outlines wander in **radius units**, like the lakehouse's 7%. A field-unit
wobble cannot move a shore that steep, so the ponds would stamp as identical
ellipses. A reach's bank takes the same term at four times the amplitude: 7% of
a 26 px half-width is two pixels, and two pixels do not break a 400 px edge.

### What shape a body of water is

Every body of standing water in the world, backwater, wallow, mooring pool and
the compiled sinkhole, is one outline, `lobe` in `src/basin.js`. Three things
make it, and the reasons are about landform and projection, not about drawing:

- **Two ground semi-axes and an orientation.** *Ground*, not screen. Under the
  cabinet projection one screen row is two ground pixels, so a hollow that is
  round on the ground is a 2:1 ellipse on the screen — and anything authored
  round on the screen is a 1:2 slot on the ground. Authored as two screen radii,
  every backwater in the world was wider than it was tall by the same 1.55,
  because that is what a halved depth axis does to a round hole and no lattice
  term can undo it. The alligator wallows were authored `r, r` and were the
  world's only perfect circles: the one plan-form this projection cannot draw.
- **Low-order radial harmonics**, `1 + Σ aₙ·cos(nθ + φₙ)` for n = 1..3. The
  first makes one end broader than the other, the second breaks the two-fold
  symmetry an ellipse cannot lose, the third gives the rounded three-lobed plan
  a hollow eroded along three joints takes. With `Σ|aₙ| < 1` the radius stays
  positive, so the curve is always simple and star-shaped.
- **No trigonometry at sample time.** Phase is folded into a rectangular pair
  and the harmonics come off the unit direction by Chebyshev recurrence. This
  runs for every pixel of every chunk; three `atan2`s per body per pixel is not
  a shape, it is a budget.

`test/swamp.test.mjs` reads three numbers back off the compiled world. Every
body must contain **its own area centroid**, a crescent is exactly the shape
that does not, which is what the old sinkhole rim drain left behind. Every
body must depart from **its own best-fit ellipse** by at least 6%; measured,
they run 6–16%, and a stamp scores zero by construction. And shoreline
development `D_L = P/2√(πA)` must stay under 1.45, past which an outline is no
longer one pond; measured, 1.05–1.30, against 1.00 for a circle and
Hutchinson's 1.1–1.5 for small natural lakes. `D_L` is *reported* rather than
floored, because it barely moves for an ellipse, stretching a shape hardly
lengthens its shore, which is why the ellipse residual and not `D_L` is what
catches a stamp.

Proportion is measured separately, because eleven ponds all at `D_L` 1.2 can
still be eleven copies: each body's second moments give it an aspect and a
bearing, and the test requires the widest body to be at least 1.35× the
proportion of the narrowest and the bearings to span 60°.

### How a channel meets a pond

A reach that arrives at a basin wall at constant depth steps from a 0.30 m bed
to a 1.80 m floor in about twenty pixels. The water ramp quantises depth into
rungs, so that draws a **hard line of colour across the channel mouth**. Water
makes no such shape. Two changes remove it at the cause, and both are the
ordinary geometry of a pool-riffle sequence:

- **The mouth flares.** From each shoreline inward the half-width grows by
  `flare`, so the channel opens into an embayment instead of arriving at bank
  width. This is also what stops a pond reading as a circle with a stick
  attached to it.
- **The bed is a thalweg.** It stands at the basin's own floor where it leaves
  the basin and climbs to a **sill** between — the riffle between two pools, and
  the place you can walk across. Depth therefore grades from pool floor to
  shin-deep over the length of the grade instead of stepping over a wall.

The grade is a **fraction of the gap** between the two shorelines, capped.
Given a fixed length it ran out of channel whenever two bodies sat close
together: measured, a 1.01 m "reach" with no riffle anywhere along it between
two basins 200 px apart. A pool-riffle profile scales with pool spacing, so
with the grade stated as a fraction the sill exists on every channel by
construction, however short, and the crossing can never be lost. The test
looks for the **ford**, the station along the run whose deepest water is
shallowest, and not the halfway mark, because with mouths of different sizes
the sill is not at the middle, and one reach in the compiled world runs
straight past the mooring pool.

Everything about a channel is measured in **ground pixels**. Laid out on the
screen grid a channel is twice as wide running across the depth axis as along
it, and its banks stand at half their angle on one axis, the same projection
error `docs/CANON.md` records against the meadow's shore distance.

### What tone a depth is, and why a pond had a line drawn on it

A bright line lay against a dark one across the open water of the lakehouse
basin, following the shore for **971 px** with nothing either side of it but
flat teal. Open water has no edge in it, so the picture had drawn one that the
world does not have.

The **ramp** was never the problem: `swampRamps` derives one five-rung optical
ladder from `swampRadiance` — Pope & Fry absorption plus a CDOM term, through
the scene's own Naka-Rushton response — and slices it into the two material
windows. What indexed that ladder was two straight-line fits, `0.84 − depth·1.1`
in the shallows and `0.62 − depth·0.24` below them. Measured, they put one rung
boundary at **0.006 m** — a one-pixel bright rim at the waterline — the next at
**0.500 m**, and then clamped, so every depth past half a metre landed on one
rung and **two of the five tones were never drawn at all**. Both boundaries a
pond had were stacked inside the 3 px the solution wall spends crossing them.
A table the drawing code does not read is a comment with punctuation; here it
was worse, because a fit standing in front of the physics also *hid* it.

`swampT` in `src/sunlight.js` states the same invariant `pondT` does, one
response, one exposure, the ladder's dark end at `SWAMP_MAX_M` and its bright
end at the shoal, and the bake indexes the ladder with it. The boundaries fall
where the water actually changes:

| | boundary depths (m) | tones drawn |
|---|---|---|
| the two fits | 0.006, 0.500 | 3 of 5 |
| `swampT` | 0.23, 0.64, 1.09, 1.56 | 5 of 5 |

One boundary lands on the shallow shelf and three down the wall and out across
the floor. The slice offsets live in `sunlight.js` beside the ramps, because
the bake has to convert a depth into a rung of the same ladder and two copies
of that offset are two ways for the wade line to grow a seam.

The two water rows also **dither** now. Their field is analytic distance from
a shore through a saturating curve, so an isodepth line is a smooth offset of
the shoreline: exactly the smooth field `rampStep` turns into contour lines.
Turning the column on was not enough on its own, the seam's width was authored
in *rung* units, and what 0.12 rungs buys in *pixels* depends on how fast the
field crosses a rung. On swamp water it bought **0.38 px** at the median
boundary pixel, a rung boundary with no pixel inside its own seam. `SEAM_PX`
in `src/shaders/world.js` makes the seam a **pixel budget**: three pixels of
checker, and the width in rung units is whatever that costs at the local
slope, read from the geom texture's own neighbours. The authored 0.12 survives
as the floor, so the snowfield does not move, and a ceiling keeps a field that
steps in one pixel, a trail's border, a shadow's rim, a real edge rather than
three pixels of stipple.

`test/swamp.test.mjs` states the rule as **flat, seam, flat**: it runs the
ground pass's own quantiser over the bake, keys a rung by its colour rather
than by `(surface, rung)` because the two windows share three of them on
purpose, and fails on a **bare cut**, two plateaus meeting with no dithered
pixel between them, on a field gentle enough to have afforded the seam. On a
wall crossing a rung inside a pixel a clean step between adjacent rungs is the
only thing that can be drawn, and two pixels of it is a graded edge, not a
plateau. The bound is on the longest connected run, because what the eye
objects to is a **line**: 109 px without the dither, 12–22 px with it.

### Karst drainage is discontinuous, so there is no river

A single slough running the world's length beside the trail is 0.86 m deep, past
the wade line, so it becomes a **wall down the middle of the map**. The
traveller walks beside it for a whole scene and never crosses. It is also the
wrong landform. Surface water on dissolving limestone sinks at swallets and
resurges at springs, so a continuous surface river is the one drainage pattern
karst would not have. The geology that gives the basins their walls takes the
river away.

What replaces it is a **chain**: one solution basin per lattice band, and a short
**reach** from each basin to the next. A reach is wadeable by construction — a
0.30 m bed, under the 0.38 m wade line — so the crossing is the point of the
feature rather than a concession to it. Its centreline is displaced sideways as a
function of distance *along* the run, which is the only parameterisation under
which the bend belongs to the channel and not to the ground it happens to cross.
`swampChain(y0, y1)` enumerates the whole set — basins, reaches, the mooring pool
and the wallows — so a reader asking *where is the water that is not the flooded
forest* gets the generator's own answer instead of a second copy of the lattice.

`test/swamp.test.mjs` holds two claims about this: every reach is wadeable
across its section, and walkable ground flooded from the west edge reaches the
east edge as one component of ≥97%. Deep water is allowed to be an obstacle to
walk around. It is not allowed to be a wall.

### A section states its bed; two that touch are one basin

Two rules govern how water bodies combine, and neither is a drawing decision.

**Sum was the wrong composition.** Adding the fine relief to the cross-sections
makes every floor *relative*. A reach with a 0.30 m bed measures 0.41 m across a
wet hollow, so the one feature built to be walked through stops being wadeable
depending on what it crosses. A bed is an elevation. `swampCompose` takes the
lower of the two, so where the flooded floor sits below the bed, the floor wins
and the channel is not there to be seen.

**Overlapping bodies merge.** Two basins whose outlines clip draw as two
ellipses with a crease at the crossing, which is what a stamp does. `basinUnion`
in `src/basin.js` is a smooth minimum over the basin *metric*, blending across
`MERGE_Q = 0.35`. Bodies further apart stay untouched to within floating point,
and bodies that touch resolve into one larger basin with a waist.

**The sinkhole is not an exception to it.** The lakehouse scores its site on
wetness, so it lands on one of the biome's own backwaters nearly every time:
measured at seed 20260727, two outlines of almost the same size with their
centres a third of a radius apart. Taking the deeper of the two signals drew a
figure of eight. Draining the neighbour instead — attenuating the natural signal
to nothing across two and a half radii — removed the notch by removing most of a
pond, and left the rest standing as a **crescent**, a half-moon with a bite out
of the side facing the hole. Ground does not do either.

They are not two ponds and they are not one pond minus the other. A sinkhole
is where the rock dissolved *through*; the shallow basin around it is the same
joint working nearer the surface. Two dissolution centres that have grown
together are a **compound basin**, an *uvala*, with one shoreline and a deeper
hole inside it. `src/world/swamp-water.js` exposes `basinMetric` to the place, the
place soft-unions the two metrics exactly as two natural basins are unioned,
and the floor between them is blended rather than switched: one outline, no
seam, and the ladder still climbs into 4.20 m because the deepest part of a
compound basin is its active swallet.

That has a consequence for the house. The pad is scored against the field the
place *will leave behind* rather than the untouched one, "did the ground want
water here" and "can a house stand here" are different questions, and the
second one has to be asked about the finished world. It is also stood back
from the **compound** shoreline, found by marching out along the bearing,
rather than from the sinkhole's own radius: standing back from the radius put
the house in the saddle, and because standing water under a building is now a
hard rejection rather than a low score, every site with water worth looking at
was being thrown away for it. With the shore found instead of assumed,
`score.wet` is 1.00 at every seed measured and `score.site` runs 0.78–0.97,
against 0.31–0.65 before.

### The waterline is planted, not painted

A duckweed mat was drawn on the margin as a flat surface, and a flat surface
has no silhouette: keyed to shelter it became an unbroken green band 10–20 px
wide around every pond, which reads as an error rather than as a plant. It has
been retired. **Swamp rose** (*Rosa palustris*) is planted there instead, a
real species in `src/species.js` with a habitat rule on shore distance, an
arching 1.2 m shrub that breaks the shoreline with stems and leaves the
water's edge visible between them.

Bald cypress supplies the dominant vertical/excurrent form, buttress and knee
clusters. Water tupelo occupies deeper persistent water with a flared base.
Buttonbush marks edges; pickerelweed and sedge make connected emergent
clusters. Placement reads the hydrology field, canopy transmission and
disturbance. It does not scatter a list of “swamp plants” uniformly.

The cypress sprite has its own bounded excurrent grammar: one tapered leader,
crown-length-derived lateral levels, a sinusoidal branch envelope, fine
foliage sprays, buttress and knees. The shared spruce cone and broadleaf lobe
solver are both rejected here; the former reads as an inherited conifer and
the latter can expand foliage against a sprite edge instead of ending the
crown.

The attached banyan form is represented by the native Florida strangler fig,
*Ficus aurea*, not by importing an Asian banyan into this food web. It is a rare
tree of stable wet-hammock and strand-swamp margins, including sites where it
girdles bald cypress. Its mature grammar derives a broad crown, fused host bole,
buttress and nine candidate aerial roots. The crown no longer uses the generic
rounded broadleaf lobe solver: pipe-owned terminal area is divided into shallow
three-blade sprays, bounded to 0.050–0.078 of tree height, so branches—not
spherical foliage puffs—own the silhouette. Roots launch only from branch
undersides with a clear initial descent, may merge into the fused bole, and
thicken into grounded pillars. Thin suspended root lengths carry a one-pixel
settled-gust deformation; grounded lower pillars remain fixed. The shadow pass
uses the same deformation and widens only root coverage by one atlas texel on
each side before the scene penumbra filter, the medium floor needed to keep a
one-pixel caster visible.

## Food web and the alligator

The readable cast is intentionally small: American alligator, wading heron or
egret, and basking turtle. Fish, frogs, crayfish, insects and nesting activity
are habitat evidence below their useful sprite budget.

The alligator is an ecosystem engineer, not a monster prop. Deterministic
alligator holes persist in the peat. Those holes retain dry-season water,
concentrate aquatic prey and create foraging sites for turtles and wading
birds. The alligator has medium-dependent float, swim, submerge, crawl and
bask states; a 46-pixel adult represents about 3.0 m at project scale.

[USGS's Everglades alligator ecology](https://pubs.usgs.gov/fs/2004/3105/)
supports the engineer relationship: holes and trails provide dry-season refuge
and foraging sites, while nests make elevated colonisation sites. Frostwind
encodes each hole and its local refuge influence, not a defended territory or
biological home range; it does not claim to simulate population dynamics.

## Settlement and architecture

Nature constrains sites; it does not dictate a culture. This world authors one
community that chooses to treat water as road, flood change as cyclical time,
and repair as shared work. These are fictional choices among many valid human
answers, not claims about a real wetland people or ethnicity.

`swamp-settlement.js` follows:

```
hydrology → site affordance → cultural plan → candidates → selected composition → pixels
```

Four pile houses occupy stable hummocks or bounded shallow sites beside
navigable water and outside alligator core refugia. They are far enough apart
that a single frame does not collapse the settlement into a wall of facades.
The common is a shared landing and repair deck. Circulation is dry peat and
wadeable floor; the settlement does not paint timber corridors between houses,
and the swamp does not inherit a worn world-trail spine from other biomes.

House floors derive from a 1.80 m local design flood plus 0.55 m freeboard.
The undercroft remains open and sacrificial; living, storage and utilities
stay above. Deep eaves, screened openings, cross-ventilation, rain catchment
and raised storage answer heat, humidity, insects, rain and flood together.
FEMA's modern open-foundation guidance is used only for the physical
principle: freeboard is extra height above design flood, and open piles let
floodwater pass. It is not provenance for the fictional vernacular.

- [FEMA, Building the Case for Open-Space Foundations](https://www.fema.gov/sites/default/files/documents/fema_building-case-open-space-foundations-technical-advisory_052023.pdf)

The invention set follows work:

- a shallow-draft punt reaches water too thin for a keeled boat;
- mooring poles and docks keep water-side work readable;
- high-water marks make flood memory visible;
- a raised cistern and rain catchment secure freshwater;
- fish traps and elevated drying racks preserve food;
- a repair winch serves boats, piles and walkway sections;
- buoyant storage reduces loss without pretending floodwater can be excluded.

There is deliberately no drainage machine whose success would erase the
habitat.

## The sinkhole and the lakehouse

The mosaic above runs 0.04–1.80 m. Nothing in that range is deep enough to
need a ladder or high enough to stand a log wall on, so one place is compiled
where both are true, and it is one piece of geology that makes them true
together.

The Green Swamp sits on Floridan limestone, and limestone dissolves. A karst
solution basin is not a cosine bowl with a graded bank, it is a hole with
walls, and every other fact about the place follows from that single
difference:

- the water is deep because the walls are steep, not because the basin is wide;
- steep rock cannot be waded into or scrambled out of, so access is a **made
  object**: the ladder is a necessity rather than a decoration;
- a rock basin holds its level while the peat mosaic around it rises and falls,
  which makes it the settlement's **datum** — a fixed thing to measure a moving
  thing against;
- and the rim stands clear of the design flood, which is where the building
  comes from.

`src/swamp-lakehouse.js` compiles it, and `test/swamp-lakehouse.test.mjs`
checks every claim below.

**Freeboard from the rim, and trunks anyway.** The pile houses buy 2.35 m of
clearance with 2.35 m of pile. The lakehouse rim buys the *same* 2.35 m, read
from `SWAMP_HOUSE` rather than restated — and the keeper stands his house on log
trunks regardless, at the settlement's own pile height. That is not structural
need, because the rim already cleared the flood. It is the form a house takes
for these people, which is the canon principle that environment constrains
culture without selecting meaning: a man who moves onto a rock rim does not stop
building the way his people build.

**And it is the only way the height can be seen.** This was got wrong first. The
swamp has no terrain elevation field — it is a hydrology field on a flat plane —
so a rim is declared at the place, exactly as the pile height is declared at the
settlement, and *nothing draws it*. Built ground-sitting on a 0.40 m sleeper
course beside water painted flush with the field, the place had no visible height
at all: the argument was sound and the picture was a shed in a meadow. Height in
this medium exists inside a sprite. The pile houses have always known that — they
draw their own stilts — and this one had to be told.

**The wall is the assertion.** Peat banks stand at their angle of repose,
30–42°. The basin override drops the full depth across about 8 px of shore,
which is a gradient past 70°, and the test measures that gradient around the
whole rim. If the basin ever softens into a bank it stops being a sinkhole and
the test says so. Because the wall is narrower than the swamp's 8-pixel
hydrology lattice, the override is applied at full resolution twice — once
where the water mask is thresholded and once where the depth ramp reads its
value — or the drawn shore and the shore you walk into would describe different
holes.

The wall is no longer only this address's. `karstProfile` in `src/basin.js`
cuts every backwater in the swamp, and `hydrologyAt` calls the same function,
so the profile exists once rather than twice. The lakehouse stays distinct by
what it does with it: 4.20 m past the optical ceiling, a rim that clears the
design flood, and a hole you need a made object to get into.

Depth and optics are deliberately separate. `swampRadiance` saturates at
`SWAMP_MAX_M = 1.80` and the hydrology clamps to the same value; neither is
raised. The basin carries its true 4.2 m as a model fact and the water ramp
simply reaches its deepest rung.

The sinkhole grows nothing on its margin and stays reflective: a wall gives a
plant rooted at the waterline nowhere to stand, which is a consequence of the
profile rather than a rule written about this address.

**The ladder is how you get in.** OSHA 1910.23 supplies the fixed-ladder
geometry: 75.5° pitch, 0.30 m rungs, and side rails carried 1.07 m above the
landing for a handhold. The standard is written about precisely this object — a
fixed ladder reaching a raised floor — so for a 2.35 m floor that is a 2.43 m
ladder of 8 rungs, standing against the balcony at the end away from the chair.
The run recedes along the depth axis and is foreshortened by half while the rise
is drawn row for row, so a 75.5° ladder is drawn very nearly upright: the
projection being honest, not the ladder being wrong. The rail extension is the
one length that does *not* use that projected rate, because 1.07 m above a
landing is a height and not a distance along the stile.

**It was a bank ladder first, and that failed twice.** The original rule sent it
to the basin's widest point on the side the house was not on, which guarantees
the silhouettes can never merge. Measured on the compiled world that put it
209 px from its own house — the farthest point of the rim from the building it
serves — and the two read as unrelated objects in a field. It was also standing
in 0.33 m of water five pixels from dry ground, because the ellipse's tips are
the shallowest part of the shore: a ladder at the one place on a rim whose whole
justification is that you cannot climb it.

Brought back onto the house's own shoulder it still read as standing in the
middle of nowhere, and the measurement said why: **58 of its 69 rows rose over
open ground.** The 2.35 m of rock it descended has no pixels, and the water is
painted flush with the field, so it spanned nothing a viewer could see. Every
assertion passed, the foot was wet, deep water lay within a metre, the pitch
and rung spacing were right, because they all tested the model and none asked
whether the object's purpose was legible. Turned around to climb a floor
standing on drawn trunks, it needs no siting rule at all: a ladder to a front
door goes where the front door is.

**The gauge moved to the trunk.** *Which rung is wet* stopped being a reading the
moment the ladder became a stair, so the high-water mark is now cut into the leg
nearest the basin. The settlement already cuts its memory into the left pile of
every house; this is that practice in the one place where a basin that holds its
level makes it yield a number.

- [OSHA 1910.23, Ladders](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.23)

**The balcony and the crest.** The deck is `CORRIDOR_M` deep — one person
seated and one passing behind them. At 0.40 m it is below every guard-height
threshold there is, so the rail is a balustrade rather than a fall guard and its
height is free; the *chair* sets it instead. A seated eye is about 1.20 m above
the floor, so a 0.90 m balustrade is still comfortably seen over from the porch.
Derived the other way — as low as the guard rules permit, 0.55 m — it came out
eight rows, exactly the depth of the deck's own top face, so posts and planks
occupied identical rows at identical values and the balcony read as a painted
apron. Worse, the balustrade was composited *before* the log wall, so the wall
overwrote every column of it between the corners and left two stubs past the
eaves: a rail that existed in the source and not in the picture. It is drawn
after the wall now, because it stands in front of it.

The crest the house stands on is sized to carry the balcony, a circulation
width in front of it, the basin outline's wander, and the building's own
footprint. Sized without those last two terms the porch overhung the drop: the
projection halves a ground metre on the depth axis, so six rows of apparent
margin was three after the shore moved.

**The undercroft is open, on three whole logs.** Round timber rather than sawn
pile: the same structure the settlement uses, in the material the rim actually
grows, with sway bracing between the legs and the floor plate they carry drawn
as the one opaque band down there. A cylinder four pixels across gets exactly one
lit column and one dark one, and the terminator between them is the entire
available statement about roundness. The test counts three legs at the ground
course, checks each is about 0.45 m across, and measures the drawn rise against
the declared floor height.

**A leg that stands on the ground casts.** Material 12 paints exactly like wood
and is discarded by the projected-shadow pass, so that thin open members cannot
throw a picket fence of bars against the elevated body's cast. Applied to the
*stilts* as well — which is how the settlement had it, and what the lakehouse
inherited — the lowest thing either house cast with was its floor plate a storey
up, and the projection put that plate's shadow down-screen and to the side of
the building. Measured on the compiled frame: **the shadow began fourteen rows
below the trunk feet, with lit grass in between**, and the house read as
hovering. The legs are drawn as solid timber now and the braces stay open. The
braces also go down *first*, because a thickness-3 stroke springing from the
ground row repainted the bottom four rows of every leg as no-cast timber —
exactly the rows that touch the ground.

**A body can stand on a raised surface, and the world says how high.** There is
no elevation field, so `standLift` is the whole of it: a compiled place declares
the one surface it lifts people onto, the generator answers for the world, and
the draw list subtracts it from the row it paints while sorting on the row the
body actually stands on. That split is forced by the projection — the house is a
single billboard whose far wall and near deck share one anchor, so anything
given a row up-screen of it draws *before* the house and is covered by its own
building. The keeper therefore patrols in x along one world row, which is what a
balcony one circulation width deep is anyway.

**A balcony is a floor, and it has to be lit as one.** Raising the deck's albedo
changed nothing, because every pixel this file drew was getting the elevation
normal — the deck was shaded exactly like the wall behind it and the two
collapsed to one dark mass under the palette snap, taking the posts, the chair
and anybody standing there with them. The up-facing normal is `N_TOP`, owned by
`ruins.js` and imported rather than restated. The 2.35 m drop also turns the
balustrade from furniture into a fall guard, so its height stops being free and
becomes the standard 1.00 m — still under the 1.20 m seated eye that has to see
the water over it.

**A lakehouse has to be in its own lake.** The reflection pass mirrors a caster
straight downward, so a house on a side shoulder is only mirrored across the
columns it shares with the pond. Measured on the first compiled world that was
five columns of a ninety-nine column sprite, and the water reflected nothing.
Site scoring now prices the shoulders against each other by how much of the
building has water beneath it. It is a preference and not a condition: it does
not force the pad due north, which was tried and put it inside the backwater the
basin was chosen for. What it must never do is buy a wetter pad with a better
view — priced as a free additive term it promptly did, dropping one world's pad
dryness to 0.55 — so **dryness gates rather than ranks**. A pad below the
measured floor is not scored at all, and the preferences only choose among
shoulders a building could actually stand on. One world in ten still gets no
reflection, and that is the gate working.

**The rocking chair is a pendulum, and its motion is a measurement.** A chair
rolling without slipping on circular rockers of radius `R`, with the combined
chair-and-occupant centre of mass at height `c` and radius of gyration `k`,
swings about the rockers' centre of curvature with

```
d = R − c        T = 2π √((k² + d²) / (g·d))
```

At `R = 1.00`, `c = 0.62`, `k = 0.35` that is `d = 0.38 m` and `T = 1.68 s`,
about 0.60 Hz. The centre of mass has to hang *below* the centre of curvature
or the chair does not rock at all. A point at height `y` then moves
horizontally by `(R − y)·θ`, so at an 8° sweep and 15.29 px/m:

| point | height | excursion |
|---|---|---|
| rocker toe | 0.00 m | 2.1 px |
| seat | 0.45 m | 1.2 px |
| shoulder | 1.10 m | 0.2 px, **and in the opposite direction** |

The whole animation is therefore a ±1 px shear about a node near shoulder
height at 0.6 Hz: the rockers sweep about two pixels, the seat one, the head
effectively nothing, and the shoulders counter-swing because they sit above
the centre of curvature. Anything larger would be invented. The chair is
driven by the clock and its own period rather than by the wind that turns the
meadow's rotors, it keeps rocking in still air, because a pendulum does.

Seen along its rockers the outdoor chair is thirteen columns wide, so a
readable back is affordable here; a seven-column stool could not carry one.

**The resident.** The lakekeeper practises `flood-memory`, like the boatwright,
but applied to the one place in the swamp where it yields a number: the
boatwright records marks across a mosaic that moves, the lakekeeper keeps the
datum that mosaic is read against. He lives alone — living in the same swamp is
not membership in the settlement's repair group — and his day is the gauge at
first light, the porch, and the gauge again at dusk.

**What is not built yet.** There is no seated pose: the folk figure
(`src/body-folk.js`/`src/figure-folk.js`) draws idle, walk and run and nothing
else. `sit` is bound to the chair today and resolves through the clip fallback,
so the keeper stands at his rail and the chair rocks empty. The node, the
anchor and the hours are already the ones a seated figure needs; when the pose
lands, only the pose changes. A use-node is a place a body *goes*, which is beside the chair
and not inside it — bound to the chair's own coordinate, the standing keeper
covered the sprite exactly, and the one object this place was built around was
in frame and invisible. He borrows the fisher's sprite key, which now costs
nothing and used to keep him out of a rig baseline.

## People and clothing

**Built, and the weather is what selects it.** `FASHION_VOCAB.swamp` in
`src/culture.js` is the executable form of the paragraph this section used to
be: a short cut so the hem clears wet ground and dries, `thin` bulk because a
quilted coat in a warm swamp is a sponge, a brim or a hood over every face, a
shoulder cape from the wet-work practices, and one ochre band. The residents
wear `folkUmber` or `folkWool`, undyed fleeces, and `test/swamp.test.mjs`
asserts the bulk and the head cover directly.

**What moved, and why.** The residents used to ride `swampWood`, which is the
darkest ramp in the palette and also what the houses, the boardwalks and the
piles are made of, so a fisher standing on a landing was drawn in the landing's
colour. That was a palette-budget saving wearing a costume. It cost two ramps to
undo and the swamp snap list is 63 of 64.

**Waders are still not built, and this is the reason.** A leg here is one pixel
wide and two to four rows long (docs/LIFE.md medium law 3, the declared stem
width and its negative space). A tall wader differs from a boot by its HEIGHT up
the shin, and there is no shin to put it on: the whole leg is already shorter
than the wader would be. It would have to be drawn as a colour change on a
one-pixel column that is required to be near-black. Recorded as refused rather
than pending.

The residents are a channel fisher/trap tender and a boat/infrastructure
repairer. Their ownership is executable: schedules bind to shared wet
infrastructure (winch, mooring, traps, water ledger), and their rows name the
traps, rack, mooring, winch and water ledger they use. Wet-gear threshold and
high-storage remain outdoor culture anchors at the house façade and yard, not
a walk-in room.

## Rain

Green Swamp carries an authored 12 mm h^-1 warm shower. Weather belongs to the
scene: Frostwood retains snowfall, Sun Meadow is clear, and Green Swamp rains.
The one precipitation control enables the current scene's declared effect; it
does not convert one climate into another.

`src/weather.js` owns one stateless world-space event lattice. A bounded
Marshall–Palmer prior chooses 0.55–3.50 mm drops, the Atlas–Srivastava–Sekhon
relation turns diameter into terminal velocity, and the existing prevailing
wind axis supplies slant. Every cycle re-hashes its impact point. Camera
motion therefore reveals the same rain field from a new position instead of
sliding a screen overlay across the world.

The same event has four discrete responses:

- its final 1/24-second exposure is a falling streak;
- energetic hits spend a short one-pixel tick on peat, timber, and exposed
  `swampCanopy` pixels;
- open `wet` flags displace nearby reflected pixels and receive one to three
  event-hashed concentric rings at the gravity-capillary minimum wave speed;
- duckweed receives neither reflective rings nor a dry-ground splash, because
  it is hydrologically water but optically a surface mat. `SURFACE.duckweed`
  keeps this behaviour, but nothing in the swamp bakes the flag any more: the
  margin is planted with swamp rose rather than painted with a mat.

Circles on the horizontal world plane are measured as 2:1 screen ellipses
under the cabinet projection. There is no continuous ripple hatch or crest
noise: calm pixels stay still between impacts. Real drops are subpixel at
Frostwind's scale, so the visible streak exposure, one-pixel crest, lattice
density, and brief merged rebound are medium choices, not claims about literal
drop width. Impacts use their receiving surface ramp; airborne streaks use the
two palest `birch` rungs for neutral visibility against olive ground.

Airborne events also hash a depth layer. Most are clipped by the exact
animated coverage of houses, trees, people, and props; a sparse near layer
remains in front. This is visual occlusion, not roof collision, the current
world model has no roof-surface field from which to derive roof impacts or
runoff.

## Light, colour and reflection

Broken canopy reduces and greens transmitted light without closing the whole
frame. Dark blue-green crowns and wet timber sit against a broad yellow-olive
walkable field. Low-CDOM water and its pale mineral-organic bed form a
separate teal/sage family; the `duckweed` ramp is a brighter yellow-green, now
carried by the margin's sedge and swamp rose rather than by a painted mat, and
ochre remains a sparse human accent. The value and hue separation are the
executable answer to the reference images' breathing room. Haze is a declared
contrast treatment at this short scale, not a claim of physical airlight.

Open wet surfaces replace part of reflected sky with a dedicated caster pass.
The hero, fauna, trunks, poles and houses are mirrored from their contact
anchors before the water pass. World-anchored wind displaces that image; zero
wind is stable. Before filling the reflection batch, each mirrored sprite
rectangle is tested against resident open-water geometry; dry-land casters
never enter the pass, and an empty pass does not draw. Duckweed interrupts it.
Projected shadows remain a separate sun-occlusion target and never become
reflections.

The measured movement hitch was streamed terrain synthesis, not reflection.
Swamp pixels no longer compile and discard winter shelf, crack, drift and
trail shading; they compile directly from an eight-pixel analytic hydrology
lattice. More importantly, runtime chunk misses in every biome now compile in
an inline worker. The main thread only admits transferred typed arrays,
creates the GPU texture and resolves atlas references. Initial builds and
deterministic tools retain the synchronous path. A structural scene test fails
if runtime `ensure(false)` calls the main-thread generator.

## Authored medium choices

- Quiet water and negative space are reference-led composition, not ecology.
- The visible water budget is deliberately sparse enough to preserve exploration.
- Tree heights are compressed to the frame's legibility budget.
- Tiny prey becomes evidence rather than illegible sprites.
- The settlement meanings and roles are original Frostwind authorship.
- Reflections are stronger than a literal Fresnel-only return because a
  three-rung figure must remain recognisable.
