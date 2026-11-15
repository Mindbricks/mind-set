---
title: API design
---

# API design

Conventions that make an API set feel like one product, not
fifty bolt-ons.

## Prefer the standard CRUD shape

Every API is declared by hand in `businessLogic[]`; nothing is
auto-generated. When an operation is a plain create / get / list /
update / delete on a single object, declare it with the matching
`crudType` and a default verb-noun `name` (`createOrder`, `getOrder`,
`listOrders`, …) — the lifecycle pipeline does the fetch,
data-clause, persist, and event work, so you write almost nothing.
Layer your own validation / audit / enrichment on with `actions` wired
into the workflow milestones.

Reach for a non-default verb name (`publishOrder`, `cancelSubscription`)
only when the operation genuinely isn't a CRUD on the object — it's the
same `BusinessApi` pattern with the same pipeline, just a different
`apiOptions.name`. There is no "going custom"; both are author-declared
APIs that pick the closest `crudType`.

```json
{
  "basics": { "apiOptions": { "name": "createOrder", "crudType": "create", "dataObjectName": "Order" } },
  "actions": {
    "validationActions": [
      {
        "name":             "stockCheck",
        "description":      "Block when stock would go negative",
        "validationScript": { "js": "loadProduct.stock >= input.quantity" },
        "errorMessage":     "Insufficient stock.",
        "errorStatus":      422
      }
    ]
  }
}
```

See [BusinessApi overview](../business-apis/overview.md). `name` is the
canonical `BusinessApiAction.name` field; every action partition
(`validationActions`, `fetchObjectActions`, …) uses it.
`validationScript` is the MScript predicate (boolean expression
evaluated against the workflow context). `errorStatus` chooses the
HTTP code on failure — `422` for semantic business-rule violations,
`409` for uniqueness conflicts, `400` for invalid input.

## API names are verbs

Default-shape APIs follow verb-noun (`createOrder`, `listOrders`);
non-standard operations use an imperative verb-noun all the same:

- ✓ `publishOrder`, `inviteMember`, `regenerateApiKey`, `mergeAccounts`
- ✗ `OrderPublish`, `Member-Invitation`, `do_apiKey_regenerate`

Imperative verb, camelCase, no underscores.

## One operation per API

If `submitOrder` does payment, ships, and emails — split. Three APIs
chained via Kafka events is clearer, easier to retry, easier to test.

Anti-pattern: the "god API" that takes a `mode` parameter and switches
behaviour. Make each mode its own API.

## Symmetric inputs and outputs

A `getX` should return what `createX` accepts, plus generated fields.
A `listX` should return an item shape compatible with `getX`. This
predictability is what makes a client SDK feel coherent.

## Status fields, not status booleans

See [Data modeling tips](data-modeling-tips.md) — same rule for APIs:
the response carries `status: "pending"|"paid"`, not three booleans.

## Public APIs vs internal

For routes called by the frontend, OK to be relatively chatty. For
internal/MCP routes, design for *AI agents* — single-purpose, clear
descriptions, tight input schemas.

## Idempotency for unsafe operations

The generated service DOES auto-replay responses, on any api that opts in.
Set `apiOptions.useIdempotencyKey: true` on the BusinessApi and the
caller may then send any string as `api-idempotency-key` (REST: header
> query > body, header wins; gRPC/MCP: in the request envelope). The
header name is `api-idempotency-key`, not `Idempotency-Key`.

What the service stores and replays:

- **What is stored.** Only a SUCCESSFUL response: the 2xx
  `statusCode`, the serialized response envelope, and a `requestHash`
  (canonical sha256 over the caller-authored business parameters).
  Non-2xx responses are never stored, so a failed call stays retryable
  under the same key.
- **Where.** One service-owned Elasticsearch index per project. It is
  not a declared `elasticLogs[]` entry and `idempotency` is a reserved
  index base name.
