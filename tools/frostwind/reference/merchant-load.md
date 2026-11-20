# The merchant's load

The one thing kept from the human cast. Everything else in `src/character.js`,
`src/retro-figure*.js`, `src/person*.js`, `src/body.js` and `src/figure.js` was
deleted; this survived because it works and because nothing about it depends on
having solved a body.

Geometry is in [merchant-load.js](merchant-load.js). Pixel dumps for all three
facings, every walk frame, materials and values, are in
[merchant-load.txt](merchant-load.txt). A real GPU frame with the merchant third
from the left is at [captures/retro-cast.png](captures/retro-cast.png).

## What the tables cannot carry

**The load did not bounce.** This is the whole trick, and it is invisible in the
outline tables.

`finishMerchant` had two row resolvers over the same source rows:

```js
const R  = (r) => sp.ay + (source(r) + P.bodySink - P.M.rows.contact);
const RL = (r) => sp.ay + (source(r)              - P.M.rows.contact);
```

`R` followed the figure's vertical sink through the gait cycle. `RL` was pinned
to the world contact row and ignored the sink entirely.

The pack, lid, bedroll, strap, wares, rope and poles were all drawn through
`RL`. The hat, the face and the one grip strap at row 13 were drawn through `R`.

So across a walk cycle the man rose and fell underneath a load that stayed at a
fixed height. That is what carried weight looks like: a heavy thing does not
accelerate with the body carrying it, and the relative motion between the two is
the only cue the viewer gets at this size. Anchor the load to the body and it
becomes a costume.

The single `R(13)` strap is the exception that makes the rest legible. Without
one point of contact tracking the body, the load reads as floating rather than
as carried. One pixel, on the named core grip band, so that when `prepare`
shifted the rigid core left the carried-load topology survived.

## The other durable decisions

**Widest low.** `PACK_SIDE` peaks at 12 on rows 12 and 13 of 18, so the mass
sits over the hips. Peak it at the shoulders and it reads as a hunchback.

**Authored per row, never interpolated.** The original comment: "pack outline is
authored per row; interpolation erases its readable inventory masses." The
lumps are the inventory. A spline through those numbers is a sack.

**One hole in the silhouette.** The rope loop is two strands with a gap, and it
is the only break in an otherwise solid mass. At this size a silhouette with one
hole in it reads as an assembly of objects; a solid one reads as a blob.

**Sixteen accent pixels, and no more.** The wares boxes plus the two pole beads
were the only saturated colour on him. That scarcity is why they read as
valuables.

**The poles are the identifier.** Nothing else in this world carries anything
above its own head, so from across a frame the two thin uprights with bright
tips said "merchant" before any other feature resolved. Their lean is applied at
0.2 per step for the first half of the climb and 0.8 for the second, so they
leave the load near-vertical and splay near the tip: lashed on and flexing,
rather than a straight diagonal, which reads as a spear.

**The face is snow material.** Material 2 is the only ramp lighter than the
ground. A pale patch is only a face if it is paler than everything around it.

**The brim is two rows.** One row fifteen pixels wide is a rod, and a rod
pointing forward out of a dark block is a gun barrel. That is what one row drew.

## What it needs from a future figure

Very little, which is the point.

- A centre line `cx` and a canvas padded 12 px left, right and top.
- A crown row and a contact row, so `RL` can pin to the ground and `R` can
  follow the body.
- A body sink per frame, if the load is to keep not bouncing. If the next figure
  has no vertical sink in its walk, the load is simply drawn at fixed rows and
  the effect is free.
- Materials 1 (cloth, value in `ao`), 2 (snow) and 6 (accent).

It does not need joints, limb angles, proportions, or a solved pose.
