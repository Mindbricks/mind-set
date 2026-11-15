---
title: Configuration and secrets
---

# 10. Configuration and secrets

A blueprint describes the design; the deployment provides addresses, credentials and
keys. This chapter states how a generated service receives its configuration, how
secrets are kept out of the blueprint and the code, what a service does when a provider
credential is missing, and how it behaves when it cannot reach a dependency at start.

## 10.1 Secrets never live in the blueprint or the code

- Properties marked `secret` in `openappl.json` (provider API keys, client secrets,
  passwords) hold credentials. A blueprint that is stored, exported or published
  **SHOULD NOT** carry their values; tools that export a blueprint **MUST** remove them.
- A compiler **MUST NOT** write a secret value into generated source code or into a
  configuration file meant to be committed. A compiler **MUST** make every secret
  configurable through the environment.
- A compiler **MUST** treat as secret at least: every property marked `secret`, every
  provider credential the schema's [provider catalog](../spec/providers.md) marks secret, private keys, and the
  database, cache and search-engine passwords.

> **To verify:** the reference also classifies by name (keys containing `secret`, `key`,
> `token`, `password`, …) as a safety net. Whether that net is normative is an owner
> decision.

## 10.2 The environment surface

A generated service reads its configuration from environment variables. The names are
part of the operator's interface: deployment scripts and secret stores are written
against them.

- A compiler **SHOULD** use the reference names below. A compiler that uses other names
  **MUST** document a one-to-one mapping.
- Configuration **MUST** be read at run time, not baked in at compile time, for every value
  that differs between environments.

