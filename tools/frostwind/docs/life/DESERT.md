# Desert life dossier

The desert is one shortage seen from several animals. Depth to groundwater,
dune-surface mobility, shade, and the single pool are the shared measurable
authorities for plants, animals, traversal and settlement, the way hydrology is
in the swamp.

Four resource fields carry it: `desertShade`, `openWater`, `looseSand` and
`desertForage`. Three of them are the same scarcity from different animals.

## Fennec fox

The exact taxon is *Vulpes zerda*. The ear-to-body ratio is the largest of any
canid and the ears are radiators: surface area is how a 1.5 kg animal sheds heat
without spending water on it.

It is crepuscular, and the world is pinned at noon. The activity curve says so
rather than being flattened to keep something on screen, so what the compiler
puts in front of you at midday is one lying in shade. Den structure, pair bonds
and population density are not claimed; a burrow mouth is a trace, not a
described home.

## Sandgrouse

The raster does not support a species, so this is the genus-level guild
*Pterocles*. The behaviour it is here for is measured and specific: adults soak
their belly feathers at open water and fly the water back to chicks tens of
kilometres away, so a sandgrouse arrives at a pool at the same hour every
morning, in numbers, and leaves.

That timetable is the activity curve — a spike at the water and near zero after
it — and it makes this the one animal in the project whose day is a commute.
Arrival together is a resource aggregation and not a claim about a flock's
social structure. Flight is not drawn and is not claimed; neither is the
provisioning range or a colony.

## Horned viper

*Cerastes cerastes*. Sidewinding is a gait for a surface that will not push
back: the animal throws loops of itself forward, holds only two short static
contacts, and travels diagonally to the way it is pointing. What it leaves is a
ladder of separate J-shaped marks rather than a continuous furrow, and that
track is the thing you actually see in a desert.

`buried` is both its rest state and its whole response to disturbance, which is
what a viper does all day. Venom, strike and prey selection are not claimed.

## The worm

Fictional, and the only fictional animal in this world. `PROVENANCE.fictional`
on the profile, one invented law stated and bounded in `src/worm.js`, and a row
in `docs/CANON.md` beside the meadow machines' curvature-heart. It is a
travelling deformation of the ground rather than a body, and the reason it
matters to everything else here is what it cannot do: gravel does not fluidise,
so the firm ground is ground it cannot reach.

## The shade guest

Fictional, the second fictional animal here. The body plan is a camel spider's
(Solifugae, *Galeodes arabs*, 70 mm): forward jaws near a third of the body,
raised pedipalps, the hind legs longest. One invented law, the gallery moult,
makes it ten times that length where a dug gallery opens. `src/shadeguest.js`
states the law and its boundary; `docs/CANON.md` carries the row.

What the law leaves alone carries the animal. The order's name means "those
that flee the sun", so its home is `desertShade` and at the pinned noon it lies
under a crown. A walker at 89.45 degrees of sun casts 1.6 cm of shadow, so a
person is shade only at the heel: it comes out, tastes the air with one raised
pedipalp, and follows at 5 px until its sun limit turns it back at 196 px. The
cloth it shares with nothing else in the desert is the `accent` ramp.

Venom, silk, predation on people, reproduction and the gallery's own ecology
are not claimed.

## Sub-sprite guilds and people

`desertForage` is the seed and insect prey the compiler draws no body for. Its
role has to be visible through what eats it, through drawdown response, or
through diagnostics — the rule the swamp's aquatic prey already sets.

The oasis gardener and the dune drover are separate authored residents in two
separate culture packages, not one community and not presumed kin. Water
measured in time, shade as property, the remembered road and salt for dates are
fictional cultural choices. Heat, one water point, moving ground and blown sand
constrain them without selecting them.

The garden hold has two more residents and a third practice. Gallery keeping
is a real one (foggara, qanat): a graded tunnel brings sweet groundwater to the
gardens before it reaches the evaporite ring, and silt closes it unless it is
walked each year. The gallery digger wears bleached cotton, a felt dome and
bare shins, each for the tunnel, and carries the lamp that tests its air. The
hour keeper reads a water turn off the staff he carries. The gallery itself is
not drawn: no shaft, no spoil ring, no underground. Guild, kinship, gallery
length and water law are not claimed.

Architecture and dune detail remain in `docs/DESERT.md`. Encoded laws and their
citations are in `docs/CANON.md`.