- **Keyed by what scope.** A sha256 over index base + service name +
  api name + `userId` + `tenantId` + the key string. The same key sent
  by another user, another tenant, or to a different api resolves to a
  different slot, so a stored response can never replay across callers
  or across apis.
- **For how long.** 24 hours. Reads filter `@timestamp >= now-24h`, and
  an ILM delete runs behind that on rollover cadence.
- **What is replayed.** The stored `{statusCode, body}` is returned
  without re-executing the api, carrying the response header
  `idempotency-key-cache: true`. Reusing the key with a DIFFERENT
  payload is refused with `409 IDEMPOTENCY_KEY_INCONSISTENCY`.
- **What it is NOT.** Replay is an optimization, never a gate. Every
  read and write of the store degrades to a no-op when Elasticsearch is
  down, slow to initialise, or the index is missing, and there is no
  distributed lock, so two concurrent calls with the same key may both
  execute.

Because replay is best-effort and time-boxed, still build convergence
into the data model for any write that must never double-apply:

- Make `create` writes converge on a unique index. Add a
  `requestId` property fed from the client, mark its index unique
  with `onDuplicate: "stopOperation"`. A retry returns the existing
  row.
- Make `update` / `delete` writes filter their `whereClause` by the
  expected from-state. A redelivered state transition matches no
  rows when the work is already done.

Two patterns, same outcome — retried requests are observed but cause
no duplicate side-effects.

## Pagination

`PaginationOptions` lives at `query.paginationOptions` on
`list`-crudType APIs:

```json
{
  "query": {
    "paginationOptions": {
      "defaultPageRowCount":  20
    }
  }
}
```

Every list is paged. `paginationEnabled` is retired and ignored; the
one opt-out is `unpaged: true`, which answers the whole set (up to a
10000-row ceiling) and belongs on internal, kafka and cron lists rather
than on a public REST route — see
[list-api](../business-apis/list-api.md#unpaged-the-whole-set-in-one-response).

For lists that grow unbounded, sort by a monotonically-increasing
column (`id`, `createdAt`) and accept a cursor parameter; the
`whereClause` filters `id > @cursor`. Offset pagination on large
datasets becomes slow and unstable as rows shift; cursors stay
correct.

## Versioning

The language has no built-in API version selector. Version at the
**breaking-change boundary** with API naming:

- Backwards-compatible additions need no version.
- A field type change or rename gets a new field; the old field is
  marked `allowUpdate: false` and deprecated in
  `apiOptions.apiDescription`.
- A behavioural change warrants a new BusinessApi
  (`createOrderV2`) that lives alongside the original until callers
  migrate.

## Error responses

`ValidationAction` returns an `errorMessage` (human-readable) on
failure plus an `errorStatus` HTTP code chosen by the author. There
is no separate machine-readable code field on the action — pick the
HTTP status to convey category, and prefix the message itself when
clients need to switch on something stable:

```json
{
  "name":             "stockCheck",
  "description":      "Block when stock would go negative",
  "validationScript": { "js": "loadProduct.stock >= input.quantity" },
  "errorMessage":     "[STOCK_INSUFFICIENT] Only {{loadProduct.stock}} units left in stock.",
  "errorStatus":      422
}
```

Group bracketed prefixes by feature (`[STOCK_*]`, `[PAY_*]`,
`[AUTH_*]`) so clients can switch on a token. Pair with `errorStatus`:
`422` for semantic / business-rule violations, `409` for uniqueness
conflicts, `404` for missing resources, `403` for explicit forbid
(though absolute roles bypass the 401/403 gates), `400` for
malformed input. Keep prefixes and status codes stable across
versions — clients localize the message, but they branch on the rest.

## See also

- [BusinessApi overview](../business-apis/overview.md)
- [List API](../business-apis/list-api.md)
- Best practices: [Action composition](action-composition.md), [Anti-patterns](anti-patterns.md)
