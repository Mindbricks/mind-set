# Interview record - shape and ledger rules

The `interview-record` design document is the durable record of the
requirements interview: the settled facts in the designer's terms, a
summarised log of the exchange, what is still open, and - once the interview
closes - the Coverage Ledger. It is a SOURCE document (stage D0 in
`procedures/design/pipeline.json`): the project-description-report writer reads it
as its full interview input, and user-stories, prd, frontend-spec, use-cases
and project-basic-setup read it as a supplementary input.

It is not a transcript. No harness can reliably export its own conversation,
so the session that runs the interview WRITES this record incrementally; any
harness can then read it and continue. That is how an interview started in one
harness (or one session, or one machine) is finished in another.

How the interview is run is in `procedures/design/interview-playbook.md`; the rules
every design document follows are in `procedures/design/writer-contract.md`.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `interview-record` in `procedures/design/pipeline.json`;
write each exactly as given. `## Status` carries its value on the heading line
(`## Status: in-progress` or `## Status: closed`), which still counts as the
`Status` heading.

- `## Status`
- `## Settled facts`
- `## Exchange log`
- `## Open items`

A CLOSED record additionally carries `## Coverage Ledger` (below); an
in-progress record may omit it. A closed record may also end with a
`## Revisions` section (below), appended only as revision entries, never typed into the body.
Any record may also carry a `## Canvas` section (below), placed before any
`## Revisions`.

## Document skeleton

```markdown
# Interview record - <project full name>

## Status: in-progress

## Settled facts
### <topic>
- <fact, faithful to the designer's wording, in English> (user)
- <fact you decided or inferred and stated to the designer> (assumed)
### Users and roles
- <designer's word for a role or persona> -> <platform role> (user|assumed)
- site owner -> saasAdmin (assumed)
- member -> tenantUser (user)
### Providers
- email: sendgrid (user)
- file storage: platform-hosted bucket, medium tier - no provider (user)
- payments: stripe (user)

## Exchange log
1. Q: <the question, one line> -> A: <the gist of the designer's answer>
2. Q: (volunteered) -> A: <a topic the designer settled without being asked>
3. ...

## Open items
- <core item not yet answered>

## Coverage Ledger
- delivery-shape: <value> (user|assumed)
- ...

## Canvas
### system
    (one mermaid block per map kind: system, services, schema, flows)
```

## Section rules

