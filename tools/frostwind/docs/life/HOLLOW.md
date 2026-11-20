# Hollow life dossier

No sun, so no body here has a day: each activity curve is one level. Three
fields carry the animals. `fungus`: damp floor a glowcap fruits on, off
`HABITAT.glowcap`. `crystal`: nearness to a geode place. `shallowPrey`: the
swamp's field, in a pool's margin. Rock is solid: a life site in limestone
suits nothing.

`docs/HOLLOW.md` owns the cave's physics. `docs/CANON.md` carries the three
invented laws, each with its source and boundary.

## The pale deer

The earth folk's herd, on the earth herd law. Body, gaits and speeds are the
roe deer's (`src/body-deer.js`), drawn by `makePaleDeer`.

Claimed: a pale coat on the `skin` ramp, a rack of the cave's phosphor crystal
in `amethyst`, three or four animals that graze the glowcap troops of the hall
and step back from a walker at 2.9 m.

Refused: milk, meat, ownership marks, herd hierarchy, sex and the antler
cycle, the crystal's mineralogy, population density. The coat does not glow
and the rack lights no floor.

## The olm

*Proteus anguinus*, a real animal at life size (`src/olm.js`): 0.30 m, five
pixels, no scale invented. Claimed: an unpigmented body on the `skin` ramp,
one pink pixel of gill, an eel's wave, one animal to a pool in water 0.1 to
0.9 m deep at its margin, flight from a walker at 1.2 m.

Refused: its range. The olm lives in the Dinaric karst and under no boreal
forest. Also refused: neoteny and breeding, lifespan, the stone it rests
under, population density. Its speeds are authored.

## The drift lantern

A fictional animal on the glowworm's body, on the still float law
(`src/driftlantern.js`). The bell is the larva at five times life, the
smallest whole factor at which it draws three pixels. Snares keep their real
length.

Claimed: a teal bell with a white lamp, two threads, a pulse once a second,
0.15 m/s, two or three animals to a room. At rest it sinks until its long
thread touches the floor.

Refused: flight, a sting, predation on people, reproduction, the lifting gas,
population density. Its pulse is its whole thrust, so moving air carries it
off. No code moves it with a spell's wind yet.

## The carbuncle

A fictional animal from a chronicle, on the brow stone law
(`src/carbuncle.js`). The chronicle gives no body: body, bound and speeds are
the brown hare's (`src/hare.js`).

Claimed: a `geodeRock` coat, one `amethyst` pixel on the brow, one animal in
the geode chamber and one at the Heart. It sits tight by a crystal, sits up
when a walker is 6.3 m off, then goes.

Refused: the stone as treasure, luck or wealth, the chronicle's species, a
lit floor under the stone, reproduction, population density.

## People

The earth folk: four small makers, four houses in the hall. Culture package
`hollow-earth-folk`. Fiction built on the accounts below, a claim about none
of their traditions.

Sources. The Finnic maahiset live under the ground a life that mirrors the
one above (Britannica, "maa-alused"). The Sámi earth folk keep farms and
cattle there, and a guest warns before pouring water, asks before building
and does not eat their food (Centre for Northern Peoples 2023, "Hálddit /
gufhtarat"; UHI Institute for Northern Studies 2016, "Don't mention the
tail"). Huldrefolk wear blue or grey (UHI 2016). Cornish knockers stand about
0.6 m, with a large head and a miner's dress, and mine kobolds stand 2 to 3 ft
with a round light at the chest (Britten 1884, via Wikipedia, "Kobold").
Dvergar live in stones (Ynglingatal; Motz 1977) and the aos sí in hollow
hills.

Why here. No sun reaches the hall, so every practice keeps a light or what a
light grows: the fairy ring, the lamp posts, the cut crystal, the herd.

Stature. The medium wins over the sources' 0.6 m: `src/people.js` clamps the
cast at 18 px, 1.18 m. Three stand 18 px, the tender 19 px, 1.24 m
(`src/body-folk.js`). A 5 px head on a 7 px body keeps the knocker's large
head.

Dress. Blue or grey, one ochre band each, every head covered against the
drip. `trunk` is the grey fleece and `gourWater` the blue, both borrowed from
the scene's list, so the cast adds `folkDye` only. The pointed hood (`peak`)
is authored: the owner's read of small makers. Ochre is the one dye: an iron
earth is a pigment a cave has.

| Row | Work | Carries | Home |
| --- | --- | --- | --- |
| `hollowTender`, ring tender | walks the fairy ring from outside, draws water at the Mirror, keeps the cap store | basket, apron, grey, peak | house 1 |
| `hollowLamplighter`, lamp wright | takes light at the Heart and walks the lamp posts | lamp on a pole, mantle, grey, peak | house 2 |
| `hollowCutter`, crystal cutter | chooses a stone at the Heart and cuts it at the bench | mallet, blue, peak | house 3 |
| `hollowKeeper`, herd keeper | counts the pale deer and waters them | lamp on the coat, blue, hood | house 4 |

The four rest in turn, six hours each, so three work at every hour. The
schedule reads the session clock's minute and no sun or latitude.

The house (`src/hollow-village.js`, `capHouse`). A round limestone room under
the cap of a luminous agaric, drawn by the agaric's rungs: gills brightest,
flesh on the middle rung, rim darker. The makers grow their roof: invented.
Three variants: a 2.35 m room, a 2.75 m room with a chimney under its own
cap, a 2.00 m room with a second cap beside it. The ridge stands 2.1 to
2.2 m: a 1.44 m wall under a 0.66 to 0.80 m dome. The door is 1.18 m, one
maker tall, and the traveller does not fit it. One window, 0.2 m, lit. Four
slots stand in an arc on the hall's north-east side, 63 px or more from the
trail, and resolve at no relaxation on seeds 7, 1337 and 20260727.

Furniture. Three lamp posts beside the trail: a 1.45 m calcite post under a
cut amethyst. One cutting bench, 0.92 m wide, with the stone on it.

Refused: kinship, magic, trade, interiors, and any rule on the traveller. The
three guest rules are a source and no code enforces them. The roofs, windows
and lamp posts light no floor. Sámi sacred terms label nothing here.
