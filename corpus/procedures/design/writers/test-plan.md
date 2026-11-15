# Writer guide: test-plan

The project's test plan: what the API test suite must prove, service by
service, before any test script is written. It is derived from the spec set
alone - no live inventory is needed - so it is written as soon as the design
is complete (every document `procedures/design/pipeline.json` owes for the project
exists), in parallel with the first blueprint phase, and at the latest when
testing starts. Writing it doubles as an acceptance read of the specs: a spec
line that cannot be tested becomes a spec revision now, not a surprise at
test time. The plan never gates the design and never blocks a blueprint
phase. Writing and running the test suite are outside this guide; it only
writes the plan a suite starts from.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `use-cases` (the flows to prove end to end) and
  `microservice-definitions` (the service roster the plan must cover).
- Supplementary: `prd`, `user-stories`, every service spec
  (`service-spec-*` - their `## Business APIs` sections are where every API
  name is copied from), `auth-spec` (roles and the auth route surface),
  `notification-definitions`, `agent-hub-spec` and `bff-spec` - each dropped,
  not missing, when its platform flag is off.
- The inputs are read from `design/` like those of any other document.

## The case key and the coverage policy

- Every case the plan lists is keyed `(service, apiName)`. The `apiName` is
  copied VERBATIM from the service spec's `## Business APIs` section: the
  suite's coverage check later matches it against the APIs the blueprint
  declares, and a renamed case is a MISSING row.
- The coverage policy is: every designer API has a case, or a reasoned skip
  whose reason starts with its class (the skip classes the test report's
  skip ledger lists, e.g. `STATIC-TRANSPORT: cron-only`). The
  target is 0 MISSING; `maxMissing` states the tolerated count, and it is 0
  unless the designer settled otherwise.
- System services (`auth`, `bff`, `notification`, `agentHub`) are listed in
  `services` only when the plan tests their APIs (the auth flows almost
  always are).
- For a system service the `### <service>` section lists the BUILT-IN flows
  the suite proves (the service's built-in routes - on auth: login,
  register, verification, currentUser, the profile and role reads the
  product's actors need), one bullet per case. Every built-in the section
  does not list is out of scope by default: no case, no skip, not MISSING.
  The compiler's own conformance suite proves the platform contracts (the
  session, api-key and machine-session apis, ...); the product suite proves
  the flows the product uses. The system service's designer-authored apis
  (authored through `authentication.businessLogic`) follow the designer
  policy above and are always listed.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `test-plan` in `procedures/design/pipeline.json`; write each
exactly as given. A section that does not apply keeps its heading and reads
`N/A - <reason>`.

- `## Scope & Coverage Target`
- `## Actors & Roles`
- `## Service Flows`
- `## Cross-Service Flows`
- `## Failure & Edge Cases`
- `## Invariants`
- `## Transport-Only APIs`
- `## Environment & Data`
- `## Out of Scope`
- `## Open Questions`

## Document skeleton

````markdown
# Test Plan
## Scope & Coverage Target
<one paragraph: what the suite proves and against which environment>

```json
{
  "coverage": { "designerApis": "all", "maxMissing": 0 },
  "services": ["<serviceName>"]
}
```

## Actors & Roles
## Service Flows
### <serviceName>
<one H3 per name in "services": the happy-path chain, then one bullet per case>
## Cross-Service Flows
## Failure & Edge Cases
## Invariants
## Transport-Only APIs
## Environment & Data
## Out of Scope
## Open Questions
````

The machine block is the first json fence of `## Scope & Coverage Target`.
For a project whose roster is `orders` and `customerProfiles` and whose auth
flows are tested it reads:

```json
{
  "coverage": { "designerApis": "all", "maxMissing": 0 },
  "services": ["auth", "orders", "customerProfiles"]
}
```

- `coverage.designerApis`: `"all"`, or an integer percentage 1..100 when the
  designer settled a partial target (write why in the prose).
- `coverage.maxMissing`: an integer >= 0.
- `services`: every service of the `microservice-definitions` roster, written
  as the roster names it, plus any system service the plan tests. A roster
  service is never left out: a service without testable APIs is still listed
  and its flow section says `N/A - <reason>`.

## What each section holds

- **Actors & Roles** - the actors the suite drives (an anonymous visitor, a
  registered customer, each custom role of `auth-spec`, the superadmin) and
  which API families each one calls. Name roles exactly as `auth-spec`
  declares them. Credentials are never written here; the procedure resolves
  them at run time.
- **Service Flows** - one `### <serviceName>` per `services` entry. Under it:
  the happy-path chain (create -> read -> list -> update -> delete, or the
  service's own lifecycle), then one bullet per API case
  `- <apiName>: <actor> - <what is asserted>`. The heading names the service
  as `services` does.
- **Cross-Service Flows** - the fixture chains that cross services (a
  catalog item is created, ordered, then reviewed) and what each hop asserts.
- **Failure & Edge Cases** - role denials (the actor that must be refused),
  ownership (another user's record), validation (the required or malformed
  field), state-machine refusals (a transition from the wrong state) and
  partial writes (an action that fails after an earlier write).
- **Invariants** - what must hold after any flow: a stock never negative, a
  paid order has its payment, the read store agrees with the write store.
- **Transport-Only APIs** - the kafka / cron / internal / M2M rows: which
  ones the test transport drives, and which are skipped with a
  `STATIC-TRANSPORT` reason.
- **Environment & Data** - the mocks the test environment must run with
  (payment, decision providers, fiscal behavior), the fixtures each flow
  creates, and the story of the sample data the suite expects.
- **Out of Scope** - what the suite deliberately does not prove, each with a
  one-line reason. A system-service built-in the product does not use may
  be named here with that reason; the suite then records it as a
  `BUILT-IN-UNUSED: <reason>` skip so the
  report's ledger carries the decision - a built-in named nowhere is simply
  out of scope.
- **Open Questions** - the `OPEN (designer)` / `OPEN (platform)` items of the
  writer contract's gap policy. An untestable spec line is filed here AND
  sent back as a revision of the spec it came from.

## Structure check

The plan is structurally invalid when:

1. `## Scope & Coverage Target` has no json fence that parses to the machine
   block above;
2. a service of the stored `microservice-definitions` roster is missing from
   `services`, or `services` names something that is neither on the roster nor
   a system service (names are compared the roster way: `orderItems` and
   `order-items` are the same service);
3. `## Service Flows` has no `### <service>` heading for a name in `services`.

The other required headings follow the spec-section rule: each is present,
written exactly as listed. Check all these rules yourself before you save the
plan, against the roster in `design/microservice-definitions.md`.

## Revisions and staleness

The plan takes revisions like any design document (writer contract section
5). It is stale (`plan-stale`) when an input it was written from is
rewritten after it, or when a revision on another document names
`test-plan` in its affects list - revise or rewrite it then, before the next
full run.
