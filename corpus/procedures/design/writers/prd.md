# Writer guide: prd

The Product Requirements Document: the product and backend scope in a fixed
seven-chapter template. The use cases, project-basic-setup and every spec
writer read it.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-description-report`.
- Supplementary: `interview-record` (settled facts and Coverage Ledger: the
  integrations, providers, scale tier, reporting surface and acceptance
  expectations the report condensed).
- Canon: `procedures/design/canon/roles.md`, `procedures/design/canon/platform-owned.md`.

This document is written in parallel with `user-stories` and `frontend-spec`:
do not assume either exists; derive the requirements from the report and the
record directly.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `prd` in `procedures/design/pipeline.json`; write each
exactly as given, numbers included.

- `## 1. Product Overview`
- `## 2. Functional Requirements`
- `## 3. Non-Functional Requirements`
- `## 4. Feature Specifications`
- `## 5. Technical Requirements`
- `## 6. Success Metrics`
- `## 7. Open Questions & Risks`

## Document skeleton

Markdown, with no code fence around the whole document:

```markdown
# Product Requirements Document

## 1. Product Overview
Purpose, business objectives, target audience.

## 2. Functional Requirements
Grouped functional requirements.

## 3. Non-Functional Requirements
Performance, security, data, reliability.

## 4. Feature Specifications
### In Scope
### Out of Scope

## 5. Technical Requirements
Platform architecture, integrations, data management.

## 6. Success Metrics

## 7. Open Questions & Risks
```

## Rules

- Keep the document to the PRODUCT and BACKEND scope: functionality, data,
  rules, processes, integrations, accounts and permissions. The web
  application, when the designer wants one, is captured in the separate
  frontend specification, so do not describe screens, layouts or visual
  style here, and never state that a frontend is out of scope.
- Non-functional requirements follow the platform-owned canon: hashing,
  token signing, rate limiting, transport and storage encryption are the
  platform's; a designer's wish about them is a noted preference, not a
  requirement.
- The expected traffic tier from the interview (`scale` in the Coverage
  Ledger) belongs in chapter 3; the providers and integrations the interview
  settled belong in chapter 5.
- `### Out of Scope` lists only what the designer excluded (or an assumption
  the record states); never narrow the scope on your own.
- Roles follow the roles canon.

## Completeness check

- All seven numbered H2 headings are present, in order.
- Every Coverage Ledger decision that is a requirement appears in a chapter.
- Open questions and risks are collected in chapter 7 (or it says `- (none)`).

## Output

Write the document to `design/prd.md` (writer contract section 4).
