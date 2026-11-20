# The Sun-Meadow, Measured

Derivations for the second world: authority, arithmetic, pixel consequence,
and test. **Informal** marks a published range or secondary source rather than
one primary measurement; **taste** marks an art-direction choice.

`test/biome.test.mjs` and `test/steading.test.mjs` are the numeric
authorities. `test/pond-court.test.mjs` covers the compiled place. When prose
and measurement disagree, measurement wins.

## 1. Light

### Beam and sky are two illuminants

Rayleigh scattering varies as `λ⁻⁴` (**Lord Rayleigh, 1871**).
Standard-atmosphere optical depths:

| | 600 nm | 550 nm | 450 nm |
|---|---:|---:|---:|
| `τ` | 0.060 | 0.098 | 0.220 |

With plane-parallel air mass `m = 1/sin(altitude)`:

```
beam = exp(-τ·m)        normalised at 62° N: [1.084, 1.033, 0.883]
sky  = 1 - exp(-τ·m)    normalised at 62° N: [0.507, 0.809, 1.684]
```

The direct beam is warm because blue was scattered out; the sky is blue
because it contains that loss. Sunlit surfaces receive mostly beam, shadows
only sky.

The clear-sky diffuse fraction is derived from the same loss:

```
diffuse = mean(1 - exp(-τ·m))
```

| Latitude | Air mass | Derived | Engineering table |
|---|---:|---:|---:|
| 62° N | 1.279 | **0.146** | 0.15 |
| 38° N | 1.033 | **0.120** | ~0.12 |

The agreement is validation, not source. The bookkeeping omits aerosols and
approximates multiple scattering, so the fraction remains **informal**.

### Per-world solar position

Declination follows **P. I. Cooper, *Solar Energy* 12(3):333–346, 1969**;
altitude/azimuth follow **Duffie & Beckman**, ch. 1. **Reda & Andreas, NREL
SPA, 2003** is the high-precision reference.

At midsummer noon (`δ = 23.45°`):

```
altitude = 90° - |latitude - δ|

62° N: 51.45°       38° N: 75.45°
```

For the day cycle:

```
sin(alt) = sin(lat)·sin(δ) + cos(lat)·cos(δ)·cos(h)
cos(A)   = (sin(δ) − sin(alt)·sin(lat)) / (cos(alt)·cos(lat))
```

| | Noon | Midnight | Daylight azimuth |
|---|---:|---:|---|
| 62° N boreal | 51.4° | −4.6° | full compass |
| 38° N meadow | 75.4° | −28.5° | 341° → 199° |

The worlds are separate scenes connected by a portal, so per-world latitude is
not a discontinuity across physical ground. `BIOMES` owns latitude;
`sunAt(lat)` returns the illuminants.

**Deliberate limits:** the renderer cannot depict night, so altitude floors at
the light-control minimum. Low-sun warmth is derived in spectral shape but
scaled by **taste** because no measurement maps it to the split-tone control.

### Canopy attenuation

Bouguer (1729), Lambert (1760), and Beer (1852), extended to canopies by
**Monsi & Saeki, *Japanese Journal of Botany* 14:22–52, 1953**:

```
I / I₀ = exp(-k · LAI)
```

| Cover | `k` | LAI | Transmittance |
|---|---:|---:|---:|
| closed boreal conifer | 0.50 | 4.0 | **0.135** |
| open meadow | 0.70 | 0.8 | **0.570** |

The meadow floor receives **4.22×** the forest floor light. The erectophile /
planophile coefficients and LAI ranges are standard remote-sensing ranges,
**informal**. The result sets contrast range, not a uniform brightness lift.

## 2. Colour and materials

### Measured endpoints

Broadband visible reflectance, **informal** remote-sensing ranges:

| Surface | R | G | B | Consequence |
|---|---:|---:|---:|---|
| sward | 0.075 | 0.170 | 0.062 | green but dark |
| foliage | 0.048 | 0.128 | 0.048 | denser chlorophyll path |
| loam | 0.480 | 0.380 | 0.250 | dry quartz sand warms with wavelength |
| bloom | 0.820 | 0.680 | 0.105 | carotenoid yellow |

Snow reflects about 0.80–0.90. A meadow cannot be made by brightening the
winter palette; its ground reflects roughly one tenth rather than eight
tenths.

### Response and perceptual ladder

