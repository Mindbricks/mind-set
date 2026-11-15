# Writer guide: use-cases

The project's use cases: the significant flows the stories and the PRD imply,
written as system behavior, each tied to the user-story ids it satisfies. The
spec writers read the flows to decide APIs, events and sagas.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-description-report`, `user-stories`, `prd` (use cases are
  written after the stories so they can reference their ids).
- Supplementary: `interview-record` (the end-to-end walkthroughs and the
  acceptance expectations the designer stated).
- Canon: `procedures/design/canon/roles.md`, `procedures/design/canon/platform-owned.md`.

## Required sections

This document has NO fixed H2 sections: its H2 headings are the use-case ids
and titles, which differ per project, so `pipeline.json` lists
`requiredSections: []` for it.

- (none)

## Document skeleton

```markdown
# Use Cases

## UC01 - <title>
**User stories:** US01, US03
**Actor:** <role>
**Goal:** <goal>
**Main flow:**
1. ...
2. ...
```

## Rules

- Give every use case a stable id `UC01`, `UC02`, ...
- `User stories:` lists real ids from the `user-stories` input - every use
  case references at least one.
- Cover the significant flows implied by the stories and the PRD - above all
  the end-to-end processes the interview walked through (who starts it, what
  changes at each step, what the system does on its own, where it can fail or
  be reversed, how it ends). Alternative and failure flows belong in the use
  case as extra steps or a short "Alternative flows" list.
- Describe SYSTEM BEHAVIOR: the data, actions, rules and outcomes an API must
  deliver. Never write screen, layout or visual steps - the interface derives
  from this behavior and from the frontend specification.
- The actor is a role the roles canon allows (a built-in role, or a custom
  role that gates real access).

## Completeness check

- Every core flow of the report and every PRD functional requirement group is
  covered by at least one use case.
- Every `User stories:` id exists in the input.
- No use case describes a screen or a platform-owned mechanism.

## Output

Write the document to `design/use-cases.md` (writer contract section 4).
