# Specs - the D3-D5 design documents

Harness-agnostic. This procedure writes the project's SPEC documents: the
project-level specs (`project-basic-setup`, `microservice-definitions`), the
`auth-spec`, one `service-spec-<key>` per declared service, and the platform
specs. It ends at the design-complete gate, where the blueprint phases
(`project-lifecycle.md` section 2) take over. It runs in this harness: the
design is written here, from the requirement documents the requirements
procedure (`procedures/requirements.md`) saved in `design/`.

**What is NOT here.** The document set, its order, every document's inputs,
gates and parallel groups live in ONE file: `procedures/design/pipeline.json`
(stages `D3` to `D5'`). This procedure never copies that table; it reads it.
What each document must contain lives in its writer guide
(`procedures/design/writers/<docName>.md`) and the shared writer contract
(`procedures/design/writer-contract.md`). If this text and `pipeline.json`
disagree, `pipeline.json` wins.

**Entry.** The design state (worked out from `design/` against
`procedures/design/pipeline.json`) says the requirement set is complete and
spec documents are owed. Earlier stages belong to the interview
(`procedures/interview.md`) and the requirements procedure; a design with every
owed spec document present and none stale means this procedure has nothing
left to write (go to section 7). Stale documents are rewritten in the same
loop, in pipeline order - except a document stale only because a revision's
`Affects:` line names it, which takes a revision of its own when the change is small
(`procedures/requirements.md` section 5, step 5). A rewrite folds the document's
existing revisions into its body (writer contract section 5). A change to
the service ROSTER is always a rewrite of `microservice-definitions`, never
a revision: the design state and the fan-out read the roster from the body's first
`json` fence, which a revision does not touch.

---

## 1. The loop, per document

Every document here is produced by the **writer loop** of
`procedures/requirements.md`, unchanged: build the inputs package, hand the writer
its guide, the writer writes the document, check it. In short:

1. **Inputs.** Read `pipeline.json` and pack ONLY the declared inputs (the
   narrowing rule, writer contract section 1): the files
   `design/<inputDoc>.md` (for a service spec, the inputs of `service-spec`).
   A missing input DOCUMENT means this document is not writable yet. A LIVE
   input (the codename, the auth route surface, the provider snapshot) has
   no server to fetch it from: take it from what the corpus and the design
   documents settle (the codename from the project name the interview
   record settles, the auth route surface as section 4 says, the providers
   as `project-basic-setup` decides them). What they do not settle, the
   writer proceeds without and records under the document's open-questions
   section.
2. **Write.** One writer per document reads the inputs package, the writer
   guide `procedures/design/writers/<guide>.md` (the service specs share
   `service-spec.md`) and `procedures/design/writer-contract.md`, and writes the
   whole body to `design/<docName>.md`. Nothing else: no
   blueprint write, no other document.
