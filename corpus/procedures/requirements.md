# Requirement documents - core procedure (D1-D2')

Harness-agnostic. This is the writer loop for the requirement documents of the
design pipeline: `project-description-report`, `user-stories`, `prd`,
`frontend-spec` and `use-cases`. The spec procedure (`procedures/specs.md`) reuses
the same loop for the spec documents. Every step names the file it reads or
writes in the working folder.

**Task shape.** The interview is closed (`procedures/interview.md` hands over here
after its second approval, the move to the requirement documents). You turn
the interview record into the requirement set, one document at a time or one
parallel group at a time, and save each one as `design/<docName>.md`. You do
not write the documents yourself in the conversation: a WRITER does, from an
input pack this procedure builds, following its writer guide. You run the
loop and check each document the writer saved.

**The one source.** The document set, each document's inputs, its order, its
gate and its parallel group live in `procedures/design/pipeline.json`. This
procedure never copies that table: read the file. Each document's writer guide
is the file named by its writer field (`procedures/design/writers/<docName>.md`), and
every guide follows `procedures/design/writer-contract.md`.

---

## 1. When this runs

Work the design state out from `design/` against
`procedures/design/pipeline.json`: which owed documents exist, which are
missing, and which are stale. A document is stale when one of its inputs was
rewritten, or got a revision whose `Affects:` line names it, after the
document was last written; the version control history of the working folder
shows the order. The delivery shape is in the interview record's Settled
facts.

| The design state | Do |
|---|---|
| The interview record is closed and `design/project-description-report.md` does not exist | Write the report (section 3), then continue. |
| The report exists and some requirement documents do not | Write every missing requirement document whose required inputs all exist, by parallel group (section 4). |
| A requirement document is stale (after a re-scope of the interview record, an edited input, or a revision whose `Affects:` line names it) | A document stale because of a revision (an input carries a revision, newer than the document, whose `Affects:` line names it) takes a revision of its own when the change is small (section 5, step 5); otherwise, and for every other reason, rewrite it with the same loop, in pipeline order: the report first, then the D2 group, then `use-cases`. A rewrite replaces the stored file. Staleness moves one step at a time: after a record re-scope the first pass may find only the report stale, and its rewrite makes the D2 group stale in turn. Work the design state out again after each rewrite group and rewrite whatever is newly stale, until no requirement document is stale. |
| The interview record is still `## Status: in-progress` | Not this procedure: the interview is still open (`procedures/interview.md`). |
| Every requirement document the pipeline owes exists and none is stale | The requirement set is done: section 5. |

A document is writable now when every one of its `inputDocs` exists in
`design/` (for `interview-record`: exists and is closed).

## 2. The order

Read the requirement documents (`class: "requirement"`) of `pipeline.json` and
obey their fields; do not reason the order out of this text.

- `stage` orders the work: D1 before D2 before D2'.
- `parallelGroup`: documents sharing a group are written in parallel. Today
  `user-stories`, `prd` and `frontend-spec` share one.
- `when`: a document with a `when` condition is written only when it holds.
  `frontend-spec` carries `{ "deliveryShape": "withFrontend" }`: write it only
  when the interview record's Settled facts give the delivery shape
  `withFrontend`. A record without a delivery shape: ask the user once,
  record the answer as a revision of the interview record, and only then
  start the D2 group.
- `inputDocs` and `extraInputs` are the writer's inputs. They are not yours to
  extend: section 3 step 1 packs exactly those.

## 3. The writer loop (one document)

For each document `<docName>`:

1. **Build the input pack.** Read the document's `inputDocs` and
   `extraInputs` in `procedures/design/pipeline.json`. The pack is the
   declared inputs of the document and nothing else: the files
   `design/<inputDoc>.md`, handed to the writer as paths.
   - A REQUIRED input (`inputDocs`) that does not exist is a document that
     comes earlier in the pipeline: write that one first. An interview
     record that is not `closed`: the interview is not closed; go back to it.
   - A SUPPLEMENTARY input (`extraInputs`) that is missing, or one that names
     live state of the hosting platform, is listed as missing in the pack.
     Go on; the writer writes without it and says so in the document's
     open-questions section.
2. **Run the writer.** Hand one writer: the document name, the input files
   of the pack, the writer guide path, `procedures/design/writer-contract.md` and
   the document path `design/<docName>.md`. The narrowing rule travels with
   it, verbatim:
   *Read ONLY the input pack and the writer guide (with the writer contract
   and the canon or reference files the guide names); write only the
   document file `design/<docName>.md`; never the blueprint or another
   document.*
   A writer that reads the blueprint, a sibling document that is not in its
   pack, or the conversation history has broken reproducibility: discard the
   draft and run it again.
3. **Check the document.** Check it against the writer guide's
   `## Required sections` (the same list is the document's
   `requiredSections` in `procedures/design/pipeline.json`) and the guide's
   completeness check. Send any finding back to the writer, let it fix the
   document, and check again. Never build on a document with open findings,
   or on one that was not checked.
