# Changelog

The package follows semantic versioning. Each release names the OpenAPPL version of its
corpus (`openappl.version` in `package.json`).

## 0.2.1

- The design flow is stated for what it is: strongly recommended for the quality of the
  blueprint, not part of the OpenAPPL standard (which requires only the blueprint). The design
  skill says so once and starts the design; on an explicit request to skip it, it names the
  quality risk once and hands over to blueprint authoring, which then works from the request.
  The README says the same.
- The design skill names every supported option of a choice question in its text (every
  shipped provider brand, for example), not only the four the choice UI shows as buttons; the
  others are taken from the free-text answer.

## 0.2.0

- The command is `mindset`; `mind-set` still works as an alias (and keeps
  `npx @mindbricks/mind-set ...` working). Every message, skill and guide names `mindset`.
- `mindset design-check` reads a draft with CRLF line ends (written on Windows, or checked out
  there) exactly like an LF draft; before, a closed interview record read as an empty
  Coverage Ledger.

## 0.1.0 (on npm since 2026-11-21)

The npm release of 0.1.0 also carries everything below its first GitHub release:


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

### First GitHub release (2026-11-14)

Published as `@mindbricks/mind-set` (the command was `mind-set`).

- `mind-set install | update | uninstall | doctor` for Claude Code (`~/.claude/skills`) and
  Codex (`~/.agents/skills`).
- `mind-set validate`: structural check of a blueprint against `openappl.json`.
- Four skills: `openappl-blueprint-design`, `openappl-blueprint-authoring`,
  `openappl-blueprint-contract`, `openappl-blueprint-review`.
- The corpus: design and authoring procedures, the OpenAPPL specification (Parts 1 to 3),
  the `contract`, `review` and `validate` guides, the schema and three example blueprints.