**Naka & Rushton, *Journal of Physiology* 185:536–555, 1966**:

```
R / Rmax = Iⁿ / (Iⁿ + σⁿ)       n = 0.85
```

`n = 0.85` is a fitted midpoint of the published 0.7–1.0 range. `σ` is scene
adaptation, so bright meadow and dim forest are two states of one response.
Apply the response to luminance, not each channel; per-channel compression
desaturates highlights. Exposure anchors a 0.90-albedo white surface in full
sun at `L = 0.95`.

Ramps are spaced in Oklab (**Björn Ottosson, 2020**; CIELAB, **CIE 1976**).
Physics selects endpoints and hue path; the medium places equal `ΔL` steps.

| Ramp family | Step-size spread about its mean |
|---|---:|
| authored ramps | 1.0%–34.7% |
| derived meadow ramps | 0.4%–1.9% |

### Leaves transmit

Standard remote-sensing leaf optics, **informal**:

| | 650 nm | 550 nm | 450 nm |
|---|---:|---:|---:|
| `τ_leaf` | 0.05 | **0.13** | 0.03 |

Single-scattering albedo is `ω = ρ + τ`. Two-stream similarity follows
**Dickinson, *Adv. Geophysics* 25:305–353, 1983**;
**Sellers, *Int. J. Remote Sensing* 6(8):1335–1372, 1985**; and the analogous
paint-film algebra of **Kubelka & Munk, 1931**:

```
T(λ) = exp(-k · LAI · sqrt(1 - ω(λ)))
```

The beam transmitted through intercepted leaves is:

```
arriving = (1 - exp(-k·LAI / sin alt)) · τ_leaf(λ) · cover
```

This term changes the measured sward shadow from 10.7× darker than adjacent
sun to **5.6×**, within the documented five-to-eight range. For an isolated
crown, the diffuse sky mixes uncovered hemisphere with crown transmission
instead of treating one tree as an infinite ceiling. Internal bounce uses `ω`,
not reflectance alone.

The similarity relation is conservative: it gives green:red transmission near
1.2 where measured canopies run 2–3.

### Two cleared vegetation ramps

`uSteps = 3` produces four posterised levels. A seven-rung ramp therefore
exposes only indices 0, 2, 4, and 6; three colours are unreachable.

Independent overlapping canopy and grass ramps also fail: `POST_FS` searches
the whole scene palette, so an interleaved foliage rung can steal ground
pixels. The legal choices are disjoint families or exact shared rungs.

Frostwind used one five-rung ladder with three shared rungs, and plant
deposits became the same colour as the meadow floor. The live ramps are now
two cleared four-rung derivations:

```
canopy = makeRamp(foliage albedo → crown leaf ends)
grass  = makeRamp(sward albedo → turf ends)
```

They share leaf transmittance but not reflectance: foliage is the denser
chlorophyll path, sward is the sunlit floor. Collision tests require clearance
above the form-carrying Oklab floor so moss and crowns cannot snap onto grass.

### Pond optics

Pure-water absorption from **Pope & Fry, *Applied Optics* 36(33):8710–8723,
1997**, corroborated by **Smith & Baker, *Applied Optics* 20:177, 1981**:

| | 650 nm | 550 nm | 450 nm |
|---|---:|---:|---:|
| `a` (m⁻¹) | 0.35 | 0.060 | 0.015 |

Red is absorbed about **23×** more strongly than blue. Cabinet projection `k =
1/2` implies a camera 30° above ground and 60° incidence on horizontal water.
Snell at `n = 1.333` gives 40.6° refraction, an in-water path of **2.63d**,
and unpolarised Fresnel reflectance `R = 0.059`.

Pond bathymetry is a **kettle**: a short margin onto a flat floor.

```
depth = min(2.0 m, ground_distance_metres · tan(BANK_KETTLE))
```

`2.0 m` is authored within the 1.5–2.5 m farm-pond range. Pond Court is
managed earthwork and deliberately uses 42°; the changed depth per shore pixel
passes through the same absorption model.

It was a cone at the 30° repose of saturated sand, and a cone is the one basin
form almost no lake has. Neumann's volume development `D_V = 3·z_mean/z_max` is
1.0 for a cone and most lakes sit well above it, flat-floored (**Hutchinson, *A
Treatise on Limnology* I, 1957**; **Neumann, 1959**). The meadow measured
**1.16–1.27** and spent its whole four-rung ramp on **43 px** of margin, wider
than a person is tall on a lake 49 rows deep — the whole lake was shore. That is
a beach, and a beach needs the wave fetch and sediment supply a 20 m pond does
not have.

