# Interview - core procedure

Harness-agnostic. This is the procedure that runs the requirements interview
(design stage D0 in `procedures/design/pipeline.json`): when it starts, how a
half-finished interview is resumed, how its one durable output - the
`interview-record` design document - is written as the conversation goes, how
the design canvas is kept, and how the interview closes. Every step names the
file it reads or writes in the working folder.

This file is the PROCEDURE. It builds on three design-corpus files and does
not repeat them - read all three before the first question:

| File | What it gives you |
|---|---|
| `procedures/design/interview-playbook.md` | The CONTENT: conversation craft, naming, the delivery-shape question, decide-and-declare, scope guardrails, what the platform provides, the discovery aids, the items that must be known before closing, the canvas maps and their mermaid rules, the completion protocol. |
| `procedures/design/interview-record.md` | The SHAPE of the `interview-record` document: required sections, the status heading, the Exchange log, Open items, the Coverage Ledger and its line format. |
| `procedures/design/writer-contract.md` | The rules every design document follows (English, no secrets, markdown only), where a design document is saved (`design/<docName>.md`) and how it is revised. |

Below, "the playbook" is the first file and "the record shape" the second.
When this procedure and the playbook describe the same step, the playbook
says WHAT to ask and write, this procedure says WHEN and in which file.

## 1. When this procedure runs

Work the design state out from the working folder: look for
`design/interview-record.md` and the other design documents under `design/`,
and compare them with the document set of `procedures/design/pipeline.json`.
When the record exists, its Settled facts carry the delivery shape.

| The design state | What you do |
|---|---|
| No design document and no record in `design/` | A fresh interview: section 2, then the conversation. |
| `design/interview-record.md` present, `## Status: in-progress` | Resume it: section 6. |
| `design/interview-record.md` present, `## Status: closed`, no `design/project-description-report.md` yet | The interview is done. Do not reopen it; go to section 8 step 5 (the second approval). |
| A document of a later stage exists in `design/` (`project-description-report` or later) | The interview is over. Run the procedure for that stage; reopen the interview only when the designer asks to re-scope the product (section 6, "Reopening a closed interview"); a designer's answer or small correction to a settled decision is a revision of the closed record (section 6), never a reopen. |
| A `project-description-report` exists but no record (a project designed before the record existed) | Its interview finished. Do not start a new one unless the designer asks to re-scope. |

A working folder without a `design/` folder is a fresh project: create
`design/` and start with section 2.

**Another session may be interviewing.** If `design/interview-record.md`
changed recently and the change is not yours (an uncommitted change, or a
recent commit by someone else in the version control of the working folder),
another session may still be talking to the designer. Ask the designer before
writing anything.

## 2. Where it runs and how questions are asked

- **The main conversation, always.** The interview is a long-lived dialogue
  with the designer, and closing it is the designer's decision. It is never
  handed to a background worker or a separate agent; the record, the canvas,
  the name and the delivery shape are all written by the session that talks
  to the designer.
- **Enumerable questions** (yes/no confirmations, provider brands, storage
  tiers, feature pick-lists, the delivery shape, the traffic tier) use the
  harness's local question UI when it has one; otherwise ask them as plain
  text with numbered options. Mark the recommended option. Open-ended
  questions stay conversational. The harness adapter says how its question
  UI maps onto this.
- **Language.** Reply in the designer's language; everything you persist
  (the record, the canvas, the names) is in English.
- **Your prose stays a discovery meeting**: no talk about documents, tools,
  stages or this procedure (playbook, section 1 "The job"). That includes
  versions, record states and write results: never "the record is at
  v1.0.2", "saved", "closed with the ledger" (a real-CLI reply opened with
  the first, #5286); say what was agreed, in product terms. When the
  designer asks to design or to continue, the first reply is the welcome (or
  the resume recap), never a report on the working folder or the design
  state.

## 3. The two project settings - name and delivery shape

