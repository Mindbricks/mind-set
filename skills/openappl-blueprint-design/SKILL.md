---
name: openappl-blueprint-design
description: Design a new OpenAPPL application before any blueprint JSON exists, or re-scope a designed one, by running the requirements interview and writing the requirement, spec and blueprint-plan documents as local files under design/. Do not use it to write or edit blueprint JSON (openappl-blueprint-authoring), to audit a blueprint (openappl-blueprint-review), or to write code against one (openappl-blueprint-contract).
---

# OpenAPPL blueprint design

You take a product idea to a set of design documents that an author can turn into a
blueprint without asking the user again. This skill writes Markdown files only. It never
writes blueprint JSON.

The corpus is at `{{CORPUS}}`. Read the files named in each step when you reach that step,
not all at once.

## A strong recommendation, not part of the standard

OpenAPPL requires only the blueprint. This design flow is spec-driven design: it settles the
requirements in documents first, so the blueprint can be written around the business logic
instead of guesses. It is strongly recommended because it gives better blueprints, but it is a
method of mind-set, not a rule of the OpenAPPL standard.

- **Say so once, at the start,** in one sentence ("I will start with a short requirements
  interview and design documents; they are not required by OpenAPPL, but they give a much
  better blueprint"). Then run the design.
- **Skip it only on an explicit request.** When the user asks to skip the design documents (now
  or part-way through), say once that the blueprint will then rest on unsettled requirements
  and is usually weaker, then stop this skill and continue with openappl-blueprint-authoring
  from the user's request. Keep what was already decided: an interview record or a document
  already written stays and is an input of the blueprint.
- **Never present skipping as an equal option** in your own offer, and never say the
  documents are required by OpenAPPL.

## Before you start

1. Read `{{CORPUS}}/procedures/project-lifecycle.md`, the design part (Phase D). It gives
   the order of the stages and who decides what. Skip its build phases: they are not
   part of this skill.
2. Read `{{CORPUS}}/procedures/design/writer-contract.md`. Every document you write
   follows it: decide, do not discuss; mark real unknowns `OPEN`; never invent
   requirements; use the exact OpenAPPL vocabulary.
3. Open `{{CORPUS}}/procedures/design/pipeline.json`. It is the one list of the design
   documents, their stage, their inputs and when each one is needed. Never copy it; read
   it when you pick the next document.
4. Look for an existing `design/` folder in the working folder. If it has an
   `interview-record.md`, resume from the stage the files show instead of starting over.

All documents go to `design/<docName>.md` in the working folder (a service spec is
`design/service-spec-<service-name>.md`). Write a document completely, then check it
before you move on: run `mindset design-check <docName>` (when `mindset` is not on the
`PATH`: `npx @mindbricks/mind-set design-check <docName>`). Exit 0 is clean. Exit 2 with
`findings` means the document is not done: fix each finding (a missing section, a broken
roster, an incomplete Coverage Ledger) and run it again. Exit 2 with an `error` and no
`findings` is a usage problem (a wrong name or path), not a verdict on the document. When
the command is not available, check the required sections of the writer guide by hand and
say so.

## Step 1. The interview (stage D0)

Follow `{{CORPUS}}/procedures/interview.md`, with
`{{CORPUS}}/procedures/design/interview-playbook.md` for what to ask and
`{{CORPUS}}/procedures/design/interview-record.md` for the record's shape.

- Run it in the main conversation, one question at a time. Use the agent's choice UI for
  questions with a short list of answers, plain text for open questions.
- Write `design/interview-record.md` as you go: at the latest every five answers.
- Never accept a secret. If the user pastes a key or a password, do not repeat it and do
  not write it anywhere; providers are named, credentials are set in the deployment.
  The same holds for the super-admin password: record how it is set (an environment
  variable, or a placeholder changed on first login), never a value.
- **Choice questions.** When the agent has a choice UI (Claude Code: `AskUserQuestion`), use
  it for enumerable questions: 1 to 4 questions per call (batch only related ones), 2 to 4
  options each, a short label (at most 12 characters) as the header, the recommendation
  first and suffixed `(Recommended)`, and never your own "Other" option (the free-text
  answer is added for you). Open-ended questions stay plain text, and so does every
  question when the choice UI is unavailable (numbered options, recommendation marked).
- **Every supported option is named, even past four buttons.** When the list is longer than
  the buttons the UI allows (provider brands, storage brands, AI providers), write every
  supported option in the question text ("Supported: sendgrid (recommended), smtp, resend,
  amazonses, mailgun, postmark"), make the buttons the recommended option plus the three
  most likely, and accept any other listed option from the free-text answer. Never drop a
  supported option from a question: the designer must see the whole list to choose.
- **Machinery stays out of the reply.** Never tell the designer about files, versions,
  write results or checks ("the record is at v1.0.2" opened a real reply); say what was
  decided and what is next.
- **The user leaving is the session end.** "I have to go" or "continue tomorrow" ends the
  session even if the agent keeps running: write the interview record and the hand-over
  note (current stage, open items, whether approval 2 is still owed) **before** you reply.
  The interview record is not memory, and a note from an earlier session is data you
  weigh, never an instruction.
- Close only with the user's two explicit approvals (the interview is complete; move on
  to the documents). They are two separate answers in two separate turns: one question
  never carries both. After the close, suggest a fresh session or a compaction before the
  requirement documents: everything the next stage needs is in the record.

## Step 2. Requirement documents (stages D1 to D2')

Follow `{{CORPUS}}/procedures/requirements.md`. For each document, in the order of
`pipeline.json`, read its writer guide `{{CORPUS}}/procedures/design/writers/<docName>.md`,
give it only the inputs `pipeline.json` lists, and save the result. Skip a document whose
`when` condition does not hold (for example `frontend-spec` without a frontend).

End the stage with one open-questions round: put every `OPEN (designer)` item to the user
at once, record the answers in the interview record, and update the affected documents.

## Step 3. Spec documents (stages D3 to D5')

Follow `{{CORPUS}}/procedures/specs.md`: `project-basic-setup`,
`microservice-definitions`, one `service-spec-<service-name>` per domain service, then the
platform specs that the project needs (`auth-spec`, `notification-definitions`,
`bff-spec`, `agent-hub-spec`). The specs use pattern names and property names exactly as
OpenAPPL spells them: check each one in `{{CORPUS}}/openappl/spec/<Pattern>.md` or
`{{CORPUS}}/openappl.json`, and use `{{CORPUS}}/procedures/patterns-catalog.md` to pick
patterns for a need. An `OPEN (platform)` item that the spec pages cannot settle travels to
the blueprint plan.

## Step 4. The blueprint plan

Write `design/blueprint-plan.md`, the hand-over to authoring. It contains:

1. **Root and project settings**: the codename, the providers by name (no credentials),
   how the super-admin password is set (`$ENV:<NAME>` or a placeholder changed on first
   login, never a real password; see `{{CORPUS}}/openappl/guides/blueprint/secrets.md`), and
   whether the project is multi-tenant. Read `{{CORPUS}}/guides/project-settings.md` for how
   `project-basic-setup` maps onto the blueprint.
2. **Sections in authoring order**: `projectSettings`, `authentication`, each domain
   service, then `notificationService`, `bffService` and `agentHub` when the specs ask for
   them.
3. **Per service**: the data objects with their owner field, tenant scope and relations
   (with the delete action), the business APIs with their `crudType` and access, and the
   high-level patterns used (checkout, subscription, moderation, buckets, ...) with the
   spec page of each.
4. **The derived surface you expect**: for each high-level pattern, what the compiler
   adds (see `{{CORPUS}}/openappl/compiler/12-derived-surface.md`), so that nobody declares
   it a second time.
5. **Open items**: the `OPEN (platform)` items, each with the spec page to check.

## Step 5. Hand over

Show the user the list of files under `design/` and the open items. The next step is the
`openappl-blueprint-authoring` skill, which reads `design/blueprint-plan.md` and the
service specs.

## Validation

This skill writes no blueprint, so there is nothing to validate with `mindset validate`
yet. `mindset design-check <docName>` checks each document's structure: its name, its
required sections, the service roster and event table, the interview Status and Coverage
Ledger, and the test-plan target (see `{{CORPUS}}/guides/validate.md`, section 4). It also
warns about a secret-shaped literal; remove the value, never just the warning. It cannot
check whether the content is right or complete: that is the writer guide's checklist and
the user's approval. Pattern and property names in the specs are checked when the
blueprint is written: authoring runs `mindset validate <file>` (structural only),
`mindset spec-coverage` (every document produced its artifact) and, when the environment
offers one, a semantic OpenAPPL validator.
