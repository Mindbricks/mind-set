# Validating a blueprint

There are two kinds of validation, and they answer different questions:

- **Structural**: is this document shaped like an OpenAPPL blueprint? Every key is a
  property the schema knows, every value has the right type, every enum value is allowed,
  every required field is there. `mind-set validate` answers this.
- **Semantic**: does this blueprint mean something a compiler can build, and is it safe?
  An ownership check needs an owner field; a required column needs a value on create; a
  public API should not carry a role gate it switches off. Only a validator that knows the
  rules of the language answers this.

A blueprint that passes the structural check can still be refused by a compiler, or
compile into a system that does the wrong thing. Treat a clean structural result as
"ready for the semantic check", never as "correct".

## 1. What `mind-set validate` checks

```
mind-set validate <blueprint-file>
```

When the `mind-set` command is not on the `PATH` (the package was run with npx and not
installed globally), run `npx @mindbricks/mind-set validate <blueprint-file>` instead.

It reads the file as JSON and walks it against `openappl.json`, the OpenAPPL schema that
ships with the corpus (`../openappl.json`):

| Check | What it catches | Example |
|---|---|---|
| Root | the document is not a JSON object whose root is a `Project` (the schema's legacy root alias is accepted too) | a file that holds one service instead of a project |
| Unknown properties | a key that the pattern at that path does not define | `authOptions.ownerCheck` instead of `authOptions.ownershipCheck` |
| Types | a value of the wrong type: string for boolean, object for array, number for string | `"loginRequired": "false"` |
| Enum values | a value outside the schema's list for that field | `"crudType": "read"` (allowed: `create`, `get`, `list`, `update`, `delete`) |
| Required fields | a field the pattern requires is missing | a data object without `objectSettings.basicSettings.name` |

Each finding names the JSON path and the rule, for example
`services[0].businessLogic[1].basics.apiOptions.crudType: enum value "read" is not allowed`.
The exit code is non-zero when there is at least one error, so the command works in a
script or a CI job.

It also **warns** about secret-shaped literals: a string in a credential field (a key that
ends in `password`, `secret`, `apiKey`, `privateKey`, `accessKey` or `token`) that is
not `$ENV:<NAME>`, `ENTER_CREDENTIAL` or a placeholder, and any value shaped like a
credential (a private-key block, a provider key with a well-known prefix, a JWT, a
password inside a URL). A warning never fails the check, and it never repeats the value.
It cannot tell a real password from a made-up one, so treat every such warning as a leak
until you know otherwise (see section 6 of `review.md`).

An unknown property is an error, not a warning. A misspelled key is not ignored by the
compiler: either it refuses the blueprint, or, worse, it builds without the setting you
meant to write. Fix it by looking the property up on its spec page
(`../openappl/spec/<Pattern>.md`) or in `openappl.json`; never by guessing another
spelling.

## 2. What it cannot check

The structural check sees one value at a time. It does not see relations between values,
between elements, or between the blueprint and the generated system. These are all out of
its reach:

| Kind of rule | Example of a semantic rule (code of the reference validator) |
|---|---|
| A setting that needs another element | `ownershipCheck` on an object that has no owner field (`OWNERSHIP_CHECK_WITHOUT_OWNER_FIELD`) |
| A value that must come from somewhere | a required property that a create API never writes (`MISSING_DATA_CLAUSE_ITEM`) |
| Two settings that contradict each other | a required foreign key whose relation sets it to null on delete (`RELATION_SETNULL_ON_REQUIRED_FK`) |
| A setting that another one switches off | roles on an API with `loginRequired: false` (`PUBLIC_API_WITH_ROLE_GATE`) |
| Response shape and exposure | an owner-checked write that answers with the full stored row (`OWNERSHIP_WRITE_RESPONSE_UNBOUNDED`) |
| References by name | a relation to an object or service that does not exist (`RELATION_TARGET_SERVICE_NOT_FOUND`) |
| Expressions | MScript that does not parse, or compares an enum property with a value it can never have (`MSCRIPT_ENUM_LITERAL_UNKNOWN`) |
| The derived surface | a declared API whose name collides with one a high-level pattern adds (`API_NAME_COLLISION`) |
| Events | a published topic nobody consumes (`TOPIC_NO_CONSUMER`, a warning that is often intended) |

The review checklist (`review.md`) lists the rules that matter most, with the reason and
the fix for each.

## 3. Getting semantic validation

Use the first of these that your environment offers:

1. **A semantic OpenAPPL validator**: a validator service for OpenAPPL, or the validation
   tool of a compiler or hosting platform you are connected to. It reports the rules of
   section 2 with their codes. A blueprint it accepts is one its compiler builds.
2. **A compiler run**: compile the blueprint with an OpenAPPL compiler. The compiler
   validates before it generates; read its errors and warnings.
3. **Neither available**: run `mind-set validate`, then walk `review.md` over the
   blueprint by hand. Say plainly in your report that the semantic rules were checked by
   reading, not by a validator.

## 4. Checking the design documents and their coverage

Two more local checks work on the files the design and authoring skills write. Like
`validate`, they need nothing but the corpus.

```
mind-set design-check <docName> [<draft.md>]
mind-set spec-coverage [<blueprint.json>]
```

**`design-check`** checks one design document (default `design/<docName>.md`) against the
design pipeline (`../procedures/design/pipeline.json`):

| Rule | What it catches |
|---|---|
| Name | a document name that is neither a pipeline name nor `service-spec-<service>` |
| Required sections | a `requiredSections` heading missing as an H2 (outside code fences) |
| Service roster | `microservice-definitions` without a JSON roster of `{ "name" }` entries, or without a table under `## Event Contracts` |
| Interview record | a `## Status` that is not `in-progress` or `closed`; a closed record whose Coverage Ledger misses an item, repeats one, leaves one unsettled or gives no source |
| Test plan | a coverage target that is not `{ coverage: { designerApis, maxMissing }, services }`, a roster service the plan does not list, a service without its `### <service>` flow (the roster is `design/microservice-definitions.md`, or `--roster`) |

It exits 0 with no finding and 2 with findings; a usage error also exits 2, and its
`--json` report then has `error` and no `findings`. It warns about secret-shaped literals
in the document, as `validate` does, without changing the exit code. It cannot check
whether the content is right, the size limits of a document store, or a service-spec name
against a published roster; the report lists what it did not check (`notChecked`).

**`spec-coverage`** proves that every document in `design/` produced its artifact in the
blueprint (default `blueprint.json`): `project-basic-setup` -> `projectSettings`,
`auth-spec` -> `authentication`, `microservice-definitions` -> at least one service,
`service-spec-<name>` -> that service, `bff-spec` -> `bffService.dataViews`,
`notification-definitions` -> `notificationService.eventNotifications`, `agent-hub-spec` ->
`agentHub.aiAgents`. Narrative documents (`prd`, `use-cases`, `user-stories`, the
interview record, the test documents) produce no artifact by design. A document with no
rule is a gap (`UNMAPPED`). An empty target is a gap (`EMPTY`) even when someone said it
was being written. A gap is cleared only by a recorded decline:

```
mind-set spec-coverage --declare bff-spec --reason "the client reads one service" --by "designer"
```

The decline goes to `design/spec-ledger.json` with the reason, who decided and when, so a
later session reads the decision instead of re-opening it. A chapter that has content but
not the collection the rule reads is an `ERROR` (the rule cannot see the artifact; a
decline does not clear it). The frontend document is `NOT_CHECKED`: the frontend is not
part of the blueprint. Exit 0 = covered, 1 = a gap or an error, 2 = a usage error. It
checks that each target exists, not that it says what the document asks for: that is the
review.

## 5. Reading validator output

- **Errors** stop the compilation, or would make the generated system wrong. Fix all of
  them.
- **Warnings** are likely mistakes. Fix them, or state in the element's `description` why
  the blueprint is right as written, so the next reviewer does not report it again.
- **Informational** findings describe a consequence you may want (for example an event
  that no service consumes yet). Read them once.
- A finding names a JSON path. Fix the element at that path, validate again, and do not
  batch many fixes into one edit: one fix can change the findings of others.
