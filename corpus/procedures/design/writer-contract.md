# Design document writer contract

Every writer guide under `procedures/design/writers/` follows this contract, and so
does the interview record (`procedures/design/interview-record.md`). It is
harness-neutral: the same text is read by a local coding agent, the cloud
harness and any other harness that loads the bundle. How a harness runs a
writer (a separate worker, a sub-task, or the main conversation) is decided by
the procedure that runs it, never here.

The document set, the order, each document's inputs and its gate live in
`procedures/design/pipeline.json`. A guide never copies that table; it names the
inputs it expects and points at the file.

## 1. What you read (the narrowing rule)

A writer reads ONLY:

1. the inputs `pipeline.json` declares for its document - `inputDocs` (required)
   and `extraInputs` (supplementary: another design doc; an entry that names
   live platform state is skipped) - read from `design/<docName>.md` or as
   handed to it by the running procedure;
2. its own writer guide and the canon files that guide names under
   `procedures/design/canon/`;
3. the local reference corpus (the pattern pages `openappl/spec/<Pattern>.md`,
   `openappl.json`, `procedures/patterns-catalog.md`) to look up exact vocabulary.

It does NOT read the blueprint file, sibling design documents that are not its
inputs, the project's source code, or the chat history of the session. The
point is reproducibility: two writers given the same inputs write the same
document. A supplementary input that could not be fetched is reported as
missing by the inputs package; write without it and say so under
`## Open Questions` (or the document's equivalent section).

## 2. How you decide

- **Extract, then decide.** Everything you write is grounded in the inputs.
  Never invent requirements the inputs do not carry.
- **Decide, don't discuss.** Each section states the decision, a one-line
  rationale where the choice is not the default, and concrete values.
  "Could use X or Y" is a defect: the stage that reads your document
  transcribes it, it does not choose.
- **OPEN, never invented.** A genuine unknown, or a concept the reference
  vocabulary cannot express, is written down marked `OPEN` and collected under
  the document's open-questions section. It is never paraphrased into
  pseudo-configuration.
- **One gap policy for every writer (#5272).** Where the inputs leave a gap,
  classify it before you write it; every guide follows the same three
  kinds, so two writers given the same inputs file the same gap the same way:

  | Kind | What it is | How you write it |
  |---|---|---|
  | Proposed default | A detail with a standard answer for this kind of product that ADDS to the product and changes no rule, right, money flow or scope (an accessibility level, a list's default sort, an extra confirmation email) | Decide it, write it inline marked `(proposed)`. Not an OPEN item. |
  | OPEN - designer | A PRODUCT decision the inputs do not settle, where a reasonable designer could choose differently and the choice changes behaviour, rights, money or scope (what suspension does to running loans, how an admin account is created, a missing time window) | `OPEN (designer): <the question> - default: <the answer you would pick>`, collected in the open-questions section. Write the rest of the document on the default, so it stays usable. |
  | OPEN - platform | Whether OpenAPPL supports something (a pattern option, a provider capability, a route the compiler ships) | Resolve it yourself from the pattern pages (`openappl/spec/`) and the canon first. Only what they cannot settle is written `OPEN (platform): <what to verify> - verify at blueprint`. It is never put to the designer. |

  A product decision is never hidden as `(proposed)`, and a proposed default
  is never raised as OPEN. The running procedure puts the `OPEN (designer)`
  items to the designer in one round per stage and routes the answers back
  through the interview record; the `OPEN (platform)` items travel to the
  blueprint phase.
- **The record's role mapping is binding.** The interview record's Settled
  facts map every designer role onto a platform role
  (`<designer's word> -> <platform role>`). Use exactly that mapping. When
  your document needs a mapping the record does not carry, that is an
  `OPEN (designer)` item with your default, never a silent choice.
- **Ontology vocabulary.** Architectural statements use the exact vocabulary
  of the ontology (`openappl/ontology/` and `openappl/spec/`): `DataTypes` names, action type
  names, hook milestone names, pattern configuration keys, enum literals. Use
  the vocabulary; never copy reference text into the document.
- **One casing per enum, project-wide.** Prefer lowercase; status enums use
  passive forms (`approved`, `rejected`, `escalated`). Every document that
  names the value uses the same string.
- **Calibrate, do not over-apply.** The rules in the guides are the lessons of
  earlier projects. Apply them where the project has the shape they describe;
  do not add `OPEN` markers, caveats or sections for concerns the project does
  not have.

## 3. What you write

- **Markdown only**, in English, whatever language the designer used in the
  conversation. No JSON or JS document bodies (a fenced `json` block inside the
  markdown is fine where a guide asks for one).
- **No secrets.** Provider credentials are never written into a design
  document: providers are referenced by NAME, credentials are configured on
  the hosting platform. If an input carries a key, token or password,
  leave it out and note that it was omitted.
- **The required sections.** Each guide has a `## Required sections` list:
  the H2 headings the published document must carry, exactly as written. The
  list equals `requiredSections` for the document in `pipeline.json` (a test
  keeps them equal). The heading is what counts: a section with nothing to say
  carries `- (none)` or `N/A - <reason>` under its heading, it is never
  dropped. Sections a guide's skeleton adds beyond the required list are part
  of the document's shape too; write them unless the guide says they are
  optional.
- **Size.** Tables beat prose. If a document is genuinely large, compress the
  narrative, never the tables.

## 4. Where it goes

1. Write the complete document body to `design/<docName>.md` in the working
   folder (for a service spec the stored name, `service-spec-<key>`). Nothing
   else is written: no blueprint edit, no other document.
2. Check the document against the guide's `## Required sections` and its
   completeness check before handing it back: every required H2 heading is
   present and written exactly as listed, and every completeness item holds.
   A missing section is a defect: add it and check again.
3. When the file changed since you read it (someone else wrote it), re-read
   it, reconcile, and write it again. When a separate orchestrator runs the
   writer, the orchestrator saves the document; when the writer runs in the
   main session, it saves it itself.

## 5. Revisions - decisions added after publication (#5286)

A published design document may carry REVISIONS: dated decision addenda
appended in a trailing `## Revisions` section. They exist so that a few
settled defaults or a small correction do not rewrite a whole chain of
documents. A revision is appended to the document's trailing `## Revisions`
section by the running procedure, never by rewriting the body, and never
typed into a document by a writer. Each entry reads:

```markdown
## Revisions

### R1 - change (2026-09-26, user)
Changes: <the heading or decision it changes>
<the decision, in markdown>
Reason: <why, when given>
Affects: <other design documents that must reflect it>

### R2 - add (2026-09-26, assumed)
<a new decision the body did not carry>
```

- `change` names what it changes (`Changes:`, required for a change); `add`
  adds a decision the body did not have. `source` is `user` (the designer
  decided it) or `assumed` (you decided it), with the same meaning as the
  interview record's ledger sources. Date every entry (UTC) and number it
  `R<n>`, one higher than the document's last revision.
- **No headings inside a revision.** An entry's target, decision and reason
  carry no level 1-3 markdown heading (`#`, `##`, `###`), and a change always
  names its target and carries a decision. Use lists, tables and bold text
  instead.
- In `affects`, `service-spec` names every stored `service-spec-<key>`; the
  other names are design document names from `pipeline.json`.
- `## Revisions` is not one of a guide's required sections: a document
  without revisions has no such section, and the structure checks ignore it.
- **What a revision cannot change: parsed structure.** Some facts are read
  from a document's BODY, and a revision never reaches them. The
  service roster is the first `json` fence of `microservice-definitions`:
  adding, removing or renaming a service is a REWRITE of that document,
  never a revision. The same holds for any change a structure rule of
  `pipeline.json` reads.

**Reading revisions (every writer, every input).** A document's revisions
are part of that document. When an input in your pack carries a
`## Revisions` section:

1. a revision OVERRIDES the body text it targets; for the same target the
   LATEST revision (the highest `R<n>`) wins;
2. an `add` revision is a decision of that document like any in its body;
3. read the revisions of EVERY input, not only the interview record, and
   write your document on the revised decisions.

**Rewriting a document that has revisions: FOLD them.** When your own
document is rewritten (it went stale, or a revision's change was too large
for another revision), write the revised decisions INTO the body where
they belong - the target section, in the section's own shape - and publish
WITHOUT the `## Revisions` section. The folded body must say everything
the body plus its revisions said; nothing is lost and nothing is kept
twice.

**Who adds revisions, and when** (the running procedure, never a writer):
the open-questions round of a stage and later small corrections record the
designer's answers as revisions on the interview record, with `affects`
naming the documents whose content must change; each document named in
`affects` then gets a revision of its own - or a rewrite, when the change
is large. A change of SCOPE is not a revision: it re-scopes the interview
record and rewrites the chain (`procedures/interview.md` section 6).
