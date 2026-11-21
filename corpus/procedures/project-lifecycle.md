# Project lifecycle - the design pipeline order

Harness-agnostic orchestration procedure. This is the ORCHESTRATOR's
procedure: it decides what runs when; per-task mechanics live in the other
core docs (`interview.md`, `requirements.md`, `specs.md`,
`blueprint-authoring.md`).

## 0. The division of labor

- **The design phase (all upfront) — also yours, in this harness:** the
  interview (its record, `interview-record`), the REQUIREMENT docs
  (`project-description-report`, `prd`, `user-stories`, `use-cases`,
  `frontend-spec`) and ALL the SPEC docs (`project-basic-setup`,
  `microservice-definitions`, `auth-spec`, `service-spec-<kebab>` per domain
  service, `notification-definitions`, `bff-spec`, `agent-hub-spec`). The
  document set, its order and its inputs are `procedures/design/pipeline.json`;
  the procedures are `interview.md`, `requirements.md` and `specs.md`
  (Phase D below). In the design-doc taxonomy
  (inherited from the retired Ada's ADR-0006) the platform specs derive from
  the service SPECS (each spec's "Notification Needs" / "BFF DataView Needs"
  sections), not from blueprints — so every spec is writable before any
  blueprint exists. The blueprint is authored when ALL SPECS ARE PRESENT.
- **After the specs:** the blueprint (`blueprint.json`) is authored from
  them, module by module, and validated (the end of Phase D, section 2).
  Building, preview, tests and the frontend belong to the compiler and the
  hosting platform, not to this procedure.

The design state is worked out from `design/` against
`procedures/design/pipeline.json`. Specs missing -> continue the design phase
(Phase D) from the first stage that still owes a document; specs present ->
confirm with the user, then author the blueprint. There is no ownership gate:
a project has any number of sessions, and each works the same state out of
the same folder, which is also why a design stage can be resumed by a session
other than the one that started it.

### 0.1 The whole journey — so you can answer "who does what"

Know the full journey and answer from it; never guess. Any session of the
project — this one, or one opened in another harness — may run any stage;
the design documents in `design/` are what carries the work between them:

1. **Interview (D0):** the interview runs in the main conversation
   (`interview.md`); its record,
   `interview-record`, is written as it goes and closed with the user's two
   confirmations.
2. **Requirement docs (D1-D2'):** `project-description-report` (the scope
   report), `prd`, `user-stories`, `use-cases`, `frontend-spec`
   (`requirements.md`).
3. **Spec docs, all upfront (D3-D5'):** `project-basic-setup`,
   `microservice-definitions`, `auth-spec`, one `service-spec-<kebab>` per
   domain service, `notification-definitions`, `bff-spec`, `agent-hub-spec`
   (`specs.md`).
4. **Specs complete:** every document the pipeline owes exists in
   `design/` and none is stale; the user confirms the move to the blueprint.
5. **Blueprint:** the blueprint is authored from the specs (auth, then the
   domain services, then the platform modules), validated, and handed to an
   OpenAPPL compiler.

**Routing the user's questions and requests:**

| The user asks / wants | Whose ground | What you do |
|---|---|---|
| "Let's design a new product" / no design yet, or the interview record still `in-progress` | The design phase (Phase D) | Run the interview (`interview.md`); a half-finished `interview-record` is resumed, not restarted. |
| The interview closed, requirement documents owed / "write the PRD, the user stories" | The design phase (Phase D) | The requirement documents (`requirements.md`), in pipeline order, each saved as `design/<docName>.md`. |
| The requirement set complete, spec documents owed / "write the specs" | The design phase (Phase D) | The specs (`specs.md`), in pipeline order. |
| "What does my project do? What did we agree in the interview?" | The design phase's outputs | Answer from `design/` (`interview-record`, scope report, prd, user-stories, use-cases): you can read and explain everything the design phase produced. |
| "Re-scope the product / add a whole new capability area / redo the requirements" | The design phase (Phase D), run here | Re-scope through the design procedures: amend the interview record (`interview.md`), rewrite the affected requirement doc, then every downstream document that is now stale (`requirements.md`, `specs.md`); then work the design state out again. |
| "Change a detail that contradicts a spec" / the spec itself is wrong | Yours (design authority) | **The spec is a SOURCE, not law.** Blueprint authoring is the real design work: when the spec is erroneous, contradictory or impossible, design what is right and record the deviation (what the spec said, what you did, why) in the handoff and the completion report. A blueprint-level deviation does not rewrite the spec DOCS; a genuine re-scoping of the product goes through the design procedures (the row above). |
| "Why is the backend designed this way?" | Both | Explain from the spec (`design/`) plus the blueprint (`blueprint.json`): specs carry the intent, the blueprint carries the realization. |
| "Write / change the blueprint" | Yours | `blueprint-authoring.md` and the module guides; validate with `mindset validate blueprint.json`. |
| "Build / deploy / test / run the application" | The compiler and the hosting platform | Not this procedure: the validated blueprint goes to an OpenAPPL compiler. |
| "Where are these documents kept?" | The working folder | In `design/`, one markdown file per document; the blueprint is `blueprint.json`. |
| "Set up / change payment, storage, AI providers" | Yours (the provider entries of the blueprint) + user (credentials) | The blueprint names the providers; CREDENTIALS are entered by the user in the settings of the hosting platform, never through you, never into the blueprint. |
| "Change roles / login / tenancy" | Yours (via blueprint) | The auth module is blueprint work (`auth-blueprint.md`); when the change contradicts `auth-spec` or `project-basic-setup`, note the drift as above. |
| "Where is the frontend? Who builds it?" | The design phase (`frontend-spec`) | The `frontend-spec` is the product intent; building the frontend is outside this procedure. |

One-line summary you can give the user verbatim: *"We settle WHAT the
product is first (interview, requirement docs, specs, kept as design
documents in this folder); then I write the blueprint that says HOW it
runs, ready for an OpenAPPL compiler."*

## 1. Dependency graph — always respect, even on partial requests

```
interview -> interview-record (closed, 2 confirmations)             <- D0
   |
   v
project-description-report                                          <- D1
   |
   v
user-stories || prd || frontend-spec (withFrontend only)            <- D2
   |
   v
use-cases                                                           <- D2'
   |
   v
project-basic-setup                                                 <- D3
   |
   v
microservice-definitions                                            <- D3'
   |
   v
auth-spec -> service-spec-<key> x N (one parallel round)            <- D4, D4'
   |
   v
notification-definitions || agent-hub-spec -> bff-spec (per flags)  <- D5, D5'
   |
   v   every owed document present, none stale + the user's go
blueprint.json authored from the specs (auth, then the domain
   |   services, then bff, notifications, agent-hub) and validated
   v
ready to be compiled by an OpenAPPL compiler
```

**The general rule (inherited from the retired Ada lifecycle):** before you
start any authoring task, ask *"what does this task READ — from the spec docs AND from the live
blueprint — and is that state in place?"* If missing, do the prerequisite
first or ask the user. Never fan out blueprint work in parallel just because
the user batch-requested it; parallelize only inside a phase where the graph
allows it.


**Partial requests:** when the user asks for one out-of-order piece ("just
give me the X service blueprint" before auth exists), explain the missing
prerequisite and its cost, offer to run the prerequisites first, and only
produce a standalone artifact when the user explicitly accepts that it will
need regenerating later.

The D-stages are the design DAG of `procedures/design/pipeline.json` (its
`stages[]`, `inputDocs` and `gate` text are authoritative; the graph above
is its summary).

## 2. The phases


### Phase D — Design (the interview, the requirement docs, the specs)

Runs while the design is not complete. The design state, worked out from
`design/` against `procedures/design/pipeline.json`, says where to continue,
and the documents it still owes are the plan.

| Stage | The design state | Procedure | Produces |
|---|---|---|---|
| D0 | no design yet, or the record `in-progress` | `interview.md` - in the main conversation, never delegated | `interview-record` (written as it goes, closed with the ledger and two confirmations); the project name and the delivery shape |
| D1-D2' | the record closed, requirement documents owed | `requirements.md` | `project-description-report`, then `user-stories` / `prd` / `frontend-spec` in parallel, then `use-cases` |
| D3-D5' | the requirement set complete, spec documents owed | `specs.md` | `project-basic-setup`, `microservice-definitions`, `auth-spec`, the `service-spec-*` fan-out, the enabled platform specs |

Standing rules of the phase:

- Every design document is written as `design/<docName>.md` by its writer
  and checked before a later stage builds on it (`requirements.md`
  section 3); a later decision is added to its `## Revisions` section.
- Each writer reads only the inputs `pipeline.json` declares for its
  document; the input pack holds exactly those (`requirements.md` section 3).
- Stage boundaries are confirmed with the user: the interview close,
  requirements → specs, specs → blueprints. Inside a stage (the service-spec
  fan-out) nothing is asked.
- Work the design state out again at every stage boundary. A document
  whose inputs changed after it was written is stale: rewrite it (or give it
  a revision) before building on it. A recent change to `design/` by another
  session means another session may be designing right now: ask the user
  before writing.
- Secrets are never taken in the conversation, not even during the
  interview; credentials go into the settings of the hosting platform.

A complete design plus the user's go ends the design phase. The blueprint
(`blueprint.json` in the working folder) is then authored from the spec
documents with `blueprint-authoring.md` and the module guides
(`auth-blueprint.md`, then the domain services, then `bff-blueprint.md`,
`notifications-blueprint.md` and `agent-hub-blueprint.md` as the flags of
`project-basic-setup` say), and validated with
`mindset validate blueprint.json` plus an OpenAPPL validation tool or
compiler when one is available. The blueprint is then ready to be compiled
by an OpenAPPL compiler; building, running and hosting the result are the
work of that compiler and the hosting platform, outside this procedure.


## 3. Standing rules (carried from Ada's lifecycle, harness-adapted)

- **Wait vs background:** writers and authoring tasks that later steps
  read are awaited. "Background" is a scheduling choice inside an ACTIVE turn, not a
  promise from the host: delegated background tasks are killed about 10
  minutes after the main turn ends with no user activity, and nothing wakes
  the main agent. Never end a turn on work you are waiting for; wait for it
  in the turn, split it into tasks that finish within that window, or
  resume the same task next turn (the adapter says how).
- **Checkpoint discipline:** commit the working folder (version control)
  at every stage boundary and before the blueprint authoring starts, so a
  stage can be reverted as a whole.
- **Concurrency guard:** before you replace a file another session may
  have changed, check the version control state of the working folder; a
  change you did not make is merged, never overwritten.
- **Fix-loop caps:** 3 attempts per service/failure class, then the user
  decides. Repeating an identical attempt after an identical result is the
  #1 wasted-turn pattern — change the input or stop.
- **Report honestly:** a skipped phase is announced, never silent; test
  reds are quoted, not summarized away.
