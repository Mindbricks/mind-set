# Delivery discipline

Rules for taking a blueprint from the first write to a delivery you can stand behind. Each
one was learned the hard way on a real project, and the reason is given with the rule so
you can judge a case the rule does not name.

Use it with `../procedures/project-lifecycle.md` (the design half and the order of the
steps) and `../procedures/blueprint-authoring.md` (one service at a time).

## 1. The modules a delivery loses

A blueprint has two kinds of parts: **services** (`services[]`, each with data objects and
APIs) and **modules** that are not services: `bffService`, the notification wiring
(`notificationService`) and `agentHub`. A service-level completeness gate
(`blueprint-authoring.md` section 9) covers the services. **No gate covers the modules**,
and each one is small enough to look like something you can slip in between two bigger
jobs.

That is how two delivered projects lost their BFF:

- once because no lane owned `bff-spec`;
- once because the author announced it would write the BFF, dry-ran the first DataView
  clean, moved to the next module on the very next step, and never came back.

Neither run had a durable plan to return to: the intention lived in one sentence of prose
and did not survive the switch of context.

So, for each module the project turns on (`hasBff`, `hasNotifications`, `hasAgentHub` of
`project-basic-setup`):

- give it a **real work item**: a lane of its own, or a line in whatever durable checklist
  the session keeps (a task list file, the hand-over). A sentence in the conversation is
  not a plan;
- a module that is switched **off** is skipped on purpose: write the skip and the reason
  into the same checklist, so a later reader can tell a deliberate skip from a lost module;
- run the coverage gate of section 4 before you report: it reads the blueprint, not the
  plan.

### Order and wiring

- `bffService` before the notification wiring: notification payload views refer to
  DataView shapes.
- Wire `dataViewName` into **every consuming API in the same pass** that writes the
  DataView, not as a later rebuild once the BFF exists. A DataView nothing consumes is dead
  weight, and a service written earlier had to be rebuilt once the BFF wired its API.
- `agentHub` has no dependency and runs in parallel with the other two.
- Author only: the compiler is run once for the whole project after all authoring
  (`../procedures/project-lifecycle.md`), never between a service and its modules.

## 2. Parallel authoring

When several authors (or several agent lanes) write one blueprint at once:

- **one writer per `services/<name>` subtree.** Writes across subtrees do not conflict, so
  services can be authored in parallel;
- the **shared surfaces** (`projectSettings`, `authentication`, `integrations`, the
  platform modules that several services feed) are written by one author, one at a time;