Both are settled by this procedure and written into the record's Settled
facts, so a resuming session sees them; the blueprint takes them over later.

- **The name - ONCE.** After the designer's first substantive description,
  propose and settle the name (playbook section 3) and write BOTH values into
  the Settled facts: the one-word PascalCase short name and the human full
  title. Settle it exactly once per interview. A later rename request is a
  correction of a settled fact (section 5, item 3); a resumed interview whose
  record already settles the name does not ask again.
  **The designer already named the product** ("an app called ToolShare"):
  the short name is settled by them, the full name is not. Propose the full
  name in your first reply as a one-clause question and settle it on the
  designer's NEXT answer (an answer that goes on to other topics without
  objecting settles it too). Never record a full name the designer has not
  seen. The first record write (section 5, item 1) waits for that answer.
- **The delivery shape.** Ask it early (playbook section 4) and, the moment
  the answer arrives, write it into the Settled facts as `withFrontend` or
  `backendOnly`; it is also the `delivery-shape` line of the Coverage Ledger.
  Change it only when the designer changes their mind. A resumed interview
  whose record already settles it does not ask again.

## 4. Never take secrets

The interview is where a designer is most likely to paste an API key, a
password or a token. Never ask for one, never repeat one back, never write
one into the record, the canvas, a draft, a memory document or a local file.
Tell the designer, in their language, that credentials are entered later in
the settings of the hosting platform that runs the compiled application, and
record in the Settled facts only the provider's NAME and that the credential
goes to those settings. Before each write of the record, scan it for
credential-shaped strings (keys, tokens, passwords) and remove any you find.

## 5. The interview record - written as you go

The record is the interview's only durable memory: the conversation itself
is lost when the session ends. Write it as the local file
`design/interview-record.md` (the shape from the record-shape file, markdown
only).

**When - the cadence (N = 5).**

1. The first write right after the name is settled, with `## Status:
   in-progress`.
2. Then after every **5 designer answers** at the latest (count every answer,
   including answers to choice questions; writing earlier is always fine).
   **The counting unit is the topic, not the message:** a message that
   settles three topics (say, sign-up, listing and reviews) counts as three
   answers and gets three Exchange-log lines, each marked `(volunteered)`
   when you had not asked it. Every harness then writes at the same points.
