---
paths:
  - "**/*.md"
  - "src/**/*.js"
  - "test/**/*.mjs"
  - "tools/*.mjs"
  - "build.mjs"
---

# Prose budget

Adapted from https://github.com/juliusbrussee/caveman (MIT).

`tools/context-stats.mjs` is the authority. Run `npm run test:context`. Total
prose stays above the target band, so every edit here moves a measured number.

## Delete first

Compression caps at 10%, the article share. Deletion is the lever.

1. Narrative history. "It used to be summed", "there was a second one until this
   commit", "both are deleted". Git holds it. State the law in the present.
2. A second copy of a law that `docs/CANON.md`, a routed spec, or a module
   already owns. A comment retelling a doc's essay is the third copy.
3. A comment that restates the code.
4. A closing summary and a sentence that announces the next sentence.

A measured failure is not history. Keep the numbers, drop the tense: "summing
makes a 0.30 m bed measure 0.41 m" beats "these terms used to be summed, which
quietly made every floor relative".

## Then compress

Drop articles, filler (`just`, `simply`, `actually`), and hedges. Use
`[thing] [value] [reason]`. Fragments are correct.

Keep exact: identifiers, numbers, units, negation (`not`, `no`, `only`,
`except`), citation names, and any warning about data loss or security.

## Method

Read the file. Rewrite by hand, with exact-match edits. Never reflow prose with
a script. `npm run codehash` proves that a comment pass left the code identical.

An always-loaded word costs every task. A `docs/` word costs one route. Cut
`AGENTS.md` and the rules first.
