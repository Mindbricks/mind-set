# Changelog

The package follows semantic versioning. Each release names the OpenAPPL version of its
corpus (`openappl.version` in `package.json`).

## 0.1.0

First release.

- `mind-set install | update | uninstall | doctor` for Claude Code (`~/.claude/skills`) and
  Codex (`~/.agents/skills`).
- `mind-set validate`: structural check of a blueprint against `openappl.json`.
- Four skills: `openappl-blueprint-design`, `openappl-blueprint-authoring`,
  `openappl-blueprint-contract`, `openappl-blueprint-review`.
- The corpus: design and authoring procedures, the OpenAPPL specification (Parts 1 to 3),
  the `contract`, `review` and `validate` guides, the schema and three example blueprints.
