# Writer guide: frontend-spec

The project's frontend specification: every STRUCTURAL and FUNCTIONAL
interface requirement the designer expressed, plus clearly-marked defaults
where they expressed none. It is the input of whoever builds the frontend
(layout and screens). Owed only when the delivery shape is `withFrontend`; it does not
count toward the readiness verdict.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-description-report`.
- Supplementary: `interview-record` (the frontend-structure facts: device
  priority, UI languages, who uses the interface, accessibility, and any
  screen wishes).

Written in parallel with `user-stories` and `prd`: do not assume either
exists.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `frontend-spec` in `procedures/design/pipeline.json`; write
each exactly as given.

- `## Product & Audience`
- `## Users & Access`
- `## Navigation & Structure`
- `## Screen Wishes (per area/service)`
- `## Out of Scope / Explicit No's`

## Document skeleton

```markdown
# Frontend Specification

## Product & Audience
- Product name (as it should appear in the UI): ...
- Primary users and their context: ...
- Device priority: ... (mobile-first / desktop-first / both)
- Language(s) of the UI: ...
- Accessibility requirements: ...

## Users & Access
- Which user roles use the UI and what each must see / must not see: ...
- Sign-in expectations (public sign-up, invited, admin-created): ...

## Navigation & Structure
- Main areas/sections the user expects: ...
- Landing/dashboard expectations (what must be visible first): ...
- Multi-tenancy implications for the UI (if any): ...

## Screen Wishes (per area/service)
### <Area or service>
- ...explicit screen/flow wishes from the interview, functional only...

## Out of Scope / Explicit No's
- ...anything the designer said they do NOT want in the UI - designer-sourced
  only, never a (proposed) default...

## Open Questions
- OPEN (designer): ... - default: ...   (or "- (none)")
```

`## Open Questions` is not in the required list; write it whenever the
document raises an `OPEN (designer)` item, so the item is collected where
every other writer collects its own.

## Rules

- **No visual design.** This document is technical and structural only:
  nothing about colors, fonts, themes, dark/light preference, style
  adjectives (minimal, playful, corporate) or reference products "to look
  like". The theme belongs to whoever builds the frontend, not to this
  document; styling wishes are handled later as change requests. If the
  interview holds
  styling wishes, OMIT them here.
- Ground every statement in the interview record or the report. Where the
  designer gave nothing, propose a professional default and mark it
  **(proposed)** - never present an invention as the designer's wish.
  `(proposed)` is only for the writer contract's "proposed default" kind
  (section 2, the gap policy): a UI detail that adds and decides no product
  rule. A gap that IS a product decision (how a user joins a group at
  sign-up, what a suspended user still sees) is an `OPEN (designer)` item
  with your default, exactly as the prd writer raises it - the two
  documents read the same inputs and must file the same gap the same way.
- **(proposed) may ADD, never SUBTRACT.** It fills a gap the interview left,
  so a proposed default is always something the product WILL have. Never use
  it to remove, defer or fence off a capability ("that area sits outside this
  product (proposed)", "deferred to a later version (proposed)" are
  forbidden - they narrow the delivery on nobody's authority). If the
  interview did not exclude something, it is IN. The only place an exclusion
  may appear is `## Out of Scope / Explicit No's`, and every line there traces
  to something the designer said. A role the project defines is a role the UI
  serves; if its screens were never discussed, propose them.
- Business language: no component names, no CSS, no framework talk.
- Screen wishes stay at the wish level ("staff sees a daily task board") -
  actual screens derive from the backend design; do not enumerate CRUD pages.
- **Name the data, never the fetch path.** A screen wish states the data the
  screen shows ("the seller dashboard shows order counts by status") - it
  never says the data comes "from the BFF", "from a view" or "from a view
  endpoint". The DataView service (bff) is a design-time detail: the
  microservice-definitions and bff-spec writers decide which consuming
  service's business API serves that screen, and the frontend never reaches
  the DataView service (bff) directly (`procedures/design/canon/dataview-access.md`
  - the consumers rule). A wish naming "the BFF" as a source is a defect to
  rewrite as a data requirement, not a hint to preserve.
- Complete but compact: the whole document is handed to the frontend work
  in one piece.

## Completeness check

- All five required H2 headings are present, in order.
- Every role the interview settled appears under `## Users & Access`.
- No styling statement anywhere; every `(proposed)` line adds, none removes.
- Every line under `## Out of Scope / Explicit No's` traces to the designer.

## Output

Write the document to `design/frontend-spec.md` (writer contract section 4).
