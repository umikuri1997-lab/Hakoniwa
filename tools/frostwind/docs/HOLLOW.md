# The Amethyst Hollow, Measured

A limestone cavern under the Frostwood. No sun reaches it. The earth folk call
it Maanala ("under the earth", authored from Finnish *maan alla*).

Every other world has a sun and one cause that everything reads. This world's
cause is **emitted light**, and the chain is:

```
emission band (nm)       -> lamp colour            (CIE 1931 fit, no picked RGB)
lamp + wet limestone     -> floor and wall ramps   (three anchors: shadow, rest, lamp)
dim surface              -> mesopic shift          (hue falls away, blue stays)
height of a body         -> its pool of light      (inverse square, Lambert)
rooms cut in rock        -> where you walk, what a wall hides
clear water, deep        -> blue at the bottom, a whole mirror on top
```

## 1. Light

A lamp is a spectrum. `EMISSION` in `src/sunlight.js` states the bands:

| Emitter | Peak | Source |
|---|---|---|
| Ceiling glowworm, *Arachnocampa luminosa* | 487 nm | Johnson & Haneda 1966 |
| Luminous agaric (*Panellus*, *Mycena chlorophos*) | 530 nm (520-530) | Desjardin, Oliveira & Stevani 2008 |
| Crystal | 425 nm, through a 545 nm absorber | fluorite Eu2+ emission; amethyst band, Lehmann & Moore 1966 |
| Foxstone (cave calcite) | 450 nm, authored | organics in cave calcite emit at 410-460 nm (van Beynen, Bourbonniere & Ford 2001); the afterglow sits redward (Shopov 2004) |

`spectrumRGB` integrates a band against the Wyman, Sloan & Shirley (2013)
fits to the CIE 1931 functions. Band widths are authored.

**The one invented law.** The crystals and the foxstones are phosphors: they
store the ceiling's light and give it back. No real mineral is self-luminous:
fluorite glows under UV, and cave calcite for 0.5 to 0.7 s after it (Brennan &
White 2013). The body colour stays real: the iron centre of amethyst absorbs
near 545 nm.

A dim surface loses hue. `mesopic` keeps a share of the lamp's hue (`CONE`,
authored: 0.30 at rest, 0.62 in a pool of light) and draws the rest toward the
bluish white at chromaticity (0.25, 0.25) (Purkinje shift; Jensen et al. 2000).
A luminous body is bright enough for cones and skips it.

`NEAR` (4, authored) is the luminance a lamp adds at its own foot, in units of
the ceiling's.

## 2. Ramps

A reflecting ramp has three anchors: under a body, at rest under the ceiling,
at the foot of a lamp. The floor is one albedo under two lamps, so `caveRock`
`geodeRock` and `moonRock` share their two resting rungs and a pool of light
meets the floor with no seam. Where two lamps are near equal the pools meet in
a half checker. `dripstone` and `geodeStone` are the same pair on calcite.

A crystal group throws 2.4 lamps at its own foot, more than `geodeRock`'s last
rung holds. The floor there runs on up `geodeStone` (`SURF.geodeHot`): calcite
reflects 2.9 times wet rock, so calcite under one lamp is rock under 2.9. The
glow of a crystal sea is this gradient, and it costs no colour.

Albedo: limestone 0.35-0.55 dry (engineering tables); wet is half of dry
(Lekner & Dorf 1988). `glowcap` and `amethyst` are emitted spans (`LUMEN`,
authored ends).

Gill edges give over 90% of a luminous agaric's light (O'Kane et al. 1990), so
a cap's underside is its brightest rung.

## 3. Pools of light

`src/glow.js`: a point source at height h over a plane gives
`E(d)/E(0) = (1 + (d/h)^2)^(-3/2)` (Lambert 1760). The medium wins, named: a
chunk answers from a margin of `PAD` pixels, so a light reaches 54 ground
pixels at most and the kernel is shifted to end at zero there.

Placement of every luminous body reads analytic fields only. A body is asked
for by every chunk its light reaches, and a windowed distance to water differs
between two chunks.

## 4. Rock

`src/world/cavern.js` states the rooms: a hall at the common, a ring gallery,
a chamber west, east and south, a room for the portal, and two passages that
cut the rock between hall and ring into four blocks (a phreatic maze and a
ring of collapse chambers; Palmer 2007). The plan is authored, as a town plan
is. A wall stands 2.4 m. The rows a wall hides are solid: a body behind a wall
cannot be drawn.

Set pieces give a room a middle: the Heart (one 3.8 m crystal, invented scale)
in a fairy ring of caps (Tylwyth Teg dance in rings; Briggs 1976), and the
standing stones of the south chamber. A `field` stands one body per pitch over
an ellipse, so its pools of light join: the Amethyst Sea fills the west
chamber, a second sea lies on the ring to the south-west, and the Spar Bed, a
crust of foxstones, on the ring to the north-east.

## 5. Water and drip

A gour is a rimstone pool over a sump. Pure-water absorption only (Pope & Fry
1997): green dies faster than blue, so the deep end is the bluer one. The lip
is rimstone, on every waterline. Still air: the reflection displacement is the
lowest in the project.

The drip is the rain lattice at a third of its rate. Measured cave drips run
0.01 to 2 per second (Genty & Deflandre 1998).

## 6. Crystals

`growCrystal` in `src/speleo.js` draws both minerals from one apex angle.

| Mineral | Form | Faces from the c-axis |
|---|---|---|
| Amethyst (quartz, c/a 1.100) | hexagonal prism under six faces; prisms radiate from one seed in a geode's wall | 38.2 deg |
| Foxstone (dogtooth spar, calcite {21-31}, c/a 0.8543) | scalenohedron, no prism; a crust of points | 21.0 deg; polar edges 22.1 and 26.9 deg |

The calcite angles reproduce the goniometer values 35 deg 36' and 47 deg 1.5'
(Oklahoma Academy of Science calcite paper). Pool spar grows under water and
stops at the waterline (Hill & Forti 1997), so a foxstone stands on a pool's
damp skirt. Points measure 5 to 15 cm at Jewel Cave (NPS) and 40 cm at
Sitting Bull Crystal Caverns.

The medium wins, named: at 24.5 deg a 12 px point is 11 px wide and five draw
one lump. The foxstone is drawn at 15 deg, a steeper scalenohedron, and at
0.5 to 1.25 m.

Rejected: nailhead spar (blunt), selenite (a plank with a chisel end), smoky
quartz (the amethyst's own silhouette), aragonite (needles under a pixel).

## 7. Scale

Stalagmite 1.6-3.2 m and amethyst groups 1.1-2.2 m sit inside measured ranges
(geodes to 1.8 m, Australian Museum). A glowcap is 0.6-1.6 m: invented, the
real cap is 3 cm, a fifth of a pixel.

## Refused

- Sunlight, a sky, a day cycle: `BIOMES.hollow.sunless`.
- The Sámi word *saivo* as a label. It is living sacred heritage; it is a
  source here, not a name.
- Coloured light on standing sprites. The floor and the walls carry a lamp's
  colour; a body is lit by the ceiling.