**The margin is a pixel budget and the angle is derived from it**, the same way
the ice shelf is five pixels and the bank shading is three: past about a body
width the shore stops being an edge and becomes a band of a third colour lying
between the land and the water. `POND_MARGIN_PX = 18` ground pixels is 1.18 m of
run for 2.00 m of fall, so `BANK_KETTLE` stands near **60°** — above frictional
repose and above Pond Court's 42°. Root-bound cohesive margins and undercut sod
lips do stand there, but the honest statement is that this is the medium winning
over the material, named rather than dressed as physics. Colour saturates at
0.80 of floor depth, so the *visible* transition is about 13 ground px, and the
lakes now hold 62–75% of their area at floor depth.

The distance it reads is a **ground** distance. `dL` is a screen-space
transform, and `k = 1/2` makes one screen row two ground pixels, so feeding it
a horizontal `PX_PER_M` drew the near and far banks at 16° while the side
banks stood at 30°. `edt` in `src/world/chunk-bake.js` takes a row weight and produces
`dLg` for this read only; the isotropic `dW`/`dL` stay screen-space for
habitat windows, reeds, shore stones and the boreal ice shelf, so no placement
moved.

Submerged granular albedo uses a wet/dry ratio of 0.5, midpoint of measured
0.4–0.6, from **Ångström, *Geografiska Annaler* 7:323, 1925**.

**Omitted deliberately:** volume backscatter from **Maritorena, Morel &
Gentili, *Limnology and Oceanography* 39(7):1689, 1994** was evaluated and left
out. Any unmeasured coefficient large enough to matter compressed the four-rung
lightness span below usefulness. Absorption has measured authority; the
backscatter coefficient did not.

### Ground texture belongs in the normal

Sward colour noise at ±0.030 is only 9% of a four-rung step and cannot cross a
boundary; increasing it enough produces confetti. Micro-relief therefore
perturbs the normal:

- culm direction is 72% local rosette, 28% wind-combed;
- period is about 4–5 px;
- the field is evaluated at full resolution and differenced into a gradient;
- a 60 px patch gate leaves quiet ground between rough areas.

The first all-wind version produced a global diagonal hatch. Wind biases blade
azimuth; it does not erase basal rosettes.

**CORRECTED.** The paragraph above was true of the ±0.030 contour-wander term
and silent about the coarse patch field applied beside it at **±0.115** — 69% of
a rung, which crosses boundaries freely. That field is the boreal snowfield's
drift field, where it *is* the drifts; on grass this page had already forbidden
it. Declared and drawn now agree: `BIOMES.meadow.patch` is 0.

And the patch field was not even the main term. Holding each contribution flat
in turn, over three seeds at the app's own sun (az 218°, el 40°):

| term held flat | sward pixels off the modal grass rung |
|---|---:|
| nothing — as drawn | 4.2% / 9.6% / 5.0% |
| the terrain normal | 0.1% / 0.3% / 0.3% |
| the albedo patch field | 3.7% / 5.2% / 3.8% |
| both | 0.0% |

The **terrain normal** carried it, through `ndl * 0.58`. And the area fraction
was never the complaint, the scale was. Off-modal pixels form connected
patches, and at full relief the largest in a single chunk was **1069 px**: an
area, not a texture. `relief 0.22` is the largest value at which no patch of
64 px or more survives at any seed; the largest then measured 40 px against a
median of 2–3 px, which is the culm doing its job.

Re-centring the surface inside its rung was computed and **refused**. The lit
mean sits at 0.775 against a boundary at 0.8333; centring it needs base ≈
0.294, and the shadow branch paints `base + 0.38·ndl − 0.45`, which at that
base lands on 0.084, two rungs down, on a *canopy* rung. That is the
ramp-family collision this project already has a canon row about. So the fix
is amplitude only, and `base` stays at 0.40.

### Water is basins, not a contour

The meadow's permanent water was `fbm > threshold` on a domain-warped field.
Measured over a 2200 px window: shoreline development `D_L = L/(2√(πA))` of
**2.0–2.6** across 40 bodies — Hutchinson's dendritic-reservoir class, in a hay
meadow — with long thin arms, pinched-off puddles, and bounding boxes *taller
than wide*, against the `k = 1/2` camera the rest of the frame obeys.