- **each lane has its own scratch folder.** A shared scratch file was overwritten by a
  sibling lane (a probe result replaced by another lane's), and one lane read another
  lane's answer with no error. Name the folder after the lane and never read a file you
  did not write in this lane;
- never read the whole blueprint into a lane: read the paths the lane owns and the few
  shared paths it depends on;
- a lane's completion report lists what it wrote, the validation result, the open
  warnings, the completeness diff, the placeholder roles and the cross-service
  dependencies it still waits for.

## 3. Whole-project checks

A service validates alone. These checks span the project, so they are the author's job
after the last service is written:

- **Every consumed topic has a producer.** A Kafka-triggered API or an event subscription
  that listens for a topic nothing raises never runs, and nothing reports it. The reverse
  direction is checked in the review (every published topic has a consumer, or the
  announcement is intended; [review](review.md) section 10).
- **Every DataView has at least one consuming API.** The DataView is **wired**
  (`dataViewName` on a get or list API of a service), not merely defined.
- Every cross-service reference (`<service>:<Object>`, interservice calls, remote objects)
  names a service and an object that exist in the blueprint, or in the `servicePlan` (see
  [the service plan](../openappl/guides/blueprint/service-plan.md)).
- Every provider a pattern names exists
  ([Project settings and providers](project-settings.md), the hold rule).

## 4. The spec-coverage gate

Run it **before the report, not after**. It maps every design document to the blueprint
artifact that proves it was implemented, and reads the blueprint to do it:

```bash
mindset spec-coverage blueprint.json
```

A plan, a todo list and the session's own recollection are all inadmissible: the whole
point is that a module can be owned, started, validated clean and still never written.

| Document | Proof |
|---|---|
| `project-basic-setup` | `projectSettings` is present |
| `auth-spec` | `authentication` is present |
| `bff-spec` | `bffService.dataViews` has at least one entry |
| `agent-hub-spec` | `agentHub.aiAgents` has at least one entry |
| `notification-definitions` | `notificationService.eventNotifications` has at least one entry |
| `microservice-definitions` | the service roster resolves to the blueprint's services |
| `service-spec-<name>` | the service `<name>` exists in `services` |
| `frontend-spec` | not checked: the frontend is not part of the blueprint |
| `prd`, `use-cases`, `user-stories`, `project-description-report`, `interview-record`, `test-plan`, `test-report` | narrative: they produce no blueprint artifact and are exempt |

Exit 0 means covered. Exit 1 names each document that produced nothing (EMPTY) or has no
coverage rule (UNMAPPED). Clear a row by authoring the artifact (and, for an unmapped
document, adding a coverage rule), or, when no artifact is the right answer, by
**recording the decision**:

```bash
mindset spec-coverage blueprint.json \
  --declare agent-hub-spec --reason "<why no artifact is correct>" --by "<who decided>"
```

The decline lands in `design/spec-ledger.json` with non-blank `reason`, `by` and `at`. A
decline missing any of them clears nothing, and a decline never clears an error of the
gate itself. A later session reads the decision instead of re-litigating it or missing it
again; carry the same sentence into the hand-over. A project does not reach the report
with an undeclared gap.

The gate checks that the target **exists**, not that it is complete. The completeness check
of the authoring procedure stays yours.

## 5. The warnings ledger

Run it last: **after the last blueprint write**, with the validator you have. A clean run
taken before a fix round proves nothing about what shipped.

Why it is a gate and not a habit: the last validation of one delivery reported 16
warnings, and the same blueprint reported 43 the next morning. The 27 were not drift. They
were checks that had landed in the validator while the session ran, several written from
that session's own reports. Nineteen were undeclared reads across tenants at the level of
the whole application, and two of those were open to every authenticated user. Every one
was a **warning**, so `valid: true` and `errors: 0` were both true the whole time. A gate
keyed on severity passes a delivery like that. The ledger is keyed on whether each line was
**read**.

How to keep it (a plain file in the working folder, for example `design/warnings-ledger.md`):

1. Validate the whole blueprint with the semantic validator you have. Group the findings
   by code and count them.
2. Every code gets exactly one disposition: **fixed**, or **decided**: the reason it is
   correct, who decided, the count it was decided at, and the validator version it was
   decided under.
3. **Errors are never declinable.**
4. A decision is pinned to its count. If the count of a decided code later grows, the line
   re-opens: those new instances are not the ones anybody looked at. A new validator
   version re-opens nothing by itself, but re-running the ledger after an upgrade is what
   finds the new checks.
5. Re-run it after any later blueprint change: an iteration can introduce a finding as
   easily as an upgrade can introduce a check
   ([Changing a delivered blueprint](changing-a-blueprint.md)).
6. The closing report quotes the counts by code and each line's disposition, and names the
   declined gap rows of the coverage gate by name and reason.

Without a semantic validator, say so in the report and walk [the review](review.md) over
the blueprint instead. `mindset validate` is structural only and cannot stand in.

## 6. Waiting and background work

- Writers and authoring tasks that later steps read are **awaited**.
- "Background" is a scheduling choice inside an active turn, not a promise from the host:
  delegated background tasks can be killed about ten minutes after the turn that started
  them. Do not end a turn on a parked wait.
- A fix loop has a cap: three attempts per service and failure class, then the user
  decides. Repeating an identical attempt after an identical result is the most common
  wasted turn: change the input or stop.
- Report honestly: built or not, verified or not, the reds quoted and not summarised away,
  a deliberately skipped step named.
