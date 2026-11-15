---
title: Response shape
---

# Response shape

The response contract, in one place. Every generated BusinessApi
answers in one of three shapes: single-item success, list success, or
an RFC 9457 problem. The four CRUD pages
([create](create-api.md), [get](get-api.md), [update](update-api.md),
[delete](delete-api.md), [list](list-api.md)) all end at `buildOutput`,
which is where these bodies are built.

The same contract is emitted into every generated service's REST guide,
so a project's own docs and this page say the same thing by construction.

## Success: single item

A successful **single-item** response (`get` / `create` / `update` /
`delete`) is the resource itself at the body root, carrying a required
`_type` discriminator. **There is no wrapper envelope**: no `data`
key, no `status` field:

```json
{ "_type": "organization", "id": "uuid…", "name": "Acme" }
```

`_type` is always the API's **data-object name**; there is no per-API
override.

`delete` is not an exception: it returns the whole stamped record it
removed, not `{ id }`. On a soft delete that record is the row with
`isActive` flipped; on a hard delete it is the row as it was.

### Write answers and selectProperties

By default a `create`, `update` or `delete` answers the whole row it wrote.
That is what most write apis want (the creator's own new record), but on a
buyer-facing write behind an ownership check it hands the caller every
stored column, internal bookkeeping included.

The [read rule](list-api.md#how-selectproperties-is-applied) holds for
writes too: **a declared select list is the response boundary.** Declare `query.selectClause.selectProperties` on
the write api and its answer carries exactly those properties, plus `id` and
`_type`:

```json
"query": {
  "selectClause": { "selectProperties": ["status", "paymentStatus", "total"] }
}
```

- **Response side only.** A write is never projected: the instance fetch,
  the ownership check, the dataClause, every workflow action (`this.<object>`,
  `this.instance`, `this.result`) and the data-layer event see the full row.
  Only the record that leaves through the response is narrowed.
- **The route event keeps the full row.** The list narrows what the CALLER
  is answered, not the event contract: the write's route event still carries
  the full written row under `data` (plus any response additions) and the
  full pre-write row under `old`, because its subscribers (other services,
  agents, lifecycle consumers) were built against it. Secrets and the
  derived storage columns are scrubbed from it.
- **No caller is exempt**, exactly as on a `get` / `list`: an admin, an
  absolute role or the owner all receive the declared shape. A surface that
  must return more declares a second api.
- **No list, no change.** A write without `selectProperties` answers the
  full row. When `ownershipCheck: true` is
  declared on a create, update or delete and no select list resolves to bare
  columns, validation reports `OWNERSHIP_WRITE_RESPONSE_UNBOUNDED` (WARNING)
  on authored APIs. This author-facing advisory declines on
  compiler-injected API validation paths, where the author cannot edit the
  response declaration; other injected-surface warnings and errors are still
  validated.
  Add the response list for this audience, or knowingly keep the full-row
  answer. The warning also covers an empty or dotted-only list; it does not
  change the answer or route-event `data` / `old`. On create, the
  `OWNERSHIP_CHECK_NOT_APPLICABLE` warning explains that no target row
  exists to ownership-check yet.
- Only `selectProperties` is read on a write; a `selectJoins` entry there is
  ignored and warned about (`BUSINESSAPI_BLOCK_IGNORED`).
- **Target-language support.** Narrowing a write answer is not available
  on every target language. A target that does not read a select list on a
  write answers the full row; validation warns on such a service
  (`SELECT_PROJECTION_SUPPRESSED`, reason `writeAnswer`).

## Success: list

A successful **list** response wraps the page of records under `data`
and adds a `paging` block:

```json
{
  "data": [{}, {}, {}],
  "paging": { "page": 1, "pageSize": 25, "totalCount": 3, "totalPages": 1 }
}
```

- `_type` is present on **every** emitted record: the single-item body
  root and each `data` item alike.
- `paging` is list-only: `{ page, pageSize, totalCount, totalPages }`,
  with a **1-based** `page`.
- In keyset mode (`paginationOptions.cursorMode`) the block is
  `{ pageSize, nextCursor }` instead. `page`, `totalCount` and
  `totalPages` are **absent** rather than zero-filled: a cursor walk has
  no page number and skips the `COUNT` query entirely, so reporting
  `totalCount: 0` would be a lie a client cannot distinguish from an
  empty table.

A list narrowed by a [fuzzy domain filter](list-api.md#fuzzy-domain-filters)
also carries `fuzzyDomainFilters` beside `data` and `paging`: one entry
per filter that narrowed it, with the filter `name`, the `property`, the
`provider` and `model` that decided, a `criterionHash`, the `threshold`,
the `deadBand` and `degraded` (true when the provider failed under
`onProviderError: "matchNothing"`). A list no fuzzy filter narrowed has no
such key. See [The decision layer](../capabilities/decision-layer.md#fuzzy-domain-filters-query-time).

## Partial success: `actionFailures`

A `create` / `update` / `delete` whose main write **committed** but whose
post-write workflow actions (`afterMainCreateOperation`,
`afterMainUpdateOperation`, `afterMainDeleteOperation`, and the output
stage `afterBuildOutput`) did not all complete still answers the
success it was (`201` / `200` and the resource body) and adds one
member:

```json
{
  "_type": "subscription",
  "id": "uuid…",
  "planCode": "gold",
  "actionFailures": [
    { "action": "notifyBilling", "error": "billing edge refused" },
    { "action": "announceSubscription", "error": "not run: action 'notifyBilling' failed earlier in the same stage and stopped it", "errorCode": "ACTION_NOT_RUN" }
  ]
}
```

Each entry is `{ action, error, retryable?, errorCode?, outbox?, providerErrorCode?, reason? }`:

- **`action`**: the declared workflow-action name; for a failure relayed
  from an in-process `API.<apiName>()` call this request made,
  `<apiName>.<action>`.
- **`error`**: why it did not complete, as the text the ERROR path would
  show for the same failure: an unexpected 5xx reads
  `"Internal server error"` (the raw message is in the server log under the
  request id), a 4xx or curated error keeps its own sentence. A 2xx never
  hands out what a 5xx body would hide.
- **`retryable`**: `true` when the identical action can succeed later
  (a declared transient `errorCode`, the same vocabulary as the problem
  body's `retryable`), or when the outbox owes it. **Absent** otherwise;
  absence means "not known to be retryable", never "definitely not".
  `false` appears in one case only: an entry relayed from an in-process
  call whose inner api is a `create`: re-sending the request
  does not re-run that create, so a retry cannot complete it.
- **`errorCode`**: the machine code when the failure named one. Two are
  the framework's own: `EVENT_PUBLISH_DROPPED` (a `PublishEventAction`
  whose event the broker never took) and `ACTION_NOT_RUN` (an action that
  never started because an earlier one in the same stage threw and
  stopped the stage). A payment the provider refused (a
  [`PaymentAction`](../../spec/PaymentAction.md) whose provider turned the
  charge down) reads `PAYMENT_PROVIDER_REQUEST_REJECTED`, with the fixed
  `error` "The payment provider rejected the request"; a Stripe card
  decline reads `PAYMENT_DECLINED`, with the fixed `error` "The payment was
  declined by the provider".
- **`providerErrorCode`**: on that provider refusal only: the provider's
  own error code (iyzico `"10051"`, Stripe `"insufficient_funds"`), 1-64
  characters of `[A-Za-z0-9_.-]`. It is present on exactly the refusals the
  generated payment routes answer with a `providerErrorCode` (`422`
  `PAYMENT_PROVIDER_REQUEST_REJECTED`, or a Stripe `402` `PAYMENT_DECLINED`),
  by the same rules; the provider's sentence (which can quote card or buyer
  fragments, or name live object ids) never reaches the entry. The Stripe
  decline codes Stripe asks merchants not to reveal (`fraudulent`,
  `lost_card`, `stolen_card`, `pickup_card`, `merchant_blacklist`,
  `restricted_card`) read `"generic_decline"`.
- **`reason`**: with `providerErrorCode`, when the code is a mapped
  card-validation refusal: `card_number_invalid`, `card_expired`,
  `card_expiry_invalid`, `card_cvc_invalid`, `card_holder_name_invalid`,
  `card_not_supported` (the iyzico and Stripe code tables map onto these).
  A decline such as `10051` or `insufficient_funds` carries the code alone.
- **`outbox: "queued"`**: the failure is stored and the service will
  complete it: a dropped event goes to an outbox record
  with the built event (one row per logical event, identified by its
  content: the same request re-sent during an outage re-queues the SAME
  event, keeping its first `id`, instead of adding a copy, and a retry that
  delivers it closes the queued copy; a message carrying a per-try value,
  or a retry from another session of the same user, is new content and may
  be delivered once per try under a new `id`), and a background sweeper
  re-publishes it (same event `id`, so consumers can dedupe) with backoff;
  after 12 failed attempts the row is parked `dead` for an operator.
  The outbox ledger is kept in the service's own database on both
  database engines, with the same sweeper and the same retry rules; a
  completed record expires an hour after its last update.

Rules for a client:

- The key is **absent** on a clean success, never an empty array.
- The row **exists**. Treat the operation as done; do not build a NEW
  request to "retry" it.
- Re-sending the **identical** request (same body, same caller, same
  `api-idempotency-key` if one was sent) within an hour is recognised as a
  retry of the same attempt, for a `create` as much as for an `update` /
  `delete`, **provided the request carries
  an identity**: a logged-in caller, or an `api-idempotency-key`. Then the
  main write does **not** run
  again (the answer is the row that write stored: a create keeps its id,
  never a second record; an update's dataClause, a `+ 1` included, is
  applied once) and only the post-write actions that did not complete
  before run; the ones that did are skipped. The completion of the main
  write is recorded in the same outbox record family as the
  actions' (keyed by the attempt), and only
  when the response carried `actionFailures`: a re-send of a CLEAN success
  is a new write (use `api-idempotency-key` with stored replay for that). A different request on the same row (another body, another key,
  another logged-in caller) is a new attempt: it writes and runs every
  action. A request with NO identity (an anonymous call without an
  `api-idempotency-key`, a cron tick, an in-process `API.<name>()` call made
  outside any request) is never matched to an earlier try for its main
  write: two such requests with the same input would otherwise share one
  attempt (a second anonymous caller would get the first one's row). It
  writes every time; send an `api-idempotency-key` to make an anonymous
  re-send replay. An api with stored idempotent replay replays the
  stored 2xx instead, because a partial success is a success.
- The replay runs after every gate (login, roles, permission checks, the
  instance fetch). A re-sent `delete`, or an `update` whose own first write
  moved the row out of its where clause, finds no row at the instance
  fetch; it then reads the stored main write of the same attempt
  and replays it: the answer is the row the first try wrote (a `200`, not
  a `404`), the ownership and object-level permission checks run against
  that stored row, the api's pre-write instance stages
  (`afterFetchInstance` / `afterCheckInstance`) do not run again, and only
  the actions that did not complete run. What those stages put in the
  context is kept for that replay: the first try stores every
  context name their actions write (an action's `contextPropertyName` or
  name, an `AddToContextAction`'s entries) in the stored main-write record, and
  the replay binds them back, so an owed action that reads, say,
  `this.existingWatcher.watcherUserId` completes. The stored copy is
  **masked** before it is persisted (tokens, secrets, card data, e-mail and
  phone values read `[REDACTED]` on the replay) and capped at 64 KiB of
  JSON; a larger or unserialisable context is not stored. The **access checks** of
  those stages (`validationActions` and the permission / membership check
  actions) run **again** on the replay, against the stored context, the row
  as those stages saw it (on an update, the row BEFORE the write; stored
  with the context, masked the same way) and the caller's current session:
  a check that refuses now (a role revoked since the first try) answers its
  refusal and nothing is replayed. When an api
  with such checks has no stored context to run them against (skipped as
  too large), the replay is refused and
  the re-send answers the fetch's miss. A check that compares a masked value
  (an e-mail) refuses on the replay for the same reason: keep access checks
  on ids and roles. A re-send that is not matched (no
  identity, another caller, past the hour, or a first try that answered
  without `actionFailures`) still answers the fetch's miss (a `404`, or
  the api's `onNotFound: complete` answer), without a second write. Both
  database engines replay the same way.
- A read (`get` / `list`) never reports a failure of ITS OWN actions:
  nothing was written, so a post-main failure there is still an honest
  error. It carries `actionFailures` only when an in-process
  `API.<apiName>()` call it made wrote in part (relayed as
  `<apiName>.<action>`).
- An action that UNDID the main write (such as the subscribe rollback, which
  deletes the row it just created when the provider refuses) answers its own error,
  not a 2xx: the row no longer exists, so "partial success" would be false.
  Any event that request had already queued about the row is cancelled
  (kept for audit, never delivered).
- Only the post-WRITE stages report (the three afterMain stages and, on a
  write, `afterBuildOutput`). A throw before the write aborts with its
  own status, and the post-response stages
  (`afterSendResponse`, `afterApiEvent`) run after the body is sent.
- A streamed write (SSE `responseMode: "stream"`) has no envelope: the
  member rides its final `done` frame instead, under the same
  present-only-when-needed rule.
- Target-language caveat: support for `actionFailures` varies by target
  language; a target that does not emit it answers a `500` instead. A client
  that reads the member when present is correct on both.

The member is reserved: an `AddToResponseAction` may not name
`actionFailures` (validation refuses it as `RESERVED_RESPONSE_KEY`).

## Action results in the response: `writeToResponse`

A workflow action with a `contextPropertyName` and `writeToResponse: true`
puts its result into the success body under that name, at the body root:
beside the record's own fields on a single-item answer, beside `data` and
`paging` on a list answer (never on each row). The copy runs with the
output stage and is skipped while the result is `undefined`, so the key is
optional.

`register<Tenant>Owner` is the built-in case: its `createCrudActions` entry
creates the tenant before the user and writes it under the tenant's name,
so the answer is the user record plus the created tenant, codename
included:

```json
{
  "_type": "user",
  "id": "uuid…",
  "email": "owner@acme.test",
  "organizationId": "uuid…",
  "organization": { "id": "uuid…", "name": "acme", "codename": "acme", "fullname": "Acme" }
}
```

The published contract says the same. The api's success schema in
the generated API descriptor and in the OpenAPI document is an `allOf`
of the shared record schema and one member per injected key (the per-api
widening `exposeSecrets` uses, below), so the shared object schema is
unchanged for every other api:

- a `CreateCrudAction` on an object of the same service returns the row
  it created, so its member carries that object's fields **without**
  `_type` (the discriminator is stamped on the main record only);
- every other action type returns a result whose shape depends on its
  own settings (a projection, `isArray`, a script), so its member is
  declared with a description and no fields, which accepts any value.
  Declare the shape you need on the action's consumer side instead of
  expecting the compiler to guess it;
- a name the secret scrub removes (a `hashed` / `isSecret` property name
  declared anywhere in the project, other services included, unless this
  api opens it through `exposeSecrets`) is not declared, because it never
  reaches the caller.

## Keys an `AddToResponseAction` adds

An `addToResponseActions` entry writes each `context[]` item that has both a
`contextName` and a value onto the body root, under that name: beside the
record on a single-item answer, beside `data` / `paging` on a list answer.
The published contract declares those keys too, in the same `allOf` member
(or list envelope) as the `writeToResponse` keys above:

- the value is an MScript result, so the member has a description and no
  type, and it is never `required`;
- a reserved envelope key of the api's crud type (`data` / `paging` on a
  list, `_type` elsewhere, `actionFailures` everywhere) is not declared: the
  service drops such an entry, and validation refuses it
  (`RESERVED_RESPONSE_KEY`);
- the secret-name rule above applies unchanged, `exposeSecrets` included;
- a key written by both mechanisms is declared once.

## Bodies that are not the object record

The generated API descriptor (and the frontend project description built
from it) declares three more answer shapes:

- **A get that reads no record.** A `get` whose where clause is fixed at
  build time and addresses no row (no id, no selectBy, a literal
  `fullWhereClause` such as `{ isActive: true }`, no tenant-root pin) never
  reads its object: the body is `{ "_type": "<object>" }` plus the keys its
  actions write. Its schema is exactly that, not the object record.
- **A DataView-bound get or list.** The rows are the view's document: its
  projected columns, `_type`, every aggregate under its name (an array for
  `oneToMany`) and every stat bucket under its name, with credential columns
  left out. The descriptor publishes a `<View>Row` schema for them.
- **The auth session and permission reads.** `getMyPermissions` /
  `getMyRolePermissions` answer `{ _type, data: [permission rows] }` and
  `getPermissionFilter` answers `{ _type, data: null | { canDo, exceptions } }`;
  `currentUser` also carries the session keys
  (`sessionId`, `userId`, `_USERID`, `role`, `roles`, `tenantCodename`) and
  login / relogin carry `refreshToken` when refresh tokens are enabled.

In a multi-tenant project the tenant header scheme (`security.tenantHeader`)
is optional routing context, not a credential: the endpoints that read the
tenant list it in `headers` as an optional header, and no endpoint's
`security` array names it.

## What the envelope does NOT carry

Two families of column are removed from every response body, at a choke
point no handler can opt out of:

- **Declared secrets** (`hashed: true`, `isSecret: true`): project-wide,
  scrubbed from responses, events and streamed chunks alike. The one
  opening is per API, below.
- **Derived storage/index columns**: `_owner`, `_iPublic`,
  `_tenantId`, `_archivedAt`, and an `<enum>_idx` ordinal shadow for each
  non-array enum property (`status_idx`, `applicationType_idx`, …).

The second family is written by the data layer's row normalizer
because the storage side needs it: the Elasticsearch mappings declare
`_iPublic` and `<enum>_idx`, the ownership filter matches on `_owner`,
and the entity cache stores the normalized shape. None of it is part of
the API contract, and `_owner` is an outright leak on a public read: it
names the owning user id on objects whose API deliberately withholds
`createdByUserId`. So the strip is applied at the **response envelope**
(the finished body, an idempotent replay body, and a streamed chunk) and
**not** at the record: the kafka `old` slot, the ES document and the
cache entry keep the derived keys their consumers were built on.

A surface that genuinely needs the storage columns (an admin row
browser, a support console) opts out explicitly with
`exposeInternalColumns: true` on its manager. The default is the strip,
and a client must never be written against a derived key.

### A non-secret column that shares a secret's name

The secret scrub matches by property NAME, project-wide, so a column that
is not secret on its own object but shares its name with another object's
`isSecret` column (a carrier's `taxId` next to a billing profile's secret
`taxId`) would disappear from every response. A compiler that supports it
narrows that rule per record:

- a record that carries its own `_type` keeps such a column when every
  data object of that name in the project declares it and none declares
  it secret, so `GET /carriers` answers `taxId`, while a billing profile
  record (`_type: "billingProfile"`) still has it stripped;
- a record WITHOUT its own `_type` keeps the name rule: a nested or joined
  copy, a row an authored `publishEventAction` builds from the raw row, a
  custom stream row. A nested record is judged by its own stamp, never by
  its parent's;
- a name any object declares `hashed` is never narrowed, and a project
  that declares a property named `_type` anywhere gets no narrowing at all
  (a row could otherwise override its own stamp);
- the request logs always redact by name: a request body carries no `_type`.
- a select-join may not copy a joined object's secret column onto the
  response (`SELECT_JOIN_SECRET_COLUMN`), and a `joinName` that shadows a
  column of the api's object warns (`SELECT_JOIN_NAME_SHADOWS_COLUMN`);
  see [List API](list-api.md#selectclause-projection-and-joins).

Kafka envelopes follow the same rule as responses. Validation warns about
every such column (`SECRET_NAME_COLLISION`), with `exempted: false` when the
narrowing does not apply; renaming one of the two columns is still the way
to keep the field on every path. Targets that do not narrow strip by name,
and their generated contracts say so.

The session token is the one framework-written key this rule must never reach.
Every login-family answer (login, relogin, the API-key exchange, register
auto-login, social login) carries the minted bearer at the top level as
`accessToken`, and `refreshToken` when refresh tokens are on. A secret
property named `accessToken` or `refreshToken` anywhere in the project would
put that name on every manager's scrub list, so validation refuses it with an
ERROR (`SECRET_NAME_SESSION_TOKEN`) that names the object and property:
rename it (`providerAccessToken`, `providerRefreshToken`). Should such a
project be built anyway, the generated service still keeps the token
the session-minting writer itself puts at the top level of its own answer;
the same name stays scrubbed in every record of that answer, in the nested
session copy, in events and in logs.

## Opening a secret on one API: `apiOptions.exposeSecrets`

Some `isSecret` values have an owner who must be able to read them back: a
ticket's claim code, a one-time link. The scrub above removes them from the
owner's own ownership-gated read too. A BusinessApi opens such a column by
naming it:

```json
"apiOptions": {
  "name": "getMyTicket",
  "crudType": "get",
  "dataObjectName": "ticket",
  "exposeSecrets": ["code"]
}
```

- **This API only.** `getMyTicket` carries `code` in its response record;
  every other API over `ticket` keeps scrubbing it. Kafka envelopes,
  db-event payloads and request logs are scrubbed at their own project-wide
  choke points, which this field does not reach.
- **Facts only.** Naming a property that is not on the API's
  `dataObjectName`, one that is not `isSecret`, or a `hashed` one (a bcrypt
  digest, not the value) is a validation error, and such an entry exposes
  nothing even if the build goes ahead.
- **Advisories.** A `loginRequired: false` API that opens a secret is
  warned about (anyone can read it), as is a name that another object also
  declares secret (the scrub matches by name across the whole response), and
  an API with a gRPC controller (the per-object gRPC message still omits the
  column).
- **The contract says it.** The API's OpenAPI response schema is an `allOf`
  over the shared object schema plus the opened columns; the object schema
  itself stays scrubbed.
- **A name hashed anywhere is never opened.** The scrub matches by name
  across the whole response, so if ANY object declares a column of that name
  `hashed` (auth's `user.password` included), validation refuses the entry
  (`EXPOSE_SECRETS_NAME_HASHED_ELSEWHERE`) and the build keeps the name
  scrubbed regardless.
- **Where the opened value also lands.** It is this api's response, so it
  reaches whoever consumes that response: when the api is an agent tool the
  value is handed to the LLM provider and kept in the conversation
  checkpoint, and an api with `useIdempotencyKey` stores the response (column
  included) for replay.
- It replaces re-injecting the value with an `AddToResponseAction`
  (`this.ticket.code` under another name): that works, but it records a
  deliberate secret exposure as an ordinary response action. Validation
  warns on that pattern (`EXPOSE_SECRETS_VIA_ADD_TO_RESPONSE`) and names
  this field.

## Errors: RFC 9457 problem+json

Failed requests return an **RFC 9457 problem+json** body with media type
`application/problem+json`. The HTTP status indicates the class of
failure:

- **400 Bad Request**: invalid params / malformed body
- **401 Unauthorized**: missing or invalid token (when login was required)
- **403 Forbidden**: auth was valid but authorization (role / ownership) denied
- **404 Not Found**: the target row doesn't exist
- **422 Unprocessable Content**: among others, a payment the provider refused before the write (`PAYMENT_PROVIDER_REQUEST_REJECTED`, see `providerErrorCode` below)
- **409 Conflict**: duplicate-key / state conflict. `errorCode: CONDITIONAL_UPDATE_REFUSED` is a guarded numeric write whose `when` no longer held at write time (see [Numeric mutation](../mscript/numeric-mutation.md)).
- **500 Internal Server Error**: unexpected runtime error

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "organizationId is not a valid ID",
  "errorCode": "DB_UNAVAILABLE",
  "errors": { },
  "requestId": "uuid…"
}
```

- **`type`** / **`title`** / **`status`** / **`detail`**: the standard
  RFC 9457 members. `status` mirrors the HTTP status line and `detail`
  carries the human-readable failure message.
- **`errorCode`**: extension member, present only for typed failures
  that carry a machine-readable code (e.g. a retryable `503`
  DB-availability error). On a 4xx the code is the thrown error's own
  `errorCode`, else its `code` when that is a SCREAMING_SNAKE string (the
  agent runtime's `AGENT_INPUT_VALIDATION_FAILED` / `AGENT_TOKEN_BUDGET_EXCEEDED`
  refusals). A non-curated 5xx answers a generic `detail`
  (`Internal server error`) and no `errors` member. Its `errorCode` is
  `INTERNAL_ERROR` unless the failure is a declared one: the curated
  envelopes (a DB-availability `503`, a provider `502`), and, on the
  targets that support it, an error that named itself with a
  SCREAMING_SNAKE `errorCode` / `code` keeps that code (for example
  `503 CART_ROTATION_SECRET_UNAVAILABLE`). The code must match
  `^[A-Z][A-Z0-9_]{0,99}$`; a valid `errorCode` is preferred over a valid
  `code`. A plain error, or a `code` that is not SCREAMING_SNAKE
  (a driver errno, a Postgres SQLSTATE), stays `INTERNAL_ERROR`.
- **`errors`**: extension member, present only when a typed error
  carries a structured payload (e.g. a permission server's full deny
  object); omitted for plain string errors.
- **`requestId`**: extension member correlating the failure with the
  service logs (also sent as the `X-Request-Id` header).
- **`providerErrorCode`** / **`reason`**: extension members of a payment
  the provider refused BEFORE the api's main write (a
  [`PaymentAction`](../../spec/PaymentAction.md) in a `get` api, or in a
  stage that runs before the write). The answer is the one the
  generated payment routes give the same refusal: `422` (an iyzico `4xx`
  keeps its own status) with `errorCode: "PAYMENT_PROVIDER_REQUEST_REJECTED"`,
  the fixed `detail` "The payment provider rejected the request", the
  provider's own error code (iyzico `"10051"`) as `providerErrorCode` and,
  for a card-validation refusal, `reason`: the same pair the
  `actionFailures` entry carries after a write. A Stripe card decline keeps
  the decline answer, `402` `PAYMENT_DECLINED` "The payment was declined by
  the provider", and gains the same two members. The provider's
  sentence never reaches the body; every other error keeps its status and
  body. Support for these members varies by target language.

> **The ownership refusal key.**
> A caller that is not the owner of the row an ownership-checked api addresses
> is refused `403` with `errorCode: "errMsg_UserShouldBeTheOwnerOfTheObject"`
> (the key resolves to a sentence in `detail`; see
> [error handling](../workflow/error-handling.md)):
>
> ```json
> {
>   "status": 403,
>   "detail": "You can only act on records you own.",
>   "errorCode": "errMsg_UserShouldBeTheOwnerOfTheObject"
> }
> ```
>
> The refusal body carries no `errors` member and no occurrence of the
> misspelled alias `errMsg_UserShouldBeTheOnwerOfTheObject` ("Onwer"). Match on
> `errorCode`. The alias resolves to the same `errorCode` wherever it is raised
> (see the alias note in [error handling](../workflow/error-handling.md)).

## Status codes and transport metadata

- **HTTP 201** for `create`, **200** for everything else successful.
- **HTTP 202** for a create / update that
  [`objectModeration`](../capabilities/object-moderation.md) held for review
  or rejected (`staged` mode): the body is
  `{ "moderation": { "id", "status", "message" } }` and nothing was written.
  An accepted moderated write keeps its `201` / `200` record and carries
  `moderation: { id, status }` beside it.
- A `get` / `update` / `delete` miss returns a **404** problem+json body.
  Exception: an API authored with `basics.apiOptions.onNotFound: complete`
  returns HTTP 200 and `{}` for an absent target; only its explicit
  `workflow.<crud>.afterMissingInstance` actions run on that branch.
- Transport metadata rides in **response headers**, never in the body:
  `X-Request-Id` (correlation id) and `Server-Timing: app;dur=<ms>`
  (server-side elapsed time) are set on every response.
- **No conditional GET.** A generated service sends no `ETag` on its
  JSON responses and never answers `304 Not Modified`: the default weak
  ETag is switched off app-wide, so a replayed `If-None-Match` gets the full
  `200` body. This is deliberate: a masked or authorized read must not be
  revalidated against a copy produced under an older mask. A client that
  wants change detection compares a content field of the body itself.

## See also

- [BusinessApi overview](overview.md): the request lifecycle these
  bodies are the end of.
- [ApiManager](api-manager.md): `buildOutput` and the milestones around it.
- [Error handling](../workflow/error-handling.md): how a
  workflow failure becomes one of the problem bodies above.