3. **Check.** Check the document against its guide's required sections
   (the document's `requiredSections` in `pipeline.json`) and the structure
   rules the guide states (for `microservice-definitions`: the roster and
   the Event Contracts table, section 3). A document with findings goes back
   to its writer with the findings, and is checked again. A later stage
   builds on a document only when its check is clean.
4. **One writer per file.** Each writer writes only its own document; the
   session running this procedure checks them one at a time - never two
   writers on the same file (section 5).
5. **Conflicts.** When a stored document changed after you read it
   (another session wrote it), reconcile your version with what is now
   stored (never discard the other write blindly) and check it again. A
   service spec whose service is not on the SAVED `microservice-definitions`
   roster has a wrong name: the roster is the truth; re-read it.

Before the first write of a session, check whether `design/` changed
recently through another session (the version control of the working
folder): another session may still be designing this project - ask the user
before writing.

---

## 2. D3 - `project-basic-setup`

1. Write and save `project-basic-setup` with the loop (its inputs and gate:
   `pipeline.json`).
2. The project settings it decides (basic settings, tenancy, roles, the
   flags, the provider needs) go into the blueprint after the
   design-complete gate (`project-lifecycle.md` section 2), not now: the
   design phase writes no blueprint. The service-spec writers (D4') name
   the providers as `project-basic-setup` decides them, and the
   `microservice-definitions` writer (D3') starts as soon as this document
   is saved.

---

## 3. D3' - `microservice-definitions`

1. Write the draft with the loop. The local check matters most here: the
   document's `## Services` must hold a `json`-fenced array of
   `{ "name": ... }` objects and `## Event Contracts` a markdown table.
   Every later stage parses that roster: a document without it does not
   pass the check.
2. Check it.
3. **The service plan** is not written now: the design phase writes no
   blueprint. When the blueprint is authored, `projectSettings.servicePlan`
   lists one entry per roster service, in roster order:
   `{ "serviceName": <the roster name exactly> }`, plus `"dataObjects": [...]`
   when the entry's `content` names its data objects (documentation only).

---

## 4. D4 - `auth-spec`

Only when `hasAuthentication` is on (the flags are parsed from
`project-basic-setup`).
It is written BEFORE the service specs (`pipeline.json` gives the service
spec an `after: ["auth-spec"]`), because the service specs read it.

Its live input is the AUTH ROUTE SURFACE: the routes the authentication
module of every OpenAPPL project ships. Read it from the compiler part of
the OpenAPPL corpus (`openappl/compiler/09-01-authentication-and-sessions.md`
and the derived surface, `openappl/compiler/12-derived-surface.md`) into the
inputs package; the writer designs against those routes and never
re-invents a route the compiler already ships.

---

## 5. D4' - the service-spec fan-out

1. **The roster** is the published `microservice-definitions` `json` array.
   Each service `name` gives the stored name `service-spec-<key>`, `key` =
   the service's roster key (lower-case kebab of the name: `customerProfiles`
   -> `customer-profiles`). Derive every name from the saved roster with
   that rule.
2. **One round, one writer per service.** Build every inputs package first
   (one per service; each carries the providers `project-basic-setup`
   decides and the saved `auth-spec`). Then start ALL the writers of the
   round together. They
   are independent: each reads only its own package and writes only its
   own draft. No approval is asked inside the round.
3. **Serialised checking.** As the writers finish, the session running
   this procedure checks each document (section 1, item 3), one at a time.
   A document with findings goes back to its writer; the others keep being
   checked. A conflict on one service spec is handled for that document
   alone (section 1, item 5).
4. The round is done when every service on the roster has its
   `design/service-spec-<key>.md`. A service the roster names and nobody
   wrote is not done; a document written for a name NOT on the roster is
   wrong - fix the name, not the roster.

---

## 6. D5 - the platform specs

After every service spec is saved. Each platform spec is written only
when its flag is on - `pipeline.json` `platformFlags[]` and each document's
`when.platformFlag` say which flag gates which document; `project-basic-setup`
says which flags this project has on.

- `notification-definitions` and `agent-hub-spec` are one parallel group
  (`parallelGroup` in `pipeline.json`): write them together, check them
  one after the other.
- `bff-spec` comes after `notification-definitions` when notifications are
  on; with notifications off that input is not owed and is simply absent.
- A flag that is off owes nothing: do not write "N/A" documents for it.
- **Every declared BFF need is designed or declined (#5272).** The
  `auth-spec` and the service specs each carry a `## BFF DataView Needs`
  section (an aggregated list, a cross-service view). After `bff-spec`
  is published, the orchestrator checks it against those declarations: each
  need is either designed in `bff-spec` or declined there with a reason. A
  need that is neither (the pilot's case: a site-owner overview list the
  auth-spec declared, which never reached the bff writer) is not a finished
  design, whatever the design state says: rewrite `bff-spec` with the missing need
  named in the brief as an input the pack did not carry, or record it as an
  `OPEN (designer)` item for the design-complete gate. `pipeline.json` says
  which documents the bff writer's pack carries.

---

## 7. The design-complete gate

1. Work the design state out from `design/`. The design is complete when
   every document the pipeline owes (by its `when` conditions and the
   project's flags) exists and none is stale.
2. **Sort the OPEN items first (#5272).** The spec set can carry dozens of
   `OPEN` items; a literal summary would hand the designer a technical
   backlog. Split them exactly as the requirements procedure does
   (`procedures/requirements.md` section 5, the open-questions round):
   - **designer decisions** (`OPEN (designer)`, plus the defaults carried
     over from the requirement stage's round): product points, each with
     its default, in product language;
   - **platform verifications** (`OPEN (platform)`): resolved from
     `openappl/ontology/` and `openappl/spec/` where you can; the rest is
     marked `verify at blueprint` for the blueprint phase, and NOT put to
     the designer.
3. **Ask the user before leaving the design phase**: summarize what was
   written (the service roster, the platform specs) and the designer
   decisions with their defaults, and ask for an explicit go to start the
   blueprint phases. This is a stage boundary; the answer is the user's,
   never assumed. Accepted defaults need no record write. Answers that
   CHANGE a default are this stage's open-questions round, recorded exactly
   as the requirements procedure records its round
   (`procedures/requirements.md` section 5, steps 4-5): REVISIONS of the closed
   interview record in its `## Revisions` section (one approval "these
   answers are right", no re-close), each naming on its `Affects:` line the
   design documents whose content must change; then each document
   that is now stale gets a revision of its own, or a rewrite through
   this procedure or the requirements procedure when the change is large -
   never a fix in the blueprint. One round per stage: new OPEN items raised
   by a rewrite go to the blueprint phase with their defaults.
4. On the go: continue with the blueprint, `project-lifecycle.md` section 2
   (the end of Phase D): the blueprint is authored from the spec documents
   and validated, and is then ready to be compiled by an OpenAPPL compiler.

---

## 8. Stage boundaries and approvals

- Approvals are asked at stage BOUNDARIES only: requirement -> spec (entering
  this procedure; not asked again when the requirements procedure already
  took it in this session) and spec -> blueprint (section 7). Never inside a
  stage: not per document, not inside the fan-out.
- Every boundary works the design state out again from `design/`: the
  owed documents are the plan; a session never works from its own
  memory of what is left.
- A session that stops mid-procedure leaves nothing to clean up: the
  checked documents in `design/` are the state; a document a writer left
  unchecked is checked again. The next session starts again at the entry
  check.
