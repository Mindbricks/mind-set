# Writer guide: test-report

The record of the latest FULL gated test run: which test-suite revision ran,
against which backend builds, with what result and what coverage. It is
GENERATED, never hand-written, by the tooling that runs the suite against a
deployed system. This harness runs no suite, so it never writes this
document; the guide describes the report's contract, so a reader of a report
produced elsewhere knows what it says.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).
For this document the writer is the generator: the contract's narrowing rule
holds by construction (it reads only the run's files), and there is nothing
to decide - a report states what happened.

## Inputs

- Required: `test-plan` - the report records the plan version the run used
  (`plan.version`); a newer plan makes the report stale.
- The run's files, read by the generator: the suite's own result file, the
  API inventory of every service, the test-suite revision (a run on
  unshipped scripts is refused: ship first), and the deployed commit of every
  service, recorded when the run started.

## When it is written

- After every FULL gated run (the whole suite, then the coverage gate) on a
  SHIPPED test-repo revision. A standalone run of one flow file during
  authoring stays local and publishes nothing.
- ONE document, rewritten per full run; the next run rewrites it.
- It takes NO revisions: a revision would change it without a run.
- A report with failing cases or a MISSING list is valid: it is a record.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `test-report` in `procedures/design/pipeline.json`; the
generator writes each exactly as given.

- `## Summary`
- `## Machine Block`
- `## Per-Service Results`
- `## Coverage Gate`
- `## Skip Ledger`
- `## Defects Filed`
- `## How To Re-Run`

## Document skeleton

```markdown
# Test Report
## Summary
<ran at, duration, pass / fail / skip / total, the verdict in one line>
## Machine Block
    (exactly ONE json fence: the mindbricks-test-report/v1 block)
## Per-Service Results
| service | pass | fail | skip | inventory | missing |
## Coverage Gate
<PASS or FAIL, and the MISSING list as service.apiName rows>
## Skip Ledger
| class | ref | count |
## Defects Filed
<the defects the failing cases were filed as, or "none">
## How To Re-Run
<the commands that reproduce this run from the recorded revision>
```

## The machine block

`## Machine Block` holds exactly one json fence validating against
`procedures/design/schemas/test-report.v1.json` (`mindbricks-test-report/v1`, JSON
Schema draft 2020-12). In short:

```json
{
  "schema": "mindbricks-test-report/v1",
  "ranAt": "2026-09-26T10:00:00.000Z",
  "durationMs": 81234,
  "repo": { "revision": "<40-hex test-repo sha>", "dirty": false },
  "plan": { "docName": "test-plan", "version": "1.0.2" },
  "target": { "env": "preview", "base": "<preview base url>",
    "builds": [{ "serviceName": "orders", "commitSha": "<7-40 hex, or null>" }] },
  "summary": { "pass": 110, "fail": 0, "skip": 4, "total": 114 },
  "services": [{ "serviceName": "orders", "pass": 60, "fail": 0, "skip": 2,
    "inventory": 31, "missing": 0 }],
  "coverage": { "gate": "PASS", "missingCount": 0, "missing": [] },
  "skipLedger": [{ "class": "STATIC-TRANSPORT", "ref": "cron-only", "count": 2 }]
}
```

`skipLedger.class` is one of `STATIC-TRANSPORT`, `KNOWN-DEFECT`,
`ENVIRONMENT`, `BLOCKED-IDENTITY`, `BUILT-IN-UNUSED`, `PRECONDITION` (the
reasoned-skip classes of the suite; `BUILT-IN-UNUSED` is a system-service
built-in the product does not use, counted as covered). The block carries
only counts, names, shas and the base URL: never a credential, a token, a
header or a request body.

## Structure check

The report is structurally invalid when:

- `## Machine Block` holds no json fence, or more than one;
- the block does not validate against the schema (a missing or extra key, a
  wrong type, a revision that is not 40 hex, `dirty: true`, an unknown skip
  class, an empty `services` list);
- `summary.total` is not `pass + fail + skip`;
- the `services[]` pass / fail / skip counts do not sum to `summary`;
- `coverage.missingCount` is not the length of `coverage.missing`;
- `coverage.gate` is not `PASS` exactly when `missingCount` is 0;
- `ranAt` is more than 5 minutes in the future.

The generator produces the block and validates it itself.

## How readiness reads it

A report is stale when the `test-plan` version differs from `plan.version`
(`plan-changed`), when the test-suite revision moved from `repo.revision` and
the move changed a suite input (`repo-moved`: a flow, a helper or another
runner file; a move that only touched seed data or plain docs does not
count), or when a service was rebuilt after the run and its deployed commit
differs from its `target.builds[]` sha (`backend-rebuilt`; two shas are the
same when the shorter, at least 7 hex, is a prefix of the longer; a null sha
is not compared). A stale report is re-run and republished, never edited.
