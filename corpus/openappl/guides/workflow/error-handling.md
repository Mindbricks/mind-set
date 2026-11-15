---
title: Error handling
---

# Error handling

A failing action terminates the workflow and returns an RFC 9457
problem+json error body to the client, unless the main write has already
COMMITTED: a failure in a post-write stage answers the success it was, with
the failure listed in `actionFailures` (see
[After the write commits](#after-the-write-commits-actionfailures)).
Two knobs control the behaviour: the
action's `onActionError` setting (`throwError` default vs.
`completeApi`) and, for validation / permission actions, the
`errorStatus` field on the action itself. There is no error-path
milestone: recovery is per-action, not per-workflow.

## Where errors come from

| Source | Action class(es) | Default status |
|---|---|---|
| Validation failure | `validationActions`, `cartValidationActions`, `couponValidationActions` | `400` (per `errorStatus`, also accepts 401/403/404/409/422/429/500/503; `503` answers `SERVICE_UNAVAILABLE` with the authored message, a designer-authored `500` is genericized). |
| Permission denied | `permissionCheckActions`, `objectPermissionActions`, `membershipCheckActions` | `403`. |
| Missing record | `fetchObjectActions` with `isRequired: true`, `update` / `delete` instance not found | `404`. |
| Zero-row update / delete action | `updateCrudActions`, `deleteCrudActions` that declare `onNoRows: "throwError"` | `404`, `errorCode: ACTION_NO_ROWS_MATCHED`. The default `onNoRows: "ignore"` raises nothing. |
| Auth not provided | Pipeline login check | `401`. |
| Insufficient role | Pipeline basic auth check | `403`. |
| Any other action throwing | Anything | `500` (unless the thrown error carries `statusCode` or `status`; either is read). In a post-write stage of a create/update/delete (an `afterMain*Operation` stage, or `afterBuildOutput`): `200`/`201` + `actionFailures` instead. |

Built-in actions (the login and role checks, the instance check, a
`ValidationAction`, and so on) fail with an error that carries a status
code and a message, with the appropriate 4xx code.

Two property names can carry the status on a thrown error, and the
service reads both: the shared classifier (see
[One classifier, every transport](#one-classifier-every-transport)) takes
`err.statusCode ?? err.status` when it is an integer in 400..599 and 500
otherwise, and the MScript envelope reads `e.status` for the
4xx-passthrough decision. Typed error classes imported into the project
conventionally set `status`. Either property name works end-to-end.
Plain errors with neither property become 500. When you throw your own
error from MScript or an `arrowFunctionAction`, set `status` so both the
envelope and the classifier see it.

## The error body: RFC 9457 problem+json

The service catches every thrown error and builds an
RFC 9457 problem-details body, served with
`Content-Type: application/problem+json`:

```json
{
  "type":      "about:blank",
  "title":     "Conflict",
  "status":    409,
  "detail":    "Only draft orders can be published.",
  "errorCode": "ORDER_NOT_DRAFT",
  "requestId": "r_a1b2"
}
```

`errorCode` is a **guaranteed** extension member: every problem body
carries one, on every error surface. When the
thrown error declares no code of its own, the service stamps the
stable status default (`BAD_REQUEST`, `NOT_FOUND`, `INTERNAL_ERROR`,
...), so client code can always branch on `errorCode` without a
missing-key fallback. `requestId` is an optional extension member:
omitted when there is no correlation id, never `null`. An `errors`
member carries a structured payload when the thrown error has one.
Non-curated 5xx bodies use
`detail: "Internal server error"` and omit `errors`;
the raw error is logged under the same `requestId` so support can join
them. A 5xx error that named
itself with a SCREAMING_SNAKE `errorCode` (or `code`) keeps that code
while the `detail` stays generic and no `errors` member is sent.
The guard is `^[A-Z][A-Z0-9_]{0,99}$`; `errorCode` takes precedence over
`code` when valid. A plain error, an uncoded typed error, or an invalid
code stays `INTERNAL_ERROR`. A curated envelope (an error marked to
preserve its envelope and carrying its own string `errorCode`) keeps its
self-authored `detail` as well.
Transport metadata (HTTP status, elapsed time) lives in response headers
(`X-Request-Id`), never in the body.

For REST the response status is the error's HTTP status with the problem
body. For SSE the service emits an `error` event
(`{ message, code }`) before closing the stream. `code` is always
present: the error's `errorCode`, else its SCREAMING_SNAKE `code`, else the
status default (`NOT_FOUND`, `INTERNAL_ERROR`, ...), the same vocabulary as
a problem body's `errorCode`. Branch on `code`, not on `message`. Cron runs
log the error via the structured logger and continue to the next tick.

### One classifier, every transport

One classification decides the HTTP answer of an escaping error. The
business-API pipeline, the service-wide error handler (where a
hand-written route's error lands), the realtime hub REST router's error
boundary and the payment routes all answer from it, so the same error
answers the same status, `errorCode` and `detail` on every route. Each
transport keeps its own log line and its own `requestId` handling. The
classifier never throws, whatever was thrown (a hostile object answers
the generic `500`). Only a number or a numeric string is read as a
status. The rules, first match wins:

| Error | Status | `errorCode` | What crosses to the client |
|---|---|---|---|
| Database / search-cluster availability failure (pool saturated, statement timeout, refused connection, cluster outage) | `503` | `DB_POOL_SATURATED`, `DB_STATEMENT_TIMEOUT`, `ELASTIC_UNAVAILABLE`, ... | a fixed sentence |
| Database integrity or validation rejection (unique, foreign key, NOT NULL, CHECK, malformed or over-long value, model validation) | `409` / `422` / `400` | `CONFLICT` / `VALIDATION_ERROR` / `BAD_REQUEST` | a fixed sentence (a model validation names the sanitized attribute); never driver text |
| AI provider failure | `502`, or `500` when the provider refused a request the service built | `AGENT_PROVIDER_UNAVAILABLE` / `AGENT_PROVIDER_REQUEST_INVALID` | a fixed sentence; a request defect also carries the bounded `providerErrorType` / `providerErrorCode` |
| Typed payment provider refusal | `402` / `422` / the provider's `4xx` | `PAYMENT_DECLINED` / `PAYMENT_PROVIDER_REQUEST_REJECTED` | a fixed sentence plus the vendor's sanitized `providerErrorCode` (and a card `reason`); never the vendor sentence |
| Fiscal production-credential refusal | `503` | `FISCAL_PROVIDER_UNAVAILABLE` | its own sentence |
| A search client error (a parse error, a privilege refusal, a missing index) | `500` | `INTERNAL_ERROR` | the generic body: the cluster's status is its answer to the service's query, not to the caller |
| A remote service's `4xx` refusal (an inter-service hop) | the peer's `4xx` | the peer's SCREAMING_SNAKE `errorCode`, else the status default | `A remote service refused the request (<code>).`; never the peer URL or body |
| Any other `4xx` (an error carrying `statusCode` / `status`) | its own | its `errorCode`, else a SCREAMING_SNAKE `code`, else the framework message key, else the status default | its own message |
| Any other `5xx`, an error with no usable status, a status outside 400..599 | its own `5xx`, else `500` | `INTERNAL_ERROR`; an error keeps its own SCREAMING_SNAKE code | `Internal server error`; a curated error keeps its own sentence |

Three transport rules are kept on purpose:

- A foreign error that merely carries a `status` (an SDK or driver error)
  keeps the route's own curated `500`: that status is the vendor's answer to
  the service's request, and its message is vendor text.
- A webhook receiver (payment, invoice, fiscal, WhatsApp status) keeps its
  `5xx` for any failure, so the provider redelivers the event. A typed `4xx`
  would stop the redelivery.
- The payment routes keep their payment-typed answers (a marked provider
  failure, an unmarked provider `4xx`, a capability mismatch as `400`, an
  inter-service `4xx` relayed with the owning service's own `detail`);
  `503 SERVICE_UNAVAILABLE` and `504 GATEWAY_TIMEOUT` answers there stay
  `retryable: true`.

### Database values rejected by PostgreSQL

When PostgreSQL rejects a request value with SQLSTATE `22001` (a scalar
string or string/enum array element exceeds its column bound), `22003`
(numeric range overflow), or `22P03` (invalid binary representation), the
service answers `400 BAD_REQUEST`. The problem body's `detail` is a fixed
message asking the caller to shorten the value, use a supported numeric
range, or correct its representation. Driver text, SQL, submitted values
and the driver's structured `errors` payload stay out of the response.

These three codes join the malformed text/date codes `22P02`, `22007` and
`22008`; the mapping does not cover all of SQLSTATE class 22. Other codes
such as `22012` (division by zero) retain the sanitized
`500 INTERNAL_ERROR` answer. Classification uses SQLSTATE alone, so a raw
query that raises `22003` also receives the same fixed `400` answer; the
full error remains available in the server log. Database availability
failures continue to use the retryable `503` answers below.

#### A String that is too long is refused before the write

Most over-long String values never reach the database. The service checks
every `String` column against its `basicSettings.maxLength` (255 when
absent, the `VARCHAR(255)` the column has always been) before the write. A
value longer than that answers `422 VALIDATION_ERROR`, and the `detail`
names the field: `... Correct the offending field and retry. Offending
field(s): summary.` Only the sanitized attribute name crosses; the value
itself is never in the body. The answer is the same on the business-API
pipeline and on a hand-written route.

Characters are counted the way PostgreSQL counts them (Unicode code points;
trailing spaces PostgreSQL trims are not counted), and a `String[]` list is
checked per element. A write that bypasses the model, such as a raw SQL
query, still receives the `400 BAD_REQUEST` above when PostgreSQL raises
`22001`. That 400 does not name the field, because the driver error does
not carry one. See [Property types](../data-modeling/property-types.md#string).

| cause | status | errorCode | names the field |
|---|---|---|---|
| String value longer than `maxLength` (default 255), caught by the model check before the write | 422 | `VALIDATION_ERROR` | yes, the sanitized attribute name only |
| SQLSTATE `22001` from PostgreSQL (a raw query, or a service without the check) | 400 | `BAD_REQUEST` | no |

### `retryable`: transient or permanent, declared not guessed

A problem body carries `"retryable": true` when its **errorCode** names a
transient condition: the identical request can succeed later without the
caller changing anything. The member is **absent** otherwise, and absence
means "not known to be retryable", never "definitely not".

| errorCode | status | condition |
|---|---|---|
| `DB_POOL_SATURATED` | 503 | this service's own pool ran dry within its acquire timeout |
| `DB_CONNECTION_LIMIT_REACHED` | 503 | the database refused a new connection (`53300 too_many_connections`) |
| `DB_UNREACHABLE` | 503 | the database host refused, dropped or never answered |
| `DB_STATEMENT_TIMEOUT` | 503 | the server cancelled the statement |
| `SEARCH_TIMEOUT` | 503 | the search cluster cut the query short |
| `ELASTIC_UNAVAILABLE` | 503 | the search cluster could not serve the read: unreachable or refusing connections, a 5xx, backpressure (429), a cluster block, or a RED index (unassigned primary shards). A DataView whose index does not exist yet still answers an empty page, and a query the cluster refused (a 400 parse error) stays `500 INTERNAL_ERROR`. |
| `AGENT_PROVIDER_REQUEST_INVALID` | 500 | The AI provider rejected a request the service built. Agent REST routes, including pre-stream problem bodies, and a business API whose AI call fails this way carry optional bounded `providerErrorType` / `providerErrorCode` identifiers, matching the SSE error frame. Vendor prose and `providerStatus` are excluded. |
| `AGENT_PROVIDER_UNAVAILABLE` / `PAYMENT_PROVIDER_UNAVAILABLE` | 502 | an upstream we depend on failed; AI-provider availability failures carry no vendor identifier keys |
| `SERVICE_UNAVAILABLE` / `GATEWAY_TIMEOUT` / `TOO_MANY_REQUESTS` | 503/504/429 | the generic availability answers |
| `M2M_VERIFICATION_UNAVAILABLE` | 503 | an M2M hop's token could not be verified yet: the issuer's key set was unreachable. The body's `cause` member names the key-set host and the failure class, for example `jwks auth.example.com: timeout` (see [Machine-to-machine communication](../system-services/m2m-communication.md)) |
| `AUTH_SIGNING_KEY_MISSING` | 503 | a login or token mint reached the service without its signing identity. The mint runs before any write, so the identical login succeeds once the identity is injected (see [Machine-to-machine communication](../system-services/m2m-communication.md)). |

A defect stays `500 INTERNAL_ERROR` with **no** marker. That split is the
point: if an exhausted shared database answered a bare
`500 INTERNAL_ERROR`, byte-identical to a crashed handler, callers
would resort to `res.status === 500 && /INTERNAL_ERROR/.test(res.text)` as a
"probably transient" test, which retries real defects until they look
flaky and files infrastructure stalls as bugs. **Never write that
heuristic: read `retryable`.**

### `postResponse`: what an aborted request did NOT do

`afterSendResponse`, the api event and `afterApiEvent` are withheld
whenever the response is 4xx/5xx (see
[the post-response phase](overview.md#the-post-response-phase-is-success-only)).
On such a response the error body says so:

```json
{
  "status": 503,
  "errorCode": "DB_CONNECTION_LIMIT_REACHED",
  "retryable": true,
  "postResponse": { "ran": false, "reason": "workflowAborted",
                    "suppressedActionCount": 2, "eventPublished": false }
}
```

The member appears only when there was something to withhold (declared
actions, or an api event). The withheld action NAMES stay in the
`PostResponseSuppressedOnAbort` log line, joined to the body by
`requestId`: they are designer-internal identifiers and a refusal body is
read by whoever was refused.

## After the write commits: `actionFailures`

The actions in `afterMainCreateOperation`, `afterMainUpdateOperation` and
`afterMainDeleteOperation` (and, of a create / update / delete, the
output stage `afterBuildOutput`) run AFTER the main row was
written. A throw there does not turn the request into a `500`: answering
an error for a request that in fact succeeded would make the caller
retry and run again whatever had already run (a `$inc`, a mail, an
event). The write stands and the response is the `200` / `201` it
earned, carrying what is missing:

```json
{ "_type": "profile", "id": "...",
  "actionFailures": [ { "action": "notifyModerators", "error": "moderation service 503" } ] }
```

What reaches `actionFailures`, per action, in a post-write stage:

| What happened | Reported as | Stage |
|---|---|---|
| threw, `onActionError: throwError` (default) | `{ action, error, errorCode? }` | stops; every later action in the stage is reported `ACTION_NOT_RUN` |
| threw, `onActionError: completeApi` | `{ action, error, errorCode? }` (and `this.<name>Error` as before) | continues |
| `PublishEventAction` the broker did not take | `EVENT_PUBLISH_DROPPED`, `outbox: "queued"`, `retryable: true` | continues (the action still returns `false`) |
| `PaymentAction` the payment provider refused | `PAYMENT_PROVIDER_REQUEST_REJECTED` + `providerErrorCode` (+ `reason` for a card-validation refusal), as the payment routes answer it; a card decline keeps `PAYMENT_DECLINED` and adds the same members | as its `onActionError` says |

The same provider refusal BEFORE the write (a `PaymentAction` in a `get` api,
or in a stage that runs before the main write) is the request's error, not an
entry: `422` (a provider `4xx` keeps its own status) problem+json with
`errorCode: "PAYMENT_PROVIDER_REQUEST_REJECTED"`, the fixed `detail` "The
payment provider rejected the request", and the same `providerErrorCode` /
`reason` members. A card decline answers the start route's
`402 PAYMENT_DECLINED` with the same members. Every other error keeps
its status and body.

**A refusal is not an action failure.** The actions whose purpose is to refuse
(`ValidationAction` with its declared `errorStatus` / `errorMessage`,
`PermissionCheckAction`, `ObjectPermissionCheckAction`, `MembershipCheckAction`,
`CartValidationAction`, `CouponValidationAction`, `VerifyWebhookAction`)
answer exactly as on any other stage when they refuse in a post-write stage:
with `throwError` the request answers the refusal's own status (never
`2xx + actionFailures`), and with `completeApi` the refusal is swallowed and
not reported. A workflow that compensates its own writes and then refuses
therefore still answers its refusal. The partial-success answer is for
failures of EFFECTFUL actions (writes, calls, publishes, reads).

**A session that was not written or retired is not a partial success.** The
authentication service's own session operations are part of its security
contract, so their post-write failure also propagates with its own status
(503 when the session store is unavailable) and never answers
`2xx + actionFailures`: logging out, deleting a user session and validating
an API key. A user who logged out must not stay authenticated behind a 200,
and an api-key exchange must not answer 201 with no usable session. The
carve-out is these built-in operations only, not their action kinds: a
`FunctionCallAction` or `WriteToRedisAction` in your own api (in any
service, including one hosted in the authentication module) keeps the
partial-success answer above.

**The output stage (`afterBuildOutput`) of a write** takes the same answer:
a throw there is reported as `{ action, error, errorCode? }`,
every later action of that stage as `ACTION_NOT_RUN`, a `completeApi`
failure is reported and the stage runs on, and the body the output build
produced is answered with the write's own `200` / `201`, including the
`writeToResponse` values of the actions that ran before the throw. A
refusal there still answers its own status. The output stage of the
authentication service's session-contract apis (logout, deleting a user
session, validating an API key) is not bounded at all: it assembles what the
session contract hands back (the api-key exchange's token, the logout cookie
clear), so any failure there answers its own error, never a 2xx with
nothing usable. Two differences from the
afterMain stages: its actions are NOT retry-gated (they build the answer
being returned, so a retry runs them all again; what a failure there does
record is the completion of the afterMain actions, so a retry skips
those), and a `PublishEventAction` the broker drops there is still the
silent `false` it always was (the outbox covers the afterMain stages
only). The output stage of a `get` / `list` is unchanged: a throw there
is the request's error.

**A nested in-process call reports through its caller.** An
action that calls another api of the same service in-process
(`await API.<apiName>(params)`) gets that api's resource back even when the
inner write succeeded only in part. The inner `actionFailures` are relayed
into the CALLING request's `actionFailures`, each named
`<apiName>.<action>` (e.g. `notifyStaff.pushNotice`), so the caller's
response carries them, on any crudType, since the inner write is real.
What a retry of the outer request does depends on the inner api's kind:

- inner `update` / `delete` (the main operation converges when re-run): in
  a post-write stage the calling action counts as failed, not completed,
  so a retry of the outer request runs it again. The repeated
  `API.<apiName>(params)` call is recognised as the same inner attempt, so
  the inner api re-runs only what failed. An inner `delete` converges only
  through its stored main write (the row is gone; the re-sent call replays
  it): when none was stored (the outer request has no identity, or
  the store could not write it) its entries are relayed with
  `retryable: false` and the calling action counts as completed, like an
  inner `create`.
- any other inner kind, i.e. an inner `create`: a re-run would make a
  second row and repeat its completed actions, so the entries are relayed
  with `retryable: false` and the calling action counts as completed. A
  retry of the outer request does NOT call the create again; complete what
  is missing by hand.

The inner attempt is scoped to the calling request: two different outer
requests making the same `API.<apiName>(params)` call are two inner
attempts, and only a retry of the same outer request is the same one. An
`API.*` call made outside any
request (a library function, a cron script) relays nowhere; its resolved
value still carries the member. An inner call that failed outright
(`>= 400`) still throws into the calling action, as before.

**An event-consumed (Kafka) write that applied in part** is acknowledged
(the offset commits, the row stands); on an api with
`kafkaSettings.deadLetterEnabled` it is ALSO published once to the
dead-letter topic with its `actionFailures`, for a redrive that re-runs
only the failed actions. See
[Kafka controllers, Outcomes](../business-apis/kafka-controllers.md#outcomes-applied-completed-miss-rejected-dead-lettered).

**A streamed write (SSE `responseMode: "stream"`)** carries the member on
its final `done` frame (`{ totalChunks, totalRows, elapsedMs,
actionFailures }`), under the same rule: present only when something is
missing.

The `error` text is the one the error path would have shown for the same
failure (an unexpected 5xx reads `"Internal server error"`); a declared
`errorCode` is kept, and the raw message is logged as `PostMainActionFailed`
under the request id.

**A rollback un-commits.** An action that takes the main row back (the
subscribe rollback deletes the row it created when the provider
refuses) tells the service the write was rolled back after the undo
succeeded. The boundary then treats the write as uncommitted and the
rethrown error answers normally (502 for the subscribe refusal), and any
event this request had already queued about the row is marked `cancelled`:
never delivered, kept for audit. If the undo itself fails the row still
stands, and the 2xx + `actionFailures` answer is the true one.

A dropped event is stored durably with the event itself (one record per
logical event, identified by its CONTENT: the topic and the whole envelope
except its per-try `id`, `time` and `requestId`, with Dates, binary values
and maps compared by value). A re-send of the same request that drops it
again replaces that record and keeps the first event id, and one that
delivers it closes the queued copy, so a consumer sees each event once
however the broker flaps; two identical events in one loop stay two.
Two cases are NOT recognised as the same event, and such an event may be
delivered once per try, under a different id each time: a message whose
data carries a per-try value (a fresh timestamp, a counter), and a retry
sent from ANOTHER session of the same user (the sender's session is part
of the envelope's `actor`, so it counts as content). Either is a duplicate,
never a loss. A background sweeper in the service re-publishes the event
with backoff (30 s doubling, capped at an hour; parked `dead` after 12
attempts). Other failures are reported and left: their input was built
from the request's context, so nothing can replay them out of band.

**Retry safety.** Every post-write action is gated on per-row, per-attempt
completion: when a request fails part-way, the actions that DID complete
are recorded against the row and the request's identity (its caller + input:
the REST params/query/body, or the `inputData` of a gRPC, cron or internal
`API.<name>()` call, plus its `api-idempotency-key` when one was sent: the
same key with a different body is a different request). An identical
re-send within an hour runs only what did not complete; a different request
on the same row runs everything. The main write is gated the same way: a
request that answered `actionFailures` and carries an identity (a logged-in
caller, or an `api-idempotency-key`) records its main write's completion
with the stored row (reserved action `$mainWrite`, keyed by the attempt),
and its identical re-send replays that row instead of writing again: a
create is never a second record, an update's dataClause is applied once. A
re-sent `delete` (or an `update` that moved its own row out of its where
clause) finds no row, reads that record and replays it instead of answering
`404`: the owed actions run, the ownership check runs against the stored
row. A request with no identity (anonymous without a key, a cron tick, an
internal call outside a request) never replays a main write: it would
share its attempt with every other such request. A clean success records
nothing; a re-send of it writes again, which is what `api-idempotency-key`
with stored replay is for. The authentication service's session-issuing
apis (`login`, `relogin`, `validateApiKey`) never record or replay a main
write: a keyed re-send after a partial success logs in again, with its own
session, its own `userSession` row and its own stored session, so the
session the answer carries is the one the row and the session store hold,
and no session id or token is ever kept in the record.

A post-MAIN failure on a `get` / `list` is unchanged (an error: nothing was
written), and a throw before the write still aborts with its own status.
The response contract is in [Response shape](../business-apis/response-shape.md#partial-success-actionfailures).
How a service stores the completion records is described in
[the compiler specification](../../compiler/index.md).

### Framework message keys (`errMsg_*`)

Framework-authored refusals raise a message KEY rather than a sentence
(for example `errMsg_UserShouldBeTheOwnerOfTheObject` on a 403). The
service resolves it, so the body a client receives is:

```json
{
  "status": 403,
  "detail": "You can only act on records you own.",
  "errorCode": "errMsg_UserShouldBeTheOwnerOfTheObject"
}
```

- The **key becomes `errorCode`**, which is where a stable machine value
  belongs; branch on it, never on `detail`. A raiser that stamps its own
  `errorCode` keeps it.
- **`detail` is prose**, resolved in this order: a catalog registered for
  a language in the request's `Accept-Language`, then the built-in `en`
  catalog, then a deterministic humanization of the key itself. The last
  layer means no key is ever answered as a raw identifier, including one
  added after the catalog was written.
- Translations are registered per language; fallback is per KEY, not per
  request: a language that covers half the keys serves English for the
  rest.
- Resolution fires only when the **whole** `detail` is one `errMsg_*`
  token. A message that interpolates a value
  (`errMsg_...Settings: orders.read`) is left verbatim; move the value
  into `errors` if you want the prefix resolved.
- `errMsg_UserShouldBeTheOnwerOfTheObject` (the long-lived "Onwer" typo)
  is an ALIAS: it resolves to the corrected key and the same message, so
  either spelling yields one `errorCode`.

## HTTP status mapping

The `ErrorStatus` enum of the schema is the canonical set of values for
the status field on `ValidationAction`. The named classes below are the
author-facing nomenclature for the same codes:

| Status | Class name | When |
|---|---|---|
| `400` | `BadRequestError` | Invalid / malformed / missing required input. |
| `401` | `NotAuthenticatedError` | No valid session (pipeline auth gate). |
| `403` | `ForbiddenError` | Authenticated but role / ownership / permission insufficient. |
| `404` | `NotFoundError` | Required record missing (`fetchObjectActions.isRequired`, `update` / `delete` instance not found). |
| `409` | `ConflictError` | Uniqueness violation, state conflict (the canonical "already exists" status; prefer over 403 when the issue is conflict, not auth). |
| `422` | `UnprocessableEntityError` | Well-formed input, valid auth, but a business-rule violation blocks the operation. |
| `500` | `HttpSystemError` | Anything else: internal failure, unexpected exception. |

What makes a thrown error propagate verbatim is the `status` (or
`statusCode`) property it carries, not its class identity: a plain error
built as `Object.assign(new Error('...'), { status: 4xx })` behaves the
same as a typed one.

A held or rejected write on an object with `objectModeration` is not an
error: it answers `202` with a `moderation` member (`id`, `status`,
`message`) and writes nothing in `staged` mode. The moderation review apis
add `403` `MODERATION_SELF_DECISION` (a reviewer deciding their own
submission) and `409` (another reviewer is deciding the row). See
[Object content moderation](../capabilities/object-moderation.md#what-the-caller-sees).

The other decision patterns answer with these statuses
([The decision layer](../capabilities/decision-layer.md#runtime-errors-and-log-events)):
a [`DecisionAction`](../../spec/DecisionAction.md) throws
`DecisionNotConfident` (422) under `onLowConfidence: "reject"` and
`DecisionUnavailable` (422) under `checkType: "liveCheck"` when a question
went unanswered; under its default `onProviderError: "failClosed"` the
provider's own error propagates and the request fails. A list narrowed by a
fuzzy domain filter fails with `FUZZY_DOMAIN_PROVIDER_FAILED` (503) when the
provider is down. A `decisionSource` never fails the write: an outage
leaves the value for a background backfill.

## Absence: 404 never 500, and where it is decided

A well-formed id that addresses no row answers **404 on every crud family**,
and the verdict is reached **before the first line of author-defined
after-fetch code runs**. The pipeline order is:

```
instance fetch              step 7  - resolve the row by the built where-clause
missing-instance guard      step 7b - no row + onNotFound:"throw404" => 404, here
afterFetchInstance          step 7c - your declared workflow stage
instance check              step 8  - ownership / permission on the row FOUND
```

The guard runs before the declared stage, so existence is
settled first: an action wired into `afterFetchInstance` that reads a column
off the row (`this.<objectName>.eventId`, a membership lookup, an MScript
condition) only ever sees a row that exists, and a missing id answers the
same `404` the get family answers.

Two consequences worth designing around:

- **An `afterFetchInstance` stage never sees a null instance.** If you want a
  miss to be a success (an idempotent "make sure this is gone"), declare
  `onNotFound: "complete"`: that branches at the prefetch boundary, answers
  2xx, and runs `afterMissingInstance` instead.
- **Fetch happens before the gate, so absence outranks denial** on a
  single-item route: an id nobody can address is a 404, not a 403. The reverse
  order would make the 403/404 split an existence oracle for ids the caller
  may not read.

### An absent parent on a LIST is an empty envelope

A list describes a set, and the empty set is a truthful answer:
`GET /checkins?eventId=<an id no row carries>` answers
`200 {"data": [], "paging": {...}}`, **never** 404. This is one policy across
every list route without a parent-ownership gate: sibling APIs answering 404
and `200 {"data":[]}` for the same shape is the defect, not a per-api choice.
The reasoning is the same as above: a 404 keyed on a filter value tells the
caller whether that parent id exists, and a client paging a list cannot
distinguish "no rows" from "wrong route".

The one list that does NOT answer an empty envelope for an absent parent is
a list that declares `parentOwnershipChecks`. That gate runs before
the query: it fetches the parent the request names, and a parent that does
not exist is not one the caller owns, so the request is denied
`403 errMsg_ParentOwnershipParentNotFound`. That is the same status a parent
owned by someone else gets, so the answer still says nothing about whether
the id exists. On a multi-tenant project the gate reads a tenant-scoped
parent by its id AND the caller's own tenant (the parent's tenant column, or
its `id` when the parent is the tenant object itself), so a parent that exists
only in another tenant answers exactly like one that does not exist: the same
`403 errMsg_ParentOwnershipParentNotFound`. `absoluteRoles` skip only
the owner comparison, after that scoped lookup succeeded; they never reach a
parent outside the caller's tenant. Declare the gate when the list must be
refused for a parent the caller does not own; without it, an absent parent is
simply the empty set.

## Throwing from an action

Built-in actions throw their own errors. The most explicit example is
[`ValidationAction`](../../spec/ValidationAction.md):

```json
{
  "name":             "checkDraft",
  "description":      "Order must be in draft state.",
  "validationScript": { "js": "this.instance.status === 'draft'" },
  "shouldBeTrue":     true,
  "checkType":        "liveCheck",
  "errorMessage":     "Only draft orders can be published.",
  "errorStatus":      "409",
  "writeToResponse":  false
}
```

`checkType: "liveCheck"` throws an error with `errorStatus` and
`errorMessage` when `validationScript` doesn't match `shouldBeTrue`. Switch
to `checkType: "storedCheck"` to store the boolean on the context
without throwing, which is useful when later actions need to branch on the
result.

For ad-hoc errors from MScript, throw an error carrying `status` from
an `arrowFunctionActions` entry. `status` is the property the
MScript envelope checks for the 4xx-passthrough decision, and the
classifier reads either `statusCode` or `status`:

```json
{
  "name":           "guardAmount",
  "parameterNames": [],
  "functionBody":   "{ if (this.amount > 10000) throw Object.assign(new Error('Too large'), { status: 422 }); return true; }",
  "writeToResponse": false
}
```

A thrown error whose `status` (or `statusCode`) is set is honoured by
the classifier; anything else becomes `500`. If you also need the
error to bubble verbatim through a wrapping MScript expression, use
`status`: `statusCode` alone is not seen by the envelope's `e.status`
check.

## `onActionError`: catch and continue

Set `onActionError: "completeApi"` on an action's record to catch its
thrown error into the context instead of aborting the workflow. In effect:

```text
try:   this.<contextPropertyName> = run action
catch: this.<actionName>Error = the error     // pipeline continues
```

The action's result property is not set (the action did not
complete); a parallel field `this.<actionName>Error` carries the
error. Downstream actions can read it:

```json
{
  "name":           "branchOnFailure",
  "parameterNames": [],
  "functionBody":   "{ return this.charge ? 'paid' : (this.chargeError ? 'failed' : 'unknown'); }",
  "writeToResponse": false
}
```

In a post-write stage the caught error is ALSO reported to the
caller in `actionFailures`: the api completes, and the response says that
the action failed.

This is the only catch mechanism in the workflow. There is no
`onError: { mode: 'retry' }`, no `branchTo`, no `finally`. Build
retry logic explicitly in MScript or with a `LoopAction` that drives
its own retry condition.

## Validation vs. internal failure

Validation, permission, and membership failures are *user errors*:
the service turns them into `4xx` responses with the action's
`errorMessage`. They are not the same as internal failures; do not
wrap them in `completeApi` just to log differently. Wrapping a
`PermissionCheckAction` in `completeApi` lets the API continue
without the permission, which is almost always wrong.

## Logging vs. responding

Every error path logs through the service's structured logger. The REST
controller emits `ErrorInRestRequest` with `requestId`, `function`, and
`err.message`, plus the underlying error for stack traces. The HTTP
response carries only the problem body's `detail` (the message), not the
stack.

### Finding a request by its `requestId`

Every response carries its `requestId` (the `X-Request-Id` header, and
the `requestId` member of a problem body). The same id is on the
service's log lines for that request:

| Log tag | Carries |
|---------|---------|
| `RestRequestReceived` | `requestId`, `function`, `method`, the route; on a Business API route also `path`, `ip`, `bodyBytes` and the `traceparent` trace id |
| `RestRequestResponded` | `requestId`, `function`, `statusCode`; on a Business API route also `bodyBytes` |
| `ErrorInRestRequest` | `requestId`, `function`, `err.message` |

The framework routes the service mounts beside the Business APIs
(content, payment, invoice and fiscal, buckets, video rooms, job streams,
waiting rooms, agents, realtime hub management, SSE subscription,
enterprise projections and the admin surfaces) log the same request and
response lines, and add the router name and `durationMs`. Their request
lines carry the matched route PATTERN
(`/v1/payment-methods/delete/:paymentMethodId`), never the request
body, headers, cookies, query string or path values: these routes
carry card data, provider card tokens, webhook payloads and
signatures, and preview and return tokens. The Business API lines carry
the size of the body, not the body, by default; with body logging
enabled they log the body, query, headers and cookies with their
credentials redacted. The framework route lines never log them.

Production-sensitive details (database error codes, raw stack
frames) stay in the log. If you need to expose them, attach a
sanitised version in an `arrowFunctionActions` entry that runs in
the failure path under `completeApi`.

## Custom error responses

To shape the failure response, use `completeApi` on the failing
action and an `addToResponseActions` entry at `afterBuildOutput`
that inspects `this.<actionName>Error`:

```json
"actions": {
  "paymentActions": [
    {
      "name":           "charge",
      "onActionError":  "completeApi",
      "...":            "payment fields"
    }
  ],
  "addToResponseActions": [
    {
      "name":             "errorBody",
      "condition":        { "js": "this.chargeError" },
      "context":          [
        { "contextName": "outcome", "contextValue": { "js": "'payment_failed'" } },
        { "contextName": "reason",  "contextValue": { "js": "this.chargeError.message" } }
      ],
      "writeToResponse":  false
    }
  ]
}
```

The default envelope status stays `200` in this path: the workflow
completed without throwing. To return a non-200 status from a
captured error, populate the response status field explicitly via
`addToResponseActions`, or throw from a downstream
`arrowFunctionActions` that gates on the `Error` field.

## Errors inside parallel and loops

- A child of `parallelActions` throwing makes the whole parallel
  action fail. `completeApi` on the parent absorbs the
  failure into `this.<parallelActionName>Error`. A child that declares
  `onActionError: completeApi` itself is captured on its own: that
  branch resolves `null`, its error lands on `this.<childName>Error`,
  and the other branches' results are assigned as usual.
- An inner action of a `loopActions` throwing aborts the iteration and
  the loop exits immediately (a loop runs its items one at a time,
  also with `isParallel: true`, so later items do not run). The loop
  action's `onActionError` decides whether the workflow aborts or
  stores the error on `this.<loopActionName>Error`.
- To tolerate per-item failures, set `completeApi` on the inner
  action: the error lands on
  `this.<innerActionName>Error` for that iteration and the loop
  continues.

For the full surface see [Parallel and loops](parallel-and-loops.md)
and [Race conditions](race-conditions.md).

## See also

- [Overview](overview.md),
  [Parallel and loops](parallel-and-loops.md),
  [Race conditions](race-conditions.md),
  [Workflow context](workflow-context.md)
- Specification: [`BusinessApiAction`](../../spec/BusinessApiAction.md),
  [`ValidationAction`](../../spec/ValidationAction.md),
  [`PermissionCheckAction`](../../spec/PermissionCheckAction.md),
  [`ObjectPermissionCheckAction`](../../spec/ObjectPermissionCheckAction.md),
  [`MembershipCheckAction`](../../spec/MembershipCheckAction.md)
- Best practices: [API design](../best-practices/api-design.md)
