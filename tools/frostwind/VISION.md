# Frostwind: Vision

> **Frostwind is a nature-grounded world compiler for pixel-art game worlds.
> Real physics, imaginary worlds.**

A creator describes a world at the level of meaning. Frostwind resolves that
intent into explicit models, generates valid possibilities, selects among them,
and compiles the result into deterministic, explainable pixel art.

## The problem

An LLM cannot see. Writing a 2D world, it guesses at every question a human
artist answers by looking. How big is a deer standing next to a person. Does a
head read at this height. How many rungs does this ramp need. How far does a
foot travel in one frame. What colour is snow in shadow at 62 degrees north.

It answers each question plausibly and in isolation. The result is a world where
every individual decision is defensible and nothing agrees with anything. The
person is 32 px in one file and 48 px in another. The palette claims sixteen
colours and holds two hundred. Shadows fall three directions. The walk slides
because nobody compared stride length to travel distance. The second scene shares
no light with the first.

The LLM catches none of it, because it never sees the frame.

## The derivation layer

Frostwind supplies four things between intent and pixels:

| Layer | What it settles |
|---|---|
| **Physics and nature** | Real sizes, a real sun at a real latitude, real water optics, real light attenuation. "How big is a roe deer" becomes division: 26 px is 1.70 m, the buck is 1.18 m, he is 20 px. |
| **Craft** | Where physics has no opinion, the medium does. A head needs enough rows to read; depths stay even under cabinet projection; a ramp cannot hold a rung nothing reaches. |
| **Declared taste** | Where neither has an answer, the choice is made once, labelled a choice, and applied everywhere. |
| **Validation** | Tests hold the first three true as the world outgrows what anyone can keep in their head. |

The pairing this enables: an LLM will give you the published zoometrics of a roe
deer instantly and with citations, and will not keep four hundred assets agreeing
with each other. Frostwind is weak at the first and strong at the second.

> **The model is the guardrail. The LLM writes tables, not pixels.**

An LLM may research a domain, interpret intent, and propose schema-checked
parameters: a species grammar, material ramp, body row, place program, or
art-direction profile. Generated data passes through the same growth, projection,
lighting, palette, selection, and test machinery as hand-authored data. Runtime
LLM access is not required. Deterministic seeds, explicit authorities, measurable
consequences, and narrow schemas keep results reproducible, editable, and
explainable.

## Scope

This is a physically grounded world model, not a learned predictive model. It is
not a general game engine or a runtime prompt-to-image system. The Frostwind
world is the reference implementation and test bed; dialogue, quests, saves,
and other game layers may use it but do not define it.

The worlds may be imaginary. The derivation stays real. The meadow's
dream-machines are the proof: invented creatures on authored physics, compiled
through the same scale, sun and palette machinery as the birches.

## Store reasons, not results

A tree is a growth strategy responding to climate and competition. A settlement
is shelter, construction, social space, and human proportion. A person is anatomy,
movement, clothing, tools, and visual identity. A sprite stores material,
normal, occlusion, and thickness, never colour. Terrain is queried from analytic
fields rather than stored as a painted map.

Shared causes make the world cohere:

- scale agrees across people, built forms, animals, and terrain;
- materials agree with light;
- species agree with climate and habitat;
- culture responds to nature without being determined by it;
- art direction gives valid alternatives one visual intention.

The operating rule is:

> **Nothing is drawn that can be derived.**
> **Nothing is chosen that can be measured.**
> **Nothing is claimed that cannot be checked.**

Derive, measure, assert. “It looks right” is a hypothesis. Where no law exists,
choose deliberately, name the choice as taste, and apply it consistently.

## The world standard library

| Library | Executable knowledge |
|---|---|
| **Nature** | physics, climate, light, water, geology, soil, terrain, disturbance, and decay |
| **Life** | growth, morphology, materials, habitat, competition, movement, ecology, succession, and inheritance |
| **Culture** | settlement, outdoor architecture, agriculture, tools, clothing, food, ornament, ritual, exchange, history, and memory |
| **Craft** | scale, projection, the integer grid, silhouette, value grouping, palette, lighting, legibility floors, controlled exaggeration, animation, and pixel clustering |

Nature supplies causes. Life occupies and changes those conditions. Culture
turns constraints into meaning and admits many answers to the same environment.
Craft translates reality into the medium rather than copying it.

