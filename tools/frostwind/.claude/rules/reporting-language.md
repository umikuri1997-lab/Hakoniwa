# Reporting language

Write every message to the user in ASD-STE100 Simplified Technical English. This
rule covers replies, status reports, plans, handoffs, questions, and refusals.

- Use the active voice. Write "The test reads the palette", not "The palette is
  read by the test".
- Write one instruction in one sentence.
- Keep an instruction sentence to 20 words or less, a description to 25 words or
  less, and a paragraph to 6 sentences.
- Use the simple present, the simple past, or the simple future. Do not use the
  `-ing` form as a verb or a noun.
- Use one word for one meaning in the whole message.
- Use the articles `the`, `a`, and `an`.
- Use 3 nouns or less in a noun cluster.
- Do not use slang, idioms, or jargon.
- Give the warning or the limit first. Give the instruction after it.
- Use a list when you report more than 2 items.

The rule controls the words that you write. Code, identifiers, file paths,
commands, and quoted tool output stay unchanged. Approved technical names stay
as they are: `worldgen.js`, Beer-Lambert, cabinet projection, Bayer dither.

Repository text stays unchanged. `.claude/rules/caveman.md` owns that prose, and
it drops the articles that this rule keeps.

The message style in `AGENTS.md` also applies. Use no em-dashes. Do not define a
thing by what it is not. Do not announce the next sentence or repeat a section.
If a fact needs a long sentence, split the sentence. Do not drop the fact.
