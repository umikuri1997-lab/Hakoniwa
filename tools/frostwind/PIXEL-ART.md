# Pixel art: craft rules from outside the pipeline

Frostwind encodes craft rules in `sprite.js`, `palette.js`, and the figure rig.
This document checks those rules against how a working pixel artist describes
the medium.

## Where this came from

Six video transcripts from **Penusbmic** (Ben / "Pen"), a pixel art artist and
animator, Bullet Bunny, and animation work on Dome Keeper and Shogun Showdown.

| transcript | bears on |
|---|---|
| The Ultimate Tree Tutorial | `sprite.js`, `species.js`, `SNOW` |
| The Ultimate character design workflow tutorial | `body-folk.js` / `figure-folk.js` |
| How I Design Unique Characters Step by Step! | shading model, `inPut` |
| Pixel Art Animation: My Workflow Breakdown | silhouette-first walk structure |
| Simple Idle Animation | secondary motion, lag |
| Simple Run Animation | run phases, leg readability |

**Confidence and gaps.**

Auto-generated speech transcripts of screen-recorded drawing. They carry what
was said. Where he says "like so", the teaching was on screen and is lost.
Every rule below is one he stated in words; extrapolations to Frostwind are
marked as inference.

Two files were unusable: the DARK FANTASY Knight transcript downloaded empty,
and the Sci-Fi Rain timelapse has no narration.

The set was chosen by download rather than curated, so it has holes. **No
coverage of line work, jaggies, pixel clusters, anti-aliasing, dithering,
colour theory or palette construction.** This file therefore says little about
`posterise` and `rampStep` in `shaders/sprite.js`, and its `RAMP_BASE` reading
is inferred from asides. Those stay open.

He is a hand artist billing by the hour, so some of his strongest advice is
about spending human attention, which a procedural pipeline does not spend.
Separating the transferable from the merely practical is most of the work
below.

**§6 Buildings names its own sources.** This transcript set has no architecture.

---

## 1. Form and shading

**Shading is a separate multiplicative layer over flat colour, not a property
of the colour.** His finishing move on a character is two clipped layers over
the flat art: a *multiply* layer holding shadows at ~50% opacity, and a *colour
dodge* layer holding a rim light at ~54%. He toggles them and narrates the
difference, without them the character reads bland, with them it reads deep.

This is Frostwind's own invariant arrived at from the opposite direction. He
separates form from colour with layers because he must; the engine separates
them with normals and material ids because it can. That two independent routes
land in the same place is the strongest endorsement in this file for the
`ARCHITECTURE.md` invariant.

**Light direction is picked once and held.** He interrupts himself mid-sentence
choosing a side, "we should probably keep it consistent", and thereafter
every shadow on every character in the sheet falls the same way. Shadow goes on
the side opposite the light; this is stated flatly, not as a choice.

**Shading must not escape the silhouette.** Every shading pass is done under
alpha-lock or a clipping mask, so the shading cannot alter the shape. Form is
decided first and separately; shading only describes the form already fixed.

**Rim light is applied sparingly, only on the rim.** He over-applies it, says so
out loud, and erases back. It is an edge accent, not a second light.

**A cast shadow on the ground goes in almost immediately**, added to raw
silhouettes before any shading, "that right there just gives it a lot more". Its
job is to state the perspective and plant the object on the ground, and it earns
that at the sketch stage rather than the finish stage.

**Two shades carry a design.** His first shading pass uses exactly two values
and he calls it "subtle shading". Detail count comes later; value count stays
small throughout.

### For Frostwind

Outdoor sprites follow the transferable rule: planar faces carry distinct
normals and round forms vary normals across their width; contact shadows plant
short props on the ground. A separate rim term remains a possible craft
extension, not a substitute for form or consistent light direction.

---

## 2. Silhouette before everything