- **Status** - `in-progress` while the interview runs (and when it pauses);
  `closed` only after the designer confirmed the closing summary (see the
  playbook's completion protocol). A closed record takes the answers of a
  later open-questions round, and small corrections, as REVISIONS (below)
  and stays closed. It is reopened only for a designer's re-scope: write
  `in-progress` again, and close it again with a fresh ledger and the full
  two approvals (`procedures/interview.md` section 6).
- **Settled facts** - grouped by topic (the product, users and roles, core
  entities and lifecycles, end-to-end flows, rules, money, integrations and
  providers, reporting, notifications, delivery and frontend structure, scale,
  acceptance expectations). Faithful to what the designer said, in English
  even when the conversation is in another language. Every fact you did not
  get from the designer is marked `(assumed)` - an assumption is a stated
  decision, never a silent invention. A fact the designer corrected is
  REPLACED, not kept beside the correction.
  **Role mappings are Settled facts (#5272).** Every role or persona the
  designer named gets one line mapping it onto a platform role
  (`<designer's word> -> <platform role>`), under the users-and-roles topic,
  even when the mapping was never discussed aloud (the playbook's section 9,
  item 7). The writers take the mapping from here; a mapping missing from
  the record is a mapping every writer re-decides.
  **A provider choice that needs no provider** (a platform-hosted bucket,
  files stored in the database) is still a settled provider line: name the
  capability, the tier, and "no provider", as in the skeleton. The same
  shape goes into the `providers` ledger line.
- **Exchange log** - a SUMMARY: the gist of each designer answer (question ->
  answer), in order, one line each. The unit is the TOPIC: a message that
  answers several topics gives one line per topic, marked `(volunteered)`
  when the topic was not asked; this is also the count behind the write
  cadence. Not word for word, but nothing that
  carries information is lost: a later session must be able to understand why
  a fact was settled the way it was. Never paste secrets (see below).
- **Open items** - the core items not yet answered; `- (none)` when the
  interview is ready to close. A new session resumes from here.
- **Coverage Ledger** (required in a closed record) - one line per ledger key,
  in this order, each exactly once:

  - `delivery-shape`
  - `domain`
  - `data`
  - `rules-processes`
  - `end-to-end-flows`
  - `integrations`
  - `auth`
  - `tenancy`
  - `roles`
  - `providers`
  - `frontend-structure`
  - `scale`
  - `reporting-surface`
  - `notification-moments`
  - `acceptance-expectations`

  These keys equal `requiredCoverageItems` in `procedures/design/pipeline.json`.
  Line shape: `- <key>: <value> (user|assumed)`. The value is the DECISION in
  one short line - a real value, never a label. `unknown`, `TBD`, `not sure`,
  `pending` and similar non-answers are refused: if the designer never said,
  DECIDE it by the standard for this kind of product, state it, and mark it
  `assumed`. `none` and `not applicable` ARE decisions: `integrations` may be
  `none`, and on a backend-only project `frontend-structure` is
  `not applicable - backend-only delivery`. A capability that needs no
  provider is written as such (`- providers: email sendgrid; file storage
  platform-hosted bucket, medium tier, no provider (user)`). Extra
  lines for anything else worth carrying forward are welcome after the
  required keys.
  **Which source.** `user` = the designer stated it, or explicitly answered
  that specific proposal ("reviews are one per loan - right?" "yes"), or
  answered it in an open-questions round. `assumed` = you decided it, even
  when the designer later approved the closing summary that listed it:
  approval 1 accepts the summary as a whole, it does not turn each
  assumption into the designer's own decision. Downstream writers treat an
  `assumed` value as a default they may flag, a `user` value as settled.

- **Canvas** (optional) - the design canvas of the interview playbook,
  section 11: one `### <kind>` heading per map (`system`, `services`,
  `schema`, `flows`, in that order), each with its mermaid block. It sits
  after the required sections and the Coverage Ledger, and before any
  `## Revisions`. It is not a required section and the ledger check ignores
  it.
- **Revisions** (a closed record only; #5286) - the trailing
  `## Revisions` section of decision addenda, in the shape of the writer
  contract, section 5: `### R<n> - <change|add> (<YYYY-MM-DD>, <user|assumed>)`,
  then `Changes: <the Settled fact or ledger line it changes>` for a change,
  the decision, and `Affects: <the documents that must reflect it>`. It is
  appended ONLY as a revision entry - never typed into the body of a
  rewrite - and a revision on a closed record does not reopen it or re-run
  the ledger check. Every reader applies
  it: a revision overrides the fact or ledger value it targets, the latest
  revision winning. A `(user)` revision is the designer's own decision, as
  an answer from an open-questions round always was. When the record is
  rewritten anyway (a re-scope), its revisions are FOLDED into Settled facts
  and the ledger, and the rewritten record carries no `## Revisions`
  section.

## Writing the record

- Write it as the file `design/interview-record.md`. When the file changed
  since you last read it, another session wrote it: re-read, merge, write
  again.
- Write incrementally: after every few designer answers, at every pause, and
  before the session ends. A record that is only written at the end is lost
  with the session.
- A `closed` record is incomplete (`LEDGER_INCOMPLETE`) when its Coverage
  Ledger misses a key, repeats one, carries a non-answer, or has a source
  other than `user` / `assumed`: check the ledger before you close the record.
- **No secrets.** If the designer pastes an API key, a password or a token,
  never write it here (or anywhere): note that a credential was offered and
  that it is configured on the hosting platform instead.