**Beauty stays a claim about selection.** Frostwind does not know what is
beautiful. It narrows the field to coherent candidates and remembers a choice
once made.
Pond Court generates sites, rejects the ones that fail measurement, and selects
from what survives ([src/pond-court.js](src/pond-court.js)); human taste then
operates on a short list of legal options rather than an infinite list of
arbitrary ones. That is the whole claim, and it rests on one place compiler.
Species, figures and settlements do not yet share that interface.

Every addition should compound: a new species, body, material, place program, or
composition rule should make multiple future worlds easier to express.

## Two canons

Reality is not the only authority. Pixel art has equally binding limits:

| Canon | Authority | Example |
|---|---|---|
| **Laws of the world** | physics, biology, anatomy, construction, culture | area conservation at a branch split; Beer–Lambert attenuation; human-scale built forms |
| **Laws of the medium** | legibility, integer rows, projection, palette, composition | a head must occupy enough rows to read; projection ratios must preserve the grid; a ramp cannot contain unreachable rungs |

When they conflict, the medium wins **and the deviation is recorded**. A real
adult is about 7.5 heads tall, but a 26-row figure cannot describe a 3.5-row
head, so the reference figure uses a legibility-derived proportion. Small
built forms and anatomical details likewise carry explicit floors. The
requirement is to name which canon chose the number. Tuning by eye and calling
it a medium law fails that requirement.

The current law register, including deliberately refused
folklore, is [docs/CANON.md](docs/CANON.md).

## Authored and procedural work

Procedural systems generate texture, variation, and valid alternatives. Authors
place structure, declare meaning, and preserve exceptions. Endless generation
makes the terrain and ecology one walks through; authored choices establish the
places one walks to.

The boundary is explicit rather than ideological:

- derive dimensions, materials, affordances, and physical consequences where a
  model exists;
- generate candidates where variation is valuable;
- select composition deliberately;
- author culture, landmarks, identity, and exceptions that no natural law can
  choose;
- record where a builder is still a drawing rather than claiming a general
  model.

## Worlds people make

The pairing this document states — the LLM writes tables, the model is the
guardrail — was introduced as a workflow for this repository. It is also the
product direction: the same contract lets a creator who is not a programmer
describe a world and receive a coherent one.

The intended loop is the existing pipeline with a conversation in front of it:

1. a creator states intent in ordinary language — a building, a resident and
   an unfinished project, a species, a biome;
2. an LLM proposes schema-checked tables, never pixels;
3. validators and test gates reject with specific reasons, and the LLM retries
   against those reasons;
4. accepted tables enter the deterministic world compiler and use its growth,
   projection, lighting, palette, selection, and test authorities.

Nothing about this loosens the operating rule. Creator content cannot be
off-palette, off-scale, or lit from a direction the sun disagrees with,
because content never touches pixels — only the compiler does. This stays
short of a runtime prompt-to-image system: the proposal is data, the review is
mechanical, and the compile is deterministic.

Distribution follows the same discipline. A world is shared as a seed plus
table sets, not as state: equal tables and seed compile the same world on
every machine, so visiting another creator's town is a transfer of data, not a
connection to a server simulation. Other travellers appear as consequences —
trails, prints, finished structures — through the disturbance ledger, not as
live bodies.

The boundary is declared rather than hidden: a prompt can reach anything the
schemas express, and no table can summon a capability the compilers lack. A
fox is a table because the quadruped rig exists; a bird waits for a wing rig.
Each new compiler permanently widens what every future prompt can make, which
is this document's compounding rule applied to creators.

## Method limits

Grounding offers no leverage where there is no law. Trees benefit from botany;
water from optics; buildings from construction and use. A dream world has no
external physical authority unless the project authors one. Build such worlds
last and treat them as deliberate departures from a known baseline.

The method also cannot replace looking. Tests can protect scale, invariants,
palette membership, and the laws a rendered frame must obey. They cannot prove
that a composition is beautiful. Candidate generation and measurable rejection
narrow the search, while visual review remains authoritative for art-direction
choices.

## North Star

> **Nature provides the laws.**  
> **Life provides growth and interaction.**  
> **Culture provides meaning.**  
> **Craft provides the language.**  
> **Beauty provides direction.**  
> **Frostwind compiles the world.**
