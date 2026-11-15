# Writer guide: user-stories

The project's user stories: every capability the product must give each kind
of user, with a stable id per story. Use cases reference these ids, and the
spec writers trace their APIs back to them.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-description-report`.
- Supplementary: `interview-record` (the settled facts and the Coverage
  Ledger; use it for detail the report condensed away).
- Canon: `procedures/design/canon/roles.md`, `procedures/design/canon/platform-owned.md`.

This document is written in parallel with `prd` and `frontend-spec`: do not
assume either exists.

## Required sections

This document has NO fixed H2 sections: its H2 headings are the project's
user types, which differ per project, so `pipeline.json` lists
`requiredSections: []` for it.

- (none)

## Document skeleton

```markdown
# User Stories

## <User type>
### <Category>
- **US01** - As a <user>, I want to <action> so that <goal>.
- **US02** - ...
```

## Rules

- Be exhaustive - dozens of stories is normal.
- Group by user type, then by capability category.
- Give every story a stable id `US01`, `US02`, ... in document order. Later
  documents reference these ids, so they must be present and unique.
- User types follow the roles canon: a persona that gains no differential
  access is the built-in user with a data fact, not a separate role - it may
  still be its own H2 when its stories differ, but it is not presented as a
  role.
- Capability-level behavior only (data, actions, rules) - no UI or visual
  stories. When the designer wants a web application, its screens come from
  the backend design plus the frontend specification, so a story never
  describes a screen, a layout or a style.
- Ground every story in the report (and the interview record); do not invent
  unrelated scope. Apply the platform-owned canon.

## Completeness check

- Every user type and every core flow of the report has stories.
- Every id is unique and in order; no story lacks an id.
- No story describes a screen or a platform-owned mechanism as a requirement.

## Output

Write the document to `design/user-stories.md` (writer contract section 4).
