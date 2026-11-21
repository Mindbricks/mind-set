# Changelog

The package follows semantic versioning. Each release names the OpenAPPL version of its
corpus (`openappl.version` in `package.json`).

## Unreleased

- `mind-set design-check <docName>`: structural check of a design document (name, required
  sections, service roster and event table, interview Status and Coverage Ledger, test-plan
  target) against the corpus design pipeline. Exit 0 clean, 2 findings.
- `mind-set spec-coverage [<blueprint.json>]`: every design document produced its artifact in
  the blueprint, or carries a recorded decline (`--declare`). Exit 0 covered, 1 a gap.
- `validate`, `design-check` and `spec-coverage` warn about secret-shaped literals
  (`secret-literal`): a real password or key never belongs in a blueprint.
- The design, authoring and review skills run the two new checks and say what they cannot
  check; the authoring skill and the review checklist say how the super-admin password is
  set (`$ENV:<NAME>` or a placeholder changed on first login).

- New guides: project settings and providers, delivery discipline (the modules a delivery
  loses, whole-project checks, the spec-coverage gate, the warnings ledger), changing a
  delivered blueprint, secrets in a blueprint (`$ENV:NAME` and `ENTER_CREDENTIAL`), the
  service plan, and the rules the validator enforces.
- The contract guide gains the frontend rules (never mock, never call the BFF, never make a
  user type a tenant codename); the review checklist gains the whole-project checks and the
  shapes a compiler refuses to build.
- The corpus now has one guide page per action (with behaviour, limits and errors), the 19
  cookbook recipes and the provider behaviour rules (`guides/providers/`), and the ontology
  overview explains the six levels.
- `procedures/pitfalls.md` no longer ships sections 1 to 4, which described one compiler's
  running system rather than the language.
- The build refuses a vendor or product name anywhere in the package outside the pages that
  exist to name them.

## 0.1.0

First release, published as `@mindbricks/mind-set` (the command is `mind-set`).

- `mind-set install | update | uninstall | doctor` for Claude Code (`~/.claude/skills`) and
  Codex (`~/.agents/skills`).
- `mind-set validate`: structural check of a blueprint against `openappl.json`.
- Four skills: `openappl-blueprint-design`, `openappl-blueprint-authoring`,
  `openappl-blueprint-contract`, `openappl-blueprint-review`.
- The corpus: design and authoring procedures, the OpenAPPL specification (Parts 1 to 3),
  the `contract`, `review` and `validate` guides, the schema and three example blueprints.
