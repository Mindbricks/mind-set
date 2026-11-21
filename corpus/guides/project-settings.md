# Project settings and providers

How to turn the design document `project-basic-setup` into the project-level part of a
blueprint: `projectSettings`, the roles and tenancy of `authentication`, and the provider
entries. It is the first block of authoring. It runs before any service is written,
because the patterns of the services validate against what it declares.

Use it with `../procedures/blueprint-authoring.md` (section 4 orders the writes), and
read [Secrets in a blueprint](../openappl/guides/blueprint/secrets.md) before you write
any credential value.

## 1. Classify before you write

Someone else may already have edited the blueprint: another author, an earlier session, a
session that stopped between two writes, a second machine, a script that applied part of
the settings. Nothing in the file says so. Before you author a family, **read** what is
there (the narrowest path that answers: `projectSettings`, and the role settings under
`authentication.accessControl`) and put each family the spec requires in exactly one
class:

| Class | What it means | What you do |
|---|---|---|
| ABSENT | nothing is there | author it |
| PRESENT, matching the spec | someone already applied what this spec asks for | **adopt** it: write nothing, and report it as "adopted, not authored" |
| PRESENT, diverging | something is there and it is not what the spec says | **stop**. Show the user both shapes side by side and let them decide. Never merge over it |

Why a rule and not a habit: in a measured delivery a part of the settings (both provider
families, but not the roles or the tenancy) had been applied by another writer with no
marker anywhere. The two shapes happened to be identical, which is the worst kind of near
miss: the collision never ran, and the next project's shapes will differ. A write that
happens to produce the same bytes is still a write nobody can tell apart later.

Adoption is not approval. Report **what** you adopted and that you did not author it:
pre-applied state is a signal about the project, not only about this step.

A read of the `authentication` chapter carries the seeded super-admin password. Read the
narrowest path you need, and never copy the chapter (or the whole blueprint) into a note,
a log or a design document. See [Secrets in a blueprint](../openappl/guides/blueprint/secrets.md).

## 2. From the design document to blueprint paths

Not every field of `project-basic-setup` is a blueprint field. Three of the five flags
gate later **steps** and stay in the document.

| Document field | Blueprint target | Note |
|---|---|---|
| `hasAuthentication` | `projectSettings.basicSettings.hasAuthentication` | |
| `## Project Description` | `projectSettings.basicSettings.description` | write it when the document's description is better than the stored one |
| `tenancyModel: multi` | `authentication.loginDefinition.tenantSettings`: `{ "useMultiTenantFeature": true, "configuration": { "tenantName": ... } }` | set the model **and** `tenantName` in the same write: `tenantName` is required whenever the model is on (`AUTH_TENANT_NAME_REQUIRED`). It is the designer's own word for the groups (the interview's tenancy fact, for example `neighborhood`), lower-first. The rest of the tenant configuration belongs to the authentication spec |
| `tenancyModel: single` | nothing: `useMultiTenantFeature` stays false or absent | verify by reading |
| `## Primary Roles` | `authentication.accessControl.roleSettings`: `{ "rbacIsActive": true, "configuration": { "roleItems": [...] } }` | **custom roles only**. The built-in roles (single tenant: `superAdmin`, `admin`, `user`; multi tenant: `superAdmin`, `saasAdmin`, `tenantAdmin`, `tenantOwner`, `tenantUser`, `saasUser`) are system-defined and never authored. `- (none)` means no write |
| `hasNotifications`, `hasBff`, `hasAgentHub` | **not blueprint fields** | step gates: they decide whether the notification wiring, `bffService` and `agentHub` are authored later (see [Delivery discipline](delivery.md)) |
| `expectedTraffic` | **not a blueprint field** | a design-time budget; record it in the report and write nothing |

Merge, never replace. `projectSettings` and `authentication` carry compiler-stamped and
seeded content (the super-admin identity, defaults). Editing them wholesale destroys it, so
change the named members in place and leave the rest as it is. An array you write whole
**replaces** the array that is there: a provider family written as a complete array over a
family someone else authored is a blind overwrite (section 1).

## 3. Providers

