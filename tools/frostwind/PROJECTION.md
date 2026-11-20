# Projection

Outdoor cabinet geometry for Frostwind. `src/scale.js`, `src/construct.js` and
the outdoor makers (`src/cabin.js`, `src/steading.js`,
`src/swamp-settlement.js`, `src/swamp-lakehouse.js`, `src/species.js`,
figure/animal banks) are the executable authority when prose drifts. Cabins,
steadings, and swamp houses are exterior world props only, doors do not open
into rooms.

## Mapping

Outdoors use cabinet foreshortening on depth:

```
screen_x = world_x
screen_y = world_y / 2 − world_z
```

`k = 1/2` is a small rational: it gives objects visible faces while every even
depth remains on integer rows. Nothing in the mapping rounds.

### Ground locomotion seam

Retro-figure feet are not cabinet volumes. They are samples on the same
screen-space ground plane that advances actor roots, so their local locomotion
projection is named separately:

```
profile:    screen_x = forward;  screen_y = -lift; depth = lateral
front/back: screen_x = lateral;  screen_y = ±forward - lift
```

This is `k = 1` for ground travel only. Profile lateral position decides
painter order but cannot move a planted sole above or below the shared ground
line. Each pixel of resolved root travel is cancelled by one pixel of opposite
sample travel. Body stature and static object depth remain `k = 1/2`.
`projectRetroPoint` is the executable authority for this seam.

## A box

A `w × d × h` box emits:

| Part | Extent | Value |
|---|---|---|
| top face | `w × d/2` | lit |
| arris | `w × 1` | dark |
| front face | `w × h` | one or two rungs below the top |

Total screen extent is **`w` columns by `h + d/2` rows**. Buildings add a third
face and a column term; see below.

- Outdoor makers author world dimensions in metres and derive sprite height
  through `src/scale.js` (`PX_PER_M`, `tr`, `trEven`, `projectedM`).
- Depths are even. An odd `d` creates a half-row and breaks the integer grid;
  `trEven` enforces the contract.

### A building's own depth axis

The mapping above is oblique projection with the depth-mixing direction pointing
straight up the screen. Its screen-`x` term is zero, so a wall facing the camera
has a side face exactly zero pixels wide. That is why every drawn house was a
flat rectangle carrying a roof profile: a 4.5 m deep house prices at 34 screen
rows through `obliqueRows` and `makeHouse` drew none of them.

Buildings mix their own depth up and to the **right** at 45°, halved on both
screen axes. This is the cabinet variant that furniture drawing names and that
Ultima VII used, and it is the same halve-and-shear the top face already gets:

```
rows = obliqueCols(d) = obliqueRows(d) = d/2
back-top corner = front-top corner + (d/2, −d/2)
```

A `w × d × h` building therefore emits **three** faces over `w + d/2` columns and
`h + d/2` rows. Equal rows and columns put the receding edge on a 1:1 step, which
is an exposed slope this document already admits.

Two consequences:

- The building's ground rectangle draws as a parallelogram sheared `d/2` columns
  right of world truth. Footprint and collider follow the drawn base, so drawing
  and collision keep agreeing. `docs/CANON.md` carries this as a named
  concession.
- Outdoor sun shears bottom-right, so the return is the darkest face and the
  front is the middle one. A building carrying a return may not be mirrored:
  a mirrored return lights the side above the front.

Props with no return keep the two-face box above. `src/construct.js` is the
executable authority for buildings that have one.

### Height and depth both move a sprite up the screen

`screen_y = world_y/2 − world_z` mixes them, so a sprite offset upward can be
higher, further back, or both, and reading one number off a sprite cannot tell
you which. Anything that asks how HIGH a thing is has to be stated from the
height terms alone:

- the shadow pass shears by height above the ground (`iLift`);
- a reflection mirrors about the water, so an object `lift` up images `lift`
  down;
- a building's own depth is what its return and its top face spend.

The roof rotor was lifted by its whole vertical offset, which counted the rows
its mast stands BACK on the roof as rows it stands ABOVE it, and made a 5.7 m
machine 6.8 m tall.

### Visible normals

A camera-facing box has two planar faces and therefore two normals:

```
front  (0, 0, 1)
top    normalize(0, −2, 1)
```

A building with a return adds the third:

```
side   normalize(0.78, −0.10, 0.62)
```

Screen convention is `+x` right, `+y` down, `+z` out of the screen.

Planar faces obtain their separation from named occlusion values. Per-face
normals do not add detail to a crate because each face has one Lambert value.
They matter for cylinders: the front normal varies by column and `posterise`
turns that variation into bands. A round face therefore carries flat occlusion
and lets its normal describe form.