A threshold has the noise's shape. A lake is a hollow that filled up, and
nothing here is drawn tall enough to read as the landscape a contour would
belong to, so the meadow states the hollow instead: a lattice of bowls with
the cosine radial profile `0.5 + 0.5·cos(π·q)`, which reaches zero slope at
the centre and at the rim. That construct was already in the file, it is what
the swamp's oval backwaters used at the time, and its note there already said
why.

The cosine survives here as the **waterline** only: it decides where the shore
falls, and `TH` cuts it well up the flank. Depth below that line is the kettle
margin above, not the cosine. The swamp went the other way and replaced the
cosine outright, because there the same expression was carrying both jobs.

- lattice pitch 400 px, 60% of cells wet, half-width 100–200 px;
- `ry = rx/2`, because `k = 1/2` halves the depth axis and a round pond on the
  ground draws twice as wide as it is deep;
- the shore wanders by 0.085 of a radius — in radius units, so the wobble is a
  fixed fraction of the lake whatever the waterline does;
- `TH` is still the only waterline: water where `amp·bowl > TH`, so the shore
  sits at `q = acos(2·TH/amp − 1)/π` — 65% of the radius at the default
  `lake 0.55`, 41% at 0, 96% at 1. `amp` must exceed TH's dry end of 0.40 or
  `lake:0` erases the water rather than shrinking it.

Every bowl now measures within **1.12×** a rasterised circle's development on
the same lattice, at a median projected aspect of 2.0. The trail's drying
term, the village's raised ground and the rim still carve those bowls, and a
pond with the road through it is a crescent rather than an arm, so the
roundness law is asserted on the bowl and the carve is asserted to only ever
subtract.

Depth follows: `amp − TH = 0.51` gives about 1.4 m at the centre, inside the
1.5–2.5 m farm-pond range this page already cites, and `pondT` reads shore
distance rather than the signal, so the optics above are unchanged in kind.

### Nothing woody stands in a yard

The meadow's five houses, windpump and derelict had **no** flora exclusion.
The one keep-out predicate scanned `BUILDINGS`, and the meadow sets
`cabins:false`, so 29 props stood inside a steading footprint in a 5×5 chunk
block, including a meadow tree whose crown is 69 px reaching into a house.

Footprints are stated in `src/steading.js`, beside the widths that draw them,
and the band is graded: nothing at all inside the silhouette, nothing woody
within the yard, grass to the wall. The yard is 0.914 m, Merrell outdoor
circulation / yard clearance (`YARD_M`). The woody band adds the plant's own
`CROWN_HALF`, measured off the rasters at the heights the atlas bakes, because
an anchor outside a yard is not a canopy outside a yard.

Siting is now a walk rather than a list of offsets. Before it, at every seed
tested, the windpump stood 30 px from a house of half-width 57, the mast
inside the building. It is compiled after the portals, because it asks
`isWater`, which asks the pond court, and asks a `POI` list the portals are
not yet on.


### Aerial treatment is scene taste

Physical airlight over roughly thirty metres is negligible. `aerialApply` is a
declared glare/contrast treatment:

| Scene | Target | Compress | Desaturate | Haze |
|---|---:|---:|---:|---:|
| frostwood | 150 | 0.24 | 0.21 | 0.19 |
| meadow | `lum(grass[2])` | 0.10 | 0.08 | derived cap, about 0.041 |

The meadow target comes from its ground ramp. `hazeCap()` solves the largest
mix for which treated `canopy[0]` still snaps to itself rather than
`canopy[1]`.

> **An aerial treatment may not move a surface off the rung it was derived
> onto.**

## 3. Flora

### *Phoenix canariensis*

At 38° N the palm is a warm-temperate Canary Island date palm, not a coconut:
15 m life height, ratio `0.300 × 15/18 = 0.250` against the birch authority,
placed at 56/78 px.

Palms have no vascular cambium and no secondary thickening (**P. B. Tomlinson,
“The uniqueness of palms,” *Botanical Journal of the Linnean Society*
151:5–14, 2006**). Da Vinci's branch law with one child reduces to:

```
r_parent^a = Σ r_child^a    →    r_parent = r_child
```

