# Writer guide: project-description-report

The project's "Project Description And Scope": two paragraphs that condense
the closed interview into the statement every later document starts from.
Every requirement document (user-stories, prd, frontend-spec, use-cases) and
project-basic-setup reads it, and the design stage detector treats its
existence as the proof that the interview finished.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `interview-record` - the closed interview record (Settled facts,
  Exchange log, Coverage Ledger). The ledger's `delivery-shape` entry is the
  delivery choice.
- Canon: `procedures/design/canon/platform-owned.md`.

## Required sections

This document has NO required H2 sections: its contract is one H1 and two
labelled paragraphs, exactly as in the skeleton below, and `pipeline.json`
lists `requiredSections: []` for it.

- (none)

## Document skeleton

```markdown
# Project Description And Scope

**Project Description:** <one comprehensive paragraph: what the project is,
who uses it, and what it does - no line break after the label>

**Project Scope:** <one comprehensive paragraph: what is in scope - data,
processes, integrations, user management - and, in its final sentence, the
DELIVERY SHAPE the interview settled: "backend services and APIs plus a web
application" when a frontend is in scope, or "backend services and APIs
only" when the designer chose backend-only. No line break after the label>
```

English only, no extra sections.

## Rules

1. Use only information from the interview record; do not invent
   requirements. Where the record marks a fact `assumed`, it is still part of
   the scope - the designer confirmed the summary that stated it.
2. Apply the platform-owned canon: a mechanism the platform owns is recorded
   as the designer's noted preference, never as a scope requirement.
3. The delivery shape comes from the record's `delivery-shape` ledger entry
   (or its Settled facts). If it is genuinely absent, write "backend services
   and APIs, with a web application available on request".
4. Keep both paragraphs comprehensive: later writers derive stories,
   requirements and the service decomposition from this text, so a capability
   left out here tends to disappear downstream.

## Completeness check

- The H1 and both bold labels are present, each paragraph on the label's line.
- The final sentence of the scope paragraph states the delivery shape.
- Every core flow, role family, integration and provider decision in the
  record's Coverage Ledger is reflected in one of the two paragraphs.

## Output

Write the document to `design/project-description-report.md` (writer
contract section 4).