**The silhouette is the load-bearing decision, and it is decided by volume, not
by care.** Stated in all three character videos and hedged nowhere: make 10, 12,
20 silhouettes, not one or two. He shows Shogun Showdown concept sheets with
many variants per character, one shipped.

**A weak silhouette is discarded, never rescued.** "If you're not happy with the
silhouette I just ditch them", it cost ten minutes, and repair costs more than
replacement.

**Proportion is explored as a combinatorial grid.** He enumerates aloud: big
head / small body / small legs; big head / medium body / medium legs; long legs
/ tiny body / smaller head. He draws low-opacity blocks as guidelines and
silhouettes over them. Proportion is a small set of dials swept systematically,
not a thing gotten right by eye.

### For Frostwind

*My inference, not his claim:* the block-guideline sweep is the same structure
as Frostwind's deleted figure models tried to: proportions over the
`PLAYER_H = 26`, `HUMAN_M = 1.70` size axiom. The table makes the sweep
repeatable and lets tests compare declared and drawn silhouettes.
The volume rule has a sharp reading for a procedural engine: generating many
candidates and selecting is his whole method. The engine generates one. There
is no silhouette-rejection step anywhere in the pipeline, every tree
`makeTree` produces is kept. Whether that matters is untested, but it is a
real structural difference and worth naming.
difference and worth naming.

---

## 3. Trees

The most directly applicable transcript, and it is about pine trees in winter.

**The silhouette is built by stamping one repeated unit, not by drawing the
outline.** He draws a single branch, gets it right once, then copies, pastes and
warps it up the trunk. He explicitly contrasts this with hand-drawing the whole
outline and says the stamping approach is both easier and better.
This is `stampDisc`/`grow` in `src/sprite.js`. The engine's recursive
rasteriser is not a compromise standing in for hand-drawing, it is the method
a hand artist chose on purpose, for the same reason.
artist chose on purpose, for the same reason.

**Branches are denser and larger at the bottom, smaller toward the top**, with
the top few hand-placed rather than stamped.

**Droop is the season.** Branches angled down read as winter; angled up read as
summer. He shifts a whole group of branches to test both. This is one scalar,
and it changes what season the tree is in.

*My inference:* this belongs in the `SPECIES` branch-angle distribution rather
than in a species-specific drawing.

**The detail that sells a pine is small dark droop-lines, and it goes in last.**
Short lines in the *darkest* colour hanging off branches, mimicking needles or
cones, applied both to the outer silhouette and to inner branches. He is
unusually emphatic, this is the thing he says he missed for years, and the
reason he made the tutorial.

*Applied:* `droopPass` adds this bounded pendant fringe from
`SPECIES.droop`/`droopLen`; `test/droop.test.mjs` protects its structural
limits.

**Snow occupies the highlight positions.** On a separate layer, and, his
words, "it's basically covering the highlights of the green". Snow is not
additive brightness on top of a finished tree; it takes over the pixels that
were already the lightest rung. Snow can also droop through needles rather than
sitting flat on branches.

*My inference:* `snowPass` accumulates by sky exposure, which will correlate
with the lit rungs but is not the same rule. If snow and highlight ever both
appear on one pixel, the tree gets two competing bright values and flattens.
Worth checking directly.

**Four base colours for a small object**, not strict, sometimes more. He works
dark → light. `RAMP_BASE` ramps run 3–6 rungs; consistent, arrived at
independently.

**Detail budget follows narrative importance.** A statement-piece tree in a hub
or safe area earns time; a tree you run past in a village does not, because
"no one's going to see that or pay attention to it as much as you'd think".

*My inference:* Frostwind places every tree at one detail level. This is an LOD
argument made on attention rather than distance, and it is unscheduled work
rather than a defect.

---

## 4. Animation

**Pose-to-pose, never straight-ahead.** Keyframes first, each pose good enough
to stand alone as a still, inbetweens after. He is blunt that going straight
ahead produces his worst work and that he would never do it.