Parse the provider bullets of the document into a **needs inventory** first (scaffold,
then fill): one row per bullet with its family, brand or name, and any decision that rides
on the bullet (a bucket tier, a capability ruling such as "payouts run as a manual
process"). The inventory is the completeness baseline of section 6. Carry the section 1
class onto every row before you author it.

### Where each family lives

The section, array and brand-field names do **not** all follow the `<family>Providers`
pattern. Read the table; do not derive a path.

| Family (the spec's word) | Section under `projectSettings` | Array | Brand field |
|---|---|---|---|
| notification (email, sms, push, whatsapp, telegram) | `notificationProvidersSettings` | `notificationProviders` | `provider` (+ a per-entry `kind`: the channel) |
| ai | `aiProvidersSettings` | `aiProviders` | `provider` |
| bucket (`tier=remote` only) | `bucketProvidersSettings` | `bucketProviders` | `provider` |
| payment | `paymentProvidersSettings` | `paymentProviders` | `provider` |
| video | `videoProvidersSettings` | `videoProviders` | `provider` |
| invoice | `invoiceProvidersSettings` | `invoiceProviders` | `provider` |
| fiscal | `fiscalProvidersSettings` | `fiscalProviders` | `provider` |
| decision | `decisionProvidersSettings` | `decisionProviders` | `provider` |
| graph | `graphProvidersSettings` | `graphProviders` | `provider` |
| amqp | `amqpProvidersSettings` | `amqpProviders` | `provider` |
| mail **accounts** (inbound mailboxes, section below) | `mailAccountsSettings` | **`mailAccounts`** | **`platform`** |
| big data | `bigLoadProvidersSettings` | **`bigLoadStores`** | **`engine`** |
| social login | `socialLoginProvidersSettings` | `socialLoginProviders` | `provider` (**one entry per brand**) |

- A social login entry's `configuration` is a fixed-shape **object** (`clientId`,
  `clientSecret`, ...), not the named-entry array below.
- There is **no chat family**. Chat bots are retired. A chat surface (an agent's
  `endpointSettings.chatSurfaces[]`, or the gateway assistant's) names a WhatsApp or
  Telegram **notification provider** in `provider`, and that provider owns every credential
  of the channel.
- The keys of each brand, with type, secret flag, required flag, allowed values and
  either/or groups, are in the provider pages of the specification
  (`../openappl/spec/providers/<family>.md`). Never write a key name from memory.

### Entry mechanics

- Write **one array per family**: several bullets of one family make one write.
- `configuration` is an **array** of named items; each item needs `name` and `value`
  (and `secret` where the key is secret).
- Every entry carries a stable, readable `name` (`mainEmailProvider`, `smsProvider`). That
  name is what the patterns of the services reference.
- **`default*ProviderName` is a reference.** Point it at the declared entry's `name` (the
  single entry of its kind), or leave it **absent**. Never write a placeholder string into
  it: an absent key is unset, a dangling reference fails every service build.
- Credentials: see [Secrets in a blueprint](../openappl/guides/blueprint/secrets.md). A
  required key that is not a secret is never guessed (that page says what to do).

### Two mail surfaces, never interchangeable

Match the **requirement**, not the word in the bullet. This is the most expensive mistake
of the provider step, because nothing fails when you get it wrong.

| The spec says | It means | It goes in |
|---|---|---|
| `mail: sendgrid`, `mail: smtp`, "email provider", "transactional email", "send verification mails" | an **outbound** send channel | `notificationProviders[]` with `kind: "email"` |
| "the support@ mailbox", "read incoming mail", "reply on behalf of", "watch the invoices@ inbox" | a **bidirectional** mailbox the project owns | `mailAccounts[]` |

A bare `mail: <brand>` bullet is an email notification provider unless the bullet describes
reading or replying from a real inbox. The brand settles it when the wording does not:
`mailAccounts[].platform` accepts exactly `imapSmtp`, `gmail` and `microsoftGraph`, which
are mailbox connectors. `sendgrid`, `resend`, `smtp`, `amazonses`, `mailgun` and `postmark`
are `notificationProviders[].provider` values and are not mailbox platforms at all.

Whose mailbox is it? `ownerScope` settles it. A mailbox the **project** owns (the support@
inbox of the product itself) is a plain entry: `ownerScope` absent, `address` set. A
mailbox each **customer** brings ("each company connects its info@", "users connect their
work mailbox") is a **template**: `ownerScope: "tenant"` (a multi-tenant project) or
`"user"` (needs authentication), with no `address` and only the OAuth application and the
server in `configuration`. See
[Connected mailboxes](../openappl/guides/capabilities/connected-mailboxes.md).

**The failure mode, named: nothing is red.** Put the email provider in `mailAccounts[]`
and the project ships with **no email send channel**. A compiler's mail fallback is built
in: with the channel's credentials incomplete, or the channel absent, every notification
and verification mail goes to a local sink. What happens next depends on where the service
runs, and the two outcomes look nothing alike:

- where the sink is available, the send lands in it and **reports success**: no
  validation error, no build failure, no bounce; verification codes simply never arrive;
- where it is not, the sends **fail loudly** (a connect timeout, one failed delivery row
  per message), which reads like an outage but is the same missing channel from the other
  side.

Neither outcome is delivery. A green send is never proof that mail arrived: check the
channel, not the send's status. Settling it here is the only cheap moment.

### Whose credential is it?

Three spec phrasings look like "store a secret per customer" and are tempting to
hand-build with a key column on a data object or a custom variable per user. Never do
that: each has a setting, and the blueprint carries no secret at all.

| The spec says | It is |
|---|---|
| "each user (or company) uses their own OpenAI / Anthropic key", "BYOK", "customers pay their own AI usage" | `credentialScopes` on the AI provider entry |
| "each workspace / team / company account uses its own AI key, set by its admins, used by its members" | `credentialScopes.resource` on the AI provider entry, naming the workspace data object |
| "each user connects their work mailbox", "each company connects its info@" | a mail account template (`ownerScope`), above |
| "test accounts in development, live account in production", "mock payments while we develop" | the sandbox / live credential sets and `credentialMode` of the provider family |

A spec bullet carries the decision in words (`ai: openai - each user brings their own key,
mandatory`). Read it with this mapping: **mandatory** is `required`; "may use their own" is
`optional`; "each company" is the `tenant` level in a multi-tenant project; "each
workspace" (or "each company" when a user may belong to several) is the `resource` level.
The fields are on [`AiProviderCredentialScopes`](../openappl/spec/AiProviderCredentialScopes.md);
the cost policy (`costPolicy`) decides who pays for calls made with a scoped key.

Never switch off `publishDbEvents` on the membership or the workspace data object: the
consumers drop a removed member's access on those events.

### Ambiguities, resolved in place

| Situation | Action |
|---|---|
| A bucket bullet with `tier=db` or `tier=native` | no provider entry: those tiers are provider-less. Skip the bullet (it still counts as satisfied) |
| A bullet names a family but no brand | use a brand named elsewhere in the document; else the family's mainstream default (email: a real email brand, and Amazon email is `amazonses`, never `amazonsns`). Check that the brand exists in the provider catalogue. Note the assumption |
| A bullet's family is not a provider family | not this step: skip and report |
| A package or library bullet | belongs to one service: defer it to that service's authoring, and report it |
| `- dropped: <provider> - <reason>` | a visible design decision **not** to bind: honour it and echo it in the report |
| A capability ruling rides a bullet ("payouts run as a manual process") | the entry is still created normally; carry the ruling into the report verbatim, it is design context for later steps |
| Both provider sections are `(none)` | nothing to author; still do sections 2 and 6 |

## 4. The hold rule

**Authoring of the services does not start until every provider family the specs refer to
exists in the blueprint.** Patterns that refer to a provider validate against the entries:
a `checkout` or `subscription` block against `paymentProviders`, a remote bucket against
`bucketProviders`, an AI agent against `aiProviders`, notification wiring against
`notificationProviders` and `mailAccounts`. A service written before its providers exist
buys a wave of validation errors that all mean "the provider step is unfinished".

Before you release the service lane, check every family that **any** design document needs
(authentication verification mails need an email provider; the service specs' payment,
bucket and AI needs; the notification definitions' channels) against the blueprint. A
family that is needed but unbound (a dropped bullet the specs still reference, a name that
resolves to nothing) goes to the user **before** authoring starts, with the option to
proceed knowing which patterns will fail validation.

## 5. Order of work inside this block

1. Settings (section 2): one small write each, validated, then the next.
2. Providers (section 3): one write per family.
3. The hold check (section 4).
4. Completeness and hand-back (section 6).

## 6. Verification and hand-back

- **Machine completeness: never claim, always diff.** Replay the needs inventory against
  the blueprint: every provider bullet has its entry in the right array, every skip or
  defer row carries its reason. Every row ends in exactly one of three states: **bound**,
  **intentionally skipped**, **reported unbound**. There is no fourth.
- **A bound row carries its authorship: bound by you, or adopted.** The diff asks whether
  an entry exists, and an entry someone else wrote satisfies it exactly as one you wrote
  does. "Bound" and "bound by me, against this spec" are different answers and only the
  second is evidence.
- **Hand the placeholders back before the services are written.** A provider bound with
  `ENTER_CREDENTIAL` is bound for the diff but unconfigured for real operations. Tell the
  user plainly which providers you authored, which secret keys each is waiting for, and what
  the running service will do until they arrive (mail to the sink, bucket to the built-in
  store, payment to a mock where the compiler has one; AI stays unconfigured without a
  real key). Ask whether they want to supply the keys now. "Later" is a good answer and
  does not block independent authoring, but the list goes into the hand-over so the next
  session can ask again. What is not acceptable is going quiet: never collect a secret in
  conversation and write it yourself, and never let a placeholder reach the closing report
  as the first time the user hears about it.

### Report

- core settings applied (field, path, old and new), and settings verified already correct;
- providers **authored** (family, brand, entry name; which keys are placeholders);
- families found **already applied and adopted**: what was there, that it matched, and
  that you did not author it. Name them even when adoption was uneventful;
- families found **diverging**, with both shapes and the user's decision (or that you are
  still waiting for one);
- families left **unbound** and why, and which specs refer to each (the input of the hold
  conversation);
- service-scoped copies deferred to the service lane;
- assumptions (defaulted brands) and open items from `## Decision Rationale`.
