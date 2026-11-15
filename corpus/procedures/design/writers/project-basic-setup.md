# Writer guide: project-basic-setup

The project-level spec: the platform flags, the custom roles, the provider
and organization-resource decisions, a polished description and the
reasoning behind each choice. It is parsed: its flags decide which platform
specs are owed (`procedures/design/pipeline.json`), and every later spec inherits
its tenancy, roles and traffic tier.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-description-report`, `prd`, `user-stories`, `use-cases`.
- Supplementary: `interview-record` - read its Coverage Ledger (`providers`,
  `integrations`, `scale`, `tenancy`, `roles`) and settled facts directly, not
  only the report: a provider decision condensed out of the report must still
  land here.
- Canon: `procedures/design/canon/roles.md`,
  `procedures/design/canon/provider-shipped-state.md`.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `project-basic-setup` in `procedures/design/pipeline.json`;
write each exactly as given.

- `## Flags`
- `## Primary Roles`
- `## Providers`
- `## Organization Resources`
- `## Project Description`
- `## Decision Rationale`

## Document skeleton

```markdown
# Project Basic Setup

## Flags
- **hasAuthentication**: true|false
- **tenancyModel**: single|multi
- **hasNotifications**: true|false
- **hasAgentHub**: true|false
- **hasBff**: true|false
- **expectedTraffic**: low|medium|high|bigLoad

## Primary Roles
- <custom role>            (or "- (none)" - never list built-in roles)

## Providers
- <family>/<kind>: <type> - <who chose it + driving requirement>
- bucket: tier=db|native|remote[, provider=<type>] - <reason>
                           (or "- (none)" when no providers are needed)

## Organization Resources
- provider/<family>: <name> - <what it covers + who accepted it>
- enterpriseIntegration|integration: <name> - <reason>   (never a family)
                           (or "- (none)" when none were accepted)

## Project Description
<polished 2-5 sentence description>

## Decision Rationale
<why each flag / role was chosen - not parsed>
```

Write every flag line in exactly the `- **flag**: value` shape: the flags are
read by pattern, and a flag the reader cannot find falls back to its default.

## Rules

- **hasAuthentication**: true if users log in or there are distinct user
  types.
- **tenancyModel**: `multi` only for true data-isolated multi-tenancy
  (separate organizations that cannot see each other); marketplaces are
  `single`.
- **hasNotifications / hasAgentHub / hasBff**: `hasBff` is almost always
  true; declare the others only when the project needs them.
  `hasAgentHub` is for AGENTIC AI (tools, cross-service state, multi-step
  reasoning); one-shot semantic calls are in-service and need no hub.
- **expectedTraffic**: copy the tier the interview settled (the `scale`
  ledger entry) - never re-derive it - and state the driving answer in
  Decision Rationale ("expectedTraffic=high - the designer expects tens of
  thousands of consumers with launch spikes"). If the interview genuinely
  recorded no tier, set `medium` and mark it in Decision Rationale as an
  inferred open item. The flag is the decomposition budget for
  microservice-definitions and reaches every service spec - it is always
  present.
- **Primary Roles**: genuinely custom application roles only (roles canon).
  Built-ins (single-tenant `superAdmin` / `admin` / `user`; multi-tenant
  `superAdmin` / `saasAdmin` / `saasUser` / `tenantOwner` / `tenantAdmin` /
  `tenantUser`) are never listed; public-signup personas collapse to the
  built-in `user` (`tenantUser` in multi-tenant - never `saasUser`, the
  SaaS-level operator role).
- **Providers**: every provider choice the interview made, one bullet per
  family/kind: `notification/sms: twilio - designer-chosen (OTP alerts)`,
  `ai: openai - recommended default, designer accepted`. Bucket entries carry
  the TIER (`tier=db`, `tier=native`, `tier=remote, provider=s3`) - only the
  remote tier names a provider. Auth avatars never appear here (an automatic
  built-in bucket). Key ownership the interview settled rides the AI bullet
  (`ai: openai - each user brings their own key, mandatory (designer
  decision)`; `ai: openai - each workspace uses the key its admins set,
  mandatory, 20 USD a day per workspace`); a mailbox each user or company connects says so on its
  mailbox bullet the same way ("each user connects their own work
  mailbox"). If the interview settled no providers, write `- (none)`.
  Do NOT invent choices the interview did not make - a needed-but-unasked
  provider goes into Decision Rationale as an open item with the recommended
  default. Only shipped brands (provider-shipped-state canon).
  - **Every provider the designer NAMED appears here.** Cross-check the
    interview record, not just the report - a decided provider dropped here
    starves auth and notifications downstream. A deliberate exclusion is
    written as `- dropped: <provider> - <reason>`.
  - **Trap:** "email/push notifications out of scope" does NOT remove the MAIL
    provider - auth verification and password-reset emails still need the
    mail account the designer chose (`mail: sendgrid - auth transactional mail
    only`).
  - A payment capability conflict the interview settled ("switch provider" or
    "run it as a manual process") rides the provider bullet verbatim:
    `payment: iyzico - designer kept it; payouts run as a manual process
    (designer decision)`.
- **Organization Resources**: a definition the owning ORGANIZATION already
  maintains that the designer ACCEPTED in the interview (the record writes it
  as `org:<name>`). One bullet per accepted resource with its kind and its
  exact `name`: `provider/payment: corpStripe - the company's live Stripe
  account, designer accepted`. Only `provider` carries a family (one of `ai`,
  `bucket`, `notification`, `payment`, `video`, `graph`, `amqp`, `chat`,
  `mail`, `bigLoad`); `enterpriseIntegration` and `integration` take the kind
  alone - a family on them produces a rejected call downstream. Copy the name
  VERBATIM: the resource is fetched by that exact name. `- (none)` is the
  normal case.
  - The two provider sections are EXCLUSIVE by family: a family recorded under
    Organization Resources is settled and never also listed under Providers.
    An offer the designer DECLINED belongs in neither (it produced a normal
    brand choice, which goes under Providers).

## Completeness check

- All six required H2 headings are present, in order; all six flags present.
- Every provider and `org:` resource named in the interview record appears in
  exactly one of the two provider sections, or as a `dropped:` line.
- No built-in role under Primary Roles; no credential anywhere.

## Output

Write the document to `design/project-basic-setup.md` (writer contract
section 4).