| Family | Reference names |
|---|---|
| Identity | `SERVICE_NAME`, `SERVICE_URL`, `PROJECT_CODENAME`, `HTTP_PORT`, `SERVICE_KID`, `SERVICE_PRIVATE_KEY_PEM` (secret) |
| Environment | `CONFIG_ENV`: `dev`, `preview` (also `test`), `staging` (also `stage`), `prod`; unset means `prod` |
| Peer services | `AUTH_SERVICE_URL`; `SERVICE_<NAME>_URL` for each sibling, `<NAME>` upper-cased with non-alphanumerics as `_` |
| Relational store | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (secret), pool settings |
| Document store | `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB_NAME`, `MONGO_USER`, `MONGO_PASSWORD` (secret) |
| Cache, bus, search | `REDIS_URL`; `KAFKA_BROKERS`; `ELASTIC_HOST`, `ELASTIC_USER`, `ELASTIC_PASSWORD` (secret) |
| Session and cookies | `SESSION_TOKEN_NAME`, `COOKIE_DOMAINS`, `COOKIE_SECURE`, `ALLOWED_ORIGINS` |
| Providers | `<FAMILY>_<NAME>_<KEY>`, `<NAME>` being the provider entry's name upper-cased: `PAYMENT_PROVIDER_<NAME>_SECRET_KEY`, `AI_PROVIDER_<NAME>_API_KEY`, `DECISION_PROVIDER_<NAME>_API_KEY`, `NOTIFICATION_PROVIDER_<NAME>_<KEY>`, `GRAPH_<NAME>_URI`, `BUCKET_<NAME>_<KEY>` |
| Storage | `NATIVEBUCKET_ENDPOINT`, `NATIVEBUCKET_ACCESS_KEY_ID`, `NATIVEBUCKET_SECRET_ACCESS_KEY` (secret), `BUCKET_TOKEN_SECRET` (secret) |
| Bootstrap | `SUPER_ADMIN_IDENTIFIER`, `SUPER_ADMIN_PASSWORD` (the first operator's bootstrap credential, see [chapter 9.1](09-01-authentication-and-sessions.md)) |

The names of the "logical event bus", "cache" and "search" families follow the reference
products; a compiler using other technologies maps them as its documentation says
([chapter 1](01-conformance-model.md#13-free-technology)).

> Generated table goes here (S9): the full environment catalogue per service, with the
> secret flag and the default of each variable.

> **To verify:** whether the document store is also configurable by one URL
> (`MONGO_URL`); documentation mentions it, the reserved-name list does not.

## 10.3 Missing provider credentials

A missing credential is a deployment state, not a design error.

- A compiler **MUST** compile a blueprint whose provider credentials are absent
  ([chapter 2](02-compiler-pipeline.md#211-errors-at-compile-time-versus-at-run-time)).
- A generated service **MUST** start without them, report which ones are missing (names
  only, never values) on its health surface (10.5), and log them: as an error in
  production, as a warning elsewhere.
- Where the reference defines a **fallback**, a conforming service **MUST** apply it:

| Provider family | Without credentials |
|---|---|
| Mail and notification channels | messages go to a sink that records them without sending ([chapter 9.3](09-03-notification.md)) |
| Remote storage bucket | the project's native object store is used instead ([chapter 9.6](09-06-storage-buckets.md)) |
| Native object store keys | calls that need the store fail with **503** `BUCKET_PROVIDER_NOT_CONFIGURED`; other calls work |
| Payment (brands with a mock) | an in-process mock of the provider ([chapter 9.4](09-04-payment.md)); brands without a mock refuse every call by name and send nothing |
| Decision providers | a stand-in that answers every question "undecided" ([chapter 9.9](09-09-compute-graph-decision.md)); it never invents a decision |
| Graph provider | writes to the graph are skipped and counted; graph reads return nothing |
| AI providers | no fallback: calls fail at call time |

A service that runs a fallback **SHOULD** say so on a status route; the reference serves
`GET /v1/payments/mock-status`, `/v1/decisions/mock-status`, `/v1/ai/mock-status`,
`/v1/mail/mock-status` and `/v1/buckets/mock-status`.

- Values that look like placeholders **MUST** count as missing.
- A mock **MUST NOT** be used in production for a provider whose credential mode is
  `live`.

> **To verify:** the exact mail-sink rule per environment (the reference documentation
> says email always falls back to the sink, while SMS and push fall back only outside
> production) and the list of payment brands with a mock.

## 10.4 Boot: a generated service never exits

A generated service **MUST NOT** exit because of an error at start: a database it cannot
reach, a broker that is down, an invalid configuration value, a missing key. It **MUST**
bind its port first and keep running.

- Boot state is one of `starting`, `ready`, `degraded`.
- While it is not `ready`, every request except the health routes **MUST** answer **503**
  with a problem body ([chapter 5](05-business-apis.md#56-error-body)) whose `errorCode`
  is `SERVICE_STARTING` (with `Retry-After: 5`) or `SERVICE_DEGRADED` (with
  `Retry-After: 30`), and no internal detail.
- A failed critical step (the primary database, the service identity key of a service that
  issues sessions) makes the service `degraded`. The service **MUST** retry it in the
  background with back-off and become `ready` without a restart once it succeeds, unless
  the failure is not retryable (an invalid configuration).
- A failed optional step (cache, search engine, event bus) **MUST NOT** block readiness;
  the features that need it fail at call time with a retryable **503**.
- The only exit is a termination signal, answered by a graceful stop.

Public boot error codes, reported on the health surface:

| Code | Retryable |
|---|---|
| `DB_UNREACHABLE`, `DB_AUTH_FAILED`, `SCHEMA_FAILED`, `PORT_IN_USE`, `DEPENDENCY_UNSUPPORTED`, `STEP_FAILED` | yes |
| `CONFIG_ENV_INVALID`, `CONFIG_INVALID`, `IDENTITY_KEY_MISSING`, `BUILD_INCOMPLETE` | no |

Rationale: an orchestrator that restarts a crashing service hides the cause and amplifies
load on a dependency that is already down. A running service that answers "degraded"
tells the operator what is wrong.

> **To verify:** the reference implements this rule on three of its six targets today;
> the others still exit on a fatal start error. The rule is a maintainer ruling for all
> targets, and this specification states it as normative.

## 10.5 Health surface

| Route | Answer |
|---|---|
| `GET /health` | always **200**; the service name and version, and a `boot` block `{ state, since, bootErrors[{ step, code, critical, retryable, attempts, nextRetryAt }] }`, plus the status of each dependency and `providerCredentials { status, incompleteProviders }` (a count) |
| `GET /health/ready` | **200** `{ ready: true, boot }` when ready; otherwise **503** with `SERVICE_STARTING` or `SERVICE_DEGRADED` |
| `GET /admin/health` | operator-only detail: messages, missing variable names, runtime faults |

- The health routes **MUST NOT** reveal secret values, connection strings or internal
  messages to anonymous callers.
- A compiler **SHOULD** serve these paths; liveness and readiness probes of deployments
  written for the reference then work unchanged.

## 10.6 Environment files

A compiler **MAY** emit environment files for the deployment environments. The reference
emits one file per environment (`dev`, `test`/preview, `stage`, `prod`) in which every
secret is an empty `NAME=` line, so that the deployment fills it by name, and keeps
development secrets in a separate file that is never committed. The real environment
always wins over a file.

## 10.7 The provider configuration catalog

Provider entries (AI, payment, notification, invoice, fiscal, decision, video, storage,
mail accounts, enterprise integrations, social login) are named entries with a `provider`
brand and a `configuration` of keys. The schema defines those keys in its provider catalog:
`openappl.json` carries it under `__providerConfigCatalog.doc`, and Part 2 renders it as the
[provider catalog](../spec/providers.md), one page per family. The catalog is part of
the language: a blueprint is valid only when its provider entries agree with it.

- A compiler **MUST** refuse, at compile time, a configuration key that neither the entry's
  brand nor the family's keys of every brand (`__familyKeys`) list: an unknown key is a typo.
- A compiler **MUST** refuse an entry that lacks a key the catalog marks `required`, and for
  keys in an either/or `group` **MUST** require at least one complete group.
- A compiler **MUST** treat every key the catalog marks `secret` as a secret
  ([10.1](#101-secrets-never-live-in-the-blueprint-or-the-code)), and **MUST** derive the
  environment name of each key from the family's `__envPrefix` and `__envKeyStyle`
  ([10.2](#102-the-environment-surface)), or from the fixed per-brand names a family's note
  gives.
- A compiler **MUST** read a key under its `mapsTo` alias where the catalog names one.
- A brand whose state is `roadmap` has no adapter: a compiler **MUST NOT** compile it as if
  it worked. It refuses the blueprint, or generates a service that answers a typed
  not-implemented error for that brand.
- Tools that edit provider entries (settings screens, agents) **SHOULD** build their forms
  and key lists from the catalog, so they offer exactly what a compiler accepts.

> **To verify:** whether a compiler must refuse a value outside a key's `values` and apply
> its `default` when the entry leaves it out (the catalog documents both; the reference's
> validation is not yet confirmed to enforce them).

> **To verify:** the exact meaning of `requiredFor` (`construct`: needed to build the
> adapter; `webhook`: needed only when the brand's webhook is used) and whether a missing
> `webhook` key is a compile-time error or a run-time refusal of the webhook route.