`BOTANY.palm.taper = 0` produces a constant stem above the establishment cone.
Terminal petiole area conserves:

```
r_stem^a = N · r_petiole^a
```

Frond divergence is the golden angle, **137.50776°** (**Charles Bonnet,
1754**). The legible count is constrained by blade separation and cabinet
projection:

```
N ≤ π / (2 · 1.4 · pinna) = 1.12 / pinna
```

The factor 1/2 is the projection's compressed depth axis. The earlier
elevation-spacing rule returned thirteen fronds at every size and drew a mop;
it compared sequence neighbors that are 137.5° apart rather than visible blade
overlap.

A frond is a cantilever, not a catenary (**K. J. Niklas, *New Phytologist*
143:19–31, 1999; *Plant Biomechanics*, 1992**):

```
droopN(u) = (u⁴ - 4u³ + 6u²) / 3
droopN(1) = 1
droopN′(0) = 0
```

Zero root slope preserves insertion angle. Leaflets are represented as the
sawtooth edge of a filled blade; separate two-pixel strokes became speckle.
Leaf-base scars floor at 2 px and replay the crown phyllotaxis down the stem.
The crown silhouette is those frond strokes, a broadleaf `crownMass` fill over
them fused the pinnae into a blob with a trunk-shaped hole and was removed.

### Open-grown broadleaf

The summer broadleaf is an open-grown Rauh architectural model. Recursion
depth is only a guard; a true child pipe below `CHILD_FLOOR = 0.8 px`
terminates as a bud in the medium.

Shinozaki's pipe-model relation maps terminal conducting radii to crown lobes:

```
R_i = C · r_i
Σ πR_i² = π · crownWidth · crownDepth / 4
```

One normalization fills the measured crown ellipse while preserving relative
terminal area; only lobes below the 1.6 px foliage floor depart explicitly.

Finished crown depth `crownD` controls local Beer–Lambert volume:

```
volume = 1 - exp(-k · LAI · THICK_PX / crownD)
```

Placed tiers are 60/84 px (3.92/5.49 drawn metres), large enough to read as an
open-grown landmark rather than a repeated forest wall.

## 4. Height budget

`PLAYER_H = 26 px = 1.70 m`, so the world scale is **15.294 px/m** and a
180-row frame spans **11.77 m**.

| Subject | Life | Drawn | 180-row frame |
|---|---:|---:|---:|
| traveller | 1.70 m | 26 px | 14% |
| tallest placed spruce | 25–30 m | 75 px / 4.90 m | 42% |
| placed summer broadleaf | 16 m | 84 px / 5.49 m | 47% |
| cabin | 5.49 m | 84 px | 47% |
| house micro-turbine | about 6.1 m | 94 px | 52% |
| farm windpump | 11.28 m | 173 px | 96% |
| 10 kW turbine on 24 m tower | 27.5 m | 421 px | 234% |

Trees use about 0.16–0.20× life scale to preserve apparent camera height;
buildings use life scale. Sward and shrubs remain life-scale because a person
stands beside them rather than under them. Atlas tiers and world-placed tiers
are separate authorities; use the latter when reasoning about composition.

## 5. Wind machines

Tip speed is `λU`. At `U = 6 m/s`, 60 fps, and 15.294 px/m:

| Machine | `λ` | Tip speed | px/frame |
|---|---:|---:|---:|
| modern three-blade turbine | 7 | 42 m/s | **10.7** |
| multi-blade farm windpump | 2 | 12 m/s | **3.1** |
| high-solidity Aermotor | 1 | 6 m/s | 1.5 |

Ten pixels per frame reads as a strobe; the physically honest exposure disc
requires translucency unavailable to the locked palette. The grid therefore
selects the multi-blade pump.

**A. Betz, 1920** bounds extraction at `16/27 = 0.593`. With a real pump
coefficient `Cp ≈ 0.30` and radius 1.22 m:

```
P = ½ρA·Cp·U³
  = ½ · 1.225 · 4.68 · 0.30 · 216
  = 186 W
```

That is a water pump, not a house supply; roof rotors supply houses.

Animation derives from wind:

```
rev/s = λU / (2πR) = λU / (πD)
frame = floor(fract((rev/s · ∫wind dt + phase) · blades) · 6)
```