4. **Rewrites.** A rewrite replaces the stored file. Before a writer
   rewrites it, make sure nobody changed it since you read it (version
   control of the working folder): a change you did not make is reconciled
   first, never overwritten blind. Section 6 lists the checks.

There are no separate draft files: the writer writes the document in
place, and the version control of the working folder keeps the version
before it.

## 4. Parallel groups

Documents that share a `parallelGroup` (and whose `when` holds) run together:

1. build every pack of the group first (step 1 for each; they are independent);
2. run the writers in parallel, one writer per document;
3. check each document (step 3) as its writer finishes, one at a time.

Then the next stage (`use-cases`), whose pack needs the group's checked
documents.

## 5. The requirement set is complete - the open-questions round

Work the design state out again. The requirement set is complete when every
requirement document the pipeline owes exists and none is stale. Inside this
procedure no approval is asked per document.

**The open-questions round (#5272).** The writers record gaps as `OPEN`
(writer contract section 2, the gap policy). The interview record is
closed, so nothing else gives a designer's answer a home: an unowned OPEN
item is transcribed by every later writer and never converges. Before the
stage boundary, the session running this procedure owns them:

1. **Collect** every `OPEN` item of the set (each writer reports them;
   the documents' open-questions sections hold them). Merge duplicates
   across documents.
2. **Sort** each into one of two piles:
   - **designer decisions** (`OPEN (designer)`: behaviour, rights, money,
     scope, time windows, anything a reasonable designer could choose
     differently);
   - **platform verifications** (`OPEN (platform)`: whether the platform
     supports something). These are NOT asked of the designer. Resolve what
     you can from `openappl/ontology/` and `openappl/spec/` yourself; the
     rest stays in the documents marked `verify at blueprint` for the
     blueprint phase.
3. **Ask** the designer the designer decisions in ONE round, in product
   language, each with its proposed default, next to the stage-boundary
   question (requirements -> specs). Never read out a document name or an
   OPEN id.
4. **Record** the answers as REVISIONS of the interview record, never as a
   re-scope (#5286, maintainer ruling 1): the record stays `closed`, and
   nothing is re-closed or re-approved. For each answer, one revision entry
   in the `## Revisions` section of `design/interview-record.md` (writer
   contract section 5): a `change` whose `Changes:` line names the Settled
   fact or ledger line it changes, or an `add` for a new decision; the answer
   as the decision; sourced `user` (a default the designer let stand without
   answering is `assumed`); and an `Affects:` line naming the requirement
   documents whose CONTENT must change because of it (usually the one that
   raised the item, plus any other document that states the same thing). The
   designer's "these answers are right" is the ONE approval the round
   needs.
5. **Carry each revision into the documents it affects**, one document at
   a time, in pipeline order. Each document an `Affects:` line names is
   stale until it has a write newer than the revision:
   - a small change - a value, a rule, a default that became a decision:
     a revision entry in THAT document's `## Revisions` section, its
     `Changes:` line naming the heading or decision that changes, the
     decision written in the document's own terms, its `Affects:` line
     naming any document further down that must change in turn;
   - a large change - a new entity, a new flow, a rewritten section: rewrite
     the document with the loop above; the writer folds the document's
     existing revisions into the body (writer contract section 5).
   Either write clears the staleness: a document stops being stale once it
   has a write newer than the revision, its own revision or a rewrite.
   Work the design state out again after each document until no requirement document is
   stale. A document the answers do not change gets nothing: the old
   re-scope rewrote all five requirement documents to settle eight
   defaults, the single biggest cost of the real-CLI pilot.
6. **One round per stage.** A rewrite may raise NEW `OPEN (designer)`
   items (writers find the next layer of edge cases). They do not open a
   second round: each carries its default, and they go into the next stage
   boundary's summary (the design-complete gate, `procedures/specs.md` section 7),
   where the designer may object. A default nobody objected to stands.

No `OPEN (designer)` item at all: skip steps 3-5. Then report the saved
documents, and ask the user for the stage-boundary
approval (requirements -> specs), unless the round's answer already gave it.
With the approval, continue with `procedures/specs.md`.

## 6. Checks on a written document

Nothing checks a design document for you, so check each one yourself before
the next document builds on it:

| Check | Do |
|---|---|
| An input changed after the pack was built | Rebuild the pack, rerun the writer, check again. |
| The stored file changed since you read it | Reconcile the two versions, then check again. Never overwrite it blind. |
| A required section is missing | The writer fixes the document (step 3); check again. |
| A credential-shaped string is in the text | Remove it (providers are named, never keyed), check again. |
| The document has grown too long to read in one pass | Compress the narrative, never the tables. |
| The document name is not in `pipeline.json` | A bug: the document name comes from `pipeline.json`. |

A revision entry takes the same checks, and also: a `change` always has its
`Changes:` line, the decision is never empty, the decision and reason carry
no markdown heading of their own, and every name on an `Affects:` line is a
design document name from `pipeline.json` (`service-spec` stands for every
service spec). A document that does not exist yet cannot carry a revision:
write it first.

A design document is never deleted to start over: it is rewritten with the
loop above, or amended with a revision entry.
