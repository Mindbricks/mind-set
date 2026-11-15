---
name: openappl-blueprint-review
description: Review an existing OpenAPPL blueprint against a checklist (ownership, tenant scope, relations and delete actions, required values without a source, public APIs, secrets, response shaping, enums, derived surface) and report findings with the JSON path, the reason and the fix, without editing the file. Do not use it to write or fix the blueprint (openappl-blueprint-authoring), to produce design documents (openappl-blueprint-design), or to write client or test code (openappl-blueprint-contract).
---

# OpenAPPL blueprint review

You audit a blueprint that already exists. The output is a findings report. You do not
edit the blueprint unless the user asks for the fixes afterwards; then the
`openappl-blueprint-authoring` skill applies them.

The corpus is at `{{CORPUS}}`. The checklist is `{{CORPUS}}/guides/review.md`: read it
fully before you start.

## Steps

1. **Structural pass.** Run `mind-set validate <blueprint-file>` (when `mind-set` is not on the `PATH`: `npx @mindbricks/mind-set validate <blueprint-file>`). Report every error as a
   finding of its own. A blueprint with structural errors cannot be reviewed reliably:
   say so, review what you can, and mark the review incomplete.
2. **Semantic pass.** If the environment offers a semantic OpenAPPL validator (an
   OpenAPPL validator service, or the validation tool of a compiler or hosting platform
   you are connected to), run it and collect its errors and warnings with their codes.
   Without one, say in the report that the semantic rules were checked by reading only.
3. **Map the blueprint.** List the services, their data objects (owner field, tenant
   scope, soft delete, relations) and their business APIs (`crudType`, `loginRequired`,
   `ownershipCheck`, roles, where and data clauses, select clause). Note every high-level
   pattern and read what it lowers to in
   `{{CORPUS}}/openappl/compiler/12-derived-surface.md`.
4. **Walk the checklist.** Apply every item of `review.md` to every element it concerns.
   For each property or option you are unsure of, read its spec page
   `{{CORPUS}}/openappl/spec/<Pattern>.md`; never judge from the name alone.
5. **Write the report.**

## The report

Save it as `review/blueprint-review.md` in the working folder (or give it in the
conversation when the user asks for that). One entry per finding:

| Field | Content |
|---|---|
| Severity | `error` (wrong or unsafe behaviour at run time, or the compiler refuses it), `warning` (likely a mistake), `note` (style, clarity) |
| Path | the JSON path, for example `services[0].businessLogic[2].basics.authOptions` |
| Rule | the checklist item, and the validator code when one applies |
| Why | what goes wrong, in one or two sentences |
| Fix | the concrete change |

Order by severity. End with a short summary: counts per severity, which passes ran
(structural, semantic, reading), and what was not reviewed.

## Rules

- Report, do not rewrite. A fix is a description of the change, small enough to apply
  as one authoring step.
- A finding names a real element at a real path. No generic advice.
- When the design documents exist (`design/`), check the blueprint against them too: a
  rule or an access level the specs ask for and the blueprint lacks is a finding.
- Do not report a validator warning that the authors explained in the blueprint
  (description of the element) as a finding; list it under notes.