**Failed approach:** varying both authored shade and normal across a cylinder
multiplies two descriptions of the same form. Round outdoor props (churns,
pails, baskets, drums) use one geometric term.

## The ground plane

`world_y / 2` applies to footprints and distance on the ground, not only box
tops. A box `d` deep occupies `d/2` ground rows. Its collision footprint must
match those rows or drawing and collision disagree by construction.

The conversion applies to object footprints, placement cells, trails, yards,
and any world-distance geometry. Shadow projection makes the inverse conversion
when casting onto the ground (`W_SHADOW_VS` / related outdoor shadow paths).

### Deliberate deviations

- **Movement is not foreshortened.** Outdoor travel advances screen `y` at the
  same rate as `x`, so depth traversal is twice as fast in ground metres. This
  is a feel choice shared by the traveller and realized actors.

## A person beside a box

The figure is a flat elevation: a 1.70 m person occupies 26 rows and has no top
face. A box of equal real height also includes `d/2`, so equal metres do not mean
equal screen rows.

Declare a person's nominal front-to-back depth:

```
HUMAN_D_M       = 0.24 m
projectedM      = h + d/2
ROWS_PER_PROJ_M = 26 / 1.82 = 14.29 rows per projected metre
```

Outdoor props authored at `PX_PER_M = 15.29` therefore appear about **7% taller**
beside the flat figure. The scale spec bounds that residual at 15%.

Giving the walker's body a separate projected depth was rejected:
`PLAYER_H = 26` is the size axiom. Raising it or adding a second height
authority would move every derived dimension to repair a three-row
representation mismatch. The ground-locomotion seam above changes foot travel,
not stature.

## Legibility floors

At about 15.3 px/m, small real proportions cannot carry their parts. Floors
belong to the small outdoor object or part that needs them, stored in metres
on the affected dimension, not as a global enlargement of every prop.

## Curves and slopes

Sampling `sqrt(1−u²)` per column and rounding yields irregular run lengths such
as `1,2,1,1,2,1,2,2`. Outdoor makers instead sample the ideal profile, convert
it to row transitions, and force non-increasing integer runs such as
`4,3,2,2,1,1`.

Solve on the long axis. Solving a flat ellipse from the short axis collects many
zero/one steps at the pole and produces a rectangle with a chamfer.

Consequences:

- true isometric is refused because its edges repeatedly form ragged stairs;
- exposed slopes use `1:0`, `1:2`, or `2:1`, not rounded arbitrary-angle trig;
- handles and arches use authored integer runs so endpoints meet the rim and the
  middle reaches the top.

## Value budget

Form depends on a lit top, darker front, and dark arris. Equal top/front rungs
make a box flat; a lit face matching the face beneath it becomes a line rather
than a mass.

With `uSteps = 3`, posterisation returns four levels with cuts at:

```
t = 1/6, 1/2, 5/6
```

Outdoor Lambert lighting must keep planar faces on distinct posterised rungs.
Authoring a fourth continuous shade the ladder cannot land on spends a value
the pipeline discards. See [docs/CANON.md](docs/CANON.md).

### A second state is a rim, never an area

One surface paints one tone. When a state inside it must read (wet soil, a slip
face), the mark is a rim on the edge that causes the state: a few pixels of the
next rung down, then a half checker that washes out, then the surface's own
tone. The rim follows its cause, so it sits where the eye expects it.

A flat area of a second rung inside one surface is colour noise: a shape no
object owns. Measured, then rejected in review: wet hollows as areas put 20% of
the swamp floor on a second colour, and whole lee faces drew 73 px bands across
the erg. As rims the marks cover 6% of the floor and 2% of the sand.

A rim is as complete as its cause. Every peat waterline has a capillary fringe,
so the wet rim has no gap: a rim on some stretches of one shore reads as an
error. Where physics gives a width, the rim takes it. The wet rim is cut from
the narrowest capillary band, in ground pixels, so it is half as deep on the
near and far banks.

Realism does not excuse a busy frame: when the true state and the quiet frame
conflict, the frame wins and the state stays in the model. `RIM` in
`src/world/ground.js` states the widths.

## Contact and assembly warnings

- A sprite's drawn contact line is `sh` rows above its placement anchor because
  the authored contact occupies those rows. Sprite geometry and `solids` can
  differ by those two or three pixels without being wrong.
- Short outdoor props use baked contact ellipses (`atlas.contact`); tall casters
  use projected shadows. A contact blob longer than the caster is wrong by
  construction.
- A part on the same rung as the material behind it must separate in space or
  value; adding outline everywhere spends the limited dark rung and flattens the
  whole object.

Where a statement here conflicts with `src/scale.js` plus the direct outdoor
tests, the implementation and tests are current and this document is stale.