Integrating wind preserves phase when speed changes. Fixed world-position
phase prevents lockstep. Six frames cover one blade-symmetry period.
Structural floors keep the 75 mm tower members and 60 mm mast at two pixels;
rasterized pump solidity is 0.384 against requested 0.34, including hub and
overlap.

## 6. House

### Derived

| Dimension / choice | Authority |
|---|---|
| plan 6.0 × 4.5 m | 27 m² small dwelling |
| head height 3.2 m | warm-climate stack ventilation; Olgyay, *Design with Climate*, 1963; Givoni, *Man, Climate and Architecture*, 1969 |
| roof pitch 12° | standing-seam drainage; 10–15° practical |
| butterfly roof | rainwater harvesting to one downpipe |
| valley front-to-back | preserves full pitch under `k = 1/2` projection |
| glazing 3.0 m² | overlap of daylighting 1/5–1/10 floor and passive-solar 7–12% |
| eave 0.74 m | `0.45 ×` 1.65 m eave-to-sill high-sun shading |
| clerestory | stack outlet provided by butterfly void |
| rotor 1.5 m, mast 2.5 m | small-wind roof class; IEC 61400-2 |

**Taste:** glazing side, door position, planter, seam count, and pixel drawing.

The low 12° roof cannot use the winter cabin's steep-triangle silhouette.
Meadow architecture instead reads as horizontality, long roof and deep eave
shadow, against palm stems and standing grass.

Failed derivations retained as warnings:

- PV tilt is a panel angle, not the roof pitch; using it made the clerestory
  dominate the elevation.
- Clerestory glazing is part of the 3.2 m wall height, not stacked above it.
- A 6 m small-turbine mast is the ground pole-mount figure, not roof-mount.

The shell uses the bright neutral `birch` family because `timber` tops out
below the sunlit grass.

## 7. The pond court: compiling a place

The court establishes a reusable order of operations:

```
nature fields → site affordance → cultural plan → candidates → selection → pixels
```

- **Hydrology:** candidate sites lie beside the world trail and score proximity
  to the water table, dry occupation ground, and clearance from existing places.
  A smooth managed-drainage field prevents the pond from becoming an accidental
  fragment of a larger lake; the basin remains connected to the same wetness
  field.
- **Pond form:** the maintained basin uses a 42° bank instead of the natural
  loose-soil profile. That angle changes depth per shore pixel, which changes the
  Beer–Lambert colour ramp without a second hand-painted water palette.
- **Paving:** the route is continuous geometry from trail to court. Jittered
  Voronoi cells provide fitted stones; `F2-F1` provides their joints. The same
  world-space field continues along the main trail, so junctions are unions
  rather than caps or transition tiles.
- **Ruins:** pillars retain base, shaft, and capital proportions; walls retain
  bonded courses. Decay removes exposed arrises and unsupported ends, not random
  holes through load-bearing faces.
- **Composition:** valid framing-tree candidates are generated around the place,
  rejected for water, circulation, architecture, and road conflict, then selected
  with crown clearance. Nature determines what can grow; selection determines
  whether the place has legible negative space and a focal hierarchy.

Physical validity does not choose a composition. Generate valid alternatives,
score visible consequences, then keep a small strong set.

## 8. Dream-machine ecology

Three curvature-heart species live only in this world: one colossus, one
strider, and one pilgrim. They are not scaled people and do not use the human
rig. Their anatomy, invented law, ordinary-physics boundary, mass model, gait,
materials, and moss derivation are specified in [`MACHINES.md`](MACHINES.md).
They stand 64–88 rows tall against the traveller's 26. Their upper shells carry
a continuous dark-canopy pelt and long mantle fringe; four idle wind phases move
the fringe without moving the resting bronze body.

The ecology is intentionally sparse. Each individual follows long committed
routes at 6–10 px/s and rests longer than an ordinary animal. It neither
chases nor flees. Spawn and goals are accepted by `entityAffordance` (`src/world/life-field.js`),
which holds them to meadow biome, dry low-slope ground, pond margin, trail
clearance, and place clearance. `scene.js` supplies no machine-specific site
exceptions.

Sward normally springs back and rejects a boot print. These bodies weigh
0.8–4.0 tonnes; pressure derived from mass and foot area exceeds the sward
row's 24 kPa yield floor, so their broad prints persist through the same
weather clock as snow and dust marks. This is a material response, not a
meadow-wide switch that makes every ordinary animal leave tracks on grass.
