# Changing a delivered blueprint

The rules for a change request after the first delivery: how big it is, how to apply it,
and what counts as done. They keep a one-line request from silently becoming a
multi-session change, and keep a red test from rewriting the product.

## 1. Small or big: decidable rules, not feeling

Classify **every** incoming change before touching anything.

**SMALL: apply directly.** All of these must hold:

1. **Single scope.** The edit stays inside one service subtree (`services/<name>`) or one
   module (`authentication`, `bffService`, the notification wiring, `agentHub`). A change
   that only affects a frontend (copy, layout, a page that calls APIs that already exist)
   is single-scope by definition.
2. **No breaking contract change for an existing consumer.** Nothing a consumer (the
   frontend, the test suite, another service's subscription) already calls changes shape:
   no route removed or renamed, no request parameter made required, no response field
   removed or retyped. Purely additive surface (a new route, a new optional parameter, a
   new response field) passes.
3. **No schema change beyond additive properties.** New nullable or defaulted properties
   on existing data objects, and entirely new data objects, pass. Renaming, retyping or
   removing a property, splitting or merging data objects, or changing the relations
   between them fails this rule.
4. **Completable in one session.** You can state the whole edit plan now (which paths,
   which slots) and carry it through to verification without a hand-over.

**BIG: record it and plan it.** Any of these makes it big:

- the edit spans **several services**, or a service and a module's contract (new DataViews
  *and* the service feeding them);
- a **breaking contract change** (rule 2 fails);
- a **data-model restructure** (rule 3 fails);
- a **new capability area**: a new service, a module being turned on, a whole new workflow
  that no design document covers;
- it touches **payment or authentication semantics**: checkout or subscription flows,
  provider bindings, roles, permissions, login, tenancy. These are big even when the edit
  is one line, because the blast radius is the whole product.

**Tie-break: when in doubt, it is big.** A needless record costs one entry; an untracked
multi-session change costs the audit trail. Genuine re-scoping of the product is neither
path: it is a revision of the design documents ([specs](../procedures/specs.md)).

## 2. The small path

1. **Read the current state**; never assume it: list the touched paths, read them, and
   read the design document that states the intent.
2. **Edit** by the authoring procedure of the part (`../procedures/blueprint-authoring.md`
   for a service; the `auth`, `bff`, `notifications` or `agent-hub` procedure for a
   module). Validate before and after, as those procedures say.
3. **Verify** (section 4), then **report**: the blueprint paths that changed, the
   validation result, and any drift between the design documents and the blueprint (a small
   change of a decision is a new revision of the document, not a silent difference).

A change that needs a backend contract change is not frontend-only: classify it by its
backend part, and fix it in the blueprint, never in generated code.

**Deletion is a request, never a workaround.** Deleting an element is valid only as the
deliberate execution of what the user asked. When a write keeps failing (a validation
error you cannot clear), the answer is to fix the write or surface the blocker. Never
delete the asset you could not update, and never remove a property to silence a 400 on a
request body: that is a domain change nobody asked for, and the property is part of the
data model for a reason.

## 3. The big path

Write down the request, the services and modules it touches, the contract changes, and the
acceptance criteria before the first edit; split it into lanes by subtree
([Delivery discipline](delivery.md) section 2); then each lane follows the small path.
Check for a duplicate of the request first.

## 4. Done means verified

A change is **not done** until:

1. **Validated.** The structural check and, where you have one, the semantic validator
   report nothing new ([the warnings ledger](delivery.md) is re-run after any blueprint
   change: an edit can introduce a finding).
2. **Compiled and healthy**, when your environment compiles and runs the blueprint: an
   affirmative signal that the service answers at the new version. The absence of an error
   is not health.
3. **Tests green**, when a suite exists: the tests covering the affected APIs run and pass,
   and a big change adds tests for its acceptance criteria. No suite yet: say so in the
   report; do not imply coverage that does not exist.

**Report honestly.** "Validated; not compiled" when that is the truth; test reds quoted,
not summarised away; a deliberately skipped step named.

## 5. A failing test is not licence to change the product

Before you "fix the blueprint to make a test pass", state the **product** reason for the
change in one sentence. If you cannot, the failure is a test bug and the fix belongs in
the test. The recurring shapes of this mistake:

- turning a caller-supplied foreign key into a session-injected one so the test stops
  complaining. It destroys the cross-actor meaning the test was probing;
- weakening a validation rule so a create passes. The rule protected an invariant;
- adding the test's role to `absoluteRoles` to clear a 403. The gate exists for a reason.

The mirror rule: do not chase a green report. 95% passing with real defects accurately
flagged beats 100% with failures skipped or semantics loosened.

## 6. Sweep a defect class with the validator, not with a text search

When you have fixed one instance of a class and want its siblings, the instrument is the
validator, not a text scan. The validator **resolves** a name; a scan matches a spelling,
and the two differ exactly where optional chaining, aliasing or a derived context is
involved. One delivery swept its blueprint for the `session.tenantId` class by text,
published a table certifying a service clean, and missed two instances there: its slots
were written `session?.tenantId`, and the validator's `SESSION_FIELD_UNKNOWN` found all
seven the moment anyone ran it.

Quote the validator's counts by code in the report. A sweep you cannot quote is a sweep
nobody can check. Where you have no semantic validator, say that the sweep was textual and
which spellings it covered.