**Flow and timing are locked before any detail.** He gets whole-limb motion
correct while the art is still rough, moving entire legs rather than pushing
pixels, and only then cleans up. For large sprites he blocks motion with flat
colour shapes first.

**One part drives; everything else follows with lag.** The head is the driver,
described by height only: mid / high / mid / low for an idle, with the extra mid
inserted specifically to kill the jump from high to low and keep motion constant.
Then a strict hierarchy:

- body follows the head **one frame later**
- sword follows the body but lags **more**, because it is heavier
- bag lags **most** and **overshoots**, peaking higher than anything else

This is the substantive finding for whatever replaces the deleted figure. Its
gait tables were hand-tuned per-frame constants. The model underneath them is
two numbers per appendage, *lag* in frames, and *overshoot* amplitude, hanging
off a single driver curve, which is derivable rather than authored. The V1
tables in `reference/v1-figure.md` are the data to fit it against.

**Frame counts.** Idle: 4 frames of driver motion, doubled to 8 to leave room
for secondary motion, run at a slower rate (~75ms). Run: 4 frames, low (very
low), mid, high, mid, doubled to 8, with the head turned slightly across the
second half so the loop does not read as a repeat. The run uses the same
structure as the idle with larger amplitude; it is not a different model.

**Run leg phases:** both legs together and contacting; near leg up while far leg
pushes off; both off the ground; both coming back in.

**Near and far legs get different rungs.** Same-coloured legs are hard to read,
so the far leg is shifted to a darker rung. Readability of overlapping limbs is
a *palette* decision, not a shape decision.

*My inference:* this is cheap and it was never done. Pose controls leg
placement, but if both legs resolve to one material id they will be hard to
separate at 26 px regardless of pose. All three deleted rigs drew both legs in
one material.

**Occlusion is a deliberate budget.** Capes, bags, weapons and VFX are placed
partly to hide limb work he did not finish, stated repeatedly and without
embarrassment, including "no one's going to ever see that". Design for animation
cost at design time: no legs is easier, floating is easier, capes and cords cost
more.

*My inference:* the engine cannot be lazy in the same way, but the inverse holds
— accessories that occlude are cheap to add and buy real slack in the gait
model. Relevant to `makeElder`/`makeMerchant`/`makeBoar`.

**Secondary motion is motion caused by other motion**, capes, bags, hair
reacting to the body's momentum. It goes in after flow is right, never before.

---

## 5. Colour, thinly covered

No video in this set teaches palette construction, so treat this section as
weaker than the rest.

**Pre-made palettes cohere because they were designed together.** He uses Apollo
(by Adam C. Younis) and Resurrect 64, and says colours pulled from one will
generally work with each other, and that colours from his own palettes tend to
work alongside Apollo's.

**He treats a palette as a floor, not a ceiling**, "palettes are generally just
a baseline and you can always branch off if you need to", and adds colours mid
design, then pulls the count back down afterwards.

This is the one place where his practice and Frostwind's directly conflict. The
engine's lock is absolute: `RAMP_BASE` supplies 15 ramps whose 58 rungs
deduplicate to 55 colours; haze and the extra output tone make the global
vocabulary 57. Each scene admits only its declared 40–42 colours, and no content
path accepts an arbitrary hex. He would call that a constraint to break when
needed.

This is not by itself an argument to loosen the lock: the artist serves one
image, while Frostwind promises coherence across generated content. It does
predict where users may push back on a structural palette constraint.

**Small meaningless details read as richness.** He adds "knickknacks", dots,
strings, straps, ribbons, that represent nothing, and notes that stripping them
makes a distinctive character collapse into a generic one. Perceived detail is
density of small high-contrast marks, largely independent of whether they mean
anything. Cheap to generate procedurally; nothing in the pipeline does it.

---

## 6. Buildings

