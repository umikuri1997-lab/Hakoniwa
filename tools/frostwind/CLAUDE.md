@AGENTS.md

@.claude/rules/cost-control.md

@.claude/rules/reporting-language.md

# Claude Code

The two rules above have no `paths:`, so they load every session and survive
compaction. Every other rule in `.claude/rules/` is path-scoped and loads when
you read a matching file.

`.claude/rules/*.md` is the one source for both loaders. After you edit a rule,
run `npm run rules` to write the Cursor mirror.

Skills in `.claude/skills/`: `add-world` (a new world, as plan rows),
`add-character` (a body or item) and `frame-check` (capture, measure and
compare a frame).