3. At once after an answer that corrects a settled fact.
4. Whenever the conversation pauses, the designer says they have to go, or
   the session is about to end or be compacted - before you reply.
   **A designer who leaves ends the session** ("I have to go", "continue
   tomorrow", "let's stop here"): write the record before the reply, with
   `## Open items` saying where the conversation stopped, even if the harness
   might keep the session alive. A turn that simply ends on your next
   question is not a pause: the record cadence covers it.
5. At the close, with `## Status: closed` and the Coverage Ledger (section 8).

**How - each write is the whole document.**

- Each write replaces the whole file `design/interview-record.md`. Re-read
  the file first when another session may have changed it since your last
  write (section 1); a change you did not make is merged, never overwritten
  (see "Check before each write" below).
- **Status on the heading line, exactly:** `## Status: in-progress` or
  `## Status: closed`. The design state (section 1) is read from that line;
  no bold, no value on a separate line, no other wording.
- **Settled facts** stay current: a corrected fact is REPLACED. **Open
  items** equal what is still unanswered (`- (none)` when nothing is).
- **The Exchange log is a SUMMARY**, never a transcript: one line per
  designer answer, `Q: <question> -> A: <gist of the answer>`, in order,
  appended to what the previous write had. Nothing that carries information
  is dropped (a later session must see why a fact was settled that way); a
  deferral is logged as such ("A: deferred to us -> assumed <decision>").
- An in-progress record needs no Coverage Ledger. Only a closed record is
  held to it (section 8).

**Check before each write.** Nothing checks the file for you, so check it
yourself:

- The `## Status: ...` heading line is present and names `in-progress` or
  `closed`.
- A closed record carries the complete Coverage Ledger (section 8 step 3).
- No credential-shaped string is in the text (section 4).
- The record stays readable in one pass: when it grows long, compress the
  Exchange log (fold older lines per topic into one line each); never
  compress the Settled facts.

When the file changed under you (another session wrote it after your last
read), re-read it and MERGE: keep every Settled fact and Exchange-log line of
the stored record, add yours after them; where the two disagree on a fact,
the designer's latest statement wins, and when you cannot tell which is
latest, ask the designer; recompute Open items; if the stored record is
`closed` and yours is not, stop and ask the designer whether to reopen. When
it keeps changing under you, stop writing and tell the designer another
session is writing the record.

## 6. Resuming a half-finished interview

A new session - in this harness or another, on this machine or another -
that finds an in-progress record in `design/interview-record.md`:

1. Read `design/interview-record.md` whole.
2. Read the canvas from the record's `## Canvas` section (section 7); there
   is none when no canvas was drawn yet.
3. Greet the designer with a two-line recap of where things stand and
   continue from `## Open items`. Never re-ask a Settled fact; never re-run
   the naming or the delivery-shape question when the record already settles
   it.
4. Keep the cadence of section 5 from here on; the answer counter restarts
   at zero.

**A closed interview takes REVISIONS, not a reopen, for answers and small
corrections (#5286, maintainer ruling 1).** The answers of an open-questions
round of a later stage (`procedures/requirements.md` section 5, `procedures/specs.md`
section 7), and any later small correction of a settled decision, are
appended to the CLOSED record in its `## Revisions` section (writer contract
section 5): one revision entry per decision, a `change` (its `Changes:` line
naming the Settled fact or ledger line it changes) or an `add`, sourced
`user` for the designer's answer, with an `Affects:` line listing the documents whose content must
change. The record is not reopened and not re-closed, the Coverage Ledger is
not re-run (a revision that changes a ledger value overrides that line, the
latest revision winning), and the documents named in its `Affects:` line get a
revision of their own or, for a large change, a rewrite
(`procedures/requirements.md` section 5, step 5). The designer's "these answers
are right" is the ONE approval such a round needs.

**Reopening a closed interview** is kept for a change of SCOPE: the designer
asks to re-scope the product (a new capability area, a different product),
not to settle a few decisions. Then:

1. Write the record back to `## Status: in-progress`, keeping everything it
   had, with the new facts in Settled facts and one Exchange-log line per
   answer. FOLD the record's revisions into the body as you do (each
   revised decision written into its Settled fact or ledger line), and
   drop the `## Revisions` section.
2. Close it again with a fresh Coverage Ledger (section 8 step 3), updating
   the ledger lines the new facts touch.
3. **The approvals on a re-close.** A designer-requested re-scope runs the
   full close: the closing summary and approval 1, then approval 2. It is
   never ONE approval: that shortcut belongs to the revisions of an
   open-questions round above, which do not re-close anything.
4. The documents written from the old record are now stale: their input
   changed after them (`procedures/design/pipeline.json` names each
   document's inputs). They are rewritten from the new record by the
   requirement procedure. Staleness moves down the chain one step at a time,
   so work the design state out again after each rewrite group until nothing
   is stale.

## 7. The design canvas - four maps, kept current

The session that runs the interview produces the design canvas and keeps it
updated: up to four mermaid maps - `system` (mindmap), `services`
(flowchart), `schema` (erDiagram), `flows` (sequenceDiagram) - kept in a
`## Canvas` section of `design/interview-record.md` (before any
`## Revisions`), each map in its own mermaid code block, where the designer
can open it and correct a picture instead of answering more questions. WHEN
to update and WHAT each map contains, with its mermaid rules, is the
playbook's section 11; this is where it goes.

- **Read first.** Read the `## Canvas` section at the start of the session
  (fresh or resumed), so an update starts from what is stored.
- **Update in place.** Change only the maps that moved and keep every other
  map unchanged; each kind appears at most once. Redraw the whole canvas only
  after a pivot, and then keep every kind already shown, because detail is
  monotonic (a map kind, once shown, stays).
- **Check each map before you write.** A map whose mermaid does not parse is
  fixed before the record is written; a map grown too large to read is
  shrunk, the largest first.
- **The canvas is a picture, not the record.** Every fact it shows is also
  in the record's Settled facts. Never paste mermaid into the chat and never
  refer to "the diagram" in your prose; your reply always stands alone.

## 8. Closing - two explicit approvals

1. **Settle every item.** When every item of the playbook's section 9 has a
   real answer - from the designer, from inference, or from your declared
   decision - Open items is empty. A non-answer is not an answer: `unknown`,
   `TBD`, `not sure` and `pending`, bare or with `(assumed)`, never count.
   Decide each such item by the standard for this kind of
   product and state it as an assumption; `none` and `not applicable -
   <reason>` are decisions.
2. **Approval 1 - the interview is closed.** Present the closing summary
   (the playbook's section 12: the delivery shape, the traffic tier, the
   providers and accepted organization resources, and EVERY assumption) and
   ask whether it is complete and correct. Wait for an explicit yes. A
   correction goes back into the record and the summary is presented again.
3. **Write the closed record.** Only after that yes: `## Status: closed`,
   `## Open items` with `- (none)`, and `## Coverage Ledger` with every key
   of `requiredCoverageItems` in `procedures/design/pipeline.json`, each exactly
   once, as `- <key>: <value> (user|assumed)`. Check it yourself before the
   write: every key present, none twice, no non-answer, every source `user`
   or `assumed`. A key that fails is NOT put to the designer again: decide
   it, tell the designer the added assumptions in one sentence, and write
   again. Update the canvas a last time if the design moved.
4. **Confirm the stage moved.** Work the design state out again: the record
   is no longer owed, and the next owed document is
   `project-description-report`, whose input (`interview-record`) now exists.
5. **Approval 2 - proceed to requirement writing.** Ask, as its own
   question, whether to start writing the requirement documents now. Start
   (`procedures/requirements.md`) only after a second explicit yes. Approval 1 never
   counts as approval 2, and neither is inferred from a vague reply. A "not
   now" ends the interview here: the record stays closed and the next session
   continues from the requirement stage.

Never close preemptively, and never describe the internal machinery to the
designer ("next we write your project's documents") - ask in product terms.

## 9. After the close - a session boundary

Once the record is closed, suggest a fresh session (or a context compaction)
before the requirement documents. The interview's knowledge now lives in the
record and the canvas, not in the conversation, so the next stage loses
nothing and starts with a clean context. If the designer prefers to go on in
this session, go on.

## 10. Checklist

- [ ] Design state worked out from `design/`; the entry row of section 1
      chosen; changes by another session checked.
- [ ] Playbook, record shape and writer contract read before the first
      question.
- [ ] Name settled once, short name and full name together, in Settled facts.
- [ ] Delivery shape written into Settled facts as soon as it was answered.
- [ ] No credential taken, repeated or written anywhere.
- [ ] Record written right after naming, then at most every 5 answers, on
      every correction and before every pause or session end; a change by
      another session re-read and merged.
- [ ] Exchange log summarised, one line per answer (per topic when one
      message answers several); status on the heading line.
- [ ] Every designer role mapped to its platform role in Settled facts
      (playbook section 9, item 7).
- [ ] Canvas read at start, updated (merge) whenever the design moved.
- [ ] Approval 1 given explicitly; the record written `closed` with a
      complete Coverage Ledger (no `unknown` / `TBD` / `not sure` /
      `pending`).
- [ ] Approval 2 asked separately; requirement writing started only on an
      explicit yes.
- [ ] Session boundary suggested.