The transcripts behind the rest of this file are about characters and trees, so
this section has a different provenance and is marked as such. Its craft sources
are the Pixel Art Historical Society's cabinet-projection entry, the Envato
isometric house and city-hall walkthroughs, Pixnote's 2:1 guide, and Saint11 and
Derek Yu on planar faces and projected shadow. Its structural sources are the
CGA Shape layering (mass, then structure, then openings, then detail) and Sass's
wood-frame grammar, where the atoms of the grammar are physical members rather
than brush marks. Read the isometric walkthroughs for craft and not for
projection: they teach three faces at 2:1, and Frostwind is cabinet.

**A building shows three faces or it is a rectangle.** Isometric tutorials open
with a cube for a reason. The face count is the first decision and everything
after it is decoration on a shape that either has volume or does not. Frostwind
drew houses with two faces available and used one, and the measured result was a
4.5 m deep house spending zero of its 34 depth rows.

**The front face stays undistorted; depth is halved and sheared.** That is the
definition of cabinet projection, and it is what separates it from isometric.
The front elevation keeps true width and true height, so its course lines stay
horizontal and its openings stay rectangular. `PROJECTION.md` carries the
mapping and `docs/CANON.md` carries the concession.

**The three faces take three values, top lightest and side darkest, and each
face is flat.** Saint11 states it as flat faces mean uniform value, and warns
against pillow-shading a planar surface. Frostwind gets it from geometry rather
than from discipline: `N_TOP`, `N_FRONT` and `N_SIDE` are three normals, one
Lambert value each. Authoring a gradient across a flat wall spends a value the
posterise ladder discards and describes the same form twice.

**A building's value lives in `ao`, and `shade` is a channel nothing reads.**
The atlas packs thickness into channel b for materials 1, 3, 9 and 12, so the
wood branch of the sprite shader resolves `posterise(lit * ao)`. This is the
single most expensive lesson in this chapter: three vernaculars authored their
whole form into `shade` and shipped as flat cutouts, with every pixel test over
them passing, because the tests read the channel that was being written rather
than the one being drawn. `node tools/houses.mjs <kind> <variant>` prints both
spreads side by side for exactly this reason.

**The roof is wider than the walls, and the overhang casts.** Both the Envato
and Pixnote walkthroughs place the roof outline one to two pixels outside the
footprint before anything else, and both darken the row directly beneath it. The
eave is the horizontal the whole elevation is built around. Its shadow on the
wall is what tells the eye the roof is in front of the wall rather than glued to
it.

**Wall texture sits on a fixed row rhythm, and the rhythm is a real member.**
The isometric walkthroughs use blank rows between marked ones and pick wall
heights that are whole multiples of that spacing. Frostwind's spacing is
`LOG_COURSE_M = 0.27`, a carpentry size, so the rhythm is derivable rather than
chosen. A wall that ends on a half course is either wrong or has declared a
plate.

**An opening is recessed, never a hole.** A door or window is pushed back one to
two pixels with a darker jamb on the light side. Glazing is a light rather than
an absence: painted dark it reads as a doorway, and painted at the top of the
wall's own ramp it becomes the warmest thing on the building, which is what a lit
house at dusk is.

**Openings sit on a bay rhythm.** Window columns come from the bay count over
the wall length. Randomly placed columns read as damage.

**The figure is the yardstick.** Every building walkthrough in the reading list
sizes doors and storeys against the character rather than against the canvas.
Frostwind already refuses the opposite fashion: `docs/CANON.md` puts buildings at
1.0× life while trees draw at 0.16 to 0.20×, so a door that clears `PLAYER_H` is
a law and not a preference.

### For Frostwind

The layering these sources share maps onto emitters rather than onto a grammar
engine. `src/construct.js` owns the constructive units, a vernacular owns its
metre table and its mass, and neither owns a colour. This closes the asymmetry
`docs/DECISIONS.md` named: plants are grown from a grammar into materials, while
buildings were placed, dimensioned, and then hand-painted.

