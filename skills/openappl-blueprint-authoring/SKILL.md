---
name: openappl-blueprint-authoring
description: Write or change an OpenAPPL blueprint JSON file (project settings, authentication, services, data objects, properties, business APIs, workflows, library code) in small validated steps, or fix its validation errors. Do not use it for the requirements interview and design documents (openappl-blueprint-design), for an audit of a blueprint without editing it (openappl-blueprint-review), or for drafting contract-based client, test or extension code (openappl-blueprint-contract). Use authoring when applying that extension code to the blueprint JSON.
---

# OpenAPPL blueprint authoring

A blueprint is one JSON document whose root is the `Project` pattern. You write it as a
series of small, verified edits. Every property name you write comes from the OpenAPPL
schema; nothing is guessed.

The corpus is at `{{CORPUS}}`.

## Before the first edit

1. Read `{{CORPUS}}/procedures/blueprint-authoring.md` fully. It is the procedure: the
   design decisions to settle, the write order, the API shape, value sources, the
   validation gotchas and the completeness check.
2. Read `{{CORPUS}}/procedures/patterns-catalog.md` and `{{CORPUS}}/procedures/pitfalls.md`.
   When the catalog marks a pattern you need as architecture-first, read its guide before
   you design that part.
3. Read the guides that carry the lessons of earlier deliveries:
   - `{{CORPUS}}/guides/project-settings.md` before you write `projectSettings`, the roles,
     the tenancy or any provider (classify what is already there, the provider paths, the
     hold rule);
   - `{{CORPUS}}/guides/delivery.md` before you plan the lanes (the modules a delivery
     loses, one writer per subtree, the whole-project checks, the coverage gate and the
     warnings ledger);
   - `{{CORPUS}}/guides/changing-a-blueprint.md` when the blueprint is already delivered;
   - `{{CORPUS}}/openappl/guides/best-practices/validator-rules.md` before you write an
     expression or a library body.
4. Pick the procedure for the part you are writing (same folder):
   - a domain service: `blueprint-authoring.md`;
   - `authentication`: `auth-blueprint.md`;
   - `bffService`: `bff-blueprint.md`;
   - `notificationService`: `notifications-blueprint.md`;
   - `agentHub`: `agent-hub-blueprint.md`;
   - a service that takes payments: `howto-payment-flow.md`; recurring plans:
     `howto-subscription.md`; editorial content and mail to tasks: the other `howto-*.md`.
5. Collect the inputs: `design/blueprint-plan.md` and the `design/service-spec-*.md` files
   when the design skill wrote them, otherwise the user's request. When the request leaves
   a product decision open, ask; do not decide it silently.
6. Find the blueprint file. For a new project, start from the closest example in
   `{{CORPUS}}/examples/` (`todo.json`, `blog.json`, `shop.json`) and keep only what the
   design needs.

## The loop, one element at a time

For every element (a setting, a data object, a property, an API, an action):

1. **Look it up.** Open `{{CORPUS}}/openappl/spec/<Pattern>.md` for the pattern you are
   about to write, and its child patterns. For exact names, types, enum values and
   defaults, read the pattern in `{{CORPUS}}/openappl.json`.
2. **Write the smallest edit** that adds or changes that element, at its JSON path. Leave
   properties at their documented default unless the design needs another value.
3. **Validate** (below). Fix every error before the next element. Read each warning and
   either fix it or say in your report why it stays.
4. **Check the effect.** If the element is a high-level pattern (checkout, subscription,
   moderation, buckets, ...), read what it lowers to in
   `{{CORPUS}}/openappl/compiler/12-derived-surface.md` and do not declare those elements
   again yourself.

Write in the order of `blueprint-authoring.md` section 4: project settings, then
authentication, then each service (data objects and properties before the APIs that use
them), then the platform modules.

## Rules

- **Never invent a property name.** If the spec page and `openappl.json` do not have it,
  it does not exist. Find the pattern that expresses the need, or report the gap as an
  open item. An unknown key is not ignored: it is an error.
- **One value source per stored value.** Every required property must get its value on
  create from exactly one place: a data clause item, the session (`sessionSettings`), a
  static join, a default, or a sequence. See section 6 of `blueprint-authoring.md`.
- **Ownership comes from the session.** Mark the owner property with
  `sessionSettings.isOwnerField`; never write the owner from a request value.
- **Secrets are references.** Every credential value is a reference, never a literal:
  `"$ENV:STRIPE_SECRET_KEY"` when the deployment holds the value (recommended in a
  committed blueprint), or `"ENTER_CREDENTIAL"` with `"secret": true` while it is not
  provided yet. Never write a key the user pasted, never a realistic fake, and never
  `ENTER_CREDENTIAL` into a key that is not a secret (ask for that value). The two forms
  and how they relate: `{{CORPUS}}/openappl/guides/blueprint/secrets.md`.
- **Never a real password.** The seeded super-admin password is readable by everyone who
  reads the blueprint: write `"$ENV:SUPERADMIN_PASSWORD"`, or a placeholder the
  administrator changes on first login (`"change-me-on-first-login"`). Never the user's
  own password, never the default. A `secret-literal` warning from `mindset validate`
  is a leak until you have replaced the value.
- **Providers come first.** Do not start a service until every provider its design needs
  exists in `projectSettings` (the hold rule of `project-settings.md`). Classify what is
  already there (absent, present and matching, present and diverging) before you write a
  family; never write over a diverging one.
- **Modules are not services.** `bffService`, the notification wiring and `agentHub` have
  no completeness gate of their own and are the parts a delivery loses. Give each one that
  the design turns on a durable work item, and wire `dataViewName` in the same pass as the
  DataView (`delivery.md`).
- **MScript values are descriptors**: `{ "js": "..." }`, one expression.
- **Do not hand-edit generated output.** The compiler owns the backend code; behaviour
  you need goes into the blueprint (a workflow action, a library function, an edge
  controller), never into compiled files.

## Validation

After every edit:

1. Run `mindset validate <blueprint-file>` (when `mindset` is not on the `PATH`: `npx @mindbricks/mind-set validate <blueprint-file>`). It checks structure only: unknown
   properties, types, enum values, required fields and the root. See
   `{{CORPUS}}/guides/validate.md`.
2. If the environment offers a semantic OpenAPPL validator (an OpenAPPL validator
   service, or the validation tool of a compiler or hosting platform you are connected
   to), run it too. It knows the rules a schema cannot express, such as a missing value
   source or an ownership check without an owner field. Use its error codes with
   `{{CORPUS}}/guides/review.md` to find the fix.
3. Without a semantic validator, say so in your report, and walk the checklist in
   `{{CORPUS}}/guides/review.md` over what you wrote before you call the blueprint done.

4. When the design documents exist (`design/`), run `mindset spec-coverage <blueprint-file>`
   before you call the blueprint done. Every document must have produced its artifact; a
   gap is either written now or declined on purpose with
   `mindset spec-coverage --declare <doc> --reason "<why>" --by "<who>"`. It checks that
   each target exists, not that it is complete: that is still your completeness check.

5. After the last write of a delivery, keep the warnings ledger of `delivery.md` section 5:
   every warning code is fixed or has a recorded decision pinned to its count. Sweep a defect
   class with the validator, not with a text search.

## Done when

- `mindset validate` reports no errors and no `secret-literal` warning, and the semantic
  validator (when there is one) reports no errors;
- `mindset spec-coverage` is OK when there are design documents;
- every data object, API and setting in the design inputs is in the blueprint (the
  completeness check of `blueprint-authoring.md` section 9);
- your report lists what you wrote, the warnings that remain and why, and every open
  item.