*My inference, not a claim any of these sources makes:* the reason the flat
houses looked flat while the ruins looked solid is not draughtsmanship. Both were
drawn by the same kind of `put` loop by the same authors. `makePillar` emits a
side face and a top face and the houses emitted neither, so the ruins had a
volume to shade and the houses had a rectangle.

The silhouette rule from §2 applies here and is still unpaid. Mass variants
(bay count, eave depth, roof rise) are exactly the combinatorial grid that
section describes, and nothing generates or rejects them yet.

---

## 7. What does not transfer

Roughly half of each transcript is Aseprite and Pixquare technique, contour
tool, alpha lock, magic wand, onion skin, layer splitting, extend-cell, colour
coding, plus workflow advice specific to freelancing: quoting animation
difficulty to clients by the hour, starting with the attack animation so a bad
result fails cheaply, sleeping on a combo before animating it, flattening and
flipping a copy at reduced opacity to fake a reflection for social media.

None of it bears on a procedural pipeline. It is the majority of the runtime,
which is worth knowing before anyone invests in more transcripts from this
channel: the yield is real but thin per minute.

---

## Applied and open

| Finding | Current state |
|---|---|
| dark bough underside | `underPlate` already supplied it |
| seasonal branch angle | `droopMin` / `droopMax` are species data |
| pendant dark fringe | implemented by `droopPass`, structurally bounded by `test/droop.test.mjs` |
| scale-specific tree construction | `drawSmallConifer` replaces the recursive grammar below its legibility floor |
| near/far limb separation | implemented with value and depth differences |
| lag + overshoot per appendage | **open**; the rigs that would have carried it are deleted |
| generate many, reject weak silhouettes | proven only narrowly by Pond Court composition selection |
| separate rim term | optional/open; normals and shadows are already present |
| three faces on a building | `cabinetBox` emits front, top and side; asserted in `test/construct.test.mjs` |
| course rhythm from a real member | `courseWall` divides the wall by `LOG_COURSE_M` |
| eave overhang and its cast | `roofPlane` carries both; the overhang floor is 2 px |
| recessed opening, glazing as light | `opening` insets the jamb and writes material `6` |
| mass variants scored and selected | **open**; buildings still generate exactly one silhouette |

The figure pass order is a protocol, not a reorderable list: passes communicate
through existing material ids, and later passes test exact ids. Any driver-curve
refactor must remain under `test/folk-contract.test.mjs` and
`test/folk-raster.test.mjs`.

The figure contact ellipse was also removed. It was a smooth analytic curve and
a redundant second shadow under figures already casting projected silhouettes.
Short props retain stepped, Bayer-dithered contacts. This defect was found by
looking, not by transcript analysis: provenance and tests do not replace visual
review.

## Fringe density measures thin

`tools/trees.mjs` prints a sprite as material ids without a build, browser or
atlas, and reports what fraction of the underside is pendant dark. Every
structural test on `droopPass` checks determinism, opt-in, bounds and
sparsity. None reads whether a fringe looks like needles or like a mop.

| tier | height | underside | pendant dark |
|---|---|---|---|
| 0 | 19px | 13px | 0%, below the 34px gate, correct |
| 2 | 38px | 53px | 0% |
| 4 | 75px | 110px | 5% (5 strokes) |
| 6 | 147px | 329px | 4% (13 strokes) |
Birch has no `droop` and measures 0%, so the pass fires only where intended.
Five strokes on a 75 px spruce is thinner than the source, which puts them on
nearly every bough. Two rules compound: the `run>=3` underside test, and a
laden conifer burying most undersides in snow.
conifer burying most undersides in snow.

`droop` stays `0.16`. Raising it changes golden frames, so it is a visual
decision. The measurement is recorded rather than tuned silently.

## Conditional passes take their own generator

A pass gated on a species flag must draw from its own generator, seeded from
values the caller already drew. `droopPass` once consumed the shared per-tree
RNG and re-rolled later decisions, including frames with no trees. "Off by
default" is only off when nothing downstream shares the stream.
